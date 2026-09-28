'use strict';
// ---------------------------------------------------------------------------
// Die Insel (Rauschen mit festem Startwert)
// ---------------------------------------------------------------------------
function hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s + state.seed) | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) {
  let a = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < 4; i++) { a += amp * vnoise(x * f, y * f, s + i * 101); n += amp; amp *= 0.5; f *= 2; }
  return a / n;
}
const islandDist = (x, y) => Math.hypot(x - ISLAND.cx, y - ISLAND.cy) / ISLAND.r;
function isSea(x, y) {
  return islandDist(x, y) + (fbm(x * 0.08, y * 0.08, 1) - 0.5) * 0.5 > 0.95;
}
function baseTerrain(x, y) {
  const k = x + ',' + y;
  let t = terrainCache.get(k);
  if (t) return t;
  const d = islandDist(x, y);
  if (isSea(x, y)) t = 'water';
  else if (d < 0.12) t = 'grass';                                     // Startplatz frei halten
  else if (fbm(x * 0.12, y * 0.12, 300) < 0.3) t = 'water';           // Seen
  else if (fbm(x * 0.1, y * 0.1, 500) > 0.65) t = 'rock';
  else if (fbm(x * 0.08, y * 0.08, 900) > 0.56) t = 'forest';
  else t = 'grass';
  terrainCache.set(k, t);
  return t;
}
function terrainAt(x, y) { return state.terra.get(x + ',' + y) || baseTerrain(x, y); }
function isBeach(x, y) {
  const k = x + ',' + y;
  let v = sandCache.get(k);
  if (v === undefined) {
    v = !isSea(x, y) && (isSea(x + 1, y) || isSea(x - 1, y) || isSea(x, y + 1) || isSea(x, y - 1));
    sandCache.set(k, v);
  }
  return v;
}

// Sehenswürdigkeiten ringsum verteilen (einmal pro neuer Insel)
function placeLandmarks() {
  const types = Object.keys(LANDMARKS);
  const off = hash(1, 2, 777) * Math.PI * 2;
  types.sort((a, b) => hash(a.length, b.length, a.charCodeAt(0) * 7 + b.charCodeAt(1)) - 0.5);
  types.forEach((type, i) => {
    const ang = off + i / types.length * Math.PI * 2;
    const r = (type === 'klippe' ? 0.82 : 0.42 + 0.3 * hash(i, 0, 778)) * ISLAND.r;
    const tx = Math.round(ISLAND.cx + Math.cos(ang) * r), ty = Math.round(ISLAND.cy + Math.sin(ang) * r);
    let spot = null;
    for (let rr = 0; rr < 8 && !spot; rr++)
      for (let dy = -rr; dy <= rr && !spot; dy++) for (let dx = -rr; dx <= rr && !spot; dx++) {
        const x = tx + dx, y = ty + dy;
        if (!isSea(x, y) && !isSea(x + 1, y) && !isSea(x, y + 1) && !state.tiles.has(x + ',' + y)) spot = [x, y];
      }
    if (!spot) return;
    const [x, y] = spot;
    // Umgebung: Zugang freimachen, Rohstoffe verteilen
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const ax = x + dx, ay = y + dy, dist = Math.hypot(dx, dy);
      if (isSea(ax, ay) || (dx === 0 && dy === 0)) continue;
      const k = ax + ',' + ay;
      if (type === 'erzberg' && dist <= 2.6 && dist > 1) state.terra.set(k, 'erz');
      else if (type === 'obsthain' && dist <= 2.6 && dist > 1) state.terra.set(k, 'obst');
      else if (type === 'kristall' && dist <= 1.6 && dist > 1) state.terra.set(k, 'rock');
      else if (dist <= 1) state.terra.set(k, 'grass');
    }
    state.terra.set(x + ',' + y, 'grass');
    state.tiles.set(x + ',' + y, { b: 'lm', lm: type, lvl: 1 });
  });
}

const chunkOf = (x, y) => Math.floor(x / CHUNK) + ',' + Math.floor(y / CHUNK);
const ownedTile = (x, y) => state.owned.has(chunkOf(x, y));
function chunkLand(ck) {
  let n = landCache.get(ck);
  if (n == null) {
    const [cx, cy] = ck.split(',').map(Number);
    n = 0;
    for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++)
      for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) if (!isSea(x, y)) n++;
    landCache.set(ck, n);
  }
  return n;
}
function onIsland(ck) {
  const [cx, cy] = ck.split(',').map(Number);
  return cx >= ISLAND.cMin && cx <= ISLAND.cMax && cy >= ISLAND.cMin && cy <= ISLAND.cMax && chunkLand(ck) >= 3;
}
function purchasable(ck) {
  if (state.owned.has(ck) || !onIsland(ck)) return false;
  const [cx, cy] = ck.split(',').map(Number);
  return state.owned.has((cx + 1) + ',' + cy) || state.owned.has((cx - 1) + ',' + cy) ||
         state.owned.has(cx + ',' + (cy + 1)) || state.owned.has(cx + ',' + (cy - 1));
}
const plotPrice = () => Math.round(100 * Math.pow(1.28, state.owned.size - 1) / 10) * 10;
