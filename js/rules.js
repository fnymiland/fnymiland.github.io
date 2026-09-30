'use strict';
// ---------------------------------------------------------------------------
// Netz: Viertel, Arbeitswege, Ideen, Einnahmen, Rohstoffe, Schönheit
// ---------------------------------------------------------------------------
const hasTech = id => state.techs.has(id);
// Grundflächen: Gebäude können mehrere Felder belegen. Gespeichert wird nur das Ankerfeld (hinterste Ecke);
// COVER sagt für jedes belegte Feld, zu welchem Anker es gehört.
// Größe (Breite in x, Höhe in y). Der Hauptbahnhof ist so breit, wie er Gleise hat (t.gleise, je 2 Felder) – dafür das
// Gebäude selbst mitgeben (t); ohne t: so, wie man ihn neu baut
const HBF_MIN = 2, HBF_MAX = 16;
const hbfGleise = t => Math.max(HBF_MIN, Math.min(HBF_MAX, (t && t.gleise) || HBF_MIN));
const sizeOf = (b, rot, t) => { const s = b === 'hbf' ? [4, 2 * hbfGleise(t)] : ITEMS[b].size || [1, 1]; return (rot & 1) ? [s[1], s[0]] : s; };
function footprint(b, ax, ay, rot, t) {
  const [w, h] = sizeOf(b, rot || 0, t), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([ax + i, ay + j]);
  return out;
}
let COVER = new Map();
// Zum Nachschlagen (Block 31, Tempo): je Gebäudesorte alle Gebäude mit ihrem Kasten, Felder nah an einem Haus (2) und
// neben einem Blumenbeet (1) – so muss nicht jedes Gebäude seine Umgebung Feld für Feld absuchen
const BY_TYPE = new Map(), HOME_NEAR = new Set(), BEET_NEAR = new Set();
function rebuildCover() {
  COVER = new Map();
  GLEIS.clear(); HALL.clear(); GEXIT.clear(); BY_TYPE.clear(); HOME_NEAR.clear(); BEET_NEAR.clear();
  for (const [k, t] of state.tiles) {
    const [x, y] = keyXY(k), [w, h] = sizeOf(t.b, t.rot, t);
    if (!BY_TYPE.has(t.b)) BY_TYPE.set(t.b, []);
    BY_TYPE.get(t.b).push([k, x, y, x + w - 1, y + h - 1]);
    const mark = (set, r) => { for (let yy = y - r; yy < y + h + r; yy++) for (let xx = x - r; xx < x + w + r; xx++) set.add(xx + ',' + yy); };
    if (isHome(t.b)) mark(HOME_NEAR, 2);
    else if (baseOf(t.b) === 'blumen') mark(BEET_NEAR, 1);
    for (const [fx, fy] of footprint(t.b, x, y, t.rot, t)) COVER.set(fx + ',' + fy, k);
    if (t.b === 'hbf') for (let g = 0; g < hbfGleise(t); g++) {
      const G = gleisTiles(t, x, y, g);
      GLEIS.set(G.hall[0].join(), { hub: k, g });
      for (const h of G.hall) HALL.add(h.join());
      GEXIT.set(G.exit.join(), [G.hall[0][0] - G.exit[0], G.hall[0][1] - G.exit[1]]);
    }
  }
}
// Hauptbahnhof (Block 29): 4 tief (vorn die Gleise, hinten das Empfangsgebäude), je Gleis 2 Felder breit (Gleis + Bahnsteig).
// Jedes Gleis ist ein Halt wie ein Bahnhof – Schlüssel: sein vorderstes Hallenfeld (GLEIS), der Zug fährt bis in die Halle
// (HALL). Im eigenen Rahmen (wie draw-kit): a nach vorn, b zur Seite; Gleis g liegt bei b = −n + ½ + 2g.
const GLEIS = new Map(), HALL = new Set(), GEXIT = new Map();   // GEXIT: Feld vor dem Gleis → Richtung in die Halle
const kitTurn = (r, a, b) => r === 0 ? [a, b] : r === 1 ? [-b, a] : r === 2 ? [-a, -b] : [b, -a];
function gleisTiles(t, x, y, g) {
  const n = hbfGleise(t), r = (t.rot || 0) & 3, [w, h] = sizeOf('hbf', r, t), cx = x + (w - 1) / 2, cy = y + (h - 1) / 2, b = -n + 0.5 + 2 * g;
  const at = a => { const [u, v] = kitTurn(r, a, b); return [Math.round(cx + u), Math.round(cy + v)]; };
  return { hall: [1.5, 0.5, -0.5].map(at), exit: at(2.5) };
}
// Gleise dazu/weg: Der Bahnhof wächst zur Seite +b (im eigenen Rahmen) – bei Drehung 1 und 2 rückt dafür der Anker, damit die
// alten Gleise bleiben, wo sie sind. Ein Gleis kostet GLEIS_COST, zurück gibt es die Hälfte der Taler.
const GLEIS_COST = { money: 2000, quader: 6, metall: 4 };
function hbfResizeError(k, d) {
  const t = state.tiles.get(k);
  if (!t || t.b !== 'hbf') return 'Kein Hauptbahnhof';
  const n = hbfGleise(t), m = n + d, r = (t.rot || 0) & 3, [x, y] = keyXY(k);
  if (m < HBF_MIN) return `Mindestens ${HBF_MIN} Gleise`;
  if (m > HBF_MAX) return `Höchstens ${HBF_MAX} Gleise`;
  if (d < 0) return null;
  const nx = r === 1 ? x - 2 * d : x, ny = r === 2 ? y - 2 * d : y, old = new Set(footprint('hbf', x, y, r, t).map(p => p.join()));
  for (const [fx, fy] of footprint('hbf', nx, ny, r, { ...t, gleise: m })) {
    if (old.has(fx + ',' + fy)) continue;
    if (!ownedTile(fx, fy)) return 'Daneben ist nicht dein Grundstück';
    if (COVER.has(fx + ',' + fy)) return 'Daneben steht etwas – dort ist kein Platz für ein Gleis';
    if (decosAt(fx + ',' + fy)) return 'Daneben stehen kleine Dekos';
    if (terrainAt(fx, fy) !== 'grass') return terrainAt(fx, fy) === 'water' ? 'Daneben ist Wasser' : 'Daneben erst roden bzw. sprengen';
  }
  return canPay(GLEIS_COST) ? null : state.money < GLEIS_COST.money ? 'Zu wenig Taler' : 'Material fehlt noch';
}
function hbfResize(k, d) {
  const err = hbfResizeError(k, d);
  if (err) { fail(err); return null; }
  const t = state.tiles.get(k), m = hbfGleise(t) + d, r = (t.rot || 0) & 3, [x, y] = keyXY(k);
  const nk = (r === 1 ? x - 2 * d : x) + ',' + (r === 2 ? y - 2 * d : y);
  if (d > 0) addCost(GLEIS_COST, -1);
  else { state.money += Math.floor(GLEIS_COST.money / 2); if (t.gleis) t.gleis.length = Math.min(t.gleis.length, m); }
  t.gleise = m; t.born = performance.now();
  if (nk !== k) { state.tiles.delete(k); state.tiles.set(nk, t); }
  sfx('build'); recalc(); save();
  return nk;
}
// Halte der Bahn: Felder, an denen er liegt (Bahnhof: Grundfläche; Gleis: seine Hallenfelder), und wo sein Zug steht
function stopFoot(k) {
  const G = GLEIS.get(k);
  if (G) { const t = state.tiles.get(G.hub), [x, y] = keyXY(G.hub); return gleisTiles(t, x, y, G.g).hall; }
  const t = state.tiles.get(k), [x, y] = keyXY(k);
  return t ? footprint(t.b, x, y, t.rot, t) : [];
}
function stopConf(k) {
  const G = GLEIS.get(k);
  if (!G) return state.tiles.get(k);
  const t = state.tiles.get(G.hub);
  if (!t.gleis) t.gleis = [];
  return t.gleis[G.g] || (t.gleis[G.g] = {});
}
// Kasten um einen Halt (für Laufweite)
const stopBox = k => { const f = stopFoot(k), xs = f.map(p => p[0]), ys = f.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const anchorAt = (x, y) => COVER.get(x + ',' + y) || null;
const objAt = (x, y) => { const a = anchorAt(x, y); return a ? state.tiles.get(a) : null; };
function bAt(x, y) { const t = objAt(x, y); return t ? t.b : null; }
const isBig = b => { const s = ITEMS[b].size; return !!s && (s[0] > 1 || s[1] > 1); };

// Felder rund um ein Objekt – bei großen Gebäuden rund um die ganze Grundfläche
function aroundTiles(x, y, r) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = t ? keyXY(a) : [x, y];
  const [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
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
function countNear(x, y, r, pred, stop = Infinity) {   // Gebäude zählen – jedes nur einmal, auch wenn es groß ist
  if (r > 2) return nearList(x, y, r, pred, stop).length;   // weit: über die Liste je Sorte statt Feld für Feld
  const seen = new Set();
  for (const [a, b] of aroundTiles(x, y, r)) {
    const k = anchorAt(a, b);
    if (k && !seen.has(k) && pred(state.tiles.get(k).b)) seen.add(k);
  }
  return seen.size;
}
// Gebäude der Sorte (pred) mit einem Feld im Umkreis r um das Objekt bei (x, y) – ohne es selbst; höchstens stop Stück
function nearList(x, y, r, pred, stop = Infinity) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a), [ax, ay] = t ? keyXY(a) : [x, y], [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
  const x1 = ax + w - 1, y1 = ay + h - 1, out = [];
  for (const [b, list] of BY_TYPE) {
    if (!pred(b)) continue;
    for (const e of list) {
      if (e[0] === a || Math.max(0, e[1] - x1, ax - e[3], e[2] - y1, ay - e[4]) > r) continue;
      if (STANDS[b] && !MARKT_OK.has(e[0])) continue;                  // einzelne Stände sind noch kein Marktplatz
      out.push(e[0]);
      if (out.length >= stop) return out;
    }
  }
  return out;
}
const isWater = (x, y) => terrainAt(x, y) === 'water';
// Größe des Gewässers, an dem ein Gebäude liegt (alle Wasserfelder, die zusammenhängen und direkt angrenzen –
// so zählen auch schmale, lange Flüsse). Gezählt wird höchstens bis limit.
function waterBody(x, y, limit = 64) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = t ? keyXY(a) : [x, y], [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
  const seen = new Set(), todo = [];
  const add = (px, py) => { const k = px + ',' + py; if (!seen.has(k) && isWater(px, py)) { seen.add(k); todo.push([px, py]); } };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) for (const [dx, dy] of DIRS) add(ax + i + dx, ay + j + dy);
  while (todo.length && seen.size < limit) { const [px, py] = todo.pop(); for (const [dx, dy] of DIRS) add(px + dx, py + dy); }
  return Math.min(seen.size, limit);
}
const isProducerB = b => ITEMS[b].cat === 'bau';
const isHouse = (x, y) => isHome(bAt(x, y));               // jedes Wohnhaus (Sorte „haus“)
// Regeln (gemeinsam festgelegt): Viertel über Nachbarschaft und Wege, Fußweg 4 Felder, sonst halbe Kraft
const WALK_REACH = 4, FAR_EFF = 0.5;
const VIERTEL_STEPS = [[15, 0.3], [8, 0.2], [3, 0.1]];
const LM_RADIUS = 10, LM_BOOST = 0.15;
const needsReach = b => b === 'lm' || !!ITEMS[b].workers;
const countsForViertel = b => b !== 'weg' && b !== 'schiene';

// Viertel: alles Bebaute (Gebäude, Wege, Dekos), das direkt oder über Eck aneinandergrenzt.
// Wege verbinden so auch weit entfernte Orte mit dem Dorf.
// (Tempo, Block 31: Felder als Zahlen, zusammengefasst in einem Feld statt über Text-Schlüssel)
const NET_OFF = 1 << 15, netNum = (x, y) => (x + NET_OFF) * 65536 + (y + NET_OFF);
function computeNet() {
  // Schienen verbinden keine Viertel: verbundene Inseln bleiben eigene Orte (der Zug bringt Pendler und Bonus)
  const keys = [], xs = [], ys = [], idOf = new Map(), idKey = new Map();
  const occ = k => { if (idKey.has(k)) return; const [x, y] = keyXY(k); idKey.set(k, keys.length); idOf.set(netNum(x, y), keys.length); keys.push(k); xs.push(x); ys.push(y); };
  for (const [k, a] of COVER) { const t = state.tiles.get(a); if (!t || t.b !== 'schiene' || t.cross) occ(k); }
  for (const k of state.decos.keys()) occ(k);
  const parent = new Int32Array(keys.length);
  for (let i = 0; i < parent.length; i++) parent[i] = i;
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < keys.length; i++) for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const j = idOf.get(netNum(xs[i] + dx, ys[i] + dy));
    if (j === undefined) continue;
    const a = find(i), b = find(j);
    if (a !== b) parent[a] = b;
  }
  const vOf = k => { const i = idKey.get(k); return i === undefined ? null : keys[find(i)]; };
  const vSize = new Map(), vHome = new Set();
  for (const [k, t] of state.tiles) {
    const v = vOf(k);
    if (countsForViertel(t.b)) vSize.set(v, (vSize.get(v) || 0) + 1);
    if (isHome(t.b)) vHome.add(v);
  }
  for (const k of state.decos.keys()) if (!COVER.has(k)) { const v = vOf(k); vSize.set(v, (vSize.get(v) || 0) + 1); }
  // Häuser in Laufweite
  const houses = [];
  for (const [k, t] of state.tiles) if (isHome(t.b)) houses.push(keyXY(k));
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
    case 'fabrik': return (25 + 5 * countNear(x, y, 3, b => b === 'mine')) * (hasTech('dampf') ? 1.5 : 1);
    case 'leuchtturm': return 10;
    case 'ferienhaus': return 6;                     // Feriengäste
    case 'hafen': return FISH_INC;                   // je Fischkutter (so viele, wie der Hafen Stufen hat)
    default: return 0;
  }
}
// Blumenbeet daneben / Haus in der Nähe: erst im Nachschlage-Satz fragen (fast immer: nein), nur dann genau zählen
const inSet = (set, x, y) => { const a = anchorAt(x, y), t = a && state.tiles.get(a); if (!t) return set.has(x + ',' + y);
  const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (set.has((ax + i) + ',' + (ay + j))) return true; return false; };
const beetBonus = (x, y) => inSet(BEET_NEAR, x, y) ? countNear(x, y, 1, b => baseOf(b) === 'blumen') : 0;
// (für alles außer Häusern ist der Satz schon genau; ein Haus zählt sich selbst nicht)
const nearHouse = (x, y) => { if (!inSet(HOME_NEAR, x, y)) return false; const t = objAt(x, y); return !(t && isHome(t.b)) || countNear(x, y, 2, isHome) > 0; };
function beautyOf(t, x, y) {
  const d = ITEMS[t.b];
  const nearHome = ((d.beauty && d.cat === 'deko') || d.ugly) && nearHouse(x, y);   // nur fragen, wenn es zählt
  let v = 0;
  if (d.wonder && !wonderDone(t)) return 0;                              // Baustelle
  if (d.beauty) v += d.beauty * (nearHome && d.cat === 'deko' ? 1.5 : 1) * (t.b === 'kunst' && hasTech('kunst') ? 1.5 : 1);
  if (d.ugly && nearHome) v -= d.ugly;
  return v;
}

// Läden (Block 30): Einwohner je Viertel, Besucher je Insel (so viele, wie ankommen), gleiche Läden je Viertel,
// Innenstadt: verschiedene Läden in einem Viertel (die Passage zählt dreifach, das Kaufhaus doppelt)
const INNER_STEPS = [[15, 1], [10, 0.5], [6, 0.25], [3, 0.1]];
// Vorrat (Block 33): Läden verkaufen nur, was über dem Vorrat liegt – Baumaterial bleibt standardmäßig 2.000 im Lager.
// Einstellbar je Ware im 📦 Lager (state.keep; fehlt ein Eintrag, gilt KEEP_DEFAULT). KEEP_ALL = alles behalten.
// Rohstoffe (Block 37): Holz, Stein, Erz bleiben 500 für Sägewerk, Steinmetz und Schmiede, Obst 2.000 für Laternen und
// Wunder (Botanischer Garten 600, Schloss 1.000 auf einmal) –
// sonst verkaufen Markthalle, Hofladen und Eisdiele alles, bevor es verarbeitet wird.
const KEEP_DEFAULT = { holz: 500, stein: 500, erz: 500, obst: 2000, bretter: 2000, quader: 2000, metall: 2000, kristall: 2000 }, KEEP_ALL = 1e15;
const KEEP_STEPS = [0, 500, 2000, 10000, 50000, 250000, KEEP_ALL];
const keepOf = r => (state.keep && state.keep[r] != null ? state.keep[r] : KEEP_DEFAULT[r] || 0);
const saleable = r => Math.max(0, state.res[r] - keepOf(r));
function cycleKeep(r) {
  const i = KEEP_STEPS.indexOf(keepOf(r)), next = KEEP_STEPS[(i + 1) % KEEP_STEPS.length];
  if (!state.keep) state.keep = {};
  state.keep[r] = next;
  recalc(); save();                                   // haltbarer Verkauf (T.salesInc) ändert sich mit
  return next;
}
// Personal (Block 37): Ein Laden bedient höchstens SHOP_SERVE Kunden je Mitarbeiter – große Viertel brauchen einen zweiten.
// Besucher (Block 37): gleiche Läden einer Insel teilen sie sich (sonst zählten sie in jedem Viertel neu).
const SHOP_SERVE = 150;
const shopCap = b => (SHOPS[b].workers || 1) * SHOP_SERVE;
// Kaufkraft (Block 37): Die Leute eines Viertels geben nur so viel aus – die Ladenarten mit dem besten Ertrag je
// Rate-Punkt zählen bis zur Summe KAUF_BUDGET (etwa 8–10 kleine Läden) voll, alle weiteren Punkte nur KAUF_OVER.
// Nachgebaute Läden (gleiche Art) zählen nicht neu. In Summe 0,75 × beste 40 Punkte + 0,25 × alle: ein Laden senkt so
// nie das Einkommen – er bringt nur weniger dazu (ein Faktor für das ganze Viertel konnte es senken).
const KAUF_BUDGET = 40, KAUF_OVER = 0.25;
const kaufFactor = R => R <= KAUF_BUDGET ? 1 : (KAUF_BUDGET + KAUF_OVER * (R - KAUF_BUDGET)) / R;   // Durchschnitt (Anzeige)
// kinds: [{ b, rate, value }] eines Viertels → Map(b → Faktor)
function kaufShares(kinds) {
  const out = new Map();
  let left = KAUF_BUDGET;
  for (const e of [...kinds].sort((a, b) => b.value / b.rate - a.value / a.rate || (a.b < b.b ? -1 : 1))) {
    const full = Math.min(e.rate, Math.max(0, left));
    left -= full;
    out.set(e.b, (full + KAUF_OVER * (e.rate - full)) / e.rate);
  }
  return out;
}
function shopWorld(net, links) {
  const vPop = new Map(), visitors = new Map(), kinds = new Map(), isleKinds = new Map();
  for (const [k, t] of state.tiles) {
    if (SHOPS[t.b]) { const r = regionAt(...keyXY(k)); if (!isleKinds.has(r)) isleKinds.set(r, new Map()); const m = isleKinds.get(r); m.set(t.b, (m.get(t.b) || 0) + 1); }
    const v = net.vOf(k);
    if (!v) continue;
    if (isHome(t.b)) vPop.set(v, (vPop.get(v) || 0) + popOf(t));
    if (SHOPS[t.b]) { if (!kinds.has(v)) kinds.set(v, new Map()); const m = kinds.get(v); m.set(t.b, (m.get(t.b) || 0) + 1); }
  }
  for (const l of links) if (l.traffic) for (const [r, n] of l.traffic.visits) visitors.set(r, (visitors.get(r) || 0) + n * l.traffic.served);
  const types = v => { const m = v && kinds.get(v); return m ? [...m.keys()].reduce((a, b) => a + (SHOPS[b].types || 1), 0) : 0; };
  const inner = v => { const n = types(v); for (const [min, b] of INNER_STEPS) if (n >= min) return b; return 0; };
  const rateSum = v => { const m = v && kinds.get(v); return m ? [...m.keys()].reduce((a, b) => a + SHOPS[b].rate, 0) : 0; };
  return { vPop, visitors, rateSum, count: (v, b) => (kinds.get(v) && kinds.get(v).get(b)) || 0, isleCount: (r, b) => (isleKinds.get(r) && isleKinds.get(r).get(b)) || 0, types, inner };
}

let NET = null;
const HARBOR_CAP = 3;                  // Block 37: nur die drei besten Häfen geben ihren Bonus (vorher ohne Grenze)
function totals() {
  rebuildCover();
  computeMarkets();
  const net = computeNet();
  const st = new Map();
  const lmOn = new Map(), lmHalf = new Map();       // Typ → [x, y]
  let pop = 0, jobs = 0;
  const rail = computeRail();
  // Verkehr: Fahrgäste je fahrender Linie; Anbindung über Bahnhöfe (ihr Viertel und bis 4 Felder darum)
  const places = placeStats();
  const cables = cablePairs().map(([a, b, d]) => ({ kind: 'seil', stations: [a, b], km: d / KM, seats: SEIL_SEATS,
    regions: [...new Set([a, b].map(k => regionAt(...keyXY(k))))].sort(byRegion) }));
  const ferries = shipLinks();
  for (const l of rail.lines) l.traffic = null;
  const links = [...rail.lines.filter(l => l.powered), ...cables, ...ferries.filter(f => !f.noSea)];
  transitTraffic(links, places);
  const railV = new Map(), railSt = [];
  for (const l of links) for (const s of l.stations) {
    const f = l.traffic.served, v = net.vOf(s);
    if (v) railV.set(v, Math.max(railV.get(v) || 0, f));
    railSt.push([...stopBox(s), f]);
  }
  const railReach = (k, t, x, y) => {
    const [w, h] = sizeOf(t.b, t.rot, t), x1 = x + w - 1, y1 = y + h - 1;
    let f = railV.get(net.vOf(k)) || 0;
    for (const [a0, b0, a1, b1, g] of railSt) {
      if (Math.max(0, a0 - x1, x - a1, b0 - y1, y - b1) <= WALK_REACH) f = Math.max(f, g);
    }
    return f;
  };
  // Erreichbarkeit, Viertel, Sehenswürdigkeiten
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    jobs += jobsOf(t);
    pop += popOf(t);
    const s = { ...(needsReach(t.b) ? reachOf(net, k, x, y) : { eff: 1, how: null }), ...viertelBonus(net, k) };
    if (s.how === 'weit') {                                    // mit dem Zug erreichbar: so gut, wie die Linie es schafft
      const f = railReach(k, t, x, y);
      if (f > 0) { s.how = 'bahn'; s.served = f; s.eff = FAR_EFF + (1 - FAR_EFF) * f; }
    }
    st.set(k, s);
    // Sehenswürdigkeiten wirken erst, wenn sie mindestens eine Stufe restauriert sind
    if (t.b === 'lm' && ownedTile(x, y) && lmStage(t.lm) >= 1) {
      s.road = s.how === 'viertel' || s.how === 'bahn';
      (s.how === 'weit' || (s.how === 'bahn' && s.served < 0.5) ? lmHalf : lmOn).set(t.lm, [x, y]);
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
  const harbors = [...state.tiles].filter(([, t]) => t.b === 'hafen').map(([k]) => off(k)).sort((a, b) => b - a).slice(0, HARBOR_CAP).reduce((n, f) => n + f, 0);
  const gmul = 1 + (hasTech('schiffbau') ? 0.12 : 0.08) * harbors;
  // Fertige Wunderwerke (Block 28): Wunder → 1, ohne Strom ½
  const won = {};
  for (const [k, t] of state.tiles) if (WONDERS[t.b] && wonderDone(t)) won[t.b] = Math.max(won[t.b] || 0, off(k));
  const green = won.botgarten ? 1 + won.botgarten : 1;                   // Botanischer Garten: Obst und Felder doppelt
  const SW = shopWorld(net, links), sales = [], shopTiles = [];
  let marktInc = 0;
  const schoolFactor = Math.min(1, pop / 15);
  let inc = 0, sci = 0, beauty = 0;
  const prod = {}, conv = [];
  const mT = masteryMul('taler'), mR = masteryMul('rohstoffe');          // Stufen-Forschung
  for (const [k, t] of state.tiles) {
    const d = ITEMS[t.b];
    const [x, y] = keyXY(k);
    beauty += beautyOf(t, x, y) * (baseOf(t.b) === 'glashaus' || t.b === 'botgarten' ? off(k) : 1);
    if (t.b === 'lm') continue;
    const s = st.get(k);
    if (idle.has(k)) s.noPower = true;
    s.lmb = lmNear(x, y);
    const m = s.eff * (1 + s.bonus) * s.lmb;
    if (d.prod) {
      s.prod = {};
      for (const [r, base] of Object.entries(d.prod)) {
        let v = base * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * mR;
        if (t.b === 'mine' && lmOn.has('erzberg')) v *= 1.25;
        if (t.b === 'holz' && hasTech('axt')) v *= 1.3;
        if (t.b === 'obst') v *= green;
        s.prod[r] = v; prod[r] = (prod[r] || 0) + v;
      }
    }
    if (d.conv) {
      s.conv = d.conv.rate * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * off(k) * mR;
      conv.push({ ...d.conv, rate: s.conv });
    }
    if (d.cat === 'bau' && !d.prod && !d.conv) {
      let v = rawIncome(t.b, x, y) * t.lvl * (1 + 0.15 * beetBonus(x, y)) * m * gmul;
      v *= off(k) * mT * (t.b === 'feld' ? green : 1);                         // ohne Strom halb; Handelskunst; Garten
      if (t.b === 'muehle' && klippe && lmStage('klippe') >= 2 && Math.hypot(x - klippe[0], y - klippe[1]) <= LM_RADIUS) v *= 1 + lmFactor('klippe');
      s.inc = v; inc += v;
    }
    if (d.shop) {                                                             // Läden und Kultur (Block 30)
      const S = SHOPS[t.b], v = net.vOf(k), r = regionAt(x, y), inner = SW.inner(v), f = m * off(k);
      s.same = v ? SW.count(v, t.b) : 1; s.sameIsle = Math.max(1, SW.isleCount(r, t.b));
      const want = ((v && SW.vPop.get(v)) || 0) / Math.max(1, s.same) + (SW.visitors.get(r) || 0) / s.sameIsle, kd = Math.min(want, shopCap(t.b));
      s.kunden = kd; s.want = want; s.full = want > kd + 0.5; s.inner = inner; s.types = SW.types(v);
      s.markt = nearMarket(x, y, ...sizeOf(t.b, t.rot, t));                // Marktviertel (Block 39)
      s.base = S.rate / 100 * kd * f * mT * (1 + inner) * (s.markt ? 1 + MARKT_BONUS : 1);   // vor der Kaufkraft – die teilt unten je Viertel
      shopTiles.push([v, t.b, s]);
      const wares = S.ware ? [S.ware] : S.raw ? ['holz', 'stein', 'erz', 'obst'] : S.all ? Object.keys(RES) : [];
      s.sales = wares.map(r => ({ k, res: r, rate: S.sell / 100 * kd * f, pay: TRADE_PRICE[r] * SALE_MUL * mT * (1 + inner) }));
      sales.push(...s.sales);
    }
    if (d.science) {
      const v = d.science * t.lvl * m * (t.b === 'schule' ? schoolFactor : 1) * (t.b === 'bibliothek' && hasTech('bibliothek') ? 2 : 1) * off(k);
      s.sci = v; sci += v;
    }
  }
  for (const [, e] of state.edges) beauty += ITEMS[e.b].beauty + (e.arch ? ARCHES[e.arch].beauty : 0);   // Hecken, Zäune, Mauern, Torbögen
  for (const [k, ds] of state.decos) {
    const [x, y] = keyXY(k), nearHome = nearHouse(x, y) || isHouse(x, y);
    ds.forEach((d, i) => { if (d) beauty += ITEMS[d.b].beauty * (nearHome ? 1.5 : 1) * (rail.power.dark.has(k + ',' + i) ? NO_POWER : 1); });
  }
  // Kaufkraft je Viertel: Arten nach Ertrag je Rate-Punkt, die besten KAUF_BUDGET Punkte voll (kaufShares)
  const byV = new Map();
  for (const [v, b, s] of shopTiles) {
    if (!byV.has(v)) byV.set(v, new Map());
    const m = byV.get(v), e = m.get(b) || { b, rate: SHOPS[b].rate, value: 0 };
    e.value += s.base; m.set(b, e);
  }
  const shares = new Map([...byV].map(([v, m]) => [v, v ? kaufShares(m.values()) : null]));
  for (const [v, b, s] of shopTiles) {
    s.buy = shares.get(v) ? shares.get(v).get(b) : 1;
    s.inc = s.base * s.buy; inc += s.inc;
    if (s.markt) marktInc += s.inc;
  }
  // Eigene Effekte der Sehenswürdigkeiten (weit weg ohne Weg: halb; Touristen nur per Weg)
  const quelle = [...state.tiles].find(([, t]) => t.lm === 'quelle');
  if (quelle && (lmOn.has('quelle') || lmHalf.has('quelle'))) {
    beauty += 40 * lmFactor('quelle');
    if (st.get(quelle[0]).road && lmStage('quelle') >= 3) inc += 12 * gmul * mT;
  }
  sci += 1.5 * lmFactor('ruine') + 3 * lmFactor('kristall');
  if (hasTech('sterne')) sci *= 1.2;
  // Wunderwerke (nur fertige): dauerhafte Boni (ohne Strom halb) – Riesenrad Einnahmen, Sternwarte Ideen, Seebrücke
  // Einwohner, Garten Schönheit, Schloss alles
  const wm = key => Object.entries(won).reduce((a, [b, f]) => a + (WONDERS[b].effect[key] || 0) * f, 0);
  const allMul = wm('allMul');
  sci *= 1 + wm('sciMul');
  pop *= 1 + wm('popMul');
  beauty *= 1 + wm('beautyMul');
  // Verkehr: Fahrkarten und was die Besucher am Ziel ausgeben
  let fare = 0, spend = 0;
  for (const l of links) { fare += l.traffic.fare; spend += l.traffic.spend; }
  inc += (fare + spend) * mT;
  inc *= 1 + wm('incMul');
  if (allMul) { inc *= 1 + allMul; sci *= 1 + allMul; for (const r of Object.keys(prod)) prod[r] *= 1 + allMul; }
  // Warenverkauf, der sich dauerhaft halten lässt (was nachkommt, nicht der Lagerbestand) – für Preise nach Einkommen.
  // Umwandlungen nur, soweit ihr Rohstoff nachkommt; Waren mit „alles behalten“ werden nie verkauft.
  const need = {};
  for (const c of conv) need[c.from] = (need[c.from] || 0) + c.rate * CONV_RATIO;
  const scale = r => need[r] > 0 ? Math.min(1, (prod[r] || 0) / need[r]) : 1;
  const salesInc = Object.entries(sales.reduce((m, sl) => { const e = m[sl.res] || (m[sl.res] = { want: 0, pay: 0 }); e.want += sl.rate; e.pay += sl.rate * sl.pay; return m; }, {}))
    .filter(([r]) => keepOf(r) < KEEP_ALL)
    .reduce((a, [r, e]) => {
      const made = (prod[r] || 0) + conv.filter(c => c.to === r).reduce((n, c) => n + c.rate * scale(c.from), 0) - (need[r] || 0) * scale(r);
      return a + Math.min(e.want, Math.max(0, made)) * (e.want > 0 ? e.pay / e.want : 0);
    }, 0);
  beauty += 15 * lmFactor('obsthain') + [0, 20, 40, 80][lmStage('baum')] * lmFactor('baum');
  // Wünsche der Häuser (für Sprechblasen und Infofenster)
  const access = buildAccess(net, links);
  access.green = !!won.botgarten;
  for (const [k, t] of state.tiles) if (t.b === 'haus') { const [x, y] = keyXY(k); st.get(k).wish = houseWishes(t, x, y, access); }
  // Gebäude-Stufen (für ✨ und Infofenster)
  for (const [k, t] of state.tiles) if (BUILD_STAGES[t.b]) { const [x, y] = keyXY(k); st.get(k).grow = stageInfo(t, x, y, pop, jobs, access); }
  pop = Math.round(pop * masteryMul('einwohner'));
  return { inc, pop, jobs, sci, prod, conv, beauty: Math.max(0, Math.round(beauty * masteryMul('schoen'))), lm: lmOn.size, lmOn, lmHalf, st, net, rail,
    traffic: { fare: fare * mT, spend: spend * mT, places, links }, cables, ferries, access, wonders: won, sales, salesInc, marktInc: marktInc * (1 + wm('incMul')) * (1 + allMul), markets: MARKETS };
}
let T = { inc: 0, pop: 0, jobs: 0, sci: 0, prod: {}, conv: [], beauty: 0, lm: 0, lmOn: new Map(), lmHalf: new Map(), st: new Map(),
  rail: { lines: [], stationNet: new Map(), wind: 0, trains: 0, comp: new Map(),
    power: { supply: 0, demand: 0, left: 0, dark: new Set(), idle: new Set(), trains: 0, city: false, use: { lamps: 0, work: 0, trains: 0 } } },
  traffic: { fare: 0, spend: 0, places: { pop: new Map(), attr: new Map() }, links: [] }, cables: [], ferries: [] };
function recalc() { if (BATCH) return; T = totals(); NET = T.net; previewCache = null; groundVersion++; if (!moving) state.incPeak = Math.max(state.incPeak || 0, Math.round(T.inc + (T.salesInc || 0))); }
// Bestes Einkommen sinkt langsam zum jetzigen (Halbwertszeit PEAK_HALF s), damit Preise nach einem Umbau nicht ewig
// zu hoch bleiben – aber nicht, solange etwas getragen wird (✋ Wegschieben macht nichts billiger).
const PEAK_HALF = 1200;
function peakTick(dt) {
  if (moving || !state.incPeak) return;
  const now = T.inc + (T.salesInc || 0);
  if (state.incPeak > now) state.incPeak = Math.round(now + (state.incPeak - now) * Math.pow(0.5, dt / PEAK_HALF));
}
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
  if (def.garden && !wonderOn(def.garden)) return false;               // exotische Deko: erst mit dem Botanischen Garten
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
  if (def.garden && !wonderOn(def.garden)) return '🌿 Botanischer Garten';
  if (def.album && !albumDone(def.album)) return `📒 volle Album-Seite „${ALBUM.find(p => p.id === def.album).name}“`;
  if (def.invention && !(state.inventions && state.inventions.has(def.invention))) return `💡 Erfindung ${INVENTIONS.find(i => i.id === def.invention).name}`;
  return '';
}
const styleOk = st => unlockOk(st, (st.kind || 'weg') + ':' + st.id);
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
// Kleine Dekos (Block 42): 8 Plätze pro Feld – 4 Ecken (0 hinten, 1 rechts, 2 links, 3 vorn) und 4 Seitenmitten
// (4 −u oben links, 5 −v oben rechts, 6 +u unten rechts, 7 +v unten links). Auf einem Weg liegen die Seitenmitten am
// Wegrand – dort stehen Bänke und Laternen, zum Weg gedreht. Auf Gebäudefeldern nur die Ecken.
const SLOTS = 8, SLOT_OFF = 0.3, MID_OFF = 0.38;
const MID_UV = [[-MID_OFF, 0], [0, -MID_OFF], [MID_OFF, 0], [0, MID_OFF]];
const slotUV = i => i < 4 ? [(i & 1 ? 1 : -1) * SLOT_OFF, (i & 2 ? 1 : -1) * SLOT_OFF] : MID_UV[i - 4];
const newSlots = () => Array(SLOTS).fill(null);
// Seitenmitte mit Hecke/Zaun/Mauer an dieser Seite: etwas nach innen, damit die Bank nicht in der Hecke steht
const MID_SIDE = [[-1, 0], [0, -1], [1, 0], [0, 1]], MID_IN = 0.28;
function slotPos(x, y, i) {
  if (i < 4 || !state.edges.size) return slotUV(i);
  const [dx, dy] = MID_SIDE[i - 4];
  return state.edges.has(edgeBetween(x, y, x + dx, y + dy)) ? [dx * MID_IN, dy * MID_IN] : slotUV(i);
}
const SLOTS_BACK = [0, 4, 5], SLOTS_FRONT = [1, 2, 3, 6, 7];      // hinter bzw. vor dem Ding auf dem Feld zeichnen
const decosAt = k => state.decos.get(k);
function slotAt(sx, sy) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  const a = (px / (TW / 2) + py / (TH / 2)) / 2, b = (py / (TH / 2) - px / (TW / 2)) / 2;
  const x = Math.round(a), y = Math.round(b), du = a - x, dv = b - y;
  let slot = 0, best = Infinity;                                 // der nächste der 8 Plätze
  for (let i = 0; i < SLOTS; i++) { const [u, v] = slotUV(i), d = (u - du) ** 2 + (v - dv) ** 2; if (d < best) { best = d; slot = i; } }
  return { x, y, slot };
}
const BIG_ON_TILE = new Set(['brunnen', 'kristallbrunnen', 'pavillon', 'statue', 'blumen', 'windrad', 'denkmal', 'uhrturm', 'karussell', 'lm', ...Object.keys(STANDS),
  ...Object.keys(ITEMS).filter(id => ITEMS[id].variantOf && !ITEMS[id].small && !ITEMS[id].size)]);   // Größe „Mittel“ kleiner Deko belegt das Feld
// Linien auf Feldkanten (Block 41). Eckpunkt (i, j) = obere Ecke von Feld (i, j), also bei (i − ½, j − ½).
// Kante 'a' i,j läuft von (i, j) nach (i + 1, j) – zwischen Feld (i, j − 1) und (i, j); 'b' i,j von (i, j) nach (i, j + 1) –
// zwischen Feld (i − 1, j) und (i, j). Jedes Feld zeichnet seine beiden hinteren Kanten 'a' x,y und 'b' x,y vor sich selbst.
function edgeKeyOf(p, q) {
  if (p.y === q.y && Math.abs(p.x - q.x) === 1) return 'a' + Math.min(p.x, q.x) + ',' + p.y;
  if (p.x === q.x && Math.abs(p.y - q.y) === 1) return 'b' + p.x + ',' + Math.min(p.y, q.y);
  return null;
}
const edgeParse = k => { const [i, j] = k.slice(1).split(',').map(Number); return { dir: k[0], i, j }; };
const edgeTiles = k => { const { dir, i, j } = edgeParse(k); return dir === 'a' ? [[i, j - 1], [i, j]] : [[i - 1, j], [i, j]]; };
const edgeBetween = (x, y, nx, ny) => nx === x ? 'a' + x + ',' + Math.max(y, ny) : 'b' + Math.max(x, nx) + ',' + y;
// Wo ein Weg durch die Linie geht (Weg auf beiden Seiten), ist ein Tor bzw. eine Lücke
const isGate = k => edgeTiles(k).every(([x, y]) => wegUnder(state.tiles.get(x + ',' + y)) != null || crossingAt(x, y));
const edgeBlocks = (x, y, nx, ny) => { const k = edgeBetween(x, y, nx, ny); return state.edges.has(k) && !isGate(k); };
// Runde Ecke: am Eckpunkt (i, j) genau eine waagerechte und eine senkrechte Linie derselben Art (kein Tor) → Viertelkreis
// (Radius ROUND_R). Liegt innen ein Weg (inPath), folgt er dem Bogen (lineFill); liegt der Weg außen (Innenseite einer
// Wegkurve, outWeg = sein Stil), füllt drawArc die kleine Fläche zwischen Bogen und Ecke im Wegbelag
const ROUND_R = 0.35;
function roundCorner(i, j) {
  const A = [['a' + (i - 1) + ',' + j, -1], ['a' + i + ',' + j, 1]].filter(([k]) => state.edges.has(k));
  const B = [['b' + i + ',' + (j - 1), -1], ['b' + i + ',' + j, 1]].filter(([k]) => state.edges.has(k));
  if (A.length !== 1 || B.length !== 1) return null;
  const [ka, du] = A[0], [kb, dv] = B[0], ea = state.edges.get(ka), eb = state.edges.get(kb);
  if (ea.b !== eb.b || isGate(ka) || isGate(kb)) return null;
  const tx = du > 0 ? i : i - 1, ty = dv > 0 ? j : j - 1, ox = du > 0 ? i - 1 : i, oy = dv > 0 ? j - 1 : j;
  const inPath = wegUnder(state.tiles.get(tx + ',' + ty)) != null, outWeg = inPath ? null : wegUnder(state.tiles.get(ox + ',' + oy));
  return { ka, kb, du, dv, b: ea.b, style: ea.style, V: [i - 0.5, j - 0.5], inPath, outWeg };
}
// Punkte des Viertelkreises (Feld-Koordinaten), vom waagerechten zum senkrechten Stück
function roundArc(rc, n = 6) {
  const { du, dv, V } = rc, c = [V[0] + du * ROUND_R, V[1] + dv * ROUND_R];
  const a0 = Math.atan2(-dv, 0), a1 = Math.atan2(0, -du);
  let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  return Array.from({ length: n + 1 }, (_, s) => { const a = a0 + d * s / n; return [c[0] + Math.cos(a) * ROUND_R, c[1] + Math.sin(a) * ROUND_R]; });
}
function edgeError(b, k) {
  const tiles = edgeTiles(k);
  if (!tiles.some(([x, y]) => ownedTile(x, y))) return 'Das ist nicht dein Grundstück';
  if (tiles.every(([x, y]) => terrainAt(x, y) === 'water')) return 'Nicht mitten im Wasser';
  const [p, q] = tiles.map(([x, y]) => COVER.get(x + ',' + y));
  if (p && p === q) return 'Nicht mitten durch ein Gebäude';
  return null;
}
// Freies Ende: an diesem Eckpunkt hängt keine andere Linie (dort kommt ein Endstück hin)
const edgesAt = (vx, vy) => ['a' + (vx - 1) + ',' + vy, 'a' + vx + ',' + vy, 'b' + vx + ',' + (vy - 1), 'b' + vx + ',' + vy].filter(o => state.edges.has(o));
const freeEnd = (k, vx, vy) => edgesAt(vx, vy).every(o => o === k);
function edgeEndPoints(k) { const { dir, i, j } = edgeParse(k); return dir === 'a' ? [[i, j], [i + 1, j]] : [[i, j], [i, j + 1]]; }
// Lichter an Linien (je eines zählt wie eine Laterne): beleuchtete Stile, Torbögen, Endpfeiler von Mauer und Zaun
function edgeLamps() {
  const out = [], seen = new Set();
  for (const [k, e] of state.edges) {
    if (EDGE_LIT.has(e.b + ':' + e.style)) out.push('E' + k);
    if (e.arch && isGate(k)) out.push('A' + k);
    if (e.b !== 'hecke' && !isGate(k)) for (const [vx, vy] of edgeEndPoints(k)) { const v = 'P' + vx + ',' + vy; if (!seen.has(v) && freeEnd(k, vx, vy)) { seen.add(v); out.push(v); } }
  }
  return out.sort();
}
// Torbogen setzen/ändern/entfernen: Unterschied bezahlen bzw. erstatten
function setArch(k, type) {
  const e = state.edges.get(k);
  if (!e || !isGate(k)) return false;
  const now = e.arch ? ARCHES[e.arch].cost : 0, want = type ? ARCHES[type].cost : 0;
  if ((e.arch || null) === (type || null)) return false;
  if (state.money < want - now) { fail('Zu wenig Taler'); return false; }
  state.money -= want - now;
  if (type) e.arch = type; else delete e.arch;
  sfx('deco'); recalc(); save();
  return true;
}
function buildEdge(b, k) {
  const style = currentStyle(b), old = state.edges.get(k);
  if (old && old.b === b && old.style === style) return false;
  const d = ITEMS[b];
  state.money -= d.cost; payMat(d.mat || {});
  state.edges.set(k, { b, style, ...(old && old.arch ? { arch: old.arch } : {}), born: performance.now() });
  return true;
}
function removeEdge(k) {
  const e = state.edges.get(k);
  if (!e) return false;
  const d = ITEMS[e.b];
  state.money += d.cost + (e.arch ? ARCHES[e.arch].cost : 0);
  for (const [r, n] of Object.entries(d.mat || {})) state.res[r] += n;
  state.edges.delete(k);
  return true;
}
// Marktplatz (Block 39): Stände und große Deko dürfen auf einen Weg – der Weg bleibt darunter liegen (t.weg = sein Stil),
// wird mitgezeichnet (pathAt, pathArms, drawFlat) und kommt beim Abreißen/Wegtragen zurück
const PLAZA_OK = new Set([...Object.keys(STANDS), 'brunnen', 'kristallbrunnen', 'pavillon', 'statue', 'denkmal', 'uhrturm', 'karussell']);
const plazaSpot = (b, x, y) => PLAZA_OK.has(b) && (state.tiles.get(x + ',' + y) || {}).b === 'weg';
const wegUnder = t => !t ? null : t.b === 'weg' ? t.style || 'sand' : t.weg != null ? t.weg : null;
// Marktplätze: zusammenhängende Wegfelder (samt Dingen darauf) mit Ständen; ab MARKT_STEPS[0] Ständen zählt es
let MARKETS = [], MARKT_OK = new Set();
const MARKT_REACH = 4, MARKT_BONUS = 0.2, MARKT_ATTR = [0, 20, 40, 80];
function computeMarkets() {
  const seen = new Set(), out = [], ok = new Set();
  for (const [k0, t0] of state.tiles) {
    if (!STANDS[t0.b] || seen.has(k0)) continue;
    const tiles = [], stands = [], todo = [k0];
    seen.add(k0);
    while (todo.length) {
      const k = todo.pop(), [x, y] = keyXY(k), t = state.tiles.get(k);
      tiles.push([x, y]);
      if (STANDS[t.b]) stands.push(k);
      for (const [dx, dy] of DIRS) {
        const n = (x + dx) + ',' + (y + dy);
        if (!seen.has(n) && wegUnder(state.tiles.get(n)) != null) { seen.add(n); todo.push(n); }
      }
    }
    const stage = MARKT_STEPS.filter(([min]) => stands.length >= min).length;
    const m = { tiles, stands, stage, kinds: new Set(stands.map(k => state.tiles.get(k).b)).size };
    out.push(m);
    if (stage) for (const k of stands) ok.add(k);
  }
  MARKETS = out.filter(m => m.stage); MARKT_OK = ok;
  return out;
}
const marketOf = k => MARKETS.find(m => m.stands.includes(k)) || null;
// Läden bis MARKT_REACH Felder um einen Marktplatz: Marktviertel
function nearMarket(x, y, w = 1, h = 1) {
  const x1 = x + w - 1, y1 = y + h - 1;
  return MARKETS.some(m => m.tiles.some(([mx, my]) => Math.max(0, mx - x1, x - mx, my - y1, y - my) <= MARKT_REACH));
}
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
  if (slot >= 4 && t && wegUnder(t) == null && !isCrossing(t)) return 'Auf Gebäudefeldern nur an die Ecken';
  if (decosAt(k) && decosAt(k)[slot]) {
    const ds = decosAt(k);
    return ds.every(Boolean) ? 'Alle Plätze sind belegt' : slot < 4 && ds.slice(0, 4).every(Boolean) ? 'Alle 4 Ecken sind belegt' : slot < 4 ? 'Diese Ecke ist schon belegt' : 'Dieser Platz ist schon belegt';
  }
  if (opts.move) return !t && terrainAt(x, y) !== 'grass' ? 'Erst roden bzw. sprengen' : null;
  if (opts.noCost) return null;
  if (state.money < d.cost + clearCost(b, x, y)) return 'Zu wenig Taler';
  return matError(d.mat);
}
// Ist die angetippte Ecke belegt, die nächste freie nehmen: erst die beiden Nachbarecken, dann die gegenüber
function freeSlot(x, y, slot) {
  const ds = decosAt(x + ',' + y);
  if (!ds) return slot;
  const i = (slot < 4 ? [slot, slot ^ 1, slot ^ 2, slot ^ 3] : [slot, 4 + ((slot - 2) & 3), 4 + ((slot - 3) & 3), 4 + ((slot - 1) & 3)]).find(n => !ds[n]);
  return i == null ? slot : i;
}
// Bank in einer Seitenmitte: längs zur Feldseite, der Sitz schaut zur Feldmitte (zum Weg), egal wie gerade gedreht wird
const MID_FACE = { 4: 0, 5: 3, 6: 2, 7: 1 }, MID_TURN = new Set(['bank']);
const midRot = slot => MID_FACE[slot];
function buildSmall(b, x, y, slot) {
  const err = smallError(b, x, y, slot);
  if (err) { fail(err); return false; }
  const k = x + ',' + y;
  clearNature(b, x, y);
  state.money -= ITEMS[b].cost;
  payMat(ITEMS[b].mat);
  if (!state.decos.has(k)) state.decos.set(k, newSlots());
  state.decos.get(k)[slot] = { b, rot: slot >= 4 && MID_TURN.has(b) ? midRot(slot) : ROTATABLE.has(b) ? buildRot : 0, born: performance.now() };
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
    if (!state.decos.has(k)) state.decos.set(k, newSlots());
    const ds = state.decos.get(k), free = (t.b === 'baum' ? [0, 3, 1, 2] : [3, 0, 1, 2]).find(i => !ds[i]);
    if (free != null) ds[free] = { b: t.b, rot: t.rot || 0 };
  }
}
const available = id => ITEMS[id].variantOf ? available(ITEMS[id].variantOf) : unlockOk(ITEMS[id], id);   // Größen: wie das Grundmodell
const lockText = (id, short) => {
  const d = ITEMS[id];
  const txt = unlockText(d, short);
  return txt ? '🔒 ' + txt : '';
};
// Gebäude-Stufen (BUILD_STAGES): was fehlt noch bis zur nächsten Stufe?
const stageName = t => BUILD_STAGES[t.b] ? BUILD_STAGES[t.b].names[Math.min(t.lvl, MAX_LVL) - 1] : ITEMS[t.b].name;
const jobsOf = t => (ITEMS[t.b].workers || 0) * (BUILD_STAGES[t.b] ? Math.min(t.lvl, MAX_LVL) : 1);
function nearText(types, n, r, self) {
  const where = r === 1 ? 'direkt daneben' : `erreichbar (${r} Felder, oder per Weg/Bahn)`;
  if (n === 1) return `${types.map(kindName).join(' oder ')} ${where}`;
  return `${n} ${types.some(k => isKind(k, self)) ? 'weitere ' : ''}${types.map(kindPlural).join(' oder ')} ${where}`;
}
function stageInfo(t, x, y, pop = T.pop, jobs = T.jobs, acc = T.access) {
  const S = BUILD_STAGES[t.b], d = ITEMS[t.b], up = S && S.up[t.lvl - 1];
  if (!up) return { next: null, conds: [], ready: false };
  const conds = [];
  if (d.workers) conds.push({ text: `👷 ${d.workers} ${d.workers === 1 ? 'freier Einwohner' : 'freie Einwohner'} als Mitarbeiter`, ok: pop - jobs >= d.workers });
  if (up.pop) conds.push({ text: `👥 ${up.pop} Einwohner auf der Insel`, ok: pop >= up.pop });
  if (up.tech) conds.push({ text: `💡 Forschung „${TECH_BY_ID[up.tech].name}“`, ok: hasTech(up.tech) });
  if (up.water) conds.push({ text: `💧 Am Wasser mit mindestens ${up.water} Feldern (auch Flüsse)`, ok: waterBody(x, y, up.water) >= up.water });
  if (up.beauty) conds.push({ text: `🌸 Schöne Umgebung (${up.beauty[0]} in ${up.beauty[1]} Feldern)`, ...(acc && acc.green ? { ok: true, how: 'garten' } : { ok: beautyAround(x, y, up.beauty[1]) >= up.beauty[0] }) });
  if (up.near) {
    const [types0, n, r] = up.near, types = [].concat(types0);
    const pred = b => types.some(k => isKind(k, b));
    if (acc && acc.green && types.includes('park')) conds.push({ text: nearText(types, n, r, t.b), ok: true, how: 'garten' });
    else if (r < 2) conds.push({ text: nearText(types, n, r, t.b), ok: countNear(x, y, r, pred) >= n });   // direkt daneben: nur vor Ort
    else { const got = reachKind(acc, x + ',' + y, x, y, r, pred, n); conds.push({ text: nearText(types, n, r, t.b), ok: !!got.how, how: got.how }); }
  }
  return { next: { name: S.names[t.lvl], cost: up.cost }, conds, ready: conds.every(c => c.ok) };
}
const canPay = cost => { const { money = 0, ...mat } = cost; return state.money >= money && hasMat(mat); };
const hasBuilt = b => [...state.tiles.values()].some(t => t.b === b);

// Drehen: Beim Setzen schaut ein Gebäude von selbst mit der Tür zum Weg. Wer selbst dreht (⟳, Mausrad, R),
// behält seine Richtung, bis er das Werkzeug wechselt.
let rotManual = false;
// Felder direkt vor der Tür (vor der ganzen Vorderseite)
function frontTiles(b, x, y, rot, t) {
  const [w, h] = sizeOf(b, rot, t), [dx, dy] = FRONT_DIR[rot & 3], out = [];
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
      + (b === 'station' || b === 'hbf' ? 10 * front.filter(([fx, fy]) => bAt(fx, fy) === 'schiene').length : 0);   // Bahnsteig/Gleise zur Schiene
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
const costOf = (b, x, y) => b === 'schiene' && terrainAt(x, y) === 'water' ? BRIDGE : b === 'schuett' ? { cost: fillCost(x, y), mat: undefined }
  : { cost: ITEMS[b].cost || 0, mat: ITEMS[b].mat };
// Schiene vor einem Gleis des Hauptbahnhofs läuft in die Halle weiter (kein Prellbock)
const railArms = (x, y) => { const e = GEXIT.get(x + ',' + y);
  return DIRS.filter(([dx, dy]) => bAt(x + dx, y + dy) === 'schiene' || (e && e[0] === dx && e[1] === dy)); };
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
function crossError(b, x, y, noCost) {
  const t = crossCandidate(b, x, y);
  if (!t) return 'Hier steht schon etwas';
  if (!available(b)) return `${ITEMS[b].name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (t.bridge) return 'Kein Übergang auf einer Brücke';
  const ra = railArms(x, y);
  if (ra.length > 2 || (ra.length === 2 && (ra[0][0] !== -ra[1][0] || ra[0][1] !== -ra[1][1]))) return 'Übergang nur über gerade Schienen';
  if (noCost) return null;
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
// im Kreis, und ab 4 km darf man weitere Züge kaufen (1 je 2 km). Was die Züge bringen, rechnet der Verkehr (unten).
const KM = 10, KM_PER_TRAIN = 2;
const EXTRA_TRAIN = { money: 1500, metall: 10 };
// Verkehr (Block 17): Jeder Ort (Heimatinsel, Themen-Inseln) hat Einwohner und Anziehung. Eine fahrende Linie
// befördert Pendler (½ Fahrt/min je Einwohner außerhalb ihres größten Orts) und Besucher (so viele, wie ein Ort
// anzieht – höchstens ½ je Einwohner der anderen Orte). Plätze: 60 je Wagen und Minute. Reichen sie nicht, kommt nur
// ein Teil mit (served). Fahrkarten und Besucher bringen Taler; was nah am Bahnhof steht, ist ans Dorf angebunden.
const COMMUTE_SHARE = 0.5, VISIT_SHARE = 0.5, FARE = 2, VISIT_SPEND = 10;
const MAX_PLUS_CARS = 4;                                                         // Wagen zum Anhängen (dazu die des Modells)
const EXTRA_CAR = { money: 400, metall: 3 };
const LM_ATTRACT = [0, 40, 80, 150];                                            // Sehenswürdigkeit je Stufe
const WONDER_ATTRACT = { seebruecke: 150, sternwarte: 200, riesenrad: 300, botgarten: 350, schloss: 500 };
const trainModel = look => TRAIN_BY_ID[look.model] || TRAIN_BY_ID.tram;
const carsOf = look => trainModel(look).cars + Math.min(MAX_PLUS_CARS, look.plus || 0);
const carSeats = look => trainModel(look).perCar * trainModel(look).speed;          // Fahrgäste/min je Wagen
const trainSeats = look => Math.round(carsOf(look) * carSeats(look));
// Verkehrsmittel erforscht? kind 'zug' | 'schiff'; das erste Modell ist mit der Grundforschung frei
const VEHICLE_BASE = { zug: 'bahn', schiff: 'seehandel' };
const vehicleModels = kind => kind === 'zug' ? TRAIN_MODELS : SHIP_MODELS;
function vehicleOk(kind, id) {
  const m = vehicleModels(kind).find(v => v.id === id);
  return !!m && hasTech(VEHICLE_BASE[kind]) && (!m.cost || state.vehicles.has(kind + ':' + id));
}
const vehicleOpen = (kind, m) => hasTech(VEHICLE_BASE[kind]) && tierOpen(m.tier || 1);
// bestes erforschtes Modell (für neue Linien bzw. Schiffe)
const bestVehicle = kind => [...vehicleModels(kind)].reverse().find(m => vehicleOk(kind, m.id)) || vehicleModels(kind)[0];
// Strom ⚡: Kraftwerke liefern, egal wo sie stehen (Windrad je Stufe mehr; Forschung „Leichte Rotorblätter“ +50 % Wind,
// „Intelligentes Stromnetz“ +25 % auf alles). Verbraucher der Reihe nach: Laternen (je angefangene 10 eine ⚡), dann
// die Gebäude aus CONSUMERS, zuletzt die Züge (je 1 ⚡ + 1 ⚡ je km ihres Netzes). Wer leer ausgeht: Laternen bleiben
// nachts dunkel (halbe Schönheit), Gebäude schaffen die Hälfte (⚡ darüber), Züge stehen. Die Stadt braucht erst Strom,
// wenn es Kraftwerke gibt (oder Windräder freigeschaltet sind) – vorher läuft alles ohne.
const POWER_OUT = { windrad: [1, 2, 3], wasserkraft: [4, 8, 12], solarfeld: [3, 6, 9], geothermie: [8, 16, 24], wellen: [5, 10, 15] };   // Stufe 1–3
const LAMPS_PER_POWER = 10, NO_POWER = 0.5;
// Monumente brauchen richtig viel (je 100 ⚡, das Schloss 300) – dafür baut man sich eine Energie-Insel
const CONSUMERS = { fabrik: 2, saege: 1, hafen: 2, uni: 2, glashaus: 1, glashaus_l: 3, sternwarte: 100, botgarten: 100, riesenrad: 100, seebruecke: 100, schloss: 300 };   // Reihenfolge = Vorrang
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
// Strom eines Zugs: die Regionalbahn (2 Wagen) wie oben, jeder Wagen mehr oder weniger ein halbes Mal
const carNeed = (tiles, cars) => trainNeed(tiles) * cars / 2;
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
    else if (t.b === 'hbf') { for (const [gk, G] of GLEIS) if (G.hub === k) stations.push(gk); }
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
    let net = null;
    for (const [fx, fy] of stopFoot(s)) for (const [dx, dy] of DIRS) {
      const n = comp.get((fx + dx) + ',' + (fy + dy));
      if (n != null && net == null) net = n;
    }
    stationNet.set(s, net);
    if (net != null) { if (!byNet.has(net)) byNet.set(net, []); byNet.get(net).push(s); }
  }
  const lines = [];
  for (const [net, list] of byNet) {
    const regions = [...new Set(list.map(s => regionAt(...keyXY(s))))].sort(byRegion);          // Heimatinsel zuerst
    if (regions.length < 2) continue;
    const tiles = netTiles[net].length, ring = railLoop(netTiles[net], rails);
    // Rundkurs nur, wenn jeder Bahnhof direkt am Ring liegt
    const onRing = ring && list.every(s => { const R = new Set(ring);
      return stopFoot(s).some(([fx, fy]) => DIRS.some(([dx, dy]) => R.has((fx + dx) + ',' + (fy + dy)))); });
    const loop = onRing ? ring : null, max = loop ? Math.max(1, Math.floor(tiles / KM / KM_PER_TRAIN)) : 1;
    const looks = lineLooks(list), count = Math.min(max, looks.length);
    const needs = looks.slice(0, count).map(lk => carNeed(tiles, carsOf(lk)));
    lines.push({ net, stations: list, regions, tiles, km: tiles / KM, loop, max, looks, count, need: needs[0], needs });
  }
  lines.sort((a, b) => a.stations[0] < b.stations[0] ? -1 : 1);
  const power = computePower(lines, wind, plants);
  for (const l of lines) l.seats = l.looks.slice(0, l.running).reduce((s, lk) => s + trainSeats(lk), 0);
  return { lines, stationNet, wind, trains: power.trains, comp, power };
}
// Aussehen der Züge einer Linie (am Bahnhof gespeichert): erster Zug train/trainCol/trainPlus, weitere in extra.
// plus = angehängte Wagen (zusätzlich zu denen des Modells)
function lineLooks(stations) {
  const t = stations.map(stopConf).find(t => t && t.train) || stopConf(stations[0]) || {};
  return [{ model: t.train || 'tram', col: t.trainCol || 0, plus: t.trainPlus || 0 }]
    .concat((t.extra || []).map(e => ({ model: e.model || 'tram', col: e.col || 0, plus: e.plus || 0 })));
}
// Seilbahn: jede Station mit der nächsten freien (bis SEIL_MAX Felder), paarweise; die Gondeln befördern Fahrgäste
const SEIL_MAX = 20, SEIL_SEATS = 80;
const byRegion = (p, q) => regionRank(p) - regionRank(q);   // Heimatinsel zuerst
function cablePairs() {
  const st = [...state.tiles].filter(([, t]) => t.b === 'seilbahn').map(([k]) => k).sort(), pairs = [], used = new Set(), out = [];
  st.forEach((a, i) => st.forEach((b, j) => { if (j > i) { const [ax, ay] = keyXY(a), [bx, by] = keyXY(b), d = Math.hypot(ax - bx, ay - by); if (d <= SEIL_MAX) pairs.push([d, a, b]); } }));
  pairs.sort((p, q) => p[0] - q[0]);
  for (const [d, a, b] of pairs) if (!used.has(a) && !used.has(b)) { used.add(a); used.add(b); out.push([a, b, d]); }
  return out;
}
// Schiffe (Block 23b): Am Hafen liegen je Stufe 2/4/6 Schiffe. Jedes hat ein Modell (Forschung „Verkehr“) und ein
// Ziel – einen Steg oder Hafen auf einer anderen Insel (t.ships = [{ model, to }]). Alle Schiffe zum selben Ziel sind
// eine Verbindung: ihre Plätze zählen zusammen (Fahrgäste/min = Plätze × Tempo), ohne Schienen und ohne Strom.
const BERTHS = [2, 4, 6];
const berthsOf = t => BERTHS[Math.min(3, t.lvl || 1) - 1];
const shipModel = s => SHIP_BY_ID[s.model] || SHIP_BY_ID.holz;
const SHIP_FAST = 1.25;                                                   // Seebrücke: Schiffe fahren schneller
const shipSpeed = s => shipModel(s).speed * (wonderOn('seebruecke') ? SHIP_FAST : 1);
const shipSeats = s => Math.round(shipModel(s).seats * shipSpeed(s));
const isLanding = t => !!t && (t.b === 'bootssteg' || t.b === 'hafen');
// Seewege (Block 24b): Schiffe fahren nur übers Wasser – kürzester Weg über Wasserfelder (8 Richtungen, nie schräg an
// einer Landecke vorbei), dann geglättet (gerade Stücke, solange die Sichtlinie übers Wasser geht). Gemerkt, bis sich
// Wasser ändert (waterChanged: Teich graben, Aufschütten, neuer Stand).
const seaCache = new Map();
let waterVersion = 0;                                    // für das Bild vom tiefen Meer (render.js)
function waterChanged() { seaCache.clear(); waterVersion++; }
function nearestWater(x, y) {
  const rx = Math.round(x), ry = Math.round(y);
  for (let r = 0; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && isWater(rx + dx, ry + dy)) return [rx + dx, ry + dy];
  }
  return null;
}
// Suchkasten um Punkte, mit Rand (Umwege um Inseln herum)
const seaBox = (pts, pad) => [Math.floor(Math.min(...pts.map(p => p[0]))) - pad, Math.floor(Math.min(...pts.map(p => p[1]))) - pad,
  Math.ceil(Math.max(...pts.map(p => p[0]))) + pad, Math.ceil(Math.max(...pts.map(p => p[1]))) + pad];
// Breitensuche übers Wasser vom Feld s, bis goal(x, y) passt → Felder vom Start bis zum Ziel (oder null)
// box = [x0, y0, x1, y1]: nur darin suchen (die Welt kann riesig sein); ohne: die ganze Welt
function seaSearch(s, goal, box) {
  const [X0, Y0, X1, Y1] = box || [WORLD.cMin * CHUNK - 2, WORLD.cMin * CHUNK - 2, (WORLD.cMax + 1) * CHUNK + 1, (WORLD.cMax + 1) * CHUNK + 1];
  const N = X1 - X0 + 1, M = Y1 - Y0 + 1, idx = (x, y) => (y - Y0) * N + (x - X0);
  const inside = (x, y) => x >= X0 && x <= X1 && y >= Y0 && y <= Y1;
  if (!inside(s[0], s[1])) return null;
  const prev = new Int32Array(N * M).fill(-2), q = new Int32Array(N * M);
  let head = 0, tail = 0;
  prev[idx(s[0], s[1])] = -1; q[tail++] = idx(s[0], s[1]);
  while (head < tail) {
    const c = q[head++], x = c % N + X0, y = Math.floor(c / N) + Y0;
    if (goal(x, y)) {
      const out = [];
      for (let k = c; k !== -1; k = prev[k]) out.push([k % N + X0, Math.floor(k / N) + Y0]);
      return out.reverse();
    }
    for (const [dx, dy] of NEAR8) {
      const nx = x + dx, ny = y + dy;
      if (!inside(nx, ny) || prev[idx(nx, ny)] !== -2 || !isWater(nx, ny)) continue;
      if (dx && dy && (!isWater(x + dx, y) || !isWater(x, y + dy))) continue;      // nicht über die Landecke
      prev[idx(nx, ny)] = c; q[tail++] = idx(nx, ny);
    }
  }
  return null;
}
const seaSight = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
  for (let i = 0; i <= n; i++) { const t = i / Math.max(1, n); if (!isWater(Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t))) return false; } return true; };
// Weg als Linienzug: Punkte, Länge, Stützstellen – geglättet per Sichtlinie
function seaRoute(tiles, a, b) {
  const pts = [a || tiles[0]];
  let i = 0;
  while (i < tiles.length - 1) {
    let j = tiles.length - 1;
    while (j > i + 1 && !seaSight(tiles[i], tiles[j])) j--;
    pts.push(tiles[j]); i = j;
  }
  if (b) pts.push(b);
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
function routeAt(r, d) {                                   // Ort und Richtung nach Strecke d
  d = Math.max(0, Math.min(r.len, d));
  let k = 1;
  while (k < r.cum.length - 1 && r.cum[k] < d) k++;
  const a = r.pts[k - 1], b = r.pts[k] || a, seg = Math.max(1e-6, r.cum[k] - r.cum[k - 1]), t = (d - r.cum[k - 1]) / seg;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / seg, (b[1] - a[1]) / seg];
}
function seaPath(a, b) {
  const key = a.map(v => v.toFixed(1)).join() + '>' + b.map(v => v.toFixed(1)).join();
  if (seaCache.has(key)) return seaCache.get(key);
  const s = nearestWater(...a), t = nearestWater(...b);
  const tiles = s && t && seaSearch(s, (x, y) => x === t[0] && y === t[1], seaBox([s, t], 40));
  const r = tiles ? seaRoute(tiles, a, b) : null;
  seaCache.set(key, r);
  return r;
}
// Expedition: vom Steg übers Wasser bis vor die Küste der Insel; Frachter: vom Hafen aufs offene Meer (14 Felder weit);
// Fischgrund: freies Wasser vor dem Hafen (3 Felder rundum Wasser). Alles über den Seeweg.
function expeditionRoute(from, isle) {
  const key = 'exp:' + from + ':' + isle.id;
  if (seaCache.has(key)) return seaCache.get(key);
  const [x, y] = keyXY(from), s = nearestWater(x, y);
  const R = (isle.r || ISLE_R) + 3, tiles = s && seaSearch(s, (a, b) => Math.hypot(a - isle.cx, b - isle.cy) <= R, seaBox([s, [isle.cx, isle.cy]], 40));
  const r = tiles ? seaRoute(tiles, [x, y]) : null;
  seaCache.set(key, r);
  return r;
}
function openSeaRoute(k) {
  const key = 'out:' + k;
  if (seaCache.has(key)) return seaCache.get(key);
  const a = dockPoint(k), s = nearestWater(...a);
  const tiles = s && seaSearch(s, (x, y) => Math.hypot(x - a[0], y - a[1]) >= 14, seaBox([a], 30));
  const r = tiles ? seaRoute(tiles, a) : null;
  seaCache.set(key, r);
  return r;
}
function fishingGround(k) {
  const key = 'fish:' + k;
  if (seaCache.has(key)) return seaCache.get(key);
  const a = dockPoint(k), s = nearestWater(...a), open = (x, y) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!isWater(x + dx, y + dy)) return false; return true; };
  const tiles = s && seaSearch(s, (x, y) => Math.hypot(x - a[0], y - a[1]) >= 2 && open(x, y), seaBox([a], 20));
  const r = tiles ? tiles[tiles.length - 1] : null;
  seaCache.set(key, r);
  return r;
}
// wo Schiffe anlegen: vor dem Pier des Hafens bzw. am Steg
function dockPoint(k) {
  const t = state.tiles.get(k), [x, y] = keyXY(k);
  if (!t || t.b !== 'hafen') return [x, y];
  const [w, h] = sizeOf(t.b, t.rot, t), [dx, dy] = FRONT_DIR[(t.rot || 0) & 3], cx = x + (w - 1) / 2, cy = y + (h - 1) / 2;
  return [cx + dx * ((dx ? w : h) / 2 + 1.3), cy + dy * ((dx ? w : h) / 2 + 1.3)];
}
function shipLinks() {
  const out = [];
  for (const [k, t] of state.tiles) {
    if (t.b !== 'hafen' || !t.ships) continue;
    const by = new Map();
    for (const s of t.ships.slice(0, berthsOf(t))) if (s.to !== k && isLanding(state.tiles.get(s.to))) by.set(s.to, (by.get(s.to) || []).concat([s]));
    const [hx, hy] = keyXY(k);
    for (const [to, ships] of by) {
      const regions = [...new Set([k, to].map(kk => regionAt(...keyXY(kk))))].sort(byRegion), [tx, ty] = keyXY(to);
      if (regions.length < 2) continue;
      const route = seaPath(dockPoint(k), dockPoint(to));                         // kein Seeweg: die Schiffe bleiben am Pier
      out.push({ kind: 'faehre', stations: [k, to], regions, ships, lvl: t.lvl || 1, route, noSea: !route,
        km: (route ? route.len : Math.hypot(hx - tx, hy - ty)) / KM, seats: route ? ships.reduce((a, s) => a + shipSeats(s), 0) : 0 });
    }
  }
  return out;
}
// Wohin Schiffe von diesem Hafen fahren können: Stege und Häfen auf anderen Inseln
const shipTargets = k => [...state.tiles].filter(([o, u]) => o !== k && isLanding(u) && regionAt(...keyXY(o)) !== regionAt(...keyXY(k))).map(([o]) => o);
const FISH_INC = 5;                                  // Fischkutter (18f): je Hafen-Stufe einer, jeder bringt so viele Taler/s
// Aufträge (Block 24): Am Handelshafen (Stufe 2) legen Frachter mit Aufträgen an. Ankauf: Sie nehmen dir ab, was sich
// stapelt – ein guter Teil des Lagers zu 120–180 % des Grundpreises; am Großen Hafen (Stufe 3) manchmal ein Großauftrag
// (fast alles, 200–300 %). Angebot: Sie verkaufen dir eine Ware, deren Betrieb du schon bauen kannst (kein Kristall vor der
// Kristallinsel). Jeder Auftrag gilt ORDER_TTL; alle ORDER_EVERY kommt ein neuer, solange Plätze frei sind.
const TRADE_PRICE = { holz: 4, stein: 4, erz: 8, obst: 5, bretter: 15, quader: 15, metall: 40, kristall: 120, kaffee: 20, tee: 20, kakao: 25 };
const RES_SOURCE = { holz: 'holz', stein: 'stein', erz: 'mine', obst: 'obst', bretter: 'saege', quader: 'steinmetz', metall: 'schmiede', kristall: 'kristallmine',
  kaffee: 'kaffeeplantage', tee: 'teegarten', kakao: 'kakaoplantage' };
const ORDER_TTL = 12 * 60e3, ORDER_EVERY = 3 * 60e3, ORDER_SLOTS = [0, 2, 4];         // Plätze je Hafen-Stufe 1/2/3
const tradeLevel = () => Math.max(0, ...[...state.tiles.values()].filter(t => t.b === 'hafen').map(t => Math.min(3, t.lvl || 1)));
const canTrade = () => tradeLevel() >= 2;
const orderSlots = () => tradeLevel() ? ORDER_SLOTS[tradeLevel() - 1] + (tradeLevel() >= 2 && wonderOn('seebruecke') ? 1 : 0) : 0;   // Seebrücke: +1
function makeOrder(now, rnd = Math.random) {
  const big = tradeLevel() >= 3, taken = r => state.orders.some(o => o.res === r);
  const stock = Object.keys(TRADE_PRICE).filter(r => state.res[r] >= 50 && !taken(r));
  if (stock.length && rnd() < 0.75) {                                       // Ankauf: was sich stapelt, nach Wert gewichtet
    const w = stock.map(r => state.res[r] * TRADE_PRICE[r]);
    let pick = rnd() * w.reduce((a, b) => a + b, 0), res = stock[stock.length - 1];
    for (let i = 0; i < stock.length; i++) { pick -= w[i]; if (pick <= 0) { res = stock[i]; break; } }
    const huge = big && rnd() < 0.3, share = huge ? 0.8 + rnd() * 0.2 : 0.3 + rnd() * 0.5, prem = (huge ? 2 + rnd() : 1.2 + rnd() * 0.6) * (wonderOn('seebruecke') ? 1.5 : 1);
    const amount = Math.max(10, niceRound(Math.floor(state.res[res] * share)));
    return { id: now + ':' + res, kind: 'sell', res, amount, pay: niceRound(amount * TRADE_PRICE[res] * prem), prem, huge, until: now + ORDER_TTL };
  }
  const can = Object.keys(TRADE_PRICE).filter(r => available(RES_SOURCE[r]) && !taken(r));
  if (!can.length) return null;
  const res = can[Math.floor(rnd() * can.length)], amount = niceRound((big ? 120 : 40) * (1 + rnd() * 3) * (TRADE_PRICE[res] < 10 ? 4 : 1));
  return { id: now + ':' + res, kind: 'buy', res, amount, pay: niceRound(amount * TRADE_PRICE[res] * (1.1 + rnd() * 0.3)), until: now + ORDER_TTL };
}
const ferriesAt = k => T.ferries.filter(l => l.stations.includes(k));
// Verkehr aller Verbindungen (Block 25b): Jede Insel zählt einmal. Pendler: ½ je Einwohner, wenn eine Insel, mit der
// sie verbunden ist, größer ist (Gleichstand: die Heimatinsel bzw. die frühere zählt als größer). Besucher: ihre
// Anziehung, höchstens ½ je Einwohner aller Inseln, mit denen sie verbunden ist. Das teilen sich alle Verbindungen, die
// dort halten (Zug, Seilbahn, Fähre) – nach Plätzen. Jede Verbindung hat so ihre Fahrgäste und ihre Auslastung.
function transitTraffic(links, places) {
  const pop = r => places.pop.get(r) || 0, rank = regionRank;
  const at = new Map();                                                            // Insel → Verbindungen, die dort halten
  for (const l of links) if (l.regions.length > 1) for (const r of l.regions) { if (!at.has(r)) at.set(r, []); at.get(r).push(l); }
  // Umsteigen (Block 29): Linien, die am selben Hauptbahnhof enden, verbinden alle ihre Inseln miteinander
  const hubOf = l => (l.stations || []).map(s => GLEIS.get(s)).filter(Boolean).map(G => G.hub), hubR = new Map();
  for (const l of links) if (l.regions.length > 1) for (const h of hubOf(l)) { if (!hubR.has(h)) hubR.set(h, new Set()); for (const r of l.regions) hubR.get(h).add(r); }
  const reach = l => [...l.regions, ...hubOf(l).flatMap(h => [...hubR.get(h)])];
  const need = new Map();
  for (const [r, ls] of at) {
    const other = [...new Set(ls.flatMap(reach))].filter(q => q !== r), seats = ls.reduce((s, l) => s + l.seats, 0);
    const bigger = other.some(q => pop(q) > pop(r) || (pop(q) === pop(r) && rank(q) < rank(r)));
    need.set(r, { commute: bigger ? pop(r) * COMMUTE_SHARE : 0,
      visit: Math.min(places.attr.get(r) || 0, other.reduce((s, q) => s + pop(q), 0) * VISIT_SHARE),
      share: l => seats ? l.seats / seats : 1 / ls.length });
  }
  for (const l of links) {
    let commute = 0, visitors = 0;
    const visits = new Map();
    if (l.regions.length > 1) for (const r of l.regions) {
      const n = need.get(r), f = n.share(l);
      commute += n.commute * f; visitors += n.visit * f; visits.set(r, n.visit * f);
    }
    const demand = commute + visitors, served = demand > 0 ? Math.min(1, l.seats / demand) : 1;
    const shared = l.regions.length > 1 ? links.filter(o => o !== l && o.regions.length > 1 && o.regions.some(r => l.regions.includes(r))).length : 0;
    const transfer = l.regions.length > 1 ? [...new Set(reach(l))].filter(q => !l.regions.includes(q)) : [];   // per Umsteigen erreichbar
    l.traffic = { commute, visits, visitors, demand, seats: l.seats, served, carried: demand * served, shared, transfer,
      fare: demand * served * FARE / 60, spend: visitors * served * VISIT_SPEND / 60 };
  }
}
// Einwohner und Anziehung je Ort
const popOf = t => t.b === 'haus' ? HOUSE_STAGES[Math.min(t.lvl, HOUSE_STAGES.length) - 1].pop : (ITEMS[t.b].pop || 0) * t.lvl;
function placeStats() {
  const pop = new Map(), attr = new Map(), add = (m, r, v) => m.set(r, (m.get(r) || 0) + v);
  for (const [k, t] of state.tiles) {
    const [x, y] = keyXY(k), r = regionAt(x, y), d = ITEMS[t.b];
    add(pop, r, popOf(t));
    if (t.b === 'lm' && ownedTile(x, y)) add(attr, r, LM_ATTRACT[lmStage(t.lm)] || 0);
    else if (WONDER_ATTRACT[t.b] && wonderDone(t)) add(attr, r, WONDER_ATTRACT[t.b]);
    else if (d.cat === 'deko' && d.beauty) add(attr, r, d.beauty / 10);           // Schönes zieht auch ein wenig an
  }
  for (const [k, ds] of state.decos) { const r = regionAt(...keyXY(k)); for (const d of ds) if (d) add(attr, r, ITEMS[d.b].beauty / 10); }
  // Kultur zieht an, Hotels machen die ganze Insel anziehender (Übernachtungsgäste)
  const hotel = new Map();
  for (const [k, t] of state.tiles) { const S = SHOPS[t.b]; if (!S) continue; const r = regionAt(...keyXY(k)); if (S.attr) add(attr, r, S.attr); if (S.hotel) add(hotel, r, S.hotel); }
  for (const m of MARKETS) add(attr, regionAt(...m.tiles[0]), MARKT_ATTR[m.stage]);             // Marktplatz zieht an
  for (const [r, h] of hotel) attr.set(r, (attr.get(r) || 0) * (1 + h));
  return { pop, attr };
}
// Fahrgäste einer einzelnen Linie (so, als gäbe es nur sie)
const lineTraffic = (l, places) => { const c = { ...l }; transitTraffic([c], places); return c.traffic; };
function computePower(lines, supply, plants = 0) {
  const city = plants > 0 || available('windrad');
  let left = supply, demand = 0, trains = 0;
  const dark = new Set(), idle = new Set(), use = { lamps: 0, work: 0, trains: 0 };
  const take = (n, what) => { demand += n; use[what] = (use[what] || 0) + n; if (left >= n - 1e-9) { left -= n; return true; } return false; };
  if (city) {
    const lamps = [];
    for (const k of [...state.decos.keys()].sort()) state.decos.get(k).forEach((d, i) => { if (d && d.b === 'laterne') lamps.push(k + ',' + i); });
    lamps.push(...edgeLamps());                                         // Lichter an Hecken, Zäunen, Mauern
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
    for (let i = 0; i < l.count; i++) if (take(l.needs ? l.needs[i] : l.need, 'trains')) { l.running++; trains++; }
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
  if (d.edge) return 'Linien: Anfang und Ende antippen';          // Hecke, Zaun, Mauer liegen auf Kanten, nie auf Feldern
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
    const tiles = footprint(b, x, y, r, opts.t), [dx, dy] = FRONT_DIR[r];
    for (const [tx, ty] of tiles) {
      if (!ownedTile(tx, ty) && !isSea(tx, ty)) return 'Das ist nicht dein Grundstück';   // ins offene Meer darf sie
      if (COVER.has(tx + ',' + ty)) return 'Hier ist nicht genug Platz';
      if (decosAt(tx + ',' + ty)) return 'Hier stehen schon kleine Dekos';
    }
    const back = tiles.reduce((p, q) => q[0] * dx + q[1] * dy < p[0] * dx + p[1] * dy ? q : p);
    const land = tiles.filter(([tx, ty]) => terrainAt(tx, ty) !== 'water');
    if (land.length !== 1 || land[0] !== back) return 'Vom Ufer aus ins Wasser bauen';
    if (terrainAt(...back) !== 'grass' && !willClear(b, terrainAt(...back))) return 'Vom Ufer aus ins Wasser bauen';
  } else {
    const tiles = footprint(b, x, y, r, opts.t);
    for (const [fx, fy] of tiles) {
      const k = fx + ',' + fy, raw = terrainAt(fx, fy), ter = !opts.move && willClear(b, raw) ? 'grass' : raw;   // Natur wird weggeräumt
      // Schienen dürfen übers Wasser (Brücke), Wellenkraftwerk ins Meer, Hausboot auf jedes Wasser am Ufer
      const rail = b === 'schiene', sea = d.needs === 'meer' || d.needs === 'boot';
      const seaOk = sea && isSea(fx, fy) && nearOwnLand(fx, fy);   // auch schräg am Ufer (Ecke an Ecke)
      if (!ownedTile(fx, fy) && !(rail && claimable(fx, fy)) && !seaOk) return (rail || sea) && isSea(fx, fy) ? 'Im Meer nur direkt neben deinem Land' : notMine(fx, fy);
      if (sea) {
        if (COVER.has(k)) return 'Hier steht schon etwas';
        if (d.needs === 'meer' && (ter !== 'water' || !isSea(fx, fy))) return 'Ins Meer vor die Küste bauen';
        if (d.needs === 'boot' && ter !== 'water') return 'Aufs Wasser, direkt ans Ufer';
        continue;
      }
      if (tiles.length === 1 && plazaSpot(b, fx, fy)) { if (decosAt(k)) return 'Hier stehen schon kleine Dekos'; continue; }   // auf den Platz (Weg bleibt darunter)
      if (d.needs === 'platz') return 'Marktstände gehören auf einen Weg oder Platz';
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
    if ((d.needs === 'meer' || d.needs === 'boot') && !tiles.some(([fx, fy]) => nearOwnLand(fx, fy))) return d.needs === 'boot' ? 'Direkt ans Ufer legen' : 'Direkt vor die Küste bauen';
    if (d.needs === 'strand' && !tiles.every(([fx, fy]) => terraLook(fx, fy) === 'sand' || (terrainAt(fx, fy) === 'grass' && terraLook(fx, fy) !== 'wiese' && isBeach(fx, fy)))) return 'Nur auf Sand am Wasser (Strand)';
    if (d.isle && !tiles.every(([fx, fy]) => regionAt(fx, fy) === d.isle)) return `Nur auf der ${regionName(d.isle)} – dort ist der Boden warm`;
    if (d.far && !tiles.every(([fx, fy]) => (ISLE_BY_ID[regionAt(fx, fy)] || {}).far)) return 'Nur auf fernen Inseln – dort ist es warm genug';
    if (!opts.move && d.workers && T.jobs + d.workers > T.pop) return 'Zu wenig Einwohner – baue Häuser';
  }
  if (d.wonder && !opts.move && [...state.tiles.values()].some(t => t.b === b)) return `${WONDERS[b].the} gibt es schon`;
  if (opts.move || opts.noCost) return null;            // noCost: Linie/Rechteck rechnen den Preis zusammen
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
    const [x, y] = keyXY(k), [w, h] = sizeOf(t.b, t.rot, t), [ow, oh] = OLD_WONDER_SIZE[t.b];
    state.tiles.delete(k); rebuildCover();
    const tries = [];
    for (let dy = 0; dy <= h - oh; dy++) for (let dx = 0; dx <= w - ow; dx++) tries.push([x - dx, y - dy]);
    const mx = (w - ow) / 2, my = (h - oh) / 2, off = ([ax, ay]) => Math.hypot(x - ax - mx, y - ay - my);
    tries.sort((a, b) => off(a) - off(b));
    const fits = ([ax, ay], decosOk) => footprint(t.b, ax, ay, t.rot, t).every(([fx, fy]) => {
      const kk = fx + ',' + fy;
      return ownedTile(fx, fy) && !COVER.has(kk) && terrainAt(fx, fy) !== 'water' && (decosOk || !state.decos.has(kk));
    });
    const spot = tries.find(p => fits(p, false)) || tries.find(p => fits(p, true));
    if (spot) {
      for (const [fx, fy] of footprint(t.b, spot[0], spot[1], t.rot, t)) {
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
// v10 (29.09.): Das Rathaus ist 3×3 statt 2×2. Es wächst in die Richtung, in der am wenigsten im Weg steht – am
// liebsten nach hinten (die Wege liegen meist vorn). Nie ins Wasser, nie über Sehenswürdigkeiten oder Wunderwerke.
// Was weichen muss, gibt es voll zurück – samt Ausbau.
function fullValue(t) {
  const d = ITEMS[t.b], c = { money: d.cost || 0, ...(d.mat || {}) }, add = o => { for (const [r, n] of Object.entries(o || {})) c[r] = (c[r] || 0) + n; };
  if (t.b === 'haus') for (let l = 1; l < t.lvl; l++) add(houseCost(HOUSE_STAGES[l]));
  else if (BUILD_STAGES[t.b]) BUILD_STAGES[t.b].up.slice(0, (t.lvl || 1) - 1).forEach(u => add(u.cost));
  if (t.b === 'schiene' && t.bridge) { c.money = BRIDGE.cost; }
  return c;
}
function growTownHall() {
  if (!state.growHall) return null;
  delete state.growHall;
  const e = [...state.tiles].find(([, t]) => t.b === 'rathaus');
  if (!e) return null;
  const [k, t] = e, [x, y] = keyXY(k);
  state.tiles.delete(k);
  rebuildCover();
  const score = ([ax, ay]) => {
    let s = 0;
    for (const [fx, fy] of footprint('rathaus', ax, ay, 0)) {
      if (!ownedTile(fx, fy) || terrainAt(fx, fy) === 'water') return Infinity;
      const a = anchorAt(fx, fy), o = a && state.tiles.get(a);
      if (o && (o.b === 'lm' || WONDERS[o.b])) return Infinity;
      if (o) s += o.b === 'weg' || o.b === 'schiene' ? 1 : 50;
      const ds = state.decos.get(fx + ',' + fy);
      if (ds) s += ds.filter(Boolean).length * 0.5;
    }
    return s;
  };
  const spots = [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]].map(p => [score(p), p]).filter(p => isFinite(p[0]));
  spots.sort((a, b) => a[0] - b[0]);                  // stabil: bei Gleichstand nach hinten
  if (!spots.length) { state.tiles.set(k, t); rebuildCover(); return { gone: [] }; }   // fitFootprints räumt dann
  const [ax, ay] = spots[0][1], gone = [];
  for (const [fx, fy] of footprint('rathaus', ax, ay, 0)) {
    const kk = fx + ',' + fy, a = anchorAt(fx, fy), o = a && state.tiles.get(a);
    if (o) {
      for (const [r, n] of Object.entries(fullValue(o))) if (r === 'money') state.money += n; else state.res[r] += n;
      if (o.b !== 'weg' && o.b !== 'schiene') gone.push(ITEMS[o.b].name);
      state.tiles.delete(a);
      rebuildCover();
    }
    const ds = state.decos.get(kk);
    if (ds) { for (const d of ds) if (d) { state.money += ITEMS[d.b].cost || 0; for (const [r, n] of Object.entries(ITEMS[d.b].mat || {})) state.res[r] += n; } state.decos.delete(kk); }
    if (terrainAt(fx, fy) !== 'grass') state.terra.set(kk, 'grass');
  }
  state.tiles.set(ax + ',' + ay, t);
  rebuildCover();
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  return { gone };
}
// v11 (29.09.): Der Hafen ist 3 tief × 4 breit (vorn das Wasser). Alte Häfen (2×2) wachsen dorthin, wo am wenigsten
// im Weg steht und die Vorderseite am Wasser liegt; was weicht, gibt es voll zurück. Passt er nirgends: Hafen samt Schiffen
// zurück (alles erstattet).
function growHarbors() {
  if (!state.growHarbors) return null;
  delete state.growHarbors;
  const out = { grown: 0, gone: [], refunded: 0 };
  for (const [k, t] of [...state.tiles]) {
    if (t.b !== 'hafen') continue;
    const [x, y] = keyXY(k);
    state.tiles.delete(k); rebuildCover();
    const cands = [];
    for (const r of [t.rot || 0, 0, 1, 2, 3]) {
      const [w, h] = sizeOf('hafen', r);
      for (let ay = y + 2 - h; ay <= y; ay++) for (let ax = x + 2 - w; ax <= x; ax++) {
        let score = 0, ok = true;
        for (const [fx, fy] of footprint('hafen', ax, ay, r)) {
          if (!ownedTile(fx, fy) || terrainAt(fx, fy) === 'water') { ok = false; break; }
          const a = anchorAt(fx, fy), o = a && state.tiles.get(a);
          if (o && (o.b === 'lm' || o.b === 'rathaus' || WONDERS[o.b])) { ok = false; break; }
          if (o) score += o.b === 'weg' || o.b === 'schiene' ? 1 : 50;
          const ds = state.decos.get(fx + ',' + fy);
          if (ds) score += ds.filter(Boolean).length * 0.5;
        }
        if (!ok) continue;
        const wet = frontTiles('hafen', ax, ay, r).filter(([fx, fy]) => isWater(fx, fy)).length;
        if (!wet) continue;
        cands.push({ ax, ay, r, score: score - wet * 0.1 });
      }
    }
    cands.sort((p, q) => p.score - q.score);
    const c = cands[0];
    if (!c) {                                                    // passt nirgends: alles zurück
      const back = fullValue(t);
      for (const s of t.ships || []) for (const [r, n] of Object.entries(shipModel(s).buy)) back[r] = (back[r] || 0) + n;
      for (const [r, n] of Object.entries(back)) if (r === 'money') state.money += n; else state.res[r] += n;
      out.refunded++;
      continue;
    }
    for (const [fx, fy] of footprint('hafen', c.ax, c.ay, c.r)) {
      const kk = fx + ',' + fy, a = anchorAt(fx, fy), o = a && state.tiles.get(a);
      if (o) {
        for (const [r, n] of Object.entries(fullValue(o))) if (r === 'money') state.money += n; else state.res[r] += n;
        if (o.b !== 'weg' && o.b !== 'schiene') out.gone.push(ITEMS[o.b].name);
        state.tiles.delete(a); rebuildCover();
      }
      const ds = state.decos.get(kk);
      if (ds) { for (const d of ds) if (d) { state.money += ITEMS[d.b].cost || 0; for (const [r, n] of Object.entries(ITEMS[d.b].mat || {})) state.res[r] += n; } state.decos.delete(kk); }
      if (terrainAt(fx, fy) !== 'grass') state.terra.set(kk, 'grass');
    }
    // Schiffe, die zu diesem Hafen fuhren, finden ihn am neuen Anker
    const nk = c.ax + ',' + c.ay;
    for (const u of state.tiles.values()) if (u.ships) for (const s of u.ships) if (s.to === k) s.to = nk;
    state.tiles.set(nk, { ...t, rot: c.r });
    rebuildCover();
    out.grown++;
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear();
  return out.grown || out.refunded ? out : null;
}
function announceHarbors(r) {
  if (!r) return;
  toast([r.grown ? `⚓ Neu: größere Häfen mit Kai und Pier${r.gone.length ? ` – Platz gemacht: ${r.gone.join(', ')} (erstattet)` : ''}` : '',
    r.refunded ? `${r.refunded} ${r.refunded === 1 ? 'Hafen passte' : 'Häfen passten'} nicht mehr – alles erstattet` : ''].filter(Boolean).join(' · '));
}
function announceHall(r) {
  if (!r) return;
  toast(`🏛️ Das Rathaus ist gewachsen (3×3)${r.gone.length ? ` – Platz gemacht: ${r.gone.join(', ')} (alles erstattet)` : ''}`);
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
    const [w, h] = sizeOf(t.b, t.rot, t);
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
      for (const [fx, fy] of footprint(t.b, x, y, t.rot, t)) {
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
      for (const [fx, fy] of footprint(t.b, spot[0], spot[1], t.rot, t)) state.decos.delete(fx + ',' + fy);
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
    for (const ek of ['a' + k, 'b' + k]) { const e = state.edges.get(ek); if (e) sum += ITEMS[e.b].beauty + (e.arch ? ARCHES[e.arch].beauty : 0); }   // Linien
  }
  return sum;
}
// Erreichbar per Weg oder Bahn (Block 26): Versorgung zählt auch, wenn sie im selben Viertel steht (über Wege oder
// Aneinandergrenzen verbunden) oder mit einer fahrenden Verbindung (Zug, Seilbahn, Fähre) erreichbar ist – beides nah an
// Stationen derselben Verbindung (im Viertel der Station oder bis WALK_REACH davon). Schönheit, Wasser, Ruhe und
// „direkt daneben“ bleiben Sache der Umgebung.
function buildAccess(net, links) {
  const add = (m, b, k) => { if (!m.has(b)) m.set(b, []); m.get(b).push(k); }, inV = new Map();
  for (const [k, t] of state.tiles) { const v = net.vOf(k); if (!v) continue; if (!inV.has(v)) inV.set(v, new Map()); add(inV.get(v), t.b, k); }
  const byLink = links.filter(l => l.regions.length > 1 || l.kind === 'seil').map(l => {
    const near = new Set();
    for (const s of l.stations) {
      const v = net.vOf(s), [x0, y0, x1, y1] = stopBox(s);
      if (v && inV.has(v)) for (const ks of inV.get(v).values()) for (const k of ks) near.add(k);
      for (let y = y0 - WALK_REACH; y <= y1 + WALK_REACH; y++) for (let x = x0 - WALK_REACH; x <= x1 + WALK_REACH; x++) { const a = COVER.get(x + ',' + y); if (a) near.add(a); }
    }
    const kinds = new Map();
    for (const k of near) add(kinds, state.tiles.get(k).b, k);
    return { how: l.kind || 'bahn', near, kinds };
  });
  return { net, inV, byLink };
}
// Erreicht das Objekt (Anker k) n Gebäude der Sorte? how: 'nah' (Umkreis r), 'viertel', 'bahn'/'seil'/'faehre' – oder null
function reachKind(acc, k, x, y, r, pred, n = 1) {
  const got = new Set(nearList(x, y, r, pred, n));
  if (got.size >= n) return { count: got.size, how: 'nah' };
  if (!acc) return { count: got.size, how: null };
  const take = kinds => { for (const [b, ks] of kinds) if (pred(b)) for (const q of ks) { if (q !== k && state.tiles.has(q) && (!STANDS[b] || MARKT_OK.has(q))) got.add(q); if (got.size >= n) return true; } return false; };
  const v = acc.net.vOf(k);
  if (v && acc.inV.has(v) && take(acc.inV.get(v))) return { count: got.size, how: 'viertel' };
  for (const L of acc.byLink) if (L.near.has(k) && take(L.kinds)) return { count: got.size, how: L.how };
  return { count: got.size, how: null };
}
// Versorgungs-Wünsche: Umkreis und Sorte
const WISH_REACH = { baecker: [6, b => isKind('baecker', b)], markt: [8, b => isKind('markt', b)],
  park: [4, b => isKind('park', b) || isKind('brunnen', b)], schule: [10, b => isKind('schule', b)],
  laden: [8, b => isKind('laden', b)], cafe: [8, b => isKind('cafe', b)], kultur: [12, b => isKind('kultur', b)] };
function wishCheck(w, x, y, acc = T.access) {
  if (acc && acc.green && (w === 'park' || w === 'schoen')) return { ok: true, how: 'garten' };     // Botanischer Garten
  if (!WISH_REACH[w]) return { ok: wishMet(w, x, y), how: null };
  const [r, pred] = WISH_REACH[w], got = reachKind(acc, x + ',' + y, x, y, r, pred);
  return { ok: !!got.how, how: got.how };
}
function wishMet(w, x, y) {
  if (WISH_REACH[w]) return wishCheck(w, x, y).ok;
  switch (w) {
    case 'weg': return DIRS.some(([dx, dy]) => bAt(x + dx, y + dy) === 'weg' || crossingAt(x + dx, y + dy));
    case 'deko': {
      if (state.decos.has(x + ',' + y)) return true;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (state.decos.has((x + dx) + ',' + (y + dy))) return true;
      return objWithin(x, y, 2, b => ITEMS[b].cat === 'deko' && b !== 'weg');
    }
    case 'ruhe': return !objWithin(x, y, 1, b => NOISY.has(b));
    case 'schoen': return beautyAround(x, y, 3) >= 30;
    case 'wasser': return countAround(x, y, 3, isWater) > 0;
    default: return false;
  }
}
// Wünsche für die nächste Stufe (alle bisherigen zählen weiter mit)
// Hausausbau: Taler (steigend mit der Stufe) und Material
const houseCost = st => ({ money: st.money || 0, ...(st.mat || {}) });
function houseWishes(t, x, y, acc = T.access) {
  const next = HOUSE_STAGES[t.lvl];
  if (!next) return { next: null, list: [], met: 0, total: 0, ready: false };
  // Stufen mit Freischaltung (Glasvilla: Kristallhöhle) bleiben bis dahin nur ein Ausblick
  if (next.lm && !unlockOk(next, 'haus:' + next.name)) return { next: null, later: next, list: [], met: 0, total: 0, ready: false };
  const ids = HOUSE_STAGES.slice(1, t.lvl + 1).flatMap(st => st.wishes);
  const list = ids.map(id => ({ id, text: WISHES[id].text, ...wishCheck(id, x, y, acc) }));
  const met = list.filter(w => w.ok).length;
  return { next, list, met, total: list.length, ready: met === list.length };
}

function demolishInfo(x, y) {
  if (!ownedTile(x, y)) return { err: isSea(x, y) ? 'Hier ist nur Meer' : 'Das ist nicht dein Grundstück' };
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (t) {
    const d = ITEMS[t.b];
    if (t.b === 'lm') return { err: 'Sehenswürdigkeiten bleiben stehen' };
    if (t.b === 'truhe') return { err: 'Die Truhe erst öffnen (antippen)' };
    if (d.fixed) return { err: 'Das Rathaus bleibt stehen' };
    if (d.pop) {
      const lost = d.pop * t.lvl;
      if (T.pop - lost < T.jobs) return { err: 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.' };
    }
    // Deko und Wege gibt es voll zurück (Umgestalten soll nichts kosten), Gebäude zur Hälfte – auch die Ausbau-Taler
    const full = d.cat === 'deko' || d.cat === 'markt' || t.b === 'weg' || t.b === 'schiene';
    const paid = t.b === 'schiene' && t.bridge ? BRIDGE : { cost: d.cost, mat: d.mat };
    if (isCrossing(t)) {                             // Übergang: Schiene und Weg (und die Fußgängerbrücke) zurück
      const { money: fm, ...fmat } = footPaidOf(t) ? FOOT_STYLES[footPaidOf(t)].cost : { money: 0 }, mat = { ...d.mat };
      for (const [r, n] of Object.entries(fmat)) mat[r] = (mat[r] || 0) + n;
      return { anchor: a, refund: d.cost + ITEMS.weg.cost + fm, mat, label: 'Bahnübergang entfernen' };
    }
    const staged = BUILD_STAGES[t.b] ? BUILD_STAGES[t.b].up.slice(0, t.lvl - 1).reduce((s, u) => s + (u.cost.money || 0), 0)
      : WONDERS[t.b] ? wonderPaid(t).money : t.b === 'hbf' ? (hbfGleise(t) - HBF_MIN) * GLEIS_COST.money : 0;
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
  const old = state.tiles.get(k);                                  // Weg unter einem Marktstand bleibt liegen
  state.tiles.set(k, { b, lvl: 1, rot, ...(old && plazaSpot(b, x, y) ? { weg: wegUnder(old) } : {}) });
  const t = totals();
  if (old) state.tiles.set(k, old); else state.tiles.delete(k);
  rebuildCover();
  const st = t.st.get(k) || {};
  previewCache = { k, b, rot, inc: t.inc - T.inc, beauty: t.beauty - T.beauty, sci: t.sci - T.sci, prod: st.prod, conv: st.conv,
                   pop: t.pop - T.pop, how: t.st.get(k)?.how, bonus: t.st.get(k)?.bonus || 0 };
  return previewCache;
}
