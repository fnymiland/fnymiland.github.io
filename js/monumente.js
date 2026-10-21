'use strict';
// ---------------------------------------------------------------------------
// 🏛️ Monumente (Block 162, PLAN-162.md, Nutzer 21.10.2026): Wahrzeichen (Pagode, Sternenleuchte, Obelisk, Triumphbogen) gibt es als
// „Wahrzeichen des Monats“ im Sternenbasar – Bauplan für ✨, dann beliebig oft als Baustelle hinstellen und in drei Abschnitten mit
// Talern und Baustoffen bauen. Prachtstücke (Statue, Sternendenkmal, Prachtbrunnen) sind seltene Basar-Ware: kaufen, sofort fertig.
// Nur das Bauwerk mit festem Sockel – keine mitgelieferte Deko (die stellen die Spieler selbst). Bilder aus tools/monumente-voll.js
// (FINAL, im Browser abgenommen), gezeichnet mit dem Wunderwerk-Rahmen kit (K.P in Feldern/Einheiten, Mitte der 2×2-Fläche)
// ---------------------------------------------------------------------------
const MON_ART = (() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  const lit = () => night > 0.15 && isLive();
  const glowP = (p, r, tint) => { const q = 0.4; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], r, tint); };
  const L = (col, w, z, pts) => { g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const mid = (p, q, t = 0.5) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const star = (x, y, r, fill) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } poly(pts, fill); };
  const plinth = (K, a, b, ha, hb, h, lift, wall, trim) => K.block({ a, b, ha, hb, h, lift, wall, type: 'flat', roof: shade(wall, 0.06), trim });
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
  function triumphF(K, now = 0, opt = {}) {
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
    K.block({ a: 0, b: 0, ha: ha + 0.002, hb: hb + 0.002, h: 13, lift: H - 6, wall: ST, type: 'flat', roof: '#f6f0e2' });   // Attika bündig mit dem Bogen
    K.block({ a: 0, b: 0, ha: ha + 0.01, hb: hb + 0.01, h: 2.5, lift: H + 7, wall: STD, type: 'flat', roof: '#e9e0cb' });
    poly(faceRect((b, h) => K.P(ha + 0.003, b, h), -0.5, 0.5, H - 4, H + 5), C(GOLD));
    for (let r = 0; r < 2; r++) L(C(GOLD_D), 0.6, z, [K.P(ha + 0.004, -0.42, H - 1 + r * 3), K.P(ha + 0.004, 0.42, H - 1 + r * 3)]);
    // Aufsatz (keine Menschenfigur, Nutzer 21.10.2026): goldene Krone, großer Stern oder nur Fahnen
    const base = K.P(0, 0, H + 9.5), top = opt.top || 'krone';
    if (top !== 'fahnen') box(base[0], base[1], 7 * z, 3.5 * z, 4 * z, GOLD_D, null, 0);
    const ft = [base[0], base[1] - 4 * z];
    if (top === 'krone') {
      const r = 10 * z, ry = r * 0.5, hgt = 6 * z, cy0 = ft[1] - 2 * z, n = 10;
      const ring = (front) => { for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * Math.PI * 2, isFront = Math.sin(a) > 0; if (isFront !== front) continue;
        const x = ft[0] + Math.cos(a) * r, y = cy0 + Math.sin(a) * ry, h2 = (i % 2 ? 0.7 : 1.3) * hgt * (front ? 1 : 0.85);
        poly([[x - 2.4 * z, y - hgt * 0.95], [x, y - hgt - h2], [x + 2.4 * z, y - hgt * 0.95]], C(front ? (Math.cos(a) < 0 ? GOLD_L : GOLD) : GOLD_D));
        circle(x, y - hgt - h2 - 1 * z, 1.1 * z, C(front ? GOLD : GOLD_D)); } };
      ring(false);
      g.fillStyle = C('#9c3d4a'); g.beginPath(); g.ellipse(ft[0], cy0 - hgt, r * 0.94, ry * 0.94, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = C(GOLD); g.beginPath(); g.ellipse(ft[0], cy0, r, ry, 0, 0, Math.PI); g.lineTo(ft[0] - r, cy0 - hgt); g.ellipse(ft[0], cy0 - hgt, r, ry, 0, Math.PI, 0, true); g.closePath(); g.fill();
      g.fillStyle = C(GOLD_D); g.beginPath(); g.ellipse(ft[0], cy0, r, ry, 0, 0, Math.PI / 2); g.lineTo(ft[0], cy0 - hgt + ry); g.ellipse(ft[0], cy0 - hgt, r, ry, 0, Math.PI / 2, 0, true); g.closePath(); g.fill();
      for (const [t, col2] of [[-0.6, '#e8546f'], [0, '#5b8fd8'], [0.6, '#e8546f']]) { const a = Math.PI / 2 - t, x = ft[0] + Math.cos(a) * r * 0.98, y = cy0 + Math.sin(a) * ry - hgt * 0.5; ellipse(x, y, 1.5 * z, 1.8 * z, C(col2)); }
      ring(true);
      if (lit()) glowP([ft[0], cy0 - hgt], 26 * z);
    } else if (top === 'stern') {
      const R = 13 * z, c = [ft[0], ft[1] - R - 2 * z];
      L(C(GOLD_D), 1.4, z, [[ft[0], ft[1]], [c[0], c[1]]]);
      star(c[0], c[1] + 2.4 * z, R, C(GOLD_D)); star(c[0], c[1], R, lit() ? '#fff1a8' : C(GOLD)); star(c[0], c[1], R * 0.45, lit() ? '#ffffff' : C(GOLD_L));
      if (lit()) glowP(c, 40 * z);
    } else {
      const st = opt.flags || 'mitte', R2 = '#e8546f', B2 = '#5b8fd8', Y2 = GOLD, top0 = H + 9.5;
      const mast = (bb, aa, hgt) => { const f = K.P(aa, bb, top0); L(C('#6b4f3a'), 1, z, [f, [f[0], f[1] - hgt * z]]); circle(f[0], f[1] - hgt * z - 1 * z, 1.3 * z, C(GOLD)); return [f[0], f[1] - hgt * z]; };
      const wave = (t, k = 0) => Math.sin(now / 280 + t * 6 + k) * 1.3 * z;
      if (st === 'banner') {                                                                // A: zwei hohe Masten an den Ecken, lange Banner hängen herab
        for (const bb of [-(hb - 0.08), hb - 0.08]) { const tp = mast(bb, ha - 0.05, 34), w = 7 * z, len = 22 * z;
          L(C(GOLD_D), 0.9, z, [[tp[0] - 0.5 * z, tp[1] + 3 * z], [tp[0] + w + 1 * z, tp[1] + 3 * z]]);
          poly([[tp[0], tp[1] + 3 * z], [tp[0] + w, tp[1] + 3 * z], [tp[0] + w + wave(bb), tp[1] + 3 * z + len], [tp[0] + w / 2 + wave(bb), tp[1] + 3 * z + len - 4 * z], [tp[0] + wave(bb), tp[1] + 3 * z + len]], C(R2));
          poly([[tp[0] + w * 0.38, tp[1] + 3 * z], [tp[0] + w * 0.62, tp[1] + 3 * z], [tp[0] + w * 0.62 + wave(bb), tp[1] + 3 * z + len - 2.5 * z], [tp[0] + w * 0.38 + wave(bb), tp[1] + 3 * z + len - 2.5 * z]], C(Y2)); }
      } else if (st === 'reihe') {                                                          // B: Reihe kleiner Wimpel auf der Dachkante
        for (let k = 0; k < 7; k++) { const bb = -0.75 + k * 0.25, tp = mast(bb, ha - 0.04, 14); poly([[tp[0], tp[1]], [tp[0] + 6 * z, tp[1] + 2 * z + wave(bb)], [tp[0], tp[1] + 4.5 * z]], C([R2, Y2, B2][k % 3])); }
      } else if (st === 'mitte') {                                                          // C: ein großer Mast mit großer Fahne
        const tp = mast(0, 0, 44), w = 18 * z, hh = 11 * z;
        g.fillStyle = C(R2); g.beginPath(); g.moveTo(tp[0], tp[1] + 1 * z); g.quadraticCurveTo(tp[0] + w / 2, tp[1] - 2 * z + wave(0), tp[0] + w, tp[1] + 2 * z + wave(0, 1)); g.lineTo(tp[0] + w, tp[1] + 2 * z + hh + wave(0, 1)); g.quadraticCurveTo(tp[0] + w / 2, tp[1] - 2 * z + hh + wave(0), tp[0], tp[1] + 1 * z + hh); g.closePath(); g.fill();
        star(tp[0] + w * 0.5, tp[1] + 1 * z + hh / 2 + wave(0) * 0.5, 3.4 * z, C(Y2));
      } else if (st === 'stoff') {                                                          // D: Stoffbanner an der Front zwischen den Säulen
        for (const bb of [-0.62, 0.62]) { const P2 = (b, h) => K.P(ha + 0.04, b, h); poly([P2(bb - 0.1, 47), P2(bb + 0.1, 47), P2(bb + 0.1, 28), P2(bb, 25), P2(bb - 0.1, 28)], C(R2)); poly([P2(bb - 0.03, 47), P2(bb + 0.03, 47), P2(bb + 0.03, 27), P2(bb - 0.03, 27)], C(Y2)); L(C(GOLD_D), 1, z, [P2(bb - 0.12, 47.5), P2(bb + 0.12, 47.5)]); }
        for (const bb of [-(hb - 0.08), hb - 0.08]) { const tp = mast(bb, ha - 0.05, 18); poly([[tp[0], tp[1]], [tp[0] + 8 * z, tp[1] + 2.5 * z + wave(bb)], [tp[0], tp[1] + 5 * z]], C(R2)); }
      } else {                                                                              // E: Wimpelgirlande zwischen zwei Masten
        const t0 = mast(-(hb - 0.08), ha - 0.05, 28), t1 = mast(hb - 0.08, ha - 0.05, 28), n = 11;
        const at = t => [t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t + Math.sin(Math.PI * t) * 9 * z];
        L(C('#6b4f3a'), 0.6, z, Array.from({ length: 21 }, (_, k) => at(k / 20)));
        for (let k = 1; k < n; k++) { const p0 = at(k / n - 0.035), p1 = at(k / n + 0.035), m = at(k / n); poly([p0, p1, [m[0], m[1] + 4.5 * z]], C([R2, Y2, B2][k % 3])); }
      }
    }
    // Fahnen spiegelgleich an den vorderen Dachecken
    if (top !== 'fahnen') for (const b of [-(hb - 0.06), hb - 0.06]) { const f = K.P(ha - 0.03, b, H + 9.5); L(C('#6b4f3a'), 0.8, z, [f, [f[0], f[1] - 20 * z]]); const w = Math.sin(now / 280 + b * 3) * 1.4 * z; poly([[f[0], f[1] - 20 * z], [f[0] + 9 * z, f[1] - 17 * z + w], [f[0], f[1] - 14 * z]], C('#e8546f')); }
    if (lit()) { glowP(F(0, 16), 24 * z); glowP(F(0, H + 1), 26 * z); }
  }

  // 3 · Deine Statue: hoher Sockel mit Stufen und lesbarem Schild, darauf deine Spielfigur in Gold
  let goldCache = null;                                                                                       // { key, fig }
  function goldFigure(now) {
    let f = null; try { f = typeof meFigLook === 'function' ? meFigLook() : null; } catch (e) { f = null; }
    if (!f || typeof document === 'undefined') return null;
    const key = JSON.stringify(f);
    if (goldCache && goldCache.key === key) return goldCache.fig;
    const off = document.createElement('canvas'), S2 = 150; off.width = S2 * 2; off.height = S2 * 2; const ox = off.getContext('2d');
    if (!ox) return null;
    const prev = g; g = ox;
    try { drawFigure({ ...f, label: null, name: '', full: true, seat: true, sx: S2, sy: S2 * 1.85, wait: 1, sit: false, speed: 0, px: 0, py: 0 }, 9, now); } catch (e) { /* ohne Figur */ } finally { g = prev; }
    ox.globalCompositeOperation = 'source-atop'; ox.fillStyle = 'rgba(214,160,48,0.8)'; ox.fillRect(0, 0, S2 * 2, S2 * 2);
    const gr = ox.createLinearGradient(S2 * 0.6, 0, S2 * 1.4, 0); gr.addColorStop(0, 'rgba(255,236,160,0.55)'); gr.addColorStop(0.5, 'rgba(255,236,160,0)'); gr.addColorStop(1, 'rgba(110,60,10,0.4)'); ox.fillStyle = gr; ox.fillRect(0, 0, S2 * 2, S2 * 2);
    let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    try { const px = ox.getImageData(0, 0, S2 * 2, S2 * 2).data;
      for (let yy = 0; yy < S2 * 2; yy++) for (let xx = 0; xx < S2 * 2; xx++) if (px[(yy * S2 * 2 + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } } catch (e) { x1 = -1; }
    goldCache = { key, fig: x1 > 0 ? { off, x0, y0, x1, y1 } : null };
    return goldCache.fig;
  }
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
    // Figur vergolden und auf den Sockel stellen (ausgemessen); einmal je Aussehen gemalt und gemerkt – das Ausmessen liest Pixel
    const gold = goldFigure(0), foot = K.P(0, 0, 39);
    if (gold) { const { off, x0, y0, x1, y1 } = gold, hgt = 60 * z, k = hgt / (y1 - y0 + 1), w = (x1 - x0 + 1) * k; ellipse(foot[0], foot[1], w * 0.4, w * 0.14, 'rgba(90,60,20,0.25)'); g.drawImage(off, x0, y0, x1 - x0 + 1, y1 - y0 + 1, foot[0] - w / 2, foot[1] - hgt, w, hgt); }
    if (lit()) { glowP([foot[0], foot[1] - 30 * z], 46 * z); glowP(c, 18 * z); }
  }

  // 4 · Mondtor: weiße Mauer (längs b) mit runder Pforte, Gitterfenstern, Ziegeldach, Mondsichel mit Mondhase auf dem First
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
        poly([...pts, t1, t0], C(n ? ROOF_D : '#3a706a'));
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
    if (lit()) { glowP([tb[0], top + LH / 2], 95 * z); glowP([tb[0], top + LH / 2], 36 * z); }
  }
  // 8 · Prachtbrunnen (dritte Fassung): achteckiges Becken, Säule mit großer und kleiner Schale, goldene Muschel oben als Quelle,
  // Wasserweg sichtbar: Muschel → kleine Schale → große Schale → Becken; zwei goldene Delfine am Rand speien ins Becken
  function brunnenF3(K, now = 0) {
    const z = K.z, n = 8, R = 0.8, Hb = 7, wcol = lit() ? 'rgba(200,245,255,0.95)' : 'rgba(255,255,255,0.95)';
    const pt = (i, r = R, h = 0) => { const ang = (i + 0.5) / n * Math.PI * 2; return K.P(Math.cos(ang) * r, Math.sin(ang) * r, h); };
    const face = i => K.depth(Math.cos((i + 1) / n * Math.PI * 2), Math.sin((i + 1) / n * Math.PI * 2));
    for (let i = 0; i < n; i++) if (face(i) <= 0) poly([pt(i), pt(i + 1), pt(i + 1, R, Hb), pt(i, R, Hb)], C('#cfc3a5'));
    poly(Array.from({ length: n }, (_, i) => pt(i, R, Hb)), C('#efe7d6'));
    poly(Array.from({ length: n }, (_, i) => pt(i, R * 0.88, Hb)), lit() ? '#2f9fb0' : C('#7fd0e2'));          // Wasser im Becken
    for (let i = 0; i < n; i++) if (face(i) <= 0) L(C('#efe7d6'), 1.4, z, [pt(i, R, Hb), pt(i + 1, R, Hb)]);   // hintere Randkante – vor Säule und Wasser
    if (lit()) glowP(K.P(0, 0, Hb), 50 * z, 'blue');
    const c = K.P(0, 0, Hb), cx = c[0];
    // Säule und Schalen (jede Schale sitzt auf einem Säulenstück, Unterseite dunkler, Rand, Wasser oben)
    const bowl = (y, r, deep) => { g.fillStyle = C('#cfc3a5'); g.beginPath(); g.ellipse(cx, y, r, r * 0.42, 0, 0, Math.PI); g.lineTo(cx + r * 0.35, y + deep); g.lineTo(cx - r * 0.35, y + deep); g.closePath(); g.fill();   // Schalenbauch
      g.fillStyle = C('#b8ac8c'); g.beginPath(); g.ellipse(cx, y, r, r * 0.42, 0, 0, Math.PI / 2); g.lineTo(cx + r * 0.35, y + deep); g.lineTo(cx, y + deep); g.closePath(); g.fill();
      ellipse(cx, y, r, r * 0.42, C('#efe7d6')); ellipse(cx, y - 0.6 * z, r * 0.86, r * 0.36, lit() ? '#5fd0e0' : C('#a6e2f0')); };
    // Überlauf: rundum ein geschlossener, durchscheinender Wasserschleier über die vordere Kante (keine Einzelstrahlen – die gäbe es nur mit Düsen),
    // leicht nach außen gewölbt, unten ein Schaumrand
    const curtain = (yTop, r, yBot, rb) => { const N = 24, T = [], M = [], B = [];
      for (let k = 0; k <= N; k++) { const a = Math.PI * k / N, ca = Math.cos(a), sa = Math.sin(a);
        T.push([cx + ca * r, yTop + sa * r * 0.42]); M.push([cx + ca * (r + (rb - r) * 0.75), yTop + (yBot - yTop) * 0.3 + sa * (r + (rb - r) * 0.75) * 0.42]); B.push([cx + ca * rb, yBot + sa * rb * 0.42]); }
      g.beginPath(); g.moveTo(...T[0]); for (const p of T) g.lineTo(...p);
      g.quadraticCurveTo(...M[N], ...B[N]); for (let k = N; k >= 0; k--) g.lineTo(...B[k]); g.quadraticCurveTo(...M[0], ...T[0]); g.closePath();
      const gr = g.createLinearGradient(0, yTop, 0, yBot + rb * 0.42); gr.addColorStop(0, lit() ? 'rgba(210,245,255,0.7)' : 'rgba(255,255,255,0.72)'); gr.addColorStop(1, lit() ? 'rgba(150,220,255,0.35)' : 'rgba(220,245,255,0.4)');
      g.fillStyle = gr; g.fill();
      g.strokeStyle = lit() ? 'rgba(230,250,255,0.5)' : 'rgba(255,255,255,0.55)'; g.lineWidth = 0.5 * z;
      for (let k = 2; k < N; k += 3) { g.beginPath(); g.moveTo(...T[k]); g.quadraticCurveTo(...M[k], ...B[k]); g.stroke(); }   // feine Fließspuren
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1 * z; g.beginPath(); T.forEach((p, k) => k ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();   // heller Wulst am Rand
      for (let k = 2; k < N; k += 3) ellipse(B[k][0], B[k][1], 1.8 * z, 0.7 * z, 'rgba(255,255,255,0.85)'); };   // Schaum genau dort, wo die Fließspuren auftreffen
    cyl(cx, c[1], 5 * z, 2.5 * z, 16 * z, '#e6dcc4');
    const y1 = c[1] - 18 * z, r1 = 20 * z;
    bowl(y1, r1, 7 * z);
    cyl(cx, y1 - 0.6 * z, 3.4 * z, 1.7 * z, 12 * z, '#e6dcc4');
    const y2 = y1 - 14 * z, r2 = 11 * z;
    bowl(y2, r2, 5 * z);
    // goldene Muschel oben: steht aufrecht in der kleinen Schale, Wasser quillt aus ihrer Öffnung
    const sh = [cx, y2 - 3 * z], SR = 8 * z;
    // Jakobsmuschel: Rippen laufen vom Schloss unten nach oben, Rand gewellt, Öhrchen am Schloss
    const hinge = [sh[0], sh[1] + 1 * z], rad = SR * 1.15, nr = 9;
    const edge = t => { const a = Math.PI * (1.08 + 0.84 * t); return [hinge[0] + Math.cos(a) * rad, hinge[1] + Math.sin(a) * rad * 1.05]; };
    for (let k = 0; k < nr; k++) { const e0 = edge(k / nr), e1 = edge((k + 1) / nr), em = edge((k + 0.5) / nr);
      const bump = [em[0] + (em[0] - hinge[0]) * 0.1, em[1] + (em[1] - hinge[1]) * 0.1];
      g.fillStyle = C(k < nr / 2 ? GOLD : '#e2b23e'); g.beginPath(); g.moveTo(...hinge); g.lineTo(...e0); g.quadraticCurveTo(...bump, ...e1); g.closePath(); g.fill();
      L(C(GOLD_D), 0.45, z, [hinge, e1]); }
    poly([[hinge[0] - 2.6 * z, hinge[1] - 1 * z], [hinge[0] + 2.6 * z, hinge[1] - 1 * z], [hinge[0], hinge[1] + 1.6 * z]], C(GOLD_D));   // Schloss, schlicht
    g.strokeStyle = wcol; g.lineWidth = 1.6 * z; g.beginPath(); g.moveTo(sh[0], sh[1] + 1 * z); g.quadraticCurveTo(sh[0] + 1.5 * z, sh[1] + 3 * z, sh[0] + 1 * z, y2 + 1 * z); g.stroke(); ellipse(sh[0] + 1 * z, y2 + 1 * z, 2.2 * z, 0.8 * z, wcol);   // ein Strahl aus der Muschelöffnung in die kleine Schale
    curtain(y2, r2 * 0.98, y1 - 0.5 * z, r2 * 1.3);                                                               // kleine Schale → große Schale
    curtain(y1, r1 * 0.98, c[1] + 1 * z, r1 * 1.25);                                                               // große Schale → Becken
    // vordere Beckenwand zuletzt
    for (let i = 0; i < n; i++) if (face(i) > 0) { const m = (i + 1) / n * Math.PI * 2 - Math.PI / n, u = K.turn(Math.cos(m), Math.sin(m))[0] - K.turn(Math.cos(m), Math.sin(m))[1]; poly([pt(i), pt(i + 1), pt(i + 1, R, Hb), pt(i, R, Hb)], C(shade('#e6dcc4', u > 0.3 ? -0.12 : u < -0.3 ? 0.05 : -0.04))); }   // Licht von links: linke Flächen hell, rechte dunkel
    for (let i = 0; i < n; i++) if (face(i) > 0) L(C('#efe7d6'), 1.4, z, [pt(i, R, Hb), pt(i + 1, R, Hb)]);   // nur die vordere Randkante zuletzt
    if (lit()) glowP(sh, 18 * z);
  }

  // Bildnamen → Zeichnung (Triumphbogen: Aufsatz Wimpelreihe B, Wimpel stehen still – Bildchen statt live; Pagode: gerade Traufe B)
  return { obelisk: obeliskF, leuchte: sternenleuchteF, bogen: K => triumphF(K, 0, { top: 'fahnen', flags: 'reihe' }), statue: statueF,
    pagode: (K, now) => pagodeF(K, now, { curve: 0, rh: 9 }), stern: sternF, brunnen: brunnenF3 };
})();

// Wahrzeichen: drei Bauabschnitte (Nutzer 21.10.2026: 100 / 300 / 600 Mio Taler + Baustoffe – endlich ein Ziel für den Talerberg)
const MON_PHASES = [{ money: 100e6, quader: 300 }, { money: 300e6, metall: 300, bretter: 300 }, { money: 600e6, quader: 400, metall: 400 }];
const MON_PHASE_NAMES = ['Fundament', 'Rohbau', 'Vollendung'];
const MON_PLAN = 1000, MON_PRACHT = 500;                              // ✨: Bauplan eines Wahrzeichens, Prachtstück
// art: Bild (MON_ART), h: Höhe über dem Boden bei Zoom 1 (Bildchen dürfen die Spitze nicht abschneiden, render.js spriteTop),
// wahr: Wahrzeichen (Baustelle, mehrfach baubar), wet: darf auch ins Wasser
const MONUMENTS = {
  mon_pagode: { art: 'pagode', wahr: true, h: 140, name: 'Große Pagode', desc: 'Fünf grüne Dächer übereinander, Glöckchen an den Ecken und eine goldene Spitze.' },
  mon_leuchte: { art: 'leuchte', wahr: true, h: 154, wet: true, name: 'Sternenleuchte', desc: 'Ein weißer Turm auf einer Felseninsel, oben eine goldene Laterne mit Sternen im Glas. Steht im Wasser oder an Land.' },
  mon_obelisk: { art: 'obelisk', wahr: true, h: 168, name: 'Obelisk der Sonnenbucht', desc: 'Eine Steinnadel mit Sonnen-, Mond- und Sternzeichen, oben glänzt die goldene Spitze.' },
  mon_bogen: { art: 'bogen', wahr: true, h: 93, name: 'Triumphbogen', desc: 'Drei Bögen zum Durchgehen und eine Reihe bunter Wimpel obendrauf.' },
  mon_statue: { art: 'statue', h: 100, name: 'Deine Statue', desc: 'Du selbst – in Gold auf einem hohen Sockel, mit deinem Namen auf der Tafel.' },
  mon_stern: { art: 'stern', h: 106, name: 'Sternendenkmal', desc: 'Ein goldener Stern über einer Kristallsäule auf drei runden Stufen.' },
  mon_brunnen: { art: 'brunnen', h: 52, name: 'Prachtbrunnen', desc: 'Ein achteckiges Becken mit zwei Schalen – das Wasser quillt aus einer goldenen Muschel.' },
};
const MON_WAHR = Object.keys(MONUMENTS).filter(id => MONUMENTS[id].wahr);
for (const [id, m] of Object.entries(MONUMENTS)) {
  ITEMS[id] = { cat: 'deko', name: m.name, sdShop: true, mon: true, size: [2, 2], h: m.h, beauty: m.wahr ? 80 : 40, sammlung: 'Monumente', desc: m.desc,
    ...(m.wahr ? { cost: 1e6, mat: { bretter: 50 }, monPhases: MON_PHASES } : { cost: 2e6, mat: { quader: 40 } }), ...(m.wet ? { wet: true } : { needs: 'grass' }) };
  BIG_ART[id] = (cx, cy, z, now, x, y, lvl, t) => drawMonument(id, cx, cy, z, now, t || {});
  SD_SHOP.push(m.wahr ? { id, price: MON_PLAN, mon: true } : { id, price: MON_PRACHT, rare: true });
  ITEM_TIPS[id] = m.wahr ? 'Wahrzeichen ✨ – Bauplan im Sternenbasar, dann als Baustelle hinstellen und in drei Abschnitten bauen. Geht beliebig oft.'
    : `Prachtstück aus dem Sternenbasar ✨ – braucht 2×2 Felder${m.wet ? '' : ' Wiese'}.`;
}
SD_SAMMLUNGEN.push(['Monumente', '🏛️', 'Monumente']);
{ const top = MENU.find(m => m.id === 'gestalten'); if (top) top.groups.push({ id: 'monumente', label: '🏛️ Monumente', items: Object.keys(MONUMENTS) }); }

// Wahrzeichen des Monats: gleicher Monat + Spielstand = gleiches Wahrzeichen; die vier wechseln sich ab (verpasste kommen wieder)
const MON_MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const monMonth = (d = new Date()) => d.getFullYear() * 12 + d.getMonth();
const monOrder = () => [...MON_WAHR].sort((a, b) => sdHash('mon:' + state.seed + ':' + a) - sdHash('mon:' + state.seed + ':' + b));
const monOfMonth = (d = new Date()) => { const o = monOrder(); return o[monMonth(d) % o.length]; };
const monDaysLeft = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1;
// In wie vielen Monaten kommt id wieder (0 = jetzt), und welcher Monat ist das
function monNext(id, d = new Date()) {
  for (let k = 0; k < MON_WAHR.length; k++) { const m = new Date(d.getFullYear(), d.getMonth() + k, 1); if (monOfMonth(m) === id) return { in: k, name: MON_MONTHS[m.getMonth()] }; }
  return null;
}

// Baustelle: t.phase 0…3 (wie die Wunderwerke, state.js speichert phase/paid); ohne phase (Vorschaubild, Prachtstück) = fertig
const monPhases = t => (t && ITEMS[t.b] && ITEMS[t.b].monPhases) || null;
const monSite = t => !!monPhases(t) && t.phase != null && t.phase < monPhases(t).length;
const monCost = t => monSite(t) ? { ...monPhases(t)[t.phase] } : null;
const monPaid = t => (t && t.paid ? { ...t.paid } : { money: 0 });
function monStep(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!monSite(t)) return false;
  const cost = monCost(t);
  if (!canPay(cost)) { fail(state.money < (cost.money || 0) ? 'Zu wenig Taler' : 'Material fehlt noch'); return false; }
  const paid = monPaid(t);
  for (const [r, n] of Object.entries(cost)) paid[r] = (paid[r] || 0) + n;
  t.paid = paid;
  const { money = 0, ...mat } = cost;
  state.money -= money; payMat(mat);
  t.phase++;
  t.born = performance.now();
  recalc();
  sparkle(x + 0.5, y + 0.5);
  if (!monSite(t)) { confettiBurst(); confettiBurst(); sfx('star'); toast(`🎉 ${ITEMS[t.b].name} ist fertig!`); }
  else { sfx('build'); toast(`${ITEMS[t.b].name}: ${MON_PHASE_NAMES[t.phase - 1]} fertig!`); }
  save();
  return true;
}
// Infofenster: Fortschritt, Kosten des nächsten Abschnitts, Knopf (ui.js openInfo)
function monInfoHtml(t) {
  if (!monPhases(t)) return '';
  if (!monSite(t)) return '<p class="ok">✓ Fertig gebaut.</p>';
  const N = monPhases(t).length, p = t.phase, { money = 0, ...mat } = monCost(t);
  return `<div class="label">Abschnitt ${p + 1} von ${N}: ${MON_PHASE_NAMES[p]}</div>
    <div class="wbar"><i style="width:${p / N * 100}%"></i></div>
    <div class="stats">${costSpans(money, mat)}</div>
    <p class="muted">Wenn fertig: 🌸 ${ITEMS[t.b].beauty} Schönheit.</p>
    <div class="row"><button class="btn" id="p-mon" ${canPay(monCost(t)) ? '' : 'disabled'}>🏗️ Abschnitt bauen</button></div>`;
}
function drawMonument(id, cx, cy, z, now, t) {
  const K = kit(cx, cy, z, 0), art = () => MON_ART[MONUMENTS[id].art](K, now), ph = ITEMS[id].monPhases;
  if (!monSite({ ...t, b: id })) { art(); return; }
  K.rect(-0.95, -0.95, 0.95, 0.95, C('#d9c7a0'));                                     // Bauplatz
  siteScaffold(K, cy, z, 1, 1, ITEMS[id].h, t.phase, ph.length, art);
}
