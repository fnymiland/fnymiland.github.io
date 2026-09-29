'use strict';
// Ladenbilder, Gruppe b (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt)
// Café, Teeladen, Bubble Tea, Eisdiele: feste Markenfarben und ein großes Wahrzeichen auf dem Dach. Das Wahrzeichen
// ist ein aufrechtes Bildchen (Tasse, Teeblatt, Becher, Eiswaffel) und sieht aus allen vier Richtungen gleich aus.
(function () {
  const isLit = () => night > 0.15 && isLive();
  // Ecke des Hauses, die der Kamera am nächsten ist (Schilder, die man immer sehen soll)
  const nearCorner = K => [[0.3, 0.42], [0.3, -0.42], [-0.44, 0.42], [-0.44, -0.42]].reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);
  const withAlpha = (a, fn) => { g.save(); g.globalAlpha *= a; try { fn(); } finally { g.restore(); } };
  const line = (p, q, col, w, z) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
  // Becher/Tasse als Pfad: unten Radius rb (Boden rund), oben rt; bulge wölbt die Seiten nach außen
  function cupPath(x, y0, y1, rb, rt, ry, bulge = 0) {
    const my = (y0 + y1) / 2, mr = (rb + rt) / 2 + bulge;
    g.beginPath();
    g.moveTo(x - rt, y1);
    g.quadraticCurveTo(x - mr, my, x - rb, y0);
    g.ellipse(x, y0, rb, rb * ry, 0, Math.PI, 0, true);
    g.quadraticCurveTo(x + mr, my, x + rt, y1);
    g.closePath();
  }
  // Band um einen Zylinder (vordere Hälfte) zwischen yA (oben) und yB (unten)
  function bandPath(x, yA, yB, rA, rB, ry) {
    g.beginPath();
    g.ellipse(x, yA, rA, rA * ry, 0, Math.PI, 0, true);
    g.ellipse(x, yB, rB, rB * ry, 0, 0, Math.PI, false);
    g.closePath();
  }
  // Rundes Hängeschild an der Ecke mit selbst gezeichnetem Bild
  function hangSign(K, a, b, up, ring, draw) {
    const [x, y] = K.P(a, b, up), z = K.z;
    line([x, y - 5.2 * z], [x, y - 8 * z], '#6b4f3a', 0.8, z);
    circle(x, y, 5.4 * z, C(ring));
    circle(x, y, 4.3 * z, C('#fffaf0'));
    draw(x, y, z);
  }

  // ---------------------------------------------------------------- Café
  function coffeeCup(x, y, z, now) {
    const ry = 0.3, y0 = y - 2.6 * z, y1 = y - 16 * z, rb = 6 * z, rt = 8.8 * z;
    ellipse(x, y + 1 * z, 10 * z, 2.8 * z, 'rgba(50,25,10,0.22)');                  // Schatten aufs Dach
    ellipse(x, y - 0.4 * z, 12.5 * z, 3.8 * z, C('#d6cabb'));                        // Untertasse
    ellipse(x, y - 1.3 * z, 12.5 * z, 3.6 * z, C('#fffaf2'));
    ellipse(x, y - 1.5 * z, 7.4 * z, 2.2 * z, C('#ebe1d3'));
    g.strokeStyle = C('#e9dfd1'); g.lineWidth = 2.5 * z; g.lineCap = 'round';        // Henkel
    g.beginPath(); g.arc(x + rt - 0.4 * z, (y0 + y1) / 2 - 1 * z, 3.9 * z, -Math.PI / 2 - 0.25, Math.PI / 2 + 0.25); g.stroke();
    cupPath(x, y0, y1, rb, rt, ry, 1.1 * z);
    g.fillStyle = C('#fffaf2'); g.fill();
    g.save(); g.clip();
    g.fillStyle = C('#e8ddcf'); g.fillRect(x + rt * 0.38, y1 - 4 * z, rt, y0 - y1 + 8 * z);    // Schattenseite
    g.fillStyle = C('#ffffff'); g.fillRect(x - rt * 0.72, y1 + 1.5 * z, 1.5 * z, y0 - y1 - 3 * z);   // Glanz
    bandPath(x, y1 + 4.6 * z, y1 + 8.2 * z, rt * 1.05, rt * 1.0, ry);                // Espresso-Band
    g.fillStyle = C('#5b3a26'); g.fill();
    g.restore();
    const by = y1 + 6.4 * z + rt * ry * 0.9;                                           // Bohne auf dem Band
    g.beginPath(); g.ellipse(x - 0.6 * z, by, 1.9 * z, 1.25 * z, -0.45, 0, Math.PI * 2); g.fillStyle = C('#e8d3b5'); g.fill();
    line([x - 1.6 * z, by + 0.6 * z], [x + 0.4 * z, by - 0.6 * z], '#5b3a26', 0.45, z);
    ellipse(x, y1, rt, rt * ry, C('#fffaf2'));                                         // Rand und Kaffee
    ellipse(x, y1 + 0.25 * z, rt - 1.1 * z, (rt - 1.1 * z) * ry, C('#6b3e22'));
    ellipse(x - 0.4 * z, y1 + 0.2 * z, rt - 2.6 * z, (rt - 2.6 * z) * ry, C('#9a6236'));
    const hy = y1 + 0.1 * z;                                                           // Milchschaum-Herz
    ellipse(x - 1.1 * z, hy, 1.3 * z, 0.75 * z, C('#f3e2c4'));
    ellipse(x + 1.1 * z, hy, 1.3 * z, 0.75 * z, C('#f3e2c4'));
    poly([[x - 2.35 * z, hy + 0.15 * z], [x + 2.35 * z, hy + 0.15 * z], [x, hy + 1.7 * z]], C('#f3e2c4'));
    g.lineWidth = 1.5 * z; g.lineCap = 'round';                                        // Dampfkringel
    for (let i = 0; i < 3; i++) {
      const ph = (now / 2600 + i / 3) % 1, sx = x + (i - 1) * 3.8 * z, sy = y1 - 3 * z - ph * 9 * z, w = (i === 1 ? -2.4 : 2.4) * z;
      withAlpha(Math.sin(ph * Math.PI) * 0.9, () => {
        g.strokeStyle = C('#ffffff'); g.beginPath(); g.moveTo(sx, sy);
        g.bezierCurveTo(sx + w, sy - 2.5 * z, sx - w, sy - 4.8 * z, sx, sy - 7.5 * z); g.stroke();
      });
    }
    kGlow(x, (y0 + y1) / 2, z, 26);
  }
  function chalkBoard(K, a, b) {
    const [x, y] = K.P(a, b), z = K.z;
    ellipse(x, y + 0.4 * z, 3.6 * z, 1.2 * z, 'rgba(40,60,20,0.16)');
    line([x - 2.4 * z, y], [x - 1.3 * z, y - 7 * z], '#7a4a2e', 0.9, z);
    line([x + 2.4 * z, y], [x + 1.3 * z, y - 7 * z], '#7a4a2e', 0.9, z);
    g.fillStyle = C('#a0714d'); g.beginPath(); g.roundRect(x - 3.1 * z, y - 10 * z, 6.2 * z, 7.6 * z, 1 * z); g.fill();
    g.fillStyle = C('#36403a'); g.fillRect(x - 2.4 * z, y - 9.3 * z, 4.8 * z, 6.2 * z);
    g.strokeStyle = C('#f5f0e6'); g.lineWidth = 0.5 * z; g.beginPath();
    g.moveTo(x - 1.6 * z, y - 8.2 * z); g.lineTo(x + 1.6 * z, y - 8.2 * z);
    g.moveTo(x - 1.6 * z, y - 7.1 * z); g.lineTo(x + 0.8 * z, y - 7.1 * z); g.stroke();
    g.fillStyle = C('#f5f0e6'); g.fillRect(x - 1.2 * z, y - 5.9 * z, 2 * z, 1.9 * z);       // Kreide-Tasse
    g.beginPath(); g.arc(x + 1 * z, y - 5 * z, 0.7 * z, -Math.PI / 2, Math.PI / 2); g.stroke();
  }
  SHOP_ART.cafe = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, [sa, sb] = nearCorner(K);
    K.scene([
      [-0.08, 0, () => shopHouse(K, { wall: '#e8d3b5', roof: '#5b3a26', awning: '#7a4a2e', roofType: 'hip', h: 20, roofH: 8, trim: '#5b3a26' })],
      [-0.08, 0, () => { const [cx, cy] = K.P(-0.08, 0, 27.5); coffeeCup(cx, cy, z, now); }],
      [sa, sb, () => hangSign(K, sa, sb, 15, '#5b3a26', (px, py) => {
        g.beginPath(); g.ellipse(px, py, 2.6 * z, 1.8 * z, -0.5, 0, Math.PI * 2); g.fillStyle = C('#6b3e22'); g.fill();
        line([px - 1.6 * z, py + 0.9 * z], [px + 1.6 * z, py - 0.9 * z], '#e8d3b5', 0.5, z);
      })],
      [0.36, -0.24, () => kTable(K, 0.36, -0.24, '#7a4a2e')],
      [0.44, 0.02, () => chalkBoard(K, 0.44, 0.02)],
    ]);
  };

  // ---------------------------------------------------------------- Teeladen
  function leafPath(L, W) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(W * 1.25, -L * 0.2, W * 1.05, -L * 0.72, 0, -L);
    g.bezierCurveTo(-W * 1.05, -L * 0.72, -W * 1.25, -L * 0.2, 0, 0);
    g.closePath();
  }
  // Teeblatt mit Mittelrippe und Adern, Spitze nach oben, um ang gekippt (L, W in px)
  function teaLeaf(x, y, z, L, W, ang, light, dark, veins = 4) {
    const l = L * z, w = W * z;
    g.save(); g.translate(x, y); g.rotate(ang);
    leafPath(l, w);
    g.save(); g.clip();
    g.fillStyle = C(light); g.fillRect(-w * 2, -l, w * 2, l + 1);
    g.fillStyle = C(dark); g.fillRect(0, -l, w * 2, l + 1);
    ellipse(-w * 0.45, -l * 0.55, w * 0.25, l * 0.16, C(shade(light, 0.3)));           // Glanz
    g.strokeStyle = C('#2e7d4f'); g.lineCap = 'round';
    g.lineWidth = 0.55 * z; g.beginPath();
    for (let k = 1; k <= veins; k++) {
      const vy = -l * (0.12 + k * 0.72 / (veins + 1)), vw = w * (1.05 - k * 0.12);
      g.moveTo(0, vy); g.lineTo(-vw, vy - l * 0.12); g.moveTo(0, vy); g.lineTo(vw, vy - l * 0.12);
    }
    g.stroke();
    g.lineWidth = 0.95 * z; g.beginPath(); g.moveTo(0, -0.3 * z); g.lineTo(0, -l * 0.9); g.stroke();   // Mittelrippe
    g.restore();
    leafPath(l, w);
    g.lineWidth = 1.1 * z; g.strokeStyle = C('#1f5e3a'); g.stroke();
    g.restore();
  }
  function teaSprig(x, y, z, now) {
    const sway = Math.sin(now / 1500) * 0.05;
    ellipse(x, y + 1 * z, 7 * z, 2 * z, 'rgba(20,50,30,0.22)');
    line([x, y + 0.5 * z], [x, y - 3.5 * z], '#4f7a2e', 1.6, z);
    teaLeaf(x, y - 3 * z, z, 10, 2.6, -0.2 + sway, '#d4f59c', '#aee27a', 2);                  // Knospe
    teaLeaf(x - 0.5 * z, y - 2 * z, z, 14, 4.2, -0.95 + sway, '#a6e878', '#7acb5c', 3);       // kleines Blatt
    teaLeaf(x + 0.3 * z, y - 2.5 * z, z, 27, 7.5, 0.3 + sway, '#8ee06a', '#5cbf55', 4);       // großes Blatt
  }
  // Traufe mit hochgebogenen Ecken (Pagodenart) und goldenen Knöpfen
  // (nur an den Ecken links und rechts im Bild – dort liegt der Bogen außerhalb der Dachfläche)
  function curlyEaves(K, a, b, ha, hb, h, roof, over = 1.12) {
    const ea = ha * over, eb = hb * over, z = K.z;
    const pts = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([sa, sb]) => K.P(a + sa * ea, b + sb * eb, h));   // im Kreis
    const back = pts.reduce((p, q) => q[1] < p[1] ? q : p);
    for (const p of pts) {
      if (p === back || pts.every(q => q[1] <= p[1])) continue;                          // hintere und vordere Ecke nicht
      const e = lerp(p, back, 0.32), out = p[0] < back[0] ? -1 : 1;
      const tip = [p[0] + out * 3 * z, p[1] - 5.2 * z], ctl = [p[0] + (e[0] - p[0]) * 0.3, p[1] + (e[1] - p[1]) * 0.3 - 2.6 * z];
      g.beginPath(); g.moveTo(e[0], e[1]); g.quadraticCurveTo(p[0], p[1] + 0.5 * z, tip[0], tip[1]);
      g.quadraticCurveTo(ctl[0], ctl[1], e[0], e[1]); g.closePath();
      g.fillStyle = C(shade(roof, out < 0 ? 0.1 : -0.12)); g.fill();
      circle(tip[0], tip[1], 0.85 * z, C('#e9c46a'));
    }
  }
  function teapot(px, py, z) {
    g.strokeStyle = C('#2e7d4f'); g.lineWidth = 1.2 * z; g.lineCap = 'round';           // Henkel
    g.beginPath(); g.arc(px + 3.4 * z, py + 0.2 * z, 2 * z, -Math.PI / 2, Math.PI / 2); g.stroke();
    poly([[px - 2.6 * z, py + 0.6 * z], [px - 5.6 * z, py - 2.6 * z], [px - 5 * z, py - 3.1 * z], [px - 2.4 * z, py - 1 * z]], C('#3f9e62'));   // Tülle
    ellipse(px, py + 0.7 * z, 3.6 * z, 2.9 * z, C('#3f9e62'));
    ellipse(px - 1.2 * z, py - 0.3 * z, 1.2 * z, 0.8 * z, C('#a8e6b4'));
    ellipse(px, py - 2 * z, 2 * z, 0.7 * z, C('#2e7d4f'));                              // Deckel
    circle(px, py - 2.8 * z, 0.7 * z, C('#e9c46a'));
  }
  function bambooPot(K, a, b, tall) {
    const [x, y] = K.P(a, b), z = K.z;
    ellipse(x, y + 0.5 * z, 3.6 * z, 1.4 * z, 'rgba(40,60,20,0.18)');
    for (const [dx, hgt] of [[-1.3, 13 * tall], [0.2, 18 * tall], [1.4, 11 * tall]]) {
      const sx = x + dx * z, top = y - (4.5 + hgt) * z;
      line([sx, y - 4 * z], [sx, top], '#8cc85a', 1.3, z);
      for (let k = 1; k * 3.6 < hgt; k++) line([sx - 0.7 * z, y - (4.5 + k * 3.6) * z], [sx + 0.7 * z, y - (4.5 + k * 3.6) * z], '#5e9a3a', 0.5, z);
      poly([[sx, top + 1.2 * z], [sx + 4.2 * z, top - 0.6 * z], [sx + 0.6 * z, top + 2.4 * z]], C('#58b36a'));
      poly([[sx, top + 2.4 * z], [sx - 4 * z, top + 0.6 * z], [sx - 0.4 * z, top + 3.4 * z]], C('#4a9e50'));
    }
    poly([[x - 3 * z, y - 4.6 * z], [x + 3 * z, y - 4.6 * z], [x + 2.2 * z, y], [x - 2.2 * z, y]], C('#2f6b4f'));   // Topf
    poly([[x + 0.8 * z, y - 4.6 * z], [x + 3 * z, y - 4.6 * z], [x + 2.2 * z, y], [x + 0.6 * z, y]], C('#245a41'));
    ellipse(x, y - 4.6 * z, 3.1 * z, 1 * z, C('#4a9a70'));
    ellipse(x, y - 4.6 * z, 2.4 * z, 0.7 * z, C('#5a3a26'));
  }
  SHOP_ART.teeladen = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, roof = '#2e7d4f', [sa, sb] = nearCorner(K);
    K.scene([
      [-0.08, 0, () => {
        shopHouse(K, { wall: '#e3f2e1', roof, awning: '#3f9e62', roofType: 'hip', h: 20, roofH: 10, trim: '#2e7d4f' });
        curlyEaves(K, -0.08, 0, 0.34, 0.37, 20, roof);
      }],
      [-0.08, 0, () => { const [cx, cy] = K.P(-0.08, 0, 29); teaSprig(cx, cy, z, now); }],
      [sa, sb, () => {
        const [px, py] = K.P(sa, sb, 15);
        line([px, py - 3.6 * z], [px, py - 8 * z], '#6b4f3a', 0.8, z);
        teapot(px, py, z);
        kGlow(px, py, z, 10);
      }],
      [0.38, -0.32, () => bambooPot(K, 0.38, -0.32, 1)],
      [0.4, 0.38, () => bambooPot(K, 0.4, 0.38, 0.85)],
    ]);
  };

  // ---------------------------------------------------------------- Bubble Tea
  const PEARLS = [[-4.1, 0.2], [-1.4, 0.6], [1.4, 0.6], [4.1, 0.2], [-2.8, -2.2], [0, -2], [2.8, -2.2], [-1.4, -4.4], [1.6, -4.5], [-4.2, -3.6]];
  function bobaCup(x, y, z, now, lit) {
    const ry = 0.3, H = 21 * z, y0 = y - 1.2 * z, y1 = y0 - H, rb = 5.8 * z, rt = 8 * z, tea = y1 + H * 0.2;
    const rAt = yy => rb + (rt - rb) * (y0 - yy) / H;
    const sx = yy => x - 1.4 * z + (y0 - 2 * z - yy) * 0.27;                              // Strohhalm, schräg nach rechts
    ellipse(x, y + 0.6 * z, 8.5 * z, 2.5 * z, 'rgba(60,30,70,0.22)');
    cupPath(x, y0, y1, rb, rt, ry);
    g.save(); g.clip();
    g.fillStyle = C('#f6f2ff'); g.fillRect(x - rt - 2 * z, y1 - rt, 2 * rt + 4 * z, H + 2 * rt);   // leerer Teil
    g.fillStyle = C('#d6ad84'); g.fillRect(x - rt - 2 * z, tea, 2 * rt + 4 * z, y0 - tea + rt);     // Milchtee
    ellipse(x, tea, rAt(tea), rAt(tea) * ry, C('#e7c7a0'));
    withAlpha(0.55, () => line([sx(y0 - 2 * z), y0 - 2 * z], [sx(y1), y1], '#39c5bb', 3, z));
    for (const [px, py] of PEARLS) {                                                     // Tapioka-Perlen
      circle(x + px * z, y0 + py * z, 1.55 * z, C('#3a2216'));
      circle(x + (px - 0.5) * z, y0 + (py - 0.55) * z, 0.5 * z, C('#8a6552'));
    }
    withAlpha(0.16, () => { g.fillStyle = C('#5a2d5e'); g.fillRect(x + rt * 0.42, y1 - rt, rt, H + 2 * rt); });
    withAlpha(0.75, () => { g.fillStyle = C('#ffffff'); g.fillRect(x - rt * 0.7, y1 + 1.2 * z, 1.4 * z, H * 0.78); });
    g.restore();
    const ly = y1 + H * 0.5;                                                             // Aufkleber mit Herz
    circle(x - 0.4 * z, ly, 3.3 * z, C('#ff5fa8'));
    circle(x - 1.2 * z, ly - 0.4 * z, 0.95 * z, C('#ffffff'));
    circle(x + 0.4 * z, ly - 0.4 * z, 0.95 * z, C('#ffffff'));
    poly([[x - 2.1 * z, ly - 0.1 * z], [x + 1.3 * z, ly - 0.1 * z], [x - 0.4 * z, ly + 1.8 * z]], C('#ffffff'));
    cupPath(x, y0, y1, rb, rt, ry);                                                      // Kante (nachts Neon)
    g.lineWidth = (lit ? 1.8 : 0.9) * z; g.strokeStyle = lit ? '#ff6fc0' : C('#ffffff'); g.stroke();
    ellipse(x, y1, rt + 0.8 * z, (rt + 0.8 * z) * ry, C('#e6ddf5'));                      // Deckel: Rand
    withAlpha(0.88, () => {                                                              // gewölbte Kuppel
      g.beginPath(); g.ellipse(x, y1 - 0.3 * z, rt * 0.93, rt * 0.64, 0, Math.PI, 0); g.closePath();
      g.fillStyle = C('#f8f5ff'); g.fill();
      g.lineWidth = 0.7 * z; g.strokeStyle = C('#d2c6ea'); g.stroke();
    });
    ellipse(x - rt * 0.36, y1 - rt * 0.36, 1.9 * z, 1 * z, C('#ffffff'));
    bandPath(x, y1 - 0.5 * z, y1 + 0.7 * z, rt + 0.8 * z, rt + 0.8 * z, ry);
    g.fillStyle = C('#d9cdef'); g.fill();
    const s0y = y1 - 4.6 * z, s1y = y1 - 17 * z, p0 = [sx(s0y), s0y], p1 = [sx(s1y), s1y];   // dicker bunter Strohhalm
    line(p0, p1, '#39c5bb', 3.6, z);
    const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1, nx = -(p1[1] - p0[1]) / len, ny = (p1[0] - p0[0]) / len;
    for (const k of [0.18, 0.42, 0.66, 0.9]) {
      const m = lerp(p0, p1, k);
      line([m[0] - nx * 1.4 * z, m[1] - ny * 1.4 * z - 0.6 * z], [m[0] + nx * 1.4 * z, m[1] + ny * 1.4 * z + 0.6 * z], '#ff8fc4', 1, z);
    }
    ellipse(p1[0], p1[1], 1.8 * z, 0.8 * z, C('#23978f'));
    kGlow(x, y1 + H * 0.45, z, 30);
  }
  // Leuchtband (Neon) über eine Seite
  function neonBand(F, h0, h1, lit, col, litCol, z) {
    const a = lerp(F.P, F.Q, 0.03), b = lerp(F.P, F.Q, 0.97);
    faceQuad(F.P, F.Q, 0.03, 0.97, h0, h1, lit ? litCol : C(col));
    glowQuad([[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]], 16 * z);
  }
  SHOP_ART.bubbletea = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z, lit = isLit();
    K.scene([
      [-0.08, 0, () => {
        const B = shopHouse(K, { wall: '#ffc2dd', roof: '#b39ddb', awning: '#ff6fae', roofType: 'flat', h: 22, roofH: 0, trim: '#b39ddb' });
        for (const F of Object.values(B.faces)) if (F) neonBand(F, F.H * 0.86, F.H * 0.94, lit, '#ff5fa8', '#ff7ac8', z);
        K.block({ a: -0.08, b: 0, ha: 0.35, hb: 0.38, h: 2.6, lift: 22, wall: '#9f86cc', roof: '#b39ddb', type: 'flat' });   // Dachrand
        K.rect(-0.08 - 0.28, -0.31, -0.08 + 0.28, 0.31, C('#c7b6e6'), 24.6);
      }],
      [-0.08, 0, () => { const [cx, cy] = K.P(-0.08, 0, 24.6); bobaCup(cx, cy, z, now, lit); }],
      [0.36, -0.24, () => kTable(K, 0.36, -0.24, '#ff8fc4')],
    ]);
  };

  // ---------------------------------------------------------------- Eisdiele
  function scoop(sx, sy, r, col, hi) {
    circle(sx, sy, r, C(shade(col, -0.14)));
    for (let i = -2; i <= 2; i++) circle(sx + i * r * 0.42, sy + r * 0.74 + (i & 1 ? 0.12 : 0) * r, r * 0.3, C(shade(col, -0.14)));   // wellige Unterkante
    circle(sx - r * 0.1, sy - r * 0.1, r * 0.88, C(col));
    for (let i = -2; i <= 1; i++) circle(sx + (i + 0.5) * r * 0.42 - r * 0.06, sy + r * 0.62, r * 0.26, C(col));
    ellipse(sx - r * 0.38, sy - r * 0.42, r * 0.32, r * 0.2, C(hi));
  }
  function iceCone(x, y, z, now) {
    const yT = y - 15 * z, w = 7.2 * z;
    const cone = () => { g.beginPath(); g.moveTo(x - w, yT); g.lineTo(x + w, yT); g.lineTo(x, y); g.closePath(); };
    ellipse(x, y + 0.8 * z, 5 * z, 1.6 * z, 'rgba(80,30,40,0.22)');
    cone(); g.fillStyle = C('#e6ac5c'); g.fill();
    g.save(); cone(); g.clip();
    poly([[x + 2.4 * z, yT], [x + w + 1, yT], [x, y + 1]], C('#cf9447'));                 // Schattenseite
    g.strokeStyle = C('#a8692c'); g.lineWidth = 0.7 * z; g.beginPath();                    // Rautenmuster
    for (let k = -5; k <= 5; k++) {
      const bx = x + k * 3 * z;
      g.moveTo(bx, yT - 1 * z); g.lineTo(bx + 14 * z, yT + 17 * z);
      g.moveTo(bx, yT - 1 * z); g.lineTo(bx - 14 * z, yT + 17 * z);
    }
    g.stroke(); g.restore();
    ellipse(x, yT, w + 0.5 * z, 1.9 * z, C('#f2c681'));
    scoop(x - 3.9 * z, yT - 3.4 * z, 5.4 * z, '#8a5a3c', '#b98c68');                      // Schoko
    scoop(x + 3.9 * z, yT - 3.4 * z, 5.4 * z, '#8fdcaa', '#d6f7e3');                      // Pistazie
    scoop(x, yT - 10.4 * z, 5.8 * z, '#ff8fb1', '#ffd0de');                               // Erdbeer
    for (const [dx, dy, col, ang] of [[-2.6, -12.6, '#fff27a', 0.6], [1.8, -13.4, '#5f8fe8', -0.5], [3, -10.6, '#ffffff', 0.3], [-1.2, -9.4, '#7ccf5b', -0.8], [0.8, -11.2, '#ffffff', 1.2]]) {
      const cx = x + dx * z, cy = yT + dy * z;
      line([cx - Math.cos(ang) * 0.8 * z, cy - Math.sin(ang) * 0.8 * z], [cx + Math.cos(ang) * 0.8 * z, cy + Math.sin(ang) * 0.8 * z], col, 0.8, z);
    }
    g.strokeStyle = C('#5e8a2e'); g.lineWidth = 0.8 * z; g.lineCap = 'round';           // Kirsche
    g.beginPath(); g.moveTo(x + 0.8 * z, yT - 18.6 * z); g.quadraticCurveTo(x + 1.2 * z, yT - 21.8 * z, x + 3.6 * z, yT - 22.4 * z); g.stroke();
    circle(x + 0.6 * z, yT - 17 * z, 2.3 * z, C('#d91f3a'));
    circle(x - 0.1 * z, yT - 17.8 * z, 0.75 * z, C('#ff9aa8'));
    kGlow(x, yT - 7 * z, z, 22);
  }
  // Eisdielen-Haus: Vanille mit Pistazien-Streifen, Sahne-Tupfen an der Traufe, Markise pink-mint
  function iceHouse(K) {
    const z = K.z, a = -0.08, b = 0, ha = 0.34, hb = 0.37, h = 20, ea = ha * 1.12, eb = hb * 1.12;
    const B = K.block({ a, b, ha, hb, h, wall: '#fff4e0', roof: '#ff8fb1', roofH: 9, type: 'hip', entry: true });
    for (const F of Object.values(B.faces)) {
      if (!F) continue;
      for (let i = 0; i < 6; i++) { const t0 = 0.045 + i * 0.165; faceQuad(F.P, F.Q, t0, t0 + 0.08, Math.min(1.6 * z, F.H * 0.15), F.H - Math.min(2.6 * z, F.H * 0.22), K.wallCol('#b8f0d8', F.n)); }
    }
    const F = B.faces.front;
    if (F) {
      faceQuad(F.P, F.Q, 0.06, 0.6, F.H * 0.05, F.H * 0.45, C('#ff8fb1'));
      windowOn(F.P, F.Q, 0.1, 0.56, F.H * 0.08, F.H * 0.42, z);
      faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(DOOR_COL));
      for (let i = 0; i < 8; i++) faceQuad(F.P, F.Q, 0.06 + i * 0.11, 0.17 + i * 0.11, F.H * 0.44, F.H * 0.56, C(i & 1 ? '#b8f0d8' : '#ff8fb1'));   // Markise
      for (let i = 0; i < 8; i++) { const m = faceAt(F, 0.115 + i * 0.11, F.H * 0.44); circle(m[0], m[1], 1.35 * z, C(i & 1 ? '#8fdcaa' : '#f06d98')); }
    }
    K.wins(B, 'front', 2, 0.64, 0.86); K.sideWins(B, 2, 0.64, 0.86);
    if (!F) K.sideWins(B, 2, 0.12, 0.4);
    for (const [name, f] of Object.entries(FACES)) {                                     // Sahne-Tupfen an der Traufe
      if (!B.faces[name]) continue;
      const e0 = K.P(a + f.p[0] * ea, b + f.p[1] * eb, h), e1 = K.P(a + f.q[0] * ea, b + f.q[1] * eb, h);
      for (let i = 0; i < 7; i++) { const m = lerp(e0, e1, (i + 0.5) / 7); circle(m[0], m[1] + 0.4 * z, 1.5 * z, C('#fffaf0')); }
    }
    return B;
  }
  SHOP_ART.eisdiele = function (K, s, now, x, y, t, ha, hb) {
    const z = K.z;
    K.scene([
      [-0.08, 0, () => iceHouse(K)],
      [-0.08, 0, () => { const [cx, cy] = K.P(-0.08, 0, 27); iceCone(cx, cy, z, now); }],
      [0.36, -0.24, () => kTable(K, 0.36, -0.24, '#8fdcaa')],
    ]);
  };
})();
