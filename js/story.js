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
  if (state.festival) {                            // danach: das Schloss, Erfolge und Album
    const s = [...state.tiles.values()].find(t => t.b === 'schloss'), N = WONDERS.schloss.phases.length;
    const line = !s ? '🏰 Bau das Schloss: 🏗️ Bauen → 🏛️ Wunder' : wonderDone(s) ? '👑 Dein Schloss steht!' : `🏰 Schloss: Abschnitt ${s.phase + 1} von ${N} – ${WONDERS.schloss.names[s.phase]}`;
    const all = ALBUM.flatMap(albumKeys), pct = Math.floor(all.filter(k => state.album.has(k)).length / all.length * 100);
    return `<h4>🏮 ${n} / ${LANTERN_TOTAL} · ${townTitle(n)}</h4><div class="req">${line}</div><div class="req"><small>⭐ ${starCount()} Erfolge · 📒 ${pct} % Album</small></div>`;
  }
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
    text: 'Zieh Schienen zwischen zwei Inseln (über Wasser als Brücke) und stell an beide Enden einen Bahnhof. Der Zug fährt mit Strom von Windrädern: 1 ⚡ + 1 ⚡ je km Strecke. Dann gibt es +8 Pendler je Bahnhof und +10 % für beide Inseln. Als geschlossener Kreis fährt er im Kreis – und auf großen Kreisen passen mehr Züge.' },
  { id: 'strom', icon: '⚡', title: 'Strom', when: () => T.rail.power.city && T.rail.power.demand > T.rail.power.supply,
    text: 'Werkstätten, Laternen und Züge brauchen Strom. Jedes Windrad liefert 1 ⚡, egal wo es steht. Ohne Strom laufen Werkstätten nur halb (⚡ über dem Gebäude), Laternen bleiben nachts dunkel und Züge stehen. Die Bilanz steht im Windrad und im Rathaus.' },
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
  const got = T.inc * dt;
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
const isRewardItem = id => !!(ITEMS[id].album || ITEMS[id].rank || ITEMS[id].wonder);   // Wunderwerke haben ihren eigenen Fortschritt
function albumKeys(p) {
  switch (p.id) {
    case 'gebaeude': return Object.keys(ITEMS).filter(id => ['bau', 'netz', 'bildung'].includes(ITEMS[id].cat) && !isRewardItem(id)).map(id => 'b:' + id);
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
}

// ---------------------------------------------------------------------------
// Wunderwerke: Baustelle (phase 0), dann Abschnitt für Abschnitt; Wirkung (effect) erst, wenn alle fertig sind
// ---------------------------------------------------------------------------
// Preise: Jeder Abschnitt kostet min Minuten Einkommen – gemessen beim Aufstellen der Baustelle (t.rate) –,
// mindestens money, dazu viel Material. So bleibt ein Wunderwerk ein Langzeitziel (etwa eine Stunde, das Schloss
// mehrere Stunden), egal wie reich man schon ist.
const WONDERS = {
  riesenrad: { the: 'Das Riesenrad', h: 215, text: 'Touristen kommen: +80 Taler/s', effect: { inc: 80 },
    names: ['Fundament', 'Stahlgerüst', 'Rad und Gondeln', 'Lichter'],
    phases: [{ min: 12, money: 30000, quader: 150 }, { min: 15, money: 40000, metall: 150 },
             { min: 15, money: 50000, metall: 200, bretter: 200 }, { min: 18, money: 60000, bretter: 150, metall: 100 }] },
  sternwarte: { the: 'Die Sternwarte', h: 95, text: '+25 % Ideen für die ganze Insel', effect: { sciMul: 0.25 },
    names: ['Fundament', 'Turm', 'Kuppel und Fernrohr'],
    phases: [{ min: 15, money: 30000, quader: 200 }, { min: 20, money: 45000, metall: 150, bretter: 150 }, { min: 25, money: 60000, metall: 150, quader: 150 }] },
  seebruecke: { the: 'Die Seebrücke', h: 40, text: 'Kurgäste: +40 Einwohner und +40 Taler/s', effect: { pop: 40, inc: 40 },
    names: ['Pfähle', 'Steg', 'Pavillon und Laternen'],
    phases: [{ min: 10, money: 20000, bretter: 250 }, { min: 15, money: 30000, bretter: 200, metall: 80 }, { min: 20, money: 40000, quader: 150, metall: 100 }] },
  botgarten: { the: 'Der Botanische Garten', h: 80, text: 'Sehr viel Schönheit und +0,5 Obst/s', effect: { prod: { obst: 0.5 } },
    names: ['Gärten', 'Glasgerüst', 'Palmenhaus', 'Bepflanzung'],
    phases: [{ min: 12, money: 40000, quader: 200 }, { min: 15, money: 50000, metall: 150, kristall: 60 },
             { min: 18, money: 60000, kristall: 100, bretter: 200 }, { min: 20, money: 80000, obst: 600, kristall: 80 }] },
  schloss: { the: 'Das Schloss', h: 195, text: '+20 % auf alles – deine Insel ist jetzt eine Königliche Inselperle', effect: { allMul: 0.2 },
    names: ['Fundament', 'Mauern', 'Türme', 'Dächer', 'Säle', 'Einweihung'],
    phases: [{ min: 20, money: 150000, quader: 500 }, { min: 25, money: 200000, quader: 500, bretter: 300 }, { min: 30, money: 250000, metall: 400 },
             { min: 35, money: 300000, quader: 300, metall: 300 }, { min: 40, money: 400000, kristall: 200, bretter: 300 },
             { min: 50, money: 500000, metall: 250, kristall: 250, obst: 1000 }] },
};
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
  const [w, h] = sizeOf(t.b, t.rot);
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
