const { loadGame, game } = require('./helpers/load-game');

// Block 136: Parkeisenbahn – schmales Gleis als Rundkurs (Wiese, Park, Freizeitpark, über Wege), Station hinein, Zug fährt im Kreis
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 24; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
});
const line = (a, b) => game(`(() => { setTool('pb_gleis'); const info = planScan({ kind: 'line', tool: 'pb_gleis', a: ${JSON.stringify(a)}, b: ${JSON.stringify(b)} }); for (const [, , run] of info.order) run(); setTool('look'); return info.firstErr; })()`);
const loop = () => { for (const [a, b] of [[{ x: 4, y: 5 }, { x: 12, y: 5 }], [{ x: 12, y: 5 }, { x: 12, y: 10 }], [{ x: 12, y: 10 }, { x: 4, y: 10 }], [{ x: 4, y: 10 }, { x: 4, y: 5 }]]) expect(line(a, b)).toBe(null); };

describe('Parkeisenbahn (Block 136)', () => {
  it('Rundkurs ziehen, Station aufs Gleis setzen (Gleis wird Station, nur der Unterschied kostet) – dann fährt sie', () => {
    loop();
    expect(game('PB_RINGS.length')).toBe(0);                                          // ohne Station: fährt nicht
    const m = game('state.money');
    expect(game("build('pb_station', 7, 10)")).toBe(true);
    expect(game('state.money')).toBe(m - (game('ITEMS.pb_station.cost') - game('ITEMS.pb_gleis.cost')));
    expect(game("[PB_RINGS.length, PB_RINGS[0].n, PB_RINGS[0].ring[0]]")).toEqual([1, 26, '7,10']);
  });
  it('quer über einen Weg: der Weg bleibt darunter (Bahnübergang), Bewohner können weiter drüber', () => {
    game("chosenStyle.weg = 'sand'; for (let y = 2; y <= 14; y++) build('weg', 8, y)");
    loop();
    expect(game("[state.tiles.get('8,5').b, state.tiles.get('8,5').weg]")).toEqual(['pb_gleis', 'sand']);
    expect(game('wegAt(8, 5)')).toBe('sand');
  });
  it('der Zug fährt im Kreis und hält an der Station; Fahrgäste sind echte Bewohner', () => {
    loop(); game("build('pb_station', 7, 10); recalc(); pbRuns.clear(); stepParkTrains(0.01)");
    const r = () => game('pbRuns.get(PB_RINGS[0].key)');
    game('for (let i = 0; i < 40; i++) stepParkTrains(0.1)');                            // Wartezeit vorbei, unterwegs
    expect(r().s).toBeGreaterThan(0.5);
    const back = game(`(() => { const r = pbRuns.get(PB_RINGS[0].key); for (let i = 0; i < 600; i++) { stepParkTrains(0.1); if (r.wait > 0) return [i, r.s]; } return null; })()`);
    expect(back && back[1]).toBe(0);                                                  // nach einer Runde: Halt genau an der Station
    expect(back[0]).toBeGreaterThan(250);                                             // ~26 Felder bei 0,8 Feldern/s
    const cars = game('parkTrainCars()');
    expect(cars.map(c => c.car)).toEqual(['lok', 'wagen', 'wagen', 'wagen']);
    expect(cars.every(c => Number.isFinite(c.px) && Number.isFinite(c.py) && Math.abs(c.du) + Math.abs(c.dv) > 0.9)).toBe(true);
    const kinds = game('walkers.map(w => w.kind)');
    for (const p of game('pbRuns.get(PB_RINGS[0].key).pax').filter(Boolean)) if (kinds.length) expect(kinds).toContain(p.kind);
  });
  it('Zug wählen: Straßenbahn und Mini-Zug in der Kunstakademie; alle Züge zeichnen ohne Fehler (nah, weit, fahrend, wartend)', () => {
    expect(game("!!DESIGN_BY_ID['pb_station:form:tram'] && !!DESIGN_BY_ID['pb_station:form:mini']")).toBe(true);
    loop(); game("build('pb_station', 7, 10); recalc()");
    for (const form of [0, 1, 2]) {
      game(`state.tiles.get('7,10').form = ${form}; recalc(); pbRuns.clear(); stepParkTrains(0.01); for (let i = 0; i < 60; i++) stepParkTrains(0.1)`);
      expect(game('parkTrainCars()[0].model')).toBe(['bimmel', 'tram', 'mini'][form]);
      for (const z of [2, 0.6]) game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(8, 7); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); })()`);
    }
    game("state.tiles.delete('4,5'); recalc(); (() => { cam.z = 2; render(1e6); })()");   // Ring offen: kein Zug
    expect(game('PB_RINGS.length')).toBe(0);
  });
  it('Nachbesserung: Gleis liegt flach im Bodenbild (Zug versinkt nicht), Zugwechsel wirkt sofort, ohne Rundkurs kein wartender Zug', () => {
    loop(); game("build('pb_station', 7, 10); recalc(); pbRuns.clear(); stepParkTrains(0.01)");
    expect(game("cachedPath(state.tiles.get('6,5')) && cachedPath(state.tiles.get('7,10'))")).toBe(true);
    const parts = game(`(() => { const out = []; const d = drawParkTrack; drawParkTrack = (...a) => { out.push(a[7]); return d(...a); };
      try { PASS = 'object'; drawObject('pb_station', 0, 0, 1, 0, 7, 10, 1, state.tiles.get('7,10')); PASS = null; drawFlat(0, 0, 1, 7, 10, state.tiles.get('7,10')); } finally { drawParkTrack = d; PASS = null; } return out; })()`);
    expect(parts).toEqual(['station', 'track']);                                     // mit den Gebäuden nur Bahnsteig und Dach
    game("state.tiles.get('7,10').form = 2; stepParkTrains(0.01)");                    // wie im Fenster umgestellt (ohne recalc)
    expect(game('parkTrainCars()[0].model')).toBe('mini');
    const calls = game(`(() => { let n = 0; const d = pbTrainAt; pbTrainAt = () => { n++; }; try { drawObject('pb_station', 0, 0, 1, 0, 7, 10, 1, state.tiles.get('7,10')); drawObject('pb_station', 0, 0, 1, 0, 1e6, 1e6, 1, { b: 'pb_station', form: 1 }); } finally { pbTrainAt = d; } return n; })()`);
    expect(calls).toBe(1);                                                             // nur im Vorschaubild der Zugwahl
  });
});
