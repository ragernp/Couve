// Orthographic dimension drawings generated from the same numbers as the 3D model.
import { DIM } from './model.js';

const S = 230; // px per metre
const PAD = 70;
const HL = DIM.L / 2;
const HW = DIM.W / 2;

const el = (name, attrs = {}, children = '') => {
  const a = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<${name} ${a}>${children}</${name}>`;
};
const rect = (x, y, w, h, cls = 'body', extra = {}) => el('rect', { x, y, width: w, height: h, class: cls, rx: 2, ...extra });
const circle = (cx, cy, r, cls = 'part') => el('circle', { cx, cy, r, class: cls });
const line = (x1, y1, x2, y2, cls = 'dim') => el('line', { x1, y1, x2, y2, class: cls });
const text = (x, y, s, cls = 'lbl', extra = {}) => el('text', { x, y, class: cls, ...extra }, s);

function arrowH(x1, x2, y, label) {
  const a = 6;
  return [
    line(x1, y, x2, y),
    el('path', { d: `M${x1} ${y} l${a} -3 v6 z M${x2} ${y} l${-a} -3 v6 z`, class: 'arrow' }),
    text((x1 + x2) / 2, y - 7, label, 'dimtxt', { 'text-anchor': 'middle' }),
  ].join('');
}
function arrowV(x, y1, y2, label) {
  const a = 6;
  return [
    line(x, y1, x, y2),
    el('path', { d: `M${x} ${y1} l-3 ${a} h6 z M${x} ${y2} l-3 ${-a} h6 z`, class: 'arrow' }),
    text(x - 8, (y1 + y2) / 2, label, 'dimtxt', { 'text-anchor': 'middle', transform: `rotate(-90 ${x - 8} ${(y1 + y2) / 2})` }),
  ].join('');
}

function wrap(w, h, inner, title, id) {
  return `<svg id="${id}" class="drawing" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
    <title>${title}</title>${inner}</svg>`;
}

/** Front elevation (looking at the operator side). */
function front() {
  const W = DIM.W * S;
  const H = DIM.H * S;
  const ox = PAD + 0.1 * S; // leave space for the protruding panel on the left
  const gy = PAD + H; // floor line (svg y of y=0)
  const X = (x) => ox + (x + HW) * S;
  const Y = (y) => gy - y * S;
  const g = [];
  // floor
  g.push(line(PAD - 20, gy, ox + W + PAD, gy, 'floor'));
  // feet
  for (const fx of [-0.345, 0.345]) g.push(rect(X(fx) - 8, Y(0.12), 16, 0.12 * S, 'part'));
  // body + roof
  g.push(rect(X(-HW), Y(1.977), W, (1.977 - 0.12) * S, 'body'));
  // stripe
  g.push(rect(X(-0.16), Y(1.9), 0.58 * S, 0.14 * S, 'blue'));
  g.push(text(X(-0.13), Y(1.8), 'Hoyer Frigus SF', 'stripe'));
  // panel
  g.push(rect(X(-0.46), Y(2.0), 0.3 * S, 0.62 * S, 'part'));
  g.push(rect(X(-0.43), Y(1.93), 0.235 * S * 0.88, 0.17 * S, 'screen'));
  for (let i = 0; i < 3; i++) {
    g.push(circle(X(-0.375), Y(1.67 - i * 0.085), 3.6, 'btn'));
    g.push(circle(X(-0.245), Y(1.67 - i * 0.085), 3.6, 'btn'));
  }
  g.push(circle(X(-0.24), Y(1.455), 6, 'estop'));
  // inlet pump + elbow
  g.push(rect(X(0.04 - 0.07), Y(1.6), 0.14 * S, 0.16 * S, 'part'));
  g.push(rect(X(0.02), Y(1.88), 0.04 * S, 0.28 * S, 'part'));
  // feed line
  g.push(el('path', { d: `M${X(0.1)} ${Y(1.52)} H${X(0.2)} Q${X(0.24)} ${Y(1.52)} ${X(0.23)} ${Y(1.4)} V${Y(1.3)} Q${X(0.2)} ${Y(1.24)} ${X(0.05)} ${Y(1.245)}`, class: 'pipe' }));
  // cylinder cover
  g.push(circle(X(0), Y(1.13), 0.135 * S, 'part'));
  g.push(circle(X(0), Y(1.13), 0.11 * S, 'part2'));
  g.push(circle(X(0), Y(1.13), 0.026 * S, 'part'));
  // outlet pump
  g.push(rect(X(-0.115), Y(0.52), 0.19 * S, 0.12 * S, 'part'));
  g.push(rect(X(-0.02), Y(0.46), 0.34 * S, 0.026 * S, 'part'));
  g.push(rect(X(-0.095), Y(0.4), 0.03 * S, 0.12 * S, 'part'));
  // data plate
  g.push(rect(X(0.15), Y(0.8 + 0.0625), 0.2 * S, 0.125 * S, 'plate'));
  g.push(text(X(0.16), Y(0.8 + 0.01), 'Z138, 1079', 'plate-txt'));
  // dimensions
  g.push(arrowH(X(-HW), X(HW), gy + 34, `${Math.round(DIM.W * 100)} cm`));
  g.push(line(X(-HW), gy + 4, X(-HW), gy + 40, 'ext'));
  g.push(line(X(HW), gy + 4, X(HW), gy + 40, 'ext'));
  g.push(arrowV(ox + W + 36, Y(0), Y(DIM.H), `${Math.round(DIM.H * 100)} cm`));
  g.push(line(X(0.42) + 4, Y(2.0), ox + W + 42, Y(2.0), 'ext'));
  g.push(line(X(0.42) + 4, Y(0), ox + W + 42, Y(0), 'ext'));
  const w = ox + W + PAD + 30;
  const h = gy + 70;
  return { w, h, svg: g.join(''), title: 'Front elevation' };
}

/** Side elevation: front of the machine is on the left. */
function side() {
  const L = DIM.L * S;
  const H = DIM.H * S;
  const ox = PAD + 0.2 * S;
  const gy = PAD + H;
  const X = (z) => ox + (HL - z) * S;
  const Y = (y) => gy - y * S;
  const g = [];
  g.push(line(PAD - 20, gy, ox + L + PAD, gy, 'floor'));
  for (const z of [-0.86, 0.86]) g.push(rect(X(z) - 8, Y(0.12), 16, 0.12 * S, 'part'));
  g.push(rect(X(HL), Y(1.977), L, (1.977 - 0.12) * S, 'body'));
  // doors
  g.push(rect(X(0.93), Y(1.915), 0.9 * S, 1.745 * S, 'door'));
  g.push(rect(X(-0.03), Y(1.915), 0.9 * S, 1.745 * S, 'door'));
  g.push(rect(X(HL), Y(1.85), L, 0.1 * S, 'blue', { opacity: 0.9 }));
  // panel, pumps, protruding parts (front on the left)
  g.push(rect(X(HL + 0.05), Y(2.0), 0.05 * S, 0.62 * S, 'part'));
  g.push(rect(X(HL + 0.13), Y(1.6), 0.13 * S, 0.16 * S, 'part'));
  g.push(rect(X(HL + 0.14), Y(1.2), 0.14 * S, 0.14 * S, 'part'));
  g.push(rect(X(HL + 0.19), Y(0.56), 0.19 * S, 0.14 * S, 'part'));
  // internals ghost
  g.push(rect(X(0.925), Y(1.23), 0.74 * S, 0.2 * S, 'ghost'));
  g.push(rect(X(-0.0), Y(1.255), 0.42 * S, 0.25 * S, 'ghost'));
  g.push(rect(X(-0.28), Y(0.67), 0.5 * S, 0.34 * S, 'ghost'));
  g.push(text(X(0.55), Y(1.0), 'freezing cylinder (schematic)', 'ghost-txt', { 'text-anchor': 'middle' }));
  g.push(text(X(-0.52), Y(0.47), 'compressor', 'ghost-txt', { 'text-anchor': 'middle' }));
  // dims
  g.push(arrowH(X(HL), X(-HL), gy + 34, `${Math.round(DIM.L * 100)} cm`));
  g.push(line(X(HL), gy + 4, X(HL), gy + 40, 'ext'));
  g.push(line(X(-HL), gy + 4, X(-HL), gy + 40, 'ext'));
  g.push(arrowV(ox + L + 36, Y(0), Y(DIM.H), `${Math.round(DIM.H * 100)} cm`));
  g.push(line(X(-HL) + 4, Y(2.0), ox + L + 42, Y(2.0), 'ext'));
  g.push(line(X(-HL) + 4, Y(0), ox + L + 42, Y(0), 'ext'));
  g.push(text(X(HL + 0.05) - 6, Y(2.0) - 10, 'FRONT', 'lbl', { 'text-anchor': 'start' }));
  g.push(text(X(-HL), Y(2.0) - 10, 'REAR', 'lbl', { 'text-anchor': 'end' }));
  const w = ox + L + PAD + 30;
  const h = gy + 70;
  return { w, h, svg: g.join(''), title: 'Side elevation' };
}

/** Plan view: front of the machine is at the bottom. */
function top() {
  const L = DIM.L * S;
  const W = DIM.W * S;
  const ox = PAD + 0.5 * S;
  const oy = PAD;
  const X = (x) => ox + (x + HW) * S;
  const Yf = (z) => oy + (z + HL) * S; // front (+z) at the bottom of the plan
  const g = [];
  g.push(rect(X(-HW), Yf(-HL), W, L, 'body'));
  g.push(rect(X(-0.46), Yf(HL), 0.3 * S, 0.05 * S, 'part'));
  g.push(rect(X(-0.03), Yf(HL), 0.14 * S, 0.14 * S, 'part'));
  g.push(circle(X(0.0), Yf(HL + 0.04), 0.135 * S * 0.5 + 6, 'part2'));
  g.push(rect(X(-0.11), Yf(HL), 0.19 * S, 0.19 * S, 'part'));
  g.push(rect(X(-0.02), Yf(HL + 0.17), 0.34 * S, 0.026 * S, 'part'));
  for (const fx of [-0.345, 0.345])
    for (const fz of [-0.86, 0.86]) g.push(circle(X(fx), Yf(fz), 0.04 * S, 'ghost'));
  g.push(line(X(-HW), Yf(0), X(HW), Yf(0), 'seam'));
  g.push(rect(X(-0.115), Yf(-0.45), 0.23 * S, 1.4 * S, 'ghost'));
  g.push(text(X(0), Yf(-0.1), 'cylinder + drive (schematic)', 'ghost-txt', { 'text-anchor': 'middle' }));
  g.push(arrowH(X(-HW), X(HW), oy - 24, `${Math.round(DIM.W * 100)} cm`));
  g.push(line(X(-HW), oy - 4, X(-HW), oy - 30, 'ext'));
  g.push(line(X(HW), oy - 4, X(HW), oy - 30, 'ext'));
  g.push(arrowV(X(HW) + 44, Yf(-HL), Yf(HL), `${Math.round(DIM.L * 100)} cm`));
  g.push(line(X(HW) + 4, Yf(-HL), X(HW) + 50, Yf(-HL), 'ext'));
  g.push(line(X(HW) + 4, Yf(HL), X(HW) + 50, Yf(HL), 'ext'));
  g.push(text(X(0), Yf(HL) + 60, 'FRONT', 'lbl', { 'text-anchor': 'middle' }));
  const w = X(HW) + PAD + 30;
  const h = Yf(HL) + 80;
  return { w, h, svg: g.join(''), title: 'Plan view' };
}

export function renderDrawings() {
  const views = [front(), side(), top()];
  return views
    .map((v, i) => {
      const id = `drawing-${i}`;
      return `<figure class="fig">
        <figcaption><span>${v.title}</span><button class="dl" data-target="${id}" data-name="${v.title.toLowerCase().replace(/\s+/g, '-')}">Download SVG</button></figcaption>
        ${wrap(v.w, v.h, v.svg, `${v.title} of Hoyer Frigus SF1200-N1 with dimensions`, id)}
      </figure>`;
    })
    .join('');
}

/** Inline the CSS-variable colours so an exported SVG renders standalone. */
export function exportSvg(id) {
  const svg = document.getElementById(id);
  const clone = svg.cloneNode(true);
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  const css = `
    .body{fill:${v('--d-body')};stroke:${v('--d-line')};stroke-width:1.5}
    .part{fill:${v('--d-part')};stroke:${v('--d-line')};stroke-width:1.2}
    .part2{fill:none;stroke:${v('--d-line')};stroke-width:1.2}
    .door{fill:none;stroke:${v('--d-line')};stroke-width:1;stroke-dasharray:4 3}
    .ghost{fill:none;stroke:${v('--d-ghost')};stroke-width:1;stroke-dasharray:3 3}
    .ghost-txt{fill:${v('--d-ghost')};font:11px sans-serif}
    .blue{fill:#1458b8}.stripe{fill:#fff;font:italic 700 13px sans-serif}
    .screen{fill:#a9c4d8;stroke:${v('--d-line')}}.btn{fill:#0f8a4a}.estop{fill:#d8201a}
    .pipe{fill:none;stroke:${v('--d-line')};stroke-width:5;stroke-linecap:round}
    .plate{fill:#d3d8dd;stroke:${v('--d-line')}}.plate-txt{fill:#111;font:700 10px sans-serif}
    .floor{stroke:${v('--d-line')};stroke-width:2}.seam{stroke:${v('--d-line')};stroke-dasharray:6 4}
    .dim,.ext{stroke:${v('--d-dim')};stroke-width:1.2}.ext{stroke-width:.8}
    .arrow{fill:${v('--d-dim')}}.dimtxt{fill:${v('--d-dim')};font:700 14px sans-serif}
    .lbl{fill:${v('--d-line')};font:700 11px sans-serif;letter-spacing:.1em}`;
  clone.insertAdjacentHTML('afterbegin', `<style>${css}</style><rect width="100%" height="100%" fill="${v('--d-bg')}"/>`);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(clone);
}
