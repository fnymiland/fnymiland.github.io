const { loadGame, game } = require('./helpers/load-game');

// 160c V4: Eine Wegbrücke übers Wasser mit mehreren Feldern samt Ufer aufnehmen (✋) und wieder ablegen – die Felder der Gruppe zählen beim
// Prüfen schon als gelegt (PLANNED), sonst fand das mittlere Feld keinen Arm („Brücken wachsen vom Ufer aus“)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999; for (let y = 3; y <= 24; y++) for (let x = 3; x <= 30; x++) { state.terra.set(x + "," + y, "grass"); state.tiles.delete(x + "," + y); state.decos.delete(x + "," + y); state.claimed.add(x + "," + y); } state.edges.clear()');
  // zwei gleiche Kanäle: x 10–12 und 20–22, y 4–12
  game('for (let y = 4; y <= 12; y++) for (const x of [10, 11, 12, 20, 21, 22]) state.terra.set(x + "," + y, "water"); waterChanged(); recalc(); resetUndo()');
});
const tile = (x, y) => game(`(t => t ? [t.b, !!t.bridge] : null)(state.tiles.get('${x},${y}'))`);
const weg = (y, x0, x1) => game(`for (let x = ${x0}; x <= ${x1}; x++) build('weg', x, ${y}, true); recalc()`);

describe('Wegbrücke aufnehmen und ablegen (160c V4)', () => {
  it('drei Felder samt Ufer: aufnehmen, über den anderen Kanal legen – liegt dort als Brücke', () => {
    weg(6, 8, 14);
    expect([10, 11, 12].map(x => tile(x, 6))).toEqual([['weg', true], ['weg', true], ['weg', true]]);
    game("setTool('verschieben'); pickUpGroup(9, 6, 13, 6)");
    expect(game('moving && moving.kind')).toBe('group');
    expect(game('groupErrors(moving.cx + 19, moving.cy + 6).first')).toBe(null);
    expect(game('undoable(() => dropGroup(moving.cx + 19, moving.cy + 6))')).toBe(true);
    expect([19, 20, 21, 22, 23].map(x => tile(x, 6))).toEqual([['weg', false], ['weg', true], ['weg', true], ['weg', true], ['weg', false]]);
    expect(game('PLANNED')).toBe(null);
  });
  it('breit (zwei Reihen) und Nord-Süd', () => {
    weg(6, 8, 14); weg(7, 8, 14);
    game("setTool('verschieben'); pickUpGroup(9, 6, 13, 7)");
    expect(game('undoable(() => dropGroup(moving.cx + 19, moving.cy + 6))')).toBe(true);
    expect([20, 21, 22].flatMap(x => [tile(x, 6), tile(x, 7)]).every(t => t && t[1])).toBe(true);
    // Nord-Süd: Kanal quer (y 15–17), Weg längs y
    game('for (let x = 4; x <= 28; x++) for (const y of [15, 16, 17]) state.terra.set(x + "," + y, "water"); waterChanged(); recalc()');
    game("for (let y = 13; y <= 19; y++) build('weg', 6, y, true); recalc()");
    game("setTool('verschieben'); pickUpGroup(6, 14, 6, 18)");
    expect(game('undoable(() => dropGroup(moving.cx + 20, moving.cy + 14))')).toBe(true);
    expect([15, 16, 17].map(y => tile(20, y))).toEqual([['weg', true], ['weg', true], ['weg', true]]);
  });
  it('auf Land abgelegt: weiter „Brücken nur übers Wasser“', () => {
    weg(6, 8, 14);
    game("setTool('verschieben'); pickUpGroup(9, 6, 13, 6)");
    expect(game('groupErrors(moving.cx + 3, moving.cy + 20).first')).toMatch(/nur übers Wasser/);
    game('cancelMove()');
  });
});
