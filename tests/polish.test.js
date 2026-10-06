const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game("state.owned.add('1,1'); state.money = 99999");
  game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  game('buildRot = 0; recalc()');
});

describe('Namen: Ort und Stufe zusammen', () => {
  it('Sperrhinweise nennen die Sehenswürdigkeit', () => {
    expect(game("unlockText(ITEMS.steinmetz)")).toBe('🌬️ Windige Klippe → Aussichtspunkt');
    expect(game("unlockText(ITEMS.steinmetz, true)")).toBe('🌬️ Windige Klippe');
  });
  it('die Aufgabenliste auch', () => {
    game('state.tutorial = -1');
    expect(game('goalHtml()')).toContain('Nächste Insel: 🌲 Waldinsel');
    game("state.islands.add('wald'); ownIsland('wald')");
    expect(game('goalHtml()')).toContain('Uralter Baum → Freischneiden');
  });
});

describe('Spieluhr', () => {
  it('ein Tag dauert 24 Minuten (Block 101): 13 hell, 8 richtig Nacht, dazwischen Dämmerung', () => {
    const min = 60e3;
    let dark = 0, day = 0;
    for (let m = 0; m < 24; m += 0.25) {
      const n = game(`nightAt(${m * min})`);
      if (n >= 0.45) dark += 0.25;
      if (n === 0) day += 0.25;
    }
    expect(dark).toBeGreaterThanOrEqual(8);
    expect(dark).toBeLessThanOrEqual(8.25);
    expect(day).toBeGreaterThanOrEqual(13);
    expect(day).toBeLessThanOrEqual(13.25);
    expect(game(`nightAt(${(24 + 12) * min})`)).toBe(0);     // nächster Mittag
  });
});

describe('Alles verschieben', () => {
  it('das Rathaus lässt sich verschieben', () => {
    game('pickUp(2, 2, 0)');
    expect(game('movingType()')).toBe('rathaus');
    game('dropAt(8, 8, 0)');
    expect(game("state.tiles.get('8,8').b")).toBe('rathaus');
  });
  it('Sehenswürdigkeiten erst nach dem Restaurieren und nur auf eigenes Land', () => {
    game("state.tiles.set('7,7', { b: 'lm', lm: 'ruine', lvl: 1 }); recalc()");
    game('pickUp(7, 7, 0)');
    expect(game('moving')).toBe(null);
    game('state.restore.ruine = 1');
    game('pickUp(7, 7, 0)');
    expect(game('movingType()')).toBe('lm');
    game('dropAt(40, 40, 0)');
    expect(game('moving')).not.toBe(null);
    game('dropAt(9, 8, 0)');
    expect(game("state.tiles.get('9,8').lm")).toBe('ruine');
  });
});

describe('Aufgaben als Karten (Block 68)', () => {
  it('jede Aufgabe ist eine antippbare Karte mit Symbol, Balken bzw. „Los!“', () => {
    game('startNew()'); game('closeModal(); state.tutorial = -1; recalc()');
    const html = game('goalHtml()');
    expect(html).toContain('class="task');
    expect(html).toContain('data-isle="wald"');
    expect(html).toContain('class="t-ic"');
    game("state.money = 1e6; state.res.holz = 999; state.islands.add('wald'); ownIsland('wald'); recalc()");
    expect(game('goalHtml()')).toContain('data-lm="baum"');
    expect(game('goalHtml()')).toContain('Los!');
  });
});
