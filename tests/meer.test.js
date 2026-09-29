const { loadGame, game } = require('./helpers/load-game');

// Offenes Meer: direkt neben eigenem Land darf man aufschütten (wird neues Land) – so wächst auf Wunsch eine Megainsel
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99');
});
// ein Meerfeld direkt neben eigenem Land (außerhalb der eigenen Grundstücke)
const coast = () => game(`(() => {
  for (let x = 2; x < 60; x++) { const y = 3; if (!ownedTile(x, y) && isSea(x, y) && ownedTile(x - 1, y)) return [x, y]; }
  return null;
})()`);

describe('Aufschütten im Meer', () => {
  it('geht direkt neben eigenem Land, das Feld wird eigenes Land', () => {
    const [x, y] = coast();
    expect(game(`claimable(${x}, ${y})`)).toBe(true);
    expect(game(`placeError('schuett', ${x}, ${y})`)).toBe(null);
    expect(game(`build('schuett', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`terrainAt(${x}, ${y})`)).toBe('grass');
    expect(game(`ownedTile(${x}, ${y})`)).toBe(true);
    expect(game(`placeError('haus', ${x}, ${y})`)).toBe(null);           // darauf darf man alles bauen
  });

  it('weiter draußen nur Schritt für Schritt', () => {
    const [x, y] = coast();
    expect(game(`claimable(${x + 1}, ${y})`)).toBe(false);
    expect(game(`placeError('schuett', ${x + 1}, ${y})`)).toBe('Im Meer nur direkt neben deinem Land');
    game(`build('schuett', ${x}, ${y}, true)`);
    expect(game(`build('schuett', ${x + 1}, ${y}, true)`)).toBe(true);
  });

  it('auf fremde (noch gesperrte) Inseln kommt man so nicht', () => {
    const [ax, ay] = game('isleAnchor(ISLE_BY_ID.wald)');
    expect(game(`claimable(${ax}, ${ay})`)).toBe(false);
  });

  it('eingenommene Felder werden gespeichert', () => {
    const [x, y] = coast();
    game(`build('schuett', ${x}, ${y}, true); save()`);
    const s = game('load()');
    expect(s.claimed.has(`${x},${y}`)).toBe(true);
  });

  it('beim schnellen Ziehen wird kein Feld übersprungen', () => {
    const path = game('tilesBetween({ x: 0, y: 0 }, { x: 3, y: 2 })');
    expect(path[path.length - 1]).toEqual([3, 2]);
    expect(path.length).toBe(5);                                          // 4-Nachbarschaft: 3 + 2 Schritte
    let prev = [0, 0];
    for (const p of path) { expect(Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1])).toBe(1); prev = p; }
  });
});
