'use strict';
// Ladenbilder, Gruppe c (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: hangSign, faceAt, ART_SHADOW)
// Apotheke, Hofladen, Buchladen, Pizzeria. Die Hilfen stehen in einer Klammer, damit sie sich nicht mit denen der
// anderen Gruppen-Dateien beißen (alle Skripte teilen sich einen Namensraum).
// Block 35: so gebaut wie die alten Häuser – helle, warme Wände, klare Dachfarben, große ruhige Flächen, Schatten,
// keine Schrift. Jeder Laden hat seine eigene Bauform: Apotheke = Tempelchen mit Säulenvorbau, Hofladen = Scheune
// mit tief heruntergezogenem Reetdach, Buchladen = schmales Haus mit Treppengiebel, Pizzeria = langes Satteldach
// mit gemauertem Ofen-Schornstein. Das Wahrzeichen hängt klein im Ausleger-Schild an der Hausecke (hangSign).
(() => {
  const litNow = () => night > 0.15 && isLive();
  const byDepth = K => (p, q) => K.depth(p[0], p[1]) - K.depth(q[0], q[1]);
  // Fenster mit Lichtschein in Höhe h0 … h1 (Anteile der Wand) – wie K.wins, nur mit freien Stellen t0 … t1
  const win = (F, t0, t1, h0, h1, z) => windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, z);

  // --- Apotheke: weißes Tempelchen – Giebel zur Straße, Säulenvorbau mit Dreiecksgiebel über der Tür ---------------
  const APO = '#1fa84f', APO_WALL = '#f5f5f5', APO_WARM = '#fff4dc', APO_ROOF = '#58b36a';
  const crossPts = (x, y, s, t) => [[x - t, y - s], [x + t, y - s], [x + t, y - t], [x + s, y - t], [x + s, y + t], [x + t, y + t],
    [x + t, y + s], [x - t, y + s], [x - t, y + t], [x - s, y + t], [x - s, y - t], [x - t, y - t]];
  // Kleines grünes Apothekenkreuz mittig bei (x, y) für das Schild: dunkle Kante, Glanzstreif, nachts hell leuchtend
  function greenCross(x, y, z, on) {
    const s = 3.2 * z, t = 1.15 * z;
    poly(crossPts(x + 0.55 * z, y + 0.45 * z, s, t), on ? '#1f9a52' : C('#11773a'));
    poly(crossPts(x, y, s, t), on ? '#6dffa3' : C(APO));
    poly([[x - t + 0.3 * z, y - s + 0.35 * z], [x - t + 0.85 * z, y - s + 0.35 * z], [x - t + 0.85 * z, y - t], [x - t + 0.3 * z, y - t]], on ? '#e0ffea' : C('#74dd99'));
    if (on) glowQuad([[x - t, y - s], [x + t, y - s], [x + t, y + s], [x - t, y + s]], s * 3.4, 'blue');
  }
  // Rundfenster mitten im sichtbaren Giebel (Satteldach mit First entlang a: Giebel vorn und hinten)
  function gableOculus(K, B, roofH, ring) {
    const z = K.z, on = litNow();
    for (const s of [1, -1]) {
      if (K.facing(s, 0) <= 0.01) continue;
      const [x, y] = K.P(B.a + s * B.ha, B.b, B.lift + B.h + roofH * 0.36);
      circle(x, y, 2.9 * z, K.wallCol(ring, [s, 0]));
      circle(x, y, 2 * z, on ? '#ffd873' : C('#a8dcff'));
      glowQuad([[x - 2 * z, y - 2 * z], [x + 2 * z, y - 2 * z], [x + 2 * z, y + 2 * z], [x - 2 * z, y + 2 * z]], 12 * z);
    }
  }
  // Säulenvorbau vor der Tür: Stufe, Vorbau mit Tür und Dreiecksgiebel, davor zwei Säulen an den Ecken
  // (pa = Mitte des Vorbaus; die Tür sitzt vorn im Vorbau, sonst verdeckt sie im Schrägbild die linke Säule)
  function portico(K, pa, pb, h) {
    const ha = 0.06, hb = 0.13, cs = 0.024, z = K.z;
    K.block({ a: pa + 0.02, b: pb, ha: ha + 0.02, hb: hb + 0.035, h: 1.6, wall: '#e8e2d6', type: 'flat', roof: '#f3efe8' });   // Stufe
    const V = K.block({ a: pa, b: pb, ha, hb, h, lift: 1.6, wall: APO_WARM, roof: APO_ROOF, roofH: 6, type: 'gable', ridge: 'a', over: 1.14 });
    const F = V.faces.front;
    if (F) faceQuad(F.P, F.Q, 0.31, 0.69, 0, F.H * 0.7, C(shade(APO_ROOF, -0.28)));      // grüne Tür
    for (const S of Object.values(V.faces)) if (S) faceQuad(S.P, S.Q, 0, 1, S.H - 2.2 * z, S.H, K.wallCol(shade(APO_WARM, -0.06), S.n));   // Gebälk
    [[pa + ha - cs + 0.004, pb - hb + cs - 0.004], [pa + ha - cs + 0.004, pb + hb - cs + 0.004]].sort(byDepth(K))
      .forEach(([ca, cb]) => K.block({ a: ca, b: cb, ha: cs, hb: cs, h: h - 2.2, lift: 1.6, wall: '#ffffff', type: 'flat', roof: '#ffffff' }));
  }
  SHOP_ART.apotheke = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), A = -0.08, HA = 0.28, HB = 0.3, H = 19, RH = 12;
    K.scene([
      [A, 0, () => {
        const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: APO_WALL, roof: APO_ROOF, roofH: RH, type: 'gable', ridge: 'a', over: 1.15, entry: true });
        const F = B.faces.front;
        if (F) for (const [t0, t1] of [[0.07, 0.25], [0.75, 0.93]]) win(F, t0, t1, 0.22, 0.66, z);   // streng symmetrisch
        K.sideWins(B, 2, 0.24, 0.66);
        gableOculus(K, B, RH, APO_ROOF);
      }],
      [A + HA + 0.06, 0, () => portico(K, A + HA + 0.06, 0, 12)],
      hangSign(K, (cx, cy, zz) => greenCross(cx, cy, zz, on), APO, { up: H - 4, a0: A + HA + 0.04, b0: HB + 0.05, back: A - HA - 0.04 }),
    ]);
  };
  ART_SHADOW.apotheke = [28, 0.2];

  // --- Hofladen: Scheune – niedrige helle Holzwand, breites, tief heruntergezogenes Reetdach, Tor in der Mitte -------
  const BARN_WALL = '#d8c3a5', THATCH = '#e9c46a', BARN_WOOD = '#8b5a3c';
  function miniApple(K, x, y, z) {                          // roter Apfel mit Stiel und Blatt für das Schild
    kLine(K, [x - 0.1 * z, y - 1.5 * z], [x + 0.4 * z, y - 3.3 * z], '#6b4424', 0.6);
    circle(x - 1 * z, y + 0.85 * z, 2.5 * z, C('#e8413b'));
    circle(x + 1 * z, y + 0.85 * z, 2.5 * z, C('#e8413b'));
    circle(x, y + 0.55 * z, 2.7 * z, C('#e8413b'));
    circle(x - 1.3 * z, y - 0.25 * z, 0.8 * z, C(shade('#e8413b', 0.45)));
    g.beginPath(); g.ellipse(x + 1.3 * z, y - 2.5 * z, 1.2 * z, 0.55 * z, -0.45, 0, Math.PI * 2); g.fillStyle = C('#58b36a'); g.fill();
  }
  // Dicke Reetkante an den Traufen (Satteldach mit First entlang b: Traufen vorn und hinten)
  function thatchEdge(K, B, over, hgt, col) {
    const ea = B.ha * over, eb = B.hb * over, top = B.lift + B.h;
    for (const s of [1, -1]) {
      if (K.facing(s, 0) <= 0.01) continue;
      const p = K.P(B.a + s * ea, B.b - eb, top), q = K.P(B.a + s * ea, B.b + eb, top);
      poly([p, q, [q[0], q[1] + hgt * K.z], [p[0], p[1] + hgt * K.z]], K.wallCol(col, [s, 0]));
    }
  }
  function barnDoor(K, F) {                                 // zweiflügliges Scheunentor mit hellen Querstreben
    const z = K.z, top = 0.86;
    faceQuad(F.P, F.Q, 0.34, 0.66, 0, F.H * top, C(BARN_WOOD));
    g.strokeStyle = C('#c69a6c'); g.lineWidth = 1.1 * z; g.lineCap = 'butt'; g.beginPath();
    const seg = (t0, h0, t1, h1) => { const p = faceAt(F, t0, F.H * h0), q = faceAt(F, t1, F.H * h1); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
    seg(0.5, 0, 0.5, top);                                                               // Mittelfuge
    seg(0.37, 0.06, 0.47, top - 0.08); seg(0.63, 0.06, 0.53, top - 0.08);               // Streben
    g.stroke();
  }
  function appleCrate(K, a, b) {                           // eine Kiste voller Äpfel vor der Tür
    kCrate(K, a, b, '#c9955f', 1.2);
    const [x, y] = K.P(a, b, 5.4), z = K.z;
    for (const [dx, dy, c] of [[0, -1.2, '#e8413b'], [-2.3, 0, '#7cb342'], [2.3, 0, '#e8413b'], [0, 1.2, '#e8413b']]) {
      circle(x + dx * z, y + dy * z - 1 * z, 1.8 * z, C(c));
    }
  }
  SHOP_ART.hofladen = function (K, s, now, x, y, t) {
    const z = K.z, A = -0.04, HA = 0.28, HB = 0.32, H = 10, RH = 19, OV = 1.3;
    K.scene([
      [A, 0, () => {
        const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: BARN_WALL, roof: THATCH, roofH: RH, type: 'gable', ridge: 'b', over: OV, entry: true });
        const F = B.faces.front;
        if (F) { barnDoor(K, F); for (const [t0, t1] of [[0.1, 0.24], [0.76, 0.9]]) win(F, t0, t1, 0.3, 0.72, z); }
        for (const n of ['right', 'left']) { const G = B.faces[n]; if (G) win(G, 0.38, 0.62, 0.3, 0.72, z); }   // Giebelseiten
        if (B.faces.back) K.wins(B, 'back', 2, 0.3, 0.72, 0.2, 0.8);
        thatchEdge(K, B, OV, 2.6, shade(THATCH, -0.14));
      }],
      hangSign(K, (cx, cy, zz) => miniApple(K, cx, cy, zz), BARN_WOOD, { up: 9, a0: A + 0.12, b0: HB + 0.04, back: A - 0.12 }),   // am Giebel
      [0.42, -0.3, () => appleCrate(K, 0.42, -0.3)],
    ]);
  };
  ART_SHADOW.hofladen = [24, 0.18];

  // --- Buchladen: schmales, hohes Giebelhaus mit Treppengiebel zur Straße, Minzgrün und Petrol, Buch im Schild -------
  const BOOK_WALL = '#c9f0e4', BOOK_ROOF = '#2f9e9e', GOLD = '#d4af37';
  // Treppengiebel an der Giebelseite a = af (Normale n = ±1): Stufen ragen über die Dachlinie, oben mit Abdeckung
  const STEPS = [[0, 0.2, 0.42], [0.2, 0.36, 0.74], [0.36, 0.64, 1], [0.64, 0.8, 0.74], [0.8, 1, 0.42]];
  function stepGable(K, af, b0, hb, h, rh, n) {
    const pt = (tt, up) => K.P(af, b0 - hb + 2 * hb * tt, up), top = f => h + rh * f + 2.4;
    const pts = [pt(0, h)];
    for (const [t0, t1, f] of STEPS) pts.push(pt(t0, top(f)), pt(t1, top(f)));
    pts.push(pt(1, h));
    poly(pts, K.wallCol(BOOK_WALL, [n, 0]));
    const cap = K.wallCol(BOOK_ROOF, [n, 0]);
    for (const [t0, t1, f] of STEPS) poly([pt(t0 - 0.02, top(f)), pt(t1 + 0.02, top(f)), pt(t1 + 0.02, top(f) - 1.7), pt(t0 - 0.02, top(f) - 1.7)], cap);
  }
  function miniBook(K, x, y, z, on) {                       // kleines aufgeschlagenes Buch mittig bei (x, y) für das Schild
    const W = 3.1 * z, Hh = 4.4 * z, yb = y + 2.2 * z;      // yb: Unterkante am Falz
    poly([[x, yb + 0.6 * z], [x - W - 0.5 * z, yb - 0.4 * z], [x - W - 0.5 * z, yb - Hh - 0.3 * z], [x, yb - Hh + 0.8 * z],
          [x + W + 0.5 * z, yb - Hh - 0.3 * z], [x + W + 0.5 * z, yb - 0.4 * z]], C('#8e2c3a'));                   // Einband
    for (const d of [-1, 1]) {                                                            // Seiten
      g.beginPath(); g.moveTo(x, yb);
      g.quadraticCurveTo(x + d * W * 0.4, yb - 0.8 * z, x + d * W, yb - 0.7 * z);
      g.lineTo(x + d * W, yb - Hh);
      g.quadraticCurveTo(x + d * W * 0.4, yb - Hh - 0.2 * z, x, yb - Hh + 0.8 * z);
      g.closePath(); g.fillStyle = d < 0 ? C('#fffaf0') : C('#f1e6cf'); g.fill();
    }
    g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.4 * z; g.lineCap = 'round'; g.beginPath();
    for (const d of [-1, 1]) for (let i = 0; i < 2; i++) {                                // Zeilen
      const yy = yb - Hh + 1.9 * z + i * 1.2 * z;
      g.moveTo(x + d * 0.7 * z, yy + 0.3 * z); g.quadraticCurveTo(x + d * W * 0.45, yy - 0.2 * z, x + d * (W - 0.6 * z), yy - 0.1 * z);
    }
    g.stroke();
    kLine(K, [x, yb], [x, yb - Hh + 0.8 * z], '#cbbd9f', 0.5);                           // Falz
    poly([[x + 0.15 * z, yb - 0.4 * z], [x + 0.75 * z, yb - 0.3 * z], [x + 0.85 * z, yb + 1.6 * z], [x + 0.45 * z, yb + 1.2 * z], [x + 0.15 * z, yb + 1.6 * z]], C('#e8604f'));   // Lesebändchen
    if (on) kGlow(x, y, z, 14);
  }
  SHOP_ART.buchladen = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), A = -0.02, HA = 0.31, HB = 0.26, H = 20, RH = 12;
    const far = K.facing(1, 0) > 0.01 ? -1 : 1;             // der Giebel, der vom Betrachter weg zeigt
    K.scene([
      [A, 0, () => {
        stepGable(K, A + far * HA, 0, HB, H, RH, far);      // hinterer Treppengiebel: nur die Stufen über dem First sieht man
        const B = shopHouse(K, { wall: BOOK_WALL, roof: BOOK_ROOF, awning: BOOK_ROOF, roofType: 'gable', ridge: 'a', h: H, roofH: RH, ha: HA, hb: HB, a: A, over: 1.02 });
        stepGable(K, A - far * HA, 0, HB, H, RH, -far);
        const F = B.faces.front || B.faces.back;
        if (F) windowOn(F.P, F.Q, 0.42, 0.58, F.H + RH * 0.14 * z, F.H + RH * 0.58 * z, z);   // Giebelfenster
      }],
      hangSign(K, (cx, cy, zz) => miniBook(K, cx, cy, zz, on), GOLD, { up: H - 4, a0: A + HA + 0.04, b0: HB + 0.05, back: A - HA - 0.04 }),
    ]);
  };
  ART_SHADOW.buchladen = [30, 0.22];

  // --- Pizzeria: langes Satteldach, gemauerter Ofen-Schornstein am Giebel, Tricolore-Markise, Pizza im Schild --------
  const PIZ_WALL = '#ffd1b3', PIZ_ROOF = '#e8705f', PIZ_GREEN = '#58b36a', BRICK = '#c0694a';
  function tricolorAwning(K, B, h0, h1, out) {
    if (!B.faces.front) return;
    const fa = B.a + B.ha, n = 6, b0 = B.b - B.hb * 0.94, b1 = B.b + B.hb * 0.94, cols = [PIZ_GREEN, '#fbf2e2', PIZ_ROOF];
    const bAt = i => b0 + (b1 - b0) * i / n;
    for (let i = 0; i < n; i++) {
      const col = cols[i % 3];
      poly([K.P(fa, bAt(i), h1), K.P(fa, bAt(i + 1), h1), K.P(fa + out, bAt(i + 1), h0), K.P(fa + out, bAt(i), h0)], C(col));
      poly([K.P(fa + out, bAt(i), h0), K.P(fa + out, bAt(i + 1), h0), K.P(fa + out, bAt(i + 1), h0 - 1.8), K.P(fa + out, bAt(i + 0.5), h0 - 3.2), K.P(fa + out, bAt(i), h0 - 1.8)], K.wallCol(shade(col, -0.1), [1, 0]));
    }
  }
  // Ein Fenster mit grünen Läden mitten auf der Seite (oben)
  function shutteredWin(K, F, z) {
    const col = K.wallCol(PIZ_GREEN, F.n);
    win(F, 0.4, 0.6, 0.62, 0.88, z);
    faceQuad(F.P, F.Q, 0.3, 0.39, F.H * 0.62, F.H * 0.88, col);
    faceQuad(F.P, F.Q, 0.61, 0.7, F.H * 0.62, F.H * 0.88, col);
  }
  const CHEESE = [[-3, -2, 2.2], [2.5, -3.5, 1.8], [3.2, 2.2, 2.3], [-2.2, 3, 1.9], [0.3, 0.2, 1.7], [-5, 0.8, 1.3], [5.2, -0.8, 1.2]];
  const SALAMI = [[-3.5, -3.5], [3, -1], [-1, 3.8], [3.6, 3.6], [-4.4, 1.6], [0.6, -5]];
  const BASIL = [[0.8, -2.2], [-2.6, 0.9], [1.8, 4.8], [4.7, 0.9], [-1.4, -5.3]];
  // Kleine Pizza mittig bei (x, y) für das Schild: Maße wie beim früheren großen Schild, nur mit z = 0.4 × Zoom
  function miniPizza(x, y, zz, on) {
    const z = zz * 0.4, R = 9.5 * z;
    circle(x, y, R, C('#e7a950'));                                                        // Teigrand
    g.strokeStyle = C('#f6d08c'); g.lineWidth = 1 * z;
    g.beginPath(); g.arc(x, y, R - 1 * z, Math.PI * 1.05, Math.PI * 1.5); g.stroke();
    circle(x, y, R - 2.2 * z, C('#d9412b'));                                              // Tomate
    for (const [dx, dy, r] of CHEESE) circle(x + dx * z, y + dy * z, r * z, C('#ffd766'));
    for (const [dx, dy] of SALAMI) { circle(x + dx * z, y + dy * z, 1.9 * z, C('#b3262a')); circle(x + (dx - 0.6) * z, y + (dy - 0.5) * z, 0.45 * z, C('#f0b0a8')); }
    for (const [dx, dy] of BASIL) ellipse(x + dx * z, y + dy * z, 1.3 * z, 0.7 * z, C('#3f9a3a'));
    g.strokeStyle = C('#c98a3c'); g.lineWidth = 0.5 * z; g.beginPath();
    for (let k = 0; k < 3; k++) { const ang = k * Math.PI / 3 + 0.3, c = Math.cos(ang) * (R - 2.2 * z), s = Math.sin(ang) * (R - 2.2 * z); g.moveTo(x - c, y - s); g.lineTo(x + c, y + s); }
    g.stroke();
    if (on) kGlow(x, y, zz, 14);
  }
  // Gemauerter Ofen-Schornstein an der Giebelseite: breiter Ofen mit Feuerloch unten, schmaler Zug bis über den First
  function ovenChimney(K, a, b, top, now, on) {
    const z = K.z, base = 11, mortar = '#e9b8a0';
    const bands = (S, fr) => { for (const F of Object.values(S.faces)) if (F) for (const f of fr) faceQuad(F.P, F.Q, 0, 1, F.H * f - 0.45 * z, F.H * f + 0.45 * z, K.wallCol(mortar, F.n)); };
    const O = K.block({ a, b, ha: 0.09, hb: 0.06, h: base, wall: BRICK, type: 'flat', roof: shade(BRICK, 0.12) });
    bands(O, [0.5]);
    const F = O.faces.right;                                                              // Außenseite (Ofen an der Giebelseite +b)
    if (F) {                                                                              // Feuerloch mit Glut
      const pts = [faceAt(F, 0.76, 0), faceAt(F, 0.24, 0)];
      for (let k = 0; k <= 8; k++) { const th = Math.PI * k / 8; pts.push(faceAt(F, 0.5 - 0.26 * Math.cos(th), F.H * 0.24 + F.H * 0.22 * Math.sin(th))); }
      poly(pts, C('#5a2a1c'));
      const [fx, fy] = faceAt(F, 0.5, 0);
      ellipse(fx, fy - 1.3 * z, 1.4 * z, 1 * z, on ? '#ffc04d' : C('#ff8a3d'));
      if (on) kGlow(fx, fy - 2 * z, z, 16);
    }
    const S = K.block({ a, b, ha: 0.055, hb: 0.05, h: top - base, lift: base, wall: BRICK, type: 'flat', roof: shade(BRICK, 0.12) });
    bands(S, [0.3, 0.62]);
    K.block({ a, b, ha: 0.07, hb: 0.065, h: 2.2, lift: top, wall: shade(BRICK, -0.12), type: 'flat', roof: '#7a3a2a' });
    const [sx, sy] = K.P(a, b, top + 2.2);
    smoke(sx, sy - 1 * z, z, now);
  }
  SHOP_ART.pizzeria = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), A = -0.06, HA = 0.28, HB = 0.29, H = 17, RH = 10;
    const ca = A - 0.04, cb = HB + 0.06;                    // Ofen-Schornstein an der Giebelseite +b, nach hinten gerückt (vorn hängt das Schild)
    K.scene([
      [A, 0, () => {
        const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: PIZ_WALL, roof: PIZ_ROOF, roofH: RH, type: 'gable', ridge: 'b', over: 1.12, entry: true });
        const F = B.faces.front;
        for (const S of Object.values(B.faces)) {                                         // Backstein-Sockel (an der Tür frei)
          if (!S) continue;
          const col = K.wallCol(BRICK, S.n);
          if (S === F) { faceQuad(S.P, S.Q, 0, 0.62, 0, 2.4 * z, col); faceQuad(S.P, S.Q, 0.88, 1, 0, 2.4 * z, col); }
          else faceQuad(S.P, S.Q, 0, 1, 0, 2.4 * z, col);
        }
        if (F) {
          win(F, 0.1, 0.56, 0.17, 0.42, z);                                               // Schaufenster
          faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(shade(PIZ_GREEN, -0.3)));        // grüne Tür
        } else K.sideWins(B, 2, 0.17, 0.42);
        for (const S of Object.values(B.faces)) if (S) shutteredWin(K, S, z);
        tricolorAwning(K, B, 7.8, 10.6, 0.09);
      }],
      [ca, cb, () => ovenChimney(K, ca, cb, H + RH + 3.5, now, on)],
      hangSign(K, (cx, cy, zz) => miniPizza(cx, cy, zz, on), PIZ_ROOF, { up: H - 4, a0: A + HA + 0.04, b0: HB + 0.06, back: A - HA - 0.04 }),
    ]);
  };
  ART_SHADOW.pizzeria = [25, 0.2];
})();
