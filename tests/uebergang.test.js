const { loadGame, game } = require('./helpers/load-game');

// Bahnübergänge: Weg über Schiene (oder Schiene über Weg) = Übergang mit Schranken, umbaubar zur Fußgängerbrücke
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel()');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99; state.techs.add("bahn"); state.restore.erzberg = 1');
  game("for (let y = 3; y <= 12; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
  for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, 8, true)`);   // gerade Strecke entlang x
});
const t = (x, y) => game(`state.tiles.get('${x},${y}')`);

describe('Bahnübergang', () => {
  it('Weg über die Schiene: das Feld wird ein Übergang, beide Netze bleiben verbunden', () => {
    for (let y = 5; y <= 11; y++) game(`build('weg', 9, ${y}, true)`);
    expect(t(9, 8)).toMatchObject({ b: 'schiene', cross: true });
    expect(game('railPath("6,8", "12,8").length')).toBe(7);             // Zug fährt durch
    expect(game('pathArms(9, 7)')).toContainEqual([0, 1]);               // Weg schließt an
    expect(game('pathArms(9, 8)').length).toBe(2);
  });

  it('Schiene über einen Weg: der Stil des Wegs bleibt', () => {
    game("state.design.add('weg:kies'); chosenStyle.weg = 'kies'");
    for (let y = 4; y <= 6; y++) game(`build('weg', 13, ${y}, true)`);
    game("chosenStyle.weg = 'sand'");
    for (let x = 12; x <= 14; x++) game(`build('schiene', ${x}, 5, true)`);
    expect(t(13, 5)).toMatchObject({ b: 'schiene', cross: true, style: 'kies' });
  });

  it('nicht auf Kurven und nicht auf Brücken', () => {
    game("build('schiene', 12, 9, true)");                               // 12,8 wird Kurve
    expect(game("build('weg', 12, 8, true)")).toBe(false);
    expect(game("crossError('weg', 12, 8)")).toBe('Übergang nur über gerade Schienen');
    game("state.terra.set('7,10', 'water'); recalc(); build('schiene', 7, 10, true)");
    expect(game("crossError('weg', 7, 10)")).toBe('Kein Übergang auf einer Brücke');
  });

  it('Häuser über den Übergang hinweg liegen im selben Viertel', () => {
    game("state.tiles.set('10,6', { b: 'haus', lvl: 1 }); state.tiles.set('10,10', { b: 'haus', lvl: 1 })");
    for (let y = 6; y <= 10; y++) game(`build('weg', 9, ${y}, true)`);
    game('recalc()');
    expect(game("NET.vOf('10,6') === NET.vOf('10,10')")).toBe(true);
  });

  it('Schranken gehen zu, wenn ein Zug kommt – dann warten die Bewohner', () => {
    for (let y = 7; y <= 9; y++) game(`build('weg', 9, ${y}, true)`);
    expect(game('crossingClosed(9, 8)')).toBe(false);
    expect(game('walkable(9, 8)')).toBe(true);
    game("trains.push({ fake: true }); globalThis.__tc = trainCars; trainCars = () => [{ px: 10.2, py: 8, train: {} }]");
    expect(game('crossingClosed(9, 8)')).toBe(true);
    expect(game('walkable(9, 8)')).toBe(false);
    game('trainCars = globalThis.__tc; trains.length = 0');
  });

  it('Fußgängerbrücke: einmal bezahlt, hin und her umschaltbar, wird gespeichert', () => {
    for (let y = 7; y <= 9; y++) game(`build('weg', 9, ${y}, true)`);
    const m = game('state.money');
    expect(game('setCrossing(9, 8, true)')).toBe(true);
    expect(game('state.money')).toBe(m - 60);
    game('setCrossing(9, 8, false); setCrossing(9, 8, true)');
    expect(game('state.money')).toBe(m - 60);
    game('save()');
    expect(game('load()').tiles.get('9,8')).toMatchObject({ cross: true, foot: true });
  });

  it('abreißen gibt Schiene und Weg zurück', () => {
    for (let y = 7; y <= 9; y++) game(`build('weg', 9, ${y}, true)`);
    expect(game('demolishInfo(9, 8).refund')).toBe(15 + 5);
  });

  it('zeichnen geht: offen, geschlossen, Brücke, tags und nachts', () => {
    for (let y = 7; y <= 9; y++) game(`build('weg', 9, ${y}, true)`);
    for (const foot of [false, true]) for (const n of [0, 0.8]) {
      game(`state.tiles.get('9,8').foot = ${foot}; night = ${n}`);
      expect(() => game("drawRailBed(100, 100, 1, 9, 8, state.tiles.get('9,8')); drawObject('schiene', 100, 100, 1, 1000, 9, 8, 1, state.tiles.get('9,8'))")).not.toThrow();
    }
    game('night = 0');
  });
});
