const { loadGame, game } = require('./helpers/load-game');

// Eisenbahn: Forschung, Schienen an Land und als Brücke übers Wasser
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game('state.money = 99999; state.science = 9999; for (const r of Object.keys(RES)) state.res[r] = 99');
  game("for (let y = 3; y <= 12; y++) for (let x = 6; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const unlock = () => game("state.tiles.set('3,10', { b: 'bibliothek', lvl: 1 }); state.restore.erzberg = 1; state.techs.add('bahn'); recalc()");
const coast = () => game(`(() => {
  for (let x = 2; x < 60; x++) { const y = 3; if (!ownedTile(x, y) && isSea(x, y) && ownedTile(x - 1, y)) return [x, y]; }
  return null;
})()`);

describe('Forschung Eisenbahn', () => {
  it('gibt es in Stufe 2, aber erst mit der Erzinsel (Erzberg, 1. Laterne)', () => {
    game("state.tiles.set('3,10', { b: 'bibliothek', lvl: 1 }); recalc()");
    const t = "TECH_BY_ID.bahn";
    expect(game(`${t}.tier`)).toBe(2);
    expect(game(`techReady(${t})`)).toBe(false);
    game('state.restore.erzberg = 1');
    expect(game(`techReady(${t})`)).toBe(true);
  });

  it('schaltet Schienen und Bahnhof frei', () => {
    expect(game("available('schiene')")).toBe(false);
    unlock();
    expect(game("available('schiene') && available('station')")).toBe(true);
  });
});

describe('Schienen', () => {
  beforeEach(unlock);

  it('an Land: 15 Taler, 1 Holz, 1 Metall', () => {
    const m = game('state.money'), h = game('state.res.holz');
    expect(game("build('schiene', 8, 8, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 15);
    expect(game('state.res.holz')).toBe(h - 1);
    expect(game("state.tiles.get('8,8').bridge")).toBeFalsy();
  });

  it('über Wasser als Brücke – teurer', () => {
    game("state.terra.set('8,8', 'water'); recalc()");
    const m = game('state.money');
    expect(game("placeError('schiene', 8, 8)")).toBe(null);
    expect(game("placeError('haus', 8, 8)")).toBe('Nicht auf dem Wasser');
    expect(game("build('schiene', 8, 8, true)")).toBe(true);
    expect(game("state.tiles.get('8,8').bridge")).toBe(true);
    expect(game('state.money')).toBe(m - 40);
  });

  it('als Brücke ins offene Meer, Feld für Feld von der Küste aus', () => {
    const [x, y] = coast();
    expect(game(`placeError('schiene', ${x + 1}, ${y})`)).toBe('Im Meer nur direkt neben deinem Land');
    expect(game(`build('schiene', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`build('schiene', ${x + 1}, ${y}, true)`)).toBe(true);
    expect(game(`state.claimed.has('${x + 1},${y}') && state.tiles.get('${x + 1},${y}').bridge`)).toBe(true);
  });

  it('abreißen gibt alles zurück, bei Brücken die Brückenkosten', () => {
    game("state.terra.set('9,9', 'water'); recalc()");
    game("build('schiene', 8, 8, true); build('schiene', 9, 9, true)");
    expect(game('demolishInfo(8, 8).refund')).toBe(15);
    expect(game('demolishInfo(9, 9).refund')).toBe(40);
    expect(game('demolishInfo(9, 9).mat')).toEqual({ holz: 2, metall: 2 });
  });

  it('unter einer Brücke aufschütten: wird normale Schiene, der Unterschied kommt zurück', () => {
    game("state.terra.set('9,9', 'water'); recalc(); build('schiene', 9, 9, true)");
    const m = game('state.money');
    expect(game("build('schuett', 9, 9, true)")).toBe(true);
    expect(game("state.tiles.get('9,9').bridge")).toBeFalsy();
    expect(game('state.money')).toBe(m - 60 + 25);
  });

  it('Schienen verbinden keine Viertel (Inseln bleiben eigene Orte)', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); state.tiles.set('12,6', { b: 'haus', lvl: 1 })");
    for (let x = 7; x <= 11; x++) game(`build('schiene', ${x}, 6, true)`);
    game('recalc()');
    expect(game("T.st.get('6,6').n")).toBe(1);
    expect(game("railArms(9, 6)")).toEqual([[1, 0], [-1, 0]]);
  });

  it('zeichnen geht ohne Fehler (gerade, Kurve, Kreuzung, Brücke, einzeln)', () => {
    game("state.terra.set('10,10', 'water'); recalc()");
    for (const [x, y] of [[8, 8], [9, 8], [10, 8], [9, 9], [9, 7], [10, 9], [10, 10], [13, 12]]) game(`build('schiene', ${x}, ${y}, true)`);
    for (const k of ['8,8', '9,8', '10,8', '9,9', '10,10', '13,12']) {
      expect(() => game(`drawRailBed(100, 100, 1, ${k}, state.tiles.get('${k}')); drawObject('schiene', 100, 100, 1, 0, ${k}, 1, state.tiles.get('${k}'))`)).not.toThrow();
    }
  });
});

describe('Speichern', () => {
  it('Brücken bleiben nach dem Laden Brücken', () => {
    unlock();
    game("state.terra.set('9,9', 'water'); recalc(); build('schiene', 9, 9, true); save()");
    expect(game('load()').tiles.get('9,9').bridge).toBe(true);
  });
});

describe('Alte Stände', () => {
  it('der neue Bahnhof bleibt beim Laden stehen (der alte, entfernte hieß „bahnhof“ und wird erstattet)', () => {
    unlock();
    game("state.tiles.set('8,8', { b: 'station', lvl: 1 }); save()");
    expect(game('load()').tiles.get('8,8').b).toBe('station');
  });
});
