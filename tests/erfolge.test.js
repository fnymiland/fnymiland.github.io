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

  it('Brückenfelder (160c G1): übers Wasser (Weg, Gleis) je Feld, Fußgängerbrücke am Übergang je 1, Deckfelder zwischen Anhöhen – Abriss nimmt keinen Stern', () => {
    const b0 = game("ACHIEVEMENTS.find(a => a.id === 'bruecken').value()");
    game("for (let i = 0; i < 3; i++) state.tiles.set((20 + i) + ',30', { b: 'weg', lvl: 1, style: 'sand', bridge: true }); for (let i = 0; i < 2; i++) state.tiles.set((20 + i) + ',32', { b: 'schiene', lvl: 1, bridge: true }); state.tiles.set('20,34', { b: 'schiene', lvl: 1, cross: true, foot: true, footPaid: 'holz' }); state.tiles.set('22,34', { b: 'schiene', lvl: 1, cross: true, footPaid: 'holz' }); state.bruecken.set('14,12', { ax: 0, n: 4, art: 'holz' }); recalc()");
    expect(game("ACHIEVEMENTS.find(a => a.id === 'bruecken').value()") - b0).toBe(10);   // 3 + 2 + 1 + 4; Schranken (Brücke aus) zählen nicht
    game('checkAchievements()');
    expect(game('state.achieved.bruecken')).toBe(1);
    game("state.bruecken.clear(); state.tiles.delete('20,34'); recalc(); checkAchievements()");
    expect(game("ACHIEVEMENTS.find(a => a.id === 'bruecken').value()") - b0).toBe(5);
    expect(game('state.achieved.bruecken')).toBe(1);                       // Sterne sinken nie
  });

  it('Wege in km (160c G1): auch der Weg auf dem Deck einer Brücke zwischen Anhöhen (wie das Gleis bei der Eisenbahn)', () => {
    const km = () => game("Math.round(ACHIEVEMENTS.find(a => a.id === 'wege').value() * 10)"), w0 = km();   // in Feldern (× 0,1 km)
    game("state.bruecken.set('14,12', { ax: 0, n: 4, art: 'holz', weg: ['sand', 'kies', null, 'sand'] }); recalc()");
    expect(km() - w0).toBe(3);                                             // drei Deckfelder mit Weg, das leere nicht
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
