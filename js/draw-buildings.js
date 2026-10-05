'use strict';
// ---------------------------------------------------------------------------
// Betriebe und Bildungsbauten in drei Stufen (BUILD_STAGES), alle in vier Richtungen (Baukasten in draw-kit.js).
// Jede Zeichnung bekommt den gedrehten Rahmen K, die Stufe s (1–3) und die halben Maße ha (Tiefe) und hb (Breite).
// Vorn (+a) ist die Seite mit der Tür.
// ---------------------------------------------------------------------------
const WOOD = '#c98d5c', WOOD_D = '#7a4f2a', STONE = '#dcd6ca', STONE_D = '#8a8f99';
// sanfte Akzentfarben (Stände, Schirme, Markisen, Kuppeln) – nicht grell
const SOFT = { red: '#e39a8c', blue: '#93c2e0', yellow: '#efcf8a', green: '#9fcf8f', purple: '#c3a8e6', pink: '#eeb3c6' };

// Wand- und Dachfarbe: selbst gewählt (t.wall/t.roof aus WALLS/ROOFS, wie bei Häusern) oder die des Gebäudes
function paint(t, wall, roof) { return [t && t.wall != null ? WALLS[t.wall] : wall, t && t.roof != null ? ROOFS[t.roof] : roof]; }

// --- kleine Teile ---
function kCrate(K, a, b, col = '#c9955f', s = 1, up = 0) {
  const B = K.block({ a, b, ha: 0.055 * s, hb: 0.055 * s, h: 4.5 * s, lift: up, wall: col, type: 'flat' });
  for (const F of Object.values(B.faces)) if (F) faceQuad(F.P, F.Q, 0.1, 0.9, F.H * 0.45, F.H * 0.55, C(shade(col, -0.25)));
}
function kBarrel(K, a, b, col = '#a0714d') {
  const [x, y] = K.P(a, b), z = K.z;
  g.fillStyle = C(col); g.fillRect(x - 2.4 * z, y - 6 * z, 4.8 * z, 6 * z);
  ellipse(x, y, 2.4 * z, 1.2 * z, C(col));
  ellipse(x, y - 6 * z, 2.4 * z, 1.2 * z, C(shade(col, 0.2)));
  g.fillStyle = C('#5f4632'); g.fillRect(x - 2.4 * z, y - 1.8 * z, 4.8 * z, 0.7 * z); g.fillRect(x - 2.4 * z, y - 4.6 * z, 4.8 * z, 0.7 * z);
}
function kSack(K, a, b) { const [x, y] = K.P(a, b), z = K.z; ellipse(x, y - 2.4 * z, 2.4 * z, 3 * z, C('#e9d8b4')); circle(x, y - 5.4 * z, 1 * z, C('#c9b183')); }
function kLogs(K, a, b, n = 3) {
  const [x, y] = K.P(a, b), z = K.z;
  for (const [ox, oy] of [[0, 0], [5, -1.5], [2.5, -4], [7.5, -3.5], [-2.5, -3.5], [5, -6.5]].slice(0, n)) {
    ellipse(x + (ox - 3) * z, y + oy * z, 3.2 * z, 2.4 * z, C('#b57b4a'));
    ellipse(x + (ox - 5.4) * z, y + oy * z, 1.3 * z, 2.2 * z, C('#ecd1a4'));
  }
}
function kPlanks(K, a, b, n = 3) {           // Bretterstapel
  for (let i = 0; i < n; i++) K.block({ a, b, ha: 0.08, hb: 0.16, h: 1.6, lift: i * 1.7, wall: i & 1 ? '#e3b57f' : '#d9a36a', type: 'flat' });
}
function kBlocks(K, a, b, n = 3) {           // Steinquader
  const spots = [[0, 0, 0], [0.12, 0.04, 0], [0.05, 0.02, 4.5]].slice(0, n);
  for (const [da, db, up] of spots) kCrate(K, a + da, b + db, STONE, 1.1, up);
}
function kUmbrella(K, a, b, col, hgt = 15) {
  const [x, y] = K.P(a, b), z = K.z;
  g.strokeStyle = C('#8a6a4a'); g.lineWidth = 1.2 * z;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - hgt * z); g.stroke();
  const t = y - hgt * z;
  poly([[x - 10 * z, t + 3 * z], [x, t - 4 * z], [x + 10 * z, t + 3 * z], [x, t + 7 * z]], C(col));
  poly([[x, t - 4 * z], [x + 10 * z, t + 3 * z], [x, t + 7 * z]], C(shade(col, -0.15)));
  poly([[x - 3.6 * z, t - 1.6 * z], [x, t - 4 * z], [x + 3.6 * z, t - 1.6 * z], [x, t + 0.4 * z]], C('#ffffff'));
}
function kTable(K, a, b, col) { kUmbrella(K, a, b, col, 13); const [x, y] = K.P(a, b); ellipse(x, y - 5 * K.z, 5 * K.z, 2.2 * K.z, C('#fff6e4')); }
function kStall(K, a, b, col, i, wall = '#f5e1b8') {
  const B = K.block({ a, b, ha: 0.2, hb: 0.3, h: 10, wall, roof: col, roofH: 8, over: 1.25 });
  const F = B.faces.front || B.faces.right || B.faces.left;
  const fruit = ['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a', '#c77dff'];
  if (F) for (let j = 0; j < 5; j++) { const m = lerp(F.P, F.Q, 0.14 + j * 0.18); circle(m[0], m[1] - F.H * 0.5, 2 * K.z, C(fruit[(j + i) % 5])); }
}
// Markise: gestreiftes Dach über der Tür-Seite
function kAwning(K, B, side, col, h0 = 0.62, h1 = 0.8) {
  const F = B.faces[side];
  if (!F) return;
  for (let i = 0; i < 8; i++) faceQuad(F.P, F.Q, 0.06 + i * 0.11, 0.17 + i * 0.11, F.H * h0, F.H * h1, C(i & 1 ? '#fbf2e2' : col));
  faceQuad(F.P, F.Q, 0.06, 0.94, F.H * h0 - 1 * K.z, F.H * h0, C(shade(col, -0.2)));
}
// Säulen vor einer Seite
function kColumns(B, side, n, z, col = '#fbf5ea', h1 = 1) {
  const F = B.faces[side];
  if (!F) return;
  for (let i = 0; i < n; i++) { const t0 = 0.08 + i * (0.84 / (n - 1)) - 0.03; faceQuad(F.P, F.Q, t0, t0 + 0.06, 0, F.H * h1, C(col)); }
}
function kDome(K, a, b, up, r, col) {
  const [x, y] = K.P(a, b, up), z = K.z;
  ellipse(x, y, r * z, r * 0.5 * z, C(shade(col, -0.15)));
  g.beginPath(); g.ellipse(x, y, r * z, r * z, 0, Math.PI, 0); g.fillStyle = C(col); g.fill();
  ellipse(x - r * 0.35 * z, y - r * 0.55 * z, r * 0.25 * z, r * 0.16 * z, C(shade(col, 0.35)));
  return [x, y - r * z];
}
// Kuppel auf einem runden Sockel (Tambour) der Höhe h; ohne Sockel wie kDome
function kDrum(K, a, b, up, r, h, col, drumCol) {
  if (h > 0) { const [x, y] = K.P(a, b, up); cyl(x, y, r * 0.88 * K.z, r * 0.44 * K.z, h * K.z, drumCol); }
  return kDome(K, a, b, up + h, r, col);
}
function kSign(K, a, b, col, draw) {           // Schild auf einem Pfosten
  const [x, y] = K.P(a, b), z = K.z;
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.2 * z;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 13 * z); g.stroke();
  g.fillStyle = C(col); g.beginPath(); g.roundRect(x - 5 * z, y - 19 * z, 10 * z, 7 * z, 1.5 * z); g.fill();
  if (draw) draw(x, y - 15.5 * z, z);
}
function kBunting(K, a0, b0, a1, b1, up) {
  const p0 = K.P(a0, b0, up), p1 = K.P(a1, b1, up), z = K.z;
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.6 * z;
  g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 4 * z, ...p1); g.stroke();
  const cols = ['#e8705f', '#ffd23f', '#5f8fe8', '#58b36a', '#f28cb1'];
  for (let i = 1; i < 8; i++) {
    const t = i / 8, m = lerp(p0, p1, t), sag = 4 * z * 4 * t * (1 - t) * 0.5 + 0;
    poly([[m[0] - 1.6 * z, m[1] + sag], [m[0] + 1.6 * z, m[1] + sag], [m[0], m[1] + sag + 3.4 * z]], C(cols[i % 5]));
  }
}
function kPost(K, a, b, hgt, col = '#6b4f3a', w = 1.2) {
  const [x, y] = K.P(a, b), z = K.z;
  g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - hgt * z); g.stroke();
  return [x, y - hgt * z];
}
function kLine(K, p, q, col = '#6b4f3a', w = 1) { g.strokeStyle = C(col); g.lineWidth = w * K.z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
function kStatue(K, a, b, col = '#e5dccb') {
  K.block({ a, b, ha: 0.05, hb: 0.05, h: 5, wall: STONE, type: 'flat' });
  const [x, y] = K.P(a, b, 5), z = K.z;
  ellipse(x, y - 4 * z, 2.2 * z, 4 * z, C(col));
  circle(x, y - 9 * z, 1.8 * z, C(col));
}
function kGlow(x, y, z, r = 14) { glowQuad([[x - 2, y - 2], [x + 2, y - 2], [x + 2, y + 2], [x - 2, y + 2]], r * z); }
function kBoat(K, a, b, now, big) {
  const [x, y] = K.P(a, b), z = K.z, bob = Math.sin(now / 700 + a) * 1.1 * z;
  ellipse(x, y + 2 * z + bob, (big ? 16 : 10) * z, (big ? 5 : 3.6) * z, C(big ? '#8b5a3c' : '#e8604f'));
  if (big) {
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.3 * z;
    g.beginPath(); g.moveTo(x, y + bob); g.lineTo(x, y - 30 * z + bob); g.stroke();
    poly([[x + 1 * z, y - 28 * z + bob], [x + 13 * z, y - 6 * z + bob], [x + 1 * z, y - 4 * z + bob]], C('#fffaf0'));
    poly([[x - 1 * z, y - 24 * z + bob], [x - 10 * z, y - 6 * z + bob], [x - 1 * z, y - 5 * z + bob]], C('#f5ecdc'));
  } else box(x - 1 * z, y - 1 * z + bob, 3.4 * z, 1.7 * z, 5 * z, '#ffffff', '#3e8ed0', 3 * z);
}
// Wo liegt Wasser? (erste Seite der Grundfläche mit Wasser daneben, im eigenen Rahmen)
function waterSide(K, x, y, t, b) {
  const [w, h] = sizeOf(b, t && t.rot, t);
  for (const [dx, dy] of FRONT_DIR) {
    const side = dx ? Array.from({ length: h }, (_, j) => [dx > 0 ? x + w : x - 1, y + j]) : Array.from({ length: w }, (_, i) => [x + i, dy > 0 ? y + h : y - 1]);
    if (side.some(([sx, sy]) => terrainAt(sx, sy) === 'water')) return K.local(dx, dy);
  }
  return [0, 1];
}

// --- Betriebe ---
const BUILDING_ART = {
  feld(K, s, now, x, y) {
    if (groundPart(() => K.rect(-0.39, -0.39, 0.39, 0.39, C(s === 1 ? '#a8764c' : '#b8885a')))) return;
    const parts = [];
    if (s >= 2) parts.push([-0.3, -0.3, () => {         // Vogelscheuche
      const [px, py] = kPost(K, -0.3, -0.3, 15), z = K.z;
      kLine(K, [px - 5 * z, py + 4 * z], [px + 5 * z, py + 4 * z], '#6b4f3a', 1.2);
      ellipse(px, py + 8 * z, 3 * z, 4 * z, C('#e8705f'));
      circle(px, py, 2.4 * z, C('#f4d7a1'));
      poly([[px - 4 * z, py - 1 * z], [px + 4 * z, py - 1 * z], [px, py - 5 * z]], C('#c9a25a'));
    }]);
    parts.push([0, 0, () => {
      const z = K.z;
      g.lineCap = 'round';
      for (let sum = -4; sum <= 4; sum++) for (let i = -2; i <= 2; i++) {
        const j = sum - i;
        if (j < -2 || j > 2) continue;
        if (s >= 2 && i === -2 && j === -2) continue;
        const [bx, by] = K.P(i * 0.14, j * 0.14);
        if (s === 1) { circle(bx - 1.5 * z, by - 1.5 * z, 1.5 * z, C('#62b85a')); circle(bx + 1.5 * z, by - 1.2 * z, 1.3 * z, C('#7ccf5b')); continue; }
        const th = (s === 3 ? 8.5 : 7) * z, sw = Math.sin(now / 700 + i * 0.7 + j) * 1.2 * z;
        g.strokeStyle = C(s === 3 ? '#f2c14e' : '#e9b93f'); g.lineWidth = 1.7 * z;
        g.beginPath();
        g.moveTo(bx - 1.5 * z, by); g.lineTo(bx - 1.5 * z + sw, by - th);
        g.moveTo(bx + 1.5 * z, by); g.lineTo(bx + 1.5 * z + sw, by - th * 0.85);
        g.stroke();
      }
    }]);
    if (s === 3) {
      parts.push([0.36, -0.34, () => haystack(K, 0.36, -0.34)], [0.36, 0.34, () => haystack(K, 0.36, 0.34)]);
      parts.push([-0.44, 0, () => kitFence(K, -0.44, -0.44, -0.44, 0.44, '#e3c9a0', 7)], [0, -0.44, () => kitFence(K, -0.44, -0.44, 0.44, -0.44, '#e3c9a0', 7)]);
    }
    K.scene(parts);
  },
  muehle(K, s, now, x, y, t) {
    const H = [0, 20, 25, 31][s], w = [0, 0.16, 0.18, 0.2][s];
    kShadow(K, 0.3);
    if (s === 3) { K.oval(0, 0, 0.36, C('#86c35b')); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; const [fx, fy] = K.P(Math.cos(an) * 0.33, Math.sin(an) * 0.33); circle(fx, fy - 1 * K.z, 1.6 * K.z, C(FLOWER_COLS[i % 5])); } }
    const len = [0, 13, 15, 18][s];
    const hub = K.P(w + 0.02, 0, H * 0.84);
    const sails = () => blades(hub[0], hub[1], K.z, now, 4, len * K.z, s === 1 ? '#e9d3ad' : '#f7ecd8');
    const front = K.facing(1, 0) > 0;
    if (!front) sails();
    const [wall, roof] = paint(t, s === 1 ? WOOD : '#fff6e4', s === 1 ? WOOD_D : '#c65a45'), roofH = s === 1 ? 9 : 12;
    if (s < 3) {
      const B = K.block({ ha: w, hb: w, h: H, wall, roof, roofH, entry: true });
      K.door(B, 'front', 0.36, 0.64, 0.4);
      K.sideWins(B, 1, 0.55, 0.75);
    } else {                                              // große Mühle: unten, Galerie rundum, oben
      const lo = H * 0.45;
      const B = K.block({ ha: w + 0.02, hb: w + 0.02, h: lo, wall, type: 'none', entry: true });
      K.door(B, 'front', 0.36, 0.64, 0.8);
      K.sideWins(B, 1, 0.3, 0.7);
      const G = K.block({ ha: w + 0.08, hb: w + 0.08, h: 1.4, lift: lo, wall: '#8a5a3c', type: 'flat', roof: '#a57645' });
      const rail = () => { for (const F of Object.values(G.faces)) if (F) for (let i = 0; i <= 5; i++) { const m = lerp(F.P, F.Q, i / 5); kLine(K, [m[0], m[1] - 1.4 * K.z], [m[0], m[1] - 5 * K.z], '#6b4f3a', 0.7); } };
      const U = K.block({ ha: w, hb: w, h: H - lo, lift: lo + 1.4, wall, roof, roofH });
      K.sideWins(U, 1, 0.3, 0.7);
      rail();
    }
    if (front) sails();
    if (s >= 2) K.scene([[w + 0.14, -0.2, () => kSack(K, w + 0.14, -0.2)], [w + 0.2, -0.12, () => kSack(K, w + 0.2, -0.12)]]);
  },
  holz(K, s, now, x, y, t) {
    const parts = [
      [-0.3, -0.26, () => kitTree(K, -0.3, -0.26, 0.95)],
      [-0.26, 0.28, () => kitTree(K, -0.26, 0.28, 0.9)],
    ];
    if (s === 3) parts.push([0.05, -0.36, () => kitTree(K, 0.05, -0.36, 0.8)]);
    const [hw, hr] = paint(t, WOOD, s === 3 ? '#4f8a4a' : WOOD_D);
    const hut = s === 1 ? { a: 0.1, b: 0.08, ha: 0.15, hb: 0.15, h: 9, wall: hw, roof: hr, roofH: 8 }
      : { a: 0.08, b: 0.06, ha: 0.17, hb: 0.23, h: s === 3 ? 13 : 11, wall: hw, roof: hr, roofH: 10, ridge: 'b' };
    parts.push([hut.a, hut.b, () => {
      const B = K.block({ ...hut, entry: true });
      if (s === 3) timber(B, K.z, '#6b4a2e');
      K.door(B, 'front', 0.4, 0.6, 0.66);
      K.sideWins(B, 1, 0.38, 0.72);
      if (s === 3) { const [ax, ay] = K.P(hut.a + hut.ha, hut.b, hut.h + 3); poly([[ax - 3 * K.z, ay], [ax, ay - 3 * K.z], [ax + 3 * K.z, ay]], C('#f4e3c4')); }
    }]);
    parts.push([0.32, 0.28, () => kLogs(K, 0.34, 0.3, s + 2)]);
    if (s >= 2) parts.push([0.36, -0.26, () => {         // Hackklotz mit Axt
      const [bx, by] = K.P(0.36, -0.26), z = K.z;
      g.fillStyle = C('#b57b4a'); g.fillRect(bx - 2.6 * z, by - 4 * z, 5.2 * z, 4 * z);
      ellipse(bx, by - 4 * z, 2.6 * z, 1.2 * z, C('#ecd1a4'));
      kLine(K, [bx, by - 4 * z], [bx + 3 * z, by - 10 * z], '#8a5a3c', 1);
      poly([[bx + 2 * z, by - 11 * z], [bx + 5 * z, by - 10 * z], [bx + 4 * z, by - 8 * z]], C('#c7cad2'));
    }]);
    if (s === 3) for (let i = 0; i < 3; i++) parts.push([0.34, 0.02 + i * 0.09 - 0.1, () => kitBush(K, 0.36, -0.08 + i * 0.09, 0.35, '#7ccf5b')]);
    K.scene(parts);
  },
  fischer(K, s, now, x, y, t) {
    const big = s === 3;
    const hut = big ? { ha: 0.18, hb: 0.24, h: 13, roofH: 11 } : { ha: 0.15, hb: 0.17, h: 10 + s, roofH: 9 };
    const parts = [[-0.06, 0, () => {
      kShadow(K, 0.26);
      const [wall, roof] = paint(t, '#eef8ff', '#3e8ed0');
      const B = K.block({ a: -0.06, b: 0, ...hut, wall, roof, entry: true });
      K.door(B, 'front', 0.38, 0.62, 0.66);
      K.sideWins(B, 1, 0.38, 0.72);
      if (big) kitChimney(K, -0.12, 0.12, hut.h + 6, now, '#8a8f99');
    }]];
    // Angel
    parts.push([0.3, 0.3, () => {
      const p = K.P(0.24, 0.26, 4), q = K.P(0.46, 0.44, 20), z = K.z;
      kLine(K, p, q, '#6b4f3a', 1.2);
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.5 * z;
      g.beginPath(); g.moveTo(...q); g.lineTo(q[0] + 2 * z, q[1] + 16 * z); g.stroke();
      circle(q[0] + 2 * z, q[1] + 16 * z + Math.sin(now / 400) * 0.8 * z, 1.5 * z, C('#ff5a4f'));
    }]);
    if (s >= 2) parts.push([0.2, -0.3, () => {         // Netz zum Trocknen
      const p0 = kPost(K, 0.1, -0.36, 11), p1 = kPost(K, 0.34, -0.36, 11);
      g.strokeStyle = C('#8fa3b8'); g.lineWidth = 0.6 * K.z;
      g.beginPath();
      for (let i = 0; i <= 4; i++) { const m = lerp(p0, p1, i / 4); g.moveTo(m[0], m[1]); g.lineTo(m[0] + 1 * K.z, m[1] + 7 * K.z); }
      g.moveTo(p0[0], p0[1] + 3 * K.z); g.lineTo(p1[0], p1[1] + 3 * K.z); g.moveTo(p0[0], p0[1] + 6 * K.z); g.lineTo(p1[0], p1[1] + 6 * K.z);
      g.stroke();
      kLine(K, p0, p1, '#6b4f3a', 1);
    }], [0.3, 0.05, () => kBarrel(K, 0.3, 0.02)]);
    if (big) parts.push([0.36, -0.1, () => { kCrate(K, 0.36, -0.12, '#8fc1f0'); kCrate(K, 0.4, -0.02, '#c9955f'); }]);
    K.scene(parts);
  },
  obst(K, s, now, x, y, t) {
    if (groundPart(() => K.rect(-0.42, -0.42, 0.42, 0.42, C('#86c35b')))) return;
    // Bäume so groß wie die wilden Obstbäume im Obsthain
    const spots = s === 1 ? [[-0.22, -0.2], [0.18, -0.24], [-0.24, 0.18]]
      : s === 2 ? [[-0.22, -0.2], [0.18, -0.24], [-0.24, 0.18], [0.14, 0.12]]
      : [[-0.26, -0.26], [0.02, -0.3], [-0.3, 0.02], [-0.04, 0.02]];
    const fruits = ['#ff6b5e', '#ffb13b', '#ff6b5e', '#b07ad6'];
    const parts = spots.map(([a, b], i) => [a, b, () => kitTree(K, a, b, 1, fruits[i])]);
    parts.push([0.32, 0.3, () => { kCrate(K, 0.32, 0.3, '#c98d5c'); if (s >= 2) kCrate(K, 0.36, 0.2, '#c98d5c', 1, 0); }]);
    if (s === 2) parts.push([0.24, 0.2, () => {           // Leiter am Baum
      const p = K.P(0.26, 0.2), q = K.P(0.18, 0.12, 16);
      kLine(K, p, q, '#a0714d', 1); kLine(K, [p[0] + 3 * K.z, p[1]], [q[0] + 3 * K.z, q[1]], '#a0714d', 1);
      for (let i = 1; i < 5; i++) { const m = lerp(p, q, i / 5); kLine(K, m, [m[0] + 3 * K.z, m[1]], '#a0714d', 0.8); }
    }]);
    if (s === 3) parts.push([0.3, -0.2, () => {         // Hofladen
      const [wall, roof] = paint(t, '#fff1d6', '#e8705f');
      const B = K.block({ a: 0.3, b: -0.22, ha: 0.1, hb: 0.14, h: 9, wall, roof, roofH: 6, entry: true });
      kAwning(K, B, 'front', SOFT.red, 0.55, 0.8);
      const F = B.faces.front;
      if (F) for (let j = 0; j < 3; j++) { const m = lerp(F.P, F.Q, 0.25 + j * 0.25); circle(m[0], m[1] - F.H * 0.35, 1.6 * K.z, C(fruits[j])); }
    }], [0.42, 0.02, () => kBarrel(K, 0.42, 0.02, '#a0714d')]);
    K.scene(parts);
  },
  stein(K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-0.42, -0.42, 0.42, 0.42, C('#9ea3ab'));
      if (s === 3) {                                       // Abbaugrube in Stufen
        K.rect(-0.36, -0.32, 0.12, 0.2, C('#7f848c'));
        K.rect(-0.3, -0.26, 0.06, 0.14, C('#6f747c'));
        K.rect(-0.24, -0.2, 0.0, 0.08, C('#60656d'));
      }
    })) return;
    const parts = [];
    parts.push([-0.28, -0.24, () => { const [bx, by] = K.P(-0.28, -0.24); boulder(bx, by, (s === 3 ? 5 : 7) * K.z); }]);
    parts.push([-0.22, 0.26, () => { const [bx, by] = K.P(-0.22, 0.26); boulder(bx, by, 5.5 * K.z); }]);
    parts.push([0.14, 0.2, () => {
      const [wall, roof] = paint(t, '#a86f5c', '#6b7a8f');
      const B = K.block({ a: 0.18, b: 0.22, ha: 0.1, hb: 0.12, h: 8, wall, roof, roofH: 6, entry: true });
      K.door(B, 'front', 0.35, 0.65, 0.7);
    }]);
    if (s >= 2) {
      parts.push([0.05, -0.1, () => {                    // Kran mit hängendem Block
        const p0 = kPost(K, -0.08, -0.14, 26, '#8a5a3c', 1.6), p1 = K.P(0.22, -0.14, 22);
        kLine(K, p0, p1, '#8a5a3c', 1.4);
        kLine(K, K.P(-0.08, -0.14, 8), K.P(0.02, -0.14, 20), '#8a5a3c', 1);
        const hang = [p1[0], p1[1] + 12 * K.z];
        kLine(K, p1, hang, '#6b6f78', 0.6);
        box(hang[0], hang[1] + 3 * K.z, 3 * K.z, 1.5 * K.z, 4 * K.z, STONE, null, 0);
      }]);
      parts.push([0.32, -0.3, () => kBlocks(K, 0.32, -0.3, s + 1)]);
    }
    if (s === 3) parts.push([0.36, 0.0, () => {         // Lore auf Schienen
      kLine(K, K.P(0.36, -0.2), K.P(0.36, 0.2), '#6b6f78', 0.8);
      K.block({ a: 0.36, b: 0.02, ha: 0.05, hb: 0.07, h: 4, lift: 1, wall: '#6b7a8f', type: 'flat', roof: '#9a9ea8' });
    }]);
    K.scene(parts);
  },
  // Bahnhof: Empfangsgebäude mit Uhr, vorn (zur Schiene) ein Bahnsteig mit gelber Linie und Dach, Bank und Schild
  station(K, s, now, x, y, t) {
    const z = K.z;
    if (groundPart(() => {
      K.rect(0.1, -0.94, 0.48, 0.94, C('#e6dfd0'));
      K.rect(0.4, -0.94, 0.44, 0.94, C('#f2c14e'));
    })) return;
    const [wall, roof] = paint(t, '#f3e1c4', '#b8574a');
    const hall = () => {
      kShadow(K, 0.5);
      const B = K.block({ a: -0.2, ha: 0.24, hb: 0.54, h: 17, wall, roof, roofH: 11 });
      K.door(B, 'front', 0.44, 0.56, 0.62);
      K.wins(B, 'front', 4, 0.35, 0.72, 0.06, 0.94, [1, 2]);
      K.sideWins(B, 1, 0.35, 0.72);
      const F = B.faces.front;
      if (F) {                                             // Bahnhofsuhr über der Tür
        faceClock(F, 0.5, F.H * 0.84, 2.8 * z, z, { ring: '#4a4a58', ringW: 0.7, hands: [[0, 0.72, 0.7], [Math.PI / 2, 0.5, 0.7]] });   // flach auf der Wand (Block 80)
      }
    };
    const canopy = () => {
      for (const b of [-0.72, -0.24, 0.24, 0.72]) kPost(K, 0.3, b, 13, '#6b6f78', 1.2);
      K.block({ a: 0.28, ha: 0.13, hb: 0.88, h: 1.4, lift: 13, wall: shade(roof, -0.12), type: 'flat', roof: shade(roof, 0.06) });
      const [sx, sy] = K.P(0.3, -0.5, 9);                 // blaues Schild
      poly([[sx - 4 * z, sy - 2 * z], [sx + 4 * z, sy - 2 * z], [sx + 4 * z, sy + 1.5 * z], [sx - 4 * z, sy + 1.5 * z]], C('#3e7fd0'));
      g.strokeStyle = C('#ffffff'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(sx - 2.5 * z, sy - 0.2 * z); g.lineTo(sx + 2.5 * z, sy - 0.2 * z); g.stroke();
    };
    K.scene([[-0.2, 0, hall], [0.3, 0, canopy], [0.22, 0.45, () => {
      const [bx, by] = K.P(0.2, 0.45); g.save(); g.translate(bx, by); g.scale(0.45, 0.45); drawObject('bank', 0, 0, z, now, x, y, 1, { rot: K.r }); g.restore();
    }]]);
  },
  // Glashaus: weißes Gerippe, Glaswände mit Pflanzen dahinter, Satteldach aus Glas; abends warmes Licht innen
  glashaus(K, s, now, x, y, t) {
    const z = K.z;
    if (groundPart(() => K.rect(-0.46, -0.94, 0.46, 0.94, C('#e7e1d4')))) return;
    const house = () => {
      kShadow(K, 0.5);
      K.block({ ha: 0.36, hb: 0.8, h: 3, wall: '#dcd5c8', type: 'flat', roof: '#efeae0' });
      const lit = night > 0.15 && isLive();
      const B = K.block({ ha: 0.34, hb: 0.78, h: 16, lift: 3, wall: lit ? '#ffe7a8' : '#cbecf8', type: 'none' });
      for (const [side, F] of Object.entries(B.faces)) {
        if (!F) continue;
        // Pflanzen hinter dem Glas
        for (let i = 0; i < 6; i++) {
          const m = lerp(F.P, F.Q, (i + 0.5) / 6), hh = hash(x + i, y, side.length) * 5 * z;
          circle(m[0], m[1] - 5 * z - hh, (3.2 + hash(x, y + i, 7) * 1.6) * z, lit ? 'rgba(96,120,58,0.75)' : C(i % 2 ? '#7cc08a' : '#96d09a'));
          if (i % 3 === 1) circle(m[0] + 1.5 * z, m[1] - 8 * z - hh, 1.3 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
        }
        // Spiegelung: schräge helle Streifen
        g.fillStyle = 'rgba(255,255,255,0.35)';
        for (const t0 of [0.18, 0.62]) {
          const a0 = lerp(F.P, F.Q, t0), a1 = lerp(F.P, F.Q, t0 + 0.08), b0 = lerp(F.P, F.Q, t0 + 0.14), b1 = lerp(F.P, F.Q, t0 + 0.22);
          g.beginPath(); g.moveTo(a0[0], a0[1] - 2 * z); g.lineTo(a1[0], a1[1] - 2 * z); g.lineTo(b1[0], b1[1] - F.H + 2 * z); g.lineTo(b0[0], b0[1] - F.H + 2 * z); g.closePath(); g.fill();
        }
        // weißes Gerippe
        g.strokeStyle = C('#ffffff'); g.lineWidth = 1.1 * z; g.lineCap = 'round';
        g.beginPath();
        const n = side === 'front' || side === 'back' ? 3 : 6;
        for (let i = 0; i <= n; i++) { const m = lerp(F.P, F.Q, i / n); g.moveTo(m[0], m[1]); g.lineTo(m[0], m[1] - F.H); }
        g.moveTo(F.P[0], F.P[1] - F.H * 0.55); g.lineTo(F.Q[0], F.Q[1] - F.H * 0.55);
        g.moveTo(F.P[0], F.P[1] - F.H); g.lineTo(F.Q[0], F.Q[1] - F.H);
        g.stroke();
        if (lit) {                        // sanftes Licht aus der Mitte der Scheibe, damit Gerippe und Pflanzen sichtbar bleiben
          const m0 = lerp(F.P, F.Q, 0.12), m1 = lerp(F.P, F.Q, 0.88);
          glowQuad([[m0[0], m0[1] - F.H * 0.2], [m1[0], m1[1] - F.H * 0.2], [m1[0], m1[1] - F.H * 0.8], [m0[0], m0[1] - F.H * 0.8]], 15 * z);
        }
      }
      K.door(B, 'front', 0.44, 0.56, 0.72, '#ffffff');
      // Glasdach selbst zeichnen: Glas bleibt auch auf der Schattenseite hell (sonst sähe es aus wie Blech)
      const ea = 0.36, eb = 0.8, top = 19, rh = 12, R1 = K.P(0, -eb, top + rh), R2 = K.P(0, eb, top + rh);
      const glass = (na, nb) => { const [u, v] = K.turn(na, nb); return C(lit ? '#fff0c4' : u > 0.5 ? '#b9dcee' : v < -0.5 ? '#cdeaf6' : '#e6f6fc'); };
      const rafters = sa => {
        g.strokeStyle = C('#ffffff'); g.lineWidth = 1.2 * z;
        g.beginPath();
        for (let i = 0; i <= 5; i++) { const b = -eb + i * eb * 0.4, p = K.P(0, b, top + rh), q = K.P(sa * ea, b, top); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
        g.moveTo(R1[0], R1[1]); g.lineTo(R2[0], R2[1]);
        g.stroke();
      };
      const slopes = [1, -1].sort((p, q) => K.facing(p, 0) - K.facing(q, 0));
      const slope = sa => { poly([K.P(sa * ea, -eb, top), K.P(sa * ea, eb, top), R2, R1], glass(sa, 0)); rafters(sa); };
      slope(slopes[0]);
      for (const sb of [1, -1]) if (K.facing(0, sb) > 0.01) {        // Giebeldreieck an der sichtbaren Stirnseite
        const p = K.P(0.34, sb * 0.78, top), q = K.P(-0.34, sb * 0.78, top), r = K.P(0, sb * 0.78, top + rh);
        poly([p, q, r], lit ? C('#ffe7a8') : K.wallCol('#cbecf8', [0, sb]));
        g.strokeStyle = C('#ffffff'); g.lineWidth = 1.1 * z;
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(r[0], r[1]); g.lineTo(q[0], q[1]); const m = lerp(p, q, 0.5); g.moveTo(m[0], m[1]); g.lineTo(r[0], r[1]); g.stroke();
      }
      slope(slopes[1]);
    };
    K.scene([[0, 0, house], [0.46, -0.6, () => kitBush(K, 0.46, -0.62, 0.7, '#6fbf6a')], [0.46, 0.6, () => kitBush(K, 0.46, 0.62, 0.7, '#e89bb5')]]);
  },
  // Kristallmine: bläulicher Felshügel mit Kristallen, Stollen, Lore voller Kristalle;
  // Stufe 2 eine Kristall-Laterne und ein Schuppen, Stufe 3 die Schleiferei mit Glasdach
  kristallmine(K, s, now, x, y, t) {
    if (groundPart(() => K.rect(-0.42, -0.42, 0.42, 0.42, C('#b7c3cc')))) return;
    const z = K.z, parts = [];
    parts.push([-0.14, 0, () => {
      const [mx, my] = K.P(-0.14, 0);
      ellipse(mx, my - 4 * z, 15 * z, 10 * z, C('#a3adbb'));
      ellipse(mx - 4 * z, my - 9 * z, 8 * z, 4.5 * z, C('#ccd4de'));
      crystalCluster(K.P, z, -0.24, -0.08, 0.75);
      if (s >= 2) crystalCluster(K.P, z, -0.02, -0.2, 0.55);
    }]);
    parts.push([0.12, 0, () => {                         // Stollen mit Holzrahmen
      const p = K.P(0.12, 0);
      poly([[p[0] - 4 * z, p[1] + 1 * z], [p[0] + 4 * z, p[1] + 1 * z], [p[0] + 4 * z, p[1] - 8 * z], [p[0] - 4 * z, p[1] - 8 * z]], C('#34384a'));
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2 * z;
      g.beginPath(); g.moveTo(p[0] - 5 * z, p[1] + 1 * z); g.lineTo(p[0] - 5 * z, p[1] - 9 * z); g.lineTo(p[0] + 5 * z, p[1] - 9 * z); g.lineTo(p[0] + 5 * z, p[1] + 1 * z); g.stroke();
      if (s >= 2) {                                      // Kristall-Laterne am Eingang
        const lx = p[0] + 7 * z, ly = p[1] - 9 * z;
        g.strokeStyle = C('#8a8f99'); g.lineWidth = 1 * z; g.beginPath(); g.moveTo(lx, p[1] + 1 * z); g.lineTo(lx, ly); g.stroke();
        crystal(lx, ly + 1 * z, z, 3.5 * z, 1.3 * z);
      }
    }]);
    parts.push([0.34, 0.12, () => {                      // Schienen und Lore voller Kristalle
      kLine(K, K.P(0.14, 0.02), K.P(0.44, 0.26), '#6b6f78', 0.8);
      K.block({ a: 0.34, b: 0.16, ha: 0.06, hb: 0.08, h: 4, lift: 1, wall: '#7a8494', type: 'flat', roof: '#a3adbb' });
      const [ox, oy] = K.P(0.34, 0.16, 5);
      crystal(ox - 1.8 * z, oy + 1 * z, z, 3 * z, 1.1 * z, -0.2);
      crystal(ox + 1.6 * z, oy + 1.2 * z, z, 2.6 * z, 1 * z, 0.25);
    }]);
    if (s >= 2) parts.push([-0.28, 0.3, () => {         // Schuppen
      const [wall, roof] = paint(t, '#e9eef3', '#6f8fd8');
      const B = K.block({ a: -0.28, b: 0.3, ha: 0.1, hb: 0.1, h: 8, wall, roof, roofH: 6, entry: true });
      K.door(B, 'front', 0.3, 0.7, 0.7);
    }]);
    if (s === 3) parts.push([0.22, -0.3, () => {        // Schleiferei mit Glasdach und großem Kristall
      const [wall] = paint(t, '#e9eef3', '#bfe6f7');
      const B = K.block({ a: 0.22, b: -0.28, ha: 0.13, hb: 0.12, h: 10, wall, roof: '#cdeefa', roofH: 7, entry: true });
      K.door(B, 'front', 0.35, 0.65, 0.66); K.sideWins(B, 1, 0.4, 0.75);
      const [cx, cy] = K.P(0.22, -0.28, 17);
      crystal(cx, cy + 2 * z, z, 7 * z, 2 * z, 0.05);
    }]);
    K.scene(parts);
  },
  mine(K, s, now, x, y, t) {
    if (groundPart(() => K.rect(-0.42, -0.42, 0.42, 0.42, C('#a89a80')))) return;
    const parts = [];
    const mound = () => {
      const [mx, my] = K.P(-0.12, 0), z = K.z;
      ellipse(mx, my - 4 * z, 15 * z, 10 * z, C('#9a9ea8'));
      ellipse(mx - 4 * z, my - 9 * z, 8 * z, 4.5 * z, C('#c3c6ce'));
      if (s === 3) for (const [ox, oy] of [[6, -6], [-7, -3], [2, -11]]) circle(mx + ox * z, my + oy * z, 1.4 * z, C('#f2c14e'));
    };
    const entrance = () => {                            // Stolleneingang mit Holzrahmen
      const p = K.P(0.12, 0), z = K.z;
      poly([[p[0] - 4 * z, p[1] + 1 * z], [p[0] + 4 * z, p[1] + 1 * z], [p[0] + 4 * z, p[1] - 8 * z], [p[0] - 4 * z, p[1] - 8 * z]], C('#3b3440'));
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2 * z;
      g.beginPath(); g.moveTo(p[0] - 5 * z, p[1] + 1 * z); g.lineTo(p[0] - 5 * z, p[1] - 9 * z); g.lineTo(p[0] + 5 * z, p[1] - 9 * z); g.lineTo(p[0] + 5 * z, p[1] + 1 * z); g.stroke();
      if (s >= 2) { const lx = p[0] + 7 * z, ly = p[1] - 9 * z; circle(lx, ly, 1.3 * z, night > 0.15 && isLive() ? '#ffd873' : C('#fff3b0')); kGlow(lx, ly, z, 14); }
    };
    parts.push([-0.12, 0, mound], [0.12, 0, entrance]);
    parts.push([0.34, 0.1, () => {                       // Schienen und Lore
      kLine(K, K.P(0.14, 0.02), K.P(0.44, 0.24), '#6b6f78', 0.8);
      const cart = K.block({ a: 0.34, b: 0.14, ha: 0.06, hb: 0.08, h: 4, lift: 1, wall: '#6b7a8f', type: 'flat', roof: '#9a9ea8' });
      void cart;
      const [ox, oy] = K.P(0.34, 0.14, 5.5);
      circle(ox - 1.5 * K.z, oy, 1.4 * K.z, C('#f2c14e')); circle(ox + 1.5 * K.z, oy + 0.4 * K.z, 1.3 * K.z, C('#8a8f99'));
    }]);
    if (s >= 2) parts.push([-0.3, -0.3, () => {         // Förderturm
      const z = K.z, base = [K.P(-0.36, -0.36), K.P(-0.2, -0.36), K.P(-0.2, -0.2), K.P(-0.36, -0.2)], top = K.P(-0.28, -0.28, s === 3 ? 34 : 28);
      for (const b of base) kLine(K, b, top, '#8a5a3c', 1.3);
      kLine(K, lerp(base[0], top, 0.5), lerp(base[2], top, 0.5), '#8a5a3c', 1);
      if (s === 3) {
        const r = 5 * z, an = now / 500;
        g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.2 * z; g.beginPath(); g.arc(top[0], top[1], r, 0, Math.PI * 2); g.stroke();
        g.beginPath(); for (let i = 0; i < 4; i++) { const b = an + i * Math.PI / 2; g.moveTo(top[0], top[1]); g.lineTo(top[0] + Math.cos(b) * r, top[1] + Math.sin(b) * r); } g.stroke();
      } else circle(top[0], top[1], 1.8 * z, C('#4a4a58'));
    }]);
    if (s === 3) parts.push([0.2, -0.3, () => {
      const [wall, roof] = paint(t, '#d98a6a', '#4a4a58');
      const B = K.block({ a: 0.22, b: -0.28, ha: 0.12, hb: 0.12, h: 11, wall, roof, roofH: 7, entry: true });
      K.door(B, 'front', 0.35, 0.65, 0.66); K.sideWins(B, 1, 0.4, 0.75);
    }]);
    K.scene(parts);
  },
  steinmetz(K, s, now, x, y, t) {
    const parts = [[0, -0.05, () => {
      kShadow(K, 0.3);
      const [wall, roof] = paint(t, STONE, STONE_D);
      const B = K.block({ a: -0.04, b: -0.05, ha: s === 1 ? 0.17 : 0.2, hb: s === 1 ? 0.2 : 0.25, h: 11 + s, wall, roof, roofH: 9, entry: true });
      K.door(B, 'front', 0.38, 0.62, 0.66);
      K.sideWins(B, s === 1 ? 1 : 2, 0.38, 0.72);
      if (s >= 2) kAwning(K, B, 'front', '#6b7a8f', 0.7, 0.86);
    }]];
    parts.push([0.32, 0.3, () => kBlocks(K, 0.32, 0.3, 3)]);
    if (s >= 2) parts.push([0.34, -0.3, () => kStatue(K, 0.34, -0.3)]);
    if (s === 3) parts.push([-0.34, 0.34, () => kStatue(K, -0.34, 0.34, '#f2e6d0')], [0.18, 0.4, () => {
      K.block({ a: 0.18, b: 0.4, ha: 0.04, hb: 0.04, h: 12, wall: '#f5f0e6', type: 'flat' });
    }]);
    K.scene(parts);
  },
  schmiede(K, s, now, x, y, t) {
    const [SW, SR] = paint(t, '#a86f5c', '#4a4a58');
    const glow = 0.6 + 0.4 * Math.sin(now / 180);
    const main = () => {
      kShadow(K, 0.32);
      const B = K.block({ ha: s === 1 ? 0.18 : 0.22, hb: s === 1 ? 0.2 : 0.26, h: 12 + s, wall: SW, roof: SR, roofH: 9, entry: true });
      K.door(B, 'front', 0.2, 0.44, 0.66);
      const F = B.faces.front || B.faces.right || B.faces.left;
      if (F) faceQuad(F.P, F.Q, 0.56, 0.84, F.H * 0.15, F.H * 0.55, `rgba(255,${Math.round(120 + 60 * glow)},60,1)`);
      kitChimney(K, -0.08, 0.1, 12 + s + 7, now, '#6b4f3a', true);
    };
    const parts = [[0, 0, main]];
    parts.push([0.34, 0.3, () => { kCrate(K, 0.34, 0.3, '#4a4a58'); }]);
    if (s >= 2) parts.push([0.36, -0.28, () => {         // Amboss und Hufeisen-Schild
      const [ax, ay] = K.P(0.36, -0.28), z = K.z;
      g.fillStyle = C('#4a4a58'); g.fillRect(ax - 1.5 * z, ay - 4 * z, 3 * z, 4 * z);
      poly([[ax - 4 * z, ay - 4 * z], [ax + 4 * z, ay - 4 * z], [ax + 3 * z, ay - 6 * z], [ax - 3 * z, ay - 6 * z]], C('#5a5a68'));
    }], [0.3, 0.02, () => kSign(K, 0.4, 0.04, '#fff1d6', (x, y, z) => { g.strokeStyle = C('#6b6f78'); g.lineWidth = 1.2 * z; g.beginPath(); g.arc(x, y, 2 * z, Math.PI * 0.1, Math.PI * 0.9, true); g.stroke(); })]);
    if (s === 3) parts.push([-0.3, 0.3, () => {         // Hammerwerk: Anbau mit hohem Schlot
      const B = K.block({ a: -0.28, b: 0.3, ha: 0.12, hb: 0.14, h: 10, wall: shade(SW, -0.1), roof: SR, roofH: 6 });
      K.sideWins(B, 1, 0.4, 0.75);
      const [cx2, cy2] = K.P(-0.3, 0.3, 16);
      box(cx2, cy2, 2.4 * K.z, 1.2 * K.z, 16 * K.z, '#6b4f3a', null, 0);
      smoke(cx2, cy2 - 18 * K.z, K.z, now, true);
    }]);
    K.scene(parts);
  },
  saege(K, s, now, x, y, t, ha, hb) {
    const hall = s === 1 ? { ha: 0.28, hb: 0.52, h: 13 } : { ha: 0.32, hb: 0.6, h: 16 };
    const parts = [[0, -0.05, () => {
      kShadow(K, 0.5);
      const [wall, roof] = paint(t, WOOD, WOOD_D);
      const B = K.block({ a: -0.04, b: -0.05, ...hall, wall, roof, roofH: 11, entry: true });
      K.door(B, 'front', 0.38, 0.62, 0.78, '#6b4a2e');
      K.wins(B, 'front', 4, 0.4, 0.72, 0.05, 0.95, [1, 2]);
      K.sideWins(B, 1, 0.4, 0.72);
      // Sägeblatt auf dem Dach
      const [sx, sy] = K.P(-0.04, -0.05, hall.h + 15), an = now / 200;
      circle(sx, sy, 5 * K.z, C('#c7cad2'));
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 1 * K.z;
      g.beginPath(); for (let i = 0; i < 4; i++) { const b = an + i * Math.PI / 2; g.moveTo(sx, sy); g.lineTo(sx + Math.cos(b) * 5 * K.z, sy + Math.sin(b) * 5 * K.z); } g.stroke();
    }]];
    parts.push([0.3, -0.75, () => kLogs(K, 0.3, -0.78, 3 + s)]);
    parts.push([0.3, 0.7, () => kPlanks(K, 0.28, 0.72, 2 + s)]);
    if (s >= 2) parts.push([-0.3, 0.78, () => kLogs(K, -0.3, 0.8, 4)]);
    if (s === 3) parts.push([0.3, 0.5, () => {          // offener Bretterschuppen
      for (const [a, b] of [[0.18, 0.45], [0.42, 0.45], [0.18, 0.92], [0.42, 0.92]]) kPost(K, a, b, 14, '#8a5a3c', 1.3);
      K.block({ a: 0.3, b: 0.68, ha: 0.15, hb: 0.28, h: 0.1, lift: 14, wall: WOOD_D, roof: WOOD_D, roofH: 5, ridge: 'b' });
    }]);
    K.scene(parts);
  },
  baecker(K, s, now, x, y, t, ha, hb) {
    const pink = s === 3;
    const [wall, roof] = paint(t, pink ? '#fbe6ee' : '#ffe8b0', pink ? '#e3a1b8' : '#9c5a32'), H = s === 1 ? 15 : 24;
    const main = () => {
      kShadow(K, 0.5);
      const B = K.block({ a: -0.04, ha: 0.3, hb: 0.56, h: H, wall, roof, roofH: 14, type: 'barrel', ridge: 'b', over: 1.08, entry: true });   // Tonnendach: rund wie ein Brotlaib
      K.door(B, 'front', 0.14, 0.28, s === 1 ? 0.62 : 0.38);
      const F = B.faces.front;
      if (F) {                                              // großes Schaufenster
        windowOn(F.P, F.Q, 0.38, 0.86, F.H * (s === 1 ? 0.12 : 0.08), F.H * (s === 1 ? 0.52 : 0.34), K.z);
        kAwning(K, B, 'front', pink ? SOFT.pink : SOFT.red, s === 1 ? 0.6 : 0.38, s === 1 ? 0.78 : 0.48);
      }
      if (s >= 2) { K.wins(B, 'front', 3, 0.6, 0.84, 0.1, 0.9); K.sideWins(B, 1, 0.6, 0.84); }
      K.sideWins(B, 1, s === 1 ? 0.35 : 0.12, s === 1 ? 0.72 : 0.36);
      kitChimney(K, -0.12, 0.34, H + 10, now, '#c0694a');
      // Schild: Brezel bzw. Torte
      const [px, py] = K.P(-0.04, -0.2, H + 20);
      if (pink) { K.block({ a: -0.04, b: -0.2, ha: 0.07, hb: 0.07, h: 4, lift: H + 14, wall: '#fff6e4', type: 'flat', roof: '#ff8fb1' }); circle(px, py - 2 * K.z, 1.5 * K.z, C('#e8404f')); }
      else { g.strokeStyle = C('#d99a4e'); g.lineWidth = 2 * K.z; g.beginPath(); g.arc(px - 2 * K.z, py, 2.6 * K.z, 0, Math.PI * 2); g.arc(px + 2 * K.z, py, 2.6 * K.z, 0, Math.PI * 2); g.stroke(); }
    };
    const parts = [[0, 0, main]];
    if (s >= 2) parts.push([0.42, 0.62, () => kTable(K, 0.42, 0.66, pink ? SOFT.green : SOFT.blue)]);
    if (s === 3) parts.push([0.42, -0.66, () => kTable(K, 0.42, -0.7, SOFT.yellow)], [0.4, 0, () => kitBush(K, 0.4, 0.2, 0.5, '#62b85a')]);
    K.scene(parts);
  },
  markt(K, s, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-1.44, -1.44, 1.44, 1.44, C('#eadcbf'));
      g.save(); clipTo([[[-1.44, -1.44], [1.44, -1.44], [1.44, 1.44], [-1.44, 1.44]]], p => K.P(p[0], p[1]));
      pattern(p => K.P(p[0] * 2.6, p[1] * 2.6), 'stones', x, y, K.z, C('#dccdae'));
      g.restore();
    })) return;
    const parts = [];
    const stalls = s === 1 ? [[-1, -0.9, SOFT.red], [-0.9, 0.5, SOFT.blue], [0.2, -1.05, SOFT.yellow]]
      : [[-1.05, -1.05, SOFT.red], [0, -1.1, SOFT.blue], [-1.1, 0, SOFT.yellow], [1.05, -1.05, SOFT.green], [-1.05, 1.05, SOFT.purple]];
    const [sw, sr] = paint(t, '#f5e1b8', null);
    stalls.forEach(([a, b, c], i) => parts.push([a, b, () => kStall(K, a, b, sr || c, i, sw)]));
    parts.push([0, 0, () => {                            // Brunnen in der Mitte
      K.oval(0, 0, s === 3 ? 0.36 : 0.28, C('#aeb2bd'));
      K.oval(0, 0, s === 3 ? 0.3 : 0.23, C('#74d0e6'), 2);
      const [fx, fy] = K.P(0, 0, 2), jet = Math.sin(now / 300) * 1.2 * K.z;
      kLine(K, [fx, fy], [fx, fy - (s === 3 ? 14 : 9) * K.z - jet], '#bfeefa', 1.6);
      if (s === 3) { K.block({ ha: 0.04, hb: 0.04, h: 8, lift: 2, wall: '#c9ccd6', type: 'flat' }); }
    }]);
    parts.push([0.55, -0.6, () => kCrate(K, 0.55, -0.6)], [-0.6, 0.55, () => kCrate(K, -0.6, 0.55, '#b98a55')]);
    if (s >= 2) {
      parts.push([1.1, 0, () => kUmbrella(K, 1.1, 0, SOFT.red)], [0, 1.1, () => kUmbrella(K, 0, 1.1, SOFT.green)]);
      parts.push([0.95, 0.75, () => { kCrate(K, 0.95, 0.75, '#d9b27a'); kCrate(K, 0.75, 1.0, '#c9955f'); }], [1.05, 1.1, () => kUmbrella(K, 1.05, 1.1, SOFT.blue)]);
    } else parts.push([0.9, 0.8, () => kCrate(K, 0.9, 0.8, '#d9b27a')]);
    if (s === 3) {
      parts.push([0.7, -0.3, () => kBarrel(K, 0.72, -0.34)], [-0.35, 0.72, () => kBarrel(K, -0.38, 0.72, '#8a5a3c')]);
      parts.push([1.3, 0, () => { kPost(K, 1.3, -1.3, 20); kPost(K, 1.3, 1.3, 20); kBunting(K, 1.3, -1.3, 1.3, 1.3, 20); }]);
      parts.push([0, 1.3, () => { kPost(K, -1.3, 1.3, 20); kBunting(K, -1.3, 1.3, 1.3, 1.3, 20); }]);
    }
    K.scene(parts);
  },
  fabrik(K, s, now, x, y, t) {
    const H = s === 3 ? 18 : 14;
    const main = () => {
      kShadow(K, 0.5);
      const [wall, roof] = paint(t, '#d98a6a', '#8fa3b8');
      const B = K.block({ ha: 0.32, hb: 0.6, h: H, wall, type: 'flat', roof: shade(wall, -0.15), entry: true });
      for (let i = 0; i < 4; i++) K.block({ b: -0.45 + i * 0.3, ha: 0.3, hb: 0.14, h: 0.1, lift: H, wall: roof, roof, roofH: 7, type: 'gable', ridge: 'a', over: 1 });
      K.door(B, 'front', 0.42, 0.58, 0.7, '#6b4a2e');
      K.wins(B, 'front', 6, 0.35, 0.72, 0.04, 0.96, [2, 3]);
      K.sideWins(B, 2, 0.35, 0.72);
      const chim = (a, b, hh) => { const [cx2, cy2] = K.P(a, b, H); box(cx2, cy2, 2.6 * K.z, 1.3 * K.z, hh * K.z, '#b35a45', null, 0); smoke(cx2, cy2 - (hh + 2) * K.z, K.z, now, true); };
      chim(-0.2, -0.45, 18);
      if (s >= 2) chim(-0.2, 0.45, 14);
      if (s === 3 && B.faces.front) {                   // Zahnrad-Schild
        const [gx, gy] = K.P(0.33, 0, H * 0.84), z = K.z;
        circle(gx, gy, 4.5 * z, C('#f2c14e'));
        for (let i = 0; i < 8; i++) { const an = now / 1500 + i * Math.PI / 4; circle(gx + Math.cos(an) * 4.8 * z, gy + Math.sin(an) * 4.8 * z, 1.1 * z, C('#f2c14e')); }
        circle(gx, gy, 1.6 * z, C('#b35a45'));
      }
    };
    const parts = [[0, 0, main]];
    if (s >= 2) parts.push([0.42, 0.66, () => { kCrate(K, 0.42, 0.66); kCrate(K, 0.42, 0.78, '#8fa3b8'); kCrate(K, 0.42, 0.72, '#c9955f', 1, 4.5); }]);
    if (s === 3) parts.push([0.4, -0.72, () => {
      const p0 = kPost(K, 0.4, -0.8, 24, '#e9a23b', 1.8), p1 = K.P(0.4, -0.5, 22);
      kLine(K, p0, p1, '#e9a23b', 1.5);
      kLine(K, p1, [p1[0], p1[1] + 10 * K.z], '#6b6f78', 0.6);
      kCrate(K, 0.4, -0.5, '#5f8fe8', 1, 5);
    }]);
    K.scene(parts);
  },
  // Hafen (3 tief × 4 breit, vorn das Wasser): Kai mit Kaimauer und Pollern, Holzpier ins Wasser, Lagerhaus, Hafenmeisterei,
  // Kran, Kisten und Fässer. Stufe 2: längerer Pier, großer Kran, mehr Ware; Stufe 3: zweiter Pier und Leuchtfeuer.
  // Die Schiffe (Mover) legen vorn am Pier an.
  hafen(K, s, now, x, y, t) {
    const E = 1.47, B = 1.97;
    if (groundPart(() => {
      K.rect(-E, -B, E, B, C('#d8cfbf'));
      g.save(); clipTo([[[-E, -B], [E, -B], [E, B], [-E, B]]], p => K.P(p[0], p[1]));
      pattern(p => K.P(p[0] * 1.6, p[1] * 1.6), 'tiles', x, y, K.z, C('#c9bfae'));
      g.restore();
      K.rect(1.12, -B, E, B, C('#9c9486'));                                              // Kaimauer
      K.rect(1.05, -B, 1.12, B, C('#e9c46a'));                                            // gelbe Kante
      for (const b of [-1.6, -0.55, 0.55, 1.6]) { const [px, py] = K.P(1.3, b); circle(px, py - 1 * K.z, 1.6 * K.z, C('#4a4a58')); }   // Poller
    })) return;
    const parts = [], z = K.z;
    const [ww, wr] = paint(t, '#c9735a', '#6b4f3a');
    parts.push([-0.8, -1.05, () => {                                                     // Lagerhaus
      const L = K.block({ a: -0.8, b: -1.05, ha: 0.6, hb: 0.85, h: 14 + s * 3, wall: ww, roof: wr, roofH: 10, type: 'gable', entry: true });
      K.door(L, 'front', 0.3, 0.7, 0.62, '#6b4a2e');
      K.sideWins(L, 3, 0.55, 0.8);
    }]);
    parts.push([-0.85, 1.3, () => {                                                      // Hafenmeisterei
      const O = K.block({ a: -0.85, b: 1.3, ha: 0.45, hb: 0.45, h: 12, wall: '#fff6e4', roof: '#3e7fd0', roofH: 8 });
      K.door(O, 'front', 0.38, 0.62, 0.6, '#3e7fd0');
      K.sideWins(O, 2, 0.4, 0.75);
      const [fx, fy] = K.P(-0.85, 1.75, 20);
      kLine(K, [fx, fy + 20 * z], [fx, fy - 4 * z], '#6b4f3a', 0.8);
      poly([[fx, fy - 4 * z], [fx + 6 * z, fy - 2 * z], [fx, fy]], C('#e8604f'));
    }]);
    const goods = [[0.35, 0.1, '#9fb8d6'], [0.5, 0.35, '#d9a08f'], [0.25, 0.45, '#d9b27a'], [0.6, 0.85, '#9fcf8f'], [0.4, 1.05, '#c9955f'], [0.55, -0.3, '#d9b27a']]
      .slice(0, 2 + s * 2);
    for (const [a, b, c] of goods) parts.push([a, b, () => kCrate(K, a, b, c, 1.4)]);
    if (s >= 2) parts.push([0.35, 0.1, () => kCrate(K, 0.35, 0.1, '#e9a23b', 1.3, 6.3)]);          // gestapelt
    for (const [a, b] of [[0.75, 1.45], [0.6, 1.6]].slice(0, s)) parts.push([a, b, () => kBarrel(K, a, b)]);
    // Kran am Kai: Turm, Ausleger übers Wasser, Seil mit Last
    parts.push([0.75, -1.3, () => {
      const H = s === 1 ? 26 : 38, reach = s === 1 ? 1.1 : 1.7;
      const top = kPost(K, 0.75, -1.3, H, '#e9a23b', s === 1 ? 1.8 : 2.4);
      if (s >= 2) kPost(K, 0.85, -1.2, H - 2, '#d38f2e', 1.6);
      const tip = K.P(0.75 + reach, -1.3, H - 4);
      kLine(K, top, tip, '#e9a23b', s === 1 ? 1.6 : 2.2);
      const sw = Math.sin(now / 1500) * 2 * z;
      kLine(K, tip, [tip[0] + sw, tip[1] + 16 * z], '#6b6f78', 0.7);
      box(tip[0] + sw, tip[1] + 20 * z, 3.4 * z, 1.7 * z, 4 * z, '#5f8fe8', null, 0);
    }]);
    // Pier(s) ins Wasser – auf Pfählen, ragen vorn aus dem Grundstück
    const pier = (b, len) => () => {
      for (let a = 1.6; a <= 1.5 + len; a += 0.5) for (const db of [-0.26, 0.26]) kPost(K, a, b + db, 3, '#6b4f3a', 1.3);
      K.block({ a: 1.5 + len / 2, b, ha: len / 2, hb: 0.3, h: 0.9, lift: 2.2, wall: '#8a5a3c', type: 'flat', roof: '#c9a26f' });
    };
    const len = s === 1 ? 1.2 : 1.7;
    parts.push([1.5 + len, 0, pier(0, len)]);
    if (s === 3) parts.push([1.5 + len, 1.45, pier(1.45, len)]);
    if (s === 3) parts.push([1.5 + len + 0.1, -0.4, () => {                                 // Leuchtfeuer am Pierende
      K.block({ a: 1.5 + len - 0.05, b: -0.42, ha: 0.08, hb: 0.08, h: 16, lift: 3, wall: '#ffffff', roof: '#e8604f', roofH: 5 });
      const [lx, ly] = K.P(1.5 + len - 0.05, -0.42, 20);
      circle(lx, ly, 1.8 * z, night > 0.15 && isLive() ? '#ffd873' : C('#fff3b0')); kGlow(lx, ly, z, 30);
    }]);
    K.scene(parts);
  },
  // Hauptbahnhof (Block 29, neu in Block 85): 4 tief, je Gleis 2 Felder breit. Vorn (+a) die Gleise mit Bahnsteigen, Laternen,
  // Bänken und Bahnsteiguhren; hinten (a < −1) das Empfangsgebäude: genau in der Mitte ein Portal mit Giebel, großer Tür und
  // Uhrturm (Eingang nach außen, dort schließt der Weg an), links und rechts gleich lange Flügel. Drei Designs (t.look):
  // Glashalle (Sandstein, gewölbte Glasdächer), Backstein (Satteldächer über den Bahnsteigen), Landbahnhof (Holz, Blumenkästen).
  hbf(K, s, now, x, y, t, ha, hb) {
    const n = hbfGleise(t), look = t.look || 'glas', z = K.z, gb = g => -n + 0.5 + 2 * g, PW = 0.8;   // PW: halbe Breite des Portals
    if (groundPart(() => {
      K.rect(-1, -hb, 2, hb, C('#cdc6b8'));
      K.rect(-2, -hb, -1, hb, C('#dad2c2'));
      K.rect(-2, -PW - 0.15, -1.86, PW + 0.15, C('#efe8da'));                                  // Stufen vor dem Portal
      for (let i = 0; i < n; i++) {
        const b = gb(i);
        K.rect(-0.95, b - 0.32, 2, b + 0.32, C('#a89f92'));                                   // Schotter
        for (let a = -0.85; a < 1.95; a += 0.22) K.rect(a, b - 0.26, a + 0.09, b + 0.26, C('#7a5a3c'));   // Schwellen
        for (const d of [-0.15, 0.15]) K.rect(-0.9, b + d - 0.025, 2, b + d + 0.025, C('#6b6f78'));       // Schienen
      }
    })) return;
    const [wall, roof] = paint(t, look === 'glas' ? '#e8dcc4' : look === 'backstein' ? '#b8664a' : '#efd9b0', look === 'glas' ? '#7fa39a' : look === 'backstein' ? '#6b4f3a' : '#c0694a');
    const lit = night > 0.15 && isLive(), H = look === 'land' ? 13 : look === 'backstein' ? 19 : 23;
    const lift = look === 'glas' ? 17 : 11, iron = look === 'backstein' ? '#4a4a58' : look === 'land' ? '#6b4f3a' : '#7d8794';
    const parts = [];
    for (let i = 0; i < n; i++) {
      const b = gb(i), bp = b + 1;
      // Ein Gleis als ein Stück: erst Prellbock und Bahnsteig samt Ausstattung, zuletzt das Dach darüber – so malt bei keiner
      // Drehung der Bahnsteig über sein Dach (Block 85)
      parts.push([0.5, b + 0.5, () => {
        const plat = () => {
          K.block({ a: 0.45, b: bp, ha: 1.45, hb: 0.38, h: 2.6, wall: '#e2dccf', type: 'flat', roof: '#efe9dc' });
          K.rect(-0.95, bp - 0.36, 1.9, bp - 0.3, C('#f2c14e'), 2.6);                           // gelbe Kante zum Gleis
          K.scene([                                                       // vorn am offenen Bahnsteigende: Bank, Laterne, Uhr
            [1.45, bp, () => K.block({ a: 1.45, b: bp + 0.2, ha: 0.15, hb: 0.05, h: 2, lift: 2.6, wall: '#8a5a3c', type: 'flat', roof: '#a8744e' })],   // Bank
            [1.6, bp - 0.15, () => { const [lx, ly] = K.P(1.6, bp - 0.18, 2.6); lampPost(lx, ly, z, 12); }],
            [1.8, bp, () => {                                                                 // Bahnsteiguhr auf einem Mast
              const [cx, cy] = K.P(1.8, bp + 0.15, 2.6), top = cy - 9 * z;
              g.strokeStyle = C(iron); g.lineWidth = 1.1 * z; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, top); g.stroke();
              circle(cx, top - 1.6 * z, 2.2 * z, C(iron)); circle(cx, top - 1.6 * z, 1.6 * z, lit ? '#fff6c8' : C('#fffaf0'));
              const m = clockNow(), hr = (m.getHours() % 12 + m.getMinutes() / 60) / 6 * Math.PI, mi = m.getMinutes() / 30 * Math.PI;
              g.strokeStyle = C('#3c3c46'); g.lineWidth = 0.5 * z; g.beginPath();
              g.moveTo(cx, top - 1.6 * z); g.lineTo(cx + Math.sin(hr) * 0.8 * z, top - 1.6 * z - Math.cos(hr) * 0.8 * z);
              g.moveTo(cx, top - 1.6 * z); g.lineTo(cx + Math.sin(mi) * 1.2 * z, top - 1.6 * z - Math.cos(mi) * 1.2 * z); g.stroke();
            }],
          ]);
        };
        K.scene([[-0.85, b, () => K.block({ a: -0.85, b, ha: 0.06, hb: 0.22, h: 4, wall: '#e8604f', type: 'flat', roof: '#fff6e4' })], [0.45, bp, plat]]);   // Prellbock
        if (look === 'glas') {                                        // Stahlstützen und gewölbtes Glasdach über Gleis und Bahnsteig
          for (const a of [-0.9, 0.3, 1.4]) for (const db of [-0.47, 1.47]) kPost(K, a, b + db, lift, iron, 1.4);
          g.save(); g.globalAlpha *= 0.62;
          K.block({ a: 0.25, b: b + 0.5, ha: 1.2, hb: 0.98, h: 1, lift, wall: '#8a96a3', roof: '#cfeaf2', roofH: 11, type: 'barrel' });   // vorn ragt der Bahnsteig hinaus
          g.restore();
        } else {                                                      // flaches Bahnsteigdach mit Blende auf einer Pfostenreihe (Block 85b)
          for (const a of [-0.6, 0.3, 1.2]) kPost(K, a, bp, lift, iron, 1.3);
          const fascia = look === 'backstein' ? '#3f5a4a' : '#f4ead2';
          const rc = look === 'backstein' ? '#8a4a38' : '#9a6a48';
          const D = K.block({ a: 0.3, b: bp, ha: 1.15, hb: 0.62, h: 1.6, lift, wall: fascia, roof: rc, type: 'flat' });
          g.strokeStyle = C(shade(rc, -0.12)); g.lineWidth = 0.6 * z; g.beginPath();            // Blechbahnen
          for (const db of [-0.36, -0.12, 0.12, 0.36]) { const p0 = K.P(-0.85, bp + db, lift + 1.6), p1 = K.P(1.45, bp + db, lift + 1.6); g.moveTo(...p0); g.lineTo(...p1); }
          g.stroke();
          if (look === 'land') for (const F of Object.values(D.faces)) if (F) {               // gezackte Holzborte unten an der Blende
            const len = Math.hypot(F.Q[0] - F.P[0], F.Q[1] - F.P[1]), m = Math.max(3, Math.round(len / (4 * z)));
            const pts = [F.P];
            for (let i = 0; i < m; i++) { const u = (i + 0.5) / m, q = lerp(F.P, F.Q, u); pts.push([q[0], q[1] + 1.4 * z]); pts.push(lerp(F.P, F.Q, (i + 1) / m)); }
            poly(pts, C('#f4ead2'));
          }
        }
      }]);
    }
    // Empfangsgebäude: Flügel links und rechts vom Portal, je Gleis ein Stück (damit es richtig vor und hinter den Hallen liegt)
    const wingType = look === 'glas' ? 'mansard' : 'gable';      // Satteldach läuft über alle Stücke durch (Walm gab Kerben, Block 85b)
    for (let i = 0; i < n; i++) {
      const lo = gb(i) - 0.5, hi = gb(i) + 1.5;
      const segs = hi <= -PW || lo >= PW ? [[lo, hi]] : [lo < -PW ? [lo, -PW] : null, hi > PW ? [PW, hi] : null].filter(Boolean);
      for (const [s0, s1] of segs) {
        const mid = (s0 + s1) / 2, half = (s1 - s0) / 2;
        parts.push([-1.45, mid, () => {
          const B = K.block({ a: -1.45, b: mid, ha: 0.42, hb: half, h: H, wall, roof, roofH: look === 'land' ? 7 : 8, type: wingType, ridge: 'b' });
          const cnt = Math.max(1, Math.round(half * 2 / 0.75));
          K.wins(B, 'back', cnt, 0.3, 0.72, 0.1, 0.9, [], look === 'land');
          K.wins(B, 'front', cnt, 0.3, 0.72, 0.1, 0.9, [], false);
          if (s0 <= -n + 1e-6) K.wins(B, 'left', 1, 0.3, 0.72, 0.3, 0.7);      // Stirnseiten außen
          if (s1 >= n - 1e-6) K.wins(B, 'right', 1, 0.3, 0.72, 0.3, 0.7);
        }]);
      }
    }
    // Portal in der Mitte: Giebel nach außen, große Tür mit Fenster darüber, darauf der Uhrturm (Uhren flach auf den Seiten)
    parts.push([-1.5, 0, () => {
      // flaches Dach mit heller Zierkante: der Turm wächst aus der Mitte heraus, statt auf einem Giebel zu stecken (Block 85b)
      const Pt = K.block({ a: -1.55, b: 0, ha: 0.43, hb: PW, h: H + 6, wall: shade(wall, 0.06), roof: shade(roof, 0.12), type: 'flat', trim: '#fffaf0' });
      for (const side of ['back', 'front']) {
        if (!Pt.faces[side]) continue;
        const F = Pt.faces[side], dh = side === 'back' ? 0.5 : 0.42;
        faceQuad(F.P, F.Q, 0.31, 0.69, 0, F.H * (dh + 0.06), C('#f2ead8'));                 // heller Steinrahmen
        K.door(Pt, side, 0.36, 0.64, dh, '#5e3b28');
        K.wins(Pt, side, 1, 0.6, 0.84, 0.36, 0.64);
        if (lit) { const F = Pt.faces[side], m = lerp(F.P, F.Q, 0.5); kGlow(m[0], m[1] - F.H * 0.25, z, 26); }
      }
      const tall = H + (look === 'land' ? 21 : look === 'backstein' ? 26 : 31);           // deutlich über den Portalgiebel
      const T = K.block({ a: -1.55, b: 0, ha: 0.3, hb: 0.3, h: tall, wall, roof, roofH: look === 'glas' ? 12 : 9, trim: '#fffaf0' });
      const m = clockNow(), hr = (m.getHours() % 12 + m.getMinutes() / 60) / 6 * Math.PI, mi = m.getMinutes() / 30 * Math.PI;
      for (const F of Object.values(T.faces)) if (F) faceClock(F, 0.5, F.H - 5 * z, 2.6 * z, z, { ring: '#4a4a58', ringW: 0.7, lit, hands: [[hr, 0.55, 0.9], [mi, 0.8, 0.7]] });
    }]);
    K.scene(parts);
  },
  // --- Wohnen ---
  // Reihenhäuser (1×2, Block 57): drei schmale Giebelhäuser Wand an Wand wie an einer Gracht – jedes in eigener
  // Pastellfarbe mit eigenem Schmuckgiebel (Treppen-, Glocken-, Spitzgiebel) zur Straße. Jede Stufe ein Stockwerk mehr,
  // ab Stufe 2 Blumenkästen, Stufe 3 Laterne an der Tür.
  reihenhaus(K, s, now, x, y, t) {
    const z = K.z, PAL = ['#f6c9c0', '#bfe0f2', '#fbe6a2', '#cfe8c4', '#e6d3f2', '#f9d8b4'], ROOFS3 = ['#8a5048', '#5b6270', '#a0563f'];
    const KINDS = ['step', 'bell', 'spitz'], k0 = Math.floor(hash(x, y, 71) * 6), g0 = Math.floor(hash(x, y, 72) * 3);
    const floors = s + 1, GF = 6.5, FH = 5.2;                              // Erdgeschoss, jedes weitere Stockwerk
    const parts = [];
    kShadow(K, 0.5);
    // Schmuckgiebel auf der sichtbaren Giebelseite (vorn oder hinten): Umriss über der Traufe, Wandfarbe, weiße Kante
    const gable = (B, kind, wall, gu) => {
      const gh = gu * z;                                                   // Höhe in Bildpunkten
      for (const side of ['front', 'back']) {
        const F = B.faces[side];
        if (!F) continue;
        const TL = [F.P[0], F.P[1] - F.H], TR = [F.Q[0], F.Q[1] - F.H];
        const prof = {
          step: [[0, 0], [0, 0.3], [0.14, 0.3], [0.14, 0.58], [0.27, 0.58], [0.27, 0.85], [0.38, 0.85], [0.38, 1], [0.62, 1], [0.62, 0.85], [0.73, 0.85], [0.73, 0.58], [0.86, 0.58], [0.86, 0.3], [1, 0.3], [1, 0]],
          bell: [[0, 0], [0, 0.18], [0.08, 0.22], [0.2, 0.4], [0.27, 0.62], [0.28, 0.8], [0.34, 0.93], [0.42, 0.99], [0.5, 1], [0.58, 0.99], [0.66, 0.93], [0.72, 0.8], [0.73, 0.62], [0.8, 0.4], [0.92, 0.22], [1, 0.18], [1, 0]],
          spitz: [[0, 0], [0, 0.08], [0.5, 1], [1, 0.08], [1, 0]],
        }[kind];
        const pts = prof.map(([u, v]) => { const p = lerp(TL, TR, u); return [p[0], p[1] - v * gh]; });
        poly(pts, K.wallCol(wall, F.n));
        g.strokeStyle = C('#fffaf0'); g.lineWidth = 1.3 * z; g.lineJoin = 'round';
        g.beginPath(); pts.slice(1, -1).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
        const m = lerp(TL, TR, 0.5);                                         // rundes Giebelfenster
        circle(m[0], m[1] - gh * 0.4, 2 * z, C('#fffaf0')); circle(m[0], m[1] - gh * 0.4, 1.4 * z, night > 0.15 && isLive() ? '#ffd873' : C('#a8dcff'));
        if (kind === 'spitz') circle(m[0], m[1] - gh - 0.6 * z, 0.8 * z, C('#f2c14e'));   // Knauf auf der Spitze
      }
    };
    [-0.64, 0, 0.64].forEach((b, i) => parts.push([0, b, () => {
      // gewählte Farbe (Fenster): alle drei in Tönen davon, damit die Reihe lebendig bleibt; sonst bunt gemischt
      const wall = t && t.wall != null ? shade(WALLS[t.wall], [0, 0.1, -0.06][i]) : PAL[(k0 + i * 2) % PAL.length];
      const roof = t && t.roof != null ? shade(ROOFS[t.roof], [0, -0.1, 0.08][i]) : ROOFS3[i];
      const kind = KINDS[(g0 + i) % 3], H = GF + (floors - 1) * FH + 1.5 + [0, 1.5, -0.8][i];
      const B = K.block({ a: -0.04, b, ha: 0.36, hb: 0.31, h: H, wall, roof, roofH: 9, type: 'gable', ridge: 'a', entry: i === 1, trim: '#fffaf0' });
      gable(B, kind, wall, 13);
      for (const side of ['front', 'back']) {
        if (!B.faces[side]) continue;
        if (side === 'front') { K.door(B, 'front', 0.38, 0.62, 5.6 / H); faceQuad(B.faces.front.P, B.faces.front.Q, 0.34, 0.66, 0, 0.6 * z, C('#d8cfc0')); }
        else K.wins(B, 'back', 1, 1.6 / H, 5 / H, 0.35, 0.65);
        for (let f = 1; f < floors; f++) { const h0 = (GF + (f - 1) * FH + 1) / H, h1 = h0 + 3.4 / H; K.wins(B, side, 2, h0, h1, 0.12, 0.88, [], s >= 2 && side === 'front'); }
      }
      for (const side of ['left', 'right']) for (let f = 0; f < floors; f++) { const h0 = (f ? GF + (f - 1) * FH + 1 : 1.8) / H; K.wins(B, side, 2, h0, h0 + 3.2 / H); }
      if (s >= 3 && B.faces.front) {                                         // Laterne neben der Tür
        const p = lerp(B.faces.front.P, B.faces.front.Q, 0.75);
        circle(p[0], p[1] - 4.6 * z, 0.9 * z, night > 0.15 && isLive() ? '#ffd873' : C('#fff4c8'));
      }
    }]));
    parts.push([0.44, -0.66, () => kitBush(K, 0.44, -0.66, 0.42, '#62b85a')], [0.44, 0.66, () => kitBush(K, 0.44, 0.66, 0.42, '#f28cb1')]);
    K.scene(parts);
  },
  // Baumhaus: ein großer Baum, das Häuschen auf einer Plattform, Leiter zum Boden. Stufe 2: Schaukel an einem Ast,
  // Stufe 3: größerer Baum, oben ein zweites Häuschen (Ausguck) mit Strickleiter und Fähnchen. Alles an EINEM Stamm,
  // damit sich nichts überdeckt – egal wie gedreht.
  baumhaus(K, s, now, x, y, t) {
    const z = K.z, sc = s === 3 ? 1.15 : 1, a0 = -0.06, b0 = -0.02;
    const [tx, ty] = K.P(a0, b0), [wall, roof] = paint(t, '#f3e1c4', '#e8705f');
    const P1 = 22 * sc, P2 = 42 * sc, top = (s === 3 ? 60 : 44) * sc;          // Plattformhöhen, Kronenmitte
    ellipse(tx, ty + 1 * z, 14 * z * sc, 6 * z * sc, 'rgba(40,60,20,0.15)');
    const leaf = (dx, dy, r, col) => circle(tx + dx * z * sc, ty - dy * z * sc, r * z * sc, C(col));
    // Krone hinten (hinter Stamm und Häusern)
    leaf(-11, top - 4, 12, '#3f9a4f'); leaf(11, top - 2, 11, '#3f9a4f'); leaf(0, top + 8, 13, '#4aa857');
    leaf(-14, P1 + 14, 10, '#3f9a4f'); leaf(14, P1 + 16, 9.5, '#459f52');           // die Häuser sitzen im Laub
    if (s === 3) { leaf(-15, P2 + 6, 10, '#459f52'); leaf(15, P2 + 8, 10, '#3f9a4f'); }
    g.fillStyle = C('#8a5a3c'); g.fillRect(tx - 3.4 * z * sc, ty - (top - 6) * z * sc, 6.8 * z * sc, (top - 6) * z * sc);   // Stamm
    g.fillStyle = C('#74492f'); g.fillRect(tx, ty - (top - 6) * z * sc, 3.4 * z * sc, (top - 6) * z * sc);
    const cabin = (lift, ha, hb, h, rf) => {
      K.block({ a: a0, b: b0, ha: ha + 0.06, hb: hb + 0.06, h: 1.6, lift, wall: '#8a5a3c', type: 'flat', roof: '#b58a5c' });   // Plattform
      const B = K.block({ a: a0, b: b0, ha, hb, h, lift: lift + 1.6, wall, roof: rf, roofH: 7 * sc });
      K.door(B, 'front', 0.35, 0.65, 0.7); K.sideWins(B, 1, 0.4, 0.8);
      return B;
    };
    const ladder = (a, b, fromUp, toUp, col = '#6b4f3a') => {
      const [lx, ly] = K.P(a, b);
      g.strokeStyle = C(col); g.lineWidth = 0.9 * z; g.beginPath();
      g.moveTo(lx - 1.5 * z, ly - fromUp * z); g.lineTo(lx - 1.5 * z, ly - toUp * z); g.moveTo(lx + 1.5 * z, ly - fromUp * z); g.lineTo(lx + 1.5 * z, ly - toUp * z);
      for (let h = fromUp + 3.5; h < toUp; h += 3.5) { g.moveTo(lx - 1.5 * z, ly - h * z); g.lineTo(lx + 1.5 * z, ly - h * z); }
      g.stroke();
    };
    cabin(P1, 0.13 * sc, 0.14 * sc, 9 * sc, roof);
    ladder(a0 + 0.2 * sc, b0 + 0.1, 0, P1);
    if (s >= 2) {                                                              // Schaukel an einem Ast
      const bx = tx - 16 * z * sc, by = ty - (P1 + 4) * z, sw = Math.sin(now / 600) * 2 * z;
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2.2 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(tx - 2 * z, by + 2 * z); g.lineTo(bx, by); g.stroke();
      kLine(K, [bx + 2 * z, by], [bx + 2 * z + sw, ty - 6 * z], '#6b4f3a', 0.7); kLine(K, [bx - 2 * z, by], [bx - 2 * z + sw, ty - 6 * z], '#6b4f3a', 0.7);
      g.fillStyle = C('#e8705f'); g.fillRect(bx - 3 * z + sw, ty - 6.5 * z, 6 * z, 1.6 * z);
    }
    if (s === 3) {                                                             // Ausguck oben mit Strickleiter und Fähnchen
      ladder(a0 - 0.14 * sc, b0 - 0.1, P1 + 1.6, P2, '#a57645');
      cabin(P2, 0.09 * sc, 0.1 * sc, 7 * sc, '#6f8fd8');
      const [fx, fy] = K.P(a0, b0, P2 + 1.6 + 7 * sc + 7 * sc);
      pennant(fx, fy, z, now, '#ffd36e');
    }
    // ein paar Blätter vorn, damit das Haus im Baum sitzt
    leaf(-13, P1 - 2, 5, '#55b562'); leaf(12, P1 + 1, 4.5, '#4aa857');
  },
  // Steg: Holzplanken vom Ufer übers Wasser, Pfähle; ist das Boot zu Hause, schaukelt es am Ende (sonst: Expedition)
  bootssteg(K, s, now, x, y, t) {
    const [dx, dy] = DIRS.find(([ex, ey]) => terrainAt(x + ex, y + ey) !== 'water') || [-1, 0];   // Richtung zum Ufer
    const ca = dx * 0.12, cb = dy * 0.12, ha = dx ? 0.42 : 0.12, hb = dy ? 0.42 : 0.12;
    for (const [pa, pb] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) kPost(K, ca + pa * (ha - 0.03), cb + pb * (hb - 0.03), 3.4, '#6b4f3a', 1.4);
    K.block({ a: ca, b: cb, ha, hb, h: 1, lift: 2.4, wall: '#8a5a3c', type: 'flat', roof: '#c9a26f' });
    const [ex, ey] = K.P(ca - dx * (ha - 0.06), cb - dy * (hb - 0.06), 3.4);       // Poller am Ende, dort hängt die Leine
    circle(ex, ey - 1 * K.z, 1.2 * K.z, C('#5a3f2c'));
    const home = !state.expedition || state.expedition.from !== x + ',' + y;
    if (home) kBoat(K, -dx * 0.36 + dy * 0.26, -dy * 0.36 + dx * 0.26, now, true);
  },
  // Hausboot: runder Rumpf, Kajüte mit Walmdach, Blumenkübel; wippt auf dem Wasser. Stufe 2 größer, Stufe 3 mit Dachgarten
  hausboot(K, s, now, x, y, t) {
    const z = K.z, bob = Math.sin(now / 900 + x) * 0.8;
    const [cx, cy] = K.P(0, 0);
    ellipse(cx, cy + 2 * z, 26 * z, 10 * z, 'rgba(230,248,255,0.5)');          // Kielwasser
    const len = 0.36 + s * 0.04, wid = 0.2;
    const hull = [[-len, -wid], [len * 0.8, -wid], [len, 0], [len * 0.8, wid], [-len, wid]];
    K.poly(hull, C('#3e6fb0'), bob);
    K.poly(hull, C('#5f8fe8'), bob + 3);
    K.poly(hull.map(([a, b]) => [a * 0.94, b * 0.86]), C('#c9a26f'), bob + 3.4);  // Deck
    const [wall, roof] = paint(t, '#fff6e4', '#e8705f');
    const B = K.block({ a: -0.06, ha: 0.14 + s * 0.03, hb: 0.13, h: 9 + (s - 1) * 2, lift: bob + 3.4, wall, roof, roofH: 6, entry: true });
    K.door(B, 'front', 0.38, 0.62, 0.7, '#6b4f3a'); K.sideWins(B, s + 1, 0.4, 0.8);
    if (s === 3) { const top = 3.4 + bob + 9 + 4 + 6; for (const [a, b] of [[-0.14, -0.06], [0.02, 0.07]]) { const [px, py] = K.P(a, b, top); circle(px, py, 2.4 * z, C('#58ad52')); circle(px + 1 * z, py - 1 * z, 1 * z, C('#ff8fb1')); } }
    for (const b of [-0.12, 0.12]) { const [px, py] = K.P(len * 0.62, b, bob + 3.4); box(px, py, 1.6 * z, 0.8 * z, 2.4 * z, '#c0694a', null, 0); circle(px, py - 3.4 * z, 1.8 * z, C(b > 0 ? '#ffd36e' : '#f28cb1')); }
  },
  // Ferienhäuschen: Strandhütten auf Pfählen, gestreift, mit Veranda, Liegestuhl und Sonnenschirm; je Stufe eine Hütte mehr
  ferienhaus(K, s, now, x, y, t) {
    const z = K.z, cols = [['#ffffff', '#6f8fd8'], ['#ffffff', '#f28cb1'], ['#ffffff', '#58b36a']];
    const spots = [[-0.12, -0.12], [0.2, 0.22], [-0.22, 0.26]].slice(0, s);
    const hut = (a, b, i) => () => {
      for (const [da, db] of [[-0.1, -0.1], [0.1, -0.1], [0.1, 0.1], [-0.1, 0.1]]) kPost(K, a + da, b + db, 4, '#8a5a3c', 1.1);
      K.block({ a, b, ha: 0.14, hb: 0.14, h: 1.2, lift: 4, wall: '#b58a5c', type: 'flat', roof: '#d9b98f' });
      const [w, st] = paint(t, ...cols[i]), B = K.block({ a, b, ha: 0.11, hb: 0.11, h: 9, lift: 5.2, wall: w, roof: st, roofH: 6 });   // Farbe wählbar
      for (const F of Object.values(B.faces)) if (F) for (let k = 0; k < 3; k++) faceQuad(F.P, F.Q, 0.12 + k * 0.3, 0.26 + k * 0.3, F.H * 0.05 + 5.2 * z, F.H + 5.2 * z, C(shade(st, 0.35)));
      K.door(B, 'front', 0.38, 0.62, 0.7, '#6b4f3a');
    };
    const parts = spots.map(([a, b], i) => [a, b, hut(a, b, i)]);
    parts.push([0.36, -0.3, () => {                                              // Sonnenschirm und Liegestuhl
      const p = kPost(K, 0.36, -0.3, 14, '#f4f1ea', 0.9);
      g.beginPath(); g.ellipse(p[0], p[1], 8 * z, 3 * z, 0, Math.PI, 0); g.fillStyle = C('#e8604f'); g.fill();
      g.beginPath(); g.ellipse(p[0], p[1], 8 * z, 3 * z, 0, Math.PI * 1.33, Math.PI * 1.66); g.lineTo(p[0], p[1]); g.fillStyle = C('#ffffff'); g.fill();
      const [lx, ly] = K.P(0.34, -0.12); poly([[lx - 5 * z, ly], [lx + 4 * z, ly - 1 * z], [lx + 6 * z, ly - 5 * z], [lx - 3 * z, ly - 4 * z]], C('#6fbfd8'));
    }]);
    K.scene(parts);
  },
  // Seilbahn-Station: Bahnsteig, vier Stützen, oben das Radhaus mit dem Seilrad (das Seil zeichnet der Himmel)
  seilbahn(K, s, now, x, y, t) {
    const z = K.z;
    kShadow(K, 0.26);
    K.block({ ha: 0.24, hb: 0.24, h: 5, wall: '#dcd6ca', type: 'flat', roof: '#ece6da' });
    for (const [a, b] of [[-0.15, -0.15], [0.15, -0.15], [0.15, 0.15], [-0.15, 0.15]]) {
      const [px, py] = K.P(a, b, 5); g.strokeStyle = C('#8a5a3c'); g.lineWidth = 1.6 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 22 * z); g.stroke();
    }
    K.block({ ha: 0.2, hb: 0.2, h: 4, lift: 26, wall: '#8a5a3c', roof: '#d9534a', roofH: 8 });
    const [wx, wy] = K.P(0, 0, SEIL_H), sp = now / 700;
    circle(wx, wy, 4.2 * z, C('#6b6f78')); circle(wx, wy, 3 * z, C('#dcdfe5'));
    g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.7 * z; g.beginPath();
    for (let i = 0; i < 4; i++) { const an = sp + i * Math.PI / 2; g.moveTo(wx, wy); g.lineTo(wx + Math.cos(an) * 3 * z, wy + Math.sin(an) * 3 * z); }
    g.stroke();
  },
  // --- Strom ---
  // Wasserkraftwerk: Steinhäuschen, das Wasserrad dreht sich auf der Wasserseite (vorn)
  wasserkraft(K, s, now, x, y, t) {
    const z = K.z;
    const house = () => {
      kShadow(K, 0.3);
      const [wall, roof] = paint(t, '#e7dccb', '#6f8fd8');
      const H = 13 + s * 4;                                                // Stufe 2/3: größeres Haus
      const B = K.block({ a: -0.12, ha: 0.24, hb: 0.3, h: H, wall, roof, roofH: 10 + s, entry: true });
      K.door(B, 'front', 0.62, 0.82, 0.6);
      K.sideWins(B, s, 0.4, 0.75);
      const [px, py] = K.P(-0.2, 0.22, H + 12);                           // Isolatoren und Leitung
      kLine(K, [px, py], [px, py - 8 * z], '#6b6f78', 1.2); circle(px, py - 8 * z, 1.3 * z, C('#f2f2ee'));
    };
    const wheel = (b0, r) => () => {
      const a0 = 0.3, rb = r, rh = rb * 36, h0 = rh + 1, spin = now / 900 + b0 * 3;
      const P = (th, r = 1) => K.P(a0, b0 + Math.cos(th) * rb * r, h0 + Math.sin(th) * rh * r);
      const rim = r => { g.beginPath(); for (let i = 0; i <= 24; i++) { const p = P(i / 24 * Math.PI * 2, r); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); };
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2.2 * z; rim(1);
      g.lineWidth = 1.2 * z; rim(0.55);
      g.beginPath();
      for (let i = 0; i < 8; i++) { const th = spin + i * Math.PI / 4, p = P(th, 0.2), q = P(th, 1.12); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
      const c = P(0, 0); circle(c[0], c[1], 1.8 * z, C('#5a5a68'));
      const bot = P(Math.PI * 1.5 + 0.0001, 1);                            // unten spritzt es
      for (let i = 0; i < 4; i++) { const f = (now / 500 + i / 4) % 1; circle(bot[0] + (i - 1.5) * 3 * z, bot[1] + 2 * z - f * 5 * z, (1.4 - f) * z, `rgba(230,248,255,${0.9 - f * 0.8})`); }
    };
    const R = [0.22, 0.27, 0.27][s - 1];
    K.scene([[-0.12, 0, house], [0.3, -0.06, wheel(s === 3 ? -0.18 : -0.06, R)]].concat(s === 3 ? [[0.3, 0.22, wheel(0.22, 0.2)]] : []));
  },
  // Solarfeld (2×2): drei Reihen schräger Paneele aus Kristallglas auf Kies, mit Wechselrichter-Kasten
  solarfeld(K, s, now, x, y, t, ha, hb) {
    const z = K.z;
    if (groundPart(() => {
      K.rect(-0.96, -0.96, 0.96, 0.96, C('#dcd4c3'));
      g.save(); clipTo([[[-0.96, -0.96], [0.96, -0.96], [0.96, 0.96], [-0.96, 0.96]]], p => K.P(p[0], p[1]));
      pattern(p => K.P(p[0] * 1.8, p[1] * 1.8), 'dots', x, y, z, null, ['#cbc2ae', '#e8e1d2']);
      g.restore();
    })) return;
    const lit = night > 0.15 && isLive();
    const lift = (s - 1) * 3, dp = s === 3 ? 0.12 : 0.15;                  // Stufe 2/3: höher, Stufe 3 vier Reihen
    const row = a0 => () => {
      for (const b of [-0.72, 0, 0.72]) { kPost(K, a0 + 0.08, b, 4 + lift, '#8a8f99', 1); kPost(K, a0 - 0.1, b, 10 + lift, '#8a8f99', 1); }
      const lo = 4 + lift, hi = 12 + lift * 1.3, pa = a0 + dp, pb = a0 - dp - 0.01;
      const Q = (a, b, up) => K.P(a, b, up);
      const quad = [Q(pa, -0.8, lo), Q(pa, 0.8, lo), Q(pb, 0.8, hi), Q(pb, -0.8, hi)];
      poly(quad, C('#e8eef5'));
      const inner = [Q(pa - 0.02, -0.76, lo + 0.5), Q(pa - 0.02, 0.76, lo + 0.5), Q(pb + 0.02, 0.76, hi - 0.5), Q(pb + 0.02, -0.76, hi - 0.5)];
      poly(inner, lit ? '#2f3f63' : C('#6fa6de'));
      g.strokeStyle = lit ? 'rgba(140,170,220,0.5)' : C('#b9dcf7'); g.lineWidth = 0.7 * z; g.beginPath();
      for (let i = 1; i < 6; i++) { const p = lerp(inner[0], inner[1], i / 6), q = lerp(inner[3], inner[2], i / 6); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      const m0 = lerp(inner[0], inner[3], 0.5), m1 = lerp(inner[1], inner[2], 0.5); g.moveTo(m0[0], m0[1]); g.lineTo(m1[0], m1[1]);
      g.stroke();
      if (!lit) {                                                              // wandernder Glanz
        const f = ((now / 4000 + a0) % 1 + 1) % 1, p0 = lerp(inner[0], inner[1], f), p1 = lerp(inner[3], inner[2], Math.min(1, f + 0.08));
        g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2 * z; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
      }
    };
    const rows = s === 3 ? [-0.7, -0.24, 0.22, 0.68] : [-0.6, 0, 0.6];
    K.scene(rows.map(a => [a, 0, row(a)]).concat([[0.84, 0.84, () => {
      const B = K.block({ a: 0.84, b: 0.84, ha: 0.08 + (s - 1) * 0.02, hb: 0.1, h: 8 + (s - 1) * 3, wall: '#f2efe8', type: 'flat', roof: '#dcd6ca' });
      K.door(B, 'front', 0.3, 0.7, 0.7, '#8fa3b8');
      if (s === 3) { const [bx, by] = K.P(0.84, 0.84, 14 + 2); circle(bx, by, 1.6 * z, night > 0.15 && isLive() ? '#9fffb0' : C('#58b36a')); }   // Batterie-Lämpchen
    }]]));
  },
  // Geothermie (2×2): warmer Boden mit dampfenden Becken, Maschinenhaus und zwei runde Kühltürme mit Dampf
  geothermie(K, s, now, x, y, t) {
    const z = K.z;
    if (groundPart(() => {
      K.rect(-0.96, -0.96, 0.96, 0.96, C('#d8c7a6'));
      K.oval(0.62, 0.55, 0.26, C('#b9a680')); K.oval(0.62, 0.55, 0.21, C('#7fd6d6'));
      K.oval(-0.62, 0.6, 0.2, C('#b9a680')); K.oval(-0.62, 0.6, 0.16, C('#8fdcd0'));
    })) return;
    const steam = (x0, y0, k, big) => {
      for (let i = 0; i < (big ? 4 : 2); i++) {
        const ph = (((now / (big ? 2600 : 1800) + i / (big ? 4 : 2) + k) % 1) + 1) % 1;   // k kann negativ sein → Phase immer 0…1
        circle(x0 + Math.sin(ph * 5 + k) * 3 * z, y0 - ph * (big ? 34 : 14) * z, ((big ? 5 : 2.5) + ph * (big ? 8 : 4)) * z, `rgba(255,255,255,${(big ? 0.75 : 0.6) * (1 - ph)})`);
      }
    };
    const tower = (a, b, small) => () => {
      const [px, py] = K.P(a, b), rx = (small ? 10 : 13) * z, H = (small ? 22 : 18 + s * 6) * z;   // Stufe 2/3: höher
      cyl(px, py, rx, rx / 2, H, '#e6e0d3');
      ellipse(px, py - H, rx * 0.86, rx * 0.43, C('#9a948a'));
      g.strokeStyle = C('#cfc8ba'); g.lineWidth = 1.4 * z; g.beginPath(); g.ellipse(px, py - H * 0.45, rx, rx / 2, 0, 0, Math.PI); g.stroke();
      steam(px, py - H - 2 * z, a + b, true);
    };
    const hall = () => {
      kShadow(K, 0.6);
      const [wall, roof] = paint(t, '#f1e7d6', '#d9825b');
      const B = K.block({ a: -0.2, b: 0.2, ha: 0.42, hb: 0.3, h: 16, wall, roof, roofH: 9, entry: true });
      K.door(B, 'front', 0.4, 0.62, 0.62);
      K.wins(B, 'front', 3, 0.35, 0.72, 0.1, 0.9, [1]); K.sideWins(B, 2, 0.35, 0.72);
      const p0 = K.P(0.25, -0.2, 6), p1 = K.P(0.45, -0.55, 6), p2 = K.P(-0.35, -0.2, 6), p3 = K.P(-0.55, -0.55, 6);   // Rohre
      kLine(K, p0, p1, '#b9c0ca', 2.2); kLine(K, p2, p3, '#b9c0ca', 2.2);
    };
    const pools = () => { const [ax, ay] = K.P(0.62, 0.55); steam(ax, ay - 1 * z, 0.3, false); const [bx, by] = K.P(-0.62, 0.6); steam(bx, by - 1 * z, 0.7, false); };
    K.scene([[-0.55, -0.55, tower(-0.55, -0.55)], [0.45, -0.55, tower(0.45, -0.55)], [-0.2, 0.2, hall], [0.62, 0.62, pools]]
      .concat(s === 3 ? [[0.66, -0.02, tower(0.66, -0.02, true)]] : []));
  },
  // Wellenkraftwerk: Plattform auf Pfählen im Meer, kleines Häuschen, ringsum wippende gelbe Bojen an Leinen
  wellen(K, s, now, x, y, t) {
    const z = K.z, lit = night > 0.15 && isLive();
    const buoys = [[0.36, 0.3], [-0.34, 0.34], [0.34, -0.36], [-0.3, -0.3], [0.44, -0.02], [-0.42, 0.02], [0.02, 0.44], [0.02, -0.44]].slice(0, 2 + s * 2);   // Stufe: mehr Bojen
    const bob = (i) => Math.sin(now / 520 + i * 1.7) * 2 * z;
    const buoy = (i) => () => {
      const [a, b] = buoys[i], [px, py0] = K.P(a, b), py = py0 + bob(i);
      const [cx0, cy0] = K.P(0, 0, 8);
      g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(px, py - 2 * z); g.lineTo(cx0, cy0); g.stroke();
      ellipse(px, py + 1 * z, 5 * z, 2 * z, 'rgba(230,248,255,0.7)');
      cyl(px, py, 4 * z, 2 * z, 5 * z, '#f2c14e');
      ellipse(px, py - 5 * z, 4 * z, 2 * z, C('#e8604f'));
    };
    const platform = () => {
      for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [0.18, 0.18], [-0.18, 0.18]]) kPost(K, a, b, 8, '#6f5238', 1.6);
      K.block({ ha: 0.24, hb: 0.24, h: 2, lift: 7, wall: '#8a6440', type: 'flat', roof: '#c29a6a' });
      const B = K.block({ a: -0.04, ha: 0.12, hb: 0.14, h: 10, lift: 9, wall: '#f7f5f0', roof: '#e8604f', roofH: 7 });
      K.door(B, 'front', 0.35, 0.65, 0.7, '#8fa3b8');
      if (lit && Math.floor(now / 800) % 2 === 0) { const [lx, ly] = K.P(-0.04, 0, 27); circle(lx, ly, 1.5 * z, '#fff3b0'); glowQuad([[lx - 2, ly - 2], [lx + 2, ly - 2], [lx + 2, ly + 2], [lx - 2, ly + 2]], 20 * z); }
    };
    K.scene(buoys.map(([a, b], i) => [a, b, buoy(i)]).concat([[0, 0, platform]]));
  },
  // --- Bildung ---
  schule(K, s, now, x, y, t) {
    const [SW, SR] = paint(t, '#f6d7a7', '#d96c4f');
    const parts = [];
    if (groundPart(() => {
      K.rect(-0.96, -0.96, 0.96, 0.96, C('#e2d9c6'));
      if (s >= 2) K.rect(-0.9, 0.35, -0.2, 0.9, C('#f1dfae'));       // Sandplatz
      if (s === 3) { K.rect(0.2, 0.3, 0.9, 0.9, C('#8fd16a')); kLine(K, K.P(0.55, 0.3), K.P(0.55, 0.9), '#ffffff', 0.8); }
    })) return;
    const H = s === 3 ? 26 : 16 + s * 2, hb2 = s === 1 ? 0.55 : 0.72;
    parts.push([-0.25, -0.3, () => {
      kShadow(K, 0.6);
      const B = K.block({ a: -0.25, b: -0.3, ha: 0.38, hb: hb2, h: H, wall: SW, roof: SR, roofH: 16, type: 'mansard', entry: true });   // Mansarddach
      K.door(B, 'front', 0.44, 0.56, s === 3 ? 0.36 : 0.56);
      K.wins(B, 'front', 4, s === 3 ? 0.1 : 0.32, s === 3 ? 0.34 : 0.7, 0.04, 0.96, [1, 2]);
      if (s === 3) K.wins(B, 'front', 4, 0.58, 0.84, 0.04, 0.96);
      K.sideWins(B, 2, 0.35, 0.72);
      // Glockentürmchen bzw. Uhrturm
      const tH = s === 3 ? 16 : 8, tw = s === 3 ? 0.13 : 0.09;
      K.block({ a: -0.25, b: -0.3, ha: tw, hb: tw, h: tH, lift: H + (s === 3 ? 8 : 10), wall: shade(SW, 0.3), roof: SR, roofH: 8 });
      const [bx, by] = K.P(-0.25 + tw, -0.3, H + (s === 3 ? 8 : 10) + tH * 0.55);
      if (s === 3 && K.facing(1, 0) > 0) { circle(bx, by, 3 * K.z, C('#ffffff')); kLine(K, [bx, by], [bx, by - 2.4 * K.z], '#6b4f3a', 0.7); kLine(K, [bx, by], [bx + 1.8 * K.z, by], '#6b4f3a', 0.7); }
      else circle(bx, by, 1.6 * K.z, C('#e9a23b'));
    }]);
    parts.push([-0.55, 0.6, () => {                       // Schaukel
      const p0 = kPost(K, -0.55, 0.45, 12), p1 = kPost(K, -0.55, 0.75, 12);
      kLine(K, p0, p1);
      const m = lerp(p0, p1, 0.5), sw = Math.sin(now / 500) * 3 * K.z;
      kLine(K, m, [m[0] + sw, m[1] + 8 * K.z], '#6b4f3a', 0.8);
      box(m[0] + sw, m[1] + 9 * K.z, 2.2 * K.z, 1 * K.z, 1 * K.z, '#e8705f', null, 0);
    }]);
    if (s >= 2) {
      parts.push([-0.35, 0.8, () => {                    // Rutsche
        const top = K.P(-0.4, 0.62, 10), bot = K.P(-0.25, 0.85);
        kLine(K, K.P(-0.4, 0.62), top, '#6b4f3a', 1); kLine(K, top, bot, '#f2b53a', 2.2);
      }]);
      parts.push([0.7, -0.75, () => kitTree(K, 0.7, -0.75, 1)]);
    }
    if (s === 3) parts.push([0.75, 0.1, () => kitTree(K, 0.75, 0.1, 0.9)], [-0.85, -0.85, () => kitTree(K, -0.85, -0.85, 0.9)]);
    K.scene(parts);
  },
  bibliothek(K, s, now, x, y, t) {
    const [SW, SR] = paint(t, '#efe6d8', '#7d6bb0');
    const H = [20, 21, 23][s - 1], z = K.z;
    const main = () => {
      kShadow(K, 0.55);
      const B = K.block({ a: -0.1, ha: 0.28, hb: 0.58, h: H, wall: SW, type: 'flat', roof: shade(SW, -0.08), entry: true });   // Flachdach mit Brüstung
      K.wins(B, 'front', 4, 0.3, 0.78, 0.04, 0.96, [1, 2]);
      K.sideWins(B, 2, 0.3, 0.78);
      K.block({ a: -0.1, ha: 0.28, hb: 0.58, h: 3, lift: H, wall: shade(SW, 0.25), type: 'none' });
      const top = kDrum(K, -0.1, 0, H + 2, [9, 10, 11][s - 1], [0, 2, 3][s - 1], s === 3 ? '#8fb4f2' : SR, shade(SW, 0.2));   // Stufe 2/3: Kuppel auf einem Sockel
      kLine(K, top, [top[0], top[1] - 3 * z], '#e9a23b', 1.6);
    };
    const portico = () => {                               // Säulenvorbau mit Giebel (Stufe 2/3 auch mit Säulen an den Seiten)
      const B = K.block({ a: 0.27, ha: 0.09, hb: 0.27, h: H - 2, wall: shade(SW, 0.3), roof: SR, roofH: 7, type: 'gable', ridge: 'a' });
      K.door(B, 'front', 0.4, 0.6, 0.55);
      kColumns(B, 'front', 4, z);
      if (s >= 2) { kColumns(B, 'right', 2, z); kColumns(B, 'left', 2, z); }
    };
    const parts = [[0, 0, main], [0.27, 0, portico]];
    if (s === 1) parts.push([0.4, 0.5, () => kSign(K, 0.4, 0.5, '#7d6bb0', (x, y, z) => { g.fillStyle = C('#fff6e4'); g.fillRect(x - 3 * z, y - 2 * z, 6 * z, 4 * z); kLine(K, [x, y - 2 * z], [x, y + 2 * z], '#7d6bb0', 0.6); })]);
    if (s === 3) parts.push([0.38, -0.72, () => { drawObjectAt('bank', K, 0.38, -0.72, 0.45, 1); }], [0.34, 0.76, () => kitTree(K, 0.36, 0.78, 0.7)], [-0.36, 0.82, () => kitTree(K, -0.36, 0.84, 0.7, '#ffb13b')]);
    K.scene(parts);
  },
  uni(K, s, now, x, y, t) {
    const [SW, SR] = paint(t, '#f3ead9', '#5f8fe8');
    if (groundPart(() => K.rect(-0.96, -0.96, 0.96, 0.96, C('#9ad26f')))) return;
    const H = 26 + s * 2, z = K.z;                       // Hauptbau mit zwei Geschossen: Wand 28 / 30 / 32
    const main = () => {
      kShadow(K, 0.7);
      const B = K.block({ a: -0.1, ha: 0.44, hb: 0.48, h: H, wall: SW, type: 'flat', roof: shade(SW, -0.06), entry: true });
      const F = B.faces.front;                            // Obergeschoss: Fenster zwischen den Säulen
      if (F) for (const c of [0.164, 0.332, 0.668, 0.836]) windowOn(F.P, F.Q, c - 0.042, c + 0.042, F.H * 0.58, F.H * 0.82, z);
      kColumns(B, 'front', 6, z);
      K.door(B, 'front', 0.44, 0.56, 0.42);
      K.sideWins(B, 3, 0.14, 0.4); K.sideWins(B, 3, 0.58, 0.82);
      const top = kDrum(K, -0.1, 0, H, [14, 15, 17][s - 1], [0, 3, 4][s - 1], SR, shade(SW, 0.2));   // Stufe 2/3: Kuppel auf einem Sockel
      kLine(K, top, [top[0], top[1] - (s === 3 ? 7 : 6) * z], '#e9a23b', 1.6);
    };
    const wh = [14, 17, 18][s - 1];                       // Seitenflügel: Stufe 1 niedrig, dann höher
    const wing = b => () => {
      const B = K.block({ a: -0.15, b, ha: 0.32, hb: 0.2, h: wh, wall: shade(SW, -0.03), roof: SR, roofH: s === 1 ? 7 : 8 });
      K.sideWins(B, 2, 0.35, 0.75); K.wins(B, 'front', 2, 0.35, 0.75);
    };
    const parts = [[-0.1, 0, main], [-0.15, -0.68, wing(-0.68)], [-0.15, 0.68, wing(0.68)]];
    if (s === 3) parts.push([0.6, 0.66, () => {           // Sternwarte mit Fernrohr
      K.block({ a: 0.6, b: 0.66, ha: 0.16, hb: 0.16, h: 12, wall: '#f3ead9', type: 'flat', roof: '#e8dcc6' });
      const top = kDome(K, 0.6, 0.66, 12, 9, '#c7cad2');
      kLine(K, [top[0] - 1 * z, top[1] + 4 * z], [top[0] + 7 * z, top[1] - 4 * z], '#4a4a58', 2.2);
    }], [0.7, -0.7, () => { const p = kPost(K, 0.7, -0.7, 26, '#c7cad2', 1); poly([[p[0], p[1]], [p[0] + 9 * z, p[1] + 2.5 * z + Math.sin(now / 400) * z], [p[0], p[1] + 6 * z]], C('#7d6bb0')); }]);
    K.scene(parts);
  },
  kunst(K, s, now, x, y, t) {
    const H = 18 + s * 2, z = K.z;                        // Wand 20 / 22 / 24
    const main = () => {
      kShadow(K, 0.55);
      const [wall, roof] = paint(t, '#ffe3ef', s === 3 ? '#c3a8e6' : '#eaa6c0');
      const B = K.block({ a: -0.06, ha: 0.28, hb: 0.56, h: H, wall, roof: shade(roof, 0.25), type: 'flat', entry: true });   // Dachterrasse
      K.door(B, 'front', 0.44, 0.56, 0.55);
      K.wins(B, 'front', 4, 0.2, 0.85, 0.05, 0.95, [1, 2]);
      K.sideWins(B, 1, 0.2, 0.85);
      if (s < 3) {                                        // Atelier-Oberlicht: kleines Glastürmchen mit Spitzdach
        const glass = night > 0.15 && isLive() ? '#ffe7a8' : '#cdeefa';
        K.block({ a: -0.06, ha: 0.11, hb: 0.11, h: s === 1 ? 9 : 10, lift: H, wall: glass, roof, roofH: s === 1 ? 7 : 8 });
      }
      if (s === 3) {                                      // bunte Kuppeln, die mittlere auf einem Sockel
        [[SOFT.green, -0.38], [SOFT.yellow, 0], [SOFT.blue, 0.38]].sort((p, q) => K.depth(-0.06, p[1]) - K.depth(-0.06, q[1])).forEach(([c, b]) => {
          const top = b ? kDome(K, -0.06, b, H, 7, c) : kDrum(K, -0.06, b, H, 11, 6, c, shade(wall, 0.3));
          circle(top[0], top[1] - 1.5 * z, 1.2 * z, C('#f2c14e'));
        });
      }
    };
    const parts = [[0, 0, main]];
    parts.push([0.42, 0.52, () => {                       // Staffelei mit Bild
      const [ex, ey] = K.P(0.42, 0.52);
      kLine(K, [ex - 3 * z, ey], [ex, ey - 12 * z], '#8a5a3c', 1); kLine(K, [ex + 3 * z, ey], [ex, ey - 12 * z], '#8a5a3c', 1);
      g.fillStyle = C('#fffaf0'); g.fillRect(ex - 4 * z, ey - 12 * z, 8 * z, 6 * z);
      ['#e8705f', '#5f8fe8', '#58b36a', '#ffd23f'].forEach((c, i) => circle(ex - 2.4 * z + i * 1.6 * z, ey - 9.5 * z + (i & 1) * 1.6 * z, 1 * z, C(c)));
    }]);
    if (s >= 2) parts.push([-0.12, 0.7, () => {          // Atelier mit Glasdach
      const B = K.block({ a: -0.12, b: 0.7, ha: 0.16, hb: 0.14, h: 13, wall: '#fff6fa', roof: '#bfe6f5', type: 'flat' });
      K.sideWins(B, 1, 0.2, 0.85);
    }], [0.4, -0.52, () => kStatue(K, 0.4, -0.52, '#f7ecd4')]);
    if (s === 3) parts.push([0.36, 0.26, () => kitBush(K, 0.38, 0.26, 0.6, '#f28cb1')]);
    K.scene(parts);
  },
};
function haystack(K, a, b) {
  const [x, y] = K.P(a, b), z = K.z;
  ellipse(x, y, 5 * z, 2.2 * z, 'rgba(40,60,20,0.15)');
  g.beginPath(); g.ellipse(x, y - 1 * z, 5 * z, 7 * z, 0, Math.PI, 0); g.fillStyle = C('#e9c46a'); g.fill();
  g.fillStyle = C('#d9b25a'); g.fillRect(x - 5 * z, y - 1.5 * z, 10 * z, 1.5 * z);
}
// Kleines Objekt (z. B. Bank) an einer Stelle im Rahmen zeichnen
function drawObjectAt(b, K, a, bb, s, rot = 0) {
  const [x, y] = K.P(a, bb);
  g.save(); g.translate(x, y); g.scale(s, s); drawObject(b, 0, 0, K.z, 0, 0, 0, 1, { rot }); g.restore();
}
// Gebäude, deren Wand- und Dachfarbe man wählen kann (Häuser zusätzlich mit Aussehen)
// Farbe wählbar: alles mit Wand und Dach (nicht: Feld, Glashaus, Steg, Seilbahn, Solar, Wellen – dort gäbe es nichts zu färben)
const UNPAINTED = new Set(['feld', 'glashaus', 'markt', 'bootssteg', 'seilbahn', 'solarfeld', 'wellen']);
const PAINTABLE = new Set([...Object.keys(BUILDING_ART).filter(b => !UNPAINTED.has(b)), 'rathaus', 'fz_schloss', 'fz_torturm', 'schloss']);
function drawBuilding(type, cx, cy, z, now, x, y, lvl, t) {
  const [da, wb] = type === 'hbf' ? [4, 2 * hbfGleise(t)] : ITEMS[type].size || [1, 1];
  BUILDING_ART[type](kit(cx, cy, z, t && t.rot), Math.max(1, Math.min(lvl || 1, 3)), now, x, y, t || {}, da / 2, wb / 2);
}
