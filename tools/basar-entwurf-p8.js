// Entwürfe Paket 8 Märchen, zweite Hälfte (Basar-Durchsicht 31.10.2026): Zauberspiegel, Einhorn, Krönchen-Laterne, Tanzpavillon.
// Form wie SD_ART plus now. Kein blauer Schein (glowQuad 'blue' zeigt im Spiel eine eckige Kante, AUFGABEN 6e2).
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p8.js')).text())
(() => {
  const TAU = Math.PI * 2, GOLD = '#f5c84b', GOLD_D = '#c9962a', PINK = '#ff9ec0', ROSE = '#e8546f', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const band = (cx, y0, r0, y1, r1) => { g.beginPath(); g.ellipse(cx, y0, r0, r0 / 2, 0, Math.PI, 0, true); g.ellipse(cx, y1, r1, r1 / 2, 0, 0, Math.PI); g.closePath(); };
  const cyl = (cx, cy, r0, r1, h0, h1, z, light, mid, dark, top) => {
    const gr = g.createLinearGradient(cx - r0 * z, 0, cx + r0 * z, 0); gr.addColorStop(0, C(light)); gr.addColorStop(0.45, C(mid)); gr.addColorStop(1, C(dark));
    band(cx, cy - h0 * z, r0 * z, cy - h1 * z, r1 * z); g.fillStyle = gr; g.fill();
    if (top) ellipse(cx, cy - h1 * z, r1 * z, r1 / 2 * z, C(top));
  };
  const twinkle = (x, y, s, col) => poly([[x, y - s], [x + 0.28 * s, y - 0.28 * s], [x + s, y], [x + 0.28 * s, y + 0.28 * s], [x, y + s], [x - 0.28 * s, y + 0.28 * s], [x - s, y], [x - 0.28 * s, y - 0.28 * s]], col);
  const flowers = (cx, cy, z, n, seed, rx = 10, ry = 4.4) => { for (let k = 0; k < n; k++) { const a = seed + k * 2.39, d = 0.35 + ((k * 37) % 10) / 15, x = cx + Math.cos(a) * rx * d * z, y = cy + Math.sin(a) * ry * d * z;
    circle(x, y - 0.4 * z, 0.9 * z, C('#6fb04a')); rose(x + 0.3 * z, y - 1.1 * z, 0.7 * z, [PINK, '#ffffff', LILA, '#ffd23f', ROSE][k % 5]); } };

  // ── Zauberspiegel ─────────────────────────────────────────────────────────────────────────────────────────────────────
  // ovaler Spiegel im goldenen Schnörkelrahmen; die Glasfläche spiegelt (Verlauf), ein Lichtschimmer wandert darüber, Funkeln rundherum;
  // A: Standspiegel auf geschwungenen Füßen, B: an einem Mauerstück mit Rosen
  const mirror = (x, y, rx, ry, z, now, lit, magic) => {                                                          // x, y = Mitte des Spiegels
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
    if (magic) for (let k = 0; k < 3; k++) { const a = now / 1600 + k * TAU / 3; g.strokeStyle = lit ? 'rgba(255,230,160,0.55)' : 'rgba(200,170,255,0.45)'; g.lineWidth = Math.max(0.4, 0.5 * z);   // Zauberwirbel
      g.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, r = u * rx * 0.85, b = a + u * 4; const px = x + Math.cos(b) * r, py = y + Math.sin(b) * r * (ry / rx); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
    const sw = ((now / 3800) % 1) * 3 - 1;                                                                          // Lichtschimmer wandert schräg
    g.globalAlpha = 0.55; poly([[x + (sw - 0.5) * rx * 2, y - ry], [x + (sw - 0.2) * rx * 2, y - ry], [x + (sw + 0.3) * rx * 2, y + ry], [x + sw * rx * 2, y + ry]], '#ffffff'); g.globalAlpha = 1;
    poly([[x - rx * 0.7, y - ry * 0.5], [x - rx * 0.45, y - ry * 0.75], [x - rx * 0.1, y - ry * 0.2], [x - rx * 0.35, y + ry * 0.05]], 'rgba(255,255,255,0.45)');   // fester Glanz
    g.restore();
    for (const [dx, dy, s, ph] of [[1.25, -0.7, 1, 0], [-1.3, 0.35, 0.8, 2], [0.9, 0.9, 0.7, 4]]) { const f = (Math.sin(now / 500 + ph) + 1) / 2;   // Funkeln
      twinkle(x + dx * rx, y + dy * ry, (0.5 + f * 0.6) * s * z, '#ffffff'); }
    if (lit) glowAt(x, y, Math.max(rx, ry) * 2.2, z);
  };
  const zauberspiegel = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit();
    if (mode === 'stand') {
      sdShadow(cx, cy, 7, z);
      for (const s of [-1, 1]) { g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.6, 0.9 * z); g.lineCap = 'round'; g.beginPath();   // geschwungene Füße
        g.moveTo(cx + s * 0.8 * z, cy - 6 * z); g.bezierCurveTo(cx + s * 1.5 * z, cy - 2.5 * z, cx + s * 4.5 * z, cy - 2 * z, cx + s * 5 * z, cy + 0.2 * z); g.stroke(); circle(cx + s * 5 * z, cy + 0.2 * z, 0.7 * z, C(GOLD_D)); }
      poly([[cx - 0.7 * z, cy - 1.5 * z], [cx + 0.7 * z, cy - 1.5 * z], [cx + 0.9 * z, cy - 8 * z], [cx - 0.9 * z, cy - 8 * z]], C(GOLD_D));   // Stiel
      circle(cx, cy - 7 * z, 1.2 * z, C(GOLD));
      mirror(cx, cy - 17.5 * z, 5.2 * z, 8 * z, z, now, lit, true);
      flowers(cx, cy + 1 * z, z, 6, 0.6, 7, 3);
    } else {
      sdShadow(cx, cy, 10, z);
      const K = kit(cx, cy, z, 0), P = K.P;                                                                       // Mauerstück aus Stein (schräg wie die Raute)
      const wall = [P(-0.06, -0.3, 0), P(-0.06, 0.3, 0), P(-0.06, 0.3, 22), P(-0.06, 0.18, 26), P(-0.06, -0.18, 26), P(-0.06, -0.3, 22)];
      poly(wall, C('#d9d2c4')); poly([P(-0.06, 0.3, 0), P(0.02, 0.3, 0), P(0.02, 0.3, 22), P(-0.06, 0.3, 22)], C('#b8afa0'));
      poly([P(-0.06, -0.3, 22), P(0.02, -0.3, 22), P(0.02, -0.18, 26), P(-0.06, -0.18, 26)], C('#e8e2d6')); poly([P(-0.06, -0.18, 26), P(0.02, -0.18, 26), P(0.02, 0.18, 26), P(-0.06, 0.18, 26)], C('#e8e2d6'));
      poly([P(-0.06, 0.18, 26), P(0.02, 0.18, 26), P(0.02, 0.3, 22), P(-0.06, 0.3, 22)], C('#e8e2d6'));
      g.strokeStyle = 'rgba(140,125,105,0.45)'; g.lineWidth = Math.max(0.3, 0.25 * z); g.beginPath();
      for (let r = 1; r < 6; r++) { const h = r * 4.2, a = P(-0.06, -0.3, h), b = P(-0.06, 0.3, h); g.moveTo(...a); g.lineTo(...b);
        for (let j = 0; j < 4; j++) { const bb = -0.3 + (j + (r % 2 ? 0.5 : 0.25)) * 0.15, p = P(-0.06, bb, h), q = P(-0.06, bb, h - 4.2); g.moveTo(...p); g.lineTo(...q); } }
      g.stroke();
      const m = P(-0.06, 0, 13); mirror(m[0], m[1], 4.6 * z, 7 * z, z, now, lit, true);
      for (const [b, h0, h1] of [[-0.27, 0, 16], [0.26, 0, 11]]) { for (let k = 0; k < 8; k++) { const h = h0 + (h1 - h0) * k / 7, p = P(-0.04, b + Math.sin(k) * 0.02, h);   // Rosenranken
        circle(p[0], p[1], 1.1 * z, C(k % 2 ? '#6fb04a' : '#559a3e')); if (k % 2 === 1) rose(p[0] + 0.4 * z, p[1] - 0.3 * z, 0.85 * z, [ROSE, PINK, '#ffffff'][k % 3]); } }
      flowers(cx, cy + 1.5 * z, z, 7, 1.1, 9, 3.6);
    }
  };

  // ── Einhorn ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  // stehendes Einhorn von der Seite (Kopf rechts): Körper mit Schattierung, vier Beine mit goldenen Hufen (hintere dunkler), langer Hals,
  // Kopf mit Ohr, Auge mit Wimpern, Nüstern; goldenes gedrehtes Horn; Regenbogenmähne und -schweif wehen leicht (bewegt)
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
  const einhorn = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit();
    if (mode === 'regenbogen') {                                                                                    // Regenbogen dahinter
      const cols = ['#ff8fb1', '#ffd23f', '#8fe0a0', '#7fc8ff', LILA]; cols.forEach((c, k) => { g.strokeStyle = C(c); g.lineWidth = 1.1 * z; g.beginPath();
        g.ellipse(cx - 1 * z, cy - 1 * z, (13 - k * 1.1) * z, (16 - k * 1.1) * z, 0, Math.PI, 0); g.stroke(); });
      for (const s of [-1, 1]) { ellipse(cx - 1 * z + s * 12 * z, cy - 1 * z, 3 * z, 1.6 * z, '#ffffff'); ellipse(cx - 1 * z + s * 13.5 * z, cy - 1.8 * z, 2.2 * z, 1.4 * z, '#ffffff'); }   // Wölkchen
    }
    sdShadow(cx, cy, 9, z);
    flowers(cx, cy + 1 * z, z, mode === 'regenbogen' ? 8 : 6, 0.4, 9, 3.4);
    unicorn(cx - 0.6 * z, cy + 0.4 * z, 0.92, z, now, lit);
    for (const [dx, dy, ph] of [[9, -20, 0], [-8, -15, 2], [6, -6, 4]]) { const f = (Math.sin(now / 520 + ph) + 1) / 2; twinkle(cx + dx * z, cy + dy * z, (0.5 + f * 0.8) * z, C(f > 0.5 ? '#fff3a0' : '#ffffff')); }
  };

  // ── Krönchen-Laterne ──────────────────────────────────────────────────────────────────────────────────────────────────
  // Laterne in Kronenform: Glaskörper mit Sprossen, Kronenreif mit Steinen, Zacken mit Perlen, Kugel obendrauf; leuchtet nachts warm.
  // A: auf einem schlanken Pfosten mit Schnörkelfuß, B: hängt an einem geschwungenen Arm
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
    circle(x, ry - 4.4 * z, 0.75 * z, C(GOLD)); twinkle(x, ry - 5.6 * z, 0.7 * z, C('#fff3a0'));                     // Kugel, Stern
    if (lit) glowAt(x, y - H * 0.5, 20 * z, z);
  };
  const kroenchenlaterne = (mode) => (cx, cy, z) => {
    const lit = sdLit();
    sdShadow(cx, cy, 4, z);
    if (mode === 'pfosten') {
      poly([[cx - 2.2 * z, cy], [cx + 2.2 * z, cy], [cx + 1.4 * z, cy - 1.6 * z], [cx - 1.4 * z, cy - 1.6 * z]], C('#5a4a6e'));   // Fuß
      for (const s of [-1, 1]) { g.strokeStyle = C('#5a4a6e'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.moveTo(cx + s * 0.4 * z, cy - 2 * z); g.bezierCurveTo(cx + s * 2.6 * z, cy - 3 * z, cx + s * 2.6 * z, cy - 5.4 * z, cx + s * 0.6 * z, cy - 5 * z); g.stroke(); }
      const gr = g.createLinearGradient(cx - 0.6 * z, 0, cx + 0.6 * z, 0); gr.addColorStop(0, C('#8a78a8')); gr.addColorStop(1, C('#4a3c5e'));
      g.fillStyle = gr; g.fillRect(cx - 0.55 * z, cy - 19 * z, 1.1 * z, 18 * z);                                    // Pfosten
      for (const h of [6, 12]) ellipse(cx, cy - h * z, 0.9 * z, 0.4 * z, C(GOLD_D));
      poly([[cx - 1.8 * z, cy - 19 * z], [cx + 1.8 * z, cy - 19 * z], [cx + 1.2 * z, cy - 20 * z], [cx - 1.2 * z, cy - 20 * z]], C('#5a4a6e'));
      crownLamp(cx, cy - 21.4 * z, z, lit);
      for (const [dx, c] of [[-2.6, PINK], [2.2, '#ffffff'], [-1, LILA]]) { sdLine('#5f9e3a', 0.3, z, [[cx + dx * z, cy + 0.6 * z], [cx + dx * z, cy - 1.8 * z]]); rose(cx + dx * z, cy - 2 * z, 0.7 * z, c); }
    } else {
      const gr = g.createLinearGradient(cx - 3.6 * z, 0, cx - 2.4 * z, 0); gr.addColorStop(0, C('#8a78a8')); gr.addColorStop(1, C('#4a3c5e'));
      g.fillStyle = gr; g.fillRect(cx - 3.6 * z, cy - 24 * z, 1.1 * z, 23.4 * z);
      poly([[cx - 5 * z, cy], [cx - 1.2 * z, cy], [cx - 1.8 * z, cy - 1.4 * z], [cx - 4.4 * z, cy - 1.4 * z]], C('#5a4a6e'));
      g.strokeStyle = C('#4a3c5e'); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); g.moveTo(cx - 3 * z, cy - 23 * z); g.bezierCurveTo(cx, cy - 26 * z, cx + 3 * z, cy - 25 * z, cx + 3.4 * z, cy - 22.4 * z); g.stroke();   // geschwungener Arm
      g.lineWidth = Math.max(0.4, 0.4 * z); g.beginPath(); g.moveTo(cx - 3 * z, cy - 19 * z); g.bezierCurveTo(cx - 0.5 * z, cy - 19.5 * z, cx - 0.4 * z, cy - 23 * z, cx + 0.6 * z, cy - 24.2 * z); g.stroke();   // Stütze mit Schnörkel
      g.beginPath(); g.arc(cx - 0.6 * z, cy - 21 * z, 1 * z, 0, TAU * 0.8); g.stroke();
      circle(cx - 3 * z, cy - 24.6 * z, 0.7 * z, C(GOLD));
      sdLine(GOLD_D, 0.3, z, [[cx + 3.4 * z, cy - 22.4 * z], [cx + 3.4 * z, cy - 21 * z]]);
      crownLamp(cx + 3.4 * z, cy - 13 * z, z, lit);
      for (const [dx, c] of [[-5.4, PINK], [-0.8, '#ffffff'], [1.6, LILA]]) { sdLine('#5f9e3a', 0.3, z, [[cx + dx * z, cy + 0.6 * z], [cx + dx * z, cy - 1.8 * z]]); rose(cx + dx * z, cy - 2 * z, 0.7 * z, c); }
    }
  };

  // ── Tanzpavillon ──────────────────────────────────────────────────────────────────────────────────────────────────────
  // Tanzboden mit Rautenparkett und Rosette, acht schlanke weiße Säulen, Stoffdach rosa-weiß mit durchhängenden Bögen, Bänder an den Säulen;
  // A: Noten steigen auf (bewegt), Lichterkette; B: Kronleuchter in der Mitte (leuchtet nachts), Girlanden
  const tanzpavillon = (mode) => (cx, cy, z, now = 0) => {
    const lit = sdLit(), R = 14.5, HC0 = 16, HC = HC0, N = 8;
    sdShadow(cx, cy, 20, z);
    cyl(cx, cy, R + 1.8, R + 1.8, 0, 1.2, z, '#f3ece2', '#e6dccd', '#c9b9a3', '#f6efe6');
    cyl(cx, cy, R + 0.6, R + 0.6, 1.2, 2.4, z, '#d8b88e', '#c9a479', '#a37d55');                                   // Parkettkante
    const fy = cy - 2.4 * z;
    g.save(); g.beginPath(); g.ellipse(cx, fy, (R + 0.6) * z, (R + 0.6) / 2 * z, 0, 0, TAU); g.clip();             // Rautenparkett
    for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) { const a = i * 0.13, b = j * 0.13, x0 = cx + (a - b) * 32 * z, y0 = fy + (a + b) * 16 * z, h = 0.065;
      poly([[x0, y0 - h * 32 * z], [x0 + h * 64 * z, y0], [x0, y0 + h * 32 * z], [x0 - h * 64 * z, y0]], C((i + j) & 1 ? '#e8c89a' : '#d4a979')); }
    g.restore();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; poly([[cx, fy], [cx + Math.cos(a - 0.2) * 6 * z, fy + Math.sin(a - 0.2) * 3 * z], [cx + Math.cos(a) * 7.5 * z, fy + Math.sin(a) * 3.75 * z], [cx + Math.cos(a + 0.2) * 6 * z, fy + Math.sin(a + 0.2) * 3 * z]], C(k % 2 ? '#fff3e6' : '#f6c6d6')); }   // Rosette
    ellipse(cx, fy, 1.8 * z, 0.9 * z, C(GOLD));
    const ts = Array.from({ length: N }, (_, k) => (k + 0.5) / N * TAU), at = t => [cx + Math.cos(t) * R * z, fy + Math.sin(t) * R / 2 * z];
    const column = (t, cut = 0) => { const [x, y] = at(t), r = 0.75 * z, HC = HC0 - cut; const gr = g.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, C('#ddd3c4'));
      g.fillStyle = gr; g.fillRect(x - r, y - HC * z, 2 * r, HC * z); ellipse(x, y, r * 1.5, r * 0.65, C('#ece4d8'));
      g.strokeStyle = C(t < Math.PI ? '#ff8fb1' : '#f4b8cc'); g.lineWidth = Math.max(0.3, 0.35 * z); g.beginPath();   // Band um die Säule
      for (let i = 0; i <= 12; i++) { const u = i / 12, px = x + Math.sin(u * 12) * r, py = y - u * HC * z; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); };
    ts.filter(t => Math.sin(t) < 0).forEach(t => column(t, 3));                                                      // hintere: Oberteil steckt hinter dem Dach
    if (mode === 'leuchter') {                                                                                      // Kronleuchter an einer Kette aus der Dachmitte
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
    const EY = fy - HC * z, ER = R + 1.6, H = mode === 'leuchter' ? 15 : 12, apex = [cx, EY - H * z];
    if (mode === 'leuchter') {                                                                                      // B: Glockendach (geschwungen), rosa mit goldenen Rippen
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
    } else {
    const M = 16, base = t => [cx + Math.cos(t) * ER * z, EY + Math.sin(t) * ER / 2 * z];
    for (let k = M - 1; k >= 0; k--) { const t0 = k / M * Math.PI, t1 = (k + 1) / M * Math.PI, tm = (t0 + t1) / 2, lum = 0.5 + 0.5 * Math.cos(tm - Math.PI * 0.7);
      g.beginPath(); g.moveTo(...apex); g.lineTo(...base(t0)); g.quadraticCurveTo(...base(tm).map((v, i) => i ? v - 1 * z : v), ...base(t1)); g.closePath();
      g.fillStyle = C(shade(k % 2 ? '#fff4f8' : '#ffb3cf', -0.14 * (1 - lum))); g.fill(); }
    }
    for (let k = 0; k < N; k++) { const t0 = (k + 0.5) / N * TAU, t1 = (k + 1.5) / N * TAU; if (Math.sin((t0 + t1) / 2) < -0.2) continue;   // durchhängende Stoffbögen zwischen den Säulen
      const a = at(t0), b = at(t1); if (Math.sin(t0) < -0.1 && Math.sin(t1) < -0.1) continue;
      const ya = a[1] - HC * z, yb = b[1] - HC * z, mx = (a[0] + b[0]) / 2, my = (ya + yb) / 2 + 3.2 * z;
      g.beginPath(); g.moveTo(a[0], ya - 0.6 * z); g.quadraticCurveTo(mx, my + 1.4 * z, b[0], yb - 0.6 * z); g.quadraticCurveTo(mx, my - 1.2 * z, a[0], ya - 0.6 * z); g.closePath(); g.fillStyle = C('#ff9ec0'); g.fill();
      if (mode === 'noten') for (let i = 1; i < 6; i++) { const u = i / 6, px = a[0] + (b[0] - a[0]) * u, py = ya + (yb - ya) * u + Math.sin(u * Math.PI) * 3.4 * z;   // Lichterkette
        circle(px, py + 0.9 * z, 0.4 * z, lit ? '#fff3b0' : C(['#ffd23f', '#ffffff', '#ff8fb1'][i % 3])); if (lit && i % 2) glowAt(px, py + 0.9 * z, 4 * z, z); }
      else { const m = [mx, my + 0.4 * z]; rose(m[0], m[1], 0.8 * z, ROSE); circle(m[0] - 0.9 * z, m[1] - 0.2 * z, 0.6 * z, C('#6fb04a')); circle(m[0] + 0.9 * z, m[1] - 0.2 * z, 0.6 * z, C('#6fb04a')); } }
    sdLine(GOLD_D, 0.6, z, [apex, [cx, apex[1] - 3 * z]]);                                                          // Spitze mit Herz
    g.beginPath(); const hx = cx, hy = apex[1] - 4.6 * z, r = 1.6 * z; g.moveTo(hx, hy + r * 0.9); g.bezierCurveTo(hx - r * 1.4, hy - r * 0.1, hx - r * 0.7, hy - r * 1.1, hx, hy - r * 0.35); g.bezierCurveTo(hx + r * 0.7, hy - r * 1.1, hx + r * 1.4, hy - r * 0.1, hx, hy + r * 0.9); g.fillStyle = C('#ff6f9a'); g.fill();
    if (mode === 'noten') { const notes = ['♪', '♫', '♪']; g.font = `bold ${Math.round(3.2 * z)}px serif`; g.textAlign = 'center';   // Noten steigen auf
      notes.forEach((n, k) => { const p = ((now / 3200) + k / 3) % 1; g.globalAlpha = Math.min(1, p * 4, (1 - p) * 3); g.fillStyle = C(['#e8546f', '#9b6fe0', '#ff8fb1'][k]);
        g.fillText(n, cx + (-8 + k * 8 + Math.sin(now / 700 + k) * 1.4) * z, fy - (4 + p * 26) * z); }); g.globalAlpha = 1; }
  };

  const alt = (name) => (cx, cy, z, now) => { for (const k of ['TURM', 'MAERCHEN']) { const e = SD_WAREN[k].find(e => e[0] === name); if (e) return e[1](cx, cy, z, now || 0); } };
  window.ENTW_P8 = {
    'Zauberspiegel: bisher': alt('Zauberspiegel'),
    'Spiegel A: Standspiegel': zauberspiegel('stand'),
    'Spiegel B: am Mauerstück mit Rosen': zauberspiegel('mauer'),
    'Einhorn: bisher': alt('Einhorn ✦'),
    'Einhorn A: auf der Blumenwiese': einhorn('wiese'),
    'Einhorn B: mit Regenbogen': einhorn('regenbogen'),
    'Krönchen-Laterne: bisher': alt('Krönchen-Laterne'),
    'Laterne A: auf dem Pfosten': kroenchenlaterne('pfosten'),
    'Laterne B: am geschwungenen Arm': kroenchenlaterne('arm'),
    'Tanzpavillon: bisher': alt('Tanzpavillon ✦'),
    'Tanzpavillon A: Zeltdach, Noten, Lichterkette': tanzpavillon('noten'),
    'Tanzpavillon B: Glockendach, Kronleuchter, Rosen': tanzpavillon('leuchter'),
  };
})();
