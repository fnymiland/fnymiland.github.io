const { loadGame, game } = require('./helpers/load-game');

// Block 61: große Gebäude kosten Minuten des besten Einkommens (fester Preis als Untergrenze), Wunder zeigen im Menü den
// ganzen Preis
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 99999; state.festival = true');
  game("for (let y = 3; y <= 14; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});

describe('Preise nach Einkommen (Block 61)', () => {
  it('Stadion: 30 Minuten des besten Einkommens, mindestens der alte Preis', () => {
    game('state.incPeak = 0');
    expect(game('ITEMS.stadion.cost')).toBe(2000000);
    game('state.incPeak = 10000');
    expect(game('ITEMS.stadion.cost')).toBe(18000000);
    expect(game('ITEMS.kaffeeplantage.cost')).toBe(1800000);
    expect(game('ITEMS.haus.cost')).toBe(40);                                         // Kleines bleibt fest
    expect(game('ITEMS.kiosk.cost')).toBe(150);
  });

  it('merkt sich den bezahlten Preis; alte Gebäude ohne Preis erstatten nach dem Grundpreis', () => {
    game("for (let x = 5; x <= 14; x++) state.tiles.set(x + ',14', { b: 'haus', lvl: 6 }); recalc(); state.incPeak = 10000");   // Mitarbeiter
    expect(game("build('stadion', 6, 6, true)")).toBe(true);
    expect(game("state.tiles.get('6,6').price")).toBe(18000000);
    expect(game('demolishInfo(6, 6).refund')).toBe(9000000);
    game("delete state.tiles.get('6,6').price");                                      // gebaut vor Block 61
    expect(game('demolishInfo(6, 6).refund')).toBe(1000000);
  });

  it('Wunder: Kachel und Infofenster nennen den ganzen Preis, nicht nur die Baustelle', () => {
    game('state.incPeak = 10000');
    const total = game("wonderTotal('schloss')");
    expect(total).toBe(10000 + 200 * 60 * 10000);
    expect(game("cardPrice('schloss')")).toBe('🪙 120 Mio.');
    game("openBuildInfo('schloss')");
    expect(document.getElementById('panel').textContent).toContain('6 Bauabschnitte');
  });
});
