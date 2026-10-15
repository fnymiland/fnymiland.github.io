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
