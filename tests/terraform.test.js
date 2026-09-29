const { loadGame, game } = require('./helpers/load-game');

// Terraforming: nach der Forschung Gelände selbst gestalten (Wiese, Strand, Wald, Obstbäume, Felsen)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999');
  game("for (let y = 3; y <= 12; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('sandCache.clear(); recalc()');
});
const ter = (x, y) => game(`terrainAt(${x}, ${y})`);

describe('Terraforming', () => {
  it('erst mit der Forschung', () => {
    expect(game("available('wald')")).toBe(false);
    expect(game("TECH_BY_ID.terraform.name")).toBe('Terraforming');
    game("state.techs.add('terraform')");
    for (const b of ['wiese', 'strand', 'wald', 'obstwald', 'fels']) expect(game(`available('${b}')`), b).toBe(true);
  });

  it('Wald, Obstbäume und Felsen pflanzen – dort gehen dann Holzfäller, Obstplantage, Steinbruch', () => {
    game("state.techs.add('terraform')");
    expect(game("build('wald', 6, 6, true)")).toBe(true);
    expect(ter(6, 6)).toBe('forest');
    expect(game("placeError('holz', 6, 6)")).not.toMatch(/Nur im Wald/);
    expect(game("build('obstwald', 8, 6, true)")).toBe(true);
    expect(ter(8, 6)).toBe('obst');
    expect(game("build('fels', 10, 6, true)")).toBe(true);
    expect(ter(10, 6)).toBe('rock');
    expect(game("placeError('wald', 6, 6)")).toBe('Hier ist schon Wald');
  });

  it('Strand: sieht aus wie Sand, zählt aber als Wiese (man kann darauf bauen)', () => {
    game("state.techs.add('terraform')");
    expect(game("build('strand', 7, 8, true)")).toBe(true);
    expect(game("terraLook(7, 8)")).toBe('sand');
    expect(ter(7, 8)).toBe('grass');
    expect(game("placeError('haus', 7, 8)")).toBe(null);
  });

  it('Wiese: macht Wald wieder grün – und Strand am Wasser auch', () => {
    game("state.techs.add('terraform'); state.terra.set('6,9', 'forest')");
    expect(game("build('wiese', 6, 9, true)")).toBe(true);
    expect(ter(6, 9)).toBe('grass');
    const [x, y] = game(`(() => { for (let y = -40; y < 45; y++) for (let x = -40; x < 45; x++) if (ownedTile(x, y) && terrainAt(x, y) === 'grass' && isBeach(x, y) && !COVER.has(x + ',' + y) && !decosAt(x + ',' + y)) return [x, y]; })()`);
    expect(game(`build('wiese', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`terraLook(${x}, ${y})`)).toBe('wiese');
    expect(game(`placeError('wiese', 8, 8)`)).toBe('Hier ist schon Wiese');
  });

  it('nicht auf Wasser, nicht unter Gebäuden; Erz und Kristall gibt es nicht zum Pflanzen', () => {
    game("state.techs.add('terraform'); state.terra.set('9,9', 'water'); state.tiles.set('11,11', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("placeError('wald', 9, 9)")).toMatch(/Wasser/);
    expect(game("placeError('wald', 11, 11)")).toBe('Hier steht etwas');
    expect(game("Object.values(TERRAFORM)")).not.toContain('erz');
  });

  it('wird gespeichert; Vorschaubilder und Boden lassen sich zeichnen', () => {
    game("state.techs.add('terraform'); build('strand', 7, 8, true); build('wiese', 8, 8, true); save()");
    expect(game("load().terra.get('7,8')")).toBe('sand');
    for (const b of ['wiese', 'strand', 'wald', 'obstwald', 'fels']) expect(() => game(`thumbRaw('${b}')`), b).not.toThrow();
    expect(() => game("drawGround(7, 8, { x: 100, y: 100 }, 1, 0, true)")).not.toThrow();
  });
});
