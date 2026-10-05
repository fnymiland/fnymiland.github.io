'use strict';
// Ladenbilder, Gruppe e (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, hangSign, faceAt)
// Boutique, Uhrmacher, Juwelier, Möbelhaus. Block 35: an die alten Gebäude angeglichen – helle Wände, klare Dächer,
// Schatten (ART_SHADOW), keine Schrift, wenig Kleinkram. Jeder Laden hat seine eigene Bauform:
// Boutique = weißer Kubus mit Glasfront über zwei Etagen, Uhrmacher = Häuschen mit Uhrtürmchen,
// Juwelier = kleines Palais mit Säulenportal, Möbelhaus = Halle mit Sägezahndach und kleinem Hof.
(function () {
  const lit = () => night > 0.15 && isLive();
  const allFaces = B => Object.values(B.faces).filter(Boolean);
  const sideFaces = B => ['right', 'left', 'back'].map(n => B.faces[n]).filter(Boolean);
  // Auf eine Wand malen: Ursprung bei t (0 … 1 von P nach Q) in Höhe up (px, schon mit z); x läuft auf dem Bildschirm
  // nach rechts die Wand entlang (schräg wie die Wand), y nach unten. Nie gespiegelt – Uhren bleiben richtig.
  function onFace(F, t, up, fn) {
    const [ox, oy] = faceAt(F, t, up), dx = F.Q[0] - F.P[0], k = Math.abs(dx) > 1e-6 ? (F.Q[1] - F.P[1]) / dx : 0;
    g.save(); g.translate(ox, oy); g.transform(1, k, 0, 1, 0, 0);
    try { fn(); } finally { g.restore(); }
  }
  // Glasfläche mit Rahmen in der Markenfarbe (t0 … t1 entlang der Wand, h0 … h1 als Anteil der Wandhöhe)
  function framedGlass(F, t0, t1, h0, h1, frame, z) {
    const ft = 1.3 * z / Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]);            // Rahmenbreite ≈ 1,3 px × z
    faceQuad(F.P, F.Q, t0 - ft, t1 + ft, F.H * h0 - 1.3 * z, F.H * h1 + 1.3 * z, C(frame));
    windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, z);
  }
  // Vordach über einer Stelle der Tür-Seite (kleiner flacher Block in der Markenfarbe)
  function doorCanopy(K, B, t, half, up, col) {
    const b = B.b - B.hb + 2 * B.hb * t;
    K.block({ a: B.a + B.ha + 0.045, b, ha: 0.045, hb: half, h: 1.8, lift: up, wall: col, type: 'flat', roof: shade(col, 0.25) });
  }

  // ------------------------------------------------------------------ Boutique
  // Kleid an der Schaufensterpuppe – große, ruhige Form, Füße bei (0, 0), u = px je Einheit (mit z)
  function dressForm(u, col) {
    g.fillStyle = C('#b9bcc6'); g.fillRect(-0.45 * u, -3 * u, 0.9 * u, 3 * u);                 // Ständer
    ellipse(0, 0, 1.8 * u, 0.6 * u, C('#b9bcc6'));
    poly([[-1.3 * u, -7.4 * u], [1.3 * u, -7.4 * u], [3.3 * u, -2.6 * u], [-3.3 * u, -2.6 * u]], C(col));   // Rock
    poly([[-1.5 * u, -10.6 * u], [1.5 * u, -10.6 * u], [1.2 * u, -7.3 * u], [-1.2 * u, -7.3 * u]], C(shade(col, 0.18)));
    circle(0, -12 * u, 1.4 * u, C('#f3e6d8'));                                                // Kopf
  }
  // Mini-Symbol fürs Schild: Kleid am Bügel, mittig bei (x, y), passt in einen Kreis mit Radius 4 × z
  function miniDress(x, y, z, on) {
    const D = on ? '#ff8fbd' : C('#d94f8a'), Dl = on ? '#ffc2d9' : C('#f28cb1');
    const P = (px, py) => [x + px * z, y + py * z];
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.6 * z;                                   // Bügel mit Haken
    g.beginPath(); g.moveTo(...P(0, -2.4)); g.lineTo(...P(0, -3)); g.arc(x + 0.5 * z, y - 3 * z, 0.5 * z, Math.PI, Math.PI * 2.2); g.stroke();
    g.beginPath(); g.moveTo(...P(-3, -1)); g.lineTo(...P(0, -2.4)); g.lineTo(...P(3, -1)); g.closePath(); g.stroke();
    poly([P(-1.1, 0.6), P(1.1, 0.6), P(2.7, 3.4), P(-2.7, 3.4)], D);                       // Rock
    poly([P(-1.1, 0.6), P(-0.45, 0.6), P(-1.3, 3.4), P(-2.7, 3.4)], Dl);
    poly([P(-1.3, -0.9), P(-0.5, -1.1), P(0, -0.7), P(0.5, -1.1), P(1.3, -0.9), P(1.1, 0.7), P(-1.1, 0.7)], D);   // Oberteil
  }
  SHOP_ART.boutique = function (K, s, now) {
    const WALL = '#f5f5f5', PINK = '#f28cb1', on = lit(), z = K.z, H = 25;
    const house = () => {
      const B = K.block({ a: -0.06, b: 0, ha: 0.29, hb: 0.31, h: H, wall: WALL, roof: '#ece4e8', type: 'flat', entry: true });
      for (const f of Object.values(FACES)) if (K.facing(...f.n) <= 0.01) {                  // Brüstung: Innenseite hinten
        const p = K.P(-0.06 + f.p[0] * 0.29, f.p[1] * 0.31, H), q = K.P(-0.06 + f.q[0] * 0.29, f.q[1] * 0.31, H);
        poly([p, q, [q[0], q[1] - 2.6 * z], [p[0], p[1] - 2.6 * z]], C(shade(PINK, -0.08)));
      }
      K.block({ a: -0.06, b: 0, ha: 0.29, hb: 0.31, h: 2.6, lift: H, wall: PINK, type: 'none' });   // rosa Brüstung (Flachdach)
      const F = B.faces.front;
      if (F) {
        framedGlass(F, 0.1, 0.56, 0.06, 0.84, PINK, z);                                    // Glas über beide Etagen
        onFace(F, 0.33, F.H * 0.07, () => dressForm(0.95 * z, PINK));
        faceQuad(F.P, F.Q, 0.66, 0.88, 0, F.H * 0.44, C(PINK));                            // rosa Tür
        windowOn(F.P, F.Q, 0.66, 0.88, F.H * 0.6, F.H * 0.84, z);
      }
      for (const S of sideFaces(B)) {                                                      // hohes Fenster auch um die Ecke
        framedGlass(S, 0.3, 0.7, 0.06, 0.84, PINK, z);
        onFace(S, 0.5, S.H * 0.07, () => dressForm(0.95 * z, '#ffc2d9'));
      }
    };
    const sign = hangSign(K, (cx, cy, zz) => {                                              // Kleid am Bügel
      if (on) kGlow(cx, cy, zz, 14);
      miniDress(cx, cy, zz, on);
    }, PINK, { up: 14 });
    K.scene([[-0.06, 0, house], sign]);
  };
  ART_SHADOW.boutique = [27, 0.2];

  // ------------------------------------------------------------------ Uhrmacher
  // Turmuhr um (0, 0) mit Radius r (px × z): Messingring, Zifferblatt, zwei Zeiger mit der echten Uhrzeit
  function towerClock(r, z, date, on) {
    circle(0, 0, (r + 1) * z, C('#c9a24a'));
    circle(0, 0, r * z, on ? '#fff6c8' : C('#fffdf6'));
    const m = date.getMinutes() + date.getSeconds() / 60, h = (date.getHours() % 12) + m / 60;
    const hand = (f, len, w) => {
      const a = f * Math.PI * 2;
      g.strokeStyle = C('#4a5568'); g.lineWidth = w * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a) * len * r * z, -Math.cos(a) * len * r * z); g.stroke();
    };
    hand(h / 12, 0.5, 1);
    hand(m / 60, 0.8, 0.85);
  }
  // Mini-Symbol fürs Schild: Taschenuhr, mittig bei (x, y)
  function miniWatch(x, y, z, date, on) {
    circle(x, y - 2.9 * z, 0.9 * z, C('#c9a24a'));                                          // Krone
    circle(x, y + 0.5 * z, 3.2 * z, C('#c9a24a'));
    circle(x, y + 0.5 * z, 2.5 * z, on ? '#fff6c8' : C('#fffdf6'));
    const m = date.getMinutes(), h = (date.getHours() % 12) + m / 60;
    g.strokeStyle = C('#4a5568'); g.lineCap = 'round'; g.lineWidth = 0.6 * z;
    for (const [f, len] of [[h / 12, 1.3], [m / 60, 2]]) {
      const a = f * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y + 0.5 * z); g.lineTo(x + Math.sin(a) * len * z, y + 0.5 * z - Math.cos(a) * len * z); g.stroke();
    }
  }
  SHOP_ART.uhrmacher = function (K, s, now) {
    const WALL = '#e4f1ff', SLATE = '#6b7a8f', on = lit(), z = K.z, date = new Date(), H = 17;
    const TL = 23.5, TH = 10, TR = 8;                                                       // Türmchen: Fuß im Dach, Höhe, Dach
    const house = () => {
      const B = shopHouse(K, { wall: WALL, roof: SLATE, roofType: 'hip', h: H, roofH: 11 });
      const F = B.faces.front;
      if (F) faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(SLATE));                     // Tür in Schiefergrau
      const T = K.block({ a: -0.06, b: 0, ha: 0.14, hb: 0.14, h: TH, lift: TL, wall: WALL, roof: SLATE, roofH: TR, over: 1.25 });
      for (const W of allFaces(T)) {
        onFace(W, 0.5, W.H * 0.5, () => towerClock(3.1, z, date, on));
        if (on) { const [cx, cy] = faceAt(W, 0.5, W.H * 0.5); kGlow(cx, cy, z, 14); }
      }
      const [tx, ty] = K.P(-0.06, 0, TL + TH + TR);                                         // Turmspitze
      kLine(K, [tx, ty], [tx, ty - 1.8 * z], '#c9a24a', 0.9);
      circle(tx, ty - 2.2 * z, 1 * z, C('#e9c46a'));
    };
    const sign = hangSign(K, (cx, cy, zz) => {                                              // Taschenuhr
      if (on) kGlow(cx, cy, zz, 14);
      miniWatch(cx, cy, zz, date, on);
    }, SLATE);
    K.scene([[-0.06, 0, house], sign]);
  };
  ART_SHADOW.uhrmacher = [24, 0.2];

  // ------------------------------------------------------------------ Juwelier
  // Brillant von der Seite, Rundiste bei (x, y): Krone mit fünf Facetten, Unterteil mit drei (ohne Geflacker)
  function gem(x, y, s, z, on) {
    const u = s * z, P = (px, py) => [x + px * u, y + py * u];
    const G = [-10.5, -4, 4, 10.5], T = [-5.2, 0, 5.2], top = -5.6, bot = 10.5;
    const crown = [[P(G[0], 0), P(T[0], top), P(G[1], 0)], [P(G[1], 0), P(T[0], top), P(T[1], top)], [P(G[1], 0), P(T[1], top), P(G[2], 0)],
      [P(G[2], 0), P(T[1], top), P(T[2], top)], [P(G[2], 0), P(T[2], top), P(G[3], 0)]];
    const pav = [[P(G[0], 0), P(G[1], 0), P(0, bot)], [P(G[1], 0), P(G[2], 0), P(0, bot)], [P(G[2], 0), P(G[3], 0), P(0, bot)]];
    const cc = on ? ['#e6f7ff', '#ffffff', '#c6ecff', '#f2fbff', '#a8e0ff'] : ['#d4efff', '#ffffff', '#a9dcf8', '#e6f6ff', '#86c6ec'];
    const pc = on ? ['#bfe8ff', '#e3f6ff', '#8fd0f5'] : ['#9fd5f4', '#cdeeff', '#5fa9d9'];
    g.lineJoin = 'round'; g.strokeStyle = C('#7a55a8'); g.lineWidth = 2.4 * z;             // Umriss
    g.beginPath(); [P(T[0], top), P(T[2], top), P(G[3], 0), P(0, bot), P(G[0], 0)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p));
    g.closePath(); g.stroke();
    crown.forEach((f, i) => poly(f, on ? cc[i] : C(cc[i])));
    pav.forEach((f, i) => poly(f, on ? pc[i] : C(pc[i])));
  }
  SHOP_ART.juwelier = function (K, s, now) {
    const WALL = '#e6e0ff', LIGHT_WALL = '#fdeaff', ROOF = '#b07ad6', on = lit(), z = K.z, H = 17, A = -0.08;
    const house = () => {
      const B = K.block({ a: A, b: 0, ha: 0.27, hb: 0.31, h: H, wall: WALL, roof: ROOF, roofH: 12, over: 1.18, entry: true });
      for (const F of allFaces(B)) for (const [t0, t1] of [[0, 0.09], [0.91, 1]]) faceQuad(F.P, F.Q, t0, t1, 0, F.H, K.wallCol(LIGHT_WALL, F.n));   // Eckpfeiler
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.41, 0.59, 0, F.H * 0.58, C(shade(ROOF, -0.18)));              // Tür unter dem Portal
        for (const [t0, t1] of [[0.13, 0.3], [0.7, 0.87]]) windowOn(F.P, F.Q, t0, t1, F.H * 0.2, F.H * 0.74, z);   // hohe Fenster
      }
      K.sideWins(B, 2, 0.24, 0.74);
    };
    const AP = A + 0.27 + 0.055;                                                            // Portal vor der Tür
    const portal = () => {
      const cols = [-0.095, 0.095].map(b => [AP + 0.035, b, () => K.block({ a: AP + 0.035, b, ha: 0.026, hb: 0.026, h: 11, wall: '#ffffff', type: 'flat', roof: '#ffffff' })]);
      K.scene(cols);
      K.block({ a: AP, b: 0, ha: 0.065, hb: 0.13, h: 2.6, lift: 11, wall: LIGHT_WALL, roof: ROOF, roofH: 5.5, type: 'gable', ridge: 'a', over: 1.14 });
    };
    const sign = hangSign(K, (cx, cy, zz) => {                                              // Brillant
      if (on) kGlow(cx, cy, zz, 14);
      g.save(); g.translate(cx, cy - 0.8 * zz); g.scale(0.32, 0.32);
      gem(0, 0, 1, zz, on);
      g.restore();
    }, ROOF);
    K.scene([[A, 0, house], [AP, 0, portal], sign]);
  };
  ART_SHADOW.juwelier = [23, 0.21];

  // ------------------------------------------------------------------ Möbelhaus
  // Sägezahndach (Sheddach) auf einer Halle: n Zähne quer zur Breite (b), jeder steigt nach +b an und fällt dort
  // senkrecht mit einem Glasband ab. Von vorn sieht man das Zickzack, von der Seite die Fensterbänder.
  function sawRoof(K, { a, b, ha, hb, top, n, T, wall, roof }) {
    const z = K.z, step = 2 * hb / n, order = [...Array(n).keys()];
    if (K.facing(0, 1) <= 0) order.reverse();                                               // hintere Zähne zuerst
    for (const i of order) {
      const b0 = b - hb + i * step, b1 = b0 + step;
      poly([K.P(a - ha, b0, top), K.P(a + ha, b0, top), K.P(a + ha, b1, top + T), K.P(a - ha, b1, top + T)], K.roofCol(roof, [0, -1]));
      if (K.facing(0, 1) > 0.01) {                                                          // senkrechtes Glasband
        const P = K.P(a + ha, b1, top), Q = K.P(a - ha, b1, top);
        poly([P, Q, [Q[0], Q[1] - T * z], [P[0], P[1] - T * z]], K.wallCol(wall, [0, 1]));
        for (let j = 0; j < 3; j++) windowOn(P, Q, 0.06 + j * 0.31, 0.32 + j * 0.31, T * z * 0.2, T * z * 0.82, z);
      }
      for (const sa of [1, -1]) {                                                           // Giebel-Dreiecke in der Wandflucht
        if (K.facing(sa, 0) <= 0.01) continue;
        poly([K.P(a + sa * ha, b0, top), K.P(a + sa * ha, b1, top), K.P(a + sa * ha, b1, top + T)], K.wallCol(wall, [sa, 0]));
      }
      g.strokeStyle = K.roofCol(shade(roof, -0.12), [0, -1]); g.lineWidth = 1 * z; g.lineCap = 'round';   // Firstkante
      g.beginPath(); g.moveTo(...K.P(a - ha, b1, top + T)); g.lineTo(...K.P(a + ha, b1, top + T)); g.stroke();
    }
  }
  SHOP_ART.moebelhaus = function (K, s, now, x, y, t) {
    const WALL = '#fff4dc', BLUE = '#5f8fe8', SOFA = '#e9a23b', z = K.z, H = 13, A = -0.12, HA = 0.55, HB = 0.6;
    if (groundPart(() => {
      courtFloor(K, t, x, y, () => {                                                        // Block 91
        K.rect(A + HA, -0.94, 0.96, 0.94, C('#e6dcc8'));                                    // kleiner Hof vor der Halle
        K.rect(A + HA, -0.16, 0.96, 0.16, C('#f2ebdc'));                                    // Weg zur Tür
      });
      for (const b of [-0.94, 0.66]) K.rect(0.7, b, 0.96, b + 0.28, C('#8cc96a'));        // zwei Rasenecken
    })) return;
    const hall = () => {
      const B = K.block({ a: A, b: 0, ha: HA, hb: HB, h: H, wall: WALL, type: 'none', entry: true });
      const F = B.faces.front;
      if (F) {
        for (const [t0, t1] of [[0.07, 0.37], [0.63, 0.93]]) framedGlass(F, t0, t1, 0.14, 0.7, BLUE, z);   // große Schaufenster
        faceQuad(F.P, F.Q, 0.44, 0.56, 0, F.H * 0.56, C(BLUE));                           // Tür
        windowOn(F.P, F.Q, 0.465, 0.535, F.H * 0.1, F.H * 0.48, z);
      }
      K.sideWins(B, 3, 0.24, 0.7);
      sawRoof(K, { a: A, b: 0, ha: HA, hb: HB, top: H, n: 3, T: 8, wall: WALL, roof: BLUE });
      if (F) doorCanopy(K, B, 0.5, 0.12, 8.6, BLUE);
    };
    const sofa = () => {                                                                    // ein Sofa im Hof (Ausstellungsstück)
      const a = 0.78, b = -0.48;
      K.scene([
        [a - 0.075, b, () => K.block({ a: a - 0.075, b, ha: 0.03, hb: 0.17, h: 7, wall: SOFA, type: 'flat', roof: shade(SOFA, 0.2) })],
        [a, b, () => K.block({ a, b, ha: 0.06, hb: 0.14, h: 3.4, wall: SOFA, type: 'flat', roof: shade(SOFA, 0.25) })],
        ...[-1, 1].map(sb => [a - 0.01, b + sb * 0.155, () => K.block({ a: a - 0.01, b: b + sb * 0.155, ha: 0.07, hb: 0.03, h: 5, wall: shade(SOFA, -0.05), type: 'flat', roof: shade(SOFA, 0.15) })]),
      ]);
    };
    K.scene([[A, 0, hall], [0.76, -0.48, sofa]]);
  };
  ART_SHADOW.moebelhaus = [18, 0.36];
  GROUND_TYPES.add('moebelhaus');                                                           // hat einen gepflasterten Hof
})();
