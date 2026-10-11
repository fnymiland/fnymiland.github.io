const { loadGame, game } = require('./helpers/load-game');

// Schnellwahl (Nutzer 11.10.2026: „bei der Wege-Schnellauswahl auch Schienen und Tunnel“ – gewählt: Ziehen-Knopf; „🕘 mit ⭐ zusammenlegen“):
// 🛤️ nimmt, was man zuletzt gezogen hat, ▾ klappt Weg · Schiene · Tunnel · Zaun · Hecke · Mauer auf; ⭐ zeigt Favoriten und zuletzt Gebautes,
// Favorit über ☆ oben rechts an jeder Kachel
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); setSheet(false); setTool('look'); buildToolbar()");
});
const q = s => game(`[...document.querySelectorAll('${s}')].map(b => b.dataset.tool || b.dataset.quick || b.dataset.group)`);

describe('Ziehen-Knopf: Kategorien', () => {
  // Nutzer: „wie die Apple-Leiste: was man wählt, wird groß, der Rest kleine Kugeln daneben“ – dann „Eisenbahn, Zäune, Wege, Terraforming als
  // Kategorien, Spielbilder statt Emojis“ (ein Knopf, Kugeln = Kategorien, die Dinge vorn in der Stil-Zeile)
  const balls = () => game("[...document.querySelectorAll('#cats .drag-ball')].map(b => b.dataset.ball)");
  const big = () => game("(b => [b.dataset.quick, b.dataset.kat, b.classList.contains('active'), !!b.querySelector('canvas.kat-pic'), b.textContent])(document.querySelector('#cats .quick.drag'))");
  const row = () => game("[...document.querySelectorAll('#cats .quick.drag, #cats .drag-ball')].map(b => b.dataset.ball || b.dataset.kat)");
  const items = () => game("[...document.querySelectorAll('#style-bar .kat-item')].map(b => b.dataset.katItem + (b.classList.contains('on') ? '*' : '') + (b.classList.contains('locked') ? '🔒' : ''))");
  const click = s => game(`document.querySelector('${s}').click()`);
  it('zu: nur der große Knopf mit Spielbild statt Emoji; mit Weg in der Hand die übrigen drei Kategorien als Kugeln daneben, Wege allein: keine Dinge in der Stil-Zeile', () => {
    expect(big()).toEqual(['weg', 'wege', false, true, '']);
    expect(balls()).toEqual([]);
    click('#cats .quick.drag');
    expect(game('tool')).toBe('weg');
    expect(row()).toEqual(['wege', 'bahn', 'linien', 'gelaende']);
    expect(game("document.querySelector('#cats .quick.drag').nextElementSibling.dataset.ball")).toBe('bahn');   // gleich rechts daneben
    expect(game("[...document.querySelectorAll('#cats .drag-ball')].every(b => b.querySelector('canvas.kat-pic'))")).toBe(true);
    expect(items()).toEqual([]);
  });
  it('Kategorie antippen: wird an ihrem Platz groß, die Reihe bleibt; ihre Dinge vorn in der Stil-Zeile; je Kategorie das Letzte gemerkt; das Große nochmal: zu, wieder auf: vorn, die übrigen rücken nach', () => {
    click('#cats .quick.drag');
    click('#cats .drag-ball[data-ball="bahn"]');
    expect(game('tool')).toBe('schiene');
    expect(big().slice(0, 3)).toEqual(['schiene', 'bahn', true]);
    expect(row()).toEqual(['wege', 'bahn', 'linien', 'gelaende']);                // Reihe unverändert, Eisenbahn groß an ihrem Platz
    expect(items()).toEqual(['schiene*', 'tunnel', 'station', 'ubahn', 'tunneleinfahrt', 'huegelrampe', 'bergportal']);
    expect(game("document.querySelector('#style-bar .kat-sep') !== null")).toBe(true);   // Trennstrich vor dem Belag der Schiene
    click('#style-bar [data-kat-item="tunnel"]');
    expect([game('tool'), big()[0], big()[1]]).toEqual(['tunnel', 'tunnel', 'bahn']);
    expect(items()[1]).toBe('tunnel*');
    click('#cats .drag-ball[data-ball="linien"]');
    expect([game('tool'), items()]).toEqual(['zaun', ['zaun*', 'hecke', 'mauer']]);
    click('#cats .drag-ball[data-ball="gelaende"]');
    expect(items().map(x => x.replace('🔒', ''))).toEqual(['graben*', 'schuett', 'wiese', 'strand', 'parkrasen', 'anhoehe']);   // Parkrasen braucht Bäume (hier gesperrt)
    click('#cats .drag-ball[data-ball="bahn"]');
    expect(game('tool')).toBe('tunnel');                                            // gemerkt: in der Eisenbahn zuletzt der Tunnel
    expect(row()).toEqual(['wege', 'bahn', 'linien', 'gelaende']);
    click('#cats .quick.drag');                                                     // das Große nochmal: zu
    expect([game('tool'), big()[1], balls().length]).toEqual(['look', 'bahn', 0]);
    expect(game("document.querySelector('#cats .quick.drag').previousElementSibling.dataset.quick")).toBe('look');
    click('#cats .quick.drag');                                                     // wieder auf: Eisenbahn vorn mit dem Tunnel
    expect([game('tool'), row()]).toEqual(['tunnel', ['bahn', 'wege', 'linien', 'gelaende']]);
    game("setTool('look'); buildToolbar()");
    expect([big()[1], balls().length]).toEqual(['bahn', 0]);                        // gemerkt, zu
    game("setTool('strand')");                                                      // auch aus dem Menü gewählt
    expect([big()[1], items()[3]]).toEqual(['gelaende', 'strand*']);
    expect(game("$('style-bar').classList.contains('kat-anchored')")).toBe(true);   // Nutzer: „die Icons springen je nach Auswahl“ – Zeile links fest
    game("setTool('look')");
    expect(game("document.querySelectorAll('#style-bar .kat-item').length")).toBe(0);
    game("setTool('baum')");                                                        // andere Dinge: Stil-Zeile wie immer mittig
    expect(game("[$('style-bar').classList.contains('kat-anchored'), $('style-bar').style.left]")).toEqual([false, '']);
    game("setTool('look')");
  });
  it('nicht erforscht: großer Knopf fällt auf den Weg zurück, Gesperrtes blass mit Hinweis; ganze Kategorie gesperrt: Kugel blass, nimmt nichts', () => {
    game("localStorage.setItem('kachelhausen_drag', 'tunnel'); state.techs.delete('ubahn'); buildToolbar()");
    expect(big()[0]).toBe('weg');
    game("setTool('schiene')");
    expect(items().slice(0, 2)).toEqual(['schiene*', 'tunnel🔒']);
    click('#style-bar [data-kat-item="tunnel"]');
    expect(game('tool')).toBe('schiene');
    game("state.techs.delete('bahn'); setTool('weg')");
    expect(game("document.querySelector('#cats .drag-ball[data-ball=\"bahn\"]').classList.contains('locked')")).toBe(true);
    click('#cats .drag-ball[data-ball="bahn"]');
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
