const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("state.money = 1e6; state.science = 5000; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass'); recalc()");
});

describe('Kunstakademie: Aussehen einzeln freischalten', () => {
  it('am Anfang: drei Wand- und Dachfarben und der Kiesweg', () => {
    expect(game("colorsOf('wall').length")).toBe(3);
    expect(game("colorsOf('roof').length")).toBe(3);
    expect(game("STYLES.weg.filter(styleOk).map(s => s.id)")).toEqual(expect.arrayContaining(['sand']));
    expect(game("styleOk(styleDef('weg', 'mulch'))")).toBe(false);
    expect(game("styleOk(styleDef('weg', 'asphalt'))")).toBe(false);
  });

  it('jedes Stück einzeln kaufen – Erde ja, Asphalt nicht', () => {
    const price = game("designPrice(DESIGN_BY_ID['weg:mulch'])");
    expect(game("buyDesign('weg:mulch')")).toBe(true);
    expect(game('state.money')).toBe(1e6 - price);
    expect(game("styleOk(styleDef('weg', 'mulch'))")).toBe(true);
    expect(game("styleOk(styleDef('weg', 'asphalt'))")).toBe(false);
    expect(game("buyDesign('wall:5')")).toBe(true);
    expect(game("colorOk('wall', 5) && !colorOk('wall', 6)")).toBe(true);
    expect(game("buyDesign('weg:mulch')")).toBe(false);                // schon da
  });

  it('Meisterstücke brauchen eine Kunstakademie', () => {
    expect(game("designError(DESIGN_BY_ID['weg:fisch'])")).toBe('Braucht eine Kunstakademie');
    game("state.tiles.set('8,8', { b: 'kunst', lvl: 1 }); recalc()");
    expect(game("buyDesign('weg:fisch')")).toBe(true);
  });

  it('Deko wie die Laterne gibt es auch dort', () => {
    expect(game("available('laterne')")).toBe(false);
    game("buyDesign('laterne')");
    expect(game("available('laterne')")).toBe(true);
  });

  it('neue Häuser bekommen eine der freigeschalteten Farben', () => {
    for (let i = 0; i < 6; i++) game(`build('haus', ${6 + i}, 6, true)`);
    const walls = game("[...state.tiles.values()].filter(t => t.b === 'haus').map(t => t.wall)");
    expect(walls.every(w => w < 3)).toBe(true);
  });
});

describe('Forschung in Stufen', () => {
  it('Stufe 1 braucht eine Schule, Stufe 2 eine Bibliothek', () => {
    expect(game("techReady(TECH_BY_ID.duenger)")).toBe(false);
    game("state.tiles.set('6,6', { b: 'schule', lvl: 1 }); recalc()");
    expect(game("techReady(TECH_BY_ID.duenger)")).toBe(true);
    expect(game("techReady(TECH_BY_ID.muehlrad)")).toBe(false);
    game("state.tiles.set('9,9', { b: 'bibliothek', lvl: 1 }); recalc()");
    expect(game("techReady(TECH_BY_ID.muehlrad)")).toBe(true);
    game("research('duenger')");
    expect(game("hasTech('duenger')")).toBe(true);
  });

  it('Scharfe Äxte: Holzfäller liefern mehr', () => {
    game("state.terra.set('8,8', 'forest'); state.tiles.set('8,8', { b: 'holz', lvl: 1 }); recalc()");
    const before = game('T.prod.holz');
    game("state.techs.add('axt'); recalc()");
    expect(game('T.prod.holz')).toBeCloseTo(before * 1.3);
  });
});

describe('Überall bauen nach Forschung', () => {
  beforeEach(() => game("state.tiles.set('11,11', { b: 'haus', lvl: 5 }); state.tiles.set('11,10', { b: 'haus', lvl: 5 }); recalc()"));
  it('Obstplantage erst im Obsthain, mit „Höhere Agrartechnik“ auf jeder Wiese', () => {
    expect(game("placeError('obst', 8, 8)")).toMatch(/Höhere Agrartechnik/);
    game("state.techs.add('agrar')");
    expect(game("placeError('obst', 8, 8)")).toBe(null);
  });
  it('Holzfäller mit Forstwirtschaft, Steinbruch mit Tiefbau, Bergwerk mit Tiefbohrung', () => {
    expect(game("placeError('holz', 8, 8)")).not.toBe(null);
    game("state.techs.add('forst'); state.techs.add('tiefbau'); state.techs.add('bohrung')");
    expect(game("placeError('holz', 8, 8)")).toBe(null);
    expect(game("placeError('stein', 8, 8)")).toBe(null);
    expect(game("placeError('mine', 8, 8)")).toBe(null);
  });
});

describe('Preise nach Einkommen (Block 50)', () => {
  it('mindestens 5× so teuer wie früher, Meisterstücke 25×; mit viel Einkommen ein paar Minuten davon', () => {
    game('state.incPeak = 0; T.inc = 0; T.salesInc = 0');
    expect(game("designPrice(DESIGN_BY_ID['weg:mulch'])")).toBeGreaterThanOrEqual(200);   // 40 × 5
    expect(game("designPrice(DESIGN_BY_ID['statue'])")).toBeGreaterThanOrEqual(22000);    // 900 × 25 (gerundet)
    game('state.incPeak = 1000');                                                        // 1000 Taler/s
    const normal = game("designPrice(DESIGN_BY_ID['laterne'])"), master = game("designPrice(DESIGN_BY_ID['statue'])");
    expect(normal).toBeGreaterThanOrEqual(60 * 1000 * 0.95);                             // Laterne (Stadtschmuck, Block 108): etwa 1 Minute
    expect(normal).toBeLessThanOrEqual(60 * 1000 * 1.05);
    expect(game("designPrice(DESIGN_BY_ID['bank:form:stein'])")).toBeLessThanOrEqual(60 * 1000 * 1.05);
    expect(game("designPrice(DESIGN_BY_ID['pavillon'])")).toBeGreaterThanOrEqual(3 * 60 * 1000 * 0.95);   // andere Deko: weiter etwa 3 Minuten
    expect(master / game("designPrice(DESIGN_BY_ID['wall:5'])")).toBeGreaterThan(4);     // Meisterstück deutlich teurer
  });

  it('zu wenig Taler: nicht kaufbar', () => {
    game('state.money = 100; state.incPeak = 0');
    expect(game("designError(DESIGN_BY_ID['weg:mulch'])")).toBe('Zu wenig Taler');
  });
});
