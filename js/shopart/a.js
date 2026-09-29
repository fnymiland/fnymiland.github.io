'use strict';
// Ladenbilder, Gruppe a (Block 32): Kiosk, Blumenladen, Friseur, Post – trägt sich in SHOP_ART ein
// (siehe draw-shops.js: shopHouse, kText, faceAt, hangSign). Feste Markenfarben; das Symbol hängt klein als
// Ausleger-Schild an der Hausecke (hangSign), nicht mehr groß auf dem Dach (Block 34).
(() => {
  const lit = () => night > 0.15 && isLive();

  // Auf einer senkrechten Fläche malen (Grundlinie P–Q): fn(w) zeichnet im Rahmen der Fläche – x nach rechts in
  // Bildschirm-px (0 … w), y wie auf dem Bildschirm (nach oben negativ). Von vorn und hinten gleich herum (nie gespiegelt).
  function onPlane(P, Q, fn) {
    const [L, R] = P[0] <= Q[0] ? [P, Q] : [Q, P], w = R[0] - L[0];
    if (w < 0.5) return;
    g.save();
    g.transform(1, (R[1] - L[1]) / w, 0, 1, L[0], L[1]);
    try { fn(w); } finally { g.restore(); }
  }
  const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // Doppelseitiges Schild (dünne Tafel quer zur Tür-Seite): die sichtbare große Seite wird bemalt
  function board(K, a, b, lift, hb, h, frame, draw) {
    const T = K.block({ a, b, ha: 0.025, hb, h, lift, wall: frame, roof: frame, type: 'flat' });
    const F = T.faces.front || T.faces.back;
    if (F) onPlane(F.P, F.Q, w => draw(w, F.H));
  }
  // Leuchten eines Wandstücks (t0 … t1, Höhen in px mit z)
  const faceGlow = (F, t0, t1, h0, h1, r) => {
    const p = lerp(F.P, F.Q, t0), q = lerp(F.P, F.Q, t1);
    glowQuad([[p[0], p[1] - h0], [q[0], q[1] - h0], [q[0], q[1] - h1], [p[0], p[1] - h1]], r);
  };
  // Markise, die schräg aus der Tür-Seite ragt: Streifen c1/c2 mit runder Kante
  function awning(K, B, c1, c2, h0 = 0.45, h1 = 0.6, out = 0.1) {
    const F = B.faces.front;
    if (!F) return;
    const z = K.z, a1 = B.a + B.ha, n = 8, top = B.lift + B.h * h1, bot = B.lift + B.h * h0;
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
    faceQuad(F.P, F.Q, t0 - 0.03, t1 + 0.03, h - 1.8 * z, h, C('#8a5a3c'));
    for (let i = 0; i < 4; i++) {
      const m = lerp(lerp(F.P, F.Q, t0), lerp(F.P, F.Q, t1), (i + 0.5) / 4);
      circle(m[0], m[1] - h - 0.6 * z, 1.3 * z, C(i & 1 ? '#4f9e3a' : '#63b84a'));
      circle(m[0], m[1] - h - 1.6 * z, 1.05 * z, C(BLOOM[(i + k) % BLOOM.length]));
    }
  }
  // Fensterreihe (wie K.wins) mit Blumenkästen
  function boxWins(K, B, side, n, h0, h1, k) {
    const F = B.faces[side];
    if (!F) return;
    const step = 0.8 / n;
    for (let i = 0; i < n; i++) {
      const t0 = 0.1 + step * (i + 0.12), t1 = 0.1 + step * (i + 0.88);
      windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, K.z);
      flowerBox(F, t0, t1, F.H * h0, K.z, i + k);
    }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Kiosk: niedrige blaue Bude, gelbes Flachdach mit breitem Vordach, Verkaufsluke, Zeitschriften-Ständer,
  // große Werbetafel mit Zeitschriften-Covern auf dem Dach
  // ---------------------------------------------------------------------------------------------------------------
  const COVERS = ['#ff5c8a', '#1abc9c', '#ff9f1c', '#9b59b6', '#e74c3c', '#3fa9f5'];
  SHOP_ART.kiosk = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, BLUE = '#2e86c1', YEL = '#f4d03f', L = lit();
    K.scene([[-0.06, 0, () => {
      const B = K.block({ a: -0.06, b: 0, ha: 0.3, hb: 0.34, h: 14, wall: BLUE, roof: YEL, type: 'flat', entry: true, trim: YEL });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.04, 0.62, F.H * 0.12, F.H * 0.7, C('#fdfefe'));                       // Luke: Rahmen
        faceQuad(F.P, F.Q, 0.07, 0.59, F.H * 0.2, F.H * 0.66, L ? '#ffe6a0' : C('#1d3a55'));
        faceGlow(F, 0.07, 0.59, F.H * 0.2, F.H * 0.66, 22 * z);
        for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {                                    // Hefte im Regal
          const t0 = 0.1 + i * 0.08;
          faceQuad(F.P, F.Q, t0, t0 + 0.06, F.H * (0.26 + r * 0.19), F.H * (0.4 + r * 0.19), C(COVERS[(i + r * 3) % 6]));
        }
        faceQuad(F.P, F.Q, 0.02, 0.64, F.H * 0.12, F.H * 0.2, C('#f5e6c8'));                       // Tresen
        faceQuad(F.P, F.Q, 0.7, 0.92, 0, F.H * 0.72, C(YEL));                                      // Tür
        windowOn(F.P, F.Q, 0.74, 0.88, F.H * 0.4, F.H * 0.62, z);
      }
      for (const side of ['right', 'left', 'back']) {                                               // Plakate rundum
        const S = B.faces[side];
        if (!S) continue;
        [[0.1, 0.44], [0.56, 0.9]].forEach(([t0, t1], i) => {
          const col = COVERS[(i * 2 + side.length) % 6];
          faceQuad(S.P, S.Q, t0, t1, S.H * 0.16, S.H * 0.76, K.wallCol(col, S.n));
          faceQuad(S.P, S.Q, t0 + 0.03, t1 - 0.03, S.H * 0.58, S.H * 0.7, K.wallCol('#fdfefe', S.n));
          const m = faceAt(S, (t0 + t1) / 2, S.H * 0.36);
          circle(m[0], m[1], 1.6 * z, K.wallCol('#ffe0c2', S.n));
        });
      }
    }], [-0.06, 0, () => {                                                                          // Werbetafel
      for (const sb of [-0.22, 0.22]) kLine(K, K.P(-0.12, sb, 14), K.P(-0.12, sb, 18.5), '#34495e', 1.1);
      board(K, -0.12, 0, 18, 0.35, 16, '#1b4f72', (w, H) => {
        rect(1.1 * z, -H + 1.1 * z, w - 2.2 * z, H - 2.2 * z, C('#fdfefe'));
        const m = 2 * z, gap = 1.1 * z, cw = (w - 2 * m - 2 * gap) / 3, ch = H - 2 * m;
        for (let i = 0; i < 3; i++) {
          const x0 = m + i * (cw + gap), y0 = -H + m;
          rect(x0, y0, cw, ch, C(COVERS[i * 2]));
          rect(x0 + 0.6 * z, y0 + 0.7 * z, cw - 1.2 * z, 2.2 * z, C('#ffffff'));                   // Titel
          circle(x0 + cw / 2, y0 + ch * 0.56, Math.max(0.5, Math.min(cw, ch) * 0.28), C(i === 1 ? '#ffe66d' : '#ffe0c2'));
          rect(x0 + 0.8 * z, y0 + ch - 2.2 * z, cw * 0.6, 0.9 * z, C('#ffffff'));
        }
        for (let i = 0; i < 4; i++) circle(w * (0.14 + i * 0.24), -H - 0.6 * z, 1 * z, L ? '#fff3a0' : C(YEL));   // Lämpchen
        glowQuad([[0, -H], [w, -H], [w, 0], [0, 0]], 30 * z);
      });
    }], [0.31, 0, () => {                                                                           // breites Vordach
      const V = K.block({ a: 0.31, b: 0, ha: 0.075, hb: 0.39, h: 1.6, lift: 12.6, wall: '#e0b62e', roof: YEL, type: 'flat' });
      const E = V.faces.front;
      if (E) for (let i = 0; i < 8; i++) faceQuad(E.P, E.Q, i / 8, (i + 1) / 8, -1.4 * z, 0, C(i & 1 ? '#fdfefe' : YEL));
    }], [0.46, -0.2, () => {                                                                        // Zeitschriften-Ständer
      const R = K.block({ a: 0.46, b: -0.2, ha: 0.045, hb: 0.12, h: 8, wall: '#566573', roof: '#7f8c8d', type: 'flat' });
      for (const S of Object.values(R.faces)) {
        if (!S) continue;
        const n = S.n[0] ? 3 : 1;
        for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
          const t0 = 0.08 + i * (0.84 / n);
          faceQuad(S.P, S.Q, t0, t0 + 0.84 / n - 0.07, S.H * (0.1 + r * 0.46), S.H * (0.48 + r * 0.46), K.wallCol(COVERS[(i + r * 2 + 1) % 6], S.n));
        }
      }
    }]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Blumenladen: zartrosa Haus, grünes Satteldach, grün-weiße Markise, Blumenkästen an allen Fenstern, Eimer mit
  // bunten Blumen vor der Tür; an der Ecke ein kleines Schild mit Sonnenblume
  // ---------------------------------------------------------------------------------------------------------------
  function sunflowerHead(hx, hy, z, sway) {                                                         // Blüte, Radius ≈ 9.4 × z
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 12; i++) {                          // Blütenblätter
      const ang = (i + layer * 0.5) * Math.PI / 6 + sway * 0.05, r = layer ? 5.4 : 5.9;
      g.beginPath(); g.ellipse(hx + Math.cos(ang) * r * z, hy + Math.sin(ang) * r * z, 3.5 * z, 1.7 * z, ang, 0, Math.PI * 2);
      g.fillStyle = C(layer ? '#ffd23f' : '#f39c12'); g.fill();
    }
    circle(hx, hy, 4.4 * z, C('#6b3f22'));
    circle(hx - 0.8 * z, hy - 0.8 * z, 2.8 * z, C('#8a5530'));
    for (let i = 0; i < 5; i++) circle(hx + Math.cos(i * 1.26) * 2.6 * z, hy + Math.sin(i * 1.26) * 2.6 * z, 0.55 * z, C('#4a2a15'));
  }
  // Mini-Sonnenblume fürs Schild: kurzer Stiel mit Blatt, Blüte darüber (passt in den Kreis mit Radius 4 × z)
  function miniSunflower(cx, cy, z, now) {
    g.strokeStyle = C('#3f8f3a'); g.lineWidth = 0.8 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx - 0.5 * z, cy + 2 * z, cx + 0.2 * z, cy + 3.9 * z); g.stroke();
    g.beginPath(); g.ellipse(cx + 1.3 * z, cy + 2.6 * z, 1.4 * z, 0.6 * z, -0.5, 0, Math.PI * 2); g.fillStyle = C('#4caf50'); g.fill();
    g.save(); g.translate(cx, cy - 0.9 * z); g.scale(0.33, 0.33);
    sunflowerHead(0, 0, z, Math.sin(now / 1500));
    g.restore();
  }
  function bucket(K, a, b, col, eye) {
    return () => {
      const [px, py] = K.P(a, b), z = K.z;
      circle(px - 1.3 * z, py - 5.4 * z, 1.5 * z, C('#4f9e3a')); circle(px + 1.3 * z, py - 5.6 * z, 1.5 * z, C('#63b84a'));
      for (const [dx, dy] of [[-1.7, -7], [0, -8], [1.7, -6.9], [-0.8, -9.6], [0.9, -9.9]]) circle(px + dx * z, py + dy * z, 1.3 * z, C(col));
      if (eye) for (const [dx, dy] of [[0, -8], [-0.8, -9.6]]) circle(px + dx * z, py + dy * z, 0.5 * z, C(eye));
      poly([[px - 2.3 * z, py - 4.2 * z], [px + 2.3 * z, py - 4.2 * z], [px + 1.7 * z, py], [px - 1.7 * z, py]], C('#9fb0bf'));
      poly([[px + 0.6 * z, py - 4.2 * z], [px + 2.3 * z, py - 4.2 * z], [px + 1.7 * z, py], [px + 0.4 * z, py]], C('#8697a8'));
      ellipse(px, py - 4.2 * z, 2.3 * z, 0.8 * z, C('#6f8090'));
    };
  }
  SHOP_ART.blumenladen = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, GREEN = '#4caf50';
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#fde2ec', roof: GREEN, roofType: 'gable', ridge: 'a', h: 20, roofH: 11, upperWins: 0, trim: '#ffffff' });
      awning(K, B, GREEN, '#ffffff');
      ['front', 'right', 'left', 'back'].forEach((side, k) => boxWins(K, B, side, 2, 0.64, 0.86, k));
      if (!B.faces.front) for (const side of ['right', 'left', 'back']) {                          // untere Fenster (shopHouse)
        const F = B.faces[side];
        if (F) for (let i = 0; i < 2; i++) flowerBox(F, 0.1 + 0.4 * (i + 0.12), 0.1 + 0.4 * (i + 0.88), F.H * 0.12, z, i + 2);
      }
      for (const [side, da] of [['front', 1], ['back', -1]]) {                                        // Kranz im Giebel
        if (!B.faces[side]) continue;
        const [wx, wy] = K.P(B.a + da * B.ha, B.b, B.h + 11 * 0.34);
        g.strokeStyle = C('#4f9e3a'); g.lineWidth = 1.3 * z;
        g.beginPath(); g.arc(wx, wy, 2.3 * z, 0, Math.PI * 2); g.stroke();
        for (let i = 0; i < 4; i++) circle(wx + Math.cos(i * 1.57 + 0.6) * 2.3 * z, wy + Math.sin(i * 1.57 + 0.6) * 2.3 * z, 0.9 * z, C(BLOOM[i]));
      }
    }], hangSign(K, (cx, cy, z) => miniSunflower(cx, cy, z, now), GREEN),
      [0.42, -0.36, bucket(K, 0.42, -0.36, '#e8413c')], [0.42, -0.2, bucket(K, 0.42, -0.2, '#ffd23f', '#e8913c')],
      [0.42, -0.04, bucket(K, 0.42, -0.04, '#b57bff')], [0.53, -0.28, bucket(K, 0.53, -0.28, '#ffffff', '#ffd23f')],
      [0.53, -0.12, bucket(K, 0.53, -0.12, '#ff5d8f')]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Friseur: hellblaues Haus, marineblaues Walmdach, Markise marine-weiß, hohe Friseur-Säule (drehende rot-weiß-blaue
  // Spirale, Kugel oben) an einer vorderen Ecke, kleines Scheren-Schild an der anderen
  // ---------------------------------------------------------------------------------------------------------------
  const NAVY = '#2c3e70';
  function barberPole(K, a, b, now, L) {
    const [px, py] = K.P(a, b), z = K.z, r = 2.4 * z, y0 = py - 4 * z, y1 = py - 29 * z;
    box(px, py, 3.2 * z, 1.6 * z, 4 * z, NAVY, null, 0);                                             // Sockel
    g.save();
    g.beginPath(); g.rect(px - r, y1, 2 * r, y0 - y1); g.clip();
    rect(px - r, y1, 2 * r, y0 - y1, C('#ffffff'));
    const per = 8 * z, sl = 3.4 * z, bw = 2 * z, off = ((now / 1700) % 1) * per;
    for (let k = -1; k * per < y0 - y1 + per; k++) {
      const yb = y0 - k * per - off;
      poly([[px - r, yb], [px + r, yb - sl], [px + r, yb - sl - bw], [px - r, yb - bw]], C('#e8413c'));
      poly([[px - r, yb - per / 2], [px + r, yb - per / 2 - sl], [px + r, yb - per / 2 - sl - bw], [px - r, yb - per / 2 - bw]], C('#2f5fb3'));
    }
    rect(px + r * 0.3, y1, r * 0.7, y0 - y1, 'rgba(20,30,60,0.22)');                                // Rundung
    rect(px - r * 0.62, y1, r * 0.32, y0 - y1, 'rgba(255,255,255,0.5)');
    g.restore();
    glowQuad([[px - r, y1], [px + r, y1], [px + r, y0], [px - r, y0]], 18 * z);
    for (const yy of [y0, y1]) { rect(px - r - 0.6 * z, yy - 1 * z, 2 * r + 1.2 * z, 2 * z, C('#c7cdd6')); rect(px - r - 0.6 * z, yy + 0.2 * z, 2 * r + 1.2 * z, 0.8 * z, C('#98a1ae')); }
    const gy = y1 - 4 * z;                                                                           // Kugel
    circle(px, gy, 3.1 * z, L ? '#fff6d0' : C('#eef3fa'));
    circle(px - 1 * z, gy - 1 * z, 1 * z, C('#ffffff'));
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
  function potShrub(K, a, b) {
    return () => {
      const [px, py] = K.P(a, b), z = K.z;
      poly([[px - 2 * z, py - 3.4 * z], [px + 2 * z, py - 3.4 * z], [px + 1.5 * z, py], [px - 1.5 * z, py]], C(NAVY));
      circle(px, py - 6.4 * z, 3.2 * z, C('#4f9e4a'));
      circle(px + 1 * z, py - 5.6 * z, 2 * z, C('#3f8a3c'));
      circle(px - 1 * z, py - 7.4 * z, 1.5 * z, C('#6dbb5f'));
    };
  }
  SHOP_ART.friseur = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, L = lit(), cx = K.P(0, 0)[0];
    // Säule an die vordere Ecke, die am Rand des Bildes steht – so ist sie aus jeder Richtung frei zu sehen
    const sb = Math.abs(K.P(0.37, 0.47)[0] - cx) >= Math.abs(K.P(0.37, -0.47)[0] - cx) ? 0.47 : -0.47;
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: '#e8f1fb', roof: NAVY, roofType: 'hip', h: 21, roofH: 10, trim: NAVY, upperWins: 2 });
      awning(K, B, NAVY, '#ffffff');
      const F = B.faces.front;
      if (F) {                                                                                       // runder Spiegel im Schaufenster
        const m = faceAt(F, 0.33, F.H * 0.26);
        ellipse(m[0], m[1], 2.2 * z, 2.8 * z, C('#e0b84c'));
        ellipse(m[0], m[1], 1.5 * z, 2.1 * z, C('#eaf6ff'));
      }
      barberPole(K, 0.37, sb, now, L);                                                              // steht neben dem Haus
    }], hangSign(K, (cx, cy, z) => {                                                               // Mini-Schere
      g.save(); g.translate(cx, cy); g.scale(0.55, 0.55);
      scissors(0, -0.4 * z, z, L ? '#3a5298' : C(NAVY));
      g.restore();
      kGlow(cx, cy, z, 14);
    }, NAVY),
      [0.44, -0.04, potShrub(K, 0.44, -0.04)], [0.44, 0.34, potShrub(K, 0.44, 0.34)]]);
  };

  // ---------------------------------------------------------------------------------------------------------------
  // Post: posthorn-gelbes Haus, fast schwarzes Dach, Markise schwarz-gelb, kleines Posthorn-Schild an der Ecke,
  // gelber Briefkasten und Paketstapel vor der Tür
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
      const z = K.z;
      kPost(K, a, b, 5, PDARK, 1.6);
      const M = K.block({ a, b, ha: 0.055, hb: 0.08, h: 7, lift: 4.5, wall: PYEL, roof: PYEL, roofH: 2.8, type: 'barrel', ridge: 'a' });
      for (const S of Object.values(M.faces)) {
        if (!S) continue;
        if (S.n[0]) faceQuad(S.P, S.Q, 0.2, 0.8, S.H * 0.72, S.H * 0.86, C(PDARK));                   // Einwurf
        const m = faceAt(S, 0.5, S.H * 0.38);
        circle(m[0], m[1], 1.1 * z, C(PDARK));
      }
    };
  }
  function parcel(K, a, b, sz, up, col) {
    return () => {
      const P = K.block({ a, b, ha: 0.06 * sz, hb: 0.075 * sz, h: 4.6 * sz, lift: up, wall: col, roof: shade(col, 0.12), type: 'flat' });
      for (const S of Object.values(P.faces)) if (S) faceQuad(S.P, S.Q, 0.42, 0.58, 0, S.H, K.wallCol('#f3e2b8', S.n));
      const [tx, ty] = K.P(a, b, up + 4.6 * sz), z = K.z;
      rect(tx - 0.6 * z, ty - 1.2 * z, 1.2 * z, 2.4 * z, C('#f3e2b8'));
    };
  }
  SHOP_ART.post = function (K, s, now, x, y, t, ha, hb) {
    const L = lit();
    K.scene([[-0.08, 0, () => {
      const B = shopHouse(K, { wall: PYEL, roof: PDARK, roofType: 'gable', ridge: 'b', h: 20, roofH: 9, trim: PDARK, upperWins: 2 });
      awning(K, B, PDARK, PYEL);
    }], hangSign(K, (cx, cy, z) => {                                                               // Mini-Posthorn, gelb auf dunkel
      const col = L ? '#ffe14d' : C(PYEL);
      circle(cx, cy, 4.5 * z, C(PDARK));
      g.strokeStyle = col; g.lineWidth = 0.45 * z;
      g.beginPath(); g.arc(cx, cy, 4.85 * z, 0, Math.PI * 2); g.stroke();
      g.save(); g.translate(cx, cy); g.scale(0.43, 0.43);
      posthorn(0.35 * z, -0.25 * z, z, col);
      g.restore();
      kGlow(cx, cy, z, 14);
    }, PDARK), [0.44, -0.24, mailbox(K, 0.44, -0.24)],
      [0.43, 0.33, parcel(K, 0.43, 0.33, 1, 0, '#c9955f')], [0.43, 0.33, parcel(K, 0.43, 0.34, 0.75, 4.6, '#dcb07a')],
      [0.5, 0.46, parcel(K, 0.5, 0.46, 0.7, 0, '#d9a86a')]]);
  };
})();
