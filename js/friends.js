'use strict';
// ---------------------------------------------------------------------------
// Freunde auf der Insel (Block 96): Spielfigur, Besucher als Figur, Herzchen, Gästebuch, Päckchen mit Briefkasten
// Datenbank (Regeln: firebase-rules.json):
//   users/<uid>/profile/animal          eigene Figur (Index in ANIMALS)
//   users/<uid>/profile/look            Aussehen der Figur { fur, shirt, hat, face, body, hand } (Block 96c/97, Kopie von state.me)
//   worlds/<wid>/guests/<uid>           wer gerade zu Besuch ist: { a, n, x, y, look } – einmal beim Kommen geschrieben, die
//                                       Figur spaziert dann auf jedem Gerät selbst über die Wege; verschwindet beim Gehen
//   book/<besitzer>/<id>                Besuch (v_…), Herz (h_… je Freund und Tag) und Gästebuch (g…): { k, from, n, a, t, s, at }
//   mail/<empfänger>/<id>               Päckchen { from, n, a, items: { holz: 50 }, at } – Abholen löscht es (genau einmal)
// ---------------------------------------------------------------------------
const BOOK_LINES = [
  'Was für eine schöne Insel! 🏝️', 'Dein Schloss ist der Hammer! 🏰', 'Dein Park ist so gemütlich 🌳', 'So viele Blumen! 🌷',
  'Tolle Wege hast du gebaut 🛤️', 'Hier würde ich gern wohnen 🏡', 'Der Hafen ist super 🚢', 'Die Bahn ist klasse 🚆',
  'Ich hab dir ein Herz dagelassen ❤️', 'Liebe Grüße! 👋', 'Ich komme bald wieder! 🙂', 'Wow, alles leuchtet nachts ✨',
  'Deine Bewohner sind so süß 🐾', 'Danke fürs Päckchen! 🎁', 'Was baust du als Nächstes? 🤔', 'Gute Nacht, kleine Insel 🌙',
  'Das Riesenrad ist toll 🎡', 'Schöne Farben! 🎨', 'Dein Rathaus sieht toll aus 🏛️', 'Bis morgen! 👋'];
const BOOK_STICKERS = ['🌷', '🌳', '🏰', '❤️', '⭐', '🐾', '🎉', '🌈', '☀️', '🌙', '🍰', '🎁'];
const MAIL_PER_DAY = 5, MAIL_MAX = 100000;
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
  try { c.clearRect(0, 0, cv.width, cv.height); drawWalker({ ...fig, label: null, px: 1e6, py: 1e6, wait: 1, speed: 0.5 }, z, 0); }
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
  if (bookOff) bookOff(); if (mailOff) mailOff();
  bookOff = mailOff = null; bookAll = {}; mailAll = {}; bookLoaded = false;
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
  const a = await friendAnimal(visitUser.uid).catch(() => 0);
  const me = { from: visitUser.uid, n: visitName(), a };
  cloudApi.set(`book/${visitOwner}/v_${visitUser.uid}_${dayKey()}`, { k: 'v', ...me, at: cloudApi.TS() })   // einmal am Tag
    .then(() => { if (frLS('bv_' + visitOwner) !== dayKey()) { frLS('bv_' + visitOwner, dayKey()); bondAdd(visitUser.uid, visitOwner, BOND_PTS.visit); } })   // Freundschaft (Block 105)
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
const visitName = () => (visitUser.display || 'Besuch').split(' ')[0];
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
      if (n >= 3) { toast('📖 Heute hast du schon 3 Einträge geschrieben – morgen wieder'); return; }
      try {
        await cloudApi.set(`book/${visitOwner}/g${Date.now().toString(36)}${visitUser.uid.slice(0, 6)}`, { k: 'g', from: visitUser.uid, n: visitName(), a: myAnimal || 0, t: line, s: sticker, at: cloudApi.TS() });
        frLS('book_' + dayKey(), n + 1); bondAdd(visitUser.uid, visitOwner, BOND_PTS.book); closeModal(); toast('📖 Eingetragen!');
      } catch (e) { toast('Hat nicht geklappt'); }
    };
  };
  draw();
}

// --- Besitzer: Gästebuch, Herzen, Besuche, Briefkasten (Fenster „Du“ → Freunde, Block 98) -------------
let bookAll = {}, mailAll = {}, bookOff = null, mailOff = null, bookLoaded = false;
const mailWaiting = () => Object.keys(mailAll).length > 0;
function friendsInboxWatch() {
  if (!cloudUser || VISIT || !cloudApi.watch) return;
  const uid = cloudUser.uid;
  if (!bookOff) bookOff = cloudApi.watch(`book/${uid}`, v => {
    const old = bookAll; bookAll = v || {};
    if (bookLoaded) for (const [id, e] of Object.entries(bookAll)) if (!old[id] && e) toast(e.k === 'h' ? `❤️ ${e.n} hat dir ein Herz dagelassen` : e.k === 'g' ? `📖 ${e.n} hat ins Gästebuch geschrieben` : e.k === 'd' ? `💛 ${e.n} sagt Danke für dein Päckchen` : `👋 ${e.n} war zu Besuch`);
    bondFromBook(uid);
    if (!bookLoaded) bookTidy(uid);
    bookLoaded = true;                                                  // erst ab dem zweiten Mal melden (das erste ist der Bestand)
    friendsDot();
  });
  if (!mailOff) mailOff = cloudApi.watch(`mail/${uid}`, v => {
    const old = mailAll; mailAll = v || {};
    for (const [id, m] of Object.entries(mailAll)) if (!old[id] && m) toast(`📬 Päckchen von ${m.n} – oben unter 🌐 Online → Freunde`);
    groundVersion++;                                                    // Briefkasten-Fähnchen am Rathaus neu zeichnen
    friendsDot();
  });
}
setInterval(() => { if (cloudUser && !VISIT) friendsInboxWatch(); else if (!cloudUser && (bookOff || mailOff)) { if (bookOff) bookOff(); if (mailOff) mailOff(); bookOff = mailOff = null; bookAll = {}; mailAll = {}; } }, 3000);
// alte Besuche und Herzen (älter als 60 Tage) räumt der Besitzer weg, sonst wächst das Buch ewig; Gästebuch bleibt
function bookTidy(uid) {
  if (viewOnly()) return;
  const old = Date.now() - 60 * 864e5, upd = {};
  for (const [id, e] of Object.entries(bookAll)) if (e && (e.k === 'v' || e.k === 'h' || e.k === 'd') && e.at && e.at < old) upd[`book/${uid}/${id}`] = null;
  if (Object.keys(upd).length && cloudApi.update) cloudApi.update(upd).catch(() => {});
}
const bookSeen = () => (cloudUser && frLS('seen_' + cloudUser.uid)) || 0;
const bookNew = () => Object.values(bookAll).filter(e => e && (e.at || 0) > bookSeen()).length;
// Punkt am Knopf „Du“ (Block 98) – und das offene Freunde-Fenster zeigt Neues gleich
function friendsDot() {
  const d = document.getElementById('net-dot');
  if (d) d.hidden = !netNews();
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
    ${mails.map(([id, m]) => `<div class="fr-row"><span>${icon(m)} Von ${escHtml(m.n)}: ${Object.entries(m.items || {}).filter(([r]) => RES[r]).map(([r, n]) => `${RES[r].icon} ${fmt(n)}`).join(' ')}</span>
      <span class="fr-btns"><button class="btn small" data-mget="${escHtml(id)}">Abholen</button></span></div>`).join('')}` : '';
  return `
    ${list.some(([, e]) => e.k === 'd') ? `<div class="label">💛 Danke</div><p>${list.filter(([, e]) => e.k === 'd').slice(0, 20).map(([, e]) => `${icon(e)} ${escHtml(e.n)} sagt Danke für dein Päckchen <small class="muted">${when(e)}</small>`).join('<br>')}</p>` : ''}
    <div class="label">❤️ Herzen · ${hearts.length}</div>
    <p>${hearts.slice(0, 30).map(([, e]) => `<span title="${escHtml(e.n)} · ${when(e)}">${icon(e)}❤️</span>`).join(' ') || '<span class="muted">Noch keine</span>'}</p>
    <div class="label">📖 Gästebuch</div>
    ${list.filter(([, e]) => e.k === 'g').slice(0, 50).map(([id, e]) => `<div class="fr-row"><span>${BOOK_STICKERS[e.s] || ''} <b>${escHtml(e.n)}</b> ${icon(e)}: ${escHtml(BOOK_LINES[e.t] || '')} <small class="muted">${when(e)}</small></span>
      <span class="fr-btns"><button class="btn ghost small" data-bdel="${escHtml(id)}" aria-label="Eintrag entfernen">✕</button></span></div>`).join('') || '<p class="muted">Noch leer.</p>'}
    <div class="label">👋 Zu Besuch waren</div>
    <p>${list.filter(([, e]) => e.k === 'v').slice(0, 30).map(([, e]) => `${icon(e)} ${escHtml(e.n)}${e.at && dayKey(new Date(e.at)) === today ? ' (heute)' : ` (${when(e)})`}`).join(' · ') || '<span class="muted">Noch niemand – teile deinen Freundescode.</span>'}</p>`;
}
function wireFriendsHall(card) {
  if (cloudUser) frLS('seen_' + cloudUser.uid, Date.now() + 5000);     // gelesen
  friendsDot();
  for (const b of card.querySelectorAll('[data-mget]')) b.onclick = () => mailClaim(b.dataset.mget);
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
  cloudTouched(); save();
  toast(`📬 ${Object.entries(add).map(([r, n]) => `+${fmt(n)} ${RES[r].icon}`).join(' ')} von ${got.n}`);
  mailThanks(uid, id, got, add);                                        // Freundschaft, Wunschzettel, Danke (Block 105)
  openNet('freunde');
}

// --- Päckchen schicken (aus „Freunde & Besuch“) -------------------------------------------------
function mailCompose(friendUid, name, wish = null) {
  if (viewOnly()) { cloudBlocked(); return; }
  const sent = (frLS('mail_' + dayKey()) || {})[friendUid] || 0;
  if (sent >= MAIL_PER_DAY) { toast(`🎁 Heute schon ${MAIL_PER_DAY} Päckchen an ${name} – morgen wieder`); return; }
  const pick = {};
  const have = Object.keys(RES).filter(r => state.res[r] >= 1);
  const need = wish ? Math.max(0, wish.n - wish.got) : 0;                 // Wunschzettel (Block 105): gleich die fehlende Menge
  if (wish && state.res[wish.r] >= 1) pick[wish.r] = Math.min(need, Math.floor(state.res[wish.r]));
  const draw = () => {
    openModal(`<h2>🎁 Päckchen an ${escHtml(name)}</h2>
      ${have.length ? have.map(r => `<div class="fr-row"><span>${RES[r].icon} ${RES[r].name} <small class="muted">(${fmt(state.res[r])} da)</small></span>
        <span class="fr-btns"><button class="btn ghost small" data-mm="${r}:-10" aria-label="weniger">−</button><b>${fmt(pick[r] || 0)}</b><button class="btn ghost small" data-mm="${r}:10" aria-label="mehr">+</button></span></div>`).join('')
        : '<p class="muted">Dein Lager ist leer.</p>'}
      ${wish ? `<p class="ok">📌 ${escHtml(name)} wünscht sich ${RES[wish.r].icon} ${fmt(wish.n)} ${RES[wish.r].name} – es fehlen noch ${fmt(need)}.${state.res[wish.r] >= 1 ? '' : ' Du hast leider keins.'}</p>` : ''}
      <p class="muted">Geht sofort aus deinem Lager ab. ${name} holt es am Briefkasten ab. Noch ${MAIL_PER_DAY - sent} Päckchen heute.</p>
      <div class="row"><button class="btn ghost" id="m-close">Abbrechen</button><button class="btn" id="mm-send" style="flex:1" ${Object.values(pick).some(n => n > 0) ? '' : 'disabled'}>🎁 Schicken</button></div>`);
    for (const b of document.querySelectorAll('[data-mm]')) b.onclick = () => {
      const [r, d] = b.dataset.mm.split(':'), step = Math.max(1, Math.round(Math.max(10, state.res[r] / 10) / 10) * 10) * Math.sign(+d);
      pick[r] = Math.max(0, Math.min(Math.floor(state.res[r]), (pick[r] || 0) + step)); draw();
    };
    $('m-close').onclick = closeModal;
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
    await cloudApi.set(`mail/${friendUid}/m${Date.now().toString(36)}${cloudUser.uid.slice(0, 6)}`, { from: cloudUser.uid, n: (cloudUser.display || 'Freund').split(' ')[0], a, items, at: cloudApi.TS(), ...(forWish ? { wish: true } : {}) });
    bondAdd(cloudUser.uid, friendUid, forWish ? BOND_PTS.wish : BOND_PTS.mail);
    const log = frLS('mail_' + dayKey()) || {}; log[friendUid] = (log[friendUid] || 0) + 1; frLS('mail_' + dayKey(), log);
    cloudTouched(); save(); closeModal(); toast(`🎁 Päckchen an ${name} ist unterwegs`);
  } catch (e) {
    for (const [r, n] of Object.entries(items)) state.res[r] += n;
    toast('🎁 Ging nicht – seid ihr noch befreundet?');
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
let myBonds = {}, bondsOff = null, bondSeenMax = +(frLS('bondmax') || 0);
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
  const fresh = best > bondSeenMax;                                       // wirklich neu – oder nur nach dem Laden wiederhergestellt?
  bondSeenMax = Math.max(bondSeenMax, best);
  state.bond = best; save(); buildToolbar();
  if (!fresh) return;
  frLS('bondmax', best);
  const gift = { 2: 'das Freundschaftsband für deine Figur', 3: 'den Herzballon für deine Figur', 4: 'die Freundesbank', 5: 'den Freundschaftsbaum' }[best];
  toast(`💛 Freundschaft mit ${best} ${best === 1 ? 'Herz' : 'Herzen'}!${gift ? ` Neu: ${gift}` : ''}`);
}
// --- Wunschzettel ---
let myWish = null, wishOff = null, wishWid = null, wishAt = 0;
const wishClean = v => v && RES[v.r] && v.n > 0 ? { r: v.r, n: Math.floor(v.n), got: Math.max(0, Math.floor(+v.got || 0)), at: +v.at || 0 } : null;
// eigener Wunsch: alle 20 s nachsehen (eine Beobachtung auf eine noch nicht geschriebene Welt lehnen die Regeln ab – sie stürbe still)
function wishWatch(force = false) {
  if (!cloudUser || VISIT || !liveWid || !cloudApi.get) return;
  if (!force && wishWid === liveWid && Date.now() - wishAt < 20000) return;
  wishWid = liveWid; wishAt = Date.now();
  const wid = liveWid;
  cloudApi.get(`worlds/${wid}/wish`).then(v => { if (wishWid === wid) myWish = wishClean(v); }).catch(() => {});
}
async function wishSet(r, n) {
  if (viewOnly()) { cloudBlocked(); return false; }
  const uid = cloudUser.uid, wid = await liveWorldId();
  await cloudApi.update({ [`worlds/${wid}/wish`]: r ? { r, n: Math.floor(n), got: 0, at: cloudApi.TS() } : null, [`worlds/${wid}/owner`]: uid });   // owner: falls die Insel noch nicht geschrieben ist
  myWish = r ? { r, n: Math.floor(n), got: 0, at: Date.now() } : null;
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
const WISH_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
function wishHtml() {
  if (!cloudUser) return `<div class="label">📌 Wunschzettel</div><p class="muted">Mit ☁️ Online und Freunden kannst du hier einen Wunsch aushängen – Freunde helfen dir mit Päckchen.</p>`;
  const w = myWish;
  return `<div class="label">📌 Wunschzettel</div>${w ? `<div class="hall-row"><span>${RES[w.r].icon} ${fmt(Math.min(w.got, w.n))} / ${fmt(w.n)} ${RES[w.r].name}${w.got >= w.n ? ' · <b class="ok">✓ erfüllt!</b>' : ''}</span>
      <button class="btn ghost small" data-wishset="1">Ändern</button></div><div class="wish-bar"><i style="width:${Math.min(100, w.got / w.n * 100)}%"></i></div>`
    : `<p class="muted">Häng einen Wunsch aus – deine Freunde sehen ihn und können mit Päckchen helfen.</p><div class="row"><button class="btn small" data-wishset="1">📌 Wunsch aushängen</button></div>`}`;
}
function openWishPicker() {
  if (viewOnly()) { cloudBlocked(); return; }
  const sug = myWish && myWish.got < myWish.n ? myWish : wishSuggest();
  let r = sug.r, n = WISH_AMOUNTS.reduce((b, a) => Math.abs(a - sug.n) < Math.abs(b - sug.n) ? a : b, WISH_AMOUNTS[1]);
  const draw = () => {
    openModal(`<h2>📌 Wunschzettel</h2>
      <p class="muted">Was brauchst du? Deine Freunde sehen den Wunsch unter 👥 und können dir etwas schicken. Für jede Hilfe gibt es ein Danke und eure Freundschaft wächst.</p>
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
  if (got.wish) {
    try {
      const wid = await liveWorldId();
      const r = await cloudApi.tx(`worlds/${wid}/wish`, cur => { const w = wishClean(cur); if (!w || !add[w.r] || w.got >= w.n) return undefined; return { ...cur, got: Math.min(w.n, w.got + add[w.r]) }; });
      const w = r && r.ok && wishClean(r.val);
      if (w) { myWish = w; wishWid = wid; if (w.got >= w.n) toast(`📌 Wunsch erfüllt: ${RES[w.r].icon} ${fmt(w.n)} ${RES[w.r].name} – danke, ${got.n}!`); }
    } catch (e) { /* Wunsch inzwischen weg */ }
  }
  try { cloudApi.set(`book/${got.from}/d_${uid}_${id}`, { k: 'd', from: uid, n: (cloudUser.display || 'Freund').split(' ')[0], a: await friendAnimal(uid).catch(() => 0), at: cloudApi.TS() }).catch(() => {}); } catch (e) { /* egal */ }
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
