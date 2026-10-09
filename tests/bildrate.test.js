const { loadGame, game } = require('./helpers/load-game');

// Bildrate: beim Bedienen flüssig, beim Zuschauen 30/s, im Hintergrund oder lange ohne Eingabe 15/s (Strom sparen)
beforeAll(() => loadGame());
const fps = expr => Math.round(1000 / game(expr));

describe('Bildrate (sparsam)', () => {
  it('beim Bedienen 60 Bilder/s (auch auf 120-Hz-Bildschirmen nicht mehr)', () => {
    game("setFpsMode('sparsam'); lastInput = 10000; document.hasFocus = () => true");
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

describe('Bildrate wählbar (Block 79)', () => {
  it('flüssig: immer 60 Bilder/s, nur im Hintergrund 30; im Menü umschaltbar und je Gerät gemerkt', () => {
    game("setFpsMode('fluessig'); lastInput = 10000; document.hasFocus = () => true");
    expect(fps('frameInterval(15000)')).toBe(60);
    expect(fps('frameInterval(10000 + 121000)')).toBe(60);
    game('document.hasFocus = () => false');
    expect(fps('frameInterval(15000)')).toBe(30);
    game('document.hasFocus = () => true; showSettings()');
    expect(game("document.getElementById('m-fps').textContent")).toMatch(/flüssig/);
    game("document.getElementById('m-fps').click()");
    expect(game('fpsMode')).toBe('sparsam');
    expect(game("localStorage.getItem('kachelhausen-bildrate')")).toBe('sparsam');
    expect(game("document.getElementById('m-fps').textContent")).toMatch(/sparsam/);
    game('closeModal()');
  });
  it('ohne Wahl: Touchscreen sparsam, sonst flüssig', () => {
    game("window.matchMedia = q => ({ matches: q === '(pointer: coarse)' })");
    expect(game('touchDevice()')).toBe(true);
    game('window.matchMedia = () => ({ matches: false })');
    expect(game('touchDevice()')).toBe(false);
  });
});
