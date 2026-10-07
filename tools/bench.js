// (ohne 'use strict': per eval geladen, die Funktionen sollen global sein)
// ---------------------------------------------------------------------------
// Messen und Vergleichen (Block 124) – im Browser laden: fetch('tools/bench.js').then(r => r.text()).then(t => (0, eval)(t))
//   benchFreeze()                     Bewegung anhalten (Bewohner, Züge, Tiere), damit Bilder vergleichbar sind
//   benchMs(z, x, y, { night, frames, warm })   mittlere Zeit je Bild (ms) nach dem Aufwärmen (Bildchen fertig)
//   await benchShot(name, z, x, y, { night })   Bild mit fester Zeit malen und als Vorlage merken (IndexedDB)
//   await benchCompare(name, z, x, y, { night }) dasselbe Bild jetzt: wie viele Bildpunkte weichen ab, wo (Kästen)
// ---------------------------------------------------------------------------
const BENCH_NOW = 123456;
// die normale Bildschleife (frame) malt nichts mehr – sonst entstehen nebenher Bildchen mit der echten Uhrzeit
let R = window.__benchR || render;
function benchFreeze() {
  window.__benchR = R; window.render = () => {};
  window.stepMovers = () => {}; window.syncMovers = () => {};
  walkers.length = 0; strollers.length = 0; paraders.length = 0; cars.length = 0; critters.length = 0;
  window.drawFireworks = () => {}; window.startFireworks = () => {}; window.drawSparkles = () => {};   // Zufall (Erfolge lösen Feuerwerk aus)
  window.drawBubble = () => {};                                     // Sprechblasen kommen zufällig
  if (typeof fallenStars !== 'undefined') fallenStars.length = 0;
  if (typeof meFigs !== 'undefined') meFigs.length = 0;
  if (typeof trains !== 'undefined') trains.length = 0;
  if (typeof visitorFigs !== 'undefined') visitorFigs.length = 0;
  closeModal(); state.tipsOff = true;
}
function benchView(z, x, y, night) { cam.z = z; cam.x = x; cam.y = y; window.nightAt = () => night || 0; }
// opts.mode: 'heute' (wie im Spiel), 'bildchen' (alle Bildchen fertig: ohne Zeitgrenze aufwärmen), 'live' (nie Bildchen)
function benchMs(z, x, y, { night = 0, frames = 20, warm = 10, mode = 'heute' } = {}) {
  benchView(z, x, y, night);
  spriteForce = mode === 'live' ? false : null;
  spriteNoBudget = mode === 'bildchen';
  const w = benchWarm(() => performance.now(), mode === 'heute' ? 300 : 3);
  spriteNoBudget = false;
  for (let i = 0; i < warm; i++) R(performance.now());
  let miss = 0, made = 0;
  const t0 = performance.now();
  for (let i = 0; i < frames; i++) { R(performance.now()); miss += SPRITE_STATS.miss; made += SPRITE_STATS.made; }
  const ms = +((performance.now() - t0) / frames).toFixed(1);
  spriteForce = null;
  return { z, night, mode, ms, miss: Math.round(miss / frames), made: Math.round(made / frames), lights: glows.length, warm: w.frames };
}
// fester Zeitpunkt: Wellen, Uhren, Glitzern immer gleich; vorher aufwärmen, bis alle Bildchen da sind
// Aufwärmen, bis 20 Bilder lang kein Bildchen mehr fehlt oder neu entsteht (SPRITE_STATS) und kein Boden-Bild neu gemalt wird.
// Achtung: Mit dem alten Zeitbudget (Frist ab Bildanfang) fehlen in großen Welten dauerhaft Bildchen – dann nach 2000 Bildern Ende
function benchWarm(now, min = 300) {
  let same = 0, last = '', i = 0, miss = 0;
  for (; i < 2000 && (same < 20 || i < min); i++) {
    R(now());
    miss = SPRITE_STATS.miss;
    const k = groundCache.size + '|' + [...groundCache.values()].reduce((n, e) => n + e.scale, 0).toFixed(3);
    same = SPRITE_STATS.made === 0 && k === last ? same + 1 : 0; last = k;
  }
  return { frames: i, miss };
}
function benchFrame(z, x, y, night, mode = 'heute') {
  benchView(z, x, y, night);
  spriteForce = mode === 'live' ? false : null; spriteNoBudget = mode === 'bildchen';
  benchWarm(() => BENCH_NOW, mode === 'heute' ? 300 : 3);
  if (typeof prepShown !== 'undefined') prepShown = -1e9;          // „Insel wird gezeichnet“ nicht im Vergleichsbild
  R(BENCH_NOW);
  spriteForce = null; spriteNoBudget = false;
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}
function benchDb() {
  return new Promise((ok, no) => { const r = indexedDB.open('kh-bench', 1); r.onupgradeneeded = () => r.result.createObjectStore('shots'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
}
async function benchShot(name, z, x, y, { night = 0, mode = 'heute' } = {}) {
  const img = benchFrame(z, x, y, night, mode), db = await benchDb();
  await new Promise((ok, no) => { const tx = db.transaction('shots', 'readwrite'); tx.objectStore('shots').put({ w: img.width, h: img.height, data: img.data.buffer }, name); tx.oncomplete = ok; tx.onerror = () => no(tx.error); });
  return { name, w: img.width, h: img.height };
}
async function benchCompare(name, z, x, y, { night = 0, tol = 2, show = false, mode = 'heute' } = {}) {
  const db = await benchDb();
  const ref = await new Promise((ok, no) => { const r = db.transaction('shots').objectStore('shots').get(name); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  if (!ref) return { name, error: 'keine Vorlage' };
  const img = benchFrame(z, x, y, night, mode), a = new Uint8ClampedArray(ref.data), b = img.data;
  if (ref.w !== img.width || ref.h !== img.height) return { name, error: 'andere Größe' };
  let diff = 0;
  const boxes = new Map(), B = 64;
  for (let p = 0; p < a.length; p += 4) {
    if (Math.abs(a[p] - b[p]) > tol || Math.abs(a[p + 1] - b[p + 1]) > tol || Math.abs(a[p + 2] - b[p + 2]) > tol) {
      diff++;
      const i = p / 4, x0 = i % img.width, y0 = (i / img.width) | 0, k = ((x0 / B) | 0) + ',' + ((y0 / B) | 0);
      boxes.set(k, (boxes.get(k) || 0) + 1);
      if (show) { b[p] = 255; b[p + 1] = 0; b[p + 2] = 255; }
    }
  }
  if (show) ctx.putImageData(img, 0, 0);
  return { name, diff, share: +(diff / (a.length / 4) * 100).toFixed(4), boxes: [...boxes].sort((p, q) => q[1] - p[1]).slice(0, 12) };
}
// Vergleich alt gegen neu (Block 124): Vorlagen in einer frisch geladenen Kopie des alten Stands (/bench-base/, gleicher Server, also
// gleiche IndexedDB) aufnehmen, dann im frisch geladenen neuen Stand in DERSELBEN Reihenfolge vergleichen – manche Zwischenspeicher
// (Wald-Bildchen, Boden) hängen davon ab, welche Zoomstufen vorher dran waren
const BENCH_VIEWS = [['L045d', 0.45, 0, 300, 0, 'live'], ['L045n', 0.45, 0, 300, 0.45, 'live'], ['B045d', 0.45, 0, 300, 0, 'bildchen'], ['B045n', 0.45, 0, 300, 0.45, 'bildchen'],
  ['B07d', 0.7, 60, 330, 0, 'bildchen'], ['L15n', 1.5, 60, 330, 0.45, 'live'], ['B095n', 0.95, 60, 330, 0.45, 'bildchen'], ['L15d', 1.5, 60, 330, 0, 'live']];
async function benchSeries(what, from = 0, to = BENCH_VIEWS.length) {
  const out = [];
  for (const [n, z, x, y, night, mode] of BENCH_VIEWS.slice(from, to)) {
    if (what === 'shot') { await benchShot(n, z, x, y, { night, mode }); out.push(n); }
    else { const c = await benchCompare(n, z, x, y, { night, mode }); out.push([n, c.diff, c.error || c.boxes.slice(0, 3)]); }
  }
  return out;
}
async function benchReset() {
  for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
}
// Speicher der Zwischenspeicher (MB, Breite × Höhe × 4): Bildchen, Boden, Wald/Fels
function benchMem() {
  const mb = list => +(list.reduce((n, c) => n + (c ? c.width * c.height * 4 : 0), 0) / 1048576).toFixed(1);
  return { bildchen: mb([...objSprites.values()].flatMap(e => [e.c, e.mask && e.mask.c])), anzahl: objSprites.size, boden: mb([...groundCache.values()].map(e => e.c).concat(seaImage ? [seaImage.c] : [])), wald: mb([...spriteCache.values()].map(e => e.c)) };
}
