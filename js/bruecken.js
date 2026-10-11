'use strict';
// ---------------------------------------------------------------------------
// Brücke als eigenes Bauwerk (Block 160, Nutzer 11.10.2026: „das ist immer dieselbe Brücke, man baut sie halt da hin, wo man will, und dann
// kann man über diese Brücke einen Weg oder Schienen ziehen“). Schritt 1: zwischen zwei Anhöhen, Holzsteg und Stahlbrücke (Steinbogen
// verworfen: „sieht omega scheiße aus“); darunter nur Flaches (Weg, Schiene, Wasser, Gelände, niedrige Deko).
// state.bruecken: Anker = erstes Feld der Lücke (kleinste Koordinate längs) → { ax: 0 längs x | 1 längs y, n: Felder der Lücke (1–BK_MAX),
// art: 'holz' | 'stahl', weg?: [Wegstil | null je Feld], gleis?: [Gleis-Form | null je Feld] } – Weg ODER Gleis (160b; Form 0 = Schotter, also != null prüfen). Das Deck liegt auf Höhe der Anhöhen (HILL_H) über den Feldern der Lücke; was darunter
// liegt, bleibt in state.tiles. Die beiden Anhöhen an den Enden tragen sie: Abtragen, Treppe oder Rampe hinein erst nach dem Abriss.
// Gezeichnet je Feld in tileB (render.js) nach dem Bewegten darunter, wie die Überdachung; Schatten im Boden-Bild.
// ---------------------------------------------------------------------------
const BK_ARTEN = {
  holz: { name: 'Holzsteg', cost: 60, mat: { bretter: 3 }, frei: 2 },             // länger als 2 Felder: Holzböcke am ersten und letzten Feld
  stahl: { name: 'Stahlbrücke', cost: 120, mat: { metall: 3 }, frei: 4, tech: 'bahn' },   // spannt frei, erst mit der Eisenbahn
};
const BK_ART_IDS = ['holz', 'stahl'];                                    // = DECO_LOOKS.bruecke.forms
const BK_MAX = 4, BK_W = 0.4, BK_CLEAR = HILL_H - 6;                    // längste Lücke, halbe Breite des Decks, Platz darunter (Deko-Höhe)
const BK_NO_PAINT = new Set(['wald', 'obstwald', 'fels', 'anhoehe']);   // Gelände, das darunter nicht passt (Bäume, Felsen, Anhöhe)
const bkArtOf = b => BK_ARTEN[b && b.art] ? b.art : 'holz';
const bkArtNew = () => BK_ART_IDS[decoLookNew('bruecke').form || 0] || 'holz';
const bkCost = (art, n) => { const A = BK_ARTEN[art]; return { cost: A.cost * n, mat: Object.fromEntries(Object.entries(A.mat).map(([r, v]) => [r, v * n])) }; };
// Holzbock auf Feld i der Lücke (nur Holz, länger als frei spannt): dort darf unten kein Weg und keine Schiene durch. Trägt der Holzsteg ein Gleis
// (160b, Nutzer: „Holz bekommt engere Böcke, wie ein Eisenbahn-Holzviadukt“): ab 2 Feldern unter jedem Feld ein Bock
const bkBock = (art, n, i, rail = false) => art === 'holz' && (rail ? n >= 2 : n > BK_ARTEN.holz.frei && (i === 0 || i === n - 1));
const bkRailAny = b => !!b && !!b.gleis && b.gleis.some(f => f != null);
const bkWegAny = b => !!b && !!b.weg && b.weg.some(Boolean);
const bkBockOf = (b, i) => bkBock(bkArtOf(b), b.n, i, bkRailAny(b));

// Nachschlagen: Feld der Lücke → { k, b, i, x0, y0, dx, dy }; Anhöhen-Feld am Ende → [{ k, b, side, … }] (gemerkt je Boden-Fassung)
let bkCache = { v: -1, st: null, size: -1, cell: new Map(), end: new Map() };
const bkOn = () => !!state.bruecken && state.bruecken.size > 0;
function bkFresh() {
  const s = state.bruecken;
  if (bkCache.v === groundVersion && bkCache.st === state && bkCache.size === s.size) return bkCache;
  const cell = new Map(), end = new Map();
  for (const [k, b] of s) {
    const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0, o = { k, b, x0, y0, dx, dy };
    for (let i = 0; i < b.n; i++) cell.set((x0 + dx * i) + ',' + (y0 + dy * i), { ...o, i });
    for (const [ek, side] of [[(x0 - dx) + ',' + (y0 - dy), -1], [(x0 + dx * b.n) + ',' + (y0 + dy * b.n), 1]]) { if (!end.has(ek)) end.set(ek, []); end.get(ek).push({ ...o, side }); }
  }
  return (bkCache = { v: groundVersion, st: state, size: s.size, cell, end });
}
const bkAt = (x, y) => bkOn() ? bkFresh().cell.get(x + ',' + y) || null : null;
const bkOnHill = (x, y) => bkOn() ? bkFresh().end.get(x + ',' + y) || null : null;   // Anhöhen-Feld, auf dem eine Brücke aufliegt
const bkEndsOf = (k, b) => { const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0; return [[x0 - dx, y0 - dy], [x0 + dx * b.n, y0 + dy * b.n]]; };
const bkCellsOf = (k, b) => { const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0; return Array.from({ length: b.n }, (_, i) => [x0 + dx * i, y0 + dy * i]); };
const BK_ON_HILL = 'Hier liegt eine Brücke auf – erst die Brücke abreißen';
const BK_UNDER_ONLY = 'Unter der Brücke ist nur Platz für Flaches – Wege, Schienen, Gelände und niedrige Deko';

// Was unter dem Deck auf Feld (x, y) liegt: passt es? (Brücke bauen, Art wechseln)
function bkUnderError(x, y, bock) {
  if (state.roofs && roofAt(x, y)) return 'Unter einer Brücke geht keine Überdachung – erst das Dach abreißen';
  const tr = terrainAt(x, y);
  if (tr === 'forest' || tr === 'obst') return 'Unter der Brücke erst roden (👆 aufs Feld)';
  if (tr === 'rock' || tr === 'erz' || tr === 'kristall') return `Unter der Brücke ist kein Platz für: ${TERRAIN_NAMES[tr]}`;
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (t) {
    if (t.b !== 'weg' && t.b !== 'schiene') return `Unter der Brücke ist kein Platz für: ${ITEMS[t.b].name}`;
    if (t.bridge) return 'Unter der Brücke geht keine Wasserbrücke';
    if (isCrossing(t) && t.foot) return 'Unter der Brücke ist kein Platz für die Fußgängerbrücke';
    if (bock) return `Hier kommt ein Holzbock hin – erst ${t.b === 'weg' ? 'den Weg' : 'die Schiene'} wegnehmen oder Stahl wählen`;
  }
  const ds = decosAt(x + ',' + y) || [];
  for (const d of ds) if (d && decoHeight(d.b, d.form) > BK_CLEAR) return `${ITEMS[d.b] ? ITEMS[d.b].name : 'Das'} ist zu hoch für unter die Brücke`;
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) { const p = postAt(vx, vy); if (p && decoHeight(p.b, p.form) > BK_CLEAR) return `${ITEMS[p.b] ? ITEMS[p.b].name : 'Das'} ist zu hoch für unter die Brücke`; }
  return null;
}
// Etwas unter einer Brücke bauen (placeError): nur Weg, Schiene, Tunnel und flaches Gelände; am Holzbock kein Weg, keine Schiene
function bkPlaceError(b, fp, t = null) {                                   // t: getragenes/kopiertes Ding (✋, ⧉)
  if (!bkOn()) return null;
  for (const [x, y] of fp) {
    const c = bkAt(x, y);
    if (!c) continue;
    const d = ITEMS[b];
    if (d.small) continue;                                                 // kleine Deko: nach Höhe (bkTooTall, smallError)
    if ((b === 'weg' || b === 'schiene') && ((t && t.bridge) || terrainAt(x, y) === 'water')) return 'Unter der Brücke geht keine Wasserbrücke';   // wie bkUnderError
    if (t && isCrossing(t) && t.foot) return 'Unter der Brücke ist kein Platz für die Fußgängerbrücke';
    const flat = b === 'weg' || b === 'schiene' || b === 'tunnel' || (d.paint && !BK_NO_PAINT.has(b) && d.cat !== 'fz') || b === 'graben' || b === 'schuett';   // Achterbahn: fährt hoch hinaus (160b-Prüfung)
    if (BK_NO_PAINT.has(b)) return b === 'anhoehe' ? 'Unter einer Brücke geht keine Anhöhe' : 'Unter der Brücke wächst kein Wald und liegt kein Fels';
    if (!flat) return BK_UNDER_ONLY;
    if ((b === 'weg' || b === 'schiene') && bkBockOf(c.b, c.i)) return 'Hier steht ein Holzbock der Brücke';
  }
  return null;
}
// Kleine Deko unter dem Deck: nur, was darunter passt (wie unter der Überdachung, smallError)
function bkTooTall(b, x, y, slot, form = 0) {
  if (!bkOn()) return null;
  const h = decoHeight(b, form);
  if (h <= BK_CLEAR) return null;
  const tiles = slot === VSLOT ? [[x, y], [x - 1, y], [x, y - 1], [x - 1, y - 1]] : [[x, y]];
  return tiles.some(([fx, fy]) => bkAt(fx, fy)) ? `${ITEMS[b] ? ITEMS[b].name : 'Das'} ist zu hoch für unter die Brücke` : null;
}

// Spannweite aus einer gezogenen Linie: von einer Anhöhe (Ebene 1) über die tiefere Lücke zur nächsten Anhöhe derselben Höhe. Felder davor
// und dahinter (oben auf den Anhöhen) zählen nicht – man darf großzügig ziehen
function bkSpanOf(a, b) {
  if (a.x !== b.x && a.y !== b.y) return { err: 'Nur gerade – von einer Anhöhe hinüber zur anderen' };
  const v = lineTiles(a, b), lv = v.map(([x, y]) => hillLevel(x, y));
  let i0 = -1;
  for (let i = 1; i < v.length; i++) if (lv[i - 1] >= 1 && lv[i] < lv[i - 1]) { i0 = i; break; }
  if (i0 < 0) return { err: 'Von der Oberkante einer Anhöhe hinüber zur anderen ziehen' };
  let i1 = i0;
  while (i1 < v.length && lv[i1] < lv[i0 - 1]) i1++;
  if (i1 >= v.length) return { err: 'Bis auf die Anhöhe gegenüber ziehen' };
  if (lv[i1] !== lv[i0 - 1]) return { err: 'Beide Anhöhen müssen gleich hoch sein' };
  if (lv[i0 - 1] !== 1) return { err: 'Brücken gehen bisher nur zwischen Anhöhen der ersten Ebene' };
  const gap = v.slice(i0, i1), ax = gap.length > 1 ? (gap[0][1] === gap[1][1] ? 0 : 1) : (v[i0 - 1][1] === v[i0][1] ? 0 : 1);
  const [x0, y0] = gap.reduce((m, p) => (p[0] + p[1] < m[0] + m[1] ? p : m));
  return { x0, y0, ax, n: gap.length, gap, ends: [v[i0 - 1], v[i1]] };
}
// Darf hier eine Brücke dieser Art hin?
function bkError(sp, art, noCost) {
  if (sp.err) return sp.err;
  if (!available('bruecke')) return `Brücke: ${lockText('bruecke').replace('🔒 ', 'erst mit ')}`;
  const A = BK_ARTEN[art];
  if (A.tech && !state.techs.has(A.tech)) return `${A.name}: erst mit der Eisenbahn`;
  for (const [ex, ey] of sp.ends) if (!ownedTile(ex, ey)) return notMine(ex, ey);
  if (sp.n > BK_MAX) return `Höchstens ${BK_MAX} Felder Lücke – sonst braucht die Brücke Pfeiler`;
  for (let i = 0; i < sp.gap.length; i++) {
    const [x, y] = sp.gap[i];
    if (!ownedTile(x, y)) return notMine(x, y);
    if (bkAt(x, y)) return 'Hier ist schon eine Brücke – die Art wechselst du im Fenster (👆)';
    const e = bkUnderError(x, y, bkBock(art, sp.n, i));
    if (e) return e;
  }
  if (noCost) return null;
  const c = bkCost(art, sp.n);
  if (state.money < c.cost) return 'Zu wenig Taler';
  return matError(c.mat);
}
// Planen (plan.js planScan): die ganze Brücke auf einmal – die Felder der Lücke grün oder rot, der Rest hell
function scanBruecke(p) {
  const states = new Map(), order = [], art = bkArtNew(), sp = bkSpanOf(p.a, p.b);
  for (const [x, y] of planTiles(p)) states.set(x + ',' + y, 'same');
  const err = bkError(sp, art, true);
  if (sp.gap) for (const [x, y] of sp.gap) states.set(x + ',' + y, err ? 'bad' : 'ok');
  if (err) return { states, order, n: 0, cost: 0, gain: 0, mat: {}, bad: sp.gap ? sp.gap.length : 0, firstErr: err };
  const c = bkCost(art, sp.n);
  order.push([sp.x0, sp.y0, () => bkBuild(sp, art)]);
  return { states, order, n: sp.n, cost: c.cost, gain: 0, mat: c.mat, bad: 0, firstErr: null, art };
}
function bkBuild(sp, art) {
  const err = bkError(sp, art);
  if (err) { fail(err); return false; }
  const c = bkCost(art, sp.n);
  state.money -= c.cost; payMat(c.mat);
  state.bruecken.set(sp.x0 + ',' + sp.y0, { ax: sp.ax, n: sp.n, art });
  groundVersion++; sfx('road'); recalc(); save();
  return true;
}
// Abreißen: erst der Weg bzw. das Gleis auf dem Deck (wie oben auf der Anhöhe: erst, was oben steht), dann die Brücke – voll zurück
const bkRailCount = b => (b.gleis || []).filter(f => f != null).length;
function bkDemolishInfo(x, y) {
  const c = bkAt(x, y);
  if (!c) return null;
  const nw = (c.b.weg || []).filter(Boolean).length, ng = bkRailCount(c.b);
  if (nw) return { k: c.k, weg: true, refund: nw * ITEMS.weg.cost, label: 'Weg auf der Brücke entfernen' };
  if (ng) return { k: c.k, gleis: true, refund: ng * ITEMS.schiene.cost, mat: Object.fromEntries(Object.entries(ITEMS.schiene.mat || {}).map(([r, v]) => [r, v * ng])), label: 'Gleis auf der Brücke entfernen' };
  const bc = bkCost(bkArtOf(c.b), c.b.n);
  return { k: c.k, refund: bc.cost, mat: bc.mat, label: `${BK_ARTEN[bkArtOf(c.b)].name} abreißen` };
}
function bkDemolishAt(x, y, all = false) {                                // all: Weg/Gleis und Brücke zusammen (Fenster „Abreißen“)
  const c = bkAt(x, y);
  if (!c) return false;
  const b = c.b, nw = (b.weg || []).filter(Boolean).length, ng = bkRailCount(b);
  let back = 0;
  if (nw) { back += nw * ITEMS.weg.cost; delete b.weg; }
  if (ng) { back += ng * ITEMS.schiene.cost; for (const [r, n] of Object.entries(ITEMS.schiene.mat || {})) state.res[r] += n * ng; delete b.gleis; }
  if ((!nw && !ng) || all) {
    const bc = bkCost(bkArtOf(b), b.n);
    back += bc.cost;
    for (const [r, n] of Object.entries(bc.mat)) state.res[r] += n;
    state.bruecken.delete(c.k);
  }
  state.money += back;
  addFloat(x, y, '+' + fmt(back), '#3f8f43');
  groundVersion++; sfx('dig'); recalc(); save();
  return true;
}
// Art wechseln (Fenster): alte voll zurück, neue bezahlt; Holz mit Böcken braucht unten an den Böcken Platz
function bkSetArt(k, art) {
  const b = state.bruecken.get(k);
  if (!b || bkArtOf(b) === art) return false;
  const A = BK_ARTEN[art];
  if (A.tech && !state.techs.has(A.tech)) { fail(`${A.name}: erst mit der Eisenbahn`); return false; }
  const cells = bkCellsOf(k, b);
  for (let i = 0; i < cells.length; i++) { const t = objAt(...cells[i]); if (t && bkBock(art, b.n, i, bkRailAny(b))) { fail(`Hier käme ein Holzbock hin – erst ${t.b === 'weg' ? 'den Weg' : 'die Schiene'} darunter wegnehmen`); return false; } }
  const old = bkCost(bkArtOf(b), b.n), nu = bkCost(art, b.n);
  if (state.money + old.cost < nu.cost) { fail('Zu wenig Taler'); return false; }
  for (const [r, n] of Object.entries(nu.mat)) if ((state.res[r] || 0) + (old.mat[r] || 0) < n) { fail(`Zu wenig ${RES[r].name}`); return false; }
  state.money += old.cost - nu.cost;
  for (const [r, n] of Object.entries(old.mat)) state.res[r] += n;
  payMat(nu.mat);
  b.art = art;
  groundVersion++; sfx('road'); save();
  return true;
}

// Weg auf dem Deck (Block 160): eine Weg-Linie, die von der Anhöhe am Brückenende (oder auf dem Deck angefangen) längs über die Brücke läuft,
// legt ihre Felder dort aufs Deck – sonst bleibt alles am Boden darunter (Nutzer: „was ist, wenn ich unten einen Weg bauen will?“)
function bkPlanDeck(p) {
  if (!bkOn()) return null;
  const [x0, y0, x1, y1] = planBox(p);
  if (p.kind !== 'line' && x0 !== x1 && y0 !== y1) return null;          // breite Fläche: immer unten
  const v = lineTiles(p.a, p.b), out = new Set();
  let oben = false;
  v.forEach(([x, y], i) => {
    const c = bkAt(x, y), prev = v[i - 1];
    if (!c) { oben = hillLevel(x, y) >= 1; return; }
    if (!prev) oben = !!p.deck;
    else {
      const along = c.dx ? prev[1] === y : prev[0] === x, pc = bkAt(...prev), ph = bkOnHill(...prev);
      oben = along && oben && (pc ? pc.k === c.k : !!ph && ph.some(e => e.k === c.k));
    }
    if (oben) out.add(x + ',' + y);
  });
  return out.size ? out : null;
}
const BK_NO_STONES = 'Trittsteine gehen nicht über eine Brücke – einen anderen Belag wählen';
function bkWegCheck(x, y) {
  const c = bkAt(x, y), st = currentStyle('weg');
  if (pathLook(styleDef('weg', st).id).stones) return { err: BK_NO_STONES };
  if (bkRailAny(c.b)) return { err: 'Auf dieser Brücke liegt ein Gleis – Weg oder Gleis, nicht beides' };
  if (c.b.weg && c.b.weg[c.i] === st) return { same: true };
  return { cost: ITEMS.weg.cost, mat: {} };
}
function bkLayWeg(x, y) {
  const c = bkAt(x, y), st = currentStyle('weg');
  if (!c || (c.b.weg && c.b.weg[c.i] === st)) return false;
  if (pathLook(styleDef('weg', st).id).stones) { fail(BK_NO_STONES); return false; }
  if (bkRailAny(c.b)) { fail('Auf dieser Brücke liegt ein Gleis – Weg oder Gleis, nicht beides'); return false; }
  if (state.money < ITEMS.weg.cost) { fail('Zu wenig Taler'); return false; }
  state.money -= ITEMS.weg.cost;
  if (!c.b.weg) c.b.weg = Array(c.b.n).fill(null);
  c.b.weg[c.i] = st;
  groundVersion++;
  return true;
}
const bkWegAt = c => !!c && !!c.b.weg && !!c.b.weg[c.i];
// Verbindung über die Brücke (Netz, Gegenden): nur mit durchgehendem Weg auf dem Deck
const bkWegFull = b => !!b.weg && b.weg.length === b.n && b.weg.every(Boolean);
const bkLinks = () => bkOn() ? [...state.bruecken].filter(([, b]) => bkWegFull(b)).map(([k, b]) => bkEndsOf(k, b)) : [];
function bkHillLinks(x, y) {                                               // Anhöhen-Feld → Felder am anderen Ende seiner Brücken mit Weg
  const out = [];
  for (const e of bkOnHill(x, y) || []) if (bkWegFull(e.b)) out.push(bkEndsOf(e.k, e.b)[e.side < 0 ? 1 : 0]);
  return out;
}
// Wegarm vom Anhöhen-Feld (x, y) über die Kante aufs Deck (pathArmsHill): nur am Brückenende, längs, und wenn dort Weg liegt
function bkArmFrom(x, y, dx, dy) {
  const c = bkAt(x + dx, y + dy);
  if (!c || c.dx !== Math.abs(dx) || c.dy !== Math.abs(dy)) return false;
  return c.i === (dx + dy > 0 ? 0 : c.b.n - 1) && bkWegAt(c);
}

// Gleis auf dem Deck (160b): eine Linie Schiene längs über die Brücke legt sie aufs Deck (bkPlanDeck wie beim Weg). Netz: ist das Deck durchgehend
// belegt und liegt an beiden Enden oben eine Schiene, hängen die beiden Endfelder direkt zusammen (bkRailJumps: computeRail, railPath, railLoop) –
// die Zugstrecke läuft gerade von Endfeld zu Endfeld, ihr langes Stück ist das Deck (railPolyline route.deck). Keine eigenen Feldschlüssel:
// darunter darf weiter ein Gleis oder ein Tunnel liegen
const bkRailAt = c => !!c && !!c.b.gleis && c.b.gleis[c.i] != null;
const bkRailFull = b => !!b.gleis && b.gleis.length === b.n && b.gleis.every(f => f != null);
const bkRailTiles = () => (bkOn() ? [...state.bruecken.values()].reduce((s, b) => s + bkRailCount(b), 0) : 0);   // Gleisfelder auf Brücken (Erfolg „Eisenbahn“)
function bkRailArmFrom(x, y, dx, dy) {                                    // Gleisarm vom Anhöhen-Feld über die Kante aufs Deck (railArmsHill)
  const c = bkAt(x + dx, y + dy);
  if (!c || c.dx !== Math.abs(dx) || c.dy !== Math.abs(dy) || hillLevel(x, y) < 1) return false;
  return c.i === (dx + dy > 0 ? 0 : c.b.n - 1) && bkRailAt(c);
}
function bkRailArms(c) {                                                   // Arme eines Deckfelds: längs zum Nachbarn mit Gleis bzw. zur Schiene oben am Ende
  const out = [];
  for (const sg of [-1, 1]) {
    const j = c.i + sg, nx = c.x0 + c.dx * j, ny = c.y0 + c.dy * j;
    if (j >= 0 && j < c.b.n ? c.b.gleis[j] != null : railTileAt(nx, ny) && hillLevel(nx, ny) >= 1) out.push([c.dx * sg, c.dy * sg]);
  }
  return out;
}
function bkRailJumps(x, y) {                                               // Schiene oben am Brückenende → Schienenfeld am anderen Ende (Gleis durchgehend)
  const out = [];
  for (const e of bkOnHill(x, y) || []) {
    if (!bkRailFull(e.b)) continue;
    const o = bkEndsOf(e.k, e.b)[e.side < 0 ? 1 : 0];
    if (railTileAt(x, y) && railTileAt(o[0], o[1])) out.push(o);
  }
  return out;
}
const BK_BOTH = 'Auf dieser Brücke liegt ein Weg – Weg oder Gleis, nicht beides';
function bkRailCheck(x, y) {
  const c = bkAt(x, y), f = decoLookNew('schiene').form || 0;
  if (!available('schiene')) return { err: `Schiene: ${lockText('schiene').replace('🔒 ', 'erst mit ')}` };
  if (bkWegAny(c.b)) return { err: BK_BOTH };
  if (bkRailAt(c)) return c.b.gleis[c.i] === f ? { same: true } : { cost: 0, mat: {} };   // Gleis-Stil umstellen: kostenlos (wie am Boden)
  if (bkArtOf(c.b) === 'holz' && c.b.n >= 2) for (const [cx, cy] of bkCellsOf(c.k, c.b)) {   // Holzviadukt: unter jedem Feld ein Bock
    const t = objAt(cx, cy);
    if (t && (t.b === 'weg' || t.b === 'schiene')) return { err: `Für ein Gleis braucht der Holzsteg unter jedem Feld einen Bock – erst ${t.b === 'weg' ? 'den Weg' : 'die Schiene'} darunter wegnehmen oder Stahl wählen` };
  }
  return { cost: ITEMS.schiene.cost, mat: { ...(ITEMS.schiene.mat || {}) } };
}
function bkLayRail(x, y) {
  const c = bkAt(x, y), f = decoLookNew('schiene').form || 0, chk = c && bkRailCheck(x, y);
  if (!chk || chk.same) return false;
  if (chk.err) { fail(chk.err); return false; }
  if (state.money < chk.cost) { fail('Zu wenig Taler'); return false; }
  const me = matError(chk.mat); if (me) { fail(me); return false; }
  state.money -= chk.cost; payMat(chk.mat);
  if (!c.b.gleis) c.b.gleis = Array(c.b.n).fill(null);
  c.b.gleis[c.i] = f;
  groundVersion++;
  return true;
}
// Strecke (railPolyline route.deck: [d0, d1] über dem Deck, von Kante zu Kante der Lücke): reicht ein Wagen um Strecke d (± half) übers Deck?
function bkDeckAt(route, d, half = 0) {
  if (!route || !route.deck) return false;
  const ds = route.loop ? [((d % route.len) + route.len) % route.len] : [d];
  if (route.loop) ds.push(ds[0] - route.len, ds[0] + route.len);
  return route.deck.some(([a, b]) => ds.some(e => e + half > a && e - half < b));
}
// Wagen über einer Brücke (render.js): in Stücke je Feld längs der Brücke (car.cut, wie am Tunnelportal). Das Stück über einem Deckfeld malt
// das Deck nach seiner Oberseite und vor dem vorderen Geländer (onDeck), das Stück auf einer Anhöhe ihr Feld (angehoben) – so liegt jedes
// Geländer vor dem Wagen und keine Anhöhe malt über ihn. → [{ k: Feld, deck, m: Stück }] oder null (doch nicht über einer Brücke)
const bkCarHill = base => ({ up: true, base, ha: HILL_H, hb: HILL_H, occ: [], ramp: null });   // oben auf Höhe der Anhöhen, waagerecht
function bkCarPieces(m) {
  const la = m.len / 2;
  let c = bkAt(Math.round(m.px), Math.round(m.py));
  for (const sg of [-1, 1]) if (!c) c = bkAt(Math.round(m.px + m.du * la * sg), Math.round(m.py + m.dv * la * sg));   // auch ein Ende knapp über der Kante
  if (!c) return null;
  const ca = c.b.ax ? m.dv : m.du, wc = c.b.ax ? m.py : m.px, cuts = [-la, la];
  if (Math.abs(ca) > 0.3) for (let h = Math.floor(wc - la) + 0.5; h < wc + la + 1; h++) { const a = (h - wc) / ca; if (a > -la + 1e-3 && a < la - 1e-3) cuts.push(a); }   // Feldkanten längs der Brücke
  cuts.sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i], hi = cuts[i + 1], am = (lo + hi) / 2;
    if (hi - lo < 0.01) continue;
    const x = Math.round(m.px + m.du * am), y = Math.round(m.py + m.dv * am), dk = !!bkAt(x, y);
    out.push({ k: x + ',' + y, deck: dk, m: { ...m, cut: cuts.length === 2 ? null : [lo, hi], portal: null, hill: bkCarHill(dk ? 0 : hillLift(x, y)) } });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Zeichnen
// ---------------------------------------------------------------------------
const BK_LOOK = {
  holz: { deck: '#c99a68', beam: '#8a5f38', rail: '#a9774a', dark: '#6d4a2c', line: 'rgba(90,60,30,0.5)' },
  stahl: { deck: '#cfd3cf', beam: '#5d7d7a', rail: '#7fa09c', dark: '#3e5452', line: 'rgba(80,90,90,0.25)' },
};
// Ein Stück Brücke zeichnen: P(t, s, h) bildet längs t (Felder ab der Mitte des ersten Lückenfelds), quer s und Höhe h auf den Schirm ab;
// gezeichnet wird nur t in [t0, t1] (ein Feld), damit Dinge davor und dahinter richtig darüber bzw. darunter liegen
function bkPaint(P, z, art, n, t0, t1, weg, opts = {}) {
  const L = BK_LOOK[art], H = opts.h != null ? opts.h : HILL_H, A = -0.5, B = n - 0.5, W = BK_W, lw = f => Math.max(0.6, f * z);
  const T1 = t1 + (opts.ext || 0);                                         // Flächen etwas ins nächste Feld (das deckt es zu): keine Fuge (Windows)
  const clip = (ta, tb) => [Math.max(ta, t0), Math.min(tb, T1)];
  const quad = (ta, tb, s0, s1, h0, h1, col) => { const [a, b] = clip(ta, tb); if (b <= a) return; poly([P(a, s0, h0), P(b, s1, h0), P(b, s1, h1), P(a, s0, h1)], C(col)); };
  const top = (ta, tb, h, col) => { const [a, b] = clip(ta, tb); if (b <= a) return; poly([P(a, -W, h), P(b, -W, h), P(b, W, h), P(a, W, h)], C(col)); };
  const seg = (ta, sa, ha, tb, sb, hb, col, w) => {                     // Strich, längs auf [t0, t1] beschnitten
    let p = 0, q = 1;
    if (tb !== ta) { const u0 = (t0 - ta) / (tb - ta), u1 = (t1 - ta) / (tb - ta); p = Math.max(0, Math.min(u0, u1)); q = Math.min(1, Math.max(u0, u1)); }
    else if (ta < t0 || ta > t1) return;
    if (q <= p) return;
    const at = u => P(ta + (tb - ta) * u, sa + (sb - sa) * u, ha + (hb - ha) * u), a = at(p), b = at(q);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col.startsWith('#') ? C(col) : col; g.lineWidth = lw(w); g.lineCap = 'round'; g.stroke();
  };
  const sideTruss = (s, col, w) => {                                       // Fachwerk (Stahl): Gurte, Pfosten, Streben über die ganze Brücke
    const T = 11, a = A + 0.15, b = B - 0.15, m = Math.max(2, Math.round((b - a) * 2));
    seg(A, s, H, B, s, H, col, w * 1.4); seg(a, s, H + T, b, s, H + T, col, w * 1.4);
    seg(A, s, H, a, s, H + T, col, w); seg(B, s, H, b, s, H + T, col, w);
    for (let j = 0; j < m; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; seg(p, s, H + T, q, s, H, col, w); if (j) seg(p, s, H, p, s, H + T, col, w * 0.8); }
  };
  const rail = (s, col, w) => {                                            // Geländer (Holz): Pfosten je halbes Feld, Handlauf und Mittelholm
    for (let j = 0; j <= 2 * n; j++) { const t = A + j / 2; seg(t, s, H, t, s, H + 8, L.dark, w); }
    seg(A, s, H + 8, B, s, H + 8, col, w * 1.3); seg(A, s, H + 4, B, s, H + 4, col, w * 0.8);
  };
  const bocks = art !== 'holz' ? [] : opts.rail && n >= 2 ? Array.from({ length: n }, (_, i) => i) : n > BK_ARTEN.holz.frei ? [A + 0.55, B - 0.55] : [];
  for (const t of bocks) {                                                 // Holzböcke: je zwei Beine mit Kreuz (mit Gleis unter jedem Feld)
    for (const s of [-W + 0.06, W - 0.06]) seg(t, s, 0, t, s, H - 3, L.dark, 2.2);
    seg(t, -W + 0.06, 2, t, W - 0.06, H - 5, L.dark, 1.1); seg(t, W - 0.06, 2, t, -W + 0.06, H - 5, L.dark, 1.1);
  }
  if (art === 'stahl') sideTruss(-W - 0.02, L.dark, 1.1); else rail(-W, L.dark, 1.2);   // hinten
  top(A, B, H, L.deck);
  const a0 = Math.max(A, t0), b0 = Math.min(B, t1);
  if (b0 > a0) for (let j = 0, N = Math.ceil((B - A) * (art === 'holz' ? 9 : 6)); j <= N; j++) { const t = A + j / (art === 'holz' ? 9 : 6); if (t >= a0 && t <= b0) seg(t, -W, H, t, W, H, L.line, 0.6); }
  if (weg && opts.wegPaint) opts.wegPaint(H);
  if (opts.railPaint) opts.railPaint(H);                                   // Gleis auf dem Deck (160b)
  if (opts.after) opts.after(H);                                           // Leute oben (zwischen Deck und vorderem Geländer)
  quad(A, B, W, W, H - (art === 'holz' ? 3 : 4), H, L.beam);              // Längsträger vorn
  if (art === 'stahl') sideTruss(W + 0.02, L.rail, 1.5); else rail(W, L.rail, 1.4);   // vorn
}
// Ein Feld der Brücke (render.js tileB): px, py = Mitte des Felds unten
function bkDrawTile(x, y, px, py, z, after) {
  const c = bkAt(x, y);
  if (!c) return;
  const art = bkArtOf(c.b), ax = c.b.ax;
  const P = (t, s, h) => { const du = ax ? s : t - c.i, dv = ax ? t - c.i : s; return [px + (du - dv) * TW / 2 * z, py + (du + dv) * TH / 2 * z - h * z]; };
  const wegPaint = H => bkWegPaint(c, px, py, z, H);
  const railPaint = bkRailAt(c) ? H => drawRailBed(px, py - H * z, z, c.x0 + c.dx * c.i, c.y0 + c.dy * c.i, { b: 'schiene', rot: c.b.ax, form: c.b.gleis[c.i] || 0 }, bkRailArms(c)) : null;
  bkPaint(P, z, art, c.b.n, c.i - 0.5, c.i + 0.5, bkWegAt(c), { wegPaint, railPaint, rail: bkRailAny(c.b), after: after ? H => after(H) : null, ext: c.i < c.b.n - 1 ? 0.012 : 0 });
}
// Weg auf dem Deck: Band längs, Belag und Muster wie der Weg (Richtung der Brücke)
function bkWegPaint(c, px, py, z, H) {
  const st = styleDef('weg', c.b.weg[c.i]), lk = lookFar(pathLook(st.id), z), ax = c.b.ax;
  const L = ([u, v]) => [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - H * z];
  const e = c.i < c.b.n - 1 && c.b.weg[c.i + 1] ? 0.012 : 0;               // ins nächste Feld mit Weg: keine Fuge
  const band = w => ax ? [[-w, -0.5], [w, -0.5], [w, 0.5 + e], [-w, 0.5 + e]] : [[-0.5, -w], [0.5 + e, -w], [0.5 + e, w], [-0.5, w]];
  poly(band(Math.min(EDGE_W, BK_W - 0.02)).map(L), C(lk.edge || '#bfa98a'));
  g.save(); g.beginPath(); band(ROAD_W).map(L).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
  patRot = wegPatRot({ b: 'weg', style: c.b.weg[c.i], lauf: ax });       // Muster längs der Brücke (Block 158)
  try { paintLook(L, lk, c.x0 + c.dx * c.i, c.y0 + c.dy * c.i, z, false, e); } finally { patRot = 0; g.restore(); }   // Belag, Muster, Schachbrett wie am Boden
}
// Schatten im Boden-Bild (render.js drawShadows): das Deck, um die Sonne versetzt
function drawBkShadows(want) {
  const dx = SUN.dx * HILL_H, dy = SUN.dy * HILL_H;
  g.beginPath();
  for (const [k, b] of state.bruecken) {
    const [x0, y0] = keyXY(k);
    if (!bkCellsOf(k, b).some(c => want(c))) continue;                   // want(Feld, w, h): nur das Feld übergeben
    const ax = b.ax, A = -0.5, B = b.n - 0.5;
    const pt = (t, s) => { const p = iso(ax ? x0 + s : x0 + t, ax ? y0 + t : y0 + s); return [p.x + dx, p.y + dy]; };
    [pt(A, -BK_W), pt(B, -BK_W), pt(B, BK_W), pt(A, BK_W)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
  }
  g.fillStyle = SHADOW_COL; g.fill('nonzero');
}
// Felder, deren tileB eine Brücke zeichnet (GL-Standbild, gl.js glPlayTiles: jedes Bild neu)
function bkLiveTiles() { return bkOn() ? [...bkFresh().cell.keys()] : []; }
// Bildchen (Menü-Kachel, Stil-Zeile): zwei Anhöhen, dazwischen die Brücke
function drawBkIcon(cx, cy, z, art) {
  const H = HILL_H * 0.75, s = z * 0.33;
  cx -= 16 * s;                                                            // Mitte der Zeichnung (u −1,6 … 2,6) auf cx
  const Pw = (u, v, h) => [cx + (u - v) * TW / 2 * s, cy + (u + v) * TH / 2 * s - h * s];
  const block = (u0, u1, v0, v1) => {                                      // kleine Anhöhe: Oberseite und die zwei sichtbaren Wände
    poly([Pw(u1, v0, 0), Pw(u1, v1, 0), Pw(u1, v1, H), Pw(u1, v0, H)], C('#8a7f73'));
    poly([Pw(u0, v1, 0), Pw(u1, v1, 0), Pw(u1, v1, H), Pw(u0, v1, H)], C('#a79c8e'));
    poly([Pw(u0, v0, H), Pw(u1, v0, H), Pw(u1, v1, H), Pw(u0, v1, H)], C('#96d56f'));
  };
  block(-1.6, -0.5, -0.9, 0.9);
  bkPaint((t, s2, h) => Pw(t, s2, h * 0.75), s, art, 2, -0.5, 1.5, false);
  block(1.5, 2.6, -0.9, 0.9);
}

// ---------------------------------------------------------------------------
// Antippen: getroffen ist das Deck, das man sieht – der Punkt HILL_H unter dem Zeiger liegt auf dem Boden unter dem Deck
// ---------------------------------------------------------------------------
function bkPick(sx, sy) {
  if (!bkOn() || (typeof seeThrough !== 'undefined' && seeThrough)) return null;
  for (const h of [HILL_H + 4, HILL_H, HILL_H - 3]) {
    const [a, b] = tileFrac(sx, sy + h * cam.z), x = Math.round(a), y = Math.round(b), c = bkAt(x, y);
    if (!c) continue;
    if (h > HILL_H) {                                                      // Geländer: nur, wenn auf Deckhöhe nicht die Oberseite einer Anhöhe davor liegt
      const [ha, hb] = tileFrac(sx, sy + HILL_H * cam.z), hx = Math.round(ha), hy = Math.round(hb);
      if (!bkAt(hx, hy) && hillLift(hx, hy) >= HILL_H) continue;
    }
    const s = c.b.ax ? a - x : b - y;
    if (Math.abs(s) > BK_W + 0.05) continue;
    const [ga, gb] = pickFrac(sx, sy), gx = Math.round(ga), gy = Math.round(gb);
    if (hillLevel(gx, gy) >= 1 && gx + gy > x + y) return null;            // eine Anhöhe davor verdeckt das Deck
    return { x, y, deck: true };
  }
  return null;
}

// Blass zeichnen (wie die Überdachung): bei 👁 Durchsicht und wenn man darunter baut (Zeiger auf einem Feld unter dieser Brücke, nicht aufs Deck)
function bkFadeNow(x, y) {
  if (typeof seeThrough !== 'undefined' && seeThrough) return true;
  if (tool === 'look' || tool === 'abriss' || !hover || hover.deck) return false;
  const c = bkAt(x, y), h = bkAt(hover.x, hover.y);
  return !!c && !!h && h.k === c.k;
}
// Für Antippen und Vorschau gleich (tap, setHover): das Deck, außer ein Ding steht davor (mindestens ein halbes Feld weiter vorn)
function bkPickFront(sx, sy) {
  const bp = bkPick(sx, sy);
  if (!bp) return null;
  const oh = objectAt(sx, sy);
  return oh && oh.d > bp.x + bp.y + 0.5 ? null : bp;
}

// ---------------------------------------------------------------------------
// Fenster (👆)
// ---------------------------------------------------------------------------
function openBkInfo(x, y) {
  const c = bkAt(x, y);
  if (!c) { closePanel(); return; }
  const art = bkArtOf(c.b), A = BK_ARTEN[art], nw = (c.b.weg || []).filter(Boolean).length, ng = bkRailCount(c.b);
  const cur = bkCost(art, c.b.n);
  const btn = id => {
    const B = BK_ARTEN[id], nu = bkCost(id, c.b.n), dm = nu.cost - cur.cost, lock = B.tech && !state.techs.has(B.tech);
    return `<button class="look look-form${id === art ? ' on' : ''}${lock ? ' locked' : ''}" data-bkart="${id}" aria-label="${B.name}"><img alt="" src="${lookThumb('bruecke', BK_ART_IDS.indexOf(id), 0) || 'data:,'}"><span>${B.name}${id === art ? '' : dm > 0 ? ` · −${fmt(dm)}` : dm < 0 ? ` · +${fmt(-dm)}` : ''}</span></button>`;
  };
  const el = showPanel(`<h3>🌉 ${escHtml(A.name)}</h3>
    <p class="muted">Brücke zwischen zwei Anhöhen · ${c.b.n} ${c.b.n === 1 ? 'Feld' : 'Felder'} Lücke. Darunter bleibt Platz für Wege, Schienen, Wasser und Flaches.</p>
    <div class="label">Art</div><div class="looks look-forms">${BK_ART_IDS.map(btn).join('')}</div>
    <div class="label">${ng ? 'Gleis darauf' : 'Weg oder Gleis darauf'}</div>
    ${nw ? `<div class="row"><button class="btn" id="p-bkweg">🗑️ Weg entfernen +${fmt(nw * ITEMS.weg.cost)}</button></div>`
      : ng ? `<div class="row"><button class="btn" id="p-bkweg">🗑️ Gleis entfernen +${fmt(ng * ITEMS.schiene.cost)}</button></div>${bkRailFull(c.b) ? '' : '<p class="muted">Erst durchgehend, mit Schiene oben an beiden Enden, fahren Züge hinüber.</p>'}`
      : '<p class="muted">Zieh einen Weg oder eine Schiene von der einen Anhöhe über die Brücke zur anderen.</p>'}
    <div class="row"><button class="btn danger" id="p-del" aria-label="Brücke abreißen">🗑️ Abreißen +${fmt(cur.cost + nw * ITEMS.weg.cost + ng * ITEMS.schiene.cost)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => bkAt(x, y) ? openBkInfo(x, y) : closePanel());
  for (const b of el.querySelectorAll('[data-bkart]')) b.onclick = () => { undoable(() => bkSetArt(c.k, b.dataset.bkart)); openBkInfo(x, y); };
  if ($('p-bkweg')) $('p-bkweg').onclick = () => { undoable(() => bkDemolishAt(x, y)); openBkInfo(x, y); };
  $('p-del').onclick = () => { closePanel(); undoable(() => bkDemolishAt(x, y, true)); };
  $('p-close').onclick = closePanel;
}
