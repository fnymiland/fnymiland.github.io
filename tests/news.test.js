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

  it('Versionsübersicht (Block 99): wer mehrere Tage verpasst hat, sieht je Tag eine Karte – der neueste offen, ältere zum Aufklappen', () => {
    const k = game("NEWS_HISTORY.findIndex((n, i) => i > 0 && newsDays(NEWS_HISTORY.slice(0, i)).length === 3)");   // genau 3 Tage verpasst
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[${k}].id); showNews()`);
    const det = [...document.querySelectorAll('#modal-card details.news-v')];
    expect(det.length).toBe(3);
    expect(det.map(d => d.open)).toEqual([true, false, false]);
    expect(document.getElementById('modal-card').textContent).toMatch(/3 Tagen/);
    expect(game('localStorage.getItem(NEWS_KEY)')).toBe(game('NEWS.id'));
  });
  it('Einträge desselben Tages in einer Karte, mit allen Punkten (Nutzer: nicht 20× am 08.10.)', () => {
    game('showNews(true)');
    const dates = [...document.querySelectorAll('#modal-card details.news-v > summary > b')].map(b => b.textContent);
    expect(new Set(dates).size).toBe(dates.length);                                  // jedes Datum nur einmal
    const n8 = game("NEWS_HISTORY.filter(n => n.date === '8. Oktober').reduce((a, n) => a + n.items.length, 0)");
    const card = [...document.querySelectorAll('#modal-card details.news-v')].find(d => d.querySelector('summary b').textContent === '8. Oktober');
    expect(card.querySelectorAll('li').length).toBe(n8);
  });
  it('nur das letzte verpasst: eine Karte, kein Zähler; ganz alter/unbekannter Stand: alle', () => {
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[1].id); showNews()`);
    expect(document.querySelectorAll('#modal-card details.news-v').length).toBe(1);
    expect(document.getElementById('modal-card').textContent).not.toMatch(/Tagen/);
    expect(game("newsUnseen('2025-uralt')")).toBe(game('NEWS_HISTORY.length'));
    expect(game("newsUnseen('2026-10-01')")).toBe(game("NEWS_HISTORY.findIndex(n => n.id === '2026-09-30-laeden')"));   // alte id gehört zu einem Stand
  });
  it('aus dem Menü: die ganze Geschichte, Verpasstes als „neu für dich“ markiert', () => {
    game(`localStorage.setItem(NEWS_KEY, NEWS_HISTORY[2].id); showMenu()`);
    document.getElementById('m-news').click();
    expect(document.querySelectorAll('#modal-card details.news-v').length).toBe(game('newsDays(NEWS_HISTORY).length'));   // je Tag eine Karte
    expect(document.getElementById('modal-card').textContent.match(/neu für dich/g).length).toBe(game('newsDays(NEWS_HISTORY.slice(0, 2)).length'));
  });
  it('jeder Eintrag hat id, Datum, Titel und Punkte; ids einmalig', () => {
    const h = game('NEWS_HISTORY.map(n => ({ id: n.id, ok: !!(n.date && n.title && n.items.length) }))');
    expect(h.every(n => n.ok)).toBe(true);
    expect(new Set(h.map(n => n.id)).size).toBe(h.length);
  });
});
