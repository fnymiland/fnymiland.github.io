'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Szene
// ---------------------------------------------------------------------------
// Spieluhr (Block 101): ein Spieltag dauert 24 echte Minuten (1 Minute = 1 Spielstunde) und wird aus der echten Zeit
// berechnet – sie läuft weiter, wenn die App zu ist, und alle Geräte und Besucher sehen dieselbe Tageszeit.
// Tag 6–19 Uhr, Abenddämmerung 19–21, Nacht 21–5 (die Laternen leuchten), Morgengrauen 5–6.
const GAME_HOUR_MS = 60e3, DAY_MS = 24 * GAME_HOUR_MS, NIGHT_MAX = 0.45;
// ?stunde=N erzwingt eine Uhrzeit (Probeansicht)
const forcedHour = (() => {
  const s = new URLSearchParams(location.search).get('stunde');
  return s == null ? null : +s;
})();
// Spielstunde 0 … 24 (mit Nachkommastellen)
function gameHour(ms = Date.now()) {
  if (forcedHour != null) return ((forcedHour % 24) + 24) % 24;
  return (((ms % DAY_MS) + DAY_MS) % DAY_MS) / GAME_HOUR_MS;
}
function nightLevel(h) {
  if (h instanceof Date) h = h.getHours() + h.getMinutes() / 60;
  if (h >= 6 && h < 19) return 0;
  if (h >= 19 && h < 21) return (h - 19) / 2 * NIGHT_MAX;
  if (h >= 5 && h < 6) return (6 - h) * NIGHT_MAX;
  return NIGHT_MAX;
}
function nightAt(ms = Date.now()) { return nightLevel(gameHour(ms)); }   // Funktion: Tests ersetzen sie
// Spielzeit als Datum (für Zeiger an Uhren)
function clockNow(ms = Date.now()) {
  const h = gameHour(ms), d = new Date(2000, 0, 1);
  d.setHours(Math.floor(h), Math.floor((h % 1) * 60));
  return d;
}
// Tageszeit zum Anzeigen: Symbol, „22:10“ (auf 10 Minuten), Name und wann es umschlägt
const TOD = [[5, '🌄', 'Morgengrauen'], [6, '☀️', 'Tag'], [19, '🌅', 'Abend'], [21, '🌙', 'Nacht']];
function timeOfDay(ms = Date.now()) {
  const h = gameHour(ms), cur = [...TOD].reverse().find(([from]) => h >= from) || TOD[3];
  const m = Math.floor(h * 6) * 10, text = `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const dark = h >= 21 || h < 5, dawn = h >= 5 && h < 6, to = dark ? 5 : dawn ? 6 : 21;   // nächster Umschwung: hell, Tag bzw. Nacht
  const left = Math.max(1, Math.ceil(((to - h + 24) % 24) * GAME_HOUR_MS / 60e3));         // echte Minuten
  return { icon: cur[1], name: cur[2], text, dark, dawn, left };
}

// fit: im Bild halten (Vorschau-Schild) – notfalls kleiner, dann seitlich hineinrücken
function pill(text, x, y, bg, fg, size, fit) {
  g.font = `900 ${size}px Nunito, system-ui, sans-serif`;
  let w = g.measureText(text).width + size * 1.2;
  while (fit && w > W - 16 && size > 9) { size--; g.font = `900 ${size}px Nunito, system-ui, sans-serif`; w = g.measureText(text).width + size * 1.2; }
  if (fit) x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
  const h = size * 1.7;
  g.fillStyle = 'rgba(107,79,58,0.25)';
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2 + 3, w, h, h / 2); g.fill();
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.fill();
  g.fillStyle = fg; g.textBaseline = 'middle';
  centerText(text, x, y + 1);
  return { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
}


const confetti = [];
let lastRender = 0;

// ---------------------------------------------------------------------------
// Zwischenspeicher, damit auch große Inseln auf dem iPad flüssig laufen:
// Der Boden jedes Grundstücks (6×6 Felder) wird einmal in ein eigenes Bild gezeichnet und danach nur noch kopiert.
// Neu gezeichnet wird, wenn sich Gelände, Besitz oder Bebauung ändern (groundVersion, erhöht von recalc)
// oder der Zoom deutlich anders ist. Ganz nah dran wird direkt gezeichnet (da sind es nur wenige Felder).
// Waldbäume und Felsen sind fertige kleine Bilder (einige Varianten je Zoomstufe).
// ---------------------------------------------------------------------------
let groundVersion = 0;
const groundCache = new Map();       // ck → { c, b, scale, v, waves, used }
const GROUND_MAX_SCALE = 2.6;         // darüber (nah dran) direkt zeichnen
let frameNo = 0, lastZoom = 0, lastZoomChange = 0;
function chunkBounds(cx, cy) {
  const x0 = cx * CHUNK, y0 = cy * CHUNK, x1 = x0 + CHUNK - 1, y1 = y0 + CHUNK - 1;
  const left = (x0 - y1) * TW / 2 - TW / 2 - 2, right = (x1 - y0) * TW / 2 + TW / 2 + 2;
  const top = (x0 + y0) * TH / 2 - TH / 2 - 2, bottom = (x1 + y1) * TH / 2 + TH / 2 + DEPTH + 4;
  return { left, top, w: right - left, h: bottom - top };
}
// Brücken (Schiene wie Weg) nie aus dem Zwischenspeicher: Geländer und Anhebung ragen über den Rand der Bodenkachel hinaus und
// würden dort abgeschnitten (Block 66e) – es sind nur wenige Felder, die live gezeichnet werden
const cachedPath = t => !t.bridge && (t.b === 'schiene' || isPbTrack(t.b) || (wegUnder(t) != null && !pathLook(styleDef('weg', wegUnder(t)).id).glow));   // Parkbahn-Gleis: flach im Bodenbild (Block 136)   // auch der Weg unter Marktständen
// Felder, deren Weg/Schiene NICHT im Boden-Bild steckt (Brücken, leuchtende Beläge) – weit weg wird nur dort live gezeichnet (Block 144).
// Neu bei anderem groundVersion bzw. anderer Belegung (wie EDGE_FIELDS)
let LIVE_FLAT = null;
function liveFlatSet() {
  const L = LIVE_FLAT;
  if (L && L.v === groundVersion && L.tiles === state.tiles && L.n === state.tiles.size) return L.set;
  const set = new Set();
  for (const k of new Set([...state.tiles.keys(), ...COVER.keys()])) {
    const [x, y] = keyXY(k), t = flatAt(x, y);
    if (t && (t.b === 'schiene' || isPbTrack(t.b) || wegUnder(t) != null) && !cachedPath(t)) set.add(k);
  }
  LIVE_FLAT = { v: groundVersion, tiles: state.tiles, n: state.tiles.size, set };
  return set;
}

// Schlagschatten: Die Sonne steht links, jedes Gebäude wirft einen weichen Schatten nach rechts
// (Grundfläche des Hauptbaus, um die Höhe versetzt). Gezeichnet in Weltkoordinaten (Zoom 1).
const SUN = { dx: 0.55, dy: 0.12 };
const SHADOW_COL = 'rgba(30,42,62,0.3)';
const HOUSE_SHADOW = [0, 24, 30, 32, 35, 34, 36];             // je Hausform (6: Glasvilla, Block 84d)
const SHADOW = {           // Höhe (je Stufe) und Abstand der Hauswand vom Feldrand
  muehle: [[28, 34, 40], 0.3], saege: [22, 0.18], steinmetz: [17, 0.26], schmiede: [19, 0.26], baecker: [[22, 32, 32], 0.2],
  fabrik: [[22, 22, 26], 0.16], schule: [[26, 28, 34], 0.2], bibliothek: [[28, 29, 31], 0.3], uni: [[36, 38, 40], 0.45], kunst: [[28, 30, 32], 0.3],
  rathaus: [40, 0.4], fischer: [16, 0.3], hafen: [[20, 22, 26], 0.5],
};
// Höhe des Namensschilds über der Mitte (passend zur Zeichnung)
const LM_LABEL_H = { baum: 128, obsthain: 82, klippe: 172, ruine: 80, erzberg: 104, quelle: 70, kristall: 118 };
const LM_SHADOW = { baum: [56, 0.85], klippe: [50, 0.75], ruine: [26, 0.7], kristall: [38, 0.8], obsthain: [34, 0.85], erzberg: [44, 0.75] };
function shadowOf(t, ax, ay) {
  let hgt, inset;
  if (t.b === 'haus') { const look = houseLook(t); hgt = HOUSE_SHADOW[look]; inset = look === 5 ? 0.16 : 0.24; }
  else if (t.b === 'lm') { const s = LM_SHADOW[t.lm]; if (!s) return null; [hgt, inset] = s; }
  else { const s = ART_SHADOW[t.b] || SHADOW[t.b]; if (!s) return null; hgt = Array.isArray(s[0]) ? s[0][Math.min(t.lvl, 3) - 1] : s[0]; inset = s[1]; }
  const [w, h] = sizeOf(t.b, t.rot, t), dx = SUN.dx * hgt, dy = SUN.dy * hgt;
  const base = [[ax - 0.5 + inset, ay - 0.5 + inset], [ax + w - 0.5 - inset, ay - 0.5 + inset], [ax + w - 0.5 - inset, ay + h - 0.5 - inset], [ax - 0.5 + inset, ay + h - 0.5 - inset]]
    .map(([x, y]) => { const p = iso(x, y); return [p.x, p.y]; });
  return hull(base.concat(base.map(([x, y]) => [x + dx, y + dy])));
}
function hull(pts) {                      // konvexe Hülle (Monotone Chain)
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// Flache Teile der Gebäude (Plätze, Rasen, Beete) – vor Wegen und Schatten
function drawGroundParts(want, at, z) {
  PASS = 'ground';
  for (const [k, t] of state.tiles) {
    if (!hasGroundPart(t)) continue;
    const [ax, ay] = keyXY(k), [w, h] = sizeOf(t.b, t.rot, t);
    if (!want([ax, ay], w, h)) continue;
    const c = at(ax + (w - 1) / 2, ay + (h - 1) / 2);
    FOG = t.b !== 'lm' && !ownedTile(ax, ay);
    drawObject(t.b, c.x, c.y, z, 0, ax, ay, t.lvl, t);
  }
  FOG = false;
  PASS = null;
}
// alle Schatten als eine Fläche (Überlappungen werden nicht dunkler); want(anker) filtert
function drawShadows(want) {
  g.beginPath();
  for (const [k, t] of state.tiles) {
    const a = keyXY(k);
    if (!want(a)) continue;
    const sh = shadowOf(t, a[0], a[1]);
    if (sh) sh.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    if (sh) g.closePath();
  }
  g.fillStyle = SHADOW_COL;
  g.fill('nonzero');
}
let groundCached = false;           // in diesem Bild kommt der Boden (mit Wegen) aus dem Zwischenspeicher
// Reines Meer sieht auf jedem Grundstück gleich aus (Wellen kommen extra): ein gemeinsames Bild
const seaInfo = new Map();           // ck → { v, sea, waves }
let seaImage = null;
function chunkSea(cx, cy) {
  const ck = cx + ',' + cy;
  let e = seaInfo.get(ck);
  if (!e || e.v !== groundVersion) {
    let sea = !state.owned.has(ck);
    const waves = [];
    for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) {
      const x = cx * CHUNK + i, y = cy * CHUNK + j;
      if (terrainAt(x, y) !== 'water' || state.claimed.has(x + ',' + y)) sea = false;
      else if (hasWave(x, y)) waves.push([x, y]);
    }
    e = { v: groundVersion, sea, waves };
    seaInfo.set(ck, e);
  }
  return e;
}
function renderGroundChunk(cx, cy, scale) {
  const b = chunkBounds(cx, cy), c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(b.w * scale)); c.height = Math.max(1, Math.ceil(b.h * scale));
  const prev = g, cg = c.getContext('2d');
  if (!cg) return null;                              // kein Speicher mehr (iPad): Aufrufer behält das alte Bild (Block 124)
  g = cg;
  try {                                              // ein Fehler darf g nicht auf dieser Leinwand lassen (Block 84d)
    g.setTransform(scale, 0, 0, scale, -b.left * scale, -b.top * scale);
    const waves = [];
    for (let s = 0; s <= 2 * (CHUNK - 1); s++) for (let i = 0; i < CHUNK; i++) {
      const j = s - i;
      if (j < 0 || j >= CHUNK) continue;
      const x = cx * CHUNK + i, y = cy * CHUNK + j;
      FOG = !ownedTile(x, y) && terrainAt(x, y) !== 'water';
      drawGround(x, y, iso(x, y), 1, 0, true);
      if (terrainAt(x, y) === 'water' && hasWave(x, y)) waves.push([x, y]);
    }
    FOG = false;
    // Flache Gebäudeteile, Wege und Schlagschatten – auch von Nachbar-Grundstücken, aber nur auf dieses gezeichnet,
    // damit sich nichts doppelt
    const x0 = cx * CHUNK - 0.5, y0 = cy * CHUNK - 0.5, x1 = x0 + CHUNK, y1 = y0 + CHUNK;
    const near = ([ax, ay], w = 1, h = 1) => Math.floor((ax + w - 1) / CHUNK) >= cx - 1 && Math.floor(ax / CHUNK) <= cx + 1 && Math.floor((ay + h - 1) / CHUNK) >= cy - 1 && Math.floor(ay / CHUNK) <= cy + 1;   // ganze Fläche
    const clipTo = d => { g.beginPath(); [iso(x0 - d, y0 - d), iso(x1 + d, y0 - d), iso(x1 + d, y1 + d), iso(x0 - d, y1 + d)].forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.clip(); };
    // Wege und Bodenteile über die Kante (Block 116): Grasfelder sind ½ Punkt größer gezeichnet (drawGround, gegen Fugen) und
    // ragten ins Nachbarstück – das Gras schien als grüne Linie über Plätze. Überlapp = dieser halbe Punkt + 1,5 Bildpunkte.
    // Schatten (halb durchsichtig) exakt, sonst doppelt dunkel.
    g.save(); clipTo(0.03 + 0.052 / scale);
    try {
      drawGroundParts(near, iso, 1);
      for (let s = -2; s <= 2 * CHUNK; s++) for (let i = -1; i <= CHUNK; i++) {   // samt Ring der Nachbarfelder: deckt das eigene
        const j = s - i;                                                      // Gras zu, das über die Kante ragt (Block 116b)
        if (j < -1 || j > CHUNK) continue;
        const x = cx * CHUNK + i, y = cy * CHUNK + j, t = flatAt(x, y);
        if (t && cachedPath(t)) { const p = iso(x, y); drawFlat(p.x, p.y, 1, x, y, t); }
      }
    } finally { g.restore(); }
    g.save(); clipTo(0);
    try { drawShadows(near); } finally { g.restore(); }
    return { c, b, scale, v: groundVersion, waves, used: frameNo };
  } finally { g = prev; FOG = false; PASS = null; }
}
// ---------------------------------------------------------------------------
// Weit weg (Block 31/124): Gebäude, kleine Dekos und Linien als fertige Bildchen, statt sie jedes Bild neu zu zeichnen. Gleich
// aussehende teilen sich eins (Häuser, kleine Läden, Dekos); große Gebäude und Linien haben ihr eigenes (Schlüssel mit Platz).
// Bis SPRITE_FROM (Zoom 1) alles, bis SPRITE_UNTIL (~2) alles Ruhende (Bewegtes live, animLive). Neu gemalt wird im Zeitbudget je
// Bild (PAINT_MS); was fehlt, wird so lange live gezeichnet, was nur veraltet ist (andere Zoomstufe, andere Fassung), weiter gezeigt.
// ---------------------------------------------------------------------------
const SPRITE_FROM = 1.0, PAINT_MS = 10, SPRITE_MAX = 40;
// Bis Zoom ~2 Bildchen auch für das Ruhende (Block 124): zwischen SPRITE_FROM und SPRITE_UNTIL bleibt nur, was sich bewegt, live
// (animLive – Rauch, Fontänen, Fahnen …; der Bestands-Test in tests/tempo-schritt3.test.js prüft alle Stufen, Aussehen, Nacht).
// Auf Geräten mit doppelter Pixeldichte nur bis z × DPR ≤ 2.6 (wie der Boden), sonst würden die Bildchen auf dem iPad zu groß
const SPRITE_UNTIL = 1 / (0.8 * 0.8 * 0.8) - 1e-6;                  // = Zoomstufe 1.953 (zoomStep)
const ANIM_ITEMS = new Set(['hausboot', 'fischer', 'saege', 'schmiede', 'baecker', 'fabrik', 'hafen', 'schule', 'palme', 'riesenblume', 'brunnen', 'glaskugel',
  'kristallbrunnen', 'pokal_bronze', 'pokal_silber', 'pokal_gold', 'schloss', 'freundschaftsbaum', 'zauberbrunnen', 'schmetterlingsgarten', 'vogelbaum',
  'seerosenteich', 'bootssteg', 'seilbahn', 'solarfeld', 'geothermie', 'wellen', 'statue', 'rathaus', 'truhe', 'friseur', 'cafe', 'pizzeria', 'konditorei',
  'kino', 'aquarium', 'zoo', 'fz_schloss', 'fz_torturm', 'fz_ballon', 'brunnen_s', 'brunnen_l', 'brunnen_xl', 'kristallbrunnen_s', 'kristallbrunnen_l',
  'kristallbrunnen_xl', 'palme_m', 'palme_l', 'statue_l']);
// bewegt sich erst in bestimmten Stufen / mit bestimmtem Aussehen / nachts (Schornsteinrauch der Häuser mit Aussehen 3 und 5, Schaukel,
// Ähren, Förderrad, Fahne, Sterne, restaurierte Sehenswürdigkeiten)
const animLive = t => ANIM_ITEMS.has(t.b) || (t.b === 'haus' && (houseLook(t) === 3 || houseLook(t) === 5))
  || ((t.b === 'baumhaus' || t.b === 'feld') && (t.lvl || 1) >= 2) || ((t.b === 'mine' || t.b === 'uni') && (t.lvl || 1) >= 3)
  || (t.b === 'sternwarte' && night > 0.15) || (t.b === 'lm' && lmStage(t.lm) > 0);
let SPRITES_NEAR = false;                                            // Zoom zwischen SPRITE_FROM und SPRITE_UNTIL: Bewegtes live
// Weit weg (Zoom < 1) stehen Drehendes still (Block 144, Wunsch des Nutzers): ein fertiges Bildchen statt jedes Bild live –
// Flügel/Gondeln in einer festen Stellung je Standort (stillNow). Nah dran (SPRITES_NEAR) dreht sich alles wie gehabt
const STILL_FAR = new Set(['riesenrad', 'windrad', 'offshore', 'muehle', 'wasserkraft', 'karussell', 'fz_karussell', 'fz_teetassen', 'fz_kette',
  'fz_freifall', 'fz_geister', 'fz_wildwasser']);
// Einstellung je Gerät (☰ → Grafik, localStorage kachelhausen_still): Standard still; „dreht sich“ = wie vor Block 144 live
const STILL_KEY = 'kachelhausen_still';
let stillFar = (() => { try { return localStorage.getItem(STILL_KEY) !== '0'; } catch (e) { return true; } })();
function setStillFar(on) {
  stillFar = !!on;
  try { localStorage.setItem(STILL_KEY, on ? '1' : '0'); } catch (e) { /* privates Fenster: gilt bis zum Neuladen */ }
  resetDrawCaches();                                                     // Bildchen und Standbild neu
}
const stillHere = b => stillFar && STILL_FAR.has(b) && !SPRITES_NEAR;
const stillNow = (b, x, y, now) => stillHere(b) ? 1e6 + hash(x, y, 9) * 6e4 : now;
const spriteOk = b => SPRITES_NEAR ? !SPRITE_LIVE.has(b) && !ANIM_ITEMS.has(b) : !SPRITE_LIVE.has(b) || stillHere(b);          // kleine Deko (nur die Art)
const spriteTileOk = t => SPRITES_NEAR ? !SPRITE_LIVE.has(t.b) && !animLive(t) : !SPRITE_LIVE.has(t.b) || stillHere(t.b);   // Gebäude (Stufe, Aussehen, Nacht)
const objSprites = new Map();        // Schlüssel → { c, ox, oy, z, ver, glows, mask, night, next, used }
let SPRITES_ON = false, spriteZooming = false, spriteZoomedLast = false;
// Zeitbudget fürs Neumalen (Block 124): gezählt wird nur die Malzeit – Boden und Bildchen zusammen höchstens PAINT_MS je Bild,
// mindestens ein Bildchen, höchstens SPRITE_MAX (die Uhr in Safari ist grob). Vorher galt eine Frist ab Bildanfang: In großen
// Welten war sie verbraucht, bevor das erste Gebäude drankam – dann entstand nie ein Bildchen, und alles wurde live gezeichnet.
let spriteSpent = 0, spriteMade = 0, groundSpent = 0;
// Aufholen (Block 124): Fehlten im letzten Bild viele Bildchen, wird ohnehin fast alles live gezeichnet – ein Bildchen zu malen kostet
// kaum mehr als dasselbe live. Dann darf mehr gemalt werden (PAINT_CATCH). Fehlende Nachtbilder zählen nur bis CATCH (der Ersatz ist fertig)
const CATCH_MISS = 30, PAINT_CATCH = 40, SPRITE_CATCH_MAX = 160;
// Vorbereiten (Block 124): Fehlt fast alles (Start, Sprung, weit rausgezoomt), ruckelt es ohnehin – dann richtig Gas geben und
// oben „Insel wird gezeichnet …“ zeigen, bis es wieder geht (prepShown)
const PREP_MISS = 250, PAINT_PREP = 150, SPRITE_PREP_MAX = 1000;
// Ladekreisel (Block 142, #loading in index.html): beim Start, bis die Insel einmal fertig gezeichnet ist (ganzer Bildschirm);
// beim Besuch, bis die fremde Insel da ist (loadingVisit, live.js); beim Vorbereiten „Insel wird gezeichnet …“. HTML statt ins Bild
// gemalt, damit er sich auch dreht, während ein langes Bild rechnet. Ins DOM nur, wenn sich etwas ändert
let loadingStart = true, loadingVisit = 0, loadingShown = '';            // loadingVisit: seit wann (nach 25 s nicht mehr, falls nie etwas kommt)
function loadingUpdate() {
  if (loadingStart && frameNo > 2 && !spritePrep && SPRITE_STATS.miss < PREP_MISS) loadingStart = false;   // Insel steht
  const want = loadingVisit && Date.now() - loadingVisit < 25000 ? 'visit' : loadingStart ? 'start' : performance.now() - prepShown < 500 ? 'draw' : '';
  if (want === loadingShown) return;
  loadingShown = want;
  const el = document.getElementById('loading');
  if (!el) return;
  el.hidden = !want;
  el.classList.toggle('big', want === 'start' || want === 'visit');
  const t = el.querySelector('.ld-text');
  if (t && want) t.textContent = want === 'start' ? 'Fnymiland lädt …' : want === 'visit' ? 'Die Insel wird geladen …' : 'Insel wird gezeichnet …';
}
const STALE_MS = 20;                               // Erneuern (andere Zoomstufe, andere Fassung): etwas mehr als sonst, aber ohne Pause
// Kein Speicher mehr (getContext null, iPad): eine Weile gar nichts Neues malen, Entbehrliches freigeben – nie deswegen aufholen/vorbereiten
const FAIL_PAUSE = 90;
let spriteCatch = false, spritePrep = false, spriteStale = false, prepShown = 0, spriteMissLast = 0, spritePause = 0;
const paintBudget = () => spritePrep ? PAINT_PREP : spriteCatch ? PAINT_CATCH : spriteStale ? STALE_MS : PAINT_MS;
const spriteOver = () => frameNo < spritePause || (spriteMade > 0 && (spriteMade >= (spritePrep ? SPRITE_PREP_MAX : spriteCatch ? SPRITE_CATCH_MAX : SPRITE_MAX) || spriteSpent + groundSpent >= paintBudget()));
// Feste Zoomstufen (Block 124): Bildchen und Boden entstehen nur in Stufen je 20 % (… 0.64, 0.8, 1, 1.25 …), immer in der
// nächstgrößeren und beim Einsetzen leicht verkleinert – Zoomen innerhalb einer Stufe malt nichts neu (vorher jede Zwischenstufe alles).
// spriteStep begrenzt auf z × DPR ≤ 2.6 (iPad: über 1.25 wird minimal vergrößert statt riesig gemalt)
const ZOOM_STEP = 0.8;
const zoomStep = z => Math.pow(ZOOM_STEP, Math.floor(Math.log(z) / Math.log(ZOOM_STEP) + 1e-9));
const stepBelow = x => { const s = zoomStep(x); return s > x * (1 + 1e-9) ? s * ZOOM_STEP : s; };
const spriteStep = z => Math.min(zoomStep(z), stepBelow(2.6 / DPR));
// Messen (Block 124): je Bild, wie oft ein Bildchen fehlte (miss → live gezeichnet), neu gemalt wurde (made), alt weiter gezeigt
// wurde (stale: andere Zoomstufe, old: andere Fassung), ein Nachtbild fehlte (nmiss) oder kein Speicher da war (fail).
// Zwei Schalter nur fürs Messwerkzeug (tools/bench.js): spriteForce true/false erzwingt Bildchen bzw. live, spriteNoBudget malt ohne Zeitgrenze
const SPRITE_STATS = { miss: 0, made: 0, stale: 0, old: 0, nmiss: 0, fail: 0 };
let spriteForce = null, spriteNoBudget = false;
// immer live: was sich auch von weitem sichtbar dreht (Leuchtturm: Strahl, Block 83; Fahrgeschäfte, Block 124) und Schienen
// (zeichnen hier nichts außer dem Bahnübergang, und der legt seine Vorderseite über die Züge, afterMovers)
const SPRITE_LIVE = new Set(['riesenrad', 'windrad', 'offshore', 'muehle', 'wasserkraft', 'leuchtturm', 'karussell',
  'fz_karussell', 'fz_teetassen', 'fz_kette', 'fz_freifall', 'fz_geister', 'fz_wildwasser', 'schiene']);
function spriteTop(b, w, h) {
  if (WONDERS[b]) return WONDERS[b].h + 70;              // Baugerüste ragen etwas höher (Block 84d)
  if (b === 'leuchtturm') return 280;                    // Leuchtturm-Kap (Block 83)
  if (b === 'fz_schloss') return 260;
  return Math.max(w * h >= 9 ? 150 : w * h >= 4 ? 120 : 112, (w + h) * TH / 4 + 70);   // lange Gebäude (Hbf): die Fläche selbst reicht weit hoch
}
const SPRITE_PAD = { hafen: [26, 14] };                  // Pier ragt zur Seite bzw. nach vorn (Breite, unten)
// Bildchen holen (oder malen, wenn das Budget reicht); null = live zeichnen. ver = Fassung (groundVersion bei Bildchen mit Platz,
// Uhrzeit-Takt bei Uhren): Eine veraltete Fassung wird weiter gezeigt und im Budget einzeln ersetzt – vorher steckte groundVersion im
// Schlüssel, nach jedem Bauen fehlten Hunderte Bildchen auf einmal (Ruckler + „Insel wird gezeichnet“) und die alten blieben liegen
function getSprite(key, z, make, ver = 0) {
  const e = objSprites.get(key);
  // Beim Zoomen jedes vorhandene Bildchen weiterbenutzen, auch aus einer fernen Stufe (kurz unscharf) – sonst fehlte nach jeder
  // Stufengrenze alles und es gab eine Pause. Danach entsteht das scharfe im Hintergrund (e.next); getauscht wird erst, wenn alle
  // sichtbaren fertig sind, alle auf einmal (spriteSwapAll) – einzeln lief eine sichtbare „Welle“ durchs Bild
  const ratio = e ? z / e.z : 0, near = !!e && ratio > 0.2 && ratio < 5, zoomOk = !!e && Math.abs(ratio - 1) < 0.02;
  const verOk = !e || e.ver === ver;                                    // Dämmerung nutzt auch Nachtbilder (Block 143): Lichtmaske nur noch Notbehelf
  if (e && verOk && (zoomOk || (spriteZooming && near))) { e.used = frameNo; return e; }
  if (near && !spriteNoBudget) {
    if (!zoomOk) {
      if (!spriteZooming) {
        let n = e.next;
        if (n && (Math.abs(z / n.z - 1) >= 0.02 || n.ver !== ver)) { freeSprite(n); n = e.next = null; }   // inzwischen andere Stufe/Fassung
        if (!n && !spriteMissLast && !spriteOver()) {                    // Fehlendes (live gezeichnet) geht vor dem Scharfmachen
          n = makeSprite(make, ver);
          if (n) { e.next = n; if (!spriteSwap.size) spriteSwapSince = frameNo; spriteSwap.set(key, e); }
        }
        if (n && nightPicOn() && n.paint && !n.night) nightOf(n);          // auch das Nachtbild vorher, sonst wechselt nachts das Licht
        if (!spriteReady(n)) SPRITE_STATS.stale++;
      }
      e.used = frameNo;
      return e;
    }
    if (spriteZooming || spriteOver()) { SPRITE_STATS.old++; e.used = frameNo; return e; }   // nur alte Fassung: weiter zeigen, bald neu
  }
  if (!spriteNoBudget && spriteOver()) { SPRITE_STATS.miss++; return null; }
  const n = makeSprite(make, ver);
  if (!n) return near ? (e.used = frameNo, e) : null;                  // kein Speicher: altes Bildchen oder live
  if (e) { spriteSwap.delete(key); spriteTrash.push(e); }               // ersetzt: erst am nächsten Bildanfang freigeben (kann diesmal noch im Bild stehen)
  objSprites.set(key, n);
  n.used = frameNo;
  return n;
}
function makeSprite(make, ver) {
  const t0 = performance.now();
  const n = make();
  spriteSpent += performance.now() - t0; spriteMade++; SPRITE_STATS.made++;
  if (n) n.ver = ver; else spriteFail();
  return n;
}
// Kein Speicher (getContext null): Pause fürs Neumalen und Entbehrliches freigeben (Nachtbilder, wartende scharfe, lange nicht Benutztes)
let spriteFails = 0;                                                       // ?messen: wie oft der Speicher voll war (seit dem Start)
function spriteFail() {
  SPRITE_STATS.fail++; spriteFails++;
  if (frameNo < spritePause) return;
  spritePause = frameNo + FAIL_PAUSE;
  for (const [k, e] of objSprites) { if (frameNo - e.used > 30) dropSprite(k); else { freeNight(e); if (e.next) { freeSprite(e.next); e.next = null; } } }
  spriteSwap.clear();
  for (const [ck, e] of groundCache) if (frameNo - e.used > 30) { groundCache.delete(ck); freeCanvas(e.c); }
}
// Austausch auf einen Schlag (Block 124): scharfe Bildchen warten in e.next, bis keins der sichtbaren mehr fehlt (oder nach
// SWAP_WAIT Bildern, falls eins nie fertig wird), dann werden alle zugleich getauscht – nur solche der jetzigen Zoomstufe
const spriteSwap = new Map(), SWAP_WAIT = 120, spriteTrash = [];
let spriteSwapSince = 0;
const spriteReady = n => !!n && !n.crop && (!nightPicOn() || !n.paint || !!n.night);
function spriteSwapAll(staleLast, zs) {
  if (!spriteSwap.size || spriteZooming || spriteZoomedLast || (staleLast > 0 && frameNo - spriteSwapSince < SWAP_WAIT)) return;
  for (const [k, e] of spriteSwap) {
    const n = e.next; e.next = null;
    if (!n) continue;
    if (objSprites.get(k) === e && Math.abs(zs / n.z - 1) < 0.02) { objSprites.set(k, n); n.used = e.used; freeSprite(e); } else freeSprite(n);
  }
  spriteSwap.clear();
}
// Bildchen malen. Block 124: danach auf den Inhalt zugeschnitten – sie bestanden zu über 80 % aus leerem Rand (Speicher auf dem
// iPad). Jedes Bildchen auf einer frischen Leinwand, die nur einmal gelesen und dann freigegeben wird: Eine wiederverwendete
// Leinwand, aus der oft gelesen wird, stellt Chrome auf den Prozessor um (oder willReadFrequently) – dann sind Kanten anders
// geglättet und das Bild nicht mehr gleich. Kein Speicher (getContext null): null, dann wird live gezeichnet
function paintSprite(halfW, up, down, drawFn) {
  if (SPRITE_PAINT) return null;                                         // nie verschachtelt (das innere würde live ins äußere gezeichnet)
  const nw = Math.max(1, Math.ceil(2 * halfW * DPR)), nh = Math.max(1, Math.ceil((up + down) * DPR));
  const c = document.createElement('canvas');
  c.width = nw; c.height = nh;
  const cx = c.getContext('2d');
  if (!cx) { freeCanvas(c); return null; }
  const prev = g, sink = [], atlas = { c: null, ctx: null, x: 0, y: 0, row: 0, used: 0 }, am = afterMovers.length;
  g = cx;
  // volle Nacht: Licht kommt aus dem Nachtbild – keine Kopien, keine Maske (spart Lesen); zur Dämmerung wird es neu gemalt (noMask)
  const full = nightPicOn();
  GLOW_SINK = sink; GLOW_ATLAS = full ? null : atlas; SPRITE_PAINT = true;
  try { g.setTransform(DPR, 0, 0, DPR, halfW * DPR, up * DPR); drawFn(); }
  finally { GLOW_SINK = null; GLOW_ATLAS = null; SPRITE_PAINT = false; g = prev; afterMovers.length = am; }   // im Bildchen nichts über die Fahrzeuge legen
  const warm = sink.some(gl => gl.tint !== 'blue');
  const e = { c, ox: halfW, oy: up, glows: sink, mask: null, maskTodo: !full && warm ? atlas : null, noMask: full && warm,
    paint: sink.length ? { halfW, up, down, drawFn } : null, night: null, next: null, crop: true };   // paint: fürs Nachtbild (Schritt 4)
  spriteCrops.push(e);
  return e;
}
// Zuschneiden gesammelt am Anfang des nächsten Bilds (Block 124): Lesen aus einer Leinwand wartet, bis die Grafikkarte alles
// fertig hat, was vorher bestellt wurde – mitten im Bild rund 10 ms, am Bildanfang kaum etwas. Höchstens CROP_MS je Bild (nach
// einem Vorbereiten mit Hunderten Bildchen sonst ein langes Bild), der Rest im nächsten. Bis dahin wird das Bildchen ungeschnitten
// benutzt (gleiches Bild). Knapp: Alpha > 0, 1 Punkt Rand. Leer: c = null
const spriteCrops = [], CROP_MS = 8;
function cropSprites(limit = CROP_MS) {
  const t0 = performance.now();
  let i = 0;
  for (; i < spriteCrops.length; i++) {
    const e = spriteCrops[i];
    if (!e.maskTodo && cropAsync(e)) continue;                            // im Hintergrund (Block 144): das Bild wartet nicht
    if (i > 0 && performance.now() - t0 > limit) break;
    cropSprite(e);
  }
  spriteCrops.splice(0, i);
}
// Rand im Hintergrund suchen (Block 144): Das Lesen der Pixel (getImageData) wartet auf die Grafikkarte – im Hauptablauf ~2,5 ms je
// neuem Bildchen, nach dem Verschieben/Zoomen Dutzende. Stattdessen eine Kopie (createImageBitmap, ohne Warten) an einen Worker, der
// liest und den Rahmen zurückmeldet; zugeschnitten wird dann wie gehabt (drawImage, ohne Lesen). Ohne Worker/OffscreenCanvas
// (Test, alte Browser) oder mit Lichtmaske: wie bisher sofort
let cropWorker = null, cropSeq = 0;
const cropWait = new Map();
function cropAsync(e) {
  if (cropWorker === false) return false;
  if (!cropWorker) {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined' || typeof Blob === 'undefined') { cropWorker = false; return false; }
    try {
      const src = `onmessage = ev => { const { id, bmp } = ev.data; let box = null;
        try { const w = bmp.width, h = bmp.height, c = new OffscreenCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
          x.drawImage(bmp, 0, 0); const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
          for (let y = 0; y < h; y++) { const r = y * w * 4; for (let i = 0; i < w; i++) if (d[r + i * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; y1 = y; } }
          box = [x0, y0, x1, y1]; } catch (err) { box = null; }
        try { bmp.close(); } catch (err) {}
        postMessage({ id, box }); };`;
      cropWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      cropWorker.onmessage = ev => cropDone(ev.data.id, ev.data.box);
      cropWorker.onerror = () => { cropWorker = false; for (const [, e] of cropWait) { e.crop = false; spriteCrops.push(e); } cropWait.clear(); };
    } catch (err) { cropWorker = false; return false; }
  }
  const c = e.c;
  if (!c || !c.width || !c.height) { e.crop = false; return true; }
  const id = ++cropSeq;
  cropWait.set(id, e);
  createImageBitmap(c).then(bmp => { if (cropWorker) cropWorker.postMessage({ id, bmp }, [bmp]); else cropWait.delete(id); },
    () => { cropWait.delete(id); e.crop = false; });
  return true;
}
function cropDone(id, box) {
  const e = cropWait.get(id);
  cropWait.delete(id);
  if (!e) return;
  e.crop = false;
  if (!box || !e.c || !e.c.width) { glWarm(e.c); return; }               // inzwischen freigegeben: nichts zu tun
  cropApply(e, e.c, box[0], box[1], box[2], box[3]);
  glWarm(e.c);                                                            // fertig: schon jetzt zur Grafikkarte (nicht alle beim Tausch)
}
function cropSprite(e) {
  e.crop = false;
  const c = e.c;
  if (!c || !c.width || !c.height) return;                               // inzwischen freigegeben
  if (e.maskTodo) {                                                       // Lichtmaske (Dämmerung) auch erst hier: Lesen mitten im Bild wartet auf die Grafikkarte
    e.mask = lightMask(c, e.glows, e.maskTodo);
    freeCanvas(e.maskTodo.c); e.maskTodo = null;
  }
  const nw = c.width, nh = c.height;
  let img = null;
  try { img = c.getContext('2d').getImageData(0, 0, nw, nh); } catch (err) { img = null; }
  const d = img && img.data;
  if (!d) { glWarm(e.c); return; }                                       // ohne Pixel (Test): ungeschnitten
  let x0 = nw, y0 = nh, x1 = -1, y1 = -1;
  for (let y = 0; y < nh; y++) { const row = y * nw * 4; for (let x = 0; x < nw; x++) if (d[row + x * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; } }
  cropApply(e, c, x0, y0, x1, y1);
  glWarm(e.c);
}
// Zuschneiden mit gefundenem Inhaltsrahmen (x1 < 0: leer), 1 Punkt Rand
function cropApply(e, c, x0, y0, x1, y1) {
  const nw = c.width, nh = c.height;
  let out = null;
  if (x1 >= 0) {
    x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(nw - 1, x1 + 1); y1 = Math.min(nh - 1, y1 + 1);
    if (x0 === 0 && y0 === 0 && x1 === nw - 1 && y1 === nh - 1) return;   // füllt die ganze Fläche
    out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    const ox = out.getContext('2d');
    if (!ox) { freeCanvas(out); return; }                                 // kein Speicher: ungeschnitten weiter
    ox.drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  } else { x0 = 0; y0 = 0; }
  freeCanvas(c);                                                          // große Leinwand gleich freigeben
  const sx = x0 / DPR, sy = y0 / DPR;
  e.c = out; e.ox -= sx; e.oy -= sy;
  if (sx || sy) { for (const gl of e.glows) gl.q = gl.q.map(([x, y]) => [x - sx, y - sy]); if (e.mask) { e.mask.x -= sx; e.mask.y -= sy; } }
}
// Lichtmaske eines Bildchens (Block 112): innerhalb der Fensterscheiben nur die Pixel, die seit dem Einschalten ihres Lichts
// unverändert sind (glowSnap) – was danach davor gemalt wurde (Blumenkasten, Rahmen, das Nachbarhaus der Reihe), bleibt dunkel
// wie live. Zugeschnitten auf die Scheiben: { c, x, y } (x, y in Punkten des Bildchens). null: keine Maske (ganze Scheiben
// stanzen wie früher), false: nichts mehr sichtbar. Zwei Lesevorgänge je Bildchen (Bereich, Ablage).
function lightMask(c, sink, A) {
  const warm = sink.filter(gl => gl.tint !== 'blue');
  if (!warm.length) return null;
  try {
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const { q } of warm) for (const [x, y] of q) { bx0 = Math.min(bx0, x * DPR); by0 = Math.min(by0, y * DPR); bx1 = Math.max(bx1, x * DPR); by1 = Math.max(by1, y * DPR); }
    bx0 = Math.max(0, Math.floor(bx0)); by0 = Math.max(0, Math.floor(by0)); bx1 = Math.min(c.width, Math.ceil(bx1)); by1 = Math.min(c.height, Math.ceil(by1));
    const bw = bx1 - bx0, bh = by1 - by0;
    if (bw <= 0 || bh <= 0) return false;
    const m = document.createElement('canvas'); m.width = bw; m.height = bh;
    const mx = m.getContext('2d');
    mx.setTransform(DPR, 0, 0, DPR, -bx0, -by0); mx.fillStyle = '#000';
    for (const { q } of warm) { mx.beginPath(); q.forEach(([x, y], i) => i ? mx.lineTo(x, y) : mx.moveTo(x, y)); mx.closePath(); mx.fill(); }
    const pane = mx.getImageData(0, 0, bw, bh), d = pane.data, fin = c.getContext('2d').getImageData(bx0, by0, bw, bh).data;
    const shot = A && A.c && A.used ? A.ctx.getImageData(0, 0, A.c.width, A.used).data : null, AW = A && A.c ? A.c.width : 0;
    const keep = new Uint8Array(bw * bh);
    for (const { snap: sn } of warm) {
      if (!sn || !shot) continue;
      for (let yy = 0; yy < sn.h; yy++) for (let xx = 0; xx < sn.w; xx++) {
        const X = sn.x0 + xx - bx0, Y = sn.y0 + yy - by0;
        if (X < 0 || Y < 0 || X >= bw || Y >= bh) continue;
        const i = (Y * bw + X) * 4, j = ((sn.ay + yy) * AW + sn.ax + xx) * 4;
        if (Math.abs(fin[i] - shot[j]) < 3 && Math.abs(fin[i + 1] - shot[j + 1]) < 3 && Math.abs(fin[i + 2] - shot[j + 2]) < 3 && Math.abs(fin[i + 3] - shot[j + 3]) < 3) keep[Y * bw + X] = 1;
      }
    }
    for (const { q, snap: sn } of warm) if (!sn || !shot) {                // ohne Kopie: dieses Fenster ganz (wie früher)
      for (let p = 0; p < bw * bh; p++) if (d[p * 4 + 3] && !keep[p]) { const X = p % bw + bx0, Y = (p / bw | 0) + by0; if (inQuad(q, (X + 0.5) / DPR, (Y + 0.5) / DPR)) keep[p] = 1; }
    }
    let any = false;
    for (let p = 0; p < bw * bh; p++) { if (!keep[p]) d[p * 4 + 3] = 0; else if (d[p * 4 + 3]) any = true; }
    if (!any) return false;
    mx.putImageData(pane, 0, 0);
    return { c: m, x: bx0 / DPR, y: by0 / DPR };
  } catch (e) { return null; }
}
// liegt der Punkt im (konvexen) Viereck?
function inQuad(q, x, y) {
  let sgn = 0;
  for (let i = 0; i < q.length; i++) {
    const [ax, ay] = q[i], [bx, by] = q[(i + 1) % q.length], cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (cr) { if (sgn && Math.sign(cr) !== sgn) return false; sgn = Math.sign(cr); }
  }
  return true;
}
// Volle Nacht weit weg (Block 124 Schritt 4): Statt jedes Licht einzeln zu stanzen (große Welt, Zoom 0.45: über 12.000 Lichter je Bild)
// bekommt ein Bildchen mit Licht ein Löschbild: Das Bildchen wird noch einmal auf eine schwarze, volle Fläche gemalt, wobei die Lichter
// wie live sofort stanzen (also auch den Schein in die eigenen Wände = Wandschein, Variante A); umgekehrt ist das genau, was live an Loch
// bleibt – auf dem Bildchen und auf allem dahinter. Einsetzen: Bildchen wie tagsüber, dann das Löschbild (destination-out). Die Löcher
// füllt drawNight mit EINER warmen Fläche (nightWarm); blaues Licht bekommt ein eigenes Lichtbild (kleiner Fleck, BLUE_SPOT), und
// Fensterscheiben in der Nähe von Blau werden vorher gelb hinterlegt (nightPanes), sonst würden sie blau.
// Nur bei voller Nacht (die Stärke ändert sich sonst) – in der Dämmerung Licht für Licht. Kostet Malzeit wie ein Bildchen (Budget)
const nightFull = () => night >= NIGHT_MAX - 1e-9;
// Block 143: Nachtbilder schon in der Dämmerung (sobald Licht an ist) – das Löschbild wird mit der Stärke der Nacht eingesetzt, genau
// wie live jedes Loch (punchGlow: Deckkraft ∝ night). Vorher dort Licht für Licht: große Welt, Full HD ~95 ms je Bild, 80 s lang
const nightPicOn = () => night > 0.15 && isLive();
// Vorwärmen (Block 143): kurz vor dem Einschalten (DUSK_PRE < night ≤ 0.15) entstehen die beleuchteten Bildchen samt Nachtbild im
// freien Budget – sonst müssen an der Schwelle alle auf einmal neu. Gemalt mit voller Nacht (withNight), wie sie später gebraucht werden
const DUSK_PRE = 0.03;
const preLit = () => night > DUSK_PRE && night <= 0.15 && isLive() && SPRITES_ON && !SPRITE_PAINT;
function withNight(fn) { const nv = night; night = NIGHT_MAX; try { return fn(); } finally { night = nv; } }
function prewarm(key, zs, make, ver = 0) {
  if (spriteOver()) return;
  const e = objSprites.get(key);
  if (!e) { const n = withNight(() => makeSprite(make, ver)); if (n) { n.used = frameNo; objSprites.set(key, n); } return; }
  e.used = frameNo;                                                      // bald gebraucht: nicht wegräumen
  if (e.paint && !e.night && !e.crop) withNight(() => nightOf(e));      // Nachtbild erst nach dem Zuschneiden (nächstes Bild)
}
const nightPics = [], nightPanes = [], nightSeen = new Set();   // Lichtbilder (Blau) und Scheiben je Bild für drawNight (große Gebäude: je Streifen einmal)
let nightWarm = false;                                         // Löcher aus Nachtbildern: drawNight legt EINE warme Fläche dahinter
const BLUE_SPOT = 0.5;                                         // blaues Licht (Kristall, Brunnen) bei voller Nacht nur halb so groß
function nightOf(e) {
  if (!e.paint || SPRITE_PAINT || e.crop) return null;                  // noch nicht zugeschnitten: nächstes Bild (Zuschneiden am Bildanfang)
  if (!spriteNoBudget && spriteOver()) { SPRITE_STATS.nmiss++; return null; }   // diesmal noch Licht für Licht
  const t0 = performance.now();
  e.night = paintNight(e);
  spriteSpent += performance.now() - t0; spriteMade++; SPRITE_STATS.made++;
  if (!e.night) spriteFail();
  return e.night;
}
function paintNight(e) {
  const P = e.paint;                                                     // e ist schon zugeschnitten: das Löschbild nimmt denselben Rahmen (kein eigenes Lesen)
  if (!e.c || !e.c.width) return null;
  let R = 0;
  for (const gl of e.glows) R = Math.max(R, gl.r);
  const pad = Math.ceil(R * DPR) + 2;                                     // Bildpunkte rundum für den Schein
  const nw = e.c.width + 2 * pad, nh = e.c.height + 2 * pad, ax = e.ox * DPR + pad, ay = e.oy * DPR + pad;   // Ursprung wie im Bildchen (gleiche Kanten)
  const blue = e.glows.some(gl => gl.tint === 'blue');
  const make = () => { const c = document.createElement('canvas'); c.width = nw; c.height = nh; const cx = c.getContext('2d'); if (!cx) { freeCanvas(c); return null; } return [c, cx]; };
  const K = make(), E = make(), B = blue ? make() : null;
  if (!K || !E || (blue && !B)) { for (const x of [K, E, B]) if (x) freeCanvas(x[0]); return null; }   // kein Speicher: Licht für Licht
  const prev = g, cells = glowCells, n0 = glows.length, am = afterMovers.length, sink = GLOW_SINK, atlas = GLOW_ATLAS, nv = night;
  let lights = [];
  try {
    night = NIGHT_MAX;                                                   // immer voll gemalt, in der Dämmerung schwächer eingesetzt (Block 143)
    // 1) auf volle schwarze Fläche wie live gemalt, die Lichter stanzen sofort – übrig bleibt Alpha = 1 − Loch
    g = K[1]; g.fillStyle = '#000'; g.fillRect(0, 0, nw, nh);
    glowCells = new Map(); SPRITE_PAINT = true; GLOW_SINK = null; GLOW_ATLAS = null;
    g.setTransform(DPR, 0, 0, DPR, ax, ay);
    P.drawFn();
    lights = glows.slice(n0);
    // 2) Löschbild = Umkehrung: Alpha = Loch (Fenster, Schein auf Wänden und auf allem dahinter)
    g = E[1]; g.fillStyle = '#000'; g.fillRect(0, 0, nw, nh);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(K[0], 0, 0); g.globalCompositeOperation = 'source-over';
    // 3) Lichtbild nur für blaues Licht (Kristall, Brunnen, Apotheke): fester kleiner Fleck; eigene warme Scheine und Scheiben darüber
    if (B) {
      g = B[1]; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = 'rgb(140,215,255)';
      for (const { q, r, tint } of lights) if (tint === 'blue') { const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2; circle(gx, gy, r * BLUE_SPOT, 'rgb(140,215,255)'); }
      g.fillStyle = 'rgb(255,205,100)';
      for (const { q, r, tint } of lights) if (tint !== 'blue') { const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2; g.fillRect(gx - r, gy - r, r * 2, r * 2); }
      for (const { q, tint } of lights) if (tint !== 'blue') poly(q, '#ffd873');
    }
  } finally { g = prev; glowCells = cells; glows.length = n0; SPRITE_PAINT = false; GLOW_SINK = sink; GLOW_ATLAS = atlas; afterMovers.length = am; night = nv; }
  freeCanvas(K[0]);
  const o = { ox: ax / DPR, oy: ay / DPR };
  const warmL = lights.filter(l => l.tint !== 'blue');
  glWarm(E[0]); if (B) glWarm(B[0]);
  return { z: e.z, erase: { c: E[0], ...o }, light: { c: B ? B[0] : null, ...o }, panes: warmL.map(l => l.q),
    halos: warmL.map(({ q, r }) => [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, r]), lights: lights.length };
}
// Scheiben und warmer Schein eines Nachtbilds als ein Bild (Block 143), erst wenn es neben Blau gebraucht wird; im Rahmen des
// Löschbilds. drawNight zeichnet hinter das Bild (destination-over): dort lagen die Scheiben über dem Schein – hier also umgekehrt malen
function warmPre(n) {
  if (n.pre !== undefined) return n.pre;
  const E = n.erase.c, c = E && document.createElement('canvas');
  if (!c) return (n.pre = null);
  c.width = E.width; c.height = E.height;
  const cx = c.getContext('2d');
  if (!cx) { freeCanvas(c); return null; }                               // kein Speicher: nächstes Mal wieder versuchen
  const prev = g;
  g = cx;
  try {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = 'rgb(255,205,100)';
    for (const [u, v, rr] of n.halos) g.fillRect(u - rr, v - rr, 2 * rr, 2 * rr);
    for (const q of n.panes) poly(q, '#ffd873');
  } finally { g = prev; }
  return (n.pre = c);
}
function putNight(e, n, cx, cy, z) {
  const r = z / e.z, at = p => [cx - p.ox * r, cy - p.oy * r, p.c.width / DPR * r, p.c.height / DPR * r];
  if (e.c) g.drawImage(e.c, ...at(e));                                   // das Bildchen wie tagsüber …
  if (n.erase.c) { g.globalCompositeOperation = 'destination-out'; if (night < NIGHT_MAX) g.globalAlpha = night / NIGHT_MAX; g.drawImage(n.erase.c, ...at(n.erase)); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }   // … dann die Löcher, in der Dämmerung schwächer (ohne save/restore: teuer je Bildchen)
  const k = Math.round(cx * 4) + ',' + Math.round(cy * 4) + ',' + (n.erase.c ? n.erase.c.width : 0);   // Streifen großer Gebäude: einmal
  if (!nightSeen.has(k)) {
    nightSeen.add(k);
    if (n.light.c) nightPics.push([n.light.c, ...at(n.light)]);
    if (n.panes.length && n.erase.c) nightPanes.push([n, ...at(n.erase), r]);
  }
  nightWarm = true;
}
// Nachtlicht wie live (Block 112): erst der Schein (trifft Boden und Nachbarn dahinter), dann das Bildchen darüber, zuletzt
// die Fensterscheiben – vorher stanzte der Schein nach dem Einsetzen gelbe Flecken in die eigenen Wände (Reihenhäuser)
function putSprite(e, cx, cy, z) {
  const r = z / e.z, x0 = cx - e.ox * r, y0 = cy - e.oy * r;
  if (!e.glows.length) { if (e.c) g.drawImage(e.c, x0, y0, e.c.width / DPR * r, e.c.height / DPR * r); return; }   // ohne Licht (tags alle): nur das Bild (Block 124)
  // volle Nacht: Bildchen + Löschbild (Schritt 4); nicht für halb durchsichtige Vorschau-Geister (das Löschbild würde Löcher stanzen)
  // und nicht für ein Bildchen, dessen scharfer Ersatz schon wartet (dessen Nachtbild entsteht ohnehin)
  if (nightPicOn() && g.globalAlpha === 1) { const n = e.night || (e.next ? null : nightOf(e)); if (n) { putNight(e, n, cx, cy, z); return; } }
  const w = e.c ? e.c.width / DPR * r : 0, h = e.c ? e.c.height / DPR * r : 0;
  const lights = e.glows.map(gl => [gl.q.map(([x, y]) => [x0 + x * r, y0 + y * r]), gl.r * r, gl.tint]);
  for (const [q, rr, tint] of lights) if (tint !== 'blue') punchGlow(q, rr, tint, 'halo');
  if (e.c) g.drawImage(e.c, x0, y0, w, h);
  for (const [q, rr, tint] of lights) punchGlow(q, rr, tint, tint === 'blue' ? null : e.mask == null ? 'pane' : 'mark');   // Kristall: Schein darüber wie bisher
  if (e.mask && night > 0.15) {                                         // nur, was im Bildchen wirklich noch Fensterlicht ist
    const M = e.mask;
    g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = Math.min(1, night / NIGHT_MAX);
    g.drawImage(M.c, x0 + M.x * r, y0 + M.y * r, M.c.width / DPR * r, M.c.height / DPR * r);
    g.restore();
  }
}
// Gebäude (Anker ax, ay) an Bildschirmpunkt c; true = erledigt
const CLOCK_SPRITES = new Set(['rathaus', 'hbf', 'uhrturm']);       // Uhren: alle 10 Spielminuten ein neues Bildchen (Block 101)
// Bewegtes zeichnen – im GL-Bild in eine Zelle der Sammelfläche (Block 144)
function moverLive(m, z, now, walker = false) {
  const f = () => walker ? drawWalker(m, z, now) : drawMover(m, z, now);
  if (!GLPASS) return f();
  const p = toScreen(m.px, m.py), [l, u, r, d] = glMoverBox(m, z);
  glLive(p.x, p.y, l, u, r, d, f);
}
function drawMover(m, z, now) {
  if (m.pbtrain) return drawParkCar(m, z, now);                            // Parkeisenbahn (Block 136)
  if (m.critter) drawCritter(m, z, now); else if (m.coaster) drawCoasterCar(m, z); else if (m.fur) drawWalker(m, z, now); else if (m.train) drawTrainCar(m, z, now); else if (m.ship) drawShipMover(m, z, now); else if (m.fish) drawFishMover(m, z, now);
  else if (m.cargo) drawCargoMover(m, z, now); else if (m.boat) drawBoatMover(m, z, now); else drawCar(m, z);
}
// Brückenstück (Schiene, Wegbrücke) über einem Schiff noch einmal zeichnen (Block 107): Brücken gehören zum Boden und lägen
// sonst unter allem, was darauf fährt
function drawBridgeOver(k, z, now) {
  const t = state.tiles.get(k);
  if (!t) return;
  const [x, y] = keyXY(k), p = toScreen(x, y);
  if (t.b === 'schiene') drawRailBed(p.x, p.y, z, x, y, t);
  else if (isWegBridge(t)) {                                              // Bogen: nur das Vordere – durch die Öffnung sieht man das Boot
    BRIDGE_FRONT = !!bridgeArch(x, y);
    try { drawPath(p.x, p.y, z, x, y, t); } finally { BRIDGE_FRONT = false; }
  }
}
// Bogenbrücke an ihrem Feld in der Objekt-Reihenfolge (Block 150): flach zuerst gezeichnet läge alles dahinter darüber
function drawArchBridge(x, y, px, py, z, t) {
  const A = bridgeArch(x, y), f = () => drawPath(px, py, z, x, y, t);
  if (SPRITES_ON && spriteArchBridge(x, y, px, py, z, t, A)) return;      // weit weg als Bildchen (wie die flachen Brücken)
  if (GLPASS) glLive(px, py, TW * z, (A.peak + 30) * z, TW * z, (TH + 12) * z, f); else f();
}
function spriteArchBridge(x, y, px, py, z, t, A) {
  const zs = spriteStep(z), keyOf = lit => `arch|${x},${y}|${FOG ? 1 : 0}|${lit}`;
  const key = keyOf(night > 0.15 && isLive() ? 1 : 0), fog = FOG;
  const make = () => {
    const sp = paintSprite(TW * zs, (A.peak + 30) * zs, (TH + 12) * zs, () => {
      const pf = FOG; FOG = fog;
      try { drawPath(0, 0, zs, x, y, t); } finally { FOG = pf; }
    });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, groundVersion);
  if (preLit()) prewarm(keyOf(1), zs, make, groundVersion);
  if (!e) return false;
  putSprite(e, px, py, z);
  return true;
}
function spriteTile(t, ax, ay, c, z, now, w, h) {
  const keyOf = lit => {
  // ohne eigene Farbe: Würfel mit „r“ (nie gleich einer gewählten Farbe); Reihenhaus: Fassaden und Giebel; Rathaus: Flagge (Block 84d)
  const look = [t.b, t.lvl, t.rot || 0, t.wall != null ? t.wall : 'r' + Math.floor(hash(ax, ay, 3) * 7), t.roof != null ? t.roof : 'r' + Math.floor(hash(ax, ay, 4) * 7),
    t.b === 'reihenhaus' ? Math.floor(hash(ax, ay, 71) * 6) + '-' + Math.floor(hash(ax, ay, 72) * 3) : '', t.b === 'rathaus' ? state.town.color + state.town.symbol + (typeof mailWaiting === 'function' && mailWaiting() ? 'm' : '') + (state.partner ? state.partner.c + state.partner.s : '') : '',
    t.look || '', t.style || '', t.win != null ? t.win : '', t.fl || '', t.col || '', t.form || '', t.cs ? JSON.stringify(t.cs) : '', FOG ? 1 : 0, lit, (gardenPath(t, ax, ay) || {}).style || '', COURTS[t.b] && courtShown(t, ax, ay) ? 'v' : ''].join('|');   // Gartenweg (Block 78), Vorplatz (91)
  return shared ? look : `${ax},${ay}|${look}|${t.phase != null ? t.phase : ''}|${t.gleise || ''}${t.len || ''}${t.wing ? 'w' + t.wing + (t.mid != null ? 'm' + t.mid : '') : ''}|${t.cross ? 1 : 0}${t.foot ? 1 : 0}`;
  };
  const shared = (isHome(t.b) && t.b !== 'hausboot') || (SHOPS[t.b] && !SHOPS[t.b].size), key = keyOf(night > 0.15 && isLive() ? 1 : 0);
  // Fassung statt Schlüssel (Block 124): Bildchen mit Platz werden mit dem Boden (groundVersion) erneuert, Uhren alle 10 Spielminuten –
  // dazwischen zeigt getSprite das alte weiter und ersetzt es im Budget (dasselbe Bildchen, nichts bleibt liegen)
  const ver = (shared ? '' : groundVersion) + (CLOCK_SPRITES.has(t.b) ? '|' + Math.floor(gameHour() * 6) : '');
  const ds = decoScale(t.b), mir = (t.rot & 1) && MIRROR.has(t.b);
  const zs = spriteStep(z);                                              // gemalt in der Zoomstufe darüber
  const make = () => {
    const tt = Object.assign({}, t);                                     // Stand beim Malen: das Nachtbild malt später noch einmal (Schritt 4)
    const pad = SPRITE_PAD[t.b] || [0, 0];
    const halfW = ((w + h) * TW / 4 + 26 + pad[0]) * zs * ds, up = spriteTop(t.b, w, h) * zs * ds, down = ((w + h) * TH / 4 + 12 + pad[1]) * zs * ds;
    const sp = paintSprite(halfW, up, down, () => { g.scale(mir ? -ds : ds, ds); PASS = 'object'; try { drawObject(tt.b, 0, 0, zs, stillNow(tt.b, ax, ay, now), ax, ay, tt.lvl, tt); } finally { PASS = null; } });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, ver);
  if (preLit()) prewarm(keyOf(1), zs, make, ver);                        // gleich wird es hell: beleuchtet schon vorbereiten (Block 143)
  if (!e) return false;
  putSprite(e, c.x, c.y, z);
  return true;
}
// Kleine Deko in einer Ecke
function spriteSmall(b, rot, sx, sy, z, now, x, y, slot, col = 0, form = 0) {
  const keyOf = lit => {
    const dark = lit && T.rail.power.dark.has(x + ',' + y + ',' + slot) ? 1 : 0;               // Laterne ohne Strom
    return `deco|${b}|${rot}|${col}|${form}|${FOG ? 1 : 0}|${lit}|${dark}|${decoVariant(b, x, y, slot)}`;   // col: Busch-/Schmuckfarbe, form: Form (Block 106); Variante statt Platz (Block 124)
  };
  const key = keyOf(night > 0.15 && isLive() ? 1 : 0);
  const s = decoScale(b) * 0.9, mir = (rot & 1) && MIRROR.has(b);
  const zs = spriteStep(z);
  const make = () => {
    const sp = paintSprite(26 * zs * s, 90 * zs * s, 12 * zs * s, () => { g.scale(mir ? -s : s, s); drawObject(b, 0, 0, zs, stillNow(b, 0, 0, now), x, y, 1, { rot, slot, col, form }); });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make);
  if (preLit()) prewarm(keyOf(1), zs, make);                             // Block 143
  if (!e) return false;
  putSprite(e, sx, sy, z);
  return true;
}
// Linien weit weg (Block 124): je Feld die hinteren Kanten samt Torpfeilern als ein Bildchen – live waren es bei großen Welten
// über 5.000 Striche/Flächen je Bild (Heckenkugeln, Zaunlatten, Pfosten). Gemalt über EDGE_PROJ um die Feldmitte (Türchen stehen
// dann still; zwischen Zoom 1 und 2 sind Felder mit Tor live). Fassung = groundVersion (Linien ändern sich nur über recalc)
function spriteEdges(x, y, px, py, z, now) {
  if (!state.edges.size || !edgeFieldsHas(x, y)) return true;            // nichts zu zeichnen
  if (SPRITES_NEAR && ['a' + x + ',' + y, 'b' + x + ',' + y].some(k => state.edges.has(k) && isGate(k))) return false;   // Türchen schwingt: nah live
  const zs = spriteStep(z), keyOf = lit => `edges|${x},${y}|${FOG ? 1 : 0}|${lit}`;
  const key = keyOf(night > 0.15 && isLive() ? 1 : 0);
  const fog = FOG;
  const make = () => {
    const proj = (u, v) => ({ x: ((u - x) - (v - y)) * TW / 2 * zs, y: ((u - x) + (v - y)) * TH / 2 * zs });
    const sp = paintSprite((TW * 0.75 + 24) * zs, (TH + 120) * zs, (TH * 0.5 + 24) * zs, () => {
      const prev = EDGE_PROJ, pf = FOG; EDGE_PROJ = proj; FOG = fog;
      try { drawEdgesAt(x, y, zs, now); } finally { EDGE_PROJ = prev; FOG = pf; }
    });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, groundVersion);
  if (preLit()) prewarm(keyOf(1), zs, make, groundVersion);              // Block 143
  if (!e) return false;
  putSprite(e, px, py, z);
  return true;
}
// Brücken und leuchtende Wege weit weg (Block 144): stecken nicht im Boden-Bild (Schiffe fahren unter Brücken, Kristallwege leuchten
// nachts) und wurden jedes Bild live gezeichnet – in einer Welt mit 107 solchen Feldern ein Gutteil der Rechenzeit, und das
// GL-Standbild blieb aus. Jetzt je Feld ein Bildchen (Fassung groundVersion; Form hängt an den Nachbarn); das Brückenstück über
// einem Schiff zeichnet drawBridgeOver weiter live
function spriteFlat(x, y, px, py, z, t) {
  const zs = spriteStep(z), keyOf = lit => `flat|${x},${y}|${FOG ? 1 : 0}|${lit}`;
  const key = keyOf(night > 0.15 && isLive() ? 1 : 0), fog = FOG;
  const make = () => {
    const sp = paintSprite((TW * 0.75 + 24) * zs, (TH + 60) * zs, (TH + 70) * zs, () => {
      const pf = FOG; FOG = fog;
      try { drawFlat(0, 0, zs, x, y, t); } finally { FOG = pf; }
    });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, groundVersion);
  if (preLit()) prewarm(keyOf(1), zs, make, groundVersion);
  if (!e) return false;
  putSprite(e, px, py, z);
  return true;
}
function spriteHousekeeping() {
  for (const e of spriteTrash) freeSprite(e);                          // ersetzte Bildchen vom letzten Bild
  spriteTrash.length = 0;
  if (frameNo % 120 !== 0) return;
  for (const [k, e] of objSprites) {
    if (frameNo - e.used > 3600) dropSprite(k);                          // ~2 Minuten behalten (beim nächsten Rauszoomen noch da)
    else if (e.night && ((!nightPicOn() && !(night > DUSK_PRE)) || frameNo - e.used > 300)) freeNight(e);   // Nachtbilder nur nachts (und kurz davor) und nur für Gesehenes
  }
}
// Leinwände gleich freigeben (Block 124): Breite 0 gibt den Speicher sofort zurück – auf dem iPad zählt jede Leinwand gegen eine
// feste Grenze, bis die Speicherbereinigung irgendwann kommt
function freeCanvas(c) { if (c) { if (typeof glForget === 'function') glForget(c); c.width = 0; c.height = 0; } }
function freeSprite(e) { freeCanvas(e.c); if (e.mask) freeCanvas(e.mask.c); if (e.maskTodo) freeCanvas(e.maskTodo.c); freeNight(e); if (e.next) { freeSprite(e.next); e.next = null; } }
function freeNight(e) { const n = e.night; e.night = null; if (n) { freeCanvas(n.erase.c); freeCanvas(n.light.c); freeCanvas(n.pre); } }
function dropSprite(k) { const e = objSprites.get(k); if (!e) return; objSprites.delete(k); spriteSwap.delete(k); freeSprite(e); }
// Andere Welt (Laden, Besuch, Testwelt, neue Insel) oder andere Pixeldichte: Bildchen und Boden nicht weiter benutzen (Block 124)
function resetDrawCaches() {
  if (typeof glTouch === 'function') glTouch();
  for (const k of [...objSprites.keys()]) dropSprite(k);
  for (const e of spriteTrash) freeSprite(e);
  spriteTrash.length = 0; spriteCrops.length = 0; spriteSwap.clear();
  for (const e of groundCache.values()) freeCanvas(e.c);
  groundCache.clear(); seaInfo.clear();
  if (seaImage) { freeCanvas(seaImage.c); seaImage = null; }
  depthImg = null;
  if (typeof ICON_SPRITES !== 'undefined') ICON_SPRITES.clear();
}

// Was liegt unter dem Finger? (Block 71) Gebäude und Dekos zählen dort, wo sie gezeichnet sind – Dach, Turm und Fahne,
// nicht nur ihr Bodenfeld. Das Ding wird dafür in ein winziges Bild um den Punkt gemalt; hat es dort Farbe, ist es getroffen.
// Dünnes (Baugerüst, Laternenmast, Zaunlatten) zählt nur, wenn dort sonst nichts Flächiges steht – man sieht hindurch.
// Von vorn nach hinten wie beim Zeichnen: große Gebäude in der Spalte des Fingers an ihrem vordersten Feld,
// Linien vor den Dingen ihres Feldes, hintere Dekos davor, vordere danach.
const HIT_R = 4, HIT_SOLID = 0.3;                  // Spielraum rund um den Finger (Bildpunkte); ab diesem Anteil Farbe flächig
const FLAT_HIT = new Set(['weg', 'schiene']);      // liegen auf dem Boden: das Bodenfeld genügt
let hitCanvas = null;
function inkAt(sx, sy, cx, cy, sc, draw) {
  const n = HIT_R * 2 + 1;
  if (!hitCanvas) { hitCanvas = document.createElement('canvas'); hitCanvas.width = hitCanvas.height = n; }
  const prev = g, hc = hitCanvas.getContext('2d', { willReadFrequently: true });
  if (!hc) return false;                                       // kein Speicher: hier nichts getroffen (Block 124)
  let px = null;
  g = hc; GLOW_SINK = []; SPRITE_PAINT = true;
  try {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, n, n);
    g.setTransform(sc[0], 0, 0, sc[1], cx - sx + HIT_R, cy - sy + HIT_R);
    draw();
    const img = g.getImageData(0, 0, n, n);
    px = img && img.data;
  } catch (e) { px = null; } finally { GLOW_SINK = null; SPRITE_PAINT = false; PASS = null; g = prev; }
  if (!px) return 0;
  let n2 = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] > 60) n2++;
  return n2 / (n * n);                             // Anteil des Fleckens mit Farbe
}
// { x, y, slot, d } – Gebäude: Anker und slot −1, Deko: ihr Feld und Platz; d = Tiefe (größer = weiter vorn)
function objectAt(sx, sy) {
  const z = cam.z, now = performance.now(), [fa, fb] = tileFrac(sx, sy), col = Math.round(fa - fb), cand = [];
  for (const [k, t] of state.tiles) {
    if (FLAT_HIT.has(t.b)) continue;
    const [ax, ay] = keyXY(k);
    if (t.b !== 'lm' && !ownedTile(ax, ay)) continue;
    const [w, h] = sizeOf(t.b, t.rot, t), c = toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2), ds = decoScale(t.b);
    if (Math.abs(sx - c.x) > ((w + h) * TW / 4 + 30) * z * ds || sy > c.y + ((w + h) * TH / 4 + 14) * z * ds || sy < c.y - spriteTop(t.b, w, h) * 1.4 * z * ds) continue;
    const d = Math.max(ax - (ay + h - 1), Math.min(ax + w - 1 - ay, col)), fx = Math.min(ax + w - 1, ay + h - 1 + d);   // Spalte des Fingers
    const mir = (t.rot & 1) && MIRROR.has(t.b);
    cand.push({ x: ax, y: ay, slot: -1, d: 2 * fx - d, ink: () => inkAt(sx, sy, c.x, c.y, [mir ? -ds : ds, ds], () => { PASS = 'object'; drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t); }) });
  }
  for (const [k, slots] of state.decos) {
    const [x, y] = keyXY(k);
    if (!ownedTile(x, y)) continue;
    const p = toScreen(x, y);
    slots.forEach((dc, i) => {
      if (!dc) return;
      const [u, v] = slotPos(x, y, i, dc), s = decoScale(dc.b) * 0.9, qx = p.x + (u - v) * TW / 2 * z, qy = p.y + (u + v) * TH / 2 * z;
      if (Math.abs(sx - qx) > 30 * z * s || sy > qy + 14 * z * s || sy < qy - 100 * z * s) return;
      const mir = ((dc.rot || 0) & 1) && MIRROR.has(dc.b), back = SLOTS_BACK.includes(i);
      cand.push({ x, y, slot: i, d: x + y + (back ? -0.25 : 0.25) + (u + v) * 0.1, ink: () => inkAt(sx, sy, qx, qy, [mir ? -s : s, s], () => drawObject(dc.b, 0, 0, z, now, x, y, 1, { rot: dc.rot || 0, slot: i, col: dc.col || 0, form: dc.form || 0 })) });   // Treffer wie gezeichnet (Form, Block 106)
    });
  }
  cand.sort((a, b) => b.d - a.d);
  let thin = null;
  for (const c of cand) {
    const f = c.ink();
    if (f >= HIT_SOLID) return { x: c.x, y: c.y, slot: c.slot, d: c.d };
    if (f > 0 && !thin) thin = c;
  }
  const gt = toTile(sx, sy), ga = COVER.get(gt.x + ',' + gt.y), under = ga && state.tiles.get(ga);
  if (!thin || (under && !FLAT_HIT.has(under.b))) return null;   // durchs Gerüst aufs Haus dahinter getippt: das Bodenfeld gilt
  return { x: thin.x, y: thin.y, slot: thin.slot, d: thin.d };
}
// Linie (Hecke, Zaun): wird vor den Dingen ihres Feldes gezeichnet ('a'/'b' i,j gehören zu Feld i,j)
const edgeDepth = k => { const { i, j } = edgeParse(k); return i + j - 0.5; };
// Schilder (Sehenswürdigkeit, Insel) des letzten Bildes: auch sie lassen sich antippen
const pillHits = [];                               // { x0, y0, x1, y1, look, open(sx, sy) }
function pillAt(sx, sy) {
  for (let i = pillHits.length - 1; i >= 0; i--) {
    const p = pillHits[i];
    if (sx >= p.x0 - 4 && sx <= p.x1 + 4 && sy >= p.y0 - 4 && sy <= p.y1 + 4) return p;
  }
  return null;
}

// Sternschnuppe (Sternwarte): fällt in der ersten Sekunde schräg vom Himmel, liegt dann funkelnd da und verblasst am Ende
function drawFallenStar(s, z, now) {
  const age = now - s.t0, p = toScreen(s.x, s.y), fall = Math.min(1, age / 1000);
  const x = p.x + (1 - fall) * 220 * z, y = p.y - 14 * z - (1 - fall) * 320 * z, fade = Math.min(1, (STAR_LIFE - age) / 5000);
  if (fade <= 0 || x < -60 || x > W + 60 || y < -60 || y > H + 60) return;
  g.save();
  g.globalAlpha = Math.max(0, fade);
  if (fall < 1) {                                                       // Schweif
    const grd = g.createLinearGradient(x, y, x + 60 * z, y - 90 * z);
    grd.addColorStop(0, 'rgba(255,240,170,0.9)'); grd.addColorStop(1, 'rgba(255,240,170,0)');
    g.strokeStyle = grd; g.lineWidth = 2.5 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 * z, y - 90 * z); g.stroke();
  }
  const r = (8 + Math.sin(now / 250) * 1) * z;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fillStyle = '#ffe27a'; g.fill();
  circle(x, y, r * 0.3, '#fffbe6');
  g.restore();
  glowQuad([[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]], 50 * z);
}
// Tiefes Meer (Block 27b): weit draußen dunkler. Ein kleines Bild mit einem Punkt je Feld (depthAlpha), gedreht und
// gestaucht wie die Felder über den Boden gelegt (ohne Glätten: jeder Punkt ist genau ein Feld). Neu gerechnet, wenn
// der sichtbare Bereich es verlässt oder sich Wasser ändert.
let depthImg = null;
function drawDepth(minX, maxX, minY, maxY, z) {
  const d = depthImg;
  if (!d || d.v !== waterVersion || minX < d.x0 || maxX > d.x1 || minY < d.y0 || maxY > d.y1) {
    const pad = Math.min(60, Math.max(20, (maxX - minX) >> 1)), x0 = minX - pad, y0 = minY - pad, w = maxX - minX + 2 * pad + 1, h = maxY - minY + 2 * pad + 1;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    if (!cx) return;                                           // kein Speicher (iPad): diesmal ohne Tiefe (Block 124)
    const img = cx.createImageData(w, h), px = img.data;
    let any = false;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const a = depthAlpha(x0 + i, y0 + j);
      if (a <= 0) continue;
      const o = (j * w + i) * 4;
      px[o] = 22; px[o + 1] = 62; px[o + 2] = 118; px[o + 3] = Math.round(a * 255); any = true;
    }
    if (any) cx.putImageData(img, 0, 0);
    depthImg = { c, x0, y0, x1: x0 + w - 1, y1: y0 + h - 1, v: waterVersion, any };
  }
  if (!depthImg.any) return;
  const o = toScreen(depthImg.x0 - 0.5, depthImg.y0 - 0.5), a = DPR * z * TW / 2, b = DPR * z * TH / 2;
  g.save();
  g.imageSmoothingEnabled = false;
  g.setTransform(a, b, -a, b, o.x * DPR, o.y * DPR);
  g.drawImage(depthImg.c, 0, 0);
  g.restore();
}
let hoverKey = '', hoverSince = 0;
const HOVER_CALM = 120;                // ms Ruhe, bevor die Vorschau (+Taler, +Einwohner …) rechnet
const GROUND_MS = 8, GROUND_Z_MAX = 3, GROUND_KEEP = 160;   // GROUND_KEEP: höchstens so viele Grundstücks-Bilder im Speicher            // Malzeit je Bild für veraltete Boden-Bilder (groundSpent, zusammen mit den Bildchen PAINT_MS)
function drawGroundCached(cMinX, cMaxX, cMinY, cMaxY, z, now) {
  const want = Math.min(zoomStep(Math.min(z, GROUND_Z_MAX)), stepBelow(GROUND_MAX_SCALE / DPR)) * DPR, zooming = now - lastZoomChange < 250;   // Boden-Bilder nicht riesig: ganz nah leicht hochskaliert; feste Zoomstufen, nie über GROUND_MAX_SCALE (Block 124)
  const order = [];
  for (let cy = cMinY; cy <= cMaxY; cy++) for (let cx = cMinX; cx <= cMaxX; cx++) order.push([cx, cy]);
  order.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
  const stale = e => { const ratio = want / e.scale; return (!zooming && Math.abs(ratio - 1) > 0.02) || ratio < 0.6 || ratio > 1.6; };
  const waveList = [], ahead = [];
  for (const [cx, cy] of order) {
    const b = chunkBounds(cx, cy);
    const sx = (b.left - cam.x) * z + W / 2, sy = (b.top - cam.y) * z + H / 2;
    if (sx > W || sy > H || sx + b.w * z < 0 || sy + b.h * z < 0) { ahead.push([cx, cy]); continue; }
    const info = chunkSea(cx, cy);
    let img;
    if (info.sea) {
      if (!seaImage || stale(seaImage)) { const t0 = performance.now(), n = renderGroundChunk(WORLD.cMax + 50, 0, want); groundSpent += performance.now() - t0; if (n) { freeCanvas(seaImage && seaImage.c); seaImage = n; } }
      if (!seaImage) continue;
      img = seaImage.c;
    } else {
      const ck = cx + ',' + cy;
      let e = groundCache.get(ck);
      // Neu malen, was fehlt; Veraltetes (Zoom, Bauen) nur, solange das Zeitbudget reicht – sonst das alte Bild (Block 31)
      const ratio = e ? want / e.scale : 0, usable = e && ratio > 0.4 && ratio < 2.5;
      if (!e || ((e.v !== groundVersion || stale(e)) && (!usable || groundSpent < GROUND_MS))) {   // Veraltetes, das noch zu sehen ist: immer nur GROUND_MS (das Aufholen gehört den fehlenden Bildchen)
        if (GL.bg && GL.bgB.gpaint > GLB_MS) { if (!e) { GL.bgB.retry = true; continue; } }   // Standbild im Hintergrund/Vorladen: Rest im nächsten Bild (Block 144)
        else {
          const t0 = performance.now(), n = renderGroundChunk(cx, cy, want), dt = performance.now() - t0;
          groundSpent += dt; if (GL.bg) GL.bgB.gpaint += dt;
          if (n) { if (e) freeCanvas(e.c); e = n; groundCache.set(ck, e); }   // kein Speicher: altes Bild weiter (oder diesmal keins)
        }
      }
      if (!e) continue;
      e.used = frameNo;
      img = e.c;
    }
    g.drawImage(img, sx, sy, b.w * z, b.h * z);
    for (const [x, y] of info.waves) waveList.push(x, y);
  }
  drawWaves(waveList, z, now);                                           // alle auf einmal, über den Grundstücken (wie vorher je Grundstück danach)
  // Vorab (Block 143): ein Grundstück knapp außerhalb des Bildes malen, wenn in diesem Bild noch nichts gemalt wurde und nichts
  // aufzuholen ist – beim Verschieben sind sie dann schon da (vorher: am Rand fehlend → sofort und ohne Budget gemalt, Spitzen ~100 ms)
  if (!zooming && groundSpent === 0 && !spriteCatch && !spritePrep && !GL.bg) {
    for (const [cx, cy] of ahead) {
      const ck = cx + ',' + cy, e = groundCache.get(ck);
      if (e) { e.used = frameNo; if (e.v === groundVersion && !stale(e)) continue; }
      if (chunkSea(cx, cy).sea) continue;
      const t0 = performance.now(), n = renderGroundChunk(cx, cy, want);
      groundSpent += performance.now() - t0;
      if (n) { if (e) freeCanvas(e.c); n.used = frameNo; groundCache.set(ck, n); }
      break;                                                             // eins je Bild
    }
  }
  if (frameNo % 60 === 0) {
    const keepF = GL_LOWMEM ? 900 : 3600, keepN = GL_LOWMEM ? GROUND_KEEP : GROUND_KEEP * 3;   // PC: länger und mehr (Vorladen, Block 144)
    for (const [ck, e] of groundCache) if (frameNo - e.used > keepF) { groundCache.delete(ck); freeCanvas(e.c); }   // länger behalten: beim Zurückschieben schon da
    if (groundCache.size > keepN) {                                // aber nicht unbegrenzt (Speicher iPad): die am längsten nicht gesehenen weg
      const old = [...groundCache].sort((a, b) => a[1].used - b[1].used).slice(0, groundCache.size - keepN);
      for (const [ck, e] of old) if (e.used !== frameNo) { groundCache.delete(ck); freeCanvas(e.c); }
    }
    if (seaInfo.size > 400) seaInfo.clear();
  }
}
// Wald- und Felsfelder als fertige Bilder
const spriteCache = new Map();
const SPRITE_BOX = { left: -TW / 2 - 12, top: -46, w: TW + 24, h: 66 };
function tileSprite(kind, x, y, px, py, z) {
  const variants = kind === 'rock' || kind === 'erz' || kind === 'kristall' ? 4 : 6;
  const v = Math.floor(hash(x, y, 61) * variants), key = kind + v + (FOG ? 'n' : '');
  const want = z * DPR;
  let e = spriteCache.get(key);
  if (!e || want / e.scale > 1.25 || want / e.scale < 0.8) {
    const c = document.createElement('canvas'), B = SPRITE_BOX;
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const prev = g, cg = c.getContext('2d');
    if (!cg) { if (!e) return; } else {                       // kein Speicher (iPad): altes Bild weiter bzw. diesmal keins (Block 124)
    g = cg;
    g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want);
    const vx = 5000 + v * 7, vy = 5000 + v * 13;
    if (kind === 'forest') drawForest(0, 0, 1, vx, vy, 3);
    else if (kind === 'obst') drawForest(0, 0, 1, vx, vy, 3, true);
    else if (kind === 'kristall') drawCrystalRocks(0, 0, 1, vx, vy);
    else drawRocks(0, 0, 1, vx, vy, kind === 'erz');
    g = prev;
    if (e) freeCanvas(e.c);
    e = { c, scale: want };
    spriteCache.set(key, e);
    }
  }
  const B = SPRITE_BOX;
  g.drawImage(e.c, px + B.left * z, py + B.top * z, B.w * z, B.h * z);
}
// Vorschau einer Linie bzw. eines Rechtecks: grün = wird gebaut, rot = geht nicht, hell = ist schon so
function planPreview(z) {
  const info = planInfo(plan), ins = 0.44, dia = (x, y, fill, line) => {      // etwas eingerückt: jedes Feld einzeln sichtbar
    const c = [toScreen(x - ins, y - ins), toScreen(x + ins, y - ins), toScreen(x + ins, y + ins), toScreen(x - ins, y + ins)];
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
    g.fillStyle = fill; g.fill();
    if (line) { g.strokeStyle = line; g.lineWidth = 1.6 * z; g.stroke(); }
  };
  g.save();
  g.lineJoin = 'round';
  if (plan.kind === 'edge') {                                   // Zaun & Co.: die Kanten farbig am Boden
    for (const k of planEdges(plan)) {
      const s = info.states.get(k);
      edgeMark(k, s === 'ok' ? (info.err ? '#e8913a' : '#2f9f55') : s === 'same' ? 'rgba(255,255,255,0.6)' : '#e5484d', z);
    }
    g.restore();
    const e = toScreen(plan.b.x - 0.5, plan.b.y - 0.5);
    return { ok: !info.err, text: planText(plan, info), p: e };
  }
  for (const [x, y] of planTiles(plan)) {
    const s = info.states.get(x + ',' + y);
    if (s === 'ok') dia(x, y, 'rgba(255,255,255,0.55)', info.err ? '#e8913a' : '#2f9f55');
    else if (s === 'same') dia(x, y, 'rgba(255,255,255,0.25)');
    else dia(x, y, 'rgba(229,72,77,0.45)', '#e5484d');
  }
  const [x0, y0, x1, y1] = planBox(plan);
  if (plan.kind === 'rect') {                                   // Rahmen um die ganze Fläche
    const c = [toScreen(x0 - 0.5, y0 - 0.5), toScreen(x1 + 0.5, y0 - 0.5), toScreen(x1 + 0.5, y1 + 0.5), toScreen(x0 - 0.5, y1 + 0.5)];
    g.strokeStyle = info.err ? '#e5484d' : '#3fbf6f'; g.lineWidth = 2.5 * z; g.setLineDash([6 * z, 4 * z]);
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); g.stroke();
  }
  g.restore();
  const p = plan.kind === 'line' ? toScreen(plan.b.x, plan.b.y) : toScreen((x0 + x1) / 2, (y0 + y1) / 2);
  return { ok: !info.err, text: planText(plan, info), p };
}
// Vorschau beim Verschieben einer Gruppe: Grundflächen grün/rot, die Dinge als Geister an ihrem vordersten Feld
function groupPreview(z) {
  const { ox, oy, errs, first } = groupErrors(hover.x, hover.y), ghosts = new Map(), now = performance.now();
  const add = (k, f) => { if (!ghosts.has(k)) ghosts.set(k, []); ghosts.get(k).push(f); };
  const dia = (x, y, bad) => {
    const c = [toScreen(x - 0.44, y - 0.44), toScreen(x + 0.44, y - 0.44), toScreen(x + 0.44, y + 0.44), toScreen(x - 0.44, y + 0.44)];
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
    g.fillStyle = bad ? 'rgba(229,72,77,0.45)' : 'rgba(255,255,255,0.5)'; g.fill();
    g.strokeStyle = bad ? '#e5484d' : '#2f9f55'; g.lineWidth = 1.6 * z; g.stroke();
  };
  g.save(); g.lineJoin = 'round';
  for (const it of moving.items) {
    const P = groupPlaced(it), bad = !!errs.get(it);                  // nach der Drehung (Block 117)
    if (it.kind === 'edge') {                                          // Linie: ein Strich auf der Feldkante
      const k = edgeAtMid(ox + P.mx, oy + P.my), [[ax, ay], [bx, by]] = edgeEndPoints(k).map(([vx, vy]) => [vx - 0.5, vy - 0.5]), p0 = toScreen(ax, ay), p1 = toScreen(bx, by);
      g.lineCap = 'round';
      for (const [col, w] of [['rgba(255,255,255,0.9)', 5.5], [bad ? '#e5484d' : C(shade((STYLES[P.e.b] && styleDef(P.e.b, P.e.style).col) || '#7a5236', -0.25)), 3]]) {   // heller Rand: auch auf Rasen sichtbar
        g.strokeStyle = col; g.lineWidth = w * z; g.beginPath(); g.moveTo(p0.x, p0.y - 3 * z); g.lineTo(p1.x, p1.y - 3 * z); g.stroke();
      }
      continue;
    }
    const x = ox + P.dx, y = oy + P.dy;
    if (it.kind === 'ground') {                                        // Rasen: grüne Raute
      const c = [toScreen(x - 0.5, y - 0.5), toScreen(x + 0.5, y - 0.5), toScreen(x + 0.5, y + 0.5), toScreen(x - 0.5, y + 0.5)];
      g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
      g.fillStyle = bad ? 'rgba(229,72,77,0.4)' : it.look === 'fz' ? 'rgba(242,140,177,0.45)' : 'rgba(110,190,80,0.55)'; g.fill();
      continue;
    }
    if (it.kind === 'deco') {
      const slot = P.slot, d = P.d, [u, v] = slotPos(x, y, slot, d);
      add(x + ',' + y, () => { const p = toScreen(x, y); drawSmallOne(d.b, d.rot || 0, p.x + (u - v) * TW / 2 * z, p.y + (u + v) * TH / 2 * z, z, now, x, y, 1, slot, d.col || 0, d.form || 0); });
      continue;
    }
    const t = P.t, [w, h] = sizeOf(t.b, t.rot || 0, t);
    for (const [fx, fy] of footprint(t.b, x, y, t.rot || 0, t)) dia(fx, fy, bad);
    if (t.b === 'weg' || t.b === 'schiene') continue;                // Wege: die Fläche genügt
    add((x + w - 1) + ',' + (y + h - 1), () => {
      const c = toScreen(x + (w - 1) / 2, y + (h - 1) / 2), s = decoScale(t.b);
      g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -s : s, s);
      drawObject(t.b, 0, 0, z, now, x, y, t.lvl, t);
      g.restore();
    });
  }
  g.restore();
  const n = moving.items.length;
  return { groupGhost: ghosts, preview: { ok: !first, text: first || `${n} Dinge · hierhin`, p: toScreen(hover.x, hover.y) } };
}
// Nacht: Die Lichter haben beim Zeichnen Löcher gestanzt (glowQuad). Nur das übrige Bild wird dunkel, dann kommt
// hinter die Löcher das Licht – wo inzwischen etwas davor steht, ist kein Loch mehr. Große Gebäude werden in
// Streifen gezeichnet und tragen ihre Lichter mehrfach ein: jedes nur einmal hinterlegen.
function drawNight() {
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = `rgba(25,35,85,${night})`;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-over';
  const lights = nightDedup(glows);
  let fill = null;
  const sq = (x, y, s, f) => { if (f !== fill) g.fillStyle = fill = f; g.fillRect(x, y, s, s); };
  nightLights(lights, nightPics, nightPanes, nightWarm, {            // hinter das Bild (destination-over): was zuerst kommt, liegt vorn
    win: q => { poly(q, '#ffd873'); fill = null; },
    pre: (c, x, y, w, h) => g.drawImage(c, x, y, w, h),
    pic: (c, x, y, w, h) => g.drawImage(c, x, y, w, h),
    square: sq,
    disc: (x, y, r, f) => { circle(x, y, r, f); fill = null; },   // circle setzt fillStyle selbst (vorher wurde danach warmer Schein blau)
  });
  if (nightWarm) { g.fillStyle = 'rgb(255,205,100)'; g.fillRect(0, 0, W, H); }   // übrige Löcher kommen nur noch aus warmen Nachtbildern
  g.fillStyle = '#2a3f66';                                                        // Sicherheitsnetz: nie durchsichtig
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  return lights.length;
}
// dasselbe Licht (große Gebäude stanzen es je Streifen) nur einmal (derselbe Text wie früher, ohne map/join – Block 124)
function nightDedup(list) {
  const seen = new Set();
  return list.filter(({ q, r }) => {
    const k = Math.round(q[0][0] * 4) + ',' + Math.round(q[0][1] * 4) + ',' + Math.round(q[2][0] * 4) + ',' + Math.round(q[2][1] * 4) + ',' + Math.round(r * 4);
    return !seen.has(k) && seen.add(k);
  });
}
// Die Lichtschicht der Nacht (hinter dem Bild, scheint durch die gestanzten Löcher) – für 2D (drawNight) und die Grafikkarte
// (gl.js, Block 144) dieselbe Reihenfolge: Fensterscheiben, warme Scheiben neben Blau, weicher Schein, Lichtbilder der Bildchen.
// E: { win(q), pre(c, x, y, w, h), square(x, y, size, farbe), disc(x, y, r, farbe), pic(c, x, y, w, h) } in Bildschirmpunkten
function nightLights(lights, pics, panes, warm, E) {
  for (const { q, tint } of lights) if (tint !== 'blue') E.win(q);                // Fenster zuerst, ganz hell
  // Nachtbilder (Block 124): ihre Löcher füllt sonst erst die warme Fläche ganz am Ende – liegt blaues Licht in der Nähe, käme das
  // zuerst und Fenster samt Schein würden blau. Darum dort Scheiben und warmen Schein vorher wie live (nur Bildchen, die Blau berühren)
  if (warm) {
    const blue = pics.map(([, x, y, w, h]) => [x, y, x + w, y + h]);
    for (const { q, r, tint } of lights) if (tint === 'blue') { const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2, h = r * BLUE_SPOT; blue.push([gx - h, gy - h, gx + h, gy + h]); }
    if (blue.length) {
      // Block 143: Nähe über ein Raster statt jedes gegen jedes (große Welt: 2.700 × 400 Vergleiche je Bild), und Scheiben samt Schein
      // je Bildchen als EIN vorbereitetes Bild (warmPre) statt Fläche für Fläche (große Welt nachts: 9.000 Befehle je Bild)
      const CELL = 256, grid = new Map(), cells = (a, b, c, d, f) => { for (let i = Math.floor(a / CELL); i <= Math.floor(c / CELL); i++) for (let j = Math.floor(b / CELL); j <= Math.floor(d / CELL); j++) f(i + ',' + j); };
      for (const r of blue) cells(r[0], r[1], r[2], r[3], k => { const l = grid.get(k); if (l) l.push(r); else grid.set(k, [r]); });
      const hit = (x, y, w, h) => { let yes = false; cells(x, y, x + w, y + h, k => { if (!yes) for (const [a, b, c, d] of grid.get(k) || []) if (a < x + w && c > x && b < y + h && d > y) { yes = true; break; } }); return yes; };
      for (const [n, x, y, w, h] of panes) if (hit(x, y, w, h)) { const pre = warmPre(n); if (pre) E.pre(pre, x, y, w, h); }   // erst Scheiben, dann Schein (wie live)
    }
  }
  for (const { q, r, tint } of lights) {                                          // dann der weiche Schein
    const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2, f = tint === 'blue' ? 'rgb(140,215,255)' : 'rgb(255,205,100)';
    // mit Nachtbildern: blaues Licht als kleiner fester Fleck (gestanzt wird dann auch nur so groß, punchGlow) – ein blaues Quadrat
    // träfe die Fensterlöcher der Nachbarn
    if (warm && tint === 'blue') E.disc(gx, gy, r * BLUE_SPOT, f);
    else E.square(gx - r, gy - r, r * 2, f);
  }
  for (const [c, x, y, w, h] of pics) E.pic(c, x, y, w, h);                     // Lichtbilder der Bildchen (volle Nacht, Block 124)
}
// Nachtlicht: ein vorgezeichneter weicher Lichtfleck statt eines Farbverlaufs pro Fenster
const glowSprites = {};
function glowImage(blue) {
  const key = blue ? 'blue' : 'warm';
  if (glowSprites[key]) return glowSprites[key];
  const c = document.createElement('canvas'), rgb = blue ? '140,215,255' : '255,205,100';
  c.width = c.height = 64;
  const x = c.getContext('2d');
  if (!x) return c;                                            // kein Speicher: leer, nächstes Mal neu versuchen (Block 124)
  const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, `rgba(${rgb},1)`); grd.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = grd; x.fillRect(0, 0, 64, 64);
  return (glowSprites[key] = c);
}

// Sichtbare Felder in Maler-Reihenfolge (Diagonalen x + y, darin x aufsteigend): [x, y, px, py, …]. Unter dem Bildrand: hohe große
// Gebäude werden an ihren vordersten Feldern gezeichnet (Streifen) – die dürfen weiter unten liegen (Block 84d).
// Block 144: dieselbe Rechnung wie toScreen, aber ohne Objekte je Feld, und eine Diagonale (gleiches x + y = gleiche Höhe im Bild)
// außerhalb des Bilds wird ganz übersprungen – vorher je Bild ~13.000 toScreen für ~6.000 sichtbare Felder (Full HD)
function visibleTiles(minX, maxX, minY, maxY, z) {
  const mX = TW * z, mTop = 110 * z, mBot = TH * z, mBig = 420 * z;
  const bigFront = (x, y) => { const a = COVER.get(x + ',' + y), t = a && state.tiles.get(a); if (!t) return false;
    const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t); return (w > 1 || h > 1) && (x === ax + w - 1 || y === ay + h - 1); };
  const visible = [];
  for (let s = minX + minY; s <= maxX + maxY + 30; s++) {
    const py = (s * TH / 2 - cam.y) * cam.z + H / 2;
    if (py < -mBot || py > H + mBig) continue;
    const low = py > H + mTop;
    for (let x = Math.max(minX, s - maxY - 30); x <= Math.min(maxX + 30, s - minY); x++) {
      const y = s - x, px = ((x - y) * TW / 2 - cam.x) * cam.z + W / 2;
      if (px < -mX || px > W + mX) continue;
      if (low && !bigFront(x, y)) continue;
      visible.push(x, y, px, py);
    }
  }
  return visible;
}
// Ausschnitt: sichtbare Felder und Boden-Kacheln für cam, W, H – auch für das Standbild im Hintergrund (Block 144, glBgStep)
function worldView(z) {
  const cs = [toTile(0, 0), toTile(W, 0), toTile(0, H), toTile(W, H)];
  groundCached = z * DPR <= GROUND_MAX_SCALE && isLive();
  let minX = Math.min(...cs.map(c => c.x)) - 2, maxX = Math.max(...cs.map(c => c.x)) + 6;
  let minY = Math.min(...cs.map(c => c.y)) - 2, maxY = Math.max(...cs.map(c => c.y)) + 6;
  // Außerhalb der Insel steht nichts: dort nur den Boden aus dem Zwischenspeicher, keine Felder durchgehen
  const seen = [minX, maxX, minY, maxY];                // ganz, auch jenseits der Welt (tiefes Meer)
  const cMinX = Math.floor(minX / CHUNK) - 1, cMaxX = Math.floor(maxX / CHUNK) + 1;
  const cMinY = Math.floor(minY / CHUNK) - 1, cMaxY = Math.floor(maxY / CHUNK) + 1;
  if (groundCached) {
    minX = Math.max(minX, WORLD.cMin * CHUNK - 1); maxX = Math.min(maxX, (WORLD.cMax + 1) * CHUNK);
    minY = Math.max(minY, WORLD.cMin * CHUNK - 1); maxY = Math.min(maxY, (WORLD.cMax + 1) * CHUNK);
  }
  const visible = visibleTiles(minX, maxX, minY, maxY, z);
  return { visible, seen, cMinX, cMaxX, cMinY, cMaxY, minX, maxX, minY, maxY };
}
// Boden, Tiefe, Teile am Boden, leuchtende Wege (glPlay: Boden und Tiefe kommen aus dem Standbild)
function worldGround(V, z, now, glPlay) {
  const { visible, seen, cMinX, cMaxX, cMinY, cMaxY, minX, maxX, minY, maxY } = V;
  if (glPlay) { /* Boden gemerkt */ }
  else if (groundCached) drawGroundCached(cMinX, cMaxX, cMinY, cMaxY, z, now);
  else for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1];
    FOG = !ownedTile(x, y) && terrainAt(x, y) !== 'water';
    drawGround(x, y, { x: visible[i + 2], y: visible[i + 3] }, z, now);
  }
  FOG = false;
  if (!glPlay) drawDepth(...seen, z);
  const visRange = ([ax, ay], w = 1, h = 1) => ax + w - 1 >= minX - 3 && ax <= maxX + 1 && ay + h - 1 >= minY - 3 && ay <= maxY + 1;   // ganze Fläche (lange Hbf)
  if (!groundCached) drawGroundParts(visRange, toScreen, z);
  // Wege immer vor allem anderen (sie liegen flach); aus dem Zwischenspeicher fehlen nur die leuchtenden
  const liveFlat = groundCached ? liveFlatSet() : null;                 // Block 144: meist leer – dann gar nicht durchgehen (Standbild nur, wenn leer)
  if (!liveFlat || liveFlat.size) for (let i = 0; i < visible.length; i += 4) {
    if (liveFlat && !liveFlat.has(visible[i] + ',' + visible[i + 1])) continue;
    const x = visible[i], y = visible[i + 1], t = flatAt(x, y);
    if (!t || (t.b !== 'schiene' && !isPbTrack(t.b) && wegUnder(t) == null) || (groundCached && cachedPath(t))) continue;
    if (isWegBridge(t) && bridgeArch(x, y)) continue;                   // Bogenbrücken (Block 150): mit den Gebäuden, in Maler-Reihenfolge
    FOG = !ownedTile(x, y);
    if (!(SPRITES_ON && spriteFlat(x, y, visible[i + 2], visible[i + 3], z, t))) {   // weit weg als Bildchen (Block 144: Brücken, leuchtende Wege)
      if (GLPASS) { GL.stats.miss++; glLive(visible[i + 2], visible[i + 3], TW * z, (TH + 60) * z, TW * z, (TH + 70) * z, () => drawFlat(visible[i + 2], visible[i + 3], z, x, y, t)); }
      else drawFlat(visible[i + 2], visible[i + 3], z, x, y, t);
    }
  }
  return visRange;
}
function render(now) {
  const mt0 = MESS ? performance.now() : 0;
  if (GLPASS) { glHook(false); GLPASS = false; GL.frame = false; }         // letztes Bild brach ab (Fehler): Aufzeichnen aus
  g = ctx;
  if (spriteCrops.length) cropSprites(spritePrep ? 4 * CROP_MS : CROP_MS);   // Bildchen vom letzten Bild zuschneiden, bevor hier etwas gemalt wird (mit Zeitgrenze)
  cam = state.cam;
  const z = cam.z;
  const dt = Math.min(0.1, (now - (lastRender || now)) / 1000);
  lastRender = now;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#6fcbe2';
  ctx.fillRect(0, 0, W, H);
  night = nightAt();                                                     // Spieluhr (Block 101)
  glows.length = 0; glowCells.clear(); nightPics.length = 0; nightPanes.length = 0; nightSeen.clear(); nightWarm = false;
  frameNo++;
  if (z !== lastZoom) { lastZoom = z; lastZoomChange = now; }
  SPRITES_ON = spriteForce != null ? spriteForce : z < Math.min(SPRITE_UNTIL, Math.max(SPRITE_FROM, 2.6 / DPR)) && isLive();
  SPRITES_NEAR = SPRITES_ON && z >= SPRITE_FROM;
  if (glFrameOk(z)) { ctx.clearRect(0, 0, W, H); glBegin(); } else glIdle();   // WebGL weit weg (Block 144): Welt auf die Grafikkarte
  const paused = frameNo < spritePause, st = SPRITE_STATS;                 // kein Speicher: nie aufholen/vorbereiten (das malte nur Fehlschläge)
  spriteCatch = !paused && st.miss + st.nmiss >= CATCH_MISS;              // viel fehlte im letzten Bild: aufholen (auch Nachtbilder)
  spritePrep = !paused && st.miss >= PREP_MISS;                           // fast alles fehlte: vorbereiten (nur echte Lücken, mit Hinweis)
  if (spritePrep) prepShown = performance.now();
  spriteStale = st.stale + st.old >= CATCH_MISS && !spriteZooming;       // viele alte Bildchen (andere Stufe/Fassung): zügig erneuern
  const staleLast = st.stale;
  spriteMissLast = st.miss;
  st.miss = 0; st.made = 0; st.stale = 0; st.old = 0; st.nmiss = 0; st.fail = 0;
  spriteZoomedLast = spriteZooming;
  spriteZooming = now - lastZoomChange < 250;
  spriteSwapAll(staleLast, spriteStep(z));                               // scharfe Bildchen alle zugleich einsetzen
  spriteSpent = 0; spriteMade = 0; groundSpent = 0;
  spriteHousekeeping();

  if (GL.frame) glCacheStart(z, now);                                     // Standbild abspielen/aufzeichnen (Block 144); 'rec' vergrößert W/H um den Rand
  const V = worldView(z), { visible, minX, maxX, minY, maxY } = V;

  // 1) Boden, Wege und Schlagschatten (weiter weg alles aus dem Zwischenspeicher)
  const glPlay = GL.frame && GL.cacheMode === 'play';                     // Standbild: Boden, Tiefe kommen gemerkt (Block 144)
  const visRange = worldGround(V, z, now, glPlay);
  if (GL.frame && GL.cacheMode === 'rec') { GLS.gEnd = GL.recs.length; GLS.gl0 = [glows.length, nightPics.length, nightPanes.length, nightWarm]; }   // Boden, Wellen, Tiefe, Brücken/leuchtende Wege: Ende (Block 144), nachts mit ihren Lichtern
  FOG = false;
  if (!groundCached) {
    g.save();
    g.setTransform(DPR * z, 0, 0, DPR * z, (W / 2 - cam.x * z) * DPR, (H / 2 - cam.y * z) * DPR);
    drawShadows(visRange);
    g.restore();
  }

  const mt1 = MESS ? performance.now() : 0;
  // 3) Vorschau-Rahmen (bei großen Gebäuden die ganze Grundfläche)
  let preview = null;
  const outline = (ax, ay, w, h, ok) => {
    const c = [toScreen(ax - 0.5, ay - 0.5), toScreen(ax + w - 0.5, ay - 0.5), toScreen(ax + w - 0.5, ay + h - 0.5), toScreen(ax - 0.5, ay + h - 0.5)];
    g.strokeStyle = ok ? '#3fbf6f' : '#e5484d';
    g.lineWidth = 3 * z;
    g.beginPath(); c.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath(); g.stroke();
    return toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2);
  };
  const objBox = (x, y) => {           // Grundfläche des Objekts unter dem Zeiger
    const a = anchorAt(x, y);
    if (!a) return [x, y, 1, 1];
    const t = state.tiles.get(a), [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t);
    return [ax, ay, w, h];
  };
  const ghostType = tool === 'verschieben' ? movingType() : tool;
  const smallMode = tool === 'verschieben' ? !!moving && moving.kind === 'deco' : !!(ITEMS[tool] && ITEMS[tool].small);
  let groupGhost = null;                                   // mehrere Dinge verschieben: je vorderstem Feld, was dort als Geist steht
  if (plan) preview = planPreview(z);                       // Linie/Rechteck: alle Felder mit Preis
  else if (tool === 'verschieben' && moving && moving.kind === 'group') { if (hover) ({ preview, groupGhost } = groupPreview(z)); }
  else if (hover && tool !== 'look' && (ownedTile(hover.x, hover.y) || (seaTool(tool) && isSea(hover.x, hover.y)))) {
    const hx = hover.x, hy = hover.y;
    const hds = decosAt(hx + ',' + hy);
    const rotOf = b => placeRot(b, hx, hy);
    let box = [hx, hy, 1, 1];
    if (EDGE_TOOLS.has(tool) && hoverVertex) {
      const q = toScreen(hoverVertex.x - 0.5, hoverVertex.y - 0.5);
      g.fillStyle = '#2f9f55'; g.beginPath(); g.arc(q.x, q.y, 4 * z, 0, Math.PI * 2); g.fill();
      preview = { ok: true, text: `${ITEMS[tool].name} · ${styleDef(tool, currentStyle(tool)).name}: Anfang antippen (oder ziehen)`, p: q };
    } else if (tool === 'abriss' && hoverEdge && state.edges.has(hoverEdge)) {
      const e = state.edges.get(hoverEdge);
      edgeMark(hoverEdge, '#e5484d', z, 5);
      const E = edgeEnds(hoverEdge), m = toScreen((E.p[0] + E.q[0]) / 2, (E.p[1] + E.q[1]) / 2);
      preview = { ok: true, text: `${ITEMS[e.b].name} entfernen: +${fmt(ITEMS[e.b].cost)}`, p: m };
    } else if (tool === 'verschieben' && !moving) {
      const has = (hds && hds[hoverSlot]) || anchorAt(hx, hy);
      if (!(hds && hds[hoverSlot])) box = objBox(hx, hy);
      preview = { ok: !!has, text: has ? 'Aufnehmen' : 'Hier ist nichts' };
    } else if (smallMode) {
      const slot = freeSlot(hx, hy, hoverSlot);
      const err = tool === 'verschieben' ? moveError(hx, hy, slot) : smallError(tool, hx, hy, slot);
      const cl = tool === 'verschieben' || slot === VSLOT ? '' : clearLabel(tool, hx, hy);
      preview = { ok: !err, small: !err || err === 'Zu wenig Taler', slot, text: err || (tool === 'verschieben' ? 'Hierhin' : `🌸 +${ITEMS[tool].beauty}${cl ? '  ' + cl : ''}`) };
    } else if (tool === 'verschieben') {
      const err = moveError(hx, hy, hoverSlot), [w, h] = sizeOf(ghostType, rotOf(ghostType), moving.t);
      box = [hx, hy, w, h];
      preview = { ok: !err, ghost: !err || true, text: err || 'Hierhin' };
    } else if (tool === 'abriss' && hds && hds[hoverSlot]) {
      const it = ITEMS[hds[hoverSlot].b];
      preview = { ok: true, text: `${it.name} entfernen: +${fmt(decoBack(hds[hoverSlot]))}` };
    } else if (tool === 'weg' && bAt(hx, hy) === 'weg') {
      const cur = styleDef('weg', objAt(hx, hy).style), nx = styleDef('weg', currentStyle('weg'));
      preview = { ok: cur.id !== nx.id, text: cur.id === nx.id ? nx.name : `Umfärben: ${cur.name} → ${nx.name}` };
    } else if (tool === 'abriss') {
      const info = demolishInfo(hx, hy);
      box = objBox(hx, hy);
      preview = { ok: !info.err, text: info.err || (info.refund != null ? `${info.label}: +${fmt(info.refund)}` : `${info.label}: −${fmt(info.cost)}`) };
    } else {
      const err = placeError(tool, hx, hy);
      const d = ITEMS[tool], [w, h] = sizeOf(tool, rotOf(tool));
      box = [hx, hy, w, h];
      let text = err;
      if (!err) {
        if (d.cat === 'land' || d.ground) text = `${d.name}: −${fmt(costOf(tool, hx, hy).cost)}${tool === 'schuett' && seaDepth(hx, hy) > DEEP_FROM ? ' · tiefes Wasser' : ''}`;
        else if (crossCandidate(tool, hx, hy)) text = '🚧 Bahnübergang';
        else if (tool === 'weg') text = styleDef('weg', currentStyle('weg')).name;
        else if (tool === 'schiene') { const c = costOf(tool, hx, hy); text = `${c === BRIDGE ? 'Brücke' : 'Schiene'}: −${fmt(c.cost)} ${matText(c.mat)}`; }
        else {
          // Die ganze Insel neu rechnen kostet: erst, wenn die Maus kurz auf dem Feld ruht (beim Drüberfahren nur Name/Ort)
          const hk = hx + ',' + hy + tool;
          if (hk !== hoverKey) { hoverKey = hk; hoverSince = now; }
          const ready = now - hoverSince > HOVER_CALM || (previewCache && previewCache.k === hx + ',' + hy && previewCache.b === tool);
          const pv = ready ? previewDelta(tool, hx, hy) : { inc: 0, sci: 0, beauty: 0 }, parts = STOPS.has(tool) ? [placeLabel(hx, hy)] : [];
          if (needsReach(tool) && pv.how === 'weit') parts.push('🐌 weit weg: 50 %');
          if (Math.abs(pv.inc) >= 0.05) parts.push(`${pv.inc > 0 ? '+' : ''}${fmtRate(pv.inc)}/s`);
          if (Math.abs(pv.sci) >= 0.05) parts.push(`💡 +${fmtRate(pv.sci)}`);
          if (pv.prod) for (const [r, v] of Object.entries(pv.prod)) parts.push(`${RES[r].icon} +${fmtRate(v * 60)}/min`);
          if (pv.conv) parts.push(`${RES[d.conv.to].icon} bis ${fmtRate(pv.conv * 60)}/min`);
          if (pv.pow) parts.push(`⚡ +${fmtPow(pv.pow)}`);
          if (pv.site && siteLabel(pv.site)) parts.push(siteLabel(pv.site));                // Standortbonus (Block 53)
          if (pv.beauty) parts.push(`🌸 ${pv.beauty > 0 ? '+' : ''}${pv.beauty}`);
          if (pv.pop) parts.push(`👥 +${pv.pop}`);
          if (pv.bonus) parts.push(`🏘️ +${Math.round(pv.bonus * 100)} %`);
          text = parts.join('  ') || d.name;
        }
        const cl = clearLabel(tool, hx, hy, rotOf(tool));      // Wald/Fels auf dem Bauplatz verschwinden
        if (cl) text += '  ' + cl;
        const wn = replacesWeg(tool) ? pathsUnder(tool, hx, hy, rotOf(tool)).length : 0;   // Gebäude auf dem Weg (Block 58)
        if (wn) text += `  🛤️ ersetzt den Weg +${fmt(wn * ITEMS.weg.cost)}`;
      }
      const onWeg = k => plainWeg(k) && (plazaOk(tool) || replacesWeg(tool));   // Wege darf man über- bzw. ersetzen
      const free = footprint(tool, hx, hy, rotOf(tool)).every(([fx, fy]) => (!COVER.has(fx + ',' + fy) || onWeg(fx + ',' + fy)) && (terrainAt(fx, fy) !== 'water' || tool === 'schiene'));
      preview = { ok: !err, ghost: d.cat !== 'land' && !d.ground && free, text };
    }
    if (!preview.p) preview.p = outline(box[0], box[1], box[2], box[3], preview.ok);   // Zaun & Co. haben ihren Punkt schon
    preview.box = box;
  }
  const ghostFront = preview && preview.ghost ? [preview.box[0] + preview.box[2] - 1, preview.box[1] + preview.box[3] - 1] : null;
  const inGhost = (x, y) => preview && preview.ghost && x >= preview.box[0] && x < preview.box[0] + preview.box[2] && y >= preview.box[1] && y < preview.box[1] + preview.box[3];

  // 4) Objekte, Bewohner, Fahrzeuge (von hinten nach vorn; große Gebäude am vordersten Feld)
  const byTile = new Map(), drawnMovers = new Set();
  const cars4 = trainCars(), boat = expeditionBoat();
  const ships = [boat, cargoShip()].filter(Boolean).concat(shipMovers(now), fishBoats(now), typeof friendBoats === 'function' ? friendBoats() : []);   // Freundesschiffe (Block 105)
  const hallFirst = new Map();                             // je Hauptbahnhof das erste Feld, das im Bild gezeichnet wird
  if (HALL.size) for (let i = 0; i < visible.length; i += 4) { const k = visible[i] + ',' + visible[i + 1], a = HALL.has(k) && COVER.get(k); if (a && !hallFirst.has(a)) hallFirst.set(a, k); }
  for (const m of walkers.concat(strollers, paraders, typeof visitorFigs !== 'undefined' ? visitorFigs : [], typeof meFigs !== 'undefined' ? meFigs : [], cars, cars4, ships, coasterCars(), parkTrainCars(), critters.filter(c => c.id !== 'gluehwurm'))) {   // Besucher (Block 96)   // Glühwürmchen erst über der Nacht
    let k = Math.round(m.px) + ',' + Math.round(m.py);
    if (m.train && HALL.has(k)) k = hallFirst.get(COVER.get(k)) || k;
    if (m.boat) {                                                          // unter einer Brücke: Brückenstück danach noch einmal drüber (Block 107)
      const under = [];
      for (let by = Math.floor(m.py) - 1; by <= Math.ceil(m.py) + 1; by++) for (let bx = Math.floor(m.px) - 1; bx <= Math.ceil(m.px) + 1; bx++)
        if (Math.abs(bx - m.px) < 0.8 && Math.abs(by - m.py) < 0.8 && bx + by >= m.px + m.py - 0.3 && seaCross(bx, by)) under.push(bx + ',' + by);   // was der Rumpf berührt – nicht, was schon hinter ihm liegt
      m.under = under.length ? under : null;
    }   // Zug in der Halle: vor den Dächern und Bahnsteigen zeichnen (auch wenn die Hbf-Ecke nicht im Bild ist)
    if (m.pbtrain) {                                                       // Parkbahn-Wagen kurz vor einer Station: erst mit ihr zeichnen –
      const [rx, ry] = keyXY(k);                                           // sie steht immer hinter dem Gleis und läge sonst über ihm (Block 136f)
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const st = state.tiles.get((rx + dx) + ',' + (ry + dy));
        if (st && st.b === 'pb_station' && Math.abs(m.px - rx - dx) <= 1.1 && Math.abs(m.py - ry - dy) <= 1.1) { k = (rx + dx) + ',' + (ry + dy); break; }
      }
    }
    if (!byTile.has(k)) byTile.set(k, []);
    byTile.get(k).push(m);
  }
  const icons = [];
  for (const tr of trains) if (!tr.powered) { const f = cars4.find(c => c.train === tr); if (f) { const p = toScreen(f.px, f.py); icons.push([p.x + 10 * z, p.y + 4 * z, '⚡']); } }   // Zug ohne Strom
  const labels = [];
  let staleCover = false;
  // Feldschleife in zwei Teilen (Block 144: Standbild-Merker): A = Linien, Gebäude, Dekos, Natur, Geister (ruht, kann gemerkt werden);
  // B = Bewegtes dieses Felds (jedes Bild neu). Im GL-Standbild laufen nur noch B und die A der „lebendigen“ Felder
  const tileA = (x, y, px, py) => {
      const owned = ownedTile(x, y);
      FOG = !owned;
      if (!(SPRITES_ON && spriteEdges(x, y, px, py, z, now))) {   // Hecken, Zäune, Mauern an den hinteren Kanten (Block 41); weit weg als Bildchen
        if (GLPASS && edgeFieldsHas(x, y)) glLive(px, py, (TW * 0.75 + 24) * z, (TH + 120) * z, (TW * 0.75 + 24) * z, (TH * 0.5 + 24) * z, () => drawEdgesAt(x, y, z, now));
        else drawEdgesAt(x, y, z, now);
      }
      const k = x + ',' + y;
      // Belegung veraltet (Objekt weg, ohne recalc)? Dann wie ein leeres Feld zeichnen und danach neu rechnen
      const a0 = COVER.get(k), t = a0 && state.tiles.get(a0), a = t ? a0 : null;
      if (a0 && !t) staleCover = true;
      if (a) {
        const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t), big = w > 1 || h > 1;
        const corner = x === ax + w - 1 && y === ay + h - 1;
        const c = big ? toScreen(ax + (w - 1) / 2, ay + (h - 1) / 2) : { x: px, y: py };
        const drawIt = () => {
          if (t.b === 'schiene' && !t.cross) return;                         // Schienen malen hier nur Bahnübergänge (Gleis liegt im Boden)
          let sc = 1;
          if (t.born) {
            const an = (now - t.born) / 380;
            if (an < 1) { const c1 = 1.70158, c3 = c1 + 1; sc = 0.55 + 0.45 * (1 + c3 * Math.pow(an - 1, 3) + c1 * Math.pow(an - 1, 2)); }
          }
          if (SPRITES_ON && sc === 1 && spriteTileOk(t) && spriteTile(t, ax, ay, c, z, now, w, h)) return;   // weit weg: fertiges Bildchen (nah nur Ruhendes)
          const ds = sc * decoScale(t.b);
          const live = () => {
            g.save(); g.translate(c.x, c.y); g.scale((t.rot & 1) && MIRROR.has(t.b) ? -ds : ds, ds);
            PASS = 'object';
            try { drawObject(t.b, 0, 0, z, now, ax, ay, t.lvl, t); } finally { PASS = null; g.restore(); }   // ein Fehler lässt nichts hängen
          };
          if (!GLPASS) return live();
          const pad = SPRITE_PAD[t.b] || [0, 0], hw = ((w + h) * TW / 4 + 26 + pad[0]) * z * ds;   // Rahmen wie beim Bildchen, oben mehr Luft (Windräder)
          glLive(c.x, c.y, hw, spriteTop(t.b, w, h) * 1.3 * z * ds, hw, ((w + h) * TH / 4 + 12 + pad[1]) * z * ds, live);
        };
        // Große Gebäude in senkrechten Streifen: jede Diagonale (x − y) der Grundfläche wird an ihrem vordersten
        // Feld gezeichnet – so überdecken sie nichts, was seitlich vor ihnen steht (Bäume, Häuser, Bewohner)
        if (big && t.b !== 'weg' && (x === ax + w - 1 || y === ay + h - 1)) {
          const d = x - y, dMin = ax - (ay + h - 1), dMax = ax + w - 1 - ay;
          const mid = (d * TW / 2 - cam.x) * z + W / 2, half = TW / 4 * z;
          const snap = v => Math.round(v * DPR) / DPR;                       // Streifengrenzen auf ganze Bildpunkte – sonst eine haarfeine Fuge
          const left = d === dMin ? -1e5 : snap(mid - half), right = d === dMax ? 1e5 : snap(mid + half);
          if (t.b === 'lm') FOG = false;
          g.save(); g.beginPath(); g.rect(left, -1e5, right - left, 2e5); g.clip();
          try { drawIt(); } finally { g.restore(); }                         // sonst bliebe der Streifen-Ausschnitt für immer
        }
        if (corner) {
          if (t.b === 'lm' && ownedTile(ax, ay)) { FOG = false; labels.push([ax, ay, t.lm]); }
          if (!big) {
            const hasD = state.decos.has(k);                                 // die meisten Felder haben keine Dekos (Block 124)
            if (hasD) drawSmall(k, px, py, z, now, x, y, SLOTS_BACK);
            if (t.b !== 'weg') drawIt();
            else if (t.bridge && bridgeArch(x, y)) drawArchBridge(x, y, px, py, z, t);   // hoher Bogen: wie ein Gebäude (Block 150)
            if (hasD) drawSmall(k, px, py, z, now, x, y, SLOTS_FRONT);
          }
          const s = T.st.get(a);
          if (s && t.b !== 'lm' && !PROBE && needsReach(t.b) && s.how === 'weit') icons.push([c.x, c.y, '🐌']);
          if (s && s.noPower) icons.push([c.x, c.y, '⚡']);
          if (t.b === 'station') { const l = lineOf(a); if (l && l.traffic && l.traffic.served < 0.8) icons.push([c.x, c.y, '😣']); }   // überfüllt
          if (t.b === 'hbf' && [...GLEIS].some(([gk, G]) => { if (G.hub !== a) return false; const l = lineOf(gk); return l && l.traffic && l.traffic.served < 0.8; })) icons.push([c.x, c.y, '😣']);
          if (t.b === 'hafen' && (t.lvl || 1) >= 2 && state.orders.some(o => o.kind === 'sell' && state.res[o.res] >= o.amount)) icons.push([c.x, c.y, '🚢']);   // Auftrag erfüllbar
          if (t.b === 'truhe') icons.push([c.x, c.y, '🎁']);
          if (t.b === 'schloss' && decreeReady()) icons.push([c.x, c.y, '👑']);   // Erlass wartet
          if (s && s.grow && s.grow.ready && canPay(s.grow.next.cost)) icons.push([c.x, c.y, '✨']);   // nur, wenn man es auch bezahlen kann
          if (WONDERS[t.b] && !wonderDone(t) && canPay(wonderCost(t))) icons.push([c.x, c.y, '🏗️']);
          if (s && s.wish && s.wish.next) {
            if (s.wish.ready && canPay(houseCost(s.wish.next))) icons.push([c.x, c.y, '✨']);
            else if (s.wish.met === s.wish.total - 1) icons.push([c.x, c.y, '💭']);
          }
        }
      } else {
        const ter = terrainAt(x, y), hide = inGhost(x, y);
        const gone = hide && tool !== 'verschieben' && ITEMS[ghostType] && willClear(ghostType, ter);   // wird beim Bauen weggeräumt
        if (gone) { /* Vorschau: Natur schon ausblenden */ }
        else if (ter === 'forest' && !(hide && ghostType === 'holz')) tileSprite('forest', x, y, px, py, z);
        else if (ter === 'obst' && !(hide && ghostType === 'obst')) tileSprite('obst', x, y, px, py, z);
        else if (ter === 'rock' && !(hide && ghostType === 'stein')) tileSprite('rock', x, y, px, py, z);
        else if (ter === 'erz' && !(hide && ghostType === 'mine')) tileSprite('erz', x, y, px, py, z);
        else if (ter === 'kristall' && !(hide && ghostType === 'kristallmine')) {
          tileSprite('kristall', x, y, px, py, z);
          glowQuad([[px - 3 * z, py - 14 * z], [px + 3 * z, py - 14 * z], [px + 3 * z, py], [px - 3 * z, py]], 22 * z, 'blue');
        }
        if (state.decos.has(k)) drawSmall(k, px, py, z, now, x, y, SLOTS_ALL);
      }
      if (preview && preview.small && hover.x === x && hover.y === y) {
        const gRot = tool === 'verschieben' ? (ROTATABLE.has(ghostType) ? buildRot : 0) : smallRot(ghostType, preview.slot);   // wie abgelegt wird (actions.js)
        const gCol = tool === 'verschieben' ? moving.d.col || 0 : ghostType === 'busch' ? bushColNew('busch').col || 0 : DECO_LOOKS[baseOf(ghostType)] ? decoLookNew(baseOf(ghostType)).col || 0 : 0;   // wie es gesetzt wird (Block 69)
        const gForm = tool === 'verschieben' ? moving.d.form || 0 : DECO_LOOKS[baseOf(ghostType)] ? decoLookNew(baseOf(ghostType)).form || 0 : 0;
        const [u, v] = slotPos(x, y, preview.slot, { b: ghostType, rot: gRot, form: gForm }), q = [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
        g.globalAlpha = 0.65;
        drawSmallOne(ghostType, gRot, q[0], q[1], z, now, x, y, 1, preview.slot, gCol, gForm);
        g.globalAlpha = 1;
      }
      if (groupGhost && groupGhost.has(k)) {
        g.globalAlpha = 0.65;
        for (const f of groupGhost.get(k)) f();
        g.globalAlpha = 1;
      }
      if (ghostFront && x === ghostFront[0] && y === ghostFront[1]) {
        const [gx, gy, gw, gh] = preview.box, c = toScreen(gx + (gw - 1) / 2, gy + (gh - 1) / 2);
        const rot = placeRot(ghostType, gx, gy);
        g.globalAlpha = 0.65;
        g.save(); g.translate(c.x, c.y);
        const gs = decoScale(ghostType);
        g.scale((rot & 1) && MIRROR.has(ghostType) ? -gs : gs, gs);
        const gt = tool === 'verschieben' ? { ...moving.t, rot } : { rot, style: STYLES[ghostType] ? currentStyle(ghostType) : undefined, ...(ghostType === 'weg' ? wegShapeNew() : {}),
          ...paintNewOf(ghostType), ...(DECO_LOOKS[baseOf(ghostType)] ? decoLookNew(baseOf(ghostType)) : {}), ...(ghostType === 'fz_schloss' ? { cs: csNew() } : {}), ...(ITEMS[ghostType].fl0 ? { fl: ITEMS[ghostType].fl0 } : {}), ...(ghostType === 'hbf' ? HBF_NEW : {}), ...(ghostType === 'station' && stationNewLen === 3 ? { len: 3 } : {}) };   // wie gebaut wird (Block 84d)
        drawObject(ghostType, 0, 0, z, now, gx, gy, gt.lvl || 1, gt);
        g.restore();
        g.globalAlpha = 1;
      }
  };
  const tileB = (x, y, px, py) => {
    const k = x + ',' + y;
      const ms = byTile.get(k);
      if (ms) {
        FOG = false;
        ms.sort((a, b) => (a.px + a.py) - (b.px + b.py));
        for (const m of ms) {
          // Bewohner auf der Bogenbrücke (hintere Rampe und Mitte) erst nach der Brücke zeichnen, sonst verdeckt sie sie
          const ar = m.fur && archAt(m.px, m.py);
          if (ar && ar.b <= 0.5) { if (!archWalkers.has(ar.key)) archWalkers.set(ar.key, []); archWalkers.get(ar.key).push(m); continue; }
          moverLive(m, z, now); drawnMovers.add(m);
          if (m.under) for (const bk of m.under) {                            // Fahrbahn über den Rumpf – das Schiff fährt darunter durch
            if (GLPASS) { const bp = toScreen(...keyXY(bk)); glLive(bp.x, bp.y, TW * 0.8 * z + 4, 70 * z, TW * 0.8 * z + 4, TH * z + 6, () => drawBridgeOver(bk, z, now)); }
            else drawBridgeOver(bk, z, now);
            const [bx, by] = keyXY(bk);                                       // was schon auf der Brücke fuhr (Zug, Bewohner), wieder obenauf (Block 112)
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const o of byTile.get((bx + dx) + ',' + (by + dy)) || [])
              if (o !== m && !o.boat && !o.ship && !o.fish && !o.cargo && drawnMovers.has(o) && Math.abs(o.px - bx) < 1 && Math.abs(o.py - by) < 1) moverLive(o, z, now);
          }
        }
      }
      if (afterMovers.length) { for (const f of afterMovers) { if (GLPASS) glLive(px, py, TW * 1.3 * z, 150 * z, TW * 1.3 * z, 50 * z, f); else f(); } afterMovers.length = 0; }
      if (archWalkers.has(k)) { for (const m of archWalkers.get(k)) moverLive(m, z, now, true); archWalkers.delete(k); }

  };
  const glc = GL.frame ? GL.cacheMode : null, ml0 = MESS ? performance.now() : 0;
  if (glc === 'play') glPlayTiles(z, now, byTile, icons, labels, tileA, tileB);
  else for (let i = 0; i < visible.length; i += 4) {
    const x = visible[i], y = visible[i + 1], px = visible[i + 2], py = visible[i + 3];
    if (glc === 'rec') glRecTile(i >> 2, x, y, icons.length, labels.length, true);
    tileA(x, y, px, py);
    if (glc === 'rec') glRecTile(i >> 2, x, y, icons.length, labels.length, false);
    tileB(x, y, px, py);
  }
  FOG = false;
  archWalkers.clear();
  if (glc === 'rec') glRecOverlay(icons, labels);                        // Symbole auf echte Bildschirmpunkte, ruhende merken
  if (staleCover) recalc();

  const ml1 = MESS ? performance.now() : 0;
  if (MESS) GL.upMs = 0;
  // Nachts im GL-Bild: Ballons & Co. noch während der Aufnahme – sie liegen in 2D obendrauf, ihre Lichter stanzen aber auch die
  // Welt darunter und kommen in die Lichtschicht der Grafikkarte (punchGlow, GL.sky)
  const skyIn = GL.frame && night > 0;
  if (skyIn) { GL.sky = true; try { drawSky(now, z); } finally { GL.sky = false; } }
  if (GL.frame) glEnd();                  // Welt fertig aufgezeichnet: die Grafikkarte zeichnet, alles Weitere obendrauf in 2D (Block 144)
  const ml2 = MESS ? performance.now() : 0;
  if (!skyIn) drawSky(now, z);            // Erfindungen: Ballons, Zeppelin, Seilbahn
  const mt2 = MESS ? performance.now() : 0;

  // 5) Nacht – im GL-Bild hat die Grafikkarte Löcher, Nachtblau und Lichtschicht schon gezeichnet (Block 144); hier nur noch das
  // Nachtblau über das, was obendrauf in 2D kam (Ballons, Zeppelin …: deckend, ohne Löcher)
  if (night > 0) {
    if (GL.nightDone) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(25,35,85,${night})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    else drawNight();
  }
  if (MESS) { const mt3 = performance.now(), a = 0.1; MESS.boden += a * (mt1 - mt0 - MESS.boden); MESS.obj += a * (mt2 - mt1 - MESS.obj); MESS.nacht += a * (mt3 - mt2 - MESS.nacht); if (!GL.nightDone) MESS.lights = glows.length; MESS.miss = SPRITE_STATS.miss; MESS.made = SPRITE_STATS.made;
    MESS.feld += a * (ml1 - ml0 - MESS.feld); MESS.gl += a * (ml2 - ml1 - MESS.gl); MESS.up += a * (GL.upMs - MESS.up); MESS.vor += a * (ml0 - mt1 - MESS.vor);
    MESS.movers = drawnMovers.size; MESS.la = LA.used | 0; }

  drawFireworks(now, z);                  // über der Nacht, damit es leuchtet
  for (const c of critters) if (c.id === 'gluehwurm') drawCritter(c, z, now);   // leuchten über der Nacht

  // Symbole (✨ bereit, 💭 fast geschafft, 🐌 weit weg) über der Nacht, damit man sie immer sieht
  for (const s of fallenStars) drawFallenStar(s, z, now);
  if (!(SHOWCASE && SHOWCASE.quiet)) for (const [px, py, icon] of icons) drawStatusIcon(px, py, z, icon, now);   // Testwelt „farben“: ohne 🐌 ✨
  drawShowcaseLabels(z);                                                   // Testwelt „tiere“: Namensschilder
  loadingUpdate();                                                       // Ladekreisel: Start, Besuch, „Insel wird gezeichnet …“ (Block 142)

  // 6) Schilder: Sehenswürdigkeiten und „Zu verkaufen“ (antippbar: pillHits)
  pillHits.length = 0;
  for (const [x, y, type] of labels) {
    const [w, h] = sizeOf('lm', 0), p = toScreen(x + (w - 1) / 2, y + (h - 1) / 2), L = LANDMARKS[type], st = lmStage(type);
    const ready = ownedTile(x, y) && st < 3 && !restoreInfo(type).err;
    const lanterns = '🏮'.repeat(st) + '·'.repeat(3 - st);
    const r = pill(`${L.icon} ${L.name} ${lanterns}${ready ? ' ✨' : ''}`, p.x, p.y - (LM_LABEL_H[type] || 80) * z, st >= 3 ? '#eaffea' : ready ? '#fff3b0' : '#fffaf0',
      st >= 3 ? '#2f7f36' : '#6b4f3a', Math.max(11, 11 * z));
    pillHits.push({ ...r, look: true, open: () => openLandmark(x, y) });
  }
  // Schilder der Themen-Inseln, die noch gesperrt sind (die nächste hervorgehoben)
  const nxt = nextIsle();
  for (const i of ISLES) {
    if (isleOpen(i.id)) continue;
    // über der Sehenswürdigkeit schweben (wie deren Schild), nicht an einem Pfahl mitten im Berg
    const pos = lmTile(i.lm), p = pos ? toScreen(pos[0] + 1, pos[1] + 1) : toScreen(i.cx, i.cy);
    const ly = p.y - (LM_LABEL_H[i.lm] || 80) * z;
    if (p.x < -150 || p.x > W + 150 || ly < -100 || ly > H + 150) continue;
    const isNext = i === nxt, sz = Math.max(11, 12 * z);
    const away = isNext && state.expedition && state.expedition.isle === i.id;
    const r = pill(`${i.icon} ${i.name} ${away ? '· ⛵ ' + fmtClock(expeditionLeft()) : isNext ? '· entdecken' : '🔒'}`, p.x, ly, isNext ? '#fff3b0' : '#fffaf0', isNext ? '#6b4f3a' : '#8a6a4f', sz);
    pillHits.push({ ...r, open: (sx, sy) => openIsle(i.id, sx, sy) });
  }

  // Ferne Insel im Nebel (die nächste): Schild über der Mitte
  for (const i of FAR) {
    if (isleOpen(i.id)) continue;
    const p = toScreen(i.cx, i.cy), ly = p.y - 40 * z;
    if (p.x < -150 || p.x > W + 150 || ly < -100 || ly > H + 150) continue;
    const away = state.expedition && state.expedition.isle === i.id;
    const r = pill(`🌫️ ${i.icon} ${i.name} ${away ? '· ⛵ ' + fmtClock(expeditionLeft()) : '· entdecken'}`, p.x, ly, '#fff3b0', '#6b4f3a', Math.max(11, 12 * z));
    pillHits.push({ ...r, open: (sx, sy) => openIsle(i.id, sx, sy) });
  }

  drawSparkles(now, z);

  drawBubble(z);                                                          // Sprechblase (Block 55)

  // 7) Schwebende Zahlen
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i], a = (now - f.t0) / 1500;
    if (a >= 1) { floats.splice(i, 1); continue; }
    const p = toScreen(f.x, f.y);
    g.globalAlpha = a < 0.8 ? 1 : (1 - a) / 0.2;
    g.font = `900 ${Math.max(12, 12 * z)}px Nunito, system-ui, sans-serif`;
    g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#fffaf0'; g.lineJoin = 'round';
    const fy = p.y - 30 * z - a * 26 * z;
    g.fillStyle = f.color; centerText(f.text, p.x, fy, true);
    g.globalAlpha = 1;
  }

  // 8) Vorschau-Text
  if (preview) pill(preview.text, preview.p.x, preview.p.y - 44 * z, preview.ok ? '#eaffea' : '#ffe9e7',
    preview.ok ? '#2f7f36' : '#c0392b', 13, true);

  // 9) Konfetti
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.vy += 500 * dt; c.vx *= 0.99; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.life -= dt;
    if (c.life <= 0 || c.y > H + 20) { confetti.splice(i, 1); continue; }
    g.save(); g.translate(c.x, c.y); g.rotate(c.r);
    g.fillStyle = c.col; g.fillRect(-4, -2.5, 8, 5);
    g.restore();
  }
  // 10) Nächstes Standbild im Hintergrund weiter vorbereiten (Block 144): ein paar ms Felder, danach wird nur umgeschaltet
  if (glc === 'play' && GLB.st === 'run') glBgStep(z, now, tileA, icons, labels);
  else if (glc === 'play' && GLP.st === 'run' && now - GLP.movedAt > 300) { glBgStep(z, now, tileA, icons, labels, GLP); glPreAfter(); }   // Vorladen: nur in Ruhe, das Hintergrund-Standbild geht vor
}

// Glitzern, wenn ein Haus wächst
const sparkles = [];
function sparkle(x, y) {
  const t0 = performance.now();
  for (let i = 0; i < 16; i++) sparkles.push({ x, y, t0, a: i / 16 * Math.PI * 2, r: 0.4 + Math.random() * 0.5, col: ['#ffd23f', '#ffffff', '#f2a7c0', '#a7d8c9'][i % 4] });
}
function drawSparkles(now, z) {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i], a = (now - s.t0) / 1400;
    if (a >= 1) { sparkles.splice(i, 1); continue; }
    const p = toScreen(s.x + Math.cos(s.a) * s.r * a, s.y + Math.sin(s.a) * s.r * a);
    const y = p.y - 20 * z - a * 30 * z, r = (1 - a) * 4 * z;
    g.globalAlpha = 1 - a;
    g.fillStyle = s.col;
    g.beginPath();
    g.moveTo(p.x, y - r * 1.6); g.lineTo(p.x + r * 0.4, y - r * 0.4); g.lineTo(p.x + r * 1.6, y); g.lineTo(p.x + r * 0.4, y + r * 0.4);
    g.lineTo(p.x, y + r * 1.6); g.lineTo(p.x - r * 0.4, y + r * 0.4); g.lineTo(p.x - r * 1.6, y); g.lineTo(p.x - r * 0.4, y - r * 0.4);
    g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
}

function addFloat(x, y, text, color) {
  if (BATCH) return;                                    // viele auf einmal: runPlan zeigt die Summe
  if (floats.length > 60) floats.shift();
  floats.push({ x, y, text, color, t0: performance.now() });
}

function confettiBurst() {
  const cols = ['#f2b53a', '#e8705f', '#5f8fe8', '#58b36a', '#b07ad6', '#f28cb1'];
  for (let i = 0; i < 160; i++) {
    confetti.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 200,
      vy: Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, col: cols[i % cols.length], life: 5 });
  }
}

// ---------------------------------------------------------------------------
// Himmel: Erfindungen (Heißluftballons, Zeppelin, Seilbahn-Gondeln) und das Feuerwerk über dem Rathaus
// ---------------------------------------------------------------------------
let skyCache = { v: -1, center: null, cables: [] };
function skyInfo() {
  if (skyCache.v === groundVersion) return skyCache;
  let center = null;
  for (const [k, t] of state.tiles) if (t.b === 'rathaus' && !center) { const [x, y] = keyXY(k); center = [x + 0.5, y + 0.5]; }
  const cables = cablePairs().map(([a, b, d]) => [keyXY(a), keyXY(b), d]);          // Paare wie im Verkehr (rules.js)
  skyCache = { v: groundVersion, center: center || [ISLAND.cx, ISLAND.cy], cables };
  return skyCache;
}
const SEIL_H = 30;
const BALLOONS = [
  { r: 7, sp: 1 / 52000, ph: 0, h: 150, col: ['#e8604f', '#ffd36e'] }, { r: 11, sp: -1 / 70000, ph: 2, h: 195, col: ['#6f8fd8', '#ffffff'] },
  { r: 5, sp: 1 / 45000, ph: 4, h: 120, col: ['#58b36a', '#f7c6d8'] }, { r: 14, sp: 1 / 90000, ph: 5.3, h: 230, col: ['#b07ad6', '#ffd36e'] },
];
function drawBalloon(b, cx, cy, z, now) {
  const a = b.ph + now * b.sp * Math.PI * 2, p = toScreen(cx + Math.cos(a) * b.r, cy + Math.sin(a) * b.r * 0.8);
  const x = p.x, y = p.y - b.h * z + Math.sin(now / 1300 + b.ph) * 4 * z, R = 13 * z;
  if (x < -60 || x > W + 60 || y < -80 || y > H + 60) return;
  ellipse(p.x, p.y, 7 * z, 3 * z, 'rgba(40,60,20,0.08)');                    // Schatten weit unten
  poly([[x - R * 0.72, y + R * 0.7], [x + R * 0.72, y + R * 0.7], [x + R * 0.26, y + R * 1.38], [x - R * 0.26, y + R * 1.38]], C(shade(b.col[0], -0.12)));
  ellipse(x, y, R, R * 1.1, C(b.col[0]));
  ellipse(x, y, R * 0.42, R * 1.1, C(b.col[1]));
  ellipse(x - R * 0.35, y - R * 0.45, R * 0.22, R * 0.3, 'rgba(255,255,255,0.35)');
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.7 * z; g.beginPath();
  g.moveTo(x - R * 0.26, y + R * 1.38); g.lineTo(x - R * 0.2, y + R * 1.75); g.moveTo(x + R * 0.26, y + R * 1.38); g.lineTo(x + R * 0.2, y + R * 1.75); g.stroke();
  poly([[x - R * 0.24, y + R * 1.75], [x + R * 0.24, y + R * 1.75], [x + R * 0.2, y + R * 2.05], [x - R * 0.2, y + R * 2.05]], C('#a57645'));
  if (night > 0.15 && isLive()) {                                             // Brenner leuchtet
    const f = 1 + Math.sin(now / 90 + b.ph) * 0.2;
    ellipse(x, y + R * 1.5, 2 * z * f, 3 * z * f, '#ffb347');
    glowQuad([[x - 2, y + R * 1.3], [x + 2, y + R * 1.3], [x + 2, y + R * 1.7], [x - 2, y + R * 1.7]], 30 * z);
  }
}
function drawZeppelin(cx, cy, z, now) {
  const a = now / 150000 * Math.PI * 2, wx = cx + Math.cos(a) * 20, wy = cy + Math.sin(a) * 16;
  const p = toScreen(wx, wy), q = toScreen(cx + Math.cos(a + 0.01) * 20, cy + Math.sin(a + 0.01) * 16), dir = q.x >= p.x ? 1 : -1;
  const x = p.x, y = p.y - 270 * z + Math.sin(now / 2000) * 5 * z, L = 34 * z, R = 10 * z;
  if (x < -120 || x > W + 120 || y < -60 || y > H + 60) return;
  ellipse(p.x, p.y, 20 * z, 6 * z, 'rgba(40,60,20,0.07)');
  for (const s of [-1, 1]) poly([[x - dir * L * 0.8, y], [x - dir * L * 1.05, y + s * R * 1.1], [x - dir * L * 0.95, y + s * R * 1.15], [x - dir * L * 0.62, y + s * R * 0.2]], C('#c9c2b4'));   // Leitwerk
  ellipse(x, y, L, R, C('#efe9dc'));
  g.save(); g.beginPath(); g.ellipse(x, y, L, R, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = C(state.town.color); g.fillRect(x - L * 0.18, y - R, L * 0.36, R * 2);            // Band in Flaggenfarbe
  g.restore();
  ellipse(x - dir * L * 0.3, y - R * 0.45, L * 0.45, R * 0.28, 'rgba(255,255,255,0.35)');
  poly([[x - L * 0.22, y + R * 0.9], [x + L * 0.22, y + R * 0.9], [x + L * 0.16, y + R * 1.45], [x - L * 0.16, y + R * 1.45]], C('#8a6440'));   // Gondel
  const lit = night > 0.15 && isLive();
  for (let i = 0; i < 3; i++) circle(x - L * 0.12 + i * L * 0.12, y + R * 1.18, 1.2 * z, lit ? '#ffd873' : C('#bfe3ff'));
  if (lit) glowQuad([[x - L * 0.2, y + R], [x + L * 0.2, y + R], [x + L * 0.2, y + R * 1.4], [x - L * 0.2, y + R * 1.4]], 24 * z);
  g.font = `${9 * z}px system-ui, sans-serif`; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  centerText(state.town.symbol, x, y + 0.5 * z);
}
function drawCables(cables, z, now) {
  for (const [a, b, d] of cables) {
    const pa = toScreen(a[0], a[1]), pb = toScreen(b[0], b[1]);
    const A = [pa.x, pa.y - SEIL_H * z], B = [pb.x, pb.y - SEIL_H * z], M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + d * 1.2 * z];   // leicht durchhängend
    const at = t => [(1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * M[0] + t * t * B[0], (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * M[1] + t * t * B[1]];
    g.strokeStyle = C('#4f545e'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(...A); g.quadraticCurveTo(...M, ...B); g.stroke();
    const f = (Math.sin(now / (900 * d / 4 + 1500)) + 1) / 2;
    [[f, '#e8604f'], [1 - f, '#6f8fd8']].forEach(([t, col]) => {
      const [gx, gy] = at(0.06 + t * 0.88);
      g.strokeStyle = C('#4f545e'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 4 * z); g.stroke();
      poly([[gx - 4 * z, gy + 4 * z], [gx + 4 * z, gy + 4 * z], [gx + 3.4 * z, gy + 11 * z], [gx - 3.4 * z, gy + 11 * z]], C(col));
      poly([[gx - 2.8 * z, gy + 5.5 * z], [gx + 2.8 * z, gy + 5.5 * z], [gx + 2.5 * z, gy + 8 * z], [gx - 2.5 * z, gy + 8 * z]], night > 0.15 && isLive() ? '#ffd873' : C('#e6f4ff'));
    });
  }
}
// Ballons & Zeppelin abschaltbar (Nutzer, 08.10.2026) – je Gerät wie die Bildrate; die Seilbahn bleibt (gehört zum Verkehr)
const SKY_KEY = 'kachelhausen_himmel';
let skyShow = (() => { try { return localStorage.getItem(SKY_KEY) !== '0'; } catch (e) { return true; } })();
function setSkyShow(on) {
  skyShow = !!on;
  try { localStorage.setItem(SKY_KEY, on ? '1' : '0'); } catch (e) { /* privates Fenster: gilt bis zum Neuladen */ }
}
function drawSky(now, z) {
  const inv = state.inventions;
  if (!inv || !inv.size) return;
  const { center: [cx, cy], cables } = skyInfo();
  if (cables.length) drawCables(cables, z, now);
  if (!skyShow) return;
  if (inv.has('ballon')) for (const b of BALLOONS) drawBalloon(b, cx, cy, z, now);
  if (inv.has('zeppelin')) drawZeppelin(cx, cy, z, now);
}
// Feuerwerk: ein paar Dutzend Raketen über dem Rathaus, jede steigt auf und zerplatzt in bunten Funken
let fireworksUntil = 0, lastFire = 0;
const bursts = [];
let fireworksAt = null;                                               // Parade (Block 60d): über dem Freizeitpark statt über dem Rathaus
function startFireworks(at = null, quiet = false) { fireworksAt = at; fireworksUntil = performance.now() + 22000; if (!quiet) { sfx('star'); toast('🎆 Feuerwerk!'); } }
const FIRE_COLS = ['#ff6b8a', '#ffd36e', '#8fe3ff', '#b6ff9e', '#d9a8ff', '#ffffff', '#ff9f5a'];
function drawFireworks(now, z) {
  if (now < fireworksUntil && now - lastFire > 350 + Math.random() * 500) {
    lastFire = now;
    const [cx, cy] = fireworksAt || skyInfo().center;
    bursts.push({ x: cx + (Math.random() - 0.5) * 10, y: cy + (Math.random() - 0.5) * 10, h: 150 + Math.random() * 130, t0: now,
      col: FIRE_COLS[Math.floor(Math.random() * FIRE_COLS.length)], col2: FIRE_COLS[Math.floor(Math.random() * FIRE_COLS.length)], n: 28 + Math.floor(Math.random() * 16), R: 60 + Math.random() * 50 });
  }
  if (!bursts.length) return;
  g.save();
  if (night > 0.15) g.globalCompositeOperation = 'lighter';
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i], age = (now - b.t0) / 2200;
    if (age >= 1) { bursts.splice(i, 1); continue; }
    const p = toScreen(b.x, b.y), top = p.y - b.h * z;
    if (age < 0.28) {                                                          // Rakete steigt
      const k = age / 0.28, ry = p.y - (b.h * z) * k;
      circle(p.x, ry, 1.6 * z, '#fff3b0');
      g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(p.x, ry); g.lineTo(p.x, ry + 10 * z); g.stroke();
      continue;
    }
    const k = (age - 0.28) / 0.72, ease = 1 - Math.pow(1 - k, 3), fall = k * k * 26 * z;
    if (k < 0.15) { g.globalAlpha = (0.15 - k) / 0.15 * 0.5; circle(p.x, top, b.R * 0.5 * z, b.col); }   // Aufblitzen
    g.globalAlpha = Math.max(0, 1 - k);
    for (let j = 0; j < b.n; j++) {
      const an = j / b.n * Math.PI * 2, r = ease * b.R * z, px = p.x + Math.cos(an) * r, py = top + Math.sin(an) * r * 0.85 + fall;
      circle(px, py, (2.6 - k * 1.8) * z + 0.5, j % 2 ? b.col : b.col2);
      const r2 = r * 0.82;                                                    // kurzer Schweif nach innen
      circle(p.x + Math.cos(an) * r2, top + Math.sin(an) * r2 * 0.85 + fall * 0.9, (1.4 - k) * z + 0.3, j % 2 ? b.col : b.col2);
    }
    g.globalAlpha = 1;
  }
  g.restore();
}
