const { loadGame, game } = require('./helpers/load-game');

// Forschung, die sich lohnt: teurer und steigend, endlose Stufen, Erfindungen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("for (let y = 3; y <= 12; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); }");
  game("state.tiles.set('5,5', { b: 'schule', lvl: 1 }); state.tiles.set('8,5', { b: 'bibliothek', lvl: 1 }); state.tiles.set('10,5', { b: 'uni', lvl: 1 }); recalc()");
});
const $ = id => document.getElementById(id);

describe('Preise', () => {
  it('Stufe 1 ×5, Stufe 2 ×25, Stufe 3 ×80', () => {
    expect(game('techCost(TECH_BY_ID.duenger)')).toBe(20 * 5);
    expect(game('techCost(TECH_BY_ID.industrie)')).toBe(120 * 25);
    expect(game('techCost(TECH_BY_ID.sterne)')).toBe(400 * 80);
  });

  it('jede erforschte Sache macht die nächste 10 % teurer', () => {
    const c0 = game('techCost(TECH_BY_ID.axt)');
    game("state.science = 1e6; research('duenger')");
    expect(game("techCost(TECH_BY_ID.axt)")).toBe(game(`niceSci(${c0} * 1.1)`));
    expect(game('state.science')).toBe(1e6 - 100);
  });
});

describe('Stufen-Forschung', () => {
  it('fünf Themen, endlos, +5 % je Stufe, jede Stufe 1,5× teurer', () => {
    expect(game('MASTERY.map(m => m.id)')).toEqual(['taler', 'rohstoffe', 'strom', 'einwohner', 'schoen']);
    game('state.science = 1e9');
    const c1 = game("masteryCost('taler')");
    expect(game("studyMastery('taler')")).toBe(true);
    expect(game("masteryCost('taler')")).toBe(game(`niceSci(${c1} * 1.5)`));
    for (let i = 0; i < 20; i++) game("studyMastery('taler')");
    expect(game("masteryLvl('taler')")).toBe(21);
    expect(game("masteryMul('taler')")).toBeCloseTo(2.05);
  });

  it('wirkt: Taler, Einwohner, Schönheit, Strom', () => {
    game("state.tiles.set('6,9', { b: 'feld', lvl: 1 }); state.tiles.set('9,9', { b: 'haus', lvl: 3 }); state.tiles.set('12,9', { b: 'windrad', lvl: 1 }); state.decos.set('12,11', [{ b: 'bank', rot: 0 }, null, null, null]); recalc()");
    const [inc, pop, beauty, sup] = game('[T.inc, T.pop, T.beauty, T.rail.power.supply]');
    game("state.mastery = { taler: 2, einwohner: 4, schoen: 2, strom: 2 }; recalc()");
    expect(game('T.inc')).toBeCloseTo(inc * 1.1);
    expect(game('T.pop')).toBe(Math.round(pop * 1.2));
    expect(game('T.beauty')).toBe(Math.round(beauty * 1.1));
    expect(game('T.rail.power.supply')).toBeCloseTo(sup * 1.1);
  });

  it('erst ab der Bibliothek; wird gespeichert', () => {
    game("state.tiles.delete('8,5'); state.tiles.delete('10,5'); recalc(); state.science = 1e9");
    expect(game("studyMastery('taler')")).toBe(false);
    game("state.tiles.set('8,5', { b: 'bibliothek', lvl: 1 }); recalc(); studyMastery('strom'); save()");
    expect(game('load().mastery.strom')).toBe(1);
  });
});

describe('Erfindungen', () => {
  it('nur für Ideen, ab der Universität; die Seilbahn schaltet Stationen frei', () => {
    expect(game("available('seilbahn')")).toBe(false);
    game('state.science = 1e6');
    expect(game("invent('seilbahn')")).toBe(true);
    expect(game('state.science')).toBe(1e6 - game("INVENTIONS.find(i => i.id === 'seilbahn').cost"));
    expect(game("available('seilbahn')")).toBe(true);
    expect(game("invent('seilbahn')")).toBe(false);                            // schon erfunden
    game('save()');
    expect(game("load().inventions.has('seilbahn')")).toBe(true);
  });

  it('Feuerwerk zünden, Ballons, Zeppelin und Seilbahn lassen sich zeichnen (Tag und Nacht)', () => {
    game("state.science = 1e7; for (const i of INVENTIONS) invent(i.id)");
    game("state.tiles.set('3,3', { b: 'rathaus', lvl: 1 }); state.tiles.set('6,11', { b: 'seilbahn', lvl: 1 }); state.tiles.set('14,11', { b: 'seilbahn', lvl: 1 }); recalc()");
    expect(game('skyInfo().cables.length')).toBe(1);
    game('startFireworks()');
    for (const night of [0, 0.8]) for (const now of [1000, 5000, 9000]) {
      expect(() => game(`night = ${night}; drawSky(${now}, 1); drawFireworks(performance.now() + ${now}, 1)`)).not.toThrow();
    }
    expect(() => game("drawObject('seilbahn', 100, 100, 1, 1000, 6, 11, 1, { b: 'seilbahn', lvl: 1 })")).not.toThrow();
    game('night = 0');
  });

  it('Forschungsfenster: Reiter Stufen und Erfindungen', () => {
    game("state.science = 1e6; openResearch('stufen')");
    expect(document.querySelectorAll('#modal-card [data-mastery]').length).toBe(5);
    game("openResearch('erfindung')");
    expect(document.querySelectorAll('#modal-card [data-invent]').length).toBe(4);
    game('closeModal()');
  });
});
