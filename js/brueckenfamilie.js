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
  stahl: { name: 'Metall', deck: 'muster', anhoehe: { tech: 'bahn' } },     // an Anhöhen wie bisher erst mit der Eisenbahn
  stein: { name: 'Stein', deck: 'belag', lock: { lm: 'klippe:1' } },          // wie Steinmetz (160c C6, vorläufig)
  kristall: { name: 'Kristall', deck: 'muster', lock: { lm: 'kristall:1' } },  // wie die Kristallmine
};
// Material gesperrt? Text oder null (Leiste, Fenster, Bau). Metall an der Anhöhe: wie bisher „erst mit der Eisenbahn“
function brMatLock(mat, at = 'anhoehe') {
  const M = BR_MAT[mat];
  if (!M) return null;
  const def = { ...(M.lock && !(at === 'wasser' && mat === 'stein') ? M.lock : {}), ...(at === 'anhoehe' && M.anhoehe ? M.anhoehe : {}) };   // übers Wasser ist Stein frei (gab es dort immer, Nutzer 13.10.2026)
  if (!Object.keys(def).length || typeof unlockOk !== 'function' || unlockOk(def, 'brmat:' + mat)) return null;
  if (def.tech === 'bahn') return `${M.name}: erst mit der Eisenbahn`;
  return `${M.name}: erst mit ${unlockText(def, false)}`;
}
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
const brStamp = (o, at, look, n = 1) => { o.brp = { ...brPrice(look, at, n), k: brSig(o, at) }; };   // nach dem Setzen der Altfelder aufrufen; Anhöhe: n = Felder
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
    L.mat = BR_MAT[o.art] && Object.prototype.hasOwnProperty.call(BR_MAT, o.art) ? o.art : 'holz';   // Anhöhe: Material steht in art (160c C6)
    if (rail) L.fam = 'bahn';
    else if (Array.isArray(o.weg) && o.weg.some(Boolean)) { L.deck = 'belag'; L.belag = o.weg.find(Boolean); }
    return L;
  }
  return L;
}
// Aussehen einer Brücke (jeder Träger): neues Format (gültiges brp) aus den br-Feldern, sonst aus den Altfeldern
function brLook(o, at) {
  const L = brLegacyLook(o, at);
  if (at === 'anhoehe') return brAnhLook(o, L);
  if (!brIsNew(o, at)) return L;
  const id = at === 'anhoehe' ? o.art : o.brm, mat = BR_MAT[id] ? id : L.mat, same = mat === L.mat;   // fehlt ein Feld: wie bisher (gleiches Material) bzw. Standard
  return { at, fam: L.fam, mat, col: same ? L.col : brIdx(o.brc), plank: mat === 'holz' ? (same ? L.plank : brIdx(o.brw)) : null,   // Rot/Ziegel: Farbe aus der Art
    deck: o.brb === 'belag' || o.brb === 'muster' ? o.brb : same ? L.deck : BR_MAT[mat].deck, belag: L.belag || (typeof o.style === 'string' ? o.style : null),
    licht: o.brl === 'an' || o.brl === 'aus' ? o.brl : same ? L.licht : null, ...(o.brl == null && same && L.lichtGratis ? { lichtGratis: true } : {}),
    ...(same && L.kind ? { kind: L.kind } : {}),
    zacken: mat === 'kristall' && L.fam === 'fuss' && o.brz === 'an',
    stuetzen: mat === 'holz' && L.fam === 'fuss' && (o.bru === 'keine' || o.bru === 'jede') ? o.bru : 'wenige' };
}
// Anhöhe (160c C6): das Aussehen steht immer in den eigenen Feldern (art, brc, brw, brb, brl, brz, bru) – auch ohne brp. Die live Fassung v1016
// liest state.bruecken streng und verwirft brp (Schlüssel k), behält aber diese Felder; brp gilt nur fürs Geld
function brAnhLook(o, L) {
  o = o && typeof o === 'object' ? o : {};
  const mat = L.mat, fuss = L.fam === 'fuss';
  return { ...L, col: brIdx(o.brc), plank: mat === 'holz' ? brIdx(o.brw) : null, deck: o.brb === 'belag' || o.brb === 'muster' ? o.brb : L.deck,
    licht: o.brl === 'an' || o.brl === 'aus' ? o.brl : null, zacken: mat === 'kristall' && fuss && o.brz === 'an',
    stuetzen: mat === 'holz' && fuss && (o.bru === 'keine' || o.bru === 'jede') ? o.bru : 'wenige' };
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
  anhoehe: { holz: brMoney(BK_ARTEN.holz.cost, BK_ARTEN.holz.mat), stahl: brMoney(BK_ARTEN.stahl.cost, BK_ARTEN.stahl.mat),
    stein: brMoney(120, { quader: 3, bretter: 3 }), kristall: brMoney(800, { kristall: 4, metall: 1, bretter: 3 }) },   // + 3 Bretter („Gerüst“): v1016 erstattet Stein/Kristall ohne brp wie Holz (60 + 3 Bretter) – nie mehr als bezahlt
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
// Wasser (160c D3, Nutzer 13.10.2026): ein neues Feld neben einer Brücke bekommt ihr Aussehen samt gekauftem Licht und gekauften Zacken (an/aus) –
// eine Brücke, ein Aussehen. Liegen mehrere daneben: die längste (sie gewinnt auch beim Zusammenwachsen, wbUnify). Vor dem Setzen des Felds rufen
function wbSpanNew(x, y) {
  const cells = bridgeSpan(x, y), L = brSpanLook(x, y), A = brSpanAnchor(cells), a = state.tiles.get(A[0] + ',' + A[1]) || {};
  const zk = L.mat === 'kristall' && (a.brz === 'an' || a.brz === 'aus') ? a.brz : null;
  return { look: { ...L, zacken: !!zk }, zk, raw: { brc: a.brc, brw: a.brw }, brk: L.kind && WEG_BRIDGE[L.kind] ? L.kind : brFallback('wasser', L.mat).brk, n: cells.length };
}
function wbNewSpec(x, y) {
  let best = null;
  for (const [dx, dy] of DIRS) if (isWegBridge(state.tiles.get((x + dx) + ',' + (y + dy)))) { const S = wbSpanNew(x + dx, y + dy); if (!best || S.n > best.n) best = S; }
  return best;
}
// Zwei Brücken wachsen zusammen (bauen von beiden Ufern, ablegen, kopieren – Nutzer 13.10.2026): die Felder mit dem häufigsten Aussehen gewinnen,
// die anderen übernehmen es kostenlos (jedes Feld erstattet weiter sein Bezahltes). Nach dem Setzen rufen; true, wenn etwas angeglichen wurde
function wbUnify(x, y) {
  const cells = bridgeSpan(x, y);
  if (cells.length < 2) return false;
  const ts = cells.map(([a, b]) => state.tiles.get(a + ',' + b)), zkOf = t => t.brz === 'an' || t.brz === 'aus' ? t.brz : '';
  const sig = t => { const L = brLook(t, 'wasser'); return [L.mat, L.col, L.plank, L.deck, L.licht, zkOf(t), L.stuetzen].join('|'); };
  const sigs = ts.map(sig), cnt = new Map();
  for (const s of sigs) cnt.set(s, (cnt.get(s) || 0) + 1);
  if (cnt.size < 2) return false;
  const win = [...cnt].sort((p, q) => q[1] - p[1])[0][0], ref = ts[sigs.indexOf(win)], L = brLook(ref, 'wasser'), zk = L.mat === 'kristall' ? zkOf(ref) || null : null;
  const brk = L.kind && WEG_BRIDGE[L.kind] ? L.kind : brFallback('wasser', L.mat).brk, raw = { brc: ref.brc, brw: ref.brw };
  for (const [i, t] of ts.entries()) if (sigs[i] !== win) { const p = brPaid(t, 'wasser'); brWriteLook(t, { ...L, zacken: !!zk }, brk, zk, raw); t.brp = { ...p, k: brSig(t, 'wasser') }; }
  groundVersion++;
  return true;
}
// Felder einer Wasser-Wegbrücke aus ihrem Aussehen schreiben (160c D3: Setzer, Bau, Kopie – nie Rohfelder kopieren). brk: Art für ältere
// Fassungen (bekannte Art), zk: gekaufte Zacken 'an'|'aus'. raw: Farben, wie sie in brc/brw stehen sollen (alte Rote/Ziegel: ohne brc fällt die
// Farbe auf die Art zurück – darum roh, nie die Rückfallfarbe hineinschreiben); ohne raw: Farbe und Planken des Aussehens
function brWriteLook(t, look, brk, zk = null, raw = null) {
  t.brk = brk; t.brm = look.mat; t.brb = look.deck === 'belag' ? 'belag' : 'muster';
  const col = raw ? raw.brc : look.col, plank = raw ? raw.brw : look.plank;
  if (col != null) t.brc = col; else delete t.brc;
  if (look.mat === 'holz' && plank != null) t.brw = plank; else delete t.brw;
  if (look.licht === 'an' || look.licht === 'aus') t.brl = look.licht; else delete t.brl;
  if (look.mat === 'kristall' && (zk === 'an' || zk === 'aus')) t.brz = zk; else delete t.brz;
  if (look.mat === 'holz' && (look.stuetzen === 'keine' || look.stuetzen === 'jede')) t.bru = look.stuetzen; else delete t.bru;
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
  if (at === 'wasser') { const S = wbNewSpec(x, y); if (S) return S.look; }    // 160c D3: die längste Brücke daneben, samt gekauftem Licht und Zacken
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
// ---------------------------------------------------------------------------
// Stützen (160c C1): auf den Kachelkanten zwischen den Feldern der Lücke (Kante k zwischen Feld k−1 und k, 1 … n−1), nie an der Wand –
// so bleibt die Feldmitte darunter frei (ein Weg quer unter der Brücke). Holz-Fußgänger nach bru: keine / wenige / jede; „wenige“ = jede
// zweite Kante von beiden Enden her (min(k, n−k) ungerade: n 4 → 1, 3 wie Entwurf 3b; n 2 → 1; n 3 → 1, 2). Holz-Bahn: jede Kante (Böcke).
// Stein: Pfeiler je 2 Felder von außen (n 4 → 2; n 6 → 2, 4); ungerade Länge ab 5: der Mittelbogen überspannt 3 Felder (n 5 → 1, 4 = Bögen
// 1-3-1; n 7 → 2, 5 = 2-3-2; Nutzer 12.10.2026, C8); Stein-Viadukt (Bahn, Nutzer 12.10.2026: Variante B) an jeder Kante.
// Metall und Kristall spannen frei.
const brSteinPier = (k, n) => n % 2 && n >= 5 ? k === (n - 3) / 2 || k === (n + 3) / 2 : (k <= n / 2 ? k : n - k) % 2 === 0;
function brSupports(look, n) {
  const out = [];
  if (!look || !(n >= 2)) return out;
  for (let k = 1; k < n; k++) {
    const m = Math.min(k, n - k);
    if (look.mat === 'holz' ? (look.fam === 'bahn' || look.stuetzen === 'jede' || (look.stuetzen !== 'keine' && m % 2 === 1)) : look.mat === 'stein' ? look.fam === 'bahn' || brSteinPier(k, n) : false) out.push(k);
  }
  return out;
}
// ---------------------------------------------------------------------------
// Höhenprofil (160c C2, PLAN §2.3): EINE Quelle für die Deckhöhe h(t) der Anhöhen-Brücke – Maler, Weg, Figuren, Antippen, Rahmen, Schatten,
// Schilder (G8). t längs ab der Mitte von Feld 0, die Lücke reicht von A = −½ bis B = n − ½. Fußgänger: Bogen HILL_H + pk·sin(π(t − A)/n),
// pk = ½·20,4·(n/2)^0,6, bei 1 Feld ein Buckel von 5. Bahn (Gleis) immer flach. Nie NaN (G9): t geklemmt, n begrenzt
function brPeak(fam, n) {
  n = Math.round(+n);
  if (fam !== 'fuss' || !(n >= 1)) return 0;
  n = Math.min(n, BK_READ_MAX);
  return n === 1 ? 5 : 0.5 * 20.4 * Math.pow(n / 2, 0.6);
}
function brDeckHFn(fam, n) {
  const pk = brPeak(fam, n), N = Math.min(Math.max(1, Math.round(+n) || 1), BK_READ_MAX);
  if (!pk) return () => HILL_H;
  return t => { const u = Number.isFinite(t) ? Math.max(0, Math.min(1, (t + 0.5) / N)) : 0; return HILL_H + pk * Math.sin(Math.PI * u); };
}
// Höchste Deckhöhe im Ausschnitt [t0, t1] (Rahmen, Antippen)
function brDeckHMax(fam, n, t0, t1) {
  const N = Math.min(Math.max(1, Math.round(+n) || 1), BK_READ_MAX), m = (N - 1) / 2, f = brDeckHFn(fam, N);
  return m >= t0 && m <= t1 ? HILL_H + brPeak(fam, N) : Math.max(f(t0), f(t1));
}
// ---------------------------------------------------------------------------
// Steinbrücke (160c C3, plan-160c/C3.md): Bögen zwischen Wand und Pfeilern (brSupports, Pfeiler mittig auf der Kante, Breite 2·pw). Je Bogen
// die Formel des abgenommenen Entwurfs (tools/brueckenfamilie-entwurf.js stone(), Entwurf 10 Stufe 3): Ansatz 23 an der Wand, 13 am
// Pfeiler, Scheitel gap unter dem Deck, Leibung ≥ cover unter dem Deck – das harte Minimum des Entwurfs gab den „Knick an der Wand“,
// hier ein glattes (brSmin, höchstens r/4 tiefer). Eine Quelle für Bild, Regeln, Antippen, Schatten (G8). Nie NaN (G9)
// ---------------------------------------------------------------------------
const BR_STEIN = { sp: 3, hp: 13, gap: 7.5, pw: 0.09, cover: 3, r: 2, ring: 3.2, par: 6.5 };   // par: Balustrade über dem Deck (Maler, Laternen C7)
const brSmin = (a, b, r) => { if (!(r > 0)) return Math.min(a, b); const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / r)); return b + (a - b) * h - r * h * (1 - h); };
function brStoneGeom(fam, n, piers, S = BR_STEIN) {
  const N = Math.min(Math.max(1, Math.round(+n) || 1), BK_READ_MAX), A = -0.5, B = N - 0.5, hf = brDeckHFn(fam, N);
  const P = [...new Set(Array.isArray(piers) ? piers.filter(k => Number.isInteger(k) && k > 0 && k < N) : [])].sort((p, q) => p - q);
  const E = [A, ...P.map(k => k - 0.5), B], m = E.length - 1, arcs = [];
  for (let j = 0; j < m; j++) {
    const a = E[j] + (j ? S.pw : 0), c = E[j + 1] - (j < m - 1 ? S.pw : 0), sa = j ? S.hp : HILL_H - S.sp, sc = j < m - 1 ? S.hp : HILL_H - S.sp;
    arcs.push({ a, c, sa, sc, rise: Math.max(0, hf((a + c) / 2) - S.gap - (sa + sc) / 2) });
  }
  const arcAt = t => arcs.find(q => t >= q.a && t <= q.c) || null;
  const ri = t => {                                                          // Unterkante des Bogens bei t; null = Pfeiler
    const q = Number.isFinite(t) ? arcAt(t) : null;
    if (!q) return null;
    const u = Math.max(0, Math.min(1, (t - q.a) / (q.c - q.a)));
    return brSmin(q.sa + (q.sc - q.sa) * u + q.rise * Math.sqrt(Math.max(0, Math.sin(Math.PI * u))), hf(t) - S.cover, S.r);
  };
  const memo = new Map(), ts = M => {                                        // Stützpunkte je Bogen, an den Ansätzen dicht, Enden exakt (weltfest)
    if (!memo.has(M)) memo.set(M, arcs.flatMap(q => Array.from({ length: M + 1 }, (_, j) => j === 0 ? q.a : j === M ? q.c : q.a + (q.c - q.a) * (1 - Math.cos(Math.PI * j / M)) / 2)));
    return memo.get(M);
  };
  const pierHit = (t, r = 0) => P.some(k => Math.abs(t - (k - 0.5)) < S.pw + r);
  return { fam, n: N, A, B, hf, S, piers: P, arcs, ri, ts, pierHit, low: (t, g0 = 0) => { const v = ri(t); return v == null ? g0 : v; } };
}
// Fachwerk der Bahn-Brücken Metall/Kristall B2 (160c C5): Höhe T über dem Deck, Gurt-Einzug je Ende (Maler, Lampen C7)
const BR_TRUSS = { T: 11, inset: 0.15 };
// Lampen je Modell (160c C7, abgenommen: tools/brueckenlicht-entwurf.js; plan-160c/karte-C7-bau.md §1). art/fam wie bkGeom (Maler-Art,
// Familie). ts: Orte längs (Feldkanten bzw. Fachwerkknoten; null = Streifen je Viertel), s: Querlage (hinten −s, vorn +s), up: Fuß über
// dem Deck, r: Schein × z, back/front: Lage, an deren Ende die Lampen kommen (hinten nach dem Deck, vorn zuletzt). Licht prüft der Aufrufer
function brLampSpots(art, fam, n, max = BK_READ_MAX) {                     // max: Wasser (160c D2) bis zur ganzen Länge – ab 9 Feldern Punkte nur auf den Feldkanten
  const N = Math.min(Math.max(1, Math.round(+n) || 1), max), A = -0.5, B = N - 0.5, W = BK_W, grid = K => Array.from({ length: N * K + 1 }, (_, k) => A + k / K);
  if (art === 'stein') return { form: 'laterne', ts: N > 1 ? grid(1).slice(1, -1) : [0], s: W, up: BR_STEIN.par, r: 18, back: 'd', front: 'o' };   // innere Kanten; 1 Feld: Mitte
  if (art === 'kristall') return { form: 'streifen', ts: null, s: fam === 'fuss' ? W : W + 0.02, up: 0, r: 7, tint: 'blue', back: fam === 'fuss' ? 'h' : 't1', front: 't2' };
  if (fam === 'bahn' && art === 'stahl') {                                   // Punkte am Obergurt, auf den Fachwerkknoten
    const a = A + BR_TRUSS.inset, b = B - BR_TRUSS.inset;
    return { form: 'punkt', ts: Array.from({ length: 2 * N + 1 }, (_, k) => a + (b - a) * k / (2 * N)), s: W + 0.02, up: BR_TRUSS.T + 0.6, day: '#e9eef0', r: 4, back: 'd', front: 'o' };
  }
  return { form: 'punkt', ts: grid(N >= 9 ? 1 : 2), s: W, up: fam === 'bahn' ? 8.6 : art === 'stahl' ? 7 : 6.6, day: art === 'stahl' ? '#eef3f2' : '#f3e3b0', r: 5, back: 'd', front: 'o' };   // auf jedem 2. Pfosten
}
// Lichtraum unter dem Deck (G8: Maler, bkTooTall, bkUnderError): ohne Stein BK_CLEAR; Stein (Bogen und Viadukt): unter dem Bogen über
// [t − r, t + r] (−1), am Pfeiler −1 (nichts, auch keine Blumen)
function brClear(S = null, t = 0, r = 0) {
  if (!S) return BK_CLEAR;
  if (!Number.isFinite(t) || S.pierHit(t, r)) return -1;
  const a = S.ri(Math.max(S.A, t - r)), b = S.ri(Math.min(S.B, t + r));    // ri je Bogen konkav → Minimum an den Enden
  return Math.min(BK_CLEAR, Math.min(a == null ? Infinity : a, b == null ? Infinity : b) - 1);
}
