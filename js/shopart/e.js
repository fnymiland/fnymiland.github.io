'use strict';
// Ladenbilder, Gruppe e (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Boutique, Uhrmacher, Juwelier, Möbelhaus: feste Markenfarben und ein Wahrzeichen auf dem Dach, das man aus jeder
// Richtung und auch von weitem erkennt (Kleid am Bügel, Uhrtürmchen, Ring mit Brillant, Riesen-Sofa).
(function () {
  const lit = () => night > 0.15 && isLive();
  const allFaces = B => Object.values(B.faces).filter(Boolean);
  const sideFaces = B => ['right', 'left', 'back'].map(n => B.faces[n]).filter(Boolean);
  // Band um alle sichtbaren Wände (Gesims, Leuchtband …), Höhen als Anteil der Wand
  const band = (B, h0, h1, col) => { for (const F of allFaces(B)) faceQuad(F.P, F.Q, 0, 1, F.H * h0, F.H * h1, C(col)); };
  // Auf eine Wand malen: Ursprung bei t (0 … 1 von P nach Q) in Höhe up (px, schon mit z); x läuft auf dem Bildschirm
  // nach rechts die Wand entlang (schräg wie die Wand), y nach unten. Nie gespiegelt – Schrift und Uhren bleiben richtig.
  function onFace(F, t, up, fn) {
    const [ox, oy] = faceAt(F, t, up), dx = F.Q[0] - F.P[0], k = Math.abs(dx) > 1e-6 ? (F.Q[1] - F.P[1]) / dx : 0;
    g.save(); g.translate(ox, oy); g.transform(1, k, 0, 1, 0, 0);
    try { fn(); } finally { g.restore(); }
  }
  // Markise, die vor der Tür-Seite schräg herausragt (gestreift, mit Volant) – liest sich auch auf dunkler Wand
  function canopy(K, B, col, stripe = '#fbf2e2') {
    if (!B.faces.front) return;
    const af = B.a + B.ha, out = af + 0.1, up1 = B.h * 0.6, up0 = B.h * 0.45, b0 = B.b - B.hb * 0.92, span = B.hb * 1.84, n = 8;
    for (let i = 0; i < n; i++) {
      const s0 = b0 + span * i / n, s1 = b0 + span * (i + 1) / n, c = i & 1 ? stripe : col;
      poly([K.P(af, s0, up1), K.P(af, s1, up1), K.P(out, s1, up0), K.P(out, s0, up0)], C(c));
      poly([K.P(out, s0, up0), K.P(out, s1, up0), K.P(out, s1, up0 - 2.4), K.P(out, s0, up0 - 2.4)], C(shade(c, -0.12)));
    }
  }
  function star(x, y, r, col) {                                                   // vierzackiger Funkelstern
    const q = r * 0.28;
    poly([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], col);
  }
  // Zifferblatt um (0, 0) mit Radius r (px × z): Messingrand, Striche, Zeiger mit der echten Uhrzeit
  function clockFace(r, z, date, on) {
    circle(0, 0, r * 1.14 * z, C('#c9a24a'));
    circle(0, 0, r * z, on ? '#fff6c8' : C('#fffdf6'));
    g.strokeStyle = C('#2f3542'); g.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, big = i % 3 === 0, sx = Math.sin(a), cy = -Math.cos(a), r0 = r * (big ? 0.64 : 0.76) * z, r1 = r * 0.9 * z;
      g.lineWidth = (big ? 0.11 : 0.06) * r * z;
      g.beginPath(); g.moveTo(sx * r0, cy * r0); g.lineTo(sx * r1, cy * r1); g.stroke();
    }
    const m = date.getMinutes() + date.getSeconds() / 60, h = (date.getHours() % 12) + m / 60;
    const hand = (f, len, w, col) => {
      const a = f * Math.PI * 2;
      g.strokeStyle = C(col); g.lineWidth = w * r * z;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * len * r * z, -Math.cos(a) * len * r * z); g.stroke();
    };
    hand(h / 12, 0.5, 0.16, '#2f3542');
    hand(m / 60, 0.78, 0.1, '#2f3542');
    circle(0, 0, 0.14 * r * z, C('#c0392b'));
  }

  // ------------------------------------------------------------------ Boutique
  // Schaufensterpuppe im Kleid, Füße bei (0, 0), Größe u (px je Einheit, mit z)
  function mannequin(u, dress) {
    ellipse(0, 0, 1.8 * u, 0.5 * u, C('#3a3a44'));
    g.fillStyle = C('#3a3a44'); g.fillRect(-0.25 * u, -3 * u, 0.5 * u, 3 * u);
    poly([[-1.1 * u, -6.4 * u], [1.1 * u, -6.4 * u], [2.9 * u, -2.6 * u], [-2.9 * u, -2.6 * u]], C(dress));
    poly([[-1.3 * u, -9.2 * u], [1.3 * u, -9.2 * u], [1 * u, -6.3 * u], [-1 * u, -6.3 * u]], C(shade(dress, 0.14)));
    g.fillStyle = C('#2d2d38'); g.fillRect(-1.15 * u, -6.8 * u, 2.3 * u, 0.6 * u);
    g.fillStyle = C('#efe2d2'); g.fillRect(-0.35 * u, -10.2 * u, 0.7 * u, 1.1 * u);
    circle(0, -11.1 * u, 1.2 * u, C('#efe2d2'));
  }
  // Dachschild: Kleid auf goldenem Bügel, Haken bei (x, y), schwingt sacht
  function hangerDress(x, y, z, now, on) {
    const D = on ? '#ff9cbd' : C('#e8799a'), Dd = on ? '#f27aa2' : C('#c95a7d'), Dl = on ? '#ffc6d8' : C('#f6a9c0');
    g.save(); g.translate(x, y); g.rotate(Math.sin(now / 1400) * 0.05);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = C('#c9a24a'); g.lineWidth = 1.2 * z;                                   // Haken
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -1.8 * z); g.arc(1.5 * z, -1.8 * z, 1.5 * z, Math.PI, Math.PI * 2.2); g.stroke();
    g.strokeStyle = C('#d4af37'); g.lineWidth = 1.6 * z;                                   // Bügel
    g.beginPath(); g.moveTo(-9.5 * z, 5.2 * z); g.lineTo(0, 0); g.lineTo(9.5 * z, 5.2 * z); g.closePath(); g.stroke();
    g.strokeStyle = Dd; g.lineWidth = 0.8 * z;                                             // Träger
    g.beginPath(); g.moveTo(-3.8 * z, 4.3 * z); g.lineTo(-3.3 * z, 7 * z); g.moveTo(3.8 * z, 4.3 * z); g.lineTo(3.3 * z, 7 * z); g.stroke();
    poly([[-3.2 * z, 12.5 * z], [3.2 * z, 12.5 * z], [9.6 * z, 25 * z], [-9.6 * z, 25 * z]], D);          // Rock
    for (let i = 0; i < 6; i++) circle((-7.9 + i * 3.16) * z, 25 * z, 1.65 * z, D);                    // Wellensaum
    poly([[-3.2 * z, 12.5 * z], [-1.2 * z, 12.5 * z], [-4.6 * z, 25 * z], [-9.6 * z, 25 * z]], Dl);
    g.strokeStyle = Dd; g.lineWidth = 0.6 * z;
    g.beginPath(); g.moveTo(0.9 * z, 14 * z); g.lineTo(2.6 * z, 25 * z); g.moveTo(2.4 * z, 14 * z); g.lineTo(6 * z, 25 * z); g.stroke();
    poly([[-4 * z, 6.8 * z], [-1.6 * z, 6 * z], [0, 7.4 * z], [1.6 * z, 6 * z], [4 * z, 6.8 * z], [3.3 * z, 13 * z], [-3.3 * z, 13 * z]], D);
    g.fillStyle = C('#2d2d38'); g.fillRect(-3.5 * z, 12 * z, 7 * z, 1.6 * z);            // Gürtel mit Schleife
    poly([[0, 12.8 * z], [-2.6 * z, 11.5 * z], [-2.6 * z, 14.1 * z]], C('#f2b8c6'));
    poly([[0, 12.8 * z], [2.6 * z, 11.5 * z], [2.6 * z, 14.1 * z]], C('#f2b8c6'));
    circle(0, 12.8 * z, 0.7 * z, C('#d4af37'));
    g.restore();
  }
  SHOP_ART.boutique = function (K, s, now, x, y, t, ha, hb) {
    const WALL = '#2d2d38', BLUSH = '#f2b8c6', GOLD = '#d4af37', ROSE = '#e8799a', on = lit(), z = K.z;
    const house = () => {
      const B = shopHouse(K, { wall: WALL, roof: BLUSH, roofType: 'flat', h: 26, upperWins: 0, trim: GOLD });
      band(B, 0.9, 1, BLUSH);                                                               // rosa Gesims
      const F = B.faces.front;
      if (F) {
        onFace(F, 0.22, F.H * 0.09, () => mannequin(0.64 * z, ROSE));
        onFace(F, 0.44, F.H * 0.09, () => mannequin(0.64 * z, BLUSH));
        faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C('#e9a3b8'));                        // rosa Tür
        const [kx, ky] = faceAt(F, 0.68, F.H * 0.2); circle(kx, ky, 0.7 * z, C(GOLD));
        K.wins(B, 'front', 1, 0.62, 0.84, 0.08, 0.56);
        onFace(F, 0.75, F.H * 0.72, () => kText(0, 0, 'MODE', 3.6, on ? '#ffe9a6' : GOLD, z));
        if (on) { const [mx, my] = faceAt(F, 0.75, F.H * 0.72); kGlow(mx, my, z, 12); }
        canopy(K, B, '#1f1f28');
      }
      for (const S of sideFaces(B)) {                                                      // Schaufenster auch um die Ecke
        faceQuad(S.P, S.Q, 0.1, 0.9, S.H * 0.05, S.H * 0.47, C(GOLD));
        windowOn(S.P, S.Q, 0.14, 0.86, S.H * 0.08, S.H * 0.44, z);
        onFace(S, 0.33, S.H * 0.09, () => mannequin(0.64 * z, ROSE));
        onFace(S, 0.67, S.H * 0.09, () => mannequin(0.64 * z, '#fffaf0'));
      }
      K.sideWins(B, 2, 0.62, 0.84);
    };
    const sign = () => {                                                                    // Kleid am Bügel auf dem Dach
      const [px, py] = K.P(-0.08, 0, 26), top = py - 33 * z;
      ellipse(px + 1.5 * z, py, 3.2 * z, 1.4 * z, C(shade(GOLD, -0.2)));
      kLine(K, [px + 1.5 * z, py], [px + 1.5 * z, top - 3.3 * z], GOLD, 1.3);
      if (on) kGlow(px, top + 15 * z, z, 28);
      hangerDress(px, top, z, now, on);
    };
    const rack = () => {                                                                    // Kleiderständer vor der Tür
      const p0 = K.P(0.44, -0.48), p1 = K.P(0.44, -0.24);
      for (const p of [p0, p1]) { ellipse(p[0], p[1], 1.6 * z, 0.7 * z, C('#8a8f99')); kLine(K, p, [p[0], p[1] - 11 * z], GOLD, 0.9); }
      kLine(K, [p0[0], p0[1] - 11 * z], [p1[0], p1[1] - 11 * z], GOLD, 0.9);
      [ROSE, WALL, '#fffaf0', BLUSH].forEach((c, i) => {
        const m = lerp(p0, p1, 0.2 + i * 0.2), gx = m[0], gy = m[1] - 11 * z;
        kLine(K, [gx, gy], [gx, gy + 1.2 * z], '#8a8f99', 0.5);
        poly([[gx - 1.5 * z, gy + 1.2 * z], [gx + 1.5 * z, gy + 1.2 * z], [gx + 2 * z, gy + 6.2 * z], [gx - 2 * z, gy + 6.2 * z]], C(c));
      });
    };
    K.scene([[-0.08, 0, house], [-0.08, 0, sign], [0.44, -0.36, rack]]);
  };

  // ------------------------------------------------------------------ Uhrmacher
  function windowClocks(z, date, small) {                                                   // Uhren im Schaufenster
    if (!small) {
      g.fillStyle = C('#7a4f2a'); g.fillRect(-7.2 * z, -7.4 * z, 2.8 * z, 7.4 * z);           // Standuhr mit Pendel
      circle(-5.8 * z, -6 * z, 1 * z, C('#fffdf6'));
      g.fillStyle = C('#c9a24a'); g.fillRect(-6.1 * z, -4 * z, 0.6 * z, 2.6 * z);
    }
    for (const [cx, cy, r] of small ? [[0, -3.2, 2]] : [[0, -4.3, 2.2], [5.2, -2.6, 1.6]]) {
      g.save(); g.translate(cx * z, cy * z); clockFace(r, z, date, false); g.restore();
    }
  }
  function pocketWatch(x, y, z, date, on) {                                                 // hängende Taschenuhr
    g.strokeStyle = C('#d4af37'); g.lineWidth = 0.8 * z;
    g.beginPath(); g.arc(x, y - 6.4 * z, 1.3 * z, 0, Math.PI * 2); g.stroke();              // Bügel
    circle(x, y - 4.9 * z, 1 * z, C('#c9a24a'));                                            // Krone
    circle(x, y, 4.9 * z, C('#b8922f'));
    g.save(); g.translate(x, y); clockFace(3.9, z, date, on); g.restore();
    ellipse(x - 2 * z, y - 2.4 * z, 1.1 * z, 0.6 * z, 'rgba(255,255,255,0.55)');         // Glanz
  }
  SHOP_ART.uhrmacher = function (K, s, now, x, y, t, ha, hb) {
    const WALL = '#cfd8e3', SLATE = '#4a5568', BRASS = '#c9a24a', on = lit(), z = K.z, date = new Date();
    const house = () => {
      const B = shopHouse(K, { wall: WALL, roof: SLATE, roofType: 'hip', h: 20, roofH: 9, trim: BRASS });
      const F = B.faces.front;
      if (F) { onFace(F, 0.33, F.H * 0.1, () => windowClocks(z, date)); canopy(K, B, SLATE); }
      else for (const S of sideFaces(B)) for (const tc of [0.3, 0.7]) onFace(S, tc, S.H * 0.14, () => windowClocks(z, date, true));
    };
    const tower = () => {                                                                   // Uhrtürmchen: Uhr auf jeder Seite
      const T = K.block({ a: -0.08, b: 0, ha: 0.22, hb: 0.22, h: 18, lift: 24, wall: '#e6ecf3', roof: SLATE, roofH: 13, type: 'hip' });
      for (const F of allFaces(T)) {
        faceQuad(F.P, F.Q, 0, 1, 0, 1.4 * z, C(BRASS));
        onFace(F, 0.5, F.H * 0.52, () => clockFace(5.3, z, date, on));
        if (on) { const [cx, cy] = faceAt(F, 0.5, F.H * 0.52); kGlow(cx, cy, z, 16); }
      }
      const [tx, ty] = K.P(-0.08, 0, 24 + 18 + 13);
      kLine(K, [tx, ty], [tx, ty - 3.5 * z], BRASS, 0.8);
      circle(tx, ty - 4.2 * z, 1.4 * z, C('#e9c46a'));
    };
    // Ausleger mit Taschenuhr: an der äußeren Ecke der Tür-Seite (sonst einer sichtbaren Seite), rechtwinklig von der Wand weg
    const walls = [[[1, 0], [[0.26, -0.3], [0.26, 0.3]]], [[0, 1], [[0.19, 0.37], [-0.35, 0.37]]], [[0, -1], [[0.19, -0.37], [-0.35, -0.37]]], [[-1, 0], [[-0.42, -0.3], [-0.42, 0.3]]]];
    const [n, ends] = walls.find(([nn]) => K.facing(...nn) > 0.01) || walls[0];
    const [ea, eb] = K.depth(...ends[0]) < K.depth(...ends[1]) ? ends[0] : ends[1];
    const [ta, tb] = [ea + n[0] * 0.24, eb + n[1] * 0.24];
    const bracket = () => {
      const w0 = K.P(ea, eb, 18), w1 = K.P(ta, tb, 18);
      kLine(K, [w0[0], w0[1] + 2.5 * z], w1, '#2f3542', 0.7);                              // Strebe
      kLine(K, w0, w1, '#2f3542', 1.1);
      circle(w1[0], w1[1], 0.9 * z, C('#2f3542'));
      kLine(K, w1, [w1[0], w1[1] + 2.2 * z], '#d4af37', 0.5);                                // Kette
      pocketWatch(w1[0], w1[1] + 9.5 * z, z, date, on);
      if (on) kGlow(w1[0], w1[1] + 9.5 * z, z, 12);
    };
    K.scene([[-0.08, 0, house], [-0.08, 0, tower], [ta, tb, bracket]]);
  };

  // ------------------------------------------------------------------ Juwelier
  // Brillant von der Seite, Rundiste bei (x, y): Krone mit fünf Facetten, Unterteil mit drei; eine Facette blitzt
  function gem(x, y, s, z, now, on) {
    const u = s * z, P = (px, py) => [x + px * u, y + py * u];
    const G = [-10.5, -4, 4, 10.5], T = [-5.2, 0, 5.2], top = -5.6, bot = 10.5, shine = Math.floor(now / 450) % 5;
    const crown = [[P(G[0], 0), P(T[0], top), P(G[1], 0)], [P(G[1], 0), P(T[0], top), P(T[1], top)], [P(G[1], 0), P(T[1], top), P(G[2], 0)],
      [P(G[2], 0), P(T[1], top), P(T[2], top)], [P(G[2], 0), P(T[2], top), P(G[3], 0)]];
    const pav = [[P(G[0], 0), P(G[1], 0), P(0, bot)], [P(G[1], 0), P(G[2], 0), P(0, bot)], [P(G[2], 0), P(G[3], 0), P(0, bot)]];
    const cc = on ? ['#e6f7ff', '#ffffff', '#c6ecff', '#f2fbff', '#a8e0ff'] : ['#d4efff', '#f4fbff', '#a9dcf8', '#e6f6ff', '#86c6ec'];
    const pc = on ? ['#bfe8ff', '#e3f6ff', '#8fd0f5'] : ['#9fd5f4', '#cdeeff', '#5fa9d9'];
    if (on) glowQuad([P(G[0], top), P(G[3], top), P(G[3], bot), P(G[0], bot)], 34 * z, 'blue');
    g.lineJoin = 'round'; g.strokeStyle = C('#3d6f9e'); g.lineWidth = 1.8 * z;              // Umriss (halb verdeckt)
    g.beginPath(); [P(T[0], top), P(T[2], top), P(G[3], 0), P(0, bot), P(G[0], 0)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p));
    g.closePath(); g.stroke();
    crown.forEach((f, i) => poly(f, i === shine ? '#ffffff' : on ? cc[i] : C(cc[i])));
    pav.forEach((f, i) => poly(f, on ? pc[i] : C(pc[i])));
    g.strokeStyle = on ? '#ffffff' : C('#ffffff'); g.lineWidth = 0.5 * z;
    g.beginPath(); g.moveTo(...P(G[0], 0)); g.lineTo(...P(G[3], 0)); g.stroke();
  }
  // Vitrine: Samtkissen mit drei Ringen, Mitte unten bei (0, 0)
  function ringDisplay(z, now) {
    g.fillStyle = C('#2a1640'); g.beginPath(); g.roundRect(-8 * z, -2.4 * z, 16 * z, 2.4 * z, 0.8 * z); g.fill();
    [['#ffffff', -5], ['#ff8fb1', 0], ['#7fd0ff', 5]].forEach(([stone, cx], i) => {
      poly([[(cx - 1.3) * z, -2.4 * z], [(cx + 1.3) * z, -2.4 * z], [cx * z, -4.2 * z]], C('#5a3a78'));
      g.strokeStyle = C('#d4af37'); g.lineWidth = 0.6 * z;
      g.beginPath(); g.ellipse(cx * z, -5 * z, 1.4 * z, 1.5 * z, 0, 0, Math.PI * 2); g.stroke();
      circle(cx * z, -6.8 * z, 0.75 * z, C(stone));
      if ((Math.floor(now / 500) + i) % 3 === 0) star(cx * z + 1 * z, -7.6 * z, 1.3 * z, C('#ffffff'));
    });
  }
  SHOP_ART.juwelier = function (K, s, now, x, y, t, ha, hb) {
    const WALL = '#4b2b63', GOLD = '#d4af37', on = lit(), z = K.z;
    const house = () => {
      const B = shopHouse(K, { wall: WALL, roof: GOLD, roofType: 'hip', h: 22, roofH: 7, trim: GOLD });
      band(B, 0.9, 1, GOLD);
      for (const F of allFaces(B)) { faceQuad(F.P, F.Q, 0, 0.045, 0, F.H, C(GOLD)); faceQuad(F.P, F.Q, 0.955, 1, 0, F.H, C(GOLD)); }
      const F = B.faces.front;
      if (F) {
        onFace(F, 0.33, F.H * 0.09, () => ringDisplay(z, now));
        faceQuad(F.P, F.Q, 0.625, 0.875, 0, F.H * 0.44, C(GOLD));                          // Tür mit Goldrahmen
        faceQuad(F.P, F.Q, 0.65, 0.85, 0, F.H * 0.41, C('#311a44'));
        const [kx, ky] = faceAt(F, 0.69, F.H * 0.2); circle(kx, ky, 0.7 * z, C(GOLD));
        canopy(K, B, '#7a4a9c');
      }
      for (const S of sideFaces(B)) {                                                      // Vitrinen auch seitlich
        faceQuad(S.P, S.Q, 0.12, 0.88, S.H * 0.06, S.H * 0.46, C(GOLD));
        windowOn(S.P, S.Q, 0.16, 0.84, S.H * 0.09, S.H * 0.43, z);
        onFace(S, 0.5, S.H * 0.1, () => ringDisplay(z, now));
      }
    };
    const jewel = () => {                                                                   // Ring mit Brillant auf dem Dach
      const [px, py] = K.P(-0.08, 0, 29), cy = py - 8.6 * z;
      g.strokeStyle = C('#a8862a'); g.lineWidth = 3 * z;
      g.beginPath(); g.ellipse(px, cy, 7.2 * z, 7.8 * z, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = C(GOLD); g.lineWidth = 2.2 * z;
      g.beginPath(); g.ellipse(px, cy, 7.2 * z, 7.8 * z, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = C('#f6e08a'); g.lineWidth = 0.8 * z;
      g.beginPath(); g.ellipse(px, cy, 7.2 * z, 7.8 * z, 0, Math.PI * 0.7, Math.PI * 1.25); g.stroke();
      poly([[px - 4 * z, cy - 6.4 * z], [px + 4 * z, cy - 6.4 * z], [px + 2.6 * z, cy - 9.6 * z], [px - 2.6 * z, cy - 9.6 * z]], C(GOLD));   // Fassung
      const gy = cy - 19.6 * z;
      gem(px, gy, 1.05, z, now, on);
      [[-14, -4], [13, -9], [10, 7], [-10, 9], [1, -12], [-4, -16]].forEach(([dx, dy], i) => {   // Funkeln
        const ph = (now / 900 + i * 0.37) % 1, k = Math.sin(ph * Math.PI);
        if (k < 0.2) return;
        star(px + dx * z, gy + dy * z, (on ? 3.6 : 2.8) * k * z, on ? '#fffbe0' : C('#ffffff'));
        if (on && k > 0.8) kGlow(px + dx * z, gy + dy * z, z, 10);
      });
    };
    const pot = b => () => {                                                                // Buchskugeln neben der Tür
      K.block({ a: 0.33, b, ha: 0.035, hb: 0.035, h: 3, wall: '#6d3f8c', type: 'flat', roof: '#3c2a1a' });
      const [bx, by] = K.P(0.33, b, 3);
      circle(bx, by - 2.1 * z, 2.3 * z, C('#4f9e4a'));
      circle(bx - 0.8 * z, by - 2.9 * z, 1 * z, C('#6fbf5a'));
    };
    K.scene([[-0.08, 0, house], [-0.08, 0, jewel], [0.33, 0.05, pot(0.05)], [0.33, 0.33, pot(0.33)]]);
  };

  // ------------------------------------------------------------------ Möbelhaus
  // Schaufenster-Einrichtung, Mitte unten bei (0, 0): Sofa mit Stehlampe bzw. Regal mit Sessel
  function sofaScene(z, on) {
    const O = C('#f08a24'), Od = C('#c96a12');
    g.fillStyle = Od; g.fillRect(-6.8 * z, -1 * z, 0.8 * z, 1 * z); g.fillRect(3.4 * z, -1 * z, 0.8 * z, 1 * z);
    g.fillStyle = O; g.fillRect(-7.2 * z, -6.6 * z, 11.6 * z, 3.4 * z);
    g.fillStyle = Od; g.fillRect(-7.2 * z, -3.4 * z, 11.6 * z, 2.4 * z);
    g.fillStyle = O; g.fillRect(-8.2 * z, -4.8 * z, 1.7 * z, 3.8 * z); g.fillRect(3.9 * z, -4.8 * z, 1.7 * z, 3.8 * z);
    g.strokeStyle = C('#2f3542'); g.lineWidth = 0.6 * z;
    g.beginPath(); g.moveTo(7 * z, 0); g.lineTo(7 * z, -8.6 * z); g.stroke();
    poly([[5.3 * z, -8.3 * z], [8.7 * z, -8.3 * z], [7.8 * z, -10.8 * z], [6.2 * z, -10.8 * z]], on ? '#fff3b0' : C('#ffe3a1'));
  }
  function shelfScene(z) {
    g.fillStyle = C('#8a5a3c'); g.fillRect(-7.6 * z, -11 * z, 7.2 * z, 11 * z);
    const books = ['#e8604f', '#5f8fe8', '#58b36a', '#e9c46a', '#c3a8e6'];
    for (let r = 0; r < 3; r++) {
      g.fillStyle = C('#f5e9d3'); g.fillRect(-7 * z, (-10.4 + r * 3.5) * z, 6 * z, 2.9 * z);
      for (let i = 0; i < 4; i++) { g.fillStyle = C(books[(i + r) % 5]); g.fillRect((-6.7 + i * 1.3) * z, (-10.4 + r * 3.5 + 0.6 + (i % 2) * 0.4) * z, 1 * z, (2.3 - (i % 2) * 0.4) * z); }
    }
    const T = C('#4fb3a9');                                                                 // Sessel
    g.fillStyle = C('#2f3542'); g.fillRect(2 * z, -1 * z, 0.7 * z, 1 * z); g.fillRect(6.3 * z, -1 * z, 0.7 * z, 1 * z);
    g.fillStyle = T; g.fillRect(2 * z, -6.6 * z, 5 * z, 3.6 * z);
    g.fillStyle = C('#3a938a'); g.fillRect(1.6 * z, -3.4 * z, 5.8 * z, 2.4 * z);
  }
  SHOP_ART.moebelhaus = function (K, s, now, x, y, t, ha, hb) {
    const CREAM = '#f0e2c4', BLUE = '#3a6ea5', ORANGE = '#f08a24', MINT = '#6cc3b5', on = lit(), z = K.z, RT = 28;
    if (groundPart(() => {
      K.rect(-0.96, 0.54, 0.96, 0.97, C('#c9c3b6'));                                       // Ladehof
      K.rect(-0.96, 0.54, 0.96, 0.57, C('#e9c46a'));
      for (let i = 0; i < 4; i++) K.poly([[-0.72 + i * 0.12, 0.6], [-0.66 + i * 0.12, 0.6], [-0.72 + i * 0.12, 0.72], [-0.78 + i * 0.12, 0.72]], C('#e9c46a'));
      K.rect(0.72, -0.96, 0.97, 0.52, C('#e6dccb'));                                        // Gehweg vor den Schaufenstern
    })) return;
    const house = () => {
      const B = K.block({ a: -0.1, b: -0.2, ha: 0.8, hb: 0.7, h: RT, wall: CREAM, roof: BLUE, type: 'flat', entry: true });
      band(B, 0.8, 1, BLUE);
      band(B, 0.77, 0.8, ORANGE);
      const F = B.faces.front, L = B.faces.left, R = B.faces.right;
      const showroom = (W, spots) => spots.forEach(([t0, t1, shelf]) => {
        faceQuad(W.P, W.Q, t0 - 0.015, t1 + 0.015, W.H * 0.04, W.H * 0.54, C(BLUE));
        windowOn(W.P, W.Q, t0, t1, W.H * 0.07, W.H * 0.51, z);
        onFace(W, (t0 + t1) / 2, W.H * 0.08, () => (shelf ? shelfScene(z) : sofaScene(z, on)));
      });
      if (F) {
        showroom(F, [[0.05, 0.42, false], [0.58, 0.95, true]]);
        K.door(B, 'front', 0.45, 0.55, 0.47, BLUE);
        windowOn(F.P, F.Q, 0.465, 0.535, F.H * 0.1, F.H * 0.42, z);
      }
      if (L) showroom(L, [[0.1, 0.45, true], [0.55, 0.9, false]]);
      if (R) {                                                                              // Ladeluke mit Rolltor
        faceQuad(R.P, R.Q, 0.53, 0.89, 0, R.H * 0.6, C(BLUE));
        faceQuad(R.P, R.Q, 0.55, 0.87, 0, R.H * 0.56, C('#aab3bf'));
        for (let i = 1; i < 6; i++) faceQuad(R.P, R.Q, 0.55, 0.87, R.H * i * 0.093, R.H * (i * 0.093 + 0.014), C('#8a94a3'));
        faceQuad(R.P, R.Q, 0.5, 0.92, R.H * 0.6, R.H * 0.66, C(ORANGE));
      }
      K.wins(B, 'back', 4, 0.15, 0.48);
      for (const side of ['front', 'right', 'left', 'back']) K.wins(B, side, 5, 0.59, 0.73);
      for (const W of allFaces(B)) {                                                        // Schriftzug auf jeder Seite
        onFace(W, 0.5, W.H * 0.9, () => kText(0, 0.3 * z, 'MÖBEL', 5, on ? '#fff6d8' : '#ffffff', z));
        if (on) { const [mx, my] = faceAt(W, 0.5, W.H * 0.9); kGlow(mx, my, z, 18); }
      }
    };
    const sofa = () => {                                                                    // Riesen-Sofa und Stehlampe auf dem Dach
      const lift = RT + 3, pieces = [];
      for (const [a, b] of [[-0.53, -0.77], [-0.53, 0.27], [0.01, -0.77], [0.01, 0.27]]) K.block({ a, b, ha: 0.03, hb: 0.03, h: 3, lift: RT, wall: '#6b4a2e', type: 'flat' });
      const cols = [[-0.8, -0.66], [-0.66, 0.16], [0.16, 0.3]], rows = [[-0.56, -0.42], [-0.42, 0.04]];
      rows.forEach(([a0, a1], ri) => cols.forEach(([b0, b1], ci) => {
        const a = (a0 + a1) / 2, b = (b0 + b1) / 2, hgt = ri === 0 ? 22 : ci !== 1 ? 13 : 8;
        pieces.push([a, b, () => {
          const S = K.block({ a, b, ha: (a1 - a0) / 2, hb: (b1 - b0) / 2, h: hgt, lift, wall: ORANGE, type: 'flat', roof: shade(ORANGE, 0.14) });
          const Fs = S.faces.front;
          if (ri === 0 && ci === 1 && Fs) for (const [t0, t1] of [[0.04, 0.48], [0.52, 0.96]]) faceQuad(Fs.P, Fs.Q, t0, t1, Fs.H * 0.42, Fs.H * 0.94, C(shade(ORANGE, 0.12)));
          const Bk = S.faces.back;
          if (ri === 0 && Bk) faceQuad(Bk.P, Bk.Q, 0, 1, Bk.H * 0.5, Bk.H * 0.55, C(shade(ORANGE, -0.18)));   // Naht hinten
          if (ri === 1 && ci === 1) {
            kLine(K, K.P(a0, -0.25, lift + hgt), K.P(a1, -0.25, lift + hgt), shade(ORANGE, -0.22), 0.6);
            if (Fs) kLine(K, faceAt(Fs, 0.5, 0), faceAt(Fs, 0.5, Fs.H), shade(ORANGE, -0.22), 0.6);
            const [cx, cy] = K.P(-0.34, 0.04, lift + hgt), c = [cx, cy - 3.6 * z];   // Kissen
            poly([[c[0] - 3.4 * z, c[1] - 0.4 * z], [c[0] + 0.4 * z, c[1] - 3.6 * z], [c[0] + 3.4 * z, c[1] + 0.3 * z], [c[0] - 0.4 * z, c[1] + 3.4 * z]], C('#4fb3a9'));
            circle(c[0], c[1], 0.6 * z, C('#fffaf0'));
          }
        }]);
      }));
      pieces.push([-0.3, 0.45, () => {
        const [lx, ly] = K.P(-0.3, 0.45, RT), top = ly - 30 * z;
        ellipse(lx, ly, 3.4 * z, 1.5 * z, C('#2f3542'));
        kLine(K, [lx, ly], [lx, top], '#2f3542', 1.3);
        poly([[lx - 5.4 * z, top + 1.5 * z], [lx + 5.4 * z, top + 1.5 * z], [lx + 3.2 * z, top - 6.5 * z], [lx - 3.2 * z, top - 6.5 * z]], on ? '#fff3b0' : C('#ffe3a1'));
        ellipse(lx, top + 1.5 * z, 5.4 * z, 1.3 * z, on ? '#fff8d0' : C('#f4c86a'));
        if (on) kGlow(lx, top, z, 34);
      }]);
      K.scene(pieces);
    };
    const van = () => {                                                                     // Lieferwagen im Möbelhaus-Blau
      const side = K.facing(0, 1) > 0 ? 0.95 : 0.61;
      K.scene([
        [0.26, 0.78, () => {
          const V = K.block({ a: 0.26, b: 0.78, ha: 0.26, hb: 0.16, h: 13, lift: 2.5, wall: BLUE, type: 'flat', roof: '#f5f0e6' });
          for (const W of allFaces(V)) if (W.n[0] === 0) {
            faceQuad(W.P, W.Q, 0.06, 0.94, W.H * 0.36, W.H * 0.5, C('#fffaf0'));
            faceQuad(W.P, W.Q, 0.3, 0.7, W.H * 0.6, W.H * 0.82, C(ORANGE));
          }
        }],
        [0.64, 0.78, () => {
          const Cb = K.block({ a: 0.64, b: 0.78, ha: 0.12, hb: 0.16, h: 9, lift: 2.5, wall: BLUE, type: 'flat', roof: shade(BLUE, 0.2) });
          const Wf = Cb.faces.front;
          if (Wf) { windowOn(Wf.P, Wf.Q, 0.12, 0.88, Wf.H * 0.45, Wf.H * 0.9, z); circle(...faceAt(Wf, 0.18, Wf.H * 0.2), 0.8 * z, C('#fff6c0')); circle(...faceAt(Wf, 0.82, Wf.H * 0.2), 0.8 * z, C('#fff6c0')); }
          for (const W of allFaces(Cb)) if (W.n[0] === 0) windowOn(W.P, W.Q, 0.2, 0.75, W.H * 0.45, W.H * 0.88, z);
        }],
      ]);
      for (const a of [0.08, 0.62]) {
        const [wx, wy] = K.P(a, side, 2.4);
        ellipse(wx, wy, 2.5 * z, 2.7 * z, C('#2f3542'));
        circle(wx, wy, 1 * z, C('#c9ccd3'));
      }
    };
    const crates = (a, b, n) => () => {                                                     // Kisten aus dem Lieferwagen
      K.scene([[a, b - 0.07, () => kCrate(K, a, b - 0.07, '#c9955f', 1.35)], [a, b + 0.07, () => kCrate(K, a, b + 0.07, '#d9b27a', 1.35)]]);
      if (n > 2) kCrate(K, a, b, '#e3c08a', 1.2, 6.1);
    };
    const chair = () => K.scene([                                                           // Sessel und Pflanzen vor dem Laden
      [0.82, -0.64, () => K.block({ a: 0.82, b: -0.64, ha: 0.03, hb: 0.11, h: 10, wall: MINT, type: 'flat', roof: shade(MINT, 0.15) })],
      [0.9, -0.64, () => K.block({ a: 0.9, b: -0.64, ha: 0.05, hb: 0.11, h: 5, wall: MINT, type: 'flat', roof: shade(MINT, 0.15) })],
    ]);
    const plant = b => () => {
      K.block({ a: 0.8, b, ha: 0.045, hb: 0.045, h: 4, wall: '#c9735a', type: 'flat', roof: '#6b4a2e' });
      const [px, py] = K.P(0.8, b, 4);
      for (const [dx, dy, r, c] of [[-1.8, -3, 2.4, '#4f9e4a'], [1.8, -3.4, 2.4, '#3f8a3f'], [0, -5.6, 2.6, '#6fbf5a']]) circle(px + dx * z, py + dy * z, r * z, C(c));
    };
    K.scene([[-0.1, -0.2, house], [-0.1, -0.2, sofa], [0.4, 0.78, van], [-0.1, 0.66, crates(-0.1, 0.69, 3)], [-0.8, 0.66, crates(-0.8, 0.69, 2)],
      [0.86, -0.64, chair], [0.8, -0.36, plant(-0.36)], [0.8, -0.04, plant(-0.04)]]);
  };
  GROUND_TYPES.add('moebelhaus');                                                           // hat einen gepflasterten Ladehof
})();
