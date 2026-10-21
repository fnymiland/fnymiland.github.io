// Monumente in voller Qualität (Nutzer 21.10.2026: „cool, viele Details“): Obelisk und Koloss als ganze Anlagen 3×3, gezeichnet mit dem
// Rahmen der Wunderwerke (kit: K.P(a, b, up) in Feldern/Einheiten, K.block, kPave, kBed, lampPost, kitTree …).
// (0, eval)(await (await fetch('tools/monumente-voll.js')).text()); await monumenteVoll()  → window.__voll (data-URL)
(function monumenteVollTool() {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  const lit = () => night > 0.15;
  const glowP = (p, r, tint) => { const q = 0.4; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], r, tint); };
  const L = (col, w, z, pts) => { g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const mid = (p, q, t = 0.5) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const star = (x, y, r, fill) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(pts, fill); };
  function cypress(K, a, b, s = 1) {
    const [x, y] = K.P(a, b), z = K.z * s;
    ellipse(x, y + 0.5 * z, 4 * z, 1.8 * z, 'rgba(40,60,20,0.2)');
    L(C('#6e4a3a'), 1.2, z, [[x, y], [x, y - 4 * z]]);
    g.fillStyle = C('#2f6b3c'); g.beginPath(); g.moveTo(x, y - 30 * z); g.quadraticCurveTo(x + 6 * z, y - 14 * z, x + 3.6 * z, y - 3 * z); g.lineTo(x - 3.6 * z, y - 3 * z); g.quadraticCurveTo(x - 6 * z, y - 14 * z, x, y - 30 * z); g.fill();
    g.fillStyle = C('#3f8a4c'); g.beginPath(); g.moveTo(x, y - 30 * z); g.quadraticCurveTo(x - 6 * z, y - 14 * z, x - 3.6 * z, y - 3 * z); g.lineTo(x - 0.5 * z, y - 3 * z); g.quadraticCurveTo(x - 1.5 * z, y - 16 * z, x, y - 30 * z); g.fill();
  }
  function lamp(K, a, b) { const [x, y] = K.P(a, b); lampPost(x, y, K.z, 19); }
  // Sockel mit Kante: Block + goldene Zierleiste
  const plinth = (K, a, b, ha, hb, h, lift, wall, trim) => K.block({ a, b, ha, hb, h, lift, wall, type: 'flat', roof: shade(wall, 0.06), trim });

  // ---------- Löwe (Sphinx-Wächter) auf Sockel; dir: +1 schaut nach rechts, −1 nach links ----------
  function lion(K, a, b, dir) {
    const z = K.z;
    plinth(K, a, b, 0.17, 0.11, 9, 0, '#8f8577', GOLD_D);
    const [x, y0] = K.P(a, b, 9 + 1.4), y = y0 - 1 * z, S = '#e6c27a', SD = '#c99a52', SL = '#f6dca0';
    ellipse(x, y + 0.6 * z, 9 * z, 2.4 * z, 'rgba(60,40,20,0.18)');
    // Schwanz hinten
    g.strokeStyle = C(SD); g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(x - dir * 7 * z, y - 2 * z); g.quadraticCurveTo(x - dir * 11 * z, y - 1 * z, x - dir * 9 * z, y - 6 * z); g.stroke(); circle(x - dir * 9 * z, y - 6.4 * z, 1.1 * z, C('#a87a3a'));
    // Körper liegend
    ellipse(x - dir * 1.5 * z, y - 3.2 * z, 7.4 * z, 3.4 * z, C(S));
    ellipse(x - dir * 1.5 * z, y - 4.6 * z, 6 * z, 1.6 * z, C(SL));
    ellipse(x - dir * 5.5 * z, y - 2.6 * z, 2.8 * z, 2.4 * z, C(SD));                                      // Hinterbein
    // Vorderpfoten nach vorn
    for (const k of [0, 1]) { const px = x + dir * (4 + k * 1.2) * z, py = y - 0.6 * z + k * 0.4 * z; ellipse(px + dir * 2 * z, py, 3.4 * z, 1.1 * z, C(k ? S : SD)); for (const t of [0.6, 1.6, 2.6]) circle(px + dir * (3.2 + t * 0.4) * z, py + 0.2 * z, 0.45 * z, C('#b88c4c')); }
    // Mähne: Ring aus Locken
    const hx = x + dir * 4.6 * z, hy = y - 8.2 * z;
    for (let i = 0; i < 11; i++) { const ang = i / 11 * Math.PI * 2; circle(hx + Math.cos(ang) * 3.6 * z, hy + Math.sin(ang) * 3.9 * z, 1.9 * z, C(i % 2 ? '#b97e3a' : '#cf9447')); }
    circle(hx, hy, 3.3 * z, C('#d9a85a'));
    // Gesicht
    ellipse(hx + dir * 0.9 * z, hy + 0.2 * z, 2.6 * z, 2.9 * z, C(SL));
    ellipse(hx + dir * 1.6 * z, hy + 1.4 * z, 1.5 * z, 1.1 * z, C('#fff0c8'));                            // Schnauze
    circle(hx + dir * 2.4 * z, hy + 0.8 * z, 0.5 * z, C('#6b4030'));                                       // Nase
    circle(hx + dir * 0.4 * z, hy - 0.9 * z, 0.45 * z, C('#3a2a20')); circle(hx + dir * 1.9 * z, hy - 0.9 * z, 0.45 * z, C('#3a2a20'));
    circle(hx - dir * 1.4 * z, hy - 3.6 * z, 1 * z, C('#b97e3a'));                                         // Ohr
    if (lit()) glowP([x, y - 4 * z], 14 * z);
  }

  // ---------- 1 · Obelisk der Sonnenbucht (3×3) ----------
  function obelisk(K) {
    const z = K.z;
    // Platz: Plattenbelag mit Steinkante, Sternrose um den Sockel
    K.rect(-1.47, -1.47, 1.47, 1.47, C('#cbbf9f'));
    kPave(K, () => kRectPath(K, -1.4, -1.4, 1.4, 1.4), PATH_LOOK.platten, 0, 0, 3);
    K.oval(0, 0, 0.98, C('#d9c69a')); K.oval(0, 0, 0.9, C('#efe4c8'));
    for (let i = 0; i < 16; i++) {                                                                         // Sternrose
      const ang = i / 16 * Math.PI * 2, r = i % 2 ? 0.55 : 0.86, a1 = ang - 0.2, a2 = ang + 0.2, ri = 0.38;
      K.poly([[Math.cos(a1) * ri, Math.sin(a1) * ri], [Math.cos(ang) * r, Math.sin(ang) * r], [Math.cos(a2) * ri, Math.sin(a2) * ri]], C(i % 2 ? '#d9a35e' : '#c9734f'));
    }
    K.oval(0, 0, 0.4, C('#e2d4b0'));
    // Wege-Kreuz in die Mitte (Gold-Streifen)
    for (const [a0, b0, a1, b1] of [[-1.4, -0.06, -0.95, 0.06], [0.95, -0.06, 1.4, 0.06], [-0.06, -1.4, 0.06, -0.95], [-0.06, 0.95, 0.06, 1.4]]) K.rect(a0, b0, a1, b1, C('#e0b35a'));
    const parts = [];
    // Beete und Zypressen in den Ecken, Hecken an den Rändern, Laternen
    for (const [sa, sb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      parts.push([sa * 1.12, sb * 1.12, () => kBed(K, sa * 1.12, sb * 1.12, 0.26, (sa + 2) * 3 + sb)]);
      parts.push([sa * 1.2, sb * 1.2 + 0.01, () => cypress(K, sa * 1.22, sb * 1.22, 1)]);
      parts.push([sa * 0.72, sb * 0.72, () => lamp(K, sa * 0.74, sb * 0.74)]);
    }
    for (const [a, b, ha, hb] of [[-1.3, -0.5, 0.07, 0.3], [-1.3, 0.5, 0.07, 0.3], [-0.5, -1.3, 0.3, 0.07], [0.5, -1.3, 0.3, 0.07]]) parts.push([a, b, () => { K.block({ a, b, ha, hb, h: 6, wall: '#4f9a4a', type: 'flat', roof: '#6cbf5f' }); }]);
    for (const [a, b, ha, hb] of [[1.3, -0.5, 0.07, 0.3], [1.3, 0.5, 0.07, 0.3], [-0.5, 1.3, 0.3, 0.07], [0.5, 1.3, 0.3, 0.07]]) parts.push([a, b, () => { K.block({ a, b, ha, hb, h: 6, wall: '#4f9a4a', type: 'flat', roof: '#6cbf5f' }); for (let i = 0; i < 4; i++) { const p = K.P(a + (ha > hb ? (i - 1.5) * 0.15 : 0), b + (hb > ha ? (i - 1.5) * 0.15 : 0), 6); circle(p[0], p[1] - 0.5 * z, 1.1 * z, C(FLOWER_COLS[i % 5])); } }]);
    // Bänke
    for (const [a, b] of [[-0.95, 0.35], [0.35, -0.95]]) parts.push([a, b, () => { K.block({ a, b, ha: 0.12, hb: 0.05, h: 3, wall: '#8a5a3c', type: 'flat', roof: '#b07a52' }); }]);
    // Mitte: Stufen, Sockel, Obelisk
    parts.push([0, 0, () => {
      plinth(K, 0, 0, 0.6, 0.6, 3, 0, '#d8ccb0');
      plinth(K, 0, 0, 0.48, 0.48, 3, 3, '#e6dcc4');
      plinth(K, 0, 0, 0.36, 0.36, 12, 6, '#8f8577', GOLD);
      for (const n of [[0, 1], [1, 0]]) {                                                                  // Inschrift-Tafeln vorn
        const p = (t, up) => n[0] ? K.P(0.361, -0.2 + 0.4 * t, up) : K.P(-0.2 + 0.4 * t, 0.361, up);
        poly([p(0, 8.5), p(1, 8.5), p(1, 14.5), p(0, 14.5)], C(GOLD));
        for (let r = 0; r < 2; r++) L(C(GOLD_D), 0.5, z, [p(0.12, 10.4 + r * 2.2), p(0.88, 10.4 + r * 2.2)]);
      }
      // Schaft: verjüngt, zwei sichtbare Seiten, Fugen und Zeichen
      const B = 18, T = 150, sb = 0.17, st = 0.105;
      const face = n => { const pts = n[0] ? [K.P(sb, -sb, B), K.P(sb, sb, B), K.P(st, st, T), K.P(st, -st, T)] : [K.P(-sb, sb, B), K.P(sb, sb, B), K.P(st, st, T), K.P(-st, st, T)]; return pts; };
      const FP = (n, t, up) => { const s = sb + (st - sb) * (up - B) / (T - B); return n[0] ? K.P(s, -s + 2 * s * t, up) : K.P(-s + 2 * s * t, s, up); };
      for (const n of [[0, 1], [1, 0]]) {
        const base = n[0] ? '#d9c8a2' : '#f1e5c8';
        poly(face(n), C(base));
        poly([FP(n, 0.8, B), FP(n, 1, B), FP(n, 1, T), FP(n, 0.8, T)], C(shade(base, n[0] ? -0.08 : 0.06)));   // Kantenlicht
        for (let up = B + 16; up < T - 4; up += 16) L(C(shade(base, -0.12)), 0.35, z, [FP(n, 0, up), FP(n, 1, up)]);   // Steinfugen
        // Zeichenband: Sonne, Mond, Welle, Vogel, Stern – eigene Bildzeichen
        for (let i = 0; i < 7; i++) {
          const up = B + 10 + i * 17, c = FP(n, 0.5, up), k = 1 - i * 0.05, col = C(i % 2 ? '#b98b3a' : '#c9734f');
          const kind = (i + (n[0] ? 2 : 0)) % 5;
          if (kind === 0) { circle(c[0], c[1], 2.2 * z * k, col); for (let j = 0; j < 8; j++) { const ang = j / 8 * Math.PI * 2; L(col, 0.45, z, [[c[0] + Math.cos(ang) * 2.8 * z * k, c[1] + Math.sin(ang) * 2.8 * z * k], [c[0] + Math.cos(ang) * 3.9 * z * k, c[1] + Math.sin(ang) * 3.9 * z * k]]); } }
          else if (kind === 1) { g.fillStyle = col; g.beginPath(); g.arc(c[0], c[1], 2.8 * z * k, 0.35 * Math.PI, 1.65 * Math.PI); g.arc(c[0] + 1.3 * z * k, c[1], 2.2 * z * k, 1.55 * Math.PI, 0.45 * Math.PI, true); g.fill(); }
          else if (kind === 2) L(col, 0.7, z, [[c[0] - 3.4 * z * k, c[1]], [c[0] - 1.7 * z * k, c[1] - 1.6 * z * k], [c[0], c[1]], [c[0] + 1.7 * z * k, c[1] - 1.6 * z * k], [c[0] + 3.4 * z * k, c[1]]]);
          else if (kind === 3) L(col, 0.7, z, [[c[0] - 3.2 * z * k, c[1] - 1.4 * z * k], [c[0], c[1] + 0.8 * z * k], [c[0] + 3.2 * z * k, c[1] - 1.4 * z * k]]);
          else star(c[0], c[1], 3 * z * k, col);
        }
      }
      // Goldene Spitze (Pyramidion) mit Lichtkante
      const ap = K.P(0, 0, T + 16), c4 = [K.P(st, -st, T), K.P(st, st, T), K.P(-st, st, T)];
      poly([c4[1], c4[2], ap], lit() ? '#ffe58a' : C(GOLD)); poly([c4[0], c4[1], ap], lit() ? '#f2c24a' : C(GOLD_D));
      L(lit() ? '#fff6c8' : C(GOLD_L), 0.6, z, [c4[1], ap]);
      if (lit()) { glowP(ap, 70 * z); glowP(K.P(0, 0, T - 30), 34 * z); star(ap[0], ap[1] - 6 * z, 3.2 * z, '#ffffff'); }
      else { star(ap[0] + 4 * z, ap[1] + 2 * z, 1.6 * z, '#ffffff'); }
      if (lit()) for (const n of [[0, 1], [1, 0]]) glowP(FP(n, 0.5, B + 4), 26 * z);                     // Strahler am Fuß
    }]);
    // Löwen vorn am Weg
    parts.push([0.98, 0.38, () => lion(K, 0.98, 0.36, 1)]);
    parts.push([0.38, 0.98, () => lion(K, 0.36, 0.98, -1)]);
    K.scene(parts);
  }

  // ---------- 2 · Koloss am Hafen (3×3: Kai links, Kai rechts, Hafeneinfahrt dazwischen) ----------
  function koloss(K, now = 0) {
    const z = K.z, BR = '#c4873f', BR_D = '#8f5c2c', BR_L = '#e8b06a', PAT = '#6fae9a';
    // Wasser mit Wellen, Kaimauern aus Quadern
    K.rect(-1.5, -1.5, 1.5, 1.5, lit() ? '#2c4f7a' : C('#6fbfe3'));
    for (let i = 0; i < 9; i++) { const a = -0.4 + (i % 3) * 0.4, b = -1.3 + Math.floor(i / 3) * 1.1 + (i % 2) * 0.2, p = K.P(a, b), q = K.P(a + 0.18, b + 0.02); L(lit() ? 'rgba(170,210,255,0.5)' : 'rgba(255,255,255,0.65)', 0.8, z, [p, mid(p, q, 0.5).map((v, j) => v - (j ? 1.2 * z : 0)), q]); }
    for (const s of [-1, 1]) {
      const a0 = s < 0 ? -1.5 : 0.62, a1 = s < 0 ? -0.62 : 1.5;
      K.block({ a: (a0 + a1) / 2, b: 0, ha: (a1 - a0) / 2, hb: 1.5, h: 7, wall: '#bdb4a2', type: 'flat', roof: '#d9d0bc' });
      kPave(K, () => kRectPath(K, a0 + 0.04, -1.46, a1 - 0.04, 1.46), PATH_LOOK.kopf, 0, 0, 3);       // Kopfsteinpflaster oben
      // Quaderfugen an der Wasserseite
      const edgeA = s < 0 ? a1 : a0;
      for (let b = -1.5; b <= 1.5; b += 0.25) L(C('#9d9483'), 0.35, z, [K.P(edgeA, b, 0), K.P(edgeA, b, 7)]);
      L(C('#9d9483'), 0.35, z, [K.P(edgeA, -1.5, 3.5), K.P(edgeA, 1.5, 3.5)]);
      // Poller und Laternen am Kai
      for (const b of [-1.1, 1.1]) { const p = K.P(edgeA - s * 0.1, b, 7); cyl(p[0], p[1], 1.6 * z, 0.8 * z, 3 * z, '#4a4a58'); }
    }
    const parts = [];
    for (const s of [-1, 1]) {
      const a = s * 1.08, edgeA = s < 0 ? -0.62 : 0.62;
      parts.push([a, -1.25, () => lamp(K, a, -1.25)]);
      parts.push([a + s * 0.25, 1.15, () => { const p = K.P(a + s * 0.25, 1.15, 7); lampPost(p[0], p[1], z, 19); }]);
      // Sockel: getreppt, mit Löwenkopf-Relief und Fahnen
      parts.push([a, 0, () => {
        plinth(K, a, 0, 0.42, 0.46, 7, 7, '#cfc6b2');
        plinth(K, a, 0, 0.32, 0.36, 22, 14, '#e2d9c4', GOLD_D);
        const front = K.P(a, 0.361, 26); circle(front[0], front[1], 3.4 * z, C(GOLD_D)); circle(front[0], front[1], 2.4 * z, C(GOLD));
        for (const b of [-0.3, 0.3]) { const f = K.P(a + s * 0.28, b, 36); L(C('#6b4f3a'), 0.8, z, [f, [f[0], f[1] - 20 * z]]); const w = Math.sin(now / 300 + b * 5) * 1.5 * z; poly([[f[0], f[1] - 20 * z], [f[0] + 9 * z, f[1] - 17 * z + w], [f[0], f[1] - 14 * z]], C(s < 0 ? '#e8546f' : '#5b8fd8')); }
      }]);
    }
    // Schiff, das gerade durchfährt
    parts.push([0, 0.55, () => {
      const p = K.P(0.05, 0.55), x = p[0], y = p[1];
      poly([[x - 16 * z, y - 2 * z], [x + 12 * z, y + 6 * z], [x + 9 * z, y + 10 * z], [x - 14 * z, y + 3 * z]], C('#7a4e32'));
      poly([[x - 16 * z, y - 2 * z], [x + 12 * z, y + 6 * z], [x + 12 * z, y + 4 * z], [x - 16 * z, y - 4 * z]], C('#a8754e'));
      L(C('#5a3d28'), 0.9, z, [[x - 2 * z, y + 1 * z], [x - 2 * z, y - 30 * z]]);
      poly([[x - 1.5 * z, y - 29 * z], [x + 12 * z, y - 4 * z], [x - 1.5 * z, y - 3 * z]], C('#fffaf0')); poly([[x - 2.5 * z, y - 27 * z], [x - 13 * z, y - 6 * z], [x - 2.5 * z, y - 5 * z]], C('#f3e8d4'));
      poly([[x - 2 * z, y - 30 * z], [x + 5 * z, y - 28 * z], [x - 2 * z, y - 26 * z]], C('#e8546f'));
      L(lit() ? 'rgba(170,210,255,0.6)' : 'rgba(255,255,255,0.8)', 0.8, z, [[x + 12 * z, y + 8 * z], [x + 20 * z, y + 11 * z]]);
      if (lit()) glowP([x + 6 * z, y - 2 * z], 12 * z);
    }]);
    // Der Koloss: Füße auf den Sockeln, Hüfte über der Einfahrt
    parts.push([0, 0.01, () => {
      const fl = K.P(-1.08, 0, 36), fr = K.P(1.08, 0, 36), hip = K.P(0, 0, 150);
      const limb = (a, b, w0, w1, col, colD) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
        poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], C(col));
        poly([[a[0] + nx * w0 * 0.1, a[1] + ny * w0 * 0.1], [b[0] + nx * w1 * 0.1, b[1] + ny * w1 * 0.1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], C(colD)); };
      // Umhang hinter dem Körper
      g.fillStyle = C('#9c3d4a'); g.beginPath(); g.moveTo(hip[0] - 10 * z, hip[1] - 58 * z); g.quadraticCurveTo(hip[0] - 30 * z, hip[1] - 20 * z, hip[0] - 22 * z, hip[1] + 10 * z); g.lineTo(hip[0] - 8 * z, hip[1] + 2 * z); g.lineTo(hip[0] - 2 * z, hip[1] - 56 * z); g.fill();
      g.fillStyle = C('#7c2c38'); g.beginPath(); g.moveTo(hip[0] - 12 * z, hip[1] - 50 * z); g.quadraticCurveTo(hip[0] - 26 * z, hip[1] - 18 * z, hip[0] - 22 * z, hip[1] + 10 * z); g.lineTo(hip[0] - 17 * z, hip[1] + 6 * z); g.quadraticCurveTo(hip[0] - 20 * z, hip[1] - 20 * z, hip[0] - 12 * z, hip[1] - 50 * z); g.fill();
      // Beine: Oberschenkel, Knie, Wade, Sandalen
      for (const [foot, s] of [[fl, -1], [fr, 1]]) {
        const knee = [foot[0] * 0.55 + hip[0] * 0.45 + s * 3 * z, foot[1] * 0.55 + hip[1] * 0.45];
        limb(foot, knee, 5.2 * z, 6.4 * z, BR, BR_D); limb(knee, [hip[0] + s * 7 * z, hip[1]], 6.4 * z, 8.6 * z, BR, BR_D);
        circle(knee[0], knee[1], 5.6 * z, C(BR)); ellipse(knee[0] - s * 1 * z, knee[1] - 1 * z, 2.4 * z, 3.2 * z, C(BR_L));
        ellipse(foot[0], foot[1] + 1 * z, 8 * z, 3.4 * z, C(BR_D)); ellipse(foot[0], foot[1], 7 * z, 2.8 * z, C(BR));
        for (let i = 0; i < 3; i++) L(C(GOLD), 0.9, z, [[foot[0] - 5 * z, foot[1] - (2 + i * 4) * z], [foot[0] + 5 * z, foot[1] - (1 + i * 4) * z]]);   // Riemen
        L(C(BR_L), 1.2, z, [mid(foot, knee, 0.15).map((v, j) => v + (j ? 0 : -s * 2.5 * z)), mid(foot, knee, 0.8).map((v, j) => v + (j ? 0 : -s * 3 * z))]);   // Lichtkante
      }
      // Rock aus Lederstreifen mit Goldbeschlägen
      for (let i = 0; i < 9; i++) { const x0 = hip[0] - 13 * z + i * 3.2 * z; poly([[x0, hip[1] - 6 * z], [x0 + 3 * z, hip[1] - 6 * z], [x0 + 2.8 * z, hip[1] + 9 * z], [x0 + 0.2 * z, hip[1] + 9 * z]], C(i % 2 ? '#a8754e' : '#8a5a3c')); circle(x0 + 1.5 * z, hip[1] + 7 * z, 0.8 * z, C(GOLD)); }
      poly([[hip[0] - 14 * z, hip[1] - 9 * z], [hip[0] + 14 * z, hip[1] - 9 * z], [hip[0] + 14 * z, hip[1] - 5 * z], [hip[0] - 14 * z, hip[1] - 5 * z]], C(GOLD_D));   // Gürtel
      // Brustpanzer
      const sh = [hip[0], hip[1] - 52 * z];
      poly([[hip[0] - 13 * z, hip[1] - 9 * z], [hip[0] + 13 * z, hip[1] - 9 * z], [sh[0] + 17 * z, sh[1]], [sh[0] - 17 * z, sh[1]]], C(BR));
      poly([[hip[0], hip[1] - 9 * z], [hip[0] + 13 * z, hip[1] - 9 * z], [sh[0] + 17 * z, sh[1]], [sh[0], sh[1]]], C(BR_D));
      ellipse(sh[0] - 6 * z, sh[1] + 12 * z, 6 * z, 5 * z, C(BR_L)); ellipse(sh[0] + 6 * z, sh[1] + 12 * z, 6 * z, 5 * z, C(BR));
      L(C(BR_D), 0.6, z, [[sh[0], sh[1] + 6 * z], [sh[0], hip[1] - 12 * z]]);
      for (const k of [0.45, 0.65]) L(C(BR_D), 0.5, z, [[hip[0] - 11 * z, sh[1] + k * 44 * z], [hip[0] + 11 * z, sh[1] + k * 44 * z]]);
      circle(sh[0] - 4 * z, sh[1] + 22 * z, 1.4 * z, C(PAT)); circle(sh[0] + 9 * z, sh[1] + 30 * z, 1.1 * z, C(PAT));     // Grünspan
      // Arme: links stützt sich auf einen Schild mit Sonne, rechts hebt die Fackel
      const shL = [sh[0] - 15 * z, sh[1] + 3 * z], shR = [sh[0] + 15 * z, sh[1] + 3 * z];
      limb(shL, [shL[0] - 9 * z, shL[1] + 24 * z], 4.6 * z, 3.8 * z, BR, BR_D);
      const shield = [shL[0] - 12 * z, shL[1] + 30 * z];
      ellipse(shield[0], shield[1], 10 * z, 12 * z, C(BR_D)); ellipse(shield[0] + 1 * z, shield[1], 8.6 * z, 10.6 * z, C(BR));
      circle(shield[0] + 1 * z, shield[1], 4 * z, C(GOLD)); for (let j = 0; j < 12; j++) { const ang = j / 12 * Math.PI * 2; L(C(GOLD), 0.7, z, [[shield[0] + 1 * z + Math.cos(ang) * 5 * z, shield[1] + Math.sin(ang) * 5 * z], [shield[0] + 1 * z + Math.cos(ang) * 7.6 * z, shield[1] + Math.sin(ang) * 8.6 * z]]); }
      const elbow = [shR[0] + 8 * z, shR[1] - 20 * z], hand = [shR[0] + 10 * z, shR[1] - 46 * z];
      limb(shR, elbow, 4.6 * z, 4 * z, BR, BR_D); limb(elbow, hand, 4 * z, 3.4 * z, BR, BR_D); circle(elbow[0], elbow[1], 4 * z, C(BR));
      circle(hand[0], hand[1], 3.6 * z, C(BR_L));
      // Fackel / Leuchtschale
      poly([[hand[0] - 2 * z, hand[1] + 2 * z], [hand[0] + 2 * z, hand[1] + 2 * z], [hand[0] + 2.4 * z, hand[1] - 12 * z], [hand[0] - 2.4 * z, hand[1] - 12 * z]], C(GOLD_D));
      ellipse(hand[0], hand[1] - 13 * z, 7 * z, 2.6 * z, C(GOLD)); poly([[hand[0] - 7 * z, hand[1] - 13 * z], [hand[0] + 7 * z, hand[1] - 13 * z], [hand[0] + 4 * z, hand[1] - 9 * z], [hand[0] - 4 * z, hand[1] - 9 * z]], C(GOLD_D));
      const fl0 = [hand[0], hand[1] - 14 * z], fk = Math.sin(now / 120) * 1.2 * z;
      g.fillStyle = lit() ? '#ffb347' : C('#ff9a3c'); g.beginPath(); g.moveTo(fl0[0] - 6 * z, fl0[1]); g.quadraticCurveTo(fl0[0] - 7 * z, fl0[1] - 10 * z, fl0[0] + fk, fl0[1] - 20 * z); g.quadraticCurveTo(fl0[0] + 7 * z, fl0[1] - 10 * z, fl0[0] + 6 * z, fl0[1]); g.fill();
      g.fillStyle = lit() ? '#fff1a8' : C('#ffd23f'); g.beginPath(); g.moveTo(fl0[0] - 3 * z, fl0[1]); g.quadraticCurveTo(fl0[0] - 3.5 * z, fl0[1] - 7 * z, fl0[0] + fk * 0.6, fl0[1] - 13 * z); g.quadraticCurveTo(fl0[0] + 3.5 * z, fl0[1] - 7 * z, fl0[0] + 3 * z, fl0[1]); g.fill();
      if (lit()) { glowP([fl0[0], fl0[1] - 8 * z], 110 * z); glowP([fl0[0], fl0[1] - 8 * z], 40 * z); }
      // Hals, Kopf mit Helm und Strahlenkrone
      const head = [sh[0], sh[1] - 12 * z];
      poly([[sh[0] - 4 * z, sh[1] + 1 * z], [sh[0] + 4 * z, sh[1] + 1 * z], [sh[0] + 3.4 * z, sh[1] - 6 * z], [sh[0] - 3.4 * z, sh[1] - 6 * z]], C(BR_D));
      for (let j = 0; j < 9; j++) { const ang = -Math.PI * (0.05 + j * 0.1125); poly([[head[0] + Math.cos(ang - 0.08) * 8 * z, head[1] + Math.sin(ang - 0.08) * 8 * z], [head[0] + Math.cos(ang) * 17 * z, head[1] + Math.sin(ang) * 17 * z], [head[0] + Math.cos(ang + 0.08) * 8 * z, head[1] + Math.sin(ang + 0.08) * 8 * z]], lit() ? '#ffe58a' : C(GOLD)); }
      circle(head[0], head[1], 8.4 * z, C(BR)); ellipse(head[0] + 3 * z, head[1] + 0.5 * z, 5 * z, 7.4 * z, C(BR_D));
      ellipse(head[0] - 2.4 * z, head[1] - 1.5 * z, 2.6 * z, 3.4 * z, C(BR_L));
      L(C('#5a3a1e'), 0.7, z, [[head[0] - 4.4 * z, head[1] - 0.6 * z], [head[0] - 2 * z, head[1] - 0.6 * z]]); L(C('#5a3a1e'), 0.7, z, [[head[0] + 0.6 * z, head[1] - 0.6 * z], [head[0] + 3 * z, head[1] - 0.6 * z]]);
      L(C('#5a3a1e'), 0.6, z, [[head[0] - 2 * z, head[1] + 4 * z], [head[0] + 1 * z, head[1] + 4.4 * z]]);
      poly([[head[0] - 9 * z, head[1] - 3 * z], [head[0] + 9 * z, head[1] - 3 * z], [head[0] + 8 * z, head[1] - 7 * z], [head[0] - 8 * z, head[1] - 7 * z]], C(GOLD_D));   // Stirnreif
      if (lit()) glowP(head, 30 * z);
    }]);
    // Möwen
    parts.push([2, 2, () => { for (const [dx, dy, s] of [[-40, -150, 1], [-28, -160, 0.8], [38, -120, 0.9]]) { const p = K.P(0, 0); const x = p[0] + dx * z, y = p[1] + dy * z; L(lit() ? '#c8d2ff' : '#ffffff', 0.9 * s, z, [[x - 4 * z * s, y], [x - 1.5 * z * s, y - 2 * z * s], [x, y]]); L(lit() ? '#c8d2ff' : '#ffffff', 0.9 * s, z, [[x, y], [x + 1.5 * z * s, y - 2 * z * s], [x + 4 * z * s, y]]); } }]);
    K.scene(parts);
  }
  window.VOLL = [['Obelisk der Sonnenbucht', obelisk, 2.1], ['Koloss am Hafen', koloss, 1.62]];

  window.monumenteVoll = async (opts = {}) => {
    const DW = 560, DH = 560, NW = 280, NH = 280, list = opts.list || window.VOLL, shots = [];
    const gq = glowQuad, n0 = night, prevG = g, glows = [];
    glowQuad = (pts, r, tint) => { const m = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]); glows.push([m[0], m[1], r, tint === 'blue' ? '140,190,255' : '255,200,110']); };
    try {
      for (const [label, fn, zz] of list) {
        for (const nightOn of [false, true]) {
          const c = document.createElement('canvas'); const w = nightOn ? NW : DW, h = nightOn ? NH : DH; c.width = w; c.height = h; const cx = c.getContext('2d');
          g = ctx; night = nightOn ? 1 : 0;
          ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          const z = (nightOn ? 0.5 : 1) * (zz || 1.62);
          ctx.fillStyle = nightOn ? '#1f2846' : '#9fd27a'; ctx.fillRect(0, 0, w, h);
          const gx = w / 2, gy = h - 48 * z - (nightOn ? 8 : 18);
          diamond(gx, gy, 96 * z, 48 * z, nightOn ? '#33405e' : '#b4dd8c');
          const K = kit(gx, gy, z, 0);
          fn(K, 4000);
          ctx.globalCompositeOperation = 'lighter';
          for (const [x, y, r, col] of glows.splice(0)) { if (!nightOn) continue; const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.42)`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
          ctx.globalCompositeOperation = 'source-over';
          cx.drawImage(canvas, 0, 0, w * DPR, h * DPR, 0, 0, w, h);
          ctx.restore();
          shots.push([c, label, nightOn]);
        }
      }
    } finally { glowQuad = gq; night = n0; g = prevG; }
    const sheet = document.createElement('canvas'); sheet.width = (DW + NW + 24) * 1; sheet.height = list.length * (DH + 40);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let i = 0; i < list.length; i++) {
      const Y = i * (DH + 40) + 32, [d, l] = shots[i * 2], [n] = shots[i * 2 + 1];
      sx.font = '700 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, 6, Y - 8);
      sx.drawImage(d, 0, Y); sx.drawImage(n, DW + 12, Y + DH - NH);
      sx.font = '600 15px system-ui'; sx.fillText('nachts', DW + 14, Y + DH - NH - 8);
    }
    window.__voll = sheet.toDataURL('image/png');
    return [sheet.width, sheet.height];
  };
  return 'ok';
})();
