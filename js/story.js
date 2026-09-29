'use strict';
// ---------------------------------------------------------------------------
// Geschichte: Wahrzeichen restaurieren, Laternen, Ortstitel, Tagebuch, Einführung, Laternenfest
// ---------------------------------------------------------------------------
function lanternCount() {
  let n = 0;
  for (const type of Object.keys(LM_STAGES)) n += lmStage(type);
  return n + (state.festival ? 1 : 0);
}
function townTitle(n = lanternCount()) {
  if (state && [...state.tiles.values()].some(t => t.b === 'schloss' && wonderDone(t))) return 'Königliche Inselperle';
  let title = TITLES[0][1];
  for (const [min, name] of TITLES) if (n >= min) title = name;
  return title;
}
const TITLE_ARTICLE = { Weiler: 'ein', Dorf: 'ein', Städtchen: 'ein', Kleinstadt: 'eine', Inselperle: 'eine' };
const unlockName = u => u.startsWith('weg:') ? `Weg-Stil „${styleDef('weg', u.slice(4)).name}“` : ITEMS[u].name;

// ---------------------------------------------------------------------------
// Themen-Inseln erschließen (die „gläserne Decke“): Bedingungen, nächste Insel, Erschließen
// ---------------------------------------------------------------------------
const isleOpen = id => state.islands.has(id);
function isleNeeds(i) {
  const n = i.need, out = [];
  if (n.lanterns) {
    const title = TITLES.find(([min]) => min === n.lanterns);          // „3 Laternen (Dorf)“, sonst nur die Zahl
    out.push({ text: `🏮 ${n.lanterns} ${n.lanterns === 1 ? 'Laterne' : 'Laternen'}${title ? ` (${title[1]})` : ''}`, ok: lanternCount() >= n.lanterns });
  }
  if (n.pop) out.push({ text: `👥 ${n.pop} Einwohner`, ok: T.pop >= n.pop, have: T.pop, want: n.pop });
  if (n.science) out.push({ text: `💡 ${fmt(n.science)} Ideen`, ok: state.science >= n.science, have: state.science, want: n.science, pay: true });
  if (n.money) out.push({ text: `🪙 ${fmt(n.money)} Taler`, ok: state.money >= n.money, have: state.money, want: n.money, pay: true });
  return out;
}
const nextIsle = () => ISLES.find(i => !isleOpen(i.id)) || FAR.find(i => !isleOpen(i.id)) || null;
// Inseln entdecken: vom Steg aus fährt ein Holzboot hinaus (Taler/Ideen beim Ablegen), kommt nach einiger Zeit zurück
// – dann ist die nächste Insel entdeckt. Die Zeit läuft echt weiter, auch wenn das Spiel zu ist.
const EXPEDITION_MIN = { wald: 1, obst: 2, wind: 3, ruine: 4, erz: 6, quelle: 8, kristall: 10 };
const DISCOVERY = {
  wald: 'Mit dem kleinen Holzboot hinaus aufs Meer. Nach einer Weile tauchte ein dunkelgrüner Streifen auf: Wald, so dicht, dass kaum Licht hindurchfällt – und mittendrin ein Baum, älter als alle Geschichten.',
  obst: 'Diesmal trug der Wind den Duft von Äpfeln herüber. Eine Insel voller wilder Obstbäume, die seit Jahren niemand mehr geerntet hat.',
  wind: 'Die Wellen wurden höher, der Wind rauer. Hinter der Gischt: Felsen, Klippen und Wiesen, über die der Wind pfeift.',
  ruine: 'Im Nebel zeichneten sich Mauern ab. Eine Insel voller alter Steine – hier muss einmal eine Schule gestanden haben, vielleicht sogar mehr.',
  erz: 'Ein Berg, der im Abendlicht rötlich glänzt. Die alten Seeleute erzählen, dass man hier früher Erz gegraben hat.',
  quelle: 'Dampf stieg aus dem Meer auf – nein, von einer Insel! Zwischen den Felsen sprudeln warme Quellen.',
  kristall: 'Die längste Fahrt von allen. In der Nacht leuchtete der Horizont: eine Insel aus Kristall, in der das Mondlicht funkelt.',
};
// Wie lange das Boot unterwegs ist: Themen-Inseln fest, ferne Inseln jedes Mal etwas länger (höchstens 30 Min.)
const expMinutes = i => { const m = i.far ? Math.min(30, 10 + 2 * (i.n - 1)) : EXPEDITION_MIN[i.id]; return T.wonders && T.wonders.sternwarte ? Math.ceil(m / 2) : m; };
const stegs = () => [...state.tiles].filter(([, t]) => t.b === 'bootssteg').map(([k]) => k);
function expeditionError(i = nextIsle()) {
  if (!i) return 'Alle Inseln sind entdeckt';
  if (state.expedition) return 'Das Boot ist schon unterwegs';
  if (!stegs().length) return 'Erst einen Steg ans Ufer bauen (🛤️ Verbinden → Steg)';
  if (!stegs().some(k => expeditionRoute(k, i))) return 'Vom Steg aus gibt es keinen Seeweg dorthin – ist das Wasser zugeschüttet?';
  const miss = isleNeeds(i).filter(c => !c.ok);
  return miss.length ? 'Es fehlt noch: ' + miss.map(c => c.text).join(', ') : null;
}
function sendExpedition(from) {
  const i = nextIsle(), err = expeditionError(i);
  if (!err && (!from || !expeditionRoute(from, i))) from = stegs().find(k => expeditionRoute(k, i));
  if (err) { fail(err); return false; }
  state.money -= i.need.money || 0;
  state.science -= i.need.science || 0;
  const now = Date.now();
  state.expedition = { isle: i.id, from, t0: now, until: now + expMinutes(i) * 60e3 };
  sfx('star');
  toast(`⛵ Das Boot sticht in See – es sucht die ${i.name} (zurück in ${expMinutes(i)} Min.)`);
  recalc(); save();
  return true;
}
const expeditionLeft = () => state.expedition ? Math.max(0, state.expedition.until - Date.now()) : 0;
const fmtClock = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// Läuft im Takt: ist das Boot zurück, ist die Insel entdeckt
function checkExpedition() {
  const e = state.expedition;
  if (!e || Date.now() < e.until) return false;
  state.expedition = null;
  discoverIsland(e.isle);
  return true;
}
function discoverIsland(id) {
  const i = ISLE_BY_ID[id];
  if (!i || isleOpen(id)) return false;
  if (i.far) return discoverFar(i);
  state.islands.add(id);
  ownIsland(id);
  state.diary.push('isle:' + id);
  recalc();
  const [x, y] = isleAnchor(i);
  jumpTo(x, y, 3, 3);
  sparkle(x + 1, y + 1);
  confettiBurst();
  sfx('star');
  openModal(`
    <h2>⛵ Land in Sicht: ${i.icon} ${i.name}!</h2>
    <p>${DISCOVERY[id]}</p>
    <p>${i.text} In der Mitte wartet ${LANDMARKS[i.lm].icon} <b>${LANDMARKS[i.lm].name}</b> darauf, restauriert zu werden.</p>
    <p class="muted">Bau dir hier ein kleines Dorf – oder verbinde die Insel per Zug. Betriebe weit weg von Häusern arbeiten nur halb so schnell.</p>
    <div class="row"><button class="btn" id="m-ok">Los geht's</button></div>`);
  $('m-ok').onclick = closeModal;
  checkStars();
  save();
  return true;
}

// ---------------------------------------------------------------------------
// Ferne Inseln (Block 27c): Nach dem Laternenfest taucht draußen im Nebel eine Insel nach der anderen auf – zufällig
// (fester Startwert je Spielstand) auf einer Spirale nach außen, mit Namen, Gelände und einer Truhe in der Mitte.
// Entdeckt wird per Boot wie bisher; jede weitere kostet mehr und dauert länger. Gespeichert in state.far.
// ---------------------------------------------------------------------------
const FAR_KINDS = {
  wald:     { icon: '🌲', names: ['Kiefern', 'Farn', 'Moos', 'Eulen', 'Hirsch'], text: 'Dichter Wald bis ans Ufer – Holz für viele Jahre.' },
  obst:     { icon: '🍒', names: ['Kirsch', 'Pflaumen', 'Birnen', 'Beeren', 'Quitten'], text: 'Wilde Obstbäume, schwer von Früchten.' },
  fels:     { icon: '🪨', names: ['Möwen', 'Klippen', 'Sturm', 'Robben', 'Kiesel'], text: 'Felsen, Wind und kreischende Möwen – Stein für Pflaster.' },
  erz:      { icon: '⛏️', names: ['Kupfer', 'Eisen', 'Zinn', 'Funken', 'Amboss'], text: 'Rötlicher Fels mit dicken Erzadern.' },
  quelle:   { icon: '♨️', names: ['Nebel', 'Seerosen', 'Dampf', 'Muschel', 'Libellen'], text: 'Warme Teiche zwischen weichen Wiesen.' },
  kristall: { icon: '💎', names: ['Mond', 'Sternen', 'Glitzer', 'Opal', 'Frost'], text: 'Zwischen den Felsen glitzert Kristall.' },
  ruine:    { icon: '🏛️', names: ['Säulen', 'Tempel', 'Glocken', 'Laternen', 'Bogen'], text: 'Alte Mauern im Gras – wer hat hier wohl einmal gewohnt?' },
  wiese:    { icon: '🌼', names: ['Sonnen', 'Blumen', 'Lavendel', 'Wolken', 'Schmetterlings'], text: 'Weite Wiesen voller Blumen – viel Platz zum Bauen.' },
};
// Was in der Truhe steckt: Taler (Einkommen), Ideen oder eine Ladung Waren – so viel, dass es sich lohnt
const CHESTS = {
  taler: { icon: '💰', name: 'Schatztruhe', text: 'Goldmünzen bis zum Rand' },
  ideen: { icon: '📜', name: 'Kiste mit Seekarten', text: 'alte Karten und Bücher voller Ideen' },
  waren: { icon: '📦', name: 'Frachtkiste', text: 'die Ladung eines alten Frachters' },
};
const CHEST_RES = ['bretter', 'quader', 'metall', 'kristall'];
const FAR_R0 = ISLE_DIST + ISLE_R + 32, FAR_AREA = 1800, GOLDEN = 2.39996;
// Platz frei? Nicht auf oder zu nah an Inseln und eigenem Land im Meer
function farFree(cx, cy, r) {
  if (Math.hypot(cx - ISLAND.cx, cy - ISLAND.cy) < ISLAND.r * 1.3 + r * 1.5 + 8) return false;
  if (ISLES.some(i => Math.hypot(cx - i.cx, cy - i.cy) < ISLE_R * 1.5 + r * 1.5 + 8)) return false;
  if (state.far.some(f => Math.hypot(cx - f.cx, cy - f.cy) < (f.r + r) * 1.5 + 8)) return false;
  for (const k of state.claimed) { const [x, y] = keyXY(k); if (Math.hypot(x - cx, y - cy) < r * 1.5 + 4) return false; }
  return true;
}
function makeFar(n) {
  const rnd = k => hash(n, k, 7001), kinds = Object.keys(FAR_KINDS), ter = kinds[Math.floor(rnd(2) * kinds.length)], K = FAR_KINDS[ter];
  const r = Math.round(8 + rnd(1) * 5), used = new Set(state.far.map(f => f.name)), start = Math.floor(rnd(3) * K.names.length);
  let name = null;
  for (let j = 0; j < K.names.length && !name; j++) { const nm = K.names[(start + j) % K.names.length] + 'insel'; if (!used.has(nm)) name = nm; }
  if (!name) name = `${K.names[start]}insel ${state.far.filter(f => f.name.startsWith(K.names[start])).length + 1}`;
  const off = hash(0, 0, 7003) * Math.PI * 2;
  for (let m = state.far.length ? state.far[state.far.length - 1].m + 1 : 1; ; m++) {     // Spirale nach außen
    const d = Math.sqrt(FAR_R0 * FAR_R0 + FAR_AREA * m / Math.PI), a = off + m * GOLDEN;
    const cx = Math.round(ISLAND.cx + Math.cos(a) * d), cy = Math.round(ISLAND.cy + Math.sin(a) * d);
    if (!farFree(cx, cy, r)) continue;
    return { id: 'far' + n, n, m, name, icon: K.icon, ter, cx, cy, r, deg: 1000 + n * 37,
      need: { money: niceRound(5e6 * Math.pow(1.35, n - 1)), science: niceRound(800 * Math.pow(1.3, n - 1)) },
      chest: ['taler', 'ideen', 'waren'][Math.floor(rnd(4) * 3)], res: CHEST_RES[Math.floor(rnd(5) * CHEST_RES.length)] };
  }
}
// state.far → FAR und ISLE_BY_ID; die Welt, Gelände und Bilder neu, weil jetzt dort Land ist
function registerFar() {
  for (const k of Object.keys(ISLE_BY_ID)) if (ISLE_BY_ID[k].far) delete ISLE_BY_ID[k];
  FAR.length = 0;
  for (const f of state.far) { f.far = true; FAR.push(f); ISLE_BY_ID[f.id] = f; }
  terrainCache.clear(); regionCache.clear(); landCache.clear(); sandCache.clear();
  if (typeof groundVersion !== 'undefined') groundVersion++;
  waterChanged(); growWorld();
}
// Nach dem Fest gibt es immer eine ferne Insel, die noch zu entdecken ist
function ensureFar() {
  if (!state.festival || FAR.some(f => !isleOpen(f.id))) return false;
  state.far.push(makeFar(state.far.length + 1));
  registerFar();
  return true;
}
function discoverFar(i) {
  state.islands.add(i.id);
  ownIsland(i.id);
  const k = i.cx + ',' + i.cy;
  state.terra.set(k, 'grass');
  state.tiles.set(k, { b: 'truhe', lvl: 1, isle: i.id });
  ensureFar();
  recalc();
  jumpTo(i.cx, i.cy);
  sparkle(i.cx, i.cy); confettiBurst(); sfx('star');
  const nxt = FAR.find(f => !isleOpen(f.id));
  openModal(`
    <h2>⛵ Land in Sicht: ${i.icon} ${i.name}!</h2>
    <p>${FAR_KINDS[i.ter].text}</p>
    <p>🎁 Mitten auf der Insel steht eine alte Truhe – tipp sie an!</p>
    ${nxt ? `<p class="muted">Draußen im Nebel zeichnet sich schon die nächste ab: ${nxt.icon} ${nxt.name} …</p>` : ''}
    <div class="row"><button class="btn" id="m-ok">Los geht's</button></div>`);
  $('m-ok').onclick = closeModal;
  checkStars();
  save();
  return true;
}
// Was die Truhe bringt: jetzt gerechnet, damit es zum Stand passt (Einkommen, Ideen/s)
function chestLoot(i) {
  if (i.chest === 'taler') return { money: niceRound(Math.max(1e6 * i.n, T.inc * 60 * 20)) };
  if (i.chest === 'ideen') return { science: niceRound(Math.max(500 * i.n, T.sci * 60 * 30)) };
  const r = i.res, base = (r === 'kristall' ? 60 : 250) * Math.pow(1.35, i.n);    // Waren: auch nach Produktion und Lager
  return { [r]: niceRound(Math.max(base, ((T.prod && T.prod[r]) || 0) * 60 * 30, state.res[r] * 0.25)) };
}
const lootText = l => Object.entries(l).map(([r, n]) => r === 'money' ? `🪙 ${fmt(n)} Taler` : r === 'science' ? `💡 ${fmt(n)} Ideen` : `${RES[r].icon} ${fmt(n)} ${RES[r].name}`).join(', ');
function openChest(k) {
  const t = state.tiles.get(k), i = t && t.b === 'truhe' && ISLE_BY_ID[t.isle || regionAt(...keyXY(k))];
  if (!i) return false;
  const loot = chestLoot(i);
  for (const [r, n] of Object.entries(loot)) {
    if (r === 'money') { state.money += n; state.stats.earned += n; }
    else if (r === 'science') state.science += n;
    else state.res[r] += n;
  }
  state.tiles.delete(k);
  recalc();
  const [x, y] = keyXY(k);
  sparkle(x, y); confettiBurst(); sfx('star');
  toast(`${CHESTS[i.chest].icon} ${CHESTS[i.chest].name}: ${lootText(loot)}!`);
  save();
  return true;
}

function lmTile(type) {
  for (const [k, t] of state.tiles) if (t.b === 'lm' && t.lm === type) return keyXY(k);
  return null;
}

// Was fehlt noch für die nächste Stufe?
function restoreInfo(type) {
  const stage = lmStage(type), next = LM_STAGES[type][stage], pos = lmTile(type);
  if (!next) return { stage, next: null, pos };
  const { money: _base, ...raw } = next.cost, money = LM_PRICE[type][stage], k = LM_MAT_MUL[type], mat = {};
  for (const [r, n] of Object.entries(raw)) mat[r] = Math.ceil(n * k);
  let err = null;
  const isle = ISLE_OF_LM[type];
  if (!pos || !ownedTile(pos[0], pos[1])) err = `Entdecke zuerst die ${isle ? isle.name : 'Insel'}`;
  else if (state.money < money) err = 'Zu wenig Taler';
  else err = matError(mat);
  return { stage, next, pos, err, money, mat };
}

function restoreLandmark(type) {
  const info = restoreInfo(type);
  if (!info.next) return false;
  if (info.err) { fail(info.err); return false; }
  const before = townTitle();
  state.money -= info.money;
  payMat(info.mat);
  state.restore[type] = info.stage + 1;
  state.diary.push(type + ':' + state.restore[type]);
  recalc();
  sparkle(info.pos[0], info.pos[1]);
  sfx('star');
  const after = townTitle(), unl = info.next.unlock.map(unlockName);
  openModal(`
    <h2>🏮 ${lmStepName(type, info.stage + 1)}</h2>
    <p>Die <b>${lanternCount()}. Laterne</b> brennt!</p>
    ${unl.length ? `<p>Neu: <b>${unl.join(', ')}</b></p>` : ''}
    ${after !== before ? `<p>🎉 ${escHtml(state.town.name)} ist jetzt ${TITLE_ARTICLE[after]} <b>${after}</b>!</p>` : ''}
    <p class="muted">Eine neue Seite im Tagebuch 📖</p>
    <div class="row"><button class="btn" id="m-diary">Tagebuch lesen</button><button class="btn ghost" id="m-ok">Weiter</button></div>`);
  $('m-diary').onclick = () => openDiary(state.diary.length - 1);
  $('m-ok').onclick = closeModal;
  if (after !== before) confettiBurst();
  buildToolbar();
  storyTick();
  save();
  return true;
}

// Finale: Der Leuchtturm steht → Laternenfest
function festival() {
  if (state.festival) return;
  state.festival = true;
  state.diary.push('finale');
  ensureFar();
  recalc();
  confettiBurst(); confettiBurst();
  sfx('star');
  openModal(`
    <h2>🎆 Das Laternenfest!</h2>
    <p>Der Leuchtturm brennt wieder, und alle ${LANTERN_TOTAL} Laternen leuchten. Ganz ${escHtml(state.town.name)} feiert bis tief in die Nacht.</p>
    <p>${escHtml(state.town.name)} ist jetzt eine <b>Inselperle</b>. Die Insel gehört dir – bau und gestalte weiter, so lange du magst.</p>
    <p>🌫️ Und draußen im Nebel, weit hinter den Themen-Inseln, zeichnet sich eine neue Insel ab …</p>
    <div class="row"><button class="btn" id="m-diary">Letzte Tagebuchseite</button><button class="btn ghost" id="m-ok">Hurra!</button></div>`);
  $('m-diary').onclick = () => openDiary(state.diary.length - 1);
  $('m-ok').onclick = closeModal;
  save();
}

// Ältere Spielstände (vor den Laternen): eigene Sehenswürdigkeiten gelten als freigeschnitten
function migrateLandmarks() {
  if (!state.oldSave) return;
  for (const type of Object.keys(LM_STAGES)) {
    const p = lmTile(type);
    if (p && ownedTile(p[0], p[1]) && !lmStage(type)) { state.restore[type] = 1; state.diary.push(type + ':1'); }
  }
  delete state.oldSave;
}

// ---------------------------------------------------------------------------
// Tagebuch
// ---------------------------------------------------------------------------
function diaryPage(id) {
  if (id === 'start') return { title: 'Die erste Seite', text: DIARY_START, pic: { lighthouse: true, lit: false } };
  if (id === 'finale') return { title: 'Das Laternenfest', text: DIARY_FINALE, pic: { lighthouse: true, lit: true } };
  if (id.startsWith('isle:')) { const i = ISLE_BY_ID[id.slice(5)]; return { title: `⛵ ${i.icon} ${i.name} entdeckt`, text: DISCOVERY[i.id], pic: { type: i.lm, stage: 0 } }; }
  const [type, n] = id.split(':'), st = LM_STAGES[type][+n - 1];
  return { title: `${LANDMARKS[type].icon} ${LANDMARKS[type].name} · ${st.name}`, text: st.diary, pic: { type, stage: +n } };
}
function diaryPicture(pic) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 200;
  const prev = g, prevNight = night;
  g = c.getContext('2d'); FOG = false;
  night = pic.lit ? 0.45 : 0;
  g.fillStyle = pic.lighthouse ? (pic.lit ? '#27325e' : '#9fd6e8') : '#bfe5f0';
  g.fillRect(0, 0, 320, 200);
  const z = 1.6, cx = 160, cy = 138, hw = TW / 2 * z * 1.6, hh = TH / 2 * z * 1.6;
  diamond(cx, cy, hw, hh, pic.lit ? '#3d6b3a' : '#96d56f');
  if (pic.lighthouse) {
    drawObject('leuchtturm', cx, cy, z * 0.8, pic.lit ? 1400 : 0, 1, 1, 1, null);
    if (pic.lit) for (let i = 0; i < 18; i++) circle(20 + (i * 67) % 290, 20 + (i * 37) % 90, 1.2, '#fff6c8');
  } else {
    drawLandmark(pic.type, cx, cy, z, 0, 1, 1, pic.stage);
  }
  g = prev; night = prevNight;
  return c;
}
function openDiary(at) {
  const pages = state.diary;
  let i = at == null ? Math.min(state.diarySeen, pages.length - 1) : at;
  const show = () => {
    const p = diaryPage(pages[i]);
    openModal(`
      <h2>📖 Tagebuch <span class="muted" style="font-size:14px">Seite ${i + 1} von ${pages.length}</span></h2>
      <div class="diary-pic" id="d-pic"></div>
      <h3 style="margin:10px 0 4px">${p.title}</h3>
      <p class="diary-text">${p.text}</p>
      <div class="row">
        <button class="btn ghost" id="d-prev" ${i === 0 ? 'disabled' : ''}>← Zurück</button>
        <button class="btn ghost" id="d-next" ${i === pages.length - 1 ? 'disabled' : ''}>Weiter →</button>
        <button class="btn" id="d-close">Schließen</button>
      </div>`);
    $('d-pic').append(diaryPicture(p.pic));
    state.diarySeen = Math.max(state.diarySeen, i + 1);
    $('d-prev').onclick = () => { i--; show(); };
    $('d-next').onclick = () => { i++; show(); };
    $('d-close').onclick = () => { closeModal(); save(); };
  };
  show();
}

// ---------------------------------------------------------------------------
// Einführung: die ersten Schritte, sanft geführt
// ---------------------------------------------------------------------------
const TUTORIAL = [
  { text: 'Bau dein erstes Haus.', hint: '🏗️ Bauen → Haus', done: () => hasBuilt('haus') },
  { text: 'Leg einen Weg bis vor die Haustür.', hint: '🛤️ Verbinden → Weg (ziehen) – oder 🛤️ ganz links',
    done: () => [...state.tiles].some(([k, t]) => t.b === 'haus' && wishMet('weg', ...keyXY(k))) },
  { text: 'Stell einen Holzfäller in den Wald.', hint: '🏗️ Bauen → 🪵 Rohstoffe → Holzfäller', done: () => hasBuilt('holz') },
  { text: 'Entdecke die Waldinsel.', hint: 'Steg ans Ufer bauen (🛤️ Verbinden), antippen, Boot losschicken – braucht 8 Einwohner und 🪙 150',
    done: () => isleOpen('wald') },
  { text: 'Schneide den Uralten Baum frei.', hint: 'Baum antippen → Restaurieren (braucht 🪵 10)', done: () => lmStage('baum') >= 1 },
  { text: 'Bau ein Sägewerk.', hint: '🏗️ Bauen → 🪵 Rohstoffe → Sägewerk', done: () => hasBuilt('saege') },
  { text: 'Bau dein erstes Haus aus.', hint: 'Wünsche erfüllen, dann Haus antippen → Ausbauen',
    done: () => [...state.tiles.values()].some(t => t.b === 'haus' && t.lvl >= 2) },
];
function storyTick() {
  if (PROBE || state.tutorial < 0) return;
  let advanced = false;
  while (state.tutorial >= 0 && state.tutorial < TUTORIAL.length && TUTORIAL[state.tutorial].done()) {
    state.tutorial++;
    advanced = true;
  }
  if (state.tutorial >= TUTORIAL.length) {
    state.tutorial = -1;
    toast('Einführung geschafft! Erschließe Insel um Insel und entzünde alle Laternen. 🏮');
    sfx('buy');
  } else if (advanced) {
    sfx('coin');
    toast('✓ Geschafft! Nächster Schritt: ' + TUTORIAL[state.tutorial].text);
  }
  if (advanced) save();
}
const checkStars = storyTick;   // alter Name, wird an vielen Stellen nach Änderungen aufgerufen

// Ziel-Karte oben links: Einführung oder die nächsten Laternen
function goalHtml() {
  const n = lanternCount();
  if (state.tutorial >= 0) {
    const s = TUTORIAL[state.tutorial];
    return `<h4>📖 Schritt ${state.tutorial + 1} von ${TUTORIAL.length}</h4>
      <div class="req">${s.text}</div><div class="req muted">${s.hint}</div>
      <div class="req"><span class="link" data-skip="1">Einführung überspringen</span></div>`;
  }
  const boosts = boostLines();
  if (state.festival) {                            // danach: das Schloss, Erfolge und Album
    const s = [...state.tiles.values()].find(t => t.b === 'schloss'), N = WONDERS.schloss.phases.length;
    const line = !s ? '🏰 Bau das Schloss: 🏗️ Bauen → 🏛️ Wunder' : wonderDone(s) ? '👑 Dein Schloss steht!' : `🏰 Schloss: Abschnitt ${s.phase + 1} von ${N} – ${WONDERS.schloss.names[s.phase]}`;
    const all = ALBUM.flatMap(albumKeys), pct = Math.floor(all.filter(k => state.album.has(k)).length / all.length * 100);
    return `<h4>🏮 ${n} / ${LANTERN_TOTAL} · ${townTitle(n)}</h4>${boosts}<div class="req">${line}</div>${isleReq(nextIsle())}<div class="req"><small>⭐ ${starCount()} Erfolge · 📒 ${pct} % Album</small></div>`;
  }
  if (n >= ITEMS.leuchtturm.lanterns) {
    return `<h4>🏮 ${n} / ${LANTERN_TOTAL}</h4>${boosts}<div class="req">🗼 Bau den Leuchtturm am Wasser – dann beginnt das Laternenfest!</div>`;
  }
  // Laternen auf den schon erschlossenen Inseln, dazu immer die nächste Insel
  const opts = Object.keys(LM_STAGES).map(type => ({ type, info: restoreInfo(type) }))
    .filter(o => o.info.next && o.info.pos && ownedTile(o.info.pos[0], o.info.pos[1]));
  opts.sort((a, b) => (a.info.err ? 1 : 0) - (b.info.err ? 1 : 0) || a.info.stage - b.info.stage);
  let html = `<h4>🏮 ${n} / ${LANTERN_TOTAL} · Nächste Laternen</h4>` + boosts + opts.slice(0, 2).map(({ type, info }) => {
    const parts = Object.entries(info.mat).map(([r, need]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], need))}/${need}`);
    if (info.money) parts.unshift(`🪙 ${fmt(Math.min(state.money, info.money))}/${fmt(info.money)}`);
    const detail = info.err ? parts.join(' ') : '✨ bereit – antippen!';
    return `<div class="req${info.err ? '' : ' done'}" data-lm="${type}">${lmStepName(type, info.stage + 1)}<br><small>${detail}</small></div>`;
  }).join('');
  return html + isleReq(nextIsle());
}
// Ziel-Zeile „Nächste Insel“ (auch nach dem Fest für die fernen Inseln)
function isleReq(i) {
  if (!i) return '';
  const need = isleNeeds(i), ok = need.every(c => c.ok), away = state.expedition && state.expedition.isle === i.id;
  const detail = away ? `⛵ Boot unterwegs · zurück in ${fmtClock(expeditionLeft())}`
    : ok ? (stegs().length ? '✨ bereit – Boot losschicken!' : '✨ bereit – erst einen Steg bauen')
    : need.map(c => c.have != null ? `${c.ok ? '✓' : ''}${c.text.split(' ')[0]} ${fmt(Math.min(c.have, c.want))}/${fmt(c.want)}` : `${c.ok ? '✓' : ''}${c.text}`).join(' ');
  return `<div class="req${ok || away ? ' done' : ''}" data-isle="${i.id}">🏝️ ${i.far ? 'Ferne Insel' : 'Nächste Insel'}: ${i.icon} ${i.name}<br><small>${detail}</small></div>`;
}

// ---------------------------------------------------------------------------
// Tipps beim ersten Mal (und im Tipp-Buch): when() sagt, ab wann der Tipp passt. Reihenfolge = Vorrang.
// ---------------------------------------------------------------------------
const anyStatus = fn => { for (const s of T.st.values()) if (fn(s)) return true; return false; };
const GUIDE = [
  { id: 'wunsch', icon: '🏠', title: 'Häuser wachsen', when: () => hasBuilt('haus'),
    text: 'Jedes Haus hat Wünsche: einen Weg vor der Tür, Deko in der Nähe, später Bäckerei, Markt, Schule … Tipp ein Haus an, um sie zu sehen. Sind alle erfüllt, wird es größer und bringt mehr Einwohner.' },
  { id: 'ausbau', icon: '✨', title: 'Bereit zum Ausbauen', when: () => anyStatus(s => (s.wish && s.wish.ready) || (s.grow && s.grow.ready)),
    text: 'Wo es über einem Haus oder Betrieb funkelt, sind alle Bedingungen erfüllt: antippen und „Ausbauen“. Im Rathaus unter „Bereit“ siehst du alles auf einmal und kannst direkt ausbauen.' },
  { id: 'lager', icon: '📦', title: 'Rohstoffe und Lager', when: () => Object.values(state.res).some(v => v >= 1),
    text: 'Rohstoffe wie Holz und Stein sammeln sich im Lager (oben). Sägewerk, Steinmetz und Schmiede machen daraus Bretter, Pflastersteine und Metall – die brauchst du für Ausbauten und Laternen.' },
  { id: 'weit', icon: '🐌', title: 'Weit weg vom Dorf',
    when: () => [...state.tiles].some(([k, t]) => t.b !== 'lm' && needsReach(t.b) && (T.st.get(k) || {}).how === 'weit'),   // wie die 🐌
    text: 'Die Schnecke heißt: Hier arbeiten die Leute nur halb, weil es weit bis zum Dorf ist. Ein Weg zum Dorf, Häuser in der Nähe oder ein Bahnhof (auch Seilbahn, Fähre) bringen volle Kraft.' },
  { id: 'viertel', icon: '🏘️', title: 'Viertel', when: () => anyStatus(s => s.bonus > 0),
    text: 'Gebäude, die aneinandergrenzen oder über Wege verbunden sind, bilden ein Viertel. Ab 3, 8 und 15 Gebäuden arbeitet das ganze Viertel 10, 20 und 30 % besser.' },
  { id: 'stufen', icon: '⬆️', title: 'Auch Betriebe wachsen', when: () => [...state.tiles.values()].some(t => BUILD_STAGES[t.b]),
    text: 'Auch Betriebe haben drei Stufen. Tipp einen an: Dort steht, was für die nächste Stufe fehlt – zum Beispiel eine Mühle mit Feldern daneben.' },
  { id: 'laterne', icon: '🏮', title: 'Laternen', when: () => lanternCount() >= 1,
    text: 'Jede Sehenswürdigkeit hat drei Laternen. Jede Laterne schaltet Neues frei und bringt eine Seite im Tagebuch 📖. Oben links steht immer, welche Laternen als Nächstes gehen.' },
  { id: 'insel', icon: '🏝️', title: 'Neue Inseln', when: () => { const i = nextIsle(); return !!i && isleNeeds(i).every(c => c.ok); },
    text: 'Die nächste Insel wartet! Bau einen Steg ans Ufer (🛤️ Verbinden → Steg), tipp ihn an und schick das Boot los. Wenn es zurückkommt, ist die Insel entdeckt – mit eigenen Rohstoffen und einer Sehenswürdigkeit.' },
  { id: 'deko', icon: '🌸', title: 'Kleine Deko', when: () => T.pop >= 12,
    text: 'Kleine Deko – Baum, Busch, Bank, Blumentopf – passt zu viert auf ein Feld, auch vors Haus und an Wege. Häuser wünschen sich Deko in der Nähe.' },
  { id: 'rathaus', icon: '🏛️', title: 'Das Rathaus', when: () => T.pop >= 20,
    text: 'Das Rathaus ist deine Zentrale: Übersicht, alles Bereite zum direkten Ausbauen, alle Inseln per Knopf, die Wünsche der Bewohner und dein Ort.' },
  { id: 'forschung', icon: '💡', title: 'Forschung', when: () => tierOpen(1),
    text: 'Schulen bringen Ideen. Oben bei 💡 kannst du forschen: stärkere Betriebe, neue Gebäude, Bauen überall. Bibliothek und Universität öffnen weitere Stufen.' },
  { id: 'kunst', icon: '🎨', title: 'Kunstakademie', when: () => lanternCount() >= 1 && state.money >= 300,
    text: 'Farben für Häuser, schöne Wege und besondere Deko gibt es einzeln in der Kunstakademie: oben 💡 → 🎨 Kunstakademie.' },
  { id: 'verschieben', icon: '✋', title: 'Alles lässt sich verschieben', when: () => state.tiles.size >= 25,
    text: 'Nichts ist für immer: Mit ✋ (unten links) verschiebst du alles kostenlos, auch das Rathaus. Mit ⟳ oder dem Mausrad drehst du Gebäude.' },
  { id: 'meer', icon: '🌊', title: 'Land gewinnen', when: () => state.islands.size >= 2,
    text: 'Mit „Aufschütten“ (⛰️ Gelände) machst du Wasser zu Land – auch im Meer direkt neben deinem Land. So kannst du Inseln vergrößern oder verbinden.' },
  { id: 'bahn', icon: '🚆', title: 'Eisenbahn', when: () => hasTech('bahn'),
    text: 'Zieh Schienen zwischen zwei Inseln (über Wasser als Brücke) und stell an beide Enden einen Bahnhof. Der Zug braucht Strom (1 ⚡ + 1 ⚡ je km). Er fährt Pendler (Leute, die auf der kleineren Insel wohnen) und Besucher (Sehenswürdigkeiten und Wunderwerke ziehen sie an) – das bringt Fahrkarten und Geld am Ziel, und alles nah am Bahnhof ist ans Dorf angebunden. Jeder Wagen hat 60 Plätze pro Minute: Ist der Zug überfüllt, Wagen anhängen oder als Rundkurs mehrere Züge fahren lassen.' },
  { id: 'ziehen', icon: '🖐️', title: 'Linie und Fläche', when: () => tool !== 'look' && !!ITEMS[tool] && !!ITEMS[tool].paint,
    text: 'Weg und Schiene: Anfang anklicken, Ende anklicken – du siehst jedes Feld und den Preis, der zweite Klick baut (iPad: Ende zweimal antippen). Gelände und Weg-Flächen: gedrückt halten und ein Rechteck aufziehen, dann hineinklicken. Esc oder ein kurzer Rechtsklick bricht ab. Karte bewegen: rechte Maustaste gedrückt halten (oder Leertaste/Ctrl), auf dem iPad zwei Finger.' },
  { id: 'strom', icon: '⚡', title: 'Strom', when: () => T.rail.power.city && T.rail.power.demand > T.rail.power.supply,
    text: 'Laternen, Werkstätten, Hafen, Sägewerk, Universität, Züge und die Wunderwerke brauchen Strom. Kraftwerke findest du unter Bauen → ⚡ Strom: Windrad (ausbaubar), Wasserkraft, Solarfeld, Geothermie, Wellenkraft – egal wo sie stehen. Ohne Strom laufen Gebäude nur halb (⚡ darüber), Laternen bleiben nachts dunkel und Züge stehen. Die Bilanz steht im 📦 Lager.' },
  { id: 'kristall', icon: '💎', title: 'Kristall', when: () => isleOpen('kristall'),
    text: 'Auf der Kristallinsel wächst Kristall im Fels. Eine Kristallmine holt ihn heraus – für Glas-Deko und die Glasvilla.' },
];

// ---------------------------------------------------------------------------
// Erfolge: jede erreichte Stufe = ⭐. Sterne bringen Ehrennadeln (RANKS), die schalten Pokale frei.
// Werte kommen aus dem aktuellen Stand; „Taler verdient“ zählt state.stats.earned (auch wenn man sie ausgibt).
// ---------------------------------------------------------------------------
const tileCount = f => { let n = 0; for (const t of state.tiles.values()) if (f(t)) n++; return n; };
const decoCount = f => { let n = 0; for (const ds of state.decos.values()) for (const d of ds) if (d && f(d)) n++; return n; };
const ACHIEVEMENTS = [
  { id: 'taler', icon: '🪙', name: 'Taler verdient', tiers: [1e4, 1e5, 1e6, 1e7, 1e8], value: () => state.stats.earned },
  { id: 'einwohner', icon: '👥', name: 'Einwohner', tiers: [50, 200, 1000, 5000, 10000], value: () => T.pop },
  { id: 'haeuser', icon: '🏠', name: 'Wohnhäuser', tiers: [10, 50, 150], value: () => tileCount(t => isHome(t.b)) },
  { id: 'villen', icon: '🏡', name: 'Villen', tiers: [1, 10, 50], value: () => tileCount(t => t.b === 'haus' && t.lvl >= 5) },
  { id: 'glasvillen', icon: '💎', name: 'Glasvillen', tiers: [1, 10], value: () => tileCount(t => t.b === 'haus' && t.lvl >= 6) },
  { id: 'bahn', icon: '🚆', name: 'Eisenbahn', unit: 'km', tiers: [1, 5, 20, 50], value: () => tileCount(t => t.b === 'schiene') * 0.1 },
  { id: 'zuege', icon: '🚉', name: 'Fahrende Züge', tiers: [1, 3, 5], value: () => T.rail.trains },
  { id: 'bruecken', icon: '🌉', name: 'Brückenfelder', tiers: [10, 50], value: () => tileCount(t => t.bridge) },
  { id: 'schoen', icon: '🌸', name: 'Schönheit', tiers: [200, 1000, 5000], value: () => T.beauty },
  { id: 'baeume', icon: '🌳', name: 'Bäume gepflanzt', tiers: [25, 100, 500], value: () => decoCount(d => d.b === 'baum') },
  { id: 'deko', icon: '🪴', name: 'Deko aufgestellt', tiers: [50, 250, 1000], value: () => decoCount(() => true) + tileCount(t => ITEMS[t.b].cat === 'deko') },
  { id: 'laternen', icon: '🏮', name: 'Laternen', tiers: [3, 10, 22], value: () => lanternCount() },
  { id: 'inseln', icon: '🏝️', name: 'Inseln', tiers: [2, 5, 8], value: () => state.islands.size },
  { id: 'forschung', icon: '💡', name: 'Forschungen', tiers: [5, 15, TECHS.length], value: () => state.techs.size },
  { id: 'wege', icon: '🛤️', name: 'Wege', unit: 'km', tiers: [1, 5, 20], value: () => tileCount(t => t.b === 'weg') * 0.1 },
  { id: 'land', icon: '🌊', name: 'Land aus dem Meer', unit: 'Felder', tiers: [20, 100, 500],
    value: () => [...state.claimed].filter(k => terrainAt(...keyXY(k)) !== 'water').length },
  { id: 'kunst', icon: '🎨', name: 'Kunstakademie-Stücke', tiers: [5, 20, DESIGN.length], value: () => state.design.size },
  { id: 'wunder', icon: '🏛️', name: 'Wunderwerke', tiers: [1, 3, 5], value: () => tileCount(t => wonderDone(t)) },
];
const RANKS = [
  { stars: 0, name: 'Noch ohne Ehrennadel' },
  { stars: 5, name: 'Ehrennadel Bronze', item: 'pokal_bronze' },
  { stars: 15, name: 'Ehrennadel Silber', item: 'pokal_silber' },
  { stars: 30, name: 'Ehrennadel Gold', item: 'pokal_gold' },
  { stars: 45, name: 'Goldene Inselkrone' },
];
const starCount = () => Object.values((state && state.achieved) || {}).reduce((sum, n) => sum + n, 0);
const rankOf = stars => [...RANKS].reverse().find(r => stars >= r.stars);
// silent: beim Laden – schon Erreichtes still zählen, ohne Band-Gewitter
function checkAchievements(silent = false) {
  if (!state.achieved) state.achieved = {};
  const before = rankOf(starCount());
  for (const a of ACHIEVEMENTS) {
    const v = a.value();
    let n = state.achieved[a.id] || 0;
    while (n < a.tiers.length && v >= a.tiers[n] - 1e-9) { n++; if (!silent) achvQueue.push({ a, tier: n }); }
    state.achieved[a.id] = n;
  }
  const after = rankOf(starCount());
  if (!silent && after !== before) achvQueue.push({ rank: after });
  if (!silent) showNextAchv();
}
// verdiente Taler zählen (für den Erfolg „Taler verdient“)
function earn(dt) {
  const got = T.inc * boostMul('inc') * dt;
  state.money += got;
  state.stats.earned += got;
}

// ---------------------------------------------------------------------------
// Sammelalbum: sechs Seiten mit allem, was es gibt. Gesammelt wird, was auf der Insel steht (bleibt gesammelt).
// Eine volle Seite schaltet eine Belohnung frei, die es nur so gibt (ITEMS[].album bzw. STYLES[].album).
// ---------------------------------------------------------------------------
const ALBUM = [
  { id: 'gebaeude', icon: '🏗️', name: 'Gebäude', reward: 'denkmal' },
  { id: 'deko', icon: '🌸', name: 'Deko', reward: 'rosenbogen' },
  { id: 'haeuser', icon: '🏠', name: 'Hausformen', reward: 'uhrturm' },
  { id: 'farben', icon: '🎨', name: 'Farben', reward: 'weg:regenbogen' },
  { id: 'wege', icon: '🛤️', name: 'Wegstile', reward: 'weg:goldpflaster' },
  { id: 'bewohner', icon: '🐾', name: 'Bewohner', reward: 'karussell' },
];
const isRewardItem = id => !!(ITEMS[id].album || ITEMS[id].rank || ITEMS[id].wonder || ITEMS[id].garden);   // Wunderwerke haben ihren eigenen Fortschritt
function albumKeys(p) {
  switch (p.id) {
    case 'gebaeude': return Object.keys(ITEMS).filter(id => ['bau', 'netz', 'bildung', 'strom'].includes(ITEMS[id].cat) && !isRewardItem(id)).map(id => 'b:' + id);
    case 'deko': return Object.keys(ITEMS).filter(id => ITEMS[id].cat === 'deko' && !isRewardItem(id)).map(id => 'b:' + id);
    case 'haeuser': return HOUSE_STAGES.map((_, i) => 'hs:' + (i + 1));
    case 'farben': return WALLS.map((_, i) => 'wall:' + i).concat(ROOFS.map((_, i) => 'roof:' + i));
    case 'wege': return STYLES.weg.filter(st => !st.album).map(st => 'weg:' + st.id);
    case 'bewohner': return ANIMALS.map(a => 'tier:' + a.id);
    default: return [];
  }
}
const albumDone = id => { const p = ALBUM.find(q => q.id === id); return !!p && !!state.album && albumKeys(p).every(k => state.album.has(k)); };
const rewardName = r => r.startsWith('weg:') ? styleDef('weg', r.slice(4)).name : ITEMS[r].name;
function collectAlbum() {
  if (!state.album) state.album = new Set();
  const add = k => state.album.add(k);
  for (const t of state.tiles.values()) {
    if (ITEMS[t.b] && ITEMS[t.b].cat) add('b:' + t.b);
    if (t.b === 'haus') { add('hs:' + t.lvl); if (t.animal) add('tier:' + t.animal); }
    if (t.wall != null) add('wall:' + t.wall);
    if (t.roof != null) add('roof:' + t.roof);
    if (t.b === 'weg' || isCrossing(t)) add('weg:' + (t.style || 'sand'));
  }
  for (const ds of state.decos.values()) for (const d of ds) if (d) add('b:' + d.b);
  // Belohnungen bleiben, auch wenn später Neues ins Album kommt (LATE_ALBUM: erst nach dem Album dazugekommen)
  if (!state.legacy) state.legacy = new Set();
  for (const p of ALBUM) if (albumKeys(p).every(k => state.album.has(k) || LATE_ALBUM.has(k))) state.legacy.add(p.reward);
}
const LATE_ALBUM = new Set(['b:reihenhaus', 'b:baumhaus', 'b:hausboot', 'b:ferienhaus', 'b:windrad', 'b:wasserkraft', 'b:solarfeld', 'b:geothermie', 'b:wellen', 'b:seilbahn']);

// ---------------------------------------------------------------------------
// Wunderwerke: Baustelle (phase 0), dann Abschnitt für Abschnitt; Wirkung (effect) erst, wenn alle fertig sind
// ---------------------------------------------------------------------------
// Preise: Jeder Abschnitt kostet min Minuten Einkommen – gemessen beim Aufstellen der Baustelle (t.rate) –,
// mindestens money, dazu viel Material. So bleibt ein Wunderwerk ein Langzeitziel (etwa eine Stunde, das Schloss
// mehrere Stunden), egal wie reich man schon ist.
const WONDERS = {
  riesenrad: { the: 'Das Riesenrad', h: 215, text: '+25 % Einnahmen – und alle 15 Minuten Jahrmarkt: 3 Minuten lang dreifache Einnahmen', effect: { incMul: 0.25 },
    names: ['Fundament', 'Stahlgerüst', 'Rad und Gondeln', 'Lichter'],
    phases: [{ min: 12, money: 30000, quader: 150 }, { min: 15, money: 40000, metall: 150 },
             { min: 15, money: 50000, metall: 200, bretter: 200 }, { min: 18, money: 1e6, bretter: 150, metall: 100 }] },
  sternwarte: { the: 'Die Sternwarte', h: 95, text: '+50 % Ideen – nachts fallen Sternschnuppen (antippen: Ideen), und das Boot findet Inseln doppelt so schnell', effect: { sciMul: 0.5 },
    names: ['Fundament', 'Turm', 'Kuppel und Fernrohr'],
    phases: [{ min: 15, money: 30000, quader: 200 }, { min: 20, money: 45000, metall: 150, bretter: 150 }, { min: 25, money: 1e6, metall: 150, quader: 150 }] },
  seebruecke: { the: 'Die Seebrücke', h: 40, text: '+20 % Einwohner (Kurgäste) – und die Hafenstadt: Aufträge zahlen +50 %, ein Auftragsplatz mehr, Schiffe fahren schneller', effect: { popMul: 0.2 },
    names: ['Pfähle', 'Steg', 'Pavillon und Laternen'],
    phases: [{ min: 10, money: 20000, bretter: 250 }, { min: 15, money: 30000, bretter: 200, metall: 80 }, { min: 20, money: 1e6, quader: 150, metall: 100 }] },
  botgarten: { the: 'Der Botanische Garten', h: 80, text: '+50 % Schönheit – und der grüne Daumen: „Park“ und „schöne Umgebung“ überall erfüllt, Obst und Felder doppelt, exotische Deko', effect: { beautyMul: 0.5 },
    names: ['Gärten', 'Glasgerüst', 'Palmenhaus', 'Bepflanzung'],
    phases: [{ min: 12, money: 40000, quader: 200 }, { min: 15, money: 50000, metall: 150, kristall: 60 },
             { min: 18, money: 60000, kristall: 100, bretter: 200 }, { min: 20, money: 1e6, obst: 600, kristall: 80 }] },
  schloss: { the: 'Das Schloss', h: 195, text: '+50 % auf alles, deine Insel ist jetzt eine Königliche Inselperle – und alle 10 Minuten ein königlicher Erlass nach Wahl', effect: { allMul: 0.5 },
    names: ['Fundament', 'Mauern', 'Türme', 'Dächer', 'Säle', 'Einweihung'],
    phases: [{ min: 20, money: 150000, quader: 500 }, { min: 25, money: 200000, quader: 500, bretter: 300 }, { min: 30, money: 250000, metall: 400 },
             { min: 35, money: 300000, quader: 300, metall: 300 }, { min: 40, money: 400000, kristall: 200, bretter: 300 },
             { min: 50, money: 1e6, metall: 250, kristall: 250, obst: 1000 }] },   // letzter Abschnitt: mindestens 1 Mio.
};
// ---------------------------------------------------------------------------
// Fähigkeiten der Wunder (Block 28). Dauerhafte Boni rechnet totals (T.wonders: Wunder → 1, ohne Strom ½); Schübe auf
// Zeit (Jahrmarkt, Erlasse) wirken beim Verdienen und Erzeugen (boostMul) – so muss beim Ablaufen nichts neu gerechnet werden.
// ---------------------------------------------------------------------------
const wonderOn = b => !!(T.wonders && T.wonders[b]);
// 🎡 Jahrmarkt: die ersten 3 Minuten jeder Viertelstunde (echte Uhr), dreifache Einnahmen
const FAIR_EVERY = 15 * 60e3, FAIR_LEN = 3 * 60e3, FAIR_MUL = 3;
const fairLeft = (now = Date.now()) => wonderOn('riesenrad') ? Math.max(0, FAIR_LEN - now % FAIR_EVERY) : 0;
const fairNext = (now = Date.now()) => FAIR_EVERY - now % FAIR_EVERY;
// 👑 Erlasse: im Schloss wählen, wirken 5 Minuten; der nächste 10 Minuten nach der Wahl
const DECREE_LEN = 5 * 60e3, DECREE_EVERY = 10 * 60e3;
const DECREES = {
  ernte:   { icon: '🌾', name: 'Doppelte Ernte', text: 'Rohstoffe und Waren ×2', kind: 'prod', mul: 2 },
  fest:    { icon: '🎉', name: 'Festtag', text: 'Einnahmen ×2', kind: 'inc', mul: 2 },
  gelehrt: { icon: '📚', name: 'Gelehrtentag', text: 'Ideen ×3', kind: 'sci', mul: 3 },
  handel:  { icon: '⚓', name: 'Handelstag', text: 'Sofort Frachter an alle Auftragsplätze', kind: 'orders' },
};
const decreeActive = (now = Date.now()) => state.decree && now < state.decree.until ? state.decree : null;
const decreeReady = (now = Date.now()) => wonderOn('schloss') && !decreeActive(now) && now >= (state.decreeNext || 0);
function chooseDecree(id) {
  const D = DECREES[id], now = Date.now();
  if (!D || !decreeReady(now)) return false;
  state.decree = { id, until: now + DECREE_LEN };
  state.decreeNext = now + DECREE_EVERY;
  if (D.kind === 'orders') { let o; while (state.orders.length < orderSlots() && (o = makeOrder(now))) state.orders.push(o); state.orderNext = now + ORDER_EVERY; }
  sfx('star'); confettiBurst();
  toast(`👑 Erlass: ${D.icon} ${D.name} – ${D.text}${D.mul ? ' für 5 Minuten' : ''}`);
  save();
  return true;
}
function boostMul(kind, now = Date.now()) {
  let m = 1;
  if (kind === 'inc' && fairLeft(now) > 0) m *= FAIR_MUL;
  const d = decreeActive(now), D = d && DECREES[d.id];
  if (D && D.kind === kind) m *= D.mul;
  return m;
}
// 🔭 Sternschnuppen: nachts fällt ab und zu eine neben ein Haus – antippen bringt Ideen (3 Minuten Ideen, mindestens 50)
const fallenStars = [];
const STAR_LIFE = 45e3, STAR_CHANCE = 0.02;                // je Takt (0,7 s) → etwa alle 35 s eine
function spawnStar(rnd = Math.random, now = performance.now()) {
  const homes = [...state.tiles].filter(([, t]) => isHome(t.b));
  if (!homes.length || fallenStars.length >= 3) return null;
  const [k] = homes[Math.floor(rnd() * homes.length)], [x, y] = keyXY(k);
  const s = { x: x + Math.round(rnd() * 4 - 2), y: y + Math.round(rnd() * 4 - 2), t0: now };
  fallenStars.push(s);
  return s;
}
function starTick(now = performance.now()) {
  for (let i = fallenStars.length - 1; i >= 0; i--) if (now - fallenStars[i].t0 > STAR_LIFE) fallenStars.splice(i, 1);
  if (wonderOn('sternwarte') && nightAt(now) > 0.5 && Math.random() < STAR_CHANCE) spawnStar();
}
function collectStarAt(x, y) {
  const i = fallenStars.findIndex(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);
  if (i < 0) return false;
  const [s] = fallenStars.splice(i, 1), got = Math.max(50, Math.round(T.sci * 180));
  state.science += got;
  sparkle(s.x, s.y); sfx('star');
  addFloat(s.x, s.y, `💡 +${fmt(got)}`, '#f2c14e');
  toast(`🌠 Sternschnuppe: +${fmt(got)} Ideen`);
  return true;
}
// Jahrmarkt: beim Beginn Bescheid sagen, solange er läuft funkelt es am Riesenrad
let fairWas = false;
function fairTick(now = Date.now()) {
  const on = fairLeft(now) > 0;
  if (on && !fairWas) { toast(`🎡 Jahrmarkt! ${FAIR_LEN / 60e3} Minuten lang ${FAIR_MUL}-fache Einnahmen`); sfx('star'); }
  fairWas = on;
  if (!on) return;
  const w = [...state.tiles].find(([, t]) => t.b === 'riesenrad');
  if (w) { const [x, y] = keyXY(w[0]); sparkle(x + Math.random() * 5, y + Math.random() * 5); }
}
// Erlass im Schloss-Fenster: läuft, wartet (Auswahl) oder kommt bald
function decreeHtml(now = Date.now()) {
  const d = decreeActive(now);
  if (d) return `<div class="label">👑 Erlass</div><div class="status"><div class="ok">${DECREES[d.id].icon} ${DECREES[d.id].name}: ${DECREES[d.id].text} · noch ${fmtClock(d.until - now)}</div></div>`;
  if (!decreeReady(now)) return `<div class="label">👑 Erlass</div><p class="muted">Der nächste Erlass in ${fmtClock((state.decreeNext || 0) - now)}.</p>`;
  return `<div class="label">👑 Ein Erlass wartet – was soll gelten?</div>
    <div class="decrees">${Object.entries(DECREES).map(([id, D]) => `<button class="btn ghost" data-decree-pick="${id}">${D.icon} ${D.name}<small>${D.text}${D.mul ? ' · 5 Min.' : ''}</small></button>`).join('')}</div>`;
}
// Zeile für die Ziel-Karte: Jahrmarkt, Erlass
function boostLines(now = Date.now()) {
  const out = [];
  if (wonderOn('riesenrad')) out.push(fairLeft(now) > 0 ? `<div class="req done">🎡 Jahrmarkt! Einnahmen ×${FAIR_MUL} · noch ${fmtClock(fairLeft(now))}</div>`
    : `<div class="req"><small>🎡 Nächster Jahrmarkt in ${fmtClock(fairNext(now))}</small></div>`);
  const d = decreeActive(now);
  if (d) out.push(`<div class="req done">👑 ${DECREES[d.id].icon} ${DECREES[d.id].name} · noch ${fmtClock(d.until - now)}</div>`);
  else if (decreeReady(now)) out.push('<div class="req done" data-decree="1">👑 Ein Erlass wartet – im Schloss wählen</div>');
  return out.join('');
}

// Preise vor dem 30.09. (fest, viel billiger) – nur zum Erstatten alter Baustellen
const OLD_WONDER_PHASES = {
  riesenrad: [{ money: 8000, quader: 40 }, { money: 12000, metall: 40 }, { money: 16000, metall: 60, bretter: 60 }, { money: 20000, bretter: 40, metall: 30 }],
  sternwarte: [{ money: 10000, quader: 60 }, { money: 15000, metall: 50, bretter: 40 }, { money: 20000, metall: 40, quader: 40 }],
  seebruecke: [{ money: 8000, bretter: 80 }, { money: 12000, bretter: 60, metall: 20 }, { money: 16000, quader: 40, metall: 30 }],
  botgarten: [{ money: 12000, quader: 60 }, { money: 18000, metall: 50, kristall: 20 }, { money: 24000, kristall: 40, bretter: 50 }, { money: 30000, obst: 200, kristall: 30 }],
  schloss: [{ money: 40000, quader: 150 }, { money: 60000, quader: 150, bretter: 100 }, { money: 80000, metall: 120 },
            { money: 100000, quader: 100, metall: 100 }, { money: 120000, kristall: 60, bretter: 100 }, { money: 150000, metall: 80, kristall: 80, obst: 300 }],
};
const niceRound = v => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1)); return Math.round(v / p) * p; };
function wonderCost(t, p = t.phase || 0) {
  const ph = WONDERS[t.b].phases[p];
  if (!ph) return null;
  if (t.rate == null && T.inc > 0) t.rate = Math.round(T.inc);      // alte Baustellen: Einkommen von jetzt festhalten
  const { min, money, ...mat } = ph;
  return { money: niceRound(Math.max(money, (t.rate || 0) * 60 * min)), ...mat };
}
// Was in die Baustelle schon geflossen ist (Abriss, Umzug); alte Stände ohne t.paid: nach den alten Preisen
function wonderPaid(t) {
  if (t.paid) return { ...t.paid };
  const out = { money: 0 };
  for (const ph of (OLD_WONDER_PHASES[t.b] || []).slice(0, t.phase || 0)) for (const [r, n] of Object.entries(ph)) out[r] = (out[r] || 0) + n;
  return out;
}
const wonderDone = t => !!t && !!WONDERS[t.b] && (t.phase || 0) >= WONDERS[t.b].phases.length;
// Nächsten Abschnitt bauen (stay: aus dem Rathaus – kein Infofenster danach)
function wonderStep(x, y, stay = false) {
  const t = state.tiles.get(x + ',' + y), W = t && WONDERS[t.b];
  if (!W || wonderDone(t)) return false;
  const cost = wonderCost(t);
  if (!canPay(cost)) { fail(state.money < (cost.money || 0) ? 'Zu wenig Taler' : 'Material fehlt noch'); return false; }
  const paid = wonderPaid(t);
  for (const [r, n] of Object.entries(cost)) paid[r] = (paid[r] || 0) + n;
  t.paid = paid;
  const { money = 0, ...mat } = cost;
  state.money -= money; payMat(mat);
  t.phase = (t.phase || 0) + 1;
  t.born = performance.now();
  recalc();
  const [w, h] = sizeOf(t.b, t.rot, t);
  sparkle(x + (w - 1) / 2, y + (h - 1) / 2);
  if (wonderDone(t)) {
    confettiBurst(); confettiBurst();
    sfx('star');
    openModal(`
      <h2>🎉 ${W.the} ist fertig!</h2>
      <p>${W.text}.</p>
      <div class="row"><button class="btn" id="m-ok" style="flex:1">Hurra!</button></div>`);
    $('m-ok').onclick = closeModal;
  } else {
    sfx('build');
    toast(`${W.the}: ${W.names[t.phase - 1]} fertig!`);
  }
  save();
  if (!stay && !wonderDone(t)) openInfo(x, y);
  return true;
}
