const { loadGame, game } = require('./helpers/load-game');

// Block 77: Wegform – ganz breit, eckige Kurve, Enden bis ans Gebäude bzw. an den Rand
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e7");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("wegShape.wide = false; wegShape.sq = false; chosenStyle.weg = 'sand'; recalc()");
});
const W = (x, y, o = {}) => game(`state.tiles.set('${x},${y}', ${JSON.stringify({ b: 'weg', lvl: 1, style: 'platten', ...o })})`);
const ends = (x, y) => game(`(() => { const t = state.tiles.get('${x},${y}'); return pathEnds(${x}, ${y}, t, pathArms(${x}, ${y})); })()`);
const fills = (x, y) => game(`(() => {
  const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
  const pts = []; const lt = g.lineTo; g.lineTo = (a, b) => pts.push(Math.round(a) + ',' + Math.round(b));
  try { drawPath(100, 100, 1.5, ${x}, ${y}, state.tiles.get('${x},${y}')); } finally { delete g.fillStyle; delete g.lineTo; }
  return seen.join('|') + '#' + pts.join(';');
})()`);

describe('Wegform (Block 77)', () => {
  it('Sackgasse vor einem Gebäude läuft bis an die Wand; vorbei führende Wege nicht; „rund“/„bis an den Rand“ umstellbar', () => {
    W(10, 8); W(10, 9); game("state.tiles.set('10,11', { b: 'haus', lvl: 1, rot: 0 }); recalc()");
    W(10, 10); game('recalc()');
    expect(ends(10, 10)).toEqual([[0, 1]]);                                       // zum Haus
    expect(ends(10, 9)).toEqual([]);                                              // mitten im Weg
    game("state.tiles.get('10,10').end = 'rund'");
    expect(ends(10, 10)).toEqual([]);
    expect(ends(10, 8)).toEqual([]);                                              // anderes Ende: nichts davor
    game("state.tiles.get('10,8').end = 'rand'");
    expect(ends(10, 8)).toEqual([[0, -1]]);                                       // gerade weiter bis an die Kante
    W(14, 8); game("state.tiles.set('15,8', { b: 'haus', lvl: 1, rot: 0 }); recalc()");
    expect(ends(14, 8)).toEqual([[1, 0]]);                                        // einzelnes Feld: zum Haus daneben
  });

  it('Bauen: Form aus der Musterleiste; Umstellen über einen alten Weg kostet nichts; gespeichert', () => {
    game("wegShape.wide = true; build('weg', 8, 8)");
    expect(game("state.tiles.get('8,8').wide")).toBe(true);
    game("wegShape.wide = false; build('weg', 9, 8)");
    expect(game("!!state.tiles.get('9,8').wide")).toBe(false);
    const m = game('state.money');
    game("chosenStyle.weg = 'sand'; wegShape.sq = true; build('weg', 9, 8)");
    expect(game("state.tiles.get('9,8').sq")).toBe(true);
    expect(game('state.money')).toBe(m);                                          // nur die Form: kostenlos
    expect(game("planCheck('weg', 9, 8)")).toEqual({ same: true });
    game('wegShape.sq = false');
    expect(game("planCheck('weg', 9, 8)")).toEqual({ cost: 0, mat: {} });
    game("state.tiles.get('9,8').end = 'rand'");
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("[state.tiles.get('8,8').wide, state.tiles.get('9,8').sq, state.tiles.get('9,8').end]")).toEqual([true, true, 'rand']);
  });

  it('Zeichnen: breit, eckig und Enden sehen anders aus; Deko-Platz außen an der Kurve nur bei runder Kurve', () => {
    W(10, 10); W(11, 10); W(10, 11); game('recalc()');
    const round = fills(10, 10);
    expect(game('curveSlot(10, 10)')).not.toBe(null);
    game("state.tiles.get('10,10').sq = true");
    expect(fills(10, 10)).not.toBe(round);
    expect(game('curveSlot(10, 10)')).toBe(null);
    game("state.tiles.get('10,10').wide = true; delete state.tiles.get('10,10').sq");
    expect(fills(10, 10)).not.toBe(round);
    for (const style of ['sand', 'asphalt', 'tritt', 'platten', 'klinker']) {      // jedes Muster in jeder Form
      for (const o of [{}, { wide: true }, { sq: true }, { end: 'rand' }]) { W(16, 16, { style, ...o }); W(17, 16, { style }); W(16, 17, { style }); game('recalc()'); expect(() => fills(16, 16)).not.toThrow(); }
    }
  });

  it('Wegfenster: Form, Kurve (nur in Kurven), Ende (nur an Enden) – mit Rückgängig', () => {
    W(10, 10); W(11, 10); W(10, 11); W(13, 13); game('recalc(); openInfo(10, 10)');
    expect(game("!!document.querySelector('#panel [data-wegf=\"sq:1\"]')")).toBe(true);
    expect(game("!!document.querySelector('#panel [data-wegf=\"end:rund\"]')")).toBe(false);
    game("document.querySelector('#panel [data-wegf=\"sq:1\"]').click()");
    expect(game("state.tiles.get('10,10').sq")).toBe(true);
    game('undo()');
    expect(game("!!state.tiles.get('10,10').sq")).toBe(false);
    game('openInfo(13, 13)');
    game("document.querySelector('#panel [data-wegf=\"end:rand\"]').click()");
    expect(game("state.tiles.get('13,13').end")).toBe('rand');
    game("document.querySelector('#panel [data-wegf=\"wide:1\"]').click()");
    expect(game("state.tiles.get('13,13').wide")).toBe(true);
    expect(game("!!document.querySelector('#panel [data-wegf=\"end:rund\"]')")).toBe(false);   // breit: kein Ende nötig
  });
});

describe('Gartenweg und Seiten bis an den Rand (Block 78)', () => {
  it('Gartenweg nur, wenn die Tür zu einem Weg zeigt; im Hausfenster abschaltbar; gespeichert', () => {
    W(10, 10); game("state.tiles.set('10,11', { b: 'haus', lvl: 1, rot: 3 }); state.tiles.set('11,11', { b: 'haus', lvl: 1, rot: 0 }); recalc()");
    expect(game("gardenPath(state.tiles.get('10,11'), 10, 11)")).toEqual({ d: [0, -1], style: 'platten' });   // Tür nach −y, dort der Weg
    expect(game("gardenPath(state.tiles.get('11,11'), 11, 11)")).toBe(null);                                // Tür zeigt nicht zum Weg
    game('openInfo(10, 11)');
    game("document.querySelector('#panel [data-zug]').click()");
    expect(game("state.tiles.get('10,11').zug")).toBe(false);
    expect(game("gardenPath(state.tiles.get('10,11'), 10, 11)")).toBe(null);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('10,11').zug")).toBe(false);
    game('undo()');
  });
  it('Seite zu einem Gebäude füllt automatisch; je Seite umstellbar (automatisch → Rand → schmal); gespeichert', () => {
    W(9, 10); W(10, 10); W(11, 10); game("state.tiles.set('10,11', { b: 'haus', lvl: 1, rot: 0 }); recalc()");
    const fill = () => game("sideFill(10, 10, state.tiles.get('10,10'), pathArms(10, 10)).map(d => d.join())");
    expect(fill()).toEqual(['0,1']);
    expect(game("sideFill(9, 10, state.tiles.get('9,10'), pathArms(9, 10))")).toEqual([]);   // daneben kein Gebäude
    game('openInfo(10, 10)');
    expect(game("[...document.querySelectorAll('#panel [data-wegs]')].map(b => b.dataset.wegs).sort()")).toEqual(['0,-1', '0,1']);
    game("document.querySelector('#panel [data-wegs=\"0,-1\"]').click()");               // automatisch → bis an den Rand
    expect(fill().sort()).toEqual(['0,-1', '0,1']);
    game("document.querySelector('#panel [data-wegs=\"0,1\"]').click()");                // zum Haus: automatisch → Rand (bleibt gefüllt)
    game("document.querySelector('#panel [data-wegs=\"0,1\"]').click()");                // → schmal
    expect(fill()).toEqual(['0,-1']);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('10,10').fs")).toEqual({ '0,-1': true, '0,1': false });
    game("state.tiles.get('10,10').wide = true");
    expect(fill()).toEqual([]);                                                              // breit: ohnehin bis an den Rand
  });
});
