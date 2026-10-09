const { loadGame, game } = require('./helpers/load-game');

// Block 138d: Aufgang auf Steinarkaden (Nutzer: „einen Aufgang, wo die Bewohner drauf rumlaufen können“ – Freitreppe C gewählt)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); for (const id of ['dach:form:arkaden', 'dach:form:glas']) state.design.add(id); buildRot = 0; rotManual = false; recalc(); resetUndo()");
});
const roof = (cells, form = 3) => game(`state.paintNew.dach = { form: ${form} }; for (const [x, y] of ${JSON.stringify(cells)}) build('dach', x, y, true); state.paintNew.dach = {}`);
const row = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);

describe('Freitreppe (Block 138d)', () => {
  it('nur direkt vor Steinarkaden, nicht darunter; dreht sich von selbst zum Dach', () => {
    roof(row(5, 7, 5)); roof(row(5, 7, 9), 1);
    expect(game("placeError('aufgang', 6, 6)")).toBe(null);                        // vor der vorderen linken Kante
    expect(game("placeRot('aufgang', 6, 6)")).toBe(1);                             // Fuß nach +v, hinauf nach −v
    expect(game("placeRot('aufgang', 8, 5)")).toBe(0);                             // rechts davor: hinauf nach −u
    expect(game("placeRot('aufgang', 6, 4)")).toBe(3);                             // dahinter: hinauf nach +v
    expect(game("placeError('aufgang', 6, 5)")).toMatch(/Nicht unter/);
    expect(game("placeError('aufgang', 6, 10)")).toMatch(/Steinarkaden/);          // Glas zählt nicht
    expect(game("placeError('aufgang', 12, 12)")).toMatch(/Steinarkaden/);
    expect(game("build('aufgang', 6, 6)")).toBe(true);
    expect(game("state.tiles.get('6,6')")).toMatchObject({ b: 'aufgang', rot: 1 });
    expect(game('stairsAt(6, 5)')).toEqual([{ x: 6, y: 6, dx: 0, dy: 1 }]);
  });

  it('Brüstung bekommt an der Treppe eine Lücke (neues Dachbild), sonst geht sie durch', () => {
    roof(row(5, 7, 5));
    const before = game('roofSig(6, 5, roofAt(6, 5))');
    game("build('aufgang', 6, 6)");
    expect(game('roofSig(6, 5, roofAt(6, 5))')).not.toBe(before);
    expect(game('roofSig(5, 5, roofAt(5, 5))')).toBe(game("(() => { const t = state.tiles.get('6,6'); state.tiles.delete('6,6'); const s = roofSig(5, 5, roofAt(5, 5)); state.tiles.set('6,6', t); return s; })()"));   // Nachbarfeld unverändert
  });

  it('zeichnet in alle vier Richtungen ohne Fehler, mit jeder Brüstung', () => {
    roof([[5, 5], [6, 5], [5, 6], [6, 6]]);
    for (const [x, y] of [[5, 7], [7, 6], [5, 4], [4, 5]]) expect(game(`build('aufgang', ${x}, ${y})`)).toBe(true);
    expect(game("[...state.tiles.values()].filter(t => t.b === 'aufgang').map(t => t.rot).sort()")).toEqual([0, 1, 2, 3]);
    for (const par of [1, 2, 3]) {
      game(`for (const r of state.roofs.values()) r.par = ${par}`);
      for (const z of [2.5, 0.6]) expect(() => game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(5, 5); cam.x = p.x; cam.y = p.y; render(1e6); })()`)).not.toThrow();
    }
    expect(() => game("thumbRaw('aufgang', 1, { rot: 0 })")).not.toThrow();
  });
});
