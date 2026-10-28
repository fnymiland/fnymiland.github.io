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
// Nicht mehr im Verkauf (Basar-Durchsicht, Nutzer 27.10.2026): Wer sie gekauft hat, behält sie (Insel, Baumenü, Sammelbuch);
// Angebot, Katalog, Kaufen, Ausprobieren und die Zählung „n von allen“ kennen nur, was es noch gibt
const SD_NICHT_MEHR = new Set(['sd_pagode', 'sd_leseecke', 'sd_wandbild', 'sd_apfelbaum', 'sd_glockenbaum', 'sd_huehnerhaus']);
const sdForSale = s => !!s && !SD_NICHT_MEHR.has(s.id);
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
  const pool = SD_SHOP.filter(s => !s.katalog && !s.mon && sdForSale(s)), wk = sdWeek(today), o = state.sdOffers;   // mon: Wahrzeichen nur im Reiter Monumente
  const known = ids => ids.length && ids.every(id => sdForSale(sdShopItem(id)));   // gemerktes Angebot mit Entferntem: neu rechnen
  const day = o && o.day === today && known(o.ids) ? o.ids.map(sdShopItem) : pick(pool.filter(s => !s.rare), 3, today);
  const rare = o && o.week === wk && o.rare && sdForSale(sdShopItem(o.rare)) ? [sdShopItem(o.rare)] : pick(pool.filter(s => s.rare), 1, 'w' + wk);
  if (!o || today > o.day || sdFuture(o.day, today)) state.sdOffers = { day: today, ids: day.map(s => s.id), week: wk, rare: rare[0] ? rare[0].id : null };
  return [...day, ...rare];
}
// 📖 Katalog (Animal-Crossing-Art, entschieden 18.10.2026): was der Basar schon einmal angeboten hat, gibt es jederzeit nach – zum
// anderthalbfachen Preis; Seltenes nur in seiner Woche. Gesehen = state.sdShown (beim Öffnen des Basars gemerkt)
const sdKatalogPrice = s => Math.ceil(s.price * 1.5 / 10) * 10;
const sdKatalog = () => SD_SHOP.filter(s => !s.rare && !s.mon && sdForSale(s) && state.sdShown && state.sdShown.has(s.id) && !state.sdItems.has(s.id));
function sdBuyItem(id, fromKatalog = false) {
  if (typeof viewOnly === 'function' && viewOnly()) { if (typeof cloudBlocked === 'function') cloudBlocked(); return false; }
  const s = sdShopItem(id);
  if (!sdForSale(s) || state.sdItems.has(id)) return false;
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
const sdSmlgCount = key => { const all = SD_SHOP.filter(s => sdSammlung(s.id) === key && sdForSale(s)); return [all.filter(s => state.sdItems.has(s.id)).length, all.length]; };
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
  if (SD_SHOP.length && SD_SHOP.every(s => !sdForSale(s) || state.sdItems.has(s.id))) return 'Du hast wirklich alles! Ich bin beeindruckt.';
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
    const list = SD_SHOP.filter(s => sdSammlung(s.id) === key && (sdForSale(s) || state.sdItems.has(s.id)));   // Entferntes nur, wenn gekauft
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
  if (!sdForSale(sdShopItem(id)) || state.sdItems.has(id)) return;
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
// Durchgang (Basar-Durchsicht 28.10.2026: „als Durchgang verkaufen … auf einen Weg stellen und man kann drunter durchlaufen“): der Bogen steht
// in der Ebene a = 0 des Felds (quer über b), ein Weg längs a führt hindurch; Drehung aus archRot. Q(s, h): Punkt im Bogen, s −1…1 quer, h Höhe.
// Auf dem Weg (Feldmitte) fast feldbreit; kleine Deko kommt um decoScale × 0,9 verkleinert an, darum durch 0,9 geteilt
const sdArch = (cx, cy, z, t) => {
  const K = kit(cx, cy, z, t && t.rot), W = (t && t.slot === CSLOT ? 0.44 : 0.3) / 0.9;
  return { K, W, Q: (s, h = 0) => K.P(0, s * W, h), back: K.depth(0, -1) < K.depth(0, 1) ? -1 : 1 };
};
// Basar-Durchsicht 28.10.2026, Paket 4 (Entwürfe tools/basar-entwurf-p4.js, gewählt: Pfau B, Koi-Teich B, Sternbrunnen B): alle drei bewegt
// (ANIM_ITEMS in sternstaub-waren.js). Pfau „sieht scheiße aus“ → schräg mit Rad aus Federaugen, über das ein Schimmer läuft; Koi-Teich
// „Fische wirken tot“ → Kois schwimmen ihre Bahnen und schlagen mit dem Schwanz, Steinlaterne und Schilf; Sternbrunnen „da geht mehr“ →
// Becken als Stern mit gleich breitem Rand, fünf Wasserbögen aus einer Düse, der Stern dreht sich und funkelt
const SD_NEU = (() => {
  const TAU = Math.PI * 2;
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const path = (pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };

  // Pfau: Federaugen als Tropfen nach außen (gelbgrün, türkis, tiefblau, Glanzpunkt), je Farbe ein Pfad für alle Augen; Schimmer läuft übers Rad
  const ellipses = (list, col) => { g.beginPath(); for (const [x, y, rx, ry, a] of list) { g.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); g.ellipse(x, y, rx, ry, a, 0, TAU); } g.fillStyle = col; g.fill(); };
  const fan = (fx, fy, R, z, now) => {
    const a0 = Math.PI - 0.32, a1 = TAU + 0.32;
    g.beginPath(); for (let k = 0; k <= 20; k++) { const a = a0 + (a1 - a0) * k / 20, x = fx + Math.cos(a) * R * z, y = fy + Math.sin(a) * R * 0.9 * z; g.moveTo(x + 2.3 * z, y); g.arc(x, y, 2.3 * z, 0, TAU); }
    g.fillStyle = C('#2e9168'); g.fill();                                                                // Fransen
    g.beginPath(); g.moveTo(fx, fy); g.ellipse(fx, fy, R * z, R * 0.9 * z, 0, a0, a1); g.closePath(); g.fillStyle = C('#1d6a52'); g.fill();
    g.beginPath(); for (let k = 0; k <= 16; k++) { const a = a0 + (a1 - a0) * k / 16; g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * R * 0.97 * z, fy + Math.sin(a) * R * 0.87 * z); }
    g.strokeStyle = C('#62b98f'); g.lineWidth = Math.max(0.5, 0.28 * z); g.stroke();
    const eyes = [];
    for (const [n, rr, s, o] of [[14, 0.9, 1, 0], [10, 0.64, 0.82, 0.5], [6, 0.4, 0.62, 0.5]]) for (let k = 0; k < n; k++) { const a = a0 + 0.14 + (a1 - a0 - 0.28) * (k + o) / (n - 1 + o);
      eyes.push([fx + Math.cos(a) * rr * R * z, fy + Math.sin(a) * rr * R * 0.9 * z, a, s, Math.sin(now / 420 - a * 2.2 + rr * 3) > 0.8]); }
    for (const [r1, r2, off, col] of [[2.4, 1.75, 0, '#a6cf45'], [1.75, 1.3, -0.2, '#1ea89b'], [1.1, 0.82, -0.3, '#1c3c9a']])
      ellipses(eyes.map(([x, y, a, s]) => [x + Math.cos(a) * off * s * z, y + Math.sin(a) * off * s * z, r1 * s * z, r2 * s * z, a]), C(col));
    for (const sh of [false, true]) ellipses(eyes.filter(e => e[4] === sh).map(([x, y, a, s]) => [x - 0.3 * s * z, y - 0.3 * s * z, 0.38 * s * z, 0.38 * s * z, 0]), sh ? '#e6fdff' : C('#58c8f0'));
  };
  const wingBars = (x, y, rx, ry, rot, z) => {
    g.beginPath(); g.ellipse(x, y, rx * z, ry * z, rot, 0, TAU); g.fillStyle = C('#b88a52'); g.fill();
    g.save(); g.beginPath(); g.ellipse(x, y, rx * z, ry * z, rot, 0, TAU); g.clip();
    for (let k = -3; k <= 3; k++) sdLine('#7d5530', 0.28, z, [[x - rx * z, y + k * ry * 0.3 * z - rx * 0.3 * z], [x + rx * z, y + k * ry * 0.3 * z + rx * 0.3 * z]]);
    g.restore();
  };
  const pfau = (cx, cy, z, now) => {
    sdShadow(cx, cy, 11, z);
    g.save(); g.translate(cx + 2.5 * z, cy - 8.5 * z); g.transform(0.72, 0.24, 0, 1, 0, 0); fan(0, 0, 13.5, z, now); g.restore();   // Rad schräg in der Tiefe
    for (const [x0, y0, x1, y1] of [[cx - 0.6 * z, cy - 3 * z, cx - 1 * z, cy], [cx + 1.2 * z, cy - 3 * z, cx + 1.2 * z, cy + 0.4 * z]]) {
      sdLine('#8c8c84', 0.45, z, [[x0, y0], [x1, y1]]); sdLine('#8c8c84', 0.3, z, [[x1 - 0.8 * z, y1 + 0.2 * z], [x1 + 0.8 * z, y1 + 0.2 * z]]); }
    g.beginPath(); g.ellipse(cx, cy - 5.4 * z, 4.8 * z, 3.3 * z, -0.25, 0, TAU); g.fillStyle = C('#1f4fb8'); g.fill();
    g.beginPath(); g.ellipse(cx - 1.6 * z, cy - 6 * z, 2.2 * z, 2.4 * z, -0.25, 0, TAU); g.fillStyle = C('#2f6fe0'); g.fill();
    wingBars(cx + 1.2 * z, cy - 5.6 * z, 3, 1.9, -0.3, z);
    g.lineCap = 'round';
    g.strokeStyle = C('#2a62d4'); g.lineWidth = 2.3 * z; g.beginPath(); g.moveTo(cx - 2.4 * z, cy - 7 * z); g.quadraticCurveTo(cx - 5.2 * z, cy - 10 * z, cx - 3.8 * z, cy - 13.6 * z); g.stroke();
    g.strokeStyle = C('#4f8ff0'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(cx - 3.2 * z, cy - 7.6 * z); g.quadraticCurveTo(cx - 5.6 * z, cy - 10 * z, cx - 4.6 * z, cy - 13 * z); g.stroke();
    const hx = cx - 3.8 * z, hy = cy - 14.8 * z;                                                          // Kopf, Schnabel nach links, Krönchen
    circle(hx, hy, 1.75 * z, C('#2a62d4')); circle(hx - 0.4 * z, hy - 0.5 * z, 0.8 * z, C('#3f80ea'));
    ellipse(hx - 0.5 * z, hy - 0.1 * z, 0.95 * z, 0.42 * z, C('#ffffff')); circle(hx - 0.6 * z, hy - 0.1 * z, 0.36 * z, C('#1a1a22'));
    poly([[hx - 1.5 * z, hy + 0.1 * z], [hx - 3.1 * z, hy + 0.6 * z], [hx - 1.5 * z, hy + 0.9 * z]], C('#c9a46a'));
    for (const d of [-1, 0, 1]) { const tx = hx + (d * 1.1 - 0.6) * z, ty = hy - 4 * z + Math.abs(d) * 0.4 * z;
      sdLine('#2a62d4', 0.22, z, [[hx + d * 0.3 * z, hy - 1.5 * z], [tx, ty]]); ellipse(tx, ty - 0.2 * z, 0.5 * z, 0.75 * z, C('#2fa0c8')); }
  };

  // Koi von oben in der Wasserebene (y halbiert), Kopf vorn; Rücken schlängelt, Schwanz schlägt (ph); Körper als glatter Umriss
  const koi = (x, y, ang, L, base, spots, ph, z, alpha = 1) => {
    g.save(); g.globalAlpha *= alpha; g.translate(x, y); g.scale(1, 0.5); g.rotate(ang);
    const n = 12, k = L / 10, pts = [], r = i => (1.5 - Math.pow(i / n, 1.3) * 1.15) * z * k;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([L * z * (0.45 - u), Math.sin(ph - u * 2.4) * u * u * 1.6 * z * k]); }
    const nrm = i => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
    const [tx, ty] = pts[n], [px, py] = pts[n - 1];
    g.save(); g.translate(tx, ty); g.rotate(Math.atan2(ty - py, tx - px) + Math.sin(ph - 1) * 0.35); g.globalAlpha *= 0.75;     // Schwanzflosse, leicht durchscheinend
    g.beginPath(); g.moveTo(-0.3 * z * k, 0); g.quadraticCurveTo(1.1 * z * k, -0.9 * z * k, 2.3 * z * k, -1.6 * z * k); g.quadraticCurveTo(1.6 * z * k, 0, 2.3 * z * k, 1.6 * z * k); g.quadraticCurveTo(1.1 * z * k, 0.9 * z * k, -0.3 * z * k, 0);
    g.fillStyle = C(base); g.fill(); g.restore();
    for (const s of [-1, 1]) { const [fx, fy] = pts[3], [nx, ny] = nrm(3); g.save(); g.globalAlpha *= 0.75; g.beginPath();
      g.ellipse(fx + nx * s * 1.5 * z * k, fy + ny * s * 1.5 * z * k, 1.1 * z * k, 0.45 * z * k, s * (0.7 + Math.sin(ph * 1.3) * 0.3), 0, TAU); g.fillStyle = C(base); g.fill(); g.restore(); }
    const body = () => { g.beginPath(); const h = pts[0], [hx, hy] = nrm(0);
      g.moveTo(h[0] + hx * r(0), h[1] + hy * r(0)); g.quadraticCurveTo(h[0] + 1.6 * r(0), h[1], h[0] - hx * r(0), h[1] - hy * r(0));
      for (let i = 1; i <= n; i++) { const [nx, ny] = nrm(i); g.lineTo(pts[i][0] - nx * r(i), pts[i][1] - ny * r(i)); }
      for (let i = n; i >= 1; i--) { const [nx, ny] = nrm(i); g.lineTo(pts[i][0] + nx * r(i), pts[i][1] + ny * r(i)); } g.closePath(); };
    body(); g.fillStyle = C(base); g.fill();
    if (spots.length) { g.save(); body(); g.clip(); for (const [col, idx] of spots) for (const i of idx) { const j = Math.round(i * n / 8); circle(pts[j][0] + 0.3 * z * k, pts[j][1] + (i % 2 ? 0.4 : -0.3) * z * k, r(j) * 0.95, C(col)); } g.restore(); }
    sdLine('rgba(255,255,255,0.45)', 0.3 * k, z, [pts[1], pts[6]]);                                      // Glanz auf dem Rücken
    for (const s of [-1, 1]) circle(pts[0][0] + 0.5 * z * k, pts[0][1] + s * 0.75 * z * k, 0.28 * z * k, C('#1a1a22'));
    g.restore();
  };
  const FISH = [
    { base: '#fff6ee', spots: [['#e8452a', [1, 3, 4, 6]]] },                       // Kohaku: weiß mit Rot
    { base: '#ff8a2a', spots: [['#ffb15a', [2, 5]]] },                             // ganz orange
    { base: '#fff6ee', spots: [['#e8452a', [2, 5]], ['#2a2a30', [3, 7]]] },         // Sanke: weiß, rot, schwarz
    { base: '#f5c84b', spots: [['#ffe28a', [1, 4]]] },                             // gelb
  ];
  // Bahnen in der Teichebene (u, v; Teich hat Radius 20): Kreis, Gegenkreis, Acht, kleiner Kreis vorn
  const swim = (k, now) => {
    if (k === 0) { const t = now / 4200; return [11 * Math.cos(t), 11 * Math.sin(t), t + Math.PI / 2]; }
    if (k === 1) { const t = -now / 3100 + 3.6; return [-5 + 7 * Math.cos(t), -3 + 7 * Math.sin(t), t - Math.PI / 2]; }
    if (k === 2) { const t = now / 5200 + 3.4; return [12 * Math.sin(t), 7 * Math.sin(2 * t), Math.atan2(14 * Math.cos(2 * t), 12 * Math.cos(t))]; }
    const t = now / 3600 + 1.5; return [3 + 6 * Math.cos(t), 6 + 4 * Math.sin(t), Math.atan2(4 * Math.cos(t), -6 * Math.sin(t))];
  };
  const STONES = Array.from({ length: 18 }, (_, k) => [k / 18 * TAU + (k % 3) * 0.06, 2.4 + ((k * 7) % 5) * 0.35, ['#b9b1a1', '#a69c8a', '#c4bcae'][k % 3]]);
  const pad = (x, y, r, a, z, flower) => {
    g.beginPath(); g.moveTo(x, y); g.ellipse(x, y, r * z, r * 0.5 * z, 0, a + 0.35, a + TAU - 0.35); g.closePath(); g.fillStyle = C('#4f9e5a'); g.fill();
    g.beginPath(); g.ellipse(x - 0.3 * z, y - 0.2 * z, r * 0.7 * z, r * 0.32 * z, 0, a + 0.5, a + TAU - 0.5); g.strokeStyle = C('#6fbf6a'); g.lineWidth = 0.25 * z; g.stroke();
    if (flower) { for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(b) * 0.9 * z, y - 0.8 * z + Math.sin(b) * 0.45 * z, 0.7 * z, 1.2 * z, b + Math.PI / 2, 0, TAU); g.fillStyle = C(k & 1 ? '#ffb3cf' : '#ff8fb1'); g.fill(); }
      circle(x, y - 1.2 * z, 0.7 * z, C('#ffd23f')); }
  };
  const koiteich = (cx, cy, z, now) => {
    const rx = 21 * z, ry = 10.5 * z, lit = sdLit();
    ellipse(cx, cy + 1.2 * z, rx + 3.5 * z, ry + 2.4 * z, C('#8f866f'));
    ellipse(cx, cy, rx, ry, C('#2b7aa0'));
    const gr = g.createRadialGradient(cx - 4 * z, cy - 1 * z, 1 * z, cx, cy, rx);
    gr.addColorStop(0, C('#86d4ea')); gr.addColorStop(0.7, C('#4aa6cc')); gr.addColorStop(1, C('#2f86ad'));
    g.beginPath(); g.ellipse(cx, cy + 0.6 * z, rx - 1 * z, ry - 1.2 * z, 0, 0, TAU); g.fillStyle = gr; g.fill();
    g.save(); g.beginPath(); g.ellipse(cx, cy + 0.6 * z, rx - 1 * z, ry - 1.2 * z, 0, 0, TAU); g.clip();
    for (const [dx, dy, r] of [[-9, 3, 1.2], [5, 5, 0.9], [11, -1, 1.1], [-3, -5, 0.8], [-14, -1, 0.9]]) ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.5 * z, 'rgba(120,110,80,0.35)');   // Kiesel am Grund
    const fish = [0, 1, 2, 3].map(k => { const [u, v, a] = swim(k, now); return { k, x: cx + u * z, y: cy + v * 0.5 * z, a }; });
    fish.forEach(f => koi(f.x + 0.6 * z, f.y + 2 * z, f.a, f.k === 3 ? 10 : 13, '#1f5f80', [], now / 170 + f.k * 1.7, z, 0.35));   // Schatten am Grund
    ellipse(cx, cy + 0.6 * z, rx, ry, 'rgba(80,170,210,0.18)');                                          // Wasser zwischen Grund und Fischen
    fish.forEach(f => koi(f.x, f.y, f.a, f.k === 3 ? 10 : 13, FISH[f.k].base, FISH[f.k].spots, now / 170 + f.k * 1.7, z));
    for (let k = 0; k < 2; k++) { const p = ((now / 1700 + k * 0.5) % 1), [u, v] = k ? [7, -3] : [-6, 2];  // Ringe, wo ein Fisch hochkam
      g.beginPath(); g.ellipse(cx + u * z, cy + v * z, (1 + p * 6) * z, (0.5 + p * 3) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - p)})`; g.lineWidth = 0.35 * z; g.stroke(); }
    for (const [dx, dy, w] of [[-10, -4, 4], [3, -6, 3], [9, 3, 3.5]]) { const s = Math.sin(now / 900 + dx) * 0.8;   // Glanz auf dem Wasser
      sdLine('rgba(255,255,255,0.75)', 0.35, z, [[cx + (dx + s) * z, cy + dy * z], [cx + (dx + s + w) * z, cy + (dy - 0.3) * z]]); }
    g.restore();
    pad(cx + 12 * z, cy + 2.5 * z, 3.2, 0.6, z, true); pad(cx - 14 * z, cy - 1.5 * z, 2.8, 2.4, false); pad(cx - 10.5 * z, cy + 3.5 * z, 2.2, 4, true);
    const st = STONES.map(([a, r, col]) => [cx + Math.cos(a) * (rx + 0.8 * z), cy + Math.sin(a) * (ry + 0.6 * z) + 0.4 * z, r, col]);   // Randsteine, je Farbe ein Pfad
    ellipses(st.map(([x, y, r]) => [x, y + 0.5 * z, r * z, r * 0.6 * z, 0]), C('#958c7c'));
    for (const col of ['#b9b1a1', '#a69c8a', '#c4bcae']) ellipses(st.filter(q => q[3] === col).map(([x, y, r]) => [x - 0.2 * z, y, r * 0.9 * z, r * 0.5 * z, 0]), C(col));
    ellipses(st.map(([x, y, r]) => [x - 0.6 * z, y - 0.3 * z, r * 0.4 * z, r * 0.2 * z, 0]), 'rgba(255,255,255,0.35)');
    const lx = cx + 13 * z, ly = cy - 8 * z;                                                             // Steinlaterne hinten rechts, nachts mit Licht
    ellipse(lx, ly + 0.5 * z, 3 * z, 1.4 * z, 'rgba(60,50,40,0.25)');
    poly([[lx - 1.8 * z, ly], [lx + 1.8 * z, ly], [lx + 1.4 * z, ly - 1.2 * z], [lx - 1.4 * z, ly - 1.2 * z]], C('#a8a294'));
    poly([[lx - 0.7 * z, ly - 1.2 * z], [lx + 0.7 * z, ly - 1.2 * z], [lx + 0.7 * z, ly - 6 * z], [lx - 0.7 * z, ly - 6 * z]], C('#bdb7aa'));
    poly([[lx - 2 * z, ly - 6 * z], [lx + 2 * z, ly - 6 * z], [lx + 2 * z, ly - 9.4 * z], [lx - 2 * z, ly - 9.4 * z]], C('#c9c3b6'));
    poly([[lx - 1 * z, ly - 6.6 * z], [lx + 1 * z, ly - 6.6 * z], [lx + 1 * z, ly - 8.8 * z], [lx - 1 * z, ly - 8.8 * z]], lit ? '#ffd27a' : C('#5a554c'));
    poly([[lx - 3.4 * z, ly - 9.4 * z], [lx + 3.4 * z, ly - 9.4 * z], [lx + 1.2 * z, ly - 11.6 * z], [lx - 1.2 * z, ly - 11.6 * z]], C('#a8a294'));
    circle(lx, ly - 12.2 * z, 0.8 * z, C('#a8a294'));
    if (lit) glowAt(lx, ly - 7.7 * z, 16 * z, z);
    for (let k = 0; k < 7; k++) { const x = cx - (16 + (k % 3) * 2) * z + k * 0.6 * z, y = cy + (-3 + k * 1.1) * z, h = 8 + (k * 5) % 4, sw = Math.sin(now / 700 + k) * 0.5;   // Schilf, wiegt sich
      sdLine('#4f8f3a', 0.35, z, [[x, y], [x + sw * z, y - h * z]], [x + 0.2 * z, y - h * 0.5 * z]);
      if (k % 2) poly([[x + (sw - 0.45) * z, y - (h - 1) * z], [x + (sw + 0.45) * z, y - (h - 1) * z], [x + (sw + 0.45) * z, y - (h - 3.4) * z], [x + (sw - 0.45) * z, y - (h - 3.4) * z]], C('#7a4f2e')); }
  };

  // Sternbrunnen: Stern dreht sich langsam (Breite cos), Spitzen hell/dunkel geteilt wie geschliffen
  const turnStar = (x, y, r, z, now, lit) => {
    const c = Math.cos(now / 2400), sx = 0.35 + 0.65 * Math.abs(c), L = lit ? '#fff3b0' : C('#f9d65c'), D = lit ? '#ffd94a' : C('#d49c26');
    const P = (a, rr) => [x + Math.cos(a) * rr * sx, y + Math.sin(a) * rr];
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5, tip = P(a, r), il = P(a - Math.PI / 5, r * 0.45), ir = P(a + Math.PI / 5, r * 0.45);
      poly([[x, y], tip, il], c > 0 ? L : D); poly([[x, y], tip, ir], c > 0 ? D : L); }
    if (lit) glowAt(x, y, 24 * z, z);
  };
  const twinkle = (x, y, s, z, col) => poly([[x, y - s * z], [x + 0.3 * s * z, y - 0.3 * s * z], [x + s * z, y], [x + 0.3 * s * z, y + 0.3 * s * z], [x, y + s * z], [x - 0.3 * s * z, y + 0.3 * s * z], [x - s * z, y], [x - 0.3 * s * z, y - 0.3 * s * z]], col);
  // Sternform in der Ebene (u, v), wahlweise um w nach innen versetzt (Gehrung): der Rand ist überall gleich breit
  const starUV = (r, ri, w = 0) => {
    const p = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i & 1 ? ri : r; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    if (!w) return p;
    return p.map((q, i) => {                                                                             // Punkte laufen im Uhrzeigersinn: innen = rechts der Kante
      const a = p[(i + 9) % 10], b = p[(i + 1) % 10], n = (s, e) => { const dx = e[0] - s[0], dy = e[1] - s[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; };
      const n1 = n(a, q), n2 = n(q, b), m = [n1[0] + n2[0], n1[1] + n2[1]], d = n1[0] * m[0] + n1[1] * m[1];
      return [q[0] + m[0] * w / d, q[1] + m[1] * w / d];
    });
  };
  const iso = (cx, cy, z, dy) => uv => uv.map(([u, v]) => [cx + u * z, cy + dy * z + v * 0.5 * z]);
  const sternbrunnen = (cx, cy, z, now) => {
    const lit = sdLit(), R = 22, Ri = 12, H = 3.6, top = cy - H * z, S = starUV(R, Ri);
    poly(iso(cx + 1 * z, cy, z, 1.4)(starUV(R + 1, Ri + 0.6)), 'rgba(40,60,20,0.16)');                  // Schatten in Sternform
    const bot = iso(cx, cy, z, 0)(S), up = iso(cx, cy, z, -H)(S);
    const faces = [];                                                                                    // Wände: nur die nach vorn zeigen, hinten zuerst
    for (let i = 0; i < 10; i++) { const j = (i + 1) % 10, a = S[i], b = S[j], nx = b[1] - a[1], ny = -(b[0] - a[0]);
      if (ny > 0) faces.push({ i, j, nx, y: (bot[i][1] + bot[j][1]) / 2 }); }
    faces.sort((p, q) => p.y - q.y).forEach(f => poly([up[f.i], up[f.j], bot[f.j], bot[f.i]], C(f.nx > 0 ? '#c9bfae' : '#e2d9c9')));
    poly(up, C('#f2ebde'));
    path(up); g.strokeStyle = C('#e0b04a'); g.lineWidth = 0.35 * z; g.lineJoin = 'round'; g.stroke();
    poly(iso(cx, cy, z, -H)(starUV(R, Ri, 2.4)), C('#d8cebd'));                                         // Innenkante (Wasser liegt etwas tiefer)
    const wat = iso(cx, cy, z, -H + 0.6)(starUV(R, Ri, 2.7));
    path(wat); const gr = g.createRadialGradient(cx, top, 1 * z, cx, top, R * z);
    gr.addColorStop(0, lit ? '#a8ecf6' : C('#8fd8ec')); gr.addColorStop(1, lit ? '#4fa8cc' : C('#3f9ec6')); g.fillStyle = gr; g.fill();
    g.save(); path(wat); g.clip();
    for (let k = 0; k < 3; k++) { const p = (now / 1500 + k / 3) % 1;
      g.beginPath(); g.ellipse(cx, top + 0.6 * z, (4 + p * 12) * z, (2 + p * 6) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`; g.lineWidth = 0.3 * z; g.stroke(); }
    g.restore();
    // fünf Wasserbögen aus der Düse in die Zacken: hintere vor der Säule, vordere danach
    const sy = top - 10.5 * z;
    const jets = [0, 1, 2, 3, 4].map(k => { const a = -Math.PI / 2 + k * TAU / 5;
      return { a, sx: cx + Math.cos(a) * 1.3 * z, sy: sy + Math.sin(a) * 0.5 * z, ex: cx + Math.cos(a) * (R - 8) * z, ey: top + 0.6 * z + Math.sin(a) * (R - 8) * 0.5 * z }; });
    const jet = j => { const kx = j.sx + (j.ex - j.sx) * 0.45, ky = sy - 7 * z;
      g.strokeStyle = 'rgba(200,240,252,0.75)'; g.lineWidth = 0.8 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(j.sx, j.sy); g.quadraticCurveTo(kx, ky, j.ex, j.ey); g.stroke();
      for (let d = 0; d < 3; d++) { const p = (now / 700 + d / 3 + j.a) % 1, q = 1 - p; circle(q * q * j.sx + 2 * p * q * kx + p * p * j.ex, q * q * j.sy + 2 * p * q * ky + p * p * j.ey, 0.45 * z, 'rgba(255,255,255,0.95)'); }
      const r = ((now / 600 + j.a) % 1 + 1) % 1; g.beginPath(); g.ellipse(j.ex, j.ey, (0.8 + r * 2) * z, (0.4 + r) * z, 0, 0, TAU); g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - r)})`; g.lineWidth = 0.3 * z; g.stroke(); };
    jets.filter(j => Math.sin(j.a) < 0).forEach(jet);
    ellipse(cx, top + 0.6 * z, 4 * z, 2 * z, C('#d3c9b6')); ellipse(cx, top - 0.2 * z, 3.6 * z, 1.7 * z, C('#ece4d6'));   // Sockel
    poly([[cx - 1.6 * z, top], [cx + 1.6 * z, top], [cx + 1.1 * z, sy], [cx - 1.1 * z, sy]], C('#e8e0d0'));
    poly([[cx + 0.4 * z, top], [cx + 1.6 * z, top], [cx + 1.1 * z, sy], [cx + 0.3 * z, sy]], C('#d3c9b6'));
    ellipse(cx, top - 4 * z, 1.75 * z, 0.7 * z, C('#e0b04a'));
    ellipse(cx, sy + 0.4 * z, 2.2 * z, 0.9 * z, C('#c9962a')); ellipse(cx, sy, 2 * z, 0.8 * z, C('#f5c84b'));   // Düse
    sdLine('#c9962a', 0.6, z, [[cx, sy], [cx, sy - 2.6 * z]]);
    turnStar(cx, sy - 7.4 * z, 6.2 * z, z, now, lit);
    jets.filter(j => Math.sin(j.a) >= 0).forEach(jet);
    for (let k = 0; k < 5; k++) { const p = (now / 1300 + k * 0.23) % 1, a = k * 2.4, s = Math.sin(p * Math.PI) * 1.4;   // Funkeln um den Stern
      if (s > 0.1) { const px = cx + Math.cos(a) * (8 + p * 3) * z, py = sy - 7.4 * z + Math.sin(a) * (6 + p * 2) * z - p * 3 * z; twinkle(px, py, s, z, lit ? '#fff6c8' : 'rgba(255,255,255,0.95)'); if (lit) glowAt(px, py, 6 * z, z); } }
  };
  return { pfau, koiteich, sternbrunnen };
})();
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
    // Laternen hängen an hellen Fäden unter dem Kronenrand, nicht mitten im Laub (Basar-Durchsicht 27.10.2026: „schwarze Zipfel“)
    for (const [dx, top, len, c] of [[-8, -12.5, 2, '#ff8a3d'], [8, -12.5, 2.6, '#ffd23f'], [-12.6, -20.5, 1.8, '#ff5d8f'], [12.4, -20.5, 2.4, '#ff8a3d']]) {
      const x = cx + dx * z, y = cy + (top + len + 2) * z;
      sdLine('#e8d7b0', 0.25, z, [[x, cy + top * z], [x, y - 2 * z]]);
      ellipse(x, y, 1.7 * z, 2 * z, lit ? '#ffe9a0' : C(c));
      ellipse(x - 0.5 * z, y - 0.4 * z, 0.6 * z, 1.2 * z, lit ? '#fff6cf' : 'rgba(255,255,255,0.35)');
      poly([[x - 0.9 * z, y - 2.2 * z], [x + 0.9 * z, y - 2.2 * z], [x + 0.7 * z, y - 1.6 * z], [x - 0.7 * z, y - 1.6 * z]], C('#c9962a'));
      poly([[x - 0.7 * z, y + 1.6 * z], [x + 0.7 * z, y + 1.6 * z], [x + 0.9 * z, y + 2.2 * z], [x - 0.9 * z, y + 2.2 * z]], C('#c9962a'));
      if (lit) sdGlow(x, y, 10 * z, z);
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
  sd_pfau(cx, cy, z, now) { SD_NEU.pfau(cx, cy, z, now); },
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
  sd_lampions(cx, cy, z, now, x, y, t) {                               // Durchgang: zwei Pfosten, Leine, Lampions hängen daran
    const lit = sdLit(), { Q, back } = sdArch(cx, cy, z, t), H = 25;
    for (const sd of [-1, 1]) { const f = Q(sd); ellipse(f[0], f[1] + 0.4 * z, 2.4 * z, 1.1 * z, 'rgba(40,60,20,0.18)'); }
    const post = sd => { const f = Q(sd), tp = Q(sd, H); sdLine('#6b4f3a', 1.5, z, [f, tp]); circle(tp[0], tp[1], 0.95 * z, C('#8a6a4a')); };
    post(back);
    const A = Q(-1, H - 1.2), B = Q(1, H - 1.2), M = Q(0, H - 1.2), Cc = [M[0], M[1] + 7 * z];
    sdLine('#5a4636', 0.45, z, [A, B], Cc);
    ['#ff5d8f', '#ffd23f', '#58b3e8', '#ff8a3d', '#b57bff'].forEach((c, k) => {
      const u = (k + 1) / 6, x0 = (1 - u) ** 2 * A[0] + 2 * u * (1 - u) * Cc[0] + u * u * B[0], y0 = (1 - u) ** 2 * A[1] + 2 * u * (1 - u) * Cc[1] + u * u * B[1];
      sdLine('#5a4636', 0.3, z, [[x0, y0], [x0, y0 + 0.8 * z]]);
      poly([[x0 - 0.9 * z, y0 + 0.7 * z], [x0 + 0.9 * z, y0 + 0.7 * z], [x0 + 0.9 * z, y0 + 1.2 * z], [x0 - 0.9 * z, y0 + 1.2 * z]], C('#5a4636'));
      ellipse(x0, y0 + 3.2 * z, 1.6 * z, 2.1 * z, lit ? '#ffe9a0' : C(c));
      ellipse(x0 - 0.5 * z, y0 + 2.8 * z, 0.5 * z, 1.2 * z, lit ? '#fff6cf' : 'rgba(255,255,255,0.35)');
      if (lit) sdGlow(x0, y0 + 3.2 * z, 9 * z, z);
    });
    post(-back);
  },
  // Basar-Durchsicht 28.10.2026 („relativ klein und nutzlos“, Entwurf B in tools/basar-entwurf-p3.js): größer, mit Blumenkreis, und der
  // Schatten zeigt die Spielzeit – morgens nach rechts, mittags nach hinten, abends nach links, nachts keiner. Neu gemalt alle 10 Spielminuten (CLOCK_SPRITES)
  sd_sonnenuhr(cx, cy, z) {
    const S = 1.6, top = cy - 8 * S * z, h = gameHour(), night = h < 6 || h > 20;
    sdShadow(cx, cy, 7 * S, z);
    const ring = Array.from({ length: 12 }, (_, k) => { const a = k / 12 * Math.PI * 2; return [cx + Math.cos(a) * 10 * z, cy + 1 * z + Math.sin(a) * 4.6 * z, k]; });
    const flower = ([fx, fy, k]) => { sdLine('#4f9e3a', 0.4, z, [[fx, fy], [fx, fy - 2.4 * z]]); ellipse(fx - 0.8 * z, fy - 1 * z, 0.8 * z, 0.4 * z, C('#5aa84f'));
      circle(fx, fy - 2.8 * z, 1.1 * z, C(['#ff8fb1', '#ffd23f', '#ffffff', '#c49bff'][k % 4])); circle(fx, fy - 2.8 * z, 0.4 * z, C('#f5c84b')); };
    ring.filter(p => p[1] < cy + 1 * z).forEach(flower);                 // hintere Blumen vor dem Sockel
    poly([[cx - 2.6 * S * z, cy], [cx + 2.6 * S * z, cy], [cx + 2 * S * z, top + 1 * z], [cx - 2 * S * z, top + 1 * z]], C('#e5dccb'));
    poly([[cx + 0.5 * S * z, cy], [cx + 2.6 * S * z, cy], [cx + 2 * S * z, top + 1 * z], [cx + 0.4 * S * z, top + 1 * z]], C('#d3c8b4'));
    ellipse(cx, top + 1 * z, 6.4 * S * z, 3.2 * S * z, C('#cfc4b0')); ellipse(cx, top, 6 * S * z, 2.9 * S * z, C('#f6efe2'));
    for (let k = 0; k < 12; k++) { const a = Math.PI + k / 11 * Math.PI, r1 = 4.6 * S, r2 = 5.4 * S;    // Stundenstriche auf der hinteren Hälfte
      sdLine('#8a7a62', k % 3 ? 0.25 : 0.45, z, [[cx + Math.cos(a) * r1 * z, top + Math.sin(a) * r1 * 0.48 * z], [cx + Math.cos(a) * r2 * z, top + Math.sin(a) * r2 * 0.48 * z]]); }
    if (!night) {                                                        // Schatten als Band, quer dazu in der Ebene der Scheibe
      const th = Math.PI * (h - 6) / 14, L = 4.4 * S, ex = cx + Math.cos(th) * L * z, ey = top - Math.sin(th) * L * 0.48 * z;
      const n = w => [-Math.sin(th) * w * z, -Math.cos(th) * w * 0.48 * z], [ax, ay] = n(1.6), [bx, by] = n(0.7);
      poly([[cx + ax, top + ay], [ex + bx, ey + by], [ex - bx, ey - by], [cx - ax, top - ay]], 'rgba(70,50,35,0.42)');
    }
    poly([[cx - 0.35 * z, top + 0.1 * z], [cx + 0.35 * z, top + 0.1 * z], [cx, top - 3.6 * S * z]], C('#b8862a'));          // Zeiger: schmales Dreieck
    poly([[cx, top - 3.6 * S * z], [cx + 0.35 * z, top + 0.1 * z], [cx + 2.2 * S * z, top - 0.1 * z]], C('#e0b04a'));
    ring.filter(p => p[1] >= cy + 1 * z).forEach(flower);
  },
  sd_schaukel(cx, cy, z) {
    sdShadow(cx, cy, 10, z);
    for (const s of [-1, 1]) sdLine('#8a5a3c', 1.6, z, [[cx + s * 11 * z, cy + 1 * z], [cx + s * 8 * z, cy - 20 * z], [cx + s * 5 * z, cy + 2 * z]]);
    sdLine('#8a5a3c', 1.6, z, [[cx - 9 * z, cy - 20 * z], [cx + 9 * z, cy - 20 * z]]);
    for (const s of [-1, 1]) sdLine('#5a4636', 0.5, z, [[cx + s * 2.6 * z, cy - 20 * z], [cx + s * 2.6 * z, cy - 6 * z]]);
    poly([[cx - 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 5 * z], [cx - 3.4 * z, cy - 5 * z]], C('#e86f8f'));
    [-6, 0, 6].forEach((dx, k) => circle(cx + dx * z, cy - 20.5 * z, 1.2 * z, C(['#ffb3cf', '#ffffff', '#ffd23f'][k])));
  },
  sd_koiteich(cx, cy, z, now) { SD_NEU.koiteich(cx, cy, z, now); },
  sd_sternbrunnen(cx, cy, z, now) { SD_NEU.sternbrunnen(cx, cy, z, now); },
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
