'use strict';
// ---------------------------------------------------------------------------
// Spielstand
// ---------------------------------------------------------------------------
let state;
const terrainCache = new Map();
const sandCache = new Map();
const landCache = new Map();

function iso(x, y) { return { x: (x - y) * TW / 2, y: (x + y) * TH / 2 }; }
function keyXY(k) { const i = k.indexOf(','); return [+k.slice(0, i), +k.slice(i + 1)]; }

function newState() {
  const c = iso(ISLAND.cx, ISLAND.cy);
  return {
    seed: Math.floor(Math.random() * 1e9),
    money: 300, science: 0, res: newRes(),
    restore: {},               // Wahrzeichen → restaurierte Stufe (0–3)
    diary: ['start'],          // freigeschaltete Tagebuchseiten ('start', 'baum:1', …, 'finale')
    diarySeen: 0,              // so viele Seiten hat man schon gelesen
    tutorial: 0,               // Schritt der Einführung, -1 = fertig/übersprungen
    legacy: new Set(),         // früher per Stern/Forschung Freigeschaltetes bleibt frei
    festival: false,
    town: { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(['0,0']),
    tiles: new Map(),
    terra: new Map(),
    techs: new Set(),
    decos: new Map(),          // kleine Dekos: Feld → [4 Ecken] mit { b, rot } oder null
    cam: { x: c.x, y: c.y, z: 1.4 },
    last: Date.now(),
    muted: false,
  };
}

// Spielstand als einfaches Objekt (für localStorage und Export)
function tileOut(t) {
  const o = { b: t.b, lvl: t.lvl };
  if (t.wall != null) o.wall = t.wall;
  if (t.roof != null) o.roof = t.roof;
  if (t.lm) o.lm = t.lm;
  if (t.rot) o.rot = t.rot;
  if (t.style) o.style = t.style;
  if (t.animal) { o.animal = t.animal; o.name = t.name; }
  if (t.stage != null) o.stage = t.stage;
  if (t.look) o.look = t.look;
  return o;
}
function serialize() {
  const tiles = [];
  for (const [k, t] of state.tiles) tiles.push([k, tileOut(t)]);
  // was man gerade trägt, wird an seinem alten Platz gespeichert
  if (typeof moving !== 'undefined' && moving && moving.kind === 'tile') tiles.push([moving.from, tileOut(moving.t)]);
  const decoMap = new Map([...state.decos].map(([k, ds]) => [k, ds.slice()]));
  if (typeof moving !== 'undefined' && moving && moving.kind === 'deco') {
    const [k, slot] = moving.from;
    if (!decoMap.has(k)) decoMap.set(k, [null, null, null, null]);
    decoMap.get(k)[slot] = moving.d;
  }
  const decos = [...decoMap].map(([k, ds]) => [k, ds.map(d => d && { b: d.b, rot: d.rot || 0 })]);
  return {
    game: 'kachelhausen', v: 6, seed: state.seed, money: state.money, res: state.res, science: state.science,
    restore: state.restore, diary: state.diary, diarySeen: state.diarySeen, tutorial: state.tutorial, legacy: [...state.legacy], festival: state.festival,
    town: state.town, owned: [...state.owned], tiles, terra: [...state.terra], techs: [...state.techs],
    decos, cam: state.cam, last: state.last, muted: state.muted,
  };
}

function save() {
  if (!state || PROBE) return;
  if (!document.hidden) state.last = Date.now();   // im Hintergrund zählt die Abwesenheit weiter
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(serialize()));
  } catch (e) { /* Speicher voll oder gesperrt: Spiel läuft trotzdem weiter */ }
}

// Gespeicherten Stand prüfen und auf den aktuellen Stand bringen (wirft bei Unsinn)
function parseSave(d) {
  if (!d || typeof d !== 'object' || typeof d.seed !== 'number' || !Array.isArray(d.tiles) || !Array.isArray(d.owned)) {
    throw new Error('Das ist kein Kachelhausen-Spielstand.');
  }
  // 28.09.2026: Straßen, Gartenwege und Pflaster werden zu Wegen; Gehwege an Kanten entfallen
  const ROAD_TO = { sand: 'sand', asphalt: 'asphalt', kopf: 'kopf', klinker: 'klinker' };
  const WEG_TO = { mulch: 'mulch', kies: 'kies', tritt: 'tritt', steg: 'holz', blueten: 'blueten' };
  const PAVE_TO = { kopf: 'kopf', terrakotta: 'terrakotta', schach: 'schach', fisch: 'fisch', mosaik: 'mosaik', alt: 'platten' };
  for (const [, t] of d.tiles) {
    if (t.b === 'strasse') { t.b = 'weg'; t.style = ROAD_TO[t.style] || 'asphalt'; }
    else if (t.b === 'weg' && !STYLES.weg.some(st => st.id === t.style)) t.style = WEG_TO[t.style] || 'kies';
  }
  // v4 (28.09.2026): Drehung in 4 Richtungen. Lange Gebäude sind jetzt „1 tief, 2 breit“ (Tür an der Längsseite):
  // die alte Drehung um eins versetzen, damit Grundfläche und Tür bleiben, wo sie waren.
  if ((d.v || 3) < 4) {
    for (const [, t] of d.tiles) if (LONG_FRONT.has(t.b)) t.rot = (t.rot || 0) ^ 1;
  }
  // 29.09.2026: Gebäude haben höchstens 3 Stufen – was darüber per Taler ausgebaut war, gibt es zurück
  for (const [, t] of d.tiles) {
    if (!BUILD_STAGES[t.b] || !(t.lvl > MAX_LVL)) continue;
    for (let l = MAX_LVL; l < t.lvl; l++) d.money = (+d.money || 0) + Math.round(ITEMS[t.b].cost * Math.pow(1.8, l));
    t.lvl = MAX_LVL;
  }
  const taken = new Set(d.tiles.map(([k]) => k));
  for (const w of d.paved || []) {
    const [k, st] = typeof w === 'string' ? [w, 'alt'] : w;
    if (!taken.has(k)) { d.tiles.push([k, { b: 'weg', lvl: 1, style: PAVE_TO[st] || 'platten' }]); taken.add(k); }
  }
  // Strom (27.09.) und Busse/Bahnhöfe (28.09.) wurden entfernt: Kosten erstatten
  const REFUND = { kraftwerk: 500, solar: 350, bus: 120, bahnhof: 900 };
  const SCI_REFUND = { wind: 30, solar: 120, bus: 25, bus2: 70, zug: 160 };
  d.tiles = d.tiles.filter(([, t]) => {
    if (t.b in REFUND) { d.money += REFUND[t.b]; return false; }
    return t.b in ITEMS;
  });
  d.techs = (d.techs || []).filter(id => { if (id in SCI_REFUND) { d.science = (d.science || 0) + SCI_REFUND[id]; return false; } return true; });
  return {
    seed: d.seed, money: +d.money || 0, res: { ...newRes(), ...(d.res || {}) }, science: d.science || 0,
    restore: d.restore || {}, diary: d.diary || ['start'], diarySeen: d.diarySeen || 0, festival: !!d.festival,
    // Spielstände von vor den Laternen: Einführung überspringen, Sterne-Freischaltungen behalten
    tutorial: d.tutorial != null ? d.tutorial : -1,
    legacy: new Set(d.legacy || legacyUnlocks(d)),
    oldSave: !d.restore,
    fitLm: (d.v || 3) < 6,          // Sehenswürdigkeiten sind seit v6 3×3 groß (v5: 2×2): einmal passend rücken
    town: d.town || { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(d.owned), tiles: new Map(d.tiles), terra: new Map(d.terra || []), techs: new Set(d.techs),
    decos: new Map(d.decos || []),
    cam: d.cam || newState().cam, last: d.last || Date.now(), muted: !!d.muted,
  };
}

const LONG_FRONT = new Set(['saege', 'baecker', 'fabrik', 'bibliothek', 'kunst']);

// Was man in alten Ständen per Stern oder Forschung schon freigeschaltet hatte
function legacyUnlocks(d) {
  if (d.restore) return [];
  const out = [], stars = d.stars || 0, techs = new Set(d.techs || []);
  if (stars >= 1) out.push('schule', 'weg:platten', 'weg:asphalt');
  if (stars >= 2) out.push('baecker');
  if (techs.has('bibliothek')) out.push('bibliothek');
  if (techs.has('kunst')) out.push('kunst', 'weg:blueten');
  if (techs.has('garten')) out.push('brunnen');
  if (techs.has('pflasterkunst')) out.push('weg:kopf');
  // Gebäude, die schon stehen, dürfen auch weiter gebaut werden
  for (const [, t] of d.tiles || []) if (['saege', 'steinmetz', 'schmiede', 'obst', 'mine', 'park', 'windrad'].includes(t.b)) out.push(t.b);
  return [...new Set(out)];
}

// Unlesbare Stände nie überschreiben: Kopie aufbewahren und beim Start Bescheid sagen
let loadFailure = null;
function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return parseSave(JSON.parse(raw));
  } catch (e) {
    const backup = SAVE_KEY + '_defekt_' + Date.now();
    try { localStorage.setItem(backup, raw); loadFailure = backup; } catch (err) { loadFailure = 'nicht gesichert'; }
    return null;
  }
}

// Einen anderen Stand übernehmen (Import): Zwischenspeicher leeren, alles neu zeichnen
function adoptState(s) {
  state = s;
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  walkers.length = 0; cars.length = 0;
  normalizeSmall();
  fitFootprints();
  delete state.fitLm;
  nameHouses();
  recalc();
  buildToolbar();
  save();
}

// Export als Datei (landet auf dem iPad in „Dateien“)
function exportSave() {
  save();
  const blob = new Blob([JSON.stringify(serialize())], { type: 'application/json' });
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  const name = (state.town.name || 'insel').replace(/[^\wäöüÄÖÜß-]+/g, '-');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kachelhausen-${name}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
