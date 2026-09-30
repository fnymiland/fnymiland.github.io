const { loadGame, game } = require('./helpers/load-game');

// Mehrere kleine Dekos auf einem Feld – auch der Baum
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("state.money = 5000; state.res.bretter = 20");
  game("for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});

describe('Baum als kleine Deko', () => {
  it('Baum, Bank, Blumentopf und Busch passen zusammen auf ein Feld', () => {
    expect(game("buildSmall('baum', 5, 5, 0)")).toBe(true);
    expect(game("buildSmall('bank', 5, 5, 3)")).toBe(true);
    expect(game("buildSmall('blumentopf', 5, 5, 1)")).toBe(true);
    expect(game("buildSmall('busch', 5, 5, 2)")).toBe(true);
    expect(game("state.decos.get('5,5').slice(0, 4).map(d => d.b)")).toEqual(['baum', 'blumentopf', 'busch', 'bank']);
    expect(game("state.tiles.has('5,5')")).toBe(false);
  });

  it('auch vier Bäume auf einem Feld (ein kleines Wäldchen)', () => {
    for (let i = 0; i < 4; i++) expect(game(`buildSmall('baum', 5, 5, ${i})`)).toBe(true);
    expect(game('state.money')).toBe(5000 - 4 * 15);
  });

  it('ein Baum neben einem Haus zählt als Deko für den Hauswunsch', () => {
    game("state.tiles.set('5,5', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("wishMet('deko', 5, 5)")).toBe(false);
    game("buildSmall('baum', 6, 5, 0)");
    expect(game("wishMet('deko', 5, 5)")).toBe(true);
  });

  it('alte Stände: ein Baum auf einem ganzen Feld wandert in die hintere Ecke', () => {
    game("state.tiles.set('5,5', { b: 'baum', lvl: 1 }); state.decos.set('6,6', [null, null, null, { b: 'bank', rot: 0 }]); state.tiles.set('6,6', { b: 'baum', lvl: 1 })");
    game('normalizeSmall(); recalc()');
    expect(game("state.tiles.has('5,5') || state.tiles.has('6,6')")).toBe(false);
    expect(game("state.decos.get('5,5')[0].b")).toBe('baum');
    expect(game("state.decos.get('6,6').map(d => d && d.b)")).toEqual(['baum', null, null, 'bank']);
  });
});

describe('Ecke wählen', () => {
  it('ist die angetippte Ecke belegt, nimmt die Deko die nächste freie', () => {
    game("buildSmall('blumentopf', 5, 5, 3)");
    expect(game('freeSlot(5, 5, 0)')).toBe(0);
    const s = game('freeSlot(5, 5, 3)');
    expect([1, 2]).toContain(s);                                  // eine Nachbarecke, nicht die gegenüber
  });

  it('sind alle vier Ecken voll, sagt der Hinweis das', () => {
    for (let i = 0; i < 4; i++) game(`buildSmall('busch', 5, 5, ${i})`);
    expect(game('freeSlot(5, 5, 2)')).toBe(2);
    expect(game("smallError('busch', 5, 5, 2)")).toBe('Alle 4 Ecken sind belegt');
  });
});

// Block 42: 8 Plätze je Feld – Ecken und Seitenmitten; Bänke am Wegrand längs zum Weg; Häuser nur an den Ecken
describe('Kleinkram: 8 Plätze', () => {
  beforeEach(() => { game('startNew()'); game("closeModal(); state.money = 5000; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99; for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()"); });

  it('Seitenmitten liegen zwischen den Ecken am Rand, näher an der Kante', () => {
    expect(game('SLOTS')).toBe(8);
    expect(game('[4, 5, 6, 7].map(slotUV)')).toEqual([[-0.38, 0], [0, -0.38], [0.38, 0], [0, 0.38]]);
    expect(game('newSlots().length')).toBe(8);
  });

  it('Bank in der Seitenmitte eines Wegs: längs zum Weg gedreht; acht Dinge passen auf ein Feld', () => {
    game("state.tiles.set('5,5', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    expect(game("buildSmall('bank', 5, 5, 5)")).toBe(true);
    expect(game("buildSmall('bank', 5, 5, 4)")).toBe(true);
    expect(game("[state.decos.get('5,5')[5].rot, state.decos.get('5,5')[4].rot]")).toEqual([3, 0]);
    for (const s of [0, 1, 2, 3, 6, 7]) expect(game(`buildSmall('blumentopf', 5, 5, ${s})`)).toBe(true);
    expect(game("smallError('blumentopf', 5, 5, 6)")).toBe('Alle Plätze sind belegt');
  });

  it('an ein Haus nur an die Ecken, nicht in die Seitenmitten', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("smallError('laterne', 6, 6, 0, { noCost: true })")).toBe(null);
    expect(game("smallError('busch', 6, 6, 6)")).toBe('Auf Gebäudefeldern nur an die Ecken');
  });

  it('alte Stände mit 4 Plätzen werden beim Laden auf 8 erweitert', () => {
    const d = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.decos = [['7,7', [{ b: 'busch', rot: 0 }, null, null, null]]]; return d; })()");
    expect(new Map(game(`parseSave(${JSON.stringify(d)})`).decos).get('7,7').length).toBe(8);
  });

  it('Tippen trifft den nächsten der 8 Plätze', () => {
    game('cam.x = 0; cam.y = 0; cam.z = 1');
    const p = game('iso(5, 5)'), W = game('W'), H = game('H');
    const at = (du, dv) => game(`slotAt(${W / 2 + (p.x + (du - dv) * TW / 2)}, ${H / 2 + (p.y + (du + dv) * TH / 2)}).slot`);
    expect(at(0.3, 0.3)).toBe(3);
    expect(at(0.4, 0)).toBe(6);
    expect(at(0, -0.4)).toBe(5);
  });
});
