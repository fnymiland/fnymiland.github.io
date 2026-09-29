const { loadGame, game } = require('./helpers/load-game');

// Sorten: „Haus in der Nähe“ = jedes Wohnhaus, „Brunnen“ = auch Kristallbrunnen, „Park“ = auch Botanischer Garten
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});

describe('Wohnhäuser', () => {
  it('alle fünf Wohnformen zählen als Haus', () => {
    for (const b of ['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']) expect(game(`isHome('${b}')`)).toBe(true);
    expect(game("isHome('schule')")).toBe(false);
  });

  it('Markt ausbauen: „5 Wohnhäuser in der Nähe“ – Reihenhäuser und Baumhäuser zählen mit', () => {
    game("state.tiles.set('10,10', { b: 'markt', lvl: 1, rot: 0 })");
    for (const [i, b] of [['reihenhaus'], ['reihenhaus'], ['baumhaus'], ['ferienhaus'], ['haus']].map((b, i) => [i, b[0]])) game(`state.tiles.set('${6 + 2 * i},6', { b: '${b}', lvl: 1, rot: 0 })`);
    game('recalc()');
    const c = game("stageInfo(state.tiles.get('10,10'), 10, 10).conds.find(c => /Wohnhäuser/.test(c.text))");
    expect(c.text).toBe('5 Wohnhäuser erreichbar (8 Felder, oder per Weg/Bahn)');
    expect(c.ok).toBe(true);
  });

  it('Betriebe neben Reihenhäusern sind „in Laufweite“ (kein 🐌), Deko daneben zählt 1,5-fach', () => {
    game("state.tiles.set('6,6', { b: 'reihenhaus', lvl: 1, rot: 0 }); state.terra.set('9,9', 'forest'); state.tiles.set('9,9', { b: 'holz', lvl: 1 }); recalc()");
    expect(game("T.st.get('9,9').how")).toBe('nah');
    expect(game('nearHouse(7, 6)')).toBe(true);
  });
});

describe('Brunnen und Parks', () => {
  it('„Park oder Brunnen in der Nähe“: auch Kristallbrunnen und Botanischer Garten', () => {
    for (const b of ['brunnen', 'kristallbrunnen', 'park', 'botgarten']) {
      game("for (const k of ['12,12']) state.tiles.delete(k)");
      game(`state.tiles.set('12,12', { b: '${b}', lvl: 1, rot: 0, phase: 99 }); recalc()`);
      expect([b, game("wishMet('park', 10, 10)")]).toEqual([b, true]);
    }
  });

  it('Bibliothek ausbauen: Kristallbrunnen zählt als Brunnen', () => {
    game("state.tiles.set('10,10', { b: 'bibliothek', lvl: 2, rot: 0 }); state.tiles.set('12,13', { b: 'kristallbrunnen', lvl: 1 }); recalc()");
    const c = game("stageInfo(state.tiles.get('10,10'), 10, 10).conds.find(c => /Brunnen/.test(c.text))");
    expect(c.ok).toBe(true);
  });

  it('Kunstakademie ausbauen: das Baumeister-Denkmal zählt als Statue', () => {
    game("state.tiles.set('10,10', { b: 'kunst', lvl: 2, rot: 0 }); state.tiles.set('12,12', { b: 'denkmal', lvl: 1 }); recalc()");
    const c = game("stageInfo(state.tiles.get('10,10'), 10, 10).conds.find(c => /Statue/.test(c.text))");
    expect(c.ok).toBe(true);
  });
});
