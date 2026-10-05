'use strict';
// ---------------------------------------------------------------------------
// Online-Speicher (Block 93, Stufe 1): freiwillig anmelden (Google oder E-Mail-Link), dann liegt der Spielstand auch in
// der Cloud (Firebase Realtime Database, Projekt „fnymiland“) und ist auf jedem Gerät da. Ohne Anmeldung ändert sich nichts.
// Ablage je Spieler unter users/<uid>:
//   meta    { rev, at, by, sum }      klein – wird bei jedem Abgleich gelesen; rev zählt jede Version hoch
//   save    { rev, data }             der ganze Stand als Text (wie im Browser-Speicher)
//   bindex/<id> { at, sum, why }      frühere Stände (Sicherungen), höchstens CLOUD_BACKUPS
//   backups/<id> { data }
// Regeln (Spielstände sind heilig):
//   • Eine leere/neue Welt überschreibt nie eine bespielte – ein neues Gerät holt immer den Cloud-Stand.
//   • Haben zwei Geräte unterschiedlich weitergespielt, fragt das Spiel; der andere Stand wird vorher gesichert.
//   • Hochgeladen wird nur, was man selbst gemacht hat (cloudTouched aus undoCommit), höchstens alle CLOUD_EVERY ms,
//     und nur gegen die Version, die dieses Gerät kennt (rev, Transaktion) – sonst wird neu entschieden.
// Firebase wird erst geladen, wenn man sich anmeldet (oder angemeldet war): wer offline spielt, merkt nichts davon.
// ---------------------------------------------------------------------------
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBLYqFNDszVkNIoh1naaF-wdEQmqbcSNEo',            // öffentlich – geschützt wird über die Datenbank-Regeln
  authDomain: 'fnymiland.firebaseapp.com',
  databaseURL: 'https://fnymiland-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'fnymiland',
  storageBucket: 'fnymiland.firebasestorage.app',
  messagingSenderId: '663890593085',
  appId: '1:663890593085:web:55eeb23d0e402fa8fa3154',
};
const FB_VER = '10.14.1', CLOUD_KEY = 'kachelhausen_cloud', CLOUD_MAIL = 'kachelhausen_cloud_mail';
const CLOUD_EVERY = 120000, CLOUD_BACKUPS = 10;
let cloudApi = null;                 // Adapter: Firebase (cloudFirebase) oder im Test eine Attrappe
let cloudUser = null;                // { uid, name }
let cloudState = 'aus';              // aus | laden | ok | offline | konflikt | fehler
let cloudLastUp = 0, cloudBusy = false, cloudFreshOk = false, cloudKnown = null;   // cloudKnown: zuletzt gelesenes meta

// Merkzettel dieses Geräts: mit welchem Konto, welche Version zuletzt abgeglichen, wie viele eigene Aktionen seitdem
function cloudMeta() { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch (e) { return {}; } }
function setCloudMeta(m) { try { localStorage.setItem(CLOUD_KEY, JSON.stringify(m)); } catch (e) { /* privates Fenster */ } }
function cloudDevice() { const m = cloudMeta(); if (!m.dev) { m.dev = Math.random().toString(36).slice(2, 10); setCloudMeta(m); } return m.dev; }
// eigene Aktion (aus undoCommit): ab jetzt hat dieses Gerät etwas, das in die Cloud gehört
function cloudTouched() { if (!cloudUser) return; const m = cloudMeta(); m.acts = (m.acts || 0) + 1; setCloudMeta(m); }
// Bewusst eine ganz andere Welt (Neue Insel, Datei geladen): darf auch leer hochgeladen werden – die alte wird dabei gesichert
function cloudNewWorld() { if (!cloudUser) return; cloudFreshOk = true; cloudTouched(); cloudUpload(true).catch(() => { cloudState = 'offline'; }); }

// Kurzbeschreibung eines Stands (für die Rückfrage und die Liste früherer Stände)
function worldSum(d) {
  return { town: (d.town && d.town.name) || '', earned: Math.round((d.stats && d.stats.earned) || 0), money: Math.round(d.money || 0),
    tiles: (d.tiles || []).length, last: d.last || 0, seed: d.seed };
}
// „leer“: neu angefangen, noch kaum etwas gebaut oder verdient – so eine Welt überschreibt nie eine bespielte
const freshSum = s => !s || (s.earned < 2000 && s.tiles <= 12);

// Entscheidung beim Abgleich (reine Funktion, siehe cloud.test.js): local = Kurzbeschreibung dieses Geräts,
// cloud = meta aus der Cloud (oder null), mine = dieses Gerät hat zuletzt mit diesem Konto abgeglichen, acts = eigene Aktionen seitdem
function cloudDecide({ local, cloud, mine, rev, acts }) {
  if (!cloud) return freshSum(local) ? 'none' : 'upload';             // leere Cloud: Bespieltes hochladen
  if (mine && cloud.rev === rev) return acts ? 'upload' : 'none';      // niemand sonst hat inzwischen geschrieben
  if (freshSum(local)) return 'take';                                  // leer hier → nie hochladen, Cloud holen
  if (freshSum(cloud.sum)) return 'upload';                            // leer dort, bespielt hier
  if (mine && !acts) return 'take';                                    // hier seit dem Abgleich nichts gemacht
  return 'ask';
}

// ---------------------------------------------------------------------------
// Abgleich
// ---------------------------------------------------------------------------
const localSave = () => serialize();
async function cloudSync(reason = '') {
  if (!cloudUser || cloudBusy || cloudState === 'konflikt') return;
  cloudBusy = true;
  try {
    const uid = cloudUser.uid, m = cloudMeta(), cloud = await cloudApi.getMeta(uid);
    cloudKnown = cloud;
    const local = localSave(), act = cloudDecide({ local: worldSum(local), cloud, mine: m.uid === uid, rev: m.rev, acts: m.acts || 0 });
    if (act === 'upload') await cloudUpload(true, local);
    else if (act === 'take') await cloudTake(cloud, local, reason);
    else if (act === 'ask') { cloudState = 'konflikt'; cloudAsk(cloud, local); return; }
    else { setCloudMeta({ ...cloudMeta(), uid, rev: cloud ? cloud.rev : m.rev }); cloudState = 'ok'; }
  } catch (e) { cloudState = navigator.onLine === false ? 'offline' : 'fehler'; console.warn('Cloud', e); }
  finally { cloudBusy = false; }
}
// Hochladen: erst die nächste Version beanspruchen (nur, wenn die Cloud noch auf der bekannten steht), dann den Stand schreiben
// Eine andere Welt (neue Insel, Datei geladen, früherer Stand) ersetzt die in der Cloud nie, ohne dass die vorher gesichert wird.
async function cloudUpload(force = false, local = localSave(), backedUp = false) {
  if (!cloudUser || cloudState === 'konflikt') return false;
  const m = cloudMeta(), uid = cloudUser.uid;
  if (!force && !(m.acts > 0)) return false;
  const sum = worldSum(local);
  if (!cloudKnown) cloudKnown = await cloudApi.getMeta(uid);                   // ohne bekannten Cloud-Stand nichts blind überschreiben
  if (freshSum(sum) && cloudKnown && !freshSum(cloudKnown.sum) && !cloudFreshOk) return false;   // leer über bespielt: nur auf Wunsch
  const expect = m.uid === uid ? (m.rev || 0) : (cloudKnown ? cloudKnown.rev : 0);
  if (!backedUp && cloudKnown && cloudKnown.sum && cloudKnown.sum.seed !== sum.seed && !freshSum(cloudKnown.sum)) {
    const s = await cloudApi.getSave(uid);
    if (s && s.data) await cloudBackup(JSON.parse(s.data), 'Andere Insel, ersetzt durch eine neue');
  }
  const claim = await cloudApi.claim(uid, expect, { by: cloudDevice(), sum });
  if (!claim.ok) { cloudKnown = claim.cur; cloudState = 'ok'; setTimeout(() => cloudSync('andere Version'), 0); return false; }
  await cloudApi.putSave(uid, { rev: claim.rev, data: JSON.stringify(local) });
  setCloudMeta({ ...cloudMeta(), uid, rev: claim.rev, acts: 0 });
  cloudKnown = { rev: claim.rev, sum }; cloudLastUp = Date.now(); cloudFreshOk = false; cloudState = 'ok';
  return true;
}
// Cloud-Stand übernehmen; der hiesige kommt vorher in die Sicherungen (außer er ist ganz neu)
async function cloudTake(cloud, local, reason) {
  const uid = cloudUser.uid, s = await cloudApi.getSave(uid);
  if (!s || s.rev !== cloud.rev) { cloudState = 'ok'; return; }                 // Stand ist noch unterwegs: später nochmal
  const parsed = parseSave(JSON.parse(s.data));                                 // wirft bei Unsinn – dann bleibt alles, wie es ist
  const ls = worldSum(local);
  if (ls.earned >= 100 || ls.tiles > 5) await cloudBackup(local, 'Dieses Gerät, vor dem Laden aus der Cloud');
  adoptState(parsed);
  setCloudMeta({ ...cloudMeta(), uid, rev: cloud.rev, acts: 0 });
  cloudState = 'ok';
  closePanel();
  toast(`☁️ ${state.town.name} aus der Cloud geladen${reason ? '' : ''}`);
}
async function cloudBackup(d, why) {
  const uid = cloudUser.uid;
  await cloudApi.addBackup(uid, { at: Date.now(), sum: worldSum(d), why }, JSON.stringify(d));
  const list = await cloudApi.listBackups(uid);
  for (const b of list.sort((p, q) => q.at - p.at).slice(CLOUD_BACKUPS)) await cloudApi.dropBackup(uid, b.id);
}

// Zwei verschiedene Stände: fragen, welcher weitergeht – der andere wird gesichert (nie geht etwas verloren)
const sumHtml = s => `<b>${escHtml(s.town || 'Insel')}</b><br>🪙 ${fmt(s.earned)} verdient · 🏗️ ${fmt(s.tiles)} Felder bebaut
  ${s.last ? `<br><small class="muted">zuletzt gespielt ${new Date(s.last).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</small>` : ''}`;
function cloudAsk(cloud, local) {
  openModal(`
    <h2>☁️ Zwei verschiedene Spielstände</h2>
    <p>Auf diesem Gerät und in der Cloud wurde unterschiedlich weitergespielt. Welcher Stand soll weitergehen?</p>
    <div class="cloud-pick">
      <div class="cloud-card"><div class="label">📱 Dieses Gerät</div><p>${sumHtml(worldSum(local))}</p><button class="btn" id="c-local">Diesen weiterspielen</button></div>
      <div class="cloud-card"><div class="label">☁️ Cloud</div><p>${sumHtml(cloud.sum || {})}</p><button class="btn" id="c-cloud">Diesen weiterspielen</button></div>
    </div>
    <p class="muted">Der andere Stand geht nicht verloren: Er liegt danach unter ☰ → ☁️ Online-Speicher → „Frühere Stände“.</p>`);
  $('c-local').onclick = () => cloudResolve('local', cloud);
  $('c-cloud').onclick = () => cloudResolve('cloud', cloud);
}
async function cloudResolve(pick, cloud) {
  closeModal();
  const uid = cloudUser.uid, local = localSave();
  try {
    if (pick === 'local') {
      const s = await cloudApi.getSave(uid);
      if (s && s.data) await cloudBackup(JSON.parse(s.data), 'Cloud-Stand, ersetzt durch ein anderes Gerät');
      setCloudMeta({ ...cloudMeta(), uid, rev: cloud.rev, acts: 1 });
      cloudKnown = cloud; cloudState = 'ok'; cloudFreshOk = true;
      await cloudUpload(true, local, true);
      toast('☁️ Dieser Stand ist jetzt auch in der Cloud');
    } else {
      cloudState = 'ok';
      await cloudTake(cloud, local, 'gewählt');
    }
  } catch (e) { cloudState = 'fehler'; toast('☁️ Das hat nicht geklappt – später nochmal'); console.warn('Cloud', e); }
}

// ---------------------------------------------------------------------------
// Anmelden, Abmelden, Fenster im Menü
// ---------------------------------------------------------------------------
function cloudOnUser(u) {
  cloudUser = u ? { uid: u.uid, name: u.email || u.displayName || 'angemeldet' } : null;
  if (!u) { cloudState = 'aus'; return; }
  cloudState = 'laden';
  cloudSync('Anmeldung');
}
async function cloudReady() {
  if (cloudApi) return cloudApi;
  cloudApi = await cloudFirebase();
  cloudApi.onUser(cloudOnUser);
  return cloudApi;
}
const cloudStateText = () => ({ aus: 'Nicht angemeldet', laden: 'Gleicht ab …', ok: cloudLastUp ? `Gesichert um ${new Date(cloudLastUp).toLocaleTimeString('de-DE', { timeStyle: 'short' })}` : 'Verbunden',
  offline: 'Offline – wird gesichert, sobald Netz da ist', konflikt: 'Wartet auf deine Wahl', fehler: 'Gerade nicht erreichbar' })[cloudState];
// Verständliche Meldungen, wenn die Anmeldung nicht klappt (iPhone: Pop-ups, privater Modus, App-Browser)
function cloudLoginFail(e) {
  const code = (e && e.code) || '';
  const why = {
    'auth/popup-blocked': 'Das Anmeldefenster wurde blockiert. Erlaube Pop-ups für diese Seite (iPhone: Einstellungen → Safari → „Pop-ups blockieren“ aus) und tippe nochmal.',
    'auth/popup-closed-by-user': 'Das Anmeldefenster wurde geschlossen, bevor die Anmeldung fertig war.',
    'auth/cancelled-popup-request': 'Das Anmeldefenster wurde geschlossen, bevor die Anmeldung fertig war.',
    'auth/unauthorized-domain': `Diese Adresse (${location.hostname}) ist in Firebase noch nicht erlaubt – unter Authentication → Einstellungen → Autorisierte Domains eintragen.`,
    'auth/web-storage-unsupported': 'Im privaten Modus geht die Anmeldung nicht – bitte ein normales Fenster nehmen.',
    'auth/operation-not-supported-in-this-environment': 'In diesem Browser geht die Anmeldung nicht. Öffne die Seite direkt in Safari oder Chrome (nicht in WhatsApp & Co.).',
    'auth/network-request-failed': 'Keine Verbindung zum Internet.',
  }[code];
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') { toast(why); return; }
  openModal(`<h2>☁️ Anmeldung hat nicht geklappt</h2><p>${why || 'Etwas ist schiefgegangen.'}</p>${code ? `<p class="muted">${escHtml(code)}</p>` : ''}
    <div class="row"><button class="btn" id="m-ok">OK</button></div>`);
  $('m-ok').onclick = openCloud;
}
async function openCloud() {
  if (!cloudUser) {
    openModal(`
      <h2>☁️ Online-Speicher</h2>
      <p>Melde dich an, dann liegt deine Insel sicher in der Cloud und ist auf jedem Gerät da – iPad, Handy, Computer.</p>
      <p class="muted">Freiwillig: Ohne Anmeldung spielst du weiter wie bisher, nur in diesem Browser.</p>
      <div class="row"><button class="btn" id="c-google" disabled>Lädt …</button></div>
      <div class="label">Oder per E-Mail (ohne Passwort)</div>
      <input id="c-mail" class="cloud-mail" type="email" placeholder="deine@email.de" autocomplete="email" aria-label="E-Mail-Adresse">
      <div class="row"><button class="btn ghost" id="c-send" style="flex:1" disabled>Anmelde-Link schicken</button></div>
      <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
    $('m-close').onclick = closeModal;
    try { await cloudReady(); } catch (e) { if ($('c-google')) $('c-google').textContent = 'Gerade keine Verbindung'; return; }
    if (!$('c-google')) return;
    $('c-google').disabled = false; $('c-send').disabled = false;
    $('c-google').textContent = 'Mit Google anmelden';
    $('c-google').onclick = () => cloudApi.signInGoogle().then(() => { closeModal(); toast('☁️ Angemeldet'); }).catch(e => cloudLoginFail(e));
    $('c-send').onclick = () => {
      const mail = $('c-mail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(mail)) { toast('Bitte eine E-Mail-Adresse eintippen'); return; }
      try { localStorage.setItem(CLOUD_MAIL, mail); } catch (e) { /* dann fragt das Spiel beim Öffnen des Links nach */ }
      cloudApi.sendLink(mail, location.origin + location.pathname).then(() => {
        openModal(`<h2>📧 Link ist unterwegs</h2><p>Öffne die E-Mail an <b>${escHtml(mail)}</b> auf diesem Gerät und tippe auf den Link – dann bist du angemeldet.</p>
          <p class="muted">Keine Mail da? Schau im Spam-Ordner nach.</p><div class="row"><button class="btn" id="m-ok">OK</button></div>`);
        $('m-ok').onclick = closeModal;
      }).catch(e => toast('Link ging nicht raus' + (e && e.code ? ` (${e.code})` : '')));
    };
    return;
  }
  let list = [];
  try { list = (await cloudApi.listBackups(cloudUser.uid)).sort((p, q) => q.at - p.at); } catch (e) { /* offline: Liste leer */ }
  openModal(`
    <h2>☁️ Online-Speicher</h2>
    <p>Angemeldet als <b>${escHtml(cloudUser.name)}</b></p>
    <div class="status"><div class="${cloudState === 'ok' ? 'ok' : cloudState === 'konflikt' || cloudState === 'fehler' ? 'bad' : ''}">${cloudStateText()}</div></div>
    <div class="row"><button class="btn" id="c-now" style="flex:1">☁️ Jetzt sichern</button></div>
    ${cloudState === 'konflikt' ? '<div class="row"><button class="btn" id="c-ask" style="flex:1">Stand wählen</button></div>' : ''}
    <div class="label">🕘 Frühere Stände</div>
    ${list.length ? list.map(b => `<div class="cloud-old"><p>${sumHtml(b.sum || {})}<br><small class="muted">${escHtml(b.why || '')} · gesichert ${new Date(b.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</small></p>
      <button class="btn ghost small" data-cback="${escHtml(b.id)}">Zurückholen</button></div>`).join('') : '<p class="muted">Noch keine – hier landet jeder Stand, der ersetzt wurde.</p>'}
    <div class="row"><button class="btn ghost" id="c-out">Abmelden</button><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('m-close').onclick = closeModal;
  $('c-now').onclick = async () => { await cloudSync('Knopf'); if (cloudState === 'ok') { await cloudUpload(true); toast('☁️ Gesichert'); } openCloud(); };
  if ($('c-ask')) $('c-ask').onclick = () => { cloudState = 'ok'; cloudSync('Knopf'); };
  $('c-out').onclick = () => {
    openModal(`<h2>Abmelden?</h2><p>Deine Insel bleibt auf diesem Gerät und in der Cloud. Neues wird erst nach dem nächsten Anmelden wieder gesichert.</p>
      <div class="row"><button class="btn ghost" id="m-no">Lieber nicht</button><button class="btn" id="m-yes">Abmelden</button></div>`);
    $('m-no').onclick = openCloud;
    $('m-yes').onclick = async () => { await cloudApi.signOut(); setCloudMeta({ dev: cloudDevice() }); cloudOnUser(null); closeModal(); toast('☁️ Abgemeldet'); };
  };
  for (const b of document.querySelectorAll('[data-cback]')) b.onclick = () => cloudRestore(b.dataset.cback);
}
// Früheren Stand zurückholen: der jetzige wird vorher selbst gesichert
async function cloudRestore(id) {
  const uid = cloudUser.uid;
  try {
    const data = await cloudApi.getBackup(uid, id), parsed = parseSave(JSON.parse(data));
    await cloudBackup(localSave(), 'Vor dem Zurückholen eines früheren Stands');
    adoptState(parsed);
    cloudFreshOk = true; cloudTouched();
    await cloudUpload(true, localSave(), true);
    closeModal(); toast(`☁️ ${state.town.name} ist zurück`);
  } catch (e) { toast('☁️ Das hat nicht geklappt'); console.warn('Cloud', e); }
}

// Anmelde-Link aus der E-Mail: beim Öffnen der Seite erkennen und abschließen
async function cloudFinishLink() {
  const api = await cloudReady();
  if (!api.isLink(location.href)) return;
  let mail = null;
  try { mail = localStorage.getItem(CLOUD_MAIL); } catch (e) { /* fragen */ }
  const finish = async m => {
    try { await api.finishLink(m, location.href); toast('☁️ Angemeldet'); }
    catch (e) { toast('Der Link ist abgelaufen oder schon benutzt – bitte neu anfordern'); }
    history.replaceState(null, '', location.pathname);
  };
  if (mail) { finish(mail); return; }
  openModal(`<h2>☁️ Anmeldung abschließen</h2><p>Mit welcher E-Mail-Adresse hast du den Link angefordert?</p>
    <input id="c-mail2" class="cloud-mail" type="email" autocomplete="email" aria-label="E-Mail-Adresse"><div class="row"><button class="btn" id="m-ok">Anmelden</button></div>`);
  $('m-ok').onclick = () => { closeModal(); finish($('c-mail2').value.trim()); };
}

// Firebase (compat-Bibliotheken von Google) erst bei Bedarf laden
function loadScript(src) {
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('laden: ' + src)); document.head.append(s); });
}
async function cloudFirebase() {
  const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
  for (const f of ['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js']) await loadScript(base + f);
  const fb = window.firebase, app = fb.apps.length ? fb.app() : fb.initializeApp(FIREBASE_CONFIG), auth = app.auth(), db = app.database();
  const ref = (uid, p) => db.ref(`users/${uid}/${p}`);
  return {
    onUser: cb => auth.onAuthStateChanged(cb),
    signInGoogle: () => auth.signInWithPopup(new fb.auth.GoogleAuthProvider()),
    sendLink: (mail, url) => auth.sendSignInLinkToEmail(mail, { url, handleCodeInApp: true }),
    isLink: href => auth.isSignInWithEmailLink(href),
    finishLink: (mail, href) => auth.signInWithEmailLink(mail, href),
    signOut: () => auth.signOut(),
    getMeta: async uid => (await ref(uid, 'meta').get()).val(),
    getSave: async uid => (await ref(uid, 'save').get()).val(),
    // nächste Version beanspruchen, nur wenn die Cloud noch auf expect steht
    claim: async (uid, expect, info) => {
      let next = 0;
      const r = await ref(uid, 'meta').transaction(cur => {
        if (cur && (cur.rev || 0) !== expect) return undefined;            // jemand anders war schneller: abbrechen
        next = ((cur && cur.rev) || 0) + 1;
        return { rev: next, at: fb.database.ServerValue.TIMESTAMP, by: info.by, sum: info.sum };
      }, undefined, false);
      return r.committed ? { ok: true, rev: next } : { ok: false, cur: r.snapshot.val() };
    },
    putSave: (uid, s) => ref(uid, 'save').set(s),
    addBackup: async (uid, info, data) => { const id = ref(uid, 'bindex').push().key; await ref(uid, 'backups/' + id).set({ data }); await ref(uid, 'bindex/' + id).set(info); return id; },
    listBackups: async uid => Object.entries((await ref(uid, 'bindex').get()).val() || {}).map(([id, b]) => ({ id, ...b })),
    getBackup: async (uid, id) => ((await ref(uid, 'backups/' + id).get()).val() || {}).data,
    dropBackup: async (uid, id) => { await ref(uid, 'backups/' + id).remove(); await ref(uid, 'bindex/' + id).remove(); },
  };
}

// Start: war man angemeldet oder kommt man über den Link aus der E-Mail, Firebase im Hintergrund laden
function cloudBoot() {
  if (PROBE || TESTWELT) return;
  const link = /[?&]oobCode=/.test(location.search) && /[?&]mode=signIn/.test(location.search);
  if (!cloudMeta().uid && !link) return;
  cloudReady().then(() => { if (link) cloudFinishLink(); }).catch(() => { cloudState = 'offline'; });
}
// Regelmäßig sichern (nur eigene Aktionen), beim Verlassen sofort, beim Zurückkommen nachsehen, ob ein anderes Gerät weiter ist
setInterval(() => { if (cloudUser && cloudState === 'ok' && Date.now() - cloudLastUp > CLOUD_EVERY) cloudUpload().catch(() => { cloudState = 'offline'; }); }, 20000);
document.addEventListener('visibilitychange', () => {
  if (!cloudUser) return;
  if (document.hidden) { save(); cloudUpload().catch(() => {}); } else cloudSync('zurück');
});
window.addEventListener('online', () => { if (cloudUser && cloudState !== 'konflikt') { cloudState = 'ok'; cloudSync('online'); } });
cloudBoot();
