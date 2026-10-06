const { loadGame, game } = require('./helpers/load-game');

// Block 52: Knöpfe oben reagieren auf den ersten Tipp (iPad) – beim Loslassen, genau einmal
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal(); closePanel()'); });
const touch = (id, type) => game(`document.getElementById('${id}').dispatchEvent(Object.assign(new Event('${type}', { bubbles: true }), { pointerType: 'touch' }))`);

describe('Knöpfe oben', () => {
  it('ein Finger-Tipp auf Forschung öffnet sie sofort, der nachfolgende Klick nicht noch einmal', () => {
    touch('sci-btn', 'pointerdown'); touch('sci-btn', 'pointerup');
    expect(game("document.querySelector('#modal-card h2').textContent")).toContain('Forschung');
    game('closeModal()');
    game("document.getElementById('sci-btn').click()");                          // Safaris Klick hinterher: ignoriert
    expect(game("document.getElementById('modal').hidden")).toBe(true);
  });

  it('auch der Knopf „Du“ (sein Handler kommt erst aus me.js) reagiert auf den ersten Finger-Tipp', () => {
    touch('you-btn', 'pointerdown'); touch('you-btn', 'pointerup');
    expect(game("document.getElementById('modal').hidden")).toBe(false);
    expect(game("!!document.querySelector('#modal-card [data-you]')")).toBe(true);
  });
  it('mit der Maus/Tastatur weiter per Klick; auch der Stadtname', () => {
    game("document.getElementById('town-btn').click()");
    expect(game("document.querySelector('#modal-card h2').textContent")).toContain('Rathaus');
  });

  it('die Leiste schreibt nur, was sich geändert hat (sonst schluckt Safari Tipps)', () => {
    game('updateHud()');
    game("window.__n = 0; new MutationObserver(m => { __n += m.length; }).observe(document.getElementById('hud'), { subtree: true, childList: true, characterData: true, attributes: true })");
    game('updateHud(); updateHud()');
    return new Promise(r => setTimeout(r, 0)).then(() => expect(game('__n')).toBe(0));
  });
});
