const { loadGame, game } = require('./helpers/load-game');

// Block 60a: Freizeitpark – Boden malen, Module darauf, Stufen Rummelplatz/Freizeitpark/Wunderland, Wirkung, Preise
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; undoStack.length = 0");
  game("state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const ground = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) game(`build('fzboden', ${x}, ${y}, true)`); game('recalc()'); };
const stages = () => game('computeFz().map(p => p.stage)');

describe('Freischalten und Boden', () => {
  it('erst nach dem Laternenfest; im Menü unter Freizeit → Freizeitpark', () => {
    game('state.festival = false');
    expect(game("available('fzboden') || available('fz_karussell')")).toBe(false);
    game('state.festival = true');
    expect(game("menuPlaceOf('fz_karussell')")).toEqual({ top: 'freizeit', sub: 'fzpark' });
    expect(game("build('fzboden', 10, 10, true)")).toBe(true);
    expect(game('terraLook(10, 10)')).toBe('fz');
    expect(game('terrainAt(10, 10)')).toBe('grass');
  });

  it('Module nur auf Freizeitpark-Boden; Häuser nicht auf den Boden', () => {
    expect(game("placeError('fz_zuckerwatte', 10, 10)")).toMatch(/Freizeitpark-Boden/);
    ground(10, 10, 3, 3);
    expect(game("placeError('fz_zuckerwatte', 10, 10)")).toBe(null);
    expect(game("placeError('haus', 11, 11)")).toMatch(/Freizeitpark/);
    expect(game("placeError('blumentopf', 11, 11)")).toBe(null);
    expect(game("placeError('fz_karussell', 12, 12)")).toMatch(/Freizeitpark-Boden/);   // ragt hinaus
  });
});

describe('Stufen und Wirkung', () => {
  it('Rummelplatz ab 9 Feldern und 2 Attraktionen; Freizeitpark braucht 25 Felder, 5 Attraktionen, Eingang, Fahrt, Stand', () => {
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); recalc()");
    expect(stages()).toEqual([0]);
    game("build('fz_zuckerwatte', 12, 12, true); recalc()");
    expect(stages()).toEqual([1]);
    ground(10, 10, 5, 5);
    game("rotManual = true; buildRot = 0; build('fz_karussell', 11, 10, true); build('fz_tor', 14, 10, true); build('fz_zuckerwatte', 10, 14, true); recalc()");
    expect(stages()).toEqual([2]);
  });

  it('bringt Einnahmen (+%), Besucher und Schönheit – auch ringsum', () => {
    game("for (let x = 3; x <= 8; x++) state.tiles.set(x + ',22', { b: 'haus', lvl: 3 })");    // etwas Einkommen
    const before = game('(recalc(), [T.inc, T.beauty, placeStats().attr.get(regionAt(10, 10)) || 0])');
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); build('fz_zuckerwatte', 12, 12, true); recalc()");
    const after = game('[T.inc, T.beauty, placeStats().attr.get(regionAt(10, 10)) || 0]');
    expect(after[0]).toBeGreaterThan(before[0] * 1.07);
    expect(after[1]).toBeGreaterThanOrEqual(before[1] + game('FZ_BEAUTY[1]'));
    expect(after[2]).toBeGreaterThanOrEqual(before[2] + game('FZ_ATTR[1]'));
    expect(game('beautyAround(15, 11, 0)')).toBeGreaterThanOrEqual(game('FZ_BEAUTY[1]'));    // 3 Felder daneben
  });
});

describe('Preise', () => {
  it('nach dem besten Einkommen (mindestens Grundpreis); Abriss erstattet die Hälfte dessen, was man bezahlt hat', () => {
    game('state.incPeak = 0');
    expect(game('ITEMS.fz_zuckerwatte.cost')).toBe(20000);
    game('state.incPeak = 1000');                                                  // 2 Minuten von 1000/s
    expect(game('ITEMS.fz_zuckerwatte.cost')).toBe(120000);
    ground(10, 10, 1, 1);
    const m = game('state.money');
    game("build('fz_zuckerwatte', 10, 10, true)");
    expect(game("state.tiles.get('10,10').price")).toBe(120000);
    game('state.incPeak = 1e6');                                                   // später reicher: Erstattung bleibt
    game('demolish(10, 10)');
    expect(game('state.money')).toBe(m - 120000 + 60000);
  });

  it('Boden entfernen geht nicht unter einem Fahrgeschäft', () => {
    ground(10, 10, 1, 1);
    game("build('fz_zuckerwatte', 10, 10, true)");
    expect(game('removeFzGround(10, 10)')).toBe(false);
    game('demolish(10, 10)');
    expect(game('removeFzGround(10, 10)')).toBe(true);
    expect(game('terraLook(10, 10)')).not.toBe('fz');
  });

  it('Fenster: Boden zeigt Stufe und was fehlt', () => {
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); recalc(); openFzInfo(11, 11)");
    expect(game("document.getElementById('panel').textContent")).toMatch(/Noch kein Freizeitpark.*fehlt noch: 1 Attraktion/s);
  });
});
