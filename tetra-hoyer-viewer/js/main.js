import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildMachine, DIM } from './model.js';
import { SPECS, SOURCES, HOTSPOTS } from './data.js';
import { renderDrawings, exportSvg } from './drawings.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const safe = (fn) => { try { return fn(); } catch { return null; } };

const stage = $('#stage');
const canvas = $('#gl');
const labels = $('#labels');
const panel = $('#panel');
const isMobile = () => matchMedia('(max-width: 860px)').matches;

let viewer = null;

/* =============================== theme =============================== */
const root = document.documentElement;
function setTheme(t, persist = true) {
  root.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === 'light' ? '#ffffff' : '#0b1220';
  if (persist) safe(() => localStorage.setItem('sf1200-theme', t));
  if (viewer) viewer.onTheme();
}
setTheme(safe(() => localStorage.getItem('sf1200-theme')) || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), false);
$('#themeBtn').addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));

/* =============================== static UI =============================== */
function buildStaticUI() {
  $('#specs').innerHTML = SPECS.map(
    (g) => `<div class="spec-group"><h3>${g.group}</h3><dl style="margin:0">${g.rows
      .map(([k, v, s]) => `<div class="spec-row"><dt>${k}</dt><dd>${v}</dd><span class="src ${s}">${s}</span></div>`)
      .join('')}</dl></div>`
  ).join('');
  $('#sources').innerHTML = SOURCES.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`).join('');
  $('#drawings').innerHTML = renderDrawings();
  $('#drawings').addEventListener('click', (e) => {
    const b = e.target.closest('.dl');
    if (!b) return;
    const blob = new Blob([exportSvg(b.dataset.target)], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `frigus-sf1200-n1-${b.dataset.name}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('#partList').innerHTML = HOTSPOTS.map(
    (h, i) => `<li><button data-id="${h.id}"><span class="n">${i + 1}</span><span>${h.title}</span></button></li>`
  ).join('');
}

/* ---- tabs ---- */
const tabs = $$('.tabs [role=tab]');
function selectTab(tab, { focus = false } = {}) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    const pane = document.getElementById(t.getAttribute('aria-controls'));
    pane.hidden = !on;
    pane.classList.toggle('active', on);
  }
  if (focus) tab.focus();
  $('.tabpanes').scrollTop = 0;
}
tabs.forEach((t, i) => {
  t.tabIndex = i === 0 ? 0 : -1;
  t.addEventListener('click', () => {
    selectTab(t);
    if (isMobile()) setSheet(true);
  });
  t.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], { focus: true }); }
  });
});

/* ---- mobile bottom sheet ---- */
const handle = $('#sheetHandle');
let sheetAnimUntil = 0;
function setSheet(open) {
  panel.classList.toggle('open', open);
  handle.setAttribute('aria-expanded', open);
  sheetAnimUntil = performance.now() + 450;
  if (viewer) viewer.invalidate();
}
handle.addEventListener('click', () => setSheet(!panel.classList.contains('open')));
{
  let y0 = null;
  handle.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
  addEventListener('pointerup', (e) => {
    if (y0 === null) return;
    const dy = e.clientY - y0;
    y0 = null;
    if (dy < -28) setSheet(true);
    else if (dy > 28) setSheet(false);
  });
}

buildStaticUI();

/* =============================== 3D viewer =============================== */

function createViewer() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('WebGL unavailable', err);
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 80);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.9;
  controls.maxDistance = 11;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.autoRotateSpeed = 1.2;
  controls.screenSpacePanning = true;

  // lights (env map does most of the work for stainless; these add form)
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0xbcd8ff, 1.4);
  rim.position.set(-4, 3, -3);
  const back = new THREE.DirectionalLight(0xffffff, 1.5);
  back.position.set(1.5, 3.5, -5);
  scene.add(key, rim, back, new THREE.HemisphereLight(0xffffff, 0x556078, 0.8));

  /* machine */
  const m = buildMachine();
  scene.add(m.root);

  /* floor: fading grid + contact shadow */
  const floorGroup = new THREE.Group();
  scene.add(floorGroup);
  let gridMesh;
  function makeGrid() {
    const light = root.dataset.theme === 'light';
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    g.strokeStyle = light ? 'rgba(20,60,120,0.35)' : 'rgba(150,185,235,0.35)';
    const step = 1024 / 14; // 1 m cells over 14 m
    for (let i = 0; i <= 14; i++) {
      g.lineWidth = i === 7 ? 2.5 : 1.2;
      g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, 1024); g.stroke();
      g.beginPath(); g.moveTo(0, i * step); g.lineTo(1024, i * step); g.stroke();
    }
    g.globalCompositeOperation = 'destination-in';
    const grad = g.createRadialGradient(512, 512, 40, 512, 512, 512);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 1024);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (gridMesh) { gridMesh.material.map.dispose(); gridMesh.material.map = t; gridMesh.material.needsUpdate = true; return; }
    gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    gridMesh.rotation.x = -Math.PI / 2;
    gridMesh.position.y = 0.001;
    floorGroup.add(gridMesh);
  }
  makeGrid();
  {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.7)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.38)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(DIM.W + 1.0, DIM.L + 1.1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
    );
    sh.rotation.x = -Math.PI / 2;
    sh.position.y = 0.003;
    floorGroup.add(sh);
  }

  /* scale figure */
  const person = new THREE.Group();
  {
    const mat = new THREE.MeshStandardMaterial({ color: 0x7f93b3, roughness: 0.7, metalness: 0.0, transparent: true, opacity: 0.85 });
    const add = (geo, x, y, z, sz = 1) => { const mm = new THREE.Mesh(geo, mat); mm.position.set(x, y, z); mm.scale.z = sz; person.add(mm); };
    add(new THREE.SphereGeometry(0.105, 20, 14), 0, 1.645, 0);
    add(new THREE.CapsuleGeometry(0.17, 0.5, 6, 16), 0, 1.2, 0, 0.62);
    add(new THREE.CapsuleGeometry(0.07, 0.6, 6, 12), -0.09, 0.4, 0);
    add(new THREE.CapsuleGeometry(0.07, 0.6, 6, 12), 0.09, 0.4, 0);
    add(new THREE.CapsuleGeometry(0.048, 0.5, 6, 12), -0.25, 1.15, 0);
    add(new THREE.CapsuleGeometry(0.048, 0.5, 6, 12), 0.25, 1.15, 0);
    person.position.set(1.15, 0, 1.25);
    person.rotation.y = -0.6;
    person.visible = false;
    scene.add(person);
  }

  /* dimension overlay */
  const dimGroup = new THREE.Group();
  scene.add(dimGroup);
  const dimLabels = [];
  {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd36b, depthTest: false, transparent: true });
    const bar = (a, b, r = 0.0045) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const len = A.distanceTo(B);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
      mesh.position.copy(A).add(B).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
      mesh.renderOrder = 20;
      dimGroup.add(mesh);
    };
    const head = (p, dir) => {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 10), mat);
      mesh.position.set(...p);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
      mesh.renderOrder = 20;
      dimGroup.add(mesh);
    };
    const dim = (a, b, text, ext = []) => {
      bar(a, b);
      const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).normalize();
      head(a, d.clone().negate().toArray());
      head(b, d.toArray());
      for (const [p, q] of ext) bar(p, q, 0.0025);
      const el = document.createElement('div');
      el.className = 'dimlbl';
      el.textContent = text;
      labels.appendChild(el);
      dimLabels.push({ el, pos: new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) });
    };
    const x0 = -DIM.W / 2, x1 = DIM.W / 2, z0 = -DIM.L / 2, z1 = DIM.L / 2, y = 0.006;
    dim([x1 + 0.3, y, z0], [x1 + 0.3, y, z1], `${Math.round(DIM.L * 100)} cm`, [[[x1, y, z0], [x1 + 0.36, y, z0]], [[x1, y, z1], [x1 + 0.36, y, z1]]]);
    dim([x0, y, z1 + 0.55], [x1, y, z1 + 0.55], `${Math.round(DIM.W * 100)} cm`, [[[x0, y, z1], [x0, y, z1 + 0.6]], [[x1, y, z1], [x1, y, z1 + 0.6]]]);
    dim([x0 - 0.5, 0, z1], [x0 - 0.5, DIM.H, z1], `${Math.round(DIM.H * 100)} cm`, [[[x0 - 0.56, 0, z1], [x0, 0, z1]], [[x0 - 0.56, DIM.H, z1], [x0 - 0.46, DIM.H, z1]]]);
  }

  /* hotspots */
  const EXP_DIR = {
    panel: [-0.55, 0, 0.1], inlet: [0, 0.1, 0.55], cover: [0, 0, 0.7], outlet: [0, -0.05, 0.6],
    doors: [0.35, 0, 0], feet: [0.05, -0.25, 0.05],
  };
  const hot = HOTSPOTS.map((h, i) => {
    const el = document.createElement('button');
    el.className = 'hot';
    el.textContent = i + 1;
    el.setAttribute('aria-label', h.title);
    el.addEventListener('click', () => selectHotspot(h.id, { fromMarker: true }));
    labels.appendChild(el);
    return { h, el, base: new THREE.Vector3(...h.pos), pos: new THREE.Vector3(...h.pos), exp: new THREE.Vector3(...(EXP_DIR[h.id] || [0, 0, 0])), normal: new THREE.Vector3(...h.normal).normalize() };
  });
  const tip = document.createElement('div');
  tip.className = 'tip';
  labels.appendChild(tip);

  /* ---------- camera framing ---------- */
  const TARGET0 = new THREE.Vector3(0, 0.98, 0.05);
  const VIEWS = {
    iso: { dir: [0.66, 0.4, 0.86], dist: 5.4 },
    front: { dir: [0, 0.1, 1], dist: 4.6 },
    side: { dir: [1, 0.08, 0.0], dist: 6.0 },
    back: { dir: [-0.15, 0.16, -1], dist: 5.4 },
    top: { dir: [0.0, 1, 0.001], dist: 6.0 },
  };
  const fit = () => {
    const a = camera.aspect;
    return a >= 1.1 ? 1 : Math.min(1.9, Math.pow(1.1 / a, 0.8));
  };

  let tween = null;
  function flyTo(pos, target, ms = 850) {
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms };
    controls.autoRotate = false;
    $('#optSpin').checked = false;
    invalidate();
  }
  function setView(name) {
    const v = VIEWS[name];
    const d = new THREE.Vector3(...v.dir).normalize();
    const target = TARGET0.clone();
    flyTo(target.clone().addScaledVector(d, v.dist * fit()), target);
    $$('.views .chip-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  }
  function selectHotspot(id, { fromMarker = false } = {}) {
    const hs = HOTSPOTS.find((h) => h.id === id);
    if (!hs) return;
    const d = new THREE.Vector3(...hs.view).normalize();
    const target = new THREE.Vector3(...hs.target);
    flyTo(target.clone().addScaledVector(d, hs.dist * fit()), target);
    $$('.views .chip-btn').forEach((b) => b.classList.remove('active'));
    $$('#partList button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    hot.forEach((x) => x.el.classList.toggle('on', x.h.id === id));
    $('#pcTitle').textContent = hs.title;
    $('#pcText').textContent = hs.text;
    if (fromMarker) selectTab($('#t-parts'));
    // keep the sheet open on phones so the description stays readable; the model reframes above it
    if (isMobile() && (fromMarker || panel.classList.contains('open'))) setSheet(true);
    $('.tabpanes').scrollTop = 0;
    if (id === 'doors') { setSlider('Doors', 100); }
  }
  $('#partList').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) selectHotspot(b.dataset.id);
  });
  $$('.views .chip-btn').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('#resetBtn').addEventListener('click', () => {
    setView('iso');
    for (const id of ['optXray', 'optRun', 'optSpin', 'optScale']) { $('#' + id).checked = false; $('#' + id).dispatchEvent(new Event('change')); }
    setSlider('Doors', 0);
    setSlider('Exp', 0);
    hot.forEach((x) => x.el.classList.remove('on'));
    $$('#partList button').forEach((b) => b.classList.remove('on'));
    $('#pcTitle').textContent = 'Select a part';
    $('#pcText').textContent = 'Tap a numbered marker on the model or pick a part below to zoom in and read what it does.';
  });

  /* ---------- options ---------- */
  let running = false;
  let doorsT = 0, expT = 0;
  const applyDoors = () => m.doors.forEach((d) => (d.pivot.rotation.y = d.max * doorsT));
  const applyExplode = () => {
    m.explode.forEach((e) => e.obj.position.copy(e.base).addScaledVector(e.dir, expT));
    hot.forEach((x) => x.pos.copy(x.base).addScaledVector(x.exp, expT));
  };
  function setSlider(which, v) {
    const input = $('#opt' + which);
    input.value = v;
    input.dispatchEvent(new Event('input'));
  }
  $('#optXray').addEventListener('change', (e) => { m.setXray(e.target.checked); invalidate(); });
  $('#optDims').addEventListener('change', (e) => { dimsOn = e.target.checked; invalidate(); });
  $('#optHot').addEventListener('change', (e) => { hotOn = e.target.checked; invalidate(); });
  $('#optScale').addEventListener('change', (e) => { person.visible = e.target.checked; invalidate(); });
  $('#optRun').addEventListener('change', (e) => {
    running = e.target.checked;
    m.cream.visible = running;
    if (running && !$('#optXray').checked) { $('#optXray').checked = true; m.setXray(true); }
    invalidate();
  });
  $('#optSpin').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; invalidate(); });
  $('#optDoors').addEventListener('input', (e) => { doorsT = e.target.value / 100; $('#outDoors').textContent = `${e.target.value}%`; applyDoors(); invalidate(); });
  $('#optExp').addEventListener('input', (e) => { expT = e.target.value / 100; $('#outExp').textContent = `${e.target.value}%`; applyExplode(); invalidate(); });
  let hotOn = true;
  let dimsOn = true;

  /* ---------- sizing ---------- */
  // The toolbar (top) and, on phones, the bottom sheet cover parts of the canvas. Render the camera's
  // frustum into the free rectangle between them so the machine is framed and scaled to what is visible.
  let lastKey = '';
  function updateOffset() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return false;
    const sr = stage.getBoundingClientRect();
    const rt = Math.round($('.views').getBoundingClientRect().bottom - sr.top + 6);
    const rb = isMobile() ? Math.max(0, Math.round(sr.bottom - panel.getBoundingClientRect().top)) : 0;
    const rh = Math.max(140, h - rt - rb);
    const key = `${w}|${h}|${rt}|${rh}`;
    if (key === lastKey) return false;
    lastKey = key;
    camera.aspect = w / rh;
    camera.setViewOffset(w, rh, 0, -rt, w, h);
    camera.updateProjectionMatrix();
    return true;
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    updateOffset();
    invalidate();
  }
  new ResizeObserver(resize).observe(stage);

  /* ---------- loop ---------- */
  let need = true;
  const invalidate = () => (need = true);
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', () => {
    tween = null;
    $('#hint').classList.add('hide');
  });
  const clock = new THREE.Clock();
  const v3 = new THREE.Vector3();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const camDir = new THREE.Vector3();

  function projectLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const toScreen = (p) => {
      v3.copy(p).project(camera);
      // setViewOffset is already folded into the projection matrix
      return [(v3.x * 0.5 + 0.5) * w, (-v3.y * 0.5 + 0.5) * h, v3.z];
    };
    for (const x of hot) {
      const [sx, sy, sz] = toScreen(x.pos);
      camDir.copy(camera.position).sub(x.pos).normalize();
      const facing = x.normal.dot(camDir) > 0.08;
      const vis = hotOn && facing && sz < 1;
      x.el.classList.toggle('hidden', !vis);
      if (vis) x.el.style.transform = `translate(${sx}px, ${sy}px)`;
    }
    for (const d of dimLabels) {
      const [sx, sy, sz] = toScreen(d.pos);
      const vis = dimGroup.visible && sz < 1;
      d.el.classList.toggle('hidden', !vis);
      if (vis && (sx < -60 || sx > w + 60 || sy < -30 || sy > h + 30)) d.el.classList.add('hidden');
      else if (vis) {
        const cx = Math.min(w - 40, Math.max(40, sx)), cy = Math.min(h - 20, Math.max(20, sy));
        d.el.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      }
    }
  }

  let running0 = false;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const now = performance.now();
    let redraw = need;
    if (now < sheetAnimUntil && updateOffset()) redraw = true;
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.ms);
      const k = ease(t);
      camera.position.lerpVectors(tween.p0, tween.p1, k);
      controls.target.lerpVectors(tween.t0, tween.t1, k);
      if (t >= 1) tween = null;
      redraw = true;
    }
    if (controls.update()) redraw = true;
    if (running) {
      m.dasher.rotation.z += dt * 5.5;
      m.fan.rotation.z += dt * 7;
      redraw = true;
    } else if (running0) redraw = true;
    running0 = running;
    if (controls.autoRotate) redraw = true;
    if (!redraw) return;
    need = false;
    // dimension overlay is only useful when the whole machine is in view
    dimGroup.visible = dimsOn && camera.position.distanceTo(controls.target) > 2.6;
    renderer.render(scene, camera);
    projectLabels();
  }

  function onTheme() {
    makeGrid();
    renderer.toneMappingExposure = root.dataset.theme === 'light' ? 1.08 : 1.0;
    invalidate();
  }

  // initial camera
  resize();
  {
    const v = VIEWS.iso;
    const d = new THREE.Vector3(...v.dir).normalize();
    controls.target.copy(TARGET0);
    camera.position.copy(TARGET0).addScaledVector(d, v.dist * fit());
    controls.update();
  }
  frame();

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); });
  canvas.addEventListener('webglcontextrestored', invalidate);

  return { invalidate, onTheme, setView, selectHotspot, scene, camera, controls, machine: m, renderer };
}

viewer = createViewer();
if (viewer) {
  // first frame is drawn; fade out the loader
  requestAnimationFrame(() => requestAnimationFrame(() => $('#loading').classList.add('done')));
  setTimeout(() => $('#hint').classList.add('hide'), 9000);
  window.__viewer = viewer;
} else {
  $('#loading').hidden = true;
  $('#nogl').hidden = false;
  $('.views').hidden = true;
  $('#hint').hidden = true;
  selectTab($('#t-specs'));
}
