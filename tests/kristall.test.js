const { loadGame, game } = require('./helpers/load-game');

// Kristall 💎: Rohstoff der Kristallinsel, für Glas- und Kristalldinge
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99");
  game("state.islands.add('kristall'); ownIsland('kristall')");
  game("for (let i = 0; i < 6; i++) state.tiles.set('4,' + (i + 3), { b: 'haus', lvl: 5 }); recalc()");   // genug Einwohner
});
// ein Kristallfels-Feld auf der Kristallinsel (freies, nicht bebautes)
const crystalTile = () => game(`(() => {
  const i = ISLE_BY_ID.kristall;
  for (let r = 4; r < 14; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = Math.round(i.cx) + dx, y = Math.round(i.cy) + dy;
    if (terrainAt(x, y) === 'kristall' && !state.tiles.has(x + ',' + y)) return [x, y];
  }
  return null;
})()`);

describe('Kristall als Rohstoff', () => {
  it('ist ein Rohstoff mit eigenem Zeichen', () => {
    expect(game('RES.kristall.icon')).toBe('💎');
    expect(game('newRes().kristall')).toBe(0);
  });

  it('die Kristallinsel hat Kristallfelsen (und kein Erz mehr), die Heimatinsel keine', () => {
    const count = game(`(() => { const i = ISLE_BY_ID.kristall; let n = 0, erz = 0;
      for (let y = Math.round(i.cy) - 14; y <= i.cy + 14; y++) for (let x = Math.round(i.cx) - 14; x <= i.cx + 14; x++)
        if (islandAt(x, y) === 'kristall') { if (terrainAt(x, y) === 'kristall') n++; if (terrainAt(x, y) === 'erz') erz++; }
      return [n, erz]; })()`);
    expect(count[0]).toBeGreaterThan(6);
    expect(count[1]).toBe(0);
    expect(game("TERRAIN_NAMES.kristall")).toBe('Kristallfels');
  });

  it('die Kristallmine gibt es ab der ersten Laterne der Kristallhöhle, nur auf Kristallfels', () => {
    const [x, y] = crystalTile();
    expect(game("available('kristallmine')")).toBe(false);
    game('state.restore.kristall = 1');
    expect(game("available('kristallmine')")).toBe(true);
    expect(game("placeError('kristallmine', 6, 6)")).toMatch(/Nur auf Kristallfels/);
    expect(game(`placeError('kristallmine', ${x}, ${y})`)).toBe(null);
    expect(game(`build('kristallmine', ${x}, ${y}, true)`)).toBe(true);
    game('recalc(); state.res.kristall = 0');
    expect(game('T.prod.kristall')).toBeGreaterThan(0);
    game('produce(100)');
    expect(game('state.res.kristall')).toBeGreaterThan(0);
  });

  it('Kristallfels kann man sprengen wie Fels', () => {
    const [x, y] = crystalTile();
    expect(game(`demolishInfo(${x}, ${y}).label`)).toBe('Sprengen');
  });

  it('die Kristallmine wächst in drei Stufen', () => {
    expect(game("BUILD_STAGES.kristallmine.names.length")).toBe(3);
  });
});

describe('Kristall- und Glas-Dekos', () => {
  const NEW = ['kristall', 'kristallaterne', 'glaskugel', 'kristallbrunnen', 'glashaus'];

  it('alle brauchen Kristall 💎 und kommen nach und nach mit den Laternen der Kristallhöhle', () => {
    for (const id of NEW) expect(game(`ITEMS.${id}.mat.kristall`)).toBeGreaterThan(0);
    game('state.restore.kristall = 1');
    expect(game("['kristall', 'kristallaterne', 'glaskugel', 'kristallbrunnen', 'glashaus'].map(available)")).toEqual([true, false, false, false, false]);
    game('state.restore.kristall = 2');
    expect(game("['kristallaterne', 'glaskugel', 'kristallbrunnen'].map(available)")).toEqual([true, true, false]);
    game('state.restore.kristall = 3');
    expect(game("['kristallbrunnen', 'glashaus'].map(available)")).toEqual([true, true]);
  });

  it('Kristall-Laterne und Glaskugel sind klein – mit Bank und Baum auf einem Feld', () => {
    game("state.restore.kristall = 2; for (let y = 3; y <= 9; y++) for (let x = 6; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } recalc()");
    expect(game("buildSmall('kristallaterne', 7, 7, 0)")).toBe(true);
    expect(game("buildSmall('glaskugel', 7, 7, 1)")).toBe(true);
    expect(game("buildSmall('baum', 7, 7, 2)")).toBe(true);
    expect(game('state.res.kristall')).toBe(99 - 2);
  });

  it('Kristallbrunnen belegt ein Feld, das Glashaus zwei', () => {
    game("state.restore.kristall = 3; for (let y = 3; y <= 9; y++) for (let x = 6; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } recalc()");
    expect(game("build('kristallbrunnen', 7, 4, true)")).toBe(true);
    expect(game("smallError('blumentopf', 7, 4, 0)")).toBe('Hier ist kein Platz für Deko');
    expect(game("sizeOf('glashaus', 0)")).toEqual([1, 2]);
    expect(game("build('glashaus', 7, 7, true)")).toBe(true);
  });

  it('die Schaltet-frei-Liste der Kristallhöhle nennt sie', () => {
    const names = game("LM_STAGES.kristall.map(st => st.unlock.map(unlockName).join(', '))");
    expect(names[0]).toMatch(/Kristallmine/);
    expect(names[1]).toMatch(/Kristall-Laterne/);
    expect(names[2]).toMatch(/Kristallbrunnen/);
  });

  it('zeichnen geht ohne Fehler, tags und nachts', () => {
    for (const n of [0, 0.8]) {
      game(`night = ${n}`);
      for (const id of NEW) expect(() => game(`drawObject('${id}', 100, 100, 1, 1000, 3, 3, 1, { rot: 0, slot: 1 })`)).not.toThrow();
    }
    game('night = 0');
  });
});

describe('Glasvilla', () => {
  const villa = () => game("for (let y = 3; y <= 9; y++) for (let x = 6; x <= 11; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } state.tiles.set('8,6', { b: 'haus', lvl: 5, name: 'Mo' }); recalc()");

  it('ist die Stufe nach der Villa, mit mehr Einwohnern', () => {
    expect(game('HOUSE_STAGES[5].name')).toBe('Glasvilla');
    expect(game('HOUSE_STAGES[5].pop')).toBeGreaterThan(game('HOUSE_STAGES[4].pop'));
    expect(game('HOUSE_STAGES[5].mat.kristall')).toBeGreaterThan(0);
  });

  it('erst mit der ersten Laterne der Kristallhöhle – vorher bleibt die Villa das Ende', () => {
    villa();
    game('state.restore.kristall = 0');
    const w = game("houseWishes(state.tiles.get('8,6'), 8, 6)");
    expect(w.next).toBe(null);
    expect(w.later.name).toBe('Glasvilla');
    game('state.restore.kristall = 1');
    expect(game("houseWishes(state.tiles.get('8,6'), 8, 6).next.name")).toBe('Glasvilla');
  });

  it('wünscht sich Blick aufs Wasser – ein Teich reicht', () => {
    villa();
    game('state.restore.kristall = 1');
    expect(game("houseWishes(state.tiles.get('8,6'), 8, 6).list.map(w => w.id)")).toContain('wasser');
    expect(game("wishMet('wasser', 8, 6)")).toBe(false);
    game("state.terra.set('10,7', 'water'); recalc()");
    expect(game("wishMet('wasser', 8, 6)")).toBe(true);
  });

  it('Ausbau kostet Kristall, danach zeigt das Haus die Glasvilla', () => {
    villa();
    game('state.restore.kristall = 1; globalThis.__wm = wishMet; wishMet = () => true');
    const k = game('state.res.kristall');
    game('houseUpgrade(8, 6)');
    game('wishMet = globalThis.__wm');
    expect(game("state.tiles.get('8,6').lvl")).toBe(6);
    expect(game('state.res.kristall')).toBe(k - game('HOUSE_STAGES[5].mat.kristall'));
    expect(game("houseLook(state.tiles.get('8,6'))")).toBe(6);
    for (const n of [0, 0.8]) expect(() => game(`night = ${n}; drawObject('haus', 100, 100, 1, 1000, 8, 6, 6, state.tiles.get('8,6'))`)).not.toThrow();
    game('night = 0');
  });
});
