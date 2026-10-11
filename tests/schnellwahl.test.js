const { loadGame, game } = require('./helpers/load-game');

// Schnellwahl (Nutzer 11.10.2026: „bei der Wege-Schnellauswahl auch Schienen und Tunnel“ – gewählt: Ziehen-Knopf; „🕘 mit ⭐ zusammenlegen“):
// 🛤️ nimmt, was man zuletzt gezogen hat, ▾ klappt Weg · Schiene · Tunnel · Zaun · Hecke · Mauer auf; ⭐ zeigt Favoriten und zuletzt Gebautes,
// Favorit über ☆ an der Kachel dort oder lange Drücken im Menü
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); setSheet(false); setTool('look'); buildToolbar()");
});
const q = s => game(`[...document.querySelectorAll('${s}')].map(b => b.dataset.tool || b.dataset.quick || b.dataset.group)`);

describe('Ziehen-Knopf', () => {
  it('zeigt zuerst den Weg; ▾ klappt die sechs Ziehen-Dinge auf; gewählt wird der Knopf zu dem Ding und bleibt es (auch nach Neuaufbau)', () => {
    expect(game("document.querySelector('#cats .quick.drag').dataset.quick")).toBe('weg');
    game("document.querySelector('#cats .quick.drag-more').click()");
    expect([game('sheetOpen'), game('dragOpen')]).toEqual([true, true]);
    expect(q('#tools .tool')).toEqual(['weg', 'schiene', 'tunnel', 'zaun', 'hecke', 'mauer']);
    game("document.querySelector('#tools [data-tool=\"schiene\"]').click()");
    expect([game('tool'), game('sheetOpen'), game('dragOpen')]).toEqual(['schiene', false, false]);
    expect(game("(b => [b.dataset.quick, b.textContent, b.classList.contains('active')])(document.querySelector('#cats .quick.drag'))")).toEqual(['schiene', '🚆', true]);
    game("setTool('look'); buildToolbar()");
    expect(game("document.querySelector('#cats .quick.drag').dataset.quick")).toBe('schiene');   // gemerkt
    game("document.querySelector('#cats .quick.drag').click()");
    expect(game('tool')).toBe('schiene');
    game("document.querySelector('#cats .quick.drag').click()");                // nochmal: weglegen
    expect(game('tool')).toBe('look');
    game("setTool('tunnel')");                                                     // auch aus dem Menü gewählt
    expect(game("document.querySelector('#cats .quick.drag').dataset.quick")).toBe('tunnel');
    game("setTool('look')");
  });
  it('nicht erforscht: der Knopf fällt auf den Weg zurück; ▾ und ein Bereich schließen sich gegenseitig', () => {
    game("localStorage.setItem('kachelhausen_drag', 'tunnel'); state.techs.delete('ubahn'); buildToolbar()");
    expect(game("document.querySelector('#cats .quick.drag').dataset.quick")).toBe('weg');
    game("document.querySelector('#cats .quick.drag-more').click(); document.querySelector('#cats .cat').click()");
    expect([game('dragOpen'), game('sheetOpen')]).toEqual([false, true]);
    game("document.querySelector('#cats .quick.recent').click()");
    expect([game('dragOpen'), game('recentOpen')]).toEqual([false, true]);
    game('setSheet(false)');
  });
});

describe('⭐ Favoriten und zuletzt gebaut', () => {
  it('☆ macht ein zuletzt gebautes Ding zum Favoriten (steht dann oben), ★ wieder nicht; Zahlentasten folgen', () => {
    game("noteRecent('bank'); noteRecent('haus'); buildToolbar(); document.querySelector('#cats .quick.recent').click()");
    expect(game("document.querySelector('#cats .quick.recent').textContent")).toBe('⭐');
    expect(q('#tools .tool')).toEqual(['haus', 'bank']);
    game("document.querySelector('#tools [data-tool=\"bank\"] .fav').click()");
    expect(game('favList()')).toEqual(['bank']);
    expect(q('#tools .tool')).toEqual(['bank', 'haus']);                          // Favorit oben, nicht doppelt
    expect(game("document.querySelector('#tools [data-tool=\"bank\"] .fav').textContent")).toBe('★');
    expect(game('menuList()')).toEqual(['bank', 'haus']);
    expect(game('sheetOpen')).toBe(true);                                         // ☆ wählt nichts
    game("document.querySelector('#tools [data-tool=\"bank\"] .fav').click()");
    expect(game('favList()')).toEqual([]);
    game('setSheet(false)');
  });
  it('lange drücken im Menü: Favorit, ohne das Ding zu wählen; Speicher kaputt: leer', async () => {
    game("menuTop = 'stadt'; setSheet(true); buildToolbar()");
    game("(() => { const b = document.querySelector('#tools [data-tool=\"haus\"]'); b.onpointerdown(); })()");   // jsdom kennt onpointerdown nicht als Ereignis – direkt aufrufen
    await new Promise(r => setTimeout(r, 650));
    game("(() => { const b = document.querySelector('#tools [data-tool=\"haus\"]'); b.onpointerup(); b.click(); })()");
    expect(game('favList()')).toEqual(['haus']);
    expect(game('tool')).toBe('look');                                            // langes Drücken wählt nicht
    game("localStorage.setItem('kachelhausen_fav', '{kaputt')");
    expect(game('favList()')).toEqual([]);
    game('setSheet(false)');
  });
});
