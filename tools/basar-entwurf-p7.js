// Entwürfe Paket 7 Märchen, erste Hälfte (Basar-Durchsicht 31.10.2026): Blumenkranz-Bank („nicht als Bank erkennbar“), Glühwürmchen-Glas,
// Sonnenpavillon („Details“), Glasschuh („Schuh nicht erkennbar“), Froschkönig-Brunnen („Details, Bewegung“). Form wie SD_ART plus now.
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p7.js')).text())
(() => {
  const TAU = Math.PI * 2, GOLD = '#f5c84b', GOLD_D = '#c9962a', PINK = '#ff9ec0', ROSE = '#e8546f', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const box3 = (K, a0, a1, b0, b1, h0, h1, top, fa, fb) => { const P = K.P;
    poly([P(a1, b0, h0), P(a1, b1, h0), P(a1, b1, h1), P(a1, b0, h1)], fa);
    poly([P(a0, b1, h0), P(a1, b1, h0), P(a1, b1, h1), P(a0, b1, h1)], fb);
    poly([P(a0, b0, h1), P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)], top); };
  // runde Körper (Bildschirm, Ellipsen 2:1): Seitenband zwischen zwei vorderen Halbbögen
  const band = (cx, y0, r0, y1, r1) => { g.beginPath(); g.ellipse(cx, y0, r0, r0 / 2, 0, Math.PI, 0, true); g.ellipse(cx, y1, r1, r1 / 2, 0, 0, Math.PI); g.closePath(); };
  const cyl = (cx, cy, r0, r1, h0, h1, z, light, mid, dark, top) => {
    const gr = g.createLinearGradient(cx - r0 * z, 0, cx + r0 * z, 0); gr.addColorStop(0, C(light)); gr.addColorStop(0.45, C(mid)); gr.addColorStop(1, C(dark));
    band(cx, cy - h0 * z, r0 * z, cy - h1 * z, r1 * z); g.fillStyle = gr; g.fill();
    if (top) ellipse(cx, cy - h1 * z, r1 * z, r1 / 2 * z, C(top));
  };
  const halfArc = (cx, y, r, t0 = 0, t1 = Math.PI) => { g.moveTo(cx + r * Math.cos(t0), y + r / 2 * Math.sin(t0)); g.ellipse(cx, y, r, r / 2, 0, t0, t1); };
  const leafy = (pts, z, r = 1.1) => { for (const [k, p] of pts.entries()) circle(p[0] + (k % 2 ? 0.4 : -0.4) * z, p[1], r * z, C(k % 3 ? '#6fb04a' : '#559a3e')); };

  // ── Blumenkranz-Bank ──────────────────────────────────────────────────────────────────────────────────────────────────
  // Gartenbank aus Holz (kit): Latten-Sitz, Lehne mit zwei Querlatten, Armlehnen; A: Blumengirlande über der Lehne, B: runder Kranz an der Lehne
  const kranzbank = (mode) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, BL = 0.19;
    sdShadow(cx, cy, 10, z);
    const wood = (a0, a1, b0, b1, h0, h1) => box3(K, a0, a1, b0, b1, h0, h1, C('#e0b47a'), C('#a8743f'), C('#c58f55'));
    for (const b of [-BL + 0.005, BL - 0.03]) { wood(-0.075, -0.055, b, b + 0.025, 0, 12.5); wood(0.045, 0.065, b, b + 0.025, 0, 4); }   // Beine (hinten bis zur Lehne)
    for (const h of [7, 9.9]) wood(-0.072, -0.058, -BL, BL, h, h + 1.6);                                          // Lehne: zwei Querlatten
    for (const [a0, a1] of [[-0.05, -0.02], [-0.012, 0.018], [0.026, 0.058]]) wood(a0, a1, -BL - 0.01, BL + 0.01, 4, 4.9);   // Sitz: drei Latten
    for (const b of [-BL - 0.012, BL - 0.012]) { wood(-0.07, 0.07, b, b + 0.03, 7.4, 8.2); wood(0.05, 0.068, b + 0.002, b + 0.028, 4.9, 7.4); }   // Armlehnen
    if (mode === 'girlande') {
      const top = Array.from({ length: 15 }, (_, i) => { const b = -BL - 0.01 + i / 14 * (2 * BL + 0.02); return P(-0.065, b, 12.9 + Math.sin(i / 14 * Math.PI) * 0.8); });
      leafy(top, z, 1.15);
      top.forEach((p, i) => { if (i % 2 === 0) rose(p[0], p[1] - 0.5 * z, 0.95 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][i / 2 % 5]); });
      const swag = Array.from({ length: 13 }, (_, i) => { const u = i / 12, b = -BL + u * 2 * BL; return P(-0.05, b, 12.2 - Math.sin(u * Math.PI) * 3.2); });   // durchhängende Girlande vor der Lehne
      leafy(swag, z, 0.85); swag.forEach((p, i) => { if (i % 3 === 1) rose(p[0], p[1], 0.75 * z, [ROSE, '#ffffff', PINK][i % 3]); });
      for (const b of [-BL, BL - 0.01]) { const p = P(0, b + 0.012, 8.4); for (let k = 0; k < 4; k++) circle(p[0] + (k - 1.5) * 0.9 * z, p[1] - (k % 2) * 0.4 * z, 0.8 * z, C(k % 2 ? '#6fb04a' : '#559a3e')); rose(p[0], p[1] - 0.6 * z, 0.8 * z, PINK); }
    } else {
      const m = P(-0.05, 0, 10.2), R = 3.3 * z;                                                                     // runder Kranz in der Mitte der Lehne
      for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; circle(m[0] + Math.cos(a) * R, m[1] + Math.sin(a) * R * 0.95, 1 * z, C(k % 3 ? '#6fb04a' : '#559a3e')); }
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + 0.3; rose(m[0] + Math.cos(a) * R, m[1] + Math.sin(a) * R * 0.95, 0.85 * z, [PINK, '#ffffff', LILA, '#ffd23f'][k % 4]); }
      for (const s of [-1, 1]) poly([[m[0], m[1] + R], [m[0] + s * 1.2 * z, m[1] + R + 2.6 * z], [m[0] + s * 0.3 * z, m[1] + R + 2.2 * z]], C(ROSE));   // Schleife unten
      circle(m[0], m[1] + R, 0.5 * z, C('#c93a58'));
      for (const b of [-BL - 0.07, BL + 0.07]) { const p = P(0.02, b, 0);                                           // Blumentöpfe an beiden Enden
        poly([[p[0] - 1.8 * z, p[1]], [p[0] + 1.8 * z, p[1]], [p[0] + 2.3 * z, p[1] - 3.4 * z], [p[0] - 2.3 * z, p[1] - 3.4 * z]], C('#c4693f')); ellipse(p[0], p[1] - 3.4 * z, 2.3 * z, 0.8 * z, C('#a8552f'));
        for (const [dx, dy] of [[-1.2, -4.6], [1, -4.9], [0, -5.8], [-0.2, -4.2]]) circle(p[0] + dx * z, p[1] + dy * z, 1.1 * z, C('#6fb04a'));
        for (const [dx, dy, c] of [[-1, -5.4, PINK], [1.1, -5.6, '#ffd23f'], [0.1, -6.6, LILA]]) rose(p[0] + dx * z, p[1] + dy * z, 0.8 * z, c); }
    }
  };

  // Bank C (Nutzer 31.10.2026: „nimm doch die Standardbank, mach sie Holz und knall da Blüten drüber“): Parkbank aus dem Bank-Menü (drawBench,
  // Form park, Farbe Holz) in halber Größe, Blütengirlande über der Lehne, eine zweite hängt davor durch, ein paar Blüten auf dem Sitz
  const kranzbankC = (cx, cy, z, deko) => {
    const s = 0.5, zz = z * s, K = kit(cx, cy, zz, 0), P = K.P;
    drawBench(cx, cy, zz, { b: 'bank', col: 0, form: 0, rot: 0 }, TW / 2 * zz, TH / 2 * zz);
    const top = Array.from({ length: 17 }, (_, i) => { const b = -0.49 + i / 16 * 0.98; return P(-0.1, b, 12 + Math.sin(i / 16 * Math.PI) * 1.2); });
    for (const [k, p] of top.entries()) circle(p[0] + (k % 2 ? 0.3 : -0.3) * z, p[1], 0.85 * z, C(k % 3 ? '#6fb04a' : '#559a3e'));
    top.forEach((p, i) => { if (i % 2 === 0) rose(p[0], p[1] - 0.4 * z, 0.75 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][i / 2 % 5]); });
    const swag = Array.from({ length: 15 }, (_, i) => { const u = i / 14, b = -0.42 + u * 0.84; return P(-0.06, b, 11.6 - Math.sin(u * Math.PI) * 2.6); });
    for (const [k, p] of swag.entries()) circle(p[0] + (k % 2 ? 0.25 : -0.25) * z, p[1], 0.6 * z, C(k % 3 ? '#6fb04a' : '#559a3e'));
    swag.forEach((p, i) => { if (i % 3 === 1) rose(p[0], p[1] + 0.2 * z, 0.6 * z, [ROSE, '#ffffff', PINK, LILA, '#ffd23f'][i % 5]); });
    for (const b of [-0.49, 0.49]) for (let k = 0; k < 3; k++) { const p = P(-0.1, b, 10.6 - k * 1.6); circle(p[0] + (k % 2 ? 0.5 : -0.5) * z, p[1], 0.8 * z, C('#5aa84f')); if (k === 1) rose(p[0], p[1], 0.7 * z, PINK); }   // Ranken an den Enden
    for (const [a, b, c] of [[0.05, -0.2, PINK], [0.1, 0.15, '#ffffff'], [0.02, 0.3, LILA]]) { const p = P(a, b, 6.1); ellipse(p[0], p[1], 0.7 * z, 0.4 * z, C(c)); }   // Blüten auf dem Sitz
    const leafAt = (p, k, r) => circle(p[0] + (k % 2 ? 0.3 : -0.3) * z, p[1], r * z, C(k % 3 ? '#6fb04a' : '#559a3e'));
    const ribbon = (p, d) => { for (const [o, c] of [[0, ROSE], [0.9, PINK]]) { g.strokeStyle = C(c); g.lineWidth = Math.max(0.4, 0.45 * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(...p);
      g.bezierCurveTo(p[0] + d * (1.5 + o) * z, p[1] + 2.5 * z, p[0] - d * 0.6 * z, p[1] + 5 * z, p[0] + d * (1 + o) * z, p[1] + (7 + o) * z); g.stroke(); }
      for (const s2 of [-1, 1]) poly([p, [p[0] + s2 * 1.3 * z, p[1] - 0.8 * z], [p[0] + s2 * 1.3 * z, p[1] + 0.8 * z]], C(ROSE)); circle(p[0], p[1], 0.45 * z, C('#c93a58')); };
    if (deko === 'bogen') {                                                                                         // Blütenbogen über der Bank, Bänder an den Enden
      const arch = Array.from({ length: 25 }, (_, i) => { const b = -0.49 + i / 24 * 0.98; return P(-0.1, b, 12 + 10 * Math.sqrt(Math.max(0, 1 - (b / 0.49) ** 2))); });
      arch.forEach((p, k) => leafAt(p, k, 0.95)); arch.forEach((p, i) => { if (i % 2 === 1) rose(p[0], p[1] - 0.3 * z, 0.8 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][(i >> 1) % 5]); });
      ribbon(P(-0.1, -0.47, 13.5), -1); ribbon(P(-0.1, 0.47, 13.5), 1);
    } else if (deko === 'herz') {                                                                                   // Blütenherz über der Lehnenmitte, Schleife unten
      const m = P(-0.1, 0, 20.5), R = 4.6 * z, hp = t => [m[0] + R * 0.9 * Math.pow(Math.sin(t), 3), m[1] - R * (0.8 * Math.cos(t) - 0.3 * Math.cos(2 * t) - 0.12 * Math.cos(3 * t) - 0.05 * Math.cos(4 * t))];
      const pts = Array.from({ length: 26 }, (_, i) => hp(i / 26 * TAU));
      sdLine('#5a9a3c', 0.4, z, [P(-0.1, 0, 12.2), hp(Math.PI)]);
      pts.forEach((p, k) => leafAt(p, k, 0.95)); pts.forEach((p, i) => { if (i % 2 === 0) rose(p[0], p[1], 0.8 * z, [ROSE, PINK, '#ffffff', PINK][(i >> 1) % 4]); });
      ribbon(hp(Math.PI), 1);
    }
    if (deko) for (const [b, h, ph] of [[-0.3, 20, 0], [0.32, 17, 2]]) { const p = P(-0.04, b, h);                    // zwei Schmetterlinge
      for (const s2 of [-1, 1]) { ellipse(p[0] + s2 * 0.8 * z, p[1] - 0.3 * z, 0.8 * z, 0.6 * z, C(ph ? '#ffd23f' : LILA)); ellipse(p[0] + s2 * 0.6 * z, p[1] + 0.4 * z, 0.5 * z, 0.4 * z, C(ph ? '#f6b23a' : '#9b6fe0')); }
      sdLine('#4a3a30', 0.25, z, [[p[0], p[1] - 0.7 * z], [p[0], p[1] + 0.7 * z]]); }
  };

  // ── Glühwürmchen-Glas ─────────────────────────────────────────────────────────────────────────────────────────────────
  // Einmachglas mit Deckel und Drahtbügel; Glühwürmchen schwirren darin (bewegt), nachts leuchten sie; A: auf Baumstumpf, B: am Haken
  const jar = (x, y, z, now, lit, out) => {                                                                       // x, y = Glasboden Mitte
    const R = 3.2 * z, H = 7.6 * z;
    ellipse(x, y, R, R / 2, lit ? 'rgba(255,240,170,0.35)' : 'rgba(190,225,235,0.45)');
    for (let k = 0; k < 7; k++) { const t = now / 1000, px = x + Math.sin(t * 0.8 + k * 1.7) * R * 0.62, py = y - H * 0.5 + Math.cos(t * 0.6 + k * 2.3) * H * 0.32;   // Glühwürmchen im Glas
      const on = (Math.sin(t * 2.2 + k * 1.3) + 1) / 2; circle(px, py, (0.38 + on * 0.18) * z, lit ? `rgba(255,250,${150 + on * 80},${0.6 + on * 0.4})` : C(on > 0.5 ? '#e6f07a' : '#c8d65a'));
      if (lit && on > 0.6) glowAt(px, py, 4 * z, z); }
    const gr = g.createLinearGradient(x - R, 0, x + R, 0); gr.addColorStop(0, lit ? 'rgba(255,245,200,0.35)' : 'rgba(225,245,250,0.55)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, lit ? 'rgba(255,235,170,0.3)' : 'rgba(170,215,230,0.5)');
    g.beginPath(); g.ellipse(x, y, R, R / 2, 0, Math.PI, 0, true); g.lineTo(x + R, y - H + 1.2 * z); g.quadraticCurveTo(x + R, y - H, x + R * 0.7, y - H); g.lineTo(x - R * 0.7, y - H); g.quadraticCurveTo(x - R, y - H, x - R, y - H + 1.2 * z); g.closePath();
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(150,200,215,0.8)'; g.lineWidth = Math.max(0.4, 0.3 * z); g.stroke();
    sdLine('rgba(255,255,255,0.85)', 0.45, z, [[x - R * 0.62, y - 1.4 * z], [x - R * 0.62, y - H + 1.8 * z]]);       // Glanz
    sdLine('rgba(255,255,255,0.5)', 0.3, z, [[x - R * 0.35, y - 1 * z], [x - R * 0.35, y - 3 * z]]);
    ellipse(x, y - H, R * 0.72, R * 0.3, C('#d9a93a')); poly([[x - R * 0.72, y - H], [x + R * 0.72, y - H], [x + R * 0.72, y - H - 1.3 * z], [x - R * 0.72, y - H - 1.3 * z]], C('#c9962a'));   // Deckel
    ellipse(x, y - H - 1.3 * z, R * 0.72, R * 0.3, C('#f0c75a'));
    for (const k of [-0.5, 0, 0.5]) sdLine('#a87a22', 0.2, z, [[x + k * R * 0.6, y - H], [x + k * R * 0.6, y - H - 1.3 * z]]);
    g.strokeStyle = C('#7d6a55'); g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath(); g.moveTo(x - R * 0.75, y - H - 0.6 * z); g.quadraticCurveTo(x, y - H - 6.5 * z, x + R * 0.75, y - H - 0.6 * z); g.stroke();   // Drahtbügel
    if (lit) glowAt(x, y - H * 0.5, 16 * z, z);
    if (out) for (let k = 0; k < 4; k++) { const t = now / 1000 + k * 2.1, px = x + Math.sin(t * 0.5) * 9 * z + Math.sin(t * 1.3) * 2 * z, py = y - H * 0.6 + Math.cos(t * 0.4 + k) * 6 * z;   // draußen
      const on = (Math.sin(t * 2.6) + 1) / 2; circle(px, py, 0.45 * z, lit ? `rgba(255,250,170,${0.4 + on * 0.6})` : C('#d8e86a')); if (lit && on > 0.5) glowAt(px, py, 4 * z, z); }
  };
  const gluehglas = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit();
    if (mode === 'stumpf') {
      sdShadow(cx, cy, 7, z);
      cyl(cx, cy, 5.2, 4.6, 0, 6, z, '#a87a52', '#8a5a3c', '#6a4430');                                         // Baumstumpf mit Rinde und Jahresringen
      for (const t of [0.3, 0.55, 0.8]) sdLine('#6a4430', 0.3, z, [[cx + Math.cos(t * Math.PI) * 4.9 * z, cy + Math.sin(t * Math.PI) * 2.45 * z - 0.4 * z], [cx + Math.cos(t * Math.PI) * 4.6 * z, cy - 5.6 * z + Math.sin(t * Math.PI) * 2.3 * z]]);
      ellipse(cx, cy - 6 * z, 4.6 * z, 2.3 * z, C('#d9b07a')); g.strokeStyle = C('#b88a58'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();
      for (const r of [1.2, 2.4, 3.6]) { g.moveTo(cx + r * z, cy - 6 * z); g.ellipse(cx, cy - 6 * z, r * z, r / 2 * z, 0, 0, TAU); } g.stroke();
      for (const [dx, s] of [[-5, 1], [4.4, 0.8]]) { const x = cx + dx * z, y = cy + 1 * z; ellipse(x, y - 2.2 * s * z, 1.6 * s * z, 0.9 * s * z, C('#e8546f')); poly([[x - 0.4 * s * z, y], [x + 0.4 * s * z, y], [x + 0.4 * s * z, y - 2 * s * z], [x - 0.4 * s * z, y - 2 * s * z]], C('#f3ecdf'));
        circle(x - 0.5 * s * z, y - 2.6 * s * z, 0.3 * z, '#ffffff'); }                                                // zwei Pilzchen
      for (const [dx, dy] of [[-3.5, 1.6], [3, 2.2], [-1, 2.6]]) ellipse(cx + dx * z, cy + dy * z, 1.6 * z, 0.6 * z, C('#6fb04a'));   // Moos
      jar(cx + 0.4 * z, cy - 6.6 * z, z, now, lit, false);
    } else {
      sdShadow(cx, cy, 6, z);
      sdLine('#3f3a36', 0.7, z, [[cx - 3 * z, cy], [cx - 3 * z, cy - 24 * z]]);                                    // Hirtenstab-Haken aus Eisen
      g.strokeStyle = C('#3f3a36'); g.lineWidth = Math.max(0.5, 0.7 * z); g.beginPath(); g.moveTo(cx - 3 * z, cy - 24 * z); g.bezierCurveTo(cx - 3 * z, cy - 29 * z, cx + 3.5 * z, cy - 29 * z, cx + 3.5 * z, cy - 25 * z); g.stroke();
      for (const [dx, dy, r] of [[-3, 0.5, 1.4], [-1.6, 1, 1]]) ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.5 * z, C('#6fb04a'));
      for (const [dx, c] of [[-4.6, PINK], [-1.2, '#ffffff'], [-5.4, LILA]]) { sdLine('#5f9e3a', 0.3, z, [[cx + dx * z, cy + 0.4 * z], [cx + dx * z, cy - 2.4 * z]]); rose(cx + dx * z, cy - 2.6 * z, 0.6 * z, c); }
      jar(cx + 3.5 * z, cy - 12 * z, z, now, lit, true);
      sdLine('#7d6a55', 0.3, z, [[cx + 3.5 * z, cy - 25 * z], [cx + 3.5 * z, cy - 22.4 * z]]);
    }
  };

  // ── Sonnenpavillon ────────────────────────────────────────────────────────────────────────────────────────────────────
  // runder offener Pavillon: Stufe, Boden mit Sonnenmosaik, sechs weiße Säulen mit Ranken, Lämpchen unter dem Dach,
  // A: goldene Kuppel mit Rippen, B: gestreiftes Zeltdach; Sonne mit Strahlen obendrauf (leuchtet nachts)
  const sun = (x, y, r, z, now, lit) => {
    const rot = now / 9000;
    for (let k = 0; k < 12; k++) { const a = rot + k / 12 * TAU, l = k % 2 ? 1.5 : 1.85;
      poly([[x + Math.cos(a - 0.13) * r, y + Math.sin(a - 0.13) * r], [x + Math.cos(a) * r * l, y + Math.sin(a) * r * l], [x + Math.cos(a + 0.13) * r, y + Math.sin(a + 0.13) * r]], C(k % 2 ? '#ffcf4a' : GOLD)); }
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(1, lit ? '#ffc23a' : C('#f0b43a'));
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = gr; g.fill(); g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.4, 0.3 * z); g.stroke();
    if (lit) glowAt(x, y, r * 7, z);
  };
  const sonnenpavillon = (mode) => (cx, cy, z, now = 0) => {
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
    const front = ts.filter(t => Math.sin(t) >= 0).map(t => [t, col(t)]);                                        // vordere Säulen mit Ranken
    for (const [, [x, y]] of front) { g.strokeStyle = C('#5a9a3c'); g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();
      for (let i = 0; i <= 20; i++) { const u = i / 20, px = x + Math.sin(u * 14) * 1 * z, py = y - u * (HC - 1.5) * z; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
      for (let i = 1; i < 10; i++) { const u = i / 10, px = x + Math.sin(u * 14) * 1 * z; circle(px + (i % 2 ? 0.7 : -0.7) * z, y - u * (HC - 1.5) * z, 0.6 * z, C('#6fb04a')); if (i % 3 === 0) rose(px, y - u * (HC - 1.5) * z, 0.55 * z, [PINK, '#ffffff', '#ffd23f'][i / 3 % 3]); } }
    const EY = cy - (2.4 + HC) * z, ER = R + 2.6;                                                                 // Traufe
    const lamps = []; for (let k = 0; k < 7; k++) { const t = 0.12 * Math.PI + k / 6 * 0.76 * Math.PI; lamps.push([cx + Math.cos(t) * (R - 1) * z, EY + Math.sin(t) * (R - 1) / 2 * z + 2.4 * z]); }
    if (mode === 'kuppel') {
      const H = 13;
      const gr = g.createLinearGradient(cx - ER * z, 0, cx + ER * z, 0); gr.addColorStop(0, C('#ffd56a')); gr.addColorStop(0.45, C('#f2b23e')); gr.addColorStop(1, C('#c98424'));
      g.beginPath(); g.ellipse(cx, EY, ER * z, H * z, 0, Math.PI, 0); g.ellipse(cx, EY, ER * z, ER / 2 * z, 0, 0, Math.PI); g.closePath(); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(150,90,20,0.45)'; g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();              // Rippen (Meridiane der Kuppel)
      for (let j = 1; j < 8; j++) { const t = j / 8 * Math.PI; for (let i = 0; i <= 10; i++) { const f = i / 10 * Math.PI / 2, px = cx + ER * z * Math.cos(t) * Math.cos(f), py = EY + ER / 2 * z * Math.sin(t) * Math.cos(f) - H * z * Math.sin(f); i ? g.lineTo(px, py) : g.moveTo(px, py); } }
      g.stroke();
      ellipse(cx - ER * 0.35 * z, EY - H * 0.6 * z, ER * 0.22 * z, H * 0.16 * z, 'rgba(255,255,255,0.35)');
      for (let k = 0; k < 16; k++) { const t = k / 16 * Math.PI; circle(cx + Math.cos(t) * ER * z, EY + Math.sin(t) * ER / 2 * z + 0.9 * z, 1 * z, C(k % 2 ? '#fff3d6' : '#f6dc8e')); }   // Bogenkante
      sdLine('#c9962a', 0.6, z, [[cx, EY - H * z], [cx, EY - (H + 3) * z]]);
      sun(cx, EY - (H + 6.5) * z, 3 * z, z, now, lit);
    } else {
      const H = 15, apex = [cx, EY - H * z], M = 12;                                                             // Zeltdach mit Streifen
      for (let k = M - 1; k >= 0; k--) { const t0 = k / M * Math.PI, t1 = (k + 1) / M * Math.PI, tm = (t0 + t1) / 2, lum = 0.5 + 0.5 * Math.cos(tm - Math.PI * 0.7);
        const base = (t) => [cx + Math.cos(t) * ER * z, EY + Math.sin(t) * ER / 2 * z];
        poly([apex, base(t0), base((t0 + tm) / 2), base(tm), base((tm + t1) / 2), base(t1)], C(shade(k % 2 ? '#fff3d6' : '#f29a3a', -0.16 * (1 - lum)))); }
      for (let k = 0; k < M; k++) { const t0 = k / M * Math.PI, t1 = (k + 1) / M * Math.PI, x0 = cx + Math.cos(t0) * ER * z, x1 = cx + Math.cos(t1) * ER * z, y0 = EY + Math.sin(t0) * ER / 2 * z, y1 = EY + Math.sin(t1) * ER / 2 * z;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 2.4 * z, x1, y1); g.closePath(); g.fillStyle = C(k % 2 ? '#fff3d6' : '#f29a3a'); g.fill(); }   // Zacken
      sdLine('#c9962a', 0.6, z, [apex, [cx, apex[1] - 3 * z]]);
      sun(cx, apex[1] - 6.4 * z, 3 * z, z, now, lit);
    }
    for (const [x, y] of lamps) { sdLine('#8a5a3c', 0.2, z, [[x, y - 2.4 * z], [x, y - 1 * z]]); ellipse(x, y, 0.9 * z, 1.1 * z, lit ? '#ffe39a' : C('#ffcf6a')); if (lit) glowAt(x, y, 6 * z, z); }
  };

  // ── Glasschuh ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Damenschuh mit Absatz von der Seite (Spitze rechts), aus Glas: hell, durchscheinend, Glanzlinien, Funkeln; auf rotem Samtkissen mit
  // goldenen Quasten; A: Kissen auf Steinsäule, B: Kissen auf goldenem Hocker
  // Glasschuh (Nutzer 31.10.2026: „überdimensioniert und weird“, „immer noch hässlich“) wie ein Absatzschuh-Symbol: hohe Fersenkappe,
  // große Öffnung mit sichtbarem Inneren, runde Zehenkappe vorn rechts, schlanker hoher Absatz; Glas hellblau mit Glanz, dünne Kante
  const SHOE_FRONT = { ball: [[2.8, 0.05], [4.6, 0.15]], tip: [5.6, 0.8], cap: [[4.6, 1.3], [3.6, 2.0]], capEnd: [2.6, 2.2], rist: [[1.5, 2.2], [0.8, 2.0]], throat: [0.2, 2.2],
    hl: [[2.5, 1.85], [3.7, 1.65], [4.8, 1.0]], spark: [5.6, 1.8], deko: 'kristall', dekoPos: [1.1, 2.05], backTop: [-4.1, 6.8], heel: [0.95, 0.35] };
  const shoe = (x, y, s, z, now, lit, F0) => {                                                                   // x, y = Mitte unten; F0: Vorderteil (Entwürfe)
    const F = Object.assign({}, SHOE_FRONT, F0 || {}), u = s * z, Q = (a, b) => [x + a * u, y - b * u], edge = lit ? 'rgba(150,205,240,1)' : 'rgba(95,165,210,0.95)';
    const glass = (a, b, c, d) => { const gr = g.createLinearGradient(...Q(-4, 6), ...Q(4.5, 0)); gr.addColorStop(0, a); gr.addColorStop(0.55, b); gr.addColorStop(1, c); return d ? gr : gr; };
    // Absatz
    poly([Q(-4.05, 3.9), Q(-4.05 + F.heel[0], 3.5), Q(-3.32 + F.heel[1] / 2, 0.05), Q(-3.32 - F.heel[1] / 2, 0.05)], lit ? 'rgba(205,238,255,1)' : 'rgba(170,218,242,1)');
    g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.22 * z); g.stroke();
    // Außenseite
    const outer = () => { g.beginPath(); g.moveTo(...Q(...F.backTop)); g.bezierCurveTo(...Q(-4.6, 5.6), ...Q(-4.4, 4.2), ...Q(-3.9, 3.7));   // Fersenkappe hinten
      g.bezierCurveTo(...Q(-2.4, 3.3), ...Q(-0.8, 0.6), ...Q(1.2, 0.25));                                          // Sohle, Gewölbe
      g.bezierCurveTo(...Q(...F.ball[0]), ...Q(...F.ball[1]), ...Q(...F.tip));                                     // Ballen bis Spitze
      g.bezierCurveTo(...Q(...F.cap[0]), ...Q(...F.cap[1]), ...Q(...F.capEnd));                                   // Zehenkappe
      if (F.notch) { g.quadraticCurveTo(...Q(F.capEnd[0] - 0.5, F.capEnd[1] + 0.2), ...Q(...F.notch)); g.quadraticCurveTo(...Q(F.notch[0] - 0.6, F.notch[1] + 0.7), ...Q(...F.throat)); }   // Herz-Ausschnitt
      else g.bezierCurveTo(...Q(...F.rist[0]), ...Q(...F.rist[1]), ...Q(...F.throat));                            // Rist
      g.bezierCurveTo(...Q(-1.6, 2.9), ...Q(-3.0, 4.6), ...Q(...F.backTop)); g.closePath(); };                        // vordere Kante der Öffnung
    outer(); g.fillStyle = glass(lit ? 'rgba(235,250,255,0.97)' : 'rgba(222,245,255,0.95)', lit ? 'rgba(190,232,255,0.92)' : 'rgba(170,222,246,0.92)', lit ? 'rgba(220,246,255,0.97)' : 'rgba(198,236,252,0.95)'); g.fill();
    g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.25 * z); g.stroke();
    // Öffnung: das Innere (hintere Wand und Innensohle) zwischen vorderer und hinterer Kante
    g.beginPath(); g.moveTo(...Q(...F.throat)); g.bezierCurveTo(...Q(-1.6, 2.9), ...Q(-3.0, 4.6), ...Q(...F.backTop));
    g.bezierCurveTo(...Q(-3.2, 6.6), ...Q(-1.6, 4.6), ...Q(...F.throat)); g.closePath(); g.fillStyle = lit ? 'rgba(120,175,215,0.55)' : 'rgba(95,155,200,0.5)'; g.fill();
    g.beginPath(); g.moveTo(...Q(0.1, 2.35)); g.bezierCurveTo(...Q(-1.4, 3.0), ...Q(-2.6, 4.2), ...Q(-3.5, 5.6)); g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(0.3, 0.35 * z); g.stroke();   // Innensohle hell
    // Glanz
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineCap = 'round'; g.lineWidth = Math.max(0.4, 0.4 * z);
    g.beginPath(); g.moveTo(...Q(...F.hl[0])); g.quadraticCurveTo(...Q(...F.hl[1]), ...Q(...F.hl[2])); g.stroke();
    g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath(); g.moveTo(...Q(F.backTop[0] + 0.15, F.backTop[1] - 0.7)); g.quadraticCurveTo(...Q(-4.2, (F.backTop[1] + 3.4) / 2), ...Q(-3.8, 4.2)); g.stroke();
    g.beginPath(); g.moveTo(...Q(-1.4, 2.3)); g.quadraticCurveTo(...Q(-0.4, 1.3), ...Q(1.0, 0.9)); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.stroke();
    const dp = Q(...F.dekoPos);
    if (F.deko === 'kristall') circle(...dp, 0.38 * u, lit ? '#ffffff' : C('#eaf8ff'));                          // kleiner Kristall auf dem Rist
    else if (F.deko === 'schleife') { for (const d of [-1, 1]) { g.beginPath(); g.moveTo(...dp); g.quadraticCurveTo(dp[0] + d * 1.4 * u, dp[1] - 1.0 * u, dp[0] + d * 1.2 * u, dp[1] + 0.2 * u); g.closePath();
      g.fillStyle = 'rgba(235,250,255,0.95)'; g.fill(); g.strokeStyle = edge; g.lineWidth = Math.max(0.3, 0.2 * z); g.stroke(); } circle(...dp, 0.3 * u, '#ffffff'); }
    else if (F.deko === 'blume') { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; ellipse(dp[0] + Math.cos(a) * 0.45 * u, dp[1] + Math.sin(a) * 0.4 * u, 0.42 * u, 0.32 * u, 'rgba(240,252,255,0.95)'); }
      circle(...dp, 0.25 * u, C('#bfe8ff')); }
    // Funkeln
    for (const [a, b, r, ph] of [[...F.spark, 0.8, 0], [F.backTop[0] - 0.5, F.backTop[1] + 0.3, 0.7, 2]]) { const p = Q(a, b), f = (Math.sin(now / 600 + ph) + 1) / 2, q = (0.35 + 0.4 * f) * r * u;
      poly([[p[0], p[1] - q * 1.6], [p[0] + q * 0.3, p[1] - q * 0.3], [p[0] + q * 1.6, p[1]], [p[0] + q * 0.3, p[1] + q * 0.3], [p[0], p[1] + q * 1.6], [p[0] - q * 0.3, p[1] + q * 0.3], [p[0] - q * 1.6, p[1]], [p[0] - q * 0.3, p[1] - q * 0.3]], '#ffffff'); }
    if (lit) glowAt(...Q(0, 3), 12 * z, z, 'blue');
  };
  const cushion = (x, y, z) => {                                                                                  // x, y = Kissen-Unterseite Mitte
    const w = 5.6 * z, d = 2.6 * z, h = 2 * z;
    const top = [[x - w, y - h], [x, y - h - d], [x + w, y - h], [x, y - h + d]];
    g.beginPath(); g.moveTo(x - w, y - h); g.quadraticCurveTo(x - w * 1.05, y + 0.3 * z, x - w * 0.2, y + d * 0.9); g.quadraticCurveTo(x, y + d * 1.1, x + w * 0.2, y + d * 0.9);
    g.quadraticCurveTo(x + w * 1.05, y + 0.3 * z, x + w, y - h); g.lineTo(x, y - h + d); g.closePath(); g.fillStyle = C('#a8304f'); g.fill();
    g.beginPath(); g.moveTo(...top[0]); g.quadraticCurveTo(x - w * 0.5, y - h - d * 1.25, ...top[1]); g.quadraticCurveTo(x + w * 0.5, y - h - d * 1.25, ...top[2]);
    g.quadraticCurveTo(x + w * 0.5, y - h + d * 1.25, ...top[3]); g.quadraticCurveTo(x - w * 0.5, y - h + d * 1.25, ...top[0]); g.closePath();
    const gr = g.createRadialGradient(x - w * 0.3, y - h - d * 0.4, 0, x, y - h, w); gr.addColorStop(0, C('#e86a8a')); gr.addColorStop(1, C('#c23c5e')); g.fillStyle = gr; g.fill();
    g.strokeStyle = C(GOLD); g.lineWidth = Math.max(0.4, 0.4 * z); g.stroke();
    for (const p of [top[0], top[2], top[3]]) { sdLine(GOLD_D, 0.3, z, [p, [p[0], p[1] + 1.6 * z]]); poly([[p[0] - 0.6 * z, p[1] + 1.4 * z], [p[0] + 0.6 * z, p[1] + 1.4 * z], [p[0] + 0.8 * z, p[1] + 3 * z], [p[0] - 0.8 * z, p[1] + 3 * z]], C(GOLD)); circle(p[0], p[1] + 1.3 * z, 0.5 * z, C(GOLD_D)); }
    return [x + 0.4 * z, y - h - 0.4 * z];
  };
  const glasschuh = (mode, F) => (cx, cy, z, now = 0) => {
    const lit = sdLit();
    sdShadow(cx, cy, 7, z);
    let top;
    if (mode === 'saeule') {
      cyl(cx, cy, 4.6, 4.6, 0, 1.4, z, '#e6ddce', '#d6cab6', '#b3a48a', '#ece4d6');
      cyl(cx, cy, 3, 2.7, 1.4, 8.6, z, '#f4eee3', '#e4dacb', '#bfb19a');
      for (const t of [0.25, 0.42, 0.58, 0.75]) sdLine('rgba(160,140,110,0.5)', 0.25, z, [[cx + Math.cos(t * Math.PI) * 2.9 * z, cy - 1.4 * z + Math.sin(t * Math.PI) * 1.45 * z], [cx + Math.cos(t * Math.PI) * 2.6 * z, cy - 8.6 * z + Math.sin(t * Math.PI) * 1.3 * z]]);
      cyl(cx, cy, 4.2, 4.2, 8.6, 9.8, z, '#f2ebdf', '#e2d8c8', '#bfb19a', '#f8f3ea');
      top = cy - 9.8 * z;
    } else {
      const K = kit(cx, cy, z, 0), P = K.P;                                                                       // goldener Hocker mit geschwungenen Beinen
      for (const [a, b] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) { const p = P(a, b, 0), q = P(a * 0.8, b * 0.8, 6);
        g.strokeStyle = C(a > 0 && b > 0 ? GOLD : GOLD_D); g.lineWidth = Math.max(0.6, 0.8 * z); g.beginPath(); g.moveTo(...p); g.quadraticCurveTo(p[0] + (a > 0 ? 1.6 : -1.6) * z, (p[1] + q[1]) / 2, ...q); g.stroke(); circle(p[0], p[1], 0.6 * z, C(GOLD_D)); }
      box3(K, -0.1, 0.1, -0.1, 0.1, 6, 7.4, C('#f6dd8a'), C(GOLD_D), C(GOLD));
      top = cy - 7.4 * z;
    }
    const s = cushion(cx, top + 1 * z, z);
    shoe(s[0] - 0.2 * z, s[1] + 0.9 * z, 0.95, z, now, lit, F);                                                // steht aufrecht auf dem Kissen
  };

  // zehn Vorderteile (Nutzer 31.10.2026: „mach mal 10 Zeichnungen von dem Schuh, wo du nur den Vorderteil bearbeitest“)
  window.SCHUH_VORN = {
    '1 wie jetzt': {},
    '2 Mandelform, sanft gerundet': { tip: [5.3, 0.95], ball: [[2.8, 0.05], [4.5, 0.1]], cap: [[5.3, 1.6], [3.9, 2.25]], capEnd: [2.6, 2.25], hl: [[2.5, 1.95], [3.8, 1.85], [4.7, 1.3]], spark: [5.4, 2.0] },
    '3 lang und sehr spitz': { tip: [6.4, 0.6], ball: [[3, 0], [5.2, 0.1]], cap: [[5.2, 1.0], [3.8, 1.9]], hl: [[2.5, 1.8], [4.0, 1.5], [5.6, 0.85]], spark: [6.4, 1.5] },
    '4 Spitze leicht nach oben': { tip: [5.9, 1.9], ball: [[3, 0], [5.1, 0.3]], cap: [[5.0, 1.8], [3.7, 2.1]], hl: [[2.5, 1.9], [3.8, 1.85], [5.0, 1.55]], spark: [5.9, 2.3] },
    '5 flache, schmale Kappe': { cap: [[4.5, 1.05], [3.6, 1.6]], capEnd: [2.6, 1.75], rist: [[1.6, 1.8], [0.8, 1.9]], hl: [[2.4, 1.5], [3.7, 1.35], [4.8, 0.95]], dekoPos: [1.1, 1.75] },
    '6 tiefer Ausschnitt': { throat: [2.0, 1.6], capEnd: [3.2, 1.95], rist: [[2.7, 1.85], [2.3, 1.6]], hl: [[3.2, 1.7], [4.0, 1.55], [4.8, 1.0]], dekoPos: [2.7, 1.8] },
    '7 hoher Rist': { throat: [-1.3, 3.3], capEnd: [2.6, 2.4], rist: [[1.2, 2.7], [-0.2, 3.0]], dekoPos: [0.6, 2.7] },
    '8 Herz-Ausschnitt': { notch: [1.2, 1.55], throat: [0.1, 2.25], dekoPos: [1.2, 1.75] },
    '9 Glasschleife auf dem Rist': { deko: 'schleife', dekoPos: [1.4, 2.15] },
    '10 Glasblume auf dem Rist': { deko: 'blume', dekoPos: [1.3, 2.1] },
  };
  for (const [k, F] of Object.entries(window.SCHUH_VORN)) window.SCHUH_VORN[k] = glasschuh('saeule', F);
  // Länge der Spitze (Nutzer: „nicht einmal in der Länge der Spitze variiert“): Vorderteil ab dem Ballen (x 1.2) gestreckt/gestaucht, je spitz und leicht gerundet
  const front = (f, rund) => { const x0 = 1.2, X = a => a > x0 ? x0 + (a - x0) * f : a, sc = ([a, b]) => [X(a), b], S = SHOE_FRONT, tip = sc(S.tip);
    return { ball: S.ball.map(sc), tip, cap: rund ? [[tip[0] + 0.1, 1.55], [X(3.9), 2.15]] : S.cap.map(sc), capEnd: sc(S.capEnd), rist: S.rist.map(sc), hl: S.hl.map(sc), spark: [tip[0], 1.8] }; };
  window.SCHUH_LANG = {};
  for (const [f, name] of [[0.6, 'sehr kurz'], [0.75, 'kurz'], [0.88, 'etwas kürzer'], [1, 'wie jetzt'], [1.18, 'länger']])
    for (const rund of [false, true]) window.SCHUH_LANG[`${name}, ${rund ? 'leicht gerundet' : 'spitz'}`] = glasschuh('saeule', front(f, rund));
  // Grundlage „sehr kurz, spitz“ (Nutzer: „perfekt“), darauf zehn Variationen
  const B = front(0.6, false), V = o => glasschuh('saeule', Object.assign({}, B, o));
  window.SCHUH_V = {
    '1 Grundlage': V({}),
    '2 Spitze etwas angehoben': V({ tip: [B.tip[0], 1.35], ball: [B.ball[0], [B.ball[1][0], 0.35]], cap: [[B.tip[0] - 0.6, 1.75], B.cap[1]], spark: [B.tip[0], 2.3] }),
    '3 Zehenkappe voller': V({ cap: [[B.cap[0][0], 1.8], [B.cap[1][0], 2.6]], capEnd: [B.capEnd[0], 2.5], rist: [[1.5, 2.45], [0.8, 2.2]], hl: [[2.0, 2.2], [2.9, 2.15], [3.5, 1.5]] }),
    '4 Zehenkappe flacher': V({ cap: [[B.cap[0][0], 1.0], [B.cap[1][0], 1.55]], capEnd: [B.capEnd[0], 1.75], rist: [[1.5, 1.8], [0.8, 1.9]], hl: [[1.9, 1.5], [2.8, 1.35], [3.5, 0.95]], dekoPos: [1.1, 1.8] }),
    '5 tiefer Ausschnitt': V({ throat: [1.5, 1.7], rist: [[1.9, 1.95], [1.7, 1.75]], hl: [[2.2, 1.7], [2.9, 1.55], [3.5, 1.0]], dekoPos: [2.0, 1.8] }),
    '6 hoher Ausschnitt': V({ throat: [-1.0, 3.1], rist: [[1.3, 2.55], [0.0, 2.9]], dekoPos: [0.7, 2.6] }),
    '7 Ferse niedriger': V({ backTop: [-4.0, 5.9] }),
    '8 kräftigerer Absatz': V({ heel: [1.3, 0.75] }),
    '9 Glasschleife': V({ deko: 'schleife', dekoPos: [1.3, 2.15] }),
    '10 Glasblume': V({ deko: 'blume', dekoPos: [1.2, 2.1] }),
  };
  // ── Froschkönig-Brunnen ───────────────────────────────────────────────────────────────────────────────────────────────
  // runder Brunnen aus Stein, Wasser mit Wellenringen, Seerosen, goldene Kugel am Rand, Frosch mit Krone (blinzelt);
  // A: Frosch auf Säule in der Mitte speit einen Wasserbogen, B: Frosch auf Seerosenblatt, Wasser fällt aus einer Schale dahinter
  const frog = (x, y, s, z, now, lit, spit = false) => {                                                                        // x, y = Sitzfläche Mitte
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
    if (spit) { ellipse(x, y - 2.55 * u, 0.75 * u, 0.5 * u, C('#2f5a2a')); ellipse(x, y - 2.45 * u, 0.45 * u, 0.25 * u, C('#e8798a')); }   // Maul offen (speit Wasser)
    else { g.strokeStyle = C('#2f5a2a'); g.lineWidth = Math.max(0.3, 0.22 * u); g.beginPath(); g.moveTo(x - 1.6 * u, y - 2.9 * u); g.quadraticCurveTo(x, y - 2.2 * u, x + 1.6 * u, y - 2.9 * u); g.stroke(); }   // Maul
    for (const d of [-1, 1]) circle(x + d * 2.1 * u, y - 2.9 * u, 0.4 * u, 'rgba(255,140,150,0.45)');
    const cy0 = y - 5.6 * u;                                                                                       // Krone zwischen den Augen
    poly([[x - 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.6 * u], [x + 1.25 * u, cy0 - 1 * u], [x + 0.6 * u, cy0 - 0.2 * u], [x, cy0 - 1.3 * u], [x - 0.6 * u, cy0 - 0.2 * u], [x - 1.25 * u, cy0 - 1 * u]], C(GOLD));
    poly([[x - 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.6 * u], [x + 1.1 * u, cy0 + 0.2 * u], [x - 1.1 * u, cy0 + 0.2 * u]], C(GOLD_D));
    for (const [d, c] of [[0, ROSE], [-0.75, '#58b3e8'], [0.75, '#58b3e8']]) circle(x + d * u, cy0 + 0.4 * u, 0.2 * u, C(c));
    for (const d of [-1.25, 0, 1.25]) circle(x + d * u, cy0 - (d ? 1 : 1.3) * u, 0.18 * u, C('#fff3a0'));
  };
  const basin = (cx, cy, z, now, lit, R) => {
    cyl(cx, cy, R, R, 0, 4.2, z, '#d9d2c4', '#c9c1b1', '#9f9684');
    g.strokeStyle = 'rgba(120,110,95,0.45)'; g.lineWidth = Math.max(0.3, 0.28 * z); g.beginPath();                // Steinfugen
    halfArc(cx, cy - 2.1 * z, R * z, 0.05, Math.PI - 0.05);
    for (let j = 0; j < 7; j++) { const t = (j + 0.5) / 7 * Math.PI, t2 = (j + 1) / 7 * Math.PI; for (const [tt, h0, h1] of [[t, 0, 2.1], [t2, 2.1, 4.2]]) { if (Math.sin(tt) < 0.25) continue;
      g.moveTo(cx + Math.cos(tt) * R * z, cy - h0 * z + Math.sin(tt) * R / 2 * z); g.lineTo(cx + Math.cos(tt) * R * z, cy - h1 * z + Math.sin(tt) * R / 2 * z); } }
    g.stroke();
    ellipse(cx, cy - 4.2 * z, R * z, R / 2 * z, C('#e6dfd2'));                                                    // Rand oben
    const W = R - 1.4, wy = cy - 3.6 * z;
    const wg = g.createLinearGradient(0, wy - W / 2 * z, 0, wy + W / 2 * z); wg.addColorStop(0, lit ? '#2c4a6e' : C('#5ec2dd')); wg.addColorStop(1, lit ? '#3b6a8e' : C('#8fdcef'));
    g.beginPath(); g.ellipse(cx, wy, W * z, W / 2 * z, 0, 0, TAU); g.fillStyle = wg; g.fill();
    return { W, wy };
  };
  const ripples = (cx, wy, W, z, now, cx2 = cx, wy2 = wy) => {
    g.save(); g.beginPath(); g.ellipse(cx, wy, W * z, W / 2 * z, 0, 0, TAU); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = Math.max(0.3, 0.3 * z);
    for (let k = 0; k < 3; k++) { const p = ((now / 2200) + k / 3) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(cx2, wy2, (1 + p * W * 0.8) * z, (0.5 + p * W * 0.4) * z, 0, 0, TAU); g.stroke(); }
    g.globalAlpha = 1; g.restore();
  };
  const lily = (x, y, r, z, flower) => { g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r * z, r * 0.5 * z, 0, 0.35, TAU - 0.05); g.closePath(); g.fillStyle = C('#4f9e4a'); g.fill();
    if (flower) { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ellipse(x + Math.cos(a) * 0.7 * z, y - 0.5 * z + Math.sin(a) * 0.35 * z, 0.6 * z, 0.35 * z, C(k % 2 ? '#ffd0e0' : PINK)); } circle(x, y - 0.6 * z, 0.35 * z, C('#ffd23f')); } };
  const goldBall = (x, y, z) => { const gr = g.createRadialGradient(x - 0.5 * z, y - 0.6 * z, 0.1 * z, x, y, 1.5 * z); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(1, C(GOLD_D)); g.beginPath(); g.arc(x, y, 1.5 * z, 0, TAU); g.fillStyle = gr; g.fill(); };
  const drops = (pts, z, now, lit, n = 7) => {                                                                     // Wasser entlang einer Kurve, Tropfen laufen mit
    g.strokeStyle = lit ? 'rgba(170,215,240,0.55)' : 'rgba(200,240,252,0.75)'; g.lineWidth = Math.max(0.5, 0.7 * z); g.lineCap = 'round'; path(pts, false); g.stroke();
    for (let k = 0; k < n; k++) { const f = ((now / 900) + k / n) % 1, i = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), r = f * (pts.length - 1) - i;
      circle(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r, 0.4 * z, '#ffffff'); }
  };
  const froschbrunnen = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit(), R = 11;
    sdShadow(cx, cy, 13, z);
    const { W, wy } = basin(cx, cy, z, now, lit, R);
    if (mode === 'saeule') {
      ripples(cx, wy, W, z, now, cx + 5.5 * z, wy + 1.4 * z);
      lily(cx - 6 * z, wy + 1.6 * z, 2, z, true); lily(cx + 2 * z, wy + 3.2 * z, 1.5, z, false); lily(cx - 3 * z, wy - 2.6 * z, 1.4, z, false);
      cyl(cx, cy, 1.8, 1.5, 3.6, 10.5, z, '#e3dccf', '#d3cbbb', '#a99f8c');                                       // Säule in der Mitte
      cyl(cx, cy, 2.6, 2.6, 10.5, 11.6, z, '#ece6da', '#ddd5c6', '#b3a994', '#efe9de');
      const fy = cy - 11.6 * z;
      frog(cx, fy, 0.95, z, now, lit, true);
      const mx = cx, my = fy - 2.55 * 0.95 * z, pts = Array.from({ length: 14 }, (_, i) => { const u = i / 13; return [mx + u * 6.5 * z, my - Math.sin(u * Math.PI * 0.6) * 1.2 * z + u * u * 11 * z]; });   // Strahl aus dem Maul, flach nach vorn rechts
      drops(pts, z, now, lit);
    } else {
      cyl(cx - 2 * z, cy - 1.4 * z, 1.3, 1.1, 3.6, 13, z, '#e3dccf', '#d3cbbb', '#a99f8c');                        // Säule hinten mit Schale
      const by = cy - 1.4 * z - 13 * z;
      g.beginPath(); g.ellipse(cx - 2 * z, by, 4.4 * z, 2.2 * z, 0, 0, Math.PI); g.lineTo(cx - 2 * z + 4.4 * z, by); g.closePath(); g.fillStyle = C('#cfc7b6'); g.fill();
      ellipse(cx - 2 * z, by, 4.4 * z, 2.2 * z, C('#e6dfd2')); ellipse(cx - 2 * z, by, 3.6 * z, 1.7 * z, lit ? '#3b6a8e' : C('#7fd3e8'));
      for (const d of [-1, 1]) { const x0 = cx - 2 * z + d * 4 * z, pts = Array.from({ length: 8 }, (_, i) => { const u = i / 7; return [x0 + d * u * 1.6 * z, by + 0.6 * z + u * u * 9.6 * z]; }); drops(pts, z, now + (d > 0 ? 450 : 0), lit, 4); }
      ripples(cx, wy, W, z, now, cx - 2 * z, wy - 0.6 * z);
      lily(cx - 6.5 * z, wy + 0.4 * z, 1.5, z, false); lily(cx + 5.5 * z, wy - 1 * z, 1.4, z, true);
      lily(cx + 1.5 * z, wy + 2.6 * z, 3, z, false);                                                               // Seerosenblatt mit Frosch
      frog(cx + 1.5 * z, wy + 2.4 * z, 0.85, z, now, lit);
    }
    goldBall(cx + Math.cos(0.25) * R * z * 0.92, cy - 5.6 * z + Math.sin(0.25) * R / 2 * z, z);                  // goldene Kugel auf dem Rand
    for (const t of [2.4, 2.75]) { const x = cx + Math.cos(t) * (R + 0.6) * z, y = cy + Math.sin(t) * (R + 0.6) / 2 * z;   // Schilf und Blumen am Fuß
      for (const d of [-0.5, 0, 0.6]) sdLine('#5f8f3a', 0.4, z, [[x + d * z, y], [x + (d * 1.5) * z, y - (4.5 + d) * z]]); }
    for (const [t, c] of [[0.7, PINK], [0.95, '#ffffff'], [1.2, LILA]]) rose(cx + Math.cos(t) * (R + 0.4) * z, cy + Math.sin(t) * (R + 0.4) / 2 * z + 0.6 * z, 0.75 * z, c);
  };

  const alt = (name) => (cx, cy, z, now) => { for (const k of ['TURM', 'MAERCHEN']) { const e = SD_WAREN[k].find(e => e[0] === name); if (e) return e[1](cx, cy, z, now || 0); } };
  window.ENTW_P7 = {
    'Blumenkranz-Bank: bisher': alt('Blumenkranz-Bank'),
    'Bank A: Girlande über der Lehne': kranzbank('girlande'),
    'Bank B: Kranz an der Lehne, Blumentöpfe': kranzbank('kranz'),
    'Bank C: Standardbank aus Holz mit Blüten': kranzbankC,
    'Bank C1: dazu Blütenbogen mit Bändern': (cx, cy, z) => kranzbankC(cx, cy, z, 'bogen'),
    'Bank C2: dazu Blütenherz mit Schleife': (cx, cy, z) => kranzbankC(cx, cy, z, 'herz'),
    'Glühwürmchen-Glas: bisher': alt('Glühwürmchen-Glas'),
    'Glas A: auf Baumstumpf': gluehglas('stumpf'),
    'Glas B: am Haken, Glühwürmchen auch draußen': gluehglas('haken'),
    'Sonnenpavillon: bisher': alt('Sonnenpavillon ✦'),
    'Pavillon A: goldene Kuppel': sonnenpavillon('kuppel'),
    'Pavillon B: gestreiftes Zeltdach': sonnenpavillon('zelt'),
    'Glasschuh: bisher': alt('Glasschuh auf Kissen'),
    'Glasschuh A: Kissen auf Säule': glasschuh('saeule'),
    'Glasschuh B: Kissen auf Hocker': glasschuh('hocker'),
    'Froschkönig-Brunnen: bisher': alt('Froschkönig-Brunnen'),
    'Brunnen A: Frosch auf Säule speit Wasser': froschbrunnen('saeule'),
    'Brunnen B: Frosch auf Seerose, Schale': froschbrunnen('seerose'),
  };
})();
