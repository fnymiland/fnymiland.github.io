'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Grundformen
// ---------------------------------------------------------------------------
let FOG = false;
const fogCache = new Map();
function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const shadeCache = new Map();
function shade(h, t) {
  const k = h + t;
  let v = shadeCache.get(k);
  if (!v) { v = t < 0 ? mix(h, '#000000', -t) : mix(h, '#ffffff', t); shadeCache.set(k, v); }
  return v;
}
let RUIN = false;                   // verfallene Sehenswürdigkeiten: grau-braun
const ruinCache = new Map();
function C(h) {
  if (RUIN) {
    let r = ruinCache.get(h);
    if (!r) { r = mix(h, '#8f887c', 0.55); ruinCache.set(h, r); }
    return r;
  }
  if (!FOG) return h;
  let m = fogCache.get(h);
  if (!m) { m = mix(h, '#e8efe3', 0.55); fogCache.set(h, m); }
  return m;
}
function poly(pts, fill) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}
function diamond(cx, cy, a, b, fill) { poly([[cx, cy - b], [cx + a, cy], [cx, cy + b], [cx - a, cy]], fill); }
// Text mittig setzen – selbst gerechnet statt textAlign 'center': Safari zentriert Text mit Emojis (🏛 🏮 ⛏️) falsch,
// der Text stand dann ab der Mitte des Schildes. measureText stimmt dort, also daran ausrichten.
function centerText(text, x, y, stroke = false) {
  g.textAlign = 'left';
  const w = g.measureText(text).width;
  if (stroke) g.strokeText(text, x - w / 2, y);
  g.fillText(text, x - w / 2, y);
}
function circle(x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
function ellipse(x, y, rx, ry, fill) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
function faceQuad(P, Q, t0, t1, h0, h1, fill) {
  const a = lerp(P, Q, t0), b = lerp(P, Q, t1);
  poly([[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]], fill);
}
// Licht: Die Sonne steht links. Wände nach +y (links vorn) hell, nach +x (rechts vorn) im Schatten.
// Dächer: Fläche nach −x (links hinten) in der Sonne, nach −y leicht, nach +x deutlich im Schatten.
const LIGHT = { side: -0.22, roofSun: 0.12, roofBack: -0.08, roofShade: -0.3 };
function box(cx, cy, a, b, h, wall, roof, roofH) {
  const L = [cx - a, cy], B = [cx, cy + b], R = [cx + a, cy];
  poly([L, B, [B[0], B[1] - h], [L[0], L[1] - h]], C(wall));
  poly([B, R, [R[0], R[1] - h], [B[0], B[1] - h]], C(shade(wall, LIGHT.side)));
  const top = cy - h;
  if (roof) {
    const ra = a * 1.18, rb = b * 1.18, ap = [cx, top - roofH];
    const rL = [cx - ra, top], rB = [cx, top + rb], rR = [cx + ra, top], rT = [cx, top - rb];
    poly([rL, rT, ap], C(shade(roof, LIGHT.roofSun)));
    poly([rT, rR, ap], C(shade(roof, LIGHT.roofBack)));
    poly([rL, rB, ap], C(roof));
    poly([rB, rR, ap], C(shade(roof, LIGHT.roofShade)));
  } else {
    diamond(cx, top, a, b, C(shade(wall, 0.08)));
  }
  return { L, B, R, h, top };
}

// ---------------------------------------------------------------------------
// Zeichnen – Landschaft
// ---------------------------------------------------------------------------
const FLOWER_COLS = ['#ff8fb1', '#fff27a', '#ffffff', '#c49bff', '#ff9f5a'];

const hasWave = (x, y) => hash(x, y, 9) < 0.25;
function drawWave(x, y, p, z, now) {
  const off = DEPTH * z * 0.7, ph = now / 900 + hash(x, y, 10) * 20;
  g.strokeStyle = C('#c4f0f8');
  g.lineWidth = 1.6 * z;
  g.lineCap = 'round';
  g.beginPath();
  const wx = p.x + Math.sin(ph) * 5 * z, wy = p.y + off + (hash(x, y, 11) - 0.5) * 10 * z;
  g.moveTo(wx - 5 * z, wy); g.quadraticCurveTo(wx, wy - 2.5 * z, wx + 5 * z, wy);
  g.stroke();
}
// noWaves: für den Boden-Zwischenspeicher (Wellen bewegen sich und werden jedes Bild extra gezeichnet)
function drawGround(x, y, p, z, now, noWaves) {
  const hw = TW / 2 * z + 0.5, hh = TH / 2 * z + 0.3, d = DEPTH * z;
  const ter = terrainAt(x, y);
  if (ter === 'water') {
    const off = d * 0.7;
    diamond(p.x, p.y + off, hw, hh, C(((x + y) & 1) ? '#74d0e6' : '#6fcbe2'));
    if (!noWaves && hasWave(x, y)) drawWave(x, y, p, z, now);
    return;
  }
  const look = terraLook(x, y), park = look === 'park', beach = look === 'sand' || (ter === 'grass' && look !== 'wiese' && !park && isBeach(x, y));
  poly([[p.x - hw, p.y], [p.x, p.y + hh], [p.x, p.y + hh + d], [p.x - hw, p.y + d]], C(beach ? '#e6cf97' : '#caa26c'));
  poly([[p.x, p.y + hh], [p.x + hw, p.y], [p.x + hw, p.y + d], [p.x, p.y + hh + d]], C(beach ? '#d4ba7f' : '#b0895a'));
  const alt = (x + y) & 1;
  const top = park ? ((x & 1) ? '#86d466' : '#6cbc4f')             // Parkrasen: gemähte Streifen
            : beach ? (alt ? '#f6e6b8' : '#f1dfae')
            : ter === 'grass' ? (alt ? '#96d56f' : '#8dcd67')
            : ter === 'forest' ? (alt ? '#7fc460' : '#79bd5a')
            : ter === 'obst' ? (alt ? '#8fcb62' : '#86c35b')
            : ter === 'erz' ? (alt ? '#b9ab8f' : '#b0a287')
            : ter === 'kristall' ? (alt ? '#bccad3' : '#b3c2cc')
            : (alt ? '#b3c29c' : '#aabb94');
  diamond(p.x, p.y, hw, hh, C(top));
  if (park) {                                                     // Rand der Parkfläche: feine dunklere Kante nach innen versetzt
    const T = [p.x, p.y - hh], R = [p.x + hw, p.y], B = [p.x, p.y + hh], L = [p.x - hw, p.y], k = 0.12;
    g.strokeStyle = C('#4f9a3c'); g.lineWidth = 1.1 * z; g.lineCap = 'butt'; g.beginPath();
    for (const [dx, dy, a, b] of [[1, 0, R, B], [-1, 0, T, L], [0, 1, B, L], [0, -1, T, R]]) {
      if (terraLook(x + dx, y + dy) === 'park') continue;
      const ox = (p.x - (a[0] + b[0]) / 2) * k, oy = (p.y - (a[1] + b[1]) / 2) * k;   // parallel nach innen: gerade Ränder bleiben gerade
      g.moveTo(a[0] + ox, a[1] + oy); g.lineTo(b[0] + ox, b[1] + oy);
    }
    g.stroke();
  }
  if (ter === 'grass' && !beach && !park && !COVER.has(x + ',' + y) && hash(x, y, 5) < 0.08) {
    for (let i = 0; i < 3; i++) {
      const u = (hash(x, y, 20 + i) - 0.5) * 0.7, v = (hash(x, y, 30 + i) - 0.5) * 0.7;
      circle(p.x + (u - v) * TW / 2 * z, p.y + (u + v) * TH / 2 * z, 1.8 * z,
        C(FLOWER_COLS[Math.floor(hash(x, y, 40 + i) * FLOWER_COLS.length)]));
    }
  }
  if (beach && hash(x, y, 7) < 0.12) ellipse(p.x + 5 * z, p.y + 2 * z, 2.2 * z, 1.4 * z, C('#ffd9e0'));
}

function tree(x, y, z, v, fruit) {
  ellipse(x, y + 1 * z, 8 * z, 3.5 * z, 'rgba(40,60,20,0.15)');
  g.fillStyle = C('#9b6a44');
  g.fillRect(x - 1.8 * z, y - 9 * z, 3.6 * z, 9 * z);
  const leaf = v < 0.5 ? '#4aa857' : '#55b562';
  circle(x, y - 15 * z, 8.5 * z, C(leaf));
  circle(x + 2.6 * z, y - 12.6 * z, 6 * z, C(shade(leaf, -0.14)));     // Schattenseite
  circle(x - 1.2 * z, y - 16.5 * z, 6 * z, C(leaf));
  circle(x - 3.5 * z, y - 18 * z, 4.5 * z, C('#74cc7a'));
  if (fruit || v > 0.75) {
    const f = fruit || '#ff6b5e';
    circle(x + 4 * z, y - 12 * z, 1.8 * z, C(f));
    circle(x - 2 * z, y - 10 * z, 1.8 * z, C(f));
    circle(x + 1 * z, y - 19 * z, 1.8 * z, C(f));
    circle(x + 5 * z, y - 18 * z, 1.8 * z, C(f));
  }
}
function drawForest(px, py, z, x, y, n, fruit) {
  const spots = [[-0.22, -0.18], [0.2, -0.2], [0.0, 0.18]].slice(0, n);
  for (const [u, v] of spots) {
    const ju = u + (hash(x, y, 60 + u * 10) - 0.5) * 0.12, jv = v + (hash(x, y, 70 + v * 10) - 0.5) * 0.12;
    const h = hash(x, y, 80 + u * 7 + v * 3);
    tree(px + (ju - jv) * TW / 2 * z, py + (ju + jv) * TH / 2 * z, z, h,
      fruit ? (h < 0.33 ? '#ff6b5e' : h < 0.66 ? '#ffb13b' : '#b07ad6') : null);
  }
}
function boulder(x, y, r, gold) {
  ellipse(x, y + r * 0.35, r * 1.05, r * 0.4, 'rgba(40,40,40,0.12)');
  ellipse(x, y - r * 0.35, r, r * 0.8, C('#a7abb6'));
  ellipse(x - r * 0.25, y - r * 0.6, r * 0.5, r * 0.35, C('#d2d5de'));
  if (gold) {
    circle(x + r * 0.3, y - r * 0.3, r * 0.16, C('#f2c14e'));
    circle(x - r * 0.1, y - r * 0.1, r * 0.12, C('#f2c14e'));
    circle(x + r * 0.05, y - r * 0.7, r * 0.1, C('#ffe28a'));
  }
}
// Kristallfels: bläuliche Felsen, aus denen Kristalle wachsen
function drawCrystalRocks(px, py, z, x, y) {
  boulder(px - 8 * z, py - 1 * z, 6.5 * z);
  boulder(px + 9 * z, py + 2 * z, 5 * z);
  crystal(px - 1 * z, py + 2 * z, z, 15 * z, 3.4 * z, 0.08);
  crystal(px + 5 * z, py + 4 * z, z, 9 * z, 2.6 * z, 0.3);
  crystal(px - 6 * z, py + 3.5 * z, z, 8 * z, 2.4 * z, -0.3);
  if (hash(x, y, 91) < 0.5) crystal(px + 10 * z, py - 4 * z, z, 7 * z, 2.2 * z, 0.2);
}
function drawRocks(px, py, z, x, y, gold) {
  boulder(px - 7 * z, py - 1 * z, 7 * z, gold);
  boulder(px + 8 * z, py + 1 * z, 5.5 * z, gold);
  if (hash(x, y, 90) < 0.5) boulder(px + 1 * z, py + 6 * z, 4 * z, gold);
}
