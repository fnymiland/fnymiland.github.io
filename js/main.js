'use strict';
// ---------------------------------------------------------------------------
// Start & Spielschleife
// ---------------------------------------------------------------------------
function startNew() {
  state = newState();
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  walkers.length = 0; cars.length = 0;
  state.tiles.set('2,2', { b: 'rathaus', lvl: 1 });
  for (let x = 3; x <= 5; x++) state.tiles.set(x + ',2', { b: 'strasse', lvl: 1 });
  state.tiles.set('2,3', { b: 'strasse', lvl: 1 });
  state.tiles.set('2,4', { b: 'strasse', lvl: 1 });
  placeLandmarks();
  recalc();
  buildToolbar();
  save();
}

// Probeansicht: Gehwege an Kanten, gedrehte Häuser, schmale Straßen
function probeScene() {
  state = newState();
  state.seed = 4242;
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 1; cx++) state.owned.add(cx + ',' + cy);
  for (let y = -6; y <= 12; y++) for (let x = -6; x <= 12; x++) if (!isSea(x, y)) state.terra.set(x + ',' + y, 'grass');
  const put = (x, y, b, o = {}) => {
    const { walk = 0, ...rest } = o;
    state.tiles.set(x + ',' + y, { b, lvl: 1, ...rest });
    for (const [dx, dy, bit] of [[1, 0, 1], [-1, 0, 2], [0, 1, 4], [0, -1, 8]]) if (walk & bit) state.walks.set(edgeKey(x, y, dx, dy), 'platten');
  };
  // Marktplatz ums Rathaus: alles rundum mit Gehweg
  put(2, 2, 'rathaus', { walk: 15 });
  put(3, 2, 'brunnen', { walk: 15 }); put(3, 1, 'blumen', { walk: 15 }); put(3, 3, 'bank', { walk: 15, rot: 1 });
  put(1, 2, 'baum', { walk: 15 }); put(2, 1, 'laterne', { walk: 15 }); put(2, 3, 'blumen', { walk: 15 });
  put(1, 1, 'blumen', { walk: 15 }); put(1, 3, 'laterne', { walk: 15 });
  for (const [px, py] of [[2, 2], [2, 1], [1, 2], [3, 2], [2, 3], [3, 3], [1, 3], [3, 1], [1, 1]]) state.paved.set(px + ',' + py, 'terrakotta');
  // Einzelne Straßen ohne Häuser: oben mit Gehwegen auf beiden Seiten, darunter ohne
  for (let x = 8; x <= 11; x++) { put(x, -4, 'strasse', { walk: 4 | 8 }); put(x, -2, 'strasse'); }
  // Hauptstraße mit Gehweg auf einer Seite, Querstraße, Kurve, Sackgasse
  for (let x = -4; x <= 7; x++) put(x, 5, 'strasse', { walk: x >= -2 && x <= 4 ? 4 : 0 });
  for (let y = -2; y <= 11; y++) if (y !== 5) put(6, y, 'strasse');
  put(10, 6, 'strasse', { walk: 1 | 2 }); put(10, 7, 'strasse', { walk: 4 | 2 }); put(11, 7, 'strasse', { walk: 4 | 8 });
  put(12, 7, 'strasse', { walk: 4 | 8 });
  put(8, 5, 'strasse', { walk: 4 | 8 }); put(9, 5, 'strasse', { walk: 4 | 8 }); put(10, 5, 'strasse', { walk: 1 | 8 });
  // Häuserzeile: Gehweg zur Straße hin, Tür vorne links (Drehung 1), gemischte Stufen
  for (let x = -2; x <= 4; x++) put(x, 4, 'haus', { walk: 4, rot: 1, lvl: 1 + (x & 1) });
  // gegenüber: Gehweg auf der Straßenseite, Tür zur Straße (hinten, Drehung 2)
  for (let x = -2; x <= 3; x++) put(x, 6, 'haus', { walk: 8, rot: 2 });
  put(4, 6, 'baecker', { walk: 8, rot: 1 });
  // Innenhof: vier Häuser um Beet und Brunnen
  put(-2, 0, 'haus', { walk: 4 | 1, rot: 1 }); put(-1, 0, 'haus', { walk: 4 | 2, rot: 0 });
  put(-2, 2, 'haus', { walk: 8 | 1, rot: 2 }); put(-1, 2, 'haus', { walk: 8 | 2, rot: 3 });
  put(-2, 1, 'blumen', { walk: 1 }); put(-1, 1, 'brunnen', { walk: 2 });
  // Vergleich: ohne Gehweg, einzelne Kanten, verschiedene Drehungen
  put(8, 1, 'haus', { rot: 0 }); put(9, 1, 'haus', { rot: 1, walk: 4 }); put(8, 2, 'haus', { rot: 3, walk: 1 | 4 });
  // Land: Felder und Mühle ohne Gehweg, Schule am Ortsrand
  put(8, 8, 'feld'); put(9, 8, 'feld'); put(8, 9, 'feld'); put(9, 9, 'muehle', { rot: 1 }); put(10, 9, 'feld'); put(9, 10, 'feld');
  put(7, 8, 'schule', { walk: 2 | 8, rot: 1 });
  // Musterfläche mit allen Stilen: Straßen (y=8) mit Gehwegen darunter, Gartenwege (y=10), Pflaster (y=11)
  STYLES.strasse.forEach((st, i) => { for (let j = 0; j < 2; j++) put(-6 + i * 3 + j, 8, 'strasse', { style: st.id }); });
  STYLES.gehweg.forEach((st, i) => { for (let j = 0; j < 2; j++) state.walks.set(edgeKey(-6 + i * 2 + j, 8, 0, 1), st.id); });
  STYLES.weg.forEach((st, i) => { for (let j = 0; j < 2; j++) put(-6 + i * 2 + j, 10, 'weg', { style: st.id }); });
  STYLES.pflaster.forEach((st, i) => state.paved.set((-6 + i * 2) + ',12', st.id));
  for (let y = 7; y <= 13; y++) for (let x = -7; x <= 5; x++) if (!isSea(x, y)) state.terra.set(x + ',' + y, 'grass');
  state.owned.add('-2,2'); state.owned.add('-1,2'); state.owned.add('0,2');
  const c = iso(3, 4);
  cam.x = c.x; cam.y = c.y; cam.z = 1.25;
  recalc();
  buildToolbar();
}

const saved = PROBE ? null : load();
resize();
if (PROBE) {
  probeScene();
  normalizeSmall();
  // ein paar kleine Dekos vor den Häusern
  const add = (x, y, slot, b, rot = 0) => { const k = x + ',' + y; if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]); state.decos.get(k)[slot] = { b, rot }; };
  add(0, 4, 3, 'blumentopf'); add(1, 4, 3, 'bank', 1); add(2, 4, 2, 'busch'); add(2, 4, 3, 'blumentopf');
  add(3, 4, 3, 'laterne'); add(-1, 4, 2, 'hecke'); add(-2, 4, 3, 'blumentopf'); add(9, 1, 3, 'bank', 1); add(9, 1, 2, 'blumentopf');
  add(5, 3, 0, 'busch'); add(5, 3, 1, 'busch'); add(5, 3, 2, 'blumentopf'); add(5, 3, 3, 'bank');
  recalc();
  toast('Probeansicht – hier wird nichts gespeichert');
} else if (saved) {
  state = saved;
  normalizeSmall();
  cam = state.cam;
  recalc();
  buildToolbar();
  creditAway(Date.now() - saved.last, true);
} else {
  startNew();
  showIntro(true);
  if (loadFailure) {
    openModal(`
      <h2>Spielstand nicht lesbar</h2>
      <p>Dein gespeicherter Spielstand konnte nicht gelesen werden. Er wurde <b>nicht gelöscht</b>, sondern als Kopie aufbewahrt (${escHtml(loadFailure)}).</p>
      <p class="muted">Hast du eine gesicherte Datei, kannst du sie im Menü über „Spielstand laden“ zurückholen.</p>
      <div class="row"><button class="btn" id="m-ok">Verstanden</button></div>`);
    $('m-ok').onclick = () => { closeModal(); showIntro(true); };
  }
}

let lastTick = Date.now(), lastHud = 0, lastFloat = 0, lastSlow = 0;
function frame(now) {
  const t = Date.now();
  const dt = Math.min(2, (t - lastTick) / 1000);
  lastTick = t;
  state.money += T.inc * dt;
  state.science += T.sci * dt;
  produce(dt);
  stepMovers(Math.min(dt, 0.1));
  if (now - lastFloat > 250) { spawnIncomeFloats(now); lastFloat = now; }
  if (now - lastSlow > 700) { syncMovers(); checkStars(); lastSlow = now; }
  render(now);
  if (now - lastHud > 200) { updateHud(); lastHud = now; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener('resize', resize);
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.last = Date.now(); save(); }
  else { creditAway(Date.now() - state.last, true); lastTick = Date.now(); }
});
window.addEventListener('pagehide', save);

window.kachelhausen = { get state() { return state; }, recalc, save, checkStars, get T() { return T; }, walkers, cars, produce, updateHud };
