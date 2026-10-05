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
function thumb(type, lvl = 1, tile = null) {
  const prev = g;
  try { return thumbRaw(type, lvl, tile); } catch (e) { g = prev; reportError(e); const c = document.createElement('canvas'); c.width = 112; c.height = 88; return c; }
}
function thumbRaw(type, lvl = 1, tile = null) {
  const c = document.createElement('canvas');
  c.width = 112; c.height = 88;
  const prev = g; g = c.getContext('2d'); FOG = false;
  const tall = ['leuchtturm', 'windrad', 'offshore'].includes(type), big = isBig(type);
  const z = type === 'leuchtturm' ? 0.36 : big ? 0.72 : tall ? 0.95 : 1.3, cx = 56, cy = type === 'leuchtturm' ? 64 : tall ? 70 : 60, hw = TW / 2 * z, hh = TH / 2 * z, d = DEPTH * z * 0.8;
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
    drawPath(cx, cy, z, 1e6, 1e6, { style: currentStyle('weg') });
  } else if (type === 'schiene') {
    block(1, '#96d56f');
    drawObject('schiene', cx, cy, z, 0, 1e6, 1e6, 1, { rot: 0 });
  } else if (EDGE_TOOLS.has(type)) {                       // Hecke, Zaun, Mauer: zwei Kanten über Eck im aktuellen Stil
    block(1, '#96d56f');
    EDGE_PROJ = (u, v) => ({ x: cx + (u - v) * TW / 2 * z, y: cy + (u + v) * TH / 2 * z });
    try { for (const k of ['b0,0', 'a0,0']) drawEdge(k, { b: type, style: currentStyle(type) }, z * 1.3, 0); } finally { EDGE_PROJ = null; }
  } else {
    const wet = ['meer', 'offshore', 'boot'].includes((ITEMS[type] || {}).needs);        // steht im Wasser: Wasser als Untergrund
    const ground = wet ? '#74d0e6' : { stein: '#aabb94', holz: '#7fc460', obst: '#86c35b', mine: '#b0a287', kristallmine: '#b3c2cc' }[type] || '#96d56f';
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
function updateUndoBtn() { const b = document.querySelector('.quick.undo'); if (b) b.disabled = !undoStack.length && !moving; }
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
  // ↶ Rückgängig (Block 45): grau, wenn es nichts zurückzunehmen gibt; Strg/⌘+Z
  const un = document.createElement('button');
  un.className = 'quick undo'; un.textContent = '↶';
  un.title = 'Rückgängig (Strg/⌘+Z)'; un.setAttribute('aria-label', 'Rückgängig');
  un.onclick = () => { audio(); undo(); };
  cats.append(un); updateUndoBtn();
  const sep = document.createElement('span'); sep.className = 'quick-sep'; cats.append(sep);
  // 🔍 Suche (Block 38): findet jedes Ding beim Namen, egal in welchem Bereich
  const find = document.createElement('button');
  find.className = 'quick find' + (searchQ != null ? ' active' : '');
  find.textContent = '🔍'; find.title = 'Suchen'; find.setAttribute('aria-label', 'Suchen');
  find.onclick = () => { audio(); searchQ = searchQ == null ? '' : null; if (PHONE) setSheet(searchQ != null); buildToolbar(); };
  cats.append(find);
  // Bereiche (Stadt · Herstellen · Einkaufen · Freizeit · Gestalten); ein Werkzeug aus einem anderen Bereich
  // wird weggelegt. Jeder Bereich merkt sich seinen Filter (subOf), ein unbekannter Filter wird zum ersten des Bereichs.
  const top = MENU.find(m => m.id === menuTop) || MENU[0];
  if (top.groups ? !top.groups.some(g => g.id === menuSub) : menuSub !== 'alle') menuSub = firstSub(top.id);
  subOf[top.id] = menuSub;
  const keep = () => { if (tool !== 'look' && !QUICK.some(([id]) => id === tool) && !menuItemsOf(menuTop, menuSub).includes(tool)) { tool = 'look'; plan = null; } };   // angefangene Linie mit weg
  for (const m of MENU) {
    const b = document.createElement('button');
    b.className = 'cat' + (m.id === menuTop && searchQ == null ? ' active' : '');
    b.dataset.menu = m.id;
    menuLabel(b, m.label);
    // Handy: der Bereich klappt den Katalog auf (nochmal antippen: zu)
    b.onclick = () => { if (PHONE) setSheet(!(sheetOpen && menuTop === m.id && searchQ == null)); searchQ = null; menuTop = m.id; menuSub = subOf[m.id] || firstSub(m.id); keep(); buildToolbar(); };
    cats.append(b);
  }
  // Filter nach Zweck (oder das Suchfeld); darunter eine Zeile mit der Regel des Bereichs
  const subs = $('subcats'), hadFocus = document.activeElement && document.activeElement.id === 'search-in';
  subs.innerHTML = '';
  if (searchQ != null) {
    subs.hidden = false;
    const inp = document.createElement('input');
    inp.id = 'search-in'; inp.className = 'search-in'; inp.type = 'search'; inp.placeholder = 'Suchen, z. B. Bäckerei';
    inp.value = searchQ; inp.setAttribute('aria-label', 'Gebäude suchen'); inp.autocomplete = 'off';
    inp.oninput = () => { searchQ = inp.value; renderTools(); };
    inp.onkeydown = e => { if (e.key === 'Escape') { searchQ = null; buildToolbar(); } };
    subs.append(inp);
    requestAnimationFrame(() => { if (searchQ != null && (hadFocus || !PHONE || sheetOpen)) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } });
  } else {
    subs.hidden = !top.groups;
    if (top.groups) for (const { id, label } of top.groups) {
      const b = document.createElement('button');
      b.className = 'sub' + (id === menuSub ? ' active' : '');
      b.dataset.sub = id;
      menuLabel(b, label);
      b.onclick = () => { menuSub = id; keep(); buildToolbar(); };
      subs.append(b);
    }
  }
  renderTools();
  setTool(tool);
}
// Kacheln: nur Bild und Preis (Name beim Zeigen und im Infofenster); Freies zuerst, Gesperrtes dahinter
function renderTools() {
  hideCardName();
  const box = $('tools');
  box.innerHTML = '';
  const list = menuList();
  if (searchQ != null && !list.length) {
    const p = document.createElement('p'); p.className = 'search-none';
    p.textContent = searchQ.trim() ? 'Nichts gefunden' : 'Tippe einen Namen ein'; box.append(p);
  }
  for (const id of list) {
    const d = ITEMS[id], locked = !available(id);
    const b = document.createElement('button');
    b.className = 'tool' + (locked ? ' locked' : '') + (tool === id ? ' active' : '');
    b.dataset.tool = id;
    b.dataset.name = d.name + (locked ? ' · 🔒 ' + unlockText(d, true) : '');
    b.setAttribute('aria-label', d.name);
    b.onpointerenter = e => { if (e.pointerType === 'mouse') showCardName(b); };
    b.onpointerleave = hideCardName;
    b.append(id === 'abriss' ? emojiPic('🧹') : id === 'verschieben' ? emojiPic('✋') : thumb(id));
    const c = document.createElement('span'); c.className = 'cost'; c.textContent = cardPrice(id);
    b.append(c);
    if (locked) { const l = document.createElement('span'); l.className = 'lock'; l.textContent = '🔒'; b.append(l); }
    if (d.cost) b.dataset.cost = d.cost;
    if (d.mat) b.dataset.mat = JSON.stringify(d.mat);
    b.onclick = () => pickCard(id);
    box.append(b);
  }
}
let searchQ = null;                    // null = keine Suche, sonst der eingetippte Text
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
const menuList = () => { const all = searchQ != null ? searchHits(searchQ) : menuItemsOf(menuTop, menuSub); return [...all.filter(available), ...all.filter(id => !available(id))]; };
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

function setTool(t) {
  if (t !== 'verschieben' && moving) cancelMove();
  if (t !== tool) plan = null;                  // nur beim Wechsel: die Leiste baut sich auch so neu auf (Freischaltung)
  if (t !== tool || t === 'look') rotManual = false;   // selbst gedreht: gilt bis zum Werkzeugwechsel (Block 84b)
  tool = t;
  previewCache = null;
  if (buildInfo ? buildInfo !== t : t !== 'look') closePanel();     // Bau-Infofenster bleibt, solange sein Ding gewählt ist
  for (const b of document.querySelectorAll('.tool')) b.classList.toggle('active', b.dataset.tool === baseOf(t));   // auch bei einer anderen Größe
  for (const b of document.querySelectorAll('.quick')) b.classList.toggle('active', b.dataset.quick === t);
  $('rot-btn').hidden = !ROTATABLE.has(t);
  renderStyleBar(t);
  updateHint();
}
// Hinweis über der Leiste: auf dem Handy nur Name, Preis und wie man baut (sonst verdeckt er die halbe Karte) und ein ⓘ
// fürs Infofenster; am iPad/Mac ohne Infofenster ausführlich, mit Infofenster nur, wie man baut
function updateHint() {
  const hint = $('hint'), t = tool;
  if (t === 'look') { hint.hidden = true; return; }
  const d = ITEMS[t];
  if (PHONE) {
    const how = LINE_TOOLS.has(t) ? 'Anfang und Ende antippen' : t === 'verschieben' ? 'antippen oder Rechteck aufziehen'
      : dragKind(t) === 'rect' ? 'antippen oder Fläche aufziehen' : 'Platz antippen, nochmal tippen baut';
    hint.textContent = `${d.name}${WONDERS[t] ? ' · 🪙 ' + fmt(wonderTotal(t)) + ' in ' + WONDERS[t].phases.length + ' Abschnitten' : d.cost ? ' · 🪙 ' + fmt(d.cost) : ''}${d.mat ? ' ' + matText(d.mat) : ''} · ${how}`;
    const i = document.createElement('button');
    i.className = 'hint-info'; i.textContent = 'ⓘ'; i.setAttribute('aria-label', `Mehr über ${d.name}`);
    i.onclick = () => { audio(); openBuildInfo(t); };
    hint.append(' ', i);
    hint.hidden = false;
    return;
  }
  const how = [LINE_TOOLS.has(t) ? 'Linie: Anfang und Ende anklicken' : '',
    t === 'verschieben' ? 'Mehrere auf einmal: Rechteck aufziehen'
      : t === 'abriss' ? 'Fläche: aufziehen, hineinklicken reißt ab'
      : dragKind(t) === 'rect' ? 'Fläche: aufziehen, hineinklicken baut' : '',
    d.paint || dragKind(t) ? 'Karte bewegen: rechte Maustaste (iPad: zwei Finger)' : '',
    ROTATABLE.has(t) && !d.small ? 'Tür zeigt von selbst zum Weg (drehen: ⟳/Mausrad)' : ROTATABLE.has(t) ? 'drehen: ⟳' : ''].filter(Boolean);
  // Beschreibung und Werte stehen im Infofenster – hier nur, wie man baut; beim Weg gar nichts (Stil-Leiste reicht)
  if (t === 'weg') { hint.hidden = true; return; }
  hint.textContent = [d.name, ...(how.length ? how : ['Platz auf der Karte anklicken'])].join(' · ');
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
  const name = gp ? 'Gartenweg zur Tür' : courtIsPlaza(C0) ? 'Vorplatz' : 'Weg zur Tür';
  if (!gp && !ct && (!C0.own || C0.bare)) return `<div class="label">${name}</div><p class="muted">Liegt ein Weg vor der Tür, führt ein Belag im Stil des Wegs bis zur Tür.</p>`;
  const on = t.zug !== false, plaza = !!(C0 && courtIsPlaza(C0)), auto = gp || ct ? 'Wie der Weg vor der Tür' : 'Wie bisher';
  return `<div class="looks"><button class="look${on ? ' on' : ''}" data-zug="1" aria-pressed="${on}">${plaza ? '🧱' : '🌿'} ${name}</button></div>
    ${on ? `<div class="label">Belag</div><div class="swatches"><button class="sw bunt${courtVp(t) ? '' : ' on'}" data-vp="" aria-label="${auto}" title="${auto}"></button>${STYLES.weg.filter(st => styleOk(st) && !(plaza && PATH_LOOK[st.id].stones)).map(st =>
      `<button class="sw${courtVp(t) === st.id ? ' on' : ''}" data-vp="${st.id}" style="background:${styleSwatch(st)}" aria-label="Belag ${escHtml(st.name)}" title="${escHtml(st.name)}"></button>`).join('')}</div>` : ''}`;
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
// Farbchips in der Musterleiste (Block 89): gewählte Farbe gilt für neu Gebautes (state.paintNew[key])
function bushChips(key) {
  const cur = (state.paintNew[key] && state.paintNew[key].col) || 0;
  return '<span class="style-sep"></span>' + BUSH_COLS.map((c, i) => [c, i]).filter(([, i]) => bushColOk(i)).map(([c, i]) =>
    `<button class="style-chip${i === cur ? ' on' : ''}" data-bchip="${i}" title="${c.name}" aria-label="Farbe: ${c.name}"><i style="background:${c.c[0]}"></i><span>${c.name}</span></button>`).join('');
}
function wireBushChips(bar, key, t) {
  for (const b of bar.querySelectorAll('[data-bchip]')) b.onclick = () => { state.paintNew[key] = { col: +b.dataset.bchip }; previewCache = null; sfx('deco'); save(); renderStyleBar(t); };
}
function renderStyleBar(t) {
  const bar = $('style-bar'), sizes = SIZE_ORDER[baseOf(t)];
  document.body.classList.toggle('has-styles', !!STYLES[t] || !!sizes);
  if (sizes) {                                                   // Größen (Block 43): Klein · Mittel · Groß · Riesig
    const foot = id => ITEMS[id].small ? 'Ecke' : ITEMS[id].size ? ITEMS[id].size.join('×') : '1×1';
    bar.innerHTML = sizes.map(([k, id]) => `<button class="style-chip size-chip${id === t ? ' on' : ''}" data-size="${id}" title="${ITEMS[id].name}" aria-label="${SIZE_NAMES[k]}">
      <i>${SIZE_NAMES[k][0]}</i><span>${SIZE_NAMES[k]} · ${foot(id)}</span></button>`).join('');
    if (baseOf(t) === 'busch') bar.innerHTML += bushChips('busch');                     // Farbe gleich beim Bauen (Block 89)
    wireBushChips(bar, 'busch', t);
    for (const b of bar.querySelectorAll('[data-size]')) b.onclick = () => { const open = !!buildInfo; sizeChoice[baseOf(t)] = b.dataset.size; sfx('deco'); setTool(b.dataset.size); if (open) openBuildInfo(b.dataset.size); };
    bar.hidden = false;
    return;
  }
  if (!STYLES[t]) { bar.hidden = true; return; }
  const cur = currentStyle(t), have = STYLES[t].filter(styleOk), more = STYLES[t].length - have.length;
  bar.innerHTML = have.map(st => `<button class="style-chip${st.id === cur ? ' on' : ''}" data-style="${st.id}" title="${st.name}" aria-label="${st.name}">
      <i style="background:${styleSwatch(st)}"></i><span>${st.name}</span></button>`).join('')
    + (more ? `<button class="style-chip more" data-more="1" title="${more} weitere Wege in der Kunstakademie" aria-label="${more} weitere Wege freischalten">🎨<span>+${more}</span></button>` : '')
    + (t === 'weg' ? `<span class="style-sep"></span>${[['wide', '▭', '▬', 'schmal', 'ganz breit'], ['sq', '⌒', '⌐', 'Kurve rund', 'Kurve eckig']].map(([k, i0, i1, n0, n1]) =>   // Wegform (Block 77)
      `<button class="style-chip size-chip shape-chip${wegShape[k] ? ' on' : ''}" data-wegopt="${k}" aria-pressed="${wegShape[k]}" title="${wegShape[k] ? n1 : n0} – tippen zum Wechseln" aria-label="${wegShape[k] ? n1 : n0}"><i>${wegShape[k] ? i1 : i0}</i><span>${wegShape[k] ? n1 : n0}</span></button>`).join('')}` : '');
  if (t === 'hecke' && isWilmerStyle(cur)) { bar.innerHTML += bushChips('hecke'); wireBushChips(bar, 'hecke', t); }   // Farbe der Wilmerhecke (Block 89)
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
  if ($('diary-dot').hidden !== (state.diarySeen >= state.diary.length)) $('diary-dot').hidden = state.diarySeen >= state.diary.length;
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
  for (const id of Object.keys(ITEMS)) if (ITEMS[id].cat && !ITEMS[id].variantOf && id !== 'verschieben' && id !== 'abriss' && available(id)) out.add(id);
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
    else if (kind === 'natur') {                                   // Naturbeobachtungen: Fehlendes mit Hinweis, wo man sucht
      const n = NATURE_BY_ID[id], has = state.album.has(k);
      return `<div class="al-e${has ? '' : ' miss'}" title="${has ? n.name : n.hint}"><span class="emoji">${has ? n.icon : '❔'}</span><small>${has ? n.name : n.hint}</small></div>`;
    }
    else { const a = ANIMALS.find(q => q.id === id); name = a.family; pic = `<span class="emoji">${a.icon}</span>`; }
    return `<div class="al-e${state.album.has(k) ? '' : ' miss'}" title="${name}">${pic}<small>${name}</small></div>`;
  };
  openModal(`
    <h2>📒 Sammelalbum · ${Math.floor(got / all.length * 100)} %</h2>
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
  searchQ = null; menuTop = p.top; menuSub = p.sub;
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
  const worth = `<p class="muted">Wert ${fmt(t.price != null ? t.price : castlePrice(c))} Taler – mehr Größe, Türme und Stockwerke kosten den Unterschied, weniger gibt die Hälfte zurück.</p>`;
  if (castleTab === 'farben') return tabs;
  const toggle = (key, label) => `<button class="look${c[key] ? ' on' : ''}" data-cs="${key}:t" aria-pressed="${c[key] ? 'true' : 'false'}">${label}</button>`;
  if (castleTab === 'zierde') return `${tabs}
      <div class="label">Fahnen</div>${pick('fc')}
      <div class="label">Schmuck</div><div class="looks">${toggle('gd', '✨ Gold')}${toggle('bk', '🏯 Balkone & Erker')}${toggle('lc', '💡 Lichterketten')}${toggle('ex', '🪜 Freitreppe')}</div>
      <div class="label">Fenster</div>${pick('wn')}
      <div class="label">Wappen über dem Tor</div>${pick('wp')}
      <div class="label">Boden</div>${pick('gb')}
      ${c.gb ? `<div class="label">Belag ${c.gb === 1 ? '(Weg zum Portal)' : '(Platz)'}</div><div class="swatches">${STYLES.weg.filter(st => styleOk(st) && !PATH_LOOK[st.id].stones).map(st =>
        `<button class="sw${st.id === (c.gp || 'platten') ? ' on' : ''}" data-csgp="${st.id}" style="background:${styleSwatch(st)}" aria-label="Belag ${st.name}" title="${st.name}"></button>`).join('')}</div>` : ''}
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
function wegFormHtml(t, x, y) {
  const arms = pathArms(x, y), curve = !t.wide && !!roadCurve(arms), end = arms.length <= 1;
  const btn = (key, v, on, label) => `<button class="look${on ? ' on' : ''}" data-wegf="${key}:${v}">${label}</button>`;
  return `<div class="label">Form</div>
    <div class="looks">${btn('wide', 0, !t.wide, '▭ schmal')}${btn('wide', 1, !!t.wide, '▬ ganz breit')}</div>
    ${curve ? `<div class="looks">${btn('sq', 0, !t.sq, '⌒ Kurve rund')}${btn('sq', 1, !!t.sq, '⌐ Kurve eckig')}</div>` : ''}
    ${end && !t.wide ? `<div class="label">Ende</div><div class="looks">${btn('end', '', !t.end, '✨ automatisch')}${btn('end', 'rund', t.end === 'rund', '◖ rund')}${btn('end', 'rand', t.end === 'rand', '▌ bis an den Rand')}</div>
    <p class="muted">Automatisch: vor einem Gebäude läuft der Weg bis an die Wand, sonst endet er rund.</p>` : ''}`;
}
function wireWegForm(el, t, x, y) {
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
  for (const t of state.tiles.values()) if (baseOf(t.b) === 'busch') out.push(t);
  return out;
};
const wilmerAll = () => [...state.edges.values()].filter(e => e.b === 'hecke' && isWilmerStyle(e.style));
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
  if (more) more.onclick = () => openResearch('design');
}
const setCol = (obj, i) => { if (i) obj.col = i; else delete obj.col; };
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
  if (t.b === 'station') status.push(...stationStatus(x + ',' + y));
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
      ${colorsOf('wall').length + colorsOf('roof').length < 28 ? '<p class="muted"><span class="link" data-openart="1">Mehr Farben in der Kunstakademie 🎨</span></p>' : ''}`;
  }
  if (baseOf(t.b) === 'busch') colors += bushColHtml(t.col || 0, 'busch', bushAll().filter(o => o !== t && (o.col || 0) !== (t.col || 0)).length);   // Block 89
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
  // Märchenschloss (Block 60g/60h): Gestalt im Fenster, in Reitern (Form · Türme · Farben)
  const castle = isWegBridge(t) ? `<div class="label">Brücke</div><div class="looks">${Object.entries(WEG_BRIDGE).map(([id, B]) => `<button class="look${id === bridgeKind(t) ? ' on' : ''}" data-brk="${id}">${B.icon} ${B.name}</button>`).join('')}</div>
      <p class="muted">Von selbst passend zum Wegstil – hier für die ganze Brücke umstellen. Die alte gibt es voll zurück.</p>
      <div class="label">${BRIDGE_LOOK[bridgeKind(t)].wall ? 'Mauer und Brüstung' : 'Geländer und Pfähle'}</div>
      <div class="swatches"><button class="sw bunt${t.brc == null ? ' on' : ''}" data-brc="" aria-label="Farbe wie die Brücke" title="Wie die Brücke"></button>${BRIDGE_COLS.map((c, i) => `<button class="sw${t.brc === i ? ' on' : ''}" data-brc="${i}" style="background:${c}" aria-label="Brückenfarbe ${i + 1}"></button>`).join('')}</div>
      ${BRIDGE_LOOK[bridgeKind(t)].wall ? `<div class="label">Belag</div>
      <div class="swatches">${STYLES.weg.filter(st => styleOk(st) && !(PATH_LOOK[st.id] || {}).stones).map(st => `<button class="sw${(t.style || 'sand') === st.id ? ' on' : ''}" data-brs="${st.id}" style="background:${styleSwatch(st)}" aria-label="Belag ${escHtml(st.name)}" title="${escHtml(st.name)}"></button>`).join('')}</div>` : `<div class="label">Planken</div>
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
    ${castle}
    ${colors}
    <div class="row">
      ${ROTATABLE.has(t.b) ? '<button class="btn ghost" id="p-rot" aria-label="Drehen">⟳</button>' : ''}
      ${moveBtn}
      ${delButton(x, y)}
      <button class="btn ghost" id="p-close">Schließen</button>
    </div>`, () => state.tiles.get(x + ',' + y) === t ? openInfo(x, y) : closePanel());
  wireDel(x, y);
  $('p-move').onclick = () => startMove(x, y, -1);              // das Gebäude, nicht die Deko in seiner Ecke
  if ($('p-stage')) $('p-stage').onclick = () => stageUpgrade(x, y);
  if ($('p-expo')) $('p-expo').onclick = () => { if (sendExpedition(x + ',' + y)) openInfo(x, y); };
  // Schiffe: Modell und Ziel wählen, kaufen, verkaufen
  for (const b of el.querySelectorAll('[data-shipmodel]')) b.onclick = () => { shipPick.model = b.dataset.shipmodel; openInfo(x, y); };
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
  if (el.querySelector('[data-openart]')) el.querySelector('[data-openart]').onclick = () => { closePanel(); openResearch('design'); };
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
    ${e.b === 'hecke' && isWilmerStyle(e.style) ? bushColHtml(e.col || 0, 'hecke', wilmerAll().filter(o => o !== e && (o.col || 0) !== (e.col || 0)).length) : ''}
    <div class="label">Wege an dieser Linie</div>
    <div class="looks"><button class="look${edgeFlush(k) ? ' on' : ''}" data-flush="1">🧱 Bündig bis an die Linie</button><button class="look${edgeFlush(k) ? '' : ' on'}" data-flush="0">🌱 Mit Grasstreifen</button></div>
    <p class="muted">Gilt für die ganze zusammenhängende Linie.${e.flush == null ? ' Von selbst: bündig nur am Park.' : ''}</p>
    <div class="row"><button class="btn danger" id="p-del" aria-label="Entfernen">🗑️ +${fmt(refund)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => state.edges.get(k) === e ? openGateInfo(k) : closePanel());
  for (const b of el.querySelectorAll('[data-arch]')) b.onclick = () => undoable(() => { if (setArch(k, b.dataset.arch || null)) openGateInfo(k); });
  for (const b of el.querySelectorAll('[data-gate]')) b.onclick = () => undoable(() => { const v = b.dataset.gate; if (setGate(k, v === '1' ? true : v === 'offen' ? 'offen' : false)) openGateInfo(k); });
  for (const b of el.querySelectorAll('[data-flush]')) b.onclick = () => undoable(() => { if (setFlush(k, b.dataset.flush === '1')) { sfx('deco'); openGateInfo(k); } });
  $('p-del').onclick = () => { closePanel(); undoable(() => { if (removeEdge(k)) { sfx('dig'); recalc(); save(); } }); };
  $('p-close').onclick = closePanel;
  if (e.b === 'hecke' && isWilmerStyle(e.style)) wireBushCol(el, { cur: e.col || 0, key: 'hecke', set: i => setCol(e, i), all: i => { const l = wilmerAll().filter(o => (o.col || 0) !== i); l.forEach(o => setCol(o, i)); return l.length; }, reopen: () => openGateInfo(k) });
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
  const atDoor = hbfEntrance(t, x, y).some(([ex, ey]) => wegAt(ex, ey) != null), v = NET && NET.vOf(x + ',' + y), village = v && NET.vHome.has(v);
  const door = atDoor ? `<div class="status"><div class="ok">🛤️ Weg am Eingang${village ? ' – mit dem Dorf verbunden' : ''}</div></div>`   // Block 85
    : '<p class="muted">🛤️ Leg einen Weg vor das Portal (die Seite gegenüber den Gleisen) – dann führt er bis an die Tür und verbindet den Bahnhof mit dem Dorf.</p>';
  return `${door}<div class="label">🚉 ${n} Gleise</div>
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
    ${terraLook(x, y) === 'park' ? `<div class="status">${parkStatus(x + ',' + y).join('')}</div>` : ''}
    ${d.b === 'busch' ? bushColHtml(d.col || 0, 'busch', bushAll().filter(o => o !== d && (o.col || 0) !== (d.col || 0)).length) : ''}
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
  if ($('p-steg')) $('p-steg').onclick = () => { closePanel(); searchQ = null; ({ top: menuTop, sub: menuSub } = menuPlaceOf('bootssteg')); buildToolbar(); setTool('bootssteg'); };
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
      <p>Such dir aus, was dir gefällt – jedes Stück einzeln. Du hast <b>🪙 ${fmt(state.money)}</b>.
        ${master ? '' : '<span class="muted">Meisterstücke (✦) braucht eine Kunstakademie.</span>'}</p>
      ${groups.map(gr => `<div class="label">${gr}</div><div class="design-grid">${DESIGN.filter(d => d.group === gr).map(d => {
        const have = !d.price || state.design.has(d.id), err = have ? null : designError(d);
        const look = d.col ? `<i style="background:${d.col}"></i>` : `<span class="emoji">${{ laterne: '🏮', pavillon: '⛩️', statue: '⭐' }[d.item] || '🎨'}</span>`;
        return `<button class="design${have ? ' have' : ''}" data-design="${d.id}" ${have || err === 'Braucht eine Kunstakademie' ? 'disabled' : ''} title="${d.name}">
          ${look}<span class="dn">${d.col && d.group !== 'Wege' ? '' : d.name}</span>
          <small>${have ? '✓' : `${d.master ? '✦ ' : ''}🪙 ${fmt(designPrice(d))}`}</small></button>`;
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
function openTownHall(tab = hallTab) {
  hallTab = tab;
  const n = lanternCount(), title = townTitle(n), nextTitle = TITLES.find(([min]) => min > n);
  const tabs = [['overview', 'Übersicht'], ['ready', 'Bereit'], ['isles', 'Inseln'], ['erfolge', 'Erfolge'], ['wishes', 'Wünsche'], ['bewohner', 'Bewohner'], ['town', 'Ort']];
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
  } else if (tab === 'bewohner') {
    body = residentsHtml();
  } else {
    const hall = townHallAt(), t = hall && state.tiles.get(hall.join(','));
    body = `
      ${townEditor(state.town)}
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
  c.className = 'card'; setHtml(c, html); $('modal').hidden = false; modalLive = live;
  const box = spotBox(); if (box) box.classList.add('spot');
}
function closeModal() { $('modal').hidden = true; modalLive = null; }
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
    <p class="muted" style="font-size:13px">Ziehen = Karte bewegen · Mausrad / zwei Finger = zoomen · Mehr, auch alle Tasten: ☰ → Anleitung</p>
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
    '🧭 <b>Die Leiste unten</b> hat fünf Bereiche: 🏘️ Stadt, 🏭 Herstellen, 🛍️ Einkaufen, 🎡 Freizeit, 🌸 Gestalten. Darunter die Gruppen. Karte antippen = auswählen, dann auf die Karte tippen = bauen. 🔍 findet alles beim Namen.',
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
    '⭐ <b>Erfolge und Album</b> (☰): Sammeln lohnt sich, volle Album-Seiten schenken besondere Dinge.']);
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
    '💡 <b>Tipps</b> tauchen unterwegs auf; alle stehen im 💡 Tipp-Buch (☰).',
    '❓ <b>Nicht verstanden?</b> Alles mit einem kleinen ? lässt sich antippen – Material, Wünsche, Begriffe. Unter ☰ → 📚 Nachschlagen findest du alles mit Suche.']);
}
function openHelp(tab = helpTab) {
  helpTab = tab;
  openModal(`
    <h2>📘 Anleitung</h2>
    <div class="looks hall-tabs">${HELP_TABS.map(([id, name]) => `<button class="look${id === tab ? ' on' : ''}" data-htab="${id}">${name}</button>`).join('')}</div>
    ${helpBody(tab)}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  for (const b of document.querySelectorAll('[data-htab]')) b.onclick = () => openHelp(b.dataset.htab);
  $('m-close').onclick = closeModal;
}
// „Das ist neu“ (Block 25): nach einem Update einmal pro Gerät. Neue Spieler bekommen es nicht (sie kennen das Alte
// nicht). Bei jedem Push mit etwas Sichtbarem: id ändern und die 3–5 Punkte ersetzen.
const NEWS = { id: '2026-10-06-hilfe', items: [
  '❓ <b>Hilfe am Ort:</b> Alles mit einem kleinen ? lässt sich antippen – fehlendes Material („Wo kriege ich Metall her?“), die Wünsche der Häuser, Begriffe wie Viertel oder Strom. „Zeig mir“ wählt gleich das richtige Gebäude.',
  '📚 <b>Nachschlagen:</b> Unter ☰ ein Buch mit Suche – alle Gebäude, Rohstoffe, Wünsche und Begriffe.',
  '🧱 <b>Vorplätze:</b> Liegt ein Weg vor der Tür, führt jetzt bei allen Gebäuden ein Weg oder Platz im selben Muster bis zur Tür.',
  '🌳 <b>Wilmerhecke:</b> Bei den Hecken gibt es jetzt eine Hecke aus lauter kleinen runden Büschen – einfach ziehen wie einen Zaun. Gleich frei, auch mit Blüten oder Lichterkette.',
  '🚉 <b>Hauptbahnhof neu:</b> Portal mit Uhrturm genau in der Mitte, ein Weg vor dem Portal führt bis an die Tür. Schönere Bahnsteigdächer, dazu Laternen, Bänke und Bahnsteiguhren.',
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
    <div class="row"><button class="btn ghost" id="m-lex" style="flex:1">📚 Nachschlagen: Was ist …?</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-news">✨ Das ist neu</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-sound">${state.muted ? '🔇 Ton ist aus' : '🔊 Ton ist an'}</button><button class="btn ghost" style="flex:1" id="m-borders">${state.noBorders ? '▢ Randlinien aus' : '▣ Randlinien an'}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-fps" title="${fpsMode === 'fluessig' ? 'Immer 60 Bilder pro Sekunde – braucht mehr Strom' : 'Beim Zuschauen 30, später 15 Bilder pro Sekunde – schont Akku und hält das Gerät kühl'}">${fpsMode === 'fluessig' ? '🎞️ Bildrate: flüssig' : '🔋 Bildrate: sparsam'}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1; position:relative" id="m-diary">📖 Tagebuch${state.diarySeen < state.diary.length ? '<span class="dot"></span>' : ''}</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-achv">🏆 Erfolge</button><button class="btn ghost" style="flex:1" id="m-album">📒 Album</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-home">Zum Rathaus</button></div>
    <div class="row">
      <button class="btn ghost" style="flex:1" id="m-export">💾 Spielstand sichern</button>
      <button class="btn ghost" style="flex:1" id="m-import">📂 Spielstand laden</button>
    </div>
    <div class="row"><button class="btn danger" id="m-reset">Neue Insel beginnen</button></div>
    <div class="row"><button class="btn ghost" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  $('m-help').onclick = () => openHelp();
  $('m-lex').onclick = () => openLexikon();
  $('m-news').onclick = showNews;
  $('m-tips').onclick = openTipBook;
  $('m-diary').onclick = () => openDiary();
  $('m-achv').onclick = () => openTownHall('erfolge');
  $('m-album').onclick = openAlbum;
  $('m-sound').onclick = () => { state.muted = !state.muted; save(); showMenu(); };
  $('m-fps').onclick = () => { setFpsMode(fpsMode === 'fluessig' ? 'sparsam' : 'fluessig'); showMenu(); };   // Bildrate (Block 79)
  $('m-borders').onclick = () => { state.noBorders = !state.noBorders; groundVersion++; save(); showMenu(); };   // Ränder von Park und Freizeitpark
  $('m-home').onclick = () => { const h = townHallAt(), c = h ? iso(h[0] + 1, h[1] + 1) : iso(ISLAND.cx, ISLAND.cy); state.cam.x = c.x; state.cam.y = c.y; closeModal(); };   // wo es wirklich steht
  $('m-close').onclick = closeModal;
  $('m-export').onclick = () => { exportSave(); toast('Spielstand als Datei gesichert'); };
  $('m-import').onclick = () => $('import-file').click();
  $('m-reset').onclick = () => {                 // eigenes Fenster (Block 84a): zweimal schnell tippen löscht nichts
    openModal(`
      <h2>Neue Insel beginnen?</h2>
      <p>Deine Insel <b>${escHtml(state.town.name)}</b> geht dabei verloren. Sichere sie vorher als Datei, wenn du sie behalten willst.</p>
      <div class="row"><button class="btn ghost" id="m-no">Lieber nicht</button><button class="btn" id="m-save">💾 Erst sichern</button><button class="btn danger" id="m-yes-new">Ja, neu beginnen</button></div>`);
    $('m-no').onclick = showMenu;
    $('m-save').onclick = () => { exportSave(); toast('Spielstand als Datei gesichert'); };
    $('m-yes-new').onclick = () => { setTool('look'); startNew(); closeModal(); closePanel(); showIntro(true); };
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
