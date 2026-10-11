const { loadGame, game } = require('./helpers/load-game');

// Schnellwahl (Nutzer 11.10.2026: „bei der Wege-Schnellauswahl auch Schienen und Tunnel“ – gewählt: Ziehen-Knopf; „🕘 mit ⭐ zusammenlegen“):
// 🛤️ nimmt, was man zuletzt gezogen hat, ▾ klappt Weg · Schiene · Tunnel · Zaun · Hecke · Mauer auf; ⭐ zeigt Favoriten und zuletzt Gebautes,
// Favorit über ☆ oben rechts an jeder Kachel
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); setSheet(false); setTool('look'); buildToolbar()");
});
const q = s => game(`[...document.querySelectorAll('${s}')].map(b => b.dataset.tool || b.dataset.quick || b.dataset.group)`);

describe('Ziehen-Knopf', () => {
  // Nutzer: „wie die Apple-Leiste: was man wählt, wird groß, der Rest kleine Kugeln daneben“
  const balls = () => game("[...document.querySelectorAll('#cats .drag-ball')].map(b => b.dataset.ball)");
  const big = () => game("(b => [b.dataset.quick, b.textContent, b.classList.contains('active')])(document.querySelector('#cats .quick.drag'))");
  it('ohne Ziehen-Ding in der Hand nur der große Knopf; mit Weg in der Hand die übrigen fünf als Kugeln daneben', () => {
    expect(big()).toEqual(['weg', '🛤️', false]);
    expect(balls()).toEqual([]);
    game("document.querySelector('#cats .quick.drag').click()");
    expect(game('tool')).toBe('weg');
    expect(balls()).toEqual(['schiene', 'tunnel', 'zaun', 'hecke', 'mauer']);
    expect(game("document.querySelector('#cats .quick.drag').nextElementSibling.dataset.ball")).toBe('schiene');   // gleich rechts daneben
  });
  it('Kugel antippen: wird an ihrem Platz groß, die Reihe bleibt (Nutzer: „alles an derselben Stelle“); das Große nochmal: zu, vorn das zuletzt Genutzte; wieder auf: es steht vorn, die übrigen rücken nach', () => {
    const row = () => game("[...document.querySelectorAll('#cats .quick.drag, #cats .drag-ball')].map(b => b.dataset.ball || b.dataset.quick)");
    game("document.querySelector('#cats .quick.drag').click()");
    expect(row()).toEqual(['weg', 'schiene', 'tunnel', 'zaun', 'hecke', 'mauer']);
    game("document.querySelector('#cats .drag-ball[data-ball=\"schiene\"]').click()");
    expect(game('tool')).toBe('schiene');
    expect(big()).toEqual(['schiene', '🚆', true]);
    expect(row()).toEqual(['weg', 'schiene', 'tunnel', 'zaun', 'hecke', 'mauer']);  // Reihe unverändert, Schiene groß an ihrem Platz
    expect(balls()).toEqual(['weg', 'tunnel', 'zaun', 'hecke', 'mauer']);
    game("document.querySelector('#cats .drag-ball[data-ball=\"hecke\"]').click()");
    expect(row()).toEqual(['weg', 'schiene', 'tunnel', 'zaun', 'hecke', 'mauer']);
    game("document.querySelector('#cats .drag-ball[data-ball=\"schiene\"]').click()");
    game("document.querySelector('#cats .quick.drag').click()");                  // das Große nochmal: zu
    expect([game('tool'), big()[0], balls().length]).toEqual(['look', 'schiene', 0]);
    expect(game("document.querySelector('#cats .quick.drag').previousElementSibling.dataset.quick")).toBe('look');   // vorn, gleich hinter 👆
    game("document.querySelector('#cats .quick.drag').click()");                  // wieder auf: Schiene vorn, die übrigen rücken nach
    expect(row()).toEqual(['schiene', 'weg', 'tunnel', 'zaun', 'hecke', 'mauer']);
    game("setTool('look'); buildToolbar()");
    expect([big()[0], balls().length]).toEqual(['schiene', 0]);                   // gemerkt
    game("setTool('tunnel')");                                                      // auch aus dem Menü gewählt
    expect(big()).toEqual(['tunnel', '🚇', true]);
    expect(row()).toEqual(['tunnel', 'schiene', 'weg', 'zaun', 'hecke', 'mauer']);
    game("setTool('look')");
  });
  it('nicht erforscht: großer Knopf fällt auf den Weg zurück, die Kugel ist blass und sagt, was fehlt', () => {
    game("localStorage.setItem('kachelhausen_drag', 'tunnel'); state.techs.delete('ubahn'); buildToolbar()");
    expect(big()[0]).toBe('weg');
    game("setTool('weg')");
    expect(game("document.querySelector('#cats .drag-ball[data-ball=\"tunnel\"]').classList.contains('locked')")).toBe(true);
    game("document.querySelector('#cats .drag-ball[data-ball=\"tunnel\"]').click()");
    expect(game('tool')).toBe('weg');
    game("setTool('look')");
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
  it('Stern oben rechts an jeder Kachel im Menü (Nutzer: „dezent, aber treffbar“): ☆ macht Favorit ohne das Ding zu wählen; Speicher kaputt: leer', () => {
    game("menuTop = 'stadt'; setSheet(true); buildToolbar()");
    expect(game("[...document.querySelectorAll('#tools .tool')].every(b => b.querySelector('.fav'))")).toBe(true);
    game("document.querySelector('#tools [data-tool=\"haus\"] .fav').click()");
    expect(game('favList()')).toEqual(['haus']);
    expect([game('tool'), game('sheetOpen')]).toEqual(['look', true]);           // Stern wählt nichts, Leiste bleibt offen
    expect(game("(s => [s.textContent, s.classList.contains('on')])(document.querySelector('#tools [data-tool=\"haus\"] .fav'))")).toEqual(['★', true]);
    game("localStorage.setItem('kachelhausen_fav', '{kaputt')");
    expect(game('favList()')).toEqual([]);
    game('setSheet(false)');
  });
});

describe('Stern im Info-Fenster', () => {
  it('neben dem Namen (Nutzer: „oben rechts in dem Fenster, das aufploppt“): ☆ → ★ Favorit, Kachel im offenen Menü zeigt es auch', () => {
    game("menuTop = 'stadt'; setSheet(true); buildToolbar(); openBuildInfo('haus')");
    expect(game("document.getElementById('p-fav').textContent")).toBe('☆');
    game("document.getElementById('p-fav').click()");
    expect(game('favList()')).toEqual(['haus']);
    expect(game("[document.getElementById('p-fav').textContent, document.querySelector('#tools [data-tool=\"haus\"] .fav').textContent]")).toEqual(['★', '★']);
    game("document.getElementById('p-fav').click()");
    expect(game('favList()')).toEqual([]);
    game('closePanel(); setSheet(false)');
  });
});
