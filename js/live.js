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
const LIVE_PRIV = ['diary', 'diarySeen', 'tutorial', 'tipsSeen', 'tipsOff', 'paintNew', 'keep', 'orders', 'orderNext', 'expedition', 'decree', 'decreeNext', 'achieved'];
const LIVE_LOCAL = ['cam', 'last', 'muted'];                                             // gehört zum Gerät, nie gespiegelt
const LIVE_STEP = 1000, LIVE_ECO_EVERY = 2000, LIVE_REST_EVERY = 5000;
const pick = (o, ks) => Object.fromEntries(ks.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const liveRand = n => { let s = ''; const a = 'abcdefghijkmnpqrstuvwxyz23456789'; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };

// Spielstand (serialize) → Spiegel: je Karte Schlüssel → Text, der Rest als je ein Text
function liveSplit(S) {
  const maps = {};
  for (const m of LIVE_MAPS) { const o = {}; for (const [k, v] of S[m] || []) o[k] = m === 'terra' ? String(v) : JSON.stringify(v); maps[m] = o; }
  const skip = new Set([...LIVE_MAPS, ...LIVE_ECO, ...LIVE_PRIV, ...LIVE_LOCAL]);
  return { maps, rest: JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k]) => !skip.has(k)))),
    eco: JSON.stringify(pick(S, LIVE_ECO)), priv: JSON.stringify(pick(S, LIVE_PRIV)) };
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
  const wid = liveRand(20);
  await cloudApi.set(`users/${uid}/pub`, { wid, open: false });
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
    w.innerHTML = '<div id="visit-band" role="status"><span class="vb-text">🏝️ Zu Besuch …</span><button class="btn small" id="visit-home">🏠 Meine Insel</button></div>';
    el = w.firstChild; document.body.appendChild(el);
    el.querySelector('#visit-home').onclick = visitLeave;
  }
  if (liveFollowing()) el.querySelector('.vb-text').textContent = `🏝️ Zu Besuch in ${state.town.name} · 👥 ${fmt(T.pop)}`;
}

// ---------------------------------------------------------------------------
// Freunde
// ---------------------------------------------------------------------------
const FR_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';                 // ohne 0/O, 1/I/L
const frCodeText = c => `FNYMI-${c}`;
const frCodeNorm = s => String(s || '').toUpperCase().replace(/^\s*FNYMI\s*-?\s*/, '').replace(/[^A-Z0-9]/g, '');
let frMine = null, frList = {}, frOff = null;
async function frCode() {
  if (frMine) return frMine;
  const uid = cloudUser.uid, prof = await cloudApi.get(`users/${uid}/profile`);
  if (prof && prof.code) return (frMine = prof.code);
  for (let i = 0; i < 20; i++) {
    let c = ''; for (let j = 0; j < 5; j++) c += FR_ALPHA[Math.floor(Math.random() * FR_ALPHA.length)];
    const r = await cloudApi.tx(`codes/${c}`, cur => cur ? undefined : uid);
    if (r.ok) { await cloudApi.set(`users/${uid}/profile`, { code: c }); return (frMine = c); }
  }
  throw new Error('Kein freier Code');
}
const frMyName = () => `${(cloudUser.display || 'Spieler').split(' ')[0]} · ${state.town.name}`;
function frWatch() {
  if (frOff || !cloudUser || !cloudApi.watch) return;
  frOff = cloudApi.watch(`fr/${cloudUser.uid}`, v => { frList = v || {}; if (document.getElementById('fr-box')) openFriends(); });
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
    [`fr/${other}/${uid}`]: { st: 'anfrage', name: frMyName(), code: myCode, wid, at: cloudApi.TS() } });
  return null;
}
async function frAccept(other) {
  const uid = cloudUser.uid, e = frList[other] || {}, wid = await liveWorldId();
  await cloudApi.update({ [`fr/${uid}/${other}`]: { st: 'freund', name: e.name || 'Freund', wid: e.wid || '', at: cloudApi.TS() },
    [`fr/${other}/${uid}`]: { st: 'freund', name: frMyName(), wid, at: cloudApi.TS() } });
}
const frRemove = other => cloudApi.update({ [`fr/${cloudUser.uid}/${other}`]: null, [`fr/${other}/${cloudUser.uid}`]: null });
// neuer Besuchs-Link: neue wid, alles neu schreiben, alte weg, Freunde bekommen die neue
async function liveNewLink() {
  const uid = cloudUser.uid, old = await liveWorldId(), wid = liveRand(20);
  await cloudApi.set(`users/${uid}/pub`, { wid, open: liveOpen });
  liveWid = wid; liveSent = null;
  await cloudApi.update({ [`worlds/${old}`]: null });                         // alter Link geht ab sofort nicht mehr
  if (!(await livePush(true))) toast('🔗 Die Insel erscheint unter dem neuen Link, sobald ein Gerät von dir spielt');
  for (const [f, e] of Object.entries(frList)) if (e.st === 'freund') await cloudApi.update({ [`fr/${f}/${uid}/wid`]: wid }).catch(() => {});
}
async function liveSetOpen(on) {
  const uid = cloudUser.uid, wid = await liveWorldId();
  liveOpen = !!on;
  await cloudApi.update({ [`users/${uid}/pub/open`]: liveOpen, [`worlds/${wid}/open`]: liveOpen });
}
const visitLink = wid => `${location.origin}${location.pathname}?besuch=${wid}`;
async function openFriends() {
  if (!cloudUser) {
    openModal(`<h2>👥 Freunde & Besuch</h2><p>Melde dich im ☁️ Online-Speicher an – dann bekommst du einen Freundescode, kannst Freunde besuchen und deine Insel zeigen.</p>
      <div class="row"><button class="btn" id="m-cl">☁️ Zum Online-Speicher</button><button class="btn ghost" id="m-close">Schließen</button></div>`);
    $('m-cl').onclick = openCloud; $('m-close').onclick = closeModal;
    return;
  }
  frWatch();
  let code = '…', wid = null;
  try { code = frCodeText(await frCode()); wid = await liveWorldId(); } catch (e) { code = 'gerade nicht erreichbar'; }
  const entries = Object.entries(frList), by = st => entries.filter(([, e]) => e.st === st);
  const row = ([id, e], btns) => `<div class="fr-row"><span>${escHtml(e.name || 'Freund')}</span><span class="fr-btns">${btns(id, e)}</span></div>`;
  openModal(`
    <div id="fr-box"><h2>👥 Freunde & Besuch</h2>
    <div class="label">Dein Freundescode</div>
    <div class="fr-code"><b>${escHtml(code)}</b><button class="btn ghost small" id="fr-copy">Kopieren</button></div>
    <div class="label">Code eines Freundes</div>
    <div class="fr-add"><input id="fr-in" class="cloud-mail" placeholder="FNYMI-…" autocomplete="off" autocapitalize="characters" aria-label="Freundescode"><button class="btn small" id="fr-send">Anfrage schicken</button></div>
    ${by('anfrage').length ? `<div class="label">📩 Anfragen</div>${by('anfrage').map(r => row(r, id => `<button class="btn small" data-fracc="${escHtml(id)}">Annehmen</button><button class="btn ghost small" data-frdel="${escHtml(id)}">Ablehnen</button>`)).join('')}` : ''}
    <div class="label">Freunde</div>
    ${by('freund').length ? by('freund').map(r => row(r, (id, e) => `${e.wid ? `<button class="btn small" data-frvisit="${escHtml(e.wid)}">🏝️ Besuchen</button>` : ''}<button class="btn ghost small" data-frdel="${escHtml(id)}" aria-label="Freund entfernen">✕</button>`)).join('')
      : '<p class="muted">Noch keine – schick deinen Code an jemanden oder gib einen ein.</p>'}
    ${by('gesendet').length ? `<div class="label">Gesendet</div>${by('gesendet').map(r => row(r, id => `<span class="muted">wartet …</span><button class="btn ghost small" data-frdel="${escHtml(id)}" aria-label="Anfrage zurückziehen">✕</button>`)).join('')}` : ''}
    <div class="label">🔗 Besuchs-Link (nur ansehen, ohne Anmeldung)</div>
    <div class="looks"><button class="look${liveOpen ? ' on' : ''}" id="fr-open" aria-pressed="${liveOpen}">${liveOpen ? '✓ Besuche erlaubt' : 'Besuche aus'}</button></div>
    ${liveOpen && wid ? `<div class="fr-code"><small>${escHtml(visitLink(wid))}</small><button class="btn ghost small" id="fr-link">Teilen</button></div>
      <div class="row"><button class="btn ghost small" id="fr-new">Neuen Link machen (der alte geht dann nicht mehr)</button></div>` : '<p class="muted">Freunde können dich immer besuchen – der Link ist für alle anderen.</p>'}
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div></div>`);
  $('m-close').onclick = closeModal;
  const share = async (text, title) => { try { if (navigator.share) { await navigator.share({ title, text }); return; } await navigator.clipboard.writeText(text); toast('Kopiert'); } catch (e) { /* abgebrochen */ } };
  $('fr-copy').onclick = () => share(`Mein Kachelhausen-Freundescode: ${code}`, 'Freundescode');
  $('fr-send').onclick = async () => { try { const err = await frAdd($('fr-in').value); toast(err || '📩 Anfrage geschickt'); if (!err) openFriends(); } catch (e) { toast('Hat nicht geklappt – später nochmal'); } };
  for (const b of document.querySelectorAll('[data-fracc]')) b.onclick = async () => { try { await frAccept(b.dataset.fracc); toast('👥 Ihr seid jetzt befreundet'); } catch (e) { toast('Hat nicht geklappt'); } };
  for (const b of document.querySelectorAll('[data-frdel]')) b.onclick = async () => { try { await frRemove(b.dataset.frdel); } catch (e) { toast('Hat nicht geklappt'); } };
  for (const b of document.querySelectorAll('[data-frvisit]')) b.onclick = () => { save(); location.href = visitLink(b.dataset.frvisit); };
  $('fr-open').onclick = async () => { try { await liveSetOpen(!liveOpen); openFriends(); } catch (e) { toast('Hat nicht geklappt'); } };
  if ($('fr-link')) $('fr-link').onclick = () => share(visitLink(wid), `Besuch in ${state.town.name}`);
  if ($('fr-new')) $('fr-new').onclick = async () => { try { await liveNewLink(); toast('🔗 Neuer Link – der alte geht nicht mehr'); openFriends(); } catch (e) { toast('Hat nicht geklappt'); } };
}

if (VISIT) visitBoot();
