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
    lichter: { h: 9, w: 0.1, col: '#3f8f43', lights: true },
    wilmer: { h: 12, w: 0.14, col: '#5aae54', bushes: true },
    wilmer_bluete: { h: 12, w: 0.14, col: '#5aae54', bushes: true, flowers: ['#f28cb1', '#ffd23f', '#ffffff', '#c3a8e6'] },
    wilmer_licht: { h: 12, w: 0.14, col: '#5aae54', bushes: true, lights: true },
  },
  mauer: {
    backstein: { h: 7, w: 0.1, col: '#b5654a', joint: '#e6c9ae', bricks: true },
    trocken: { h: 6, w: 0.12, col: '#c9bfa8', joint: '#a39880', stones: true },
    naturstein: { h: 7, w: 0.11, col: '#a9a49a', joint: '#827d74', stones: true },
    klinker: { h: 7, w: 0.1, col: '#84402f', joint: '#caa28c', bricks: true },
    terrakotta: { h: 7, w: 0.1, col: '#d99a73', joint: '#f0cdb4', bricks: true },
    kopf: { h: 6.5, w: 0.11, col: '#a89a86', joint: '#7d705f', cobbles: true },
    laternen: { h: 7, w: 0.1, col: '#b5654a', joint: '#e6c9ae', bricks: true, lamps: true },
  },
  zaun: {
    latten: { h: 8, col: '#c98d5c' },
    staketen: { h: 8, col: '#fbf7ef' },
    weide: { h: 7, col: '#a07850' },
    gitter: { h: 9, col: '#9aa3ad' },
    eisen: { h: 9, col: '#3e3e4a' },
    glas: { h: 9, col: '#bfe6f7' },
    lichter: { h: 8, col: '#c98d5c', lights: true },
  },
};
// Aussehen einer Linie. Hecken in Buschfarbe (Block 126): e.col (BUSH_COLS) färbt jede Heckenform; die Wilmerhecke färbt ihre
// Büsche selbst. Ohne Farbe (Grün) bleibt das Grün der Form; dunkle Formen bleiben in jeder Farbe etwas dunkler (HEDGE_TONE)
const HEDGE_TONE = { hoch: -0.12, buchs: -0.2, lichter: -0.12 };
function edgeLook(e) {
  const look = (EDGE_LOOK[e.b] || {})[e.style] || Object.values(EDGE_LOOK[e.b])[0];
  return e.b === 'hecke' && e.col && !look.bushes && BUSH_COLS[e.col] ? { ...look, col: shade(BUSH_COLS[e.col].c[0], HEDGE_TONE[e.style] || 0) } : look;
}
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
function edgeJoins(k, b, vx, vy) {                              // nur quer anschließende Stücke (Ecke, T, Kreuz) –
  const cross = k[0] === 'a' ? ['b' + vx + ',' + (vy - 1), 'b' + vx + ',' + vy] : ['a' + (vx - 1) + ',' + vy, 'a' + vx + ',' + vy];   // in gerader Reihe
  return cross.some(o => (state.edges.get(o) || {}).b === b);                 // nie (sonst ragt ein Stil in den nächsten)
}
// Punkte im festen Abstand (per je Feld) entlang einer Punktlinie, gezählt ab d0 – so stehen sie auf einem Bogen aus
// vielen kurzen Stücken genauso dicht wie auf einem geraden Stück. fn(Punkt, laufende Nummer)
function alongLine(line, per, d0, fn) {
  let at = d0;
  for (let s = 1; s < line.length; s++) {
    const a = line[s - 1], b = line[s], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let m = Math.ceil(at * per - 0.5); (m + 0.5) / per < at + L; m++) fn(lerp2(a, b, ((m + 0.5) / per - at) / (L || 1)), m);
    at += L;
  }
}
// Blütenhecke: Blüten auch an der sichtbaren Seitenwand (Punktlinie am Boden, Höhe h), bunt gemischt
function hedgeSideFlowers(line, look, h, z, seed, d0 = 0) {
  if (!look.flowers) return;
  alongLine(line, 9, d0, (m, i) => {
    const r = hash(i, seed, 7), [x, y] = edgeS(m[0], m[1], h * (0.25 + 0.6 * r), z);
    circle(x, y, 0.85 * z, C(look.flowers[Math.floor(hash(i, seed, 11) * look.flowers.length)]));
  });
}
// Wilmerhecke (Block 86): kleine runde Büsche wie der Deko-Busch dicht an dicht entlang einer Punktlinie, von hinten nach vorn
const BUSH_PER = 4;                                          // Büsche je Feldkante – ganzzahlig, sonst Lücke am Übergang (Block 86d)
function bushRow(line, look, z, seed, d0 = 0, id = null) {
  const at = [];
  alongLine(line, BUSH_PER, d0, (m, i) => at.push([m, i]));
  drawBushes(at, look, z, seed, id);
}
// Büsche auf einer geraden Kante k an festen Stellen (0, 1, 2 … / BUSH_PER), nur zwischen t0 und t1. Auf jedem Eckpunkt ein
// Busch: Ecken werden ein sauberes „L“, Enden schließen am Punkt ab, überall derselbe Abstand (Block 86f). Wer ihn zeichnet,
// hängt an der Reihenfolge (Block 86g): Stücke, die am Punkt beginnen (a/b am Punkt, Feld davor), kommen nach denen, die dort
// enden – also zeichnet ihn das erste beginnende vor seinen Büschen; beginnt dort keins, zeichnet ihn jedes endende als Letztes
const isWilmer = e => !!e && e.b === 'hecke' && (e.style || '').startsWith('wilmer');
const wilmerStart = (vx, vy) => ['a' + vx + ',' + vy, 'b' + vx + ',' + vy].find(o => isWilmer(state.edges.get(o))) || null;   // drawEdgesAt: erst a, dann b
function bushSpan(k, E, t0, t1, look, z, seed) {
  const at = [], [vp, vq] = edgeEndPoints(k);
  for (let m = 0; m <= BUSH_PER; m++) {
    const t = m / BUSH_PER;
    if (t < t0 - 1e-9 || t > t1 + 1e-9) continue;
    if ((m === 0 && wilmerStart(...vp) !== k) || (m === BUSH_PER && wilmerStart(...vq))) continue;
    at.push([lerp2(E.p, E.q, t), m]);
  }
  drawBushes(at, look, z, seed, 'E' + k, (state.edges.get(k) || {}).col || 0);
}
function drawBushes(at, look, z, seed, id = null, col = 0) {
  at.sort((A, B) => A[0][0] + A[0][1] - B[0][0] - B[0][1]);   // von hinten nach vorn
  for (const [m, i] of at) wilmerBush(m, look, z, hash(i, seed, 13), i, id, col);
}
function wilmerBush(m, look, z, r = 0.5, i = 0, id = null, col = 0) {
  // genau der Deko-Busch (gleiche Zeichnung, gleiche Größe decoScale) – so sieht die Hecke aus wie aneinandergereihte Büsche
  const [x, y] = edgeS(m[0], m[1], 0, z), ds = decoScale('busch') * 0.9, k = ds * z;   // wie drawSmallOne (kleine Deko: × 0,9)
  if (!(SPRITES_ON && !SPRITE_PAINT && g === ctx && spriteSmall('busch', 0, x, y, z, 0, 0, 0, 0, col))) {   // weit weg: dasselbe Bildchen wie der Deko-Busch (Block 124); nicht in Vorschaubildern
    g.save(); g.translate(x, y); g.scale(ds, ds);
    try { drawObject('busch', 0, 0, z, 0, 0, 0, 1, { col }); } finally { g.restore(); }   // Buschfarbe (Block 89)
  }
  if (look.lights) {                                               // Lichter (Block 86m): auf jedem Busch derselbe kleine Bogen vorn
    const lit = id ? edgeLit(id) : night > 0.15 && isLive();
    for (const [dx, dy] of [[-4.6, -6.2], [-1.6, -4.6], [1.6, -4.6], [4.6, -6.2]]) {
      const bx = x + dx * k, by = y + dy * k, r = 1.1 * k;
      circle(bx, by, r, lit ? '#fff3b0' : C('#f6edc8'));
      if (lit) glowQuad([[bx - r, by], [bx, by - r], [bx + r, by], [bx, by + r]], 7 * z);
    }
  }
  if (look.flowers) for (let f = 0; f < 3; f++) {
    const a = hash(i, f, 17) * Math.PI * 2, d = 3 + hash(i, f, 19) * 3;
    circle(x + Math.cos(a) * d * k, y - 8 * k + Math.sin(a) * d * 0.7 * k, 1.3 * k, C(look.flowers[Math.floor(hash(i, f, 23) * look.flowers.length)]));
  }

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
    const lk = pathLook(styleDef('weg', rc.outWeg).id), pts = roundArc(rc, 10);
    if (lk) poly([...pts, rc.V].map(p => edgeS(p[0], p[1], 0, z)), C(lk.fill));
  }
  if (rc.b === 'hecke' && look.bushes) { bushRow(roundArc(rc, 12), look, z, rc.ka.length, 0, 'E' + rc.ka); return; }   // (Wilmerhecke rundet nicht, 86e)   // Wilmerhecke im Bogen
  if (rc.b === 'zaun') { const ap = roundArc(rc, 12); drawFence({ pts: ap }, look, rc.style, false, z, [false, false]); fencePost(ap[6], look, rc.style, z); if (look.lights) bulbsAlong(ap, look.h + 0.6, z, 'E' + rc.ka); return; }   // ein Pfosten mitten im Bogen
  const n = 10, pts = roundArc(rc, n), c = [rc.V[0] + rc.du * ROUND_R, rc.V[1] + rc.dv * ROUND_R], w = look.w, h = look.h;
  const off = (p, s) => { const d = [p[0] - c[0], p[1] - c[1]], L = Math.hypot(d[0], d[1]) || 1; return [p[0] + d[0] / L * w * s, p[1] + d[1] / L * w * s]; };
  const outer = pts.map(p => off(p, 1)), inner = pts.map(p => off(p, -1)), P = (pt, up) => edgeS(pt[0], pt[1], up, z), walls = [];
  for (let s = 0; s < n; s++) for (const [side, sg] of [[outer, 1], [inner, -1]]) {
    const m = lerp2(pts[s], pts[s + 1], 0.5), d = [(m[0] - c[0]) * sg, (m[1] - c[1]) * sg];
    if (d[0] + d[1] <= 0) continue;                                // Wand zeigt vom Betrachter weg
    const L = Math.hypot(d[0], d[1]) || 1;
    walls.push([m[0] + m[1], side[s], side[s + 1], -0.16 * Math.abs(d[0]) / (Math.abs(d[0]) + Math.abs(d[1]) || 1), s]);
  }
  walls.sort((A, B) => A[0] - B[0]);
  for (const [, a, b, sh] of walls) { const col = C(shade(look.col, sh)); poly([P(a, 0), P(b, 0), P(b, h), P(a, h)], col); g.strokeStyle = col; g.lineWidth = 0.9; g.lineJoin = 'round'; g.stroke(); }
  if (rc.b === 'mauer') wallJoints(walls.slice().sort((A, B) => A[4] - B[4]).map(W => [W[1], W[2], W[4] * Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])]), look, h, z, P);
  if (rc.b === 'hecke') for (const [, a, b, , s] of walls) hedgeSideFlowers([a, b], look, h, z, rc.ka.length, s * Math.hypot(b[0] - a[0], b[1] - a[1]));
  poly([...outer.map(p => P(p, h)), ...inner.slice().reverse().map(p => P(p, h))], C(shade(look.col, 0.14)));
  if (rc.b === 'hecke') hedgeTop(pts, look, h, z, rc.ka.length);
}
// Mauerfugen auf sichtbaren Wandstücken ([a, b] in Feld-Koordinaten): Lagerfugen durchgehend, Stoßfugen je Länge versetzt
function wallJoints(segs, look, h, z, P) {
  if (look.cobbles) {                                            // Kopfstein: runde Steine in drei Reihen, je Stein etwas heller/dunkler
    let d0 = 0;
    for (const [a, b, s0] of segs) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s0 != null) d0 = s0;
      for (let r = 0; r < 3; r++) alongLine([a, b], 6, d0 + (r % 2) * 0.08, (m, i) => {
        const [x, y] = P(m, h * (r + 0.5) / 3);
        circle(x, y, h / 6.4 * z, C(shade(look.col, (hash(i, r, 5) - 0.5) * 0.3)));
      });
      d0 += L;
    }
    return;
  }
  g.strokeStyle = C(look.joint); g.lineWidth = 0.5 * z; g.beginPath();
  const rows = look.bricks ? [1 / 3, 2 / 3] : [0.45];
  let d0 = 0;
  for (const [a, b, s0] of segs) {                               // s0: Abstand vom Anfang (Bogen), sonst fortlaufend
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s0 != null) d0 = s0;
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
function hedgeTop(pts, look, h, z, seed, id) {
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
  if (look.lights && id) lampions(pts, look, h, z, id);
}
// Lampions oben auf der Hecke: in jeder Richtung und Kurve gleich
function lampions(pts, look, h, z, id) {
  const lit = edgeLit(id);
  alongLine(pts, 3, 0, m => {
    const [x, y] = edgeS(m[0], m[1], h + 1.6, z), r = 1.5 * z;
    if (!lit) circle(x, y + r * 0.9, r * 0.5, C(shade(look.col, -0.2)));          // tags: Schatten auf der Hecke
    circle(x, y, r, C('#f3e6b8'));
    circle(x - r * 0.35, y - r * 0.35, r * 0.35, C('#fffaf0'));
    if (lit) { const d = r * 0.95; glowQuad([[x - d, y], [x, y - d], [x + d, y], [x, y + d]], 12 * z); }   // nachts: leuchtender Kern
  });
}
// Welche von zwei Kanten wird später gezeichnet? (render: Felder nach x+y, dann x)
function lastDrawn(k1, k2) {
  const o = k => { const { i, j } = edgeParse(k); return (i + j) * 1e6 + i; };
  return o(k2) > o(k1) ? k2 : k1;
}
// Lichter (Block 41): brennen nachts, wenn genug Strom da ist (edgeLamps zählt sie wie Laternen)
const edgeLit = id => night > 0.15 && isLive() && !T.rail.power.dark.has(id);
function lampAt(pt, up, z, id) {                                  // kleine Laterne auf Pfeiler, Pfosten oder unter dem Bogen
  const [x, y] = edgeS(pt[0], pt[1], up, z), lit = edgeLit(id);
  const lb = box(x, y, 1.5 * z, 0.8 * z, 3 * z, lit ? '#ffe58a' : '#fff7d6', '#4a4a58', 1.6 * z);
  if (lit) glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 3 * z], [lb.L[0], lb.L[1] - 3 * z]], 24 * z);
}
// Hängelaterne (unter Torbögen): dünne Kette, flache Kappe, runder Glaskörper; nachts leuchtet der Körper
function hangLantern(x, y, z, lit) {
  const cy = y + 4.2 * z, r = 1.25 * z, dark = C('#4a4a58');
  g.strokeStyle = dark; g.lineWidth = 0.35 * z; g.beginPath(); g.moveTo(x, y); g.lineTo(x, cy - 2 * z); g.stroke();
  poly([[x - 1.1 * z, cy - 1.3 * z], [x + 1.1 * z, cy - 1.3 * z], [x + 0.6 * z, cy - 2.1 * z], [x - 0.6 * z, cy - 2.1 * z]], dark);   // Kappe
  circle(x, cy, r, C('#fff3c4'));
  circle(x - r * 0.35, cy - r * 0.35, r * 0.35, C('#fffdf2'));
  poly([[x - 0.5 * z, cy + r * 0.85], [x + 0.5 * z, cy + r * 0.85], [x, cy + r * 1.5]], dark);                                        // kleiner Boden
  if (lit) { const d = r * 0.95; glowQuad([[x - d, cy], [x, cy - d], [x + d, cy], [x, cy + d]], 16 * z); }
}
function bulbsAlong(pts, up, z, id, per = 8) {                    // Lichterkette an einer Punktlinie (gleicher Abstand, auch im Bogen)
  const lit = edgeLit(id);
  alongLine(pts, per, 0, m => bulbAt(edgeS(m[0], m[1], up, z), z, lit));
}
function bulbAt([x, y], z, lit) {
  circle(x, y, 0.8 * z, lit ? '#fff3b0' : C('#e8dcae'));
  if (lit) glowQuad([[x - 1, y - 1], [x + 1, y - 1], [x + 1, y + 1], [x - 1, y + 1]], 8 * z);
}
// Beleuchteter Stil (Lichterkette, Laternen): nur dann Laternen an Enden, Toren und Bögen
const litLook = look => !!(look.lights || look.lamps);
// Heckenende (freies Ende und am Durchgang): rundes Ende über die ganze Höhe, auch bei der hohen Hecke
function hedgeKnob(pt, look, z) {
  if (look.bushes) return;                                          // Wilmerhecke: die Reihe reicht bis ans Ende – kein Busch obendrauf (Block 86e)
  const [x, y] = edgeS(pt[0], pt[1], 0, z), R = (look.w * TW * 0.7 + 1) * z, top = y - look.h * z + R * 0.55, bot = y - R * 0.45, col = C(shade(look.col, -0.06));
  if (bot > top) poly([[x - R, bot], [x + R, bot], [x + R, top], [x - R, top]], col);
  circle(x, bot, R, col); circle(x, top, R, col);
  circle(x - R * 0.3, top - R * 0.35, R * 0.45, C(shade(look.col, 0.14)));
}
// Zaunpfosten (hh: Höhe über dem Boden)
function fencePost(pt, look, style, z, hh = look.h + 1) {
  const [x, y] = edgeS(pt[0], pt[1], 0, z);
  g.strokeStyle = C(style === 'glas' ? '#9aa3ad' : shade(look.col, -0.25)); g.lineWidth = 1.6 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - hh * z); g.stroke();
}
// Quader um einen Punkt (Pfeiler, Deckstein): Seiten +u und +v und oben
function pillarBox(pt, r, h0, h1, col, z) {
  const c = (du, dv, up) => edgeS(pt[0] + du * r, pt[1] + dv * r, up, z);
  poly([c(1, -1, h0), c(1, 1, h0), c(1, 1, h1), c(1, -1, h1)], C(shade(col, -0.16)));
  poly([c(-1, 1, h0), c(1, 1, h0), c(1, 1, h1), c(-1, 1, h1)], C(shade(col, 0)));
  poly([c(-1, -1, h1), c(1, -1, h1), c(1, 1, h1), c(-1, 1, h1)], C(shade(col, 0.16)));
}
// Gemauerter Pfeiler (Mauerende, Tor): deutlich breiter als die Mauer, vom Boden an mit Fugen, oben ein Deckstein.
// Gibt die Höhe der Oberkante zurück.
const PILLAR_UP = 1.6, CAP_UP = 2.4;                             // Block 87c: Enden und Tore gleich, nicht mehr so massiv
const wallPillarR = look => look.w * 1.25;
// Wo die Torpfosten stehen (Anteil der Kante): Mauerpfeiler ganz neben dem Weg (auf der Feldecke), sonst am Wegrand
const gateT = (b, look) => b === 'mauer' ? 0 : GATE_CUT;                     // Mauer: Torpfeiler auf den Feldecken (Block 87c)
// Steht an diesem Eckpunkt ein Torpfeiler einer Mauer (ein Mauer-Durchgang beginnt oder endet hier)? Dann hört jede andere
// Mauer dort am Pfeiler auf, statt in ihn hineinzulaufen (sonst malt sie sich über ihn, Block 87c)
// Rückgabe: halbe Breite des Pfeilers (0 = keiner) – gilt für jede Linie, die dort ankommt (Mauer, Zaun, Hecke)
const mauerGateAt = (vx, vy, k) => ['a' + vx + ',' + vy, 'b' + vx + ',' + vy, 'a' + (vx - 1) + ',' + vy, 'b' + vx + ',' + (vy - 1)]
  .reduce((r, o) => { const n = state.edges.get(o); return o !== k && n && n.b === 'mauer' && isGate(o) ? Math.max(r, wallPillarR(EDGE_LOOK.mauer[n.style] || EDGE_LOOK.mauer.backstein)) : r; }, 0);
function wallPillar(pt, look, z, rMax = Infinity, extra = 0) {     // rMax: am Tor nicht über die Feldecke hinaus; extra: höher
  const r = Math.min(wallPillarR(look), rMax), h = look.h, top = h + PILLAR_UP + extra, c = (du, dv, up) => edgeS(pt[0] + du * r, pt[1] + dv * r, up, z);
  pillarBox(pt, r, 0, top, look.col, z);
  if (look.joint) {                                               // Lagerfugen rundum, Stoßfugen versetzt
    g.strokeStyle = C(look.cobbles ? shade(look.col, -0.2) : look.joint); g.lineWidth = 0.5 * z; g.beginPath();
    const rows = Math.round(top / 2.4);
    for (let i = 1; i < rows; i++) { const up = top * i / rows; g.moveTo(...c(-1, 1, up)); g.lineTo(...c(1, 1, up)); g.lineTo(...c(1, -1, up)); }
    for (let i = 0; i < rows; i++) {
      const u0 = top * i / rows, u1 = top * (i + 1) / rows, f = i % 2 ? 0.5 : 0;
      for (const [a, b] of [[c(-1, 1, 0), c(1, 1, 0)], [c(1, 1, 0), c(1, -1, 0)]]) {
        const t = 0.25 + f * 0.5, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        g.moveTo(x, y - u0 * z); g.lineTo(x, y - u1 * z);
      }
    }
    g.stroke();
  }
  pillarBox(pt, r * 1.12, top, top + CAP_UP - PILLAR_UP, shade(look.col, 0.2), z);
  return top + CAP_UP - PILLAR_UP;
}
// Endstück an einem freien Ende: Mauer Pfeiler mit Deckstein, Zaun dicker Pfosten mit Kappe, Hecke rundes Ende.
// Laternen darauf nur bei beleuchteten Stilen.
function endPiece(b, look, pt, z, id) {
  const h = look.h, lit = litLook(look);
  if (b === 'mauer') { const top = wallPillar(pt, look, z); if (lit) lampAt(pt, top, z, id); return; }
  if (b === 'zaun') {
    const [x, y] = edgeS(pt[0], pt[1], 0, z), top = y - (h + (lit ? 3 : 2)) * z;
    g.strokeStyle = C(shade(look.col, -0.25)); g.lineWidth = 2.4 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, top); g.stroke();
    if (lit) lampAt(pt, h + 3, z, id); else circle(x, top, 1.5 * z, C(shade(look.col, -0.35)));
    return;
  }
  hedgeKnob(pt, look, z);
}
// Torbogen über einem Durchgang: vom einen Pfeiler/Pfosten zum anderen, oben eine Laterne
function drawGateArch(E, e, look, z, k) {
  const gt = gateT(e.b, look), A = lerp2(E.p, E.q, gt), B = lerp2(E.p, E.q, 1 - gt), hb = e.b === 'hecke' ? look.h : e.b === 'mauer' ? look.h + CAP_UP : look.h + 2.5, R = 11 + look.h * 0.2, n = 16;   // R: etwa halbe Torbreite → runder Bogen
  const legs = false;                                             // der Bogen beginnt oben auf Pfosten, Pfeiler bzw. rundem Heckenende
  const pts = [...(legs ? [[...A, 0]] : []), ...Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [...lerp2(A, B, t), hb + Math.sin(Math.PI * t) * R]; }), ...(legs ? [[...B, 0]] : [])];
  const stroke = (col, w, dy = 0) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([u, v, up], i) => { const p = edgeS(u, v, up + dy, z); i ? g.lineTo(...p) : g.moveTo(...p); }); g.stroke(); };
  const each = (step, fn) => pts.forEach(([u, v, up], i) => { if (i % step || up < 1) return; fn(...edgeS(u, v, up, z), i); });
  if (e.arch === 'rosen') {
    stroke('#3f8a3a', 3.4); stroke('#5aa84f', 2.2);
    each(1, (x, y, i) => circle(x + (i % 2 ? 1 : -1) * z, y - 0.4 * z, 1.7 * z, C(i % 3 ? '#e8604f' : '#f28cb1')));
  } else if (e.b === 'mauer') {                                    // gemauerter Bogen: Körper so tief wie die Torpfeiler
    const d = look.w * 0.2, [su, sv] = E.side, th = 3.6;            // ein Ziegelring: wenig Tiefe, von vorn gut sichtbar
    const at = (t, up, s) => { const m = lerp2(A, B, t); return edgeS(m[0] + su * d * s, m[1] + sv * d * s, up, z); };
    const inner = t => hb + Math.sin(Math.PI * t) * (R - th), outer = t => hb + th * 0.55 + Math.sin(Math.PI * t) * (R - th * 0.45);
    const ts = Array.from({ length: n + 1 }, (_, i) => i / n);
    for (let i = 0; i < n; i++) {                                   // Unterseite (Laibung) und Oberseite als Streifen
      const t0 = ts[i], t1 = ts[i + 1];
      if (Math.min(inner(t0), inner(t1)) < hb + 0.6) continue;     // am Fuß liegt der Bogen auf dem Deckstein
      poly([at(t0, inner(t0), -1), at(t1, inner(t1), -1), at(t1, inner(t1), 1), at(t0, inner(t0), 1)], C(shade(look.col, -0.3)));
    }
    for (let i = 0; i < n; i++) {
      const t0 = ts[i], t1 = ts[i + 1], col = C(shade(look.col, -0.1));
      poly([at(t0, outer(t0), -1), at(t1, outer(t1), -1), at(t1, outer(t1), 1), at(t0, outer(t0), 1)], col); g.strokeStyle = col; g.lineWidth = 0.8; g.stroke();
    }
    poly([...ts.map(t => at(t, outer(t), 1)), ...ts.slice().reverse().map(t => at(t, inner(t), 1))], C(look.col));   // Vorderseite
    g.strokeStyle = C(look.joint || shade(look.col, -0.2)); g.lineWidth = 0.5 * z; g.beginPath();
    for (let i = 1; i < n; i += 2) { const t = ts[i]; g.moveTo(...at(t, inner(t), 1)); g.lineTo(...at(t, outer(t), 1)); }
    g.stroke();
  } else if (e.b === 'hecke') {                                    // Rankbogen: dünner Bogen, dicht mit Blättern bewachsen (wie der Rosenbogen)
    stroke('#3f7a37', 3.4); stroke('#4f9a45', 2.2);
    const leaf = ['#3f8f43', '#5aa84f', '#6fbf5a', '#4a9a48'];
    each(1, (x, y, i) => {
      circle(x + (i % 2 ? 1.3 : -1.3) * z, y + 0.3 * z, 1.5 * z, C(leaf[i % 4]));
      circle(x + (i % 2 ? -0.6 : 0.7) * z, y - 1 * z, 1.3 * z, C(leaf[(i + 2) % 4]));
    });
  } else {                                                          // Zaun: zwei Bögen mit Sprossen dazwischen
    const d = shade(look.col, -0.25);
    stroke(d, 2); stroke(d, 1.6, -3);
    g.strokeStyle = C(d); g.lineWidth = 1 * z; g.beginPath(); each(2, (x, y) => { g.moveTo(x, y); g.lineTo(x, y - 3 * z); }); g.stroke();
  }
  if (!litLook(look)) return;
  const top = lerp2(A, B, 0.5), [x, y] = edgeS(top[0], top[1], hb + R - 0.8, z);   // Hängelaterne mittig unter dem Scheitel
  hangLantern(x, y, z, edgeLit('A' + k));
}
function drawEdge(k, e, z, now) {
  const E = edgeEnds(k), look = edgeLook(e), gate = isGate(k);
  const w = look.w || 0, h = look.h, { dir, i, j } = edgeParse(k), [au, av] = E.along;
  // runde Ecke (Weg innen): das Stück hört vor dem Bogen auf, das waagerechte Stück zeichnet den Bogen mit
  const rcP = !gate && roundCorner(i, j), rcQ = !gate && roundCorner(i + au, j + av);
  const onP = rcP && (rcP.ka === k || rcP.kb === k), onQ = rcQ && (rcQ.ka === k || rcQ.kb === k);
  const [vp, vq] = edgeEndPoints(k), endP = !gate && freeEnd(k, ...vp), endQ = !gate && freeEnd(k, ...vq);
  const [vp0, vq0] = edgeEndPoints(k), gateP = mauerGateAt(...vp0, k), gateQ = mauerGateAt(...vq0, k);   // Mauer-Torpfeiler am Ende (Block 87e)
  if (e.b === 'zaun') {
    const sp = onP ? ROUND_R : gateP, sq = onQ ? ROUND_R : gateQ;       // am Torpfeiler einer Mauer: davor aufhören, kein eigener Pfosten
    const Ez = { ...E, p: [E.p[0] + au * sp, E.p[1] + av * sp], q: [E.q[0] - au * sq, E.q[1] - av * sq] };
    // Pfosten: nicht am Bogenanfang (der Bogen hat seinen eigenen) und nicht dort, wo in gerader Reihe ein Tor anschließt
    const nextGate = (x, y) => { const o = dir + x + ',' + y, n = state.edges.get(o); return !!(n && n.b === 'zaun' && isGate(o)); };
    const posts = [!onP && !gateP && !nextGate(i - au, j - av), !onQ && !gateQ && !nextGate(i + au, j + av)];
    if (onP && rcP.ka === k) drawArc(rcP, look, z);
    if (endP) endPiece('zaun', look, E.p, z, 'P' + vp.join());
    drawFence(Ez, look, e.style, gate, z, gate ? [false, false] : posts);
    if (gate && gardenGate(k)) gateDoor(E, e, look, z, k);
    if (gate && !e.arch && litLook(look)) for (const t of [0, 1]) lampAt(lerp2(E.p, E.q, t ? 1 - GATE_CUT : GATE_CUT), look.h + 2.5, z, 'G' + t + k);
    if (look.lights && !gate) bulbsAlong([Ez.p, Ez.q], look.h + 0.6, z, 'E' + k);
    if (gate && e.arch) drawGateArch(E, e, look, z, k);
    if (endQ) endPiece('zaun', look, E.q, z, 'P' + vq.join());
    if (onQ && rcQ.ka === k) drawArc(rcQ, look, z);
    return;
  }
  // Ecke „┌“: das waagerechte Stück 'a' i,j wird vor diesem senkrechten gezeichnet und übernimmt die Ecke – dieses beginnt
  // erst hinter ihm (sonst malt es seine Seitenwand über das andere Stück)
  const ao = dir === 'b' && state.edges.get('a' + i + ',' + j), aw = ao && ao.b !== 'zaun' ? ((EDGE_LOOK[ao.b] || {})[ao.style] || Object.values(EDGE_LOOK[ao.b])[0]).w : 0;
  // Mauer mit Pfeiler am hinteren Ende (P): erst der Pfeiler, die Mauer beginnt an seiner Seite (sonst ragt er über sie)
  const gateBefore = e.b === 'mauer' && (o => { const n = state.edges.get(o); return !!(n && n.b === 'mauer' && isGate(o)); })(dir + (i - au) + ',' + (j - av));
  const pilP = gateP ? gateP : gateBefore ? wallPillarR(look) : !endP ? 0 : e.b === 'mauer' ? wallPillarR(look) : e.b === 'hecke' ? w : 0;
  const ext0 = pilP ? -pilP : onP ? -ROUND_R : aw ? -aw : edgeJoins(k, e.b, i, j) ? w : 0, ext1 = onQ ? -ROUND_R : gateQ ? -gateQ : edgeJoins(k, e.b, i + au, j + av) ? w : 0;
  const p = [E.p[0] - au * ext0, E.p[1] - av * ext0], q = [E.q[0] + au * ext1, E.q[1] + av * ext1];
  if (onP && rcP.ka === k) drawArc(rcP, look, z);                 // Bogen hinten: vor dem Stück zeichnen
  if (gate) {                                                   // Durchgang: bis an den Weg, innen ein Pfeiler bzw. rundes Ende
    const gt = gateT(e.b, look);
    // von hinten nach vorn (Block 87d): hinteres Stück und Pfosten, dann die Gartentür, dann vorderes Stück und Pfosten –
    // sonst liegt die Tür vor dem vorderen Pfeiler
    const stub = (a, b, t0, t1) => { if (e.b === 'mauer') return; if (look.bushes) bushSpan(k, E, t0, t1, look, z, k.length); else edgePrism(a, b, E, w, h, look.col, z); };
    const post = t => { if (e.b !== 'mauer') hedgeKnob(lerp2(E.p, E.q, t), look, z); };   // Mauer-Torpfeiler: am Eckpunkt (gatePillarsAt)
    stub(p, lerp2(E.p, E.q, GATE_CUT), 0, GATE_CUT); post(gt);
    if (gardenGate(k)) gateDoor(E, e, look, z, k);
    stub(lerp2(E.p, E.q, 1 - GATE_CUT), q, 1 - GATE_CUT, 1); post(1 - gt);
    if (e.arch && !(e.b === 'mauer' && e.arch === 'bogen')) drawGateArch(E, e, look, z, k);
    return;
  }
  if (pilP && endP) endPiece(e.b, look, E.p, z, 'P' + vp.join());
  if (look.bushes) {                                               // Wilmerhecke: Büsche statt Block
    bushSpan(k, E, onP ? ROUND_R : gateP, onQ ? 1 - ROUND_R : 1 - gateQ, look, z, k.length);
    if (onQ && rcQ.ka === k) drawArc(rcQ, look, z);
    if (endP && !pilP) endPiece(e.b, look, E.p, z, 'P' + vp.join());
    if (endQ) endPiece(e.b, look, E.q, z, 'P' + vq.join());
    return;
  }
  edgePrism(p, q, E, w, h, look.col, z, !onQ);
  if (onQ && rcQ.ka === k) drawArc(rcQ, look, z);                 // Bogen vorn: nach dem Stück
  const ends = () => { if (endP && (!pilP || gateBefore)) endPiece(e.b, look, E.p, z, 'P' + vp.join()); if (endQ) endPiece(e.b, look, E.q, z, 'P' + vq.join()); };
  const front = [[p[0] + E.side[0] * w, p[1] + E.side[1] * w], [q[0] + E.side[0] * w, q[1] + E.side[1] * w]];
  if (look.lamps) { const m = lerp2(E.p, E.q, 0.5); pillarBox(m, w * 1.2, h, h + 1.2, shade(look.col, 0.28), z); lampAt(m, h + 1.2, z, 'E' + k); }
  if (e.b === 'hecke') {
    hedgeSideFlowers(front, look, h, z, k.length); hedgeTop([p, q], look, h, z, k.length, 'E' + k);
    if (look.lights) for (const [rc, on] of [[rcP, onP], [rcQ, onQ]]) if (on && k === lastDrawn(rc.ka, rc.kb)) lampions(roundArc(rc, 10), look, h, z, 'E' + rc.ka);
    ends(); return;
  }
  if (look.lights) bulbsAlong(front, h - 0.6, z, 'E' + k);
  wallJoints([[[p[0] + E.side[0] * w, p[1] + E.side[1] * w], [q[0] + E.side[0] * w, q[1] + E.side[1] * w]]], look, h, z, (pt, up) => edgeS(pt[0], pt[1], up, z));
  ends();
}
// Gartentürchen (Block 59) in der Lücke eines Tors ohne Weg: beim Zaun im Stil des Zauns, sonst ein niedriges Holztürchen;
// eine Querstrebe und ein Knauf zeigen, dass es eine Tür ist
// Kommt jemand nah, schwingt das Türchen auf (zur vorderen Seite, die danach gezeichnet wird) und danach wieder zu
const GATE_OPEN = new Map();                                       // Kante → wie weit offen (0 … 1), weich nachgeführt
function gateSwing(k, E) {
  const m = lerp2(E.p, E.q, 0.5), near = walkers.concat(strollers).some(w => !(w.inside > 0) && Math.hypot(w.px - m[0], w.py - m[1]) < 0.9);
  const cur = GATE_OPEN.get(k) || 0, v = cur + ((near ? 1 : 0) - cur) * 0.12;
  if (v < 0.005 && !near) GATE_OPEN.delete(k); else GATE_OPEN.set(k, v);
  return v < 0.005 ? 0 : v;
}
function gateDoor(E, e, look, z, k) {
  const t0 = e.b === 'zaun' ? GATE_CUT : e.b === 'mauer' ? wallPillarR(look) + 0.03 : gateT(e.b, look) + 0.05, A = lerp2(E.p, E.q, t0 + 0.02), B0 = lerp2(E.p, E.q, 1 - t0 - 0.02);
  const open = EDGE_PROJ ? 0 : gateSwing(k, E), ang = open * 1.4, len = Math.hypot(B0[0] - A[0], B0[1] - A[1]);
  const B = [A[0] + (E.along[0] * Math.cos(ang) + E.side[0] * Math.sin(ang)) * len, A[1] + (E.along[1] * Math.cos(ang) + E.side[1] * Math.sin(ang)) * len];
  const wood = { h: e.b === 'zaun' ? look.h - 0.5 : Math.min(7, look.h - 1), col: e.b === 'zaun' ? look.col : '#b5835a' };
  const style = e.b === 'zaun' ? e.style : 'latten';
  drawFence({ p: A, q: B }, wood, style === 'lichter' ? 'latten' : style, false, z, [false, false]);
  const S = (pt, up) => edgeS(pt[0], pt[1], up, z), dark = shade(wood.col, -0.3);
  if (style !== 'glas' && style !== 'gitter' && style !== 'eisen') {     // Z-Strebe (Holz)
    g.strokeStyle = C(shade(wood.col, -0.12)); g.lineWidth = 1 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...S(A, wood.h * 0.35)); g.lineTo(...S(B, wood.h * 0.75)); g.stroke();
  }
  // geschwungener oberer Abschluss – so sieht man auch am Eisen- oder Glaszaun, wo die Tür ist
  const top0 = S(A, wood.h), top1 = S(B, wood.h), mid = S(lerp2(A, B, 0.5), wood.h + 2.4);
  g.strokeStyle = C(style === 'glas' ? '#9aa3ad' : e.b === 'zaun' && (style === 'eisen' || style === 'gitter') ? wood.col : dark); g.lineWidth = 1.2 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(...top0); g.quadraticCurveTo(mid[0] * 2 - (top0[0] + top1[0]) / 2, mid[1] * 2 - (top0[1] + top1[1]) / 2, ...top1); g.stroke();
  const kn = lerp2(A, B, 0.85), [kx, ky] = S(kn, wood.h * 0.5);
  circle(kx, ky, 0.7 * z, C(e.b === 'zaun' && style === 'eisen' ? '#c9a24a' : dark));   // Knauf
}
// Zaun: Pfosten an beiden Enden, dazwischen je nach Stil Latten, Staketen, Flechtwerk, Gitter, Stäbe oder Glas.
// Läuft an einer Punktlinie entlang (E.pts: auch der Bogen einer runden Ecke), Latten im gleichen Abstand je Länge.
function drawFence(E, look, style, gate, z, posts = [true, true]) {
  const h = look.h, col = look.col, pts = E.pts || [E.p, E.q];
  const post = (pt, hh) => fencePost(pt, look, style, z, hh);
  if (gate) {                                                   // Tor: kurzes Stück bis an den Weg, dort nur die Torpfosten
    for (const [t0, t1] of [[0, GATE_CUT], [1 - GATE_CUT, 1]]) drawFence({ p: lerp2(E.p, E.q, t0), q: lerp2(E.p, E.q, t1) }, look, style, false, z, [false, false]);
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
  if (posts[0]) post(pts[0]);
  if (posts[1]) post(pts[pts.length - 1]);
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
  // Holz (auch mit Lichterkette): zwei Querlatten, davor die Latten (Staketen spitz und weiß)
  rail(h * 0.35, shade(col, -0.12), 1);
  rail(h * 0.75, shade(col, -0.12), 1);
  for (let i = 1; i < n; i++) {
    const t = i / n, [x0, y0] = at(t, 0.3), [x1, y1] = at(t, style === 'staketen' ? h - 1 : h - 0.5);
    line([x0, y0], [x1, y1], col, 1.3);
    if (style === 'staketen') poly([[x1 - 0.65 * z, y1], [x1 + 0.65 * z, y1], [x1, y1 - 1.6 * z]], C(col));
  }
}
// Alle Linien an den hinteren Kanten eines Felds (vor dem Feld selbst zeichnen)
// Torpfeiler einer Mauer am Eckpunkt (x, y): vor den Stücken, die hier beginnen (a/b x,y – in diesem Feld gezeichnet), und
// nach denen, die hier enden (Felder davor) – so liegt er hinter der Mauer, die vor ihm weitergeht (Block 87f)
function gatePillarsAt(vx, vy, z) {
  const ks = ['a' + vx + ',' + vy, 'b' + vx + ',' + vy, 'a' + (vx - 1) + ',' + vy, 'b' + vx + ',' + (vy - 1)];
  const k = ks.find(o => { const n = state.edges.get(o); return n && n.b === 'mauer' && isGate(o); });
  if (!k) return;
  const e = state.edges.get(k), look = EDGE_LOOK.mauer[e.style] || EDGE_LOOK.mauer.backstein, m = [vx - 0.5, vy - 0.5];
  const tall = e.arch === 'bogen', top = wallPillar(m, look, z, Infinity, tall ? 6 : 0), id = 'G' + (ks.indexOf(k) < 2 ? 0 : 1) + k;
  if (litLook(look) && e.arch !== 'rosen') lampAt(m, top, z, id);          // „Torbogen“: hohe Torpfeiler mit Steinkugel (bzw. Laterne)
  else if (tall) { const [x, y] = edgeS(m[0], m[1], top + 1.6, z), r = 1.9 * z; circle(x, y, r, C(shade(look.col, 0.05))); circle(x - r * 0.3, y - r * 0.35, r * 0.4, C(shade(look.col, 0.3))); }
}
// Felder, auf denen drawEdgesAt überhaupt etwas zeichnet (Block 124): je Linie ihr Feld i,j, bei Mauern auch ihre beiden Eckpunkte
// (Torpfeiler, gatePillarsAt). Als Zahlen, neu bei anderem groundVersion, anderer Map oder anderer Anzahl Linien
let EDGE_FIELDS = null, EDGE_FIELDS_KEY = null;
const edgeFieldNo = (x, y) => (x + 32768) * 65536 + (y + 32768);
function edgeFieldsHas(x, y) {
  if (!EDGE_FIELDS || EDGE_FIELDS_KEY.v !== groundVersion || EDGE_FIELDS_KEY.m !== state.edges || EDGE_FIELDS_KEY.n !== state.edges.size) {
    EDGE_FIELDS = new Set();
    for (const [k, e] of state.edges) {
      const { i, j } = edgeParse(k);
      EDGE_FIELDS.add(edgeFieldNo(i, j));
      if (e.b === 'mauer') for (const [vx, vy] of edgeEndPoints(k)) EDGE_FIELDS.add(edgeFieldNo(vx, vy));
    }
    EDGE_FIELDS_KEY = { v: groundVersion, m: state.edges, n: state.edges.size };
  }
  return EDGE_FIELDS.has(edgeFieldNo(x, y));
}
function drawEdgesAt(x, y, z, now) {
  if (!state.edges.size || !edgeFieldsHas(x, y)) return;
  gatePillarsAt(x, y, z);
  for (const k of ['a' + x + ',' + y, 'b' + x + ',' + y]) { const e = state.edges.get(k); if (e) drawEdge(k, e, z, now); }
}
// Vorschau/Markierung einer Kante am Boden
function edgeMark(k, col, z, w = 4) {
  const E = edgeEnds(k), a = edgeS(E.p[0], E.p[1], 0, z), b = edgeS(E.q[0], E.q[1], 0, z);
  g.strokeStyle = col; g.lineWidth = w * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
}
