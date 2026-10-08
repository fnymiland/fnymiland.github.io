'use strict';
// ---------------------------------------------------------------------------
// Start & Spielschleife
// ---------------------------------------------------------------------------
function startNew() {
  resetUnlockWatch(); resetSales();
  waterChanged();
  plan = null; moving = null;                      // Getragenes gehört zum alten Spiel (dort am alten Platz gespeichert)
  rotManual = false;
  state = newState();
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  if (typeof resetDrawCaches === 'function') resetDrawCaches();   // Bildchen und Boden der alten Insel weg (Block 124)
  walkers.length = 0; cars.length = 0;
  resetUndo();                                     // ↶ gehört zur alten Insel (Block 84a)
  state.tiles.set('1,1', { b: 'rathaus', lvl: 1 });           // 3×3 (1–3): die Wege unten führen an seine Seiten
  // ein kleiner Sandweg vom Rathaus aus
  for (let x = 4; x <= 5; x++) state.tiles.set(x + ',2', { b: 'weg', lvl: 1, style: 'sand' });
  for (let y = 4; y <= 5; y++) state.tiles.set('2,' + y, { b: 'weg', lvl: 1, style: 'sand' });
  state.owned = new Set();
  registerFar();                                   // keine fernen Inseln mehr, Welt wieder klein
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
  put(9, 3, 'baecker', { rot: 3, lvl: 3 });
  put(11, 3, 'schule', { rot: 3, lvl: 2 });
  put(13, 3, 'uni', { rot: 3 });
  // Sandweg nach Süden: Häuser im Westen, Park und Bibliothek im Osten
  for (let y = 5; y <= 10; y++) weg(2, y, 'sand');
  for (let x = 3; x <= 8; x++) weg(x, 10, 'sand');
  for (let y = 6; y <= 9; y++) put(1, y, 'haus', { rot: 0 });
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) state.terra.set((3 + i) + ',' + (6 + j), 'park');   // Park: Rasen mit Brunnen
  put(4, 7, 'brunnen');
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

const saved = PROBE || VISIT ? null : load();
resize();
if (PROBE) {
  probeScene();
  normalizeSmall();
  nameHouses();
  state.tutorial = -1;
  // ein paar kleine Dekos vor den Häusern
  const add = (x, y, slot, b, rot = 0) => { const k = x + ',' + y; if (!state.decos.has(k)) state.decos.set(k, newSlots()); state.decos.get(k)[slot] = { b, rot }; };
  add(6, 2, 0, 'laterne'); add(9, 2, 0, 'laterne'); add(12, 2, 0, 'laterne');        // Laternen an der Straße
  add(1, 1, 0, 'blumentopf'); add(4, 4, 3, 'bank', 1); add(4, 1, 1, 'blumentopf'); add(1, 4, 2, 'laterne');  // am Rathausplatz
  add(5, 1, 3, 'blumentopf'); add(7, 1, 3, 'bank', 1); add(9, 1, 3, 'busch');       // vor den Häusern
  add(2, 6, 1, 'blumentopf'); add(2, 8, 2, 'laterne');
  recalc();
  toast('Probeansicht – hier wird nichts gespeichert');
} else if (saved) {
  state = saved;
  cam = state.cam;
  afterLoad();
  buildToolbar();
  newsAfterLoad(true);
} else if (VISIT) {
  startNew();                                      // Platzhalter, bis die besuchte Insel da ist (live.js: visitBoot)
} else {
  startNew();
  showIntro(true);
  newsAfterLoad(false);
  if (loadFailure) {
    openModal(`
      <h2>Spielstand nicht lesbar</h2>
      ${saveBlocked ? `<p>Dein gespeicherter Spielstand konnte nicht gelesen werden, und für eine Kopie ist kein Platz. Er ist noch da –
      <b>sichere ihn als Datei</b>, bevor du neu anfängst. Bis dahin wird nichts gespeichert.</p>` : `<p>Dein gespeicherter Spielstand konnte nicht gelesen werden. Er wurde <b>nicht gelöscht</b>, sondern als Kopie aufbewahrt (${escHtml(loadFailure)}).</p>`}
      <p class="muted">Hast du eine gesicherte Datei, kannst du sie im Menü über „Spielstand laden“ zurückholen.</p>
      <div class="row">${saveBlocked ? '<button class="btn" id="m-raw">💾 Als Datei sichern</button>' : ''}<button class="btn${saveBlocked ? ' ghost' : ''}" id="m-ok">${saveBlocked ? 'Später' : 'Verstanden'}</button></div>`);
    $('m-ok').onclick = () => { closeModal(); showIntro(true); };
    if (saveBlocked) $('m-raw').onclick = () => {    // den unlesbaren Text unverändert herunterladen, danach darf neu gespeichert werden
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([saveBlocked], { type: 'application/json' }));
      a.download = 'kachelhausen-unlesbar.json';
      document.body.append(a); a.click(); a.remove();
      saveBlocked = false; save();
      closeModal(); showIntro(true);
    };
  }
}

// Bildrate: Beim Bedienen flüssig (höchstens 60/s – 120-Hz-Bildschirme würden sonst doppelt so viel rechnen),
// beim Zuschauen 30/s, im Hintergrund oder nach 2 Minuten ohne Eingabe 15/s. Spart Strom, Rechner und iPad bleiben
// kühl. Geld und Produktion rechnen mit der echten Zeit (dt) und laufen genauso schnell weiter.
// Block 79: Bildrate wählbar – „flüssig“ (immer 60/s, nur im Hintergrund 30/s) oder „sparsam“ (wie oben). Gilt je Gerät
// (localStorage, nicht im Spielstand); ohne Wahl am PC flüssig, mit Touchscreen (iPad, Handy) sparsam.
const FPS_KEY = 'kachelhausen-bildrate';
const touchDevice = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
let fpsMode = (() => { try { return localStorage.getItem(FPS_KEY); } catch (e) { return null; } })() || (touchDevice() ? 'sparsam' : 'fluessig');
function setFpsMode(m) { fpsMode = m; try { localStorage.setItem(FPS_KEY, m); } catch (e) { /* privates Fenster: gilt bis zum Neuladen */ } }
let lastInput = performance.now(), lastFrame = -1e9;
for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart']) {
  addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true, capture: true });
}
function frameInterval(now) {
  if (fpsMode === 'fluessig') return document.hasFocus() ? 1000 / 60 : 1000 / 30;
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
  const dt = Math.max(0, Math.min(2, (t - lastTick) / 1000));   // Uhr zurückgestellt: nichts abziehen (Block 84c)
  lastTick = t;
  const live = !(typeof viewOnly === 'function' && viewOnly());   // zuschauen/Besuch (Block 94/95): gerechnet wird nur dort, wo gespielt wird
  if (live) {
    earn(dt);
    state.science += T.sci * boostMul('sci') * dt;
    produce(dt);
    peakTick(dt);                                         // bestes Einkommen sinkt langsam (Preise nach Umbau)
  }
  stepMovers(Math.min(dt, 0.1));
  if (now - lastSlow > 700) {
    syncMovers(); checkStars();
    if (live) { collectAlbum(); checkAchievements(); if ($('modal').hidden) checkExpedition(); checkOrders(); fairTick(); marktTick(); parkFestTick(); fzFestTick(); }
    starTick(now); royalFireTick(); lightFireTick(); bubbleTick(now); natureTick(now); showcaseTick(now); lastSlow = now;
  }
  const rt = MESS ? performance.now() : 0;
  render(now);
  if (MESS) messLine(performance.now() - rt);
  if (now - lastHud > 200) { updateHud(); lastHud = now; }
}
// ?messen (Block 124): Zeit je Bild (gleitend), Boden / Objekte / Nacht, Lichter, Bildchen fehlend/neu, Zoom
function messLine(ms) {
  MESS.ms += 0.1 * (ms - MESS.ms);
  const now = performance.now(), gap = MESS.at ? now - MESS.at : 16; MESS.at = now;   // echter Bildabstand (mit Grafikkarte)
  MESS.gap = (MESS.gap || 16) + 0.1 * (Math.min(gap, 500) - (MESS.gap || 16));
  // als Kasten rechts in der Mitte (unten liegt die Bauleiste darüber), eine Sache je Zeile
  const bg = typeof GLB !== 'undefined' && GLB.st === 'run' && GLB.V ? ` · nächstes ${Math.round(100 * GLB.i / GLB.V.visible.length)} %` : '';
  const sb = GL.cacheMode === 'play' ? 'spielt ✓' + bg : GL.cacheMode === 'rec' ? 'nimmt gerade auf' : 'aus – ' + (GLS.why || '?');
  const lines = [
    `Bild: ${MESS.gap.toFixed(0)} ms  (${(1000 / MESS.gap).toFixed(0)} Bilder/s)`,
    `Rechnen: ${MESS.ms.toFixed(1)} ms`,
    typeof GL === 'undefined' ? '' : GL.why ? `Grafikkarte: aus – ${GL.why}` : `Grafikkarte: an (${GL.stats.quads} Rechtecke)`,
    typeof GL === 'undefined' || GL.why ? '' : `Standbild: ${sb}`,
    `Boden ${MESS.boden.toFixed(1)} · Objekte ${MESS.obj.toFixed(1)} · Nacht ${MESS.nacht.toFixed(1)}`,
    `  davon Vorbereiten ${MESS.vor.toFixed(1)} · Felder ${MESS.feld.toFixed(1)} · Grafikkarte ${MESS.gl.toFixed(1)}`,
    typeof GL === 'undefined' || GL.why ? '' : `  Hochladen ${MESS.up.toFixed(1)} (${MESS.la} Zeilen) · Bewegtes ${MESS.movers}`,
    `  Rest (Schilder, Symbole …) ${Math.max(0, MESS.ms - MESS.boden - MESS.obj - MESS.nacht).toFixed(1)}`,
    ...(typeof GL === 'undefined' || GL.why || !GLS.dyn.length ? [] : [`Lebendige Felder: ${GLS.dyn.length}`,
      ...[...GLS.dynWhy].sort((p, q) => q[1] - p[1]).slice(0, 5).map(([n, k]) => `  ${k}× ${(ITEMS[n.split(' ')[0]] && ITEMS[n.split(' ')[0]].name) || n}${n.includes(' ') ? ' ' + n.slice(n.indexOf(' ') + 1) : ''}`)]),
    typeof GL === 'undefined' || !GL.ready ? '' : (() => { let own = 0; for (const e of GL.texs.values()) own += e.w * e.h * 4;
      return `Speicher Grafik: Sammelbilder ${(ATL.pages.length * ATL.size * ATL.size * 4 / 1048576).toFixed(0)} MB + einzeln ${(own / 1048576).toFixed(0)} MB (${GL.texs.size})`; })(),
    spriteFails ? `Speicher voll: ${spriteFails}× (Bildchen werden neu gemalt)` : '',
    `Lichter ${MESS.lights} · Bildchen fehlen ${MESS.miss}, neu ${MESS.made} · Zoom ${cam.z.toFixed(2)}`].filter(Boolean);
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.font = '600 14px system-ui, sans-serif';
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20, lh = 20, h = lines.length * lh + 12, x = Math.max(4, W - w - 12), y = Math.round(H * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, x + 10, y + 6 + lh * (i + 0.5)));
  ctx.restore();
}
// Erst loslegen, wenn ALLE Skripte da sind: cloud.js, live.js, friends.js und me.js kommen nach main.js. Im langsamen
// WLAN zeichnete das erste Bild sonst schon, bevor me.js geladen war („youNews is not defined“, Block 99a).
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(frame));
else requestAnimationFrame(frame);

// Größe ändern leert die Zeichenfläche – sofort neu zeichnen, sonst blitzt bis zum nächsten Bild der blaue Hintergrund durch
window.addEventListener('resize', () => { resize(); try { render(performance.now()); } catch (e) { /* nächstes Bild holt es nach */ } });
setInterval(() => save(true), 5000);                                     // regelmäßig sichern (ändert nichts am Bild)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { state.last = Date.now(); save(); }
  else lastTick = Date.now();          // bewusst nichts nachzahlen: gebaut und verdient wird nur beim Spielen
});
window.addEventListener('pagehide', save);

window.kachelhausen = { get state() { return state; }, recalc, save, checkStars, get T() { return T; }, walkers, cars, produce, updateHud };

// Testwelt (?welt=name): fertigen Stand laden, nichts speichern
if (TESTWELT) fetch(`testsave-${TESTWELT}.json?t=${Date.now()}`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(d => { adoptState(parseSave(d)); closeModal(); toast(`Testwelt „${state.town.name}“ – hier wird nichts gespeichert`); if (d.showcase) { SHOWCASE = d.showcase; jumpTo(...d.showcase.look); cam.z = 2.2; } })
  .catch(() => toast('Diese Testwelt gibt es hier nicht'));

