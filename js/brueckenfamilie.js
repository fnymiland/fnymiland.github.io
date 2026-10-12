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
// Bezahlter Preis: { money, bretter?, quader?, metall?, kristall?, holz?, k } – ganze Zahlen ≥ 0, nur bekannte Rohstoffe; k: wofür bezahlt (brSig)
function brPaidOk(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p) || !Number.isInteger(p.money) || p.money < 0) return false;
  for (const [r, v] of Object.entries(p)) if (r === 'k' ? typeof v !== 'string' : r !== 'money' && (!Object.prototype.hasOwnProperty.call(RES, r) || !Number.isInteger(v) || v < 0)) return false;   // nur eigene Rohstoffe (nie constructor …)
  return true;
}
// Wofür bezahlt wurde: die Altfelder, die eine ältere App-Version liest (Art bzw. Design). Die Fassung v1016 behält brp, ändert aber Art/Design
// ohne es anzufassen (setBridgeKind, setCrossing, Aufschütten, Kopie mit Schranken) – passt k nicht mehr, ist brp veraltet: dann gelten
// die Altfelder samt alter Preistabelle (nie mehr erstatten, als zuletzt bezahlt wurde)
function brSig(o, at) {
  o = o && typeof o === 'object' ? o : {};
  if (at === 'wasser') return 'w:' + (typeof bridgeKind === 'function' ? bridgeKind(o) : '');
  if (at === 'gleis') return 'g:' + (o.bridge ? 1 : 0);
  if (at === 'uebergang') return 'u:' + ((typeof footPaidOf === 'function' && footPaidOf(o)) || '');
  if (at === 'anhoehe') return 'a:' + (typeof o.art === 'string' ? o.art : '');
  return '';
}
const brIsNew = (o, at) => !!o && brPaidOk(o.brp) && o.brp.k === brSig(o, at);   // neues Format, und brp gehört noch zu dieser Art
const brStamp = (o, at, look) => { o.brp = { ...brPrice(look, at), k: brSig(o, at) }; };   // nach dem Setzen der Altfelder aufrufen
const brNoK = p => { const { k, ...c } = p; return c; };
// Altfelder deuten (Nutzer 11.10.2026: „alte Brücken bekommen die neuen Modelle, Material und Farbe so nah wie möglich“).
// at: 'wasser' (Wegbrücke übers Wasser) · 'gleis' (Gleisbrücke übers Wasser) · 'uebergang' (Fußgängerbrücke am Bahnübergang) · 'anhoehe'
function brLegacyLook(o, at) {
  o = o && typeof o === 'object' ? o : {};
  const L = { at, fam: 'fuss', mat: 'holz', col: brIdx(o.brc), plank: brIdx(o.brw), deck: 'muster', belag: null, licht: null, zacken: false, stuetzen: 'wenige' };
  if (at === 'gleis') { L.fam = 'bahn'; return L; }
  if (at === 'wasser') {
    const kind = typeof bridgeKind === 'function' ? bridgeKind(o) : 'holz', st = typeof o.style === 'string' ? o.style : 'sand';
    if (WEG_BRIDGE[kind]) L.kind = kind;                                  // alte Art: ihr Preis gilt weiter (brPrice), bis das Material wechselt
    if (kind === 'stein' || kind === 'ziegel') { L.mat = 'stein'; L.deck = 'belag'; L.belag = st; L.plank = null; if (kind === 'ziegel' && L.col == null) L.col = BR_ZIEGEL_COL; }
    else if (kind === 'rot') { if (L.col == null) L.col = BR_ROT_COL; if (L.plank == null) L.plank = BR_ROT_PLANK; }
    return L;
  }
  if (at === 'uebergang') {
    const fp = o.footPaid;
    L.kind = FOOT_STYLES[fp] ? fp : 'holz';                               // altes Design: sein Preis gilt weiter (brPrice)
    if (fp === 'stein') L.mat = 'stein';                                    // die alte Steinbrücke zeigt ihr eigenes Deck, nicht den Weg
    else if (fp === 'kristall') { L.mat = 'kristall'; L.licht = 'an'; L.lichtGratis = true; }   // leuchtet heute schon – ohne Aufpreis
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
  if (!brIsNew(o, at)) return L;
  const id = at === 'anhoehe' ? o.art : o.brm, mat = BR_MAT[id] ? id : L.mat, same = mat === L.mat;   // fehlt ein Feld: wie bisher (gleiches Material) bzw. Standard
  return { at, fam: L.fam, mat, col: same ? L.col : brIdx(o.brc), plank: mat === 'holz' ? (same ? L.plank : brIdx(o.brw)) : null,   // Rot/Ziegel: Farbe aus der Art
    deck: o.brb === 'belag' || o.brb === 'muster' ? o.brb : same ? L.deck : BR_MAT[mat].deck, belag: L.belag || (typeof o.style === 'string' ? o.style : null),
    licht: o.brl === 'an' || o.brl === 'aus' ? o.brl : same ? L.licht : null, ...(o.brl == null && same && L.lichtGratis ? { lichtGratis: true } : {}),
    ...(same && L.kind ? { kind: L.kind } : {}),
    zacken: mat === 'kristall' && L.fam === 'fuss' && o.brz === 'an',
    stuetzen: mat === 'holz' && L.fam === 'fuss' && (o.bru === 'keine' || o.bru === 'jede') ? o.bru : 'wenige' };
}
// ---------------------------------------------------------------------------
// Geld (160c A4): Kosten-Objekt { money, <Rohstoff>: n }. Grundpreis je Feld (Übergang: je Brücke). VORLÄUFIG (Nutzer 11.10.2026: Geld und
// Fortschritt später besprechen; Licht kostet extra, Kristall „fürstlich“). Die alten Preise bleiben: Holz/Stein übers Wasser, Holz-Gleis,
// Holz/Stein am Übergang, Holz/Stahl zwischen Anhöhen. Jede Brücke merkt sich, was bezahlt wurde (brp) – erstattet wird genau das (brPaid);
// ohne brp nach den alten Tabellen (eingefroren in tests/bruecken-altversion.test.js). Neuer Preis ≥ Erstattung des Rückfalls (brFallback)
// je Rohstoff: eine ältere App-Version, die nur den Rückfall kennt, erstattet nie mehr als bezahlt
// ---------------------------------------------------------------------------
const brMoney = (cost, mat) => ({ money: cost || 0, ...(mat || {}) });
const BR_COST = {
  wasser: { holz: brMoney(WEG_BRIDGE.holz.cost, WEG_BRIDGE.holz.mat), stein: brMoney(WEG_BRIDGE.stein.cost, WEG_BRIDGE.stein.mat),
    stahl: brMoney(100, { quader: 2, metall: 2 }), kristall: brMoney(400, { quader: 2, kristall: 3, metall: 1 }) },
  gleis: { holz: brMoney(BRIDGE.cost, BRIDGE.mat), stein: brMoney(80, { holz: 2, metall: 2, quader: 3 }), stahl: brMoney(100, { holz: 2, metall: 4 }),
    kristall: brMoney(600, { holz: 2, metall: 2, kristall: 4 }) },
  uebergang: { holz: { ...FOOT_STYLES.holz.cost }, stein: { ...FOOT_STYLES.stein.cost }, stahl: { money: 200, bretter: 4, metall: 6 }, kristall: { money: 1500, kristall: 10, metall: 2 } },
  anhoehe: { holz: brMoney(BK_ARTEN.holz.cost, BK_ARTEN.holz.mat), stahl: brMoney(BK_ARTEN.stahl.cost, BK_ARTEN.stahl.mat), stein: brMoney(120, { quader: 3 }),
    kristall: brMoney(800, { kristall: 4, metall: 1 }) },
};
const BR_OPT = { licht: { feld: { money: 20, metall: 1 }, ganz: { money: 60, metall: 2 } }, zacken: { feld: { money: 150, kristall: 2 }, ganz: { money: 400, kristall: 5 } } };
const brAdd = (a, b, n = 1) => { for (const [r, v] of Object.entries(b || {})) a[r] = (a[r] || 0) + v * n; return a; };
// Preis im Aussehen look: n Felder (Übergang: die Brücke), samt gekaufter Optionen (licht gesetzt, zacken)
function brPrice(look, at, n = 1) {
  const tab = BR_COST[at] || BR_COST.wasser, per = at === 'uebergang' ? 1 : n, opt = at === 'uebergang' ? 'ganz' : 'feld';
  let base = tab[look && look.mat] || tab.holz;
  if (look && look.kind && at === 'wasser' && WEG_BRIDGE[look.kind]) base = brMoney(WEG_BRIDGE[look.kind].cost, WEG_BRIDGE[look.kind].mat);   // alte Art: alter Preis
  if (look && look.kind && at === 'uebergang' && FOOT_STYLES[look.kind]) base = { ...FOOT_STYLES[look.kind].cost };
  const c = brAdd({ money: 0 }, base, per);
  if (look && look.licht && !look.lichtGratis) brAdd(c, BR_OPT.licht[opt], per);
  if (look && look.zacken) brAdd(c, BR_OPT.zacken[opt], per);
  return c;
}
// Was ein Brückenfeld (Übergang: die Brücke, Anhöhe: das ganze Bauwerk) gekostet hat – fürs Erstatten
function brPaid(o, at) {
  if (brIsNew(o, at)) return brNoK(o.brp);
  o = o && typeof o === 'object' ? o : {};
  if (at === 'wasser') { const B = WEG_BRIDGE[bridgeKind(o)] || WEG_BRIDGE.holz; return brMoney(B.cost, B.mat); }
  if (at === 'gleis') return brMoney(BRIDGE.cost, BRIDGE.mat);
  if (at === 'uebergang') { const id = footPaidOf(o); return id ? { ...(FOOT_STYLES[id] || FOOT_STYLES.holz).cost } : { money: 0 }; }
  if (at === 'anhoehe') { const n = Number.isInteger(o.n) && o.n > 0 ? o.n : 1; return brAdd({ money: 0 }, BR_COST.anhoehe[BK_ARTEN[o.art] ? o.art : 'holz'], n); }
  return { money: 0 };
}
// Kopie, Verlängern: nur eingeschaltete Optionen kommen mit (ausgeschaltete gekaufte fallen weg)
const brOnLook = look => ({ ...look, licht: look.licht === 'an' ? 'an' : null, zacken: !!look.zacken });
// Rückfallfelder für ältere Fassungen (Bauplan 1.6): was sie als Art bzw. Design lesen
function brFallback(at, mat) {
  if (at === 'wasser') return { brk: mat === 'holz' ? 'holz' : 'stein' };
  if (at === 'uebergang') return { footPaid: mat === 'stein' ? 'stein' : mat === 'kristall' ? 'kristall' : 'holz' };
  if (at === 'anhoehe') return { art: mat };
  return {};
}
// Kosten-Objekt ↔ { cost, mat } (costOf, demolishInfo)
const brCostMat = c => { const { money, ...mat } = c; return { cost: money || 0, mat }; };
// Aussehen eines neuen Brückenfelds übers Wasser: wie das Brückenfeld daneben (verlängern – derselbe Nachbar in derselben Reihenfolge wie
// build, das dessen Art und br-Felder übernimmt: Preis und Erstattung aus einer Quelle), sonst nach dem Wegstil bzw. Holz (160c F3: später
// die Leiste). Beim Planen zählen schon geplante Felder (BR_PLAN_LOOK, planScan) – wie beim Bauen, wo jedes Feld vom vorigen erbt
let BR_PLAN_LOOK = null;
function brNewLook(x, y, at) {
  const want = at === 'gleis' ? (t => !!t && t.b === 'schiene' && !!t.bridge) : isWegBridge;
  for (const [dx, dy] of DIRS) {
    const k = (x + dx) + ',' + (y + dy), t = state.tiles.get(k);
    if (want(t)) return brOnLook(brLook(t, at));
    if (BR_PLAN_LOOK && BR_PLAN_LOOK.has(k)) return BR_PLAN_LOOK.get(k);
  }
  return at === 'gleis' ? brLegacyLook({}, 'gleis') : brLegacyLook({ style: currentStyle('weg') }, 'wasser');
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
    if (t && brIsNew(t, t.b === 'schiene' ? 'gleis' : 'wasser') && (!bestNew || rank(c) < rank(bestNew))) bestNew = c;
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
