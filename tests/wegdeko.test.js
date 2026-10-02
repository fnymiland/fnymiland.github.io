const { loadGame, game } = require('./helpers/load-game');

// Block 58: jede Deko darf auf Wege (auch über mehrere Felder, der Weg bleibt darunter); Gebäude ersetzen den Weg
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; undoStack.length = 0");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.album = new Set(NATURE.map(n => 'natur:' + n.id)); for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'kopf' }); recalc()");
});
const tile = k => game(`state.tiles.get('${k}')`);

describe('Deko auf Wegen', () => {
  it('Blumenbeet, Schmetterlingsgarten … dürfen auf den Weg, er bleibt darunter', () => {
    for (const b of ['blumen', 'schmetterlingsgarten', 'vogelbaum']) expect(game(`placeError('${b}', 9, 9)`), b).toBe(null);
    expect(game("build('blumen', 9, 9, true)")).toBe(true);
    expect(tile('9,9')).toMatchObject({ b: 'blumen', weg: 'kopf' });
  });

  it('große Deko über mehrere Wegfelder: alle Wege bleiben darunter, kommen beim Abreißen zurück, werden gezeichnet', () => {
    expect(game("build('seerosenteich', 9, 9, true)")).toBe(true);
    expect(tile('9,9')).toMatchObject({ b: 'seerosenteich', weg: 'kopf', wegs: { '1,0': 'kopf', '0,1': 'kopf', '1,1': 'kopf' } });
    expect(tile('10,10')).toBe(undefined);                                   // abgedeckt
    expect(game('wegAt(10, 10)')).toBe('kopf');
    expect(game('flatAt(10, 10).weg')).toBe('kopf');
    expect(game('isGate')).toBeTruthy();
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(tile('9,9').wegs).toEqual({ '1,0': 'kopf', '0,1': 'kopf', '1,1': 'kopf' });   // gespeichert
    game('demolish(9, 9)');
    for (const k of ['9,9', '10,9', '9,10', '10,10']) expect(tile(k)).toMatchObject({ b: 'weg', style: 'kopf' });
  });

  it('verschieben: die Wege bleiben liegen; Abbrechen deckt sie wieder zu; ablegen auf Wiese ohne Weg', () => {
    game("build('seerosenteich', 9, 9, true); setTool('verschieben'); pickUp(9, 9, 0)");
    for (const k of ['9,9', '10,9', '9,10', '10,10']) expect(tile(k)).toMatchObject({ b: 'weg' });
    game('cancelMove()');
    expect(tile('9,9').b).toBe('seerosenteich');
    expect(tile('10,10')).toBe(undefined);
    game("pickUp(9, 9, 0); dropAt(15, 15, 0)");
    expect(tile('15,15')).toMatchObject({ b: 'seerosenteich' });
    expect(tile('15,15').weg).toBe(undefined);
    expect(tile('15,15').wegs).toBe(undefined);
  });
});

describe('Gebäude ersetzen den Weg', () => {
  it('Haus auf einen Weg: der Weg verschwindet, die Taler kommen zurück; Rückgängig holt ihn wieder', () => {
    const m = game('state.money');
    game("undoable(() => build('haus', 9, 9))");
    expect(tile('9,9').b).toBe('haus');
    expect(tile('9,9').weg).toBe(undefined);
    expect(game('state.money')).toBe(m - game('ITEMS.haus.cost') + game('ITEMS.weg.cost'));
    game('undo()');
    expect(tile('9,9')).toMatchObject({ b: 'weg', style: 'kopf' });
  });

  it('großes Gebäude über mehrere Wegfelder; Deko in der Wegmitte muss erst weg', () => {
    expect(game("build('reihenhaus', 9, 9, true)")).toBe(true);
    const [fx, fy] = game("footprint('reihenhaus', 9, 9, state.tiles.get('9,9').rot).find(([x, y]) => x !== 9 || y !== 9)");
    expect(tile(fx + ',' + fy)).toBe(undefined);                           // der zweite Weg ist auch weg
    expect(game(`wegAt(${fx}, ${fy})`)).toBe(null);
    game("buildSmall('bank', 12, 12, 4)");
    expect(game("placeError('haus', 12, 12)")).toBe('Erst die kleine Deko vom Weg nehmen');
  });
});
