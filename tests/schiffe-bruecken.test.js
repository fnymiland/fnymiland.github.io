const { loadGame, game } = require('./helpers/load-game');

// Block 107: Schiffe fahren unter Brücken (Schienen, Wegbrücken) nur quer durch – nie längs auf den Schienen entlang
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal()");
  game("for (let y = 30; y <= 50; y++) for (let x = 30; x <= 60; x++) { state.terra.set(x + ',' + y, 'water'); state.tiles.delete(x + ',' + y); } recalc()");
});
const route = (s, g) => game(`seaSearch([${s}], (x, y) => x === ${g[0]} && y === ${g[1]}, [28, 28, 62, 52])`);

describe('Schiffe und Brücken (Block 107)', () => {
  it('lange Schienenbrücke in Fahrtrichtung: das Schiff fährt daneben, nicht darauf', () => {
    game("for (let x = 35; x <= 55; x++) state.tiles.set(x + ',40', { b: 'schiene', lvl: 1 }); recalc()");
    const p = route([33, 40], [57, 40]);
    expect(p).not.toBe(null);
    const onRail = p.filter(([x, y]) => game(`seaCross(${x}, ${y})`));
    expect(onRail).toEqual([]);
  });
  it('Brücke quer über das ganze Wasser: genau einmal gerade darunter durch', () => {
    game("for (let y = 30; y <= 50; y++) state.tiles.set('45,' + y, { b: 'schiene', lvl: 1 }); recalc()");
    const p = route([40, 40], [50, 40]);
    expect(p).not.toBe(null);
    const i = p.findIndex(([x, y]) => game(`seaCross(${x}, ${y})`));
    expect(p.filter(([x, y]) => game(`seaCross(${x}, ${y})`)).length).toBe(1);
    expect(p[i - 1][1]).toBe(p[i][1]); expect(p[i + 1][1]).toBe(p[i][1]);               // rein und raus quer zur Brücke
  });
  it('Seewege werden neu berechnet, wenn eine Brücke dazukommt', () => {
    game("seaCache.set('test', 1); recalc()");
    expect(game("seaCache.has('test')")).toBe(true);                                        // nichts geändert: bleibt
    game("state.tiles.set('45,40', { b: 'schiene', lvl: 1 }); recalc()");
    expect(game("seaCache.has('test')")).toBe(false);
  });
  it('Fischkutter kreisen nicht über einer Brücke (ihr Fanggebiet hat ringsum keine)', () => {
    game("state.tiles.set('40,40', { b: 'hafen', lvl: 1, rot: 0 }); for (let x = 30; x <= 60; x++) state.tiles.set(x + ',44', { b: 'schiene', lvl: 1 }); recalc()");
    const fg = game("fishingGround('40,40')");
    expect(fg).not.toBe(null);
    if (fg) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) expect(game(`seaCross(${fg[0] + dx}, ${fg[1] + dy})`)).toBe(null);
  });
  it('Block 112: breite Brücke (Doppelgleis) über das ganze Wasser: quer darunter durch – Kreuzung bleibt gesperrt', () => {
    game("for (let y = 30; y <= 50; y++) { state.tiles.set('45,' + y, { b: 'schiene', lvl: 1 }); state.tiles.set('46,' + y, { b: 'schiene', lvl: 1 }); } recalc()");
    expect(game("seaCross(45, 40)")).toBe('y');
    const p = route([40, 40], [52, 40]);
    expect(p).not.toBe(null);
    expect(p.filter(([x, y]) => game(`seaCross(${x}, ${y})`)).length).toBe(2);              // genau quer über beide Gleise
    game("state.tiles.set('44,40', { b: 'schiene', lvl: 1 }); state.tiles.set('47,40', { b: 'schiene', lvl: 1 }); state.tiles.set('43,40', { b: 'schiene', lvl: 1 }); state.tiles.set('48,40', { b: 'schiene', lvl: 1 })");
    expect(game("[seaStep(43, 40, 44, 40), seaStep(44, 40, 45, 40)]")).toEqual([false, false]);   // Querschiene: nicht längs darauf entlang
    const q = route([40, 40], [52, 40]);
    expect(q.some(([x, y]) => y === 40 && x >= 43 && x <= 48)).toBe(false);                  // um die Kreuzung herum
  });
});
