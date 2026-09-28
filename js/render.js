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

  const cs = [toTile(0, 0), toTile(W, 0), toTile(0, H), toTile(W, H)];
  const minX = Math.min(...cs.map(c => c.x)) - 2, maxX = Math.max(...cs.map(c => c.x)) + 6;
  const minY = Math.min(...cs.map(c => c.y)) - 2, maxY = Math.max(...cs.map(c => c.y)) + 6;
  const mX = TW * z, mTop = 110 * z, mBot = TH * z;
  const visible = [];
  for (let s = minX + minY; s <= maxX + maxY; s++) {
    for (let x = Math.max(minX, s - maxY); x <= Math.min(maxX, s - minY); x++) {
      const y = s - x, p = toScreen(x, y);
      if (p.x < -mX || p.x > W + mX || p.y < -mBot || p.y > H + mTop) continue;
      visible.push(x, y, p.x, p.y);
    }
  }

  // 1) Boden
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1];
    FOG = !ownedTile(x, y) && terrainAt(x, y) !== 'water';
    drawGround(x, y, { x: visible[i + 2], y: visible[i + 3] }, z, now);
  }
  FOG = false;

  // 2) Grundstücksgrenzen
  const cMinX = Math.floor(minX / CHUNK) - 1, cMaxX = Math.floor(maxX / CHUNK) + 1;
  const cMinY = Math.floor(minY / CHUNK) - 1, cMaxY = Math.floor(maxY / CHUNK) + 1;
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
        g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -ds : ds, ds);
        drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t);
        g.restore();
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
      if (ter === 'forest' && !(hide && ghostType === 'holz')) drawForest(px, py, z, x, y, 3);
      else if (ter === 'obst' && !(hide && ghostType === 'obst')) drawForest(px, py, z, x, y, 3, true);
      else if (ter === 'rock' && !(hide && ghostType === 'stein')) drawRocks(px, py, z, x, y);
      else if (ter === 'erz' && !(hide && ghostType === 'mine')) drawRocks(px, py, z, x, y, true);
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
    for (const { q, r } of glows) {
      const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2;
      const grd = g.createRadialGradient(gx, gy, 0, gx, gy, r);
      grd.addColorStop(0, `rgba(255,205,100,${0.45 * strength})`);
      grd.addColorStop(1, 'rgba(255,205,100,0)');
      g.fillStyle = grd;
      g.fillRect(gx - r, gy - r, r * 2, r * 2);
      g.globalAlpha = Math.min(1, strength);
      poly(q, '#ffd873');
      g.globalAlpha = 1;
    }
  }

  // Symbole (✨ bereit, 💭 fast geschafft, 🐌 weit weg) über der Nacht, damit man sie immer sieht
  for (const [px, py, icon] of icons) drawStatusIcon(px, py, z, icon, now);

  // 6) Schilder: Sehenswürdigkeiten und „Zu verkaufen“
  for (const [x, y, type] of labels) {
    const p = toScreen(x, y), L = LANDMARKS[type], st = lmStage(type), on = st >= 1;
    const ready = ownedTile(x, y) && st < 3 && !restoreInfo(type).err;
    const lanterns = '🏮'.repeat(st) + '·'.repeat(3 - st);
    pill(`${L.icon} ${L.name} ${lanterns}${ready ? ' ✨' : ''}`, p.x, p.y - 62 * z, st >= 3 ? '#eaffea' : ready ? '#fff3b0' : '#fffaf0',
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

function spawnIncomeFloats(now) {
  for (const [k, t] of state.tiles) {
    const s = T.st.get(k);
    if (!s || !(s.inc > 0 || s.sci > 0 || s.prod || s.conv)) continue;
    if (!t.nf) { t.nf = now + 1000 + Math.random() * 4000; continue; }
    if (now < t.nf) continue;
    t.nf = now + 4000 + Math.random() * 2500;
    const [x, y] = keyXY(k);
    const p = toScreen(x, y);
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
    if (s.prod) addFloat(x, y, Object.keys(s.prod).map(r => '+' + RES[r].icon).join(' '), '#8a5a3c');
    else if (s.conv) { const c = ITEMS[t.b].conv; if (state.res[c.from] >= CONV_RATIO) addFloat(x, y, '+' + RES[c.to].icon, '#8a5a3c'); }
    else if (s.inc > 0) addFloat(x, y, '+' + fmtRate(s.inc * 4), '#b8860b');
    else addFloat(x, y, '💡 +' + fmtRate(s.sci * 4), '#7d6bb0');
  }
}

function confettiBurst() {
  const cols = ['#f2b53a', '#e8705f', '#5f8fe8', '#58b36a', '#b07ad6', '#f28cb1'];
  for (let i = 0; i < 160; i++) {
    confetti.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, col: cols[i % cols.length], life: 5 });
  }
}
