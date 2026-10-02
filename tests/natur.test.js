const { loadGame, game } = require('./helpers/load-game');

// Block 56: Tiere in der Natur – zeigen, wo es schön ist; antippen → Album „Naturbeobachtungen“ mit drei Belohnungen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('critters.length = 0; walkers.length = 0; recalc()');
});
const ids = (x, y, part = 'mittag') => game(`natureAt(${x}, ${y}, '${part}').map(o => o[0])`);
const chance = (x, y, id, part = 'mittag') => game(`(natureAt(${x}, ${y}, '${part}').find(o => o[0] === '${id}') || [0, 0])[1]`);

describe('Wo welche Tiere vorkommen', () => {
  it('Schmetterlinge nur bei Blumen oder im Park – je schöner, desto häufiger; nachts Glühwürmchen', () => {
    expect(ids(10, 10)).not.toContain('schmetterling');
    game("buildSmall('blumentopf', 10, 10, 0)");
    const few = chance(10, 10, 'schmetterling');
    expect(few).toBeGreaterThan(0);
    game("state.tiles.set('11,10', { b: 'blumen', lvl: 1 }); state.tiles.set('9,10', { b: 'blumen', lvl: 1 }); recalc()");
    expect(chance(10, 10, 'schmetterling')).toBeGreaterThan(few);
    expect(ids(10, 10, 'nacht')).toEqual(['gluehwurm']);
  });

  it('Wasser: Fische und Frösche im Teich, Eisvogel nur mit Blumen am Ufer, Goldfisch nur an sehr schönen Orten', () => {
    game("state.terra.set('10,10', 'water'); recalc()");
    expect(ids(10, 10)).toEqual(expect.arrayContaining(['fisch', 'frosch']));
    expect(ids(10, 10)).not.toContain('eisvogel');
    game("buildSmall('blumentopf', 11, 10, 0)");
    expect(ids(10, 10)).toContain('eisvogel');
    expect(ids(10, 10)).not.toContain('goldfisch');
    for (const [x, y] of [[11, 11], [9, 9], [12, 10]]) game(`state.tiles.set('${x},${y}', { b: 'statue', lvl: 1 })`);
    game('recalc()');
    expect(ids(10, 10)).toContain('goldfisch');
  });

  it('Wald: Vögel; nachts die Eule; Reh nur am ruhigen Waldrand', () => {
    game("for (let x = 10; x <= 12; x++) state.terra.set(x + ',10', 'forest'); recalc()");
    expect(ids(10, 10)).toEqual(expect.arrayContaining(['vogel', 'reh']));
    expect(ids(10, 10, 'nacht')).toContain('eule');
    game("state.tiles.set('13,12', { b: 'saege', lvl: 1, rot: 0 }); recalc()");
    expect(ids(10, 10)).not.toContain('reh');                                     // Sägewerk nebenan: zu laut
  });

  it('Meer an der eigenen Küste: Möwen und Robben', () => {
    const sea = game('(() => { for (let y = -40; y < 60; y++) for (let x = -40; x < 60; x++) if (isSea(x, y) && nearOwnLand(x, y) && DIRS.some(([dx, dy]) => terrainAt(x + dx, y + dy) !== "water")) return [x, y]; })()');
    expect(ids(...sea)).toEqual(expect.arrayContaining(['moewe', 'robbe']));
  });
});

describe('Entdecken', () => {
  it('Antippen trägt das Tier ins Album ein; es läuft/fliegt weg; zweimal zählt nicht doppelt', () => {
    game("state.album = new Set(); spawnCritter('frosch', 10, 10, performance.now())");
    const [sx, sy] = game('(() => { const c = critters[0], p = toScreen(c.px, c.py); return [p.x, p.y - c.h * cam.z]; })()');
    game(`tap(${sx}, ${sy}, false)`);
    expect(game("state.album.has('natur:frosch')")).toBe(true);
    expect(game('!!critters[0].flee')).toBe(true);
    expect(game('albumCount("natur")')).toBe(1);
    game("spawnCritter('frosch', 12, 12, performance.now())");
    expect(game('tapCritter(critters[1])')).toBe(false);
    expect(game('albumCount("natur")')).toBe(1);
  });

  it('Belohnungen: 4 → Schmetterlingsgarten, 8 → Vogelhäuschen-Baum, alle 12 → Seerosenteich', () => {
    game('state.album = new Set()');
    for (const b of ['schmetterlingsgarten', 'vogelbaum', 'seerosenteich']) expect(game(`available('${b}')`)).toBe(false);
    expect(game("lockText('schmetterlingsgarten')")).toMatch(/0\/4/);
    const all = game('NATURE.map(n => n.id)');
    all.slice(0, 4).forEach(id => game(`state.album.add('natur:${id}')`));
    expect(game("available('schmetterlingsgarten')")).toBe(true);
    expect(game("available('vogelbaum')")).toBe(false);
    all.slice(4, 8).forEach(id => game(`state.album.add('natur:${id}')`));
    expect(game("available('vogelbaum')")).toBe(true);
    all.slice(8).forEach(id => game(`state.album.add('natur:${id}')`));
    expect(game("available('seerosenteich')")).toBe(true);
    expect(game("build('seerosenteich', 10, 10, true)")).toBe(true);
  });

  it('Album-Seite: Fehlendes mit Hinweis, wo man es findet; die drei Stufen', () => {
    game("state.album = new Set(['natur:eule']); openAlbum()");
    const page = game("document.querySelector('[data-apage=\"natur\"]').textContent");
    expect(page).toMatch(/Eule/);
    expect(page).toMatch(/am Waldrand, wo es ruhig ist/);                        // Hinweis fürs Reh
    expect(page).toMatch(/4: Schmetterlingsgarten.*8: Vogelhäuschen-Baum.*12: Seerosenteich/s);
  });

  it('höchstens 20 Tiere gleichzeitig (seltene dürfen dazu); sie verschwinden wieder', () => {
    game("for (let y = 3; y <= 20; y++) for (let x = 3; x <= 20; x++) state.terra.set(x + ',' + y, 'park'); recalc()");
    for (let i = 0; i < 30; i++) game(`natureTick(${1000 + i})`);
    expect(game('critters.filter(c => !NATURE_BY_ID[c.id].rare).length')).toBeLessThanOrEqual(20);
    game('natureTick(1e9)');
    expect(game('critters.length')).toBeLessThan(25);
  });
});
