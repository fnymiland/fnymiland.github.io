'use strict';
// Ladenbilder, Gruppe g (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Kino, Theater, Konzerthalle, Kaufhaus, Passage: feste Markenfarben und ein großes Wahrzeichen, das man aus allen
// vier Richtungen sieht (auf dem Dach bzw. über dem Dach). Alles in einer Klammer, damit keine Namen mit den anderen
// Gruppen-Dateien zusammenstoßen.
(function () {
  const lightsOn = () => night > 0.15 && isLive();
  const GOLD = '#d4af37';

  // --- Helfer ---------------------------------------------------------------
  // Vier Ecken eines Stücks einer Seite (für Nachtlicht)
  const quadOf = (F, t0, t1, h0, h1) => {
    const a = lerp(F.P, F.Q, t0), b = lerp(F.P, F.Q, t1);
    return [[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]];
  };
  // Richtung einer Seite auf dem Bildschirm, immer von links nach rechts (Schrift soll lesbar bleiben)
  function faceDir(F) {
    const dx = F.Q[0] - F.P[0], dy = F.Q[1] - F.P[1], L = Math.hypot(dx, dy) || 1;
    return dx >= 0 ? [dx / L, dy / L] : [-dx / L, -dy / L];
  }
  // Schriftzug schräg an einer Wand: Mitte bei t, Höhe up (px, schon mit z); col fertig (C() bzw. Leuchtfarbe)
  function wallText(F, t, up, text, size, col, z) {
    const [x, y] = faceAt(F, t, up), [ux, uy] = faceDir(F);
    g.save();
    g.transform(ux, uy, 0, 1, x, y);
    g.font = `900 ${Math.max(1, size * z)}px Nunito, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = col; g.fillText(text, 0, 0);
    g.restore();
  }
  // Glühbirne, die mit den Nachbarn im Lauflicht blinkt
  function bulb(x, y, r, i, now, on) {
    const hot = (i + Math.floor(now / 260)) % 3 !== 0;
    circle(x, y, r, hot ? (on ? '#fffbe0' : C('#fff3b0')) : (on ? '#ffc94a' : C('#d9a13a')));
  }
  function chase(F, up, n, now, on, z, r = 0.6) {
    for (let i = 0; i < n; i++) { const [x, y] = faceAt(F, (i + 0.5) / n, up); bulb(x, y, r * z, i, now, on); }
  }
  // Bogenfenster (Rahmen, Glas, auf Wunsch rote Vorhänge)
  function archPts(F, t0, t1, h0, h1, rise) {
    const pts = [faceAt(F, t0, h0), faceAt(F, t1, h0)];
    for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push(faceAt(F, t1 + (t0 - t1) * k, h1 + Math.sin(Math.PI * k) * rise)); }
    return pts;
  }
  function archWindow(F, t0, t1, h0, h1, z, frame, curtain) {
    const on = lightsOn(), len = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]), rise = len * (t1 - t0) * 0.42, d = (t1 - t0) * 0.16;
    poly(archPts(F, t0 - d, t1 + d, Math.max(0, h0 - 1 * z), h1, rise + 1.2 * z), C(frame));
    poly(archPts(F, t0, t1, h0, h1, rise), on ? '#ffd873' : C('#a8dcff'));
    glowQuad(quadOf(F, t0, t1, h0, h1 + rise), 16 * z);
    if (!curtain) return;
    const c = (t1 - t0) * 0.34, top = h1 + rise * 0.3, mid = (h0 + h1) / 2, col = C(curtain);
    poly([faceAt(F, t0, top), faceAt(F, t0 + c, top), faceAt(F, t0 + c * 0.3, mid), faceAt(F, t0 + c * 0.6, h0), faceAt(F, t0, h0)], col);
    poly([faceAt(F, t1, top), faceAt(F, t1 - c, top), faceAt(F, t1 - c * 0.3, mid), faceAt(F, t1 - c * 0.6, h0), faceAt(F, t1, h0)], col);
  }
  // Kleine gestreifte Markise, die schräg von der Wand absteht (mit Zacken)
  function miniAwning(K, F, t0, t1, h0, h1, col, z, depth = 0.09) {
    const p0 = K.P(0, 0), p1 = K.P(F.n[0] * depth, F.n[1] * depth), ox = p1[0] - p0[0], oy = p1[1] - p0[1];
    const n = 6, d = (t1 - t0) / n, len = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]), r = Math.max(0.3, len * d * 0.5);
    for (let i = 0; i < n; i++) {
      const a = faceAt(F, t0 + i * d, h1), b = faceAt(F, t0 + (i + 1) * d, h1), c = faceAt(F, t0 + (i + 1) * d, h0), e = faceAt(F, t0 + i * d, h0);
      const fill = C(i & 1 ? '#fffaf0' : col);
      poly([a, b, [c[0] + ox, c[1] + oy], [e[0] + ox, e[1] + oy]], fill);
      const m = faceAt(F, t0 + (i + 0.5) * d, h0);
      circle(m[0] + ox, m[1] + oy, r, fill);
    }
  }

  // --- Kino -------------------------------------------------------------------
  // Glühbirnen-Buchstaben (5 Zeilen)
  const DOTS = {
    K: ['1001', '1010', '1100', '1010', '1001'],
    I: ['111', '010', '010', '010', '111'],
    N: ['1001', '1101', '1011', '1001', '1001'],
    O: ['0110', '1001', '1001', '1001', '0110'],
  };
  function bulbWord(F, word, t0, t1, h0, h1, col, r) {
    let total = -1;
    for (const ch of word) total += DOTS[ch][0].length + 1;
    const flip = F.Q[0] < F.P[0];                                   // Seite läuft auf dem Bildschirm von rechts nach links
    let c = 0;
    for (const ch of word) {
      const rows = DOTS[ch];
      for (let ry = 0; ry < 5; ry++) for (let cx = 0; cx < rows[ry].length; cx++) {
        if (rows[ry][cx] !== '1') continue;
        let t = t0 + (t1 - t0) * (c + cx + 0.5) / total;
        if (flip) t = t0 + t1 - t;
        const [x, y] = faceAt(F, t, h1 - (h1 - h0) * ry / 4);
        circle(x, y, r, col);
      }
      c += rows[0].length + 1;
    }
  }
  const POSTERS = [['#e8604f', '#ffd23f'], ['#5f8fe8', '#fff6e4'], ['#f28cb1', '#ffffff'], ['#58b36a', '#ffe27a'], ['#ff9f5a', '#3b2a4a']];
  function poster(F, t0, t1, h0, h1, i, z, on) {
    const [bg, fg] = POSTERS[i % POSTERS.length], d = (t1 - t0) * 0.14, hh = h1 - h0;
    faceQuad(F.P, F.Q, t0, t1, h0, h1, C('#f2c14e'));
    faceQuad(F.P, F.Q, t0 + d, t1 - d, h0 + 1 * z, h1 - 1 * z, on ? shade(bg, 0.25) : C(bg));
    const [cx, cy] = faceAt(F, (t0 + t1) / 2, h0 + hh * 0.62);
    circle(cx, cy, Math.max(0.3, hh * 0.13), on ? '#fffbe6' : C(fg));
    faceQuad(F.P, F.Q, t0 + d * 2, t1 - d * 2, h0 + hh * 0.18, h0 + hh * 0.27, on ? '#fffbe6' : C(fg));   // Titelzeile
    glowQuad(quadOf(F, t0, t1, h0, h1), 12 * z);
  }
  // Popcorn-Tüte (rot-weiß gestreift) mit Unterkante bei (x, y)
  function popcorn(x, y, z) {
    const h = 12 * z, wb = 3.6 * z, wt = 5.6 * z, top = y - h;
    for (let i = 0; i < 5; i++) {
      const k0 = i / 5, k1 = (i + 1) / 5;
      poly([[x - wt + 2 * wt * k0, top], [x - wt + 2 * wt * k1, top], [x - wb + 2 * wb * k1, y], [x - wb + 2 * wb * k0, y]], C(i % 2 ? '#fffaf0' : '#e8604f'));
    }
    [[-4, -0.6], [-1.6, -2.4], [1.4, -2.8], [4, -0.8], [0, -0.4], [-2.8, 0.6], [2.8, 0.4], [0.2, -4.2]].forEach(([dx, dy], i) =>
      circle(x + dx * z, top + dy * z, 2.1 * z, C(i % 3 ? '#fff6d2' : '#ffe08a')));
    kGlow(x, top, z, 18);
  }
  // Filmrolle auf dem Dach (Ständer, Rolle mit fünf Löchern, Filmstreifen, der sich aufs Dach legt)
  function filmReel(K, a, b, up, z, now) {
    const [bx, by] = K.P(a, b, up), r = 15 * z, cx = bx, cy = by - 23 * z, [ex, ey] = K.P(a + 0.55, b + 0.38, up);
    const strip = dy => { g.beginPath(); g.moveTo(cx + r * 0.55, cy + r * 0.55 + dy); g.bezierCurveTo(cx + r * 1.6, cy + r * 1.3 + dy, ex + 12 * z, ey - 12 * z + dy, ex, ey + dy); g.stroke(); };
    g.lineCap = 'butt';
    g.strokeStyle = C('#1d1622'); g.lineWidth = 6 * z; strip(0);                              // Filmstreifen mit Lochreihen
    g.strokeStyle = C('#6b5a86'); g.lineWidth = 2.4 * z; strip(0);
    g.strokeStyle = C('#e9e2f5'); g.lineWidth = 0.8 * z; g.setLineDash([1 * z, 1.2 * z]); strip(-2.1 * z); strip(2.1 * z); g.setLineDash([]);
    g.lineCap = 'round';
    kLine(K, [cx, cy], [bx - 7 * z, by], '#6d7380', 1.8); kLine(K, [cx, cy], [bx + 7 * z, by], '#6d7380', 1.8);
    circle(cx, cy, r, C('#6d7380'));
    circle(cx, cy, r * 0.88, C('#d5dae2'));
    const spin = now / 2600;
    for (let i = 0; i < 5; i++) { const w = spin + i * Math.PI * 2 / 5; circle(cx + Math.cos(w) * r * 0.52, cy + Math.sin(w) * r * 0.52, r * 0.2, C('#3b2a4a')); }
    circle(cx, cy, r * 0.17, C('#8d93a0')); circle(cx, cy, r * 0.07, C('#2a1d36'));
    g.strokeStyle = C('#ffffff'); g.lineWidth = 1.2 * z;
    g.beginPath(); g.arc(cx, cy, r * 0.78, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    kGlow(cx, cy, z, 34);
  }
  SHOP_ART.kino = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#3b2a4a', A = -0.14, HA = 0.8, HB = 0.86, H = 32, FRONT = A + HA;
    const parts = [[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: '#2a1d36', type: 'flat', entry: true, trim: on ? '#ff8fd0' : '#f2c14e' });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.27, 0.73, 0, F.H * 0.4, C('#241a2e'));                               // Eingang unter der Leuchtreklame
        windowOn(F.P, F.Q, 0.31, 0.48, 0, F.H * 0.33, z); windowOn(F.P, F.Q, 0.52, 0.69, 0, F.H * 0.33, z);
        for (const tt of [0.3, 0.5, 0.7]) faceQuad(F.P, F.Q, tt - 0.012, tt + 0.012, 0, F.H * 0.35, C('#f2c14e'));
        poster(F, 0.025, 0.12, F.H * 0.1, F.H * 0.66, 0, z, on); poster(F, 0.88, 0.975, F.H * 0.1, F.H * 0.66, 1, z, on);
        for (const tt of [0.22, 0.5, 0.78]) faceQuad(F.P, F.Q, tt - 0.012, tt + 0.012, F.H * 0.84, F.H * 0.96, C('#f2c14e'));   // Zierstreifen
      }
      for (const side of ['right', 'left', 'back']) {
        const S = B.faces[side];
        if (S) [[0.1, 0.26], [0.42, 0.58], [0.74, 0.9]].forEach(([t0, t1], i) => poster(S, t0, t1, S.H * 0.16, S.H * 0.68, i + 2, z, on));
      }
    }], [A, 0, () => filmReel(K, A - 0.2, 0.04, H, z, now)],
    [FRONT + 0.15, 0, () => {                                                                      // Leuchtreklame über dem Eingang
      const M = K.block({ a: FRONT + 0.15, b: 0, ha: 0.15, hb: 0.68, h: 15, lift: 12, wall: '#241a2e', type: 'flat', roof: '#f2c14e' });
      const F = M.faces.front;
      if (F) {
        glowQuad(quadOf(F, 0, 1, 0, F.H), 50 * z);
        const pulse = 0.5 + 0.5 * Math.sin(now / 520);
        bulbWord(F, 'KINO', 0.1, 0.9, F.H * 0.22, F.H * 0.78, on ? '#fffbe0' : C(mix('#ffc933', '#fff3b0', pulse)), 0.8 * z);
        chase(F, F.H * 0.08, 18, now, on, z); chase(F, F.H * 0.92, 18, now + 130, on, z);
      }
      for (const side of ['right', 'left']) { const S = M.faces[side]; if (S) chase(S, S.H * 0.5, 3, now, on, z); }
    }]];
    // Popcorn-Tüte als Schild an der Ecke, die man sieht
    const [pa, pb] = [[FRONT + 0.1, HB + 0.1], [FRONT + 0.1, -HB - 0.1], [A - HA - 0.1, HB + 0.1], [A - HA - 0.1, -HB - 0.1]]
      .reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);
    parts.push([pa, pb, () => { const top = kPost(K, pa, pb, 12, '#5a4a66', 1.3); popcorn(top[0], top[1], z); }]);
    K.scene(parts);
  };

  // --- Theater ----------------------------------------------------------------
  function maskShape(w, h) {
    g.beginPath();
    g.moveTo(-w / 2, -h * 0.3);
    g.quadraticCurveTo(0, -h * 0.62, w / 2, -h * 0.3);
    g.quadraticCurveTo(w * 0.56, h * 0.22, 0, h * 0.5);
    g.quadraticCurveTo(-w * 0.56, h * 0.22, -w / 2, -h * 0.3);
    g.closePath();
  }
  function mask(x, y, w, tilt, happy, face) {
    const h = w * 1.2, ink = C('#4a1019'), ey = -h * 0.08, ex = w * 0.2, er = w * 0.12;
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.save(); g.scale(1.16, 1.13); maskShape(w, h); g.fillStyle = C(GOLD); g.fill(); g.restore();
    maskShape(w, h); g.fillStyle = C(face); g.fill();
    g.strokeStyle = ink; g.lineWidth = w * 0.08; g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      g.beginPath();
      if (happy) g.arc(sx * ex, ey + er * 0.6, er, Math.PI * 1.15, Math.PI * 1.85);                 // lachende Augen
      else { g.moveTo(sx * ex * 0.55, ey); g.lineTo(sx * ex * 1.45, ey + er * 0.8); }              // hängende Augen
      g.stroke();
      if (!happy) { g.beginPath(); g.moveTo(sx * ex * 0.35, ey - er * 1.9); g.lineTo(sx * ex * 1.4, ey - er * 1.1); g.stroke(); }   // Brauen
    }
    g.fillStyle = ink; g.beginPath();
    if (happy) g.arc(0, h * 0.1, w * 0.24, 0.1, Math.PI - 0.1);                                        // Lachen
    else g.arc(0, h * 0.36, w * 0.2, Math.PI + 0.15, -0.15);                                          // Weinen
    g.closePath(); g.fill();
    if (happy) for (const sx of [-1, 1]) circle(sx * w * 0.3, h * 0.06, w * 0.08, C('#f5a0b0'));
    else ellipse(ex * 1.2, h * 0.12, w * 0.05, w * 0.08, C('#7fc4e6'));                               // Träne
    g.restore();
  }
  function masks(x, y, z, sc = 1) {
    const w = 15 * z * sc;
    mask(x + w * 0.42, y + w * 0.1, w, 0.3, false, '#e3def5');                                        // weinend (hinten)
    mask(x - w * 0.42, y - w * 0.04, w, -0.28, true, '#fff6e4');                                      // lachend
  }
  // Säule (rund, von vorn gleich): Schaft mit Schattenseite, goldenes Kapitell und goldener Fuß
  function column(K, a, b, up0, up1, z) {
    const [x, y0] = K.P(a, b, up0), y1 = y0 - (up1 - up0) * z, w = 1.8 * z;
    g.fillStyle = C('#f7ecd6'); g.fillRect(x - w, y1, 2 * w, y0 - y1);
    g.fillStyle = C('#dccbb0'); g.fillRect(x + w * 0.25, y1, w * 0.75, y0 - y1);
    g.fillStyle = C(GOLD); g.fillRect(x - w * 1.45, y1 - 1.2 * z, w * 2.9, 1.8 * z); g.fillRect(x - w * 1.3, y0 - 1.4 * z, w * 2.6, 1.4 * z);
  }
  SHOP_ART.theater = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#8e2a3a', ROOF = '#5c1a28', CURTAIN = '#d62f43';
    const A = -0.32, HA = 1.05, HB = 1.22, H = 34, RH = 18, FR = A + HA, PA = FR + 0.31;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: ROOF, roofH: RH, type: 'gable', ridge: 'a', entry: true, trim: GOLD });
      for (const sa of [1, -1]) {                                                                 // goldene Giebelkante
        if (K.facing(sa, 0) <= 0.01) continue;
        const ga = A + sa * HA, apex = K.P(ga, 0, H + RH);
        kLine(K, K.P(ga, -HB, H), apex, GOLD, 1.8); kLine(K, apex, K.P(ga, HB, H), GOLD, 1.8);
        if (sa > 0) for (let i = 1; i < 16; i++) {                                               // Lichterkette am Giebel
          const p = i < 8 ? lerp(K.P(ga, -HB, H + 1.5), apex, i / 8) : lerp(apex, K.P(ga, HB, H + 1.5), (i - 8) / 8);
          bulb(p[0], p[1] + 1.2 * z, 0.75 * z, i, now, on);
        }
      }
      const F = B.faces.front;
      if (F) {
        const [ox, oy] = faceAt(F, 0.5, (H + RH * 0.36) * z);                                        // Rundfenster im Giebel
        circle(ox, oy, 4.4 * z, C(GOLD)); circle(ox, oy, 3.3 * z, on ? '#ffd873' : C('#a8dcff'));
        kLine(K, [ox - 3.3 * z, oy], [ox + 3.3 * z, oy], GOLD, 0.6); kLine(K, [ox, oy - 3.3 * z], [ox, oy + 3.3 * z], GOLD, 0.6);
        kGlow(ox, oy, z, 14);
        for (const [t0, t1, hh] of [[0.27, 0.36, 0.4], [0.44, 0.56, 0.48], [0.64, 0.73, 0.4]]) {   // Türen hinter den Säulen
          faceQuad(F.P, F.Q, t0 - 0.012, t1 + 0.012, 0, F.H * (hh + 0.04), C(GOLD));
          faceQuad(F.P, F.Q, t0, t1, 0, F.H * hh, C('#4a1019'));
          windowOn(F.P, F.Q, t0 + 0.01, t1 - 0.01, F.H * (hh - 0.12), F.H * (hh - 0.03), z);
        }
        archWindow(F, 0.03, 0.105, F.H * 0.3, F.H * 0.64, z, GOLD, CURTAIN);
        archWindow(F, 0.895, 0.97, F.H * 0.3, F.H * 0.64, z, GOLD, CURTAIN);
      }
      for (const side of ['right', 'left', 'back']) {
        const S = B.faces[side];
        if (S) for (let i = 0; i < 5; i++) { const t0 = 0.08 + i * 0.172; archWindow(S, t0, t0 + 0.1, S.H * 0.3, S.H * 0.64, z, GOLD, CURTAIN); }
      }
    }], [A, 0, () => {                                                                             // Wahrzeichen: Masken auf dem Giebel
      const [mx, my] = K.P(FR, 0, H + RH + 10);
      masks(mx, my, z, 1.25);
      kGlow(mx, my, z, 36);
    }], [PA, 0, () => {                                                                            // Säulenvorbau mit Treppe und Leuchtschild
      K.block({ a: PA + 0.05, b: 0, ha: 0.34, hb: 0.98, h: 3, wall: '#e9dcc4', type: 'flat', roof: '#f5ecdc' });
      K.rect(PA - 0.28, -0.19, PA + 0.39, 0.19, C('#c0283a'), 3);                                 // roter Teppich
      [-0.74, -0.27, 0.27, 0.74].map(b => [PA + 0.2, b]).sort((p, q) => K.depth(...p) - K.depth(...q))
        .forEach(([a, b]) => column(K, a, b, 3, 21, z));
      const Pd = K.block({ a: PA, b: 0, ha: 0.3, hb: 0.98, h: 5, lift: 21, wall: GOLD, type: 'flat', roof: '#f5ecdc' });
      const F = Pd.faces.front;
      if (!F) return;
      chase(F, F.H * 0.5, 16, now, on, z, 0.7);                                                   // Lichterkette am Gebälk
      const SB = { P: K.P(PA + 0.28, -0.42), Q: K.P(PA + 0.28, 0.42) };                          // Schild mit Masken über dem Eingang
      poly(quadOf(SB, -0.05, 1.05, 25.5 * z, 39 * z), C(GOLD));
      poly(quadOf(SB, 0, 1, 26.5 * z, 38 * z), on ? '#6a1f2e' : C('#5c1a28'));
      for (let i = 0; i < 10; i++) { const [bx, by] = faceAt(SB, (i + 0.5) / 10, 38.4 * z); bulb(bx, by, 0.6 * z, i, now, on); }
      const [cx, cy] = faceAt(SB, 0.5, 32 * z);
      masks(cx, cy, z, 0.5);
      glowQuad(quadOf(SB, 0, 1, 26 * z, 39 * z), 40 * z);
    }]]);
  };

  // --- Konzerthalle -----------------------------------------------------------
  // Achtelnote: Kopf bei (x, y); grow > 0 zeichnet sie etwas dicker (für den dunklen Rand)
  function noteShape(x, y, z, fill, grow) {
    g.fillStyle = fill;
    g.beginPath(); g.ellipse(x, y, 6.2 * z + grow, 4.4 * z + grow, -0.4, 0, Math.PI * 2); g.fill();
    g.fillRect(x + 4 * z - grow, y - 30 * z - grow, 2.4 * z + 2 * grow, 29 * z + 2 * grow);
    const sx = x + 6.4 * z, sy = y - 30 * z;
    g.beginPath(); g.moveTo(sx - 1 * z - grow, sy - grow);
    g.bezierCurveTo(sx + 5 * z + grow, sy + 3 * z, sx + 12 * z + grow, sy + 9 * z, sx + 7 * z + grow, sy + 20 * z + grow);
    g.bezierCurveTo(sx + 8 * z, sy + 12 * z, sx + 4 * z, sy + 9.5 * z, sx - 1 * z - grow, sy + 8 * z + grow);
    g.closePath(); g.fill();
  }
  function musicNote(x, y, z, col = '#f2c14e', edge = '#a8771c', shine = '#fff1b8') {
    noteShape(x, y, z, C(edge), 1.1 * z);
    noteShape(x, y, z, C(col), 0);
    ellipse(x - 2 * z, y - 1.4 * z, 2.2 * z, 1.1 * z, C(shine));
    g.fillStyle = C(shine); g.fillRect(x + 4.4 * z, y - 28 * z, 0.7 * z, 22 * z);
  }
  SHOP_ART.konzerthalle = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), BRICK = '#9c4f3a', STONE = '#efe3cc', A = -0.1, HA = 1.3, HB = 1.35, H = 16;
    const GA = -0.2, GHA = 1.12, GHB = 1.18, GH = 17, TOP = H + GH, A0 = GA - GHA, A1 = GA + GHA, N = 20;
    const glass = on ? '#ffd873' : '#a9d6ee';
    const wave = k => TOP + 2 + (11 + 9 * k) * (1 - Math.cos(4 * Math.PI * k)) / 2;               // k: 0 hinten … 1 vorn, zwei Wellenberge
    const ak = k => A0 + (A1 - A0) * k;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: BRICK, roof: '#d8c6a6', type: 'flat', entry: true });
      for (const f of Object.values(B.faces)) {
        if (!f) continue;
        for (const k of [0.3, 0.52, 0.74]) faceQuad(f.P, f.Q, 0, 1, f.H * k, f.H * k + 0.6 * z, C('#b8664f'));   // Fugen
        faceQuad(f.P, f.Q, 0, 1, f.H - 2.4 * z, f.H, C(STONE));                                  // Gesims
      }
      const F = B.faces.front;
      if (F) for (const [t0, t1] of [[0.3, 0.4], [0.45, 0.55], [0.6, 0.7]]) archWindow(F, t0, t1, 0, F.H * 0.5, z, STONE);
      for (const side of ['right', 'left', 'back']) {
        const S = B.faces[side];
        if (S) for (let i = 0; i < 6; i++) { const t0 = 0.07 + i * 0.148; archWindow(S, t0, t0 + 0.07, S.H * 0.22, S.H * 0.5, z, STONE); }
      }
      // Gläserner Aufbau (nachts warm)
      const G = K.block({ a: GA, b: 0, ha: GHA, hb: GHB, h: GH, lift: H, wall: glass, type: 'none' });
      for (const f of Object.values(G.faces)) {
        if (!f) continue;
        if (!on) faceQuad(f.P, f.Q, 0.14, 0.24, 0, f.H, C('#e2f4fb'));                            // Spiegelung
        for (let i = 1; i < 10; i++) kLine(K, faceAt(f, i / 10, 0), faceAt(f, i / 10, f.H), '#ffffff', 0.7);
        kLine(K, faceAt(f, 0, f.H * 0.5), faceAt(f, 1, f.H * 0.5), '#ffffff', 0.7);
        glowQuad(quadOf(f, 0, 1, 0, f.H), 30 * z);
      }
      // Wellendach: Streifen von hinten nach vorn, dann die sichtbaren Enden (Glas unter der Welle, weißer Rand)
      const idx = [...Array(N).keys()];
      if (K.facing(1, 0) < 0) idx.reverse();
      for (const i of idx) {
        const k0 = i / N, k1 = (i + 1) / N, f0 = wave(k0), f1 = wave(k1);
        const sl = Math.max(-1, Math.min(1, (f1 - f0) / ((A1 - A0) / N) / 30)), [u, v] = K.turn(-sl, 0);
        const amt = (u < 0 ? -u * LIGHT.roofSun : u * LIGHT.roofShade) + (v < 0 ? -v * LIGHT.roofBack : 0);
        const lt = Math.max(0, Math.min(1, (amt + 0.3) / 0.42)), hf = Math.min(1, ((f0 + f1) / 2 - TOP) / 16);
        const col = mix('#86c6e8', '#ffffff', 0.3 + 0.45 * lt + 0.25 * hf);                              // Licht: weiß, Schatten: hellblau
        poly([K.P(ak(k0), -GHB, f0), K.P(ak(k1), -GHB, f1), K.P(ak(k1), GHB, f1), K.P(ak(k0), GHB, f0)], C(col));
      }
      for (const sb of [1, -1]) {
        if (K.facing(0, sb) <= 0.01) continue;
        const curve = [];
        for (let i = 0; i <= N; i++) curve.push(K.P(ak(i / N), sb * GHB, wave(i / N)));
        poly(curve.concat([K.P(A1, sb * GHB, TOP), K.P(A0, sb * GHB, TOP)]), on ? glass : K.wallCol(glass, [0, sb]));
        for (let i = 1; i < 10; i++) kLine(K, K.P(ak(i / 10), sb * GHB, TOP), K.P(ak(i / 10), sb * GHB, wave(i / 10) - 2.6), '#ffffff', 0.7);
        const rim = curve.map(p => [p[0], p[1] + 2.6 * z]).reverse();
        poly(curve.concat(rim), C('#f6fbff'));
        g.strokeStyle = C('#7fbfdc'); g.lineWidth = 0.8 * z; g.beginPath();
        rim.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
        glowQuad([K.P(A0, sb * GHB, TOP), K.P(A1, sb * GHB, TOP), K.P(A1, sb * GHB, wave(1)), K.P(A0, sb * GHB, wave(0))], 30 * z);
      }
      for (const sa of [1, -1]) {
        if (K.facing(sa, 0) <= 0.01) continue;
        const ea = sa > 0 ? A1 : A0, fe = wave(sa > 0 ? 1 : 0), E = { P: K.P(ea, -GHB * sa, TOP), Q: K.P(ea, GHB * sa, TOP) };
        faceQuad(E.P, E.Q, 0, 1, 0, (fe - TOP) * z, on ? glass : K.wallCol(glass, [sa, 0]));
        for (let i = 1; i < 10; i++) kLine(K, faceAt(E, i / 10, 0), faceAt(E, i / 10, (fe - TOP - 2.6) * z), '#ffffff', 0.7);
        faceQuad(E.P, E.Q, 0, 1, (fe - TOP - 2.6) * z, (fe - TOP) * z, C('#f6fbff'));
        glowQuad(quadOf(E, 0, 1, 0, (fe - TOP) * z), 30 * z);
      }
    }], [A, 0, () => {                                                                             // Wahrzeichen: goldene Achtelnote auf der Welle
      const [nx, ny0] = K.P(A0 + (A1 - A0) * 0.75, 0, wave(0.75) + 3), ny = ny0 + Math.sin(now / 900) * 1 * z;
      for (let i = 0; i < 2; i++) {                                                              // kleine Noten steigen auf
        const ph = (now / 3400 + i * 0.5) % 1;
        g.save(); g.globalAlpha *= Math.sin(ph * Math.PI);
        musicNote(nx + (i ? -15 : 17) * z + Math.sin(ph * 6 + i) * 2 * z, ny - 4 * z - ph * 24 * z, z * 0.38, i ? '#93c2e0' : '#f28cb1', i ? '#5f8fe8' : '#d45d8a', '#ffffff');
        g.restore();
      }
      musicNote(nx, ny, z);
      kGlow(nx + 4 * z, ny - 14 * z, z, 36);
    }]]);
  };

  // --- Kaufhaus ---------------------------------------------------------------
  function heart(x, y, r, col) {
    circle(x - r * 0.5, y - r * 0.2, r * 0.55, col); circle(x + r * 0.5, y - r * 0.2, r * 0.55, col);
    poly([[x - r * 1.03, y - r * 0.08], [x + r * 1.03, y - r * 0.08], [x, y + r * 1.05]], col);
  }
  // Riesige Einkaufstüte mit zwei Henkeln (hinterer Henkel zuerst, dann Tüte, dann vorderer)
  function shoppingBag(K, a, b, up, z, red) {
    const ha = 0.34, hb = 0.52, bh = 30, top = up + bh;
    const handle = ea => {
      const pts = [];
      for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(K.P(ea, b - 0.24 + 0.48 * k, top + Math.sin(Math.PI * k) * 13)); }
      g.lineCap = 'round';
      for (const [col, w] of [['#7a2320', 3], ['#fbe6c8', 1.7]]) {
        g.strokeStyle = C(col); g.lineWidth = w * z; g.beginPath();
        pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      }
    };
    const [back, front] = [a + ha, a - ha].sort((p, q) => K.depth(p, b) - K.depth(q, b));
    handle(back);
    const Bg = K.block({ a, b, ha, hb, h: bh, lift: up, wall: red, type: 'flat', roof: '#8f2b25' });
    const [tx, ty] = K.P(a, b, top);                                                            // Seidenpapier schaut heraus
    [['#ffd6e3', -5, 7], ['#c9f0e0', 0, 9], ['#fff3b0', 5, 6.5]].forEach(([c, dx, h]) =>
      poly([[tx + (dx - 3.5) * z, ty + 1 * z], [tx + (dx + 0.6) * z, ty - h * z], [tx + (dx + 3.5) * z, ty + 1 * z]], C(c)));
    for (const f of Object.values(Bg.faces)) {
      if (!f) continue;
      faceQuad(f.P, f.Q, 0, 1, f.H - 3.5 * z, f.H, C('#ec8177'));                                // umgeschlagener Rand
      const [hx, hy] = faceAt(f, 0.5, f.H * 0.45);
      heart(hx, hy, 4.6 * z, C('#fffaf0'));
    }
    handle(front);
  }
  function roofFlag(K, a, b, up, col, now, z) {
    const [x, y] = K.P(a, b, up), top = y - 17 * z, w = Math.sin(now / 420 + a * 3 + b) * 1.2 * z;
    kLine(K, [x, y], [x, top], '#8a8f99', 0.9);
    poly([[x, top], [x + 8 * z, top + 1 * z + w], [x + 8 * z, top + 6 * z + w], [x, top + 5.5 * z]], C(col));
    if (col === '#ffffff') poly([[x, top + 2 * z], [x + 8 * z, top + 2.8 * z + w], [x + 8 * z, top + 4 * z + w], [x, top + 3.4 * z]], C('#d9534a'));
  }
  // Schaufensterpuppe mit Kleid, Fuß bei (x, y)
  function dress(x, y, z, col) {
    circle(x, y - 8 * z, 1.1 * z, C('#f3d6bf'));
    poly([[x - 0.9 * z, y - 6.8 * z], [x + 0.9 * z, y - 6.8 * z], [x + 2.4 * z, y - 1.4 * z], [x - 2.4 * z, y - 1.4 * z]], C(col));
    kLine({ z }, [x, y - 1.4 * z], [x, y], '#8a8f99', 0.5);
  }
  SHOP_ART.kaufhaus = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#f5f0e6', RED = '#d9534a', A = -0.12, HA = 1.25, HB = 1.3, H = 58, FR = A + HA;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: '#e2dccf', type: 'flat', entry: true });
      const u = z;                                                                                // Höhen in px × z
      for (const f of Object.values(B.faces)) {
        if (!f) continue;
        for (const [h0, h1] of [[18, 25], [29, 36], [40, 46]]) {                                  // Glasbänder (3 Etagen über dem Erdgeschoss)
          windowOn(f.P, f.Q, 0.04, 0.96, h0 * u, h1 * u, z);
          for (let i = 1; i < 8; i++) faceQuad(f.P, f.Q, 0.04 + i * 0.115 - 0.004, 0.04 + i * 0.115 + 0.004, h0 * u, h1 * u, C('#fdfbf6'));
          faceQuad(f.P, f.Q, 0.04, 0.96, h0 * u - 1.1 * z, h0 * u, C(RED));
        }
        faceQuad(f.P, f.Q, 0, 1, 15 * u, 16.4 * u, C(RED));                                      // rote Linie über dem Erdgeschoss
        faceQuad(f.P, f.Q, 0, 1, 48 * u, H * u, C(RED));                                         // rotes Band oben
      }
      const S = shownFace(B);
      if (S) {
        wallText(S, 0.5, 53.2 * u, 'KAUFHAUS', 9, on ? '#fffbe6' : C('#ffffff'), z);
        glowQuad(quadOf(S, 0.18, 0.82, 49 * u, 57 * u), 26 * z);
      }
      const F = B.faces.front;
      if (F) {
        for (const [t0, t1] of [[0.05, 0.33], [0.67, 0.95]]) {                                   // Schaufenster mit Auslage
          faceQuad(F.P, F.Q, t0 - 0.012, t1 + 0.012, 1 * u, 13.6 * u, C(RED));
          windowOn(F.P, F.Q, t0, t1, 2 * u, 12.6 * u, z);
          ['#e8604f', '#5f8fe8', '#f2c14e'].forEach((c, i) => { const [px, py] = faceAt(F, t0 + (t1 - t0) * (i + 0.5) / 3, 2.4 * u); dress(px, py, z, c); });
        }
        faceQuad(F.P, F.Q, 0.4, 0.6, 0, 13.6 * u, C('#3a3a46'));                                  // Eingangsnische
      }
      for (const side of ['right', 'left', 'back']) if (B.faces[side]) K.wins(B, side, 6, 3 / H, 12.5 / H);
    }], [A, 0, () => {                                                                             // Dach: Einkaufstüte und Fahnen
      const items = [[A - 0.1, 0, () => shoppingBag(K, A - 0.1, 0, H, z, RED)]];
      for (const [sa, sb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const fa = A + sa * (HA - 0.08), fb = sb * (HB - 0.08);
        items.push([fa, fb, () => roofFlag(K, fa, fb, H, sa * sb > 0 ? RED : '#ffffff', now, z)]);
      }
      K.scene(items);
    }], [FR + 0.1, 0, () => {                                                                      // Drehtür
      const [dx, dy] = K.P(FR + 0.07, 0), rx = 6 * z, ry = 3 * z, hh = 12 * z;
      ellipse(dx, dy, rx, ry, C('#8a8f99'));
      g.fillStyle = on ? '#ffd873' : C('#bfe3f2'); g.fillRect(dx - rx, dy - hh, 2 * rx, hh);
      ellipse(dx, dy, rx, ry, on ? '#ffd873' : C('#bfe3f2'));
      glowQuad([[dx - rx, dy - hh], [dx + rx, dy - hh], [dx + rx, dy], [dx - rx, dy]], 16 * z);
      kLine(K, [dx, dy + ry * 0.2], [dx, dy - hh], '#8a8f99', 0.8);
      for (let i = 0; i < 4; i++) {
        const w = now / 1600 + i * Math.PI / 2, sn = Math.sin(w);
        if (sn < 0) continue;
        const wx = dx + Math.cos(w) * rx, wy = dy + sn * ry;
        kLine(K, [wx, wy], [wx, wy - hh], '#8a8f99', 0.8); kLine(K, [dx, dy - hh], [wx, wy - hh], '#8a8f99', 0.6);
      }
      ellipse(dx, dy - hh, rx * 1.12, ry * 1.12, C('#b8433b'));
      ellipse(dx, dy - hh - 1.3 * z, rx * 1.12, ry * 1.12, C(RED));
    }], [FR + 0.17, 0, () => {                                                                     // rote Markise über dem Eingang
      const Aw = K.block({ a: FR + 0.17, b: 0, ha: 0.17, hb: 0.52, h: 2.4, lift: 15, wall: RED, type: 'flat', roof: RED });
      for (let i = 1; i < 6; i += 2) K.rect(FR, -0.52 + i * 0.52 / 3, FR + 0.34, -0.52 + (i + 1) * 0.52 / 3, C('#fffaf0'), 17.4);
      const F = Aw.faces.front;
      if (F) for (let i = 0; i < 8; i++) { const m = faceAt(F, (i + 0.5) / 8, 0); circle(m[0], m[1], 1.4 * z, C(i & 1 ? '#fffaf0' : RED)); }
    }]]);
  };

  // --- Einkaufspassage --------------------------------------------------------
  SHOP_ART.passage = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#f7dcc6', ROOF = '#4f9a90', IRON = '#2f7a73', GOLDL = '#e9c46a';
    const RA = -0.05, RHA = 0.9, RH = 22;
    const AWN = ['#f28cb1', '#7fd1ae', '#ffd23f', '#b79be8', '#ff9f5a', '#5fb3e8'];
    const glass = on ? '#ffe3a3' : '#cfeaf2';
    const row = side => () => {                                                                  // Ladenzeile links bzw. rechts
      const B = K.block({ a: RA, b: side * 1.45, ha: RHA, hb: 0.5, h: RH, wall: WALL, roof: ROOF, roofH: 8, type: 'gable', ridge: 'a' });
      const inner = side < 0 ? 'right' : 'left', outer = side < 0 ? 'left' : 'right';
      const F = B.faces.front;
      if (F) {
        windowOn(F.P, F.Q, 0.12, 0.6, F.H * 0.1, F.H * 0.44, z);
        faceQuad(F.P, F.Q, 0.68, 0.88, 0, F.H * 0.44, C(DOOR_COL));
        miniAwning(K, F, 0.08, 0.92, F.H * 0.47, F.H * 0.6, AWN[side < 0 ? 4 : 5], z);
        K.wins(B, 'front', 2, 0.68, 0.88);
      }
      const I = B.faces[inner];
      if (I) {
        for (let k = 0; k < 2; k++) {
          const t0 = 0.06 + k * 0.47;
          windowOn(I.P, I.Q, t0 + 0.04, t0 + 0.37, I.H * 0.1, I.H * 0.42, z);
          miniAwning(K, I, t0, t0 + 0.41, I.H * 0.45, I.H * 0.58, AWN[(side < 0 ? 0 : 2) + k], z);
        }
        K.wins(B, inner, 4, 0.68, 0.86);
      }
      if (B.faces[outer]) { K.wins(B, outer, 4, 0.14, 0.44); K.wins(B, outer, 4, 0.62, 0.84); }
      if (B.faces.back) K.wins(B, 'back', 2, 0.3, 0.7);
    };
    const arcade = () => {                                                                       // Gang mit Glasdach
      K.block({ a: RA, b: 0, ha: RHA, hb: 0.95, h: 0.8, wall: '#cdbb9c', type: 'flat', roof: '#efe3cc' });
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        if (!((i + j) & 1)) continue;
        const a0 = RA - RHA + i * RHA / 3, b0 = -0.95 + j * 0.475;
        K.rect(a0, b0, a0 + RHA / 3, b0 + 0.475, C('#d9c7a6'), 0.8);
      }
      const E = K.block({ a: RA - RHA + 0.1, b: 0, ha: 0.1, hb: 0.95, h: RH, wall: WALL, type: 'flat', roof: ROOF });   // Laden am Ende
      const F = E.faces.front;
      if (F) for (let k = 0; k < 3; k++) {
        const t0 = 0.05 + k * 0.31;
        windowOn(F.P, F.Q, t0 + 0.03, t0 + 0.27, F.H * 0.1, F.H * 0.42, z);
        miniAwning(K, F, t0, t0 + 0.3, F.H * 0.45, F.H * 0.58, AWN[(k + 1) % AWN.length], z);
      }
      if (E.faces.back) K.wins(E, 'back', 3, 0.3, 0.7);
      g.save(); g.globalAlpha *= 0.58;
      K.block({ a: RA, b: 0, ha: RHA + 0.05, hb: 0.95, h: 0.5, lift: RH, wall: glass, roof: glass, roofH: 13, type: 'barrel', ridge: 'a', over: 1 });
      g.restore();
      g.strokeStyle = C(IRON); g.lineWidth = 1.1 * z; g.lineCap = 'round';
      for (let i = 0; i <= 5; i++) {                                                             // Eisenrippen
        const a = RA - RHA - 0.05 + i * (RHA + 0.05) * 2 / 5;
        g.beginPath();
        for (let k = 0; k <= 10; k++) { const th = Math.PI * k / 10, p = K.P(a, Math.cos(th) * 0.95, RH + 0.5 + Math.sin(th) * 13); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.stroke();
      }
      kLine(K, K.P(RA - RHA - 0.05, 0, RH + 13.5), K.P(RA + RHA + 0.05, 0, RH + 13.5), IRON, 1.1);
      glowQuad([K.P(RA - RHA, -0.8, RH + 6), K.P(RA + RHA, -0.8, RH + 6), K.P(RA + RHA, 0.8, RH + 6), K.P(RA - RHA, 0.8, RH + 6)], 44 * z);
    };
    const arch = () => {                                                                         // Wahrzeichen: Eingangsbogen mit Schriftzug
      const SP = 24, RO = 20, RI = 16, BO = 1.0, BI = 0.8;
      const ring = aa => {
        const pts = [K.P(aa, BO, 0)];
        for (let i = 0; i <= 12; i++) { const th = Math.PI * i / 12; pts.push(K.P(aa, Math.cos(th) * BO, SP + Math.sin(th) * RO)); }
        pts.push(K.P(aa, -BO, 0), K.P(aa, -BI, 0));
        for (let i = 12; i >= 0; i--) { const th = Math.PI * i / 12; pts.push(K.P(aa, Math.cos(th) * BI, SP + Math.sin(th) * RI)); }
        pts.push(K.P(aa, BI, 0));
        return pts;
      };
      const [far, near] = [0.9, 0.98].sort((p, q) => K.depth(p, 0) - K.depth(q, 0));
      poly(ring(far), C(shade(IRON, -0.25)));
      const lun = [K.P(0.94, BI, SP)];                                                           // Glasfächer im Bogen
      for (let i = 0; i <= 12; i++) { const th = Math.PI * i / 12; lun.push(K.P(0.94, Math.cos(th) * BI, SP + Math.sin(th) * RI)); }
      poly(lun, on ? '#ffe3a3' : C('#dff1f7'));
      glowQuad([K.P(0.94, -BI, SP), K.P(0.94, BI, SP), K.P(0.94, BI, SP + RI), K.P(0.94, -BI, SP + RI)], 26 * z);
      const hub = K.P(0.94, 0, SP);
      for (let i = 1; i < 6; i++) { const th = Math.PI * i / 6; kLine(K, hub, K.P(0.94, Math.cos(th) * BI, SP + Math.sin(th) * RI), IRON, 0.7); }
      kLine(K, K.P(0.94, -BI, SP), K.P(0.94, BI, SP), IRON, 1.4);
      const lamp = K.P(0.94, 0, SP - 6);                                                          // Laterne unter dem Bogen
      kLine(K, K.P(0.94, 0, SP), lamp, IRON, 0.6);
      circle(lamp[0], lamp[1], 1.8 * z, on ? '#fff1b0' : C(GOLDL));
      kGlow(lamp[0], lamp[1], z, 20);
      const front = ring(near);
      poly(front, C(IRON));
      g.strokeStyle = C(GOLDL); g.lineWidth = 0.9 * z; g.beginPath();
      front.slice(1, 14).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      const PL = { P: K.P(0.99, -0.6), Q: K.P(0.99, 0.6) };                                       // Schild „PASSAGE“
      poly(quadOf(PL, -0.04, 1.04, 38.2 * z, 50.8 * z), C(GOLDL));
      poly(quadOf(PL, 0, 1, 39 * z, 50 * z), C('#1f5c56'));
      wallText(PL, 0.5, 44.6 * z, 'PASSAGE', 7.2, on ? '#fff3c4' : C('#ffd98a'), z);
      glowQuad(quadOf(PL, 0, 1, 39 * z, 50 * z), 22 * z);
      const [cx, cy] = K.P(0.99, 0, 57);                                                          // Uhr obendrauf
      circle(cx, cy - 6.4 * z, 1.3 * z, C(GOLDL));
      circle(cx, cy, 5.2 * z, C(GOLDL)); circle(cx, cy, 4.2 * z, on ? '#fff6d6' : C('#fffaf0'));
      kLine(K, [cx, cy], [cx, cy - 3 * z], '#3a3a46', 0.6); kLine(K, [cx, cy], [cx + 2 * z, cy + 0.6 * z], '#3a3a46', 0.6);
      kGlow(cx, cy, z, 14);
    };
    K.scene([[RA, -1.45, row(-1)], [RA, 1.45, row(1)], [RA, 0, arcade], [5, 0, arch]]);
  };
})();
