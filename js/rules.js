'use strict';
// ---------------------------------------------------------------------------
// Netz: Viertel, Arbeitswege, Ideen, Einnahmen, Rohstoffe, Schönheit
// ---------------------------------------------------------------------------
const hasTech = id => state.techs.has(id);
// Grundflächen: Gebäude können mehrere Felder belegen. Gespeichert wird nur das Ankerfeld (hinterste Ecke);
// COVER sagt für jedes belegte Feld, zu welchem Anker es gehört.
const sizeOf = (b, rot) => { const s = ITEMS[b].size || [1, 1]; return (rot & 1) ? [s[1], s[0]] : s; };
function footprint(b, ax, ay, rot) {
  const [w, h] = sizeOf(b, rot || 0), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([ax + i, ay + j]);
  return out;
}
let COVER = new Map();
function rebuildCover() {
  COVER = new Map();
  for (const [k, t] of state.tiles) {
    const [x, y] = keyXY(k);
    for (const [fx, fy] of footprint(t.b, x, y, t.rot)) COVER.set(fx + ',' + fy, k);
  }
}
const anchorAt = (x, y) => COVER.get(x + ',' + y) || null;
const objAt = (x, y) => { const a = anchorAt(x, y); return a ? state.tiles.get(a) : null; };
function bAt(x, y) { const t = objAt(x, y); return t ? t.b : null; }
const isBig = b => { const s = ITEMS[b].size; return !!s && (s[0] > 1 || s[1] > 1); };

// Felder rund um ein Objekt – bei großen Gebäuden rund um die ganze Grundfläche
function aroundTiles(x, y, r) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = t ? keyXY(a) : [x, y];
  const [w, h] = t ? sizeOf(t.b, t.rot) : [1, 1];
  const out = [];
  for (let yy = ay - r; yy <= ay + h - 1 + r; yy++) for (let xx = ax - r; xx <= ax + w - 1 + r; xx++) {
    if (xx >= ax && xx < ax + w && yy >= ay && yy < ay + h) continue;
    out.push([xx, yy]);
  }
  return out;
}
function countAround(x, y, r, fn) {           // Felder zählen (z. B. Wasser)
  let n = 0;
  for (const [a, b] of aroundTiles(x, y, r)) if (fn(a, b)) n++;
  return n;
}
function countNear(x, y, r, pred) {           // Gebäude zählen – jedes nur einmal, auch wenn es groß ist
  const seen = new Set();
  for (const [a, b] of aroundTiles(x, y, r)) {
    const k = anchorAt(a, b);
    if (k && !seen.has(k) && pred(state.tiles.get(k).b)) seen.add(k);
  }
  return seen.size;
}
const isWater = (x, y) => terrainAt(x, y) === 'water';
const isProducerB = b => ITEMS[b].cat === 'bau' && b !== 'markt';
const isHouse = (x, y) => bAt(x, y) === 'haus';
// Regeln (gemeinsam festgelegt): Viertel über Nachbarschaft und Wege, Fußweg 4 Felder, sonst halbe Kraft
const WALK_REACH = 4, FAR_EFF = 0.5;
const VIERTEL_STEPS = [[15, 0.3], [8, 0.2], [3, 0.1]];
const LM_RADIUS = 10, LM_BOOST = 0.15;
const needsReach = b => b === 'lm' || !!ITEMS[b].workers;
const countsForViertel = b => b !== 'weg';

function unionFind() {
  const parent = new Map();
  const add = k => { if (!parent.has(k)) parent.set(k, k); };
  const find = k => {
    let r = k;
    while (parent.get(r) !== r) r = parent.get(r);
    while (parent.get(k) !== r) { const n = parent.get(k); parent.set(k, r); k = n; }
    return r;
  };
  const union = (a, b) => { add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
  return { parent, find, union, add };
}

// Viertel: alles Bebaute (Gebäude, Wege, Dekos), das direkt oder über Eck aneinandergrenzt.
// Wege verbinden so auch weit entfernte Orte mit dem Dorf.
function computeNet() {
  const uf = unionFind();
  const occupied = new Set([...COVER.keys(), ...state.decos.keys()]);
  for (const k of occupied) {
    uf.add(k);
    const [x, y] = keyXY(k);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const n = (x + dx) + ',' + (y + dy);
      if (occupied.has(n)) uf.union(k, n);
    }
  }
  const vOf = k => uf.parent.has(k) ? uf.find(k) : null;
  const vSize = new Map(), vHome = new Set();
  for (const [k, t] of state.tiles) {
    const v = vOf(k);
    if (countsForViertel(t.b)) vSize.set(v, (vSize.get(v) || 0) + 1);
    if (t.b === 'haus') vHome.add(v);
  }
  for (const k of state.decos.keys()) if (!COVER.has(k)) { const v = vOf(k); vSize.set(v, (vSize.get(v) || 0) + 1); }
  // Häuser in Laufweite
  const houses = [];
  for (const [k, t] of state.tiles) if (t.b === 'haus') houses.push(keyXY(k));
  const nearHome = (x, y) => houses.some(([hx, hy]) => Math.max(Math.abs(hx - x), Math.abs(hy - y)) <= WALK_REACH);
  const paths = [...state.tiles].filter(([, t]) => t.b === 'weg').map(([k]) => k);
  return { vOf, vSize, vHome, nearHome, paths };
}

// Wie gut erreichen die Bewohner diesen Ort?
function reachOf(net, k, x, y) {
  const v = net.vOf(k);
  if (v && net.vHome.has(v)) return { eff: 1, how: 'viertel' };
  if (net.nearHome(x, y)) return { eff: 1, how: 'nah' };
  return { eff: FAR_EFF, how: 'weit' };
}
function viertelBonus(net, k) {
  const v = net.vOf(k);
  const n = v ? net.vSize.get(v) || 0 : 0;
  for (const [min, b] of VIERTEL_STEPS) if (n >= min) return { n, bonus: b };
  return { n, bonus: 0 };
}

function rawIncome(b, x, y) {
  switch (b) {
    case 'haus': return 0.5;
    case 'feld': return hasTech('duenger') ? 1.5 : 1;
    case 'fischer': return 1 + 1.5 * countAround(x, y, 1, isWater);
    case 'muehle': return 0.5 + 2 * countNear(x, y, 1, b => b === 'feld');
    case 'baecker': return 2 + 6 * countNear(x, y, 1, b => b === 'muehle');
    case 'markt': return 1.5 * countNear(x, y, 2, isProducerB);
    case 'fabrik': return 25 + 5 * countNear(x, y, 3, b => b === 'mine');
    case 'leuchtturm': return 10;
    default: return 0;
  }
}
const beetBonus = (x, y) => countNear(x, y, 1, b => b === 'blumen');
const nearHouse = (x, y) => countNear(x, y, 2, b => b === 'haus') > 0;
function beautyOf(t, x, y) {
  const d = ITEMS[t.b];
  const nearHome = nearHouse(x, y);
  let v = 0;
  if (d.beauty) v += d.beauty * (nearHome && d.cat === 'deko' ? 1.5 : 1) * (t.b === 'kunst' && hasTech('kunst') ? 1.5 : 1);
  if (d.ugly && nearHome) v -= d.ugly;
  return v;
}

let NET = null;
function totals() {
  rebuildCover();
  const net = computeNet();
  const st = new Map();
  const lmOn = new Map(), lmHalf = new Map();       // Typ → [x, y]
  let pop = 0, jobs = 0;
  // Erreichbarkeit, Viertel, Sehenswürdigkeiten
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    jobs += d.workers || 0;
    pop += t.b === 'haus' ? HOUSE_STAGES[Math.min(t.lvl, HOUSE_STAGES.length) - 1].pop : (d.pop || 0) * t.lvl;
    const s = { ...(needsReach(t.b) ? reachOf(net, k, x, y) : { eff: 1, how: null }), ...viertelBonus(net, k) };
    st.set(k, s);
    // Sehenswürdigkeiten wirken erst, wenn sie mindestens eine Stufe restauriert sind
    if (t.b === 'lm' && ownedTile(x, y) && lmStage(t.lm) >= 1) {
      s.road = s.how === 'viertel';
      (s.how === 'weit' ? lmHalf : lmOn).set(t.lm, [x, y]);
    }
  }
  const lmFactor = type => lmOn.has(type) ? 1 : lmHalf.has(type) ? 0.5 : 0;
  const lmNear = (x, y) => {
    let b = 1;
    for (const m of [lmOn, lmHalf]) for (const [type, [lx, ly]] of m) {
      if (Math.hypot(lx - x, ly - y) <= LM_RADIUS) b += LM_BOOST * lmFactor(type);
    }
    return b;
  };
  const klippe = lmOn.get('klippe') || lmHalf.get('klippe');
  const harbors = [...state.tiles.values()].filter(t => t.b === 'hafen').length;
  const gmul = 1 + 0.08 * harbors;
  const schoolFactor = Math.min(1, pop / 15);
  let inc = 0, sci = 0, beauty = 0;
  const prod = {}, conv = [];
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    beauty += beautyOf(t, x, y);
    if (t.b === 'lm') continue;
    const s = st.get(k);
    s.lmb = lmNear(x, y);
    const m = s.eff * (1 + s.bonus) * s.lmb;
    if (d.prod) {
      s.prod = {};
      for (const [r, base] of Object.entries(d.prod)) {
        let v = base * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m;
        if (t.b === 'mine' && lmOn.has('erzberg')) v *= 1.25;
        s.prod[r] = v; prod[r] = (prod[r] || 0) + v;
      }
    }
    if (d.conv) {
      s.conv = d.conv.rate * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m;
      conv.push({ ...d.conv, rate: s.conv });
    }
    if (d.cat === 'bau' && !d.prod && !d.conv) {
      let v = rawIncome(t.b, x, y) * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * gmul;
      if (t.b === 'muehle' && klippe && lmStage('klippe') >= 2 && Math.hypot(x - klippe[0], y - klippe[1]) <= LM_RADIUS) v *= 1 + lmFactor('klippe');
      s.inc = v; inc += v;
    }
    if (d.science) {
      const v = d.science * t.lvl * m * (t.b === 'schule' ? schoolFactor : 1) * (t.b === 'bibliothek' && hasTech('bibliothek') ? 2 : 1);
      s.sci = v; sci += v;
    }
  }
  for (const [k, ds] of state.decos) {
    const [x, y] = keyXY(k), nearHome = nearHouse(x, y) || isHouse(x, y);
    for (const d of ds) if (d) beauty += ITEMS[d.b].beauty * (nearHome ? 1.5 : 1);
  }
  // Eigene Effekte der Sehenswürdigkeiten (weit weg ohne Weg: halb; Touristen nur per Weg)
  const quelle = [...state.tiles].find(([, t]) => t.lm === 'quelle');
  if (quelle && (lmOn.has('quelle') || lmHalf.has('quelle'))) {
    beauty += 40 * lmFactor('quelle');
    if (st.get(quelle[0]).road && lmStage('quelle') >= 3) inc += 12 * gmul;
  }
  sci += 1.5 * lmFactor('ruine') + 3 * lmFactor('kristall');
  beauty += 15 * lmFactor('obsthain') + [0, 20, 40, 80][lmStage('baum')] * lmFactor('baum');
  // Wünsche der Häuser (für Sprechblasen und Infofenster)
  for (const [k, t] of state.tiles) if (t.b === 'haus') { const [x, y] = keyXY(k); st.get(k).wish = houseWishes(t, x, y); }
  return { inc, pop, jobs, sci, prod, conv, beauty: Math.max(0, Math.round(beauty)), lm: lmOn.size, lmOn, lmHalf, st, net };
}
let T = { inc: 0, pop: 0, jobs: 0, sci: 0, prod: {}, conv: [], beauty: 0, lm: 0, lmOn: new Map(), lmHalf: new Map(), st: new Map() };
function recalc() { T = totals(); NET = T.net; previewCache = null; }
const statusOf = (x, y) => T.st.get(x + ',' + y);

const lmStage = type => (state.restore && state.restore[type]) || 0;
function unlockOk(def, key) {
  if (state.legacy && state.legacy.has(key)) return true;
  if (def.lm) { const [type, n] = def.lm.split(':'); if (lmStage(type) < +n) return false; }
  if (def.lanterns && lanternCount() < def.lanterns) return false;
  if (def.tech && !hasTech(def.tech)) return false;
  return true;
}
// Ort und Stufe zusammen („🌬️ Windige Klippe → Aussichtspunkt“), kurz nur der Ort (Leiste unten)
const lmStepName = (type, n) => `${LANDMARKS[type].icon} ${LANDMARKS[type].name} → ${LM_STAGES[type][n - 1].name}`;
function unlockText(def, short) {
  if (def.lm) {
    const [type, n] = def.lm.split(':');
    if (lmStage(type) < +n) return short ? `${LANDMARKS[type].icon} ${LANDMARKS[type].name}` : lmStepName(type, +n);
  }
  if (def.lanterns && lanternCount() < def.lanterns) return `🏮 ${def.lanterns}`;
  if (def.tech && !hasTech(def.tech)) return '💡 ' + TECH_BY_ID[def.tech].name;
  return '';
}
const styleOk = st => unlockOk(st, 'weg:' + st.id);
const styleLock = st => unlockText(st);
function currentStyle(kind) {
  if (!styleOk(styleDef(kind, chosenStyle[kind]))) chosenStyle[kind] = STYLES[kind][0].id;
  return chosenStyle[kind];
}
// Kleine Dekos: 4 Ecken pro Feld (0 hinten, 1 rechts, 2 links, 3 vorn)
const SLOT_OFF = 0.3;
const slotUV = i => [(i & 1 ? 1 : -1) * SLOT_OFF, (i & 2 ? 1 : -1) * SLOT_OFF];
const decosAt = k => state.decos.get(k);
function slotAt(sx, sy) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  const a = (px / (TW / 2) + py / (TH / 2)) / 2, b = (py / (TH / 2) - px / (TW / 2)) / 2;
  const x = Math.round(a), y = Math.round(b);
  return { x, y, slot: (a - x > 0 ? 1 : 0) + (b - y > 0 ? 2 : 0) };
}
const BIG_ON_TILE = new Set(['brunnen', 'pavillon', 'statue', 'baum', 'blumen', 'windrad', 'lm']);
function smallError(b, x, y, slot, opts = {}) {
  const d = ITEMS[b], k = x + ',' + y;
  if (!ownedTile(x, y)) return 'Das ist nicht dein Grundstück';
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  const t = objAt(x, y);
  if (t && (BIG_ON_TILE.has(t.b) || isBig(t.b))) return 'Hier ist kein Platz für Deko';
  if (!t && terrainAt(x, y) !== 'grass') return 'Erst roden bzw. sprengen';
  if (decosAt(k) && decosAt(k)[slot]) return 'Diese Ecke ist schon belegt';
  if (opts.move) return null;
  if (state.money < d.cost) return 'Zu wenig Taler';
  return matError(d.mat);
}
function buildSmall(b, x, y, slot) {
  const err = smallError(b, x, y, slot);
  if (err) { fail(err); return false; }
  const k = x + ',' + y;
  state.money -= ITEMS[b].cost;
  payMat(ITEMS[b].mat);
  if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]);
  state.decos.get(k)[slot] = { b, rot: ROTATABLE.has(b) ? buildRot : 0, born: performance.now() };
  sfx('deco');
  recalc(); checkStars(); save();
  return true;
}
function removeSmall(x, y, slot) {
  const k = x + ',' + y, ds = decosAt(k);
  if (!ds || !ds[slot]) return;
  const it = ITEMS[ds[slot].b];
  state.money += it.cost;
  for (const [r, n] of Object.entries(it.mat || {})) state.res[r] += n;
  ds[slot] = null;
  if (ds.every(v => !v)) state.decos.delete(k);
  sfx('dig'); recalc(); save();
}
// Alte ganze-Feld-Dekos (Bank, Laterne, Hecke) in eine Ecke verschieben
function normalizeSmall() {
  for (const [k, t] of [...state.tiles]) {
    if (!ITEMS[t.b] || !ITEMS[t.b].small) continue;
    state.tiles.delete(k);
    if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]);
    const ds = state.decos.get(k), free = [3, 0, 1, 2].find(i => !ds[i]);
    if (free != null) ds[free] = { b: t.b, rot: t.rot || 0 };
  }
}
const available = id => unlockOk(ITEMS[id], id);
const lockText = (id, short) => {
  const d = ITEMS[id];
  const txt = unlockText(d, short);
  return txt ? '🔒 ' + txt : '';
};
const upgradable = t => ITEMS[t.b].up && t.lvl < MAX_LVL;
const upgradeCost = t => Math.round(ITEMS[t.b].cost * Math.pow(1.8, t.lvl));
const hasBuilt = b => [...state.tiles.values()].some(t => t.b === b);

// Passt das Objekt mit Anker (x, y) hierhin? opts.move: beim Verschieben zählen Kosten und Einwohner nicht
function placeError(b, x, y, rot = buildRot, opts = {}) {
  const d = ITEMS[b];
  const r = ROTATABLE.has(b) ? rot : 0;
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (b === 'graben' || b === 'schuett') {
    if (!ownedTile(x, y)) return 'Das ist nicht dein Grundstück';
    const ter = terrainAt(x, y);
    if (b === 'graben') {
      if (COVER.has(x + ',' + y)) return 'Hier steht etwas';
      if (ter === 'water') return 'Hier ist schon Wasser';
      if (ter !== 'grass') return 'Erst roden bzw. sprengen';
    } else if (ter !== 'water') return 'Aufschütten geht nur auf Wasser';
  } else {
    const tiles = footprint(b, x, y, r);
    for (const [fx, fy] of tiles) {
      const k = fx + ',' + fy, ter = terrainAt(fx, fy);
      if (!ownedTile(fx, fy)) return 'Das ist nicht dein Grundstück';
      if (COVER.has(k)) return tiles.length > 1 ? 'Hier ist nicht genug Platz' : 'Hier steht schon etwas';
      if (ter === 'water') return 'Nicht auf dem Wasser';
      if ((BIG_ON_TILE.has(b) || tiles.length > 1) && decosAt(k)) return 'Hier stehen schon kleine Dekos';
      const need = d.needs;
      if (need === 'forest' && ter !== 'forest') return 'Nur im Wald';
      if (need === 'rock' && ter !== 'rock') return 'Nur auf Fels';
      if (need === 'erz' && ter !== 'erz') return 'Nur auf Erzadern (am Erzberg)';
      if (need === 'obst' && ter !== 'obst') return 'Nur im Wilden Obsthain';
      if ((need === 'grass' || need === 'shore') && ter !== 'grass') {
        return ter === 'forest' || ter === 'obst' ? 'Erst roden (Gelände → Abreißen)' : 'Erst sprengen (Gelände → Abreißen)';
      }
    }
    if (d.needs === 'shore' && !tiles.some(([fx, fy]) => DIRS.some(([dx, dy]) => isWater(fx + dx, fy + dy)))) return 'Muss direkt am Wasser stehen';
    if (!opts.move && d.workers && T.jobs + d.workers > T.pop) return 'Zu wenig Einwohner – baue Häuser';
  }
  if (opts.move) return null;
  if (state.money < (d.cost || 0)) return 'Zu wenig Taler';
  return matError(d.mat);
}

// Alte Spielstände: Gebäude, die jetzt mehrere Felder belegen, bekommen ihre Grundfläche.
// Passt es nirgends, werden Kosten und Material erstattet. Das Rathaus bleibt immer: was im Weg liegt, weicht.
function fitFootprints() {
  const removed = [];
  const refundObj = (k, t) => {
    const d = ITEMS[t.b];
    state.money += d.cost || 0;
    for (const [r, n] of Object.entries(d.mat || {})) state.res[r] += n;
    state.tiles.delete(k);
  };
  rebuildCover();
  for (const [k, t] of [...state.tiles]) {
    if (!isBig(t.b)) continue;
    const [w, h] = sizeOf(t.b, t.rot);
    const [x, y] = keyXY(k);
    // Steht es schon korrekt (keine Überlappung mit anderen Objekten)?
    state.tiles.delete(k); rebuildCover();
    const ok = (ax, ay) => placeError(t.b, ax, ay, t.rot || 0, { move: true }) === null;
    // gewachsene Grundfläche: nach hinten ausweichen, am liebsten so wenig wie möglich
    const tries = [];
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) tries.push([x - dx, y - dy]);
    tries.sort((a, b) => (x - a[0]) + (y - a[1]) - (x - b[0]) - (y - b[1]));
    let spot = tries.find(([ax, ay]) => ok(ax, ay));
    if (!spot && t.b === 'rathaus') {
      for (const [fx, fy] of footprint(t.b, x, y, t.rot)) {
        const kk = fx + ',' + fy, a = anchorAt(fx, fy);
        if (a && state.tiles.get(a).b !== 'lm') { const o = state.tiles.get(a); if (o.b !== 'weg') removed.push(ITEMS[o.b].name); refundObj(a, o); }
        const ds = state.decos.get(kk);
        if (ds) { for (const d of ds) if (d) state.money += ITEMS[d.b].cost; state.decos.delete(kk); }
        rebuildCover();
      }
      spot = [x, y];
    }
    if (spot) {
      state.tiles.set(spot[0] + ',' + spot[1], t);
      for (const [fx, fy] of footprint(t.b, spot[0], spot[1], t.rot)) state.decos.delete(fx + ',' + fy);
    } else {
      removed.push(ITEMS[t.b].name);
      state.money += ITEMS[t.b].cost || 0;
      for (const [r, n] of Object.entries(ITEMS[t.b].mat || {})) state.res[r] += n;
    }
    rebuildCover();
  }
  return removed;
}

// ---------------------------------------------------------------------------
// Wünsche der Häuser
// ---------------------------------------------------------------------------
// Steht ein Gebäude der Sorte (Prädikat) mit irgendeinem seiner Felder im Umkreis r?
function objWithin(x, y, r, pred) {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const t = objAt(x + dx, y + dy);
    if (t && pred(t.b)) return true;
  }
  return false;
}
function beautyAround(x, y, r) {
  let sum = 0;
  const seen = new Set();
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const k = (x + dx) + ',' + (y + dy), a = COVER.get(k);
    if (a && !seen.has(a)) { seen.add(a); const b = state.tiles.get(a).b; if (b !== 'haus') sum += ITEMS[b].beauty || 0; }
    const ds = state.decos.get(k);
    if (ds) for (const d of ds) if (d) sum += ITEMS[d.b].beauty || 0;
  }
  return sum;
}
function wishMet(w, x, y) {
  switch (w) {
    case 'weg': return DIRS.some(([dx, dy]) => bAt(x + dx, y + dy) === 'weg');
    case 'deko': {
      if (state.decos.has(x + ',' + y)) return true;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (state.decos.has((x + dx) + ',' + (y + dy))) return true;
      return objWithin(x, y, 2, b => ITEMS[b].cat === 'deko' && b !== 'weg');
    }
    case 'baecker': return objWithin(x, y, 6, b => b === 'baecker');
    case 'ruhe': return !objWithin(x, y, 1, b => NOISY.has(b));
    case 'markt': return objWithin(x, y, 8, b => b === 'markt');
    case 'park': return objWithin(x, y, 4, b => b === 'park' || b === 'brunnen');
    case 'schule': return objWithin(x, y, 10, b => b === 'schule');
    case 'schoen': return beautyAround(x, y, 3) >= 30;
    default: return false;
  }
}
// Wünsche für die nächste Stufe (alle bisherigen zählen weiter mit)
function houseWishes(t, x, y) {
  const next = HOUSE_STAGES[t.lvl];
  if (!next) return { next: null, list: [], met: 0, total: 0, ready: false };
  const ids = HOUSE_STAGES.slice(1, t.lvl + 1).flatMap(st => st.wishes);
  const list = ids.map(id => ({ id, text: WISHES[id].text, ok: wishMet(id, x, y) }));
  const met = list.filter(w => w.ok).length;
  return { next, list, met, total: list.length, ready: met === list.length };
}

function demolishInfo(x, y) {
  if (!ownedTile(x, y)) return { err: 'Das ist nicht dein Grundstück' };
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (t) {
    const d = ITEMS[t.b];
    if (t.b === 'lm') return { err: 'Sehenswürdigkeiten bleiben stehen' };
    if (d.fixed) return { err: 'Das Rathaus bleibt stehen' };
    if (d.pop) {
      const lost = d.pop * t.lvl;
      if (T.pop - lost < T.jobs) return { err: 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.' };
    }
    // Deko und Wege gibt es voll zurück (Umgestalten soll nichts kosten), Gebäude zur Hälfte
    const full = d.cat === 'deko' || t.b === 'weg';
    return { anchor: a, refund: full ? d.cost : Math.floor(d.cost / 2), mat: full ? d.mat : null, label: `${d.name} ${full ? 'entfernen' : 'abreißen'}` };
  }
  const ter = terrainAt(x, y);
  if (ter === 'forest' || ter === 'obst') return { cost: 10, label: 'Roden' };
  if (ter === 'rock' || ter === 'erz') return { cost: 50, label: 'Sprengen' };
  return { err: ter === 'water' ? 'Wasser: nimm „Aufschütten“' : 'Hier ist nichts zum Abreißen' };
}

let previewCache = null;
function previewDelta(b, x, y) {
  const k = x + ',' + y;
  if (previewCache && previewCache.k === k && previewCache.b === b && previewCache.rot === buildRot) return previewCache;
  state.tiles.set(k, { b, lvl: 1, rot: ROTATABLE.has(b) ? buildRot : 0 });
  const t = totals();
  state.tiles.delete(k);
  rebuildCover();
  const st = t.st.get(k) || {};
  previewCache = { k, b, rot: buildRot, inc: t.inc - T.inc, beauty: t.beauty - T.beauty, sci: t.sci - T.sci, prod: st.prod, conv: st.conv,
                   pop: t.pop - T.pop, how: t.st.get(k)?.how, bonus: t.st.get(k)?.bonus || 0 };
  return previewCache;
}
