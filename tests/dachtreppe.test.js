const { loadGame, game } = require('./helpers/load-game');

// Block 138d: Treppe durch die Dachöffnung (Nutzer: „Aufgang zwischen den Überdachungen – Decke offen, Treppe runter“)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); for (const id of ['dach:form:arkaden', 'dach:form:glas']) state.design.add(id); buildRot = 0; rotManual = false; recalc(); resetUndo()");
});
const roof = (cells, form = 3) => game(`state.paintNew.dach = { form: ${form} }; for (const [x, y] of ${JSON.stringify(cells)}) build('dach', x, y, true); state.paintNew.dach = {}; recalc()`);
const rect = (x0, x1, y0, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };

describe('Treppe durch die Dachöffnung (Block 138d)', () => {
  it('nur unter Steinarkaden (beide Felder); Stützen und Wege darunter stören nicht', () => {
    roof(rect(5, 7, 5, 7)); roof(rect(10, 11, 5, 6), 1);
    game('roofAutoPillars(' + JSON.stringify(rect(5, 7, 5, 7)) + ')');
    expect(game("placeError('dachtreppe', 6, 5, 0)")).toBe(null);
    expect(game("placeError('dachtreppe', 6, 7, 0)")).toMatch(/Steinarkaden/);       // zweites Feld nicht überdacht
    expect(game("placeError('dachtreppe', 10, 5, 0)")).toMatch(/Steinarkaden/);      // Glas
    expect(game("placeError('dachtreppe', 5, 5, 0)")).toBe(null);                    // Eckfeld mit Stütze
    game("build('weg', 7, 5, true); build('weg', 7, 6, true)");
    expect(game("placeError('dachtreppe', 7, 5, 0)")).toBe(null);                    // über einem Weg
    expect(game("build('dachtreppe', 6, 5)")).toBe(true);
    expect(game("[state.tiles.get('6,5').b, COVER.get('6,6')]")).toEqual(['dachtreppe', '6,5']);
  });

  it('das Dach darüber hat eine Öffnung (neues Bild); dort keine Deko oben', () => {
    roof(rect(5, 7, 5, 7));
    const before = game('roofSig(6, 5, roofAt(6, 5))');
    game("build('dachtreppe', 6, 5)");
    expect(game('roofSig(6, 5, roofAt(6, 5))')).not.toBe(before);
    expect(game('roofHoles(6, 5).length')).toBe(1);
    expect(game('roofHoles(6, 6).length')).toBe(1);
    expect(game('roofHoles(6, 7).length')).toBe(0);
    expect(game("roofTopError('blumentopf', 6, 5, 7)")).toMatch(/Öffnung/);        // Seitenmitte vorn: in der Öffnung
    expect(game("roofTopError('blumentopf', 5, 5, 0)")).toBe(null);
    game("buildRoofTop('blumentopf', 7, 7, 4)");
    expect(game("placeError('dachtreppe', 7, 6, 0)")).toMatch(/Deko oben/);
  });

  it('zeichnet in alle vier Richtungen ohne Fehler, mit jeder Brüstung', () => {
    roof(rect(3, 9, 3, 9));
    for (const [x, y, r] of [[4, 4, 0], [7, 4, 1], [4, 7, 2], [7, 7, 3]]) expect(game(`buildRot = ${r}; build('dachtreppe', ${x}, ${y})`)).toBe(true);
    for (const par of [0, 1, 2, 3]) {
      game(`for (const r of state.roofs.values()) r.par = ${par}`);
      for (const z of [2.5, 0.6]) expect(() => game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); })()`)).not.toThrow();
    }
    expect(() => game("thumbRaw('dachtreppe', 1, { rot: 0 })")).not.toThrow();
  });
});
