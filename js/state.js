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
    money: 300, science: 0, stars: 0, res: newRes(),
    town: { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(['0,0']),
    tiles: new Map(),
    terra: new Map(),
    techs: new Set(),
    paved: new Map(),          // gepflasterte Felder → Stil (Bodenbelag, Objekte dürfen darauf stehen)
    decos: new Map(),          // kleine Dekos: Feld → [4 Ecken] mit { b, rot } oder null
    walks: new Map(),          // Gehwege auf Feldgrenzen → Stil: 'x,y,e' (zu x+1) und 'x,y,s' (zu y+1)
    cam: { x: c.x, y: c.y, z: 1.4 },
    last: Date.now(),
    muted: false,
  };
}

// Spielstand als einfaches Objekt (für localStorage und Export)
function serialize() {
  const tiles = [];
  for (const [k, t] of state.tiles) {
    const o = { b: t.b, lvl: t.lvl };
    if (t.wall != null) o.wall = t.wall;
    if (t.roof != null) o.roof = t.roof;
    if (t.lm) o.lm = t.lm;
    if (t.rot) o.rot = t.rot;
    if (t.style) o.style = t.style;
    tiles.push([k, o]);
  }
  const decos = [...state.decos].map(([k, ds]) => [k, ds.map(d => d && { b: d.b, rot: d.rot || 0 })]);
  return {
    game: 'kachelhausen', v: 3, seed: state.seed, money: state.money, res: state.res, science: state.science, stars: state.stars,
    town: state.town, owned: [...state.owned], tiles, terra: [...state.terra], techs: [...state.techs],
    walks: [...state.walks], paved: [...state.paved], decos, cam: state.cam, last: state.last, muted: state.muted,
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
  // Strom wurde entfernt: Kraftwerke/Solarfelder und Energie-Forschung erstatten
  const REFUND = { kraftwerk: 500, solar: 350 }, SCI_REFUND = { wind: 30, solar: 120 };
  d.tiles = d.tiles.filter(([, t]) => {
    if (t.b in REFUND) { d.money += REFUND[t.b]; return false; }
    return t.b in ITEMS;
  });
  d.techs = (d.techs || []).filter(id => { if (id in SCI_REFUND) { d.science = (d.science || 0) + SCI_REFUND[id]; return false; } return true; });
  return {
    seed: d.seed, money: +d.money || 0, res: { ...newRes(), ...(d.res || {}) }, science: d.science || 0, stars: d.stars || 0,
    town: d.town || { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(d.owned), tiles: new Map(d.tiles), terra: new Map(d.terra || []), techs: new Set(d.techs),
    decos: new Map(d.decos || []),
    walks: new Map((d.walks || []).map(w => typeof w === 'string' ? [w, 'platten'] : w)),
    paved: new Map((d.paved || []).map(w => typeof w === 'string' ? [w, 'alt'] : w)),
    cam: d.cam || newState().cam, last: d.last || Date.now(), muted: !!d.muted,
  };
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
