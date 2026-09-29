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
const nextIsle = () => ISLES.find(i => !isleOpen(i.id)) || null;
function unlockIsland(id) {
  const i = ISLE_BY_ID[id];
  if (!i || isleOpen(id)) return false;
  if (nextIsle() !== i) { fail(`Erst die ${nextIsle().name} erschließen`); return false; }
  const miss = isleNeeds(i).filter(c => !c.ok);
  if (miss.length) { fail('Es fehlt noch: ' + miss.map(c => c.text).join(', ')); return false; }
  state.money -= i.need.money || 0;
  state.science -= i.need.science || 0;
  state.islands.add(id);
  ownIsland(id);
  recalc();
  const [x, y] = isleAnchor(i);
  jumpTo(x, y, 3, 3);
  sparkle(x + 1, y + 1);
  confettiBurst();
  sfx('star');
  openModal(`
    <h2>${i.icon} ${i.name} erschlossen!</h2>
    <p>${i.text}</p>
    <p>In der Mitte wartet ${LANDMARKS[i.lm].icon} <b>${LANDMARKS[i.lm].name}</b> darauf, restauriert zu werden.</p>
    <p class="muted">Bau dir hier ein kleines Dorf – Betriebe weit weg von Häusern arbeiten nur halb so schnell.</p>
    <div class="row"><button class="btn" id="m-ok">Los geht's</button></div>`);
  $('m-ok').onclick = closeModal;
  checkStars();
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
  const { money = 0, ...mat } = next.cost;
  let err = null;
  const isle = ISLE_OF_LM[type];
  if (!pos || !ownedTile(pos[0], pos[1])) err = `Erschließe zuerst die ${isle ? isle.name : 'Insel'}`;
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
  recalc();
  confettiBurst(); confettiBurst();
  sfx('star');
  openModal(`
    <h2>🎆 Das Laternenfest!</h2>
    <p>Der Leuchtturm brennt wieder, und alle ${LANTERN_TOTAL} Laternen leuchten. Ganz ${escHtml(state.town.name)} feiert bis tief in die Nacht.</p>
    <p>${escHtml(state.town.name)} ist jetzt eine <b>Inselperle</b>. Die Insel gehört dir – bau und gestalte weiter, so lange du magst.</p>
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
  { text: 'Erschließe die Waldinsel.', hint: 'Braucht 8 Einwohner (2 Häuser) und 🪙 150 – Insel im Meer antippen',
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
  if (state.festival) return `<h4>🏮 ${n} / ${LANTERN_TOTAL} · Inselperle</h4><div class="req">Alle Laternen brennen. Gestalte weiter!</div>`;
  if (n >= ITEMS.leuchtturm.lanterns) {
    return `<h4>🏮 ${n} / ${LANTERN_TOTAL}</h4><div class="req">🗼 Bau den Leuchtturm am Wasser – dann beginnt das Laternenfest!</div>`;
  }
  // Laternen auf den schon erschlossenen Inseln, dazu immer die nächste Insel
  const opts = Object.keys(LM_STAGES).map(type => ({ type, info: restoreInfo(type) }))
    .filter(o => o.info.next && o.info.pos && ownedTile(o.info.pos[0], o.info.pos[1]));
  opts.sort((a, b) => (a.info.err ? 1 : 0) - (b.info.err ? 1 : 0) || a.info.stage - b.info.stage);
  let html = `<h4>🏮 ${n} / ${LANTERN_TOTAL} · Nächste Laternen</h4>` + opts.slice(0, 2).map(({ type, info }) => {
    const parts = Object.entries(info.mat).map(([r, need]) => `${RES[r].icon} ${fmt(Math.min(state.res[r], need))}/${need}`);
    if (info.money) parts.unshift(`🪙 ${fmt(Math.min(state.money, info.money))}/${fmt(info.money)}`);
    const detail = info.err ? parts.join(' ') : '✨ bereit – antippen!';
    return `<div class="req${info.err ? '' : ' done'}" data-lm="${type}">${lmStepName(type, info.stage + 1)}<br><small>${detail}</small></div>`;
  }).join('');
  const i = nextIsle();
  if (i) {
    const need = isleNeeds(i), ok = need.every(c => c.ok);
    html += `<div class="req${ok ? ' done' : ''}" data-isle="${i.id}">🏝️ Nächste Insel: ${i.icon} ${i.name}<br><small>${ok ? '✨ bereit – antippen!'
      : need.map(c => c.have != null ? `${c.ok ? '✓' : ''}${c.text.split(' ')[0]} ${fmt(Math.min(c.have, c.want))}/${fmt(c.want)}` : `${c.ok ? '✓' : ''}${c.text}`).join(' ')}</small></div>`;
  }
  return html;
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
    text: 'Die Schnecke heißt: Hier arbeiten die Leute nur halb, weil es weit bis zum Dorf ist. Ein Weg zum Dorf oder Häuser in der Nähe bringen volle Kraft.' },
  { id: 'viertel', icon: '🏘️', title: 'Viertel', when: () => anyStatus(s => s.bonus > 0),
    text: 'Gebäude, die aneinandergrenzen oder über Wege verbunden sind, bilden ein Viertel. Ab 3, 8 und 15 Gebäuden arbeitet das ganze Viertel 10, 20 und 30 % besser.' },
  { id: 'stufen', icon: '⬆️', title: 'Auch Betriebe wachsen', when: () => [...state.tiles.values()].some(t => BUILD_STAGES[t.b]),
    text: 'Auch Betriebe haben drei Stufen. Tipp einen an: Dort steht, was für die nächste Stufe fehlt – zum Beispiel eine Mühle mit Feldern daneben.' },
  { id: 'laterne', icon: '🏮', title: 'Laternen', when: () => lanternCount() >= 1,
    text: 'Jede Sehenswürdigkeit hat drei Laternen. Jede Laterne schaltet Neues frei und bringt eine Seite im Tagebuch 📖. Oben links steht immer, welche Laternen als Nächstes gehen.' },
  { id: 'insel', icon: '🏝️', title: 'Neue Inseln', when: () => { const i = nextIsle(); return !!i && isleNeeds(i).every(c => c.ok); },
    text: 'Die nächste Insel kann erschlossen werden! Tipp sie im Meer an (oder oben links). Jede Insel hat eigene Rohstoffe und eine Sehenswürdigkeit.' },
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
    text: 'Zieh Schienen zwischen zwei Inseln (über Wasser als Brücke), stell an beide Enden einen Bahnhof und baue 2 Windräder. Dann fährt der Zug: +8 Pendler je Bahnhof und +10 % für beide Inseln.' },
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
  { id: 'haeuser', icon: '🏠', name: 'Häuser', tiers: [10, 50, 150], value: () => tileCount(t => t.b === 'haus') },
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
  const got = T.inc * dt;
  state.money += got;
  state.stats.earned += got;
}
