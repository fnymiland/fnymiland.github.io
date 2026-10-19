const fs = require('fs');
const path = require('path');
const { loadGame, game } = require('./helpers/load-game');

// Generalprobe 19.10.2026: main.js lädt den Spielstand schon beim Einlesen der Skripte. Standen sternstaub*.js dahinter, kannte
// parseSave die Sammlungs-Waren noch nicht – gekaufte Waren und hingestellte Stücke waren nach dem Neuladen weg, und die
// Nachzahlung lief ohne Obergrenze (je Erfolg eine Meldung) statt still mit Willkommensfenster. Hier wie im Browser: erst der
// gespeicherte Stand, dann die Skripte in der Reihenfolge von index.html
beforeAll(() => {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'testsave-neu.json'), 'utf8'));
  d.sdItems = ['sd_rentier', 'sd_zwergenhaus', 'sd_kirschbaum'];
  d.sdShown = ['sd_rentier', 'sd_schneemann'];
  d.sdWish = ['sd_schneemann'];
  d.sdSeen = false; d.stardust = 0; d.sdGot = [];
  d.achieved = { ...(d.achieved || {}) };
  localStorage.setItem('kachelhausen_v3', JSON.stringify(d));
  loadGame();
});

describe('Sternstaub beim Laden (Skript-Reihenfolge)', () => {
  it('gekaufte Sammlungs-Waren, Gesehenes und Herzchen überstehen das Laden', () => {
    expect(game('[...state.sdItems].sort()')).toEqual(['sd_kirschbaum', 'sd_rentier', 'sd_zwergenhaus']);
    expect(game('[...state.sdShown].sort()')).toEqual(['sd_rentier', 'sd_schneemann']);
    expect(game('[...state.sdWish]')).toEqual(['sd_schneemann']);
  });
  it('die Nachzahlung läuft beim Laden (still, höchstens 300 ✨), nicht erst in der Spielschleife', () => {
    expect(game('state.sdGot.size')).toBeGreaterThan(0);
    expect(game('state.stardust')).toBeLessThanOrEqual(game('SD.backMax'));
  });
  it('sternstaub*.js stehen in index.html vor main.js', () => {
    const order = require('./helpers/load-game').scriptList();
    for (const f of ['js/sternstaub.js', 'js/sternstaub-waren.js']) expect(order.indexOf(f)).toBeLessThan(order.indexOf('js/main.js'));
  });
});
