'use strict';
// ---------------------------------------------------------------------------
// Deine Figur (Block 97): Du spazierst als Bürgermeister·in über die eigene Insel – gern ums Rathaus, und Neues
// schaust du dir an. Antippen: Sprechblase mit dem, was gerade dran ist (Einführung, fehlendes Material, Ausbauen,
// Wünsche) und ein Knopf dorthin. Ab und zu meldet sie sich von selbst (nicht bei „Tipps aus“).
// Aussehen im Fenster „Du“ (Knopf oben mit deinem Gesicht) → Figur: Tier, Fell, Shirt, Kopf, Gesicht, Körper, Hand. Besondere Sachen gibt es für
// Erfolge (WEAR_NEED). Gespeichert in state.me (Spielstand, geht ohne Anmeldung); angemeldet wird es zusätzlich ins
// Profil kopiert, damit man bei Freunden genauso aussieht (friends.js liest es beim Besuch von dort).
// ---------------------------------------------------------------------------
const ME_NAME = 'Bürgermeister·in';
// was man sich erst verdienen muss: Erfolg (Stufe n) oder Sterne insgesamt
const WEAR_NEED = {
  blumenkranz: { a: 'baeume', n: 1 }, kochmuetze: { a: 'einwohner', n: 1 }, bauhelm: { a: 'haeuser', n: 1 },
  piratenhut: { a: 'inseln', n: 1 }, wikingerhelm: { a: 'land', n: 1 }, zylinder: { a: 'taler', n: 2 }, krone: { a: 'wunder', n: 1 },
  rucksack: { a: 'forschung', n: 1 }, umhang: { stars: 15 },
  eis: { a: 'fzpark', n: 1 }, strauss: { a: 'deko', n: 1 }, laterne: { a: 'laternen', n: 1 },
  band: { bond: 2 }, herzballon: { bond: 3 },                          // Freundschaft (Block 105): Herzen bei einem Freund
};
const WEAR_SLOTS = [['hat', 'Kopf'], ['face', 'Gesicht'], ['body', 'Körper'], ['hand', 'In der Hand']];
function wearOk(id) {
  const n = WEAR_NEED[id];
  if (!n) return true;
  if (n.bond) return (state.bond || 0) >= n.bond;
  return n.stars ? starCount() >= n.stars : ((state.achieved || {})[n.a] || 0) >= n.n;
}
function wearNeedText(id) {
  const n = WEAR_NEED[id];
  if (!n) return '';
  if (n.stars) return `⭐ ${n.stars} Erfolgs-Sterne`;
  if (n.bond) return `💛 Freundschaft mit ${n.bond} Herzen`;
  const A = ACHIEVEMENTS.find(a => a.id === n.a);
  return `${A.icon} ${A.name}: ${tierText(A, A.tiers[n.n - 1])}`;
}

// Wie weit ist man? { have, need, text } – für die Anzeige beim gesperrten Teil
function wearProgress(id) {
  const n = WEAR_NEED[id];
  if (!n) return null;
  if (n.stars) return { have: starCount(), need: n.stars, text: `${starCount()} / ${n.stars} ⭐` };
  if (n.bond) return { have: state.bond || 0, need: n.bond, text: `${'♥'.repeat(state.bond || 0)}${'♡'.repeat(Math.max(0, n.bond - (state.bond || 0)))} (beste Freundschaft)` };
  const A = ACHIEVEMENTS.find(a => a.id === n.a), goal = A.tiers[n.n - 1], v = A.value();
  return { have: v, need: goal, text: `${tierText(A, Math.min(v, goal))} / ${tierText(A, goal)}` };
}
let meLockOpen = null;                                                   // angetipptes gesperrtes Teil (nur Anzeige)

// --- Aussehen ------------------------------------------------------------------------------------
// immer gültig (state.me kann fehlen oder aus einer anderen Version stammen)
let meProfileLook = null;                                               // aus dem Profil (angemeldet, noch nie hier eingestellt)
function meLook() {
  const m = (state && state.me) || (!VISIT && meProfileLook) || {};
  const L = lookClean(m);
  for (const [slot] of WEAR_SLOTS) if (L[slot] && !wearOk(L[slot])) L[slot] = null;      // (noch) nicht verdient: weglassen
  return { a: Number.isInteger(m.a) && ANIMALS[m.a] ? m.a : Math.abs(state.seed || 0) % ANIMALS.length, ...L,
    name: typeof m.name === 'string' ? m.name.trim().slice(0, 20) : '', off: !!m.off };
}
const meFigLook = () => { const L = meLook(); return figFrom(L.a, L, L.name || ME_NAME); };
function setMe(patch) {
  if (VISIT) return;
  if (viewOnly()) { cloudBlocked(); return; }                           // zuschauendes Gerät: sagen, warum nichts passiert
  state.me = { ...meLook(), ...patch };
  meSig = null;
  cloudTouched(); save();                                                // Online-Speicher: eigene Änderung (Regel 93)
  mePushProfile();
}
// angemeldet: Kopie ins Profil (für Besuche bei Freunden)
async function mePushProfile() {
  if (VISIT || !cloudUser || !cloudApi) return;
  const L = meLook(), uid = cloudUser.uid;
  try { await cloudApi.set(`users/${uid}/profile/animal`, L.a); await cloudApi.set(`users/${uid}/profile/look`, lookClean(L)); } catch (e) { /* nächstes Mal */ }
}
// nach der Anmeldung einmal: noch nie eingestellt → Figur aus dem Profil zeigen (Block 96c) – nur zum Anzeigen, nicht in den
// Spielstand: eine Änderung am Stand zählte als eigene Aktion und machte aus „anderes Gerät übernehmen“ einen Konflikt.
// In state.me landet sie erst, wenn man selbst etwas einstellt (setMe). Sonst Profil auffrischen.
let meProfileUid = null;
async function meProfileSync() {
  if (VISIT || !cloudUser || !cloudApi || meProfileUid === cloudUser.uid) return;
  const uid = meProfileUid = cloudUser.uid;
  if (state.me) { await mePushProfile(); return; }
  try {
    const [a, look] = await Promise.all([cloudApi.get(`users/${uid}/profile/animal`), cloudApi.get(`users/${uid}/profile/look`)]);
    if (!cloudUser || cloudUser.uid !== uid) return;
    if (!(Number.isInteger(a) && ANIMALS[a]) && !look) { if (!state.me) mePushProfile(); return; }   // nie eingestellt: Freunde sehen trotzdem dein Tier
    meProfileLook = { ...lookClean(look), a: Number.isInteger(a) && ANIMALS[a] ? a : meLook().a };
    meSig = null;
  } catch (e) { meProfileUid = null; }
}

// --- Figur auf der Insel -------------------------------------------------------------------------
const meFig = { me: true, fx: 0, fy: 0, tx: 0, ty: 0, px: 0, py: 0, t: 1, wait: 1, speed: 0.9, steps: 6, path: null, placed: false };
const meFigs = [];                                   // zum Zeichnen (render.js): leer, wenn ausgeblendet
let meSig = null, meState = null, meKnown = null, meNew = [], meScanAt = 0, meHelpAt = 0;
const meShown = () => !!(state && state.tiles && state.tiles.size && !meLook().off);
const ME_SIGHT = new Set(['bau', 'bildung', 'kultur', 'markt', 'wunder']);
const meSight = t => t.b !== 'weg' && t.b !== 'lm' && ITEMS[t.b] && ME_SIGHT.has(ITEMS[t.b].cat);
const ME_NEW_SAY = ['Oh, was Neues! ✨', 'Schön geworden!', 'Das gefällt mir!', 'Toll gebaut! 👏', 'Ein Prachtstück!'];
const ME_CHAT = () => [`Schön hier in ${state.town.name}!`, 'Was bauen wir als Nächstes?', 'Was für ein schöner Tag.', ...(PART_SAY[dayPart()] || [])];
const pickOne = list => list[Math.floor(Math.random() * list.length)];

function mePlace() {
  const h = townHallAt(), [x, y] = h ? guestSpawn(h[0], h[1]) : guestSpawn(ISLAND.cx, ISLAND.cy);
  Object.assign(meFig, { fx: x, fy: y, tx: x, ty: y, px: x, py: y, t: 1, wait: 1, path: null, steps: 4, gone: false, placed: true });
}
// was neu gebaut wurde, schaut sie sich an (höchstens die letzten 3)
function meScan(now) {
  if (now < meScanAt) return;
  meScanAt = now + 2000;
  const cur = new Set();
  for (const [k, t] of state.tiles) if (meSight(t)) cur.add(k);
  if (meKnown) for (const k of cur) if (!meKnown.has(k)) { meNew.push(k); if (meNew.length > 3) meNew.shift(); }
  meKnown = cur;
}
function meGo(goals, say = null) {
  if (!goals || !goals.length) return false;
  const p = walkPath(meFig.fx, meFig.fy, goals, 1500);
  if (!p) return false;
  meFig.path = p; meFig.say = say;
  return true;
}
function meNextGoal() {
  const f = meFig;
  f.steps = 5 + Math.floor(Math.random() * 8);
  while (meNew.length) { const k = meNew.shift(); if (state.tiles.has(k) && meGo(doorsOf(k), pickOne(ME_NEW_SAY))) return; }
  const h = townHallAt();
  if (h && Math.abs(f.fx - h[0] - 1) + Math.abs(f.fy - h[1] - 1) > 8 && Math.random() < 0.6 && meGo(doorsOf(h.join(',')))) return;
  if (Math.random() < 0.3) {                                             // ein Gebäude in der Nähe besuchen
    const near = [...state.tiles].filter(([k, t]) => { if (!meSight(t)) return false; const [x, y] = keyXY(k); return Math.abs(x - f.fx) + Math.abs(y - f.fy) <= 14; });
    if (near.length) meGo(doorsOf(pickOne(near)[0]));
  }
}
const meOnScreen = () => { const p = toScreen(meFig.px, meFig.py); return p.x > 40 && p.x < W - 40 && p.y > 100 && p.y < H - 120; };
function stepMe(dt, now = performance.now()) {
  meFigs.length = 0;
  meProfileSync();
  if (meState !== state) { meState = state; meKnown = null; meNew = []; meFig.placed = false; meSig = null; meHelpAt = now + 60e3; }
  if (!meShown()) { meFig.placed = false; if (bubble && bubble.w === meFig) bubble = null; return; }
  const sig = JSON.stringify(state.me);
  if (sig !== meSig) { meSig = sig; Object.assign(meFig, meFigLook()); }
  if (!meFig.placed || meFig.gone || !walkable(meFig.fx, meFig.fy, true)) mePlace();
  meFigs.push(meFig);
  meScan(now);
  meHelp(now);
  const f = meFig;
  if (!f.path) {                                                         // bummeln, dann ein neues Ziel
    stepMover(f, dt, walkable, true);
    if (f.gone) { mePlace(); return; }
    if (f.t === 0 && --f.steps <= 0) meNextGoal();
    return;
  }
  if (f.wait > 0) { f.wait -= dt; return; }
  f.t += dt * f.speed;
  if (f.t >= 1) {
    f.fx = f.tx; f.fy = f.ty; f.t = 0;
    const nx = f.path[0];
    if (!nx) { f.path = null; f.wait = 2; if (f.say && meOnScreen() && !bubble) speak(f, f.say); f.say = null; }
    else if (!walkable(nx[0], nx[1], true) || edgeBlocks(f.fx, f.fy, nx[0], nx[1])) f.path = null;   // inzwischen verbaut
    else if (!walkable(nx[0], nx[1])) { f.tx = f.fx; f.ty = f.fy; f.wait = 0.4; }                    // Schranke zu
    else { f.path.shift(); [f.tx, f.ty] = nx; }
  }
  f.px = f.fx + (f.tx - f.fx) * f.t;
  f.py = f.fy + (f.ty - f.fy) * f.t;
}
// angetippt? (wie walkerAt)
function meAt(sx, sy) {
  if (!meFigs.length) return false;
  const z = cam.z, [hx, hy] = walkerHead(meFig, z);
  return Math.hypot(sx - hx, sy - (hy + 6 * z)) < 4 + 8 * z;
}

// --- Helfer: was gerade dran ist ------------------------------------------------------------------
// fehlendes Material für die nächsten Laternen, das niemand herstellt
function meLack() {
  const opts = Object.keys(LM_STAGES).map(type => ({ type, info: restoreInfo(type) }))
    .filter(o => o.info.next && o.info.pos && ownedTile(o.info.pos[0], o.info.pos[1]));
  opts.sort((a, b) => a.info.stage - b.info.stage);
  for (const { type, info } of opts) for (const [r, need] of Object.entries(info.mat || {})) {
    if (!RES[r] || (state.res[r] || 0) >= need) continue;
    const made = (T.prod[r] || 0) + T.conv.filter(c => c.to === r).reduce((s, c) => s + c.rate, 0);
    if (made > 0) continue;
    const b = resShow(r);
    return { say: `Uns fehlt ${RES[r].icon} ${RES[r].name}!`, real: true,
      text: `Für <b>${LANDMARKS[type].name}</b> brauchen wir ${RES[r].icon} ${RES[r].name}, aber niemand stellt es her.${b ? ` Das macht <b>${ITEMS[b].name}</b> (${menuPath(b)}).` : ''}`,
      go: () => openLexikon('res:' + r), goLabel: '📚 Woher?' };
  }
  return null;
}
// häufigster offener Wunsch der Häuser
function meWish() {
  const miss = new Map();
  for (const [k, t] of state.tiles) {
    const s = T.st.get(k);
    if (t.b !== 'haus' || !s || !s.wish || !s.wish.next) continue;
    for (const w of s.wish.list) if (!w.ok && WISH_HELP[w.id]) miss.set(w.id, (miss.get(w.id) || 0) + 1);
  }
  const top = [...miss].sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const [id, n] = top, h = WISH_HELP[id];
  return { say: `${n > 1 ? n + ' Häuser wünschen' : 'Ein Haus wünscht'} sich: ${h.name}`, text: `<b>${h.name}</b>: ${h.text}`, real: true,
    go: () => openLexikon('wish:' + id), goLabel: '📚 Mehr dazu' };
}
function meTip() {
  if (state.tutorial >= 0 && TUTORIAL[state.tutorial]) {
    const s = TUTORIAL[state.tutorial];
    return { say: 'Ich helf dir gern! 🙂', text: `<b>${s.text}</b><br><small class="muted">${s.hint}</small>`, real: true };
  }
  const lack = meLack();
  if (lack) return lack;
  const n = readyList().ready.length;
  if (n) return { say: `✨ ${n === 1 ? 'Eins kann' : n + ' können'} ausgebaut werden!`, text: 'Im Rathaus unter „Zu tun“ siehst du alles, was du jetzt ausbauen kannst.', real: true,
    go: () => openTownHall('ready'), goLabel: '🏛️ Zeig mir' };
  return meWish() || { say: pickOne(ME_CHAT()), text: 'Alles läuft prima. Tipp mich an, wenn du nicht weiterweißt – ich sag dir, was gerade dran ist.' };
}
// ab und zu von selbst (alle 3–5 Minuten, nur wenn sie zu sehen ist und es etwas zu sagen gibt)
function meHelp(now) {
  if (now < meHelpAt) return;
  meHelpAt = now + 180e3 + Math.random() * 120e3;
  if (state.tipsOff || viewOnly() || bubble || !meOnScreen()) return;
  const t = meTip();
  if (t.real) speak(meFig, t.say, now);
}
function openMeInfo() {
  if (viewOnly()) { speak(meFig, VISIT ? `Willkommen in ${state.town.name}! 👋` : pickOne(ME_CHAT())); return; }
  const L = meLook(), tip = meTip();
  speak(meFig, tip.say);
  showPanel(`<h3>${ANIMALS[L.a].icon} ${escHtml(L.name || ME_NAME)}</h3>
    <p class="muted">Das bist du – ${ME_NAME} von ${escHtml(state.town.name)}.</p>
    <div class="status"><div>${tip.text}</div></div>
    <div class="row">${tip.go ? `<button class="btn" id="p-tip">${tip.goLabel}</button>` : ''}<button class="btn ghost" id="p-look">✏️ Aussehen</button><button class="btn ghost" id="p-close">Schließen</button></div>`);
  if ($('p-tip')) $('p-tip').onclick = () => { closePanel(); tip.go(); };
  $('p-look').onclick = () => { closePanel(); openYou('figur'); };
  $('p-close').onclick = closePanel;
}

// --- Fenster „Du“ (Block 98): Figur, Erfolge, Album, Tagebuch, Freunde, Online – Knopf oben mit deinem Gesicht ---------
// Album, Tagebuch, Freunde und Online sind eigene Fenster; sie setzen youHead(tab) oben ein, damit alle Reiter gleich aussehen.
const YOU_TABS = [['figur', '🐾 Figur'], ['erfolge', '⭐ Erfolge'], ['album', '📒 Album'], ['tagebuch', '📖 Tagebuch'], ['freunde', '👥 Freunde'], ['online', '☁️ Online']];
let youTab = 'figur';
function youMark(id) {
  if (id === 'tagebuch' && state.diarySeen < state.diary.length) return ' <span class="tdot" aria-label="neue Seite"></span>';
  if (id === 'freunde' && cloudUser && (mailWaiting() || bookNew())) return ' 📬';
  if (id === 'online' && cloudState === 'konflikt') return ' ⚠️';
  return '';
}
// etwas Neues für dich? (Punkt am Knopf oben)
const youNews = () => state.diarySeen < state.diary.length || (!!cloudUser && (mailWaiting() || bookNew())) || cloudState === 'konflikt';
function youHead(tab) {
  youTab = tab;
  const L = meLook();
  return `<h2>${ANIMALS[L.a].icon} ${escHtml(L.name || 'Du')}</h2>
    <div class="looks hall-tabs you-tabs">${YOU_TABS.map(([id, label]) => `<button class="look${id === tab ? ' on' : ''}" data-you="${id}">${label}${youMark(id)}</button>`).join('')}</div>`;
}
function openYou(tab = youTab) {
  youTab = tab;
  if (tab === 'album') return openAlbum();
  if (tab === 'tagebuch') return openDiary();
  if (tab === 'freunde') return openFriends();                          // (async: wartet auf Freundescode)
  if (tab === 'online') return openCloud();
  if (tab !== 'erfolge') tab = youTab = 'figur';
  openModal(`${youHead(tab)}${tab === 'erfolge' ? erfolgeHtml() : meHallHtml()}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Fertig</button></div>`, tab === 'erfolge' ? () => openYou('erfolge') : null);
  $('modal-card').classList.add('hall');
  if (tab === 'figur') wireMeHall($('modal-card'));
  $('m-close').onclick = closeModal;
}
// Reiter: ein Griff für alle Unterfenster
$('modal-card').addEventListener('click', e => { const b = e.target.closest('[data-you]'); if (b) { sfx('deco'); openYou(b.dataset.you); } });
$('you-btn').onclick = () => { setTool('look'); openYou(state.diarySeen < state.diary.length ? 'tagebuch' : youTab); };
fastTap($('you-btn'));                                                    // iPad: beim Loslassen auslösen wie die anderen Knöpfe oben

// --- „Du“ → Figur ----------------------------------------------------------------------------------
function meHallHtml() {
  const L = meLook(), on = (cond) => cond ? ' on' : '';
  const lockInfo = slot => {                                               // unter der Reihe: wofür es das angetippte Teil gibt
    const id = meLockOpen;
    if (!id || !WEAR[slot][id] || wearOk(id)) return '';
    const p = wearProgress(id);
    return `<div class="wear-lock"><b>🔒 ${WEAR[slot][id]}</b> gibt es für ${WEAR_NEED[id].bond ? '' : 'den Erfolg '}<b>${wearNeedText(id)}</b>.
      <div class="bar"><i style="width:${Math.min(100, p.have / p.need * 100)}%"></i></div><small>Du hast: ${p.text}</small>
      <div class="row"><button class="btn ghost small" data-mego="${WEAR_NEED[id].bond ? 'freunde' : 'erfolge'}">${WEAR_NEED[id].bond ? '👥 Zu den Freunden' : '⭐ Zu den Erfolgen'}</button></div></div>`;
  };
  const wearBtns = (slot, none) => `<div class="looks"><button class="look${on(!L[slot])}" data-mew="${slot}:">${none}</button>${Object.entries(WEAR[slot]).map(([id, n]) => wearOk(id)
    ? `<button class="look${on(L[slot] === id)}" data-mew="${slot}:${id}">${n}</button>`
    : `<button class="look locked${on(meLockOpen === id)}" data-mewlock="${id}" aria-label="${n} – gesperrt, antippen: wofür es das gibt">🔒 ${n}</button>`).join('')}</div>${lockInfo(slot)}`;
  return `
    <div class="fig-edit me-edit"><canvas id="me-prev" width="120" height="150" aria-hidden="true"></canvas><div>
      <label class="label" for="me-name">Name auf dem Schild</label>
      <input id="me-name" class="cloud-mail" maxlength="20" placeholder="${ME_NAME}" value="${escHtml(L.name)}" autocomplete="off">
      <div class="looks"><button class="look${on(!L.off)}" id="me-on" aria-pressed="${!L.off}">${L.off ? 'Bleibt im Rathaus' : '✓ Läuft auf der Insel herum'}</button></div>
      <p class="muted">Tipp sie auf der Insel an: Sie sagt dir, was gerade dran ist. Bei Freunden siehst du genauso aus.</p>
    </div></div>
    <div class="label">Tier</div>
    <div class="book-st">${ANIMALS.map((a, i) => `<button class="look${on(i === L.a)}" data-mea="${i}" aria-label="${a.family}">${a.icon}</button>`).join('')}</div>
    <div class="label">Fell</div>
    <div class="swatches fig-sw"><button class="sw bunt${on(L.fur == null)}" data-mefur="" aria-label="Fell wie das Tier"></button>${FUR.map((c, i) => `<button class="sw${on(L.fur === i)}" data-mefur="${i}" style="background:${c}" aria-label="Fell ${i + 1}"></button>`).join('')}</div>
    <div class="label">Shirt</div>
    <div class="swatches fig-sw">${SHIRTS.map((c, i) => `<button class="sw${on(L.shirt === i)}" data-meshirt="${i}" style="background:${c}" aria-label="Shirt ${i + 1}"></button>`).join('')}</div>
    ${WEAR_SLOTS.map(([slot, label]) => `<div class="label">${label}</div>${wearBtns(slot, 'ohne')}`).join('')}
    <p class="muted">🔒 Gesperrtes gibt es für Erfolge – antippen zeigt, wofür und wie weit du bist.</p>`;
}
function wireMeHall(card) {
  const redo = () => openYou('figur');
  const cv = card.querySelector('#me-prev');
  if (cv) figPreview(cv, meFigLook(), 4.2);
  for (const b of card.querySelectorAll('[data-mea]')) b.onclick = () => { setMe({ a: +b.dataset.mea }); sfx('deco'); redo(); };
  for (const b of card.querySelectorAll('[data-mefur]')) b.onclick = () => { setMe({ fur: b.dataset.mefur === '' ? null : +b.dataset.mefur }); sfx('deco'); redo(); };
  for (const b of card.querySelectorAll('[data-meshirt]')) b.onclick = () => { setMe({ shirt: +b.dataset.meshirt }); sfx('deco'); redo(); };
  for (const b of card.querySelectorAll('[data-mew]')) b.onclick = () => {
    const [slot, id] = b.dataset.mew.split(':');
    if (id && !wearOk(id)) return;
    setMe({ [slot]: id || null }); sfx('deco'); redo();
  };
  for (const b of card.querySelectorAll('[data-mewlock]')) b.onclick = () => { meLockOpen = meLockOpen === b.dataset.mewlock ? null : b.dataset.mewlock; redo(); };
  for (const b of card.querySelectorAll('[data-mego]')) b.onclick = () => { meLockOpen = null; openYou(b.dataset.mego); };
  const on = card.querySelector('#me-on');
  if (on) on.onclick = () => { setMe({ off: !meLook().off }); redo(); };
  const nm = card.querySelector('#me-name');
  if (nm) nm.onchange = () => { setMe({ name: nm.value.trim().slice(0, 20) }); if (cv) figPreview(cv, meFigLook(), 4.2); };
}
