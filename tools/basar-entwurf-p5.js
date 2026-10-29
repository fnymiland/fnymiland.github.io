// Entwürfe Paket 5 Eiszauber (Basar-Durchsicht 28.10.2026): Schneemann (Schal/Details), Schlitten (mehr 3D), Rentier, Iglu (mehr 3D),
// Eisbank („nicht als Bank erkennbar“), Schneekugel (schöner, innen beweglich), Eispalast-Pavillon („kein Pavillon“), Schneeflocken-Brunnen
// (Details, Bewegung). Form wie SD_ART plus now. Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p5.js')).text())
(() => {
  const TAU = Math.PI * 2;
  const ICE = '#bfe6f7', ICE_D = '#8cc7e6', ICE_L = '#eaf8ff', SNOW = '#fbfdff', SNOW_S = '#dfeaf2';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
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

  // ── Iglu ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const iglu = (cx, cy, z, now) => {
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

  // ── Eisbank ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  const eisbank = (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, BL = 0.2;
    snowPile(cx, cy, 10, z);
    const iceBox = (a0, a1, b0, b1, h0, h1) => { box3(K, a0, a1, b0, b1, h0, h1, C('#eef9ff'), C('#a6d7ef'), C('#c6eaf9'));
      sdLine('rgba(255,255,255,0.85)', 0.3, z, [P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)]);
      sdLine('rgba(255,255,255,0.5)', 0.25, z, [P(a1, b0 + (b1 - b0) * 0.3, h0 + (h1 - h0) * 0.2), P(a1, b0 + (b1 - b0) * 0.55, h1 - (h1 - h0) * 0.2)]); };
    iceBox(-0.1, -0.06, -BL, BL, 4.6, 12);                                                                // Lehne
    const sp = []; for (let i = 0; i <= 8; i++) { const b = -BL + i * BL / 4; sp.push(P(-0.08, b, 12 + (i % 2 ? 1.1 : 0.6))); }   // Schnee obendrauf
    poly([P(-0.11, -BL - 0.01, 11.8), ...sp, P(-0.05, BL + 0.01, 11.8)], C(SNOW));
    sdLine('rgba(255,255,255,0.8)', 0.3, z, [P(-0.06, -0.06, 7), P(-0.06, 0.06, 10)]); bigFlake(...P(-0.06, 0, 8.4), 2.2 * z, 0, z, 'rgba(255,255,255,0.8)', 0.25);
    for (const b of [-0.15, 0.11]) iceBox(-0.05, 0.05, b, b + 0.04, 0, 3.6);                               // Füße
    iceBox(-0.06, 0.07, -BL, BL, 3.6, 4.8);                                                               // Sitz
    for (const b of [-BL, BL - 0.035]) iceBox(-0.06, 0.06, b, b + 0.035, 4.8, 7.6);                        // Armlehnen
    for (const b of [-BL, BL - 0.035]) { const p = P(0, b + 0.018, 7.6); ellipse(p[0], p[1], 1.6 * z, 0.7 * z, C(SNOW)); }
    const c0 = P(-0.05, -0.16, 4.8), c1 = P(0.06, -0.16, 4.8), c2 = P(0.06, 0.16, 4.8), c3 = P(-0.05, 0.16, 4.8);   // Fell-Decke auf dem Sitz
    poly([c0, c1, [c1[0], c1[1] + 1.4 * z], [c2[0], c2[1] + 1.4 * z], c2, c3].map(([x, y]) => [x, y - 0.6 * z]), C('#f6f1ea'));
    for (let k = 0; k < 6; k++) { const p = P(0.066, -0.13 + k * 0.052, 4.2); poly([[p[0], p[1] - 0.7 * z], [p[0] + 0.7 * z, p[1]], [p[0], p[1] + 0.7 * z], [p[0] - 0.7 * z, p[1]]], C(k % 2 ? '#d9534a' : '#3f6fb0')); }   // Muster auf der Decke
    for (let k = 0; k < 7; k++) { const p = P(0.07, -0.15 + k * 0.05, 3.6); poly([[p[0] - 0.4 * z, p[1]], [p[0] + 0.4 * z, p[1]], [p[0], p[1] + (1 + (k % 3) * 0.6) * z]], C('#d7f0fb')); }   // Eiszapfen
  };

  // Eisbank schlicht (Nutzer 28.10.2026 „too much“): nur Lehne, Sitz, zwei Füße, etwas Schnee
  const eisbankS = (round, H1 = 11) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, BL = 0.21;
    snowPile(cx, cy, 10, z);
    const iceBox = (a0, a1, b0, b1, h0, h1) => { box3(K, a0, a1, b0, b1, h0, h1, C('#eef9ff'), C('#a6d7ef'), C('#c6eaf9'));
      sdLine('rgba(255,255,255,0.85)', 0.3, z, [P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)]); };
    const A0 = -0.08, A1 = -0.045, H0 = 3.4;
    if (round) {                                                                                          // Lehne mit rundem Rücken
      const top = b => H1 + 2.4 * Math.sqrt(Math.max(0, 1 - (b / BL) ** 2)), bs = Array.from({ length: 17 }, (_, i) => -BL + i / 16 * 2 * BL);
      poly([P(A1, -BL, H0), P(A1, BL, H0), ...bs.slice().reverse().map(b => P(A1, b, top(b)))], C('#c6eaf9'));
      poly([P(A0, BL, H0), P(A1, BL, H0), P(A1, BL, top(BL)), P(A0, BL, top(BL))], C('#a6d7ef'));
      poly([...bs.map(b => P(A0, b, top(b))), ...bs.slice().reverse().map(b => P(A1, b, top(b)))], C('#eef9ff'));
      poly([...bs.map(b => P((A0 + A1) / 2, b, top(b) + 0.2)), ...bs.slice(2, 15).reverse().map(b => P((A0 + A1) / 2, b, top(b) + 1.1))], C(SNOW));
    } else {
      iceBox(A0, A1, -BL, BL, H0, H1);
      const sp = []; for (let i = 0; i <= 8; i++) { const b = -BL + i * BL / 4; sp.push(P((A0 + A1) / 2, b, H1 + (i % 2 ? 1 : 0.6))); }
      poly([P(A0 - 0.004, -BL - 0.008, H1 - 0.2), ...sp, P(A1 + 0.004, BL + 0.008, H1 - 0.2)], C(SNOW));
    }
    sdLine('rgba(255,255,255,0.6)', 0.3, z, [P(A1, -0.1, H0 + 1.8), P(A1, -0.06, H1 - 1.2)]);
    for (const b of [-0.16, 0.12]) iceBox(-0.035, 0.055, b, b + 0.04, 0, H0);                              // Füße
    iceBox(-0.045, 0.07, -BL, BL, H0, H0 + 1.2);                                                          // Sitz
    const s = P(0.01, -0.15, H0 + 1.2); ellipse(s[0], s[1], 2.2 * z, 0.9 * z, C(SNOW)); ellipse(s[0] + 0.6 * z, s[1] - 0.3 * z, 1.2 * z, 0.5 * z, '#ffffff');
  };
  // ── Schneekugel ───────────────────────────────────────────────────────────────────────────────────────────────────────
  const globe = (cx, cy, z, now, scene, swirl) => {
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
    scene(gx, gy, z, now, lit);
    for (let k = 0; k < 16; k++) { let x, y;
      if (swirl) { const a = now / 1400 + k * 0.39, rr = (2 + (k % 5) * 1.2) * z; x = gx + Math.cos(a) * rr; y = gy - 1 * z + Math.sin(a) * rr * 0.45 - ((now / 2600 + k * 0.17) % 1) * 4 * z + 2 * z; }
      else { const p = (now / 5200 + k * 0.137) % 1; x = gx + (((k * 37) % 15) - 7) * z + Math.sin(now / 700 + k) * 0.6 * z; y = gy - R + p * 2 * R; }
      circle(x, y, (0.35 + (k % 3) * 0.12) * z, '#ffffff'); }
    g.restore();
    g.beginPath(); g.arc(gx, gy, R, 0, TAU); g.fillStyle = 'rgba(200,232,250,0.12)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(0.5, 0.35 * z); g.stroke();
    g.beginPath(); g.ellipse(gx - 3.2 * z, gy - 3.6 * z, 1.4 * z, 3 * z, 0.6, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
    g.beginPath(); g.arc(gx, gy, R - 0.9 * z, 0.2, 1.2); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.4 * z; g.stroke();
    if (lit) glowAt(gx, gy + 1 * z, 14 * z, z);
  };
  const tree = (x, y, s, z) => { for (let k = 0; k < 3; k++) poly([[x - (2.2 - k * 0.5) * s * z, y - k * 1.5 * s * z], [x + (2.2 - k * 0.5) * s * z, y - k * 1.5 * s * z], [x, y - (k * 1.5 + 2.4) * s * z]], C(k % 2 ? '#3f8a52' : '#2f7a47'));
    for (let k = 0; k < 3; k++) sdLine('#ffffff', 0.35 * s, z, [[x - (1.6 - k * 0.5) * s * z, y - (k * 1.5 + 0.3) * s * z], [x - 0.2 * z, y - (k * 1.5 + 1.2) * s * z]]); };
  const sceneHaus = (gx, gy, z, now, lit) => {
    const x = gx - 1 * z, y = gy + 4 * z;
    poly([[x - 2.6 * z, y], [x + 2.6 * z, y], [x + 2.6 * z, y - 3.4 * z], [x - 2.6 * z, y - 3.4 * z]], C('#d9534a'));
    poly([[x + 0.8 * z, y], [x + 2.6 * z, y], [x + 2.6 * z, y - 3.4 * z], [x + 0.8 * z, y - 3.4 * z]], C('#b8433a'));
    poly([[x - 3.4 * z, y - 3.2 * z], [x + 3.4 * z, y - 3.2 * z], [x, y - 6.4 * z]], C('#ffffff')); poly([[x - 3.4 * z, y - 3.2 * z], [x - 2.8 * z, y - 3.8 * z], [x, y - 6.4 * z], [x, y - 5.6 * z]], C('#e6eef4'));
    poly([[x - 1.6 * z, y - 1.2 * z], [x - 0.4 * z, y - 1.2 * z], [x - 0.4 * z, y - 2.4 * z], [x - 1.6 * z, y - 2.4 * z]], lit ? '#ffd27a' : C('#ffe9b8'));
    poly([[x + 1.1 * z, y], [x + 2 * z, y], [x + 2 * z, y - 2 * z], [x + 1.1 * z, y - 2 * z]], C('#6b4a2e'));
    tree(gx + 4.2 * z, gy + 4.4 * z, 1.1, z); tree(gx - 5 * z, gy + 4 * z, 0.7, z);
  };
  const sceneSchloss = (gx, gy, z, now, lit) => {
    const y = gy + 4 * z;
    poly([[gx - 4 * z, y], [gx + 4 * z, y], [gx + 4 * z, y - 3.6 * z], [gx - 4 * z, y - 3.6 * z]], C('#d6ecf8'));
    for (const [dx, h, w] of [[-3.4, 6.6, 1.2], [3.4, 6.6, 1.2], [0, 8.6, 1.5]]) { const x = gx + dx * z;
      poly([[x - w * z, y], [x + w * z, y], [x + w * z, y - h * z], [x - w * z, y - h * z]], C('#e8f6fd'));
      poly([[x - (w + 0.4) * z, y - h * z], [x + (w + 0.4) * z, y - h * z], [x, y - (h + 3) * z]], C('#7fb2e0'));
      poly([[x - 0.4 * z, y - (h - 2.2) * z], [x + 0.4 * z, y - (h - 2.2) * z], [x + 0.4 * z, y - (h - 3.4) * z], [x - 0.4 * z, y - (h - 3.4) * z]], lit ? '#ffd27a' : C('#9fc8e6')); }
    g.beginPath(); g.arc(gx, y, 1.3 * z, Math.PI, 0); g.fillStyle = C('#7fa8c8'); g.fill();
    const t = now / 1600, sx = gx + Math.cos(t) * 5 * z, sy = gy + 5.6 * z + Math.sin(t) * 1 * z;        // Eisläufer-Figürchen dreht Runden
    if (Math.sin(t) > -0.2) { circle(sx, sy - 2.4 * z, 0.6 * z, C('#ffd2b0')); poly([[sx - 0.6 * z, sy - 1.8 * z], [sx + 0.6 * z, sy - 1.8 * z], [sx + 0.9 * z, sy], [sx - 0.9 * z, sy]], C('#e86f8f')); }
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
  const pavillon = (cx, cy, z, now, roofKind) => {
    const lit = sdLit(), Rc = 12.5, Hc = 19, n = 5;
    snowPile(cx, cy + 1 * z, 23, z);
    disc(cx, cy + 1 * z, 19, 2, z, '#eef8fd', '#bcdcee'); disc(cx, cy - 1 * z, 15.5, 1.8, z, '#f6fcff', '#cde7f4');
    const base = cy - 2.8 * z, top = base - Hc * z;
    const cols = Array.from({ length: n }, (_, k) => { const t = k / n * TAU + Math.PI / 2; return { t, x: cx + Math.cos(t) * Rc * z, y: base + Math.sin(t) * Rc / 2 * z }; });
    const arches = (front) => { if (roofKind !== 'spitz') return; for (let k = 0; k < n; k++) { const p = cols[k], q = cols[(k + 1) % n], mt = (p.t + q.t) / 2 + (k === n - 1 ? Math.PI : 0);
      if ((Math.sin(mt) > 0) !== front) continue; const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - Hc * z;
      g.strokeStyle = 'rgba(235,250,255,0.95)'; g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(p.x, p.y - (Hc - 5) * z); g.quadraticCurveTo(p.x + (mx - p.x) * 0.4, my + 0.5 * z, mx, my + 1.5 * z);
      g.quadraticCurveTo(q.x + (mx - q.x) * 0.4, my + 0.5 * z, q.x, q.y - (Hc - 5) * z); g.stroke(); } };
    cols.filter(c => Math.sin(c.t) < 0).forEach(c => column(c.x, c.y, Hc, z, lit)); arches(false);
    const ch = [cx, top + 10 * z];                                                                         // Kristall-Leuchter
    sdLine('rgba(220,240,255,0.9)', 0.25, z, [[cx, top - 1 * z], ch]);
    for (const [dx, dy, r] of [[0, 0, 1.4], [-1.6, 1, 0.9], [1.6, 1, 0.9], [0, 2.4, 1]]) poly([[ch[0] + dx * z, ch[1] + (dy - r) * z], [ch[0] + (dx + r * 0.6) * z, ch[1] + dy * z], [ch[0] + dx * z, ch[1] + (dy + r * 1.4) * z], [ch[0] + (dx - r * 0.6) * z, ch[1] + dy * z]], lit ? '#fff3c4' : C('#d8f2ff'));
    if (lit) glowAt(ch[0], ch[1] + 1 * z, 26 * z, z);
    cols.filter(c => Math.sin(c.t) >= 0).forEach(c => column(c.x, c.y, Hc, z, lit)); arches(true);
    const er = Rc + 3;                                                                                    // Traufring mit Eiszapfen
    g.beginPath(); g.ellipse(cx, top, er * z, er / 2 * z, 0, 0, Math.PI); g.lineTo(cx - er * z, top - 1.6 * z); g.ellipse(cx, top - 1.6 * z, er * z, er / 2 * z, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = C('#d6eef9'); g.fill();
    ellipse(cx, top - 1.6 * z, er * z, er / 2 * z, C(ICE_L));
    icicles(cx, top, er, z, 16);
    const rt = top - 1.6 * z;
    if (roofKind === 'spitz') {                                                                           // B: Kristalldach aus sechs Flächen
      const ap = [cx, rt - 17 * z], rp = Array.from({ length: n }, (_, k) => { const t = k / n * TAU + Math.PI / 2; return [cx + Math.cos(t) * er * z, rt + Math.sin(t) * er / 2 * z, t]; });
      for (let k = 0; k < n; k++) { const p = rp[k], q = rp[(k + 1) % n], mt = p[2] + Math.PI / n; if (Math.sin(mt) < -0.1) continue;
        poly([p, q, ap], C(Math.cos(mt) > 0.3 ? '#a6d4ee' : Math.cos(mt) < -0.3 ? '#e2f5fd' : '#c4e6f6')); sdLine('rgba(255,255,255,0.9)', 0.3, z, [p, ap]); }
    } else {                                                                                              // A: Zwiebelkuppel mit Rippen
      const w = er * 0.78 * z, gr = g.createLinearGradient(cx - w, 0, cx + w, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, C('#d3eefb')); gr.addColorStop(1, C('#94c9e6'));
      g.beginPath(); g.moveTo(cx - w, rt); g.bezierCurveTo(cx - w * 1.15, rt - 9 * z, cx - w * 0.2, rt - 12 * z, cx, rt - 19 * z); g.bezierCurveTo(cx + w * 0.2, rt - 12 * z, cx + w * 1.15, rt - 9 * z, cx + w, rt);
      g.ellipse(cx, rt, w, w / 2, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
      for (const f of [-0.55, 0, 0.55]) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.35 * z; g.beginPath(); g.moveTo(cx + f * w, rt + Math.sqrt(1 - f * f) * w / 2);
        g.bezierCurveTo(cx + f * w * 1.25, rt - 9 * z, cx + f * w * 0.3, rt - 12 * z, cx, rt - 19 * z); g.stroke(); }
    }
    const fy = rt - (roofKind === 'spitz' ? 21 : 23) * z;
    sdLine(ICE_L, 0.6, z, [[cx, fy + 4 * z], [cx, fy + 1.5 * z]]);
    bigFlake(cx, fy, 3.4 * z, now / 2600, z, lit ? '#ffffff' : C('#ffffff'), 0.4);
    if (lit) glowAt(cx, fy, 18 * z, z);
    for (let k = 0; k < 4; k++) { const p = (now / 1500 + k * 0.27) % 1, s = Math.sin(p * Math.PI) * 1.2, a = k * 1.7;
      if (s > 0.15) twinkle(cx + Math.cos(a) * 15 * z, top - 6 * z + Math.sin(a) * 9 * z, s, z, 'rgba(255,255,255,0.95)'); }
  };

  // ── Schneeflocken-Brunnen ─────────────────────────────────────────────────────────────────────────────────────────────
  const crystal = (x, y, w, h, z, lit) => { const L = lit ? 'rgba(235,250,255,0.95)' : C('#d8f2fc'), D = lit ? 'rgba(170,215,240,0.95)' : C('#9fd0ea');
    poly([[x - w * z, y], [x, y + w * 0.4 * z], [x, y - h * z], [x - w * z, y - (h - w * 0.6) * z]], L);
    poly([[x, y + w * 0.4 * z], [x + w * z, y], [x + w * z, y - (h - w * 0.6) * z], [x, y - h * z]], D);
    poly([[x - w * z, y - (h - w * 0.6) * z], [x, y - h * z], [x + w * z, y - (h - w * 0.6) * z], [x, y - (h + w * 1.2) * z]], lit ? '#ffffff' : C('#f2fbff'));
    sdLine('rgba(255,255,255,0.8)', 0.25, z, [[x - w * 0.5 * z, y - 1 * z], [x - w * 0.5 * z, y - (h - 2) * z]]); };
  const frostRim = (cx, ry, R, z) => { for (let k = 0; k < 22; k++) { const t = k / 22 * TAU, x = cx + Math.cos(t) * R * z, y = ry + Math.sin(t) * R / 2 * z; ellipse(x, y - 0.4 * z, (1.6 + (k % 3) * 0.4) * z, 0.8 * z, C(SNOW)); } };
  const water = (cx, wy, R, z, lit) => { const gr = g.createRadialGradient(cx, wy, 1 * z, cx, wy, R * z);
    gr.addColorStop(0, lit ? '#b8f0fa' : C('#a8e2f2')); gr.addColorStop(1, lit ? '#5fb4d6' : C('#5fb2d6')); g.beginPath(); g.ellipse(cx, wy, R * z, R / 2 * z, 0, 0, TAU); g.fillStyle = gr; g.fill(); };
  const floes = (cx, wy, R, z, now) => { for (let k = 0; k < 4; k++) { const t = now / 6000 + k * 1.57, rr = (R - 4 - (k % 2) * 3), x = cx + Math.cos(t) * rr * z, y = wy + Math.sin(t) * rr / 2 * z, a = t * 0.5 + k;
    poly([0, 1, 2, 3, 4].map(i => { const b = a + i * TAU / 5, r = (1.2 + ((i + k) % 3) * 0.4) * z; return [x + Math.cos(b) * r, y + Math.sin(b) * r * 0.5]; }), C('#f4fbff')); } };
  const ripples = (x, y, R, z, now) => { for (let k = 0; k < 3; k++) { const p = (now / 1500 + k / 3) % 1;
    g.beginPath(); g.ellipse(x, y, (3 + p * R) * z, (1.5 + p * R / 2) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - p)})`; g.lineWidth = 0.3 * z; g.stroke(); } };
  const jetArc = (sx, sy, ex, ey, kx, ky, z, now, ph) => { g.strokeStyle = 'rgba(210,244,252,0.8)'; g.lineWidth = 0.7 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(kx, ky, ex, ey); g.stroke();
    for (let d = 0; d < 3; d++) { const p = (now / 700 + d / 3 + ph) % 1, q = 1 - p; circle(q * q * sx + 2 * p * q * kx + p * p * ex, q * q * sy + 2 * p * q * ky + p * p * ey, 0.42 * z, '#ffffff'); } };
  const snowRise = (cx, cy, z, now, lit) => { for (let k = 0; k < 6; k++) { const p = (now / 3000 + k * 0.19) % 1, x = cx + (((k * 29) % 13) - 6.5) * 1.8 * z + Math.sin(now / 800 + k) * 1 * z, y = cy - p * 26 * z;
    circle(x, y, (0.4 + (k % 2) * 0.2) * z, `rgba(255,255,255,${0.9 * Math.sin(p * Math.PI)})`); } };
  const brunnenA = (cx, cy, z, now) => {                                                              // rundes Becken, Eisrand, Kristalle, Flocke dreht sich
    const lit = sdLit(), R = 18, H = 3.6, top = cy - H * z;
    snowPile(cx, cy + 1.5 * z, 23, z);
    disc(cx, cy, R, H, z, '#eef8fd', '#b4d6ea');
    icicles(cx, cy - H * z + 0.2 * z, R, z, 18);
    frostRim(cx, top, R - 0.6, z);
    water(cx, top + 0.5 * z, R - 2.4, z, lit);
    floes(cx, top + 0.5 * z, R - 2.4, z, now); ripples(cx, top + 0.6 * z, 10, z, now);
    for (let k = 0; k < 4; k++) { const a = Math.PI * (1.1 + k * 0.27); const ex = cx + Math.cos(a) * 11 * z, ey = top + 0.5 * z + Math.sin(a) * 5.5 * z; jetArc(cx, top - 9 * z, ex, ey, (cx + ex) / 2, top - 15 * z, z, now, k * 0.25); }
    for (const [dx, dy, w, h] of [[-3, 0.6, 1.6, 9], [2.6, 0.2, 1.4, 7], [0, 1.4, 2, 12.5], [-1.4, 2.4, 1.2, 5], [3.4, 2, 1.1, 4.4]]) crystal(cx + dx * z, top + dy * z, w, h, z, lit);
    for (let k = 0; k < 4; k++) { const a = Math.PI * (0.1 + k * 0.27); const ex = cx + Math.cos(a) * 11 * z, ey = top + 0.5 * z + Math.sin(a) * 5.5 * z; jetArc(cx, top - 9 * z, ex, ey, (cx + ex) / 2, top - 15 * z, z, now, k * 0.25 + 0.1); }
    const F = [cx, top - 21 * z];
    sdLine(ICE_L, 0.7, z, [[cx, top - 13 * z], [cx, F[1] + 6 * z]]);
    bigFlake(F[0], F[1], 6.4 * z, now / 3200, z, lit ? '#ffffff' : C('#a8dcf2'), 0.7);
    bigFlake(F[0], F[1], 6.4 * z, now / 3200, z, 'rgba(255,255,255,0.7)', 0.3);
    if (lit) glowAt(F[0], F[1], 26 * z, z);
    snowRise(cx, top, z, now, lit);
  };
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

  window.ENTW_P5 = {
    'Schneemann: Schal um den Hals, Mütze mit Stechpalme': schneemann,
    'Schlitten: räumlich, Kufen mit Schnecken': schlitten,
    'Rentier: Halsband mit Glöckchen': rentier,
    'Iglu: Kuppel aus Blöcken, Eingangsröhre': iglu,
    'Eisbank: Lehne, Armlehnen, Felldecke': eisbank,
    'Eisbank A: ganz schlicht': eisbankS(false),
    'Eisbank B: schlicht, runde Lehne': eisbankS(true),
    'Eisbank A2: Lehne etwas niedriger': eisbankS(false, 8.5),
    'Eisbank A3: Lehne noch niedriger': eisbankS(false, 7.5),
    'Schneekugel A: Häuschen, Schnee rieselt': (cx, cy, z, now) => globe(cx, cy, z, now, sceneHaus, false),
    'Schneekugel B: Eisschloss, Schnee wirbelt': (cx, cy, z, now) => globe(cx, cy, z, now, sceneSchloss, true),
    'Eispalast-Pavillon A: Zwiebelkuppel': (cx, cy, z, now) => pavillon(cx, cy, z, now, 'zwiebel'),
    'Eispalast-Pavillon B: Kristalldach, Bögen': (cx, cy, z, now) => pavillon(cx, cy, z, now, 'spitz'),
    'Schneeflocken-Brunnen A: Kristalle, Bögen': brunnenA,
    'Schneeflocken-Brunnen B: drei Schalen': brunnenB,
  };
})();
