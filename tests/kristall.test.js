const { loadGame, game } = require('./helpers/load-game');

// Kristall 💎: Rohstoff der Kristallinsel, für Glas- und Kristalldinge
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99");
  game("state.islands.add('kristall'); ownIsland('kristall')");
  game("for (let i = 0; i < 6; i++) state.tiles.set('4,' + (i + 3), { b: 'haus', lvl: 5 }); recalc()");   // genug Einwohner
});
// ein Kristallfels-Feld auf der Kristallinsel (freies, nicht bebautes)
const crystalTile = () => game(`(() => {
  const i = ISLE_BY_ID.kristall;
  for (let r = 4; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = Math.round(i.cx) + dx, y = Math.round(i.cy) + dy;
    if (terrainAt(x, y) === 'kristall' && !state.tiles.has(x + ',' + y)) return [x, y];
  }
  return null;
})()`);

describe('Kristall als Rohstoff', () => {
  it('ist ein Rohstoff mit eigenem Zeichen', () => {
    expect(game('RES.kristall.icon')).toBe('💎');
    expect(game('newRes().kristall')).toBe(0);
  });

  it('die Kristallinsel hat Kristallfelsen (und kein Erz mehr), die Heimatinsel keine', () => {
    const count = game(`(() => { const i = ISLE_BY_ID.kristall; let n = 0, erz = 0;
      for (let y = Math.round(i.cy) - 14; y <= i.cy + 14; y++) for (let x = Math.round(i.cx) - 14; x <= i.cx + 14; x++)
        if (islandAt(x, y) === 'kristall') { if (terrainAt(x, y) === 'kristall') n++; if (terrainAt(x, y) === 'erz') erz++; }
      return [n, erz]; })()`);
    expect(count[0]).toBeGreaterThan(6);
    expect(count[1]).toBe(0);
    expect(game("TERRAIN_NAMES.kristall")).toBe('Kristallfels');
  });

  it('die Kristallmine gibt es ab der ersten Laterne der Kristallhöhle, nur auf Kristallfels', () => {
    const [x, y] = crystalTile();
    expect(game("available('kristallmine')")).toBe(false);
    game('state.restore.kristall = 1');
    expect(game("available('kristallmine')")).toBe(true);
    expect(game("placeError('kristallmine', 6, 6)")).toMatch(/Nur auf Kristallfels/);
    expect(game(`placeError('kristallmine', ${x}, ${y})`)).toBe(null);
    expect(game(`build('kristallmine', ${x}, ${y}, true)`)).toBe(true);
    game('recalc(); state.res.kristall = 0');
    expect(game('T.prod.kristall')).toBeGreaterThan(0);
    game('produce(100)');
    expect(game('state.res.kristall')).toBeGreaterThan(0);
  });

  it('Kristallfels kann man sprengen wie Fels', () => {
    const [x, y] = crystalTile();
    expect(game(`demolishInfo(${x}, ${y}).label`)).toBe('Sprengen');
  });

  it('die Kristallmine wächst in drei Stufen', () => {
    expect(game("BUILD_STAGES.kristallmine.names.length")).toBe(3);
  });
});
