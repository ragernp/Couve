// Procedural 3D model of the Tetra Pak Hoyer Frigus SF1200-N1 continuous ice-cream freezer.
// Units are metres. +Z is the front (operator side), +Y is up, X is the width.
// Envelope comes from dealer listings: 193 cm (L) x 84 cm (W) x 200 cm (H).
// Exterior layout follows reference photos of SF1200 units; interior is schematic.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const DIM = { L: 1.93, W: 0.84, H: 2.0 };
const HL = DIM.L / 2; // 0.965
const HW = DIM.W / 2; // 0.42
const FOOT = 0.12; // height of body above floor

/* ---------- helpers ---------- */

function canvasTexture(w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function brushedRoughness() {
  // Horizontal streaks give the stainless a brushed, slightly anisotropic look.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return canvasTexture(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = 'rgb(105,105,105)';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) {
        const v = 80 + Math.floor(rnd() * 70);
        g.strokeStyle = `rgba(${v},${v},${v},${0.15 + rnd() * 0.35})`;
        g.lineWidth = 0.5 + rnd() * 1.5;
        const y = rnd() * h;
        const x = rnd() * w;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 60 + rnd() * 260, y + (rnd() - 0.5) * 2);
        g.stroke();
      }
    },
    { srgb: false, repeat: [3, 3] }
  );
}

function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function cylZ(r, len, seg = 32, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, len, seg);
  g.rotateX(Math.PI / 2); // axis -> Z
  return g;
}

function cylX(r, len, seg = 32) {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.rotateZ(Math.PI / 2); // axis -> X
  return g;
}

function tube(points, radius, mat, { segs = 64, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    closed,
    'centripetal'
  );
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 14, closed), mat);
}

/** Sanitary tri-clamp: ferrule ring + two-piece clamp + wing nut. */
function clamp(mat, darkMat, radius = 0.032) {
  const g = new THREE.Group();
  add(g, new THREE.TorusGeometry(radius, 0.009, 8, 24), mat);
  add(g, new THREE.TorusGeometry(radius + 0.003, 0.012, 8, 24, Math.PI * 1.7), mat).rotation.z = 0.3;
  const nut = add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.03, 10), darkMat, radius + 0.018, 0, 0);
  nut.rotation.x = Math.PI / 2;
  add(g, new THREE.BoxGeometry(0.008, 0.026, 0.006), mat, radius + 0.018, 0, 0.018);
  return g;
}

/* ---------- main builder ---------- */

export function buildMachine() {
  const root = new THREE.Group();
  root.name = 'SF1200-N1';

  const rough = brushedRoughness();

  /* materials */
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xdde1e6,
    metalness: 0.72,
    roughness: 0.5,
    roughnessMap: rough,
  });
  const polished = new THREE.MeshStandardMaterial({ color: 0xe6e9ed, metalness: 1, roughness: 0.16 });
  const satin = new THREE.MeshStandardMaterial({ color: 0xcfd4da, metalness: 1, roughness: 0.32 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x4d535b, metalness: 0.85, roughness: 0.45 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x17191c, metalness: 0, roughness: 0.85 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 1, roughness: 0.3 });
  const gearGrey = new THREE.MeshStandardMaterial({ color: 0xaeb4ba, metalness: 0.7, roughness: 0.4 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.1, roughness: 0.55 });
  const greenBtn = new THREE.MeshStandardMaterial({ color: 0x0f8a4a, emissive: 0x0a6a38, emissiveIntensity: 0.7, roughness: 0.3 });
  const blueBtn = new THREE.MeshStandardMaterial({ color: 0x1c63d6, emissive: 0x1147a0, emissiveIntensity: 0.7, roughness: 0.3 });
  const redBtn = new THREE.MeshStandardMaterial({ color: 0xd8201a, roughness: 0.25 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.5 });
  const blackGrip = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.6 });

  const parts = {}; // named groups that other code may move
  const explode = []; // { obj, base: Vector3, dir: Vector3 }
  const track = (obj, dir) => explode.push({ obj, base: obj.position.clone(), dir: new THREE.Vector3(...dir) });

  /* ======================= SHELL ======================= */
  const shell = new THREE.Group();
  root.add(shell);
  const bodyH = 1.835; // y 0.12 -> 1.955
  const bodyY = FOOT + bodyH / 2;
  const wallGeo = (w, h, d) => new RoundedBoxGeometry(w, h, d, 3, 0.006);

  // front & rear walls
  add(shell, wallGeo(DIM.W, bodyH, 0.02), shellMat, 0, bodyY, HL - 0.01);
  add(shell, wallGeo(DIM.W, bodyH, 0.02), shellMat, 0, bodyY, -HL + 0.01);
  // base plate
  add(shell, wallGeo(DIM.W - 0.03, 0.02, DIM.L - 0.03), shellMat, 0, FOOT + 0.01, 0);
  // side rails (top + bottom) and door-opening posts
  for (const s of [-1, 1]) {
    add(shell, wallGeo(0.022, 0.07, DIM.L - 0.03), shellMat, s * (HW - 0.014), 1.92, 0);
    add(shell, wallGeo(0.022, 0.075, DIM.L - 0.03), shellMat, s * (HW - 0.014), FOOT + 0.055, 0);
    add(shell, wallGeo(0.022, bodyH - 0.1, 0.03), shellMat, s * (HW - 0.014), bodyY, -0.0);
  }

  // roof (separate so the "exploded" view can lift it)
  const roof = new THREE.Group();
  add(roof, wallGeo(DIM.W, 0.022, DIM.L), shellMat);
  roof.position.set(0, 1.966, 0);
  root.add(roof);
  track(roof, [0, 0.45, 0]);
  // small step line on roof to hint at the lid join
  add(roof, new THREE.BoxGeometry(DIM.W - 0.02, 0.0015, 0.004), darkSteel, 0, 0.0115, 0.24);

  // side doors: 2 per side, hinged at the outer ends so they swing clear
  const doors = [];
  const doorLen = 0.9;
  const doorH = 1.745;
  const doorMidY = 1.0425;
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1458b8, metalness: 0.15, roughness: 0.4 });
  for (const s of [-1, 1]) {
    for (const end of [1, -1]) {
      // end = +1 front door (hinge at front), -1 rear door (hinge at rear)
      const pivot = new THREE.Group();
      pivot.position.set(s * (HW - 0.0045), doorMidY, end * 0.93);
      const door = new THREE.Mesh(wallGeo(0.012, doorH, doorLen), shellMat);
      door.position.z = -end * (doorLen / 2);
      pivot.add(door);
      // blue brand stripe along upper third of each door
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(doorLen, 0.1), stripeMat);
      stripe.rotation.y = s * (Math.PI / 2);
      stripe.position.set(s * 0.0065, 0.7575, -end * (doorLen / 2));
      pivot.add(stripe);
      // recessed handle near the seam
      const handle = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.14, 0.03, 2, 0.004), darkSteel);
      handle.position.set(s * 0.011, 0.0, -end * (doorLen - 0.07));
      pivot.add(handle);
      root.add(pivot);
      // opening angle: outward on both sides
      const sign = s * end * -1; // derived from rotation about Y (see maths in comments)
      doors.push({ pivot, max: sign * (Math.PI * 0.56) });
      track(pivot, [s * 0.35, 0, 0]);
    }
  }

  /* ===== front-face brand stripe & data plate ===== */
  const frontStripe = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.14),
    new THREE.MeshStandardMaterial({ map: brandStripeTexture(1024, 250, true), metalness: 0.2, roughness: 0.4 })
  );
  frontStripe.position.set(0.13, 1.83, HL + 0.0008);
  root.add(frontStripe);

  const plateTex = canvasTexture(768, 480, (g, w, h) => {
    g.fillStyle = '#d3d8dd';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8c939b';
    g.lineWidth = 6;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#1a2330';
    g.font = '700 46px system-ui, Arial, sans-serif';
    g.fillText('DATA PLATE', 34, 78);
    g.font = '400 36px system-ui, Arial, sans-serif';
    g.fillStyle = '#4b5563';
    g.fillText('Type', 34, 160);
    g.fillStyle = '#0f1722';
    g.font = '700 40px system-ui, Arial, sans-serif';
    g.fillText('Tetra Hoyer Frigus', 34, 208);
    g.fillText('SF1200-N1', 34, 256);
    g.fillStyle = '#4b5563';
    g.font = '400 36px system-ui, Arial, sans-serif';
    g.fillText('Machine No.', 34, 332);
    g.fillStyle = '#0f1722';
    g.font = '700 56px system-ui, Arial, sans-serif';
    g.fillText('Z138, 1079', 34, 404);
  });
  const plate = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.125, 0.004, 2, 0.002),
    [shellMat, shellMat, shellMat, shellMat, new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.5, roughness: 0.45 }), shellMat]
  );
  plate.position.set(0.25, 0.8, HL + 0.002);
  root.add(plate);
  parts.plate = plate;

  /* ======================= OPERATOR PANEL ======================= */
  const panel = new THREE.Group();
  panel.position.set(-0.31, 1.7, HL + 0.025);
  root.add(panel);
  parts.panel = panel;
  track(panel, [-0.55, 0, 0.1]);
  add(panel, new RoundedBoxGeometry(0.3, 0.62, 0.05, 3, 0.006), shellMat);
  // Siemens-style touch panel bezel + screen
  add(panel, new RoundedBoxGeometry(0.235, 0.17, 0.02, 3, 0.006), bezelMat, 0, 0.185, 0.03);
  const screenTex = panelScreenTexture();
  add(
    panel,
    new THREE.PlaneGeometry(0.16, 0.12),
    new THREE.MeshStandardMaterial({ map: screenTex, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.55, roughness: 0.2 }),
    0,
    0.19,
    0.0405
  );
  // membrane film with button strip
  add(
    panel,
    new THREE.PlaneGeometry(0.265, 0.34),
    new THREE.MeshStandardMaterial({ map: panelFilmTexture(), roughness: 0.45 }),
    0,
    -0.12,
    0.0255
  );
  const btnGeo = new THREE.CylinderGeometry(0.0165, 0.0165, 0.012, 24);
  btnGeo.rotateX(Math.PI / 2);
  const ringGeo = new THREE.TorusGeometry(0.0175, 0.003, 8, 24);
  const buttons = [
    [-0.065, 0.015, greenBtn],
    [-0.065, -0.07, greenBtn],
    [-0.065, -0.155, greenBtn],
    [-0.065, -0.24, blueBtn],
    [0.065, 0.015, greenBtn],
    [0.065, -0.07, greenBtn],
    [0.065, -0.155, greenBtn],
  ];
  for (const [x, y, m] of buttons) {
    add(panel, btnGeo, m, x, y, 0.031);
    add(panel, ringGeo, satin, x, y, 0.0265);
  }
  // e-stop on yellow disc
  const yDisc = new THREE.CylinderGeometry(0.04, 0.04, 0.004, 32);
  yDisc.rotateX(Math.PI / 2);
  add(panel, yDisc, yellowMat, 0.07, -0.245, 0.0275);
  const eStop = new THREE.CylinderGeometry(0.0255, 0.0225, 0.022, 28);
  eStop.rotateX(Math.PI / 2);
  add(panel, eStop, redBtn, 0.07, -0.245, 0.04);
  add(panel, new THREE.SphereGeometry(0.0255, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), redBtn, 0.07, -0.245, 0.051);
  // screws
  for (const [x, y] of [
    [-0.13, 0.29],
    [0.13, 0.29],
    [-0.13, -0.29],
    [0.13, -0.29],
  ])
    add(panel, cylZ(0.006, 0.004, 12), polished, x, y, 0.0255);

  /* ======================= MIX INLET PUMP + LINES ======================= */
  const inlet = new THREE.Group();
  inlet.position.set(0.04, 1.52, HL);
  root.add(inlet);
  parts.inlet = inlet;
  track(inlet, [0, 0.1, 0.55]);
  // mounting plate + pump head
  add(inlet, new RoundedBoxGeometry(0.16, 0.2, 0.03, 3, 0.012), satin, 0, -0.01, 0.018);
  add(inlet, new RoundedBoxGeometry(0.135, 0.16, 0.07, 3, 0.02), polished, 0, 0, 0.065);
  for (const [x, y] of [
    [-0.045, 0.058],
    [0.045, 0.058],
    [-0.045, -0.058],
    [0.045, -0.058],
  ]) {
    add(inlet, new THREE.CylinderGeometry(0.0095, 0.0095, 0.014, 6).rotateX(Math.PI / 2), polished, x, y, 0.105);
  }
  add(inlet, cylZ(0.008, 0.01, 12), darkSteel, 0, 0, 0.103);
  // gear motor housing to the left of the head (as seen in photos)
  add(inlet, new RoundedBoxGeometry(0.1, 0.12, 0.1, 3, 0.012), gearGrey, -0.115, 0.0, 0.065);
  for (let i = 0; i < 4; i++) add(inlet, new THREE.BoxGeometry(0.1, 0.004, 0.1), darkSteel, -0.115, -0.04 + i * 0.027, 0.065);
  // product inlet elbow, rising from the top of the head
  const inletPipe = tube(
    [
      [0.0, 0.07, 0.065],
      [0.0, 0.16, 0.065],
      [0.0, 0.26, 0.066],
      [-0.01, 0.32, 0.07],
      [-0.035, 0.35, 0.09],
    ],
    0.02,
    polished,
    { segs: 40 }
  );
  inlet.add(inletPipe);
  const inletRing = clamp(polished, darkSteel, 0.026);
  inletRing.position.set(-0.04, 0.352, 0.092);
  inletRing.rotation.set(-0.7, 0.0, 0);
  inlet.add(inletRing);
  const inletMouth = new THREE.Mesh(new THREE.CircleGeometry(0.0185, 24), new THREE.MeshBasicMaterial({ color: 0x050607 }));
  inletMouth.position.copy(inletRing.position).add(new THREE.Vector3(-0.001, 0.003, 0.002));
  inletMouth.rotation.copy(inletRing.rotation);
  inlet.add(inletMouth);

  // pipe from pump down to the cylinder cover (world space, so added to root via its own group)
  const feed = new THREE.Group();
  root.add(feed);
  track(feed, [0, 0.1, 0.55]);
  feed.add(
    tube(
      [
        [0.1, 1.52, HL + 0.075],
        [0.17, 1.52, HL + 0.08],
        [0.215, 1.46, HL + 0.085],
        [0.22, 1.35, HL + 0.085],
        [0.17, 1.26, HL + 0.085],
        [0.08, 1.245, HL + 0.07],
        [0.03, 1.25, HL + 0.06],
      ],
      0.02,
      polished,
      { segs: 80 }
    )
  );
  const feedClamp = clamp(polished, darkSteel, 0.024);
  feedClamp.position.set(0.13, 1.52, HL + 0.077);
  feedClamp.rotation.y = Math.PI / 2;
  feed.add(feedClamp);
  // black lever handle
  const lever = new THREE.Group();
  lever.position.set(0.22, 1.4, HL + 0.085);
  add(lever, cylX(0.004, 0.12, 8), darkSteel, 0.06, 0, 0);
  add(lever, cylX(0.011, 0.05, 14), blackGrip, 0.145, 0, 0);
  feed.add(lever);
  parts.feed = feed;

  /* ======================= FREEZING CYLINDER COVER ======================= */
  const cover = new THREE.Group();
  cover.position.set(0.0, 1.13, HL);
  root.add(cover);
  parts.cover = cover;
  track(cover, [0, 0, 0.7]);
  add(cover, cylZ(0.135, 0.028, 48), polished, 0, 0, 0.018);
  add(cover, cylZ(0.11, 0.022, 48), satin, 0, 0, 0.038);
  add(cover, new THREE.TorusGeometry(0.128, 0.006, 10, 48), polished, 0, 0, 0.032);
  add(cover, cylZ(0.026, 0.03, 20), polished, 0, 0, 0.058);
  add(cover, cylZ(0.014, 0.012, 14), darkSteel, 0, 0, 0.076);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    const knob = new THREE.Group();
    knob.position.set(Math.cos(a) * 0.088, Math.sin(a) * 0.088, 0.05);
    add(knob, cylZ(0.009, 0.03, 12), polished, 0, 0, 0.0);
    add(knob, cylZ(0.016, 0.014, 20), polished, 0, 0, 0.022);
    cover.add(knob);
  }
  // sensor lead
  cover.add(
    tube(
      [
        [-0.03, 0.095, 0.05],
        [-0.075, 0.115, 0.055],
        [-0.12, 0.09, 0.05],
        [-0.15, 0.04, 0.045],
      ],
      0.003,
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.6 }),
      { segs: 20 }
    )
  );

  /* ======================= OUTLET PUMP ======================= */
  const outlet = new THREE.Group();
  outlet.position.set(-0.02, 0.46, HL);
  root.add(outlet);
  parts.outlet = outlet;
  track(outlet, [0, -0.05, 0.6]);
  add(outlet, new RoundedBoxGeometry(0.19, 0.17, 0.025, 3, 0.01), satin, 0, 0, 0.015);
  add(outlet, new RoundedBoxGeometry(0.17, 0.12, 0.13, 3, 0.02), polished, -0.02, 0, 0.09);
  add(outlet, new RoundedBoxGeometry(0.09, 0.1, 0.11, 3, 0.012), gearGrey, -0.115, 0, 0.085);
  for (let i = 0; i < 3; i++) add(outlet, new THREE.BoxGeometry(0.09, 0.004, 0.11), darkSteel, -0.115, -0.025 + i * 0.027, 0.085);
  // horizontal tube to the right with end knob
  outlet.add(
    tube(
      [
        [0.06, 0.0, 0.1],
        [0.16, 0.0, 0.1],
        [0.26, 0.012, 0.1],
        [0.32, 0.012, 0.1],
      ],
      0.013,
      polished,
      { segs: 20 }
    )
  );
  add(outlet, new THREE.SphereGeometry(0.02, 16, 12), polished, 0.335, 0.012, 0.1);
  add(outlet, cylX(0.018, 0.02, 20), polished, 0.12, 0.0, 0.1);
  // outlet spout dropping from the pump, curling forward
  outlet.add(
    tube(
      [
        [-0.07, -0.05, 0.09],
        [-0.07, -0.11, 0.095],
        [-0.075, -0.15, 0.12],
        [-0.09, -0.17, 0.17],
      ],
      0.015,
      polished,
      { segs: 24 }
    )
  );
  const spoutRing = clamp(polished, darkSteel, 0.02);
  spoutRing.position.set(-0.092, -0.172, 0.178);
  spoutRing.rotation.x = Math.PI / 2 - 0.35;
  outlet.add(spoutRing);

  /* ======================= FEET ======================= */
  const feet = new THREE.Group();
  root.add(feet);
  parts.feet = feet;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const f = new THREE.Group();
      f.position.set(sx * 0.345, 0, sz * 0.86);
      add(f, new THREE.CylinderGeometry(0.036, 0.04, 0.014, 24), rubber, 0, 0.007, 0);
      add(f, new THREE.CylinderGeometry(0.03, 0.03, 0.008, 24), darkSteel, 0, 0.018, 0);
      add(f, new THREE.CylinderGeometry(0.0125, 0.0125, 0.12, 14), polished, 0, 0.08, 0);
      add(f, new THREE.CylinderGeometry(0.022, 0.022, 0.018, 6), darkSteel, 0, 0.09, 0);
      feet.add(f);
      track(f, [sx * 0.05, -0.25, sz * 0.05]);
    }

  /* ======================= INTERNALS (schematic) ======================= */
  const inner = new THREE.Group();
  root.add(inner);
  parts.inner = inner;
  const CY = 1.13; // cylinder axis height

  // freezing barrel: translucent so the dasher is visible
  const barrelMat = new THREE.MeshPhysicalMaterial({
    color: 0x9fd2ff,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  add(inner, cylZ(0.1, 0.74, 40), barrelMat, 0, CY, 0.56).renderOrder = 3;
  // product fill (cream) – only visible while "running"
  const cream = add(
    inner,
    cylZ(0.088, 0.72, 32),
    new THREE.MeshStandardMaterial({ color: 0xfff0d2, transparent: true, opacity: 0.55, roughness: 0.6, depthWrite: false }),
    0,
    CY,
    0.56
  );
  cream.visible = false;
  parts.cream = cream;
  // end rings
  add(inner, new THREE.TorusGeometry(0.105, 0.008, 8, 40), polished, 0, CY, 0.925);
  add(inner, new THREE.TorusGeometry(0.105, 0.008, 8, 40), polished, 0, CY, 0.19);
  // evaporator coil (copper helix around the barrel)
  const helix = [];
  const turns = 11;
  for (let i = 0; i <= turns * 14; i++) {
    const t = i / (turns * 14);
    const a = t * turns * Math.PI * 2;
    helix.push([Math.cos(a) * 0.12, CY + Math.sin(a) * 0.12, 0.2 + t * 0.7]);
  }
  inner.add(tube(helix, 0.007, copper, { segs: turns * 14 * 2 }));
  // dasher: shaft + two scraper blades + pins
  const dasher = new THREE.Group();
  dasher.position.set(0, CY, 0.56);
  inner.add(dasher);
  parts.dasher = dasher;
  add(dasher, cylZ(0.026, 0.8, 20), polished, 0, 0, 0.0);
  for (const a of [0, Math.PI]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.68), satin);
    b.position.set(Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0);
    b.rotation.z = a + Math.PI / 2 + 0.2;
    dasher.add(b);
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    const p = add(dasher, new THREE.CylinderGeometry(0.0045, 0.0045, 0.09, 8), polished, Math.cos(a) * 0.05, Math.sin(a) * 0.05, -0.3 + i * 0.12);
    p.rotation.z = a - Math.PI / 2;
  }
  // gearbox + drive motor behind the barrel
  add(inner, new RoundedBoxGeometry(0.26, 0.26, 0.17, 3, 0.02), darkSteel, 0, CY, 0.095);
  const motor = new THREE.MeshStandardMaterial({ color: 0x2f5a93, metalness: 0.55, roughness: 0.45 });
  add(inner, cylZ(0.125, 0.42, 32), motor, 0, CY, -0.2);
  for (let i = 0; i < 9; i++) add(inner, new THREE.TorusGeometry(0.126, 0.007, 6, 32), motor, 0, CY, -0.38 + i * 0.045);
  add(inner, cylZ(0.14, 0.05, 32), darkSteel, 0, CY, -0.44);
  add(inner, new RoundedBoxGeometry(0.12, 0.07, 0.12, 2, 0.01), darkSteel, 0, CY + 0.155, -0.2);
  // electrical cabinet behind the operator panel
  const elec = add(inner, new RoundedBoxGeometry(0.34, 0.38, 0.3, 3, 0.012), new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: 0.4, roughness: 0.5 }), -0.17, 1.62, 0.78);
  elec.name = 'electrics';
  for (let i = 0; i < 6; i++) add(inner, new THREE.BoxGeometry(0.03, 0.018, 0.006), i % 2 ? greenBtn : darkSteel, -0.29 + i * 0.04, 1.7, 0.633);
  // compressor (semi-hermetic style)
  const compMat = new THREE.MeshStandardMaterial({ color: 0x1f6f55, metalness: 0.5, roughness: 0.45 });
  add(inner, cylZ(0.17, 0.5, 32), compMat, -0.12, 0.5, -0.5);
  add(inner, new RoundedBoxGeometry(0.2, 0.12, 0.2, 2, 0.01), darkSteel, -0.12, 0.7, -0.45);
  for (const dz of [-0.18, 0.06]) add(inner, new THREE.CylinderGeometry(0.06, 0.06, 0.1, 20), darkSteel, -0.12, 0.66, -0.5 + dz);
  // receiver tank
  add(inner, new THREE.CapsuleGeometry(0.075, 0.42, 6, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8aa0b8, metalness: 0.7, roughness: 0.4 }), 0.25, 0.36, -0.42);
  // condenser coil + fan at the rear
  const fins = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.6, roughness: 0.6 });
  add(inner, new THREE.BoxGeometry(0.7, 0.95, 0.05), fins, 0, 0.8, -0.9);
  const fan = new THREE.Group();
  fan.position.set(0, 0.8, -0.84);
  inner.add(fan);
  parts.fan = fan;
  add(fan, new THREE.TorusGeometry(0.28, 0.012, 8, 40), darkSteel);
  add(fan, cylZ(0.05, 0.05, 16), darkSteel);
  for (let i = 0; i < 5; i++) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.006), satin);
    bl.position.set(Math.cos((i * Math.PI * 2) / 5) * 0.15, Math.sin((i * Math.PI * 2) / 5) * 0.15, 0);
    bl.rotation.z = (i * Math.PI * 2) / 5;
    bl.rotation.x = 0.4;
    fan.add(bl);
  }
  // refrigerant pipework
  inner.add(tube([[-0.12, 0.7, -0.45], [-0.12, 0.85, -0.3], [-0.05, 1.0, -0.1], [-0.05, 1.13, 0.1], [0.05, 1.22, 0.2]], 0.01, copper, { segs: 40 }));
  inner.add(tube([[0.25, 0.42, -0.3], [0.28, 0.6, -0.1], [0.2, 0.9, 0.0], [0.13, 1.05, 0.2]], 0.01, copper, { segs: 40 }));
  inner.add(tube([[-0.12, 0.35, -0.65], [0.0, 0.2, -0.7], [0.25, 0.3, -0.62], [0.25, 0.36, -0.62]], 0.01, copper, { segs: 40 }));
  // inner frame posts
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) add(inner, new THREE.BoxGeometry(0.018, 1.8, 0.018), satin, sx * 0.39, 1.03, sz * 0.915);

  /* shell transparency control (X-ray) */
  const shellMats = [shellMat];
  function setXray(on) {
    for (const m of shellMats) {
      m.transparent = on;
      m.opacity = on ? 0.12 : 1;
      m.depthWrite = !on;
      m.needsUpdate = true;
    }
    for (const n of [frontStripe.material, plate.material, stripeMat]) {
      n.transparent = on;
      n.opacity = on ? 0.25 : 1;
      n.depthWrite = !on;
    }
  }

  return { root, parts, doors, explode, setXray, dasher, fan, cream, DIM };
}

/* ---------- canvas textures for graphics ---------- */

function brandStripeTexture(w, h, front) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = '#1458b8';
    g.fillRect(0, 0, w, h);
    if (!front) return;
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    // measure at a reference size, then scale so the whole wordmark fills ~90% of the stripe
    const ref = 100;
    g.font = `italic 700 ${ref}px system-ui, "Helvetica Neue", Arial, sans-serif`;
    const a = g.measureText('Hoyer Frigus').width;
    g.font = `italic 800 ${ref}px system-ui, "Helvetica Neue", Arial, sans-serif`;
    const b = g.measureText('SF').width;
    const gap = ref * 0.45;
    const size = Math.min(h * 0.5, ((w * 0.8) / (a + gap + b)) * ref);
    const k = size / ref;
    let x = w * 0.04;
    g.font = `italic 700 ${size}px system-ui, "Helvetica Neue", Arial, sans-serif`;
    g.fillText('Hoyer Frigus', x, h * 0.54);
    x += a * k;
    g.font = `700 ${size * 0.3}px system-ui, Arial, sans-serif`;
    g.fillText('\u00ae', x + size * 0.03, h * 0.3);
    x += gap * k;
    g.font = `italic 800 ${size}px system-ui, "Helvetica Neue", Arial, sans-serif`;
    g.fillText('SF', x, h * 0.54);
  });
}

function panelScreenTexture() {
  return canvasTexture(480, 360, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#cfe3f3');
    grad.addColorStop(1, '#a9c4d8');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#12304f';
    g.fillRect(0, 0, w, 56);
    g.fillStyle = '#fff';
    g.font = '700 30px system-ui, Arial, sans-serif';
    g.fillText('Frigus SF1200-N1', 18, 38);
    g.fillStyle = '#12304f';
    g.font = '600 26px system-ui, Arial, sans-serif';
    g.fillText('Machine No.  Z138, 1079', 18, 104);
    g.fillStyle = '#2f7d4f';
    g.fillRect(18, 128, 170, 44);
    g.fillStyle = '#fff';
    g.font = '700 24px system-ui, Arial, sans-serif';
    g.fillText('STANDBY', 38, 160);
    g.fillStyle = '#12304f';
    g.font = '500 24px system-ui, Arial, sans-serif';
    const rows = ['Overrun', 'Flow', 'Viscosity', 'Recipe'];
    rows.forEach((r, i) => {
      g.fillText(r, 18, 214 + i * 36);
      g.fillText('--', 220, 214 + i * 36);
    });
    g.strokeStyle = 'rgba(18,48,79,.35)';
    g.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(18, 224 + i * 36);
      g.lineTo(w - 18, 224 + i * 36);
      g.stroke();
    }
  });
}

function panelFilmTexture() {
  return canvasTexture(530, 680, (g, w, h) => {
    g.fillStyle = '#1b5bbd';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#122a5c';
    g.fillRect(70, 60, w - 140, h - 150);
    // white guide lines
    g.fillStyle = '#e8eef7';
    g.fillRect(w * 0.31 - 3, 0, 8, h - 90);
    g.fillRect(w * 0.69 - 3, 0, 8, h - 90);
    // faint icon glyphs next to buttons
    g.strokeStyle = '#d7e3f5';
    g.lineWidth = 4;
    const ys = [70, 190, 310, 430];
    ys.forEach((y, i) => {
      [w * 0.31, w * 0.69].forEach((x, j) => {
        if (j === 1 && i === 3) return;
        g.beginPath();
        g.arc(x + (j ? 90 : -90), y + 30, 16, 0, Math.PI * 2);
        g.stroke();
      });
    });
    g.fillStyle = '#f6c20a';
    g.beginPath();
    g.arc(w * 0.69, h - 100, 72, 0, Math.PI * 2);
    g.fill();
    // tiny Tetra-ish mark replaced with a neutral glyph
    g.fillStyle = '#e8eef7';
    g.font = '700 34px system-ui, Arial';
    g.fillText('SF', 36, h - 28);
  });
}
