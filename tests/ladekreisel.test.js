const { loadGame, game } = require('./helpers/load-game');

// Block 142: Ladekreisel als HTML (dreht sich auch, während ein langes Bild rechnet): Start, Besuch, „Insel wird gezeichnet …“
beforeAll(() => loadGame());
const el = () => game("(() => { const e = document.getElementById('loading'); return { hidden: e.hidden, big: e.classList.contains('big'), text: e.querySelector('.ld-text').textContent }; })()");
describe('Ladekreisel (Block 142)', () => {
  it('steht schon vor allen Skripten im HTML: ganzer Bildschirm „Fnymiland lädt …“, mit Drehkreisel', () => {
    expect(el()).toEqual({ hidden: false, big: true, text: 'Fnymiland lädt …' });
    expect(game("document.querySelector('#loading').getAttribute('role')")).toBe('status');
    expect(game("!!document.querySelector('#loading .ld-spin')")).toBe(true);
  });
  it('verschwindet, sobald die Insel einmal fertig gezeichnet ist; beim Vorbereiten kommt das kleine Schild', () => {
    game("startNew(); closeModal(); for (let i = 0; i < 4; i++) render(performance.now())");
    expect(el().hidden).toBe(true);
    game('prepShown = performance.now(); loadingUpdate()');
    expect(el()).toEqual({ hidden: false, big: false, text: 'Insel wird gezeichnet …' });
    game('prepShown = 0; loadingUpdate()');
    expect(el().hidden).toBe(true);
  });
  it('Besuch: groß „Die Insel wird geladen …“, bis sie da ist (oder abgelehnt); nach 25 s nicht mehr', () => {
    game('loadingVisit = Date.now(); loadingUpdate()');
    expect(el()).toEqual({ hidden: false, big: true, text: 'Die Insel wird geladen …' });
    game('loadingVisit = 0; loadingUpdate()');
    expect(el().hidden).toBe(true);
    game('loadingVisit = Date.now() - 30000; loadingUpdate()');
    expect(el().hidden).toBe(true);
    game('loadingVisit = 0');
  });
});
