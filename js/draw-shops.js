'use strict';
// ---------------------------------------------------------------------------
// Läden, Kultur und Plantagen (Block 30) – im Baukasten (draw-kit.js), vorn (+a) ist die Tür.
// Kleine Läden teilen sich ein Ladenhaus (Schaufenster, Markise, rundes Schild mit Symbol, Auslage vor der Tür);
// die großen haben je ein eigenes Bild. Farben fest je Laden (Marke, Block 32).
// ---------------------------------------------------------------------------
// Rundes Schild mit Symbol, das seitlich am Haus hängt
function kShopSign(K, a, b, up, icon, col) {
  const [x, y] = K.P(a, b, up), z = K.z;
  kLine(K, [x, y - 5.2 * z], [x, y - 7.5 * z], '#6b4f3a', 0.8);
  circle(x, y, 5.2 * z, C(col));
  circle(x, y, 4.3 * z, C('#fffaf0'));
  g.font = `${Math.max(1, 5.4 * z)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(icon, x, y + 0.3 * z);
}
function kFlowerBuckets(K, a, b) {
  const [x, y] = K.P(a, b), z = K.z;
  [[-4, 0], [0, 1.5], [4, 0]].forEach(([dx, dy], i) => {
    box(x + dx * z, y + dy * z, 1.8 * z, 0.9 * z, 3 * z, '#8a96a3', null, 0);
    for (let j = 0; j < 4; j++) circle(x + (dx + (j - 1.5) * 0.9) * z, y + (dy - 4 - (j % 2)) * z, 1.2 * z, C(FLOWER_COLS[(i + j) % FLOWER_COLS.length]));
  });
}
function kBookCart(K, a, b) {
  K.block({ a, b, ha: 0.1, hb: 0.2, h: 4, wall: '#8a5a3c', type: 'flat', roof: '#a0714d' });
  const [x, y] = K.P(a, b, 4), z = K.z;
  ['#e8604f', '#5f8fe8', '#58b36a', '#e9c46a', '#c3a8e6'].forEach((c, i) => { g.fillStyle = C(c); g.fillRect(x + (i - 2.5) * 1.3 * z, y - 3 * z, 1.1 * z, 3 * z); });
}
function kBalloons(K, a, b, now) {
  const [x, y] = K.P(a, b), z = K.z;
  ['#e8604f', '#5f8fe8', '#e9c46a'].forEach((c, i) => {
    const bx = x + (i - 1) * 3 * z + Math.sin(now / 900 + i) * 0.8 * z, by = y - (14 + i * 2) * z;
    kLine(K, [x, y], [bx, by + 2.4 * z], '#8a8f99', 0.4);
    ellipse(bx, by, 2 * z, 2.5 * z, C(c));
  });
}
function kPaperLanterns(K, B, n = 3) {
  const F = B.faces.front || B.faces.right;
  if (!F) return;
  for (let i = 0; i < n; i++) {
    const m = lerp(F.P, F.Q, 0.2 + i * 0.3), z = K.z, [x, y] = [m[0], m[1] - F.H * 0.55];
    ellipse(x, y, 1.6 * z, 2 * z, C('#e8604f'));
    kGlow(x, y, z, 12);
  }
}
// Auslage vor der Tür
function shopProps(K, kind, awn, now) {
  const parts = [];
  if (kind === 'tische') parts.push([0.36, -0.22, () => kTable(K, 0.36, -0.22, awn)]);
  else if (kind === 'blumen') parts.push([0.4, -0.15, () => kFlowerBuckets(K, 0.4, -0.15)]);
  else if (kind === 'kisten') parts.push([0.38, -0.25, () => { kCrate(K, 0.38, -0.3, '#c9955f'); kCrate(K, 0.4, -0.12, '#d9b27a'); const [x, y] = K.P(0.39, -0.21, 5); for (let i = 0; i < 4; i++) circle(x + (i - 1.5) * 1.6 * K.z, y - 1 * K.z, 1.2 * K.z, C(['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a'][i])); }]);
  else if (kind === 'buecher') parts.push([0.38, -0.2, () => kBookCart(K, 0.38, -0.2)]);
  else if (kind === 'bank') parts.push([0.38, -0.22, () => drawObjectAt('bank', K, 0.38, -0.22, 0.75, 1)]);
  else if (kind === 'zeitung') parts.push([0.38, -0.24, () => { K.block({ a: 0.38, b: -0.24, ha: 0.08, hb: 0.14, h: 6, wall: '#5f8fe8', type: 'flat', roof: '#fffaf0' }); }]);
  else if (kind === 'ballons') parts.push([0.38, -0.25, () => kBalloons(K, 0.38, -0.25, now)]);
  else if (kind === 'puppen') parts.push([0.38, -0.22, () => kFlowerBuckets(K, 0.38, -0.22)]);
  return parts;
}
// Kleines Ladenhaus (1×1): unten Schaufenster und Tür unter der Markise, oben zwei Fenster, Schild an der Ecke
function smallShopArt(id) {
  return (K, s, now, x, y, t) => {
    const S = SHOPS[id], [w0, r0, awn, props] = S.look, [wall, roof] = paint(t, w0, r0);
    const parts = [[-0.08, 0, () => {
      const B = K.block({ a: -0.08, b: 0, ha: 0.34, hb: 0.37, h: 20, wall, roof, roofH: 9, entry: true });
      const F = B.faces.front;
      if (F) { windowOn(F.P, F.Q, 0.1, 0.56, F.H * 0.08, F.H * 0.42, K.z); faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(DOOR_COL)); }
      kAwning(K, B, 'front', awn, 0.44, 0.56);
      K.wins(B, 'front', 2, 0.64, 0.86); K.sideWins(B, 2, 0.64, 0.86);
      if (!F) K.sideWins(B, 2, 0.12, 0.4);
      if (props === 'laternen') kPaperLanterns(K, B);
      if (props === 'uhr') { const [cx, cy] = K.P(0.3, 0.3, 26); circle(cx, cy, 3 * K.z, C('#e9c46a')); circle(cx, cy, 2.3 * K.z, C('#fffaf0')); }
    }]];
    // Schild an die Ecke, die man sieht (auch wenn die Tür nach hinten zeigt)
    const [sa, sb] = [[0.3, 0.42], [0.3, -0.42], [-0.44, 0.42], [-0.44, -0.42]].reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);
    parts.push([sa, sb, () => kShopSign(K, sa, sb, 16, S.icon, awn)]);
    K.scene(parts.concat(shopProps(K, props, awn, now)));
  };
}
// ---------------------------------------------------------------------------
// Marken (Block 32): Jeder Laden hat feste Farben und ein Wahrzeichen, an dem man ihn von weitem erkennt (Riesen-Becher
// auf dem Dach, Friseur-Säule, grünes Apothekenkreuz …). Die Bilder stehen je Gruppe in js/shopart/*.js und tragen sich
// in SHOP_ART ein; wer dort fehlt, bekommt das einfache Ladenhaus oben.
// ---------------------------------------------------------------------------
// Grundhaus eines kleinen Ladens (1×1) in festen Farben: Schaufenster und Tür unter der Markise, oben Fenster.
// spec: wall, roof, awning (Markisenfarbe; null = keine), roofType ('hip' | 'gable' | 'flat' | 'mansard' | 'barrel'),
// h (Wandhöhe in px), roofH, ridge ('a' | 'b' bei gable), shopWin (Farbe der Schaufenster-Rahmung, optional),
// upperWins (Fenster oben: Anzahl, 0 = keine). Gibt den Block zurück (B.faces.front/right/left/back, je { P, Q, H }).
function shopHouse(K, { wall, roof, awning = null, roofType = 'hip', h = 20, roofH = 9, ridge = null, ha = 0.34, hb = 0.37, a = -0.08, b = 0, upperWins = 2, trim = null }) {
  const B = K.block({ a, b, ha, hb, h, wall, roof, roofH, type: roofType, ridge, entry: true });
  const F = B.faces.front;
  if (F) {
    if (trim) faceQuad(F.P, F.Q, 0.06, 0.6, F.H * 0.05, F.H * 0.45, C(trim));                  // Rahmen ums Schaufenster
    windowOn(F.P, F.Q, 0.1, 0.56, F.H * 0.08, F.H * 0.42, K.z);
    faceQuad(F.P, F.Q, 0.64, 0.86, 0, F.H * 0.42, C(DOOR_COL));
  }
  if (awning) kAwning(K, B, 'front', awning, 0.44, 0.56);
  if (upperWins) { K.wins(B, 'front', upperWins, 0.64, 0.86); K.sideWins(B, upperWins, 0.64, 0.86); }
  if (!F) K.sideWins(B, 2, 0.12, 0.4);
  return B;
}
// Kleines Ausleger-Schild (Block 34): hängt an der Hausecke, die man sieht (in jeder Drehung), runde Tafel mit
// Mini-Symbol. draw(cx, cy, z) zeichnet das Symbol mittig bei (cx, cy) – es soll in einen Kreis mit Radius ≈ 4 × z passen.
// col: Rand/Halter in der Markenfarbe. Rückgabe: ein Teil für K.scene (nach dem Haus einsortieren).
function hangSign(K, draw, col, { up = 16, a0 = 0.3, b0 = 0.42, back = -0.44 } = {}) {
  const [sa, sb] = [[a0, b0], [a0, -b0], [back, b0], [back, -b0]].reduce((p, q) => K.depth(...q) > K.depth(...p) ? q : p);
  return [sa, sb, () => {
    const [x, y] = K.P(sa, sb, up), z = K.z;
    kLine(K, [x, y - 5.4 * z], [x, y - 8 * z], '#6b4f3a', 0.8);
    kLine(K, [x - 3 * z, y - 8 * z], [x + 3 * z, y - 8 * z], '#6b4f3a', 0.9);            // kleiner Querbalken
    circle(x, y, 5.4 * z, C(col));
    circle(x, y, 4.5 * z, C('#fffaf0'));
    draw(x, y, z);
  }];
}
// Aufrechter Text (Schriftzug, Buchstaben) mittig bei (x, y) – Größe in px × z
function kText(x, y, text, size, col, z, weight = 900) {
  g.font = `${weight} ${Math.max(1, size * z)}px Nunito, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = C(col); g.fillText(text, x, y);
}
// Punkt auf einer Seite: t (0 … 1 von P nach Q), in Höhe up (px, schon mit z)
const faceAt = (F, t, up) => { const m = lerp(F.P, F.Q, t); return [m[0], m[1] - up]; };
// Die Seite, die man sieht: Tür-Seite, sonst die rechte oder linke (für Schilder, die immer zu sehen sein sollen)
const shownFace = B => B.faces.front || B.faces.right || B.faces.left || B.faces.back;

// Großer Block mit Fensterreihen (Möbelhaus, Hotel, Kaufhaus …)
function kFloors(K, B, n, per, from = 0.1, to = 0.9) {
  for (let f = 0; f < n; f++) { const h0 = (f + 0.25) / n, h1 = (f + 0.75) / n; K.wins(B, 'front', per, h0, h1, from, to); K.sideWins(B, per, h0, h1); }
}
function kFlag(K, a, b, up, col) {
  const top = kPost(K, a, b, up + 10, '#8a8f99', 0.8), z = K.z;
  poly([[top[0], top[1]], [top[0] + 6 * z, top[1] + 1.5 * z], [top[0], top[1] + 3.5 * z]], C(col));
}
const SHOP_ART = {
  moebelhaus(K, s, now, x, y, t, ha, hb) {
    const [wall, roof] = paint(t, '#e9d3a8', '#8a5a3c');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 0.8, hb: 0.9, h: 20, wall, roof, roofH: 6, type: 'gable', ridge: 'b', entry: true });
      const F = B.faces.front;
      if (F) { windowOn(F.P, F.Q, 0.08, 0.4, F.H * 0.1, F.H * 0.6, K.z); windowOn(F.P, F.Q, 0.6, 0.92, F.H * 0.1, F.H * 0.6, K.z); faceQuad(F.P, F.Q, 0.43, 0.57, 0, F.H * 0.5, C(DOOR_COL)); }
      K.sideWins(B, 3, 0.35, 0.7);
    }], [0.8, 0.5, () => { K.block({ a: 0.8, b: 0.5, ha: 0.14, hb: 0.3, h: 3, wall: '#e8604f', type: 'flat', roof: '#f28c7a' }); K.block({ a: 0.72, b: 0.5, ha: 0.06, hb: 0.3, h: 6, wall: '#e8604f', type: 'flat', roof: '#f28c7a' }); }],
      [0.6, -0.9, () => kShopSign(K, 0.6, -0.9, 18, '🛋️', '#efcf8a')]]);
  },
  kino(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#3e3e4a', '#e8604f'), lit = night > 0.15 && isLive();
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 0.8, hb: 0.85, h: 24, wall, roof, roofH: 3, type: 'flat', entry: true });
      const F = B.faces.front;
      if (F) {
        faceQuad(F.P, F.Q, 0.02, 0.98, F.H * 0.42, F.H * 0.6, C('#ffd23f'));                 // Leuchtband
        for (let i = 0; i < 10; i++) { const m = lerp(F.P, F.Q, 0.05 + i * 0.1); circle(m[0], m[1] - F.H * 0.51, 0.9 * K.z, lit || (Math.floor(now / 300) + i) % 2 ? '#fff6c0' : C('#e8604f')); }
        faceQuad(F.P, F.Q, 0.35, 0.65, 0, F.H * 0.36, C('#8a5a3c'));
        for (const [a0, a1] of [[0.08, 0.28], [0.72, 0.92]]) faceQuad(F.P, F.Q, a0, a1, F.H * 0.08, F.H * 0.36, C('#e8604f'));   // Plakate
        const m = lerp(F.P, F.Q, 0.5); g.font = `${Math.max(1, 5 * K.z)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🎬', m[0], m[1] - F.H * 0.78);
        kGlow(m[0], m[1] - F.H * 0.5, K.z, 40);
      }
      K.sideWins(B, 2, 0.7, 0.88);
    }]]);
  },
  hotel(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#fff6e4', '#5f8fe8');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.05, b: 0, ha: 0.75, hb: 0.85, h: 42, wall, roof, roofH: 8, type: 'mansard', entry: true });
      kFloors(K, B, 5, 4);
      K.door(B, 'front', 0.4, 0.6, 0.14, '#6b4a2e');
      kAwning(K, B, 'front', '#5f8fe8', 0.13, 0.19);
    }], [0.8, -0.7, () => kFlag(K, 0.8, -0.7, 20, '#e8604f')], [0.8, 0.7, () => kFlag(K, 0.8, 0.7, 20, '#5f8fe8')],
      [0.75, 0, () => kShopSign(K, 0.75, 0, 50, '🏨', '#93c2e0')]]);
  },
  markthalle(K, s, now, x, y, t, ha, hb) {
    const [wall, roof] = paint(t, '#e6d8bd', '#7fa39a');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 0.75, hb: 1.35, h: 16, wall, roof, roofH: 12, type: 'barrel', entry: true });
      const F = B.faces.front;
      if (F) for (const [t0, t1] of [[0.08, 0.3], [0.39, 0.61], [0.7, 0.92]]) windowOn(F.P, F.Q, t0, t1, F.H * 0.12, F.H * 0.8, K.z);
      K.door(B, 'front', 0.44, 0.56, 0.6, '#6b4a2e');
      K.sideWins(B, 4, 0.3, 0.8);
    }], ...[-1, 1].map(b => [0.85, b * 0.9, () => kStall(K, 0.85, b * 0.9, b < 0 ? '#e39a8c' : '#9fcf8f', b + 1)])]);
  },
  kaufhaus(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#f5f0e6', '#3e7fd0');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 1.3, hb: 1.35, h: 44, wall, roof, roofH: 5, type: 'flat', entry: true });
      const F = B.faces.front;
      if (F) for (let f = 0; f < 4; f++) windowOn(F.P, F.Q, 0.06, 0.94, F.H * (f * 0.25 + 0.05), F.H * (f * 0.25 + 0.2), K.z);   // Glasbänder
      K.sideWins(B, 5, 0.2, 0.9);
      kAwning(K, B, 'front', '#e8604f', 0.24, 0.3);
      K.door(B, 'front', 0.42, 0.58, 0.2, '#3e3e4a');
    }], [-0.1, 0, () => { const [px, py] = K.P(-0.1, 0, 52); g.font = `${Math.max(1, 9 * K.z)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🏬', px, py); }],
      ...[-1.2, 0, 1.2].map((b, i) => [1.3, b, () => kFlag(K, 1.3, b, 30, ['#e8604f', '#e9c46a', '#5f8fe8'][i])])]);
  },
  passage(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#fff6e4', '#c9735a');
    const row = side => () => {
      const B = K.block({ a: -0.05, b: side * 1.45, ha: 0.9, hb: 0.5, h: 20, wall, roof, roofH: 7, type: 'gable', ridge: 'a' });
      K.wins(B, side < 0 ? 'right' : 'left', 4, 0.12, 0.45); K.wins(B, side < 0 ? 'right' : 'left', 4, 0.6, 0.85); K.wins(B, 'front', 1, 0.15, 0.8);
    };
    K.scene([[0, -1.45, row(-1)], [0, 1.45, row(1)], [0, 0, () => {
      g.save(); g.globalAlpha *= 0.62;
      K.block({ a: -0.05, b: 0, ha: 0.95, hb: 0.95, h: 1, lift: 20, wall: '#8a96a3', roof: '#cfeaf2', roofH: 10, type: 'barrel' });
      g.restore();
    }], [0.95, 0, () => kShopSign(K, 0.95, 0, 26, '🛍️', '#c9735a')]]);
  },
  theater(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#f3e3cc', '#9c4f3a');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.2, b: 0, ha: 1.1, hb: 1.2, h: 32, wall, roof, roofH: 14, type: 'gable', ridge: 'a', entry: true });
      kColumns(B, 'front', 6, K.z, '#fffaf0', 0.8);
      K.door(B, 'front', 0.44, 0.56, 0.4, '#9c2f2a');
      K.sideWins(B, 3, 0.4, 0.75);
    }], [1.1, 0, () => kShopSign(K, 1.1, 0, 30, '🎭', '#e8604f')]]);
  },
  museum(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#efe9dc', '#7fa39a');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 1.2, hb: 1.3, h: 24, wall, roof, roofH: 6, type: 'flat', entry: true });
      kColumns(B, 'front', 8, K.z, '#fffaf0', 0.9);
      K.door(B, 'front', 0.45, 0.55, 0.5, '#6b4a2e');
      K.sideWins(B, 3, 0.35, 0.7);
      kDome(K, -0.1, 0, 24, 22, '#cfe3de');
    }]]);
  },
  konzerthalle(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#ffffff', '#93c2e0');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 1.2, hb: 1.3, h: 22, wall, roof: null, type: 'flat', entry: true });
      const F = B.faces.front;
      if (F) windowOn(F.P, F.Q, 0.05, 0.95, F.H * 0.1, F.H * 0.9, K.z);
      K.sideWins(B, 4, 0.2, 0.8);
      for (let i = 0; i < 3; i++) K.block({ a: -0.6 + i * 0.5, b: 0, ha: 0.3, hb: 1.2, h: 0.5, lift: 22 + [4, 10, 6][i], wall: roof, roof, roofH: 6 - i, type: 'barrel' });   // Wellen-Dach
    }], [1.2, 0, () => kShopSign(K, 1.2, 0, 26, '🎵', '#5f8fe8')]]);
  },
  aquarium(K, s, now, x, y, t) {
    const [wall] = paint(t, '#e4f1ff', '#3e7fd0');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 1.2, hb: 1.3, h: 12, wall, roof: null, type: 'flat', entry: true });
      K.door(B, 'front', 0.42, 0.58, 0.7, '#3e7fd0');
      const [cx, cy] = K.P(-0.1, 0, 12), z = K.z;
      g.save(); g.globalAlpha *= 0.75;
      g.beginPath(); g.ellipse(cx, cy, 34 * z, 34 * z, 0, Math.PI, 0); g.fillStyle = '#7fc4e6'; g.fill();
      g.restore();
      for (let i = 0; i < 5; i++) {                                                         // Fische ziehen ihre Kreise
        const a = now / 2400 + i * 1.3, fx = cx + Math.cos(a) * (10 + i * 4) * z, fy = cy - (8 + i * 4) * z + Math.sin(a * 2) * 2 * z;
        ellipse(fx, fy, 2.4 * z, 1.3 * z, C(['#ff9f5a', '#ffd23f', '#e8604f', '#c3a8e6', '#9fcf8f'][i]));
      }
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1 * z;
      g.beginPath(); g.ellipse(cx, cy, 34 * z, 34 * z, 0, Math.PI, 0); g.stroke();
      kGlow(cx, cy - 16 * z, z, 50);
    }]]);
  },
  zoo(K, s, now, x, y, t) {
    const parts = [];
    if (groundPart(() => { K.rect(-1.9, -1.9, 1.9, 1.9, C('#b8d98a')); K.rect(-1.6, 0.2, -0.2, 1.6, C('#7fc4e6')); K.rect(0.3, -1.6, 1.6, -0.3, C('#e0c48f')); })) return;
    for (let i = 0; i < 16; i++) { const a = -1.9 + (i % 8) * 0.54, b = i < 8 ? -1.9 : 1.9; parts.push([a, b, () => kPost(K, a, b, 5, '#8a5a3c', 1)]); }
    parts.push([-0.9, -1, () => kitBush(K, -0.9, -1, 1.4, '#4f9e4a')], [1, 1, () => kitBush(K, 1, 1, 1.5, '#5aae54')]);
    parts.push([0.9, -0.9, () => {                                                            // Giraffe
      const [gx, gy] = K.P(0.9, -0.9), z = K.z, nod = Math.sin(now / 1100) * 1.5 * z;
      for (const d of [-2, 2]) kLine(K, [gx + d * z, gy], [gx + d * z, gy - 9 * z], '#d9a441', 1.2);
      ellipse(gx, gy - 11 * z, 5 * z, 3 * z, C('#e9b44c'));
      kLine(K, [gx + 3 * z, gy - 12 * z], [gx + 6 * z, gy - 24 * z + nod], '#e9b44c', 2.2);
      ellipse(gx + 7 * z, gy - 25 * z + nod, 2.6 * z, 1.6 * z, C('#e9b44c'));
      for (const [dx, dy] of [[-1, -11], [1.5, -10.5], [4.3, -17]]) circle(gx + dx * z, gy + dy * z, 0.8 * z, C('#a0714d'));
    }]);
    parts.push([-0.9, 0.9, () => { const [ex, ey] = K.P(-0.2, 0.9), z = K.z; ellipse(ex, ey - 6 * z, 6 * z, 4.5 * z, C('#9aa3ad')); circle(ex + 5 * z, ey - 7 * z, 3 * z, C('#9aa3ad')); kLine(K, [ex + 7 * z, ey - 6 * z], [ex + 8 * z, ey - 1 * z], '#9aa3ad', 1.4); }]);   // Elefant am Teich
    parts.push([1.8, 0, () => { const B = K.block({ a: 1.6, b: 0, ha: 0.25, hb: 0.5, h: 12, wall: '#e9d3a8', roof: '#58b36a', roofH: 7, entry: true }); K.door(B, 'front', 0.35, 0.65, 0.6); kShopSign(K, 1.85, 0.6, 16, '🦒', '#58b36a'); }]);
    K.scene(parts);
  },
  stadion(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#dcd6ca', '#e8604f');
    if (groundPart(() => { K.oval(0, 0, 1.5, C('#6fbf5a')); K.rect(-0.9, -0.5, 0.9, 0.5, C('#7ccf66')); })) return;
    const parts = [];
    for (let i = 0; i < 16; i++) {                                                          // Tribünen im Rund
      const ang = i / 16 * Math.PI * 2, a = Math.cos(ang) * 1.95, b = Math.sin(ang) * 1.95;
      parts.push([a, b, () => K.block({ a, b, ha: 0.42, hb: 0.42, h: 12, wall: i % 2 ? wall : shade(wall, -0.06), roof: i % 3 ? roof : '#ffffff', roofH: 3, type: 'flat' })]);
    }
    for (const [a, b] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) parts.push([a, b, () => { const top = kPost(K, a, b, 34, '#8a8f99', 1.4); box(top[0], top[1], 3 * K.z, 1.5 * K.z, 3 * K.z, '#fffaf0', null, 0); kGlow(top[0], top[1] - 2 * K.z, K.z, 40); }]);
    K.scene(parts);
  },
  grandhotel(K, s, now, x, y, t) {
    const [wall, roof] = paint(t, '#f5f0e6', '#7fa39a');
    K.scene([[0, 0, () => {
      const B = K.block({ a: -0.1, b: 0, ha: 1.15, hb: 1.3, h: 40, wall, roof, roofH: 10, type: 'mansard', entry: true });
      kFloors(K, B, 5, 6);
      K.door(B, 'front', 0.42, 0.58, 0.14, '#6b4a2e');
      kAwning(K, B, 'front', '#e9c46a', 0.13, 0.19);
    }], ...[-1.2, 1.2].map(b => [-0.1, b, () => K.block({ a: -0.1, b, ha: 0.28, hb: 0.28, h: 52, wall, roof, roofH: 14 })]),
      [1.15, 0, () => kShopSign(K, 1.15, 0, 46, '🏩', '#e9c46a')]]);
  },
  // Plantagen: Reihen von Sträuchern bzw. Bäumchen
  kaffeeplantage(K, s, now, x, y) { plantRows(K, '#3f7d3a', '#c0392b', 3); },
  teegarten(K, s, now, x, y) { plantRows(K, '#7cc46a', null, 4); },
  kakaoplantage(K, s, now, x, y) { plantRows(K, '#4f8f3a', '#e9a23b', 2); },
};
function plantRows(K, leaf, fruit, rows) {
  if (groundPart(() => K.rect(-0.46, -0.46, 0.46, 0.46, C('#a8764c')))) return;
  const parts = [];
  for (let r = 0; r < rows; r++) for (let j = 0; j < 3; j++) {
    const a = -0.32 + r * (0.64 / Math.max(1, rows - 1)), b = -0.3 + j * 0.3;
    parts.push([a, b, () => {
      const [px, py] = K.P(a, b), z = K.z;
      circle(px, py - 4 * z, (rows > 3 ? 3 : 3.8) * z, C(leaf)); circle(px - 1 * z, py - 5.5 * z, 2 * z, C(shade(leaf, 0.15)));
      if (fruit) { circle(px + 1.5 * z, py - 3 * z, 0.9 * z, C(fruit)); circle(px - 1.8 * z, py - 2.5 * z, 0.9 * z, C(fruit)); }
    }]);
  }
  K.scene(parts);
}
// erst beim Zeichnen nachsehen: die Gruppen-Dateien (js/shopart/*.js) laden danach und tragen sich in SHOP_ART ein
const SMALL_SHOP = {};
for (const id of Object.keys(SHOPS)) BUILDING_ART[id] = (...args) => (SHOP_ART[id] || SMALL_SHOP[id] || (SMALL_SHOP[id] = smallShopArt(id)))(...args);
for (const id of ['kaffeeplantage', 'teegarten', 'kakaoplantage']) BUILDING_ART[id] = SHOP_ART[id];
// Läden haben feste Markenfarben (man soll sie erkennen) – nicht umfärbbar
for (const id of ['zoo', 'stadion', 'kaffeeplantage', 'teegarten', 'kakaoplantage']) GROUND_TYPES.add(id);   // haben flache Teile (groundPart)
