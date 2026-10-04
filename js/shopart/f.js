'use strict';
// Ladenbilder, Gruppe f (Block 32, angeglichen in Block 35) – trägt sich in SHOP_ART ein (siehe draw-shops.js: faceAt).
// Die großen Häuser in der Formensprache der alten Gebäude (helle warme Wände, klare Dachfarben, große ruhige Flächen,
// keine Schrift): Museum (kleiner Tempel mit Säulenhalle und Giebel, Dino-Skelett im Vorhof), Hotel (Kurhotel mit
// Mittelrisalit, Balkon und Sterne-Tafel), Grand Hotel (Palast mit zwei Kuppeltürmen und Säulen-Portikus),
// Markthalle (lange Glashalle mit Eingangsportal und Uhr, zwei Stände davor).
// Alles im Baukasten (vorn = +a); Schatten über ART_SHADOW (render.js).
(function () {
  const lit = () => night > 0.15 && isLive();
  // Lichtschein ohne Loch (nachts)
  const halo = (x, y, r) => glowQuad([[x, y], [x, y], [x, y], [x, y]], r);
  const WHITE = '#fffaf0', CREAM = '#fff4dc';

  // Goldener Stern mit dunklem Rand; r in Bildpunkten (schon × z)
  function star(x, y, r, z) {
    const pts = rr => { const out = []; for (let i = 0; i < 10; i++) { const w = -Math.PI / 2 + i * Math.PI / 5, k = i & 1 ? 0.46 : 1; out.push([x + Math.cos(w) * rr * k, y + Math.sin(w) * rr * k]); } return out; };
    poly(pts(r + 0.8 * z), C('#b8862a'));
    poly(pts(r), C('#f6c945'));
  }
  // Runde Säule (Fuß, Schaft mit Schattenseite, Kapitell) ab Höhe up0, h px hoch
  function column(K, a, b, up0, h, col = WHITE, w = 2) {
    const [x, y] = K.P(a, b, up0), z = K.z, hw = w * z, top = y - h * z;
    ellipse(x, y, hw * 1.45, hw * 0.65, C(shade(col, -0.16)));
    g.fillStyle = C(col); g.fillRect(x - hw, top, hw * 2, h * z);
    g.fillStyle = C(shade(col, -0.14)); g.fillRect(x + hw * 0.2, top, hw * 0.8, h * z);
    g.fillStyle = C(shade(col, -0.04)); g.fillRect(x - hw * 1.5, top - 1.4 * z, hw * 3, 1.6 * z);
  }
  // Bogen auf einer Seite: Mitte tc und Breite tw (Anteil der Seite), Rechteck von h0 bis h1 (px), oben rund
  function archPts(F, tc, tw, h0, h1, z, grow = 0) {
    const L = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]) || 1, gt = grow * z / L, t0 = tc - tw / 2 - gt, t1 = tc + tw / 2 + gt;
    const rise = (t1 - t0) * L * 0.55, pts = [faceAt(F, t0, (h0 - grow) * z)];
    for (let i = 0; i <= 8; i++) { const w = Math.PI * i / 8; pts.push(faceAt(F, tc - Math.cos(w) * (t1 - t0) / 2, h1 * z + Math.sin(w) * rise)); }
    pts.push(faceAt(F, t1, (h0 - grow) * z));
    return pts;
  }
  // Bogenfenster mit hellem Rahmen, ohne Sprossen
  function archWin(K, F, tc, tw, h0, h1, frame = CREAM) {
    const z = K.z, pts = archPts(F, tc, tw, h0, h1, z);
    poly(archPts(F, tc, tw, h0, h1, z, 1.1), K.wallCol(frame, F.n));
    poly(pts, lit() ? '#ffd873' : C('#a8dcff'));
    glowQuad(pts, 16 * z);
  }

  // -------------------------------------------------------------------------
  // Museum (3×3): kleiner Tempel mitten auf dem Platz – Cella mit Tür und zwei Bannern, davor sechs Säulen, darüber
  // flaches Satteldach mit Giebelfeld. Im Vorhof (an der Seite, die man sieht) ein Langhals-Dino-Skelett auf dem Rasen.
  // -------------------------------------------------------------------------
  const M_ROOF = '#6b7a8f', M_PLINTH = '#eadfc8';
  // Banner, das vorn an einer Säule hängt (Stoffbahn quer zur Tür-Seite, unten mit Kerbe)
  function banner(K, a, b, col) {
    const top = 21, bot = 9, w = 0.075, n = [1, 0];
    poly([K.P(a, b - w, top), K.P(a, b + w, top), K.P(a, b + w, bot), K.P(a, b, bot + 3), K.P(a, b - w, bot)], K.wallCol(col, n));
    poly([K.P(a, b - w, top), K.P(a, b + w, top), K.P(a, b + w, top - 1.4), K.P(a, b - w, top - 1.4)], K.wallCol(shade(col, -0.18), n));
  }
  function museumTemple(K) {
    const z = K.z, CA = -0.34, CHA = 0.44, CHB = 0.7;                   // Cella: a −0.78 … 0.1
    const RA = -0.22, RHA = 0.56, RHB = 0.78, colA = RA + RHA - 0.07;   // Dach über Cella und Säulenhalle
    K.block({ a: RA, b: 0, ha: RHA + 0.04, hb: RHB + 0.04, h: 3, wall: M_PLINTH, type: 'flat', roof: '#f4ecdc' });   // Sockel
    const parts = [[CA, 0, () => {
      const B = K.block({ a: CA, b: 0, ha: CHA, hb: CHB, h: 20, lift: 3, wall: CREAM, type: 'none' });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.4, 0.6, 0, 13.5 * z, K.wallCol('#eadcc0', F.n));                                // Türrahmen
        faceQuad(F.P, F.Q, 0.43, 0.57, 0, 12 * z, C(DOOR_COL));
        const [hx, hy] = faceAt(F, 0.5, 9 * z); halo(hx, hy, 32 * z);
      }
      K.wins(B, 'back', 3, 0.3, 0.72, 0.15, 0.85);
      for (const sd of ['right', 'left']) K.wins(B, sd, 2, 0.3, 0.72, 0.2, 0.8);
    }]];
    for (let i = 0; i < 6; i++) {
      const b = -0.66 + i * 0.264, col = i === 1 ? '#e8705f' : i === 4 ? '#5f8fe8' : null;
      parts.push([colA, b, () => { column(K, colA, b, 3, 20); if (col) banner(K, colA + 0.03, b, col); }]);   // zwei Banner an den Säulen
    }
    K.scene(parts);
    // Gebälk und flaches Satteldach; die Giebelseiten (vorn und hinten) bekommen ein Giebelfeld mit runder Scheibe
    const top = 26.5, rh = 11;
    K.block({ a: RA, b: 0, ha: RHA, hb: RHB, h: 3.5, lift: 23, wall: WHITE, roof: M_ROOF, roofH: rh, type: 'gable', ridge: 'a', over: 1.06 });
    for (const sg of [1, -1]) {
      if (K.facing(sg, 0) <= 0.01) continue;
      const a1 = RA + sg * RHA, n = [sg, 0], k = 0.72, base = top + 1.2;
      poly([K.P(a1, -RHB * k, base), K.P(a1, RHB * k, base), K.P(a1, 0, base + rh * k)], K.wallCol('#f1e5cc', n));
      const [mx, my] = K.P(a1, 0, base + 3.2); circle(mx, my, 2.5 * z, K.wallCol('#e9a23b', n)); circle(mx, my, 1.4 * z, K.wallCol('#fff0b8', n));
    }
  }
  function museumStairs(K) {
    K.block({ a: 0.48, b: 0, ha: 0.1, hb: 0.46, h: 1.2, wall: '#e2d6bd', type: 'flat', roof: '#f1e8d4' });
    K.block({ a: 0.43, b: 0, ha: 0.05, hb: 0.46, h: 2.2, wall: '#e8dcc4', type: 'flat', roof: '#f4ecdc' });
  }
  // Langhals-Skelett (Profil, zeigt zur Mitte des Grundstücks), auf einem Steinsockel
  function dino(K, a, b) {
    K.block({ a, b, ha: 0.22, hb: 0.3, h: 4, wall: '#b8c0cc', type: 'flat', roof: '#d3d9e1' });
    const [cx0] = K.P(0, 0), [x0, y0] = K.P(a, b, 4), z = K.z * 0.78, d = x0 > cx0 + 1 ? -1 : 1;
    const X = dx => x0 + dx * d * z, Y = up => y0 - up * z, pt = (dx, up) => [X(dx), Y(up)];
    const bez = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
    kLine(K, pt(1, 0), pt(1, 16), '#8a93a0', 0.9);                                                          // Stützen
    kLine(K, pt(13, 0), pt(13, 30), '#8a93a0', 0.9);
    const BONE = '#f7f1e2', BONE_D = '#ddd2b8';
    const hip = pt(-7, 19), tail = [pt(-21, 20), pt(-33, 5)], sh = pt(9, 21), sp = [hip, pt(1, 25), sh], neck = [sh, pt(22, 31), pt(19.5, 58)];
    // erst alles als Umrisslinie, dann die Knochen darüber – so hebt sich das Skelett vom hellen Pflaster ab
    for (const pass of [0, 1]) {
      const o = pass ? 0 : 1.1, col = c => C(pass ? c : '#a89b80');
      const curve = (p0, p1, p2, c, w) => { g.strokeStyle = col(c); g.lineWidth = (w + o) * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...p1, ...p2); g.stroke(); };
      const line = (p, q, c, w) => { g.strokeStyle = col(c); g.lineWidth = (w + o) * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); };
      const oval = (x, y, rx, ry, c) => ellipse(x, y, rx + o * 0.5 * z, ry + o * 0.5 * z, col(c));
      const leg = (hx, hy, kx, fx, c) => { line(pt(hx, hy), pt(kx, 8), c, 2.4); line(pt(kx, 8), pt(fx, 0.8), c, 2); oval(X(fx + 0.8), Y(0.6), 2 * z, 1 * z, c); };
      leg(-5, 18, -6.5, -4.5, BONE_D); leg(10, 19, 11, 10, BONE_D);                                            // ferne Beine
      curve(hip, tail[0], tail[1], BONE, 2);                                                                   // Schwanz
      for (let i = 0; i < 4; i++) {                                                                            // Rippen
        const tt = 0.2 + i * 0.2, [px, py] = bez(...sp, tt), len = 11 - Math.abs(tt - 0.5) * 8;
        curve([px, py], [px + 2.8 * d * z, py + len * 0.55 * z], [px + 0.4 * d * z, py + len * z], BONE, 1.6);
      }
      curve(...sp, BONE, 3);                                                                                   // Rückgrat
      oval(X(-7), Y(18), 3.6 * z, 2.6 * z, BONE);                                                              // Becken
      oval(X(8), Y(18), 2.4 * z, 3.3 * z, BONE);                                                               // Schulter
      curve(...neck, BONE, 2.6);                                                                               // Hals
      oval(X(21.5), Y(59.4), 4.4 * z, 2.8 * z, BONE);                                                          // Kopf
      oval(X(25), Y(58.6), 3 * z, 1.9 * z, BONE);
      leg(-9, 17, -7.8, -9.8, BONE); leg(7, 19, 8.3, 6.6, BONE);                                               // nahe Beine
    }
    halo(X(8), Y(30), 30 * z);
  }
  SHOP_ART.museum = function (K, s, now, x, y, t) {
    // Dino und Busch an die beiden vorderen Ecken; der Dino an die seitliche (nie hinter den Tempel, nie mitten davor)
    const db = Math.abs(K.depth(0.95, 0.9)) < Math.abs(K.depth(0.95, -0.9)) ? 0.9 : -0.9;
    if (groundPart(() => {
      K.rect(-1.47, -1.47, 1.47, 1.47, C('#ece3cf'));                                                          // Pflaster
      K.rect(0.5, -0.32, 1.47, 0.32, C('#e2d6bc'));                                                            // Weg zur Treppe
      for (const sb of [-1, 1]) { K.rect(0.6, sb * 0.55, 1.42, sb * 1.42, C('#9fd07a')); K.rect(0.65, sb * 0.6, 1.37, sb * 1.37, C('#a8d983')); }   // Rasen
    })) return;
    K.scene([
      [-0.22, 0, () => museumTemple(K)],
      [0.48, 0, () => museumStairs(K)],
      [0.95, db, () => dino(K, 0.95, db)],
      [1.02, -db, () => kitBush(K, 1.02, -db, 0.9, '#58ad52')],
    ]);
  };
  GROUND_TYPES.add('museum');
  ART_SHADOW.museum = [38, 0.55];

  // -------------------------------------------------------------------------
  // Hotel (2×2): breites Kurhotel, drei Obergeschosse unter einem blauen Mansarddach; in der Mitte ein Risalit mit
  // Giebel (runde Scheibe), Balkon und blauer Tafel mit drei goldenen Sternen über dem Vordach; davor roter Teppich
  // und zwei Kugelbäumchen im Topf.
  // -------------------------------------------------------------------------
  const H_ROOF = '#5f8fe8', H_BASE = '#f8e8c8';
  function topiary(K, a, b) {
    const [px, py] = K.P(a, b), z = K.z;
    poly([[px - 2.4 * z, py - 4 * z], [px + 2.4 * z, py - 4 * z], [px + 1.7 * z, py], [px - 1.7 * z, py]], C('#e8705f'));
    circle(px, py - 7.6 * z, 3.4 * z, C('#58b36a')); circle(px - 1 * z, py - 8.6 * z, 1.8 * z, C('#7cc46a'));
  }
  // Gauben im unteren Teil eines Mansarddachs (B aus K.block, over wie dort): je Seite [Normale, Stellen −1 … 1]
  function dormers(K, B, over, sides, wall, roof) {
    const z = K.z, top = B.lift + B.h, ea = B.ha * over * 0.84, eb = B.hb * over * 0.84, on = lit(), w = 0.08;
    for (const [n, spots] of sides) {
      if (K.facing(...n) <= 0.01) continue;
      for (const u of spots) {
        const pt = (off, up) => n[0] ? K.P(B.a + n[0] * ea, B.b + u * B.hb + off, up) : K.P(B.a + u * B.ha + off, B.b + n[1] * eb, up);
        poly([pt(-w, top + 1), pt(w, top + 1), pt(w, top + 7), pt(-w, top + 7)], K.wallCol(wall, n));
        const win = [pt(-w * 0.6, top + 2), pt(w * 0.6, top + 2), pt(w * 0.6, top + 6), pt(-w * 0.6, top + 6)];
        poly(win, on ? '#ffd873' : C('#a8dcff')); glowQuad(win, 10 * z);
        poly([pt(-w * 1.3, top + 6.6), pt(w * 1.3, top + 6.6), pt(0, top + 10.6)], K.wallCol(roof, n));
      }
    }
  }
  SHOP_ART.hotel = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(0.3, -0.97, 0.98, 0.97, C('#ece3cf'));                                                          // Vorplatz
      K.rect(0.5, -0.13, 0.98, 0.13, C('#e0605a'));                                                          // roter Teppich
    })) return;
    const A0 = -0.2, HA = 0.45, HB = 0.88, H = 30, FL = [10, 20];       // Unterkanten der Obergeschosse (das dritte ist im Dach)
    const RA = 0.26, RHA = 0.12, RHB = 0.3;                              // Mittelrisalit (a 0.14 … 0.38)
    const base = (K, B) => { for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, 1.6 * K.z, 10 * K.z, K.wallCol(H_BASE, F.n)); };
    const parts = [[A0, 0, () => {
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: CREAM, roof: H_ROOF, roofH: 14, type: 'mansard', over: 1.06, entry: true });
      base(K, B);
      const F = B.faces.front;
      if (F) {
        windowOn(F.P, F.Q, 0.07, 0.25, 2.5 * z, 8 * z, z); windowOn(F.P, F.Q, 0.75, 0.93, 2.5 * z, 8 * z, z);   // Lobby
        FL.forEach((b0, f) => {
          for (const [t0, t1] of [[0.07, 0.16], [0.2, 0.29], [0.71, 0.8], [0.84, 0.93]]) {
            windowOn(F.P, F.Q, t0, t1, (b0 + 2.5) * z, (b0 + 7.5) * z, z);
            if (!f) flowerBox(F.P, F.Q, t0, t1, (b0 + 2.5) * z, z);
          }
        });
      }
      const row = (h0, h1) => { K.wins(B, 'back', 5, h0, h1); for (const sd of ['right', 'left']) K.wins(B, sd, 2, h0, h1); };
      row(2.5 / H, 8 / H);
      for (const b0 of FL) row((b0 + 2.5) / H, (b0 + 7.5) / H);
      dormers(K, B, 1.06, [[[1, 0], [-0.62, 0.62]], [[-1, 0], [-0.6, 0, 0.6]], [[0, 1], [0]], [[0, -1], [0]]], CREAM, H_ROOF);
    }]];
    parts.push([RA, 0, () => {                                                                             // Mittelrisalit
      const z = K.z, R = K.block({ a: RA, b: 0, ha: RHA, hb: RHB, h: H, wall: CREAM, roof: H_ROOF, roofH: 10, type: 'gable', ridge: 'a', over: 1.1 });
      base(K, R);
      const F = R.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.32, 0.68, 0, 8.6 * z, K.wallCol('#e9d6b0', F.n));
        faceQuad(F.P, F.Q, 0.36, 0.64, 0, 7.8 * z, C(DOOR_COL));
        windowOn(F.P, F.Q, 0.4, 0.6, 3.8 * z, 6.8 * z, z);                                                  // Glas in der Tür
        faceQuad(F.P, F.Q, 0.12, 0.88, 11 * z, 17.4 * z, K.wallCol(H_ROOF, F.n));                          // Sterne-Tafel
        for (const k of [-1, 0, 1]) { const [sx, sy] = faceAt(F, 0.5 + k * 0.24, (k ? 13.9 : 14.4) * z); star(sx, sy, 2.1 * z, z); }
        for (const [t0, t1] of [[0.16, 0.42], [0.58, 0.84]]) windowOn(F.P, F.Q, t0, t1, 22.5 * z, 27.5 * z, z);
        const [gx, gy] = K.P(RA + RHA, 0, H + 3.4);                                                         // runde Scheibe im Giebel
        circle(gx, gy, 2.7 * z, K.wallCol('#ffffff', F.n)); circle(gx, gy, 1.9 * z, lit() ? '#ffd873' : C('#a8dcff'));
        halo(gx, gy, 12 * z);
      }
      for (const sd of ['right', 'left']) for (const b0 of FL) K.wins(R, sd, 1, (b0 + 2.5) / H, (b0 + 7.5) / H, 0.25, 0.75);
      if (F) K.block({ a: RA + RHA + 0.04, b: 0, ha: 0.04, hb: RHB * 0.84, h: 3, lift: FL[1], wall: H_ROOF, type: 'flat', roof: '#9dbcf2' });   // Balkon
    }]);
    parts.push([0.47, 0, () => {                                                                           // Vordach auf zwei Pfosten
      const z = K.z;
      for (const sb of [-1, 1]) kPost(K, 0.54, sb * 0.19, 8.6, '#6b7a8f', 1);
      K.block({ a: 0.47, b: 0, ha: 0.09, hb: 0.22, h: 1.8, lift: 8.6, wall: H_ROOF, type: 'flat', roof: '#9dbcf2' });
      const [lx, ly] = K.P(0.5, 0, 8.2); kGlow(lx, ly, z, 18);
    }]);
    for (const sb of [-1, 1]) parts.push([0.64, sb * 0.44, () => topiary(K, 0.64, sb * 0.44)]);
    K.scene(parts);
  };
  GROUND_TYPES.add('hotel');
  ART_SHADOW.hotel = [46, 0.15];

  // -------------------------------------------------------------------------
  // Grand Hotel (3×3): Palast in hellem Gelb mit türkisen Kupferdächern – Hauptbau mit Mansarddach und Gauben,
  // zwei Ecktürme mit Kuppel, weißer Säulen-Portikus mit Giebel; im Vorhof roter Teppich und zwei Springbrunnen.
  // -------------------------------------------------------------------------
  const G_WALL = '#fff0b8', G_ROOF = '#2f9e9e', G_BAND = '#f4e2a6';
  function fountain(K, a, b) {
    const [x, y] = K.P(a, b), z = K.z, rx = 0.2 * Math.SQRT2 * TW / 2 * z, ry = rx / 2, hh = 3.5 * z;
    ellipse(x, y, rx, ry, C('#d9d1c1'));
    g.fillStyle = C('#e8e1d3'); g.fillRect(x - rx, y - hh, 2 * rx, hh);
    ellipse(x, y - hh, rx, ry, C('#f4efe4'));
    ellipse(x, y - hh, rx * 0.84, ry * 0.78, C('#7fc9e6'));
    g.fillStyle = C('#ece6d8'); g.fillRect(x - 1.2 * z, y - hh - 7 * z, 2.4 * z, 7 * z);
    ellipse(x, y - hh - 7 * z, 4.2 * z, 1.8 * z, C('#f4efe4')); ellipse(x, y - hh - 7.3 * z, 3.2 * z, 1.2 * z, C('#9ad6ee'));
    const top = y - hh - 13 * z;                                                                            // Fontäne (steht still)
    g.strokeStyle = 'rgba(235,250,255,0.95)'; g.lineWidth = 1.2 * z; g.lineCap = 'round'; g.beginPath();
    g.moveTo(x, y - hh - 7 * z); g.lineTo(x, top);
    for (const sd of [-1, 1]) { g.moveTo(x, top); g.quadraticCurveTo(x + sd * 4.5 * z, top - 1.2 * z, x + sd * 6.5 * z, y - hh - 1.2 * z); }
    g.stroke();
  }
  SHOP_ART.grandhotel = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(0.4, -1.47, 1.47, 1.47, C('#efe6d2'));                                                          // Vorhof (Kies)
      for (const sb of [-1, 1]) { K.oval(1.02, sb * 0.86, 0.36, C('#9fd07a')); K.oval(1.02, sb * 0.86, 0.3, C('#a8d983')); }
      K.rect(0.62, -0.14, 1.47, 0.14, C('#e0605a'));                                                         // roter Teppich
    })) return;
    const A0 = -0.45, HA = 0.8, HB = 0.8, H = 44, FL = [14, 24, 34], TB = 1.08, parts = [];
    parts.push([A0, 0, () => {                                                                             // Hauptbau
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: G_WALL, roof: G_ROOF, roofH: 14, type: 'mansard', over: 1.03, entry: true });
      for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, 12.6 * z, 14 * z, K.wallCol(G_BAND, F.n));   // Gesims
      K.wins(B, 'front', 5, 3 / H, 10.5 / H, 0.06, 0.94, [2]);
      K.sideWins(B, 4, 3 / H, 10.5 / H);
      for (const b0 of FL) { K.wins(B, 'front', 5, (b0 + 2.4) / H, (b0 + 8) / H, 0.06, 0.94); K.sideWins(B, 4, (b0 + 2.4) / H, (b0 + 8) / H); }
      K.door(B, 'front', 0.45, 0.55, 0.2, DOOR_COL);
      dormers(K, B, 1.03, [[1, 0], [-1, 0], [0, 1], [0, -1]].map(n => [n, [-0.62, 0, 0.62]]), WHITE, G_ROOF);
    }]);
    for (const sb of [-1, 1]) parts.push([0.1, sb * TB, () => {                                             // Ecktürme mit Kuppel
      const z = K.z, TH = 54, Bt = K.block({ a: 0.1, b: sb * TB, ha: 0.32, hb: 0.28, h: TH, wall: G_WALL, roof: WHITE, type: 'flat' });
      for (const F of Object.values(Bt.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, 12.6 * z, 14 * z, K.wallCol(G_BAND, F.n));
      K.wins(Bt, 'front', 2, 3 / TH, 10.5 / TH); K.sideWins(Bt, 2, 3 / TH, 10.5 / TH);
      for (const b0 of [...FL, 44]) { K.wins(Bt, 'front', 2, (b0 + 2.4) / TH, (b0 + 8) / TH); K.sideWins(Bt, 2, (b0 + 2.4) / TH, (b0 + 8) / TH); }
      K.block({ a: 0.1, b: sb * TB, ha: 0.25, hb: 0.22, h: 3, lift: TH, wall: WHITE, type: 'flat', roof: G_ROOF });
      const [dx, dy] = kDome(K, 0.1, sb * TB, TH + 3, 12, G_ROOF);
      kLine(K, [dx, dy], [dx, dy - 5 * z], '#6b7a8f', 1); circle(dx, dy - 5.6 * z, 1.7 * z, C('#e9a23b'));
    }]);
    parts.push([0.56, 0, () => {                                                                           // Portikus
      const z = K.z;
      K.block({ a: 0.57, b: 0, ha: 0.21, hb: 0.47, h: 2.5, wall: '#e6dcc8', type: 'flat', roof: '#f4efe4' });
      K.scene([-0.36, -0.12, 0.12, 0.36].map(cb => [0.69, cb, () => column(K, 0.69, cb, 2.5, 23.5, WHITE, 1.8)]));
      K.block({ a: 0.56, b: 0, ha: 0.19, hb: 0.45, h: 4, lift: 26, wall: WHITE, roof: G_ROOF, roofH: 10, type: 'gable', ridge: 'a', over: 1.06 });
      for (const cb of [-0.2, 0.2]) { const [lx, ly] = K.P(0.72, cb, 18); kGlow(lx, ly, z, 18); }
    }]);
    for (const sb of [-1, 1]) parts.push([1.02, sb * 0.86, () => fountain(K, 1.02, sb * 0.86)]);
    K.scene(parts);
  };
  GROUND_TYPES.add('grandhotel');
  ART_SHADOW.grandhotel = [52, 0.3];

  // -------------------------------------------------------------------------
  // Markthalle (2×3): lange, niedrige Halle aus hellem Backstein mit Bogenfenstern und großem Glas-Tonnendach
  // (türkise Rippen); vorn ein höheres Portal mit Rundbogen-Tor und Uhr; davor zwei Marktstände.
  // -------------------------------------------------------------------------
  const MH_WALL = '#ffd1b3', MH_RIB = '#2f9e9e', GLASS = '#d4ecee', FRUIT = ['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a', '#c77dff'];
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
      g.strokeStyle = C(shade(MH_RIB, amt * 0.5)); g.lineWidth = 1.1 * z; g.lineCap = 'round'; g.beginPath();
      for (let j = 0; j <= ribs; j++) { const s = -L + 2 * L * j / ribs, p0 = pt(s, t0), p1 = pt(s, t1); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
      g.stroke();
    }
    for (const sg of [1, -1]) {                                                                           // Fächerfenster an den Enden
      if (K.facing(0, sg) <= 0.01) continue;
      const bs = b + sg * hb, rr = ha * 0.98, n = [0, sg];
      const Q = (th, r) => K.P(a + Math.cos(th) * r, bs, top + Math.sin(th) * roofH * r / R);
      const arc = r => { const out = []; for (let i = 0; i <= 12; i++) out.push(Q(Math.PI * i / 12, r)); return out; };
      poly(arc(rr), K.wallCol(MH_RIB, n));
      poly(arc(rr * 0.86), lit() ? '#ffd873' : K.wallCol(GLASS, n));
      glowQuad([Q(0, rr * 0.86), Q(Math.PI / 3, rr * 0.86), Q(2 * Math.PI / 3, rr * 0.86), Q(Math.PI, rr * 0.86)], 20 * z);
      g.strokeStyle = C(MH_RIB); g.lineWidth = 1 * z; g.beginPath();
      const c0 = Q(0, 0);
      for (let k = 1; k < 4; k++) { const p = Q(Math.PI * k / 4, rr * 0.86); g.moveTo(c0[0], c0[1]); g.lineTo(p[0], p[1]); }
      g.stroke();
    }
  }
  // Uhr in einer Wandfläche (schräg wie die Wand), Zeiger auf zehn nach zehn
  function clockOn(K, F, up, r) {
    const z = K.z, c = faceAt(F, 0.5, up);
    faceClock(F, 0.5, up, r, z, { ring: MH_RIB, face: '#fffaf0', ringW: r * 0.24 / z, lit: lit(), hands: [[-Math.PI / 3, 0.5, 1], [Math.PI / 3, 0.8, 1]] });   // gemeinsame Wanduhr (Block 80)
    halo(c[0], c[1], 16 * z);
  }
  function marketStall(K, a, b, col, i) {
    const z = K.z, ha = 0.12, hb = 0.26, af = a + ha + 0.08, parts = [];
    for (const [pa, pb, hh] of [[a - ha, b - hb, 17], [a - ha, b + hb, 17], [af, b - hb, 13], [af, b + hb, 13]]) parts.push([pa, pb, () => kPost(K, pa, pb, hh, '#8b5a3c', 1)]);
    parts.push([a, b, () => {
      K.block({ a, b, ha, hb, h: 6, wall: '#d9a878', type: 'flat', roof: '#f0d2a4' });
      for (let j = 0; j < 4; j++) { const [px, py] = K.P(a + 0.02, b - hb + 0.1 + j * 0.107, 6); circle(px, py - 1.2 * z, 1.9 * z, C(FRUIT[(i + j) % 5])); }
    }]);
    K.scene(parts);
    const n = 6, w = (2 * hb + 0.08) / n;
    for (let k = 0; k < n; k++) {
      const b0 = b - hb - 0.04 + k * w, b1 = b0 + w;
      poly([K.P(a - ha, b0, 17), K.P(a - ha, b1, 17), K.P(af, b1, 13), K.P(af, b0, 13)], C(k & 1 ? '#fffaf0' : col));
    }
    for (let k = 0; k < n; k++) { const [fx, fy] = K.P(af, b - hb - 0.04 + (k + 0.5) * w, 13); ellipse(fx, fy, 2.3 * z, 1.4 * z, C(k & 1 ? '#fffaf0' : col)); }
  }
  SHOP_ART.markthalle = function (K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-0.98, -1.47, 0.98, 1.47, C('#e6dcc6'));                                                        // Marktplatz
      K.rect(0.5, -0.3, 0.98, 0.3, C('#ddd0b6'));                                                            // Weg zum Tor
    })) return;
    const A0 = -0.2, HA = 0.55, HB = 1.08, H = 13, parts = [];
    parts.push([A0, 0, () => {                                                                             // Halle
      const z = K.z, B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: MH_WALL, type: 'none', trim: CREAM });
      if (B.faces.front) for (const tc of [0.1, 0.23, 0.77, 0.9]) archWin(K, B.faces.front, tc, 0.08, 2.5, 7);
      if (B.faces.back) for (let i = 0; i < 5; i++) archWin(K, B.faces.back, 0.14 + i * 0.18, 0.08, 2.5, 7);
      for (const sd of ['right', 'left']) if (B.faces[sd]) for (const tc of [0.3, 0.7]) archWin(K, B.faces[sd], tc, 0.16, 2.5, 7);
      glassBarrel(K, A0, 0, HA * 1.05, HB * 1.02, HA, HB, H, 13, 6);
      const [hx, hy] = K.P(A0, 0, H + 8); halo(hx, hy, 52 * z);
    }]);
    parts.push([0.45, 0, () => {                                                                           // Portal mit Tor und Uhr
      const z = K.z, B = K.block({ a: 0.45, b: 0, ha: 0.11, hb: 0.4, h: 25, wall: MH_WALL, roof: MH_RIB, roofH: 8, type: 'barrel', ridge: 'a', trim: CREAM });
      const F = B.faces.front;
      if (F) {
        poly(archPts(F, 0.5, 0.42, 0, 8, z, 1.6), K.wallCol(CREAM, F.n));
        poly(archPts(F, 0.5, 0.42, 0, 8, z), C(DOOR_COL));
        const gl = archPts(F, 0.5, 0.3, 8.4, 9, z);
        poly(gl, lit() ? '#ffd873' : C('#a8dcff')); glowQuad(gl, 16 * z);
        clockOn(K, F, 19.6 * z, 3.3 * z);
      }
      for (const sd of ['right', 'left']) if (B.faces[sd]) archWin(K, B.faces[sd], 0.5, 0.44, 10, 16);
    }]);
    [[-1, '#e8705f', 0], [1, '#e9a23b', 2]].forEach(([sb, col, i]) => parts.push([0.7, sb * 1.02, () => marketStall(K, 0.7, sb * 1.02, col, i)]));
    K.scene(parts);
  };
  GROUND_TYPES.add('markthalle');
  ART_SHADOW.markthalle = [26, 0.2];
})();
