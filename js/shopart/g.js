'use strict';
// Ladenbilder, Gruppe g (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, hangSign, faceAt)
// Kino, Theater, Konzerthalle, Kaufhaus, Passage, Aquarium: feste Markenfarben.
// Block 35: an die alten Gebäude angeglichen – helle, warme Wände, klar-farbige Dächer, Schatten (ART_SHADOW),
// keine Schrift, wenig Kleinkram, und jedes hat eine eigene Bauform, an der man es erkennt:
// Kino = Saal mit Satteldach hinter einer Stufenfassade mit Glühbirnen-Vordach, Theater = Giebelhaus mit Säulenvorbau,
// Konzerthalle = Wellendach auf Glas, Kaufhaus = flacher Block mit Fensterbändern, rotem Vordach und Treppenhaus-Risalit,
// Passage = zwei Ladenzeilen mit Glastonne und Eingangsbogen, Aquarium = flaches Glasbecken auf einem Sockel.
// Alles in einer Klammer, damit keine Namen mit den anderen Gruppen-Dateien zusammenstoßen.
(function () {
  const lightsOn = () => night > 0.15 && isLive();

  // --- Helfer ---------------------------------------------------------------
  // Vier Ecken eines Stücks einer Seite (für Nachtlicht)
  const quadOf = (F, t0, t1, h0, h1) => {
    const a = lerp(F.P, F.Q, t0), b = lerp(F.P, F.Q, t1);
    return [[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]];
  };
  // Glühbirne, die mit den Nachbarn im Lauflicht blinkt
  function bulb(x, y, r, i, now, on) {
    const hot = (i + Math.floor(now / 260)) % 3 !== 0;
    circle(x, y, r, hot ? (on ? '#fffbe0' : C('#fff3b0')) : (on ? '#ffc94a' : C('#e9a23b')));
  }
  function chase(F, up, n, now, on, z, r = 1) {
    for (let i = 0; i < n; i++) { const [x, y] = faceAt(F, (i + 0.5) / n, up); bulb(x, y, r * z, i, now, on); }
  }
  // Bogenfenster: heller Rahmen, Glas (nachts warm)
  function archPts(F, t0, t1, h0, h1, rise) {
    const pts = [faceAt(F, t0, h0), faceAt(F, t1, h0)];
    for (let i = 0; i <= 6; i++) { const k = i / 6; pts.push(faceAt(F, t1 + (t0 - t1) * k, h1 + Math.sin(Math.PI * k) * rise)); }
    return pts;
  }
  function archWindow(F, t0, t1, h0, h1, z, frame) {
    const on = lightsOn(), len = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]), rise = len * (t1 - t0) * 0.42, d = (t1 - t0) * 0.16;
    poly(archPts(F, t0 - d, t1 + d, Math.max(0, h0 - 1 * z), h1, rise + 1.2 * z), C(frame));
    poly(archPts(F, t0, t1, h0, h1, rise), on ? '#ffd873' : C('#a8dcff'));
    glowQuad(quadOf(F, t0, t1, h0, h1 + rise), 16 * z);
  }
  // Gestreifte Markise flach an der Wand über einem Stück der Seite (t0 … t1), unten eine dunklere Kante
  function awning(F, t0, t1, h0, h1, col, z, n = 4) {
    const d = (t1 - t0) / n;
    for (let i = 0; i < n; i++) faceQuad(F.P, F.Q, t0 + i * d, t0 + (i + 1) * d, h0, h1, C(i & 1 ? '#fffaf0' : col));
    faceQuad(F.P, F.Q, t0, t1, h0 - 1 * z, h0, C(shade(col, -0.2)));
  }
  // Die Ecke (aus einer Liste), die man am besten sieht – dort stehen Schilder und Figuren
  const nearest = (K, pts) => pts.reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);

  // --- Kino (2×2) -------------------------------------------------------------
  // Saal mit Satteldach hinter einer Fassade mit Stufengiebel (Art déco), davor ein Vordach mit Glühbirnen-Leiste,
  // Plakate neben der Glastür und eine Popcorn-Tüte an der Ecke. Wand hell-lila, Dach und Akzente lila.
  const KINO = { WALL: '#e6e0ff', ROOF: '#b07ad6' };
  function kinoPoster(F, t0, t1, h0, h1, col, z, on) {
    faceQuad(F.P, F.Q, t0, t1, h0, h1, C(KINO.ROOF));
    const d = (t1 - t0) * 0.16, e = (h1 - h0) * 0.1;
    faceQuad(F.P, F.Q, t0 + d, t1 - d, h0 + e, h1 - e, on ? shade(col, 0.3) : C(col));
    glowQuad(quadOf(F, t0, t1, h0, h1), 12 * z);
  }
  // Popcorn-Tüte (rot-weiß gestreift) mit Unterkante bei (x, y)
  function popcorn(x, y, z) {
    const h = 10 * z, wb = 3.2 * z, wt = 5 * z, top = y - h;
    for (let i = 0; i < 4; i++) {
      const k0 = i / 4, k1 = (i + 1) / 4;
      poly([[x - wt + 2 * wt * k0, top], [x - wt + 2 * wt * k1, top], [x - wb + 2 * wb * k1, y], [x - wb + 2 * wb * k0, y]], C(i % 2 ? '#fffaf0' : '#e8705f'));
    }
    [[-3, -0.4], [0, -1.8], [3, -0.4], [-1.4, -3.2], [1.6, -3]].forEach(([dx, dy], i) =>
      circle(x + dx * z, top + dy * z, 2.2 * z, C(i % 2 ? '#fff6d2' : '#ffe066')));
  }
  SHOP_ART.kino = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), { WALL, ROOF } = KINO, DOOR = shade(ROOF, -0.3);
    const FA = 0.42, FHA = 0.22, FHB = 0.62, FH = 22, FR = FA + FHA;
    const parts = [[-0.33, 0, () => {                                                                // Saal
      const B = K.block({ a: -0.33, b: 0, ha: 0.5, hb: 0.58, h: 18, wall: WALL, roof: ROOF, roofH: 10, type: 'gable', ridge: 'a', over: 1.08 });
      ['right', 'left', 'back'].forEach((side, i) => { const S = B.faces[side]; if (S) kinoPoster(S, 0.38, 0.62, S.H * 0.22, S.H * 0.72, ['#ffe066', '#5f8fe8', '#f28cb1'][i], z, on); });
    }], [FA, 0, () => {                                                                              // Foyer mit Stufengiebel
      const B = K.block({ a: FA, b: 0, ha: FHA, hb: FHB, h: FH, wall: WALL, roof: shade(WALL, -0.06), type: 'flat', entry: true });
      K.block({ a: FR - 0.07, b: 0, ha: 0.07, hb: 0.4, h: 4, lift: FH, wall: WALL, type: 'flat', roof: ROOF });   // Stufengiebel
      K.block({ a: FR - 0.07, b: 0, ha: 0.07, hb: 0.18, h: 3.5, lift: FH + 4, wall: WALL, type: 'flat', roof: ROOF });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.34, 0.66, 0, 12 * z, C(DOOR));                                         // Glastür
        windowOn(F.P, F.Q, 0.37, 0.49, 0, 11 * z, z); windowOn(F.P, F.Q, 0.51, 0.63, 0, 11 * z, z);
        kinoPoster(F, 0.07, 0.25, 2.5 * z, 13 * z, '#ffe066', z, on);
        kinoPoster(F, 0.75, 0.93, 2.5 * z, 13 * z, '#5f8fe8', z, on);
      }
    }], [FR + 0.09, 0, () => {                                                                       // Vordach mit Glühbirnen-Leiste
      const M = K.block({ a: FR + 0.09, b: 0, ha: 0.09, hb: 0.46, h: 5, lift: 12, wall: ROOF, type: 'flat', roof: shade(ROOF, 0.35) });
      const F = M.faces.front;
      if (F) { chase(F, F.H * 0.5, 9, now, on, z); glowQuad(quadOf(F, 0, 1, 0, F.H), 40 * z); }
      for (const side of ['right', 'left']) { const S = M.faces[side]; if (S) chase(S, S.H * 0.5, 1, now, on, z); }
    }]];
    // Popcorn-Tüte auf einem Pfosten an der Ecke, die man sieht (der eine Gegenstand vor der Tür)
    const [pa, pb] = nearest(K, [[FR + 0.24, 0.86], [FR + 0.24, -0.86], [-0.92, 0.84], [-0.92, -0.84]]);
    parts.push([pa, pb, () => { const top = kPost(K, pa, pb, 10, '#8a8f99', 1.2); popcorn(top[0], top[1], z); }]);
    K.scene(parts);
  };
  ART_SHADOW.kino = [24, 0.3];

  // --- Theater (3×3) ----------------------------------------------------------
  // Giebelhaus (Giebel zur Tür) mit Rundfenster, davor ein Säulenvorbau mit Dreiecksgiebel; im Giebelfeld zwei kleine
  // Masken, auf der Treppe ein Teppich. Wand zart rosa, Dach himbeerrot, Säulen cremeweiß.
  const TH = { WALL: '#ffe3e0', ROOF: '#d94f8a', STONE: '#fff4dc' };
  function maskShape(w, h) {
    g.beginPath();
    g.moveTo(-w / 2, -h * 0.3);
    g.quadraticCurveTo(0, -h * 0.62, w / 2, -h * 0.3);
    g.quadraticCurveTo(w * 0.56, h * 0.22, 0, h * 0.5);
    g.quadraticCurveTo(-w * 0.56, h * 0.22, -w / 2, -h * 0.3);
    g.closePath();
  }
  function mask(x, y, w, tilt, happy, face, lw) {
    const h = w * 1.2, ink = C('#7a2a4f'), ey = -h * 0.08, ex = w * 0.22, er = w * 0.13;
    g.save(); g.translate(x, y); g.rotate(tilt);
    g.save(); g.scale(1.16, 1.13); maskShape(w, h); g.fillStyle = C(TH.ROOF); g.fill(); g.restore();
    maskShape(w, h); g.fillStyle = C(face); g.fill();
    g.strokeStyle = ink; g.lineWidth = lw; g.lineCap = 'round';
    for (const sx of [-1, 1]) {
      g.beginPath();
      if (happy) g.arc(sx * ex, ey + er * 0.6, er, Math.PI * 1.15, Math.PI * 1.85);                 // lachende Augen
      else { g.moveTo(sx * ex * 0.55, ey); g.lineTo(sx * ex * 1.45, ey + er * 0.8); }              // hängende Augen
      g.stroke();
    }
    g.fillStyle = ink; g.beginPath();
    if (happy) g.arc(0, h * 0.1, w * 0.24, 0.1, Math.PI - 0.1);                                        // Lachen
    else g.arc(0, h * 0.36, w * 0.2, Math.PI + 0.15, -0.15);                                          // Weinen
    g.closePath(); g.fill();
    g.restore();
  }
  function masks(x, y, z, sc) {
    const w = 15 * z * sc, lw = 0.8 * z;
    mask(x + w * 0.42, y + w * 0.1, w, 0.3, false, '#e6e0ff', lw);                                   // weinend (hinten)
    mask(x - w * 0.42, y - w * 0.04, w, -0.28, true, '#fffaf0', lw);                                  // lachend
  }
  // Säule (rund, von vorn gleich): Schaft mit Schattenseite, Kapitell und Fuß etwas breiter
  function column(K, a, b, up0, up1, z) {
    const [x, y0] = K.P(a, b, up0), y1 = y0 - (up1 - up0) * z, w = 1.8 * z;
    g.fillStyle = C('#fffaf0'); g.fillRect(x - w, y1, 2 * w, y0 - y1);
    g.fillStyle = C('#eadfcc'); g.fillRect(x + w * 0.25, y1, w * 0.75, y0 - y1);
    g.fillStyle = C(shade(TH.STONE, -0.06)); g.fillRect(x - w * 1.45, y1 - 1.2 * z, w * 2.9, 2 * z); g.fillRect(x - w * 1.3, y0 - 1.6 * z, w * 2.6, 1.6 * z);
  }
  SHOP_ART.theater = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), { WALL, ROOF, STONE } = TH;
    const A = -0.3, HA = 0.8, HB = 0.9, H = 24, RH = 14, FR = A + HA, PA = FR + 0.26;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: ROOF, roofH: RH, type: 'gable', ridge: 'a', over: 1.08, entry: true });
      const F = B.faces.front;
      if (F) {
        const [ox, oy] = faceAt(F, 0.5, (H + RH * 0.46) * z);                                         // Rundfenster im Giebel
        circle(ox, oy, 3.6 * z, C('#fffaf0')); circle(ox, oy, 2.6 * z, on ? '#ffd873' : C('#a8dcff'));
        kGlow(ox, oy, z, 12);
        for (const [t0, t1] of [[0.3, 0.39], [0.455, 0.545], [0.61, 0.7]]) faceQuad(F.P, F.Q, t0, t1, 0, F.H * 0.5, C(shade(ROOF, -0.25)));   // Türen hinter den Säulen
      }
      for (const side of ['right', 'left', 'back']) {
        const S = B.faces[side];
        if (S) for (let i = 0; i < 3; i++) { const t0 = 0.15 + i * 0.27; archWindow(S, t0, t0 + 0.16, S.H * 0.28, S.H * 0.6, z, '#fffaf0'); }
      }
    }], [PA, 0, () => {                                                                             // Säulenvorbau mit Treppe und Giebel
      K.block({ a: PA + 0.02, b: 0, ha: 0.26, hb: 0.84, h: 2.5, wall: STONE, type: 'flat', roof: shade(STONE, 0.3) });
      K.rect(PA - 0.22, -0.17, PA + 0.28, 0.17, C(ROOF), 2.5);                                        // Teppich
      [-0.7, -0.24, 0.24, 0.7].map(b => [PA + 0.14, b]).sort((p, q) => K.depth(...p) - K.depth(...q))
        .forEach(([a, b]) => column(K, a, b, 2.5, 16, z));
      const Pd = K.block({ a: PA, b: 0, ha: 0.24, hb: 0.84, h: 3, lift: 16, wall: STONE, roof: ROOF, roofH: 8.5, type: 'gable', ridge: 'a', over: 1.05 });
      const F = Pd.faces.front;
      if (F) { const [cx, cy] = faceAt(F, 0.5, (3 + 8.5 * 0.36) * z); masks(cx, cy, z, 0.34); }
    }]]);
  };
  ART_SHADOW.theater = [32, 0.45];

  // --- Konzerthalle -----------------------------------------------------------
  // Heller Sockel mit Bogenfenstern und blauem Gesims, darauf ein gläserner Saal mit weißem Wellendach.
  SHOP_ART.konzerthalle = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#fff4dc', BAND = '#5f8fe8', A = -0.1, HA = 1.3, HB = 1.35, H = 16;
    const GA = -0.2, GHA = 1.12, GHB = 1.18, GH = 17, TOP = H + GH, A0 = GA - GHA, A1 = GA + GHA, N = 20;
    const glass = on ? '#ffd873' : '#b8d8ff';
    const wave = k => TOP + 2 + (11 + 9 * k) * (1 - Math.cos(4 * Math.PI * k)) / 2;               // k: 0 hinten … 1 vorn, zwei Wellenberge
    const ak = k => A0 + (A1 - A0) * k;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: '#e4f1ff', type: 'flat', entry: true });
      for (const f of Object.values(B.faces)) if (f) faceQuad(f.P, f.Q, 0, 1, f.H - 2.6 * z, f.H, C(BAND));   // Gesims
      const F = B.faces.front;
      if (F) for (const [t0, t1] of [[0.3, 0.4], [0.45, 0.55], [0.6, 0.7]]) archWindow(F, t0, t1, 0, F.H * 0.5, z, '#ffffff');
      for (const side of ['right', 'left', 'back']) {
        const S = B.faces[side];
        if (S) for (let i = 0; i < 4; i++) { const t0 = 0.1 + i * 0.22; archWindow(S, t0, t0 + 0.1, S.H * 0.2, S.H * 0.5, z, '#ffffff'); }
      }
      // Gläserner Aufbau (nachts warm)
      const G = K.block({ a: GA, b: 0, ha: GHA, hb: GHB, h: GH, lift: H, wall: glass, type: 'none' });
      for (const f of Object.values(G.faces)) {
        if (!f) continue;
        if (!on) faceQuad(f.P, f.Q, 0.14, 0.26, 0, f.H, C('#e4f1ff'));                            // Spiegelung
        for (let i = 1; i < 5; i++) kLine(K, faceAt(f, i / 5, 0), faceAt(f, i / 5, f.H), '#ffffff', 1);
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
        const col = mix('#8fb8ee', '#ffffff', 0.3 + 0.45 * lt + 0.25 * hf);                              // Licht: weiß, Schatten: hellblau
        poly([K.P(ak(k0), -GHB, f0), K.P(ak(k1), -GHB, f1), K.P(ak(k1), GHB, f1), K.P(ak(k0), GHB, f0)], C(col));
      }
      for (const sb of [1, -1]) {
        if (K.facing(0, sb) <= 0.01) continue;
        const curve = [];
        for (let i = 0; i <= N; i++) curve.push(K.P(ak(i / N), sb * GHB, wave(i / N)));
        poly(curve.concat([K.P(A1, sb * GHB, TOP), K.P(A0, sb * GHB, TOP)]), on ? glass : K.wallCol(glass, [0, sb]));
        for (let i = 1; i < 5; i++) kLine(K, K.P(ak(i / 5), sb * GHB, TOP), K.P(ak(i / 5), sb * GHB, wave(i / 5) - 2.6), '#ffffff', 1);
        const rim = curve.map(p => [p[0], p[1] + 2.6 * z]).reverse();
        poly(curve.concat(rim), C('#f6fbff'));
        g.strokeStyle = C('#8fb8ee'); g.lineWidth = 0.9 * z; g.beginPath();
        rim.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
        glowQuad([K.P(A0, sb * GHB, TOP), K.P(A1, sb * GHB, TOP), K.P(A1, sb * GHB, wave(1)), K.P(A0, sb * GHB, wave(0))], 30 * z);
      }
      for (const sa of [1, -1]) {
        if (K.facing(sa, 0) <= 0.01) continue;
        const ea = sa > 0 ? A1 : A0, fe = wave(sa > 0 ? 1 : 0), E = { P: K.P(ea, -GHB * sa, TOP), Q: K.P(ea, GHB * sa, TOP) };
        faceQuad(E.P, E.Q, 0, 1, 0, (fe - TOP) * z, on ? glass : K.wallCol(glass, [sa, 0]));
        for (let i = 1; i < 5; i++) kLine(K, faceAt(E, i / 5, 0), faceAt(E, i / 5, (fe - TOP - 2.6) * z), '#ffffff', 1);
        faceQuad(E.P, E.Q, 0, 1, (fe - TOP - 2.6) * z, (fe - TOP) * z, C('#f6fbff'));
        glowQuad(quadOf(E, 0, 1, 0, (fe - TOP) * z), 30 * z);
      }
    }]]);
  };
  ART_SHADOW.konzerthalle = [34, 0.15];

  // --- Kaufhaus (3×3) ---------------------------------------------------------
  // Breites Warenhaus mit Mansarddach (EG, OG, Dachgeschoss): unten große Schaufenster unter einem durchgehenden
  // Vordach, in der Mitte ein vorspringender Risalit mit Glastür, hohem Fenster, Herz-Zeichen und eigenem Mansardhut.
  // Davor ein gepflasterter Vorplatz. Wand creme, Dach und Vordach korallenrot.
  function heart(x, y, r, col) {
    circle(x - r * 0.5, y - r * 0.2, r * 0.55, col); circle(x + r * 0.5, y - r * 0.2, r * 0.55, col);
    poly([[x - r * 1.03, y - r * 0.08], [x + r * 1.03, y - r * 0.08], [x, y + r * 1.05]], col);
  }
  // Kleid im Schaufenster (ohne Ständer), Saum bei (x, y)
  function dress(x, y, z, col) {
    circle(x, y - 6 * z, 1.2 * z, C('#f3d6bf'));
    poly([[x - 1.2 * z, y - 4.8 * z], [x + 1.2 * z, y - 4.8 * z], [x + 2.6 * z, y], [x - 2.6 * z, y]], C(col));
  }
  SHOP_ART.kaufhaus = function (K, s, now, x, y, t) {
    const z = K.z, WALL = '#fff4dc', RED = '#e8705f', A = -0.25, HA = 0.88, HB = 1.08, H = 21, FR = A + HA, RA = FR - 0.1;
    if (groundPart(() => {                                                                       // Vorplatz: helles Pflaster
      const E = 1.47, a0 = FR - 0.03, na = 4, nb = 12, da = (E - a0) / na, db = 2 * E / nb;
      K.rect(a0, -E, E, E, C('#e6dfd0'));
      for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) if ((i + j) & 1) K.rect(a0 + i * da, -E + j * db, a0 + (i + 1) * da, -E + (j + 1) * db, C('#ddd3c1'));
      K.rect(a0, -0.34, E, 0.34, C('#efe8da'));                                                  // heller Weg zur Tür
    })) return;
    K.scene([[A, 0, () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, roof: RED, roofH: 27, type: 'mansard', over: 1.06, entry: true });
      K.wins(B, 'front', 6, 13 / H, 18.5 / H, 0.04, 0.96, [2, 3]);
      for (const side of ['right', 'left', 'back']) { K.wins(B, side, 5, 13 / H, 18.5 / H); K.wins(B, side, 4, 2.5 / H, 9.5 / H); }
      const F = B.faces.front;
      if (F) for (const [t0, t1] of [[0.06, 0.33], [0.67, 0.94]]) {                                    // Schaufenster mit Kleidern
        faceQuad(F.P, F.Q, t0 - 0.012, t1 + 0.012, 1 * z, 10 * z, C(RED));
        windowOn(F.P, F.Q, t0, t1, 2 * z, 9.2 * z, z);
        ['#5f8fe8', '#ffe066'].forEach((c, i) => { const [px, py] = faceAt(F, t0 + (t1 - t0) * (i + 1) / 3, 2.4 * z); dress(px, py, z, c); });
      }
    }], [RA, 0, () => {                                                                           // Risalit mit Glastür und Herz
      const R = K.block({ a: RA, b: 0, ha: 0.2, hb: 0.36, h: 31, wall: WALL, roof: RED, roofH: 13, type: 'mansard', over: 1.1 });
      const F = R.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.26, 0.74, 0, 10 * z, C(shade(RED, -0.15)));                              // Glastür
        windowOn(F.P, F.Q, 0.3, 0.49, 0, 9.2 * z, z); windowOn(F.P, F.Q, 0.51, 0.7, 0, 9.2 * z, z);
        windowOn(F.P, F.Q, 0.3, 0.7, 13 * z, 20 * z, z);                                                // hohes Fenster
        const [hx, hy] = faceAt(F, 0.5, 25 * z);
        circle(hx, hy, 3.8 * z, C(RED)); heart(hx, hy + 0.2 * z, 2 * z, C('#fffaf0'));
      }
      for (const side of ['right', 'left']) K.wins(R, side, 1, 13 / 30, 20 / 30);
    }], [FR + 0.14, 0, () => {                                                                     // Vordach über dem Erdgeschoss
      K.block({ a: FR + 0.14, b: 0, ha: 0.12, hb: 1.0, h: 1.8, lift: 10.2, wall: RED, type: 'flat', roof: shade(RED, 0.25) });
    }]]);
  };
  ART_SHADOW.kaufhaus = [30, 0.38];

  // --- Einkaufspassage (2×4) --------------------------------------------------
  // Zwei Ladenzeilen mit Satteldach, dazwischen ein Gang mit Glastonne; vorn ein Eingangsbogen, hinten ein Laden.
  // Wand creme, Dächer und Eisen petrol, bunte Markisen.
  SHOP_ART.passage = function (K, s, now, x, y, t) {
    const z = K.z, on = lightsOn(), WALL = '#fff4dc', ROOF = '#2f9e9e', IRON = '#2f9e9e';
    const RA = -0.05, RHA = 0.82, RH = 15, RB = 1.38, RHB = 0.43, GB = RB - RHB;
    const AWN = ['#f28cb1', '#e9a23b', '#5f8fe8', '#b07ad6', '#e8705f', '#7cb342'];
    const glass = on ? '#ffe3a3' : '#cfeaf2';
    const row = side => () => {                                                                  // Ladenzeile links bzw. rechts
      const B = K.block({ a: RA, b: side * RB, ha: RHA, hb: RHB, h: RH, wall: WALL, roof: ROOF, roofH: 9, type: 'gable', ridge: 'a', over: 1.06 });
      const inner = side < 0 ? 'right' : 'left', outer = side < 0 ? 'left' : 'right';
      const F = B.faces.front;
      if (F) {
        windowOn(F.P, F.Q, 0.12, 0.56, F.H * 0.1, F.H * 0.5, z);
        faceQuad(F.P, F.Q, 0.66, 0.88, 0, F.H * 0.56, C(DOOR_COL));
        awning(F, 0.08, 0.6, F.H * 0.56, F.H * 0.74, AWN[side < 0 ? 4 : 5], z);
      }
      const I = B.faces[inner];
      if (I) for (let k = 0; k < 2; k++) {
        const t0 = 0.08 + k * 0.46;
        windowOn(I.P, I.Q, t0 + 0.03, t0 + 0.35, I.H * 0.1, I.H * 0.5, z);
        awning(I, t0, t0 + 0.38, I.H * 0.56, I.H * 0.74, AWN[(side < 0 ? 0 : 2) + k], z);
      }
      if (B.faces[outer]) K.wins(B, outer, 3, 0.35, 0.72);
      if (B.faces.back) K.wins(B, 'back', 1, 0.35, 0.72);
    };
    const arcade = () => {                                                                       // Gang mit Glasdach
      K.block({ a: RA, b: 0, ha: RHA, hb: GB, h: 0.8, wall: '#e6dfd0', type: 'flat', roof: '#efe8da' });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (!((i + j) & 1)) continue;
        const a0 = RA - RHA + i * RHA / 2, b0 = -GB + j * GB / 2;
        K.rect(a0, b0, a0 + RHA / 2, b0 + GB / 2, C('#e2d6c0'), 0.8);
      }
      const E = K.block({ a: RA - RHA + 0.1, b: 0, ha: 0.1, hb: GB, h: RH, wall: WALL, type: 'flat', roof: ROOF });   // Laden am Ende
      const F = E.faces.front;
      if (F) for (let k = 0; k < 2; k++) {
        const t0 = 0.1 + k * 0.44;
        windowOn(F.P, F.Q, t0 + 0.03, t0 + 0.33, F.H * 0.1, F.H * 0.5, z);
        awning(F, t0, t0 + 0.36, F.H * 0.56, F.H * 0.74, AWN[1 + k * 2], z);
      }
      if (E.faces.back) K.wins(E, 'back', 2, 0.35, 0.72);
      g.save(); g.globalAlpha *= 0.58;
      K.block({ a: RA, b: 0, ha: RHA + 0.04, hb: GB, h: 0.5, lift: RH, wall: glass, roof: glass, roofH: 11, type: 'barrel', ridge: 'a', over: 1 });
      g.restore();
      g.strokeStyle = C(IRON); g.lineWidth = 1.2 * z; g.lineCap = 'round';
      for (let i = 0; i <= 3; i++) {                                                             // Eisenrippen
        const a = RA - RHA - 0.04 + i * (RHA + 0.04) * 2 / 3;
        g.beginPath();
        for (let k = 0; k <= 10; k++) { const th = Math.PI * k / 10, p = K.P(a, Math.cos(th) * GB, RH + 0.5 + Math.sin(th) * 11); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.stroke();
      }
      kLine(K, K.P(RA - RHA - 0.04, 0, RH + 11.5), K.P(RA + RHA + 0.04, 0, RH + 11.5), IRON, 1.2);
      glowQuad([K.P(RA - RHA, -0.8, RH + 5), K.P(RA + RHA, -0.8, RH + 5), K.P(RA + RHA, 0.8, RH + 5), K.P(RA - RHA, 0.8, RH + 5)], 40 * z);
    };
    const arch = () => {                                                                         // Eingangsbogen (Eisen) mit Glasfächer
      const SP = 13, RO = 16, RI = 12.5, BO = GB + 0.02, BI = GB - 0.16, AA = RA + RHA + 0.06;
      const ring = aa => {
        const pts = [K.P(aa, BO, 0)];
        for (let i = 0; i <= 12; i++) { const th = Math.PI * i / 12; pts.push(K.P(aa, Math.cos(th) * BO, SP + Math.sin(th) * RO)); }
        pts.push(K.P(aa, -BO, 0), K.P(aa, -BI, 0));
        for (let i = 12; i >= 0; i--) { const th = Math.PI * i / 12; pts.push(K.P(aa, Math.cos(th) * BI, SP + Math.sin(th) * RI)); }
        pts.push(K.P(aa, BI, 0));
        return pts;
      };
      const [far, near] = [AA - 0.04, AA + 0.04].sort((p, q) => K.depth(p, 0) - K.depth(q, 0));
      poly(ring(far), C(shade(IRON, -0.2)));
      const lun = [K.P(AA, BI, SP)];                                                             // Glasfächer im Bogen
      for (let i = 0; i <= 12; i++) { const th = Math.PI * i / 12; lun.push(K.P(AA, Math.cos(th) * BI, SP + Math.sin(th) * RI)); }
      poly(lun, on ? '#ffe3a3' : C('#e4f1ff'));
      glowQuad([K.P(AA, -BI, SP), K.P(AA, BI, SP), K.P(AA, BI, SP + RI), K.P(AA, -BI, SP + RI)], 26 * z);
      const hub = K.P(AA, 0, SP);
      for (let i = 1; i < 4; i++) { const th = Math.PI * i / 4; kLine(K, hub, K.P(AA, Math.cos(th) * BI, SP + Math.sin(th) * RI), IRON, 1); }
      kLine(K, K.P(AA, -BI, SP), K.P(AA, BI, SP), IRON, 1.4);
      poly(ring(near), C(IRON));
    };
    K.scene([[RA, -RB, row(-1)], [RA, RB, row(1)], [RA, 0, arcade], [RA + RHA + 0.1, 0, arch]]);
  };
  ART_SHADOW.passage = [18, 0.14];

  // --- Aquarium (3×3) ---------------------------------------------------------
  // Ein flaches, eckiges Glasbecken auf einem Sockel mit Bullaugen: blaues Wasser, Sand, Steine, Wasserpflanzen, Korallen,
  // eine Schatzkiste, bunte Fische, die hin und her schwimmen, und aufsteigende Luftblasen. Davor der Eingang.
  // Gezeichnet wird das Becken von hinten nach vorn: Rückwände (innen), Sandboden, Inhalt, dann die vorderen Glasscheiben
  // (durchsichtig getönt), Wasseroberfläche, Glanzstreifen und Rahmen. Nachts leuchtet das Wasser sanft blau.
  // Block 35: Becken kleiner und niedriger (vorher 124 px hoch, jetzt so hoch wie das Rathaus-Dach).
  const AQ = { A: -0.2, HA: 0.75, HB: 0.85, PH: 7, TH: 19, SD: 3, WL: 16 };   // Becken: Mitte, halbe Maße; Sockel-, Becken-, Sand-, Wasserhöhe (px)
  const FL = AQ.PH + AQ.SD;                                                     // Höhe des Sandbodens
  const at = (u, v) => [AQ.A + u * AQ.HA, v * AQ.HB];                           // Stelle im Becken: u, v von −1 bis 1
  // Fische: Bahn entlang a oder b (Mitte u/v, halbe Länge amp in Beckenmaßen), Höhe über dem Sand, Tempo, Farben
  const FISH = [
    { ax: 'b', u: 0.6, v: -0.08, amp: 0.55, up: 3.5, per: 5200, ph: 0, s: 3.2, body: '#ff8a3d', fin: '#e0602a', band: '#ffffff' },   // Clownfisch
    { ax: 'b', u: -0.4, v: 0.2, amp: 0.55, up: 9, per: 6100, ph: 2.1, s: 3, body: '#ffe066', fin: '#e9a23b' },
    { ax: 'a', u: -0.03, v: -0.54, amp: 0.45, up: 6.5, per: 4700, ph: 1.2, s: 3.2, body: '#5f8fe8', fin: '#ffe066' },
    { ax: 'a', u: 0.02, v: 0.58, amp: 0.5, up: 2.5, per: 5600, ph: 4, s: 2.6, body: '#f28cb1', fin: '#d94f8a' },
    { ax: 'b', u: 0.35, v: 0.27, amp: 0.5, up: 7.5, per: 4300, ph: 5.2, s: 2.4, body: '#e8705f', fin: '#c9553f', band: '#ffe3d6' },
  ];
  const SCHOOL = [[0, 0], [5, 2], [5.5, -2], [10, 0.6]];                               // kleiner Schwarm: Abstand hinter dem ersten, Höhe (px)
  // Fisch mit Blick nach dir (1 = rechts, −1 = links auf dem Bildschirm), Mitte (x, y), Größe s (px)
  function fish(x, y, s, dir, f, wag = 0) {
    const tx = x - dir * s * 0.8;
    poly([[tx + dir * s * 0.1, y], [tx - dir * s * 0.8, y - s * (0.62 + wag)], [tx - dir * s * 0.6, y], [tx - dir * s * 0.8, y + s * (0.62 - wag)]], C(f.fin));   // Schwanz
    poly([[x - dir * s * 0.45, y - s * 0.4], [x + dir * s * 0.3, y - s * 0.5], [x - dir * s * 0.35, y - s * 1.0]], C(f.fin));   // Rückenflosse
    ellipse(x, y, s, s * 0.62, C(f.body));
    if (f.band) for (const k of [0.2, -0.35]) ellipse(x + dir * k * s, y, s * 0.15, s * 0.55, C(f.band));
    circle(x + dir * s * 0.55, y - s * 0.14, s * 0.2, C('#ffffff'));
    circle(x + dir * s * 0.6, y - s * 0.14, s * 0.1, C('#1d2733'));
  }
  // Wasserpflanze: drei wogende Halme
  function seaweed(K, u, v, hgt, col, now, ph) {
    const [x, y] = K.P(...at(u, v), FL), z = K.z;
    g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * 1.6 * z, h = (hgt - Math.abs(i - 1) * 2.5) * z, sw = Math.sin(now / 1300 + ph + i * 0.8) * 1.4 * z;
      g.strokeStyle = C(i === 1 ? col : shade(col, i ? -0.14 : 0.12)); g.lineWidth = 1.4 * z;
      g.beginPath(); g.moveTo(x + dx, y);
      g.bezierCurveTo(x + dx + 1.8 * z, y - h * 0.35, x + dx - 1.8 * z + sw * 0.5, y - h * 0.68, x + dx + sw, y - h);
      g.stroke();
    }
  }
  // Ast-Koralle
  function branchCoral(K, u, v, col) {
    const [x, y] = K.P(...at(u, v), FL), z = K.z * 0.7;
    g.strokeStyle = C(col); g.lineCap = 'round';
    for (const [x0, y0, x1, y1, w] of [[0, 0, 0, -7, 1.9], [0, -2.5, -3.6, -7.5, 1.5], [0, -3.5, 3.4, -9, 1.5], [0, -6, -0.6, -11, 1.3]]) {
      g.lineWidth = w * z; g.beginPath(); g.moveTo(x + x0 * z, y + y0 * z); g.lineTo(x + x1 * z, y + y1 * z); g.stroke();
    }
  }
  // runde Koralle (Hügel)
  function roundCoral(K, u, v, col) {
    const [x, y] = K.P(...at(u, v), FL), z = K.z * 0.75;
    g.beginPath(); g.ellipse(x, y, 5 * z, 5 * z, 0, Math.PI, 0); g.fillStyle = C(col); g.fill();
    ellipse(x, y, 5 * z, 1.4 * z, C(shade(col, -0.1)));
  }
  function stones(K, u, v, sc) {
    const [x, y] = K.P(...at(u, v), FL), z = K.z * sc;
    ellipse(x - 2.4 * z, y - 1.3 * z, 3.2 * z, 2.2 * z, C('#8f9aa6'));
    ellipse(x + 2.2 * z, y - 0.9 * z, 2.5 * z, 1.7 * z, C('#a9b3bd'));
    ellipse(x - 0.4 * z, y - 2.6 * z, 2.1 * z, 1.6 * z, C('#b9c2cb'));
  }
  function starfish(K, u, v) {
    const [x, y] = K.P(...at(u, v), FL), z = K.z * 0.75, pts = [];
    for (let i = 0; i < 10; i++) { const w = -Math.PI / 2 + i * Math.PI / 5, r = (i & 1 ? 1.8 : 4.6) * z; pts.push([x + Math.cos(w) * r, y + Math.sin(w) * r * 0.5]); }
    poly(pts, C('#ff8a3d'));
  }
  function chest(K, u, v) {
    const [a, b] = at(u, v), Bx = K.block({ a, b, ha: 0.08, hb: 0.11, h: 3.5, lift: FL, wall: '#a0714d', type: 'flat', roof: '#c9955f' });
    for (const f of Object.values(Bx.faces)) if (f) faceQuad(f.P, f.Q, 0, 1, f.H * 0.5, f.H * 0.75, C('#ffe066'));
  }
  function bubbles(K, u, v, up0, now, ph, n = 3) {
    const z = K.z, up1 = AQ.PH + AQ.WL - 1, [a, b] = at(u, v);
    for (let i = 0; i < n; i++) {
      const k = (now / 2800 + ph + i / n) % 1, [x, y] = K.P(a, b, up0 + (up1 - up0) * k);
      const r = (0.8 + k * 0.6) * z, bx = x + Math.sin(k * 9 + ph * 5) * 1 * z;
      g.save(); g.globalAlpha *= 0.75; circle(bx, y, r, C('#eaf8ff')); g.restore();
    }
  }
  // Glasbecken mit Sockel und allem darin
  function aquariumTank(K, now, on) {
    const { A, HA, HB, PH, TH, WL } = AQ, z = K.z, wl = PH + WL, FRAME = '#3e7fd0';
    const Pl = K.block({ a: A, b: 0, ha: HA + 0.12, hb: HB + 0.12, h: PH, wall: '#e4f1ff', type: 'flat', roof: '#d6e6f5' });   // Sockel
    for (const [side, f] of Object.entries(Pl.faces)) {
      if (!f) continue;
      faceQuad(f.P, f.Q, 0, 1, f.H - 1.6 * z, f.H, C('#5f8fe8'));                                      // blaues Band
      for (const tt of side === 'front' ? [0.14, 0.86] : [0.2, 0.4, 0.6, 0.8]) {                          // Bullaugen
        const [bx, by] = faceAt(f, tt, f.H * 0.42);
        circle(bx, by, 2 * z, C(FRAME)); circle(bx, by, 1.3 * z, on ? '#bfeaff' : C('#b8d8ff'));
        glowQuad([[bx - z, by - z], [bx + z, by - z], [bx + z, by + z], [bx - z, by + z]], 8 * z, 'blue');
      }
    }
    const W = (sa, sb, up) => K.P(A + sa * HA, sb * HB, up);
    const faceOf = (f, up = PH) => ({ P: W(...f.p, up), Q: W(...f.q, up), n: f.n });
    const shown = [], hidden = [];
    for (const f of Object.values(FACES)) (K.facing(...f.n) > 0.01 ? shown : hidden).push(f);
    // 1. Rückwände von innen: Wasser (unten dunkler), darüber Glas
    for (const f of hidden) {
      const F = faceOf(f), m0 = lerp(F.P, F.Q, 0.5), grad = g.createLinearGradient(m0[0], m0[1], m0[0], m0[1] - WL * z);
      grad.addColorStop(0, C(on ? '#3f9ad8' : '#3a8fd0')); grad.addColorStop(1, C(on ? '#94dcf7' : '#7fcdf0'));
      poly(quadOf(F, 0, 1, 0, WL * z), grad);
      g.save(); g.globalAlpha *= 0.35; poly(quadOf(F, 0, 1, WL * z, TH * z), C('#e8f7fd')); g.restore();
      kLine(K, F.P, [F.P[0], F.P[1] - TH * z], FRAME, 0.9); kLine(K, [F.P[0], F.P[1] - TH * z], [F.Q[0], F.Q[1] - TH * z], FRAME, 1.1);
    }
    // 2. Sandboden
    K.rect(A - HA, -HB, A + HA, HB, C('#a9d8f0'), FL);                                              // Boden, durchs Wasser gesehen
    for (const [u, v, r] of [[-0.45, -0.25, 0.34], [0.35, 0.45, 0.3], [-0.5, 0.6, 0.22], [0.45, -0.55, 0.22]]) K.oval(...at(u, v), r, C('#f3dca4'), FL);   // Sandhügel
    // 3. Inhalt, von hinten nach vorn
    const parts = [
      [-0.72, -0.73, () => stones(K, -0.72, -0.73, 0.8)], [0.76, 0.73, () => stones(K, 0.76, 0.73, 0.6)],
      [-0.77, 0.58, () => seaweed(K, -0.77, 0.58, 11, '#58b36a', now, 0)], [-0.58, -0.27, () => seaweed(K, -0.58, -0.27, 13, '#7cb342', now, 2)],
      [0.76, -0.73, () => seaweed(K, 0.76, -0.73, 9, '#58b36a', now, 4)], [0.11, 0.81, () => seaweed(K, 0.11, 0.81, 10, '#7cb342', now, 1)],
      [0.57, 0.15, () => branchCoral(K, 0.57, 0.15, '#f28cb1')], [-0.26, 0.73, () => roundCoral(K, -0.26, 0.73, '#ff8a3d')],
      [-0.03, -0.81, () => branchCoral(K, -0.03, -0.81, '#e8705f')],
      [0.81, 0.35, () => starfish(K, 0.81, 0.35)],
      [-0.21, -0.46, () => { chest(K, -0.21, -0.46); bubbles(K, -0.21, -0.46, FL + 4, now, 0.2); }],
      [-0.81, 0.15, () => bubbles(K, -0.81, 0.15, FL, now, 0.6)],
    ].map(([u, v, fn]) => [...at(u, v), fn]);
    const dirOf = (a, b, up, da, db) => (K.P(a + da * 0.05, b + db * 0.05, up)[0] >= K.P(a, b, up)[0] ? 1 : -1);
    for (const f of FISH) {
      const ph = now / f.per + f.ph, sn = Math.sin(ph), cs = Math.cos(ph);
      const [a, b] = at(f.u + (f.ax === 'a' ? f.amp * sn : 0), f.v + (f.ax === 'b' ? f.amp * sn : 0)), up = FL + f.up + Math.sin(ph * 2.7) * 0.8;
      const dir = dirOf(a, b, up, f.ax === 'a' ? cs : 0, f.ax === 'b' ? cs : 0);
      parts.push([a, b, () => { const [fx, fy] = K.P(a, b, up); fish(fx, fy, f.s * z, dir, f, Math.sin(now / 160 + f.ph * 3) * 0.2); }]);
    }
    {                                                                                                  // kleiner silberner Schwarm
      const ph = now / 3900, [a, b] = at(-0.6, Math.sin(ph) * 0.6), up = FL + 6 + Math.sin(ph * 2) * 1.5;
      const dir = dirOf(a, b, up, 0, Math.cos(ph)), sf = { body: '#e4f1ff', fin: '#a9c4dc' };
      parts.push([a, b, () => {
        const [lx, ly] = K.P(a, b, up);
        for (const [back, du] of SCHOOL) fish(lx - dir * back * z, ly - du * z, 1.6 * z, dir, sf, Math.sin(now / 120 + du) * 0.2);
      }]);
    }
    K.scene(parts);
    // 4. Vordere Scheiben: Sand im Schnitt, Wasser getönt, darüber Glas
    for (const f of shown) {
      const F = faceOf(f);
      poly(quadOf(F, 0, 1, 0, AQ.SD * z), K.wallCol('#e9c98a', f.n));
      const m0 = lerp(F.P, F.Q, 0.5), grad = g.createLinearGradient(m0[0], m0[1], m0[0], m0[1] - WL * z);
      grad.addColorStop(0, K.wallCol(on ? '#3f9ad8' : '#3a8fd0', f.n)); grad.addColorStop(1, K.wallCol(on ? '#94dcf7' : '#7fcdf0', f.n));
      g.save();
      g.globalAlpha *= 0.42; poly(quadOf(F, 0, 1, 0, WL * z), grad);
      g.globalAlpha = 0.2; poly(quadOf(F, 0, 1, WL * z, TH * z), K.wallCol('#e8f7fd', f.n));
      g.restore();
      glowQuad(quadOf(F, 0.1, 0.9, AQ.SD * z, WL * z), 34 * z, 'blue');
    }
    // 5. Wasseroberfläche
    g.save(); g.globalAlpha *= 0.3;
    poly([W(-1, -1, wl), W(1, -1, wl), W(1, 1, wl), W(-1, 1, wl)], C(on ? '#9fe3ff' : '#5fb8ec'));
    g.restore();
    { const [cx, cy] = K.P(A, 0, wl); glowQuad([[cx - 4 * z, cy - 2 * z], [cx + 4 * z, cy - 2 * z], [cx + 4 * z, cy + 2 * z], [cx - 4 * z, cy + 2 * z]], 30 * z, 'blue'); }
    // 6. Glanzstreifen und Rahmen der vorderen Scheiben
    for (const f of shown) {
      const F = faceOf(f);
      g.save(); g.globalAlpha *= 0.3;
      poly([faceAt(F, 0.1, 3 * z), faceAt(F, 0.17, 3 * z), faceAt(F, 0.27, (TH - 3) * z), faceAt(F, 0.2, (TH - 3) * z)], '#ffffff');
      g.restore();
      kLine(K, faceAt(F, 0, WL * z), faceAt(F, 1, WL * z), '#e8f9ff', 0.9);                              // Wasserlinie
      for (const p of [F.P, F.Q]) kLine(K, p, [p[0], p[1] - TH * z], FRAME, 1.3);
      kLine(K, F.P, F.Q, FRAME, 1.5);
      kLine(K, [F.P[0], F.P[1] - TH * z], [F.Q[0], F.Q[1] - TH * z], '#5f8fe8', 1.6);
    }
  }
  // Eingang vor dem Becken: Glastür, darüber ein rundes Schild mit Fisch
  function aquariumEntry(K, PA, on) {
    const z = K.z, B = K.block({ a: PA, b: 0, ha: 0.24, hb: 0.5, h: 13, wall: '#f5f5f5', type: 'flat', roof: '#5f8fe8', entry: true, trim: '#5f8fe8' });
    const F = B.faces.front;
    if (F) {
      faceQuad(F.P, F.Q, 0.34, 0.66, 0, F.H * 0.62, C('#3e7fd0'));
      windowOn(F.P, F.Q, 0.37, 0.49, 0, F.H * 0.56, z); windowOn(F.P, F.Q, 0.51, 0.63, 0, F.H * 0.56, z);
      windowOn(F.P, F.Q, 0.08, 0.26, F.H * 0.28, F.H * 0.62, z); windowOn(F.P, F.Q, 0.74, 0.92, F.H * 0.28, F.H * 0.62, z);
      const [px, py] = faceAt(F, 0.5, F.H * 0.8);                                                          // Schild mit Fisch
      circle(px, py, 3.4 * z, C('#5f8fe8')); circle(px, py, 2.7 * z, C('#e4f1ff'));
      fish(px + 0.4 * z, py, 1.5 * z, 1, { body: '#ff8a3d', fin: '#e0602a' });
    }
    for (const side of ['right', 'left']) K.wins(B, side, 1, 0.3, 0.62);
  }
  SHOP_ART.aquarium = function (K, s, now, x, y, t, ha, hb) {
    const on = lightsOn(), PA = AQ.A + AQ.HA + 0.34;
    const parts = [[AQ.A, 0, () => aquariumTank(K, now, on)], [PA, 0, () => aquariumEntry(K, PA, on)]];
    for (const sb of [-1, 1]) parts.push([PA + 0.3, sb * 0.72, () => { const [lx, ly] = K.P(PA + 0.3, sb * 0.72); lampPost(lx, ly, K.z, 14); }]);
    K.scene(parts);
  };
  ART_SHADOW.aquarium = [22, 0.45];

  GROUND_TYPES.add('kaufhaus');                                                                  // Vorplatz (groundPart)
})();
