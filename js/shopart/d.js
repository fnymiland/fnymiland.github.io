'use strict';
// Ladenbilder, Gruppe d (Block 32/35) – trägt sich in SHOP_ART und ART_SHADOW ein (siehe draw-shops.js: hangSign, faceAt).
// Block 35: an die alten Gebäude angeglichen – helle Wände, klar-farbige Dächer, Schatten, kein Kleinkram, keine Schrift,
// und je Laden eine eigene Bauform, an der man ihn erkennt:
// Nudelbar (zweistufiges Pagodendach mit Eckspitzen), Konditorei (Zuckerbäckerhaus: Giebel mit Zuckerguss, Rundfenster,
// Schornstein), Chocolaterie (kleines Stadtpalais: Flachdach mit Attika, Rundbogenfenster, Mittelvorbau), Spielzeugladen
// (Knusperhäuschen: steiles Satteldach mit weitem Überstand, Gaube, bunte Fensterläden).
// Das Symbol hängt jeweils klein im Ausleger-Schild an der Hausecke (hangSign).
// Alles in einer Klammer: die Hilfsfunktionen sollen nicht mit denen der anderen Gruppen zusammenstoßen.
(() => {
  const TAU = Math.PI * 2;
  const lit = () => night > 0.15 && isLive();
  function oval(x, y, rx, ry, rot, col) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = col; g.fill(); }
  const faceLen = F => Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]);
  // Rundbogen in der Wandebene: unten gerade (h0), oben ein Halbrund bis h1
  function archPts(F, t0, t1, h0, h1) {
    const half = faceLen(F) * (t1 - t0) / 2, rise = Math.min(half * 0.9, (h1 - h0) * 0.5), spring = h1 - rise, tc = (t0 + t1) / 2;
    const pts = [faceAt(F, t0, h0), faceAt(F, t1, h0)];
    for (let i = 0; i <= 12; i++) { const th = Math.PI * i / 12; pts.push(faceAt(F, tc + (t1 - t0) / 2 * Math.cos(th), spring + rise * Math.sin(th))); }
    return pts;
  }
  // Rundbogenfenster (leuchtet nachts wie windowOn), optional mit Rahmen in einer Farbe
  function archWin(F, t0, t1, h0, h1, z, frame = null) {
    if (frame) { const d = 1 * z / faceLen(F); poly(archPts(F, t0 - d, t1 + d, h0 - 1 * z, h1 + 1 * z), C(frame)); }
    poly(archPts(F, t0, t1, h0, h1), lit() ? '#ffd873' : C('#a8dcff'));
    const a = faceAt(F, t0, h0), b = faceAt(F, t1, h0);
    glowQuad([a, b, [b[0], b[1] - (h1 - h0)], [a[0], a[1] - (h1 - h0)]], 18 * z);
  }
  // Fenster mit zwei Fensterläden daneben (Breite sw in Anteilen der Seite)
  function shutterWin(F, t0, t1, h0, h1, col, z, sw = 0.11) {
    faceQuad(F.P, F.Q, t0 - sw, t0, h0, h1, C(col));
    faceQuad(F.P, F.Q, t1, t1 + sw, h0, h1, C(col));
    windowOn(F.P, F.Q, t0, t1, h0, h1, z);
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Nudelbar: helles Haus mit zweistufigem Pagodendach (unten breite Traufe, oben ein kleines Obergeschoss mit
  // steilerem Dach), hochgebogene Eckspitzen, rote Eckpfosten, Noren-Vorhang an der Tür, zwei Papierlaternen.
  // ---------------------------------------------------------------------------------------------------------------
  const N_WALL = '#ffe3e0', N_ROOF = '#e8705f', N_RED = '#e8604f';
  // Eckspitzen: hochgebogene Traufecken. Vor dem Block zeichnen – das Dach deckt den Ansatz, nur die Spitze bleibt stehen.
  function pagodaTips(K, a, b, ha, hb, up, over, roof, rise) {
    const S4 = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
    const E = S4.map(([sa, sb]) => K.P(a + sa * ha * over, b + sb * hb * over, up));
    S4.forEach(([sa, sb], i) => {
      const e = E[i], l1 = lerp(e, E[(i + 3) % 4], 0.3), l2 = lerp(e, E[(i + 1) % 4], 0.3);
      const T = K.P(a + sa * ha * over * 1.22, b + sb * hb * over * 1.22, up + rise);
      const n = K.facing(sa, 0) >= K.facing(0, sb) ? [sa, 0] : [0, sb];
      g.beginPath(); g.moveTo(l1[0], l1[1]); g.quadraticCurveTo(e[0], e[1], T[0], T[1]); g.quadraticCurveTo(e[0], e[1], l2[0], l2[1]); g.closePath();
      g.fillStyle = K.roofCol(roof, n); g.fill();
    });
  }
  function paperLantern(x, y, z, L) {                                       // (x, y): Aufhängung unter der Traufe
    kLine({ z }, [x, y], [x, y + 2 * z], '#6b4f3a', 0.8);
    oval(x, y + 5 * z, 2.6 * z, 3.2 * z, 0, L ? '#ffb56b' : C(N_RED));
    g.fillStyle = C('#6b4f3a'); g.fillRect(x - 1.6 * z, y + 1.6 * z, 3.2 * z, 1.2 * z);
    if (L) kGlow(x, y + 5 * z, z, 16);
  }
  function miniBowl(x, y, z) {                                            // Mini-Nudelschale fürs Schild, (x, y): Mitte
    const by = y + 0.5 * z, W = 3.5 * z, D = 2.9 * z, R = 1.15 * z;
    ellipse(x, by + D - 0.1 * z, 1.5 * z, 0.5 * z, C('#8e2a1f'));           // Fuß
    g.beginPath(); g.ellipse(x, by, W, D, 0, 0, Math.PI); g.fillStyle = C('#c0392b'); g.fill();
    g.strokeStyle = C('#fbf7f0'); g.lineWidth = 0.45 * z;                   // helles Band
    g.beginPath(); g.ellipse(x, by + 0.3 * z, W - 0.3 * z, D - 1.3 * z, 0, 0.25, Math.PI - 0.25); g.stroke();
    ellipse(x, by, W, R, C('#e9b949'));                                     // Brühe mit Nudeln
    g.strokeStyle = C('#fff1b8'); g.lineWidth = 0.35 * z;
    g.beginPath();
    for (let i = 0; i <= 6; i++) { const px = x - 2.4 * z + i * 0.8 * z, py = by + (i & 1 ? -0.3 : 0.3) * z; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    circle(x - 1.3 * z, by - 0.1 * z, 0.55 * z, C('#fffaf0')); circle(x - 1.3 * z, by - 0.1 * z, 0.3 * z, C('#f2a33a'));   // Ei
    g.strokeStyle = C('#8e2a1f'); g.lineWidth = 0.4 * z;                    // Rand
    g.beginPath(); g.ellipse(x, by, W, R, 0, 0, TAU); g.stroke();
    kLine({ z }, [x + 0.3 * z, by - 0.2 * z], [x + 2.1 * z, y - 3.4 * z], '#d9a066', 0.55);   // Stäbchen
    kLine({ z }, [x + 1.2 * z, by - 0.1 * z], [x + 3 * z, y - 2.7 * z], '#c98d5c', 0.55);
  }
  SHOP_ART.nudelbar = function (K, s, now, x, y, t) {
    const z = K.z, L = lit(), A0 = -0.06, HA = 0.27, HB = 0.29, H1 = 16, R1 = 6, O1 = 1.4;   // unten: Laden mit breiter Traufe
    const HA2 = 0.17, HB2 = 0.19, LIFT2 = 19, H2 = 6, R2 = 9, O2 = 1.55;                       // oben: kleines Obergeschoss
    const sign = hangSign(K, miniBowl, N_ROOF, { up: 9 });
    K.scene([[A0, 0, () => {
      kShadow(K, 0.3);
      pagodaTips(K, A0, 0, HA, HB, H1, O1, N_ROOF, 4);
      const B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H1, wall: N_WALL, roof: N_ROOF, roofH: R1, over: O1, entry: true });
      for (const F of Object.values(B.faces)) if (F) for (const [t0, t1] of [[0, 0.07], [0.93, 1]]) faceQuad(F.P, F.Q, t0, t1, 0, F.H, K.wallCol(N_RED, F.n));   // rote Eckpfosten
      const F = B.faces.front;
      if (F) {
        windowOn(F.P, F.Q, 0.13, 0.54, F.H * 0.14, F.H * 0.68, z);                          // Schaufenster
        faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.68, C(DOOR_COL));                           // Tür …
        faceQuad(F.P, F.Q, 0.62, 0.88, F.H * 0.42, F.H * 0.7, C(N_RED));                      // … mit Noren-Vorhang
      }
      houseWins(K, B, [[0.3, 0.7]], 0.3, 0.7);
      // zwei Laternen an den seitlichen Traufecken (an der vorderen hängt das Schild)
      const E = [[1, -1], [1, 1], [-1, 1], [-1, -1]].map(([sa, sb]) => ({ p: K.P(A0 + sa * HA * O1 * 0.94, sb * HB * O1 * 0.94, H1), d: K.depth(A0 + sa * HA, sb * HB) }))
        .sort((p, q) => p.d - q.d);
      for (const c of E.slice(1, 3)) paperLantern(c.p[0], c.p[1], z, L);
      pagodaTips(K, A0, 0, HA2, HB2, LIFT2 + H2, O2, N_ROOF, 5);
      const U = K.block({ a: A0, b: 0, ha: HA2, hb: HB2, h: H2, lift: LIFT2, wall: N_WALL, roof: N_ROOF, roofH: R2, over: O2 });
      for (const S of Object.values(U.faces)) if (S) windowOn(S.P, S.Q, 0.3, 0.7, S.H * 0.15, S.H * 0.75, z);
    }], sign]);
  };
  ART_SHADOW.nudelbar = [28, 0.22];

  // ---------------------------------------------------------------------------------------------------------------
  // Konditorei: Zuckerbäckerhaus – rosa Satteldach mit dem Giebel zur Straße, weiße Zuckerguss-Kante an Giebel und
  // Traufe, Rundfenster im Giebel, Rundbogen-Schaufenster, Schornstein mit Rauch; davor ein Tischchen mit Schirm.
  // ---------------------------------------------------------------------------------------------------------------
  const K_WALL = '#fdeaff', K_ROOF = '#f28cb1', ICING = '#fffaf5';
  // Zuckerguss: dicke weiße Kante mit Bögen darunter, am sichtbaren Giebel (sA) und an der sichtbaren Traufe (sB)
  function icing(K, a, ha, hb, over, h, roofH, sA, sB) {
    const z = K.z, ea = ha * over, eb = hb * over, col = C(ICING);
    const G1 = K.P(a + sA * ea, -eb, h), G2 = K.P(a + sA * ea, eb, h), top = K.P(a + sA * ea, 0, h + roofH);
    const Ef = K.P(a + sA * ea, sB * eb, h), Eb = K.P(a - sA * ea, sB * eb, h);
    const bumps = (p, q, n) => { for (let j = 0; j < n; j++) { const m = lerp(p, q, (j + 0.5) / n); circle(m[0], m[1] + 1 * z, 1.6 * z, col); } };
    bumps(Ef, Eb, 6); bumps(G1, top, 3); bumps(top, G2, 3);
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = 1.6 * z; g.beginPath(); g.moveTo(Ef[0], Ef[1]); g.lineTo(Eb[0], Eb[1]); g.stroke();
    g.lineWidth = 2 * z; g.beginPath(); g.moveTo(G1[0], G1[1]); g.lineTo(top[0], top[1]); g.lineTo(G2[0], G2[1]); g.stroke();
    for (const tt of [0.3, 0.7]) { const m = lerp(Ef, Eb, tt); oval(m[0], m[1] + 2.4 * z, 1 * z, 2 * z, 0, col); }   // zwei Tropfen
  }
  function cakeTier(x, base, rx, h, side, top, drip, z) {               // Stockwerk einer Torte (base: Boden, Mitte vorn)
    const ry = rx * 0.38;
    ellipse(x, base, rx, ry, C(shade(side, -0.08)));
    g.fillStyle = C(side); g.fillRect(x - rx, base - h, rx * 2, h);
    g.fillStyle = C(shade(side, -0.08)); g.fillRect(x + rx * 0.55, base - h, rx * 0.45, h);   // Schattenseite
    ellipse(x, base - h, rx, ry, C(top));
    for (let i = -3; i <= 3; i++) {                                      // Guss läuft vorn über den Rand
      const dx = i / 3.4, px = x + dx * rx, py = base - h + ry * Math.sqrt(1 - dx * dx);
      ellipse(px, py + 0.4 * z, rx / 7, (i & 1 ? 1.5 : 0.9) * z, C(drip));
    }
  }
  function miniCake(x, y, z) {                                            // Mini-Torte fürs Schild, (x, y): Mitte
    const d = z * 0.4;
    cakeTier(x, y + 2.6 * z, 3 * z, 2.2 * z, '#f7a8c4', '#fffaf5', '#fffaf5', d);
    for (const sx of [-1, 1]) circle(x + sx * 2.35 * z, y + 0.75 * z, 0.45 * z, C('#e8384f'));   // Beeren
    cakeTier(x, y + 0.4 * z, 2 * z, 1.8 * z, '#7b4a2e', '#f7a8c4', '#f7a8c4', d);
    const ex = x - 0.6 * z, ey = y - 1.9 * z;                                // Erdbeere
    g.beginPath(); g.moveTo(ex - 0.8 * z, ey - 0.3 * z); g.quadraticCurveTo(ex, ey - 1 * z, ex + 0.8 * z, ey - 0.3 * z); g.quadraticCurveTo(ex + 0.7 * z, ey + 0.7 * z, ex, ey + 1 * z);
    g.quadraticCurveTo(ex - 0.7 * z, ey + 0.7 * z, ex - 0.8 * z, ey - 0.3 * z); g.fillStyle = C('#e8384f'); g.fill();
    poly([[ex - 0.6 * z, ey - 0.45 * z], [ex, ey - 1.05 * z], [ex + 0.6 * z, ey - 0.45 * z], [ex, ey - 0.65 * z]], C('#58b36a'));
    const cx = x + 0.9 * z, cb = y - 1.3 * z;                                // Kerze
    g.fillStyle = C('#f28cb1'); g.fillRect(cx - 0.3 * z, cb - 1.7 * z, 0.6 * z, 1.7 * z);
    oval(cx, cb - 2.3 * z, 0.4 * z, 0.65 * z, 0, lit() ? '#fff3b0' : C('#ffb13b'));
  }
  function parasolTable(K, a, b, col) {                                   // Tischchen mit Sonnenschirm
    const z = K.z, [px, py] = K.P(a, b), top = py - 12 * z;
    kLine(K, [px, py], [px, top], '#8a6a4a', 1);
    ellipse(px, py - 4.5 * z, 3.8 * z, 1.6 * z, C('#fffaf5'));
    poly([[px - 7 * z, top + 2.2 * z], [px, top - 3 * z], [px + 7 * z, top + 2.2 * z], [px, top + 5 * z]], C(col));
    poly([[px, top - 3 * z], [px + 7 * z, top + 2.2 * z], [px, top + 5 * z]], C(shade(col, -0.12)));
  }
  SHOP_ART.konditorei = function (K, s, now, x, y, t) {
    const z = K.z, L = lit(), A0 = -0.06, HA = 0.27, HB = 0.28, H = 16, RH = 14, OV = 1.2;
    const sign = hangSign(K, miniCake, K_ROOF, { up: 9 });
    const tb = sign[1] > 0 ? -0.3 : 0.3;                                    // Tischchen auf die andere Seite als das Schild
    K.scene([[A0, 0, () => {
      kShadow(K, 0.3);
      const B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: K_WALL, roof: K_ROOF, roofH: RH, type: 'gable', ridge: 'a', over: OV, entry: true });
      const F = B.faces.front;
      if (F) {
        archWin(F, 0.12, 0.52, F.H * 0.12, F.H * 0.76, z, ICING);                             // Rundbogen-Schaufenster
        faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.68, C('#8b5a3c'));                         // Schoko-Tür
      }
      houseWins(K, B, [[0.3, 0.7]], 0.3, 0.72);
      const sA = F ? 1 : -1, sB = K.facing(0, 1) > 0 ? 1 : -1;
      // Rundfenster im Giebel
      const [gx, gy] = K.P(A0 + sA * HA, 0, H + RH * 0.36);
      circle(gx, gy, 3.4 * z, C(ICING));
      circle(gx, gy, 2.4 * z, L ? '#ffd873' : C('#a8dcff'));
      kGlow(gx, gy, z, 12);
      icing(K, A0, HA, HB, OV, H, RH, sA, sB);
      kitChimney(K, A0 - sA * 0.12, sB * 0.15, H + RH * 0.42, now, '#c0694a');
    }], sign, [0.42, tb, () => parasolTable(K, 0.42, tb, K_ROOF)]]);
  };
  ART_SHADOW.konditorei = [25, 0.22];

  // ---------------------------------------------------------------------------------------------------------------
  // Chocolaterie: kleines Stadtpalais – zweigeschossig, Flachdach mit brauner Attika (Brüstung), Rundbogenfenster,
  // in der Mitte ein Vorbau mit rosa Rundbogentür und erhöhter Attika; davor ein Kugelbäumchen im Topf.
  // ---------------------------------------------------------------------------------------------------------------
  const P_WALL = '#fff4dc', P_BROWN = '#8b5a3c', P_PINK = '#f28cb1';
  function chocolateBar(x, y, z) {                                         // (x, y): Fuß der Tafel, Mitte
    const GOLD = '#d4af37', w = 6.5 * z, top = -19 * z, foil = -9.5 * z, dx = 2.4 * z, dy = -1.4 * z, bite = 4.6 * z;
    g.save(); g.translate(x, y); g.rotate(-0.14);
    poly([[w, 0], [w + dx, dy], [w + dx, foil + dy], [w, foil]], C('#9e7d1f'));
    poly([[w, foil], [w + dx, foil + dy], [w + dx, top + dy], [w, top]], C('#3a1f10'));
    poly([[-w + bite, top], [w, top], [w + dx, top + dy], [-w + bite + dx, top + dy]], C('#8a5230'));
    const bp = (ang, r) => [-w + Math.cos(ang) * r, top + Math.sin(ang) * r];   // Biss oben links
    g.beginPath(); g.moveTo(-w, foil); g.lineTo(...bp(Math.PI / 2, bite));
    g.quadraticCurveTo(...bp(Math.PI * 3 / 8, bite * 1.35), ...bp(Math.PI / 4, bite));
    g.quadraticCurveTo(...bp(Math.PI / 8, bite * 1.35), ...bp(0, bite));
    g.lineTo(w, top); g.lineTo(w, foil); g.closePath();
    g.fillStyle = C('#5e331c'); g.fill();
    g.save(); g.clip();
    const cw = (2 * w) / 3, ch = 4.6 * z;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x0 = -w + c * cw + 0.7 * z, y0 = top + r * ch + 0.7 * z, pw = cw - 1.4 * z, ph = ch - 1.4 * z;
      g.fillStyle = C('#8a5230'); g.fillRect(x0, y0, pw, ph);
      g.fillStyle = C('#a8683f'); g.fillRect(x0, y0, pw, 0.8 * z); g.fillRect(x0, y0, 0.8 * z, ph);
    }
    g.restore();
    g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w, foil + 0.4 * z);                          // Goldfolie mit Knitterkante
    for (let i = 1; i <= 6; i++) g.lineTo(-w + i * (2 * w / 6), foil + (i & 1 ? -1.1 : 0.5) * z);
    g.lineTo(w, 0); g.closePath(); g.fillStyle = C(GOLD); g.fill();
    g.fillStyle = C('#f3a6c1'); g.fillRect(-w, -5.4 * z, 2 * w, 2.6 * z);                  // Banderole in Rosé
    g.fillStyle = C('#e38aab'); g.fillRect(w, -5.4 * z, dx, 2.6 * z);
    g.restore();
  }
  function miniBar(x, y, z) {                                              // dieselbe Tafel verkleinert, (x, y): Mitte
    g.save(); g.translate(x + 0.06 * z, y + 3 * z); g.scale(0.3, 0.3); chocolateBar(0, 0, z); g.restore();
  }
  SHOP_ART.chocolaterie = function (K, s, now, x, y, t) {
    const z = K.z, A0 = -0.06, HA = 0.26, HB = 0.3, H = 21, AT = 4;
    const RA = A0 + HA + 0.03, RHA = 0.05, RHB = 0.11;                     // Mittelvorbau
    const sign = hangSign(K, miniBar, P_BROWN, { up: 13 });
    const ob = sign[1] > 0 ? -0.24 : 0.24;                                  // Bäumchen auf die andere Seite als das Schild
    const attika = (a, ha, hb, lift, h) => K.block({ a, b: 0, ha, hb, h, lift, wall: P_BROWN, type: 'flat', roof: shade(P_BROWN, 0.15) });
    K.scene([[A0, 0, () => {
      kShadow(K, 0.32);
      const B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: P_WALL, type: 'flat', roof: P_WALL, entry: true });
      for (const [side, F] of Object.entries(B.faces)) {
        if (!F) continue;
        const spots = side === 'front' ? [[0.08, 0.3], [0.7, 0.92]] : [[0.14, 0.4], [0.6, 0.86]];
        for (const [t0, t1] of spots) {
          archWin(F, t0, t1, F.H * 0.1, F.H * 0.46, z, P_PINK);                                  // unten Schaufenster
          archWin(F, t0 + 0.03, t1 - 0.03, F.H * 0.6, F.H * 0.86, z);                            // oben
        }
      }
      attika(A0, HA + 0.012, HB + 0.012, H, AT);
      K.rect(A0 - HA + 0.035, -HB + 0.035, A0 + HA - 0.035, HB - 0.035, C('#d8c3a5'), H + AT);   // Dachfläche hinter der Brüstung
    }], [RA, 0, () => {
      const R = K.block({ a: RA, b: 0, ha: RHA, hb: RHB, h: H, wall: shade(P_WALL, 0.3), type: 'flat', roof: P_WALL });
      const F = R.faces.front;
      if (F) {
        poly(archPts(F, 0.2, 0.8, 0, F.H * 0.5), C(P_PINK));                                    // rosa Rundbogentür
        archWin(F, 0.26, 0.74, F.H * 0.6, F.H * 0.86, z);
      }
      attika(RA, RHA + 0.012, RHB + 0.012, H, AT + 3);
    }], sign, [0.38, ob, () => {                                                                 // Kugelbäumchen im Topf
      const [px, py] = K.P(0.38, ob);
      g.fillStyle = C(P_BROWN); g.fillRect(px - 2.2 * z, py - 4 * z, 4.4 * z, 4 * z);
      ellipse(px, py - 4 * z, 2.2 * z, 0.9 * z, C(shade(P_BROWN, 0.2)));
      kLine(K, [px, py - 4 * z], [px, py - 8 * z], '#6b4f3a', 1);
      circle(px, py - 11 * z, 3.8 * z, C('#58b36a'));
      circle(px - 1.2 * z, py - 12.2 * z, 2 * z, C(shade('#58b36a', 0.15)));
    }]]);
  };
  ART_SHADOW.chocolaterie = [26, 0.22];

  // ---------------------------------------------------------------------------------------------------------------
  // Spielzeugladen: Knusperhäuschen – niedrige gelbe Wände, steiles blaues Satteldach mit weitem Überstand, eine Gaube
  // über der Tür, bunte Fensterläden; davor ein Stapel Bauklötze.
  // ---------------------------------------------------------------------------------------------------------------
  const S_WALL = '#ffe066', S_ROOF = '#5f8fe8', S_DOOR = '#e8705f';
  // Gaube auf der Dachseite sA (Satteldach mit First entlang b): Giebelwand mit Fenster, zwei Wangen, kleines Satteldach
  function dormer(K, a, ea, h, roofH, sA, wall, roof) {
    const z = K.z, w = 0.08, hd = 5, rd = 4, s0 = 0.56;
    const at = frac => a + sA * ea * frac, hAt = frac => h + roofH * (1 - frac);   // frac: 0 = First, 1 = Traufe
    const af = at(s0), h0 = hAt(s0), h1 = h0 + hd, back = at(1 - (h1 - h) / roofH), ridge = at(Math.max(0, 1 - (h1 + rd - h) / roofH));
    const P = (aa, bb, up) => K.P(aa, bb, up), o = 0.02 * sA;
    const cheeks = [-1, 1].map(sb => [[P(af, sb * w, h0), P(af, sb * w, h1), P(back, sb * w, h1)], [0, sb]]);
    const slopes = [-1, 1].map(sb => [[P(af + o, sb * w * 1.3, h1 - 0.5), P(af + o, 0, h1 + rd), P(ridge, 0, h1 + rd), P(back, sb * w * 1.3, h1 - 0.5)], [0, sb]]);
    for (const [pts, n] of cheeks) if (K.facing(...n) <= 0) poly(pts, K.wallCol(wall, n));
    for (const [pts, n] of slopes) if (K.facing(...n) <= 0) poly(pts, K.roofCol(roof, n));
    const Pl = P(af, -w, h0), Pr = P(af, w, h0);
    poly([Pl, Pr, P(af, w, h1), P(af, 0, h1 + rd), P(af, -w, h1)], K.wallCol(wall, [sA, 0]));
    windowOn(Pl, Pr, 0.25, 0.75, 0.8 * z, 4.2 * z, z);
    for (const [pts, n] of cheeks) if (K.facing(...n) > 0) poly(pts, K.wallCol(wall, n));
    for (const [pts, n] of slopes) if (K.facing(...n) > 0) poly(pts, K.roofCol(roof, n));
  }
  function miniTeddy(x, y, z) {                                            // Mini-Teddy fürs Schild, (x, y): Mitte
    g.save(); g.translate(x, y + 3.6 * z); g.scale(0.31, 0.31);
    const fur = C('#b5793f'), light = C('#ecc99b'), dark = C('#3b2a20');
    oval(-6.2 * z, -7.5 * z, 2.3 * z, 3.8 * z, 0.5, C('#a86d36'));          // Arme
    oval(6.2 * z, -7.5 * z, 2.3 * z, 3.8 * z, -0.5, C('#9c6230'));
    oval(0, -6.5 * z, 6.3 * z, 7 * z, 0, fur);                              // Körper
    oval(0, -5.5 * z, 3.9 * z, 4.5 * z, 0, light);                          // Bauch
    for (const sx of [-1, 1]) { oval(sx * 4 * z, -1.4 * z, 3.2 * z, 2.4 * z, 0, fur); oval(sx * 5.1 * z, -1.3 * z, 1.5 * z, 1.8 * z, 0, light); }   // Beine
    for (const sx of [-1, 1]) { circle(sx * 4.3 * z, -21.3 * z, 2.3 * z, fur); circle(sx * 4.3 * z, -21.3 * z, 1.2 * z, light); }   // Ohren
    circle(0, -17.3 * z, 5.6 * z, fur);                                     // Kopf
    oval(0, -15.6 * z, 2.7 * z, 2 * z, 0, light);                           // Schnauze
    oval(0, -16.3 * z, 1.1 * z, 0.75 * z, 0, dark);
    for (const sx of [-1, 1]) circle(sx * 2.1 * z, -18.8 * z, 0.8 * z, dark);
    poly([[0, -12.4 * z], [-3.2 * z, -14 * z], [-3.2 * z, -10.8 * z]], C('#e8604f'));   // Fliege
    poly([[0, -12.4 * z], [3.2 * z, -14 * z], [3.2 * z, -10.8 * z]], C('#d24f40'));
    g.restore();
  }
  SHOP_ART.spielzeug = function (K, s, now, x, y, t) {
    const z = K.z, A0 = -0.06, HA = 0.25, HB = 0.29, H = 15, RH = 18, OV = 1.36;
    const sign = hangSign(K, miniTeddy, S_ROOF, { up: 8 });
    const ob = sign[1] > 0 ? -0.26 : 0.26;                                  // Bauklötze auf die andere Seite als das Schild
    K.scene([[A0, 0, () => {
      kShadow(K, 0.3);
      const B = K.block({ a: A0, b: 0, ha: HA, hb: HB, h: H, wall: S_WALL, roof: S_ROOF, roofH: RH, type: 'gable', ridge: 'b', over: OV, entry: true });
      const F = B.faces.front;
      if (F) {
        shutterWin(F, 0.2, 0.46, F.H * 0.26, F.H * 0.74, '#58b36a', z);
        faceQuad(F.P, F.Q, 0.66, 0.86, 0, F.H * 0.66, C(S_DOOR));
      }
      const cols = { right: '#f28cb1', left: '#ff8a3d', back: '#e8705f' };
      for (const side of ['right', 'left', 'back']) { const S = B.faces[side]; if (S) shutterWin(S, 0.37, 0.63, S.H * 0.3, S.H * 0.74, cols[side], z, 0.12); }
      dormer(K, A0, HA * OV, H, RH, F ? 1 : -1, S_WALL, S_ROOF);
    }], sign, [0.38, ob, () => {                                                                 // Bauklötze
      K.block({ a: 0.35, b: ob - 0.05, ha: 0.055, hb: 0.055, h: 5, wall: '#5f8fe8', type: 'flat', roof: shade('#5f8fe8', 0.2) });
      K.block({ a: 0.4, b: ob + 0.07, ha: 0.055, hb: 0.055, h: 5, wall: '#e8705f', type: 'flat', roof: shade('#e8705f', 0.2) });
      K.block({ a: 0.37, b: ob + 0.01, ha: 0.055, hb: 0.055, h: 5, lift: 5, wall: '#58b36a', type: 'flat', roof: shade('#58b36a', 0.2) });
    }]]);
  };
  ART_SHADOW.spielzeug = [26, 0.22];
})();
