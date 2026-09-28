'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Szene
// ---------------------------------------------------------------------------
// Eigene Spieluhr: ein Tag dauert 20 Minuten, beginnt beim Öffnen morgens.
// 15 Min Tag, 1 Min Dämmerung, 3 Min Nacht (die Laternen leuchten), 1 Min Morgengrauen.
const DAY_MS = 20 * 60e3, NIGHT_MAX = 0.45;
function nightAt(ms) {
  const m = (((ms % DAY_MS) + DAY_MS) % DAY_MS) / 60e3;
  if (m < 15) return 0;
  if (m < 16) return (m - 15) * NIGHT_MAX;
  if (m < 19) return NIGHT_MAX;
  return (20 - m) * NIGHT_MAX;
}
// ?stunde=N erzwingt eine Uhrzeit (Probeansicht)
function nightLevel(d) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 18) return 0;
  if (h >= 18 && h < 21) return (h - 18) / 3 * 0.45;
  if (h >= 5 && h < 7) return (7 - h) / 2 * 0.45;
  return 0.45;
}
const forcedHour = (() => {
  const s = new URLSearchParams(location.search).get('stunde');
  return s == null ? null : +s;
})();
function clockNow() {
  const d = new Date();
  if (forcedHour != null) d.setHours(forcedHour, 0);
  return d;
}

function pill(text, x, y, bg, fg, size) {
  g.font = `900 ${size}px Nunito, system-ui, sans-serif`;
  const w = g.measureText(text).width + size * 1.2, h = size * 1.7;
  g.fillStyle = 'rgba(107,79,58,0.25)';
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2 + 3, w, h, h / 2); g.fill();
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, y + 1);
}

function chunkCorners(ck) {
  const [cx, cy] = ck.split(',').map(Number);
  const x0 = cx * CHUNK - 0.5, y0 = cy * CHUNK - 0.5, x1 = x0 + CHUNK, y1 = y0 + CHUNK;
  return { n: [toScreen(x0, y0), toScreen(x1, y0)], e: [toScreen(x1, y0), toScreen(x1, y1)],
           s: [toScreen(x1, y1), toScreen(x0, y1)], w: [toScreen(x0, y1), toScreen(x0, y0)] };
}

const confetti = [];
let lastRender = 0;

// ---------------------------------------------------------------------------
// Zwischenspeicher, damit auch große Inseln auf dem iPad flüssig laufen:
// Der Boden jedes Grundstücks (6×6 Felder) wird einmal in ein eigenes Bild gezeichnet und danach nur noch kopiert.
// Neu gezeichnet wird, wenn sich Gelände, Besitz oder Bebauung ändern (groundVersion, erhöht von recalc)
// oder der Zoom deutlich anders ist. Ganz nah dran wird direkt gezeichnet (da sind es nur wenige Felder).
// Waldbäume und Felsen sind fertige kleine Bilder (einige Varianten je Zoomstufe).
// ---------------------------------------------------------------------------
let groundVersion = 0;
const groundCache = new Map();       // ck → { c, b, scale, v, waves, used }
const GROUND_MAX_SCALE = 2.6;         // darüber (nah dran) direkt zeichnen
let frameNo = 0, lastZoom = 0, lastZoomChange = 0;
function chunkBounds(cx, cy) {
  const x0 = cx * CHUNK, y0 = cy * CHUNK, x1 = x0 + CHUNK - 1, y1 = y0 + CHUNK - 1;
  const left = (x0 - y1) * TW / 2 - TW / 2 - 2, right = (x1 - y0) * TW / 2 + TW / 2 + 2;
  const top = (x0 + y0) * TH / 2 - TH / 2 - 2, bottom = (x1 + y1) * TH / 2 + TH / 2 + DEPTH + 4;
  return { left, top, w: right - left, h: bottom - top };
}
const cachedPath = t => t.b === 'weg' && !PATH_LOOK[styleDef('weg', t.style).id].glow;

// Schlagschatten: Die Sonne steht links, jedes Gebäude wirft einen weichen Schatten nach rechts
// (Grundfläche des Hauptbaus, um die Höhe versetzt). Gezeichnet in Weltkoordinaten (Zoom 1).
const SUN = { dx: 0.55, dy: 0.12 };
const SHADOW_COL = 'rgba(30,42,62,0.3)';
const HOUSE_SHADOW = [0, 24, 30, 32, 35, 34];
const SHADOW = {           // Höhe (je Stufe) und Abstand der Hauswand vom Feldrand
  muehle: [[28, 34, 40], 0.3], saege: [22, 0.18], steinmetz: [17, 0.26], schmiede: [19, 0.26], baecker: [[22, 32, 32], 0.2],
  fabrik: [[22, 22, 26], 0.16], schule: [[26, 28, 34], 0.2], bibliothek: [26, 0.2], uni: [30, 0.14], kunst: [[26, 26, 30], 0.2],
  rathaus: [40, 0.4], leuchtturm: [50, 0.37], fischer: [16, 0.3], hafen: [[20, 22, 26], 0.5],
};
const LM_SHADOW = { baum: [44, 0.55], klippe: [34, 0.5], ruine: [20, 0.45], kristall: [26, 0.55], obsthain: [26, 0.55] };
function shadowOf(t, ax, ay) {
  let hgt, inset;
  if (t.b === 'haus') { const look = houseLook(t); hgt = HOUSE_SHADOW[look]; inset = look === 5 ? 0.16 : 0.24; }
  else if (t.b === 'lm') { const s = LM_SHADOW[t.lm]; if (!s) return null; [hgt, inset] = s; }
  else { const s = SHADOW[t.b]; if (!s) return null; hgt = Array.isArray(s[0]) ? s[0][Math.min(t.lvl, 3) - 1] : s[0]; inset = s[1]; }
  const [w, h] = sizeOf(t.b, t.rot), dx = SUN.dx * hgt, dy = SUN.dy * hgt;
  const base = [[ax - 0.5 + inset, ay - 0.5 + inset], [ax + w - 0.5 - inset, ay - 0.5 + inset], [ax + w - 0.5 - inset, ay + h - 0.5 - inset], [ax - 0.5 + inset, ay + h - 0.5 - inset]]
    .map(([x, y]) => { const p = iso(x, y); return [p.x, p.y]; });
  return hull(base.concat(base.map(([x, y]) => [x + dx, y + dy])));
}
function hull(pts) {                      // konvexe Hülle (Monotone Chain)
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// Flache Teile der Gebäude (Plätze, Rasen, Beete) – vor Wegen und Schatten
function drawGroundParts(want, at, z) {
  PASS = 'ground';
  for (const [k, t] of state.tiles) {
    if (!hasGroundPart(t)) continue;
    const [ax, ay] = keyXY(k);
    if (!want([ax, ay])) continue;
    const [w, h] = sizeOf(t.b, t.rot), c = at(ax + (w - 1) / 2, ay + (h - 1) / 2);
    FOG = t.b !== 'lm' && !ownedTile(ax, ay);
    drawObject(t.b, c.x, c.y, z, 0, ax, ay, t.lvl, t);
  }
  FOG = false;
  PASS = null;
}
// alle Schatten als eine Fläche (Überlappungen werden nicht dunkler); want(anker) filtert
function drawShadows(want) {
  g.beginPath();
  for (const [k, t] of state.tiles) {
    const a = keyXY(k);
    if (!want(a)) continue;
    const sh = shadowOf(t, a[0], a[1]);
    if (sh) sh.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    if (sh) g.closePath();
  }
  g.fillStyle = SHADOW_COL;
  g.fill('nonzero');
}
let groundCached = false;           // in diesem Bild kommt der Boden (mit Wegen) aus dem Zwischenspeicher
// Reines Meer sieht auf jedem Grundstück gleich aus (Wellen kommen extra): ein gemeinsames Bild
const seaInfo = new Map();           // ck → { v, sea, waves }
let seaImage = null;
function chunkSea(cx, cy) {
  const ck = cx + ',' + cy;
  let e = seaInfo.get(ck);
  if (!e || e.v !== groundVersion) {
    let sea = !state.owned.has(ck);
    const waves = [];
    for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) {
      const x = cx * CHUNK + i, y = cy * CHUNK + j;
      if (terrainAt(x, y) !== 'water') sea = false;
      else if (hasWave(x, y)) waves.push([x, y]);
    }
    e = { v: groundVersion, sea, waves };
    seaInfo.set(ck, e);
  }
  return e;
}
function renderGroundChunk(cx, cy, scale) {
  const b = chunkBounds(cx, cy), c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(b.w * scale)); c.height = Math.max(1, Math.ceil(b.h * scale));
  const prev = g;
  g = c.getContext('2d');
  g.setTransform(scale, 0, 0, scale, -b.left * scale, -b.top * scale);
  const waves = [];
  for (let s = 0; s <= 2 * (CHUNK - 1); s++) for (let i = 0; i < CHUNK; i++) {
    const j = s - i;
    if (j < 0 || j >= CHUNK) continue;
    const x = cx * CHUNK + i, y = cy * CHUNK + j;
    FOG = !ownedTile(x, y) && terrainAt(x, y) !== 'water';
    drawGround(x, y, iso(x, y), 1, 0, true);
    if (terrainAt(x, y) === 'water' && hasWave(x, y)) waves.push([x, y]);
  }
  FOG = false;
  // Flache Gebäudeteile, Wege und Schlagschatten – auch von Nachbar-Grundstücken, aber nur auf dieses gezeichnet,
  // damit sich nichts doppelt
  const x0 = cx * CHUNK - 0.5, y0 = cy * CHUNK - 0.5, x1 = x0 + CHUNK, y1 = y0 + CHUNK;
  const near = ([ax, ay]) => Math.abs(Math.floor(ax / CHUNK) - cx) <= 1 && Math.abs(Math.floor(ay / CHUNK) - cy) <= 1;
  g.save();
  g.beginPath();
  [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)].forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y));
  g.closePath(); g.clip();
  drawGroundParts(near, iso, 1);
  for (let s = 0; s <= 2 * (CHUNK - 1); s++) for (let i = 0; i < CHUNK; i++) {
    const j = s - i;
    if (j < 0 || j >= CHUNK) continue;
    const x = cx * CHUNK + i, y = cy * CHUNK + j, t = state.tiles.get(x + ',' + y);
    if (t && cachedPath(t)) { const p = iso(x, y); drawPath(p.x, p.y, 1, x, y, t); }
  }
  drawShadows(near);
  g.restore();
  g = prev;
  return { c, b, scale, v: groundVersion, waves, used: frameNo };
}
function drawGroundCached(cMinX, cMaxX, cMinY, cMaxY, z, now) {
  const want = z * DPR, zooming = now - lastZoomChange < 250;
  const order = [];
  for (let cy = cMinY; cy <= cMaxY; cy++) for (let cx = cMinX; cx <= cMaxX; cx++) order.push([cx, cy]);
  order.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const stale = e => { const ratio = want / e.scale; return (!zooming && Math.abs(ratio - 1) > 0.02) || ratio < 0.6 || ratio > 1.6; };
  for (const [cx, cy] of order) {
    const b = chunkBounds(cx, cy);
    const sx = (b.left - cam.x) * z + W / 2, sy = (b.top - cam.y) * z + H / 2;
    if (sx > W || sy > H || sx + b.w * z < 0 || sy + b.h * z < 0) continue;
    const info = chunkSea(cx, cy);
    let img;
    if (info.sea) {
      if (!seaImage || stale(seaImage)) { seaImage = renderGroundChunk(ISLAND.cMax + 50, 0, want); }
      img = seaImage.c;
    } else {
      const ck = cx + ',' + cy;
      let e = groundCache.get(ck);
      if (!e || e.v !== groundVersion || stale(e)) { e = renderGroundChunk(cx, cy, want); groundCache.set(ck, e); }
      e.used = frameNo;
      img = e.c;
    }
    g.drawImage(img, sx, sy, b.w * z, b.h * z);
    for (const [x, y] of info.waves) drawWave(x, y, toScreen(x, y), z, now);
  }
  if (frameNo % 60 === 0) {
    for (const [ck, e] of groundCache) if (frameNo - e.used > 120) groundCache.delete(ck);
    if (seaInfo.size > 400) seaInfo.clear();
  }
}
// Wald- und Felsfelder als fertige Bilder
const spriteCache = new Map();
const SPRITE_BOX = { left: -TW / 2 - 12, top: -46, w: TW + 24, h: 66 };
function tileSprite(kind, x, y, px, py, z) {
  const variants = kind === 'rock' || kind === 'erz' ? 4 : 6;
  const v = Math.floor(hash(x, y, 61) * variants), key = kind + v + (FOG ? 'n' : '');
  const want = z * DPR;
  let e = spriteCache.get(key);
  if (!e || want / e.scale > 1.25 || want / e.scale < 0.8) {
    const c = document.createElement('canvas'), B = SPRITE_BOX;
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const prev = g;
    g = c.getContext('2d');
    g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want);
    const vx = 5000 + v * 7, vy = 5000 + v * 13;
    if (kind === 'forest') drawForest(0, 0, 1, vx, vy, 3);
    else if (kind === 'obst') drawForest(0, 0, 1, vx, vy, 3, true);
    else drawRocks(0, 0, 1, vx, vy, kind === 'erz');
    g = prev;
    e = { c, scale: want };
    spriteCache.set(key, e);
  }
  const B = SPRITE_BOX;
  g.drawImage(e.c, px + B.left * z, py + B.top * z, B.w * z, B.h * z);
}
// Nachtlicht: ein vorgezeichneter weicher Lichtfleck statt eines Farbverlaufs pro Fenster
let glowSprite = null;
function glowImage() {
  if (glowSprite) return glowSprite;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'), grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,205,100,1)'); grd.addColorStop(1, 'rgba(255,205,100,0)');
  x.fillStyle = grd; x.fillRect(0, 0, 64, 64);
  return (glowSprite = c);
}

function render(now) {
  g = ctx;
  cam = state.cam;
  const z = cam.z;
  const dt = Math.min(0.1, (now - (lastRender || now)) / 1000);
  lastRender = now;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#6fcbe2';
  ctx.fillRect(0, 0, W, H);
  night = forcedHour != null ? nightLevel(clockNow()) : nightAt(performance.now());
  glows.length = 0;
  frameNo++;
  if (z !== lastZoom) { lastZoom = z; lastZoomChange = now; }

  const cs = [toTile(0, 0), toTile(W, 0), toTile(0, H), toTile(W, H)];
  groundCached = z * DPR <= GROUND_MAX_SCALE && isLive();
  let minX = Math.min(...cs.map(c => c.x)) - 2, maxX = Math.max(...cs.map(c => c.x)) + 6;
  let minY = Math.min(...cs.map(c => c.y)) - 2, maxY = Math.max(...cs.map(c => c.y)) + 6;
  // Außerhalb der Insel steht nichts: dort nur den Boden aus dem Zwischenspeicher, keine Felder durchgehen
  const cMinX = Math.floor(minX / CHUNK) - 1, cMaxX = Math.floor(maxX / CHUNK) + 1;
  const cMinY = Math.floor(minY / CHUNK) - 1, cMaxY = Math.floor(maxY / CHUNK) + 1;
  if (groundCached) {
    minX = Math.max(minX, ISLAND.cMin * CHUNK - 1); maxX = Math.min(maxX, (ISLAND.cMax + 1) * CHUNK);
    minY = Math.max(minY, ISLAND.cMin * CHUNK - 1); maxY = Math.min(maxY, (ISLAND.cMax + 1) * CHUNK);
  }
  const mX = TW * z, mTop = 110 * z, mBot = TH * z;
  const visible = [];
  for (let s = minX + minY; s <= maxX + maxY; s++) {
    for (let x = Math.max(minX, s - maxY); x <= Math.min(maxX, s - minY); x++) {
      const y = s - x, p = toScreen(x, y);
      if (p.x < -mX || p.x > W + mX || p.y < -mBot || p.y > H + mTop) continue;
      visible.push(x, y, p.x, p.y);
    }
  }

  // 1) Boden, Wege und Schlagschatten (weiter weg alles aus dem Zwischenspeicher)
  if (groundCached) drawGroundCached(cMinX, cMaxX, cMinY, cMaxY, z, now);
  else for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1];
    FOG = !ownedTile(x, y) && terrainAt(x, y) !== 'water';
    drawGround(x, y, { x: visible[i + 2], y: visible[i + 3] }, z, now);
  }
  FOG = false;
  const visRange = ([ax, ay]) => ax >= minX - 3 && ax <= maxX + 1 && ay >= minY - 3 && ay <= maxY + 1;
  if (!groundCached) drawGroundParts(visRange, toScreen, z);
  // Wege immer vor allem anderen (sie liegen flach); aus dem Zwischenspeicher fehlen nur die leuchtenden
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], t = state.tiles.get(x + ',' + y);
    if (!t || t.b !== 'weg' || (groundCached && cachedPath(t))) continue;
    FOG = !ownedTile(x, y);
    drawPath(visible[i + 2], visible[i + 3], z, x, y, t);
  }
  FOG = false;
  if (!groundCached) {
    g.save();
    g.setTransform(DPR * z, 0, 0, DPR * z, (W / 2 - cam.x * z) * DPR, (H / 2 - cam.y * z) * DPR);
    drawShadows(visRange);
    g.restore();
  }

  // 2) Grundstücksgrenzen
  const forSale = [];
  g.lineCap = 'round';
  for (let cy = cMinY; cy <= cMaxY; cy++) for (let cx = cMinX; cx <= cMaxX; cx++) {
    const ck = cx + ',' + cy;
    if (!state.owned.has(ck)) { if (purchasable(ck)) forSale.push(ck); continue; }
    const c = chunkCorners(ck);
    g.strokeStyle = 'rgba(255,248,215,0.9)';
    g.lineWidth = 2.5 * z;
    g.setLineDash([6 * z, 6 * z]);
    for (const [side, nk] of [['n', cx + ',' + (cy - 1)], ['s', cx + ',' + (cy + 1)], ['w', (cx - 1) + ',' + cy], ['e', (cx + 1) + ',' + cy]]) {
      if (state.owned.has(nk)) continue;
      g.beginPath(); g.moveTo(c[side][0].x, c[side][0].y); g.lineTo(c[side][1].x, c[side][1].y); g.stroke();
    }
    g.setLineDash([]);
  }
  if (hoverChunk && tool === 'look' && purchasable(hoverChunk)) {
    const c = chunkCorners(hoverChunk);
    g.beginPath();
    g.moveTo(c.n[0].x, c.n[0].y); g.lineTo(c.e[0].x, c.e[0].y); g.lineTo(c.s[0].x, c.s[0].y); g.lineTo(c.w[0].x, c.w[0].y);
    g.closePath();
    g.fillStyle = 'rgba(255,215,94,0.22)'; g.fill();
    g.strokeStyle = '#f2b53a'; g.lineWidth = 3 * z; g.stroke();
  }

  // 3) Vorschau-Rahmen (bei großen Gebäuden die ganze Grundfläche)
  let preview = null;
  const outline = (ax, ay, w, h, ok) => {
    const c = [toScreen(ax - 0.5, ay - 0.5), toScreen(ax + w - 0.5, ay - 0.5), toScreen(ax + w - 0.5, ay + h - 0.5), toScreen(ax - 0.5, ay + h - 0.5)];
    g.strokeStyle = ok ? '#3fbf6f' : '#e5484d';
    g.lineWidth = 3 * z;
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); g.stroke();
    return toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2);
  };
  const objBox = (x, y) => {           // Grundfläche des Objekts unter dem Zeiger
    const a = anchorAt(x, y);
    if (!a) return [x, y, 1, 1];
    const t = state.tiles.get(a), [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot);
    return [ax, ay, w, h];
  };
  const ghostType = tool === 'verschieben' ? movingType() : tool;
  const smallMode = tool === 'verschieben' ? !!moving && moving.kind === 'deco' : !!(ITEMS[tool] && ITEMS[tool].small);
  if (hover && tool !== 'look' && ownedTile(hover.x, hover.y)) {
    const hx = hover.x, hy = hover.y;
    const hds = decosAt(hx + ',' + hy);
    const rotOf = b => placeRot(b, hx, hy);
    let box = [hx, hy, 1, 1];
    if (tool === 'verschieben' && !moving) {
      const has = (hds && hds[hoverSlot]) || anchorAt(hx, hy);
      if (!(hds && hds[hoverSlot])) box = objBox(hx, hy);
      preview = { ok: !!has, text: has ? 'Aufnehmen' : 'Hier ist nichts' };
    } else if (smallMode) {
      const err = tool === 'verschieben' ? moveError(hx, hy, hoverSlot) : smallError(tool, hx, hy, hoverSlot);
      preview = { ok: !err, small: !err || err === 'Zu wenig Taler', text: err || (tool === 'verschieben' ? 'Hierhin' : `🌸 +${ITEMS[tool].beauty}`) };
    } else if (tool === 'verschieben') {
      const err = moveError(hx, hy, hoverSlot), [w, h] = sizeOf(ghostType, rotOf(ghostType));
      box = [hx, hy, w, h];
      preview = { ok: !err, ghost: !err || true, text: err || 'Hierhin' };
    } else if (tool === 'abriss' && hds && hds[hoverSlot]) {
      const it = ITEMS[hds[hoverSlot].b];
      preview = { ok: true, text: `${it.name} entfernen: +${fmt(it.cost)}` };
    } else if (tool === 'weg' && bAt(hx, hy) === 'weg') {
      const cur = styleDef('weg', objAt(hx, hy).style), nx = styleDef('weg', currentStyle('weg'));
      preview = { ok: cur.id !== nx.id, text: cur.id === nx.id ? nx.name : `Umfärben: ${cur.name} → ${nx.name}` };
    } else if (tool === 'abriss') {
      const info = demolishInfo(hx, hy);
      box = objBox(hx, hy);
      preview = { ok: !info.err, text: info.err || (info.refund != null ? `${info.label}: +${fmt(info.refund)}` : `${info.label}: −${fmt(info.cost)}`) };
    } else {
      const err = placeError(tool, hx, hy);
      const d = ITEMS[tool], [w, h] = sizeOf(tool, rotOf(tool));
      box = [hx, hy, w, h];
      let text = err;
      if (!err) {
        if (d.cat === 'land' || d.ground) text = `${d.name}: −${fmt(d.cost)}`;
        else if (tool === 'weg') text = styleDef('weg', currentStyle('weg')).name;
        else {
          const pv = previewDelta(tool, hx, hy), parts = [];
          if (needsReach(tool) && pv.how === 'weit') parts.push('🐌 weit weg: 50 %');
          if (Math.abs(pv.inc) >= 0.05) parts.push(`${pv.inc > 0 ? '+' : ''}${fmtRate(pv.inc)}/s`);
          if (Math.abs(pv.sci) >= 0.05) parts.push(`💡 +${fmtRate(pv.sci)}`);
          if (pv.prod) for (const [r, v] of Object.entries(pv.prod)) parts.push(`${RES[r].icon} +${fmtRate(v * 60)}/min`);
          if (pv.conv) parts.push(`${RES[d.conv.to].icon} bis ${fmtRate(pv.conv * 60)}/min`);
          if (pv.beauty) parts.push(`🌸 ${pv.beauty > 0 ? '+' : ''}${pv.beauty}`);
          if (pv.pop) parts.push(`👥 +${pv.pop}`);
          if (pv.bonus) parts.push(`🏘️ +${Math.round(pv.bonus * 100)} %`);
          text = parts.join('  ') || d.name;
        }
      }
      const free = footprint(tool, hx, hy, rotOf(tool)).every(([fx, fy]) => !COVER.has(fx + ',' + fy) && terrainAt(fx, fy) !== 'water');
      preview = { ok: !err, ghost: d.cat !== 'land' && !d.ground && free, text };
    }
    preview.p = outline(box[0], box[1], box[2], box[3], preview.ok);
    preview.box = box;
  }
  const ghostFront = preview && preview.ghost ? [preview.box[0] + preview.box[2] - 1, preview.box[1] + preview.box[3] - 1] : null;
  const inGhost = (x, y) => preview && preview.ghost && x >= preview.box[0] && x < preview.box[0] + preview.box[2] && y >= preview.box[1] && y < preview.box[1] + preview.box[3];

  // 4) Objekte, Bewohner, Fahrzeuge (von hinten nach vorn; große Gebäude am vordersten Feld)
  const byTile = new Map();
  for (const m of walkers.concat(cars)) {
    const k = Math.round(m.px) + ',' + Math.round(m.py);
    if (!byTile.has(k)) byTile.set(k, []);
    byTile.get(k).push(m);
  }
  const icons = [];
  const labels = [];
  let staleCover = false;
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], px = visible[i + 2], py = visible[i + 3];
    const owned = ownedTile(x, y);
    FOG = !owned;
    const k = x + ',' + y;
    // Belegung veraltet (Objekt weg, ohne recalc)? Dann wie ein leeres Feld zeichnen und danach neu rechnen
    const a0 = COVER.get(k), t = a0 && state.tiles.get(a0), a = t ? a0 : null;
    if (a0 && !t) staleCover = true;
    if (a) {
      const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot);
      if (x === ax + w - 1 && y === ay + h - 1) {
        const c = w === 1 && h === 1 ? { x: px, y: py } : toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2);
        if (t.b === 'lm') { FOG = false; labels.push([ax, ay, t.lm]); }
        let sc = 1;
        if (t.born) {
          const an = (now - t.born) / 380;
          if (an < 1) { const c1 = 1.70158, c3 = c1 + 1; sc = 0.55 + 0.45 * (1 + c3 * Math.pow(an - 1, 3) + c1 * Math.pow(an - 1, 2)); }
        }
        const ds = sc * decoScale(t.b);
        if (w === 1 && h === 1) drawSmall(k, px, py, z, now, x, y, [0]);
        if (t.b !== 'weg') {
          g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -ds : ds, ds);
          PASS = 'object';
          drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t);
          PASS = null;
          g.restore();
        }
        if (w === 1 && h === 1) drawSmall(k, px, py, z, now, x, y, [1, 2, 3]);
        const s = T.st.get(a);
        if (s && t.b !== 'lm' && !PROBE && needsReach(t.b) && s.how === 'weit') icons.push([c.x, c.y, '🐌']);
        if (s && s.grow && s.grow.ready) icons.push([c.x, c.y, '✨']);
        if (s && s.wish && s.wish.next) {
          if (s.wish.ready) icons.push([c.x, c.y, '✨']);
          else if (s.wish.met === s.wish.total - 1) icons.push([c.x, c.y, '💭']);
        }
      }
    } else {
      const ter = terrainAt(x, y), hide = inGhost(x, y);
      if (ter === 'forest' && !(hide && ghostType === 'holz')) tileSprite('forest', x, y, px, py, z);
      else if (ter === 'obst' && !(hide && ghostType === 'obst')) tileSprite('obst', x, y, px, py, z);
      else if (ter === 'rock' && !(hide && ghostType === 'stein')) tileSprite('rock', x, y, px, py, z);
      else if (ter === 'erz' && !(hide && ghostType === 'mine')) tileSprite('erz', x, y, px, py, z);
      drawSmall(k, px, py, z, now, x, y, [0, 1, 2, 3]);
    }
    if (preview && preview.small && hover.x === x && hover.y === y) {
      const [u, v] = slotUV(hoverSlot), q = [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
      g.globalAlpha = 0.65;
      drawSmallOne(ghostType, buildRot, q[0], q[1], z, now, x, y, 1);
      g.globalAlpha = 1;
    }
    if (ghostFront && x === ghostFront[0] && y === ghostFront[1]) {
      const [gx, gy, gw, gh] = preview.box, c = toScreen(gx + (gw - 1) / 2, gy + (gh - 1) / 2);
      const rot = placeRot(ghostType, gx, gy);
      g.globalAlpha = 0.65;
      g.save(); g.translate(c.x, c.y);
      const gs = decoScale(ghostType);
      g.scale((rot & 1) && MIRROR.has(ghostType) ? -gs : gs, gs);
      const gt = tool === 'verschieben' ? { ...moving.t, rot } : { rot, style: STYLES[ghostType] ? currentStyle(ghostType) : undefined };
      drawObject(ghostType, 0, 0, z, now, gx, gy, gt.lvl || 1, gt);
      g.restore();
      g.globalAlpha = 1;
    }
    const ms = byTile.get(k);
    if (ms) {
      FOG = false;
      ms.sort((a, b) => (a.px + a.py) - (b.px + b.py));
      for (const m of ms) { if (m.fur) drawWalker(m, z, now); else drawCar(m, z); }
    }
  }
  FOG = false;
  if (staleCover) recalc();

  // 5) Nacht
  if (night > 0) {
    g.fillStyle = `rgba(25,35,85,${night})`;
    g.fillRect(0, 0, W, H);
    const strength = night / 0.45;
    const gi = glowImage();
    for (const { q, r } of glows) {
      const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2;
      g.globalAlpha = 0.45 * strength;
      g.drawImage(gi, gx - r, gy - r, r * 2, r * 2);
      g.globalAlpha = Math.min(1, strength);
      poly(q, '#ffd873');
      g.globalAlpha = 1;
    }
  }

  // Symbole (✨ bereit, 💭 fast geschafft, 🐌 weit weg) über der Nacht, damit man sie immer sieht
  for (const [px, py, icon] of icons) drawStatusIcon(px, py, z, icon, now);

  // 6) Schilder: Sehenswürdigkeiten und „Zu verkaufen“
  for (const [x, y, type] of labels) {
    const p = toScreen(x + 0.5, y + 0.5), L = LANDMARKS[type], st = lmStage(type), on = st >= 1;
    const ready = ownedTile(x, y) && st < 3 && !restoreInfo(type).err;
    const lanterns = '🏮'.repeat(st) + '·'.repeat(3 - st);
    pill(`${L.icon} ${L.name} ${lanterns}${ready ? ' ✨' : ''}`, p.x, p.y - 96 * z, st >= 3 ? '#eaffea' : ready ? '#fff3b0' : '#fffaf0',
      st >= 3 ? '#2f7f36' : '#6b4f3a', Math.max(11, 11 * z));
  }
  const price = plotPrice();
  for (const ck of forSale) {
    const [cx, cy] = ck.split(',').map(Number);
    const p = toScreen(cx * CHUNK + 2.5, cy * CHUNK + 2.5);
    if (p.x < -100 || p.x > W + 100 || p.y < -100 || p.y > H + 100) continue;
    const sz = Math.max(10, 11 * z);
    g.fillStyle = '#8a5a3c';
    g.fillRect(p.x - 1.5 * z, p.y - 22 * z, 3 * z, 22 * z);
    pill('🪙 ' + fmt(price), p.x, p.y - 26 * z, ck === hoverChunk ? '#fff3b0' : '#fffaf0',
      state.money >= price ? '#3f8f43' : '#8a6a4f', sz);
  }

  drawSparkles(now, z);

  // 7) Schwebende Zahlen
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i], a = (now - f.t0) / 1500;
    if (a >= 1) { floats.splice(i, 1); continue; }
    const p = toScreen(f.x, f.y);
    g.globalAlpha = a < 0.8 ? 1 : (1 - a) / 0.2;
    g.font = `900 ${Math.max(12, 12 * z)}px Nunito, system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#fffaf0'; g.lineJoin = 'round';
    const fy = p.y - 30 * z - a * 26 * z;
    g.strokeText(f.text, p.x, fy);
    g.fillStyle = f.color; g.fillText(f.text, p.x, fy);
    g.globalAlpha = 1;
  }

  // 8) Vorschau-Text
  if (preview) pill(preview.text, preview.p.x, preview.p.y - 44 * z, preview.ok ? '#eaffea' : '#ffe9e7',
    preview.ok ? '#2f7f36' : '#c0392b', 13);

  // 9) Konfetti
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.vy += 500 * dt; c.vx *= 0.99; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.life -= dt;
    if (c.life <= 0 || c.y > H + 20) { confetti.splice(i, 1); continue; }
    g.save(); g.translate(c.x, c.y); g.rotate(c.r);
    g.fillStyle = c.col; g.fillRect(-4, -2.5, 8, 5);
    g.restore();
  }
}

// Glitzern, wenn ein Haus wächst
const sparkles = [];
function sparkle(x, y) {
  const t0 = performance.now();
  for (let i = 0; i < 16; i++) sparkles.push({ x, y, t0, a: i / 16 * Math.PI * 2, r: 0.4 + Math.random() * 0.5, col: ['#ffd23f', '#ffffff', '#f2a7c0', '#a7d8c9'][i % 4] });
}
function drawSparkles(now, z) {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i], a = (now - s.t0) / 1400;
    if (a >= 1) { sparkles.splice(i, 1); continue; }
    const p = toScreen(s.x + Math.cos(s.a) * s.r * a, s.y + Math.sin(s.a) * s.r * a);
    const y = p.y - 20 * z - a * 30 * z, r = (1 - a) * 4 * z;
    g.globalAlpha = 1 - a;
    g.fillStyle = s.col;
    g.beginPath();
    g.moveTo(p.x, y - r * 1.6); g.lineTo(p.x + r * 0.4, y - r * 0.4); g.lineTo(p.x + r * 1.6, y); g.lineTo(p.x + r * 0.4, y + r * 0.4);
    g.lineTo(p.x, y + r * 1.6); g.lineTo(p.x - r * 0.4, y + r * 0.4); g.lineTo(p.x - r * 1.6, y); g.lineTo(p.x - r * 0.4, y - r * 0.4);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
}

function addFloat(x, y, text, color) {
  if (floats.length > 60) floats.shift();
  floats.push({ x, y, text, color, t0: performance.now() });
}

function confettiBurst() {
  const cols = ['#f2b53a', '#e8705f', '#5f8fe8', '#58b36a', '#b07ad6', '#f28cb1'];
  for (let i = 0; i < 160; i++) {
    confetti.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, col: cols[i % cols.length], life: 5 });
  }
}
