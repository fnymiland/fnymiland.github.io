'use strict';
// ---------------------------------------------------------------------------
// Linien auf Feldkanten (Block 41): Hecke, Zaun, Mauer. Jedes Feld zeichnet in render() seine beiden hinteren Kanten
// ('a' x,y und 'b' x,y) direkt vor sich selbst – so stehen Linien richtig hinter und vor Häusern und Bäumen.
// ---------------------------------------------------------------------------
const EDGE_LOOK = {
  hecke: {
    niedrig: { h: 6, w: 0.09, col: '#5aa84f' },
    hoch: { h: 11, w: 0.11, col: '#3f8f43' },
    buchs: { h: 6.5, w: 0.1, col: '#2f7a3a', balls: true },
    bluete: { h: 8, w: 0.1, col: '#58ad52', flowers: ['#f28cb1', '#ffd23f', '#ffffff', '#c3a8e6'] },
  },
  mauer: {
    backstein: { h: 7, w: 0.08, col: '#b5654a', joint: '#e6c9ae', bricks: true },
    trocken: { h: 6, w: 0.1, col: '#c9bfa8', joint: '#a39880', stones: true },
    naturstein: { h: 7, w: 0.09, col: '#a9a49a', joint: '#827d74', stones: true },
    klinker: { h: 7, w: 0.08, col: '#a95a43', joint: '#7e3f2e', bricks: true },
    terrakotta: { h: 7, w: 0.08, col: '#d99a73', joint: '#f0cdb4', bricks: true },
    kopf: { h: 6.5, w: 0.09, col: '#cfc8bb', joint: '#a8a092', stones: true },
  },
  zaun: {
    latten: { h: 8, col: '#c98d5c' },
    staketen: { h: 8, col: '#fbf7ef' },
    weide: { h: 7, col: '#a07850' },
    gitter: { h: 9, col: '#9aa3ad' },
    eisen: { h: 9, col: '#3e3e4a' },
    glas: { h: 9, col: '#bfe6f7' },
  },
};
// Endpunkte einer Kante in Feld-Koordinaten und ihre Richtung
function edgeEnds(k) {
  const { dir, i, j } = edgeParse(k);
  return dir === 'a' ? { p: [i - 0.5, j - 0.5], q: [i + 0.5, j - 0.5], along: [1, 0], side: [0, 1] }
    : { p: [i - 0.5, j - 0.5], q: [i - 0.5, j + 0.5], along: [0, 1], side: [1, 0] };
}
// Punkt auf dem Bildschirm: Feld-Koordinate (u, v) und Höhe (Pixel bei Zoom 1)
let EDGE_PROJ = null;                 // Vorschaubild: eigene Projektion statt der Kamera
const edgeS = (u, v, up, z) => { const s = EDGE_PROJ ? EDGE_PROJ(u, v) : toScreen(u, v); return [s.x, s.y - up * z]; };
// Quader entlang der Kante (Hecke, Mauer, Pfeiler): sichtbar sind die Seite zum Betrachter (+side), das vordere Ende
// (+along) und die Oberseite
function edgePrism(p, q, E, w, h, col, z) {
  const [su, sv] = E.side, lo = [p[0] - su * w, p[1] - sv * w], ro = [q[0] - su * w, q[1] - sv * w];
  const li = [p[0] + su * w, p[1] + sv * w], ri = [q[0] + su * w, q[1] + sv * w];
  const P = (pt, up) => edgeS(pt[0], pt[1], up, z);
  poly([P(li, 0), P(ri, 0), P(ri, h), P(li, h)], C(shade(col, E.along[0] ? 0 : -0.16)));        // lange Seite
  poly([P(ri, 0), P(ro, 0), P(ro, h), P(ri, h)], C(shade(col, E.along[0] ? -0.16 : 0)));        // vorderes Ende
  poly([P(lo, h), P(ro, h), P(ri, h), P(li, h)], C(shade(col, 0.14)));                         // oben
  return { face: [P(li, 0), P(ri, 0), P(ri, h), P(li, h)] };
}
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
// Trifft an einem Eckpunkt eine andere Linie derselben Art, läuft das Stück um seine halbe Breite weiter – so schließt
// sich die Außenecke (sonst fehlte dort ein Viereck)
function edgeJoins(k, b, vx, vy) {
  return ['a' + (vx - 1) + ',' + vy, 'a' + vx + ',' + vy, 'b' + vx + ',' + (vy - 1), 'b' + vx + ',' + vy]
    .some(o => o !== k && (state.edges.get(o) || {}).b === b);
}
// Durchgang: die Linie hört genau am Rand des Wegs auf (Weg-Band EDGE_W), nicht mitten im Gras
const GATE_CUT = 0.5 - EDGE_W;
function drawEdge(k, e, z, now) {
  const E = edgeEnds(k), look = (EDGE_LOOK[e.b] || {})[e.style] || Object.values(EDGE_LOOK[e.b])[0], gate = isGate(k);
  if (e.b === 'zaun') { drawFence(E, look, e.style, gate, z); return; }
  const w = look.w, h = look.h, { i, j } = edgeParse(k), [au, av] = E.along;
  const ext0 = edgeJoins(k, e.b, i, j) ? w : 0, ext1 = edgeJoins(k, e.b, i + au, j + av) ? w : 0;
  const p = [E.p[0] - au * ext0, E.p[1] - av * ext0], q = [E.q[0] + au * ext1, E.q[1] + av * ext1];
  if (gate) {                                                   // Durchgang: bis an den Weg, innen ein Pfeiler bzw. rundes Ende
    for (const [a, b] of [[p, lerp2(E.p, E.q, GATE_CUT)], [lerp2(E.p, E.q, 1 - GATE_CUT), q]]) edgePrism(a, b, E, w, h, look.col, z);
    for (const t of [GATE_CUT, 1 - GATE_CUT]) {
      const m = lerp2(E.p, E.q, t), d = w * 1.25;
      if (e.b === 'mauer') edgePrism([m[0] - au * d, m[1] - av * d], [m[0] + au * d, m[1] + av * d], E, d, h + 2.5, look.col, z);
      else { const [x, y] = edgeS(m[0], m[1], h * 0.6, z); circle(x, y, (w * TW * 0.55 + 1) * z, C(shade(look.col, 0.08))); }
    }
    return;
  }
  const { face } = edgePrism(p, q, E, w, h, look.col, z);
  if (e.b === 'hecke') {
    // Blätter: ein paar runde Buckel oben, Buchs als Kugeln, Blüten als Punkte
    const n = 5;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, m = lerp2(E.p, E.q, t), [x, y] = edgeS(m[0], m[1], h, z);
      if (look.balls) circle(x, y - 1.2 * z, 2.6 * z, C(shade(look.col, 0.1)));
      else circle(x, y + 0.4 * z, 2.1 * z, C(shade(look.col, 0.14)));
      if (look.flowers) circle(x + (i % 2 ? 1.2 : -1) * z, y - 0.6 * z, 0.9 * z, C(look.flowers[(i + (k.length % 3)) % look.flowers.length]));
    }
    return;
  }
  // Mauer: Fugen auf der sichtbaren langen Seite
  const [a0, b0, b1, a1] = face, at = (t, f) => [a0[0] + (b0[0] - a0[0]) * t, a0[1] + (b0[1] - a0[1]) * t - (a0[1] - a1[1]) * f];
  g.strokeStyle = C(look.joint); g.lineWidth = 0.5 * z;
  g.beginPath();
  if (look.bricks) {
    for (const f of [1 / 3, 2 / 3]) { const s = at(0, f), t = at(1, f); g.moveTo(...s); g.lineTo(...t); }
    for (let row = 0; row < 3; row++) for (let c = 0; c < 4; c++) {
      const t = (c + (row % 2 ? 0.5 : 0.25)) / 4, s = at(t, row / 3), u = at(t, (row + 1) / 3);
      g.moveTo(...s); g.lineTo(...u);
    }
  } else {
    for (const f of [0.45]) { const s = at(0, f), t = at(1, f); g.moveTo(...s); g.lineTo(...t); }
    for (const [t, f0, f1] of [[0.2, 0, 0.45], [0.55, 0, 0.45], [0.35, 0.45, 1], [0.78, 0.45, 1]]) { g.moveTo(...at(t, f0)); g.lineTo(...at(t, f1)); }
  }
  g.stroke();
}
// Zaun: Pfosten an beiden Enden, dazwischen je nach Stil Latten, Staketen, Flechtwerk, Gitter, Stäbe oder Glas
function drawFence(E, look, style, gate, z) {
  const h = look.h, col = look.col, dark = shade(col, -0.25);
  const post = (pt, hh = h + 1) => { const [x, y] = edgeS(pt[0], pt[1], 0, z); g.strokeStyle = C(style === 'glas' ? '#9aa3ad' : dark); g.lineWidth = 1.6 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - hh * z); g.stroke(); };
  if (gate) {                                                   // Tor: kurzes Stück bis an den Weg, dort Torpfosten
    for (const [t0, t1] of [[0, GATE_CUT], [1 - GATE_CUT, 1]]) drawFence({ ...E, p: lerp2(E.p, E.q, t0), q: lerp2(E.p, E.q, t1) }, look, style, false, z);
    for (const t of [GATE_CUT, 1 - GATE_CUT]) post(lerp2(E.p, E.q, t), h + 2.5);
    return;
  }
  post(E.p); post(E.q);
  const at = (t, up) => { const m = lerp2(E.p, E.q, t); return edgeS(m[0], m[1], up, z); };
  const line = (a, b, c, w) => { g.strokeStyle = C(c); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
  if (style === 'weide') {
    poly([at(0.04, 1), at(0.96, 1), at(0.96, h), at(0.04, h)], C(col));
    for (let i = 0; i < 4; i++) line(at(0.04, 1.5 + i * (h - 2) / 3), at(0.96, 1.5 + i * (h - 2) / 3), shade(col, -0.2), 0.5);
    return;
  }
  if (style === 'glas') {
    g.globalAlpha = 0.4; poly([at(0.03, 1), at(0.97, 1), at(0.97, h), at(0.03, h)], C(col)); g.globalAlpha = 1;
    line(at(0.03, h), at(0.97, h), '#9aa3ad', 0.9);
    line(at(0.2, h * 0.3), at(0.35, h * 0.8), '#ffffff', 0.6);
    return;
  }
  if (style === 'gitter') {
    line(at(0, h), at(1, h), col, 0.8); line(at(0, 1), at(1, 1), col, 0.8);
    for (let i = 1; i < 10; i++) line(at(i / 10, 1), at(i / 10, h), col, 0.35);
    for (const f of [h * 0.4, h * 0.7]) line(at(0, f), at(1, f), col, 0.35);
    return;
  }
  if (style === 'eisen') {
    line(at(0, h - 1.5), at(1, h - 1.5), col, 0.7); line(at(0, 2), at(1, 2), col, 0.7);
    for (let i = 1; i < 8; i++) { const t = i / 8; line(at(t, 0.5), at(t, h), col, 0.6); const [x, y] = at(t, h); poly([[x - 0.9 * z, y + 0.6 * z], [x + 0.9 * z, y + 0.6 * z], [x, y - 1.6 * z]], C(col)); }
    return;
  }
  // Holz: zwei Querlatten, davor die Latten (Staketen spitz und weiß)
  line(at(0, h * 0.35), at(1, h * 0.35), shade(col, -0.12), 1);
  line(at(0, h * 0.75), at(1, h * 0.75), shade(col, -0.12), 1);
  for (let i = 1; i < 7; i++) {
    const t = i / 7, [x0, y0] = at(t, 0.3), [x1, y1] = at(t, style === 'staketen' ? h - 1 : h - 0.5);
    line([x0, y0], [x1, y1], col, 1.3);
    if (style === 'staketen') poly([[x1 - 0.65 * z, y1], [x1 + 0.65 * z, y1], [x1, y1 - 1.6 * z]], C(col));
  }
}
// Alle Linien an den hinteren Kanten eines Felds (vor dem Feld selbst zeichnen)
function drawEdgesAt(x, y, z, now) {
  if (!state.edges.size) return;
  for (const k of ['a' + x + ',' + y, 'b' + x + ',' + y]) { const e = state.edges.get(k); if (e) drawEdge(k, e, z, now); }
}
// Vorschau/Markierung einer Kante am Boden
function edgeMark(k, col, z, w = 4) {
  const E = edgeEnds(k), a = edgeS(E.p[0], E.p[1], 0, z), b = edgeS(E.q[0], E.q[1], 0, z);
  g.strokeStyle = col; g.lineWidth = w * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
}
