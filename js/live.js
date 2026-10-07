'use strict';
// ---------------------------------------------------------------------------
// Online, Stufe 3 (Block 95): Live-Spiegel, Besuchen, Freundescodes
// • Spiegel: Das führende Gerät schreibt seine Insel Feld für Feld nach worlds/<wid> (öffentlicher Teil: Felder, Deko,
//   Linien, Gelände, Rest als Text) und users/<uid>/live (Taler, Lager, Ideen; Privates). Gesendet wird nur, was sich
//   seit dem letzten Mal geändert hat – ein paar hundert Bytes statt des ganzen Stands. Zuschauende Geräte und Besucher
//   horchen darauf (ein Lesezugriff, danach kommen nur die Änderungen über die Leitung) und übernehmen Feld für Feld.
// • Besuchen: ?besuch=<wid> zeigt die Insel live, nur ansehen, ohne Taler/Lager/Forschung. Wer den Link hat, darf schauen,
//   solange Besuche an sind (worlds/<wid>/open); Freunde dürfen immer. Neuer Link = neue wid, der alte geht nicht mehr.
// • Freundescodes FNYMI-XXXXX (codes/<code> = uid). Freundschaft per Anfrage und Annehmen (fr/<uid>/<anderer>: st
//   'gesendet' | 'anfrage' | 'freund', name, wid). Die Datenbank-Regeln stehen in AUFGABEN.md (Block 95).
// ---------------------------------------------------------------------------
const LIVE_MAPS = ['tiles', 'decos', 'edges', 'terra'];
const LIVE_ECO = ['money', 'res', 'science', 'stats', 'incPeak'];                       // ändert sich laufend
const LIVE_PRIV = ['diary', 'diarySeen', 'tutorial', 'tipsSeen', 'tipsOff', 'paintNew', 'keep', 'orders', 'orderNext', 'expedition', 'decree', 'decreeNext', 'achieved', 'bond'];
const LIVE_PRIV_ALSO = ['partner'];                                           // öffentlich nur gekürzt (liveSplit), privat ganz
const LIVE_LOCAL = ['cam', 'last', 'muted'];                                             // gehört zum Gerät, nie gespiegelt
const LIVE_STEP = 1000, LIVE_ECO_EVERY = 2000, LIVE_REST_EVERY = 5000;
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const liveRand = n => { let s = ''; const a = 'abcdefghijkmnpqrstuvwxyz23456789'; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

// Spielstand (serialize) → Spiegel: je Karte Schlüssel → Text, der Rest als je ein Text
function liveSplit(S) {
  const maps = {};
  for (const m of LIVE_MAPS) { const o = {}; for (const [k, v] of S[m] || []) o[k] = m === 'terra' ? String(v) : JSON.stringify(v); maps[m] = o; }
  const skip = new Set([...LIVE_MAPS, ...LIVE_ECO, ...LIVE_PRIV, ...LIVE_LOCAL]);
  const pub = Object.fromEntries(Object.entries(S).filter(([k]) => !skip.has(k)));
  if (pub.partner) pub.partner = { uid: '', name: '', c: pub.partner.c, s: pub.partner.s };   // Besucher sehen die Flagge, nicht wer es ist
  return { maps, rest: JSON.stringify(pub),
    eco: JSON.stringify(pick(S, LIVE_ECO)), priv: JSON.stringify(pick(S, [...LIVE_PRIV, ...LIVE_PRIV_ALSO])) };
}
// Spiegel → Spielstand für parseSave. Ohne Privates (Besuch): keine Taler, keine Einführung, kein Tagebuch
function liveJoin(world, live) {
  const d = JSON.parse(world.rest || '{}');
  for (const m of LIVE_MAPS) d[m] = Object.entries(world[m] || {}).map(([k, v]) => [k, m === 'terra' ? v : JSON.parse(v)]);
  if (live) Object.assign(d, JSON.parse(live.eco || '{}'), JSON.parse(live.priv || '{}'));
  else Object.assign(d, { money: 0, res: newRes(), science: 0, stats: { earned: 0 }, tutorial: -1, tipsOff: true, diary: [], diarySeen: 0 });
  return d;
}

// ---------------------------------------------------------------------------
// Schreiben (führendes Gerät)
// ---------------------------------------------------------------------------
let liveWid = null, liveOpen = false, liveSent = null, liveGV = -1, liveRestAt = 0, liveEcoAt = 0, livePushing = false;
async function liveWorldId() {
  if (liveWid) return liveWid;
  const uid = cloudUser.uid, pub = await cloudApi.get(`users/${uid}/pub`);
  if (pub && pub.wid) { liveOpen = !!pub.open; return (liveWid = pub.wid); }
  const wid = liveRand(20);                                              // zwei Geräte gleichzeitig: nur eine Kennung gewinnt (Block 112)
  const r = cloudApi.tx ? await cloudApi.tx(`users/${uid}/pub`, cur => (cur && cur.wid ? undefined : { wid, open: false })) : (await cloudApi.set(`users/${uid}/pub`, { wid, open: false }), { ok: true });
  if (!r.ok && r.val && r.val.wid) { liveOpen = !!r.val.open; return (liveWid = r.val.wid); }
  liveOpen = false;
  return (liveWid = wid);
}
const liveCanPush = (inQueue = false) => !!cloudUser && !!cloudApi && !!cloudApi.update && !cloudOff() && cloudIsLeader() && cloudState === 'ok' && (inQueue || !cloudBusy);
// Änderungen seit dem letzten Mal schreiben (full: alles neu – beim Übernehmen der Führung, neuer Link)
async function livePush(full = false, now = Date.now(), inQueue = false) {
  if (!liveCanPush(inQueue) || livePushing) return false;
  const structural = full || !liveSent || groundVersion !== liveGV || now - liveRestAt > LIVE_REST_EVERY, eco = full || !liveSent || now - liveEcoAt > LIVE_ECO_EVERY;
  if (!structural && !eco) return false;
  livePushing = true;
  try {
    const uid = cloudUser.uid, wid = await liveWorldId(), w = `worlds/${wid}`, cur = liveSplit(serialize()), upd = {};
    if (full || !liveSent) {
      const pub = await cloudApi.get(`users/${uid}/pub`).catch(() => null);         // „Besuche erlaubt“ gilt auch für eine neue Welt (neuer Link)
      if (pub && pub.wid === wid) { liveOpen = !!pub.open; upd[`${w}/open`] = liveOpen; }
      for (const m of LIVE_MAPS) upd[`${w}/${m}`] = cur.maps[m];
      Object.assign(upd, { [`${w}/rest`]: cur.rest, [`${w}/owner`]: uid, [`${w}/at`]: cloudApi.TS(),   // open nicht: das stellt nur liveSetOpen (sonst setzte ein anderes Gerät es zurück)
        [`users/${uid}/live`]: { eco: cur.eco, priv: cur.priv } });
    } else {
      let changed = false;
      if (structural) {
        for (const m of LIVE_MAPS) {
          const a = liveSent.maps[m], b = cur.maps[m];
          for (const k in b) if (a[k] !== b[k]) { upd[`${w}/${m}/${k}`] = b[k]; changed = true; }
          for (const k in a) if (!(k in b)) { upd[`${w}/${m}/${k}`] = null; changed = true; }
        }
        if (cur.rest !== liveSent.rest) { upd[`${w}/rest`] = cur.rest; changed = true; }
        if (cur.priv !== liveSent.priv) upd[`users/${uid}/live/priv`] = cur.priv;
        if (changed) upd[`${w}/at`] = cloudApi.TS();
        liveRestAt = now;
      }
      if (eco && cur.eco !== liveSent.eco) { upd[`users/${uid}/live/eco`] = cur.eco; liveEcoAt = now; }
    }
    if (!Object.keys(upd).length) { liveGV = groundVersion; return false; }
    await cloudApi.update(upd);
    liveSent = cur; liveGV = groundVersion;
    if (full) { liveRestAt = now; liveEcoAt = now; }
    return true;
  } catch (e) { console.warn('Live', e); liveWid = null; liveSent = null; return false; }   // beim nächsten Mal Kennung neu lesen, alles neu
  finally { livePushing = false; }
}
// vor dem Sichern/Übergeben: Spiegel auf den neuesten Stand
async function liveFlush() { if (liveCanPush(true)) await livePush(false, Date.now() + LIVE_REST_EVERY + LIVE_ECO_EVERY, true); }
// nach einem gesicherten Stand: Spiegel kennt diese Version (zuschauende Geräte müssen sie dann nicht herunterladen)
function liveAfterUpload(rev) { if (liveCanPush(true) && liveWid && liveSent) cloudApi.update({ [`worlds/${liveWid}/rev`]: rev }).catch(() => {}); }

// ---------------------------------------------------------------------------
// Lesen (zuschauendes Gerät, Besuch)
// ---------------------------------------------------------------------------
let liveFollow = null, liveWasLeader = false;             // { wid, offs, applied: { maps, rest }, live: { eco, priv }, own }
const liveFollowing = () => !!(liveFollow && liveFollow.applied);
// ganzen Stand übernehmen, Blick bleibt (selten: erster Empfang, Rest/Privates geändert)
function liveAdopt(d) {
  const c = state && state.cam ? { ...state.cam } : null;
  adoptState(parseSave(d));
  if (c && liveFollow && liveFollow.applied) { state.cam = c; cam = state.cam; }
}
// einzelne Felder, Deko, Linien, Gelände ändern – ohne alles neu aufzubauen (Bewohner laufen weiter)
function liveApplyMaps(world) {
  const A = liveFollow.applied.maps;
  let terra = false, any = false;
  for (const m of LIVE_MAPS) {
    const b = world[m] || {}, a = A[m];
    const set = (k, v) => {
      any = true;
      if (m === 'tiles') v === null ? state.tiles.delete(k) : state.tiles.set(k, JSON.parse(v));
      else if (m === 'decos') v === null ? state.decos.delete(k) : state.decos.set(k, [...JSON.parse(v), ...newSlots()].slice(0, SLOTS));
      else if (m === 'edges') v === null ? state.edges.delete(k) : state.edges.set(k, JSON.parse(v));
      else { terra = true; v === null ? state.terra.delete(k) : state.terra.set(k, v); }
    };
    for (const k in b) if (a[k] !== b[k]) set(k, b[k]);
    for (const k in a) if (!(k in b)) set(k, null);
    A[m] = { ...b };
  }
  if (terra) { terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); }
  if (any) { rebuildCover(); recalc(); }
}
function liveOnWorld(world) {
  if (!liveFollow) return;
  if (!world) { if (VISIT) visitGone(); else liveFollowStop(); return; }   // eigenes Gerät: neuer Link → liveTick verbindet neu
  const f = liveFollow, first = !f.applied;
  f.world = world;
  if (f.own && !f.live) return;                    // eigenes Gerät: erst mit Talern & Co. übernehmen (sonst stünden kurz 0 Taler da)
  if (first || world.rest !== f.applied.rest) {
    f.applied = { maps: Object.fromEntries(LIVE_MAPS.map(m => [m, { ...(world[m] || {}) }])), rest: world.rest };
    liveAdopt(liveJoin(world, f.own ? f.live : null));
    if (first && VISIT) visitArrived();
  } else liveApplyMaps(world);
  if (f.own) liveSettle(world.rev);
  if (typeof setGuests === 'function') setGuests(world.guests, VISIT && visitUser ? visitUser.uid : null);   // Besucher als Figur (Block 96)
  if (VISIT && world.owner && visitOwner !== world.owner) { visitOwner = world.owner; visitFriendCheck(); }
  if (VISIT) visitUi();
}
function liveOnPriv(live) {
  if (!liveFollow || !live) return;
  const f = liveFollow, old = f.live || {};
  f.live = live;
  if (!f.applied) { if (f.world) liveOnWorld(f.world); return; }
  if (live.priv !== old.priv) { liveAdopt(liveJoin(f.world, live)); liveSettle(); return; }
  if (live.eco !== old.eco) { const e = JSON.parse(live.eco || '{}'); for (const k of LIVE_ECO) if (e[k] !== undefined) state[k] = e[k]; }
  liveSettle();
}
// Ein zuschauendes Gerät hat den ganzen Stand anders bekommen (gesicherter Stand, Bastelei): beim Spiegel neu ansetzen
function liveRebase() {
  const f = liveFollow;
  if (!f || !f.applied) return;
  f.applied.rest = null;                           // nächste Nachricht übernimmt wieder alles aus dem Spiegel
  if (f.world && (!f.own || f.live)) liveOnWorld(f.world);
}
// Nach jeder Übernahme: der Online-Speicher weiß, dass dieses Gerät auf dem Stand ist (sonst hielte es das für eigene Änderungen)
function liveSettle(rev) {
  const m = cloudMeta();
  setCloudMeta({ ...m, ...(rev ? { rev } : {}), sig: worldSig(serialize()), acts: 0 });
}
async function liveFollowStart(wid, own) {
  if (liveFollow) return;
  liveFollow = { wid, own, applied: null, live: null, offs: [] };
  const err = () => { if (VISIT) visitDenied(); else liveFollowStop(); };
  liveFollow.offs.push(cloudApi.watch(`worlds/${wid}`, w => liveOnWorld(w), err));
  if (own) liveFollow.offs.push(cloudApi.watch(`users/${cloudUser.uid}/live`, l => liveOnPriv(l)));
}
function liveFollowStop() { if (!liveFollow) return; for (const off of liveFollow.offs) off(); liveFollow = null; }
// Takt: führend → schreiben; zuschauend → mitlesen; Wechsel sauber umschalten
async function liveTick() {
  if (VISIT || !cloudUser || !cloudApi || !cloudApi.watch || cloudOff()) return;
  if (cloudWatching()) {
    liveWasLeader = false;
    if (!liveFollow) { try { liveFollowStart(await cloudApi.get(`users/${cloudUser.uid}/pub/wid`) || '-', true); } catch (e) { /* später nochmal */ } }
    liveSent = null;                                           // wer wieder führt, schreibt einmal alles
  } else {
    if (liveFollow) liveFollowStop();
    if (cloudIsLeader()) { if (!liveWasLeader) liveSent = null; livePush(); }
    liveWasLeader = cloudIsLeader();
  }
}
setInterval(() => { liveTick().catch(() => {}); }, LIVE_STEP);

// ---------------------------------------------------------------------------
// Besuchen
// ---------------------------------------------------------------------------
async function visitBoot() {
  document.body.classList.add('visiting');
  visitUi();
  try { await cloudReady(); } catch (e) { visitDenied('Gerade keine Verbindung.'); return; }
  liveFollowStart(VISIT, false);
}
function visitArrived() {
  const h = townHallAt();
  if (h) jumpTo(h[0] + 1, h[1] + 1);
  closeModal(); closePanel(); setTool('look');
  toast(`🏝️ Willkommen in ${state.town.name}!`);
}
function visitDenied(why) {
  liveFollowStop();
  openModal(`<h2>🏝️ Besuch nicht möglich</h2><p>${why || 'Diese Insel kann man gerade nicht besuchen – vielleicht sind Besuche ausgeschaltet oder es gibt einen neuen Link.'}</p>
    <div class="row"><button class="btn" id="m-home2">🏠 Zu meiner Insel</button></div>`);
  $('m-home2').onclick = visitLeave;
}
function visitGone() { visitDenied('Diese Insel gibt es unter diesem Link nicht mehr.'); }
function visitLeave() { location.href = location.pathname; }
function visitUi() {
  let el = document.getElementById('visit-band');
  if (!el) {
    const w = document.createElement('div');
    w.innerHTML = '<div id="visit-band" role="status"><span class="vb-text">🏝️ Zu Besuch …</span><button class="btn small" id="visit-heart" hidden>❤️</button><button class="btn small" id="visit-book" hidden>📖</button><button class="btn small" id="visit-home">🏠 Meine Insel</button></div>';
    el = w.firstChild; document.body.appendChild(el);
    el.querySelector('#visit-home').onclick = visitLeave;
    el.querySelector('#visit-heart').onclick = () => visitHeart();
    el.querySelector('#visit-book').onclick = () => visitBook();
  }
  const fr = typeof visitFriend !== 'undefined' && visitFriend;                 // Freunde: Herz und Gästebuch (Block 96)
  el.querySelector('#visit-heart').hidden = !fr; el.querySelector('#visit-book').hidden = !fr;
  if (liveFollowing()) el.querySelector('.vb-text').textContent = `🏝️ Zu Besuch in ${state.town.name} · 👥 ${fmt(T.pop)}`;
}

// ---------------------------------------------------------------------------
// Freunde
// ---------------------------------------------------------------------------
const FR_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';                 // ohne 0/O, 1/I/L
const frCodeText = c => `FNYMI-${c}`;
// auch aus einer eingefügten Nachricht („Mein Kachelhausen-Freundescode: FNYMI-7F3QK“, Block 112)
const frCodeNorm = s => { const t = String(s || '').toUpperCase(), m = t.match(/FNYMI\s*-?\s*([A-Z0-9]{5})(?![A-Z0-9])/); return m ? m[1] : t.replace(/^\s*FNYMI\s*-?\s*/, '').replace(/[^A-Z0-9]/g, ''); };
let frMine = null, frList = {}, frOff = null, frRenderTok = 0;
async function frCode() {
  if (frMine) return frMine;
  const uid = cloudUser.uid, prof = await cloudApi.get(`users/${uid}/profile`);
  if (prof && prof.code) return (frMine = prof.code);
  for (let i = 0; i < 20; i++) {
    let c = ''; for (let j = 0; j < 5; j++) c += FR_ALPHA[Math.floor(Math.random() * FR_ALPHA.length)];
    const r = await cloudApi.tx(`codes/${c}`, cur => cur ? undefined : uid);
    if (r.ok) { await cloudApi.set(`users/${uid}/profile/code`, c); return (frMine = c); }   // nur den Code – Figur bleibt im Profil
  }
  throw new Error('Kein freier Code');
}
const frMyName = () => `${myNick()} · ${state.town.name}`;                // gewählter Name, nicht der aus dem Google-Konto (Block 111)
function frWatch() {
  if (frOff || !cloudUser || !cloudApi.watch) return;
  frOff = cloudApi.watch(`fr/${cloudUser.uid}`, v => { frList = v || {}; if (document.getElementById('fr-box') && !$('modal').hidden) openFriends(); });   // nur, wenn es offen ist
}
async function frAdd(input) {
  const code = frCodeNorm(input), uid = cloudUser.uid;
  if (code.length !== 5) return 'Ein Freundescode sieht so aus: FNYMI-7F3QK';
  const other = await cloudApi.get(`codes/${code}`);
  if (!other) return 'Diesen Code gibt es nicht – vertippt?';
  if (other === uid) return 'Das ist dein eigener Code 🙂';
  const e = frList[other];
  if (e && e.st === 'freund') return 'Ihr seid schon befreundet';
  if (e && e.st === 'gesendet') return 'Deine Anfrage ist schon unterwegs';
  if (e && e.st === 'anfrage') { await frAccept(other); return null; }
  const myCode = await frCode(), wid = await liveWorldId();
  await cloudApi.update({ [`fr/${uid}/${other}`]: { st: 'gesendet', name: frCodeText(code), at: cloudApi.TS() },
    [`fr/${other}/${uid}`]: { st: 'anfrage', name: frMyName(), code: myCode, wid, flag: myFlag(), at: cloudApi.TS() } });
  return null;
}
async function frAccept(other) {
  const uid = cloudUser.uid, e = frList[other] || {}, wid = await liveWorldId();
  await cloudApi.update({ [`fr/${uid}/${other}`]: { st: 'freund', name: e.name || 'Freund', wid: e.wid || '', at: cloudApi.TS() },
    [`fr/${other}/${uid}`]: { st: 'freund', name: frMyName(), wid, flag: myFlag(), at: cloudApi.TS() } });
}
const frRemove = other => cloudApi.update({ [`fr/${cloudUser.uid}/${other}`]: null, [`fr/${other}/${cloudUser.uid}`]: null });
// neuer Besuchs-Link: neue wid, alles neu schreiben, alte weg, Freunde bekommen die neue
async function liveNewLink() {
  const uid = cloudUser.uid, old = await liveWorldId(), wid = liveRand(20);
  const wish = await cloudApi.get(`worlds/${old}/wish`).catch(() => null);   // Wunschzettel zieht mit (Block 105)
  await cloudApi.set(`users/${uid}/pub`, { wid, open: liveOpen });
  liveWid = wid; liveSent = null;
  await cloudApi.update({ [`worlds/${old}`]: null });                         // alter Link geht ab sofort nicht mehr
  if (!(await livePush(true))) toast('🔗 Die Insel erscheint unter dem neuen Link, sobald ein Gerät von dir spielt');
  if (wish) await cloudApi.update({ [`worlds/${wid}/wish`]: wish, [`worlds/${wid}/owner`]: uid }).catch(() => {});
  for (const [f, e] of Object.entries(frList)) if (e.st === 'freund') await cloudApi.update({ [`fr/${f}/${uid}/wid`]: wid }).catch(() => {});
}
async function liveSetOpen(on) {
  const uid = cloudUser.uid, wid = await liveWorldId();
  liveOpen = !!on;
  await cloudApi.update({ [`users/${uid}/pub/open`]: liveOpen, [`worlds/${wid}/open`]: liveOpen, [`worlds/${wid}/owner`]: uid });   // owner: falls die Welt noch nicht existiert (Regeln)
}
const visitLink = wid => `${location.origin}${location.pathname}?besuch=${wid}`;
// Teilen (Block 96b): Teilen-Menü → Zwischenablage → altes Kopieren → Fenster zum Selbst-Kopieren. Auf http:// (WLAN) gibt es
// weder Teilen-Menü noch Zwischenablage – dann greifen die letzten beiden. Beim Link nur die Adresse, ohne Text davor.
async function shareText(text, link = false) {
  if (navigator.share) {
    try { await navigator.share(link ? { url: text } : { text }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }               // selbst abgebrochen: nichts weiter
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(text); toast('📋 Kopiert'); return; } catch (e) { /* weiter */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    if (ok) { toast('📋 Kopiert'); return; }
  } catch (e) { /* weiter */ }
  const back = document.getElementById('fr-box') ? openFriends : closeModal;
  openModal(`<h2>📋 Zum Kopieren</h2><p class="muted">Lange auf das Feld tippen und „Kopieren“ wählen.</p>
    <input id="sh-text" class="cloud-mail" readonly value="${escHtml(text)}" aria-label="Zum Kopieren"><div class="row"><button class="btn" id="m-ok">Fertig</button></div>`);
  const inp = $('sh-text'); inp.focus(); inp.select();
  $('m-ok').onclick = back;
}
async function openFriends() {
  if (!cloudUser) {
    openModal(`${netHead('freunde')}<h3>👥 Freunde & Besuch</h3><p>Melde dich unter ☁️ Online an – dann bekommst du einen Freundescode, kannst Freunde besuchen und deine Insel zeigen. Freunde können dir Herzen, Gästebuch-Einträge und Päckchen dalassen.</p>
      <div class="row"><button class="btn" id="m-cl">☁️ Zum Anmelden</button><button class="btn ghost" id="m-close">Schließen</button></div>`);
    $('m-cl').onclick = () => openNet('online'); $('m-close').onclick = closeModal;
    return;
  }
  frWatch();
  youTab = 'freunde';
  const tok = ++frRenderTok;                                             // nur der neueste Aufruf zeichnet (zwei kurz hintereinander)
  const typed = $('fr-in') ? $('fr-in').value : '';                      // halb getippter Code bleibt beim Neuzeichnen
  if (!$('fr-box') || $('modal').hidden) openModal(`${netHead('freunde')}<div id="fr-box"><p class="muted" id="fr-wait">Lädt …</p></div>`);   // auch nach dem Schließen (Inhalt bleibt unsichtbar stehen)
  let code = '…', wid = null;
  try { code = frCodeText(await frCode()); wid = await liveWorldId(); } catch (e) { code = 'gerade nicht erreichbar'; }
  if (tok !== frRenderTok || youTab !== 'freunde' || !$('fr-box') || $('modal').hidden) return; // inzwischen geschlossen, anderer Reiter oder neuer Aufruf
  const entries = Object.entries(frList), by = st => entries.filter(([, e]) => e.st === st);
  const wishes = {};                                                     // Wunschzettel der Freunde (Block 105)
  await Promise.all([...by('freund').filter(([, e]) => e.wid).map(async ([id, e]) => { wishes[id] = wishClean(await cloudApi.get(`worlds/${e.wid}/wish`).catch(() => null)); }),
    onlineRead(by('freund').map(([id]) => id))]);                       // spielt gerade / zuletzt vor … (Block 130)
  if (tok !== frRenderTok || youTab !== 'freunde' || !$('fr-box') || $('modal').hidden) return;
  frPushFlag();
  const row = ([id, e], btns) => `<div class="fr-row"><span>${escHtml(e.name || 'Freund')}</span><span class="fr-btns">${btns(id, e)}</span></div>`;
  const friendRow = ([id, e]) => {
    const w = wishes[id], p = (myBonds[id] || {}).p, partner = state.partner && state.partner.uid === id;
    return `<div class="fr-friend"><div class="fr-row"><span>${escHtml(e.name || 'Freund')} <small class="bond" title="Freundschaft">${bondHearts(p)}</small>${onlineHtml(id, frOnline[id])}</span><span class="fr-btns">${e.wid ? `<button class="btn small" data-frvisit="${escHtml(e.wid)}">🏝️ Besuchen</button>` : ''}<button class="btn ghost small${svSentToday(id) ? ' done' : ''}" data-frmail="${escHtml(id)}" data-frname="${escHtml(e.name || 'Freund')}" aria-label="Souvenir schicken">🎁</button><button class="btn ghost small${partner ? ' on' : ''}" data-frpartner="${escHtml(id)}" aria-label="${partner ? 'Partnerstadt entfernen' : 'Als Partnerstadt wählen'}" aria-pressed="${partner}">🚩</button><button class="btn ghost small" data-frdel="${escHtml(id)}" aria-label="Freund entfernen">✕</button></span></div>
      ${w && w.got < w.n ? (wishCovered(id, w) >= w.n
        ? `<div class="fr-wish">📌 wünscht sich ${RES[w.r].icon} ${fmt(w.n)} ${RES[w.r].name} <small class="ok">✓ du hast genug geschickt – es muss nur noch abgeholt werden</small></div>`
        : `<div class="fr-wish">📌 wünscht sich ${RES[w.r].icon} ${fmt(w.n)} ${RES[w.r].name} <small class="muted">(${fmt(w.got)} da${wishSent(id, w).n ? `, ${fmt(wishSent(id, w).n)} von dir unterwegs` : ''})</small> <button class="btn small" data-frhelp="${escHtml(id)}" data-frname="${escHtml(e.name || 'Freund')}">🎁 Helfen</button></div>`) : ''}</div>`;
  };
  openModal(`
    ${netHead('freunde')}<div id="fr-box">
    ${friendsHallHtml('post')}
    <div class="label">Freunde</div>
    ${by('freund').length ? by('freund').map(friendRow).join('') + '<p class="muted fr-hint">♥ Freundschaft wächst mit Besuchen, Herzen, Gästebuch, Souvenirs (🎁, eins am Tag) und Päckchen – am meisten, wenn du bei einem Wunsch hilfst. 🚩 = Partnerstadt.</p>'
      : '<p class="muted">Noch keine – schick deinen Code an jemanden oder gib einen ein.</p>'}
    ${by('anfrage').length ? `<div class="label">📩 Anfragen</div>${by('anfrage').map(r => row(r, id => `<button class="btn small" data-fracc="${escHtml(id)}">Annehmen</button><button class="btn ghost small" data-frdel="${escHtml(id)}">Ablehnen</button>`)).join('')}` : ''}
    ${by('gesendet').length ? `<div class="label">Gesendet</div>${by('gesendet').map(r => row(r, id => `<span class="muted">wartet …</span><button class="btn ghost small" data-frdel="${escHtml(id)}" aria-label="Anfrage zurückziehen">✕</button>`)).join('')}` : ''}
    <div class="label">Dein Freundescode</div>
    <div class="fr-code"><b>${escHtml(code)}</b><button class="btn ghost small" id="fr-copy">Kopieren</button></div>
    <div class="label">Code eines Freundes</div>
    <div class="fr-add"><label class="fr-pre"><span aria-hidden="true">FNYMI-</span><input id="fr-in" class="cloud-mail" placeholder="7F3QK" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Freundescode (die 5 Zeichen nach FNYMI-)"></label><button class="btn small" id="fr-send">Anfrage schicken</button></div>
    ${friendsHallHtml('book')}
    <div class="label">🔗 Besuchs-Link (nur ansehen, ohne Anmeldung)</div>
    <div class="looks"><button class="look${liveOpen ? ' on' : ''}" id="fr-open" aria-pressed="${liveOpen}">${liveOpen ? '✓ Besuche erlaubt' : 'Besuche aus'}</button></div>
    ${liveOpen && wid ? `<div class="fr-code"><small>${escHtml(visitLink(wid))}</small><button class="btn ghost small" id="fr-link">Teilen</button></div>
      <div class="row"><button class="btn ghost small" id="fr-new">Neuen Link machen (der alte geht dann nicht mehr)</button></div>` : '<p class="muted">Freunde können dich immer besuchen – der Link ist für alle anderen.</p>'}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div></div>`);
  $('m-close').onclick = closeModal;
  if (typed) $('fr-in').value = typed;
  // nur die 5 Zeichen nach FNYMI- (Block 111); ein ganzer eingefügter Code wird gekürzt
  $('fr-in').oninput = () => { const el = $('fr-in'), v = el.value; el.value = (v.length > 5 ? frCodeNorm(v) : v.toUpperCase().replace(/[^A-Z0-9]/g, '')).slice(0, 5); };
  const share = (text, link) => shareText(text, link);
  $('fr-copy').onclick = () => share(`Mein Kachelhausen-Freundescode: ${code}`);
  $('fr-send').onclick = async () => { try { const err = await frAdd($('fr-in').value); toast(err || '📩 Anfrage geschickt'); if (!err) openFriends(); } catch (e) { toast('Hat nicht geklappt – später nochmal'); } };
  for (const b of document.querySelectorAll('[data-fracc]')) b.onclick = async () => { try { await frAccept(b.dataset.fracc); toast('👥 Ihr seid jetzt befreundet'); } catch (e) { toast('Hat nicht geklappt'); } };
  for (const b of document.querySelectorAll('[data-frdel]')) b.onclick = async () => { try { await frRemove(b.dataset.frdel); } catch (e) { toast('Hat nicht geklappt'); } };
  wireFriendsHall($('modal-card'));
  for (const b of document.querySelectorAll('[data-frmail]')) b.onclick = () => svCompose(b.dataset.frmail, (b.dataset.frname || 'Freund').split(' · ')[0]);   // Souvenir (Block 129)
  for (const b of document.querySelectorAll('[data-frhelp]')) b.onclick = () => mailCompose(b.dataset.frhelp, (b.dataset.frname || 'Freund').split(' · ')[0], wishes[b.dataset.frhelp]);
  for (const b of document.querySelectorAll('[data-frpartner]')) b.onclick = async () => { await togglePartner(b.dataset.frpartner, frList[b.dataset.frpartner] || {}); openFriends(); };
  for (const b of document.querySelectorAll('[data-frvisit]')) b.onclick = () => { save(); location.href = visitLink(b.dataset.frvisit); };
  $('fr-open').onclick = async () => { try { await liveSetOpen(!liveOpen); openFriends(); } catch (e) { toast('Hat nicht geklappt'); } };
  if ($('fr-link')) $('fr-link').onclick = () => share(visitLink(wid), true);
  if ($('fr-new')) $('fr-new').onclick = async () => { try { await liveNewLink(); toast('🔗 Neuer Link – der alte geht nicht mehr'); openFriends(); } catch (e) { toast('Hat nicht geklappt'); } };
}

if (VISIT) visitBoot();
