'use strict';
// Ladenbilder, Gruppe f (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Die großen Häuser: Museum (Tempel mit Dino-Skelett im Vorhof), Hotel (Leuchtschild H-O-T-E-L mit drei Sternen),
// Grand Hotel (Palast mit Kuppeltürmen, Schriftzug und fünf Sternen), Markthalle (Glashalle mit Uhrtürmchen und Ständen).
// Alles im Baukasten (vorn = +a); Wahrzeichen, die man von jeder Seite sehen soll, stehen hoch oder an der sichtbaren Ecke.
(function () {
  const lit = () => night > 0.15 && isLive();
  // Lichtschein ohne Loch: macht Schilder nachts hell, ohne ihre Schrift zu überdecken
  const halo = (x, y, r) => glowQuad([[x, y], [x, y], [x, y], [x, y]], r);
  const bulb = (x, y, z) => glowQuad([[x - 0.8 * z, y - 0.8 * z], [x + 0.8 * z, y - 0.8 * z], [x + 0.8 * z, y + 0.8 * z], [x - 0.8 * z, y + 0.8 * z]], 5 * z);
  // Leuchtschrift: nachts werden die Buchstaben ausgestanzt und vom Lichtschein dahinter (halo) hinterlegt, sie leuchten warm.
  // Nicht beim Zeichnen eines Bildchens (GLOW_SINK): dort läge unter dem Loch später der Boden.
  function glowText(x, y, text, size, col, z) {
    kText(x, y, text, size, col, z);
    if (!lit() || GLOW_SINK) return;
    g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = Math.min(1, night / NIGHT_MAX); g.fillText(text, x, y); g.restore();
  }
  const GOLD = '#f2c14e', GOLD_D = '#c9a24a', FRUIT = ['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a', '#c77dff'];

  // Goldener Stern mit dunklem Rand; r in Bildpunkten (schon × z)
  function star(x, y, r, z) {
    const pts = rr => { const out = []; for (let i = 0; i < 10; i++) { const w = -Math.PI / 2 + i * Math.PI / 5, k = i & 1 ? 0.46 : 1; out.push([x + Math.cos(w) * rr * k, y + Math.sin(w) * rr * k]); } return out; };
    poly(pts(r + 0.9 * z), C('#a8741f'));
    poly(pts(r), C('#f6c945'));
    circle(x - r * 0.15, y - r * 0.18, r * 0.2, C('#fff1b0'));
  }
  // Runde Säule (Fuß, Schaft mit Schattenseite, Kapitell) ab Höhe up0, h px hoch
  function column(K, a, b, up0, h, col = '#fbf7ee', w = 2) {
    const [x, y] = K.P(a, b, up0), z = K.z, hw = w * z, top = y - h * z;
    ellipse(x, y, hw * 1.45, hw * 0.65, C(shade(col, -0.2)));
    g.fillStyle = C(col); g.fillRect(x - hw, top, hw * 2, h * z);
    g.fillStyle = C(shade(col, -0.16)); g.fillRect(x + hw * 0.2, top, hw * 0.8, h * z);
    g.fillStyle = C(shade(col, -0.04)); g.fillRect(x - hw * 1.5, top - 1.3 * z, hw * 3, 1.6 * z);
  }
  // Bogenfenster auf einer Seite: Mitte tc und Breite tw (Anteil der Seite), Rechteck von h0 bis h1 (px), oben rund
  function archPts(F, tc, tw, h0, h1, z, grow = 0) {
    const L = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]) || 1, gt = grow * z / L, t0 = tc - tw / 2 - gt, t1 = tc + tw / 2 + gt;
    const rise = (t1 - t0) * L * 0.55, pts = [faceAt(F, t0, (h0 - grow) * z)];
    for (let i = 0; i <= 8; i++) { const w = Math.PI * i / 8; pts.push(faceAt(F, tc - Math.cos(w) * (t1 - t0) / 2, h1 * z + Math.sin(w) * rise)); }
    pts.push(faceAt(F, t1, (h0 - grow) * z));
    return pts;
  }
  function archWin(K, F, tc, tw, h0, h1, frame = '#efe0c8') {
    const z = K.z, on = lit(), pts = archPts(F, tc, tw, h0, h1, z);
    poly(archPts(F, tc, tw, h0, h1, z, 1.1), K.wallCol(frame, F.n));
    poly(pts, on ? '#ffd873' : C('#a8dcff'));
    glowQuad(pts, 16 * z);
    g.strokeStyle = C('#6f8f88'); g.lineWidth = 0.5 * z; g.beginPath();
    const m0 = faceAt(F, tc, h0 * z);                                                                        // Sprossen
    g.moveTo(m0[0], m0[1]); g.lineTo(pts[5][0], pts[5][1]);
    const l = faceAt(F, tc - tw / 2, h1 * z), r = faceAt(F, tc + tw / 2, h1 * z);
    g.moveTo(l[0], l[1]); g.lineTo(r[0], r[1]); g.stroke();
  }

  // -------------------------------------------------------------------------
  // Museum (3×3): Tempel mit Säulen rundherum, Giebel mit Relief, rot-blaue Banner; im Vorhof ein Langhals-Dino-Skelett
  // -------------------------------------------------------------------------
  const SAND = '#e9dcc0', SAND_D = '#d6c6a2', SLATE = '#a0a8b0', BONE = '#f7f1e2', BONE_D = '#d3c8ad';
  function banner(K, p0, p1, col, n) {
    const z = K.z, top = 34, bot = 17, m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    poly([K.P(p0[0], p0[1], top), K.P(p1[0], p1[1], top), K.P(p1[0], p1[1], bot), K.P(m[0], m[1], bot + 3.5), K.P(p0[0], p0[1], bot)], K.wallCol(col, n));
    kLine(K, K.P(p0[0], p0[1], top + 0.5), K.P(p1[0], p1[1], top + 0.5), '#8a6a3a', 0.8);
    const [ex, ey] = K.P(m[0], m[1], 27); circle(ex, ey, 1.9 * z, C(GOLD)); circle(ex, ey, 1 * z, K.wallCol(col, n));
  }
  function museumTemple(K) {
    const z = K.z, A0 = -0.45, HA = 0.9, HB = 1.32, aF = A0 + HA - 0.13, aB = A0 - HA + 0.13, bS = HB - 0.13;
    K.block({ a: A0, b: 0, ha: HA, hb: HB, h: 6, wall: SAND_D, type: 'flat', roof: '#efe5cf' });                     // Sockel
    const parts = [[A0 - 0.08, 0, () => {                                                                            // Innenraum
      const B = K.block({ a: A0 - 0.08, b: 0, ha: HA - 0.38, hb: HB - 0.36, h: 30, lift: 6, wall: '#e0d0ac', type: 'none' });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.4, 0.6, 0, 22 * z, K.wallCol(GOLD_D, F.n));
        faceQuad(F.P, F.Q, 0.425, 0.575, 0, 16.5 * z, C('#7a4f2a'));
        faceQuad(F.P, F.Q, 0.497, 0.503, 0, 16.5 * z, C('#5a3a20'));
        windowOn(F.P, F.Q, 0.425, 0.575, 17.5 * z, 20.5 * z, z);
        const [hx, hy] = faceAt(F, 0.5, 14 * z); halo(hx, hy, 40 * z);
      }
    }]];
    const bs = i => -bS + i * (2 * bS / 7), as = j => aB + j * (aF - aB) / 4;
    const addCol = (a, b) => parts.push([a, b, () => column(K, a, b, 6, 30)]);
    for (let i = 0; i < 8; i++) { addCol(aF, bs(i)); addCol(aB, bs(i)); }
    for (let j = 1; j < 4; j++) { addCol(as(j), bS); addCol(as(j), -bS); }
    [[1, '#d8434a'], [3, '#3f6fc0'], [5, '#d8434a']].forEach(([i, col]) => {
      const p0 = [aF, bs(i) + 0.07], p1 = [aF, bs(i + 1) - 0.07];
      parts.push([aF, (p0[1] + p1[1]) / 2, () => banner(K, p0, p1, col, [1, 0])]);
    });
    for (const sb of [-1, 1]) [[1, '#3f6fc0'], [2, '#d8434a']].forEach(([j, col]) => {
      const p0 = [as(j) + 0.07, sb * bS], p1 = [as(j + 1) - 0.07, sb * bS];
      parts.push([(p0[0] + p1[0]) / 2, sb * bS, () => banner(K, p0, p1, col, [0, sb])]);
    });
    K.scene(parts);
    // Gebälk und flaches Satteldach; die Giebelseiten (vorn und hinten) bekommen Giebelfeld und Relief
    const ea = HA - 0.05, eb = HB - 0.05, top = 43;
    K.block({ a: A0, b: 0, ha: ea, hb: eb, h: 7, lift: 36, wall: '#f3eada', roof: SLATE, roofH: 18, type: 'gable', ridge: 'a', over: 1.05 });
    for (const sg of [1, -1]) {
      if (K.facing(sg, 0) <= 0.01) continue;
      const a1 = A0 + sg * ea, n = [sg, 0];
      poly([K.P(a1, -eb * 0.8, top + 1.8), K.P(a1, eb * 0.8, top + 1.8), K.P(a1, 0, top + 14)], K.wallCol('#d8c7a1', n));
      const [mx, my] = K.P(a1, 0, top + 6.5); circle(mx, my, 3.2 * z, C(GOLD_D)); circle(mx, my, 2.1 * z, C('#f6dc8a'));
      for (const [ab, up] of [[0, top + 18.6], [-eb * 1.02, top + 0.8], [eb * 1.02, top + 0.8]]) { const [tx, ty] = K.P(a1, ab, up); circle(tx, ty, 1.6 * z, C(GOLD)); }
    }
  }
  function museumStairs(K) {
    for (let i = 0; i < 3; i++) {
      const d = (3 - i) * 0.12;
      K.block({ a: 0.45 + d / 2, b: 0, ha: d / 2, hb: 1.32, h: 2 * (i + 1), wall: i & 1 ? '#e2d4b6' : '#d6c6a2', type: 'flat', roof: '#f1e8d4' });
    }
  }
  // Langhals-Skelett (Profil, zeigt zur Mitte des Grundstücks), auf einem Steinsockel
  function dino(K, a, b) {
    K.block({ a, b, ha: 0.26, hb: 0.36, h: 4, wall: '#8e97a3', type: 'flat', roof: '#b5bdc7' });
    const [cx0] = K.P(0, 0), [x0, y0] = K.P(a, b, 4), z = K.z * 1.2, d = x0 > cx0 + 1 ? -1 : 1;           // etwas größer als echt
    const X = dx => x0 + dx * d * z, Y = up => y0 - up * z, pt = (dx, up) => [X(dx), Y(up)];
    const bez = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
    kLine(K, pt(1, 0), pt(1, 16), '#6b7480', 0.8);                                                          // Stützen
    kLine(K, pt(13, 0), pt(13, 30), '#6b7480', 0.8);
    const hip = pt(-7, 19), tail = [pt(-21, 20), pt(-33, 5)], sh = pt(9, 21), sp = [hip, pt(1, 25), sh], neck = [sh, pt(22, 31), pt(19.5, 58)];
    // erst alles als dunkle Umrisslinie, dann die Knochen darüber – so hebt sich das Skelett vom hellen Pflaster ab
    for (const pass of [0, 1]) {
      const o = pass ? 0 : 1, col = c => C(pass ? c : '#9a8d74');
      const curve = (p0, p1, p2, c, w) => { g.strokeStyle = col(c); g.lineWidth = (w + o) * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...p1, ...p2); g.stroke(); };
      const line = (p, q, c, w) => { g.strokeStyle = col(c); g.lineWidth = (w + o) * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); };
      const dot = (x, y, r, c) => circle(x, y, r + o * 0.5 * z, col(c));
      const oval = (x, y, rx, ry, c) => ellipse(x, y, rx + o * 0.5 * z, ry + o * 0.5 * z, col(c));
      const leg = (hx, hy, kx, fx, c) => { line(pt(hx, hy), pt(kx, 8), c, 2.2); line(pt(kx, 8), pt(fx, 0.8), c, 1.8); oval(X(fx + 0.8), Y(0.6), 1.7 * z, 0.8 * z, c); };
      leg(-5, 18, -6.5, -4.5, BONE_D); leg(10, 19, 11, 10, BONE_D);                                            // ferne Beine
      curve(hip, tail[0], tail[1], BONE, 1.5);                                                                 // Schwanz
      for (let i = 1; i <= 6; i++) { const [px, py] = bez(hip, tail[0], tail[1], i / 6); dot(px, py, (1.9 - i * 0.2) * z, BONE); }
      for (let i = 0; i < 6; i++) {                                                                            // Rippen
        const t = 0.14 + i * 0.145, [px, py] = bez(...sp, t), len = 11 - Math.abs(t - 0.5) * 9;
        curve([px, py], [px + 2.8 * d * z, py + len * 0.55 * z], [px + 0.4 * d * z, py + len * z], i & 1 ? BONE : BONE_D, 1.3);
      }
      curve(...sp, BONE, 2.5);                                                                                 // Rückgrat
      oval(X(-7), Y(18), 3.5 * z, 2.5 * z, BONE);                                                              // Becken
      oval(X(8), Y(18), 2.2 * z, 3.2 * z, BONE);                                                               // Schulter
      curve(...neck, BONE, 2);                                                                                 // Hals
      for (let i = 1; i <= 7; i++) { const [px, py] = bez(...neck, i / 7); dot(px, py, (2.4 - i * 0.14) * z, i & 1 ? BONE : '#efe8d6'); }
      oval(X(21.5), Y(59.6), 4.2 * z, 2.6 * z, BONE);                                                          // Kopf
      oval(X(25.2), Y(58.6), 2.8 * z, 1.7 * z, BONE);
      leg(-9, 17, -7.8, -9.8, BONE); leg(7, 19, 8.3, 6.6, BONE);                                               // nahe Beine
    }
    circle(X(20.8), Y(60.3), 1 * z, C('#6f6553'));
    kLine(K, pt(19, 58), pt(26.8, 57.9), '#a89c82', 0.5);
    halo(X(8), Y(30), 36 * z);
  }
  SHOP_ART.museum = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-1.47, -1.47, 1.47, 1.47, C('#e4d8bf'));                                                          // Pflaster
      K.rect(0.8, -0.36, 1.47, 0.36, C('#d6c7a8'));                                                            // Weg zur Treppe
      for (const a of [1.06, 1.3]) K.rect(a, -1.47, a + 0.014, 1.47, C('#d2c3a3'));
      for (let i = -3; i <= 3; i++) K.rect(0.8, i * 0.4 - 0.007, 1.47, i * 0.4 + 0.007, C('#d2c3a3'));
      K.rect(0.92, 0.5, 1.42, 1.42, C('#9fd07a'));                                                             // Rasen
      K.rect(0.97, 0.55, 1.37, 1.37, C('#a8d983'));
    })) return;
    const parts = [
      [-0.45, 0, () => museumTemple(K)],
      [0.63, 0, () => museumStairs(K)],
      [1.02, -0.92, () => dino(K, 1.02, -0.92)],
      [1.15, 0.8, () => kitBush(K, 1.15, 0.8, 0.85, '#58ad52')],
      [1.2, 1.18, () => kitBush(K, 1.2, 1.18, 0.6, '#4f9e4a')],
    ];
    for (const sb of [-1, 1]) parts.push([1.25, sb * 0.42, () => { const [lx, ly] = K.P(1.25, sb * 0.42); lampPost(lx, ly, K.z, 15); }]);
    K.scene(parts);
  };
  GROUND_TYPES.add('museum');

  // -------------------------------------------------------------------------
  // Hotel (2×2): hohes cremefarbenes Haus, blaues Mansarddach, Balkone mit Blumen; senkrechtes Leuchtschild H-O-T-E-L
  // an der sichtbaren vorderen Ecke, darüber drei goldene Sterne; Vordach, roter Teppich, Fahnen
  // -------------------------------------------------------------------------
  const H_WALL = '#fff6e4', H_BLUE = '#3e6fb0', H_BASE = '#ecdcbf';
  function balcony(F, t0, t1, up, z) {
    faceQuad(F.P, F.Q, t0, t1, up - 1.3 * z, up, C('#d6c8ae'));
    g.strokeStyle = C(H_BLUE); g.lineWidth = 0.55 * z; g.lineCap = 'round'; g.beginPath();
    for (let k = 0; k <= 4; k++) { const p = faceAt(F, t0 + (t1 - t0) * k / 4, up); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 3.6 * z); }
    const l = faceAt(F, t0, up + 3.6 * z), r = faceAt(F, t1, up + 3.6 * z); g.moveTo(l[0], l[1]); g.lineTo(r[0], r[1]); g.stroke();
    for (let k = 0; k < 3; k++) {
      const p = faceAt(F, t0 + (t1 - t0) * (0.2 + k * 0.3), up + 4.2 * z);
      circle(p[0], p[1] + 0.6 * z, 1.3 * z, C('#5aa651'));
      circle(p[0], p[1] - 0.2 * z, 1 * z, C(['#ff6b8a', '#ffffff', '#ff9fb8'][k]));
    }
  }
  function topiary(K, a, b) {
    const [px, py] = K.P(a, b), z = K.z;
    poly([[px - 2.4 * z, py - 4 * z], [px + 2.4 * z, py - 4 * z], [px + 1.7 * z, py], [px - 1.7 * z, py]], C('#c77b55'));
    circle(px, py - 7.6 * z, 3.4 * z, C('#4f9e4a')); circle(px - 1 * z, py - 8.6 * z, 1.7 * z, C('#6fbf5f'));
  }
  function hotelSign(K, ca, cb, sa, sb) {
    const z = K.z, on = lit(), [x, yg] = K.P(sa, sb), y0 = yg - 22 * z, y1 = yg - 72 * z, w = 5.4 * z;
    kLine(K, K.P(ca, cb, 25), [x, y0 - 3 * z], '#6b7280', 0.9);                                             // Halter
    kLine(K, K.P(ca, cb, 67), [x, y1 + 3 * z], '#6b7280', 0.9);
    g.fillStyle = C('#e2ae3a'); g.beginPath(); g.roundRect(x - w - 1.3 * z, y1 - 1.3 * z, 2 * w + 2.6 * z, y0 - y1 + 2.6 * z, 2.4 * z); g.fill();
    g.fillStyle = C(on ? '#1f2f5c' : H_BLUE); g.beginPath(); g.roundRect(x - w, y1, 2 * w, y0 - y1, 1.8 * z); g.fill();
    if (on) halo(x, (y0 + y1) / 2, 34 * z);
    'HOTEL'.split('').forEach((ch, i) => glowText(x, y1 + (i + 0.56) * (y0 - y1) / 5, ch, 8.6, on ? '#fff3a8' : '#ffffff', z));
    if (on) for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) {                                            // nachts Glühbirnchen am Rahmen
      const bx = x + sx * (w + 0.65 * z), by = y1 + (k + 0.5) * (y0 - y1) / 6;
      circle(bx, by, 0.55 * z, '#fff6c8'); bulb(bx, by, z);
    }
    [-1, 0, 1].forEach(k => star(x + k * 6.6 * z, y1 - (k ? 5.4 : 8.2) * z, 3.1 * z, z));
  }
  SHOP_ART.hotel = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(0.5, -0.97, 0.98, 0.97, C('#e7ddcb'));                                                          // Vorplatz
      K.rect(0.5, -0.17, 0.98, 0.17, C('#e3c56b'));                                                          // Teppich mit Goldrand
      K.rect(0.5, -0.14, 0.98, 0.14, C('#c8323c'));
    })) return;
    const A0 = -0.2, HA = 0.7, HB = 0.78, H = 64;
    const parts = [[A0, 0, () => {
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: H_WALL, roof: H_BLUE, roofH: 13, type: 'mansard', over: 1.05, entry: true });
      for (const F of Object.values(B.faces)) if (F) {
        faceQuad(F.P, F.Q, 0, 1, 1.6 * z, 15 * z, K.wallCol(H_BASE, F.n));                                   // Erdgeschoss
        faceQuad(F.P, F.Q, 0, 1, 14.4 * z, 15.8 * z, K.wallCol(H_BLUE, F.n));                                // Gesims
      }
      const F = B.faces.front;
      if (F) {
        windowOn(F.P, F.Q, 0.07, 0.35, 3 * z, 12 * z, z); windowOn(F.P, F.Q, 0.65, 0.93, 3 * z, 12 * z, z);   // Lobby
        faceQuad(F.P, F.Q, 0.41, 0.59, 0, 13 * z, K.wallCol(GOLD_D, F.n));
        windowOn(F.P, F.Q, 0.435, 0.565, 0, 11.5 * z, z);
        faceQuad(F.P, F.Q, 0.497, 0.503, 0, 11.5 * z, C('#8a6a3a'));
      }
      for (const sd of ['right', 'left', 'back']) K.wins(B, sd, 3, 3 / H, 12 / H);
      for (let f = 0; f < 4; f++) {                                                                        // vier Obergeschosse
        const base = 15.8 + f * 12;
        if (F) for (let i = 0; i < 4; i++) {
          const t0 = 0.08 + 0.21 * (i + 0.16), t1 = 0.08 + 0.21 * (i + 0.84);
          windowOn(F.P, F.Q, t0, t1, (base + 3) * z, (base + 10) * z, z);
          if (i === 1 || i === 2) balcony(F, t0 - 0.025, t1 + 0.025, (base + 2.6) * z, z);
          else flowerBox(F.P, F.Q, t0, t1, (base + 3) * z, z);
        }
        K.sideWins(B, 3, (base + 3) / H, (base + 10) / H, f & 1);
      }
    }]];
    parts.push([0.66, 0, () => {                                                                           // Vordach
      const z = K.z;
      for (const sb of [-1, 1]) kPost(K, 0.82, sb * 0.21, 13, GOLD_D, 0.9);
      K.block({ a: 0.66, b: 0, ha: 0.17, hb: 0.25, h: 2.6, lift: 13, wall: H_BLUE, type: 'flat', roof: '#5b8ad0', trim: GOLD });
      const [lx, ly] = K.P(0.8, 0, 12.4); circle(lx, ly, 0.9 * z, lit() ? '#fff6c8' : C('#fff2c0')); kGlow(lx, ly, z, 22);
    }]);
    for (const sb of [-1, 1]) {
      parts.push([0.68, sb * 0.38, () => topiary(K, 0.68, sb * 0.38)]);
      parts.push([0.88, sb * 0.84, () => kFlag(K, 0.88, sb * 0.84, 22, sb < 0 ? H_BLUE : '#d8434a')]);
    }
    // Leuchtschild an der vorderen Ecke, die man am besten sieht (auch wenn die Tür nach hinten zeigt)
    const [ca, cb] = [[A0 + HA, HB], [A0 + HA, -HB]].reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);
    const sa = ca + 0.1, sb2 = cb + Math.sign(cb) * 0.1;
    parts.push([sa, sb2, () => hotelSign(K, ca, cb, sa, sb2)]);
    K.scene(parts);
  };
  GROUND_TYPES.add('hotel');

  // -------------------------------------------------------------------------
  // Grand Hotel (3×3): Palast in Creme mit grün-kupfernen Dächern, zwei Ecktürme mit Kuppeln, Säulen-Portikus,
  // roter Teppich, zwei Springbrunnen; auf dem Dach der goldene Schriftzug GRAND HOTEL mit fünf Sternen
  // -------------------------------------------------------------------------
  const G_WALL = '#f5f0e6', G_ROOF = '#7fa39a', G_TRIM = '#e9c46a';
  function fountain(K, a, b, now) {
    const [x, y] = K.P(a, b), z = K.z, rx = 0.2 * Math.SQRT2 * TW / 2 * z, ry = rx / 2, hh = 3.5 * z;
    ellipse(x, y, rx, ry, C('#b9b0a0'));
    g.fillStyle = C('#d9d1c1'); g.fillRect(x - rx, y - hh, 2 * rx, hh);
    ellipse(x, y - hh, rx, ry, C('#efe8da'));
    ellipse(x, y - hh, rx * 0.84, ry * 0.78, C('#7fc9e6'));
    g.fillStyle = C('#e6dfd0'); g.fillRect(x - 1 * z, y - hh - 8 * z, 2 * z, 8 * z);
    ellipse(x, y - hh - 8 * z, 4 * z, 1.6 * z, C('#efe8da')); ellipse(x, y - hh - 8.3 * z, 3.1 * z, 1.1 * z, C('#9ad6ee'));
    const top = y - hh - 16 * z;
    g.strokeStyle = 'rgba(235,250,255,0.9)'; g.lineWidth = 0.9 * z; g.lineCap = 'round'; g.beginPath();
    g.moveTo(x, y - hh - 8 * z); g.lineTo(x, top);
    for (const s of [-1, 1]) { g.moveTo(x, top); g.quadraticCurveTo(x + s * 5 * z, top - 1.5 * z, x + s * 7.5 * z, y - hh - 1 * z); }
    g.stroke();
    for (let i = 0; i < 4; i++) { const ph = (now / 700 + i / 4) % 1, s = i & 1 ? 1 : -1; circle(x + s * (1 + ph * 6) * z, top + ph * ph * 14 * z, 0.7 * z, 'rgba(235,250,255,0.9)'); }
  }
  function grandSign(K, a, b, up) {
    const z = K.z, on = lit(), [x, yb] = K.P(a, b, up), w = 33 * z, h = 12.5 * z;
    for (const sx of [-1, 1]) kLine(K, [x + sx * 22 * z, yb + 5 * z], [x + sx * 22 * z, yb], '#6b7280', 1);
    g.fillStyle = C('#c9a24a'); g.beginPath(); g.roundRect(x - w - 1.3 * z, yb - h - 1.3 * z, 2 * w + 2.6 * z, h + 2.6 * z, 2.4 * z); g.fill();
    g.fillStyle = C(on ? '#1f3f3a' : '#2d5a52'); g.beginPath(); g.roundRect(x - w, yb - h, 2 * w, h, 1.8 * z); g.fill();
    if (on) halo(x, yb - h / 2, 46 * z);
    glowText(x, yb - h / 2 + 0.4 * z, 'GRAND HOTEL', 7.4, on ? '#fff3a8' : '#f6c945', z);
    if (on) for (let k = 0; k < 7; k++) { const bx = x - w + (k + 0.5) * (2 * w) / 7; for (const by of [yb - h - 0.65 * z, yb + 0.65 * z]) { circle(bx, by, 0.5 * z, '#fff6c8'); bulb(bx, by, z); } }
    for (let k = 0; k < 5; k++) star(x + (k - 2) * 8.5 * z, yb - h - (6 + (2 - Math.abs(k - 2)) * 1.6) * z, 3.1 * z, z);
  }
  SHOP_ART.grandhotel = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(0.4, -1.47, 1.47, 1.47, C('#ebe2cf'));                                                          // Vorhof (Kies)
      for (const sb of [-1, 1]) { K.oval(1.02, sb * 0.86, 0.36, C('#9fd07a')); K.oval(1.02, sb * 0.86, 0.3, C('#a8d983')); }
      K.rect(0.6, -0.17, 1.47, 0.17, C('#e3c56b'));                                                          // roter Teppich
      K.rect(0.6, -0.14, 1.47, 0.14, C('#c8323c'));
    })) return;
    const A0 = -0.45, HA = 0.85, HB = 0.8, H = 48, parts = [];
    parts.push([A0, 0, () => {                                                                             // Hauptbau
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: G_WALL, roof: G_ROOF, roofH: 14, type: 'mansard', over: 1.025, trim: G_TRIM });
      for (let f = 0; f < 5; f++) {
        const h0 = (f * 9.4 + 2.4) / H, h1 = (f * 9.4 + 7.6) / H;
        K.wins(B, 'front', 6, h0, h1, 0.06, 0.94, f === 0 ? [2, 3] : []);
        K.sideWins(B, 5, h0, h1);
      }
      for (const F of Object.values(B.faces)) if (F) {
        faceQuad(F.P, F.Q, 0, 1, 9.4 * z, 10.8 * z, K.wallCol('#e2d6bf', F.n));                              // Gesims
        faceQuad(F.P, F.Q, 0.03, 0.97, 20.9 * z, 22.6 * z, K.wallCol(G_TRIM, F.n));                           // durchgehender Balkon
      }
      K.door(B, 'front', 0.44, 0.56, 0.16, '#6b4a2e');
      const ea = HA * 1.025 * 0.84, eb = HB * 1.025 * 0.84, on = lit();                               // Gauben im Mansarddach
      for (const [n, cnt] of [[[1, 0], 4], [[-1, 0], 4], [[0, 1], 4], [[0, -1], 4]]) {
        if (K.facing(...n) <= 0.01) continue;
        for (let i = 0; i < cnt; i++) {
          const u = (i - (cnt - 1) / 2) / ((cnt - 1) / 2) * 0.72, w = 0.075;
          const pt = (off, up) => n[0] ? K.P(A0 + n[0] * ea, u * HB + off, up) : K.P(A0 + u * HA + off, n[1] * eb, up);
          poly([pt(-w, 49), pt(w, 49), pt(w, 55), pt(-w, 55)], K.wallCol(G_WALL, n));
          const win = [pt(-w * 0.6, 50), pt(w * 0.6, 50), pt(w * 0.6, 54), pt(-w * 0.6, 54)];
          poly(win, on ? '#ffd873' : C('#a8dcff')); glowQuad(win, 10 * z);
          poly([pt(-w * 1.25, 54.6), pt(w * 1.25, 54.6), pt(0, 58.4)], K.wallCol(G_ROOF, n));
        }
      }
    }]);
    parts.push([A0, 0, () => grandSign(K, -0.05, 0, 63)]);                                                 // Schriftzug auf dem Dach
    for (const sb of [-1, 1]) parts.push([0.1, sb * 1.12, () => {                                           // Ecktürme mit Kuppel
      const z = K.z, Bt = K.block({ a: 0.1, b: sb * 1.12, ha: 0.36, hb: 0.3, h: 60, wall: G_WALL, roof: '#ece5d6', type: 'flat', trim: G_TRIM });
      for (let f = 0; f < 5; f++) { const h0 = (f * 11.4 + 3) / 60, h1 = (f * 11.4 + 9) / 60; K.wins(Bt, 'front', 2, h0, h1); K.sideWins(Bt, 2, h0, h1); }
      K.block({ a: 0.1, b: sb * 1.12, ha: 0.25, hb: 0.21, h: 4, lift: 60, wall: '#e2d6bf', type: 'flat', roof: G_ROOF });
      const [dx, dy] = kDome(K, 0.1, sb * 1.12, 64, 13, G_ROOF);
      kLine(K, [dx, dy], [dx, dy - 7 * z], GOLD_D, 1); circle(dx, dy - 7.6 * z, 1.6 * z, C(GOLD));
    }]);
    parts.push([0.56, 0, () => {                                                                           // Portikus
      const z = K.z;
      K.block({ a: 0.57, b: 0, ha: 0.21, hb: 0.47, h: 2.5, wall: '#ddd3bf', type: 'flat', roof: '#f1ebdf' });
      K.scene([-0.36, -0.12, 0.12, 0.36].map(cb => [0.69, cb, () => column(K, 0.69, cb, 2.5, 23.5, '#fffdf7', 1.7)]));
      const R = K.block({ a: 0.56, b: 0, ha: 0.19, hb: 0.45, h: 4, lift: 26, wall: G_WALL, roof: G_ROOF, roofH: 10, type: 'gable', ridge: 'a', over: 1.06, trim: G_TRIM });
      if (R.faces.front) { const [mx, my] = K.P(0.75, 0, 33.5); circle(mx, my, 2.4 * z, C(GOLD_D)); circle(mx, my, 1.5 * z, C('#f6dc8a')); }
      for (const cb of [-0.2, 0.2]) { const [lx, ly] = K.P(0.72, cb, 18); kGlow(lx, ly, z, 18); }
    }]);
    for (const sb of [-1, 1]) {
      parts.push([1.02, sb * 0.86, () => fountain(K, 1.02, sb * 0.86, now)]);
      parts.push([1.2, sb * 0.3, () => { const [lx, ly] = K.P(1.2, sb * 0.3); lampPost(lx, ly, K.z, 16); }]);
    }
    K.scene(parts);
  };
  GROUND_TYPES.add('grandhotel');

  // -------------------------------------------------------------------------
  // Markthalle (2×3): Backsteinsockel mit Bogenfenstern, großes Glas-Tonnendach mit grün-kupfernen Rippen, Dachlaterne;
  // vorn ein Portal mit Eingangsbogen, Schriftzug MARKT und Uhrtürmchen (Uhr auf jeder Seite); davor zwei Marktstände
  // -------------------------------------------------------------------------
  const BRICK = '#b8664a', COPPER = '#7fa39a', GLASS = '#cfe8ea', STONE_L = '#efe0c8';
  function glassBarrel(K, a, b, R, L, ha, hb, top, roofH, ribs) {
    const z = K.z, N = 10;
    const pt = (s, th, r = R) => K.P(a + Math.cos(th) * r, b + s, top + Math.sin(th) * roofH * r / R);
    const strips = [];
    for (let i = 0; i < N; i++) {
      const t0 = Math.PI * i / N, t1 = Math.PI * (i + 1) / N, c = Math.cos((t0 + t1) / 2), [u, v] = K.turn(c, 0);
      strips.push([K.facing(c, 0), t0, t1, (u < 0 ? -u * LIGHT.roofSun : u * LIGHT.roofShade) + (v < 0 ? -v * LIGHT.roofBack : 0)]);
    }
    strips.sort((p, q) => p[0] - q[0]);
    for (const [, t0, t1, amt] of strips) {
      poly([pt(-L, t0), pt(L, t0), pt(L, t1), pt(-L, t1)], C(shade(GLASS, amt)));
      const mid = (t0 + t1) / 2;
      if (mid > 0.9 && mid < 1.6) { const q0 = pt(-L * 0.7, mid), q1 = pt(-L * 0.35, mid); kLine(K, q0, q1, '#ffffff', 0.9); }   // Glanz
      g.strokeStyle = C(shade(COPPER, amt * 0.6 - 0.05)); g.lineWidth = 1 * z; g.lineCap = 'round'; g.beginPath();
      for (let j = 0; j <= ribs; j++) { const s = -L + 2 * L * j / ribs, p0 = pt(s, t0), p1 = pt(s, t1); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
      g.stroke();
      g.lineWidth = 0.5 * z; g.beginPath();
      const e0 = pt(-L, t0), e1 = pt(L, t0); g.moveTo(e0[0], e0[1]); g.lineTo(e1[0], e1[1]); g.stroke();
    }
    for (const sg of [1, -1]) {                                                                           // Fächerfenster an den Enden
      if (K.facing(0, sg) <= 0.01) continue;
      const bs = b + sg * hb, rr = ha * 0.98, n = [0, sg];
      const Q = (th, r) => K.P(a + Math.cos(th) * r, bs, top + Math.sin(th) * roofH * r / R);
      const arc = r => { const out = []; for (let i = 0; i <= 12; i++) out.push(Q(Math.PI * i / 12, r)); return out; };
      poly(arc(rr), K.wallCol(COPPER, n));
      const gl = arc(rr * 0.88);
      poly(gl, lit() ? '#ffd873' : K.wallCol(GLASS, n));
      glowQuad([Q(0, rr * 0.88), Q(Math.PI / 3, rr * 0.88), Q(2 * Math.PI / 3, rr * 0.88), Q(Math.PI, rr * 0.88)], 20 * z);
      g.strokeStyle = C(COPPER); g.lineWidth = 0.8 * z; g.beginPath();
      const c0 = Q(0, 0);
      for (let k = 1; k < 6; k++) { const p = Q(Math.PI * k / 6, rr * 0.88); g.moveTo(c0[0], c0[1]); g.lineTo(p[0], p[1]); }
      arc(rr * 0.45).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
      g.stroke();
    }
  }
  // Uhr in einer Wandfläche (schräg wie die Wand), Zeiger auf zehn nach zehn
  function clockOn(F, up, r, z) {
    const L = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]) || 1, rt = r * 0.95 / L;
    const at = (w, k) => faceAt(F, 0.5 + Math.sin(w) * rt * k, up + Math.cos(w) * r * k);
    const ring = k => { const out = []; for (let i = 0; i < 16; i++) out.push(at(i / 16 * Math.PI * 2, k)); return out; };
    poly(ring(1.22), C(GOLD_D)); poly(ring(1), lit() ? '#fff6d0' : C('#fffaf0'));
    for (let k = 0; k < 4; k++) { const p = at(k * Math.PI / 2, 0.78); circle(p[0], p[1], 0.45 * z, C('#3e3e4a')); }
    const c = at(0, 0), hr = at(-Math.PI / 3, 0.5), mn = at(Math.PI / 3, 0.8);
    g.strokeStyle = C('#3e3e4a'); g.lineCap = 'round'; g.lineWidth = 0.8 * z; g.beginPath();
    g.moveTo(c[0], c[1]); g.lineTo(hr[0], hr[1]); g.moveTo(c[0], c[1]); g.lineTo(mn[0], mn[1]); g.stroke();
  }
  function marketStall(K, a, b, col, i) {
    const z = K.z, ha = 0.12, hb = 0.26, af = a + ha + 0.08, parts = [];
    for (const [pa, pb, hh] of [[a - ha, b - hb, 17], [a - ha, b + hb, 17], [af, b - hb, 13], [af, b + hb, 13]]) parts.push([pa, pb, () => kPost(K, pa, pb, hh, '#8a5a3c', 0.9)]);
    parts.push([a, b, () => {
      K.block({ a, b, ha, hb, h: 6, wall: '#c98d5c', type: 'flat', roof: '#e8c08a' });
      for (let j = 0; j < 5; j++) { const [px, py] = K.P(a + 0.02, b - hb + 0.07 + j * 0.095, 6); circle(px, py - 1.1 * z, 1.6 * z, C(FRUIT[(i + j) % 5])); }
    }]);
    K.scene(parts);
    const n = 6, w = (2 * hb + 0.08) / n;
    for (let k = 0; k < n; k++) {
      const b0 = b - hb - 0.04 + k * w, b1 = b0 + w;
      poly([K.P(a - ha, b0, 17), K.P(a - ha, b1, 17), K.P(af, b1, 13), K.P(af, b0, 13)], C(k & 1 ? '#fffaf0' : col));
    }
    for (let k = 0; k < n; k++) { const [fx, fy] = K.P(af, b - hb - 0.04 + (k + 0.5) * w, 13); ellipse(fx, fy, 2.3 * z, 1.4 * z, C(k & 1 ? '#fffaf0' : col)); }
  }
  function produceCrate(K, a, b, col, fruit) {
    kCrate(K, a, b, col);
    const [px, py] = K.P(a, b, 4.5), z = K.z;
    for (const [dx, dy] of [[-1.6, 0], [1.6, 0], [0, -0.9], [0, 0.9]]) circle(px + dx * z, py + dy * z - 0.8 * z, 1.3 * z, C(fruit));
  }
  SHOP_ART.markthalle = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-0.98, -1.47, 0.98, 1.47, C('#ddd1b9'));                                                        // Marktplatz
      for (const a of [0.56, 0.72, 0.88]) K.rect(a, -1.47, a + 0.012, 1.47, C('#cbbd9f'));
      for (let i = -4; i <= 4; i++) K.rect(0.44, i * 0.32 - 0.006, 0.98, i * 0.32 + 0.006, C('#cbbd9f'));
    })) return;
    const A0 = -0.28, HA = 0.68, HB = 1.32, H = 20, parts = [];
    parts.push([A0, 0, () => {                                                                             // Halle
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: BRICK, type: 'none', trim: STONE_L });
      for (const F of Object.values(B.faces)) if (F) for (const up of [5.5, 10.5, 15.5]) faceQuad(F.P, F.Q, 0, 1, up * z, (up + 0.45) * z, K.wallCol('#a4573d', F.n));
      if (B.faces.front) for (const tc of [0.07, 0.17, 0.27, 0.73, 0.83, 0.93]) archWin(K, B.faces.front, tc, 0.064, 3, 12);
      if (B.faces.back) for (let i = 0; i < 8; i++) archWin(K, B.faces.back, 0.07 + i * 0.123, 0.064, 3, 12);
      for (const sd of ['right', 'left']) if (B.faces[sd]) for (const tc of [0.22, 0.5, 0.78]) archWin(K, B.faces[sd], tc, 0.14, 3, 12);
      glassBarrel(K, A0, 0, HA * 1.05, HB * 1.02, HA, HB, H, 24, 9);
      K.block({ a: A0, b: 0, ha: 0.09, hb: HB * 0.75, h: 4, lift: H + 22.5, wall: '#d7eef0', roof: '#9cbdb4', roofH: 3.5, type: 'gable', ridge: 'b' });
      const [hx, hy] = K.P(A0, 0, H + 12); halo(hx, hy, 60 * z);
    }]);
    parts.push([0.5, 0, () => {                                                                            // Portal
      const z = K.z, B = K.block({ a: 0.5, b: 0, ha: 0.16, hb: 0.42, h: 32, wall: BRICK, roof: COPPER, roofH: 12, type: 'barrel', ridge: 'a', trim: STONE_L });
      const F = B.faces.front;
      if (F) {
        poly(archPts(F, 0.5, 0.5, 0, 13, z, 1.6), K.wallCol(STONE_L, F.n));
        poly(archPts(F, 0.5, 0.5, 0, 13, z), C('#5b3a2a'));
        const gl = archPts(F, 0.5, 0.36, 9.5, 13, z);
        poly(gl, lit() ? '#ffd873' : C('#a8dcff')); glowQuad(gl, 16 * z);
        faceQuad(F.P, F.Q, 0.07, 0.93, 20 * z, 27.5 * z, K.wallCol(STONE_L, F.n));
        const [mx, my] = faceAt(F, 0.5, 23.8 * z); halo(mx, my, 24 * z); glowText(mx, my, 'MARKT', 5.4, lit() ? '#fff3a8' : '#2f5d55', z);
        const R = 0.42 * 1.12, Q = (th, r) => K.P(0.66, Math.cos(th) * r, 32 + Math.sin(th) * 12 * r / R), fan = [];
        for (let i = 0; i <= 10; i++) fan.push(Q(Math.PI * i / 10, 0.3));
        poly(fan, lit() ? '#ffd873' : K.wallCol(GLASS, F.n)); glowQuad([Q(0, 0.3), Q(1, 0.3), Q(2.1, 0.3), Q(Math.PI, 0.3)], 14 * z);
        g.strokeStyle = C(COPPER); g.lineWidth = 0.7 * z; g.beginPath();
        const c0 = Q(0, 0); for (let k = 1; k < 4; k++) { const p = Q(Math.PI * k / 4, 0.3); g.moveTo(c0[0], c0[1]); g.lineTo(p[0], p[1]); } g.stroke();
      }
      for (const sd of ['right', 'left']) if (B.faces[sd]) archWin(K, B.faces[sd], 0.5, 0.36, 12, 22);
    }]);
    parts.push([0.5, 0, () => {                                                                            // Uhrtürmchen
      const z = K.z, Bt = K.block({ a: 0.5, b: 0, ha: 0.15, hb: 0.15, h: 12, lift: 40, wall: STONE_L, roof: COPPER, roofH: 9, type: 'hip' });
      for (const F of Object.values(Bt.faces)) if (F) clockOn(F, F.H * 0.5, 3.9 * z, z);
      const [tx, ty] = Bt.peak; kLine(K, [tx, ty], [tx, ty - 4 * z], GOLD_D, 0.8); circle(tx, ty - 4.6 * z, 1.3 * z, C(GOLD));
      halo(tx, ty + 12 * z, 22 * z);
    }]);
    [[-0.96, '#e8604f', 0], [0.96, '#f2b33d', 2]].forEach(([sb, col, i]) => {
      parts.push([0.72, sb, () => marketStall(K, 0.72, sb, col, i)]);
      parts.push([0.93, sb - 0.13, () => produceCrate(K, 0.93, sb - 0.13, '#c9955f', i ? '#7ccf5b' : '#ff9f5a')]);
      parts.push([0.93, sb + 0.13, () => produceCrate(K, 0.93, sb + 0.13, '#d9b27a', i ? '#ffd23f' : '#ff6b5e')]);
    });
    K.scene(parts);
  };
  GROUND_TYPES.add('markthalle');
})();
