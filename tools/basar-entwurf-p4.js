// Entwürfe Paket 4 (Basar-Durchsicht 28.10.2026): Pfau („sieht scheiße aus“), Koi-Teich („Fische wirken tot“), Sternbrunnen („da geht mehr“),
// Herzchen-Laube („was soll das sein?“). Je zwei Varianten, Form wie SD_ART plus now (bewegt).
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p4.js')).text()); dann ENTW_P4[name](cx, cy, z, now)
(() => {
  const TAU = Math.PI * 2;
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const heart = (x, y, r, col) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35); g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); g.fillStyle = col; g.fill(); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };

  // ── Pfau ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Federauge: Tropfen nach außen gerichtet (gelbgrün, türkis, tiefblau, Glanzpunkt); shine = Schimmer, der übers Rad läuft
  const eye = (x, y, a, s, z, shine) => {
    const e = (r1, r2, col, off) => { g.beginPath(); g.ellipse(x + Math.cos(a) * off * s * z, y + Math.sin(a) * off * s * z, r1 * s * z, r2 * s * z, a, 0, TAU); g.fillStyle = col; g.fill(); };
    e(2.4, 1.75, C('#a6cf45'), 0); e(1.75, 1.3, C('#1ea89b'), -0.2); e(1.1, 0.82, C('#1c3c9a'), -0.3);
    circle(x - 0.3 * s * z, y - 0.3 * s * z, 0.38 * s * z, shine ? '#e6fdff' : C('#58c8f0'));
  };
  const fan = (fx, fy, R, z, now) => {
    const a0 = Math.PI - 0.32, a1 = TAU + 0.32;
    for (let k = 0; k <= 20; k++) { const a = a0 + (a1 - a0) * k / 20; circle(fx + Math.cos(a) * R * z, fy + Math.sin(a) * R * 0.9 * z, 2.3 * z, C('#2e9168')); }   // Fransen
    g.beginPath(); g.moveTo(fx, fy); g.ellipse(fx, fy, R * z, R * 0.9 * z, 0, a0, a1); g.closePath(); g.fillStyle = C('#1d6a52'); g.fill();
    for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * k / 16; sdLine('#62b98f', 0.28, z, [[fx, fy], [fx + Math.cos(a) * R * 0.97 * z, fy + Math.sin(a) * R * 0.87 * z]]); }
    const ring = (n, rr, s, o) => { for (let k = 0; k < n; k++) { const a = a0 + 0.14 + (a1 - a0 - 0.28) * (k + o) / (n - 1 + o);
      eye(fx + Math.cos(a) * rr * R * z, fy + Math.sin(a) * rr * R * 0.9 * z, a, s, z, Math.sin(now / 420 - a * 2.2 + rr * 3) > 0.8); } };
    ring(14, 0.9, 1, 0); ring(10, 0.64, 0.82, 0.5); ring(6, 0.4, 0.62, 0.5);
  };
  const legs = (pts, z) => { for (const [x0, y0, x1, y1] of pts) { sdLine('#8c8c84', 0.45, z, [[x0, y0], [x1, y1]]); sdLine('#8c8c84', 0.3, z, [[x1 - 0.8 * z, y1 + 0.2 * z], [x1 + 0.8 * z, y1 + 0.2 * z]]); } };
  const crest = (hx, hy, z, lean) => { for (const d of [-1, 0, 1]) { const tx = hx + (d * 1.1 + lean) * z, ty = hy - 4 * z + Math.abs(d) * 0.4 * z;
    sdLine('#2a62d4', 0.22, z, [[hx + d * 0.3 * z, hy - 1.5 * z], [tx, ty]]); ellipse(tx, ty - 0.2 * z, 0.5 * z, 0.75 * z, C('#2fa0c8')); } };
  const peaHead = (hx, hy, z, dir) => {                                   // Kopf, Schnabel in Richtung dir (-1 = links)
    circle(hx, hy, 1.75 * z, C('#2a62d4')); circle(hx - 0.4 * z, hy - 0.5 * z, 0.8 * z, C('#3f80ea'));
    ellipse(hx + dir * 0.5 * z, hy - 0.1 * z, 0.95 * z, 0.42 * z, C('#ffffff')); circle(hx + dir * 0.6 * z, hy - 0.1 * z, 0.36 * z, C('#1a1a22'));
    poly([[hx + dir * 1.5 * z, hy + 0.1 * z], [hx + dir * 3.1 * z, hy + 0.6 * z], [hx + dir * 1.5 * z, hy + 0.9 * z]], C('#c9a46a'));
    crest(hx, hy, z, dir * 0.6);
  };
  const wingBars = (x, y, rx, ry, rot, z) => {
    g.beginPath(); g.ellipse(x, y, rx * z, ry * z, rot, 0, TAU); g.fillStyle = C('#b88a52'); g.fill();
    g.save(); g.beginPath(); g.ellipse(x, y, rx * z, ry * z, rot, 0, TAU); g.clip();
    for (let k = -3; k <= 3; k++) sdLine('#7d5530', 0.28, z, [[x - rx * z, y + k * ry * 0.3 * z - rx * 0.3 * z], [x + rx * z, y + k * ry * 0.3 * z + rx * 0.3 * z]]);
    g.restore();
  };
  // A: von vorn, großes Rad
  const pfauA = (cx, cy, z, now) => {
    sdShadow(cx, cy, 11, z);
    fan(cx, cy - 9 * z, 13.5, z, now);
    for (const s of [-1, 1]) wingBars(cx + s * 3 * z, cy - 5 * z, 1.8, 3.6, s * 0.35, z);
    legs([[cx - 1.1 * z, cy - 2.4 * z, cx - 1.4 * z, cy], [cx + 1.1 * z, cy - 2.4 * z, cx + 1.4 * z, cy]], z);
    ellipse(cx, cy - 5.6 * z, 3.3 * z, 4.4 * z, C('#1f4fb8')); ellipse(cx - 0.7 * z, cy - 6.4 * z, 1.9 * z, 2.9 * z, C('#2f6fe0'));
    poly([[cx - 1.6 * z, cy - 8.6 * z], [cx + 1.6 * z, cy - 8.6 * z], [cx + 0.7 * z, cy - 14.6 * z], [cx - 1.3 * z, cy - 14.6 * z]], C('#2a62d4'));
    sdLine('#4f8ff0', 0.5, z, [[cx - 0.5 * z, cy - 9.2 * z], [cx - 0.5 * z, cy - 14 * z]]);
    peaHead(cx - 0.3 * z, cy - 15.6 * z, z, -1);
  };
  // B: schräg, Rad in der Tiefe gedreht, Körper von der Seite
  const pfauB = (cx, cy, z, now) => {
    sdShadow(cx, cy, 11, z);
    g.save(); g.translate(cx + 2.5 * z, cy - 8.5 * z); g.transform(0.72, 0.24, 0, 1, 0, 0); fan(0, 0, 13.5, z, now); g.restore();
    legs([[cx - 0.6 * z, cy - 3 * z, cx - 1 * z, cy], [cx + 1.2 * z, cy - 3 * z, cx + 1.2 * z, cy + 0.4 * z]], z);
    g.beginPath(); g.ellipse(cx, cy - 5.4 * z, 4.8 * z, 3.3 * z, -0.25, 0, TAU); g.fillStyle = C('#1f4fb8'); g.fill();
    g.beginPath(); g.ellipse(cx - 1.6 * z, cy - 6 * z, 2.2 * z, 2.4 * z, -0.25, 0, TAU); g.fillStyle = C('#2f6fe0'); g.fill();
    wingBars(cx + 1.2 * z, cy - 5.6 * z, 3, 1.9, -0.3, z);
    g.strokeStyle = C('#2a62d4'); g.lineWidth = 2.3 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx - 2.4 * z, cy - 7 * z); g.quadraticCurveTo(cx - 5.2 * z, cy - 10 * z, cx - 3.8 * z, cy - 13.6 * z); g.stroke();
    g.strokeStyle = C('#4f8ff0'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(cx - 3.2 * z, cy - 7.6 * z); g.quadraticCurveTo(cx - 5.6 * z, cy - 10 * z, cx - 4.6 * z, cy - 13 * z); g.stroke();
    peaHead(cx - 3.8 * z, cy - 14.8 * z, z, -1);
  };

  // ── Koi-Teich ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  // Koi von oben in der Wasserebene (y halbiert), Kopf vorn; Rücken schlängelt, Schwanz schlägt (ph)
  const koi = (x, y, ang, L, base, spots, ph, z, alpha = 1) => {
    g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.scale(1, 0.5); g.rotate(ang);
    const n = 12, k = L / 10, pts = [], r = i => (1.5 - Math.pow(i / n, 1.3) * 1.15) * z * k;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([L * z * (0.45 - u), Math.sin(ph - u * 2.4) * u * u * 1.6 * z * k]); }
    const nrm = i => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const [tx, ty] = pts[n], [px, py] = pts[n - 1], ta = Math.atan2(ty - py, tx - px);
    g.save(); g.translate(tx, ty); g.rotate(ta + Math.sin(ph - 1) * 0.35); g.globalAlpha *= 0.75;          // Schwanzflosse, leicht durchscheinend
    g.beginPath(); g.moveTo(-0.3 * z * k, 0); g.quadraticCurveTo(1.1 * z * k, -0.9 * z * k, 2.3 * z * k, -1.6 * z * k); g.quadraticCurveTo(1.6 * z * k, 0, 2.3 * z * k, 1.6 * z * k); g.quadraticCurveTo(1.1 * z * k, 0.9 * z * k, -0.3 * z * k, 0);
    g.fillStyle = C(base); g.fill(); g.restore();
    for (const s of [-1, 1]) { const [fx, fy] = pts[3], [nx, ny] = nrm(3); g.save(); g.globalAlpha *= 0.75; g.beginPath();
      g.ellipse(fx + nx * s * 1.5 * z * k, fy + ny * s * 1.5 * z * k, 1.1 * z * k, 0.45 * z * k, s * (0.7 + Math.sin(ph * 1.3) * 0.3), 0, TAU); g.fillStyle = C(base); g.fill(); g.restore(); }
    const body = () => { g.beginPath(); const h = pts[0], [hx, hy] = nrm(0);
      g.moveTo(h[0] + hx * r(0), h[1] + hy * r(0)); g.quadraticCurveTo(h[0] + 1.6 * r(0), h[1], h[0] - hx * r(0), h[1] - hy * r(0));
      for (let i = 1; i <= n; i++) { const [nx, ny] = nrm(i); g.lineTo(pts[i][0] - nx * r(i), pts[i][1] - ny * r(i)); }
      for (let i = n; i >= 1; i--) { const [nx, ny] = nrm(i); g.lineTo(pts[i][0] + nx * r(i), pts[i][1] + ny * r(i)); } g.closePath(); };
    body(); g.fillStyle = C(base); g.fill();
    if (spots.length) { g.save(); body(); g.clip(); for (const [col, idx] of spots) for (const i of idx) { const j = Math.round(i * n / 8); circle(pts[j][0] + 0.3 * z * k, pts[j][1] + (i % 2 ? 0.4 : -0.3) * z * k, r(j) * 0.95, C(col)); } g.restore(); }
    sdLine('rgba(255,255,255,0.45)', 0.3 * k, z, [[pts[1][0], pts[1][1]], [pts[6][0], pts[6][1]]]);                 // Glanz auf dem Rücken
    for (const s of [-1, 1]) circle(pts[0][0] + 0.5 * z * k, pts[0][1] + s * 0.75 * z * k, 0.28 * z * k, C('#1a1a22'));
    g.restore();
  };
  const FISH = [
    { base: '#fff6ee', spots: [['#e8452a', [1, 3, 4, 6]]] },                       // Kohaku: weiß mit Rot
    { base: '#ff8a2a', spots: [['#ffb15a', [2, 5]]] },                             // ganz orange
    { base: '#fff6ee', spots: [['#e8452a', [2, 5]], ['#2a2a30', [3, 7]]] },         // Sanke: weiß, rot, schwarz
    { base: '#f5c84b', spots: [['#ffe28a', [1, 4]]] },                             // gelb
  ];
  // Bahnen in der Teichebene (u, v; Teich hat Radius 20): Kreis, kleiner Gegenkreis, Acht
  const swim = (k, now) => {
    if (k === 0) { const t = now / 4200; return [11 * Math.cos(t), 11 * Math.sin(t), t + Math.PI / 2]; }
    if (k === 1) { const t = -now / 3100 + 3.6; return [-5 + 7 * Math.cos(t), -3 + 7 * Math.sin(t), t - Math.PI / 2]; }
    if (k === 2) { const t = now / 5200 + 3.4; return [12 * Math.sin(t), 7 * Math.sin(2 * t), Math.atan2(14 * Math.cos(2 * t), 12 * Math.cos(t))]; }
    const t = now / 3600 + 1.5; return [3 + 6 * Math.cos(t), 6 + 4 * Math.sin(t), Math.atan2(4 * Math.cos(t), -6 * Math.sin(t))];
  };
  const STONES = Array.from({ length: 18 }, (_, k) => [k / 18 * TAU + (k % 3) * 0.06, 2.4 + ((k * 7) % 5) * 0.35, ['#b9b1a1', '#a69c8a', '#c4bcae'][k % 3]]);
  const pad = (x, y, r, a, z, flower) => {
    g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r * z, r * 0.5 * z, 0, a + 0.35, a + TAU - 0.35); g.closePath(); g.fillStyle = C('#4f9e5a'); g.fill();
    g.beginPath(); g.ellipse(x - 0.3 * z, y - 0.2 * z, r * 0.7 * z, r * 0.32 * z, 0, a + 0.5, a + TAU - 0.5); g.strokeStyle = C('#6fbf6a'); g.lineWidth = 0.25 * z; g.stroke();
    if (flower) { for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(b) * 0.9 * z, y - 0.8 * z + Math.sin(b) * 0.45 * z, 0.7 * z, 1.2 * z, b + Math.PI / 2, 0, TAU); g.fillStyle = C(k & 1 ? '#ffb3cf' : '#ff8fb1'); g.fill(); }
      circle(x, y - 1.2 * z, 0.7 * z, C('#ffd23f')); }
  };
  const pond = (cx, cy, z, now, extra) => {
    const rx = 21 * z, ry = 10.5 * z;
    ellipse(cx, cy + 1.2 * z, rx + 3.5 * z, ry + 2.4 * z, C('#8f866f'));
    ellipse(cx, cy, rx, ry, C('#2b7aa0'));
    const gr = g.createRadialGradient(cx - 4 * z, cy - 1 * z, 1 * z, cx, cy, rx);
    gr.addColorStop(0, C('#86d4ea')); gr.addColorStop(0.7, C('#4aa6cc')); gr.addColorStop(1, C('#2f86ad'));
    g.beginPath(); g.ellipse(cx, cy + 0.6 * z, rx - 1 * z, ry - 1.2 * z, 0, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.beginPath(); g.ellipse(cx, cy + 0.6 * z, rx - 1 * z, ry - 1.2 * z, 0, 0, TAU); g.clip();
    for (const [dx, dy, r] of [[-9, 3, 1.2], [5, 5, 0.9], [11, -1, 1.1], [-3, -5, 0.8], [-14, -1, 0.9]]) ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.5 * z, 'rgba(120,110,80,0.35)');   // Kiesel am Grund
    const fish = [0, 1, 2, 3].map(k => { const [u, v, a] = swim(k, now); return { k, x: cx + u * z, y: cy + v * 0.5 * z, a }; });
    fish.forEach(f => koi(f.x + 0.6 * z, f.y + 2 * z, f.a, f.k === 3 ? 10 : 13, '#1f5f80', [], now / 170 + f.k * 1.7, z, 0.35));   // Schatten am Grund
    ellipse(cx, cy + 0.6 * z, rx, ry, 'rgba(80,170,210,0.18)');                                            // Wasser zwischen Grund und Fischen
    fish.forEach(f => koi(f.x, f.y, f.a, f.k === 3 ? 10 : 13, FISH[f.k].base, FISH[f.k].spots, now / 170 + f.k * 1.7, z));
    for (let k = 0; k < 2; k++) { const p = ((now / 1700 + k * 0.5) % 1), [u, v] = k ? [7, -3] : [-6, 2];      // Ringe, wo ein Fisch hochkam
      g.beginPath(); g.ellipse(cx + u * z, cy + v * z, (1 + p * 6) * z, (0.5 + p * 3) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; g.lineWidth = 0.35 * z; g.stroke(); }
    for (const [dx, dy, w] of [[-10, -4, 4], [3, -6, 3], [9, 3, 3.5]]) { const s = Math.sin(now / 900 + dx) * 0.8;   // Glanz auf dem Wasser
      sdLine('rgba(255,255,255,0.75)', 0.35, z, [[cx + (dx + s) * z, cy + dy * z], [cx + (dx + s + w) * z, cy + (dy - 0.3) * z]]); }
    g.restore();
    pad(cx + 12 * z, cy + 2.5 * z, 3.2, 0.6, z, true); pad(cx - 14 * z, cy - 1.5 * z, 2.8, 2.4, false); pad(cx - 10.5 * z, cy + 3.5 * z, 2.2, 4, true);
    STONES.forEach(([a, r, col]) => { const x = cx + Math.cos(a) * (rx + 0.8 * z), y = cy + Math.sin(a) * (ry + 0.6 * z) + 0.4 * z;
      ellipse(x, y + 0.5 * z, r * z, r * 0.6 * z, C(shade(col, -0.18))); ellipse(x - 0.2 * z, y, r * 0.9 * z, r * 0.5 * z, C(col)); ellipse(x - 0.6 * z, y - 0.3 * z, r * 0.4 * z, r * 0.2 * z, 'rgba(255,255,255,0.35)'); });
    if (extra) extra(cx, cy, z, now, rx, ry);
  };
  // Steinlaterne (hinten rechts) und Schilf mit Rohrkolben (links)
  const lanternReeds = (cx, cy, z, now, rx, ry) => {
    const lit = sdLit(), lx = cx + 13 * z, ly = cy - 8 * z;
    ellipse(lx, ly + 0.5 * z, 3 * z, 1.4 * z, 'rgba(60,50,40,0.25)');
    poly([[lx - 1.8 * z, ly], [lx + 1.8 * z, ly], [lx + 1.4 * z, ly - 1.2 * z], [lx - 1.4 * z, ly - 1.2 * z]], C('#a8a294'));
    poly([[lx - 0.7 * z, ly - 1.2 * z], [lx + 0.7 * z, ly - 1.2 * z], [lx + 0.7 * z, ly - 6 * z], [lx - 0.7 * z, ly - 6 * z]], C('#bdb7aa'));
    poly([[lx - 2 * z, ly - 6 * z], [lx + 2 * z, ly - 6 * z], [lx + 2 * z, ly - 9.4 * z], [lx - 2 * z, ly - 9.4 * z]], C('#c9c3b6'));
    poly([[lx - 1 * z, ly - 6.6 * z], [lx + 1 * z, ly - 6.6 * z], [lx + 1 * z, ly - 8.8 * z], [lx - 1 * z, ly - 8.8 * z]], lit ? '#ffd27a' : C('#5a554c'));
    poly([[lx - 3.4 * z, ly - 9.4 * z], [lx + 3.4 * z, ly - 9.4 * z], [lx + 1.2 * z, ly - 11.6 * z], [lx - 1.2 * z, ly - 11.6 * z]], C('#a8a294'));
    circle(lx, ly - 12.2 * z, 0.8 * z, C('#a8a294'));
    if (lit) glowAt(lx, ly - 7.7 * z, 16 * z, z);
    for (let k = 0; k < 7; k++) { const x = cx - (16 + (k % 3) * 2) * z + k * 0.6 * z, y = cy + (-3 + k * 1.1) * z, h = 8 + (k * 5) % 4, sw = Math.sin(now / 700 + k) * 0.5;
      sdLine('#4f8f3a', 0.35, z, [[x, y], [x + sw * z, y - h * z]], [x + 0.2 * z, y - h * 0.5 * z]);
      if (k % 2) { poly([[x + sw * z - 0.45 * z, y - (h - 1) * z], [x + sw * z + 0.45 * z, y - (h - 1) * z], [x + sw * z + 0.45 * z, y - (h - 3.4) * z], [x + sw * z - 0.45 * z, y - (h - 3.4) * z]], C('#7a4f2e')); } }
  };

  // ── Sternbrunnen ──────────────────────────────────────────────────────────────────────────────────────────────────────
  // Stern, der sich langsam dreht (Breite cos), Spitzen in Hell/Dunkel geteilt wie geschliffen
  const turnStar = (x, y, r, z, now, lit) => {
    const c = Math.cos(now / 1700), sx = Math.max(0.18, Math.abs(c)), L = lit ? '#fff3b0' : C('#f9d65c'), D = lit ? '#ffd94a' : C('#d49c26');
    const P = (a, rr) => [x + Math.cos(a) * rr * sx, y + Math.sin(a) * rr];
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5, tip = P(a, r), il = P(a - Math.PI / 5, r * 0.45), ir = P(a + Math.PI / 5, r * 0.45);
      poly([[x, y], tip, il], c > 0 ? L : D); poly([[x, y], tip, ir], c > 0 ? D : L); }
    if (lit) { glowAt(x, y, 34 * z, z); }
  };
  const twinkle = (x, y, s, z, col) => { poly([[x, y - s * z], [x + 0.3 * s * z, y - 0.3 * s * z], [x + s * z, y], [x + 0.3 * s * z, y + 0.3 * s * z], [x, y + s * z], [x - 0.3 * s * z, y + 0.3 * s * z], [x - s * z, y], [x - 0.3 * s * z, y - 0.3 * s * z]], col); };
  const sparkles = (x, y, z, now, lit) => { for (let k = 0; k < 5; k++) { const p = (now / 1300 + k * 0.23) % 1, a = k * 2.4, s = Math.sin(p * Math.PI) * 1.4;
    if (s > 0.1) { const px = x + Math.cos(a) * (8 + p * 3) * z, py = y + Math.sin(a) * (6 + p * 2) * z - p * 3 * z; twinkle(px, py, s, z, lit ? '#fff6c8' : 'rgba(255,255,255,0.95)'); if (lit) glowAt(px, py, 6 * z, z); } } };
  const ripples = (x, y, R, z, now) => { for (let k = 0; k < 3; k++) { const p = (now / 1500 + k / 3) % 1;
    g.beginPath(); g.ellipse(x, y, (3 + p * R) * z, (1.5 + p * R / 2) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.55 * (1 - p)})`; g.lineWidth = 0.3 * z; g.stroke(); } };
  const roundWall = (cx, cy, R, H, z, col) => {
    g.beginPath(); g.ellipse(cx, cy, R * z, R / 2 * z, 0, 0, Math.PI); g.lineTo(cx - R * z, cy - H * z); g.ellipse(cx, cy - H * z, R * z, R / 2 * z, 0, Math.PI, 0, true); g.closePath();
    const gr = g.createLinearGradient(cx - R * z, 0, cx + R * z, 0); gr.addColorStop(0, C(shade(col, 0.06))); gr.addColorStop(0.55, C(col)); gr.addColorStop(1, C(shade(col, -0.16))); g.fillStyle = gr; g.fill();
  };
  // A: zwei Schalen, Wasser fällt als Vorhang aus der oberen, Stern dreht sich oben, Funkeln
  const brunnenA = (cx, cy, z, now) => {
    const lit = sdLit(), R = 19, H = 4.2, top = cy - H * z;
    ellipse(cx, cy + 1.5 * z, (R + 1.5) * z, (R / 2 + 1.2) * z, 'rgba(60,50,40,0.22)');
    roundWall(cx, cy, R, H, z, '#ddd4c4');
    for (let k = 0; k < 7; k++) { const a = 0.35 + k / 6 * (Math.PI - 0.7); poly(sdStarPts(cx + Math.cos(a) * R * z, cy - H / 2 * z + Math.sin(a) * R / 2 * z, 1.1 * z), C('#e0b04a')); }
    ellipse(cx, top, R * z, R / 2 * z, C('#f2ebde'));
    g.beginPath(); g.ellipse(cx, top, (R - 0.5) * z, (R / 2 - 0.25) * z, 0, 0, TAU); g.strokeStyle = C('#e0b04a'); g.lineWidth = 0.35 * z; g.stroke();
    const wr = R - 2.2, gr = g.createRadialGradient(cx, top, 1 * z, cx, top, wr * z);
    gr.addColorStop(0, lit ? '#a8ecf6' : C('#8fd8ec')); gr.addColorStop(1, lit ? '#4fa8cc' : C('#3f9ec6'));
    g.beginPath(); g.ellipse(cx, top + 0.4 * z, wr * z, wr / 2 * z, 0, 0, TAU); g.fillStyle = gr; g.fill();
    if (lit) glowAt(cx, top + 1 * z, 26 * z, z, 'blue');
    ripples(cx, top + 0.6 * z, 11, z, now);
    // Säule und obere Schale
    poly([[cx - 2.4 * z, top + 0.8 * z], [cx + 2.4 * z, top + 0.8 * z], [cx + 1.5 * z, top - 9 * z], [cx - 1.5 * z, top - 9 * z]], C('#e8e0d0'));
    poly([[cx + 0.6 * z, top + 0.8 * z], [cx + 2.4 * z, top + 0.8 * z], [cx + 1.5 * z, top - 9 * z], [cx + 0.4 * z, top - 9 * z]], C('#d3c9b6'));
    ellipse(cx, top - 4 * z, 2.4 * z, 1 * z, C('#e0b04a'));
    const by = top - 10.5 * z;
    g.beginPath(); g.ellipse(cx, by, 8.5 * z, 5 * z, 0, 0, Math.PI); g.closePath(); g.fillStyle = C('#e2d9c9'); g.fill();
    ellipse(cx, by, 8.5 * z, 3.8 * z, C('#f2ebde')); ellipse(cx, by + 0.3 * z, 7.2 * z, 3 * z, lit ? '#9fe6f4' : C('#7fcfe6'));
    // Vorhang: Strähnen von der vorderen Kante bis ins Becken, Tropfen laufen hinunter
    for (let k = 0; k < 9; k++) { const a = 0.25 + k / 8 * (Math.PI - 0.5), x = cx + Math.cos(a) * 8.3 * z, y0 = by + Math.sin(a) * 3.7 * z, y1 = top + Math.sin(a) * 4 * z + 1 * z, x1 = cx + Math.cos(a) * 9.5 * z;
      g.strokeStyle = 'rgba(200,240,252,0.55)'; g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + (x1 - x) * 0.2, y0 + 3 * z, x1, y1); g.stroke();
      const p = (now / 520 + k * 0.37) % 1; circle(x + (x1 - x) * p * p, y0 + (y1 - y0) * p, 0.4 * z, 'rgba(255,255,255,0.9)');
      if (k % 2) { const q = (now / 600 + k * 0.29) % 1; g.beginPath(); g.ellipse(x1, y1, (0.6 + q * 1.6) * z, (0.3 + q * 0.8) * z, 0, Math.PI, TAU); g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - q)})`; g.lineWidth = 0.3 * z; g.stroke(); } }
    poly([[cx - 0.9 * z, by + 0.2 * z], [cx + 0.9 * z, by + 0.2 * z], [cx + 0.5 * z, by - 4.4 * z], [cx - 0.5 * z, by - 4.4 * z]], C('#e0b04a'));
    circle(cx, by - 4.6 * z, 1.1 * z, C('#f5c84b'));
    turnStar(cx, by - 10.5 * z, 6.4 * z, z, now, lit);
    sparkles(cx, by - 10.5 * z, z, now, lit);
  };
  // B: Becken als fünfzackiger Stern, aus der Mitte fünf Wasserbögen in die Zacken
  const starPlane = (cx, cy, r, ri, dy, z) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i & 1 ? ri : r; return [cx + Math.cos(a) * rr * z, cy + dy * z + Math.sin(a) * rr * 0.5 * z]; });
  const brunnenB = (cx, cy, z, now) => {
    const lit = sdLit(), R = 22, Ri = 12, H = 3.6, top = cy - H * z;
    ellipse(cx, cy + 1.5 * z, 21 * z, 10.5 * z, 'rgba(60,50,40,0.18)');
    const bot = starPlane(cx, cy, R, Ri, 0, z), up = starPlane(cx, cy, R, Ri, -H, z);
    for (let i = 0; i < 10; i++) { const j = (i + 1) % 10, a = bot[i], b = bot[j];
      const nx = (b[1] - a[1]), ny = -(b[0] - a[0]);                                   // Außen-Normale (Bildschirm)
      if (ny < 0) continue;
      poly([up[i], up[j], b, a], C(nx > 0 ? '#c9bfae' : '#e2d9c9')); }
    poly(up, C('#f2ebde'));
    path(up); g.strokeStyle = C('#e0b04a'); g.lineWidth = 0.35 * z; g.stroke();
    const wat = starPlane(cx, cy, R - 3.6, Ri - 2.2, -H + 0.3, z);
    path(wat); const gr = g.createRadialGradient(cx, top, 1 * z, cx, top, R * z);
    gr.addColorStop(0, lit ? '#a8ecf6' : C('#8fd8ec')); gr.addColorStop(1, lit ? '#4fa8cc' : C('#3f9ec6')); g.fillStyle = gr; g.fill();
    if (lit) glowAt(cx, top + 1 * z, 26 * z, z, 'blue');
    g.save(); path(wat); g.clip(); ripples(cx, top + 0.3 * z, 12, z, now); g.restore();
    // Sockel, Säule, Stern
    ellipse(cx, top + 0.4 * z, 4 * z, 2 * z, C('#d3c9b6')); ellipse(cx, top - 0.4 * z, 3.6 * z, 1.7 * z, C('#ece4d6'));
    poly([[cx - 1.7 * z, top], [cx + 1.7 * z, top], [cx + 1.1 * z, top - 13 * z], [cx - 1.1 * z, top - 13 * z]], C('#e8e0d0'));
    poly([[cx + 0.4 * z, top], [cx + 1.7 * z, top], [cx + 1.1 * z, top - 13 * z], [cx + 0.3 * z, top - 13 * z]], C('#d3c9b6'));
    for (const h of [4, 9]) ellipse(cx, top - h * z, 1.9 * z, 0.8 * z, C('#e0b04a'));
    // fünf Bögen in die Zacken (hintere zuerst), Tropfen entlang
    const jets = [0, 1, 2, 3, 4].map(k => { const a = -Math.PI / 2 + k * TAU / 5; return { a, ex: cx + Math.cos(a) * (R - 8) * z, ey: top + 0.3 * z + Math.sin(a) * (R - 8) * 0.5 * z }; }).sort((p, q) => p.ey - q.ey);
    const sx = cx, sy = top - 12 * z, star = () => { turnStar(cx, top - 18.5 * z, 6.2 * z, z, now, lit); sparkles(cx, top - 18.5 * z, z, now, lit); };
    const jet = j => { const kx = (sx + j.ex) / 2, ky = sy - 6 * z;
      g.strokeStyle = 'rgba(200,240,252,0.75)'; g.lineWidth = 0.8 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(kx, ky, j.ex, j.ey); g.stroke();
      for (let d = 0; d < 3; d++) { const p = (now / 700 + d / 3 + j.a) % 1, q = 1 - p; circle(q * q * sx + 2 * p * q * kx + p * p * j.ex, q * q * sy + 2 * p * q * ky + p * p * j.ey, 0.45 * z, 'rgba(255,255,255,0.95)'); }
      const r = (now / 600 + j.a) % 1; g.beginPath(); g.ellipse(j.ex, j.ey, (0.8 + r * 2) * z, (0.4 + r) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - r)})`; g.lineWidth = 0.3 * z; g.stroke(); };
    jets.filter(j => j.ey < sy + 14 * z && j.ey <= top).forEach(jet);
    star();
    jets.filter(j => !(j.ey < sy + 14 * z && j.ey <= top)).forEach(jet);
  };

  // ── Herzchen-Laube ────────────────────────────────────────────────────────────────────────────────────────────────────
  // echte Gartenlaube im Raum (kit): vier Pfosten, Gitter an den Seiten, Bank mit Kissen drin, Rosen ranken hoch
  const A = 0.2, B = 0.14, HP = 15;
  const bench = (K, z) => {
    const P = K.P, a0 = -A + 0.025, a1 = -A + 0.1, b0 = -0.1, b1 = 0.1;
    for (const b of [b0 + 0.015, b1 - 0.015]) sdLine('#9a6a40', 0.5, z, [P(a1 - 0.01, b), P(a1 - 0.01, b, 4)]);
    poly([P(a0, b0, 8.5), P(a0, b1, 8.5), P(a0, b1, 4.5), P(a0, b0, 4.5)], C('#b47a4a'));                 // Lehne
    for (const b of [-0.05, 0, 0.05]) sdLine('#8a5a34', 0.25, z, [P(a0, b, 4.8), P(a0, b, 8.2)]);
    poly([P(a0, b0, 4.5), P(a1, b0, 4.5), P(a1, b1, 4.5), P(a0, b1, 4.5)], C('#c98f5a'));                 // Sitz
    poly([P(a1, b0, 4.5), P(a1, b1, 4.5), P(a1, b1, 3.6), P(a1, b0, 3.6)], C('#a8774a'));
    const c = P((a0 + a1) / 2, 0.035, 5.3); ellipse(c[0], c[1], 2.2 * z, 1.1 * z, C('#ff8fb1')); heart(c[0] + 0.1 * z, c[1] - 0.2 * z, 0.6 * z, C('#ffffff'));
  };
  const post = (K, a, b, z) => { const p0 = K.P(a, b), p1 = K.P(a, b, HP); sdLine('#e8ddcf', 1.3, z, [p0, p1]); sdLine('#fffaf2', 0.8, z, [[p0[0] - 0.25 * z, p0[1]], [p1[0] - 0.25 * z, p1[1]]]); };
  const lattice = (K, a, z) => {
    const P = K.P, q = [P(a, -B, 2), P(a, B, 2), P(a, B, 12.5), P(a, -B, 12.5)];
    g.save(); path(q); g.clip(); g.strokeStyle = C('#fff6ea'); g.lineWidth = 0.4 * z;
    for (let k = -6; k <= 6; k++) { const b = k * 0.045; for (const d of [1, -1]) { const p0 = P(a, b - d * 0.12, 0), p1 = P(a, b + d * 0.12, 15); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); } }
    g.restore();
    sdLine('#fffaf2', 0.6, z, [P(a, -B, 12.5), P(a, B, 12.5)]); sdLine('#fffaf2', 0.6, z, [P(a, -B, 2), P(a, B, 2)]);
  };
  const hump = s => HP + 1.5 + 4.8 * Math.sqrt(Math.max(0, 1 - Math.pow((Math.abs(s) - 0.5) / 0.5, 2)));   // Oberkante wie ein halbes Herz
  const heartArch = (K, b, z, col = '#fffaf2') => { const pts = []; for (let i = 0; i <= 40; i++) { const s = -1 + i / 20; pts.push(K.P(s * A, b, hump(s))); }
    g.strokeStyle = C(shade(col, -0.12)); g.lineWidth = 1.6 * z; g.lineJoin = 'round'; path(pts, false); g.stroke();
    g.strokeStyle = C(col); g.lineWidth = 0.9 * z; path(pts, false); g.stroke();
    sdLine(col, 1.2, z, [K.P(-A, b, HP), K.P(-A, b, hump(-1))]); sdLine(col, 1.2, z, [K.P(A, b, HP), K.P(A, b, hump(1))]); };
  const leaves = (x, y, z, n, seed) => { for (let k = 0; k < n; k++) { const a = seed + k * 2.3, d = 0.6 + (k % 3) * 0.5; circle(x + Math.cos(a) * d * z, y + Math.sin(a) * d * z, (0.9 + (k % 2) * 0.3) * z, C(k % 2 ? '#4f9e4a' : '#3f8a3e')); } };
  const lights = (K, b, z, lit) => { for (let i = 1; i < 12; i++) { const s = -1 + i / 6, p = K.P(s * A, b, hump(s) - 0.9);
    circle(p[0], p[1], 0.45 * z, lit ? '#ffe9a0' : C('#fff2c8')); if (lit) glowAt(p[0], p[1], 6 * z, z); } };
  const laubeA = (cx, cy, z, now) => {
    const lit = sdLit(), K = kit(cx, cy, z, 0), P = K.P;
    sdShadow(cx, cy, 11, z);
    poly([P(-A - 0.05, -B - 0.05), P(A + 0.05, -B - 0.05), P(A + 0.05, B + 0.05), P(-A - 0.05, B + 0.05)], C('#e9e0d2'));
    for (const [a, b] of [[-0.1, -0.06], [0.08, 0.02], [-0.02, 0.11], [0.15, -0.09]]) { const p = P(a, b); ellipse(p[0], p[1], 1.6 * z, 0.8 * z, C('#d8cebd')); }
    post(K, -A, -B, z); post(K, A, -B, z); lattice(K, -A, z);
    heartArch(K, -B, z);
    bench(K, z);
    for (const s of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) sdLine('#f4ece0', 0.5, z, [P(s * A, -B, hump(s)), P(s * A, B, hump(s))]);
    post(K, -A, B, z); lattice(K, A, z); post(K, A, B, z);
    heartArch(K, B, z);
    const hp = P(0, B, hump(0) - 2.4); sdLine('#e8ddcf', 0.2, z, [[hp[0], hp[1] - 2 * z], [hp[0], hp[1]]]); heart(hp[0], hp[1] + 0.6 * z, 1.5 * z, C('#ff6f9a'));
    // Rosen: an den vorderen Pfosten hoch und über den Bogen
    for (const [a, b] of [[-A, B], [A, B], [A, -B]]) for (let h = 2; h <= HP; h += 2.6) { const p = P(a, b, h); leaves(p[0], p[1], z, 3, h + a * 10); if ((h | 0) % 3 === 2) rose(p[0] + 0.5 * z, p[1] - 0.3 * z, 0.9 * z, h > 9 ? '#ff6f9a' : '#e8364f'); }
    for (const s of [-0.85, -0.55, -0.3, 0.35, 0.6, 0.9]) { const p = P(s * A, B, hump(s)); leaves(p[0], p[1], z, 3, s * 7); rose(p[0], p[1] - 0.6 * z, 1 * z, ['#ff6f9a', '#ffffff', '#e8364f'][Math.round(s * 10) % 3 + (s < 0 ? 2 : 0)] || '#ff8fb1'); }
    lights(K, B, z, lit);
  };
  // B: ganz zugewachsene Rosenlaube, Eingang als Herz in der Hecke, Bank drin
  const laubeB = (cx, cy, z, now) => {
    const lit = sdLit(), K = kit(cx, cy, z, 0), P = K.P, A2 = 0.22, B2 = 0.15, H = 16;
    sdShadow(cx, cy, 12, z);
    poly([P(-A2, -B2), P(A2, -B2), P(A2, B2), P(-A2, B2)], C('#2f6e33'));
    const front = b => { const pts = [P(-A2, b, 0)]; for (let i = 0; i <= 24; i++) { const s = -1 + i / 12; pts.push(P(s * A2, b, H - 3 + 4 * Math.sqrt(1 - s * s))); } pts.push(P(A2, b, 0)); return pts; };
    poly(front(-B2), C('#2f6e33'));                                                                      // Rückwand innen (dunkel)
    bench(K, z);
    const heartPts = []; for (let i = 0; i < 40; i++) { const t = i / 40 * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      heartPts.push(P(hx / 16 * A2 * 0.72, B2, 7.4 + hy / 13 * 6.6)); }
    // Seite rechts (a = A2) als Heckenwand
    const sideWall = [P(A2, -B2, 0), P(A2, B2, 0), P(A2, B2, H - 3), P(A2, -B2, H - 3)];
    g.save(); path(sideWall); g.clip(); poly(sideWall, C('#3a8038'));
    for (let k = 0; k < 30; k++) { const u = (k * 0.618) % 1, v = (k * 0.381 + 0.13) % 1, p = P(A2, -B2 + u * 2 * B2, v * (H - 3)); circle(p[0], p[1], 1.6 * z, C(k % 2 ? '#468f40' : '#357a34')); }
    g.restore();
    // Dach: Kuppel aus Laub zwischen hinterer und vorderer Wand
    const roof = []; for (let i = 0; i <= 24; i++) { const s = -1 + i / 12; roof.push(P(s * A2, -B2, H - 3 + 4 * Math.sqrt(1 - s * s))); }
    for (let i = 24; i >= 0; i--) { const s = -1 + i / 12; roof.push(P(s * A2, B2, H - 3 + 4 * Math.sqrt(1 - s * s))); }
    poly(roof, C('#468f40'));
    for (let k = 0; k < 18; k++) { const s = -0.9 + (k % 6) * 0.36, b = -B2 + Math.floor(k / 6) * B2, p = P(s * A2, b, H - 3 + 4 * Math.sqrt(1 - s * s) + 0.5); circle(p[0], p[1], 2 * z, C(k % 2 ? '#56a34c' : '#468f40')); }
    // Front mit Herz-Loch (evenodd)
    const fr = front(B2);
    g.save(); g.beginPath(); fr.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    heartPts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip('evenodd');
    path(fr); g.fillStyle = C('#3f8a3c'); g.fill();
    for (let k = 0; k < 46; k++) { const u = (k * 0.618) % 1, v = (k * 0.414 + 0.07) % 1, s = -1 + u * 2, p = P(s * A2, B2, v * (H + 1)); circle(p[0], p[1], 1.7 * z, C(k % 3 ? '#4f9e4a' : '#3a8038')); }
    g.restore();
    path(heartPts); g.strokeStyle = C('#ff8fb1'); g.lineWidth = 0.5 * z; g.stroke();
    for (const [s, h, c] of [[-0.8, 3, 0], [-0.6, 12, 1], [-0.25, 17, 2], [0.15, 18.4, 0], [0.5, 16, 1], [0.85, 9, 2], [0.75, 3, 0], [-0.9, 8, 2], [0.3, 14.5, 2], [-0.45, 15, 0]]) {
      const p = P(s * A2, B2, h); rose(p[0], p[1], 1.2 * z, ['#ff6f9a', '#e8364f', '#ffffff'][c]); }
    for (const [b, h] of [[-0.08, 6], [0.05, 11], [0.1, 3]]) { const p = P(A2, b, h); rose(p[0], p[1], 1.1 * z, '#ff8fb1'); }
    if (lit) { for (let i = 0; i < 9; i++) { const p = heartPts[i * 4 + 2]; circle(p[0], p[1], 0.45 * z, '#ffe9a0'); glowAt(p[0], p[1], 6 * z, z); } }
  };

  window.ENTW_P4 = {
    'Pfau A: von vorn, Rad schimmert': pfauA,
    'Pfau B: schräg, Rad in der Tiefe': pfauB,
    'Koi-Teich A: Kois schwimmen': (cx, cy, z, now) => pond(cx, cy, z, now),
    'Koi-Teich B: mit Steinlaterne und Schilf': (cx, cy, z, now) => pond(cx, cy, z, now, lanternReeds),
    'Sternbrunnen A: zwei Schalen, Wasservorhang': brunnenA,
    'Sternbrunnen B: Sternbecken, fünf Wasserbögen': brunnenB,
    'Herzchen-Laube A: Gitterlaube mit Herzbogen': laubeA,
    'Herzchen-Laube B: Rosenlaube mit Herz-Eingang': laubeB,
  };
})();
