// Entwürfe Paket 6 Turm (Basar-Durchsicht 29.10.2026): Turm mit Zopf („höher, Details“, Ebenen prüfen) und Laternenboot („Laternen
// schweben sichtbar, mehr“). Form wie SD_ART plus now. Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p6.js')).text())
(() => {
  const TAU = Math.PI * 2, PINK = '#ff9ec0', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const leaf = (x, y, r, rot, col) => { g.beginPath(); g.ellipse(x, y, r, r * 0.5, rot, 0, TAU); g.fillStyle = C(col); g.fill(); };

  // ── Runder Turm ───────────────────────────────────────────────────────────────────────────────────────────────────────
  // Zylinder in Bildschirm-Koordinaten (Ellipsen 2:1): t = 0 rechts, π/2 vorn, π links. Seiten heller links (Licht von links oben)
  const arc = (cx, y, r, t0 = 0, t1 = Math.PI, n = 18) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return [cx + r * Math.cos(t), y + r / 2 * Math.sin(t)]; });
  const cyl = (cx, cy, r0, r1, h0, h1, z, light, mid, dark) => {
    const pts = [...arc(cx, cy - h0 * z, r0 * z, Math.PI, 0), ...arc(cx, cy - h1 * z, r1 * z, 0, Math.PI)];
    const gr = g.createLinearGradient(cx - r0 * z, 0, cx + r0 * z, 0); gr.addColorStop(0, C(light)); gr.addColorStop(0.45, C(mid)); gr.addColorStop(1, C(dark));
    path(pts); g.fillStyle = gr; g.fill();
  };
  const topDisc = (cx, cy, r, h, z, col) => ellipse(cx, cy - h * z, r * z, r / 2 * z, C(col));
  const rAt = (r0, r1, h0, h1, h) => r0 + (r1 - r0) * (h - h0) / (h1 - h0);
  // Steinreihen: jede Reihe ein vorderer Halbbogen auf ihrer Höhe, Stoßfugen je Reihe versetzt (nur vorn, wo sie gut zu sehen sind)
  const courses = (cx, cy, r0, r1, h0, h1, step, z, col) => {
    g.strokeStyle = C(col); g.lineWidth = Math.max(0.4, 0.32 * z); g.lineCap = 'round'; g.beginPath();
    const hs = []; for (let h = h0 + step; h < h1 - 0.5; h += step) hs.push(h);
    for (const h of hs) { const r = rAt(r0, r1, h0, h1, h) * z; arc(cx, cy - h * z, r, 0.04, Math.PI - 0.04).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); }
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
  const braid = (pts, z, now, w = 1.25) => {
    const N = 60, q = []; for (let i = 0; i <= N; i++) { const u = i / N, n = pts.length - 1, k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k;
      q.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]); }
    // weiche Kurve durch die Punkte (Catmull-Rom über die Stützpunkte)
    const cr = (u) => { const n = pts.length - 1, s = Math.min(n - 1e-6, u * n), k = Math.floor(s), f = s - k, p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(n, k + 2)];
      const c = (a, b, c2, d) => 0.5 * ((2 * b) + (-a + c2) * f + (2 * a - 5 * b + 4 * c2 - d) * f * f + (-a + 3 * b - 3 * c2 + d) * f * f * f);
      return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]; };
    const pt = Array.from({ length: N + 1 }, (_, i) => cr(i / N));
    g.strokeStyle = C('#c98f26'); g.lineWidth = Math.max(0.8, (w * 2 + 0.5) * z); g.lineCap = 'round'; g.lineJoin = 'round'; path(pt, false); g.stroke();
    g.strokeStyle = C('#f2c24e'); g.lineWidth = Math.max(0.7, w * 2 * z); path(pt, false); g.stroke();
    for (let i = 1; i < N; i++) { const [x, y] = pt[i], dx = pt[i + 1][0] - pt[i - 1][0], dy = pt[i + 1][1] - pt[i - 1][1], a = Math.atan2(dy, dx), s = i % 2 ? 1 : -1;
      g.beginPath(); g.ellipse(x + Math.cos(a + Math.PI / 2) * s * 0.35 * w * z, y + Math.sin(a + Math.PI / 2) * s * 0.35 * w * z, 0.9 * w * z, 0.55 * w * z, a + s * 0.7, 0, TAU);
      g.fillStyle = C(i % 4 < 2 ? '#ffd968' : '#f6c94a'); g.fill(); g.strokeStyle = C('#d29a2e'); g.lineWidth = Math.max(0.3, 0.18 * z); g.stroke(); }
    for (const [u, c] of [[0.3, PINK], [0.5, '#ffffff'], [0.68, LILA], [0.84, PINK]]) { const [x, y] = cr(u); rose(x, y, 0.75 * z, c); }   // eingeflochtene Blüten
    return cr;
  };

  const zopfturm = (opt) => (cx, cy, z, now = 0) => {
    const lit = sdLit(), { balkon = false, ranken = false } = opt;
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
    if (balkon) {                                                                                             // Balkonboden vor der Kammer (Kammer verdeckt den hinteren Teil)
      poly([...arc(cx, cy - (BH - 0.8) * z, BR * z, Math.PI, 0), ...arc(cx, cy - BH * z, BR * z, 0, Math.PI)], C('#7d5236'));
      ellipse(cx, cy - BH * z, BR * z, BR / 2 * z, C('#9a6a44'));
      g.strokeStyle = C('#85593a'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();
      for (let j = 1; j < 10; j++) { const t = j / 10 * Math.PI; g.moveTo(cx + KR * z * Math.cos(t), cy - BH * z + KR / 2 * z * Math.sin(t)); g.lineTo(cx + BR * z * Math.cos(t), cy - BH * z + BR / 2 * z * Math.sin(t)); }
      g.stroke();
    }
    cyl(cx, cy, KR, KR, K0 + 1.8, K1, z, '#f6ecd9', '#ead9bc', '#c3ae8e');
    poly([...arc(cx, cy - (K0 + 1.8) * z, KR * z, Math.PI, 0), ...arc(cx, cy - (K0 + 3) * z, KR * z, 0, Math.PI)], C('#d4c1a0'));   // Gesims
    courses(cx, cy, KR, KR, K0 + 3, K1, 3.4, z, '#cdb998');
    const wT = 0.62 * Math.PI, [wx, wy, wsx] = winAt(cx, cy, KR, wT, K0 + 4.2, 1.9, 7.4, z, lit ? '#ffd27a' : C('#5d4f73'), '#a88d64');   // Fenster mit Läden
    if (!lit) { g.save(); path([[wx - wsx, wy], [wx + wsx, wy], [wx + wsx, wy - 5.5 * z], [wx - wsx, wy - 5.5 * z]]); g.clip(); poly([[wx - wsx, wy - 5.5 * z], [wx + wsx, wy - 5.5 * z], [wx - wsx, wy - 1 * z]], 'rgba(255,255,255,0.12)'); g.restore(); }
    for (const s of [-1, 1]) poly([[wx + s * wsx, wy], [wx + s * (wsx + 1.5 * z), wy + 0.4 * z], [wx + s * (wsx + 1.5 * z), wy - 5.8 * z], [wx + s * wsx, wy - 6 * z]], C(s < 0 ? '#8a62c4' : '#7353a8'));
    poly([[wx - wsx - 0.6 * z, wy + 0.2 * z], [wx + wsx + 0.6 * z, wy + 0.2 * z], [wx + wsx + 0.4 * z, wy + 1.8 * z], [wx - wsx - 0.4 * z, wy + 1.8 * z]], C('#8a5a3c'));   // Blumenkasten
    for (let k = 0; k < 5; k++) rose(wx + (-1.6 + k * 0.8) * z * (wsx / (1.9 * z)), wy - 0.2 * z - (k % 2) * 0.5 * z, 0.55 * z, [PINK, '#ffffff', LILA, '#ffd23f', PINK][k]);
    if (lit) glowAt(wx, wy - 3 * z, 20 * z, z);
    if (balkon) {                                                                                             // Geländer vorn (Holzbalkon rund um die Kammer)
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.35 * z); g.beginPath();
      for (let j = 0; j <= 16; j++) { const t = j / 16 * Math.PI, x = cx + BR * z * Math.cos(t), y = cy - BH * z + BR / 2 * z * Math.sin(t); g.moveTo(x, y); g.lineTo(x, y - 3 * z); }
      g.stroke(); g.lineWidth = Math.max(0.6, 0.6 * z); g.beginPath(); arc(cx, cy - (BH + 3) * z, BR * z).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      for (let j = 1; j < 16; j += 3) { const t = j / 16 * Math.PI; rose(cx + BR * z * Math.cos(t), cy - (BH + 3) * z + BR / 2 * z * Math.sin(t), 0.6 * z, [PINK, LILA, '#ffffff'][j % 3]); }
    }
    // Dach: Kegel mit Überstand, Schindelreihen als Bögen, Rand dunkler
    const DR = KR + 2, D0 = K1, D1 = K1 + 22;
    ellipse(cx, cy - D0 * z, DR * z, DR / 2 * z, C('#4a3570'));
    const cone = [...arc(cx, cy - D0 * z, DR * z, Math.PI, 0), [cx, cy - D1 * z]];
    const rg = g.createLinearGradient(cx - DR * z, 0, cx + DR * z, 0); rg.addColorStop(0, C('#9a7ccc')); rg.addColorStop(0.45, C('#7b5ea7')); rg.addColorStop(1, C('#5a4287'));
    path(cone); g.fillStyle = rg; g.fill();
    g.strokeStyle = 'rgba(60,35,90,0.35)'; g.lineWidth = Math.max(0.4, 0.3 * z); g.beginPath();
    for (const f of [0.2, 0.4, 0.58, 0.74, 0.87]) { const r = DR * (1 - f) * z, y = cy - (D0 + (D1 - D0) * f) * z; arc(cx, y, r, 0.1, Math.PI - 0.1, 14).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); }
    for (let j = 1; j < 8; j++) { const t = j / 8 * Math.PI; g.moveTo(cx + DR * z * Math.cos(t), cy - D0 * z + DR / 2 * z * Math.sin(t)); g.lineTo(cx + DR * 0.2 * z * Math.cos(t), cy - (D0 + (D1 - D0) * 0.8) * z + DR * 0.1 * z * Math.sin(t)); }
    g.stroke();
    g.strokeStyle = C('#3f2c60'); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); arc(cx, cy - D0 * z, DR * z).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
    circle(cx, cy - D1 * z, 0.8 * z, C('#f5c84b'));
    const wave = Math.sin(now / 600) * 0.8;                                                                    // Wimpel flattert
    sdLine('#6b4f3a', 0.5, z, [[cx, cy - D1 * z], [cx, cy - (D1 + 6) * z]]);
    poly([[cx, cy - (D1 + 6) * z], [cx + 4.5 * z, cy - (D1 + 5 + wave * 0.5) * z], [cx, cy - (D1 + 3.6) * z]], C('#ffd23f'));
    // Ranken mit Rosen am Fuß (B: bis hoch zum Fenster in einer Spirale)
    const vine = ranken ? Array.from({ length: 40 }, (_, i) => { const u = i / 39, h = HB + u * (HT - HB - 3), t = Math.PI * (0.88 + 0.05 * Math.sin(u * Math.PI * 3.2) - u * 0.1), r = rAt(R0, R1, HB, HT, h) + 0.3;
      return [cx + r * z * Math.cos(t), cy - h * z + r / 2 * z * Math.sin(t)]; })
      : [[cx - 6.4 * z, cy + 2 * z], [cx - 6.8 * z, cy - 5 * z], [cx - 5.6 * z, cy - 11 * z], [cx - 6.6 * z, cy - 17 * z], [cx - 5.4 * z, cy - 22 * z]];
    g.strokeStyle = C('#4f7f33'); g.lineWidth = Math.max(0.5, 0.6 * z); g.lineCap = 'round'; path(vine, false); g.stroke();
    vine.forEach((p, i) => { if (i % (ranken ? 2 : 1)) return; leaf(p[0] + (i % 4 ? 1 : -1) * 0.8 * z, p[1], 1 * z, i * 0.9, i % 3 ? '#6fb04a' : '#5a9a3c');
      if (i % (ranken ? 6 : 2) === (ranken ? 0 : 1) || i === vine.length - 1) rose(p[0] + 0.6 * z, p[1] - 0.6 * z, 0.9 * z, [PINK, '#e8546f', '#ffffff'][i % 3]); });
    for (const [dx, r] of [[-9.5, 2.2], [-7, 1.8]]) { sdBlob(cx + dx * z, cy + 3.2 * z, z, [[0, 0, r]], '#5a9a3c', '#6fb04a'); rose(cx + (dx + 0.6) * z, cy + 1.8 * z, 0.8 * z, PINK); }
    // Zopf vom Fenster bis auf die Wiese, unten eingerollt mit Schleife
    const sx = wx + wsx * 0.3, sy = wy + 1.6 * z, rr = rAt(R0, R1, HB, HT, 30);
    const cr = braid([[sx, sy], [sx - 1 * z, cy - 46 * z], [cx - rr * 0.5 * z + 1.5 * z, cy - 32 * z], [cx - rr * 0.3 * z, cy - 17 * z], [cx - 1 * z, cy - 4 * z], [cx + 2 * z, cy + 3.6 * z], [cx + 6 * z, cy + 4.4 * z], [cx + 7.4 * z, cy + 2.6 * z], [cx + 5 * z, cy + 1.8 * z]], z, now);
    const bo = cr(0.94); for (const s of [-1, 1]) poly([[bo[0], bo[1]], [bo[0] + s * 1.8 * z, bo[1] - 1 * z], [bo[0] + s * 1.8 * z, bo[1] + 1 * z]], C('#e8546f')); circle(bo[0], bo[1], 0.5 * z, C('#c93a58'));
  };

  // ── Laternenboot ──────────────────────────────────────────────────────────────────────────────────────────────────────
  // Ballon-Laterne wie bei den Himmelslaternen (Spiel: balloonLantern), hier mit Deckkraft zum Ein-/Ausblenden
  const balloonLantern = (x, y, w, z, lit) => {
    const W = w * z, H = 2.3 * W;
    const pth = () => { g.beginPath(); g.moveTo(x - 0.5 * W, y); g.bezierCurveTo(x - 0.95 * W, y - 0.3 * H, x - 1.05 * W, y - 0.75 * H, x - 0.7 * W, y - 0.93 * H);
      g.quadraticCurveTo(x, y - 1.12 * H, x + 0.7 * W, y - 0.93 * H); g.bezierCurveTo(x + 1.05 * W, y - 0.75 * H, x + 0.95 * W, y - 0.3 * H, x + 0.5 * W, y); g.closePath(); };
    const gr = g.createRadialGradient(x, y - 0.15 * H, 0, x, y - 0.35 * H, H * 0.95);
    gr.addColorStop(0, lit ? '#fffbe0' : C('#fff3c4')); gr.addColorStop(0.45, lit ? '#ffe39a' : C('#ffd58f')); gr.addColorStop(1, lit ? '#ffb85c' : C('#f2a35a'));
    pth(); g.fillStyle = gr; g.fill();
    g.save(); pth(); g.clip(); g.fillStyle = 'rgba(190,100,40,0.16)'; g.fillRect(x + 0.25 * W, y - 1.2 * H, W, 1.3 * H); g.restore();
    g.strokeStyle = lit ? 'rgba(230,150,60,0.5)' : 'rgba(200,120,50,0.35)'; g.lineWidth = Math.max(0.4, 0.14 * z);
    for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x + k * 0.5 * W, y); g.bezierCurveTo(x + k * 0.95 * W, y - 0.3 * H, x + k * 1.05 * W, y - 0.75 * H, x + k * 0.5 * W, y - H); g.stroke(); }
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.16 * z); g.beginPath(); g.ellipse(x, y, 0.5 * W, 0.14 * W, 0, 0, TAU); g.stroke();
    ellipse(x, y - 0.12 * W, 0.2 * W, 0.3 * W, lit ? '#fff7c8' : C('#ffb23a')); circle(x, y - 0.06 * W, 0.1 * W, '#ffffff');
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
    const wl = P(-0.13, 0, 2 + bob); balloonLantern(wl[0], wl[1], 1.5, z, lit);                                   // noch im Boot
    if (lit) glowAt(wl[0], wl[1] - 1.5 * z, 12 * z, z);
    return G(0, 0);
  };
  // A: Laternen steigen vom Boot auf, werden oben kleiner und blenden aus (Schleife); B: schweben als Wolke über dem Boot und wiegen sich
  const laternenboot = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit(), N = mode === 'steigen' ? 6 : 7;
    const lan = Array.from({ length: N }, (_, k) => {
      if (mode === 'steigen') { const p = ((now / 16000) + k / N) % 1, a = Math.min(1, p / 0.08, (1 - p) / 0.18);
        return { x: cx + (Math.sin(k * 2.3) * 6 + Math.sin(now / 1500 + k) * 1.4 + p * 4 * Math.sin(k)) * z, y: cy - (9 + p * 58) * z, w: 3 - p * 1.2, a }; }
      const sp = [[-8, -24], [4, -28], [10, -40], [-3, -42], [-11, -52], [5, -56], [-2, -66]][k];
      return { x: cx + (sp[0] + Math.sin(now / 1700 + k * 1.3) * 0.9) * z, y: cy + (sp[1] + Math.sin(now / 1100 + k * 2.1) * 1.2) * z, w: 2.8 - k * 0.12, a: 1 };
    });
    pond(cx, cy, z, now, lit);
    g.save(); const ref = []; ref.push(...lan); for (const l of ref) { const ry = cy + 2 * z + (cy - l.y) * 0.08, rx = l.x;   // Spiegelbilder im Wasser
      g.globalAlpha = l.a * (lit ? 0.55 : 0.12); ellipse(rx, ry, 1.2 * l.w * z, 0.35 * l.w * z, lit ? '#ffd88a' : '#ffe2a8'); } g.restore();
    boot(cx, cy, z, now, lit);
    for (const l of lan.slice().sort((p, q) => p.w - q.w)) { g.save(); g.globalAlpha = l.a; balloonLantern(l.x, l.y, l.w, z, lit); g.restore();
      if (lit && l.a > 0.5) glowAt(l.x, l.y - 1.2 * l.w * z, l.w * 7 * z, z); }
  };

  const alt = (sammlung, name) => (cx, cy, z, now) => SD_WAREN[sammlung].find(e => e[0] === name)[1](cx, cy, z, now || 0);
  window.ENTW_P6 = {
    'Turm mit Zopf: bisher': alt('TURM', 'Turm mit Zopf ✦'),
    'Turm A: höher, Steinreihen, Kammer, Zopf': zopfturm({}),
    'Turm B: dazu Balkon und Rosenranke': zopfturm({ balkon: true, ranken: true }),
    'Laternenboot: bisher': alt('TURM', 'Laternenboot'),
    'Laternenboot A: Laternen steigen auf': laternenboot('steigen'),
    'Laternenboot B: Laternen schweben darüber': laternenboot('schweben'),
  };
})();
