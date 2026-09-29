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
// Größe des Gewässers, an dem ein Gebäude liegt (alle Wasserfelder, die zusammenhängen und direkt angrenzen –
// so zählen auch schmale, lange Flüsse). Gezählt wird höchstens bis limit.
function waterBody(x, y, limit = 64) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = t ? keyXY(a) : [x, y], [w, h] = t ? sizeOf(t.b, t.rot) : [1, 1];
  const seen = new Set(), todo = [];
  const add = (px, py) => { const k = px + ',' + py; if (!seen.has(k) && isWater(px, py)) { seen.add(k); todo.push([px, py]); } };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) for (const [dx, dy] of DIRS) add(ax + i + dx, ay + j + dy);
  while (todo.length && seen.size < limit) { const [px, py] = todo.pop(); for (const [dx, dy] of DIRS) add(px + dx, py + dy); }
  return Math.min(seen.size, limit);
}
const isProducerB = b => ITEMS[b].cat === 'bau' && b !== 'markt';
const isHouse = (x, y) => bAt(x, y) === 'haus';
// Regeln (gemeinsam festgelegt): Viertel über Nachbarschaft und Wege, Fußweg 4 Felder, sonst halbe Kraft
const WALK_REACH = 4, FAR_EFF = 0.5;
const VIERTEL_STEPS = [[15, 0.3], [8, 0.2], [3, 0.1]];
const LM_RADIUS = 10, LM_BOOST = 0.15;
const needsReach = b => b === 'lm' || !!ITEMS[b].workers;
const countsForViertel = b => b !== 'weg' && b !== 'schiene';

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
  // Schienen verbinden keine Viertel: verbundene Inseln bleiben eigene Orte (der Zug bringt Pendler und Bonus)
  const occupied = new Set([...[...COVER].filter(([, a]) => { const t = state.tiles.get(a) || {}; return t.b !== 'schiene' || t.cross; }).map(([k]) => k), ...state.decos.keys()]);
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
    case 'fischer': return (1 + 1.5 * countAround(x, y, 1, isWater)) * (hasTech('netze') ? 1.3 : 1);
    case 'muehle': return (0.5 + 2 * countNear(x, y, 1, b => b === 'feld')) * (hasTech('muehlrad') ? 1.3 : 1);
    case 'baecker': return (2 + 6 * countNear(x, y, 1, b => b === 'muehle')) * (hasTech('ofen') ? 1.3 : 1);
    case 'markt': return 1.5 * countNear(x, y, 2, isProducerB);
    case 'fabrik': return (25 + 5 * countNear(x, y, 3, b => b === 'mine')) * (hasTech('dampf') ? 1.5 : 1);
    case 'leuchtturm': return 10;
    case 'ferienhaus': return 6;                     // Feriengäste
    default: return 0;
  }
}
const beetBonus = (x, y) => countNear(x, y, 1, b => b === 'blumen');
const nearHouse = (x, y) => countNear(x, y, 2, b => b === 'haus') > 0;
function beautyOf(t, x, y) {
  const d = ITEMS[t.b];
  const nearHome = nearHouse(x, y);
  let v = 0;
  if (d.wonder && !wonderDone(t)) return 0;                              // Baustelle
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
  const rail = computeRail();
  for (const n of rail.commuters.values()) pop += n;       // Pendler, die mit dem Zug kommen
  const railMul = (x, y) => rail.regions.size && rail.regions.has(regionAt(x, y)) ? 1 + RAIL_BONUS : 1;
  // Erreichbarkeit, Viertel, Sehenswürdigkeiten
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    jobs += jobsOf(t);
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
  const idle = rail.power.idle, off = k => idle.has(k) ? NO_POWER : 1;      // ohne Strom: halbe Wirkung
  const harbors = [...state.tiles].filter(([, t]) => t.b === 'hafen').reduce((n, [k]) => n + off(k), 0);
  const gmul = 1 + (hasTech('schiffbau') ? 0.12 : 0.08) * harbors;
  const schoolFactor = Math.min(1, pop / 15);
  let inc = 0, sci = 0, beauty = 0;
  const prod = {}, conv = [];
  const mT = masteryMul('taler'), mR = masteryMul('rohstoffe');          // Stufen-Forschung
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    beauty += beautyOf(t, x, y) * (t.b === 'glashaus' || t.b === 'botgarten' ? off(k) : 1);
    if (t.b === 'lm') continue;
    const s = st.get(k);
    if (idle.has(k)) s.noPower = true;
    s.lmb = lmNear(x, y);
    s.rail = railMul(x, y);
    const m = s.eff * (1 + s.bonus) * s.lmb * s.rail;
    if (d.prod) {
      s.prod = {};
      for (const [r, base] of Object.entries(d.prod)) {
        let v = base * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * mR;
        if (t.b === 'mine' && lmOn.has('erzberg')) v *= 1.25;
        if (t.b === 'holz' && hasTech('axt')) v *= 1.3;
        s.prod[r] = v; prod[r] = (prod[r] || 0) + v;
      }
    }
    if (d.conv) {
      s.conv = d.conv.rate * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * off(k) * mR;
      conv.push({ ...d.conv, rate: s.conv });
    }
    if (d.cat === 'bau' && !d.prod && !d.conv) {
      let v = rawIncome(t.b, x, y) * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * gmul;
      v *= off(k) * mT;                                                       // ohne Strom halb; Handelskunst
      if (t.b === 'muehle' && klippe && lmStage('klippe') >= 2 && Math.hypot(x - klippe[0], y - klippe[1]) <= LM_RADIUS) v *= 1 + lmFactor('klippe');
      s.inc = v; inc += v;
    }
    if (d.science) {
      const v = d.science * t.lvl * m * (t.b === 'schule' ? schoolFactor : 1) * (t.b === 'bibliothek' && hasTech('bibliothek') ? 2 : 1) * off(k);
      s.sci = v; sci += v;
    }
  }
  for (const [k, ds] of state.decos) {
    const [x, y] = keyXY(k), nearHome = nearHouse(x, y) || isHouse(x, y);
    ds.forEach((d, i) => { if (d) beauty += ITEMS[d.b].beauty * (nearHome ? 1.5 : 1) * (rail.power.dark.has(k + ',' + i) ? NO_POWER : 1); });
  }
  // Eigene Effekte der Sehenswürdigkeiten (weit weg ohne Weg: halb; Touristen nur per Weg)
  const quelle = [...state.tiles].find(([, t]) => t.lm === 'quelle');
  if (quelle && (lmOn.has('quelle') || lmHalf.has('quelle'))) {
    beauty += 40 * lmFactor('quelle');
    if (st.get(quelle[0]).road && lmStage('quelle') >= 3) inc += 12 * gmul * mT;
  }
  sci += 1.5 * lmFactor('ruine') + 3 * lmFactor('kristall');
  if (hasTech('sterne')) sci *= 1.2;
  // Wunderwerke (nur fertige): Touristen, Kurgäste, Ideen, Obst – das Schloss gibt +20 % auf alles
  let allMul = 0;
  for (const [k, t] of state.tiles) {
    const W = WONDERS[t.b];
    if (!W || !wonderDone(t)) continue;
    const e = W.effect, f = off(k);                                             // Riesenrad, Sternwarte, Garten ohne Strom: halb
    if (e.inc) inc += e.inc * gmul * f * mT;
    if (e.pop) pop += e.pop * f;
    if (e.sciMul) sci *= 1 + e.sciMul * f;
    if (e.prod) for (const [r, v] of Object.entries(e.prod)) prod[r] = (prod[r] || 0) + v * f * mR;
    if (e.allMul) allMul += e.allMul * f;
  }
  if (allMul) { inc *= 1 + allMul; sci *= 1 + allMul; for (const r of Object.keys(prod)) prod[r] *= 1 + allMul; }
  beauty += 15 * lmFactor('obsthain') + [0, 20, 40, 80][lmStage('baum')] * lmFactor('baum');
  // Wünsche der Häuser (für Sprechblasen und Infofenster)
  for (const [k, t] of state.tiles) if (t.b === 'haus') { const [x, y] = keyXY(k); st.get(k).wish = houseWishes(t, x, y); }
  // Gebäude-Stufen (für ✨ und Infofenster)
  for (const [k, t] of state.tiles) if (BUILD_STAGES[t.b]) { const [x, y] = keyXY(k); st.get(k).grow = stageInfo(t, x, y, pop, jobs); }
  pop = Math.round(pop * masteryMul('einwohner'));
  return { inc, pop, jobs, sci, prod, conv, beauty: Math.max(0, Math.round(beauty * masteryMul('schoen'))), lm: lmOn.size, lmOn, lmHalf, st, net, rail };
}
let T = { inc: 0, pop: 0, jobs: 0, sci: 0, prod: {}, conv: [], beauty: 0, lm: 0, lmOn: new Map(), lmHalf: new Map(), st: new Map(),
  rail: { lines: [], stationNet: new Map(), wind: 0, trains: 0, regions: new Set(), commuters: new Map(), comp: new Map(),
    power: { supply: 0, demand: 0, left: 0, dark: new Set(), idle: new Set(), trains: 0, city: false, use: { lamps: 0, work: 0, trains: 0 } } } };
function recalc() { T = totals(); NET = T.net; previewCache = null; groundVersion++; }
const statusOf = (x, y) => T.st.get(x + ',' + y);

const lmStage = type => (state.restore && state.restore[type]) || 0;
function unlockOk(def, key) {
  if (state.legacy && state.legacy.has(key)) return true;
  if (def.design && !state.design.has(key)) return false;        // in der Kunstakademie zu kaufen
  if (def.lm) { const [type, n] = def.lm.split(':'); if (lmStage(type) < +n) return false; }
  if (def.lanterns && lanternCount() < def.lanterns) return false;
  if (def.tech && !hasTech(def.tech)) return false;
  if (def.rank && starCount() < def.rank) return false;                // Pokale: genug Erfolgs-Sterne
  if (def.festival && !state.festival) return false;                    // Schloss: nach dem Laternenfest
  if (def.album && !albumDone(def.album)) return false;                // Album-Belohnung: volle Seite
  if (def.invention && !(state.inventions && state.inventions.has(def.invention))) return false;   // Erfindung (für Ideen)
  return true;
}
// Ort und Stufe zusammen („🌬️ Windige Klippe → Aussichtspunkt“), kurz nur der Ort (Leiste unten)
const lmStepName = (type, n) => `${LANDMARKS[type].icon} ${LANDMARKS[type].name} → ${LM_STAGES[type][n - 1].name}`;
function unlockText(def, short) {
  if (def.lm) {
    const [type, n] = def.lm.split(':');
    if (lmStage(type) < +n) return short ? `${LANDMARKS[type].icon} ${LANDMARKS[type].name}` : lmStepName(type, +n);
  }
  if (def.design) return `🎨 Kunstakademie · 🪙 ${fmt(def.design)}`;
  if (def.lanterns && lanternCount() < def.lanterns) return `🏮 ${def.lanterns}`;
  if (def.tech && !hasTech(def.tech)) return '💡 ' + TECH_BY_ID[def.tech].name;
  if (def.rank && starCount() < def.rank) return `⭐ ${def.rank} Erfolgs-Sterne`;
  if (def.festival && !state.festival) return '🎆 nach dem Laternenfest';
  if (def.album && !albumDone(def.album)) return `📒 volle Album-Seite „${ALBUM.find(p => p.id === def.album).name}“`;
  if (def.invention && !(state.inventions && state.inventions.has(def.invention))) return `💡 Erfindung ${INVENTIONS.find(i => i.id === def.invention).name}`;
  return '';
}
const styleOk = st => unlockOk(st, 'weg:' + st.id);
// Farben: die ersten FREE_COLORS gibt es von Anfang an, weitere in der Kunstakademie
const colorOk = (kind, i) => i < FREE_COLORS || state.design.has(kind + ':' + i);
const colorsOf = kind => (kind === 'wall' ? WALLS : ROOFS).map((c, i) => [c, i]).filter(([, i]) => colorOk(kind, i));
// Forschung: Stufe n braucht das passende Gebäude (Schule, Bibliothek, Universität)
const tierOpen = tier => hasBuilt(TECH_TIERS[tier].b);
// t.lm: Forschung, die erst eine Sehenswürdigkeit möglich macht (Eisenbahn: Erzinsel)
const techLmOk = t => !t.lm || lmStage(t.lm.split(':')[0]) >= +t.lm.split(':')[1];
const techReady = t => !hasTech(t.id) && tierOpen(t.tier) && (t.req || []).every(hasTech) && techLmOk(t);
// Preis einer Forschung: Grundpreis × Stufe (1: ×5, 2: ×25, 3: ×80), und jede schon erforschte macht die nächste 10 % teurer
const TIER_MUL = [0, 5, 25, 80];
const niceSci = v => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1)); return Math.round(v / p) * p; };
const masteryLvl = id => (state.mastery && state.mastery[id]) || 0;
const masteryMul = id => 1 + MASTERY_STEP * masteryLvl(id);
const masteryCost = id => niceSci(MASTERY_BASE * Math.pow(MASTERY_GROW, masteryLvl(id)));
const masteryOpen = () => tierOpen(2);
const inventionsOpen = () => tierOpen(3);
const hasInvention = id => !!state.inventions && state.inventions.has(id);
const techCost = t => niceSci(t.cost * TIER_MUL[t.tier] * (1 + 0.1 * [...state.techs].filter(id => TECH_BY_ID[id]).length));
// Kunstakademie: kaufen (Taler); Meisterstücke brauchen eine Kunstakademie
function designError(d) {
  if (!d || state.design.has(d.id) || !d.price) return 'Schon da';
  if (d.master && !hasBuilt('kunst')) return 'Braucht eine Kunstakademie';
  if (state.money < d.price) return 'Zu wenig Taler';
  return null;
}
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
const BIG_ON_TILE = new Set(['brunnen', 'kristallbrunnen', 'pavillon', 'statue', 'blumen', 'windrad', 'denkmal', 'uhrturm', 'karussell', 'lm']);
// Natur räumt das Bauen selbst weg – zum Preis von Roden bzw. Sprengen. Was ein Betrieb braucht, bleibt
// (Holzfäller im Wald, Kristallmine auf Kristallfels; Steinbruch und Bergwerk graben im Fels).
// Selbst Gebautes wird nie weggeräumt (das prüft COVER vorher), Wasser auch nicht (dafür gibt es Aufschütten).
const CLEAR_COST = { forest: 10, obst: 10, rock: 50, erz: 50, kristall: 50 };
const TERRAFORM = { wiese: 'wiese', strand: 'sand', wald: 'forest', obstwald: 'obst', fels: 'rock' };   // Pinsel → Gelände
function willClear(b, ter) {
  if (!(ter in CLEAR_COST)) return false;
  const need = ITEMS[b].needs;
  return ter !== need && !(ter === 'rock' && (need === 'rock' || need === 'erz'));
}
function clearTiles(b, x, y, rot) {
  const tiles = ITEMS[b].small || b === 'graben' ? [[x, y]] : footprint(b, x, y, ROTATABLE.has(b) ? rot : 0);
  return tiles.filter(([fx, fy]) => willClear(b, terrainAt(fx, fy)) && !(ITEMS[b].small && objAt(fx, fy)));
}
const clearCost = (b, x, y, rot = placeRot(b, x, y)) => clearTiles(b, x, y, rot).reduce((s, [fx, fy]) => s + CLEAR_COST[terrainAt(fx, fy)], 0);
function clearNature(b, x, y, rot) {
  for (const [fx, fy] of clearTiles(b, x, y, rot)) { state.money -= CLEAR_COST[terrainAt(fx, fy)]; state.terra.set(fx + ',' + fy, 'grass'); }
}
const clearLabel = (b, x, y, rot) => {
  const ters = clearTiles(b, x, y, rot).map(([fx, fy]) => terrainAt(fx, fy));
  if (!ters.length) return '';
  const blast = ters.some(t => CLEAR_COST[t] >= 50), cut = ters.some(t => CLEAR_COST[t] < 50);
  return `${blast && cut ? '🧹 Roden/Sprengen' : blast ? '🧨 Sprengen' : '🪓 Roden'} −${fmt(clearCost(b, x, y, rot))}`;
};
function smallError(b, x, y, slot, opts = {}) {
  const d = ITEMS[b], k = x + ',' + y;
  if (!ownedTile(x, y)) return notMine(x, y);
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  const t = objAt(x, y);
  if (t && (BIG_ON_TILE.has(t.b) || isBig(t.b))) return 'Hier ist kein Platz für Deko';
  if (decosAt(k) && decosAt(k)[slot]) return decosAt(k).every(Boolean) ? 'Alle 4 Ecken sind belegt' : 'Diese Ecke ist schon belegt';
  if (opts.move) return !t && terrainAt(x, y) !== 'grass' ? 'Erst roden bzw. sprengen' : null;
  if (state.money < d.cost + clearCost(b, x, y)) return 'Zu wenig Taler';
  return matError(d.mat);
}
// Ist die angetippte Ecke belegt, die nächste freie nehmen: erst die beiden Nachbarecken, dann die gegenüber
function freeSlot(x, y, slot) {
  const ds = decosAt(x + ',' + y);
  if (!ds) return slot;
  const i = [slot, slot ^ 1, slot ^ 2, slot ^ 3].find(n => !ds[n]);
  return i == null ? slot : i;
}
function buildSmall(b, x, y, slot) {
  const err = smallError(b, x, y, slot);
  if (err) { fail(err); return false; }
  const k = x + ',' + y;
  clearNature(b, x, y);
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
// Alte ganze-Feld-Dekos (Bank, Laterne, Hecke, seit 30.09. auch Bäume) in eine Ecke verschieben –
// Bäume nach hinten, damit vorn Platz für Bank oder Blumentopf bleibt
function normalizeSmall() {
  for (const [k, t] of [...state.tiles]) {
    if (!ITEMS[t.b] || !ITEMS[t.b].small) continue;
    state.tiles.delete(k);
    if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]);
    const ds = state.decos.get(k), free = (t.b === 'baum' ? [0, 3, 1, 2] : [3, 0, 1, 2]).find(i => !ds[i]);
    if (free != null) ds[free] = { b: t.b, rot: t.rot || 0 };
  }
}
const available = id => unlockOk(ITEMS[id], id);
const lockText = (id, short) => {
  const d = ITEMS[id];
  const txt = unlockText(d, short);
  return txt ? '🔒 ' + txt : '';
};
// Gebäude-Stufen (BUILD_STAGES): was fehlt noch bis zur nächsten Stufe?
const stageName = t => BUILD_STAGES[t.b] ? BUILD_STAGES[t.b].names[Math.min(t.lvl, MAX_LVL) - 1] : ITEMS[t.b].name;
const jobsOf = t => (ITEMS[t.b].workers || 0) * (BUILD_STAGES[t.b] ? Math.min(t.lvl, MAX_LVL) : 1);
function nearText(types, n, r, self) {
  const where = r === 1 ? 'direkt daneben' : `in der Nähe (${r} Felder)`;
  if (n === 1) return `${types.map(b => ITEMS[b].name).join(' oder ')} ${where}`;
  return `${n} ${types.includes(self) ? 'weitere ' : ''}${types.map(b => PLURAL[b] || ITEMS[b].name).join(' oder ')} ${where}`;
}
function stageInfo(t, x, y, pop = T.pop, jobs = T.jobs) {
  const S = BUILD_STAGES[t.b], d = ITEMS[t.b], up = S && S.up[t.lvl - 1];
  if (!up) return { next: null, conds: [], ready: false };
  const conds = [];
  if (d.workers) conds.push({ text: `👷 ${d.workers} ${d.workers === 1 ? 'freier Einwohner' : 'freie Einwohner'} als Mitarbeiter`, ok: pop - jobs >= d.workers });
  if (up.pop) conds.push({ text: `👥 ${up.pop} Einwohner auf der Insel`, ok: pop >= up.pop });
  if (up.tech) conds.push({ text: `💡 Forschung „${TECH_BY_ID[up.tech].name}“`, ok: hasTech(up.tech) });
  if (up.water) conds.push({ text: `💧 Am Wasser mit mindestens ${up.water} Feldern (auch Flüsse)`, ok: waterBody(x, y, up.water) >= up.water });
  if (up.beauty) conds.push({ text: `🌸 Schöne Umgebung (${up.beauty[0]} in ${up.beauty[1]} Feldern)`, ok: beautyAround(x, y, up.beauty[1]) >= up.beauty[0] });
  if (up.near) {
    const [types0, n, r] = up.near, types = [].concat(types0);
    conds.push({ text: nearText(types, n, r, t.b), ok: countNear(x, y, r, b => types.includes(b)) >= n });
  }
  return { next: { name: S.names[t.lvl], cost: up.cost }, conds, ready: conds.every(c => c.ok) };
}
const canPay = cost => { const { money = 0, ...mat } = cost; return state.money >= money && hasMat(mat); };
const hasBuilt = b => [...state.tiles.values()].some(t => t.b === b);

// Drehen: Beim Setzen schaut ein Gebäude von selbst mit der Tür zum Weg. Wer selbst dreht (⟳, Mausrad, R),
// behält seine Richtung, bis er das Werkzeug wechselt.
let rotManual = false;
// Felder direkt vor der Tür (vor der ganzen Vorderseite)
function frontTiles(b, x, y, rot) {
  const [w, h] = sizeOf(b, rot), [dx, dy] = FRONT_DIR[rot & 3], out = [];
  if (dx) for (let j = 0; j < h; j++) out.push([dx > 0 ? x + w : x - 1, y + j]);
  else for (let i = 0; i < w; i++) out.push([x + i, dy > 0 ? y + h : y - 1]);
  return out;
}
function autoRot(b, x, y, fallback) {
  const fits = r => footprint(b, x, y, r).every(([fx, fy]) => !COVER.has(fx + ',' + fy));
  let best = fallback, bestScore = fits(fallback) ? 0 : -1;
  const shore = ITEMS[b].needs === 'shore';           // Fischerhütte, Hafen: vorn ist das Wasser
  for (const r of [fallback, 0, 1, 2, 3]) {
    if (!fits(r)) continue;
    const front = frontTiles(b, x, y, r);
    const score = front.filter(([fx, fy]) => bAt(fx, fy) === 'weg').length + (shore ? 10 * front.filter(([fx, fy]) => isWater(fx, fy)).length : 0)
      + (b === 'station' ? 10 * front.filter(([fx, fy]) => bAt(fx, fy) === 'schiene').length : 0);   // Bahnsteig zur Schiene
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}
function placeRot(b, x, y) {
  if (!ROTATABLE.has(b)) return 0;
  if (rotManual || ITEMS[b].small) return buildRot;
  if (ITEMS[b].needs === 'pier') {                  // Seebrücke zeigt von selbst ins Wasser
    const ok = [buildRot, 0, 1, 2, 3].find(r => { const f = footprint(b, x, y, r), [dx, dy] = FRONT_DIR[r];
      const back = f.reduce((p, q) => q[0] * dx + q[1] * dy < p[0] * dx + p[1] * dy ? q : p);
      return f.every(p => p === back ? terrainAt(...p) !== 'water' : terrainAt(...p) === 'water'); });
    return ok == null ? buildRot : ok;
  }
  return autoRot(b, x, y, buildRot);
}

// Schienen über Wasser sind Brücken und kosten mehr
const BRIDGE = { cost: 40, mat: { holz: 2, metall: 2 } };
const costOf = (b, x, y) => b === 'schiene' && terrainAt(x, y) === 'water' ? BRIDGE : { cost: ITEMS[b].cost || 0, mat: ITEMS[b].mat };
const railArms = (x, y) => DIRS.filter(([dx, dy]) => bAt(x + dx, y + dy) === 'schiene');
// Bahnübergang: ein Schienenfeld mit cross (und dem Stil des Wegs), gehört zu Schienen- und Wegenetz.
// Entsteht, wenn man einen Weg über eine gerade Schiene zieht oder eine Schiene über einen Weg (nicht auf Brücken).
// foot: statt Schranken eine Fußgängerbrücke (einmal bezahlt: footPaid).
const isCrossing = t => !!t && t.b === 'schiene' && !!t.cross;
const crossingAt = (x, y) => isCrossing(state.tiles.get(x + ',' + y));
// Designs der Fußgängerbrücke. Wer umgestaltet, bekommt die alte Brücke voll zurück und zahlt die neue.
const FOOT_STYLES = {
  holz:     { name: 'Holz', icon: '🪵', cost: { money: 60, bretter: 4, metall: 2 } },
  stein:    { name: 'Stein', icon: '🧱', cost: { money: 150, quader: 8 } },
  weg:      { name: 'Wie der Weg', icon: '🎨', cost: { money: 120, bretter: 4, quader: 4 } },
  kristall: { name: 'Kristall', icon: '💎', cost: { money: 300, kristall: 5, metall: 2 } },
};
const FOOTBRIDGE = FOOT_STYLES.holz.cost;
const footPaidOf = t => t.footPaid === true ? 'holz' : (t.footPaid || null);     // alte Stände: true = Holz
const addCost = (c, sgn) => { state.money += sgn * (c.money || 0); for (const [r, n] of Object.entries(c)) if (r !== 'money') state.res[r] += sgn * n; };
function crossCandidate(b, x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t) return null;
  if (b === 'weg' && t.b === 'schiene' && !t.cross) return t;
  if (b === 'schiene' && t.b === 'weg') return t;
  return null;
}
function crossError(b, x, y) {
  const t = crossCandidate(b, x, y);
  if (!t) return 'Hier steht schon etwas';
  if (!available(b)) return `${ITEMS[b].name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (t.bridge) return 'Kein Übergang auf einer Brücke';
  const ra = railArms(x, y);
  if (ra.length > 2 || (ra.length === 2 && (ra[0][0] !== -ra[1][0] || ra[0][1] !== -ra[1][1]))) return 'Übergang nur über gerade Schienen';
  const c = costOf(b, x, y);
  if (state.money < c.cost) return 'Zu wenig Taler';
  return matError(c.mat);
}
function setCrossing(x, y, foot, style) {
  const t = state.tiles.get(x + ',' + y);
  if (!isCrossing(t)) return false;
  if (foot) {
    const had = footPaidOf(t);
    style = FOOT_STYLES[style] ? style : had || 'holz';
    if (had !== style) {
      const cost = FOOT_STYLES[style].cost, back = had ? FOOT_STYLES[had].cost : {};
      addCost(back, 1);
      if (!canPay(cost)) { addCost(back, -1); fail(state.money < cost.money ? 'Zu wenig Taler' : 'Material fehlt noch'); return false; }
      addCost(cost, -1);
      t.footPaid = style;
    }
  }
  t.foot = !!foot;
  sfx('deco'); groundVersion++; save();
  return true;
}
// Bahn: zusammenhängende Schienen sind ein Netz, Bahnhöfe gehören zum Netz direkt neben ihrer Grundfläche.
// Ein Netz mit Bahnhöfen auf mindestens zwei Inseln ist eine Linie. Ist das Netz ein Kreis (Rundkurs), fährt der Zug
// im Kreis, und ab 4 km darf man weitere Züge kaufen (1 je 2 km). Fährt ein Zug, bringt jeder Bahnhof der Linie
// Pendler (jeder weitere Zug noch einmal halb so viele), und alle Gebäude auf ihren Inseln schaffen 10 % mehr.
const COMMUTERS = 8, RAIL_BONUS = 0.1, KM = 10, KM_PER_TRAIN = 2;
const EXTRA_TRAIN = { money: 1500, metall: 10 };
// Strom ⚡: Kraftwerke liefern, egal wo sie stehen (Windrad je Stufe mehr; Forschung „Leichte Rotorblätter“ +50 % Wind,
// „Intelligentes Stromnetz“ +25 % auf alles). Verbraucher der Reihe nach: Laternen (je angefangene 10 eine ⚡), dann
// die Gebäude aus CONSUMERS, zuletzt die Züge (je 1 ⚡ + 1 ⚡ je km ihres Netzes). Wer leer ausgeht: Laternen bleiben
// nachts dunkel (halbe Schönheit), Gebäude schaffen die Hälfte (⚡ darüber), Züge stehen. Die Stadt braucht erst Strom,
// wenn es Kraftwerke gibt (oder Windräder freigeschaltet sind) – vorher läuft alles ohne.
const POWER_OUT = { windrad: [1, 2, 3], wasserkraft: [4, 8, 12], solarfeld: [3, 6, 9], geothermie: [8, 16, 24], wellen: [5, 10, 15] };   // Stufe 1–3
const LAMPS_PER_POWER = 10, NO_POWER = 0.5;
// Monumente brauchen richtig viel (je 100 ⚡, das Schloss 300) – dafür baut man sich eine Energie-Insel
const CONSUMERS = { fabrik: 2, saege: 1, hafen: 2, uni: 2, glashaus: 1, sternwarte: 100, botgarten: 100, riesenrad: 100, seebruecke: 100, schloss: 300 };   // Reihenfolge = Vorrang
const WORKSHOP_POWER = CONSUMERS.fabrik;
function powerOf(t) {
  const o = POWER_OUT[t.b];
  if (!o) return 0;
  let v = o[Math.min(t.lvl || 1, o.length) - 1];
  if (t.b === 'windrad' && hasTech('rotor')) v *= 1.5;
  if (hasTech('stromnetz')) v *= 1.25;
  return v * masteryMul('strom');
}
const trainNeed = tiles => 1 + Math.max(1, Math.ceil(tiles / KM));
// Kreis im Netz: Äste (Felder mit nur einem Nachbarn) abschneiden; bleibt genau ein Ring übrig, ist das der Rundkurs
function railLoop(tiles, rails) {
  const core = new Set(tiles), nb = k => { const [x, y] = keyXY(k); return DIRS.map(([dx, dy]) => (x + dx) + ',' + (y + dy)).filter(n => core.has(n)); };
  let changed = true;
  while (changed) { changed = false; for (const k of [...core]) if (nb(k).length < 2) { core.delete(k); changed = true; } }
  if (core.size < 4 || [...core].some(k => nb(k).length !== 2)) return null;
  const start = [...core].sort()[0], ring = [start];
  for (let prev = null, k = start; ;) {
    const next = nb(k).find(n => n !== prev);
    if (next === start) break;
    if (ring.includes(next)) return null;
    ring.push(next); prev = k; k = next;
  }
  return ring.length === core.size ? ring : null;               // zwei getrennte Ringe: kein Rundkurs
}
function computeRail() {
  const rails = new Set(), stations = [];
  let wind = 0, plants = 0;
  for (const [k, t] of state.tiles) {
    if (t.b === 'schiene') rails.add(k);
    else if (t.b === 'station') stations.push(k);
    else if (POWER_OUT[t.b]) { wind += powerOf(t); plants++; }
  }
  const comp = new Map(), netTiles = [];
  let nid = 0;
  for (const k of rails) {
    if (comp.has(k)) continue;
    const q = [k], list = [k];
    comp.set(k, nid);
    while (q.length) {
      const [x, y] = keyXY(q.pop());
      for (const [dx, dy] of DIRS) { const n = (x + dx) + ',' + (y + dy); if (rails.has(n) && !comp.has(n)) { comp.set(n, nid); q.push(n); list.push(n); } }
    }
    netTiles.push(list);
    nid++;
  }
  const byNet = new Map(), stationNet = new Map();
  for (const s of stations.sort()) {
    const t = state.tiles.get(s), [x, y] = keyXY(s);
    let net = null;
    for (const [fx, fy] of footprint(t.b, x, y, t.rot)) for (const [dx, dy] of DIRS) {
      const n = comp.get((fx + dx) + ',' + (fy + dy));
      if (n != null && net == null) net = n;
    }
    stationNet.set(s, net);
    if (net != null) { if (!byNet.has(net)) byNet.set(net, []); byNet.get(net).push(s); }
  }
  const lines = [];
  for (const [net, list] of byNet) {
    const order = r => r === 'home' ? -1 : ISLES.findIndex(i => i.id === r);   // Heimatinsel zuerst
    const regions = [...new Set(list.map(s => regionAt(...keyXY(s))))].sort((p, q) => order(p) - order(q));
    if (regions.length < 2) continue;
    const tiles = netTiles[net].length, ring = railLoop(netTiles[net], rails);
    // Rundkurs nur, wenn jeder Bahnhof direkt am Ring liegt
    const onRing = ring && list.every(s => { const t = state.tiles.get(s), [x, y] = keyXY(s), R = new Set(ring);
      return footprint(t.b, x, y, t.rot).some(([fx, fy]) => DIRS.some(([dx, dy]) => R.has((fx + dx) + ',' + (fy + dy)))); });
    const loop = onRing ? ring : null, max = loop ? Math.max(1, Math.floor(tiles / KM / KM_PER_TRAIN)) : 1;
    const looks = lineLooks(list);
    lines.push({ net, stations: list, regions, tiles, km: tiles / KM, loop, max, looks, count: Math.min(max, looks.length), need: trainNeed(tiles) });
  }
  lines.sort((a, b) => a.stations[0] < b.stations[0] ? -1 : 1);
  const power = computePower(lines, wind, plants);
  const regions = new Set(), commuters = new Map();
  for (const l of lines) if (l.powered) {
    l.regions.forEach(r => regions.add(r));
    const per = COMMUTERS * (1 + 0.5 * (l.running - 1));
    l.stations.forEach(s => commuters.set(s, Math.max(commuters.get(s) || 0, per)));
  }
  return { lines, stationNet, wind, trains: power.trains, regions, commuters, comp, power };
}
// Aussehen der Züge einer Linie (am Bahnhof gespeichert): erster Zug train/trainCol, weitere in extra
function lineLooks(stations) {
  const t = stations.map(k => state.tiles.get(k)).find(t => t && t.train) || state.tiles.get(stations[0]) || {};
  return [{ model: t.train || 'regio', col: t.trainCol || 0 }].concat((t.extra || []).map(e => ({ model: e.model || 'regio', col: e.col || 0 })));
}
function computePower(lines, supply, plants = 0) {
  const city = plants > 0 || available('windrad');
  let left = supply, demand = 0, trains = 0;
  const dark = new Set(), idle = new Set(), use = { lamps: 0, work: 0, trains: 0 };
  const take = (n, what) => { demand += n; use[what] = (use[what] || 0) + n; if (left >= n - 1e-9) { left -= n; return true; } return false; };
  if (city) {
    const lamps = [];
    for (const k of [...state.decos.keys()].sort()) state.decos.get(k).forEach((d, i) => { if (d && d.b === 'laterne') lamps.push(k + ',' + i); });
    for (let i = 0; i < lamps.length; i += LAMPS_PER_POWER) if (!take(1, 'lamps')) lamps.slice(i, i + LAMPS_PER_POWER).forEach(l => dark.add(l));
    const keys = [...state.tiles.keys()].sort();
    for (const b of Object.keys(CONSUMERS)) for (const k of keys) {
      const t = state.tiles.get(k);
      if (t.b !== b || (WONDERS[b] && !wonderDone(t))) continue;          // Baustellen brauchen noch nichts
      if (!take(CONSUMERS[b], b === 'fabrik' ? 'work' : 'build')) idle.add(k);
    }
  }
  for (const l of lines) {
    l.running = 0;
    for (let i = 0; i < l.count; i++) if (take(l.need, 'trains')) { l.running++; trains++; }
    l.powered = l.running > 0;
  }
  return { supply, demand, left, dark, idle, trains, city, use };
}
const lineOf = k => T.rail && T.rail.lines.find(l => l.stations.includes(k));
// Forschung, mit der ein Rohstoff-Betrieb auch außerhalb seines Geländes gebaut werden darf
const ANYWHERE = { forest: { tech: 'forst' }, obst: { tech: 'agrar' }, rock: { tech: 'tiefbau' }, erz: { tech: 'bohrung' } };
// Passt das Objekt mit Anker (x, y) hierhin? opts.move: beim Verschieben zählen Kosten und Einwohner nicht
function placeError(b, x, y, rot = placeRot(b, x, y), opts = {}) {
  const d = ITEMS[b];
  const r = ROTATABLE.has(b) ? rot : 0;
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (TERRAFORM[b]) {                                   // Terraforming-Pinsel
    if (!ownedTile(x, y)) return notMine(x, y);
    const k = x + ',' + y, ter = terrainAt(x, y), look = terraLook(x, y);
    if (ter === 'water') return 'Nicht auf dem Wasser – erst aufschütten';
    if (COVER.has(k)) return 'Hier steht etwas';
    if (decosAt(k) && !['wiese', 'strand'].includes(b)) return 'Hier stehen schon kleine Dekos';
    const want = TERRAFORM[b], now = look || (ter === 'grass' && isBeach(x, y) ? 'sand' : ter);
    if (now === want || (want === 'wiese' && now === 'grass')) return `Hier ist schon ${{ wiese: 'Wiese', sand: 'Strand', forest: 'Wald', obst: 'ein Obsthain', rock: 'Fels' }[want]}`;
  } else if (b === 'graben' || b === 'schuett') {
    if (!ownedTile(x, y)) return b === 'schuett' && isSea(x, y) ? (claimable(x, y) ? null : 'Im Meer nur direkt neben deinem Land') : isSea(x, y) ? 'Hier ist schon Wasser' : 'Das ist nicht dein Grundstück';
    const ter = terrainAt(x, y);
    if (b === 'graben') {
      if (COVER.has(x + ',' + y)) return 'Hier steht etwas';
      if (ter === 'water') return 'Hier ist schon Wasser';
      if (ter !== 'grass' && !willClear(b, ter)) return 'Erst roden bzw. sprengen';
    } else if (ter !== 'water') return 'Aufschütten geht nur auf Wasser';
  } else if (d.needs === 'pier') {                  // Seebrücke: hinterstes Feld an Land, der Rest im Wasser
    const tiles = footprint(b, x, y, r), [dx, dy] = FRONT_DIR[r];
    for (const [tx, ty] of tiles) {
      if (!ownedTile(tx, ty) && !(isSea(tx, ty) && inWorld(tx, ty))) return 'Das ist nicht dein Grundstück';   // ins offene Meer darf sie
      if (COVER.has(tx + ',' + ty)) return 'Hier ist nicht genug Platz';
      if (decosAt(tx + ',' + ty)) return 'Hier stehen schon kleine Dekos';
    }
    const back = tiles.reduce((p, q) => q[0] * dx + q[1] * dy < p[0] * dx + p[1] * dy ? q : p);
    const land = tiles.filter(([tx, ty]) => terrainAt(tx, ty) !== 'water');
    if (land.length !== 1 || land[0] !== back) return 'Vom Ufer aus ins Wasser bauen';
    if (terrainAt(...back) !== 'grass' && !willClear(b, terrainAt(...back))) return 'Vom Ufer aus ins Wasser bauen';
  } else {
    const tiles = footprint(b, x, y, r);
    for (const [fx, fy] of tiles) {
      const k = fx + ',' + fy, raw = terrainAt(fx, fy), ter = !opts.move && willClear(b, raw) ? 'grass' : raw;   // Natur wird weggeräumt
      // Schienen dürfen übers Wasser (Brücke), Wellenkraftwerk ins Meer, Hausboot auf jedes Wasser am Ufer
      const rail = b === 'schiene', sea = d.needs === 'meer' || d.needs === 'boot';
      if (!ownedTile(fx, fy) && !((rail || sea) && claimable(fx, fy))) return (rail || sea) && isSea(fx, fy) ? 'Im Meer nur direkt neben deinem Land' : notMine(fx, fy);
      if (sea) {
        if (COVER.has(k)) return 'Hier steht schon etwas';
        if (d.needs === 'meer' && (ter !== 'water' || !isSea(fx, fy))) return 'Ins Meer vor die Küste bauen';
        if (d.needs === 'boot' && ter !== 'water') return 'Aufs Wasser, direkt ans Ufer';
        continue;
      }
      if (COVER.has(k)) {
        if (tiles.length === 1 && b === 'weg' && crossingAt(fx, fy)) return null;             // Übergang umfärben
        if (tiles.length === 1 && crossCandidate(b, fx, fy)) return crossError(b, fx, fy);    // wird ein Bahnübergang
        return tiles.length > 1 ? 'Hier ist nicht genug Platz' : 'Hier steht schon etwas';
      }
      if (ter === 'water') { if (rail) continue; return 'Nicht auf dem Wasser'; }
      if ((BIG_ON_TILE.has(b) || tiles.length > 1) && decosAt(k)) return 'Hier stehen schon kleine Dekos';
      // Rohstoff-Betriebe brauchen ihr Gelände – nach der passenden Forschung auch auf Wiesen (grass)
      const need = d.needs, anywhere = ANYWHERE[need] && hasTech(ANYWHERE[need].tech) && (ter === 'grass' || ter === 'rock');
      if (need === 'forest' && ter !== 'forest' && !anywhere) return 'Nur im Wald – überall mit „Forstwirtschaft“';
      if (need === 'rock' && ter !== 'rock' && !anywhere) return 'Nur auf Fels – überall mit „Tiefbau“';
      if (need === 'erz' && ter !== 'erz' && !anywhere) return 'Nur auf Erzadern – überall mit „Tiefbohrung“';
      if (need === 'obst' && ter !== 'obst' && !anywhere) return 'Nur im Obsthain – überall mit „Höhere Agrartechnik“';
      if (need === 'kristall' && ter !== 'kristall') return 'Nur auf Kristallfels (Kristallinsel)';
      if (opts.move && anywhere && ter === 'rock' && need !== 'rock' && need !== 'erz') return 'Erst sprengen (Gelände → Abreißen)';
      if ((need === 'grass' || need === 'shore' || need === 'strand') && ter !== 'grass') {                  // nur noch beim Verschieben
        return ter === 'forest' || ter === 'obst' ? 'Erst roden (Gelände → Abreißen)' : 'Erst sprengen (Gelände → Abreißen)';
      }
    }
    if (d.needs === 'shore' && !tiles.some(([fx, fy]) => DIRS.some(([dx, dy]) => isWater(fx + dx, fy + dy)))) return 'Muss direkt am Wasser stehen';
    if ((d.needs === 'meer' || d.needs === 'boot') && !tiles.some(([fx, fy]) => DIRS.some(([dx, dy]) => ownedTile(fx + dx, fy + dy) && terrainAt(fx + dx, fy + dy) !== 'water'))) return d.needs === 'boot' ? 'Direkt ans Ufer legen' : 'Direkt vor die Küste bauen';
    if (d.needs === 'strand' && !tiles.every(([fx, fy]) => terraLook(fx, fy) === 'sand' || (terrainAt(fx, fy) === 'grass' && terraLook(fx, fy) !== 'wiese' && isBeach(fx, fy)))) return 'Nur auf Sand am Wasser (Strand)';
    if (d.isle && !tiles.every(([fx, fy]) => regionAt(fx, fy) === d.isle)) return `Nur auf der ${regionName(d.isle)} – dort ist der Boden warm`;
    if (!opts.move && d.workers && T.jobs + d.workers > T.pop) return 'Zu wenig Einwohner – baue Häuser';
  }
  if (d.wonder && !opts.move && [...state.tiles.values()].some(t => t.b === b)) return `${WONDERS[b].the} gibt es schon`;
  if (opts.move) return null;
  const c = costOf(b, x, y);
  if (state.money < c.cost + clearCost(b, x, y, r)) return 'Zu wenig Taler';
  return matError(c.mat);
}

// Sehenswürdigkeiten (seit 29.09. 2×2): im selben Grundstück bleiben, am liebsten dort, wo nichts im Weg ist
function lmSpot(x, y, tries) {
  const ck = chunkOf(x, y);
  const inChunk = ([ax, ay]) => footprint('lm', ax, ay, 0).every(([fx, fy]) => chunkOf(fx, fy) === ck);
  const free = ([ax, ay]) => footprint('lm', ax, ay, 0).every(([fx, fy]) => !COVER.has(fx + ',' + fy) && terrainAt(fx, fy) !== 'water');
  const all = tries.concat([[x + 1, y], [x, y + 1], [x + 1, y + 1], [x - 1, y + 1], [x + 1, y - 1]]);
  return all.find(p => inChunk(p) && free(p)) || (free([x, y]) ? [x, y] : null) || all.find(inChunk) || null;
}

// v9 (30.09.): Riesenrad, Sternwarte, Botanischer Garten und Schloss sind größer. Alte Bauwerke wachsen um ihre Mitte
// herum; Natur weicht, kleine Dekos gibt es erstattet. Wo nichts Selbstgebautes weicht, bleibt der Fortschritt –
// sonst kommt alles zurück (Baustelle und bezahlte Abschnitte).
const OLD_WONDER_SIZE = { riesenrad: [3, 3], sternwarte: [2, 2], botgarten: [3, 3], schloss: [4, 4] };
function growWonders() {
  if (!state.growWonders) return [];
  delete state.growWonders;
  const out = [];
  rebuildCover();
  for (const [k, t] of [...state.tiles]) {
    if (!OLD_WONDER_SIZE[t.b]) continue;
    const [x, y] = keyXY(k), [w, h] = sizeOf(t.b, t.rot), [ow, oh] = OLD_WONDER_SIZE[t.b];
    state.tiles.delete(k); rebuildCover();
    const tries = [];
    for (let dy = 0; dy <= h - oh; dy++) for (let dx = 0; dx <= w - ow; dx++) tries.push([x - dx, y - dy]);
    const mx = (w - ow) / 2, my = (h - oh) / 2, off = ([ax, ay]) => Math.hypot(x - ax - mx, y - ay - my);
    tries.sort((a, b) => off(a) - off(b));
    const fits = ([ax, ay], decosOk) => footprint(t.b, ax, ay, t.rot).every(([fx, fy]) => {
      const kk = fx + ',' + fy;
      return ownedTile(fx, fy) && !COVER.has(kk) && terrainAt(fx, fy) !== 'water' && (decosOk || !state.decos.has(kk));
    });
    const spot = tries.find(p => fits(p, false)) || tries.find(p => fits(p, true));
    if (spot) {
      for (const [fx, fy] of footprint(t.b, spot[0], spot[1], t.rot)) {
        const kk = fx + ',' + fy, ds = state.decos.get(kk);
        if (terrainAt(fx, fy) !== 'grass') state.terra.set(kk, 'grass');
        if (ds) {
          for (const d of ds) if (d) { state.money += ITEMS[d.b].cost || 0; for (const [r, n] of Object.entries(ITEMS[d.b].mat || {})) state.res[r] += n; }
          state.decos.delete(kk);
        }
      }
      state.tiles.set(spot[0] + ',' + spot[1], t);
      out.push({ name: ITEMS[t.b].name });
    } else {
      const paid = wonderPaid(t);
      state.money += (ITEMS[t.b].cost || 0) + (paid.money || 0);
      for (const [r, n] of Object.entries(paid)) if (r !== 'money') state.res[r] += n;
      out.push({ name: ITEMS[t.b].name, refunded: true });
    }
    rebuildCover();
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  return out;
}
function announceWonders(list) {
  if (!list.length) return;
  const back = list.filter(e => e.refunded).map(e => e.name), grown = list.filter(e => !e.refunded).map(e => e.name);
  toast([grown.length ? `🏛️ Größer geworden: ${grown.join(', ')}` : '', back.length ? `Kein Platz für ${back.join(', ')} – alles erstattet` : ''].filter(Boolean).join(' · '));
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
    let [x, y] = keyXY(k);
    // Steht es schon korrekt (keine Überlappung mit anderen Objekten)?
    state.tiles.delete(k); rebuildCover();
    const ok = (ax, ay) => placeError(t.b, ax, ay, t.rot || 0, { move: true }) === null;
    // gewachsene Grundfläche: nach hinten ausweichen, am liebsten so wenig wie möglich
    const tries = [];
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) tries.push([x - dx, y - dy]);
    tries.sort((a, b) => (x - a[0]) + (y - a[1]) - (x - b[0]) - (y - b[1]));
    let spot = tries.find(([ax, ay]) => ok(ax, ay));
    if (t.b === 'lm') spot = state.fitLm ? lmSpot(x, y, tries) : [x, y];     // nur beim Umstellen alter Stände rücken
    if ((!spot && t.b === 'rathaus') || t.b === 'lm') {
      if (!spot) spot = [x, y];
      [x, y] = spot;
      for (const [fx, fy] of footprint(t.b, x, y, t.rot)) {
        const kk = fx + ',' + fy, a = anchorAt(fx, fy);
        if (a && state.tiles.get(a).b !== 'lm') { const o = state.tiles.get(a); if (o.b !== 'weg') removed.push(ITEMS[o.b].name); refundObj(a, o); }
        const ds = state.decos.get(kk);
        if (ds) { for (const d of ds) if (d) state.money += ITEMS[d.b].cost; state.decos.delete(kk); }
        if (t.b === 'lm' && terrainAt(fx, fy) !== 'grass') state.terra.set(kk, 'grass');
        rebuildCover();
      }
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
    case 'weg': return DIRS.some(([dx, dy]) => bAt(x + dx, y + dy) === 'weg' || crossingAt(x + dx, y + dy));
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
    case 'wasser': return countAround(x, y, 3, isWater) > 0;
    default: return false;
  }
}
// Wünsche für die nächste Stufe (alle bisherigen zählen weiter mit)
// Hausausbau: Taler (steigend mit der Stufe) und Material
const houseCost = st => ({ money: st.money || 0, ...(st.mat || {}) });
function houseWishes(t, x, y) {
  const next = HOUSE_STAGES[t.lvl];
  if (!next) return { next: null, list: [], met: 0, total: 0, ready: false };
  // Stufen mit Freischaltung (Glasvilla: Kristallhöhle) bleiben bis dahin nur ein Ausblick
  if (next.lm && !unlockOk(next, 'haus:' + next.name)) return { next: null, later: next, list: [], met: 0, total: 0, ready: false };
  const ids = HOUSE_STAGES.slice(1, t.lvl + 1).flatMap(st => st.wishes);
  const list = ids.map(id => ({ id, text: WISHES[id].text, ok: wishMet(id, x, y) }));
  const met = list.filter(w => w.ok).length;
  return { next, list, met, total: list.length, ready: met === list.length };
}

function demolishInfo(x, y) {
  if (!ownedTile(x, y)) return { err: isSea(x, y) ? 'Hier ist nur Meer' : 'Das ist nicht dein Grundstück' };
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (t) {
    const d = ITEMS[t.b];
    if (t.b === 'lm') return { err: 'Sehenswürdigkeiten bleiben stehen' };
    if (d.fixed) return { err: 'Das Rathaus bleibt stehen' };
    if (d.pop) {
      const lost = d.pop * t.lvl;
      if (T.pop - lost < T.jobs) return { err: 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.' };
    }
    // Deko und Wege gibt es voll zurück (Umgestalten soll nichts kosten), Gebäude zur Hälfte – auch die Ausbau-Taler
    const full = d.cat === 'deko' || t.b === 'weg' || t.b === 'schiene';
    const paid = t.b === 'schiene' && t.bridge ? BRIDGE : { cost: d.cost, mat: d.mat };
    if (isCrossing(t)) {                             // Übergang: Schiene und Weg (und die Fußgängerbrücke) zurück
      const { money: fm, ...fmat } = footPaidOf(t) ? FOOT_STYLES[footPaidOf(t)].cost : { money: 0 }, mat = { ...d.mat };
      for (const [r, n] of Object.entries(fmat)) mat[r] = (mat[r] || 0) + n;
      return { anchor: a, refund: d.cost + ITEMS.weg.cost + fm, mat, label: 'Bahnübergang entfernen' };
    }
    const staged = BUILD_STAGES[t.b] ? BUILD_STAGES[t.b].up.slice(0, t.lvl - 1).reduce((s, u) => s + (u.cost.money || 0), 0)
      : WONDERS[t.b] ? wonderPaid(t).money : 0;
    return { anchor: a, refund: full ? paid.cost : Math.floor((d.cost + staged) / 2), mat: full ? paid.mat : null, label: `${t.bridge ? 'Brücke' : d.name} ${full ? 'entfernen' : 'abreißen'}` };
  }
  const ter = terrainAt(x, y);
  if (ter === 'forest' || ter === 'obst') return { cost: 10, label: 'Roden' };
  if (ter === 'rock' || ter === 'erz' || ter === 'kristall') return { cost: 50, label: 'Sprengen' };
  return { err: ter === 'water' ? 'Wasser: nimm „Aufschütten“' : 'Hier ist nichts zum Abreißen' };
}

let previewCache = null;
function previewDelta(b, x, y) {
  const k = x + ',' + y;
  const rot = placeRot(b, x, y);
  if (previewCache && previewCache.k === k && previewCache.b === b && previewCache.rot === rot) return previewCache;
  state.tiles.set(k, { b, lvl: 1, rot });
  const t = totals();
  state.tiles.delete(k);
  rebuildCover();
  const st = t.st.get(k) || {};
  previewCache = { k, b, rot, inc: t.inc - T.inc, beauty: t.beauty - T.beauty, sci: t.sci - T.sci, prod: st.prod, conv: st.conv,
                   pop: t.pop - T.pop, how: t.st.get(k)?.how, bonus: t.st.get(k)?.bonus || 0 };
  return previewCache;
}
