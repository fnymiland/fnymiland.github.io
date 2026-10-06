const { loadGame, game } = require('./helpers/load-game');

// Block 98: Drei feste Orte – 🏛️ Rathaus = Stadt, Knopf „Du“ = du selbst, ☰ = Hilfe & Einstellungen. Jedes Fenster genau einmal.
beforeAll(() => loadGame());
beforeEach(() => { game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; cloudUser = null"); });
const txt = () => game("document.getElementById('modal-card').textContent");
const ids = sel => game(`[...document.querySelectorAll('#modal-card ${sel}')].map(b => b.dataset[${JSON.stringify(sel.match(/data-([a-z]+)/)[1])}])`);

describe('Aufgeräumt (Block 98)', () => {
  it('Rathaus: nur Stadt-Reiter; alte Ziele leiten weiter', async () => {
    game("openTownHall('overview')");
    expect(ids('[data-tab]')).toEqual(['overview', 'todo', 'bewohner', 'isles', 'town']);
    game("openTownHall('ready')");
    expect(game('hallTab')).toBe('todo');
    expect(txt()).toMatch(/wünschen sich die Bewohner|Alle Wünsche erfüllt/);          // Bereit + Wünsche in „Zu tun“
    game("openTownHall('erfolge')");
    expect(game('youTab')).toBe('erfolge');
    expect(txt()).toMatch(/Ehrennadel/);
    game("openTownHall('figur')");
    expect(game('youTab')).toBe('figur');
    await game("openTownHall('besuch')");
    expect(game('youTab')).toBe('freunde');
    game("hallTab = 'wishes'; openTownHall()");                                            // gemerkter alter Reiter
    expect(game('hallTab')).toBe('todo');
  });
  it('Knopf „Du“: Figur, Erfolge, Album, Tagebuch – Knopf „🌐 Online“: Freunde, Speicher (Block 106)', async () => {
    document.getElementById('you-btn').click();
    for (const t of ['figur', 'erfolge', 'album', 'tagebuch']) {
      game(`document.querySelector('[data-you="${t}"]').click()`); await new Promise(r => setTimeout(r, 5));
      expect(ids('[data-you]')).toEqual(['figur', 'erfolge', 'album', 'tagebuch']);
      expect(game(`document.querySelector('[data-you="${t}"]').classList.contains('on')`)).toBe(true);
    }
    game('updateHud()');
    expect(game("document.getElementById('you-face').textContent")).toBe(game('ANIMALS[meLook().a].icon'));
    document.getElementById('net-btn').click(); await new Promise(r => setTimeout(r, 5));
    expect(ids('[data-net]')).toEqual(['freunde', 'online']);
    game(`document.querySelector('[data-net="online"]').click()`); await new Promise(r => setTimeout(r, 5));
    expect(txt()).toMatch(/Melde dich an/);                                               // Speicher ohne Anmeldung
    await game("openYou('freunde')");                                                     // alter Weg leitet weiter
    expect(ids('[data-net]')).toEqual(['freunde', 'online']);
  });
  it('☰ nur noch Hilfe, Neues, Einstellungen und Spielstand', () => {
    game('showMenu()');
    for (const id of ['m-help', 'm-news', 'm-sound', 'm-fps', 'm-export', 'm-import', 'm-reset']) expect(game(`!!document.getElementById('${id}')`), id).toBe(true);
    for (const id of ['m-tips', 'm-lex', 'm-diary', 'm-achv', 'm-album', 'm-friends', 'm-cloud']) expect(game(`!!document.getElementById('${id}')`), id).toBe(false);
  });
  it('Hilfe-Buch: Anleitung, Tipps, Nachschlagen; Suche oben springt nach „Nachschlagen“', () => {
    game("openHelp('tipps')");
    expect(ids('[data-hb]')).toEqual(['start', 'bauen', 'wachsen', 'steuerung', 'tipps', 'lex']);
    game("window.__q = document.getElementById('lx-q'); (q => { q.value = 'Holz'; q.oninput(); })(window.__q)");
    expect(game('helpTab')).toBe('lex');
    expect(game("document.getElementById('lx-q') === window.__q")).toBe(true);              // dasselbe Feld – iPad-Tastatur bleibt offen
    expect(game("[...document.querySelectorAll('.lx-e')].some(e => !e.hidden && e.dataset.lxe === 'res:holz')")).toBe(true);
    game("document.querySelector('[data-hb=\"start\"]').click()");
    expect(game("document.querySelectorAll('#modal-card ul.help li').length")).toBeGreaterThan(4);
  });
  it('Punkt am Knopf „Du“: neue Tagebuchseite; nach dem Lesen weg', () => {
    game("state.diary = ['start', 'baum:1']; state.diarySeen = 1; updateHud()");
    expect(game("document.getElementById('diary-dot').hidden")).toBe(false);
    game("openYou('tagebuch')");                                                            // zeigt die neue Seite
    expect(game('state.diarySeen')).toBe(2);
    expect(game("!!document.querySelector('[data-you=\"tagebuch\"] .tdot')")).toBe(false);
    game('closeModal(); updateHud()');
    expect(game("document.getElementById('diary-dot').hidden")).toBe(true);
  });
});

describe('Fenster mit Reitern (Block 103)', () => {
  it('bekommen eine feste Größe (Klasse tabbed) und gleiche Breite je Fenster; beim Reiterwechsel nach oben, sonst Scrollstand behalten', async () => {
    game("openTownHall('overview')");
    expect(game("document.getElementById('modal-card').classList.contains('tabbed')")).toBe(true);
    await game("openYou('album')");
    expect(game("[...document.getElementById('modal-card').classList]")).toEqual(expect.arrayContaining(['tabbed', 'you-win']));
    await game("openYou('figur')");
    game("document.getElementById('modal-card').scrollTop = 200; window.__k = modalTabKey");
    game("openYou('figur')");                                                               // gleiche Seite neu
    expect(game('modalTabKey === window.__k')).toBe(true);
    game("openHelp('start')");
    expect(game("document.getElementById('modal-card').classList.contains('help-win')")).toBe(true);
    game("showMenu()");
    expect(game("document.getElementById('modal-card').classList.contains('tabbed')")).toBe(false);   // ohne Reiter wie bisher
  });
});
