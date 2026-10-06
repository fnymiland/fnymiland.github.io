'use strict';
// ---------------------------------------------------------------------------
// Online-Speicher (Block 93, Stufe 1): freiwillig mit Google anmelden, dann liegt der Spielstand auch in
// der Cloud (Firebase Realtime Database, Projekt „fnymiland“) und ist auf jedem Gerät da. Ohne Anmeldung ändert sich nichts.
// Ablage je Spieler unter users/<uid>:
//   meta    { rev, at, by, sum }      klein – wird bei jedem Abgleich gelesen; rev zählt jede Version hoch
//   save    { rev, data }             der ganze Stand als Text (wie im Browser-Speicher)
//   bindex/<id> { at, sum, why }      frühere Stände (Sicherungen), höchstens CLOUD_BACKUPS
//   backups/<id> { data }
// Regeln (Spielstände sind heilig):
//   • Eine leere/neue Welt überschreibt nie eine bespielte – ein neues Gerät holt immer den Cloud-Stand.
//   • Haben zwei Geräte unterschiedlich weitergespielt, fragt das Spiel; der andere Stand wird vorher gesichert.
//   • Hochgeladen wird nur, was man selbst gemacht hat (cloudTouched aus undoCommit): CLOUD_QUIET ms nach der letzten
//     Aktion, bei Dauerbauen spätestens nach CLOUD_EVERY ms, nie öfter als alle CLOUD_GAP ms –
//     und nur gegen die Version, die dieses Gerät kennt (rev, Transaktion) – sonst wird neu entschieden.
// Stufe 2 (Block 94): Immer nur ein Gerät führt (users/<uid>/lead { dev, name, at, req }). Nur dort wird gerechnet, gebaut und
// hochgeladen; andere Geräte schauen live zu (cloudWatching) und können per „Hier weiterspielen“ übernehmen – das führende
// sichert dann noch und übergibt. Geht das führende in den Hintergrund, sichert es und gibt frei; das nächste übernimmt von selbst.
// Firebase wird erst geladen, wenn man sich anmeldet (oder angemeldet war): wer offline spielt, merkt nichts davon.
// Kein E-Mail-Link (Block 94c): Firebase verschickt im kostenlosen Tarif nur 5 solche Mails am Tag – für alle Spieler zusammen.
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
const FB_VER = '10.14.1', CLOUD_KEY = 'kachelhausen_cloud';
const CLOUD_QUIET = 6000, CLOUD_EVERY = 45000, CLOUD_GAP = 10000, CLOUD_BACKUPS = 10;
let cloudActAt = 0, cloudWatchOff = null, cloudToastAt = 0;   // letzte eigene Aktion; Abmelden vom Live-Horchen
let cloudApi = null;                 // Adapter: Firebase (cloudFirebase) oder im Test eine Attrappe
let cloudUser = null;                // { uid, name }
let cloudState = 'aus';              // aus | laden | ok | offline | konflikt | fehler
let cloudLastUp = 0, cloudBusy = false, cloudFreshOk = false, cloudKnown = null;   // cloudKnown: zuletzt gelesenes meta

// Merkzettel dieses Geräts: mit welchem Konto (uid), welche Version zuletzt abgeglichen (rev), Fingerabdruck des Stands
// danach (sig), eigene Aktionen seitdem (acts); login: hier war jemand angemeldet (Firebase beim Start laden)
function cloudMeta() { try { return JSON.parse(localStorage.getItem(CLOUD_KEY)) || {}; } catch (e) { return {}; } }
function setCloudMeta(m) { try { localStorage.setItem(CLOUD_KEY, JSON.stringify(m)); } catch (e) { /* privates Fenster */ } }
// Kennung dieses Fensters (je Tab eigene, übersteht Neuladen): woran ein Gerät seine eigenen Uploads erkennt
function cloudDevice() {
  try { let d = sessionStorage.getItem(CLOUD_KEY + '_dev'); if (!d) { d = Math.random().toString(36).slice(2, 10); sessionStorage.setItem(CLOUD_KEY + '_dev', d); } return d; }
  catch (e) { return cloudDevice.mem || (cloudDevice.mem = Math.random().toString(36).slice(2, 10)); }
}
function cloudOff() { return !!(PROBE || TESTWELT || VISIT); }          // Testwelt/Probeansicht: nie in die Cloud (sonst ersetzt sie die echte Insel)
// eigene Aktion (aus undoCommit): ab jetzt hat dieses Gerät etwas, das in die Cloud gehört
function cloudTouched() { if (!cloudUser) return; const m = cloudMeta(); m.acts = (m.acts || 0) + 1; setCloudMeta(m); cloudActAt = Date.now(); }
// Bewusst eine ganz andere Welt (Neue Insel, Datei geladen): darf auch leer hochgeladen werden – die alte wird dabei gesichert
function cloudNewWorld() { if (!cloudUser) return; cloudFreshOk = true; cloudTouched(); cloudUpload(true).catch(() => { cloudState = 'offline'; }); }

// Kurzbeschreibung eines Stands (für die Rückfrage und die Liste früherer Stände)
function worldSum(d) {
  return { town: (d.town && d.town.name) || '', earned: Math.round((d.stats && d.stats.earned) || 0), money: Math.round(d.money || 0),
    tiles: (d.tiles || []).length, last: d.last || 0, seed: d.seed };
}
// „leer“: neu angefangen, noch kaum etwas gebaut oder verdient – so eine Welt überschreibt nie eine bespielte
const freshSum = s => !s || (s.earned < 2000 && s.tiles <= 12);
// Fingerabdruck von allem, was nur der Spieler ändert (nicht Taler, Lager, Zeit – die laufen auf jedem Gerät von selbst weiter).
// So zählt jede Änderung – auch Farben, Forschung, Erlasse, die nicht über ↶ laufen.
const SIG_KEYS = ['tiles', 'decos', 'edges', 'terra', 'claimed', 'techs', 'design', 'restore', 'town', 'paintNew', 'inventions', 'vehicles', 'decree', 'festival', 'keep'];
function worldSig(d) {
  const s = JSON.stringify(SIG_KEYS.map(k => d[k] === undefined ? null : d[k]));
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36) + '.' + s.length;
}
const cloudDirty = (local, m = cloudMeta()) => (m.acts || 0) > 0 || worldSig(local) !== m.sig;

// Entscheidung beim Abgleich (reine Funktion, siehe cloud.test.js): local = Kurzbeschreibung dieses Geräts,
// cloud = meta aus der Cloud (oder null), mine = dieses Gerät hat zuletzt mit diesem Konto abgeglichen, rev = welche Version,
// acts = hier seitdem etwas geändert, own = die neueste Cloud-Version hat dieses Fenster selbst beansprucht (Upload unterbrochen)
function cloudDecide({ local, cloud, mine, rev, acts, own }) {
  if (!cloud) return freshSum(local) ? 'none' : 'upload';             // leere Cloud: Bespieltes hochladen
  if (mine && cloud.rev === rev) return acts ? 'upload' : 'none';      // niemand sonst hat inzwischen geschrieben
  if (mine && own) return 'upload';                                    // eigener Upload kam nicht ganz an: hier ist der neueste Stand
  if (freshSum(local)) return 'take';                                  // leer hier → nie hochladen, Cloud holen
  if (freshSum(cloud.sum)) return 'upload';                            // leer dort, bespielt hier
  if (mine && !acts) return 'take';                                    // hier seit dem Abgleich nichts gemacht
  return 'ask';
}

// ---------------------------------------------------------------------------
// Abgleich – immer nur eins zur Zeit (Warteschlange), sonst stolpern zwei Uploads übereinander
// ---------------------------------------------------------------------------
const localSave = () => serialize();
let cloudQ = Promise.resolve(), cloudJobs = 0, cloudSyncWaiting = false, cloudTakeTries = 0;
function cloudRun(fn) {
  cloudJobs++; cloudBusy = true;
  const p = cloudQ.then(fn);
  cloudQ = p.catch(() => {}).then(() => { cloudJobs--; cloudBusy = cloudJobs > 0; });
  return p;
}
function cloudSync(reason = '') {
  if (!cloudUser || cloudOff() || cloudSyncWaiting) return cloudQ;     // schon einer in der Schlange: der sieht das Neueste mit
  cloudSyncWaiting = true;
  return cloudRun(async () => { cloudSyncWaiting = false; await cloudSyncNow(reason); });
}
const cloudUpload = (force = false, local = null, backedUp = false) => cloudRun(() => cloudUploadNow(force, local || localSave(), backedUp));
async function cloudSyncNow(reason) {
  if (!cloudUser || cloudState === 'konflikt') return;
  try {
    const uid = cloudUser.uid, m = cloudMeta(), cloud = await cloudApi.getMeta(uid);
    cloudKnown = cloud;
    const local = localSave(), mine = m.uid === uid;
    // zuschauen: immer den Stand des führenden Geräts. Nur wenn hier noch Ungesichertes aus der eigenen Führungszeit liegt
    // (acts, z. B. offline weitergespielt), entscheidet der normale Weg – dann wird gefragt statt überschrieben.
    if (cloudWatching() && !(m.acts > 0)) {
      if (cloud && (cloud.rev !== m.rev || cloudDirty(local, m))) await cloudTakeNow(cloud, local, 'anderes Gerät', true, true);
      else cloudState = 'ok';
      return;
    }
    const act = cloudDecide({ local: worldSum(local), cloud, mine, rev: m.rev, acts: cloudDirty(local, m), own: !!cloud && cloud.by === cloudDevice() });
    if (act === 'upload') await cloudUploadNow(true, local);
    else if (act === 'take') await cloudTakeNow(cloud, local, reason, mine && !cloudDirty(local, m));
    else if (act === 'ask') { cloudState = 'konflikt'; cloudAsk(cloud, local); }
    else { setCloudMeta({ ...cloudMeta(), uid, rev: cloud ? cloud.rev : m.rev, sig: worldSig(local) }); cloudState = 'ok'; }
  } catch (e) { cloudState = navigator.onLine === false ? 'offline' : 'fehler'; console.warn('Cloud', e); }
}
// Hochladen: erst die nächste Version beanspruchen (nur, wenn die Cloud noch auf der bekannten steht), dann den Stand schreiben.
// Eine andere Welt (neue Insel, Datei geladen, früherer Stand) ersetzt die in der Cloud nie, ohne dass die vorher gesichert wird.
async function cloudUploadNow(force, local, backedUp = false) {
  if (!cloudUser || cloudState === 'konflikt' || cloudOff() || cloudWatching()) return false;   // nur das führende Gerät lädt hoch
  const m = cloudMeta(), uid = cloudUser.uid;
  if (!force && !cloudDirty(local, m)) return false;
  const sum = worldSum(local), acts0 = m.acts || 0;
  if (!cloudKnown) cloudKnown = await cloudApi.getMeta(uid);                   // ohne bekannten Cloud-Stand nichts blind überschreiben
  if (freshSum(sum) && cloudKnown && !freshSum(cloudKnown.sum) && !cloudFreshOk) return false;   // leer über bespielt: nur auf Wunsch
  // gegen welche Version: die zuletzt abgeglichene – oder die eigene, wenn ein Upload dieses Fensters unterbrochen wurde
  const own = cloudKnown && cloudKnown.by === cloudDevice() && m.uid === uid;
  const expect = own ? cloudKnown.rev : m.uid === uid ? (m.rev || 0) : (cloudKnown ? cloudKnown.rev : 0);
  if (!backedUp && cloudKnown && cloudKnown.sum && cloudKnown.sum.seed !== sum.seed && !freshSum(cloudKnown.sum)) {
    const s = await cloudApi.getSave(uid);
    if (s && s.data) await cloudBackup(JSON.parse(s.data), 'Andere Insel, ersetzt durch eine neue');
  }
  const claim = await cloudApi.claim(uid, expect, { by: cloudDevice(), sum });
  if (!claim.ok) { cloudKnown = claim.cur; setTimeout(() => cloudSync('andere Version'), 0); return false; }
  cloudKnown = { rev: claim.rev, by: cloudDevice(), sum };
  await cloudApi.putSave(uid, { rev: claim.rev, data: JSON.stringify(local) });
  if (typeof liveAfterUpload === 'function') liveAfterUpload(claim.rev);       // Spiegel kennt jetzt diese Version (Block 95)
  const now = cloudMeta();                                                       // was während des Hochladens dazukam, zählt weiter
  setCloudMeta({ ...now, uid, rev: claim.rev, acts: Math.max(0, (now.acts || 0) - acts0), sig: worldSig(local) });
  cloudLastUp = Date.now(); cloudFreshOk = false; cloudState = 'ok';
  return true;
}
// Cloud-Stand übernehmen. Der hiesige kommt vorher in die Sicherungen – außer er ist genau der zuletzt abgeglichene (live)
// oder ganz neu. Hat der Spieler inzwischen selbst etwas geändert, wird nicht übernommen, sondern neu entschieden.
async function cloudTakeNow(cloud, local, reason, same = false, follow = false) {
  const uid = cloudUser.uid, s = await cloudApi.getSave(uid);
  if (!s || !s.data) { cloudState = 'ok'; return; }
  if (s.rev !== cloud.rev && cloudTakeTries++ < 3) { cloudState = 'ok'; setTimeout(() => cloudSync('nachladen'), 1500); return; }   // Stand ist noch unterwegs
  cloudTakeTries = 0;                                       // kam er nie an (Gerät mittendrin weg): der letzte vollständige Stand gilt
  const parsed = parseSave(JSON.parse(s.data));             // wirft bei Unsinn – dann bleibt alles, wie es ist
  const m = cloudMeta();
  if (same && !follow && cloudDirty(localSave(), m)) { cloudState = 'ok'; setTimeout(() => cloudSync('selbst geändert'), 0); return; }
  const ls = worldSum(local);
  if (!same && (ls.earned >= 100 || ls.tiles > 5)) await cloudBackup(local, 'Dieses Gerät, vor dem Laden aus der Cloud');
  const keepCam = reason === 'anderes Gerät' && state.town.name === parsed.town.name ? { ...cam } : null;   // live: Blick bleibt, wo er ist
  adoptState(parsed);
  if (keepCam) { state.cam = keepCam; cam = state.cam; }
  if (typeof liveRebase === 'function') liveRebase();                           // läuft der Live-Spiegel, gilt der (er ist neuer)
  setCloudMeta({ ...cloudMeta(), uid, rev: cloud.rev, acts: 0, sig: worldSig(localSave()) });
  cloudState = 'ok';
  if (!keepCam) closePanel();
  if (!keepCam || Date.now() - cloudToastAt > 30000) { cloudToastAt = Date.now(); toast(keepCam ? '☁️ Neues von deinem anderen Gerät' : `☁️ ${state.town.name} aus der Cloud geladen`); }
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
    <p class="muted">Der andere Stand geht nicht verloren: Er liegt danach oben bei dir (Knopf mit deiner Figur) → ☁️ Online → „Frühere Stände“.</p>`);
  $('c-local').onclick = () => cloudResolve('local', cloud);
  $('c-cloud').onclick = () => cloudResolve('cloud', cloud);
}
function cloudResolve(pick, cloud) {
  closeModal();
  return cloudRun(async () => {
    const uid = cloudUser.uid, local = localSave();
    try {
      if (pick === 'local') {
        if (cloudApi.leadTx) {                                                   // wer diesen Stand wählt, spielt hier weiter
          await cloudApi.leadTx(uid, () => leadMe()).catch(() => {});
          cloudLeadInfo = { dev: cloudDevice(), name: deviceName(), at: cloudNow() };
        }
        const s = await cloudApi.getSave(uid);
        if (s && s.data) await cloudBackup(JSON.parse(s.data), 'Cloud-Stand, ersetzt durch ein anderes Gerät');
        setCloudMeta({ ...cloudMeta(), uid, rev: cloud.rev, acts: 1 });
        cloudKnown = cloud; cloudState = 'ok'; cloudFreshOk = true;
        await cloudUploadNow(true, local, true);
        toast('☁️ Dieser Stand ist jetzt auch in der Cloud');
      } else {
        cloudState = 'ok';
        await cloudTakeNow(cloud, local, 'gewählt');
      }
    } catch (e) { cloudState = 'fehler'; toast('☁️ Das hat nicht geklappt – später nochmal'); console.warn('Cloud', e); }
  });
}

// ---------------------------------------------------------------------------
// Anmelden, Abmelden, Fenster im Menü
// ---------------------------------------------------------------------------
function cloudOnUser(u) {
  if (VISIT) { if (typeof visitOnUser === 'function') visitOnUser(u); return; }   // zu Besuch (Block 96): nur wer man ist
  if (cloudWatchOff) { cloudWatchOff(); cloudWatchOff = null; }
  if (cloudOff()) u = null;                                        // Testwelt: nie verbinden
  cloudUser = u ? { uid: u.uid, name: u.email || u.displayName || 'angemeldet', display: u.displayName || '' } : null;
  if (!u) { cloudState = 'aus'; return; }
  setCloudMeta({ ...cloudMeta(), login: true });                  // beim nächsten Start gleich wieder verbinden
  cloudState = 'laden';
  cloudSync('Anmeldung');
  // live horchen: hat ein anderes Gerät eine neue Version hochgeladen, gleich abgleichen (ohne eigene Änderungen: übernehmen)
  const offMeta = cloudApi.watchMeta ? cloudApi.watchMeta(u.uid, meta => {
    if (!meta || !cloudUser || meta.by === cloudDevice() || meta.rev === cloudMeta().rev) return;
    // Live-Spiegel läuft (Block 95): der bringt die Version gleich mit – nur wenn nicht, den ganzen Stand holen
    if (typeof liveFollowing === 'function' && liveFollowing()) { setTimeout(() => { if (meta.rev > (cloudMeta().rev || 0)) cloudSync('anderes Gerät'); }, 4000); return; }
    cloudSync('anderes Gerät');
  }) : () => {};
  const offLead = cloudApi.watchLead ? cloudApi.watchLead(u.uid, lead => cloudOnLead(lead)) : () => {};
  cloudWatchOff = () => { offMeta(); offLead(); cloudLeadInfo = null; cloudLeadUi(); };
  if (!document.hidden) cloudQ.then(() => cloudClaimLead());                      // nach dem ersten Abgleich: führen, wenn frei
}
async function cloudReady() {
  if (cloudApi) return cloudApi;
  cloudApi = await cloudFirebase();
  cloudApi.onUser(cloudOnUser);
  return cloudApi;
}
const cloudStateText = () => ({ aus: 'Nicht angemeldet', laden: 'Gleicht ab …', ok: cloudLastUp ? `Gesichert um ${new Date(cloudLastUp).toLocaleTimeString('de-DE', { timeStyle: 'short' })}` : 'Verbunden',
  offline: 'Offline – wird gesichert, sobald Netz da ist', konflikt: 'Wartet auf deine Wahl', fehler: 'Gerade nicht erreichbar',
  zweites: 'Das Spiel ist in einem anderen Fenster offen – bitte dieses hier schließen' })[cloudState];
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
  if (cloudOff()) { openModal(youHead('online') + '<h3>☁️ Online-Speicher</h3><p>In der Testwelt gibt es keinen Online-Speicher – sie ist zum Ausprobieren da und wird nie gespeichert.</p><div class="row"><button class="btn" id="m-ok">OK</button></div>'); $('m-ok').onclick = closeModal; return; }
  if (!cloudUser) {
    openModal(`
      ${youHead('online')}
      <h3>☁️ Online-Speicher</h3>
      <p>Melde dich an, dann liegt deine Insel sicher in der Cloud und ist auf jedem Gerät da – iPad, Handy, Computer.</p>
      <p class="muted">Freiwillig: Ohne Anmeldung spielst du weiter wie bisher, nur in diesem Browser.</p>
      <div class="row"><button class="btn" id="c-google" disabled>Lädt …</button></div>
      <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
    $('m-close').onclick = closeModal;
    try { await cloudReady(); } catch (e) { if ($('c-google')) $('c-google').textContent = 'Gerade keine Verbindung'; return; }
    if (!$('c-google')) return;
    $('c-google').disabled = false;
    $('c-google').textContent = 'Mit Google anmelden';
    $('c-google').onclick = () => cloudApi.signInGoogle().then(() => { closeModal(); toast('☁️ Angemeldet'); }).catch(e => cloudLoginFail(e));
    return;
  }
  let list = [];
  youTab = 'online';
  try { list = (await cloudApi.listBackups(cloudUser.uid)).sort((p, q) => q.at - p.at); } catch (e) { /* offline: Liste leer */ }
  if (youTab !== 'online') return;                                       // inzwischen anderen Reiter gewählt (Block 98)
  openModal(`
    ${youHead('online')}
    <h3>☁️ Online-Speicher</h3>
    <p>Angemeldet als <b>${escHtml(cloudUser.name)}</b></p>
    <div class="status"><div class="${cloudState === 'ok' ? 'ok' : cloudState === 'konflikt' || cloudState === 'fehler' ? 'bad' : ''}">${cloudStateText()}</div>
      <div>${cloudWatching() ? `👀 Gerade wird auf dem ${escHtml(cloudLeadInfo.name || 'anderen Gerät')} gespielt – hier nur zuschauen` : cloudIsLeader() ? `🎮 Gespielt wird hier (${deviceName()})` : ''}</div></div>
    ${cloudWatching() ? '<div class="row"><button class="btn" id="c-lead" style="flex:1">🎮 Hier weiterspielen</button></div>' : ''}
    <div class="row"><button class="btn" id="c-now" style="flex:1">☁️ Jetzt sichern</button></div>
    ${cloudState === 'konflikt' ? '<div class="row"><button class="btn" id="c-ask" style="flex:1">Stand wählen</button></div>' : ''}
    <div class="label">🕘 Frühere Stände</div>
    ${list.length ? list.map(b => `<div class="cloud-old"><p>${sumHtml(b.sum || {})}<br><small class="muted">${escHtml(b.why || '')} · gesichert ${new Date(b.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</small></p>
      <button class="btn ghost small" data-cback="${escHtml(b.id)}">Zurückholen</button></div>`).join('') : '<p class="muted">Noch keine – hier landet jeder Stand, der ersetzt wurde.</p>'}
    <div class="row"><button class="btn ghost" id="c-out">Abmelden</button><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`);
  $('m-close').onclick = closeModal;
  if ($('c-lead')) $('c-lead').onclick = () => { closeModal(); cloudTakeLead(); };
  $('c-now').onclick = async () => { await cloudSync('Knopf'); if (cloudState === 'ok') { await cloudUpload(true); toast('☁️ Gesichert'); } openCloud(); };
  if ($('c-ask')) $('c-ask').onclick = () => { cloudState = 'ok'; cloudSync('Knopf'); };
  $('c-out').onclick = () => {
    openModal(`<h2>Abmelden?</h2><p>Deine Insel bleibt auf diesem Gerät und in der Cloud. Neues wird erst nach dem nächsten Anmelden wieder gesichert.</p>
      <div class="row"><button class="btn ghost" id="m-no">Lieber nicht</button><button class="btn" id="m-yes">Abmelden</button></div>`);
    $('m-no').onclick = openCloud;
    $('m-yes').onclick = async () => {
      if (cloudIsLeader() && cloudApi.leadTx) { const me = cloudDevice(); await cloudApi.leadTx(cloudUser.uid, cur => cur && cur.dev === me ? null : undefined).catch(() => {}); }
      await cloudApi.signOut(); setCloudMeta({}); cloudOnUser(null); closeModal(); toast('☁️ Abgemeldet');
    };
  };
  for (const b of document.querySelectorAll('[data-cback]')) b.onclick = () => cloudRestore(b.dataset.cback);
}
// Früheren Stand zurückholen: der jetzige wird vorher selbst gesichert
function cloudRestore(id) {
  return cloudRun(async () => {
    const uid = cloudUser.uid;
    try {
      const data = await cloudApi.getBackup(uid, id), parsed = parseSave(JSON.parse(data));
      await cloudBackup(localSave(), 'Vor dem Zurückholen eines früheren Stands');
      adoptState(parsed);
      cloudFreshOk = true; cloudTouched();
      await cloudUploadNow(true, localSave(), true);
      closeModal(); toast(`☁️ ${state.town.name} ist zurück`);
    } catch (e) { toast('☁️ Das hat nicht geklappt'); console.warn('Cloud', e); }
  });
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
  let serverOffset = 0;                                                            // Uhr des Geräts gegen die des Servers (für „wie alt ist die Führung“)
  db.ref('.info/serverTimeOffset').on('value', s => { serverOffset = s.val() || 0; });
  const T = (p, ms = 20000) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('Zeitüberschreitung')), ms))]);
  return {
    onUser: cb => auth.onAuthStateChanged(cb),
    signInGoogle: () => auth.signInWithPopup(new fb.auth.GoogleAuthProvider()),
    signOut: () => auth.signOut(),
    watchMeta: (uid, cb) => { const r = ref(uid, 'meta'), f = s => cb(s.val()); r.on('value', f); return () => r.off('value', f); },
    watchLead: (uid, cb) => { const r = ref(uid, 'lead'), f = s => cb(s.val()); r.on('value', f); return () => r.off('value', f); },
    // Führung ändern: fn(aktuell) → neuer Eintrag | null (frei) | undefined (nichts tun); at wird zur Serverzeit
    leadTx: async (uid, fn) => {
      const r = await T(ref(uid, 'lead').transaction(cur => { const n = fn(cur); return n && n.at === true ? { ...n, at: fb.database.ServerValue.TIMESTAMP } : n; }, undefined, false));
      return { ok: r.committed, cur: r.snapshot.val() };
    },
    now: () => Date.now() + serverOffset,
    // allgemein (Block 95): Pfade relativ zur Wurzel
    get: async p => (await T(db.ref(p).get())).val(),
    set: (p, v) => T(db.ref(p).set(v)),
    update: o => T(db.ref().update(o)),
    tx: async (p, fn) => { const r = await T(db.ref(p).transaction(fn, undefined, false)); return { ok: r.committed, val: r.snapshot.val() }; },
    watch: (p, cb, err) => { const r = db.ref(p), f = s => cb(s.val()); r.on('value', f, e => { if (err) err(e); }); return () => r.off('value', f); },
    TS: () => fb.database.ServerValue.TIMESTAMP,
    leave: p => { db.ref(p).onDisconnect().remove().catch(() => {}); },          // beim Gehen löschen (Besucher-Figur)
    armLead: (uid, on) => { if (!uid) return; const d = ref(uid, 'lead').onDisconnect(); (on ? d.remove() : d.cancel()).catch(() => {}); },
    getMeta: async uid => (await T(ref(uid, 'meta').get())).val(),
    getSave: async uid => (await T(ref(uid, 'save').get(), 60000)).val(),
    // nächste Version beanspruchen, nur wenn die Cloud noch auf expect steht
    claim: async (uid, expect, info) => {
      let next = 0;
      const r = await T(ref(uid, 'meta').transaction(cur => {
        if (cur && (cur.rev || 0) !== expect) return undefined;            // jemand anders war schneller: abbrechen
        next = ((cur && cur.rev) || 0) + 1;
        return { rev: next, at: fb.database.ServerValue.TIMESTAMP, by: info.by, sum: info.sum };
      }, undefined, false));
      return r.committed ? { ok: true, rev: next } : { ok: false, cur: r.snapshot.val() };
    },
    putSave: (uid, s) => T(ref(uid, 'save').set(s), 60000),
    addBackup: async (uid, info, data) => { const id = ref(uid, 'bindex').push().key; await ref(uid, 'backups/' + id).set({ data }); await ref(uid, 'bindex/' + id).set(info); return id; },
    listBackups: async uid => Object.entries((await T(ref(uid, 'bindex').get())).val() || {}).map(([id, b]) => ({ id, ...b })),
    getBackup: async (uid, id) => ((await T(ref(uid, 'backups/' + id).get(), 60000)).val() || {}).data,
    dropBackup: async (uid, id) => { await ref(uid, 'backups/' + id).remove(); await ref(uid, 'bindex/' + id).remove(); },
  };
}

// ---------------------------------------------------------------------------
// Stufe 2: ein Gerät führt (Block 94)
// ---------------------------------------------------------------------------
let LEAD_BEAT = 15000, LEAD_STALE = 45000, LEAD_WAIT = 6000;   // let: im Test kürzer
let cloudLeadInfo = null, cloudLeadWant = 0, cloudBlockedAt = 0;
// Gerätename für „Gerade wird auf dem … gespielt“
function deviceName() {
  const ua = navigator.userAgent || '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android-Handy' : 'Android-Tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows-PC';
  return 'anderen Gerät';
}
const cloudNow = () => (cloudApi && cloudApi.now ? cloudApi.now() : Date.now());
const leadStale = l => !l || typeof l.at !== 'number' || cloudNow() - l.at > LEAD_STALE;
const cloudIsLeader = () => !!cloudUser && !!cloudLeadInfo && cloudLeadInfo.dev === cloudDevice();
// zuschauen: angemeldet, verbunden, und ein anderes Gerät führt gerade (und meldet sich)
function cloudWatching() {
  return !!cloudUser && !!cloudLeadInfo && cloudLeadInfo.dev !== cloudDevice() && !leadStale(cloudLeadInfo)
    && cloudState !== 'offline' && cloudState !== 'konflikt';
}
// nur ansehen: auf einem zuschauenden Gerät oder zu Besuch (Block 95)
function viewOnly() { return !!VISIT || cloudWatching(); }
// Fenster beim Ansehen (Block 95c): Farbfelder & Co. ausblenden, alle anderen Knöpfe, die etwas ändern, sperren –
// Schließen, ? (Hilfe) und Weiterblättern bleiben
const VIEW_OK = '#p-close, #m-close, [data-help], [data-lx], [data-hmore], [data-tab], [data-htab], .grip, .link';
document.addEventListener('click', e => {
  if (!viewOnly()) return;
  const el = e.target.closest && e.target.closest('#panel button, #panel .sw, #panel [role="button"]');
  if (!el || el.closest(VIEW_OK) || el.matches(VIEW_OK)) return;
  e.stopPropagation(); e.preventDefault(); cloudBlocked();
}, true);
setInterval(() => { if (document.body) document.body.classList.toggle('viewonly', viewOnly()); }, 500);
function cloudBlocked() {
  if (Date.now() - cloudBlockedAt < 2500) return;
  cloudBlockedAt = Date.now();
  if (VISIT) { toast('🏝️ Du bist zu Besuch – hier kannst du nur schauen'); return; }
  toast(`👀 Gerade wird auf dem ${(cloudLeadInfo && cloudLeadInfo.name) || 'anderen Gerät'} gespielt – zum Bauen oben „Hier weiterspielen“`);
}
const leadMe = () => ({ dev: cloudDevice(), name: deviceName(), at: true });   // at: true = Serverzeit
// Wird hier gerade gespielt? (letzte Berührung/Taste in der letzten Minute) – nur dann übernimmt ein Gerät eine frei gewordene Führung
const cloudActive = () => typeof lastInput !== 'number' || performance.now() - lastInput < 60000;
// Führen, wenn frei (oder die Führung schon lange nichts von sich hören ließ)
function cloudClaimLead() {
  if (!cloudUser || cloudOff() || document.hidden || !cloudApi.leadTx) return Promise.resolve(false);
  const me = cloudDevice();
  return cloudApi.leadTx(cloudUser.uid, cur => cur && cur.dev === me ? { ...cur, at: true }   // schon meins: Bitte (req) bleibt stehen
    : (!cur || leadStale(cur)) ? leadMe() : undefined).then(r => r.ok).catch(() => false);
}
// „Hier weiterspielen“: das führende Gerät bitten zu übergeben; antwortet es nicht, nach LEAD_WAIT selbst übernehmen
async function cloudTakeLead() {
  if (!cloudUser) return;
  const me = cloudDevice(), want = cloudLeadWant = Date.now();
  cloudLeadUi();
  try {
    await cloudApi.leadTx(cloudUser.uid, cur => (!cur || leadStale(cur) || cur.dev === me) ? leadMe() : { ...cur, req: { dev: me, name: deviceName() } });
    await new Promise(r => setTimeout(r, LEAD_WAIT));
    if (cloudLeadWant !== want || cloudIsLeader()) return;
    await cloudApi.leadTx(cloudUser.uid, cur => (!cur || cur.dev === me || (cur.req && cur.req.dev === me) || leadStale(cur)) ? leadMe() : undefined);
  } catch (e) { toast('☁️ Übernehmen hat nicht geklappt – später nochmal'); }
  finally { if (cloudLeadWant === want) { cloudLeadWant = 0; cloudLeadUi(); } }
}
// Hintergrund: sichern, dann freigeben
function cloudLeaveLead() {
  if (!cloudUser || !cloudApi.leadTx) return;
  const me = cloudDevice(), uid = cloudUser.uid;
  cloudRun(async () => {
    try { if (typeof liveFlush === 'function') await liveFlush(); await cloudUploadNow(false, localSave()); } catch (e) { /* Stand bleibt hier und geht beim nächsten Mal hoch */ }
    await cloudApi.leadTx(uid, cur => cur && cur.dev === me ? null : undefined).catch(() => {});
  });
}
// Neuer Stand der Führung aus der Cloud
function cloudOnLead(lead) {
  const was = cloudIsLeader();
  cloudLeadInfo = lead;
  const me = cloudDevice();
  if (lead && lead.dev === me && lead.req && lead.req.dev !== me) {            // ein anderes Gerät möchte: sichern und übergeben
    const req = lead.req;
    cloudRun(async () => {
      try { if (typeof liveFlush === 'function') await liveFlush(); await cloudUploadNow(false, localSave()); } catch (e) { /* übergeben trotzdem – die Rückfrage fängt es auf */ }
      await cloudApi.leadTx(cloudUser.uid, cur => cur && cur.dev === me && cur.req && cur.req.dev === req.dev ? { dev: req.dev, name: req.name, at: true } : undefined).catch(() => {});
    });
    toast(`📱 Jetzt wird auf dem ${req.name} weitergespielt`);
  }
  if (!was && cloudIsLeader()) {                                                 // jetzt führt dieses Gerät: Neuestes holen, dann spielen
    if (tool !== 'look') setTool('look');
    cloudSync('Führung');
    if (cloudLeadWant) toast('🎮 Du spielst jetzt hier');
    cloudLeadWant = 0;
  }
  if (was && !cloudIsLeader() && tool !== 'look') setTool('look');
  if (!lead && cloudUser && !document.hidden && cloudActive()) cloudClaimLead();   // frei geworden: übernehmen, wenn hier gespielt wird
  if (cloudApi && cloudApi.armLead && was !== cloudIsLeader()) cloudApi.armLead(cloudUser && cloudUser.uid, cloudIsLeader());   // Verbindung weg → Führung frei
  cloudLeadUi();
}
// Band oben: wer gerade spielt, und der Knopf zum Übernehmen
function cloudLeadUi() {
  let el = document.getElementById('lead-band');
  const show = cloudWatching();
  if (!show) { if (el) el.remove(); return; }
  if (!el) {
    const w = document.createElement('div');
    w.innerHTML = '<div id="lead-band" role="status"><span class="lb-text"></span><button class="btn small" id="lead-take">Hier weiterspielen</button></div>';
    el = w.firstChild; document.body.appendChild(el);
    el.querySelector('#lead-take').onclick = () => cloudTakeLead();
  }
  el.querySelector('.lb-text').textContent = `👀 Gerade wird auf dem ${cloudLeadInfo.name || 'anderen Gerät'} gespielt`;
  const b = el.querySelector('#lead-take');
  b.disabled = !!cloudLeadWant; b.textContent = cloudLeadWant ? 'Wird übergeben …' : 'Hier weiterspielen';
}
// Herzschlag: das führende Gerät meldet sich; ist die Führung verwaist, übernimmt ein offenes Gerät
setInterval(() => {
  if (!cloudUser || document.hidden || cloudOff()) return;
  const me = cloudDevice();
  if (!cloudApi || !cloudApi.leadTx) return;
  if (cloudIsLeader()) cloudApi.leadTx(cloudUser.uid, cur => cur && cur.dev === me ? { ...cur, at: true } : undefined).catch(() => {});
  else if ((cloudLeadInfo === null || leadStale(cloudLeadInfo)) && cloudActive()) cloudClaimLead();
  cloudLeadUi();
}, LEAD_BEAT);
// Wer ein Gerät mit freier (oder verwaister) Führung anfasst, spielt dort
addEventListener('pointerdown', () => {
  if (cloudUser && cloudApi && cloudApi.leadTx && !cloudIsLeader() && (cloudLeadInfo === null || leadStale(cloudLeadInfo))) cloudClaimLead();
}, { capture: true, passive: true });

// Start: war man angemeldet, Firebase im Hintergrund laden
function cloudBoot() {
  if (cloudOff()) return;
  if (!cloudMeta().login && !cloudMeta().uid) return;
  cloudReady().catch(() => { cloudState = 'offline'; });
}
// Regelmäßig sichern (nur eigene Aktionen), beim Verlassen sofort, beim Zurückkommen nachsehen, ob ein anderes Gerät weiter ist
function cloudDue(now = Date.now()) {
  return !!cloudUser && cloudState === 'ok' && !cloudBusy && cloudMeta().acts > 0 && now - cloudLastUp > CLOUD_GAP
    && (now - cloudActAt > CLOUD_QUIET || now - cloudLastUp > CLOUD_EVERY);
}
// Änderungen, die nicht über ↶ laufen (Farben, Forschung, Erlasse …): alle paar Sekunden am Fingerabdruck erkennen
let cloudSigAt = 0;
function cloudWatchLocal(now = Date.now()) {
  if (!cloudUser || cloudState !== 'ok' || cloudBusy || now - cloudSigAt < 8000) return;   // (auch beim Zuschauen)
  cloudSigAt = now;
  const m = cloudMeta();
  if (!(m.acts > 0) && m.sig && worldSig(localSave()) !== m.sig) {
    if (cloudWatching()) {                                                  // zuschauen: zurück auf den Stand des führenden Geräts
      cloudBlocked();
      if (typeof liveFollowing === 'function' && liveFollowing()) liveRebase(); else cloudSync('zuschauen');
    }
    else cloudTouched();
  }
}
setInterval(() => { cloudWatchLocal(); if (cloudDue()) cloudUpload().catch(() => { cloudState = 'offline'; }); }, 2000);
document.addEventListener('visibilitychange', () => {
  if (!cloudUser) return;
  if (document.hidden) { save(); cloudLeaveLead(); }                         // sichern und Führung freigeben (Block 94)
  else { cloudSync('zurück'); cloudQ.then(() => cloudClaimLead()); }
});
window.addEventListener('online', () => { if (cloudUser && cloudState === 'offline') { cloudState = 'ok'; cloudSync('online'); } });
// Das Spiel ist in einem zweiten Fenster/Tab offen und speichert dort: beide teilen sich den Browser-Speicher – dieses hier lädt
// dann nichts mehr hoch (sonst schickte es einen veralteten Stand in die Cloud)
window.addEventListener('storage', e => {
  if (e.key !== SAVE_KEY || !cloudUser || cloudState === 'zweites' || cloudIsLeader()) return;
  cloudState = 'zweites';
  toast('☁️ Das Spiel ist noch in einem anderen Fenster offen – hier wird nichts mehr in die Cloud gesichert');
});
cloudBoot();
