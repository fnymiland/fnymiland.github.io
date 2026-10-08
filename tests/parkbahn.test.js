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
    const r = () => game('pbRuns.get(PB_RINGS[0].key).trains[0]');
    game('for (let i = 0; i < 40; i++) stepParkTrains(0.1)');                            // Wartezeit vorbei, unterwegs
    expect(r().s).toBeGreaterThan(0.5);
    const back = game(`(() => { const r = pbRuns.get(PB_RINGS[0].key).trains[0]; for (let i = 0; i < 600; i++) { stepParkTrains(0.1); if (r.wait > 0) return [i, r.s]; } return null; })()`);
    expect(back && back[1]).toBe(0);                                                  // nach einer Runde: Halt genau an der Station
    expect(back[0]).toBeGreaterThan(250);                                             // ~26 Felder bei 0,8 Feldern/s
    const cars = game('parkTrainCars()');
    expect(cars.map(c => c.car)).toEqual(['lok', 'wagen', 'wagen', 'wagen']);
    expect(cars.every(c => Number.isFinite(c.px) && Number.isFinite(c.py) && Math.abs(c.du) + Math.abs(c.dv) > 0.9)).toBe(true);
    const kinds = game('walkers.map(w => w.kind)');
    for (const p of game('pbRuns.get(PB_RINGS[0].key).trains[0].pax').filter(Boolean)) if (kinds.length) expect(kinds).toContain(p.kind);
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
  it('mehrere Züge (Block 136e): im Stationsfenster „+ Zug“, Modell je Zug, entfernen gibt Geld zurück; Züge halten Abstand', () => {
    loop(); game("build('pb_station', 7, 10); build('pb_station', 10, 5); recalc(); pbRuns.clear(); stepParkTrains(0.01)");
    expect(game('pbForms(PB_RINGS[0])')).toEqual([0]);                                   // einer ist immer dabei
    game("openInfo(10, 5)");                                                             // Fenster der zweiten Station: dieselbe Strecke
    expect(game("document.querySelector('#panel .label') && [...document.querySelectorAll('#panel .label')].some(l => /Züge auf dieser Strecke \\(1\\)/.test(l.textContent))")).toBe(true);
    const m = game('state.money');
    game("document.querySelector('#panel [data-pbadd]').click()");
    expect(game('pbForms(PB_RINGS[0])')).toEqual([0, 0]);
    expect(game('state.money')).toBe(m - game('PB_ZUG_COST'));
    game("state.design.add('pb_station:form:mini'); openInfo(10, 5); document.querySelector('#panel [data-pbm=\"1,2\"]').click()");
    expect(game('pbForms(PB_RINGS[0])')).toEqual([0, 2]);
    game('stepParkTrains(0.01)');
    expect(game('parkTrainCars().map(c => c.model)')).toEqual(['bimmel', 'bimmel', 'bimmel', 'bimmel', 'mini', 'mini', 'mini', 'mini', 'mini']);
    // lange fahren: nie zu dicht auf (Heck des vorderen + 1 Feld), beide kommen voran
    const ok = game(`(() => { const L = pbRuns.get(PB_RINGS[0].key).trains, R = PB_RINGS[0], s0 = L.map(r => r.s), moved = [0, 0];
      for (let i = 0; i < 3000; i++) { const before = L.map(r => r.s); stepParkTrains(0.05); L.forEach((r, j) => { moved[j] += ((r.s - before[j]) % R.n + R.n) % R.n; });
        for (const r of L) if (pbFree(R, L, r) < -1e-6) return 'zu nah bei ' + i; }
      return moved.every(v => v > 2 * R.n) || moved; })()`);
    expect(ok).toBe(true);
    // Platz: so viele, wie die Strecke trägt
    for (let i = 0; i < 20; i++) game('pbBuyTrain(PB_RINGS[0])');
    const n = game('pbForms(PB_RINGS[0]).length');
    expect(n).toBeGreaterThan(3); expect(game('pbRoom(PB_RINGS[0], pbForms(PB_RINGS[0]))')).toBe(true);
    for (let i = 0; i < 400; i++) game('stepParkTrains(0.1)');                       // voll besetzt: kein Stillstand
    expect(game('pbRuns.get(PB_RINGS[0].key).trains.every(r => pbFree(PB_RINGS[0], pbRuns.get(PB_RINGS[0].key).trains, r) > -1e-6)')).toBe(true);
    // entfernen: Geld zurück, die anderen fahren weiter
    const m2 = game('state.money');
    expect(game('pbSellTrain(PB_RINGS[0], 1)')).toBe(true);
    expect(game('state.money')).toBe(m2 + game('PB_ZUG_COST'));
    expect(game('pbForms(PB_RINGS[0]).length')).toBe(n - 1);
    // Station mit den Zügen abreißen: Züge wandern zur anderen Station
    const holder = game("PB_RINGS[0].key");
    const other = holder === '7,10' ? [10, 5] : [7, 10], [hx, hy] = holder.split(',').map(Number);
    game(`demolish(${hx}, ${hy}); state.money = 1e9; build('pb_gleis', ${hx}, ${hy}); recalc()`);
    expect(game('PB_RINGS.length')).toBe(1);
    expect(game('pbForms(PB_RINGS[0]).length')).toBe(n - 1);
    expect(game(`state.tiles.get('${other.join(',')}').pbz.length`)).toBe(n - 1);
    // letzte Station weg: die gekauften gibt es zurück
    const m3 = game('state.money');
    game(`demolish(${other[0]}, ${other[1]})`);
    expect(game('state.money') - m3).toBeGreaterThanOrEqual((n - 2) * game('PB_ZUG_COST'));
  });
  it('Wagen kurz vor einer Station werden nach ihr gezeichnet – sie steht hinter dem Gleis (Block 136f)', () => {
    loop(); game("build('pb_station', 12, 8); build('pb_station', 8, 10); recalc(); pbWrite(PB_RINGS[0], [1]); pbRuns.clear(); stepParkTrains(0.01)");
    for (const st of ['12,8', '8,10']) {
      const bad = game(`(() => { const R = PB_RINGS[0], T = pbRuns.get(R.key).trains[0], i = R.ring.indexOf('${st}'), [sx, sy] = '${st}'.split(',').map(Number), out = [];
        const dt = drawParkTrack, dc = drawParkCar;
        drawParkTrack = (...a) => { if (a[3] === sx && a[4] === sy && a[7] === 'station') out.push('S'); return dt(...a); };
        drawParkCar = (m, ...r) => { if (Math.abs(m.px - sx) < 1.1 && Math.abs(m.py - sy) < 1.1) out.push('C'); return dc(m, ...r); };
        try {
          cam = state.cam; cam.z = 2; const p = iso(sx, sy); cam.x = p.x; cam.y = p.y;
          const res = [];
          for (let f = -1.6; f <= 1.6; f += 0.2) { T.s = ((i + f) % R.n + R.n) % R.n; T.wait = 999; out.length = 0; render(1e6); const s = out.join(''); if (s.includes('S') && /C.*S/.test(s)) res.push(f.toFixed(1) + ':' + s); }
          return res;
        } finally { drawParkTrack = dt; drawParkCar = dc; } })()`);
      expect(bad, 'Station ' + st).toEqual([]);
    }
  });
  it('Station in beiden Richtungen: Bahnsteig und Dach zeigen ihre vorderen Seiten (Block 136g)', () => {
    loop(); game("build('pb_station', 8, 10); build('pb_station', 12, 8); recalc()");
    for (const [x, y] of [[8, 10], [12, 8]]) {
      const bad = game(`(() => { const o = pbBox, bad = [];
        pbBox = (S, du, dv, a0, a1, b0, b1, h0, ...r) => { const f = o(S, du, dv, a0, a1, b0, b1, h0, ...r), c = S((a0 + a1) / 2, (b0 + b1) / 2, h0)[1];
          if (!f.length || f.some(e => (e.p[1] + e.q[1]) / 2 < c - 1e-6)) bad.push(f.length); return f; };
        try { PASS = 'object'; drawObject('pb_station', 0, 0, 2, 0, ${x}, ${y}, 1, state.tiles.get('${x},${y}')); } finally { pbBox = o; PASS = null; }
        return bad; })()`);
      expect(bad, x + ',' + y).toEqual([]);
    }
  });
  it('gekaufte Züge überstehen Speichern und Laden (Block 136h)', () => {
    loop(); game("state.design.add('pb_station:form:tram'); build('pb_station', 7, 10); recalc(); pbBuyTrain(PB_RINGS[0]); pbBuyTrain(PB_RINGS[0]); pbSetModel(PB_RINGS[0], 2, 1)");
    expect(game('pbForms(PB_RINGS[0])')).toEqual([0, 0, 1]);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
    expect(game('pbForms(PB_RINGS[0])')).toEqual([0, 0, 1]);
  });
  it('Kunstakademie: jede Form zeigt ihren Zug am Bahnsteig (Nutzer, 09.10.2026: Straßenbahn und Mini-Zug sahen gleich aus)', () => {
    const models = game(`(() => { const orig = pbTrainAt, seen = []; pbTrainAt = (...a) => { seen.push(a[7]); return orig(...a); };
      try { for (const d of DESIGN.filter(d => d.look && d.look[0] === 'pb_station')) thumbRaw('pb_station', 1, { form: d.look[1], col: 0, rot: 0, slot: 0 }, 2.5); } finally { pbTrainAt = orig; } return seen; })()`);
    expect(models).toEqual(['tram', 'mini']);
  });
});
