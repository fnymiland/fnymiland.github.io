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
  it('ist ein Boden, der als Wiese zählt; steht im Menü unter Gestalten → Wege & Gelände, der alte 3×3-Park nicht mehr', () => {
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(game("terraLook(10, 10)")).toBe('park');
    expect(game("terrainAt(10, 10)")).toBe('grass');
    expect(game("menuPlaceOf('parkrasen')")).toEqual({ top: 'gestalten', sub: 'land' });
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

describe('Spaziergänger', () => {
  it('im Park laufen Spaziergänger, bleiben auf dem Rasen und setzen sich auf Bänke', () => {
    lawn(10, 10, 3, 3);
    for (const [x, y, s] of [[10, 10, 0], [11, 10, 1], [12, 10, 0], [10, 12, 3]]) game(`buildSmall('baum', ${x}, ${y}, ${s})`);
    game("buildSmall('blumentopf', 12, 12, 2); buildSmall('blumentopf', 12, 11, 1); buildSmall('blumentopf', 10, 11, 0)");
    game("buildSmall('bank', 11, 11, 4)");
    game('recalc(); T.pop = 50; strollers.length = 0');
    expect(game('(computeParks(), PARKS[0].stage)')).toBe(2);
    for (let i = 0; i < 10; i++) game('syncStrollers()');
    expect(game('strollers.length')).toBe(3);                                    // Park: bis 5, aber höchstens 1 je 3 Felder
    for (let i = 0; i < 400; i++) game('for (const w of strollers) stepMover(w, 0.25, parkWalk, true)');
    expect(game("strollers.every(w => terraLook(w.fx, w.fy) === 'park' && terraLook(w.tx, w.ty) === 'park')")).toBe(true);
    game("strollers.length = 0; strollers.push({ fx: 11, fy: 11, tx: 11, ty: 11, px: 11, py: 11, t: 0, wait: 0, stroll: true, fur: '#fff', shirt: '#fff', speed: 0.5 })");
    game('(() => { const r = Math.random; Math.random = () => 0.1; sitDown(strollers[0]); Math.random = r; })()');
    expect(game('strollers[0].sit')).toBe(true);
  });

  it('Bewohner laufen nicht durch Hecken und Zäune (nur durchs Tor)', () => {
    game("state.tiles.set('10,10', { b: 'weg', lvl: 1 }); state.tiles.set('11,10', { b: 'weg', lvl: 1 }); state.edges.set('b11,10', { b: 'zaun', style: 'latten' }); recalc()");
    expect(game('isGate("b11,10")')).toBe(true);                                   // Weg auf beiden Seiten: Tor
    game("state.tiles.delete('11,10'); recalc()");
    game("walkers.length = 0; walkers.push({ fx: 10, fy: 10, tx: 10, ty: 10, px: 10, py: 10, t: 1, wait: 0, fur: '#fff', shirt: '#fff', speed: 1 })");
    for (let i = 0; i < 200; i++) { game('stepMover(walkers[0], 0.5, walkable, true)'); expect(game('walkers[0].tx === 11 && walkers[0].ty === 10')).toBe(false); }
  });
});

describe('Alte Parks', () => {
  it('ein alter 3×3-Park wird beim Laden Parkrasen mit Brunnen, Bäumen und Bänken – und ist gleich ein „Park“', () => {
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    d.tiles.push(['10,10', { b: 'park', lvl: 1 }]);                               // alter Spielstand (den Park gibt es nicht mehr, Block 64)
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.has('10,10')")).toBe(false);
    expect(game("state.tiles.get('11,11').b")).toBe('brunnen');
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) expect(game(`terraLook(${10 + i}, ${11 + j - 1})`)).toBe('park');
    expect(game('(recalc(), PARKS.map(p => p.stage))')).toEqual([2]);
    expect(game("[...state.decos.values()].flat().filter(d => d && d.b === 'bank').length")).toBe(2);
  });
});

describe('Parkrasen im Wald', () => {
  it('Wald und Obsthain werden Rasen, die Bäume bleiben als Parkbäume; Fels nicht', () => {
    game("state.terra.set('10,10', 'forest'); state.terra.set('11,10', 'obst'); state.terra.set('12,10', 'rock')");
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(build('parkrasen', 11, 10)).toBe(true);
    expect(game("terraLook(10, 10)")).toBe('park');
    expect(game("state.decos.get('10,10').filter(d => d && d.b === 'baum').length")).toBeGreaterThan(0);
    expect(game("placeError('parkrasen', 12, 10)")).toMatch(/Fels/);
  });
});

describe('Nichts Unbaubares (Block 64)', () => {
  it('alles, was „Neu freigeschaltet“ zeigen kann, steht auch im Baumenü – der alte Park ist ganz weg', () => {
    const missing = game(`Object.keys(ITEMS).filter(id => ITEMS[id].cat && !ITEMS[id].variantOf && !ITEMS[id].gift && id !== 'verschieben' && id !== 'abriss'
      && !MENU.some(m => (m.groups ? m.groups.flatMap(g => g.items) : m.items).includes(id)))`);
    expect(missing).toEqual([]);
    expect(game("'park' in ITEMS")).toBe(false);
    game("state.restore.baum = 2");
    expect(game("[...unlockKeys()]")).toContain('parkrasen');
  });
});
