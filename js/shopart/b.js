'use strict';
// Ladenbilder, Gruppe b (Block 32) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, kText, faceAt, hangSign)
// Café, Teeladen, Bubble Tea, Eisdiele: feste Markenfarben. Das Wahrzeichen (Tasse, Teeblatt, Becher, Eiswaffel) hängt
// klein im Ausleger-Schild an der Hausecke (hangSign), das Dach bleibt frei (Block 34).
(function () {
  const isLit = () => night > 0.15 && isLive();
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

  // ---------------------------------------------------------------- Café
  // Kaffeetasse klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Untertasse, weiße Tasse mit
  // Espresso-Band, Kaffee und zwei Dampfkringel
  function miniCup(x, y, z, now) {
    const ry = 0.3, y0 = y + 2.1 * z, y1 = y - 0.9 * z, rb = 1.7 * z, rt = 2.4 * z, bulge = 0.3 * z;
    ellipse(x, y + 2.55 * z, 3.1 * z, 0.95 * z, C('#b9a896'));                          // Untertasse
    ellipse(x, y + 2.35 * z, 2.9 * z, 0.8 * z, C('#ebe1d3'));
    g.strokeStyle = C('#5b3a26'); g.lineWidth = 0.7 * z; g.lineCap = 'round';           // Henkel
    g.beginPath(); g.arc(x + rt - 0.1 * z, (y0 + y1) / 2 - 0.2 * z, 1.05 * z, -Math.PI / 2, Math.PI / 2); g.stroke();
    cupPath(x, y0, y1, rb, rt, ry, bulge);
    g.fillStyle = C('#ffffff'); g.fill();
    g.save(); g.clip();
    g.fillStyle = C('#e8ddcf'); g.fillRect(x + rt * 0.38, y1 - 1 * z, rt, y0 - y1 + 2 * z);   // Schattenseite
    bandPath(x, y1 + 1.2 * z, y1 + 2.2 * z, rt * 1.05, rt, ry);                            // Espresso-Band
    g.fillStyle = C('#5b3a26'); g.fill();
    g.restore();
    cupPath(x, y0, y1, rb, rt, ry, bulge);
    g.lineWidth = 0.4 * z; g.strokeStyle = C('#5b3a26'); g.stroke();
    ellipse(x, y1, rt, rt * ry, C('#ffffff'));                                             // Rand und Kaffee
    g.beginPath(); g.ellipse(x, y1, rt, rt * ry, 0, 0, Math.PI * 2); g.stroke();
    ellipse(x, y1 + 0.1 * z, rt - 0.45 * z, (rt - 0.45 * z) * ry, C('#6b3e22'));
    ellipse(x - 0.2 * z, y1 + 0.08 * z, rt - 1.2 * z, (rt - 1.2 * z) * ry, C('#9a6236'));
    g.lineWidth = 0.45 * z; g.lineCap = 'round';                                          // Dampfkringel
    for (let i = 0; i < 2; i++) {
      const ph = (now / 2600 + i / 2) % 1, sx = x + (i ? 0.8 : -0.8) * z, sy = y1 - 0.6 * z - ph * 0.5 * z, w = (i ? -0.6 : 0.6) * z;
      withAlpha(0.3 + 0.6 * Math.sin(ph * Math.PI), () => {
        g.strokeStyle = C('#a07a5a'); g.beginPath(); g.moveTo(sx, sy);
        g.bezierCurveTo(sx + w, sy - 0.6 * z, sx - w, sy - 1.2 * z, sx, sy - 1.8 * z); g.stroke();
      });
    }
    kGlow(x, y, z, 14);
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
    K.scene([
      [-0.08, 0, () => shopHouse(K, { wall: '#e8d3b5', roof: '#5b3a26', awning: '#7a4a2e', roofType: 'hip', h: 20, roofH: 8, trim: '#5b3a26' })],
      hangSign(K, (cx, cy, z) => miniCup(cx, cy, z, now), '#5b3a26'),                    // Tasse klein am Ausleger
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
  // Teezweig: Knospe, kleines und großes Blatt am Stiel (Fuß bei x, y; etwa 23 × 29 px groß)
  function teaSprig(x, y, z, now) {
    const sway = Math.sin(now / 1500) * 0.05;
    line([x, y + 0.5 * z], [x, y - 3.5 * z], '#4f7a2e', 1.6, z);
    teaLeaf(x, y - 3 * z, z, 10, 2.6, -0.2 + sway, '#d4f59c', '#aee27a', 2);                  // Knospe
    teaLeaf(x - 0.5 * z, y - 2 * z, z, 14, 4.2, -0.95 + sway, '#a6e878', '#7acb5c', 3);       // kleines Blatt
    teaLeaf(x + 0.3 * z, y - 2.5 * z, z, 27, 7.5, 0.3 + sway, '#8ee06a', '#5cbf55', 4);       // großes Blatt
  }
  // derselbe Zweig verkleinert fürs Ausleger-Schild (Mitte des Zweigs liegt bei etwa 1 | −15 über dem Fuß)
  function miniTea(x, y, z, now) {
    const k = 0.26;
    g.save(); g.translate(x - 1 * k * z, y + 14.5 * k * z); g.scale(k, k);
    teaSprig(0, 0, z, now);
    g.restore();
    kGlow(x, y, z, 14);
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
    const roof = '#2e7d4f';
    K.scene([
      [-0.08, 0, () => {
        shopHouse(K, { wall: '#e3f2e1', roof, awning: '#3f9e62', roofType: 'hip', h: 20, roofH: 10, trim: '#2e7d4f' });
        curlyEaves(K, -0.08, 0, 0.34, 0.37, 20, roof);
      }],
      hangSign(K, (cx, cy, z) => miniTea(cx, cy, z, now), roof),                          // Teezweig klein am Ausleger
      [0.38, -0.32, () => bambooPot(K, 0.38, -0.32, 1)],
      [0.4, 0.38, () => bambooPot(K, 0.4, 0.38, 0.85)],
    ]);
  };

  // ---------------------------------------------------------------- Bubble Tea
  // Bubble-Tea-Becher klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Milchtee mit dunklen
  // Tapioka-Perlen, gewölbter Deckel, dicker türkiser Strohhalm mit rosa Ringeln; Kante nachts in Neon-Pink
  const MINI_PEARLS = [[-0.95, -0.55], [0, -0.45], [0.95, -0.55], [-0.5, -1.35], [0.5, -1.35]];
  function miniBoba(x, y, z, lit) {
    const ry = 0.3, y0 = y + 3.2 * z, y1 = y - 0.5 * z, H = y0 - y1, rb = 1.55 * z, rt = 2.2 * z, tea = y1 + H * 0.24;
    const rAt = yy => rb + (rt - rb) * (y0 - yy) / H;
    cupPath(x, y0, y1, rb, rt, ry);
    g.save(); g.clip();
    g.fillStyle = C('#f6f2ff'); g.fillRect(x - rt - z, y1 - rt, 2 * rt + 2 * z, H + 2 * rt);         // leerer Teil
    g.fillStyle = C('#d6ad84'); g.fillRect(x - rt - z, tea, 2 * rt + 2 * z, y0 - tea + rt);         // Milchtee
    ellipse(x, tea, rAt(tea), rAt(tea) * ry, C('#e7c7a0'));
    for (const [px, py] of MINI_PEARLS) {                                                // Tapioka-Perlen
      circle(x + px * z, y0 + py * z, 0.52 * z, C('#3a2216'));
      circle(x + (px - 0.16) * z, y0 + (py - 0.18) * z, 0.17 * z, C('#8a6552'));
    }
    withAlpha(0.16, () => { g.fillStyle = C('#5a2d5e'); g.fillRect(x + rt * 0.42, y1 - rt, rt, H + 2 * rt); });
    g.restore();
    cupPath(x, y0, y1, rb, rt, ry);                                                      // Kante (nachts Neon)
    g.lineWidth = (lit ? 0.7 : 0.45) * z; g.strokeStyle = lit ? '#ff6fc0' : C('#b39ddb'); g.stroke();
    ellipse(x, y1, rt + 0.3 * z, (rt + 0.3 * z) * ry, C('#d9cdef'));                      // Deckel: Rand
    g.beginPath(); g.ellipse(x, y1 - 0.1 * z, rt * 0.93, rt * 0.6, 0, Math.PI, 0); g.closePath();   // gewölbte Kuppel
    g.fillStyle = C('#f8f5ff'); g.fill();
    g.lineWidth = 0.35 * z; g.strokeStyle = C('#b39ddb'); g.stroke();
    const p0 = [x + 0.15 * z, y1 - 0.9 * z], p1 = [x + 1.05 * z, y - 3.75 * z];               // dicker bunter Strohhalm
    line(p0, p1, '#39c5bb', 0.95, z);
    for (const k of [0.35, 0.75]) {
      const m = lerp(p0, p1, k);
      line([m[0] - 0.45 * z, m[1] + 0.05 * z], [m[0] + 0.45 * z, m[1] - 0.05 * z], '#ff8fc4', 0.35, z);
    }
    kGlow(x, y, z, 14);
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
      hangSign(K, (cx, cy, zz) => miniBoba(cx, cy, zz, lit), '#ff5fa8'),                 // Becher klein am Ausleger
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
  // Eiswaffel klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Waffel mit Rautenmuster,
  // Schoko- und Pistazienkugel, oben Erdbeer mit Streuseln und Kirsche
  function miniCone(x, y, z) {
    const yT = y + 0.55 * z, yB = y + 4 * z, w = 1.85 * z;
    const cone = () => { g.beginPath(); g.moveTo(x - w, yT); g.lineTo(x + w, yT); g.lineTo(x, yB); g.closePath(); };
    cone(); g.fillStyle = C('#e6ac5c'); g.fill();
    g.save(); cone(); g.clip();
    poly([[x + 0.6 * z, yT], [x + w + 1, yT], [x, yB + 1]], C('#cf9447'));                // Schattenseite
    g.strokeStyle = C('#a8692c'); g.lineWidth = 0.28 * z; g.beginPath();                   // Rautenmuster
    for (let k = -3; k <= 3; k++) {
      const bx = x + k * 1 * z;
      g.moveTo(bx, yT - 0.3 * z); g.lineTo(bx + 4.5 * z, yT + 5.4 * z);
      g.moveTo(bx, yT - 0.3 * z); g.lineTo(bx - 4.5 * z, yT + 5.4 * z);
    }
    g.stroke(); g.restore();
    ellipse(x, yT, w + 0.2 * z, 0.5 * z, C('#f2c681'));
    scoop(x - 1.05 * z, yT - 0.85 * z, 1.4 * z, '#8a5a3c', '#b98c68');                    // Schoko
    scoop(x + 1.05 * z, yT - 0.85 * z, 1.4 * z, '#8fdcaa', '#d6f7e3');                    // Pistazie
    scoop(x, yT - 2.6 * z, 1.5 * z, '#ff8fb1', '#ffd0de');                                // Erdbeer
    for (const [dx, dy, col, ang] of [[-0.7, -3, '#fff27a', 0.6], [0.6, -3.3, '#5f8fe8', -0.5], [0.8, -2.3, '#ffffff', 0.3]]) {
      const cx = x + dx * z, cy = yT + dy * z;
      line([cx - Math.cos(ang) * 0.25 * z, cy - Math.sin(ang) * 0.25 * z], [cx + Math.cos(ang) * 0.25 * z, cy + Math.sin(ang) * 0.25 * z], col, 0.3, z);
    }
    circle(x + 0.25 * z, yT - 4.05 * z, 0.6 * z, C('#d91f3a'));                           // Kirsche
    circle(x + 0.05 * z, yT - 4.25 * z, 0.2 * z, C('#ff9aa8'));
    kGlow(x, y, z, 14);
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
    K.scene([
      [-0.08, 0, () => iceHouse(K)],
      hangSign(K, (cx, cy, z) => miniCone(cx, cy, z), '#f06d98'),                        // Eiswaffel klein am Ausleger
      [0.36, -0.24, () => kTable(K, 0.36, -0.24, '#8fdcaa')],
    ]);
  };
})();
