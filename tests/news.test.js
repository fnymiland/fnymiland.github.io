const { loadGame, game } = require('./helpers/load-game');

// „Das ist neu“ (Block 25a): nach einem Update einmal pro Gerät, nie für neue Spieler
beforeAll(() => loadGame());
beforeEach(() => { game('closeModal(); localStorage.removeItem(NEWS_KEY)'); });
const shown = () => !document.getElementById('modal').hidden && document.getElementById('modal-card').textContent.includes('Das ist neu');

describe('Das ist neu', () => {
  it('neue Spieler (ohne Spielstand) sehen es nicht – und auch später nicht für dieses Update', () => {
    game('newsAfterLoad(false)');
    expect(shown()).toBe(false);
    expect(game('localStorage.getItem(NEWS_KEY)')).toBe(game('NEWS.id'));
  });

  it('mit Spielstand erscheint es einmal, sobald kein anderes Fenster offen ist', () => {
    vi.useFakeTimers();
    try {
      game('openModal("<p>anderes Fenster</p>")');
      game('newsAfterLoad(true)');
      vi.advanceTimersByTime(5000);
      expect(shown()).toBe(false);                    // wartet, bis das andere Fenster zu ist
      game('closeModal()');
      vi.advanceTimersByTime(2000);
      expect(shown()).toBe(true);
      expect(document.querySelectorAll('#modal-card .news li').length).toBeGreaterThanOrEqual(3);
      document.getElementById('m-ok').click();
      expect(shown()).toBe(false);
      game('newsAfterLoad(true)');                     // zweites Laden: nicht noch einmal
      vi.advanceTimersByTime(5000);
      expect(shown()).toBe(false);
    } finally { vi.useRealTimers(); }
  });

  it('im Menü lässt es sich wieder aufrufen', () => {
    game('showMenu()');
    document.getElementById('m-news').click();
    expect(shown()).toBe(true);
  });
});
