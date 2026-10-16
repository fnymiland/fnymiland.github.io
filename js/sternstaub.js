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

// --- Anzeige ---
const SD_SOURCES = [
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
