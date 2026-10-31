// Entwürfe Paket 9 Inselleben (Basar-Durchsicht 31.10.2026): Hängematte, Picknickdecke, Fossil, Strandkorb. Form wie SD_ART plus now.
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p9.js')).text())
(() => {
  const TAU = Math.PI * 2, PINK = '#ff9ec0', ROSE = '#e8546f';
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const box3 = (K, a0, a1, b0, b1, h0, h1, top, fa, fb) => { const P = K.P;
    poly([P(a1, b0, h0), P(a1, b1, h0), P(a1, b1, h1), P(a1, b0, h1)], fa);
    poly([P(a0, b1, h0), P(a1, b1, h0), P(a1, b1, h1), P(a0, b1, h1)], fb);
    poly([P(a0, b0, h1), P(a1, b0, h1), P(a1, b1, h1), P(a0, b1, h1)], top); };
  const sand = (cx, cy, rx, z) => { ellipse(cx, cy + 0.6 * z, rx * z, rx * 0.44 * z, C('#e2c98f')); ellipse(cx - 0.5 * z, cy + 0.2 * z, rx * 0.9 * z, rx * 0.38 * z, C('#f0dcaa'));
    for (let k = 0; k < 6; k++) { const a = k * 2.1, d = 0.3 + (k % 3) * 0.2; circle(cx + Math.cos(a) * rx * d * z, cy + Math.sin(a) * rx * 0.36 * d * z, 0.25 * z, C('#d6bd84')); } };

  // ── Palme (für die Hängematte) ────────────────────────────────────────────────────────────────────────────────────────
  const palm = (x, y, z, lean, H = 24) => {
    const top = [x + lean * z, y - H * z];
    for (let i = 0; i < 9; i++) { const t0 = i / 9, t1 = (i + 1) / 9, p0 = [x + lean * z * t0 * t0, y - H * z * t0], p1 = [x + lean * z * t1 * t1, y - H * z * t1], w0 = (1.5 - t0 * 0.5) * z, w1 = (1.5 - t1 * 0.5) * z;
      poly([[p0[0] - w0, p0[1]], [p0[0] + w0, p0[1]], [p1[0] + w1, p1[1] + 0.3 * z], [p1[0] - w1, p1[1] + 0.3 * z]], C(i % 2 ? '#a07848' : '#8e6a3e'));
      sdLine('#6e5030', 0.25, z, [[p1[0] - w1, p1[1] + 0.3 * z], [p1[0] + w1, p1[1] - 0.1 * z]]); }
    for (const [a, l, c] of [[3.6, 11, '#3f8a3e'], [2.6, 10, '#4f9e4a'], [0.4, 10, '#4f9e4a'], [-0.5, 11, '#3f8a3e'], [1.6, 8, '#5db556'], [4.6, 8.5, '#5db556'], [-1.5, 8, '#5db556']]) {
      const dir = [Math.cos(a), Math.sin(a) * 0.55 - 0.35], end = [top[0] + dir[0] * l * z, top[1] + (dir[1] * l + l * 0.42) * z], mid = [top[0] + dir[0] * l * 0.55 * z, top[1] + (dir[1] * l * 0.55 - 2.2) * z];
      g.strokeStyle = C(c); g.lineCap = 'round'; g.lineWidth = Math.max(0.5, 0.5 * z); g.beginPath(); g.moveTo(...top); g.quadraticCurveTo(...mid, ...end); g.stroke();
      for (let k = 1; k <= 7; k++) { const u = k / 8, px = (1 - u) * (1 - u) * top[0] + 2 * (1 - u) * u * mid[0] + u * u * end[0], py = (1 - u) * (1 - u) * top[1] + 2 * (1 - u) * u * mid[1] + u * u * end[1], ll = (1 - u * 0.6) * 2.4 * z;
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + (-dir[1] * s * 0.6 + dir[0] * 0.5) * ll, py + (dir[0] * s * 0.6 + 0.9) * ll); g.lineWidth = Math.max(0.4, 0.55 * z); g.stroke(); } } }
    for (const [dx, dy] of [[-0.8, 1], [0.7, 1.2], [0, 1.9]]) circle(top[0] + dx * z, top[1] + dy * z, 0.9 * z, C('#6b4a2a'));   // Kokosnüsse
    return top;
  };

  // ── Hängematte ────────────────────────────────────────────────────────────────────────────────────────────────────────
  // gestreifte Stoff-Hängematte (kit, längs b), quer gewölbt, Seile fächern zu den Enden; A: zwischen zwei Palmen, B: auf Holzgestell mit Tischchen
  const hammock = (K, z, B0, HE, cols, now) => {
    const P = K.P, L = 0.27, S = 4.2, W = 0.075, sw = Math.sin(now / 1400) * 0.012;
    const hc = b => HE - S * (1 - (b / L) ** 2), bs = Array.from({ length: 17 }, (_, i) => -L + i / 16 * 2 * L);
    const strip = (a0, a1, col) => { const h = a => (a / W) ** 2 * 1.4; poly([...bs.map(b => P(a0 + sw * (1 - (b / L) ** 2), b, hc(b) + h(a0))), ...bs.slice().reverse().map(b => P(a1 + sw * (1 - (b / L) ** 2), b, hc(b) + h(a1)))], C(col)); };
    const n = cols.length; for (let i = 0; i < n; i++) strip(-W + i * 2 * W / n, -W + (i + 1) * 2 * W / n, cols[i]);
    sdLine('#ffffff', 0.25, z, bs.map(b => P(W + sw * (1 - (b / L) ** 2), b, hc(b) + 1.4)));
    for (const s of [-1, 1]) { const e = P(0, s * B0, HE + 2); for (const a of [-W, -W / 2, 0, W / 2, W]) sdLine('#d9c7a3', 0.25, z, [P(a, s * L, HE + (a / W) ** 2 * 1.4), e]); }   // Seile
    const pl = P(0.01 + sw, -L + 0.06, hc(-L + 0.06) + 1.3); ellipse(pl[0], pl[1], 2.4 * z, 1.2 * z, C('#ffffff')); ellipse(pl[0] - 0.3 * z, pl[1] - 0.3 * z, 1.8 * z, 0.7 * z, C('#f3f3f3'));   // Kissen
  };
  const haengematte = (mode) => (cx, cy, z, now = 0) => {
    const K = kit(cx, cy, z, 0), P = K.P;
    if (mode === 'palmen') {
      sand(cx, cy, 16, z);
      const t1 = palm(...P(0, -0.42, 0), z, -2.2), t2 = P(0, 0.42, 0);
      hammock(K, z, 0.42, 11, ['#ff8a5c', '#ffd23f', '#5fc6d6', '#ff8a5c', '#ffd23f'], now);
      palm(...t2, z, 2.4, 22);
      for (const [a, b] of [[0.2, -0.1], [0.18, 0.05]]) { const p = P(a, b, 0); ellipse(p[0], p[1], 1.4 * z, 0.7 * z, C('#f4a6b6')); }   // Muscheln
    } else {
      sdShadow(cx, cy, 13, z);
      const wood = '#9a6a44';                                                                                         // geschwungenes Holzgestell
      g.strokeStyle = C(wood); g.lineWidth = Math.max(1, 1.4 * z); g.lineCap = 'round'; g.beginPath();
      g.moveTo(...P(0, -0.42, 12)); g.quadraticCurveTo(...P(0, -0.3, -2), ...P(0, 0, 0.6)); g.quadraticCurveTo(...P(0, 0.3, -2), ...P(0, 0.42, 12)); g.stroke();
      for (const s of [-1, 1]) { box3(K, -0.06, 0.06, s * 0.03 - 0.02, s * 0.03 + 0.02, 0, 0.8, C('#b88a58'), C('#7d5236'), C('#8a5a3c')); }   // Fuß
      hammock(K, z, 0.42, 11, ['#3f8a9e', '#ffffff', '#3f8a9e', '#ffffff', '#3f8a9e'], now);
      const T = P(0.2, 0.3, 0); poly([[T[0] - 0.3 * z, T[1]], [T[0] + 0.3 * z, T[1]], [T[0] + 0.3 * z, T[1] - 4.6 * z], [T[0] - 0.3 * z, T[1] - 4.6 * z]], C('#7d5236'));   // Tischchen
      ellipse(T[0], T[1] - 4.6 * z, 2.4 * z, 1.1 * z, C('#b88a58'));
      poly([[T[0] - 0.7 * z, T[1] - 4.8 * z], [T[0] + 0.7 * z, T[1] - 4.8 * z], [T[0] + 1 * z, T[1] - 7.6 * z], [T[0] - 1 * z, T[1] - 7.6 * z]], 'rgba(255,220,120,0.85)');   // Glas Limonade
      sdLine('#e8546f', 0.3, z, [[T[0] + 0.3 * z, T[1] - 7.2 * z], [T[0] + 1.3 * z, T[1] - 9 * z]]); circle(T[0] - 0.6 * z, T[1] - 7.5 * z, 0.5 * z, C('#ffd23f'));
    }
  };

  // ── Picknickdecke ─────────────────────────────────────────────────────────────────────────────────────────────────────
  // karierte Decke (kit), eine Ecke umgeschlagen; Weidenkorb mit Deckel und Baguette, Teller mit Melone, Äpfel, Becher, Flasche Limonade;
  // A: rot-weiß, B: blau-weiß mit Sonnenschirm
  const picknick = (mode) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, D = 0.27, col = mode === 'rot' ? '#e8546f' : '#4f8fd6';
    const quad = (a0, a1, b0, b1, h = 0.15) => [P(a0, b0, h), P(a1, b0, h), P(a1, b1, h), P(a0, b1, h)];
    poly([P(-D, -D, 0), P(D, -D, 0), P(D - 0.06, D, 0), P(D, D, 0), P(-D, D, 0)].map(p => [p[0], p[1] + 0.3 * z]), 'rgba(40,60,20,0.18)');
    poly(quad(-D, D, -D, D), C('#ffffff'));
    g.save(); path(quad(-D, D, -D, D)); g.clip(); g.globalAlpha = 0.55;                                              // Karomuster: Streifen in beide Richtungen
    for (let i = 0; i < 8; i++) { const a0 = -D + i * 2 * D / 8; if (i % 2) continue; poly(quad(a0, a0 + 2 * D / 8, -D, D), C(col)); poly(quad(-D, D, a0, a0 + 2 * D / 8), C(col)); }
    g.globalAlpha = 1; g.restore();
    poly([P(D, D - 0.12, 0.15), P(D, D, 0.15), P(D - 0.12, D, 0.15)], C('#f6f1ea'));                                // umgeschlagene Ecke
    poly([P(D - 0.12, D, 0.2), P(D, D - 0.12, 0.2), P(D - 0.09, D - 0.09, 0.4)], C(shade(col, -0.05)));
    const w = '#d9a35c', wd = '#b5803e';                                                                             // Weidenkorb
    box3(K, -0.18, -0.03, -0.17, 0.02, 0, 4.4, C('#e8bd78'), C(wd), C(w));
    g.strokeStyle = C('#9a6a34'); g.lineWidth = Math.max(0.3, 0.22 * z); g.beginPath();
    for (const h of [1.1, 2.2, 3.3]) { g.moveTo(...P(-0.03, -0.17, h)); g.lineTo(...P(-0.03, 0.02, h)); g.lineTo(...P(-0.18, 0.02, h)); }
    for (let k = 1; k < 5; k++) { const b = -0.17 + k * 0.038; g.moveTo(...P(-0.03, b, 0)); g.lineTo(...P(-0.03, b, 4.4)); } g.stroke();
    poly([P(-0.18, -0.17, 4.4), P(-0.105, -0.17, 4.4), P(-0.105, 0.02, 4.4), P(-0.18, 0.02, 4.4)], C('#c99050'));     // Deckel (halb offen)
    poly([P(-0.105, -0.17, 4.4), P(-0.03, -0.17, 6.6), P(-0.03, 0.02, 6.6), P(-0.105, 0.02, 4.4)], C('#e0b06a'));
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.moveTo(...P(-0.105, -0.15, 4.4)); g.quadraticCurveTo(...P(-0.105, -0.075, 11), ...P(-0.105, 0, 4.4)); g.stroke();   // Henkel
    const bg0 = P(-0.12, -0.04, 4), bg1 = P(-0.06, -0.12, 9); g.strokeStyle = C('#d99a4e'); g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(...bg0); g.lineTo(...bg1); g.stroke();   // Baguette
    g.strokeStyle = C('#f2c98a'); g.lineWidth = Math.max(0.3, 0.25 * z); for (let k = 1; k < 4; k++) { const u = k / 4, p = [bg0[0] + (bg1[0] - bg0[0]) * u, bg0[1] + (bg1[1] - bg0[1]) * u]; g.beginPath(); g.moveTo(p[0] - 0.5 * z, p[1] + 0.2 * z); g.lineTo(p[0] + 0.3 * z, p[1] - 0.4 * z); g.stroke(); }
    const pl = P(0.12, -0.06, 0.2); ellipse(pl[0], pl[1], 3.2 * z, 1.6 * z, C('#ffffff')); ellipse(pl[0], pl[1] - 0.1 * z, 2.5 * z, 1.15 * z, C('#eef2f5'));   // Teller mit Melone
    for (const [dx, s] of [[-1, 1], [1.1, -1]]) { const x = pl[0] + dx * z, y = pl[1] - 0.4 * z; g.beginPath(); g.moveTo(x - 1.4 * z, y); g.arc(x, y, 1.4 * z, Math.PI, 0); g.closePath(); g.fillStyle = C('#3f8a3e'); g.fill();
      g.beginPath(); g.moveTo(x - 1.15 * z, y); g.arc(x, y, 1.15 * z, Math.PI, 0); g.closePath(); g.fillStyle = C('#ff5c6c'); g.fill(); for (const k of [-0.5, 0, 0.5]) circle(x + k * z, y - 0.5 * z, 0.12 * z, C('#2a2a2a')); }
    for (const [a, b, c] of [[0.05, 0.14, '#d6303a'], [0.09, 0.19, '#7cc34a'], [0.0, 0.2, '#d6303a']]) { const p = P(a, b, 0.2); circle(p[0], p[1] - 1 * z, 1.1 * z, C(c)); circle(p[0] - 0.35 * z, p[1] - 1.35 * z, 0.35 * z, 'rgba(255,255,255,0.6)'); sdLine('#6b4a2a', 0.2, z, [[p[0], p[1] - 2 * z], [p[0] + 0.2 * z, p[1] - 2.6 * z]]); }   // Äpfel
    for (const [a, b] of [[0.18, 0.06], [0.21, 0.12]]) { const p = P(a, b, 0.2); poly([[p[0] - 0.9 * z, p[1]], [p[0] + 0.9 * z, p[1]], [p[0] + 1.05 * z, p[1] - 2.2 * z], [p[0] - 1.05 * z, p[1] - 2.2 * z]], C(col)); ellipse(p[0], p[1] - 2.2 * z, 1.05 * z, 0.4 * z, C('#ffffff')); }   // Becher
    const bt = P(-0.05, 0.16, 0.2); poly([[bt[0] - 0.9 * z, bt[1]], [bt[0] + 0.9 * z, bt[1]], [bt[0] + 0.9 * z, bt[1] - 4 * z], [bt[0] + 0.4 * z, bt[1] - 5 * z], [bt[0] + 0.4 * z, bt[1] - 6.2 * z], [bt[0] - 0.4 * z, bt[1] - 6.2 * z], [bt[0] - 0.4 * z, bt[1] - 5 * z], [bt[0] - 0.9 * z, bt[1] - 4 * z]], 'rgba(255,225,120,0.85)');   // Flasche
    poly([[bt[0] - 0.9 * z, bt[1] - 1.6 * z], [bt[0] + 0.9 * z, bt[1] - 1.6 * z], [bt[0] + 0.9 * z, bt[1] - 2.8 * z], [bt[0] - 0.9 * z, bt[1] - 2.8 * z]], C('#ffffff')); poly([[bt[0] - 0.45 * z, bt[1] - 6.2 * z], [bt[0] + 0.45 * z, bt[1] - 6.2 * z], [bt[0] + 0.45 * z, bt[1] - 6.8 * z], [bt[0] - 0.45 * z, bt[1] - 6.8 * z]], C(ROSE));
    sdLine('rgba(255,255,255,0.8)', 0.25, z, [[bt[0] - 0.55 * z, bt[1] - 0.5 * z], [bt[0] - 0.55 * z, bt[1] - 3.6 * z]]);
    if (mode !== 'rot') {                                                                                             // Sonnenschirm
      const base = P(-0.22, 0.24, 0), tp = [base[0], base[1] - 24 * z]; sdLine('#ffffff', 0.6, z, [base, tp]);
      const R = 13, ap = [tp[0], tp[1] - 2.6 * z], M = 8;
      for (let k = M - 1; k >= 0; k--) { const t0 = k / M * Math.PI, t1 = (k + 1) / M * Math.PI, e = t => [tp[0] + Math.cos(t) * R * z, tp[1] + Math.sin(t) * R / 2 * z + 2 * z];
        g.beginPath(); g.moveTo(...ap); g.lineTo(...e(t0)); g.quadraticCurveTo(...e((t0 + t1) / 2).map((v, i) => i ? v - 0.8 * z : v), ...e(t1)); g.closePath(); g.fillStyle = C(shade(k % 2 ? '#ffffff' : col, -0.12 * Math.max(0, Math.cos((t0 + t1) / 2 - 2.2)))); g.fill(); }
      circle(ap[0], ap[1], 0.6 * z, C('#ffffff'));
    }
  };

  // ── Fossil ────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // A: großer Ammonit (Spirale mit Rippen) in einer Steinplatte auf einem Sockel mit Messingschild; B: kleines Dino-Skelett auf einem Sockel
  const stonePlinth = (K, z, H) => { box3(K, -0.12, 0.12, -0.12, 0.12, 0, H, C('#8a6a4a'), C('#5e4430'), C('#74543a'));
    poly([K.P(0.12, -0.05, H * 0.35), K.P(0.12, 0.05, H * 0.35), K.P(0.12, 0.05, H * 0.75), K.P(0.12, -0.05, H * 0.75)], C('#d9b25a')); };   // Schild
  const fossil = (mode) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P;
    sdShadow(cx, cy, 9, z);
    stonePlinth(K, z, 3);
    if (mode === 'ammonit') {
      const a0 = -0.03, a1 = 0.03, B = 0.13, h0 = 3, h1 = 19;                                                          // Steinplatte, oben unregelmäßig
      const topF = b => h1 + Math.sin(b * 30) * 0.8 - (b / B) ** 2 * 3;
      const bs = Array.from({ length: 11 }, (_, i) => -B + i / 10 * 2 * B);
      poly([P(a1, -B, h0), P(a1, B, h0), ...bs.slice().reverse().map(b => P(a1, b, topF(b)))], C('#cfc4ae'));        // Vorderseite
      poly([P(a0, B, h0), P(a1, B, h0), P(a1, B, topF(B)), P(a0, B, topF(B))], C('#b3a78f'));
      poly([...bs.map(b => P(a0, b, topF(b))), ...bs.slice().reverse().map(b => P(a1, b, topF(b)))], C('#e2d9c6'));
      for (const [b, h, r] of [[-0.09, 6, 0.5], [0.08, 16, 0.4], [0.1, 6, 0.35]]) { const p = P(a1, b, h); circle(p[0], p[1], r * z, C('#b8ad96')); }   // Poren
      const cc = P(a1, 0, 11), c = [0, 0], turn = 3.2, R0 = 6.2 * z;                                                 // Ammonit: Spirale mit Rippen, liegt in der Plattenfläche
      g.save(); g.translate(...cc); g.transform(0.894, -0.447, 0, 1, 0, 0);
      const sp = t => { const r = R0 * Math.exp(-0.11 * t), a = -t + 0.6; return [c[0] + Math.cos(a) * r * 0.95, c[1] + Math.sin(a) * r]; };   // je Windung halb so groß
      g.beginPath(); for (let i = 0; i <= 120; i++) { const p = sp(i / 120 * turn * TAU / 1); i ? g.lineTo(...p) : g.moveTo(...p); }
      const gr = g.createRadialGradient(c[0] - 1.5 * z, c[1] - 1.5 * z, 0.5 * z, c[0], c[1], R0); gr.addColorStop(0, C('#f1e4c6')); gr.addColorStop(1, C('#c9a36a'));
      g.beginPath(); g.arc(c[0], c[1], R0 * 1.02, 0, TAU); g.fillStyle = gr; g.fill();
      g.strokeStyle = C('#8a6a3e'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); for (let i = 0; i <= 160; i++) { const p = sp(i / 160 * turn * TAU); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
      g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();                                                            // Rippen zwischen den Windungen
      for (let i = 0; i < 40; i++) { const t = i / 40 * (turn - 1) * TAU, p = sp(t), q = sp(t + TAU); g.moveTo(p[0] + (q[0] - p[0]) * 0.08, p[1] + (q[1] - p[1]) * 0.08); g.lineTo(q[0] + (p[0] - q[0]) * 0.1, q[1] + (p[1] - q[1]) * 0.1); } g.stroke();
      g.beginPath(); g.arc(c[0], c[1], R0 * 1.02, 0, TAU); g.strokeStyle = C('#7a5a32'); g.lineWidth = Math.max(0.4, 0.5 * z); g.stroke();
      ellipse(c[0] - 2.4 * z, c[1] - 2.6 * z, 1.6 * z, 0.8 * z, 'rgba(255,255,255,0.35)');
      g.restore();
    } else {
      const Bc = '#f3ecdf', Be = '#c9bba2', X = (a, b) => [cx + a * z, cy - b * z];                                  // Dino-Skelett (Seitenansicht, Kopf rechts)
      const bone = (pts, w) => { g.strokeStyle = C(Be); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = (w + 0.5) * z; path(pts.map(p => X(...p)), false); g.stroke(); g.strokeStyle = C(Bc); g.lineWidth = w * z; g.stroke(); };
      for (const s of [-1, 1]) { const o = s * 0.4; bone([[-2.4 + o, 9], [-3.2 + o, 6.2], [-2.2 + o, 3.6]], 0.9); bone([[2.6 + o, 9.6], [3.4 + o, 6.6], [2.8 + o, 3.6]], 0.8); }   // Beine
      for (const s of [-1, 1]) { sdLine(Bc, 0.7, z, [X(-2.2 + s * 0.4, 3.6), X(-1.2 + s * 0.4, 3.4)]); sdLine(Bc, 0.7, z, [X(2.8 + s * 0.4, 3.6), X(3.8 + s * 0.4, 3.4)]); }   // Füße
      const spine = [[-11, 6], [-8.5, 8.2], [-5.5, 10], [-2.5, 11], [0.5, 11.2], [3.5, 11.6], [5.5, 13.2], [6.8, 15.2]];
      for (let k = 1; k < 7; k++) { const x = -3 + k * 1.1, top = 10.9 + k * 0.08; g.strokeStyle = C(Be); g.lineWidth = 0.75 * z; g.beginPath(); g.moveTo(...X(x, top)); g.quadraticCurveTo(...X(x + 0.9, top - 2.6), ...X(x + 0.2, top - 4.6)); g.stroke();
        g.strokeStyle = C(Bc); g.lineWidth = 0.5 * z; g.stroke(); }                                                    // Rippen
      bone(spine, 0.85);
      for (const p of spine) circle(...X(...p), 0.55 * z, C(Bc));                                                       // Wirbel
      ellipse(...X(-2.6, 9.6), 1.6 * z, 1.1 * z, C(Bc));                                                                // Becken
      const hx = 8.2, hy = 15.6;                                                                                         // Schädel mit Kiefer und Zähnen
      path([X(hx - 1.6, hy + 1.6), X(hx + 2.4, hy + 1.4), X(hx + 4.2, hy + 0.2), X(hx + 4, hy - 0.8), X(hx - 1.2, hy - 0.6)]); g.fillStyle = C(Bc); g.fill(); g.strokeStyle = C(Be); g.lineWidth = Math.max(0.3, 0.3 * z); g.stroke();
      path([X(hx - 0.8, hy - 1), X(hx + 3.6, hy - 1.4), X(hx + 3.2, hy - 2.4), X(hx - 0.6, hy - 2)]); g.fill(); g.stroke();
      for (let k = 0; k < 5; k++) { const x = hx + 0.4 + k * 0.7; poly([X(x, hy - 0.7), X(x + 0.3, hy - 0.7), X(x + 0.15, hy - 1.3)], '#ffffff'); }
      circle(...X(hx + 0.6, hy + 0.5), 0.6 * z, C('#8a7a62')); circle(...X(hx + 2.4, hy + 0.3), 0.35 * z, C('#8a7a62'));
      sdLine('#9a8a6e', 0.25, z, [X(-2, 2.8), X(-2, 0.2)]); poly([X(-2.6, 0.2), X(-1.4, 0.2), X(-1.6, -0.6), X(-2.4, -0.6)], C('#9a8a6e'));   // Halter
      sdLine('#9a8a6e', 0.25, z, [X(3, 2.8), X(3, 0.2)]);
      const br = P(0.12, 0.22, 0); sdLine('#8a5a3c', 0.5, z, [br, [br[0] + 2.4 * z, br[1] - 1 * z]]); poly([[br[0] + 2.2 * z, br[1] - 1.5 * z], [br[0] + 3.4 * z, br[1] - 1.7 * z], [br[0] + 3.4 * z, br[1] - 0.6 * z], [br[0] + 2.4 * z, br[1] - 0.5 * z]], C('#e8d0a0'));   // Pinsel
    }
  };

  // ── Strandkorb ────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Strandkorb (kit, Öffnung nach vorn rechts): Korbgeflecht außen, gestreifter Stoff innen, Sitzpolster, gewölbtes Dach, ausgezogene Fußstützen,
  // Wimpel; auf Sand. A: blau-weiß mit Handtuch, B: rot-weiß mit Sandburg und Eimer
  const strandkorb = (mode) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, col = mode === 'blau' ? '#3f7fc6' : '#d9434f';
    sand(cx, cy, 13, z);
    const A0 = -0.12, A1 = 0.09, AF = 0.03, B = 0.15, H0 = 6, HB = 18, HF = 15.5;
    const wk = '#ead2a2', wkd = '#c9a970', wkm = '#dcbf88';
    const roof = (a, b) => { const t = (a - A0) / (AF - A0); return HB + (HF - HB) * t + 2.2 * Math.sin(Math.PI * t) - (b / B) ** 2 * 0.4; };
    box3(K, A0, A1, -B, B, 0, H0, C(wk), C(wkd), C(wkm));                                                         // Unterteil
    g.strokeStyle = C('#b5945c'); g.lineWidth = Math.max(0.3, 0.22 * z); g.beginPath();
    for (let h = 1.2; h < H0; h += 1.2) { g.moveTo(...P(A1, -B, h)); g.lineTo(...P(A1, B, h)); g.lineTo(...P(A0, B, h)); } g.stroke();
    const stripes = (pts4, n, c1, c2, dir) => { for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n, L = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      const [p0, p1, p2, p3] = pts4; poly(dir ? [L(p0, p1, u0), L(p0, p1, u1), L(p3, p2, u1), L(p3, p2, u0)] : [L(p0, p3, u0), L(p1, p2, u0), L(p1, p2, u1), L(p0, p3, u1)], C(i % 2 ? c2 : c1)); } };
    stripes([P(A0 + 0.01, -B, H0), P(A0 + 0.01, B, H0), P(A0 + 0.01, B, HB - 0.5), P(A0 + 0.01, -B, HB - 0.5)], 6, col, '#ffffff', true);   // Stoff innen hinten
    stripes([P(A0, -B + 0.01, H0), P(AF, -B + 0.01, H0), P(AF, -B + 0.01, HF), P(A0, -B + 0.01, HB - 0.5)], 4, shade(col, -0.15), '#e9e9ef', true);   // innen links
    box3(K, A0 + 0.01, A1 - 0.01, -B + 0.01, B - 0.01, H0, H0 + 1.2, C(shade(col, 0.15)), C(shade(col, -0.1)), C(col));   // Sitzpolster
    for (const b of [-0.08, 0.04]) box3(K, A1, A1 + 0.09, b, b + 0.05, 2.6, 3.3, C(wk), C(wkd), C(wkm));            // Fußstützen
    const ns = Array.from({ length: 9 }, (_, i) => A0 + i / 8 * (AF - A0));                                         // rechte Seitenwand außen mit Dachkante
    poly([P(A0, B, H0), P(AF, B, H0), ...ns.slice().reverse().map(a => P(a, B, roof(a, B)))], C(wkm));
    g.beginPath(); for (let h = H0 + 1.2; h < HF; h += 1.2) { g.moveTo(...P(A0, B, h)); g.lineTo(...P(AF, B, h)); } g.strokeStyle = C('#b5945c'); g.stroke();
    poly([P(AF, B, H0), P(AF + 0.012, B, H0), ...[P(AF + 0.012, B, HF + 0.2), P(AF, B, HF)]], C(wkd));
    poly([P(AF, -B, H0), P(AF + 0.012, -B, H0), P(AF + 0.012, -B, HF + 0.2), P(AF, -B, HF)], C(wkd));               // Vorderkante links
    const bs = [-B, B];
    poly([...ns.map(a => P(a, -B, roof(a, -B))), ...ns.slice().reverse().map(a => P(a, B, roof(a, B)))], C(wk));     // Dach
    g.beginPath(); for (let k = 1; k < 6; k++) { const b = -B + k * 2 * B / 6; ns.forEach((a, i) => i ? g.lineTo(...P(a, b, roof(a, b))) : g.moveTo(...P(a, b, roof(a, b)))); } g.strokeStyle = C('#c9a970'); g.stroke();
    poly([P(AF, -B, HF), P(AF, B, HF), P(AF + 0.015, B, HF - 0.6), P(AF + 0.015, -B, HF - 0.6)], C(col));            // Stoffkante vorn
    const fp = P(A0 + 0.03, 0.1, roof(A0 + 0.03, 0.1)); sdLine('#7d5236', 0.3, z, [fp, [fp[0], fp[1] - 5 * z]]);      // Wimpel
    poly([[fp[0], fp[1] - 5 * z], [fp[0] + 3 * z, fp[1] - 4.3 * z], [fp[0], fp[1] - 3.6 * z]], C(col));
    if (mode === 'blau') {                                                                                             // Handtuch im Sand
      const t = [P(0.14, -0.2, 0.1), P(0.26, -0.2, 0.1), P(0.26, 0.02, 0.1), P(0.14, 0.02, 0.1)]; poly(t, C('#ffd23f'));
      for (const b of [-0.15, -0.08, -0.01]) sdLine('#ffffff', 0.5, z, [P(0.14, b, 0.12), P(0.26, b, 0.12)]);
    } else {                                                                                                           // Sandburg und Eimer
      const s0 = P(0.2, -0.18, 0); poly([[s0[0] - 3 * z, s0[1]], [s0[0] + 3 * z, s0[1]], [s0[0] + 2.4 * z, s0[1] - 3 * z], [s0[0] - 2.4 * z, s0[1] - 3 * z]], C('#e8cf95'));
      poly([[s0[0] - 1.4 * z, s0[1] - 3 * z], [s0[0] + 1.4 * z, s0[1] - 3 * z], [s0[0] + 1.2 * z, s0[1] - 5.4 * z], [s0[0] - 1.2 * z, s0[1] - 5.4 * z]], C('#f0dcaa'));
      for (const d of [-1.2, 0, 1.2]) poly([[s0[0] + (d - 0.35) * z, s0[1] - 5.4 * z], [s0[0] + (d + 0.35) * z, s0[1] - 5.4 * z], [s0[0] + (d + 0.35) * z, s0[1] - 6.2 * z], [s0[0] + (d - 0.35) * z, s0[1] - 6.2 * z]], C('#f0dcaa'));
      sdLine('#7d5236', 0.2, z, [[s0[0], s0[1] - 6.2 * z], [s0[0], s0[1] - 8.6 * z]]); poly([[s0[0], s0[1] - 8.6 * z], [s0[0] + 1.6 * z, s0[1] - 8.1 * z], [s0[0], s0[1] - 7.6 * z]], C(col));
      const e0 = P(0.24, 0.08, 0); poly([[e0[0] - 1.3 * z, e0[1]], [e0[0] + 1.3 * z, e0[1]], [e0[0] + 1.7 * z, e0[1] - 2.8 * z], [e0[0] - 1.7 * z, e0[1] - 2.8 * z]], C('#4fb3e8')); ellipse(e0[0], e0[1] - 2.8 * z, 1.7 * z, 0.6 * z, C('#2f8fc8'));
      g.strokeStyle = C('#2f8fc8'); g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath(); g.ellipse(e0[0], e0[1] - 2.9 * z, 1.6 * z, 2 * z, 0, Math.PI, 0); g.stroke();
    }
  };

  // Strandkorb neu (Nutzer: „wtf ist das denn?“): klassische Form von vorn erkennbar – Kasten aus Korbgeflecht mit oben gewölbter Haube,
  // vorn eine runde Öffnung mit gestreiftem Stoff und Sitzpolster, darunter zwei Fußstützen-Schübe; Seite und Dach aus Geflecht
  const strandkorb2 = (col) => (cx, cy, z) => {
    const K = kit(cx, cy, z, 0), P = K.P, A0 = -0.1, A1 = 0.08, B = 0.17, HS = 17, HA = 3.2;
    sand(cx, cy, 13, z);
    const top = b => HS + HA * Math.sqrt(Math.max(0, 1 - (b / B) ** 2));
    const bs = Array.from({ length: 17 }, (_, i) => -B + i / 16 * 2 * B);
    const wk = '#ecd3a0', wkL = '#f4e2bb', wkD = '#cfae74', line = '#b8955a';
    poly([P(A0, B, 0), P(A1, B, 0), P(A1, B, top(B)), P(A0, B, top(B))], C(wkD));                                 // Seite (links)
    g.strokeStyle = C(line); g.lineWidth = Math.max(0.3, 0.22 * z); g.beginPath();
    for (let h = 1.2; h < HS; h += 1.2) { g.moveTo(...P(A0, B, h)); g.lineTo(...P(A1, B, h)); } g.stroke();
    poly([...bs.map(b => P(A0, b, top(b))), ...bs.slice().reverse().map(b => P(A1, b, top(b)))], C(wkL));             // Dach (gewölbt)
    const roofPts = [...bs.map(b => P(A0, b, top(b))), ...bs.slice().reverse().map(b => P(A1, b, top(b)))];
    g.save(); path(roofPts); g.clip(); g.beginPath(); for (const a of [A0 + 0.045, A0 + 0.09, A0 + 0.135]) bs.forEach((b, i) => i ? g.lineTo(...P(a, b, top(b))) : g.moveTo(...P(a, b, top(b)))); g.stroke(); g.restore();
    poly([P(A1, -B, 0), P(A1, B, 0), ...bs.slice().reverse().map(b => P(A1, b, top(b)))], C(wk));                    // Vorderseite
    g.beginPath(); for (let h = 1.2; h < 6.6; h += 1.2) { g.moveTo(...P(A1, -B, h)); g.lineTo(...P(A1, B, h)); } g.stroke();
    const OB = B - 0.035, O0 = 7, O1 = 14.2, OA = 2.6, otop = b => O1 + OA * Math.sqrt(Math.max(0, 1 - (b / OB) ** 2));   // Öffnung mit Bogen
    const ob = Array.from({ length: 17 }, (_, i) => -OB + i / 16 * 2 * OB), open = [P(A1, -OB, O0), P(A1, OB, O0), ...ob.slice().reverse().map(b => P(A1, b, otop(b)))];
    g.save(); path(open); g.clip();
    for (let i = 0; i < 8; i++) { const b0 = -OB + i * 2 * OB / 8, b1 = b0 + 2 * OB / 8; poly([P(A1, b0, O0), P(A1, b1, O0), P(A1, b1, O1 + OA + 1), P(A1, b0, O1 + OA + 1)], C(i % 2 ? '#ffffff' : col)); }
    const sh = g.createLinearGradient(0, P(A1, 0, O1 + OA)[1], 0, P(A1, 0, O0 + 3)[1]); sh.addColorStop(0, 'rgba(40,30,20,0.35)'); sh.addColorStop(1, 'rgba(40,30,20,0)');
    path(open); g.fillStyle = sh; g.fill();                                                                            // Schatten unter der Haube
    poly([P(A1, OB - 0.03, O0), P(A1, OB, O0), P(A1, OB, O1 + OA), P(A1, OB - 0.03, O1 + OA)], 'rgba(60,40,20,0.28)');   // Innenwand links im Schatten
    poly([P(A1, -OB, O0), P(A1, OB, O0), P(A1, OB, O0 + 1.6), P(A1, -OB, O0 + 1.6)], C(shade(col, 0.1)));               // Sitzpolster
    sdLine('rgba(255,255,255,0.7)', 0.3, z, [P(A1, -OB, O0 + 1.6), P(A1, OB, O0 + 1.6)]);
    g.restore();
    path(open, false); g.strokeStyle = C(line); g.lineWidth = Math.max(0.5, 0.6 * z); g.stroke();                       // Rahmen um die Öffnung
    g.strokeStyle = C(wkL); g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath(); ob.forEach((b, i) => { const p = P(A1 + 0.001, b, otop(b) + 0.6); i ? g.lineTo(...p) : g.moveTo(...p); }); g.stroke();
    for (const s of [-1, 1]) { const b = s * (OB - 0.01); box3(K, A1, A1 + 0.05, b - 0.025, b + 0.025, O0 + 1.6, O0 + 2.1, C(wkL), C(wkD), C(wk)); }   // Armlehnen-Tischchen
    for (const [b0, b1] of [[-OB, -0.01], [0.01, OB]]) { poly([P(A1 + 0.001, b0 + 0.01, 1.2), P(A1 + 0.001, b1 - 0.01, 1.2), P(A1 + 0.001, b1 - 0.01, 5.6), P(A1 + 0.001, b0 + 0.01, 5.6)], C(wkL));   // Fußstützen-Schübe
      g.strokeStyle = C(line); g.lineWidth = Math.max(0.3, 0.3 * z); path([P(A1 + 0.001, b0 + 0.01, 1.2), P(A1 + 0.001, b1 - 0.01, 1.2), P(A1 + 0.001, b1 - 0.01, 5.6), P(A1 + 0.001, b0 + 0.01, 5.6)]); g.stroke();
      const hm = P(A1 + 0.002, (b0 + b1) / 2, 4.4); ellipse(hm[0], hm[1], 0.9 * z, 0.35 * z, C('#8a5a3c')); }
    const fp = P((A0 + A1) / 2, 0.06, top(0.06)); sdLine('#7d5236', 0.3, z, [fp, [fp[0], fp[1] - 5 * z]]);              // Wimpel
    poly([[fp[0], fp[1] - 5 * z], [fp[0] + 3 * z, fp[1] - 4.3 * z], [fp[0], fp[1] - 3.6 * z]], C(col));
  };
  window.ENTW_NEU_KORB = { blau: strandkorb2('#3f7fc6'), rot: strandkorb2('#d9434f') };

  const alt = (name) => (cx, cy, z, now) => SD_WAREN.INSEL.find(e => e[0] === name)[1](cx, cy, z, now || 0);
  window.ENTW_P9 = {
    'Hängematte: bisher': alt('Hängematte'),
    'Hängematte A: zwischen Palmen': haengematte('palmen'),
    'Hängematte B: Holzgestell, Tischchen': haengematte('gestell'),
    'Picknickdecke: bisher': alt('Picknickdecke'),
    'Picknick A: rot-weiß kariert': picknick('rot'),
    'Picknick B: blau-weiß, Sonnenschirm': picknick('blau'),
    'Fossil: bisher': alt('Fossil ✦'),
    'Fossil A: Ammonit in Steinplatte': fossil('ammonit'),
    'Fossil B: Dino-Skelett auf Sockel': fossil('dino'),
    'Strandkorb: bisher': alt('Strandkorb'),
    'Strandkorb A: blau-weiß, Handtuch': strandkorb('blau'),
    'Strandkorb B: rot-weiß, Sandburg': strandkorb('rot'),
    'Strandkorb neu, blau-weiß': (cx, cy, z) => ENTW_NEU_KORB.blau(cx, cy, z),
    'Strandkorb neu, rot-weiß': (cx, cy, z) => ENTW_NEU_KORB.rot(cx, cy, z),
  };
})();
