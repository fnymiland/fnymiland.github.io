const { loadGame, game } = require('./helpers/load-game');

// Bildrate: beim Bedienen flüssig, beim Zuschauen 30/s, im Hintergrund oder lange ohne Eingabe 15/s (Strom sparen)
beforeAll(() => loadGame());
const fps = expr => Math.round(1000 / game(expr));

describe('Bildrate', () => {
  it('beim Bedienen 60 Bilder/s (auch auf 120-Hz-Bildschirmen nicht mehr)', () => {
    game('lastInput = 10000; document.hasFocus = () => true');
    expect(fps('frameInterval(10500)')).toBe(60);
  });
  it('beim Zuschauen 30 Bilder/s', () => {
    expect(fps('frameInterval(15000)')).toBe(30);
  });
  it('nach 2 Minuten ohne Eingabe oder im Hintergrund 15 Bilder/s', () => {
    expect(fps('frameInterval(10000 + 121000)')).toBe(15);
    game('document.hasFocus = () => false');
    expect(fps('frameInterval(15000)')).toBe(15);
    game('document.hasFocus = () => true');
  });
});
