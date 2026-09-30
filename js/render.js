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

// fit: im Bild halten (Vorschau-Schild) – notfalls kleiner, dann seitlich hineinrücken
function pill(text, x, y, bg, fg, size, fit) {
  g.font = `900 ${size}px Nunito, system-ui, sans-serif`;
  let w = g.measureText(text).width + size * 1.2;
  while (fit && w > W - 16 && size > 9) { size--; g.font = `900 ${size}px Nunito, system-ui, sans-serif`; w = g.measureText(text).width + size * 1.2; }
  if (fit) x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
  const h = size * 1.7;
  g.fillStyle = 'rgba(107,79,58,0.25)';
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2 + 3, w, h, h / 2); g.fill();
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill();
  g.fillStyle = fg; g.textBaseline = 'middle';
  centerText(text, x, y + 1);
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
const cachedPath = t => t.b === 'schiene' || (wegUnder(t) != null && !PATH_LOOK[styleDef('weg', wegUnder(t)).id].glow);   // auch der Weg unter Marktständen

// Schlagschatten: Die Sonne steht links, jedes Gebäude wirft einen weichen Schatten nach rechts
// (Grundfläche des Hauptbaus, um die Höhe versetzt). Gezeichnet in Weltkoordinaten (Zoom 1).
const SUN = { dx: 0.55, dy: 0.12 };
const SHADOW_COL = 'rgba(30,42,62,0.3)';
const HOUSE_SHADOW = [0, 24, 30, 32, 35, 34];
const SHADOW = {           // Höhe (je Stufe) und Abstand der Hauswand vom Feldrand
  muehle: [[28, 34, 40], 0.3], saege: [22, 0.18], steinmetz: [17, 0.26], schmiede: [19, 0.26], baecker: [[22, 32, 32], 0.2],
  fabrik: [[22, 22, 26], 0.16], schule: [[26, 28, 34], 0.2], bibliothek: [[28, 29, 31], 0.3], uni: [[36, 38, 40], 0.45], kunst: [[28, 30, 32], 0.3],
  rathaus: [40, 0.4], leuchtturm: [50, 0.37], fischer: [16, 0.3], hafen: [[20, 22, 26], 0.5],
};
// Höhe des Namensschilds über der Mitte (passend zur Zeichnung)
const LM_LABEL_H = { baum: 128, obsthain: 82, klippe: 172, ruine: 80, erzberg: 104, quelle: 70, kristall: 118 };
const LM_SHADOW = { baum: [56, 0.85], klippe: [50, 0.75], ruine: [26, 0.7], kristall: [38, 0.8], obsthain: [34, 0.85], erzberg: [44, 0.75] };
function shadowOf(t, ax, ay) {
  let hgt, inset;
  if (t.b === 'haus') { const look = houseLook(t); hgt = HOUSE_SHADOW[look]; inset = look === 5 ? 0.16 : 0.24; }
  else if (t.b === 'lm') { const s = LM_SHADOW[t.lm]; if (!s) return null; [hgt, inset] = s; }
  else { const s = ART_SHADOW[t.b] || SHADOW[t.b]; if (!s) return null; hgt = Array.isArray(s[0]) ? s[0][Math.min(t.lvl, 3) - 1] : s[0]; inset = s[1]; }
  const [w, h] = sizeOf(t.b, t.rot, t), dx = SUN.dx * hgt, dy = SUN.dy * hgt;
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
    const [w, h] = sizeOf(t.b, t.rot, t), c = at(ax + (w - 1) / 2, ay + (h - 1) / 2);
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
      if (terrainAt(x, y) !== 'water' || state.claimed.has(x + ',' + y)) sea = false;
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
    if (t && cachedPath(t)) { const p = iso(x, y); drawFlat(p.x, p.y, 1, x, y, t); }
  }
  drawShadows(near);
  g.restore();
  g = prev;
  return { c, b, scale, v: groundVersion, waves, used: frameNo };
}
// ---------------------------------------------------------------------------
// Weit weg (Block 31): Gebäude und kleine Dekos als fertige Bildchen, statt sie jedes Bild neu zu zeichnen. Gleich
// aussehende teilen sich eins (Häuser, kleine Läden, Dekos); große Gebäude und alles, was vom Platz abhängt, haben ihr
// eigenes (neu, wenn sich Boden oder Gebäude ändern). Nachtlicht wird beim Zeichnen gemerkt (GLOW_SINK) und beim
// Einsetzen gestanzt. Neu gezeichnet wird nur so viel, wie ins Zeitbudget je Bild passt – der Rest wie bisher.
// Nah dran (z ≥ SPRITE_FROM) zeichnet alles live, mit allen Bewegungen.
// ---------------------------------------------------------------------------
const SPRITE_FROM = 1.0, SPRITE_MS = 6;
const objSprites = new Map();        // Schlüssel → { c, ox, oy, z, glows, used }
let SPRITES_ON = false, spriteDeadline = 0, spriteZooming = false;
const SPRITE_LIVE = new Set(['riesenrad', 'windrad', 'muehle']);   // drehen sich auch von weitem sichtbar
const SHARED_DECO = b => !['baum', 'busch', 'riesenblume', 'blumentopf'].includes(b);
function spriteTop(b, w, h) {
  if (WONDERS[b]) return WONDERS[b].h + 50;
  if (b === 'leuchtturm') return 220;
  return w * h >= 9 ? 150 : w * h >= 4 ? 120 : 100;
}
// Bildchen holen (oder zeichnen, wenn das Budget reicht); null = wie bisher zeichnen
function getSprite(key, z, make) {
  let e = objSprites.get(key);
  const ratio = e ? z / e.z : 0;
  const fresh = e && (spriteZooming ? ratio > 0.6 && ratio < 1.6 : Math.abs(ratio - 1) < 0.02);
  if (!fresh) {
    if (performance.now() > spriteDeadline) return e && ratio > 0.6 && ratio < 1.6 ? (e.used = frameNo, e) : null;
    e = make(); objSprites.set(key, e);
  }
  e.used = frameNo;
  return e;
}
function paintSprite(halfW, up, down, drawFn) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(2 * halfW * DPR)); c.height = Math.max(1, Math.ceil((up + down) * DPR));
  const prev = g, sink = [];
  g = c.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, halfW * DPR, up * DPR);
  GLOW_SINK = sink; SPRITE_PAINT = true;
  try { drawFn(); } finally { GLOW_SINK = null; SPRITE_PAINT = false; g = prev; }
  return { c, ox: halfW, oy: up, glows: sink };
}
function putSprite(e, cx, cy, z) {
  const r = z / e.z, w = e.c.width / DPR * r, h = e.c.height / DPR * r, x0 = cx - e.ox * r, y0 = cy - e.oy * r;
  g.drawImage(e.c, x0, y0, w, h);
  for (const gl of e.glows) punchGlow(gl.q.map(([x, y]) => [x0 + x * r, y0 + y * r]), gl.r * r, gl.tint);
}
// Gebäude (Anker ax, ay) an Bildschirmpunkt c; true = erledigt
function spriteTile(t, ax, ay, c, z, now, w, h) {
  const lit = night > 0.15 && isLive() ? 1 : 0;
  const look = [t.b, t.lvl, t.rot || 0, t.wall != null ? t.wall : Math.floor(hash(ax, ay, 3) * 7), t.roof != null ? t.roof : Math.floor(hash(ax, ay, 4) * 7),
    t.look || '', t.style || '', FOG ? 1 : 0, lit].join('|');
  const shared = (isHome(t.b) && t.b !== 'hausboot') || (SHOPS[t.b] && !SHOPS[t.b].size);
  const key = shared ? look : `${ax},${ay}|${look}|${t.phase != null ? t.phase : ''}|${t.gleise || ''}|${t.cross ? 1 : 0}${t.foot ? 1 : 0}|${groundVersion}`;
  const ds = decoScale(t.b), mir = (t.rot & 1) && MIRROR.has(t.b);
  const e = getSprite(key, z, () => {
    const halfW = ((w + h) * TW / 4 + 26) * z * ds, up = spriteTop(t.b, w, h) * z * ds, down = ((w + h) * TH / 4 + 12) * z * ds;
    const sp = paintSprite(halfW, up, down, () => { g.scale(mir ? -ds : ds, ds); PASS = 'object'; try { drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t); } finally { PASS = null; } });
    sp.z = z;
    return sp;
  });
  if (!e) return false;
  putSprite(e, c.x, c.y, z);
  return true;
}
// Kleine Deko in einer Ecke
function spriteSmall(b, rot, sx, sy, z, now, x, y, slot) {
  const lit = night > 0.15 && isLive() ? 1 : 0;
  const dark = lit && T.rail.power.dark.has(x + ',' + y + ',' + slot) ? 1 : 0;                 // Laterne ohne Strom
  const key = `deco|${b}|${rot}|${FOG ? 1 : 0}|${lit}|${dark}` + (SHARED_DECO(b) ? '' : `|${x},${y},${slot}`);
  const s = decoScale(b) * 0.9, mir = (rot & 1) && MIRROR.has(b);
  const e = getSprite(key, z, () => {
    const sp = paintSprite(26 * z * s, 90 * z * s, 12 * z * s, () => { g.scale(mir ? -s : s, s); drawObject(b, 0, 0, z, now, x, y, 1, { rot, slot }); });
    sp.z = z;
    return sp;
  });
  if (!e) return false;
  putSprite(e, sx, sy, z);
  return true;
}
function spriteHousekeeping() {
  if (frameNo % 120 === 0) for (const [k, e] of objSprites) if (frameNo - e.used > 600) objSprites.delete(k);
}

// Sternschnuppe (Sternwarte): fällt in der ersten Sekunde schräg vom Himmel, liegt dann funkelnd da und verblasst am Ende
function drawFallenStar(s, z, now) {
  const age = now - s.t0, p = toScreen(s.x, s.y), fall = Math.min(1, age / 1000);
  const x = p.x + (1 - fall) * 220 * z, y = p.y - 14 * z - (1 - fall) * 320 * z, fade = Math.min(1, (STAR_LIFE - age) / 5000);
  if (fade <= 0 || x < -60 || x > W + 60 || y < -60 || y > H + 60) return;
  g.save();
  g.globalAlpha = Math.max(0, fade);
  if (fall < 1) {                                                       // Schweif
    const grd = g.createLinearGradient(x, y, x + 60 * z, y - 90 * z);
    grd.addColorStop(0, 'rgba(255,240,170,0.9)'); grd.addColorStop(1, 'rgba(255,240,170,0)');
    g.strokeStyle = grd; g.lineWidth = 2.5 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 * z, y - 90 * z); g.stroke();
  }
  const r = (8 + Math.sin(now / 250) * 1) * z;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = '#ffe27a'; g.fill();
  circle(x, y, r * 0.3, '#fffbe6');
  g.restore();
  glowQuad([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]], 50 * z);
}
// Tiefes Meer (Block 27b): weit draußen dunkler. Ein kleines Bild mit einem Punkt je Feld (depthAlpha), gedreht und
// gestaucht wie die Felder über den Boden gelegt (ohne Glätten: jeder Punkt ist genau ein Feld). Neu gerechnet, wenn
// der sichtbare Bereich es verlässt oder sich Wasser ändert.
let depthImg = null;
function drawDepth(minX, maxX, minY, maxY, z) {
  const d = depthImg;
  if (!d || d.v !== waterVersion || minX < d.x0 || maxX > d.x1 || minY < d.y0 || maxY > d.y1) {
    const pad = Math.min(60, Math.max(20, (maxX - minX) >> 1)), x0 = minX - pad, y0 = minY - pad, w = maxX - minX + 2 * pad + 1, h = maxY - minY + 2 * pad + 1;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d'), img = cx.createImageData(w, h), px = img.data;
    let any = false;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const a = depthAlpha(x0 + i, y0 + j);
      if (a <= 0) continue;
      const o = (j * w + i) * 4;
      px[o] = 22; px[o + 1] = 62; px[o + 2] = 118; px[o + 3] = Math.round(a * 255); any = true;
    }
    if (any) cx.putImageData(img, 0, 0);
    depthImg = { c, x0, y0, x1: x0 + w - 1, y1: y0 + h - 1, v: waterVersion, any };
  }
  if (!depthImg.any) return;
  const o = toScreen(depthImg.x0 - 0.5, depthImg.y0 - 0.5), a = DPR * z * TW / 2, b = DPR * z * TH / 2;
  g.save();
  g.imageSmoothingEnabled = false;
  g.setTransform(a, b, -a, b, o.x * DPR, o.y * DPR);
  g.drawImage(depthImg.c, 0, 0);
  g.restore();
}
let hoverKey = '', hoverSince = 0;
const HOVER_CALM = 120;                // ms Ruhe, bevor die Vorschau (+Taler, +Einwohner …) rechnet
let groundDeadline = 0;
const GROUND_MS = 8;
function drawGroundCached(cMinX, cMaxX, cMinY, cMaxY, z, now) {
  const want = z * DPR, zooming = now - lastZoomChange < 250;
  groundDeadline = performance.now() + GROUND_MS;
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
      if (!seaImage || stale(seaImage)) { seaImage = renderGroundChunk(WORLD.cMax + 50, 0, want); }
      img = seaImage.c;
    } else {
      const ck = cx + ',' + cy;
      let e = groundCache.get(ck);
      // Neu malen, was fehlt; Veraltetes (Zoom, Bauen) nur, solange das Zeitbudget reicht – sonst das alte Bild (Block 31)
      const ratio = e ? want / e.scale : 0, usable = e && ratio > 0.4 && ratio < 2.5;
      if (!e || ((e.v !== groundVersion || stale(e)) && (!usable || performance.now() < groundDeadline))) { e = renderGroundChunk(cx, cy, want); groundCache.set(ck, e); }
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
  const variants = kind === 'rock' || kind === 'erz' || kind === 'kristall' ? 4 : 6;
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
    else if (kind === 'kristall') drawCrystalRocks(0, 0, 1, vx, vy);
    else drawRocks(0, 0, 1, vx, vy, kind === 'erz');
    g = prev;
    e = { c, scale: want };
    spriteCache.set(key, e);
  }
  const B = SPRITE_BOX;
  g.drawImage(e.c, px + B.left * z, py + B.top * z, B.w * z, B.h * z);
}
// Vorschau einer Linie bzw. eines Rechtecks: grün = wird gebaut, rot = geht nicht, hell = ist schon so
function planPreview(z) {
  const info = planInfo(plan), ins = 0.44, dia = (x, y, fill, line) => {      // etwas eingerückt: jedes Feld einzeln sichtbar
    const c = [toScreen(x - ins, y - ins), toScreen(x + ins, y - ins), toScreen(x + ins, y + ins), toScreen(x - ins, y + ins)];
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
    g.fillStyle = fill; g.fill();
    if (line) { g.strokeStyle = line; g.lineWidth = 1.6 * z; g.stroke(); }
  };
  g.save();
  g.lineJoin = 'round';
  if (plan.kind === 'edge') {                                   // Zaun & Co.: die Kanten farbig am Boden
    for (const k of planEdges(plan)) {
      const s = info.states.get(k);
      edgeMark(k, s === 'ok' ? (info.err ? '#e8913a' : '#2f9f55') : s === 'same' ? 'rgba(255,255,255,0.6)' : '#e5484d', z);
    }
    g.restore();
    const e = toScreen(plan.b.x - 0.5, plan.b.y - 0.5);
    return { ok: !info.err, text: planText(plan, info), p: e };
  }
  for (const [x, y] of planTiles(plan)) {
    const s = info.states.get(x + ',' + y);
    if (s === 'ok') dia(x, y, 'rgba(255,255,255,0.55)', info.err ? '#e8913a' : '#2f9f55');
    else if (s === 'same') dia(x, y, 'rgba(255,255,255,0.25)');
    else dia(x, y, 'rgba(229,72,77,0.45)', '#e5484d');
  }
  const [x0, y0, x1, y1] = planBox(plan);
  if (plan.kind === 'rect') {                                   // Rahmen um die ganze Fläche
    const c = [toScreen(x0 - 0.5, y0 - 0.5), toScreen(x1 + 0.5, y0 - 0.5), toScreen(x1 + 0.5, y1 + 0.5), toScreen(x0 - 0.5, y1 + 0.5)];
    g.strokeStyle = info.err ? '#e5484d' : '#3fbf6f'; g.lineWidth = 2.5 * z; g.setLineDash([6 * z, 4 * z]);
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); g.stroke();
  }
  g.restore();
  const p = plan.kind === 'line' ? toScreen(plan.b.x, plan.b.y) : toScreen((x0 + x1) / 2, (y0 + y1) / 2);
  return { ok: !info.err, text: planText(plan, info), p };
}
// Vorschau beim Verschieben einer Gruppe: Grundflächen grün/rot, die Dinge als Geister an ihrem vordersten Feld
function groupPreview(z) {
  const { ox, oy, errs, first } = groupErrors(hover.x, hover.y), ghosts = new Map(), now = performance.now();
  const add = (k, f) => { if (!ghosts.has(k)) ghosts.set(k, []); ghosts.get(k).push(f); };
  const dia = (x, y, bad) => {
    const c = [toScreen(x - 0.44, y - 0.44), toScreen(x + 0.44, y - 0.44), toScreen(x + 0.44, y + 0.44), toScreen(x - 0.44, y + 0.44)];
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
    g.fillStyle = bad ? 'rgba(229,72,77,0.45)' : 'rgba(255,255,255,0.5)'; g.fill();
    g.strokeStyle = bad ? '#e5484d' : '#2f9f55'; g.lineWidth = 1.6 * z; g.stroke();
  };
  g.save(); g.lineJoin = 'round';
  for (const it of moving.items) {
    const x = ox + it.dx, y = oy + it.dy, bad = !!errs.get(it);
    if (it.kind === 'deco') {
      const slot = it.from[1], [u, v] = slotPos(x, y, slot, it.d.b);
      add(x + ',' + y, () => { const p = toScreen(x, y); drawSmallOne(it.d.b, it.d.rot || 0, p.x + (u - v) * TW / 2 * z, p.y + (u + v) * TH / 2 * z, z, now, x, y, 1, slot); });
      continue;
    }
    const t = it.t, [w, h] = sizeOf(t.b, t.rot || 0, t);
    for (const [fx, fy] of footprint(t.b, x, y, t.rot || 0, t)) dia(fx, fy, bad);
    if (t.b === 'weg' || t.b === 'schiene') continue;                // Wege: die Fläche genügt
    add((x + w - 1) + ',' + (y + h - 1), () => {
      const c = toScreen(x + (w - 1) / 2, y + (h - 1) / 2), s = decoScale(t.b);
      g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -s : s, s);
      drawObject(t.b, 0, 0, z, now, x, y, t.lvl, t);
      g.restore();
    });
  }
  g.restore();
  const n = moving.items.length;
  return { groupGhost: ghosts, preview: { ok: !first, text: first || `${n} Dinge · hierhin`, p: toScreen(hover.x, hover.y) } };
}
// Nacht: Die Lichter haben beim Zeichnen Löcher gestanzt (glowQuad). Nur das übrige Bild wird dunkel, dann kommt
// hinter die Löcher das Licht – wo inzwischen etwas davor steht, ist kein Loch mehr. Große Gebäude werden in
// Streifen gezeichnet und tragen ihre Lichter mehrfach ein: jedes nur einmal hinterlegen.
function drawNight() {
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = `rgba(25,35,85,${night})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-over';
  const seen = new Set(), lights = glows.filter(({ q, r }) => {
    const k = [q[0][0], q[0][1], q[2][0], q[2][1], r].map(v => Math.round(v * 4)).join();
    return !seen.has(k) && seen.add(k);
  });
  for (const { q, tint } of lights) if (tint !== 'blue') poly(q, '#ffd873');      // Fenster zuerst, ganz hell
  for (const { q, r, tint } of lights) {                                          // dann der weiche Schein
    const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2;
    g.fillStyle = tint === 'blue' ? 'rgb(140,215,255)' : 'rgb(255,205,100)';
    g.fillRect(gx - r, gy - r, r * 2, r * 2);
  }
  g.fillStyle = '#2a3f66';                                                        // Sicherheitsnetz: nie durchsichtig
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  return lights.length;
}
// Nachtlicht: ein vorgezeichneter weicher Lichtfleck statt eines Farbverlaufs pro Fenster
const glowSprites = {};
function glowImage(blue) {
  const key = blue ? 'blue' : 'warm';
  if (glowSprites[key]) return glowSprites[key];
  const c = document.createElement('canvas'), rgb = blue ? '140,215,255' : '255,205,100';
  c.width = c.height = 64;
  const x = c.getContext('2d'), grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${rgb},1)`); grd.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = grd; x.fillRect(0, 0, 64, 64);
  return (glowSprites[key] = c);
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
  SPRITES_ON = z < SPRITE_FROM && isLive();
  spriteZooming = now - lastZoomChange < 250;
  spriteDeadline = performance.now() + SPRITE_MS;
  spriteHousekeeping();

  const cs = [toTile(0, 0), toTile(W, 0), toTile(0, H), toTile(W, H)];
  groundCached = z * DPR <= GROUND_MAX_SCALE && isLive();
  let minX = Math.min(...cs.map(c => c.x)) - 2, maxX = Math.max(...cs.map(c => c.x)) + 6;
  let minY = Math.min(...cs.map(c => c.y)) - 2, maxY = Math.max(...cs.map(c => c.y)) + 6;
  // Außerhalb der Insel steht nichts: dort nur den Boden aus dem Zwischenspeicher, keine Felder durchgehen
  const seen = [minX, maxX, minY, maxY];                // ganz, auch jenseits der Welt (tiefes Meer)
  const cMinX = Math.floor(minX / CHUNK) - 1, cMaxX = Math.floor(maxX / CHUNK) + 1;
  const cMinY = Math.floor(minY / CHUNK) - 1, cMaxY = Math.floor(maxY / CHUNK) + 1;
  if (groundCached) {
    minX = Math.max(minX, WORLD.cMin * CHUNK - 1); maxX = Math.min(maxX, (WORLD.cMax + 1) * CHUNK);
    minY = Math.max(minY, WORLD.cMin * CHUNK - 1); maxY = Math.min(maxY, (WORLD.cMax + 1) * CHUNK);
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
  drawDepth(...seen, z);
  const visRange = ([ax, ay]) => ax >= minX - 3 && ax <= maxX + 1 && ay >= minY - 3 && ay <= maxY + 1;
  if (!groundCached) drawGroundParts(visRange, toScreen, z);
  // Wege immer vor allem anderen (sie liegen flach); aus dem Zwischenspeicher fehlen nur die leuchtenden
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], t = state.tiles.get(x + ',' + y);
    if (!t || (t.b !== 'schiene' && wegUnder(t) == null) || (groundCached && cachedPath(t))) continue;
    FOG = !ownedTile(x, y);
    drawFlat(visible[i + 2], visible[i + 3], z, x, y, t);
  }
  FOG = false;
  if (!groundCached) {
    g.save();
    g.setTransform(DPR * z, 0, 0, DPR * z, (W / 2 - cam.x * z) * DPR, (H / 2 - cam.y * z) * DPR);
    drawShadows(visRange);
    g.restore();
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
    const t = state.tiles.get(a), [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t);
    return [ax, ay, w, h];
  };
  const ghostType = tool === 'verschieben' ? movingType() : tool;
  const smallMode = tool === 'verschieben' ? !!moving && moving.kind === 'deco' : !!(ITEMS[tool] && ITEMS[tool].small);
  let groupGhost = null;                                   // mehrere Dinge verschieben: je vorderstem Feld, was dort als Geist steht
  if (plan) preview = planPreview(z);                       // Linie/Rechteck: alle Felder mit Preis
  else if (tool === 'verschieben' && moving && moving.kind === 'group') { if (hover) ({ preview, groupGhost } = groupPreview(z)); }
  else if (hover && tool !== 'look' && (ownedTile(hover.x, hover.y) || (CLAIM_TOOLS.has(tool) && isSea(hover.x, hover.y)))) {
    const hx = hover.x, hy = hover.y;
    const hds = decosAt(hx + ',' + hy);
    const rotOf = b => placeRot(b, hx, hy);
    let box = [hx, hy, 1, 1];
    if (EDGE_TOOLS.has(tool) && hoverVertex) {
      const q = toScreen(hoverVertex.x - 0.5, hoverVertex.y - 0.5);
      g.fillStyle = '#2f9f55'; g.beginPath(); g.arc(q.x, q.y, 4 * z, 0, Math.PI * 2); g.fill();
      preview = { ok: true, text: `${ITEMS[tool].name} · ${styleDef(tool, currentStyle(tool)).name}: Anfang antippen (oder ziehen)`, p: q };
    } else if (tool === 'abriss' && hoverEdge && state.edges.has(hoverEdge)) {
      const e = state.edges.get(hoverEdge);
      edgeMark(hoverEdge, '#e5484d', z, 5);
      const E = edgeEnds(hoverEdge), m = toScreen((E.p[0] + E.q[0]) / 2, (E.p[1] + E.q[1]) / 2);
      preview = { ok: true, text: `${ITEMS[e.b].name} entfernen: +${fmt(ITEMS[e.b].cost)}`, p: m };
    } else if (tool === 'verschieben' && !moving) {
      const has = (hds && hds[hoverSlot]) || anchorAt(hx, hy);
      if (!(hds && hds[hoverSlot])) box = objBox(hx, hy);
      preview = { ok: !!has, text: has ? 'Aufnehmen' : 'Hier ist nichts' };
    } else if (smallMode) {
      const slot = freeSlot(hx, hy, hoverSlot);
      const err = tool === 'verschieben' ? moveError(hx, hy, slot) : smallError(tool, hx, hy, slot);
      const cl = tool === 'verschieben' ? '' : clearLabel(tool, hx, hy);
      preview = { ok: !err, small: !err || err === 'Zu wenig Taler', slot, text: err || (tool === 'verschieben' ? 'Hierhin' : `🌸 +${ITEMS[tool].beauty}${cl ? '  ' + cl : ''}`) };
    } else if (tool === 'verschieben') {
      const err = moveError(hx, hy, hoverSlot), [w, h] = sizeOf(ghostType, rotOf(ghostType), moving.t);
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
        if (d.cat === 'land' || d.ground) text = `${d.name}: −${fmt(costOf(tool, hx, hy).cost)}${tool === 'schuett' && seaDepth(hx, hy) > DEEP_FROM ? ' · tiefes Wasser' : ''}`;
        else if (crossCandidate(tool, hx, hy)) text = '🚧 Bahnübergang';
        else if (tool === 'weg') text = styleDef('weg', currentStyle('weg')).name;
        else if (tool === 'schiene') { const c = costOf(tool, hx, hy); text = `${c === BRIDGE ? 'Brücke' : 'Schiene'}: −${fmt(c.cost)} ${matText(c.mat)}`; }
        else {
          // Die ganze Insel neu rechnen kostet: erst, wenn die Maus kurz auf dem Feld ruht (beim Drüberfahren nur Name/Ort)
          const hk = hx + ',' + hy + tool;
          if (hk !== hoverKey) { hoverKey = hk; hoverSince = now; }
          const ready = now - hoverSince > HOVER_CALM || (previewCache && previewCache.k === hx + ',' + hy && previewCache.b === tool);
          const pv = ready ? previewDelta(tool, hx, hy) : { inc: 0, sci: 0, beauty: 0 }, parts = STOPS.has(tool) ? [placeLabel(hx, hy)] : [];
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
        const cl = clearLabel(tool, hx, hy, rotOf(tool));      // Wald/Fels auf dem Bauplatz verschwinden
        if (cl) text += '  ' + cl;
      }
      const free = footprint(tool, hx, hy, rotOf(tool)).every(([fx, fy]) => !COVER.has(fx + ',' + fy) && (terrainAt(fx, fy) !== 'water' || tool === 'schiene'));
      preview = { ok: !err, ghost: d.cat !== 'land' && !d.ground && free, text };
    }
    if (!preview.p) preview.p = outline(box[0], box[1], box[2], box[3], preview.ok);   // Zaun & Co. haben ihren Punkt schon
    preview.box = box;
  }
  const ghostFront = preview && preview.ghost ? [preview.box[0] + preview.box[2] - 1, preview.box[1] + preview.box[3] - 1] : null;
  const inGhost = (x, y) => preview && preview.ghost && x >= preview.box[0] && x < preview.box[0] + preview.box[2] && y >= preview.box[1] && y < preview.box[1] + preview.box[3];

  // 4) Objekte, Bewohner, Fahrzeuge (von hinten nach vorn; große Gebäude am vordersten Feld)
  const byTile = new Map();
  const cars4 = trainCars(), boat = expeditionBoat();
  const ships = [boat, cargoShip()].filter(Boolean).concat(shipMovers(now), fishBoats(now));
  for (const m of walkers.concat(strollers, cars, cars4, ships)) {
    let k = Math.round(m.px) + ',' + Math.round(m.py);
    if (m.train && HALL.has(k)) k = COVER.get(k) || k;     // Zug in der Halle: ganz hinten zeichnen, Dächer und Bahnsteige kommen darüber
    if (!byTile.has(k)) byTile.set(k, []);
    byTile.get(k).push(m);
  }
  const icons = [];
  for (const tr of trains) if (!tr.powered) { const f = cars4.find(c => c.train === tr); if (f) { const p = toScreen(f.px, f.py); icons.push([p.x + 10 * z, p.y + 4 * z, '⚡']); } }   // Zug ohne Strom
  const labels = [];
  let staleCover = false;
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], px = visible[i + 2], py = visible[i + 3];
    const owned = ownedTile(x, y);
    FOG = !owned;
    drawEdgesAt(x, y, z, now);                                  // Hecken, Zäune, Mauern an den hinteren Kanten (Block 41)
    const k = x + ',' + y;
    // Belegung veraltet (Objekt weg, ohne recalc)? Dann wie ein leeres Feld zeichnen und danach neu rechnen
    const a0 = COVER.get(k), t = a0 && state.tiles.get(a0), a = t ? a0 : null;
    if (a0 && !t) staleCover = true;
    if (a) {
      const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t), big = w > 1 || h > 1;
      const corner = x === ax + w - 1 && y === ay + h - 1;
      const c = big ? toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2) : { x: px, y: py };
      const drawIt = () => {
        let sc = 1;
        if (t.born) {
          const an = (now - t.born) / 380;
          if (an < 1) { const c1 = 1.70158, c3 = c1 + 1; sc = 0.55 + 0.45 * (1 + c3 * Math.pow(an - 1, 3) + c1 * Math.pow(an - 1, 2)); }
        }
        if (SPRITES_ON && sc === 1 && !SPRITE_LIVE.has(t.b) && spriteTile(t, ax, ay, c, z, now, w, h)) return;   // weit weg: fertiges Bildchen
        const ds = sc * decoScale(t.b);
        g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -ds : ds, ds);
        PASS = 'object';
        drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t);
        PASS = null;
        g.restore();
      };
      // Große Gebäude in senkrechten Streifen: jede Diagonale (x − y) der Grundfläche wird an ihrem vordersten
      // Feld gezeichnet – so überdecken sie nichts, was seitlich vor ihnen steht (Bäume, Häuser, Bewohner)
      if (big && t.b !== 'weg' && (x === ax + w - 1 || y === ay + h - 1)) {
        const d = x - y, dMin = ax - (ay + h - 1), dMax = ax + w - 1 - ay;
        const mid = (d * TW / 2 - cam.x) * z + W / 2, half = TW / 4 * z;
        const left = d === dMin ? -1e5 : mid - half, right = d === dMax ? 1e5 : mid + half;
        if (t.b === 'lm') FOG = false;
        g.save(); g.beginPath(); g.rect(left, -1e5, right - left, 2e5); g.clip();
        drawIt();
        g.restore();
      }
      if (corner) {
        if (t.b === 'lm' && ownedTile(ax, ay)) { FOG = false; labels.push([ax, ay, t.lm]); }
        if (!big) {
          drawSmall(k, px, py, z, now, x, y, SLOTS_BACK);
          if (t.b !== 'weg') drawIt();
          drawSmall(k, px, py, z, now, x, y, SLOTS_FRONT);
        }
        const s = T.st.get(a);
        if (s && t.b !== 'lm' && !PROBE && needsReach(t.b) && s.how === 'weit') icons.push([c.x, c.y, '🐌']);
        if (s && s.noPower) icons.push([c.x, c.y, '⚡']);
        if (t.b === 'station') { const l = lineOf(a); if (l && l.traffic && l.traffic.served < 0.8) icons.push([c.x, c.y, '😣']); }   // überfüllt
        if (t.b === 'hbf' && [...GLEIS].some(([gk, G]) => { if (G.hub !== a) return false; const l = lineOf(gk); return l && l.traffic && l.traffic.served < 0.8; })) icons.push([c.x, c.y, '😣']);
        if (t.b === 'hafen' && (t.lvl || 1) >= 2 && state.orders.some(o => o.kind === 'sell' && state.res[o.res] >= o.amount)) icons.push([c.x, c.y, '🚢']);   // Auftrag erfüllbar
        if (t.b === 'truhe') icons.push([c.x, c.y, '🎁']);
        if (t.b === 'schloss' && decreeReady()) icons.push([c.x, c.y, '👑']);   // Erlass wartet
        if (s && s.grow && s.grow.ready && canPay(s.grow.next.cost)) icons.push([c.x, c.y, '✨']);   // nur, wenn man es auch bezahlen kann
        if (WONDERS[t.b] && !wonderDone(t) && canPay(wonderCost(t))) icons.push([c.x, c.y, '🏗️']);
        if (s && s.wish && s.wish.next) {
          if (s.wish.ready && canPay(houseCost(s.wish.next))) icons.push([c.x, c.y, '✨']);
          else if (s.wish.met === s.wish.total - 1) icons.push([c.x, c.y, '💭']);
        }
      }
    } else {
      const ter = terrainAt(x, y), hide = inGhost(x, y);
      const gone = hide && tool !== 'verschieben' && ITEMS[ghostType] && willClear(ghostType, ter);   // wird beim Bauen weggeräumt
      if (gone) { /* Vorschau: Natur schon ausblenden */ }
      else if (ter === 'forest' && !(hide && ghostType === 'holz')) tileSprite('forest', x, y, px, py, z);
      else if (ter === 'obst' && !(hide && ghostType === 'obst')) tileSprite('obst', x, y, px, py, z);
      else if (ter === 'rock' && !(hide && ghostType === 'stein')) tileSprite('rock', x, y, px, py, z);
      else if (ter === 'erz' && !(hide && ghostType === 'mine')) tileSprite('erz', x, y, px, py, z);
      else if (ter === 'kristall' && !(hide && ghostType === 'kristallmine')) {
        tileSprite('kristall', x, y, px, py, z);
        glowQuad([[px - 3 * z, py - 14 * z], [px + 3 * z, py - 14 * z], [px + 3 * z, py], [px - 3 * z, py]], 22 * z, 'blue');
      }
      drawSmall(k, px, py, z, now, x, y, [...SLOTS_BACK, ...SLOTS_FRONT]);
    }
    if (preview && preview.small && hover.x === x && hover.y === y) {
      const [u, v] = slotPos(x, y, preview.slot, ghostType), q = [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
      g.globalAlpha = 0.65;
      drawSmallOne(ghostType, buildRot, q[0], q[1], z, now, x, y, 1, preview.slot);
      g.globalAlpha = 1;
    }
    if (groupGhost && groupGhost.has(k)) {
      g.globalAlpha = 0.65;
      for (const f of groupGhost.get(k)) f();
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
      for (const m of ms) {
        // Bewohner auf der Bogenbrücke (hintere Rampe und Mitte) erst nach der Brücke zeichnen, sonst verdeckt sie sie
        const ar = m.fur && archAt(m.px, m.py);
        if (ar && ar.b <= 0.5) { if (!archWalkers.has(ar.key)) archWalkers.set(ar.key, []); archWalkers.get(ar.key).push(m); continue; }
        if (m.fur) drawWalker(m, z, now); else if (m.train) drawTrainCar(m, z, now); else if (m.ship) drawShipMover(m, z, now); else if (m.fish) drawFishMover(m, z, now);
        else if (m.cargo) drawCargoMover(m, z, now); else if (m.boat) drawBoatMover(m, z, now); else drawCar(m, z);
      }
    }
    if (afterMovers.length) { for (const f of afterMovers) f(); afterMovers.length = 0; }
    if (archWalkers.has(k)) { for (const m of archWalkers.get(k)) drawWalker(m, z, now); archWalkers.delete(k); }
  }
  FOG = false;
  archWalkers.clear();
  if (staleCover) recalc();

  drawSky(now, z);                        // Erfindungen: Ballons, Zeppelin, Seilbahn

  // 5) Nacht
  if (night > 0) drawNight();

  drawFireworks(now, z);                  // über der Nacht, damit es leuchtet

  // Symbole (✨ bereit, 💭 fast geschafft, 🐌 weit weg) über der Nacht, damit man sie immer sieht
  for (const s of fallenStars) drawFallenStar(s, z, now);
  for (const [px, py, icon] of icons) drawStatusIcon(px, py, z, icon, now);

  // 6) Schilder: Sehenswürdigkeiten und „Zu verkaufen“
  for (const [x, y, type] of labels) {
    const [w, h] = sizeOf('lm', 0), p = toScreen(x + (w - 1) / 2, y + (h - 1) / 2), L = LANDMARKS[type], st = lmStage(type);
    const ready = ownedTile(x, y) && st < 3 && !restoreInfo(type).err;
    const lanterns = '🏮'.repeat(st) + '·'.repeat(3 - st);
    pill(`${L.icon} ${L.name} ${lanterns}${ready ? ' ✨' : ''}`, p.x, p.y - (LM_LABEL_H[type] || 80) * z, st >= 3 ? '#eaffea' : ready ? '#fff3b0' : '#fffaf0',
      st >= 3 ? '#2f7f36' : '#6b4f3a', Math.max(11, 11 * z));
  }
  // Schilder der Themen-Inseln, die noch gesperrt sind (die nächste hervorgehoben)
  const nxt = nextIsle();
  for (const i of ISLES) {
    if (isleOpen(i.id)) continue;
    // über der Sehenswürdigkeit schweben (wie deren Schild), nicht an einem Pfahl mitten im Berg
    const pos = lmTile(i.lm), p = pos ? toScreen(pos[0] + 1, pos[1] + 1) : toScreen(i.cx, i.cy);
    const ly = p.y - (LM_LABEL_H[i.lm] || 80) * z;
    if (p.x < -150 || p.x > W + 150 || ly < -100 || ly > H + 150) continue;
    const isNext = i === nxt, sz = Math.max(11, 12 * z);
    const away = isNext && state.expedition && state.expedition.isle === i.id;
    pill(`${i.icon} ${i.name} ${away ? '· ⛵ ' + fmtClock(expeditionLeft()) : isNext ? '· entdecken' : '🔒'}`, p.x, ly, isNext ? '#fff3b0' : '#fffaf0', isNext ? '#6b4f3a' : '#8a6a4f', sz);
  }

  // Ferne Insel im Nebel (die nächste): Schild über der Mitte
  for (const i of FAR) {
    if (isleOpen(i.id)) continue;
    const p = toScreen(i.cx, i.cy), ly = p.y - 40 * z;
    if (p.x < -150 || p.x > W + 150 || ly < -100 || ly > H + 150) continue;
    const away = state.expedition && state.expedition.isle === i.id;
    pill(`🌫️ ${i.icon} ${i.name} ${away ? '· ⛵ ' + fmtClock(expeditionLeft()) : '· entdecken'}`, p.x, ly, '#fff3b0', '#6b4f3a', Math.max(11, 12 * z));
  }

  drawSparkles(now, z);

  // 7) Schwebende Zahlen
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i], a = (now - f.t0) / 1500;
    if (a >= 1) { floats.splice(i, 1); continue; }
    const p = toScreen(f.x, f.y);
    g.globalAlpha = a < 0.8 ? 1 : (1 - a) / 0.2;
    g.font = `900 ${Math.max(12, 12 * z)}px Nunito, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#fffaf0'; g.lineJoin = 'round';
    const fy = p.y - 30 * z - a * 26 * z;
    g.fillStyle = f.color; centerText(f.text, p.x, fy, true);
    g.globalAlpha = 1;
  }

  // 8) Vorschau-Text
  if (preview) pill(preview.text, preview.p.x, preview.p.y - 44 * z, preview.ok ? '#eaffea' : '#ffe9e7',
    preview.ok ? '#2f7f36' : '#c0392b', 13, true);

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
  if (BATCH) return;                                    // viele auf einmal: runPlan zeigt die Summe
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

// ---------------------------------------------------------------------------
// Himmel: Erfindungen (Heißluftballons, Zeppelin, Seilbahn-Gondeln) und das Feuerwerk über dem Rathaus
// ---------------------------------------------------------------------------
let skyCache = { v: -1, center: null, cables: [] };
function skyInfo() {
  if (skyCache.v === groundVersion) return skyCache;
  let center = null;
  for (const [k, t] of state.tiles) if (t.b === 'rathaus' && !center) { const [x, y] = keyXY(k); center = [x + 0.5, y + 0.5]; }
  const cables = cablePairs().map(([a, b, d]) => [keyXY(a), keyXY(b), d]);          // Paare wie im Verkehr (rules.js)
  skyCache = { v: groundVersion, center: center || [ISLAND.cx, ISLAND.cy], cables };
  return skyCache;
}
const SEIL_H = 30;
const BALLOONS = [
  { r: 7, sp: 1 / 52000, ph: 0, h: 150, col: ['#e8604f', '#ffd36e'] }, { r: 11, sp: -1 / 70000, ph: 2, h: 195, col: ['#6f8fd8', '#ffffff'] },
  { r: 5, sp: 1 / 45000, ph: 4, h: 120, col: ['#58b36a', '#f7c6d8'] }, { r: 14, sp: 1 / 90000, ph: 5.3, h: 230, col: ['#b07ad6', '#ffd36e'] },
];
function drawBalloon(b, cx, cy, z, now) {
  const a = b.ph + now * b.sp * Math.PI * 2, p = toScreen(cx + Math.cos(a) * b.r, cy + Math.sin(a) * b.r * 0.8);
  const x = p.x, y = p.y - b.h * z + Math.sin(now / 1300 + b.ph) * 4 * z, R = 13 * z;
  if (x < -60 || x > W + 60 || y < -80 || y > H + 60) return;
  ellipse(p.x, p.y, 7 * z, 3 * z, 'rgba(40,60,20,0.08)');                    // Schatten weit unten
  poly([[x - R * 0.72, y + R * 0.7], [x + R * 0.72, y + R * 0.7], [x + R * 0.26, y + R * 1.38], [x - R * 0.26, y + R * 1.38]], C(shade(b.col[0], -0.12)));
  ellipse(x, y, R, R * 1.1, C(b.col[0]));
  ellipse(x, y, R * 0.42, R * 1.1, C(b.col[1]));
  ellipse(x - R * 0.35, y - R * 0.45, R * 0.22, R * 0.3, 'rgba(255,255,255,0.35)');
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.7 * z; g.beginPath();
  g.moveTo(x - R * 0.26, y + R * 1.38); g.lineTo(x - R * 0.2, y + R * 1.75); g.moveTo(x + R * 0.26, y + R * 1.38); g.lineTo(x + R * 0.2, y + R * 1.75); g.stroke();
  poly([[x - R * 0.24, y + R * 1.75], [x + R * 0.24, y + R * 1.75], [x + R * 0.2, y + R * 2.05], [x - R * 0.2, y + R * 2.05]], C('#a57645'));
  if (night > 0.15 && isLive()) {                                             // Brenner leuchtet
    const f = 1 + Math.sin(now / 90 + b.ph) * 0.2;
    ellipse(x, y + R * 1.5, 2 * z * f, 3 * z * f, '#ffb347');
    glowQuad([[x - 2, y + R * 1.3], [x + 2, y + R * 1.3], [x + 2, y + R * 1.7], [x - 2, y + R * 1.7]], 30 * z);
  }
}
function drawZeppelin(cx, cy, z, now) {
  const a = now / 150000 * Math.PI * 2, wx = cx + Math.cos(a) * 20, wy = cy + Math.sin(a) * 16;
  const p = toScreen(wx, wy), q = toScreen(cx + Math.cos(a + 0.01) * 20, cy + Math.sin(a + 0.01) * 16), dir = q.x >= p.x ? 1 : -1;
  const x = p.x, y = p.y - 270 * z + Math.sin(now / 2000) * 5 * z, L = 34 * z, R = 10 * z;
  if (x < -120 || x > W + 120 || y < -60 || y > H + 60) return;
  ellipse(p.x, p.y, 20 * z, 6 * z, 'rgba(40,60,20,0.07)');
  for (const s of [-1, 1]) poly([[x - dir * L * 0.8, y], [x - dir * L * 1.05, y + s * R * 1.1], [x - dir * L * 0.95, y + s * R * 1.15], [x - dir * L * 0.62, y + s * R * 0.2]], C('#c9c2b4'));   // Leitwerk
  ellipse(x, y, L, R, C('#efe9dc'));
  g.save(); g.beginPath(); g.ellipse(x, y, L, R, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = C(state.town.color); g.fillRect(x - L * 0.18, y - R, L * 0.36, R * 2);            // Band in Flaggenfarbe
  g.restore();
  ellipse(x - dir * L * 0.3, y - R * 0.45, L * 0.45, R * 0.28, 'rgba(255,255,255,0.35)');
  poly([[x - L * 0.22, y + R * 0.9], [x + L * 0.22, y + R * 0.9], [x + L * 0.16, y + R * 1.45], [x - L * 0.16, y + R * 1.45]], C('#8a6440'));   // Gondel
  const lit = night > 0.15 && isLive();
  for (let i = 0; i < 3; i++) circle(x - L * 0.12 + i * L * 0.12, y + R * 1.18, 1.2 * z, lit ? '#ffd873' : C('#bfe3ff'));
  if (lit) glowQuad([[x - L * 0.2, y + R], [x + L * 0.2, y + R], [x + L * 0.2, y + R * 1.4], [x - L * 0.2, y + R * 1.4]], 24 * z);
  g.font = `${9 * z}px system-ui, sans-serif`; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  centerText(state.town.symbol, x, y + 0.5 * z);
}
function drawCables(cables, z, now) {
  for (const [a, b, d] of cables) {
    const pa = toScreen(a[0], a[1]), pb = toScreen(b[0], b[1]);
    const A = [pa.x, pa.y - SEIL_H * z], B = [pb.x, pb.y - SEIL_H * z], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + d * 1.2 * z];   // leicht durchhängend
    const at = t => [(1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * M[0] + t * t * B[0], (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * M[1] + t * t * B[1]];
    g.strokeStyle = C('#4f545e'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(...A); g.quadraticCurveTo(...M, ...B); g.stroke();
    const f = (Math.sin(now / (900 * d / 4 + 1500)) + 1) / 2;
    [[f, '#e8604f'], [1 - f, '#6f8fd8']].forEach(([t, col]) => {
      const [gx, gy] = at(0.06 + t * 0.88);
      g.strokeStyle = C('#4f545e'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 4 * z); g.stroke();
      poly([[gx - 4 * z, gy + 4 * z], [gx + 4 * z, gy + 4 * z], [gx + 3.4 * z, gy + 11 * z], [gx - 3.4 * z, gy + 11 * z]], C(col));
      poly([[gx - 2.8 * z, gy + 5.5 * z], [gx + 2.8 * z, gy + 5.5 * z], [gx + 2.5 * z, gy + 8 * z], [gx - 2.5 * z, gy + 8 * z]], night > 0.15 && isLive() ? '#ffd873' : C('#e6f4ff'));
    });
  }
}
function drawSky(now, z) {
  const inv = state.inventions;
  if (!inv || !inv.size) return;
  const { center: [cx, cy], cables } = skyInfo();
  if (cables.length) drawCables(cables, z, now);
  if (inv.has('ballon')) for (const b of BALLOONS) drawBalloon(b, cx, cy, z, now);
  if (inv.has('zeppelin')) drawZeppelin(cx, cy, z, now);
}
// Feuerwerk: ein paar Dutzend Raketen über dem Rathaus, jede steigt auf und zerplatzt in bunten Funken
let fireworksUntil = 0, lastFire = 0;
const bursts = [];
function startFireworks() { fireworksUntil = performance.now() + 22000; sfx('star'); toast('🎆 Feuerwerk!'); }
const FIRE_COLS = ['#ff6b8a', '#ffd36e', '#8fe3ff', '#b6ff9e', '#d9a8ff', '#ffffff', '#ff9f5a'];
function drawFireworks(now, z) {
  if (now < fireworksUntil && now - lastFire > 350 + Math.random() * 500) {
    lastFire = now;
    const [cx, cy] = skyInfo().center;
    bursts.push({ x: cx + (Math.random() - 0.5) * 10, y: cy + (Math.random() - 0.5) * 10, h: 150 + Math.random() * 130, t0: now,
      col: FIRE_COLS[Math.floor(Math.random() * FIRE_COLS.length)], col2: FIRE_COLS[Math.floor(Math.random() * FIRE_COLS.length)], n: 28 + Math.floor(Math.random() * 16), R: 60 + Math.random() * 50 });
  }
  if (!bursts.length) return;
  g.save();
  if (night > 0.15) g.globalCompositeOperation = 'lighter';
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], age = (now - b.t0) / 2200;
    if (age >= 1) { bursts.splice(i, 1); continue; }
    const p = toScreen(b.x, b.y), top = p.y - b.h * z;
    if (age < 0.28) {                                                          // Rakete steigt
      const k = age / 0.28, ry = p.y - (b.h * z) * k;
      circle(p.x, ry, 1.6 * z, '#fff3b0');
      g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(p.x, ry); g.lineTo(p.x, ry + 10 * z); g.stroke();
      continue;
    }
    const k = (age - 0.28) / 0.72, ease = 1 - Math.pow(1 - k, 3), fall = k * k * 26 * z;
    if (k < 0.15) { g.globalAlpha = (0.15 - k) / 0.15 * 0.5; circle(p.x, top, b.R * 0.5 * z, b.col); }   // Aufblitzen
    g.globalAlpha = Math.max(0, 1 - k);
    for (let j = 0; j < b.n; j++) {
      const an = j / b.n * Math.PI * 2, r = ease * b.R * z, px = p.x + Math.cos(an) * r, py = top + Math.sin(an) * r * 0.85 + fall;
      circle(px, py, (2.6 - k * 1.8) * z + 0.5, j % 2 ? b.col : b.col2);
      const r2 = r * 0.82;                                                    // kurzer Schweif nach innen
      circle(p.x + Math.cos(an) * r2, top + Math.sin(an) * r2 * 0.85 + fall * 0.9, (1.4 - k) * z + 0.3, j % 2 ? b.col : b.col2);
    }
    g.globalAlpha = 1;
  }
  g.restore();
}
