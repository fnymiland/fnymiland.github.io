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
const homeLand = (x, y) => islandDist(x, y) + (fbm(x * 0.08, y * 0.08, 1) - 0.5) * 0.5 <= 0.95;   // wie früher
function isleLand(i, x, y) {
  const R = i.r || ISLE_R, d = Math.hypot(x - i.cx, y - i.cy);          // ferne Inseln haben ihre eigene Größe
  if (d > R * 1.5) return false;
  return d / R + (fbm(x * 0.15, y * 0.15, 17 + i.deg) - 0.5) * 0.6 <= 0.95;
}
// Zu welcher Insel gehört das Feld? 'home', die id einer Themen-Insel, oder null (Meer)
function islandAt(x, y) {
  if (homeLand(x, y)) return 'home';
  for (const i of ISLES) if (isleLand(i, x, y)) return i.id;
  for (const i of FAR) if (isleLand(i, x, y)) return i.id;
  return null;
}
function isSea(x, y) { return islandAt(x, y) === null; }
// Gelände der Themen-Inseln: Lichtung um die Sehenswürdigkeit, ringsum die Mischung der Insel
function isleTerrain(i, x, y) {
  if (Math.hypot(x - i.cx, y - i.cy) < 3.4) return 'grass';
  const n1 = fbm(x * 0.18, y * 0.18, 40 + i.deg), n2 = fbm(x * 0.25, y * 0.25, 90 + i.deg);
  switch (i.ter) {
    case 'wald': return n1 > 0.4 ? 'forest' : n2 < 0.3 ? 'water' : 'grass';
    case 'obst': return n1 > 0.44 ? 'obst' : n2 > 0.7 ? 'forest' : 'grass';
    case 'fels': return n1 > 0.52 ? 'rock' : n2 > 0.72 ? 'forest' : 'grass';
    case 'ruine': return n1 > 0.64 ? 'rock' : n2 > 0.68 ? 'forest' : 'grass';
    case 'erz': return n1 > 0.58 ? 'erz' : n1 > 0.44 ? 'rock' : 'grass';
    case 'quelle': return n2 < 0.32 ? 'water' : n1 > 0.7 ? 'forest' : 'grass';
    case 'kristall': return n1 > 0.5 ? (n2 > 0.5 ? 'kristall' : 'rock') : 'grass';
    case 'wiese': return n1 > 0.64 ? 'forest' : n2 < 0.24 ? 'water' : 'grass';          // ferne Wieseninseln
    default: return 'grass';
  }
}
function baseTerrain(x, y) {
  const k = x + ',' + y;
  let t = terrainCache.get(k);
  if (t) return t;
  const d = islandDist(x, y), isle = islandAt(x, y);
  if (!isle) t = 'water';
  else if (isle !== 'home') t = isleTerrain(ISLE_BY_ID[isle], x, y);
  else if (d < 0.12) t = 'grass';                                     // Startplatz frei halten
  else if (fbm(x * 0.12, y * 0.12, 300) < 0.3) t = 'water';           // Seen
  else if (fbm(x * 0.1, y * 0.1, 500) > 0.65) t = 'rock';
  else if (fbm(x * 0.08, y * 0.08, 900) > 0.56) t = 'forest';
  else t = 'grass';
  terrainCache.set(k, t);
  return t;
}
// Terraforming: 'sand' (Strand), 'wiese' (Wiese, die nie Strand wird) und 'park' (Parkrasen) sehen anders aus, zählen aber als Wiese
function terrainAt(x, y) { const v = state.terra.get(x + ',' + y); return v ? (v === 'sand' || v === 'wiese' || v === 'park' ? 'grass' : v) : baseTerrain(x, y); }
const terraLook = (x, y) => state.terra.get(x + ',' + y);
function isBeach(x, y) {
  const k = x + ',' + y;
  let v = sandCache.get(k);
  if (v === undefined) {
    const sea = (a, b) => isSea(a, b) && terrainAt(a, b) === 'water';     // aufgeschüttetes Meer ist kein Meer mehr
    v = terrainAt(x, y) !== 'water' && (sea(x + 1, y) || sea(x - 1, y) || sea(x, y + 1) || sea(x, y - 1));
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
    // Der Uralte Baum steht direkt am Dorfrand (Grundstück gleich nebenan) – dort beginnt die Einführung
    const tx = type === 'baum' ? 9 : Math.round(ISLAND.cx + Math.cos(ang) * r);
    const ty = type === 'baum' ? 3 : Math.round(ISLAND.cy + Math.sin(ang) * r);
    // 3×3 Felder, ganz in einem Grundstück, nicht im Meer, nichts anderes im Weg
    const fits = (x, y) => {
      const mx = ((x % CHUNK) + CHUNK) % CHUNK, my = ((y % CHUNK) + CHUNK) % CHUNK;
      if (mx > CHUNK - 3 || my > CHUNK - 3) return false;
      for (const [fx, fy] of footprint('lm', x, y, 0)) {
        if (isSea(fx, fy) || isSea(fx + 1, fy) || isSea(fx, fy + 1)) return false;
        for (const [k, t] of state.tiles) { const [ax, ay] = keyXY(k); if (footprint(t.b, ax, ay, t.rot, t).some(([px, py]) => px === fx && py === fy)) return false; }
      }
      return true;
    };
    let spot = null;
    for (let rr = 0; rr < 8 && !spot; rr++)
      for (let dy = -rr; dy <= rr && !spot; dy++) for (let dx = -rr; dx <= rr && !spot; dx++) if (fits(tx + dx, ty + dy)) spot = [tx + dx, ty + dy];
    if (!spot) return;
    const [x, y] = spot;
    // Umgebung (gemessen von der Mitte der 3×3 Felder): Zugang freimachen, Rohstoffe verteilen
    for (let dy = -3; dy <= 5; dy++) for (let dx = -3; dx <= 5; dx++) {
      const ax = x + dx, ay = y + dy, dist = Math.hypot(dx - 1, dy - 1);
      if (isSea(ax, ay)) continue;
      const k = ax + ',' + ay;
      if (dist <= 2.2) state.terra.set(k, 'grass');
      else if (type === 'erzberg' && dist <= 3.7) state.terra.set(k, 'erz');
      else if (type === 'obsthain' && dist <= 3.7) state.terra.set(k, 'obst');
      else if (type === 'kristall' && dist <= 2.9) state.terra.set(k, 'rock');
    }
    state.tiles.set(x + ',' + y, { b: 'lm', lm: type, lvl: 1 });
  });
}

// Die Sehenswürdigkeiten stehen (3×3) in der Mitte ihrer Themen-Insel
const isleAnchor = i => [Math.round(i.cx) - 1, Math.round(i.cy) - 1];
function placeIslandLandmarks() {
  for (const i of ISLES) {
    const [x, y] = isleAnchor(i);
    for (const [fx, fy] of footprint('lm', x, y, 0)) state.terra.delete(fx + ',' + fy);
    state.tiles.set(x + ',' + y, { b: 'lm', lm: i.lm, lvl: 1 });
  }
}
// Alle Grundstücke (6×6), auf denen Land der Insel liegt
function isleChunks(id) {
  const out = [];
  // Heimatinsel: Land reicht mit dem Rauschen bis 1,25 × Radius (vorher fehlte der äußerste Rand)
  const box = id === 'home' ? (() => { const r = ISLAND.r * 1.25; return [Math.floor((ISLAND.cx - r) / CHUNK), Math.floor((ISLAND.cx + r) / CHUNK), Math.floor((ISLAND.cy - r) / CHUNK), Math.floor((ISLAND.cy + r) / CHUNK)]; })() : (() => {
    const i = ISLE_BY_ID[id], r = (i.r || ISLE_R) * 1.5;
    return [Math.floor((i.cx - r) / CHUNK), Math.floor((i.cx + r) / CHUNK), Math.floor((i.cy - r) / CHUNK), Math.floor((i.cy + r) / CHUNK)];
  })();
  for (let cy = box[2]; cy <= box[3]; cy++) for (let cx = box[0]; cx <= box[1]; cx++) {
    let has = false;
    for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK && !has; y++)
      for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK && !has; x++) if (islandAt(x, y) === id) has = true;
    if (has) out.push(cx + ',' + cy);
  }
  return out;
}
function ownIsland(id) { for (const ck of isleChunks(id)) state.owned.add(ck); }
// Beim Laden: erschlossene Inseln ganz besitzen (alte Stände hatten den Rand der Heimatinsel nicht)
function ownIslandsFully() { for (const id of state.islands) ownIsland(id); }
// Meer gehört niemandem: dort heißt es nie „nicht dein Grundstück“
const notMine = (x, y) => isSea(x, y) ? 'Nicht auf dem Wasser' : 'Das ist nicht dein Grundstück';
const inWorld = (x, y) => { const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK); return cx >= WORLD.cMin && cx <= WORLD.cMax && cy >= WORLD.cMin && cy <= WORLD.cMax; };
const isleOf = (x, y) => { const id = islandAt(x, y); return id && id !== 'home' ? ISLE_BY_ID[id] : null; };

const chunkOf = (x, y) => Math.floor(x / CHUNK) + ',' + Math.floor(y / CHUNK);
const ownedTile = (x, y) => state.owned.has(chunkOf(x, y)) || state.claimed.has(x + ',' + y);
// Offenes Meer, das man sich nehmen kann (Aufschütten, Brücke): keine Insel, noch nicht eigen, direkt neben eigenem
// Land und innerhalb der Welt – so wächst das Land Schritt für Schritt, auf Wunsch bis zur Megainsel
function claimable(x, y) {
  if (ownedTile(x, y) || !isSea(x, y)) return false;
  return DIRS.some(([dx, dy]) => ownedTile(x + dx, y + dy));
}
// Die Welt wächst mit (Block 27): eigenes Land im Meer und ferne Inseln, drumherum WORLD_MARGIN Grundstücke Meer.
// Die Kamera darf bis WORLD.R Felder von der Heimatinsel weg.
const WORLD_MARGIN = 3;
function worldInclude(x, y, r = 0) {
  const lo = Math.floor((Math.min(x, y) - r) / CHUNK) - WORLD_MARGIN, hi = Math.floor((Math.max(x, y) + r) / CHUNK) + WORLD_MARGIN;
  if (lo < WORLD.cMin) WORLD.cMin = lo;
  if (hi > WORLD.cMax) WORLD.cMax = hi;
  WORLD.R = Math.max(WORLD.R, Math.hypot(x - ISLAND.cx, y - ISLAND.cy) + r + 8);
}
function growWorld() {
  WORLD.cMin = WORLD_BASE.cMin; WORLD.cMax = WORLD_BASE.cMax; WORLD.R = ISLE_DIST + ISLE_R;
  for (const k of state.claimed) worldInclude(...keyXY(k));
  for (const i of FAR) worldInclude(i.cx, i.cy, i.r * 1.5);
}
// Wie tief ist das Meer hier? Abstand zur nächsten natürlichen Küste (grob: die Kreise der Inseln). Bis DEEP_FROM
// Felder ist es flach; danach kostet Aufschütten immer mehr, und das Wasser wird dunkler.
const DEEP_FROM = 6, DEEP_STEP = 6;
function seaDepth(x, y) {
  let d = Math.hypot(x - ISLAND.cx, y - ISLAND.cy) - ISLAND.r * 0.95;
  for (const i of ISLES) d = Math.min(d, Math.hypot(x - i.cx, y - i.cy) - ISLE_R * 0.95);
  for (const i of FAR) d = Math.min(d, Math.hypot(x - i.cx, y - i.cy) - i.r * 0.95);
  return Math.max(0, d);
}
// Preis fürs Aufschütten: 60 Taler im Flachen, danach (1 + (Tiefe über 6 / 6)³)-mal so viel
function fillCost(x, y) {
  const base = ITEMS.schuett.cost;
  if (!isSea(x, y)) return base;
  const over = Math.max(0, seaDepth(x, y) - DEEP_FROM) / DEEP_STEP;
  return over > 0 ? niceRound(base * (1 + over * over * over)) : base;
}
// Wie dunkel das Wasser hier ist (0 = normal): nur offenes Meer, das nicht aufgeschüttet ist
function depthAlpha(x, y) {
  const d = seaDepth(x, y);
  if (d <= DEEP_FROM) return 0;
  const t = state.terra.get(x + ',' + y);
  if (t && t !== 'water') return 0;
  const f = Math.min(1, (d - DEEP_FROM) / 40);
  return 0.42 * f * (2 - f);
}
const CLAIM_TOOLS = new Set(['schuett', 'schiene']);
// Wasserfeld am eigenen Ufer – auch schräg (Ecke an Ecke): an gezackten Küsten sieht das genauso nach „Ufer“ aus
const NEAR8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const nearOwnLand = (x, y) => NEAR8.some(([dx, dy]) => ownedTile(x + dx, y + dy) && terrainAt(x + dx, y + dy) !== 'water');
// Offshore (Block 48): bis r Felder vom eigenen Land (Ecke an Ecke gezählt)
const OFFSHORE_REACH = 6;
function landWithin(x, y, r) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if ((dx || dy) && ownedTile(x + dx, y + dy) && terrainAt(x + dx, y + dy) !== 'water') return true;
  return false;
}
// Zu welchem Ort gehört ein Feld? Insel-id bzw. 'home'; aufgeschüttetes Meer zählt zur nächsten Insel
const regionCache = new Map();
function regionAt(x, y) {
  const k = x + ',' + y;
  let r = regionCache.get(k);
  if (r) return r;
  r = islandAt(x, y);
  if (!r) {
    let best = Math.hypot(x - ISLAND.cx, y - ISLAND.cy) - ISLAND.r;
    r = 'home';
    for (const i of ISLES) { const d = Math.hypot(x - i.cx, y - i.cy) - ISLE_R; if (d < best) { best = d; r = i.id; } }
    for (const i of FAR) { const d = Math.hypot(x - i.cx, y - i.cy) - i.r; if (d < best) { best = d; r = i.id; } }
  }
  regionCache.set(k, r);
  return r;
}
const regionName = r => r === 'home' ? 'Heimatinsel' : ISLE_BY_ID[r].name;
// Reihenfolge der Orte: Heimatinsel, Themen-Inseln, ferne Inseln (in der Reihenfolge ihres Auftauchens)
const regionRank = r => r === 'home' ? -1 : ISLE_BY_ID[r] && ISLE_BY_ID[r].far ? 100 + ISLE_BY_ID[r].n : ISLES.findIndex(i => i.id === r);
function claimTile(x, y) { if (!state.owned.has(chunkOf(x, y))) { state.claimed.add(x + ',' + y); worldInclude(x, y); } }
// Felder von a nach b in Schritten zu direkten Nachbarn (fürs Ziehen: nichts überspringen)
function tilesBetween(a, b) {
  const out = [];
  let x = a.x, y = a.y;
  while (x !== b.x || y !== b.y) {
    const dx = b.x - x, dy = b.y - y;
    if (Math.abs(dx) >= Math.abs(dy)) x += Math.sign(dx); else y += Math.sign(dy);
    out.push([x, y]);
  }
  return out;
}
