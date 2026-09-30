const { loadGame, game } = require('./helpers/load-game');

// Block 51: Anleitung mit vier Reitern, Steuerung mit allen Tasten
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal()'); });

describe('Anleitung', () => {
  it('☰ → Anleitung öffnet vier Reiter; Steuerung nennt die Tasten', () => {
    game('showMenu()'); game("document.getElementById('m-help').click()");
    expect(game("[...document.querySelectorAll('[data-htab]')].map(b => b.dataset.htab)")).toEqual(['start', 'bauen', 'wachsen', 'steuerung']);
    game("document.querySelector('[data-htab=\"steuerung\"]').click()");
    const text = game("document.getElementById('modal-card').textContent");
    for (const k of ['Strg/⌘ + Z', 'Esc', 'Mausrad', 'Zwei Finger']) expect(text).toContain(k);
  });

  it('jeder Reiter hat Inhalt', () => {
    for (const t of ['start', 'bauen', 'wachsen']) {
      game(`openHelp('${t}')`);
      expect(game("document.querySelectorAll('#modal-card ul.help li').length")).toBeGreaterThan(4);
    }
  });
});
