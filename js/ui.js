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
const costText = c => { const { money = 0, ...mat } = c || {}; return [money ? `🪙 ${fmt(money)}` : '', matText(mat)].filter(Boolean).join(' '); };
// oben in der Leiste: glatte Zahlen (unter 1 aber nicht „0“)
function fmtWhole(n) { return n > 0 && n < 0.5 ? '<1' : fmt(Math.round(n)); }
// Geld oben: immer glatt, ab 10 Mio. in Millionen (ohne Komma)
const fmtMoney = n => n < 1e7 ? nf.format(Math.floor(n)) : `${nf.format(Math.floor(n / 1e6))} Mio.`;
function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }

let toastTimer = 0;
// Unerwartete Fehler: einmal sichtbar melden statt stumm (sonst bleibt der Bildschirm z. B. einfach blau)
let errorShown = false;
function reportError(e) {
  console.error(e);
  if (errorShown) return;
  errorShown = true;
  const bar = document.createElement('div');
  bar.id = 'err-bar';
  bar.textContent = `Hoppla, da ist etwas schiefgegangen: ${e && e.message || e}. Bitte Bescheid sagen – dein Spielstand ist sicher.`;
  bar.onclick = () => bar.remove();
  document.body.appendChild(bar);
}
window.addEventListener('error', e => reportError(e.error || e.message));
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
}

// Vorschaubild; ein Fehler in einer Zeichnung lässt nur dieses Bild leer – das Spiel startet trotzdem
function thumb(type, lvl = 1, tile = null) {
  const prev = g;
  try { return thumbRaw(type, lvl, tile); } catch (e) { g = prev; reportError(e); const c = document.createElement('canvas'); c.width = 112; c.height = 88; return c; }
}
function thumbRaw(type, lvl = 1, tile = null) {
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
  } else if (TERRAFORM[type]) {                           // Terraforming: ein Feld im neuen Gelände
    const tf = TERRAFORM[type];
    block(1, tf === 'sand' ? '#f1dfae' : tf === 'forest' ? '#7fc460' : tf === 'obst' ? '#86c35b' : tf === 'rock' ? '#aabb94' : '#96d56f');
    if (tf === 'forest' || tf === 'obst') { tree(cx - 9, cy + 2, z * 0.8, 0.3, tf === 'obst' ? '#ff6b5e' : null); tree(cx + 8, cy + 4, z * 0.9, 0.7, tf === 'obst' ? '#ffb13b' : null); }
    else if (tf === 'rock') drawRocks(cx, cy, z * 0.9, 5003, 5007, false);
    else if (tf === 'wiese') for (let i = 0; i < 6; i++) circle(cx - 14 + i * 6, cy + (i % 2 ? 3 : -2), 2.4, FLOWER_COLS[i % FLOWER_COLS.length]);
    else ellipse(cx + 6, cy + 2, 3, 2, '#ffd9e0');
  } else if (type === 'weg') {
    block(1, '#96d56f');
    drawPath(cx, cy, z, 1e6, 1e6, { style: currentStyle('weg') });
  } else if (type === 'schiene') {
    block(1, '#96d56f');
    drawObject('schiene', cx, cy, z, 0, 1e6, 1e6, 1, { rot: 0 });
  } else {
    const ground = { stein: '#aabb94', holz: '#7fc460', obst: '#86c35b', mine: '#b0a287', kristallmine: '#b3c2cc' }[type] || '#96d56f';
    block(1, ground);
    drawObject(type, cx, cy, z, 0, 3, 7, lvl, tile);
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
// Handy: Katalog (Filter + Kacheln) ist eingeklappt, bis man einen Bereich antippt
let sheetOpen = false;
function setSheet(open) {
  sheetOpen = !!open;
  $('toolbar').classList.toggle('open', sheetOpen);
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
    b.onclick = () => { audio(); setSheet(false); setTool(tool === id && id !== 'look' ? 'look' : id); };
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
    // Handy: der Bereich klappt den Katalog auf (nochmal antippen: zu)
    b.onclick = () => { if (PHONE) setSheet(!(sheetOpen && menuTop === m.id)); menuTop = m.id; keep(); buildToolbar(); };
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
    b.onclick = () => { audio(); setSheet(false); setTool(tool === id && id !== 'look' ? 'look' : id); };
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
  if (t !== tool) plan = null;                  // nur beim Wechsel: die Leiste baut sich auch so neu auf (Freischaltung)
  tool = t;
  rotManual = false;
  previewCache = null;
  if (t !== 'look') closePanel();
  for (const b of document.querySelectorAll('.tool')) b.classList.toggle('active', b.dataset.tool === t);
  for (const b of document.querySelectorAll('.quick')) b.classList.toggle('active', b.dataset.quick === t);
  $('rot-btn').hidden = !ROTATABLE.has(t);
  renderStyleBar(t);
  updateHint();
}
// Hinweis über der Leiste: auf dem Handy nur Name, Preis und wie man baut (sonst verdeckt er die halbe Karte)
function updateHint() {
  const hint = $('hint'), t = tool;
  if (t === 'look') { hint.hidden = true; return; }
  const d = ITEMS[t], extra = [];
  if (PHONE) {
    const how = LINE_TOOLS.has(t) ? 'Anfang und Ende antippen' : t === 'verschieben' ? 'antippen oder Rechteck aufziehen'
      : dragKind(t) === 'rect' ? 'antippen oder Fläche aufziehen' : 'Platz antippen, nochmal tippen baut';
    hint.textContent = `${d.name}${d.cost ? ' · 🪙 ' + fmt(d.cost) : ''}${d.mat ? ' ' + matText(d.mat) : ''} · ${how}`;
    hint.hidden = false;
    return;
  }
  if (d.mat) extra.push('Material: ' + matText(d.mat));
  if (d.workers) extra.push(`👷 ${d.workers}`);
  if (d.beauty && t !== 'weg') extra.push(`🌸 ${d.beauty}`);
  if (d.ugly) extra.push(`🌸 −${d.ugly} neben Häusern`);
  hint.textContent = `${d.name}: ${d.desc}` + (extra.length ? ' · ' + extra.join(' · ') : '')
    + (LINE_TOOLS.has(t) ? ' · Linie: Anfang und Ende anklicken' : '')
    + (t === 'verschieben' ? ' · Mehrere auf einmal: Rechteck aufziehen'
      : t === 'abriss' ? ' · Fläche: aufziehen, hineinklicken reißt ab'
      : dragKind(t) === 'rect' ? ' · Fläche: aufziehen, hineinklicken baut' : '')
    + (d.paint || dragKind(t) ? ' · Karte bewegen: rechte Maustaste (iPad: zwei Finger)' : '')
    + (ROTATABLE.has(t) && !d.small ? ' · Tür zeigt von selbst zum Weg (drehen: ⟳/Mausrad)' : ROTATABLE.has(t) ? ' · drehen: ⟳' : '');
  hint.hidden = false;
}

// Stil-Leiste für Wege: nur, was man schon hat – alles Weitere gibt es in der Kunstakademie
// Kreis mit dem echten Muster des Wegs (einmal gezeichnet, dann gemerkt); ohne Canvas nur die Farbe
const swatchCache = new Map();
function styleSwatch(st) {
  if (swatchCache.has(st.id)) return swatchCache.get(st.id);
  let bg = st.col;
  try {
    const lk = PATH_LOOK[st.id], c = document.createElement('canvas');
    c.width = c.height = 48;
    const prev = g; g = c.getContext('2d');
    if (lk && lk.stones) { poly([[0, 0], [48, 0], [48, 48], [0, 48]], '#8ccb67'); for (const [u, v] of [[14, 16], [34, 18], [22, 34], [38, 38]]) { ellipse(u, v + 1, 8, 5, '#aaa498'); ellipse(u, v, 8, 5, '#dcd7cc'); } }
    else if (lk) paintLook(([u, v]) => [24 + u * 48, 24 + v * 48], lk, 3, 3, 1.3, false, 0.1);
    g = prev;
    const url = c.toDataURL();
    if (url && url.startsWith('data:image')) bg = `${st.col} url(${url}) center / cover`;
  } catch (e) { /* ohne Canvas (Test) bleibt die Farbe */ }
  swatchCache.set(st.id, bg);
  return bg;
}
// Stil-Leiste: nur Kreise mit Muster; der gewählte wird größer und zeigt seinen Namen
function renderStyleBar(t) {
  const bar = $('style-bar');
  document.body.classList.toggle('has-styles', !!STYLES[t]);
  if (!STYLES[t]) { bar.hidden = true; return; }
  const cur = currentStyle(t), have = STYLES[t].filter(styleOk), more = STYLES[t].length - have.length;
  bar.innerHTML = have.map(st => `<button class="style-chip${st.id === cur ? ' on' : ''}" data-style="${st.id}" title="${st.name}" aria-label="${st.name}">
      <i style="background:${styleSwatch(st)}"></i><span>${st.name}</span></button>`).join('')
    + (more ? `<button class="style-chip more" data-more="1" title="${more} weitere Wege in der Kunstakademie" aria-label="${more} weitere Wege freischalten">🎨<span>+${more}</span></button>` : '');
  for (const b of bar.querySelectorAll('[data-style]')) b.onclick = () => { chosenStyle[t] = b.dataset.style; sfx('deco'); renderStyleBar(t); };
  if (bar.querySelector('[data-more]')) bar.querySelector('[data-more]').onclick = () => openResearch('design');
  bar.hidden = false;
}

const canResearch = () => TECHS.some(t => techReady(t) && state.science >= techCost(t));

let goalSmall = null, unlockSig = '';        // null: von selbst – auf dem Handy klein, sonst groß
// Leiste oben: nur Rathaus, Geld, Einwohner, Ideen, Lager und Menü. Raten und Arbeitsplätze erst beim Antippen
// (hudMore, ein paar Sekunden), Rohstoffe, Schönheit und Strom im Lager (📦).
let hudMoreUntil = 0;
const hudMore = () => { hudMoreUntil = Date.now() + 5000; updateHud(); };
function updateHud() {
  $('money').textContent = fmtMoney(state.money);
  const bi = boostMul('inc'), bs = boostMul('sci');                        // Jahrmarkt, Erlass: gerade mehr
  $('rate').textContent = '+' + fmtWhole(T.inc * bi + saleRate) + '/s' + (bi > 1 ? ` ×${bi}` : '');
  $('pop').textContent = fmt(T.pop);
  $('jobs').textContent = `💼 ${fmt(T.jobs)}`;                  // Arbeitsplätze
  $('pop-btn').classList.toggle('warn', T.jobs > T.pop);
  $('sci').textContent = fmtMoney(state.science);              // glatt wie das Geld (vorher „1,2 Mio.“)
  $('sci-rate').textContent = T.sci > 0 ? '+' + fmtWhole(T.sci * bs) + '/s' + (bs > 1 ? ` ×${bs}` : '') : '';
  $('sci-dot').hidden = !canResearch();
  $('hud').classList.toggle('more', Date.now() < hudMoreUntil);
  if (!$('store').hidden) setHtml($('store'), storeHtml(), true);
  $('town-name').textContent = state.town.name;
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
  goal.classList.toggle('small', goalSmall ?? PHONE);
  setHtml(goal, goalHtml(), true);
  // Leiste unten: was inzwischen freigeschaltet ist, wird sofort bunt
  const sig = Object.keys(ITEMS).map(id => +available(id)).join('') + Object.values(STYLES).flat().map(st => +styleOk(st)).join('');
  if (sig !== unlockSig) { if (unlockSig) buildToolbar(); unlockSig = sig; }
  watchUnlocks();
  watchTips();
  refreshLive();
}
$('goal').onclick = e => {
  if (e.target.dataset.skip) { state.tutorial = -1; save(); toast('Einführung übersprungen – viel Spaß!'); updateHud(); return; }
  const req = e.target.closest('[data-lm]'), pos = req && lmTile(req.dataset.lm);
  if (pos) { jumpTo(pos[0], pos[1], 3, 3); sparkle(pos[0] + 1, pos[1] + 1); return; }
  if (e.target.closest('[data-decree]')) {                       // Erlass wartet: zum Schloss
    const sl = [...state.tiles].find(([, t]) => t.b === 'schloss');
    if (sl) { const [x, y] = keyXY(sl[0]); jumpTo(x, y, 7, 7); openInfo(x, y); }
    return;
  }
  const isl = e.target.closest('[data-isle]');
  if (isl) { const i = ISLE_BY_ID[isl.dataset.isle], [x, y] = isleAnchor(i); jumpTo(x, y, 3, 3); openIsle(i.id); return; }
  goalSmall = !(goalSmall ?? PHONE); updateHud();
};
$('money-btn').onclick = hudMore;
$('pop-btn').onclick = hudMore;
// Lager (📦): Rohstoffe mit Menge pro Minute, Schönheit und Strom – klappt unter der Leiste auf
function storeHtml() {
  const shown = Object.keys(RES).filter(r => state.res[r] >= 1 || T.prod[r] || T.conv.some(c => c.to === r || c.from === r));
  const made = r => (T.prod[r] || 0) + T.conv.filter(c => c.to === r).reduce((s, c) => s + c.rate, 0) - T.conv.filter(c => c.from === r).reduce((s, c) => s + c.rate * CONV_RATIO, 0)
    - (saleable(r) > 0 ? (T.sales || []).filter(sl => sl.res === r).reduce((s, sl) => s + sl.rate, 0) : 0);          // Läden verkaufen
  const sold = new Set((T.sales || []).map(sl => sl.res));
  const keepBtn = r => { const k = keepOf(r); return sold.has(r) ? `<button class="keep" data-keep="${r}" title="Läden verkaufen nur, was darüber liegt – antippen zum Ändern">🔒 ${k >= KEEP_ALL ? 'alles' : fmt(k)}</button>` : '<span></span>'; };
  const rows = shown.map(r => { const m = made(r) * 60; return `<div class="store-row"><span>${RES[r].icon} ${RES[r].name}</span><b>${fmt(state.res[r])}</b><small${m < 0 ? ' class="minus"' : ''}>${Math.abs(m) >= 0.5 ? (m > 0 ? '+' : '−') + fmtWhole(Math.abs(m)) + '/min' : ''}</small>${keepBtn(r)}</div>`; });
  const P = T.rail.power, power = P.city || P.supply
    ? `<div class="store-row${P.demand > P.supply + 1e-9 ? ' bad' : ''}"><span>⚡ Strom</span><b>${fmtPow(P.supply)}</b><small${P.demand > P.supply + 1e-9 ? ' class="minus"' : ''}>${P.demand} gebraucht</small></div>` : '';
  // Verkehr: alle fahrenden Linien zusammen
  const run = T.rail.lines.filter(l => l.traffic), want = run.reduce((s, l) => s + l.traffic.demand, 0), got = run.reduce((s, l) => s + l.traffic.carried, 0);
  const full = want > got + 0.5, money = (T.traffic.fare + T.traffic.spend);
  const traffic = run.length ? `<div class="store-row${full ? ' bad' : ''}"><span>🚆 Fahrgäste</span><b>${fmt(got)}/min</b><small${full ? ' class="minus"' : ''}>${full ? `${fmt(want)} wollen mit` : money >= 0.05 ? '+' + fmtRate(money) + '/s' : ''}</small></div>` : '';
  return `<div class="store-title">📦 Lager</div>${rows.join('') || '<p class="muted">Noch leer – Holzfäller, Steinbruch & Co. füllen es.</p>'}
    ${sold.size ? '<p class="muted store-note">🔒 Vorrat: Läden verkaufen nur, was darüber liegt.</p>' : ''}
    <div class="store-row sep"><span>🌸 Schönheit</span><b>${fmt(T.beauty)}</b><small></small></div>${power}${traffic}`;
}
function toggleStore(open = $('store').hidden) {
  const el = $('store');
  el.hidden = !open;
  if (open) { const b = $('store-btn').getBoundingClientRect(); el.style.top = (b.bottom + 8) + 'px'; el.style.right = Math.max(10, window.innerWidth - b.right) + 'px'; setHtml(el, storeHtml()); }
}
$('store-btn').onclick = e => { e.stopPropagation(); toggleStore(); };
// Vorrat je Ware umschalten (das Lager wird laufend neu gezeichnet – daher am Rahmen lauschen)
$('store').addEventListener('click', e => { const b = e.target.closest('[data-keep]'); if (!b) return; cycleKeep(b.dataset.keep); sfx('deco'); setHtml($('store'), storeHtml(), true); });
document.addEventListener('pointerdown', e => { if (!$('store').hidden && !e.target.closest('#store, #store-btn')) toggleStore(false); });
// Ausgegebenes Material blitzt kurz am 📦 auf
let flashTimer = 0;
function flashStore(mat) {
  const txt = Object.entries(mat || {}).filter(([, n]) => n >= 1).map(([r, n]) => `−${RES[r].icon}${fmt(n)}`).join(' ');
  if (!txt) return;
  const el = $('store-flash');
  el.textContent = txt; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(flashTimer); flashTimer = setTimeout(() => { el.hidden = true; }, 1600);
}

// „Neu freigeschaltet“: Was jetzt verfügbar ist und vorher nicht, kommt in ein Fenster in der Mitte – egal ob durch
// Laterne, Forschung, Insel oder Kunstakademie. Beim Laden/Neustart wird nur gemerkt (resetUnlockWatch).
let unlockSeen = null;
const pendingUnlocks = [];
function resetUnlockWatch() { unlockSeen = null; pendingUnlocks.length = 0; }
function unlockKeys() {
  const out = new Set();
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].cat && id !== 'verschieben' && id !== 'abriss' && available(id)) out.add(id);
  for (const st of STYLES.weg) if ((st.lm || st.album) && styleOk(st)) out.add('weg:' + st.id);
  for (const hs of HOUSE_STAGES) if (hs.lm && unlockOk(hs, 'haus:' + hs.name)) out.add('stufe:' + hs.name);
  return out;
}
function watchUnlocks() {
  const now = unlockKeys();
  if (unlockSeen) for (const k of now) if (!unlockSeen.has(k) && !pendingUnlocks.includes(k)) pendingUnlocks.push(k);
  unlockSeen = now;
  if (pendingUnlocks.length && $('modal').hidden) openUnlocks();
}
function unlockCard(k) {
  if (k.startsWith('weg:')) {
    const st = styleDef('weg', k.slice(4));
    return `<div class="unlock-card"><div class="uc-pic"><i class="uc-sw" style="background:${styleSwatch(st)}"></i></div>
      <div class="uc-txt"><b>Neuer Wegstil: ${st.name}</b><p class="tip">💡 Ein Geschenk – beim Weg in der Stil-Leiste auswählen.</p>
      <button class="btn small" data-try="${k}">Ausprobieren</button></div></div>`;
  }
  if (k.startsWith('stufe:')) {
    return `<div class="unlock-card"><div class="uc-pic"><span class="emoji">🏡</span></div>
      <div class="uc-txt"><b>Neue Hausstufe: ${k.slice(6)}</b><p>Villen können jetzt weiterwachsen – mit Kristall 💎 und Blick aufs Wasser.</p>
      <p class="tip">💡 Tipp eine Villa an, dort stehen ihre neuen Wünsche.</p></div></div>`;
  }
  const d = ITEMS[k];
  return `<div class="unlock-card"><div class="uc-pic" data-thumb="${k}"></div>
    <div class="uc-txt"><b>${d.name}</b> <span class="fx">${effectText(k)}</span><p class="tip">💡 ${ITEM_TIPS[k] || d.desc}</p>
    <button class="btn small" data-try="${k}">Ausprobieren</button></div></div>`;
}
function openUnlocks() {
  const list = pendingUnlocks.splice(0, 4);
  sfx('star');
  openModal(`
    <h2>✨ Neu freigeschaltet</h2>
    ${list.map(unlockCard).join('')}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">${pendingUnlocks.length ? 'Weiter' : 'Später'}</button></div>`);
  $('modal-card').classList.add('unlock');
  for (const el of document.querySelectorAll('#modal-card [data-thumb]')) el.append(thumb(el.dataset.thumb));
  for (const b of document.querySelectorAll('#modal-card [data-try]')) b.onclick = () => tryUnlock(b.dataset.try);
  $('m-close').onclick = closeModal;
}
// Erfolg erreicht: kurzes Band oben (kein Fenster zum Wegtippen); antippen öffnet die Erfolge im Rathaus
const achvQueue = [];
let achvTimer = 0;
const fmtBig = v => v >= 1e6 ? `${nf1.format(v / 1e6)} Mio.` : fmt(v);
const tierText = (a, v) => a.unit === 'km' ? `${nf1.format(v)} km` : fmtBig(v) + (a.unit ? ' ' + a.unit : '');
const achvEl = () => $('achv');
$('achv').onclick = () => { hideAchv(); setTool('look'); openTownHall('erfolge'); };
function showNextAchv() {
  const el = achvEl();
  if (!el.hidden || !achvQueue.length) return;
  const e = achvQueue.shift();
  el.innerHTML = e.rank
    ? `🎖️ <b>${e.rank.name}</b>${e.rank.item ? ` – ${ITEMS[e.rank.item].name} freigeschaltet!` : '!'}`
    : `🏆 Erfolg: <b>${e.a.icon} ${e.a.name} – ${tierText(e.a, e.a.tiers[e.tier - 1])}</b> ⭐`;
  el.hidden = false;
  sfx('star');
  clearTimeout(achvTimer);
  achvTimer = setTimeout(() => { el.hidden = true; showNextAchv(); }, 3800);
}
function hideAchv() { const el = achvEl(); el.hidden = true; clearTimeout(achvTimer); achvQueue.length = 0; }

// Tipps beim ersten Mal: einer nach dem anderen, mit Abstand, nicht in der Einführung und nie über einem anderen Fenster
let lastTipAt = -1e9;
const TIP_GAP = 25000;
function watchTips() {
  if (state.tutorial >= 0 || state.tipsOff || !$('modal').hidden || pendingUnlocks.length) return;
  const now = performance.now();
  if (now - lastTipAt < TIP_GAP) return;
  const tip = GUIDE.find(g => !state.tipsSeen.has(g.id) && g.when());
  if (!tip) return;
  lastTipAt = now;
  state.tipsSeen.add(tip.id);
  save();
  openModal(`
    <h2>💡 Tipp: ${tip.icon} ${tip.title}</h2>
    <p>${tip.text}</p>
    <div class="row"><button class="btn" id="m-ok" style="flex:1">Verstanden</button></div>
    <p class="muted tip-links"><span class="link" id="m-tipbook">Alle Tipps im Tipp-Buch</span> · <span class="link" id="m-notips">Keine Tipps mehr</span></p>`);
  $('modal-card').classList.add('tipcard');
  $('m-ok').onclick = closeModal;
  $('m-tipbook').onclick = openTipBook;
  $('m-notips').onclick = () => { state.tipsOff = true; save(); closeModal(); toast('Keine Tipps mehr – im Tipp-Buch wieder einschaltbar'); };
}
// Sammelalbum: Seiten mit Fortschritt; Fehlendes grau, damit man sieht, was noch fehlt
function openAlbum() {
  collectAlbum();
  const all = ALBUM.flatMap(albumKeys), got = all.filter(k => state.album.has(k)).length;
  const entry = k => {
    const [kind, id] = k.split(':');
    let pic, name;
    if (kind === 'b') { name = ITEMS[id].name; pic = `<span data-thumb="${id}"></span>`; }
    else if (kind === 'hs') { name = HOUSE_STAGES[+id - 1].name; pic = `<span data-hthumb="${id}"></span>`; }
    else if (kind === 'wall' || kind === 'roof') { name = kind === 'wall' ? 'Wand' : 'Dach'; pic = `<i class="al-sw" style="background:${(kind === 'wall' ? WALLS : ROOFS)[+id]}"></i>`; }
    else if (kind === 'weg') { const st = styleDef('weg', id); name = st.name; pic = `<i class="al-sw" style="background:${st.col}"></i>`; }
    else { const a = ANIMALS.find(q => q.id === id); name = a.family; pic = `<span class="emoji">${a.icon}</span>`; }
    return `<div class="al-e${state.album.has(k) ? '' : ' miss'}" title="${name}">${pic}<small>${name}</small></div>`;
  };
  openModal(`
    <h2>📒 Sammelalbum · ${Math.floor(got / all.length * 100)} %</h2>
    ${ALBUM.map(p => {
      const ks = albumKeys(p), n = ks.filter(k => state.album.has(k)).length, done = n === ks.length;
      return `<div class="album-page${done ? ' done' : ''}"><div class="label">${p.icon} ${p.name} · ${n}/${ks.length}</div>
        <div class="al-grid">${ks.map(entry).join('')}</div>
        <p class="al-reward">${done ? '✓' : '🎁'} Belohnung: <b>${rewardName(p.reward)}</b>${done ? ' – freigeschaltet!' : ''}</p></div>`;
    }).join('')}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('modal-card').classList.add('album');
  for (const el of document.querySelectorAll('#modal-card [data-thumb]')) el.append(thumb(el.dataset.thumb));
  for (const el of document.querySelectorAll('#modal-card [data-hthumb]')) el.append(thumb('haus', +el.dataset.hthumb, { lvl: +el.dataset.hthumb, wall: 1, roof: 0 }));
  $('m-close').onclick = closeModal;
}
function openTipBook() {
  openModal(`
    <h2>💡 Tipp-Buch</h2>
    ${GUIDE.map(g => `<details><summary>${g.icon} ${g.title}</summary><p>${g.text}</p></details>`).join('')}
    <div class="row"><button class="btn ghost" id="m-tipsonoff" style="flex:1">Tipps beim ersten Mal: ${state.tipsOff ? 'aus' : 'an'}</button></div>
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('modal-card').classList.add('tipbook');
  $('m-tipsonoff').onclick = () => { state.tipsOff = !state.tipsOff; save(); openTipBook(); };
  $('m-close').onclick = closeModal;
}
// „Ausprobieren“: in die passende Gruppe der Leiste springen und das Ding zum Bauen auswählen
function tryUnlock(k) {
  closeModal();
  let id = k;
  if (k.startsWith('weg:')) { chosenStyle.weg = k.slice(4); id = 'weg'; }
  const p = menuPlaceOf(id);
  menuTop = p.top; menuSub = p.sub;
  buildToolbar();
  setTool(id);
}

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
function closePanel() { $('panel').hidden = true; $('panel').classList.remove('tall'); panelLive = null; }
// Handy: das Fenster ist die untere Hälfte (quer: rechte Seite); oben ein Griff – antippen oder hochwischen = ganz groß
const GRIP = '<button class="grip" aria-label="Fenster größer oder kleiner"></button>';
function showPanel(html, live = null) {
  const el = $('panel'), fresh = el.hidden;
  if (!liveNow) { el.classList.remove('float'); el.style.left = ''; }
  setHtml(el, (PHONE ? GRIP : '') + html); el.hidden = false;
  panelLive = live;
  if (PHONE && !liveNow) { if (fresh) el.classList.remove('tall'); requestAnimationFrame(revealTap); }
  return el;
}
// Das angetippte Gebäude soll neben dem Fenster sichtbar bleiben: Karte sanft verschieben
let lastTap = null;
function revealTap() {
  const el = $('panel');
  if (!lastTap || el.hidden || performance.now() - lastTap.t > 800) return;
  const r = el.getBoundingClientRect(), top = $('hud').getBoundingClientRect().bottom, land = document.body.classList.contains('phone-land');
  let dx = 0, dy = 0;
  if (land) { if (lastTap.sx > r.left - 40) dx = lastTap.sx - r.left * 0.5; }
  else if (lastTap.sy > r.top - 40 || lastTap.sy < top + 40) dy = lastTap.sy - (top + (r.top - top) * 0.62);
  lastTap = null;
  if (!dx && !dy) return;
  const x0 = cam.x, y0 = cam.y, t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / 240), e = 1 - Math.pow(1 - k, 3);
    cam.x = x0 + dx / cam.z * e; cam.y = y0 + dy / cam.z * e; clampCam();
    if (k < 1) requestAnimationFrame(step);
  };
  step();
}
// Griff: antippen schaltet groß/klein, wischen: hoch = groß, runter = kleiner bzw. zu
let gripY = null, gripSwiped = false;
$('panel').addEventListener('pointerdown', e => { if (e.target.closest('.grip')) gripY = e.clientY; });
$('panel').addEventListener('pointerup', e => {
  if (gripY == null) return;
  const dy = e.clientY - gripY, el = $('panel');
  gripY = null;
  if (Math.abs(dy) < 25) return;
  gripSwiped = true;
  if (dy < 0) el.classList.add('tall');
  else if (el.classList.contains('tall')) el.classList.remove('tall');
  else closePanel();
});
$('panel').addEventListener('click', e => {
  if (!e.target.closest('.grip')) return;
  if (gripSwiped) { gripSwiped = false; return; }
  $('panel').classList.toggle('tall');
});
// Fenster neben eine Stelle auf dem Bildschirm setzen (nicht auf schmalen Bildschirmen)
function panelAt(sx, sy) {
  const el = $('panel');
  if (sx == null || window.innerWidth <= 600 || PHONE) return;
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

// Wie eine Bedingung erfüllt ist, wenn nicht einfach „in der Nähe“ (Block 26)
const REACH_HOW = { viertel: '🏘️ im selben Viertel', bahn: '🚆 per Bahn', seil: '🚡 per Seilbahn', faehre: '⛴️ per Schiff', garten: '🌿 Botanischer Garten' };
const reachHow = c => c.ok && REACH_HOW[c.how] ? ` <small class="how">· ${REACH_HOW[c.how]}</small>` : '';
function openInfo(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t) { closePanel(); return; }
  if (t.b === 'rathaus') { openTownHall(); return; }
  if (t.b === 'lm') { openLandmark(x, y); return; }
  if (t.b === 'truhe') { openChestInfo(x, y, t); return; }
  const d = ITEMS[t.b], s = statusOf(x, y) || {};
  const status = [];
  if (needsReach(t.b)) {
    status.push({
      viertel: '<div class="ok">✓ Liegt im Wohnviertel</div>',
      nah: `<div class="ok">✓ Häuser in Laufweite (bis ${WALK_REACH} Felder)</div>`,
      weit: '<div class="bad">🐌 Weit weg vom Dorf: 50 %. Ein Weg zum Dorf oder ein Bahnhof in der Nähe bringt 100 %.</div>',
      bahn: s.served >= 1 ? '<div class="ok">🚆 Mit dem Zug ans Dorf angebunden</div>'
        : `<div class="bad">🚆 Mit dem Zug angebunden, aber die Linie ist überfüllt: ${Math.round(s.eff * 100)} %</div>`,
    }[s.how]);
  }
  if (s.bonus) status.push(`<div class="ok">🏘️ Viertel mit ${s.n} Gebäuden: +${Math.round(s.bonus * 100)} %</div>`);
  else if (s.n > 1) status.push(`<div>🏘️ Viertel mit ${s.n} Gebäuden (ab 3 gibt es +10 %)</div>`);
  else if (s.n) status.push('<div>🏘️ Steht noch allein – ab 3 Gebäuden im Viertel gibt es +10 %</div>');
  if (s.lmb > 1.001) status.push(`<div class="ok">✨ Sehenswürdigkeit in der Nähe: +${Math.round((s.lmb - 1) * 100)} %</div>`);
  if (d.shop) status.push(...shopStatus(t, s));
  if (STOPS.has(t.b)) status.push(`<div>${placeLabel(x, y)} – Fahrgäste zählen je Ortsteil</div>`);
  if (t.b === 'station') status.push(...stationStatus(x + ',' + y));
  if (t.b === 'seilbahn') status.push(...cableStatus(x + ',' + y));
  if (POWER_OUT[t.b]) status.push(`<div class="ok">⚡ Liefert ${fmtPow(powerOf(t))} Strom${t.b === 'windrad' && hasTech('rotor') ? ' (Rotorblätter +50 %)' : ''}${hasTech('stromnetz') ? ' · Stromnetz +25 %' : ''}</div>`, ...powerStatus());
  else if (CONSUMERS[t.b] && T.rail.power.city && !s.noPower && (!WONDERS[t.b] || wonderDone(t))) status.push(`<div class="ok">⚡ Hat Strom (braucht ${CONSUMERS[t.b]} ⚡)</div>`);
  if (s.noPower) status.push(`<div class="bad">⚡ Kein Strom: nur ${Math.round(NO_POWER * 100)} %. ${ITEMS[t.b].name} braucht ${CONSUMERS[t.b]} ⚡ – mehr Kraftwerke bauen (⚡ Strom unter Bauen).</div>`);
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
        <div class="status">${info.conds.map(c => `<div class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} ${c.text}${reachHow(c)}</div>`).join('')}</div>
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
        <div class="status">${w.list.map(v => `<div class="${v.ok ? 'ok' : 'bad'}">${v.ok ? '✓' : '✗'} ${v.text}${reachHow(v)}</div>`).join('')}</div>`
        : w.later ? `<p class="muted">✨ Mit Kristall 💎 von der Kristallinsel kann daraus eine ${w.later.name} werden.</p>`
        : '<p class="ok">Alle Wünsche erfüllt – das schönste Haus der Insel!</p>'}`;
    const hc = w.next && houseCost(w.next), hcText = hc ? [hc.money ? `🪙 ${fmt(hc.money)}` : '', matText(w.next.mat)].filter(Boolean).join(' ') : '';
    house += w.next ? `<div class="row"><button class="btn" id="p-grow" ${w.ready && canPay(hc) ? '' : 'disabled'}>
      ${w.ready ? `Ausbauen · ${hcText}` : `Noch ${w.total - w.met} ${w.total - w.met > 1 ? 'Wünsche' : 'Wunsch'}`}</button></div>` : '';
  }
  // Wunderwerk: Fortschritt, Kosten des nächsten Abschnitts, Knopf
  let wonder = '';
  if (WONDERS[t.b]) {
    const W = WONDERS[t.b], p = t.phase || 0, N = W.phases.length;
    if (p < N) {
      const { money = 0, ...mat } = wonderCost(t);
      const costs = [money ? `🪙 ${fmt(Math.min(state.money, money))}/${fmt(money)}` : '',
        ...Object.entries(mat).map(([r, n]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], n))}/${fmt(n)}`)].filter(Boolean);
      wonder = `<div class="label">Abschnitt ${p + 1} von ${N}: ${W.names[p]}</div>
        <div class="wbar"><i style="width:${p / N * 100}%"></i></div>
        <div class="stats">${costs.map(c => `<span>${c}</span>`).join('')}</div>
        <p class="muted">Wenn fertig: ${W.text}. Preise nach deinem Einkommen beim Aufstellen (🪙 ${fmt(t.rate || 0)}/s).</p>
        <div class="row"><button class="btn" id="p-wonder" ${canPay(wonderCost(t)) ? '' : 'disabled'}>🏗️ Abschnitt bauen</button></div>`;
    } else {
      wonder = '<p class="ok">✓ Fertig – wirkt jetzt.</p>';
      if (t.b === 'riesenrad') wonder += `<div class="status"><div class="${fairLeft() ? 'ok' : ''}">🎡 ${fairLeft() ? `Jahrmarkt! Einnahmen ×${FAIR_MUL} · noch ${fmtClock(fairLeft())}` : `Nächster Jahrmarkt in ${fmtClock(fairNext())}`}</div></div>`;
      if (t.b === 'schloss') wonder += decreeHtml();
    }
  }
  const line = t.b === 'station' ? lineOf(x + ',' + y) : null, hub = t.b === 'hbf' ? hbfHtml(x, y, t) : '';
  const boat = t.b === 'bootssteg' ? expeditionHtml() : t.b === 'hafen' ? shipsHtml(x + ',' + y, t) + ordersHtml(t) : '';
  const footBtn = ([id, fs]) => {
    const { money, ...mat } = fs.cost, mine = footPaidOf(t) === id;
    return `<button class="look${t.foot && mine ? ' on' : ''}" data-foot="${id}">${fs.icon} ${fs.name}${mine ? '' : ` · 🪙 ${money} ${matText(mat)}`}</button>`;
  };
  const train = line ? trainChooser(line) : isCrossing(t) ? `<div class="label">Bahnübergang</div>
    <div class="looks"><button class="look${t.foot ? '' : ' on'}" data-cross="0">🚧 Schranken</button></div>
    <div class="label">🌉 Fußgängerbrücke</div>
    <div class="looks">${Object.entries(FOOT_STYLES).map(footBtn).join('')}</div>
    ${footPaidOf(t) ? '<p class="muted">Anderes Design: die alte Brücke gibt es voll zurück.</p>' : ''}` : '';
  const title = t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : isCrossing(t) ? 'Bahnübergang'
    : WONDERS[t.b] && !wonderDone(t) ? `${ITEMS[t.b].name} (Baustelle)` : stageName(t);
  const el = showPanel(`
    <h3>${title} ${S ? `<span class="lvl">Stufe ${t.lvl}</span>` : ''}</h3>
    ${house}
    ${outs.length ? `<p class="big">${outs.join(' · ')}</p>` : ''}
    ${status.length ? `<div class="status">${status.join('')}</div>` : ''}
    ${why.length ? `<div class="stats">${why.map(w => `<span>${w}</span>`).join('')}</div>` : ''}
    <p class="muted">${d.desc}</p>
    ${grow}
    ${wonder}
    ${boat}
    ${hub}
    ${train}
    ${colors}
    <div class="row">
      ${ROTATABLE.has(t.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, () => state.tiles.get(x + ',' + y) === t ? openInfo(x, y) : closePanel());
  $('p-move').onclick = () => startMove(x, y);
  if ($('p-stage')) $('p-stage').onclick = () => stageUpgrade(x, y);
  if ($('p-expo')) $('p-expo').onclick = () => { if (sendExpedition(x + ',' + y)) openInfo(x, y); };
  // Schiffe: Modell und Ziel wählen, kaufen, verkaufen
  for (const b of el.querySelectorAll('[data-shipmodel]')) b.onclick = () => { shipPick.model = b.dataset.shipmodel; openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-shipto]')) b.onclick = () => { shipPick.to = b.dataset.shipto; openInfo(x, y); };
  if (el.querySelector('[data-shipbuy]')) el.querySelector('[data-shipbuy]').onclick = () => { if (buyShip(x + ',' + y, shipPick.model, shipPick.to)) openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-shipsell]')) b.onclick = () => { if (sellShip(x + ',' + y, +b.dataset.shipsell)) openInfo(x, y); };

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
    const err = isBig(t.b) ? placeError(t.b, x, y, nr, { move: true, t }) : null;
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
  // Hauptbahnhof: Gleis öffnen, Gleise dazu/weg, Aussehen
  for (const b of el.querySelectorAll('[data-gleis]')) b.onclick = () => openGleis(b.dataset.gleis);
  for (const [id, d] of [['p-gplus', 1], ['p-gminus', -1]]) if ($(id)) $(id).onclick = () => { const nk = hbfResize(x + ',' + y, d); if (nk) openInfo(...keyXY(nk)); };
  for (const b of el.querySelectorAll('[data-hlook]')) b.onclick = () => { t.look = b.dataset.hlook; t.born = performance.now(); sfx('deco'); groundVersion++; save(); openInfo(x, y); };
  if ($('p-wonder')) $('p-wonder').onclick = () => wonderStep(x, y);
  for (const b of document.querySelectorAll('#panel [data-decree-pick]')) b.onclick = () => { chooseDecree(b.dataset.decreePick); openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-cross]')) b.onclick = () => { if (setCrossing(x, y, b.dataset.cross === '1')) openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-foot]')) b.onclick = () => { if (setCrossing(x, y, true, b.dataset.foot)) openInfo(x, y); };
  if (!liveNow) updateHud();
}

// Strom-Bilanz: wer wie viel braucht (Windrad, Rathaus, Lager)
const fmtPow = v => Number.isInteger(v) ? String(v) : nf1.format(v);
function powerStatus() {
  const P = T.rail.power, parts = [];
  if (P.use.lamps) parts.push(`Laternen ${P.use.lamps}`);
  if (P.use.work) parts.push(`Werkstätten ${P.use.work}`);
  if (P.use.build) parts.push(`andere Gebäude ${P.use.build}`);
  if (P.use.trains) parts.push(`Züge ${P.use.trains}`);
  const out = [`<div class="${P.demand > P.supply + 1e-9 ? 'bad' : 'ok'}">⚡ Strom: ${fmtPow(P.supply)} erzeugt, ${P.demand} gebraucht${parts.length ? ` (${parts.join(', ')})` : ''}</div>`];
  if (P.dark.size) out.push(`<div class="bad">🌙 ${P.dark.size} ${P.dark.size === 1 ? 'Laterne bleibt' : 'Laternen bleiben'} nachts dunkel</div>`);
  if (P.idle.size) out.push(`<div class="bad">🏭 ${P.idle.size} ${P.idle.size === 1 ? 'Gebäude läuft' : 'Gebäude laufen'} ohne Strom nur halb</div>`);
  out.push(`<div class="muted">Je 10 Laternen 1 ⚡ · Werkstatt, Hafen, Universität 2 ⚡ · Sägewerk, Glashaus 1 ⚡ · Wunderwerke je 100 ⚡, Schloss 300 ⚡ · Zug 1 ⚡ + 1 ⚡ je km</div>`);
  return out;
}
// Bahnhof: wohin fährt der Zug, hat er Strom?
const kmText = l => `${nf1.format(l.km)} km`;
function stationStatus(k) {
  const line = lineOf(k), names = l => l.regions.map(regionName);
  if (T.rail.stationNet.get(k) == null) return [`<div class="bad">✗ ${GLEIS.has(k) ? 'Noch keine Schiene vor dem Gleis' : 'Keine Schiene direkt am Bahnhof'}</div>`];
  if (!line) return ['<div class="bad">✗ Noch kein Ziel: Schienen bis zu einem Bahnhof auf einer anderen Insel legen</div>'];
  const out = [`<div class="ok">🚆 Linie ${names(line).join(' ↔ ')} · ${line.loop ? '🔁 Rundkurs' : 'hin und zurück'}, ${kmText(line)}</div>`];
  const tr = line.traffic;
  if (tr) out.push(...trafficStatus(line, tr));
  if (line.running < line.count || !line.powered) out.push(`<div class="bad">⚡ Zu wenig Strom: Ein Zug hier braucht ${fmtPow(line.needs[line.running] || line.need)} ⚡ – ${fmtPow(T.rail.power.supply)} ⚡ erzeugt, ${fmtPow(T.rail.power.demand)} ⚡ gebraucht</div>`);
  if (!line.loop) out.push('<div class="muted">🔁 Als geschlossener Kreis fährt der Zug im Kreis – und ab 4 km passen mehrere Züge drauf.</div>');
  return out;
}
// Hafen: Schiffe (Liegeplätze je Stufe), je Ziel was sie befördern, ein neues kaufen (Modell + Ziel)
const shipPick = { model: null, to: null };
const landingName = k => { const t = state.tiles.get(k); return `${regionIcon(regionAt(...keyXY(k)))} ${regionName(regionAt(...keyXY(k)))} · ${t && t.b === 'hafen' ? 'Hafen' : 'Steg'}`; };
function shipsHtml(k, t) {
  const ships = t.ships || [], berths = berthsOf(t), targets = shipTargets(k);
  let html = `<div class="label">⛴️ Schiffe · ${ships.length} von ${berths} Liegeplätzen${(t.lvl || 1) < 3 ? ` (Stufe ${(t.lvl || 1) + 1}: ${BERTHS[t.lvl || 1]})` : ''}</div>`;
  if (ships.length) html += `<div class="ships">${ships.map((s, i) => { const m = shipModel(s);
    return `<div class="hall-row"><span>${m.icon} <b>${m.name}</b><br><small class="muted">→ ${state.tiles.get(s.to) ? landingName(s.to) : 'Ziel fehlt'} · ${shipSeats(s)}/min</small></span>
      <button class="btn ghost small" data-shipsell="${i}" title="Verkaufen: ${costText(m.buy)} zurück">Verkaufen · +🪙 ${fmt(m.buy.money)}</button></div>`; }).join('')}</div>`;
  for (const f of ferriesAt(k)) html += f.noSea
    ? `<div class="status"><div class="bad">⚠ Kein Seeweg ${f.regions.map(regionName).join(' ↔ ')} – ist das Wasser dazwischen zugeschüttet? Die Schiffe bleiben am Pier.</div></div>`
    : `<div class="status"><div class="ok">⛴️ ${f.regions.map(regionName).join(' ↔ ')} · ${f.ships.length} ${f.ships.length === 1 ? 'Schiff' : 'Schiffe'} · ${nf1.format(f.km)} km Seeweg</div>${trafficStatus(f, f.traffic).join('')}</div>`;
  if (!targets.length) return html + '<p class="muted">Bau einen Steg (oder Hafen) auf einer anderen Insel – dort legen deine Schiffe an und bringen Pendler und Besucher.</p>';
  if (ships.length >= berths) return html + `<p class="muted">Alle Liegeplätze belegt${(t.lvl || 1) < 3 ? ' – ausbauen bringt mehr' : ''}. Mehr Fahrgäste schafft auch ein schnelleres Modell (Forschung → 🚢 Verkehr).</p>`;
  if (!shipPick.model || !vehicleOk('schiff', shipPick.model)) shipPick.model = bestVehicle('schiff').id;
  if (!targets.includes(shipPick.to)) shipPick.to = targets[0];
  const m = SHIP_BY_ID[shipPick.model];
  return html + `<div class="label">Neues Schiff</div>
    <div class="looks">${SHIP_MODELS.map(v => vehicleOk('schiff', v.id) ? `<button class="look${v.id === m.id ? ' on' : ''}" data-shipmodel="${v.id}">${v.icon} ${v.name}</button>`
      : `<button class="look" disabled title="Forschung → 🚢 Verkehr">🔒 ${v.name}</button>`).join('')}</div>
    <div class="looks">${targets.map(o => `<button class="look${o === shipPick.to ? ' on' : ''}" data-shipto="${o}">${landingName(o)}</button>`).join('')}</div>
    <div class="row"><button class="btn" data-shipbuy data-cost="${m.buy.money}" data-mat='${JSON.stringify({ ...m.buy, money: undefined })}'>${m.icon} ${m.name} kaufen · ${costText(m.buy)}</button></div>
    <p class="muted">${Math.round(m.seats * m.speed)} Fahrgäste/min, ohne Strom. Schiffe zum selben Ziel teilen sich die Fahrgäste.</p>`;
}
// Aufträge (ab Handelshafen): was die Frachter kaufen oder anbieten, wie lange noch
function ordersHtml(t) {
  if ((t.lvl || 1) < 2) return '<div class="label">🚢 Aufträge</div><p class="muted">Ab Stufe 2 (Handelshafen) legen Frachter mit Aufträgen an: Sie kaufen dir ab, was sich im Lager stapelt – oft für deutlich mehr, als es wert ist.</p>';
  const now = Date.now(), slots = orderSlots(), next = Math.max(0, (state.orderNext || now) - now);
  const card = o => {
    const r = RES[o.res], left = fmtClock(o.until - now), have = state.res[o.res];
    if (o.kind === 'sell') return `<div class="order${o.huge ? ' huge' : ''}"><b>${o.huge ? '⭐ Großauftrag' : '📥 Ankauf'}: ${fmt(o.amount)} ${r.icon} ${r.name}</b>
      <span>zahlt 🪙 ${fmt(o.pay)} · ${Math.round(o.prem * 100)} % des Werts · noch ${left}</span>
      <button class="btn" data-order="${o.id}" ${have >= o.amount ? '' : 'disabled'}>${have >= o.amount ? 'Liefern' : `Du hast ${fmt(have)}`}</button></div>`;
    return `<div class="order"><b>📤 Angebot: ${fmt(o.amount)} ${r.icon} ${r.name}</b><span>für 🪙 ${fmt(o.pay)} · noch ${left}</span>
      <button class="btn ghost" data-order="${o.id}" data-cost="${o.pay}">Kaufen · 🪙 ${fmt(o.pay)}</button></div>`;
  };
  return `<div class="label">🚢 Aufträge · ${state.orders.length} von ${slots}${state.orders.length < slots ? ` · nächster in ${fmtClock(next)}` : ''}</div>
    ${state.orders.length ? `<div class="orders">${state.orders.map(card).join('')}</div>` : '<p class="muted">Gerade liegt kein Frachter da – der nächste kommt bald.</p>'}
    ${(t.lvl || 1) < 3 ? '<p class="muted">Großer Hafen (Stufe 3): 4 Aufträge gleichzeitig und Großaufträge (fast das ganze Lager, bis 300 % des Werts).</p>' : ''}`;
}
// Seilbahn: mit welcher Station verbunden, was sie befördert
function cableStatus(k) {
  const c = T.cables.find(l => l.stations.includes(k));
  if (!c) return [`<div class="bad">✗ Noch keine Gegenstation: eine zweite Seilbahn-Station bis ${SEIL_MAX} Felder entfernt aufstellen</div>`];
  const out = [`<div class="ok">🚡 Seil zur Station ${c.regions.length > 1 ? `auf der ${regionName(c.regions.find(r => r !== regionAt(...keyXY(k))))}` : 'gegenüber'} · ${nf1.format(c.km)} km – was nah an beiden Stationen steht, ist angebunden</div>`];
  if (c.regions.length > 1) out.push(...trafficStatus(c, c.traffic));
  else out.push('<div class="muted">👥 Fahrgäste gibt es zwischen zwei Inseln – hier bindet sie die Gegend ans Dorf an.</div>');
  return out;
}
// Laden: Kundschaft, Innenstadt, was er aus dem Lager verkauft
const WARE_FROM = { kaffee: 'Kaffeeplantage', tee: 'Teegarten', kakao: 'Kakaoplantage' };
function shopStatus(t, s) {
  const S = SHOPS[t.b], out = [], kd = s.kunden || 0;
  out.push(kd >= 1 ? `<div>🛒 Kundschaft: ${fmt(kd)}${s.same > 1 ? ` – teilt sich die Leute mit ${s.same - 1} weiteren ${ITEMS[t.b].name} im Viertel` : ' (Einwohner im Viertel + Besucher der Insel)'}</div>`
    : '<div class="bad">✗ Noch keine Kundschaft: Häuser ins selbe Viertel (über Wege verbunden) – oder Besucher per Bahn und Schiff</div>');
  const next = [...INNER_STEPS].reverse().find(([min]) => (s.types || 0) < min);
  out.push(`<div class="${s.inner ? 'ok' : ''}">🛍️ Innenstadt: ${s.types || 0} verschiedene Läden im Viertel${s.inner ? ` · +${Math.round(s.inner * 100)} %` : ''}${next ? ` <small class="muted">(ab ${next[0]}: +${Math.round(next[1] * 100)} %)</small>` : ''}</div>`);
  const sales = (s.sales || []).filter(sl => saleable(sl.res) > 0);
  if (S.all || S.raw) out.push(sales.length ? `<div class="ok">📦 Verkauft ${sales.map(sl => RES[sl.res].icon).join('')} aus dem Lager → +${fmtRate(sales.reduce((a, sl) => a + sl.rate * sl.pay, 0))}/s</div>`
    : '<div class="bad">📦 Das Lager ist leer – nichts zu verkaufen</div>');
  else if (S.ware) {
    const sl = (s.sales || [])[0], r = RES[S.ware];
    const kp = keepOf(S.ware), keepTxt = kp ? ` <small class="muted">(🔒 ${kp >= KEEP_ALL ? 'alles' : fmt(kp)} bleiben im Lager)</small>` : '';
    out.push(saleable(S.ware) > 0 && sl ? `<div class="ok">${r.icon} Verkauft ${fmtRate(sl.rate * 60)} ${r.name}/min → +${fmtRate(sl.rate * sl.pay)}/s${keepTxt}</div>`
      : state.res[S.ware] > 0 ? `<div>${r.icon} ${r.name}: nur der Vorrat ist da (🔒 ${kp >= KEEP_ALL ? 'alles' : fmt(kp)}) – den verkauft der Laden nicht. Im 📦 Lager einstellbar.</div>`
      : `<div class="bad">${r.icon} Kein ${r.name} im Lager${WARE_FROM[S.ware] ? ` – wächst auf fernen Inseln (${WARE_FROM[S.ware]})` : ''}. Mit ${r.name} verdient der Laden viel mehr.</div>`);
  }
  if (S.attr) out.push(`<div class="ok">👥 Zieht ${S.attr} Besucher auf die Insel (per Bahn und Schiff)</div>`);
  if (S.hotel) out.push(`<div class="ok">🏨 Die Insel zieht ${Math.round(S.hotel * 100)} % mehr Besucher an</div>`);
  return out;
}
// Hauptbahnhof: Gleise mit ihrem Ziel, Umsteigen, + Gleis / − Gleis, Aussehen
const HBF_LOOKS = { glas: '🏛️ Glashalle', backstein: '🧱 Backstein', land: '🌾 Landbahnhof' };
function hbfHtml(x, y, t) {
  const n = hbfGleise(t), home = regionAt(x, y), seen = new Map(), rows = [], hubRegions = new Set();
  for (let g = 0; g < n; g++) {
    const gk = gleisTiles(t, x, y, g).hall[0].join(), l = lineOf(gk);
    let where = '<span class="muted">noch keine Strecke vor dem Gleis</span>';
    if (T.rail.stationNet.get(gk) != null) where = l ? `→ ${l.regions.filter(r => r !== home).map(r => `${regionIcon(r)} ${regionName(r)}`).join(', ') || l.regions.map(regionName).join(' ↔ ')}` : '<span class="muted">Strecke ohne Ziel</span>';
    if (l && l.traffic && l.traffic.served < 1) where += ` · 😣 ${Math.round(l.traffic.served * 100)} %`;
    if (l) { l.regions.forEach(r => hubRegions.add(r)); if (seen.has(l)) where += ` <span class="bad">· hängt an Gleis ${seen.get(l) + 1}</span>`; else seen.set(l, g); }
    rows.push(`<div class="hall-row"><span><b>Gleis ${g + 1}</b> <small>${where}</small></span><button class="btn ghost small" data-gleis="${gk}">🚆 Zug</button></div>`);
  }
  hubRegions.delete(home);
  const addErr = hbfResizeError(x + ',' + y, 1), { money: gm, ...gmat } = GLEIS_COST;
  return `<div class="label">🚉 ${n} Gleise</div>
    <div class="ships">${rows.join('')}</div>
    ${hubRegions.size > 1 ? `<div class="status"><div class="ok">🔀 Umsteigen: ${[...hubRegions].map(r => `${regionIcon(r)} ${regionName(r)}`).join(', ')} sind hier miteinander verbunden</div></div>` : ''}
    <div class="row"><button class="btn" id="p-gplus" data-cost="${gm}" data-mat='${JSON.stringify(gmat)}' ${addErr && !/Taler|Material/.test(addErr) ? 'disabled' : ''}>+ Gleis · ${costText(GLEIS_COST)}</button>
      ${n > HBF_MIN ? '<button class="btn ghost" id="p-gminus">− Gleis</button>' : ''}</div>
    ${addErr && !/Taler|Material/.test(addErr) ? `<p class="muted">+ Gleis: ${addErr}.</p>` : ''}
    <p class="muted">Vor jedes Gleis eine eigene Strecke legen – mit einem Feld Abstand, sonst hängen sie zusammen und sind eine Linie.</p>
    <div class="label">Aussehen</div>
    <div class="looks">${Object.entries(HBF_LOOKS).map(([id, nm]) => `<button class="look${(t.look || 'glas') === id ? ' on' : ''}" data-hlook="${id}">${nm}</button>`).join('')}</div>`;
}
// Ein Gleis des Hauptbahnhofs: wie ein Bahnhof (Linie, Fahrgäste, Zug, Wagen)
function openGleis(gk) {
  const G = GLEIS.get(gk);
  if (!G) { closePanel(); return; }
  const line = lineOf(gk);
  const el = showPanel(`
    <h3>Gleis ${G.g + 1} <span class="lvl">Hauptbahnhof</span></h3>
    <div class="status">${stationStatus(gk).join('')}</div>
    ${line ? trainChooser(line) : ''}
    <div class="row"><button class="btn ghost" id="p-back">← Hauptbahnhof</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => GLEIS.has(gk) ? openGleis(gk) : closePanel());
  if (line) wireTrainChooser(el, line, () => openGleis(gk));
  $('p-back').onclick = () => { const H = GLEIS.get(gk); if (H) openInfo(...keyXY(H.hub)); else closePanel(); };
  $('p-close').onclick = closePanel;
}
// Fahrgäste, Plätze, Auslastung und was es bringt
const regionIcon = r => r === 'home' ? '🏠' : ISLE_BY_ID[r].icon;
// Zu welchem Ortsteil ein Halt zählt (Fahrgäste rechnen je Ortsteil) – auf aufgeschüttetem Land die nächste Insel
const STOPS = new Set(['station', 'hbf', 'seilbahn', 'hafen', 'bootssteg']);
function placeLabel(x, y) {
  const r = regionAt(x, y), filled = islandAt(x, y) !== r;
  return `📍 Ortsteil ${regionIcon(r)} ${regionName(r)}${filled ? ' (aufgeschüttet)' : ''}`;
}
function trafficStatus(line, tr) {
  const pct = tr.seats ? Math.round(tr.demand / tr.seats * 100) : 0, out = [];
  const visits = [...tr.visits].filter(([, v]) => v >= 1).map(([r, v]) => `${regionIcon(r)} ${fmt(v)}`).join(', ');
  const vehicles = line.kind === 'seil' ? 'Gondeln' : line.kind === 'faehre' ? `${line.ships.length} ${line.ships.length === 1 ? 'Schiff' : 'Schiffe'}` : (() => { const cars = line.looks.slice(0, line.running).reduce((s, lk) => s + carsOf(lk), 0);
    return `${line.running > 1 ? `${line.running} Züge` : '1 Zug'}, ${cars} Wagen`; })();
  if (!tr.demand) {
    out.push('<div class="muted">👥 Noch will niemand mitfahren: Häuser auf der anderen Insel, eine restaurierte Sehenswürdigkeit oder ein Wunderwerk bringen Fahrgäste.</div>');
    return out;
  }
  out.push(`<div>👥 Fahrgäste: ${fmt(tr.demand)}/min – ${[tr.commute >= 1 ? `Pendler ${fmt(tr.commute)}` : '', tr.visitors >= 1 ? `Besucher ${fmt(tr.visitors)}${visits ? ` (${visits})` : ''}` : ''].filter(Boolean).join(', ')}</div>`);
  out.push(`<div>💺 Plätze: ${fmt(tr.seats)}/min · ${vehicles}</div>`);
  if (tr.transfer && tr.transfer.length) out.push(`<div class="ok">🔀 Umsteigen am Hauptbahnhof: auch ${tr.transfer.map(r => `${regionIcon(r)} ${regionName(r)}`).join(', ')}</div>`);
  if (tr.shared) out.push(`<div class="muted">🔀 Teilt sich die Fahrgäste mit ${tr.shared === 1 ? 'einer weiteren Verbindung' : `${tr.shared} weiteren Verbindungen`} zu denselben Inseln – nach Plätzen.</div>`);
  out.push(`<div class="load"><i style="width:${Math.min(100, pct)}%" class="${tr.served < 1 ? 'full' : ''}"></i></div>`);
  out.push(tr.served < 1 ? `<div class="bad">😣 Überfüllt (${pct} %): nur ${Math.round(tr.served * 100)} % kommen mit</div>`
    : `<div class="ok">✓ Alle kommen mit · Auslastung ${pct} %</div>`);
  out.push(`<div class="ok">🪙 +${fmtRate(tr.fare * masteryMul('taler'))}/s Fahrkarten · +${fmtRate(tr.spend * masteryMul('taler'))}/s von Besuchern</div>`);
  if (tr.served < 1) out.push(line.kind === 'seil' ? '<div class="muted">Mehr Plätze: eine zweite Verbindung dorthin (Zug, weitere Seilbahn).</div>'
    : line.kind === 'faehre' ? '<div class="muted">Mehr Plätze: ein weiteres Schiff, ein schnelleres Modell (Forschung → 🚢 Verkehr) oder eine zweite Verbindung (Zug, Seilbahn).</div>'
    : `<div class="muted">Mehr Plätze: Wagen anhängen${line.loop ? ' oder einen weiteren Zug' : ' – als Rundkurs passen auch mehrere Züge'}.</div>`);
  return out;
}
// Züge der Linie: Modell und Farbe wählt der Spieler für jeden Zug; gespeichert an allen Bahnhöfen der Linie
const modelName = id => (TRAIN_BY_ID[id] || TRAIN_BY_ID.tram).name;
const TRAIN_COLS = ['#d9534a', '#3e7fd0', '#58b36a', '#f2b53a', '#b07ad6', '#f28cb1', '#4a4a58'];
const lineTrain = line => line.looks[0];
function trainChooser(line) {
  const n = line.count, { money, ...mat } = EXTRA_TRAIN;
  const { money: cm, ...cmat } = EXTRA_CAR;
  const one = (lk, i) => `<div class="label">${n > 1 ? `Zug ${i + 1}` : 'Zug dieser Linie'}${i > 0 ? ` <button class="btn ghost small" data-tdel="${i}">Entfernen · +🪙 ${fmt(money + (lk.plus || 0) * cm)}</button>` : ''}</div>
    <div class="looks">${TRAIN_MODELS.map(m => vehicleOk('zug', m.id) || m.id === lk.model
      ? `<button class="look${m.id === lk.model ? ' on' : ''}" data-train="${i}:${m.id}">${m.icon} ${m.name}</button>`
      : `<button class="look" disabled title="Forschung → 🚢 Verkehr">🔒 ${m.name}</button>`).join('')}</div>
    <div class="swatches">${TRAIN_COLS.map((c, j) => `<button class="sw${j === lk.col ? ' on' : ''}" data-tcol="${i}:${j}" style="background:${c}" aria-label="Zugfarbe ${j + 1}"></button>`).join('')}</div>
    <div class="row cars"><span>🚃 ${carsOf(lk)} Wagen · ${trainSeats(lk)} Fahrgäste/min · ${fmtPow(carNeed(line.tiles, carsOf(lk)))} ⚡</span>
      ${(lk.plus || 0) < MAX_PLUS_CARS ? `<button class="btn small" data-carplus="${i}" data-cost="${cm}" data-mat='${JSON.stringify(cmat)}'>+ Wagen · 🪙 ${fmt(cm)} ${matText(cmat)}</button>` : ''}
      ${lk.plus ? `<button class="btn ghost small" data-carminus="${i}">− Wagen</button>` : ''}</div>`;
  const more = line.loop && n < line.max
    ? `<div class="row"><button class="btn" data-tadd data-cost="${money}" data-mat='${JSON.stringify(mat)}'>🚆 + Zug · 🪙 ${fmt(money)} ${matText(mat)}</button></div>
       <p class="muted">Ein weiterer Zug (${modelName(bestVehicle('zug').id)}): +${trainSeats({ model: bestVehicle('zug').id })} Fahrgäste/min, braucht ${fmtPow(carNeed(line.tiles, carsOf({ model: bestVehicle('zug').id })))} ⚡.</p>`
    : line.loop ? `<p class="muted">Mehr Züge ab ${(n + 1) * KM_PER_TRAIN} km Rundkurs (1 Zug je ${KM_PER_TRAIN} km).</p>` : '';
  return line.looks.slice(0, n).map(one).join('') + more;
}
function wireTrainChooser(el, line, reopen) {
  const store = looks => {
    for (const k of line.stations) {
      const t = stopConf(k);
      if (!t) continue;
      t.train = looks[0].model; t.trainCol = looks[0].col;
      if (looks[0].plus) t.trainPlus = looks[0].plus; else delete t.trainPlus;
      if (looks.length > 1) t.extra = looks.slice(1).map(l => ({ model: l.model, col: l.col, ...(l.plus ? { plus: l.plus } : {}) })); else delete t.extra;
    }
    sfx('deco'); save(); recalc(); syncTrains(); reopen();
  };
  const looks = line.looks.map(l => ({ ...l }));
  for (const b of el.querySelectorAll('[data-train]')) b.onclick = () => { const [i, m] = b.dataset.train.split(':'); looks[+i].model = m; store(looks); };
  for (const b of el.querySelectorAll('[data-tcol]')) b.onclick = () => { const [i, c] = b.dataset.tcol.split(':'); looks[+i].col = +c; store(looks); };
  for (const b of el.querySelectorAll('[data-tdel]')) b.onclick = () => {
    const lk = looks[+b.dataset.tdel];
    addCost(EXTRA_TRAIN, 1);
    for (let c = 0; c < (lk.plus || 0); c++) addCost(EXTRA_CAR, 1);                  // angehängte Wagen gibt es mit zurück
    looks.splice(+b.dataset.tdel, 1); store(looks);
  };
  for (const b of el.querySelectorAll('[data-carplus]')) b.onclick = () => {
    if (!canPay(EXTRA_CAR)) { fail(state.money < EXTRA_CAR.money ? 'Zu wenig Taler' : 'Material fehlt noch'); return; }
    addCost(EXTRA_CAR, -1);
    looks[+b.dataset.carplus].plus = (looks[+b.dataset.carplus].plus || 0) + 1;
    toast('🚃 Ein Wagen mehr: +' + Math.round(carSeats(looks[+b.dataset.carplus])) + ' Fahrgäste/min');
    store(looks);
  };
  for (const b of el.querySelectorAll('[data-carminus]')) b.onclick = () => {
    const lk = looks[+b.dataset.carminus];
    if (!lk.plus) return;
    addCost(EXTRA_CAR, 1);
    lk.plus--;
    store(looks);
  };
  const add = el.querySelector('[data-tadd]');
  if (add) add.onclick = () => {
    if (!canPay(EXTRA_TRAIN)) { fail(state.money < EXTRA_TRAIN.money ? 'Zu wenig Taler' : 'Material fehlt noch'); return; }
    addCost(EXTRA_TRAIN, -1);
    looks.splice(line.count, 0, { model: bestVehicle('zug').id, col: (looks[line.count - 1].col + 1) % TRAIN_COLS.length });
    toast('🚆 Ein neuer Zug fährt los!');
    store(looks);
  };
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
    const { money, mat } = info;
    const costs = [money ? `🪙 ${fmt(Math.min(state.money, money))}/${fmt(money)}` : '',
      ...Object.entries(mat).map(([r, n]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], n))}/${fmt(n)}`)].filter(Boolean);
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

// Truhe auf einer fernen Insel: selbst öffnen
function openChestInfo(x, y, t) {
  const i = ISLE_BY_ID[t.isle || regionAt(x, y)], c = i && CHESTS[i.chest];
  if (!c) { closePanel(); return; }
  showPanel(`
    <h3>🎁 ${c.name}</h3>
    <p>Auf der ${i.icon} ${i.name} gefunden – ${c.text}.</p>
    <div class="row"><button class="btn" id="p-chest">🎁 Öffnen</button><button class="btn ghost" id="p-close">Schließen</button></div>`);
  $('p-chest').onclick = () => { closePanel(); openChest(x + ',' + y); };
  $('p-close').onclick = closePanel;
}
// Themen-Insel: was sie bietet, was zum Erschließen fehlt
function openIsle(id, sx, sy) {
  const i = ISLE_BY_ID[id], nxt = nextIsle(), L = LANDMARKS[i.lm], isNext = nxt === i;
  showPanel(`
    <h3>${i.icon} ${i.name}</h3>
    <p class="muted">${i.far ? FAR_KINDS[i.ter].text : i.text}</p>
    ${i.far ? `<p>🌫️ <b>Ferne Insel</b><br><span class="muted">Noch im Nebel. Wer sie entdeckt, findet dort eine alte Truhe.</span></p>`
      : `<p>${L.icon} <b>${L.name}</b><br><span class="muted">${L.effect}</span></p>`}
    ${isNext ? expeditionHtml(true) : `<div class="status"><div class="bad">🔒 Erst die ${nxt.icon} ${nxt.name} entdecken</div></div>`}
    <div class="row"><button class="btn ghost" id="p-close">Schließen</button></div>`, () => isleOpen(id) ? closePanel() : openIsle(id));
  if ($('p-expo')) $('p-expo').onclick = () => { if (sendExpedition()) openIsle(id); };
  if ($('p-steg')) $('p-steg').onclick = () => { closePanel(); menuTop = 'verbinden'; menuSub = 'alle'; buildToolbar(); setTool('bootssteg'); };
  $('p-close').onclick = closePanel;
  panelAt(sx, sy);
}
// Expedition: was fehlt, Boot losschicken, Countdown (am Steg und an der Insel)
function expeditionHtml(atIsle) {
  const i = nextIsle(), e = state.expedition;
  if (e) {
    const to = ISLE_BY_ID[e.isle];
    return `<div class="label">⛵ Expedition</div><div class="status"><div class="ok">⛵ Das Boot ist unterwegs zur ${to.icon} ${to.name} – zurück in ${fmtClock(expeditionLeft())}</div></div>`;
  }
  if (!i) return '<p class="ok">⛵ Alle Inseln sind entdeckt.</p>';
  const need = isleNeeds(i), ok = need.every(c => c.ok), steg = stegs().length > 0;
  return `<div class="label">⛵ Nächste Insel entdecken: ${i.icon} ${i.name}</div>
    <div class="status">${need.map(c => `<div class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} ${c.text}${c.have != null && !c.ok ? ` · du hast ${fmt(c.have)}` : ''}</div>`).join('')}
      ${steg ? '' : '<div class="bad">✗ Ein Steg am Ufer (🛤️ Verbinden → Steg)</div>'}</div>
    <p class="muted">Das Boot ist etwa ${expMinutes(i)} Min. unterwegs.${i.need.money || i.need.science ? ' Taler und Ideen werden beim Ablegen ausgegeben.' : ''}</p>
    <div class="row">${steg ? `<button class="btn" id="p-expo" ${ok ? '' : 'disabled'}>⛵ Boot losschicken</button>`
      : atIsle ? '<button class="btn" id="p-steg">🪵 Steg bauen</button>' : ''}</div>`;
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
              ${ready ? `<button class="btn" data-tech="${t.id}" data-sci="${techCost(t)}" ${state.science < techCost(t) ? 'disabled' : ''}>Erforschen · 💡 ${fmt(techCost(t))}</button>` : ''}
            </div>`;
          }).join('')}</div>`;
      }).join('')}</div>`;
  } else if (tab === 'stufen') {
    const have = `<p>Du hast <span class="sci-have">💡 ${fmt(state.science)}</span> Ideen${T.sci > 0 ? ` (+${fmtRate(T.sci)}/s)` : ''}. Jede Stufe bringt +${Math.round(MASTERY_STEP * 100)} % und geht endlos weiter – die nächste kostet jeweils das 1,5-Fache.</p>`;
    body = have + (masteryOpen() ? `<div class="mastery">${MASTERY.map(m => {
      const lvl = masteryLvl(m.id), cost = masteryCost(m.id);
      return `<div class="tech${lvl ? ' done' : ''}"><b>${m.icon} ${m.name}${lvl ? ' ' + roman(lvl) : ''}</b>
        <span>${lvl ? `Jetzt +${Math.round(MASTERY_STEP * 100 * lvl)} % ${m.text}` : `+${Math.round(MASTERY_STEP * 100)} % ${m.text} je Stufe`}</span>
        <button class="btn" data-mastery="${m.id}" data-sci="${cost}" ${state.science < cost ? 'disabled' : ''}>Stufe ${roman(lvl + 1)} · 💡 ${fmt(cost)}</button></div>`;
    }).join('')}</div>` : '<p class="muted">🔒 Baue eine Bibliothek – dann gibt es die Stufen-Forschung.</p>');
  } else if (tab === 'verkehr') {
    const card = (kind, m) => {
      const have = vehicleOk(kind, m.id), open = vehicleOpen(kind, m), perMin = kind === 'zug' ? trainSeats({ model: m.id }) : Math.round(m.seats * m.speed);
      const stats = kind === 'zug' ? `${m.cars} Wagen à ${m.perCar} Plätze · Tempo ${'★'.repeat(Math.round(m.speed * 2))}` : `${m.seats} Plätze · Tempo ${'★'.repeat(Math.round(m.speed * 2))}`;
      const need = !hasTech(VEHICLE_BASE[kind]) ? `braucht Forschung „${TECH_BY_ID[VEHICLE_BASE[kind]].name}“` : !open ? `braucht eine ${TECH_TIERS[m.tier || 1].name}` : '';
      return `<div class="tech${have ? ' done' : ''}${!have && !open ? ' locked' : ''}"><b>${have ? '✓ ' : ''}${m.icon} ${m.name}</b>
        <span>${stats} → ${perMin} Fahrgäste/min${kind === 'schiff' ? ` · kaufen am Hafen: ${costText(m.buy)}` : ''}</span>
        ${need && !have ? `<span class="muted">${need}</span>` : ''}
        ${!have && open && m.cost ? `<button class="btn" data-vehicle="${kind}:${m.id}" data-sci="${m.cost}" ${state.science < m.cost ? 'disabled' : ''}>Erforschen · 💡 ${fmt(m.cost)}</button>` : ''}</div>`;
    };
    body = `<p>Du hast <span class="sci-have">💡 ${fmt(state.science)}</span> Ideen. Jedes Verkehrsmittel sieht anders aus, hat mehr Plätze und ist schneller – so schaffen Züge und Schiffe mehr Fahrgäste.</p>
      <div class="label">🚢 Schiffe (Fähren am Hafen)</div><div class="mastery">${SHIP_MODELS.map(m => card('schiff', m)).join('')}</div>
      <div class="label">🚆 Züge</div><div class="mastery">${TRAIN_MODELS.map(m => card('zug', m)).join('')}</div>`;
  } else if (tab === 'erfindung') {
    body = `<p>Du hast <span class="sci-have">💡 ${fmt(state.science)}</span> Ideen. Erfindungen gibt es nur für Ideen – besondere Dinge für deine Insel.</p>`
      + (inventionsOpen() ? `<div class="mastery">${INVENTIONS.map(inv => {
        const have = hasInvention(inv.id);
        return `<div class="tech${have ? ' done' : ''}"><b>${have ? '✓ ' : ''}${inv.icon} ${inv.name}</b><span>${inv.text}</span>
          ${have ? (inv.id === 'feuerwerk' ? '<button class="btn" data-fire="1">🎆 Feuerwerk zünden</button>' : '')
            : `<button class="btn" data-invent="${inv.id}" data-sci="${inv.cost}" ${state.science < inv.cost ? 'disabled' : ''}>Erfinden · 💡 ${fmt(inv.cost)}</button>`}</div>`;
      }).join('')}</div>` : '<p class="muted">🔒 Baue eine Universität – dann kannst du erfinden.</p>');
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
      <button class="look${tab === 'stufen' ? ' on' : ''}" data-rtab="stufen">📈 Stufen</button>
      <button class="look${tab === 'verkehr' ? ' on' : ''}" data-rtab="verkehr">🚢 Verkehr</button>
      <button class="look${tab === 'erfindung' ? ' on' : ''}" data-rtab="erfindung">💡 Erfindungen</button>
      <button class="look${tab === 'design' ? ' on' : ''}" data-rtab="design">🎨 Kunstakademie</button>
    </div>
    ${body}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`, () => openResearch(tab));
  $('modal-card').classList.add('research');
  for (const b of document.querySelectorAll('[data-rtab]')) b.onclick = () => { sfx('deco'); openResearch(b.dataset.rtab); };
  for (const b of document.querySelectorAll('[data-tech]')) b.onclick = () => research(b.dataset.tech);
  for (const b of document.querySelectorAll('[data-mastery]')) b.onclick = () => { if (studyMastery(b.dataset.mastery)) openResearch('stufen'); };
  for (const b of document.querySelectorAll('[data-invent]')) b.onclick = () => { if (invent(b.dataset.invent)) openResearch('erfindung'); };
  for (const b of document.querySelectorAll('[data-vehicle]')) b.onclick = () => { const [k, id] = b.dataset.vehicle.split(':'); if (researchVehicle(k, id)) openResearch('verkehr'); };
  for (const b of document.querySelectorAll('[data-fire]')) b.onclick = () => { closeModal(); startFireworks(); };
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
      if (s.wish.ready) ready.push({ ...where, kind: 'haus', cost: houseCost(s.wish.next), text: `${who} → ${s.wish.next.name}` });
      else if (s.wish.met === s.wish.total - 1) almost.push({ ...where, text: `${who} – fehlt: ${s.wish.list.find(w => !w.ok).text}` });
    } else if (s.grow && s.grow.next) {
      const miss = s.grow.conds.filter(c => !c.ok);
      if (s.grow.ready) ready.push({ ...where, kind: 'stage', cost: s.grow.next.cost, text: `${stageName(t)} → ${s.grow.next.name}` });
      else if (miss.length === 1) almost.push({ ...where, text: `${stageName(t)} – fehlt: ${miss[0].text}` });
    } else if (WONDERS[t.b] && !wonderDone(t) && canPay(wonderCost(t))) {          // Wunderwerk: nächster Abschnitt bezahlbar
      ready.push({ ...where, kind: 'wonder', cost: wonderCost(t), text: `🏗️ ${ITEMS[t.b].name}: ${WONDERS[t.b].names[t.phase || 0]}` });
    }
  }
  for (const type of Object.keys(LM_STAGES)) {
    const info = restoreInfo(type);
    if (info.next && !info.err && info.pos) ready.push({ x: info.pos[0], y: info.pos[1], b: 'lm', kind: 'lm', type, cost: { money: info.money, ...info.mat }, text: `🏮 ${lmStepName(type, info.stage + 1)}` });
  }
  return { ready, almost };
}
// Bereites nach Art ordnen – wie das Bau-Menü; Wunderwerke und Laternen am Ende und nur einzeln
function readyGroups(ready) {
  const menu = MENU.find(m => m.id === 'bauen').groups;
  const groupOf = e => e.kind === 'lm' ? 'lm' : e.kind === 'wonder' ? 'wunder' : isHome(e.b) ? 'wohnen'
    : (menu.find(g => g.items.includes(e.b)) || { id: 'andere' }).id;
  const defs = [...menu.map(g => ({ id: g.id, label: g.label, bulk: g.id !== 'wunder' })), { id: 'andere', label: '🧩 Sonstiges', bulk: true }, { id: 'lm', label: '🏮 Sehenswürdigkeiten', bulk: false }];
  return defs.map(d => ({ ...d, items: ready.filter(e => groupOf(e) === d.id) })).filter(g => g.items.length);
}
const sumCost = list => { const c = {}; for (const e of list) for (const [r, n] of Object.entries(e.cost || {})) c[r] = (c[r] || 0) + n; return c; };
function openTownHall(tab = hallTab) {
  hallTab = tab;
  const n = lanternCount(), title = townTitle(n), nextTitle = TITLES.find(([min]) => min > n);
  const tabs = [['overview', 'Übersicht'], ['ready', 'Bereit'], ['isles', 'Inseln'], ['erfolge', 'Erfolge'], ['wishes', 'Wünsche'], ['town', 'Ort']];
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
        <button class="btn ghost small" data-quick-go="album">📒 Album</button>
        <button class="btn ghost small" data-quick-go="tips">💡 Tipps</button>
        ${hasInvention('feuerwerk') ? '<button class="btn ghost small" data-quick-go="fire">🎆 Feuerwerk</button>' : ''}
        ${nx ? `<button class="btn ghost small" data-isle-go="${nx.id}">${nx.icon} Nächste Insel</button>` : ''}
      </div>
      <p class="big" style="font-size:18px">${title} · 🏮 ${n} / ${LANTERN_TOTAL}</p>
      ${nextTitle ? `<p class="muted">Ab ${nextTitle[0]} Laternen: ${nextTitle[1]}</p>` : ''}
      <div class="stats">
        <span>👥 ${T.pop} Einwohner</span><span>👷 ${T.jobs} arbeiten</span><span>🏠 ${count} Gebäude</span>
        <span>🪙 +${fmtRate(T.inc)}/s</span><span>💡 +${fmtRate(T.sci)}/s</span><span>🌸 ${T.beauty}</span>
        ${T.rail.lines.length ? `<span>🚆 ${T.rail.trains} ${T.rail.trains === 1 ? 'Zug fährt' : 'Züge fahren'}</span>` : ''}
        ${T.rail.power.city || T.rail.power.supply ? `<span>⚡ ${fmtPow(T.rail.power.supply)}/${T.rail.power.demand}</span>` : ''}
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
    const upBtn = (e, i) => e.kind ? `<button class="btn small" data-up="${i}" ${canPay(e.cost) ? '' : 'disabled'}>${e.kind === 'lm' ? 'Restaurieren' : e.kind === 'wonder' ? 'Bauen' : 'Ausbauen'}${costText(e.cost) ? ' · ' + costText(e.cost) : ''}</button>` : '';
    const row = (e, i, icon, up) => `<div class="hall-row"><span>${icon} ${e.text}</span><span class="hall-btns">${up ? upBtn(e, i) : ''}<button class="btn ghost small" data-jump="${i}">Hin</button></span></div>`;
    // Gruppen wie im Bau-Menü (Wohnen, Geld, Rohstoffe …), je mit „Alle ausbauen“; ganz oben „Alles ausbauen“
    const many = ready.filter(e => e.kind === 'haus' || e.kind === 'stage');
    const allBtn = (list, key, label) => { const c = sumCost(list), ok = list.some(e => canPay(e.cost));
      return `<button class="btn${key === 'all' ? '' : ' small'}" data-upall="${key}" ${ok ? '' : 'disabled'}>${label} · ${list.length} · ${costText(c)}</button>`; };
    const groups = readyGroups(ready);
    body = `
      ${many.length > 1 ? `<div class="row">${allBtn(many, 'all', '✨ Alles ausbauen')}</div>
        <p class="muted">Das Günstigste zuerst, so weit Taler und Material reichen. Wunderwerke und Laternen einzeln.</p>` : ''}
      ${ready.length ? groups.map(g => `<div class="label hall-group"><span>${g.label} (${g.items.length})</span>
          ${g.bulk && g.items.length > 1 ? allBtn(g.items, g.id, 'Alle ausbauen') : ''}</div>
          ${g.items.map(e => row(e, ready.indexOf(e), '✨', true)).join('')}`).join('')
        : '<div class="label">Bereit zum Ausbauen</div><p class="muted">Gerade nichts – schau bei den Wünschen, was fehlt.</p>'}
      ${almost.length ? `<div class="label">Fast geschafft</div>${almost.map((e, i) => row(e, ready.length + i, '💭', false)).join('')}` : ''}`;
  } else if (tab === 'isles') {
    // Alle Inseln auf einen Blick: Stand, was dort steht, Bahnanschluss – und per Knopf hin
    const per = new Map([['home', { n: 0, pop: 0 }], ...ISLES.concat(FAR).map(i => [i.id, { n: 0, pop: 0 }])]);
    for (const [k, t] of state.tiles) {
      if (t.b === 'weg' || t.b === 'schiene' || t.b === 'lm') continue;
      const e = per.get(regionAt(...keyXY(k)));
      if (!e) continue;
      e.n++;
      if (t.b === 'haus') e.pop += HOUSE_STAGES[Math.min(t.lvl, HOUSE_STAGES.length) - 1].pop;
    }
    const nx = nextIsle();
    const row = (id, icon, name, open, extra) => {
      const e = per.get(id), rail = T.traffic.links.some(l => l.regions.length > 1 && l.regions.includes(id));   // Zug, Seilbahn oder Fähre
      const state_ = open ? `🏠 ${e.n} · 👥 ${e.pop}${rail ? ' · 🚆' : ''}${extra || ''}` : id === (nx && nx.id) ? 'als Nächstes' : '🔒';
      return `<div class="hall-row"><span>${icon} <b>${name}</b> <small class="muted">${state_}</small></span>
        <button class="btn ${id === (nx && nx.id) ? '' : 'ghost '}small" data-isle-go="${id}">${open ? 'Hin' : id === (nx && nx.id) ? 'Entdecken …' : 'Ansehen'}</button></div>`;
    };
    body = `
      <div class="label">Deine Inseln</div>
      ${row('home', '🏠', 'Heimatinsel', true, '')}
      ${ISLES.map(i => row(i.id, i.icon, i.name, isleOpen(i.id), ` · ${LANDMARKS[i.lm].icon} ${'🏮'.repeat(lmStage(i.lm))}`)).join('')}
      ${FAR.length ? `<div class="label">Ferne Inseln</div>${FAR.map(i => row(i.id, i.icon, i.name, isleOpen(i.id), '')).join('')}` : ''}`;
  } else if (tab === 'erfolge') {
    const stars = starCount(), rank = rankOf(stars), next = RANKS.find(r => r.stars > stars);
    body = `
      <p class="big" style="font-size:18px">⭐ ${stars} · ${rank.name}</p>
      ${next ? `<p class="muted">Nächste: ${next.name} ab ${next.stars} ⭐${next.item ? ` – schaltet den ${ITEMS[next.item].name} frei` : ''}</p>` : ''}
      ${ACHIEVEMENTS.map(a => {
        const n = state.achieved[a.id] || 0, v = a.value(), done = n >= a.tiers.length, goal = a.tiers[Math.min(n, a.tiers.length - 1)];
        return `<div class="achv-row${done ? ' done' : ''}"><span class="ai">${a.icon}</span><div class="at">
          <div><b>${a.name}</b> <span class="stars">${'⭐'.repeat(n)}${'<span class="off">⭐</span>'.repeat(a.tiers.length - n)}</span></div>
          <div class="bar"><i style="width:${done ? 100 : Math.min(100, v / goal * 100)}%"></i></div>
          <small>${done ? '✓ alle Stufen geschafft' : `${tierText(a, v)} / ${tierText(a, goal)}`}</small></div></div>`;
      }).join('')}`;
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
  for (const b of card.querySelectorAll('[data-upall]')) b.onclick = () => {
    const key = b.dataset.upall, list = key === 'all' ? ready : (readyGroups(ready).find(g => g.id === key) || { items: [] }).items;
    if (upgradeMany(list)) openTownHall('ready');
  };
  for (const b of card.querySelectorAll('[data-up]')) b.onclick = () => {
    const e = all[+b.dataset.up];
    if (e.kind === 'lm') { restoreLandmark(e.type); return; }            // öffnet das Laternen-Fenster
    if (e.kind === 'wonder') { const t = state.tiles.get(e.x + ',' + e.y); if (wonderStep(e.x, e.y, true) && !wonderDone(t)) openTownHall('ready'); return; }
    if (e.kind === 'haus' ? houseUpgrade(e.x, e.y, true) : stageUpgrade(e.x, e.y, true)) openTownHall('ready');
  };
  for (const b of card.querySelectorAll('[data-quick-go]')) b.onclick = () => {
    const q = b.dataset.quickGo;
    if (q === 'diary') openDiary(); else if (q === 'tips') openTipBook(); else if (q === 'album') openAlbum();
    else if (q === 'fire') { closeModal(); startFireworks(); } else openResearch(q);
  };
  for (const b of card.querySelectorAll('[data-lm-go]')) b.onclick = () => {
    const [x, y] = lmTile(b.dataset.lmGo);
    closeModal(); jumpTo(x, y, 3, 3); sparkle(x + 1, y + 1); openLandmark(x, y);
  };
  for (const b of card.querySelectorAll('[data-isle-go]')) b.onclick = () => goIsle(b.dataset.isleGo);
  for (const b of card.querySelectorAll('[data-jump]')) b.onclick = () => {
    const e = all[+b.dataset.jump], et = state.tiles.get(e.x + ',' + e.y) || {}, [w, h] = sizeOf(e.b, et.rot, et);
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
// „Das ist neu“ (Block 25): nach einem Update einmal pro Gerät. Neue Spieler bekommen es nicht (sie kennen das Alte
// nicht). Bei jedem Push mit etwas Sichtbarem: id ändern und die 3–5 Punkte ersetzen.
const NEWS = { id: '2026-10-01', items: [
  '🛍️ <b>Läden!</b> Café, Teeladen, Bubble Tea, Eisdiele, Buchladen, Pizzeria, Juwelier, Möbelhaus … jeder mit eigenen Farben und einem Wahrzeichen auf dem Dach. Sie verdienen an den Leuten im Viertel und an Besuchern – und verkaufen Waren aus dem Lager zum Dreifachen.',
  '🏙️ <b>Innenstadt:</b> Viele verschiedene Läden in einem Viertel bringen bis zu +100 %. Gleiche Läden teilen sich die Kundschaft.',
  '🎭 <b>Kultur und Endgame:</b> Kino, Theater, Museum, Konzerthalle, Aquarium, Zoo, Stadion, Hotels, Kaufhaus und Einkaufspassage ziehen Besucher an.',
  '☕ <b>Kaffee, Tee und Kakao</b> wachsen auf den fernen Inseln – Cafés und Chocolaterien brauchen sie.',
  '🏠 Häuser wünschen sich jetzt auch einen Laden (Stadthaus), ein Café (Villa) und Kultur (Glasvilla).',
] };
const NEWS_KEY = 'kachelhausen_news';
const newsSeen = () => { try { return localStorage.getItem(NEWS_KEY) === NEWS.id; } catch (e) { return true; } };
function markNewsSeen() { try { localStorage.setItem(NEWS_KEY, NEWS.id); } catch (e) { /* privates Fenster: dann eben nicht */ } }
function showNews() {
  markNewsSeen();
  openModal(`
    <h2>✨ Das ist neu</h2>
    <ul class="news">${NEWS.items.map(i => `<li>${i}</li>`).join('')}</ul>
    <div class="row"><button class="btn" id="m-ok" style="flex:1">Los geht's!</button></div>`);
  $('m-ok').onclick = closeModal;
}
// Beim Start: mit Spielstand zeigen, sobald kein anderes Fenster (Hinweise zu Umbauten, Expedition …) offen ist
function newsAfterLoad(hadSave) {
  if (!hadSave) { markNewsSeen(); return; }
  const tryShow = () => { if (newsSeen()) return; if (!$('modal').hidden) { setTimeout(tryShow, 1000); return; } showNews(); };
  setTimeout(tryShow, 2500);
}
function showMenu() {
  openModal(`
    <h2>Menü</h2>
    <div class="row"><button class="btn" id="m-help" style="flex:1">Anleitung</button><button class="btn ghost" id="m-tips" style="flex:1">💡 Tipp-Buch</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-news">✨ Das ist neu</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-sound">${state.muted ? '🔇 Ton ist aus' : '🔊 Ton ist an'}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1; position:relative" id="m-diary">📖 Tagebuch${state.diarySeen < state.diary.length ? '<span class="dot"></span>' : ''}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-achv">🏆 Erfolge</button><button class="btn ghost" style="flex:1" id="m-album">📒 Album</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-home">Zum Rathaus</button></div>
    <div class="row">
      <button class="btn ghost" style="flex:1" id="m-export">💾 Spielstand sichern</button>
      <button class="btn ghost" style="flex:1" id="m-import">📂 Spielstand laden</button>
    </div>
    <div class="row"><button class="btn danger" id="m-reset">Neue Insel beginnen</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  $('m-help').onclick = () => showIntro(false);
  $('m-news').onclick = showNews;
  $('m-tips').onclick = openTipBook;
  $('m-diary').onclick = () => openDiary();
  $('m-achv').onclick = () => openTownHall('erfolge');
  $('m-album').onclick = openAlbum;
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
// Läden verkaufen aus dem Lager (so viel da ist) – das Geld kommt sofort, die Rate zeigt oben die Leiste
let saleRate = 0;
function produce(dt) {
  const before = { ...state.res }, m = boostMul('prod');                // Erlass „Doppelte Ernte“
  for (const [r, v] of Object.entries(T.prod)) state.res[r] += v * m * dt;
  let got = 0;
  for (const sl of T.sales || []) {
    const n = Math.min(sl.rate * dt, saleable(sl.res));                   // nur, was über dem Vorrat liegt
    if (n <= 0) continue;
    state.res[sl.res] -= n; got += n * sl.pay;
  }
  if (got) { state.money += got; state.stats.earned += got; }
  if (dt > 0) saleRate += (got / dt - saleRate) * Math.min(1, dt);
  for (const c of T.conv) {
    const want = c.rate * m * dt, can = Math.min(want, state.res[c.from] / CONV_RATIO);
    if (can <= 0) continue;
    state.res[c.from] -= can * CONV_RATIO;
    state.res[c.to] += can;
  }
  return before;
}
