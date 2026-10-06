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
    paintNew: {},              // Gebäudeart → Farben für neu Gebautes ({ wall, roof, win }; false = aus, Block 73)
    festival: false,
    town: { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(['0,0']),   // Grundstücke (6×6) der erschlossenen Inseln
    islands: new Set(['home']),
    claimed: new Set(),        // einzelne Meerfelder, die man sich per Aufschütten oder Brücke genommen hat
    tipsSeen: new Set(),       // gezeigte Tipps (GUIDE)
    mastery: {},               // Stufen-Forschung: id → Stufe
    inventions: new Set(),     // Erfindungen (für Ideen)
    orders: [], orderNext: 0,  // Aufträge der Frachter am Handelshafen (Block 24), nächster ab orderNext
    keep: {},                  // Vorrat je Ware, den Läden nicht verkaufen (Block 33; fehlt: KEEP_DEFAULT)
    incPeak: 0,                // bestes Einkommen bisher (Taler/s) – danach richten sich die Wunder-Preise (Block 37)
    vehicles: new Set(),       // erforschte Verkehrsmittel: 'zug:regio', 'schiff:dampfer' … (Forschung „Verkehr“)
    expedition: null,          // Boot unterwegs: { isle, from: Steg-Feld, t0, until } (echte Zeit, läuft auch geschlossen weiter)
    decree: null, decreeNext: 0,   // Erlass im Schloss (Block 28): { id, until }; der nächste ab decreeNext (echte Zeit)
    fzFest: null,              // Parade im Freizeitpark (Block 60d): { until, next, mul }
    parkFest: null,            // Parkfest (Block 44): { until, next, mul } – selbst ausgelöst im Park-Fenster (echte Zeit)
    far: [],                   // ferne Inseln (nach dem Laternenfest, Block 27c): { id, n, name, icon, ter, cx, cy, r, need, chest, res }
    stats: { earned: 0 },      // für Erfolge: insgesamt verdiente Taler
    achieved: {},              // Erfolge: id → erreichte Stufen (⭐)
    album: new Set(),          // Sammelalbum: gesammelte Einträge ('b:haus', 'hs:3', 'wall:2', 'tier:katze' …)
    tipsOff: false,
    tiles: new Map(),
    terra: new Map(),
    techs: new Set(),
    decos: new Map(),          // kleine Dekos: Feld → [4 Ecken] mit { b, rot } oder null
    edges: new Map(),          // Linien auf Feldkanten (Block 41): 'a3,4' / 'b3,4' → { b: 'hecke'|'zaun'|'mauer', style }
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
  if (t.col) o.col = t.col;                                     // Buschfarbe (Block 89)
  if (t.lm) o.lm = t.lm;
  if (t.rot) o.rot = t.rot;
  if (t.style) o.style = t.style;
  if (t.animal) { o.animal = t.animal; o.name = t.name; if (t.more) o.more = t.more.map(r => ({ animal: r.animal, name: r.name })); }
  if (t.stage != null) o.stage = t.stage;
  if (t.look) o.look = t.look;
  if (t.bridge) o.bridge = true;
  if (t.mini) o.mini = true;                                                             // alter 1×1-Leuchtturm (Block 83)
  if (t.wide) o.wide = true;                                                             // Wegform (Block 77)
  if (t.sq) o.sq = true;
  if (t.end) o.end = t.end;
  if (t.zug === false) o.zug = false;                                                       // Gartenweg aus
  if (t.vp) o.vp = t.vp;                                                                    // Belag des Vorplatzes (Block 91)
  if (t.brk) o.brk = t.brk;
  if (t.brc != null) o.brc = t.brc;                                                      // Brückenfarben (Block 66b)
  if (t.brw != null) o.brw = t.brw;                                                              // Wegbrücke: Art (Block 66)
  if (t.phase != null) { o.phase = t.phase; if (t.rate != null) o.rate = t.rate; if (t.paid) o.paid = t.paid; }
  if (t.train) { o.train = t.train; o.trainCol = t.trainCol || 0; if (t.trainPlus) o.trainPlus = t.trainPlus; }
  if (t.extra) o.extra = t.extra.map(e => ({ model: e.model, col: e.col, ...(e.plus ? { plus: e.plus } : {}) }));
  if (t.ships && t.ships.length) o.ships = t.ships.map(s => ({ model: s.model, to: s.to }));   // Schiffe am Hafen
  if (t.isle) o.isle = t.isle;
  if (t.gleise) o.gleise = t.gleise;                                                     // Hauptbahnhof: Gleise und ihre Züge
  if (t.gleis) o.gleis = t.gleis.map(c => c ? { ...(c.train ? { train: c.train, trainCol: c.trainCol || 0 } : {}), ...(c.trainPlus ? { trainPlus: c.trainPlus } : {}),
    ...(c.extra ? { extra: c.extra.map(e => ({ model: e.model, col: e.col, ...(e.plus ? { plus: e.plus } : {}) })) } : {}) } : {});                                                         // Truhe: von welcher fernen Insel
  if (t.weg != null) o.weg = t.weg;                                                      // Marktplatz: Weg darunter
  if (t.wegs) o.wegs = { ...t.wegs };                                                   // … unter den übrigen Feldern großer Deko
  if (t.price != null) o.price = t.price;                                               // Freizeitpark: bezahlter Preis (Block 60)
  if (t.loop) { o.loop = true; if (t.loopPrice != null) o.loopPrice = t.loopPrice; }    // Achterbahn: Looping
  if (t.win != null) o.win = t.win;                                                     // Fensterfarbe (Block 60e)
  if (t.fl != null) o.fl = t.fl;                                                         // Torturm: Stockwerke (Block 60f)
  if (t.cs) o.cs = JSON.parse(JSON.stringify(t.cs));                                                          // Märchenschloss: Gestalt (Block 60g)
  if (t.hgt != null) o.hgt = t.hgt;                                                     // Achterbahn: Höhenstufe (Block 60e)
  if (t.cross) { o.cross = true; if (t.foot) o.foot = true; if (t.footPaid) o.footPaid = t.footPaid; }
  return o;
}
function serialize() {
  // was man gerade trägt, wird an seinem alten Platz gespeichert (ersetzt den Weg, der unter einem Marktstand liegen bleibt)
  const tmap = new Map();
  for (const [k, t] of state.tiles) tmap.set(k, tileOut(t));
  const held = typeof moving !== 'undefined' ? carried() : [];     // auch eine ganze Gruppe
  for (const it of held) if (it.kind === 'tile') {
    tmap.set(it.from, tileOut(it.t));
    const [fx, fy] = keyXY(it.from);                                    // die liegengelassenen Wege gehören wieder darunter (Block 58)
    for (const o of Object.keys(it.t.wegs || {})) { const [dx, dy] = keyXY(o); tmap.delete((fx + dx) + ',' + (fy + dy)); }
  }
  const tiles = [...tmap];
  const decoMap = new Map([...state.decos].map(([k, ds]) => [k, ds.slice()]));
  for (const it of held) {
    if (it.kind !== 'deco') continue;
    const [k, slot] = it.from;
    if (!decoMap.has(k)) decoMap.set(k, newSlots());
    decoMap.get(k)[slot] = it.d;
  }
  const decos = [...decoMap].map(([k, ds]) => [k, ds.map(d => d && { b: d.b, rot: d.rot || 0, ...(d.col ? { col: d.col } : {}), ...(d.free ? { free: true } : {}) })]);   // Buschfarbe (Block 89), geschenkt (84b)
  return {
    game: 'kachelhausen', v: 12, seed: state.seed, money: state.money, res: state.res, science: state.science,
    restore: state.restore, diary: state.diary, diarySeen: state.diarySeen, tutorial: state.tutorial, legacy: [...state.legacy], festival: state.festival,
    design: [...state.design], paintNew: state.paintNew,
    town: state.town, owned: [...state.owned], islands: [...state.islands], claimed: [...state.claimed], tipsSeen: [...state.tipsSeen], tipsOff: state.tipsOff, mastery: state.mastery, inventions: [...state.inventions], vehicles: [...state.vehicles], far: state.far.map(({ far, ...f }) => f), decree: state.decree, decreeNext: state.decreeNext, parkFest: state.parkFest, fzFest: state.fzFest, noBorders: !!state.noBorders, keep: state.keep, incPeak: state.incPeak, orders: state.orders, orderNext: state.orderNext, expedition: state.expedition, stats: state.stats, achieved: state.achieved, album: [...state.album], tiles, terra: [...state.terra], techs: [...state.techs],
    decos, edges: [...state.edges].map(([k, e]) => [k, { b: e.b, style: e.style, ...(e.col ? { col: e.col } : {}), ...(e.arch ? { arch: e.arch } : {}), ...(e.flush != null ? { flush: e.flush } : {}), ...(e.gate ? { gate: e.gate } : {}) }]), cam: state.cam, last: state.last, muted: state.muted,
  };
}

// Viele Felder auf einmal (Linie, Rechteck): rechnen, speichern und Töne erst am Ende, einmal
let BATCH = 0;
function batch(fn) {
  BATCH++;
  try { return fn(); } finally { BATCH--; if (!BATCH) { recalc(); save(); } }
}
function save() {
  if (!state || PROBE || BATCH || TESTWELT || VISIT || saveBlocked) return;
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
  // Block 39: Märkte sind jetzt Plätze zum Selberbauen – ein alter Markt (3×3) wird ein Kopfsteinplatz mit Ständen
  // (Stufe 1: 3, 2: 6, 3: 9 – so bleibt es Marktplatz, Wochenmarkt, Großer Markt). Belegte Felder bleiben, wie sie sind.
  if (d.tiles.some(([, t]) => t && t.b === 'markt')) {
    const keys = new Set(d.tiles.map(([k]) => k)), add = [], ids = Object.keys(STANDS);
    const spots = [[0, 0], [2, 0], [0, 2], [2, 2], [1, 0], [0, 1], [2, 1], [1, 2], [1, 1]];      // Ecken, Seiten, Mitte
    d.tiles = d.tiles.filter(([k, t]) => {
      if (!t || t.b !== 'markt') return true;
      const [ax, ay] = k.split(',').map(Number), n = [3, 6, 9][Math.min(3, Math.max(1, t.lvl || 1)) - 1];
      let placed = 0;
      for (const [i, j] of spots) {
        const q = (ax + i) + ',' + (ay + j);
        if (q !== k && keys.has(q)) continue;
        keys.add(q);
        add.push([q, placed < n ? { b: ids[placed % ids.length], lvl: 1, weg: 'kopf' } : { b: 'weg', lvl: 1, style: 'kopf' }]);
        placed++;
      }
      return false;
    });
    d.tiles.push(...add);
  }
  // Block 44: Parks sind jetzt Parkrasen zum Selberbauen – ein alter Park (3×3) wird 9 Felder Rasen mit Brunnen in der Mitte,
  // Bäumen, zwei Bänken und einem Blumentopf (so ist er gleich wieder ein „Park“)
  if (d.tiles.some(([, t]) => t && t.b === 'park')) {
    const terra = d.terra || (d.terra = []), decos = d.decos || (d.decos = []), add = [];
    const slots = list => { const s = Array(SLOTS).fill(null); for (const [i, b, rot] of list) s[i] = { b, rot: rot || 0 }; return s; };
    const LAYOUT = { '0,0': [[0, 'baum']], '2,0': [[1, 'baum']], '0,2': [[3, 'baum']], '2,2': [[2, 'baum']], '1,0': [[0, 'baum']],
      '0,1': [[6, 'blumentopf']], '2,1': [[4, 'bank', midRot(4)]], '1,2': [[5, 'bank', midRot(5)]] };
    d.tiles = d.tiles.filter(([k, t]) => {
      if (!t || t.b !== 'park') return true;
      const [ax, ay] = k.split(',').map(Number);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
        const q = (ax + i) + ',' + (ay + j), l = LAYOUT[i + ',' + j];
        terra.push([q, 'park']);
        if (l) decos.push([q, slots(l)]);
      }
      add.push([(ax + 1) + ',' + (ay + 1), { b: 'brunnen', lvl: 1 }]);
      return false;
    });
    d.tiles.push(...add);
  }
  for (const [, t] of d.tiles) {
    // Block 37: Stände ohne incPeak – Baustellen merkten sich ihr Einkommen von vor der Personal-Grenze (oft viel zu hoch)
    if (!('incPeak' in d) && t.phase != null && WONDERS[t.b] && t.phase < WONDERS[t.b].phases.length) delete t.rate;
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
    paintNew: Object.fromEntries(Object.entries(d.paintNew || {}).filter(([b, p]) => ITEMS[b] && (p === false || (p && typeof p === 'object')))
      .map(([b, p]) => [b, p && Object.fromEntries(Object.entries(p).filter(([k, v]) => PAINT_KEYS.includes(k) && Number.isInteger(v) && v >= 0))])),
    oldSave: !d.restore,
    fitLm: false,                   // (v5/v6: Sehenswürdigkeiten rückten auf der Heimatinsel; seit v7 ziehen sie um)
    growWonders: (d.v || 3) < 9,     // v9 (30.09.): Wunderwerke sind größer geworden (growWonders)
    growHall: (d.v || 3) < 10,       // v10 (29.09.): Das Rathaus ist 3×3 (growTownHall)
    growHarbors: (d.v || 3) < 11,    // v11 (29.09.): Häfen sind 3×4 mit Kai und Pier (growHarbors)
    growLight: (d.v || 3) < 12,      // v12 (04.10.): Leuchtturm ist ein 3×3-Kap (growLighthouses)
    fitBig: (d.v || 3) < 12,         // Grundflächen nach heutigen Größen prüfen (fitFootprints) – nur, wenn sich Größen geändert haben
    moveLm: (d.v || 3) < 7,         // v7: Sehenswürdigkeiten ziehen auf ihre Themen-Inseln (migrateIslands)
    boughtPlots: (d.v || 3) < 7 ? Math.max(0, d.owned.length - 1) : 0,
    islands: new Set(d.islands || ['home']),
    claimed: new Set(d.claimed || []),
    tipsSeen: new Set(d.tipsSeen || []), tipsOff: !!d.tipsOff,
    mastery: { ...(d.mastery || {}) }, inventions: new Set(d.inventions || []),
    decree: d.decree && typeof d.decree.id === 'string' && +d.decree.until ? { id: d.decree.id, until: +d.decree.until } : null, decreeNext: +d.decreeNext || 0,
    parkFest: d.parkFest && +d.parkFest.until ? { until: +d.parkFest.until, next: +d.parkFest.next || 0, mul: +d.parkFest.mul || 1.25 } : null,
    noBorders: !!d.noBorders,                                            // Randlinien von Park/Freizeitpark aus (Block 60e)
    fzFest: d.fzFest && +d.fzFest.until ? { until: +d.fzFest.until, next: +d.fzFest.next || 0, mul: +d.fzFest.mul || 1.3 } : null,
    far: Array.isArray(d.far) ? d.far.filter(f => f && typeof f.id === 'string' && isFinite(f.cx) && isFinite(f.cy) && f.r > 0 && f.name) : [],
    expedition: d.expedition && (ISLE_BY_ID[d.expedition.isle] || (d.far || []).some(f => f && f.id === d.expedition.isle)) && +d.expedition.until ? { ...d.expedition } : null,
    vehicles: new Set([...(d.vehicles || []), ...grandfathered.filter(v => v !== 'zug:tram')]),
    orders: Array.isArray(d.orders) ? d.orders.filter(o => o && RES[o.res] && o.amount > 0) : [], orderNext: +d.orderNext || 0,
    keep: Object.fromEntries(Object.entries(d.keep || {}).filter(([r, n]) => RES[r] && isFinite(n) && n >= 0)),
    incPeak: isFinite(d.incPeak) && d.incPeak > 0 ? d.incPeak : 0,
    stats: { earned: 0, ...(d.stats || {}) }, achieved: { ...(d.achieved || {}) }, album: new Set(d.album || []),
    town: d.town || { name: 'Sonnenbucht', color: FLAG_COLORS[1], symbol: '🐟' },
    owned: new Set(d.owned), tiles: new Map(d.tiles), terra: new Map(d.terra || []), techs: new Set(d.techs.filter(id => id in TECH_BY_ID)),   // alte Forschung (Farben, Wege) ist jetzt Kunstakademie
    // Block 41: die Hecke ist jetzt eine Linie – alte Hecken-Ecken werden kleine Büsche an derselben Stelle
    decos: new Map((d.decos || []).map(([k, ds]) => [k, [...(ds || []), ...newSlots()].slice(0, SLOTS).map(dd => dd && dd.b === 'hecke' ? { ...dd, b: 'busch' } : dd)])),
    edges: new Map((d.edges || []).filter(([k, e]) => /^[ab]-?\d+,-?\d+$/.test(k) && e && EDGE_TOOLS.has(e.b)).map(([k, e]) => [k, { b: e.b, style: e.style, ...(Number.isInteger(e.col) && BUSH_COLS[e.col] ? { col: e.col } : {}), ...(ARCHES[e.arch] ? { arch: e.arch } : {}), ...(typeof e.flush === 'boolean' ? { flush: e.flush } : {}), ...(e.gate === true || e.gate === 'offen' ? { gate: e.gate } : {}) }])),
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
  for (const [, t] of d.tiles || []) if (['saege', 'steinmetz', 'schmiede', 'obst', 'mine', 'windrad'].includes(t.b)) out.push(t.b);
  return [...new Set(out)];
}

// Unlesbare Stände nie überschreiben: Kopie aufbewahren und beim Start Bescheid sagen
let loadFailure = null, saveBlocked = false;     // Kopie nicht möglich: nichts speichern, bis der Stand als Datei gesichert ist
function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return parseSave(JSON.parse(raw));
  } catch (e) {
    const backup = SAVE_KEY + '_defekt_' + Date.now();
    try { localStorage.setItem(backup, raw); loadFailure = backup; } catch (err) { loadFailure = 'nicht gesichert'; saveBlocked = raw; }
    return null;
  }
}

// Einen anderen Stand übernehmen (Import): Zwischenspeicher leeren, alles neu zeichnen
function adoptState(s) {
  resetUnlockWatch(); resetSales();
  state = s;
  cam = state.cam;
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
  walkers.length = 0; cars.length = 0;
  plan = null; moving = null;                      // Planung und Getragenes gehören zum alten Stand
  afterLoad();
  buildToolbar();
  save();
}
// Nach dem Laden (Start und Import gleich, Block 84a): alte Stände umstellen, still zählen, Neues ansagen
function afterLoad() {
  resetUndo();                                     // ↶ gehört zum vorigen Stand
  registerFar();                                   // ferne Inseln zuerst: sie sind Land
  normalizeSmall();
  migrateLandmarks();                              // uralte Stände: gekaufte Sehenswürdigkeiten zählen als Stufe 1 …
  const moved = migrateIslands();                  // … und ziehen dann auf ihre Insel um
  ownIslandsFully();
  ensureFar();
  if (state.growLight) for (const t of state.tiles.values()) if (t.b === 'leuchtturm') t.mini = true;   // alter Leuchtturm ist 1×1 – auch fürs Wachsen von Hafen/Rathaus
  const grown = growWonders();
  const hall = growTownHall();
  const ports = growHarbors();
  const lights = growLighthouses();
  const refunded = fitFootprints();
  delete state.fitLm;
  nameHouses();
  recalc();
  collectAlbum();
  checkAchievements(true);                         // schon Erreichtes still zählen (Regel 30)
  if (moved) setTimeout(() => announceIslands(moved), 900);
  if (grown.length) setTimeout(() => announceWonders(grown), 1200);
  if (hall) setTimeout(() => announceHall(hall), 1600);
  if (ports) setTimeout(() => announceHarbors(ports), 2000);
  if (lights) setTimeout(() => toast('🗼 Neu: Dein Leuchtturm ist jetzt ein ganzes Kap mit Wärterhaus und großem Leuchtfeuer!'), 2400);
  if (refunded.length) setTimeout(() => toast(`Neu: große Gebäude! Kein Platz für ${refunded.join(', ')} – Kosten erstattet.`), 800);
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
