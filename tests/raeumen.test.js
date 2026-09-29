const { loadGame, game } = require('./helpers/load-game');

// Bauen auf Natur (Wald, Obsthain, Fels, Erz, Kristallfels) räumt sie automatisch weg – zum Preis von Roden/Sprengen.
// Was man selbst gebaut hat, wird nie weggeräumt; Betriebe behalten das Gelände, das sie brauchen.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game('state.money = 1000; for (const r of Object.keys(RES)) state.res[r] = 99; for (const t of TECHS) state.techs.delete(t.id)');
  game("for (let y = 5; y <= 10; y++) for (let x = 5; x <= 10; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("for (let i = 0; i < 4; i++) state.tiles.set('4,' + (5 + i), { b: 'haus', lvl: 5 }); recalc()");   // Einwohner
});
const T = (x, y, ter) => game(`state.terra.set('${x},${y}', '${ter}'); recalc()`);

describe('Natur wird beim Bauen weggeräumt', () => {
  it('Haus im Wald: Wald wird gerodet (10 Taler dazu)', () => {
    T(6, 6, 'forest');
    expect(game("placeError('haus', 6, 6)")).toBe(null);
    expect(game("build('haus', 6, 6, true)")).toBe(true);
    expect(game("terrainAt(6, 6)")).toBe('grass');
    expect(game('state.money')).toBe(1000 - 40 - 10);
  });

  it('Weg über Fels: Fels wird gesprengt (50 Taler dazu)', () => {
    T(6, 6, 'rock');
    expect(game("build('weg', 6, 6, true)")).toBe(true);
    expect(game("terrainAt(6, 6)")).toBe('grass');
    expect(game('state.money')).toBe(1000 - 5 - 50);
  });

  it('Holzfäller bleibt im Wald, Steinbruch auf dem Fels', () => {
    T(6, 6, 'forest'); T(8, 8, 'rock');
    expect(game("build('holz', 6, 6, true)")).toBe(true);
    expect(game("build('stein', 8, 8, true)")).toBe(true);
    expect(game("[terrainAt(6, 6), terrainAt(8, 8)]")).toEqual(['forest', 'rock']);
  });

  it('ohne Forschung bleibt „Nur im Wald“ – Wegräumen macht keinen Wald', () => {
    T(6, 6, 'obst');
    expect(game("placeError('holz', 6, 6)")).toBe('Nur im Wald – überall mit „Forstwirtschaft“');
  });

  it('kleine Deko im Wald räumt auch', () => {
    T(6, 6, 'forest');
    expect(game("buildSmall('blumentopf', 6, 6, 0)")).toBe(true);
    expect(game("terrainAt(6, 6)")).toBe('grass');
    expect(game('state.money')).toBe(1000 - 10 - 10);
  });

  it('großes Gebäude: alle Felder zusammen, Geld muss für alles reichen', () => {
    T(6, 6, 'forest'); T(7, 6, 'rock');
    game("state.restore.baum = 1; buildRot = 0; rotManual = true");
    const tiles = game("footprint('saege', 6, 6, 0)").map(p => p.join(','));
    const clr = game("clearCost('saege', 6, 6, 0)");
    expect(clr).toBe((tiles.includes('6,6') ? 10 : 0) + (tiles.includes('7,6') ? 50 : 0));
    game(`state.money = ${200 + clr - 1}`);
    expect(game("placeError('saege', 6, 6, 0)")).toBe('Zu wenig Taler');
  });

  it('auf Wasser wird nichts weggeräumt – dafür gibt es Aufschütten', () => {
    T(6, 6, 'water');
    expect(game("placeError('haus', 6, 6)")).toBe('Nicht auf dem Wasser');
  });
});

describe('Geldanzeige', () => {
  it('oben nur glatte Zahlen', () => {
    game("state.tiles.set('6,6', { b: 'feld', lvl: 1 }); recalc(); T.inc = 79.3; T.sci = 4.3; updateHud()");
    expect(document.getElementById('rate').textContent).toBe('+79/s');
    expect(document.getElementById('sci-rate').textContent).toBe('+4/s');
  });
});
