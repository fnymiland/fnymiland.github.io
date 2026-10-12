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
const BK_ART_IDS = DECO_LOOKS.bruecke.forms.map(f => f.id);               // Formen der Leiste = Materialien (Index = paintNew.bruecke.form, nie umsortieren)
const BK_MAX = 4, BK_W = 0.4, BK_CLEAR = HILL_H - 6;                    // längste Lücke, halbe Breite des Decks, Platz darunter (Deko-Höhe)
const BK_READ_MAX = 8;                                                    // so lange Brücken liest parseSave schon (160c: gebaut wird bis 8 erst später)
const BK_NO_PAINT = new Set(['wald', 'obstwald', 'fels', 'anhoehe']);   // Gelände, das darunter nicht passt (Bäume, Felsen, Anhöhe)
const bkArtOf = b => b && typeof b.art === 'string' && ['holz', 'stahl', 'stein', 'kristall'].includes(b.art) ? b.art : 'holz';   // BK_ARTEN: nur noch eingefrorene v1016-Preise (Geld ohne brp)
const bkArtNew = () => BK_ART_IDS[decoLookNew('bruecke').form || 0] || 'holz';
// Aussehen einer neuen Brücke (Leiste): Material, Farbe; Rest Standard (Stützen „wenige“, kein Licht, keine Zacken)
function bkLookNew() {
  const p = decoLookNew('bruecke');
  return { at: 'anhoehe', fam: 'fuss', mat: BK_ART_IDS[p.form || 0] || 'holz', col: p.col ? p.col - 1 : null, plank: null, deck: 'muster', licht: null, zacken: false, stuetzen: 'wenige' };
}
const bkPrice = (look, n) => brCostMat(brPrice(look, 'anhoehe', n));    // { cost, mat }
const bkCost = (art, n) => brCostMat(brAdd({ money: 0 }, BR_COST.anhoehe[art] || BR_COST.anhoehe.holz, n));   // Preise: brueckenfamilie.js (160c A4)
const bkRailAny = b => !!b && !!b.gleis && b.gleis.some(f => f != null);
const bkWegAny = b => !!b && !!b.weg && b.weg.some(Boolean);
// Höhe des Decks (160c C2, brDeckHFn): Familie aus dem Inhalt (Gleis → Bahn, flach), t am Anker (über die Feldgrenze stetig)
const bkFam = b => bkRailAny(b) ? 'bahn' : 'fuss';
const bkH = (b, t) => brDeckHFn(bkFam(b), b.n)(t);
const bkT = (c, u, v) => c.b.ax ? v - c.y0 : u - c.x0;
const bkHMax = c => brDeckHMax(bkFam(c.b), c.b.n, c.i - 0.5, c.i + 0.5 + 0.012);
const bkPeakMax = () => bkOn() ? Math.max(0, ...[...state.bruecken.values()].map(b => brPeak(bkFam(b), b.n))) : 0;
// Höhe einer Figur auf dem Deck (am Fußpunkt wie slopeUp; sitzend in der Mitte) – null: nicht auf einer Brücke
function brLiftAt(px, py, sit = false) {
  const f = sit ? 0 : FOOT_D, fu = px + f, fv = py - f;
  const c = bkAt(Math.round(fu), Math.round(fv)) || bkAt(Math.round(px), Math.round(py));
  return c ? bkH(c.b, bkT(c, fu, fv)) : null;
}
// Stützen einer Brücke (160c C1, brSupports): Kanten k; art/rail: so, wie sie nach einem Wechsel wäre (Art wechseln, Gleis legen)
function bkSupports(b, art = null, rail = null) {
  const L = brLook(b, 'anhoehe');
  return brSupports({ ...L, mat: art || L.mat, fam: (rail != null ? rail : bkRailAny(b)) ? 'bahn' : 'fuss' }, b.n);
}
// Aussehen und Geometrie einer Brücke (160c C3): Material, Familie, Pfeiler, Höhe, Maler-Art (Kristall bis C4, Bahn-Stein bis C5 wie Holz),
// Steinbögen für jede Steinbrücke (Pfeilerregel auch bei Gleis). art/rail wie bkSupports. Gemerkt je Boden-Fassung in bkFresh (c.G)
function bkGeom(b, art = null, rail = null) {
  const look = brLook(b, 'anhoehe'), mat = art || look.mat, fam = (rail != null ? rail : bkRailAny(b)) ? 'bahn' : 'fuss', piers = brSupports({ ...look, mat, fam }, b.n);
  return { ax: b.ax ? 1 : 0, look, mat, fam, piers, hf: brDeckHFn(fam, b.n),
    art: fam === 'fuss' ? (mat === 'stein' || BK_FUSS[mat] ? mat : 'holz') : mat === 'stein' || BK_BAHN[mat] ? mat : 'holz',   // Stein-Viadukt (C5d)
    stone: mat === 'stein' ? brStoneGeom(fam, b.n, piers) : null };
}
const bkGlasAt = c => !!c && !!c.G && c.G.art === 'kristall';            // Kristall-Fußgänger (160c C4): Glas jedes Bild in tileB
const brLiveTiles = () => bkOn() ? bkFresh().glas : [];                   // Felder, deren tileB im GL-Bild jedes Bild laufen muss (Glas)
const bkGround = (c, t) => { const i = Math.max(0, Math.min(c.b.n - 1, Math.round(t))); return terrainAt(c.x0 + c.dx * i, c.y0 + c.dy * i) === 'water' ? -0.7 * DEPTH : 0; };   // Boden unter Feld bei t (Wasser −6,3)
// Die zwei Felder an Kante k (zwischen Feld k−1 und k)
const bkEdgeCells = (x0, y0, ax, k) => ax ? [[x0, y0 + k - 1], [x0, y0 + k]] : [[x0 + k - 1, y0], [x0 + k, y0]];
// Was eine Stütze auf der Kante zwischen A und B (Nachbarn längs der Brücke) stört: ein Weg oder Gleis, das hinüberführt, eine Linie auf
// der Kante, Deko auf der Seitenmitte davor. Text oder null. Alte Stände: dort wird die Stütze nur nicht gezeichnet (bkSupportsShown)
function bkEdgeBlocker([xa, ya], [xb, yb]) {
  const dx = xb - xa, dy = yb - ya, ta = objAt(xa, ya), tb = objAt(xb, yb);
  const weg = (x, y) => bAt(x, y) === 'weg' || crossingAt(x, y) || wegAt(x, y) != null;
  if (weg(xa, ya) && weg(xb, yb)) return 'Hier steht eine Stütze der Brücke – der Weg darf nur quer darunter durch';
  if (ta && tb && ta.b === 'schiene' && tb.b === 'schiene' && railArms(xa, ya).some(([ex, ey]) => ex === dx && ey === dy)) return 'Hier steht eine Stütze der Brücke – das Gleis darf nur quer darunter durch';
  const e = state.edges.get(edgeBetween(xa, ya, xb, yb));
  if (e) return `Hier steht eine Stütze der Brücke – erst ${ITEMS[e.b] ? ITEMS[e.b].name : 'die Linie'} auf der Kante entfernen`;
  for (const [x, y, sx, sy] of [[xa, ya, dx, dy], [xb, yb, -dx, -dy]]) {
    const ds = decosAt(x + ',' + y), i = MID_SIDE.findIndex(([mx, my]) => mx === sx && my === sy);
    if (ds && ds[4 + i]) return `Hier steht eine Stütze der Brücke – erst ${ITEMS[ds[4 + i].b] ? ITEMS[ds[4 + i].b].name : 'die Deko'} daneben wegnehmen`;
  }
  return null;
}
// Stützen, die stören würden (art/rail wie bkSupports): erster Fehlertext oder null
function bkSupportsError(k, b, art = null, rail = null) {
  const [x0, y0] = keyXY(k);
  for (const e of bkSupports(b, art, rail)) { const err = bkEdgeBlocker(...bkEdgeCells(x0, y0, b.ax, e)); if (err) return err; }
  return null;
}
// Stütze auf Kante k einer Brücke (k gezeichnet vom späteren Feld): steht nur, wo nichts stört
function bkSupportsShown(c) {
  const out = [];
  for (const e of bkSupports(c.b)) if (!bkEdgeBlocker(...bkEdgeCells(c.x0, c.y0, c.b.ax, e))) out.push(e);
  return out;
}
// Linie/Torbogen auf einer Kante (edgeError, setArch): Stütze darauf? Kante mit Feldern unter derselben Brücke
function bkEdgeSupport(ek) {
  if (!bkOn()) return false;
  const [[xa, ya], [xb, yb]] = edgeTiles(ek), ca = bkAt(xa, ya), cb = bkAt(xb, yb);
  return !!ca && !!cb && ca.k === cb.k && (ca.b.ax ? xa === xb : ya === yb) && bkSupports(ca.b).includes(Math.max(ca.i, cb.i));
}

// Nachschlagen: Feld der Lücke → { k, b, i, x0, y0, dx, dy }; Anhöhen-Feld am Ende → [{ k, b, side, … }] (gemerkt je Boden-Fassung)
let bkCache = { v: -1, st: null, size: -1, cell: new Map(), end: new Map() };
const bkOn = () => !!state.bruecken && state.bruecken.size > 0;
function bkFresh() {
  const s = state.bruecken;
  if (bkCache.v === groundVersion && bkCache.st === state && bkCache.size === s.size) return bkCache;
  const cell = new Map(), end = new Map();
  for (const [k, b] of s) {
    const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0, o = { k, b, x0, y0, dx, dy, G: bkGeom(b) };
    for (let i = 0; i < b.n; i++) cell.set((x0 + dx * i) + ',' + (y0 + dy * i), { ...o, i });
    for (const [ek, side] of [[(x0 - dx) + ',' + (y0 - dy), -1], [(x0 + dx * b.n) + ',' + (y0 + dy * b.n), 1]]) { if (!end.has(ek)) end.set(ek, []); end.get(ek).push({ ...o, side }); }
  }
  return (bkCache = { v: groundVersion, st: state, size: s.size, cell, end, stone: [...cell.values()].some(c => c.G.art === 'stein'), glas: [...cell].filter(([, c]) => c.G.art === 'kristall').map(([k]) => k) });
}
const bkAt = (x, y) => bkOn() ? bkFresh().cell.get(x + ',' + y) || null : null;
const bkOnHill = (x, y) => bkOn() ? bkFresh().end.get(x + ',' + y) || null : null;   // Anhöhen-Feld, auf dem eine Brücke aufliegt
const bkEndsOf = (k, b) => { const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0; return [[x0 - dx, y0 - dy], [x0 + dx * b.n, y0 + dy * b.n]]; };
const bkCellsOf = (k, b) => { const [x0, y0] = keyXY(k), dx = b.ax ? 0 : 1, dy = b.ax ? 1 : 0; return Array.from({ length: b.n }, (_, i) => [x0 + dx * i, y0 + dy * i]); };
const BK_ON_HILL = 'Hier liegt eine Brücke auf – erst die Brücke abreißen';
const BK_UNDER_ONLY = 'Unter der Brücke ist nur Platz für Flaches – Wege, Schienen, Gelände und niedrige Deko';

// Was unter dem Deck auf Feld (x, y) liegt: passt es? (Brücke bauen, Art wechseln)
function bkUnderError(x, y, G = null, i = 0) {                             // G, i: Geometrie der Brücke und Feld (Stein: Pfeiler und Bögen, 160c C3)
  if (state.roofs && roofAt(x, y)) return 'Unter einer Brücke geht keine Überdachung – erst das Dach abreißen';
  const tr = terrainAt(x, y);
  if (tr === 'forest' || tr === 'obst') return 'Unter der Brücke erst roden (👆 aufs Feld)';
  if (tr === 'rock' || tr === 'erz' || tr === 'kristall') return `Unter der Brücke ist kein Platz für: ${TERRAIN_NAMES[tr]}`;
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (t) {
    if (t.b !== 'weg' && t.b !== 'schiene') return `Unter der Brücke ist kein Platz für: ${ITEMS[t.b].name}`;
    if (t.bridge) return 'Unter der Brücke geht keine Wasserbrücke';
    if (isCrossing(t) && t.foot) return 'Unter der Brücke ist kein Platz für die Fußgängerbrücke';
  }
  for (const [dx, dy] of DIRS) { const e = state.edges.get(edgeBetween(x, y, x + dx, y + dy)); if (e && e.arch) return 'Unter der Brücke ist kein Platz für einen Torbogen'; }   // R8
  const ds = decosAt(x + ',' + y) || [];
  for (let j = 0; j < ds.length; j++) {
    const d = ds[j];
    if (!d) continue;
    const cl = G && G.stone && j !== VSLOT ? bkSlotClearG(G, i, x, y, j, d) : brClear(), nm = ITEMS[d.b] ? ITEMS[d.b].name : 'Das';
    if (cl < 0) return `${BK_PIER} – erst ${nm} wegnehmen`;
    if (decoHeight(d.b, d.form) > cl) return `${nm} ist zu hoch für unter die Brücke`;
  }
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) { const p = postAt(vx, vy); if (p && decoHeight(p.b, p.form) > brClear()) return `${ITEMS[p.b] ? ITEMS[p.b].name : 'Das'} ist zu hoch für unter die Brücke`; }
  return null;
}
let BK_PLAN_SAME = null, BK_GROUP = null;                                // Ziehen (planScan) bzw. Gruppe ablegen (groupErrors): Felder, die gleich mitgebaut werden                                                  // beim Ziehen (planScan): Felder derselben Linie, die der Plan schon baut
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
    if (b === 'weg' || b === 'schiene') for (const e of bkSupports(c.b)) {   // Stütze auf einer Kante dieses Felds (160c C1): nur quer darunter durch
      const [A, B2] = bkEdgeCells(c.x0, c.y0, c.b.ax, e), other = A[0] === x && A[1] === y ? B2 : B2[0] === x && B2[1] === y ? A : null;
      if (!other) continue;
      const ok2 = other[0] + ',' + other[1];
      if ((BK_PLAN_SAME && BK_PLAN_SAME.has(ok2)) || (BK_GROUP && BK_GROUP[b] && BK_GROUP[b].has(ok2)) || (b === 'weg' ? bAt(...other) === 'weg' || crossingAt(...other) || wegAt(...other) != null : bAt(...other) === 'schiene')) return `Hier steht eine Stütze der Brücke – ${b === 'weg' ? 'der Weg' : 'das Gleis'} darf nur quer darunter durch`;
    }
  }
  return null;
}
// Kleine Deko unter dem Deck: nur, was darunter passt (wie unter der Überdachung, smallError). Stein (160c C3): nicht in einen Pfeiler, unter
// dem Bogen nur so hoch, wie er dort ist – dieselbe Geometrie wie das Bild (brClear über slotPos/decoExt)
const BK_PIER = 'Hier steht ein Pfeiler der Brücke';
function bkSlotClearG(G, i, x, y, slot, d) {
  const [u, v] = slotPos(x, y, slot, d), [ru, rv] = decoExt(d), r = G.ax ? rv : ru;
  // dazu der Platz ohne Einrücken (Linie, Wegkurve): fällt das später weg, rutscht die Deko dorthin – er ist immer der ungünstigste
  const off = (k, rr) => Math.min(k, 0.5 - rr - 0.02), su = slot & 1 ? 1 : -1, sv = slot & 2 ? 1 : -1;
  const [u0, v0] = slot === CSLOT ? [0, 0] : slot >= 4 && slot < 8 ? MID_SIDE[slot - 4].map((m, j) => m * off(MID_OFF, j ? rv : ru)) : [su * off(SLOT_OFF, ru), sv * off(SLOT_OFF, rv)];
  return Math.min(brClear(G.stone, i + (G.ax ? v : u), r), brClear(G.stone, i + (G.ax ? v0 : u0), r));
}
function bkTooTall(b, x, y, slot, form = 0, rot = 0) {                      // rot: wie sie stehen wird (gedrehte Bank ist längs breiter)
  if (!bkOn()) return null;
  const h = decoHeight(b, form), c = slot !== VSLOT && bkAt(x, y);
  if (c && c.G && c.G.stone) { const cl = bkSlotClearG(c.G, c.i, x, y, slot, { b, form, rot }); return cl < 0 ? BK_PIER : h > cl ? `${ITEMS[b] ? ITEMS[b].name : 'Das'} ist zu hoch für unter die Brücke` : null; }
  if (h <= brClear()) return null;
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
// Darf hier eine Brücke in diesem Aussehen hin? look: bkLookNew() (Material, Farbe; 160c C6)
function bkError(sp, look, noCost) {
  if (sp.err) return sp.err;
  if (!available('bruecke')) return `Brücke: ${lockText('bruecke').replace('🔒 ', 'erst mit ')}`;
  const mat = look && BR_MAT[look.mat] ? look.mat : 'holz', lk = brMatLock(mat);
  if (lk) return lk;
  for (const [ex, ey] of sp.ends) if (!ownedTile(ex, ey)) return notMine(ex, ey);
  if (sp.n > BK_MAX) return `Höchstens ${BK_MAX} Felder Lücke – sonst braucht die Brücke Pfeiler`;
  const nb = { ax: sp.ax, n: sp.n, art: mat }, Gn = bkGeom(nb);           // so, wie sie gebaut würde (Stein: Pfeiler und Bögen)
  for (let i = 0; i < sp.gap.length; i++) {
    const [x, y] = sp.gap[i];
    if (!ownedTile(x, y)) return notMine(x, y);
    if (bkAt(x, y)) return 'Hier ist schon eine Brücke – das Material wechselst du im Fenster (👆)';
    const e = bkUnderError(x, y, Gn, i);
    if (e) return e;
  }
  for (const [x, y] of sp.gap) if (bpFronts(x, y).length) return 'Hier sitzt ein Bergportal in der Wand – die Brücke läge vor seiner Öffnung';   // R9, wie bpError
  const se = bkSupportsError(sp.x0 + ',' + sp.y0, nb);                    // Stützen bzw. Pfeiler auf den Kanten (160c C1)
  if (se) return se;
  if (noCost) return null;
  const c = bkPrice({ ...look, mat }, sp.n);
  if (state.money < c.cost) return 'Zu wenig Taler';
  return matError(c.mat);
}
// Planen (plan.js planScan): die ganze Brücke auf einmal – die Felder der Lücke grün oder rot, der Rest hell
function scanBruecke(p) {
  const states = new Map(), order = [], look = bkLookNew(), sp = bkSpanOf(p.a, p.b);
  for (const [x, y] of planTiles(p)) states.set(x + ',' + y, 'same');
  const err = bkError(sp, look, true);
  if (sp.gap) for (const [x, y] of sp.gap) states.set(x + ',' + y, err ? 'bad' : 'ok');
  if (err) return { states, order, n: 0, cost: 0, gain: 0, mat: {}, bad: sp.gap ? sp.gap.length : 0, firstErr: err };
  const c = bkPrice(look, sp.n);
  order.push([sp.x0, sp.y0, () => bkBuild(sp, look)]);
  return { states, order, n: sp.n, cost: c.cost, gain: 0, mat: c.mat, bad: 0, firstErr: null, art: look.mat };
}
// Bauen im neuen Format (160c C6): Material in art, Farbe in brc (nur Abweichungen), bezahlt in brp samt Kennung k = 'a:<art>'
function bkBuild(sp, look) {
  if (typeof look === 'string') look = { ...bkLookNew(), mat: look };      // alte Aufrufe mit der Art
  const err = bkError(sp, look);
  if (err) { fail(err); return false; }
  const c = brPrice(look, 'anhoehe', sp.n), b = { ax: sp.ax, n: sp.n, art: look.mat, ...(look.col != null ? { brc: look.col } : {}) };
  state.money -= c.money; payMat(brCostMat(c).mat);
  b.brp = { ...c, k: brSig(b, 'anhoehe') };
  state.bruecken.set(sp.x0 + ',' + sp.y0, b);
  groundVersion++; sfx('road'); recalc(); save();
  return true;
}
const bkRailCount = b => (b.gleis || []).filter(f => f != null).length;
function bkDemolishInfo(x, y) {
  const c = bkAt(x, y);
  if (!c) return null;
  const nw = (c.b.weg || []).filter(Boolean).length, ng = bkRailCount(c.b);
  if (nw) return { k: c.k, weg: true, refund: nw * ITEMS.weg.cost, label: 'Weg auf der Brücke entfernen' };
  if (ng) return { k: c.k, gleis: true, refund: ng * ITEMS.schiene.cost, mat: Object.fromEntries(Object.entries(ITEMS.schiene.mat || {}).map(([r, v]) => [r, v * ng])), label: 'Gleis auf der Brücke entfernen' };
  const bc = brCostMat(brPaid(c.b, 'anhoehe'));                            // was sie gekostet hat (160c A4)
  return { k: c.k, refund: bc.cost, mat: bc.mat, label: `Brücke aus ${BR_MAT[bkArtOf(c.b)].name} abreißen` };
}
function bkDemolishAt(x, y, all = false) {                                // all: Weg/Gleis und Brücke zusammen (Fenster „Abreißen“)
  const c = bkAt(x, y);
  if (!c) return false;
  const b = c.b, nw = (b.weg || []).filter(Boolean).length, ng = bkRailCount(b);
  let back = 0;
  if (nw) { back += nw * ITEMS.weg.cost; delete b.weg; }
  if (ng && !all) {                                                         // bleibt eine Steinbrücke stehen, wird sie ohne Gleis ein Bogen (160c C3): passt, was darunter steht?
    const Gf = bkGeom(b, null, false);
    if (Gf.stone) for (const [i, [cx, cy]] of bkCellsOf(c.k, b).entries()) { const e = bkUnderError(cx, cy, Gf, i); if (e) { fail('Ohne Gleis wird die Brücke ein Bogen – ' + e); return false; } }
  }
  if (ng) { back += ng * ITEMS.schiene.cost; for (const [r, n] of Object.entries(ITEMS.schiene.mat || {})) state.res[r] += n * ng; delete b.gleis; }
  if ((!nw && !ng) || all) {
    const bc = brCostMat(brPaid(b, 'anhoehe'));                            // was sie gekostet hat (160c A4)
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
function bkSetArt(k, art) { return brSet({ at: 'anhoehe', k }, { mat: art }); }   // Hülle (Tests, Werkzeuge): Material wechseln
// Setzer der Anhöhen-Brücke (160c C6): ch = { mat } | { col } | { plank } | { deck } | { stuetzen } | { zacken: 'kaufen' | 'an' | 'aus' }.
// Material: das Bezahlte voll zurück, das neue bezahlen (gekaufte Zacken verfallen); Zacken kaufen: Aufpreis je Feld; sonst kostenlos.
// Geprüft am Zielobjekt: Sperre, neue Stützen/Pfeiler (nur die neuen – alte Stände), Lichtraum unter Stein. brp danach immer mit Kennung
function brSet(ref, ch) {
  if (!ref || ref.at !== 'anhoehe') return false;
  const b = state.bruecken.get(ref.k);
  if (!b || !ch) return false;
  const n = b.n, L = brLook(b, 'anhoehe'), nb = JSON.parse(JSON.stringify(b)), paid = brPaid(b, 'anhoehe'), [x0, y0] = keyXY(ref.k);
  const fuss = L.fam === 'fuss', wegDa = bkWegAny(b);
  let price = null;                                                        // neu zu bezahlen (Material) bzw. Aufpreis (Zacken)
  if ('mat' in ch) {
    if (!BR_MAT[ch.mat] || !Object.prototype.hasOwnProperty.call(BR_MAT, ch.mat) || ch.mat === L.mat) return false;
    const lk = brMatLock(ch.mat); if (lk) { fail(lk); return false; }
    nb.art = ch.mat; delete nb.brz; if (ch.mat !== 'holz') { delete nb.bru; delete nb.brw; }
  } else if ('col' in ch) {
    const v = ch.col == null ? null : brIdx(ch.col);
    if (v === L.col || (v != null && v >= BRIDGE_COLS.length)) return false;
    if (v == null) delete nb.brc; else nb.brc = v;
  } else if ('plank' in ch) {
    const v = ch.plank == null ? null : brIdx(ch.plank);
    if (L.mat !== 'holz' || v === L.plank || (v != null && v >= PLANK_COLS.length)) return false;
    if (v == null) delete nb.brw; else nb.brw = v;
  } else if ('deck' in ch) {
    if (!wegDa || (ch.deck !== 'belag' && ch.deck !== 'muster') || ch.deck === L.deck) return false;
    if (ch.deck === 'belag') delete nb.brb; else nb.brb = 'muster';        // Standard mit Weg: Belag
  } else if ('stuetzen' in ch) {
    if (L.mat !== 'holz' || !fuss || !['keine', 'wenige', 'jede'].includes(ch.stuetzen) || ch.stuetzen === L.stuetzen) return false;
    if (ch.stuetzen === 'wenige') delete nb.bru; else nb.bru = ch.stuetzen;
  } else if ('zacken' in ch) {
    if (L.mat !== 'kristall' || !fuss) return false;
    const bought = b.brz === 'an' || b.brz === 'aus';
    if (ch.zacken === 'kaufen') { if (bought) return false; price = brAdd({ money: 0 }, BR_OPT.zacken.feld, n); nb.brz = 'an'; }
    else if ((ch.zacken === 'an' || ch.zacken === 'aus') && bought && b.brz !== ch.zacken) nb.brz = ch.zacken;
    else return false;
  } else return false;
  const old = bkSupports(b);                                               // neue Stützen bzw. Pfeiler: ist ihre Kante frei?
  for (const e of bkSupports(nb)) if (!old.includes(e)) { const err = bkEdgeBlocker(...bkEdgeCells(x0, y0, b.ax, e)); if (err) { fail(err); return false; } }
  if ('mat' in ch) {
    const Gn = bkGeom(nb);
    if (Gn.stone) for (const [i, [cx, cy]] of bkCellsOf(ref.k, b).entries()) { const err = bkUnderError(cx, cy, Gn, i); if (err) { fail(err); return false; } }
    price = brPrice({ ...brLook(nb, 'anhoehe'), zacken: false }, 'anhoehe', n);
    if (state.money + (paid.money || 0) < price.money) { fail('Zu wenig Taler'); return false; }
    for (const [r, v] of Object.entries(price)) if (r !== 'money' && (state.res[r] || 0) + (paid[r] || 0) < v) { fail(`Zu wenig ${RES[r].name}`); return false; }
    state.money += (paid.money || 0) - price.money;
    for (const [r, v] of Object.entries(paid)) if (r !== 'money') state.res[r] += v;
    payMat(brCostMat(price).mat);
    nb.brp = { ...price, k: brSig(nb, 'anhoehe') };
  } else if (price) {                                                      // Zacken: Aufpreis
    const c = brCostMat(price);
    if (state.money < c.cost) { fail('Zu wenig Taler'); return false; }
    const me = matError(c.mat); if (me) { fail(me); return false; }
    state.money -= c.cost; payMat(c.mat);
    nb.brp = { ...brAdd({ ...paid }, price), k: brSig(nb, 'anhoehe') };
  } else nb.brp = { ...paid, k: brSig(nb, 'anhoehe') };                    // kostenlos: Bezahltes festschreiben (alter Stand: nach der alten Tabelle)
  state.bruecken.set(ref.k, nb);
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
  if (!bkRailAny(c.b)) {                                                   // Holz-/Steinviadukt: Bock bzw. Pfeiler an jeder Kante – nur die neuen Stützen zählen (alte Stände)
    const old = bkSupports(c.b);
    for (const e of bkSupports(c.b, null, true)) if (!old.includes(e)) { const se = bkEdgeBlocker(...bkEdgeCells(c.x0, c.y0, c.b.ax, e)); if (se) return { err: 'Mit Gleis braucht die Brücke mehr Stützen. ' + se }; }
    const Gb = bkGeom(c.b, null, true);                                     // Steinviadukt: flacher, niedrigere Bögen – passt, was darunter steht?
    if (Gb.stone) for (const [i, [cx, cy]] of bkCellsOf(c.k, c.b).entries()) { const e = bkUnderError(cx, cy, Gb, i); if (e) return { err: 'Mit Gleis wird die Brücke ein Viadukt – ' + e }; }
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
// Zug unter einer Brücke (160c C5c, B2d): Stücke je Feld – an den Feldkanten längs der Brücke und quer an s = −½, +W, +½ (Brückenzeile).
// Ein Stück im Brückenfeld liegt darunter ('U', vor dem Nachmalen von vd/o) oder schon davor ('F', danach); sonst mit seinem eigenen Feld.
// Den Schatten zeichnet nur das hinterste Stück (sonst fehlte er, weil geschnittene Wagen keinen zeichnen)
function brCarPiecesUnder(m) {
  if (!bkOn()) return null;
  const la = m.len / 2;
  let c = bkAt(Math.round(m.px), Math.round(m.py));
  for (const sg of [-1, 1]) if (!c) c = bkAt(Math.round(m.px + m.du * la * sg), Math.round(m.py + m.dv * la * sg));
  if (!c) return null;
  const ax = c.b.ax, cuts = [-la, la], add = a => { if (a > -la + 1e-3 && a < la - 1e-3) cuts.push(a); };
  const ca = ax ? m.dv : m.du, wa = ax ? m.py : m.px;                     // längs der Brücke: Feldkanten
  if (Math.abs(ca) > 0.3) for (let h = Math.floor(wa - la) + 0.5; h < wa + la + 1; h++) add((h - wa) / ca);
  const cs = ax ? m.du : m.dv, ws = ax ? m.px : m.py, r0 = ax ? c.x0 : c.y0;   // quer: hinter, vor der Stirn, vor dem Feld
  if (Math.abs(cs) > 0.3) for (const h of [r0 - 0.5, r0 + BK_W, r0 + 0.5]) add((h - ws) / cs);
  cuts.sort((p, q) => p - q);
  const out = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i], hi = cuts[i + 1], am = (lo + hi) / 2;
    if (hi - lo < 0.01) continue;
    const wx = m.px + m.du * am, wy = m.py + m.dv * am, x = Math.round(wx), y = Math.round(wy), cb = bkAt(x, y), s = cb ? (ax ? wx - c.x0 : wy - c.y0) : 0;
    out.push({ k: x + ',' + y, m: { ...m, cut: cuts.length === 2 ? null : [lo, hi], portal: null, ...(cb ? { bkCls: s > BK_W ? 'F' : 'U' } : {}) } });
  }
  if (out.length > 1) {                                                     // Schatten: das zuerst gezeichnete Stück
    const d = p => { const [x, y] = keyXY(p.k); return (x + y) * 1e5 + x; };
    out.reduce((a, p) => d(p) < d(a) ? p : a).m.shadow = true;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Zeichnen
// ---------------------------------------------------------------------------
// Maler (bkPaint, bkPaintLage): brueckenbild.js (160c B1–C5)
// Ein Feld der Brücke (render.js tileB): px, py = Mitte des Felds unten
function bkDrawTile(x, y, px, py, z, after) {
  const c = bkAt(x, y);
  if (!c) return;
  const A = bkTileArgs(c, px, py, z);
  bkPaint(A.P, z, A.art, A.n, A.t0, A.t1, A.weg, { ...A.opts, after: after ? H => after(H) : null });
}
// Was der Maler für ein Brückenfeld braucht (160c B2): Abbildung P, Art, Länge, Ausschnitt, Weg/Gleis auf dem Deck
function bkTileArgs(c, px, py, z) {
  const ax = c.b.ax;
  const P = (t, s, h) => { const du = ax ? s : t - c.i, dv = ax ? t - c.i : s; return [px + (du - dv) * TW / 2 * z, py + (du + dv) * TH / 2 * z - h * z]; };
  const wegPaint = H => bkWegPaint(c, px, py, z, H);
  const railPaint = bkRailAt(c) ? H => drawRailBed(px, py - H * z, z, c.x0 + c.dx * c.i, c.y0 + c.dy * c.i, { b: 'schiene', rot: c.b.ax, form: c.b.gleis[c.i] || 0 }, bkRailArms(c)) : null;
  const G = c.G || bkGeom(c.b);
  const foot = k => bkEdgeCells(c.x0, c.y0, ax, k).every(([x, y]) => terrainAt(x, y) === 'water') ? -0.7 * DEPTH : 0;   // Stütze im Wasser: bis auf die Wasserfläche
  return { P, art: G.art, n: c.b.n, t0: c.i - 0.5, t1: c.i + 0.5, weg: bkWegAt(c), opts: { wegPaint, railPaint, supports: c.i ? bkSupportsShown(c) : [], ext: c.i < c.b.n - 1 ? 0.012 : 0,
    fam: G.fam, ax, hf: G.hf, foot, stone: G.art === 'stein' ? G.stone : null, gl: t => bkGround(c, t), zacken: !!G.look.zacken } };
}
// Eine Gruppe von Lagen (BK_GRUPPEN: h | vd | o) eines Brückenfelds – ruhend in tileA, nachgemalt in tileB
function bkDrawLagen(x, y, px, py, z, gruppe) {
  const c = bkAt(x, y);
  if (!c) return;
  const A = bkTileArgs(c, px, py, z);
  for (const lage of BK_GRUPPEN[gruppe] || []) bkPaintLage(lage, A.P, z, A.art, A.n, A.t0, A.t1, A.weg, A.opts);
}
// Deko auf einem Brückenfeld nach Querlage s (160c B2, PLAN §2.5): hinter dem Deck, darunter, davor – je in Maler-Reihenfolge (SLOTS_ALL)
function bkDecoGroups(x, y, c) {
  const ds = state.decos.get(x + ',' + y), G = { back: [], under: [], front: [] };
  if (!ds || !c) return G;
  for (const i of SLOTS_ALL) {
    if (!ds[i]) continue;
    const [u, v] = slotPos(x, y, i, ds[i]), s = c.b.ax ? u : v;
    (s < -BK_W ? G.back : s > BK_W ? G.front : G.under).push(i);
  }
  return G;
}
// Weg auf dem Deck: Band längs, Belag und Muster wie der Weg (Richtung der Brücke)
function bkWegPaint(c, px, py, z, H) {                                    // H: Deckhöhe – Zahl oder h(t) (Bogen, 160c C2)
  const st = styleDef('weg', c.b.weg[c.i]), lk = lookFar(pathLook(st.id), z), ax = c.b.ax, hf = typeof H === 'function' ? H : () => H, bent = typeof H === 'function';
  const L = ([u, v]) => [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - hf(c.i + (ax ? v : u)) * z];
  const e = c.i < c.b.n - 1 && c.b.weg[c.i + 1] ? 0.012 : 0;               // ins nächste Feld mit Weg: keine Fuge
  const K = bent ? 12 : 1, along = Array.from({ length: K + 1 }, (_, j) => j === K ? 0.5 + e : -0.5 + j / K);   // gebogen: längs Stützpunkte (G4)
  const band = w => ax ? [...along.map(t => [w, t]), ...along.slice().reverse().map(t => [-w, t])] : [...along.map(t => [t, -w]), ...along.slice().reverse().map(t => [t, w])];
  poly(band(Math.min(EDGE_W, BK_W - 0.02)).map(L), C(lk.edge || '#bfa98a'));
  g.save(); g.beginPath(); band(ROAD_W).map(L).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
  patRot = wegPatRot({ b: 'weg', style: c.b.weg[c.i], lauf: ax });       // Muster längs der Brücke (Block 158)
  try { paintLook(L, lk, c.x0 + c.dx * c.i, c.y0 + c.dy * c.i, z, false, e, null, bent ? 12 : 0); } finally { patRot = 0; g.restore(); }   // Belag, Muster, Schachbrett wie am Boden
}
// Wegstück der Anhöhe übers Deck (drawHillFlat): 0,06 – an der nahen Anhöhe (Arm nach hinten) einer Bogenbrücke nur 0,012, sonst läge ihr
// flaches Stück, das nach dem Deck gezeichnet wird, knapp unter dem steigenden Bogen (160c C2)
function bkFlatOver(x, y, dx, dy) {
  const c = bkAt(x + dx, y + dy);
  return c && dx + dy < 0 && bkFam(c.b) === 'fuss' ? 0.012 : 0.06;
}
// Schatten im Boden-Bild (render.js drawShadows): das Deck, um die Sonne versetzt
function drawBkShadows(want) {
  g.beginPath();
  for (const [k, b] of state.bruecken) {
    const [x0, y0] = keyXY(k);
    if (!bkCellsOf(k, b).some(c => want(c))) continue;                   // want(Feld, w, h): nur das Feld übergeben
    const ax = b.ax, A = -0.5, B = b.n - 0.5, hf = brDeckHFn(bkFam(b), b.n), K = brPeak(bkFam(b), b.n) ? 12 : 1;
    const pt = (t, s) => { const p = iso(ax ? x0 + s : x0 + t, ax ? y0 + t : y0 + s), h = hf(t); return [p.x + SUN.dx * h, p.y + SUN.dy * h]; };   // je Stelle um die Sonne versetzt (Bogen, 160c C2)
    const T = Array.from({ length: Math.round(b.n * K) + 1 }, (_, j) => A + j / K), [S0, S1] = ax ? [BK_W, -BK_W] : [-BK_W, BK_W];   // gleicher Drehsinn in beiden Achsen (nonzero)
    const path = pts => { pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    path([...T.map(t => pt(t, S0)), ...T.slice().reverse().map(t => pt(t, S1))]);
    const c0 = bkAt(x0, y0);
    if (c0 && c0.G && c0.G.art === 'stein') {                               // Steinbogen (160c C3): der Boden darunter liegt im Schatten (Tunnel), nur auf Land
      const sh = (ax ? SUN.dy / TH - SUN.dx / TW : SUN.dx / TW + SUN.dy / TH) * HILL_H, ta = A + Math.max(0, sh), tb = B + Math.min(0, sh);   // ohne den Streifen im Schatten der Anhöhe
      const fl = (t, s) => { const p = iso(ax ? x0 + s : x0 + t, ax ? y0 + t : y0 + s); return [p.x, p.y]; };
      for (let i = 0; i < b.n; i++) {
        if (terrainAt(x0 + (ax ? 0 : i), y0 + (ax ? i : 0)) === 'water') continue;
        let j = i; while (j + 1 < b.n && terrainAt(x0 + (ax ? 0 : j + 1), y0 + (ax ? j + 1 : 0)) !== 'water') j++;
        const lo = Math.max(i - 0.5, ta), hi = Math.min(j + 0.5, tb);
        if (hi > lo) path([fl(lo, S0), fl(hi, S0), fl(hi, S1), fl(lo, S1)]);
        i = j;
      }
    }
  }
  g.fillStyle = SHADOW_COL; g.fill('nonzero');
}
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
  bkPaint((t, s2, h) => Pw(t, s2, h * 0.75), s, art, 2, -0.5, 1.5, false, { supports: brSupports({ mat: art, fam: 'fuss', stuetzen: 'wenige' }, 2), fam: 'fuss', hf: brDeckHFn('fuss', 2) });   // leer gebaut: mit Bogen
  block(1.5, 2.6, -0.9, 0.9);
}

// ---------------------------------------------------------------------------
// Antippen: getroffen ist das Deck, das man sieht – der Punkt HILL_H unter dem Zeiger liegt auf dem Boden unter dem Deck
// ---------------------------------------------------------------------------
function bkPick(sx, sy) {
  if (!bkOn() || (typeof seeThrough !== 'undefined' && seeThrough)) return null;
  const h0 = bkFresh().stone ? -0.7 * DEPTH - 1 : HILL_H - 3;               // Stein (160c C3): Stirn und Pfeiler reichen bis zum Boden
  for (let h = HILL_H + bkPeakMax() + 4; h >= h0; h -= 1) {                 // von oben: was zuerst trifft, liegt vorn (Bogen, 160c C2: Höhe je Stelle)
    const [a, b] = tileFrac(sx, sy + h * cam.z), x = Math.round(a), y = Math.round(b), c = bkAt(x, y);
    if (!c) continue;
    const t = bkT(c, a, b), hd = bkH(c.b, t), low = c.G && c.G.art === 'stein' ? c.G.stone.low(t, bkGround(c, t)) : hd - 3;
    if (h > hd + 4 || h < low) continue;
    if (h > hd) {                                                      // Geländer: nur, wenn auf Deckhöhe nicht die Oberseite einer Anhöhe davor liegt
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
  const ek = typeof edgeNear === 'function' && edgeNear(sx, sy);           // eine Linie vor dem Brückenfeld (Zaun vor dem Steinpfeiler, 160c C3) gewinnt
  if (ek && state.edges.has(ek) && edgeDepth(ek) > bp.x + bp.y) return null;
  const oh = objectAt(sx, sy);
  return oh && oh.d > bp.x + bp.y + 0.5 ? null : bp;
}

// ---------------------------------------------------------------------------
// Fenster (👆)
// ---------------------------------------------------------------------------
function openBkInfo(x, y) {
  const c = bkAt(x, y);
  if (!c) { closePanel(); return; }
  const b = c.b, L = brLook(b, 'anhoehe'), ref = { at: 'anhoehe', k: c.k }, nw = (b.weg || []).filter(Boolean).length, ng = bkRailCount(b), paid = brPaid(b, 'anhoehe');
  const fuss = L.fam === 'fuss', diff = d => d > 0 ? ` · −${fmt(d)}` : d < 0 ? ` · +${fmt(-d)}` : '';
  const matBtn = id => {
    const nu = brPrice({ ...brLook({ ...b, art: id, brz: undefined }, 'anhoehe'), zacken: false }, 'anhoehe', b.n), lk = brMatLock(id), M = BR_MAT[id];
    return `<button class="look look-form${id === L.mat ? ' on' : ''}${lk ? ' locked' : ''}" data-bkart="${id}" aria-label="${M.name}"${lk ? ` title="${escHtml(lk)}"` : ''}><img alt="" src="${lookThumb('bruecke', BK_ART_IDS.indexOf(id), L.col == null ? 0 : L.col + 1) || 'data:,'}"><span>${lk ? '🔒 ' : ''}${M.name}${id === L.mat ? '' : diff(nu.money - (paid.money || 0))}</span></button>`;
  };
  const colBtn = (v, name, css) => `<button class="sw${v === L.col ? ' on' : ''}" data-brc="${v == null ? '' : v}" style="background:${css}" title="${escHtml(name)}" aria-label="Farbe ${escHtml(name)}"></button>`;
  const opt = (key, v, name, on) => `<button class="btn small${on ? ' on' : ''}" data-${key}="${v}">${name}</button>`;
  const bought = b.brz === 'an' || b.brz === 'aus', zk = brCostMat(brAdd({ money: 0 }, BR_OPT.zacken.feld, b.n));
  const el = showPanel(`<h3>🌉 ${fuss ? 'Brücke' : 'Bahnbrücke'} aus ${escHtml(BR_MAT[L.mat].name)}</h3>
    <p class="muted">Zwischen zwei Anhöhen · ${b.n} ${b.n === 1 ? 'Feld' : 'Felder'} Lücke. Darunter bleibt Platz für Wege, Schienen, Wasser und Flaches.</p>
    <div class="label">Material</div><div class="looks look-forms">${BK_ART_IDS.map(matBtn).join('')}</div>
    <div class="label">Farbe</div><div class="swatches">${colBtn(null, 'Wie das Material', 'linear-gradient(135deg,#b08a5e,#cfd3cf,#d9d2c3,#afe1f8)')}${BRIDGE_COL_DEFS.map((d, i) => colBtn(i, d.name, d.c)).join('')}</div>
    ${nw ? `<div class="label">Deck</div><div class="row">${opt('brb', 'belag', 'Wie der Weg', L.deck === 'belag')}${opt('brb', 'muster', 'Eigenes Muster', L.deck === 'muster')}</div>` : ''}
    ${L.mat === 'holz' && fuss ? `<div class="label">Stützen</div><div class="row">${opt('bru', 'keine', 'Keine', L.stuetzen === 'keine')}${opt('bru', 'wenige', 'Wenige', L.stuetzen === 'wenige')}${opt('bru', 'jede', 'An jeder Kante', L.stuetzen === 'jede')}</div>` : ''}
    ${L.mat === 'kristall' && fuss ? `<div class="label">Kristallzacken</div><div class="row">${bought ? opt('brz', 'an', 'An', b.brz === 'an') + opt('brz', 'aus', 'Aus', b.brz === 'aus')
      : `<button class="btn" data-brz="kaufen">✨ Zacken kaufen −${fmt(zk.cost)}${Object.keys(zk.mat).length ? ' · ' + matText(zk.mat) : ''}</button>`}</div>` : ''}
    <div class="label">${ng ? 'Gleis darauf' : 'Weg oder Gleis darauf'}</div>
    ${nw ? `<div class="row"><button class="btn" id="p-bkweg">🗑️ Weg entfernen +${fmt(nw * ITEMS.weg.cost)}</button></div>`
      : ng ? `<div class="row"><button class="btn" id="p-bkweg">🗑️ Gleis entfernen +${fmt(ng * ITEMS.schiene.cost)}</button></div>${bkRailFull(b) ? '' : '<p class="muted">Erst durchgehend, mit Schiene oben an beiden Enden, fahren Züge hinüber.</p>'}`
      : '<p class="muted">Zieh einen Weg oder eine Schiene von der einen Anhöhe über die Brücke zur anderen.</p>'}
    <div class="row"><button class="btn danger" id="p-del" aria-label="Brücke abreißen">🗑️ Abreißen +${fmt((paid.money || 0) + nw * ITEMS.weg.cost + ng * ITEMS.schiene.cost)}</button><button class="btn ghost" id="p-close">Schließen</button></div>`,
    () => bkAt(x, y) ? openBkInfo(x, y) : closePanel());
  const set = ch => { undoable(() => brSet(ref, ch)); openBkInfo(x, y); };
  for (const e of el.querySelectorAll('[data-bkart]')) e.onclick = () => set({ mat: e.dataset.bkart });
  for (const e of el.querySelectorAll('[data-brc]')) e.onclick = () => set({ col: e.dataset.brc === '' ? null : +e.dataset.brc });
  for (const e of el.querySelectorAll('[data-brb]')) e.onclick = () => set({ deck: e.dataset.brb });
  for (const e of el.querySelectorAll('[data-bru]')) e.onclick = () => set({ stuetzen: e.dataset.bru });
  for (const e of el.querySelectorAll('[data-brz]')) e.onclick = () => set({ zacken: e.dataset.brz });
  if ($('p-bkweg')) $('p-bkweg').onclick = () => { undoable(() => bkDemolishAt(x, y)); openBkInfo(x, y); };
  $('p-del').onclick = () => { closePanel(); undoable(() => bkDemolishAt(x, y, true)); };
  $('p-close').onclick = closePanel;
}
