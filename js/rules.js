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
// Halle (Block 118/121, seit Block 123 immer in der Mitte): Gleis – Steig – Halle – Steig – Gleis, rechts der Halle gespiegelt
// (erst der Bahnsteig, dann das Gleis). t.wing = 2, t.mid = Gleise links der Halle; der Bahnhof ist 2 × Gleise + 1 breit.
// Ohne t: so, wie man ihn neu baut. Alte Bahnhöfe ohne Halle (t.wing fehlt) gibt es nur noch, wo beim Umstellen kein Platz
// war (hbfUpgrade); alte Seitenflügel (±1) gelten als Mittelhalle.
const HBF_NEW = { wing: 2, mid: 1 };                              // so wird er neu gebaut
const hbfWing = t => (!t || t.wing === 1 || t.wing === -1 || t.wing === 2 ? 2 : 0);
function hbfLeft(t) {                                             // so viele Gleise liegen links von der Halle
  const n = hbfGleise(t);
  if (!hbfWing(t)) return n;
  const m = t && Number.isInteger(t.mid) ? t.mid : Math.floor(n / 2);
  return Math.max(1, Math.min(n - 1, m));
}
const hbfHalfW = t => (2 * hbfGleise(t) + (hbfWing(t) ? 1 : 0)) / 2;
const hbfTrackB = (t, g) => -hbfHalfW(t) + 0.5 + 2 * g + (hbfWing(t) && g >= hbfLeft(t) ? 2 : 0);   // Mitte von Gleis g (b im eigenen Rahmen)
const hbfPlatS = (t, g) => (hbfWing(t) && g >= hbfLeft(t) ? -1 : 1);                                   // Bahnsteig bei b + hbfPlatS (rechts: gespiegelt)
const hbfHallB = t => -hbfHalfW(t) + 2 * hbfLeft(t) + 0.5;                                            // Mitte der Halle
const hbfPortalB = t => (hbfWing(t) ? hbfHallB(t) : 0);                                                // Portal vor der Halle
// Kleiner Bahnhof 2 oder 3 Felder lang (Block 131): t.len = 3 (3: Tür genau mittig auf einem Feld). Ohne t: so, wie man ihn neu
// baut (Wahl in der Leiste, stationNewLen)
let stationNewLen = 2;
const stationLen = t => (t ? (t.len === 3 ? 3 : 2) : stationNewLen);
const sizeOf = (b, rot, t) => { const s = b === 'station' ? [1, stationLen(t)] : b === 'hbf' ? [4, 2 * hbfGleise(t) + (hbfWing(t) ? 1 : 0)] : b === 'fz_schloss' ? csSize(t) : b === 'leuchtturm' && t && t.mini ? [1, 1] : ITEMS[b].size || [1, 1]; return (rot & 1) ? [s[1], s[0]] : s; };   // alter Leuchtturm (t.mini): 1×1 (Block 83)
// Märchenschloss (Block 60g/60h): ein Gebäude, gestaltet im Fenster. t.cs = { w: Breite (Felder, quer zur Front), d: Tiefe,
// m/mk/mr: Mittelturm Höhe (0 keiner … 4 riesig), Dicke, Dach; cb/cf/cr: Mittelbau Breite, Stockwerke, Dach; wf/wr: Flügel
// Stockwerke, Dach; tw: Turmpaare von innen nach außen [{ h: Höhe, k: Dicke, p: Platz (vorn, Fassade, hinten), r: Dach }] }.
// Dächer: 0 Spitz (Flügel: Satteldach), 1 Kuppel (Flügel: Walmdach), 2 Zinnen. Immer über csOf lesen (füllt Fehlendes auf).
// Zierde (Block 60i): fc Fahnenfarbe (0 bunt), gd Gold, bk Balkone & Erker, wp Wappen (0 keins, Krone, Herz, Stern), lc Lichterketten;
// Umgebung: ex Freitreppe, mo Wassergraben, mw Mauer mit Tor, gn Garten mit Brunnen – mo/mw/gn brauchen ein Feld rundum (csRing)
// Block 74: mt Mitte (0 Block, 1 Turmgruppe), mf Mittelturm rund; je Turmpaar f rund. Fehlen sie, bleibt alles eckig wie früher.
// Block 75/76: wn Fenster (0 wenige … 3 ganz viele), gb Boden (0 Sockel, 1 Rasen, 2 Platz), gp Belag (Wegstil, sonst Platten).
const CS_DEF = { w: 5, d: 2, m: 2, mk: 1, mr: 0, mt: 0, mf: 0, wn: 1, gb: 0, cb: 1, cf: 2, cr: 0, wf: 2, wr: 0, tw: [{ h: 2, k: 1, p: 0, r: 0 }],
  fc: 0, gd: 1, bk: 0, wp: 0, lc: 0, ex: 0, mo: 0, mw: 0, gn: 0 };
const CS_LIM = { w: [3, 9], d: [1, 3], m: [0, 4], mk: [0, 2], mr: [0, 2], mt: [0, 1], mf: [0, 1], wn: [0, 3], gb: [0, 2], cb: [0, 2], cf: [1, 4], cr: [0, 2], wf: [1, 3], wr: [0, 2],
  fc: [0, 5], gd: [0, 1], bk: [0, 1], wp: [0, 3], lc: [0, 1], ex: [0, 1], mo: [0, 1], mw: [0, 1], gn: [0, 1] };
const CT_DEF = { h: 2, k: 1, p: 0, r: 0, f: 0 }, CT_LIM = { h: [0, 4], k: [0, 2], p: [0, 2], r: [0, 2], f: [0, 1] }, CS_TOWERS = 4;
// Neues Schloss (Block 74): Turmgruppe in der Mitte, alles rund – bestehende behalten ihre Gestalt (csOf füllt eckig auf)
const csNew = () => { const c = csOf(null); c.mt = 1; c.mf = 1; c.gb = 1; c.tw = c.tw.map(o => ({ ...o, f: 1 })); return c; };
const CORE_W = [1.2, 1.8, 2.6];
function csOf(t) {
  const c = (t && t.cs) || {}, o = { ...CS_DEF, ...c };
  if (!Array.isArray(c.tw) && (c.s != null || c.r != null)) {  // Block 60g: s Paare, eine Dachform r für alles
    const r = c.r || 0, s = c.s != null ? c.s : 1;
    if (c.r != null) { o.mr = r; o.cr = r; o.wr = r; }
    o.tw = Array.from({ length: s }, (_, i) => ({ ...CT_DEF, h: Math.max(0, 3 - i), r }));
  }
  o.tw = o.tw.slice(0, CS_TOWERS).map(x => ({ ...CT_DEF, ...x }));
  delete o.s; delete o.r;
  return o;
}
const csRing = c => c.mo || c.mw || c.gn ? 1 : 0;                         // Graben/Mauer/Garten: ein Feld rundum
const csSize = t => { const c = csOf(t), r = 2 * csRing(c); return [c.d + r, c.w + r]; };
const csCore = c => Math.min(CORE_W[c.cb], c.w - 0.8);                    // Breite des Mittelbaus (Felder)
// Wert: Grundpreis (Einkommen) für das Standard-Schloss; Fläche, Türme und Stockwerke kosten mehr, Dächer/Platz nichts
const castlePrice = c => niceRound(ITEMS.fz_schloss.cost * (0.4 * c.w * c.d / 10 + 0.2 * (c.m + 1) / 3 * (c.mk + 1) / 2
  + 0.2 * c.tw.reduce((s, o) => s + (o.h + 1) / 3 * (o.k + 1) / 2, 0) + 0.1 * c.cf / 2 + 0.1 * c.wf / 2 + 0.12 * (c.mo + c.mw + c.gn)));
// Vorlagen (Block 60h): setzen alles außer der Größe, dazu Farben (Index in WALLS/ROOFS/WIN_COLS, null = eigene)
const CS_TPL = {
  maerchen: { name: '🏰 Märchenschloss', cs: { fc: 0, m: 4, mk: 1, mr: 0, mt: 1, mf: 1, cb: 2, cf: 2, cr: 0, wf: 2, wr: 0, tw: [{ h: 3, k: 1, p: 0, r: 0, f: 1 }, { h: 4, k: 0, p: 2, r: 0, f: 1 }, { h: 1, k: 1, p: 0, r: 0, f: 1 }] }, wall: 1, roof: 1, win: 0 },
  ritter: { name: '⚔️ Ritterburg', cs: { fc: 1, m: 2, mk: 2, mr: 2, mt: 0, mf: 0, cb: 1, cf: 2, cr: 2, wf: 2, wr: 2, tw: [{ h: 2, k: 2, p: 0, r: 2, f: 0 }, { h: 1, k: 1, p: 1, r: 2, f: 1 }] }, wall: 10, roof: 0, win: 6 },
  eis: { name: '❄️ Eispalast', cs: { fc: 4, m: 4, mk: 0, mr: 0, mt: 1, mf: 1, cb: 0, cf: 3, cr: 0, wf: 1, wr: 1, tw: [{ h: 4, k: 0, p: 2, r: 0, f: 1 }, { h: 3, k: 0, p: 0, r: 0, f: 1 }, { h: 2, k: 0, p: 2, r: 0, f: 1 }, { h: 1, k: 0, p: 0, r: 0, f: 1 }] }, wall: 2, roof: 7, win: 5 },
  orient: { name: '🕌 Orientpalast', cs: { fc: 5, m: 3, mk: 2, mr: 1, mt: 0, mf: 1, cb: 2, cf: 2, cr: 1, wf: 1, wr: 1, tw: [{ h: 3, k: 0, p: 1, r: 1, f: 1 }, { h: 1, k: 1, p: 0, r: 1, f: 1 }] }, wall: 0, roof: 3, win: 1 },
  burg: { name: '🧱 Kompakte Burg', cs: { fc: 2, m: 2, mk: 2, mr: 0, mt: 0, mf: 0, cb: 1, cf: 3, cr: 2, wf: 2, wr: 1, tw: [{ h: 2, k: 2, p: 0, r: 0, f: 0 }] }, wall: 13, roof: 1, win: 0 },
};
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
  const r = (t.rot || 0) & 3, [w, h] = sizeOf('hbf', r, t), cx = x + (w - 1) / 2, cy = y + (h - 1) / 2, b = hbfTrackB(t, g);
  const at = a => { const [u, v] = kitTurn(r, a, b); return [Math.round(cx + u), Math.round(cy + v)]; };
  return { hall: [1.5, 0.5, -0.5].map(at), exit: at(2.5) };
}
// Eingang (Block 85): das Portal mitten im Empfangsgebäude zeigt nach außen (−a); davor die beiden Felder, an die ein Weg anschließt
function hbfEntrance(t, x, y) {
  const r = (t.rot || 0) & 3, [w, h] = sizeOf('hbf', r, t), cx = x + (w - 1) / 2, cy = y + (h - 1) / 2;
  return (hbfWing(t) ? [hbfPortalB(t)] : [-0.5, 0.5]).map(b => { const [u, v] = kitTurn(r, -2.5, b); return [Math.round(cx + u), Math.round(cy + v)]; });   // mit Flügel/Halle: genau ein Feld
}
// Alte Bahnhöfe umstellen (Block 123): ohne Halle wird der Bahnhof ein Feld breiter – zu der Seite, wo Platz ist –, die Halle
// kommt dorthin, wo der Eingang war. Alte Seitenflügel (±1) haben schon die Breite: nur noch t.wing = 2 und t.mid setzen.
// Rückgabe { nk, mid } oder ein Hinweis, warum es nicht geht. Gleise können dabei ein Feld rücken.
function hbfUpgradePlan(k) {
  const t = state.tiles.get(k);
  if (!t || t.b !== 'hbf') return 'Kein Hauptbahnhof';
  const [x, y] = keyXY(k), r = (t.rot || 0) & 3, n = hbfGleise(t);
  if (t.wing === 2) return 'Ist schon so';
  if (t.wing === 1 || t.wing === -1) return { nk: k, mid: Math.floor(n / 2) };
  const old = new Set(footprint('hbf', x, y, r, t).map(p => p.join())), door = hbfEntrance(t, x, y).map(p => p.join());
  let why = null;
  for (const [nx, ny] of [[x, y], r & 1 ? [x - 1, y] : [x, y - 1]]) for (const mid of [Math.floor(n / 2), Math.ceil(n / 2)]) {
    const t2 = { ...t, wing: 2, mid }, foot = footprint('hbf', nx, ny, r, t2);
    if (!door.includes(hbfEntrance(t2, nx, ny)[0].join()) || old.size !== foot.filter(p => old.has(p.join())).length) continue;
    const bad = foot.filter(p => !old.has(p.join())).map(([fx, fy]) => !ownedTile(fx, fy) ? 'Daneben ist nicht dein Grundstück'
      : COVER.has(fx + ',' + fy) ? 'Daneben steht etwas' : decosAt(fx + ',' + fy) ? 'Daneben stehen kleine Dekos'
      : terrainAt(fx, fy) !== 'grass' ? (terrainAt(fx, fy) === 'water' ? 'Daneben ist Wasser' : 'Daneben erst roden bzw. sprengen') : null).find(Boolean);
    if (!bad) return { nk: nx + ',' + ny, mid };
    why = why || bad;
  }
  return (why || 'Kein Platz') + ' – für die Halle muss neben dem Bahnhof ein Feld frei sein';
}
function hbfUpgrade(k) {
  const p = hbfUpgradePlan(k);
  if (typeof p === 'string') return null;
  const t = state.tiles.get(k);
  t.wing = 2; t.mid = p.mid;
  if (p.nk !== k) { state.tiles.delete(k); state.tiles.set(p.nk, t); }
  return p.nk;
}
function hbfUpgradeAll() {                                        // beim Laden alter Stände (v < 13): { done, stuck }
  if (!state.symHbf) return null;
  delete state.symHbf;
  rebuildCover();
  const out = { done: 0, stuck: 0 };
  for (const [k, t] of [...state.tiles]) {
    if (t.b !== 'hbf') continue;
    if (t.wing === 2) { out.done++; continue; }                 // Mittelhalle von Block 121: rechts gespiegelt
    if (hbfUpgrade(k)) { out.done++; rebuildCover(); } else out.stuck++;
  }
  return out.done || out.stuck ? out : null;
}
// Bahnhof länger/kürzer (Block 131): wächst zur Seite, wo Platz ist (erst +b, sonst −b), kürzer: das hintere Ende fällt weg.
// Ein Feld mehr kostet STATION_LEN_COST – einmal (Block 137: bezahlt bleibt bezahlt, kürzer gibt nichts zurück). Rückgabe { nk } oder ein Hinweis.
const STATION_LEN_COST = { money: 400, bretter: 5, quader: 3 };
// Umbauen (Block 137): Das Höchste, was schon bezahlt ist, bleibt im Gebäude – zurück dorthin kostet nichts mehr
const stationLenPaid = t => Math.max(stationLen(t), +t.lenPaid || 0);
const gleisePaid = t => Math.max(hbfGleise(t), +t.gleisePaid || 0);
function stationLenPlan(k, n) {
  const t = state.tiles.get(k);
  if (!t || t.b !== 'station') return 'Kein Bahnhof';
  if (stationLen(t) === n) return 'Ist schon so';
  const [x, y] = keyXY(k), r = (t.rot || 0) & 3, t2 = { ...t, len: n };
  if (n < stationLen(t)) return { nk: k };
  const old = new Set(footprint('station', x, y, r, t).map(p => p.join()));
  let why = null;
  for (const [nx, ny] of [[x, y], r & 1 ? [x - 1, y] : [x, y - 1]]) {
    const bad = footprint('station', nx, ny, r, t2).filter(([fx, fy]) => !old.has(fx + ',' + fy)).map(([fx, fy]) => !ownedTile(fx, fy) ? 'Daneben ist nicht dein Grundstück'
      : COVER.has(fx + ',' + fy) ? 'Daneben steht etwas' : decosAt(fx + ',' + fy) ? 'Daneben stehen kleine Dekos'
      : terrainAt(fx, fy) !== 'grass' ? (terrainAt(fx, fy) === 'water' ? 'Daneben ist Wasser' : 'Daneben erst roden bzw. sprengen') : null).find(Boolean);
    if (!bad) return n <= stationLenPaid(t) || canPay(STATION_LEN_COST) ? { nk: nx + ',' + ny } : state.money < STATION_LEN_COST.money ? 'Zu wenig Taler' : 'Material fehlt noch';
    why = why || bad;
  }
  return why + ' – für ein Feld mehr muss links oder rechts eins frei sein';
}
function stationLenSet(k, n) {
  const p = stationLenPlan(k, n);
  if (typeof p === 'string') { fail(p); return null; }
  const t = state.tiles.get(k);
  if (n > stationLenPaid(t)) addCost(STATION_LEN_COST, -1);                 // schon bezahlt: kostenlos; kürzer: nichts zurück
  t.lenPaid = Math.max(stationLenPaid(t), n);
  if (n === 3) t.len = 3; else delete t.len;
  t.born = performance.now();
  if (p.nk !== k) { state.tiles.delete(k); state.tiles.set(p.nk, t); }
  sfx('build'); recalc(); save();
  return p.nk;
}
// Gleise dazu/weg (Block 123: auf der gewählten Seite der Halle, side −1 links/+1 rechts): Alle anderen Gleise bleiben, wo sie
// sind – dafür rückt der Anker (gleiche Ausfahrt vor einem bleibenden Gleis). Ohne Halle (alt): immer rechts.
// Ein Gleis kostet GLEIS_COST – einmal (Block 137: weg und wieder dazu bis zur bezahlten Zahl kostenlos, weg gibt nichts zurück).
const GLEIS_COST = { money: 2000, quader: 6, metall: 4 };
function hbfResizePlan(k, d, side = 1) {
  const t = state.tiles.get(k);
  if (!t || t.b !== 'hbf') return 'Kein Hauptbahnhof';
  const n = hbfGleise(t), m = n + d, r = (t.rot || 0) & 3, [x, y] = keyXY(k), wing = hbfWing(t), L = hbfLeft(t);
  if (m < HBF_MIN) return `Mindestens ${HBF_MIN} Gleise`;
  if (m > HBF_MAX) return `Höchstens ${HBF_MAX} Gleise`;
  const left = wing && side < 0;
  if (wing && d < 0 && (left ? L : n - L) <= 1) return `${left ? 'Links' : 'Rechts'} der Halle muss ein Gleis bleiben`;
  const t2 = { ...t, gleise: m };
  if (wing) t2.mid = left ? L + d : L;
  // ein Gleis, das bleibt, und wo es danach liegt: links dazu/weg verschiebt die Nummern
  const keep = left ? (d > 0 ? 0 : 1) : 0, keep2 = left ? keep + d : keep;
  const e0 = gleisTiles(t, x, y, keep).exit, e1 = gleisTiles(t2, x, y, keep2).exit, nx = x + e0[0] - e1[0], ny = y + e0[1] - e1[1];
  const plan = { nk: nx + ',' + ny, m, mid: t2.mid, at: left ? (d > 0 ? 0 : -1) : null };
  if (d < 0) return plan;
  const old = new Set(footprint('hbf', x, y, r, t).map(p => p.join()));
  for (const [fx, fy] of footprint('hbf', nx, ny, r, t2)) {
    if (old.has(fx + ',' + fy)) continue;
    if (!ownedTile(fx, fy)) return 'Daneben ist nicht dein Grundstück';
    if (COVER.has(fx + ',' + fy)) return 'Daneben steht etwas – dort ist kein Platz für ein Gleis';
    if (decosAt(fx + ',' + fy)) return 'Daneben stehen kleine Dekos';
    if (terrainAt(fx, fy) !== 'grass') return terrainAt(fx, fy) === 'water' ? 'Daneben ist Wasser' : 'Daneben erst roden bzw. sprengen';
  }
  return m <= gleisePaid(t) || canPay(GLEIS_COST) ? plan : state.money < GLEIS_COST.money ? 'Zu wenig Taler' : 'Material fehlt noch';
}
function hbfResizeError(k, d, side = 1) { const p = hbfResizePlan(k, d, side); return typeof p === 'string' ? p : null; }
function hbfResize(k, d, side = 1) {
  const p = hbfResizePlan(k, d, side);
  if (typeof p === 'string') { fail(p); return null; }
  const t = state.tiles.get(k);
  const paid = gleisePaid(t);
  if (p.m > paid) addCost(GLEIS_COST, -1);
  t.gleisePaid = Math.max(paid, p.m);
  if (t.gleis) {                                                  // Züge je Gleis: mit ihrem Gleis mitwandern
    if (p.at === 0) t.gleis.unshift(null);
    else if (p.at === -1) t.gleis.shift();
    else t.gleis.length = Math.min(t.gleis.length, p.m);
  }
  t.gleise = p.m; t.born = performance.now();
  if (p.mid != null) t.mid = p.mid;
  if (p.nk !== k) { state.tiles.delete(k); state.tiles.set(p.nk, t); }
  sfx('build'); recalc(); save();
  return p.nk;
}
// Märchenschloss umgestalten (Block 60g): patch ändert t.cs. Mehr Wert als bezahlt kostet den Unterschied, weniger gibt nichts zurück (Block 137: t.price bleibt das Höchste, Guthaben).
// Breite/Tiefe: das Schloss wächst abwechselnd zu beiden Seiten (bleibt so mittig); geht es dort nicht, zur anderen.
// Rückgabe: neues Ankerfeld (oder null mit Hinweis)
function castleChange(x, y, patch) {
  const k = x + ',' + y, t = state.tiles.get(k);
  if (!t || t.b !== 'fz_schloss') return null;
  const cs = csOf(t), nc = csOf({ cs: { ...cs, ...patch } });
  for (const [key, [lo, hi]] of Object.entries(CS_LIM)) if (!(nc[key] >= lo && nc[key] <= hi)) { fail(nc[key] < lo ? 'Kleiner geht es nicht' : 'Größer geht es nicht'); return null; }
  if (nc.gp != null && !isWegStyle(nc.gp)) { fail('Diesen Belag gibt es nicht'); return null; }   // Boden-Belag (Block 76b)
  if (patch.tw && patch.tw.length > CS_TOWERS) { fail(`Höchstens ${CS_TOWERS} Turmpaare`); return null; }
  for (const o of nc.tw) for (const [key, [lo, hi]] of Object.entries(CT_LIM)) if (!(o[key] >= lo && o[key] <= hi)) { fail(o[key] < lo ? 'Kleiner geht es nicht' : 'Größer geht es nicht'); return null; }
  const paid = t.price != null ? t.price : castlePrice(cs), price = castlePrice(nc), diff = price - paid;   // t.price: das Höchste, was bezahlt ist (Block 137)
  if (diff > 0 && state.money < diff) { fail('Zu wenig Taler'); return null; }
  let nk = k;
  const rot = t.rot || 0, nt = { ...t, cs: nc }, [ow, oh] = sizeOf('fz_schloss', rot, t), [nw, nh] = sizeOf('fz_schloss', rot, nt);
  if (nw !== ow || nh !== oh) {
    // Ankerfelder zur Wahl: möglichst mittig; bei Gleichstand abwechselnd (wächst so zu beiden Seiten)
    const offs = dd => [...new Set([0, -dd, -Math.trunc(dd / 2), -Math.round(dd / 2)])], cands = [];
    for (const ox of offs(nw - ow)) for (const oy of offs(nh - oh)) cands.push([x + ox, y + oy]);
    const dist = ([ax, ay]) => Math.abs(ax - x + (nw - ow) / 2) + Math.abs(ay - y + (nh - oh) / 2);
    const pref = ((nw + nh) % 2 ? [x - (nw - ow), y - (nh - oh)] : [x, y]).join();
    cands.sort((p, q) => dist(p) - dist(q) || (q.join() === pref) - (p.join() === pref));
    cands.splice(0, cands.length, ...cands.filter(p => dist(p) === dist(cands[0])));   // nur die mittigsten (Ring: Schloss bleibt stehen)
    const before = new Map(state.tiles);
    state.tiles.delete(k); restoreUnder(t, x, y); rebuildCover();
    const spot = cands.find(([ax, ay]) => !placeError('fz_schloss', ax, ay, rot, { move: true, t: nt }));
    if (!spot) { state.tiles = before; rebuildCover(); fail('Dafür ist neben dem Schloss kein Platz'); return null; }
    const covered = pathsUnder('fz_schloss', spot[0], spot[1], rot, nt);
    for (const [fx, fy] of covered) state.tiles.delete(fx + ',' + fy);
    setUnder(t, spot[0], spot[1], []);
    state.money += covered.length * ITEMS.weg.cost;
    nk = spot.join(',');
    state.tiles.set(nk, t);
  }
  t.cs = nc; t.price = Math.max(paid, price); t.born = performance.now(); groundVersion++;
  if (diff > 0) state.money -= diff;                                       // kleiner: nichts zurück, das Guthaben bleibt im Schloss
  sfx(diff > 0 ? 'build' : 'deco'); recalc(); save();
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
// Wo der Zug an einem Halt steht: neben dem Bahnhof (Bahnsteig), bei der U-Bahn-Station auf ihrem eigenen Tunnelfeld (Block 136)
const stopDirs = k => bAt(...keyXY(k)) === 'ubahn' ? [[0, 0]] : DIRS;
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
// Linien auf einer Insel (Block 136): ihre Halte liegen in Vierteln (Viertel der Station und direkt daneben). Fahrgäste: die
// Hälfte der Einwohner aller Halte-Viertel außer dem größten (wie Pendler); so viele, wie Plätze da sind (served). Verbundene
// Viertel kaufen zusätzlich bei Ladenarten, die es bei ihnen nicht gibt – nie statt der eigenen (Nutzer: „nur zusätzlich“).
const LINE_SHOP = 0.5;
function stopViertel(net, s) {
  const out = new Set(), [x0, y0, x1, y1] = stopBox(s), v0 = net.vOf(s);
  if (v0) out.add(v0);
  for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) { const a = COVER.get(x + ',' + y), v = a && net.vOf(a); if (v) out.add(v); }
  return out;
}
function innerTraffic(links, net, SW) {
  const conn = new Map(), served = new Map(), pop = v => SW.vPop.get(v) || 0;
  for (const l of links) {
    if (!l.inner) continue;
    const Vs = [...new Set(l.stations.flatMap(s => [...stopViertel(net, s)]))];
    const pops = Vs.map(pop), demand = Vs.length > 1 ? LINE_SHOP * (pops.reduce((a, b) => a + b, 0) - Math.max(...pops)) : 0;
    const f = demand > 0 ? Math.min(1, l.seats / demand) : 1;
    l.traffic = { commute: demand, visits: new Map(), visitors: 0, demand, seats: l.seats, served: f, carried: demand * f, shared: 0, transfer: [],
      fare: demand * f * FARE / 60, spend: 0, viertel: Vs.length, inner: true };
    if (Vs.length > 1) for (const v of Vs) for (const u of Vs) if (u !== v) {
      if (!conn.has(v)) conn.set(v, new Set());
      conn.get(v).add(u);
      served.set(v + '|' + u, Math.max(served.get(v + '|' + u) || 0, f));
    }
  }
  // zusätzliche Kundschaft für einen Laden der Art b im Viertel v: Leute aus verbundenen Vierteln ohne b, geteilt durch alle Viertel,
  // die ihnen b anbieten
  const extra = (v, b) => {
    let n = 0;
    for (const u of conn.get(v) || []) {
      if (SW.count(u, b)) continue;
      const offer = [...(conn.get(u) || [])].filter(w => SW.count(w, b)).length;
      n += pop(u) * LINE_SHOP * served.get(v + '|' + u) / Math.max(1, offer);
    }
    return n;
  };
  return { conn, extra };
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
  computeParks(); computeCoasters(); computeParkRails(); computeTorPairs(); computeFz();
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
  const SW = shopWorld(net, links), sales = [], shopTiles = [], IT = innerTraffic(links, net, SW);
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
        if (SITE_TIP[t.b]) v *= 1 + siteOf(t.b, k, t.rot, t).f;              // Standortbonus (Block 53)
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
      s.line = v ? IT.extra(v, t.b) / Math.max(1, s.same) : 0;               // mit Bahn/U-Bahn aus anderen Vierteln (Block 136)
      const want = ((v && SW.vPop.get(v)) || 0) / Math.max(1, s.same) + (SW.visitors.get(r) || 0) / s.sameIsle + s.line, kd = Math.min(want, shopCap(t.b));
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
  for (const p of PARKS) beauty += PARK_BEAUTY[p.stage];                  // ein ganzer Park ist mehr als seine Deko
  for (const p of FZPARKS) beauty += FZ_BEAUTY[p.stage];                 // Freizeitpark (Block 60)
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
  inc *= 1 + wm('incMul') + FZ_INC[fzBest()];                           // Freizeitpark: Eintritt (beste Stufe, Block 60)
  if (allMul) { inc *= 1 + allMul; sci *= 1 + allMul; for (const r of Object.keys(prod)) prod[r] *= 1 + allMul; for (const c of conv) c.rate *= 1 + allMul; for (const sl of sales) sl.rate *= 1 + allMul; }   // auf alles: auch Veredelung und Verkauf
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
  pop = Math.round(pop * masteryMul('einwohner'));                      // vor den Stufen: das Fenster rechnet mit T.pop (Block 84c)
  for (const [k, t] of state.tiles) if (BUILD_STAGES[t.b]) { const [x, y] = keyXY(k); st.get(k).grow = stageInfo(t, x, y, pop, jobs, access); }
  return { inc, pop, jobs, sci, prod, conv, beauty: Math.max(0, Math.round(beauty * masteryMul('schoen'))), lm: lmOn.size, lmOn, lmHalf, st, net, rail,
    traffic: { fare: fare * mT, spend: spend * mT, places, links }, cables, ferries, access, wonders: won, sales, salesInc, marktInc: marktInc * (1 + wm('incMul')) * (1 + allMul), markets: MARKETS };
}
let T = { inc: 0, pop: 0, jobs: 0, sci: 0, prod: {}, conv: [], beauty: 0, lm: 0, lmOn: new Map(), lmHalf: new Map(), st: new Map(),
  rail: { lines: [], stationNet: new Map(), wind: 0, trains: 0, comp: new Map(),
    power: { supply: 0, demand: 0, left: 0, dark: new Set(), idle: new Set(), trains: 0, city: false, use: { lamps: 0, work: 0, trains: 0 } } },
  traffic: { fare: 0, spend: 0, places: { pop: new Map(), attr: new Map() }, links: [] }, cables: [], ferries: [] };
function recalc() { bridgeArchCache.v = -1; if (BATCH) return; seaBridgesCheck(); T = totals(); NET = T.net; previewCache = null; groundVersion++; if (!moving) state.incPeak = Math.max(state.incPeak || 0, Math.round(T.inc + (T.salesInc || 0))); }
// Bestes Einkommen sinkt langsam zum jetzigen (Halbwertszeit PEAK_HALF s), damit Preise nach einem Umbau nicht ewig
// zu hoch bleiben – aber nicht, solange etwas getragen wird (✋ Wegschieben macht nichts billiger).
const PEAK_HALF = 1200;
function peakTick(dt) {
  if (moving || !state.incPeak) return;
  const now = T.inc + (T.salesInc || 0);
  if (state.incPeak > now) state.incPeak = now + (state.incPeak - now) * Math.pow(0.5, dt / PEAK_HALF);   // nicht runden: sonst sinkt es bei 60 Bildern/s nie (Block 84c)
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
  if (def.album && !albumDone(def.album, def.albumN)) return false;    // Album-Belohnung: volle Seite (bzw. albumN Einträge)
  if (def.invention && !(state.inventions && state.inventions.has(def.invention))) return false;   // Erfindung (für Ideen)
  if (def.bond && (state.bond || 0) < def.bond) return false;           // Freundschaft (Block 105): so viele Herzen bei einem Freund
  return true;
}
// Ort und Stufe zusammen („🌬️ Windige Klippe → Aussichtspunkt“), kurz nur der Ort (Leiste unten)
const lmStepName = (type, n) => `${LANDMARKS[type].icon} ${LANDMARKS[type].name} → ${LM_STAGES[type][n - 1].name}`;
function unlockText(def, short) {
  if (def.lm) {
    const [type, n] = def.lm.split(':');
    if (lmStage(type) < +n) return short ? `${LANDMARKS[type].icon} ${LANDMARKS[type].name}` : lmStepName(type, +n);
  }
  if (def.design) { const d = DESIGN.find(x => (x.item && ITEMS[x.item] === def) || (!x.item && x.price === def.design && x.name === def.name)); return `🎨 Kunstakademie · 🪙 ${fmt(d ? designPrice(d) : def.design)}`; }
  if (def.lanterns && lanternCount() < def.lanterns) return `🏮 ${def.lanterns}`;
  if (def.tech && !hasTech(def.tech)) return '💡 ' + TECH_BY_ID[def.tech].name;
  if (def.rank && starCount() < def.rank) return `⭐ ${def.rank} Erfolgs-Sterne`;
  if (def.festival && !state.festival) return '🎆 nach dem Laternenfest';
  if (def.garden && !wonderOn(def.garden)) return '🌿 Botanischer Garten';
  if (def.album && !albumDone(def.album, def.albumN)) return def.albumN ? `📒 ${def.albumN} Tiere in der Natur entdeckt (${albumCount(def.album)}/${def.albumN})` : `📒 volle Album-Seite „${ALBUM.find(p => p.id === def.album).name}“`;
  if (def.invention && !(state.inventions && state.inventions.has(def.invention))) return `💡 Erfindung ${INVENTIONS.find(i => i.id === def.invention).name}`;
  if (def.bond && (state.bond || 0) < def.bond) return `💛 Freundschaft mit ${def.bond} Herzen`;
  return '';
}
// Wege (Block 125): Muster hat, wer es gekauft hat (wegmuster:…), es über Ort/Album bekam oder einen alten Belag mit diesem Muster
// besitzt (nichts geht verloren); Farben sind frei, Gold gibt es mit der Album-Seite (bzw. wer Goldpflaster schon hat)
function wegMusterOk(m) {
  const M = WEG_MUSTER_BY[m];
  if (!M) return false;
  if (M.legacy && M.legacy.some(id => unlockOk(STYLES.weg.find(st => st.id === id) || {}, 'weg:' + id))) return true;
  if (M.design) return state.design.has('wegmuster:' + m) || !!(state.legacy && state.legacy.has('wegmuster:' + m));
  return unlockOk({ lm: M.lm, album: M.album }, 'wegmuster:' + m);
}
function wegFarbeOk(f) {
  const F = f && WEG_FARBEN_BY[f];
  if (!F || !F.album) return true;
  return unlockOk({ album: F.album }, 'wegfarbe:' + f) || unlockOk(STYLES.weg.find(st => st.id === 'goldpflaster') || {}, 'weg:goldpflaster');
}
// Freischalt-Text eines Musters (Leiste, Fenster)
function wegMusterText(m) {
  const M = WEG_MUSTER_BY[m];
  if (!M || wegMusterOk(m)) return '';
  if (M.design) return `🎨 Kunstakademie · 🪙 ${fmt(designPrice(DESIGN_BY_ID['wegmuster:' + m]))}`;
  return unlockText({ lm: M.lm, album: M.album });
}
const styleOk = st => {
  const kind = st.kind || 'weg';
  if (kind !== 'weg') return unlockOk(st, kind + ':' + st.id);
  const [m, f] = wegParts(st.id);
  return (!st.muster && unlockOk(st, 'weg:' + st.id)) || (wegMusterOk(m) && wegFarbeOk(f));
};
// Farben: die ersten FREE_COLORS gibt es von Anfang an, weitere in der Kunstakademie
// Farben für viele (Block 73): „auf alle übertragen“ und neu Gebautes gleich so (state.paintNew[b]; false = abgeschaltet).
// Häuser bleiben bunt gemischt, bis man es für sie selbst einschaltet.
const PAINT_KEYS = ['wall', 'roof', 'win'];
const paintOf = t => Object.fromEntries(PAINT_KEYS.filter(k => t[k] != null).map(k => [k, t[k]]));
const samePaint = (a, b) => PAINT_KEYS.every(k => (a[k] != null ? a[k] : null) === (b[k] != null ? b[k] : null));
// nur Wand/Dach/Fenster – Form und Farbe von Stadtschmuck/Gleisen prüft decoLookNew (sonst käme Ungekauftes mit, Block 109)
const paintNewOf = b => state.paintNew[b] ? Object.fromEntries(Object.entries(state.paintNew[b]).filter(([k]) => PAINT_KEYS.includes(k))) : {};
const paintLikeOthers = t => [...state.tiles.values()].filter(o => o !== t && o.b === t.b && !samePaint(o, t));
function rememberPaint(t) {
  const p = state.paintNew[t.b];
  if (p === false || (!p && isHome(t.b))) return;
  state.paintNew[t.b] = paintOf(t);
}
function paintAllLike(t) {
  const list = paintLikeOthers(t);
  for (const o of list) for (const k of PAINT_KEYS) { if (t[k] != null) o[k] = t[k]; else delete o[k]; }
  return list.length;
}
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
// Kunstakademie-Preis (Block 50): nach dem besten Einkommen, damit es das ganze Spiel über etwas Begehrtes bleibt.
// Normal etwa DESIGN_MIN Minuten (günstige Stücke weniger, aufwendige mehr: Wurzel aus Grundpreis/150), ✦ Meisterstücke
// DESIGN_MASTER-mal so viel. Mindestens das 5-Fache des Grundpreises (Meisterstücke das 25-Fache).
// Stadtschmuck (Formen/Farben von Laterne, Bank, Brunnen, Block 108): nur DESIGN_SCHMUCK Minuten – ist ja nur kleine Deko
const DESIGN_MIN = 3, DESIGN_SCHMUCK = 1, DESIGN_MASTER = 5, DESIGN_FLOOR = 5;
function designPrice(d) {
  if (!d || !d.price) return 0;
  const m = d.master ? DESIGN_MASTER : 1, minutes = (d.schmuck ? DESIGN_SCHMUCK : DESIGN_MIN) * Math.sqrt(d.price / 150) * m;
  return niceRound(Math.max(d.price * DESIGN_FLOOR * m, minutes * 60 * wonderRate()));
}
// Kunstakademie: kaufen (Taler); Meisterstücke brauchen eine Kunstakademie
function designError(d) {
  if (!d || state.design.has(d.id) || !d.price || (d.muster && wegMusterOk(d.muster))) return 'Schon da';
  if (d.master && !hasBuilt('kunst')) return 'Braucht eine Kunstakademie';
  if (state.money < designPrice(d)) return 'Zu wenig Taler';
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
const SLOTS = 9, SLOT_OFF = 0.42, MID_OFF = 0.42;   // weit außen (Block 46): neben dem Weg, nicht darauf
const MID_UV = [[-MID_OFF, 0], [0, -MID_OFF], [MID_OFF, 0], [0, MID_OFF]];
// Eckpunkte (Block 65): Platz 8 eines Felds liegt genau auf seiner oberen Ecke (x − ½, y − ½), die es mit drei Nachbarn
// teilt – so steht eine Laterne exakt zwischen zwei Feldern bzw. genau im Bogen einer Wegkurve. Nur Schmales (POST_OK).
// Dafür bleiben die vier Ecken-Plätze, die zu diesem Punkt zeigen, frei (und umgekehrt).
const VSLOT = 8, VSLOT_NEAR = 0.2;                              // so nah (Felder) an einer Ecke rastet schmale Deko dort ein
const POST_OK = new Set(['laterne', 'strassenlaterne', 'kristallaterne', 'blumentopf', 'glaskugel', 'kristall']);
const slotUV = i => i === VSLOT ? [-0.5, -0.5] : i < 4 ? [(i & 1 ? 1 : -1) * SLOT_OFF, (i & 2 ? 1 : -1) * SLOT_OFF] : MID_UV[i - 4];
// die vier Felder um den Eckpunkt von Feld (x, y), je mit ihrem Ecken-Platz, der zum Punkt zeigt
const vertexCorners = (x, y) => [[x, y, 0], [x - 1, y, 1], [x, y - 1, 2], [x - 1, y - 1, 3]];
// Eckpunkt (= Feld, dessen Platz 8 es ist), zu dem der Ecken-Platz slot (0–3) von Feld (x, y) zeigt
const cornerVertex = (x, y, slot) => [x + (slot & 1), y + ((slot >> 1) & 1)];
const postAt = (vx, vy) => { const ds = decosAt(vx + ',' + vy); return ds ? ds[VSLOT] || null : null; };
const newSlots = () => Array(SLOTS).fill(null);
// Wo genau ein Ding auf seinem Platz steht (Block 46): so weit außen wie möglich, ohne anzustoßen – je nach Größe (DECO_R,
// Abstand von der Mitte bis zum Rand des Dings), an einer Hecke/Zaun/Mauer um deren Dicke nach innen, an einem Eckpunkt mit
// Linie (Pfeiler, Heckenende) mit Abstand zur Ecke
const MID_SIDE = [[-1, 0], [0, -1], [1, 0], [0, 1]];
const DECO_R = { baum: 0.14, palme: 0.14, busch: 0.12, riesenblume: 0.1, rosenbogen: 0.12, bank: 0.1, brunnen: 0.12, kristallbrunnen: 0.12 };
const decoR = b => !b ? 0.08 : DECO_R[baseOf(b)] || 0.08;
// Bänke (Block 108): lang und schmal – halbe Tiefe (a) und halbe Länge (b) in Feldern, je nach Form. Steht eine Bank längs zum
// Feldrand, rückt sie um ihre halbe Länge nach innen, sonst steckt sie in der Bank auf dem Nachbarfeld
const BENCH_EXT = { park: [0.1, 0.23], garten: [0.1, 0.23], stein: [0.1, 0.23], picknick: [0.11, 0.2], rund: [0.12, 0.12] };
function decoExt(d) {
  const b = typeof d === 'string' ? d : d && d.b, r = decoR(b), base = b && baseOf(b);
  const L = DECO_LOOKS.bank, e = base === 'freundesbank' ? BENCH_EXT.park : base === 'bank' ? BENCH_EXT[(L.forms[(d && d.form) || 0] || L.forms[0]).id] : null;
  if (!e) return [r, r];
  const [u, v] = kitTurn(((d && d.rot) || 0) & 3, e[0], e[1]);
  return [Math.max(r, Math.abs(u)), Math.max(r, Math.abs(v))];
}
const lineW = e => !e ? 0 : e.arch ? 0.22 : e.b === 'zaun' ? 0.05 : 0.14;   // halbe Dicke samt Luft (Zaun dünn, Hecke/Mauer dick, Torbogen breit)
// Wegkurve (Block 65b): die Kurve ist ein Viertelring um die innere Ecke – ihr äußerer Ecken-Platz rückt deshalb an den
// Bogen, mittig auf die Außenkurve (sonst stünde er weit draußen in der Feldecke). Rückgabe: welcher Platz, Mittelpunkt
// Wegform (Block 77): t.wide ganz breit (füllt das Feld), t.sq eckige Kurve, t.end Ende: fehlt = automatisch (Sackgasse vor
// einem Gebäude läuft bis an dessen Wand), 'rund' (rundes Endstück), 'rand' (gerade bis an die Feldkante)
const wegShapeNew = () => ({ ...(wegShape.wide ? { wide: true } : {}), ...(wegShape.sq ? { sq: true } : {}) });
const sameWegShape = t => !!t.wide === wegShape.wide && !!t.sq === wegShape.sq;
function applyWegShape(t) { for (const k of ['wide', 'sq']) { if (wegShape[k]) t[k] = true; else delete t[k]; } }
// Zusätzliche Arme bis an die Feldkante: zum Gebäude (automatisch) oder gerade weiter ('rand'); nur an Enden
function pathEnds(x, y, t, arms) {
  if (!t || t.end === 'rund' || arms.length > 1 || t.cross || t.bridge) return [];
  const solid = ([dx, dy]) => { const o = objAt(x + dx, y + dy); return !!o && o.b !== 'weg' && o.b !== 'schiene'; };
  if (arms.length === 1) { const d = [0 - arms[0][0] || 0, 0 - arms[0][1] || 0]; return t.end === 'rand' || solid(d) ? [d] : []; }
  const axis = (t.rot & 1) ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
  if (t.end === 'rand') return axis;
  const hit = [...axis, ...DIRS.filter(d => !axis.some(a => a[0] === d[0] && a[1] === d[1]))].find(solid);
  return hit ? [hit] : [];
}
// Gartenweg (Block 78): zeigt die Tür eines kleinen Hauses bzw. Ladens zu einem Weg, führt ein schmaler Weg im Stil des Wegs
// bis zur Tür – auf dem Hausfeld, kostenlos. t.zug === false: abgeschaltet (Hausfenster)
const zugOk = b => (isHome(b) || !!SHOPS[b]) && !(ITEMS[b] && ITEMS[b].size);
function gardenPath(t, x, y, any = false) {
  if (!t || (t.zug === false && !any) || !zugOk(t.b) || x > 1e5) return null;
  const [dx, dy] = kitTurn(t.rot || 0, 1, 0), n = state.tiles.get((x + dx) + ',' + (y + dy));
  if (!n || n.b !== 'weg' || n.bridge) return null;
  return { d: [dx || 0, dy || 0], style: courtVp(t) || n.style || 'sand' };   // eigener Belag (Block 91)
}
// Vorplatz bzw. Weg zur Tür (Block 91): Liegt vor der Tür eines größeren Gebäudes ein Weg, führt ein Belag im Stil dieses Wegs
// (oder dem gewählten, t.vp) bis zur Tür – ein schmaler Weg (b: Mitte, w: halbe Breite) oder ein Platz (p: [b0, b1]), jeweils
// von a bis an die Vorderkante; mehrere Stücke über parts. Im eigenen Rahmen des Gebäudes (a nach vorn, zur Tür). own: hatte
// schon immer einen Platz und zeichnet ihn selbst (courtFloor) – ohne Weg so wie früher (bare: dann gar keiner, Block 91d). t.zug === false: aus (nur Wiese).
const COURTS = {
  muehle: { a: 0.14, b: 0 }, holz: { a: 0.22, b: 0.07 }, fischer: { a: 0.07, b: 0 }, stein: { a: 0.26, b: 0.22 },
  mine: { a: 0.1, b: 0, w: 0.11, s3: { a: 0.1, p: [-0.38, 0.11] } }, kristallmine: { a: 0.1, b: 0, w: 0.11, s3: { a: 0.1, p: [-0.38, 0.11] } }, steinmetz: { a: 0.11, b: -0.05 }, schmiede: { a: 0.16, b: -0.08 },   // Stollen: Lore fährt auf dem Weg heraus; Stufe 3 (s3): Hof bis zur Tür des Hauses davor
  wasserkraft: { a: 0.1, b: 0.13 }, baecker: { a: 0.24, b: -0.32 }, saege: { a: 0.22, b: -0.05, w: 0.14 }, fabrik: { a: 0.3, b: 0 },
  reihenhaus: { parts: [-0.64, 0, 0.64].map(b => ({ a: 0.3, b })) },                    // je Haus ein Weg zur Tür
  bibliothek: { a: 0.3, b: 0, w: 0.12 }, kunst: { a: 0.2, b: 0, w: 0.11 }, uni: { a: 0.32, p: [-0.72, 0.72] },
  kino: { a: 0.6, p: [-0.6, 0.6] }, passage: { a: 0.75, p: [-0.6, 0.6] }, theater: { a: 0.95, p: [-0.75, 0.75] },
  konzerthalle: { a: 1.15, p: [-0.85, 0.85] }, aquarium: { a: 1.05, p: [-0.42, 0.42] },
  zoo: { parts: [{ a: 1.8, b: 0, w: 0.12 }, { a: 0.95, b: 1, w: 0.16 }] },                // zur Kasse und durchs Tor
  rathaus: { a: -1.47, p: [-1.47, 1.47], own: true }, museum: { a: 0.45, b: 0, w: 0.4, own: true, bare: true },   // Museum: zur Treppe
  kaufhaus: { a: 0.68, b: 0, w: 0.18, own: true, bare: true }, markthalle: { a: -0.98, p: [-1.47, 1.47], own: true },
  moebelhaus: { a: 0.43, p: [-0.6, 0.6], own: true }, hotel: { a: 0.3, p: [-0.62, 0.62], own: true },
  grandhotel: { a: 0.4, p: [-1.15, 1.15], own: true },
};
// Stücke eines Vorplatzes: { a, s: [quer von, bis], band: schmaler Weg }; s3: anders ab Stufe 3
const courtParts = (C0, t) => [].concat((t && t.lvl >= 3 && C0.s3) || C0.parts || C0).map(c => ({ a: c.a, s: c.p || [c.b - (c.w || GP_FILL), c.b + (c.w || GP_FILL)], band: !c.p }));
const courtIsPlaza = C0 => courtParts(C0).some(c => !c.band);
const courtVp = t => t.vp && isWegStyle(t.vp) ? t.vp : null;
// Felder vor der Front: je Spalte c (quer, Mitte des Felds) das Feld davor
function courtFrontTiles(t, x, y) {
  const r = (t.rot || 0) & 3, [w, h] = sizeOf(t.b, r, t), cx = x + (w - 1) / 2, cy = y + (h - 1) / 2;
  const [da, wb] = ITEMS[t.b].size || [1, 1], out = [];
  for (let c = -wb / 2 + 0.5; c < wb / 2; c++) {
    const [u, v] = kitTurn(r, da / 2 + 0.5, c), nx = Math.round(cx + u), ny = Math.round(cy + v), n = state.tiles.get(nx + ',' + ny);
    out.push({ c, x: nx, y: ny, weg: !!(n && n.b === 'weg' && !n.bridge), wide: !!(n && n.b === 'weg' && (n.wide || pathQuads(nx, ny).length)) });
  }
  return out;
}
// Eingang passt sich dem Weg an (Block 127): vor einem schmalen Weg wird ein Vorplatz zu einem Weg zur Tür, genau so breit wie der
// Weg davor (je schmalem Wegfeld, das er berührt); auch ein breiter Weg zur Tür (Museum) wird nicht breiter als der Weg. Vor
// einem ganz breiten Weg oder einer Wegfläche bleibt der Platz. Höfe über das ganze Grundstück (a < 0: Rathaus …) bleiben, wie sie sind.
function courtPartsAt(t, x, y) {
  const C0 = t && COURTS[t.b], parts = courtParts(C0, t);
  if (!C0 || x > 1e5) return parts;
  const front = courtFrontTiles(t, x, y);
  return parts.flatMap(p => {
    if (p.a < 0) return [p];
    const under = front.filter(f => Math.min(p.s[1], f.c + 0.5) - Math.max(p.s[0], f.c - 0.5) >= 0.05), hit = under.filter(f => f.weg);
    if (!hit.length || hit.some(f => f.wide)) return [p];
    const m = (p.s[0] + p.s[1]) / 2, band = c => ({ a: p.a, s: [c - ROAD_W, c + ROAD_W], band: true });
    if (p.band) { const hw = Math.min((p.s[1] - p.s[0]) / 2, ROAD_W); return [{ ...p, s: [m - hw, m + hw] }]; }
    if (hit.length === under.length) return [band(m)];                       // Weg an der ganzen Front entlang: ein Weg zur Tür
    const mid = hit.filter(f => f.c >= p.s[0] && f.c <= p.s[1]);             // sonst je Wegfeld vor dem Platz (nicht daneben)
    return mid.length ? mid.map(f => band(f.c)) : [p];
  });
}
// Die Wegfelder vor dem Vorplatz: je Stück und Feld der vorderen Reihe, das es berührt, das Stück [q0, q1] quer auf dem Wegfeld (wie armUV)
function courtOf(t, x, y, any = false) {
  const C0 = t && COURTS[t.b];
  if (!C0 || (t.zug === false && !any) || x > 1e5) return null;
  const r = (t.rot || 0) & 3, [fx, fy] = kitTurn(r, 1, 0), links = [], front = courtFrontTiles(t, x, y);
  for (const { s: [s0, s1] } of courtPartsAt(t, x, y)) for (const f of front) {
    const c = f.c, l0 = Math.max(s0, c - 0.5), l1 = Math.min(s1, c + 0.5);
    if (l1 - l0 < 0.05 || !f.weg) continue;
    const n = state.tiles.get(f.x + ',' + f.y);
    links.push({ x: f.x, y: f.y, style: n.style || 'sand', q0: c - l1, q1: c - l0 });
  }
  if (!links.length) return null;
  return { d: [-fx || 0, -fy || 0], links, style: courtVp(t) || links[0].style };
}
// Belag, der gezeichnet wird: null = keiner (aus, kein Weg davor) bzw. bei own ohne Weg und ohne Wahl der alte Platz
function courtStyle(t, x, y) {
  const C0 = t && COURTS[t.b];
  if (!C0 || t.zug === false) return null;
  const ct = courtOf(t, x, y);
  return ct ? ct.style : C0.own && !C0.bare ? courtVp(t) : null;
}
function curveSlot(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || t.b !== 'weg' || t.cross || t.sq || t.wide || typeof roadCurve !== 'function') return null;
  const c = roadCurve(pathArms(x, y));
  if (!c) return null;
  return { slot: (c.cu > 0 ? 0 : 1) + (c.cv > 0 ? 0 : 2), cu: c.cu, cv: c.cv };
}
function slotPos(x, y, i, d) {                                  // d: die Deko (oder nur ihr Typ)
  if (i === VSLOT) return [-0.5, -0.5];                          // Eckpunkt: genau auf der Ecke
  const [ru, rv] = decoExt(d), r = Math.max(ru, rv);
  if (i < 4) {
    const cs = curveSlot(x, y);
    if (cs && cs.slot === i) { const k = (0.5 + EDGE_W + r + 0.03) / Math.SQRT2; return [cs.cu - Math.sign(cs.cu) * k, cs.cv - Math.sign(cs.cv) * k]; }
  }
  const lim = (side, rr) => { const e = state.edges.get(edgeBetween(x, y, x + side[0], y + side[1])); return e ? 0.5 - lineW(e) - rr : 0.5 - rr - 0.02; };
  if (i >= 4) {                                                   // Seitenmitte: nur zur eigenen Seite hin begrenzt
    const [dx, dy] = MID_SIDE[i - 4], m = Math.min(MID_OFF, lim([dx, dy], dx ? ru : rv));
    return [dx * m, dy * m];
  }
  const su = i & 1 ? 1 : -1, sv = i & 2 ? 1 : -1;
  let u = Math.min(SLOT_OFF, lim([su, 0], ru)), v = Math.min(SLOT_OFF, lim([0, sv], rv));
  if (state.edges.size) {                                         // Linie am Eckpunkt (auch außerhalb des Felds): Abstand halten
    const vx = x + (su + 1) / 2, vy = y + (sv + 1) / 2;
    const at = ['a' + (vx - 1) + ',' + vy, 'a' + vx + ',' + vy, 'b' + vx + ',' + (vy - 1), 'b' + vx + ',' + vy].some(k => state.edges.has(k));
    if (at) { u = Math.min(u, 0.5 - 0.17 - ru * 0.7); v = Math.min(v, 0.5 - 0.17 - rv * 0.7); }
  }
  return [su * u, sv * v];
}
const SLOTS_BACK = [VSLOT, 0, 4, 5], SLOTS_FRONT = [1, 2, 6, 7, 3], SLOTS_ALL = [...SLOTS_BACK, ...SLOTS_FRONT];      // hinter bzw. vor dem Ding auf dem Feld zeichnen (von hinten nach vorn: Ecke 3 zuletzt)
const decosAt = k => state.decos.get(k);
function slotAt(sx, sy) {
  const px = (sx - W / 2) / cam.z + cam.x, py = (sy - H / 2) / cam.z + cam.y;
  const a = (px / (TW / 2) + py / (TH / 2)) / 2, b = (py / (TH / 2) - px / (TW / 2)) / 2;
  const x = Math.round(a), y = Math.round(b), du = a - x, dv = b - y;
  let slot = 0, best = Infinity;                                 // der nächste der 8 Plätze
  for (let i = 0; i < 8; i++) { const [u, v] = slotPos(x, y, i), d = (u - du) ** 2 + (v - dv) ** 2; if (d < best) { best = d; slot = i; } }   // wo die Plätze wirklich liegen (Kurve, Linien)
  // nah an einer Feldecke: der Eckpunkt (Block 65) – mit schmaler Deko in der Hand oder wenn dort schon etwas steht
  const vx = Math.round(a + 0.5), vy = Math.round(b + 0.5), ex = a - (vx - 0.5), ey = b - (vy - 0.5);
  if (ex * ex + ey * ey < VSLOT_NEAR * VSLOT_NEAR && vertexWanted(vx, vy)) return { x: vx, y: vy, slot: VSLOT };
  return { x, y, slot };
}
function vertexWanted(vx, vy) {
  const has = !!postAt(vx, vy);
  if (typeof tool === 'undefined') return has;
  if (tool === 'verschieben') return moving ? moving.kind === 'deco' && POST_OK.has(baseOf(moving.d.b)) : has;
  if (tool === 'look' || tool === 'abriss') return has;
  return !!(ITEMS[tool] && ITEMS[tool].small && POST_OK.has(baseOf(tool)));
}
const BIG_ON_TILE = new Set(['brunnen', 'kristallbrunnen', 'pavillon', 'statue', 'blumen', 'windrad', 'denkmal', 'uhrturm', 'karussell', 'schmetterlingsgarten', 'vogelbaum', 'zauberbrunnen', 'lm', ...Object.keys(STANDS),
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
const pathGate = k => edgeTiles(k).every(([x, y]) => wegAt(x, y) != null || crossingAt(x, y));
// Block 59: ein Tor geht auch ohne Weg (e.gate, im Fenster der Linie) – dort steht ein Gartentürchen in der Lücke
const isGate = k => { const e = state.edges.get(k); return !!(e && e.gate) || pathGate(k); };
// e.gate: true = Gartentor mit Türchen, 'offen' = Durchgang ohne Türchen (Bogen bei beiden möglich)
const gardenGate = k => { const e = state.edges.get(k); return !!(e && e.gate === true) && !pathGate(k); };
function setGate(k, kind) {                                      // kind: false (geschlossen), true (Türchen), 'offen'
  const e = state.edges.get(k);
  if (!e || (e.gate || false) === kind) return false;
  if (!kind && e.arch && !pathGate(k)) { state.money += ARCHES[e.arch].cost; delete e.arch; }   // ohne Tor kein Bogen: Taler zurück
  if (kind) e.gate = kind; else delete e.gate;
  sfx('deco'); recalc(); save();
  return true;
}
// Weg bündig an der Linie (Block 57): e.flush an/aus; ohne Angabe nur am Park (Parkrasen auf einer der beiden Seiten)
const edgeFlush = k => { const e = state.edges.get(k); return !!e && (e.flush != null ? e.flush : edgeTiles(k).some(([x, y]) => terraLook(x, y) === 'park')); };
// Alle Stücke, die über gemeinsame Eckpunkte mit k zusammenhängen (eine „Linie“)
function edgeRun(k) {
  const ends = q => { const { dir, i, j } = edgeParse(q); return [i + ',' + j, dir === 'a' ? (i + 1) + ',' + j : i + ',' + (j + 1)]; };
  const at = new Map();
  for (const q of state.edges.keys()) for (const v of ends(q)) { if (!at.has(v)) at.set(v, []); at.get(v).push(q); }
  const seen = new Set([k]), todo = [k];
  while (todo.length) for (const v of ends(todo.pop())) for (const q of at.get(v) || []) if (!seen.has(q)) { seen.add(q); todo.push(q); }
  return [...seen];
}
// Neue Linie (Block 57b, Wunsch Nutzerin): bündig – außer sie hängt an einer Linie, die schon ausdrücklich eingestellt ist (dann
// wie diese, sonst sähe ein Stück anders aus als der Rest). Vorher war neu immer „mit Grasstreifen“ (außer am Park), und an Ecken
// blieb zwischen Hecke und Weg ein Graszwickel – jede Hecke musste einzeln auf bündig gestellt werden
function newFlush(k) {
  for (const q of edgeRun(k)) { const e = q !== k && state.edges.get(q); if (e && e.flush != null) return e.flush; }
  return true;
}
// alle Linien der Insel bündig bzw. mit Grasstreifen (Knopf im Fenster einer Linie) – gibt zurück, wie viele sich geändert haben
// Linien umstellen (Block 145, wie Wege): nur dieses Stück, alle verbundenen derselben Art oder alle derselben Art
function edgesScope(k, scope) {
  const e = state.edges.get(k);
  if (!e) return [];
  if (scope === 'run') return edgeRun(k).filter(q => state.edges.get(q).b === e.b);
  if (scope === 'all') return [...state.edges].filter(([, o]) => o.b === e.b).map(([q]) => q);
  return [k];
}
// Form (Stil) bzw. Farbe für eine Liste von Stücken – kostenlos wie das Umfärben; gibt zurück, wie viele sich geändert haben
function restyleEdges(keys, style) {
  const e0 = state.edges.get(keys[0]), st = e0 && STYLES[e0.b].find(s => s.id === style);
  if (!st || !styleOk(st)) return 0;
  let n = 0;
  for (const q of keys) { const e = state.edges.get(q); if (e && e.b === e0.b && e.style !== style) { e.style = style; n++; } }
  if (n) { groundVersion++; recalc(); save(); }
  return n;
}
function recolorEdges(keys, col) {
  if (col && !bushColOk(col)) return 0;
  let n = 0;
  for (const q of keys) { const e = state.edges.get(q); if (e && e.b === 'hecke' && (e.col || 0) !== (col || 0)) { if (col) e.col = col; else delete e.col; n++; } }
  if (n) { groundVersion++; recalc(); save(); }
  return n;
}
function setFlushAll(on) {
  let n = 0;
  for (const [q, e] of state.edges) { if (edgeFlush(q) !== on) n++; e.flush = on; }
  groundVersion++; save();
  return n;
}
// Ecke rund/eckig für die ganze zusammenhängende Linie (wie „bündig“)
function setEdgeSq(k, sq) {
  if (!state.edges.has(k)) return false;
  for (const q of edgeRun(k)) { const e = state.edges.get(q); if (sq) e.sq = true; else delete e.sq; }
  groundVersion++; save();
  return true;
}
function setFlush(k, on) {
  if (!state.edges.has(k)) return false;
  for (const q of edgeRun(k)) state.edges.get(q).flush = on;
  groundVersion++; save();
  return true;
}
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
  if (ea.b === 'hecke' && [ea, eb].some(e => (e.style || '').startsWith('wilmer'))) return null;   // Wilmerhecke: runde Büsche, eckige Ecke (Block 86e)
  if (ea.sq || eb.sq) return null;                                    // „Ecke eckig“ gewählt (Nutzer, 09.10.2026) – sonst rund wie immer
  const tx = du > 0 ? i : i - 1, ty = dv > 0 ? j : j - 1, ox = du > 0 ? i - 1 : i, oy = dv > 0 ? j - 1 : j;
  const inPath = wegAt(tx, ty) != null, outWeg = inPath ? null : wegAt(ox, oy);
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
  if (edgeEndPoints(k).some(([vx, vy]) => postAt(vx, vy))) return 'An der Ecke steht schon etwas';   // Eckpunkt-Deko (Block 65)
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
    if (!EDGE_LIT.has(e.b + ':' + e.style)) continue;              // Laternen nur an beleuchteten Stilen
    out.push('E' + k);
    if (isGate(k)) { if (e.arch && !(e.b === 'mauer' && e.arch === 'bogen')) out.push('A' + k); else if (e.b !== 'hecke') out.push('G0' + k, 'G1' + k); continue; }   // Mauer-Torpfeiler: je eine Laterne   // Bogen oder Torpfeiler
    if (e.b !== 'hecke') for (const [vx, vy] of edgeEndPoints(k)) { const v = 'P' + vx + ',' + vy; if (!seen.has(v) && freeEnd(k, vx, vy)) { seen.add(v); out.push(v); } }
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
// Farbe einer Hecke beim Bauen (Block 145): immer die in der Leiste markierte (ohne Wahl Grün) – auch beim Überbauen, wie bei Wegen.
// Vorher behielt eine überbaute Hecke ihre Farbe, und gleiche Form in anderer Farbe galt als „schon alles fertig“
const edgeWantCol = b => b === 'hecke' ? bushColNew('hecke').col : undefined;
const edgeSame = (b, style, old) => !!old && old.b === b && old.style === style && (old.col || 0) === (edgeWantCol(b) || 0) && !!old.sq === edgeShape.sq;
function buildEdge(b, k) {
  const style = currentStyle(b), old = state.edges.get(k);
  if (edgeSame(b, style, old)) return false;
  const d = ITEMS[b];
  if (old) { state.money += ITEMS[old.b].cost; for (const [r, n] of Object.entries(ITEMS[old.b].mat || {})) state.res[r] += n; }   // die alte Linie zurück (Block 84b)
  state.money -= d.cost; payMat(d.mat || {});
  const col = edgeWantCol(b);                                            // Buschfarbe (Block 89; alle Hecken: Block 126; Grün überbaut: 145)
  state.edges.set(k, { b, style, ...(col ? { col } : {}), ...(edgeShape.sq ? { sq: true } : {}), ...(old && old.arch ? { arch: old.arch } : {}), ...(old && old.gate ? { gate: old.gate } : {}), ...(old && old.flush != null ? { flush: old.flush } : {}), born: performance.now() });
  if (!old) state.edges.get(k).flush = newFlush(k);                     // neue Linie: bündig (Block 57b)   // Umfärben: Tor, Bogen, Bündig bleiben
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
// Block 58: jede (große) Deko darf auf Wege, auch über mehrere Felder – der Weg bleibt darunter (Ankerfeld t.weg, die
// übrigen Felder t.wegs['dx,dy']). Gebäude dagegen ersetzen den Weg (Taler zurück, Rückgängig holt ihn wieder).
const plazaOk = b => !!STANDS[b] || (ITEMS[b].cat === 'deko' && !ITEMS[b].small && !ITEMS[b].edge && !ITEMS[b].paint && !ITEMS[b].old);
const PLAZA_OK = { has: plazaOk };                                     // (alter Name)
const plainWeg = k => { const t = state.tiles.get(k); return !!t && t.b === 'weg' && !t.cross && !t.bridge; };   // Brücke: kein Platz für Stände/Gebäude
const plazaSpot = (b, x, y) => plazaOk(b) && plainWeg(x + ',' + y);
// Wege, die ein Ding an (x, y) überdecken würde: [[fx, fy, Stil], …]
const pathsUnder = (b, x, y, rot, t) => footprint(b, x, y, rot || 0, t).filter(([fx, fy]) => plainWeg(fx + ',' + fy)).map(([fx, fy]) => [fx, fy, state.tiles.get(fx + ',' + fy).style || 'sand']);
// Gebäude, die einen Weg ersetzen dürfen (alles außer Deko, Wegen, Schienen und Gelände-Werkzeugen)
const replacesWeg = b => { const d = ITEMS[b]; return !plazaOk(b) && !d.paint && !d.edge && !d.small && d.cat !== 'land' && b !== 'weg' && b !== 'schiene' && !TERRAFORM[b]; };
function setUnder(t, x, y, list) {
  delete t.weg; delete t.wegs;
  for (const [fx, fy, st] of list) { if (fx === x && fy === y) t.weg = st; else (t.wegs = t.wegs || {})[(fx - x) + ',' + (fy - y)] = st; }
}
// Ding weg (abgerissen, aufgehoben): seine Wege liegen wieder da
function restoreUnder(t, x, y) {
  if (t.weg != null) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: t.weg });
  for (const [o, st] of Object.entries(t.wegs || {})) { const [dx, dy] = keyXY(o); state.tiles.set((x + dx) + ',' + (y + dy), { b: 'weg', lvl: 1, style: st }); }
}
const wegUnder = t => !t ? null : t.b === 'weg' ? t.style || 'sand' : t.weg != null ? t.weg : null;
// Deko (Platz-tauglich), die auf dem Feld (x, y) steht – darunter darf ein Weg gelegt werden: [Ding, Ankerfeld]
const decoOver = (x, y) => { const a = COVER.get(x + ',' + y), t = a && state.tiles.get(a); return t && plazaOk(t.b) ? [t, a] : null; };
// Weg unter die Deko legen (oder umfärben)
function wegUnderDeco(x, y, style) {
  const [t, a] = decoOver(x, y), [ax, ay] = keyXY(a);
  if (x === ax && y === ay) t.weg = style; else (t.wegs = t.wegs || {})[(x - ax) + ',' + (y - ay)] = style;
}
// Weg auf/unter dem Feld (x, y) – auch unter den übrigen Feldern großer Deko
function wegAt(x, y) {
  const k = x + ',' + y, t = state.tiles.get(k);
  if (t) return wegUnder(t);
  const a = COVER.get(k), o = a && state.tiles.get(a);
  if (!o || !o.wegs) return null;
  const [ax, ay] = keyXY(a), st = o.wegs[(x - ax) + ',' + (y - ay)];
  return st == null ? null : st;
}
// Flaches zum Zeichnen: das Feld selbst oder der Weg unter großer Deko
const flatAt = (x, y) => { const t = state.tiles.get(x + ',' + y); if (t) return t; const st = wegAt(x, y); return st != null ? { b: 'unter', weg: st } : null; };
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
      if (t && STANDS[t.b]) stands.push(k);
      for (const [dx, dy] of DIRS) {
        const n = (x + dx) + ',' + (y + dy);
        if (!seen.has(n) && wegAt(x + dx, y + dy) != null) { seen.add(n); todo.push(n); }
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
// Parks (Block 44): zusammenhängender Parkrasen; Deko darauf (kleine je Stück, große einmal) → Stufe nach PARK_STEPS
let PARKS = [];
const PARK_REACH = 4, PARK_ATTR = [0, 10, 25, 50], PARK_BEAUTY = [0, 15, 35, 70], PARK_NEAR = [0, 3, 4, 6];   // Schönheit ringsum: bis PARK_NEAR Felder
function computeParks() {
  const seen = new Set(), out = [];
  for (const [k0, v] of state.terra) {
    if (v !== 'park' || seen.has(k0)) continue;
    const tiles = [], todo = [k0], sorts = new Set();
    let deco = 0;
    seen.add(k0);
    while (todo.length) {
      const k = todo.pop(), [x, y] = keyXY(k);
      tiles.push(k);
      const t = state.tiles.get(k);
      if (t && t.b !== 'weg' && ITEMS[t.b] && ITEMS[t.b].cat === 'deko') { deco++; if (PARK_SORT[baseOf(t.b)]) sorts.add(PARK_SORT[baseOf(t.b)]); }
      for (const d of state.decos.get(k) || []) if (d) { deco++; if (PARK_SORT[baseOf(d.b)]) sorts.add(PARK_SORT[baseOf(d.b)]); }
      for (const [dx, dy] of DIRS) {
        const n = (x + dx) + ',' + (y + dy);
        if (!seen.has(n) && state.terra.get(n) === 'park') { seen.add(n); todo.push(n); }
      }
    }
    const stage = PARK_STEPS.filter(s => tiles.length >= s.tiles && deco >= s.deco && s.need.every(n => sorts.has(n))).length;
    out.push({ tiles, deco, sorts, stage });
  }
  PARKS = out.filter(p => p.stage);
  return out;
}
const parkAt = k => PARKS.find(p => p.tiles.includes(k)) || null;
// Achterbahnen (Block 60c): zusammenhängende Schienen + Stationen. Ein geschlossener Rundkurs mit Station fährt; die Höhen
// kommen von selbst: Station unten, Lifthügel (ein Viertel der Strecke) hinauf, dann in Wellen wieder hinunter.
// COASTER_AT: Feld → { c (Index in COASTERS oder -1), i (Platz im Ring), h (Höhe Mitte), hIn/hOut (an den Kanten), din/dout }
const isTrack = b => b === 'fz_bahn' || b === 'fz_station';
const COASTER_STEP = 8, COASTER_MAXSTEP = 10;                         // Höhen-Pinsel: Stufen à 8 px, bis 10 Stufen
let COASTERS = [], COASTER_AT = new Map();
function computeCoasters() {
  COASTERS = []; COASTER_AT = new Map();
  const all = new Set([...state.tiles].filter(([, t]) => isTrack(t.b)).map(([k]) => k)), seen = new Set();
  for (const k0 of all) {
    if (seen.has(k0)) continue;
    const comp = [], todo = [k0]; seen.add(k0);
    while (todo.length) { const k = todo.pop(); comp.push(k); const [x, y] = keyXY(k); for (const [dx, dy] of DIRS) { const n = (x + dx) + ',' + (y + dy); if (all.has(n) && !seen.has(n)) { seen.add(n); todo.push(n); } } }
    let ring = comp.length >= 4 && railLoop(comp);
    const st = ring && ring.findIndex(k => state.tiles.get(k).b === 'fz_station');
    if (ring && st >= 0 && ring.length === comp.length) {
      ring = ring.slice(st).concat(ring.slice(0, st));                      // Station vorn
      const n = ring.length, L = Math.max(2, Math.round(n * 0.25)), Hmax = Math.min(70, 16 + n * 1.6), waves = Math.max(1, Math.round((n - L) / 6));
      const auto = (i => i === 0 ? 0 : i <= L ? Hmax * i / L : Math.max(4, Hmax * (1 - (i - L) / (n - L)) * (0.55 + 0.45 * Math.cos((i - L) / (n - L) * Math.PI * 2 * waves))));
      const h = ring.map((k, i) => { const t = state.tiles.get(k); return t.hgt != null ? t.hgt * COASTER_STEP : auto(i); });   // Höhen-Pinsel (Block 60e) vor Automatik
      const c = COASTERS.length;
      COASTERS.push({ ring, h, n, L, Hmax: Math.max(...h), key: ring[0] });
      ring.forEach((k, i) => {
        const [x, y] = keyXY(k), [px, py] = keyXY(ring[(i - 1 + n) % n]), [nx, ny] = keyXY(ring[(i + 1) % n]);
        // an einer Station bleibt die Kante unten (die Station ist ganz flach, sonst fährt der Zug durchs Dach)
        const st = j => state.tiles.get(ring[(j + n) % n]).b === 'fz_station';
        const edge = (a, b) => st(a) || st(b) ? 0 : (h[(a + n) % n] + h[(b + n) % n]) / 2;
        COASTER_AT.set(k, { c, i, h: st(i) ? 0 : h[i], hIn: edge(i, i - 1), hOut: edge(i, i + 1), din: [x - px, y - py], dout: [nx - x, ny - y] });
      });
    } else for (const k of comp) {                                       // noch kein Rundkurs: Stücke in ihrer Pinsel-Höhe (sonst flach)
      const [x, y] = keyXY(k), t = state.tiles.get(k), h = t.hgt != null ? t.hgt * COASTER_STEP : 3, arms = coasterArms(x, y);
      const straight = arms.length === 2 && arms[0][0] === -arms[1][0] && arms[0][1] === -arms[1][1];
      COASTER_AT.set(k, { c: -1, h, hIn: h, hOut: h, ...(straight ? { din: arms[1], dout: arms[1] } : {}) });
    }
  }
  return COASTERS;
}
// Parkeisenbahn (Block 136): Gleis + Station auf Wiese/Park/Freizeitpark (auch über Wegen, der Weg bleibt darunter). Ein
// geschlossener Rundkurs mit mindestens einer Station fährt; die erste Station bestimmt den Zug (Form). PB_AT: Feld → { r, i, din, dout }
const isPbTrack = b => b === 'pb_gleis' || b === 'pb_station';
let PB_RINGS = [], PB_AT = new Map();
function computeParkRails() {
  PB_RINGS = []; PB_AT = new Map();
  const all = new Set([...state.tiles].filter(([, t]) => isPbTrack(t.b)).map(([k]) => k)), seen = new Set();
  for (const k0 of all) {
    if (seen.has(k0)) continue;
    const comp = [], todo = [k0]; seen.add(k0);
    while (todo.length) { const k = todo.pop(); comp.push(k); const [x, y] = keyXY(k); for (const [dx, dy] of DIRS) { const n = (x + dx) + ',' + (y + dy); if (all.has(n) && !seen.has(n)) { seen.add(n); todo.push(n); } } }
    let ring = comp.length >= 4 && railLoop(comp);
    const st = ring ? ring.findIndex(k => state.tiles.get(k).b === 'pb_station') : -1;
    if (!ring || st < 0 || ring.length !== comp.length) continue;
    ring = ring.slice(st).concat(ring.slice(0, st));                      // erste Station vorn
    const n = ring.length, r = PB_RINGS.length, stops = ring.map((k, i) => state.tiles.get(k).b === 'pb_station' ? i : -1).filter(i => i >= 0);
    PB_RINGS.push({ ring, n, key: ring[0], form: state.tiles.get(ring[0]).form || 0, stops });
    ring.forEach((k, i) => {
      const [x, y] = keyXY(k), [px, py] = keyXY(ring[(i - 1 + n) % n]), [nx, ny] = keyXY(ring[(i + 1) % n]);
      PB_AT.set(k, { r, i, din: [x - px, y - py], dout: [nx - x, ny - y] });
    });
  }
  return PB_RINGS;
}
const pbArms = (x, y) => DIRS.filter(([dx, dy]) => { const t = state.tiles.get((x + dx) + ',' + (y + dy)); return !!t && isPbTrack(t.b); });
// Höhenstufe eines Schienenstücks: vom Pinsel gesetzt, sonst die angezeigte Höhe (Automatik) gerundet
const trackLevel = (x, y) => { const t = state.tiles.get(x + ',' + y), ca = COASTER_AT.get(x + ',' + y); return t && t.hgt != null ? t.hgt : Math.round(((ca && ca.h) || 0) / COASTER_STEP); };
const coasterArms = (x, y) => DIRS.filter(([dx, dy]) => { const t = state.tiles.get((x + dx) + ',' + (y + dy)); return t && isTrack(t.b); });
// Tortürme (Block 60f): je zwei in derselben Reihe oder Spalte, 2 bis 7 Felder auseinander, die einander am nächsten sind
let TOR_PAIR = new Map();
function computeTorPairs() {
  TOR_PAIR = new Map();
  const towers = [...state.tiles].filter(([, t]) => t.b === 'fz_torturm').map(([k]) => k), best = new Map();
  for (const a of towers) {
    const [ax, ay] = keyXY(a);
    let pick = null, pd = 99;
    for (const b of towers) { if (a === b) continue; const [bx, by] = keyXY(b), d = ax === bx ? Math.abs(ay - by) : ay === by ? Math.abs(ax - bx) : 99; if (d >= 2 && d <= 7 && d < pd) { pd = d; pick = b; } }
    if (pick) best.set(a, pick);
  }
  for (const [a, b] of best) if (best.get(b) === a) TOR_PAIR.set(a, b);
}
// Freizeitparks (Block 60): zusammenhängender Freizeitpark-Boden; Fahrgeschäfte & Stände darauf (je eins) → Stufe nach FZ_STEPS
let FZPARKS = [];
function computeFz() {
  const seen = new Set(), out = [];
  for (const [k0, v] of state.terra) {
    if (v !== 'fz' || seen.has(k0)) continue;
    const tiles = [], todo = [k0], sorts = new Set(), rides = new Set();
    seen.add(k0);
    while (todo.length) {
      const k = todo.pop(), [x, y] = keyXY(k);
      tiles.push(k);
      const a = COVER.get(k), t = a && state.tiles.get(a);
      if (t && ITEMS[t.b].cat === 'fz' && ITEMS[t.b].fzSort) { rides.add(a); sorts.add(ITEMS[t.b].fzSort); }
      const ca = COASTER_AT.get(k);                                         // fertige Achterbahn: eine Attraktion
      if (ca && ca.c >= 0) { rides.add('bahn' + ca.c); sorts.add('fahrt'); sorts.add('achterbahn'); }
      for (const [dx, dy] of DIRS) {
        const n = (x + dx) + ',' + (y + dy);
        if (!seen.has(n) && state.terra.get(n) === 'fz') { seen.add(n); todo.push(n); }
      }
    }
    // zwei Tortürme mit Bogen: Eingang (Block 60f)
    const set = new Set(tiles);
    for (const [k, o] of TOR_PAIR) if (set.has(k) && k < o) { rides.add('tor' + k); sorts.add('tor'); }
    const stage = FZ_STEPS.filter(s => tiles.length >= s.tiles && rides.size >= s.rides && s.need.every(n => sorts.has(n))).length;
    out.push({ tiles, rides: rides.size, sorts, stage });
  }
  FZPARKS = out.filter(p => p.stage);
  return out;
}
const fzBest = () => Math.max(0, ...FZPARKS.map(p => p.stage));
// Abstand (Felder, wie Chebyshev) vom Rechteck x0..x1, y0..y1 zum nächsten Feld des Parks
function parkDist(p, x0, y0, x1 = x0, y1 = y0) {
  let best = Infinity;
  for (const k of p.tiles) { const [px, py] = keyXY(k); best = Math.min(best, Math.max(0, px - x1, x0 - px, py - y1, y0 - py)); }
  return best;
}
// Läden bis MARKT_REACH Felder um einen Marktplatz: Marktviertel
function nearMarket(x, y, w = 1, h = 1) {
  const x1 = x + w - 1, y1 = y + h - 1;
  return MARKETS.some(m => m.tiles.some(([mx, my]) => Math.max(0, mx - x1, x - mx, my - y1, y - my) <= MARKT_REACH));
}
// Natur räumt das Bauen selbst weg – zum Preis von Roden bzw. Sprengen. Was ein Betrieb braucht, bleibt
// (Holzfäller im Wald, Kristallmine auf Kristallfels; Steinbruch und Bergwerk graben im Fels).
// Selbst Gebautes wird nie weggeräumt (das prüft COVER vorher), Wasser auch nicht (dafür gibt es Aufschütten).
const CLEAR_COST = { forest: 10, obst: 10, rock: 50, erz: 50, kristall: 50 };
const TERRAFORM = { wiese: 'wiese', strand: 'sand', wald: 'forest', obstwald: 'obst', fels: 'rock', parkrasen: 'park', fzboden: 'fz' };
// Auf dem Freizeitpark-Boden (Block 60): Fahrgeschäfte, Stände, Deko, Wege, Linien – keine Häuser
const fzOk = b => parkOk(b) || ITEMS[b].cat === 'fz';
// Auf dem Parkrasen stehen nur Deko und Wege (sonst wäre es kein Park)
const parkOk = b => b === 'weg' || (ITEMS[b] || {}).cat === 'deko' || !!(ITEMS[b] || {}).edge;   // Pinsel → Gelände
function willClear(b, ter) {
  if (!(ter in CLEAR_COST) || b === 'parkrasen') return false;     // Parkrasen im Wald: die Bäume bleiben (als Parkbäume)
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
  if (d.gift && !opts.move && !available(b)) return 'Souvenirs stellst du aus dem Sammelregal im Album auf';   // Block 129
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (slot === VSLOT) {                                          // Eckpunkt (Block 65): alle vier Felder drumherum prüfen
    if (!POST_OK.has(baseOf(b))) return 'Auf die Ecke passt nur Schmales (Laterne, Blumentopf …)';
    if (postAt(x, y)) return 'Hier steht schon etwas';
    if (edgesAt(x, y).length) return 'Hier steht der Pfosten einer Linie';
    for (const [fx, fy, cs] of vertexCorners(x, y)) {
      if (!ownedTile(fx, fy)) return notMine(fx, fy);
      if (terrainAt(fx, fy) === 'water') return 'Nicht ans Wasser';
      const ft = objAt(fx, fy);
      if (ft && !(ft.b === 'weg' || wegUnder(ft) != null || isCrossing(ft) || (ITEMS[ft.b].cat === 'deko' && !isBig(ft.b)))) return 'Nicht an ein Gebäude';
      const fds = decosAt(fx + ',' + fy);
      if (fds && fds[cs]) return 'An dieser Ecke steht schon etwas';
    }
    if (opts.move || opts.noCost) return null;
    if (state.money < d.cost) return 'Zu wenig Taler';
    return matError(d.mat);
  }
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  const t = objAt(x, y);
  if (t && (BIG_ON_TILE.has(t.b) || isBig(t.b))) return 'Hier ist kein Platz für Deko';
  if (slot < 4 && postAt(...cornerVertex(x, y, slot))) return 'An dieser Ecke steht schon etwas';
  if (slot >= 4 && t && wegUnder(t) == null && !isCrossing(t)) return 'Auf Gebäudefeldern nur an die Ecken';
  if (decosAt(k) && decosAt(k)[slot]) {
    const ds = decosAt(k);
    return ds.slice(0, 8).every(Boolean) ? 'Alle Plätze sind belegt' : slot < 4 && ds.slice(0, 4).every(Boolean) ? 'Alle 4 Ecken sind belegt' : slot < 4 ? 'Diese Ecke ist schon belegt' : 'Dieser Platz ist schon belegt';
  }
  if (opts.move) return !t && terrainAt(x, y) !== 'grass' ? 'Erst roden bzw. sprengen' : null;
  if (opts.noCost) return null;
  if (state.money < d.cost + clearCost(b, x, y)) return 'Zu wenig Taler';
  return matError(d.mat);
}
// Ist die angetippte Ecke belegt, die nächste freie nehmen: erst die beiden Nachbarecken, dann die gegenüber
function freeSlot(x, y, slot) {
  const ds = decosAt(x + ',' + y);
  if (!ds || slot === VSLOT) return slot;
  const i = (slot < 4 ? [slot, slot ^ 1, slot ^ 2, slot ^ 3] : [slot, 4 + ((slot - 2) & 3), 4 + ((slot - 3) & 3), 4 + ((slot - 1) & 3)]).find(n => !ds[n]);
  return i == null ? slot : i;
}
// Bank in einer Seitenmitte: längs zur Feldseite, der Sitz schaut zur Feldmitte (zum Weg), egal wie gerade gedreht wird
const MID_FACE = { 4: 0, 5: 3, 6: 2, 7: 1 }, MID_TURN = new Set(['bank', 'strassenlaterne']);   // Straßenlaterne: Ausleger über den Weg (Block 132)
const midRot = slot => MID_FACE[slot];
// Drehung kleiner Deko beim Setzen – Vorschau und Bauen nutzen dieselbe (Block 69): Bank in einer Seitenmitte von selbst längs
// zur Seite, außer man hat selbst gedreht (⟳/Mausrad/R) – dann bleibt die eigene Drehung
const smallRot = (b, slot) => slot >= 4 && slot < 8 && MID_TURN.has(b) && !rotManual ? midRot(slot) : ROTATABLE.has(b) ? buildRot : 0;
function buildSmall(b, x, y, slot) {
  const err = smallError(b, x, y, slot);
  if (err) { fail(err); return false; }
  const k = x + ',' + y;
  if (slot !== VSLOT) clearNature(b, x, y);                       // Eckpunkt: nichts roden
  state.money -= ITEMS[b].cost;
  payMat(ITEMS[b].mat);
  if (!state.decos.has(k)) state.decos.set(k, newSlots());
  state.decos.get(k)[slot] = { b, rot: smallRot(b, slot), born: performance.now(), ...(b === 'busch' ? bushColNew('busch') : {}), ...(DECO_LOOKS[baseOf(b)] ? decoLookNew(baseOf(b)) : {}), ...(ITEMS[b].gift ? { sv: svPick } : {}) };
  sfx('deco');
  recalc(); checkStars(); save();
  if (ITEMS[b].gift) svPutDone();                                // jedes Souvenir steht nur einmal (Block 129)
  return true;
}
// Kleine Deko zurückgeben: Preis und Material – geschenkte (Parkbäume aus dem Wald, Block 84b) bringen nichts
const decoBack = d => d.free ? 0 : ITEMS[d.b].cost || 0;
// Buschfarbe (Block 89): Index in BUSH_COLS; frei oder in der Kunstakademie gekauft. Für neu Gebautes: state.paintNew.busch
// (Busch und seine Größen) bzw. state.paintNew.hecke (Wilmerhecke), je { col }
const bushColOk = i => !!BUSH_COLS[i] && (!BUSH_COLS[i].design || state.design.has('busch:' + BUSH_COLS[i].id) || !!(state.legacy && state.legacy.has('busch:' + BUSH_COLS[i].id)));
const bushColNew = key => { const p = state.paintNew[key]; return p && p.col && bushColOk(p.col) ? { col: p.col } : {}; };
// Form und Farbe von Stadtschmuck (Block 106): frei oder in der Kunstakademie gekauft; für neu Gebautes state.paintNew[b] = { form, col }
function lookOk(b, kind, i) {
  const L = DECO_LOOKS[b], e = L && (kind === 'form' ? L.forms : L.cols || [])[i];
  if (!e) return false;
  const key = `${b}:${kind}:${e.id}`;
  return !e.design || state.design.has(key) || !!(state.legacy && state.legacy.has(key));
}
function decoLookNew(b) {
  const p = state.paintNew[b] || {}, out = {};
  if (Number.isInteger(p.form) && p.form > 0 && lookOk(b, 'form', p.form)) out.form = p.form;
  if (Number.isInteger(p.col) && p.col > 0 && lookOk(b, 'col', p.col)) out.col = p.col;
  return out;
}
const isWilmerStyle = st => (st || '').startsWith('wilmer');
function payBackDeco(d) {
  if (d.free) return;
  state.money += ITEMS[d.b].cost || 0;
  for (const [r, n] of Object.entries(ITEMS[d.b].mat || {})) state.res[r] += n;
}
function removeSmall(x, y, slot) {
  const k = x + ',' + y, ds = decosAt(k);
  if (!ds || !ds[slot]) return;
  payBackDeco(ds[slot]);
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
const available = id => ITEMS[id].variantOf ? available(ITEMS[id].variantOf) : ITEMS[id].gift ? !!svPick && svFree(svPick) : unlockOk(ITEMS[id], id);   // Größen: wie das Grundmodell; Souvenir: aus dem Regal gewählt (Block 129)
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
    else {
      const got = reachKind(acc, x + ',' + y, x, y, r, pred, n), how = got.how || (n === 1 && types.includes('park') ? parkReach(acc, x, y) : null);   // selbstgebauter Park
      conds.push({ text: nearText(types, n, r, t.b), ok: !!how, how });
    }
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
  if (b === 'tunneleinfahrt') {                                         // zeigt von selbst mit dem hinteren Ende zum Tunnel (Block 136)
    const ok = [buildRot, 0, 1, 2, 3].find(rr => { const { B, d } = einTiles(x, y, rr); return tunnelAt(B[0] + d[0], B[1] + d[1]); });
    return ok == null ? buildRot : ok;
  }
  return autoRot(b, x, y, buildRot);
}

// Schienen über Wasser sind Brücken und kosten mehr
const BRIDGE = { cost: 40, mat: { holz: 2, metall: 2 } };
// Wegbrücken (Block 66): ein Weg übers Wasser wird von selbst zur Brücke – über eigene Teiche, Flüsse, Seen beliebig lang,
// ins Meer höchstens BRIDGE_SEA Felder vor die Küste. Nur gerade (keine Kurven/Abzweige auf dem Wasser), und sie wächst
// vom Ufer aus (ein Nachbar ist schon Weg oder Brücke). Aussehen nach Wegstil (bridgeKind), im Fenster umstellbar (t.brk).
const BRIDGE_SEA = 3;
// Höchstens BRIDGE_MAX Felder übers Wasser (Block 150b, Nutzer: länger sieht der Bogen nicht mehr gut aus) – dafür auch übers Meer
// von Insel zu Insel, wenn das Wasser dazwischen nicht breiter ist (auf beiden Seiten eigenes Land in einer geraden Linie)
const BRIDGE_MAX = 16, BRIDGE_WIDE = 4;                               // breit: höchstens 4 Reihen nebeneinander (Block 151, Nutzer)
// Länge der Brücke durch (x, y) entlang der Achse (gebaute und geplante Brückenfelder, samt diesem)
function bridgeRunLen(x, y, [dx, dy]) {
  let n = 1;
  for (const s of [1, -1]) for (let i = 1; i <= BRIDGE_MAX + 1 && isBridgeAt(x + dx * s * i, y + dy * s * i); i++) n++;
  return n;
}
// Liegt (x, y) auf einer geraden Wasserstrecke von höchstens BRIDGE_MAX Feldern zwischen eigenem Land (beide Enden)?
function seaGapBridgeable(x, y, [dx, dy]) {
  const end = s => { for (let i = 1; i <= BRIDGE_MAX; i++) { const px = x + dx * s * i, py = y + dy * s * i; if (terrainAt(px, py) !== 'water') return ownedTile(px, py) ? i : 0; } return 0; };
  const a = end(1), b = end(-1);
  return !!a && !!b && a + b - 1 <= BRIDGE_MAX;
}
const WEG_BRIDGE = {
  holz:   { name: 'Holzsteg', icon: '🪵', cost: 30, mat: { bretter: 2 } },
  stein:  { name: 'Steinbogen', icon: '🌉', cost: 60, mat: { quader: 2 } },
  ziegel: { name: 'Ziegelbrücke', icon: '🧱', cost: 60, mat: { quader: 2 } },
  rot:    { name: 'Rote Bogenbrücke', icon: '⛩️', cost: 80, mat: { bretter: 2, metall: 1 } },
};
const BRIDGE_OF_STYLE = { sand: 'holz', mulch: 'holz', tritt: 'holz', kopf: 'ziegel', klinker: 'ziegel', terrakotta: 'ziegel', fisch: 'ziegel', blueten: 'ziegel' };   // sonst Stein
const bridgeKind = t => (t && t.brk) || BRIDGE_OF_STYLE[(t && t.style) || 'sand'] || 'stein';
const isWegBridge = t => !!t && t.b === 'weg' && !!t.bridge;
// Bogenbrücken (Block 150, nach Vorschauen mit dem Nutzer entschieden): eine Wegbrücke ab 2 Feldern, die an beiden Enden an Land
// stößt, wird ein Bogen über die ganze Länge (Mondbrücke) – vorher lagen alle flach, und Boote fuhren „in“ die Brücke. Höhe wächst
// mit der Länge (ab 16 Feldern nicht mehr). Stein/Ziegel: echte Bogenöffnungen (`archOpenings`), Holz/Rot: Pfähle (ab 5 Feldern nur
// jedes zweite Feld). Ein Feld oder offenes Ende (Steg ins Meer): flach wie bisher. Gemerkt je groundVersion (recalc leert).
const bridgeArchCache = { v: -1, tiles: null, map: new Map() };
function bridgeArch(x, y) {
  const C = bridgeArchCache, k = x + ',' + y;
  if (C.v !== groundVersion || C.tiles !== state.tiles) { C.v = groundVersion; C.tiles = state.tiles; C.map.clear(); }
  if (!C.map.has(k)) C.map.set(k, bridgeArchCalc(x, y));
  return C.map.get(k);
}
// Richtung einer Brücke (0: längs u/x, 1: längs v/y): die Achse, an deren Enden Land liegt; sonst die längere Reihe Brückenfelder.
// Breite Brücken (Block 151): quer liegen weitere Brückenfelder – die zählen nicht als Arm (vorher die ersten Nachbarn)
function bridgeAxis(x, y, t) {
  const walk = (dx, dy, s) => { let i = 1; while (i < 40 && isWegBridge(state.tiles.get((x + dx * s * i) + ',' + (y + dy * s * i)))) i++; return i; };
  const ends = (dx, dy) => [1, -1].filter(s => { const i = walk(dx, dy, s); return terrainAt(x + dx * s * i, y + dy * s * i) !== 'water'; }).length;
  const ex = ends(1, 0), ey = ends(0, 1);
  if (ex !== ey) return ex > ey ? 0 : 1;
  const rx = walk(1, 0, 1) + walk(1, 0, -1), ry = walk(0, 1, 1) + walk(0, 1, -1);
  if (rx !== ry) return rx > ry ? 0 : 1;
  const arms = pathArms(x, y); return arms.length ? (arms[0][0] ? 0 : 1) : ((t.rot || 0) & 1);
}
function bridgeArchCalc(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!isWegBridge(t)) return null;
  const ax = bridgeAxis(x, y, t), dx = ax ? 0 : 1, dy = ax ? 1 : 0, at = i => state.tiles.get((x + dx * i) + ',' + (y + dy * i));
  let i0 = 0, i1 = 0;
  while (i0 < 60 && isWegBridge(at(-i0 - 1))) i0++;
  while (i1 < 60 && isWegBridge(at(i1 + 1))) i1++;
  const N = i0 + 1 + i1, landAt = i => terrainAt(x + dx * i, y + dy * i) !== 'water';   // Ufer (breite Brücke: auch ohne Weg davor)
  if (N < 2 || !landAt(-i0 - 1) || !landAt(i1 + 1)) return null;
  const A = { ax, i0, N, peak: 20.4 * Math.pow(Math.min(N, 16) / 2, 0.6), wall: bridgeKind(t) === 'stein' || bridgeKind(t) === 'ziegel' };
  A.open = archOpenings(A);
  A.pass = Array.from({ length: N }, (_, j) => archBoatOk(A, j + 0.5));
  if (!A.pass.some(Boolean)) A.pass = A.pass.map(() => true);           // nirgends hoch genug (kurz, Stein): wie bisher überall durch – nie absperren
  return A;
}
// Höhe des Belags an der Stelle s (0 … N, in Feldern vom Anfang der Brücke)
const archDeck = (A, s) => A.peak * Math.sin(Math.PI * Math.max(0, Math.min(A.N, s)) / A.N);
const archSpan = N => N >= 5 ? 2 : 1;
function archCenters(N) {
  const S = archSpan(N), off = (N - S * Math.floor(N / S)) / 2, out = [];
  for (let c = off + S / 2; c < N; c += S) out.push(c);
  return out;
}
// Bogenöffnungen von Stein/Ziegel (c, r in Feldern ab Brückenanfang, h Höhe): bis 6 Felder je Pfeilerabstand eine; 7–11 ein Hauptbogen
// (so groß wie bei 6) mit je einem Nebenbogen; 12–13 zwei Hauptbögen und je ein Nebenbogen; ab 14 zwei große Bögen in der Mitte
function archOpenings(A) {
  const N = A.N, Hs = s => archDeck(A, s), MR = 1.6, mainH = c => Math.min(A.peak * 0.6, Math.min(Hs(c - MR), Hs(c + MR)) - 4);
  const R6 = 0.72, H6 = 20.4 * Math.pow(3, 0.6) * Math.sin(Math.PI * (3 - R6) / 6) - 4, sr = 0.62, gap = 0.35;
  const side = c => ({ c, r: sr, h: Math.min(mainH(N / 2) * 0.55, Math.min(Hs(c - sr), Hs(c + sr)) - 4) });
  let list;
  if (N <= 6) { const S = archSpan(N), r = 0.3 * S + (S > 1 ? 0.12 : 0); list = archCenters(N).map(c => ({ c, r, h: Math.min(Hs(c - r), Hs(c + r)) - 4 })); }
  else if (N <= 11) list = [{ c: N / 2, r: R6, h: H6 }, side(N / 2 - (R6 + gap + sr)), side(N / 2 + (R6 + gap + sr))];
  else if (N <= 13) { const c0 = N / 2 - R6 - 0.2, c1 = N / 2 + R6 + 0.2; list = [{ c: c0, r: R6, h: H6 }, { c: c1, r: R6, h: H6 }, side(c0 - (R6 + gap + sr)), side(c1 + (R6 + gap + sr))]; }
  else { const cs = [N / 2 - MR - 0.225, N / 2 + MR + 0.225], h = Math.min(...cs.map(mainH)); list = cs.map(c => ({ c, r: MR, h })); }
  return list.filter(o => o.h > 2);
}
// Passt ein Boot an der Stelle s darunter durch? Stein/Ziegel: in einer Öffnung, die hoch genug ist; Holz/Rot: Belag hoch genug
function archBoatOk(A, s) {
  if (A.wall) return A.open.some(o => o.h >= 9 && Math.abs(s - o.c) <= o.r * 0.85);
  return archDeck(A, s) >= 12;
}
// Höhe eines Bewohners auf einer Bogenbrücke (Weltpunkt px, py) – 0 daneben
function wegBridgeLift(px, py) {
  const rx = Math.round(px), ry = Math.round(py), A = bridgeArch(rx, ry);
  return A ? archDeck(A, A.i0 + (A.ax ? py - ry : px - rx) + 0.5) : 0;
}
let PLANNED = null;                                          // beim Ziehen (planScan): Felder, die der Plan schon baut
const isBridgeAt = (x, y) => isWegBridge(state.tiles.get(x + ',' + y)) || (!!PLANNED && PLANNED.has(x + ',' + y) && terrainAt(x, y) === 'water');
const wegLike = (x, y) => { const t = state.tiles.get(x + ',' + y); return (!!t && (t.b === 'weg' || isCrossing(t) || t.b === 'rathaus')) || (!!PLANNED && PLANNED.has(x + ',' + y)); };
const armsWith = (x, y, plus) => DIRS.filter(([dx, dy]) => (plus && plus[0] === x + dx && plus[1] === y + dy) || wegLike(x + dx, y + dy));
const straightArms = arms => arms.length <= 1 || (arms.length === 2 && arms[0][0] === -arms[1][0] && arms[0][1] === -arms[1][1]);
// Weg auf (x, y): bleibt jede Brücke gerade (das neue Feld übers Wasser und Brücken daneben)?
// Achse eines Brückenfelds aus seinen Armen: längs höchstens gerade durch, quer nur weitere Brückenfelder (breite Brücke, Block 151);
// −1 = Kurve/Abzweig. plus: ein Feld, das gerade dazukommt (übers Wasser zählt es als Brücke)
function bridgeArmsAxis(px, py, plus) {
  const arms = armsWith(px, py, plus);
  const lat = ([dx, dy]) => isBridgeAt(px + dx, py + dy) || (!!plus && plus[0] === px + dx && plus[1] === py + dy && terrainAt(plus[0], plus[1]) === 'water');
  // je Achse: gültig, wenn alles quer dazu Brücke ist (Nachbarreihe); Wert = Arme längs. Mehr Arme längs = diese Richtung
  const ok = [0, 1].map(axis => arms.filter(a => (axis ? a[1] : a[0]) === 0).every(lat) ? arms.filter(a => (axis ? a[1] : a[0]) !== 0).length : -1);
  if (ok[0] < 0 && ok[1] < 0) return -1;
  if (ok[0] !== ok[1]) return ok[0] > ok[1] ? 0 : 1;
  // Gleichstand (z. B. zweite Reihe einer breiten Brücke beim Ziehen: ein Feld davor, eine Reihe daneben): Richtung der Brückennachbarn,
  // deren Richtung eindeutig ist – vorher galt dann immer Ost-West, und Nord-Süd-Brücken bekamen Löcher (Nutzer, 08.10.2026)
  for (const [dx, dy] of DIRS) if (isBridgeAt(px + dx, py + dy)) { const n = bridgeRowAxis(px + dx, py + dy); if (n >= 0) return n; }
  return 0;
}
// Richtung eines Brückenfelds nur aus seinen Armen (ohne Nachbarn zu fragen): mehr Arme längs x → 0, längs y → 1, gleich → −1
function bridgeRowAxis(x, y) {
  const nx = (wegLike(x - 1, y) ? 1 : 0) + (wegLike(x + 1, y) ? 1 : 0), ny = (wegLike(x, y - 1) ? 1 : 0) + (wegLike(x, y + 1) ? 1 : 0);
  return nx === ny ? -1 : nx > ny ? 0 : 1;
}
function bridgeShapeError(x, y, water) {
  if (water) {
    if (!armsWith(x, y).length) return 'Brücken wachsen vom Ufer aus – zieh den Weg vom Land aufs Wasser';
    const ax = bridgeArmsAxis(x, y);
    if (ax < 0) return 'Brücken nur gerade – keine Kurven auf dem Wasser';
    // alle Brückenfelder daneben laufen in dieselbe Richtung: parallele Reihen (breit) ja, Abzweig oder Ecke auf dem Wasser nein
    for (const [dx, dy] of DIRS) if (isBridgeAt(x + dx, y + dy) && bridgeArmsAxis(x + dx, y + dy, [x, y]) !== ax) return 'Brücken nur gerade – keine Abzweige auf dem Wasser';
    if (bridgeRunLen(x, y, ax ? [0, 1] : [1, 0]) > BRIDGE_MAX) return `Brücken höchstens ${BRIDGE_MAX} Felder lang`;
    if (bridgeRunLen(x, y, ax ? [1, 0] : [0, 1]) > BRIDGE_WIDE) return `Brücken höchstens ${BRIDGE_WIDE} Felder breit`;
  }
  for (const [dx, dy] of DIRS) if (isBridgeAt(x + dx, y + dy) && bridgeArmsAxis(x + dx, y + dy, [x, y]) < 0) return 'Brücken nur gerade – keine Abzweige auf dem Wasser';
  return null;
}
// Eine Brücke = alle zusammenhängenden Brückenfelder (sie sind gerade): Art und Farben gelten für sie alle (Block 66c)
function bridgeSpan(x, y) {
  const out = [], seen = new Set(), todo = [[x, y]];
  while (todo.length) {
    const [px, py] = todo.pop(), k = px + ',' + py;
    if (seen.has(k) || !isWegBridge(state.tiles.get(k))) continue;
    seen.add(k); out.push([px, py]);
    for (const [dx, dy] of DIRS) todo.push([px + dx, py + dy]);
  }
  return out;
}
// Brücken-Art umstellen (Fenster): für die ganze Brücke; alte voll zurück, neue bezahlen; Art wie der Wegstil sie wählt,
// wird nicht gemerkt
function setBridgeKind(x, y, kind) {
  if (!isWegBridge(state.tiles.get(x + ',' + y)) || !WEG_BRIDGE[kind]) return false;
  const tiles = bridgeSpan(x, y).map(([px, py]) => state.tiles.get(px + ',' + py)).filter(t => bridgeKind(t) !== kind);
  if (!tiles.length) return false;
  const nw = WEG_BRIDGE[kind], c = (B, n = 1) => Object.fromEntries(Object.entries({ money: B.cost, ...B.mat }).map(([r, v]) => [r, v * n]));
  for (const t of tiles) addCost(c(WEG_BRIDGE[bridgeKind(t)]), 1);
  if (!canPay(c(nw, tiles.length))) { for (const t of tiles) addCost(c(WEG_BRIDGE[bridgeKind(t)]), -1); fail(state.money < nw.cost * tiles.length ? 'Zu wenig Taler' : 'Material fehlt noch'); return false; }
  addCost(c(nw, tiles.length), -1);
  for (const t of tiles) { if (kind === (BRIDGE_OF_STYLE[t.style || 'sand'] || 'stein')) delete t.brk; else t.brk = kind; }
  groundVersion++; sfx('build'); recalc(); save();
  return true;
}
// Verbundene Wege (Block 125b, Wunsch Nutzer: „alle verbundenen Wege umfärben, statt alles neu zu ziehen“): alle Wegfelder, die
// über Nachbarfelder mit (x, y) verbunden sind – auch Brücken und Bahnübergänge (sie tragen den Weg-Belag)
const wegCarrier = t => !!t && (t.b === 'weg' || (t.cross && isCrossing(t)));
// Weg auf dem Feld – auch unter einem Stand oder Deko (t.weg, bei großer Deko t.wegs; Nutzer, 09.10.2026: „Alle verbundenen“
// ließ den Weg unter Ständen aus und riss dort ab). Liefert den Belag oder null
const wegCellStyle = (x, y) => { const t = state.tiles.get(x + ',' + y); return wegCarrier(t) ? t.style || 'sand' : wegAt(x, y); };
function setWegCell(x, y, style) {
  const t = state.tiles.get(x + ',' + y);
  if (wegCarrier(t)) {
    if (isWegBridge(t)) { const kind = bridgeKind(t); t.style = style; if (kind === (BRIDGE_OF_STYLE[style] || 'stein')) delete t.brk; else t.brk = kind; }
    else t.style = style;
  } else if (t) t.weg = style;                                         // Ding steht mit seinem Ankerfeld hier
  else { const a = COVER.get(x + ',' + y), o = state.tiles.get(a), [ax, ay] = keyXY(a); o.wegs[(x - ax) + ',' + (y - ay)] = style; }
}
function wegNetwork(x, y, max = 20000) {
  if (wegCellStyle(x, y) == null) return [];
  const seen = new Set([x + ',' + y]), out = [[x, y]];
  for (let i = 0; i < out.length && out.length < max; i++) {
    const [cx, cy] = out[i];
    for (const [dx, dy] of DIRS) {
      const k = (cx + dx) + ',' + (cy + dy);
      if (seen.has(k)) continue;
      seen.add(k);
      if (wegCellStyle(cx + dx, cy + dy) != null) out.push([cx + dx, cy + dy]);
    }
  }
  return out;
}
// Belag für mehrere Wegfelder (wie mit dem Weg-Werkzeug darüberziehen: je geändertes Feld ein Weg-Preis, Brücken bleiben, wie sie
// bezahlt sind)
function restyleWeg(list, style) {
  const st = isWegStyle(style) && styleDef('weg', style);
  if (!st || !styleOk(st)) return false;
  const cells = list.filter(([px, py]) => { const c = wegCellStyle(px, py); return c != null && c !== style; });
  if (!cells.length) return false;
  const cost = ITEMS.weg.cost * cells.length;
  if (state.money < cost) { fail('Zu wenig Taler'); return false; }
  state.money -= cost;
  for (const [px, py] of cells) setWegCell(px, py, style);
  groundVersion++; sfx('road'); recalc(); save();
  return true;
}
// Belag (Wegmuster) der ganzen Brücke direkt wählen (66d) – die Brücken-Art bleibt, wie sie bezahlt ist; kostet wie Umfärben
function setBridgeStyle(x, y, style) {
  const st = isWegStyle(style) && styleDef('weg', style);
  if (!st || !styleOk(st)) return false;
  const tiles = bridgeSpan(x, y).map(([px, py]) => state.tiles.get(px + ',' + py)).filter(t => (t.style || 'sand') !== style);
  if (!tiles.length) return false;
  const cost = ITEMS.weg.cost * tiles.length;
  if (state.money < cost) { fail('Zu wenig Taler'); return false; }
  state.money -= cost;
  for (const t of tiles) { const kind = bridgeKind(t); t.style = style; if (kind === (BRIDGE_OF_STYLE[style] || 'stein')) delete t.brk; else t.brk = kind; }
  groundVersion++; sfx('road'); recalc(); save();
  return true;
}
// Farbe der ganzen Brücke (key: 'brc' Bauwerk, 'brw' Planken; v null = wie die Brücke)
function setBridgeColor(x, y, key, v) {
  for (const [px, py] of bridgeSpan(x, y)) { const t = state.tiles.get(px + ',' + py); if (v == null) delete t[key]; else t[key] = v; }
  groundVersion++; save();
}
// Art eines neuen Brückenfelds: wie die Brücke, an die es anschließt, sonst nach dem gewählten Wegstil (66c)
const newBridgeKind = (x, y) => { const nb = DIRS.map(([dx, dy]) => state.tiles.get((x + dx) + ',' + (y + dy))).find(isWegBridge); return nb ? bridgeKind(nb) : bridgeKind({ style: currentStyle('weg') }); };
const costOf = (b, x, y) => b === 'schiene' && terrainAt(x, y) === 'water' ? BRIDGE
  : b === 'tunnel' && terrainAt(x, y) === 'water' ? TUNNEL_WATER
  : b === 'weg' && terrainAt(x, y) === 'water' ? WEG_BRIDGE[newBridgeKind(x, y)]
  : b === 'schuett' ? { cost: fillCost(x, y), mat: undefined }
  : { cost: ITEMS[b].cost || 0, mat: ITEMS[b].mat };
// U-Bahn (Block 136): Tunnel liegen in state.tunnels unter der Oberfläche und gehören zum Schienennetz. Ein Feld ist Schiene ODER
// Tunnel (nie beides). Schiene und Tunnel verbinden sich NUR über eine Tunneleinfahrt (Nutzer, 09.10.2026: „automatisch ist mega
// unintuitiv“) – trackLink sagt, welche Nachbarfelder befahrbar zusammenhängen.
const TUNNEL_WATER = { cost: 150, mat: { quader: 2, metall: 3 } };      // unter Wasser
const tunnelAt = (x, y) => !!state.tunnels && state.tunnels.has(x + ',' + y);
const isEinfahrt = (x, y) => bAt(x, y) === 'tunneleinfahrt';
const railTileAt = (x, y) => { const t = state.tiles.get(x + ',' + y); return !!t && t.b === 'schiene'; };   // das Schienenfeld selbst (nicht, was darüber steht)
const trackAt = (x, y) => railTileAt(x, y) || tunnelAt(x, y) || isEinfahrt(x, y);   // befahrbar
// Einfahrt am Feld (x, y): { A: vorderes Feld, B: hinteres (zum Tunnel), d } oder null
function einOf(x, y) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (!t || t.b !== 'tunneleinfahrt') return null;
  const [ax, ay] = keyXY(a);
  return einTiles(ax, ay, t.rot || 0);
}
const sameXY = (p, x, y) => p[0] === x && p[1] === y;
// Ein Ende einer Einfahrt: vorn an Schiene (Feld vor A), hinten an Tunnel (Feld hinter B), innen A ↔ B
function einLinks(E, x, y, nx, ny) {
  if (sameXY(E.A, x, y) && sameXY(E.B, nx, ny) || sameXY(E.B, x, y) && sameXY(E.A, nx, ny)) return true;
  if (sameXY(E.A, x, y)) return nx === x - E.d[0] && ny === y - E.d[1] && railTileAt(nx, ny);
  if (sameXY(E.B, x, y)) return nx === x + E.d[0] && ny === y + E.d[1] && tunnelAt(nx, ny);
  return false;
}
function trackLink(x, y, nx, ny) {
  const e1 = isEinfahrt(x, y), e2 = isEinfahrt(nx, ny);
  if (e1 || e2) {
    if (e1 && !einLinks(einOf(x, y), x, y, nx, ny)) return false;
    if (e2 && !einLinks(einOf(nx, ny), nx, ny, x, y)) return false;
    return true;
  }
  const r1 = railTileAt(x, y), r2 = railTileAt(nx, ny);
  if (r1 && r2) return true;
  return tunnelAt(x, y) && tunnelAt(nx, ny);                            // Schiene–Tunnel direkt: nein
}
// Einfahrt bauen (Nutzer: „du stellst sie falschherum hin“): Das Feld unter der Maus wird das hintere Feld am Tunnelende, aus
// jeder Richtung – der Anker (oben/links der Grundfläche) liegt dann ggf. ein Feld weiter. Ohne Tunnel daneben: wie immer.
function einAnchor(x, y) {
  if (tunnelAt(x, y)) return [x, y];
  for (const [dx, dy] of DIRS) if (tunnelAt(x + dx, y + dy) && !tunnelAt(x - dx, y - dy)) return [Math.min(x, x - dx), Math.min(y, y - dy)];
  return [x, y];
}
// Schiene, die direkt an einen Tunnel stößt (ohne Einfahrt) – für den Hinweis im Fenster
const railAtTunnel = (x, y) => bAt(x, y) === 'schiene' && DIRS.some(([dx, dy]) => tunnelAt(x + dx, y + dy));
function tunnelError(x, y, noCost) {
  if (!available('tunnel')) return `Tunnel: ${lockText('tunnel').replace('🔒 ', 'erst mit ')}`;
  if (!ownedTile(x, y) && !claimable(x, y)) return isSea(x, y) ? 'Im Meer nur direkt neben deinem Land' : notMine(x, y);
  if (tunnelAt(x, y)) return 'Hier ist schon ein Tunnel';
  const b = bAt(x, y);
  if (b === 'schiene' || b === 'station' || b === 'hbf' || b === 'pb_gleis' || b === 'pb_station' || b === 'tunneleinfahrt') return 'Unter Schienen, Bahnhöfen und Einfahrten geht kein Tunnel – Schiene und Tunnel verbindet eine Tunneleinfahrt';
  if (noCost) return null;
  const c = costOf('tunnel', x, y);
  if (state.money < c.cost) return 'Zu wenig Taler';
  if (Object.entries(c.mat || {}).some(([res, n]) => (state.res[res] || 0) < n)) return 'Zu wenig ' + RES[Object.entries(c.mat).find(([res, n]) => (state.res[res] || 0) < n)[0]].name;
  return null;
}
// Schiene vor einem Gleis des Hauptbahnhofs läuft in die Halle weiter (kein Prellbock); vor einer Tunneleinfahrt in die Einfahrt
const railArms = (x, y) => { const e = GEXIT.get(x + ',' + y);
  return DIRS.filter(([dx, dy]) => bAt(x + dx, y + dy) === 'schiene' || (isEinfahrt(x + dx, y + dy) && trackLink(x, y, x + dx, y + dy)) || (e && e[0] === dx && e[1] === dy)); };
// Bahnübergang: ein Schienenfeld mit cross (und dem Stil des Wegs), gehört zu Schienen- und Wegenetz.
// Entsteht, wenn man einen Weg über eine gerade Schiene zieht oder eine Schiene über einen Weg (nicht auf Brücken).
// foot: statt Schranken eine Fußgängerbrücke (einmal bezahlt: footPaid).
const isCrossing = t => !!t && t.b === 'schiene' && !!t.cross;
// Gleise umstellen (Block 146, wie Wege und Hecken): verbunden = Schienenfelder, die aneinanderliegen (auch Bahnübergänge, Brücken)
function railNetwork(x, y, max = 20000) {
  const k0 = x + ',' + y;
  if (bAt(x, y) !== 'schiene') return [];
  const seen = new Set([k0]), out = [[x, y]];
  for (let i = 0; i < out.length && out.length < max; i++) for (const [dx, dy] of DIRS) {
    const nx = out[i][0] + dx, ny = out[i][1] + dy, k = nx + ',' + ny;
    if (seen.has(k) || bAt(nx, ny) !== 'schiene') continue;
    seen.add(k); out.push([nx, ny]);
  }
  return out;
}
function railScope(x, y, scope) {
  if (scope === 'run') return railNetwork(x, y);
  if (scope === 'all') return [...state.tiles].filter(([, t]) => t.b === 'schiene').map(([k]) => keyXY(k));
  return bAt(x, y) === 'schiene' ? [[x, y]] : [];
}
// Gleisbett (Form) für eine Liste von Feldern – kostenlos wie bisher im Fenster; gibt zurück, wie viele sich geändert haben
function restyleRails(list, form) {
  if (!lookOk('schiene', 'form', form)) return 0;
  let n = 0;
  const now = performance.now();
  for (const [x, y] of list) {
    const t = state.tiles.get(x + ',' + y);
    if (!t || t.b !== 'schiene' || (t.form || 0) === form) continue;
    if (form) t.form = form; else delete t.form;
    t.born = now; n++;
  }
  if (n) { groundVersion++; save(); }
  return n;
}
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
// Strom ⚡: Kraftwerke liefern je nach Stufe und Standort (siteOf; Windrad je Stufe mehr; Forschung „Leichte Rotorblätter“ +50 % Wind,
// „Intelligentes Stromnetz“ +25 % auf alles). Verbraucher der Reihe nach: Laternen (je angefangene 10 eine ⚡), dann
// die Gebäude aus CONSUMERS, zuletzt die Züge (je 1 ⚡ + 1 ⚡ je km ihres Netzes). Wer leer ausgeht: Laternen bleiben
// nachts dunkel (halbe Schönheit), Gebäude schaffen die Hälfte (⚡ darüber), Züge stehen. Die Stadt braucht erst Strom,
// wenn es Kraftwerke gibt (oder Windräder freigeschaltet sind) – vorher läuft alles ohne.
const POWER_OUT = { windrad: [1, 2, 3], wasserkraft: [4, 8, 12], solarfeld: [3, 6, 9], geothermie: [8, 16, 24], wellen: [5, 10, 15], offshore: [6] };   // Stufe 1–3 (Offshore: eine)
const LAMPS_PER_POWER = 10, NO_POWER = 0.5;
// Monumente brauchen richtig viel (je 100 ⚡, das Schloss 300) – dafür baut man sich eine Energie-Insel
const CONSUMERS = { fabrik: 2, saege: 1, hafen: 2, uni: 2, glashaus: 1, glashaus_l: 3, sternwarte: 100, botgarten: 100, riesenrad: 100, seebruecke: 100, schloss: 300 };   // Reihenfolge = Vorrang
const WORKSHOP_POWER = CONSUMERS.fabrik;
function powerOf(t, k) {
  const o = POWER_OUT[t.b];
  if (!o) return 0;
  let v = o[Math.min(t.lvl || 1, o.length) - 1];
  if (k) v *= 1 + siteOf(t.b, k, t.rot, t).f;                                    // Standortbonus (Block 53)
  if ((t.b === 'windrad' || t.b === 'offshore') && hasTech('rotor')) v *= 1.5;   // Offshore bleibt doppelt so stark wie ein volles Windrad
  if (hasTech('stromnetz')) v *= 1.25;
  return v * masteryMul('strom');
}
// Standortboni (Block 53): ein guter Platz bringt bis +50 %, ein schlechter nie weniger als normal. Was den Bonus
// stört (Windschatten, Schatten), nimmt nur den Bonus weg – so wird nichts schlechter, was schon steht.
const SITE_MAX = 0.5;
const SITE_TIP = {
  windrad: 'Am Wasser oder neben Fels weht mehr Wind; Wald und hohe Häuser direkt daneben nehmen ihn weg',
  offshore: 'Je weiter draußen, desto mehr Wind (voll bei 6 Feldern vom Land)',
  geothermie: 'Je näher an der heißen Quelle, desto wärmer der Boden',
  solarfeld: 'Sandboden und freie Fläche ringsum bringen mehr Sonne; hohe Nachbarn werfen Schatten',
  wasserkraft: 'Je mehr Wasser direkt ringsum, desto mehr Strom',
  holz: 'Je mehr Wald im Umkreis von 2 Feldern, desto mehr Holz',
  stein: 'Je mehr Fels im Umkreis von 2 Feldern, desto mehr Stein',
  mine: 'Je mehr Erz im Umkreis von 2 Feldern, desto mehr Erz',
  kristallmine: 'Je mehr Kristallfels im Umkreis von 2 Feldern, desto mehr Kristall',
  obst: 'Je mehr Obsthain und Obstbäume in der Nähe, desto mehr Obst',
};
// Felder im Umkreis r um ein Rechteck (ohne das Rechteck selbst)
function ringOf(ax, ay, w, h, r) {
  const out = [];
  for (let y = ay - r; y < ay + h + r; y++) for (let x = ax - r; x < ax + w + r; x++)
    if (x < ax || x >= ax + w || y < ay || y >= ay + h) out.push([x, y]);
  return out;
}
const isRough = (x, y) => ['water', 'rock', 'erz', 'kristall'].includes(terrainAt(x, y));
// Was hoch ist und Wind oder Sonne abhält: Wald und Gebäude (nicht Deko, Wege, Felder, Kraftwerke, Sehenswürdigkeiten)
function tallAt(x, y) {
  const t = objAt(x, y);
  if (t) return t.b !== 'lm' && t.b !== 'feld' && !['deko', 'netz', 'markt', 'strom', 'land'].includes(ITEMS[t.b].cat);
  return terrainAt(x, y) === 'forest';
}
const clamp01 = v => Math.max(0, Math.min(1, v));
const pctTxt = f => Math.round(f * 100) + ' %';
// { f: Bonus 0…0.5, good: was hilft, bad: was den Bonus schmälert } für Sorte b mit Anker k
function siteOf(b, k, rot, t) {
  if (!SITE_TIP[b]) return { f: 0 };
  const [ax, ay] = keyXY(k), [w, h] = sizeOf(b, rot || 0, t);
  const count = (r, fn) => ringOf(ax, ay, w, h, r).filter(([x, y]) => fn(x, y)).length;
  const terr = (...ts) => (x, y) => ts.includes(terrainAt(x, y));
  const share = (n, full) => SITE_MAX * clamp01(n / full);
  let good = 0, bad = 0, gTxt = '', bTxt = '';
  switch (b) {
    case 'windrad': good = share(count(2, isRough), 8); bad = 0.125 * count(1, tallAt); gTxt = '🌬️ Windiger Platz'; bTxt = '🌲 Windschatten'; break;
    case 'offshore': { let d = 1; while (d < OFFSHORE_REACH && !landWithin(ax, ay, d)) d++; good = share(d - 1, OFFSHORE_REACH - 1); gTxt = '🌊 Weit draußen'; break; }
    case 'geothermie': {
      const i = ISLE_BY_ID.quelle, [lx, ly] = isleAnchor(i);
      const gap = Math.max(lx - (ax + w), ax - (lx + 3), ly - (ay + h), ay - (ly + 3), 0);
      good = share(7 - gap, 6); gTxt = '♨️ Nah an der heißen Quelle'; break;
    }
    case 'solarfeld': {
      const ring = ringOf(ax, ay, w, h, 1), feet = footprint(b, ax, ay, rot || 0);
      good = SITE_MAX / 2 * feet.filter(([x, y]) => terraLook(x, y) === 'sand' || isBeach(x, y)).length / feet.length + SITE_MAX / 2;
      bad = SITE_MAX * ring.filter(([x, y]) => tallAt(x, y)).length / ring.length * 2;
      gTxt = '☀️ Sonniger Platz'; bTxt = '🏠 Schatten'; break;
    }
    case 'wasserkraft': good = share(count(1, isWater) - 1, 5); gTxt = '💧 Viel Wasser ringsum'; break;
    case 'holz': good = share(count(2, terr('forest')), 12); gTxt = '🌲 Viel Wald ringsum'; break;
    case 'stein': good = share(count(2, terr('rock', 'erz', 'kristall')), 12); gTxt = '🪨 Viel Fels ringsum'; break;
    case 'mine': good = share(count(2, terr('erz')), 12); gTxt = '⛏️ Viel Erz ringsum'; break;
    case 'kristallmine': good = share(count(2, terr('kristall')), 12); gTxt = '💎 Viel Kristall ringsum'; break;
    case 'obst': {
      const trees = ringOf(ax, ay, w, h, 1).filter(([x, y]) => (state.decos.get(x + ',' + y) || []).some(d => d && d.b === 'baum')).length;
      good = share(count(2, terr('obst')) + trees, 12); gTxt = '🍎 Viele Obstbäume ringsum'; break;
    }
  }
  const f = Math.max(0, good - bad);
  return { f, good, bad: Math.min(bad, good), gTxt, bTxt, tip: SITE_TIP[b] };
}
// Text für Vorschau und Fenster, z. B. „🌬️ Windiger Platz +40 %“
const siteLabel = s => s.f > 0.004 ? `${s.gTxt} +${pctTxt(s.f)}` : '';
const trainNeed = tiles => 1 + Math.max(1, Math.ceil(tiles / KM));
// Strom eines Zugs: die Regionalbahn (2 Wagen) wie oben, jeder Wagen mehr oder weniger ein halbes Mal
const carNeed = (tiles, cars) => trainNeed(tiles) * cars / 2;
// Kreis im Netz: Äste (Felder mit nur einem Nachbarn) abschneiden; bleibt genau ein Ring übrig, ist das der Rundkurs
function railLoop(tiles, rails, link = null) {   // link: welche Nachbarn zusammenhängen (Schienennetz: trackLink, Block 136)
  const core = new Set(tiles), nb = k => { const [x, y] = keyXY(k); return DIRS.filter(([dx, dy]) => !link || link(x, y, x + dx, y + dy)).map(([dx, dy]) => (x + dx) + ',' + (y + dy)).filter(n => core.has(n)); };
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
  for (const k of state.tunnels || []) rails.add(k[0]);                     // Tunnel (Block 136): Teil des Netzes
  for (const [k, t] of state.tiles) {
    if (t.b === 'schiene') rails.add(k);
    else if (t.b === 'tunneleinfahrt') { const [ax, ay] = keyXY(k); for (const [fx, fy] of footprint(t.b, ax, ay, t.rot || 0)) rails.add(fx + ',' + fy); }
    else if (t.b === 'station' || t.b === 'ubahn') stations.push(k);
    else if (t.b === 'hbf') { for (const [gk, G] of GLEIS) if (G.hub === k) stations.push(gk); }
    else if (POWER_OUT[t.b]) { wind += powerOf(t, k); plants++; }
  }
  const comp = new Map(), netTiles = [];
  let nid = 0;
  for (const k of rails) {
    if (comp.has(k)) continue;
    const q = [k], list = [k];
    comp.set(k, nid);
    while (q.length) {
      const [x, y] = keyXY(q.pop());
      for (const [dx, dy] of DIRS) { const n = (x + dx) + ',' + (y + dy); if (rails.has(n) && !comp.has(n) && trackLink(x, y, x + dx, y + dy)) { comp.set(n, nid); q.push(n); list.push(n); } }
    }
    netTiles.push(list);
    nid++;
  }
  const byNet = new Map(), stationNet = new Map();
  for (const s of stations.sort()) {
    let net = null;
    if (bAt(...keyXY(s)) === 'ubahn') net = comp.has(s) ? comp.get(s) : null;   // U-Bahn: auf dem Tunnel
    else for (const [fx, fy] of stopFoot(s)) for (const [dx, dy] of DIRS) {
      const nk = (fx + dx) + ',' + (fy + dy), n = comp.get(nk);
      if (n != null && net == null && railTileAt(fx + dx, fy + dy)) net = n;    // Bahnhof oben: nur an Schienen (nicht an Tunnel, Einfahrt)
    }
    stationNet.set(s, net);
    if (net != null) { if (!byNet.has(net)) byNet.set(net, []); byNet.get(net).push(s); }
  }
  const lines = [];
  for (const [net, list] of byNet) {
    const regions = [...new Set(list.map(s => regionAt(...keyXY(s))))].sort(byRegion);          // Heimatinsel zuerst
    // Linie auf einer Insel (Block 136, Nutzer: „Bahn und U-Bahn verbinden Viertel“): fährt, bekommt aber Strom erst nach allen
    // anderen (nie schlechter für bestehende Welten) und bringt nur, wenn ihre Halte in verschiedenen Vierteln liegen
    const inner = regions.length < 2;
    if (inner && list.length < 2) continue;
    const tiles = netTiles[net].length, ring = railLoop(netTiles[net], rails, trackLink);
    // Rundkurs nur, wenn jeder Bahnhof direkt am Ring liegt
    const onRing = ring && list.every(s => { const R = new Set(ring);
      return stopFoot(s).some(([fx, fy]) => stopDirs(s).some(([dx, dy]) => R.has((fx + dx) + ',' + (fy + dy)))); });
    const loop = onRing ? ring : null, max = loop ? Math.max(1, Math.floor(tiles / KM / KM_PER_TRAIN)) : 1;
    const looks = lineLooks(list), count = Math.min(max, looks.length);
    const needs = looks.slice(0, count).map(lk => carNeed(tiles, carsOf(lk)));
    lines.push({ net, stations: list, regions, tiles, km: tiles / KM, loop, max, looks, count, need: needs[0], needs, ...(inner ? { inner: true } : {}) });
  }
  lines.sort((a, b) => (!!a.inner - !!b.inner) || (a.stations[0] < b.stations[0] ? -1 : 1));   // Linien zwischen Inseln zuerst (Strom)
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
    if (Math.max(Math.abs(dx), Math.abs(dy)) === r && isWater(rx + dx, ry + dy) && seaCross(rx + dx, ry + dy) !== 'block') return [rx + dx, ry + dy];   // nicht in einer Brückenkurve starten (Block 112)
  }
  return null;
}
// Suchkasten um Punkte, mit Rand (Umwege um Inseln herum)
const seaBox = (pts, pad) => [Math.floor(Math.min(...pts.map(p => p[0]))) - pad, Math.floor(Math.min(...pts.map(p => p[1]))) - pad,
  Math.ceil(Math.max(...pts.map(p => p[0]))) + pad, Math.ceil(Math.max(...pts.map(p => p[1]))) + pad];
// Brücken über dem Wasser (Block 107): Schienen und Wegbrücken. Schiffe fahren nur quer darunter durch – nie längs und nie
// schräg (sonst fuhren sie bei langen Brücken sichtbar „auf den Schienen“). 'x'/'y': die Brücke läuft entlang x bzw. y;
// 'block': Kurve, Kreuzung – da passt kein Schiff durch; null: keine Brücke
function seaCross(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || !(t.b === 'schiene' || isWegBridge(t)) || !isWater(x, y)) return null;
  const A = t.b === 'weg' ? bridgeArch(x, y) : null;                    // Bogenbrücke (Block 150): nur unter hohen Stellen durch
  if (A && !A.pass[A.i0]) return 'block';
  const same = (a, b) => { const n = state.tiles.get(a + ',' + b); return !!n && (t.b === 'schiene' ? n.b === 'schiene' : n.b === 'weg'); };
  const ax = same(x - 1, y) || same(x + 1, y), ay = same(x, y - 1) || same(x, y + 1);
  if (!(ax && ay)) return ay ? 'y' : 'x';
  // Nachbarn in beiden Richtungen: Kurve/Kreuzung – oder eine breite Brücke (Doppelgleis, 2 Felder breiter Weg, Block 112):
  // läuft sie in einer Richtung deutlich weiter, fahren Schiffe quer darunter durch
  const run = (dx, dy) => { let n = 1; for (const s of [1, -1]) for (let i = 1; i < 12 && same(x + dx * i * s, y + dy * i * s); i++) n++; return n; };
  const rx = run(1, 0), ry = run(0, 1);
  return rx >= ry + 2 ? 'x' : ry >= rx + 2 ? 'y' : 'block';
}
function seaStep(x, y, nx, ny) {
  const a = seaCross(x, y), b = seaCross(nx, ny), dx = nx - x, dy = ny - y;
  if (!a && !b) return !(dx && dy) || (!seaCross(x + dx, y) && !seaCross(x, y + dy));   // schräg nicht an einer Brückenecke vorbei
  if (a === 'block' || b === 'block' || (dx && dy)) return false;         // nicht schräg unter einer Brücke
  const along = d => (d === 'x' && dx) || (d === 'y' && dy);
  return !along(a) && !along(b);
}
// Brücken über dem Wasser haben sich geändert → Seewege neu (aus recalc)
let seaBridgeSig = '';
function seaBridgesCheck() {
  let sig = '';
  for (const [k, t] of state.tiles) if ((t.b === 'schiene' || isWegBridge(t)) && isWater(...keyXY(k))) sig += k + seaCross(...keyXY(k)) + ';';   // auch die Richtung (hängt an Gleisen an Land)
  if (sig !== seaBridgeSig) { if (seaBridgeSig || sig) seaCache.clear(); seaBridgeSig = sig; }
}
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
      if (!seaStep(x, y, nx, ny)) continue;                                       // Brücken nur quer (Block 107)
      prev[idx(nx, ny)] = c; q[tail++] = idx(nx, ny);
    }
  }
  return null;
}
const seaSight = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
  for (let i = 0; i <= n; i++) { const t = i / Math.max(1, n), x = Math.round(a[0] + (b[0] - a[0]) * t), y = Math.round(a[1] + (b[1] - a[1]) * t); if (!isWater(x, y) || seaCross(x, y)) return false; } return true; };   // abkürzen nie über Brücken – da bleibt der Weg quer
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
  const a = dockPoint(k), s = nearestWater(...a), open = (x, y) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!isWater(x + dx, y + dy) || seaCross(x + dx, y + dy)) return false; return true; };   // keine Brücke im Fanggebiet (Block 107)
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
    const amount = Math.max(10, niceFloor(state.res[res] * share));          // abrunden: nie mehr, als im Lager liegt
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
  for (const p of PARKS) add(attr, regionAt(...keyXY(p.tiles[0])), PARK_ATTR[p.stage]);           // Park auch
  for (const p of FZPARKS) add(attr, regionAt(...keyXY(p.tiles[0])), FZ_ATTR[p.stage]);           // Freizeitpark
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
    for (const k of [...state.decos.keys()].sort()) state.decos.get(k).forEach((d, i) => { if (d && d.b === 'laterne') lamps.push(k + ',' + i); else if (d && d.b === 'strassenlaterne') lamps.push(k + ',' + i, k + ',' + i); });   // große: zählt doppelt (Block 132)
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
  if (d.edge) return 'Linien: Anfang und Ende antippen';
  if (d.fixed && !opts.move) return 'Das lässt sich nicht bauen';                           // Rathaus, Sehenswürdigkeit, Truhe (nur verschieben)
  if (d.old) return 'Den gibt es nicht mehr – bau dir einen Park aus Parkrasen und Deko';          // Hecke, Zaun, Mauer liegen auf Kanten, nie auf Feldern
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  if (b === 'tunnel') return tunnelError(x, y, opts.noCost);
  if (b === 'ubahn' && !tunnelAt(x, y)) return 'Auf einen Tunnel setzen (Verkehr → Tunnel)';
  if ((b === 'schiene' || b === 'station' || b === 'hbf' || b === 'tunneleinfahrt') && footprint(b, x, y, r, opts.t).some(([fx, fy]) => tunnelAt(fx, fy)))
    return b === 'schiene' ? 'Über einem Tunnel keine Schiene – Schiene und Tunnel verbindet eine Tunneleinfahrt' : b === 'tunneleinfahrt' ? 'Nicht auf den Tunnel – ans Ende davon setzen' : 'Nicht über einen Tunnel – dafür gibt es die U-Bahn-Station';
  if (b === 'fz_hoch' || b === 'fz_tief') {             // Höhen-Pinsel (Block 60e): nur über Schienen
    if (!available(b) && !opts.move) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
    const t = state.tiles.get(x + ',' + y);
    if (!t || !isTrack(t.b)) return 'Über Achterbahn-Schienen ziehen';
    const now = trackLevel(x, y);
    if (b === 'fz_hoch' && now >= COASTER_MAXSTEP) return 'Höher geht es nicht';
    if (b === 'fz_tief' && now <= 0) return 'Tiefer geht es nicht';
    return null;
  }
  if (b === 'fz_looping') {                             // Looping (Block 60c): auf ein gerades Stück Achterbahn-Schiene
    if (!available(b) && !opts.move) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
    const t = state.tiles.get(x + ',' + y);
    if (!t || t.b !== 'fz_bahn') return 'Auf ein Stück Achterbahn-Schiene setzen';
    if (t.loop) return 'Hier ist schon ein Looping';
    const arms = coasterArms(x, y);
    if (arms.length !== 2 || arms[0][0] !== -arms[1][0] || arms[0][1] !== -arms[1][1]) return 'Nur auf ein gerades Stück (keine Kurve)';
    return state.money < d.cost ? 'Zu wenig Taler' : null;
  }
  if (b === 'weg' && !opts.move && decoOver(x, y)) {    // Weg unter vorhandene Deko legen bzw. dort umfärben (Block 58; nicht beim Tragen)
    if (!ownedTile(x, y)) return notMine(x, y);
    if (wegAt(x, y) === currentStyle('weg')) return 'Hier liegt schon dieser Weg';
    return state.money < d.cost ? 'Zu wenig Taler' : null;
  }
  if (TERRAFORM[b]) {                                   // Terraforming-Pinsel
    if (!ownedTile(x, y)) return notMine(x, y);
    const k = x + ',' + y, ter = terrainAt(x, y), look = terraLook(x, y);
    if (ter === 'water') return 'Nicht auf dem Wasser – erst aufschütten';
    if (b === 'parkrasen' || b === 'fzboden') {          // unter Deko und Wege darf der Rasen/Boden, nur auf Wiese
      const t = state.tiles.get(COVER.get(k) || k), fz = b === 'fzboden';
      if (t && !(fz ? fzOk(t.b) : parkOk(t.b))) return fz ? 'Hier steht ein Gebäude – auf den Freizeitpark gehören Fahrgeschäfte, Stände, Deko und Wege' : 'Hier steht ein Gebäude – auf den Parkrasen gehören nur Deko und Wege';
      if (!['grass', 'forest', 'obst'].includes(ter) && !fz) return 'Parkrasen nur auf Wiese oder im Wald – Fels erst sprengen';
      if (fz && ter !== 'grass') return 'Freizeitpark-Boden nur auf Wiese – Wald erst roden, Fels sprengen';
    } else {
      if (COVER.has(k)) return 'Hier steht etwas';
      if (decosAt(k) && !['wiese', 'strand'].includes(b)) return 'Hier stehen schon kleine Dekos';
    }
    // gespeichertes 'grass' (Rasen/Boden entfernt, Anlage verschoben) zählt wie unberührt: am Meer sieht es nach Strand aus (Block 119)
    const want = TERRAFORM[b], now = look && look !== 'grass' ? look : (ter === 'grass' && isBeach(x, y) ? 'sand' : ter);
    if (now === want || (want === 'wiese' && now === 'grass')) return `Hier ist schon ${{ wiese: 'Wiese', sand: 'Strand', forest: 'Wald', obst: 'ein Obsthain', rock: 'Fels', park: 'Parkrasen', fz: 'Freizeitpark-Boden' }[want]}`;
  } else if (b === 'graben' || b === 'schuett') {
    if (!ownedTile(x, y)) return b === 'schuett' && isSea(x, y) ? (claimable(x, y) ? null : 'Im Meer nur direkt neben deinem Land') : isSea(x, y) ? 'Hier ist schon Wasser' : 'Das ist nicht dein Grundstück';
    const ter = terrainAt(x, y);
    if (b === 'graben') {
      if (COVER.has(x + ',' + y)) return 'Hier steht etwas';
      if (decosAt(x + ',' + y)) return 'Hier stehen kleine Dekos – erst wegnehmen';
      if (ter === 'water') return 'Hier ist schon Wasser';
      if ([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].some(([vx, vy]) => postAt(vx, vy))) return 'An der Ecke steht schon etwas';
      if (ter !== 'grass' && !willClear(b, ter)) return 'Erst roden bzw. sprengen';
    } else {
      if (ter !== 'water') return 'Aufschütten geht nur auf Wasser';
      const c = COVER.get(x + ',' + y), ct = c && state.tiles.get(c);   // Block 84a: nicht unter Hausboot, Steg, Seebrücke …
      if (ct && !(ct.bridge && c === x + ',' + y)) return 'Hier steht etwas – erst wegräumen';
      for (const [dx, dy] of DIRS) {                                    // … und nicht das letzte Wasser vor Hafen, Fischer, Leuchtturm
        const a = anchorAt(x + dx, y + dy), t = a && state.tiles.get(a);
        if (!t || ITEMS[t.b].needs !== 'shore') continue;
        const wet = footprint(t.b, ...keyXY(a), t.rot || 0, t).some(([fx, fy]) => DIRS.some(([ex, ey]) => (fx + ex !== x || fy + ey !== y) && isWater(fx + ex, fy + ey)));
        if (!wet) return `Davor muss Wasser bleiben (${ITEMS[t.b].name})`;
      }
    }
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
      const rail = b === 'schiene', sea = d.needs === 'meer' || d.needs === 'boot' || d.needs === 'offshore';
      const seaOk = sea && isSea(fx, fy) && (d.needs === 'offshore' ? landWithin(fx, fy, OFFSHORE_REACH) : nearOwnLand(fx, fy));   // auch schräg am Ufer (Ecke an Ecke)
      if (b === 'weg' && isSea(fx, fy) && !ownedTile(fx, fy)) {                // Wegbrücke ins Meer (Block 66): kurz vor die Küste
        if (!claimable(fx, fy)) return 'Im Meer nur direkt neben deinem Land';
        const bx = bridgeArmsAxis(fx, fy), arm = bx < 0 ? null : bx ? [0, 1] : [1, 0];
        if (!landWithin(fx, fy, BRIDGE_SEA) && !(arm && seaGapBridgeable(fx, fy, arm)))
          return `Übers Meer höchstens ${BRIDGE_SEA} Felder vor die Küste – oder bis ${BRIDGE_MAX} Felder zu deiner nächsten Insel`;
      } else if (!ownedTile(fx, fy) && !(rail && claimable(fx, fy)) && !seaOk) return (rail || sea) && isSea(fx, fy) ? (d.needs === 'offshore' ? `Höchstens ${OFFSHORE_REACH} Felder vor deiner Küste` : 'Im Meer nur direkt neben deinem Land') : notMine(fx, fy);
      if (sea) {
        if (COVER.has(k)) return 'Hier steht schon etwas';
        if ((d.needs === 'meer' || d.needs === 'offshore') && (ter !== 'water' || !isSea(fx, fy))) return 'Ins Meer vor die Küste bauen';
        if (d.needs === 'boot' && ter !== 'water') return 'Aufs Wasser, direkt ans Ufer';
        continue;
      }
      if (terraLook(fx, fy) === 'park' && !parkOk(b)) return 'Auf den Parkrasen gehören nur Deko und Wege';
      if (terraLook(fx, fy) === 'fz' && !fzOk(b)) return 'Auf den Freizeitpark gehören Fahrgeschäfte, Stände, Deko und Wege';
      if (d.needs === 'fz' && terraLook(fx, fy) !== 'fz') return 'Fahrgeschäfte gehören auf Freizeitpark-Boden';
      if (plazaSpot(b, fx, fy)) { if (decosAt(k)) return 'Hier stehen schon kleine Dekos'; continue; }   // auf den Platz (Weg bleibt darunter)
      if (replacesWeg(b) && plainWeg(k)) {                                  // Gebäude: ersetzt den Weg
        const ds = decosAt(k);
        if (ds && (tiles.length > 1 || BIG_ON_TILE.has(b) || ds.slice(4).some(Boolean))) return 'Erst die kleine Deko vom Weg nehmen';
        const ne = needError(d, ter, opts);                                  // das Gelände unter dem Weg zählt weiter (Block 84b)
        if (ne) return ne;
        continue;
      }
      if (d.needs === 'platz') return 'Marktstände gehören auf einen Weg oder Platz';
      if (COVER.has(k)) {
        if (tiles.length === 1 && b === 'pb_station' && (state.tiles.get(k) || {}).b === 'pb_gleis' && !opts.move) continue;   // Station aufs Parkbahn-Gleis (Block 136)
        if (tiles.length === 1 && b === 'weg' && crossingAt(fx, fy) && !opts.move) return null;             // Übergang umfärben
        if (tiles.length === 1 && crossCandidate(b, fx, fy) && !opts.move) return crossError(b, fx, fy);    // wird ein Bahnübergang (verschoben: das Ziel ginge verloren)
        return tiles.length > 1 ? 'Hier ist nicht genug Platz' : 'Hier steht schon etwas';
      }
      if (ter === 'water') {
        if (rail) continue;
        if (b === 'weg') { const e = bridgeShapeError(fx, fy, true); if (e) return e; continue; }   // Wegbrücke (Block 66)
        return 'Nicht auf dem Wasser';
      }
      if ((BIG_ON_TILE.has(b) || tiles.length > 1) && decosAt(k)) return 'Hier stehen schon kleine Dekos';
      if (b !== 'weg' && b !== 'schiene' && (decosAt(k) || []).slice(4, 8).some(Boolean)) return 'Erst die kleine Deko von der Seite nehmen';   // auf Gebäudefeldern nur Ecken
      const ne = needError(d, ter, opts);
      if (ne) return ne;
    }
    if (tiles.length > 1 && b !== 'weg' && b !== 'schiene') {               // keine Linie quer durchs Gebäude (Block 84b)
      const inside = new Set(tiles.map(p => p.join()));
      for (const [fx, fy] of tiles) for (const [nx, ny] of [[fx + 1, fy], [fx, fy + 1]]) {
        const e = inside.has(nx + ',' + ny) && state.edges.get(edgeBetween(fx, fy, nx, ny));
        if (e) return `Quer durch läuft: ${ITEMS[e.b].name} – erst entfernen`;
      }
    }
    if (b === 'weg') { const e = bridgeShapeError(x, y, false); if (e) return e; }       // Weg an der Seite einer Brücke: kein Abzweig
    if (d.cat !== 'deko' && !plazaOk(b) && b !== 'weg' && b !== 'schiene' && !d.paint) {   // Eckpunkt-Deko (Block 65) an den Ecken der Grundfläche
      const [w, h] = sizeOf(b, r, opts.t);
      for (let vy = y; vy <= y + h; vy++) for (let vx = x; vx <= x + w; vx++) { const p = postAt(vx, vy); if (p) return `An der Ecke steht schon: ${ITEMS[p.b].name}`; }
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

// Rohstoff-Betriebe brauchen ihr Gelände – nach der passenden Forschung auch auf Wiesen (grass)
function needError(d, ter, opts) {
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
  return null;
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
          for (const d of ds) if (d) payBackDeco(d);
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
  const d = ITEMS[t.b], c = { money: (t.price != null ? t.price : d.baseCost || d.cost) || 0, ...(d.mat || {}) }, add = o => { for (const [r, n] of Object.entries(o || {})) c[r] = (c[r] || 0) + n; };
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
    if (ds) { for (const d of ds) if (d) payBackDeco(d); state.decos.delete(kk); }
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
      if (ds) { for (const d of ds) if (d) payBackDeco(d); state.decos.delete(kk); }
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
// Leuchtturm-Kap (Block 83): Der Leuchtturm ist 3×3. Alte (1×1) werden t.mini und wachsen, wo rundherum Platz ist – Gras,
// eigenes Land, nur Wege/Dekos im Weg (die gibt es zurück), eine Seite zum Wasser. Sonst bleiben sie klein; im Fenster
// lässt sich das später nachholen (growLighthouse).
function lighthouseSpot(k, t) {
  const [x, y] = keyXY(k), cands = [];
  for (const r of [t.rot || 0, 0, 1, 2, 3]) for (let ay = y - 2; ay <= y; ay++) for (let ax = x - 2; ax <= x; ax++) {
    let ok = true, score = 0;
    for (const [fx, fy] of footprint('leuchtturm', ax, ay, r)) {
      if (!ownedTile(fx, fy) || terrainAt(fx, fy) !== 'grass' || ['park', 'fz'].includes(terraLook(fx, fy))) { ok = false; break; }   // Parkrasen zählt als Wiese (Block 84a)
      const a = anchorAt(fx, fy), o = a && state.tiles.get(a);
      if (o && a !== k && o.b !== 'weg') { ok = false; break; }
      if (o && a !== k) score += 1;
      const ds = decosAt(fx + ',' + fy);
      if (ds && ds.some(Boolean)) score += 0.5;
    }
    for (let vy = ay; ok && vy <= ay + 3; vy++) for (let vx = ax; ok && vx <= ax + 3; vx++) if (postAt(vx, vy)) ok = false;   // Laterne/Pfosten an einer Ecke
    if (!ok) continue;
    const wet = frontTiles('leuchtturm', ax, ay, r).filter(([fx, fy]) => isWater(fx, fy)).length;
    if (wet) cands.push({ ax, ay, r, score: score - wet * 0.1 });
  }
  return cands.sort((p, q) => p.score - q.score)[0] || null;
}
function growLighthouse(k) {
  const t = state.tiles.get(k);
  if (!t || t.b !== 'leuchtturm' || !t.mini) return null;
  const c = lighthouseSpot(k, t);
  if (!c) return null;
  for (const [fx, fy] of footprint('leuchtturm', c.ax, c.ay, c.r)) {
    const kk = fx + ',' + fy, a = anchorAt(fx, fy), o = a && a !== k && state.tiles.get(a);
    if (o) { state.money += ITEMS.weg.cost; state.tiles.delete(a); }
    const ds = state.decos.get(kk);
    if (ds) { for (const d of ds) if (d) payBackDeco(d); state.decos.delete(kk); }
  }
  state.tiles.delete(k);
  const nk = c.ax + ',' + c.ay, nt = { ...t, rot: c.r };
  delete nt.mini;
  state.tiles.set(nk, nt);
  rebuildCover(); groundVersion++;
  return nk;
}
function growLighthouses() {
  if (!state.growLight) return 0;
  delete state.growLight;
  for (const t of state.tiles.values()) if (t.b === 'leuchtturm') t.mini = true;
  rebuildCover();
  let n = 0;
  for (const [k, t] of [...state.tiles]) if (t.b === 'leuchtturm' && growLighthouse(k)) n++;
  return n;
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
  if (!state.fitBig) return removed;                 // nur alte Stände (Block 84a): sonst räumte jedes Laden nach heutigen Regeln um
  delete state.fitBig;
  const refundObj = (k, t) => {
    const d = ITEMS[t.b];
    state.money += d.cost || 0;
    for (const [r, n] of Object.entries(d.mat || {})) state.res[r] += n;
    state.tiles.delete(k);
  };
  rebuildCover();
  for (const [k, t] of [...state.tiles]) {
    if (!isBig(t.b) || (t.b === 'leuchtturm' && t.mini)) continue;   // alter kleiner Leuchtturm bleibt, wo er ist (Block 83)
    const [w, h] = sizeOf(t.b, t.rot, t);
    let [x, y] = keyXY(k);
    // Steht es schon korrekt (keine Überlappung mit anderen Objekten)?
    state.tiles.delete(k); rebuildCover();
    const ok = (ax, ay) => placeError(t.b, ax, ay, t.rot || 0, { move: true, t }) === null;   // mit Gestalt (Märchenschloss)
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
        if (ds) { for (const d of ds) if (d) state.money += decoBack(d); state.decos.delete(kk); }
        if (t.b === 'lm' && terrainAt(fx, fy) !== 'grass') state.terra.set(kk, 'grass');
        rebuildCover();
      }
    }
    if (spot) {
      state.tiles.set(spot[0] + ',' + spot[1], t);
      for (const [fx, fy] of footprint(t.b, spot[0], spot[1], t.rot, t)) state.decos.delete(fx + ',' + fy);
    } else {
      removed.push(ITEMS[t.b].name);
      const back = fullValue(t);                       // bezahlter Preis samt Ausbau und Schiffen
      for (const s of t.ships || []) for (const [r, n] of Object.entries(shipModel(s).buy)) back[r] = (back[r] || 0) + n;
      for (const [r, n] of Object.entries(back)) if (r === 'money') state.money += n; else state.res[r] += n;
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
  for (const p of PARKS) if (parkDist(p, x, y) <= PARK_NEAR[p.stage]) sum += PARK_BEAUTY[p.stage];   // Park in der Nähe (je größer, desto weiter)
  for (const p of FZPARKS) if (parkDist(p, x, y) <= FZ_NEAR[p.stage]) sum += FZ_BEAUTY[p.stage];   // Freizeitpark ringsum
  return sum;
}
// Erreichbar per Weg oder Bahn (Block 26): Versorgung zählt auch, wenn sie im selben Viertel steht (über Wege oder
// Aneinandergrenzen verbunden) oder mit einer fahrenden Verbindung (Zug, Seilbahn, Fähre) erreichbar ist – beides nah an
// Stationen derselben Verbindung (im Viertel der Station oder bis WALK_REACH davon). Schönheit, Wasser, Ruhe und
// „direkt daneben“ bleiben Sache der Umgebung.
function buildAccess(net, links) {
  const add = (m, b, k) => { if (!m.has(b)) m.set(b, []); m.get(b).push(k); }, inV = new Map();
  for (const [k, t] of state.tiles) { const v = net.vOf(k); if (!v) continue; if (!inV.has(v)) inV.set(v, new Map()); add(inV.get(v), t.b, k); }
  const byLink = links.filter(l => l.regions.length > 1 || l.kind === 'seil' || (l.inner && l.traffic && l.traffic.viertel > 1)).map(l => {   // auch Linien zwischen Vierteln (Block 136)
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
  if (!got.how && w === 'park') { const how = parkReach(acc, x, y); if (how) return { ok: true, how }; }
  return { ok: !!got.how, how: got.how };
}
// Selbstgebauter Park (Block 44): bis PARK_REACH Felder vom Haus oder im selben Viertel (über Wege verbunden)
function parkReach(acc, x, y) {
  if (!PARKS.length) return null;
  const a = anchorAt(x, y), t = a && state.tiles.get(a), [ax, ay] = t ? keyXY(a) : [x, y], [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
  if (PARKS.some(p => parkDist(p, ax, ay, ax + w - 1, ay + h - 1) <= PARK_REACH)) return 'nah';
  const v = acc && acc.net.vOf(a || x + ',' + y);
  if (v && PARKS.some(p => p.tiles.some(k => acc.net.vOf(k) === v))) return 'viertel';
  return null;
}
function wishMet(w, x, y) {
  if (WISH_REACH[w]) return wishCheck(w, x, y).ok;
  switch (w) {
    case 'weg': return DIRS.some(([dx, dy]) => wegAt(x + dx, y + dy) != null || crossingAt(x + dx, y + dy));   // auch unter Marktstand/Brunnen (Regel 60)
    case 'deko': {
      if (state.decos.has(x + ',' + y)) return true;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (state.decos.has((x + dx) + ',' + (y + dy))) return true;
      if (state.edges.size) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {   // Hecke, Zaun, Mauer an einem Feld ringsum (Block 67)
        const tx = x + dx, ty = y + dy;
        if (DIRS.some(([ex, ey]) => state.edges.has(edgeBetween(tx, ty, tx + ex, ty + ey)))) return true;
      }
      return objWithin(x, y, 2, b => ITEMS[b].cat === 'deko' && b !== 'weg');
    }
    case 'ruhe': return !objWithin(x, y, 1, b => NOISY.has(b));
    case 'schoen': return beautyAround(x, y, 3) >= 30;
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
      const popMul = Object.entries(T.wonders || {}).reduce((m, [w, f]) => m + (WONDERS[w].effect.popMul || 0) * f, 0);   // Seebrücke
      const lost = Math.round(popOf(t) * (1 + popMul) * masteryMul('einwohner'));   // wie im Spiel gezählt (Block 84b)
      if (T.pop - lost < T.jobs) return { err: 'Hier wohnen Leute, die bei dir arbeiten. Erst Betriebe abreißen.' };
    }
    // Deko und Wege gibt es voll zurück (Umgestalten soll nichts kosten), Gebäude zur Hälfte – auch die Ausbau-Taler
    const full = d.cat === 'deko' || d.cat === 'markt' || t.b === 'weg' || t.b === 'schiene';
    const paid = t.b === 'schiene' && t.bridge ? BRIDGE : isWegBridge(t) ? WEG_BRIDGE[bridgeKind(t)] : { cost: t.price != null ? t.price : d.baseCost || d.cost, mat: d.mat };   // Preis nach Einkommen: was bezahlt wurde (alte Stände: Grundpreis)
    if (isCrossing(t)) {                             // Übergang: Schiene und Weg (und die Fußgängerbrücke) zurück
      const { money: fm, ...fmat } = footPaidOf(t) ? FOOT_STYLES[footPaidOf(t)].cost : { money: 0 }, mat = { ...d.mat };
      for (const [r, n] of Object.entries(fmat)) mat[r] = (mat[r] || 0) + n;
      return { anchor: a, refund: d.cost + ITEMS.weg.cost + fm, mat, label: 'Bahnübergang entfernen' };
    }
    const staged = t.b === 'haus' ? HOUSE_STAGES.slice(1, t.lvl).reduce((s, st) => s + (houseCost(st).money || 0), 0)   // Hausausbau (Block 84b)
      : BUILD_STAGES[t.b] ? BUILD_STAGES[t.b].up.slice(0, t.lvl - 1).reduce((s, u) => s + (u.cost.money || 0), 0)
      : WONDERS[t.b] ? wonderPaid(t).money : t.b === 'hbf' ? (gleisePaid(t) - HBF_MIN) * GLEIS_COST.money   // bezahlte Gleise (Block 137)
      : t.b === 'station' && stationLenPaid(t) === 3 ? STATION_LEN_COST.money : 0;
    const price = (t.price != null ? t.price : d.baseCost || d.cost) + (t.loopPrice || 0), half = full ? paid.cost : Math.floor((price + staged) / 2);
    const ships = { money: 0 }, mat = full ? { ...(paid.mat || {}) } : {};              // Schiffe des Hafens: voll zurück wie beim Verkaufen
    for (const s of t.ships || []) for (const [r, n] of Object.entries(shipModel(s).buy)) if (r === 'money') ships.money += n; else mat[r] = (mat[r] || 0) + n;
    return { anchor: a, refund: half + ships.money, mat: Object.keys(mat).length ? mat : null, lost: full ? 0 : price + staged - half, full, label: `${t.bridge ? 'Brücke' : d.name} ${full ? 'entfernen' : 'abreißen'}` };
  }
  if (tunnelAt(x, y)) { const c = costOf('tunnel', x, y); return { tunnel: x + ',' + y, refund: c.cost, mat: c.mat, full: true, label: 'Tunnel entfernen' }; }   // Block 136: voll zurück wie Schienen
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
  state.tiles.set(k, { b, lvl: 1, rot, ...(old && plazaSpot(b, x, y) ? { weg: wegUnder(old) } : {}) });   // (übrige Wegfelder bleiben für die Vorschau liegen)
  const t = totals();
  if (old) state.tiles.set(k, old); else state.tiles.delete(k);
  rebuildCover(); computeMarkets(); computeParks(); computeCoasters(); computeParkRails(); computeTorPairs(); computeFz();   // Marktplätze und Parks wieder wie wirklich gebaut
  const st = t.st.get(k) || {};
  previewCache = { k, b, rot, inc: t.inc - T.inc, beauty: t.beauty - T.beauty, sci: t.sci - T.sci, prod: st.prod, conv: st.conv,
                   pop: t.pop - T.pop, how: t.st.get(k)?.how, bonus: t.st.get(k)?.bonus || 0,
                   site: siteOf(b, k, rot), pow: POWER_OUT[b] ? powerOf({ b, lvl: 1, rot }, k) : 0 };
  return previewCache;
}
