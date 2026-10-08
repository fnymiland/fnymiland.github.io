const { loadGame, game } = require('./helpers/load-game');

// Block 120: 🕘 Zuletzt gebaut – die letzten 8 gebauten Dinge
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; recentOpen = false; buildToolbar()");
  game("for (let y = 4; y <= 14; y++) for (let x = 4; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});

describe('Zuletzt gebaut (Block 120)', () => {
  it('merkt sich Gebautes, neuestes zuerst, ohne Doppel, höchstens 8; Schnellknopf-Dinge (Weg) zählen nicht', () => {
    for (const id of ['haus', 'baum', 'bank', 'haus', 'weg']) game(`noteRecent('${id}')`);
    expect(game('recentList()')).toEqual(['haus', 'bank', 'baum']);
    for (const id of ['laterne', 'brunnen', 'busch', 'blumen', 'kiosk', 'cafe', 'post', 'hecke']) game(`noteRecent('${id}')`);
    expect(game('recentList().length')).toBe(8);
    expect(game('recentList()[0]')).toBe('hecke');
    game("localStorage.setItem('kachelhausen_recent', '{kaputt')");
    expect(game('recentList()')).toEqual([]);                                                 // kaputter Speicher: einfach leer
  });
  it('nur wirklich Gebautes zählt (Antippen, Linie/Fläche)', () => {
    game("setTool('haus'); hover = { x: 8, y: 8 }; tap(...(() => { const p = toScreen(8, 8); return [p.x, p.y]; })(), false)");
    expect(game('recentList()[0]')).toBe('haus');
    game("state.tiles.set('9,9', { b: 'haus', lvl: 1 }); recalc(); setTool('kiosk'); tap(...(() => { const p = toScreen(9, 9); return [p.x, p.y]; })(), false)");
    expect(game('recentList()')).not.toContain('kiosk');                                      // besetzt: nicht gebaut
  });
  it('🕘 zeigt die Liste in der Leiste; ein Bereich schließt sie', () => {
    game("noteRecent('baum'); noteRecent('haus'); buildToolbar()");
    expect(game("!!document.querySelector('#cats .quick.recent')")).toBe(true);
    game("document.querySelector('#cats .quick.recent').click()");
    expect(game('recentOpen')).toBe(true);
    expect(game("[...document.querySelectorAll('#tools .tool')].map(b => b.dataset.tool)")).toEqual(['haus', 'baum']);
    expect(game("document.querySelector('#subcats .recent-label').textContent")).toMatch(/Zuletzt gebaut/);
    game("document.querySelector('#cats .cat').click()");
    expect(game('recentOpen')).toBe(false);
  });
});
