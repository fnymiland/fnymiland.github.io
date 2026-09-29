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
    design: new Set(),         // in der Kunstakademie gekauft: 'wall:4', 'roof:7', 'weg:mulch', 'laterne' …
    festival: false,
    town: { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(['0,0']),   // Grundstücke (6×6) der erschlossenen Inseln
    islands: new Set(['home']),
    claimed: new Set(),        // einzelne Meerfelder, die man sich per Aufschütten oder Brücke genommen hat
    tipsSeen: new Set(),       // gezeigte Tipps (GUIDE)
    mastery: {},               // Stufen-Forschung: id → Stufe
    inventions: new Set(),     // Erfindungen (für Ideen)
    orders: [], orderNext: 0,  // Aufträge der Frachter am Handelshafen (Block 24), nächster ab orderNext
    vehicles: new Set(),       // erforschte Verkehrsmittel: 'zug:regio', 'schiff:dampfer' … (Forschung „Verkehr“)
    expedition: null,          // Boot unterwegs: { isle, from: Steg-Feld, t0, until } (echte Zeit, läuft auch geschlossen weiter)
    far: [],                   // ferne Inseln (nach dem Laternenfest, Block 27c): { id, n, name, icon, ter, cx, cy, r, need, chest, res }
    stats: { earned: 0 },      // für Erfolge: insgesamt verdiente Taler
    achieved: {},              // Erfolge: id → erreichte Stufen (⭐)
    album: new Set(),          // Sammelalbum: gesammelte Einträge ('b:haus', 'hs:3', 'wall:2', 'tier:katze' …)
    tipsOff: false,
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
  if (t.bridge) o.bridge = true;
  if (t.phase != null) { o.phase = t.phase; if (t.rate != null) o.rate = t.rate; if (t.paid) o.paid = t.paid; }
  if (t.train) { o.train = t.train; o.trainCol = t.trainCol || 0; if (t.trainPlus) o.trainPlus = t.trainPlus; }
  if (t.extra) o.extra = t.extra.map(e => ({ model: e.model, col: e.col, ...(e.plus ? { plus: e.plus } : {}) }));
  if (t.ships && t.ships.length) o.ships = t.ships.map(s => ({ model: s.model, to: s.to }));   // Schiffe am Hafen
  if (t.isle) o.isle = t.isle;                                                         // Truhe: von welcher fernen Insel
  if (t.cross) { o.cross = true; if (t.foot) o.foot = true; if (t.footPaid) o.footPaid = t.footPaid; }
  return o;
}
function serialize() {
  const tiles = [];
  for (const [k, t] of state.tiles) tiles.push([k, tileOut(t)]);
  // was man gerade trägt, wird an seinem alten Platz gespeichert
  const held = typeof moving !== 'undefined' ? carried() : [];     // auch eine ganze Gruppe
  for (const it of held) if (it.kind === 'tile') tiles.push([it.from, tileOut(it.t)]);
  const decoMap = new Map([...state.decos].map(([k, ds]) => [k, ds.slice()]));
  for (const it of held) {
    if (it.kind !== 'deco') continue;
    const [k, slot] = it.from;
    if (!decoMap.has(k)) decoMap.set(k, [null, null, null, null]);
    decoMap.get(k)[slot] = it.d;
  }
  const decos = [...decoMap].map(([k, ds]) => [k, ds.map(d => d && { b: d.b, rot: d.rot || 0 })]);
  return {
    game: 'kachelhausen', v: 11, seed: state.seed, money: state.money, res: state.res, science: state.science,
    restore: state.restore, diary: state.diary, diarySeen: state.diarySeen, tutorial: state.tutorial, legacy: [...state.legacy], festival: state.festival,
    design: [...state.design],
    town: state.town, owned: [...state.owned], islands: [...state.islands], claimed: [...state.claimed], tipsSeen: [...state.tipsSeen], tipsOff: state.tipsOff, mastery: state.mastery, inventions: [...state.inventions], vehicles: [...state.vehicles], far: state.far.map(({ far, ...f }) => f), orders: state.orders, orderNext: state.orderNext, expedition: state.expedition, stats: state.stats, achieved: state.achieved, album: [...state.album], tiles, terra: [...state.terra], techs: [...state.techs],
    decos, cam: state.cam, last: state.last, muted: state.muted,
  };
}

// Viele Felder auf einmal (Linie, Rechteck): rechnen, speichern und Töne erst am Ende, einmal
let BATCH = 0;
function batch(fn) {
  BATCH++;
  try { return fn(); } finally { BATCH--; if (!BATCH) { recalc(); save(); } }
}
function save() {
  if (!state || PROBE || BATCH) return;
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
  const WEG_TO = { mulch: 'mulch', kies: 'sand', tritt: 'tritt', steg: 'sand', holz: 'sand', blueten: 'blueten', pastell: 'konfetti', mosaik: 'konfetti', schach: 'platten' };
  const PAVE_TO = { kopf: 'kopf', terrakotta: 'terrakotta', schach: 'platten', fisch: 'fisch', mosaik: 'konfetti', alt: 'platten' };
  for (const [, t] of d.tiles) {
    if (t.b === 'strasse') { t.b = 'weg'; t.style = ROAD_TO[t.style] || 'asphalt'; }
    else if ((t.b === 'weg' || t.cross) && t.style && !STYLES.weg.some(st => st.id === t.style)) t.style = WEG_TO[t.style] || 'sand';
  }
  // v4 (28.09.2026): Drehung in 4 Richtungen. Lange Gebäude sind jetzt „1 tief, 2 breit“ (Tür an der Längsseite):
  // die alte Drehung um eins versetzen, damit Grundfläche und Tür bleiben, wo sie waren.
  if ((d.v || 3) < 4) {
    for (const [, t] of d.tiles) if (LONG_FRONT.has(t.b)) t.rot = (t.rot || 0) ^ 1;
  }
  // v11 (29.09.): Zugmodelle werden erforscht (Reiter „Verkehr“). Was schon fährt, bleibt erforscht; Bahnhöfe ohne
  // Modell fuhren bisher Regionalbahn (neue Linien starten jetzt mit der Straßenbahn).
  const grandfathered = [];
  if ((d.v || 3) < 11) for (const [, t] of d.tiles) {
    if (t.b !== 'station') continue;
    if (!t.train) { t.train = 'regio'; t.trainCol = t.trainCol || 0; }
    grandfathered.push('zug:' + t.train, ...(t.extra || []).map(e => 'zug:' + (e.model || (e.model = 'regio'))));
  }
  // 29.09.2026 (Block 23): die alte Fähre am Hafen wird ein Schiff (Holzfähre) mit demselben Ziel
  for (const [, t] of d.tiles) if (t.b === 'hafen' && t.ferry) { t.ships = (t.ships || []).concat([{ model: 'holz', to: t.ferry }]); delete t.ferry; }
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
  // v8 (29.09.2026): Aussehen gibt es einzeln in der Kunstakademie. Was man vorher schon hatte, bleibt freigeschaltet.
  if ((d.v || 3) < 8) {
    const had = new Set(d.techs), grant = new Set(d.design || []);
    const lanterns = Object.values(d.restore || {}).reduce((s, n) => s + n, 0);
    for (let i = FREE_COLORS; i < (had.has('farben') ? 14 : 7); i++) { grant.add('wall:' + i); grant.add('roof:' + i); }
    grant.add('weg:mulch');
    if (lanterns >= 3 || (d.legacy || []).includes('weg:asphalt')) grant.add('weg:asphalt');
    const byTech = { garten: ['weg:tritt', 'laterne'], pflasterkunst: ['weg:klinker', 'weg:terrakotta'],
      farben: ['weg:pastell'], kunst: ['weg:fisch'], skulptur: ['weg:mosaik', 'pavillon', 'statue'] };
    for (const [tech, ids] of Object.entries(byTech)) if (had.has(tech)) ids.forEach(id => grant.add(id));
    d.design = [...grant];
  }
  // 30.09.2026 abends: Kies und Sandweg sind eins (Kiesweg), Holzbohlen und das rosa Schachbrett entfallen –
  // bezahlte Stile gibt es in Talern zurück (die Wege selbst wurden oben umgestellt)
  const DROPPED = { 'weg:kies': 40, 'weg:holz': 120, 'weg:schach': 250 };
  if ((d.design || []).some(id => id in DROPPED)) {
    d.money = (+d.money || 0) + d.design.filter(id => id in DROPPED).reduce((sum, id) => sum + DROPPED[id], 0);
    d.design = d.design.filter(id => !(id in DROPPED));
  }
  if (d.legacy) d.legacy = d.legacy.filter(id => !(id in DROPPED));
  // 30.09.2026: Pastell-Mosaik und Mosaik sind ein Stil „Konfetti“ – wer zusammen mehr bezahlt hat, bekommt die Differenz
  const MERGED = { 'weg:pastell': 250, 'weg:mosaik': 500 };
  if ((d.design || []).some(id => id in MERGED)) {
    const paid = d.design.filter(id => id in MERGED).reduce((sum, id) => sum + MERGED[id], 0);
    d.money = (+d.money || 0) + Math.max(0, paid - styleDef('weg', 'konfetti').design);
    d.design = d.design.filter(id => !(id in MERGED) && id !== 'weg:konfetti').concat(['weg:konfetti']);
  }
  return {
    seed: d.seed, money: +d.money || 0, res: { ...newRes(), ...(d.res || {}) }, science: d.science || 0,
    restore: d.restore || {}, diary: d.diary || ['start'], diarySeen: d.diarySeen || 0, festival: !!d.festival,
    // Spielstände von vor den Laternen: Einführung überspringen, Sterne-Freischaltungen behalten
    tutorial: d.tutorial != null ? d.tutorial : -1,
    legacy: new Set(d.legacy || legacyUnlocks(d)),
    design: new Set(d.design || []),
    oldSave: !d.restore,
    fitLm: false,                   // (v5/v6: Sehenswürdigkeiten rückten auf der Heimatinsel; seit v7 ziehen sie um)
    growWonders: (d.v || 3) < 9,     // v9 (30.09.): Wunderwerke sind größer geworden (growWonders)
    growHall: (d.v || 3) < 10,       // v10 (29.09.): Das Rathaus ist 3×3 (growTownHall)
    growHarbors: (d.v || 3) < 11,    // v11 (29.09.): Häfen sind 3×4 mit Kai und Pier (growHarbors)
    moveLm: (d.v || 3) < 7,         // v7: Sehenswürdigkeiten ziehen auf ihre Themen-Inseln (migrateIslands)
    boughtPlots: (d.v || 3) < 7 ? Math.max(0, d.owned.length - 1) : 0,
    islands: new Set(d.islands || ['home']),
    claimed: new Set(d.claimed || []),
    tipsSeen: new Set(d.tipsSeen || []), tipsOff: !!d.tipsOff,
    mastery: { ...(d.mastery || {}) }, inventions: new Set(d.inventions || []),
    far: Array.isArray(d.far) ? d.far.filter(f => f && typeof f.id === 'string' && isFinite(f.cx) && isFinite(f.cy) && f.r > 0 && f.name) : [],
    expedition: d.expedition && (ISLE_BY_ID[d.expedition.isle] || (d.far || []).some(f => f && f.id === d.expedition.isle)) && +d.expedition.until ? { ...d.expedition } : null,
    vehicles: new Set([...(d.vehicles || []), ...grandfathered.filter(v => v !== 'zug:tram')]),
    orders: Array.isArray(d.orders) ? d.orders.filter(o => o && RES[o.res] && o.amount > 0) : [], orderNext: +d.orderNext || 0,
    stats: { earned: 0, ...(d.stats || {}) }, achieved: { ...(d.achieved || {}) }, album: new Set(d.album || []),
    town: d.town || { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(d.owned), tiles: new Map(d.tiles), terra: new Map(d.terra || []), techs: new Set(d.techs.filter(id => id in TECH_BY_ID)),   // alte Forschung (Farben, Wege) ist jetzt Kunstakademie
    decos: new Map(d.decos || []),
    cam: d.cam || newState().cam, last: d.last || Date.now(), muted: !!d.muted,
  };
}

const LONG_FRONT = new Set(['saege', 'baecker', 'fabrik', 'bibliothek', 'kunst']);

// Spielstände von vor den Themen-Inseln (v < 7): Sehenswürdigkeiten ziehen samt Laternen auf ihre Insel um,
// Inseln mit schon restaurierten Sehenswürdigkeiten sind erschlossen, die ganze Heimatinsel gehört einem,
// gekaufte Grundstücke gibt es zurück.
function migrateIslands() {
  if (!state.moveLm) return null;
  const bought = state.boughtPlots || 0;
  delete state.moveLm; delete state.boughtPlots;
  let refund = 0;
  for (let n = 1; n <= bought; n++) refund += Math.round(100 * Math.pow(1.28, n - 1) / 10) * 10;
  for (const [k, t] of [...state.tiles]) if (t.b === 'lm') state.tiles.delete(k);
  placeIslandLandmarks();
  state.islands = new Set(['home', ...ISLES.filter(i => lmStage(i.lm) >= 1).map(i => i.id)]);
  state.owned = new Set();
  for (const id of state.islands) ownIsland(id);
  state.money += refund;
  return { refund, isles: [...state.islands].filter(id => id !== 'home') };
}

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
  resetUnlockWatch();
  state = s;
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
  walkers.length = 0; cars.length = 0;
  normalizeSmall();
  migrateLandmarks();
  plan = null; moving = null;                      // Planung und Getragenes gehören zum alten Stand
  registerFar();
  const moved = migrateIslands();
  ownIslandsFully();
  ensureFar();
  const grown = growWonders();
  const hall = growTownHall();
  const ports = growHarbors();
  fitFootprints();
  delete state.fitLm;
  nameHouses();
  recalc();
  collectAlbum();
  checkAchievements(true);                         // schon Erreichtes still zählen
  if (moved) setTimeout(() => announceIslands(moved), 300);
  if (grown.length) setTimeout(() => announceWonders(grown), 600);
  if (hall) setTimeout(() => announceHall(hall), 900);
  if (ports) setTimeout(() => announceHarbors(ports), 1300);
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
