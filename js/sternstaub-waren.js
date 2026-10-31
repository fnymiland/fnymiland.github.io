'use strict';
// ---------------------------------------------------------------------------
// Sternenbasar-Sammlungen (Block 161c, Nutzer 17.10.2026: „mehr davon, viel mehr – riesiger Itemshop für ganz viele Tage … angelehnt an
// Disney und Animal Crossing, Fanny liebt Frozen, Rapunzel und die Prinzessinnen“): ❄️ Eiszauber, 🏰 Turm & Himmelslaternen, 👑 Prinzessinnen
// & Märchen, 🍃 Inselleben – eigene Motive nach den (freien) Märchen, keine Disney-Figuren. Bilder aus den Entwürfen (tools/waren-*.js,
// im Browser abgenommen), Form wie SD_ART (cx, cy, z, now, x, y, t; Licht über sdLit, Schein über glowQuad). Preise: Nutzer „wirklich ein
// Spielziel“ – normal 80–200 ✨, selten 350–450 ✨ (Seltenes der Woche, basarOffers)
// ---------------------------------------------------------------------------
const SD_WAREN = {};
// ❄️ Sammlung Eiszauber (Block 161c, Nutzer 17.10.2026: „Fanny liebt …“ – eigene Motive nach der Schneekönigin, keine Disney-Figuren).
// Form wie SD_ART (cx, cy, z, now, x, y, t); Helfer aus sternstaub.js. Bogen: tools/waren-entwurf.js
SD_WAREN.EISZAUBER = (() => {
  const ICE = '#bfe6f7', ICE_D = '#8cc7e6', ICE_L = '#eaf8ff', SNOW = '#fbfdff', SNOW_S = '#dfeaf2';
  const snow = (cx, cy, rx, z) => { ellipse(cx, cy + 0.6 * z, rx * z, rx * 0.42 * z, C(SNOW_S)); ellipse(cx - 0.6 * z, cy, rx * 0.86 * z, rx * 0.34 * z, C(SNOW)); };
  const flake = (x, y, r, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.stroke(); };
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  // Strickschal, der sich um den Hals legt: vorderer Bogen (beide Kanten nach unten gewölbt), runde Seiten, Streifen, Knoten, zwei Enden mit Fransen
  const pengScarf = (x, ny, hw, z, col = '#d9534a', dark = '#a8392f') => {
    const band = (dy, th, c) => { g.beginPath(); g.moveTo(x - hw * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.3) * z, x + hw * z, ny + dy * z);
      g.lineTo(x + hw * z, ny + (dy + th) * z); g.quadraticCurveTo(x, ny + (dy + th + 1.3) * z, x - hw * z, ny + (dy + th) * z); g.closePath(); g.fillStyle = c; g.fill(); };
    band(-0.5, 1.7, C(dark)); band(-0.7, 1.5, C(col));
    for (const sx of [-1, 1]) { ellipse(x + sx * (hw - 0.05) * z, ny + 0.15 * z, 0.45 * z, 0.95 * z, C(dark)); ellipse(x + sx * (hw - 0.1) * z, ny + 0.05 * z, 0.4 * z, 0.8 * z, C(col)); }
    for (const dy of [-0.15, 0.35]) { g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(0.4, 0.18 * z); g.beginPath(); g.moveTo(x - (hw - 0.3) * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.2) * z, x + (hw - 0.3) * z, ny + dy * z); g.stroke(); }
    const kx = x + hw * 0.55 * z, ky = ny + 0.9 * z;
    poly([[kx - 0.5 * z, ky], [kx + 0.6 * z, ky], [kx + 1.3 * z, ky + 4.2 * z], [kx + 0.1 * z, ky + 4.4 * z]], C(col));
    poly([[kx + 0.2 * z, ky], [kx + 1 * z, ky - 0.2 * z], [kx + 2.6 * z, ky + 3.2 * z], [kx + 1.6 * z, ky + 3.6 * z]], C(dark));
    for (const k of [0, 1, 2]) sdLine('#f6dcd8', 0.22, z, [[kx + (0.25 + k * 0.4) * z, ky + 4.3 * z], [kx + (0.3 + k * 0.4) * z, ky + 5 * z]]);
    circle(kx, ky, 0.75 * z, C(dark)); circle(kx - 0.1 * z, ky - 0.1 * z, 0.55 * z, C(col));
  };
  // Neu gezeichnet (Basar-Durchsicht 28.10.2026, Entwürfe tools/basar-entwurf-p5.js, Nutzer: Schneekugel A, Pavillon A, Brunnen B, Eisbank A2)
  const TAU = Math.PI * 2;
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const snowPile = (cx, cy, rx, z) => { ellipse(cx, cy + 0.8 * z, rx * z, rx * 0.44 * z, C(SNOW_S)); ellipse(cx - 0.6 * z, cy + 0.2 * z, rx * 0.88 * z, rx * 0.36 * z, C(SNOW));
    for (const [dx, r] of [[-0.55, 0.22], [0.35, 0.28], [0.7, 0.16]]) ellipse(cx + dx * rx * z, cy - 0.1 * z, r * rx * z, r * rx * 0.45 * z, C(SNOW)); };
  const ball = (x, y, r) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, C('#f2f7fb')); gr.addColorStop(1, C('#c3d6e4')); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = gr; g.fill(); };
  // Schneeflocke mit Ästen (6 Arme, je zwei Zweigpaare), rot = Drehung in ihrer Ebene
  const bigFlake = (x, y, r, rot, z, col, w = 0.5) => {
    g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.beginPath();
    for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
      g.moveTo(x, y); g.lineTo(x + ca * r, y + sa * r);
      for (const [f, l] of [[0.45, 0.32], [0.72, 0.22]]) for (const s of [-1, 1]) { const b = a + s * 0.75, px = x + ca * r * f, py = y + sa * r * f; g.moveTo(px, py); g.lineTo(px + Math.cos(b) * r * l, py + Math.sin(b) * r * l); } }
    g.stroke();
    g.beginPath(); for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 3 + Math.PI / 6; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18); } g.closePath(); g.fillStyle = col; g.fill();
  };
  const twinkle = (x, y, s, z, col) => poly([[x, y - s * z], [x + 0.3 * s * z, y - 0.3 * s * z], [x + s * z, y], [x + 0.3 * s * z, y + 0.3 * s * z], [x, y + s * z], [x - 0.3 * s * z, y + 0.3 * s * z], [x - s * z, y], [x - 0.3 * s * z, y - 0.3 * s * z]], col);
  // Quader im Raum (kit): sichtbare Seiten oben, a = a1 (vorn rechts), b = b1 (vorn links)
  const box3 = (K, a0, a1, b0, b1, h0, h1, top, fa, fb) => { const P = K.P;
    poly([P(a1, b0, h0), P(a1, b1, h0), P(a1, b1, h1), P(a1, b0, h1)], fa);
    poly([P(a0, b1, h0), P(a1, b1, h0), P(a1, b1, h1), P(a0, b1, h1)], fb);
    poly([P(a0, b0, h1), P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)], top); };

  // ── Schneemann ────────────────────────────────────────────────────────────────────────────────────────────────────────
  const scarf = (x, ny, hw, z, col, dark, tail) => {
    const band = (dy, th, c) => { g.beginPath(); g.moveTo(x - hw * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.6) * z, x + hw * z, ny + dy * z);
      g.lineTo(x + hw * z, ny + (dy + th) * z); g.quadraticCurveTo(x, ny + (dy + th + 1.6) * z, x - hw * z, ny + (dy + th) * z); g.closePath(); g.fillStyle = c; g.fill(); };
    band(-0.6, 2, C(dark)); band(-0.8, 1.8, C(col));
    for (const dy of [-0.3, 0.4]) { g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = Math.max(0.4, 0.25 * z); g.beginPath(); g.moveTo(x - (hw - 0.3) * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.5) * z, x + (hw - 0.3) * z, ny + dy * z); g.stroke(); }
    const kx = x + hw * 0.5 * z, ky = ny + 1.1 * z;
    poly([[kx - 0.8 * z, ky], [kx + 0.8 * z, ky], [kx + 1.6 * z, ky + tail * z], [kx - 0.2 * z, ky + (tail + 0.2) * z]], C(col));
    for (const t of [0.35, 0.65]) sdLine('rgba(255,255,255,0.6)', 0.25, z, [[kx - 0.6 * z + t * 1.8 * z * 0.5, ky + t * tail * z], [kx + 0.9 * z + t * 0.8 * z, ky + t * tail * z]]);
    for (const k of [0, 1, 2, 3]) sdLine(dark, 0.25, z, [[kx + (-0.1 + k * 0.55) * z, ky + (tail + 0.1) * z], [kx + (-0.1 + k * 0.55) * z, ky + (tail + 1) * z]]);
    poly([[kx + 0.2 * z, ky - 0.2 * z], [kx + 1.2 * z, ky - 0.4 * z], [kx + 3.4 * z, ky + 2.6 * z], [kx + 2.2 * z, ky + 3 * z]], C(dark));
    circle(kx, ky, 1 * z, C(dark)); circle(kx - 0.1 * z, ky - 0.1 * z, 0.75 * z, C(col));
  };
  const twig = (pts, z) => { sdLine('#6b4f3a', 0.8, z, pts.slice(0, 2)); for (const [a, b] of pts.slice(2)) sdLine('#6b4f3a', 0.45, z, [a, b]); };
  const schneemann = (cx, cy, z) => {
    snowPile(cx, cy, 10, z);
    ball(cx, cy - 5.6 * z, 6.6 * z);
    ellipse(cx + 0.4 * z, cy - 10.2 * z, 4.2 * z, 1.1 * z, 'rgba(140,170,195,0.35)');
    ball(cx, cy - 14 * z, 4.9 * z);
    ellipse(cx + 0.3 * z, cy - 18 * z, 3.2 * z, 0.9 * z, 'rgba(140,170,195,0.35)');
    twig([[cx - 4.3 * z, cy - 14.6 * z], [cx - 10 * z, cy - 19.4 * z], [[cx - 8.6 * z, cy - 18.2 * z], [cx - 9.4 * z, cy - 21 * z]], [[cx - 9.4 * z, cy - 19 * z], [cx - 11.6 * z, cy - 19.6 * z]]], z);
    twig([[cx + 4.3 * z, cy - 13.6 * z], [cx + 9.6 * z, cy - 11 * z], [[cx + 8.2 * z, cy - 11.7 * z], [cx + 9.6 * z, cy - 13.6 * z]], [[cx + 9 * z, cy - 11.3 * z], [cx + 11.2 * z, cy - 10.4 * z]]], z);
    for (const [dx, dy] of [[-0.3, -15.6], [-0.15, -13], [0, -10.4], [0.1, -6.8], [0.2, -3.6]]) { circle(cx + dx * z, cy + dy * z, 0.62 * z, C('#2f3038')); circle(cx + (dx - 0.2) * z, cy + (dy - 0.2) * z, 0.2 * z, 'rgba(255,255,255,0.5)'); }
    ball(cx, cy - 21.4 * z, 3.8 * z);
    scarf(cx, cy - 18.4 * z, 3.9, z, '#d9534a', '#a8392f', 4.6);
    for (const dx of [-1.4, 0.9]) { circle(cx + dx * z, cy - 22.6 * z, 0.52 * z, C('#2f3038')); circle(cx + (dx - 0.15) * z, cy - 22.8 * z, 0.16 * z, '#ffffff'); }
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.2 + k * 0.15); circle(cx - 0.2 * z + Math.cos(a) * 2 * z, cy - 21.4 * z + Math.sin(a) * 1.3 * z, 0.3 * z, C('#2f3038')); }   // Lächeln
    poly([[cx - 0.4 * z, cy - 21.9 * z], [cx - 5.6 * z, cy - 21.1 * z], [cx - 0.4 * z, cy - 20.7 * z]], C('#f08a2e'));                                      // Karotte
    poly([[cx - 0.4 * z, cy - 21.3 * z], [cx - 5.6 * z, cy - 21.1 * z], [cx - 0.4 * z, cy - 20.7 * z]], C('#d46f1e'));
    for (const t of [0.3, 0.55]) sdLine('#c4621a', 0.2, z, [[cx - (0.4 + t * 5.2) * z, cy - (21.9 - t * 0.8) * z], [cx - (0.4 + t * 5.2) * z, cy - (20.7 - t * 0.4) * z]]);
    const hy = cy - 24.4 * z;                                                                             // Zylinder, leicht schief, mit Stechpalme
    g.save(); g.translate(cx + 0.3 * z, hy); g.rotate(0.12);
    ellipse(0, 0, 4.8 * z, 1.3 * z, C('#2a2b33'));
    poly([[-3 * z, 0], [3 * z, 0], [2.7 * z, -6.4 * z], [-2.7 * z, -6.4 * z]], C('#33343d')); poly([[1 * z, 0], [3 * z, 0], [2.7 * z, -6.4 * z], [0.9 * z, -6.4 * z]], C('#2a2b33'));
    ellipse(0, -6.4 * z, 2.7 * z, 0.7 * z, C('#40414c'));
    poly([[-3 * z, -0.6 * z], [3 * z, -0.6 * z], [2.95 * z, -1.8 * z], [-2.95 * z, -1.8 * z]], C('#d9534a'));
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(-1.8 * z + s * 0.9 * z, -1.6 * z, 1.1 * z, 0.5 * z, s * 0.5, 0, TAU); g.fillStyle = C('#3f8a3e'); g.fill(); }
    for (const [dx, dy] of [[-1.8, -2], [-1.2, -1.6], [-2.3, -1.4]]) circle(dx * z, dy * z, 0.45 * z, C('#e8364f'));
    g.restore();
  };

  // ── Schlitten ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const present = (K, a, b, s, h0, hh, col, rib) => { const P = K.P;
    box3(K, a - s, a + s, b - s, b + s, h0, h0 + hh, C(shade(col, 0.12)), C(shade(col, -0.12)), C(col));
    sdLine(rib, 0.45, K.z, [P(a + s, b - s * 0.15, h0), P(a + s, b - s * 0.15, h0 + hh), P(a - s, b - s * 0.15, h0 + hh)]);
    sdLine(rib, 0.45, K.z, [P(a - s * 0.15, b + s, h0), P(a - s * 0.15, b + s, h0 + hh), P(a - s * 0.15, b - s, h0 + hh)]);
    const t = P(a - s * 0.15, b - s * 0.15, h0 + hh);
    for (const d of [-1, 1]) { g.beginPath(); g.ellipse(t[0] + d * 0.9 * K.z, t[1] - 0.6 * K.z, 0.9 * K.z, 0.55 * K.z, d * 0.5, 0, TAU); g.fillStyle = C(rib); g.fill(); } };
  const schlitten = (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, A0 = -0.2, A1 = 0.15, B = 0.095;
    snowPile(cx, cy, 11, z);
    for (const b of [-0.07, 0.07]) sdLine('#d3e2ee', 0.5, z, [P(-0.3, b, 0), P(A0, b, 0)]);                 // Spuren im Schnee
    const runner = b => { const pts = []; for (let i = 0; i <= 10; i++) pts.push(P(A0 - 0.03 + i * 0.042, b, 0));
      pts.push(P(0.25, b, 1.4), P(0.27, b, 3.6), P(0.245, b, 5.2), P(0.21, b, 4.6)); return pts; };
    const drawRunner = b => { g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = C('#5a3c26'); g.lineWidth = 1.1 * z; path(runner(b), false); g.stroke();
      g.strokeStyle = C('#e0b04a'); g.lineWidth = 0.35 * z; path(runner(b), false); g.stroke();
      for (const a of [-0.13, 0, 0.1]) sdLine('#6b4a2e', 0.7, z, [P(a, b, 0), P(a, b, 3.4)]); };
    drawRunner(-B);
    poly([P(A0, -B - 0.01, 3.4), P(A1, -B - 0.01, 3.4), P(A1, B + 0.01, 3.4), P(A0, B + 0.01, 3.4)], C('#a8774a'));   // Boden
    poly([P(A0, -B, 3.4), P(A1, -B, 3.4), P(A1, -B, 7), P(A0, -B, 7)], C('#a8392f'));                       // hintere Wand innen
    poly([P(A0, -B, 3.4), P(A0, B, 3.4), P(A0, B, 11.5), P(A0, 0, 12.8), P(A0, -B, 11.5)], C('#b8433a'));   // Lehne innen
    sdLine('#e0b04a', 0.4, z, [P(A0, -B, 11.5), P(A0, 0, 12.8), P(A0, B, 11.5)]);
    const pr = [[-0.12, -0.03, 0.045, 5, '#58b3e8', '#ffd23f'], [-0.02, 0.04, 0.04, 4, '#58b36a', '#e86f8f'], [0.07, -0.04, 0.035, 3.4, '#ffd23f', '#d9534a'], [-0.07, 0.05, 0.03, 7, '#b57bff', '#ffffff']];
    pr.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1])).forEach(([a, b, s, hh, c, r]) => present(K, a, b, s, 3.4, hh, c, C(r)));
    poly([P(A0, B, 3.4), P(A1, B, 3.4), P(A1, B, 7), P(A0, B, 7)], C('#d9534a'));                            // vordere Wand
    poly([P(A1, -B, 3.4), P(A1, B, 3.4), P(A1, B, 6.4), P(A1, -B, 6.4)], C('#c23f37'));                      // Stirnwand
    sdLine('#e0b04a', 0.45, z, [P(A0, B, 7), P(A1, B, 7), P(A1, B, 6.4), P(A1, -B, 6.4)]);
    for (const a of [-0.12, 0, 0.1]) { const p = P(a, B, 5.2); circle(p[0], p[1], 0.6 * z, C('#e0b04a')); }
    sdLine('#ffffff', 0.5, z, [P(A0 + 0.03, B, 5.2), P(A1 - 0.03, B, 5.2)]);
    drawRunner(B);
  };

  // ── Rentier ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  const leg = (x, y, z, col, bend, far) => { const c = far ? shade(col, -0.18) : col;
    poly([[x - 1 * z, y - 9 * z], [x + 1 * z, y - 9 * z], [x + (0.6 + bend) * z, y - 4.4 * z], [x + (-0.2 + bend) * z, y - 4.4 * z]], C(c));
    poly([[x + (-0.2 + bend) * z, y - 4.4 * z], [x + (0.6 + bend) * z, y - 4.4 * z], [x + 0.5 * z, y - 0.8 * z], [x - 0.2 * z, y - 0.8 * z]], C(shade(c, 0.08)));
    poly([[x - 0.45 * z, y - 0.9 * z], [x + 0.75 * z, y - 0.9 * z], [x + 0.85 * z, y], [x - 0.55 * z, y]], C('#3a2a22')); };
  const antler = (x, y, z, s) => { const col = '#c9a77a';
    sdLine(col, 0.65, z, [[x, y], [x + s * 1.5 * z, y - 7 * z]], [x + s * 2.6 * z, y - 3 * z]);
    sdLine(col, 0.45, z, [[x + s * 1.2 * z, y - 2 * z], [x - s * 1.2 * z, y - 4.2 * z]]);
    sdLine(col, 0.45, z, [[x + s * 2 * z, y - 4.4 * z], [x + s * 4 * z, y - 6.2 * z]]);
    sdLine(col, 0.4, z, [[x + s * 1.7 * z, y - 6 * z], [x + s * 0.2 * z, y - 8.4 * z]]); };
  const rentier = (cx, cy, z) => {
    const F = '#a8784e';
    snowPile(cx, cy, 9, z);
    leg(cx - 3.2 * z, cy - 0.4 * z, z, F, -0.4, true); leg(cx + 5.2 * z, cy - 0.6 * z, z, F, 0.5, true);
    g.beginPath(); g.ellipse(cx + 0.6 * z, cy - 10 * z, 6.8 * z, 3.7 * z, -0.05, 0, TAU); g.fillStyle = C(F); g.fill();
    g.beginPath(); g.ellipse(cx + 0.4 * z, cy - 8.2 * z, 5 * z, 1.7 * z, 0, 0, TAU); g.fillStyle = C('#e6d2b2'); g.fill();
    g.beginPath(); g.ellipse(cx + 0.8 * z, cy - 12.2 * z, 5.4 * z, 1.4 * z, -0.05, 0, TAU); g.fillStyle = C(shade(F, -0.12)); g.fill();
    circle(cx + 7 * z, cy - 11.2 * z, 1.3 * z, C('#ffffff'));                                             // Schwänzchen
    leg(cx - 4.4 * z, cy, z, F, -0.5, false); leg(cx + 4.2 * z, cy, z, F, 0.6, false);
    poly([[cx - 6.4 * z, cy - 10 * z], [cx - 2.8 * z, cy - 12.6 * z], [cx - 5.6 * z, cy - 18.4 * z], [cx - 8.6 * z, cy - 17 * z]], C(F));   // Hals
    for (const [dx, dy, r] of [[-6.8, -11.6, 1.5], [-7.4, -13.4, 1.4], [-7.6, -15.2, 1.2], [-6, -10.6, 1.3]]) circle(cx + dx * z, cy + dy * z, r * z, C('#efe3cc'));   // heller Halskragen
    ellipse(cx - 6.6 * z, cy - 15.6 * z, 2.3 * z, 0.75 * z, C('#d9534a')); circle(cx - 7.2 * z, cy - 14.6 * z, 0.75 * z, C('#f5c84b'));   // Halsband mit Glöckchen
    const hx = cx - 8.4 * z, hy = cy - 18.6 * z;
    g.beginPath(); g.ellipse(hx + 1.6 * z, hy - 0.6 * z, 1.3 * z, 0.6 * z, -0.6, 0, TAU); g.fillStyle = C(shade(F, -0.1)); g.fill();       // Ohr
    g.beginPath(); g.ellipse(hx, hy, 2.8 * z, 1.8 * z, 0.35, 0, TAU); g.fillStyle = C(F); g.fill();
    g.beginPath(); g.ellipse(hx - 2.2 * z, hy + 0.9 * z, 1.4 * z, 1.1 * z, 0.35, 0, TAU); g.fillStyle = C('#8a5f3c'); g.fill();
    circle(hx - 3.2 * z, hy + 1 * z, 0.6 * z, C('#2a1f1a'));
    circle(hx + 0.2 * z, hy - 0.5 * z, 0.48 * z, C('#2a1f1a')); circle(hx + 0.05 * z, hy - 0.65 * z, 0.15 * z, '#ffffff');
    antler(hx + 0.6 * z, hy - 1.4 * z, z, 1); antler(hx - 0.4 * z, hy - 1.5 * z, z, -1);
  };

  // ── Schneekugel ───────────────────────────────────────────────────────────────────────────────────────────────────────
  const globe = (cx, cy, z, now) => {
    const lit = sdLit(), R = 8 * z, gx = cx, gy = cy - 13.5 * z;
    sdShadow(cx, cy, 7, z);
    ellipse(cx, cy, 6.4 * z, 2.6 * z, C('#5a3c26'));                                                      // Sockel gedrechselt
    poly([[cx - 6.4 * z, cy], [cx + 6.4 * z, cy], [cx + 5.2 * z, cy - 4 * z], [cx - 5.2 * z, cy - 4 * z]], C('#8a5a3c'));
    poly([[cx + 1.5 * z, cy], [cx + 6.4 * z, cy], [cx + 5.2 * z, cy - 4 * z], [cx + 1.2 * z, cy - 4 * z]], C('#73492f'));
    poly([[cx - 5.6 * z, cy - 2.6 * z], [cx + 5.6 * z, cy - 2.6 * z], [cx + 5.4 * z, cy - 3.3 * z], [cx - 5.4 * z, cy - 3.3 * z]], C('#e0b04a'));
    ellipse(cx, cy - 4 * z, 5.2 * z, 2 * z, C('#a8774a'));
    g.save(); g.beginPath(); g.arc(gx, gy, R, 0, TAU); g.clip();
    const sky = g.createLinearGradient(0, gy - R, 0, gy + R); sky.addColorStop(0, lit ? '#3a4f7a' : C('#cfe9f7')); sky.addColorStop(1, lit ? '#6f86b0' : C('#f2fbff'));
    g.fillStyle = sky; g.fillRect(gx - R, gy - R, 2 * R, 2 * R);
    ellipse(gx, gy + 4.6 * z, 8 * z, 3.2 * z, C(SNOW)); ellipse(gx - 2 * z, gy + 3.8 * z, 4 * z, 1.3 * z, '#ffffff');
    sceneHaus(gx, gy, z, now, lit);
    for (let k = 0; k < 16; k++) { let x, y;
      { const p = (now / 5200 + k * 0.137) % 1; x = gx + (((k * 37) % 15) - 7) * z + Math.sin(now / 700 + k) * 0.6 * z; y = gy - R + p * 2 * R; }
      circle(x, y, (0.35 + (k % 3) * 0.12) * z, '#ffffff'); }
    g.restore();
    g.beginPath(); g.arc(gx, gy, R, 0, TAU); g.fillStyle = 'rgba(200,232,250,0.12)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(0.5, 0.35 * z); g.stroke();
    g.beginPath(); g.ellipse(gx - 3.2 * z, gy - 3.6 * z, 1.4 * z, 3 * z, 0.6, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
    g.beginPath(); g.arc(gx, gy, R - 0.9 * z, 0.2, 1.2); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.4 * z; g.stroke();
    if (lit) glowAt(gx, gy + 1 * z, 14 * z, z);
  };
  const globeTree = (x, y, s, z) => { for (let k = 0; k < 3; k++) poly([[x - (2.2 - k * 0.5) * s * z, y - k * 1.5 * s * z], [x + (2.2 - k * 0.5) * s * z, y - k * 1.5 * s * z], [x, y - (k * 1.5 + 2.4) * s * z]], C(k % 2 ? '#3f8a52' : '#2f7a47'));
    for (let k = 0; k < 3; k++) sdLine('#ffffff', 0.35 * s, z, [[x - (1.6 - k * 0.5) * s * z, y - (k * 1.5 + 0.3) * s * z], [x - 0.2 * z, y - (k * 1.5 + 1.2) * s * z]]); };
  const sceneHaus = (gx, gy, z, now, lit) => {
    const x = gx - 1 * z, y = gy + 4 * z;
    poly([[x - 2.6 * z, y], [x + 2.6 * z, y], [x + 2.6 * z, y - 3.4 * z], [x - 2.6 * z, y - 3.4 * z]], C('#d9534a'));
    poly([[x + 0.8 * z, y], [x + 2.6 * z, y], [x + 2.6 * z, y - 3.4 * z], [x + 0.8 * z, y - 3.4 * z]], C('#b8433a'));
    poly([[x - 3.4 * z, y - 3.2 * z], [x + 3.4 * z, y - 3.2 * z], [x, y - 6.4 * z]], C('#ffffff')); poly([[x - 3.4 * z, y - 3.2 * z], [x - 2.8 * z, y - 3.8 * z], [x, y - 6.4 * z], [x, y - 5.6 * z]], C('#e6eef4'));
    poly([[x - 1.6 * z, y - 1.2 * z], [x - 0.4 * z, y - 1.2 * z], [x - 0.4 * z, y - 2.4 * z], [x - 1.6 * z, y - 2.4 * z]], lit ? '#ffd27a' : C('#ffe9b8'));
    poly([[x + 1.1 * z, y], [x + 2 * z, y], [x + 2 * z, y - 2 * z], [x + 1.1 * z, y - 2 * z]], C('#6b4a2e'));
    globeTree(gx + 4.2 * z, gy + 4.4 * z, 1.1, z); globeTree(gx - 5 * z, gy + 4 * z, 0.7, z);
  };
  // ── Eispalast-Pavillon ────────────────────────────────────────────────────────────────────────────────────────────────
  const disc = (cx, cy, R, H, z, top, side) => {
    g.beginPath(); g.ellipse(cx, cy, R * z, R / 2 * z, 0, 0, Math.PI); g.lineTo(cx - R * z, cy - H * z); g.ellipse(cx, cy - H * z, R * z, R / 2 * z, 0, Math.PI, 0, true); g.closePath();
    const gr = g.createLinearGradient(cx - R * z, 0, cx + R * z, 0); gr.addColorStop(0, C(shade(side, 0.08))); gr.addColorStop(1, C(shade(side, -0.14))); g.fillStyle = gr; g.fill();
    ellipse(cx, cy - H * z, R * z, R / 2 * z, C(top)); };
  const column = (x, y, h, z, lit) => {
    poly([[x - 1.1 * z, y], [x + 1.1 * z, y], [x + 0.85 * z, y - h * z], [x - 0.85 * z, y - h * z]], lit ? 'rgba(225,244,255,0.95)' : C('#cdeefc'));
    poly([[x + 0.2 * z, y], [x + 1.1 * z, y], [x + 0.85 * z, y - h * z], [x + 0.15 * z, y - h * z]], lit ? 'rgba(170,215,240,0.95)' : C(ICE_D));
    for (let k = 1; k < 5; k++) sdLine('rgba(255,255,255,0.8)', 0.25, z, [[x - 0.9 * z, y - (k * h / 5 - 0.6) * z], [x + 0.8 * z, y - (k * h / 5 + 0.6) * z]]);   // Spirale
    ellipse(x, y, 1.6 * z, 0.7 * z, C(ICE_L)); ellipse(x, y - h * z, 1.5 * z, 0.65 * z, C(ICE_L)); };
  const icicles = (cx, ry, R, z, n) => { for (let k = 0; k <= n; k++) { const t = 0.08 + k / n * (Math.PI - 0.16), x = cx + Math.cos(t) * R * z, y = ry + Math.sin(t) * R / 2 * z, l = 1.4 + ((k * 7) % 4) * 0.7;
    poly([[x - 0.5 * z, y], [x + 0.5 * z, y], [x, y + l * z]], 'rgba(230,248,255,0.95)'); } };
  const pavillon = (cx, cy, z, now) => {
    const lit = sdLit(), Rc = 12.5, Hc = 19, n = 5;
    snowPile(cx, cy + 1 * z, 23, z);
    disc(cx, cy + 1 * z, 19, 2, z, '#eef8fd', '#bcdcee'); disc(cx, cy - 1 * z, 15.5, 1.8, z, '#f6fcff', '#cde7f4');
    const base = cy - 2.8 * z, top = base - Hc * z;
    const cols = Array.from({ length: n }, (_, k) => { const t = k / n * TAU + Math.PI / 2; return { t, x: cx + Math.cos(t) * Rc * z, y: base + Math.sin(t) * Rc / 2 * z }; });
    cols.filter(c => Math.sin(c.t) < 0).forEach(c => column(c.x, c.y, Hc, z, lit));
    const ch = [cx, top + 10 * z];                                                                         // Kristall-Leuchter
    sdLine('rgba(220,240,255,0.9)', 0.25, z, [[cx, top - 1 * z], ch]);
    for (const [dx, dy, r] of [[0, 0, 1.4], [-1.6, 1, 0.9], [1.6, 1, 0.9], [0, 2.4, 1]]) poly([[ch[0] + dx * z, ch[1] + (dy - r) * z], [ch[0] + (dx + r * 0.6) * z, ch[1] + dy * z], [ch[0] + dx * z, ch[1] + (dy + r * 1.4) * z], [ch[0] + (dx - r * 0.6) * z, ch[1] + dy * z]], lit ? '#fff3c4' : C('#d8f2ff'));
    if (lit) glowAt(ch[0], ch[1] + 1 * z, 26 * z, z);
    cols.filter(c => Math.sin(c.t) >= 0).forEach(c => column(c.x, c.y, Hc, z, lit));
    const er = Rc + 3;                                                                                    // Traufring mit Eiszapfen
    g.beginPath(); g.ellipse(cx, top, er * z, er / 2 * z, 0, 0, Math.PI); g.lineTo(cx - er * z, top - 1.6 * z); g.ellipse(cx, top - 1.6 * z, er * z, er / 2 * z, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = C('#d6eef9'); g.fill();
    ellipse(cx, top - 1.6 * z, er * z, er / 2 * z, C(ICE_L));
    icicles(cx, top, er, z, 16);
    const rt = top - 1.6 * z;
    {                                                                                                     // Zwiebelkuppel mit Rippen
      const w = er * 0.78 * z, gr = g.createLinearGradient(cx - w, 0, cx + w, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, C('#d3eefb')); gr.addColorStop(1, C('#94c9e6'));
      g.beginPath(); g.moveTo(cx - w, rt); g.bezierCurveTo(cx - w * 1.15, rt - 9 * z, cx - w * 0.2, rt - 12 * z, cx, rt - 19 * z); g.bezierCurveTo(cx + w * 0.2, rt - 12 * z, cx + w * 1.15, rt - 9 * z, cx + w, rt);
      g.ellipse(cx, rt, w, w / 2, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
      for (const f of [-0.55, 0, 0.55]) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.35 * z; g.beginPath(); g.moveTo(cx + f * w, rt + Math.sqrt(1 - f * f) * w / 2);
        g.bezierCurveTo(cx + f * w * 1.25, rt - 9 * z, cx + f * w * 0.3, rt - 12 * z, cx, rt - 19 * z); g.stroke(); }
    }
    const fy = rt - 23 * z;
    sdLine(ICE_L, 0.6, z, [[cx, fy + 4 * z], [cx, fy + 1.5 * z]]);
    bigFlake(cx, fy, 3.4 * z, now / 2600, z, lit ? '#ffffff' : C('#ffffff'), 0.4);
    if (lit) glowAt(cx, fy, 18 * z, z);
    for (let k = 0; k < 4; k++) { const p = (now / 1500 + k * 0.27) % 1, s = Math.sin(p * Math.PI) * 1.2, a = k * 1.7;
      if (s > 0.15) twinkle(cx + Math.cos(a) * 15 * z, top - 6 * z + Math.sin(a) * 9 * z, s, z, 'rgba(255,255,255,0.95)'); }
  };

  // ── Schneeflocken-Brunnen ─────────────────────────────────────────────────────────────────────────────────────────────
  const frostRim = (cx, ry, R, z) => { for (let k = 0; k < 22; k++) { const t = k / 22 * TAU, x = cx + Math.cos(t) * R * z, y = ry + Math.sin(t) * R / 2 * z; ellipse(x, y - 0.4 * z, (1.6 + (k % 3) * 0.4) * z, 0.8 * z, C(SNOW)); } };
  const water = (cx, wy, R, z, lit) => { const gr = g.createRadialGradient(cx, wy, 1 * z, cx, wy, R * z);
    gr.addColorStop(0, lit ? '#b8f0fa' : C('#a8e2f2')); gr.addColorStop(1, lit ? '#5fb4d6' : C('#5fb2d6')); g.beginPath(); g.ellipse(cx, wy, R * z, R / 2 * z, 0, 0, TAU); g.fillStyle = gr; g.fill(); };
  const floes = (cx, wy, R, z, now) => { for (let k = 0; k < 4; k++) { const t = now / 6000 + k * 1.57, rr = (R - 4 - (k % 2) * 3), x = cx + Math.cos(t) * rr * z, y = wy + Math.sin(t) * rr / 2 * z, a = t * 0.5 + k;
    poly([0, 1, 2, 3, 4].map(i => { const b = a + i * TAU / 5, r = (1.2 + ((i + k) % 3) * 0.4) * z; return [x + Math.cos(b) * r, y + Math.sin(b) * r * 0.5]; }), C('#f4fbff')); } };
  const ripples = (x, y, R, z, now) => { for (let k = 0; k < 3; k++) { const p = (now / 1500 + k / 3) % 1;
    g.beginPath(); g.ellipse(x, y, (3 + p * R) * z, (1.5 + p * R / 2) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - p)})`; g.lineWidth = 0.3 * z; g.stroke(); } };
  const snowRise = (cx, cy, z, now, lit) => { for (let k = 0; k < 6; k++) { const p = (now / 3000 + k * 0.19) % 1, x = cx + (((k * 29) % 13) - 6.5) * 1.8 * z + Math.sin(now / 800 + k) * 1 * z, y = cy - p * 26 * z;
    circle(x, y, (0.4 + (k % 2) * 0.2) * z, `rgba(255,255,255,${0.9 * Math.sin(p * Math.PI)})`); } };
  const bowl = (cx, by, R, z, lit) => { g.beginPath(); g.ellipse(cx, by, R * z, R * 0.62 * z, 0, 0, Math.PI); g.closePath(); g.fillStyle = C('#cfeaf7'); g.fill();
    ellipse(cx, by, R * z, R / 2 * z, C(ICE_L)); water(cx, by + 0.3 * z, R - 1.4, z, lit); icicles(cx, by + R * 0.3 * z, R * 0.9, z, 8); };
  const brunnenB = (cx, cy, z, now) => {                                                              // drei Schalen übereinander, Wasser fällt, Flocke oben
    const lit = sdLit(), R = 18, H = 3.4, top = cy - H * z;
    snowPile(cx, cy + 1.5 * z, 23, z);
    disc(cx, cy, R, H, z, '#eef8fd', '#b4d6ea'); frostRim(cx, top, R - 0.6, z);
    water(cx, top + 0.5 * z, R - 2.4, z, lit); floes(cx, top + 0.5 * z, R - 2.4, z, now); ripples(cx, top + 0.6 * z, 11, z, now);
    poly([[cx - 2 * z, top + 0.6 * z], [cx + 2 * z, top + 0.6 * z], [cx + 1.3 * z, top - 9 * z], [cx - 1.3 * z, top - 9 * z]], C(ICE)); poly([[cx + 0.4 * z, top + 0.6 * z], [cx + 2 * z, top + 0.6 * z], [cx + 1.3 * z, top - 9 * z], [cx + 0.3 * z, top - 9 * z]], C(ICE_D));
    const fall = (by, R2, y1, n) => { for (let k = 0; k < n; k++) { const a = 0.3 + k / (n - 1) * (Math.PI - 0.6), x = cx + Math.cos(a) * R2 * z, y0 = by + Math.sin(a) * R2 / 2 * z;
      g.strokeStyle = 'rgba(210,244,252,0.6)'; g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(x, y0); g.lineTo(x * 1 + Math.cos(a) * 0.8 * z, y1 + Math.sin(a) * R2 / 2 * z); g.stroke();
      const p = (now / 500 + k * 0.31) % 1; circle(x + Math.cos(a) * 0.8 * p * z, y0 + (y1 + Math.sin(a) * R2 / 2 * z - y0) * p, 0.38 * z, '#ffffff'); } };
    const b1 = top - 10 * z; bowl(cx, b1, 9, z, lit); fall(b1, 8.6, top + 0.6 * z, 9);
    poly([[cx - 1.2 * z, b1], [cx + 1.2 * z, b1], [cx + 0.8 * z, b1 - 7 * z], [cx - 0.8 * z, b1 - 7 * z]], C(ICE));
    const b2 = b1 - 7.5 * z; bowl(cx, b2, 5.5, z, lit); fall(b2, 5.2, b1 + 0.4 * z, 6);
    const F = [cx, b2 - 9 * z];
    sdLine(ICE_L, 0.7, z, [[cx, b2], [cx, F[1] + 5 * z]]);
    bigFlake(F[0], F[1], 5.6 * z, now / 3200, z, lit ? '#ffffff' : C('#a8dcf2'), 0.7);
    bigFlake(F[0], F[1], 5.6 * z, now / 3200, z, 'rgba(255,255,255,0.7)', 0.3);
    if (lit) glowAt(F[0], F[1], 24 * z, z);
    snowRise(cx, top, z, now, lit);
  };

  // ── Iglu ──
  const iglu = (cx, cy, z) => {
    const lit = sdLit(), R = 14 * z, ox = cx - 2 * z, oy = cy - 1 * z, K = kit(cx, cy, z, 0), P = K.P;   // Kuppelmitte = P(-0.0625, 0)
    snowPile(cx, cy + 1 * z, 22, z);
    const gr = g.createRadialGradient(ox - R * 0.4, oy - R * 0.7, R * 0.1, ox, oy - R * 0.3, R * 1.1);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, C('#eef5fa')); gr.addColorStop(1, C('#c7d9e6'));
    g.beginPath(); g.arc(ox, oy, R, Math.PI, 0); g.ellipse(ox, oy, R, R / 2, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
    g.strokeStyle = C('#bcd0df'); g.lineWidth = Math.max(0.5, 0.35 * z); g.beginPath();                        // Blöcke: Breitenkreise vorn, Fugen versetzt
    const lat = [0, 0.2, 0.4, 0.6, 0.8].map(f => { const ph = f * Math.PI / 2; return { h: R * Math.sin(ph), r: R * Math.cos(ph) }; });
    lat.slice(1).forEach(({ h, r }) => { g.moveTo(ox + r, oy - h); g.ellipse(ox, oy - h, r, r / 2, 0, 0, Math.PI); });
    for (let i = 0; i < 4; i++) { const lo = lat[i], hi = lat[i + 1]; for (let j = 0; j < 6; j++) { const t = (j + (i % 2 ? 0.5 : 0) + 0.25) / 6 * Math.PI;
      g.moveTo(ox + lo.r * Math.cos(t), oy - lo.h + lo.r / 2 * Math.sin(t)); g.lineTo(ox + hi.r * Math.cos(t), oy - hi.h + hi.r / 2 * Math.sin(t)); } }
    g.stroke();
    ellipse(ox - R * 0.3, oy - R * 0.75, R * 0.22, R * 0.1, 'rgba(255,255,255,0.7)');
    // Eingang (überarbeitet, Nutzer 28.10.2026 „scheint da der Hintergrund durch?“): Röhre aus schattierten Streifen, beginnt genau an der
    // Kuppel (Schnittlinie mit der Halbkugel), Blockfugen versetzt, Stirnseite mit Rand, dunkle Öffnung mit Boden, Schatten im Schnee
    const U = 45.25, dA = -0.0625, Rd = 14, a1 = 0.43, rb = 0.14, rh = 8.4, N = 12;
    const aS = t => { const bb = rb * Math.cos(t) * U, h = rh * Math.sin(t); return dA + Math.sqrt(Math.max(0, Rd * Rd - h * h - bb * bb)) / U; };
    const pt = (a, t, f = 1, d = 0) => P(a, rb * f * Math.cos(t), rh * f * Math.sin(t) + d);
    const ts = Array.from({ length: N + 1 }, (_, i) => i / N * Math.PI);
    for (let i = N - 1; i >= 0; i--) { const t0 = ts[i], t1 = ts[i + 1], tm = (t0 + t1) / 2, lum = Math.max(0, Math.min(1, 0.85 * Math.sin(tm) + 0.25 * Math.cos(tm)));
      poly([pt(aS(t0), t0), pt(a1, t0), pt(a1, t1), pt(aS(t1), t1)], C(shade('#f8fbfd', -0.1 * (1 - lum)))); }
    g.strokeStyle = C('#bcd0df'); g.lineWidth = Math.max(0.5, 0.35 * z); g.beginPath();
    const VIS = 0.7 * Math.PI;                                                                            // Rückseite (t > VIS) ist verdeckt
    const ring = a => { let on = false; for (const t of ts) { if (t > VIS) break; const p = pt(a, t); if (a <= aS(t)) { on = false; continue; } on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } };
    const r1 = a1 - 0.055, r2 = a1 - 0.11; ring(r1); ring(r2);
    const along = (t, from, to) => { const s0 = Math.max(from, aS(t)); if (s0 >= to) return; const p = pt(s0, t), q = pt(to, t); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
    for (const t of [0.33, 0.67]) along(t * Math.PI, r1, a1);
    for (const t of [0.17, 0.5]) along(t * Math.PI, r2, r1);
    for (const t of [0.33, 0.67]) along(t * Math.PI, -1, r2);
    g.stroke();
    g.strokeStyle = C('#aabfcf'); g.lineWidth = Math.max(0.5, 0.45 * z); g.beginPath(); ts.filter(t => t <= VIS + 0.01).forEach((t, i) => { const p = pt(aS(t), t); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();   // Naht an der Kuppel
    const face = (f) => ts.map(t => pt(a1, t, f));
    poly(face(1), C('#dde8f0'));                                                                          // Stirnseite (zur Seite, etwas dunkler)
    const door = face(0.64);
    poly(door, lit ? '#ffcf7a' : C('#3f5d77'));
    g.save(); path(door); g.clip();                                                                       // Boden in der Röhre
    const dg = g.createLinearGradient(0, pt(a1, Math.PI / 2, 0.64)[1], 0, P(a1, 0, 0)[1]); dg.addColorStop(0, lit ? '#ffb85a' : C('#22384d')); dg.addColorStop(1, lit ? '#ffd88a' : C('#4d6b85'));
    path(door); g.fillStyle = dg; g.fill();
    poly([P(a1, -rb, 0), P(a1, rb, 0), P(a1 - 0.035, rb, 0), P(a1 - 0.035, -rb, 0)], lit ? '#ffe9b8' : C('#9db5c8'));
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(0.5, 0.4 * z); path(face(1), false); g.stroke();
    g.strokeStyle = C('#c3d5e2'); g.lineWidth = Math.max(0.5, 0.45 * z); path(door, false); g.stroke();
    if (lit) glowAt(P(a1, 0, 3)[0], P(a1, 0, 3)[1], 22 * z, z);
    const L = P(0.5, 0.2, 0);                                                                             // Laterne neben der Tür
    sdLine('#5a4636', 0.5, z, [L, [L[0], L[1] - 5 * z]]); poly([[L[0] - 1 * z, L[1] - 5 * z], [L[0] + 1 * z, L[1] - 5 * z], [L[0] + 0.8 * z, L[1] - 7.4 * z], [L[0] - 0.8 * z, L[1] - 7.4 * z]], lit ? '#ffd27a' : C('#e9d8a8'));
    poly([[L[0] - 1.3 * z, L[1] - 7.4 * z], [L[0] + 1.3 * z, L[1] - 7.4 * z], [L[0], L[1] - 8.8 * z]], C('#5a4636'));
    if (lit) glowAt(L[0], L[1] - 6.2 * z, 12 * z, z);
    for (const [a, b, r] of [[-0.3, 0.32, 1.2], [-0.24, 0.36, 1], [-0.27, 0.3, 0.9]]) { const p = P(a, b, 0); ball(p[0], p[1] - r * z, r * z); }   // Schneebälle
  };
  // Eisbank schlicht (Nutzer 28./29.10.2026 „too much“, Lehne etwas niedriger): nur Lehne, Sitz, zwei Füße, etwas Schnee
  const eisbank = (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, BL = 0.21;
    snowPile(cx, cy, 10, z);
    const iceBox = (a0, a1, b0, b1, h0, h1) => { box3(K, a0, a1, b0, b1, h0, h1, C('#eef9ff'), C('#a6d7ef'), C('#c6eaf9'));
      sdLine('rgba(255,255,255,0.85)', 0.3, z, [P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)]); };
    const A0 = -0.08, A1 = -0.045, H0 = 3.4, H1 = 8.5;
    iceBox(A0, A1, -BL, BL, H0, H1);
    const sp = []; for (let i = 0; i <= 8; i++) { const b = -BL + i * BL / 4; sp.push(P((A0 + A1) / 2, b, H1 + (i % 2 ? 1 : 0.6))); }
    poly([P(A0 - 0.004, -BL - 0.008, H1 - 0.2), ...sp, P(A1 + 0.004, BL + 0.008, H1 - 0.2)], C(SNOW));
    sdLine('rgba(255,255,255,0.6)', 0.3, z, [P(A1, -0.1, H0 + 1.8), P(A1, -0.06, H1 - 1.2)]);
    for (const b of [-0.16, 0.12]) iceBox(-0.035, 0.055, b, b + 0.04, 0, H0);                              // Füße
    iceBox(-0.045, 0.07, -BL, BL, H0, H0 + 1.2);                                                          // Sitz
    const s = P(0.01, -0.15, H0 + 1.2); ellipse(s[0], s[1], 2.2 * z, 0.9 * z, C(SNOW)); ellipse(s[0] + 0.6 * z, s[1] - 0.3 * z, 1.2 * z, 0.5 * z, '#ffffff');
  };
  return [
    ['Schneemann', (cx, cy, z) => schneemann(cx, cy, z)],
    ['Eiskristall-Laterne', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 5, z);
      sdLine('#9fc3d8', 1.6, z, [[cx, cy], [cx, cy - 17 * z]]);
      const L = [cx, cy - 21 * z];
      poly([[L[0], L[1] - 6 * z], [L[0] + 3.4 * z, L[1] - 1 * z], [L[0] + 2 * z, L[1] + 4 * z], [L[0] - 2 * z, L[1] + 4 * z], [L[0] - 3.4 * z, L[1] - 1 * z]], lit ? '#e6f6ff' : C(ICE));
      poly([[L[0], L[1] - 6 * z], [L[0] + 3.4 * z, L[1] - 1 * z], [L[0], L[1] + 1 * z]], lit ? '#ffffff' : C(ICE_L));
      if (lit) glowAt(L[0], L[1], 24 * z, z, 'blue');
      sdLine('#9fc3d8', 0.5, z, [[L[0], L[1] - 6 * z], [L[0], L[1] - 7.4 * z]]);                       // Flocke sitzt auf der Spitze (schwebte)
      flake(L[0], L[1] - 9 * z, 2 * z, lit ? '#ffffff' : C('#ffffff'), Math.max(0.5, 0.6 * z));
      if (lit) circle(L[0], L[1] + 0.6 * z, 1.4 * z, '#ffffff');                                       // Licht im Kristall
    }],
    ['Verschneite Tanne', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      poly([[cx - 1.4 * z, cy], [cx + 1.4 * z, cy], [cx + 1.4 * z, cy - 4 * z], [cx - 1.4 * z, cy - 4 * z]], C('#6e4a3a'));
      for (const [y0, w] of [[-4, 9], [-12, 7], [-19, 5]]) {
        poly([[cx - w * z, cy + y0 * z], [cx + w * z, cy + y0 * z], [cx, cy + (y0 - 11) * z]], C('#2f7a4a'));
        poly([[cx - w * 0.9 * z, cy + (y0 - 1) * z], [cx - w * 0.2 * z, cy + (y0 - 2.5) * z], [cx, cy + (y0 - 11) * z], [cx - w * 0.5 * z, cy + (y0 - 5) * z]], C(SNOW));
      }
      sdStarDraw([cx, cy - 31 * z], 2 * z, '#f5c84b', '#c9962a');
    }],
    ['Schlitten mit Geschenken', (cx, cy, z) => schlitten(cx, cy, z)],
    ['Rentier', (cx, cy, z) => rentier(cx, cy, z)],
    ['Iglu', (cx, cy, z) => iglu(cx, cy, z), true],
    ['Eisblumen', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 7, z);
      for (const [dx, dy, h] of [[-4, 1, 8], [0, 0, 11], [4, 1, 9]]) {
        sdLine('#7fb6cf', 0.7, z, [[cx + dx * z, cy + dy * z], [cx + dx * z, cy + (dy - h) * z]]);
        const p = [cx + dx * z, cy + (dy - h) * z];
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; poly([[p[0], p[1]], [p[0] + Math.cos(a - 0.25) * 2.6 * z, p[1] + Math.sin(a - 0.25) * 1.8 * z], [p[0] + Math.cos(a + 0.25) * 2.6 * z, p[1] + Math.sin(a + 0.25) * 1.8 * z]], lit ? '#e6f6ff' : C(ICE)); }
        circle(p[0], p[1], 0.8 * z, C('#ffffff'));
        if (lit) glowAt(p[0], p[1], 7 * z, z, 'blue');
      }
    }],
    ['Schneeflocken-Bogen', (cx, cy, z, now, x, y, t) => {                // Durchgang (sdArch): Eisbogen, Flocken an Fäden
      const lit = sdLit(), { Q } = sdArch(cx, cy, z, t), top = sd => 16 + 11 * Math.sqrt(Math.max(0, 1 - sd * sd));
      for (const sd of [-1, 1]) { const f = Q(sd); ellipse(f[0], f[1] + 0.5 * z, 3.2 * z, 1.4 * z, C(SNOW_S)); ellipse(f[0] - 0.3 * z, f[1], 2.7 * z, 1.1 * z, C(SNOW)); }
      const arch = (col, w) => { g.strokeStyle = col; g.lineWidth = Math.max(0.6, w * z); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
        g.moveTo(...Q(-1)); g.lineTo(...Q(-1, 16)); for (let i = 1; i <= 24; i++) { const sd = -1 + i / 12; g.lineTo(...Q(sd, top(sd))); } g.lineTo(...Q(1)); g.stroke(); };
      arch(C(ICE_D), 1.9); arch(lit ? '#ffffff' : C(ICE_L), 0.6);
      for (const [sd, len] of [[-0.62, 3], [-0.28, 5.2], [0.28, 3.6], [0.62, 4.6], [0, 7.5]]) {
        const a = Q(sd, top(sd) - 0.9), p = [a[0], a[1] + len * z];
        sdLine('#cfe6f2', 0.3, z, [a, p]);
        flake(p[0], p[1] + 1.4 * z, 1.6 * z, lit ? '#ffffff' : C('#9fd3ee'), Math.max(0.5, 0.55 * z));
        if (lit) glowAt(p[0], p[1] + 1.4 * z, 7 * z, z, 'blue');
      }
    }],
    ['Eisbank', (cx, cy, z) => eisbank(cx, cy, z)],
    ['Eisbär', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      ellipse(cx - 1 * z, cy - 6 * z, 7.5 * z, 5 * z, C('#f6f3ea'));
      for (const dx of [-6, -2.5, 2, 4.6]) ellipse(cx + dx * z, cy - 1.4 * z, 1.8 * z, 1.6 * z, C('#ece7da'));
      circle(cx + 6 * z, cy - 9 * z, 3.6 * z, C('#f6f3ea')); ellipse(cx + 9 * z, cy - 8.4 * z, 1.8 * z, 1.4 * z, C('#ece7da'));
      circle(cx + 10.4 * z, cy - 8.8 * z, 0.6 * z, C('#3a3a44')); circle(cx + 7 * z, cy - 10 * z, 0.5 * z, C('#3a3a44'));
      circle(cx + 4.4 * z, cy - 12.2 * z, 1.2 * z, C('#f6f3ea'));
    }],
    ['Pinguine', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      for (const [dx, s] of [[-4, 1], [3.6, 0.85]]) {
        const x = cx + dx * z, H = 11 * s;
        ellipse(x, cy - H * 0.45 * z, 3.4 * s * z, H * 0.5 * z, C('#2f3440'));
        ellipse(x + 0.6 * z, cy - H * 0.42 * z, 2.2 * s * z, H * 0.4 * z, C('#ffffff'));
        circle(x, cy - H * z, 2.4 * s * z, C('#2f3440')); circle(x + 0.9 * s * z, cy - H * z, 0.4 * z, C('#ffffff'));
        poly([[x + 2 * s * z, cy - H * z], [x + 3.6 * s * z, cy - (H - 0.6) * z], [x + 2 * s * z, cy - (H - 1) * z]], C('#f0a24a'));
        ellipse(x, cy - 0.3 * z, 1.8 * s * z, 0.7 * z, C('#f0a24a'));
        if (s === 1) pengScarf(x, cy - 9.2 * z, 2.6, z);   // Schal um den Hals (Entwurf A, tools/basar-entwurf-pl.js, Nutzer 28.10.2026)
      }
    }],
    ['Schneekugel', (cx, cy, z, now = 0) => globe(cx, cy, z, now)],   // Schnee rieselt (ANIM_ITEMS)
    // Bewohner fahren Schlittschuh (Basar-Durchsicht 28.10.2026): zwei gleiten auf Ellipsen über das Eis, mit Mütze und Schal, Kufenspur dahinter
    ['Schlittschuh-Teich', (cx, cy, z, now = 0, x = 0, y = 0) => {
      snow(cx, cy, 24, z);
      ellipse(cx, cy, 20 * z, 9.6 * z, C('#a9d8ef')); ellipse(cx - 3 * z, cy - 1.5 * z, 13 * z, 5 * z, C('#c9ebfa'));
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = Math.max(0.5, 0.5 * z);
      g.beginPath(); g.ellipse(cx + 2 * z, cy + 1 * z, 9 * z, 3.6 * z, 0.2, 0, Math.PI * 1.6); g.stroke();
      g.beginPath(); g.ellipse(cx - 5 * z, cy - 1 * z, 5 * z, 2 * z, -0.3, 0.4, Math.PI * 2); g.stroke();
      for (const [dx, dy] of [[14, -4], [-16, 2], [10, 6]]) { ellipse(cx + dx * z, cy + dy * z, 2.4 * z, 1.4 * z, C(SNOW)); }
      sdLine('#6b4f3a', 0.9, z, [[cx + 16 * z, cy + 1 * z], [cx + 16 * z, cy - 9 * z]]); poly([[cx + 16 * z, cy - 9 * z], [cx + 21 * z, cy - 8 * z], [cx + 16 * z, cy - 6.6 * z]], C('#d9534a'));
      const t = (now || 0) / 1000, sk = [0, 1].map(i => { const a = t * (0.45 + i * 0.1) * (i ? -1 : 1) + i * 2.4, rx = 12 - i * 4.5, ry = 4.8 - i * 1.8;
        return { i, a, rx, ry, px: cx - 2 * z + Math.cos(a) * rx * z, py: cy - 0.5 * z + Math.sin(a) * ry * z }; }).sort((p, q) => p.py - q.py);
      for (const k of sk) {
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath();
        g.ellipse(cx - 2 * z, cy - 0.5 * z, k.rx * z, k.ry * z, 0, k.i ? k.a : k.a - 0.7, k.i ? k.a + 0.7 : k.a); g.stroke();
        ellipse(k.px, k.py, 2.2 * z, 0.8 * z, 'rgba(60,110,150,0.2)');
        for (const d of [-0.9, 0.9]) sdLine('#c9d3dc', 0.35, z, [[k.px + (d - 1) * z, k.py - 0.2 * z], [k.px + (d + 1.1) * z, k.py - 0.6 * z]]);   // Kufen
        if (typeof drawFigure === 'function') drawFigure({ seat: true, sx: k.px - 6 * z, sy: k.py, wait: 1, speed: 1, kind: [0, 2, 1][Math.floor(hash(x, y, 31 + k.i) * 3)],
          fur: FUR[Math.floor(hash(x, y, 33 + k.i) * FUR.length)], shirt: SHIRTS[(Math.floor(hash(x, y, 35) * SHIRTS.length) + k.i * 3) % SHIRTS.length], hat: 'muetze', body: 'schal', figS: 0.5 }, z, now);
      }
    }, true],
    ['Eispalast-Pavillon ✦', (cx, cy, z, now = 0) => pavillon(cx, cy, z, now), true],   // Flocke dreht sich, Funkeln (ANIM_ITEMS)
    ['Schneeflocken-Brunnen ✦', (cx, cy, z, now = 0) => brunnenB(cx, cy, z, now), true],   // Wasser fällt, Schollen treiben, Flocke dreht sich (ANIM_ITEMS)
  ];
})();
// 🏰 Turm & Himmelslaternen und 👑 Prinzessinnen & Märchen (Block 161c): eigene Motive nach Grimms Märchen (Rapunzel, Aschenputtel,
// Dornröschen, Schneewittchen, Froschkönig) – keine Disney-Figuren. Form wie SD_ART; Bogen: tools/waren-entwurf.js
(() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', PINK = '#ff9ec0', ROSE = '#e8546f', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const heart = (x, y, r, col) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35); g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); g.fillStyle = col; g.fill(); };
  // Himmelslaterne als Ballon (Entwurf A, tools/basar-entwurf-pl.js, Nutzer 28.10.2026; x, y = Öffnung unten): oben rund und breit, unten schmal,
  // Licht von innen (unten am hellsten), Nähte, Drahtring, Flamme; nachts heller und mit Schein ab der Flamme
  const balloonLantern = (x, y, w, z, lit, glow = 1) => {               // glow: Größe des Scheins (Laternenboot: viele, daher kleiner)
    const W = w * z, H = 2.3 * W;
    const path = () => { g.beginPath(); g.moveTo(x - 0.5 * W, y); g.bezierCurveTo(x - 0.95 * W, y - 0.3 * H, x - 1.05 * W, y - 0.75 * H, x - 0.7 * W, y - 0.93 * H);
      g.quadraticCurveTo(x, y - 1.12 * H, x + 0.7 * W, y - 0.93 * H); g.bezierCurveTo(x + 1.05 * W, y - 0.75 * H, x + 0.95 * W, y - 0.3 * H, x + 0.5 * W, y); g.closePath(); };
    const gr = g.createRadialGradient(x, y - 0.15 * H, 0, x, y - 0.35 * H, H * 0.95);
    gr.addColorStop(0, lit ? '#fffbe0' : C('#fff3c4')); gr.addColorStop(0.45, lit ? '#ffe39a' : C('#ffd58f')); gr.addColorStop(1, lit ? '#ffb85c' : C('#f2a35a'));
    path(); g.fillStyle = gr; g.fill();
    g.save(); path(); g.clip(); g.fillStyle = 'rgba(190,100,40,0.16)'; g.fillRect(x + 0.25 * W, y - 1.2 * H, W, 1.3 * H); g.restore();   // rechte Seite im Schatten
    g.strokeStyle = lit ? 'rgba(230,150,60,0.5)' : 'rgba(200,120,50,0.35)'; g.lineWidth = Math.max(0.4, 0.14 * z);
    for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x + k * 0.5 * W, y); g.bezierCurveTo(x + k * 0.95 * W, y - 0.3 * H, x + k * 1.05 * W, y - 0.75 * H, x + k * 0.5 * W, y - H); g.stroke(); }
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.16 * z); g.beginPath(); g.ellipse(x, y, 0.5 * W, 0.14 * W, 0, 0, Math.PI * 2); g.stroke();
    ellipse(x, y - 0.12 * W, 0.2 * W, 0.3 * W, lit ? '#fff7c8' : C('#ffb23a')); circle(x, y - 0.06 * W, 0.1 * W, '#ffffff');
    if (lit && glow) glowAt(x, y - 0.12 * W, w * 8 * z * glow, z);
  };
  const skyLantern = (x, y, w, z, lit) => { poly([[x - w * z, y], [x + w * z, y], [x + w * 0.8 * z, y - w * 2 * z], [x - w * 0.8 * z, y - w * 2 * z]], lit ? '#ffcf6a' : C('#ffb347')); ellipse(x, y - w * 2 * z, w * 0.8 * z, w * 0.3 * z, lit ? '#ffe39a' : C('#ffc76a')); if (lit) glowAt(x, y - w * z, w * 7 * z, z); };

  // Neu gezeichnet (Basar-Durchsicht 29.10.2026, Entwürfe tools/basar-entwurf-p6.js, Nutzer: Turm B, Laternenboot B)
  const TAU = Math.PI * 2;
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  // ── Runder Turm ───────────────────────────────────────────────────────────────────────────────────────────────────────
  // Zylinder in Bildschirm-Koordinaten (Ellipsen 2:1): t = 0 rechts, π/2 vorn, π links. Seiten heller links (Licht von links oben).
  // Bögen als Ellipsenbögen (ein Befehl statt vieler Punkte)
  // Seitenband zwischen zwei vorderen Halbbögen (unten y0/r0, oben y1/r1) als ein Pfad aus Ellipsenbögen
  const band = (cx, y0, r0, y1, r1) => { g.beginPath(); g.ellipse(cx, y0, r0, r0 / 2, 0, Math.PI, 0, true); g.ellipse(cx, y1, r1, r1 / 2, 0, 0, Math.PI); g.closePath(); };
  const halfArc = (cx, y, r, t0 = 0, t1 = Math.PI) => { g.moveTo(cx + r * Math.cos(t0), y + r / 2 * Math.sin(t0)); g.ellipse(cx, y, r, r / 2, 0, t0, t1); };
  const cyl = (cx, cy, r0, r1, h0, h1, z, light, mid, dark, top) => {                                             // top: Deckel in dieser Farbe
    const gr = g.createLinearGradient(cx - r0 * z, 0, cx + r0 * z, 0); gr.addColorStop(0, C(light)); gr.addColorStop(0.45, C(mid)); gr.addColorStop(1, C(dark));
    band(cx, cy - h0 * z, r0 * z, cy - h1 * z, r1 * z); g.fillStyle = gr; g.fill();
    if (top) ellipse(cx, cy - h1 * z, r1 * z, r1 / 2 * z, C(top));
  };
  const topDisc = (cx, cy, r, h, z, col) => ellipse(cx, cy - h * z, r * z, r / 2 * z, C(col));
  const rAt = (r0, r1, h0, h1, h) => r0 + (r1 - r0) * (h - h0) / (h1 - h0);
  // Steinreihen: jede Reihe ein vorderer Halbbogen auf ihrer Höhe, Stoßfugen je Reihe versetzt (nur vorn, wo sie gut zu sehen sind)
  const courses = (cx, cy, r0, r1, h0, h1, step, z, col) => {
    g.strokeStyle = C(col); g.lineWidth = Math.max(0.4, 0.32 * z); g.lineCap = 'round'; g.beginPath();
    const hs = []; for (let h = h0 + step; h < h1 - 0.5; h += step) hs.push(h);
    for (const h of hs) { const r = rAt(r0, r1, h0, h1, h) * z; halfArc(cx, cy - h * z, r, 0.04, Math.PI - 0.04); }
    [h0, ...hs].forEach((h, i) => { const hn = Math.min(h1, h + step), r = rAt(r0, r1, h0, h1, h) * z, rn = rAt(r0, r1, h0, h1, hn) * z;
      for (let j = 0; j < 6; j++) { const t = (j + (i % 2 ? 0.5 : 0) + 0.25) / 6 * Math.PI; if (Math.sin(t) < 0.3) continue;
        g.moveTo(cx + r * Math.cos(t), cy - h * z + r / 2 * Math.sin(t)); g.lineTo(cx + rn * Math.cos(t), cy - hn * z + rn / 2 * Math.sin(t)); } });
    g.stroke();
  };
  // Fenster auf der Turmwand bei Winkel t (gestaucht nach der Rundung), Höhe h (Unterkante), w/hh Breite/Höhe
  const winAt = (cx, cy, r, t, h, w, hh, z, fill, frame) => {
    const x = cx + r * z * Math.cos(t), y = cy - h * z + r / 2 * z * Math.sin(t), sx = Math.sin(t) * w * z;
    const pts = [[x - sx, y], [x + sx, y], [x + sx, y - (hh - w) * z], ...Array.from({ length: 9 }, (_, i) => { const a = i / 8 * Math.PI; return [x + Math.cos(a) * sx, y - (hh - w) * z - Math.sin(a) * w * z]; })];
    path(pts); g.fillStyle = fill; g.fill(); g.strokeStyle = C(frame); g.lineWidth = Math.max(0.5, 0.5 * z); g.stroke();
    return [x, y, sx];
  };
  // Zopf: Mittellinie als Kurve, darauf schräge Glieder abwechselnd links/rechts (geflochten), Bänder und Blüten
  const braid = (pts, z, w = 1.25) => {
    const N = 40;
    // weiche Kurve durch die Punkte (Catmull-Rom über die Stützpunkte)
    const cr = (u) => { const n = pts.length - 1, s = Math.min(n - 1e-6, u * n), k = Math.floor(s), f = s - k, p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(n, k + 2)];
      const c = (a, b, c2, d) => 0.5 * ((2 * b) + (-a + c2) * f + (2 * a - 5 * b + 4 * c2 - d) * f * f + (-a + 3 * b - 3 * c2 + d) * f * f * f);
      return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]; };
    const pt = Array.from({ length: N + 1 }, (_, i) => cr(i / N));
    g.strokeStyle = C('#c98f26'); g.lineWidth = Math.max(0.8, (w * 2 + 0.5) * z); g.lineCap = 'round'; g.lineJoin = 'round'; path(pt, false); g.stroke();
    g.strokeStyle = C('#f2c24e'); g.lineWidth = Math.max(0.7, w * 2 * z); path(pt, false); g.stroke();
    const link = i => { const [x, y] = pt[i], dx = pt[i + 1][0] - pt[i - 1][0], dy = pt[i + 1][1] - pt[i - 1][1], a = Math.atan2(dy, dx), s = i % 2 ? 1 : -1,   // Glieder: je Seite ein Pfad
      ex = x + Math.cos(a + Math.PI / 2) * s * 0.35 * w * z, ey = y + Math.sin(a + Math.PI / 2) * s * 0.35 * w * z;
      g.moveTo(ex + Math.cos(a + s * 0.7) * 0.9 * w * z, ey + Math.sin(a + s * 0.7) * 0.9 * w * z); g.ellipse(ex, ey, 0.9 * w * z, 0.55 * w * z, a + s * 0.7, 0, TAU); };
    for (const odd of [0, 1]) { g.beginPath(); for (let i = 1 + odd; i < N; i += 2) link(i);
      g.fillStyle = C(odd ? '#ffd968' : '#f6c94a'); g.fill(); g.strokeStyle = C('#d29a2e'); g.lineWidth = Math.max(0.3, 0.18 * z); g.stroke(); }
    for (const [u, c] of [[0.3, PINK], [0.5, '#ffffff'], [0.68, LILA], [0.84, PINK]]) { const [x, y] = cr(u); rose(x, y, 0.75 * z, c); }   // eingeflochtene Blüten
    return cr;
  };

  const zopfturm = (cx, cy, z) => {
    const lit = sdLit();
    sdShadow(cx, cy, 18, z);
    // Wiese am Fuß: Steine, Rosenbusch
    for (const [dx, dy, r] of [[-13, 3, 1.6], [-10, 5, 1.1], [12, 4, 1.4], [9, 6.4, 1]]) { ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.6 * z, C('#a7a196')); ellipse(cx + (dx - 0.3) * z, cy + (dy - 0.3) * z, r * 0.7 * z, r * 0.4 * z, C('#c4beb2')); }
    const B0 = 10, R0 = 8.2, R1 = 7.4, HB = 4, HT = 50;                                                      // Sockel, Schaft unten/oben, Höhen
    cyl(cx, cy, B0, B0 - 0.3, 0, HB, z, '#d9cdb7', '#cbbda4', '#a8977c'); topDisc(cx, cy, B0 - 0.3, HB, z, '#bfb096');
    courses(cx, cy, B0, B0 - 0.3, 0, HB, 2, z, '#9d8c72');
    cyl(cx, cy, R0, R1, HB, HT, z, '#f2e7d2', '#e6d6b8', '#bda98a');
    courses(cx, cy, R0, R1, HB, HT, 4.4, z, '#c9b592');
    for (const [h, t, d] of [[9, 0.42, 0.06], [22, 0.7, -0.05], [35, 0.33, 0.05], [44, 0.62, -0.06], [26, 0.52, 0.04], [40, 0.47, -0.04]]) {   // einzelne Steine heller/dunkler
      const r = rAt(R0, R1, HB, HT, h) * z, x = cx + r * Math.cos(t * Math.PI), y = cy - h * z + r / 2 * Math.sin(t * Math.PI), sw = Math.sin(t * Math.PI) * 1.6 * z;
      poly([[x - sw, y], [x + sw, y], [x + sw, y - 4.2 * z], [x - sw, y - 4.2 * z]], d > 0 ? 'rgba(255,255,255,0.18)' : 'rgba(120,90,50,0.12)'); }
    for (const [h, t] of [[16, 0.36], [31, 0.66]]) winAt(cx, cy, rAt(R0, R1, HB, HT, h), t * Math.PI, h, 0.7, 4.2, z, lit ? '#ffcf7a' : C('#4d4060'), '#bba585');   // Schießscharten-Fenster
    // Kragsteine und Kammer oben (etwas breiter)
    const KR = 8.8, K0 = HT, K1 = HT + 13;
    for (let j = 0; j < 9; j++) { const t = (j + 0.5) / 9 * Math.PI, x = cx + R1 * z * Math.cos(t), y = cy - HT * z + R1 / 2 * z * Math.sin(t), s = Math.sin(t) * 0.8 * z;
      poly([[x - s, y], [x + s, y], [x + s * 1.3, y - 2.2 * z], [x - s * 1.3, y - 2.2 * z]], C(t < Math.PI / 2 ? '#c7b494' : '#ddcdb0')); }
    const BR = KR + 2.2, BH = K0 + 1.2;
    {                                                                                                         // Balkonboden vor der Kammer (Kammer verdeckt den hinteren Teil)
      band(cx, cy - (BH - 0.8) * z, BR * z, cy - BH * z, BR * z); g.fillStyle = C('#7d5236'); g.fill();
      ellipse(cx, cy - BH * z, BR * z, BR / 2 * z, C('#9a6a44'));
      g.strokeStyle = C('#85593a'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();
      for (let j = 1; j < 10; j++) { const t = j / 10 * Math.PI; g.moveTo(cx + KR * z * Math.cos(t), cy - BH * z + KR / 2 * z * Math.sin(t)); g.lineTo(cx + BR * z * Math.cos(t), cy - BH * z + BR / 2 * z * Math.sin(t)); }
      g.stroke();
      g.strokeStyle = C('#74492e'); g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();                  // Geländer hinten (Nutzer 29.10.2026: „muss bis rum gehen“), Kammer verdeckt die Mitte
      for (let j = 1; j < 16; j++) { const t = Math.PI + j / 16 * Math.PI, x = cx + BR * z * Math.cos(t), y = cy - BH * z + BR / 2 * z * Math.sin(t); g.moveTo(x, y); g.lineTo(x, y - 3 * z); }
      g.stroke(); g.lineWidth = Math.max(0.6, 0.6 * z); g.beginPath(); halfArc(cx, cy - (BH + 3) * z, BR * z, Math.PI, 2 * Math.PI); g.stroke();
    }
    cyl(cx, cy, KR, KR, K0 + 1.8, K1, z, '#f6ecd9', '#ead9bc', '#c3ae8e');
    band(cx, cy - (K0 + 1.8) * z, KR * z, cy - (K0 + 3) * z, KR * z); g.fillStyle = C('#d4c1a0'); g.fill();   // Gesims
    courses(cx, cy, KR, KR, K0 + 3, K1, 3.4, z, '#cdb998');
    const wT = 0.62 * Math.PI, [wx, wy, wsx] = winAt(cx, cy, KR, wT, K0 + 4.2, 1.9, 7.4, z, lit ? '#ffd27a' : C('#5d4f73'), '#a88d64');   // Fenster mit Läden
    if (!lit) { g.save(); path([[wx - wsx, wy], [wx + wsx, wy], [wx + wsx, wy - 5.5 * z], [wx - wsx, wy - 5.5 * z]]); g.clip(); poly([[wx - wsx, wy - 5.5 * z], [wx + wsx, wy - 5.5 * z], [wx - wsx, wy - 1 * z]], 'rgba(255,255,255,0.12)'); g.restore(); }
    for (const s of [-1, 1]) poly([[wx + s * wsx, wy], [wx + s * (wsx + 1.5 * z), wy + 0.4 * z], [wx + s * (wsx + 1.5 * z), wy - 5.8 * z], [wx + s * wsx, wy - 6 * z]], C(s < 0 ? '#8a62c4' : '#7353a8'));
    poly([[wx - wsx - 0.6 * z, wy + 0.2 * z], [wx + wsx + 0.6 * z, wy + 0.2 * z], [wx + wsx + 0.4 * z, wy + 1.8 * z], [wx - wsx - 0.4 * z, wy + 1.8 * z]], C('#8a5a3c'));   // Blumenkasten
    for (let k = 0; k < 5; k++) rose(wx + (-1.6 + k * 0.8) * z * (wsx / (1.9 * z)), wy - 0.2 * z - (k % 2) * 0.5 * z, 0.55 * z, [PINK, '#ffffff', LILA, '#ffd23f', PINK][k]);
    if (lit) glowAt(wx, wy - 3 * z, 20 * z, z);
    {                                                                                                         // Geländer vorn (Holzbalkon rund um die Kammer)
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();
      for (let j = 0; j <= 16; j++) { const t = j / 16 * Math.PI, x = cx + BR * z * Math.cos(t), y = cy - BH * z + BR / 2 * z * Math.sin(t); g.moveTo(x, y); g.lineTo(x, y - 3 * z); }
      g.stroke(); g.lineWidth = Math.max(0.6, 0.6 * z); g.beginPath(); halfArc(cx, cy - (BH + 3) * z, BR * z); g.stroke();
      for (let j = 1; j < 16; j += 3) { const t = j / 16 * Math.PI; rose(cx + BR * z * Math.cos(t), cy - (BH + 3) * z + BR / 2 * z * Math.sin(t), 0.6 * z, [PINK, LILA, '#ffffff'][j % 3]); }
    }
    // Dach: Kegel mit Überstand, Schindelreihen als Bögen, Rand dunkler
    const DR = KR + 2, D0 = K1, D1 = K1 + 22;
    ellipse(cx, cy - D0 * z, DR * z, DR / 2 * z, C('#4a3570'));
    const rg = g.createLinearGradient(cx - DR * z, 0, cx + DR * z, 0); rg.addColorStop(0, C('#9a7ccc')); rg.addColorStop(0.45, C('#7b5ea7')); rg.addColorStop(1, C('#5a4287'));
    g.beginPath(); g.ellipse(cx, cy - D0 * z, DR * z, DR / 2 * z, 0, Math.PI, 0, true); g.lineTo(cx, cy - D1 * z); g.closePath(); g.fillStyle = rg; g.fill();
    g.strokeStyle = 'rgba(60,35,90,0.35)'; g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath();
    for (const f of [0.2, 0.4, 0.58, 0.74, 0.87]) { const r = DR * (1 - f) * z, y = cy - (D0 + (D1 - D0) * f) * z; halfArc(cx, y, r, 0.1, Math.PI - 0.1); }
    for (let j = 1; j < 8; j++) { const t = j / 8 * Math.PI; g.moveTo(cx + DR * z * Math.cos(t), cy - D0 * z + DR / 2 * z * Math.sin(t)); g.lineTo(cx + DR * 0.2 * z * Math.cos(t), cy - (D0 + (D1 - D0) * 0.8) * z + DR * 0.1 * z * Math.sin(t)); }
    g.stroke();
    g.strokeStyle = C('#3f2c60'); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); halfArc(cx, cy - D0 * z, DR * z); g.stroke();
    circle(cx, cy - D1 * z, 0.8 * z, C('#f5c84b'));
    sdLine('#6b4f3a', 0.5, z, [[cx, cy - D1 * z], [cx, cy - (D1 + 6) * z]]);
    poly([[cx, cy - (D1 + 6) * z], [cx + 4.5 * z, cy - (D1 + 5) * z], [cx, cy - (D1 + 3.6) * z]], C('#ffd23f'));
    // Rosenranke vom Fuß bis fast zum Balkon, Rosenbusch am Fuß
    const vine = Array.from({ length: 40 }, (_, i) => { const u = i / 39, h = HB + u * (HT - HB - 3), t = Math.PI * (0.88 + 0.05 * Math.sin(u * Math.PI * 3.2) - u * 0.1), r = rAt(R0, R1, HB, HT, h) + 0.3;
      return [cx + r * z * Math.cos(t), cy - h * z + r / 2 * z * Math.sin(t)]; });
    g.strokeStyle = C('#4f7f33'); g.lineWidth = Math.max(0.5, 0.6 * z); g.lineCap = 'round'; path(vine, false); g.stroke();
    for (const dk of [0, 1]) { g.beginPath(); vine.forEach((p, i) => { if (i % 2 || (i % 3 ? 0 : 1) !== dk) return;   // Blätter je Farbe ein Pfad
      const x = p[0] + (i % 4 ? 1 : -1) * 0.8 * z, r = 1 * z, rot = i * 0.9; g.moveTo(x + Math.cos(rot) * r, p[1] + Math.sin(rot) * r); g.ellipse(x, p[1], r, r * 0.5, rot, 0, TAU); });
      g.fillStyle = C(dk ? '#5a9a3c' : '#6fb04a'); g.fill(); }
    vine.forEach((p, i) => { if (i % 6 === 0 || i === vine.length - 1) rose(p[0] + 0.6 * z, p[1] - 0.6 * z, 0.9 * z, [PINK, '#e8546f', '#ffffff'][i % 3]); });
    for (const [dx, r] of [[-9.5, 2.2], [-7, 1.8]]) { sdBlob(cx + dx * z, cy + 3.2 * z, z, [[0, 0, r]], '#5a9a3c', '#6fb04a'); rose(cx + (dx + 0.6) * z, cy + 1.8 * z, 0.8 * z, PINK); }
    // Zopf vom Fenster bis auf die Wiese, unten eingerollt mit Schleife
    const sx = wx + wsx * 0.3, sy = wy + 1.6 * z, rr = rAt(R0, R1, HB, HT, 30);
    const cr = braid([[sx, sy], [sx - 1 * z, cy - 46 * z], [cx - rr * 0.5 * z + 1.5 * z, cy - 32 * z], [cx - rr * 0.3 * z, cy - 17 * z], [cx - 1 * z, cy - 4 * z], [cx + 2 * z, cy + 3.6 * z], [cx + 6 * z, cy + 4.4 * z], [cx + 7.4 * z, cy + 2.6 * z], [cx + 5 * z, cy + 1.8 * z]], z);
    const bo = cr(0.94); for (const s of [-1, 1]) poly([[bo[0], bo[1]], [bo[0] + s * 1.8 * z, bo[1] - 1 * z], [bo[0] + s * 1.8 * z, bo[1] + 1 * z]], C('#e8546f')); circle(bo[0], bo[1], 0.5 * z, C('#c93a58'));
  };

  const pond = (cx, cy, z, now, lit) => {
    const P = [], N = 28; for (let i = 0; i < N; i++) { const t = i / N * TAU, w = 1 + 0.07 * Math.sin(t * 3 + 1) + 0.05 * Math.cos(t * 5); P.push([cx + Math.cos(t) * 15 * w * z, cy + 1 * z + Math.sin(t) * 7 * w * z]); }
    path(P.map(([x, y]) => [x, y + 0.8 * z])); g.fillStyle = C('#7d9a5a'); g.fill();                         // Uferkante
    const gr = g.createLinearGradient(0, cy - 7 * z, 0, cy + 8 * z); gr.addColorStop(0, lit ? '#2c4a6e' : C('#5fb3d6')); gr.addColorStop(1, lit ? '#1e3756' : C('#3f8fb8'));
    path(P); g.fillStyle = gr; g.fill();
    g.save(); path(P); g.clip();
    g.strokeStyle = lit ? 'rgba(255,220,150,0.25)' : 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(0.4, 0.35 * z);
    for (let k = 0; k < 4; k++) { const p = ((now / 3000) + k / 4) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(cx + 1 * z, cy + 2 * z, (6 + p * 9) * z, (2.4 + p * 3.6) * z, 0, 0.2, Math.PI - 0.2); g.stroke(); }
    g.globalAlpha = 1; g.restore();
    for (const [a, s] of [[2.6, 1], [2.9, 0.8], [0.4, 0.9]]) { const x = cx + Math.cos(a) * 14.5 * z, y = cy + 1 * z + Math.sin(a) * 6.8 * z;   // Schilf
      for (const d of [-0.6, 0, 0.7]) sdLine('#5f8f3a', 0.4, z, [[x + d * z, y], [x + (d * 1.6 + 0.3) * z, y - (5 + d * 2) * s * z]]);
      ellipse(x + 0.3 * z, y - 5 * s * z, 0.4 * z, 1.1 * z, C('#7a5233')); }
    for (const [a, r] of [[0.15, 1.4], [5.9, 1], [3.5, 1.2]]) { const x = cx + Math.cos(a) * 15 * z, y = cy + 1 * z + Math.sin(a) * 7 * z; ellipse(x, y, r * z, r * 0.6 * z, C('#a7a196')); ellipse(x - 0.3 * z, y - 0.3 * z, r * 0.7 * z, r * 0.4 * z, C('#c4beb2')); }
  };
  // Ruderboot (kit): Länge entlang a, Bordwand +b sichtbar; Spiegelbild der Laternen kommt vorher ins Wasser
  const boot = (cx, cy, z, now, lit) => {
    const K = kit(cx, cy, z, 0), P = K.P, L = 0.2, W = 0.075, bob = Math.sin(now / 900) * 0.4;
    const w = a => W * Math.pow(Math.max(0, 1 - (a / L) ** 2), 0.7), as = Array.from({ length: 17 }, (_, i) => -L + i / 16 * 2 * L);
    const G = (a, s) => P(a, s * w(a), 3.6 + bob + Math.abs(a / L) ** 2 * 1.6), Bt = (a, s) => P(a * 0.92, s * w(a) * 0.55, 0.4 + bob);
    poly(as.map(a => G(a, -1)).concat(as.slice().reverse().map(a => G(a, 1))), C('#5e3c26'));                   // Innenraum
    const inner = []; for (const a of as) inner.push(P(a * 0.9, -w(a) * 0.75, 1.6 + bob)); for (const a of as.slice().reverse()) inner.push(P(a * 0.9, w(a) * 0.75, 1.6 + bob));
    poly(inner, C('#7a5233'));                                                                                     // Boden
    for (const a0 of [-0.08, 0.06]) { const p = [P(a0 - 0.012, -w(a0) * 0.92, 2.8 + bob), P(a0 + 0.012, -w(a0) * 0.92, 2.8 + bob), P(a0 + 0.012, w(a0) * 0.92, 2.8 + bob), P(a0 - 0.012, w(a0) * 0.92, 2.8 + bob)]; poly(p, C('#b88a5a')); }   // Bänke
    const side = as.map(a => G(a, 1)).concat(as.slice().reverse().map(a => Bt(a, 1)));
    const hg = g.createLinearGradient(0, G(0, 1)[1], 0, Bt(0, 1)[1]); hg.addColorStop(0, C('#c98a55')); hg.addColorStop(1, C('#8a5a3c'));
    path(side); g.fillStyle = hg; g.fill();
    g.strokeStyle = C('#7a4c30'); g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath();                          // Planken
    for (const f of [0.35, 0.68]) as.forEach((a, i) => { const p = G(a, 1), q = Bt(a, 1), m = [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]; i ? g.lineTo(...m) : g.moveTo(...m); });
    g.stroke();
    g.strokeStyle = C('#e0b07a'); g.lineWidth = Math.max(0.5, 0.55 * z); path(as.map(a => G(a, 1)), false); g.stroke();   // Bordkante
    g.strokeStyle = C('#a06c44'); g.lineWidth = Math.max(0.4, 0.4 * z); path(as.map(a => G(a, -1)), false); g.stroke();
    ellipse(...P(0, 0.02, 0), 15 * z * 0.6, 2 * z, 'rgba(255,255,255,0.18)');                                    // Wasserlinie
    sdLine('#c89a62', 0.5, z, [P(-0.02, w(-0.02) * 0.9, 3.2 + bob), P(-0.1, 0.2, 0.2 + bob)]);                    // Ruder
    ellipse(...P(-0.1, 0.2, 0.2 + bob), 1.4 * z, 0.5 * z, C('#b88a5a'));
    // Laternenstab am Bug, Laterne daran; eine Laterne wartet im Boot
    const bow = G(L * 0.82, 0), top = [bow[0] - 1 * z, bow[1] - 12 * z];
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = Math.max(0.5, 0.55 * z); g.beginPath(); g.moveTo(...bow); g.quadraticCurveTo(bow[0] - 1.5 * z, bow[1] - 9 * z, top[0] + 3 * z, top[1]); g.stroke();
    sdLine('#6b4f3a', 0.25, z, [[top[0] + 3 * z, top[1]], [top[0] + 3 * z, top[1] + 2.5 * z]]);
    const lx = top[0] + 3 * z, ly = top[1] + 5.4 * z;
    poly([[lx - 1.1 * z, ly], [lx + 1.1 * z, ly], [lx + 0.8 * z, ly - 2.9 * z], [lx - 0.8 * z, ly - 2.9 * z]], lit ? '#ffd27a' : C('#ffcf8a'));
    poly([[lx - 1.4 * z, ly - 2.9 * z], [lx + 1.4 * z, ly - 2.9 * z], [lx, ly - 3.9 * z]], C('#8a5a3c')); poly([[lx - 1.2 * z, ly], [lx + 1.2 * z, ly], [lx + 1.2 * z, ly + 0.5 * z], [lx - 1.2 * z, ly + 0.5 * z]], C('#8a5a3c'));
    if (lit) glowAt(lx, ly - 1.4 * z, 14 * z, z);
    const wl = P(-0.13, 0, 2 + bob); balloonLantern(wl[0], wl[1], 1.5, z, lit, 0.6);                                   // noch im Boot
    return G(0, 0);
  };
  // Laternen schweben als lockere Gruppe über dem Boot und wiegen sich (Entwurf B)
  const laternenboot = (cx, cy, z, now = 0) => {
    const lit = sdLit();
    const lan = [[-8, -24], [4, -28], [10, -40], [-3, -42], [-11, -52], [5, -56], [-2, -66]].map((sp, k) =>
      ({ x: cx + (sp[0] + Math.sin(now / 1700 + k * 1.3) * 0.9) * z, y: cy + (sp[1] + Math.sin(now / 1100 + k * 2.1) * 1.2) * z, w: 2.8 - k * 0.12 }));
    pond(cx, cy, z, now, lit);
    boot(cx, cy, z, now, lit);
    for (const l of lan.slice().sort((p, q) => p.w - q.w)) balloonLantern(l.x, l.y, l.w, z, lit, 0.45);
  };

  // Märchen, erste Hälfte (Basar-Durchsicht 31.10.2026, Entwürfe tools/basar-entwurf-p7.js, Nutzer: Bank C1, Pavillon A, Glasschuh A
  // „sehr kurz, spitz“, Brunnen A „schau mal, wo das Wasser herkommt“ → aus dem Maul)
  // Blumenkranz-Bank: die Parkbank aus dem Bank-Menü (drawBench, Holz) in halber Größe, Blütengirlande über der Lehne, eine zweite hängt
  // davor durch, Blütenbogen über der Bank mit Bändern an den Enden, zwei Schmetterlinge
  const kranzbank = (cx, cy, z) => {
    const zz = z * 0.5, K = kit(cx, cy, zz, 0), P = K.P;
    drawBench(cx, cy, zz, { b: 'bank', col: 0, form: 0, rot: 0 }, TW / 2 * zz, TH / 2 * zz);
    const leafAt = (p, k, r) => circle(p[0] + (k % 2 ? 0.3 : -0.3) * z, p[1], r * z, C(k % 3 ? '#6fb04a' : '#559a3e'));
    const top = Array.from({ length: 17 }, (_, i) => { const b = -0.49 + i / 16 * 0.98; return P(-0.1, b, 12 + Math.sin(i / 16 * Math.PI) * 1.2); });
    top.forEach((p, k) => leafAt(p, k, 0.85));
    top.forEach((p, i) => { if (i % 2 === 0) rose(p[0], p[1] - 0.4 * z, 0.75 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][i / 2 % 5]); });
    const swag = Array.from({ length: 15 }, (_, i) => { const u = i / 14, b = -0.42 + u * 0.84; return P(-0.06, b, 11.6 - Math.sin(u * Math.PI) * 2.6); });
    swag.forEach((p, k) => circle(p[0] + (k % 2 ? 0.25 : -0.25) * z, p[1], 0.6 * z, C(k % 3 ? '#6fb04a' : '#559a3e')));
    swag.forEach((p, i) => { if (i % 3 === 1) rose(p[0], p[1] + 0.2 * z, 0.6 * z, [ROSE, '#ffffff', PINK, LILA, '#ffd23f'][i % 5]); });
    for (const b of [-0.49, 0.49]) for (let k = 0; k < 3; k++) { const p = P(-0.1, b, 10.6 - k * 1.6); circle(p[0] + (k % 2 ? 0.5 : -0.5) * z, p[1], 0.8 * z, C('#5aa84f')); if (k === 1) rose(p[0], p[1], 0.7 * z, PINK); }   // Ranken an den Enden
    for (const [a, b, c] of [[0.05, -0.2, PINK], [0.1, 0.15, '#ffffff'], [0.02, 0.3, LILA]]) { const p = P(a, b, 6.1); ellipse(p[0], p[1], 0.7 * z, 0.4 * z, C(c)); }   // Blüten auf dem Sitz
    const arch = Array.from({ length: 25 }, (_, i) => { const b = -0.49 + i / 24 * 0.98; return P(-0.1, b, 12 + 10 * Math.sqrt(Math.max(0, 1 - (b / 0.49) ** 2))); });   // Blütenbogen
    arch.forEach((p, k) => leafAt(p, k, 0.95)); arch.forEach((p, i) => { if (i % 2 === 1) rose(p[0], p[1] - 0.3 * z, 0.8 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][(i >> 1) % 5]); });
    const ribbon = (p, d) => { for (const [o, c] of [[0, ROSE], [0.9, PINK]]) { g.strokeStyle = C(c); g.lineWidth = Math.max(0.4, 0.45 * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(...p);
      g.bezierCurveTo(p[0] + d * (1.5 + o) * z, p[1] + 2.5 * z, p[0] - d * 0.6 * z, p[1] + 5 * z, p[0] + d * (1 + o) * z, p[1] + (7 + o) * z); g.stroke(); }
      for (const s of [-1, 1]) poly([p, [p[0] + s * 1.3 * z, p[1] - 0.8 * z], [p[0] + s * 1.3 * z, p[1] + 0.8 * z]], C(ROSE)); circle(p[0], p[1], 0.45 * z, C('#c93a58')); };
    ribbon(P(-0.1, -0.47, 13.5), -1); ribbon(P(-0.1, 0.47, 13.5), 1);
    for (const [b, h, ph] of [[-0.3, 20, 0], [0.32, 17, 2]]) { const p = P(-0.04, b, h);                         // zwei Schmetterlinge
      for (const s of [-1, 1]) { ellipse(p[0] + s * 0.8 * z, p[1] - 0.3 * z, 0.8 * z, 0.6 * z, C(ph ? '#ffd23f' : LILA)); ellipse(p[0] + s * 0.6 * z, p[1] + 0.4 * z, 0.5 * z, 0.4 * z, C(ph ? '#f6b23a' : '#9b6fe0')); }
      sdLine('#4a3a30', 0.25, z, [[p[0], p[1] - 0.7 * z], [p[0], p[1] + 0.7 * z]]); }
  };
  // Sonnenpavillon: rund und offen, Stufe, Boden mit Sonnenmosaik, sechs weiße Säulen (vorn mit Ranken), Lämpchen unter der Traufe,
  // goldene Kuppel mit Rippen und Kugelkante; obendrauf dreht sich langsam eine Sonne, die nachts leuchtet (ANIM_ITEMS)
  const sun = (x, y, r, z, now, lit) => {
    const rot = now / 9000;
    for (let k = 0; k < 12; k++) { const a = rot + k / 12 * TAU, l = k % 2 ? 1.5 : 1.85;
      poly([[x + Math.cos(a - 0.13) * r, y + Math.sin(a - 0.13) * r], [x + Math.cos(a) * r * l, y + Math.sin(a) * r * l], [x + Math.cos(a + 0.13) * r, y + Math.sin(a + 0.13) * r]], C(k % 2 ? '#ffcf4a' : GOLD)); }
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(1, lit ? '#ffc23a' : C('#f0b43a'));
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = gr; g.fill(); g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.4, 0.3 * z); g.stroke();
    if (lit) glowAt(x, y, r * 7, z);
  };
  const sonnenpavillon = (cx, cy, z, now = 0) => {
    const lit = sdLit(), R = 14, HC = 17, N = 6;
    sdShadow(cx, cy, 20, z);
    cyl(cx, cy, R + 2.2, R + 2.2, 0, 1.1, z, '#f1e8d8', '#e3d6bf', '#c4b293', '#efe4d0');                          // Stufe
    cyl(cx, cy, R + 0.8, R + 0.8, 1.1, 2.4, z, '#f8f1e4', '#ece0ca', '#cdbb9c', '#fbf5ea');                         // Boden
    const fy = cy - 2.4 * z;
    g.save(); g.beginPath(); g.ellipse(cx, fy, (R + 0.8) * z, (R + 0.8) / 2 * z, 0, 0, TAU); g.clip();               // Sonnenmosaik im Boden
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, a2 = a + TAU / 32; poly([[cx, fy], [cx + Math.cos(a) * 12 * z, fy + Math.sin(a) * 6 * z], [cx + Math.cos(a2) * 12 * z, fy + Math.sin(a2) * 6 * z]], C(k % 2 ? '#f6dc8e' : '#f2c96a')); }
    g.restore(); ellipse(cx, fy, 3.4 * z, 1.7 * z, C('#e9a23b')); ellipse(cx, fy, 2.2 * z, 1.1 * z, C('#ffd56a'));
    const col = t => { const x = cx + Math.cos(t) * (R - 0.6) * z, y = fy + Math.sin(t) * (R - 0.6) / 2 * z, r = 0.95 * z;
      const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, C('#ffffff')); gr.addColorStop(1, C('#d9cdb7'));
      g.fillStyle = gr; g.fillRect(x - r, y - HC * z, 2 * r, HC * z); ellipse(x, y, r * 1.4, r * 0.6, C('#e6dccb'));
      poly([[x - r * 1.5, y - HC * z], [x + r * 1.5, y - HC * z], [x + r * 1.5, y - (HC - 1) * z], [x - r * 1.5, y - (HC - 1) * z]], C('#efe5d2'));   // Kapitell
      return [x, y]; };
    const ts = Array.from({ length: N }, (_, k) => (k + 0.5) / N * TAU);
    ts.filter(t => Math.sin(t) < 0).forEach(col);                                                                // hintere Säulen
    for (const [x, y] of ts.filter(t => Math.sin(t) >= 0).map(col)) {                                            // vordere Säulen mit Ranken
      g.strokeStyle = C('#5a9a3c'); g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();
      for (let i = 0; i <= 20; i++) { const u = i / 20, px = x + Math.sin(u * 14) * 1 * z, py = y - u * (HC - 1.5) * z; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
      for (let i = 1; i < 10; i++) { const u = i / 10, px = x + Math.sin(u * 14) * 1 * z; circle(px + (i % 2 ? 0.7 : -0.7) * z, y - u * (HC - 1.5) * z, 0.6 * z, C('#6fb04a')); if (i % 3 === 0) rose(px, y - u * (HC - 1.5) * z, 0.55 * z, [PINK, '#ffffff', '#ffd23f'][i / 3 % 3]); } }
    const EY = cy - (2.4 + HC) * z, ER = R + 2.6, H = 13;                                                         // Traufe, Kuppel
    const gr = g.createLinearGradient(cx - ER * z, 0, cx + ER * z, 0); gr.addColorStop(0, C('#ffd56a')); gr.addColorStop(0.45, C('#f2b23e')); gr.addColorStop(1, C('#c98424'));
    g.beginPath(); g.ellipse(cx, EY, ER * z, H * z, 0, Math.PI, 0); g.ellipse(cx, EY, ER * z, ER / 2 * z, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(150,90,20,0.45)'; g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();                // Rippen (Meridiane der Kuppel)
    for (let j = 1; j < 8; j++) { const t = j / 8 * Math.PI; for (let i = 0; i <= 10; i++) { const f = i / 10 * Math.PI / 2, px = cx + ER * z * Math.cos(t) * Math.cos(f), py = EY + ER / 2 * z * Math.sin(t) * Math.cos(f) - H * z * Math.sin(f); i ? g.lineTo(px, py) : g.moveTo(px, py); } }
    g.stroke();
    ellipse(cx - ER * 0.35 * z, EY - H * 0.6 * z, ER * 0.22 * z, H * 0.16 * z, 'rgba(255,255,255,0.35)');
    for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI; circle(cx + Math.cos(t) * ER * z, EY + Math.sin(t) * ER / 2 * z + 0.9 * z, 1 * z, C(k % 2 ? '#fff3d6' : '#f6dc8e')); }   // Kugelkante
    sdLine('#c9962a', 0.6, z, [[cx, EY - H * z], [cx, EY - (H + 3) * z]]);
    sun(cx, EY - (H + 6.5) * z, 3 * z, z, now, lit);
    for (let k = 0; k < 7; k++) { const t = 0.12 * Math.PI + k / 6 * 0.76 * Math.PI, x = cx + Math.cos(t) * (R - 1) * z, y = EY + Math.sin(t) * (R - 1) / 2 * z + 2.4 * z;   // Lämpchen
      sdLine('#8a5a3c', 0.2, z, [[x, y - 2.4 * z], [x, y - 1 * z]]); ellipse(x, y, 0.9 * z, 1.1 * z, lit ? '#ffe39a' : C('#ffcf6a')); if (lit) glowAt(x, y, 6 * z, z); }
  };
  // Glasschuh (Nutzer: „Schuh nicht erkennbar“ → wie ein Absatzschuh-Symbol, Spitze „sehr kurz, spitz“): hohe Fersenkappe, Öffnung mit
  // sichtbarem Inneren, kurze spitze Zehenkappe, schlanker Absatz; Glas hellblau mit Glanz; steht auf rotem Samtkissen auf einer Steinsäule
  const shoe = (x, y, s, z, lit) => {                                                                            // x, y = Mitte unten
    const u = s * z, Q = (a, b) => [x + a * u, y - b * u], edge = lit ? 'rgba(150,205,240,1)' : 'rgba(95,165,210,0.95)';
    poly([Q(-4.05, 3.9), Q(-3.1, 3.5), Q(-3.15, 0.05), Q(-3.5, 0.05)], lit ? 'rgba(205,238,255,1)' : 'rgba(170,218,242,1)');   // Absatz
    g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.22 * z); g.stroke();
    g.beginPath(); g.moveTo(...Q(-4.1, 6.8)); g.bezierCurveTo(...Q(-4.6, 5.6), ...Q(-4.4, 4.2), ...Q(-3.9, 3.7));    // Fersenkappe
    g.bezierCurveTo(...Q(-2.4, 3.3), ...Q(-0.8, 0.6), ...Q(1.2, 0.25));                                            // Sohle mit Gewölbe
    g.bezierCurveTo(...Q(2.16, 0.05), ...Q(3.24, 0.15), ...Q(3.84, 0.8));                                          // Ballen bis Spitze
    g.bezierCurveTo(...Q(3.24, 1.3), ...Q(2.64, 2.0), ...Q(2.04, 2.2));                                            // Zehenkappe
    g.bezierCurveTo(...Q(1.38, 2.2), ...Q(0.8, 2.0), ...Q(0.2, 2.2));                                              // Rist
    g.bezierCurveTo(...Q(-1.6, 2.9), ...Q(-3.0, 4.6), ...Q(-4.1, 6.8)); g.closePath();                            // vordere Kante der Öffnung
    const gr = g.createLinearGradient(...Q(-4, 6), ...Q(4.5, 0)); gr.addColorStop(0, lit ? 'rgba(235,250,255,0.97)' : 'rgba(222,245,255,0.95)');
    gr.addColorStop(0.55, lit ? 'rgba(190,232,255,0.92)' : 'rgba(170,222,246,0.92)'); gr.addColorStop(1, lit ? 'rgba(220,246,255,0.97)' : 'rgba(198,236,252,0.95)');
    g.fillStyle = gr; g.fill(); g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.25 * z); g.stroke();
    g.beginPath(); g.moveTo(...Q(0.2, 2.2)); g.bezierCurveTo(...Q(-1.6, 2.9), ...Q(-3.0, 4.6), ...Q(-4.1, 6.8));     // Inneres in der Öffnung
    g.bezierCurveTo(...Q(-3.2, 6.6), ...Q(-1.6, 4.6), ...Q(0.2, 2.2)); g.closePath(); g.fillStyle = lit ? 'rgba(120,175,215,0.55)' : 'rgba(95,155,200,0.5)'; g.fill();
    g.beginPath(); g.moveTo(...Q(0.1, 2.35)); g.bezierCurveTo(...Q(-1.4, 3.0), ...Q(-2.6, 4.2), ...Q(-3.5, 5.6)); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(0.3, 0.35 * z); g.stroke();   // Innensohle
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineCap = 'round'; g.lineWidth = Math.max(0.4, 0.4 * z);           // Glanz
    g.beginPath(); g.moveTo(...Q(1.98, 1.85)); g.quadraticCurveTo(...Q(2.7, 1.65), ...Q(3.36, 1.0)); g.stroke();
    g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath(); g.moveTo(...Q(-3.95, 6.1)); g.quadraticCurveTo(...Q(-4.2, 5.1), ...Q(-3.8, 4.2)); g.stroke();
    g.beginPath(); g.moveTo(...Q(-1.4, 2.3)); g.quadraticCurveTo(...Q(-0.4, 1.3), ...Q(1.0, 0.9)); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke();
    circle(...Q(1.1, 2.05), 0.38 * u, lit ? '#ffffff' : C('#eaf8ff'));                                          // kleiner Kristall auf dem Rist
    for (const [a, b, r] of [[3.84, 1.8, 0.8], [-4.6, 7.1, 0.7]]) { const p = Q(a, b), q = 0.55 * r * u;          // Funkeln
      poly([[p[0], p[1] - q * 1.6], [p[0] + q * 0.3, p[1] - q * 0.3], [p[0] + q * 1.6, p[1]], [p[0] + q * 0.3, p[1] + q * 0.3], [p[0], p[1] + q * 1.6], [p[0] - q * 0.3, p[1] + q * 0.3], [p[0] - q * 1.6, p[1]], [p[0] - q * 0.3, p[1] - q * 0.3]], '#ffffff'); }
  };
  const cushion = (x, y, z) => {                                                                                  // x, y = Kissen-Unterseite Mitte
    const w = 5.6 * z, d = 2.6 * z, h = 2 * z, top = [[x - w, y - h], [x, y - h - d], [x + w, y - h], [x, y - h + d]];
    g.beginPath(); g.moveTo(x - w, y - h); g.quadraticCurveTo(x - w * 1.05, y + 0.3 * z, x - w * 0.2, y + d * 0.9); g.quadraticCurveTo(x, y + d * 1.1, x + w * 0.2, y + d * 0.9);
    g.quadraticCurveTo(x + w * 1.05, y + 0.3 * z, x + w, y - h); g.lineTo(x, y - h + d); g.closePath(); g.fillStyle = C('#a8304f'); g.fill();
    g.beginPath(); g.moveTo(...top[0]); g.quadraticCurveTo(x - w * 0.5, y - h - d * 1.25, ...top[1]); g.quadraticCurveTo(x + w * 0.5, y - h - d * 1.25, ...top[2]);
    g.quadraticCurveTo(x + w * 0.5, y - h + d * 1.25, ...top[3]); g.quadraticCurveTo(x - w * 0.5, y - h + d * 1.25, ...top[0]); g.closePath();
    const gr = g.createRadialGradient(x - w * 0.3, y - h - d * 0.4, 0, x, y - h, w); gr.addColorStop(0, C('#e86a8a')); gr.addColorStop(1, C('#c23c5e')); g.fillStyle = gr; g.fill();
    g.strokeStyle = C(GOLD); g.lineWidth = Math.max(0.4, 0.4 * z); g.stroke();
    for (const p of [top[0], top[2], top[3]]) { sdLine(GOLD_D, 0.3, z, [p, [p[0], p[1] + 1.6 * z]]); poly([[p[0] - 0.6 * z, p[1] + 1.4 * z], [p[0] + 0.6 * z, p[1] + 1.4 * z], [p[0] + 0.8 * z, p[1] + 3 * z], [p[0] - 0.8 * z, p[1] + 3 * z]], C(GOLD)); circle(p[0], p[1] + 1.3 * z, 0.5 * z, C(GOLD_D)); }   // Quasten
    return [x + 0.4 * z, y - h - 0.4 * z];
  };
  const glasschuh = (cx, cy, z) => {
    const lit = sdLit();
    sdShadow(cx, cy, 7, z);
    cyl(cx, cy, 4.6, 4.6, 0, 1.4, z, '#e6ddce', '#d6cab6', '#b3a48a', '#ece4d6');                                // Säule: Fuß, Schaft mit Rillen, Platte
    cyl(cx, cy, 3, 2.7, 1.4, 8.6, z, '#f4eee3', '#e4dacb', '#bfb19a');
    for (const t of [0.25, 0.42, 0.58, 0.75]) sdLine('rgba(160,140,110,0.5)', 0.25, z, [[cx + Math.cos(t * Math.PI) * 2.9 * z, cy - 1.4 * z + Math.sin(t * Math.PI) * 1.45 * z], [cx + Math.cos(t * Math.PI) * 2.6 * z, cy - 8.6 * z + Math.sin(t * Math.PI) * 1.3 * z]]);
    cyl(cx, cy, 4.2, 4.2, 8.6, 9.8, z, '#f2ebdf', '#e2d8c8', '#bfb19a', '#f8f3ea');
    const s = cushion(cx, cy - 8.8 * z, z);
    shoe(s[0] - 0.2 * z, s[1] + 0.9 * z, 0.95, z, lit);
    if (lit) glowAt(s[0], s[1] - 3 * z, 12 * z, z);
  };
  // Froschkönig-Brunnen: rundes Steinbecken mit Fugen, Wasser mit Wellenringen, Seerosen, Frosch mit Krone auf einer Säule in der Mitte
  // (blinzelt), speit aus dem offenen Maul einen Wasserbogen ins Becken; goldene Kugel auf dem Rand, Schilf und Blumen am Fuß (ANIM_ITEMS)
  const frog = (x, y, s, z, now) => {                                                                             // x, y = Sitzfläche Mitte
    const u = s * z;
    ellipse(x, y + 0.2 * u, 3.6 * u, 1.2 * u, 'rgba(30,60,30,0.25)');
    for (const d of [-1, 1]) ellipse(x + d * 2.6 * u, y - 0.9 * u, 1.6 * u, 1.1 * u, C('#4f9a48'));               // Hinterbeine
    const gr = g.createRadialGradient(x - 1 * u, y - 3.4 * u, 0.3 * u, x, y - 2.2 * u, 3.6 * u); gr.addColorStop(0, C('#8fd77a')); gr.addColorStop(1, C('#4a9a44'));
    g.beginPath(); g.ellipse(x, y - 2.2 * u, 3.2 * u, 2.5 * u, 0, 0, TAU); g.fillStyle = gr; g.fill();
    ellipse(x, y - 1.3 * u, 2.1 * u, 1.3 * u, C('#e9f2c8'));                                                      // heller Bauch
    for (const d of [-1, 1]) { ellipse(x + d * 1.4 * u, y - 0.1 * u, 0.9 * u, 0.45 * u, C('#5fb35a')); for (const f of [-0.5, 0, 0.5]) circle(x + (d * 1.4 + f) * u, y + 0.2 * u, 0.25 * u, C('#5fb35a')); }
    const blink = (now % 4200) < 160;
    for (const d of [-1, 1]) { const ex = x + d * 1.5 * u, ey = y - 4.3 * u; circle(ex, ey, 1.05 * u, C('#5fb35a'));
      if (blink) sdLine('#2f5a2a', 0.3, z * s, [[ex - 0.6 * u, ey], [ex + 0.6 * u, ey]]);
      else { circle(ex, ey - 0.05 * u, 0.7 * u, '#ffffff'); circle(ex + d * 0.1 * u, ey, 0.38 * u, C('#2f3440')); circle(ex + d * 0.1 * u - 0.12 * u, ey - 0.15 * u, 0.12 * u, '#ffffff'); } }
    ellipse(x, y - 2.55 * u, 0.75 * u, 0.5 * u, C('#2f5a2a')); ellipse(x, y - 2.45 * u, 0.45 * u, 0.25 * u, C('#e8798a'));   // Maul offen
    for (const d of [-1, 1]) circle(x + d * 2.1 * u, y - 2.9 * u, 0.4 * u, 'rgba(255,140,150,0.45)');
    const cy0 = y - 5.6 * u;                                                                                       // Krone zwischen den Augen
    poly([[x - 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.6 * u], [x + 1.25 * u, cy0 - 1 * u], [x + 0.6 * u, cy0 - 0.2 * u], [x, cy0 - 1.3 * u], [x - 0.6 * u, cy0 - 0.2 * u], [x - 1.25 * u, cy0 - 1 * u]], C(GOLD));
    poly([[x - 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.2 * u], [x - 1.1 * u, cy0 + 0.2 * u]], C(GOLD_D));
    for (const [d, c] of [[0, ROSE], [-0.75, '#58b3e8'], [0.75, '#58b3e8']]) circle(x + d * u, cy0 + 0.4 * u, 0.2 * u, C(c));
    for (const d of [-1.25, 0, 1.25]) circle(x + d * u, cy0 - (d ? 1 : 1.3) * u, 0.18 * u, C('#fff3a0'));
  };
  const lily = (x, y, r, z, flower) => { g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r * z, r * 0.5 * z, 0, 0.35, TAU - 0.05); g.closePath(); g.fillStyle = C('#4f9e4a'); g.fill();
    if (flower) { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ellipse(x + Math.cos(a) * 0.7 * z, y - 0.5 * z + Math.sin(a) * 0.35 * z, 0.6 * z, 0.35 * z, C(k % 2 ? '#ffd0e0' : PINK)); } circle(x, y - 0.6 * z, 0.35 * z, C('#ffd23f')); } };
  const froschbrunnen = (cx, cy, z, now = 0) => {
    const lit = sdLit(), R = 11;
    sdShadow(cx, cy, 13, z);
    cyl(cx, cy, R, R, 0, 4.2, z, '#d9d2c4', '#c9c1b1', '#9f9684');                                                // Becken
    g.strokeStyle = 'rgba(120,110,95,0.45)'; g.lineWidth = Math.max(0.3, 0.28 * z); g.beginPath();                // Steinfugen
    halfArc(cx, cy - 2.1 * z, R * z, 0.05, Math.PI - 0.05);
    for (let j = 0; j < 7; j++) { const t = (j + 0.5) / 7 * Math.PI, t2 = (j + 1) / 7 * Math.PI; for (const [tt, h0, h1] of [[t, 0, 2.1], [t2, 2.1, 4.2]]) { if (Math.sin(tt) < 0.25) continue;
      g.moveTo(cx + Math.cos(tt) * R * z, cy - h0 * z + Math.sin(tt) * R / 2 * z); g.lineTo(cx + Math.cos(tt) * R * z, cy - h1 * z + Math.sin(tt) * R / 2 * z); } }
    g.stroke();
    ellipse(cx, cy - 4.2 * z, R * z, R / 2 * z, C('#e6dfd2'));                                                    // Rand oben
    const W = R - 1.4, wy = cy - 3.6 * z;
    const wg = g.createLinearGradient(0, wy - W / 2 * z, 0, wy + W / 2 * z); wg.addColorStop(0, lit ? '#2c4a6e' : C('#5ec2dd')); wg.addColorStop(1, lit ? '#3b6a8e' : C('#8fdcef'));
    g.beginPath(); g.ellipse(cx, wy, W * z, W / 2 * z, 0, 0, TAU); g.fillStyle = wg; g.fill();
    g.save(); g.beginPath(); g.ellipse(cx, wy, W * z, W / 2 * z, 0, 0, TAU); g.clip();                             // Wellenringe, wo der Strahl auftrifft
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = Math.max(0.3, 0.3 * z);
    for (let k = 0; k < 3; k++) { const p = ((now / 2200) + k / 3) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(cx + 5.5 * z, wy + 1.4 * z, (1 + p * W * 0.8) * z, (0.5 + p * W * 0.4) * z, 0, 0, TAU); g.stroke(); }
    g.globalAlpha = 1; g.restore();
    lily(cx - 6 * z, wy + 1.6 * z, 2, z, true); lily(cx + 2 * z, wy + 3.2 * z, 1.5, z, false); lily(cx - 3 * z, wy - 2.6 * z, 1.4, z, false);
    cyl(cx, cy, 1.8, 1.5, 3.6, 10.5, z, '#e3dccf', '#d3cbbb', '#a99f8c');                                         // Säule
    cyl(cx, cy, 2.6, 2.6, 10.5, 11.6, z, '#ece6da', '#ddd5c6', '#b3a994', '#efe9de');
    const fy = cy - 11.6 * z;
    frog(cx, fy, 0.95, z, now);
    const my = fy - 2.55 * 0.95 * z, pts = Array.from({ length: 14 }, (_, i) => { const u = i / 13; return [cx + u * 6.5 * z, my - Math.sin(u * Math.PI * 0.6) * 1.2 * z + u * u * 11 * z]; });   // Strahl aus dem Maul
    g.strokeStyle = lit ? 'rgba(170,215,240,0.55)' : 'rgba(200,240,252,0.75)'; g.lineWidth = Math.max(0.5, 0.7 * z); g.lineCap = 'round'; path(pts, false); g.stroke();
    for (let k = 0; k < 7; k++) { const f = ((now / 900) + k / 7) % 1, i = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), r = f * (pts.length - 1) - i;   // Tropfen laufen mit
      circle(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r, 0.4 * z, '#ffffff'); }
    const bx = cx + Math.cos(0.25) * R * z * 0.92, by = cy - 5.6 * z + Math.sin(0.25) * R / 2 * z;                // goldene Kugel auf dem Rand
    const bg = g.createRadialGradient(bx - 0.5 * z, by - 0.6 * z, 0.1 * z, bx, by, 1.5 * z); bg.addColorStop(0, '#fff6c0'); bg.addColorStop(1, C(GOLD_D)); g.beginPath(); g.arc(bx, by, 1.5 * z, 0, TAU); g.fillStyle = bg; g.fill();
    for (const t of [2.4, 2.75]) { const x = cx + Math.cos(t) * (R + 0.6) * z, y = cy + Math.sin(t) * (R + 0.6) / 2 * z;   // Schilf und Blumen am Fuß
      for (const d of [-0.5, 0, 0.6]) sdLine('#5f8f3a', 0.4, z, [[x + d * z, y], [x + (d * 1.5) * z, y - (4.5 + d) * z]]); }
    for (const [t, c] of [[0.7, PINK], [0.95, '#ffffff'], [1.2, LILA]]) rose(cx + Math.cos(t) * (R + 0.4) * z, cy + Math.sin(t) * (R + 0.4) / 2 * z + 0.6 * z, 0.75 * z, c);
  };

  // Glühwürmchen-Glas (Entwurf A, Nutzer 31.10.2026): Einmachglas mit Golddeckel und Drahtbügel auf einem Baumstumpf mit Jahresringen, Moos
  // und zwei Pilzchen; die Glühwürmchen schwirren im Glas und blinken, nachts leuchten sie (ANIM_ITEMS)
  const gluehglas = (cx, cy, z, now = 0) => {
    const lit = sdLit();
    sdShadow(cx, cy, 7, z);
    cyl(cx, cy, 5.2, 4.6, 0, 6, z, '#a87a52', '#8a5a3c', '#6a4430');                                             // Baumstumpf mit Rinde und Jahresringen
    for (const t of [0.3, 0.55, 0.8]) sdLine('#6a4430', 0.3, z, [[cx + Math.cos(t * Math.PI) * 4.9 * z, cy + Math.sin(t * Math.PI) * 2.45 * z - 0.4 * z], [cx + Math.cos(t * Math.PI) * 4.6 * z, cy - 5.6 * z + Math.sin(t * Math.PI) * 2.3 * z]]);
    ellipse(cx, cy - 6 * z, 4.6 * z, 2.3 * z, C('#d9b07a')); g.strokeStyle = C('#b88a58'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();
    for (const r of [1.2, 2.4, 3.6]) { g.moveTo(cx + r * z, cy - 6 * z); g.ellipse(cx, cy - 6 * z, r * z, r / 2 * z, 0, 0, TAU); } g.stroke();
    for (const [dx, s] of [[-5, 1], [4.4, 0.8]]) { const x = cx + dx * z, y = cy + 1 * z;                       // zwei Pilzchen
      poly([[x - 0.4 * s * z, y], [x + 0.4 * s * z, y], [x + 0.4 * s * z, y - 2 * s * z], [x - 0.4 * s * z, y - 2 * s * z]], C('#f3ecdf'));
      ellipse(x, y - 2.2 * s * z, 1.6 * s * z, 0.9 * s * z, C('#e8546f')); circle(x - 0.5 * s * z, y - 2.6 * s * z, 0.3 * z, '#ffffff'); }
    for (const [dx, dy] of [[-3.5, 1.6], [3, 2.2], [-1, 2.6]]) ellipse(cx + dx * z, cy + dy * z, 1.6 * z, 0.6 * z, C('#6fb04a'));   // Moos
    const x = cx + 0.4 * z, y = cy - 6.6 * z, R = 3.2 * z, H = 7.6 * z;                                          // Glas: x, y = Boden Mitte
    ellipse(x, y, R, R / 2, lit ? 'rgba(255,240,170,0.35)' : 'rgba(190,225,235,0.45)');
    for (let k = 0; k < 7; k++) { const t = now / 1000, px = x + Math.sin(t * 0.8 + k * 1.7) * R * 0.62, py = y - H * 0.5 + Math.cos(t * 0.6 + k * 2.3) * H * 0.32;   // Glühwürmchen
      const on = (Math.sin(t * 2.2 + k * 1.3) + 1) / 2; circle(px, py, (0.38 + on * 0.18) * z, lit ? `rgba(255,250,${Math.round(150 + on * 80)},${(0.6 + on * 0.4).toFixed(2)})` : C(on > 0.5 ? '#e6f07a' : '#c8d65a'));
      if (lit && on > 0.6) glowAt(px, py, 4 * z, z); }
    const gr = g.createLinearGradient(x - R, 0, x + R, 0); gr.addColorStop(0, lit ? 'rgba(255,245,200,0.35)' : 'rgba(225,245,250,0.55)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, lit ? 'rgba(255,235,170,0.3)' : 'rgba(170,215,230,0.5)');
    g.beginPath(); g.ellipse(x, y, R, R / 2, 0, Math.PI, 0, true); g.lineTo(x + R, y - H + 1.2 * z); g.quadraticCurveTo(x + R, y - H, x + R * 0.7, y - H); g.lineTo(x - R * 0.7, y - H); g.quadraticCurveTo(x - R, y - H, x - R, y - H + 1.2 * z); g.closePath();
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(150,200,215,0.8)'; g.lineWidth = Math.max(0.4, 0.3 * z); g.stroke();
    sdLine('rgba(255,255,255,0.85)', 0.45, z, [[x - R * 0.62, y - 1.4 * z], [x - R * 0.62, y - H + 1.8 * z]]);     // Glanz
    sdLine('rgba(255,255,255,0.5)', 0.3, z, [[x - R * 0.35, y - 1 * z], [x - R * 0.35, y - 3 * z]]);
    ellipse(x, y - H, R * 0.72, R * 0.3, C('#d9a93a')); poly([[x - R * 0.72, y - H], [x + R * 0.72, y - H], [x + R * 0.72, y - H - 1.3 * z], [x - R * 0.72, y - H - 1.3 * z]], C('#c9962a'));   // Deckel
    ellipse(x, y - H - 1.3 * z, R * 0.72, R * 0.3, C('#f0c75a'));
    for (const k of [-0.5, 0, 0.5]) sdLine('#a87a22', 0.2, z, [[x + k * R * 0.6, y - H], [x + k * R * 0.6, y - H - 1.3 * z]]);
    g.strokeStyle = C('#7d6a55'); g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath(); g.moveTo(x - R * 0.75, y - H - 0.6 * z); g.quadraticCurveTo(x, y - H - 6.5 * z, x + R * 0.75, y - H - 0.6 * z); g.stroke();   // Drahtbügel
    if (lit) glowAt(x, y - H * 0.5, 16 * z, z);
  };

  // Märchen, zweite Hälfte (Basar-Durchsicht 31.10.2026, Entwürfe tools/basar-entwurf-p8.js, Nutzer: Spiegel A, Einhorn A, Tanzpavillon B)
  const star4 = (x, y, s, col) => poly([[x, y - s], [x + 0.28 * s, y - 0.28 * s], [x + s, y], [x + 0.28 * s, y + 0.28 * s], [x, y + s], [x - 0.28 * s, y + 0.28 * s], [x - s, y], [x - 0.28 * s, y - 0.28 * s]], col);   // Funkelstern
  const flowers = (cx, cy, z, n, seed, rx = 10, ry = 4.4) => { for (let k = 0; k < n; k++) { const a = seed + k * 2.39, d = 0.35 + ((k * 37) % 10) / 15, x = cx + Math.cos(a) * rx * d * z, y = cy + Math.sin(a) * ry * d * z;
    circle(x, y - 0.4 * z, 0.9 * z, C('#6fb04a')); rose(x + 0.3 * z, y - 1.1 * z, 0.7 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][k % 5]); } };
  // Zauberspiegel: Standspiegel im goldenen Schnörkelrahmen, Zauberwirbel und wandernder Schimmer im Glas, Funkeln (ANIM_ITEMS); kein blauer Schein (6e2)
  const mirror = (x, y, rx, ry, z, now, lit) => {                                                          // x, y = Mitte des Spiegels
    const fr = 1.3 * z;
    g.beginPath(); g.ellipse(x, y, rx + fr, ry + fr, 0, 0, TAU); const fg = g.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
    fg.addColorStop(0, C('#ffe69a')); fg.addColorStop(0.5, C(GOLD)); fg.addColorStop(1, C(GOLD_D)); g.fillStyle = fg; g.fill();
    g.strokeStyle = C('#a8781e'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath(); g.ellipse(x, y, rx + fr * 0.45, ry + fr * 0.45, 0, 0, TAU); g.stroke();   // Zierlinie im Rahmen
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, px = x + Math.cos(a) * (rx + fr * 0.5), py = y + Math.sin(a) * (ry + fr * 0.5); circle(px, py, 0.32 * z, C(k % 3 ? '#fff0b8' : ROSE)); }   // Perlen und Steine
    for (const s of [-1, 1]) { g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath();   // Schnörkel seitlich
      g.moveTo(x + s * (rx + fr), y + ry * 0.2); g.bezierCurveTo(x + s * (rx + 3 * z), y + ry * 0.3, x + s * (rx + 3.2 * z), y - ry * 0.25, x + s * (rx + 1.6 * z), y - ry * 0.2); g.stroke();
      circle(x + s * (rx + 1.6 * z), y - ry * 0.2, 0.45 * z, C(GOLD)); }
    const top = [x, y - ry - fr];                                                                                   // Krönung oben
    g.beginPath(); g.moveTo(top[0] - 3 * z, top[1] + 0.6 * z); g.bezierCurveTo(top[0] - 2.4 * z, top[1] - 2.4 * z, top[0] - 0.8 * z, top[1] - 1.2 * z, top[0], top[1] - 3.2 * z);
    g.bezierCurveTo(top[0] + 0.8 * z, top[1] - 1.2 * z, top[0] + 2.4 * z, top[1] - 2.4 * z, top[0] + 3 * z, top[1] + 0.6 * z); g.closePath(); g.fillStyle = C(GOLD); g.fill(); g.strokeStyle = C(GOLD_D); g.stroke();
    circle(top[0], top[1] - 1.1 * z, 0.6 * z, C(ROSE)); circle(top[0], top[1] - 3.4 * z, 0.45 * z, C('#fff0b8'));
    g.save(); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.clip();                                         // Glas
    const mg = g.createLinearGradient(x - rx, y - ry, x + rx * 0.6, y + ry); mg.addColorStop(0, lit ? '#b9a6e8' : C('#e9f1fa')); mg.addColorStop(0.5, lit ? '#8b7bd0' : C('#c3d5ea')); mg.addColorStop(1, lit ? '#6c5fb8' : C('#a8bfdc'));
    g.fillStyle = mg; g.fillRect(x - rx, y - ry, 2 * rx, 2 * ry);
    for (let k = 0; k < 3; k++) { const a = now / 1600 + k * TAU / 3; g.strokeStyle = lit ? 'rgba(255,230,160,0.55)' : 'rgba(200,170,255,0.45)'; g.lineWidth = Math.max(0.4, 0.5 * z);   // Zauberwirbel
      g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, r = u * rx * 0.85, b = a + u * 4; const px = x + Math.cos(b) * r, py = y + Math.sin(b) * r * (ry / rx); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
    const sw = ((now / 3800) % 1) * 3 - 1;                                                                          // Lichtschimmer wandert schräg
    g.globalAlpha = 0.55; poly([[x + (sw - 0.5) * rx * 2, y - ry], [x + (sw - 0.2) * rx * 2, y - ry], [x + (sw + 0.3) * rx * 2, y + ry], [x + sw * rx * 2, y + ry]], '#ffffff'); g.globalAlpha = 1;
    poly([[x - rx * 0.7, y - ry * 0.5], [x - rx * 0.45, y - ry * 0.75], [x - rx * 0.1, y - ry * 0.2], [x - rx * 0.35, y + ry * 0.05]], 'rgba(255,255,255,0.45)');   // fester Glanz
    g.restore();
    for (const [dx, dy, s, ph] of [[1.25, -0.7, 1, 0], [-1.3, 0.35, 0.8, 2], [0.9, 0.9, 0.7, 4]]) { const f = (Math.sin(now / 500 + ph) + 1) / 2;   // Funkeln
      star4(x + dx * rx, y + dy * ry, (0.5 + f * 0.6) * s * z, '#ffffff'); }
    if (lit) glowAt(x, y, Math.max(rx, ry) * 2.2, z);
  };
  const zauberspiegel = (cx, cy, z, now = 0) => {
    const lit = sdLit();
    sdShadow(cx, cy, 7, z);
    for (const s of [-1, 1]) { g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.6, 0.9 * z); g.lineCap = 'round'; g.beginPath();   // geschwungene Füße
      g.moveTo(cx + s * 0.8 * z, cy - 6 * z); g.bezierCurveTo(cx + s * 1.5 * z, cy - 2.5 * z, cx + s * 4.5 * z, cy - 2 * z, cx + s * 5 * z, cy + 0.2 * z); g.stroke(); circle(cx + s * 5 * z, cy + 0.2 * z, 0.7 * z, C(GOLD_D)); }
    poly([[cx - 0.7 * z, cy - 1.5 * z], [cx + 0.7 * z, cy - 1.5 * z], [cx + 0.9 * z, cy - 8 * z], [cx - 0.9 * z, cy - 8 * z]], C(GOLD_D));   // Stiel
    circle(cx, cy - 7 * z, 1.2 * z, C(GOLD));
    mirror(cx, cy - 17.5 * z, 5.2 * z, 8 * z, z, now, lit);
    flowers(cx, cy + 1 * z, z, 6, 0.6, 7, 3);
  };
  // Einhorn: steht seitlich auf einer Blumenwiese, Regenbogenmähne und -schweif wehen, Funkeln (ANIM_ITEMS)
  const unicorn = (x, y, s, z, now, lit) => {                                                                    // x, y = Boden Mitte
    const u = s * z, Q = (a, b) => [x + a * u, y - b * u], wv = Math.sin(now / 900) * 0.4;
    // Bein als Form mit Breite: Ansatz breit (Oberschenkel), Knie bzw. Sprunggelenk, schmale Röhre, Fessel, goldener Huf
    const leg = (pts, col, hoof, edge) => {                                                                       // pts: [a, b, breite] von oben nach unten
      const L = [], Rr = []; pts.forEach(([a, b, w], i) => { const n = pts[Math.min(i + 1, pts.length - 1)], p0 = pts[Math.max(i - 1, 0)], dx = n[0] - p0[0], dy = n[1] - p0[1], l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l, ny = dx / l; L.push(Q(a + nx * w / 2, b + ny * w / 2)); Rr.push(Q(a - nx * w / 2, b - ny * w / 2)); });
      const ring = [...L, ...Rr.slice().reverse()], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];             // weich: Kurven durch die Mitten
      g.beginPath(); g.moveTo(...mid(ring[ring.length - 1], ring[0])); ring.forEach((p, i) => g.quadraticCurveTo(...p, ...mid(p, ring[(i + 1) % ring.length]))); g.closePath();
      g.fillStyle = col; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.2 * z); g.stroke(); }
      const f = pts[pts.length - 1]; poly([Q(f[0] - 0.65, 0.9), Q(f[0] + 0.75, 0.9), Q(f[0] + 0.85, 0), Q(f[0] - 0.7, 0)], hoof); };
    const front = (a, d) => [[a, 9.6, 2.0], [a + 0.1, 6.4, 1.4], [a + 0.2 + d, 4.2, 1.0], [a + 0.1 + d, 2.4, 0.72], [a + 0.25 + d, 1.3, 0.85], [a + 0.3 + d, 0.9, 0.9]];
    const hind = (a, d) => [[a, 10, 3.2], [a - 0.4, 6.6, 2.0], [a - 1.0 + d, 4.6, 1.1], [a - 0.8 + d, 2.4, 0.72], [a - 0.6 + d, 1.3, 0.85], [a - 0.55 + d, 0.9, 0.9]];
    ellipse(x, y + 0.3 * u, 7 * u, 1.6 * u, 'rgba(60,40,90,0.18)');
    leg(front(3.2, -0.5), C('#ddd5ee'), C(GOLD_D)); leg(hind(-3.9, -0.4), C('#ddd5ee'), C(GOLD_D));                   // Beine auf der fernen Seite
    const tail = (k, c) => { g.strokeStyle = C(c); g.lineWidth = 0.9 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(...Q(-5.8, 11.4 - k * 0.3));   // Schweif
      g.bezierCurveTo(...Q(-9 - k * 0.3 + wv, 11.5 - k * 0.6), ...Q(-8.6 - k * 0.4 + wv * 1.6, 6 - k * 0.4), ...Q(-7.4 - k * 0.6 + wv * 2, 2.6 + k * 0.2)); g.stroke(); };
    ['#ff8fb1', '#ffd23f', '#8fe0a0', '#7fc8ff', LILA].forEach((c, k) => tail(k, c));
    leg(front(4.3, 0.2), lit ? '#f2eefc' : C('#fbf9ff'), C(GOLD), C('#d6cceb')); leg(hind(-3.2, 0.3), lit ? '#f2eefc' : C('#fbf9ff'), C(GOLD), C('#d6cceb'));   // nahe Beine (Körper verdeckt den Ansatz)
    g.beginPath(); g.moveTo(...Q(5.4, 10.4)); g.bezierCurveTo(...Q(4.8, 7.6), ...Q(1.5, 6.6), ...Q(-3, 7));          // Körper: Brust, Bauch
    g.bezierCurveTo(...Q(-5.6, 7.1), ...Q(-6.8, 8.6), ...Q(-6.4, 10.6)); g.bezierCurveTo(...Q(-6.2, 12.4), ...Q(-4.6, 12.9), ...Q(-2.6, 12.4));   // Hinterteil
    g.bezierCurveTo(...Q(0, 11.9), ...Q(2.4, 12.4), ...Q(3.6, 13));                                                  // Rücken bis Widerrist
    g.bezierCurveTo(...Q(5, 15.4), ...Q(6, 18.2), ...Q(7, 20));                                                      // Hals oben
    g.bezierCurveTo(...Q(7.6, 20.8), ...Q(8.6, 20.6), ...Q(9.4, 19.6));                                              // Stirn
    g.bezierCurveTo(...Q(10.6, 18.4), ...Q(11.6, 17.2), ...Q(11.7, 16.4)); g.bezierCurveTo(...Q(11.7, 15.6), ...Q(10.8, 15.3), ...Q(10.2, 15.6));   // Nase, Maul
    g.bezierCurveTo(...Q(9.4, 15.8), ...Q(8.6, 16.2), ...Q(8.1, 16.6));                                              // Kinn, Ganasche
    g.bezierCurveTo(...Q(7.2, 15.4), ...Q(6.6, 12.6), ...Q(5.4, 10.4)); g.closePath();                              // Kehle, Hals unten
    const bg = g.createLinearGradient(...Q(0, 13), ...Q(0, 6.6)); bg.addColorStop(0, lit ? '#f2eefc' : C('#ffffff')); bg.addColorStop(1, lit ? '#c9c0e6' : C('#e6def5'));
    g.fillStyle = bg; g.fill(); g.strokeStyle = C('#cfc4e6'); g.lineWidth = Math.max(0.3, 0.25 * z); g.stroke();
    ellipse(...Q(-4.6, 10), 1.6 * u, 1.2 * u, 'rgba(255,255,255,0.6)');                                            // Glanz am Hinterteil
    poly([Q(7.5, 20.4), Q(8.4, 20.4), Q(7.6, 22.4)], C('#ffffff')); poly([Q(7.7, 20.6), Q(8.2, 20.6), Q(7.7, 21.8)], C('#ffc6dc'));   // Ohr
    const hb = Q(8.7, 20.4), ht = Q(10.6, 26.2);                                                                     // Horn, gedreht
    poly([[hb[0] - 0.55 * u, hb[1]], [hb[0] + 0.55 * u, hb[1] + 0.2 * u], ht], C(GOLD));
    for (let k = 1; k < 5; k++) { const f = k / 5, p = [hb[0] + (ht[0] - hb[0]) * f, hb[1] + (ht[1] - hb[1]) * f], w = 0.55 * u * (1 - f); sdLine(GOLD_D, 0.18, z * s, [[p[0] - w, p[1] + 0.15 * u], [p[0] + w, p[1] - 0.25 * u]]); }
    const mane = (k, c) => { g.strokeStyle = C(c); g.lineWidth = 1 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(...Q(7.2 - k * 0.1, 20.4 - k * 0.3));   // Mähne am Hals
      g.bezierCurveTo(...Q(5.6 - k * 0.5 + wv * 0.5, 19 - k * 0.3), ...Q(4.6 - k * 0.6 + wv, 15.6 - k * 0.2), ...Q(2.6 - k * 0.5 + wv * 1.2, 12.6 + k * 0.1)); g.stroke(); };
    ['#ff8fb1', '#ffd23f', '#8fe0a0', '#7fc8ff', LILA].forEach((c, k) => mane(k, c));
    g.strokeStyle = C('#ff8fb1'); g.lineWidth = 0.8 * u; g.beginPath(); g.moveTo(...Q(8.4, 20.6)); g.quadraticCurveTo(...Q(9.4, 20.2), ...Q(9.6, 19)); g.stroke();   // Stirnlocke
    const e = Q(9.2, 18.3); ellipse(e[0], e[1], 0.55 * u, 0.7 * u, C('#3a3050')); circle(e[0] + 0.15 * u, e[1] - 0.25 * u, 0.2 * u, '#ffffff');   // Auge
    sdLine('#3a3050', 0.15, z * s, [[e[0] - 0.4 * u, e[1] - 0.6 * u], [e[0] - 0.8 * u, e[1] - 1 * u]]); sdLine('#3a3050', 0.15, z * s, [[e[0], e[1] - 0.7 * u], [e[0] - 0.2 * u, e[1] - 1.2 * u]]);
    circle(...Q(10.6, 16.6), 0.5 * u, 'rgba(255,150,180,0.5)'); circle(...Q(11.2, 16.2), 0.18 * u, C('#9a8ab8'));   // Wange, Nüster
    if (lit) glowAt(...Q(10, 24.6), 8 * z * s, z);
  };
  const einhorn = (cx, cy, z, now = 0) => {
    const lit = sdLit();
    sdShadow(cx, cy, 9, z);
    flowers(cx, cy + 1 * z, z, 6, 0.4, 9, 3.4);
    unicorn(cx - 0.6 * z, cy + 0.4 * z, 0.92, z, now, lit);
    for (const [dx, dy, ph] of [[9, -20, 0], [-8, -15, 2], [6, -6, 4]]) { const f = (Math.sin(now / 520 + ph) + 1) / 2; star4(cx + dx * z, cy + dy * z, (0.5 + f * 0.8) * z, C(f > 0.5 ? '#fff3a0' : '#ffffff')); }
  };

  // Tanzpavillon: Parkett mit Rosette, acht Säulen mit Bändern, Glockendach rosa mit goldenen Rippen, Kronleuchter, Rosen an den Stoffbögen
  const tanzpavillon = (cx, cy, z) => {
    const lit = sdLit(), R = 14.5, HC0 = 16, HC = HC0, N = 8;
    sdShadow(cx, cy, 20, z);
    cyl(cx, cy, R + 1.8, R + 1.8, 0, 1.2, z, '#f3ece2', '#e6dccd', '#c9b9a3', '#f6efe6');
    cyl(cx, cy, R + 0.6, R + 0.6, 1.2, 2.4, z, '#d8b88e', '#c9a479', '#a37d55');                                   // Parkettkante
    const fy = cy - 2.4 * z;
    g.save(); g.beginPath(); g.ellipse(cx, fy, (R + 0.6) * z, (R + 0.6) / 2 * z, 0, 0, TAU); g.clip();             // Rautenparkett
    g.fillStyle = C('#e8c89a'); g.fillRect(cx - (R + 1) * z, fy - (R + 1) / 2 * z, 2 * (R + 1) * z, (R + 1) * z);   // helle Rauten als Grund,
    g.beginPath(); const RX = (R + 0.6) * z + 4.2 * z, RY = (R + 0.6) / 2 * z + 2.1 * z;                         // dunkle in einem Pfad (nur im Boden)
    for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) { if ((i + j) & 1) continue; const a = i * 0.13, b = j * 0.13, x0 = cx + (a - b) * 32 * z, y0 = fy + (a + b) * 16 * z, h = 0.065;
      if (((x0 - cx) / RX) ** 2 + ((y0 - fy) / RY) ** 2 > 1) continue;
      g.moveTo(x0, y0 - h * 32 * z); g.lineTo(x0 + h * 64 * z, y0); g.lineTo(x0, y0 + h * 32 * z); g.lineTo(x0 - h * 64 * z, y0); g.closePath(); }
    g.fillStyle = C('#d4a979'); g.fill();
    g.restore();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; poly([[cx, fy], [cx + Math.cos(a - 0.2) * 6 * z, fy + Math.sin(a - 0.2) * 3 * z], [cx + Math.cos(a) * 7.5 * z, fy + Math.sin(a) * 3.75 * z], [cx + Math.cos(a + 0.2) * 6 * z, fy + Math.sin(a + 0.2) * 3 * z]], C(k % 2 ? '#fff3e6' : '#f6c6d6')); }   // Rosette
    ellipse(cx, fy, 1.8 * z, 0.9 * z, C(GOLD));
    const ts = Array.from({ length: N }, (_, k) => (k + 0.5) / N * TAU), at = t => [cx + Math.cos(t) * R * z, fy + Math.sin(t) * R / 2 * z];
    const column = (t, cut = 0) => { const [x, y] = at(t), r = 0.75 * z, HC = HC0 - cut; const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, C('#ddd3c4'));
      g.fillStyle = gr; g.fillRect(x - r, y - HC * z, 2 * r, HC * z); ellipse(x, y, r * 1.5, r * 0.65, C('#ece4d8'));
      g.strokeStyle = C(t < Math.PI ? '#ff8fb1' : '#f4b8cc'); g.lineWidth = Math.max(0.3, 0.35 * z); g.beginPath();   // Band um die Säule
      for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + Math.sin(u * 12) * r, py = y - u * HC * z; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); };
    ts.filter(t => Math.sin(t) < 0).forEach(t => column(t, 3));                                                      // hintere: Oberteil steckt hinter dem Dach
    {                                                                                                               // Kronleuchter an einer Kette aus der Dachmitte
      const lx = cx, ly = fy - 6.5 * z; sdLine(GOLD_D, 0.3, z, [[lx, fy - (HC + 4) * z], [lx, ly - 2.6 * z]]);
      g.strokeStyle = C(GOLD); g.lineWidth = Math.max(0.4, 0.5 * z); g.beginPath(); g.ellipse(lx, ly, 3.6 * z, 1.3 * z, 0, 0, TAU); g.stroke();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, px = lx + Math.cos(a) * 3.6 * z, py = ly + Math.sin(a) * 1.3 * z; sdLine(GOLD_D, 0.25, z, [[lx, ly - 2.4 * z], [px, py]]);
        poly([[px - 0.25 * z, py], [px + 0.25 * z, py], [px + 0.25 * z, py - 1.2 * z], [px - 0.25 * z, py - 1.2 * z]], '#ffffff'); ellipse(px, py - 1.6 * z, 0.3 * z, 0.5 * z, lit ? '#fff1a0' : C('#ffcf6a'));
        poly([[px, py + 0.4 * z], [px + 0.35 * z, py + 1 * z], [px, py + 1.6 * z], [px - 0.35 * z, py + 1 * z]], 'rgba(220,240,255,0.9)'); }   // Kristalltropfen
      poly([[lx, ly + 1.2 * z], [lx + 0.6 * z, ly + 2.2 * z], [lx, ly + 3.4 * z], [lx - 0.6 * z, ly + 2.2 * z]], 'rgba(220,240,255,0.95)');
      if (lit) glowAt(lx, ly - 1 * z, 26 * z, z);
    }
    const front = ts.filter(t => Math.sin(t) >= 0);
    front.forEach(t => column(t));
    const EY = fy - HC * z, ER = R + 1.6, H = 15, apex = [cx, EY - H * z];
    // Glockendach (geschwungen), rosa mit goldenen Rippen
    const side = s2 => [[cx + s2 * ER * z, EY], [cx + s2 * ER * z, EY - H * 0.42 * z], [cx + s2 * ER * 0.12 * z, EY - H * 0.5 * z], apex];
    const gr = g.createLinearGradient(cx - ER * z, 0, cx + ER * z, 0); gr.addColorStop(0, C('#ffd0e2')); gr.addColorStop(0.45, C('#ff9ec0')); gr.addColorStop(1, C('#d9709a'));
    g.beginPath(); const L = side(-1), Rr = side(1); g.moveTo(...L[0]); g.bezierCurveTo(...L[1], ...L[2], ...L[3]); g.bezierCurveTo(...Rr[2], ...Rr[1], ...Rr[0]);
    g.ellipse(cx, EY, ER * z, ER / 2 * z, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
    g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath();
    for (let j = 1; j < 8; j++) { const t = j / 8 * Math.PI, c = Math.cos(t), sn = Math.sin(t), P0 = [cx + c * ER * z, EY + sn * ER / 2 * z];
      g.moveTo(...P0); g.bezierCurveTo(cx + c * ER * z, EY + sn * ER / 2 * z - H * 0.42 * z, cx + c * ER * 0.12 * z, EY - H * 0.5 * z + sn * 1.2 * z, apex[0], apex[1]); }
    g.stroke();
    ellipse(cx - ER * 0.4 * z, EY - H * 0.25 * z, ER * 0.18 * z, H * 0.12 * z, 'rgba(255,255,255,0.35)');
    for (let k = 0; k <= 18; k++) { const t = k / 18 * Math.PI; circle(cx + Math.cos(t) * ER * z, EY + Math.sin(t) * ER / 2 * z + 0.8 * z, 0.9 * z, C(k % 2 ? '#ffffff' : '#ffc6dc')); }   // Bogenkante
    for (let k = 0; k < N; k++) { const t0 = (k + 0.5) / N * TAU, t1 = (k + 1.5) / N * TAU; if (Math.sin((t0 + t1) / 2) < -0.2) continue;   // durchhängende Stoffbögen zwischen den Säulen
      const a = at(t0), b = at(t1); if (Math.sin(t0) < -0.1 && Math.sin(t1) < -0.1) continue;
      const ya = a[1] - HC * z, yb = b[1] - HC * z, mx = (a[0] + b[0]) / 2, my = (ya + yb) / 2 + 3.2 * z;
      g.beginPath(); g.moveTo(a[0], ya - 0.6 * z); g.quadraticCurveTo(mx, my + 1.4 * z, b[0], yb - 0.6 * z); g.quadraticCurveTo(mx, my - 1.2 * z, a[0], ya - 0.6 * z); g.closePath(); g.fillStyle = C('#ff9ec0'); g.fill();
      { const m = [mx, my + 0.4 * z]; rose(m[0], m[1], 0.8 * z, ROSE); circle(m[0] - 0.9 * z, m[1] - 0.2 * z, 0.6 * z, C('#6fb04a')); circle(m[0] + 0.9 * z, m[1] - 0.2 * z, 0.6 * z, C('#6fb04a')); } }
    sdLine(GOLD_D, 0.6, z, [apex, [cx, apex[1] - 3 * z]]);                                                          // Spitze mit Herz
    g.beginPath(); const hx = cx, hy = apex[1] - 4.6 * z, r = 1.6 * z; g.moveTo(hx, hy + r * 0.9); g.bezierCurveTo(hx - r * 1.4, hy - r * 0.1, hx - r * 0.7, hy - r * 1.1, hx, hy - r * 0.35); g.bezierCurveTo(hx + r * 0.7, hy - r * 1.1, hx + r * 1.4, hy - r * 0.1, hx, hy + r * 0.9); g.fillStyle = C('#ff6f9a'); g.fill();
  };


  // Krönchen-Laterne (Entwurf A, Nutzer 31.10.2026): Laterne in Kronenform (Glaskörper mit Sprossen, Reif mit Steinen, Zacken mit Perlen,
  // Kugel und Stern) auf einem schlanken Pfosten mit Schnörkelfuß, Blumen am Fuß; leuchtet nachts warm
  const crownLamp = (x, y, z, lit) => {                                                                            // x, y = Unterkante der Laterne
    const W = 2.6 * z, H = 4.6 * z;
    poly([[x - W * 0.55, y], [x + W * 0.55, y], [x + W * 0.5, y + 1 * z], [x - W * 0.5, y + 1 * z]], C(GOLD_D)); circle(x, y + 1.5 * z, 0.5 * z, C(GOLD));   // Boden mit Zapfen
    const gg = g.createLinearGradient(x - W, 0, x + W, 0); gg.addColorStop(0, lit ? '#fff4c8' : C('#fff8ea')); gg.addColorStop(1, lit ? '#ffcf6a' : C('#e9dfd0'));
    path([[x - W * 0.55, y], [x + W * 0.55, y], [x + W, y - H], [x - W, y - H]]); g.fillStyle = gg; g.fill();
    if (lit) { ellipse(x, y - H * 0.45, W * 0.35, H * 0.3, '#fff7c0'); }
    g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath(); for (const f of [-0.33, 0.33]) { g.moveTo(x + f * W * 0.55 * 2, y); g.lineTo(x + f * W * 2, y - H); } g.stroke();   // Sprossen
    const ry = y - H;                                                                                                // Kronenreif mit Steinen
    poly([[x - W * 1.08, ry], [x + W * 1.08, ry], [x + W * 1.08, ry - 1.4 * z], [x - W * 1.08, ry - 1.4 * z]], C(GOLD));
    for (const [d, c] of [[-0.66, '#7fc8ff'], [0, ROSE], [0.66, '#8fe0a0']]) ellipse(x + d * W, ry - 0.7 * z, 0.45 * z, 0.5 * z, C(c));
    const pts = []; for (let k = 0; k <= 4; k++) { const px = x - W * 1.08 + k * W * 0.54; pts.push([px, ry - (k % 2 ? 2 : 3.4) * z]); }   // Zacken
    poly([[x - W * 1.08, ry - 1.4 * z], ...pts.map((p, k) => k % 2 ? [p[0], ry - 2.1 * z] : p), [x + W * 1.08, ry - 1.4 * z]], C(GOLD));
    for (const [k, p] of pts.entries()) if (k % 2 === 0) circle(p[0], p[1] - 0.3 * z, 0.45 * z, C('#fff3d6'));
    circle(x, ry - 4.4 * z, 0.75 * z, C(GOLD)); star4(x, ry - 5.6 * z, 0.7 * z, C('#fff3a0'));                     // Kugel, Stern
    if (lit) glowAt(x, y - H * 0.5, 20 * z, z);
  };
  const kroenchenlaterne = (cx, cy, z) => {
    const lit = sdLit();
    sdShadow(cx, cy, 4, z);
    poly([[cx - 2.2 * z, cy], [cx + 2.2 * z, cy], [cx + 1.4 * z, cy - 1.6 * z], [cx - 1.4 * z, cy - 1.6 * z]], C('#5a4a6e'));   // Fuß
    for (const s of [-1, 1]) { g.strokeStyle = C('#5a4a6e'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.moveTo(cx + s * 0.4 * z, cy - 2 * z); g.bezierCurveTo(cx + s * 2.6 * z, cy - 3 * z, cx + s * 2.6 * z, cy - 5.4 * z, cx + s * 0.6 * z, cy - 5 * z); g.stroke(); }
    const gr = g.createLinearGradient(cx - 0.6 * z, 0, cx + 0.6 * z, 0); gr.addColorStop(0, C('#8a78a8')); gr.addColorStop(1, C('#4a3c5e'));
    g.fillStyle = gr; g.fillRect(cx - 0.55 * z, cy - 19 * z, 1.1 * z, 18 * z);                                    // Pfosten
    for (const h of [6, 12]) ellipse(cx, cy - h * z, 0.9 * z, 0.4 * z, C(GOLD_D));
    poly([[cx - 1.8 * z, cy - 19 * z], [cx + 1.8 * z, cy - 19 * z], [cx + 1.2 * z, cy - 20 * z], [cx - 1.2 * z, cy - 20 * z]], C('#5a4a6e'));
    crownLamp(cx, cy - 21.4 * z, z, lit);
    for (const [dx, c] of [[-2.6, PINK], [2.2, '#ffffff'], [-1, LILA]]) { sdLine('#5f9e3a', 0.3, z, [[cx + dx * z, cy + 0.6 * z], [cx + dx * z, cy - 1.8 * z]]); rose(cx + dx * z, cy - 2 * z, 0.7 * z, c); }
  };

  SD_WAREN.TURM = [
    ['Turm mit Zopf ✦', (cx, cy, z) => zopfturm(cx, cy, z), true],         // ganzes Feld, selten
    // Neu (Basar-Durchsicht: „komplett broken“, Entwurf A gewählt 28.10.2026): vier Ballon-Laternen in verschiedenen Höhen, wiegen sich sanft
    // (bewegt: ANIM_ITEMS), am Boden nur ein warmer Schein
    ['Himmelslaternen', (cx, cy, z, now = 0) => {
      const lit = sdLit(), t = (now || 0) / 1000;
      ellipse(cx, cy + 0.6 * z, 7 * z, 2.6 * z, lit ? 'rgba(255,210,120,0.28)' : 'rgba(255,200,90,0.18)');
      for (const [dx, dy, w, ph] of [[-3, -9, 3.2, 0], [5, -20, 2.7, 1.7], [-5.5, -30, 2.2, 3.1], [2.5, -39, 1.7, 4.6]]) {
        balloonLantern(cx + (dx + Math.sin(t * 0.7 + ph) * 0.8) * z, cy + (dy + Math.sin(t * 1.3 + ph) * 1.1) * z, w, z, lit);
      }
    }],
    ['Blumenranken-Tor', (cx, cy, z, now, x, y, t) => {                  // Durchgang (sdArch): Ranken mit Rosen über den Weg
      const { Q } = sdArch(cx, cy, z, t);
      for (const sd of [-1, 1]) { const f = Q(sd); ellipse(f[0], f[1] + 0.4 * z, 2.6 * z, 1.1 * z, 'rgba(40,60,20,0.18)'); }
      const along = u => { if (u < 0.3) return Q(-1, u / 0.3 * 16); if (u > 0.7) return Q(1, (1 - u) / 0.3 * 16); const sd = -1 + (u - 0.3) / 0.4 * 2; return Q(sd, 16 + 10 * Math.sqrt(Math.max(0, 1 - sd * sd))); };
      g.strokeStyle = C('#4f7f33'); g.lineWidth = Math.max(0.8, 1.6 * z); g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); for (let i = 0; i <= 40; i++) { const p = along(i / 40); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
      for (let k = 0; k <= 22; k++) { const p = along(k / 22); circle(p[0] + (k & 1 ? 1 : -1) * z, p[1], 1.8 * z, C(k % 3 ? '#6fb04a' : '#5a9a3c')); }
      for (let k = 1; k <= 21; k += 2) { const p = along(k / 22); rose(p[0] + (k & 2 ? 1.1 : -1.1) * z, p[1] - 0.6 * z, 1.25 * z, [PINK, '#ffffff', LILA, '#ffd23f'][(k >> 1) % 4]); }
    }],
    ['Malstaffelei', (cx, cy, z) => {
      sdShadow(cx, cy, 7, z);
      sdLine('#8a5a3c', 1, z, [[cx - 4 * z, cy], [cx, cy - 20 * z], [cx + 4 * z, cy]]); sdLine('#8a5a3c', 1, z, [[cx, cy - 20 * z], [cx + 1 * z, cy + 1 * z]]);
      poly([[cx - 6 * z, cy - 6 * z], [cx + 6 * z, cy - 6 * z], [cx + 6 * z, cy - 18 * z], [cx - 6 * z, cy - 18 * z]], C('#fffaf0'));
      poly([[cx - 5 * z, cy - 7 * z], [cx + 5 * z, cy - 7 * z], [cx + 5 * z, cy - 17 * z], [cx - 5 * z, cy - 17 * z]], C('#bfe0ff'));
      circle(cx + 2.4 * z, cy - 14.4 * z, 1.6 * z, C('#ffd23f'));                                          // gemalte Sonne
      poly([[cx - 5 * z, cy - 7 * z], [cx - 1 * z, cy - 12 * z], [cx + 2 * z, cy - 9 * z], [cx + 5 * z, cy - 11 * z], [cx + 5 * z, cy - 7 * z]], C('#6fb04a'));
      sdLine('#8a5a3c', 1, z, [[cx - 7 * z, cy - 6 * z], [cx + 7 * z, cy - 6 * z]]);
      ellipse(cx + 8 * z, cy - 1 * z, 3.2 * z, 1.6 * z, C('#e8d0a8'));                                  // Palette
      for (const [dx, c] of [[-1, '#e8546f'], [0.4, '#58b3e8'], [1.6, '#ffd23f']]) circle(cx + (8 + dx) * z, cy - 1.4 * z, 0.6 * z, C(c));
    }],
    ['Laternenboot', (cx, cy, z, now = 0) => laternenboot(cx, cy, z, now)],   // Laternen wiegen sich, Boot schaukelt, Wellen (ANIM_ITEMS)
    ['Blumenschaukel', (cx, cy, z) => {
      sdShadow(cx, cy, 8, z);
      sdLine('#6e4a3a', 2, z, [[cx - 8 * z, cy], [cx - 8 * z, cy - 24 * z]]);
      sdLine('#6e4a3a', 1.6, z, [[cx - 8 * z, cy - 22 * z], [cx + 7 * z, cy - 24 * z]]);
      sdBlob(cx, cy, z, [[-8, -26, 5], [-2, -27, 4.5], [5, -25, 4]], '#5fa84a', '#86c95e');
      for (const s of [-1, 1]) sdLine('#5a8f3a', 0.5, z, [[cx + (1 + s * 3) * z, cy - 23 * z], [cx + (1 + s * 3) * z, cy - 6 * z]]);
      poly([[cx - 3 * z, cy - 6 * z], [cx + 5 * z, cy - 6 * z], [cx + 5 * z, cy - 5 * z], [cx - 3 * z, cy - 5 * z]], C('#e8d0a8'));
      for (let k = 0; k < 8; k++) { const s = k & 1 ? -1 : 1, y = cy - (8 + k * 2) * z; circle(cx + (1 + s * 3) * z, y, 0.9 * z, C([PINK, '#ffffff', '#ffd23f', LILA][k % 4])); }
    }],
    // Auffüllung (Nutzer 18.10.2026: „ja“)
    ['Leseecke', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 9, z);
      poly([[cx - 6 * z, cy], [cx + 2 * z, cy], [cx + 2 * z, cy - 6 * z], [cx - 6 * z, cy - 6 * z]], C('#8a62c4'));            // Sessel
      poly([[cx - 6 * z, cy - 6 * z], [cx + 2 * z, cy - 6 * z], [cx + 2 * z, cy - 7.4 * z], [cx - 6 * z, cy - 7.4 * z]], C('#a986e0'));
      poly([[cx - 6 * z, cy - 7 * z], [cx - 4 * z, cy - 7 * z], [cx - 4 * z, cy - 15 * z], [cx - 6 * z, cy - 14 * z]], C('#7a54b4'));
      for (const s of [-1, 1]) ellipse(cx + (s < 0 ? -6.4 : 2.4) * z, cy - 8 * z, 1.4 * z, 2.2 * z, C('#9b74d4'));
      ellipse(cx - 2 * z, cy - 8 * z, 2.2 * z, 1.4 * z, C('#ffd23f'));                                                // Kissen
      for (const [k, c] of [[0, '#d9534a'], [1, '#58b3e8'], [2, '#58b36a'], [3, '#e9a23b']]) poly([[cx + 4 * z, cy - k * 1.6 * z], [cx + 9 * z, cy - k * 1.6 * z], [cx + 9 * z, cy - (k + 1) * 1.6 * z + 0.3 * z], [cx + 4 * z, cy - (k + 1) * 1.6 * z + 0.3 * z]], C(c));   // Bücherstapel
      sdLine('#6b4f3a', 0.8, z, [[cx + 7 * z, cy - 6.4 * z], [cx + 7 * z, cy - 14 * z]]);
      poly([[cx + 4.6 * z, cy - 13 * z], [cx + 9.4 * z, cy - 13 * z], [cx + 8.4 * z, cy - 17 * z], [cx + 5.6 * z, cy - 17 * z]], lit ? '#ffe39a' : C('#fff0c2'));   // Leselampe
      if (lit) glowAt(cx + 7 * z, cy - 13 * z, 18 * z, z);
    }],
    ['Kräutergarten', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      poly([[cx - 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx + 10 * z, cy - 2 * z], [cx, cy - 7 * z]], C('#6b4f3a'));
      poly([[cx - 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx, cy + 5 * z], [cx - 10 * z, cy]], C('#8a5a3c')); poly([[cx + 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx, cy + 5 * z], [cx + 10 * z, cy]], C('#7a4f30'));
      for (const [dx, dy, c, r] of [[-6, -2, '#5fa84a', 2.2], [-2, -4, '#7fbf5a', 2], [2, -2, '#4f9e3a', 2.4], [6, -3, '#8fcf6a', 1.8], [0, 0, '#6fb04a', 2], [-3, 1, '#b48cff', 1.2], [4, 0, '#ffffff', 1]])
        { for (let k = 0; k < 3; k++) circle(cx + (dx + (k - 1) * 0.8) * z, cy + (dy - 1.5 - (k & 1)) * z, r * 0.6 * z, C(c)); }
      sdLine('#a8794e', 0.6, z, [[cx + 8 * z, cy - 1 * z], [cx + 8 * z, cy - 7 * z]]); poly([[cx + 6 * z, cy - 7 * z], [cx + 10 * z, cy - 7 * z], [cx + 10 * z, cy - 9.4 * z], [cx + 6 * z, cy - 9.4 * z]], C('#f3e2c2'));   // Schildchen
    }],
    ['Blumenkranz-Bank', (cx, cy, z) => kranzbank(cx, cy, z)],
    ['Sonnenblumen', (cx, cy, z) => {
      sdShadow(cx, cy, 7, z);
      for (const [dx, h] of [[-4, 16], [0, 20], [4, 14]]) {
        sdLine('#5f9e3a', 1, z, [[cx + dx * z, cy], [cx + dx * z, cy - h * z]]);
        ellipse(cx + (dx + 1.6) * z, cy - h * 0.5 * z, 2 * z, 1 * z, C('#6fb04a'));
        const p = [cx + dx * z, cy - h * z];
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ellipse(p[0] + Math.cos(a) * 2.6 * z, p[1] + Math.sin(a) * 2.2 * z, 1.2 * z, 1.2 * z, C('#ffd23f')); }
        circle(p[0], p[1], 1.7 * z, C('#7a4a1e'));
      }
    }],
    ['Wandgemälde', (cx, cy, z) => {
      sdShadow(cx, cy, 9, z);
      poly([[cx - 9 * z, cy], [cx + 9 * z, cy], [cx + 9 * z, cy - 14 * z], [cx - 9 * z, cy - 14 * z]], C('#e9dcc6'));
      poly([[cx - 9.6 * z, cy - 14 * z], [cx + 9.6 * z, cy - 14 * z], [cx + 9.6 * z, cy - 15.6 * z], [cx - 9.6 * z, cy - 15.6 * z]], C('#cdbb9c'));
      poly([[cx - 8 * z, cy - 1 * z], [cx + 8 * z, cy - 1 * z], [cx + 8 * z, cy - 13 * z], [cx - 8 * z, cy - 13 * z]], C('#bfe0ff'));      // gemalter Himmel
      circle(cx + 3 * z, cy - 9 * z, 3 * z, C('#ffd23f'));
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; sdLine('#ffd23f', 0.6, z, [[cx + (3 + Math.cos(a) * 3.8) * z, cy - (9 + Math.sin(a) * 3.8) * z], [cx + (3 + Math.cos(a) * 5) * z, cy - (9 + Math.sin(a) * 5) * z]]); }
      poly([[cx - 8 * z, cy - 1 * z], [cx - 4 * z, cy - 6 * z], [cx, cy - 3 * z], [cx + 4 * z, cy - 6.5 * z], [cx + 8 * z, cy - 2 * z], [cx + 8 * z, cy - 1 * z]], C('#6fb04a'));
      for (const [dx, c] of [[-6, PINK], [-3, '#ffffff'], [1, LILA], [5, ROSE]]) circle(cx + dx * z, cy - 2 * z, 0.8 * z, C(c));
      for (const dx of [-6, -1, 4]) skyLantern(cx + dx * z, cy - 11 * z, 0.7, z, false);
    }],
    ['Glühwürmchen-Glas', (cx, cy, z, now = 0) => gluehglas(cx, cy, z, now)],   // Glühwürmchen schwirren (ANIM_ITEMS)
    ['Sonnenpavillon ✦', (cx, cy, z, now = 0) => sonnenpavillon(cx, cy, z, now), true],   // ganzes Feld, selten; Sonne dreht sich (ANIM_ITEMS)
  ];

  // Pilzhaus (Basar-Durchsicht 28.10.2026 „Zwergenhäuschen wie einen Pilz“, Entwurf C in tools/basar-entwurf-p3.js): dicker Stiel als Haus mit
  // runder Tür und runden Fenstern, Kappe als Halbkugel mit Lamellen darunter, kleine Kinderpilze daneben
  const pilzKappe = (x, y, rx, ry, col, z) => {
    ellipse(x, y + 0.6 * z, rx, ry * 0.28, C('#f2e2c4'));                                              // Unterseite
    for (let k = -4; k <= 4; k++) sdLine('#dcc7a0', 0.2, z, [[x + k * rx / 5, y + 0.5 * z], [x + k * rx / 6.5, y + ry * 0.2]]);
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(x, y + ry * 0.35, x - rx, y); g.closePath(); g.fillStyle = C(col); g.fill();
    g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.55, rx * 0.4, ry * 0.25, -0.3, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
  };
  const pilzStiel = (x, y, w, h, z, lit) => {
    poly([[x - w * z, y], [x + w * z, y], [x + w * 0.82 * z, y - h * z], [x - w * 0.82 * z, y - h * z]], C('#fbf1de'));
    poly([[x + w * 0.3 * z, y], [x + w * z, y], [x + w * 0.82 * z, y - h * z], [x + w * 0.25 * z, y - h * z]], 'rgba(160,120,80,0.14)');
    ellipse(x, y, w * z, w * 0.32 * z, C('#fbf1de'));
    g.beginPath(); g.moveTo(x - 1.8 * z, y + 0.4 * z); g.lineTo(x - 1.8 * z, y - 4 * z); g.arc(x, y - 4 * z, 1.8 * z, Math.PI, 0); g.lineTo(x + 1.8 * z, y + 0.4 * z); g.closePath(); g.fillStyle = C('#8a5a3c'); g.fill();
    circle(x + 1 * z, y - 2.4 * z, 0.3 * z, C('#f5c84b'));
    for (const dx of [-w * 0.55, w * 0.55]) { const wx = x + dx * z, wy = y - h * 0.62 * z; circle(wx, wy, 1.5 * z, C('#8a5a3c')); circle(wx, wy, 1.15 * z, lit ? '#ffd27a' : C('#a8d8ff'));
      sdLine('#8a5a3c', 0.25, z, [[wx - 1.1 * z, wy], [wx + 1.1 * z, wy]]); sdLine('#8a5a3c', 0.25, z, [[wx, wy - 1.1 * z], [wx, wy + 1.1 * z]]);
      if (lit) glowAt(wx, wy, 12 * z, z); }
  };
  const kinderPilz = (x, y, s, z, col) => { poly([[x - 0.8 * s * z, y], [x + 0.8 * s * z, y], [x + 0.6 * s * z, y - 3 * s * z], [x - 0.6 * s * z, y - 3 * s * z]], C('#fbf1de')); pilzKappe(x, y - 3 * s * z, 2.4 * s * z, 1.9 * s * z, col, z); };

  // Herzchen-Laube (Basar-Durchsicht 28.10.2026 „was soll das sein?“, Entwurf A in tools/basar-entwurf-p4.js): echte Gartenlaube im Raum (kit),
  // vier Pfosten, Gitter an den Seiten, Bank mit Kissen, oben Bögen wie ein halbes Herz, Rosen ranken hoch, nachts eine Lichterkette
  const LA = 0.2, LB = 0.14, LH = 15;
  const laubePath = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const laubeHump = s => LH + 1.5 + 4.8 * Math.sqrt(Math.max(0, 1 - Math.pow((Math.abs(s) - 0.5) / 0.5, 2)));
  const laubeBench = (K, z) => {
    const P = K.P, a0 = -LA + 0.025, a1 = -LA + 0.1, b0 = -0.1, b1 = 0.1;
    for (const b of [b0 + 0.015, b1 - 0.015]) sdLine('#9a6a40', 0.5, z, [P(a1 - 0.01, b), P(a1 - 0.01, b, 4)]);
    poly([P(a0, b0, 8.5), P(a0, b1, 8.5), P(a0, b1, 4.5), P(a0, b0, 4.5)], C('#b47a4a'));                 // Lehne
    for (const b of [-0.05, 0, 0.05]) sdLine('#8a5a34', 0.25, z, [P(a0, b, 4.8), P(a0, b, 8.2)]);
    poly([P(a0, b0, 4.5), P(a1, b0, 4.5), P(a1, b1, 4.5), P(a0, b1, 4.5)], C('#c98f5a'));                 // Sitz
    poly([P(a1, b0, 4.5), P(a1, b1, 4.5), P(a1, b1, 3.6), P(a1, b0, 3.6)], C('#a8774a'));
    const c = P((a0 + a1) / 2, 0.035, 5.3); ellipse(c[0], c[1], 2.2 * z, 1.1 * z, C('#ff8fb1')); heart(c[0] + 0.1 * z, c[1] - 0.2 * z, 0.6 * z, C('#ffffff'));
  };
  const laubePost = (K, a, b, z) => { const p0 = K.P(a, b), p1 = K.P(a, b, LH); sdLine('#e8ddcf', 1.3, z, [p0, p1]); sdLine('#fffaf2', 0.8, z, [[p0[0] - 0.25 * z, p0[1]], [p1[0] - 0.25 * z, p1[1]]]); };
  const laubeGitter = (K, a, z) => {
    const P = K.P;
    g.save(); laubePath([P(a, -LB, 2), P(a, LB, 2), P(a, LB, 12.5), P(a, -LB, 12.5)]); g.clip(); g.beginPath();      // alle Gitterstäbe in einem Pfad
    for (let k = -6; k <= 6; k++) { const b = k * 0.045; for (const d of [1, -1]) { const p0 = P(a, b - d * 0.12, 0), p1 = P(a, b + d * 0.12, 15); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); } }
    g.strokeStyle = C('#fff6ea'); g.lineWidth = 0.4 * z; g.stroke(); g.restore();
    sdLine('#fffaf2', 0.6, z, [P(a, -LB, 12.5), P(a, LB, 12.5)]); sdLine('#fffaf2', 0.6, z, [P(a, -LB, 2), P(a, LB, 2)]);
  };
  const laubeBogen = (K, b, z) => { const pts = []; for (let i = 0; i <= 40; i++) { const s = -1 + i / 20; pts.push(K.P(s * LA, b, laubeHump(s))); }
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = C('#ddd2c2'); g.lineWidth = 1.6 * z; laubePath(pts, false); g.stroke();
    g.strokeStyle = C('#fffaf2'); g.lineWidth = 0.9 * z; laubePath(pts, false); g.stroke(); };
  const laubeLaub = (x, y, z, n, seed) => { for (const odd of [0, 1]) { g.beginPath(); for (let k = odd; k < n; k += 2) { const a = seed + k * 2.3, d = 0.6 + (k % 3) * 0.5, r = (0.9 + odd * 0.3) * z, px = x + Math.cos(a) * d * z, py = y + Math.sin(a) * d * z; g.moveTo(px + r, py); g.arc(px, py, r, 0, Math.PI * 2); } g.fillStyle = C(odd ? '#4f9e4a' : '#3f8a3e'); g.fill(); } };

  SD_WAREN.MAERCHEN = [
    ['Kürbiskutsche ✦', (cx, cy, z) => {                                    // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 18, z);
      for (const [dx, r] of [[-9, 4.4], [9, 4.4]]) { circle(cx + dx * z, cy - r * z, r * z, C('#e8d6a8')); circle(cx + dx * z, cy - r * z, r * 0.7 * z, C('#fff3d6')); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; sdLine(GOLD_D, 0.35, z, [[cx + dx * z, cy - r * z], [cx + (dx + Math.cos(a) * r) * z, cy - (r + Math.sin(a) * r) * z]]); } }
      ellipse(cx, cy - 13 * z, 13 * z, 10 * z, C('#f08a2e'));
      for (const dx of [-8, -3, 3, 8]) { g.strokeStyle = C('#d9701e'); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); g.ellipse(cx + dx * 0.4 * z, cy - 13 * z, Math.abs(dx) * 0.9 * z + 2 * z, 10 * z, 0, -Math.PI / 2, Math.PI / 2, dx < 0); g.stroke(); }
      poly([[cx - 3 * z, cy - 8 * z], [cx + 3 * z, cy - 8 * z], [cx + 3 * z, cy - 16 * z], [cx, cy - 18 * z], [cx - 3 * z, cy - 16 * z]], lit ? '#ffd27a' : C('#fff0c2'));   // Fenster
      if (lit) glowAt(cx, cy - 13 * z, 22 * z, z);
      sdLine(GOLD, 1.2, z, [[cx - 12 * z, cy - 4 * z], [cx + 12 * z, cy - 4 * z]]);
      sdLine('#4f9e3a', 1.2, z, [[cx, cy - 23 * z], [cx + 2 * z, cy - 27 * z]], [cx - 1 * z, cy - 26 * z]);
      ellipse(cx + 3 * z, cy - 26 * z, 2.4 * z, 1.2 * z, C('#5fb35a'));
      sdStarDraw([cx, cy - 31 * z], 2.2 * z, GOLD, GOLD_D);
    }, true],
    ['Glasschuh auf Kissen', (cx, cy, z) => glasschuh(cx, cy, z)],
    ['Froschkönig-Brunnen', (cx, cy, z, now = 0) => froschbrunnen(cx, cy, z, now)],   // Wasser, Wellen, Frosch blinzelt (ANIM_ITEMS)
    // nur Rosenhecke (Basar-Durchsicht 28.10.2026: Spinnrad weg), dafür breiter und voller, Rosen in zwei Rottönen und Weiß
    ['Rosenhecke', (cx, cy, z) => {
      sdShadow(cx, cy, 13, z);
      sdBlob(cx, cy, z, [[-9, -5, 4.6], [-4, -7, 5.4], [2, -7.4, 5.6], [8, -5.4, 4.8], [-6, -11, 4.2], [0, -12.4, 4.6], [6, -10.6, 4.2], [11, -3.4, 3.4], [-12, -3, 3.4]], '#3f7f3a', '#5a9e4a');
      for (const [dx, dy, c] of [[-10, -5, 0], [-5, -9, 1], [-1, -13, 0], [4, -11, 2], [9, -7, 0], [1, -6, 1], [-6, -3.4, 2], [6, -3.6, 1], [11, -3, 0], [-2, -9, 2], [7, -13, 1], [-12, -2, 1]])
        rose(cx + dx * z, cy + dy * z, 1.35 * z, [ROSE, '#e8364f', '#fff3f0'][c]);
    }],
    ['Apfelbaum mit Bank', (cx, cy, z) => {
      sdShadow(cx, cy, 11, z);
      sdTrunk(cx - 3 * z, cy, z, 16, 2, '#6e4a3a');
      sdBlob(cx - 3 * z, cy, z, SD_CROWN, '#3f8f4a', '#5fb35a');
      for (const [dx, dy] of [[-8, -18], [0, -24], [4, -19], [-5, -28], [6, -26]]) { circle(cx + (dx - 3) * z, cy + dy * z, 1.7 * z, C('#d6303a')); circle(cx + (dx - 3.5) * z, cy + (dy - 0.6) * z, 0.5 * z, C('#ff9a9a')); }
      poly([[cx + 1 * z, cy - 3 * z], [cx + 10 * z, cy - 3 * z], [cx + 10 * z, cy - 4.4 * z], [cx + 1 * z, cy - 4.4 * z]], C('#a8794e'));
      for (const dx of [2, 9]) sdLine('#8a5a3c', 0.8, z, [[cx + dx * z, cy - 3 * z], [cx + dx * z, cy]]);
      circle(cx + 6 * z, cy - 5.6 * z, 1.4 * z, C('#d6303a'));                                          // ein Apfel auf der Bank
    }],
    ['Zwergenhäuschen ✦', (cx, cy, z) => {                                  // ganzes Feld, selten: Fliegenpilz-Haus mit Kinderpilzen
      const lit = sdLit();
      sdShadow(cx, cy, 16, z);
      kinderPilz(cx - 11 * z, cy - 1 * z, 1, z, '#e8604f');
      pilzStiel(cx, cy, 7, 12, z, lit);
      pilzKappe(cx, cy - 12 * z, 15 * z, 11 * z, '#d9443a', z);
      for (const [dx, dy, r] of [[-8, -16, 2], [-2, -20, 2.4], [5, -17, 2], [9, -13, 1.5], [-11, -13, 1.4], [1, -14, 1.6]]) ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.7 * z, C('#ffffff'));
      kinderPilz(cx + 11 * z, cy + 2 * z, 0.8, z, '#d9443a');
      kinderPilz(cx + 13.5 * z, cy - 0.5 * z, 0.6, z, '#e8604f');
      for (const [dx, dy, r] of [[-3, 3, 1.2], [0, 4, 1.1], [3, 5, 1.2]]) { ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.55 * z, C('#c9c2b4')); ellipse(cx + (dx - 0.2) * z, cy + (dy - 0.2) * z, r * 0.7 * z, r * 0.35 * z, C('#e2ddd2')); }   // Trittsteine
    }, true],
    ['Zauberspiegel', (cx, cy, z, now = 0) => zauberspiegel(cx, cy, z, now)],   // Zauberwirbel, Schimmer (ANIM_ITEMS)
    ['Einhorn ✦', (cx, cy, z, now = 0) => einhorn(cx, cy, z, now)],          // klein, selten; Mähne und Schweif wehen (ANIM_ITEMS)
    ['Herzchen-Laube', (cx, cy, z) => {
      const lit = sdLit(), K = kit(cx, cy, z, 0), P = K.P;
      sdShadow(cx, cy, 11, z);
      poly([P(-LA - 0.05, -LB - 0.05), P(LA + 0.05, -LB - 0.05), P(LA + 0.05, LB + 0.05), P(-LA - 0.05, LB + 0.05)], C('#e9e0d2'));   // Steinboden
      for (const [a, b] of [[-0.1, -0.06], [0.08, 0.02], [-0.02, 0.11], [0.15, -0.09]]) { const p = P(a, b); ellipse(p[0], p[1], 1.6 * z, 0.8 * z, C('#d8cebd')); }
      laubePost(K, -LA, -LB, z); laubePost(K, LA, -LB, z); laubeGitter(K, -LA, z);
      laubeBogen(K, -LB, z);
      laubeBench(K, z);
      for (const s of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) sdLine('#f4ece0', 0.5, z, [P(s * LA, -LB, laubeHump(s)), P(s * LA, LB, laubeHump(s))]);   // Dachlatten
      laubePost(K, -LA, LB, z); laubeGitter(K, LA, z); laubePost(K, LA, LB, z);
      laubeBogen(K, LB, z);
      const hp = P(0, LB, laubeHump(0) - 2.4); sdLine('#e8ddcf', 0.2, z, [[hp[0], hp[1] - 2 * z], [hp[0], hp[1]]]); heart(hp[0], hp[1] + 0.6 * z, 1.5 * z, C('#ff6f9a'));
      for (const [a, b] of [[-LA, LB], [LA, LB], [LA, -LB]]) for (let h = 2; h <= LH; h += 2.6) { const p = P(a, b, h);     // Rosen an den Pfosten hoch
        laubeLaub(p[0], p[1], z, 3, h + a * 10); if ((h | 0) % 3 === 2) rose(p[0] + 0.5 * z, p[1] - 0.3 * z, 0.9 * z, h > 9 ? '#ff6f9a' : '#e8364f'); }
      for (const [s, c] of [[-0.85, '#ff6f9a'], [-0.55, '#ffffff'], [-0.3, '#e8364f'], [0.35, '#ff6f9a'], [0.6, '#ffffff'], [0.9, '#e8364f']]) {   // und über den Bogen
        const p = P(s * LA, LB, laubeHump(s)); laubeLaub(p[0], p[1], z, 3, s * 7); rose(p[0], p[1] - 0.6 * z, 1 * z, c); }
      for (let i = 1; i < 12; i++) { const s = -1 + i / 6, p = P(s * LA, LB, laubeHump(s) - 0.9);                          // Lichterkette
        circle(p[0], p[1], 0.45 * z, lit ? '#ffe9a0' : C('#fff2c8')); if (lit) glowAt(p[0], p[1], 6 * z, z); }
    }],
    ['Krönchen-Laterne', (cx, cy, z) => kroenchenlaterne(cx, cy, z)],
    ['Tanzpavillon ✦', (cx, cy, z) => tanzpavillon(cx, cy, z), true],         // ganzes Feld, selten
  ];
})();
// 🍃 Sammlung Inselleben (Block 161c, Animal-Crossing-Gefühl – eigene Motive). Form wie SD_ART; Bogen: tools/waren-entwurf.js
SD_WAREN.INSEL = (() => {
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const plank = (x0, y0, x1, y1, h, col, z) => poly([[x0, y0], [x1, y1], [x1, y1 - h * z], [x0, y0 - h * z]], C(col));
  return [
    ['Lagerfeuer', (cx, cy, z, now) => {
      const lit = sdLit();
      sdShadow(cx, cy, 9, z);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ellipse(cx + Math.cos(a) * 7 * z, cy + Math.sin(a) * 3 * z, 2 * z, 1.3 * z, C(k & 1 ? '#9b958a' : '#b5ad9c')); }
      sdLine('#6e4a3a', 1.6, z, [[cx - 4 * z, cy + 1 * z], [cx + 3 * z, cy - 3 * z]]); sdLine('#7a5236', 1.6, z, [[cx + 4 * z, cy + 1 * z], [cx - 3 * z, cy - 3 * z]]);
      poly([[cx - 3.4 * z, cy - 1 * z], [cx + 3.4 * z, cy - 1 * z], [cx + 1 * z, cy - 8 * z], [cx, cy - 11 * z], [cx - 1.4 * z, cy - 7 * z]], C('#ff8a3d'));
      poly([[cx - 1.8 * z, cy - 1 * z], [cx + 1.8 * z, cy - 1 * z], [cx + 0.4 * z, cy - 6.4 * z], [cx - 0.6 * z, cy - 4 * z]], C('#ffd23f'));
      if (lit) glowAt(cx, cy - 4 * z, 30 * z, z);
      for (const s of [-1, 1]) { poly([[cx + s * 10 * z, cy - 1 * z], [cx + s * 14 * z, cy + 1 * z], [cx + s * 14 * z, cy - 1.5 * z], [cx + s * 10 * z, cy - 3.5 * z]], C('#8a5a3c')); }   // Baumstämme zum Sitzen
    }],
    ['Hängematte', (cx, cy, z) => {
      sdShadow(cx, cy, 12, z);
      for (const s of [-1, 1]) { sdTrunk(cx + s * 11 * z, cy, z, 18, 1.4, '#7a5a3a'); sdBlob(cx + s * 11 * z, cy, z, [[0, -20, 5], [-3, -18, 3.4], [3, -18, 3.4]], '#4f9e4a', '#74c25e'); }
      g.beginPath(); g.moveTo(cx - 10 * z, cy - 12 * z); g.quadraticCurveTo(cx, cy - 2 * z, cx + 10 * z, cy - 12 * z); g.quadraticCurveTo(cx, cy - 6 * z, cx - 10 * z, cy - 12 * z); g.closePath();
      g.fillStyle = C('#e86f8f'); g.fill();
      for (const t of [0.3, 0.5, 0.7]) { const x = cx + (-10 + 20 * t) * z, y = cy - (12 - 10 * 4 * t * (1 - t) * 0.9) * z; sdLine('#fff3e0', 0.6, z, [[x - 0.6 * z, y - 1 * z], [x + 0.6 * z, y + 1 * z]]); }
    }],
    ['Picknickdecke', (cx, cy, z) => {
      poly([[cx - 11 * z, cy], [cx, cy - 5.5 * z], [cx + 11 * z, cy], [cx, cy + 5.5 * z]], C('#e8546f'));
      for (let k = -2; k <= 2; k++) { sdLine('#fff3f3', 0.9, z, [[cx + (k * 2.2 - 5.5) * z, cy + (k * 1.1 + 2.75) * z], [cx + (k * 2.2 + 5.5) * z, cy + (k * 1.1 - 2.75) * z]]); sdLine('#fff3f3', 0.9, z, [[cx + (k * 2.2 - 5.5) * z, cy - (k * 1.1 + 2.75) * z], [cx + (k * 2.2 + 5.5) * z, cy - (k * 1.1 - 2.75) * z]]); }
      poly([[cx - 4 * z, cy - 1 * z], [cx + 1 * z, cy - 1 * z], [cx + 1 * z, cy - 5 * z], [cx - 4 * z, cy - 5 * z]], C('#c69a5e'));   // Korb
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.5, 0.7 * z); g.beginPath(); g.ellipse(cx - 1.5 * z, cy - 5 * z, 2.4 * z, 2.4 * z, 0, Math.PI, 0); g.stroke();
      for (const [dx, dy, c] of [[4, -1, '#d6303a'], [5.6, 0.4, '#ffd23f'], [3, 1, '#5fb35a']]) circle(cx + dx * z, cy + dy * z, 1.2 * z, C(c));
    }],
    ['Briefkasten', (cx, cy, z) => {
      sdShadow(cx, cy, 5, z);
      sdLine('#8a5a3c', 1.4, z, [[cx, cy], [cx, cy - 10 * z]]);
      poly([[cx - 4 * z, cy - 10 * z], [cx + 4 * z, cy - 10 * z], [cx + 4 * z, cy - 15 * z], [cx - 4 * z, cy - 15 * z]], C('#58b3e8'));
      g.beginPath(); g.ellipse(cx, cy - 15 * z, 4 * z, 2.4 * z, 0, Math.PI, 0); g.fillStyle = C('#58b3e8'); g.fill();
      sdLine('#d9534a', 0.8, z, [[cx + 4.4 * z, cy - 11 * z], [cx + 4.4 * z, cy - 17 * z]]); poly([[cx + 4.4 * z, cy - 17 * z], [cx + 7 * z, cy - 16.4 * z], [cx + 4.4 * z, cy - 15.4 * z]], C('#d9534a'));
      poly([[cx - 2 * z, cy - 12 * z], [cx + 1 * z, cy - 12 * z], [cx + 1 * z, cy - 13 * z], [cx - 2 * z, cy - 13 * z]], C('#fffaf0'));   // Brief guckt raus
    }],
    ['Fossil ✦', (cx, cy, z) => {                                            // klein, selten
      sdShadow(cx, cy, 11, z);
      box(cx, cy, 9 * z, 4.5 * z, 3 * z, '#d9cfbf', '#e8e1d4', 0);
      const B = '#f3ecdf';
      sdLine(B, 1.4, z, [[cx - 6 * z, cy - 10 * z], [cx + 6 * z, cy - 12 * z]], [cx, cy - 15 * z]);   // Rücken
      for (let k = 0; k < 5; k++) { const x = cx + (-4 + k * 2) * z; sdLine(B, 0.7, z, [[x, cy - (13 - Math.abs(k - 2) * 0.4) * z], [x + 0.6 * z, cy - (8 + Math.abs(k - 2) * 0.3) * z]]); }   // Rippen
      sdLine(B, 1, z, [[cx + 6 * z, cy - 12 * z], [cx + 9 * z, cy - 18 * z]]); ellipse(cx + 10 * z, cy - 19.4 * z, 2.6 * z, 1.6 * z, C(B)); circle(cx + 10.6 * z, cy - 19.8 * z, 0.5 * z, C('#8a7a62'));   // Hals, Kopf
      sdLine(B, 1, z, [[cx - 6 * z, cy - 10 * z], [cx - 11 * z, cy - 6 * z]], [cx - 10 * z, cy - 11 * z]);   // Schwanz
      for (const dx of [-4, 3]) sdLine(B, 0.9, z, [[cx + dx * z, cy - 9 * z], [cx + (dx - 0.6) * z, cy - 3 * z]]);
    }],
    ['Strandkorb', (cx, cy, z) => {
      sdShadow(cx, cy, 8, z);
      poly([[cx - 6 * z, cy], [cx + 6 * z, cy], [cx + 6 * z, cy - 8 * z], [cx - 6 * z, cy - 8 * z]], C('#e8d0a0'));
      for (let k = 0; k < 5; k++) sdLine('#c9a86a', 0.35, z, [[cx - 6 * z, cy - (1.5 + k * 1.5) * z], [cx + 6 * z, cy - (1.5 + k * 1.5) * z]]);
      g.beginPath(); g.moveTo(cx - 6 * z, cy - 8 * z); g.lineTo(cx - 6 * z, cy - 17 * z); g.quadraticCurveTo(cx, cy - 21 * z, cx + 6 * z, cy - 17 * z); g.lineTo(cx + 6 * z, cy - 8 * z); g.closePath(); g.fillStyle = C('#e8d0a0'); g.fill();
      g.beginPath(); g.moveTo(cx - 4.6 * z, cy - 8 * z); g.lineTo(cx - 4.6 * z, cy - 16 * z); g.quadraticCurveTo(cx, cy - 19 * z, cx + 4.6 * z, cy - 16 * z); g.lineTo(cx + 4.6 * z, cy - 8 * z); g.closePath(); g.fillStyle = C('#58b3e8'); g.fill();
      for (let k = 0; k < 4; k++) poly([[cx + (-4.6 + k * 2.3) * z, cy - 8 * z], [cx + (-3.45 + k * 2.3) * z, cy - 8 * z], [cx + (-3.45 + k * 2.3) * z, cy - 17 * z], [cx + (-4.6 + k * 2.3) * z, cy - 17 * z]], C('#ffffff'));
      poly([[cx - 4.6 * z, cy - 8 * z], [cx + 4.6 * z, cy - 8 * z], [cx + 4.6 * z, cy - 9.6 * z], [cx - 4.6 * z, cy - 9.6 * z]], C('#e86f8f'));   // Kissen
    }],
    ['Vogelscheuche', (cx, cy, z) => {
      sdShadow(cx, cy, 6, z);
      sdLine('#8a5a3c', 1.2, z, [[cx, cy], [cx, cy - 20 * z]]); sdLine('#8a5a3c', 1, z, [[cx - 7 * z, cy - 14 * z], [cx + 7 * z, cy - 14 * z]]);
      poly([[cx - 4 * z, cy - 6 * z], [cx + 4 * z, cy - 6 * z], [cx + 4.6 * z, cy - 15 * z], [cx - 4.6 * z, cy - 15 * z]], C('#58b3e8'));
      poly([[cx - 2 * z, cy - 6 * z], [cx + 2 * z, cy - 6 * z], [cx + 1.6 * z, cy - 12 * z], [cx - 1.6 * z, cy - 12 * z]], C('#e86f8f'));   // Flicken
      for (const s of [-1, 1]) for (const k of [0, 1, 2]) sdLine('#e8c25a', 0.5, z, [[cx + s * 7 * z, cy - 14 * z], [cx + s * (8 + k * 0.4) * z, cy - (12.4 - k) * z]]);   // Stroh
      circle(cx, cy - 18 * z, 3.2 * z, C('#f3e2c2'));
      for (const dx of [-1.2, 1.2]) circle(cx + dx * z, cy - 18.4 * z, 0.45 * z, C('#3a3a44'));
      g.strokeStyle = C('#5a3a2a'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.ellipse(cx, cy - 17.4 * z, 1.3 * z, 0.8 * z, 0, 0.2, Math.PI - 0.2); g.stroke();
      poly([[cx - 5.6 * z, cy - 20 * z], [cx + 5.6 * z, cy - 20 * z], [cx + 2.6 * z, cy - 21 * z], [cx + 1.6 * z, cy - 25 * z], [cx - 1.6 * z, cy - 25 * z], [cx - 2.6 * z, cy - 21 * z]], C('#e8c25a'));   // Strohhut
      poly([[cx - 2.6 * z, cy - 21 * z], [cx + 2.6 * z, cy - 21 * z], [cx + 2.4 * z, cy - 22 * z], [cx - 2.4 * z, cy - 22 * z]], C('#d9534a'));
    }],
    ['Wäscheleine', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      for (const s of [-1, 1]) sdLine('#8a5a3c', 1.2, z, [[cx + s * 10 * z, cy], [cx + s * 10 * z, cy - 16 * z]]);
      sdLine('#e8e2d6', 0.4, z, [[cx - 10 * z, cy - 15 * z], [cx + 10 * z, cy - 15 * z]], [cx, cy - 12 * z]);
      for (const [t, w, h, c] of [[0.2, 2.4, 6, '#58b3e8'], [0.42, 3, 4, '#ffd23f'], [0.62, 2.2, 5, '#e86f8f'], [0.82, 2.4, 3.4, '#ffffff']]) {
        const x = cx + (-10 + 20 * t) * z, y = cy - (15 - 3 * 4 * t * (1 - t)) * z;
        poly([[x - w * z, y], [x + w * z, y], [x + w * 0.9 * z, y + h * z], [x - w * 0.9 * z, y + h * z]], C(c));
        circle(x - w * 0.6 * z, y, 0.4 * z, C('#a8794e')); circle(x + w * 0.6 * z, y, 0.4 * z, C('#a8794e'));
      }
    }],
    ['Glockenbaum', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      sdTrunk(cx, cy, z, 15, 2, '#6e4a3a');
      sdBlob(cx, cy, z, SD_CROWN, '#3f8f4a', '#5fb35a');
      for (const [dx, dy] of [[-7, -16], [6, -19], [-1, -22], [9, -25], [-9, -24]]) { const x = cx + dx * z, y = cy + dy * z;   // goldene Glöckchen
        poly([[x - 1.6 * z, y + 1.6 * z], [x + 1.6 * z, y + 1.6 * z], [x + 1 * z, y - 1 * z], [x - 1 * z, y - 1 * z]], C('#f5c84b')); circle(x, y + 1.9 * z, 0.5 * z, C('#c9962a')); }
    }],
    ['Teleskop', (cx, cy, z) => {
      sdShadow(cx, cy, 6, z);
      for (const [dx, dy] of [[-4, 1], [4, 1], [0, 2]]) sdLine('#8a5a3c', 0.9, z, [[cx, cy - 9 * z], [cx + dx * z, cy + dy * z]]);
      g.save(); g.translate(cx, cy - 10 * z); g.rotate(-0.6);
      poly([[-5 * z, -1.4 * z], [7 * z, -2.2 * z], [7 * z, 2.2 * z], [-5 * z, 1.4 * z]], C('#c9962a')); poly([[7 * z, -2.4 * z], [9 * z, -2.4 * z], [9 * z, 2.4 * z], [7 * z, 2.4 * z]], C('#2f3b7a'));
      g.restore();
      sdStarDraw([cx + 9 * z, cy - 24 * z], 1.4 * z, '#f5c84b', '#c9962a');
    }],
    // Schwimmt (nur aufs Wasser, Basar-Durchsicht 28.10.2026: „nur auf Wasser platzierbar“): Wellenringe statt Schatten, schaukelt leicht
    ['Kanu', (cx, cy0, z, now = 0) => {
      const t = (now || 0) / 1000, cy = cy0 + Math.sin(t * 1.6) * 0.5 * z;
      for (const [r, a] of [[15, 0.18], [11, 0.28]]) { g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = Math.max(0.5, 0.5 * z); g.beginPath(); g.ellipse(cx, cy0 + 0.5 * z, (r + Math.sin(t * 1.6) * 0.6) * z, (r * 0.32) * z, 0, 0, Math.PI * 2); g.stroke(); }
      ellipse(cx, cy0 + 0.4 * z, 12.5 * z, 2.6 * z, 'rgba(30,70,110,0.22)');
      g.beginPath(); g.moveTo(cx - 13 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy + 3 * z, cx + 13 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 1 * z, cx - 13 * z, cy - 4 * z); g.closePath(); g.fillStyle = C('#d9701e'); g.fill();
      g.beginPath(); g.moveTo(cx - 12 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 1.6 * z, cx + 12 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 2.6 * z, cx - 12 * z, cy - 4 * z); g.closePath(); g.fillStyle = C('#8a4a1e'); g.fill();
      sdLine('#a8794e', 0.9, z, [[cx - 4 * z, cy - 8 * z], [cx + 6 * z, cy + 1 * z]]); ellipse(cx + 6.6 * z, cy + 1.6 * z, 1.4 * z, 0.7 * z, C('#a8794e'));
    }],
    ['Gartenwichtel', (cx, cy, z) => {
      sdShadow(cx, cy, 4, z);
      ellipse(cx, cy - 4 * z, 3.2 * z, 4 * z, C('#58b3e8'));
      circle(cx, cy - 9 * z, 2.4 * z, C('#f3d2b0'));
      poly([[cx - 2.6 * z, cy - 8 * z], [cx + 2.6 * z, cy - 8 * z], [cx, cy - 4.4 * z]], C('#ffffff'));            // Bart
      poly([[cx - 2.8 * z, cy - 10 * z], [cx + 2.8 * z, cy - 10 * z], [cx + 1 * z, cy - 17 * z]], C('#d9534a'));   // Zipfelmütze
      circle(cx, cy - 9.2 * z, 0.6 * z, C('#e8907a'));
      for (const s of [-1, 1]) ellipse(cx + s * 1.6 * z, cy - 0.3 * z, 1.4 * z, 0.7 * z, C('#6e4a3a'));
      ellipse(cx + 4 * z, cy - 1 * z, 2.2 * z, 1.6 * z, C('#e8546f')); circle(cx + 3.4 * z, cy - 1.8 * z, 0.4 * z, C('#ffffff'));   // Pilz daneben
    }],
    ['Hühnerhaus ✦', (cx, cy, z) => {                                       // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 16, z);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; sdLine('#c9a86a', 0.8, z, [[cx + Math.cos(a) * 15 * z, cy + Math.sin(a) * 7 * z], [cx + Math.cos(a) * 15 * z, cy + Math.sin(a) * 7 * z - 4 * z]]); }
      box(cx - 3 * z, cy - 1 * z, 6 * z, 3 * z, 8 * z, '#d9534a', null, 0);
      poly([[cx - 10 * z, cy - 9 * z], [cx - 3 * z, cy - 5.6 * z], [cx + 4 * z, cy - 9 * z], [cx - 3 * z, cy - 15 * z]], C('#fff3e0'));
      poly([[cx - 4 * z, cy - 2 * z], [cx - 1.6 * z, cy - 3 * z], [cx - 1.6 * z, cy - 6.4 * z], [cx - 4 * z, cy - 5.4 * z]], lit ? '#ffd27a' : C('#5a3a2a'));
      if (lit) glowAt(cx - 2.8 * z, cy - 4.4 * z, 12 * z, z);
      for (const [dx, dy, c] of [[6, 2, '#ffffff'], [9, -1, '#e8c25a'], [3, 4, '#ffffff']]) { const x = cx + dx * z, y = cy + dy * z;   // Hühner
        ellipse(x, y - 1.6 * z, 2 * z, 1.6 * z, C(c)); circle(x + 1.6 * z, y - 3 * z, 1 * z, C(c)); poly([[x + 2.4 * z, y - 3 * z], [x + 3.4 * z, y - 2.8 * z], [x + 2.4 * z, y - 2.5 * z]], C('#f0a24a')); circle(x + 1.6 * z, y - 4 * z, 0.5 * z, C('#d9534a')); }
    }, true],
  ];
})();
// Kennung, ✨-Preis, selten, Schönheit, Taler je Stück (Bauen), Material – je Bildtitel aus den Entwürfen
const SD_WAREN_META = {
  'Schneemann': { id: 'sd_schneemann', price: 110, rare: false, beauty: 5, cost: 120 },
  'Eiskristall-Laterne': { id: 'sd_eislaterne', price: 140, rare: false, beauty: 6, cost: 200 },
  'Verschneite Tanne': { id: 'sd_schneetanne', price: 110, rare: false, beauty: 5, cost: 120 },
  'Schlitten mit Geschenken': { id: 'sd_schlitten', price: 130, rare: false, beauty: 6, cost: 150 },
  'Rentier': { id: 'sd_rentier', price: 150, rare: false, beauty: 6, cost: 150 },
  'Iglu': { id: 'sd_iglu', price: 200, rare: false, beauty: 14, cost: 600 },
  'Eisblumen': { id: 'sd_eisblumen', price: 120, rare: false, beauty: 4, cost: 80 },
  'Schneeflocken-Bogen': { id: 'sd_flockenbogen', price: 150, rare: false, beauty: 7, cost: 200 },
  'Eisbank': { id: 'sd_eisbank', price: 90, rare: false, beauty: 4, cost: 80 },
  'Eisbär': { id: 'sd_eisbaer', price: 150, rare: false, beauty: 6, cost: 150 },
  'Pinguine': { id: 'sd_pinguine', price: 140, rare: false, beauty: 6, cost: 150 },
  'Schneekugel': { id: 'sd_schneekugel', price: 120, rare: false, beauty: 5, cost: 120 },
  'Schlittschuh-Teich': { id: 'sd_eisteich', price: 200, rare: false, beauty: 14, cost: 600 },
  'Eispalast-Pavillon ✦': { id: 'sd_eispalast', price: 450, rare: true, beauty: 28, cost: 2500, mat: {'kristall': 4} },
  'Schneeflocken-Brunnen ✦': { id: 'sd_flockenbrunnen', price: 400, rare: true, beauty: 24, cost: 1500, mat: {'quader': 6} },
  'Leseecke': { id: 'sd_leseecke', price: 140, rare: false, beauty: 5, cost: 150 }, 'Kräutergarten': { id: 'sd_kraeuter', price: 110, rare: false, beauty: 5, cost: 120 },
  'Blumenkranz-Bank': { id: 'sd_kranzbank', price: 120, rare: false, beauty: 5, cost: 120 }, 'Sonnenblumen': { id: 'sd_sonnenblumen', price: 90, rare: false, beauty: 4, cost: 60 },
  'Wandgemälde': { id: 'sd_wandbild', price: 100, rare: false, beauty: 5, cost: 100 }, 'Glühwürmchen-Glas': { id: 'sd_gluehglas', price: 130, rare: false, beauty: 5, cost: 120 },
  'Sonnenpavillon ✦': { id: 'sd_sonnenpavillon', price: 400, rare: true, beauty: 26, cost: 2500, mat: {'bretter': 8} },
  'Turm mit Zopf ✦': { id: 'sd_zopfturm', price: 450, rare: true, beauty: 26, cost: 2500, mat: {'quader': 8} },
  'Himmelslaternen': { id: 'sd_himmelslaternen', price: 150, rare: false, beauty: 6, cost: 150 },
  'Blumenranken-Tor': { id: 'sd_rankentor', price: 130, rare: false, beauty: 6, cost: 150 },
  'Malstaffelei': { id: 'sd_staffelei', price: 90, rare: false, beauty: 4, cost: 80 },
  'Laternenboot': { id: 'sd_laternenboot', price: 150, rare: false, beauty: 6, cost: 200 },
  'Blumenschaukel': { id: 'sd_blumenschaukel', price: 130, rare: false, beauty: 6, cost: 150 },
  'Kürbiskutsche ✦': { id: 'sd_kuerbiskutsche', price: 450, rare: true, beauty: 26, cost: 2500 },
  'Glasschuh auf Kissen': { id: 'sd_glasschuh', price: 140, rare: false, beauty: 5, cost: 150 },
  'Froschkönig-Brunnen': { id: 'sd_froschbrunnen', price: 170, rare: false, beauty: 8, cost: 300, mat: {'quader': 2} },
  'Rosenhecke': { id: 'sd_spinnrad', price: 150, rare: false, beauty: 7, cost: 200 },
  'Apfelbaum mit Bank': { id: 'sd_apfelbaum', price: 120, rare: false, beauty: 6, cost: 150 },
  'Zwergenhäuschen ✦': { id: 'sd_zwergenhaus', price: 400, rare: true, beauty: 24, cost: 2000, mat: {'bretter': 6} },
  'Zauberspiegel': { id: 'sd_zauberspiegel', price: 150, rare: false, beauty: 6, cost: 200 },
  'Einhorn ✦': { id: 'sd_einhorn', price: 400, rare: true, beauty: 12, cost: 500 },
  'Herzchen-Laube': { id: 'sd_herzlaube', price: 130, rare: false, beauty: 6, cost: 150 },
  'Krönchen-Laterne': { id: 'sd_kroenchenlaterne', price: 120, rare: false, beauty: 5, cost: 150 },
  'Tanzpavillon ✦': { id: 'sd_tanzpavillon', price: 450, rare: true, beauty: 28, cost: 2500, mat: {'bretter': 8} },
  'Lagerfeuer': { id: 'sd_lagerfeuer', price: 110, rare: false, beauty: 5, cost: 100 },
  'Hängematte': { id: 'sd_haengematte', price: 130, rare: false, beauty: 6, cost: 150 },
  'Picknickdecke': { id: 'sd_picknick', price: 90, rare: false, beauty: 4, cost: 80 },
  'Briefkasten': { id: 'sd_briefkasten', price: 80, rare: false, beauty: 3, cost: 60 },
  'Fossil ✦': { id: 'sd_fossil', price: 350, rare: true, beauty: 12, cost: 500, mat: {'quader': 4} },
  'Strandkorb': { id: 'sd_strandkorb', price: 110, rare: false, beauty: 5, cost: 120 },
  'Vogelscheuche': { id: 'sd_vogelscheuche', price: 90, rare: false, beauty: 4, cost: 80 },
  'Wäscheleine': { id: 'sd_waescheleine', price: 80, rare: false, beauty: 3, cost: 60 },
  'Glockenbaum': { id: 'sd_glockenbaum', price: 150, rare: false, beauty: 6, cost: 150 },
  'Teleskop': { id: 'sd_teleskop', price: 120, rare: false, beauty: 4, cost: 150, mat: {'metall': 1} },
  'Kanu': { id: 'sd_kanu', price: 100, rare: false, beauty: 4, cost: 100 },
  'Gartenwichtel': { id: 'sd_wichtel', price: 90, rare: false, beauty: 3, cost: 60 },
  'Hühnerhaus ✦': { id: 'sd_huehnerhaus', price: 350, rare: true, beauty: 20, cost: 1200, mat: {'bretter': 6} },
};
for (const [list, smlg] of [[SD_WAREN.EISZAUBER, 'Eiszauber'], [SD_WAREN.TURM, 'Turm & Himmelslaternen'], [SD_WAREN.MAERCHEN, 'Prinzessinnen & Märchen'], [SD_WAREN.INSEL, 'Inselleben']])
  for (const [label, fn, tile] of list) {
    const m = SD_WAREN_META[label], name = label.replace(' ✦', '');
    ITEMS[m.id] = { cat: 'deko', name, sdShop: true, cost: m.cost, ...(m.mat ? { mat: m.mat } : {}), beauty: m.beauty, ...(tile ? { needs: 'grass' } : { small: true }), sammlung: smlg, desc: `Aus der Sammlung „${smlg}“ im Sternenbasar.` };
    SD_ART[m.id] = fn;
    SD_SHOP.push({ id: m.id, price: m.price, ...(m.rare ? { rare: true } : {}) });
    if (!ITEM_TIPS[m.id]) ITEM_TIPS[m.id] = tile ? 'Aus dem Sternenbasar ✨, braucht ein ganzes Feld Wiese.' : 'Aus dem Sternenbasar ✨. Kleine Deko für eine Ecke, bis zu 4 pro Feld.';
  }
// bewegt (Basar-Durchsicht 27./28.10.2026): Himmelslaternen wiegen sich, Kanu schaukelt, auf dem Teich fahren Bewohner Schlittschuh;
// in der Reihenfolge von ITEMS (tests/tempo-schritt3.test.js vergleicht die Liste)
{ // bewegte Basar-Stücke live zeichnen; ANIM_ITEMS bleibt in der Reihenfolge von ITEMS (tests/tempo-schritt3.test.js)
  const all = new Set([...ANIM_ITEMS, 'sd_pfau', 'sd_koiteich', 'sd_sternbrunnen', 'sd_eisteich', 'sd_himmelslaternen', 'sd_kanu', 'sd_schneekugel', 'sd_eispalast', 'sd_flockenbrunnen', 'sd_laternenboot', 'sd_sonnenpavillon', 'sd_froschbrunnen', 'sd_gluehglas', 'sd_zauberspiegel', 'sd_einhorn']);
  ANIM_ITEMS.clear();
  for (const id of Object.keys(ITEMS)) if (all.delete(id)) ANIM_ITEMS.add(id);
  for (const id of all) ANIM_ITEMS.add(id);
}
ITEMS.sd_kanu.water = true;                                          // Kanu nur aufs Wasser (smallError), schaukelt
ITEMS.sd_kanu.desc = 'Aus der Sammlung „Inselleben“ im Sternenbasar. Schwimmt: Stell es aufs Wasser.';
ITEM_TIPS.sd_kanu = 'Aus dem Sternenbasar ✨. Schwimmt: nur aufs Wasser, bis zu 4 pro Feld.';
// Durchgänge (sdArch, archRot): mitten auf ein gerades Wegstück, quer zum Weg; am Feldrand längs der Kante; auf der Wiese drehbar
for (const id of ['sd_lampions', 'sd_flockenbogen', 'sd_rankentor']) {
  ITEMS[id].arch = true; ROTATABLE.add(id);
  ITEM_TIPS[id] = 'Aus dem Sternenbasar ✨. Ein Durchgang: Stell ihn auf ein gerades Wegstück, dann stellt er sich quer und alle laufen hindurch. Am Feldrand steht er längs der Kante, auf der Wiese drehst du ihn mit ⟳.';
}
// Beet aus dem Basar (Basar-Durchsicht 28.10.2026: „ein ganzes Feld voll, ohne Unterbrechung, wie ein Beet“): Wer das Stück hat, findet
// unter Beete die gleichnamige Form (DECO_LOOKS.blumen, `sd`), gleiche Beete nebeneinander wachsen zusammen (drawStarBed)
for (const [id, name] of [['sd_nachtblumen', 'Nachtblumen'], ['sd_eisblumen', 'Eisblumen']]) ITEM_TIPS[id] = `Aus dem Sternenbasar ✨. Ein Büschel für eine Ecke. Unter Beete gibt es jetzt auch das ${name}-Beet: ein ganzes Feld voll, nebeneinander ohne Lücke.`;                               // schwebende Laternen wiegen sich (Basar-Durchsicht 27.10.2026)
