const { loadGame, game } = require('./helpers/load-game');

// Block 27a/b: Die Welt endet nicht mehr – aufschütten geht überall, aber das Meer wird nach außen tiefer und teurer
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 999');
});
// Landstreifen von der Heimatküste (y = 3) bis x1 aufschütten, ohne zu bezahlen
const strip = x1 => game(`(() => { let x = 2; while (ownedTile(x + 1, 3) && !isSea(x + 1, 3)) x++;
  for (let i = x + 1; i <= ${x1}; i++) { claimTile(i, 3); state.terra.set(i + ',3', 'grass'); } waterChanged(); growWorld(); recalc(); return x; })()`);

describe('Welt ohne Rand', () => {
  it('am alten Rand geht es weiter: aufschütten erlaubt, die Welt wächst mit', () => {
    const edge = game('(WORLD_BASE.cMax + 1) * CHUNK');                 // erstes Feld hinter dem alten Rand
    strip(edge - 1);
    expect(game(`claimable(${edge}, 3)`)).toBe(true);
    expect(game(`build('schuett', ${edge}, 3, true)`)).toBe(true);
    expect(game(`inWorld(${edge + 12}, 3)`)).toBe(true);                // ein Rand Meer kommt dazu
    expect(game('WORLD.cMax')).toBeGreaterThan(game('WORLD_BASE.cMax'));
  });

  it('neues Spiel: die Welt ist wieder so groß wie am Anfang', () => {
    strip(game('(WORLD_BASE.cMax + 3) * CHUNK'));
    game('startNew()');
    expect(game('[WORLD.cMin, WORLD.cMax]')).toEqual(game('[WORLD_BASE.cMin, WORLD_BASE.cMax]'));
  });

  it('die Kamera kommt bis zum neuen Land', () => {
    const far = game('(WORLD_BASE.cMax + 4) * CHUNK');
    strip(far);
    game(`jumpTo(${far}, 3)`);
    const want = game(`iso(${far}, 3)`), cam = game('[cam.x, cam.y]');
    expect(Math.hypot(cam[0] - want.x, cam[1] - want.y)).toBeLessThan(5);
  });

  it('Seewege weit draußen werden gefunden (Suche nur um Start und Ziel)', () => {
    const x = game('(WORLD_BASE.cMax + 6) * CHUNK');
    strip(x);
    const r = game(`seaPath([${x - 20}, 12], [${x - 20}, -6])`);
    expect(r).not.toBe(null);
    expect(r.len).toBeGreaterThan(18);                                  // um den Landstreifen herum
  });
});

describe('Tiefes Wasser', () => {
  it('Tiefe: an der Küste 0, weiter draußen mehr', () => {
    expect(game('seaDepth(ISLAND.cx, ISLAND.cy)')).toBe(0);
    const near = game('seaDepth(ISLAND.cx + ISLAND.r + 3, ISLAND.cy)'), far = game('seaDepth(ISLAND.cx - 200, ISLAND.cy)');
    expect(near).toBeLessThan(6);
    expect(far).toBeGreaterThan(100);
  });

  it('Aufschütten kostet an der Küste 60 Taler, im tiefen Meer ein Vielfaches', () => {
    expect(game('costOf("schuett", ISLAND.cx + ISLAND.r + 2, ISLAND.cy).cost')).toBe(60);
    expect(game('costOf("schuett", ISLAND.cx - 100, ISLAND.cy).cost')).toBeGreaterThan(6000);
    const a = game('costOf("schuett", ISLAND.cx - 60, ISLAND.cy).cost'), b = game('costOf("schuett", ISLAND.cx - 80, ISLAND.cy).cost');
    expect(b).toBeGreaterThan(a);
    expect(game('costOf("schuett", 3, 3).cost')).toBe(60);             // Teiche auf der Insel: wie immer
  });

  it('beim Aufschütten wird der tiefe Preis bezahlt', () => {
    const edge = game('(WORLD_BASE.cMax + 1) * CHUNK');
    strip(edge - 1);
    const price = game(`costOf('schuett', ${edge}, 3).cost`), m0 = game('state.money');
    expect(price).toBeGreaterThan(60);
    game(`build('schuett', ${edge}, 3, true)`);
    expect(game('state.money')).toBe(m0 - price);
  });

  it('das Wasser wird nach außen dunkler, Land bleibt hell', () => {
    expect(game('depthAlpha(ISLAND.cx + ISLAND.r + 2, ISLAND.cy)')).toBe(0);
    expect(game('depthAlpha(ISLAND.cx - 150, ISLAND.cy)')).toBeGreaterThan(0.2);
    const x = game('(WORLD_BASE.cMax + 3) * CHUNK');
    strip(x);
    expect(game(`depthAlpha(${x}, 3)`)).toBe(0);                        // aufgeschüttet
  });
});
