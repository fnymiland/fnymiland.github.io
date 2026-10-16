const { loadGame, game } = require('./helpers/load-game');

// 160c E2b (PLAN-160c §1.2–1.7): Gleisbrücke übers Wasser als Ganzes (brRailSpan) – Material, Farbe, Planken, Licht im Schienenfenster über
// brSet({ at: 'gleis', x, y }) → gbSet. Geld: je Feld das Bezahlte zurück, neuer Preis aus BR_COST.gleis; brp mit Kennung 'g:1'. Ältere Fassungen
// (v1016) erstatten fest BRIDGE (40 + 2 Holz + 2 Metall) – jeder neue Preis liegt je Rohstoff darüber (nie mehr erstattet als bezahlt)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000");
  game("for (let y = 0; y <= 40; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); recalc()");
});
// gerade O-W über Wasser 2–7 (Gleis y 5) mit Kurve am Ende nach Norden: 2,5 … 7,5 gerade, 8,5 Kurve, 8,4 … 8,2 nach Norden (Wasser bis x 8)
const bau = () => game(`(() => {
  for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water');
  for (let x = 0; x <= 8; x++) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, ...(x >= 2 ? { bridge: true } : {}) });
  for (let y = 4; y >= 0; y--) state.tiles.set('8,' + y, { b: 'schiene', lvl: 1, form: 0, ...(y >= 2 ? { bridge: true } : {}) });
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const felder = () => game("brRailSpan(4, 5).map(c => c.join(',')).sort()");
const wallet = () => game('({ money: state.money, ...state.res })');
const diff = (a, b) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = (b[k] || 0) - (a[k] || 0); if (d) o[k] = d; } return o; };

describe('Gleisbrücken übers Wasser: ganze Brücke, Material, Geld (160c E2b)', () => {
  it('Spanne: alle Gleisfelder mit bridge über die Arme (auch um die Kurve), Landgleis nicht', () => {
    bau();
    expect(felder()).toEqual(['2,5', '3,5', '4,5', '5,5', '6,5', '7,5', '8,2', '8,3', '8,4', '8,5']);
  });
  it('Material wechseln: ganze Brücke, Bezahltes zurück, neuer Preis je Feld; brp mit Kennung g:1; Modell im neuen Material', () => {
    bau();
    const w0 = wallet(), N = felder().length;
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'stahl' })")).toBe(true);
    const per = game("brPrice({ mat: 'stahl' }, 'gleis')"), alt = game("brPaid({}, 'gleis')");
    const want = {}; for (const k of new Set([...Object.keys(per), ...Object.keys(alt)])) { const d = ((alt[k] || 0) - (per[k] || 0)) * N; if (d) want[k] = d; }
    expect(diff(w0, wallet())).toEqual(want);
    for (const k of felder()) expect(game(`(t => [t.brm, t.brp && t.brp.k, brLook(t, 'gleis').mat])(state.tiles.get('${k}'))`), k).toEqual(['stahl', 'g:1', 'stahl']);
    expect(game('[gbAt(4, 5).G.mat, gbAt(8, 5).G.mat]')).toEqual(['stahl', 'stahl']);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'holz' })")).toBe(true);
    expect(diff(w0, wallet())).toEqual({});                                             // zurück zu Holz: Bilanz null
  });
  it('ältere Fassung erstattet nie mehr als bezahlt: jedes neue Material und Licht je Rohstoff ≥ BRIDGE', () => {
    for (const mat of ['holz', 'stein', 'stahl', 'kristall']) for (const licht of [null, 'an']) {
      const p = game(`brPrice({ mat: '${mat}', licht: ${JSON.stringify(licht)} }, 'gleis')`), alt = game('({ money: BRIDGE.cost, ...BRIDGE.mat })');
      for (const [r, v] of Object.entries(alt)) expect(p[r] || 0, mat + ' ' + r).toBeGreaterThanOrEqual(v);
    }
  });
  it('Farbe und Planken kostenlos (Planken nur Holz); Licht kaufen je Feld, an/aus kostenlos', () => {
    bau();
    const w0 = wallet(), N = felder().length;
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { col: 4 })")).toBe(true);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { plank: 2 })")).toBe(true);
    expect(diff(w0, wallet())).toEqual({});
    expect(game("[brSpanLook(8, 3).col, brSpanLook(8, 3).plank]")).toEqual([4, 2]);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'kaufen' })")).toBe(true);
    const opt = game("BR_OPT.licht.feld"), want = {}; for (const [k, v] of Object.entries(opt)) want[k] = -v * N;
    expect(diff(w0, wallet())).toEqual(want);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'aus' })")).toBe(true);
    expect(diff(w0, wallet())).toEqual(want);
    expect(game("brSpanLook(4, 5).licht")).toBe('aus');
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'stahl' })")).toBe(true);
    expect(game("[brSpanLook(4, 5).plank, brSpanLook(4, 5).licht]")).toEqual([null, 'aus']);   // gekauftes Licht kommt mit (Bezahltes zurück, neu mitbezahlt)
  });
  it('Sperren übers Wasser: Holz, Metall, Stein frei (Nutzer 15.10.2026), Kristall erst mit der Kristallinsel', () => {
    expect(game("['holz', 'stahl', 'stein'].map(m => brMatLock(m, 'gleis'))")).toEqual([null, null, null]);
    bau();
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'stein' })")).toBe(true);
    expect(game("gbAt(8, 3).G.mat")).toBe('stein');
  });
  it('gesperrtes Material (Kristall ohne Kristallinsel): nichts ändert sich', () => {
    bau();
    const w0 = wallet();
    expect(game("brMatLock('kristall', 'gleis')")).toMatch(/Kristall/);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'kristall' })")).toBe(false);
    expect(diff(w0, wallet())).toEqual({});
    expect(game("state.tiles.get('4,5').brm")).toBe(undefined);
  });
  it('Fenster: Schienenfeld auf der Brücke zeigt Material, Farbe, Planken, Licht; ein Knopf stellt die ganze Brücke um', () => {
    bau();
    game('openInfo(4, 5)');
    const html = game("document.getElementById('panel').innerHTML");
    expect(html).toMatch(/Gleisbrücke aus Holz/);
    expect(html).toMatch(/data-bkart="stahl"/);
    expect(html).toMatch(/data-brw=/);
    expect(html).toMatch(/data-brl="kaufen"/);
    game(`document.querySelector('#panel [data-bkart="stahl"]').click()`);
    expect(game("brSpanLook(8, 3).mat")).toBe('stahl');
    expect(game("document.getElementById('panel').innerHTML")).toMatch(/Gleisbrücke aus Metall/);
    game('undo()');
    expect(game("brSpanLook(8, 3).mat")).toBe('holz');
  });
});

// 160c E2c (F3): neue Gleisbrücke ohne Nachbarn nimmt das Material aus der Leiste des Brücken-Werkzeugs (Holz = wie bisher, ohne brp);
// Verlängern übernimmt das Aussehen der Brücke daneben; abgebucht = costOf = Plan-Preis; Abriss erstattet genau das Bezahlte
describe('Gleisbrücken übers Wasser: Bauen im neuen Format (160c E2c)', () => {
  const wasser = () => game("for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water'); state.techs.add('bahn'); state.techs.add('terraform'); terrainCache.clear(); waterChanged(); recalc()");
  const leiste = mat => game(`state.paintNew.bruecke = { form: BK_ART_IDS.indexOf('${mat}') }`);
  it('Leiste Metall: erstes Feld Metall, bezahlt = costOf; das nächste übernimmt es; Abriss gibt genau das Bezahlte zurück', () => {
    wasser(); leiste('stahl');
    expect(game("build('schiene', 1, 5, true)")).toBe(true);
    const c = game("costOf('schiene', 2, 5)"), w0 = wallet();
    expect(c).toEqual(game("brCostMat(brPrice({ mat: 'stahl' }, 'gleis'))"));
    expect(game("build('schiene', 2, 5, true)")).toBe(true);
    const d = diff(w0, wallet()), want = { money: -c.cost }; for (const [r, v] of Object.entries(c.mat)) want[r] = -v;
    expect(d).toEqual(want);
    expect(game("(t => [t.brm, brIsNew(t, 'gleis'), brSpanLook(2, 5).mat])(state.tiles.get('2,5'))")).toEqual(['stahl', true, 'stahl']);
    leiste('holz');
    expect(game("build('schiene', 3, 5, true)")).toBe(true);
    expect(game("brLook(state.tiles.get('3,5'), 'gleis').mat")).toBe('stahl');            // verlängern: wie die Brücke daneben, nicht die Leiste
    const w1 = wallet();
    expect(game("demolish(3, 5)")).not.toBe(false);
    expect(diff(w1, wallet())).toEqual((p => { const o = {}; for (const [k, v] of Object.entries(p)) if (k !== 'k' && v) o[k] = v; return o; })(game("brPrice({ mat: 'stahl' }, 'gleis')")));
  });
  it('Leiste Holz (oder gesperrtes Material): wie bisher – Holz, kein brp, 40 Taler', () => {
    wasser(); leiste('kristall');
    expect(game("brMatLock('kristall', 'gleis')")).toMatch(/Kristall/);
    expect(game("build('schiene', 1, 5, true)")).toBe(true);
    const m = game('state.money');
    expect(game("build('schiene', 2, 5, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 40);
    expect(game("(t => [t.brm, t.brp])(state.tiles.get('2,5'))")).toEqual([undefined, undefined]);
  });
  it('Linie ziehen über Wasser mit Leiste Metall: Plan-Preis = abgebucht', () => {
    wasser(); leiste('stahl');
    const r = game(`(() => { setTool('schiene'); startPlan('line', { x: 0, y: 5 }, { x: 11, y: 5 }, false); const info = planInfo(plan); const m0 = state.money; runPlan(); setTool('look'); return [info.cost, m0 - state.money]; })()`);
    expect(r[1]).toBe(r[0]);
    expect(game("brSpanLook(5, 5).mat")).toBe('stahl');
  });
});

describe('Gleisbrücken übers Wasser: Strom fürs Licht (160c E2d)', () => {
  it("Licht an: je Brücke 'G' + Anker im Strom, ohne Strom dunkel (Lampen grau); aus: nichts im Strom", () => {
    bau();
    expect(game("[...T.rail.power.dark].filter(k => k[0] === 'G')")).toEqual([]);
    game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'kaufen' })");
    expect(game('gbAt(4, 5).G.anker')).toBe('2,5');
    const city = game('!!T.rail.power.city'), dunkel = game("T.rail.power.dark.has('G2,5')");
    if (!city) expect(dunkel).toBe(false);
    const lampen = dark => game(`(() => { const out = [], bl = bkLamps; bkLamps = (...a) => { out.push(a[8].dark); return bl(...a); };
      ${dark ? "T.rail.power.dark.add('G2,5');" : "T.rail.power.dark.delete('G2,5');"}
      try { for (const l of ['h', 'v', 'd', 'o']) gbPaintLage(l, gbAt(4, 5), 0, 0, 1, state.tiles.get('4,5')); } finally { bkLamps = bl; } return out; })()`);
    expect(new Set(lampen(true))).toEqual(new Set([true]));
    expect(new Set(lampen(false))).toEqual(new Set([false]));
    game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'aus' })");
    expect(game("[...T.rail.power.dark].filter(k => k[0] === 'G')")).toEqual([]);
  });
});

describe('Gleisbrücken übers Wasser: Geist und Schild beim Ziehen (160c E2)', () => {
  it('Linie übers Wasser: Geist je Feld im Material der Leiste (Arme aus den gedachten Feldern), gemalt über den neuen Maler; Schild nennt die Brücke', () => {
    game("for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water'); state.techs.add('bahn'); state.techs.add('terraform'); terrainCache.clear(); waterChanged(); recalc()");
    game("state.paintNew.bruecke = { form: BK_ART_IDS.indexOf('stahl') }");
    const r = game(`(() => { setTool('schiene'); startPlan('line', { x: 0, y: 5 }, { x: 11, y: 5 }, false); const info = planInfo(plan);
      const cs = [...info.wbGhost.values()], out = { n: cs.length, rail: cs.every(c => c.rail && c.G && c.G.mat === 'stahl'), arms: cs.find(c => c.x === 5).G.arms.length, text: planText(plan, info) };
      const gp = gbPaintLage; let n = 0; gbPaintLage = (...a) => { n++; return gp(...a); };
      try { cam = state.cam; cam.z = 2; const p = iso(5, 5); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); } finally { gbPaintLage = gp; plan = null; setTool('look'); spriteForce = null; }
      out.painted = n; return out; })()`);
    expect(r.n).toBe(8);
    expect(r.rail).toBe(true);
    expect(r.arms).toBe(2);                                                              // mittendrin: beide Nachbarn sind gedacht
    expect(r.text).toMatch(/Brücke: Metall · 8 Felder/);
    expect(r.painted).toBeGreaterThanOrEqual(4 * 8);
  });
});

describe('Gleisbrücken übers Wasser: Zusammenwachsen – die längere gewinnt (Nutzer 15.10.2026)', () => {
  it('Lücke zwischen Metall (2 Felder) und Holz (5 Felder) schließen: alles Holz, das neue Feld kostet Holz; die Metallfelder behalten ihr Bezahltes', () => {
    game("for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water'); state.techs.add('bahn'); state.techs.add('terraform'); terrainCache.clear(); waterChanged(); recalc()");
    game("for (const x of [0, 1, 2, 3]) build('schiene', x, 5, true); for (const x of [10, 9, 8, 7, 6, 5]) build('schiene', x, 5, true)");
    expect(game("[brRailSpan(2, 5).length, brRailSpan(6, 5).length]")).toEqual([2, 5]);
    expect(game("brSet({ at: 'gleis', x: 2, y: 5 }, { mat: 'stahl' })")).toBe(true);
    const metall = game("brPaid(state.tiles.get('2,5'), 'gleis')");
    const c = game("costOf('schiene', 4, 5)"), m0 = game('state.money');
    expect(c).toEqual(game("brCostMat(brPrice({ mat: 'holz' }, 'gleis'))"));
    expect(game("build('schiene', 4, 5, true)")).toBe(true);
    expect(game('state.money')).toBe(m0 - c.cost);
    expect(game("brRailSpan(4, 5).length")).toBe(8);
    for (const x of [2, 3, 4, 5, 8]) expect(game(`brLook(state.tiles.get('${x},5'), 'gleis').mat`), x).toBe('holz');
    expect(game("(p => { const { k, ...o } = p; return o; })(brPaid(state.tiles.get('2,5'), 'gleis'))")).toEqual((({ k, ...o }) => o)(metall));   // erstattet weiter Metall
    expect(game("gbAt(3, 5).G.mat")).toBe('holz');
  });
  it('Metall länger: das neue Feld wird Metall und kostet Metall; die Holzfelder werden kostenlos Metall', () => {
    game("for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water'); state.techs.add('bahn'); state.techs.add('terraform'); terrainCache.clear(); waterChanged(); recalc()");
    game("for (const x of [0, 1, 2]) build('schiene', x, 5, true); for (const x of [10, 9, 8, 7, 6, 5, 4]) build('schiene', x, 5, true)");
    expect(game("brSet({ at: 'gleis', x: 6, y: 5 }, { mat: 'stahl' })")).toBe(true);
    const c = game("costOf('schiene', 3, 5)"), m0 = game('state.money');
    expect(c).toEqual(game("brCostMat(brPrice({ mat: 'stahl' }, 'gleis'))"));
    expect(game("build('schiene', 3, 5, true)")).toBe(true);
    expect(game('state.money')).toBe(m0 - c.cost);
    expect(game("brLook(state.tiles.get('2,5'), 'gleis').mat")).toBe('stahl');
    expect(game("(p => p.money)(brPaid(state.tiles.get('2,5'), 'gleis'))")).toBe(40);      // bezahlt war Holz – das bleibt die Erstattung
  });
});

describe('Gleisbrücken übers Wasser: Ablegen an eine andere Brücke (160c E2)', () => {
  it('eine Metall-Gleisbrücke an eine längere Holzbrücke gelegt: wird Holz (die meisten Felder), behält ihr Bezahltes', () => {
    game("for (let y = 0; y <= 9; y++) for (let x = 2; x <= 9; x++) state.terra.set(x + ',' + y, 'water'); state.techs.add('bahn'); state.techs.add('terraform'); terrainCache.clear(); waterChanged(); recalc()");
    game("for (const x of [0, 1, 2, 3, 4]) build('schiene', x, 5, true); for (const x of [0, 1, 2]) build('schiene', x, 8, true)");
    expect(game("brSet({ at: 'gleis', x: 2, y: 8 }, { mat: 'stahl' })")).toBe(true);
    const p0 = game("(({ k, ...o }) => o)(brPaid(state.tiles.get('2,8'), 'gleis'))");
    game("setTool('verschieben'); pickUp(2, 8, -1)");
    expect(game("moving && moving.t && moving.t.brm")).toBe('stahl');
    game("dropAt(5, 5, -1); setTool('look')");
    expect(game("isGleisBridge(state.tiles.get('5,5'))")).toBe(true);
    expect(game("brLook(state.tiles.get('5,5'), 'gleis').mat")).toBe('holz');
    expect(game("(({ k, ...o }) => o)(brPaid(state.tiles.get('5,5'), 'gleis'))")).toEqual(p0);
  });
});

describe('Gleisbrücken übers Wasser: Gegenlesen E2', () => {
  const lang = () => game(`(() => { for (let y = 0; y <= 9; y++) for (let x = 2; x <= 15; x++) state.terra.set(x + ',' + y, 'water');
    for (let x = 0; x <= 17; x++) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, ...(x >= 2 && x <= 15 ? { bridge: true } : {}) });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
  it('rohe Kacheln mit fremdem brm (constructor, __proto__, toString): Holz, nie ein Absturz', () => {
    lang();
    for (const bad of ['constructor', '__proto__', 'toString']) {
      game(`(() => { const t = state.tiles.get('5,5'); t.brm = '${bad}'; t.brp = { money: 0, k: 'g:1' }; groundVersion++; })()`);
      expect(game("brLook(state.tiles.get('5,5'), 'gleis').mat"), bad).toBe('holz');
      expect(game("(() => { for (const l of ['h', 'v', 'd', 'o']) gbPaintLage(l, gbAt(5, 5), 0, 0, 1, state.tiles.get('5,5')); return gbAt(5, 5).G.mat; })()"), bad).toBe('holz');
    }
  });
  it('Licht auf langen Läufen (14 Felder): Lampen bis zum letzten Feld, Steinlaterne in der Brückenfarbe', () => {
    lang();
    game("brSet({ at: 'gleis', x: 5, y: 5 }, { licht: 'kaufen' })");
    const spots = game(`(() => { const out = [], bl = bkLamps; bkLamps = (...a) => { out.push([a[7], a[8].lampMax]); return bl(...a); };
      try { gbPaintLage('o', gbAt(15, 5), 0, 0, 1, state.tiles.get('15,5')); } finally { bkLamps = bl; } return out; })()`);
    expect(spots.length).toBeGreaterThan(0);
    expect(spots[0][1]).toBe(14);
    game("brSet({ at: 'gleis', x: 5, y: 5 }, { mat: 'stein' }); brSet({ at: 'gleis', x: 5, y: 5 }, { col: 5 })");
    const col = game(`(() => { let c; const bl = bkLamps; bkLamps = (...a) => { c = a[8].col; return bl(...a); }; try { gbPaintLage('o', gbAt(6, 5), 0, 0, 1, state.tiles.get('6,5')); } finally { bkLamps = bl; } return c; })()`);
    expect(col).toBe(5);
  });
  it('Kristall mit Licht: das ruhende Bildchen w trägt |lit (Nachtbild), kein zweites Glas in tileB', () => {
    lang();
    game("state.tiles.forEach(t => { if (isGleisBridge(t)) { t.brm = 'kristall'; t.brl = 'an'; t.brp = { ...brPrice({ mat: 'kristall', licht: 'an' }, 'gleis'), k: 'g:1' }; } }); groundVersion++; recalc()");
    expect(game("bkLampGroups(gbAt(5, 5)).every(g => g === 'vd' || g === 'o' || g === 'h')")).toBe(true);
    expect(game("bkTileBAt(gbAt(5, 5))")).toBe(false);
    const keys = game(`(() => { const ks = []; const gs = getSprite; getSprite = (k, ...a) => { ks.push(k); return null; }; try { spriteBridge(5, 5, 0, 0, 1, 'w', gbAt(5, 5)); } finally { getSprite = gs; } return ks; })()`);
    expect(keys[0]).toMatch(/^gb\|5,5\|w\|0\|[01]$/);
  });
  it('Deck halbe Breite 0,4: Boot bis 0,4 darunter; Plan-Merker kennt die Leiste auch für Schienen', () => {
    lang();
    expect(game("[gbAt(5, 5).W, bkMoverClass({ boat: true, px: 5, py: 5.35 }, gbAt(5, 5), 5, 5), bkMoverClass({ boat: true, px: 5, py: 5.45 }, gbAt(5, 5), 5, 5)]")).toEqual([0.4, 'U', 'F']);
    game("state.techs.add('bahn'); state.techs.add('terraform'); state.paintNew.bruecke = { form: 0 }");
    const r = game(`(() => { setTool('schiene'); startPlan('line', { x: 0, y: 7 }, { x: 17, y: 7 }, false); const a = planInfo(plan).cost;
      state.paintNew.bruecke = { form: BK_ART_IDS.indexOf('stahl') }; const b = planInfo(plan).cost; plan = null; setTool('look'); return [a, b]; })()`);
    expect(r[1]).toBeGreaterThan(r[0]);
  });
});

describe('Gleisbrücken übers Wasser: getragene Kachel (160c E2, Gegenlesen Nr. 10)', () => {
  it('eine Metall-Gleisbrückenkachel außerhalb der Karte (✋) zeichnet der neue Maler im Material', () => {
    bau();
    game("brSet({ at: 'gleis', x: 4, y: 5 }, { mat: 'stahl' })");
    const r = game(`(() => { const t = { ...state.tiles.get('4,5') }, out = []; const gp = gbPaintLage; gbPaintLage = (l, c, ...a) => { out.push(l + ' ' + c.G.mat); return gp(l, c, ...a); };
      state.terra.set('5,8', 'water'); terrainCache.clear(); waterChanged();
      try { drawObject('schiene', 0, 0, 1, 1e6, 5, 8, 1, t); } finally { gbPaintLage = gp; } return out; })()`);
    expect(r).toEqual(['h stahl', 'v stahl', 'd stahl', 'o stahl']);
  });
});

describe('Gleisbrücken übers Wasser: Stütze der Anfangskante hinter dem Boot (160c E2, Gegenlesen Nr. 8)', () => {
  it('Holz: Bock an der Anfangskante → Boot unter der Feldmitte schneidet ihn beim Nachmalen aus; am Ufer-Ende keine Stütze', () => {
    bau();
    expect(game('[gbAt(4, 5).G.startPost, gbAt(2, 5).G.startPost, gbAt(8, 5).G.startPost]')).toEqual([true, false, false]);   // 2,5: Ufer davor; 8,5: Eckpodest
    const cuts = game(`(() => { const out = [], br = bkRedo; bkRedo = (...a) => { out.push(a[7].join('+') + (a[9] ? ' cut' : '')); return br(...a); };
      try { bkDrawMoving(4, 5, 0, 0, 1, 1e6, gbAt(4, 5), [{ boat: true, ship: 'dampfer', px: 4, py: 5, du: 0, dv: 1 }], null, new Set()); } finally { bkRedo = br; } return out; })()`);
    expect(cuts).toContain('h+vd cut');
  });
});

// 160c G2 (Gesamtprüfung B3-5): Licht wird je Feld gekauft und mit Strom versorgt – auch das Eckpodest (Kurve/T/X) leuchtet
describe('Gleisbrücke: Licht auch auf dem Eckpodest (160c G2)', () => {
  for (const mat of ['holz', 'stein', 'stahl', 'kristall']) it(mat + ': die Kurve 8,5 hat Lampen (hinten in d, vorn in o)', () => {
    bau();
    game("if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall')");
    if (mat !== 'holz') expect(game(`brSet({ at: 'gleis', x: 4, y: 5 }, { mat: '${mat}' })`)).toBe(true);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'kaufen' })")).toBe(true);
    expect(game('gbAt(8, 5).G.sax')).toBe(null);                              // Eckpodest
    const r = game(`(() => { const out = { d: 0, o: 0 }, gq = glowQuad, na = night; let cur = ''; glowQuad = () => { out[cur] = (out[cur] || 0) + 1; }; night = 1;
      try { for (const l of ['h', 'v', 'd', 'o']) { cur = l; gbPaintLage(l, gbAt(8, 5), 0, 0, 1, state.tiles.get('8,5')); } } finally { glowQuad = gq; night = na; } return out; })()`);
    expect(r.d, 'hinten').toBeGreaterThan(0);
    expect(r.o, 'vorn').toBeGreaterThan(0);
    expect(r.h || 0).toBe(0); expect(r.v || 0).toBe(0);
  });
});
