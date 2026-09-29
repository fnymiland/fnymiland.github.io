'use strict';
// ---------------------------------------------------------------------------
// Oberfläche
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const nfc = new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 1 });
const nf1 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
function fmt(n) { return Math.abs(n) < 100000 ? nf.format(Math.floor(n)) : nfc.format(n); }
function fmtRate(n) { return Math.abs(n) < 100 ? nf1.format(n) : fmt(n); }
function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

let toastTimer = 0;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

function thumb(type) {
  const c = document.createElement('canvas');
  c.width = 112; c.height = 88;
  const prev = g; g = c.getContext('2d'); FOG = false;
  const tall = ['leuchtturm', 'windrad'].includes(type), big = isBig(type);
  const z = big ? 0.72 : tall ? 0.95 : 1.3, cx = 56, cy = tall ? 70 : 60, hw = TW / 2 * z, hh = TH / 2 * z, d = DEPTH * z * 0.8;
  const block = (s, top) => {
    poly([[cx - hw * s, cy], [cx, cy + hh * s], [cx, cy + hh * s + d], [cx - hw * s, cy + d]], '#caa26c');
    poly([[cx, cy + hh * s], [cx + hw * s, cy], [cx + hw * s, cy + d], [cx, cy + hh * s + d]], '#b0895a');
    diamond(cx, cy, hw * s, hh * s, top);
  };
  if (type === 'graben') {
    block(1, '#96d56f');
    diamond(cx, cy + 3, hw * 0.6, hh * 0.6, '#74d0e6');
  } else if (type === 'schuett') {
    diamond(cx, cy + 5, hw, hh, '#74d0e6');
    block(0.6, '#96d56f');
  } else if (type === 'weg') {
    block(1, '#96d56f');
    drawPath(cx, cy, z, 1e6, 1e6, { style: currentStyle('weg') });
  } else {
    const ground = { stein: '#aabb94', holz: '#7fc460', obst: '#86c35b', mine: '#b0a287' }[type] || '#96d56f';
    block(1, ground);
    drawObject(type, cx, cy, z, 0, 3, 7, 1, null);
  }
  g = prev;
  return c;
}

function buildToolbar() {
  const cats = $('cats');
  cats.innerHTML = '';
  for (const c of CATS) {
    const b = document.createElement('button');
    b.className = 'cat' + (c.id === cat ? ' active' : '');
    b.textContent = c.label;
    b.onclick = () => { cat = c.id; if (tool !== 'look' && ITEMS[tool].cat !== cat) tool = 'look'; buildToolbar(); };
    cats.append(b);
  }
  const box = $('tools');
  box.innerHTML = '';
  const mk = (id, label, sub, visual) => {
    const b = document.createElement('button');
    b.className = 'tool';
    b.dataset.tool = id;
    b.append(visual);
    const n = document.createElement('span'); n.className = 'name'; n.textContent = label;
    const s = document.createElement('span'); s.className = 'cost'; s.textContent = sub;
    b.append(n, s);
    b.onclick = () => { audio(); setTool(tool === id && id !== 'look' ? 'look' : id); };
    box.append(b);
    return b;
  };
  const emoji = e => { const s = document.createElement('span'); s.className = 'emoji'; s.textContent = e; return s; };
  mk('look', 'Ansehen', 'kaufen & mehr', emoji('👆'));
  for (const id of Object.keys(ITEMS)) {
    const d = ITEMS[id];
    if (d.cat !== cat) continue;
    const locked = !available(id);
    const sub = locked ? lockText(id, true) : id === 'abriss' ? 'roden & mehr' : !d.cost ? 'kostenlos' : `🪙 ${fmt(d.cost)}${d.mat ? ' ' + matText(d.mat) : ''}`;
    const b = mk(id, d.name, sub, id === 'abriss' ? emoji('🧹') : id === 'verschieben' ? emoji('✋') : thumb(id));
    if (d.cost) b.dataset.cost = d.cost;
    if (d.mat) b.dataset.mat = JSON.stringify(d.mat);
    if (locked) { b.classList.add('locked'); b.title = 'Freischalten: ' + unlockText(d); }
  }
  setTool(tool);
}

function setTool(t) {
  if (t !== 'verschieben' && moving) cancelMove();
  tool = t;
  rotManual = false;
  previewCache = null;
  if (t !== 'look') closePanel();
  for (const b of document.querySelectorAll('.tool')) b.classList.toggle('active', b.dataset.tool === t);
  const hint = $('hint');
  $('rot-btn').hidden = !ROTATABLE.has(t);
  renderStyleBar(t);
  if (t === 'look') { hint.hidden = true; return; }
  const d = ITEMS[t], extra = [];
  if (d.mat) extra.push('Material: ' + matText(d.mat));
  if (d.workers) extra.push(`👷 ${d.workers}`);
  if (d.beauty && t !== 'weg') extra.push(`🌸 ${d.beauty}`);
  if (d.ugly) extra.push(`🌸 −${d.ugly} neben Häusern`);
  hint.textContent = `${d.name}: ${d.desc}` + (extra.length ? ' · ' + extra.join(' · ') : '')
    + (d.paint ? ' · verschieben mit zwei Fingern / rechter Maustaste' : '')
    + (ROTATABLE.has(t) && !d.small ? ' · Tür zeigt von selbst zum Weg (drehen: ⟳/Mausrad)' : ROTATABLE.has(t) ? ' · drehen: ⟳' : '');
  hint.hidden = false;
}

// Stil-Leiste für Wege: gewählter Stil wird gemalt, gesperrte zeigen, wie man sie freischaltet
function renderStyleBar(t) {
  const bar = $('style-bar');
  document.body.classList.toggle('has-styles', !!STYLES[t]);
  if (!STYLES[t]) { bar.hidden = true; return; }
  const cur = currentStyle(t);
  bar.innerHTML = STYLES[t].map(st => {
    const ok = styleOk(st);
    return `<button class="style-chip${st.id === cur ? ' on' : ''}" data-style="${st.id}" ${ok ? '' : 'disabled'} title="${ok ? st.name : 'Freischalten: ' + styleLock(st)}">
      <i style="background:${st.col}"></i>${st.name}${ok ? '' : ` <small>🔒 ${styleLock(st)}</small>`}</button>`;
  }).join('');
  for (const b of bar.querySelectorAll('[data-style]')) b.onclick = () => { chosenStyle[t] = b.dataset.style; sfx('deco'); renderStyleBar(t); };
  bar.hidden = false;
}

const canResearch = () => TECHS.some(t => !hasTech(t.id) && (t.req || []).every(hasTech) && state.science >= t.cost);

let goalSmall = false;
function updateHud() {
  $('money').textContent = fmt(state.money);
  $('rate').textContent = '+' + fmtRate(T.inc) + '/s';
  $('pop').textContent = T.jobs + '/' + T.pop;
  $('sci').textContent = fmt(state.science);
  $('sci-rate').textContent = T.sci > 0 ? '+' + fmtRate(T.sci) + '/s' : '';
  $('sci-dot').hidden = !canResearch();
  $('beauty').textContent = T.beauty;
  // Lager: nur Waren zeigen, die man hat oder gerade herstellt
  const shown = Object.keys(RES).filter(r => state.res[r] >= 1 || T.prod[r] || T.conv.some(c => c.to === r || c.from === r));
  const rp = $('res-pill');
  rp.hidden = !shown.length;
  rp.innerHTML = shown.map(r => `<span title="${RES[r].name}">${RES[r].icon} <b>${fmt(state.res[r])}</b></span>`).join('');
  $('town-name').textContent = state.town.name;
  $('hud-lantern').textContent = `${townTitle()} · 🏮 ${lanternCount()}`;
  $('diary-dot').hidden = state.diarySeen >= state.diary.length;
  const fl = $('hud-flag');
  fl.style.background = state.town.color;
  fl.textContent = state.town.symbol;
  for (const b of document.querySelectorAll('[data-cost]')) {
    const poor = state.money < +b.dataset.cost || (b.dataset.mat && !hasMat(JSON.parse(b.dataset.mat)));
    if (b.classList.contains('tool')) b.classList.toggle('poor', poor);
    else b.disabled = poor;
  }
  for (const b of document.querySelectorAll('[data-sci]')) b.disabled = state.science < +b.dataset.sci;
  const top = $('hud').getBoundingClientRect().bottom + 8;
  const goal = $('goal');
  goal.style.top = top + 'px';
  if (window.innerWidth > 600 && !$('panel').classList.contains('float')) $('panel').style.top = top + 'px';
  goal.classList.toggle('small', goalSmall);
  goal.innerHTML = goalHtml();
}
$('goal').onclick = e => {
  if (e.target.dataset.skip) { state.tutorial = -1; save(); toast('Einführung übersprungen – viel Spaß!'); updateHud(); return; }
  const req = e.target.closest('[data-lm]'), pos = req && lmTile(req.dataset.lm);
  if (pos) { const c = iso(pos[0], pos[1]); cam.x = c.x; cam.y = c.y; clampCam(); sparkle(pos[0], pos[1]); return; }
  goalSmall = !goalSmall; updateHud();
};
$('diary-btn').onclick = () => openDiary();

// Infofenster
function closePanel() { $('panel').hidden = true; }
function showPanel(html) {
  const el = $('panel');
  el.classList.remove('float'); el.style.left = '';
  el.innerHTML = html; el.hidden = false;
  return el;
}
// Fenster neben eine Stelle auf dem Bildschirm setzen (nicht auf schmalen Bildschirmen)
function panelAt(sx, sy) {
  const el = $('panel');
  if (sx == null || window.innerWidth <= 600) return;
  el.classList.add('float');
  const w = el.offsetWidth, h = el.offsetHeight, gap = 24;
  const top0 = $('hud').getBoundingClientRect().bottom + 8, bottom0 = $('toolbar').getBoundingClientRect().top - 8;
  let left = sx + gap;
  if (left + w > window.innerWidth - 12) left = sx - gap - w;
  left = Math.max(12, Math.min(window.innerWidth - 12 - w, left));
  const top = Math.max(top0, Math.min(bottom0 - h, sy - h / 2));
  el.style.left = left + 'px'; el.style.top = top + 'px';
}
// Mausrad über der Werkzeugleiste blättert seitwärts
$('tools').addEventListener('wheel', e => {
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  e.currentTarget.scrollLeft += e.deltaY;
  e.preventDefault();
}, { passive: false });
// Höhe der Leiste unten merken, damit Infozeile und Fenster immer darüber sitzen
if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--bar', $('toolbar').offsetHeight + 'px')).observe($('toolbar'));

// Aus einem Infofenster heraus verschieben: aufnehmen und dem Finger bzw. der Maus folgen lassen
function startMove(x, y, slot = 0) {
  closePanel();
  setTool('verschieben');
  pickUp(x, y, slot);
  hover = { x, y }; hoverSlot = slot;
}
const moveBtn = '<button class="btn ghost" id="p-move" aria-label="Verschieben">✋</button>';

function openInfo(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t) { closePanel(); return; }
  if (t.b === 'rathaus') { openTownHall(); return; }
  if (t.b === 'lm') { openLandmark(x, y); return; }
  const d = ITEMS[t.b], s = statusOf(x, y) || {};
  const status = [];
  if (needsReach(t.b)) {
    status.push({
      viertel: '<div class="ok">✓ Liegt im Wohnviertel</div>',
      nah: `<div class="ok">✓ Häuser in Laufweite (bis ${WALK_REACH} Felder)</div>`,
      weit: '<div class="bad">🐌 Weit weg vom Dorf: 50 %. Ein Weg zum Dorf bringt 100 %.</div>',
    }[s.how]);
  }
  if (s.bonus) status.push(`<div class="ok">🏘️ Viertel mit ${s.n} Gebäuden: +${Math.round(s.bonus * 100)} %</div>`);
  else if (s.n > 1) status.push(`<div>🏘️ Viertel mit ${s.n} Gebäuden (ab 3 gibt es +10 %)</div>`);
  else if (s.n) status.push('<div>🏘️ Steht noch allein – ab 3 Gebäuden im Viertel gibt es +10 %</div>');
  if (s.lmb > 1.001) status.push(`<div class="ok">✨ Sehenswürdigkeit in der Nähe: +${Math.round((s.lmb - 1) * 100)} %</div>`);
  const why = [];
  const beete = beetBonus(x, y);
  if (t.b === 'haus') why.push(`👥 ${HOUSE_STAGES[t.lvl - 1].pop} Einwohner`);
  else if (d.pop) why.push(`👥 ${d.pop * t.lvl} Einwohner`);
  if (t.b === 'fischer') why.push(`${countAround(x, y, 1, isWater)} Wasserfelder daneben · Gewässer ${waterBody(x, y) >= 64 ? '64+' : waterBody(x, y)} Felder`);
  if (t.b === 'muehle') why.push(`${countNear(x, y, 1, b => b === 'feld')} Felder daneben`);
  if (t.b === 'baecker') why.push(`${countNear(x, y, 1, b => b === 'muehle')} Mühlen daneben`);
  if (t.b === 'markt') why.push(`${countNear(x, y, 2, isProducerB)} Gebäude in der Nähe`);
  if (t.b === 'fabrik') why.push(`${countNear(x, y, 3, b => b === 'mine')} Bergwerke in der Nähe`);
  if (d.cat === 'bau' && beete) why.push(`${beete} Blumenbeet${beete > 1 ? 'e' : ''}: +${beete * 15} %`);
  const S = BUILD_STAGES[t.b];
  if (S && t.lvl > 1) why.push(`Stufe ${t.lvl}: ×${t.lvl}`);
  const b = beautyOf(t, x, y);
  if (b) why.push(`🌸 ${b > 0 ? '+' : ''}${nf1.format(b)}`);
  if (d.cat === 'deko' && d.beauty && nearHouse(x, y)) why.push('neben Häusern ×1,5');
  const outs = [];
  if (s.prod) for (const [r, v] of Object.entries(s.prod)) outs.push(`+${fmtRate(v * 60)} ${RES[r].icon}/min`);
  else if (d.conv) outs.push(`${CONV_RATIO} ${RES[d.conv.from].icon} → 1 ${RES[d.conv.to].icon} · bis ${fmtRate((s.conv || 0) * 60)}/min`);
  else if (s.inc > 0 || d.cat === 'bau') outs.push(`+${fmtRate(s.inc || 0)} Taler/s`);
  if (d.science) outs.push(`+${fmtRate(s.sci || 0)} 💡/s`);
  // Gebäude-Stufen: Bedingungen, Kosten, Ausbauen
  let grow = '';
  if (S) {
    const info = stageInfo(t, x, y);
    if (info.next) {
      const { money = 0, ...mat } = info.next.cost, missing = info.conds.filter(c => !c.ok).length;
      const costs = [money ? `🪙 ${fmt(Math.min(state.money, money))}/${fmt(money)}` : '',
        ...Object.entries(mat).map(([r, n]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], n))}/${n}`)].filter(Boolean);
      grow = `
        <div class="label">Nächste Stufe: ${info.next.name} · ×${t.lvl + 1}</div>
        <div class="status">${info.conds.map(c => `<div class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} ${c.text}</div>`).join('')}</div>
        <div class="stats">${costs.map(c => `<span>${c}</span>`).join('')}</div>
        <div class="row"><button class="btn" id="p-stage" ${info.ready && canPay(info.next.cost) ? '' : 'disabled'}>
          ${info.ready ? (canPay(info.next.cost) ? '✨ Ausbauen' : 'Material fehlt noch') : `Noch ${missing} ${missing > 1 ? 'Bedingungen' : 'Bedingung'}`}</button></div>`;
    } else grow = '<p class="ok">Höchste Stufe – prächtiger geht es nicht!</p>';
  }
  let colors = '';
  if (t.b === 'haus') {
    const n = hasTech('farben') ? 14 : 7, look = houseLook(t);
    if (t.lvl > 1) colors += `
      <div class="label">Aussehen</div>
      <div class="looks">${HOUSE_STAGES.slice(0, t.lvl).map((st, i) => `<button class="look${i + 1 === look ? ' on' : ''}" data-look="${i + 1}">${st.name}</button>`).join('')}</div>`;
    const wall = t.wall != null ? t.wall : Math.floor(hash(x, y, 3) * 7);
    const roof = t.roof != null ? t.roof : Math.floor(hash(x, y, 4) * 7);
    colors += `
      <div class="label">Wand</div>
      <div class="swatches">${WALLS.slice(0, n).map((c, i) => `<button class="sw${i === wall ? ' on' : ''}" data-wall="${i}" style="background:${c}" aria-label="Wandfarbe ${i + 1}"></button>`).join('')}</div>
      <div class="label">Dach</div>
      <div class="swatches">${ROOFS.slice(0, n).map((c, i) => `<button class="sw${i === roof ? ' on' : ''}" data-roof="${i}" style="background:${c}" aria-label="Dachfarbe ${i + 1}"></button>`).join('')}</div>
      ${n < 14 ? '<p class="muted">Mehr Farben: Forschung „Farbenlehre“</p>' : ''}`;
  }
  // Häuser: Bewohner, Herzen, Wünsche und Ausbauen
  let house = '';
  if (t.b === 'haus') {
    const w = houseWishes(t, x, y), a = animalOf(t);
    const hearts = w.next ? '♥'.repeat(w.met) + '♡'.repeat(w.total - w.met) : '♥♥♥♥♥';
    house = `
      <p class="resident">${a.icon} <b id="p-name">${escHtml(t.name)} ${a.family}</b> <button class="link" id="p-rename" aria-label="Namen ändern">✎</button></p>
      <p class="hearts">${hearts}</p>
      ${w.next ? `<div class="label">Wünsche für: ${w.next.name}</div>
        <div class="status">${w.list.map(v => `<div class="${v.ok ? 'ok' : 'bad'}">${v.ok ? '✓' : '✗'} ${v.text}</div>`).join('')}</div>`
        : '<p class="ok">Alle Wünsche erfüllt – das schönste Haus der Insel!</p>'}`;
    house += w.next ? `<div class="row"><button class="btn" id="p-grow" ${w.ready && hasMat(w.next.mat) ? '' : 'disabled'}>
      ${w.ready ? `Ausbauen · ${matText(w.next.mat)}` : `Noch ${w.total - w.met} ${w.total - w.met > 1 ? 'Wünsche' : 'Wunsch'}`}</button></div>` : '';
  }
  const title = t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : stageName(t);
  const el = showPanel(`
    <h3>${title} ${S ? `<span class="lvl">Stufe ${t.lvl}</span>` : ''}</h3>
    ${house}
    ${outs.length ? `<p class="big">${outs.join(' · ')}</p>` : ''}
    ${status.length ? `<div class="status">${status.join('')}</div>` : ''}
    ${why.length ? `<div class="stats">${why.map(w => `<span>${w}</span>`).join('')}</div>` : ''}
    <p class="muted">${d.desc}</p>
    ${grow}
    ${colors}
    <div class="row">
      ${ROTATABLE.has(t.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`);
  $('p-move').onclick = () => startMove(x, y);
  if ($('p-stage')) $('p-stage').onclick = () => stageUpgrade(x, y);
  if ($('p-grow')) $('p-grow').onclick = () => houseUpgrade(x, y);
  if ($('p-rename')) $('p-rename').onclick = () => {
    const nm = $('p-name');
    nm.outerHTML = `<input class="text-in small" id="p-name-in" maxlength="16" value="${escHtml(t.name)}">`;
    const inp = $('p-name-in');
    inp.focus(); inp.select();
    const done = () => { const v = inp.value.trim(); if (v) { t.name = v; save(); } openInfo(x, y); };
    inp.onkeydown = e => { if (e.key === 'Enter') done(); };
    inp.onblur = done;
  };
  if ($('p-rot')) $('p-rot').onclick = () => {
    // Große Gebäude nur drehen, wenn die gedrehte Grundfläche frei ist
    const k = x + ',' + y, nr = ((t.rot || 0) + 1) % 4;
    state.tiles.delete(k); rebuildCover();
    const err = isBig(t.b) ? placeError(t.b, x, y, nr, { move: true }) : null;
    state.tiles.set(k, t);
    if (err) { recalc(); fail('Zum Drehen ist hier nicht genug Platz'); return; }
    t.rot = nr; t.born = performance.now(); sfx('deco'); recalc(); save();
  };
  $('p-close').onclick = closePanel;
  for (const b of el.querySelectorAll('[data-look]')) b.onclick = () => {
    const n = +b.dataset.look;
    if (n === t.lvl) delete t.look; else t.look = n;
    groundVersion++;                   // anderer Schatten
    t.born = performance.now(); sfx('deco'); save(); openInfo(x, y);
  };
  for (const sw of el.querySelectorAll('[data-wall]')) sw.onclick = () => { t.wall = +sw.dataset.wall; sfx('deco'); save(); openInfo(x, y); };
  for (const sw of el.querySelectorAll('[data-roof]')) sw.onclick = () => { t.roof = +sw.dataset.roof; sfx('deco'); save(); openInfo(x, y); };
  updateHud();
}

function openDecoInfo(x, y, slot) {
  const d = decosAt(x + ',' + y)[slot], it = ITEMS[d.b];
  showPanel(`
    <h3>${it.name}</h3>
    <div class="stats"><span>🌸 +${it.beauty}${nearHouse(x, y) || isHouse(x, y) ? ' ×1,5 neben Häusern' : ''}</span></div>
    <div class="row">
      ${ROTATABLE.has(d.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      <button class="btn danger" id="p-del">Entfernen · +🪙 ${fmt(Math.floor(it.cost / 2))}</button>
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`);
  if ($('p-rot')) $('p-rot').onclick = () => { d.rot = ((d.rot || 0) + 1) % 4; d.born = performance.now(); sfx('deco'); save(); };
  $('p-del').onclick = () => { removeSmall(x, y, slot); closePanel(); };
  $('p-move').onclick = () => startMove(x, y, slot);
  $('p-close').onclick = closePanel;
}

function openLandmark(x, y) {
  const t = state.tiles.get(x + ',' + y), type = t.lm, L = LANDMARKS[type];
  const info = restoreInfo(type), owned = ownedTile(x, y), half = T.lmHalf.has(type);
  const dots = '🏮'.repeat(info.stage) + '<span class="off">🏮</span>'.repeat(3 - info.stage);
  const stageName = info.stage ? LM_STAGES[type][info.stage - 1].name : 'verfallen';
  let body = '';
  if (info.next) {
    const { money = 0, ...mat } = info.next.cost;
    const costs = [money ? `🪙 ${fmt(Math.min(state.money, money))}/${fmt(money)}` : '',
      ...Object.entries(mat).map(([r, n]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], n))}/${n}`)].filter(Boolean);
    const unl = info.next.unlock.map(unlockName);
    body = `
      <div class="label">Nächste Stufe: ${info.next.name}</div>
      <div class="stats">${costs.map(c => `<span>${c}</span>`).join('')}</div>
      ${unl.length ? `<p class="muted">Schaltet frei: ${unl.join(', ')}</p>` : ''}
      ${info.err ? `<div class="status"><div class="bad">${info.err}</div></div>` : ''}
      <div class="row"><button class="btn" id="p-restore" ${info.err ? 'disabled' : ''}>🏮 Restaurieren</button></div>`;
  } else body = '<p class="ok">Vollständig restauriert – alle drei Laternen brennen.</p>';
  showPanel(`
    <h3>${L.icon} ${L.name}</h3>
    <p class="hearts">${dots}</p>
    <p class="muted">Zustand: ${stageName}${info.stage ? ` · Wirkung: ${L.effect}` : ''}</p>
    ${info.stage && half ? '<div class="status"><div class="bad">🐌 Weit weg vom Dorf: wirkt nur halb.</div></div>' : ''}
    ${info.stage && owned ? `<p class="muted">✨ Alles in ${LM_RADIUS} Feldern Umkreis: +${Math.round(LM_BOOST * 100 * (half ? 0.5 : 1))} % Produktion</p>` : ''}
    ${body}
    <div class="row">${info.stage && owned ? moveBtn : ''}<button class="btn ghost" id="p-close" style="flex:1">Schließen</button></div>`);
  if ($('p-restore')) $('p-restore').onclick = () => { if (restoreLandmark(type)) closePanel(); };
  if ($('p-move')) $('p-move').onclick = () => startMove(x, y);
  $('p-close').onclick = closePanel;
}

function openBuy(ck, sx, sy) {
  const [cx, cy] = ck.split(',').map(Number);
  const cnt = { grass: 0, forest: 0, water: 0, rock: 0, erz: 0, obst: 0 };
  for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++)
    for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) cnt[terrainAt(x, y)]++;
  const lms = landmarksIn(ck);
  const price = plotPrice();
  showPanel(`
    <h3>Grundstück kaufen</h3>
    ${lms.map(l => `<p class="big" style="font-size:16px">${LANDMARKS[l].icon} ${LANDMARKS[l].name}<br><span class="muted">${LANDMARKS[l].effect}</span></p>`).join('')}
    <div class="stats">
      <span>🌿 ${cnt.grass} Wiese</span><span>🌲 ${cnt.forest} Wald</span>
      <span>💧 ${cnt.water} Wasser</span><span>🪨 ${cnt.rock} Fels</span>
      ${cnt.erz ? `<span>⛏️ ${cnt.erz} Erz</span>` : ''}${cnt.obst ? `<span>🍎 ${cnt.obst} Obsthain</span>` : ''}
    </div>
    <p class="muted">Jedes weitere Grundstück wird etwas teurer.</p>
    <div class="row">
      <button class="btn" id="p-buy" data-cost="${price}">Kaufen · 🪙 ${fmt(price)}</button>
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`);
  $('p-buy').onclick = () => buyPlot(ck);
  $('p-close').onclick = closePanel;
  panelAt(sx, sy);
  updateHud();
}

// Forschung
function openResearch() {
  const cats = [...new Set(TECHS.map(t => t.cat))];
  openModal(`
    <h2>🔬 Forschung</h2>
    <p>Du hast <span class="sci-have">💡 ${fmt(state.science)}</span> Ideen${T.sci > 0 ? ` (+${fmtRate(T.sci)}/s)` : ' – baue eine Schule!'}.</p>
    <div class="tech-cats">${cats.map(c => `
      <div class="tech-cat"><h4>${c}</h4>${TECHS.filter(t => t.cat === c).map(t => {
        const done = hasTech(t.id), open = (t.req || []).every(hasTech);
        const need = !open ? `<span class="muted">braucht ${t.req.map(r => TECH_BY_ID[r].name).join(', ')}</span>` : '';
        return `<div class="tech${done ? ' done' : ''}${!open && !done ? ' locked' : ''}">
          <b>${done ? '✓ ' : ''}${t.name}</b><span>${t.desc}</span>${need}
          ${!done && open ? `<button class="btn" data-tech="${t.id}" data-sci="${t.cost}" ${state.science < t.cost ? 'disabled' : ''}>Erforschen · 💡 ${t.cost}</button>` : ''}
        </div>`;
      }).join('')}</div>`).join('')}
    </div>
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('modal-card').classList.add('research');
  for (const b of document.querySelectorAll('[data-tech]')) b.onclick = () => research(b.dataset.tech);
  $('m-close').onclick = closeModal;
}
$('sci-btn').onclick = () => { setTool('look'); openResearch(); };

// Stadtname & Flagge
function townEditor(town) {
  return `
    <div class="label">Name deines Ortes</div>
    <input class="text-in" id="t-name" maxlength="20" value="${escHtml(town.name)}">
    <div class="label">Flagge</div>
    <div class="swatches">${FLAG_COLORS.map(c => `<button class="sw${c === town.color ? ' on' : ''}" data-fc="${c}" style="background:${c}" aria-label="Flaggenfarbe"></button>`).join('')}</div>
    <div class="swatches">${FLAG_SYMBOLS.map(s => `<button class="sw${s === town.symbol ? ' on' : ''}" data-fs="${s}" aria-label="Symbol ${s}">${s}</button>`).join('')}</div>`;
}
function wireTownEditor(root, town, onChange) {
  root.querySelector('#t-name').oninput = e => { town.name = e.target.value.trim() || 'Namenlos'; onChange(); };
  for (const b of root.querySelectorAll('[data-fc]')) b.onclick = () => {
    town.color = b.dataset.fc; root.querySelectorAll('[data-fc]').forEach(o => o.classList.toggle('on', o === b)); sfx('deco'); onChange();
  };
  for (const b of root.querySelectorAll('[data-fs]')) b.onclick = () => {
    town.symbol = b.dataset.fs; root.querySelectorAll('[data-fs]').forEach(o => o.classList.toggle('on', o === b)); sfx('deco'); onChange();
  };
}
const townHallAt = () => { const e = [...state.tiles].find(([, t]) => t.b === 'rathaus'); return e ? keyXY(e[0]) : null; };
function openTownHall() {
  const n = lanternCount(), title = townTitle(n), nextTitle = TITLES.find(([min]) => min > n);
  const el = showPanel(`
    <h3>Rathaus von ${escHtml(state.town.name)}</h3>
    <p class="big" style="font-size:18px">${title} · 🏮 ${n} / ${LANTERN_TOTAL}</p>
    ${nextTitle ? `<p class="muted">Ab ${nextTitle[0]} Laternen: ${nextTitle[1]}</p>` : ''}
    <ul class="starlist">${Object.keys(LM_STAGES).map(type => {
      const st = lmStage(type);
      return `<li class="${st >= 3 ? 'done' : ''}">${LANDMARKS[type].icon} ${LANDMARKS[type].name} ${'🏮'.repeat(st)}${'<span class="off">🏮</span>'.repeat(3 - st)}</li>`;
    }).join('')}
      <li class="${state.festival ? 'done' : ''}">🗼 Leuchtturm ${state.festival ? '🏮' : '<span class="off">🏮</span>'}</li></ul>
    ${townEditor(state.town)}
    <div class="row">${townHallAt() ? moveBtn : ''}<button class="btn ghost" id="p-close" style="flex:1">Fertig</button></div>`);
  if ($('p-move')) $('p-move').onclick = () => startMove(...townHallAt());
  wireTownEditor(el, state.town, () => { updateHud(); save(); });
  $('p-close').onclick = closePanel;
}
$('town-btn').onclick = () => { setTool('look'); openTownHall(); };
$('rot-btn').onclick = () => rotateBuild();

// Dialoge
function openModal(html) { const c = $('modal-card'); c.className = 'card'; c.innerHTML = html; $('modal').hidden = false; }
function closeModal() { $('modal').hidden = true; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

function showIntro(first) {
  openModal(`
    <h2>Willkommen auf deiner Insel!</h2>
    <p>Eine kleine Welt zum Verwalten und Gestalten:</p>
    <ul>
      <li>🏠 <b>Häuser</b> bringen Einwohner. Betriebe bis 4 Felder vom nächsten Haus laufen voll, weiter weg nur halb – außer ein <b>Weg</b> verbindet sie mit dem Dorf.</li>
      <li>🏘️ Was aneinandergrenzt oder über <b>Wege</b> verbunden ist, ist ein <b>Viertel</b>: ab 3, 8 und 15 Gebäuden gibt es +10/20/30 %.</li>
      <li>✨ <b>Alles wächst:</b> Häuser und Betriebe haben Stufen. Sind die Bedingungen erfüllt, funkelt es – antippen und selbst ausbauen.</li>
      <li>🎓 <b>Schulen</b> erzeugen Ideen 💡 – damit erforschst du neue Gebäude, Wege-Stile und Deko.</li>
      <li>🏮 <b>Das Ziel:</b> Restauriere die verfallenen Sehenswürdigkeiten – jede Stufe entzündet eine Laterne. Brennen alle, bringt der Leuchtturm das Laternenfest zurück. Das 📖 Tagebuch erzählt, wie es früher war.</li>
    </ul>
    ${first ? townEditor(state.town) : ''}
    <p class="muted" style="font-size:13px">Ziehen = Karte bewegen · Mausrad / zwei Finger = zoomen (beim Bauen dreht das Mausrad) · Wege: gedrückt halten und ziehen</p>
    <div class="row"><button class="btn" id="m-ok">Los geht's!</button></div>`);
  if (first) wireTownEditor($('modal-card'), state.town, updateHud);
  $('m-ok').onclick = () => { closeModal(); save(); };
}
function showMenu() {
  openModal(`
    <h2>Menü</h2>
    <div class="row"><button class="btn" id="m-help">Anleitung</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-sound">${state.muted ? '🔇 Ton ist aus' : '🔊 Ton ist an'}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-home">Zum Rathaus</button></div>
    <div class="row">
      <button class="btn ghost" style="flex:1" id="m-export">💾 Spielstand sichern</button>
      <button class="btn ghost" style="flex:1" id="m-import">📂 Spielstand laden</button>
    </div>
    <div class="row"><button class="btn danger" id="m-reset">Neue Insel beginnen</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  $('m-help').onclick = () => showIntro(false);
  $('m-sound').onclick = () => { state.muted = !state.muted; save(); showMenu(); };
  $('m-home').onclick = () => { const c = iso(ISLAND.cx, ISLAND.cy); state.cam.x = c.x; state.cam.y = c.y; closeModal(); };
  $('m-close').onclick = closeModal;
  $('m-export').onclick = () => { exportSave(); toast('Spielstand als Datei gesichert'); };
  $('m-import').onclick = () => $('import-file').click();
  $('m-reset').onclick = () => {
    const b = $('m-reset');
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Wirklich? Alles geht verloren!'; return; }
    startNew();
    closeModal(); closePanel(); showIntro(true);
  };
}
$('menu-btn').onclick = showMenu;

// Datei als Text lesen (FileReader klappt auch in älteren Safari-Versionen)
function readFileText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

// Spielstand aus Datei laden – erst prüfen, dann nachfragen, dann ersetzen
$('import-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let s;
  try { s = parseSave(JSON.parse(await readFileText(file))); }
  catch (err) { fail('Diese Datei ist kein lesbarer Kachelhausen-Spielstand.'); return; }
  openModal(`
    <h2>Spielstand laden?</h2>
    <p>Insel <b>${escHtml(s.town.name)}</b> mit 🪙 ${fmt(s.money)} und ${s.tiles.size} Gebäuden.</p>
    <p class="muted">Deine jetzige Insel wird dabei ersetzt. Sichere sie vorher, falls du sie behalten willst.</p>
    <div class="row">
      <button class="btn" id="m-yes">Laden</button>
      <button class="btn ghost" id="m-no">Abbrechen</button>
    </div>`);
  $('m-yes').onclick = () => { adoptState(s); closeModal(); closePanel(); toast(`Willkommen zurück in ${s.town.name}!`); };
  $('m-no').onclick = closeModal;
});

// Rohstoffe fließen ins Lager; Verarbeitung nimmt, was da ist
function produce(dt) {
  const before = { ...state.res };
  for (const [r, v] of Object.entries(T.prod)) state.res[r] += v * dt;
  for (const c of T.conv) {
    const want = c.rate * dt, can = Math.min(want, state.res[c.from] / CONV_RATIO);
    if (can <= 0) continue;
    state.res[c.from] -= can * CONV_RATIO;
    state.res[c.to] += can;
  }
  return before;
}
function creditAway(ms, announce) {
  const s = Math.min(Math.max(0, ms / 1000), OFFLINE_MAX_S);
  const earned = T.inc * s, ideas = T.sci * s;
  state.money += earned;
  state.science += ideas;
  const start = { ...state.res };
  for (let left = s; left > 0; left -= 30) produce(Math.min(30, left));
  const gained = Object.keys(RES).map(r => [r, state.res[r] - start[r]]).filter(([, n]) => n >= 1);
  if (announce && s > 60 && earned >= 1) {
    const mins = Math.round(s / 60);
    const dur = mins < 90 ? `${mins} Minuten` : `${nf1.format(mins / 60)} Stunden`;
    openModal(`
      <h2>Schön, dass du da bist!</h2>
      <p>In den letzten ${dur} haben die Leute in ${escHtml(state.town.name)} fleißig gearbeitet:</p>
      <p style="font-size:30px;font-weight:900;color:#3f8f43;margin:6px 0">+ 🪙 ${fmt(earned)}</p>
      ${ideas >= 1 ? `<p style="font-size:20px;font-weight:900;color:#7d6bb0;margin:0">+ 💡 ${fmt(ideas)}</p>` : ''}
      ${gained.length ? `<p style="font-size:18px;font-weight:900;margin:6px 0">${gained.map(([r, n]) => `+ ${RES[r].icon} ${fmt(n)}`).join(' · ')}</p>` : ''}
      ${s >= OFFLINE_MAX_S ? '<p class="muted">(Höchstens 8 Stunden werden angerechnet.)</p>' : ''}
      <div class="row"><button class="btn" id="m-ok">Danke!</button></div>`);
    $('m-ok').onclick = () => { closeModal(); sfx('coin'); };
  }
}
