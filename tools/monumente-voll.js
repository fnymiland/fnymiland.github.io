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
  function lion(K, a, b, dir, lift = 0) {
    const z = K.z;
    plinth(K, a, b, 0.17, 0.11, 9, lift, '#8f8577', GOLD_D);
    const [x, y0] = K.P(a, b, lift + 9 + 1.4), y = y0 - 1 * z, S = '#e6c27a', SD = '#c99a52', SL = '#f6dca0';
    ellipse(x, y + 0.6 * z, 9 * z, 2.4 * z, 'rgba(60,40,20,0.18)');
    // Schwanz hinten
    g.strokeStyle = C(SD); g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(x - dir * 7 * z, y - 2 * z); g.quadraticCurveTo(x - dir * 9 * z, y - 2 * z, x - dir * 8 * z, y - 6 * z); g.stroke(); circle(x - dir * 8 * z, y - 6.4 * z, 1.1 * z, C('#a87a3a'));
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
  }

  function obeliskCore(K) {
    const z = K.z;
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
        if (!n[0]) poly([FP(n, 0, B), FP(n, 0.14, B), FP(n, 0.14, T), FP(n, 0, T)], C(shade(base, 0.07)));   // Lichtkante links (Sonne von links)
        for (let up = B + 16; up < T - 4; up += 16) L(C(shade(base, -0.12)), 0.35, z, [FP(n, 0, up), FP(n, 1, up)]);   // Steinfugen
        // Bildzeichen mittig zwischen den Fugen, in der Ebene der Fläche (jeder Punkt über FP): Sonne, Mond, Welle, Vogel, Stern
        for (let i = 0; i < 8; i++) {
          const up0 = B + 8 + i * 16, s0 = sb + (st - sb) * (up0 - B) / (T - B), col = C(i % 2 ? '#b98b3a' : '#c9734f'), k = 1 - i * 0.04;
          const M = (u, v) => FP(n, 0.5 + u / (35.8 * 2 * s0), up0 + v);                                         // u: längs der Fläche, v: Höhe (Einheiten)
          const kind = (i + (n[0] ? 2 : 0)) % 5, ring = (r, m = 16) => Array.from({ length: m }, (_, j) => M(Math.cos(j / m * Math.PI * 2) * r, Math.sin(j / m * Math.PI * 2) * r));
          if (kind === 0) { poly(ring(2.2 * k), col); for (let j = 0; j < 8; j++) { const ang = j / 8 * Math.PI * 2; L(col, 0.45, z, [M(Math.cos(ang) * 3 * k, Math.sin(ang) * 3 * k), M(Math.cos(ang) * 4.2 * k, Math.sin(ang) * 4.2 * k)]); } }
          else if (kind === 1) { const o = ring(3 * k, 20), inn = Array.from({ length: 20 }, (_, j) => M(1.4 * k + Math.cos(j / 20 * Math.PI * 2) * 2.4 * k, Math.sin(j / 20 * Math.PI * 2) * 2.4 * k)); g.fillStyle = col; g.beginPath(); o.forEach((p, j) => j ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); inn.forEach((p, j) => j ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill('evenodd'); }
          else if (kind === 2) L(col, 0.7, z, [M(-3.6 * k, 0), M(-1.8 * k, 1.6 * k), M(0, 0), M(1.8 * k, 1.6 * k), M(3.6 * k, 0)]);
          else if (kind === 3) L(col, 0.7, z, [M(-3.4 * k, 1.4 * k), M(0, -0.8 * k), M(3.4 * k, 1.4 * k)]);
          else { const pts = []; for (let j = 0; j < 10; j++) { const ang = Math.PI / 2 + j * Math.PI / 5, r = (j % 2 ? 1.3 : 3.2) * k; pts.push(M(Math.cos(ang) * r, Math.sin(ang) * r)); } poly(pts, col); }
        }
      }
      // Goldene Spitze (Pyramidion) mit Lichtkante
      const ap = K.P(0, 0, T + 16), c4 = [K.P(st, -st, T), K.P(st, st, T), K.P(-st, st, T)];
      poly([c4[1], c4[2], ap], lit() ? '#ffe58a' : C(GOLD)); poly([c4[0], c4[1], ap], lit() ? '#f2c24a' : C(GOLD_D));
      L(lit() ? '#fff6c8' : C(GOLD_L), 0.6, z, [c4[1], ap]);
      if (lit()) glowP(ap, 44 * z);                                                                       // nur die Spitze glimmt
      if (lit()) for (const n of [[0, 1], [1, 0]]) glowP(FP(n, 0.5, B + 2), 16 * z);                     // Strahler am Fuß, schwach
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
    // spiegelgleich zur Blickachse (a ↔ b): Beete in allen Ecken, Zypressen nur links, rechts, hinten (vorn frei), Laternen an den hinteren
    // Wegen, Hecken mit Abstand zu Beeten und Löwen
    for (const [sa, sb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      parts.push([sa * 1.15, sb * 1.15, () => kBed(K, sa * 1.15, sb * 1.15, 0.22, (sa + 2) * 3 + sb)]);
      if (!(sa > 0 && sb > 0)) parts.push([sa * 1.16, sb * 1.16 + 0.01, () => cypress(K, sa * 1.16, sb * 1.16, 1)]);
    }
    for (const [a, b] of [[-1.15, 0.3], [-1.15, -0.3], [0.3, -1.15], [-0.3, -1.15]]) parts.push([a, b, () => lamp(K, a, b)]);
    const hedge = (a, b, ha, hb, flowers) => parts.push([a, b, () => { K.block({ a, b, ha, hb, h: 6, wall: '#4f9a4a', type: 'flat', roof: '#6cbf5f' }); if (flowers) for (let i = 0; i < 3; i++) { const p = K.P(a + (ha > hb ? (i - 1) * 0.12 : 0), b + (hb > ha ? (i - 1) * 0.12 : 0), 6); circle(p[0], p[1] - 0.5 * z, 1.1 * z, C(FLOWER_COLS[(i + 1) % 5])); } }]);
    for (const e of [-1.32, 1.32]) for (const m of [-0.66, 0.66]) { hedge(e, m, 0.06, 0.19, e > 0); hedge(m, e, 0.19, 0.06, e > 0); }
    // Bänke
    for (const [a, b] of [[-0.92, 0.42], [0.42, -0.92]]) parts.push([a, b, () => { K.block({ a, b, ha: 0.12, hb: 0.05, h: 3, wall: '#8a5a3c', type: 'flat', roof: '#b07a52' }); }]);
    // Mitte: Stufen, Sockel, Obelisk
    parts.push([0, 0, () => {
      plinth(K, 0, 0, 0.56, 0.56, 3, 0, '#d8ccb0');
      plinth(K, 0, 0, 0.48, 0.48, 3, 3, '#e6dcc4');
      plinth(K, 0, 0, 0.36, 0.36, 12, 6, '#8f8577', GOLD);
      obeliskCore(K);
    }]);
    // Löwen vorn am Weg
    parts.push([1.1, 0.26, () => lion(K, 1.1, 0.26, 1)]);                                             // Löwen am Eingang der vorderen Wege
    parts.push([0.26, 1.1, () => lion(K, 0.26, 1.1, -1)]);
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
  // Gewand mit Falten: Saum unten (Breite wb), Schultern oben (Breite ws), Höhe hh; Mitte x, Fuß y. sway: Wehen zur Seite
  function robe(x, y, wb, ws, hh, z, col, colD, colL, sway = 0) {
    const top = y - hh;
    g.fillStyle = C(col); g.beginPath(); g.moveTo(x - ws, top);
    g.bezierCurveTo(x - ws * 1.1, top + hh * 0.4, x - wb * 0.95 + sway, y - hh * 0.2, x - wb + sway * 1.4, y);
    for (let i = 0; i <= 8; i++) { const t = i / 8; g.lineTo(x - wb + 2 * wb * t + sway * 1.4 * (1 - t), y + Math.sin(t * Math.PI * 4) * 1.4 * z); }
    g.bezierCurveTo(x + wb * 0.9, y - hh * 0.25, x + ws * 1.1, top + hh * 0.4, x + ws, top); g.closePath(); g.fill();
    g.fillStyle = C(colD); g.beginPath(); g.moveTo(x + ws * 0.15, top);                                       // Schattenseite
    g.bezierCurveTo(x + ws * 0.2, top + hh * 0.5, x + wb * 0.25, y - hh * 0.2, x + wb * 0.3, y + 1 * z); g.lineTo(x + wb, y);
    g.bezierCurveTo(x + wb * 0.9, y - hh * 0.25, x + ws * 1.1, top + hh * 0.4, x + ws, top); g.closePath(); g.fill();
    for (let i = 0; i < 7; i++) {                                                                              // Falten
      const t = (i + 0.5) / 7, xb = x - wb + 2 * wb * t + sway * 1.4 * (1 - t), xt = x - ws * 0.7 + ws * 1.4 * t;
      g.strokeStyle = C(i % 2 ? colD : colL); g.lineWidth = (i % 2 ? 1.1 : 0.8) * z; g.beginPath(); g.moveTo(xt, top + hh * 0.25); g.quadraticCurveTo((xt + xb) / 2 + sway * 0.4, y - hh * 0.4, xb, y - 1 * z); g.stroke();
    }
  }
  const limb2 = (a, b, w0, w1, col, colD) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], C(col));
    poly([[a[0], a[1]], [b[0], b[1]], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], C(colD)); circle(b[0], b[1], w1, C(col)); };
  function rays(head, r0, r1, z, n = 9) { for (let j = 0; j < n; j++) { const ang = -Math.PI * (0.06 + j * 0.88 / (n - 1)); poly([[head[0] + Math.cos(ang - 0.09) * r0, head[1] + Math.sin(ang - 0.09) * r0], [head[0] + Math.cos(ang) * r1, head[1] + Math.sin(ang) * r1], [head[0] + Math.cos(ang + 0.09) * r0, head[1] + Math.sin(ang + 0.09) * r0]], lit() ? '#ffe58a' : C(GOLD)); } }
  function face(head, r, z, BR, BR_D, BR_L, hair) {
    if (hair) { ellipse(head[0] - 1 * z, head[1] + r * 0.5, r * 1.15, r * 1.25, C(hair)); }
    circle(head[0], head[1], r, C(BR)); ellipse(head[0] + r * 0.35, head[1] + r * 0.05, r * 0.62, r * 0.9, C(BR_D));
    ellipse(head[0] - r * 0.3, head[1] - r * 0.2, r * 0.32, r * 0.42, C(BR_L));
    for (const dx of [-0.42, 0.18]) { ellipse(head[0] + dx * r, head[1] - r * 0.05, r * 0.16, r * 0.1, C('#4a2e16')); }
    L(C('#7a4a24'), 0.6, z, [[head[0] - 0.05 * r, head[1] + 0.05 * r], [head[0] - 0.12 * r, head[1] + 0.32 * r]]);
    L(C('#6a3a1c'), 0.6, z, [[head[0] - 0.3 * r, head[1] + 0.5 * r], [head[0] + 0.12 * r, head[1] + 0.52 * r]]);
  }
  function lantern(p, z, now) {                                                                                 // große Laterne mit Flamme
    const [x, y] = p;
    L(C(GOLD_D), 0.9, z, [[x, y], [x, y - 4 * z]]);
    poly([[x - 5 * z, y - 4 * z], [x + 5 * z, y - 4 * z], [x + 4 * z, y - 6 * z], [x - 4 * z, y - 6 * z]], C(GOLD_D));
    poly([[x - 4.2 * z, y - 6 * z], [x + 4.2 * z, y - 6 * z], [x + 3.6 * z, y - 17 * z], [x - 3.6 * z, y - 17 * z]], lit() ? '#fff1a8' : C('#ffe08a'));
    for (const dx of [-4, 0, 4]) L(C(GOLD_D), 0.8, z, [[x + dx * z, y - 6 * z], [x + dx * 0.86 * z, y - 17 * z]]);
    const f = Math.sin(now / 140) * 0.8 * z; g.fillStyle = lit() ? '#ffffff' : C('#ff9a3c'); g.beginPath(); g.moveTo(x - 1.8 * z, y - 8 * z); g.quadraticCurveTo(x + f, y - 16 * z, x + 1.8 * z, y - 8 * z); g.fill();
    poly([[x - 5 * z, y - 17 * z], [x + 5 * z, y - 17 * z], [x, y - 23 * z]], C(GOLD)); circle(x, y - 24 * z, 1.4 * z, C(GOLD));
    if (lit()) { glowP([x, y - 12 * z], 130 * z); glowP([x, y - 12 * z], 36 * z); }
  }
  const BRZ = ['#c4873f', '#8f5c2c', '#e8b06a'];
  function harbor(K, quayA) {                                                                                  // Wasser mit Wellen
    const z = K.z;
    K.rect(-1.5, -1.5, 1.5, 1.5, lit() ? '#2c4f7a' : C('#6fbfe3'));
    for (let i = 0; i < 14; i++) { const a = -1.3 + (i * 0.37) % 2.6, b = -1.3 + (i * 0.71) % 2.6, p = K.P(a, b), q = K.P(a + 0.16, b + 0.02); L(lit() ? 'rgba(170,210,255,0.5)' : 'rgba(255,255,255,0.65)', 0.8, z, [p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - 1.2 * z], q]); }
  }
  function boat(p, z, col = '#7a4e32', sail = '#fffaf0', flip = 1) {
    const [x, y] = p;
    poly([[x - 12 * z * flip, y - 2 * z], [x + 10 * z * flip, y + 4 * z], [x + 7 * z * flip, y + 8 * z], [x - 10 * z * flip, y + 2 * z]], C(col));
    L(C('#5a3d28'), 0.8, z, [[x, y + 1 * z], [x, y - 22 * z]]); poly([[x + 0.6 * z * flip, y - 21 * z], [x + 9 * z * flip, y - 3 * z], [x + 0.6 * z * flip, y - 2 * z]], C(sail)); poly([[x - 0.8 * z * flip, y - 19 * z], [x - 8 * z * flip, y - 4 * z], [x - 0.8 * z * flip, y - 3 * z]], C(shade(sail, -0.06)));
    if (lit()) glowP([x, y - 2 * z], 10 * z);
  }
  // ---------- Koloss A: breitbeinig über der Einfahrt, kräftig gebaut, Tunika bis zum Knie ----------
  function kolossA(K, now = 0) {
    const z = K.z, [BR, BR_D, BR_L] = BRZ;
    harbor(K);
    for (const s of [-1, 1]) {
      const a0 = s < 0 ? -1.5 : 0.75, a1 = s < 0 ? -0.75 : 1.5, edgeA = s < 0 ? a1 : a0;
      K.block({ a: (a0 + a1) / 2, b: 0, ha: (a1 - a0) / 2, hb: 1.5, h: 7, wall: '#bdb4a2', type: 'flat', roof: '#d9d0bc' });
      kPave(K, () => kRectPath(K, a0 + 0.04, -1.46, a1 - 0.04, 1.46), PATH_LOOK.kopf, 0, 0, 3);
      for (let b = -1.5; b <= 1.5; b += 0.25) L(C('#9d9483'), 0.35, z, [K.P(edgeA, b, 0), K.P(edgeA, b, 7)]);
    }
    const parts = [];
    for (const s of [-1, 1]) {
      const a = s * 1.0;
      parts.push([a + s * 0.3, -1.2, () => lamp(K, a + s * 0.3, -1.2)]);
      parts.push([a + s * 0.3, 1.2, () => { const p = K.P(a + s * 0.3, 1.2, 7); lampPost(p[0], p[1], z, 19); }]);
      parts.push([a, 0, () => { plinth(K, a, 0, 0.36, 0.42, 7, 7, '#cfc6b2'); plinth(K, a, 0, 0.27, 0.32, 16, 14, '#e2d9c4', GOLD_D); const f = K.P(a, 0.321, 22); circle(f[0], f[1], 3 * z, C(GOLD)); }]);
    }
    parts.push([0, 0.6, () => boat(K.P(0, 0.62), z)]);
    parts.push([0, 0.01, () => {
      const fl = K.P(-1.0, 0, 30), fr = K.P(1.0, 0, 30), hip = K.P(0, 0, 96);
      // Umhang hinten
      g.fillStyle = C('#9c3d4a'); g.beginPath(); g.moveTo(hip[0] - 16 * z, hip[1] - 50 * z); g.bezierCurveTo(hip[0] - 34 * z, hip[1] - 20 * z, hip[0] - 34 * z, hip[1] + 10 * z, hip[0] - 26 * z, hip[1] + 22 * z); g.lineTo(hip[0] + 4 * z, hip[1] + 4 * z); g.lineTo(hip[0] + 6 * z, hip[1] - 50 * z); g.fill();
      for (const [foot, sd] of [[fl, -1], [fr, 1]]) {                                                           // Beine: Wade, Knie, Oberschenkel
        const knee = [foot[0] * 0.5 + hip[0] * 0.5 + sd * 4 * z, foot[1] * 0.5 + hip[1] * 0.5];
        limb2(foot, knee, 5 * z, 7 * z, BR, BR_D); limb2(knee, [hip[0] + sd * 9 * z, hip[1] - 2 * z], 7 * z, 10 * z, BR, BR_D);
        ellipse(mid(foot, knee, 0.45)[0] - sd * 2.4 * z, mid(foot, knee, 0.45)[1], 3 * z, 6 * z, C(BR_L));      // Wade
        ellipse(foot[0] + sd * 2 * z, foot[1] + 1 * z, 9 * z, 3.6 * z, C(BR_D)); ellipse(foot[0] + sd * 2 * z, foot[1], 8 * z, 3 * z, C(BR));
        for (let i = 0; i < 3; i++) L(C(GOLD), 1, z, [[foot[0] - 4 * z, foot[1] - (3 + i * 4) * z], [foot[0] + 4 * z, foot[1] - (2 + i * 4) * z]]);
      }
      robe(hip[0], hip[1] + 8 * z, 20 * z, 16 * z, 22 * z, z, '#d9c49a', '#b8a070', '#efe2c4', 2 * z);         // Tunika bis zum Knie
      poly([[hip[0] - 17 * z, hip[1] - 14 * z], [hip[0] + 17 * z, hip[1] - 14 * z], [hip[0] + 16 * z, hip[1] - 10 * z], [hip[0] - 16 * z, hip[1] - 10 * z]], C(GOLD_D));
      const sh = [hip[0], hip[1] - 50 * z];                                                                   // breiter Oberkörper mit Panzer
      g.fillStyle = C(BR); g.beginPath(); g.moveTo(hip[0] - 15 * z, hip[1] - 12 * z); g.bezierCurveTo(hip[0] - 18 * z, hip[1] - 30 * z, sh[0] - 26 * z, sh[1] + 6 * z, sh[0] - 22 * z, sh[1]); g.lineTo(sh[0] + 22 * z, sh[1]); g.bezierCurveTo(sh[0] + 26 * z, sh[1] + 6 * z, hip[0] + 18 * z, hip[1] - 30 * z, hip[0] + 15 * z, hip[1] - 12 * z); g.closePath(); g.fill();
      g.fillStyle = C(BR_D); g.beginPath(); g.moveTo(hip[0] + 2 * z, hip[1] - 12 * z); g.lineTo(sh[0] + 4 * z, sh[1]); g.lineTo(sh[0] + 22 * z, sh[1]); g.bezierCurveTo(sh[0] + 26 * z, sh[1] + 6 * z, hip[0] + 18 * z, hip[1] - 30 * z, hip[0] + 15 * z, hip[1] - 12 * z); g.closePath(); g.fill();
      ellipse(sh[0] - 8 * z, sh[1] + 13 * z, 7.5 * z, 6 * z, C(BR_L)); ellipse(sh[0] + 8 * z, sh[1] + 13 * z, 7.5 * z, 6 * z, C(BR));
      for (const k of [0.55, 0.7, 0.85]) L(C(BR_D), 0.6, z, [[hip[0] - 13 * z, sh[1] + k * 38 * z], [hip[0] + 13 * z, sh[1] + k * 38 * z]]);
      circle(sh[0] - 5 * z, sh[1] + 24 * z, 1.4 * z, C('#6fae9a')); circle(sh[0] + 10 * z, sh[1] + 30 * z, 1.1 * z, C('#6fae9a'));
      // Schultern, Arme: links Schild, rechts Laterne hoch
      const shL = [sh[0] - 21 * z, sh[1] + 3 * z], shR = [sh[0] + 21 * z, sh[1] + 3 * z];
      circle(shL[0], shL[1], 7 * z, C(BR)); circle(shR[0], shR[1], 7 * z, C(BR_D));
      const elL = [shL[0] - 6 * z, shL[1] + 20 * z]; limb2(shL, elL, 6.4 * z, 5.4 * z, BR, BR_D);
      const shield = [elL[0] - 8 * z, elL[1] + 10 * z];
      ellipse(shield[0], shield[1], 12 * z, 14 * z, C(BR_D)); ellipse(shield[0] + 1.2 * z, shield[1], 10.4 * z, 12.6 * z, C(BR)); circle(shield[0] + 1.2 * z, shield[1], 4.6 * z, C(GOLD));
      for (let j = 0; j < 12; j++) { const ang = j / 12 * Math.PI * 2; L(C(GOLD), 0.8, z, [[shield[0] + 1.2 * z + Math.cos(ang) * 6 * z, shield[1] + Math.sin(ang) * 6 * z], [shield[0] + 1.2 * z + Math.cos(ang) * 9 * z, shield[1] + Math.sin(ang) * 10.4 * z]]); }
      const elR = [shR[0] + 9 * z, shR[1] - 18 * z], hand = [shR[0] + 8 * z, shR[1] - 40 * z];
      limb2(shR, elR, 6.4 * z, 5.4 * z, BR, BR_D); limb2(elR, hand, 5.4 * z, 4.6 * z, BR, BR_D);
      lantern([hand[0], hand[1] - 2 * z], z, now);
      poly([[sh[0] - 5 * z, sh[1] + 1 * z], [sh[0] + 5 * z, sh[1] + 1 * z], [sh[0] + 4.4 * z, sh[1] - 7 * z], [sh[0] - 4.4 * z, sh[1] - 7 * z]], C(BR_D));
      const head = [sh[0] + 1 * z, sh[1] - 16 * z];
      rays(head, 10 * z, 21 * z, z); face(head, 10.5 * z, z, BR, BR_D, BR_L, '#7a4a24');
      poly([[head[0] - 11 * z, head[1] - 3 * z], [head[0] + 11 * z, head[1] - 3 * z], [head[0] + 10 * z, head[1] - 7.5 * z], [head[0] - 10 * z, head[1] - 7.5 * z]], C(GOLD_D));
    }]);
    parts.push([2, 2, () => { for (const [dx, dy, s] of [[-50, -170, 1], [-36, -180, 0.8], [46, -140, 0.9]]) { const p = K.P(0, 0); const x = p[0] + dx * z, y = p[1] + dy * z; L(lit() ? '#c8d2ff' : '#ffffff', 0.9 * s, z, [[x - 4 * z * s, y], [x - 1.5 * z * s, y - 2 * z * s], [x, y], [x + 1.5 * z * s, y - 2 * z * s], [x + 4 * z * s, y]]); } }]);
    K.scene(parts);
  }
  // ---------- Koloss B: Hüterin des Hafens – Gewand, Laterne, auf einem Turm auf der Felseninsel ----------
  function kolossB(K, now = 0) {
    const z = K.z, [BR, BR_D, BR_L] = BRZ;
    harbor(K);
    // Felseninsel: Schichten aus Fels, Kairing mit Stufen
    K.oval(0, 0, 0.95, C('#7d7568')); K.oval(-0.04, -0.04, 0.86, C('#9a9284')); K.oval(-0.08, -0.08, 0.7, C('#b3ab9c'));
    for (const [a, b, r] of [[0.7, 0.3, 0.16], [0.35, 0.72, 0.13], [-0.75, 0.2, 0.12], [0.6, -0.55, 0.12]]) { K.oval(a, b, r, C('#8a8274')); K.oval(a - 0.03, b - 0.03, r * 0.7, C('#a39b8c')); }
    const parts = [];
    parts.push([-1.05, 0.85, () => boat(K.P(-1.05, 0.85), z, '#7a4e32', '#fffaf0', 1)]);
    parts.push([1.05, -0.6, () => boat(K.P(1.05, -0.6), z * 0.8, '#5b6fa8', '#fff3d6', -1)]);
    parts.push([0, 0, () => {
      // Turm-Sockel: rund, Fenster, Goldband, Leuchtring
      const base = K.P(0, 0, 4);
      cyl(base[0], base[1], 34 * z, 17 * z, 10 * z, '#cfc6b2');
      cyl(base[0], base[1] - 10 * z, 27 * z, 13.5 * z, 44 * z, '#ede4cf');
      for (let i = 0; i < 4; i++) { const t = -0.7 + i * 0.45, wx = base[0] + Math.sin(t) * 22 * z, wy = base[1] - 30 * z + Math.cos(t) * 4 * z; poly([[wx - 2.4 * z, wy], [wx + 2.4 * z, wy], [wx + 2.4 * z, wy - 9 * z], [wx, wy - 11.5 * z], [wx - 2.4 * z, wy - 9 * z]], lit() ? '#ffd27a' : C('#5d8fb8')); if (lit()) glowP([wx, wy - 5 * z], 10 * z); }
      poly([[base[0] - 3.6 * z, base[1] - 10 * z + 13 * z], [base[0] + 3.6 * z, base[1] - 10 * z + 13 * z], [base[0] + 3.6 * z, base[1] - 10 * z + 1 * z], [base[0], base[1] - 10 * z - 3 * z], [base[0] - 3.6 * z, base[1] - 10 * z + 1 * z]], C('#8a5a3c'));   // Tür
      cyl(base[0], base[1] - 54 * z, 30 * z, 15 * z, 4 * z, GOLD_D);
      for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2; if (Math.sin(ang) < -0.2) continue; const lx = base[0] + Math.cos(ang) * 29 * z, ly = base[1] - 57 * z + Math.sin(ang) * 14.5 * z; circle(lx, ly, 1.3 * z, lit() ? '#fff1a8' : C('#fff3c4')); if (lit() && i % 2) glowP([lx, ly], 9 * z); }
      // Figur im Gewand
      const ft = [base[0], base[1] - 58 * z];
      robe(ft[0], ft[1], 24 * z, 14 * z, 74 * z, z, BR, BR_D, BR_L, -6 * z);
      g.fillStyle = C(BR_D); g.beginPath(); g.moveTo(ft[0] - 14 * z, ft[1] - 70 * z); g.bezierCurveTo(ft[0] - 30 * z, ft[1] - 40 * z, ft[0] - 30 * z, ft[1] - 14 * z, ft[0] - 34 * z, ft[1] - 2 * z); g.lineTo(ft[0] - 20 * z, ft[1] - 6 * z); g.bezierCurveTo(ft[0] - 20 * z, ft[1] - 30 * z, ft[0] - 16 * z, ft[1] - 50 * z, ft[0] - 10 * z, ft[1] - 66 * z); g.fill();   // Tuch weht
      poly([[ft[0] - 12 * z, ft[1] - 46 * z], [ft[0] + 12 * z, ft[1] - 46 * z], [ft[0] + 12 * z, ft[1] - 42 * z], [ft[0] - 12 * z, ft[1] - 42 * z]], C(GOLD));   // Gürtel
      circle(ft[0] - 6 * z, ft[1] - 26 * z, 1.4 * z, C('#6fae9a')); circle(ft[0] + 8 * z, ft[1] - 14 * z, 1.2 * z, C('#6fae9a'));
      const sh = [ft[0], ft[1] - 74 * z], shL = [sh[0] - 13 * z, sh[1] + 3 * z], shR = [sh[0] + 13 * z, sh[1] + 3 * z];
      // linker Arm hält eine Tafel mit Stern
      const elL = [shL[0] - 3 * z, shL[1] + 18 * z]; limb2(shL, elL, 4.6 * z, 4 * z, BR, BR_D);
      poly([[elL[0] - 9 * z, elL[1] - 6 * z], [elL[0] + 3 * z, elL[1] - 9 * z], [elL[0] + 5 * z, elL[1] + 8 * z], [elL[0] - 7 * z, elL[1] + 11 * z]], C(BR_D));
      poly([[elL[0] - 8 * z, elL[1] - 5.4 * z], [elL[0] + 2.6 * z, elL[1] - 8 * z], [elL[0] + 4.2 * z, elL[1] + 7 * z], [elL[0] - 6.4 * z, elL[1] + 9.6 * z]], C(BR));
      star(elL[0] - 1.8 * z, elL[1] + 0.8 * z, 3.4 * z, C(GOLD));
      // rechter Arm hebt die Laterne
      const elR = [shR[0] + 7 * z, shR[1] - 16 * z], hand = [shR[0] + 6 * z, shR[1] - 36 * z];
      limb2(shR, elR, 4.6 * z, 4 * z, BR, BR_D); limb2(elR, hand, 4 * z, 3.4 * z, BR, BR_D);
      lantern([hand[0], hand[1] - 1 * z], z * 1.1, now);
      poly([[sh[0] - 4 * z, sh[1] + 1 * z], [sh[0] + 4 * z, sh[1] + 1 * z], [sh[0] + 3.4 * z, sh[1] - 6 * z], [sh[0] - 3.4 * z, sh[1] - 6 * z]], C(BR_D));
      const head = [sh[0], sh[1] - 14 * z];
      rays(head, 8.6 * z, 18 * z, z, 7);
      g.fillStyle = C('#8a5a2c'); g.beginPath(); g.ellipse(head[0] - 1.5 * z, head[1] + 4 * z, 9.5 * z, 11 * z, 0, 0, Math.PI * 2); g.fill();   // Haar, lang
      face(head, 8.4 * z, z, BR, BR_D, BR_L, null);
      g.fillStyle = C('#8a5a2c'); g.beginPath(); g.arc(head[0], head[1] - 1 * z, 8.8 * z, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      poly([[head[0] - 9 * z, head[1] - 4 * z], [head[0] + 9 * z, head[1] - 4 * z], [head[0] + 8 * z, head[1] - 7.5 * z], [head[0] - 8 * z, head[1] - 7.5 * z]], C(GOLD_D));
    }]);
    parts.push([2, 2, () => { for (const [dx, dy, s] of [[-50, -150, 1], [-38, -160, 0.8], [48, -120, 0.9]]) { const p = K.P(0, 0); const x = p[0] + dx * z, y = p[1] + dy * z; L(lit() ? '#c8d2ff' : '#ffffff', 0.9 * s, z, [[x - 4 * z * s, y], [x - 1.5 * z * s, y - 2 * z * s], [x, y], [x + 1.5 * z * s, y - 2 * z * s], [x + 4 * z * s, y]]); } }]);
    K.scene(parts);
  }
  // Platz-Grundlage für viele Monumente: Rand, Belag, Beete in den Ecken, Zypressen links/rechts/hinten, Laternen hinten
  function plaza(K, look, parts, opts = {}) {
    const z = K.z;
    K.rect(-1.47, -1.47, 1.47, 1.47, C('#cbbf9f'));
    kPave(K, () => kRectPath(K, -1.4, -1.4, 1.4, 1.4), look, 0, 0, 3);
    if (opts.beds !== false) for (const [sa, sb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      parts.push([sa * 1.15, sb * 1.15, () => kBed(K, sa * 1.15, sb * 1.15, 0.22, (sa + 2) * 3 + sb)]);
      if (!(sa > 0 && sb > 0)) parts.push([sa * 1.16, sb * 1.16 + 0.01, () => cypress(K, sa * 1.16, sb * 1.16, 1)]);
    }
  }
  const hedgeAt = (K, parts, a, b, ha, hb, flowers) => parts.push([a, b, () => { const z = K.z; K.block({ a, b, ha, hb, h: 6, wall: '#4f9a4a', type: 'flat', roof: '#6cbf5f' }); if (flowers) for (let i = 0; i < 3; i++) { const p = K.P(a + (ha > hb ? (i - 1) * 0.12 : 0), b + (hb > ha ? (i - 1) * 0.12 : 0), 6); circle(p[0], p[1] - 0.5 * z, 1.1 * z, C(FLOWER_COLS[(i + 1) % 5])); } }]);

  // ---------- 3 · Triumphbogen (3×3): Straße längs a hindurch, drei Bögen, Säulen, Attika, goldenes Viergespann ----------
  function triumph(K, now = 0) {
    const z = K.z, ST = '#efe7d6', STD = '#d9cdb4', ha = 0.36, hb = 1.02, H = 78;
    const parts = [];
    K.rect(-1.47, -1.47, 1.47, 1.47, C('#9fd27a'));
    // Straße längs a mit Bordstein, Rasen mit Beeten zu beiden Seiten
    K.rect(-1.5, -0.42, 1.5, 0.42, C('#b8ad98'));
    kPave(K, () => kRectPath(K, -1.5, -0.36, 1.5, 0.36), PATH_LOOK.kopf, 0, 0, 3);
    for (const sb of [-1, 1]) {
      for (const sa of [-1, 1]) parts.push([sa * 1.0, sb * 1.05, () => kBed(K, sa * 1.0, sb * 1.05, 0.26, (sa + 3) * 2 + sb)]);
      for (const sa of [-1, 1]) parts.push([sa * 1.15, sb * 0.6, () => lamp(K, sa * 1.15, sb * 0.56)]);
    }
    parts.push([0, 0, () => {
      const F = (b, h) => K.P(ha, b, h), S = (a, h) => K.P(a, hb, h);                           // Vorderseite (a = +ha), Seite (b = +hb)
      K.block({ a: 0, b: 0, ha: ha + 0.05, hb: hb + 0.05, h: 5, wall: STD, type: 'flat', roof: '#e6dcc4' });   // Sockelband
      K.block({ a: 0, b: 0, ha, hb, h: H - 5, lift: 5, wall: ST, type: 'flat', roof: '#f6f0e2' });
      // Öffnungen: großer Bogen in der Mitte, zwei kleine
      const arch = (b0, b1, hs, col, colIn) => {
        const bm = (b0 + b1) / 2, rb = (b1 - b0) / 2, rh = rb * 35.8, pts = [F(b0, 5)];
        for (let i = 0; i <= 16; i++) { const ang = Math.PI - i * Math.PI / 16; pts.push(F(bm + Math.cos(ang) * rb, hs + Math.sin(ang) * rh)); }
        pts.push(F(b1, 5)); poly(pts, C(col));
        const q0 = F(b0 + rb * 0.25, 5), q1 = F(b1 - rb * 0.25, 5); poly([q0, q1, [q1[0] - 7 * z, q1[1] - 3.5 * z], [q0[0] - 7 * z, q0[1] - 3.5 * z]], lit() ? '#3a4a6a' : C('#a9cf8a'));   // Durchblick: Licht am anderen Ende
        // Schlussstein und Bogenkante
        g.strokeStyle = C('#cdbf9f'); g.lineWidth = 1.4 * z; g.beginPath(); pts.slice(1, -1).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
        const ks = F(bm, hs + rh); poly([[ks[0] - 2.4 * z, ks[1] + 1 * z], [ks[0] + 2.4 * z, ks[1] + 2 * z], [ks[0] + 1.8 * z, ks[1] - 4 * z], [ks[0] - 1.8 * z, ks[1] - 5 * z]], C(GOLD));
      };
      arch(-0.3, 0.3, 30, '#5f5646', '#7d7362');
      arch(-0.84, -0.56, 16, '#5f5646', '#7d7362'); arch(0.56, 0.84, 16, '#5f5646', '#7d7362');
      // Säulen vor der Wand mit Kapitell und Fuß
      for (const b of [-0.94, -0.42, 0.42, 0.94]) {
        const p0 = K.P(ha + 0.04, b, 5), p1 = K.P(ha + 0.04, b, 56);
        poly([[p0[0] - 2.6 * z, p0[1] + 1.3 * z], [p0[0] + 2.6 * z, p0[1] - 1.3 * z], [p1[0] + 2.6 * z, p1[1] - 1.3 * z], [p1[0] - 2.6 * z, p1[1] + 1.3 * z]], C('#f7f2e6'));
        L(C(STD), 0.5, z, [[p0[0] + 1 * z, p0[1] - 0.5 * z], [p1[0] + 1 * z, p1[1] - 0.5 * z]]);
        poly([[p1[0] - 3.6 * z, p1[1] + 1.8 * z], [p1[0] + 3.6 * z, p1[1] - 1.8 * z], [p1[0] + 3.6 * z, p1[1] - 4.6 * z], [p1[0] - 3.6 * z, p1[1] - 1 * z]], C(GOLD_D));
        poly([[p0[0] - 3.4 * z, p0[1] + 1.7 * z], [p0[0] + 3.4 * z, p0[1] - 1.7 * z], [p0[0] + 3.4 * z, p0[1] - 4.2 * z], [p0[0] - 3.4 * z, p0[1] - 0.9 * z]], C(STD));
      }
      // Medaillons über den kleinen Bögen
      for (const b of [-0.7, 0.7]) { const c = F(b, 44); ellipse(c[0], c[1], 5 * z, 5.4 * z, C(STD)); ellipse(c[0], c[1], 3.8 * z, 4.2 * z, C(GOLD)); star(c[0], c[1], 2.4 * z, C(GOLD_D)); }
      // Gesims und Attika mit Inschrift
      poly([F(-hb - 0.04, 58), F(hb + 0.04, 58), F(hb + 0.04, 62), F(-hb - 0.04, 62)], C(STD));
      poly([F(-0.62, 64), F(0.62, 64), F(0.62, 74), F(-0.62, 74)], C(GOLD));
      for (let r = 0; r < 2; r++) L(C(GOLD_D), 0.6, z, [F(-0.52, 66.5 + r * 3.5), F(0.52, 66.5 + r * 3.5)]);
      // Seite: kleiner Querbogen
      { const bm = 0, pts = [S(-0.16, 5)]; for (let i = 0; i <= 12; i++) { const ang = Math.PI - i * Math.PI / 12; pts.push(S(bm + Math.cos(ang) * 0.16, 18 + Math.sin(ang) * 0.16 * 35.8)); } pts.push(S(0.16, 5)); poly(pts, C('#4f4638')); }
      poly([S(-ha - 0.04, 58), S(ha + 0.04, 58), S(ha + 0.04, 62), S(-ha - 0.04, 62)], C(shade(STD, LIGHT.side)));
      K.block({ a: 0, b: 0, ha: ha * 0.92, hb: hb * 0.92, h: 4, lift: H, wall: STD, type: 'flat', roof: '#e6dcc4' });
      // Viergespann: vier Pferde, Wagen, Lenker mit Kranz – golden
      const top = K.P(0, 0, H + 4);
      for (const [dx, k] of [[-14, 0], [-7, 1], [0, 2], [7, 3]]) {
        const x = top[0] + dx * z, y = top[1] + 4 * z - k * 0.6 * z, gc = k % 2 ? GOLD_D : GOLD;
        for (const lx of [-3.4, -1.6, 2, 3.6]) L(C(GOLD_D), 1, z, [[x + lx * z, y - 6 * z], [x + lx * z - (lx < 0 ? 1.4 : 0) * z, y]]);   // Beine (vorn steigend)
        ellipse(x, y - 7.5 * z, 5.2 * z, 3 * z, C(gc));
        poly([[x - 3.4 * z, y - 9 * z], [x - 5.6 * z, y - 12.5 * z], [x - 3.4 * z, y - 13.6 * z], [x - 1.2 * z, y - 10 * z]], C(gc));   // kurzer, kräftiger Hals
        poly([[x - 5.6 * z, y - 12.5 * z], [x - 9 * z, y - 11 * z], [x - 8.6 * z, y - 9.6 * z], [x - 4.6 * z, y - 10.6 * z]], C(gc));   // Kopf nach vorn
        L(C(GOLD_D), 0.6, z, [[x - 4.4 * z, y - 13.4 * z], [x - 4 * z, y - 15 * z]]);                                  // Ohr
        L(C('#b98b3a'), 0.9, z, [[x - 3.2 * z, y - 13.4 * z], [x - 1 * z, y - 10.4 * z]]); L(C('#b98b3a'), 0.9, z, [[x + 5 * z, y - 8 * z], [x + 7 * z, y - 4 * z]]);   // Mähne, Schweif
      }
      const ch = [top[0] + 13 * z, top[1] + 1 * z];
      poly([[ch[0] - 5 * z, ch[1] - 2 * z], [ch[0] + 5 * z, ch[1] - 2 * z], [ch[0] + 4 * z, ch[1] - 9 * z], [ch[0] - 4 * z, ch[1] - 9 * z]], C(GOLD_D));
      circle(ch[0] - 4 * z, ch[1] - 1 * z, 3 * z, C(GOLD)); circle(ch[0] - 4 * z, ch[1] - 1 * z, 1 * z, C(GOLD_D));
      ellipse(ch[0], ch[1] - 13 * z, 3 * z, 5 * z, C(GOLD)); circle(ch[0], ch[1] - 20 * z, 2.4 * z, C(GOLD));
      L(C(GOLD), 1.1, z, [[ch[0] + 1 * z, ch[1] - 15 * z], [ch[0] + 4 * z, ch[1] - 25 * z]]); g.strokeStyle = C('#6fae5a'); g.lineWidth = 1 * z; g.beginPath(); g.arc(ch[0] + 4.4 * z, ch[1] - 27 * z, 2.6 * z, 0, Math.PI * 2); g.stroke();   // Lorbeerkranz
      // Fahnen an den Ecken
      for (const b of [-0.92, 0.92]) { const f = K.P(0, b, H + 4); L(C('#6b4f3a'), 0.8, z, [f, [f[0], f[1] - 22 * z]]); const w = Math.sin(now / 280 + b * 3) * 1.6 * z; poly([[f[0], f[1] - 22 * z], [f[0] + 10 * z, f[1] - 19 * z + w], [f[0], f[1] - 15 * z]], C(b < 0 ? '#e8546f' : '#5b8fd8')); }
      if (lit()) { glowP(F(0, 20), 40 * z); glowP(F(0, 69), 26 * z); glowP(top, 30 * z); for (const b of [-0.94, 0.94]) glowP(K.P(ha + 0.3, b, 2), 22 * z); }
    }]);
    K.scene(parts);
  }

  // ---------- 4 · Deine Statue (3×3): deine Spielfigur in Gold auf hohem Sockel, Namensschild, Brunnenbecken rund herum ----------
  function deineStatue(K, now = 0) {
    const z = K.z, parts = [];
    plaza(K, PATH_LOOK.platten, parts);
    K.oval(0, 0, 0.95, C('#d9c69a')); K.oval(0, 0, 0.88, C('#efe4c8'));
    for (const [a, b] of [[-1.15, 0.3], [-1.15, -0.3], [0.3, -1.15], [-0.3, -1.15]]) parts.push([a, b, () => lamp(K, a, b)]);
    for (const [a, b] of [[-0.95, 0.5], [0.5, -0.95]]) parts.push([a, b, () => K.block({ a, b, ha: 0.12, hb: 0.05, h: 3, wall: '#8a5a3c', type: 'flat', roof: '#b07a52' })]);
    parts.push([0, 0, () => {
      // rundes Wasserbecken mit Rand
      const c = K.P(0, 0);
      cyl(c[0], c[1], 44 * z, 22 * z, 4 * z, '#d6c8a8'); ellipse(c[0], c[1] - 4 * z, 40 * z, 20 * z, lit() ? '#4f8fc8' : C('#8fd0ee'));
      for (const [dx, dy] of [[-18, 4], [16, -6], [4, 10], [-8, -10]]) ellipse(c[0] + dx * z, c[1] - 4 * z + dy * z, 4 * z, 1.2 * z, 'rgba(255,255,255,0.6)');
      // Sockel: rund, zwei Stufen, Goldband, Namensschild
      cyl(c[0], c[1] - 4 * z, 18 * z, 9 * z, 6 * z, '#8f8577');
      cyl(c[0], c[1] - 10 * z, 14 * z, 7 * z, 26 * z, '#e9dfc8');
      cyl(c[0], c[1] - 34 * z, 15 * z, 7.5 * z, 3 * z, GOLD_D);
      const pl = [c[0] - 4 * z, c[1] - 22 * z]; poly([[pl[0] - 7 * z, pl[1] + 2 * z], [pl[0] + 7 * z, pl[1] + 3.6 * z], [pl[0] + 7 * z, pl[1] - 4 * z], [pl[0] - 7 * z, pl[1] - 5.6 * z]], C(GOLD));
      g.fillStyle = C(GOLD_D); g.font = `800 ${3.2 * z}px system-ui`; g.fillText((typeof meLook === 'function' && meLook().name) || 'Bürgermeister·in', pl[0] - 6 * z, pl[1] + 0.4 * z, 12 * z);
      // Wasserspeier
      for (const s of [-1, 1]) { g.strokeStyle = lit() ? 'rgba(200,230,255,0.9)' : 'rgba(255,255,255,0.9)'; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(c[0] + s * 13 * z, c[1] - 16 * z); g.quadraticCurveTo(c[0] + s * 26 * z, c[1] - 20 * z, c[0] + s * 30 * z, c[1] - 5 * z); g.stroke(); }
      // Figur: deine echte Spielfigur, groß gezeichnet und vergoldet
      const off = document.createElement('canvas'), S = 150; off.width = S * 2; off.height = S * 2; const ox = off.getContext('2d');
      const prev = g; g = ox;
      try {
        const f = (typeof meFigLook === 'function') ? meFigLook() : null;
        if (f) drawFigure({ ...f, label: null, name: '', full: true, seat: true, sx: S, sy: S * 1.85, wait: 1, sit: false, speed: 0, px: 0, py: 0 }, 9, now);
      } catch (e) { /* ohne Figur */ } finally { g = prev; }
      // Vergolden: Farbe weitgehend durch Gold ersetzen, Licht von links, Schatten rechts
      ox.globalCompositeOperation = 'source-atop'; ox.fillStyle = 'rgba(214,160,48,0.78)'; ox.fillRect(0, 0, S * 2, S * 2);
      const gr = ox.createLinearGradient(S * 0.6, 0, S * 1.4, 0); gr.addColorStop(0, 'rgba(255,236,160,0.55)'); gr.addColorStop(0.5, 'rgba(255,236,160,0)'); gr.addColorStop(1, 'rgba(110,60,10,0.4)'); ox.fillStyle = gr; ox.fillRect(0, 0, S * 2, S * 2);
      ox.globalCompositeOperation = 'source-over';
      // Ausmessen: sichtbare Pixel → auf 64 Einheiten Höhe, Füße genau auf den Sockel
      const px = ox.getImageData(0, 0, S * 2, S * 2).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let yy = 0; yy < S * 2; yy++) for (let xx = 0; xx < S * 2; xx++) if (px[(yy * S * 2 + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      const foot = [c[0], c[1] - 37 * z];
      if (x1 > 0) { const hgt = 64 * z, k = hgt / (y1 - y0 + 1), w = (x1 - x0 + 1) * k; ellipse(foot[0], foot[1], w * 0.42, w * 0.16, 'rgba(90,60,20,0.25)'); g.drawImage(off, x0, y0, x1 - x0 + 1, y1 - y0 + 1, foot[0] - w / 2, foot[1] - hgt, w, hgt); }
      if (lit()) { glowP([foot[0], foot[1] - 30 * z], 46 * z); for (const s of [-1, 1]) glowP([c[0] + s * 30 * z, c[1] - 2 * z], 22 * z, 'blue'); }
    }]);
    K.scene(parts);
  }

  // ---------- 5 · Mondtor (3×3): runde Pforte in weißer Mauer mit Ziegeldach, Teich mit Brücke dahinter, Bambus, Laternen ----------
  function mondtor(K, now = 0) {
    const z = K.z, parts = [];
    K.rect(-1.47, -1.47, 1.47, 1.47, C('#9fd27a'));
    kPave(K, () => kRectPath(K, -1.5, -0.24, 1.5, 0.24), PATH_LOOK.platten, 0, 0, 3);                   // Weg längs a durch das Tor
    K.oval(-0.85, -0.85, 0.5, C('#7fb7c8')); K.oval(-0.85, -0.85, 0.44, lit() ? '#3a6a98' : C('#8fd0ee'));   // Teich hinten
    for (const [a, b, col] of [[-1.0, -0.7, '#ff9e5a'], [-0.7, -1.0, '#ffffff']]) { const p = K.P(a, b); ellipse(p[0], p[1], 2.6 * z, 1.2 * z, C(col)); }   // Koi
    for (const [a, b] of [[-0.62, -1.05], [-1.05, -0.6]]) { const p = K.P(a, b); ellipse(p[0], p[1], 3.6 * z, 1.6 * z, C('#5fae5a')); circle(p[0] + 1 * z, p[1] - 1 * z, 1.2 * z, C('#ffb3c8')); }   // Seerosen
    const bamboo = (a, b) => parts.push([a, b, () => { const p = K.P(a, b); for (let i = 0; i < 5; i++) { const x = p[0] + (i - 2) * 2.6 * z, h = (26 + (i * 7) % 12) * z; L(C(i % 2 ? '#5f9e3c' : '#7cbf4f'), 1.1, z, [[x, p[1]], [x + (i - 2) * 0.6 * z, p[1] - h]]); for (let j = 1; j < 4; j++) { const yy = p[1] - h * j / 4; L(C('#4f8a30'), 0.5, z, [[x - 0.8 * z, yy], [x + 0.8 * z, yy]]); ellipse(x + 3 * z, yy - 1 * z, 3 * z, 1 * z, C('#6fb84a')); } } }]);
    bamboo(-1.15, 0.85); bamboo(0.85, -1.15);
    for (const [sa, sb] of [[1, 1]]) parts.push([sa * 1.1, sb * 1.1, () => kBed(K, sa * 1.1, sb * 1.1, 0.26, 4)]);
    // Steinlaternen am Weg, spiegelgleich
    const stoneLantern = (a, b) => parts.push([a, b, () => { const p = K.P(a, b), x = p[0], y = p[1]; box(x, y, 3 * z, 1.5 * z, 2 * z, '#a8a396', null, 0); poly([[x - 1.2 * z, y - 2 * z], [x + 1.2 * z, y - 2 * z], [x + 1 * z, y - 9 * z], [x - 1 * z, y - 9 * z]], C('#b8b3a6')); box(x, y - 9 * z, 3.4 * z, 1.7 * z, 4.4 * z, '#c9c3b4', null, 0); poly([[x - 1.6 * z, y - 10 * z], [x + 1.6 * z, y - 10 * z], [x + 1.6 * z, y - 12.6 * z], [x - 1.6 * z, y - 12.6 * z]], lit() ? '#ffe08a' : C('#6b6458')); poly([[x - 5 * z, y - 13.4 * z], [x + 5 * z, y - 13.4 * z], [x, y - 18 * z]], C('#8f8a7e')); if (lit()) glowP([x, y - 11 * z], 18 * z); }]);
    for (const a of [-1.1, 0.75]) for (const sb of [-1, 1]) stoneLantern(a, sb * 0.42);
    // Mauer längs b durch die Mitte, rundes Tor über dem Weg
    parts.push([0, 0, () => {
      const T = 0.07, hb = 1.18, H = 40, W = '#f7f2e8';
      K.block({ a: 0, b: 0, ha: T, hb, h: H, wall: W, type: 'flat', roof: '#e6dfd0' });
      const F = (b, h) => K.P(T, b, h);
      const ring = []; for (let i = 0; i <= 32; i++) { const ang = i / 32 * Math.PI * 2; ring.push(F(Math.cos(ang) * 0.42, 20 + Math.sin(ang) * 0.42 * 35.8 * 0.95)); }
      poly(ring, lit() ? '#24305a' : C('#a9dc84'));                                                            // Blick hindurch: Garten
      const far = ring.map(([x, y]) => [x - 6 * z, y - 3 * z]); poly(far, lit() ? '#2c3a66' : C('#b4e392'));
      g.strokeStyle = C('#c9b88f'); g.lineWidth = 2.6 * z; g.beginPath(); ring.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      g.strokeStyle = C(GOLD_D); g.lineWidth = 0.8 * z; g.beginPath(); ring.forEach(([x, y], i) => i ? g.lineTo(x, y - 0) : g.moveTo(x, y)); g.stroke();
      // Gitterfenster links und rechts
      for (const bb of [-0.95, 0.95]) { const c = F(bb, 24), r = 5 * z; poly([[c[0] - r, c[1] + r * 0.5], [c[0] + r, c[1] - r * 0.5], [c[0] + r, c[1] - r * 1.5], [c[0] - r, c[1] - r * 0.5]], lit() ? '#ffd98a' : C('#c9b88f')); for (let j = -1; j <= 1; j++) L(C('#8a6a4a'), 0.5, z, [[c[0] + j * r * 0.6, c[1] + 0.5 * r - j * r * 0.3], [c[0] + j * r * 0.6, c[1] - 1.5 * r - j * r * 0.3 + r]]); if (lit()) glowP([c[0], c[1] - r * 0.5], 14 * z); }
      // Ziegeldach mit geschwungenen Enden
      for (let i = 0; i < 18; i++) { const b0 = -hb - 0.08 + i * (2 * hb + 0.16) / 18, b1 = b0 + (2 * hb + 0.16) / 18; poly([K.P(-T - 0.16, b0, H), K.P(-T - 0.16, b1, H), K.P(0, b1, H + 7), K.P(0, b0, H + 7)], C(i % 2 ? '#56647a' : '#62718a')); }
      for (let i = 0; i < 18; i++) { const b0 = -hb - 0.08 + i * (2 * hb + 0.16) / 18, b1 = b0 + (2 * hb + 0.16) / 18; poly([K.P(T + 0.16, b0, H), K.P(T + 0.16, b1, H), K.P(0, b1, H + 7), K.P(0, b0, H + 7)], C(i % 2 ? '#3d4a5c' : '#4a586c')); }
      L(C('#2f3a4a'), 1.6, z, [K.P(0, -hb - 0.1, H + 7), K.P(0, hb + 0.1, H + 7)]);
      for (const s of [-1, 1]) { const e = K.P(0, s * (hb + 0.1), H + 7); g.strokeStyle = C('#2f3a4a'); g.lineWidth = 1.6 * z; g.beginPath(); g.moveTo(...e); g.quadraticCurveTo(e[0] + s * 4 * z, e[1] - 1 * z, e[0] + s * 6 * z, e[1] - 6 * z); g.stroke(); }
      // Mondsichel und Mondhase oben auf dem First
      const m = K.P(0, 0, H + 18);
      g.fillStyle = lit() ? '#fff1a8' : C(GOLD); g.beginPath(); g.arc(m[0], m[1], 7 * z, 0.3 * Math.PI, 1.7 * Math.PI); g.arc(m[0] + 3.2 * z, m[1] - 0.7 * z, 5.6 * z, 1.6 * Math.PI, 0.4 * Math.PI, true); g.fill();
      ellipse(m[0] - 2 * z, m[1] + 1 * z, 2.2 * z, 2 * z, '#ffffff'); ellipse(m[0] - 2.6 * z, m[1] - 2.4 * z, 0.7 * z, 2 * z, '#ffffff'); ellipse(m[0] - 1.2 * z, m[1] - 2.4 * z, 0.7 * z, 2 * z, '#ffffff');
      // Lampions an der Mauer
      for (const bb of [-0.62, 0.62]) { const p = F(bb, H - 3); L(C('#5a4636'), 0.5, z, [p, [p[0], p[1] + 4 * z]]); ellipse(p[0], p[1] + 8 * z, 3 * z, 3.8 * z, lit() ? '#ffb8a8' : C('#e8546f')); poly([[p[0] - 1.6 * z, p[1] + 4 * z], [p[0] + 1.6 * z, p[1] + 4 * z], [p[0] + 1.6 * z, p[1] + 5 * z], [p[0] - 1.6 * z, p[1] + 5 * z]], C(GOLD_D)); if (lit()) glowP([p[0], p[1] + 8 * z], 18 * z); }
      if (lit()) glowP(m, 34 * z);
    }]);
    K.scene(parts);
  }
  let HUET = { c: ['#6fae9a', '#4f8a78', '#9fd3c0'], hair: '#5c9a86' };
  // Statuen-Gesicht: glatt, nur Licht und Schatten (Stirn, Nase, Wange) – keine gemalten Augen
  function smoothFace(head, r, z, col, colD, colL) {
    circle(head[0], head[1], r, C(col));
    g.globalAlpha = 0.4; g.fillStyle = C(colD); g.beginPath(); g.ellipse(head[0] + r * 0.32, head[1] + r * 0.08, r * 0.66, r * 0.92, 0, -Math.PI / 2, Math.PI / 2); g.fill(); g.globalAlpha = 1;
    ellipse(head[0] - r * 0.36, head[1] - r * 0.18, r * 0.3, r * 0.4, C(colL));
    poly([[head[0] - r * 0.02, head[1] - r * 0.15], [head[0] + r * 0.16, head[1] + r * 0.32], [head[0] - r * 0.04, head[1] + r * 0.36]], C(colD));   // Nase
    g.strokeStyle = C(colD); g.lineWidth = 0.7 * z; g.beginPath(); g.arc(head[0] - r * 0.3, head[1] - r * 0.02, r * 0.2, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();   // Augenbogen
    g.beginPath(); g.arc(head[0] + r * 0.25, head[1] - r * 0.02, r * 0.18, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();
  }
  function hueterin(K, now = 0) {
    const z = K.z, [BR, BR_D, BR_L] = HUET.c;
    // Felseninsel: Schichten aus Fels, Kairing mit Stufen
    K.oval(0, 0, 0.95, C('#7d7568')); K.oval(-0.04, -0.04, 0.86, C('#9a9284')); K.oval(-0.08, -0.08, 0.7, C('#b3ab9c'));
    for (const [a, b, r] of [[0.7, 0.3, 0.16], [0.35, 0.72, 0.13], [-0.75, 0.2, 0.12], [0.6, -0.55, 0.12]]) { K.oval(a, b, r, C('#8a8274')); K.oval(a - 0.03, b - 0.03, r * 0.7, C('#a39b8c')); }
    const parts = [];
    parts.push([0, 0, () => {
      // Turm-Sockel: rund, Fenster, Goldband, Leuchtring
      const base = K.P(0, 0, 4);
      cyl(base[0], base[1], 34 * z, 17 * z, 10 * z, '#cfc6b2');
      cyl(base[0], base[1] - 10 * z, 27 * z, 13.5 * z, 44 * z, '#ede4cf');
      for (let i = 0; i < 4; i++) { const t = -0.7 + i * 0.45, wx = base[0] + Math.sin(t) * 22 * z, wy = base[1] - 30 * z + Math.cos(t) * 4 * z; poly([[wx - 2.4 * z, wy], [wx + 2.4 * z, wy], [wx + 2.4 * z, wy - 9 * z], [wx, wy - 11.5 * z], [wx - 2.4 * z, wy - 9 * z]], lit() ? '#ffd27a' : C('#5d8fb8')); if (lit()) glowP([wx, wy - 5 * z], 10 * z); }
      poly([[base[0] - 3.6 * z, base[1] - 10 * z + 13 * z], [base[0] + 3.6 * z, base[1] - 10 * z + 13 * z], [base[0] + 3.6 * z, base[1] - 10 * z + 1 * z], [base[0], base[1] - 10 * z - 3 * z], [base[0] - 3.6 * z, base[1] - 10 * z + 1 * z]], C('#8a5a3c'));   // Tür
      cyl(base[0], base[1] - 54 * z, 30 * z, 15 * z, 4 * z, GOLD_D);
      for (let i = 0; i < 14; i++) { const ang = i / 14 * Math.PI * 2; if (Math.sin(ang) < -0.2) continue; const lx = base[0] + Math.cos(ang) * 29 * z, ly = base[1] - 57 * z + Math.sin(ang) * 14.5 * z; circle(lx, ly, 1.3 * z, lit() ? '#fff1a8' : C('#fff3c4')); if (lit() && i % 2) glowP([lx, ly], 9 * z); }
      // Figur im Gewand
      const ft = [base[0], base[1] - 58 * z];
      robe(ft[0], ft[1], 22 * z, 13 * z, 58 * z, z, BR, BR_D, BR_L, 5 * z);                               // Gewand, weht nach rechts
      g.fillStyle = C(BR_D); g.beginPath(); g.moveTo(ft[0] + 12 * z, ft[1] - 54 * z); g.bezierCurveTo(ft[0] + 22 * z, ft[1] - 32 * z, ft[0] + 22 * z, ft[1] - 12 * z, ft[0] + 24 * z, ft[1] - 3 * z); g.lineTo(ft[0] + 16 * z, ft[1] - 5 * z); g.bezierCurveTo(ft[0] + 18 * z, ft[1] - 24 * z, ft[0] + 14 * z, ft[1] - 40 * z, ft[0] + 9 * z, ft[1] - 50 * z); g.fill();   // Tuch weht rechts (Schattenseite)
      poly([[ft[0] - 11 * z, ft[1] - 36 * z], [ft[0] + 11 * z, ft[1] - 36 * z], [ft[0] + 11 * z, ft[1] - 32.5 * z], [ft[0] - 11 * z, ft[1] - 32.5 * z]], C(GOLD));   // Gürtel
      const sh = [ft[0], ft[1] - 58 * z], shL = [sh[0] - 12 * z, sh[1] + 3 * z], shR = [sh[0] + 12 * z, sh[1] + 3 * z];
      // linker Arm hält eine Tafel mit Stern
      const elL = [shL[0] - 4 * z, shL[1] + 16 * z]; limb2(shL, elL, 5 * z, 4.2 * z, BR_L, BR); limb2(elL, [elL[0] + 4 * z, elL[1] + 4 * z], 4.2 * z, 3.4 * z, BR_L, BR);   // linker Arm hält die Tafel
      poly([[elL[0] - 9 * z, elL[1] - 6 * z], [elL[0] + 3 * z, elL[1] - 9 * z], [elL[0] + 5 * z, elL[1] + 8 * z], [elL[0] - 7 * z, elL[1] + 11 * z]], C(BR_D));
      poly([[elL[0] - 8 * z, elL[1] - 5.4 * z], [elL[0] + 2.6 * z, elL[1] - 8 * z], [elL[0] + 4.2 * z, elL[1] + 7 * z], [elL[0] - 6.4 * z, elL[1] + 9.6 * z]], C(BR));
      star(elL[0] - 1.8 * z, elL[1] + 0.8 * z, 3.4 * z, C(GOLD));
      // rechter Arm hebt die Laterne
      const elR = [shR[0] + 7 * z, shR[1] - 16 * z], hand = [shR[0] + 6 * z, shR[1] - 36 * z];
      limb2(shR, elR, 5.4 * z, 4.6 * z, BR, BR_D); limb2(elR, hand, 4.6 * z, 3.8 * z, BR, BR_D);
      ellipse(hand[0], hand[1] + 1 * z, 3.6 * z, 4 * z, C(BR)); ellipse(hand[0] - 1 * z, hand[1], 1.6 * z, 2.2 * z, C(BR_L));   // Faust um den Griff
      lantern([hand[0], hand[1] - 1 * z], z * 1.1, now);
      poly([[sh[0] - 4 * z, sh[1] + 1 * z], [sh[0] + 4 * z, sh[1] + 1 * z], [sh[0] + 3.4 * z, sh[1] - 6 * z], [sh[0] - 3.4 * z, sh[1] - 6 * z]], C(BR_D));
      const head = [sh[0], sh[1] - 15 * z];
      rays(head, 10 * z, 20 * z, z, 7);
      g.fillStyle = C(HUET.hair); g.beginPath(); g.ellipse(head[0] + 1.5 * z, head[1] + 4 * z, 11 * z, 12.5 * z, 0, 0, Math.PI * 2); g.fill();   // Haar, lang
      smoothFace(head, 10 * z, z, BR, BR_D, BR_L);
      g.fillStyle = C(HUET.hair); g.beginPath(); g.arc(head[0], head[1] - 1 * z, 10.4 * z, Math.PI * 1.05, Math.PI * 1.95); g.fill();
      poly([[head[0] - 10.5 * z, head[1] - 4.5 * z], [head[0] + 10.5 * z, head[1] - 4.5 * z], [head[0] + 9.5 * z, head[1] - 8.5 * z], [head[0] - 9.5 * z, head[1] - 8.5 * z]], C(GOLD_D));
    }]);
    K.scene(parts);
  }
  // ======================= Endfassung (21.10.2026): nur das Bauwerk mit festem Sockel, 2×2, keine Deko =======================
  // Kreis in der Ebene einer Wand: P(b, h) bildet Wand-Koordinaten (längs, Höhe) auf den Bildschirm ab; 1 Feld längs = 35,8 Einheiten
  const faceCircle = (P, cb, ch, r, n = 28) => { const pts = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push(P(cb + Math.cos(t) * r, ch + Math.sin(t) * r * 35.8)); } return pts; };
  const faceRect = (P, b0, b1, h0, h1) => [P(b0, h0), P(b1, h0), P(b1, h1), P(b0, h1)];
  const faceArch = (P, b0, b1, hs) => { const bm = (b0 + b1) / 2, rb = (b1 - b0) / 2, pts = [P(b0, 0.01)]; for (let i = 0; i <= 18; i++) { const t = Math.PI - i * Math.PI / 18; pts.push(P(bm + Math.cos(t) * rb, hs + Math.sin(t) * rb * 35.8)); } pts.push(P(b1, 0.01)); return pts; };

  // 1 · Obelisk: drei Stufen, Granitsockel, Schaft, zwei Löwen auf der unteren Stufe
  function obeliskF(K) {
    const parts = [];
    parts.push([0, 0, () => { plinth(K, 0, 0, 0.84, 0.84, 3, 0, '#cfc3a5'); plinth(K, 0, 0, 0.72, 0.72, 3, 3, '#e2d8c0'); plinth(K, 0, 0, 0.36, 0.36, 12, 6, '#8f8577', GOLD); obeliskCore(K); }]);
    K.scene(parts);
  }

  // 2 · Triumphbogen: drei Bögen zwischen vier Säulen, Gesims rundum, Attika mit Inschrift, goldene Siegesfigur mit Flügeln
  function triumphF(K, now = 0) {
    const z = K.z, ST = '#efe7d6', STD = '#d9cdb4', ha = 0.3, hb = 0.9, H = 58;
    const F = (b, h) => K.P(ha + 0.001, b, h), Fo = (b, h) => K.P(ha + 0.035, b, h), S = (a, h) => K.P(a, hb + 0.001, h);
    const dark = lit() ? '#2c3554' : '#5f5646';
    const cols = [-0.82, -0.42, 0.42, 0.82], openings = [[-0.26, 0.26, 26], [-0.74, -0.5, 16], [0.5, 0.74, 16]];
    // Echte Durchgänge: Innenwand (Sonnenseite) zuerst, dann die Vorderwand mit Löchern – der Boden im Durchgang ist der Untergrund des Spielers
    for (const [b0, b1, hs] of openings) poly([K.P(ha, b0, 0), K.P(-ha, b0, 0), K.P(-ha, b0, hs + 4), K.P(ha, b0, hs + 4)], C(shade(ST, -0.06)));
    const holes = openings.map(([b0, b1, hs]) => faceArch(F, b0, b1, hs + 4));
    g.fillStyle = K.wallCol(ST, [1, 0]); g.beginPath();
    [F(-hb, 0), F(hb, 0), F(hb, H), F(-hb, H)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath();
    for (const h of holes) { h.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); }
    g.fill('evenodd');
    poly([S(ha, 0), S(-ha, 0), S(-ha, H), S(ha, H)], K.wallCol(ST, [0, 1]));                                  // Seite
    poly(faceArch((a, h) => K.P(a, hb + 0.001, h), -0.14, 0.14, 18), C(dark));                            // Seite: Nische
    poly([K.P(ha, -hb, H), K.P(ha, hb, H), K.P(-ha, hb, H), K.P(-ha, -hb, H)], C('#f6f0e2'));               // Dach
    for (const [b0, b1] of [[-0.9, -0.74], [-0.5, -0.26], [0.26, 0.5], [0.74, 0.9]]) poly([K.P(ha + 0.04, b0, 0), K.P(ha + 0.04, b1, 0), K.P(ha + 0.04, b1, 4), K.P(ha + 0.04, b0, 4)], C(STD));   // Sockel nur unter den Pfeilern
    for (const [b0, b1, hs] of openings) {
      const ring = faceArch((b, h) => K.P(ha + 0.002, b, h), b0, b1, hs + 4).slice(1, -1);
      g.strokeStyle = C('#cdbf9f'); g.lineWidth = 1.3 * z; g.beginPath(); ring.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      const top = (b0 + b1) / 2, ks = (b1 - b0) / 2 * 35.8; poly(faceRect((b, h) => K.P(ha + 0.003, b, h), top - 0.03, top + 0.03, hs + 4 + ks - 1, hs + 4 + ks + 4), C(GOLD));   // Schlussstein
    }
    // Säulen (vor der Wand), Fuß und Kapitell in der Wandebene
    for (const b of cols) {
      poly(faceRect(Fo, b - 0.035, b + 0.035, 4, 44), C('#f8f3e8'));
      poly(faceRect(Fo, b + 0.01, b + 0.035, 4, 44), C('#e2d8c4'));
      poly(faceRect(Fo, b - 0.05, b + 0.05, 4, 6.5), C(STD)); poly(faceRect(Fo, b - 0.06, b + 0.06, 0, 4), C(STD));
      poly(faceRect(Fo, b - 0.055, b + 0.055, 44, 47.5), C(GOLD_D));
    }
    // Medaillons über den kleinen Bögen (Kreis in der Wandebene)
    for (const b of [-0.62, 0.62]) { poly(faceCircle(F, b, 37, 0.075), C(STD)); poly(faceCircle(F, b, 37, 0.058), C(GOLD)); const c = F(b, 37); star(c[0], c[1], 1.7 * z, C(GOLD_D)); }
    // Gesims rundum, Attika mit Inschrift
    K.block({ a: 0, b: 0, ha: ha + 0.03, hb: hb + 0.03, h: 4, lift: 48, wall: STD, type: 'flat', roof: '#e9e0cb' });
    K.block({ a: 0, b: 0, ha: ha - 0.02, hb: hb - 0.02, h: 13, lift: H - 6, wall: ST, type: 'flat', roof: '#f6f0e2' });
    K.block({ a: 0, b: 0, ha: ha + 0.01, hb: hb + 0.01, h: 2.5, lift: H + 7, wall: STD, type: 'flat', roof: '#e9e0cb' });
    poly(faceRect((b, h) => K.P(ha - 0.019, b, h), -0.5, 0.5, H - 4, H + 5), C(GOLD));
    for (let r = 0; r < 2; r++) L(C(GOLD_D), 0.6, z, [K.P(ha - 0.018, -0.42, H - 1 + r * 3), K.P(ha - 0.018, 0.42, H - 1 + r * 3)]);
    // Siegesfigur: Gewand, Flügel, Kranz hoch – steht mitten auf dem Dach
    const base = K.P(0, 0, H + 9.5);
    box(base[0], base[1], 6 * z, 3 * z, 4 * z, GOLD_D, null, 0);
    const ft = [base[0], base[1] - 4 * z];
    for (const s of [-1, 1]) { g.fillStyle = C(s < 0 ? GOLD : GOLD_D); g.beginPath(); g.moveTo(ft[0] + s * 2 * z, ft[1] - 22 * z); g.quadraticCurveTo(ft[0] + s * 16 * z, ft[1] - 34 * z, ft[0] + s * 13 * z, ft[1] - 14 * z); g.quadraticCurveTo(ft[0] + s * 8 * z, ft[1] - 18 * z, ft[0] + s * 2 * z, ft[1] - 14 * z); g.fill();
      for (let i = 1; i < 4; i++) L(C(s < 0 ? GOLD_D : '#a87a2a'), 0.5, z, [[ft[0] + s * 3.5 * z, ft[1] - (16 + i) * z], [ft[0] + s * (5 + i * 2) * z, ft[1] - (17 + i * 3) * z]]); }
    robe(ft[0], ft[1], 5.5 * z, 3.4 * z, 20 * z, z, GOLD, GOLD_D, GOLD_L, -1 * z);
    const sh = [ft[0], ft[1] - 20 * z];
    limb2([sh[0] + 3 * z, sh[1] + 1 * z], [sh[0] + 6 * z, sh[1] - 9 * z], 1.4 * z, 1.1 * z, GOLD, GOLD_D);
    circle(sh[0] + 6 * z, sh[1] - 9.6 * z, 1.3 * z, C(GOLD)); g.strokeStyle = C('#6fae5a'); g.lineWidth = 1.2 * z; g.beginPath(); g.arc(sh[0] + 6 * z, sh[1] - 11.6 * z, 2.6 * z, 0, Math.PI * 2); g.stroke();   // Kranz liegt in der Hand
    circle(sh[0], sh[1] - 3.4 * z, 3 * z, C(GOLD)); ellipse(sh[0] + 1 * z, sh[1] - 3.2 * z, 1.6 * z, 2.6 * z, C(GOLD_D));
    // Fahnen spiegelgleich an den vorderen Dachecken
    for (const b of [-(hb - 0.06), hb - 0.06]) { const f = K.P(ha - 0.03, b, H + 9.5); L(C('#6b4f3a'), 0.8, z, [f, [f[0], f[1] - 20 * z]]); const w = Math.sin(now / 280 + b * 3) * 1.4 * z; poly([[f[0], f[1] - 20 * z], [f[0] + 9 * z, f[1] - 17 * z + w], [f[0], f[1] - 14 * z]], C('#e8546f')); }
    if (lit()) { glowP(F(0, 16), 24 * z); glowP(F(0, H + 1), 26 * z); glowP([ft[0], ft[1] - 16 * z], 34 * z); }
  }

  // 3 · Deine Statue: hoher Sockel mit Stufen und lesbarem Schild, darauf deine Spielfigur in Gold
  function statueF(K, now = 0) {
    const z = K.z;
    plinth(K, 0, 0, 0.62, 0.62, 3, 0, '#cfc3a5'); plinth(K, 0, 0, 0.5, 0.5, 3, 3, '#e2d8c0');
    plinth(K, 0, 0, 0.32, 0.32, 30, 6, '#ece3cd', GOLD_D);
    K.block({ a: 0, b: 0, ha: 0.36, hb: 0.36, h: 3, lift: 36, wall: '#d9cdb4', type: 'flat', roof: '#e9e0cb' });
    const P = (b, h) => K.P(-0.32 + 0.001, b, h);                                                            // nicht sichtbar – Schild vorn links:
    const Q = (t, h) => K.P(-0.24 + 0.48 * t, 0.321, h);                                                       // Seite b = +0.32 (links vorn)
    poly([Q(0, 14), Q(1, 14), Q(1, 25), Q(0, 25)], C(GOLD)); poly([Q(0.04, 15), Q(0.96, 15), Q(0.96, 24), Q(0.04, 24)], C('#f8dc80'));
    const name = ((typeof meLook === 'function' && meLook().name) || 'Unsere Insel').slice(0, 14), c = Q(0.5, 19.5);
    g.save(); g.translate(c[0], c[1]); g.transform(1, 0.5, 0, 1, 0, 0); g.fillStyle = C('#6b4f1a'); g.textAlign = 'left'; g.font = `800 ${3.6 * z}px system-ui`; const tw = Math.min(g.measureText(name).width, 12.5 * z); g.fillText(name, -tw / 2, 1.3 * z, 12.5 * z); g.restore();
    // Figur vergolden und auf den Sockel stellen (ausgemessen)
    const off = document.createElement('canvas'), S2 = 150; off.width = S2 * 2; off.height = S2 * 2; const ox = off.getContext('2d');
    const prev = g; g = ox;
    try { const f = (typeof meFigLook === 'function') ? meFigLook() : null; if (f) drawFigure({ ...f, label: null, name: '', full: true, seat: true, sx: S2, sy: S2 * 1.85, wait: 1, sit: false, speed: 0, px: 0, py: 0 }, 9, now); } catch (e) { /* ohne Figur */ } finally { g = prev; }
    ox.globalCompositeOperation = 'source-atop'; ox.fillStyle = 'rgba(214,160,48,0.8)'; ox.fillRect(0, 0, S2 * 2, S2 * 2);
    const gr = ox.createLinearGradient(S2 * 0.6, 0, S2 * 1.4, 0); gr.addColorStop(0, 'rgba(255,236,160,0.55)'); gr.addColorStop(0.5, 'rgba(255,236,160,0)'); gr.addColorStop(1, 'rgba(110,60,10,0.4)'); ox.fillStyle = gr; ox.fillRect(0, 0, S2 * 2, S2 * 2);
    const px = ox.getImageData(0, 0, S2 * 2, S2 * 2).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let yy = 0; yy < S2 * 2; yy++) for (let xx = 0; xx < S2 * 2; xx++) if (px[(yy * S2 * 2 + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    const foot = K.P(0, 0, 39);
    if (x1 > 0) { const hgt = 60 * z, k = hgt / (y1 - y0 + 1), w = (x1 - x0 + 1) * k; ellipse(foot[0], foot[1], w * 0.4, w * 0.14, 'rgba(90,60,20,0.25)'); g.drawImage(off, x0, y0, x1 - x0 + 1, y1 - y0 + 1, foot[0] - w / 2, foot[1] - hgt, w, hgt); }
    if (lit()) { glowP([foot[0], foot[1] - 30 * z], 46 * z); glowP(c, 18 * z); }
  }

  // 4 · Mondtor: weiße Mauer (längs b) mit runder Pforte, Gitterfenstern, Ziegeldach, Mondsichel mit Mondhase auf dem First
  function mondtorF(K, now = 0) {
    const z = K.z, T = 0.07, hb = 0.92, H = 40;
    K.block({ a: 0, b: 0, ha: T + 0.03, hb: hb + 0.03, h: 3, wall: '#d9d1bf', type: 'flat', roof: '#e6dfd0' });
    K.block({ a: 0, b: 0, ha: T, hb, h: H - 3, lift: 3, wall: '#f7f2e8', type: 'flat', roof: '#e6dfd0' });
    const F = (b, h) => K.P(T + 0.001, b, h);
    const ring = faceCircle(F, 0, 21, 0.4, 36);
    poly(ring, C('#d9cfb8'));                                                                                  // Laibung (Wandstärke)
    poly(ring.map(([x, y]) => [x - 5 * z, y - 2.5 * z]), lit() ? '#2c3a66' : C('#8fc46a'));                    // Blick hindurch
    g.strokeStyle = C('#c9b88f'); g.lineWidth = 2.6 * z; g.beginPath(); ring.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke();
    // Gitterfenster (in der Wandebene), spiegelgleich
    for (const bb of [-0.62, 0.62]) {
      poly(faceRect(F, bb - 0.12, bb + 0.12, 18, 30), C('#c9b88f'));
      poly(faceRect(F, bb - 0.1, bb + 0.1, 19, 29), lit() ? '#ffd98a' : C('#8a6a4a'));
      for (const t of [-0.05, 0, 0.05]) L(C('#c9b88f'), 0.5, z, [F(bb + t, 19), F(bb + t, 29)]);
      for (const hh of [21.5, 24, 26.5]) L(C('#c9b88f'), 0.5, z, [F(bb - 0.1, hh), F(bb + 0.1, hh)]);
      if (lit()) glowP(F(bb, 24), 14 * z);
    }
    // Ziegeldach: hintere Seite zuerst, dann vordere, First, geschwungene Enden
    const tiles = (side, colA, colB) => { for (let i = 0; i < 16; i++) { const b0 = -hb - 0.1 + i * (2 * hb + 0.2) / 16, b1 = b0 + (2 * hb + 0.2) / 16; poly([K.P(side * (T + 0.16), b0, H), K.P(side * (T + 0.16), b1, H), K.P(0, b1, H + 7), K.P(0, b0, H + 7)], C(i % 2 ? colA : colB)); } };
    tiles(-1, '#56647a', '#62718a'); tiles(1, '#3d4a5c', '#4a586c');
    L(C('#2f3a4a'), 1.8, z, [K.P(0, -hb - 0.12, H + 7), K.P(0, hb + 0.12, H + 7)]);
    for (const s of [-1, 1]) { const e = K.P(0, s * (hb + 0.12), H + 7), dx = s * 5 * z; g.strokeStyle = C('#2f3a4a'); g.lineWidth = 1.8 * z; g.beginPath(); g.moveTo(...e); g.quadraticCurveTo(e[0] - dx * 0.6, e[1] - 1 * z, e[0] - dx, e[1] - 6 * z); g.stroke(); }
    // Mondsichel steht auf dem First, der Mondhase sitzt darin
    const m = K.P(0, 0, H + 7 + 7.5);
    g.fillStyle = lit() ? '#fff1a8' : C(GOLD); g.beginPath(); g.arc(m[0], m[1], 7.5 * z, 0.3 * Math.PI, 1.7 * Math.PI); g.arc(m[0] + 3.4 * z, m[1] - 0.8 * z, 6 * z, 1.6 * Math.PI, 0.4 * Math.PI, true); g.fill();
    L(C(GOLD_D), 1.2, z, [[m[0] - 1 * z, m[1] + 7.2 * z], [m[0] - 1 * z, m[1] + 8.6 * z]]);                     // Stiel in den First
    ellipse(m[0] - 2.6 * z, m[1] + 2 * z, 2.4 * z, 2.2 * z, '#ffffff'); circle(m[0] - 2.4 * z, m[1] - 0.8 * z, 1.6 * z, '#ffffff');
    ellipse(m[0] - 3.2 * z, m[1] - 3.6 * z, 0.6 * z, 1.8 * z, '#ffffff'); ellipse(m[0] - 1.8 * z, m[1] - 3.6 * z, 0.6 * z, 1.8 * z, '#ffffff'); circle(m[0] - 1.8 * z, m[1] - 0.9 * z, 0.3 * z, '#3a2a2a');
    // Lampions unter der Traufe (hängen an der Dachkante, spiegelgleich)
    for (const bb of [-0.88, 0.88]) { const p = K.P(T + 0.02, bb, H - 1); L(C('#5a4636'), 0.5, z, [p, [p[0], p[1] + 4 * z]]); ellipse(p[0], p[1] + 7.6 * z, 2.8 * z, 3.6 * z, lit() ? '#ffb8a8' : C('#e8546f')); poly([[p[0] - 1.5 * z, p[1] + 3.8 * z], [p[0] + 1.5 * z, p[1] + 3.8 * z], [p[0] + 1.5 * z, p[1] + 4.8 * z], [p[0] - 1.5 * z, p[1] + 4.8 * z]], C(GOLD_D)); if (lit()) glowP([p[0], p[1] + 7.6 * z], 16 * z); }
    if (lit()) glowP(m, 34 * z);
  }

  // 5 · Sternendenkmal: runder Marmorsockel in drei Stufen mit goldenen Sternen, Kristallsäule, großer Stern mit Kante
  function sternF(K, now = 0) {
    const z = K.z, c = K.P(0, 0);
    cyl(c[0], c[1], 44 * z, 22 * z, 4 * z, '#d9d2e8'); cyl(c[0], c[1] - 4 * z, 35 * z, 17.5 * z, 4 * z, '#e6e0f2'); cyl(c[0], c[1] - 8 * z, 25 * z, 12.5 * z, 5 * z, '#f0ecf8');
    // Kristallsäule: sechs Seiten, die vorderen drei sichtbar
    const b0 = c[1] - 13 * z, t0 = c[1] - 68 * z, r0 = 9 * z, r1 = 7 * z, cols = lit() ? ['#d6efff', '#a9d8ff', '#7fb8ee'] : ['#c4e6fb', '#9fd0f2', '#78b2e0'];
    for (let i = 0; i < 3; i++) { const a0 = Math.PI * (i / 3), a1 = Math.PI * ((i + 1) / 3);
      poly([[c[0] - Math.cos(a0) * r0, b0 + Math.sin(a0) * r0 * 0.5], [c[0] - Math.cos(a1) * r0, b0 + Math.sin(a1) * r0 * 0.5], [c[0] - Math.cos(a1) * r1, t0 + Math.sin(a1) * r1 * 0.5], [c[0] - Math.cos(a0) * r1, t0 + Math.sin(a0) * r1 * 0.5]], cols[i]); }
    L('rgba(255,255,255,0.7)', 0.8, z, [[c[0] - r0 * 0.6, b0 - 4 * z], [c[0] - r1 * 0.6, t0 + 6 * z]]);
    poly(Array.from({ length: 6 }, (_, i) => [c[0] - Math.cos(Math.PI * i / 3) * r1, t0 + Math.sin(Math.PI * i / 3) * r1 * 0.5]), lit() ? '#eaf6ff' : '#dff1fd');   // Deckel sechseckig
    // Stern mit Kante (Dicke nach rechts hinten) auf der Säule
    const sc = [c[0], t0 - 20 * z], R = 17 * z;
    poly([[c[0] - 4 * z, t0 + 1 * z], [c[0] + 4 * z, t0 + 1 * z], [c[0] + 1.6 * z, t0 - 9 * z], [c[0] - 1.6 * z, t0 - 9 * z]], C(GOLD_D));   // Halter: der Stern sitzt auf der Säule
    ellipse(c[0], t0 + 1 * z, 4 * z, 2 * z, C(GOLD));
    star(sc[0], sc[1] + 2.6 * z, R, lit() ? '#e0a830' : C(GOLD_D));                                          // Dicke nach unten, mittig
    star(sc[0], sc[1], R, lit() ? '#fff1a8' : C(GOLD));
    star(sc[0], sc[1], R * 0.5, lit() ? '#ffffff' : C(GOLD_L));
    if (lit()) { glowP(sc, 80 * z); glowP([c[0], (b0 + t0) / 2], 30 * z, 'blue'); }
  }

  // 6 · Steinkreis: acht Steine im Ring, je zwei mit Deckstein, Altarstein in der Mitte, nachts leuchtende Zeichen
  function steinkreisF(K, now = 0) {
    const z = K.z, R = 0.8, parts = [];
    // Halbkreis hinten, vorn offen (Blickrichtung a = b): jeder Stein hat seinen eigenen Platz im Bild; zwei Tore mit Deckstein
    const ST = [[135, 28], [180, 32], [205, 38], [245, 38], [270, 32], [315, 28]].map(([d, h]) => { const r = d * Math.PI / 180; return { a: Math.cos(r) * R, b: Math.sin(r) * R, h }; });
    const stone = s => () => {
      K.block({ a: s.a, b: s.b, ha: 0.075, hb: 0.075, h: s.h, wall: '#b3ad9f', type: 'flat', roof: '#c9c3b4' });
      for (const hh of [9, 21]) L(C('#9d978a'), 0.45, z, [K.P(s.a + 0.08, s.b - 0.06, hh), K.P(s.a + 0.08, s.b + 0.04, hh + 1.4)]);
      const rp = K.P(s.a + 0.081, s.b, 15); if (lit()) { poly([[rp[0] - 1.6 * z, rp[1] + 1 * z], [rp[0], rp[1] - 3 * z], [rp[0] + 1.6 * z, rp[1] + 1 * z]], '#9fe7ff'); glowP(rp, 9 * z, 'blue'); } else L(C('#8a8478'), 0.55, z, [[rp[0] - 1.6 * z, rp[1] + 1 * z], [rp[0], rp[1] - 3 * z], [rp[0] + 1.6 * z, rp[1] + 1 * z]]);
    };
    ST.forEach(s => parts.push([s.a, s.b, stone(s)]));
    for (const [i, j] of [[2, 3]]) { const p = ST[i], q = ST[j], h = Math.min(p.h, q.h), dp = K.depth(p.a, p.b) > K.depth(q.a, q.b) ? p : q;
      parts.push([dp.a + 0.001, dp.b + 0.001, () => { const ex = 0.07, pa = [p.a + (p.a - q.a) * ex, p.b + (p.b - q.b) * ex], qa = [q.a + (q.a - p.a) * ex, q.b + (q.b - p.b) * ex];
        poly([K.P(...pa, h), K.P(...qa, h), K.P(...qa, h + 7), K.P(...pa, h + 7)], C('#a8a396')); poly([K.P(...pa, h + 7), K.P(...qa, h + 7), K.P(qa[0] * 0.88, qa[1] * 0.88, h + 7), K.P(pa[0] * 0.88, pa[1] * 0.88, h + 7)], C('#c9c3b4')); }]); }
    parts.push([0, 0, () => { K.block({ a: 0, b: 0, ha: 0.18, hb: 0.18, h: 5, wall: '#a8a396', type: 'flat', roof: '#bdb7a9' }); if (lit()) glowP(K.P(0, 0, 6), 14 * z, 'blue'); }]);
    K.scene(parts);
  }

  // 7 · Prachtbrunnen: achteckiges Becken, Säule mit zwei Schalen, goldene Figur, Wasserbögen
  function brunnenF(K, now = 0) {
    const z = K.z, n = 8, R = 0.86, Hb = 6;
    const pt = (i, r = R, h = 0) => { const ang = (i + 0.5) / n * Math.PI * 2; return K.P(Math.cos(ang) * r, Math.sin(ang) * r, h); };
    // Beckenwand: vordere Seiten mit Licht von links
    const walls = []; for (let i = 0; i < n; i++) walls.push(i);
    const facing = i => { const ang = (i + 1) / n * Math.PI * 2 - Math.PI / n; return K.depth(Math.cos(ang), Math.sin(ang)); };
    for (const i of walls.filter(i => facing(i) <= 0)) poly([pt(i), pt(i + 1), pt(i + 1, R, Hb), pt(i, R, Hb)], C('#cfc3a5'));
    poly(Array.from({ length: n }, (_, i) => pt(i, R, Hb)), C('#efe7d6'));                                   // Beckenrand oben
    poly(Array.from({ length: n }, (_, i) => pt(i, R * 0.9, Hb)), lit() ? '#3f7fc0' : C('#8fd0ee'));
    for (const [a, b] of [[-0.45, 0.15], [0.15, -0.45], [0.35, 0.35]]) { const p = K.P(a, b, Hb); ellipse(p[0], p[1], 4 * z, 1.2 * z, 'rgba(255,255,255,0.55)'); }
    // Säule mit Schalen und Figur
    const c = K.P(0, 0, Hb);
    cyl(c[0], c[1], 6 * z, 3 * z, 28 * z, '#e6dcc4');
    for (const [hh, r] of [[14, 14], [28, 9]]) { ellipse(c[0], c[1] - hh * z + 1 * z, r * z, r * 0.42 * z, C('#cfc3a5')); ellipse(c[0], c[1] - hh * z, r * z, r * 0.42 * z, C('#efe7d6')); ellipse(c[0], c[1] - hh * z - 0.4 * z, r * 0.8 * z, r * 0.32 * z, lit() ? '#5f9fd8' : C('#a6dcf2')); }
    const ft = [c[0], c[1] - 30 * z]; robe(ft[0], ft[1], 5.4 * z, 3.4 * z, 18 * z, z, GOLD, GOLD_D, GOLD_L); circle(ft[0], ft[1] - 21 * z, 3 * z, C(GOLD)); ellipse(ft[0] + 1 * z, ft[1] - 21 * z, 1.6 * z, 2.6 * z, C(GOLD_D));
    limb2([ft[0] + 3 * z, ft[1] - 17 * z], [ft[0] + 7 * z, ft[1] - 20 * z], 1.4 * z, 1.2 * z, GOLD, GOLD_D); poly([[ft[0] + 6 * z, ft[1] - 23 * z], [ft[0] + 10 * z, ft[1] - 22 * z], [ft[0] + 10.6 * z, ft[1] - 18 * z], [ft[0] + 6.6 * z, ft[1] - 17.6 * z]], C(GOLD_D));   // Arm und Krug
    // Wasser: aus dem Krug in die obere Schale, Bögen aus der oberen in die untere, aus der unteren ins Becken
    const wcol = lit() ? 'rgba(210,235,255,0.9)' : 'rgba(255,255,255,0.92)'; g.strokeStyle = wcol; g.lineCap = 'round';
    g.lineWidth = 1 * z; g.beginPath(); g.moveTo(ft[0] + 10.6 * z, ft[1] - 19 * z); g.quadraticCurveTo(ft[0] + 13 * z, ft[1] - 16 * z, ft[0] + 8 * z, c[1] - 28 * z); g.stroke();
    for (let i = 0; i < 8; i++) { const ang = (i + 0.5) / 8 * Math.PI * 2, ex = c[0] + Math.cos(ang) * 13 * z, ey = c[1] - 14 * z + Math.sin(ang) * 5.4 * z; g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(c[0] + Math.cos(ang) * 9 * z, c[1] - 28 * z + Math.sin(ang) * 3.8 * z); g.quadraticCurveTo(c[0] + Math.cos(ang) * 12 * z, c[1] - 26 * z, ex, ey); g.stroke(); }
    for (let i = 0; i < 12; i++) { const ang = (i + 0.5) / 12 * Math.PI * 2, sx = c[0] + Math.cos(ang) * 14 * z, sy = c[1] - 14 * z + Math.sin(ang) * 5.9 * z, ex = c[0] + Math.cos(ang) * 28 * z, ey = c[1] + Math.sin(ang) * 12 * z; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + ex) / 2, sy - 6 * z, ex, ey); g.stroke(); ellipse(ex, ey, 2 * z, 0.7 * z, wcol); }
    // vordere Beckenwand zuletzt (vor dem Wasser), oben mit Kante
    for (const i of walls.filter(i => facing(i) > 0)) { poly([pt(i), pt(i + 1), pt(i + 1, R, Hb), pt(i, R, Hb)], C(facing(i) > 0.9 ? '#e6dcc4' : '#d6caac')); }
    for (let i = 0; i < n; i++) L(C('#efe7d6'), 1.4, z, [pt(i, R, Hb), pt(i + 1, R, Hb)]);
    if (lit()) { glowP(K.P(0, 0, Hb), 40 * z, 'blue'); glowP([ft[0], ft[1] - 10 * z], 20 * z); }
  }

  // 5 · Pagode: Steinsockel, fünf Stockwerke mit geschwungenen Dächern, Glöckchen an den Ecken, goldene Spitze
  function pagodeF(K, now = 0, opt = {}) {
    const z = K.z, RED = '#c9443a', ROOF = '#2f5e5a', ROOF_D = '#244a47', TRIM = GOLD;
    plinth(K, 0, 0, 0.82, 0.82, 3, 0, '#bdb4a2'); plinth(K, 0, 0, 0.7, 0.7, 3, 3, '#d6cdb9');
    const tiers = [[0.5, 15], [0.43, 12], [0.37, 11], [0.31, 10], [0.25, 9]];
    let y = 6;
    tiers.forEach(([ha, h], i) => {
      K.block({ a: 0, b: 0, ha, hb: ha, h, lift: y, wall: i % 2 ? '#d9534a' : RED, type: 'flat', roof: '#8a3a30' });
      // Säulen und Fenster in der Wandebene, spiegelgleich auf beiden Seiten
      for (const n of [0, 1]) {
        const P = (t, hh) => n ? K.P(ha + 0.001, t, y + hh) : K.P(t, ha + 0.001, y + hh);
        for (const t of [-ha * 0.92, ha * 0.92]) poly([P(t - 0.025, 0), P(t + 0.025, 0), P(t + 0.025, h), P(t - 0.025, h)], C('#7a2a24'));
        poly([P(-ha * 0.42, h * 0.25), P(ha * 0.42, h * 0.25), P(ha * 0.42, h * 0.8), P(-ha * 0.42, h * 0.8)], lit() ? '#ffd27a' : C('#3a2a28'));
        for (const t of [-ha * 0.14, ha * 0.14]) L(C('#c9963a'), 0.5, z, [P(t, h * 0.25), P(t, h * 0.8)]);
        if (lit()) glowP(P(0, h * 0.5), 14 * z);
      }
      y += h;
      // geschwungenes Dach: Traufe weit draußen, Ecken hochgebogen, oben am nächsten Stockwerk
      const e = ha + (opt.over ?? 0.2), top = i < 4 ? tiers[i + 1][0] : 0.06, rh = opt.rh ?? 9, curve = opt.curve ?? 7;
      const edge = (n, t) => { const a = Math.abs(t), up = opt.flick ? curve * Math.pow(Math.max(0, (a - 0.7) / 0.3), 2) : curve * Math.pow(a, 3); return n ? K.P(e, t * e, y + up) : K.P(t * e, e, y + up); };
      for (const n of [0, 1]) {
        const pts = []; for (let k = 0; k <= 12; k++) pts.push(edge(n, -1 + k / 6));
        const t1 = n ? K.P(top, top, y + rh) : K.P(top, top, y + rh), t0 = n ? K.P(top, -top, y + rh) : K.P(-top, top, y + rh);
        poly([...pts, t1, t0], C(n ? ROOF_D : ROOF));
        for (let k = 1; k < 6; k++) { const a0 = edge(n, -1 + k / 3), tt = n ? K.P(top, -top + 2 * top * k / 6, y + rh) : K.P(-top + 2 * top * k / 6, top, y + rh); L(C(n ? '#1d3b38' : '#264f4b'), 0.5, z, [a0, tt]); }   // Ziegelreihen
        g.strokeStyle = C(TRIM); g.lineWidth = 1.1 * z; g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
      }
      for (const [ca, cb] of [[e, -e], [e, e], [-e, e]]) { const t = [Math.sign(ca) * top, Math.sign(cb) * top]; L(C('#1a3330'), 1.1, z, [K.P(ca, cb, y + curve), K.P(t[0], t[1], y + rh)]); }   // Grate auf den Dachecken
      for (const c of [K.P(e, -e, y + curve), K.P(e, e, y + curve), K.P(-e, e, y + curve)]) { L(C(GOLD_D), 0.5, z, [c, [c[0], c[1] + 3 * z]]); circle(c[0], c[1] + 3.6 * z, 1.1 * z, C(GOLD)); }   // Glöckchen
      y += rh;
    });
    // Spitze: Ringe und goldene Perle
    const sp = K.P(0, 0, y);
    L(C(GOLD_D), 1.6, z, [sp, [sp[0], sp[1] - 26 * z]]);
    for (let k = 0; k < 6; k++) ellipse(sp[0], sp[1] - (4 + k * 3.4) * z, (3.4 - k * 0.35) * z, (1.4 - k * 0.12) * z, C(k % 2 ? GOLD_D : GOLD));
    circle(sp[0], sp[1] - 28 * z, 2.6 * z, lit() ? '#fff1a8' : C(GOLD)); circle(sp[0] - 0.8 * z, sp[1] - 28.8 * z, 0.9 * z, C(GOLD_L));
    if (lit()) glowP([sp[0], sp[1] - 28 * z], 22 * z);
  }

  // 7 · Steinkreis (neu): Grashügel, raue Menhire mit Moos und Spiralen, Decksteinring hinten, Kristall auf dem Altar
  function menhir(K, a, b, w, h, seed) {
    const z = K.z, j = k => (Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1, jj = k => Math.abs(j(k));
    const L0 = K.P(a - w, b + w, 0), B0 = K.P(a + w, b + w, 0), R0 = K.P(a + w, b - w, 0);
    const tl = K.P(a - w * 0.8, b + w * 0.8, h * (0.88 + jj(1) * 0.08)), tb = K.P(a + w * 0.85, b + w * 0.85, h), tr = K.P(a + w * 0.75, b - w * 0.8, h * (0.86 + jj(2) * 0.1)), tk = K.P(a - w * 0.6, b - w * 0.6, h * 0.95);
    const mid = (p, q, dy) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - dy * z];
    poly([L0, B0, tb, mid(tl, tb, 2 + jj(3) * 3), tl], C('#bdb6a6'));                                      // Sonnenseite
    poly([B0, R0, tr, mid(tb, tr, 1 + jj(4) * 3), tb], C('#958e80'));                                      // Schattenseite
    poly([tl, mid(tl, tb, 2 + jj(3) * 3), tb, mid(tb, tr, 1 + jj(4) * 3), tr, tk], C('#cfc8b8'));          // Kopf
    for (let k = 0; k < 3; k++) { const p = K.P(a - w * 0.3 + k * w * 0.3, b + w, 2 + jj(5 + k) * 6); ellipse(p[0], p[1], (2.4 + jj(8 + k) * 1.6) * z, 1.2 * z, C(k % 2 ? '#7fae5a' : '#6a9a4a')); }   // Moos am Fuß
    const c = K.P(a, b + w, h * 0.5), r = Math.min(w * 30, 5) * z;                                          // Spirale auf der Sonnenseite
    g.strokeStyle = lit() ? '#9fe7ff' : C('#8a8478'); g.lineWidth = (lit() ? 0.9 : 0.6) * z; g.beginPath();
    for (let k = 0; k <= 40; k++) { const t = k / 40 * Math.PI * 5, rr = r * k / 40; const px = c[0] + Math.cos(t) * rr * 0.7, py = c[1] + Math.sin(t) * rr * 0.9 + Math.cos(t) * rr * 0.25; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    if (lit()) glowP(c, 12 * z, 'blue');
  }
  function steinkreisF2(K, now = 0) {
    const z = K.z, c = K.P(0, 0), parts = [], M = 6;
    cyl(c[0], c[1] + 1 * z, 44 * z, 22 * z, M * z, '#8a6a4a'); ellipse(c[0], c[1] + 1 * z - M * z, 44 * z, 22 * z, C('#8fc46a')); ellipse(c[0] - 5 * z, c[1] - 1 * z - M * z, 30 * z, 13 * z, C('#a0d27a'));   // Hügel, passt in 2×2
    for (let k = 0; k < 14; k++) { const ang = k / 14 * Math.PI * 2; const p = K.P(Math.cos(ang) * 0.36, Math.sin(ang) * 0.36, M); ellipse(p[0], p[1], 3 * z, 1.3 * z, C(k % 2 ? '#c9c3b4' : '#b8b1a2')); }   // Steinplatten-Ring
    // fünf Menhire im hinteren Halbkreis (Winkel von hinten: 0, ±35°, ±70° – jeder mit eigenem Platz im Bild), vorn offen
    const R = 0.66, ST = [-70, -35, 0, 35, 70].map((d, i) => { const t = (225 + d) * Math.PI / 180; return { a: Math.cos(t) * R, b: Math.sin(t) * R, h: i === 2 ? 40 : Math.abs(d) > 50 ? 30 : 35, k: i }; });
    ST.forEach(st => parts.push([st.a, st.b, () => { g.save(); g.translate(0, -M * z); menhir(K, st.a, st.b, 0.08, st.h, st.k + 3); g.restore(); }]));
    for (let k = 0; k < 4; k++) { const p = ST[k], q = ST[k + 1], h = Math.min(p.h, q.h) * 0.92 + M, d = K.depth(p.a, p.b) > K.depth(q.a, q.b) ? p : q;
      parts.push([d.a + 0.002, d.b + 0.002, () => { poly([K.P(p.a, p.b, h - 2), K.P(q.a, q.b, h - 2), K.P(q.a, q.b, h + 5), K.P(p.a, p.b, h + 5)], C('#a39c8e')); poly([K.P(p.a, p.b, h + 5), K.P(q.a, q.b, h + 5), K.P(q.a * 0.86, q.b * 0.86, h + 5), K.P(p.a * 0.86, p.b * 0.86, h + 5)], C('#c9c3b4')); }]); }
    // zwei umgestürzte Steine vorn links und rechts (liegen flach, spiegelgleich)
    for (const s of [-1, 1]) { const t = (45 + s * 62) * Math.PI / 180, a = Math.cos(t) * 0.6, b = Math.sin(t) * 0.6; parts.push([a, b, () => K.block({ a, b, ha: s < 0 ? 0.07 : 0.16, hb: s < 0 ? 0.16 : 0.07, h: 6, lift: M, wall: '#b3ad9f', type: 'flat', roof: '#c9c3b4' })]); }
    parts.push([0, 0, () => {
      K.block({ a: 0, b: 0, ha: 0.15, hb: 0.15, h: 6, lift: M, wall: '#a8a396', type: 'flat', roof: '#bdb7a9' });   // Altar
      const t = K.P(0, 0, M + 6), cols = lit() ? ['#e6fbff', '#a9e8ff', '#6fc8f0'] : ['#d6f2fb', '#a6dcf2', '#7cbfe2'];
      for (const [dx, hh, w] of [[-4, 12, 2.6], [4, 12, 2.6], [0, 18, 3.4]]) { const x = t[0] + dx * z, y = t[1]; poly([[x - w * z, y], [x, y + 1 * z], [x, y - hh * z], [x - w * 0.5 * z, y - hh * 0.85 * z]], cols[0]); poly([[x, y + 1 * z], [x + w * z, y], [x + w * 0.5 * z, y - hh * 0.85 * z], [x, y - hh * z]], cols[2]); }
      if (lit()) { glowP([t[0], t[1] - 10 * z], 36 * z, 'blue'); g.fillStyle = 'rgba(160,220,255,0.18)'; g.beginPath(); g.moveTo(t[0] - 5 * z, t[1] - 10 * z); g.lineTo(t[0] + 5 * z, t[1] - 10 * z); g.lineTo(t[0] + 13 * z, t[1] - 110 * z); g.lineTo(t[0] - 13 * z, t[1] - 110 * z); g.fill(); }
    }]);
    K.scene(parts);
  }

  // 8 · Prachtbrunnen (neu): Stufen, rundes Becken mit Muschelrand, vier goldene Delfine, Muschelschalen, Meereskönigin mit Dreizack
  function brunnenF2(K, now = 0) {
    const z = K.z, c = K.P(0, 0);
    cyl(c[0], c[1], 44 * z, 22 * z, 3 * z, '#cfc3a5'); cyl(c[0], c[1] - 3 * z, 40 * z, 20 * z, 3 * z, '#e2d8c0');
    cyl(c[0], c[1] - 6 * z, 36 * z, 18 * z, 7 * z, '#efe7d6');
    for (let k = 0; k < 18; k++) { const ang = Math.PI * (k / 17); const x = c[0] - Math.cos(ang) * 36 * z, y = c[1] - 6 * z + Math.sin(ang) * 18 * z; g.fillStyle = C(k % 2 ? '#e2d8c0' : '#d6caac'); g.beginPath(); g.arc(x, y - 3.5 * z, 2.3 * z, Math.PI, 0); g.fill(); }   // Muschelrand vorn
    const wy = c[1] - 13 * z;
    ellipse(c[0], wy, 33 * z, 16.5 * z, lit() ? '#2f9fb0' : C('#7fd0e2'));
    if (lit()) glowP([c[0], wy], 60 * z, 'blue');
    for (const [dx, dy] of [[-16, 3], [16, 3], [0, 10], [-9, -7], [9, -7]]) ellipse(c[0] + dx * z, wy + dy * z, 4 * z, 1.2 * z, 'rgba(255,255,255,0.55)');
    const wcol = lit() ? 'rgba(200,245,255,0.95)' : 'rgba(255,255,255,0.95)'; g.lineCap = 'round';
    // Delfine auf dem Rand (diagonal), speien zur Mitte
    const dolphins = [[-1, 1], [1, -1]].map(([sa, sb]) => ({ p: K.P(sa * 0.5, sb * 0.5, 13), sa, sb }));   // links und rechts, spiegelgleich
    const drawDolphin = d => { const [x, y] = d.p, dir = Math.sign(c[0] - x) || (d.sb > 0 ? 1 : -1), up = d.sa + d.sb < 0;
      g.fillStyle = C(GOLD); g.beginPath(); g.moveTo(x - dir * 6 * z, y + 2 * z); g.quadraticCurveTo(x - dir * 4 * z, y - 12 * z, x + dir * 3 * z, y - 10 * z); g.quadraticCurveTo(x + dir * 7 * z, y - 9 * z, x + dir * 6 * z, y - 6 * z); g.quadraticCurveTo(x + dir * 1 * z, y - 7 * z, x - dir * 1 * z, y + 2 * z); g.fill();
      g.fillStyle = C(GOLD_D); g.beginPath(); g.moveTo(x - dir * 6 * z, y + 2 * z); g.lineTo(x - dir * 10 * z, y + 4 * z); g.lineTo(x - dir * 8 * z, y - 1 * z); g.fill();   // Schwanzflosse
      poly([[x - dir * 3.4 * z, y - 4 * z], [x - dir * 7 * z, y - 5 * z], [x - dir * 4.4 * z, y - 1 * z]], C(GOLD_D)); poly([[x + dir * 0.5 * z, y - 5 * z], [x + dir * 2.5 * z, y - 2 * z], [x - dir * 0.5 * z, y - 3 * z]], C(GOLD_D)); circle(x + dir * 3.4 * z, y - 9 * z, 0.6 * z, C('#5a3a10'));   // Rückenflosse hinten, Brustflosse
      const sx = x + dir * 6.5 * z, sy = y - 7 * z, ex = c[0] - dir * 4 * z, ey = wy - (up ? 2 : -2) * z;
      g.strokeStyle = wcol; g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo((sx + ex) / 2, sy - 16 * z, ex, ey); g.stroke(); ellipse(ex, ey, 3 * z, 1 * z, wcol); };
    
    // Mittelfels mit Muschelschalen
    const m = [c[0], wy];
    g.fillStyle = C('#b3ab9c'); g.beginPath(); g.moveTo(m[0] - 12 * z, m[1] + 2 * z); g.quadraticCurveTo(m[0] - 9 * z, m[1] - 18 * z, m[0] - 3 * z, m[1] - 22 * z); g.lineTo(m[0] + 4 * z, m[1] - 21 * z); g.quadraticCurveTo(m[0] + 10 * z, m[1] - 14 * z, m[0] + 12 * z, m[1] + 2 * z); g.fill();
    g.fillStyle = C('#958e80'); g.beginPath(); g.moveTo(m[0] + 2 * z, m[1] + 2 * z); g.lineTo(m[0] + 4 * z, m[1] - 21 * z); g.quadraticCurveTo(m[0] + 10 * z, m[1] - 14 * z, m[0] + 12 * z, m[1] + 2 * z); g.fill();
    const shell = (y, r) => { for (let k = 0; k < 9; k++) { const a0 = Math.PI * (1 + k / 9), a1 = Math.PI * (1 + (k + 1) / 9); g.fillStyle = C(k % 2 ? '#f0e4c8' : '#e2d2ae'); g.beginPath(); g.moveTo(m[0], y + r * 0.2); g.lineTo(m[0] + Math.cos(a0) * r, y + Math.sin(a0) * r * 0.55); g.lineTo(m[0] + Math.cos(a1) * r, y + Math.sin(a1) * r * 0.55); g.fill(); } ellipse(m[0], y, r, r * 0.3, lit() ? '#5fd0e0' : C('#a6e2f0')); };
    shell(m[1] - 22 * z, 12 * z);
    for (let k = 0; k < 9; k++) { const ang = Math.PI * (0.1 + k * 0.1); g.strokeStyle = wcol; g.lineWidth = 0.9 * z; g.beginPath(); const sx = m[0] + Math.cos(ang) * 11 * z, sy = m[1] - 22 * z + Math.sin(ang) * 4 * z; g.moveTo(sx, sy); g.quadraticCurveTo(sx + Math.cos(ang) * 4 * z, sy + 4 * z, sx + Math.cos(ang) * 6 * z, m[1] + 1 * z); g.stroke(); }   // Wasservorhang
    // Meereskönigin auf der Muschel
    const ft = [m[0], m[1] - 25 * z];
    ellipse(ft[0], ft[1] + 1 * z, 7 * z, 2.6 * z, C(GOLD_D)); ellipse(ft[0], ft[1], 6 * z, 2.2 * z, C(GOLD));   // goldene Muschel unter den Füßen
    robe(ft[0], ft[1], 6.5 * z, 3.6 * z, 22 * z, z, GOLD, GOLD_D, GOLD_L, 1 * z);
    const sh = [ft[0], ft[1] - 22 * z];
    limb2([sh[0] - 3 * z, sh[1] + 1 * z], [sh[0] - 7 * z, sh[1] - 6 * z], 1.5 * z, 1.2 * z, GOLD, GOLD_D);
    L(C(GOLD_D), 1, z, [[sh[0] - 7.5 * z, ft[1] + 0.5 * z], [sh[0] - 7.5 * z, sh[1] - 20 * z]]);   // Dreizack steht auf der Muschel                     // Dreizack
    for (const dx of [-2.4, 0, 2.4]) L(C(GOLD), 0.9, z, [[sh[0] - 7.5 * z + dx * z, sh[1] - 19 * z], [sh[0] - 7.5 * z + dx * z, sh[1] - 24 * z]]); L(C(GOLD), 0.9, z, [[sh[0] - 10 * z, sh[1] - 19 * z], [sh[0] - 5 * z, sh[1] - 19 * z]]);
    limb2([sh[0] + 3 * z, sh[1] + 1 * z], [sh[0] + 5 * z, sh[1] + 8 * z], 1.5 * z, 1.2 * z, GOLD, GOLD_D);
    circle(sh[0], sh[1] - 4 * z, 3.4 * z, C(GOLD)); g.fillStyle = C(GOLD_D); g.beginPath(); g.ellipse(sh[0] + 1 * z, sh[1] - 2 * z, 3.4 * z, 4.4 * z, 0, -Math.PI / 2, Math.PI / 2); g.fill();
    for (let k = 0; k < 5; k++) poly([[sh[0] - 3 * z + k * 1.5 * z, sh[1] - 6.6 * z], [sh[0] - 2.25 * z + k * 1.5 * z, sh[1] - 9.6 * z], [sh[0] - 1.5 * z + k * 1.5 * z, sh[1] - 6.6 * z]], C(GOLD));   // Krone
    dolphins.forEach(drawDolphin);
    if (lit()) glowP([sh[0], sh[1] - 6 * z], 24 * z);
  }
  window.HUET_V = [['2A · Hüterin – Patina', { c: ['#6fae9a', '#4f8a78', '#9fd3c0'], hair: '#5c9a86' }], ['2B · Hüterin – Gold', { c: ['#e0b04a', '#b8862a', '#ffe08a'], hair: '#c9962a' }], ['2C · Hüterin – Marmor', { c: ['#ece8df', '#c9c2b3', '#ffffff'], hair: '#d6cfc0' }]].map(([l, pal]) => [l, (K, now) => { HUET = pal; hueterin(K, now); }, 2.3, 2, 'wasser']);
  // Sternenleuchte (Nutzer 21.10.2026, statt der Hüterin): Felseninsel, schlanker Turm mit Galerie, oben eine große goldene Laterne mit Sternen
  function sternenleuchteF(K, now = 0) {
    const z = K.z;
    K.oval(0, 0, 0.92, C('#7d7568')); K.oval(-0.04, -0.04, 0.82, C('#9a9284')); K.oval(-0.08, -0.08, 0.66, C('#b3ab9c'));
    for (const [a, b, r] of [[0.62, 0.32, 0.14], [0.3, 0.66, 0.12], [-0.66, 0.24, 0.11], [0.56, -0.52, 0.11]]) { K.oval(a, b, r, C('#8a8274')); K.oval(a - 0.03, b - 0.03, r * 0.7, C('#a39b8c')); }
    // Punkt auf einem Zylindermantel: Mitte (cx, cy) am Fuß, Radius r, Höhe h, Winkel t (0 = vorn, + = rechts)
    const cp = (cx, cy, r, t, h) => [cx + Math.sin(t) * r, cy + Math.cos(t) * r * 0.5 - h];
    const onCyl = (cx, cy, r, t0, t1, h0, h1, arch, fill) => { if (Math.cos((t0 + t1) / 2) < 0.2) return; const pts = [], n = 8;
      for (let i = 0; i <= n; i++) pts.push(cp(cx, cy, r, t0 + (t1 - t0) * i / n, h0));
      for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push(cp(cx, cy, r, t, h1 + (arch ? arch * Math.sin(Math.PI * i / n) : 0))); }
      poly(pts, fill); };
    const base = K.P(0, 0, 4), SR = 30 * z, SH = 9 * z;
    cyl(base[0], base[1], SR, SR / 2, SH, '#cfc6b2');                                                            // Sockel
    for (const [h, off] of [[3, 0], [6, 0.5]]) {                                                                   // Steinfugen folgen der Rundung
      g.strokeStyle = C('#b0a690'); g.lineWidth = 0.6 * z; g.beginPath(); for (let i = 0; i <= 20; i++) { const p = cp(base[0], base[1], SR, -Math.PI / 2 + Math.PI * i / 20, h * z); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
      for (let k = -4; k <= 4; k++) { const t = (k + off) * 0.36; if (Math.abs(t) > 1.45) continue; L(C('#b0a690'), 0.6, z, [cp(base[0], base[1], SR, t, h * z - 3 * z), cp(base[0], base[1], SR, t, h * z)]); }
    }
    const tb = [base[0], base[1] - SH], TR = 20 * z, TH = 70;
    cyl(tb[0], tb[1], TR, TR / 2, TH * z, '#ede4cf');                                                             // Turm
    for (const hh of [24, 48]) { g.fillStyle = C('#d9cdb4'); g.beginPath(); for (let i = 0; i <= 20; i++) { const p = cp(tb[0], tb[1], TR + 0.6 * z, -Math.PI / 2 + Math.PI * i / 20, hh * z); i ? g.lineTo(...p) : g.moveTo(...p); } for (let i = 20; i >= 0; i--) g.lineTo(...cp(tb[0], tb[1], TR + 0.6 * z, -Math.PI / 2 + Math.PI * i / 20, hh * z + 2 * z)); g.closePath(); g.fill(); }   // Gesimsbänder
    const winCol = lit() ? '#ffd27a' : C('#5d8fb8');
    for (const [h0, ts] of [[30, [-0.75, 0, 0.75]], [54, [-0.75, 0, 0.75]]]) for (const t of ts) { onCyl(tb[0], tb[1], TR + 0.2 * z, t - 0.17, t + 0.17, h0 * z, (h0 + 8) * z, 2.6 * z, winCol); if (lit() && Math.cos(t) > 0.2) glowP(cp(tb[0], tb[1], TR, t, (h0 + 5) * z), 9 * z); }   // Bogenfenster auf der Rundung
    onCyl(tb[0], tb[1], TR + 0.3 * z, -0.2, 0.2, 0, 11 * z, 3 * z, C('#8a5a3c'));                                // Tür steht auf dem Turmfuß
    // Galerie: Boden, Geländer hinten, Laterne, Geländer vorn
    const gy = tb[1] - TH * z, GR = 24.5 * z;
    cyl(tb[0], gy + 2 * z, 26 * z, 13 * z, 3 * z, '#d9cdb4');
    const rail = (front) => { const a0 = front ? 0 : Math.PI, posts = 18;
      for (let i = 0; i <= posts; i++) { const a = a0 + Math.PI * i / posts, x = tb[0] - Math.cos(a) * GR, y = gy - 1 * z + Math.sin(a) * GR * 0.5; L(C('#8a6a2a'), 0.7, z, [[x, y], [x, y - 6 * z]]); }
      g.strokeStyle = C(GOLD); g.lineWidth = 1.2 * z; g.beginPath(); g.ellipse(tb[0], gy - 7 * z, GR, GR * 0.5, 0, front ? 0 : Math.PI, front ? Math.PI : 2 * Math.PI); g.stroke(); };
    rail(false);
    const lb = gy - 3 * z, LH = 30 * z, R = 15 * z, faces = [[Math.PI, Math.PI * 4 / 3], [Math.PI * 4 / 3, Math.PI * 5 / 3], [Math.PI * 5 / 3, Math.PI * 2]];
    const hx = (a, y) => [tb[0] + Math.cos(a) * R, y - Math.sin(a) * R * 0.5];
    cyl(tb[0], lb, R * 1.05, R * 0.52, 3 * z, GOLD_D);
    faces.forEach(([a0, a1], i) => {
      const p0 = hx(a0, lb - 3 * z), p1 = hx(a1, lb - 3 * z), q1 = [p1[0], p1[1] - LH], q0 = [p0[0], p0[1] - LH];
      poly([p0, p1, q1, q0], lit() ? ['#fff1b0', '#ffe080', '#f2c25a'][i] : ['#fff3c4', '#ffe7a0', '#f6d27a'][i]);
      // Stern liegt in der Glasfläche: u längs der Fläche, v nach oben
      const M = (u, v) => [p0[0] + (p1[0] - p0[0]) * (0.5 + u / 2), p0[1] + (p1[1] - p0[1]) * (0.5 + u / 2) - LH * (0.5 + v / 2)];
      const st = []; for (let j = 0; j < 10; j++) { const ang = Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? 0.14 : 0.34; st.push(M(Math.cos(ang) * rr, Math.sin(ang) * rr * 0.62)); }
      poly(st, lit() ? '#ffffff' : C(GOLD_D));
      L(C(GOLD_D), 1.4, z, [p0, q0]);
    });
    { const e = hx(Math.PI * 2, lb - 3 * z); L(C(GOLD_D), 1.4, z, [e, [e[0], e[1] - LH]]); }
    rail(true);
    const top = lb - 3 * z - LH;
    cyl(tb[0], top + 1 * z, R * 1.1, R * 0.55, 2.4 * z, GOLD);
    g.fillStyle = C(GOLD); g.beginPath(); g.moveTo(tb[0] - R * 1.1, top - 1.4 * z); g.lineTo(tb[0], top - 20 * z); g.lineTo(tb[0] + R * 1.1, top - 1.4 * z); g.ellipse(tb[0], top - 1.4 * z, R * 1.1, R * 0.55, 0, 0, Math.PI); g.fill();
    g.fillStyle = C(GOLD_D); g.beginPath(); g.moveTo(tb[0], top - 20 * z); g.lineTo(tb[0] + R * 1.1, top - 1.4 * z); g.ellipse(tb[0], top - 1.4 * z, R * 1.1, R * 0.55, 0, 0, Math.PI / 2); g.lineTo(tb[0], top - 1.4 * z); g.fill();
    const m = [tb[0], top - 28 * z];
    L(C(GOLD_D), 1.1, z, [[m[0], top - 19 * z], [m[0], m[1]]]);                                                  // Stange reicht bis in die Sternmitte
    star(m[0], m[1] + 0.4 * z, 6.4 * z, C(GOLD_D)); star(m[0], m[1], 6 * z, lit() ? '#fff1a8' : C(GOLD));
    circle(m[0], m[1] + 3.4 * z, 1.5 * z, C(GOLD_D));                                                            // Fassung, in der der Stern auf der Stange steckt
    if (lit()) { glowP([tb[0], top + LH / 2], 95 * z); glowP([tb[0], top + LH / 2], 36 * z); }
  }
  window.STERNENLEUCHTE = sternenleuchteF;
  window.PAGODEN = [
    ['A · rund geschwungen (bisher)', (K, n) => pagodeF(K, n, {}), 2.5, 2],
    ['B · gerade Traufe', (K, n) => pagodeF(K, n, { curve: 0, rh: 9 }), 2.5, 2],
    ['C · gerade, nur die Ecken hoch', (K, n) => pagodeF(K, n, { curve: 6, flick: true, rh: 9 }), 2.5, 2],
    ['D · flach und weit (japanisch)', (K, n) => pagodeF(K, n, { curve: 4, flick: true, rh: 6, over: 0.28 }), 2.5, 2],
    ['E · steil, schmal', (K, n) => pagodeF(K, n, { curve: 3, flick: true, rh: 13, over: 0.13 }), 2.5, 2]];
  window.FINAL = [['1 · Obelisk der Sonnenbucht', obeliskF, 2.6, 2], ['2 · Hüterin des Hafens', hueterin, 2.3, 2, 'wasser'], ['3 · Triumphbogen', triumphF, 2.8, 2],
    ['4 · Deine Statue', statueF, 3.0, 2], ['5 · Pagode', pagodeF, 2.5, 2], ['6 · Sternendenkmal', sternF, 2.8, 2], ['7 · Steinkreis', steinkreisF2, 2.9, 2], ['8 · Prachtbrunnen', brunnenF2, 2.9, 2]];
  window.VOLL = [['Obelisk der Sonnenbucht', obelisk, 2.1], ['Koloss am Hafen', koloss, 1.62]];
  window.PAKET1 = [['Obelisk der Sonnenbucht (überarbeitet)', obelisk, 2.1], ['Triumphbogen', triumph, 2.0], ['Deine Statue', deineStatue, 2.1], ['Mondtor', mondtor, 2.0]];
  window.KOLOSS_NEU = [['Koloss A – breitbeinig, kräftig', kolossA, 1.75], ['Koloss B – Hüterin des Hafens', kolossB, 1.9]];

  window.monumenteVoll = async (opts = {}) => {
    const DW = 560, DH = 560, NW = 280, NH = 280, list = opts.list || window.VOLL, shots = [];
    const gq = glowQuad, n0 = night, prevG = g, glows = [];
    glowQuad = (pts, r, tint) => { const m = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]); glows.push([m[0], m[1], r, tint === 'blue' ? '140,190,255' : '255,200,110']); };
    try {
      for (const [label, fn, zz, gn = 3, kind = 'gras'] of list) {
        for (const nightOn of [false, true]) {
          const c = document.createElement('canvas'); const w = nightOn ? NW : DW, h = nightOn ? NH : DH; c.width = w; c.height = h; const cx = c.getContext('2d');
          g = ctx; night = nightOn ? 1 : 0;
          ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          const z = (nightOn ? 0.5 : 1) * (zz || 1.62);
          ctx.fillStyle = nightOn ? '#1f2846' : '#9fd27a'; ctx.fillRect(0, 0, w, h);
          const gx = w / 2, gy = h - 16 * gn * z - (nightOn ? 8 : 18);
          diamond(gx, gy, 32 * gn * z, 16 * gn * z, kind === 'wasser' ? (nightOn ? '#2c4f7a' : '#6fbfe3') : nightOn ? '#33405e' : '#b4dd8c');
          if (kind === 'wasser') for (let i = 0; i < 10; i++) { const wx = gx + ((i * 37) % 100 - 50) * gn * 0.5 * z, wy = gy + ((i * 53) % 40 - 20) * gn * 0.35 * z; ctx.strokeStyle = nightOn ? 'rgba(170,210,255,0.5)' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.8 * z; ctx.beginPath(); ctx.moveTo(wx - 4 * z, wy); ctx.quadraticCurveTo(wx, wy - 1.5 * z, wx + 4 * z, wy); ctx.stroke(); }
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
