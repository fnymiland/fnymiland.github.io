const { loadGame, game } = require('./helpers/load-game');

// Block 44: Park zum Selberbauen – Parkrasen malen, Deko darauf, daraus wird Grünanlage / Park / Stadtpark
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});
const build = (b, x, y) => game(`build('${b}', ${x}, ${y}, true)`);
const lawn = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) build('parkrasen', x, y); game('recalc()'); };

describe('Parkrasen', () => {
  it('ist ein Boden, der als Wiese zählt; steht im Menü unter Gestalten → Grün, der alte 3×3-Park nicht mehr', () => {
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(game("terraLook(10, 10)")).toBe('park');
    expect(game("terrainAt(10, 10)")).toBe('grass');
    expect(game("menuPlaceOf('parkrasen')")).toEqual({ top: 'gestalten', sub: 'gruen' });
    expect(game("menuItemsOf('gestalten', 'gruen')")).not.toContain('park');
  });

  it('auf den Rasen gehören nur Deko und Wege, keine Häuser', () => {
    lawn(10, 10, 3, 3);
    expect(build('baum', 10, 10)).toBe(true);
    expect(build('brunnen', 11, 11)).toBe(true);
    expect(build('weg', 12, 10)).toBe(true);
    expect(game("placeError('haus', 10, 12)")).toBe('Auf den Parkrasen gehören nur Deko und Wege');
  });

  it('darf unter Deko und Wege gemalt werden, nicht unter Gebäude', () => {
    build('brunnen', 10, 10); build('weg', 11, 10); build('haus', 12, 10);
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(build('parkrasen', 11, 10)).toBe(true);
    expect(game("placeError('parkrasen', 12, 10)")).toMatch(/Gebäude/);
  });
});

describe('Stufen, Park-Wunsch, Schönheit', () => {
  const stage = () => game('(computeParks(), PARKS.map(p => p.stage))');
  it('Grünanlage ab 4 Feldern mit 3 Deko; Park braucht 9 Felder, 8 Deko, Bäume und eine Bank; Stadtpark auch Wasser', () => {
    lawn(10, 10, 2, 2);
    build('blumentopf', 10, 10); build('blumentopf', 11, 10);
    expect(stage()).toEqual([]);                                                  // 2 Deko: noch nichts
    build('busch', 10, 11);
    expect(stage()).toEqual([1]);                                                 // Grünanlage
    lawn(10, 10, 3, 3);
    for (const [x, y] of [[12, 10], [12, 11], [11, 11], [10, 12]]) build('baum', x, y);
    expect(game('(computeParks(), PARKS[0].deco)')).toBe(7);
    build('blumen', 11, 12);
    expect(stage()).toEqual([1]);                                                 // 8 Deko, aber keine Bank
    build('bank', 12, 12);
    expect(stage()).toEqual([2]);                                                 // Park
    lawn(10, 10, 4, 4);
    for (const [x, y] of [[13, 10], [13, 11], [13, 12], [10, 13], [11, 13], [12, 13]]) build('baum', x, y);
    expect(stage()).toEqual([2]);                                                 // 15 Deko, aber kein Wasser
    build('brunnen', 13, 13);
    expect(stage()).toEqual([3]);                                                 // Stadtpark
  });

  it('der Park erfüllt den Park-Wunsch bis 4 Felder und bringt Schönheit, auch ringsum', () => {
    lawn(10, 10, 2, 2);
    for (const [x, y] of [[10, 10], [11, 10], [10, 11]]) build('blumentopf', x, y);
    game('recalc()');
    expect(game("wishCheck('park', 15, 10).ok")).toBe(true);                     // 4 Felder daneben
    expect(game("parkReach(null, 18, 10)")).toBe(null);                           // zu weit (und ohne Viertel)
    const near = game('beautyAround(13, 10, 0)');
    expect(near).toBe(game('PARK_BEAUTY[1]'));                                     // nur der Park-Bonus (bis 3 Felder)
    expect(game('beautyAround(16, 10, 0)')).toBe(0);
  });
});

describe('Besucher und Parkfest', () => {
  const park = () => { lawn(10, 10, 2, 2); for (const [x, y] of [[10, 10], [11, 10], [10, 11]]) build('blumentopf', x, y); game('recalc()'); };
  it('ein Park zieht Besucher an', () => {
    const before = game('(recalc(), placeStats().attr.get(regionAt(10, 10)) || 0)');
    park();
    expect(game('placeStats().attr.get(regionAt(10, 10)) || 0')).toBeGreaterThan(before);
  });

  it('Parkfest nur mit Park, 3 Minuten Einnahmen ×1,25 (Grünanlage), danach Pause; wird gespeichert', () => {
    expect(game('startParkFest()')).toBe(false);
    park();
    expect(game('startParkFest(1e12)')).toBe(true);
    expect(game('boostMul("inc", 1e12 + 60e3)')).toBeCloseTo(1.25);
    expect(game('boostMul("inc", 1e12 + 4 * 60e3)')).toBe(1);                    // vorbei
    expect(game('startParkFest(1e12 + 5 * 60e3)')).toBe(false);                   // Pause
    expect(game('startParkFest(1e12 + 21 * 60e3)')).toBe(true);
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).parkFest.mul')).toBeCloseTo(1.25);
  });
});
