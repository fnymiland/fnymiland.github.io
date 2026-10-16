'use strict';
// ---------------------------------------------------------------------------
// ✨ Sternstaub (Block 161, PLAN-161.md, Nutzer 16.10.2026): die seltene Zweitwährung – nur für Schönes (Sternenbasar, Katalog).
// Kommt durchs Spielen: Erfolgsstufen, volle Albumseiten, Sternschnuppen, Tageswunsch, Truhen ferner Inseln, das Laternenfest,
// Parkfest und Parade. Dazu die Schatzkammer: Taler → Sternstaub zum Tageskurs (das erste ✨ des Tages 20 Mio, jedes weitere am
// selben Tag 10 % mehr, um Mitternacht wieder von vorn – nie unbezahlbar, aber an einem Tag nicht beliebig viel).
// Jede einmalige Gutschrift hat einen Schlüssel in state.sdGot: nie doppelt, und was vor Block 161 erreicht war, zahlt sdCheck(true)
// beim Laden still nach (Fenster „Sternstaub ist da“)
// ---------------------------------------------------------------------------
const SD = { tier: 10, album: 50, fest: 150, chest: 10, star: 2, starRare: 10, starRareP: 0.1, feier: 3, wish: 25 };
const SD_TREASURY = { first: 20e6, step: 1.1 };
const sdDay = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();   // lokaler Kalendertag JJJJMMTT

// Gutschrift; key: einmalig (Erfolgsstufe, Albumseite …). Gibt zurück, wie viel dazukam
function sdAdd(n, key = null) {
  if (!(n > 0) || !state) return 0;
  if (!state.sdGot) state.sdGot = new Set();
  if (key) { if (state.sdGot.has(key)) return 0; state.sdGot.add(key); }
  state.stardust = (state.stardust || 0) + n;
  return n;
}
const sdAlbumFull = p => albumKeys(p).every(k => state.album.has(k) || LATE_ALBUM.has(k));   // wie die Album-Belohnung (collectAlbum)
// Einmaliges prüfen und gutschreiben: Erfolgsstufen (10 ✨ × Stufe), volle Albumseiten (50), Laternenfest (150).
// silent (Laden): ohne Meldung, gibt die Summe zurück – für die Nachzahlung
function sdCheck(silent = false) {
  if (!state || !state.achieved) return 0;
  let sum = 0;
  const give = (n, key, why) => { const got = sdAdd(n, key); if (got && !silent) toast(`✨ +${fmt(got)} Sternstaub – ${why}`); sum += got; };
  for (const a of ACHIEVEMENTS) for (let t = 1; t <= (state.achieved[a.id] || 0); t++) give(SD.tier * t, `a:${a.id}:${t}`, `Erfolg „${a.name}“ Stufe ${t}`);
  if (state.album) for (const p of ALBUM) if (sdAlbumFull(p)) give(SD.album, 'album:' + p.id, `Albumseite „${p.name}“ voll`);
  if (state.festival) give(SD.fest, 'fest', 'das Laternenfest');
  return sum;
}
// Sternschnuppe (story.js collectStarAt): ein wenig Sternstaub, manchmal mehr
const sdStar = (rnd = Math.random) => sdAdd(rnd() < SD.starRareP ? SD.starRare : SD.star);

// --- Schatzkammer: Tageskurs ---
// Heute gekauft: { day, n }; ein neuer Tag fängt von vorn an (nur vorwärts – Uhr zurückdrehen bringt nichts)
function sdTreasury(today = sdDay()) {
  const t = state.treasury && Number.isInteger(state.treasury.day) ? state.treasury : { day: today, n: 0 };
  if (today > t.day) return { day: today, n: 0 };
  return { day: t.day, n: Math.max(0, t.n | 0) };
}
const sdPrice = n => Math.round(SD_TREASURY.first * Math.pow(SD_TREASURY.step, n) / 1e5) * 1e5;   // das (n+1)-te ✨ des Tages
const sdPriceOf = (count, from = sdTreasury().n) => { let s = 0; for (let i = 0; i < count; i++) s += sdPrice(from + i); return s; };
// count ✨ kaufen (alle oder keins); gibt die Zahl zurück
function sdBuy(count = 1, today = sdDay()) {
  if (typeof viewOnly === 'function' && viewOnly()) { if (typeof cloudBlocked === 'function') cloudBlocked(); return 0; }
  const t = sdTreasury(today), cost = sdPriceOf(count, t.n);
  if (!(count >= 1) || state.money < cost) { fail('Zu wenig Taler'); return 0; }
  state.money -= cost;
  state.treasury = { day: t.day, n: t.n + count };
  sdAdd(count);
  if (typeof cloudTouched === 'function') cloudTouched();                 // eigene Aktion (läuft nicht über ↶: Taler kämen sonst zurück)
  sfx('star'); save();
  return count;
}

// --- 💭 Tageswunsch: jeden Tag (echte Uhr) wünscht sich ein Bewohner etwas Kleines; erfüllt → 25 ✨, verpasst → nichts (kein Druck).
// Gezählt wird ab dem Stand beim Erscheinen (base), damit Vorhandenes nicht schon zählt. Nur Wünsche, die man bauen kann (available).
// Die Wahl hängt am Kalendertag und am Spielstand (seed): auf jedem Gerät derselbe Wunsch
const sdNearWater = (x, y) => [[0, 0], ...DIRS].some(([dx, dy]) => terrainAt(x + dx, y + dy) === 'water');
function sdCount(bs, where = null) {                                       // kleine Deko (Ecken) und Deko-Felder mit Grundmodell aus bs
  const set = new Set(bs);
  let n = 0;
  for (const [k, ds] of state.decos) for (const d of ds) if (d && set.has(baseOf(d.b)) && (!where || where(...keyXY(k)))) n++;
  for (const [k, t] of state.tiles) if (set.has(baseOf(t.b)) && (!where || where(...keyXY(k)))) n++;
  return n;
}
const TW_LIST = [
  { id: 'bank', need: 3, items: ['bank'], text: n => `${n} Bänke am Wasser`, count: () => sdCount(['bank'], sdNearWater) },
  { id: 'baum', need: 6, items: ['baum'], text: n => `${n} neue Bäume`, count: () => sdCount(['baum']) },
  { id: 'blumen', need: 4, items: ['blumen', 'blumentopf'], text: n => `${n} Blumen – Beet oder Topf`, count: () => sdCount(['blumen', 'blumentopf']) },
  { id: 'busch', need: 6, items: ['busch'], text: n => `${n} Büsche`, count: () => sdCount(['busch']) },
  { id: 'laterne', need: 4, items: ['laterne', 'strassenlaterne'], text: n => `${n} Laternen für die Abende`, count: () => sdCount(['laterne', 'strassenlaterne']) },
  { id: 'brunnen', need: 1, items: ['brunnen'], text: () => 'einen Brunnen zum Plaudern', count: () => sdCount(['brunnen', 'kristallbrunnen']) },
  { id: 'hecke', need: 6, items: ['hecke'], text: n => `${n} Stück Hecke`, count: () => [...state.edges.values()].filter(e => e.b === 'hecke').length },
  { id: 'zaun', need: 6, items: ['zaun'], text: n => `${n} Stück Zaun`, count: () => [...state.edges.values()].filter(e => e.b === 'zaun').length },
  { id: 'park', need: 6, items: ['parkrasen'], text: n => `${n} Felder Parkrasen`, count: () => [...state.terra.values()].filter(v => v === 'park').length },
  { id: 'weg', need: 10, items: ['weg'], text: n => `${n} Felder neuen Weg`, count: () => [...state.tiles.values()].filter(t => t.b === 'weg').length },
  { id: 'haus3', need: 1, items: ['haus'], text: () => 'noch ein Haus auf Stufe 3', count: () => [...state.tiles.values()].filter(t => t.b === 'haus' && t.lvl >= 3).length },
  { id: 'pavillon', need: 1, items: ['pavillon'], text: () => 'einen Pavillon', count: () => sdCount(['pavillon']) },
];
const TW_BY_ID = Object.fromEntries(TW_LIST.map(w => [w.id, w]));
const sdHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function sdWho(seed) {                                                    // ein Bewohner mit Namen (sonst „Jemand“)
  const hs = [...state.tiles.values()].filter(t => t.animal && t.name);
  if (!hs.length) return { name: 'Jemand', icon: '💭' };
  const t = hs[seed % hs.length], a = ANIMALS.find(q => q.id === t.animal);
  return { name: t.name, icon: a ? a.icon : '💭' };
}
// Der Wunsch von heute (neu am neuen Tag, nur vorwärts); null: noch nichts Passendes baubar
function twToday(today = sdDay()) {
  const w = state.dayWish;
  if (w && TW_BY_ID[w.id] && today <= w.day) return w;
  const can = TW_LIST.filter(d => d.items.some(b => ITEMS[b] && available(b)));
  if (!can.length) return null;
  const h = sdHash(today + ':' + state.seed), d = can[h % can.length], who = sdWho(h >>> 8);
  state.dayWish = { day: today, id: d.id, base: d.count(), done: false, who: who.name, icon: who.icon };
  if (state.sdSeen) toast(`💭 Tageswunsch: ${who.icon} ${who.name} hätte gern ${d.text(d.need)} (✨ ${SD.wish})`);
  return state.dayWish;
}
const twGot = w => Math.max(0, TW_BY_ID[w.id].count() - w.base);
let twAt = 0;
function twTick(now = Date.now(), today = sdDay()) {                    // aus der Spielschleife, höchstens alle 3 s
  if (now - twAt < 3000 || (typeof viewOnly === 'function' && viewOnly())) return;
  twAt = now;
  const w = twToday(today);
  if (!w || w.done) return;
  const d = TW_BY_ID[w.id];
  if (twGot(w) < d.need) return;
  w.done = true;
  sdAdd(SD.wish, 'wish:' + w.day);
  confettiBurst(); sfx('star');
  toast(`💭 ${w.icon} ${w.who} freut sich: ${d.text(d.need)} – ✨ +${SD.wish} Sternstaub`);
  save();
}
function twHtml() {
  const w = state.dayWish && TW_BY_ID[state.dayWish.id] ? state.dayWish : null;
  if (!w) return '';
  const d = TW_BY_ID[w.id], got = Math.min(d.need, twGot(w));
  return `<h4>💭 Tageswunsch</h4><div class="sd-wish${w.done ? ' done' : ''}"><span>${w.icon} <b>${escHtml(w.who)}</b> hätte gern ${d.text(d.need)}.</span>
    <b>${w.done ? '✓ erfüllt – morgen kommt ein neuer' : `${got}/${d.need} · ✨ ${SD.wish}`}</b></div>`;
}

// --- Anzeige ---
const SD_SOURCES = [
  ['💭', 'Tageswunsch erfüllen', `${SD.wish} ✨ am Tag`],
  ['🏆', 'Erfolg: jede neue Stufe', `${SD.tier} ✨ × Stufe`],
  ['📒', 'Album: jede volle Seite', `${SD.album} ✨`],
  ['🌠', 'Sternschnuppe (Sternwarte)', `${SD.star} ✨, manchmal ${SD.starRare}`],
  ['🎁', 'Truhe einer fernen Insel', `${SD.chest} ✨ × Nummer der Insel`],
  ['🎉', 'Parkfest und Parade', `je ${SD.feier} ✨`],
  ['🏮', 'das Laternenfest', `${SD.fest} ✨`],
];
function sdHtml(today = sdDay()) {
  const t = sdTreasury(today), p1 = sdPrice(t.n), p5 = sdPriceOf(5, t.n);
  return `<h2>✨ Sternstaub</h2>
    <p>Du hast <b class="sd-have">✨ ${fmt(state.stardust || 0)}</b> Sternstaub. Er ist selten – damit schaltest du besondere, schöne Dinge frei
      (bald im Sternenbasar).</p>
    ${twHtml()}
    <h4>So bekommst du ihn</h4>
    <div class="sd-src">${SD_SOURCES.map(([i, a, b]) => `<div><span>${i} ${a}</span><b>${b}</b></div>`).join('')}</div>
    <h4>🏛️ Schatzkammer</h4>
    <p class="muted">Taler gegen Sternstaub, zum Tageskurs: das erste ✨ des Tages kostet ${fmt(SD_TREASURY.first)}, jedes weitere am selben Tag
      etwas mehr. Um Mitternacht fängt der Kurs wieder von vorn an.${t.n ? ` Heute schon getauscht: ✨ ${t.n}.` : ''}</p>
    <div class="row"><button class="btn" id="sd-buy1"${state.money < p1 ? ' disabled' : ''}>✨ 1 für 🪙 ${fmt(p1)}</button>
      <button class="btn" id="sd-buy5"${state.money < p5 ? ' disabled' : ''}>✨ 5 für 🪙 ${fmt(p5)}</button></div>
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`;
}
function openStardust() {
  if (!state.sdSeen) { state.sdSeen = true; save(); }
  openModal(sdHtml());
  const wire = () => {
    for (const [id, n] of [['sd-buy1', 1], ['sd-buy5', 5]]) { const b = $(id); if (b) b.onclick = () => { if (sdBuy(n)) { toast(`✨ +${n} Sternstaub aus der Schatzkammer`); openStardust(); } }; }
    $('m-close').onclick = closeModal;
  };
  wire();
}
// Nachzahlung beim ersten Laden mit Block 161 (afterLoad): einmal, sobald kein anderes Fenster offen ist
function sdWelcome(n) {
  if (state.sdSeen || !(n > 0)) return;
  const tryShow = () => {
    if (state.sdSeen) return;
    if (!$('modal').hidden) { setTimeout(tryShow, 1500); return; }
    state.sdSeen = true; save();
    openModal(`<h2>✨ Sternstaub ist da!</h2>
      <p>Neu auf deiner Insel: <b>Sternstaub</b> – selten und kostbar. Damit schaltest du bald besondere, schöne Dinge frei.</p>
      <p>Für alles, was du schon geschafft hast – Erfolge, volle Albumseiten${state.festival ? ', das Laternenfest' : ''} –, bekommst du
        <b>✨ ${fmt(n)}</b> gutgeschrieben.</p>
      <p class="muted">Tipp oben auf ✨, um zu sehen, wie du mehr bekommst. In der Schatzkammer kannst du auch Taler eintauschen.</p>
      <div class="row"><button class="btn" id="m-close" style="flex:1">Schön!</button></div>`);
    $('m-close').onclick = closeModal;
  };
  setTimeout(tryShow, 3200);
}
function sdHud() {
  const b = $('sd-btn');
  if (!b) return;
  const show = !!state && (state.sdSeen || (state.stardust || 0) > 0);
  if (b.hidden === show) b.hidden = !show;
  if (show) setText($('sd'), fmt(state.stardust || 0));
}
if (typeof document !== 'undefined' && $('sd-btn')) $('sd-btn').onclick = () => { if (typeof setTool === 'function') setTool('look'); openStardust(); };
