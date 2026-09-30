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
function edgePrism(p, q, E, w, h, col, z, capQ = true) {
  const [su, sv] = E.side, lo = [p[0] - su * w, p[1] - sv * w], ro = [q[0] - su * w, q[1] - sv * w];
  const li = [p[0] + su * w, p[1] + sv * w], ri = [q[0] + su * w, q[1] + sv * w];
  const P = (pt, up) => edgeS(pt[0], pt[1], up, z);
  poly([P(li, 0), P(ri, 0), P(ri, h), P(li, h)], C(shade(col, E.along[0] ? 0 : -0.16)));        // lange Seite
  if (capQ) poly([P(ri, 0), P(ro, 0), P(ro, h), P(ri, h)], C(shade(col, E.along[0] ? -0.16 : 0)));   // vorderes Ende (nicht am Bogen)
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
// Stück in beliebiger Richtung (für den Bogen runder Ecken): Seite zum Betrachter, vorderes Ende, Oberseite
function segPrism(p, q, w, h, col, z) {
  const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(d[0], d[1]) || 1, a = [d[0] / L, d[1] / L];
  let n = [-a[1], a[0]]; if (n[0] + n[1] < 0) n = [-n[0], -n[1]];
  const off = (pt, s) => [pt[0] + n[0] * w * s, pt[1] + n[1] * w * s], P = (pt, up) => edgeS(pt[0], pt[1], up, z);
  const li = off(p, 1), ri = off(q, 1), lo = off(p, -1), ro = off(q, -1), sh = -0.16 * Math.abs(n[0]) / (Math.abs(n[0]) + Math.abs(n[1]));
  const [f0, f1] = a[0] + a[1] > 0 ? [ri, ro] : [li, lo];
  poly([P(f0, 0), P(f1, 0), P(f1, h), P(f0, h)], C(shade(col, -0.16 - sh)));
  poly([P(li, 0), P(ri, 0), P(ri, h), P(li, h)], C(shade(col, sh)));
  poly([P(lo, h), P(ro, h), P(ri, h), P(li, h)], C(shade(col, 0.14)));
}
// Viertelkreis einer runden Ecke: ein durchgehendes Stück – erst die sichtbaren Seitenwände (von hinten nach vorn), dann
// eine einzige Oberseite (so gibt es keine Stufen und keine Fugen). Innenseite einer Wegkurve: Belag bis an den Bogen.
function drawArc(rc, look, z) {
  if (rc.outWeg != null) {
    const lk = PATH_LOOK[styleDef('weg', rc.outWeg).id], pts = roundArc(rc, 10);
    if (lk) poly([...pts, rc.V].map(p => edgeS(p[0], p[1], 0, z)), C(lk.fill));
  }
  if (rc.b === 'zaun') { drawFence({ pts: roundArc(rc, 12) }, look, rc.style, false, z, false); return; }   // Pfosten haben die geraden Stücke
  const n = 10, pts = roundArc(rc, n), c = [rc.V[0] + rc.du * ROUND_R, rc.V[1] + rc.dv * ROUND_R], w = look.w, h = look.h;
  const off = (p, s) => { const d = [p[0] - c[0], p[1] - c[1]], L = Math.hypot(d[0], d[1]) || 1; return [p[0] + d[0] / L * w * s, p[1] + d[1] / L * w * s]; };
  const outer = pts.map(p => off(p, 1)), inner = pts.map(p => off(p, -1)), P = (pt, up) => edgeS(pt[0], pt[1], up, z), walls = [];
  for (let s = 0; s < n; s++) for (const [side, sg] of [[outer, 1], [inner, -1]]) {
    const m = lerp2(pts[s], pts[s + 1], 0.5), d = [(m[0] - c[0]) * sg, (m[1] - c[1]) * sg];
    if (d[0] + d[1] <= 0) continue;                                // Wand zeigt vom Betrachter weg
    const L = Math.hypot(d[0], d[1]) || 1;
    walls.push([m[0] + m[1], side[s], side[s + 1], -0.16 * Math.abs(d[0]) / (Math.abs(d[0]) + Math.abs(d[1]) || 1)]);
  }
  walls.sort((A, B) => A[0] - B[0]);
  for (const [, a, b, sh] of walls) poly([P(a, 0), P(b, 0), P(b, h), P(a, h)], C(shade(look.col, sh)));
  if (rc.b === 'mauer') wallJoints(walls.map(W => [W[1], W[2]]), look, h, z, P);
  poly([...outer.map(p => P(p, h)), ...inner.slice().reverse().map(p => P(p, h))], C(shade(look.col, 0.14)));
  if (rc.b === 'hecke') hedgeTop(pts, look, h, z, rc.ka.length);
}
// Mauerfugen auf sichtbaren Wandstücken ([a, b] in Feld-Koordinaten): Lagerfugen durchgehend, Stoßfugen je Länge versetzt
function wallJoints(segs, look, h, z, P) {
  g.strokeStyle = C(look.joint); g.lineWidth = 0.5 * z; g.beginPath();
  const rows = look.bricks ? [1 / 3, 2 / 3] : [0.45];
  let d0 = 0;
  for (const [a, b] of segs) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (const f of rows) { g.moveTo(...P(a, h * f)); g.lineTo(...P(b, h * f)); }
    const step = look.bricks ? 0.25 : 0.3, nrow = look.bricks ? 3 : 2;
    for (let r = 0; r < nrow; r++) {
      const off = (r % 2 ? 0.5 : 0) * step, f0 = look.bricks ? r / 3 : (r ? 0.45 : 0), f1 = look.bricks ? (r + 1) / 3 : (r ? 1 : 0.45);
      for (let d = Math.ceil((d0 - off) / step) * step + off; d < d0 + L; d += step) {
        const m = lerp2(a, b, (d - d0) / (L || 1));
        g.moveTo(...P(m, h * f0)); g.lineTo(...P(m, h * f1));
      }
    }
    d0 += L;
  }
  g.stroke();
}
// Hecke oben: runde Buckel im gleichen Abstand (Buchs: Kugeln, Blütenhecke: Blüten) entlang einer Punktlinie
function hedgeTop(pts, look, h, z, seed) {
  const cum = [0];
  for (let s = 1; s < pts.length; s++) cum.push(cum[s - 1] + Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]));
  const total = cum[cum.length - 1], n = Math.max(1, Math.round(total * 5));
  for (let i = 0; i < n; i++) {
    const d = (i + 0.5) / n * total; let s = 1; while (s < pts.length - 1 && cum[s] < d) s++;
    const m = lerp2(pts[s - 1], pts[s], (d - cum[s - 1]) / (cum[s] - cum[s - 1] || 1)), [x, y] = edgeS(m[0], m[1], h, z);
    if (look.balls) circle(x, y - 1.2 * z, 2.6 * z, C(shade(look.col, 0.1)));
    else circle(x, y + 0.4 * z, 2.1 * z, C(shade(look.col, 0.14)));
    if (look.flowers) circle(x + (i % 2 ? 1.2 : -1) * z, y - 0.6 * z, 0.9 * z, C(look.flowers[(i + (seed % 3)) % look.flowers.length]));
  }
}
function drawEdge(k, e, z, now) {
  const E = edgeEnds(k), look = (EDGE_LOOK[e.b] || {})[e.style] || Object.values(EDGE_LOOK[e.b])[0], gate = isGate(k);
  const w = look.w || 0, h = look.h, { dir, i, j } = edgeParse(k), [au, av] = E.along;
  // runde Ecke (Weg innen): das Stück hört vor dem Bogen auf, das waagerechte Stück zeichnet den Bogen mit
  const rcP = !gate && roundCorner(i, j), rcQ = !gate && roundCorner(i + au, j + av);
  const onP = rcP && (rcP.ka === k || rcP.kb === k), onQ = rcQ && (rcQ.ka === k || rcQ.kb === k);
  if (e.b === 'zaun') {
    const Ez = { ...E, p: onP ? [E.p[0] + au * ROUND_R, E.p[1] + av * ROUND_R] : E.p, q: onQ ? [E.q[0] - au * ROUND_R, E.q[1] - av * ROUND_R] : E.q };
    if (onP && rcP.ka === k) drawArc(rcP, look, z);
    drawFence(Ez, look, e.style, gate, z);
    if (onQ && rcQ.ka === k) drawArc(rcQ, look, z);
    return;
  }
  // Ecke „┌“: das waagerechte Stück 'a' i,j wird vor diesem senkrechten gezeichnet und übernimmt die Ecke – dieses beginnt
  // erst hinter ihm (sonst malt es seine Seitenwand über das andere Stück)
  const ao = dir === 'b' && state.edges.get('a' + i + ',' + j), aw = ao && ao.b !== 'zaun' ? ((EDGE_LOOK[ao.b] || {})[ao.style] || Object.values(EDGE_LOOK[ao.b])[0]).w : 0;
  const ext0 = onP ? -ROUND_R : aw ? -aw : edgeJoins(k, e.b, i, j) ? w : 0, ext1 = onQ ? -ROUND_R : edgeJoins(k, e.b, i + au, j + av) ? w : 0;
  const p = [E.p[0] - au * ext0, E.p[1] - av * ext0], q = [E.q[0] + au * ext1, E.q[1] + av * ext1];
  if (onP && rcP.ka === k) drawArc(rcP, look, z);                 // Bogen hinten: vor dem Stück zeichnen
  if (gate) {                                                   // Durchgang: bis an den Weg, innen ein Pfeiler bzw. rundes Ende
    for (const [a, b] of [[p, lerp2(E.p, E.q, GATE_CUT)], [lerp2(E.p, E.q, 1 - GATE_CUT), q]]) edgePrism(a, b, E, w, h, look.col, z);
    for (const t of [GATE_CUT, 1 - GATE_CUT]) {
      const m = lerp2(E.p, E.q, t), d = w * 1.25;
      if (e.b === 'mauer') edgePrism([m[0] - au * d, m[1] - av * d], [m[0] + au * d, m[1] + av * d], E, d, h + 2.5, look.col, z);
      else { const [x, y] = edgeS(m[0], m[1], h * 0.6, z); circle(x, y, (w * TW * 0.55 + 1) * z, C(shade(look.col, 0.08))); }
    }
    return;
  }
  edgePrism(p, q, E, w, h, look.col, z, !onQ);
  if (onQ && rcQ.ka === k) drawArc(rcQ, look, z);                 // Bogen vorn: nach dem Stück
  if (e.b === 'hecke') { hedgeTop([p, q], look, h, z, k.length); return; }
  wallJoints([[[p[0] + E.side[0] * w, p[1] + E.side[1] * w], [q[0] + E.side[0] * w, q[1] + E.side[1] * w]]], look, h, z, (pt, up) => edgeS(pt[0], pt[1], up, z));
}
// Zaun: Pfosten an beiden Enden, dazwischen je nach Stil Latten, Staketen, Flechtwerk, Gitter, Stäbe oder Glas.
// Läuft an einer Punktlinie entlang (E.pts: auch der Bogen einer runden Ecke), Latten im gleichen Abstand je Länge.
function drawFence(E, look, style, gate, z, posts = true) {
  const h = look.h, col = look.col, dark = shade(col, -0.25), pts = E.pts || [E.p, E.q];
  const post = (pt, hh = h + 1) => { const [x, y] = edgeS(pt[0], pt[1], 0, z); g.strokeStyle = C(style === 'glas' ? '#9aa3ad' : dark); g.lineWidth = 1.6 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - hh * z); g.stroke(); };
  if (gate) {                                                   // Tor: kurzes Stück bis an den Weg, dort Torpfosten
    for (const [t0, t1] of [[0, GATE_CUT], [1 - GATE_CUT, 1]]) drawFence({ p: lerp2(E.p, E.q, t0), q: lerp2(E.p, E.q, t1) }, look, style, false, z);
    for (const t of [GATE_CUT, 1 - GATE_CUT]) post(lerp2(E.p, E.q, t), h + 2.5);
    return;
  }
  const cum = [0];
  for (let s = 1; s < pts.length; s++) cum.push(cum[s - 1] + Math.hypot(pts[s][0] - pts[s - 1][0], pts[s][1] - pts[s - 1][1]));
  const total = cum[cum.length - 1] || 1;
  const ptAt = t => { const d = t * total; let s = 1; while (s < pts.length - 1 && cum[s] < d) s++; const L = cum[s] - cum[s - 1] || 1; return lerp2(pts[s - 1], pts[s], (d - cum[s - 1]) / L); };
  const at = (t, up) => { const m = ptAt(t); return edgeS(m[0], m[1], up, z); };
  const S = (p, up) => edgeS(p[0], p[1], up, z);
  const line = (a, b, c, w) => { g.strokeStyle = C(c); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); };
  const rail = (up, c, w) => { g.strokeStyle = C(c); g.lineWidth = w * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...S(p, up)) : g.moveTo(...S(p, up))); g.stroke(); };
  const panel = (up0, up1) => poly([...pts.map(p => S(p, up0)), ...pts.slice().reverse().map(p => S(p, up1))], C(col));
  if (posts) { post(pts[0]); post(pts[pts.length - 1]); }
  const n = Math.max(2, Math.round(total * 7));                  // Latten/Stäbe je Länge wie beim geraden Stück
  if (style === 'weide') {
    panel(1, h);
    for (let i = 0; i < 4; i++) rail(1.5 + i * (h - 2) / 3, shade(col, -0.2), 0.5);
    return;
  }
  if (style === 'glas') {
    g.globalAlpha = 0.4; panel(1, h); g.globalAlpha = 1;
    rail(h, '#9aa3ad', 0.9);
    line(at(0.2, h * 0.3), at(0.35, h * 0.8), '#ffffff', 0.6);
    return;
  }
  if (style === 'gitter') {
    rail(h, col, 0.8); rail(1, col, 0.8);
    for (let i = 1; i < Math.round(n * 1.4); i++) { const t = i / Math.round(n * 1.4); line(at(t, 1), at(t, h), col, 0.35); }
    for (const f of [h * 0.4, h * 0.7]) rail(f, col, 0.35);
    return;
  }
  if (style === 'eisen') {
    rail(h - 1.5, col, 0.7); rail(2, col, 0.7);
    const m = Math.round(n * 8 / 7);
    for (let i = 1; i < m; i++) { const t = i / m; line(at(t, 0.5), at(t, h), col, 0.6); const [x, y] = at(t, h); poly([[x - 0.9 * z, y + 0.6 * z], [x + 0.9 * z, y + 0.6 * z], [x, y - 1.6 * z]], C(col)); }
    return;
  }
  // Holz: zwei Querlatten, davor die Latten (Staketen spitz und weiß)
  rail(h * 0.35, shade(col, -0.12), 1);
  rail(h * 0.75, shade(col, -0.12), 1);
  for (let i = 1; i < n; i++) {
    const t = i / n, [x0, y0] = at(t, 0.3), [x1, y1] = at(t, style === 'staketen' ? h - 1 : h - 0.5);
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
