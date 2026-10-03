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
    expect(game('SLOTS')).toBe(9);                                       // 8 + Eckpunkt (Block 65)
    expect(game('[4, 5, 6, 7].map(slotUV)')).toEqual([[-0.42, 0], [0, -0.42], [0.42, 0], [0, 0.42]]);
    expect(game('newSlots().length')).toBe(9);
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
    expect(new Map(game(`parseSave(${JSON.stringify(d)})`).decos).get('7,7').length).toBe(9);
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

describe('Kleinkram weit außen (Block 46)', () => {
  it('eine Laterne steht weit in der Ecke (neben dem Weg), ein Baum etwas weiter drin', () => {
    const [u, v] = game("slotPos(5, 5, 3, 'laterne')");
    expect(u).toBeGreaterThan(0.39); expect(v).toBeGreaterThan(0.39);
    expect(u).toBeGreaterThan(game('EDGE_W'));                                        // außerhalb des Wegbands
    expect(game("slotPos(5, 5, 3, 'baum')")[0]).toBeLessThan(u);
  });

  it('an einem Zaun oder einer Hecke rückt es um deren Dicke nach innen; an einem Eckpunkt mit Linie hält es Abstand', () => {
    const free = game("slotPos(5, 5, 3, 'laterne')")[0];
    game("state.edges.set('b6,5', { b: 'hecke', style: 'niedrig' })");               // rechte Seite von Feld 5,5 (+u)
    const [u, v] = game("slotPos(5, 5, 3, 'laterne')");
    expect(u).toBeLessThan(free);
    expect(0.5 - u).toBeGreaterThanOrEqual(0.14 + 0.08 - 1e-9);                        // Rand der Laterne vor der Hecke
    expect(v).toBeLessThan(free);                                                       // Eckpunkt mit Hecke: Abstand zur Ecke
    game("state.edges.clear(); state.edges.set('a6,6', { b: 'zaun', style: 'latten' })");   // nur außerhalb am Eckpunkt (6,6)
    expect(game("slotPos(5, 5, 3, 'laterne')")[0]).toBeLessThan(free);
    game('state.edges.clear()');
  });
});

describe('Eckpunkte (Block 65)', () => {
  const tapAt = (b, fx, fy) => game(`(() => { setTool('${b}'); const q = toScreen(${fx}, ${fy}); return slotAt(q.x, q.y); })()`);
  it('schmale Deko rastet nah an einer Feldecke ein – genau auf der Ecke, zwischen zwei Feldern', () => {
    game("for (let x = 3; x <= 8; x++) state.tiles.set(x + ',5', { b: 'weg', lvl: 1, style: 'sand' }); recalc(); state.design = new Set(DESIGN.map(d => d.id)); state.res.metall = 50");
    expect(tapAt('laterne', 5.5, 5.5)).toEqual({ x: 6, y: 6, slot: 8 });
    expect(tapAt('laterne', 5.25, 5.5).slot).not.toBe(8);                           // zu weit weg: wie bisher
    expect(tapAt('bank', 5.5, 5.5).slot).not.toBe(8);                              // Bank bleibt auf ihren Plätzen
    expect(game("slotPos(6, 6, 8, 'laterne')")).toEqual([-0.5, -0.5]);
    expect(game("buildSmall('laterne', 6, 6, 8)")).toBe(true);
    expect(game("buildSmall('bank', 6, 5, 7)")).toBe(true);                       // Bank in der Seitenmitte daneben geht
    game("setTool('look')");
    expect(tapAt('look', 5.5, 5.5)).toEqual({ x: 6, y: 6, slot: 8 });             // Ansehen/Abreißen finden sie wieder
  });

  it('Ecken teilen: kein Ding in den vier Ecken-Plätzen daneben, keine Bank auf der Ecke, nicht an Gebäude', () => {
    game("state.design = new Set(DESIGN.map(d => d.id)); state.res.metall = 50");
    expect(game("buildSmall('laterne', 6, 6, 8)")).toBe(true);
    expect(game("smallError('blumentopf', 5, 5, 3)")).toMatch(/Ecke/);            // Ecke (+,+) von 5,5 zeigt auf den Punkt
    expect(game("smallError('blumentopf', 6, 6, 0)")).toMatch(/Ecke/);
    expect(game("smallError('blumentopf', 6, 6, 3)")).toBe(null);                 // andere Ecke frei
    expect(game("smallError('bank', 7, 7, 8)")).toMatch(/Schmales/);
    game("state.tiles.set('3,3', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("smallError('laterne', 4, 4, 8)")).toMatch(/Gebäude/);
    expect(game("placeError('haus', 6, 6)")).toMatch(/Ecke/);                    // Haus an die Laterne: nein
    expect(game("placeError('haus', 5, 5)")).toMatch(/Ecke/);                    // Grundfläche 5,5 hat die Ecke (6,6) unten
    expect(game("placeError('haus', 7, 7)")).toBe(null);
    expect(game("edgeError('zaun', 'a6,6')")).toMatch(/Ecke/);                   // Linie, die an dem Punkt endet
  });

  it('gespeichert, Rückgängig, Strom, Abreißen und Verschieben wie jede Deko', () => {
    game("state.design = new Set(DESIGN.map(d => d.id)); state.res.metall = 50; state.money = 1e6");
    expect(game("undoable(() => buildSmall('laterne', 6, 6, 8))")).toBe(true);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("postAt(6, 6).b")).toBe('laterne');
    game("state.tiles.set('7,3', { b: 'windrad', lvl: 1 }); recalc()");
    expect(game("T.rail.power.dark.has('6,6,8')")).toBe(false);
    game("pickUp(6, 6, 8)");
    expect(game("moving.kind")).toBe('deco');
    game("dropAt(7, 7, 8)");
    expect(game("[postAt(6, 6), postAt(7, 7) && postAt(7, 7).b]")).toEqual([null, 'laterne']);
    const m = game('state.money');
    game('removeSmall(7, 7, 8)');
    expect(game('postAt(7, 7)')).toBe(null);
    expect(game('state.money')).toBe(m + game('ITEMS.laterne.cost'));
  });
});
