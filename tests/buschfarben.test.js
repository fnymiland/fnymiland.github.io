const { loadGame, game } = require('./helpers/load-game');

// Block 89: Büsche und Wilmerhecke farbig – Grüntöne frei, Herbst und Bunt in der Kunstakademie
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; resetUndo(); state.paintNew = {}");
  game("for (let y = 2; y <= 20; y++) for (let x = 2; x <= 20; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc()");
});
const fills = expr => game(`(() => { const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
  try { ${expr}; } finally { delete g.fillStyle; } return seen; })()`);

describe('Buschfarben (Block 89)', () => {
  it('Grüntöne frei, Herbst und Bunt in der Kunstakademie', () => {
    expect(game('BUSH_COLS.length')).toBe(11);
    expect(game('[0, 1, 2, 3, 4].every(bushColOk)')).toBe(true);
    expect(game('bushColOk(5)')).toBe(false);
    expect(game("DESIGN.filter(d => d.group === 'Büsche').length")).toBe(6);
    game("state.design.add('busch:rot')");
    expect(game('bushColOk(5)')).toBe(true);
  });
  it('der Busch wird in der gewählten Farbe gezeichnet (Deko, Größen, Wilmerhecke)', () => {
    const c = game('BUSH_COLS[3].c[0]');
    expect(fills("drawObject('busch', 100, 100, 1, 0, 3, 3, 1, { col: 3 })")).toContain(c);
    expect(fills("drawObject('busch', 100, 100, 1, 0, 3, 3, 1, null)")).not.toContain(c);
    expect(fills("drawSmallOne('busch', 0, 100, 100, 1, 0, 3, 3, 1, 0, 3)")).toContain(c);
    expect(fills("wilmerBush([5, 5], EDGE_LOOK.hecke.wilmer, 1, 0.5, 0, null, 3)")).toContain(c);
  });
  it('Deko-Busch: Farbe im Fenster, für alle übernehmen, neu gebaute – mit ↶ und gespeichert', () => {
    game("buildSmall('busch', 6, 6, 0); buildSmall('busch', 8, 8, 0); openDecoInfo(6, 6, 0)");
    game("document.querySelector('#panel [data-bcol=\"2\"]').click()");
    expect(game("state.decos.get('6,6')[0].col")).toBe(2);
    game('undo()');
    expect(game("state.decos.get('6,6')[0].col")).toBe(undefined);
    game("openDecoInfo(6, 6, 0); document.querySelector('#panel [data-bcol=\"4\"]').click()");
    game("openDecoInfo(6, 6, 0); document.querySelector('#panel [data-bcolall]').click()");
    expect(game("state.decos.get('8,8')[0].col")).toBe(4);
    game("openDecoInfo(6, 6, 0); document.querySelector('#panel [data-bcolnew]').click()");
    expect(game('state.paintNew.busch')).toEqual({ col: 4 });
    game("buildSmall('busch', 10, 10, 0)");
    expect(game("state.decos.get('10,10')[0].col")).toBe(4);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.decos.get('10,10')[0].col")).toBe(4);
  });
  it('Wilmerhecke: Farbe im Linienfenster und aus der Musterleiste; gespeichert', () => {
    game("chosenStyle.hecke = 'wilmer'; setTool('hecke')");
    expect(game("!!document.querySelector('#style-bar [data-bchip=\"1\"]')")).toBe(true);
    game("document.querySelector('#style-bar [data-bchip=\"1\"]').click()");
    game("buildEdge('hecke', 'a6,6'); buildEdge('hecke', 'a7,6'); setTool('look')");
    expect(game("state.edges.get('a6,6').col")).toBe(1);
    game("openGateInfo('a6,6'); document.querySelector('#panel [data-bcol=\"3\"]').click()");
    expect(game("state.edges.get('a6,6').col")).toBe(3);
    game("openGateInfo('a6,6'); document.querySelector('#panel [data-bcolall]').click()");
    expect(game("state.edges.get('a7,6').col")).toBe(3);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.edges.get('a7,6').col")).toBe(3);
  });
  it('geschenkte Parkbäume bleiben auch nach dem Laden geschenkt (84b)', () => {
    game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.terra.set('8,8', 'forest'); recalc(); build('parkrasen', 8, 8, true)");
    expect(game("state.decos.get('8,8').filter(Boolean).every(x => x.free)")).toBe(true);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.decos.get('8,8').filter(Boolean).every(x => x.free)")).toBe(true);
  });
  it('Bildchen weit weg kennen die Farbe', () => {
    const keys = game(`(() => { const ks = []; const o = getSprite; getSprite = k => { ks.push(k); return null; }; try { spriteSmall('busch', 0, 0, 0, 0.6, 0, 3, 3, 0, 0); spriteSmall('busch', 0, 0, 0, 0.6, 0, 3, 3, 0, 5); } finally { getSprite = o; } return ks; })()`);
    expect(keys[0]).not.toBe(keys[1]);
  });
  it('Busch-Größen: Farbe gespeichert', () => {
    game("state.tiles.set('8,8', { b: 'busch_m', lvl: 1, col: 3 }); recalc()");
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('8,8').col")).toBe(3);
  });
});
