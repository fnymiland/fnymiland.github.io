'use strict';
// ---------------------------------------------------------------------------
// Start & Spielschleife
// ---------------------------------------------------------------------------
function startNew() {
  resetUnlockWatch();
  plan = null; moving = null;                      // Getragenes gehört zum alten Spiel (dort am alten Platz gespeichert)
  state = newState();
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  walkers.length = 0; cars.length = 0;
  state.tiles.set('2,2', { b: 'rathaus', lvl: 1 });
  // ein kleiner Sandweg vom Rathaus aus
  for (let x = 4; x <= 5; x++) state.tiles.set(x + ',2', { b: 'weg', lvl: 1, style: 'sand' });
  for (let y = 4; y <= 5; y++) state.tiles.set('2,' + y, { b: 'weg', lvl: 1, style: 'sand' });
  state.owned = new Set();
  ownIsland('home');
  placeIslandLandmarks();
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
  for (let cy = -1; cy <= 2; cy++) for (let cx = -1; cx <= 2; cx++) state.owned.add(cx + ',' + cy);
  for (let y = -6; y <= 17; y++) for (let x = -6; x <= 17; x++) state.terra.set(x + ',' + y, 'grass');
  const put = (x, y, b, o = {}) => state.tiles.set(x + ',' + y, { b, lvl: 1, ...o });
  const weg = (x, y, style) => put(x, y, 'weg', { style });
  // Rathaus (2×2) mit Platz aus Platten ringsum
  put(2, 2, 'rathaus');
  for (let y = 1; y <= 4; y++) for (let x = 1; x <= 4; x++) if (!(x >= 2 && x <= 3 && y >= 2 && y <= 3)) weg(x, y, 'platten');
  // Dorfstraße (Asphalt) nach Osten: Häuser im Norden, Markt, Bäckerei und Schule im Süden
  for (let x = 5; x <= 13; x++) weg(x, 2, 'asphalt');
  for (let x = 5; x <= 11; x++) put(x, 1, 'haus', { rot: 1, lvl: 1 + ((x - 5) % 5) });
  put(5, 3, 'haus', { rot: 2 });
  put(6, 3, 'markt', { lvl: 2, rot: 3 });
  put(9, 3, 'baecker', { rot: 3, lvl: 3 });
  put(11, 3, 'schule', { rot: 3, lvl: 2 });
  put(13, 3, 'uni', { rot: 3 });
  // Sandweg nach Süden: Häuser im Westen, Park und Bibliothek im Osten
  for (let y = 5; y <= 10; y++) weg(2, y, 'sand');
  for (let x = 3; x <= 8; x++) weg(x, 10, 'sand');
  for (let y = 6; y <= 9; y++) put(1, y, 'haus', { rot: 0 });
  put(3, 6, 'park');
  put(3, 9, 'bibliothek', { rot: 1 });
  put(5, 9, 'kunst', { rot: 1 });
  // Teich mit Hafen, Sägewerk und Werkstatt am Rand
  for (let y = 6; y <= 9; y++) for (let x = 9; x <= 12; x++) state.terra.set(x + ',' + y, 'water');
  put(7, 6, 'hafen', { lvl: 2 });
  put(7, 8, 'saege', { rot: 1, lvl: 2 });
  put(10, 11, 'fabrik', { rot: 1 });
  // Sehenswürdigkeiten: der Baum in allen vier Zuständen, daneben die anderen fertig restauriert
  [0, 1, 2, 3].forEach((stg, i) => put(-5 + i * 4, -6, 'lm', { lm: 'baum', stage: stg }));
  ['obsthain', 'klippe', 'ruine', 'erzberg', 'quelle', 'kristall'].forEach((lm, i) => put(-5 + i * 4, -2, 'lm', { lm, stage: 3 }));
  // Felder mit Mühle
  put(12, 11, 'feld', { lvl: 2 }); put(13, 11, 'feld', { lvl: 3 }); put(12, 12, 'muehle', { rot: 1, lvl: 3 }); put(13, 12, 'feld');
  // Musterreihe: jeder Stil als kleines Wegstück (y = 13 und 15)
  STYLES.weg.forEach((st, i) => {
    const x = -5 + (i % 8) * 2, y = i < 8 ? 13 : 15;
    weg(x, y, st.id);
    weg(x, y + 1, st.id);
  });
  const c = iso(6, 5);
  cam.x = c.x; cam.y = c.y; cam.z = 1.1;
  recalc();
  buildToolbar();
}

const saved = PROBE ? null : load();
resize();
if (PROBE) {
  probeScene();
  normalizeSmall();
  nameHouses();
  state.tutorial = -1;
  // ein paar kleine Dekos vor den Häusern
  const add = (x, y, slot, b, rot = 0) => { const k = x + ',' + y; if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]); state.decos.get(k)[slot] = { b, rot }; };
  add(6, 2, 0, 'laterne'); add(9, 2, 0, 'laterne'); add(12, 2, 0, 'laterne');        // Laternen an der Straße
  add(1, 1, 0, 'blumentopf'); add(4, 4, 3, 'bank', 1); add(4, 1, 1, 'blumentopf'); add(1, 4, 2, 'laterne');  // am Rathausplatz
  add(5, 1, 3, 'blumentopf'); add(7, 1, 3, 'bank', 1); add(9, 1, 3, 'busch');       // vor den Häusern
  add(2, 6, 1, 'blumentopf'); add(2, 8, 2, 'laterne');
  recalc();
  toast('Probeansicht – hier wird nichts gespeichert');
} else if (saved) {
  state = saved;
  normalizeSmall();
  migrateLandmarks();                  // uralte Stände: gekaufte Sehenswürdigkeiten zählen als Stufe 1 …
  const moved = migrateIslands();      // … und ziehen dann auf ihre Insel um
  ownIslandsFully();
  const grown = growWonders();
  const refunded = fitFootprints();
  delete state.fitLm;
  if (moved) setTimeout(() => announceIslands(moved), 900);
  nameHouses();
  if (grown.length) setTimeout(() => announceWonders(grown), 1200);
  if (refunded.length) setTimeout(() => toast(`Neu: große Gebäude! Kein Platz für ${refunded.join(', ')} – Kosten erstattet.`), 800);
  cam = state.cam;
  recalc();
  buildToolbar();
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

// Bildrate: Beim Bedienen flüssig (höchstens 60/s – 120-Hz-Bildschirme würden sonst doppelt so viel rechnen),
// beim Zuschauen 30/s, im Hintergrund oder nach 2 Minuten ohne Eingabe 15/s. Spart Strom, Rechner und iPad bleiben
// kühl. Geld und Produktion rechnen mit der echten Zeit (dt) und laufen genauso schnell weiter.
let lastInput = performance.now(), lastFrame = -1e9;
for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) {
  addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true, capture: true });
}
function frameInterval(now) {
  const idle = now - lastInput;
  if (idle < 1500) return 1000 / 60;
  if (idle > 120000 || !document.hasFocus()) return 1000 / 15;
  return 1000 / 30;
}
let lastTick = Date.now(), lastHud = 0, lastSlow = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (now - lastFrame < frameInterval(now) - 2) return;   // dieses Bild auslassen
  lastFrame = now;
  const t = Date.now();
  const dt = Math.min(2, (t - lastTick) / 1000);
  lastTick = t;
  earn(dt);
  state.science += T.sci * dt;
  produce(dt);
  stepMovers(Math.min(dt, 0.1));
  if (now - lastSlow > 700) { syncMovers(); checkStars(); collectAlbum(); checkAchievements(); if ($('modal').hidden) checkExpedition(); lastSlow = now; }
  render(now);
  if (now - lastHud > 200) { updateHud(); lastHud = now; }
}
requestAnimationFrame(frame);

window.addEventListener('resize', resize);
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.last = Date.now(); save(); }
  else lastTick = Date.now();          // bewusst nichts nachzahlen: gebaut und verdient wird nur beim Spielen
});
window.addEventListener('pagehide', save);

window.kachelhausen = { get state() { return state; }, recalc, save, checkStars, get T() { return T; }, walkers, cars, produce, updateHud };
