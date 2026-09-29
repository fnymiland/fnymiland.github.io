const { loadGame, game } = require('./helpers/load-game');

// Mehrere kleine Dekos auf einem Feld – auch der Baum
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("state.money = 5000; state.res.bretter = 20");
  game("for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});

describe('Baum als kleine Deko', () => {
  it('Baum, Bank, Blumentopf und Busch passen zusammen auf ein Feld', () => {
    expect(game("buildSmall('baum', 5, 5, 0)")).toBe(true);
    expect(game("buildSmall('bank', 5, 5, 3)")).toBe(true);
    expect(game("buildSmall('blumentopf', 5, 5, 1)")).toBe(true);
    expect(game("buildSmall('busch', 5, 5, 2)")).toBe(true);
    expect(game("state.decos.get('5,5').map(d => d.b)")).toEqual(['baum', 'blumentopf', 'busch', 'bank']);
    expect(game("state.tiles.has('5,5')")).toBe(false);
  });

  it('auch vier Bäume auf einem Feld (ein kleines Wäldchen)', () => {
    for (let i = 0; i < 4; i++) expect(game(`buildSmall('baum', 5, 5, ${i})`)).toBe(true);
    expect(game('state.money')).toBe(5000 - 4 * 15);
  });

  it('ein Baum neben einem Haus zählt als Deko für den Hauswunsch', () => {
    game("state.tiles.set('5,5', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("wishMet('deko', 5, 5)")).toBe(false);
    game("buildSmall('baum', 6, 5, 0)");
    expect(game("wishMet('deko', 5, 5)")).toBe(true);
  });

  it('alte Stände: ein Baum auf einem ganzen Feld wandert in die hintere Ecke', () => {
    game("state.tiles.set('5,5', { b: 'baum', lvl: 1 }); state.decos.set('6,6', [null, null, null, { b: 'bank', rot: 0 }]); state.tiles.set('6,6', { b: 'baum', lvl: 1 })");
    game('normalizeSmall(); recalc()');
    expect(game("state.tiles.has('5,5') || state.tiles.has('6,6')")).toBe(false);
    expect(game("state.decos.get('5,5')[0].b")).toBe('baum');
    expect(game("state.decos.get('6,6').map(d => d && d.b)")).toEqual(['baum', null, null, 'bank']);
  });
});

describe('Ecke wählen', () => {
  it('ist die angetippte Ecke belegt, nimmt die Deko die nächste freie', () => {
    game("buildSmall('blumentopf', 5, 5, 3)");
    expect(game('freeSlot(5, 5, 0)')).toBe(0);
    const s = game('freeSlot(5, 5, 3)');
    expect([1, 2]).toContain(s);                                  // eine Nachbarecke, nicht die gegenüber
  });

  it('sind alle vier Ecken voll, sagt der Hinweis das', () => {
    for (let i = 0; i < 4; i++) game(`buildSmall('busch', 5, 5, ${i})`);
    expect(game('freeSlot(5, 5, 2)')).toBe(2);
    expect(game("smallError('busch', 5, 5, 2)")).toBe('Alle 4 Ecken sind belegt');
  });
});
