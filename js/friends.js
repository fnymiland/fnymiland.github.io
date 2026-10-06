'use strict';
// ---------------------------------------------------------------------------
// Freunde auf der Insel (Block 96): Spielfigur, Besucher als Figur, Herzchen, Gästebuch, Päckchen mit Briefkasten
// Datenbank (Regeln: firebase-rules.json):
//   users/<uid>/profile/animal          eigene Figur (Index in ANIMALS)
//   worlds/<wid>/guests/<uid>           wer gerade zu Besuch ist: { a, n, x, y } – nur Freunde, verschwindet beim Gehen
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
let myAnimal = null;
async function friendAnimal(uid) {
  if (myAnimal != null) return myAnimal;
  const a = await cloudApi.get(`users/${uid}/profile/animal`);
  if (Number.isInteger(a) && ANIMALS[a]) return (myAnimal = a);
  myAnimal = Math.floor(Math.random() * ANIMALS.length);
  await cloudApi.set(`users/${uid}/profile/animal`, myAnimal).catch(() => {});
  return myAnimal;
}
async function setFriendAnimal(i) { myAnimal = i; await cloudApi.set(`users/${cloudUser.uid}/profile/animal`, i); }

// --- Figuren der Besucher (gezeichnet wie Bewohner, mit Namensschild) -------------------------
const visitorFigs = [];
const figShirt = n => ['#e8604f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'][[...String(n)].reduce((s, c) => s + c.charCodeAt(0), 0) % 6];
// guests: { uid: { a, n, x, y } } aus der Insel; skip: eigene Kennung (sich selbst nicht doppelt zeigen)
function setGuests(guests, skip = null) {
  const g = guests || {}, before = new Set(visitorFigs.map(f => f.uid));
  for (let i = visitorFigs.length - 1; i >= 0; i--) if (!g[visitorFigs[i].uid] || visitorFigs[i].uid === skip) visitorFigs.splice(i, 1);
  for (const [uid, v] of Object.entries(g)) {
    if (uid === skip || !v || !isFinite(v.x) || !isFinite(v.y)) continue;
    let f = visitorFigs.find(o => o.uid === uid);
    const a = ANIMALS[v.a] || ANIMALS[0];
    if (!f) {
      f = { uid, px: v.x, py: v.y, kind: Math.max(0, ANIMALS.indexOf(a)), fur: a.fur || FUR[uid.length % FUR.length], shirt: figShirt(uid), speed: 0.4, wait: 0, label: String(v.n || 'Besuch').slice(0, 30) };
      visitorFigs.push(f);
      if (!before.has(uid) && !VISIT && cloudUser) toast(`${a.icon} ${f.label} ist zu Besuch!`);
    }
    f.tx = v.x; f.ty = v.y; f.label = String(v.n || 'Besuch').slice(0, 30);
  }
}
// sanft zum Ziel laufen (zeichnet render.js mit den Bewohnern)
setInterval(() => {
  for (const f of visitorFigs) {
    const dx = f.tx - f.px, dy = f.ty - f.py, d = Math.hypot(dx, dy);
    if (d < 0.02) { f.wait = 1; continue; }
    f.wait = 0;
    const s = Math.min(d, d > 6 ? d : 0.12);                 // weit weg: hinspringen, sonst gemütlich gehen
    f.px += dx / d * s; f.py += dy / d * s;
  }
}, 50);
// Besitzer (führendes Gerät): eigene Besucher sehen – zuschauende Geräte und Besucher bekommen sie mit der Insel
let guestsOff = null;
function guestsWatch() {
  if (guestsOff || !cloudUser || !cloudApi.watch || !liveWid) return;
  guestsOff = cloudApi.watch(`worlds/${liveWid}/guests`, g => setGuests(g));
}
setInterval(() => { if (cloudUser && !VISIT && cloudIsLeader()) guestsWatch(); else if (guestsOff && !cloudUser) { guestsOff(); guestsOff = null; } }, 3000);

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
  cloudApi.set(`book/${visitOwner}/v_${visitUser.uid}_${dayKey()}`, { k: 'v', ...me, at: cloudApi.TS() }).catch(() => {});   // einmal am Tag
  if (cloudApi.leave) cloudApi.leave(`worlds/${VISIT}/guests/${visitUser.uid}`);   // Seite zu → Figur weg
}
const visitName = () => (visitUser.display || 'Besuch').split(' ')[0];
// wo der Besucher hinschaut, da steht seine Figur (alle 2 s, nur wenn sich etwas tut)
setInterval(() => {
  if (!VISIT || !visitFriend || !visitUser) return;
  const [a, b] = tileFrac(W / 2, H / 2), x = Math.round(a * 2) / 2, y = Math.round(b * 2) / 2, key = x + ',' + y;
  if (key === visitLast && Date.now() - visitPosAt < 30000) return;
  visitLast = key; visitPosAt = Date.now();
  cloudApi.set(`worlds/${VISIT}/guests/${visitUser.uid}`, { a: myAnimal || 0, n: visitName(), x, y }).catch(() => {});
}, 2000);
async function visitHeart() {
  try {
    await cloudApi.set(`book/${visitOwner}/h_${visitUser.uid}_${dayKey()}`, { k: 'h', from: visitUser.uid, n: visitName(), a: myAnimal || 0, at: cloudApi.TS() });
    toast('❤️ Herz dagelassen!');
  } catch (e) { toast('❤️ Heute hast du hier schon ein Herz dagelassen'); }
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
        frLS('book_' + dayKey(), n + 1); closeModal(); toast('📖 Eingetragen!');
      } catch (e) { toast('Hat nicht geklappt'); }
    };
  };
  draw();
}

// --- Besitzer: Gästebuch, Herzen, Besuche, Briefkasten (im Rathaus, Reiter „Besuch“) -------------
let bookAll = {}, mailAll = {}, bookOff = null, mailOff = null;
const mailWaiting = () => Object.keys(mailAll).length > 0;
function friendsInboxWatch() {
  if (!cloudUser || VISIT || !cloudApi.watch) return;
  const uid = cloudUser.uid;
  if (!bookOff) bookOff = cloudApi.watch(`book/${uid}`, v => {
    const old = bookAll; bookAll = v || {};
    if (Object.keys(old).length) for (const [id, e] of Object.entries(bookAll)) if (!old[id] && e) toast(e.k === 'h' ? `❤️ ${e.n} hat dir ein Herz dagelassen` : e.k === 'g' ? `📖 ${e.n} hat ins Gästebuch geschrieben` : `👋 ${e.n} war zu Besuch`);
    friendsDot();
  });
  if (!mailOff) mailOff = cloudApi.watch(`mail/${uid}`, v => {
    const old = mailAll; mailAll = v || {};
    for (const [id, m] of Object.entries(mailAll)) if (!old[id] && m) toast(`📬 Päckchen von ${m.n} – im Briefkasten am Rathaus`);
    groundVersion++;                                                    // Briefkasten-Fähnchen am Rathaus neu zeichnen
    friendsDot();
  });
}
setInterval(() => { if (cloudUser && !VISIT) friendsInboxWatch(); else if (!cloudUser && (bookOff || mailOff)) { if (bookOff) bookOff(); if (mailOff) mailOff(); bookOff = mailOff = null; bookAll = {}; mailAll = {}; } }, 3000);
const bookSeen = () => (cloudUser && frLS('seen_' + cloudUser.uid)) || 0;
const bookNew = () => Object.values(bookAll).filter(e => e && (e.at || 0) > bookSeen()).length;
function friendsDot() {
  const btn = document.getElementById('town-btn');
  if (!btn) return;
  let d = btn.querySelector('.dot');
  const on = mailWaiting() || bookNew() > 0;
  if (on && !d) { d = document.createElement('span'); d.className = 'dot'; btn.append(d); }
  if (!on && d) d.remove();
}
function friendsHallHtml() {
  if (!cloudUser) return '<p class="muted">Melde dich im ☁️ Online-Speicher an – dann können Freunde dich besuchen, Herzen dalassen, ins Gästebuch schreiben und Päckchen schicken.</p>';
  const list = Object.entries(bookAll).filter(([, e]) => e).sort((p, q) => (q[1].at || 0) - (p[1].at || 0));
  const hearts = list.filter(([, e]) => e.k === 'h'), today = dayKey();
  const icon = e => (ANIMALS[e.a] || ANIMALS[0]).icon, when = e => e.at ? new Date(e.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '';
  const mails = Object.entries(mailAll).filter(([, m]) => m);
  return `
    <div class="label">📬 Briefkasten</div>
    ${mails.length ? mails.map(([id, m]) => `<div class="fr-row"><span>${icon(m)} Von ${escHtml(m.n)}: ${Object.entries(m.items || {}).filter(([r]) => RES[r]).map(([r, n]) => `${RES[r].icon} ${fmt(n)}`).join(' ')}</span>
      <span class="fr-btns"><button class="btn small" data-mget="${escHtml(id)}">Abholen</button></span></div>`).join('') : '<p class="muted">Leer – Freunde können dir unter 👥 Päckchen schicken.</p>'}
    <div class="label">❤️ Herzen · ${hearts.length}</div>
    <p>${hearts.slice(0, 30).map(([, e]) => `<span title="${escHtml(e.n)} · ${when(e)}">${icon(e)}❤️</span>`).join(' ') || '<span class="muted">Noch keine</span>'}</p>
    <div class="label">📖 Gästebuch</div>
    ${list.filter(([, e]) => e.k === 'g').slice(0, 50).map(([id, e]) => `<div class="fr-row"><span>${BOOK_STICKERS[e.s] || ''} <b>${escHtml(e.n)}</b> ${icon(e)}: ${escHtml(BOOK_LINES[e.t] || '')} <small class="muted">${when(e)}</small></span>
      <span class="fr-btns"><button class="btn ghost small" data-bdel="${escHtml(id)}" aria-label="Eintrag entfernen">✕</button></span></div>`).join('') || '<p class="muted">Noch leer.</p>'}
    <div class="label">👋 Zu Besuch waren</div>
    <p>${list.filter(([, e]) => e.k === 'v').slice(0, 30).map(([, e]) => `${icon(e)} ${escHtml(e.n)}${e.at && dayKey(new Date(e.at)) === today ? ' (heute)' : ` (${when(e)})`}`).join(' · ') || '<span class="muted">Noch niemand – teile deinen Freundescode unter 👥.</span>'}</p>`;
}
function wireFriendsHall(card) {
  if (cloudUser) frLS('seen_' + cloudUser.uid, Date.now() + 5000);     // gelesen
  friendsDot();
  for (const b of card.querySelectorAll('[data-mget]')) b.onclick = () => mailClaim(b.dataset.mget);
  for (const b of card.querySelectorAll('[data-bdel]')) b.onclick = async () => { try { await cloudApi.set(`book/${cloudUser.uid}/${b.dataset.bdel}`, null); openTownHall('besuch'); } catch (e) { toast('Hat nicht geklappt'); } };
}
// Abholen: genau einmal (Transaktion löscht das Päckchen), dann ins Lager
async function mailClaim(id) {
  if (viewOnly()) { cloudBlocked(); return; }
  const uid = cloudUser.uid;
  let got = null;
  try {
    const r = await cloudApi.tx(`mail/${uid}/${id}`, cur => { if (!cur) return undefined; got = cur; return null; });
    if (!r.ok || !got) { toast('📬 Das Päckchen wurde schon abgeholt'); openTownHall('besuch'); return; }
  } catch (e) { toast('Hat nicht geklappt – später nochmal'); return; }
  const add = {};
  for (const [r, n] of Object.entries(got.items || {})) if (RES[r] && isFinite(n) && n > 0) { const v = Math.min(n, MAIL_MAX); state.res[r] = (state.res[r] || 0) + v; add[r] = v; }
  cloudTouched(); save();
  toast(`📬 ${Object.entries(add).map(([r, n]) => `+${fmt(n)} ${RES[r].icon}`).join(' ')} von ${got.n}`);
  openTownHall('besuch');
}

// --- Päckchen schicken (aus „Freunde & Besuch“) -------------------------------------------------
function mailCompose(friendUid, name) {
  if (viewOnly()) { cloudBlocked(); return; }
  const sent = (frLS('mail_' + dayKey()) || {})[friendUid] || 0;
  if (sent >= MAIL_PER_DAY) { toast(`🎁 Heute schon ${MAIL_PER_DAY} Päckchen an ${name} – morgen wieder`); return; }
  const pick = {};
  const have = Object.keys(RES).filter(r => state.res[r] >= 1);
  const draw = () => {
    openModal(`<h2>🎁 Päckchen an ${escHtml(name)}</h2>
      ${have.length ? have.map(r => `<div class="fr-row"><span>${RES[r].icon} ${RES[r].name} <small class="muted">(${fmt(state.res[r])} da)</small></span>
        <span class="fr-btns"><button class="btn ghost small" data-mm="${r}:-10" aria-label="weniger">−</button><b>${fmt(pick[r] || 0)}</b><button class="btn ghost small" data-mm="${r}:10" aria-label="mehr">+</button></span></div>`).join('')
        : '<p class="muted">Dein Lager ist leer.</p>'}
      <p class="muted">Geht sofort aus deinem Lager ab. ${name} holt es am Briefkasten ab. Noch ${MAIL_PER_DAY - sent} Päckchen heute.</p>
      <div class="row"><button class="btn ghost" id="m-close">Abbrechen</button><button class="btn" id="mm-send" style="flex:1" ${Object.values(pick).some(n => n > 0) ? '' : 'disabled'}>🎁 Schicken</button></div>`);
    for (const b of document.querySelectorAll('[data-mm]')) b.onclick = () => {
      const [r, d] = b.dataset.mm.split(':'), step = Math.max(1, Math.round(Math.max(10, state.res[r] / 10) / 10) * 10) * Math.sign(+d);
      pick[r] = Math.max(0, Math.min(Math.floor(state.res[r]), (pick[r] || 0) + step)); draw();
    };
    $('m-close').onclick = closeModal;
    $('mm-send').onclick = () => mailSend(friendUid, name, pick);
  };
  draw();
}
async function mailSend(friendUid, name, pick) {
  const items = {};
  for (const [r, n] of Object.entries(pick)) if (RES[r] && n > 0 && state.res[r] >= n) items[r] = Math.floor(n);
  if (!Object.keys(items).length) return;
  for (const [r, n] of Object.entries(items)) state.res[r] -= n;     // erst abziehen, dann schicken; klappt es nicht: zurück
  try {
    const a = await friendAnimal(cloudUser.uid).catch(() => 0);
    await cloudApi.set(`mail/${friendUid}/m${Date.now().toString(36)}${cloudUser.uid.slice(0, 6)}`, { from: cloudUser.uid, n: (cloudUser.display || 'Freund').split(' ')[0], a, items, at: cloudApi.TS() });
    const log = frLS('mail_' + dayKey()) || {}; log[friendUid] = (log[friendUid] || 0) + 1; frLS('mail_' + dayKey(), log);
    cloudTouched(); save(); closeModal(); toast(`🎁 Päckchen an ${name} ist unterwegs`);
  } catch (e) {
    for (const [r, n] of Object.entries(items)) state.res[r] += n;
    toast('🎁 Ging nicht – seid ihr noch befreundet?');
  }
}
