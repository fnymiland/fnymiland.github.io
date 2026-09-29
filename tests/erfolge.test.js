const { loadGame, game } = require('./helpers/load-game');

// Erfolge: Stufen (⭐), Ehrennadeln, Pokale als Belohnung
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; checkAchievements(true)');
});
const $ = id => document.getElementById(id);

describe('Erfolge', () => {
  it('neues Spiel: noch nichts erreicht', () => {
    expect(game('starCount()')).toBe(0);
  });

  it('verdiente Taler zählen mit (auch wenn man sie ausgibt)', () => {
    game('T.inc = 100; earn(10); state.money = 0; earn(0)');
    expect(game('state.stats.earned')).toBe(1000);
  });

  it('1 Mio. Taler verdient: drei Stufen auf einmal, drei Sterne, ein Band oben', () => {
    game('state.stats.earned = 1e6; checkAchievements()');
    expect(game('state.achieved.taler')).toBe(3);
    expect(game('starCount()')).toBe(3);
    expect($('achv').hidden).toBe(false);
    expect($('achv').textContent).toContain('Taler verdient');
  });

  it('Eisenbahn in km: 10 Schienenfelder = 1 km', () => {
    game("for (let i = 0; i < 10; i++) state.tiles.set((20 + i) + ',30', { b: 'schiene', lvl: 1 }); recalc(); checkAchievements()");
    expect(game('state.achieved.bahn')).toBe(1);
  });

  it('Sterne bringen Ehrennadeln – und die schalten Pokale frei', () => {
    expect(game("available('pokal_bronze')")).toBe(false);
    game('state.stats.earned = 1e6; state.achieved.laternen = 2; checkAchievements()');
    expect(game('starCount()')).toBeGreaterThanOrEqual(5);
    expect(game('rankOf(starCount()).name')).toMatch(/Bronze/);
    expect(game("available('pokal_bronze')")).toBe(true);
    expect(game("available('pokal_silber')")).toBe(false);
  });

  it('beim Laden werden schon erreichte Stufen still gezählt (kein Band-Gewitter)', () => {
    game("state.stats.earned = 2e7; for (let i = 0; i < 12; i++) state.tiles.set((20 + i) + ',30', { b: 'haus', lvl: 1 }); save()");
    game('adoptState(load()); hideAchv()');
    game('updateHud()');
    expect(game('state.achieved.taler')).toBe(4);
    expect($('achv').hidden).toBe(true);
  });

  it('Rathaus: Reiter „Erfolge“ mit allen Erfolgen und Fortschritt', () => {
    game("openTownHall('erfolge')");
    expect(document.querySelectorAll('#modal-card .achv-row').length).toBe(game('ACHIEVEMENTS.length'));
    expect($('modal-card').textContent).toContain('⭐');
  });

  it('Pokale lassen sich zeichnen', () => {
    for (const id of ['pokal_bronze', 'pokal_silber', 'pokal_gold']) {
      expect(() => game(`drawObject('${id}', 100, 100, 1, 1000, 3, 3, 1, { rot: 0, slot: 0 })`)).not.toThrow();
    }
  });
});
