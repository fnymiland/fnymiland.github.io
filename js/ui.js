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
// Kosten als Kärtchen: Material antippbar (Block 92: „Woher?“); fehlendes Material als eigene Zeile
const costSpans = (money, mat) => [money ? `<span${state.money < money ? ' class="bad"' : ''}>🪙 ${fmt(Math.min(state.money, money))}/${fmt(money)}</span>` : '',
  ...Object.entries(mat || {}).map(([r, n]) => `<span${state.res[r] < n ? ' class="bad"' : ''} ${helpAttr('res:' + r)}>${RES[r].icon} ${fmt(Math.min(state.res[r], n))}/${fmt(n)}</span>`)].join('');
const missMatHtml = mat => { const m = Object.entries(mat || {}).filter(([r, n]) => state.res[r] < n); return m.length ? `<p class="muted miss-mat">Fehlt noch: ${m.map(([r, n]) => `<span class="bad" ${helpAttr('res:' + r)}>${RES[r].icon} ${fmt(Math.ceil(n - state.res[r]))} ${RES[r].name}</span>`).join(' ')}</p>` : ''; };
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
function thumb(type, lvl = 1, tile = null, scale = 1) {
  const prev = g;
  try { return thumbRaw(type, lvl, tile, scale); } catch (e) { g = prev; reportError(e); const c = document.createElement('canvas'); c.width = 112 * scale; c.height = 88 * scale; return c; }
}
// scale: größer gemalt (Karte in der Kunstakademie); tile.style: Weg/Hecke/Zaun/Mauer in diesem Stil statt des gewählten (Block 125)
function thumbRaw(type, lvl = 1, tile = null, scale = 1) {
  const c = document.createElement('canvas');
  c.width = 112 * scale; c.height = 88 * scale;
  const cx0 = c.getContext('2d');
  if (!cx0) return c;                                  // kein Speicher (iPad): leeres Bild statt „Hoppla“ (Block 124)
  if (scale !== 1) cx0.scale(scale, scale);
  const prev = g; g = cx0; FOG = false;
  const tall = ['leuchtturm', 'windrad', 'offshore'].includes(type), big = isBig(type);
  const z = type === 'leuchtturm' ? 0.36 : big ? 0.72 : tall ? 0.95 : type === 'pb_station' ? 1 : 1.3, cx = type === 'pb_station' ? 66 : 56, cy = type === 'leuchtturm' ? 64 : tall ? 70 : type === 'pb_station' ? 62 : 60, hw = TW / 2 * z, hh = TH / 2 * z, d = DEPTH * z * 0.8;
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
    block(1, tf === 'park' ? '#7fcc5e' : tf === 'sand' ? '#f1dfae' : tf === 'forest' ? '#7fc460' : tf === 'obst' ? '#86c35b' : tf === 'rock' ? '#aabb94' : '#96d56f');
    if (tf === 'forest' || tf === 'obst') { tree(cx - 9, cy + 2, z * 0.8, 0.3, tf === 'obst' ? '#ff6b5e' : null); tree(cx + 8, cy + 4, z * 0.9, 0.7, tf === 'obst' ? '#ffb13b' : null); }
    else if (tf === 'rock') drawRocks(cx, cy, z * 0.9, 5003, 5007, false);
    else if (tf === 'wiese') for (let i = 0; i < 6; i++) circle(cx - 14 + i * 6, cy + (i % 2 ? 3 : -2), 2.4, FLOWER_COLS[i % FLOWER_COLS.length]);
    else ellipse(cx + 6, cy + 2, 3, 2, '#ffd9e0');
  } else if (type === 'weg') {
    block(1, '#96d56f');
    drawPath(cx, cy, z, 1e6, 1e6, { style: (tile && tile.style) || currentStyle('weg'), ...(tile && tile.wide ? { wide: true } : {}) });
  } else if (type === 'schiene') {
    block(1, '#96d56f');
    drawObject('schiene', cx, cy, z, 0, 1e6, 1e6, 1, { rot: 0 });
  } else if (type === 'tunnel') {                          // Tunnel (Block 136): Strecke unter einem Hügel
    block(1, '#96d56f');
    drawTunnelIcon(cx, cy, z * 0.9);
  } else if (type === 'dach') {                            // Überdachung (Block 138): ein Feld Weg mit Dach und vier Stützen
    block(1, '#96d56f');
    drawPath(cx, cy, z, 1e6, 1e6, { style: 'm:platten:sand', wide: true });
    drawRoofIcon(cx, cy, z * 0.95, (tile && tile.form) || 0, (tile && tile.col) || 0);
  } else if (EDGE_TOOLS.has(type)) {                       // Hecke, Zaun, Mauer: zwei Kanten über Eck im aktuellen Stil
    block(1, '#96d56f');
    EDGE_PROJ = (u, v) => ({ x: cx + (u - v) * TW / 2 * z, y: cy + (u + v) * TH / 2 * z });
    // eigene Mini-Welt: nur die zwei Stücke, keine Felder – sonst fragt die Zeichnung die echte Insel um Feld 0,0 nach
    // Nachbarn, Wegen und Toren, und die Vorschau kommt verbogen, halb oder als Tor heraus (Nutzer: „Vorschau broken“)
    // sq: spitze Ecke wie die Vorschau immer aussah
    const e = { b: type, style: (tile && tile.style) || currentStyle(type), sq: true }, keep = [state.edges, state.tiles, state.decos];
    state.edges = new Map([['b0,0', e], ['a0,0', e]]); state.tiles = new Map(); state.decos = new Map();
    try { for (const k of ['b0,0', 'a0,0']) drawEdge(k, e, z * 1.3, 0); } finally { EDGE_PROJ = null; [state.edges, state.tiles, state.decos] = keep; }
  } else {
    const wet = ['meer', 'offshore', 'boot'].includes((ITEMS[type] || {}).needs);        // steht im Wasser: Wasser als Untergrund
    const ground = wet ? '#74d0e6' : { stein: '#aabb94', holz: '#7fc460', obst: '#86c35b', mine: '#b0a287', kristallmine: '#b3c2cc' }[type] || '#96d56f';
    block(1, ground);
    // Parkbahn-Station: die Form ist der Zug – mit 1e6 malt die Station ihn am Bahnsteig (wie in der Zugwahl; sonst sahen
    // Bimmelbahn, Straßenbahn und Mini-Zug in der Kunstakademie gleich aus, Nutzer 09.10.2026)
    const far = type === 'pb_station' ? 1e6 : null;
    drawObject(type, cx, cy, z, 0, far || 3, far || 7, lvl, tile);
  }
  g = prev;
  return c;
}

// Schnellzugriff: die Werkzeuge, die man ständig braucht, ohne Umweg über die Kategorien (Tasten A, W, V, E)
const QUICK = [['look', '👆', 'Ansehen (A)'], ['weg', '🛤️', 'Weg (W)'], ['verschieben', '✋', 'Verschieben (V)'], ['abriss', '🧹', 'Abreißen (E)']];
// Zuletzt gebaut (Block 120): die letzten RECENT_MAX Dinge, je Gerät gemerkt; 🕘 neben der Suche zeigt sie in der Leiste
// (Form, Farbe, Stil gelten wie zuletzt gewählt). Was ohnehin einen Schnellknopf hat, zählt nicht.
const RECENT_MAX = 8, RECENT_KEY = 'kachelhausen_recent';
let recentOpen = false;
function recentList() {
  try { const l = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(l) ? l.filter(id => typeof id === 'string' && ITEMS[id] && !QUICK.some(([q]) => q === id)).slice(0, RECENT_MAX) : []; }
  catch (e) { return []; }
}
function noteRecent(id) {
  if (!ITEMS[id] || ITEMS[id].gift || QUICK.some(([q]) => q === id)) return;
  const l = [id, ...recentList().filter(x => x !== id)].slice(0, RECENT_MAX);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(l)); } catch (e) { /* privat: dann eben nicht */ }
}
// Eigene Reihenfolge der Gruppen (Nutzer, 08.10.2026, Entwurf B „Anordnen“): je Gerät gemerkt, { bereich: [gruppenIds] }.
// Unbekannte/alte IDs fallen weg, neue Gruppen (Update) hängen hinten an. Leer = Reihenfolge wie MENU.
const ORDER_KEY = 'kachelhausen_menuorder';
let arrangeMode = false;
function savedOrders() { try { const o = JSON.parse(localStorage.getItem(ORDER_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
function orderedGroups(top) {
  const grs = top.groups || [{ id: top.id, label: top.label, items: top.items }], ids = savedOrders()[top.id];
  if (!Array.isArray(ids)) return grs;
  const by = new Map(grs.map(g => [g.id, g])), seen = ids.filter(id => by.has(id));
  return [...seen.map(id => by.get(id)), ...grs.filter(g => !seen.includes(g.id))];
}
function moveGroup(topId, gid, dir) {
  const top = MENU.find(m => m.id === topId);
  if (!top || !top.groups) return;
  const ids = orderedGroups(top).map(g => g.id), i = ids.indexOf(gid), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  const o = savedOrders(); o[topId] = ids;
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch (e) { /* privat: gilt dann nur bis zum Neuladen nicht */ }
}
function resetGroupOrder(topId) {
  const o = savedOrders(); delete o[topId];
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch (e) { /* egal */ }
}
// „🏗️ Bauen“ → Symbol und Wort getrennt, damit schmale Bildschirme nur das Symbol zeigen können
function menuLabel(b, label) {
  const m = label.match(/^(\S+)\s+(.+)$/);
  if (!m || /^[A-Za-zÄÖÜäöü]/.test(label)) { b.textContent = label; return; }
  b.innerHTML = `<span class="ic">${m[1]}</span> <span class="tx">${m[2]}</span>`;
  b.setAttribute('aria-label', m[2]); b.title = m[2];
}
// Handy: Katalog (Filter + Kacheln) ist eingeklappt, bis man einen Bereich antippt
let sheetOpen = false;
function updateUndoBtn() { const b = document.querySelector('.quick.undo'); if (b) b.disabled = !undoStack.length && !moving; }
function setSheet(open) {
  sheetOpen = !!open;
  if (!sheetOpen) {                                                       // zu: auch „Zuletzt gebaut“ zu – sonst schloss der nächste 🕘-Klick nur
    arrangeMode = false;                                                  // den Merker und erst der zweite öffnete (Nutzer)
    if (recentOpen) { recentOpen = false; const r = document.querySelector('#cats .recent'); if (r) r.classList.remove('active'); }
  }
  $('toolbar').classList.toggle('open', sheetOpen);
}
document.addEventListener('pointerdown', e => {                          // daneben tippen: Feld zu – der Tipp baut nichts
  if (!sheetOpen || $('toolbar').contains(e.target) || ($('panel') && $('panel').contains(e.target)) || ($('modal') && $('modal').contains(e.target))) return;
  setSheet(false); recentOpen = false; buildToolbar();
  if (e.target && e.target.id === 'world') { e.stopPropagation(); e.preventDefault(); }
}, true);
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
  // ↶ Rückgängig (Block 45): grau, wenn es nichts zurückzunehmen gibt; Strg/⌘+Z
  const un = document.createElement('button');
  un.className = 'quick undo'; un.textContent = '↶';
  un.title = 'Rückgängig (Strg/⌘+Z)'; un.setAttribute('aria-label', 'Rückgängig');
  un.onclick = () => { audio(); undo(); };
  cats.append(un); updateUndoBtn();
  const sep = document.createElement('span'); sep.className = 'quick-sep'; cats.append(sep);
  const rec = document.createElement('button');                        // 🕘 zuletzt gebaut (Block 120)
  rec.className = 'quick recent' + (recentOpen ? ' active' : '');
  rec.textContent = '🕘'; rec.title = 'Zuletzt gebaut'; rec.setAttribute('aria-label', 'Zuletzt gebaut');
  rec.onclick = () => { audio(); recentOpen = !recentOpen; setSheet(recentOpen); buildToolbar(); };
  cats.append(rec);
  // Bereiche (Stadt · Herstellen · Freizeit · Gestalten); ein Werkzeug aus einem anderen Bereich
  // wird weggelegt. Jeder Bereich merkt sich seinen Filter (subOf), ein unbekannter Filter wird zum ersten des Bereichs.
  // Bereiche (Nutzer, 08.10.2026, Entwurf B): ein Tipp klappt darüber ein Feld mit ALLEM aus dem Bereich auf (Gruppen als
  // Überschriften); nochmal, daneben tippen, Esc oder eine Wahl klappt es zu. Das gewählte Werkzeug bleibt dabei.
  const top = MENU.find(m => m.id === menuTop) || MENU[0];
  if (top.groups ? !top.groups.some(g => g.id === menuSub) : menuSub !== 'alle') menuSub = firstSub(top.id);
  for (const m of MENU) {
    const b = document.createElement('button');
    b.className = 'cat' + (sheetOpen && m.id === menuTop && !recentOpen ? ' active' : '') + (menuHas(m, baseOf(tool)) ? ' has-tool' : '');
    b.dataset.menu = m.id;
    menuLabel(b, m.label);
    b.setAttribute('aria-expanded', String(sheetOpen && m.id === menuTop && !recentOpen));
    b.onclick = () => { audio(); const same = sheetOpen && menuTop === m.id && !recentOpen; recentOpen = false; menuTop = m.id; menuSub = firstSub(m.id); setSheet(!same); buildToolbar(); };
    cats.append(b);
  }
  // Über den Kacheln nur bei „Zuletzt gebaut“ ein Schild (die Suche ist weg, Nutzer 08.10.2026: „nutzt eh nie einer“)
  const subs = $('subcats');
  subs.innerHTML = '';
  if (recentOpen) {                                                       // Zuletzt gebaut: nur ein Schild statt Filter
    subs.hidden = false;
    const l = document.createElement('span'); l.className = 'sub active recent-label';
    l.textContent = recentList().length ? '🕘 Zuletzt gebaut' : '🕘 Noch nichts – was du baust, steht dann hier';
    subs.append(l);
  } else subs.hidden = true;                                              // Gruppen stehen als Überschriften im Feld
  renderTools();
  setTool(tool);
}
// Kacheln: nur Bild und Preis (Name beim Zeigen und im Infofenster); Freies zuerst, Gesperrtes dahinter
function renderTools() {
  hideCardName();
  const box = $('tools');
  box.innerHTML = '';
  const card = id => {
    const d = ITEMS[id], locked = !available(id);
    const b = document.createElement('button');
    b.className = 'tool' + (locked ? ' locked' : '') + (tool === id || baseOf(tool) === id ? ' active' : '');
    b.dataset.tool = id;
    b.dataset.name = d.name + (locked ? ' · 🔒 ' + unlockText(d, true) : '');
    b.setAttribute('aria-label', d.name);
    b.onpointerenter = e => { if (e.pointerType === 'mouse' && locked) showCardName(b); };   // Name steht drunter – nur bei Gesperrtem, warum
    b.onpointerleave = hideCardName;
    b.append(id === 'abriss' ? emojiPic('🧹') : id === 'verschieben' ? emojiPic('✋') : thumb(id));
    const n = document.createElement('span'); n.className = 'nm'; n.textContent = d.name; b.append(n);   // Name unter dem Bild (Nutzer: „ich finde nichts“)
    const c = document.createElement('span'); c.className = 'cost'; c.textContent = cardPrice(id);
    b.append(c);
    if (locked) { const l = document.createElement('span'); l.className = 'lock'; l.textContent = '🔒'; b.append(l); }
    if (d.cost) b.dataset.cost = d.cost;
    if (d.mat) b.dataset.mat = JSON.stringify(d.mat);
    b.onclick = () => pickCard(id);
    return b;
  };
  const freeFirst = ids => [...ids.filter(available), ...ids.filter(id => !available(id))];
  if (recentOpen) {
    for (const id of menuList()) box.append(card(id));
    return;
  }
  const top = MENU.find(m => m.id === menuTop) || MENU[0];
  const grs = orderedGroups(top);
  if (arrangeMode && top.groups) { renderArrange(box, top, grs); return; }
  const ready = gr => gr.items.some(available);                           // Gruppen ganz ohne Freies ans Ende (Reihenfolge sonst eigene bzw. MENU)
  let first = true;
  for (const gr of [...grs.filter(ready), ...grs.filter(gr => !ready(gr))]) {   // alle Gruppen untereinander, Überschrift je Gruppe
    const h = document.createElement('div'); h.className = 'sheet-h'; h.dataset.group = gr.id || top.id; menuLabel(h, gr.label); box.append(h);
    if (first && top.groups && top.groups.length > 1) {                   // ⇅ Anordnen: rechts in der ersten Überschrift
      const a = document.createElement('button'); a.className = 'arrange-btn'; a.textContent = '⇅ Anordnen';
      a.setAttribute('aria-label', 'Gruppen anordnen');
      a.onclick = () => { audio(); arrangeMode = true; renderTools(); $('sheet').scrollTop = 0; };
      h.append(a);
    }
    first = false;
    for (const id of freeFirst(gr.items)) box.append(card(id));
  }
}
// Anordnen (Entwurf B): Gruppen als Liste mit ↑/↓, dazu „Standard“ und „Fertig“
function renderArrange(box, top, grs) {
  const head = document.createElement('div'); head.className = 'sheet-h arrange-head';
  head.textContent = 'Reihenfolge – was du oft brauchst, nach oben';
  box.append(head);
  grs.forEach((gr, i) => {
    const r = document.createElement('div'); r.className = 'arrange-row'; r.dataset.group = gr.id;
    const l = document.createElement('span'); l.className = 'arrange-l'; l.textContent = gr.label;
    const up = document.createElement('button'); up.className = 'arrange-mv'; up.textContent = '↑'; up.disabled = i === 0;
    up.setAttribute('aria-label', `${gr.label} nach oben`);
    const dn = document.createElement('button'); dn.className = 'arrange-mv'; dn.textContent = '↓'; dn.disabled = i === grs.length - 1;
    dn.setAttribute('aria-label', `${gr.label} nach unten`);
    up.onclick = () => { audio(); moveGroup(top.id, gr.id, -1); renderTools(); };
    dn.onclick = () => { audio(); moveGroup(top.id, gr.id, 1); renderTools(); };
    r.append(l, up, dn); box.append(r);
  });
  const foot = document.createElement('div'); foot.className = 'arrange-foot';
  const std = document.createElement('button'); std.className = 'btn ghost'; std.textContent = 'Standard';
  std.onclick = () => { audio(); resetGroupOrder(top.id); renderTools(); };
  const ok = document.createElement('button'); ok.className = 'btn'; ok.textContent = 'Fertig';
  ok.onclick = () => { audio(); arrangeMode = false; renderTools(); };
  foot.append(std, ok); box.append(foot);
}
// Maus über einer Kachel: Name sofort als Schild darüber (die Leiste scrollt – ein Schild in der Kachel würde abgeschnitten)
function showCardName(b) {
  const el = $('card-name');
  el.textContent = b.dataset.name;
  el.hidden = false;
  const r = b.getBoundingClientRect(), w = el.offsetWidth;
  el.style.left = Math.max(6, Math.min(window.innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
  el.style.top = (r.top - el.offsetHeight - 8) + 'px';
}
function hideCardName() { $('card-name').hidden = true; }
const subOf = {};
// Was die Leiste gerade zeigt (auch für die Zahlentasten): Freigeschaltetes zuerst, Reihenfolge sonst wie im Menü
const menuHas = (m, id) => (m.groups ? m.groups.flatMap(g => g.items) : m.items).includes(id);   // Bereich mit dem gewählten Werkzeug (Punkt)
const menuList = () => { if (recentOpen) return recentList(); const top = MENU.find(m => m.id === menuTop) || MENU[0];
  const all = orderedGroups(top).flatMap(g => g.items); return [...all.filter(available), ...all.filter(id => !available(id))]; };   // zuletzt gebaut: neuestes zuerst
const emojiPic = e => { const s = document.createElement('span'); s.className = 'emoji'; s.textContent = e; return s; };
// Preis auf der Kachel: kurz (ab 10.000 „12 Tsd.“, ab 1 Mio. „1,2 Mio.“) – den genauen Preis zeigt das Infofenster
const nfShort = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
function shortMoney(n) { return n < 1e4 ? nf.format(n) : n < 1e6 ? `${nfShort.format(Math.floor(n / 100) / 10)} Tsd.` : `${nfShort.format(Math.floor(n / 1e5) / 10)} Mio.`; }
// Dauer in Sekunden → „45 Min.“ / „2 Std. 10 Min.“ (Block 63)
const fmtDuration = sec => { const m = Math.max(1, Math.round(sec / 60)); return m < 60 ? `${m} Min.` : `${Math.floor(m / 60)} Std.${m % 60 ? ` ${m % 60} Min.` : ''}`; };
// Wunder: der ganze Preis (Baustelle + Abschnitte), nicht nur die Baustelle (Block 61)
const cardPrice = id => id === 'abriss' || id === 'verschieben' ? '' : WONDERS[id] ? '🪙 ' + shortMoney(wonderTotal(id)) : ITEMS[id].cost ? '🪙 ' + shortMoney(ITEMS[id].cost) : 'gratis';
// Kachel antippen: auswählen (nochmal: weglegen); iPad/Mac zeigen dazu rechts das Infofenster, das Handy ein ⓘ im Hinweis
const sizeChoice = {};                 // Grundmodell → zuletzt gewählte Größe (Block 43)
function pickCard(id) {
  audio(); setSheet(false);
  const next = baseOf(tool) === id ? 'look' : sizeChoice[id] || id;
  setTool(next);
  if (next !== 'look' && !PHONE) openBuildInfo(next);
}

// 👆 wird ✕ (Weglegen), solange etwas in der Hand ist – auf dem Handy gab es sonst keinen Weg, es loszulassen (Nutzer, 08.10.2026)
function syncDropBtn() {
  const b = document.querySelector('.quick[data-quick="look"]');
  if (!b) return;
  const hold = tool !== 'look', label = hold ? 'Weglegen (Esc)' : 'Ansehen (A)';
  b.classList.toggle('drop', hold);
  b.textContent = hold ? '✕' : '👆';
  b.title = label; b.setAttribute('aria-label', label);
}
function setTool(t) {
  if (t !== 'look' && typeof viewOnly === 'function' && viewOnly()) { cloudBlocked(); t = 'look'; }   // zuschauen/Besuch: nichts bauen (Block 94/95)
  if (t !== 'verschieben' && moving) cancelMove();
  if (t !== tool) plan = null;                  // nur beim Wechsel: die Leiste baut sich auch so neu auf (Freischaltung)
  if (t !== tool || t === 'look') rotManual = false;   // selbst gedreht: gilt bis zum Werkzeugwechsel (Block 84b)
  tool = t;
  previewCache = null;
  if (buildInfo ? buildInfo !== t : t !== 'look') closePanel();     // Bau-Infofenster bleibt, solange sein Ding gewählt ist
  for (const b of document.querySelectorAll('.tool')) b.classList.toggle('active', b.dataset.tool === baseOf(t));   // auch bei einer anderen Größe
  for (const b of document.querySelectorAll('.quick')) b.classList.toggle('active', b.dataset.quick === t);
  syncDropBtn();
  $('rot-btn').hidden = !ROTATABLE.has(t);
  renderStyleBar(t);
  updateHint();
}
// Hinweis über der Leiste: auf dem Handy nur Name, Preis und wie man baut (sonst verdeckt er die halbe Karte) und ein ⓘ
// fürs Infofenster; am iPad/Mac ohne Infofenster ausführlich, mit Infofenster nur, wie man baut
// Auswahl mit ✋ (Block 134): Leiste „↔ Verschieben“ / „⧉ Kopieren · Preis“ (bzw. Pipette) / „✕“ – erscheint von selbst, solange
// eine Auswahl feststeht; render ruft das je Bild (nur bei Änderung neu)
let selBarKey = null;
function syncSelBar() {
  const bar = $('sel-bar');
  if (!bar) return;
  const on = !!(plan && plan.tool === 'verschieben' && plan.fixed && !moving);
  if (!on) { if (!bar.hidden) { bar.hidden = true; selBarKey = null; bar.dataset.html = ''; } return; }
  const box = planBox(plan), key = box.join() + '|' + groundVersion;
  if (key === selBarKey && !bar.hidden) return;
  selBarKey = key;
  const { items, stays } = copyCollect(...box), pip = copyPipette(items), cost = copyCost(items);
  const copyLabel = !items.length ? '⧉ Kopieren' : pip ? `🖌️ Pipette: ${ITEMS[pip.tool].name}` : `⧉ Kopieren · 🪙 ${fmt(cost.money)}${matText(Object.fromEntries(Object.entries(cost).filter(([r]) => r !== 'money'))) ? ' ' + matText(Object.fromEntries(Object.entries(cost).filter(([r]) => r !== 'money'))) : ''}`;
  const html = `<button class="btn" id="sel-move">↔ Verschieben</button><button class="btn" id="sel-copy" ${items.length ? '' : 'disabled'} title="${stays ? 'Rathaus, Sehenswürdigkeiten und Wunderwerke werden nicht mitkopiert' : ''}">${copyLabel}</button><button class="btn ghost" id="sel-x" aria-label="Auswahl aufheben">✕</button>`;
  bar.hidden = false;
  if (bar.dataset.html === html) return;                                  // gleich geblieben: Knöpfe nicht austauschen (ein Klick ginge sonst ins Leere)
  bar.dataset.html = html; bar.innerHTML = html;
  $('sel-move').onclick = () => { const b = planBox(plan); plan = null; undoable(() => pickUpGroup(...b)); syncSelBar(); };
  $('sel-copy').onclick = () => { const b = planBox(plan); plan = null; startCopy(...b); syncSelBar(); };
  $('sel-x').onclick = () => { plan = null; syncSelBar(); };
}
function updateHint() {
  const hint = $('hint'), t = tool;
  // PC/iPad: keine Zeile beim Wählen (Nutzer: „unnötig, was da steht“) – Name, Preis und Beschreibung stehen im Infofenster.
  // Handy: kurze Zeile mit Preis und ⓘ, weil das Infofenster dort nur über ⓘ aufgeht
  if (t === 'look' || t === 'verschieben' || t === 'abriss' || !PHONE) { hint.hidden = true; return; }
  const d = ITEMS[t];
  const how = LINE_TOOLS.has(t) ? 'Anfang und Ende antippen' : dragKind(t) === 'rect' ? 'antippen oder Fläche aufziehen' : 'Platz antippen, nochmal tippen baut';
  hint.textContent = `${d.name}${WONDERS[t] ? ' · 🪙 ' + fmt(wonderTotal(t)) + ' in ' + WONDERS[t].phases.length + ' Abschnitten' : d.cost ? ' · 🪙 ' + fmt(d.cost) : ''}${d.mat ? ' ' + matText(d.mat) : ''} · ${how}`;
  const i = document.createElement('button');
  i.className = 'hint-info'; i.textContent = 'ⓘ'; i.setAttribute('aria-label', `Mehr über ${d.name}`);
  i.onclick = () => { audio(); openBuildInfo(t); };
  hint.append(' ', i);
  hint.hidden = false;
}

// Bau-Infofenster (Block 36): alles Wichtige zu einem Ding aus der Leiste – an derselben Stelle wie das Infofenster
// gebauter Gebäude. Bleibt offen, solange das Ding gewählt ist (setTool), und aktualisiert sich live (Preis rot/grün).
let buildInfo = null;
function openBuildInfo(id) {
  const d = ITEMS[id];
  if (!d) return;
  const locked = !available(id), tip = ITEM_TIPS[id] || ITEM_TIPS[baseOf(id)], fx = effectText(id);
  const ud = ITEMS[baseOf(id)] || d, go = locked ? unlockGo(ud) : null;                 // Größen: wie das Grundmodell
  const cost = [d.cost ? `<span${state.money < d.cost ? ' class="bad"' : ''}>🪙 ${fmt(d.cost)}</span>` : '<span>kostenlos</span>',
    ...Object.entries(d.mat || {}).map(([r, n]) => `<span${state.res[r] < n ? ' class="bad"' : ''} ${helpAttr('res:' + r)}>${RES[r].icon} ${fmt(n)} ${RES[r].name}</span>`)];   // antippen: woher (Block 92)
  const [w, h] = d.small || id === 'abriss' || id === 'verschieben' ? [1, 1] : sizeOf(id, 0);
  const built = d.small ? 0 : [...state.tiles.values()].filter(t => t.b === id).length;
  const facts = [w * h > 1 ? `📐 ${w}×${h} Felder` : '', d.workers ? `👷 ${d.workers} Mitarbeiter` : '', SHOPS[id] ? `🛒 bedient bis ${fmt(shopCap(id))} Kunden` : '',
    d.beauty && id !== 'weg' ? `🌸 +${d.beauty}` : '', d.ugly ? `🌸 −${d.ugly} neben Häusern` : '',
    CONSUMERS[id] ? `⚡ braucht ${CONSUMERS[id]}` : '', built ? `🏗️ ${built} gebaut` : ''].filter(Boolean);
  showPanel(`
    <h3>${d.name}</h3>
    ${locked ? `<div class="status"><div class="bad">🔒 Freischalten: ${unlockText(ud)}</div></div>${go ? `<div class="row"><button class="btn" id="p-unlock">${go.label}</button></div>` : ''}` : ''}
    ${fx ? `<p class="big">${fx}</p>` : ''}
    <div class="stats">${cost.join('')}</div>
    ${WONDERS[id] ? `<p class="muted">Das ist nur die Baustelle. Dann ${WONDERS[id].phases.length} Bauabschnitte – zusammen ca. 🪙 ${fmt(wonderTotal(id))} und Material – bei deinem Einkommen etwa ${fmtDuration(wonderTotal(id) / Math.max(1, wonderRate()))}. Mehr Einkommen macht es schneller.</p>` : ''}
    <p class="muted">${d.desc}</p>
    ${tip && tip !== d.desc ? `<p class="muted">💡 ${tip}</p>` : ''}
    ${facts.length ? `<div class="stats">${facts.map(f => `<span>${f}</span>`).join('')}</div>` : ''}
    <div class="row"><button class="btn ghost" id="p-close">Schließen</button></div>`, () => tool === id ? openBuildInfo(id) : closePanel(), id);
  if ($('p-unlock')) $('p-unlock').onclick = () => go.go();
  $('p-close').onclick = closePanel;
}
// Gesperrt (Block 49): Knopf, der dorthin springt, wo man es freischaltet – dieselbe Reihenfolge wie unlockText.
// Laternen, Erfolgs-Sterne, Laternenfest und Botanischer Garten haben kein eigenes Fenster: dort nur der Text.
function unlockGo(def) {
  if (def.lm) {
    const [type, n] = def.lm.split(':');
    if (lmStage(type) < +n) {
      const e = [...state.tiles].find(([, t]) => t.b === 'lm' && t.lm === type);
      return e && { label: `${LANDMARKS[type].icon} Zur Sehenswürdigkeit`, go: () => {
        const [x, y] = keyXY(e[0]), c = iso(x + 1, y + 1);
        closePanel(); setTool('look'); cam.x = c.x; cam.y = c.y; openLandmark(x, y);
      } };
    }
  }
  if (def.design) return { label: '🎨 Zur Kunstakademie', go: () => showUnlock('design', `[data-design="${DESIGN.find(x => x.item && ITEMS[x.item] === def)?.id}"]`) };
  if (def.lanterns && lanternCount() < def.lanterns) return null;
  if (def.tech && !hasTech(def.tech)) return { label: '💡 Zur Forschung', go: () => showUnlock('wissen', `[data-techid="${def.tech}"]`) };
  if ((def.rank && starCount() < def.rank) || (def.festival && !state.festival) || (def.garden && !wonderOn(def.garden))) return null;
  if (def.album && !albumDone(def.album, def.albumN)) return { label: '📒 Zum Album', go: () => { closePanel(); openAlbum(); spotlight(`[data-apage="${def.album}"]`); } };
  if (def.invention && !hasInvention(def.invention)) return { label: '💡 Zu den Erfindungen', go: () => showUnlock('erfindung', `[data-invent="${def.invention}"]`) };
  return null;
}
function showUnlock(tab, sel) { closePanel(); openResearch(tab); spotlight(sel); }
// Im offenen Fenster zu einem Eintrag scrollen und ihn leuchten lassen – auch nachdem sich das Fenster neu zeichnet
// (Forschung aktualisiert sich laufend), bis zum nächsten anderen Fenster
let spotSel = null;
const spotBox = () => { const el = spotSel && document.querySelector('#modal ' + spotSel); return el && (el.closest('.tech, .design, .album-page') || el); };
function spotlight(sel) {
  spotSel = sel;
  const box = spotBox();
  if (!box) return;
  if (box.scrollIntoView) box.scrollIntoView({ block: 'center' });
  box.classList.add('spot', 'spot-in');                           // spot-in: nur beim ersten Mal aufblinken
}

// Stil-Leiste für Wege: nur, was man schon hat – alles Weitere gibt es in der Kunstakademie
// Kreis mit dem echten Muster des Wegs (einmal gezeichnet, dann gemerkt); ohne Canvas nur die Farbe
const swatchCache = new Map();
// Gartenweg (Block 78) bzw. Vorplatz (Block 91): an/aus und Belag – wie der Weg vor der Tür oder ein eigener (t.vp)
function courtHtml(t, x, y) {
  const C0 = COURTS[t.b], gp = !C0 && gardenPath(t, x, y, true), ct = C0 && courtOf(t, x, y, true);
  if (!C0 && !gp) return '';
  const plaza = !!(C0 && courtPartsAt(t, x, y).some(c => !c.band)), name = gp ? 'Gartenweg zur Tür' : plaza ? 'Vorplatz' : 'Weg zur Tür';   // vor schmalem Weg: Weg (Block 127)
  if (!gp && !ct && (!C0.own || C0.bare)) return `<div class="label">${name}</div><p class="muted">Liegt ein Weg vor der Tür, führt ein Belag im Stil des Wegs bis zur Tür.</p>`;
  const on = t.zug !== false, auto = gp || ct ? 'Wie der Weg vor der Tür' : 'Wie bisher';
  return `<div class="looks"><button class="look${on ? ' on' : ''}" data-zug="1" aria-pressed="${on}">${plaza ? '🧱' : '🌿'} ${name}</button></div>
    ${on ? `<div class="label">Belag</div><div class="swatches"><button class="sw bunt${courtVp(t) ? '' : ' on'}" data-vp="" aria-label="${auto}" title="${auto}"></button><span class="muted sw-note">${courtVp(t) ? '' : auto}</span></div>${wegPickHtml(courtVp(t), 'vp', plaza)}` : ''}`;
}
// Belag-Auswahl in Fenstern (Vorplatz, Brücke, Schloss-Platz – Block 125): Muster, die man hat, darunter die Farben des gewählten.
// Jeder Knopf trägt den fertigen Belag-Namen in data-<key> – die Fenster übernehmen ihn wie früher einen alten Belag
function wegPickHtml(cur, key, noStones = false) {
  const [cm, cf] = cur ? wegParts(cur) : [null, null], M = cm && WEG_MUSTER_BY[cm];
  const colFor = m => m.fixed ? null : (cf && wegFarbeOk(cf) ? cf : m.farbe);
  const pats = WEG_MUSTER.filter(m => wegMusterOk(m.id) && !(noStones && m.id === 'tritt'));
  return `<p class="wpick-cap">Muster${M ? ': ' + escHtml(M.name) : ''}</p><div class="swatches wpick">${pats.map(m => { const id = wegStyleOf(m.id, colFor(m));
      return `<button class="sw wsq${m.id === cm ? ' on' : ''}" data-${key}="${id}" style="background:${styleSwatch(styleDef('weg', id))}" title="${m.name}" aria-label="Muster ${escHtml(m.name)}"></button>`; }).join('')}</div>`
    + (M && !M.fixed ? `<p class="wpick-cap">Farbe: ${escHtml(WEG_FARBEN_BY[cf] ? WEG_FARBEN_BY[cf].name : '')}</p><div class="swatches wpick">${WEG_FARBEN.filter(f => wegFarbeOk(f.id)).map(f =>
      `<button class="sw${f.id === cf ? ' on' : ''}" data-${key}="${wegStyleOf(cm, f.id)}" style="background:${f.c}" title="${f.name}" aria-label="Farbe ${escHtml(f.name)}"></button>`).join('')}</div>` : '');
}
function wireCourt(el, t, reopen) {
  const done = () => { groundVersion++; sfx('deco'); save(); reopen(); };
  const zb = el.querySelector('[data-zug]');
  if (zb) zb.onclick = () => undoable(() => { if (t.zug === false) delete t.zug; else t.zug = false; done(); });
  for (const b of el.querySelectorAll('[data-vp]')) b.onclick = () => undoable(() => { if (b.dataset.vp) t.vp = b.dataset.vp; else delete t.vp; done(); });
}
function styleSwatch(st) {
  if (swatchCache.has(st.id)) return swatchCache.get(st.id);
  let bg = st.col;
  try {
    const lk = (st.kind || 'weg') === 'weg' ? pathLook(st.id) : null, c = document.createElement('canvas');   // Hecken & Co.: nur Farbe (kein Wegbild)
    c.width = c.height = 48;
    const prev = g; g = c.getContext('2d');
    if (lk && lk.stones) { poly([[0, 0], [48, 0], [48, 48], [0, 48]], '#8ccb67'); for (const [u, v] of [[14, 16], [34, 18], [22, 34], [38, 38]]) { ellipse(u, v + 1, 8, 5, '#aaa498'); ellipse(u, v, 8, 5, '#dcd7cc'); } }
    else if (lk) { patNoFade = true; try { paintLook(([u, v]) => [24 + u * 48, 24 + v * 48], lk, 3, 3, 1.3, false, 0.1); } finally { patNoFade = false; } }
    g = prev;
    const url = c.toDataURL();
    if (url && url.startsWith('data:image')) bg = `${st.col} url(${url}) center / cover`;
  } catch (e) { /* ohne Canvas (Test) bleibt die Farbe */ }
  swatchCache.set(st.id, bg);
  return bg;
}
// Wege (Block 125, Wunsch Nutzer: nicht drei Zeilen): eine Zeile mit zwei Knöpfen – Muster und Farbe – und der Wegform; Antippen
// öffnet darüber ein kleines Raster (wegPop), eine Wahl klappt es wieder zu. Die Wahl ergibt einen Belag-Namen (wegStyleOf)
let wegPop = null;
const WEG_SHAPES = [['wide', '▭', '▬', 'schmal', 'ganz breit'], ['sq', '⌒', '⌐', 'Kurve rund', 'Kurve eckig']];   // Wegform (Block 77)
const shapeChip = ([k, i0, i1, n0, n1]) => `<button class="style-chip size-chip shape-chip${wegShape[k] ? ' on' : ''}" data-wegopt="${k}" aria-pressed="${wegShape[k]}" title="${wegShape[k] ? n1 : n0} – tippen zum Wechseln" aria-label="${wegShape[k] ? n1 : n0}"><i>${wegShape[k] ? i1 : i0}</i><span>${wegShape[k] ? n1 : n0}</span></button>`;
function wegStyleBar(bar) {
  const [cm, cf] = wegParts(currentStyle('weg')), M = WEG_MUSTER_BY[cm], F = WEG_FARBEN_BY[cf];
  const colFor = m => m.fixed ? null : (cf && wegFarbeOk(cf) ? cf : m.farbe);
  const pats = WEG_MUSTER.filter(m => wegMusterOk(m.id)), more = WEG_MUSTER.length - pats.length;
  const sw = id => styleSwatch(styleDef('weg', id));
  const pop = wegPop === 'muster' ? `<div class="wpop" role="listbox" aria-label="Muster">${pats.map(m => { const id = wegStyleOf(m.id, colFor(m));
        return `<button class="wopt${m.id === cm ? ' on' : ''}" data-wm="${m.id}" role="option" aria-selected="${m.id === cm}"><i style="background:${sw(id)}"></i><small>${m.name}</small></button>`; }).join('')}
      ${more ? `<button class="wopt more" data-more="1"><i>🎨</i><small>+${more} in der Kunstakademie</small></button>` : ''}</div>`
    : wegPop === 'farbe' && M && !M.fixed ? `<div class="wpop wpop-cols" role="listbox" aria-label="Farbe">${WEG_FARBEN.filter(f => wegFarbeOk(f.id)).map(f =>
        `<button class="wopt${f.id === cf ? ' on' : ''}" data-wf="${f.id}" role="option" aria-selected="${f.id === cf}"><i style="background:${f.c}"></i><small>${f.name}</small></button>`).join('')}</div>` : '';
  bar.innerHTML = pop
    + `<button class="style-chip on wsel${wegPop === 'muster' ? ' open' : ''}" data-wpop="muster" aria-expanded="${wegPop === 'muster'}" aria-label="Muster: ${M ? M.name : ''} – ändern"><i style="background:${sw(currentStyle('weg'))}"></i><span>${M ? M.name : ''} ▾</span></button>`
    + `<button class="style-chip on wsel${wegPop === 'farbe' ? ' open' : ''}" data-wpop="farbe" ${M && M.fixed ? 'disabled title="Dieses Muster hat eigene Farben"' : ''} aria-expanded="${wegPop === 'farbe'}" aria-label="Farbe: ${M && M.fixed ? 'eigene' : F ? F.name : ''} – ändern"><i style="background:${M && M.fixed ? sw(currentStyle('weg')) : F ? F.c : '#ccc'}"></i><span>${M && M.fixed ? 'eigene Farben' : F ? F.name + ' ▾' : ''}</span></button>`
    + `<span class="style-sep"></span>${WEG_SHAPES.map(shapeChip).join('')}`;
  for (const b of bar.querySelectorAll('[data-wpop]')) b.onclick = () => { wegPop = wegPop === b.dataset.wpop ? null : b.dataset.wpop; sfx('deco'); renderStyleBar('weg'); };
  for (const b of bar.querySelectorAll('[data-wm]')) b.onclick = () => { const m = WEG_MUSTER_BY[b.dataset.wm]; chosenStyle.weg = wegStyleOf(m.id, colFor(m)); wegPop = null; sfx('deco'); renderStyleBar('weg'); };
  for (const b of bar.querySelectorAll('[data-wf]')) b.onclick = () => { chosenStyle.weg = wegStyleOf(cm, b.dataset.wf); wegPop = null; sfx('deco'); renderStyleBar('weg'); };
  // Wegform: nur diesen Knopf ändern – die offene Auswahl bleibt offen und unverändert (vorher baute sich alles neu auf und sprang)
  const wireShape = b => { b.onclick = () => { const k = b.dataset.wegopt; wegShape[k] = !wegShape[k]; previewCache = null; sfx('deco');
    const tmp = document.createElement('div'); tmp.innerHTML = shapeChip(WEG_SHAPES.find(x => x[0] === k)); const nb = tmp.firstElementChild; b.replaceWith(nb); wireShape(nb); }; };
  for (const b of bar.querySelectorAll('[data-wegopt]')) wireShape(b);
  if (bar.querySelector('[data-more]')) bar.querySelector('[data-more]').onclick = () => { wegPop = null; openResearch('design'); };
  bar.hidden = false;
}
// Auswahl zuklappen, wenn man daneben tippt (z. B. auf die Insel, um zu bauen)
document.addEventListener('pointerdown', e => {
  if (!wegPop || ($('style-bar') && $('style-bar').contains(e.target))) return;
  wegPop = null; if (tool === 'weg') renderStyleBar('weg');
}, true);
// Stil-Leiste: nur Kreise mit Muster; der gewählte wird größer und zeigt seinen Namen
// Farbchips in der Musterleiste (Block 89): gewählte Farbe gilt für neu Gebautes (state.paintNew[key])
function bushChips(key) {
  const cur = (state.paintNew[key] && state.paintNew[key].col) || 0;
  return '<span class="style-sep"></span>' + BUSH_COLS.map((c, i) => [c, i]).filter(([, i]) => bushColOk(i)).map(([c, i]) =>
    `<button class="style-chip${i === cur ? ' on' : ''}" data-bchip="${i}" title="${c.name}" aria-label="Farbe: ${c.name}"><i style="background:${c.c[0]}"></i><span>${c.name}</span></button>`).join('');
}
function wireBushChips(bar, key, t) {
  for (const b of bar.querySelectorAll('[data-bchip]')) b.onclick = () => { state.paintNew[key] = { col: +b.dataset.bchip }; previewCache = null; sfx('deco'); save(); renderStyleBar(t); };
}
// Hecke, Zaun, Mauer (Nutzer, 09.10.2026: „komplett unübersichtlich – dasselbe Aufklappmenü wie bei allem anderen“): ein Knopf
// für die Form, bei der Hecke einer für die Farbe; die Auswahl klappt als Raster darüber auf (wie Weg und Beete)
let edgePop = null;
const EDGE_GROUP = { hecke: 'Hecken', zaun: 'Zäune', mauer: 'Mauern' };
function edgeStyleBar(bar, t) {
  const cur = currentStyle(t), st = styleDef(t, cur), have = STYLES[t].filter(styleOk), more = STYLES[t].length - have.length;
  const hecke = t === 'hecke', col = (state.paintNew.hecke && state.paintNew.hecke.col) || 0, cols = BUSH_COLS.map((c, i) => [c, i]).filter(([, i]) => bushColOk(i));
  const moreC = BUSH_COLS.length - cols.length, artBtn = (n, k) => n ? `<button class="wopt more" data-emore="${k}"><i>🎨</i><small>+${n} in der Kunstakademie</small></button>` : '';
  const pop = edgePop === 'form' ? `<div class="wpop" role="listbox" aria-label="Form">${have.map(s => `<button class="wopt${s.id === cur ? ' on' : ''}" data-style="${s.id}" role="option" aria-selected="${s.id === cur}"><i style="background:${edgeStyleBg(t, s)}"></i><small>${s.name}</small></button>`).join('')}${artBtn(more, 'form')}</div>`
    : edgePop === 'col' && hecke ? `<div class="wpop wpop-cols" role="listbox" aria-label="Farbe">${cols.map(([c, i]) => `<button class="wopt${i === col ? ' on' : ''}" data-bchip="${i}" role="option" aria-selected="${i === col}"><i style="background:${c.c[0]}"></i><small>${c.name}</small></button>`).join('')}${artBtn(moreC, 'col')}</div>` : '';
  const C0 = BUSH_COLS[col] || BUSH_COLS[0];
  bar.innerHTML = pop
    + `<button class="style-chip on wsel${edgePop === 'form' ? ' open' : ''}" data-epop="form" aria-expanded="${edgePop === 'form'}" aria-label="Form: ${st.name} – ändern"><i style="background:${edgeStyleBg(t, st)}"></i><span>${st.name} ▾</span></button>`
    + (hecke ? `<button class="style-chip on wsel${edgePop === 'col' ? ' open' : ''}" data-epop="col" aria-expanded="${edgePop === 'col'}" aria-label="Farbe: ${C0.name} – ändern"><i style="background:${C0.c[0]}"></i><span>${C0.name} ▾</span></button>` : '')
    + `<span class="style-sep"></span><button class="style-chip size-chip shape-chip${edgeShape.sq ? ' on' : ''}" data-esq="1" aria-pressed="${edgeShape.sq}" title="${edgeShape.sq ? 'Ecke eckig' : 'Ecke rund'} – tippen zum Wechseln" aria-label="${edgeShape.sq ? 'Ecke eckig' : 'Ecke rund'}"><i>${edgeShape.sq ? '⌐' : '⌒'}</i><span>${edgeShape.sq ? 'Ecke eckig' : 'Ecke rund'}</span></button>`;
  for (const b of bar.querySelectorAll('[data-epop]')) b.onclick = () => { edgePop = edgePop === b.dataset.epop ? null : b.dataset.epop; sfx('deco'); renderStyleBar(t); };
  for (const b of bar.querySelectorAll('[data-esq]')) b.onclick = () => { edgeShape.sq = !edgeShape.sq; edgePop = null; previewCache = null; sfx('deco'); renderStyleBar(t); };
  for (const b of bar.querySelectorAll('[data-style]')) b.onclick = () => { chosenStyle[t] = b.dataset.style; edgePop = null; previewCache = null; sfx('deco'); renderStyleBar(t); };
  for (const b of bar.querySelectorAll('[data-bchip]')) b.onclick = () => { state.paintNew.hecke = { col: +b.dataset.bchip }; edgePop = null; previewCache = null; sfx('deco'); save(); renderStyleBar(t); };
  for (const b of bar.querySelectorAll('[data-emore]')) b.onclick = () => { const k = b.dataset.emore; edgePop = null; openResearch('design'); artJump(k === 'col' ? 'Büsche' : EDGE_GROUP[t]); };
  bar.hidden = false;
}
document.addEventListener('pointerdown', e => {                          // daneben tippen: Auswahl zu
  if (!edgePop || ($('style-bar') && $('style-bar').contains(e.target))) return;
  edgePop = null; if (EDGE_TOOLS.has(tool)) renderStyleBar(tool);
}, true);
function renderStyleBar(t) {
  const bar = $('style-bar'), sizes = SIZE_ORDER[baseOf(t)];
  document.body.classList.toggle('has-styles', !!STYLES[t] || !!sizes || !!DECO_LOOKS[baseOf(t)] || t === 'station');
  if (t === 'station') {                                         // kleiner Bahnhof: 2 oder 3 Felder lang (Block 131)
    bar.innerHTML = [2, 3].map(n => `<button class="style-chip size-chip${stationNewLen === n ? ' on' : ''}" data-slen="${n}" title="${n} Felder lang" aria-label="${n} Felder lang"><i>${n}</i><span>${n} Felder${n === 3 ? ' · Tür mittig' : ''}</span></button>`).join('');
    for (const b of bar.querySelectorAll('[data-slen]')) b.onclick = () => { stationNewLen = +b.dataset.slen; previewCache = null; sfx('deco'); renderStyleBar(t); };
    bar.hidden = false;
    return;
  }
  if (sizes) {                                                   // Größen (Block 43): Klein · Mittel · Groß · Riesig
    const foot = id => ITEMS[id].small ? 'Ecke' : ITEMS[id].size ? ITEMS[id].size.join('×') : '1×1';
    const nm = k => sizeName(baseOf(t), k);
    bar.innerHTML = sizes.map(([k, id]) => `<button class="style-chip size-chip${id === t ? ' on' : ''}" data-size="${id}" title="${ITEMS[id].name}" aria-label="${nm(k)}">
      <i>${nm(k)[0]}</i><span>${nm(k)} · ${foot(id)}</span></button>`).join('');
    if (baseOf(t) === 'busch') bar.innerHTML += bushChips('busch');                     // Farbe gleich beim Bauen (Block 89)
    if (DECO_LOOKS[baseOf(t)]) bar.innerHTML += lookChips(baseOf(t));                     // Form/Farbe (Block 106)
    wireBushChips(bar, 'busch', t);
    if (DECO_LOOKS[baseOf(t)]) wireLookChips(bar, baseOf(t), t);
    for (const b of bar.querySelectorAll('[data-size]')) b.onclick = () => { const open = !!buildInfo; sizeChoice[baseOf(t)] = b.dataset.size; sfx('deco'); setTool(b.dataset.size); if (open) openBuildInfo(b.dataset.size); };
    bar.hidden = false;
    return;
  }
  if (!STYLES[t] && DECO_LOOKS[baseOf(t)]) {                               // Laterne, Bank: Form und Farbe (Block 106)
    document.body.classList.add('has-styles');
    bar.innerHTML = lookChips(baseOf(t)).replace('<span class="style-sep"></span>', '');
    wireLookChips(bar, baseOf(t), t);
    bar.hidden = false;
    return;
  }
  if (!STYLES[t]) { bar.hidden = true; return; }
  if (t === 'weg') { wegStyleBar(bar); return; }
  if (EDGE_TOOLS.has(t)) { edgeStyleBar(bar, t); return; }
  const cur = currentStyle(t), have = STYLES[t].filter(styleOk), more = STYLES[t].length - have.length;
  bar.innerHTML = have.map(st => `<button class="style-chip${st.id === cur ? ' on' : ''}" data-style="${st.id}" title="${st.name}" aria-label="${st.name}">
      <i style="background:${EDGE_TOOLS.has(t) ? edgeStyleBg(t, st) : styleSwatch(st)}"></i><span>${st.name}</span></button>`).join('')
    + (more ? `<button class="style-chip more" data-more="1" title="${more} weitere Wege in der Kunstakademie" aria-label="${more} weitere Wege freischalten">🎨<span>+${more}</span></button>` : '')
    + (t === 'weg' ? `<span class="style-sep"></span>${[['wide', '▭', '▬', 'schmal', 'ganz breit'], ['sq', '⌒', '⌐', 'Kurve rund', 'Kurve eckig']].map(([k, i0, i1, n0, n1]) =>   // Wegform (Block 77)
      `<button class="style-chip size-chip shape-chip${wegShape[k] ? ' on' : ''}" data-wegopt="${k}" aria-pressed="${wegShape[k]}" title="${wegShape[k] ? n1 : n0} – tippen zum Wechseln" aria-label="${wegShape[k] ? n1 : n0}"><i>${wegShape[k] ? i1 : i0}</i><span>${wegShape[k] ? n1 : n0}</span></button>`).join('')}` : '');
  if (t === 'hecke') { bar.innerHTML += bushChips('hecke'); wireBushChips(bar, 'hecke', t); }   // Farbe der Hecke (Block 89, alle Formen: Block 126)
  for (const b of bar.querySelectorAll('[data-style]')) b.onclick = () => { chosenStyle[t] = b.dataset.style; sfx('deco'); renderStyleBar(t); };
  for (const b of bar.querySelectorAll('[data-wegopt]')) b.onclick = () => { wegShape[b.dataset.wegopt] = !wegShape[b.dataset.wegopt]; previewCache = null; sfx('deco'); renderStyleBar(t); };
  if (bar.querySelector('[data-more]')) bar.querySelector('[data-more]').onclick = () => openResearch('design');
  bar.hidden = false;
}

const canResearch = () => TECHS.some(t => techReady(t) && state.science >= techCost(t));

let goalSmall = null, unlockSig = '';        // null: von selbst – auf dem Handy klein, sonst groß
// Leiste oben: nur Rathaus, Geld, Einwohner, Ideen, Lager und Menü. Raten und Arbeitsplätze erst beim Antippen
// (hudMore, ein paar Sekunden), Rohstoffe, Schönheit und Strom im Lager (📦).
let hudMoreUntil = 0;
const hudMore = () => { hudMoreUntil = Date.now() + 5000; updateHud(); };
// Nur schreiben, was sich geändert hat (Block 52): Safari auf dem iPad schluckt sonst den ersten Tipp auf einen Knopf,
// in dem sich gerade etwas tut (die Leiste frischt alle 0,2 s auf)
const setText = (el, v) => { if (el.textContent !== v) el.textContent = v; };
const fmtMul = m => String(Math.round(m * 100) / 100).replace('.', ',');   // ×3,9 statt ×3.9000000000000004 (Block 84c)
function updateHud() {
  setText($('money'), fmtMoney(state.money));
  const bi = boostMul('inc'), bs = boostMul('sci');                        // Jahrmarkt, Erlass: gerade mehr
  setText($('rate'), '+' + fmtWhole(T.inc * bi + saleRate) + '/s' + (bi > 1 ? ` ×${fmtMul(bi)}` : ''));
  setText($('pop'), fmt(T.pop));
  setText($('jobs'), `💼 ${fmt(T.jobs)}`);                        // Arbeitsplätze
  $('pop-btn').classList.toggle('warn', T.jobs > T.pop);
  setText($('sci'), fmtMoney(state.science));                    // glatt wie das Geld (vorher „1,2 Mio.“)
  setText($('sci-rate'), T.sci > 0 ? '+' + fmtWhole(T.sci * bs) + '/s' + (bs > 1 ? ` ×${fmtMul(bs)}` : '') : '');
  if ($('sci-dot').hidden !== !canResearch()) $('sci-dot').hidden = !canResearch();
  $('hud').classList.toggle('more', Date.now() < hudMoreUntil);
  if (!$('store').hidden) setHtml($('store'), storeHtml(), true);
  setText($('town-name'), state.town.name);
  if ($('diary-dot').hidden !== !youNews()) $('diary-dot').hidden = !youNews();          // Knopf „Du“ (Block 98): neue Tagebuchseite
  netDotShow();                                                                          // Knopf „Online“: wie viel Neues (Block 106/111)
  setText($('you-face'), ANIMALS[meLook().a].icon);
  const tod = timeOfDay();                                              // Spieluhr (Block 101): Sonne/Mond und Uhrzeit
  setText($('tod-i'), tod.icon); setText($('tod-t'), ' ' + tod.text);   // Handy: nur Sonne/Mond (CSS)
  const todLabel = `Rathaus – ${tod.text} Uhr, ${tod.name}`;
  if ($('town-btn').getAttribute('aria-label') !== todLabel) $('town-btn').setAttribute('aria-label', todLabel);   // nur bei Änderung (Safari, hudtap.test)
  const fl = $('hud-flag');
  if (fl.dataset.col !== state.town.color) { fl.dataset.col = state.town.color; fl.style.background = state.town.color; }
  setText(fl, state.town.symbol);
  const top = $('hud').getBoundingClientRect().bottom + 8;
  const goal = $('goal');
  goal.style.top = top + 'px';
  if (!$('panel').classList.contains('float')) $('panel').style.top = window.innerWidth > 600 ? top + 'px' : '';   // schmal: CSS (unten) – sonst bliebe der alte Wert (Block 84e)
  goal.classList.toggle('small', goalSmall ?? PHONE);
  setHtml(goal, goalHtml(), true);
  // Leiste unten: was inzwischen freigeschaltet ist, wird sofort bunt
  const sig = Object.keys(ITEMS).map(id => +available(id)).join('') + Object.values(STYLES).flat().map(st => +styleOk(st)).join('');
  if (sig !== unlockSig) { if (unlockSig) buildToolbar(); unlockSig = sig; }
  watchUnlocks();
  watchTips();
  refreshLive();
  costMarks();                                   // erst nach refreshLive: das Auffrischen setzt „disabled“ auf den Stand des HTML zurück
}
// Zu teuer: Kacheln rot, Knöpfe gesperrt. Gesperrt wird nur, was das HTML nicht schon selbst sperrt (data-poor merkt sich,
// dass die Sperre von hier kommt – wer genug hat, bekommt den Knopf wieder)
function costMarks() {
  for (const b of document.querySelectorAll('[data-cost]')) {
    // Preise nach Einkommen (Leuchtturm, Block 37) ziehen auf der Kachel nach
    if (b.classList.contains('tool') && ITEMS[b.dataset.tool] && (+b.dataset.cost !== ITEMS[b.dataset.tool].cost || (WONDERS[b.dataset.tool] && b.querySelector('.cost').textContent !== cardPrice(b.dataset.tool)))) {
      b.dataset.cost = ITEMS[b.dataset.tool].cost; b.querySelector('.cost').textContent = cardPrice(b.dataset.tool);
    }
    // !! wichtig: toggle(…, undefined) würde bei jedem Aufruf umschalten (der Preis blinkte)
    const poor = !!(state.money < +b.dataset.cost || (b.dataset.mat && !hasMat(JSON.parse(b.dataset.mat))));
    if (b.classList.contains('tool')) b.classList.toggle('poor', poor);
    else if (poor && !b.disabled) { b.disabled = true; b.dataset.poor = '1'; }
    else if (!poor && b.dataset.poor) { b.disabled = false; delete b.dataset.poor; }
  }
  for (const b of document.querySelectorAll('[data-sci]')) b.disabled = state.science < +b.dataset.sci;
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
  if (e.target.closest('[data-castle]')) {                       // Schloss: hinfliegen bzw. im Menü zeigen (Block 68)
    const sl = [...state.tiles].find(([, t]) => t.b === 'schloss');
    if (sl) { const [x, y] = keyXY(sl[0]); jumpTo(x, y, 7, 7); openInfo(x, y); } else tryUnlock('schloss');
    return;
  }
  const tr = e.target.closest('[data-try]');
  if (tr) { tryUnlock(tr.dataset.try); return; }
  if (e.target.closest('[data-hall]')) { setTool('look'); openTownHall(e.target.closest('[data-hall]').dataset.hall); return; }
  if (e.target.closest('[data-album]')) { openAlbum(); return; }
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
    - (soldRate[r] || 0);                                                                                          // Läden verkaufen (wirklich)
  const sold = new Set((T.sales || []).map(sl => sl.res));
  const keepBtn = r => { const k = keepOf(r); return sold.has(r) ? `<button class="keep" data-keep="${r}" title="Läden verkaufen nur, was darüber liegt – antippen zum Ändern">🔒 ${k >= KEEP_ALL ? 'alles' : fmt(k)}</button>` : '<span></span>'; };
  const rows = shown.map(r => { const m = made(r) * 60; return `<div class="store-row"><span ${helpAttr('res:' + r)}>${RES[r].icon} ${RES[r].name}</span><b>${fmt(state.res[r])}</b><small${m < 0 ? ' class="minus"' : ''}>${Math.abs(m) >= 0.5 ? (m > 0 ? '+' : '−') + fmtWhole(Math.abs(m)) + '/min' : ''}</small>${keepBtn(r)}</div>`; });
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
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].cat && !ITEMS[id].variantOf && !ITEMS[id].gift && id !== 'verschieben' && id !== 'abriss' && available(id)) out.add(id);
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
      <div class="uc-txt"><b>Neue Hausstufe: ${k.slice(6)}</b><p>Villen können jetzt weiterwachsen – mit Kristall 💎.</p>
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
// Erfolg erreicht: kurzes Band oben (kein Fenster zum Wegtippen); antippen öffnet die Erfolge (Fenster „Du“)
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
    <p class="muted tip-links"><span class="link" id="m-tipbook">Alle Tipps in der Hilfe</span> · <span class="link" id="m-notips">Keine Tipps mehr</span></p>`);
  $('modal-card').classList.add('tipcard');
  $('m-ok').onclick = closeModal;
  $('m-tipbook').onclick = openTipBook;
  $('m-notips').onclick = () => { state.tipsOff = true; save(); closeModal(); toast('Keine Tipps mehr – unter ☰ → Hilfe → Tipps wieder einschaltbar'); };
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
    else if (kind === 'natur') {                                   // Naturbeobachtungen: Fehlendes mit Hinweis, wo man sucht
      const n = NATURE_BY_ID[id], has = state.album.has(k);
      return `<div class="al-e${has ? '' : ' miss'}" title="${has ? n.name : n.hint}"><span class="emoji">${has ? n.icon : '❔'}</span><small>${has ? n.name : n.hint}</small></div>`;
    }
    else { const a = ANIMALS.find(q => q.id === id); name = a.family; pic = `<span class="emoji">${a.icon}</span>`; }
    return `<div class="al-e${state.album.has(k) ? '' : ' miss'}" title="${name}">${pic}<small>${name}</small></div>`;
  };
  openModal(`
    ${youHead('album')}
    <h3>📒 Sammelalbum · ${Math.floor(got / all.length * 100)} %</h3>
    ${typeof svShelfHtml === 'function' ? svShelfHtml() : ''}
    ${ALBUM.map(p => {
      const ks = albumKeys(p), n = ks.filter(k => state.album.has(k)).length, done = n === ks.length;
      return `<div class="album-page${done ? ' done' : ''}" data-apage="${p.id}"><div class="label">${p.icon} ${p.name} · ${n}/${ks.length}</div>
        <div class="al-grid">${ks.map(entry).join('')}</div>
        ${p.tiers ? `<p class="al-reward">🎁 ${p.tiers.map(b => `${n >= ITEMS[b].albumN ? '✓' : ITEMS[b].albumN + ':'} <b>${ITEMS[b].name}</b>`).join(' · ')}</p>`
          : `<p class="al-reward">${done ? '✓' : '🎁'} Belohnung: <b>${rewardName(p.reward)}</b>${done ? ' – freigeschaltet!' : ''}</p>`}
        ${p.id === 'natur' ? '<p class="muted">Tipp Tiere an, die du auf deiner Insel entdeckst.</p>' : ''}</div>`;
    }).join('')}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('modal-card').classList.add('album');
  for (const el of document.querySelectorAll('#modal-card [data-thumb]')) el.append(thumb(el.dataset.thumb));
  for (const el of document.querySelectorAll('#modal-card [data-hthumb]')) el.append(thumb('haus', +el.dataset.hthumb, { lvl: +el.dataset.hthumb, wall: 1, roof: 0 }));
  if (typeof wireSvShelf === 'function') wireSvShelf($('modal-card'));   // Souvenirs (Block 129)
  $('m-close').onclick = closeModal;
}
function openTipBook() {
  openModal(`
    ${helpTop('tipps')}
    ${GUIDE.map(g => `<details><summary>${g.icon} ${g.title}</summary><p>${g.text}</p></details>`).join('')}
    <div class="row"><button class="btn ghost" id="m-tipsonoff" style="flex:1">Tipps beim ersten Mal: ${state.tipsOff ? 'aus' : 'an'}</button></div>
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('modal-card').classList.add('tipbook');
  wireHelpTop();
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
  if (!PHONE && ITEMS[id]) openBuildInfo(id);
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
  const tpl = html instanceof HTMLTemplateElement ? html : null;
  if (!keep) { if (tpl) el.replaceChildren(tpl.content); else el.innerHTML = html; return; }
  const t = tpl || document.createElement('template');
  if (!tpl) t.innerHTML = html;
  patch(el, t.content);
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
function closePanel() { $('panel').hidden = true; $('panel').classList.remove('tall', 'build-info'); panelLive = null; if (buildInfo) { buildInfo = null; updateHint(); } }
// Handy: das Fenster ist die untere Hälfte (quer: rechte Seite); oben ein Griff – antippen oder hochwischen = ganz groß
const GRIP = '<button class="grip" aria-label="Fenster größer oder kleiner"></button>';
function showPanel(html, live = null, build = null) {
  const el = $('panel'), fresh = el.hidden;
  if (!liveNow) { el.classList.remove('float'); el.style.left = ''; }
  const was = buildInfo; buildInfo = build;                        // Bau-Infofenster (openBuildInfo) oder ein anderes
  el.classList.toggle('build-info', !!build);
  setHtml(el, (PHONE ? GRIP : '') + html); el.hidden = false;
  panelLive = live;
  if (was !== build) updateHint();
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
$('panel').addEventListener('pointerdown', e => { gripY = e.target.closest('.grip') ? e.clientY : null; gripSwiped = false; });
$('panel').addEventListener('pointercancel', () => { gripY = null; });   // Fenster scrollt: kein Wisch (Block 84e)
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
// Höhe der Leiste unten merken, damit Infozeile und Fenster immer darüber sitzen
if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--bar', $('toolbar').offsetHeight + 'px')).observe($('toolbar'));
if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--sbar', $('style-bar').offsetHeight + 'px')).observe($('style-bar'));

// Aus einem Infofenster heraus verschieben: aufnehmen und dem Finger bzw. der Maus folgen lassen
function startMove(x, y, slot = 0) {
  closePanel();
  if (moving) cancelMove();                                     // was man schon trägt, erst zurücklegen (Block 84a)
  setTool('verschieben');
  undoable(() => pickUp(x, y, slot));                           // Aufheben … Ablegen = ein Schritt zum Zurücknehmen
  hover = { x, y }; hoverSlot = Math.max(0, slot);
}
const moveBtn = '<button class="btn ghost" id="p-move" aria-label="Verschieben">✋</button>';
// Löschen im Fenster (Block 45): wie das Abriss-Werkzeug (Deko und Wege voll zurück, Gebäude zur Hälfte). Was viel kostet,
// fragt einmal nach (zweites Tippen); alles lässt sich mit ↶ zurücknehmen.
const DEL_ASK = 500;
// Rückfrage beim Löschen: außerhalb des Fensters merken – das Fenster frischt sich ständig auf und hätte sie sonst vergessen
// Märchenschloss (Block 60h): Fenster-Inhalt und Knöpfe. Reiter in castleTab (nicht im DOM – das Fenster frischt sich auf)
let castleTab = 'form';
const CS_NAMES = { m: ['keiner', 'niedrig', 'mittel', 'hoch', 'riesig'], h: ['niedrig', 'mittel', 'hoch', 'höher', 'riesig'],
  k: ['schlank', 'normal', 'dick'], mk: ['schlank', 'normal', 'dick'], p: ['vorn', 'in der Fassade', 'hinten'], cb: ['schmal', 'mittel', 'breit'],
  r: ['▲ Spitz', '🧅 Kuppel', '▙ Zinnen'], f: ['▢ eckig', '◯ rund'], wn: ['wenige', 'normal', 'viele', 'ganz viele'], gb: ['🧱 Sockel', '🌱 Rasen', '🔲 Platz'], mt: ['▣ Block', '🏰 Turmgruppe'], wr: ['▲ Satteldach', '◆ Walmdach', '▙ Zinnen'],
  fc: ['🎏 bunt', '🟥 rot', '🟦 blau', '🟨 gold', '⬜ weiß', '🟩 grün'], wp: ['keins', '👑 Krone', '❤️ Herz', '⭐ Stern'] };
CS_NAMES.cr = CS_NAMES.mr = CS_NAMES.r; CS_NAMES.mf = CS_NAMES.f;
const CT_LABEL = { k: 'Dicke', p: 'Platz', r: 'Dach', f: 'Form' };
function castleHtml(t) {
  const c = csOf(t);
  const stepRow = (label, val, minus, plus, noMinus, noPlus) => `<div class="row cs-row"><span class="cs-name">${label}</span>
    <button class="btn ghost" ${minus} aria-label="${label} weniger" ${noMinus ? 'disabled' : ''}>−</button><b class="cs-n">${val}</b>
    <button class="btn ghost" ${plus} aria-label="${label} mehr" ${noPlus ? 'disabled' : ''}>+</button></div>`;
  const step = (key, label) => stepRow(label, c[key], `data-cs="${key}:-1"`, `data-cs="${key}:+1"`, c[key] <= CS_LIM[key][0], c[key] >= CS_LIM[key][1]);
  const pick = (key, names = CS_NAMES[key]) => `<div class="looks">${names.map((n, i) => `<button class="look${i === c[key] ? ' on' : ''}" data-cs="${key}:${i}">${n}</button>`).join('')}</div>`;
  const tabs = `<div class="looks cs-tabs">${[['form', '🏰 Form'], ['tuerme', '🗼 Türme'], ['zierde', '✨ Zierde'], ['farben', '🎨 Farben']].map(([id, n]) => `<button class="look${castleTab === id ? ' on' : ''}" data-cstab="${id}">${n}</button>`).join('')}</div>`;
  const paid = t.price != null ? t.price : castlePrice(c), now = castlePrice(c);
  const worth = `<p class="muted">Bezahlt: ${fmt(paid)} Taler${paid > now ? ` – davon ${fmt(paid - now)} als Guthaben` : ''}. Umbauen bis zu diesem Wert kostet nichts, nur was darüber geht, kostet den Unterschied. Kleiner gibt kein Geld zurück – das Guthaben bleibt im Schloss.</p>`;
  if (castleTab === 'farben') return tabs;
  const toggle = (key, label) => `<button class="look${c[key] ? ' on' : ''}" data-cs="${key}:t" aria-pressed="${c[key] ? 'true' : 'false'}">${label}</button>`;
  if (castleTab === 'zierde') return `${tabs}
      <div class="label">Fahnen</div>${pick('fc')}
      <div class="label">Schmuck</div><div class="looks">${toggle('gd', '✨ Gold')}${toggle('bk', '🏯 Balkone & Erker')}${toggle('lc', '💡 Lichterketten')}${toggle('ex', '🪜 Freitreppe')}</div>
      <div class="label">Fenster</div>${pick('wn')}
      <div class="label">Wappen über dem Tor</div>${pick('wp')}
      <div class="label">Boden</div>${pick('gb')}
      ${c.gb ? `<div class="label">Belag ${c.gb === 1 ? '(Weg zum Portal)' : '(Platz)'}</div>${wegPickHtml(c.gp || 'platten', 'csgp', true)}` : ''}
      <div class="label">Umgebung</div><div class="looks">${toggle('mo', '🌊 Wassergraben')}${toggle('mw', '🧱 Mauer mit Tor')}${toggle('gn', '🌷 Garten mit Brunnen')}</div>
      <p class="muted">Graben, Mauer und Garten brauchen ein Feld rundum mehr Platz.</p>${worth}`;
  if (castleTab === 'tuerme') return `${tabs}
      <div class="label">Turmpaare (von innen nach außen)</div>
      ${c.tw.map((o, i) => `<div class="cs-tower">${stepRow(`Paar ${i + 1}`, CS_NAMES.h[o.h], `data-ct="${i}:h:-1"`, `data-ct="${i}:h:+1"`, o.h <= 0, o.h >= CT_LIM.h[1])
        .replace('</div>', `<button class="btn ghost cs-del" data-ctdel="${i}" aria-label="Paar ${i + 1} entfernen">✕</button></div>`)}
        <div class="looks">${['f', 'k', 'p', 'r'].map(f => `<button class="look cs-cycle" data-ct="${i}:${f}:n" aria-label="${CT_LABEL[f]} wechseln"><small>${CT_LABEL[f]}</small> ${CS_NAMES[f][o[f]]}</button>`).join('')}</div></div>`).join('')}
      <div class="row"><button class="btn ghost" data-ctadd="1" ${c.tw.length >= CS_TOWERS ? 'disabled' : ''}>＋ Turmpaar</button></div>
      <p class="muted">Tippe auf Form, Dicke, Platz oder Dach zum Wechseln. Wird es eng, werden die Türme schlanker.</p>${worth}`;
  return `${tabs}
      <div class="label">Vorlagen</div>
      <div class="looks">${Object.entries(CS_TPL).map(([id, v]) => `<button class="look" data-tpl="${id}">${v.name}</button>`).join('')}</div>
      <div class="label">Größe (Felder)</div>${step('w', 'Breite')}${step('d', 'Tiefe')}
      <div class="label">Mitte</div>${pick('mt')}
      <div class="label">${c.mt ? 'Torbau' : 'Mittelbau'}</div>${pick('cb')}${step('cf', 'Stockwerke')}${pick('cr')}
      <div class="label">${c.mt ? 'Hauptturm' : 'Mittelturm'}</div>${c.mt ? pick('m', CS_NAMES.m.map((n, i) => i ? n : '')).replace(/<button[^>]*data-cs="m:0"[^>]*><\/button>/, '') : pick('m')}${c.m || c.mt ? pick('mf') + pick('mk') + pick('mr') : ''}
      <div class="label">Flügel</div>${step('wf', 'Stockwerke')}${pick('wr')}
      ${worth}`;
}
function wireCastle(el, t, x, y) {
  const go = make => undoable(() => { const nk = castleChange(x, y, make(csOf(t))); if (nk) openInfo(...keyXY(nk)); return nk; });
  for (const b of el.querySelectorAll('[data-cstab]')) b.onclick = () => { castleTab = b.dataset.cstab; openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-cs]')) b.onclick = () => go(c => { const [key, v] = b.dataset.cs.split(':'); return { [key]: v === 't' ? 1 - c[key] : /^[+-]/.test(v) ? c[key] + +v : +v }; });
  for (const b of el.querySelectorAll('[data-ct]')) b.onclick = () => go(c => {
    const [i, f, v] = b.dataset.ct.split(':'), tw = c.tw.map(o => ({ ...o })), o = tw[+i];
    o[f] = v === 'n' ? (o[f] + 1) % (CT_LIM[f][1] + 1) : o[f] + +v;
    return { tw };
  });
  for (const b of el.querySelectorAll('[data-csgp]')) b.onclick = () => go(() => ({ gp: b.dataset.csgp }));   // Boden-Belag (Block 76b)
  for (const b of el.querySelectorAll('[data-ctadd]')) b.onclick = () => go(c => { const last = c.tw[c.tw.length - 1]; return { tw: [...c.tw, { ...CT_DEF, h: last ? Math.max(0, last.h - 1) : 2, r: last ? last.r : c.mr, f: last ? last.f : c.mf }] }; });
  for (const b of el.querySelectorAll('[data-ctdel]')) b.onclick = () => go(c => ({ tw: c.tw.filter((_, i) => i !== +b.dataset.ctdel) }));
  for (const b of el.querySelectorAll('[data-tpl]')) b.onclick = () => undoable(() => {   // Vorlage: Gestalt + Farben (nur freigeschaltete)
    const tpl = CS_TPL[b.dataset.tpl], nk = castleChange(x, y, JSON.parse(JSON.stringify(tpl.cs)));
    if (!nk) return;
    const t2 = state.tiles.get(nk);
    for (const kind of ['wall', 'roof', 'win']) {
      const v = tpl[kind];
      if (v == null) delete t2[kind];
      else if (kind === 'win' || colorsOf(kind).some(([, i]) => i === v)) t2[kind] = v;
    }
    save(); openInfo(...keyXY(nk));
  });
}
let delSure = null;                                                     // { at: Feld, until }
const delAsked = (x, y) => !!delSure && delSure.at === x + ',' + y && performance.now() < delSure.until;
function delButton(x, y) {
  const info = demolishInfo(x, y);
  if (info.err || info.refund == null) return '';
  return `<button class="btn danger" id="p-del" aria-label="${info.label}">${delAsked(x, y) ? `Wirklich? ${fmt(info.lost)} Taler sind weg` : `🗑️${info.refund ? ` +${fmt(info.refund)}` : ''}`}</button>`;
}
function wireDel(x, y) {
  const b = $('p-del');
  if (!b) return;
  b.onclick = () => {
    const info = demolishInfo(x, y), t = info.anchor && state.tiles.get(info.anchor);
    if (!delAsked(x, y) && (info.lost >= DEL_ASK || (t && WONDERS[t.b]))) {
      delSure = { at: x + ',' + y, until: performance.now() + 5000 }; b.textContent = `Wirklich? ${fmt(info.lost)} Taler sind weg`; return;
    }
    delSure = null; closePanel(); undoable(() => demolish(x, y));
  };
}

// Standortbonus (Block 53): wie gut der Platz ist und was noch mehr brächte
function siteStatus(si) {
  const less = si.bad > 0.004 ? ` <small>(${si.bTxt} −${pctTxt(si.bad)})</small>` : '';
  if (si.f >= SITE_MAX - 0.004) return `<div class="ok">${si.gTxt}: +${pctTxt(si.f)} – bester Platz</div>`;
  return `<div${si.f > 0.004 ? ' class="ok"' : ''}>${si.f > 0.004 ? `${si.gTxt}: +${pctTxt(si.f)}` : '📍 Normaler Platz'}${less}<br><small class="muted">${si.tip} (bis +${pctTxt(SITE_MAX)}).</small></div>`;
}
// Bewohner angetippt (Block 55): wer, wo zu Hause, was gerade los ist; eine Sprechblase; Knopf zum Haus
function openWalkerInfo(w) {
  const t = state.tiles.get(w.home);
  if (!t) { closePanel(); return; }
  const r = residentsOf(t)[w.who] || residentsOf(t)[0], a = animalOf(r), [hx, hy] = keyXY(w.home), s = T.st.get(w.home);
  const wish = t.b === 'haus' && s && s.wish;
  const miss = wish && wish.next ? wish.list.filter(v => !v.ok) : [];
  if (!w.saidAt || performance.now() - w.saidAt > 6000) { speak(w, bubbleText(w)); w.saidAt = performance.now(); }
  const el = showPanel(`
    <h3>${a.icon} ${escHtml(residentName(r))}</h3>
    <p class="muted">🏠 Zuhause: ${t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : stageName(t)} · ${regionName(regionAt(hx, hy))}</p>
    <div class="status"><div>${walkerDoing(w)}</div>
      ${wish ? `<div>${wish.next ? '♥'.repeat(wish.met) + '♡'.repeat(wish.total - wish.met) : '♥♥♥♥♥'} ${miss.length ? `💭 Wünscht sich: ${miss[0].text}` : 'Rundum glücklich'}</div>` : ''}</div>
    <div class="row"><button class="btn" id="p-home">🏠 Zum Haus</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => walkers.includes(w) || strollers.includes(w) ? openWalkerInfo(w) : walkerGone(w, r));
  $('p-close').onclick = closePanel;
  $('p-home').onclick = () => { const [w0, h0] = sizeOf(t.b, t.rot, t); jumpTo(hx, hy, w0, h0); sparkle(hx + (w0 - 1) / 2, hy + (h0 - 1) / 2); openInfo(hx, hy); };
  void el;
}
// Die Figur ist zu Hause angekommen: Fenster bleibt, sagt das, und bietet das Haus an
function walkerGone(w, r) {
  const t = state.tiles.get(w.home);
  if (!t) { closePanel(); return; }
  const [hx, hy] = keyXY(w.home), a = animalOf(r);
  showPanel(`<h3>${a.icon} ${escHtml(residentName(r))}</h3>
    <div class="status"><div>🏠 Ist nach Hause gegangen.</div></div>
    <div class="row"><button class="btn" id="p-home">🏠 Zum Haus</button><button class="btn ghost" id="p-close">Schließen</button></div>`);
  $('p-close').onclick = closePanel;
  $('p-home').onclick = () => { const [w0, h0] = sizeOf(t.b, t.rot, t); jumpTo(hx, hy, w0, h0); sparkle(hx + (w0 - 1) / 2, hy + (h0 - 1) / 2); openInfo(hx, hy); };
}
// Wie eine Bedingung erfüllt ist, wenn nicht einfach „in der Nähe“ (Block 26)
const REACH_HOW = { viertel: '🏘️ im selben Viertel', bahn: '🚆 per Bahn', seil: '🚡 per Seilbahn', faehre: '⛴️ per Schiff', garten: '🌿 Botanischer Garten' };
const reachHow = c => c.ok && REACH_HOW[c.how] ? ` <small class="how">· ${REACH_HOW[c.how]}</small>` : '';
// Wegform im Wegfenster (Block 77): Breite, Kurve (nur in Kurven), Ende (nur an Enden)
// Belag eines Wegs im Fenster (Block 125b): erst wählen, ob nur dieses Feld oder alle verbundenen, dann Muster und Farbe
let wegScope = 'one';
function wegBelagHtml(t, x, y) {
  const n = wegNetwork(x, y).length, all = wegScope === 'all' && n > 1;
  return `<div class="label">Belag</div>
    ${n > 1 ? `<div class="looks"><button class="look${all ? '' : ' on'}" data-wscope="one">Nur dieses Feld</button><button class="look${all ? ' on' : ''}" data-wscope="all">Alle verbundenen (${n} Felder)</button></div>` : ''}
    ${wegPickHtml(t.style || 'sand', 'wbel')}
    <p class="muted">${all ? `Färbt alle ${n} verbundenen Wegfelder um` : 'Färbt dieses Feld um'} – je Feld 🪙 ${fmt(ITEMS.weg.cost)}, ↶ macht es rückgängig.</p>`;
}
function wegFormHtml(t, x, y) {
  const arms = pathArms(x, y), curve = !t.wide && !!roadCurve(arms), end = arms.length <= 1;
  const btn = (key, v, on, label) => `<button class="look${on ? ' on' : ''}" data-wegf="${key}:${v}">${label}</button>`;
  return `${wegBelagHtml(t, x, y)}<div class="label">Form</div>
    <div class="looks">${btn('wide', 0, !t.wide, '▭ schmal')}${btn('wide', 1, !!t.wide, '▬ ganz breit')}</div>
    ${curve ? `<div class="looks">${btn('sq', 0, !t.sq, '⌒ Kurve rund')}${btn('sq', 1, !!t.sq, '⌐ Kurve eckig')}</div>` : ''}
    ${end && !t.wide ? `<div class="label">Ende</div><div class="looks">${btn('end', '', !t.end, '✨ automatisch')}${btn('end', 'rund', t.end === 'rund', '◖ rund')}${btn('end', 'rand', t.end === 'rand', '▌ bis an den Rand')}</div>
    <p class="muted">Automatisch: vor einem Gebäude läuft der Weg bis an die Wand, sonst endet er rund.</p>` : ''}`;
}
function wireWegForm(el, t, x, y) {
  for (const b of el.querySelectorAll('[data-wscope]')) b.onclick = () => { wegScope = b.dataset.wscope; sfx('deco'); openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-wbel]')) b.onclick = () => undoable(() => {
    const list = wegScope === 'all' ? wegNetwork(x, y) : [[x, y]];
    if (restyleWeg(list, b.dataset.wbel)) openInfo(x, y);
  });
  for (const b of el.querySelectorAll('[data-wegf]')) b.onclick = () => undoable(() => {
    const [k, v] = b.dataset.wegf.split(':');
    if (k === 'end') { if (v) t.end = v; else delete t.end; } else if (+v) t[k] = true; else delete t[k];
    groundVersion++; sfx('road'); save(); openInfo(x, y);
  });
}
// Farben für viele (Block 73): unter den Farbfeldern – auf alle gleichen übertragen, neue gleich so bauen
function paintMoreHtml(t) {
  const n = paintLikeOthers(t).length, on = !!state.paintNew[t.b];
  return `<div class="looks paint-more">
    ${n ? `<button class="look" data-paintall="1">🎨 Für ${n === 1 ? 'das andere' : `alle ${n} anderen`} übernehmen</button>` : ''}
    <button class="look${on ? ' on' : ''}" data-paintnew="1" aria-pressed="${on}">${on ? '✓' : '○'} Neu gebaute bekommen diese Farben</button>
  </div>`;
}
function wirePaintMore(el, t, reopen) {
  const all = el.querySelector('[data-paintall]'), nw = el.querySelector('[data-paintnew]');
  if (all) all.onclick = () => undoable(() => { const n = paintAllLike(t); rememberPaint(t); sfx('deco'); save(); toast(`🎨 ${n} × ${ITEMS[t.b].name} umgefärbt`); reopen(); });
  if (nw) nw.onclick = () => { state.paintNew[t.b] = state.paintNew[t.b] ? false : paintOf(t); sfx('deco'); save(); reopen(); };
}
// Buschfarbe (Block 89): Farbfelder, „für alle anderen übernehmen“ und „neu gebaute bekommen diese Farbe“ – für Busch-Deko und
// Busch-Größen (paintNew.busch) und die Wilmerhecke (paintNew.hecke). o: { cur, key, others, set(i), all(i) → Anzahl, reopen }
const bushAll = () => {                                           // alle Büsche: Deko-Ecken und Busch-Felder (Größen)
  const out = [];
  for (const ds of state.decos.values()) for (const d of ds) if (d && d.b === 'busch') out.push(d);
  for (const [, , d] of roofTopAll()) if (d.b === 'busch') out.push(d);   // auf Dächern (Block 138b)
  for (const t of state.tiles.values()) if (baseOf(t.b) === 'busch') out.push(t);
  return out;
};
const hedgeAll = () => [...state.edges.values()].filter(e => e.b === 'hecke');                // alle Hecken (Block 126)
function bushColHtml(cur, key, others) {
  const have = BUSH_COLS.map((c, i) => [c, i]).filter(([, i]) => bushColOk(i)), more = BUSH_COLS.length - have.length;
  const on = !!(state.paintNew[key] && state.paintNew[key].col != null);
  return `<div class="label">Farbe</div>
    <div class="swatches">${have.map(([c, i]) => `<button class="sw${i === cur ? ' on' : ''}" data-bcol="${i}" style="background:${c.c[0]}" title="${c.name}" aria-label="Farbe: ${c.name}"></button>`).join('')}${more ? `<button class="sw" data-bmore="1" title="${more} weitere Farben in der Kunstakademie" aria-label="${more} weitere Farben in der Kunstakademie">🎨</button>` : ''}</div>
    <div class="looks paint-more">${others ? `<button class="look" data-bcolall="1">🎨 Für ${others === 1 ? 'den anderen' : `alle ${others} anderen`} übernehmen</button>` : ''}
      <button class="look${on ? ' on' : ''}" data-bcolnew="1" aria-pressed="${on}">${on ? '✓' : '○'} Neu gebaute bekommen diese Farbe</button></div>`;
}
function wireBushCol(el, o) {
  for (const b of el.querySelectorAll('[data-bcol]')) b.onclick = () => {
    const i = +b.dataset.bcol;
    undoable(() => { o.set(i); if (state.paintNew[o.key] && state.paintNew[o.key].col != null) state.paintNew[o.key] = { col: i }; sfx('deco'); save(); });
    o.reopen();
  };
  const all = el.querySelector('[data-bcolall]'), nw = el.querySelector('[data-bcolnew]'), more = el.querySelector('[data-bmore]');
  if (all) all.onclick = () => { undoable(() => { const n = o.all(o.cur); sfx('deco'); save(); toast(`🎨 ${n} umgefärbt`); }); o.reopen(); };
  if (nw) nw.onclick = () => { const p = state.paintNew[o.key]; state.paintNew[o.key] = p && p.col != null ? false : { col: o.cur }; sfx('deco'); save(); o.reopen(); };
  if (more) more.onclick = () => { openResearch('design'); artJump('Büsche'); };
}
const setCol = (obj, i) => { if (i) obj.col = i; else delete obj.col; };
// --- Stadtschmuck: Form und Farbe (Block 106) – in der Leiste beim Bauen und im Fenster beim Antippen ---------------
const setLook = (obj, kind, i) => { if (i) obj[kind] = i; else delete obj[kind]; };
const lookAll = b => {
  const out = [];
  for (const ds of state.decos.values()) for (const d of ds) if (d && baseOf(d.b) === b) out.push(d);
  for (const [, , d] of roofTopAll()) if (baseOf(d.b) === b) out.push(d);
  for (const t of state.tiles.values()) if (baseOf(t.b) === b) out.push(t);
  if (b === 'dach' && state.roofs) for (const r of state.roofs.values()) out.push(r);   // Überdachungen (Block 138)
  return out;
};
// Überdachung im Fenster des Felds (Block 138): Form und Farbe für dieses Feld oder alle verbundenen; Abreißen nimmt erst das Dach
let roofScope = 'one';
function roofRunKeys(x, y) {
  const seen = new Set([x + ',' + y]), out = [x + ',' + y];
  for (let i = 0; i < out.length && out.length < 5000; i++) {
    const [cx, cy] = keyXY(out[i]);
    for (const [dx, dy] of DIRS) { const k = (cx + dx) + ',' + (cy + dy); if (!seen.has(k) && state.roofs.has(k)) { seen.add(k); out.push(k); } }
  }
  return out;
}
function roofInfoHtml(x, y) {
  const r = roofAt(x, y);
  if (!r) return '';
  const n = roofRunKeys(x, y).length, form = r.form || 0, col = r.col || 0, more = lookMore('dach');
  if (n < 2) roofScope = 'one';
  const sc = (v, label) => `<button class="look${roofScope === v ? ' on' : ''}" data-roofscope="${v}">${label}</button>`;
  return `<div class="label">Überdachung</div>
    ${n > 1 ? `<div class="looks">${sc('one', 'Nur dieses Feld')}${sc('run', `Alle verbundenen (${n})`)}</div>` : ''}
    <div class="looks look-forms">${lookFree('dach', 'form').map(([f, i]) => `<button class="look look-form${i === form ? ' on' : ''}" data-roofform="${i}" aria-label="Form: ${f.name}"><img alt="" src="${lookThumb('dach', i, col) || 'data:,'}"><span>${f.name}</span></button>`).join('')}</div>
    ${roofForm(r) === 'markise' ? `<div class="label">Markisenfarbe</div><div class="swatches">${lookFree('dach', 'col').map(([c, i]) => `<button class="sw${i === col ? ' on' : ''}" data-roofcol="${i}" style="background:${c.c}" title="${c.name}" aria-label="Farbe: ${c.name}"></button>`).join('')}</div>` : ''}
    ${roofForm(r) === 'arkaden' ? `<div class="label">Dach</div><div class="looks">${[['', 'Dachgarten'], [roofBel(r) || roofBelDefault(), 'Belag']].map(([v, n]) => `<button class="look${!v === !roofBel(r) ? ' on' : ''}" data-roofbel="${escHtml(v)}">${n}</button>`).join('')}</div>${roofBel(r) ? wegPickHtml(roofBel(r), 'roofbel', true) : ''}` : ''}
    ${more ? `<div class="looks"><button class="look art-more" data-roofmore="1">🎨 ${more} weitere Formen und Farben freischalten ›</button></div>` : ''}
    <p class="muted">An die Außenecken kommen Stützen gleich mit. Weitere stellst du selbst: Stütze (Gestalten → Überdachungen) an Ecken, Seitenmitten oder zwischen vier Felder; mit 🧹 entfernen.</p>`;
}
function openRoofInfo(x, y) {
  if (!roofAt(x, y)) { closePanel(); return; }
  const reopen = () => roofAt(x, y) ? openRoofInfo(x, y) : closePanel();
  const el = showPanel(`<h3>${DECO_LOOKS.dach.forms[roofAt(x, y).form || 0].name}</h3><p class="muted">${ITEMS.dach.desc}</p>
    ${roofInfoHtml(x, y)}
    <div class="row">${delButton(x, y)}<button class="btn ghost" id="p-close">Schließen</button></div>`, reopen);
  wireDel(x, y);
  $('p-close').onclick = closePanel;
  wireRoofInfo(el, x, y, reopen);
}
function wireRoofInfo(el, x, y, reopen = () => openInfo(x, y)) {
  const set = (kind, i) => undoable(() => {
    const keys = roofScope === 'run' ? roofRunKeys(x, y) : [x + ',' + y];
    for (const k of keys) { const o = state.roofs.get(k); if (o) setLook(o, kind, i); }
    for (const k of keys) roofDirty(...keyXY(k));
    groundVersion++; sfx('deco'); save();
  });
  for (const b of el.querySelectorAll('[data-roofscope]')) b.onclick = () => { roofScope = b.dataset.roofscope; reopen(); };
  for (const b of el.querySelectorAll('[data-roofform]')) b.onclick = () => {
    let n = 0;
    undoable(() => {                                                   // Deko oben geht nur auf Stein: zurück ins Lager (Block 138b)
      const keys = roofScope === 'run' ? roofRunKeys(x, y) : [x + ',' + y];
      if (DECO_LOOKS.dach.forms[+b.dataset.roofform].id !== 'arkaden') for (const k of keys) n += roofTopClear(state.roofs.get(k));
      set('form', +b.dataset.roofform);
    });
    if (n) toast(`${n} × Deko vom Dach zurückgegeben`);
    reopen();
  };
  for (const b of el.querySelectorAll('[data-roofcol]')) b.onclick = () => { set('col', +b.dataset.roofcol); reopen(); };
  for (const b of el.querySelectorAll('[data-roofbel]')) b.onclick = () => { set('bel', b.dataset.roofbel); reopen(); };   // Steinarkaden: Dachgarten oder Belag
  const m = el.querySelector('[data-roofmore]');
  if (m) m.onclick = () => { closePanel(); openResearch('design'); artJump(DECO_LOOKS.dach.group); };
}
const lookThumbs = new Map();
// kleines Vorschaubild einer Form in einer Farbe (im Test ohne Canvas: leer)
function lookThumb(b, form, col) {
  const key = `${b}|${form}|${col}`;
  if (lookThumbs.has(key)) return lookThumbs.get(key);
  let url = '';
  try {
    const c = document.createElement('canvas'), prev = g;
    if (b === 'tunneleinfahrt') {                                           // Tunneleinfahrt (Block 136): zwei Felder, kleiner
      c.width = 64; c.height = 64; g = c.getContext('2d');
      try { drawObject(b, 32, 38, 0.75, 0, 3, 3, 1, { form, rot: 1 }); } finally { g = prev; }
      url = c.toDataURL(); if (!url || !url.startsWith('data:image')) url = '';
      lookThumbs.set(key, url); return url;
    }
    const s = b === 'brunnen' ? 1.1 : b === 'schiene' ? 2.2 : b === 'pb_station' ? 0.95 : b === 'strassenlaterne' ? 0.95 : b === 'blumen' ? 1.2 : 1.9, rail = b === 'schiene' || b === 'pb_station';
    c.width = 64; c.height = 64; g = c.getContext('2d');
    try { drawObject(b, 32, b === 'pb_station' ? 42 : b === 'strassenlaterne' ? 61 : b === 'blumen' ? 40 : rail ? 32 : 50, s, 0, rail ? 1e6 : 3, rail ? 1e6 : 3, 1, { form, col, rot: 0, slot: 0 }); } finally { g = prev; }   // Gleis: ohne Nachbarn (Block 109)
    url = c.toDataURL();
    if (!url || !url.startsWith('data:image')) url = '';
  } catch (e) { url = ''; }
  lookThumbs.set(key, url);
  return url;
}
const lookFree = (b, kind) => (kind === 'form' ? DECO_LOOKS[b].forms : DECO_LOOKS[b].cols || []).map((e, i) => [e, i]).filter(([, i]) => lookOk(b, kind, i));
const lookMore = (b) => DECO_LOOKS[b].forms.filter((e, i) => !lookOk(b, 'form', i)).length + (DECO_LOOKS[b].cols || []).filter((e, i) => !lookOk(b, 'col', i)).length;
// Leiste (Nutzer, 08.10.2026: „überladen, 5 Felder übereinander“): wie beim Weg je ein Knopf für Form und Farbe/Boden – die Auswahl
// klappt als Raster darüber auf (lookPop), eine Wahl klappt sie wieder zu. So bleibt es eine Reihe, egal wie viele Formen es gibt
let lookPop = null;
function lookChips(b) {
  const L = DECO_LOOKS[b], p = state.paintNew[b] || {}, form = lookOk(b, 'form', p.form | 0) ? p.form | 0 : 0, col = lookOk(b, 'col', p.col | 0) ? p.col | 0 : 0;
  const lab = L.colLabel || 'Farbe', F = L.forms[form], Cc = L.cols && !(b === 'dach' && F.id !== 'markise') && L.cols[col];   // Dach: Farbe nur für die Markise
  const moreF = L.forms.length - lookFree(b, 'form').length, moreC = L.cols ? L.cols.length - lookFree(b, 'col').length : 0;
  const more = n => n ? `<button class="wopt more" data-lmore="1"><i>🎨</i><small>+${n} in der Kunstakademie</small></button>` : '';
  const pop = lookPop === 'form' ? `<div class="wpop" role="listbox" aria-label="Form">${lookFree(b, 'form').map(([f, i]) => `<button class="wopt${i === form ? ' on' : ''}" data-lform="${i}" role="option" aria-selected="${i === form}"><i style="background:#f6efe2 url(${lookThumb(b, i, col)}) center / contain no-repeat"></i><small>${f.name}</small></button>`).join('')}${more(moreF)}</div>`
    : lookPop === 'col' && L.cols ? `<div class="wpop wpop-cols" role="listbox" aria-label="${lab}">${lookFree(b, 'col').map(([c, i]) => `<button class="wopt${i === col ? ' on' : ''}" data-lcol="${i}" role="option" aria-selected="${i === col}"><i style="background:${c.c}"></i><small>${c.name}</small></button>`).join('')}${more(moreC)}</div>` : '';
  return '<span class="style-sep"></span>' + pop
    + `<button class="style-chip on wsel look-chip${lookPop === 'form' ? ' open' : ''}" data-lpop="form" aria-expanded="${lookPop === 'form'}" aria-label="Form: ${F.name} – ändern"><i style="background:#f6efe2 url(${lookThumb(b, form, col)}) center / contain no-repeat"></i><span>${F.name} ▾</span></button>`
    + (Cc ? `<button class="style-chip on wsel${lookPop === 'col' ? ' open' : ''}" data-lpop="col" aria-expanded="${lookPop === 'col'}" aria-label="${lab}: ${Cc.name} – ändern"><i style="background:${Cc.c}"></i><span>${Cc.name} ▾</span></button>` : '');
}
function wireLookChips(bar, b, t) {
  const set = (k, v) => { state.paintNew[b] = { ...(state.paintNew[b] || {}), [k]: v }; previewCache = null; lookPop = null; sfx('deco'); save(); renderStyleBar(t); };
  for (const x of bar.querySelectorAll('[data-lpop]')) x.onclick = () => { lookPop = lookPop === x.dataset.lpop ? null : x.dataset.lpop; sfx('deco'); renderStyleBar(t); };
  for (const x of bar.querySelectorAll('[data-lform]')) x.onclick = () => set('form', +x.dataset.lform);
  for (const x of bar.querySelectorAll('[data-lcol]')) x.onclick = () => set('col', +x.dataset.lcol);
  for (const x of bar.querySelectorAll('[data-lmore]')) x.onclick = () => { lookPop = null; openResearch('design'); artJump(DECO_LOOKS[b].group); };
}
document.addEventListener('pointerdown', e => {                          // daneben tippen: Auswahl zu
  if (!lookPop || ($('style-bar') && $('style-bar').contains(e.target))) return;
  lookPop = null; if (DECO_LOOKS[baseOf(tool)]) renderStyleBar(tool);
}, true);
// Im Fenster: Form, Farbe, auf alle gleichen übertragen, für neu Gebautes merken
// Gleise (Block 146): erst wählen, wofür – nur dieses Feld, alle verbundenen, alle Gleise –, dann das Gleisbett antippen
let railScopeSel = 'one';
function railScopeHtml(x, y) {
  const nRun = railNetwork(x, y).length, nAll = railScope(x, y, 'all').length;
  if (railScopeSel === 'run' && nRun < 2 || railScopeSel === 'all' && nAll <= nRun) railScopeSel = nRun > 1 && railScopeSel === 'all' ? 'run' : 'one';
  const sc = (v, label) => `<button class="look${railScopeSel === v ? ' on' : ''}" data-rscope="${v}">${label}</button>`;
  return `<div class="label">Ändern</div>
    <div class="looks">${sc('one', 'Nur dieses Feld')}${nRun > 1 ? sc('run', `Alle verbundenen (${nRun})`) : ''}${nAll > nRun ? sc('all', `Alle Gleise (${nAll})`) : ''}</div>`;
}
function decoLookHtml(b, o, at = null) {
  const L = DECO_LOOKS[b], form = o.form || 0, col = o.col || 0, more = lookMore(b), rail = b === 'schiene' && at;
  const others = rail ? 0 : lookAll(b).filter(x => x !== o && ((x.form || 0) !== form || (x.col || 0) !== col)).length;
  const p = state.paintNew[b], on = !!(p && (p.form != null || p.col != null));
  return `${rail ? railScopeHtml(at[0], at[1]) : ''}${b === 'pb_station' && at ? '' : `<div class="label">${b === 'schiene' ? 'Gleisbett' : 'Form'}</div>
    <div class="looks look-forms">${lookFree(b, 'form').map(([f, i]) => `<button class="look look-form${i === form ? ' on' : ''}" data-dform="${i}" aria-label="Form: ${f.name}"><img alt="" src="${lookThumb(b, i, col) || 'data:,'}"><span>${f.name}</span></button>`).join('')}</div>`}
    ${L.cols ? `<div class="label">${L.colLabel || 'Farbe'}</div>
    <div class="swatches">${lookFree(b, 'col').map(([c, i]) => `<button class="sw${i === col ? ' on' : ''}" data-dcol="${i}" style="background:${c.c}" title="${c.name}" aria-label="Farbe: ${c.name}"></button>`).join('')}</div>` : ''}
    ${more ? `<div class="looks"><button class="look art-more" data-dmore="1">🎨 ${more} weitere ${L.cols ? 'Formen und Farben' : 'Formen'} freischalten ›</button></div>` : ''}
    <div class="looks paint-more">${others ? `<button class="look" data-dall="1">🎨 Für ${others === 1 ? 'den anderen' : `alle ${others} anderen`} übernehmen</button>` : ''}
      <button class="look${on ? ' on' : ''}" data-dnew="1" aria-pressed="${on}">${on ? '✓' : '○'} Neu gebaute bekommen das</button></div>`;
}
// Parkeisenbahn (Block 136e): Züge der ganzen Strecke im Fenster jeder ihrer Stationen – Modell je Zug, entfernen, „+ Zug“
function pbTrainsHtml(x, y) {
  const A = PB_AT.get(x + ',' + y), R = A && PB_RINGS[A.r];
  if (!R) return '<div class="label">Züge</div><p class="muted">Sobald das Gleis ein geschlossener Rundkurs ist, fährt hier ein Zug.</p>';
  const forms = pbForms(R), F = lookFree('pb_station', 'form'), more = DECO_LOOKS.pb_station.forms.length - F.length;
  const room = pbRoom(R, forms.concat([forms[forms.length - 1]]));
  return `<div class="label">Züge auf dieser Strecke (${forms.length})</div>
    ${forms.map((f, j) => `<div class="looks pb-zug"><span class="pb-nr">${j + 1}</span>${F.map(([m, i]) => `<button class="look${i === f ? ' on' : ''}" data-pbm="${j},${i}" title="${m.name}">${m.short || m.name}</button>`).join('')}${forms.length > 1 ? `<button class="look" data-pbdel="${j}" aria-label="Zug ${j + 1} entfernen" title="Entfernen (gibt 🪙 ${fmt(PB_ZUG_COST)} zurück)">✕</button>` : ''}</div>`).join('')}
    <div class="row"><button class="btn" data-pbadd="1" ${room && state.money >= PB_ZUG_COST ? '' : 'disabled'}>+ Zug · 🪙 ${fmt(PB_ZUG_COST)}</button></div>
    ${room ? '' : '<p class="muted">Für noch einen Zug ist die Strecke zu kurz – länger bauen.</p>'}
    ${more ? `<div class="looks"><button class="look art-more" data-pbmore="1">🎨 ${more} weitere Züge freischalten ›</button></div>` : ''}`;
}
function wirePbTrains(el, x, y) {
  const R = () => { const A = PB_AT.get(x + ',' + y); return A && PB_RINGS[A.r]; }, again = () => openInfo(x, y);
  for (const b of el.querySelectorAll('[data-pbm]')) b.onclick = () => { const [j, f] = b.dataset.pbm.split(',').map(Number); if (R()) undoable(() => pbSetModel(R(), j, f)); again(); };
  for (const b of el.querySelectorAll('[data-pbdel]')) b.onclick = () => { if (R()) undoable(() => pbSellTrain(R(), +b.dataset.pbdel)); again(); };
  const add = el.querySelector('[data-pbadd]'), more = el.querySelector('[data-pbmore]');
  if (add) add.onclick = () => { if (R()) undoable(() => pbBuyTrain(R())); again(); };
  if (more) more.onclick = () => { closePanel(); openResearch('design'); artJump(DECO_LOOKS.pb_station.group); };
}
function wireDecoLook(el, b, o, reopen, at = null) {
  const remember = () => { if (state.paintNew[b] && (state.paintNew[b].form != null || state.paintNew[b].col != null)) state.paintNew[b] = { form: o.form || 0, col: o.col || 0 }; };
  for (const x of el.querySelectorAll('[data-rscope]')) x.onclick = () => { railScopeSel = x.dataset.rscope; reopen(); };
  for (const x of el.querySelectorAll('[data-dform]')) x.onclick = () => {
    if (b === 'schiene' && at) { undoable(() => { if (restyleRails(railScope(at[0], at[1], railScopeSel), +x.dataset.dform)) { remember(); sfx('deco'); } }); reopen(); return; }   // Block 146
    undoable(() => { setLook(o, 'form', +x.dataset.dform); remember(); o.born = performance.now(); groundVersion++; sfx('deco'); save(); }); reopen();   // Gleis liegt im Boden (Block 109)
  };
  for (const x of el.querySelectorAll('[data-dcol]')) x.onclick = () => { undoable(() => { setLook(o, 'col', +x.dataset.dcol); remember(); sfx('deco'); save(); }); reopen(); };
  const all = el.querySelector('[data-dall]'), nw = el.querySelector('[data-dnew]'), more = el.querySelector('[data-dmore]');
  if (all) all.onclick = () => { undoable(() => { const l = lookAll(b).filter(x => x !== o && ((x.form || 0) !== (o.form || 0) || (x.col || 0) !== (o.col || 0))); l.forEach(x => { setLook(x, 'form', o.form || 0); setLook(x, 'col', o.col || 0); }); groundVersion++; sfx('deco'); save(); toast(`🎨 ${l.length} angepasst`); }); reopen(); };
  if (nw) nw.onclick = () => { const p = state.paintNew[b]; state.paintNew[b] = p && (p.form != null || p.col != null) ? {} : { form: o.form || 0, col: o.col || 0 }; save(); reopen(); };
  if (more) more.onclick = () => { closePanel(); openResearch('design'); artJump(DECO_LOOKS[b].group); };
}
// Kunstakademie gleich an der passenden Gruppe öffnen (Block 114)
function artJump(group) {
  const lab = [...document.querySelectorAll('#modal-card .label')].find(l => l.textContent.trim() === group), sc = document.querySelector('#modal-card > .tab-scroll');
  if (lab && sc) sc.scrollTop = Math.max(0, lab.offsetTop - sc.offsetTop - 8);
}
function openInfo(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t) { closePanel(); return; }
  if (t.b === 'rathaus') { openTownHall('overview'); return; }       // Päckchen: Hinweis in der Übersicht (nicht umleiten – sonst ist das Rathaus nie erreichbar)
  if (t.b === 'lm') { openLandmark(x, y); return; }
  if (t.b === 'truhe') { openChestInfo(x, y, t); return; }
  const d = ITEMS[t.b], s = statusOf(x, y) || {};
  const status = [];
  if (needsReach(t.b)) {
    status.push({
      viertel: '<div class="ok">✓ Liegt im Wohnviertel</div>',
      nah: `<div class="ok">✓ Häuser in Laufweite (bis ${WALK_REACH} Felder)</div>`,
      weit: '<div class="bad" data-help="term:schnecke">🐌 Weit weg vom Dorf: 50 %. Ein Weg zum Dorf oder ein Bahnhof in der Nähe bringt 100 %.</div>',
      bahn: s.served >= 1 ? '<div class="ok">🚆 Mit dem Zug ans Dorf angebunden</div>'
        : `<div class="bad">🚆 Mit dem Zug angebunden, aber die Linie ist überfüllt: ${Math.round(s.eff * 100)} %</div>`,
    }[s.how]);
  }
  if (s.bonus) status.push(`<div class="ok" ${helpAttr('term:viertel')}>🏘️ Viertel mit ${s.n} Gebäuden: +${Math.round(s.bonus * 100)} %</div>`);
  else if (s.n > 1) status.push(`<div ${helpAttr('term:viertel')}>🏘️ Viertel mit ${s.n} Gebäuden (ab 3 gibt es +10 %)</div>`);
  else if (s.n) status.push('<div>🏘️ Steht noch allein – ab 3 Gebäuden im Viertel gibt es +10 %</div>');
  if (s.lmb > 1.001) status.push(`<div class="ok">✨ Sehenswürdigkeit in der Nähe: +${Math.round((s.lmb - 1) * 100)} %</div>`);
  if (d.shop) status.push(...shopStatus(t, s, x + ',' + y));
  if (STANDS[t.b]) status.push(...marktStatus(x + ',' + y));
  if (terraLook(x, y) === 'park') status.push(...parkStatus(x + ',' + y));
  if (isTrack(t.b)) {                                                     // Achterbahn (Block 60c)
    const ca = COASTER_AT.get(x + ',' + y), c = ca && ca.c >= 0 && COASTERS[ca.c];
    status.push(c ? `<div class="ok">🎢 Rundkurs fertig – der Zug fährt (${c.n} Stücke, bis ${Math.round(c.Hmax)} hoch)${t.loop ? ' · mit Looping' : ''}</div>`
      : '<div class="bad">✗ Noch kein Rundkurs: Strecke ganz schließen (jedes Stück genau zwei Nachbarn) und eine Station hineinsetzen</div>');
  }
  if (ITEMS[t.b].cat === 'fz') status.push(...fzStatus(x + ',' + y));
  if (STOPS.has(t.b)) status.push(`<div>${placeLabel(x, y)} – Fahrgäste zählen je Ortsteil</div>`);
  if (t.b === 'station' || t.b === 'ubahn') status.push(...stationStatus(x + ',' + y));
  if (t.b === 'schiene' && railAtTunnel(x, y)) status.push(`<div class="bad">✗ Hier endet ein Tunnel – ohne Einfahrt fährt der Zug nicht hinein. ${TUNNEL_EIN_HINT}</div>`);
  if (t.b === 'tunneleinfahrt') { const E = einOf(x, y), inT = tunnelAt(E.B[0] + E.d[0], E.B[1] + E.d[1]), outR = bAt(E.A[0] - E.d[0], E.A[1] - E.d[1]) === 'schiene';
    status.push(inT ? '<div class="ok">✓ Hinten am Tunnel</div>' : '<div class="bad">✗ Hinten noch kein Tunnel – ans Tunnelende setzen oder den Tunnel bis hierher ziehen</div>',
      outR ? '<div class="ok">✓ Vorn an der Schiene</div>' : '<div class="bad">✗ Vorn noch keine Schiene – Schiene an das offene Ende legen</div>'); }
  if (t.b === 'seilbahn') status.push(...cableStatus(x + ',' + y));
  if (SITE_TIP[t.b]) status.push(siteStatus(siteOf(t.b, x + ',' + y, t.rot, t)));
  if (POWER_OUT[t.b]) status.push(`<div class="ok">⚡ Liefert ${fmtPow(powerOf(t, x + ',' + y))} Strom${t.b === 'windrad' && hasTech('rotor') ? ' (Rotorblätter +50 %)' : ''}${hasTech('stromnetz') ? ' · Stromnetz +25 %' : ''}</div>`, ...powerStatus());
  else if (CONSUMERS[t.b] && T.rail.power.city && !s.noPower && (!WONDERS[t.b] || wonderDone(t))) status.push(`<div class="ok">⚡ Hat Strom (braucht ${CONSUMERS[t.b]} ⚡)</div>`);
  if (s.noPower) status.push(`<div class="bad" ${helpAttr('term:strom')}>⚡ Kein Strom: nur ${Math.round(NO_POWER * 100)} %. ${ITEMS[t.b].name} braucht ${CONSUMERS[t.b]} ⚡ – mehr Kraftwerke bauen (🏭 Herstellen → ⚡ Strom).</div>`);
  const why = [];
  const beete = beetBonus(x, y);
  if (t.b === 'haus') why.push(`👥 ${HOUSE_STAGES[t.lvl - 1].pop} Einwohner`);
  else if (d.pop) why.push(`👥 ${d.pop * t.lvl} Einwohner`);
  if (t.b === 'fischer') why.push(`${countAround(x, y, 1, isWater)} Wasserfelder daneben · Gewässer ${waterBody(x, y) >= 64 ? '64+' : waterBody(x, y)} Felder`);
  if (t.b === 'muehle') why.push(`${countNear(x, y, 1, b => b === 'feld')} Felder daneben`);
  if (t.b === 'baecker') why.push(`${countNear(x, y, 1, b => b === 'muehle')} Mühlen daneben`);
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
      const costs = costSpans(money, mat);
      grow = `
        <div class="label">Nächste Stufe: ${info.next.name} · ×${t.lvl + 1}</div>
        <div class="status">${info.conds.map(c => `<div class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} ${c.text}${reachHow(c)}</div>`).join('')}</div>
        <div class="stats">${costs}</div>
        <div class="row"><button class="btn" id="p-stage" ${info.ready && canPay(info.next.cost) ? '' : 'disabled'}>
          ${info.ready ? (canPay(info.next.cost) ? '✨ Ausbauen' : 'Material fehlt noch') : `Noch ${missing} ${missing > 1 ? 'Bedingungen' : 'Bedingung'}`}</button></div>`;
    } else grow = '<p class="ok">Höchste Stufe – prächtiger geht es nicht!</p>';
  }
  let colors = '';
  if (t.b === 'haus' || repaintOf(t.b) || (PAINTABLE.has(t.b) && !(t.b === 'schloss' && !wonderDone(t)))) {   // Wunder-Schloss: erst nach der Einweihung
    const house = t.b === 'haus';
    if (house && t.lvl > 1) colors += `
      <div class="label">Aussehen</div>
      <div class="looks">${HOUSE_STAGES.slice(0, t.lvl).map((st, i) => `<button class="look${i + 1 === houseLook(t) ? ' on' : ''}" data-look="${i + 1}">${st.name}</button>`).join('')}</div>`;
    // Häuser haben immer eine Farbe (sonst aus der Lage), andere Gebäude ihre eigene, bis man eine wählt
    const wall = t.wall != null ? t.wall : house ? Math.floor(hash(x, y, 3) * 7) : -1;
    const roof = t.roof != null ? t.roof : house ? Math.floor(hash(x, y, 4) * 7) : -1;
    const mixed = t.b === 'reihenhaus';                                     // Reihenhaus: „bunt“ je für Fassade und Dach
    const [wallName, roofName] = (repaintOf(t.b) || {}).names || [mixed ? 'Fassaden' : 'Wand', mixed ? 'Dächer' : 'Dach'];   // Windrad: Turm/Flügel
    const bunt = kind => mixed ? `<button class="sw bunt${kind === 'roof' ? ' roofs' : ''}${t[kind] == null ? ' on' : ''}" data-${kind}="bunt" aria-label="${kind === 'wall' ? 'Fassaden' : 'Dächer'} bunt gemischt" title="Bunt gemischt"></button>` : '';
    colors += `
      ${!house && !mixed && (t.wall != null || t.roof != null) ? '<div class="looks"><button class="look" data-orig="1">↺ Originalfarben</button></div>' : ''}
      <div class="label">${wallName}</div>
      <div class="swatches">${bunt('wall')}${colorsOf('wall').map(([c, i]) => `<button class="sw${i === wall ? ' on' : ''}" data-wall="${i}" style="background:${c}" aria-label="${wallName}: Farbe ${i + 1}"></button>`).join('')}</div>
      ${roofName ? `<div class="label">${roofName}</div>
      <div class="swatches">${bunt('roof')}${colorsOf('roof').map(([c, i]) => `<button class="sw${i === roof ? ' on' : ''}" data-roof="${i}" style="background:${c}" aria-label="${roofName}: Farbe ${i + 1}"></button>`).join('')}</div>` : ''}
      ${ITEMS[t.b].fl0 ? `<div class="label">Stockwerke</div><div class="row"><button class="btn ghost" data-fl="-1" aria-label="Ein Stockwerk weniger">−</button><b class="fl-n">${t.fl || ITEMS[t.b].fl0}</b><button class="btn ghost" data-fl="1" aria-label="Ein Stockwerk mehr">+</button></div>` : ''}
      ${ITEMS[t.b].fl0 || t.b === 'fz_schloss' ? `<div class="label">Fenster</div>
      <div class="swatches">${WIN_COLS.map((c, i) => `<button class="sw${i === (t.win != null ? t.win : 0) ? ' on' : ''}" data-win="${i}" style="background:${c}" aria-label="Fensterfarbe ${i + 1}"></button>`).join('')}</div>` : ''}
      ${paintMoreHtml(t)}
      ${colorsOf('wall').length + colorsOf('roof').length < 28 ? '<div class="looks"><button class="look art-more" data-openart="1">🎨 Mehr Farben freischalten ›</button></div>' : ''}`;
  }
  if (baseOf(t.b) === 'busch') colors += bushColHtml(t.col || 0, 'busch', bushAll().filter(o => o !== t && (o.col || 0) !== (t.col || 0)).length);   // Block 89
  if (t.b === 'pb_station') colors += pbTrainsHtml(x, y);                  // Züge der Strecke (Block 136e)
  if (DECO_LOOKS[baseOf(t.b)]) colors += decoLookHtml(baseOf(t.b), t, [x, y]);   // Form/Farbe (Block 106); Gleise mit Auswahl (146)

  // Häuser: Bewohner, Herzen, Wünsche und Ausbauen
  let house = isHome(t.b) && t.b !== 'haus' && t.animal
    ? `<p class="resident">${residentsOf(t).map(r => `${animalOf(r).icon} <b>${escHtml(residentName(r))}</b>`).join(' · ')}${t.b === 'ferienhaus' ? ' <small class="muted">(Feriengäste)</small>' : ''}</p>` : '';
  if (t.b === 'haus') {
    const w = houseWishes(t, x, y), a = animalOf(t);
    const hearts = w.next ? '♥'.repeat(w.met) + '♡'.repeat(w.total - w.met) : '♥♥♥♥♥';
    house = `
      <p class="resident">${a.icon} <b id="p-name">${escHtml(t.name)} ${a.family}</b> <button class="link" id="p-rename" aria-label="Namen ändern">✎</button></p>
      <p class="hearts">${hearts}</p>
      ${w.next ? `<div class="label">Wünsche für: ${w.next.name}</div>
        <div class="status">${w.list.map(v => `<div class="${v.ok ? 'ok' : 'bad'}" ${helpAttr('wish:' + v.id)}>${v.ok ? '✓' : '✗'} ${v.text}${reachHow(v)}</div>`).join('')}</div>`
        : w.later ? `<p class="muted">✨ Mit Kristall 💎 von der Kristallinsel kann daraus eine ${w.later.name} werden.</p>`
        : '<p class="ok">Alle Wünsche erfüllt – das schönste Haus der Insel!</p>'}`;
    const hc = w.next && houseCost(w.next), hcText = hc ? [hc.money ? `🪙 ${fmt(hc.money)}` : '', matText(w.next.mat)].filter(Boolean).join(' ') : '';
    house += w.next ? `<div class="row"><button class="btn" id="p-grow" ${w.ready && canPay(hc) ? '' : 'disabled'}>
      ${w.ready ? `Ausbauen · ${hcText}` : `Noch ${w.total - w.met} ${w.total - w.met > 1 ? 'Wünsche' : 'Wunsch'}`}</button></div>
      ${missMatHtml(w.next.mat)}` : '';
  }
  // Wunderwerk: Fortschritt, Kosten des nächsten Abschnitts, Knopf
  let wonder = '';
  if (WONDERS[t.b]) {
    const W = WONDERS[t.b], p = t.phase || 0, N = W.phases.length;
    if (p < N) {
      const { money = 0, ...mat } = wonderCost(t);
      const costs = costSpans(money, mat);
      wonder = `<div class="label">Abschnitt ${p + 1} von ${N}: ${W.names[p]}</div>
        <div class="wbar"><i style="width:${p / N * 100}%"></i></div>
        <div class="stats">${costs}</div>
        <p class="muted">Wenn fertig: ${W.text}. Preise nach deinem besten Einkommen (🪙 ${fmt(wonderBase(t))}/s).</p>
        <div class="row"><button class="btn" id="p-wonder" ${canPay(wonderCost(t)) ? '' : 'disabled'}>🏗️ Abschnitt bauen</button></div>`;
    } else {
      wonder = '<p class="ok">✓ Fertig – wirkt jetzt.</p>';
      if (t.b === 'riesenrad') wonder += `<div class="status"><div class="${fairLeft() ? 'ok' : ''}">🎡 ${fairLeft() ? `Jahrmarkt! Einnahmen ×${FAIR_MUL} · noch ${fmtClock(fairLeft())}` : `Nächster Jahrmarkt in ${fmtClock(fairNext())}`}</div></div>`;
      if (t.b === 'schloss') wonder += decreeHtml();
    }
  }
  const line = t.b === 'station' || t.b === 'ubahn' ? lineOf(x + ',' + y) : null, hub = t.b === 'hbf' ? hbfHtml(x, y, t) : t.b === 'station' ? stationLenHtml(x, y, t) : '';
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
  // Märchenschloss (Block 60g/60h): Gestalt im Fenster, in Reitern (Form · Türme · Farben)
  const castle = isWegBridge(t) ? `<div class="label">Brücke</div><div class="looks">${Object.entries(WEG_BRIDGE).map(([id, B]) => `<button class="look${id === bridgeKind(t) ? ' on' : ''}" data-brk="${id}">${B.icon} ${B.name}</button>`).join('')}</div>
      <p class="muted">Von selbst passend zum Wegstil – hier für die ganze Brücke umstellen. Die alte gibt es voll zurück.</p>
      <div class="label">${BRIDGE_LOOK[bridgeKind(t)].wall ? 'Mauer und Brüstung' : 'Geländer und Pfähle'}</div>
      <div class="swatches"><button class="sw bunt${t.brc == null ? ' on' : ''}" data-brc="" aria-label="Farbe wie die Brücke" title="Wie die Brücke"></button>${BRIDGE_COLS.map((c, i) => `<button class="sw${t.brc === i ? ' on' : ''}" data-brc="${i}" style="background:${c}" aria-label="Brückenfarbe ${i + 1}"></button>`).join('')}</div>
      ${BRIDGE_LOOK[bridgeKind(t)].wall ? `<div class="label">Belag</div>
      ${wegPickHtml(t.style || 'sand', 'brs', true)}` : `<div class="label">Planken</div>
      <div class="swatches"><button class="sw bunt${t.brw == null ? ' on' : ''}" data-brw="" aria-label="Planken wie die Brücke" title="Wie die Brücke"></button>${PLANK_COLS.map((c, i) => `<button class="sw${t.brw === i ? ' on' : ''}" data-brw="${i}" style="background:${c}" aria-label="Plankenfarbe ${i + 1}"></button>`).join('')}</div>`}`   // Wegbrücke (Block 66/66b)
    : t.b === 'weg' && !isCrossing(t) ? wegFormHtml(t, x, y)
    : t.b === 'fz_schloss' ? castleHtml(t)
    : t.b === 'schloss' && wonderDone(t) ? `<div class="label">Dachform</div><div class="looks">${CS_NAMES.r.map((n, i) => `<button class="look${i === royalRoof(t) ? ' on' : ''}" data-royal="${i}">${n}</button>`).join('')}</div>`   // Wunder-Schloss (Block 60j)
    : t.b === 'leuchtturm' && t.mini ? `<div class="label">🗼 Leuchtturm-Kap</div><p class="muted">Der Leuchtturm ist jetzt ein ganzes Kap (3×3) mit Wärterhaus, großem Leuchtfeuer und den 21 Laternen. ${lighthouseSpot(x + ',' + y, t) ? 'Rundherum ist Platz – er kann wachsen (kostenlos, Wege und Dekos dort gibt es zurück).' : 'Rundherum fehlt Platz: 3×3 Felder an der Küste, darauf nur Gras, Wege oder Dekos. Platz schaffen, dann wächst er.'}</p>
      <div class="row"><button class="btn" data-lgrow="1" ${lighthouseSpot(x + ',' + y, t) ? '' : 'disabled'}>🗼 Zum Kap ausbauen</button></div>`   // Block 83
    : courtHtml(t, x, y);   // Gartenweg (Block 78), Vorplatz (Block 91)
  if (t.b === 'fz_schloss' && castleTab !== 'farben') colors = '';
  const title = isWegBridge(t) ? WEG_BRIDGE[bridgeKind(t)].name : t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : isCrossing(t) ? 'Bahnübergang'
    : WONDERS[t.b] && !wonderDone(t) ? `${ITEMS[t.b].name} (Baustelle)` : stageName(t);
  const el = showPanel(`
    <h3>${title} ${S ? `<span class="lvl">Stufe ${t.lvl}</span>` : ''}</h3>
    ${house}
    ${outs.length ? `<p class="big">${outs.join(' · ')}</p>` : ''}
    ${status.length ? `<div class="status">${status.join('')}</div>` : ''}
    ${why.length ? `<div class="stats">${why.map(w => `<span>${w}</span>`).join('')}</div>` : ''}
    <p class="muted">${isWegBridge(t) ? 'Eine Brücke übers Wasser – Bewohner laufen gern hinüber. Art und Farben wählst du hier.' : d.desc}</p>
    ${grow}
    ${wonder}
    ${boat}
    ${hub}
    ${train}
    ${roofInfoHtml(x, y)}
    ${castle}
    ${colors}
    <div class="row">
      ${ROTATABLE.has(t.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      ${delButton(x, y)}
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, () => state.tiles.get(x + ',' + y) === t ? openInfo(x, y) : closePanel());
  wireDel(x, y);
  wireRoofInfo(el, x, y);                                        // Überdachung (Block 138)
  $('p-move').onclick = () => startMove(x, y, -1);              // das Gebäude, nicht die Deko in seiner Ecke
  if ($('p-stage')) $('p-stage').onclick = () => stageUpgrade(x, y);
  if ($('p-expo')) $('p-expo').onclick = () => { if (sendExpedition(x + ',' + y)) openInfo(x, y); };
  // Schiffe: Modell und Ziel wählen, kaufen, verkaufen
  for (const b of el.querySelectorAll('[data-shipmodel]')) b.onclick = () => { shipPick.model = b.dataset.shipmodel; openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-vlock]')) b.onclick = () => { closePanel(); openResearch('verkehr'); };   // gesperrtes Modell: zur Forschung
  for (const b of el.querySelectorAll('[data-shipto]')) b.onclick = () => { shipPick.to = b.dataset.shipto; openInfo(x, y); };
  if (el.querySelector('[data-shipbuy]')) el.querySelector('[data-shipbuy]').onclick = () => { if (buyShip(x + ',' + y, shipPick.model, shipPick.to)) openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-shipsell]')) b.onclick = () => { if (sellShip(x + ',' + y, +b.dataset.shipsell)) openInfo(x, y); };
  for (const b of el.querySelectorAll('[data-order]')) b.onclick = () => { if (fulfillOrder(b.dataset.order, x + ',' + y)) openInfo(x, y); };   // Aufträge

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
  if ($('p-rot')) $('p-rot').onclick = () => undoable(() => {
    // Große Gebäude nur drehen, wenn die gedrehte Grundfläche frei ist
    const k = x + ',' + y, nr = ((t.rot || 0) + 1) % 4, big = isBig(t.b);
    const before = big ? new Map(state.tiles) : null;
    state.tiles.delete(k);
    if (big) restoreUnder(t, x, y);                                     // Wege darunter erst freilegen (Block 58)
    rebuildCover();
    const err = big ? placeError(t.b, x, y, nr, { move: true, t }) : null;
    if (err) { if (big) state.tiles = before; else state.tiles.set(k, t); recalc(); fail('Zum Drehen ist hier nicht genug Platz'); return; }
    if (big) {                                                          // … und unter der gedrehten Grundfläche wieder zudecken
      const covered = pathsUnder(t.b, x, y, nr, t);
      for (const [fx, fy] of covered) state.tiles.delete(fx + ',' + fy);
      setUnder(t, x, y, plazaOk(t.b) ? covered : []);
      if (replacesWeg(t.b)) state.money += covered.length * ITEMS.weg.cost;
    }
    state.tiles.set(k, t);
    t.rot = nr; t.born = performance.now(); sfx('deco'); recalc(); save();
  });
  $('p-close').onclick = closePanel;
  if (el.querySelector('[data-openart]')) el.querySelector('[data-openart]').onclick = () => { closePanel(); openResearch('design'); artJump('Wandfarben'); };
  for (const b of el.querySelectorAll('[data-look]')) b.onclick = () => {
    const n = +b.dataset.look;
    if (n === t.lvl) delete t.look; else t.look = n;
    groundVersion++;                   // anderer Schatten
    t.born = performance.now(); sfx('deco'); save(); openInfo(x, y);
  };
  if (el.querySelector('[data-orig]')) el.querySelector('[data-orig]').onclick = () => { delete t.wall; delete t.roof; rememberPaint(t); sfx('deco'); save(); openInfo(x, y); };
  // „bunt“ (Reihenhaus): Farbe weg → jedes Haus wieder in seiner eigenen
  const pick = (kind, v) => { if (v === 'bunt') delete t[kind]; else t[kind] = +v; rememberPaint(t); sfx('deco'); save(); openInfo(x, y); };
  wirePaintMore(el, t, () => openInfo(x, y));
  if (baseOf(t.b) === 'busch') wireBushCol(el, { cur: t.col || 0, key: 'busch', set: i => setCol(t, i), all: i => { const l = bushAll().filter(o => (o.col || 0) !== i); l.forEach(o => setCol(o, i)); return l.length; }, reopen: () => openInfo(x, y) });
  if (DECO_LOOKS[baseOf(t.b)]) wireDecoLook(el, baseOf(t.b), t, () => openInfo(x, y), [x, y]);
  if (t.b === 'pb_station') wirePbTrains(el, x, y);
  for (const sw of el.querySelectorAll('[data-wall]')) sw.onclick = () => pick('wall', sw.dataset.wall);
  for (const sw of el.querySelectorAll('[data-roof]')) sw.onclick = () => pick('roof', sw.dataset.roof);
  for (const sw of el.querySelectorAll('[data-win]')) sw.onclick = () => pick('win', sw.dataset.win);   // Fenster (Block 60e)
  if (t.b === 'fz_schloss') wireCastle(el, t, x, y);
  if (t.b === 'weg') wireWegForm(el, t, x, y);
  if (el.querySelector('[data-lgrow]')) el.querySelector('[data-lgrow]').onclick = () => undoable(() => { const nk = growLighthouse(x + ',' + y); if (!nk) return; sfx('build'); recalc(); save(); startFireworks(keyXY(nk).map(v => v + 1)); openInfo(...keyXY(nk)); });   // Kap (Block 83)
  wireCourt(el, t, () => openInfo(x, y));
  for (const b of el.querySelectorAll('[data-brk]')) b.onclick = () => undoable(() => { if (setBridgeKind(x, y, b.dataset.brk)) openInfo(x, y); });
  for (const b of el.querySelectorAll('[data-brs]')) b.onclick = () => undoable(() => { if (setBridgeStyle(x, y, b.dataset.brs)) openInfo(x, y); });   // Belag (66d)
  for (const [attr, key] of [['brc', 'brc'], ['brw', 'brw']]) for (const b of el.querySelectorAll(`[data-${attr}]`)) b.onclick = () => undoable(() => {   // Brückenfarben (66b)
    setBridgeColor(x, y, key, b.dataset[attr] === '' ? null : +b.dataset[attr]);   // für die ganze Brücke (66c)
    sfx('deco'); openInfo(x, y);
  });
  for (const b of el.querySelectorAll('[data-royal]')) b.onclick = () => undoable(() => { t.cs = { r: +b.dataset.royal }; t.born = performance.now(); sfx('deco'); save(); openInfo(x, y); });
  for (const b of el.querySelectorAll('[data-fl]')) b.onclick = () => undoable(() => { t.fl = Math.max(1, Math.min(6, (t.fl || ITEMS[t.b].fl0) + +b.dataset.fl)); sfx('deco'); recalc(); save(); openInfo(x, y); });   // Stockwerke (Block 60f)
  if (line) wireTrainChooser(el, line, () => openInfo(x, y));
  // Hauptbahnhof: Gleis öffnen, Gleise dazu/weg, Aussehen
  for (const b of el.querySelectorAll('[data-gleis]')) b.onclick = () => openGleis(b.dataset.gleis);
  for (const b of el.querySelectorAll('[data-slen]')) b.onclick = () => { if (+b.dataset.slen === stationLen(t)) return; const nk = undoable(() => stationLenSet(x + ',' + y, +b.dataset.slen)); if (nk) openInfo(...keyXY(nk)); };   // Block 131
  for (const b of el.querySelectorAll('[data-gres]')) b.onclick = () => { const [d, side] = b.dataset.gres.split(',').map(Number), nk = hbfResize(x + ',' + y, d, side); if (nk) openInfo(...keyXY(nk)); };   // Block 123: Seite wählen
  if ($('p-hup')) $('p-hup').onclick = () => { const nk = undoable(() => { const k = hbfUpgrade(x + ',' + y); if (k) { sfx('build'); recalc(); save(); } return k; }); if (nk) openInfo(...keyXY(nk)); else fail(hbfUpgradePlan(x + ',' + y)); };
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
  if (T.rail.stationNet.get(k) == null) return [`<div class="bad">✗ ${GLEIS.has(k) ? 'Noch keine Schiene vor dem Gleis' : bAt(...keyXY(k)) === 'ubahn' ? 'Kein Tunnel unter der Station' : 'Keine Schiene direkt am Bahnhof'}</div>`];
  if (!line) return ['<div class="bad">✗ Noch kein Ziel: Schienen oder Tunnel bis zu einem Bahnhof bzw. einer U-Bahn-Station auf einer anderen Insel legen</div>'];
  const nV = line.traffic && line.traffic.viertel || 0;
  const out = [line.inner
    ? `<div class="${nV > 1 ? 'ok' : 'bad'}">🚇 Linie auf ${regionName(line.regions[0])} · ${nV > 1 ? `verbindet ${nV} Viertel (Wünsche und Läden auch drüben)` : 'alle Halte im selben Viertel – bringt nichts, Halte in verschiedene Viertel setzen'} · ${line.loop ? '🔁 Rundkurs' : 'hin und zurück'}, ${kmText(line)}</div>`
    : `<div class="ok">🚆 Linie ${names(line).join(' ↔ ')} · ${line.loop ? '🔁 Rundkurs' : 'hin und zurück'}, ${kmText(line)}</div>`];
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
      : `<button class="look locked" data-vlock="1" title="Forschung → 🚢 Verkehr">🔒 ${v.name}</button>`).join('')}</div>
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
// Durchgang in Hecke/Zaun/Mauer: offen, Torbogen oder Rosenbogen (Block 41)
function openGateInfo(k) {
  const e = state.edges.get(k);
  if (!e) { closePanel(); return; }
  const gate = isGate(k), byPath = pathGate(k), refund = ITEMS[e.b].cost + (e.arch ? ARCHES[e.arch].cost : 0);
  const cur = e.arch || '', opts = [['', '✕ Ohne Bogen', 0], ...Object.entries(ARCHES).map(([id, A]) => [id, archLabel(e.b, id), A.cost])];
  const el = showPanel(`
    <h3>${gate ? (gardenGate(k) ? 'Gartentor · ' : 'Durchgang · ') : ''}${ITEMS[e.b].name}${gate ? '' : ` · ${styleDef(e.b, e.style).name}`}</h3>
    ${byPath ? '' : `<div class="looks">${[['0', `${ITEMS[e.b].name} geschlossen`, !e.gate], ['1', '🚪 Gartentor', e.gate === true], ['offen', '⬜ Durchgang', e.gate === 'offen']]
      .map(([v, name, on]) => `<button class="look${on ? ' on' : ''}" data-gate="${v}">${name}</button>`).join('')}</div>`}
    ${gate ? `<p class="muted">${byPath ? `Wo ein Weg durch die ${ITEMS[e.b].name} geht, ist ein Durchgang.` : gardenGate(k) ? 'Ein Gartentürchen – es geht auf, wenn jemand hindurchgeht.' : 'Eine offene Lücke ohne Türchen.'} Ein Bogen darüber bringt Schönheit; bei beleuchteten Stilen brennt nachts eine Laterne (braucht Strom wie Laternen).</p>
    <div class="looks">${opts.map(([id, name, cost]) => `<button class="look${id === cur ? ' on' : ''}" data-arch="${id}">${name}${cost && id !== cur ? ` · 🪙 ${fmt(cost)}` : ''}</button>`).join('')}</div>`
    : '<p class="muted">Ein Stück zwischen zwei Feldern. Wo ein Weg auf beiden Seiten liegt, wird es ein Durchgang – oder du setzt hier ein Tor.</p>'}
    ${edgeLookHtml(k, e)}
    <div class="label">Ecken</div>
    <div class="looks"><button class="look${e.sq ? '' : ' on'}" data-esqp="0">⌒ Rund</button><button class="look${e.sq ? ' on' : ''}" data-esqp="1">⌐ Eckig</button></div>
    <div class="label">Wege an dieser Linie</div>
    <div class="looks"><button class="look${edgeFlush(k) ? ' on' : ''}" data-flush="1">🧱 Bündig bis an die Linie</button><button class="look${edgeFlush(k) ? '' : ' on'}" data-flush="0">🌱 Mit Grasstreifen</button></div>
    ${(() => { const on = edgeFlush(k), n = [...state.edges.keys()].filter(q => edgeFlush(q) !== on).length;
      return n ? `<div class="looks"><button class="look" data-flushall="1">${on ? '🧱' : '🌱'} Für alle anderen Linien übernehmen (${n} ${n === 1 ? 'Stück' : 'Stücke'})</button></div>` : ''; })()}
    <p class="muted">Gilt für die ganze zusammenhängende Linie. Neue Linien sind von selbst bündig.</p>
    <div class="row"><button class="btn danger" id="p-del" aria-label="Entfernen">🗑️ +${fmt(refund)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => state.edges.get(k) === e ? openGateInfo(k) : closePanel());
  for (const b of el.querySelectorAll('[data-arch]')) b.onclick = () => undoable(() => { if (setArch(k, b.dataset.arch || null)) openGateInfo(k); });
  for (const b of el.querySelectorAll('[data-gate]')) b.onclick = () => undoable(() => { const v = b.dataset.gate; if (setGate(k, v === '1' ? true : v === 'offen' ? 'offen' : false)) openGateInfo(k); });
  for (const b of el.querySelectorAll('[data-flush]')) b.onclick = () => undoable(() => { if (setFlush(k, b.dataset.flush === '1')) { sfx('deco'); openGateInfo(k); } });
  for (const b of el.querySelectorAll('[data-esqp]')) b.onclick = () => undoable(() => { if (setEdgeSq(k, b.dataset.esqp === '1')) { sfx('deco'); openGateInfo(k); } });
  for (const b of el.querySelectorAll('[data-flushall]')) b.onclick = () => undoable(() => { const n = setFlushAll(edgeFlush(k)); sfx('deco'); toast(`${n} ${n === 1 ? 'Stück' : 'Stücke'} jetzt ${edgeFlush(k) ? 'bündig' : 'mit Grasstreifen'}`); openGateInfo(k); });
  $('p-del').onclick = () => { closePanel(); undoable(() => { if (removeEdge(k)) { sfx('dig'); recalc(); save(); } }); };
  $('p-close').onclick = closePanel;
  wireEdgeLook(el, k, e);
}
// Form und Farbe einer Linie (Block 145, wie Wege): erst wählen, wofür – nur dieses Stück, alle verbundenen, alle dieser Art –,
// dann Form bzw. Farbe antippen. Kostenlos, ↶ macht es rückgängig
let edgeScope = 'one';
// Vorschau einer Linienform: kleines Bild wie in der Kunstakademie (Ecke der Hecke/des Zauns), sonst nur die Farbe
function edgeStyleBg(kind, st) {
  const u = designThumb({ id: kind + ':' + st.id }, 0.6);
  return u ? `#f4efe4 url(${u}) center / contain no-repeat` : styleSwatch(st);
}
const EDGE_PLURAL = { hecke: 'Hecken', zaun: 'Zäune', mauer: 'Mauern' };            // wie die Gruppen der Kunstakademie
function edgeLookHtml(k, e) {
  const nRun = edgesScope(k, 'run').length, nAll = edgesScope(k, 'all').length;
  if (edgeScope === 'run' && nRun < 2 || edgeScope === 'all' && nAll < 2) edgeScope = 'one';
  const sc = (v, label) => `<button class="look${edgeScope === v ? ' on' : ''}" data-escope="${v}">${label}</button>`;
  const have = STYLES[e.b].filter(styleOk), more = STYLES[e.b].length - have.length;
  return `<div class="label">Ändern</div>
    <div class="looks">${sc('one', 'Nur dieses Stück')}${nRun > 1 ? sc('run', `Alle verbundenen (${nRun})`) : ''}${nAll > nRun ? sc('all', `Alle ${EDGE_PLURAL[e.b]} (${nAll})`) : ''}</div>
    <div class="label">Form: ${escHtml(styleDef(e.b, e.style).name)}</div>
    <div class="swatches">${have.map(st => `<button class="sw esw${st.id === e.style ? ' on' : ''}" data-estyle="${st.id}" style="background:${edgeStyleBg(e.b, st)}" title="${escHtml(st.name)}" aria-label="Form: ${escHtml(st.name)}"></button>`).join('')}${more ? `<button class="sw" data-emore="1" title="${more} weitere Formen in der Kunstakademie" aria-label="${more} weitere Formen in der Kunstakademie">🎨</button>` : ''}</div>
    ${e.b === 'hecke' ? bushColHtml(e.col || 0, 'hecke', 0) : ''}`;
}
function wireEdgeLook(el, k, e) {
  const reopen = () => state.edges.get(k) ? openGateInfo(k) : closePanel();
  for (const b of el.querySelectorAll('[data-escope]')) b.onclick = () => { edgeScope = b.dataset.escope; reopen(); };
  for (const b of el.querySelectorAll('[data-estyle]')) b.onclick = () => undoable(() => { if (restyleEdges(edgesScope(k, edgeScope), b.dataset.estyle)) { sfx('deco'); reopen(); } });
  const more = el.querySelector('[data-emore]');
  if (more) more.onclick = () => { closePanel(); openResearch('design'); artJump(EDGE_PLURAL[e.b]); };
  if (e.b === 'hecke') wireBushCol(el, { cur: e.col || 0, key: 'hecke', set: i => recolorEdges(edgesScope(k, edgeScope), i), all: () => 0, reopen });
}
// Marktstand: gehört er zu einem Marktplatz, was bringt der, wann ist Markttag
function marktStatus(k) {
  const all = computeMarkets(), m = all.find(e => e.stands.includes(k)), n = m ? m.stands.length : 1;
  if (!m || !m.stage) return [`<div class="bad">✗ Noch kein Marktplatz: ${n} von ${MARKT_STEPS[0][0]} Ständen auf diesem Platz. Stell weitere auf denselben Platz (Wege als Block ziehen).</div>`];
  const next = MARKT_STEPS[m.stage], shops = [...T.st].filter(([, s]) => s.markt).length, left = marktLeft();
  return [`<div class="ok">🧺 ${MARKT_STEPS[m.stage - 1][1]}: ${n} Stände${next ? ` <small class="muted">(ab ${next[0]}: ${next[1]})</small>` : ''}</div>`,
    `<div class="ok">🛍️ Läden bis ${MARKT_REACH} Felder um den Platz verdienen +${Math.round(MARKT_BONUS * 100)} % (${shops} ${shops === 1 ? 'Laden' : 'Läden'})</div>`,
    `<div class="ok">👥 Zieht ${MARKT_ATTR[m.stage]} Besucher auf die Insel (per Bahn und Schiff)</div>`,
    `<div class="${left ? 'ok' : ''}">🧺 ${left ? `Markttag! Läden im Marktviertel doppelt · noch ${fmtClock(left)}` : `Nächster Markttag in ${fmtClock(marktNext())}`}</div>`];
}
// Park (Block 44): Stufe, was zur nächsten fehlt, was er bringt
function parkStatus(k) {
  const p = computeParks().find(e => e.tiles.includes(k));
  if (!p) return [];
  const out = [], next = PARK_STEPS[p.stage];
  out.push(p.stage ? `<div class="ok">🌳 ${PARK_STEPS[p.stage - 1].name}: ${p.tiles.length} Felder Rasen, ${p.deco} Deko</div>`
    : `<div class="bad">✗ Noch kein Park: ${p.tiles.length} Felder Rasen, ${p.deco} Deko</div>`);
  if (next) {
    const miss = [];
    if (p.tiles.length < next.tiles) miss.push(`${next.tiles - p.tiles.length} ${next.tiles - p.tiles.length === 1 ? 'Feld' : 'Felder'} Rasen`);
    if (p.deco < next.deco) miss.push(`${next.deco - p.deco} Deko`);
    for (const n of next.need) if (!p.sorts.has(n)) miss.push(PARK_SORT_NAMES[n]);
    out.push(`<div class="muted">Für „${next.name}“ fehlt noch: ${miss.join(', ')}</div>`);
  }
  if (p.stage) out.push(`<div class="ok">🏡 Erfüllt den Park-Wunsch: Häuser bis ${PARK_REACH} Felder und im selben Viertel</div>`,
    `<div class="ok">🌸 +${PARK_BEAUTY[p.stage]} Schönheit – auch für Häuser bis ${PARK_NEAR[p.stage]} Felder drumherum</div>`,
    `<div class="ok">👥 Zieht ${PARK_ATTR[p.stage]} Besucher auf die Insel (per Bahn und Schiff)</div>`);
  return out;
}
// Tunnel (Block 136): Fenster für ein Tunnelfeld ohne etwas darüber – Entfernen, Hinweis zur Einfahrt
const TUNNEL_EIN_HINT = '🚇 Schiene und Tunnel verbindet eine Tunneleinfahrt (Verkehr): ans Tunnelende setzen, Schiene ans offene Ende.';
function openTunnelInfo(x, y) {
  const c = costOf('tunnel', x, y), atRail = DIRS.some(([dx, dy]) => bAt(x + dx, y + dy) === 'schiene');
  showPanel(`
    <h3>🚇 Tunnel</h3>
    <p class="muted">Liegt unter der Erde – zu sehen nur mit Tunnel, Einfahrt, U-Bahn-Station, Schiene oder 🧹 in der Hand.${terrainAt(x, y) === 'water' ? ' Hier unter Wasser.' : ''}</p>
    ${atRail ? `<div class="status"><div class="bad">✗ Schiene direkt am Tunnel fährt nicht hinein. ${TUNNEL_EIN_HINT}</div></div>` : ''}
    <div class="row"><button class="btn danger" id="p-del" aria-label="Tunnel hier entfernen">🗑️ +${fmt(c.cost)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => tunnelAt(x, y) && !COVER.has(x + ',' + y) ? openTunnelInfo(x, y) : closePanel());
  $('p-del').onclick = () => { closePanel(); undoable(() => demolish(x, y)); };
  $('p-close').onclick = closePanel;
}
function openParkInfo(x, y) {
  const k = x + ',' + y;
  showPanel(`
    <h3>🌳 Parkrasen</h3>
    <div class="status">${parkStatus(k).join('')}</div>
    <p class="muted">Stell Bäume, Beete, Bänke und Brunnen auf den Rasen. Wege dürfen hindurch.</p>
    ${parkFestLine()}
    <div class="row">${parkBest() && !parkFestLeft() && !parkFestWait() ? '<button class="btn" id="p-fest">🎉 Parkfest feiern</button>' : ''}<button class="btn danger" id="p-del" aria-label="Rasen hier entfernen">🗑️ +${fmt(ITEMS.parkrasen.cost)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => terraLook(x, y) === 'park' ? openParkInfo(x, y) : closePanel());
  if ($('p-fest')) $('p-fest').onclick = () => { if (startParkFest()) openParkInfo(x, y); };
  $('p-del').onclick = () => { closePanel(); undoable(() => removeLawn(x, y)); };
  $('p-close').onclick = closePanel;
}
// Freizeitpark (Block 60): Stufe, was zur nächsten fehlt, was er bringt
function fzStatus(k) {
  const p = computeFz().find(e => e.tiles.includes(k));
  if (!p) return [];
  const out = [], next = FZ_STEPS[p.stage];
  out.push(p.stage ? `<div class="ok">${FZ_STEPS[p.stage - 1].icon} ${FZ_STEPS[p.stage - 1].name}: ${p.tiles.length} Felder, ${p.rides} ${p.rides === 1 ? 'Attraktion' : 'Attraktionen'}</div>`
    : `<div class="bad">✗ Noch kein Freizeitpark: ${p.tiles.length} Felder, ${p.rides} ${p.rides === 1 ? 'Attraktion' : 'Attraktionen'}</div>`);
  if (next) {
    const miss = [];
    if (p.tiles.length < next.tiles) miss.push(`${next.tiles - p.tiles.length} Felder Boden`);
    if (p.rides < next.rides) miss.push(`${next.rides - p.rides} ${next.rides - p.rides === 1 ? 'Attraktion' : 'Attraktionen'}`);
    for (const n of next.need) if (!p.sorts.has(n)) miss.push(FZ_SORT_NAMES[n]);
    out.push(`<div class="muted">Für „${next.icon} ${next.name}“ fehlt noch: ${miss.join(', ')}</div>`);
  }
  if (p.stage) out.push(`<div class="ok">🎟️ Eintritt: alle Einnahmen +${Math.round(FZ_INC[p.stage] * 100)} % · 👥 ${FZ_ATTR[p.stage]} Besucher · 🌸 +${FZ_BEAUTY[p.stage]}, auch für Häuser bis ${FZ_NEAR[p.stage]} Felder</div>`);
  return out;
}
// Parade (Block 60d): läuft, wartet oder ist bereit
function fzFestLine() {
  const left = fzFestLeft(), wait = fzFestWait(), st = fzBest();
  if (left) return `<div class="ok">🎆 Parade! Einnahmen ×${String(state.fzFest.mul).replace('.', ',')} · noch ${fmtClock(left)}</div>`;
  if (!st) return '<div class="muted">🎆 Mit einem fertigen Freizeitpark kannst du eine Parade mit Feuerwerk feiern.</div>';
  if (wait) return `<div class="muted">🎆 Nächste Parade in ${fmtClock(wait)}</div>`;
  return `<div class="ok">🎆 Parade bereit: 3 Minuten Einnahmen ×${String(FZFEST_MUL[st]).replace('.', ',')}, mit Feuerwerk und Umzug</div>`;
}
function openFzInfo(x, y) {
  const k = x + ',' + y;
  showPanel(`
    <h3>🎢 Freizeitpark-Boden</h3>
    <div class="status">${fzStatus(k).join('')}</div>
    <p class="muted">Stell Fahrgeschäfte, Stände und Deko auf den Boden (🎡 Freizeit → 🎢 Freizeitpark). Je größer und bunter, desto höher die Stufe: 🎪 Rummelplatz, 🎠 Freizeitpark, 🏰 Wunderland.</p>
    ${fzFestLine()}
    <div class="row">${fzBest() && !fzFestLeft() && !fzFestWait() ? '<button class="btn" id="p-fest">🎆 Parade feiern</button>' : ''}<button class="btn danger" id="p-del" aria-label="Boden entfernen">🗑️ +${fmt(ITEMS.fzboden.cost)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => terraLook(x, y) === 'fz' ? openFzInfo(x, y) : closePanel());
  if ($('p-fest')) $('p-fest').onclick = () => { if (startFzFest()) openFzInfo(x, y); };
  $('p-del').onclick = () => { closePanel(); undoable(() => removeFzGround(x, y)); };
  $('p-close').onclick = closePanel;
}
// Parkfest: läuft, wartet oder ist bereit (nach der besten Park-Stufe)
function parkFestLine() {
  const left = parkFestLeft(), wait = parkFestWait(), st = parkBest();
  if (left) return `<div class="ok">🎉 Parkfest! Einnahmen ×${String(state.parkFest.mul).replace('.', ',')} · noch ${fmtClock(left)}</div>`;
  if (!st) return '<div class="muted">🎉 Mit einem fertigen Park kannst du ein Parkfest feiern.</div>';
  if (wait) return `<div class="muted">🎉 Nächstes Parkfest in ${fmtClock(wait)}</div>`;
  return `<div class="ok">🎉 Parkfest bereit: 3 Minuten Einnahmen ×${String(PARKFEST_MUL[st]).replace('.', ',')}</div>`;
}
const wares0 = S => S.raw ? ['holz', 'stein', 'erz', 'obst'] : S.all ? Object.keys(RES) : S.ware ? [S.ware] : [];
function shopStatus(t, s, k) {
  const S = SHOPS[t.b], out = [], kd = s.kunden || 0, name = ITEMS[t.b].name, cap = shopCap(t.b), staff = S.workers || 1;
  const shared = [s.same > 1 ? `die Einwohner mit ${s.same - 1} weiteren im Viertel` : '', s.sameIsle > 1 ? `die Besucher mit ${s.sameIsle - 1} weiteren auf der Insel` : ''].filter(Boolean);
  out.push(kd >= 1 ? `<div>🛒 Kundschaft: ${fmt(kd)} von höchstens ${fmt(cap)}${shared.length ? ` – teilt sich ${shared.join(' und ')}` : ' (Einwohner im Viertel + Besucher der Insel)'}</div>`
    : '<div class="bad">✗ Noch keine Kundschaft: Häuser ins selbe Viertel (über Wege verbunden) – oder Besucher per Bahn und Schiff</div>');
  if (s.markt) out.push(`<div class="ok">🧺 Marktviertel: +${Math.round(MARKT_BONUS * 100)} %${marktLeft() ? ' · Markttag: doppelt!' : ''}</div>`);
  if (s.buy < 0.995) out.push(`<div>💰 Kaufkraft: Die Leute im Viertel kaufen schon in vielen Läden ein – dieser Laden verdient hier ${Math.round(s.buy * 100)} %. Weitere Läden bringen nur noch wenig dazu, mehr Einwohner und Besucher dagegen voll.</div>`);
  if (s.full) out.push(`<div class="bad">👷 Voll: ${staff === 1 ? 'Ein Mitarbeiter bedient' : `${staff} Mitarbeiter bedienen`} ${fmt(cap)} Kunden, ${fmt(s.want - kd)} gehen leer aus. Ein zweiter Laden dieser Art (${name}) hätte Kundschaft.</div>`);
  const next = [...INNER_STEPS].reverse().find(([min]) => (s.types || 0) < min);
  out.push(`<div class="${s.inner ? 'ok' : ''}">🛍️ Innenstadt: ${s.types || 0} verschiedene Läden im Viertel${s.inner ? ` · +${Math.round(s.inner * 100)} %` : ''}${next ? ` <small class="muted">(ab ${next[0]}: +${Math.round(next[1] * 100)} %)</small>` : ''}</div>`);
  // Verkauft wird, was wirklich über den Ladentisch geht (soldRate) – nicht, was die Kundschaft gern hätte
  const sold = sl => soldRate[k + '|' + sl.res] ?? (saleable(sl.res) > 0 ? sl.rate : 0);     // noch nie gerechnet: was der Laden will
  const sales = (s.sales || []).filter(sl => sold(sl) > 1e-3);
  if (S.all || S.raw) out.push(sales.length ? `<div class="ok">📦 Verkauft ${sales.map(sl => RES[sl.res].icon).join('')} aus dem Lager → +${fmtRate(sales.reduce((a, sl) => a + sold(sl) * sl.pay, 0))}/s</div>`
    : wares0(S).some(r => state.res[r] >= 1) ? `<div>📦 Im Lager liegt nur der Vorrat (🔒) – den verkauft der Laden nicht. Im 📦 Lager einstellbar.</div>`
    : '<div class="bad">📦 Das Lager ist leer – nichts zu verkaufen</div>');
  else if (S.ware) {
    const sl = (s.sales || [])[0], r = RES[S.ware];
    const kp = keepOf(S.ware), keepTxt = kp ? ` <small class="muted">(🔒 ${kp >= KEEP_ALL ? 'alles' : fmt(kp)} bleiben im Lager)</small>` : '';
    out.push(sl && sold(sl) > 1e-3 ? `<div class="ok">${r.icon} Verkauft ${fmtRate(sold(sl) * 60)} ${r.name}/min → +${fmtRate(sold(sl) * sl.pay)}/s${keepTxt}</div>`
      : saleable(S.ware) > 0 ? '' : state.res[S.ware] > 0 ? `<div>${r.icon} ${r.name}: nur der Vorrat ist da (🔒 ${kp >= KEEP_ALL ? 'alles' : fmt(kp)}) – den verkauft der Laden nicht. Im 📦 Lager einstellbar.</div>`
      : `<div class="bad">${r.icon} Kein ${r.name} im Lager${WARE_FROM[S.ware] ? ` – wächst auf fernen Inseln (${WARE_FROM[S.ware]})` : ''}. Mit ${r.name} verdient der Laden viel mehr.</div>`);
  }
  if (S.attr) out.push(`<div class="ok">👥 Zieht ${S.attr} Besucher auf die Insel (per Bahn und Schiff)</div>`);
  if (S.hotel) out.push(`<div class="ok">🏨 Die Insel zieht ${Math.round(S.hotel * 100)} % mehr Besucher an</div>`);
  return out;
}
// Kleiner Bahnhof: Länge 2 oder 3 Felder (Block 131)
function stationLenHtml(x, y, t) {
  const n = stationLen(t), other = n === 3 ? 2 : 3, p = stationLenPlan(x + ',' + y, other), { money, ...mat } = STATION_LEN_COST;
  return `<div class="label">Länge</div>
    <div class="looks">${[2, 3].map(v => `<button class="look${v === n ? ' on' : ''}" data-slen="${v}" ${v !== n && typeof p === 'string' && !/Taler|Material/.test(p) ? 'disabled' : ''}>${v} Felder${v === 3 ? ' · Tür mittig' : ''}${v === 3 && n === 2 && stationLenPaid(t) < 3 ? ` · 🪙 ${fmt(money)} ${matText(mat)}` : v === 3 && n === 2 ? ' · bezahlt' : ''}</button>`).join('')}</div>
    ${typeof p === 'string' && n === 2 && !/Taler|Material/.test(p) ? `<p class="muted">${p}.</p>` : '<p class="muted">Mit 3 Feldern steht die Tür genau auf einem Feld – passend zu einem 1er-Weg.</p>'}`;
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
  const k = x + ',' + y, wing = hbfWing(t), L = hbfLeft(t), { money: gm, ...gmat } = GLEIS_COST;
  const atDoor = hbfEntrance(t, x, y).some(([ex, ey]) => wegAt(ex, ey) != null), v = NET && NET.vOf(x + ',' + y), village = v && NET.vHome.has(v);
  const door = atDoor ? `<div class="status"><div class="ok">🛤️ Weg am Eingang${village ? ' – mit dem Dorf verbunden' : ''}</div></div>`   // Block 85
    : '<p class="muted">🛤️ Leg einen Weg vor das Portal (die Seite gegenüber den Gleisen) – dann führt er bis an die Tür und verbindet den Bahnhof mit dem Dorf.</p>';
  // + / − Gleis je Seite der Halle (Block 123); alter Bahnhof ohne Halle: nur rechts, dazu „Halle bauen“
  const hard = e => e && !/Taler|Material/.test(e), sides = wing ? [[-1, 'links', L], [1, 'rechts', n - L]] : [[1, '', n]];
  const errs = sides.map(([sd, nm]) => [nm, hbfResizeError(k, 1, sd)]).filter(([, e]) => hard(e)).map(([nm, e]) => `${nm ? '+ ' + nm + ': ' : ''}${e}.`);
  const resize = sides.map(([sd, nm, cnt]) => {
    const add = hbfResizeError(k, 1, sd), minus = wing ? cnt > 1 : n > HBF_MIN;
    return `<button class="btn" data-gres="1,${sd}" data-cost="${gm}" data-mat='${JSON.stringify(gmat)}' ${hard(add) ? 'disabled' : ''}>+ Gleis${nm ? ' ' + nm : ''}</button>${minus ? `<button class="btn ghost" data-gres="-1,${sd}">− ${nm || 'Gleis'}</button>` : ''}`;
  });
  const up = wing ? null : hbfUpgradePlan(k);
  return `${door}<div class="label">🚉 ${n} Gleise${wing ? ` · ${L} links, ${n - L} rechts der Halle` : ''}</div>
    <div class="ships">${rows.join('')}</div>
    ${hubRegions.size > 1 ? `<div class="status"><div class="ok">🔀 Umsteigen: ${[...hubRegions].map(r => `${regionIcon(r)} ${regionName(r)}`).join(', ')} sind hier miteinander verbunden</div></div>` : ''}
    <div class="row">${resize.join('')}</div>
    <p class="muted">Ein Gleis: ${costText(GLEIS_COST)}${gleisePaid(t) > n ? ` (${gleisePaid(t) - n} schon bezahlt – kostenlos wieder dazu)` : ''}. ${errs.length ? errs.join(' ') + ' ' : ''}Vor jedes Gleis eine eigene Strecke legen – mit einem Feld Abstand, sonst hängen sie zusammen und sind eine Linie.</p>
    ${wing ? '' : `<div class="label">Halle</div>
    <p class="muted">Neue Hauptbahnhöfe haben die Eingangshalle in der Mitte: Gleis – Steig – Halle – Steig – Gleis. ${typeof up === 'string' ? up + '.' : 'Gleise können dabei ein Feld rücken – die Strecken davor dann anpassen.'}</p>
    <div class="row"><button class="btn" id="p-hup" ${typeof up === 'string' ? 'disabled' : ''}>▣ Halle in die Mitte bauen</button></div>`}
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
const STOPS = new Set(['station', 'ubahn', 'hbf', 'seilbahn', 'hafen', 'bootssteg']);
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
      : `<button class="look locked" data-vlock="1" title="Forschung → 🚢 Verkehr">🔒 ${m.name}</button>`).join('')}</div>
    ${i === 0 && TRAIN_MODELS.some(m => !vehicleOk('zug', m.id)) ? `<p class="muted">🔒 Weitere Zugarten (mehr Wagen, schneller) gibt es in der Forschung → 🚢 Verkehr – antippen bringt dich hin.</p>` : ''}
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
  for (const b of el.querySelectorAll('[data-vlock]')) b.onclick = () => { closePanel(); openResearch('verkehr'); };   // gesperrt: zur Forschung (Nutzer: „wieso kein Schnellzug?“)
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
  const d = decosAt(x + ',' + y)[slot], it = ITEMS[d.b], sv = d.b === 'souvenir' && svById(d.sv);
  showPanel(`
    <h3>${sv ? escHtml(svName(sv)) : it.name}</h3>
    ${sv ? `<p class="muted">🎁 Souvenir${sv.t ? ` aus ${escHtml(sv.t)}` : ''}${sv.at ? `, geschenkt am ${new Date(sv.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}` : ''}. Entfernen legt es zurück ins Sammelregal.</p>` : ''}
    <div class="stats"><span>🌸 +${it.beauty}${nearHouse(x, y) || isHouse(x, y) ? ' ×1,5 neben Häusern' : ''}</span></div>
    ${terraLook(x, y) === 'park' ? `<div class="status">${parkStatus(x + ',' + y).join('')}</div>` : ''}
    ${d.b === 'busch' ? bushColHtml(d.col || 0, 'busch', bushAll().filter(o => o !== d && (o.col || 0) !== (d.col || 0)).length) : ''}
    ${DECO_LOOKS[baseOf(d.b)] ? decoLookHtml(baseOf(d.b), d) : ''}
    <div class="row">
      ${ROTATABLE.has(d.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      <button class="btn danger" id="p-del" aria-label="Entfernen">🗑️${decoBack(d) ? ` +${fmt(decoBack(d))}` : ''}</button>
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, () => (decosAt(x + ',' + y) || [])[slot] === d ? openDecoInfo(x, y, slot) : closePanel());   // weg (↶, Verschieben): Fenster zu
  if ($('p-rot')) $('p-rot').onclick = () => undoable(() => { d.rot = ((d.rot || 0) + 1) % 4; d.born = performance.now(); sfx('deco'); save(); });
  $('p-del').onclick = () => { closePanel(); undoable(() => removeSmall(x, y, slot)); };
  $('p-move').onclick = () => startMove(x, y, slot);
  $('p-close').onclick = closePanel;
  if (d.b === 'busch') wireBushCol($('panel'), { cur: d.col || 0, key: 'busch', set: i => setCol(d, i), all: i => { const l = bushAll().filter(o => (o.col || 0) !== i); l.forEach(o => setCol(o, i)); return l.length; }, reopen: () => openDecoInfo(x, y, slot) });
  if (DECO_LOOKS[baseOf(d.b)]) wireDecoLook($('panel'), baseOf(d.b), d, () => openDecoInfo(x, y, slot));
}

// Deko auf dem Dach (Block 138b): wie am Boden – Farbe/Form, Drehen, Entfernen (Verschieben geht mit dem Dach)
function openRoofTopInfo(x, y, slot) {
  const r = roofAt(x, y), d = roofTopsOf(r)[slot];
  if (!d) { closePanel(); return; }
  const it = ITEMS[d.b], reopen = () => roofTopsOf(roofAt(x, y))[slot] === d ? openRoofTopInfo(x, y, slot) : closePanel();
  showPanel(`
    <h3>${it.name}</h3><p class="muted">Steht auf dem Dach der Steinarkaden.</p>
    <div class="stats"><span>🌸 +${it.beauty}${nearHouse(x, y) || isHouse(x, y) ? ' ×1,5 neben Häusern' : ''}</span></div>
    ${d.b === 'busch' ? bushColHtml(d.col || 0, 'busch', bushAll().filter(o => o !== d && (o.col || 0) !== (d.col || 0)).length) : ''}
    ${DECO_LOOKS[baseOf(d.b)] ? decoLookHtml(baseOf(d.b), d) : ''}
    <div class="row">
      ${ROTATABLE.has(d.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      <button class="btn danger" id="p-del" aria-label="Entfernen">🗑️${decoBack(d) ? ` +${fmt(decoBack(d))}` : ''}</button>
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, reopen);
  if ($('p-rot')) $('p-rot').onclick = () => undoable(() => { d.rot = ((d.rot || 0) + 1) % 4; d.born = performance.now(); sfx('deco'); save(); });
  $('p-del').onclick = () => { closePanel(); undoable(() => removeRoofTop(x, y, slot)); };
  $('p-close').onclick = closePanel;
  if (d.b === 'busch') wireBushCol($('panel'), { cur: d.col || 0, key: 'busch', set: i => setCol(d, i), all: i => { const l = bushAll().filter(o => (o.col || 0) !== i); l.forEach(o => setCol(o, i)); return l.length; }, reopen });
  if (DECO_LOOKS[baseOf(d.b)]) wireDecoLook($('panel'), baseOf(d.b), d, reopen);
}

function openLandmark(x, y) {
  const t = state.tiles.get(x + ',' + y), type = t.lm, L = LANDMARKS[type];
  const info = restoreInfo(type), owned = ownedTile(x, y), half = T.lmHalf.has(type);
  const dots = '🏮'.repeat(info.stage) + '<span class="off">🏮</span>'.repeat(3 - info.stage);
  const stageName = info.stage ? LM_STAGES[type][info.stage - 1].name : 'verfallen';
  let body = '';
  if (info.next) {
    const { money, mat } = info;
    const costs = costSpans(money, mat);
    const unl = lmUnlockNames(type, info.stage);
    body = `
      <div class="label">Nächste Stufe: ${info.next.name}</div>
      <div class="stats">${costs}</div>
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
  if ($('p-move')) $('p-move').onclick = () => startMove(x, y, -1);
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
  if ($('p-steg')) $('p-steg').onclick = () => { closePanel(); ({ top: menuTop, sub: menuSub } = menuPlaceOf('bootssteg')); buildToolbar(); setTool('bootssteg'); };
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
      ${steg ? '' : '<div class="bad">✗ Ein Steg am Ufer (🏘️ Stadt → 🚆 Verkehr → Steg)</div>'}</div>
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
// Vorschau eines Kunstakademie-Stücks (Wunsch Nutzer 08.10.2026: „man kauft 3 Minuten Einkommen und merkt erst danach, ob es
// schön ist“): Wand-/Dachfarbe an einem Haus, Busch, Form/Farbe von Stadtschmuck, Hecke/Zaun/Mauer als Ecke, Wegmuster als ganzes
// Feld, Deko als Bild. scale 1 im Raster, größer auf der Karte
const designThumbs = new Map();
function designThumb(d, scale = 1) {
  const key = d.id + '|' + scale;
  if (designThumbs.has(key)) return designThumbs.get(key);
  let c = null;
  const [k, a, b] = d.id.split(':');
  if (k === 'wall' || k === 'roof') c = thumb('haus', 2, { [k]: +a, ...(k === 'wall' ? { roof: 4 } : { wall: 0 }) }, scale);
  else if (k === 'busch') c = thumb('busch', 1, { col: Math.max(0, BUSH_COLS.findIndex(x => x.id === a)), rot: 0, slot: 0 }, scale);
  else if (d.look) c = thumb(d.look[0], 1, { form: a === 'form' ? d.look[1] : 0, col: a === 'col' ? d.look[1] : 0, rot: 0, slot: 0 }, scale);
  else if (d.muster) c = thumb('weg', 1, { style: wegStyleOf(d.muster, WEG_MUSTER_BY[d.muster].farbe), wide: true }, scale);
  else if (STYLES[k] && EDGE_TOOLS.has(k)) c = thumb(k, 1, { style: a }, scale);
  else if (d.item) c = thumb(d.item, 1, null, scale);
  let url = '';
  try { url = c ? c.toDataURL() : ''; if (!url.startsWith('data:image')) url = ''; } catch (e) { url = ''; }
  designThumbs.set(key, url);
  return url;
}
// Karte zu einem Stück: großes Bild, Preis, Kaufen – vorher kaufte schon das Antippen im Raster. Wo man in der Liste war, merkt sich
// designScroll: „Zurück“ landet wieder dort (Wunsch Nutzer: beim Stöbern nicht jedes Mal neu runterscrollen)
let designScroll = 0;
function backToDesign() {
  openResearch('design');
  const c = $('modal-card'), sc = c.querySelector(':scope > .tab-scroll') || c, top = designScroll;
  sc.scrollTop = top; queueMicrotask(() => { sc.scrollTop = top; });
}
function openDesignCard(id) {
  const d = DESIGN_BY_ID[id];
  if (!d) return;
  const c0 = $('modal-card');
  if (!$('modal').hidden && c0.querySelector('[data-rtab="design"].on')) designScroll = (c0.querySelector(':scope > .tab-scroll') || c0).scrollTop;   // aus der Liste geöffnet
  const have = !d.price || state.design.has(d.id) || (d.muster && wegMusterOk(d.muster)), err = have ? null : designError(d), url = designThumb(d, 2.5);
  const extra = d.muster ? 'Ein Muster gibt es in allen Wegfarben – die wählst du beim Bauen.' : (d.group === 'Wandfarben' || d.group === 'Dachfarben') ? 'Gilt für alle Häuser und Gebäude, die du umfärbst.' : '';
  openModal(`
    <h2>${d.master ? '✦ ' : ''}${escHtml(d.name)}${d.col && (d.group === 'Wandfarben' || d.group === 'Dachfarben') ? ` <i class="dcol" style="background:${d.col}"></i>` : ''}</h2>
    <div class="dcard">${url ? `<img src="${url}" alt="">` : `<i style="background:${d.col || '#eee'}"></i>`}</div>
    ${d.muster && !WEG_MUSTER_BY[d.muster].fixed ? `<div class="swatches dcard-cols">${['sand', 'hell', 'granit', 'anthrazit', 'sandstein', 'terrakotta', 'ziegel', 'rose', 'hellblau', 'salbei', 'holz']
      .map(f => `<i class="sw wsq" style="background:${styleSwatch(styleDef('weg', wegStyleOf(d.muster, f)))}" title="${WEG_FARBEN_BY[f].name}"></i>`).join('')}</div>` : ''}
    <p class="muted">${escHtml(d.group)}${d.master ? ' · Meisterstück' : ''}${extra ? ' · ' + extra : ''}</p>
    <div class="row">${have ? '<button class="btn" disabled style="flex:1">✓ Schon da</button>'
      : `<button class="btn" id="m-buy" style="flex:1" ${err ? 'disabled' : ''}>Kaufen · ${designCostText(d)}</button>`}
      <button class="btn ghost" id="m-back" style="flex:1">Zurück</button></div>
    ${!have && err ? `<p class="muted">${escHtml(err)}</p>` : ''}`, () => openDesignCard(id));   // frischt sich selbst auf (Taler)
  $('modal-card').classList.add('research');
  $('m-back').onclick = backToDesign;
  if ($('m-buy')) $('m-buy').onclick = () => { if (buyDesign(id)) openDesignCard(id); };
}
// Wegmuster, die es nicht zu kaufen gibt (Ort, Album) – mit Vorschau, wie die gekauften (Block 125)
const giftStyles = () => WEG_MUSTER.filter(m => !m.design).filter(m => m.lm || m.album).map(m => {
  const have = wegMusterOk(m.id);
  return `<button class="design gift${have ? ' have' : ''}" disabled title="${m.name}">
    <i class="dlook wlook" style="background:${wegMusterSwatch(m.id)}"></i><span class="dn">${m.name}</span>
    <small>${have ? '✓' : '🎁 ' + unlockText({ lm: m.lm, album: m.album }, true)}</small></button>`;
}).join('');
// Vorschau eines Musters (in seiner Grundfarbe) – in der Kunstakademie sieht man, was man kauft (Wunsch Nutzer 08.10.2026)
const wegMusterSwatch = m => styleSwatch(styleDef('weg', wegStyleOf(m, WEG_MUSTER_BY[m].farbe)));

// Forschung
// Forschung mit zwei Seiten: Wissen (Ideen, drei Stufen nach Schule/Bibliothek/Uni) und Kunstakademie (Aussehen, Taler + Ideen)
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
            const needs = [...(open ? [] : [`eine ${TECH_TIERS[tier].name}`]), ...(reqOk ? [] : t.req.map(r => TECH_BY_ID[r].name)), ...(lmOk ? [] : [unlockText({ lm: t.lm })])];
            const need = needs.length && !done ? `<span class="muted">braucht ${needs.join(', ')}</span>` : '';
            return `<div class="tech${done ? ' done' : ''}${!ready && !done ? ' locked' : ''}" data-techid="${t.id}">
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
      <p>Such dir aus, was dir gefällt – jedes Stück einzeln, für Taler und Ideen. Du hast <b>🪙 ${fmt(state.money)}</b> und <b>💡 ${fmt(state.science)}</b>.
        ${master ? '' : '<span class="muted">Meisterstücke (✦) braucht eine Kunstakademie.</span>'}</p>
      ${groups.map(gr => `<div class="label">${gr}</div><div class="design-grid">${DESIGN.filter(d => d.group === gr).map(d => {
        const have = !d.price || state.design.has(d.id) || (d.muster && wegMusterOk(d.muster)), err = have ? null : designError(d);
        const pic = designThumb(d);
        const dot = d.col && (d.group === 'Wandfarben' || d.group === 'Dachfarben') ? `radial-gradient(circle at 84% 20%, ${Array.isArray(d.col) ? d.col[0] : d.col} 0 8px, rgba(107,79,58,.35) 8.5px 9.5px, transparent 10px), ` : '';   // Farben: Punkt dazu
        const look = pic ? `<i class="dthumb" style="background:${dot}#f6efe2 url(${pic}) center / contain no-repeat"></i>`   // echte Vorschau (Block 125)
          : d.look ? `<i class="dlook" style="background:#f6efe2 url(${lookThumb(d.look[0], d.look[1], 0)}) center / contain no-repeat"></i>`   // Form von Stadtschmuck (Block 106)
          : d.col ? `<i style="background:${d.col}"></i>` : `<span class="emoji">${{ laterne: '🏮', pavillon: '⛩️', statue: '⭐' }[d.item] || '🎨'}</span>`;
        return `<button class="design${have ? ' have' : ''}${err ? ' cant' : ''}" data-design="${d.id}" title="${d.name}">
          ${look}<span class="dn">${d.group === 'Wandfarben' || d.group === 'Dachfarben' ? '' : d.name.replace(/^Farbe /, '')}</span>
          <small>${have ? '✓' : `${d.master ? '✦ ' : ''}🪙 ${fmt(designPrice(d))}<br>💡 ${fmt(designIdeas(d))}`}</small></button>`;
      }).join('')}${gr === 'Wegmuster' ? giftStyles() : ''}</div>${gr === 'Wegmuster' ? '<p class="muted">Ein Muster gibt es dann in allen Wegfarben – die wählst du beim Bauen.</p>' : ''}`).join('')}`;
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
  for (const b of document.querySelectorAll('[data-design]')) b.onclick = () => openDesignCard(b.dataset.design);   // erst ansehen, dann kaufen
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
  const menu = buildGroups();
  const groupOf = e => e.kind === 'lm' ? 'lm' : e.kind === 'wonder' ? 'wunder' : isHome(e.b) ? 'wohnen'
    : (menu.find(g => g.items.includes(e.b)) || { id: 'andere' }).id;
  const defs = [...menu.map(g => ({ id: g.id, label: g.label, bulk: g.id !== 'wunder' })), { id: 'andere', label: '🧩 Sonstiges', bulk: true }, { id: 'lm', label: '🏮 Sehenswürdigkeiten', bulk: false }];
  return defs.map(d => ({ ...d, items: ready.filter(e => groupOf(e) === d.id) })).filter(g => g.items.length);
}
const sumCost = list => { const c = {}; for (const e of list) for (const [r, n] of Object.entries(e.cost || {})) c[r] = (c[r] || 0) + n; return c; };
// Rathaus → Bewohner (Block 55): alle Familien nach Tierart, mit Haus und Herzen; Arten, die noch kommen, ausgegraut
const resOpen = new Map();                         // aufgeklappte Arten (nur für diese Sitzung)
function residentsHtml() {
  const by = new Map(ANIMALS.map(a => [a.id, []]));
  for (const [k, t] of state.tiles) {
    if (!isHome(t.b)) continue;
    const s = T.st.get(k), wish = t.b === 'haus' && s && s.wish;
    residentsOf(t).forEach(r => (by.get(r.animal) || by.get('katze')).push({ k, r, t, wish }));
  }
  const all = [...by.values()].flat().length, kinds = [...by.values()].filter(l => l.length).length;
  return `<p class="muted">${all} ${all === 1 ? 'Familie' : 'Familien'} · ${kinds} von ${ANIMALS.length} Arten wohnen bei dir. Antippen bringt dich zum Haus.</p>
    ${ANIMALS.map(a => {
      const list = by.get(a.id);
      if (!list.length) {
        const open = !a.isle || state.islands.has(a.isle);
        return `<div class="label">${a.icon} Familie ${a.family}</div><p class="muted">${open ? 'Zieht beim nächsten neuen Wohnhaus vielleicht ein.' : `Zieht ein, sobald du die ${ISLE_BY_ID[a.isle].icon} ${ISLE_BY_ID[a.isle].name} entdeckt hast.`}</p>`;
      }
      return `<details class="res-group" data-sp="${a.id}"${resOpen.get(a.id) ?? list.length <= 6 ? ' open' : ''}><summary class="label">${a.icon} Familie ${a.family} · ${list.length}</summary>
        ${list.sort((p, q) => p.r.name.localeCompare(q.r.name)).map(({ k, r, t, wish }) => `<button class="hall-row link-row" data-home="${k}">
          <span>${escHtml(r.name)} <small class="muted">· ${t.b === 'haus' ? HOUSE_STAGES[t.lvl - 1].name : stageName(t)} · ${regionName(regionAt(...keyXY(k)))}</small></span>
          <b>${wish ? (wish.next ? '♥'.repeat(wish.met) + '♡'.repeat(wish.total - wish.met) : '♥♥♥♥♥') : ''}</b></button>`).join('')}</details>`;
    }).join('')}`;
}
// Tageszeit im Rathaus (Block 101): wie spät, wann es umschlägt, was es nachts zu sehen gibt
function todHtml() {
  const t = timeOfDay(), mins = n => `${n} ${n === 1 ? 'Minute' : 'Minuten'}`;
  const night = ['🏮 Laternen und Fenster leuchten', '✨ Glühwürmchen in Parks und an Blumen', ...(wonderOn('sternwarte') ? ['🌠 Sternschnuppen über der Sternwarte – antippen!'] : [])];
  return `<div class="tod-box"><b>${t.icon} ${t.text} Uhr · ${t.name}</b> <small class="muted">${t.dark ? `in ${mins(t.left)} wird es hell` : t.dawn ? `in ${mins(t.left)} ist es Tag` : `in ${mins(t.left)} ist es Nacht`}</small>
    <div class="muted">${t.dark ? 'Jetzt' : 'Nachts'}: ${night.join(' · ')}. Ein Tag dauert 24 Minuten, auf allen Geräten gleich.</div></div>`;
}
// Erfolge (Block 98: im Fenster „Du“)
function erfolgeHtml() {
  const stars = starCount(), rank = rankOf(stars), next = RANKS.find(r => r.stars > stars);
  return `
    <p class="big" style="font-size:18px">⭐ ${stars} · ${rank.name}</p>
    ${next ? `<p class="muted">Nächste: ${next.name} ab ${next.stars} ⭐${next.item ? ` – schaltet den ${ITEMS[next.item].name} frei` : ''}</p>` : ''}
    ${ACHIEVEMENTS.map(a => {
      const n = state.achieved[a.id] || 0, v = a.value(), done = n >= a.tiers.length, goal = a.tiers[Math.min(n, a.tiers.length - 1)];
      return `<div class="achv-row${done ? ' done' : ''}"><span class="ai">${a.icon}</span><div class="at">
        <div><b>${a.name}</b> <span class="stars">${'⭐'.repeat(n)}${'<span class="off">⭐</span>'.repeat(a.tiers.length - n)}</span></div>
        <div class="bar"><i style="width:${done ? 100 : Math.min(100, v / goal * 100)}%"></i></div>
        <small>${done ? '✓ alle Stufen geschafft' : `${tierText(a, v)} / ${tierText(a, goal)}`}</small></div></div>`;
    }).join('')}`;
}
// Wünsche der Bewohner (Rathaus → Zu tun)
function wishesHtml() {
  const miss = new Map();
  for (const [k, t] of state.tiles) {
    const s = T.st.get(k);
    if (t.b !== 'haus' || !s || !s.wish || !s.wish.next) continue;
    for (const w of s.wish.list) if (!w.ok) miss.set(w.text, (miss.get(w.text) || 0) + 1);
  }
  const list = [...miss].sort((a, b) => b[1] - a[1]);
  return `
    <div class="label">Das wünschen sich die Bewohner noch</div>
    ${list.length ? list.map(([text, cnt]) => `<div class="hall-row"><span>${text}</span><b>${cnt} ${cnt > 1 ? 'Häuser' : 'Haus'}</b></div>`).join('')
      : '<p class="ok">Alle Wünsche erfüllt – alle Häuser können wachsen oder sind schon Villen!</p>'}`;
}
// Rathaus = deine Stadt (Block 98). Was zu dir gehört (Figur, Erfolge, Freunde …), steht im Fenster „Du“ (openYou) –
// alte Sprungziele leiten dorthin weiter.
const HALL_TABS = [['overview', 'Übersicht'], ['todo', 'Zu tun'], ['bewohner', 'Bewohner'], ['isles', 'Inseln'], ['town', 'Ort']];
const HALL_MOVED = { erfolge: 'erfolge', besuch: 'freunde', figur: 'figur' };
function openTownHall(tab = hallTab) {
  if (HALL_MOVED[tab]) return openYou(HALL_MOVED[tab]);
  if (tab === 'ready' || tab === 'wishes') tab = 'todo';
  if (!HALL_TABS.some(([id]) => id === tab)) tab = 'overview';
  hallTab = tab;
  const n = lanternCount(), title = townTitle(n), nextTitle = TITLES.find(([min]) => min > n);
  const tabs = HALL_TABS;
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
      ${hasInvention('feuerwerk') || nx ? `<div class="hall-quick">
        ${hasInvention('feuerwerk') ? '<button class="btn ghost small" data-quick-go="fire">🎆 Feuerwerk</button>' : ''}
        ${nx ? `<button class="btn ghost small" data-isle-go="${nx.id}">${nx.icon} Nächste Insel</button>` : ''}
      </div>` : ''}
      ${typeof mailWaiting === 'function' && mailWaiting() ? '<div class="row"><button class="btn" data-mailgo="1" style="flex:1">📬 Post im Briefkasten – abholen</button></div>' : ''}
      <p class="big" style="font-size:18px">${title} · 🏮 ${n} / ${LANTERN_TOTAL}</p>
      ${todHtml()}
      ${typeof wishHtml === 'function' ? wishHtml() : ''}
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
  } else if (tab === 'todo') {
    // Zu tun (Block 98: „Bereit“ + „Wünsche“): Ausbauen direkt von hier (grau, solange Taler oder Material fehlen – wird live grün)
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
        : '<div class="label">Bereit zum Ausbauen</div><p class="muted">Gerade nichts – unten steht, was sich die Bewohner noch wünschen.</p>'}
      ${almost.length ? `<div class="label">Fast geschafft</div>${almost.map((e, i) => row(e, ready.length + i, '💭', false)).join('')}` : ''}
      ${wishesHtml()}`;
  } else if (tab === 'isles') {
    // Alle Inseln auf einen Blick: Stand, was dort steht, Bahnanschluss – und per Knopf hin
    const per = new Map([['home', { n: 0, pop: 0 }], ...ISLES.concat(FAR).map(i => [i.id, { n: 0, pop: 0 }])]);
    for (const [k, t] of state.tiles) {
      if (t.b === 'weg' || t.b === 'schiene' || t.b === 'lm') continue;
      const e = per.get(regionAt(...keyXY(k)));
      if (!e) continue;
      e.n++;
      if (isHome(t.b)) e.pop += popOf(t);                       // alle Wohnhäuser (Regel 49)
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
  } else if (tab === 'bewohner') {
    body = residentsHtml();
  } else {
    const hall = townHallAt(), t = hall && state.tiles.get(hall.join(','));
    const P = state.partner;
    body = `
      ${townEditor(state.town)}
      <div class="label">🚩 Partnerstadt</div>
      ${P ? `<div class="hall-row"><span><span class="pflag" style="background:${escHtml(P.c)}">${escHtml(P.s)}</span> ${escHtml(P.name)}</span><span class="hall-btns"><button class="btn ghost small" data-partnergo="1">👥 Freunde</button><button class="btn ghost small" data-partneroff="1" aria-label="Partnerstadt entfernen">✕</button></span></div>
        <p class="muted">Ihre Flagge weht neben deinem Rathaus.</p>`
        : '<p class="muted">Wähle unter 👥 Freunde bei einem Freund 🚩 – dann weht seine Flagge neben deinem Rathaus, und seine Schiffe legen an deinem Hafen an.</p>'}
      ${t ? `
        <div class="label">Rathaus: Wand</div>
        <div class="swatches">${colorsOf('wall').map(([c, i]) => `<button class="sw${i === t.wall ? ' on' : ''}" data-wall="${i}" style="background:${c}" aria-label="Wandfarbe ${i + 1}"></button>`).join('')}</div>
        <div class="label">Rathaus: Dach</div>
        <div class="swatches">${colorsOf('roof').map(([c, i]) => `<button class="sw${i === t.roof ? ' on' : ''}" data-roof="${i}" style="background:${c}" aria-label="Dachfarbe ${i + 1}"></button>`).join('')}</div>
        ${courtHtml(t, hall[0], hall[1])}
        <div class="row"><button class="btn ghost" id="h-move">✋ Rathaus verschieben</button></div>` : ''}`;
  }
  openModal(`
    <h2>🏛️ Rathaus von ${escHtml(state.town.name)}</h2>
    <div class="looks hall-tabs">${tabs.map(([id, label]) => `<button class="look${id === tab ? ' on' : ''}" data-tab="${id}">${label}${id === 'todo' && ready.length ? ` ✨${ready.length}` : ''}</button>`).join('')}</div>
    ${body}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Fertig</button></div>`, () => openTownHall(tab));
  const card = $('modal-card');
  card.classList.add('hall');
  for (const b of card.querySelectorAll('[data-tab]')) b.onclick = () => { sfx('deco'); openTownHall(b.dataset.tab); };
  const all = ready.concat(almost);
  for (const b of card.querySelectorAll('[data-upall]')) b.onclick = () => {
    const key = b.dataset.upall, list = key === 'all' ? ready : (readyGroups(ready).find(g => g.id === key) || { items: [] }).items;
    if (upgradeMany(list)) openTownHall('todo');
  };
  for (const b of card.querySelectorAll('[data-up]')) b.onclick = () => {
    const e = all[+b.dataset.up];
    if (e.kind === 'lm') { restoreLandmark(e.type); return; }            // öffnet das Laternen-Fenster
    if (e.kind === 'wonder') { const t = state.tiles.get(e.x + ',' + e.y); if (wonderStep(e.x, e.y, true) && !wonderDone(t)) openTownHall('todo'); return; }
    if (e.kind === 'haus' ? houseUpgrade(e.x, e.y, true) : stageUpgrade(e.x, e.y, true)) openTownHall('todo');
  };
  for (const b of card.querySelectorAll('[data-quick-go]')) b.onclick = () => {
    if (b.dataset.quickGo === 'fire') { closeModal(); startFireworks(); }
  };
  for (const b of card.querySelectorAll('[data-mailgo]')) b.onclick = () => openNet('freunde');
  for (const b of card.querySelectorAll('[data-wishset]')) b.onclick = () => openWishPicker();   // Wunschzettel (Block 105)
  for (const b of card.querySelectorAll('[data-wishoff]')) b.onclick = async () => { if (viewOnly()) { cloudBlocked(); return; } try { if (await wishSet(null)) { toast('📌 Wunsch abgenommen'); openTownHall('overview'); } } catch (e) { toast('Hat nicht geklappt'); } };   // direkt abnehmen (Block 129)
  for (const b of card.querySelectorAll('[data-partnergo]')) b.onclick = () => openNet('freunde');
  for (const b of card.querySelectorAll('[data-partneroff]')) b.onclick = () => { if (viewOnly()) { cloudBlocked(); return; } state.partner = null; cloudTouched(); save(); openTownHall('town'); };
  for (const b of card.querySelectorAll('[data-lm-go]')) b.onclick = () => {
    const [x, y] = lmTile(b.dataset.lmGo);
    closeModal(); jumpTo(x, y, 3, 3); sparkle(x + 1, y + 1); openLandmark(x, y);
  };
  for (const b of card.querySelectorAll('[data-isle-go]')) b.onclick = () => goIsle(b.dataset.isleGo);
  for (const d of card.querySelectorAll('details[data-sp]')) d.addEventListener('toggle', () => resOpen.set(d.dataset.sp, d.open));
  for (const b of card.querySelectorAll('[data-home]')) b.onclick = () => {           // Bewohner: zum Haus
    const [x, y] = keyXY(b.dataset.home), t = state.tiles.get(b.dataset.home);
    if (!t) return;
    const [w, h] = sizeOf(t.b, t.rot, t);
    closeModal(); jumpTo(x, y, w, h); sparkle(x + (w - 1) / 2, y + (h - 1) / 2); openInfo(x, y);
  };
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
    if (t) wireCourt(card, t, () => openTownHall('town'));                                // Platz (Block 91)
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
function openModal(html, live = null) {
  const c = $('modal-card'), same = !$('modal').hidden && modalLive && live && modalLive.toString() === live.toString();
  if (!same) spotSel = null;                                       // anderes Fenster: Markierung weg
  const was = $('modal').hidden ? null : (c.querySelector(':scope > .tab-scroll') || c).scrollTop;   // dieselbe Seite neu (gekauft): Scrollstand behalten
  c.className = 'card'; setHtml(c, frameHtml(html)); $('modal').hidden = false; modalLive = live;
  modalFrame(c, same ? was : null);
  const box = spotBox(); if (box) box.classList.add('spot');
}
// Fenster mit Reitern (Block 103): feste Größe, gescrollt wird innen, die Reiter bleiben oben stehen. Neuer Reiter → nach
// oben; dieselbe Seite neu gezeichnet (Hut gewählt, Live-Auffrischen) → Scrollstand bleibt.
// Block 103b: Was nach den Reitern kommt, steckt in einem eigenen Scrollbereich (.tab-scroll) – Überschrift und Reiter
// scrollen gar nicht mit, so federt beim schnellen Wischen (iPad) nur der Inhalt nach, nie die Reiter
function frameHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const tabs = tpl.content.querySelector('.hall-tabs');
  if (tabs && tabs.parentNode === tpl.content) {
    const box = document.createElement('div'); box.className = 'tab-scroll';
    while (tabs.nextSibling) box.appendChild(tabs.nextSibling);
    tpl.content.appendChild(box);
  }
  return tpl;
}
let modalTabKey = null;
function modalFrame(c, keepTop = null) {
  const tabs = c.querySelector('.hall-tabs'), on = tabs && tabs.querySelector('.look.on'), sc = c.querySelector(':scope > .tab-scroll') || c;
  c.classList.toggle('tabbed', !!tabs);
  c.classList.toggle('you-win', !!c.querySelector('.you-tabs, .net-tabs'));            // Du und Online: alle Reiter gleich breit
  c.classList.toggle('help-win', !!c.querySelector('[data-hb]'));
  const key = on ? [...on.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value).join() : null;
  if (key !== modalTabKey && !liveNow) sc.scrollTop = 0;
  else if (keepTop != null && !liveNow) { sc.scrollTop = keepTop; queueMicrotask(() => { sc.scrollTop = keepTop; }); }   // nochmal, wenn der Aufrufer die Fenstergröße gesetzt hat
  modalTabKey = key;
}
function closeModal() { $('modal').hidden = true; modalLive = null; modalTabKey = null; }
// Daneben tippen schließt (Block 81) – aber nur, wenn man daneben gedrückt und daneben losgelassen hat: Wer im Fenster drückt
// (Text markieren, Regler ziehen) und erst daneben loslässt – oder umgekehrt –, behält sein Fenster
let modalPressOut = false, modalUpOut = false;
$('modal').addEventListener('pointerdown', e => { modalPressOut = e.target.id === 'modal'; });
$('modal').addEventListener('pointerup', e => { modalUpOut = e.target.id === 'modal'; });     // … und auch daneben losgelassen
$('modal').addEventListener('click', e => { if (e.target.id === 'modal' && modalPressOut && modalUpOut) closeModal(); modalPressOut = modalUpOut = false; });

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
    <p class="muted" style="font-size:13px">Ziehen = Karte bewegen · Mausrad / zwei Finger = zoomen · Mehr, auch alle Tasten: ☰ → Hilfe</p>
    <div class="row"><button class="btn" id="m-ok">Los geht's!</button></div>`);
  if (first) wireTownEditor($('modal-card'), state.town, updateHud);
  $('m-ok').onclick = () => { closeModal(); save(); };
}
// Anleitung (Block 51): vier Reiter – Los geht's, Bauen & Gestalten, Wachsen, Steuerung. Tasten nur, wo es eine Maus gibt.
let helpTab = 'start';
const HELP_TABS = [['start', '🌱 Los geht\'s'], ['bauen', '🏗️ Bauen & Gestalten'], ['wachsen', '📈 Wachsen'], ['steuerung', '🎮 Steuerung']];
function helpBody(tab) {
  const li = items => `<ul class="help">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  if (tab === 'bauen') return li([
    '🧭 <b>Die Leiste unten</b> hat vier Bereiche: 🏘️ Stadt, 🏭 Herstellen, 🎡 Freizeit, 🌸 Gestalten. Antippen klappt alles aus dem Bereich auf, nach Gruppen sortiert. Karte antippen = auswählen, dann auf die Karte tippen = bauen. ✕ legt es wieder weg.',
    'ℹ️ <b>Tippst du eine Karte an</b>, erscheint rechts ihr Info-Fenster. Gesperrt? Dort steht, wie du es freischaltest – mit Knopf, der dich direkt hinbringt.',
    '🛤️ <b>Wege, Parkrasen, Gelände</b> ziehst du als Linie oder Rechteck auf: erst die Vorschau, dann hineintippen zum Bauen.',
    '🧱 <b>Hecken, Zäune, Mauern</b> liegen zwischen den Feldern. Wo ein Weg hindurchgeht, entsteht ein Tor – antippen für Torbogen, Rosenbogen oder Torpfeiler.',
    '🪑 <b>Kleinkram</b> (Bänke, Laternen, Bäume, Blumentöpfe) passt zu acht auf ein Feld: in die Ecke oder an die Seite tippen, wo er stehen soll.',
    '📍 <b>Der Platz zählt:</b> Windräder am Wasser oder neben Fels, Offshore-Anlagen weit draußen, Geothermie nah an der heißen Quelle, Solarfelder auf Sand, Holzfäller im Wald, Steinbrüche am Fels und Obstplantagen zwischen Obstbäumen bringen bis +50 %. Die Vorschau beim Bauen zeigt, wie gut ein Platz ist – schlechter als vorher wird nichts.',
  '🐾 <b>Bewohner:</b> Tipp eine Figur an – sie erzählt, wer sie ist, wo sie wohnt und wohin sie gerade geht. Morgens geht es zur Arbeit, mittags ins Café, abends in den Park. Mit jeder Insel zieht eine neue Art ein: Eichhörnchen, Igel, Fuchs, Giraffe, Elefant und Ente. Alle Familien stehen im Rathaus unter „Bewohner“.',
  '🦋 <b>Tiere in der Natur</b> zeigen dir, wo es schön ist: Schmetterlinge bei Blumen, Vögel im Wald, Fische und Frösche im Teich, Möwen und Robben an der Küste. Antippen trägt sie ins Album „Naturbeobachtungen“ ein – dort steht auch, wo man die fehlenden findet. Für 4, 8 und alle 12 gibt es besondere Deko.',
  '📏 <b>Größen:</b> Brunnen, Bäume, Beete & Co. gibt es klein bis riesig – die Größe wählst du über der Leiste.',
    '🧺 <b>Marktplatz:</b> ein Platz aus Wegen mit mindestens 3 Marktständen. 🌳 <b>Park:</b> Parkrasen mit Deko darauf – ab 4 Feldern und 3 Deko eine Grünanlage.',
    '✋ <b>Verschieben</b> kostet nichts. 🧹 <b>Abreißen:</b> Deko und Wege gibt es voll zurück, Gebäude zur Hälfte. In jedem Fenster gibt es 🗑️.',
    '↶ <b>Verbaut?</b> Rückgängig nimmt die letzten 20 Schritte zurück – mit allen Talern.']);
  if (tab === 'wachsen') return li([
    '💡 <b>Forschung:</b> Schulen, Bibliotheken und die Universität bringen Ideen. Damit erforschst du neue Gebäude und Boni – oben auf 💡 tippen.',
    '🎨 <b>Kunstakademie</b> (in der Forschung): Farben, Wege-Muster, Hecken- und Zaunstile, besondere Deko – ✦ Meisterstücke sind die begehrtesten.',
    '⚡ <b>Strom</b> kommt aus Windrädern, Wasser-, Wellen-, Solar- und Offshore-Anlagen. Laternen, Werkstätten, Züge und Wunderwerke brauchen ihn.',
    '📍 <b>Der Platz zählt:</b> Windräder am Wasser oder Fels, Offshore weit draußen, Geothermie nah an der Quelle, Solar auf Sand, Holzfäller im Wald, Steinbruch am Fels … bringen bis +50 %. Die Vorschau beim Bauen zeigt es. Schlechter als normal wird es nie.',
    '🏮 <b>Sehenswürdigkeiten</b> restaurieren: jede Stufe schaltet Neues frei und entzündet eine Laterne. Brennen alle, gibt es das Laternenfest.',
    '🏝️ <b>Inseln</b> entdeckst du per Boot vom 🛶 Steg aus. Brücken, Züge, Seilbahn und Schiffe verbinden sie; später warten ferne Inseln mit Truhen. Mit „Aufschütten“ wächst dein Land ins Meer.',
    '🎢 <b>Freizeitpark</b> (nach dem Laternenfest, 🎡 Freizeit): Boden aufziehen, Fahrgeschäfte und Stände daraufstellen – vom Rummelplatz zum Wunderland. Bringt Eintritt, Besucher und Schönheit; die Fahrgeschäfte kosten nach deinem Einkommen.',
    '🏛️ <b>Wunderwerke</b> wie Riesenrad, Botanischer Garten oder Schloss baust du in Abschnitten – jedes hat eine besondere Kraft.',
    '⭐ <b>Erfolge und Album</b> (oben der Knopf mit deiner Figur): Sammeln lohnt sich, volle Album-Seiten schenken besondere Dinge und Erfolge neue Kleidung.']);
  if (tab === 'steuerung') {
    const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;   // iPad/Handy: keine Tasten zeigen
    const keys = [['A', 'Ansehen'], ['W', 'Weg'], ['V', 'Verschieben'], ['E · Entf · ⌫', 'Abreißen'], ['1 – 9', 'Karte aus der Leiste wählen'], ['R', 'Drehen beim Bauen'],
      ['Strg/⌘ + Z', 'Rückgängig'], ['Esc', 'Abbrechen, Fenster schließen'], ['Leertaste halten + ziehen', 'Karte bewegen (auch rechte Maustaste)'],
      ['Mausrad', 'Zoomen – beim Bauen: drehen'], ['Rechtsklick', 'Planung bzw. Werkzeug abbrechen']];
    const gestures = [['Ziehen', 'Karte bewegen'], ['Zwei Finger', 'Zoomen und bewegen'], ['Einmal tippen', 'Vorschau zeigen'], ['Nochmal tippen', 'Bauen'],
      ['Mit Weg/Rasen ziehen', 'Linie oder Rechteck planen, dann hineintippen'], ['⟳ unten', 'Drehen beim Bauen']];
    const table = rows => `<table class="help-keys">${rows.map(([k, v]) => `<tr><td><kbd>${k}</kbd></td><td>${v}</td></tr>`).join('')}</table>`;
    return (touch ? '' : `<div class="label">⌨️ Maus & Tastatur</div>${table(keys)}`) + `<div class="label">👆 Touch (iPad, Handy)</div>${table(gestures)}`;
  }
  return li([
    '🏮 <b>Das Ziel:</b> Deine Insel war einmal berühmt für ihr Laternenfest. Restauriere die verfallenen Sehenswürdigkeiten, bis alle Laternen brennen – das 📖 Tagebuch erzählt, wie es früher war.',
    '🐾 <b>Bewohner:</b> In jedem Wohnhaus lebt eine Tierfamilie. Tipp eine Figur an, um zu sehen, wer das ist und wohin sie gerade geht – morgens zur Arbeit, mittags ins Café, abends in den Park. Mit jeder entdeckten Insel zieht eine neue Art ein; alle stehen im Rathaus unter „Bewohner“.',
    '🏠 <b>Häuser</b> bringen Einwohner. Jedes Haus hat Wünsche (Weg vor der Tür, Deko, später Bäckerei, Park, Schule …). Tipp es an, um sie zu sehen.',
    '✨ <b>Alles wächst selbst ausgelöst:</b> Sind die Wünsche erfüllt, funkelt es – antippen und ausbauen.',
    '🏘️ <b>Viertel:</b> Was aneinandergrenzt oder über Wege verbunden ist, gehört zusammen – ab 3, 8 und 15 Gebäuden gibt es +10/20/30 %.',
    '🪙 <b>Taler</b> verdienen Felder, Betriebe und Läden. Betriebe brauchen Einwohner als Mitarbeiter – bau also Häuser dazu.',
    '💡 <b>Tipps</b> tauchen unterwegs auf; alle stehen unter ☰ → ❓ Hilfe → Tipps.',
    '❓ <b>Nicht verstanden?</b> Alles mit einem kleinen ? lässt sich antippen – Material, Wünsche, Begriffe. Unter ☰ → ❓ Hilfe findest du alles mit Suche. Und tipp deine eigene Figur an – sie sagt dir, was gerade dran ist.']);
}
// Hilfe-Buch (Block 98): Anleitung, Tipps und Nachschlagen in einem Fenster; oben immer die Suche („Was ist …?“)
const HELP_Q = 'Suchen: Was ist …? z. B. Metall, Marktplatz, Strom';
const HELP_BOOK = [...HELP_TABS, ['tipps', '💡 Tipps'], ['lex', '📚 Nachschlagen']];
function helpTop(tab) {
  helpTab = tab;
  return `<h2>❓ Hilfe</h2>
    <input id="lx-q" class="lx-q" type="search" placeholder="${HELP_Q}" value="${tab === 'lex' ? escHtml(lexQ) : ''}" aria-label="In der Hilfe suchen">
    <div class="looks hall-tabs">${HELP_BOOK.map(([id, name]) => `<button class="look${id === tab ? ' on' : ''}" data-hb="${id}">${name}</button>`).join('')}</div>`;
}
// Tippen in die Suche (außerhalb von Nachschlagen) springt dorthin und sucht weiter
function wireHelpTop() { const q = $('lx-q'); if (q && helpTab !== 'lex') q.oninput = () => { lexQ = q.value; openLexikon(null, true); }; }
function openHelp(tab = helpTab) {
  if (tab === 'tipps') { openTipBook(); return; }
  if (tab === 'lex') { openLexikon(); return; }
  if (!HELP_TABS.some(([id]) => id === tab)) tab = 'start';
  openModal(`
    ${helpTop(tab)}
    ${helpBody(tab)}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  wireHelpTop();
  $('m-close').onclick = closeModal;
}
$('modal-card').addEventListener('click', e => { const b = e.target.closest('[data-hb]'); if (b) openHelp(b.dataset.hb); });
// „Das ist neu“ (Block 25): nach einem Update einmal pro Gerät. Neue Spieler bekommen es nicht (sie kennen das Alte
// nicht). Bei jedem Push mit etwas Sichtbarem: neuen Eintrag OBEN in NEWS_HISTORY (neue id, Datum, Titel, 2–5 Punkte).
// Versionsgeschichte (Block 99): neuestes Update oben. Wer länger nicht gespielt hat, sieht alle verpassten – das neueste
// aufgeklappt, die älteren als Überschrift zum Aufklappen. also: frühere ids, die zu diesem Stand gehören.
const NEWS_HISTORY = [
  { id: '2026-10-08-bauleiste', date: '8. Oktober', title: 'Bauleiste neu', items: [
    '🧭 <b>Bauleiste aufgeräumt:</b> Unten ist nur noch eine Reihe. Tippe auf einen Bereich (Stadt, Herstellen …) – darüber klappt alles aus dem Bereich auf, nach Gruppen sortiert und mit Namen. Eine Wahl, Esc oder daneben tippen klappt es wieder zu.',
  ] },
  { id: '2026-10-08-beete', date: '8. Oktober', title: 'Neue Beete', items: [
    '🌷 <b>Beete in neun Formen:</b> Steinrand, Rundbeet, Rosenbeet, Tulpen, Lavendel, Hochbeet, Sonnenblumen, Wildblumen – die meisten in der Kunstakademie (Beete).',
    '🪵 <b>Boden nach Wahl:</b> Rindenmulch, Kies oder Grün – im Fenster des Beets umstellen. Gartenerde gibt es in der Kunstakademie.',
  ] },
  { id: '2026-10-08-kopieren', date: '8. Oktober', title: 'Kopieren', items: [
    '⧉ <b>Kopieren:</b> Mit ✋ ein Rechteck aufziehen – unten erscheinen „Verschieben“ und „Kopieren“ mit Preis. Die Kopie hängt am Finger, lässt sich drehen und so oft absetzen, wie du magst (fertig mit Esc). Sie kostet wie neu gebaut, in Häuser ziehen neue Bewohner.',
    '🖌️ <b>Pipette:</b> Markierst du nur Weg, nur Gleis oder nur eine Hecke/Zaun/Mauer, hast du danach genau diesen Stil in der Hand und ziehst ihn wie gewohnt weiter.',
    '🌉 <b>Breite Brücken in Nord-Süd-Richtung</b> bekommen keine Löcher mehr.',
  ] },
  { id: '2026-10-08-himmel', date: '8. Oktober', title: 'Ballons ausblenden', items: [
    '🎈 <b>Himmel ruhig:</b> Heißluftballons und Zeppelin lassen sich jetzt im Menü unter Grafik ausblenden (gilt nur auf diesem Gerät).',
  ] },
  { id: '2026-10-08-strassenlaternen', date: '8. Oktober', title: 'Große Straßenlaternen', items: [
    '💡 <b>Straßenlaternen:</b> Hohe Masten für Straßen und Plätze – nachts fällt ein weiter Lichtfleck auf den Weg. Am Wegrand zeigt der Ausleger von selbst über den Weg. In der Kunstakademie (Deko), dann unter Stadtschmuck.',
    '🎨 <b>6 Formen:</b> Mastleuchte, Peitschenmast, Kugelleuchte, Doppelausleger, Bischofsstab und der große Boulevard-Kandelaber – in allen Laternenfarben.',
  ] },
  { id: '2026-10-08-parkbahn', date: '8. Oktober', title: 'Parkeisenbahn', items: [
    '🚂 <b>Parkeisenbahn:</b> Unter Freizeit → Parkeisenbahn ein schmales Gleis als Rundkurs ziehen – über Wiese, Park und quer über Wege – und eine Station hineinsetzen. Dann dreht die Bimmelbahn ihre Runden, und deine Bewohner fahren mit.',
    '🚋 <b>Mehr Züge:</b> Im Fenster jeder Station „+ Zug“ – mehrere Züge auf einer Strecke, jeder mit eigenem Modell. Nostalgische Straßenbahn und Mini-Zug mit Tierwagen gibt es in der Kunstakademie.',
    '🎨 <b>Dachfarbe:</b> Stationen gibt es in vielen Farben.',
  ] },
  { id: '2026-10-08-boegen', date: '8. Oktober', title: 'Bogenbrücken', items: [
    '🌉 <b>Brücken übers Wasser sind jetzt Bögen:</b> ab 2 Feldern Länge spannt sich die Brücke im Bogen von Ufer zu Ufer – Stein und Ziegel mit echten Bogenöffnungen, Holz und Rot auf Pfählen.',
    '⛵ <b>Boote fahren darunter durch</b> – unter dem hohen Teil bzw. durch die Bögen. Bewohner laufen über den Bogen.',
    '↔️ <b>Breite Brücken:</b> bis zu 4 Wege nebeneinander übers Wasser ziehen – wird eine breite Brücke mit Geländer nur außen. Brücken sind höchstens 16 Felder lang, übers Meer auch von Insel zu Insel.',
  ] },
  { id: '2026-10-08-baenke', date: '8. Oktober', title: 'Neue Bänke, schönere Fußgängerbrücke', items: [
    '🌳 <b>Rundbank</b> jetzt richtig groß – mit einem echten kleinen Baum in der Mitte.',
    '🪑 <b>Gartenbank neu</b> und zwei neue Bänke in der Kunstakademie: <b>Bank mit Blumenkästen</b> und <b>Laubenbank</b> unter einem Rosenbogen.',
    '🌉 <b>Fußgängerbrücke über Schienen:</b> so breit wie der Weg, die Rampen schließen sauber an.',
  ] },
  { id: '2026-10-08-hecken', date: '8. Oktober', title: 'Hecken wie Wege', items: [
    '✂️ <b>Hecke antippen → Ändern:</b> nur dieses Stück, alle verbundenen oder alle Hecken – dann Form oder Farbe wählen. Gilt auch für Zäune und Mauern.',
    '🔁 <b>Überbauen:</b> Einfach eine neue Hecke über die alte ziehen – auch nur in anderer Farbe.',
    '🚂 <b>Gleise genauso:</b> Gleis antippen → nur dieses Feld, alle verbundenen oder alle Gleise – dann das Gleisbett wählen.',
  ] },
  { id: '2026-10-08-buendig', date: '8. Oktober', title: 'Wege bis an die Hecke', items: [
    '🧱 <b>Neue Hecken, Zäune und Mauern sind bündig:</b> Der Weg läuft bis an die Linie – auch um Ecken bleibt kein Graszwickel mehr.',
    '✨ <b>Alte Linien auf einmal umstellen:</b> Hecke antippen → „Bündig bis an die Linie“ → „Für alle anderen Linien übernehmen“.',
  ] },
  { id: '2026-10-08-umfaerben', date: '8. Oktober', title: 'Wege auf einmal umfärben', items: [
    '🎨 <b>Ganzes Wegnetz umfärben:</b> Weg antippen → „Alle verbundenen“ → Muster und Farbe wählen. Kein Neuziehen mehr. ↶ macht es rückgängig.',
    '🔭 <b>Weit weg:</b> Große Platten und Schachbrett zeigen ihr Muster jetzt auch rausgezoomt.',
  ] },
  { id: '2026-10-08-wege', date: '8. Oktober', title: 'Wege: Muster + Farbe', items: [
    '🎨 <b>Muster und Farbe getrennt:</b> Beim Bauen wählst du unten erst das Muster (Kies, Platten, Pflaster, Holz …), dann eine von 21 Farben. Deine Wege bleiben, wie sie sind.',
    '🧱 <b>Neue Muster:</b> Große, kleine und gemischte Platten, Plattenverband, Steinreihen, Kleinpflaster, Fischgrät groß und Holzbohlen – in der Kunstakademie mit Vorschau, bevor du kaufst. Farben kosten nichts.',
    '🖼️ <b>Kunstakademie mit Vorschau:</b> Jedes Stück zeigt, wie es aussieht. Antippen öffnet eine Karte mit großem Bild – gekauft wird erst mit „Kaufen“.',
    '✨ <b>Schöner:</b> Schachbrett und Gold als echtes Schachbrett, kräftigere Ränder, Erde heller, Fischgrät echt, Regenbogen ohne Kanten – und weit weg keine Streifen und Linien mehr.',
  ] },
  { id: '2026-10-08-grafik', date: '8. Oktober', title: 'Viel flüssiger – auch nachts', items: [
    '🚀 <b>Grafikkarte:</b> Weit rausgezoomt zeichnet jetzt die Grafikkarte – Tag und Nacht deutlich flüssiger. Sieht etwas komisch aus? ☰ → ⚙️ Einstellungen → „Grafikkarte“ ausschalten.',
    '⏸️ <b>Drehendes steht weit weg still:</b> Mühlen, Windräder, Riesenrad und Fahrgeschäfte ruhen, wenn du weit rausgezoomt bist – nah dran drehen sie sich. Umstellen unter ☰ → ⚙️ Einstellungen.',
    '🟢 <b>Freunde online:</b> Ein grüner Punkt zeigt, wer gerade spielt, sonst „zuletzt vor …“. Das Freundesbuch fasst Besuche, Herzen und Geschenke je Freund in einer Zeile zusammen.',
    '🎁 <b>Souvenirs:</b> Statt Rohstoffen verschickst du Andenken von deiner Insel; Wünsche auf dem Wunschzettel kannst du wieder abnehmen.',
    '💰 <b>Bezahlt bleibt bezahlt:</b> Einmal gekaufte Varianten (Schloss, Bahnhofslänge, Gleise) kosten beim Umstellen nichts mehr.',
  ] },
  { id: '2026-10-07-hecken', date: '7. Oktober', title: 'Bunte Hecken, passende Eingänge, längerer Bahnhof', items: [
    '🚉 <b>Bahnhof 3 Felder lang:</b> Beim Bauen in der Leiste „3 Felder“ wählen oder im Fenster umstellen – dann steht die Tür genau auf einem Feld, passend zu einem 1er-Weg.',
    '🚪 <b>Eingänge passen zum Weg:</b> Vor einem schmalen Weg führt ein Weg genauso breit bis zur Tür – statt eines breiten Platzes. Vor einem ganz breiten Weg bleibt der Vorplatz.',
    '🌳 <b>Jede Hecke in deiner Farbe:</b> Niedrige, hohe, Buchs-, Blüten- und Lichterhecke lassen sich jetzt färben wie die Wilmerhecke – in der Leiste beim Bauen oder im Fenster der Hecke, auch für alle auf einmal.',
  ] },
  { id: '2026-10-06-symmetrie', date: '6. Oktober', title: 'Hauptbahnhof symmetrisch', items: [
    '🚉 <b>Halle immer in der Mitte:</b> Gleis – Steig – Halle – Steig – Gleis. Rechts der Halle ist alles gespiegelt, bei gerader Gleiszahl ist der Bahnhof genau symmetrisch.',
    '➕ <b>Seite wählen:</b> „+ Gleis links“ oder „+ Gleis rechts“ (und „−“ genauso) – alle anderen Gleise bleiben, wo sie sind.',
    '🛤️ Deine Hauptbahnhöfe wurden umgestellt. Dabei kann ein Gleis ein Feld gerückt sein – die Strecken davor kurz prüfen.',
  ] },
  { id: '2026-10-06-mittelhalle', date: '6. Oktober', title: 'Hauptbahnhof mit Eingangshalle', items: [
    '▣ <b>Mittelhalle:</b> Im Fenster des Hauptbahnhofs unter „Halle“ die Mitte wählen – eine Eingangshalle zwischen den Gleisen, das Portal davor, die Gleise gehen links und rechts ab. Bei gerader Gleiszahl genau symmetrisch.',
  ] },
  { id: '2026-10-06-zuletzt', date: '6. Oktober', title: 'Zuletzt gebaut', items: [
    '🕘 <b>Schnell wieder bauen:</b> Der Knopf 🕘 neben der Suche zeigt deine letzten 8 gebauten Dinge – ein Tipp, und du baust weiter.',
  ] },
  { id: '2026-10-06-fluegel', date: '6. Oktober', title: 'Hauptbahnhof mit Seitenflügel', items: [
    '🧳 <b>Gepäckhalle:</b> Im Fenster des Hauptbahnhofs kannst du links oder rechts einen Seitenflügel anbauen. Dann ist der Bahnhof ein Feld breiter (ungerade) – Portal und Eingang liegen mittig auf genau einem Feld, passend zu einem 1er-Weg.',
  ] },
  { id: '2026-10-06-drehen', date: '6. Oktober', title: 'Ganze Anlagen drehen', items: [
    '⟳ <b>Mehrere Dinge drehen:</b> Mit ✋ ein Rechteck aufziehen, dann mit ⟳ (oder R, Mausrad) die ganze Anlage in Vierteldrehungen drehen – jedes Ding dreht mit, alles bleibt zueinander gleich.',
    '🌳 <b>Parks ziehen komplett um:</b> Parkrasen, Freizeitpark-Boden und Hecken, Zäune, Mauern samt Toren kommen jetzt mit.',
    '🧹 Keine grünen Linien mehr über Plätzen, Einwohner etwas kleiner.',
  ] },
  { id: '2026-10-06-freunde', date: '6. Oktober', title: 'Freunde: dein Name & was du verpasst hast', items: [
    '🏷️ <b>Dein Name:</b> Freunde sehen jetzt den Namen auf deinem Schild (Du → Figur), nicht mehr den aus dem Google-Konto.',
    '💌 <b>Während du weg warst:</b> Beim Öffnen zeigt eine Karte, wer da war, ein Herz dagelassen, ins Gästebuch geschrieben oder dir ein Päckchen geschickt hat. Am 🌐-Knopf steht, wie viel Neues wartet.',
    '🔑 <b>Freundescode:</b> FNYMI- steht schon da – nur noch die 5 Zeichen eintippen.',
  ] },
  { id: '2026-10-06-bahn', date: '6. Oktober', title: 'Die Bahn wird gemütlich', items: [
    '🌿 <b>Gleis-Stile:</b> Schotter, Rasengleis, Waldbahn, Pflastergleis und Blumengleis. Beim Bauen in der Leiste wählen, über alte Gleise drüberziehen oder ein Gleis antippen und auf alle übertragen – umstellen kostet nichts.',
    '🌸 <b>Bahnhöfe mit Blumen:</b> Blumenkästen, Kübel, eine Blumenampel und warme Lampen unterm Bahnsteigdach.',
    '☁️ <b>Ohne Oberleitung:</b> keine grauen Masten und Drähte mehr über den Gleisen (Strom brauchen die Züge weiterhin).',
    '🎨 Stadtschmuck in der Kunstakademie ist günstiger, und Bänke stecken nicht mehr ineinander.',
  ] },
  { id: '2026-10-06-schmuck', date: '6. Oktober', title: 'Stadtschmuck in Formen und Farben & ein Knopf für Online', items: [
    '⛲ <b>Neue Brunnen:</b> Etagenbrunnen, Fontäne, Fischbrunnen und Blumenbrunnen – und der Kristallbrunnen funkelt prächtiger.',
    '🏮 <b>Laternen und Bänke nach Wunsch:</b> je 5 Formen (Kandelaber, Lampion, Pilzlaterne … Gartenbank, Picknicktisch, Rundbank …) und 8 Farben. Wählen beim Bauen in der Leiste oder antippen und umstellen. Die Gruppe heißt jetzt „Stadtschmuck“.',
    '🌐 <b>Eigener Knopf für Online:</b> Freunde und Online-Speicher findest du jetzt oben unter 🌐.',
  ] },
  { id: '2026-10-06-fuereinander', date: '6. Oktober', title: 'Füreinander: Wunschzettel, Freundschaft & Partnerstadt', items: [
    '📌 <b>Wunschzettel:</b> Im Rathaus hängst du einen Wunsch aus (z. B. 200 Bretter). Deine Freunde sehen ihn unter 👥 und helfen mit einem Klick – du sagst automatisch Danke.',
    '💛 <b>Freundschaft wächst:</b> Besuche, Herzen, Gästebuch und Päckchen lassen bei jedem Freund Herzen wachsen (bis 5). Dafür gibt es Freundschaftsband, Herzballon, Freundesbank und Freundschaftsbaum.',
    '🚩 <b>Partnerstadt:</b> Wähl unter 👥 einen Freund als Partnerstadt – seine Flagge weht neben deinem Rathaus, und ab und zu legt sein Boot an deinem Hafen an.',
  ] },
  { id: '2026-10-06-figur', date: '6. Oktober', title: 'Deine Figur, Freunde, Tag & Nacht – und alles aufgeräumt', items: [
    '🐾 <b>Deine Figur:</b> Du läufst jetzt selbst über deine Insel! Tipp dich an – du sagst dir, was gerade dran ist (fehlendes Material, Ausbauen, Wünsche). Tier, Farben, Hüte, Brillen, Schal, Ballon …: oben der neue Knopf mit deinem Gesicht.',
    '🧭 <b>Aufgeräumt:</b> 🏛️ Rathaus = deine Stadt (Zu tun, Bewohner, Inseln, Ort). Knopf mit deinem Gesicht = du (Figur, Erfolge, Album, Tagebuch). 🌐 = Freunde und Online-Speicher. ☰ = Hilfe und Einstellungen.',
    '❓ <b>Hilfe in einem Buch:</b> Anleitung, Tipps und Nachschlagen zusammen, oben eine Suche.',
    '☁️ <b>Online-Speicher & Freunde:</b> Mit Google anmelden – die Insel ist auf allen Geräten gleich. Freunde besuchen, Herzen und Gästebuch-Einträge dalassen, Päckchen schicken.',
    '🌙 <b>Tag und Nacht:</b> Ein Tag dauert jetzt 24 Minuten und läuft weiter, auch wenn das Spiel zu ist – oben am Ortsnamen zeigen Sonne und Mond die Tageszeit, im Rathaus steht die Uhrzeit. Ein Drittel ist Nacht: Laternen, Glühwürmchen und endlich auch Sternschnuppen über der Sternwarte.',
  ] },
  { id: '2026-10-06-hilfe', date: '6. Oktober', title: 'Hilfe am Ort & Vorplätze', items: [
    '❓ <b>Hilfe am Ort:</b> Alles mit einem kleinen ? lässt sich antippen – fehlendes Material („Wo kriege ich Metall her?“), die Wünsche der Häuser, Begriffe wie Viertel oder Strom. „Zeig mir“ wählt gleich das richtige Gebäude.',
    '📚 <b>Nachschlagen:</b> Ein Buch mit Suche – alle Gebäude, Rohstoffe, Wünsche und Begriffe (☰ → ❓ Hilfe).',
    '🧱 <b>Vorplätze:</b> Liegt ein Weg vor der Tür, führt jetzt bei allen Gebäuden ein Weg oder Platz im selben Muster bis zur Tür.',
  ] },
  { id: '2026-10-05-wilmer', date: '5. Oktober', title: 'Wilmerhecke & neuer Hauptbahnhof', items: [
    '🌳 <b>Wilmerhecke:</b> Bei den Hecken gibt es eine Hecke aus lauter kleinen runden Büschen – einfach ziehen wie einen Zaun. Gleich frei, auch mit Blüten oder Lichterkette.',
    '🚉 <b>Hauptbahnhof neu:</b> Portal mit Uhrturm genau in der Mitte, ein Weg vor dem Portal führt bis an die Tür. Schönere Bahnsteigdächer, dazu Laternen, Bänke und Bahnsteiguhren.',
  ] },
  { id: '2026-10-05-kap', date: '5. Oktober', title: 'Leuchtturm-Kap, Märchenschloss & Wege nach Wunsch', items: [
    '🗼 <b>Leuchtturm-Kap:</b> Das Finale ist ein großes Kap mit Leuchtfeuer, Wärterhaus, Laternen-Girlanden und Feuerwerk. Dein alter Leuchtturm wächst mit, wo Platz ist – sonst im Fenster „Zum Kap ausbauen“.',
    '🏰 <b>Märchenschloss wie im Märchen:</b> runde Türme, Balkone und Goldbänder rundherum, Fenster nach Wunsch – und statt der Steinplatte Rasen oder ein Platz im Wegmuster deiner Wahl.',
    '🛤️ <b>Wege nach Wunsch:</b> ganz breit oder schmal, Kurven rund oder eckig, Enden bis ans Gebäude. Vor jedem kleinen Haus führt ein Gartenweg von selbst zur Tür.',
    '🎨 <b>Umfärben:</b> Windräder, Läden, Hotels, Kultur- und Deko-Bauten bekommen deine Farben – auf Wunsch gleich alle gleichen auf einmal.',
    '🧰 <b>Viele kleine Reparaturen:</b> Rückgängig, Verschieben und Abreißen rechnen genau, „Neue Insel“ fragt in einem eigenen Fenster, und im Menü gibt es „Bildrate: flüssig / sparsam“.',
  ] },
  { id: '2026-10-03-freizeitpark', date: '3. Oktober', title: 'Dein eigener Freizeitpark', items: [
    '🎢 <b>Freizeitpark</b> (nach dem Laternenfest, 🎡 Freizeit): Zieh bunten Parkboden auf und stell Fahrgeschäfte darauf – Märchenschloss, Karussells, Teetassen, Freifallturm, Geisterbahn, Wildwasserbahn, Zuckerwatte und mehr. Aus dem Rummelplatz wird ein Wunderland.',
    '🎢 <b>Achterbahn:</b> Zieh die Schiene wie einen Weg als Rundkurs, setz eine Station hinein – mit Lifthügel und Looping.',
    '🎆 <b>Parade:</b> Im Fenster des Parkbodens feierst du eine Parade mit Feuerwerk – 3 Minuten lang mehr Einnahmen.',
    '🛤️ <b>Mehr Freiheit:</b> Deko darf auf Wege, Gebäude ersetzen Wege, und Zäune bekommen ein Gartentor oder einen offenen Durchgang.',
  ] },
  { id: '2026-10-02-bewohner', date: '2. Oktober', title: 'Bewohner mit Tagesablauf', items: [
    '🐾 <b>Neue Bewohner:</b> Mit jeder entdeckten Insel zieht eine neue Tierart ein – Eichhörnchen, Igel, Fuchs, Giraffe, Elefant und Ente. In jedem Wohnhaus wohnt jemand.',
    '🌅 <b>Ein Tag auf der Insel:</b> Morgens zur Arbeit oder Schule, mittags ins Café oder auf den Markt, abends in den Park – nachts schlafen die meisten.',
    '👆 <b>Tipp eine Figur an:</b> Du siehst, wer das ist, wo sie wohnt und wohin sie gerade geht. Alle Familien stehen im Rathaus unter „Bewohner“.',
    '📍 <b>Der Platz zählt:</b> Windräder am Wasser, Solar auf Sand, Holzfäller im Wald … bringen bis +50 %. Die Vorschau beim Bauen zeigt es.',
  ] },
  { id: '2026-10-01-ordnung', date: '1. Oktober', title: 'Bau-Leiste neu sortiert & Suche', items: [
    '🧭 <b>Leiste nach einer einfachen Regel:</b> 🏭 Herstellen arbeitet ohne Kundschaft, 🛍️ Verkaufen braucht Kundschaft, 🎡 Freizeit zieht Besucher an oder bringt Ideen. Dazu 🏠 Wohnen, 🌸 Deko und 🛤️ Wege & Land.',
    '🔍 <b>Suche:</b> Lupe antippen, „bäck“ tippen – schon steht die Bäckerei da.',
  ] },
  { id: '2026-09-30-leiste', date: '30. September', title: 'Personal, Kaufkraft & ein längeres Finale', items: [
    '👷 <b>Läden haben Personal:</b> Ein Laden bedient bis zu 150 Kunden je Mitarbeiter. Steht „Voll“ in seinem Fenster, lohnt sich ein zweiter.',
    '💰 <b>Kaufkraft:</b> Ab etwa 8–10 Läden je Viertel bringt jeder weitere weniger dazu.',
    '🏮 <b>Das große Finale dauert länger:</b> Die letzten Stufen, der Leuchtturm und ferne Inseln kosten Minuten deines besten Einkommens.',
    '📦 <b>Lager:</b> Läden verkaufen Holz, Stein und Erz erst ab 500 und Obst ab 2.000.',
  ] },
  { id: '2026-09-30-laeden', also: ['2026-10-01'], date: '30. September', title: 'Läden, Innenstadt & Kultur', items: [
    '🛍️ <b>Läden!</b> Café, Teeladen, Eisdiele, Buchladen, Pizzeria, Juwelier, Möbelhaus … Sie verdienen an den Leuten im Viertel und an Besuchern und verkaufen Waren aus dem Lager.',
    '🏙️ <b>Innenstadt:</b> Viele verschiedene Läden in einem Viertel bringen bis zu +100 %.',
    '🎭 <b>Kultur:</b> Kino, Theater, Museum, Konzerthalle, Aquarium, Zoo, Stadion, Hotels und Kaufhaus ziehen Besucher an. ☕ Kaffee, Tee und Kakao wachsen auf den fernen Inseln.',
  ] },
  { id: '2026-09-30', date: '29. September', title: 'Aufträge am Hafen', items: [
    '🚢 <b>Aufträge statt Börse:</b> Am Handelshafen legen Frachter an und kaufen dir ab, was sich stapelt. Am Großen Hafen gibt es Großaufträge – die Finanzspritze fürs Schloss.',
    '🌊 <b>Schiffe fahren übers Wasser</b> und suchen sich den Weg um die Inseln herum.',
  ] },
];
const NEWS = NEWS_HISTORY[0];
const NEWS_KEY = 'kachelhausen_news';
const newsSeenId = () => { try { return localStorage.getItem(NEWS_KEY); } catch (e) { return NEWS.id; } };
const newsSeen = () => newsSeenId() === NEWS.id;
function markNewsSeen() { try { localStorage.setItem(NEWS_KEY, NEWS.id); } catch (e) { /* privates Fenster: dann eben nicht */ } }
// Wie viele Updates hat dieses Gerät verpasst? (unbekannter oder fehlender Stand: alle)
function newsUnseen(seen = newsSeenId()) {
  const i = NEWS_HISTORY.findIndex(n => n.id === seen || (n.also || []).includes(seen));
  return i < 0 ? NEWS_HISTORY.length : i;
}
// Einträge desselben Tages als eine Karte (Nutzer, 08.10.2026: „nicht 20× am 08.10.“) – die Daten bleiben je Push einzeln (gesehen-Stand)
function newsDays(list) {
  const out = [];
  for (const n of list) {
    const last = out[out.length - 1];
    if (last && last.date === n.date) { last.titles.push(n.title); last.items.push(...n.items); last.n++; }
    else out.push({ date: n.date, titles: [n.title], items: [...n.items], n: 1 });
  }
  return out;
}
// all: aus dem Menü – die ganze Geschichte; sonst nur das Verpasste
function showNews(all = false) {
  const miss = newsUnseen(), days = newsDays(all ? NEWS_HISTORY : NEWS_HISTORY.slice(0, Math.max(1, miss)));
  const newDays = all ? newsDays(NEWS_HISTORY.slice(0, miss)).length : days.length;
  markNewsSeen();
  const entry = (d, i) => `<details class="news-v"${i === 0 ? ' open' : ''}><summary><b>${d.date}</b> <small class="muted">${d.titles.slice(0, 4).join(' · ')}${d.titles.length > 4 ? ` · + ${d.titles.length - 4} weitere` : ''}${all && i < newDays ? ' · neu für dich' : ''}</small></summary>
    <ul class="news">${d.items.map(t => `<li>${t}</li>`).join('')}</ul></details>`;
  openModal(`
    <h2>✨ Das ist neu</h2>
    ${!all && days.length > 1 ? `<p class="muted">Seit du zuletzt hier warst, gab es an <b>${days.length} Tagen</b> Neues. Der neueste ist aufgeklappt – die älteren kannst du antippen, wenn du magst.</p>` : ''}
    ${days.map(entry).join('')}
    ${!all ? '<p class="muted">Alle Updates: ☰ → ✨ Das ist neu.</p>' : ''}
    <div class="row"><button class="btn" id="m-ok" style="flex:1">Los geht's!</button></div>`);
  $('modal-card').classList.add('news-card');
  $('m-ok').onclick = closeModal;
}
// Beim Start: mit Spielstand zeigen, sobald kein anderes Fenster (Hinweise zu Umbauten, Expedition …) offen ist
function newsAfterLoad(hadSave) {
  if (!hadSave) { markNewsSeen(); return; }
  const tryShow = () => { if (newsSeen()) return; if (!$('modal').hidden) { setTimeout(tryShow, 1000); return; } showNews(); };
  setTimeout(tryShow, 2500);
}
// ☰ (Nutzer, 09.10.2026): kurz – Hilfe, Neues, Rathaus, ⚙️ Einstellungen (settings.js), 💾 Spielstand
function showMenu() {
  openModal(`
    <h2>Menü</h2>
    <div class="row"><button class="btn" id="m-help" style="flex:1">❓ Hilfe: Anleitung, Tipps, Nachschlagen</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-news">✨ Das ist neu</button><button class="btn ghost" style="flex:1" id="m-home">🏛️ Zum Rathaus</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-settings">⚙️ Einstellungen ›</button><button class="btn ghost" style="flex:1" id="m-savegame">💾 Spielstand ›</button></div>
    <p class="muted">Figur, Erfolge, Album und Tagebuch findest du oben bei dir (${ANIMALS[meLook().a].icon}), Freunde und Online-Speicher unter 🌐.</p>
    <div class="row"><button class="btn" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  $('m-help').onclick = () => { lexQ = ''; openHelp(helpTab === 'lex' ? 'start' : helpTab); };   // alte Suche nicht wieder vorsetzen
  $('m-news').onclick = () => showNews(true);
  $('m-settings').onclick = () => showSettings();
  $('m-savegame').onclick = () => showSaveMenu();
  $('m-home').onclick = () => { const h = townHallAt(), c = h ? iso(h[0] + 1, h[1] + 1) : iso(ISLAND.cx, ISLAND.cy); state.cam.x = c.x; state.cam.y = c.y; closeModal(); };   // wo es wirklich steht
  $('m-close').onclick = closeModal;
}
// ☰ → 💾 Spielstand: sichern, laden, neu beginnen
function showSaveMenu() {
  openModal(`
    <h2>💾 Spielstand</h2>
    <p class="muted">Als Datei sichern oder laden – zusätzlich zum ☁️ Online-Speicher unter 🌐.</p>
    <div class="row">
      <button class="btn ghost" style="flex:1" id="m-export">💾 Spielstand sichern</button>
      <button class="btn ghost" style="flex:1" id="m-import">📂 Spielstand laden</button>
    </div>
    <div class="row"><button class="btn danger" id="m-reset">Neue Insel beginnen</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-back">Zurück</button><button class="btn" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  $('m-back').onclick = () => showMenu();
  $('m-close').onclick = closeModal;
  $('m-export').onclick = () => { exportSave(); toast('Spielstand als Datei gesichert'); };
  $('m-import').onclick = () => $('import-file').click();
  $('m-reset').onclick = () => {                 // eigenes Fenster (Block 84a): zweimal schnell tippen löscht nichts
    openModal(`
      <h2>Neue Insel beginnen?</h2>
      <p>Deine Insel <b>${escHtml(state.town.name)}</b> geht dabei verloren. ${cloudUser ? 'Im ☁️ Online-Speicher bleibt sie unter „Frühere Stände“.' : 'Sichere sie vorher als Datei, wenn du sie behalten willst.'}</p>
      <div class="row"><button class="btn ghost" id="m-no">Lieber nicht</button><button class="btn" id="m-save">💾 Erst sichern</button><button class="btn danger" id="m-yes-new">Ja, neu beginnen</button></div>`);
    $('m-no').onclick = showSaveMenu;
    $('m-save').onclick = () => { exportSave(); toast('Spielstand als Datei gesichert'); };
    $('m-yes-new').onclick = () => { setTool('look'); const me = state.me; startNew(); state.me = me; closeModal(); closePanel(); showIntro(true); cloudNewWorld(); };   // deine Figur ziehst du mit um   // alte Insel bleibt in der Cloud gesichert
  };
}
$('menu-btn').onclick = showMenu;
// Knöpfe oben (Block 52): mit dem Finger schon beim Loslassen auslösen – ohne auf Safaris Klick zu warten, der den ersten
// Tipp manchmal nur als „Finger drüber“ wertet. Der Klick danach wird dann ignoriert; Maus und Tastatur wie gehabt.
function fastTap(el) {
  let down = false, at = -1e9, x0 = 0, y0 = 0;
  const own = el.onclick;
  el.addEventListener('pointerdown', e => { down = e.pointerType !== 'mouse'; x0 = e.clientX; y0 = e.clientY; });
  el.addEventListener('pointercancel', () => { down = false; });
  el.addEventListener('pointerup', e => {
    if (!down) return;
    down = false;
    if (Math.hypot(e.clientX - x0, e.clientY - y0) > 12) return;    // gewischt, nicht getippt (Block 84e)
    at = performance.now(); own.call(el, e);
  });
  el.onclick = e => { if (performance.now() - at < 800) return; own.call(el, e); };
}
for (const el of [...document.querySelectorAll('#hud .pill'), $('goal')]) if (el.onclick) fastTap(el);

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
  catch (err) { fail('Diese Datei ist kein lesbarer Fnymiland-Spielstand.'); return; }
  openModal(`
    <h2>Spielstand laden?</h2>
    <p>Insel <b>${escHtml(s.town.name)}</b> mit 🪙 ${fmt(s.money)} und ${s.tiles.size} Gebäuden.</p>
    <p class="muted">Deine jetzige Insel wird dabei ersetzt. Sichere sie vorher, falls du sie behalten willst.</p>
    <div class="row">
      <button class="btn" id="m-yes">Laden</button>
      <button class="btn ghost" id="m-no">Abbrechen</button>
    </div>`);
  $('m-yes').onclick = () => { adoptState(s); closeModal(); closePanel(); toast(`Willkommen zurück in ${s.town.name}!`); cloudNewWorld(); };
  $('m-no').onclick = closeModal;
});

// Rohstoffe fließen ins Lager; Verarbeitung nimmt, was da ist
// Läden verkaufen aus dem Lager (so viel da ist) – das Geld kommt sofort, die Rate zeigt oben die Leiste
let saleRate = 0;
const soldRate = {};                   // was Läden wirklich verkaufen (je Ware 'holz', je Laden 'x,y|holz'), geglättet – fürs Lager und Infofenster
function resetSales() { saleRate = 0; for (const k of Object.keys(soldRate)) delete soldRate[k]; }     // neues Spiel / anderer Stand
function produce(dt) {
  const before = { ...state.res }, m = boostMul('prod');                // Erlass „Doppelte Ernte“
  for (const [r, v] of Object.entries(T.prod)) state.res[r] += v * m * dt;
  // Erst verarbeiten (Sägewerk & Co.), dann verkaufen – sonst verkauft die Markthalle das Holz, bevor es Bretter werden
  for (const c of T.conv) {
    const want = c.rate * m * dt, can = Math.min(want, state.res[c.from] / CONV_RATIO);
    if (can <= 0) continue;
    state.res[c.from] -= can * CONV_RATIO;
    state.res[c.to] += can;
  }
  let got = 0;
  const now = {};
  for (const sl of T.sales || []) {
    const n = Math.min(sl.rate * dt, saleable(sl.res));                   // nur, was über dem Vorrat liegt
    if (n <= 0) continue;
    state.res[sl.res] -= n; got += n * sl.pay;
    now[sl.res] = (now[sl.res] || 0) + n;
    const key = sl.k + '|' + sl.res; now[key] = (now[key] || 0) + n;
  }
  if (got) { state.money += got; state.stats.earned += got; }
  if (dt > 0) {
    const a = Math.min(1, dt);
    saleRate += (got / dt - saleRate) * a;
    for (const key of new Set([...Object.keys(soldRate), ...Object.keys(now)])) {     // wirklich verkauft (je Ware und je Laden)
      soldRate[key] = (soldRate[key] || 0) + ((now[key] || 0) / dt - (soldRate[key] || 0)) * a;
      if (!now[key] && soldRate[key] < 1e-4) delete soldRate[key];
    }
  }
  return before;
}
