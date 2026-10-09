const { loadGame, game } = require('./helpers/load-game');

// Block 156 (Nutzer: „wieso kann man Dekoelemente nicht exakt mittig auf ein Feld setzen?“): Platz 9 = Feldmitte. Nah der Mitte getippt
// rastet kleine Deko dort ein – nicht auf schmalen Wegen und Gebäudefeldern, keine Stützen; Mitte sperrt die Seitenmitten (und umgekehrt),
// Ecken bleiben frei. Auch oben auf Steinarkaden.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999; for (const d of DESIGN) state.design.add(d.id)');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); recalc(); resetUndo(); setTool('look'); rotManual = false; buildRot = 0");
  game('cam = state.cam; cam.z = 2; { const p = iso(5, 5); cam.x = p.x; cam.y = p.y; }');
});
const scr = (u, v) => game(`(() => { const p = toScreen(${u}, ${v}); return [p.x, p.y]; })()`);
const slotAtTile = (tool, u, v) => { const [sx, sy] = scr(u, v); return game(`(() => { setTool('${tool}'); const r = slotAt(${sx}, ${sy}); setTool('look'); return r; })()`); };

describe('Deko in der Feldmitte (Block 156)', () => {
  it('Tippen nah der Mitte rastet ein (Wiese) – Stütze, schmaler Weg und Ansehen ohne Deko nicht', () => {
    expect(slotAtTile('baum', 5.05, 4.95)).toEqual({ x: 5, y: 5, slot: game('CSLOT') });
    expect(slotAtTile('baum', 5.3, 5)).not.toEqual({ x: 5, y: 5, slot: game('CSLOT') });   // weiter weg: Seitenmitte
    expect(slotAtTile('stuetze', 5, 5).slot).not.toBe(game('CSLOT'));
    expect(slotAtTile('look', 5, 5).slot).not.toBe(game('CSLOT'));
    game("state.tiles.set('5,5', { b: 'weg', lvl: 1 }); recalc()");
    expect(slotAtTile('baum', 5, 5).slot).not.toBe(game('CSLOT'));
  });

  it('steht genau in der Mitte, Ecken bleiben frei, Seitenmitten gesperrt (und umgekehrt)', () => {
    expect(game("buildSmall('baum', 5, 5, CSLOT)")).toBe(true);
    expect(game("slotPos(5, 5, CSLOT, decosAt('5,5')[CSLOT])")).toEqual([0, 0]);
    for (const s of [0, 1, 2, 3]) expect(game(`buildSmall('blumentopf', 5, 5, ${s})`)).toBe(true);
    expect(game("smallError('blumentopf', 5, 5, 6)")).toBe('In der Mitte steht schon etwas');
    expect(game("buildSmall('bank', 6, 6, 4)")).toBe(true);
    expect(game("smallError('baum', 6, 6, CSLOT)")).toBe('An den Seiten steht schon etwas – die Mitte ist zu eng');
    expect(game("smallError('stuetze', 7, 7, CSLOT)")).toBe('Stützen an Ecken, Seitenmitten oder zwischen vier Felder');
    expect(game("SLOTS_FRONT.includes(CSLOT) && !SLOTS_BACK.includes(CSLOT)")).toBe(true);   // wird gezeichnet
  });

  it('schmaler Weg und Gebäude: nein; breiter Weg und Platz (2×2 Wege): ja', () => {
    game("state.tiles.set('5,5', { b: 'weg', lvl: 1 }); state.tiles.set('8,8', { b: 'weg', lvl: 1, wide: true }); state.tiles.set('3,3', { b: 'haus', lvl: 1 }); for (const [x, y] of [[10, 10], [11, 10], [10, 11], [11, 11]]) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1 }); recalc()");
    expect(game("smallError('laterne', 5, 5, CSLOT)")).toBe('Nicht mitten auf den Weg – die Mitte geht auf Plätzen und breiten Wegen');
    expect(game("smallError('laterne', 3, 3, CSLOT)")).toBe('Auf Gebäudefeldern nur an die Ecken');
    expect(game("smallError('laterne', 8, 8, CSLOT)")).toBe(null);
    expect(game("smallError('laterne', 10, 10, CSLOT)")).toBe(null);
  });

  it('Speichern/Laden behält die Mitte; Verschieben, Gruppe drehen und Abreißen nehmen sie mit', () => {
    game("buildSmall('baum', 5, 5, CSLOT); buildSmall('blumentopf', 5, 5, 0)");
    const back = game("(() => { const s = parseSave(JSON.parse(JSON.stringify(serialize()))); return new Map(s.decos).get('5,5').map(d => d && d.b); })()");
    expect(back[9]).toBe('baum');
    expect(back[0]).toBe('blumentopf');
    // einzeln verschieben: in die Mitte eines anderen Felds
    game("setTool('verschieben'); pickUp(5, 5, CSLOT); dropAt(9, 9, CSLOT); setTool('look')");
    expect(game("decosAt('9,9')[CSLOT].b")).toBe('baum');
    // Gruppe drehen: Mitte bleibt Mitte
    game("state.tiles.set('8,8', { b: 'weg', lvl: 1 }); recalc(); setTool('verschieben'); pickUpGroup(8, 8, 10, 9); rotateGroup(1)");   // mit Weg: eine Gruppe
    const placed = game("moving.items.filter(it => it.kind === 'deco').map(it => groupPlaced(it).slot)");
    expect(placed).toEqual([game('CSLOT')]);
    game("cancelMove(); setTool('look')");
    // Abreißen per Auswahl
    game("setTool('verschieben'); startPlan('rect', { x: 9, y: 9 }, { x: 9, y: 9 }, true); demolishSelection(); setTool('look')");
    expect(game("!!(decosAt('9,9') || [])[CSLOT]")).toBe(false);
  });

  it('oben auf Steinarkaden: Mitte per Tippen, zählt mit, sperrt die Seiten', () => {
    game("state.design.add('dach:form:arkaden'); state.paintNew.dach = { form: 3 }; for (const x of [4, 5, 6]) build('dach', x, 5, true); state.paintNew.dach = {}");
    const [sx, sy] = game("(() => { const p = toScreen(5.02, 5); return [p.x, p.y - ROOF_H * cam.z]; })()");
    expect(game(`roofTopAt(${sx}, ${sy})`)).toEqual({ x: 5, y: 5, slot: game('CSLOT') });
    expect(game("buildRoofTop('blumentopf', 5, 5, CSLOT)")).toBe(true);
    expect(game("[...roofTopAll()].map(([k, i]) => k + '|' + i)")).toEqual(['5,5|' + game('CSLOT')]);
    expect(game("roofTopError('laterne', 5, 5, 4)")).toBe('In der Mitte steht schon etwas');
    expect(game("roofTopSpot(5, 5, CSLOT, roofAt(5, 5).top[CSLOT])")).toEqual([0, 0]);
    const back = game("(() => { const s = parseSave(JSON.parse(JSON.stringify(serialize()))); return new Map(s.roofs).get('5,5').top.map(d => d && d.b); })()");
    expect(back[game('CSLOT')]).toBe('blumentopf');
  });
});
