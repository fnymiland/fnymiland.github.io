'use strict';
// ---------------------------------------------------------------------------
// Netz: Viertel, Arbeitswege, Ideen, Einnahmen, Rohstoffe, Schönheit
// ---------------------------------------------------------------------------
const hasTech = id => state.techs.has(id);
function bAt(x, y) { const t = state.tiles.get(x + ',' + y); return t ? t.b : null; }
function countAround(x, y, r, fn) {
  let n = 0;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if ((dx || dy) && fn(x + dx, y + dy)) n++;
  }
  return n;
}
const isWater = (x, y) => terrainAt(x, y) === 'water';
const isProducer = (x, y) => { const b = bAt(x, y); return !!b && ITEMS[b].cat === 'bau' && b !== 'markt'; };
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
  const occupied = new Set([...state.tiles.keys(), ...state.decos.keys()]);
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
  for (const k of occupied) {
    const t = state.tiles.get(k), v = vOf(k);
    if (!t || countsForViertel(t.b)) vSize.set(v, (vSize.get(v) || 0) + 1);
    if (t && t.b === 'haus') vHome.add(v);
  }
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
    case 'muehle': return 0.5 + 2 * countAround(x, y, 1, (a, c) => bAt(a, c) === 'feld');
    case 'baecker': return 2 + 6 * countAround(x, y, 1, (a, c) => bAt(a, c) === 'muehle');
    case 'markt': return 1.5 * countAround(x, y, 2, isProducer);
    case 'fabrik': return 25 + 5 * countAround(x, y, 3, (a, c) => bAt(a, c) === 'mine');
    case 'leuchtturm': return 10;
    default: return 0;
  }
}
const beetBonus = (x, y) => countAround(x, y, 1, (a, c) => bAt(a, c) === 'blumen');
function beautyOf(t, x, y) {
  const d = ITEMS[t.b];
  const nearHome = countAround(x, y, 2, isHouse) > 0;
  let v = 0;
  if (d.beauty) v += d.beauty * (nearHome && d.cat === 'deko' ? 1.5 : 1);
  if (d.ugly && nearHome) v -= d.ugly;
  return v;
}

let NET = null;
function totals() {
  const net = computeNet();
  const st = new Map();
  const lmOn = new Map(), lmHalf = new Map();       // Typ → [x, y]
  let pop = 0, jobs = 0;
  // Erreichbarkeit, Viertel, Sehenswürdigkeiten
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    jobs += d.workers || 0;
    pop += (d.pop || 0) * t.lvl;
    const s = { ...(needsReach(t.b) ? reachOf(net, k, x, y) : { eff: 1, how: null }), ...viertelBonus(net, k) };
    st.set(k, s);
    if (t.b === 'lm' && ownedTile(x, y)) {
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
      if (t.b === 'muehle' && klippe && Math.hypot(x - klippe[0], y - klippe[1]) <= LM_RADIUS) v *= 1 + lmFactor('klippe');
      s.inc = v; inc += v;
    }
    if (d.science) {
      const v = d.science * t.lvl * m * (t.b === 'schule' ? schoolFactor : 1);
      s.sci = v; sci += v;
    }
  }
  for (const [k, ds] of state.decos) {
    const [x, y] = keyXY(k), nearHome = countAround(x, y, 2, isHouse) > 0 || isHouse(x, y);
    for (const d of ds) if (d) beauty += ITEMS[d.b].beauty * (nearHome ? 1.5 : 1);
  }
  // Eigene Effekte der Sehenswürdigkeiten (weit weg ohne Weg: halb; Touristen nur per Weg)
  const quelle = [...state.tiles].find(([, t]) => t.lm === 'quelle');
  if (quelle && (lmOn.has('quelle') || lmHalf.has('quelle'))) {
    beauty += 40 * lmFactor('quelle');
    if (st.get(quelle[0]).road) inc += 12 * gmul;
  }
  sci += 1.5 * lmFactor('ruine') + 3 * lmFactor('kristall');
  beauty += 15 * lmFactor('obsthain') + 80 * lmFactor('baum');
  return { inc, pop, jobs, sci, prod, conv, beauty: Math.max(0, Math.round(beauty)), lm: lmOn.size, lmOn, lmHalf, st, net };
}
let T = { inc: 0, pop: 0, jobs: 0, sci: 0, prod: {}, conv: [], beauty: 0, lm: 0, lmOn: new Map(), lmHalf: new Map(), st: new Map() };
function recalc() { T = totals(); NET = T.net; previewCache = null; }
const statusOf = (x, y) => T.st.get(x + ',' + y);

const styleOk = st => state.stars >= (st.star || 0) && (!st.tech || hasTech(st.tech));
const styleLock = st => st.star && state.stars < st.star ? '★'.repeat(st.star) : st.tech && !hasTech(st.tech) ? '💡 ' + TECH_BY_ID[st.tech].name : '';
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
function smallError(b, x, y, slot) {
  const d = ITEMS[b], k = x + ',' + y;
  if (!ownedTile(x, y)) return 'Das ist nicht dein Grundstück';
  if (!available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  const t = state.tiles.get(k);
  if (t && BIG_ON_TILE.has(t.b)) return 'Hier ist kein Platz für Deko';
  if (!t && terrainAt(x, y) !== 'grass') return 'Erst roden bzw. sprengen';
  if (decosAt(k) && decosAt(k)[slot]) return 'Diese Ecke ist schon belegt';
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
  state.money += Math.floor(ITEMS[ds[slot].b].cost / 2);
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
const available = id => { const d = ITEMS[id]; return state.stars >= (d.star || 0) && (!d.tech || hasTech(d.tech)); };
const lockText = id => {
  const d = ITEMS[id];
  if (state.stars < (d.star || 0)) return `🔒 ${'★'.repeat(d.star)}`;
  if (d.tech && !hasTech(d.tech)) return '🔒 💡 ' + TECH_BY_ID[d.tech].name;
  return '';
};
const upgradable = t => ITEMS[t.b].up && t.lvl < MAX_LVL;
const upgradeCost = t => Math.round(ITEMS[t.b].cost * Math.pow(1.8, t.lvl));
const hasBuilt = b => [...state.tiles.values()].some(t => t.b === b);

function placeError(b, x, y) {
  const d = ITEMS[b];
  if (!ownedTile(x, y)) return 'Das ist nicht dein Grundstück';
  if (!available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  const obj = state.tiles.get(x + ',' + y);
  const ter = terrainAt(x, y);
  if (b === 'graben') {
    if (obj) return 'Hier steht etwas';
    if (ter === 'water') return 'Hier ist schon Wasser';
    if (ter !== 'grass') return 'Erst roden bzw. sprengen';
  } else if (b === 'schuett') {
    if (ter !== 'water') return 'Aufschütten geht nur auf Wasser';
  } else {
    if (obj) return 'Hier steht schon etwas';
    if (ter === 'water') return 'Nicht auf dem Wasser';
    if (BIG_ON_TILE.has(b) && decosAt(x + ',' + y)) return 'Hier stehen schon kleine Dekos';
    const need = d.needs;
    if (need === 'forest' && ter !== 'forest') return 'Nur im Wald';
    if (need === 'rock' && ter !== 'rock') return 'Nur auf Fels';
    if (need === 'erz' && ter !== 'erz') return 'Nur auf Erzadern (am Erzberg)';
    if (need === 'obst' && ter !== 'obst') return 'Nur im Wilden Obsthain';
    if ((need === 'grass' || need === 'shore') && ter !== 'grass') {
      return ter === 'forest' || ter === 'obst' ? 'Erst roden (Gelände → Abreißen)' : 'Erst sprengen (Gelände → Abreißen)';
    }
    if (need === 'shore' && !countAround(x, y, 1, isWater)) return 'Muss direkt am Wasser stehen';
    if (d.workers && T.jobs + d.workers > T.pop) return 'Zu wenig Einwohner – baue Häuser';
  }
  if (state.money < (d.cost || 0)) return 'Zu wenig Taler';
  return matError(d.mat);
}

function demolishInfo(x, y) {
  if (!ownedTile(x, y)) return { err: 'Das ist nicht dein Grundstück' };
  const t = state.tiles.get(x + ',' + y);
  if (t) {
    const d = ITEMS[t.b];
    if (t.b === 'lm') return { err: 'Sehenswürdigkeiten bleiben stehen' };
    if (d.fixed) return { err: 'Das Rathaus bleibt stehen' };
    if (d.pop) {
      const lost = d.pop * t.lvl;
      if (T.pop - lost < T.jobs) return { err: 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.' };
    }
    return { refund: Math.floor(d.cost / 2), label: `${d.name} abreißen` };
  }
  const ter = terrainAt(x, y);
  if (ter === 'forest' || ter === 'obst') return { cost: 10, label: 'Roden' };
  if (ter === 'rock' || ter === 'erz') return { cost: 50, label: 'Sprengen' };
  return { err: ter === 'water' ? 'Wasser: nimm „Aufschütten“' : 'Hier ist nichts zum Abreißen' };
}

let previewCache = null;
function previewDelta(b, x, y) {
  const k = x + ',' + y;
  if (previewCache && previewCache.k === k && previewCache.b === b) return previewCache;
  state.tiles.set(k, { b, lvl: 1 });
  const t = totals();
  state.tiles.delete(k);
  const st = t.st.get(k) || {};
  previewCache = { k, b, inc: t.inc - T.inc, beauty: t.beauty - T.beauty, sci: t.sci - T.sci, prod: st.prod, conv: st.conv,
                   pop: t.pop - T.pop, how: t.st.get(k)?.how, bonus: t.st.get(k)?.bonus || 0 };
  return previewCache;
}
