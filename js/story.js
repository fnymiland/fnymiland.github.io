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
  if (n.lanterns) out.push({ text: `🏮 ${n.lanterns} Laternen (${townTitle(n.lanterns)})`, ok: lanternCount() >= n.lanterns });
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
  { text: 'Bau dein erstes Haus.', hint: '🏠 Bauen → Haus', done: () => hasBuilt('haus') },
  { text: 'Leg einen Weg bis vor die Haustür.', hint: '🛤️ Wege → Weg (ziehen)',
    done: () => [...state.tiles].some(([k, t]) => t.b === 'haus' && wishMet('weg', ...keyXY(k))) },
  { text: 'Stell einen Holzfäller in den Wald.', hint: '🏠 Bauen → Holzfäller', done: () => hasBuilt('holz') },
  { text: 'Erschließe die Waldinsel.', hint: 'Braucht 8 Einwohner (2 Häuser) und 🪙 150 – Insel im Meer antippen',
    done: () => isleOpen('wald') },
  { text: 'Schneide den Uralten Baum frei.', hint: 'Baum antippen → Restaurieren (braucht 🪵 10)', done: () => lmStage('baum') >= 1 },
  { text: 'Bau ein Sägewerk.', hint: '🏠 Bauen → Sägewerk', done: () => hasBuilt('saege') },
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
