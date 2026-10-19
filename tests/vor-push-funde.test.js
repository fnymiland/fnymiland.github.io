const { loadGame, game } = require('./helpers/load-game');

// Prüfung vor dem Push (19.10.2026, Prüfer Brücken 160c): (1) Fähren, die nach dem Update an einer flachen Brücke hängen bleiben,
// meldet das Spiel einmal; (2) Gleisbrücke mit gekauftem, ausgeschaltetem Licht verlängern: das neue Feld bezahlt das Licht mit
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000");
  game("for (let y = 0; y <= 40; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); recalc()");
});

describe('Fähren nach dem Update: flache Brücke sperrt – einmal melden', () => {
  // ein Wasserstreifen x 11, darüber ein 1-Feld-Steg (Weg 10–12 auf y 6): nach der neuen Regel zu niedrig für Boote
  const steg = () => game(`(() => { for (let y = 3; y <= 9; y++) state.terra.set('11,' + y, 'water');
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
    chosenStyle.weg = 'sand'; for (const x of [10, 12, 11]) build('weg', x, 6, true); recalc(); })()`);
  const mitFaehre = fn => game(`(() => { const sr = seaRoutesNow; seaRoutesNow = () => new Set(seaCross(11, 6) === 'block' ? [] : ['f:0,0|0,2']);
    for (const k of ['0,0', '0,2']) state.tiles.set(k, { b: 'bootssteg', lvl: 1 });
    try { return (${fn})(); } finally { seaRoutesNow = sr; } })()`);
  it('alte Regel ging durch, neue nicht: als verloren erkannt; Prüfung nur einmal je Spielstand', () => {
    steg();
    expect(game('seaCross(11, 6)')).toBe('block');
    expect(mitFaehre('() => seaFlatLost()')).toEqual(['f:0,0|0,2']);
    expect(game('seaCross(11, 6)')).toBe('block');                                  // danach wieder die neue Regel
    game('state.seaFlatSeen = false');
    expect(mitFaehre('() => seaFlatCheck()')).toEqual(['f:0,0|0,2']);
    expect(game('state.seaFlatSeen')).toBe(true);
    expect(mitFaehre('() => seaFlatCheck()')).toEqual([]);                          // nie zweimal
  });
  it('Meldung nennt die Fähre und was man tun kann; neue Spiele prüfen nicht, alte Stände schon', () => {
    game('announceSeaFlat(["f:0,0|0,2"])');
    const txt = game("document.getElementById('modal-card').textContent");
    game('closeModal()');
    expect(txt).toMatch(/bögen/i); expect(txt).toMatch(/↔/);
    expect(game('newState().seaFlatSeen')).toBe(true);
    const d = game('JSON.parse(JSON.stringify(serialize()))'); delete d.seaFlatSeen;
    expect(game(`parseSave(${JSON.stringify(d)}).seaFlatSeen`)).toBe(false);
  });
});

describe('Gleisbrücke verlängern: ausgeschaltetes Licht wird mitbezahlt', () => {
  const bau = () => game(`(() => {
    for (let y = 0; y <= 9; y++) for (let x = 2; x <= 12; x++) state.terra.set(x + ',' + y, 'water');
    for (let x = 0; x <= 8; x++) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, ...(x >= 2 ? { bridge: true } : {}) });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
  it('neues Feld zahlt so viel wie das Nachbarfeld mit Licht (aus = gekauft)', () => {
    bau();
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'kaufen' })")).toBe(true);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'aus' })")).toBe(true);
    expect(game("state.tiles.get('8,5').brl")).toBe('aus');
    game("state.techs.add('bahn')");
    expect(game("placeError('schiene', 9, 5) || build('schiene', 9, 5, true)")).toBe(true);
    const neu = game("brPaid(state.tiles.get('9,5'), 'gleis')"), alt = game("brPaid(state.tiles.get('8,5'), 'gleis')");
    expect(neu).toEqual(alt);
  });
});
