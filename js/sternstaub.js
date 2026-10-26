'use strict';
// ---------------------------------------------------------------------------
// ✨ Sternstaub (Block 161, PLAN-161.md, Nutzer 16.10.2026): die seltene Zweitwährung – nur für Schönes (Sternenbasar, Katalog).
// Kommt durchs Spielen: Erfolgsstufen, volle Albumseiten, Sternschnuppen, Tageswunsch, Truhen ferner Inseln, das Laternenfest,
// Parkfest und Parade. Dazu die Schatzkammer: Taler → Sternstaub zum Tageskurs (das erste ✨ des Tages 20 Mio, jedes weitere am
// selben Tag 10 % mehr, um Mitternacht wieder von vorn – nie unbezahlbar, aber an einem Tag nicht beliebig viel).
// Jede einmalige Gutschrift hat einen Schlüssel in state.sdGot: nie doppelt, und was vor Block 161 erreicht war, zahlt sdCheck(true)
// beim Laden still nach (Fenster „Sternstaub ist da“)
// ---------------------------------------------------------------------------
const SD = { tier: 10, album: 50, fest: 150, chest: 10, star: 2, starRare: 10, starRareP: 0.1, feier: 3, wish: 25, backMax: 300 };   // backMax: Nachzahlung höchstens (Nutzer: nicht alles sofort)
const SD_TREASURY = { first: 20e6, step: 1.1 };
const sdDay = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();   // lokaler Kalendertag JJJJMMTT

// Gutschrift; key: einmalig (Erfolgsstufe, Albumseite …). Gibt zurück, wie viel dazukam
function sdAdd(n, key = null, touch = true) {          // touch: als eigene Änderung für die Cloud zählen (die stille Nachzahlung nicht)
  if (!(n > 0) || !state) return 0;
  if (!state.sdGot) state.sdGot = new Set();
  if (key) { if (state.sdGot.has(key)) return 0; state.sdGot.add(key); }
  state.stardust = (state.stardust || 0) + n;
  if (typeof statCount === 'function') statCount('sdTotal', n);          // Erfolg „Sternstaub gesammelt“
  if (touch && typeof cloudTouched === 'function') cloudTouched();
  return n;
}
const sdAlbumFull = p => albumKeys(p).every(k => state.album.has(k) || LATE_ALBUM.has(k));   // wie die Album-Belohnung (collectAlbum)
// Einmaliges prüfen und gutschreiben: Erfolgsstufen (10 ✨ × Stufe), volle Albumseiten (50), Laternenfest (150).
// silent (Laden): ohne Meldung, gibt die Summe zurück – für die Nachzahlung
function sdCheck(silent = false) {
  if (!state || !state.achieved) return 0;
  let sum = 0;
  const give = (n, key, why) => { const got = sdAdd(n, key, !silent); if (got && !silent) toast(`✨ +${fmt(got)} Sternstaub: ${why}`); sum += got; };
  for (const a of ACHIEVEMENTS) for (let t = 1; t <= (state.achieved[a.id] || 0); t++) give(SD.tier * t, `a:${a.id}:${t}`, `Erfolg „${a.name}“ Stufe ${t}`);
  if (state.album) for (const p of ALBUM) if (sdAlbumFull(p)) give(SD.album, 'album:' + p.id, `Albumseite „${p.name}“ voll`);
  if (state.festival) give(SD.fest, 'fest', 'das Laternenfest');
  return sum;
}
// Beim Laden (afterLoad): Erreichtes still gutschreiben – beim ersten Mal (noch nie Sternstaub gesehen) höchstens SD.backMax, damit der
// Basar nicht am ersten Tag leer gekauft ist (Nutzer 17.10.2026); die Schlüssel zählen trotzdem als bezahlt
function sdBackPay() {
  let back = sdCheck(true);
  if (!state.sdSeen && back > SD.backMax) { state.stardust -= back - SD.backMax; back = SD.backMax; }
  return back;
}
// Sternschnuppe (story.js collectStarAt): ein wenig Sternstaub, manchmal mehr
const sdStar = (rnd = Math.random) => sdAdd(rnd() < SD.starRareP ? SD.starRare : SD.star);

// --- Schatzkammer: Tageskurs ---
// Heute gekauft: { day, n }; ein neuer Tag fängt von vorn an (nur vorwärts – Uhr zurückdrehen bringt nichts)
function sdTreasury(today = sdDay()) {
  const t = state.treasury && Number.isInteger(state.treasury.day) ? state.treasury : { day: today, n: 0 };
  if (today > t.day || sdFuture(t.day, today)) return { day: today, n: 0 };
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
  { id: 'blumen', need: 4, items: ['blumen', 'blumentopf'], text: n => `${n} Blumen, im Beet oder im Topf`, count: () => sdCount(['blumen', 'blumentopf']) },
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
  if (w && TW_BY_ID[w.id] && today <= w.day && !sdFuture(w.day, today)) return w;
  const can = TW_LIST.filter(d => d.items.some(b => ITEMS[b] && available(b)));
  if (!can.length) return null;
  const h = sdHash(today + ':' + state.seed), d = can[h % can.length], who = sdWho(h >>> 8);
  state.dayWish = { day: today, id: d.id, base: d.count(), done: false, who: who.name, icon: who.icon };
  if (state.sdSeen) toast(`💭 Tageswunsch: ${who.icon} ${who.name} hätte gern ${d.text(d.need)} (✨ ${SD.wish})`);
  return state.dayWish;
}
const twGot = w => Math.max(0, TW_BY_ID[w.id].count() - w.base);
// ↶ nach dem Erfüllen (Prüfung 19.10.: sonst blieb der Sternstaub, die Taler kamen zurück): Wunsch wieder offen, die ✨ zurück
function twUndo(today = sdDay()) {
  const w = state.dayWish;
  if (!w || !w.done || w.day !== today || !TW_BY_ID[w.id] || twGot(w) >= TW_BY_ID[w.id].need) return 0;
  w.done = false;
  if (state.sdGot) state.sdGot.delete('wish:' + w.day);
  const back = Math.min(SD.wish, state.stardust || 0);
  state.stardust = (state.stardust || 0) - back;
  toast(`💭 Tageswunsch wieder offen${back ? ` (✨ −${back})` : ''}`);
  return back;
}
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
  toast(`💭 ${w.icon} ${w.who} freut sich: ${d.text(d.need)}. ✨ +${SD.wish} Sternstaub`);
  save();
}
function twHtml() {
  const w = state.dayWish && TW_BY_ID[state.dayWish.id] ? state.dayWish : null;
  if (!w) return '';
  const d = TW_BY_ID[w.id], got = Math.min(d.need, twGot(w));
  return `<h4>💭 Tageswunsch</h4><div class="sd-wish${w.done ? ' done' : ''}"><span>${w.icon} <b>${escHtml(w.who)}</b> hätte gern ${d.text(d.need)}.</span>
    <b>${w.done ? '✓ erfüllt, morgen kommt ein neuer' : `${got}/${d.need} · ✨ ${SD.wish}`}</b></div>`;
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
    <p>Du hast <b class="sd-have">✨ ${fmt(state.stardust || 0)}</b> Sternstaub. Er ist selten. Damit schaltest du besondere, schöne Dinge frei
      im ⛺ Sternenbasar (Einrichtungen) und die ✦ Meisterstücke der 🎨 Kunstakademie.</p>
    ${twHtml()}
    <h4>So bekommst du ihn</h4>
    <div class="sd-src">${SD_SOURCES.map(([i, a, b]) => `<div><span>${i} ${a}</span><b>${b}</b></div>`).join('')}</div>
    <h4>🏛️ Schatzkammer</h4>
    <p class="muted">Taler gegen Sternstaub, zum Tageskurs: das erste ✨ des Tages kostet ${fmt(SD_TREASURY.first)}, jedes weitere am selben Tag
      etwas mehr. Um Mitternacht fängt der Kurs wieder von vorn an.${t.n ? ` Heute schon getauscht: ✨ ${t.n}.` : ''}</p>
    <div class="row"><button class="btn" id="sd-buy1"${state.money < p1 ? ' disabled' : ''}>✨ 1 für 🪙 ${fmt(p1)}</button>
      <button class="btn" id="sd-buy5"${state.money < p5 ? ' disabled' : ''}>✨ 5 für 🪙 ${fmt(p5)}</button></div>
    <div class="row">${[...state.tiles.values()].some(t => t.b === 'sternenbasar') ? '<button class="btn" id="sd-basar" style="flex:1">⛺ Zum Sternenbasar</button>' : ''}<button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`;
}
function openStardust() {
  if (!state.sdSeen) { state.sdSeen = true; save(); }
  openModal(sdHtml());
  const wire = () => {
    for (const [id, n] of [['sd-buy1', 1], ['sd-buy5', 5]]) { const b = $(id); if (b) b.onclick = () => { if (sdBuy(n)) { toast(`✨ +${n} Sternstaub aus der Schatzkammer`); openStardust(); } }; }
    if ($('sd-basar')) $('sd-basar').onclick = () => openBasar();
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
      <p>Neu auf deiner Insel: <b>Sternstaub</b>, selten und kostbar. Damit schaltest du bald besondere, schöne Dinge frei.</p>
      <p>Für alles, was du schon geschafft hast (Erfolge, volle Albumseiten${state.festival ? ', das Laternenfest' : ''}), bekommst du
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
  if (show) setText($('sd'), typeof hudNum === 'function' ? hudNum(state.stardust || 0) : fmt(state.stardust || 0));   // kurz wie die anderen Zahlen oben
}
if (typeof document !== 'undefined' && $('sd-btn')) $('sd-btn').onclick = () => { if (typeof setTool === 'function') setTool('look'); openStardust(); };

// ---------------------------------------------------------------------------
// ⛺ Sternenbasar (Block 161c, Entwurf A „Sternenzelt“ gewählt 17.10.2026, tools/basar-entwurf.js): rundes Zelt (2×2), nachtblau/creme
// gestreift, goldene Sterne, Wimpelkranz mit Lichterkette, Mast mit Stern-Wimpel, vorn ein Eingang mit Vorhang und Tresen voller
// Sternstaub-Gläser. Antippen öffnet den Basar: jeden Tag 4 Angebote (3 normale, 1 seltenes; gleicher Tag = gleiche Angebote,
// Ungekauftes zuerst), dazu ein fester Katalog. Gekauftes bleibt frei (state.sdItems) und steht im Baumenü (ITEMS[…].sdShop)
// ---------------------------------------------------------------------------
const BASAR = { gold: '#f5c84b', goldD: '#c9962a', blue: '#2f3b7a', cream: '#f7efe0', pink: '#e86f8f' };
const sdStarPts = (x, y, r, rot = -Math.PI / 2) => Array.from({ length: 10 }, (_, i) => { const a = rot + i * Math.PI / 5, rr = i & 1 ? r * 0.45 : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });
function sdStarDraw(p, r, col, edge = null) {
  const pts = sdStarPts(p[0], p[1], r);
  poly(pts, C(col));
  if (edge && r > 1.2) { g.strokeStyle = C(edge); g.lineWidth = Math.max(0.5, r * 0.12); g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke(); }
}
BIG_ART.sternenbasar = (cx, cy, z, now, x, y, lvl, t) => {
  const K = kit(cx, cy, z, t.rot), lit = night > 0.15 && isLive(), N = 12, R = 0.78, H = 15, RH = 30, fern = z < 0.6;
  if (groundPart(() => { K.oval(0, 0, 0.98, 'rgba(60,40,30,0.16)'); K.rect(0.62, -0.22, 0.98, 0.22, C('#e8dcc4')); })) return;   // Schatten, Teppich vor dem Eingang
  const ring = (r, up) => Array.from({ length: N }, (_, i) => { const th = (i + 0.5) / N * Math.PI * 2; return { a: Math.cos(th) * r, b: Math.sin(th) * r, up }; });
  const lo = ring(R, 0), eave = ring(R * 1.1, H - 1), apex = K.P(0, 0, H + RH);
  const segs = lo.map((p, i) => { const q = lo[(i + 1) % N], m = [(p.a + q.a) / 2, (p.b + q.b) / 2]; return { i, p, q, m, d: K.depth(...m), vis: K.facing(...m) > 0 }; });
  // Wände: nur die sichtbaren, hinten zuerst
  for (const s of segs.filter(s => s.vis).sort((u, v) => u.d - v.d)) {
    const col = s.i & 1 ? BASAR.cream : BASAR.blue, P0 = K.P(s.p.a, s.p.b, 0), Q0 = K.P(s.q.a, s.q.b, 0), sh = K.turn(s.m[0], s.m[1])[0] > 0.3 ? LIGHT.side * 0.6 : 0;
    poly([P0, Q0, [Q0[0], Q0[1] - H * z], [P0[0], P0[1] - H * z]], C(shade(col, sh)));
  }
  // Eingang über die beiden vorderen Bahnen (a > 0, ±0,45 rad): warmes Inneres, gerafftes Vorhang-Paar, Tresen mit Sternstaub-Gläsern
  if (K.facing(1, 0) > 0) {
    const pt = (th, up) => K.P(Math.cos(th) * R * 1.01, Math.sin(th) * R * 1.01, up), A0 = -0.45, A1 = 0.45, ths = [0, 1, 2, 3, 4].map(k => A0 + (A1 - A0) * k / 4);
    const arch = th => H * (0.62 + 0.3 * Math.cos((th / A1) * Math.PI / 2));
    const inner = [...ths.map(th => pt(th, 0)), ...ths.slice().reverse().map(th => pt(th, arch(th)))];
    poly(inner, lit ? '#ffd27a' : C('#ffe9b8'));
    if (lit) glowQuad([pt(A0, 0), pt(A1, 0), pt(A1, H * 0.7), pt(A0, H * 0.7)], 26 * z);
    poly([pt(A0, 0), pt(A0 + 0.16, 0), pt(0, H * 0.92), pt(A0, arch(A0))], C(shade(BASAR.pink, -0.06)));   // Vorhang links, gerafft
    poly([pt(A1, 0), pt(A1 - 0.16, 0), pt(0, H * 0.92), pt(A1, arch(A1))], C(BASAR.pink));               // Vorhang rechts
    if (!fern) {
      const T0 = pt(-0.2, 0), T1 = pt(0.2, 0);
      poly([T0, T1, [T1[0], T1[1] - 4.5 * z], [T0[0], T0[1] - 4.5 * z]], C('#8a5a3c'));
      ['#b48cff', '#7fd3ff', '#ffd23f', '#ff8fb1'].forEach((c, k) => { const m = lerp(T0, T1, (k + 0.5) / 4); ellipse(m[0], m[1] - 6 * z, 0.9 * z, 1.4 * z, C(c)); if (lit) circle(m[0], m[1] - 6 * z, 0.5 * z, '#ffffff'); });
    }
  }
  // Dach: Bahnen bis zur Spitze, hinten zuerst; vorn Sterne auf den blauen Bahnen
  const tri = eave.map((p, i) => { const q = eave[(i + 1) % N], m = [(p.a + q.a) / 2, (p.b + q.b) / 2]; return { i, P: K.P(p.a, p.b, p.up), Q: K.P(q.a, q.b, q.up), m, d: K.depth(...m), vis: K.facing(...m) > 0 }; }).sort((u, v) => u.d - v.d);
  for (const f of tri) poly([f.P, f.Q, apex], C(shade(f.i & 1 ? BASAR.cream : BASAR.blue, f.vis ? (K.turn(f.m[0], f.m[1])[0] > 0.3 ? -0.1 : -0.02) : 0.08)));
  if (!fern) for (const f of tri) if (f.vis && !(f.i & 1)) sdStarDraw(lerp(lerp(f.P, f.Q, 0.5), apex, 0.38), 1.5 * z, BASAR.gold, BASAR.goldD);
  // Wimpelkranz an der Traufe (vorn), nachts als Lichterkette
  for (const f of tri) if (f.vis) {
    const m = lerp(f.P, f.Q, 0.5);
    poly([f.P, f.Q, [m[0], m[1] + 3.2 * z]], C(f.i & 1 ? BASAR.gold : BASAR.pink));
    if (lit) { circle(m[0], m[1] + 1 * z, 0.7 * z, '#fff3b0'); glowQuad([[m[0] - z, m[1]], [m[0] + z, m[1]], [m[0] + z, m[1] + 2 * z], [m[0] - z, m[1] + 2 * z]], 8 * z); }
  }
  // Mast, Wimpel, Stern obendrauf
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = Math.max(0.6, 0.8 * z); g.lineCap = 'round';
  g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(apex[0], apex[1] - 9 * z); g.stroke();
  poly([[apex[0], apex[1] - 9 * z], [apex[0] + 7 * z, apex[1] - 7.5 * z], [apex[0], apex[1] - 6 * z]], C(BASAR.pink));   // still (sonst jedes Bild live)
  const S = [apex[0], apex[1] - 11.5 * z];
  sdStarDraw(S, 2.4 * z, lit ? '#ffe680' : BASAR.gold, BASAR.goldD);
  if (lit) glowQuad([[S[0] - 2 * z, S[1] - 2 * z], [S[0] + 2 * z, S[1] - 2 * z], [S[0] + 2 * z, S[1] + 2 * z], [S[0] - 2 * z, S[1] + 2 * z]], 24 * z);
};

// Waren: { id: ITEMS-Schlüssel, price ✨, rare?: im Tagesangebot das seltene, katalog?: nur im Katalog (immer da) }
const SD_SHOP = [];
const sdShopItem = id => SD_SHOP.find(s => s.id === id);
// Kalenderwoche ab Montag (Tageszahl seit 1970, der 1.1.1970 war ein Donnerstag) und Tage bis zum Wechsel
const sdFuture = (day, today = sdDay()) => sdDayNum(day) > sdDayNum(today) + 1;   // falsche Uhr auf einem Gerät: übermorgen und später gilt nicht (Prüfung 19.10.)
const sdDayNum = day => Math.round(Date.UTC(Math.floor(day / 10000), Math.floor(day / 100) % 100 - 1, day % 100) / 864e5);
const sdWeek = day => Math.floor((sdDayNum(day) + 3) / 7);
const sdWeekLeft = day => 7 - ((sdDayNum(day) + 3) % 7);
// Angebote: jeden Tag 3 normale, dazu das Seltene der Woche (bleibt 7 Tage – man kann darauf sparen, Nutzer 17.10.2026); gleicher
// Tag/gleiche Woche und Spielstand = gleiche Angebote, Ungekauftes zuerst. Gekauftes bleibt bis zum Wechsel stehen (Nutzer 19.10.2026,
// wie Animal Crossing): die Auswahl wird beim ersten Blick des Tages bzw. der Woche gemerkt (state.sdOffers), sonst rückte nach
// jedem Kauf etwas nach – mehrere Seltene in einer Woche. Nur heute und später wird gemerkt (Uhr zurück: frisch gerechnet)
function basarOffers(today = sdDay()) {
  const pick = (list, n, key) => list.map(s => ({ s, h: sdHash(key + ':' + state.seed + ':' + s.id), have: state.sdItems.has(s.id) }))
    .sort((p, q) => p.have - q.have || p.h - q.h).slice(0, n).map(p => p.s);
  const pool = SD_SHOP.filter(s => !s.katalog && !s.mon), wk = sdWeek(today), o = state.sdOffers;   // mon: Wahrzeichen nur im Reiter Monumente
  const known = ids => ids.length && ids.every(id => sdShopItem(id));
  const day = o && o.day === today && known(o.ids) ? o.ids.map(sdShopItem) : pick(pool.filter(s => !s.rare), 3, today);
  const rare = o && o.week === wk && o.rare && sdShopItem(o.rare) ? [sdShopItem(o.rare)] : pick(pool.filter(s => s.rare), 1, 'w' + wk);
  if (!o || today > o.day || sdFuture(o.day, today)) state.sdOffers = { day: today, ids: day.map(s => s.id), week: wk, rare: rare[0] ? rare[0].id : null };
  return [...day, ...rare];
}
// 📖 Katalog (Animal-Crossing-Art, entschieden 18.10.2026): was der Basar schon einmal angeboten hat, gibt es jederzeit nach – zum
// anderthalbfachen Preis; Seltenes nur in seiner Woche. Gesehen = state.sdShown (beim Öffnen des Basars gemerkt)
const sdKatalogPrice = s => Math.ceil(s.price * 1.5 / 10) * 10;
const sdKatalog = () => SD_SHOP.filter(s => !s.rare && !s.mon && state.sdShown && state.sdShown.has(s.id) && !state.sdItems.has(s.id));
function sdBuyItem(id, fromKatalog = false) {
  if (typeof viewOnly === 'function' && viewOnly()) { if (typeof cloudBlocked === 'function') cloudBlocked(); return false; }
  const s = sdShopItem(id);
  if (!s || state.sdItems.has(id)) return false;
  if (fromKatalog && (s.rare || s.mon || !state.sdShown || !state.sdShown.has(id))) return false;
  if (s.mon && !fromKatalog && monOfMonth() !== id) { fail('Diesen Bauplan gibt es diesen Monat nicht'); return false; }   // Wahrzeichen des Monats (Block 162)
  if (!s.mon && !fromKatalog && !basarOffers().some(o => o.id === id)) { fail('Das gibt es heute nicht im Basar. Schau im Katalog nach.'); return false; }   // Prüfung 19.10.
  const price = fromKatalog ? sdKatalogPrice(s) : s.price;
  if ((state.stardust || 0) < price) { fail(`Zu wenig Sternstaub (✨ ${fmt(price)} nötig)`); return false; }
  state.stardust -= price;
  state.sdItems.add(id);
  if (typeof cloudTouched === 'function') cloudTouched();
  sfx('bell'); if (typeof buildToolbar === 'function') buildToolbar(); save();
  toast(`✨ Freigeschaltet: ${ITEMS[id].name}, jetzt im Baumenü`);
  return true;
}
const sdThumbs = new Map();
function sdThumb(id) {
  if (sdThumbs.has(id)) return sdThumbs.get(id);
  let url = '';
  try { const c = thumb(id, 1, null, 2); url = c ? c.toDataURL() : ''; if (!url.startsWith('data:image')) url = ''; } catch (e) { url = ''; }
  sdThumbs.set(id, url);
  return url;
}
// --- Basar „mehr special“ (Block 161h, Nutzer 18.10.2026: Entwurf A „Sternennacht“ + alle Extras, Händlerin Mondhase) ---
// Sammlungen: [Schlüssel (ITEMS[id].sammlung), Zeichen, Kurzname]; die ersten 13 Waren (data.js) sind der „Sternengarten“
const SD_SAMMLUNGEN = [['Sternengarten', '🌸', 'Sternengarten'], ['Eiszauber', '❄️', 'Eiszauber'], ['Turm & Himmelslaternen', '🏮', 'Turm'],
  ['Prinzessinnen & Märchen', '👑', 'Märchen'], ['Inselleben', '🍃', 'Inselleben']];
const sdSammlung = id => (ITEMS[id] && ITEMS[id].sammlung) || 'Sternengarten';
const sdSmlg = key => SD_SAMMLUNGEN.find(s => s[0] === key) || [key, '✨', key];
const sdSmlgCount = key => { const all = SD_SHOP.filter(s => sdSammlung(s.id) === key); return [all.filter(s => state.sdItems.has(s.id)).length, all.length]; };
// NEU: heute zum ersten Mal im Angebot (bleibt den ganzen Tag NEU); Herzchen: gemerkt, Hinweis einmal am Tag, wenn es da ist
const sdIsNew = (id, today = sdDay()) => !!(state.sdNew && state.sdNew.day === today && state.sdNew.ids.includes(id));
function sdToggleWish(id) {
  if (typeof viewOnly === 'function' && viewOnly()) { if (typeof cloudBlocked === 'function') cloudBlocked(); return; }
  if (!sdShopItem(id) || state.sdItems.has(id)) return;
  if (!state.sdWish) state.sdWish = new Set();
  if (state.sdWish.has(id)) state.sdWish.delete(id); else state.sdWish.add(id);
  if (typeof cloudTouched === 'function') cloudTouched();
  save();
}
let sdWishAt = 0;
function sdWishTick(now = Date.now(), today = sdDay()) {                 // aus der Spielschleife, höchstens alle 3 s
  if (now - sdWishAt < 3000 || !state.sdWish || !state.sdWish.size || state.sdWishNote === today) return;
  sdWishAt = now;
  const hit = basarOffers(today).find(s => state.sdWish.has(s.id) && !state.sdItems.has(s.id));
  if (!hit) return;
  state.sdWishNote = today; save();
  toast(`❤️ Dein Herzchen-Stück ist heute im Sternenbasar: ${ITEMS[hit.id].name}!`);
}
// Bis zur neuen Ware (Mitternacht, lokaler Kalendertag wie sdDay)
function sdUntilNew(now = new Date()) {
  const t = new Date(now); t.setHours(24, 0, 0, 0);
  const min = Math.max(1, Math.ceil((t - now) / 60000)), h = Math.floor(min / 60);
  return h ? `${h} Std ${min % 60} Min` : `${min} Min`;
}
// Der Mondhase sagt jeden Tag etwas – erst, was gerade wichtig ist, sonst einen der Tagessprüche (gleicher Tag = gleicher Spruch)
const SD_HARE_SAYS = [
  'Willkommen im Sternenbasar! Schau dich ruhig um.', 'Psst … heute Nacht sind besonders viele Sterne gefallen.',
  'Ich habe die ganze Nacht Sternstaub gefegt. Hatschi!', 'Der Mond ist heute schön rund. Gute Zeit für Schönes!',
  'Meine Laterne hat mir den Weg zu deiner Insel gezeigt.', 'Alles hier ist frisch vom Himmel gefallen.',
  'Was einmal da war, kommt wieder. Versprochen!', 'Hast du heute schon den Tageswunsch erfüllt? Der bringt Sternstaub.',
  'Ich sammle Sternschnuppen. Und du?', 'Morgen bringe ich neue Sachen mit. Bis dann!',
  'Eine Insel ohne Lieblingsstück ist wie ein Himmel ohne Stern.', 'Deine Insel gefällt mir. So gemütlich!',
  'Schon mein Opa hat auf dem Mond Waren verkauft.', 'Leise, leise, die Sterne schlafen noch.',
  'Gemütlich hier, oder? Ich hab extra Lichter aufgehängt.', 'Für Sternstaub gibt es nichts Nützliches, nur Schönes. So soll es sein!',
  'Montags bringe ich immer etwas ganz Seltenes mit.', 'Im Sammelbuch siehst du, was es noch alles gibt.',
  'Ich hab Möhrenkuchen gebacken. Leider nicht zu verkaufen.', 'Heute glitzert alles ein bisschen mehr.',
  'Wer viel baut, findet viel Sternstaub.', 'Tipp aufs Herzchen, dann sag ich dir Bescheid, wenn es wieder da ist.',
  'Mit „Ausprobieren“ siehst du, wie es auf deiner Insel aussieht.', 'Meine Ohren hören jede Sternschnuppe fallen.',
  'Was ich nicht verkaufe, findest du im Katalog.', 'Heute duftet es nach Sternenstaub und Zimt.',
  'Weißt du, warum der Mond leuchtet? Weil er sich freut, dich zu sehen.', 'Ich hab gehört, deine Bewohner mögen Blumen.',
  'Einen schönen Tag dir und eine sternenklare Nacht!', 'Komm morgen wieder, dann ist alles neu.'];
function sdHareSay(offers, today = sdDay()) {
  const rare = offers.find(s => s.rare && !state.sdItems.has(s.id)), left = sdWeekLeft(today), nm = s => ITEMS[s.id].name;
  if (rare && left === 1) return `Das ${nm(rare)} ist nur noch heute da …`;
  const wish = offers.find(s => state.sdWish && state.sdWish.has(s.id) && !state.sdItems.has(s.id));
  if (wish) return `Schau mal, ${nm(wish)} ist da! Das hattest du dir doch gemerkt.`;
  for (const s of offers) {
    if (state.sdItems.has(s.id)) continue;
    const key = sdSammlung(s.id), [n, all] = sdSmlgCount(key);
    if (n > 0 && all - n <= 2) return `Nur noch ${all - n} bis ${sdSmlg(key)[2]} komplett, und ${nm(s)} ist heute da!`;
  }
  if (rare && left === 7) return `Ganz neu diese Woche: ${nm(rare)}! Es bleibt sieben Tage.`;
  const neu = offers.find(s => sdIsNew(s.id, today) && !state.sdItems.has(s.id));
  if (neu && state.sdShown && state.sdShown.size > offers.length) return `Das hatte ich noch nie dabei: ${nm(neu)}!`;
  if (SD_SHOP.length && SD_SHOP.every(s => state.sdItems.has(s.id))) return 'Du hast wirklich alles! Ich bin beeindruckt.';
  return SD_HARE_SAYS[sdHash('hase:' + today + ':' + state.seed) % SD_HARE_SAYS.length];
}
// Mondhase (Sage vom Hasen im Mond, Entwurf tools/haendlerin-entwurf.js): auf der Mondsichel, Zipfelmütze, Laterne am Stab
let sdHareCache = null;
function sdHareUrl() {
  if (sdHareCache !== null) return sdHareCache;
  sdHareCache = '';
  try {
    const cv = document.createElement('canvas'); cv.width = 192; cv.height = 208;
    const x = cv.getContext('2d'); if (!x) return '';
    x.scale(1.04, 1.04); x.translate(-40, -15);
    const ell = (cx, cy, rx, ry, col, rot = 0) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); x.fill(); };
    const star = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
    x.fillStyle = '#ffe6a0'; x.beginPath(); x.arc(110, 150, 62, 0.15 * Math.PI, 0.85 * Math.PI); x.arc(110, 128, 58, 0.82 * Math.PI, 0.18 * Math.PI, true); x.closePath(); x.fill();
    ell(110, 150, 34, 30, '#f6f1ea');
    ell(95, 52, 9, 30, '#f6f1ea', -0.15); ell(125, 52, 9, 30, '#f6f1ea', 0.15);
    ell(95, 54, 4.5, 22, '#f7c2d0', -0.15); ell(125, 54, 4.5, 22, '#f7c2d0', 0.15);
    ell(110, 100, 30, 27, '#f6f1ea');
    x.fillStyle = '#4a3d8f'; x.beginPath(); x.moveTo(84, 82); x.quadraticCurveTo(112, 40, 150, 46); x.quadraticCurveTo(128, 64, 136, 82); x.closePath(); x.fill();
    star(150, 46, 7, '#ffd979'); star(104, 70, 3.5, '#ffd979'); star(122, 66, 3, '#ffd979');
    for (const d of [-11, 11]) { ell(110 + d, 102, 4, 4.6, '#2b2140'); ell(111.3 + d, 100.5, 1.4, 1.4, '#fff'); ell(110 + d * 1.6, 111, 6, 3.5, 'rgba(255,120,140,.45)'); }
    ell(110, 108, 3, 2.2, '#e8869c');
    x.strokeStyle = '#7a3b3b'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.arc(110, 111.4, 4, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke();
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(150, 168); x.lineTo(172, 70); x.stroke();
    x.beginPath(); x.moveTo(172, 70); x.quadraticCurveTo(186, 66, 184, 82); x.stroke();
    const gr = x.createRadialGradient(184, 98, 0, 184, 98, 30); gr.addColorStop(0, 'rgba(255,210,120,.65)'); gr.addColorStop(1, 'rgba(255,210,120,0)'); x.fillStyle = gr; x.fillRect(154, 68, 60, 60);
    x.fillStyle = '#ffcf5a'; x.beginPath(); x.roundRect(176, 84, 16, 22, 5); x.fill(); x.fillStyle = '#c98a2a'; x.fillRect(176, 82, 16, 4); x.fillRect(176, 104, 16, 4);
    ell(142, 160, 10, 7, '#f6f1ea');
    const url = cv.toDataURL(); sdHareCache = url.startsWith('data:image') ? url : '';
  } catch (e) { sdHareCache = ''; }
  return sdHareCache;
}
let basarTab = 'heute';
const SD_SPARKLES = '<i class="sp s1">✦</i><i class="sp s2">✧</i><i class="sp s3">✦</i><i class="sp s4">✧</i>';
function basarCard(s, kat = false, feature = false) {
  const have = state.sdItems.has(s.id), d = ITEMS[s.id], url = sdThumb(s.id), price = kat ? sdKatalogPrice(s) : s.price;
  const key = sdSammlung(s.id), sm = sdSmlg(key), [n, all] = sdSmlgCount(key), wish = !!(state.sdWish && state.sdWish.has(s.id));
  return `<div class="basar-card${s.rare ? ' rare' : ''}${have ? ' have' : ''}${feature ? ' feature' : ''}">
    ${sdIsNew(s.id) && !have && !kat ? '<span class="basar-new">NEU</span>' : ''}
    ${have ? '' : `<button class="basar-heart${wish ? ' on' : ''}" data-sdwish="${s.id}" aria-label="${wish ? 'Nicht mehr merken' : 'Merken'}">${wish ? '❤️' : '🤍'}</button>`}
    ${feature ? `<span class="basar-rare">${feature === true ? `✦ Seltenes der Woche · noch ${sdWeekLeft(sdDay())} ${sdWeekLeft(sdDay()) === 1 ? 'Tag' : 'Tage'} ✦` : feature}</span>` : ''}
    <div class="basar-pic">${url ? `<img src="${url}" alt="">` : ''}${s.rare && !have ? SD_SPARKLES : ''}</div>
    <b class="basar-name">${escHtml(d.name)}</b>
    <span class="basar-smlg">${sm[1]} ${escHtml(sm[2])} ${n}/${all}</span>
    ${have ? '<span class="basar-have">✓ gekauft, steht im Baumenü</span>'
      : `<div class="basar-buy"><button class="btn small" data-sdbuy="${s.id}"${kat ? ' data-kat="1"' : ''}${(state.stardust || 0) < price ? ' disabled' : ''}>✨ ${fmt(price)}</button><button class="btn small basar-try" data-sdtry="${s.id}" aria-label="Ausprobieren" title="Ausprobieren">👁${feature ? ' Ausprobieren' : ''}</button></div>`}
  </div>`;
}
// 🏛️ Monumente (Block 162): das Wahrzeichen des Monats groß, darunter alle Wahrzeichen und Prachtstücke mit ihrem Stand
function basarMonuments() {
  const cur = monOfMonth(), left = monDaysLeft();
  const row = id => {
    const have = state.sdItems.has(id), url = sdThumb(id), m = MONUMENTS[id], nx = m.wahr ? monNext(id) : null;
    const how = have ? (m.wahr ? '✓ Bauplan da' : '✓ gekauft') : !m.wahr ? 'kommt als Seltenes der Woche' : nx && nx.in === 0 ? 'diesen Monat' : nx ? `kommt im ${nx.name}` : '';
    return `<div class="book-item${have ? ' have' : ''}">${url ? `<img src="${url}" alt="">` : ''}<span>${escHtml(ITEMS[id].name)}</span><small>${how}</small></div>`;
  };
  return `<p class="muted">Jeden Monat ein Wahrzeichen: Bauplan kaufen, dann im Baumenü (🌸 Gestalten → 🏛️ Monumente) hinstellen und in drei Abschnitten bauen, so oft du magst.</p>
    ${basarCard(sdShopItem(cur), false, `🏛️ Wahrzeichen im ${MON_MONTHS[new Date().getMonth()]} · noch ${left} ${left === 1 ? 'Tag' : 'Tage'}`)}
    <div class="book-sec"><div class="book-head"><b>🏛️ Wahrzeichen</b></div><div class="book-grid mon-list">${MON_WAHR.map(row).join('')}</div></div>
    <div class="book-sec"><div class="book-head"><b>✦ Prachtstücke</b></div><div class="book-grid mon-list">${Object.keys(MONUMENTS).filter(id => !MONUMENTS[id].wahr).map(row).join('')}</div></div>`;
}
// 📖 Sammelbuch: alle Waren je Sammlung – gekauft bunt, gesehen als Umriss mit Namen, nie gesehen als Umriss mit „???“
function basarBook() {
  return SD_SAMMLUNGEN.map(([key, ic, short]) => {
    const list = SD_SHOP.filter(s => sdSammlung(s.id) === key);
    if (!list.length) return '';
    const [n, all] = sdSmlgCount(key);
    return `<div class="book-sec"><div class="book-head"><b>${ic} ${escHtml(key)}</b><span>${n}/${all}</span></div>
      <div class="book-bar"><i style="width:${Math.round(n / all * 100)}%"></i></div>
      <div class="book-grid">${list.map(s => { const have = state.sdItems.has(s.id), seen = have || (state.sdShown && state.sdShown.has(s.id)), url = sdThumb(s.id);
        return `<div class="book-item${have ? ' have' : ''}">${url ? `<img src="${url}" alt="">` : ''}<span>${s.rare ? '✦ ' : ''}${seen ? escHtml(ITEMS[s.id].name) : '???'}</span></div>`; }).join('')}</div></div>`;
  }).join('');
}
// 👁 Ausprobieren (Block 161h): die Ware wie zum Bauen in der Hand – die Vorschau zeigt sie überall, Tippen setzt nur die Vorschau um,
// gebaut wird nie (available/tap kennen sdTry). „Kaufen“ kauft und stellt sie dorthin, wo die Vorschau steht; jedes andere Werkzeug beendet es
let sdTry = null, sdTryKat = false;                                   // sdTryKat: aus dem Katalog (Katalogpreis, Prüfung 19.10.)
function sdTryStart(id, kat = false) {
  if (!sdShopItem(id) || state.sdItems.has(id)) return;
  if (typeof viewOnly === 'function' && viewOnly()) { if (typeof cloudBlocked === 'function') cloudBlocked(); return; }
  closeModal(); setTool('look'); sdTry = id; sdTryKat = !!kat; setTool(id); sdTryBar();
  toast('👁 Probe: Tipp auf deine Insel, gebaut wird nichts');
}
function sdTryBar() {
  const bar = $('sd-try-bar');
  if (!bar) return;
  if (!sdTry) { bar.hidden = true; return; }
  const s = sdShopItem(sdTry), price = sdTryKat ? sdKatalogPrice(s) : s.price, miss = price - (state.stardust || 0);
  bar.innerHTML = `<span class="sd-try-name">👁 ${escHtml(ITEMS[sdTry].name)}</span>
    <button class="btn" id="sd-try-buy"${miss > 0 ? ' disabled' : ''}>✨ ${fmt(price)} kaufen${miss > 0 ? ` (fehlen ${fmt(miss)})` : ''}</button>
    <button class="btn ghost" id="sd-try-back">Zurück</button>`;
  bar.hidden = false;
  $('sd-try-buy').onclick = () => sdTryBuy($('sd-try-buy').getBoundingClientRect());
  $('sd-try-back').onclick = () => { const kat = sdTryKat, mon = s.mon; setTool('look'); openBasar(kat ? 'katalog' : mon ? 'monumente' : 'heute'); };
}
function sdTryClear() { sdTry = null; sdTryKat = false; const bar = $('sd-try-bar'); if (bar) bar.hidden = true; }   // aus setTool: anderes Werkzeug
function sdTryBuy(r = null) {
  const id = sdTry;
  if (!id || !sdBuyItem(id, sdTryKat)) return false;
  if (r) sdBurst(r.left + r.width / 2, r.top + r.height / 2);
  sdTryClear();                                                          // in der Hand bleibt die Ware – jetzt echt
  if (typeof hover !== 'undefined' && hover && Number.isInteger(hover.x)) {
    const ok = ITEMS[id].small ? buildSmall(id, hover.x, hover.y, freeSlot(hover.x, hover.y, hoverSlot)) : build(id, hover.x, hover.y);
    if (ok && typeof noteRecent === 'function') noteRecent(id);
  } else toast('Jetzt hinstellen: tipp auf den Platz');
  return true;
}
// Kauf: Sternenstaub sprüht vom Knopf (eigene Schicht über dem Fenster – das Fenster wird gleich neu gezeichnet)
function sdBurst(x, y, n = 22) {
  if (typeof document === 'undefined' || !document.body || !Element.prototype.animate) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) n = 6;
  const box = document.createElement('div'); box.className = 'sd-burst'; document.body.appendChild(box);
  for (let i = 0; i < n; i++) {
    const e = document.createElement('i'), a = i / n * Math.PI * 2 + Math.random() * 0.4, r = 50 + Math.random() * 70;
    e.textContent = i % 3 ? '✦' : '✧'; e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.fontSize = (10 + Math.random() * 12) + 'px';
    box.appendChild(e);
    e.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-50% + ${Math.sin(a) * r - 30}px)) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r * 1.15}px), calc(-50% + ${Math.sin(a) * r + 10}px)) scale(.3)`, opacity: 0 }], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
  setTimeout(() => box.remove(), 1700);
}
function openBasar(tab = basarTab) {
  basarTab = tab;
  const watch = typeof viewOnly === 'function' && viewOnly();            // zuschauendes Gerät: nur ansehen, nichts merken (Prüfung 19.10.)
  if (!state.sdSeen && !watch) { state.sdSeen = true; save(); }
  const today = sdDay(), offers = basarOffers(today);
  if (!state.sdShown) state.sdShown = new Set();
  if (!state.sdNew || state.sdNew.day !== today) state.sdNew = { day: today, ids: [] };
  let neu = false; if (!watch) for (const s of offers) if (!state.sdShown.has(s.id)) { state.sdShown.add(s.id); state.sdNew.ids.push(s.id); neu = true; }
  if (!watch && tab === 'monumente' && !state.sdShown.has(monOfMonth())) { state.sdShown.add(monOfMonth()); neu = true; }   // Wahrzeichen des Monats gesehen (Sammelbuch)
  if (neu) { if (typeof cloudTouched === 'function') cloudTouched(); save(); }
  const kat = sdKatalog(), rare = offers.find(s => s.rare), norm = offers.filter(s => !s.rare);
  const body = tab === 'katalog'
    ? `<p class="muted">Alles, was du hier schon gesehen hast, kannst du nachbestellen, für den anderthalbfachen Preis. Seltenes gibt es nur in seiner Woche.</p>`
      + (kat.length ? `<div class="basar-grid">${kat.map(s => basarCard(s, true)).join('')}</div>` : '<p class="muted">Noch leer. Was du im Angebot siehst und nicht kaufst, landet hier.</p>')
    : tab === 'monumente' ? basarMonuments()
    : tab === 'buch' ? `<p class="muted">Alle Waren des Sternenbasars. Was du noch nie gesehen hast, ist ein Geheimnis.</p>${basarBook()}`
    : offers.length ? `<p class="basar-when">Neue Ware in ${sdUntilNew()}</p>${rare ? basarCard(rare, false, true) : ''}<div class="basar-grid">${norm.map(s => basarCard(s)).join('')}</div>`
      : '<p class="muted">Die ersten Waren sind unterwegs. Schau bald wieder vorbei!</p>';
  const hare = sdHareUrl();
  openModal(`<div class="basar-head">${hare ? `<img class="basar-hare" src="${hare}" alt="Mondhase">` : ''}<div class="basar-say">„${escHtml(sdHareSay(offers, today))}“</div></div>
    <h2 class="basar-title">✦ Sternenbasar ✦ <button class="sd-have" data-btab="sd" aria-label="Sternstaub: ${fmt(state.stardust || 0)}. Woher er kommt, Schatzkammer">✨ ${fmt(state.stardust || 0)}</button></h2>
    <div class="looks hall-tabs"><button class="look${tab === 'heute' ? ' on' : ''}" data-btab="heute">🌟 Heute</button><button class="look${tab === 'katalog' ? ' on' : ''}" data-btab="katalog">📦 Katalog</button><button class="look${tab === 'monumente' ? ' on' : ''}" data-btab="monumente">🏛️ Monumente</button>
      <button class="look${tab === 'buch' ? ' on' : ''}" data-btab="buch">📖 Sammelbuch</button></div>
    ${body}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  const c = $('modal-card');
  c.classList.add('basar');                                              // hell wie alle Fenster (Hecke/Wolken, Nutzer 25.10.2026) – früher basar-night
  for (const b of c.querySelectorAll('[data-btab]')) b.onclick = () => { if (b.dataset.btab === 'sd') openStardust(); else openBasar(b.dataset.btab); };
  for (const b of c.querySelectorAll('[data-sdbuy]')) b.onclick = () => {
    const r = b.getBoundingClientRect();
    if (sdBuyItem(b.dataset.sdbuy, !!b.dataset.kat)) { sdBurst(r.left + r.width / 2, r.top + r.height / 2); openBasar(); }
  };
  for (const b of c.querySelectorAll('[data-sdtry]')) b.onclick = () => sdTryStart(b.dataset.sdtry, tab === 'katalog');
  for (const b of c.querySelectorAll('[data-sdwish]')) b.onclick = () => { sdToggleWish(b.dataset.sdwish); openBasar(); };
  $('m-close').onclick = closeModal;
}

// --- Waren (Block 161c, Entwürfe tools/basar-waren-entwurf.js, Nutzer 17.10.2026: „voll die geilen Sachen“) ---
// Gezeichnet wie kleine Deko (Mitte unten cx, cy; Pixel × z); Licht nur nachts live (isLive), Schein über glowQuad wie die Laterne
const sdLit = () => night > 0.15 && isLive();
const sdGlow = (x, y, r, z) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r); };   // winzige Quelle: nur der Schein, kein helles Kästchen
const sdShadow = (cx, cy, rx, z) => ellipse(cx, cy + 1 * z, rx * z, rx * 0.42 * z, 'rgba(40,60,20,0.16)');
const sdTrunk = (cx, cy, z, h, w = 2, col = '#8a5a3c') => poly([[cx - w * z, cy], [cx + w * z, cy], [cx + w * 0.7 * z, cy - h * z], [cx - w * 0.7 * z, cy - h * z]], C(col));
const sdBlob = (cx, cy, z, pts, base, hi) => { for (const [dx, dy, r] of pts) circle(cx + dx * z, cy + dy * z, r * z, C(base)); for (const [dx, dy, r] of pts) circle(cx + (dx - r * 0.25) * z, cy + (dy - r * 0.3) * z, r * 0.55 * z, C(hi)); };
const SD_CROWN = [[0, -22, 8], [-7, -18, 6.5], [7, -18, 6.5], [-4, -26, 6], [5, -26, 6], [0, -30, 5.5], [-9, -24, 4.5], [9, -24, 4.5]];
const sdLine = (col, w, z, pts, curve = null) => { g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); if (curve) g.quadraticCurveTo(...curve, ...pts[1]); else for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
const SD_ART = {
  sd_kirschbaum(cx, cy, z) {
    sdShadow(cx, cy, 10, z);
    for (const [dx, dy] of [[-7, 1], [5, 2], [9, -1], [-3, 3], [2, -1]]) ellipse(cx + dx * z, cy + dy * z, 1.4 * z, 0.7 * z, C('#ffc2d6'));
    sdTrunk(cx, cy, z, 16, 2, '#6e4a3a');
    sdBlob(cx, cy, z, SD_CROWN, '#ff9ec0', '#ffd2e3');
    for (const [dx, dy] of [[-5, -20], [4, -24], [8, -19], [-2, -29], [-8, -25]]) circle(cx + dx * z, cy + dy * z, 0.9 * z, C('#ffffff'));
  },
  sd_ahorn(cx, cy, z) {
    sdShadow(cx, cy, 10, z);
    sdTrunk(cx, cy, z, 15, 2, '#6e4a3a');
    sdBlob(cx, cy, z, SD_CROWN, '#e0582f', '#ffa24a');
    for (const [dx, dy] of [[-6, -18], [6, -25], [1, -31]]) circle(cx + dx * z, cy + dy * z, 2.2 * z, C('#ffd23f'));
    for (const [dx, dy] of [[-8, 2], [6, 1], [2, 3]]) ellipse(cx + dx * z, cy + dy * z, 1.6 * z, 0.8 * z, C('#e86a3a'));
  },
  sd_weide(cx, cy, z) {
    sdShadow(cx, cy, 12, z);
    sdTrunk(cx, cy, z, 18, 2.4, '#6e5a3a');
    sdBlob(cx, cy, z, [[0, -26, 8], [-7, -23, 6], [7, -23, 6], [0, -32, 6]], '#7fae4a', '#a9d36a');
    for (let i = 0; i < 13; i++) { const a = -12 + i * 2, top = -24 - Math.cos(i / 12 * Math.PI - Math.PI / 2) * 6, len = 15 + (i % 3) * 3;
      sdLine(i & 1 ? '#6f9d3f' : '#94c45a', 1.3, z, [[cx + a * z, cy + top * z], [cx + a * 1.15 * z, cy + (top + len) * z]], [cx + a * 1.2 * z, cy + (top + len * 0.5) * z]); }
  },
  sd_laternenbaum(cx, cy, z) {
    const lit = sdLit();
    sdShadow(cx, cy, 10, z);
    sdTrunk(cx, cy, z, 15, 2, '#6e4a3a');
    sdBlob(cx, cy, z, SD_CROWN, '#3f8f4a', '#5fb35a');
    for (const [dx, dy, c] of [[-8, -15, '#ff8a3d'], [7, -16, '#ffd23f'], [-2, -19, '#ff5d8f'], [10, -22, '#ff8a3d'], [-10, -22, '#ffd23f']]) {
      sdLine('#5a4636', 0.5, z, [[cx + dx * z, cy + (dy - 4) * z], [cx + dx * z, cy + (dy - 1.5) * z]]);
      ellipse(cx + dx * z, cy + dy * z, 1.8 * z, 2.2 * z, lit ? '#ffe9a0' : C(c));
      if (lit) sdGlow(cx + dx * z, cy + dy * z, 10 * z, z);
    }
  },
  sd_nachtblumen(cx, cy, z) {
    const lit = sdLit();
    sdShadow(cx, cy, 8, z);
    for (const [dx, dy, h] of [[-5, 1, 9], [0, 0, 12], [5, 1, 10], [-2, 2, 7], [3, 2, 8]]) {
      sdLine('#4f9e5a', 0.8, z, [[cx + dx * z, cy + dy * z], [cx + dx * z, cy + (dy - h) * z]]);
      const p = [cx + dx * z, cy + (dy - h) * z];
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; circle(p[0] + Math.cos(a) * 1.6 * z, p[1] + Math.sin(a) * z, 1.3 * z, lit ? '#bfe4ff' : C('#8fa8ff')); }
      circle(p[0], p[1], 0.9 * z, lit ? '#ffffff' : C('#fff3a0'));
      if (lit) { const q = 0.35 * z; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], 8 * z, 'blue'); }
    }
  },
  sd_pfau(cx, cy, z) {
    sdShadow(cx, cy, 9, z);
    for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI, ex = cx + 3 * z + Math.cos(a) * 12 * z, ey = cy - 10 * z + Math.sin(a) * 10 * z;
      sdLine('#3f8f6a', 1.6, z, [[cx + 3 * z, cy - 8 * z], [ex, ey]]);
      circle(ex, ey, 2.2 * z, C('#2aa58f')); circle(ex, ey, 1.2 * z, C('#2b4fa8')); circle(ex, ey, 0.5 * z, C('#ffd23f')); }
    ellipse(cx, cy - 5 * z, 4 * z, 3.4 * z, C('#2b5fb8'));
    poly([[cx - 2 * z, cy - 7 * z], [cx - 1 * z, cy - 14 * z], [cx + 0.6 * z, cy - 7 * z]], C('#2b5fb8'));
    circle(cx - 1 * z, cy - 15 * z, 1.8 * z, C('#2f6fd0')); poly([[cx - 2.6 * z, cy - 15 * z], [cx - 4.5 * z, cy - 14.4 * z], [cx - 2.6 * z, cy - 14 * z]], C('#e9a23b'));
    for (const dx of [-1.6, -0.6, 0.4]) { sdLine('#2f6fd0', 0.4, z, [[cx + (dx - 0.6) * z, cy - 16.5 * z], [cx + dx * z, cy - 19 * z]]); circle(cx + dx * z, cy - 19 * z, 0.5 * z, C('#2f6fd0')); }
  },
  sd_katze(cx, cy, z) {
    sdShadow(cx, cy, 7, z);
    ellipse(cx, cy - 1.5 * z, 7 * z, 3.2 * z, C('#b48cff')); ellipse(cx, cy - 2.4 * z, 6 * z, 2.4 * z, C('#cdb0ff'));
    ellipse(cx, cy - 5 * z, 4.6 * z, 3 * z, C('#f0a24a'));
    circle(cx + 3.4 * z, cy - 7 * z, 2.6 * z, C('#f0a24a'));
    poly([[cx + 2 * z, cy - 9 * z], [cx + 2.4 * z, cy - 11.4 * z], [cx + 3.4 * z, cy - 9.4 * z]], C('#e08a2e'));
    poly([[cx + 4 * z, cy - 9.2 * z], [cx + 5.2 * z, cy - 11 * z], [cx + 5.4 * z, cy - 8.6 * z]], C('#e08a2e'));
    sdLine('#e08a2e', 1.4, z, [[cx - 4 * z, cy - 4 * z], [cx - 2 * z, cy - 7.5 * z]], [cx - 6 * z, cy - 7 * z]);
    for (const dx of [2.6, 4.2]) sdLine('#5a3a2a', 0.5, z, [[cx + (dx - 0.5) * z, cy - 7.2 * z], [cx + (dx + 0.5) * z, cy - 7.2 * z]]);
  },
  sd_lampions(cx, cy, z) {
    const lit = sdLit();
    sdShadow(cx, cy, 10, z);
    for (const s of [-1, 1]) sdLine('#6b4f3a', 1.4, z, [[cx + s * 9 * z, cy], [cx + s * 9 * z, cy - 18 * z]]);
    sdLine('#5a4636', 0.5, z, [[cx - 9 * z, cy - 17 * z], [cx + 9 * z, cy - 17 * z]], [cx, cy - 11 * z]);
    ['#ff5d8f', '#ffd23f', '#58b3e8', '#ff8a3d', '#b57bff'].forEach((c, k) => { const t = (k + 0.5) / 5, x0 = cx + (-9 + 18 * t) * z, y0 = cy + (-17 + 6 * 4 * t * (1 - t)) * z;
      ellipse(x0, y0 + 2.4 * z, 2 * z, 2.4 * z, lit ? '#ffe9a0' : C(c)); poly([[x0 - 1.2 * z, y0 + 0.2 * z], [x0 + 1.2 * z, y0 + 0.2 * z], [x0 + 1.2 * z, y0 + 0.8 * z], [x0 - 1.2 * z, y0 + 0.8 * z]], C('#5a4636'));
      if (lit) sdGlow(x0, y0 + 2.4 * z, 9 * z, z); });
  },
  sd_sonnenuhr(cx, cy, z) {
    sdShadow(cx, cy, 6, z);
    box(cx, cy, 3.4 * z, 1.7 * z, 8 * z, '#e5dccb', null, 0);
    ellipse(cx, cy - 8.5 * z, 6 * z, 3 * z, C('#d9cfbf')); ellipse(cx, cy - 9 * z, 5.6 * z, 2.7 * z, C('#f3ecdf'));
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; circle(cx + Math.cos(a) * 4.4 * z, cy - 9 * z + Math.sin(a) * 2.1 * z, 0.35 * z, C('#8a7a62')); }
    poly([[cx, cy - 9 * z], [cx - 0.5 * z, cy - 13 * z], [cx + 3 * z, cy - 9.4 * z]], C('#c9962a'));
    poly([[cx, cy - 9 * z], [cx + 3 * z, cy - 9.4 * z], [cx + 5 * z, cy - 7.6 * z]], 'rgba(60,40,30,0.25)');
  },
  sd_schaukel(cx, cy, z) {
    sdShadow(cx, cy, 10, z);
    for (const s of [-1, 1]) sdLine('#8a5a3c', 1.6, z, [[cx + s * 11 * z, cy + 1 * z], [cx + s * 8 * z, cy - 20 * z], [cx + s * 5 * z, cy + 2 * z]]);
    sdLine('#8a5a3c', 1.6, z, [[cx - 9 * z, cy - 20 * z], [cx + 9 * z, cy - 20 * z]]);
    for (const s of [-1, 1]) sdLine('#5a4636', 0.5, z, [[cx + s * 2.6 * z, cy - 20 * z], [cx + s * 2.6 * z, cy - 6 * z]]);
    poly([[cx - 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 5 * z], [cx - 3.4 * z, cy - 5 * z]], C('#e86f8f'));
    [-6, 0, 6].forEach((dx, k) => circle(cx + dx * z, cy - 20.5 * z, 1.2 * z, C(['#ffb3cf', '#ffffff', '#ffd23f'][k])));
  },
  sd_koiteich(cx, cy, z) {
    const rx = 22 * z, ry = 11 * z;
    ellipse(cx, cy + 1 * z, rx + 3 * z, ry + 2 * z, C('#a69c8a'));
    for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; ellipse(cx + Math.cos(a) * (rx + 1 * z), cy + Math.sin(a) * (ry + 0.6 * z), 3 * z, 1.8 * z, C(k & 1 ? '#c9c1b1' : '#b5ad9c')); }
    ellipse(cx, cy, rx, ry, C('#5fb8d6')); ellipse(cx - 4 * z, cy - 2 * z, rx * 0.6, ry * 0.5, C('#7fcde6'));
    for (const [dx, dy, c, r] of [[-8, 1, '#ff7a2f', 0.3], [6, -3, '#ffffff', -0.4], [2, 4, '#ff9a4a', 2.6]]) {
      g.save(); g.translate(cx + dx * z, cy + dy * z); g.rotate(r);
      ellipse(0, 0, 3.4 * z, 1.4 * z, C(c)); poly([[-3.2 * z, 0], [-5.2 * z, -1.4 * z], [-5.2 * z, 1.4 * z]], C(c)); if (c === '#ffffff') circle(0.5 * z, 0, 0.9 * z, C('#ff5a2a'));
      g.restore();
    }
    for (const [dx, dy] of [[12, 3], [-14, -2]]) { ellipse(cx + dx * z, cy + dy * z, 3.4 * z, 1.8 * z, C('#4f9e5a')); circle(cx + (dx + 1) * z, cy + (dy - 0.6) * z, 1 * z, C('#ffb3cf')); }
  },
  sd_sternbrunnen(cx, cy, z) {
    const lit = sdLit();
    ellipse(cx, cy + 1 * z, 20 * z, 9.5 * z, C('#b9b0a0'));
    ellipse(cx, cy, 18 * z, 8.4 * z, C('#e8e1d4')); ellipse(cx, cy - 0.5 * z, 15.5 * z, 7 * z, C('#6fc6e0'));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; circle(cx + Math.cos(a) * 9 * z, cy - 0.5 * z + Math.sin(a) * 4 * z, 0.8 * z, C('#ffffff')); }
    poly([[cx - 2.4 * z, cy - 1 * z], [cx + 2.4 * z, cy - 1 * z], [cx + 1.6 * z, cy - 16 * z], [cx - 1.6 * z, cy - 16 * z]], C('#e8e1d4'));
    const S = [cx, cy - 22 * z];
    poly(sdStarPts(S[0], S[1], 6.5 * z), lit ? '#ffe680' : C('#f5c84b'));
    if (lit) sdGlow(S[0], S[1], 26 * z, z);
    for (const s of [-1, 1]) { g.strokeStyle = 'rgba(184,236,246,0.9)'; g.lineWidth = Math.max(0.6, 1 * z); g.beginPath(); g.moveTo(cx + s * 2 * z, cy - 15 * z); g.quadraticCurveTo(cx + s * 8 * z, cy - 18 * z, cx + s * 10 * z, cy - 2 * z); g.stroke(); }
  },
  sd_pagode(cx, cy, z) {
    const lit = sdLit();
    sdShadow(cx, cy, 16, z);
    box(cx, cy, 11 * z, 5.5 * z, 2 * z, '#d9cfbf', '#e8e1d4', 0);
    let base = cy - 2 * z;
    for (let k = 0; k < 3; k++) {
      const w = (10 - k * 2.2) * z, h = (8 - k) * z;
      box(cx, base, w, w * 0.5, h, '#fff1d6', null, 0);
      if (lit) { poly([[cx - w * 0.3, base - h * 0.2], [cx - w * 0.05, base - h * 0.1], [cx - w * 0.05, base - h * 0.7], [cx - w * 0.3, base - h * 0.8]], '#ffd27a'); sdGlow(cx - w * 0.2, base - h * 0.5, 12 * z, z); }
      base -= h;
      const Rr = w * 1.45;
      poly([[cx - Rr, base + 1 * z], [cx, base + Rr * 0.5 + 1 * z], [cx + Rr, base + 1 * z], [cx + Rr * 0.55, base - 4 * z], [cx, base - 4 * z + Rr * 0.2], [cx - Rr * 0.55, base - 4 * z]], C('#c9443a'));
      poly([[cx - Rr, base + 1 * z], [cx - Rr - 1.5 * z, base - 1 * z], [cx - Rr * 0.6, base - 1 * z]], C('#a8352d'));
      poly([[cx + Rr, base + 1 * z], [cx + Rr + 1.5 * z, base - 1 * z], [cx + Rr * 0.6, base - 1 * z]], C('#a8352d'));
      base -= 4 * z;
    }
    sdLine('#e9a23b', 1.2, z, [[cx, base], [cx, base - 7 * z]]); circle(cx, base - 7 * z, 1.5 * z, C('#f5c84b'));
  },
};
// Preise (Nutzer 17.10.2026: „wirklich ein Spielziel, nicht alles sofort“, Rechnung tools: Sternstaub-Simulation): normal 80–200 ✨,
// selten 350–450 ✨ – bei 1 Std/Tag nach 30 Tagen ≈ 15 Dinge, alles nach ≈ ½ Jahr
SD_SHOP.push(
  { id: 'sd_kirschbaum', price: 110 }, { id: 'sd_ahorn', price: 110 }, { id: 'sd_weide', price: 130 }, { id: 'sd_laternenbaum', price: 160 },
  { id: 'sd_nachtblumen', price: 140 }, { id: 'sd_pfau', price: 170 }, { id: 'sd_katze', price: 90 }, { id: 'sd_lampions', price: 120 },
  { id: 'sd_sonnenuhr', price: 80 }, { id: 'sd_schaukel', price: 130 }, { id: 'sd_koiteich', price: 200 },
  { id: 'sd_sternbrunnen', price: 400, rare: true }, { id: 'sd_pagode', price: 450, rare: true },
);
// Baumenü (Gestalten → ✨ Sternenbasar): nur Gekauftes; ohne Kauf keine Gruppe (Nutzer 21.10.2026: wie Animal Crossing – der Basar ist das Schaufenster)
(() => {
  const top = MENU.find(m => m.id === 'gestalten');
  if (!top || top.groups.some(gr => gr.id === 'sternstaub')) return;
  top.groups.push({ id: 'sternstaub', label: '✨ Sternenbasar', get items() { return SD_SHOP.map(s => s.id).filter(id => !ITEMS[id].mon && state && state.sdItems && state.sdItems.has(id)); } });
})();
// Tipps (Bau-Info, „Neu freigeschaltet“): je Ware aus dem Basar
for (const s of SD_SHOP) if (!ITEM_TIPS[s.id]) ITEM_TIPS[s.id] = ITEMS[s.id].small ? 'Aus dem Sternenbasar ✨. Kleine Deko für eine Ecke, bis zu 4 pro Feld.' : 'Aus dem Sternenbasar ✨, braucht ein ganzes Feld Wiese.';
