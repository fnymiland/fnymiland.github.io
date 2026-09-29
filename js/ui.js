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
// oben in der Leiste: glatte Zahlen (unter 1 aber nicht „0“)
function fmtWhole(n) { return n > 0 && n < 0.5 ? '<1' : fmt(Math.round(n)); }
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
  } else if (type === 'schiene') {
    block(1, '#96d56f');
    drawObject('schiene', cx, cy, z, 0, 1e6, 1e6, 1, { rot: 0 });
  } else {
    const ground = { stein: '#aabb94', holz: '#7fc460', obst: '#86c35b', mine: '#b0a287', kristallmine: '#b3c2cc' }[type] || '#96d56f';
    block(1, ground);
    drawObject(type, cx, cy, z, 0, 3, 7, 1, null);
  }
  g = prev;
  return c;
}

// Schnellzugriff: die Werkzeuge, die man ständig braucht, ohne Umweg über die Kategorien (Tasten A, W, V, E)
const QUICK = [['look', '👆', 'Ansehen (A)'], ['weg', '🛤️', 'Weg (W)'], ['verschieben', '✋', 'Verschieben (V)'], ['abriss', '🧹', 'Abreißen (E)']];
// „🏗️ Bauen“ → Symbol und Wort getrennt, damit schmale Bildschirme nur das Symbol zeigen können
function menuLabel(b, label) {
  const m = label.match(/^(\S+)\s+(.+)$/);
  if (!m || /^[A-Za-zÄÖÜäöü]/.test(label)) { b.textContent = label; return; }
  b.innerHTML = `<span class="ic">${m[1]}</span> <span class="tx">${m[2]}</span>`;
  b.setAttribute('aria-label', m[2]); b.title = m[2];
}
function buildToolbar() {
  const cats = $('cats');
  cats.innerHTML = '';
  for (const [id, icon, label] of QUICK) {
    const b = document.createElement('button');
    b.className = 'quick' + (tool === id ? ' active' : '');
    b.dataset.quick = id;
    b.textContent = icon;
    b.title = label; b.setAttribute('aria-label', label);
    b.onclick = () => { audio(); setTool(tool === id && id !== 'look' ? 'look' : id); };
    cats.append(b);
  }
  const sep = document.createElement('span'); sep.className = 'quick-sep'; cats.append(sep);
  // Bereiche (Bauen · Verschönern · Verbinden · Gelände); ein Werkzeug aus einem anderen Bereich wird weggelegt
  const keep = () => { if (tool !== 'look' && !menuItemsOf(menuTop, menuSub).includes(tool)) tool = 'look'; };
  for (const m of MENU) {
    const b = document.createElement('button');
    b.className = 'cat' + (m.id === menuTop ? ' active' : '');
    b.dataset.menu = m.id;
    menuLabel(b, m.label);
    b.onclick = () => { menuTop = m.id; keep(); buildToolbar(); };
    cats.append(b);
  }
  // bei „Bauen“: Filter nach Zweck
  const subs = $('subcats'), top = MENU.find(m => m.id === menuTop) || MENU[0];
  subs.innerHTML = '';
  subs.hidden = !top.groups;
  if (top.groups) for (const [id, label] of [['alle', 'Alle'], ...top.groups.map(g => [g.id, g.label])]) {
    const b = document.createElement('button');
    b.className = 'sub' + (id === menuSub ? ' active' : '');
    b.dataset.sub = id;
    menuLabel(b, label);
    b.onclick = () => { menuSub = id; keep(); buildToolbar(); };
    subs.append(b);
  }
  const box = $('tools');
  box.innerHTML = '';
  const mk = (id, label, sub, visual, fx) => {
    const b = document.createElement('button');
    b.className = 'tool';
    b.dataset.tool = id;
    b.append(visual);
    const n = document.createElement('span'); n.className = 'name'; n.textContent = label;
    const s = document.createElement('span'); s.className = 'cost'; s.textContent = sub;
    b.append(n, s);
    if (fx) { const f = document.createElement('span'); f.className = 'fx'; f.textContent = fx; b.append(f); }
    b.onclick = () => { audio(); setTool(tool === id && id !== 'look' ? 'look' : id); };
    box.append(b);
    return b;
  };
  const emoji = e => { const s = document.createElement('span'); s.className = 'emoji'; s.textContent = e; return s; };
  mk('look', 'Ansehen', 'kaufen & mehr', emoji('👆'));
  for (const id of menuItemsOf(menuTop, menuSub)) {
    const d = ITEMS[id];
    const locked = !available(id);
    const sub = locked ? lockText(id, true) : id === 'abriss' ? 'roden & mehr' : !d.cost ? 'kostenlos' : `🪙 ${fmt(d.cost)}${d.mat ? ' ' + matText(d.mat) : ''}`;
    const b = mk(id, d.name, sub, id === 'abriss' ? emoji('🧹') : id === 'verschieben' ? emoji('✋') : thumb(id), effectText(id));
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
  for (const b of document.querySelectorAll('.quick')) b.classList.toggle('active', b.dataset.quick === t);
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

// Stil-Leiste für Wege: nur, was man schon hat – alles Weitere gibt es in der Kunstakademie
function renderStyleBar(t) {
  const bar = $('style-bar');
  document.body.classList.toggle('has-styles', !!STYLES[t]);
  if (!STYLES[t]) { bar.hidden = true; return; }
  const cur = currentStyle(t), have = STYLES[t].filter(styleOk), more = STYLES[t].length - have.length;
  bar.innerHTML = have.map(st => `<button class="style-chip${st.id === cur ? ' on' : ''}" data-style="${st.id}" title="${st.name}" aria-label="${st.name}">
      <i style="background:${st.col}"></i><span>${st.name}</span></button>`).join('')
    + (more ? `<button class="style-chip more" data-more="1" title="Weitere Wege freischalten">🎨 <span>${more} weitere</span></button>` : '');
  for (const b of bar.querySelectorAll('[data-style]')) b.onclick = () => { chosenStyle[t] = b.dataset.style; sfx('deco'); renderStyleBar(t); };
  if (bar.querySelector('[data-more]')) bar.querySelector('[data-more]').onclick = () => openResearch('design');
  bar.hidden = false;
}

const canResearch = () => TECHS.some(t => techReady(t) && state.science >= t.cost);

let goalSmall = false, unlockSig = '';
function updateHud() {
  $('money').textContent = fmt(state.money);
  $('rate').textContent = '+' + fmtWhole(T.inc) + '/s';
  $('pop').textContent = T.jobs + '/' + T.pop;
  $('sci').textContent = fmt(state.science);
  $('sci-rate').textContent = T.sci > 0 ? '+' + fmtWhole(T.sci) + '/s' : '';
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
    // !! wichtig: toggle(…, undefined) würde bei jedem Aufruf umschalten (der Preis blinkte)
    const poor = !!(state.money < +b.dataset.cost || (b.dataset.mat && !hasMat(JSON.parse(b.dataset.mat))));
    if (b.classList.contains('tool')) b.classList.toggle('poor', poor);
    else b.disabled = poor;
  }
  for (const b of document.querySelectorAll('[data-sci]')) b.disabled = state.science < +b.dataset.sci;
  const top = $('hud').getBoundingClientRect().bottom + 8;
  const goal = $('goal');
  goal.style.top = top + 'px';
  if (window.innerWidth > 600 && !$('panel').classList.contains('float')) $('panel').style.top = top + 'px';
  goal.classList.toggle('small', goalSmall);
  setHtml(goal, goalHtml(), true);
  // Leiste unten: was inzwischen freigeschaltet ist, wird sofort bunt
  const sig = Object.keys(ITEMS).map(id => +available(id)).join('') + Object.values(STYLES).flat().map(st => +styleOk(st)).join('');
  if (sig !== unlockSig) { if (unlockSig) buildToolbar(); unlockSig = sig; }
  refreshLive();
}
$('goal').onclick = e => {
  if (e.target.dataset.skip) { state.tutorial = -1; save(); toast('Einführung übersprungen – viel Spaß!'); updateHud(); return; }
  const req = e.target.closest('[data-lm]'), pos = req && lmTile(req.dataset.lm);
  if (pos) { jumpTo(pos[0], pos[1], 3, 3); sparkle(pos[0] + 1, pos[1] + 1); return; }
  const isl = e.target.closest('[data-isle]');
  if (isl) { const i = ISLE_BY_ID[isl.dataset.isle], [x, y] = isleAnchor(i); jumpTo(x, y, 3, 3); openIsle(i.id); return; }
  goalSmall = !goalSmall; updateHud();
};
$('diary-btn').onclick = () => openDiary();

// Offene Fenster aktualisieren sich live: Jedes merkt sich, wie es geöffnet wurde (live), updateHud baut es
// neu, und patch() ändert nur, was sich unterscheidet – Knöpfe, Fokus und Scrollstand bleiben erhalten.
let panelLive = null, modalLive = null, liveNow = false, pressIn = null;
const nodeKey = n => n.nodeType === 1 ? n.nodeName + '#' + n.id + '.' + n.className : n.nodeName;
function patch(from, to) {
  // gleicher Anfang und gleiches Ende bleiben stehen, nur die Mitte wird ausgetauscht
  const a = [...from.childNodes], b = [...to.childNodes];
  let s = 0, ea = a.length, eb = b.length;
  while (s < ea && s < eb && nodeKey(a[s]) === nodeKey(b[s])) s++;
  while (ea > s && eb > s && nodeKey(a[ea - 1]) === nodeKey(b[eb - 1])) { ea--; eb--; }
  const ref = a[ea] || null;
  for (let i = s; i < ea; i++) from.removeChild(a[i]);
  for (let i = s; i < eb; i++) from.insertBefore(b[i], ref);
  const pairs = [];
  for (let i = 0; i < s; i++) pairs.push([a[i], b[i]]);
  for (let i = 0; i < a.length - ea; i++) pairs.push([a[ea + i], b[eb + i]]);
  for (const [n, m] of pairs) {
    if (n.nodeType !== 1) { if (n.nodeValue !== m.nodeValue) n.nodeValue = m.nodeValue; continue; }
    for (const at of [...n.attributes]) if (!m.hasAttribute(at.name)) n.removeAttribute(at.name);
    for (const at of m.attributes) if (n.getAttribute(at.name) !== at.value) n.setAttribute(at.name, at.value);
    if ('disabled' in n) n.disabled = m.hasAttribute('disabled');
    patch(n, m);
  }
}
function setHtml(el, html, keep = liveNow) {
  if (!keep) { el.innerHTML = html; return; }
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  patch(el, tpl.content);
}
// Nicht auffrischen, während jemand tippt oder gerade einen Knopf drückt
const busy = el => pressIn === el || (el.contains(document.activeElement) && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName));
function refreshLive() {
  if (liveNow) return;
  liveNow = true;
  try {
    if (panelLive && !$('panel').hidden && !busy($('panel'))) panelLive();
  } catch (e) { console.error(e); closePanel(); }
  try {
    if (modalLive && !$('modal').hidden && !busy($('modal'))) modalLive();
  } catch (e) { console.error(e); modalLive = null; }
  liveNow = false;
}
addEventListener('pointerdown', e => { pressIn = e.target.closest && e.target.closest('#panel, #modal'); }, true);
for (const ev of ['pointerup', 'pointercancel']) addEventListener(ev, () => { pressIn = null; }, true);

// Infofenster
function closePanel() { $('panel').hidden = true; panelLive = null; }
function showPanel(html, live = null) {
  const el = $('panel');
  if (!liveNow) { el.classList.remove('float'); el.style.left = ''; }
  setHtml(el, html); el.hidden = false;
  panelLive = live;
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
if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--sbar', $('style-bar').offsetHeight + 'px')).observe($('style-bar'));

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
  if (s.rail > 1 && t.b !== 'station') status.push(`<div class="ok">🚆 Bahnanschluss der Insel: +${Math.round(RAIL_BONUS * 100)} %</div>`);
  if (t.b === 'station') status.push(...stationStatus(x + ',' + y));
  if (t.b === 'windrad' && (hasTech('bahn') || T.rail.lines.length)) {
    status.push(`<div>⚡ Strom für Züge: ${T.rail.wind} ${T.rail.wind === 1 ? 'Windrad' : 'Windräder'} – je Zug ${TRAIN_POWER}` +
      (T.rail.lines.length ? ` · ${T.rail.trains} von ${T.rail.lines.length} ${T.rail.lines.length > 1 ? 'Zügen fahren' : 'Zug fährt'}` : '') + '</div>');
  }
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
  if (t.b === 'haus' || PAINTABLE.has(t.b)) {
    const house = t.b === 'haus';
    if (house && t.lvl > 1) colors += `
      <div class="label">Aussehen</div>
      <div class="looks">${HOUSE_STAGES.slice(0, t.lvl).map((st, i) => `<button class="look${i + 1 === houseLook(t) ? ' on' : ''}" data-look="${i + 1}">${st.name}</button>`).join('')}</div>`;
    // Häuser haben immer eine Farbe (sonst aus der Lage), andere Gebäude ihre eigene, bis man eine wählt
    const wall = t.wall != null ? t.wall : house ? Math.floor(hash(x, y, 3) * 7) : -1;
    const roof = t.roof != null ? t.roof : house ? Math.floor(hash(x, y, 4) * 7) : -1;
    colors += `
      ${!house && (t.wall != null || t.roof != null) ? '<div class="looks"><button class="look" data-orig="1">↺ Originalfarben</button></div>' : ''}
      <div class="label">Wand</div>
      <div class="swatches">${colorsOf('wall').map(([c, i]) => `<button class="sw${i === wall ? ' on' : ''}" data-wall="${i}" style="background:${c}" aria-label="Wandfarbe ${i + 1}"></button>`).join('')}</div>
      <div class="label">Dach</div>
      <div class="swatches">${colorsOf('roof').map(([c, i]) => `<button class="sw${i === roof ? ' on' : ''}" data-roof="${i}" style="background:${c}" aria-label="Dachfarbe ${i + 1}"></button>`).join('')}</div>
      ${colorsOf('wall').length + colorsOf('roof').length < 28 ? '<p class="muted"><span class="link" data-openart="1">Mehr Farben in der Kunstakademie 🎨</span></p>' : ''}`;
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
        : w.later ? `<p class="muted">✨ Mit Kristall 💎 von der Kristallinsel kann daraus eine ${w.later.name} werden.</p>`
        : '<p class="ok">Alle Wünsche erfüllt – das schönste Haus der Insel!</p>'}`;
    house += w.next ? `<div class="row"><button class="btn" id="p-grow" ${w.ready && hasMat(w.next.mat) ? '' : 'disabled'}>
      ${w.ready ? `Ausbauen · ${matText(w.next.mat)}` : `Noch ${w.total - w.met} ${w.total - w.met > 1 ? 'Wünsche' : 'Wunsch'}`}</button></div>` : '';
  }
  const line = t.b === 'station' ? lineOf(x + ',' + y) : null;
  const train = line ? trainChooser(line) : '';
  const title = t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : stageName(t);
  const el = showPanel(`
    <h3>${title} ${S ? `<span class="lvl">Stufe ${t.lvl}</span>` : ''}</h3>
    ${house}
    ${outs.length ? `<p class="big">${outs.join(' · ')}</p>` : ''}
    ${status.length ? `<div class="status">${status.join('')}</div>` : ''}
    ${why.length ? `<div class="stats">${why.map(w => `<span>${w}</span>`).join('')}</div>` : ''}
    <p class="muted">${d.desc}</p>
    ${grow}
    ${train}
    ${colors}
    <div class="row">
      ${ROTATABLE.has(t.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, () => state.tiles.get(x + ',' + y) === t ? openInfo(x, y) : closePanel());
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
  if (el.querySelector('[data-openart]')) el.querySelector('[data-openart]').onclick = () => { closePanel(); openResearch('design'); };
  for (const b of el.querySelectorAll('[data-look]')) b.onclick = () => {
    const n = +b.dataset.look;
    if (n === t.lvl) delete t.look; else t.look = n;
    groundVersion++;                   // anderer Schatten
    t.born = performance.now(); sfx('deco'); save(); openInfo(x, y);
  };
  if (el.querySelector('[data-orig]')) el.querySelector('[data-orig]').onclick = () => { delete t.wall; delete t.roof; sfx('deco'); save(); openInfo(x, y); };
  for (const sw of el.querySelectorAll('[data-wall]')) sw.onclick = () => { t.wall = +sw.dataset.wall; sfx('deco'); save(); openInfo(x, y); };
  for (const sw of el.querySelectorAll('[data-roof]')) sw.onclick = () => { t.roof = +sw.dataset.roof; sfx('deco'); save(); openInfo(x, y); };
  if (line) wireTrainChooser(el, line, () => openInfo(x, y));
  if (!liveNow) updateHud();
}

// Bahnhof: wohin fährt der Zug, hat er Strom?
function stationStatus(k) {
  const line = lineOf(k), names = l => l.regions.map(regionName);
  if (T.rail.stationNet.get(k) == null) return ['<div class="bad">✗ Keine Schiene direkt am Bahnhof</div>'];
  if (!line) return ['<div class="bad">✗ Noch kein Ziel: Schienen bis zu einem Bahnhof auf einer anderen Insel legen</div>'];
  const out = [`<div class="ok">🚆 Linie ${names(line).join(' ↔ ')}</div>`];
  if (line.powered) out.push(`<div class="ok">✓ Der Zug fährt: 👥 +${COMMUTERS} Pendler, +${Math.round(RAIL_BONUS * 100)} % für ${names(line).join(' und ')}</div>`);
  else out.push(`<div class="bad">⚡ Zu wenig Strom: ${T.rail.wind} von ${T.rail.needed} Windrädern (je Zug ${TRAIN_POWER})</div>`);
  return out;
}
// Zug der Linie: Modell und Farbe wählt der Spieler; gespeichert an allen Bahnhöfen der Linie
const TRAIN_MODELS = [['regio', 'Regionalbahn'], ['tram', 'Straßenbahn'], ['modern', 'Triebwagen']];
const TRAIN_COLS = ['#d9534a', '#3e7fd0', '#58b36a', '#f2b53a', '#b07ad6', '#f28cb1', '#4a4a58'];
function lineTrain(line) {
  const t = line.stations.map(k => state.tiles.get(k)).find(t => t && t.train);
  return t ? { model: t.train, col: t.trainCol || 0 } : { model: 'regio', col: 0 };
}
function trainChooser(line) {
  const cur = lineTrain(line);
  return `<div class="label">Zug dieser Linie</div>
    <div class="looks">${TRAIN_MODELS.map(([id, name]) => `<button class="look${id === cur.model ? ' on' : ''}" data-train="${id}">${name}</button>`).join('')}</div>
    <div class="swatches">${TRAIN_COLS.map((c, i) => `<button class="sw${i === cur.col ? ' on' : ''}" data-tcol="${i}" style="background:${c}" aria-label="Zugfarbe ${i + 1}"></button>`).join('')}</div>`;
}
function wireTrainChooser(el, line, reopen) {
  const set = (model, col) => {
    for (const k of line.stations) { const t = state.tiles.get(k); if (t) { t.train = model; t.trainCol = col; } }
    sfx('deco'); save(); syncTrains(); reopen();
  };
  const cur = lineTrain(line);
  for (const b of el.querySelectorAll('[data-train]')) b.onclick = () => set(b.dataset.train, cur.col);
  for (const b of el.querySelectorAll('[data-tcol]')) b.onclick = () => set(cur.model, +b.dataset.tcol);
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
    <div class="row">${info.stage && owned ? moveBtn : ''}<button class="btn ghost" id="p-close" style="flex:1">Schließen</button></div>`,
    () => state.tiles.get(x + ',' + y) === t ? openLandmark(x, y) : closePanel());
  if ($('p-restore')) $('p-restore').onclick = () => { if (restoreLandmark(type)) closePanel(); };
  if ($('p-move')) $('p-move').onclick = () => startMove(x, y);
  $('p-close').onclick = closePanel;
}

// Themen-Insel: was sie bietet, was zum Erschließen fehlt
function openIsle(id, sx, sy) {
  const i = ISLE_BY_ID[id], nxt = nextIsle(), L = LANDMARKS[i.lm];
  const need = isleNeeds(i), ok = need.every(c => c.ok), isNext = nxt === i;
  showPanel(`
    <h3>${i.icon} ${i.name}</h3>
    <p class="muted">${i.text}</p>
    <p>${L.icon} <b>${L.name}</b><br><span class="muted">${L.effect}</span></p>
    ${isNext ? `
      <div class="label">Zum Erschließen</div>
      <div class="status">${need.map(c => `<div class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} ${c.text}${c.have != null && !c.ok ? ` · du hast ${fmt(c.have)}` : ''}</div>`).join('')}</div>
      ${i.need.money || i.need.science ? '<p class="muted">Taler und Ideen werden dabei ausgegeben.</p>' : ''}
      <div class="row"><button class="btn" id="p-isle" ${ok ? '' : 'disabled'}>🏝️ Erschließen</button><button class="btn ghost" id="p-close">Schließen</button></div>`
    : `<div class="status"><div class="bad">🔒 Erst die ${nxt.icon} ${nxt.name} erschließen</div></div>
      <div class="row"><button class="btn ghost" id="p-close">Schließen</button></div>`}`, () => isleOpen(id) ? closePanel() : openIsle(id));
  if ($('p-isle')) $('p-isle').onclick = () => { closePanel(); unlockIsland(id); };
  $('p-close').onclick = closePanel;
  panelAt(sx, sy);
}
// Alte Spielstände: einmal erklären, was sich geändert hat
function announceIslands(m) {
  openModal(`
    <h2>🏝️ Neu: Themen-Inseln!</h2>
    <p>Die Sehenswürdigkeiten sind auf eigene Inseln im Meer umgezogen – mit allen Laternen, die schon brennen.</p>
    ${m.isles.length ? `<p>Schon erschlossen: <b>${m.isles.map(id => ISLE_BY_ID[id].icon + ' ' + ISLE_BY_ID[id].name).join(', ')}</b></p>` : ''}
    <p>Deine Heimatinsel gehört dir jetzt ganz.${m.refund ? ` Für gekaufte Grundstücke bekommst du <b>🪙 ${fmt(m.refund)}</b> zurück.` : ''}</p>
    <p class="muted">Weitere Inseln erschließt du nacheinander – oben links steht immer, welche als Nächstes dran ist.</p>
    <div class="row"><button class="btn" id="m-ok">Schön!</button></div>`);
  $('m-ok').onclick = closeModal;
}

// Wege, die es nur als Geschenk einer Sehenswürdigkeit gibt – zur Vorschau zwischen den käuflichen
const giftStyles = () => STYLES.weg.filter(st => st.lm).map(st => {
  const have = styleOk(st);
  return `<button class="design gift${have ? ' have' : ''}" disabled title="${st.name}">
    <i style="background:${st.col}"></i><span class="dn">${st.name}</span>
    <small>${have ? '✓' : '🎁 ' + unlockText(st, true)}</small></button>`;
}).join('');

// Forschung
// Forschung mit zwei Seiten: Wissen (Ideen, drei Stufen nach Schule/Bibliothek/Uni) und Kunstakademie (Aussehen, Taler)
let researchTab = 'wissen';
function openResearch(tab = researchTab) {
  researchTab = tab;
  let body;
  if (tab === 'wissen') {
    body = `
      <p>Du hast <span class="sci-have">💡 ${fmt(state.science)}</span> Ideen${T.sci > 0 ? ` (+${fmtRate(T.sci)}/s)` : ' – Ideen kommen aus Schulen (Ruineninsel)'}.</p>
      <div class="tech-cats">${[1, 2, 3].map(tier => {
        const open = tierOpen(tier);
        return `<div class="tech-cat${open ? '' : ' closed'}"><h4>Stufe ${tier} · ${TECH_TIERS[tier].name}${open ? '' : ' 🔒'}</h4>
          ${open ? '' : `<p class="muted">Baue eine ${TECH_TIERS[tier].name}, um hier zu forschen.</p>`}
          ${TECHS.filter(t => t.tier === tier).map(t => {
            const done = hasTech(t.id), ready = techReady(t), reqOk = (t.req || []).every(hasTech), lmOk = techLmOk(t);
            const needs = [...(reqOk ? [] : t.req.map(r => TECH_BY_ID[r].name)), ...(lmOk ? [] : [unlockText({ lm: t.lm })])];
            const need = needs.length && !done ? `<span class="muted">braucht ${needs.join(', ')}</span>` : '';
            return `<div class="tech${done ? ' done' : ''}${!ready && !done ? ' locked' : ''}">
              <b>${done ? '✓ ' : ''}${t.name}</b><span>${t.desc}</span>${need}
              ${ready ? `<button class="btn" data-tech="${t.id}" data-sci="${t.cost}" ${state.science < t.cost ? 'disabled' : ''}>Erforschen · 💡 ${t.cost}</button>` : ''}
            </div>`;
          }).join('')}</div>`;
      }).join('')}</div>`;
  } else {
    const groups = [...new Set(DESIGN.map(d => d.group))], master = hasBuilt('kunst');
    body = `
      <p>Such dir aus, was dir gefällt – jedes Stück einzeln. Du hast <b>🪙 ${fmt(state.money)}</b>.
        ${master ? '' : '<span class="muted">Meisterstücke (✦) braucht eine Kunstakademie.</span>'}</p>
      ${groups.map(gr => `<div class="label">${gr}</div><div class="design-grid">${DESIGN.filter(d => d.group === gr).map(d => {
        const have = !d.price || state.design.has(d.id), err = have ? null : designError(d);
        const look = d.col ? `<i style="background:${d.col}"></i>` : `<span class="emoji">${{ laterne: '🏮', pavillon: '⛩️', statue: '⭐' }[d.item] || '🎨'}</span>`;
        return `<button class="design${have ? ' have' : ''}" data-design="${d.id}" ${have || err === 'Braucht eine Kunstakademie' ? 'disabled' : ''} title="${d.name}">
          ${look}<span class="dn">${d.col && d.group !== 'Wege' ? '' : d.name}</span>
          <small>${have ? '✓' : `${d.master ? '✦ ' : ''}🪙 ${fmt(d.price)}`}</small></button>`;
      }).join('')}${gr === 'Wege' ? giftStyles() : ''}</div>`).join('')}`;
  }
  openModal(`
    <h2>🔬 Forschung</h2>
    <div class="looks hall-tabs">
      <button class="look${tab === 'wissen' ? ' on' : ''}" data-rtab="wissen">📚 Wissen</button>
      <button class="look${tab === 'design' ? ' on' : ''}" data-rtab="design">🎨 Kunstakademie</button>
    </div>
    ${body}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`, () => openResearch(tab));
  $('modal-card').classList.add('research');
  for (const b of document.querySelectorAll('[data-rtab]')) b.onclick = () => { sfx('deco'); openResearch(b.dataset.rtab); };
  for (const b of document.querySelectorAll('[data-tech]')) b.onclick = () => research(b.dataset.tech);
  for (const b of document.querySelectorAll('[data-design]')) b.onclick = () => { if (buyDesign(b.dataset.design)) openResearch('design'); };
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
// Rathaus: die Zentrale des Orts – Übersicht, was bereit ist, was sich die Leute wünschen, Name/Flagge/Farben
let hallTab = 'overview';
function jumpTo(x, y, w = 1, h = 1) {
  const c = iso(x + (w - 1) / 2, y + (h - 1) / 2);
  cam.x = c.x; cam.y = c.y; clampCam();
}
// Alles, was bereit ist (✨) oder bei dem nur noch eine Sache fehlt (💭)
function readyList() {
  const ready = [], almost = [];
  for (const [k, t] of state.tiles) {
    const s = T.st.get(k), [x, y] = keyXY(k);
    if (!s) continue;
    const where = { x, y, b: t.b };
    if (t.b === 'haus' && s.wish && s.wish.next) {
      const who = `${animalOf(t).icon} ${escHtml(t.name || '')}: ${HOUSE_STAGES[t.lvl - 1].name}`;
      if (s.wish.ready) ready.push({ ...where, kind: 'haus', cost: s.wish.next.mat || {}, text: `${who} → ${s.wish.next.name}` });
      else if (s.wish.met === s.wish.total - 1) almost.push({ ...where, text: `${who} – fehlt: ${s.wish.list.find(w => !w.ok).text}` });
    } else if (s.grow && s.grow.next) {
      const miss = s.grow.conds.filter(c => !c.ok);
      if (s.grow.ready) ready.push({ ...where, kind: 'stage', cost: s.grow.next.cost, text: `${stageName(t)} → ${s.grow.next.name}` });
      else if (miss.length === 1) almost.push({ ...where, text: `${stageName(t)} – fehlt: ${miss[0].text}` });
    }
  }
  for (const type of Object.keys(LM_STAGES)) {
    const info = restoreInfo(type);
    if (info.next && !info.err && info.pos) ready.push({ x: info.pos[0], y: info.pos[1], b: 'lm', kind: 'lm', type, cost: info.next.cost, text: `🏮 ${lmStepName(type, info.stage + 1)}` });
  }
  return { ready, almost };
}
function openTownHall(tab = hallTab) {
  hallTab = tab;
  const n = lanternCount(), title = townTitle(n), nextTitle = TITLES.find(([min]) => min > n);
  const tabs = [['overview', 'Übersicht'], ['ready', 'Bereit'], ['isles', 'Inseln'], ['wishes', 'Wünsche'], ['town', 'Ort']];
  const { ready, almost } = readyList();
  let body = '';
  if (tab === 'overview') {
    const rates = Object.keys(RES).filter(r => T.prod[r] || T.conv.some(c => c.to === r) || state.res[r] >= 1).map(r => {
      const made = (T.prod[r] || 0) + T.conv.filter(c => c.to === r).reduce((s, c) => s + c.rate, 0);
      return `<span>${RES[r].icon} ${fmt(state.res[r])}${made ? ` <small>+${fmtRate(made * 60)}/min</small>` : ''}</span>`;
    });
    const count = [...state.tiles.values()].filter(t => t.b !== 'weg' && t.b !== 'lm' && ITEMS[t.b].cat).length;
    const nx = nextIsle();
    body = `
      <div class="hall-quick">
        <button class="btn ghost small" data-quick-go="wissen">🔬 Forschung</button>
        <button class="btn ghost small" data-quick-go="design">🎨 Kunstakademie</button>
        <button class="btn ghost small" data-quick-go="diary">📖 Tagebuch</button>
        ${nx ? `<button class="btn ghost small" data-isle-go="${nx.id}">${nx.icon} Nächste Insel</button>` : ''}
      </div>
      <p class="big" style="font-size:18px">${title} · 🏮 ${n} / ${LANTERN_TOTAL}</p>
      ${nextTitle ? `<p class="muted">Ab ${nextTitle[0]} Laternen: ${nextTitle[1]}</p>` : ''}
      <div class="stats">
        <span>👥 ${T.pop} Einwohner</span><span>👷 ${T.jobs} arbeiten</span><span>🏠 ${count} Gebäude</span>
        <span>🪙 +${fmtRate(T.inc)}/s</span><span>💡 +${fmtRate(T.sci)}/s</span><span>🌸 ${T.beauty}</span>
        ${T.rail.lines.length ? `<span>🚆 ${T.rail.trains}/${T.rail.lines.length} ${T.rail.lines.length > 1 ? 'Züge' : 'Zug'} · ⚡ ${T.rail.wind}/${T.rail.needed}</span>` : ''}
      </div>
      ${rates.length ? `<div class="label">Lager</div><div class="stats">${rates.join('')}</div>` : ''}
      <div class="label">Laternen</div>
      ${Object.keys(LM_STAGES).map(type => {
        const st = lmStage(type), open = !!lmTile(type) && ownedTile(...lmTile(type));
        return `<div class="hall-row${st >= 3 ? ' done' : ''}"><span>${LANDMARKS[type].icon} ${LANDMARKS[type].name} ${'🏮'.repeat(st)}${'<span class="off">🏮</span>'.repeat(3 - st)}</span>
          ${open ? `<button class="btn ghost small" data-lm-go="${type}">Hin</button>` : '<span class="muted">🔒</span>'}</div>`;
      }).join('')}
      <div class="hall-row${state.festival ? ' done' : ''}"><span>🗼 Leuchtturm ${state.festival ? '🏮' : '<span class="off">🏮</span>'}</span></div>`;
  } else if (tab === 'ready') {
    // Ausbauen direkt von hier (grau, solange Taler oder Material fehlen – wird live grün)
    const costText = c => { const { money = 0, ...mat } = c || {}; return [money ? `🪙 ${fmt(money)}` : '', matText(mat)].filter(Boolean).join(' '); };
    const upBtn = (e, i) => e.kind ? `<button class="btn small" data-up="${i}" ${canPay(e.cost) ? '' : 'disabled'}>${e.kind === 'lm' ? 'Restaurieren' : 'Ausbauen'}${costText(e.cost) ? ' · ' + costText(e.cost) : ''}</button>` : '';
    const row = (e, i, icon, up) => `<div class="hall-row"><span>${icon} ${e.text}</span><span class="hall-btns">${up ? upBtn(e, i) : ''}<button class="btn ghost small" data-jump="${i}">Hin</button></span></div>`;
    body = `
      <div class="label">Bereit zum Ausbauen</div>
      ${ready.length ? ready.map((e, i) => row(e, i, '✨', true)).join('') : '<p class="muted">Gerade nichts – schau bei den Wünschen, was fehlt.</p>'}
      ${almost.length ? `<div class="label">Fast geschafft</div>${almost.map((e, i) => row(e, ready.length + i, '💭', false)).join('')}` : ''}`;
  } else if (tab === 'isles') {
    // Alle Inseln auf einen Blick: Stand, was dort steht, Bahnanschluss – und per Knopf hin
    const per = new Map([['home', { n: 0, pop: 0 }], ...ISLES.map(i => [i.id, { n: 0, pop: 0 }])]);
    for (const [k, t] of state.tiles) {
      if (t.b === 'weg' || t.b === 'schiene' || t.b === 'lm') continue;
      const e = per.get(regionAt(...keyXY(k)));
      if (!e) continue;
      e.n++;
      if (t.b === 'haus') e.pop += HOUSE_STAGES[Math.min(t.lvl, HOUSE_STAGES.length) - 1].pop;
    }
    const nx = nextIsle();
    const row = (id, icon, name, open, extra) => {
      const e = per.get(id), rail = T.rail.regions.has(id);
      const state_ = open ? `🏠 ${e.n} · 👥 ${e.pop}${rail ? ' · 🚆' : ''}${extra || ''}` : id === (nx && nx.id) ? 'als Nächstes' : '🔒';
      return `<div class="hall-row"><span>${icon} <b>${name}</b> <small class="muted">${state_}</small></span>
        <button class="btn ${id === (nx && nx.id) ? '' : 'ghost '}small" data-isle-go="${id}">${open ? 'Hin' : id === (nx && nx.id) ? 'Erschließen …' : 'Ansehen'}</button></div>`;
    };
    body = `
      <div class="label">Deine Inseln</div>
      ${row('home', '🏠', 'Heimatinsel', true, '')}
      ${ISLES.map(i => row(i.id, i.icon, i.name, isleOpen(i.id), ` · ${LANDMARKS[i.lm].icon} ${'🏮'.repeat(lmStage(i.lm))}`)).join('')}`;
  } else if (tab === 'wishes') {
    const miss = new Map();
    for (const [k, t] of state.tiles) {
      const s = T.st.get(k);
      if (t.b !== 'haus' || !s || !s.wish || !s.wish.next) continue;
      for (const w of s.wish.list) if (!w.ok) miss.set(w.text, (miss.get(w.text) || 0) + 1);
    }
    const list = [...miss].sort((a, b) => b[1] - a[1]);
    body = `
      <div class="label">Das wünschen sich die Bewohner noch</div>
      ${list.length ? list.map(([text, cnt]) => `<div class="hall-row"><span>${text}</span><b>${cnt} ${cnt > 1 ? 'Häuser' : 'Haus'}</b></div>`).join('')
        : '<p class="ok">Alle Wünsche erfüllt – alle Häuser können wachsen oder sind schon Villen!</p>'}`;
  } else {
    const hall = townHallAt(), t = hall && state.tiles.get(hall.join(','));
    body = `
      ${townEditor(state.town)}
      ${t ? `
        <div class="label">Rathaus: Wand</div>
        <div class="swatches">${colorsOf('wall').map(([c, i]) => `<button class="sw${i === t.wall ? ' on' : ''}" data-wall="${i}" style="background:${c}" aria-label="Wandfarbe ${i + 1}"></button>`).join('')}</div>
        <div class="label">Rathaus: Dach</div>
        <div class="swatches">${colorsOf('roof').map(([c, i]) => `<button class="sw${i === t.roof ? ' on' : ''}" data-roof="${i}" style="background:${c}" aria-label="Dachfarbe ${i + 1}"></button>`).join('')}</div>
        <div class="row"><button class="btn ghost" id="h-move">✋ Rathaus verschieben</button></div>` : ''}`;
  }
  openModal(`
    <h2>🏛️ Rathaus von ${escHtml(state.town.name)}</h2>
    <div class="looks hall-tabs">${tabs.map(([id, label]) => `<button class="look${id === tab ? ' on' : ''}" data-tab="${id}">${label}${id === 'ready' && ready.length ? ` ✨${ready.length}` : ''}</button>`).join('')}</div>
    ${body}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Fertig</button></div>`, () => openTownHall(tab));
  const card = $('modal-card');
  card.classList.add('hall');
  for (const b of card.querySelectorAll('[data-tab]')) b.onclick = () => { sfx('deco'); openTownHall(b.dataset.tab); };
  const all = ready.concat(almost);
  for (const b of card.querySelectorAll('[data-up]')) b.onclick = () => {
    const e = all[+b.dataset.up];
    if (e.kind === 'lm') { restoreLandmark(e.type); return; }            // öffnet das Laternen-Fenster
    if (e.kind === 'haus' ? houseUpgrade(e.x, e.y, true) : stageUpgrade(e.x, e.y, true)) openTownHall('ready');
  };
  for (const b of card.querySelectorAll('[data-quick-go]')) b.onclick = () => {
    const q = b.dataset.quickGo;
    if (q === 'diary') openDiary(); else openResearch(q);
  };
  for (const b of card.querySelectorAll('[data-lm-go]')) b.onclick = () => {
    const [x, y] = lmTile(b.dataset.lmGo);
    closeModal(); jumpTo(x, y, 3, 3); sparkle(x + 1, y + 1); openLandmark(x, y);
  };
  for (const b of card.querySelectorAll('[data-isle-go]')) b.onclick = () => goIsle(b.dataset.isleGo);
  for (const b of card.querySelectorAll('[data-jump]')) b.onclick = () => {
    const e = all[+b.dataset.jump], [w, h] = sizeOf(e.b, (state.tiles.get(e.x + ',' + e.y) || {}).rot);
    closeModal();
    jumpTo(e.x, e.y, w, h);
    sparkle(e.x + (w - 1) / 2, e.y + (h - 1) / 2);
    if (e.b === 'lm') openLandmark(e.x, e.y); else openInfo(e.x, e.y);
  };
  if (tab === 'town') {
    wireTownEditor(card, state.town, () => { updateHud(); save(); });
    const hall = townHallAt(), t = hall && state.tiles.get(hall.join(','));
    for (const sw of card.querySelectorAll('[data-wall]')) sw.onclick = () => { t.wall = +sw.dataset.wall; sfx('deco'); save(); openTownHall('town'); };
    for (const sw of card.querySelectorAll('[data-roof]')) sw.onclick = () => { t.roof = +sw.dataset.roof; sfx('deco'); save(); openTownHall('town'); };
    if ($('h-move')) $('h-move').onclick = () => { closeModal(); startMove(...hall); };
  }
  $('m-close').onclick = closeModal;
}
// Zu einer Insel springen: Heimatinsel zum Rathaus, sonst zur Sehenswürdigkeit; die nächste gesperrte zeigt „Erschließen“
function goIsle(id) {
  closeModal();
  if (id === 'home') { const h = townHallAt() || [Math.round(ISLAND.cx), Math.round(ISLAND.cy)]; jumpTo(h[0], h[1], 3, 3); return; }
  const i = ISLE_BY_ID[id], pos = lmTile(i.lm) || isleAnchor(i);
  jumpTo(pos[0], pos[1], 3, 3);
  if (!isleOpen(id)) openIsle(id);
}
$('town-btn').onclick = () => { setTool('look'); openTownHall(); };
$('rot-btn').onclick = () => rotateBuild();

// Dialoge
function openModal(html, live = null) { const c = $('modal-card'); c.className = 'card'; setHtml(c, html); $('modal').hidden = false; modalLive = live; }
function closeModal() { $('modal').hidden = true; modalLive = null; }
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
