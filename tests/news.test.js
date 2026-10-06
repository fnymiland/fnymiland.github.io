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

  it('Versionsübersicht (Block 99): wer mehrere Updates verpasst hat, sieht alle – das neueste offen, ältere zum Aufklappen', () => {
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[3].id); showNews()`);
    expect(game('newsUnseen(NEWS_HISTORY[3].id)')).toBe(3);
    const det = [...document.querySelectorAll('#modal-card details.news-v')];
    expect(det.length).toBe(3);
    expect(det.map(d => d.open)).toEqual([true, false, false]);
    expect(document.getElementById('modal-card').textContent).toMatch(/3 Updates/);
    expect(game('localStorage.getItem(NEWS_KEY)')).toBe(game('NEWS.id'));
  });
  it('nur das letzte verpasst: ein Eintrag, kein Zähler; ganz alter/unbekannter Stand: alle', () => {
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[1].id); showNews()`);
    expect(document.querySelectorAll('#modal-card details.news-v').length).toBe(1);
    expect(document.getElementById('modal-card').textContent).not.toMatch(/Updates\./);
    expect(game("newsUnseen('2025-uralt')")).toBe(game('NEWS_HISTORY.length'));
    expect(game("newsUnseen('2026-10-01')")).toBe(game("NEWS_HISTORY.findIndex(n => n.id === '2026-09-30-laeden')"));   // alte id gehört zu einem Stand
  });
  it('aus dem Menü: die ganze Geschichte, Verpasstes als „neu für dich“ markiert', () => {
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[2].id); showMenu()`);
    document.getElementById('m-news').click();
    expect(document.querySelectorAll('#modal-card details.news-v').length).toBe(game('NEWS_HISTORY.length'));
    expect(document.getElementById('modal-card').textContent.match(/neu für dich/g).length).toBe(2);
  });
  it('jeder Eintrag hat id, Datum, Titel und Punkte; ids einmalig', () => {
    const h = game('NEWS_HISTORY.map(n => ({ id: n.id, ok: !!(n.date && n.title && n.items.length) }))');
    expect(h.every(n => n.ok)).toBe(true);
    expect(new Set(h.map(n => n.id)).size).toBe(h.length);
  });
});
