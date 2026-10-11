'use strict';
// ---------------------------------------------------------------------------
// Brückenfamilie (Block 160c, Bauplan PLAN-160c.md): alle Brücken – Wegbrücken übers Wasser, Gleisbrücken übers Wasser, Fußgängerbrücke am
// Bahnübergang, Brücke zwischen Anhöhen – haben EIN Aussehen: Familie (Fußgänger = Bogen, Bahn = flach; folgt aus dem Inhalt: Gleis → Bahn),
// Material (holz · stahl „Metall“ · stein · kristall), Farbe (brc, Index in BRIDGE_COLS), Planken (brw), Deck (Belag des Wegs oder Muster
// der Brücke), Licht, Zacken (nur Kristall-Fußgänger), Stützen (nur Holz-Fußgänger: keine/wenige/jede Kachelkante).
// Die Träger bleiben, wo sie sind (Kachel mit bridge, Übergangsfeld, state.bruecken). Gelesen wird NUR über brLook: ohne gültiges brp
// (bezahlter Preis = Kennung „neues Format“) deutet brLegacyLook die Altfelder (brk/brc/brw, footPaid, art, weg/gleis) – Kacheln werden beim
// Laden nie umgeschrieben (Live-Spiegel, Cloud-Fingerabdruck, ältere App-Versionen). Nie werfen: Kacheln kommen im Live-Spiegel roh an.
// ---------------------------------------------------------------------------
// Materialien. deck: Standard des Decks (Stein zeigt den Belag des Wegs, die anderen ihr eigenes Muster)
const BR_MAT = {
  holz: { name: 'Holz', deck: 'muster' },
  stahl: { name: 'Metall', deck: 'muster' },
  stein: { name: 'Stein', deck: 'belag' },
  kristall: { name: 'Kristall', deck: 'muster' },
};
const BR_MAT_IDS = ['holz', 'stahl', 'stein', 'kristall'];
const BR_KEYS = ['brm', 'brc', 'brw', 'brb', 'brl', 'brz', 'bru'];       // Aussehen an Kachel und Bauwerk (dazu brp: bezahlter Preis)
const BR_ROT_COL = 3, BR_ZIEGEL_COL = 8, BR_ROT_PLANK = 5;                // alte Rote Bogenbrücke / Ziegelbrücke: Farbe so nah wie möglich
const brIdx = v => (Number.isInteger(v) && v >= 0 && v < 64 ? v : null);  // Farbindex: Müll → null (Farbe des Materials)
// Bezahlter Preis: { money, bretter?, quader?, metall?, kristall?, holz? } – ganze Zahlen ≥ 0, nur bekannte Rohstoffe
function brPaidOk(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p) || !Number.isInteger(p.money) || p.money < 0) return false;
  for (const [r, v] of Object.entries(p)) if (r !== 'money' && (!(r in RES) || !Number.isInteger(v) || v < 0)) return false;
  return true;
}
// Altfelder deuten (Nutzer 11.10.2026: „alte Brücken bekommen die neuen Modelle, Material und Farbe so nah wie möglich“).
// at: 'wasser' (Wegbrücke übers Wasser) · 'gleis' (Gleisbrücke übers Wasser) · 'uebergang' (Fußgängerbrücke am Bahnübergang) · 'anhoehe'
function brLegacyLook(o, at) {
  o = o && typeof o === 'object' ? o : {};
  const L = { at, fam: 'fuss', mat: 'holz', col: brIdx(o.brc), plank: brIdx(o.brw), deck: 'muster', belag: null, licht: null, zacken: false, stuetzen: 'wenige' };
  if (at === 'gleis') { L.fam = 'bahn'; return L; }
  if (at === 'wasser') {
    const kind = typeof bridgeKind === 'function' ? bridgeKind(o) : 'holz', st = typeof o.style === 'string' ? o.style : 'sand';
    if (kind === 'stein' || kind === 'ziegel') { L.mat = 'stein'; L.deck = 'belag'; L.belag = st; L.plank = null; if (kind === 'ziegel' && L.col == null) L.col = BR_ZIEGEL_COL; }
    else if (kind === 'rot') { if (L.col == null) L.col = BR_ROT_COL; if (L.plank == null) L.plank = BR_ROT_PLANK; }
    return L;
  }
  if (at === 'uebergang') {
    const fp = o.footPaid;
    if (fp === 'stein') L.mat = 'stein';                                    // die alte Steinbrücke zeigt ihr eigenes Deck, nicht den Weg
    else if (fp === 'kristall') { L.mat = 'kristall'; L.licht = 'an'; }      // leuchtet heute schon
    else if (fp === 'weg') { L.deck = 'belag'; L.belag = typeof o.style === 'string' ? o.style : 'sand'; }   // „Wie der Weg“ → Holz mit Belag
    return L;
  }
  if (at === 'anhoehe') {
    const rail = !!o.gleis && Array.isArray(o.gleis) && o.gleis.some(f => f != null);
    L.mat = o.art === 'stahl' ? 'stahl' : 'holz';
    if (rail) L.fam = 'bahn';
    else if (Array.isArray(o.weg) && o.weg.some(Boolean)) { L.deck = 'belag'; L.belag = o.weg.find(Boolean); }
    return L;
  }
  return L;
}
// Aussehen einer Brücke (jeder Träger): neues Format (gültiges brp) aus den br-Feldern, sonst aus den Altfeldern
function brLook(o, at) {
  const L = brLegacyLook(o, at);
  if (!o || !brPaidOk(o.brp)) return L;
  const id = at === 'anhoehe' ? o.art : o.brm, mat = BR_MAT[id] ? id : L.mat;
  return { at, fam: L.fam, mat, col: brIdx(o.brc), plank: mat === 'holz' ? brIdx(o.brw) : null,
    deck: o.brb === 'belag' || o.brb === 'muster' ? o.brb : BR_MAT[mat].deck, belag: L.belag,
    licht: o.brl === 'an' || o.brl === 'aus' ? o.brl : null,
    zacken: mat === 'kristall' && L.fam === 'fuss' && o.brz === 'an',
    stuetzen: mat === 'holz' && L.fam === 'fuss' && (o.bru === 'keine' || o.bru === 'jede') ? o.bru : 'wenige' };
}
// Speichern/Laden (state.js): die br-Felder eines Objekts streng prüfen – nur gültige Werte, sonst weglassen (= Standard)
function brClean(o) {
  const out = {};
  if (!o || typeof o !== 'object') return out;
  if (BR_MAT[o.brm]) out.brm = o.brm;
  if (brIdx(o.brc) != null && o.brc < BRIDGE_COLS.length) out.brc = o.brc;
  if (brIdx(o.brw) != null && o.brw < PLANK_COLS.length) out.brw = o.brw;
  if (o.brb === 'belag' || o.brb === 'muster') out.brb = o.brb;
  if (o.brl === 'an' || o.brl === 'aus') out.brl = o.brl;
  if (o.brz === 'an' || o.brz === 'aus') out.brz = o.brz;
  if (o.bru === 'keine' || o.bru === 'jede') out.bru = o.bru;
  if (brPaidOk(o.brp)) out.brp = { ...o.brp };
  return out;
}
// Gleisbrücke als Ganzes: zusammenhängende Gleisfelder mit bridge (über die Arme des Gleises, auch Kurven, Abzweige, Doppelgleis)
function brRailSpan(x, y) {
  const out = [], seen = new Set(), todo = [[x, y]];
  const isRb = (px, py) => { const t = state.tiles.get(px + ',' + py); return !!t && t.b === 'schiene' && !!t.bridge; };
  while (todo.length) {
    const [px, py] = todo.pop(), k = px + ',' + py;
    if (seen.has(k) || !isRb(px, py)) continue;
    seen.add(k); out.push([px, py]);
    for (const [dx, dy] of railArms(px, py)) todo.push([px + dx, py + dy]);
  }
  return out;
}
// Ein Aussehen je Brücke: das Feld der Spanne, das sie vertritt (Anker) – unter den Feldern im neuen Format (gültiges brp) das vorderste
// nach Maler-Reihenfolge rückwärts (kleinstes x+y, dann x), sonst das kleinste überhaupt. So zeichnet sich eine von einer älteren
// App-Version verlängerte Spanne (neues Feld ohne brp) wie die Brücke selbst. Gemerkt je Boden-Fassung
const brSpanCache = { v: -1, st: null, tiles: null, map: new Map() };
function brSpanAnchor(cells) {
  const rank = ([x, y]) => (x + y) * 1e5 + x;
  let best = null, bestNew = null;
  for (const c of cells) {
    if (!best || rank(c) < rank(best)) best = c;
    const t = state.tiles.get(c[0] + ',' + c[1]);
    if (t && brPaidOk(t.brp) && (!bestNew || rank(c) < rank(bestNew))) bestNew = c;
  }
  return bestNew || best;
}
function brSpanLook(x, y) {
  const C = brSpanCache, k = x + ',' + y;
  if (C.v !== groundVersion || C.st !== state || C.tiles !== state.tiles) { C.v = groundVersion; C.st = state; C.tiles = state.tiles; C.map.clear(); }
  if (C.map.has(k)) return C.map.get(k);
  const t = state.tiles.get(k);
  let look = null;
  if (t && t.b === 'weg' && t.bridge) {
    const cells = bridgeSpan(x, y), a = brSpanAnchor(cells), L = brLook(state.tiles.get(a[0] + ',' + a[1]), 'wasser');
    for (const [cx, cy] of cells) C.map.set(cx + ',' + cy, L);
    look = L;
  } else if (t && t.b === 'schiene' && t.bridge) {
    const cells = brRailSpan(x, y), a = brSpanAnchor(cells), L = brLook(state.tiles.get(a[0] + ',' + a[1]), 'gleis');
    for (const [cx, cy] of cells) C.map.set(cx + ',' + cy, L);
    look = L;
  } else if (t && t.cross && t.foot) look = brLook(t, 'uebergang');
  else if (typeof bkAt === 'function' && bkAt(x, y)) look = brLook(bkAt(x, y).b, 'anhoehe');
  C.map.set(k, look);
  return look;
}
