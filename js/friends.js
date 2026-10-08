'use strict';
// ---------------------------------------------------------------------------
// Freunde auf der Insel (Block 96): Spielfigur, Besucher als Figur, Herzchen, Gästebuch, Päckchen mit Briefkasten
// Datenbank (Regeln: firebase-rules.json):
//   users/<uid>/profile/animal          eigene Figur (Index in ANIMALS)
//   users/<uid>/profile/look            Aussehen der Figur { fur, shirt, hat, face, body, hand } (Block 96c/97, Kopie von state.me)
//   worlds/<wid>/guests/<uid>           wer gerade zu Besuch ist: { a, n, x, y, look } – einmal beim Kommen geschrieben, die
//                                       Figur spaziert dann auf jedem Gerät selbst über die Wege; verschwindet beim Gehen
//   book/<besitzer>/<id>                Besuch (v_…), Herz (h_… je Freund und Tag) und Gästebuch (g_<uid>_<Tag>_<0–2>, alt g…): { k, from, n, a, t, s, at }
//   users/<uid>/bookStats/<freund>      Zähler für Aufgeräumtes (Block 141): { h, v, g, d, u: { h, v, g, d } bis wann gezählt, n, a, last }
//   mail/<empfänger>/<id>               Päckchen { from, n, a, items: { holz: 50 }, at } – Abholen löscht es (genau einmal)
//   on/<uid>                            Online-Status (Block 130): { at: Serverzeit, play } – lesen nur Freunde
// ---------------------------------------------------------------------------
const BOOK_LINES = [
  'Was für eine schöne Insel! 🏝️', 'Dein Schloss ist der Hammer! 🏰', 'Dein Park ist so gemütlich 🌳', 'So viele Blumen! 🌷',
  'Tolle Wege hast du gebaut 🛤️', 'Hier würde ich gern wohnen 🏡', 'Der Hafen ist super 🚢', 'Die Bahn ist klasse 🚆',
  'Ich hab dir ein Herz dagelassen ❤️', 'Liebe Grüße! 👋', 'Ich komme bald wieder! 🙂', 'Wow, alles leuchtet nachts ✨',
  'Deine Bewohner sind so süß 🐾', 'Danke fürs Päckchen! 🎁', 'Was baust du als Nächstes? 🤔', 'Gute Nacht, kleine Insel 🌙',
  'Das Riesenrad ist toll 🎡', 'Schöne Farben! 🎨', 'Dein Rathaus sieht toll aus 🏛️', 'Bis morgen! 👋'];
const BOOK_STICKERS = ['🌷', '🌳', '🏰', '❤️', '⭐', '🐾', '🎉', '🌈', '☀️', '🌙', '🍰', '🎁'];
const BOOK_PER_DAY = 3;                                                    // Gästebuch: je Besucher und Tag (Regel: Schlüssel g_<uid>_<Tag>_<0–2>)
const MAIL_PER_DAY = 5, MAIL_MAX = 1e9;                                // keine 100.000er-Grenze mehr (Block 129)
const dayKey = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const frLS = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem('kachelhausen_fr_' + k)); localStorage.setItem('kachelhausen_fr_' + k, JSON.stringify(v)); } catch (e) { return null; } };

// --- eigene Figur --------------------------------------------------------------------------
// Auf dem eigenen Gerät kommt sie aus dem Spielstand (state.me, Block 97 – me.js). Beim Besuch (VISIT) gehört der
// Spielstand dem Gastgeber; dann kommt sie aus dem Profil in der Cloud (me.js schreibt es bei jeder Änderung).
let myAnimal = null, myLook = null;
async function friendAnimal(uid) {
  if (!VISIT) return (myAnimal = meLook().a);
  if (myAnimal != null) return myAnimal;
  const a = await cloudApi.get(`users/${uid}/profile/animal`);
  return (myAnimal = Number.isInteger(a) && ANIMALS[a] ? a : 0);
}
async function friendLook(uid) {
  if (!VISIT) return (myLook = lookClean(meLook()));
  if (myLook) return myLook;
  return (myLook = lookClean(await cloudApi.get(`users/${uid}/profile/look`).catch(() => null)));
}
const wearPick = (slot, v) => typeof v === 'string' && WEAR[slot][v] ? v : null;
const lookClean = l => ({ fur: Number.isInteger(l && l.fur) && FUR[l.fur] ? l.fur : null, shirt: Number.isInteger(l && l.shirt) && SHIRTS[l.shirt] ? l.shirt : 0,
  hat: wearPick('hat', l && l.hat), face: wearPick('face', l && l.face), body: wearPick('body', l && l.body), hand: wearPick('hand', l && l.hand) });
// Figur aus Tier + Aussehen (wie ein Bewohner gezeichnet, mit Namensschild)
function figFrom(a, look, label) {
  const an = ANIMALS[a] || ANIMALS[0], L = lookClean(look);
  return { kind: Math.max(0, ANIMALS.indexOf(an)), fur: L.fur != null ? FUR[L.fur] : an.fur || FUR[0], shirt: SHIRTS[L.shirt] || SHIRTS[0],
    hat: L.hat, face: L.face, body: L.body, hand: L.hand, label: String(label || 'Besuch').slice(0, 30) };
}
// Vorschaubild einer Figur (Rathaus, Freunde-Fenster); z = Größe
function figPreview(cv, fig, z = 3.2) {
  const c = cv.getContext && cv.getContext('2d');
  if (!c) return;
  const og = g, ots = toScreen;
  g = c; toScreen = () => ({ x: cv.width / 2 - 6 * z, y: cv.height - 4 * z });
  try { c.clearRect(0, 0, cv.width, cv.height); drawWalker({ ...fig, label: null, px: 1e6, py: 1e6, wait: 1, speed: 0.5, full: true }, z, 0); }   // Vorschau in voller Größe (Block 115)
  finally { g = og; toScreen = ots; }
}

// --- Figuren der Besucher (gezeichnet wie Bewohner, mit Namensschild) -------------------------
const visitorFigs = [];
// guests: { uid: { a, n, x, y } } aus der Insel; skip: eigene Kennung (sich selbst nicht doppelt zeigen)
// Startfeld: begehbar, nah am Rathaus (sonst am angegebenen Feld)
function guestSpawn(x, y) {
  const h = townHallAt(), cx = Math.round(h ? h[0] + 1 : x), cy = Math.round(h ? h[1] + 1 : y);   // ganze Felder (ISLAND.cx ist 2,5)
  // am liebsten vorn vor dem Rathaus (Bildschirm-unten = großes x+y), dort gern auf dem Weg (Block 97)
  const ds = h ? doorsOf(h.join(',')) : [], best = Math.max(...ds.map(([a, b]) => a + b));
  const front = ds.filter(([a, b]) => a + b >= best - 1), wegs = front.filter(([a, b]) => bAt(a, b) === 'weg');
  const pool = wegs.length ? wegs : front;
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (walkable(cx + dx, cy + dy)) return [cx + dx, cy + dy];
  }
  return [Math.round(x) || 0, Math.round(y) || 0];
}
function setGuests(guests, skip = null) {
  const gs = guests || {}, before = new Set(visitorFigs.map(f => f.uid));
  for (let i = visitorFigs.length - 1; i >= 0; i--) if (!gs[visitorFigs[i].uid] || visitorFigs[i].uid === skip) visitorFigs.splice(i, 1);
  for (const [uid, v] of Object.entries(gs)) {
    if (uid === skip || !v) continue;
    let f = visitorFigs.find(o => o.uid === uid);
    if (!f) {
      const [sx, sy] = guestSpawn(v.x, v.y);
      f = { uid, fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 1, speed: 0.45 };
      visitorFigs.push(f);
      if (!before.has(uid) && !VISIT && cloudUser) toast(`${(ANIMALS[v.a] || ANIMALS[0]).icon} ${String(v.n || 'Besuch')} ist zu Besuch!`);
    }
    Object.assign(f, figFrom(v.a, v.look, v.n));                     // Aussehen kann sich ändern
  }
}
// spazieren wie die Bewohner: Feld für Feld, gern auf Wegen (nichts wird übertragen – jedes Gerät lässt sie selbst laufen)
setInterval(() => {
  for (const f of visitorFigs) {
    stepMover(f, 0.05, (x, y) => walkable(x, y), true);
    if (f.gone) { const [sx, sy] = guestSpawn(f.fx, f.fy); Object.assign(f, { gone: false, fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 1 }); }
  }
}, 50);
// Besitzer (führendes Gerät): eigene Besucher sehen – zuschauende Geräte und Besucher bekommen sie mit der Insel
let guestsOff = null, guestsWid = null;
function guestsWatch() {
  if (guestsOff && guestsWid !== liveWid) { guestsOff(); guestsOff = null; visitorFigs.length = 0; }   // neuer Besuchs-Link: neue Welt
  if (guestsOff || !cloudUser || !cloudApi.watch || !liveWid) return;
  guestsWid = liveWid;
  guestsOff = cloudApi.watch(`worlds/${liveWid}/guests`, g => setGuests(g));
}
setInterval(() => { if (cloudUser && !VISIT && cloudIsLeader()) guestsWatch(); else if (guestsOff && !cloudUser) { guestsOff(); guestsOff = null; } }, 3000);
// Konto gewechselt (Geschwister am selben iPad) oder abgemeldet: nichts vom alten Konto behalten – Code, Freunde, Link,
// Figur, Post. Aufgerufen aus cloudOnUser.
let socialUid;
function socialReset() {
  const uid = cloudUser ? cloudUser.uid : null;
  if (uid === socialUid) return;
  socialUid = uid;
  if (frOff) { frOff(); frOff = null; }
  frMine = null; frList = {};
  liveWid = null; liveOpen = false; liveSent = null;
  myAnimal = null; myLook = null;
  if (guestsOff) { guestsOff(); guestsOff = null; }
  guestsWid = null; visitorFigs.length = 0;
  if (bookOff) bookOff(); if (mailOff) mailOff(); if (statsOff) statsOff();
  bookOff = mailOff = statsOff = null; bookAll = {}; mailAll = {}; statsAll = {}; bookLoaded = mailLoaded = welcomeDone = false; fbShown = null;
  if (bondsOff) bondsOff(); if (wishOff) wishOff();
  bondsOff = wishOff = null; myBonds = {}; myWish = null; wishWid = null; wishAt = 0;
  if (typeof meProfileUid !== 'undefined') { meProfileUid = null; meProfileLook = null; }
}

// --- Besuch bei Freunden: Figur, Besuch eintragen, Herz, Gästebuch ---------------------------------
let visitUser = null, visitOwner = null, visitFriend = false, visitPosAt = 0, visitLast = '';
function visitOnUser(u) {
  visitUser = u ? { uid: u.uid, display: u.displayName || '' } : null;
  visitFriendCheck();
}
async function visitFriendCheck() {
  if (!visitUser || !visitOwner || visitOwner === visitUser.uid) { visitFriend = false; visitUi(); return; }
  try { visitFriend = ((await cloudApi.get(`fr/${visitUser.uid}/${visitOwner}`)) || {}).st === 'freund'; } catch (e) { visitFriend = false; }
  visitUi();
  if (!visitFriend) return;
  if (visitUser.nick == null) visitUser.nick = String((await cloudApi.get(`users/${visitUser.uid}/profile/name`).catch(() => '')) || '').trim().slice(0, 20);
  const a = await friendAnimal(visitUser.uid).catch(() => 0);
  const me = { from: visitUser.uid, n: visitName(), a };
  cloudApi.set(`book/${visitOwner}/v_${visitUser.uid}_${dayKey()}`, { k: 'v', ...me, at: cloudApi.TS() })   // einmal am Tag
    .then(() => { const bk = 'bv_' + visitUser.uid + '_' + visitOwner; if (frLS(bk) !== dayKey()) { frLS(bk, dayKey()); bondAdd(visitUser.uid, visitOwner, BOND_PTS.visit); } })   // je Konto (Geschwister am selben iPad)   // Freundschaft (Block 105)
    .catch(() => {});
  const look = await friendLook(visitUser.uid);
  const [x, y] = guestSpawn(0, 0);
  const here = () => {
    cloudApi.set(`worlds/${VISIT}/guests/${visitUser.uid}`, { a, n: visitName(), x, y, look }).catch(() => {});   // ich bin da
    if (cloudApi.leave) cloudApi.leave(`worlds/${VISIT}/guests/${visitUser.uid}`);   // Seite zu → Figur weg
  };
  here();
  // nach einem kurzen Verbindungsabbruch (iPad gesperrt, WLAN) hat onDisconnect die Figur gelöscht – alle 45 s neu melden
  if (!visitHereTimer) visitHereTimer = setInterval(() => { if (visitFriend && !document.hidden) here(); }, 45000);
}
let visitHereTimer = null;
const visitName = () => (visitUser.nick || (visitUser.display || 'Besuch').split(' ')[0]).slice(0, 20);   // Name auf dem Schild (Profil, Block 111)
async function visitHeart() {
  const key = `h_${visitUser.uid}_${dayKey()}`;
  if (frLS('heart_' + visitOwner) === dayKey()) { toast('❤️ Heute hast du hier schon ein Herz dagelassen'); return; }
  try {
    await cloudApi.set(`book/${visitOwner}/${key}`, { k: 'h', from: visitUser.uid, n: visitName(), a: myAnimal || 0, at: cloudApi.TS() });
    frLS('heart_' + visitOwner, dayKey());
    bondAdd(visitUser.uid, visitOwner, BOND_PTS.heart);
    toast('❤️ Herz dagelassen!');
  } catch (e) {
    const err = String((e && (e.code || e.message)) || '');
    toast(/permission/i.test(err) ? '❤️ Ging nicht – heute schon eins dagelassen (oder die Datenbank-Regeln sind noch alt)' : '❤️ Ging nicht – keine Verbindung?');
  }
}
function visitBook() {
  let line = 0, sticker = 0;
  const draw = () => {
    openModal(`<h2>📖 Ins Gästebuch von ${escHtml(state.town.name)}</h2>
      <div class="label">Was möchtest du schreiben?</div>
      <div class="book-lines">${BOOK_LINES.map((l, i) => `<button class="look${i === line ? ' on' : ''}" data-bl="${i}">${escHtml(l)}</button>`).join('')}</div>
      <div class="label">Sticker</div>
      <div class="book-st">${BOOK_STICKERS.map((s, i) => `<button class="look${i === sticker ? ' on' : ''}" data-bs="${i}" aria-label="Sticker ${s}">${s}</button>`).join('')}</div>
      <div class="row"><button class="btn ghost" id="m-close">Abbrechen</button><button class="btn" id="bk-send" style="flex:1">${BOOK_STICKERS[sticker]} Eintragen</button></div>`);
    for (const b of document.querySelectorAll('[data-bl]')) b.onclick = () => { line = +b.dataset.bl; draw(); };
    for (const b of document.querySelectorAll('[data-bs]')) b.onclick = () => { sticker = +b.dataset.bs; draw(); };
    $('m-close').onclick = closeModal;
    $('bk-send').onclick = async () => {
      const n = frLS('book_' + dayKey()) || 0;
      if (n >= BOOK_PER_DAY) { toast(`📖 Heute hast du schon ${BOOK_PER_DAY} Einträge geschrieben – morgen wieder`); return; }
      // Block 141: g_<ich>_<Tag>_<0–2> – die Regeln lassen je Tag nur diese drei zu (nie überschreiben); belegt (anderes Gerät): nächster
      let ok = false, err = null;
      for (let i = n; i < BOOK_PER_DAY && !ok; i++) {
        try { await cloudApi.set(`book/${visitOwner}/g_${visitUser.uid}_${dayKey()}_${i}`, { k: 'g', from: visitUser.uid, n: visitName(), a: myAnimal || 0, t: line, s: sticker, at: cloudApi.TS() }); ok = true; frLS('book_' + dayKey(), i + 1); }
        catch (e) { err = e; if (!/permission/i.test(String((e && (e.code || e.message)) || ''))) break; }
      }
      if (ok) { bondAdd(visitUser.uid, visitOwner, BOND_PTS.book); closeModal(); toast('📖 Eingetragen!'); }
      else if (err && /permission/i.test(String(err.code || err.message || ''))) { frLS('book_' + dayKey(), BOOK_PER_DAY); toast(`📖 Heute hast du hier schon ${BOOK_PER_DAY} Einträge geschrieben – morgen wieder`); }
      else toast('📖 Ging nicht – keine Verbindung?');
    };
  };
  draw();
}

// --- Besitzer: Gästebuch, Herzen, Besuche, Briefkasten (Fenster „Du“ → Freunde, Block 98) -------------
let bookAll = {}, mailAll = {}, bookOff = null, mailOff = null, bookLoaded = false, mailLoaded = false, statsAll = {}, statsOff = null;
const mailWaiting = () => Object.keys(mailAll).length > 0;
function friendsInboxWatch() {
  if (!cloudUser || VISIT || !cloudApi.watch) return;
  const uid = cloudUser.uid;
  if (!bookOff) bookOff = cloudApi.watch(`book/${uid}`, v => {
    const old = bookAll; bookAll = v || {};
    if (bookLoaded) for (const [id, e] of Object.entries(bookAll)) if (!old[id] && e) toast(e.k === 'h' ? `❤️ ${e.n} hat dir ein Herz dagelassen` : e.k === 'g' ? `📖 ${e.n} hat ins Gästebuch geschrieben` : e.k === 'd' ? `💛 ${e.n} sagt Danke für dein Päckchen` : `👋 ${e.n} war zu Besuch`);
    bondFromBook(uid);
    if (!bookLoaded) bookFold(uid).catch(() => {});
    bookLoaded = true;                                                  // erst ab dem zweiten Mal melden (das erste ist der Bestand)
    friendsDot(); welcomeBack();
  });
  if (!statsOff) statsOff = cloudApi.watch(`users/${uid}/bookStats`, v => { statsAll = v || {}; });   // Zähler (Block 141)
  if (!mailOff) mailOff = cloudApi.watch(`mail/${uid}`, v => {
    const old = mailAll; mailAll = v || {};
    for (const [id, m] of Object.entries(mailAll)) if (!old[id] && m) toast(`${m.sv ? '🎁 Souvenir' : '📬 Päckchen'} von ${m.n} – oben unter 🌐 Online → Freunde`);
    groundVersion++;                                                    // Briefkasten-Fähnchen am Rathaus neu zeichnen
    mailLoaded = true;
    friendsDot(); welcomeBack();
  });
}
setInterval(() => { if (cloudUser && !VISIT) { friendsInboxWatch(); if (typeof frWatch === 'function') frWatch(); welcomeBack(); } else if (!cloudUser && (bookOff || mailOff)) { if (bookOff) bookOff(); if (mailOff) mailOff(); if (statsOff) statsOff(); bookOff = mailOff = statsOff = null; bookAll = {}; mailAll = {}; statsAll = {}; bookLoaded = mailLoaded = welcomeDone = false; } }, 3000);   // Freundesliste immer beobachten (Namen auffrischen, Freundesschiffe, Block 112)
// Freundesbuch klein halten (Block 141): Besuche, Herzen und Danke älter als BOOK_DAYS und Gästebuch-Einträge hinter den neuesten
// BOOK_KEEP_G wandern in Zähler je Freund (users/<uid>/bookStats) und werden gelöscht – so bleiben die Zahlen für immer, aber jedes
// Gerät lädt beim Start nur ein kleines Buch. Transaktion mit „u“ (bis wann je Art gezählt): zwei Geräte zählen nichts doppelt;
// ein Eintrag, der gezählt, aber noch nicht gelöscht ist, zählt in der Anzeige nicht noch einmal (bookPeople)
const BOOK_DAYS = 30, BOOK_KEEP_G = 200, BOOK_KINDS = ['h', 'v', 'g', 'd'];
async function bookFold(uid) {
  if (viewOnly() || !cloudApi.tx || !cloudApi.update) return;
  const cut = Date.now() - BOOK_DAYS * 864e5, list = Object.entries(bookAll).filter(([, e]) => e && BOOK_KINDS.includes(e.k) && e.from);
  const gOld = new Set(list.filter(([, e]) => e.k === 'g').sort((p, q) => (q[1].at || 0) - (p[1].at || 0)).slice(BOOK_KEEP_G).map(([id]) => id));
  const go = list.filter(([id, e]) => e.k === 'g' ? gOld.has(id) : (e.at || 0) < cut);
  if (!go.length) return;
  const by = {};
  for (const [id, e] of go) (by[e.from] = by[e.from] || []).push([id, e]);
  const del = {};
  for (const [f, items] of Object.entries(by)) {
    try {
      await cloudApi.tx(`users/${uid}/bookStats/${f}`, cur => {
        const c = { h: 0, v: 0, g: 0, d: 0, n: '', a: 0, last: 0, ...(cur || {}) }, u0 = { ...(c.u || {}) }, u = { ...u0 };
        for (const [, e] of items) {
          const at = e.at || 0;
          if (at <= (u0[e.k] || 0)) continue;                             // schon gezählt (anderes Gerät)
          c[e.k] = (+c[e.k] || 0) + 1; u[e.k] = Math.max(u[e.k] || 0, at);
          if (at >= (+c.last || 0)) { c.last = at; c.n = String(e.n || c.n || '').slice(0, 30); c.a = Number.isInteger(e.a) ? e.a : c.a; }
        }
        return { ...c, u };
      });
      for (const [id] of items) del[`book/${uid}/${id}`] = null;
    } catch (e) { /* nächstes Mal */ }
  }
  if (Object.keys(del).length) await cloudApi.update(del);
}
// Wer war da (Block 141): je Freund Zähler + noch nicht gezählte Einträge, zuletzt Dagewesene zuerst
function bookPeople() {
  const P = {}, get = f => P[f] || (P[f] = { from: f, n: 'Freund', a: 0, h: 0, v: 0, g: 0, d: 0, last: 0 });
  for (const [f, s] of Object.entries(statsAll)) {
    if (!s || typeof s !== 'object') continue;
    const p = get(f);
    for (const k of BOOK_KINDS) p[k] += Math.max(0, +s[k] || 0);
    if (s.n) p.n = String(s.n); if (Number.isInteger(s.a)) p.a = s.a; p.last = Math.max(p.last, +s.last || 0);
  }
  for (const e of Object.values(bookAll)) {
    if (!e || !BOOK_KINDS.includes(e.k) || !e.from) continue;
    const u = (statsAll[e.from] && statsAll[e.from].u) || {}, at = e.at || 0;
    if (at <= (u[e.k] || 0)) continue;                                    // steckt schon im Zähler
    const p = get(e.from);
    p[e.k]++;
    if (at >= p.last) { p.last = at; p.n = e.n || p.n; p.a = Number.isInteger(e.a) ? e.a : p.a; }
  }
  return Object.values(P).filter(p => p.h + p.v + p.g + p.d > 0).sort((p, q) => q.last - p.last);
}
const bookSeen = () => (cloudUser && frLS('seen_' + cloudUser.uid)) || 0;
const bookNew = () => Object.values(bookAll).filter(e => e && (e.at || 0) > bookSeen()).length;
const netCount = () => (cloudUser && !VISIT ? Object.values(mailAll).filter(Boolean).length + bookNew() : 0);
// Zahl am Knopf 🌐 (Block 98/111)
function friendsDot() { netDotShow(); }
// „Während du weg warst“ (Block 111): beim Öffnen einmal zeigen, was seit dem letzten Reinschauen kam – sobald Gästebuch und
// Briefkasten geladen sind und kein anderes Fenster offen ist. Gemerkt pro Konto (wb_), damit es nach dem Neuladen nicht
// wiederkommt; 🌐 behält die Zahl, bis man unter Freunde nachsieht.
let welcomeDone = false, welcomeAt = 0;
function welcomeBackLines() {
  const uid = cloudUser.uid, wb = +frLS('wb_' + uid) || 0, icon = e => (ANIMALS[e.a] || ANIMALS[0]).icon;
  const since = Math.max(bookSeen(), wb) || Date.now() - 3 * 864e5;      // erstes Mal auf diesem Gerät: nur die letzten 3 Tage
  const book = Object.values(bookAll).filter(e => e && (e.at || 0) > since).sort((p, q) => (q.at || 0) - (p.at || 0));
  const mails = Object.values(mailAll).filter(m => m && (m.at || 0) > wb);
  welcomeAt = Math.max(0, ...book.map(e => e.at || 0), ...mails.map(m => m.at || 0));   // Serverzeit, nicht die Uhr des Geräts
  return [...mails.map(m => `${icon(m)} ${m.sv ? '🎁' : '📬'} <b>${escHtml(m.n)}</b> hat dir ${m.sv ? 'ein Souvenir' : 'ein Päckchen'} geschickt`),
    ...book.map(e => `${icon(e)} ${e.k === 'g' ? `📖 <b>${escHtml(e.n)}</b> hat ins Gästebuch geschrieben: „${escHtml(BOOK_LINES[e.t] || '')}“`
      : e.k === 'h' ? `❤️ <b>${escHtml(e.n)}</b> hat dir ein Herz dagelassen` : e.k === 'd' ? `💛 <b>${escHtml(e.n)}</b> sagt Danke für dein Päckchen`
      : `👋 <b>${escHtml(e.n)}</b> war zu Besuch`}`)];
}
function welcomeBack() {
  if (welcomeDone || !cloudUser || VISIT || !bookLoaded || !mailLoaded) return;
  if (!$('modal').hidden || document.hidden || state.tutorial >= 0 || cloudState !== 'ok') return;   // später nochmal (Intervall unten); nicht während des Abgleichs
  welcomeDone = true;
  const lines = welcomeBackLines();
  if (!lines.length) return;
  frLS('wb_' + cloudUser.uid, welcomeAt);
  const more = lines.length - 6;
  openModal(`<h2>💌 Während du weg warst</h2>
    <div class="wb-list">${lines.slice(0, 6).map(l => `<p>${l}</p>`).join('')}${more > 0 ? `<p class="muted">… und ${more} weitere</p>` : ''}</div>
    <div class="row"><button class="btn" id="wb-go" style="flex:1">Ansehen</button><button class="btn ghost" id="wb-later">Später</button></div>`);
  $('wb-go').onclick = () => openNet('freunde');
  $('wb-later').onclick = closeModal;
  sfx('deco');
}
// part 'post': Briefkasten (nur wenn etwas drin ist) · 'book': Herzen, Gästebuch, wer da war (Block 98: im Fenster „Du → Freunde“)
function friendsHallHtml(part) {
  if (!cloudUser) return '';
  const list = Object.entries(bookAll).filter(([, e]) => e).sort((p, q) => (q[1].at || 0) - (p[1].at || 0));
  const hearts = list.filter(([, e]) => e.k === 'h'), today = dayKey();
  const icon = e => (ANIMALS[e.a] || ANIMALS[0]).icon, when = e => e.at ? new Date(e.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '';
  const mails = Object.entries(mailAll).filter(([, m]) => m);
  if (part === 'post') return mails.length ? `
    <div class="label">📬 Briefkasten</div>
    ${mails.map(([id, m]) => `<div class="fr-row"><span>${icon(m)} Von ${escHtml(m.n)}: ${m.sv ? `🎁 ${escHtml(svKind(m.sv.k).name)}` : ''}${Object.entries(m.items || {}).filter(([r]) => RES[r]).map(([r, n]) => `${RES[r].icon} ${fmt(n)}`).join(' ')}</span>
      <span class="fr-btns"><button class="btn small" data-mget="${escHtml(id)}">Abholen</button></span></div>`).join('')}` : '';
  // Freundesbuch (Block 141): oben die Zahlen, dann je Freund eine Zeile, Gästebuch die neuesten 10 („Ältere anzeigen“)
  const people = bookPeople(), tot = k => people.reduce((n, p) => n + p[k], 0), seen = fbShown && Date.now() - fbShown.at < 60000 ? fbShown.seen : bookSeen();   // neu aufgebaut: Hinweis bleibt
  const fresh = list.filter(([, e]) => (e.at || 0) > seen), nk = k => fresh.filter(([, e]) => e.k === k).length;
  const newText = [[nk('h'), 'Herz', 'Herzen'], [nk('v'), 'Besuch', 'Besuche'], [nk('g'), 'Gästebuch-Eintrag', 'Gästebuch-Einträge'], [nk('d'), 'Danke', 'Danke']]
    .filter(([n]) => n).map(([n, one, more]) => `${n} ${n === 1 ? one : more}`).join(', ');
  const ago = at => !at ? '' : dayKey(new Date(at)) === today ? 'heute' : dayKey(new Date(at - 0)) === dayKey(new Date(Date.now() - 864e5)) ? 'gestern' : new Date(at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  const counts = p => [[p.h, '❤️'], [p.v, '👋'], [p.g, '📖'], [p.d, '💛']].filter(([n]) => n).map(([n, i]) => `${i} ${fmt(n)}`).join(' · ');
  const gs = list.filter(([, e]) => e.k === 'g');
  return `
    <div class="label">💌 Freundesbuch</div>
    <div class="fb-sum">${[['h', '❤️', 'Herz', 'Herzen'], ['v', '👋', 'Besuch', 'Besuche'], ['g', '📖', 'Eintrag', 'Einträge'], ['d', '💛', 'Danke', 'Danke']]
      .filter(([k]) => k !== 'd' || tot('d')).map(([k, i, one, more]) => `<span>${i} <b>${fmt(tot(k))}</b> ${tot(k) === 1 ? one : more}</span>`).join('')}</div>
    ${newText ? `<p class="ok">✨ Neu seit deinem letzten Blick: ${newText}</p>` : ''}
    <div class="label">👋 Wer war da</div>
    ${people.length ? people.map((p, i) => `<div class="fr-row fb-p"${i >= 8 ? ' hidden' : ''}><span>${(ANIMALS[p.a] || ANIMALS[0]).icon} ${escHtml(p.n)} <small class="fb-c">${counts(p)}</small></span><small class="muted">${ago(p.last)}</small></div>`).join('')
      + (people.length > 8 ? `<div class="row"><button class="btn ghost small" data-fbmore="p">Alle ${people.length} anzeigen</button></div>` : '')
      : '<p class="muted">Noch niemand – teile deinen Freundescode.</p>'}
    <div class="label">📖 Gästebuch${tot('g') ? ` · ${fmt(tot('g'))}` : ''}</div>
    ${gs.map(([id, e], i) => `<div class="fr-row fb-g"${i >= 10 ? ' hidden' : ''}><span>${BOOK_STICKERS[e.s] || ''} <b>${escHtml(e.n)}</b> ${icon(e)}: ${escHtml(BOOK_LINES[e.t] || '')} <small class="muted">${when(e)}</small></span>
      <span class="fr-btns"><button class="btn ghost small" data-bdel="${escHtml(id)}" aria-label="Eintrag entfernen">✕</button></span></div>`).join('') || '<p class="muted">Noch leer.</p>'}
    ${gs.length > 10 ? '<div class="row"><button class="btn ghost small" data-fbmore="g">Ältere anzeigen</button></div>' : ''}`;
}
let fbShown = null;                                                      // { seen, at }: was beim Öffnen „neu“ war (Block 141)
function wireFriendsHall(card) {
  if (!fbShown || Date.now() - fbShown.at >= 60000) fbShown = { seen: bookSeen(), at: Date.now() };
  if (cloudUser) frLS('seen_' + cloudUser.uid, Math.max(+frLS('seen_' + cloudUser.uid) || 0, ...Object.values(bookAll).map(e => (e && e.at) || 0)));   // gelesen – nach Serverzeit (Block 112)
  friendsDot();
  for (const b of card.querySelectorAll('[data-mget]')) b.onclick = () => mailClaim(b.dataset.mget);
  for (const b of card.querySelectorAll('[data-fbmore]')) b.onclick = () => {        // mehr zeigen, ohne neu zu zeichnen (Block 141)
    const rows = [...card.querySelectorAll(b.dataset.fbmore === 'p' ? '.fb-p[hidden]' : '.fb-g[hidden]')];
    rows.slice(0, b.dataset.fbmore === 'p' ? rows.length : 20).forEach(r => { r.hidden = false; });
    if (rows.length <= (b.dataset.fbmore === 'p' ? rows.length : 20)) b.parentElement.remove();
  };
  for (const b of card.querySelectorAll('[data-bdel]')) b.onclick = async () => { try { await cloudApi.set(`book/${cloudUser.uid}/${b.dataset.bdel}`, null); openNet('freunde'); } catch (e) { toast('Hat nicht geklappt'); } };
}
// Abholen: genau einmal (Transaktion löscht das Päckchen), dann ins Lager
async function mailClaim(id) {
  if (viewOnly()) { cloudBlocked(); return; }
  const uid = cloudUser.uid;
  let got = null;
  try {
    const r = await cloudApi.tx(`mail/${uid}/${id}`, cur => { if (!cur) return undefined; got = cur; return null; });
    if (!r.ok || !got) { toast('📬 Das Päckchen wurde schon abgeholt'); openNet('freunde'); return; }
  } catch (e) { toast('Hat nicht geklappt – später nochmal'); return; }
  const add = {};
  for (const [r, n] of Object.entries(got.items || {})) if (RES[r] && isFinite(n) && n > 0) { const v = Math.min(n, MAIL_MAX); state.res[r] = (state.res[r] || 0) + v; add[r] = v; }
  const sv = got.sv && typeof svReceive === 'function' ? svReceive(id, got) : null;   // Souvenir: ins Sammelregal (Block 129)
  cloudTouched(); save();
  const parts = Object.entries(add).map(([r, n]) => `+${fmt(n)} ${RES[r].icon}`);
  if (sv) parts.push(`🎁 ${svKind(sv.k).name} (steht im Album im Sammelregal)`);
  toast(`📬 ${parts.join(' ') || 'leer'} von ${got.n}`);
  mailThanks(uid, id, got, add);                                        // Freundschaft, Wunschzettel, Danke (Block 105)
  openNet('freunde');
}

// --- Päckchen schicken: Rohstoffe nur noch für den Wunschzettel (Block 129; Geschenke sind Souvenirs, souvenir.js) -----------
// Was ich für den aktuellen Wunsch eines Freundes schon geschickt habe – auch, was er noch nicht abgeholt hat. base: wie weit
// der Wunsch beim ersten Schicken war; so zählt Abgeholtes nicht doppelt
const wishSentKey = uid => 'wsent_' + (cloudUser ? cloudUser.uid : '') + '_' + uid;
function wishSent(uid, w) { const v = frLS(wishSentKey(uid)); return v && w && v.at === w.at && v.r === w.r ? { n: +v.n || 0, base: +v.base || 0 } : { n: 0, base: w ? w.got : 0 }; }
function wishSentAdd(uid, w, n) { const v = wishSent(uid, w); frLS(wishSentKey(uid), { at: w.at, r: w.r, n: v.n + n, base: v.n ? v.base : w.got }); }
const wishCovered = (uid, w) => { const v = wishSent(uid, w); return Math.max(w.got, v.n ? v.base + v.n : 0); };   // abgeholt oder von mir unterwegs
const mailFailText = uid => frList[uid] && frList[uid].st === 'freund' ? '🎁 Ging gerade nicht – keine Verbindung? Gleich nochmal versuchen' : '🎁 Ging nicht – ihr seid nicht mehr befreundet';
function mailCompose(friendUid, name, wish = null) {
  if (viewOnly()) { cloudBlocked(); return; }
  if (!wish) return;
  const sent = (frLS('mail_' + dayKey()) || {})[friendUid] || 0;
  if (sent >= MAIL_PER_DAY) { toast(`🎁 Heute schon ${MAIL_PER_DAY} Päckchen an ${name} – morgen wieder`); return; }
  const r = wish.r, need = Math.max(0, wish.n - wishCovered(friendUid, wish)), have = Math.floor(state.res[r] || 0), max = Math.min(need, have);
  const pick = { [r]: max };
  const draw = () => {
    openModal(`<h2>🎁 ${escHtml(name)} helfen</h2>
      <p class="ok">📌 ${escHtml(name)} wünscht sich ${RES[r].icon} ${fmt(wish.n)} ${RES[r].name} – es fehlen noch ${fmt(need)}.</p>
      ${have ? `<div class="fr-row"><span>${RES[r].icon} ${RES[r].name} <small class="muted">(${fmt(have)} da)</small></span>
        <span class="fr-btns"><button class="btn ghost small" data-mm="-1" aria-label="weniger">−</button><b>${fmt(pick[r])}</b><button class="btn ghost small" data-mm="1" aria-label="mehr">+</button></span></div>`
        : '<p class="muted">Du hast gerade nichts davon.</p>'}
      <p class="muted">Geht sofort aus deinem Lager ab. ${escHtml(name)} holt es am Briefkasten ab. Noch ${MAIL_PER_DAY - sent} Päckchen heute.</p>
      <div class="row"><button class="btn ghost" id="m-close">Abbrechen</button><button class="btn" id="mm-send" style="flex:1" ${pick[r] > 0 ? '' : 'disabled'}>🎁 Schicken</button></div>`);
    for (const b of document.querySelectorAll('[data-mm]')) b.onclick = () => {
      const step = Math.max(1, Math.round(Math.max(10, max / 10) / 10) * 10) * Math.sign(+b.dataset.mm);
      pick[r] = Math.max(0, Math.min(max, pick[r] + step)); draw();
    };
    $('m-close').onclick = () => openFriends();
    $('mm-send').onclick = () => mailSend(friendUid, name, pick, wish);
  };
  draw();
}
let mailBusy = false;
async function mailSend(friendUid, name, pick, wish = null) {
  if (mailBusy) return;
  if (viewOnly()) { cloudBlocked(); return; }
  if (((frLS('mail_' + dayKey()) || {})[friendUid] || 0) >= MAIL_PER_DAY) { toast(`🎁 Heute schon ${MAIL_PER_DAY} Päckchen an ${name} – morgen wieder`); return; }
  const items = {};
  for (const [r, n] of Object.entries(pick)) if (RES[r] && n > 0 && state.res[r] >= n) items[r] = Math.floor(n);
  if (!Object.keys(items).length) return;
  for (const [r, n] of Object.entries(items)) state.res[r] -= n;     // erst abziehen, dann schicken; klappt es nicht: zurück
  mailBusy = true;
  if ($('mm-send')) $('mm-send').disabled = true;
  try {
    const a = await friendAnimal(cloudUser.uid).catch(() => 0);
    const forWish = !!(wish && items[wish.r] > 0);
    await cloudApi.set(`mail/${friendUid}/m${Date.now().toString(36)}${cloudUser.uid.slice(0, 6)}`, { from: cloudUser.uid, n: myNick(), a, items, at: cloudApi.TS(), ...(forWish ? { wish: true } : {}) });
    bondAdd(cloudUser.uid, friendUid, forWish ? BOND_PTS.wish : BOND_PTS.mail);
    if (forWish) wishSentAdd(friendUid, wish, items[wish.r]);            // „unterwegs“ beim Wunsch (Block 129)
    const log = frLS('mail_' + dayKey()) || {}; log[friendUid] = (log[friendUid] || 0) + 1; frLS('mail_' + dayKey(), log);
    cloudTouched(); save(); closeModal(); toast(`🎁 Päckchen an ${name} ist unterwegs`);
  } catch (e) {
    for (const [r, n] of Object.entries(items)) state.res[r] += n;
    toast(mailFailText(friendUid));
    if ($('mm-send')) $('mm-send').disabled = false;
  } finally { mailBusy = false; }
}


// ---------------------------------------------------------------------------
// Füreinander (Block 105): Freundschaftsstufen, Wunschzettel mit Danke, Partnerstadt, Freundesschiffe
// Datenbank:
//   users/<uid>/bonds/<freund>   { p: Punkte, seen: bis wann Empfangenes gezählt ist } – jeder führt seine eigene Sicht
//   worlds/<wid>/wish            { r, n, got, at } – ein Wunsch, Freunde lesen ihn (Regel der Insel), nur der Besitzer schreibt
//   book/<helfer>/d_<ich>_<id>   Danke fürs Päckchen { k: 'd', from, n, a, at }
//   fr/<freund>/<ich>/flag       { c, s } meine Flagge, damit Freunde Partnerstadt und Schiffe zeigen können
// ---------------------------------------------------------------------------
const BOND_STEPS = [3, 10, 25, 50, 100];                                 // Punkte für 1 … 5 Herzen
const BOND_PTS = { visit: 1, heart: 1, book: 2, mail: 2, wish: 3, gotVisit: 1, gotHeart: 1, gotBook: 2 };
const bondLevel = p => BOND_STEPS.filter(s => (p || 0) >= s).length;
const bondHearts = p => { const n = bondLevel(p); return '♥'.repeat(n) + '♡'.repeat(5 - n); };
let myBonds = {}, bondsOff = null, bondSeenMax = 0, bondSeenUid = null;   // höchste schon gemeldete Stufe – je Konto (Block 112)
async function bondAdd(me, other, n) {
  if (!me || !other || me === other || !cloudApi || !cloudApi.tx) return;
  try { await cloudApi.tx(`users/${me}/bonds/${other}/p`, cur => (+cur || 0) + n); } catch (e) { /* nächstes Mal */ }
}
// Empfangenes aus dem Gästebuch zählen – per Transaktion mit „seen“, so zählt jedes Gerät jeden Eintrag nur einmal
function bondFromBook(uid) {
  if (VISIT || !cloudApi.tx) return;
  const by = {};
  for (const e of Object.values(bookAll)) if (e && e.from && e.from !== uid && (e.k === 'v' || e.k === 'h' || e.k === 'g')) (by[e.from] = by[e.from] || []).push(e);
  for (const [f, list] of Object.entries(by)) {
    cloudApi.tx(`users/${uid}/bonds/${f}`, cur => {
      const c = cur || {}, seen = +c.seen || 0, fresh = list.filter(e => (e.at || 0) > seen);
      if (!fresh.length) return undefined;                                // nichts Neues: nicht schreiben
      const add = fresh.reduce((s, e) => s + (e.k === 'g' ? BOND_PTS.gotBook : e.k === 'h' ? BOND_PTS.gotHeart : BOND_PTS.gotVisit), 0);
      return { p: (+c.p || 0) + add, seen: Math.max(seen, ...fresh.map(e => e.at || 0)) };
    }).catch(() => {});
  }
}
// höchste Stufe in den Spielstand: schaltet Kleidung und Deko frei, wird nie kleiner
function bondSync() {
  if (VISIT || viewOnly()) return;
  const best = Math.max(0, ...Object.values(myBonds).map(b => bondLevel(b && b.p)));
  if (best <= (state.bond || 0)) return;
  if (cloudUser && bondSeenUid !== cloudUser.uid) { bondSeenUid = cloudUser.uid; bondSeenMax = +(frLS('bondmax_' + cloudUser.uid) || 0); }
  const fresh = best > bondSeenMax;                                       // wirklich neu – oder nur nach dem Laden wiederhergestellt?
  bondSeenMax = Math.max(bondSeenMax, best);
  state.bond = best; save(); buildToolbar();
  if (!fresh) return;
  if (cloudUser) frLS('bondmax_' + cloudUser.uid, best);
  const gift = { 2: 'das Freundschaftsband für deine Figur', 3: 'den Herzballon für deine Figur', 4: 'die Freundesbank', 5: 'den Freundschaftsbaum' }[best];
  toast(`💛 Freundschaft mit ${best} ${best === 1 ? 'Herz' : 'Herzen'}!${gift ? ` Neu: ${gift}` : ''}`);
}
// --- Wunschzettel ---
let myWish = null, wishOff = null, wishWid = null, wishAt = 0;
// Ein Wunsch hängt 24 Stunden (Wunsch Nutzer, 09.10.2026), dann verschwindet er von selbst – gemessen an der Uhr des Servers
// (at ist ein Server-Zeitstempel; Geräteuhren gehen verschieden). Abgelaufen = wie kein Wunsch: Freunde sehen ihn nicht, Hilfe zählt nicht
const WISH_TTL = 24 * 3600 * 1000;
const wishNow = () => cloudApi && cloudApi.now ? cloudApi.now() : Date.now();
const wishExpired = v => !!v && wishNow() - (+v.at || 0) >= WISH_TTL;
const wishClean = v => v && RES[v.r] && v.n > 0 && !wishExpired(v) ? { r: v.r, n: Math.floor(v.n), got: Math.max(0, Math.floor(+v.got || 0)), at: +v.at || 0 } : null;
function wishLeft(w) {                                                 // „noch 5 Std.“ / „noch 40 Min.“
  const min = Math.max(1, Math.ceil((WISH_TTL - (wishNow() - w.at)) / 60000));
  return min >= 60 ? `noch ${Math.round(min / 60)} Std.` : `noch ${min} Min.`;
}
// eigener Wunsch: alle 20 s nachsehen (eine Beobachtung auf eine noch nicht geschriebene Welt lehnen die Regeln ab – sie stürbe still)
function wishWatch(force = false) {
  if (!cloudUser || VISIT || !liveWid || !cloudApi.get) return;
  if (!force && wishWid === liveWid && Date.now() - wishAt < 20000) return;
  wishWid = liveWid; wishAt = Date.now();
  const wid = liveWid;
  cloudApi.get(`worlds/${wid}/wish`).then(v => {
    if (wishWid !== wid) return;
    myWish = wishClean(v);
    // abgelaufen: selbst abnehmen – sonst sähen Freunde mit einer älteren App-Version ihn weiter
    if (v && wishExpired(v) && !viewOnly()) cloudApi.update({ [`worlds/${wid}/wish`]: null }).catch(() => {});
  }).catch(() => {});
}
async function wishSet(r, n) {
  if (viewOnly()) { cloudBlocked(); return false; }
  const uid = cloudUser.uid, wid = await liveWorldId();
  await cloudApi.update({ [`worlds/${wid}/wish`]: r ? { r, n: Math.floor(n), got: 0, at: cloudApi.TS() } : null, [`worlds/${wid}/owner`]: uid });   // owner: falls die Insel noch nicht geschrieben ist
  myWish = r ? { r, n: Math.floor(n), got: 0, at: wishNow() } : null;
  return true;
}
// Vorschlag: was den nächsten Laternen fehlt (sonst Bretter)
function wishSuggest() {
  for (const type of Object.keys(LM_STAGES)) {
    const i = restoreInfo(type);
    if (!i.next || !i.pos || !ownedTile(i.pos[0], i.pos[1])) continue;
    for (const [r, need] of Object.entries(i.mat || {})) if (RES[r] && (state.res[r] || 0) < need) return { r, n: Math.ceil((need - (state.res[r] || 0)) / 50) * 50 };
  }
  return { r: RES.bretter ? 'bretter' : Object.keys(RES)[0], n: 100 };
}
const WISH_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000];
function wishHtml() {
  if (!cloudUser) return `<div class="label">📌 Wunschzettel</div><p class="muted">Mit ☁️ Online und Freunden kannst du hier einen Wunsch aushängen – Freunde helfen dir mit Päckchen.</p>`;
  const w = myWish && !wishExpired(myWish) ? myWish : null;          // läuft auch ab, während das Fenster offen ist
  const inBox = w ? Object.values(mailAll).reduce((s, m) => s + ((m && m.items && +m.items[w.r]) || 0), 0) : 0;   // geschickt, noch nicht abgeholt
  return `<div class="label">📌 Wunschzettel</div>${w ? `<div class="hall-row"><span>${RES[w.r].icon} ${fmt(Math.min(w.got, w.n))} / ${fmt(w.n)} ${RES[w.r].name}${w.got >= w.n ? ' · <b class="ok">✓ erfüllt!</b>' : ` <small class="muted">· ${wishLeft(w)}</small>`}</span>
      <span><button class="btn ghost small" data-wishset="1">${w.got >= w.n ? 'Neuer Wunsch' : 'Ändern'}</button> <button class="btn ghost small" data-wishoff="1">Abnehmen</button></span></div><div class="wish-bar"><i style="width:${Math.min(100, w.got / w.n * 100)}%"></i></div>
      ${inBox > 0 ? `<p class="ok">📬 ${RES[w.r].icon} ${fmt(inBox)} liegen schon in deinem Briefkasten – unter 🌐 → Freunde abholen, dann zählt es.</p>` : ''}`
    : `<p class="muted">Häng einen Wunsch aus – deine Freunde sehen ihn 24 Stunden lang und können mit Päckchen helfen.</p><div class="row"><button class="btn small" data-wishset="1">📌 Wunsch aushängen</button></div>`}`;
}
function openWishPicker() {
  if (viewOnly()) { cloudBlocked(); return; }
  const sug = myWish && myWish.got < myWish.n ? myWish : wishSuggest();
  let r = sug.r, n = WISH_AMOUNTS.reduce((b, a) => Math.abs(a - sug.n) < Math.abs(b - sug.n) ? a : b, WISH_AMOUNTS[1]);
  const draw = () => {
    openModal(`<h2>📌 Wunschzettel</h2>
      <p class="muted">Was brauchst du? Deine Freunde sehen den Wunsch 24 Stunden lang unter 👥 und können dir etwas schicken. Für jede Hilfe gibt es ein Danke und eure Freundschaft wächst.</p>
      <div class="label">Material</div>
      <div class="book-st">${Object.keys(RES).map(id => `<button class="look${id === r ? ' on' : ''}" data-wr="${id}" aria-label="${RES[id].name}">${RES[id].icon}</button>`).join('')}</div>
      <p><b>${RES[r].icon} ${RES[r].name}</b></p>
      <div class="label">Menge</div>
      <div class="looks">${WISH_AMOUNTS.map(a => `<button class="look${a === n ? ' on' : ''}" data-wn="${a}">${fmt(a)}</button>`).join('')}</div>
      <div class="row">${myWish ? '<button class="btn ghost" id="wish-off">Abnehmen</button>' : ''}<button class="btn ghost" id="m-close">Zurück</button><button class="btn" id="wish-ok" style="flex:1">📌 Aushängen</button></div>`);
    for (const b of document.querySelectorAll('[data-wr]')) b.onclick = () => { r = b.dataset.wr; draw(); };
    for (const b of document.querySelectorAll('[data-wn]')) b.onclick = () => { n = +b.dataset.wn; draw(); };
    $('m-close').onclick = () => openTownHall('overview');
    $('wish-ok').onclick = async () => { try { if (await wishSet(r, n)) { toast(`📌 Wunsch ausgehängt: ${RES[r].icon} ${fmt(n)} ${RES[r].name}`); openTownHall('overview'); } } catch (e) { toast('Hat nicht geklappt'); } };
    if ($('wish-off')) $('wish-off').onclick = async () => { try { if (await wishSet(null)) { toast('📌 Wunsch abgenommen'); openTownHall('overview'); } } catch (e) { toast('Hat nicht geklappt'); } };
  };
  draw();
}
// Päckchen abgeholt: Freundschaft, Wunsch füllen, Danke an den Absender
async function mailThanks(uid, id, got, add) {
  bondAdd(uid, got.from, got.wish ? BOND_PTS.wish : BOND_PTS.mail);
  if (got.wish || (myWish && add[myWish.r])) {                         // auch Päckchen ohne Merker zählen (Block 129)
    try {
      const wid = await liveWorldId();
      const r = await cloudApi.tx(`worlds/${wid}/wish`, cur => { const w = wishClean(cur); if (!w || !add[w.r] || w.got >= w.n) return undefined; return { ...cur, got: Math.min(w.n, w.got + add[w.r]) }; });
      const w = r && r.ok && wishClean(r.val);
      if (w) { myWish = w; wishWid = wid; if (w.got >= w.n) toast(`📌 Wunsch erfüllt: ${RES[w.r].icon} ${fmt(w.n)} ${RES[w.r].name} – danke, ${got.n}!`); }
    } catch (e) { /* Wunsch inzwischen weg */ }
  }
  try { cloudApi.set(`book/${got.from}/d_${uid}_${id}`, { k: 'd', from: uid, n: myNick(), a: await friendAnimal(uid).catch(() => 0), at: cloudApi.TS() }).catch(() => {}); } catch (e) { /* egal */ }
}
// --- Flaggen der Freunde, Partnerstadt ---
const myFlag = () => ({ c: String(state.town.color), s: String(state.town.symbol) });
// Flaggen kommen von anderen Spielern: nur #rrggbb und ein Symbol aus der festen Liste (landet in style="" und auf der Leinwand)
const flagOk = f => !!f && typeof f.c === 'string' && /^#[0-9a-f]{6}$/i.test(f.c) && FLAG_SYMBOLS.includes(f.s);
// eigene Flagge und Namen bei den Freunden auffrischen (für Partnerstadt und Schiffe auf ihren Inseln)
function frPushFlag() {
  if (!cloudUser || VISIT || !cloudApi.update) return;
  const uid = cloudUser.uid, upd = {};
  for (const [f, e] of Object.entries(frList)) if (e && e.st === 'freund') { upd[`fr/${f}/${uid}/flag`] = myFlag(); upd[`fr/${f}/${uid}/name`] = frMyName(); }
  if (Object.keys(upd).length) cloudApi.update(upd).catch(() => {});
}
// Flagge eines Freundes: aus seinem Eintrag, sonst aus seiner Insel (einmal je Sitzung)
const frFlagCache = {};
async function friendFlag(id, e) {
  if (e && flagOk(e.flag)) return { c: e.flag.c, s: e.flag.s };
  if (frFlagCache[id]) return frFlagCache[id];
  if (!e || !e.wid) return null;
  try { const rest = await cloudApi.get(`worlds/${e.wid}/rest`), town = rest && JSON.parse(rest).town, f = town && { c: town.color, s: town.symbol }; if (flagOk(f)) return (frFlagCache[id] = f); } catch (err) { /* keine */ }
  return null;
}
async function togglePartner(id, e) {
  if (viewOnly()) { cloudBlocked(); return; }
  if (state.partner && state.partner.uid === id) { state.partner = null; cloudTouched(); save(); toast('🚩 Keine Partnerstadt mehr'); return; }
  const f = await friendFlag(id, e);
  if (!f) { toast('🚩 Seine Flagge ist gerade nicht zu sehen – später nochmal'); return; }
  state.partner = { uid: id, name: String(e.name || 'Freund').slice(0, 40), c: String(f.c).slice(0, 20), s: String(f.s).slice(0, 8) };
  cloudTouched(); save();
  toast(`🚩 ${state.partner.name} ist jetzt deine Partnerstadt – die Flagge weht am Rathaus`);
}
// --- Freundesschiffe: ab und zu legt ein Boot mit der Flagge eines Freundes am Hafen an (nur Bild, keine Daten) ---
function friendBoats() {
  const flags = [], seen = new Set(), add = (uid, f) => { if (flagOk(f) && !seen.has(uid) && flags.length < 3) { seen.add(uid); flags.push(f); } };
  if (state.partner) add(state.partner.uid, state.partner);
  if (!VISIT) for (const [id, e] of Object.entries(frList || {})) if (e && e.st === 'freund') add(id, flagOk(e.flag) ? e.flag : frFlagCache[id]);
  if (!flags.length) return [];
  let hk = null;
  for (const [k, t] of state.tiles) if (t.b === 'hafen') { hk = k; break; }
  const r = hk && openSeaRoute(hk);
  if (!r) return [];
  const out = [], now = Date.now(), CYC = 300e3;                       // alle 5 Minuten, 2 davon zu sehen
  flags.forEach((f, i) => {
    const ph = ((now + i * 97e3) % CYC) / CYC;
    if (ph > 0.4) return;
    const k = ph / 0.4, inn = k < 0.4, d = inn ? (1 - k / 0.4) * r.len : k < 0.6 ? 0 : (k - 0.6) / 0.4 * r.len;
    const [px, py, du, dv] = routeAt(r, Math.max(0, Math.min(r.len, d)) + 0.6 + i * 0.5);
    out.push({ boat: true, flag: f, px, py, du: inn ? -du : du, dv: inn ? -dv : dv });
  });
  return out;
}
setInterval(() => {
  if (!cloudUser || VISIT) return;
  if (!bondsOff && cloudApi.watch) bondsOff = cloudApi.watch(`users/${cloudUser.uid}/bonds`, v => { myBonds = v || {}; bondSync(); });
  if (!liveWid && cloudApi.get) liveWorldId().catch(() => {});
  wishWatch();
  bondSync();                                                            // nach Laden/Übernehmen/Neuer Insel wieder herstellen
}, 3000);

// ---------------------------------------------------------------------------
// Online-Status (Block 130): Solange das Spiel sichtbar offen ist, meldet es sich jede Minute (on/<uid> = { at, play: true },
// at = Serverzeit). Weggeklickt, gesperrt oder abgemeldet: play false; ist die Seite einfach weg, setzt der Server es
// (onDisconnect). Grün zeigen Freunde nur bei frischer Meldung – ein schlafendes iPad meldet sich nicht immer ab.
// Lesen dürfen nur Freunde (firebase-rules.json). Alte App-Versionen schreiben nichts: dann steht beim Freund gar nichts
// ---------------------------------------------------------------------------
const ON_BEAT = 60e3, ON_FRESH = 3 * 60e3;
let onUid = null, onLast = 0;
function onlineBeat(play = !document.hidden) {
  if (!cloudUser || !cloudApi || !cloudApi.set) return Promise.resolve();
  const uid = cloudUser.uid, p = `on/${uid}`;
  onUid = uid; onLast = Date.now();
  if (play && cloudApi.onLeave) cloudApi.onLeave(p, { at: cloudApi.TS(), play: false });   // nach jedem Verbindungsabbruch neu nötig
  return cloudApi.set(p, { at: cloudApi.TS(), play: !!play }).catch(() => {});
}
// Text zum Status eines Freundes (now: Serverzeit); null = unbekannt (alte App-Version, nie gemeldet)
function onlineText(o, now) {
  if (!o || typeof o.at !== 'number') return null;
  const ago = Math.max(0, now - o.at), min = Math.floor(ago / 60e3), h = Math.floor(ago / 3600e3), d = Math.floor(ago / 86400e3);
  if (o.play === true && ago < ON_FRESH) return { on: true, text: 'spielt gerade' };
  const when = min < 2 ? 'gerade eben' : min < 60 ? `vor ${min} Min.` : h < 24 ? `vor ${h} Std.` : d < 2 ? 'gestern' : d < 31 ? `vor ${d} Tagen` : 'vor über einem Monat';
  return { on: false, text: 'zuletzt ' + when };
}
const onlineHtml = (id, o) => { const s = onlineText(o, cloudApi && cloudApi.now ? cloudApi.now() : Date.now());
  return `<span class="fr-on${s && s.on ? ' on' : ''}" data-fron="${escHtml(id)}">${s ? (s.on ? '<i aria-hidden="true"></i>' : '') + escHtml(s.text) : ''}</span>`; };
const frOnline = {};                                                     // zuletzt gelesener Status je Freund
async function onlineRead(ids) {
  await Promise.all(ids.map(async id => { frOnline[id] = await cloudApi.get(`on/${id}`).catch(() => frOnline[id] || null); }));
}
// offene Freundesliste: Status alle 30 s auffrischen, nur die Anzeige (Eingaben bleiben stehen)
async function onlineRefresh() {
  const els = [...document.querySelectorAll('[data-fron]')];
  if (!els.length || !cloudUser || $('modal').hidden) return;
  await onlineRead(els.map(el => el.dataset.fron));
  for (const el of document.querySelectorAll('[data-fron]')) el.outerHTML = onlineHtml(el.dataset.fron, frOnline[el.dataset.fron]);
}
setInterval(() => {
  if (!cloudUser) { onUid = null; return; }
  if (!document.hidden && (onUid !== cloudUser.uid || Date.now() - onLast >= ON_BEAT)) onlineBeat(true);
}, 5000);
setInterval(() => { onlineRefresh().catch(() => {}); }, 30000);
document.addEventListener('visibilitychange', () => { if (cloudUser) onlineBeat(!document.hidden); });
window.addEventListener('pagehide', () => { if (cloudUser) onlineBeat(false); });
