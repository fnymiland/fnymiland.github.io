'use strict';
// Ladenbilder, Gruppe a (Block 32): Kiosk, Blumenladen, Friseur, Post – trägt sich in SHOP_ART ein
// (siehe draw-shops.js: shopHouse, faceAt, hangSign). Block 35: in der Formensprache der alten Gebäude – helle Wände,
// klare Dachfarben, je Laden eine eigene Bauform (Bude, Giebelhaus mit Wintergarten, schmales Stadthaus mit Erker,
// Walmdach mit Zwerchgiebel), wenig Kleinkram, keine Schrift; Schatten über ART_SHADOW.
(() => {
  const lit = () => night > 0.15 && isLive();

  // Markise, die schräg aus der Tür-Seite ragt: n Streifen c1/c2 mit runder Kante
  function awning(K, B, c1, c2, h0 = 0.45, h1 = 0.6, out = 0.1, n = 6) {
    const F = B.faces.front;
    if (!F) return;
    const a1 = B.a + B.ha, top = B.lift + B.h * h1, bot = B.lift + B.h * h0;
    const at = (t, da, up) => K.P(a1 + da, B.b + B.hb * (1.8 * t - 0.9), up);
    for (let i = 0; i < n; i++) {
      const col = C(i & 1 ? c2 : c1), o0 = at(i / n, out, bot), o1 = at((i + 1) / n, out, bot);
      poly([at(i / n, 0, top), at((i + 1) / n, 0, top), o1, o0], col);
      const m = lerp(o0, o1, 0.5);
      circle(m[0], m[1], Math.max(0.3, Math.abs(o1[0] - o0[0]) * 0.5), col);
    }
  }
  // Blumenkasten unter einem Fenster (Höhe h in px mit z): Holzkasten, Grün, bunte Blüten
  const BLOOM = ['#ff5d8f', '#ffd23f', '#ffffff', '#b57bff', '#ff8a3d'];
  function flowerBox(F, t0, t1, h, z, k = 0) {
    faceQuad(F.P, F.Q, t0 - 0.03, t1 + 0.03, h - 2 * z, h, C('#8a5a3c'));
    for (let i = 0; i < 3; i++) {
      const m = lerp(lerp(F.P, F.Q, t0), lerp(F.P, F.Q, t1), (i + 0.5) / 3);
      circle(m[0], m[1] - h - 0.6 * z, 1.4 * z, C(i & 1 ? '#4f9e3a' : '#63b84a'));
      circle(m[0], m[1] - h - 1.7 * z, 1.1 * z, C(BLOOM[(i + k) % BLOOM.length]));
    }
  }
  // Fenster (wie bei den Wohnhäusern) auf jeder sichtbaren Seite außer der Tür-Seite
  function sideWin(K, B, spots, h0, h1) {
    for (const side of ['right', 'left', 'back']) {
      const F = B.faces[side];
      if (F) for (const [t0, t1] of spots) windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, K.z);
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Kiosk: niedrige hellblaue Bude mit gelbem Flachdach, breites Vordach in Bernstein, Verkaufsluke mit ein paar
  // Heften; davor ein Zeitschriften-Ständer
  // ---------------------------------------------------------------------------------------------------------------
  const COVERS = ['#f28cb1', '#58b36a', '#ff8a3d', '#5f8fe8'];
  SHOP_ART.kiosk = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, WALL = '#b8d8ff', ROOF = '#ffe066', AMBER = '#e9a23b', L = lit();
    K.scene([[-0.08, 0, () => {
      kShadow(K, 0.3);
      const B = K.block({ a: -0.08, b: 0, ha: 0.27, hb: 0.31, h: 15, wall: WALL, roof: ROOF, type: 'flat', entry: true, trim: AMBER });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.05, 0.6, F.H * 0.14, F.H * 0.72, C('#ffffff'));                       // Luke: Rahmen
        faceQuad(F.P, F.Q, 0.09, 0.56, F.H * 0.26, F.H * 0.66, L ? '#ffe6a0' : C('#fff4dc'));
        const p = lerp(F.P, F.Q, 0.09), q = lerp(F.P, F.Q, 0.56), h0 = F.H * 0.26, h1 = F.H * 0.66;
        glowQuad([[p[0], p[1] - h0], [q[0], q[1] - h0], [q[0], q[1] - h1], [p[0], p[1] - h1]], 20 * z);
        for (let i = 0; i < 3; i++) {                                                               // Hefte in der Luke
          const t0 = 0.14 + i * 0.14;
          faceQuad(F.P, F.Q, t0, t0 + 0.1, F.H * 0.3, F.H * 0.6, C(COVERS[i]));
        }
        faceQuad(F.P, F.Q, 0.03, 0.62, F.H * 0.14, F.H * 0.26, C(AMBER));                         // Tresen
        faceQuad(F.P, F.Q, 0.68, 0.9, 0, F.H * 0.68, C(AMBER));                                    // Tür
      }
      sideWin(K, B, [[0.3, 0.7]], 0.3, 0.68);
    }], [0.26, 0, () => {                                                                           // breites Vordach
      const V = K.block({ a: 0.26, b: 0, ha: 0.07, hb: 0.36, h: 2, lift: 13, wall: AMBER, roof: ROOF, type: 'flat' });
      const E = V.faces.front;
      if (E) for (let i = 0; i < 6; i++) faceQuad(E.P, E.Q, i / 6, (i + 1) / 6, -1.6 * z, 0, C(i & 1 ? '#ffffff' : AMBER));
    }], [0.44, -0.22, () => {                                                                       // Zeitschriften-Ständer
      const R = K.block({ a: 0.44, b: -0.22, ha: 0.05, hb: 0.12, h: 8, wall: '#8a98ab', roof: '#b8c2cf', type: 'flat' });
      for (const S of Object.values(R.faces)) {
        if (!S || !S.n[0]) continue;                                                               // nur die breiten Seiten
        for (let r = 0; r < 2; r++) for (let i = 0; i < 2; i++) {
          const t0 = 0.1 + i * 0.42;
          faceQuad(S.P, S.Q, t0, t0 + 0.36, S.H * (0.1 + r * 0.46), S.H * (0.46 + r * 0.46), K.wallCol(COVERS[(i + r * 2) % 4], S.n));
        }
      }
    }]]);
  };
  ART_SHADOW.kiosk = [16, 0.2];

  // ---------------------------------------------------------------------------------------------------------------
  // Blumenladen: rosa Haus mit grünem Satteldach, der Giebel zeigt zur Straße; seitlich ein kleiner gläserner
  // Wintergarten mit Pflanzen; Markise grün-weiß, Blumenkasten am Giebelfenster, ein Eimer Blumen vor der Tür
  // ---------------------------------------------------------------------------------------------------------------
  function sunflowerHead(hx, hy, z) {                                                               // Blüte, Radius ≈ 9.4 × z
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 12; i++) {                          // Blütenblätter
      const ang = (i + layer * 0.5) * Math.PI / 6, r = layer ? 5.4 : 5.9;
      g.beginPath(); g.ellipse(hx + Math.cos(ang) * r * z, hy + Math.sin(ang) * r * z, 3.5 * z, 1.7 * z, ang, 0, Math.PI * 2);
      g.fillStyle = C(layer ? '#ffd23f' : '#f39c12'); g.fill();
    }
    circle(hx, hy, 4.4 * z, C('#6b3f22'));
    circle(hx - 0.8 * z, hy - 0.8 * z, 2.8 * z, C('#8a5530'));
  }
  // Mini-Sonnenblume fürs Schild: kurzer Stiel mit Blatt, Blüte darüber (passt in den Kreis mit Radius 4 × z)
  function miniSunflower(cx, cy, z) {
    g.strokeStyle = C('#3f8f3a'); g.lineWidth = 0.8 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx - 0.5 * z, cy + 2 * z, cx + 0.2 * z, cy + 3.9 * z); g.stroke();
    g.beginPath(); g.ellipse(cx + 1.3 * z, cy + 2.6 * z, 1.4 * z, 0.6 * z, -0.5, 0, Math.PI * 2); g.fillStyle = C('#4caf50'); g.fill();
    g.save(); g.translate(cx, cy - 0.9 * z); g.scale(0.33, 0.33);
    sunflowerHead(0, 0, z);
    g.restore();
  }
  // Zinkeimer mit einem bunten Strauß
  function bucket(K, a, b) {
    return () => {
      const [px, py] = K.P(a, b), z = K.z;
      circle(px - 1.5 * z, py - 5.8 * z, 1.8 * z, C('#4f9e3a')); circle(px + 1.5 * z, py - 6 * z, 1.8 * z, C('#63b84a'));
      [[-2, -7.6, '#ff5d8f'], [0.2, -9, '#ffd23f'], [2, -7.4, '#b57bff'], [-0.9, -10.6, '#ffffff'], [1.2, -11, '#ff8a3d']]
        .forEach(([dx, dy, col]) => circle(px + dx * z, py + dy * z, 1.5 * z, C(col)));
      poly([[px - 2.8 * z, py - 5 * z], [px + 2.8 * z, py - 5 * z], [px + 2.1 * z, py], [px - 2.1 * z, py]], C('#b4c2cf'));
      poly([[px + 0.7 * z, py - 5 * z], [px + 2.8 * z, py - 5 * z], [px + 2.1 * z, py], [px + 0.5 * z, py]], C('#9fb0bf'));
      ellipse(px, py - 5 * z, 2.8 * z, 1 * z, C('#8697a8'));
    };
  }
  SHOP_ART.blumenladen = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, WALL = '#ffe3e0', GREEN = '#58b36a', PINK = '#d94f8a', L = lit();
    const GA = -0.04, GHA = 0.26, GHB = 0.27, H = 18, RH = 14;                                     // Haus
    const WA = -0.17, WB = GHB + 0.1, WH = 10;                                                      // Wintergarten
    K.scene([[GA, 0, () => {
      kShadow(K, 0.3);
      const B = shopHouse(K, { wall: WALL, roof: GREEN, roofType: 'gable', ridge: 'a', a: GA, ha: GHA, hb: GHB, h: H, roofH: RH, upperWins: 0, trim: '#ffffff' });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(PINK));                                   // Tür in Rosa
        awning(K, B, GREEN, '#ffffff', 0.45, 0.6, 0.1, 6);
        windowOn(F.P, F.Q, 0.36, 0.64, F.H * 0.66, F.H * 0.9, z);
        flowerBox(F, 0.36, 0.64, F.H * 0.66, z);
        gableWindow(K, B, RH);
      }
      sideWin(K, B, [[0.14, 0.42]], 0.64, 0.88);
    }], [WA, WB, () => {                                                                            // Wintergarten
      const W = K.block({ a: WA, b: WB, ha: 0.09, hb: 0.1, h: WH, wall: '#f5f5f5', roof: '#dff0fb', roofH: 5, type: 'gable', ridge: 'b', over: 1.1 });
      for (const S of Object.values(W.faces)) {
        if (!S) continue;
        windowOn(S.P, S.Q, 0.08, 0.92, S.H * 0.12, S.H * 0.9, z);
        if (!L) faceQuad(S.P, S.Q, 0.08, 0.92, S.H * 0.12, S.H * 0.42, K.wallCol('#7cc46a', S.n));   // Pflanzen hinter dem Glas
        const p = lerp(S.P, S.Q, 0.5);
        kLine(K, [p[0], p[1] - S.H * 0.12], [p[0], p[1] - S.H * 0.9], '#ffffff', 1);
      }
      const n = [0, 1];                                                                             // Glas im Giebel
      if (K.facing(...n) > 0.01) {
        const gb = WB + 0.1, e = 0.09 * 0.8;
        poly([K.P(WA - e, gb, WH + 0.6), K.P(WA + e, gb, WH + 0.6), K.P(WA, gb, WH + 4.2)], L ? '#ffd873' : C('#a8dcff'));
      }
    }], hangSign(K, (cx, cy, z) => miniSunflower(cx, cy, z), GREEN, { up: 10, a0: 0.27, b0: 0.32, back: -0.35 }),
      [0.34, -0.2, bucket(K, 0.34, -0.2)]]);
  };
  ART_SHADOW.blumenladen = [30, 0.22];

  // ---------------------------------------------------------------------------------------------------------------
  // Friseur: schmales, hohes Stadthaus (zwei Geschosse) in Hellblau, blaues Satteldach längs, kleiner weißer Erker
  // oben an der Tür-Seite, Markise blau-weiß; daneben die Friseur-Säule (rot-weiß-blaue Spirale, Kugel oben),
  // an der anderen Ecke das Scheren-Schild
  // ---------------------------------------------------------------------------------------------------------------
  const NAVY = '#2c3e70';
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function barberPole(K, a, b, now, L) {
    const [px, py] = K.P(a, b), z = K.z, r = 2.4 * z, y0 = py - 4 * z, y1 = py - 27 * z;
    box(px, py, 3.2 * z, 1.6 * z, 4 * z, '#5f8fe8', null, 0);                                        // Sockel
    g.save();
    g.beginPath(); g.rect(px - r, y1, 2 * r, y0 - y1); g.clip();
    rect(px - r, y1, 2 * r, y0 - y1, C('#ffffff'));
    const per = 8 * z, sl = 3.4 * z, bw = 2 * z, off = ((now / 1700) % 1) * per;
    for (let k = -1; k * per < y0 - y1 + per; k++) {
      const yb = y0 - k * per - off;
      poly([[px - r, yb], [px + r, yb - sl], [px + r, yb - sl - bw], [px - r, yb - bw]], C('#e8413c'));
      poly([[px - r, yb - per / 2], [px + r, yb - per / 2 - sl], [px + r, yb - per / 2 - sl - bw], [px - r, yb - per / 2 - bw]], C('#2f5fb3'));
    }
    rect(px + r * 0.3, y1, r * 0.7, y0 - y1, 'rgba(20,30,60,0.18)');                                // Rundung
    g.restore();
    glowQuad([[px - r, y1], [px + r, y1], [px + r, y0], [px - r, y0]], 18 * z);
    for (const yy of [y0, y1]) rect(px - r - 0.6 * z, yy - 1 * z, 2 * r + 1.2 * z, 2 * z, C('#c7cdd6'));
    const gy = y1 - 4 * z;                                                                           // Kugel
    circle(px, gy, 3.1 * z, L ? '#fff6d0' : C('#eef3fa'));
    kGlow(px, gy, z, 16);
  }
  // Schere (Klingen oben, rote Griffe unten), Mitte bei (cx, cy + 0.4 × z), Radius ≈ 7 × z
  function scissors(cx, cy, z, blade) {
    const piv = [cx, cy + 1 * z];
    g.lineCap = 'round';
    for (const d of [-1, 1]) {
      const hx = cx + d * 2.5 * z, hy = cy + 4.9 * z, dx = piv[0] - hx, dy = piv[1] - hy;                 // Griff → Drehpunkt
      const tip = [piv[0] + dx * 1.95, piv[1] + dy * 1.95], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      poly([[piv[0] + nx * 1.3 * z, piv[1] + ny * 1.3 * z], tip, [piv[0] - nx * 0.5 * z, piv[1] - ny * 0.5 * z]], blade);
      g.strokeStyle = C('#e8413c'); g.lineWidth = 1.2 * z;
      g.beginPath(); g.moveTo(...piv); g.lineTo(hx - d * 0.8 * z, hy - 1.2 * z); g.stroke();
      g.lineWidth = 1.3 * z;
      g.beginPath(); g.arc(hx, hy, 1.8 * z, 0, Math.PI * 2); g.stroke();
    }
    circle(piv[0], piv[1], 0.8 * z, C('#c7cdd6'));
  }
  SHOP_ART.friseur = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, L = lit(), cx = K.P(0, 0)[0], WALL = '#e4f1ff', BLUE = '#5f8fe8';
    const A = -0.04, HA = 0.26, HB = 0.2, H = 26, RH = 11, front = A + HA;
    // Säule an die vordere Ecke, die am Rand des Bildes steht – so ist sie aus jeder Richtung frei zu sehen
    const sb = Math.abs(K.P(0.34, 0.31)[0] - cx) >= Math.abs(K.P(0.34, -0.31)[0] - cx) ? 0.31 : -0.31;
    K.scene([[A, 0, () => {
      kShadow(K, 0.26);
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: BLUE, roofH: RH, type: 'gable', ridge: 'a', over: 1.18, entry: true });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.06, 0.58, F.H * 0.03, F.H * 0.36, C('#ffffff'));                      // Schaufenster
        windowOn(F.P, F.Q, 0.1, 0.54, F.H * 0.06, F.H * 0.33, z);
        faceQuad(F.P, F.Q, 0.66, 0.9, 0, F.H * 0.34, C(BLUE));                                     // Tür
        awning(K, B, BLUE, '#ffffff', 0.37, 0.47, 0.08, 5);
        gableWindow(K, B, RH);
      }
      sideWin(K, B, [[0.14, 0.4], [0.6, 0.86]], 0.1, 0.34);                                         // zwei Geschosse
      sideWin(K, B, [[0.14, 0.4], [0.6, 0.86]], 0.6, 0.84);
    }], [front + 0.04, 0, () => {                                                                   // Erker im Obergeschoss
      const E = K.block({ a: front + 0.04, b: 0, ha: 0.04, hb: 0.11, h: 9, lift: 15, wall: '#f5f5f5', roof: BLUE, roofH: 4, type: 'hip', over: 1.2 });
      K.wins(E, 'front', 1, 0.2, 0.82, 0.14, 0.86);
    }], [0.34, sb, () => barberPole(K, 0.34, sb, now, L)],
    hangSign(K, (cx, cy, z) => {                                                                   // Mini-Schere
      g.save(); g.translate(cx, cy); g.scale(0.55, 0.55);
      scissors(0, -0.4 * z, z, L ? '#3a5298' : C(NAVY));
      g.restore();
      kGlow(cx, cy, z, 14);
    }, BLUE, { up: 12, a0: front + 0.02, b0: HB + 0.1, back: A - HA - 0.02 })]);
  };
  ART_SHADOW.friseur = [36, 0.26];

  // ---------------------------------------------------------------------------------------------------------------
  // Post: breites Haus mit Walmdach (Schiefergrau), über der Tür ein Zwerchgiebel in Posthorn-Gelb; Posthorn-Schild
  // an der Ecke, gelber Briefkasten vor der Tür
  // ---------------------------------------------------------------------------------------------------------------
  const PYEL = '#ffcc00', PDARK = '#2d2d38';
  function posthorn(cx, cy, z, col) {                                                              // etwa 19 × 11 z groß
    g.strokeStyle = col; g.lineCap = 'round';
    g.lineWidth = 1.7 * z;
    g.beginPath(); g.arc(cx - 2.4 * z, cy + 0.3 * z, 3.1 * z, 0, Math.PI * 2); g.stroke();             // Windung
    poly([[cx + 0.4 * z, cy - 0.5 * z], [cx + 7.6 * z, cy - 5 * z], [cx + 7.6 * z, cy + 5.4 * z], [cx + 0.4 * z, cy + 1.3 * z]], col);   // Trichter
    ellipse(cx + 7.6 * z, cy + 0.2 * z, 1.5 * z, 5.2 * z, col);
    g.lineWidth = 1.2 * z;
    g.beginPath(); g.moveTo(cx - 4.8 * z, cy + 2.4 * z); g.lineTo(cx - 8.6 * z, cy + 4.4 * z); g.stroke();   // Mundstück
    circle(cx - 8.8 * z, cy + 4.5 * z, 1 * z, col);
  }
  function mailbox(K, a, b) {
    return () => {
      kPost(K, a, b, 5, '#6b7a8f', 1.6);
      const M = K.block({ a, b, ha: 0.055, hb: 0.08, h: 7, lift: 4.5, wall: PYEL, roof: PYEL, roofH: 2.8, type: 'barrel', ridge: 'a' });
      for (const S of Object.values(M.faces)) {
        if (!S || !S.n[0]) continue;
        faceQuad(S.P, S.Q, 0.2, 0.8, S.H * 0.66, S.H * 0.86, C(PDARK));                            // Einwurf
      }
    };
  }
  SHOP_ART.post = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, L = lit(), WALL = '#fff0b8', ROOF = '#6b7a8f', ZW = '#ffe066';
    const A = -0.06, HA = 0.26, HB = 0.32, H = 18, RH = 12, OV = 1.18;
    const front = A + HA, eave = A + HA * OV;                                                       // Wandflucht, Traufe vorn
    const roofAt = up => eave - (up - H) * (eave - A) / RH;                                          // wo das Walmdach vorn diese Höhe hat
    const ZB = 0.16, ZF = front + 0.015, ZH = 20, ZR = 29;                                           // Zwerchgiebel
    K.scene([[A, 0, () => {
      kShadow(K, 0.34);
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: ROOF, roofH: RH, type: 'hip', over: OV, entry: true });
      const F = B.faces.front;
      if (F) {
        for (const [t0, t1] of [[0.08, 0.23], [0.77, 0.92]]) {
          windowOn(F.P, F.Q, t0, t1, F.H * 0.14, F.H * 0.52, z);
          windowOn(F.P, F.Q, t0, t1, F.H * 0.66, F.H * 0.86, z);
        }
        // Zwerchgiebel: Wand steigt über die Traufe, Giebel mit eigenem Dach, das hinten ins Walmdach läuft
        const Z = K.block({ a: ZF - 0.0075, b: 0, ha: 0.0075, hb: ZB, h: ZH, wall: ZW, type: 'none' });
        const G = Z.faces.front, fa = ZF + 0.02, eb = ZB * 1.15;
        const [away, toward] = [-1, 1].map(sg => [[K.P(fa, sg * eb, ZH), K.P(roofAt(ZH), sg * eb, ZH), K.P(roofAt(ZR), 0, ZR), K.P(fa, 0, ZR)], [0, sg]])
          .sort((p, q) => K.facing(...p[1]) - K.facing(...q[1]));
        poly(away[0], K.roofCol(ROOF, away[1]));                                                   // wie K.block: hintere Fläche,
        poly([K.P(ZF, -ZB, ZH), K.P(ZF, ZB, ZH), K.P(ZF, 0, ZR)], K.wallCol(ZW, [1, 0]));         // Giebel, vordere Fläche
        poly(toward[0], K.roofCol(ROOF, toward[1]));
        if (G) {
          faceQuad(G.P, G.Q, 0.3, 0.7, 0, G.H * 0.5, C(ROOF));                                     // Tür
          windowOn(G.P, G.Q, 0.28, 0.72, G.H * 0.64, G.H * 0.86, z);
          const [gx, gy] = K.P(ZF, 0, ZH + (ZR - ZH) * 0.4);                                      // rundes Giebelfenster
          circle(gx, gy, 1.9 * z, C('#ffffff'));
          circle(gx, gy, 1.3 * z, L ? '#ffd873' : C('#a8dcff'));
        }
      }
      sideWin(K, B, [[0.14, 0.42], [0.58, 0.86]], 0.3, 0.66);
    }], hangSign(K, (cx, cy, z) => {                                                               // Mini-Posthorn, dunkel auf Gelb
      g.save(); g.translate(cx, cy); g.scale(0.43, 0.43);
      posthorn(0.35 * z, -0.25 * z, z, C(PDARK));
      g.restore();
      kGlow(cx, cy, z, 14);
    }, PYEL, { up: 10, a0: front + 0.05, b0: HB + 0.05, back: A - HA - 0.05 }), [0.3, -0.3, mailbox(K, 0.3, -0.3)]]);
  };
  ART_SHADOW.post = [29, 0.2];
})();
