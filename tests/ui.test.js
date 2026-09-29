const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal()'); });

describe('Leiste unten', () => {
  it('der Preis bleibt ruhig: genug Geld = nie rot, auch nach vielen Aktualisierungen', () => {
    game("state.money = 99999; setTool('look')");
    const red = () => game("[...document.querySelectorAll('.tool.poor')].map(b => b.dataset.tool).filter(t => t === 'haus').length");
    for (let i = 0; i < 5; i++) { game('updateHud()'); expect(red()).toBe(0); }
  });
  it('zu wenig Geld = rot, und das bleibt so', () => {
    game('state.money = 10');
    for (let i = 0; i < 5; i++) { game('updateHud()'); expect(game("document.querySelector('.tool[data-tool=haus]').classList.contains('poor')")).toBe(true); }
  });
});

describe('Kein Einsammeln im Hintergrund', () => {
  it('wer zurückkommt, bekommt nichts nachgezahlt', () => {
    game('state.money = 100; T.inc = 50; state.last = Date.now() - 3600e3');
    game("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange'))");
    expect(game('state.money')).toBe(100);
    expect(game("typeof creditAway")).toBe('undefined');
  });
});

describe('Rathaus', () => {
  beforeEach(() => {
    game("state.owned.add('1,1'); state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99");
    game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  });
  it('„Bereit“ listet Häuser, deren Wünsche erfüllt sind – „Hin“ springt hin und öffnet das Haus', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1, name: 'Otto', animal: 'baer' }); state.tiles.set('9,8', { b: 'weg', lvl: 1 }); state.decos.set('8,9', [{ b: 'bank' }, null, null, null]); recalc()");
    const { ready } = game('readyList()');
    expect(ready.some(e => e.x === 8 && e.y === 8)).toBe(true);
    game("openTownHall('ready')");
    const i = game("readyList().ready.findIndex(e => e.x === 8 && e.y === 8)");
    game(`document.querySelector('[data-jump="${i}"]').click()`);
    expect(game("$('modal').hidden")).toBe(true);
    expect(game("$('panel').textContent")).toContain('Otto');
    const c = game('iso(8, 8)');
    expect(game('cam.x')).toBeCloseTo(c.x);
  });
  it('„Wünsche“ zählt, was den Häusern noch fehlt', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); state.tiles.set('10,10', { b: 'haus', lvl: 1 }); recalc()");
    game("openTownHall('wishes')");
    expect(game("$('modal-card').textContent")).toContain('Weg vor der Tür2 Häuser');
  });
});
