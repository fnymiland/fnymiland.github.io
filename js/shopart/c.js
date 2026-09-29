'use strict';
// Ladenbilder, Gruppe c (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Apotheke, Hofladen, Buchladen, Pizzeria. Die Hilfen stehen in einer Klammer, damit sie sich nicht mit denen der
// anderen Gruppen-Dateien beißen (alle Skripte teilen sich einen Namensraum).
(() => {
  const litNow = () => night > 0.15 && isLive();
  const l3 = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f];
  const byDepth = K => (p, q) => K.depth(p[0], p[1]) - K.depth(q[0], q[1]);

  // --- gemeinsame Teile -------------------------------------------------------------------------------------------
  // Ecke der Tür-Seite, die am Bildrand steht: dort hängt ein Ausleger-Schild, das man aus jeder Richtung sieht
  function edgeCorner(K, B) {
    const mid = K.depth(B.a, B.b), fa = B.a + B.ha, c1 = [fa, B.b + B.hb], c2 = [fa, B.b - B.hb];
    return Math.abs(K.depth(...c1) - mid) <= Math.abs(K.depth(...c2) - mid) ? c1 : c2;
  }
  // Ausleger (Nasenschild) an dieser Ecke in Höhe up; draw(x, y) bekommt den Aufhängepunkt am Ende des Arms
  function bracket(K, B, up, out, draw) {
    const [ca, cb] = edgeCorner(K, B), z = K.z, w = K.P(ca, cb, up), o = K.P(ca + out, cb, up), m = lerp(w, o, 0.55);
    kLine(K, [w[0], w[1] + 3 * z], [w[0], w[1] - 1.5 * z], '#3e3e4a', 1.4);         // Wandhalter
    kLine(K, [w[0], w[1] + 3 * z], m, '#3e3e4a', 0.7);                               // Strebe
    kLine(K, w, o, '#3e3e4a', 1);                                                     // Arm
    circle(o[0], o[1], 0.9 * z, C('#3e3e4a'));
    draw(o[0], o[1]);
  }
  // Dachflächen eines Walm- bzw. Satteldachs mit First entlang b (ha ≤ hb):
  // [Normale, Traufe Anfang, Traufe Ende, First über dem Anfang, First über dem Ende] – Punkte als [a, b, Höhe]
  function slopes(B, roofH, gable) {
    const ea = B.ha * 1.12, eb = B.hb * 1.12, top = B.lift + B.h, d = gable ? eb : eb - ea;
    const E = (sa, sb) => [B.a + sa * ea, B.b + sb * eb, top], R1 = [B.a, B.b - d, top + roofH], R2 = [B.a, B.b + d, top + roofH];
    const list = [[[1, 0], E(1, -1), E(1, 1), R1, R2], [[-1, 0], E(-1, 1), E(-1, -1), R2, R1]];
    if (!gable) list.push([[0, 1], E(1, 1), E(-1, 1), R2, R2], [[0, -1], E(-1, -1), E(1, -1), R1, R1]);
    return list;
  }
  // Linien quer über die vorderen Dachflächen (Reet-Lagen, Ziegelreihen)
  function roofLines(K, B, roofH, gable, fracs, col, w) {
    g.strokeStyle = C(col); g.lineWidth = w * K.z; g.lineCap = 'round'; g.beginPath();
    for (const [n, e0, e1, r0, r1] of slopes(B, roofH, gable)) {
      if (K.facing(...n) < 0) continue;
      for (const f of fracs) { const p = K.P(...l3(e0, r0, f)), q = K.P(...l3(e1, r1, f)); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
    }
    g.stroke();
  }
  // Aufsteller (Kundenstopper) mit Rahmen, Tafel und Symbol
  function standBoard(K, a, b, frame, board, icon) {
    const z = K.z, [x, y] = K.P(a, b);
    ellipse(x, y + 0.5 * z, 4.6 * z, 1.4 * z, 'rgba(40,60,20,0.15)');
    kLine(K, [x - 3.4 * z, y], [x - 2.6 * z, y - 10 * z], shade(frame, -0.25), 1);
    kLine(K, [x + 3.4 * z, y], [x + 2.6 * z, y - 10 * z], shade(frame, -0.25), 1);
    poly([[x - 3.8 * z, y - 11 * z], [x + 3.8 * z, y - 11 * z], [x + 4.2 * z, y - 2.5 * z], [x - 4.2 * z, y - 2.5 * z]], C(frame));
    poly([[x - 3.1 * z, y - 10.3 * z], [x + 3.1 * z, y - 10.3 * z], [x + 3.4 * z, y - 3.2 * z], [x - 3.4 * z, y - 3.2 * z]], C(board));
    icon(x, y - 6.8 * z, z);
  }
  function pumpkinAt(K, x, y, r) {                         // (x, y) = Mitte, r in px (schon mit z)
    const z = K.z;
    ellipse(x, y, r * 1.2, r * 0.88, C('#f28c28'));
    ellipse(x, y, r * 0.45, r * 0.88, C('#e2761a'));
    ellipse(x - r * 0.55, y - r * 0.35, r * 0.28, r * 0.2, C('#ffb65c'));
    kLine(K, [x, y - r * 0.8], [x + 0.6 * z, y - r * 1.3], '#4f7a2a', 1);
  }
  function appleAt(x, y, r, col, z) {
    circle(x, y, r, C(col));
    circle(x - r * 0.35, y - r * 0.35, r * 0.3, C(shade(col, 0.45)));
    ellipse(x + r * 0.35, y - r * 1.05, r * 0.4, r * 0.2, C('#58b36a'));
  }

  // --- Apotheke: weiß mit grünem Kreuz ------------------------------------------------------------------------------
  const APO = '#1fa84f';
  const crossPts = (x, y, s, t) => [[x - t, y - s], [x + t, y - s], [x + t, y - t], [x + s, y - t], [x + s, y + t], [x + t, y + t],
    [x + t, y + s], [x - t, y + s], [x - t, y + t], [x - s, y + t], [x - s, y - t], [x - t, y - t]];
  // Grünes Apothekenkreuz um (x, y) – s halbe Länge, t halbe Balkenbreite (px): weißer Rand, dunkle Kante, nachts hell
  function greenCross(x, y, s, t, z, on) {
    poly(crossPts(x, y, s + 1.1 * z, t + 1.1 * z), C('#ffffff'));
    poly(crossPts(x + 1.1 * z, y + 0.8 * z, s, t), on ? '#1f9a52' : C('#11773a'));
    poly(crossPts(x, y, s, t), on ? '#6dffa3' : C(APO));
    poly([[x - t + 0.5 * z, y - s + 0.6 * z], [x - t + 1.5 * z, y - s + 0.6 * z], [x - t + 1.5 * z, y - t], [x - t + 0.5 * z, y - t]], on ? '#e0ffea' : C('#74dd99'));
    if (on) glowQuad([[x - t, y - s], [x + t, y - s], [x + t, y + s], [x - t, y + s]], s * 3.4, 'blue');
  }
  function bottles(F, z) {                                  // Regal mit bunten Fläschchen im Schaufenster
    const cols = ['#1fa84f', '#e8604f', '#5f8fe8', '#ffffff', '#e9c46a', '#c3a8e6'];
    for (let r = 0; r < 2; r++) {
      const base = F.H * (0.1 + r * 0.16);
      faceQuad(F.P, F.Q, 0.12, 0.54, base - 0.7 * z, base, C('#ffffff'));
      for (let i = 0; i < 6; i++) {
        const t0 = 0.145 + i * 0.066;
        faceQuad(F.P, F.Q, t0, t0 + 0.034, base, base + F.H * (0.075 + (i % 2) * 0.03), C(cols[(i + r * 2) % 6]));
      }
    }
  }
  function herbPlanter(K, a, b) {                          // Kräuterkasten vor dem Schaufenster
    const z = K.z, B = K.block({ a, b, ha: 0.045, hb: 0.12, h: 3.2, wall: '#ffffff', type: 'flat', roof: '#7a5a3c' });
    for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, F.H * 0.62, F.H, K.wallCol(APO, F.n));
    const herbs = [];
    for (let i = 0; i < 5; i++) herbs.push([a, b - 0.09 + i * 0.045, i]);
    for (const [ha, hb, i] of herbs.sort(byDepth(K))) {
      const [hx, hy] = K.P(ha, hb, 3.2);
      circle(hx, hy - 1.7 * z, 1.9 * z, C(i % 2 ? '#3f9a4a' : '#58b36a'));
      if (i % 2 === 0) circle(hx + 0.6 * z, hy - 3 * z, 0.6 * z, C('#c3a8e6'));
    }
  }
  function topiary(K, a, b) {
    const z = K.z, [x, y] = K.P(a, b);
    box(x, y, 2.2 * z, 1.1 * z, 3.4 * z, '#e6ece9', null, 0);
    circle(x, y - 7 * z, 3.3 * z, C('#3f9a4a'));
    circle(x - 1.1 * z, y - 8.1 * z, 1.5 * z, C('#66bd6e'));
  }
  SHOP_ART.apotheke = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), H = 22, RH = 9;
    K.scene([
      [-0.08, 0, () => {
        const B = shopHouse(K, { wall: '#ffffff', roof: '#4f7a6a', roofType: 'hip', h: H, roofH: RH, trim: APO });
        for (const [name, F] of Object.entries(B.faces)) {
          if (!F) continue;
          const col = K.wallCol(APO, F.n);
          faceQuad(F.P, F.Q, 0, 1, F.H * 0.47, F.H * 0.53, col);                            // grünes Band zwischen den Geschossen
          if (name === 'front') { faceQuad(F.P, F.Q, 0, 0.64, 0, F.H * 0.07, col); faceQuad(F.P, F.Q, 0.86, 1, 0, F.H * 0.07, col); }
          else faceQuad(F.P, F.Q, 0, 1, 0, F.H * 0.07, col);                                // grüner Sockel
        }
        const F = B.faces.front;
        if (F) {
          bottles(F, z);
          faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, K.wallCol(APO, F.n));               // Glastür mit grünem Rahmen
          windowOn(F.P, F.Q, 0.675, 0.825, F.H * 0.03, F.H * 0.38, z);
        }
        bracket(K, B, 19.5, 0.13, (bx, by) => {                                              // leuchtendes Kreuz an der Ecke
          kLine(K, [bx, by], [bx, by + 2.2 * z], '#3e3e4a', 0.6);
          greenCross(bx, by + 8.4 * z, 5.6 * z, 2 * z, z, on);
        });
      }],
      [-0.08, 0, () => {                                                                   // großes Kreuz auf dem Dach
        const [px, py] = K.P(-0.08, 0, H + RH - 1);
        box(px, py, 2.8 * z, 1.4 * z, 3 * z, '#e6ece9', null, 0);
        kLine(K, [px, py - 3 * z], [px, py - 6.5 * z], '#8a8f99', 1.6);
        greenCross(px, py - 15.5 * z, 8.6 * z, 3 * z, z, on);
      }],
      [0.36, 0.03, () => topiary(K, 0.36, 0.03)],
      [0.36, 0.34, () => topiary(K, 0.36, 0.34)],
      [0.4, -0.13, () => herbPlanter(K, 0.4, -0.13)],
    ]);
  };

  // --- Hofladen: Holz-Fachwerk, dickes Reetdach, Wetterhahn, Korb voller Obst -------------------------------------
  const THATCH = '#d9b25a';
  function beams(K, B) {                                    // dunkle Fachwerk-Balken, frei um Fenster und Tür
    const z = K.z, lowWins = !B.faces.front;               // Tür hinten: die Seiten haben unten Fenster
    g.strokeStyle = C('#4a2e1c'); g.lineWidth = 1.25 * z; g.lineCap = 'round'; g.beginPath();
    for (const [name, F] of Object.entries(B.faces)) {
      if (!F) continue;
      const seg = (t0, h0, t1, h1) => { const p = faceAt(F, t0, F.H * h0), q = faceAt(F, t1, F.H * h1); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
      seg(0.02, 0, 0.02, 0.9); seg(0.98, 0, 0.98, 0.9);                                    // Eckständer
      seg(0.02, 0.48, 0.98, 0.48);                                                         // Riegel zwischen den Geschossen
      seg(0.5, 0.48, 0.5, 0.9);                                                            // Ständer oben
      seg(0.05, 0.5, 0.2, 0.88); seg(0.95, 0.5, 0.8, 0.88);                                // Streben oben
      if (name === 'front') { seg(0.6, 0, 0.6, 0.48); seg(0.9, 0, 0.9, 0.48); }
      else if (lowWins) seg(0.5, 0, 0.5, 0.48);
      else { seg(0.5, 0, 0.5, 0.48); seg(0.06, 0.06, 0.44, 0.44); seg(0.94, 0.06, 0.56, 0.44); }
    }
    g.stroke();
  }
  function eaveBand(K, B, col, hgt) {                       // dicke Traufkante des Reetdachs
    const ea = B.ha * 1.12, eb = B.hb * 1.12, top = B.lift + B.h;
    const E = (s, up) => K.P(B.a + s[0] * ea, B.b + s[1] * eb, up);
    for (const f of Object.values(FACES)) {
      if (K.facing(...f.n) <= 0.01) continue;
      poly([E(f.p, top), E(f.q, top), E(f.q, top - hgt), E(f.p, top - hgt)], K.wallCol(col, f.n));
    }
  }
  function weathervane(K, a, b, up, now) {                  // Wetterhahn auf dem First
    const z = K.z, [x, y] = K.P(a, b, up), col = '#353a46', sx = 0.88 + 0.12 * Math.sin(now / 2300);
    kLine(K, [x, y + 1 * z], [x, y - 9 * z], col, 1.1);
    kLine(K, [x - 4.5 * z, y - 4 * z], [x + 4.5 * z, y - 4 * z], col, 0.6);
    kLine(K, [x - 2.2 * z, y - 5.3 * z], [x + 2.2 * z, y - 2.7 * z], col, 0.6);
    circle(x, y - 4 * z, 1 * z, C('#e9b949'));
    const R = (dx, dy) => [x + dx * z * sx, y - 9 * z + dy * z];
    kLine(K, R(-6, 0), R(7, 0), col, 0.8);                                                  // Pfeil
    poly([R(-7.8, 0), R(-5, -1.6), R(-5, 1.6)], C(col));
    poly([R(5, 0), R(7.8, -2), R(8.8, -2), R(6.8, 0), R(8.8, 2), R(7.8, 2)], C(col));
    poly([R(1.5, -3), R(5.2, -11.8), R(8.6, -9.2), R(7.6, -5), R(4, -1.8)], C(col));        // Schwanz
    ellipse(...R(0.6, -3.8), 4.2 * z * sx, 2.8 * z, C(col));                               // Körper
    poly([R(-3.3, -3.6), R(-1.2, -3), R(-1.6, -7.8), R(-3.9, -7.8)], C(col));             // Hals
    circle(...R(-2.9, -8.4), 1.9 * z, C(col));                                              // Kopf
    for (const [dx, dy, r] of [[-3.8, -10.3, 0.9], [-2.7, -10.8, 1], [-1.6, -10.2, 0.85]]) circle(...R(dx, dy), r * z, C('#e8604f'));
    poly([R(-4.6, -8.9), R(-6.7, -8.2), R(-4.6, -7.6)], C('#e9b949'));                     // Schnabel
    ellipse(...R(-4.1, -6.7), 0.6 * z * sx, 1 * z, C('#e8604f'));                          // Kehllappen
    kLine(K, R(-0.6, -1.2), R(-0.6, 0), col, 0.6); kLine(K, R(1.6, -1.2), R(1.6, 0), col, 0.6);
  }
  function hayBale(K, a, b) {
    const B = K.block({ a, b, ha: 0.075, hb: 0.115, h: 4.5, wall: '#e2bd5c', type: 'flat', roof: '#f0d27e' });
    for (const F of Object.values(B.faces)) if (F && F.n[0]) for (const tt of [0.28, 0.72]) faceQuad(F.P, F.Q, tt - 0.02, tt + 0.02, 0, F.H, C('#a8793a'));
    K.rect(a - 0.075, b - 0.115 + 0.23 * 0.26, a + 0.075, b - 0.115 + 0.23 * 0.3, C('#b88a45'), 4.5);
    K.rect(a - 0.075, b - 0.115 + 0.23 * 0.7, a + 0.075, b - 0.115 + 0.23 * 0.74, C('#b88a45'), 4.5);
  }
  function bigBasket(K, a, b, up) {                         // großer Weidenkorb mit Äpfeln und Kürbissen
    const z = K.z, [x, y] = K.P(a, b, up), top = y - 6.5 * z;
    ellipse(x, y, 4.6 * z, 1.6 * z, C('#9a6530'));
    poly([[x - 6.2 * z, top], [x + 6.2 * z, top], [x + 4.6 * z, y], [x - 4.6 * z, y]], C('#c68a45'));
    poly([[x + 1.5 * z, top], [x + 6.2 * z, top], [x + 4.6 * z, y], [x + 1.1 * z, y]], C('#b27a3a'));
    g.strokeStyle = C('#8f5d2c'); g.lineWidth = 0.6 * z; g.beginPath();
    for (const f of [0.33, 0.66]) { const w = (4.6 + 1.6 * f) * z; g.moveTo(x - w, y - 6.5 * f * z); g.lineTo(x + w, y - 6.5 * f * z); }
    for (const u of [-0.6, -0.2, 0.2, 0.6]) { g.moveTo(x + u * 4.6 * z, y); g.lineTo(x + u * 6.2 * z, top); }
    g.stroke();
    ellipse(x, top, 6.4 * z, 1.9 * z, C('#a86f35'));
    ellipse(x, top - 0.2 * z, 5.4 * z, 1.3 * z, C('#6b4424'));
    pumpkinAt(K, x - 2.6 * z, top - 1.6 * z, 2.6 * z);
    pumpkinAt(K, x + 2.8 * z, top - 1.8 * z, 2.4 * z);
    appleAt(x, top - 3.2 * z, 1.9 * z, '#e8413b', z);
    appleAt(x - 4.4 * z, top - 0.4 * z, 1.6 * z, '#e8413b', z);
    appleAt(x + 0.3 * z, top - 0.3 * z, 1.7 * z, '#8cc63f', z);
    appleAt(x + 4.7 * z, top - 0.4 * z, 1.5 * z, '#e8413b', z);
    g.beginPath(); g.ellipse(x, top, 6.4 * z, 1.9 * z, 0, 0, Math.PI); g.fillStyle = C('#a86f35'); g.fill();   // vordere Kante
    g.strokeStyle = C('#8f5d2c'); g.lineWidth = 1.3 * z;
    g.beginPath(); g.ellipse(x, top - 0.5 * z, 5.6 * z, 6.8 * z, 0, Math.PI, 0); g.stroke();                       // Henkel
  }
  function pumpkinCart(K, a, b) {                           // Holzkarren mit Kürbissen
    const z = K.z, side = K.facing(0, 1) > 0 ? 1 : -1, hb = 0.1;
    const wheel = sgn => { const [wx, wy] = K.P(a, b + sgn * (hb + 0.012), 3); circle(wx, wy, 3 * z, C('#5b3a22')); circle(wx, wy, 2 * z, C('#a0714d')); circle(wx, wy, 0.7 * z, C('#5b3a22')); };
    const shaft = () => { kLine(K, K.P(a - 0.04, b + hb, 4.5), K.P(a, b + hb + 0.09, 2), '#6b4424', 0.9); kLine(K, K.P(a + 0.04, b + hb, 4.5), K.P(a, b + hb + 0.09, 2), '#6b4424', 0.9); };
    wheel(-side);
    if (side < 0) shaft();
    const B = K.block({ a, b, ha: 0.075, hb, h: 3.5, lift: 2.5, wall: '#9c6a3c', type: 'flat', roof: '#b98452' });
    for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0, 1, F.H * 0.45, F.H * 0.55, C('#7a4f2a'));
    if (side > 0) shaft();
    wheel(side);
    const low = [[a - 0.02, b - 0.045, 2.5], [a + 0.02, b + 0.045, 2.3]].sort(byDepth(K));
    for (const [pa, pb, r] of low) { const [px, py] = K.P(pa, pb, 6); pumpkinAt(K, px, py - r * 0.7 * z, r * z); }
    const [px, py] = K.P(a, b, 8); pumpkinAt(K, px, py - 1.6 * z, 2.1 * z);
  }
  function fruitCrates(K, a, b) {                           // Obstkisten an der Seite
    const spots = [[a - 0.065, b, '#c9955f'], [a + 0.065, b, '#d9b27a']].sort(byDepth(K));
    const fill = (ca, cb, up) => {
      const [cx, cy] = K.P(ca, cb, up), z = K.z, cols = ['#e8413b', '#ffd23f', '#8cc63f', '#e8413b'];
      [[-1.7, 0], [0, -0.8], [1.7, 0], [0, 0.8]].forEach(([dx, dy], i) => circle(cx + dx * z, cy + dy * z - 0.8 * z, 1.2 * z, C(cols[i])));
    };
    for (const [ca, cb, col] of spots) { kCrate(K, ca, cb, col); fill(ca, cb, 4.5); }
    kCrate(K, a - 0.065, b, '#b98452', 1, 4.5); fill(a - 0.065, b, 9);
  }
  function produceInWindow(F, z) {
    faceQuad(F.P, F.Q, 0.12, 0.54, F.H * 0.12 - 0.7 * z, F.H * 0.12, C('#7a4f2a'));
    const cols = ['#e8413b', '#8cc63f', '#ffd23f', '#f28c28', '#e8413b', '#8cc63f', '#f28c28'];
    for (let i = 0; i < 7; i++) { const [px, py] = faceAt(F, 0.155 + i * 0.058, F.H * 0.12 + 1.1 * z); circle(px, py, 1.1 * z, C(cols[i])); }
  }
  SHOP_ART.hofladen = function (K, s, now, x, y, t) {
    const z = K.z, H = 20, RH = 15;
    K.scene([
      [-0.47, 0.26, () => haystack(K, -0.47, 0.26)],
      [-0.13, -0.46, () => [[-0.2, -0.46, 2.6], [-0.06, -0.47, 2.1]].sort(byDepth(K)).forEach(([pa, pb, r]) => { const [px, py] = K.P(pa, pb); pumpkinAt(K, px, py - r * 0.8 * z, r * z); })],
      [-0.08, 0, () => {
        const B = shopHouse(K, { wall: '#b5773f', roof: THATCH, roofType: 'hip', h: H, roofH: RH, ha: 0.33, hb: 0.39, upperWins: 0 });
        for (const S of Object.values(B.faces)) if (S) for (const [t0, t1] of [[0.27, 0.43], [0.57, 0.73]]) windowOn(S.P, S.Q, t0, t1, S.H * 0.56, S.H * 0.8, z);
        if (B.faces.front) produceInWindow(B.faces.front, z);
        beams(K, B);
        eaveBand(K, B, shade(THATCH, -0.2), 2.6);
        roofLines(K, B, RH, false, [0.3, 0.6], shade(THATCH, -0.24), 0.9);
      }],
      [-0.08, 0, () => weathervane(K, -0.08, 0, H + RH - 0.5, now)],
      [0.07, 0.45, () => fruitCrates(K, 0.07, 0.45)],
      [0.42, -0.33, () => { hayBale(K, 0.42, -0.33); bigBasket(K, 0.42, -0.33, 4.5); }],
      [0.42, -0.02, () => pumpkinCart(K, 0.42, -0.02)],
      [0.33, 0.47, () => standBoard(K, 0.33, 0.47, '#8a5a3c', '#2f3a33', (bx, by, zz) => {
        kLine(K, [bx - 2.2 * zz, by - 2 * zz], [bx + 1.8 * zz, by - 2 * zz], '#f5f5f0', 0.5);
        kLine(K, [bx - 2.2 * zz, by - 0.6 * zz], [bx + 0.6 * zz, by - 0.6 * zz], '#f5f5f0', 0.5);
        appleAt(bx + 0.6 * zz, by + 1.6 * zz, 1.3 * zz, '#e8413b', zz);
        kLine(K, [bx - 2.4 * zz, by + 1.6 * zz], [bx - 1 * zz, by + 1.6 * zz], '#f5f5f0', 0.5);
      })],
    ]);
  };

  // --- Buchladen: Flaschengrün mit Gold, aufgeschlagenes Buch auf dem Dach ------------------------------------------
  const GOLD = '#d4af37';
  const SPINES = ['#e8604f', '#5f8fe8', '#e9c46a', '#58b36a', '#c3a8e6', '#f28cb1', '#ff9f5a', '#fffaf0', '#8e2c3a'];
  function bookSpines(F, t0, t1, h0, h1, z, seed) {         // zwei Regalböden voller bunter Buchrücken
    const rowH = (h1 - h0) / 2;
    for (let r = 0; r < 2; r++) {
      const base = F.H * (h0 + r * rowH);
      faceQuad(F.P, F.Q, t0, t1, base - 0.8 * z, base, C('#6b4f3a'));
      let tt = t0 + 0.008;
      for (let i = 0; i < 16 && tt < t1 - 0.025; i++) {
        const w = 0.022 + ((i * 7 + r * 5 + seed) % 3) * 0.006, top = base + F.H * rowH * (0.6 + ((i * 5 + r * 3 + seed) % 4) * 0.09);
        faceQuad(F.P, F.Q, tt, Math.min(tt + w, t1), base, top, C(SPINES[(i * 4 + r * 3 + seed) % SPINES.length]));
        tt += w + 0.005;
      }
    }
  }
  function dormers(K, B, roofH) {                           // Gaubenfenster im steilen Teil des Mansarddachs
    const z = K.z, on = litNow(), ea = B.ha * 1.12, eb = B.hb * 1.12, ka = ea * 0.66, kb = eb * 0.66, top = B.lift + B.h, m = top + roofH * 0.62;
    for (const n of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      if (K.facing(...n) <= 0.01) continue;
      const pt = (s, w) => n[0] ? K.P(B.a + n[0] * (ea + (ka - ea) * s), B.b + w, top + (m - top) * s)
                                : K.P(B.a + w, B.b + n[1] * (eb + (kb - eb) * s), top + (m - top) * s);
      const quad = (s0, s1, w) => [pt(s0, -w), pt(s0, w), pt(s1, w), pt(s1, -w)];
      poly(quad(0.1, 0.94, 0.1), C(GOLD));
      const q = quad(0.24, 0.82, 0.068);
      poly(q, on ? '#ffd873' : C('#a8dcff'));
      glowQuad(q, 14 * z);
    }
  }
  function openBook(K, a, b, up, on) {                      // großes aufgeschlagenes Buch, aufrecht auf dem Dach
    const z = K.z, [x0, y0] = K.P(a, b, up), W = 12 * z, Hh = 14 * z, y = y0 - 4 * z;
    kLine(K, [x0 - 5 * z, y0 + 0.5 * z], [x0 - 5 * z, y - 1 * z], '#a8862a', 1.3);
    kLine(K, [x0 + 5 * z, y0 + 0.5 * z], [x0 + 5 * z, y - 1 * z], '#a8862a', 1.3);
    poly([[x0, y + 1.9 * z], [x0 - W - 1.5 * z, y - 0.9 * z], [x0 - W - 1.5 * z, y - Hh - 0.7 * z], [x0, y - Hh + 2.6 * z],
          [x0 + W + 1.5 * z, y - Hh - 0.7 * z], [x0 + W + 1.5 * z, y - 0.9 * z]], C('#8e2c3a'));                  // Einband
    for (const d of [-1, 1]) {                                                            // goldene Buchecken
      poly([[x0 + d * (W + 1.5 * z), y - Hh - 0.7 * z], [x0 + d * (W - 1.5 * z), y - Hh - 0.4 * z], [x0 + d * (W + 1.5 * z), y - Hh + 2.4 * z]], C(GOLD));
      poly([[x0 + d * (W + 1.5 * z), y - 0.9 * z], [x0 + d * (W - 1.5 * z), y - 1 * z], [x0 + d * (W + 1.5 * z), y - 3.9 * z]], C(GOLD));
    }
    const page = d => {
      g.beginPath(); g.moveTo(x0, y);
      g.quadraticCurveTo(x0 + d * W * 0.4, y - 2.3 * z, x0 + d * W, y - 2 * z);
      g.lineTo(x0 + d * W, y - Hh);
      g.quadraticCurveTo(x0 + d * W * 0.4, y - Hh - 0.6 * z, x0, y - Hh + 2.4 * z);
      g.closePath(); g.fillStyle = d < 0 ? C('#fffaf0') : C('#f1e6cf'); g.fill();
      if (on) glowQuad([[x0, y], [x0 + d * W, y - 2 * z], [x0 + d * W, y - Hh], [x0, y - Hh + 2.4 * z]], 18 * z);
    };
    page(-1); page(1);
    g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.7 * z; g.lineCap = 'round'; g.beginPath();
    for (const d of [-1, 1]) for (let i = 0; i < 4; i++) {
      const yy = y - Hh + 4.4 * z + i * 2.3 * z, x1 = x0 + d * 2 * z, x2 = x0 + d * (W - (i === 3 && d > 0 ? 5 : 1.6) * z);
      g.moveTo(x1, yy + 1.2 * z); g.quadraticCurveTo(x0 + d * W * 0.45, yy - 0.3 * z, x2, yy - 0.3 * z);
    }
    g.stroke();
    kLine(K, [x0, y], [x0, y - Hh + 2.4 * z], '#cbbd9f', 0.8);                           // Falz
    poly([[x0 + 0.3 * z, y - Hh + 2.6 * z], [x0 + 1.5 * z, y - Hh + 2.8 * z], [x0 + 1.9 * z, y + 3.6 * z], [x0 + 1.1 * z, y + 2.7 * z], [x0 + 0.4 * z, y + 3.7 * z]], C('#e8604f'));   // Lesebändchen
  }
  function bookTrolley(K, a, b) {                           // Bücherwagen vor dem Laden
    const z = K.z;
    for (const [da, db] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [wx, wy] = K.P(a + da * 0.06, b + db * 0.1, 1); circle(wx, wy, 1.1 * z, C('#3e3e4a')); }
    K.block({ a, b, ha: 0.08, hb: 0.12, h: 4, lift: 1.5, wall: '#7a4f2a', type: 'flat', roof: '#a0714d' });
    const books = [];
    for (let i = 0; i < 7; i++) books.push([a, b - 0.098 + i * 0.0325, i]);
    books.sort(byDepth(K));
    for (const [ba, bb, i] of books) K.block({ a: ba, b: bb, ha: 0.055, hb: 0.014, h: 4.5 + ((i * 5) % 3), lift: 5.5, wall: SPINES[i % SPINES.length], type: 'flat', roof: '#fffaf0' });
  }
  function bookStack(K, a, b) {
    const cols = ['#5f8fe8', '#e8604f', '#e9c46a', '#58b36a'];
    for (let i = 0; i < 4; i++) K.block({ a: a + (i % 2 ? 0.012 : -0.01), b: b + (i % 2 ? -0.014 : 0.01), ha: 0.05, hb: 0.07, h: 1.8, lift: i * 1.8, wall: cols[i], type: 'flat', roof: '#fffaf0' });
  }
  SHOP_ART.buchladen = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), H = 21, RH = 12;
    K.scene([
      [-0.08, 0, () => {
        const B = shopHouse(K, { wall: '#2f5d50', roof: '#6b4f3a', roofType: 'mansard', h: H, roofH: RH, trim: GOLD });
        const F = B.faces.front;
        if (F) bookSpines(F, 0.11, 0.55, 0.1, 0.41, z, 0);
        else ['right', 'left', 'back'].forEach((n, k) => { const S = B.faces[n]; if (S) for (let i = 0; i < 2; i++) bookSpines(S, 0.1 + 0.4 * (i + 0.12), 0.1 + 0.4 * (i + 0.88), 0.14, 0.39, z, i + k); });
        for (const S of Object.values(B.faces)) {
          if (!S) continue;
          const gold = K.wallCol(GOLD, S.n);
          faceQuad(S.P, S.Q, 0, 1, S.H * 0.46, S.H * 0.53, gold);                            // goldenes Gesims
          for (let i = 0; i < 2; i++) faceQuad(S.P, S.Q, 0.1 + 0.4 * (i + 0.12) - 0.02, 0.1 + 0.4 * (i + 0.88) + 0.02, S.H * 0.6, S.H * 0.64, gold);   // Fensterbänke
        }
        dormers(K, B, RH);
      }],
      [-0.08, 0, () => openBook(K, -0.08, 0, H + RH, on)],
      [0.4, -0.3, () => bookTrolley(K, 0.4, -0.3)],
      [0.34, 0.45, () => bookStack(K, 0.34, 0.45)],
    ]);
  };

  // --- Pizzeria: Terrakotta, Ziegeldach, grün-weiß-rote Markise, Pizza-Schild und Ofen-Schornstein ------------------
  function tricolorAwning(K, B, h0, h1, out) {
    if (!B.faces.front) return;
    const fa = B.a + B.ha, n = 9, b0 = B.b - B.hb * 0.94, b1 = B.b + B.hb * 0.94, cols = ['#2e9e4f', '#fbf2e2', '#d93a2b'];
    const bAt = i => b0 + (b1 - b0) * i / n;
    for (let i = 0; i < n; i++) {
      const col = cols[i % 3];
      poly([K.P(fa, bAt(i), h1), K.P(fa, bAt(i + 1), h1), K.P(fa + out, bAt(i + 1), h0), K.P(fa + out, bAt(i), h0)], C(col));
      poly([K.P(fa + out, bAt(i), h0), K.P(fa + out, bAt(i + 1), h0), K.P(fa + out, bAt(i + 1), h0 - 1.6), K.P(fa + out, bAt(i + 0.5), h0 - 3), K.P(fa + out, bAt(i), h0 - 1.6)], K.wallCol(shade(col, -0.1), [1, 0]));
    }
  }
  function shutters(K, B) {                                 // grüne Fensterläden an den oberen Fenstern
    for (const F of Object.values(B.faces)) {
      if (!F) continue;
      const col = K.wallCol('#2e7d4f', F.n);
      for (let i = 0; i < 2; i++) {
        const t0 = 0.1 + 0.4 * (i + 0.12), t1 = 0.1 + 0.4 * (i + 0.88);
        faceQuad(F.P, F.Q, t0 - 0.046, t0 - 0.004, F.H * 0.62, F.H * 0.88, col);
        faceQuad(F.P, F.Q, t1 + 0.004, t1 + 0.046, F.H * 0.62, F.H * 0.88, col);
      }
    }
  }
  function ovenInWindow(F, now, on, z) {                    // Steinofen mit Feuer im Schaufenster
    const arch = (tc, rt, h0, rh) => {
      const pts = [faceAt(F, tc + rt, h0), faceAt(F, tc - rt, h0)];
      for (let k = 0; k <= 8; k++) { const th = Math.PI * k / 8; pts.push(faceAt(F, tc - rt * Math.cos(th), h0 + rh * Math.sin(th))); }
      return pts;
    };
    poly(arch(0.33, 0.14, F.H * 0.09, F.H * 0.26), C('#9c3b26'));
    poly(arch(0.33, 0.08, F.H * 0.09, F.H * 0.14), C('#2b1610'));
    const fl = Math.sin(now / 180) * 0.3 * z, [fx, fy] = faceAt(F, 0.33, F.H * 0.09);
    ellipse(fx, fy - 1.5 * z, 2.4 * z, 1.4 * z + fl, C('#ff7a2e'));
    ellipse(fx, fy - 1.6 * z, 1.3 * z, 0.9 * z + fl * 0.5, C('#ffd23f'));
    if (on) kGlow(fx, fy - 2 * z, z, 16);
  }
  const CHEESE = [[-3, -2, 2.2], [2.5, -3.5, 1.8], [3.2, 2.2, 2.3], [-2.2, 3, 1.9], [0.3, 0.2, 1.7], [-5, 0.8, 1.3], [5.2, -0.8, 1.2]];
  const SALAMI = [[-3.5, -3.5], [3, -1], [-1, 3.8], [3.6, 3.6], [-4.4, 1.6], [0.6, -5]];
  const BASIL = [[0.8, -2.2], [-2.6, 0.9], [1.8, 4.8], [4.7, 0.9], [-1.4, -5.3]];
  function pizzaSign(K, a, b, up, on) {                     // großes rundes Pizza-Schild
    const z = K.z, [bx, by] = K.P(a, b, up), R = 9.5 * z, x = bx, y = by - 4 * z - R;
    kLine(K, [bx - 3 * z, by + 0.8 * z], [x - 3 * z, y], '#4a4a58', 1.2);
    kLine(K, [bx + 3 * z, by + 0.8 * z], [x + 3 * z, y], '#4a4a58', 1.2);
    circle(x + 1.3 * z, y + 1.1 * z, R, C('#a8642a'));                                    // Kante (Tiefe)
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
    if (on) {                                                                             // Neonring
      g.strokeStyle = '#fff0a8'; g.lineWidth = 1.4 * z;
      g.beginPath(); g.arc(x, y, R + 1 * z, 0, Math.PI * 2); g.stroke();
      kGlow(x, y, z, 34);
    }
  }
  function ovenChimney(K, a, b, up, now) {                  // gemauerter Ofen-Schornstein mit Rauch
    const z = K.z, B = K.block({ a, b, ha: 0.06, hb: 0.06, h: 11, lift: up, wall: '#b5523a', type: 'flat', roof: '#4a2a22' });
    for (const F of Object.values(B.faces)) {
      if (!F) continue;
      const mortar = C('#e8b39a');
      for (let r = 1; r < 4; r++) faceQuad(F.P, F.Q, 0, 1, F.H * r / 4 - 0.25 * z, F.H * r / 4 + 0.25 * z, mortar);
      for (let r = 0; r < 4; r++) for (const tt of r % 2 ? [0.25, 0.75] : [0.5]) faceQuad(F.P, F.Q, tt - 0.035, tt + 0.035, F.H * r / 4, F.H * (r + 1) / 4, mortar);
    }
    K.block({ a, b, ha: 0.08, hb: 0.08, h: 1.6, lift: up + 11, wall: '#8a3a28', type: 'flat', roof: '#3a1f18' });
    const [sx, sy] = K.P(a, b, up + 12.6);
    smoke(sx, sy - 1 * z, z, now);
  }
  function checkeredTable(K, a, b, on) {                    // Tisch mit rot-weiß kariertem Tischtuch, zwei Stühle
    const z = K.z, A = 0.075, Bw = 0.075, up = 5.8;
    const chair = (cb, sgn) => () => {
      K.block({ a, b: cb, ha: 0.035, hb: 0.035, h: 3.4, wall: '#6b4f3a', type: 'flat', roof: '#8a5a3c' });
      K.block({ a, b: cb + sgn * 0.03, ha: 0.035, hb: 0.007, h: 4, lift: 3.4, wall: '#6b4f3a', type: 'flat', roof: '#8a5a3c' });
    };
    const table = () => {
      kLine(K, K.P(a, b), K.P(a, b, 3.6), '#5b3a22', 1.4);
      const T = K.block({ a, b, ha: A, hb: Bw, h: 2.4, lift: 3.4, wall: '#d93a2b', type: 'none' });
      for (const F of Object.values(T.faces)) if (F) for (let i = 1; i < 6; i += 2) faceQuad(F.P, F.Q, i / 6, (i + 1) / 6, 0, F.H, C('#ffffff'));
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        K.rect(a - A + A * i / 2, b - Bw + Bw * j / 2, a - A + A * (i + 1) / 2, b - Bw + Bw * (j + 1) / 2, C((i + j) % 2 ? '#ffffff' : '#d93a2b'), up);
      }
      K.oval(a - 0.015, b + 0.015, 0.042, C('#e7a950'), up);                               // Pizza auf dem Tisch
      K.oval(a - 0.015, b + 0.015, 0.031, C('#d9412b'), up);
      const [cx, cy] = K.P(a + 0.04, b - 0.045, up);                                       // Kerze in der Flasche
      ellipse(cx, cy - 1.8 * z, 1.2 * z, 1.8 * z, C('#2e7d4f'));
      g.fillStyle = C('#2e7d4f'); g.fillRect(cx - 0.4 * z, cy - 4.4 * z, 0.8 * z, 1.4 * z);
      g.fillStyle = C('#fff6e4'); g.fillRect(cx - 0.35 * z, cy - 5.4 * z, 0.7 * z, 1.1 * z);
      circle(cx, cy - 6 * z, 0.6 * z, on ? '#ffe28a' : C('#ffb13b'));
      if (on) kGlow(cx, cy - 6 * z, z, 10);
    };
    [[a, b - 0.155, chair(b - 0.155, -1)], [a, b + 0.155, chair(b + 0.155, 1)], [a, b, table]].sort(byDepth(K)).forEach(p => p[2]());
  }
  function basilPot(K, a, b) {
    const z = K.z, [x, y] = K.P(a, b);
    box(x, y, 2.6 * z, 1.3 * z, 4 * z, '#c0694a', null, 0);
    for (const [dx, dy, r, c] of [[-1.6, -5.4, 2, '#3f9a3a'], [1.5, -5.2, 2, '#357f31'], [0, -7, 2.2, '#58b36a']]) circle(x + dx * z, y + dy * z, r * z, C(c));
  }
  SHOP_ART.pizzeria = function (K, s, now, x, y, t) {
    const z = K.z, on = litNow(), H = 21, RH = 11;
    K.scene([
      [-0.08, 0, () => {
        const B = shopHouse(K, { wall: '#d9744a', roof: '#a33b24', roofType: 'gable', ridge: 'b', h: H, roofH: RH });
        roofLines(K, B, RH, true, [0.25, 0.5, 0.75], '#7d2a18', 0.8);
        shutters(K, B);
        if (B.faces.front) ovenInWindow(B.faces.front, now, on, z);
        tricolorAwning(K, B, 8.6, 12, 0.1);
      }],
      [-0.08, 0, () => [[-0.08, 0.24, () => ovenChimney(K, -0.08, 0.24, H + RH - 2, now)], [-0.08, -0.1, () => pizzaSign(K, -0.08, -0.1, H + RH, on)]]
        .sort(byDepth(K)).forEach(p => p[2]())],
      [0.41, -0.25, () => checkeredTable(K, 0.41, -0.25, on)],
      [0.36, 0.04, () => basilPot(K, 0.36, 0.04)],
      [0.33, 0.47, () => standBoard(K, 0.33, 0.47, '#8a5a3c', '#2f3a33', (bx, by, zz) => {
        poly([[bx - 2.2 * zz, by - 1.8 * zz], [bx + 2.2 * zz, by - 1.8 * zz], [bx, by + 2.6 * zz]], C('#ffd766'));
        poly([[bx - 2.2 * zz, by - 1.8 * zz], [bx + 2.2 * zz, by - 1.8 * zz], [bx + 2 * zz, by - 1 * zz], [bx - 2 * zz, by - 1 * zz]], C('#e7a950'));
        circle(bx - 0.6 * zz, by - 0.2 * zz, 0.6 * zz, C('#d9412b')); circle(bx + 0.6 * zz, by + 0.6 * zz, 0.5 * zz, C('#d9412b'));
      })],
    ]);
  };
})();
