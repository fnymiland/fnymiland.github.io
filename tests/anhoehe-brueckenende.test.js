const { loadGame, game } = require('./helpers/load-game');

// 160c D4 (luecken B3): keine Anhöhe am Ende einer Wasserbrücke längs ihrer Achse – sonst endete der Bogen auf Höhe 0 an der Wand
// und die Brücke verlöre den Anschluss ans Wegenetz. Neben der Brücke (quer) bleibt die Anhöhe erlaubt.
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; setTool('look'); state.design = new Set(DESIGN.map(d => d.id)); state.techs.add('terraform')");
  game("for (let y = 2; y <= 40; y++) for (let x = 2; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.owned.add(chunkOf(x, y)); } state.edges.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear()");
});
// Kanal quer zur Brücke: Wasser u0 … u0+N−1, Weg davor/danach (ax 1: Nord-Süd)
const kanal = (u0, v0, N, { ax = 0 } = {}) => game(`(() => {
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v;
  for (let v = ${v0} - 2; v <= ${v0} + 2; v++) for (let u = ${u0} - 3; u <= ${u0} + ${N} + 2; u++) state.terra.set(K(u, v), u >= ${u0} && u < ${u0} + ${N} ? 'water' : 'grass');
  for (let u = ${u0} - 2; u < ${u0}; u++) state.tiles.set(K(u, ${v0}), { b: 'weg', lvl: 1, style: 'sand', lauf: ${ax} });
  for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 1; u++) state.tiles.set(K(u, ${v0}), { b: 'weg', lvl: 1, style: 'sand', lauf: ${ax} });
  for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(K(u, ${v0}), { b: 'weg', lvl: 1, style: 'sand', bridge: true, lauf: ${ax} });
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const err = (x, y) => game(`hillRaiseError(${x}, ${y}, true)`);

describe('Anhöhe am Ende einer Wasserbrücke (160c D4)', () => {
  it('Ost-West: beide Enden gesperrt (Bogen und flach), quer daneben frei, eins weiter frei', () => {
    kanal(10, 5, 3); kanal(10, 20, 1);
    expect(game('[!!wbAt(10, 5).A, !!wbAt(10, 20).A]')).toEqual([true, false]);
    for (const [x, y] of [[9, 5], [13, 5], [9, 20], [11, 20]]) expect(err(x, y), x + ',' + y).toMatch(/Brücke/);
    for (const [x, y] of [[8, 5], [14, 5], [9, 4], [9, 6], [13, 6]]) expect(err(x, y), x + ',' + y).toBe(null);
  });
  it('Nord-Süd: Enden längs y gesperrt, seitlich frei', () => {
    kanal(10, 30, 3, { ax: 1 });
    for (const [x, y] of [[30, 9], [30, 13]]) expect(err(x, y), x + ',' + y).toMatch(/Brücke/);
    for (const [x, y] of [[29, 9], [31, 13], [30, 8]]) expect(err(x, y), x + ',' + y).toBe(null);
  });
  it('mit dem Werkzeug: raiseHill baut dort nichts und kostet nichts', () => {
    kanal(10, 5, 3);
    const r = game("(() => { const m = state.money; const ok = raiseHill(9, 5); return [ok, !!hillAt(9, 5), state.money === m]; })()");
    expect(r).toEqual([false, false, true]);
  });
  it('Rückgängig: eine abgetragene Anhöhe kommt nicht zurück, wenn dort inzwischen eine Wasserbrücke endet', () => {
    expect(game('raiseHill(9, 5)')).toBe(true);
    game("openHillInfo(9, 5); document.getElementById('p-del').click()");                // abtragen über das Fenster (eigener ↶-Schritt)
    expect(game("state.hills.has('9,5')")).toBe(false);
    kanal(10, 5, 3);
    expect(game('undo()')).toBe(false);
    expect(game("state.hills.has('9,5')")).toBe(false);
  });
  it('Gegenrichtung: eine Brücke übers Wasser endet nie an einer Anhöhe (auch nicht vom anderen Ufer her gezogen)', () => {
    game(`for (let y = 3; y <= 7; y++) for (let x = 10; x <= 12; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc()`);
    expect(game('raiseHill(9, 5)')).toBe(true);
    const r = game(`(() => { chosenStyle.weg = 'sand'; setTool('weg'); startPlan('line', { x: 14, y: 5 }, { x: 10, y: 5 }, false); runPlan(); setTool('look'); return ['10,5', '11,5', '12,5', '13,5'].map(k => !!state.tiles.get(k)); })()`);
    expect(r).toEqual([false, true, true, true]);                                       // das letzte Feld vor der Anhöhe nicht
    expect(game("placeError('weg', 10, 5)")).toMatch(/Anhöhe/);
    expect(game("placeError('weg', 10, 4)")).not.toMatch(/Anhöhe/);                      // quer daneben: andere Gründe, nie die Anhöhe
  });
});

