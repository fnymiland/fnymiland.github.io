const { loadGame, game } = require('./helpers/load-game');

// Block 66: Weg übers Wasser wird von selbst zur Brücke – gerade, vom Ufer aus, kurz ins Meer
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 1000; state.design = new Set(DESIGN.map(d => d.id))');
  game("for (let y = 3; y <= 12; y++) for (let x = 3; x <= 14; x++) { state.terra.set(x + ',' + y, x >= 7 && x <= 9 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('waterChanged(); rebuildCover(); recalc()');
});
const line = (style, a, b) => game(`(() => { chosenStyle.weg = '${style}'; setTool('weg'); startPlan('line', ${JSON.stringify(a)}, ${JSON.stringify(b)}, false); const r = planScan(plan); runPlan(); setTool('look'); return [r.n, r.firstErr]; })()`);
const tile = (x, y) => game(`state.tiles.get('${x},${y}') || null`);

describe('Wegbrücken (Block 66)', () => {
  it('Weg übers Wasser ziehen: drei Brückenfelder, Art nach Wegstil, Bewohner laufen drüber', () => {
    const m = game('state.money');
    expect(line('sand', { x: 5, y: 5 }, { x: 11, y: 5 })).toEqual([7, null]);
    for (const x of [7, 8, 9]) expect(tile(x, 5)).toMatchObject({ b: 'weg', bridge: true });
    expect(tile(6, 5).bridge).toBeUndefined();
    expect(game("bridgeKind(state.tiles.get('8,5'))")).toBe('holz');
    expect(m - game('state.money')).toBe(4 * game('ITEMS.weg.cost') + 3 * game('WEG_BRIDGE.holz.cost'));
    expect(game('walkable(8, 5)')).toBe(true);
    expect(game('walkable(8, 6)')).toBe(false);                                     // Wasser ohne Brücke
    line('asphalt', { x: 5, y: 8 }, { x: 11, y: 8 });
    expect(game("bridgeKind(state.tiles.get('8,8'))")).toBe('stein');
    expect(() => game("for (const P of ['ground', null]) { PASS = P; drawObject('weg', 200, 200, 1.4, 0, 8, 8, 1, state.tiles.get('8,8')); drawObject('weg', 200, 200, 1.4, 0, 7, 5, 1, state.tiles.get('7,5')); } PASS = null")).not.toThrow();
  });

  it('nur vom Ufer aus und nur gerade – keine Kurven oder Abzweige auf dem Wasser', () => {
    expect(game('placeError("weg", 8, 10)')).toMatch(/Ufer/);                        // mitten im Wasser ohne Nachbarn
    line('sand', { x: 5, y: 5 }, { x: 11, y: 5 });
    expect(game('placeError("weg", 8, 6)')).toMatch(/gerade/);                       // Abzweig von der Brücke aufs Wasser
    expect(line('sand', { x: 6, y: 9 }, { x: 8, y: 11 })[1]).toMatch(/gerade/);      // L-Form: Ecke auf dem Wasser
  });

  it('Art umstellen: alte voll zurück, neue bezahlt, gespeichert; Umfärben behält die Art; Abriss gibt alles zurück', () => {
    line('sand', { x: 5, y: 5 }, { x: 11, y: 5 });
    const m = game('state.money');
    expect(game("setBridgeKind(8, 5, 'rot')")).toBe(true);
    expect(game('state.money')).toBe(m + 3 * (game('WEG_BRIDGE.holz.cost') - game('WEG_BRIDGE.rot.cost')));   // ganze Brücke (66c)
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("bridgeKind(state.tiles.get('8,5'))")).toBe('rot');
    expect(game("(chosenStyle.weg = 'asphalt', build('weg', 7, 5, true), bridgeKind(state.tiles.get('7,5')))")).toBe('rot');   // Umfärben: bleibt, wie bezahlt
    const m2 = game('state.money');
    game('demolish(8, 5)');
    expect(game('state.money')).toBe(m2 + game('WEG_BRIDGE.rot.cost'));
    expect(game("placeError('kiosk', 9, 5)")).not.toBe(null);                         // keine Läden auf die Brücke
  });

  it('kurz ins Meer: höchstens ein paar Felder vor die Küste; Aufschütten macht wieder einen Weg', () => {
    const c = game(`(() => { for (let y = -40; y < 40; y++) for (let x = -40; x < 40; x++) if (ownedTile(x, y) && terrainAt(x, y) === 'grass' && !COVER.has(x + ',' + y) && [1, 2, 3, 4, 5, 6].every(i => isSea(x + i, y) && !ownedTile(x + i, y))) return [x, y]; })()`);
    const [n, err] = line('sand', { x: c[0], y: c[1] }, { x: c[0] + 6, y: c[1] });
    expect(err).toMatch(/Meer höchstens/);
    expect(game(`state.tiles.get('${c[0] + 1},${c[1]}').bridge`)).toBe(true);
    expect(n).toBeLessThan(7);
    game(`build('schuett', ${c[0] + 1}, ${c[1]}, true)`);
    expect(game(`state.tiles.get('${c[0] + 1},${c[1]}').bridge`)).toBeUndefined();
  });

  it('Farben (Block 66b): Bauwerk und Planken wählbar, gespeichert; Belag zeigt das Wegmuster', () => {
    line('sand', { x: 5, y: 5 }, { x: 11, y: 5 });
    game("openInfo(8, 5)");
    game("document.querySelector('#panel [data-brc=\"4\"]').click()");
    game("document.querySelector('#panel [data-brw=\"1\"]').click()");
    expect(game("state.tiles.get('8,5')")).toMatchObject({ brc: 4, brw: 1 });
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('8,5')")).toMatchObject({ brc: 4, brw: 1 });
    game("openInfo(8, 5); document.querySelector('#panel [data-brc=\"\"]').click()");
    expect(game("state.tiles.get('8,5').brc")).toBeUndefined();
    line('klinker', { x: 5, y: 8 }, { x: 11, y: 8 });
    for (const k of ['ziegel', 'stein', 'holz', 'rot']) {
      game(`setBridgeKind(8, 8, '${k}')`);
      expect(() => game("for (const P of ['ground', null]) { PASS = P; drawObject('weg', 200, 200, 1.4, 0, 8, 8, 1, state.tiles.get('8,8')); } PASS = null")).not.toThrow();
    }
  });

  it('Art und Farben gelten für die ganze Brücke; Verlängern übernimmt sie zum passenden Preis (66c)', () => {
    line('sand', { x: 5, y: 5 }, { x: 8, y: 5 });                                  // Brücke 7, 8 – noch nicht am anderen Ufer
    const m = game('state.money');
    expect(game("setBridgeKind(7, 5, 'rot')")).toBe(true);
    expect(game("[7, 8].map(x => bridgeKind(state.tiles.get(x + ',5')))")).toEqual(['rot', 'rot']);
    expect(game('state.money')).toBe(m + 2 * (game('WEG_BRIDGE.holz.cost') - game('WEG_BRIDGE.rot.cost')));
    game("setBridgeColor(8, 5, 'brc', 3)");
    expect(game("[7, 8].map(x => state.tiles.get(x + ',5').brc)")).toEqual([3, 3]);
    const m2 = game('state.money');
    line('sand', { x: 8, y: 5 }, { x: 11, y: 5 });                                 // weiter übers Wasser bis ans Ufer
    expect(game("state.tiles.get('9,5')")).toMatchObject({ bridge: true, brk: 'rot', brc: 3 });
    expect(m2 - game('state.money')).toBe(game('WEG_BRIDGE.rot.cost') + 2 * game('ITEMS.weg.cost'));
  });

  it('Belag direkt im Fenster wählen – für die ganze Brücke, die Art bleibt (66d)', () => {
    line('asphalt', { x: 5, y: 5 }, { x: 11, y: 5 });
    game("openInfo(8, 5)");
    expect(game("!!document.querySelector('#panel [data-brs=\"klinker\"]')")).toBe(true);
    const m = game('state.money');
    game("document.querySelector('#panel [data-brs=\"klinker\"]').click()");
    expect(game("[7, 8, 9].map(x => state.tiles.get(x + ',5').style)")).toEqual(['klinker', 'klinker', 'klinker']);
    expect(game("[7, 8, 9].map(x => bridgeKind(state.tiles.get(x + ',5')))")).toEqual(['stein', 'stein', 'stein']);   // bleibt Stein
    expect(game('state.money')).toBe(m - 3 * game('ITEMS.weg.cost'));
    expect(game("state.tiles.get('6,5').style")).toBe('asphalt');                     // Weg an Land bleibt
  });

  it('weit weg: Brücken (Weg und Schiene) kommen nie aus der Bodenkachel – sonst würden sie am Rand abgeschnitten (66e)', () => {
    line('sand', { x: 5, y: 5 }, { x: 11, y: 5 });
    expect(game("cachedPath(state.tiles.get('8,5'))")).toBe(false);
    expect(game("cachedPath(state.tiles.get('6,5'))")).toBe(true);                    // normaler Weg schon
    expect(game("cachedPath({ b: 'schiene', bridge: true })")).toBe(false);
    expect(game("cachedPath({ b: 'schiene' })")).toBe(true);
  });
});
