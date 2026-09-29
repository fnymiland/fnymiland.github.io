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

describe('Markt', () => {
  it('belegt 3×3 Felder', () => {
    game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
    game("for (const t of TECHS) state.techs.add(t.id)");
    game("for (let i = 0; i < 4; i++) state.tiles.set('6,' + (6 + i), { b: 'haus', lvl: 5 }); recalc()");
    expect(game("build('markt', 8, 8, true)")).toBe(true);
    for (const k of ['10,10', '8,10', '10,8']) expect(game(`anchorAt(${k})`)).toBe('8,8');
  });
});

describe('Spieluhr', () => {
  it('ein Tag dauert 20 Minuten, davon etwa 3 Minuten richtig Nacht', () => {
    const min = 60e3;
    let dark = 0, day = 0;
    for (let m = 0; m < 20; m += 0.25) {
      const n = game(`nightAt(${m * min})`);
      if (n >= 0.45) dark += 0.25;
      if (n === 0) day += 0.25;
    }
    expect(dark).toBeGreaterThanOrEqual(3);
    expect(dark).toBeLessThanOrEqual(3.25);
    expect(day).toBeGreaterThanOrEqual(15);
    expect(game(`nightAt(${20 * min})`)).toBe(0);     // nächster Morgen
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
