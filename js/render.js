'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Szene
// ---------------------------------------------------------------------------
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
  night = nightLevel(clockNow());
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

  // 3) Vorschau-Rahmen
  let preview = null;
  if (hover && tool !== 'look' && ownedTile(hover.x, hover.y)) {
    const p = toScreen(hover.x, hover.y);
    const hds = decosAt(hover.x + ',' + hover.y);
    if (tool === 'abriss' && hds && hds[hoverSlot]) {
      preview = { p, ok: true, text: `${ITEMS[hds[hoverSlot].b].name} entfernen: +${fmt(Math.floor(ITEMS[hds[hoverSlot].b].cost / 2))}` };
    } else if (ITEMS[tool] && ITEMS[tool].small) {
      const err = smallError(tool, hover.x, hover.y, hoverSlot);
      preview = { p, ok: !err, small: !err || err === 'Zu wenig Taler', text: err || `🌸 +${ITEMS[tool].beauty}` };
    } else if (tool === 'weg' && bAt(hover.x, hover.y) === 'weg') {
      const cur = styleDef('weg', state.tiles.get(hover.x + ',' + hover.y).style), nx = styleDef('weg', currentStyle('weg'));
      preview = { p, ok: cur.id !== nx.id, text: cur.id === nx.id ? nx.name : `Umfärben: ${cur.name} → ${nx.name}` };
    } else if (tool === 'abriss') {
      const info = demolishInfo(hover.x, hover.y);
      preview = { p, ok: !info.err, text: info.err || (info.refund != null ? `${info.label}: +${fmt(info.refund)}` : `${info.label}: −${fmt(info.cost)}`) };
    } else {
      const err = placeError(tool, hover.x, hover.y);
      const d = ITEMS[tool];
      let text = err;
      if (!err) {
        if (d.cat === 'land' || d.ground) text = `${d.name}: −${fmt(d.cost)}`;
        else if (tool === 'weg') text = styleDef('weg', currentStyle('weg')).name;
        else {
          const pv = previewDelta(tool, hover.x, hover.y), parts = [];
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
      preview = { p, ok: !err, ghost: d.cat !== 'land' && !d.ground && !state.tiles.has(hover.x + ',' + hover.y) && terrainAt(hover.x, hover.y) !== 'water', text };
    }
    g.strokeStyle = preview.ok ? '#3fbf6f' : '#e5484d';
    g.lineWidth = 3 * z;
    g.beginPath();
    g.moveTo(p.x, p.y - TH / 2 * z); g.lineTo(p.x + TW / 2 * z, p.y); g.lineTo(p.x, p.y + TH / 2 * z); g.lineTo(p.x - TW / 2 * z, p.y);
    g.closePath(); g.stroke();
  }

  // 4) Objekte, Bewohner, Fahrzeuge (von hinten nach vorn)
  const byTile = new Map();
  for (const m of walkers.concat(cars)) {
    const k = Math.round(m.px) + ',' + Math.round(m.py);
    if (!byTile.has(k)) byTile.set(k, []);
    byTile.get(k).push(m);
  }
  const icons = [];
  const labels = [];
  for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], px = visible[i + 2], py = visible[i + 3];
    const owned = ownedTile(x, y);
    FOG = !owned;
    const k = x + ',' + y;
    const t = state.tiles.get(k);
    const isGhost = preview && preview.ghost && hover.x === x && hover.y === y;
    if (t) {
      if (t.b === 'lm') { FOG = false; labels.push([x, y, t.lm]); }
      let sc = 1;
      if (t.born) {
        const a = (now - t.born) / 380;
        if (a < 1) { const c1 = 1.70158, c3 = c1 + 1; sc = 0.55 + 0.45 * (1 + c3 * Math.pow(a - 1, 3) + c1 * Math.pow(a - 1, 2)); }
      }
      const ds = sc * decoScale(t.b);
      drawSmall(k, px, py, z, now, x, y, [0]);
      g.save(); g.translate(px, py); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -ds : ds, ds);
      drawObject(t.b, 0, 0, z, now, x, y, t.lvl, t);
      g.restore();
      drawSmall(k, px, py, z, now, x, y, [1, 2, 3]);
      if (t.lvl > 1) drawBadge(px, py, z, t.lvl);
      const s = T.st.get(k);
      if (s && t.b !== 'lm' && !PROBE) {
        const d = ITEMS[t.b];
        const icon = needsReach(t.b) && s.how === 'weit' ? '🐌' : null;
        if (icon) icons.push([px, py, icon]);
      }
    } else {
      const ter = terrainAt(x, y);
      if (ter === 'forest' && !(isGhost && tool === 'holz')) drawForest(px, py, z, x, y, 3);
      else if (ter === 'obst' && !(isGhost && tool === 'obst')) drawForest(px, py, z, x, y, 3, true);
      else if (ter === 'rock' && !(isGhost && tool === 'stein')) drawRocks(px, py, z, x, y);
      else if (ter === 'erz' && !(isGhost && tool === 'mine')) drawRocks(px, py, z, x, y, true);
      drawSmall(k, px, py, z, now, x, y, [0, 1, 2, 3]);
    }
    if (preview && preview.small && hover.x === x && hover.y === y) {
      const [u, v] = slotUV(hoverSlot), q = [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
      g.globalAlpha = 0.65;
      drawSmallOne(tool, buildRot, q[0], q[1], z, now, x, y, 1);
      g.globalAlpha = 1;
    }
    if (isGhost) {
      g.globalAlpha = 0.65;
      g.save(); g.translate(px, py);
      const gs = decoScale(tool);
      g.scale((buildRot & 1) && MIRROR.has(tool) && ROTATABLE.has(tool) ? -gs : gs, gs);
      drawObject(tool, 0, 0, z, now, x, y, 1, { rot: ROTATABLE.has(tool) ? buildRot : 0 });
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
  for (const [px, py, icon] of icons) drawStatusIcon(px, py, z, icon, now);

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

  // 6) Schilder: Sehenswürdigkeiten und „Zu verkaufen“
  for (const [x, y, type] of labels) {
    const p = toScreen(x, y), L = LANDMARKS[type], on = T.lmOn.has(type) || T.lmHalf.has(type);
    pill(`${L.icon} ${L.name}${on ? ' ✓' : ''}`, p.x, p.y - 62 * z, on ? '#eaffea' : '#fff3b0', on ? '#2f7f36' : '#6b4f3a', Math.max(11, 11 * z));
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

function celebrate() {
  sfx('star');
  const cols = ['#f2b53a', '#e8705f', '#5f8fe8', '#58b36a', '#b07ad6', '#f28cb1'];
  for (let i = 0; i < 180; i++) {
    confetti.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, col: cols[i % cols.length], life: 5 });
  }
  const s = state.stars, rw = STARS[s - 1].reward;
  const unlocked = Object.keys(ITEMS).filter(id => ITEMS[id].star === s && !ITEMS[id].tech).map(id => ITEMS[id].name);
  openModal(`
    <h2>${'★'.repeat(s)} ${escHtml(state.town.name)} ist jetzt ${s >= STARS.length ? 'eine' : 'ein'} ${STARS[s - 1].name}!</h2>
    <p>Belohnung: <b>🪙 ${fmt(rw.money)}</b> und <b>💡 ${fmt(rw.sci)}</b></p>
    ${unlocked.length ? `<p>Neu: <b>${unlocked.join(', ')}</b></p>` : ''}
    <p class="muted">${s >= STARS.length ? 'Die Insel ist fertig – aber noch lange nicht zu Ende gestaltet.' : `Nächstes Ziel: ${STARS[s].name}`}</p>
    <div class="row"><button class="btn" id="m-ok">Weiter geht's!</button></div>`);
  $('m-ok').onclick = closeModal;
  buildToolbar();
}
