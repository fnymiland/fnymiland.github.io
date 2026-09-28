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
  // ein kleiner Sandweg vom Rathaus aus
  for (let x = 3; x <= 5; x++) state.tiles.set(x + ',2', { b: 'weg', lvl: 1, style: 'sand' });
  state.tiles.set('2,3', { b: 'weg', lvl: 1, style: 'sand' });
  state.tiles.set('2,4', { b: 'weg', lvl: 1, style: 'sand' });
  placeLandmarks();
  recalc();
  buildToolbar();
  save();
}

// Probeansicht: ein Dorf mit Wegen in allen Stilen, Plätzen, Dekos auf Wegen
function probeScene() {
  state = newState();
  state.seed = 4242;
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  for (let cy = -1; cy <= 2; cy++) for (let cx = -1; cx <= 1; cx++) state.owned.add(cx + ',' + cy);
  for (let y = -6; y <= 17; y++) for (let x = -6; x <= 12; x++) if (!isSea(x, y)) state.terra.set(x + ',' + y, 'grass');
  const put = (x, y, b, o = {}) => state.tiles.set(x + ',' + y, { b, lvl: 1, ...o });
  const weg = (x, y, style) => put(x, y, 'weg', { style });
  // Marktplatz ums Rathaus (Platten), Brunnen und Beete auf dem Platz
  put(2, 2, 'rathaus');
  for (const [x, y] of [[1, 1], [2, 1], [3, 1], [1, 2], [1, 3], [2, 3], [3, 3]]) weg(x, y, 'platten');
  put(3, 2, 'brunnen');
  // Dorfstraße (Asphalt) nach Osten, Sandweg nach Süden
  for (let x = 4; x <= 10; x++) weg(x, 2, 'asphalt');
  for (let y = 4; y <= 9; y++) weg(2, y, 'sand');
  for (let x = 3; x <= 6; x++) weg(x, 9, 'sand');
  weg(6, 10, 'sand'); weg(6, 11, 'sand');
  // Häuser an den Wegen, mit Dekos auf den Wegfeldern davor
  for (let x = 4; x <= 9; x++) put(x, 1, 'haus', { rot: 1, lvl: 1 + (x & 1) });
  for (let x = 4; x <= 8; x += 2) put(x, 3, 'haus', { rot: 2 });
  for (let y = 5; y <= 8; y++) put(1, y, 'haus', { rot: 0 });
  put(3, 5, 'haus', { rot: 1 }); put(3, 6, 'baecker', { rot: 1 });
  // Gartenweg aus Trittsteinen zum Park, Blütenpfad, Holzbohlen am Teich
  for (let x = 3; x <= 5; x++) weg(x, 7, 'tritt');
  put(6, 7, 'baum'); put(6, 6, 'blumen'); put(5, 6, 'pavillon');
  weg(8, 3, 'blueten'); weg(9, 3, 'blueten'); weg(10, 3, 'blueten');
  // Felder am Ortsrand (ohne Weg) mit Mühle
  put(8, 8, 'feld'); put(9, 8, 'feld'); put(8, 9, 'feld'); put(9, 9, 'muehle', { rot: 1 }); put(10, 9, 'feld');
  // Musterreihe: jeder Stil als kleines Wegstück (y = 13 und 15)
  STYLES.weg.forEach((st, i) => {
    const x = -5 + (i % 8) * 2, y = i < 8 ? 13 : 15;
    weg(x, y, st.id);
    if (st.shape === 'band') weg(x, y + 1, st.id); else weg(x + 1, y, st.id);
  });
  const c = iso(4, 5);
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
  add(5, 2, 0, 'laterne'); add(7, 2, 0, 'laterne'); add(9, 2, 0, 'laterne');         // Laternen am Weg
  add(1, 1, 0, 'blumentopf'); add(1, 3, 3, 'bank', 1); add(3, 3, 3, 'blumentopf');  // auf dem Marktplatz
  add(4, 1, 3, 'blumentopf'); add(5, 1, 3, 'bank', 1); add(6, 1, 3, 'busch');       // vor den Häusern
  add(2, 6, 1, 'blumentopf'); add(2, 8, 2, 'laterne'); add(4, 7, 3, 'busch'); add(5, 7, 0, 'bank');
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
