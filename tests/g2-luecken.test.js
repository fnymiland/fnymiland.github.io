const { loadGame, game } = require('./helpers/load-game');

// 160c G2 (Gesamtprüfung, plan-160c/g2-funde.md): Lücken. Seeweg-Hinweis auch, wenn vom Rest einer Bogenbrücke flache Stücke übrig bleiben
// (Abriss, Aufschütten, Aufnehmen, Wegwerfen; G2V-1) und beim Einzeltipp aufs Wasser (G2V-2); Umfärben einer Brücke zeigt weder Schild noch
// Geist einer neuen Brücke (G2V-3); getragener/kopierter Übergang mit Fußgängerbrücke nie mit einer Linie mitten in der Rampe (G2V-4)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; state.techs.add('bahn'); state.techs.add('terraform')");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); if (state.bruecken) state.bruecken.clear(); recalc(); resetUndo()");
});

// Meerenge x 10–12 (y 3–9), dazu ein zweites Wasser x 20–22; Holz-Bogenbrücke über 10–12 bei y = 6 (N = 3: überall durch)
const enge = () => game(`(() => { for (let y = 3; y <= 9; y++) for (const x of [10, 11, 12, 20, 21, 22]) state.terra.set(x + ',' + y, 'water');
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
  chosenStyle.weg = 'sand'; setTool('weg'); for (const x of [8, 9, 10, 13, 14, 12, 11]) build('weg', x, 6, true); setTool('look'); recalc(); resetUndo(); })()`);
// Seeweg durch ein Feld (wie eine Fähre darunter): da, solange das Feld nicht sperrt
const mitSeeweg = (x, y, fn) => game(`(() => { const out = [], ts = toast, sr = seaRoutesNow; toast = m => out.push(m);
  for (const k of ['0,0', '0,2']) state.tiles.set(k, { b: 'bootssteg', lvl: 1 });   // Enden des Seewegs (sonst zählt er nicht als verloren)
  seaRoutesNow = () => new Set(seaCross(${x}, ${y}) === 'block' ? [] : ['f:0,0|0,2']);
  try { (${fn})(); } finally { toast = ts; seaRoutesNow = sr; } return out.filter(m => /versperrt den Seeweg/.test(m)); })()`);

describe('Seeweg-Hinweis, wenn vom Rest einer Bogenbrücke flache Stücke bleiben (G2V-1)', () => {
  it('Ausgangslage: Bogenbrücke aus 3 Feldern, überall durch', () => {
    enge();
    expect(game('[10, 11, 12].map(x => seaCross(x, 6))')).toEqual(['x', 'x', 'x']);
  });
  it('Mittelfeld aufschütten (Einzeltipp): die beiden Reste sind flach – Hinweis mit „Was von der Brücke bleibt“', () => {
    enge();
    const t = mitSeeweg(12, 6, "() => { setTool('schuett'); build('schuett', 11, 6); setTool('look'); }");
    expect(game("terrainAt(11, 6)")).toBe('grass');
    expect(t.length).toBe(1);
    expect(t[0]).toMatch(/Was von der Brücke bleibt, versperrt den Seeweg.*nur unter Bögen.*↶/);
  });
  it('Endfeld abreißen (Einzeltipp): der Rest liegt nicht mehr am Ufer und ist flach – Hinweis', () => {
    enge();
    const t = mitSeeweg(11, 6, "() => demolish(10, 6)");
    expect(game("state.tiles.has('10,6')")).toBe(false);
    expect(t.length).toBe(1);
    expect(t[0]).toMatch(/Was von der Brücke bleibt/);
  });
  it('im Rechteck abreißen bzw. aufschütten: ein Hinweis', () => {
    enge();
    expect(mitSeeweg(11, 6, "() => { setTool('abriss'); startPlan('rect', { x: 10, y: 6 }, { x: 10, y: 6 }, false); runPlan(); setTool('look'); }").length).toBe(1);
    enge();
    expect(mitSeeweg(12, 6, "() => { setTool('schuett'); startPlan('rect', { x: 11, y: 6 }, { x: 11, y: 6 }, false); runPlan(); setTool('look'); }").length).toBe(1);
  });
  it('aufnehmen und woanders ablegen: verglichen mit vor dem Aufnehmen; zurück an den alten Platz: still', () => {
    enge();
    game("setTool('weg'); build('weg', 19, 6, true); setTool('look')");     // Ufer am Ziel (Brücken wachsen vom Ufer aus)
    expect(mitSeeweg(11, 6, "() => { setTool('verschieben'); pickUp(10, 6, -1); dropAt(20, 6, -1); setTool('look'); }").length).toBe(1);
    expect(game("isWegBridge(state.tiles.get('20,6'))")).toBe(true);
    enge();
    expect(mitSeeweg(11, 6, "() => { setTool('verschieben'); pickUp(10, 6, -1); dropAt(10, 6, -1); setTool('look'); }")).toEqual([]);
  });
  it('als Gruppe aufnehmen und ablegen: ebenso', () => {
    enge();
    expect(mitSeeweg(11, 6, "() => { setTool('verschieben'); pickUpGroup(9, 6, 10, 6); dropGroup(20, 6); setTool('look'); }").length).toBe(1);
    expect(game("[bAt(19, 6), isWegBridge(state.tiles.get('20,6'))]")).toEqual(['weg', true]);
  });
  it('aufgenommen und weggeworfen (🗑️): Hinweis', () => {
    enge();
    expect(mitSeeweg(11, 6, "() => { setTool('verschieben'); pickUp(10, 6, -1); discardCarried(); setTool('look'); }").length).toBe(1);
    expect(game("state.tiles.has('10,6')")).toBe(false);
  });
});

describe('Seeweg-Hinweis beim Einzeltipp aufs Wasser (G2V-2)', () => {
  it('Weg auf ein Wasserfeld getippt: flache Brücke sperrt – Hinweis; im Rechteck/als Linie nur einmal', () => {
    game("for (let y = 3; y <= 9; y++) for (const x of [20, 21, 22]) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); chosenStyle.weg = 'sand'; setTool('weg'); build('weg', 19, 6, true); setTool('look'); recalc()");
    const t = mitSeeweg(20, 6, "() => { setTool('weg'); build('weg', 20, 6); setTool('look'); }");
    expect(game("isWegBridge(state.tiles.get('20,6'))")).toBe(true);
    expect(t.length).toBe(1);
    expect(t[0]).toMatch(/Die Brücke versperrt den Seeweg/);
    expect(mitSeeweg(21, 6, "() => { setTool('weg'); startPlan('line', { x: 21, y: 6 }, { x: 21, y: 6 }, false); runPlan(); setTool('look'); }").length).toBe(1);
  });
});

describe('Umfärben einer Brücke: kein Schild und kein Geist einer neuen Brücke (G2V-3)', () => {
  it('Wasser-Wegbrücke im anderen Wegstil überzogen: nur Umfärben, kein „🌉 Brücke“, kein Geist', () => {
    enge();
    game("state.design = new Set(DESIGN.map(d => d.id)); chosenStyle.weg = 'asphalt'; setTool('weg'); startPlan('line', { x: 9, y: 6 }, { x: 13, y: 6 }, false)");
    const r = game('(() => { const i = planInfo(plan); return [planText(plan, i), i.wbGhost, i.cost]; })()');
    expect(r[0]).not.toMatch(/🌉 Brücke/);
    expect(r[1]).toBe(null);
    expect(r[2]).toBe(game('5 * ITEMS.weg.cost'));
    game("plan = null; setTool('look')");
  });
  it('Gleisbrücke mit anderem Gleisbett: kein „🌉 Brücke“, kein Geist; neue Felder daneben zählen weiter', () => {
    game(`(() => { for (let y = 3; y <= 7; y++) for (let x = 2; x <= 6; x++) state.terra.set(x + ',' + y, 'water');
      for (const x of [0, 1, 7, 8]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0 });
      for (const x of [2, 3, 4, 5, 6]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, bridge: true });
      terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
    game("state.paintNew.schiene = { form: 1 }; setTool('schiene'); startPlan('line', { x: 1, y: 5 }, { x: 7, y: 5 }, false)");
    const r = game('(() => { const i = planInfo(plan); return [planText(plan, i), i.wbGhost]; })()');
    expect(r[0]).not.toMatch(/🌉 Brücke/);
    expect(r[1]).toBe(null);
    game("plan = null; setTool('look'); state.paintNew.schiene = {}");
  });
});

describe('Übergang mit Fußgängerbrücke tragen/kopieren: nie mit einer Linie mitten in der Rampe (G2V-4)', () => {
  const RAMPE = 'Erst die Linie zwischen Übergang und Weg abreißen – dort liegt die Rampe';
  const szene = () => {
    for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, 8, true)`);
    for (let y = 6; y <= 10; y++) game(`build('weg', 9, ${y}, true)`);
    expect(game("setCrossing(9, 8, true, 'holz')")).toBe(true);
    game('resetUndo()');
  };
  it('einzeln getragen: am Ziel liegt eine Linie auf der Rampenkante → abgelehnt; längs der Schiene geht es', () => {
    szene();
    game("for (const x of [22, 24]) build('schiene', x, 18, true); state.edges.set(edgeBetween(23, 18, 23, 19), { b: 'zaun', style: 0 })");
    game("setTool('verschieben'); pickUp(9, 8, -1)");
    expect(game('moveError(23, 18, -1)')).toBe(RAMPE);
    game("state.edges.delete(edgeBetween(23, 18, 23, 19)); state.edges.set(edgeBetween(23, 18, 23, 17), { b: 'zaun', style: 0 })");
    expect(game('moveError(23, 18, -1)')).toBe(RAMPE);
    game("state.edges.delete(edgeBetween(23, 18, 23, 17)); state.edges.set(edgeBetween(23, 18, 24, 18), { b: 'zaun', style: 0 })");
    expect(game('moveError(23, 18, -1)')).not.toBe(RAMPE);
    game("cancelMove(); setTool('look')");
  });
  for (const art of ['tragen', 'kopieren']) it(`als Gruppe ${art}, gedreht: die Rampe liegt quer zu den mitkommenden Schienen`, () => {
    szene();
    game(art === 'tragen' ? "setTool('verschieben'); pickUpGroup(8, 7, 10, 9)" : "setTool('verschieben'); startCopy(8, 7, 10, 9)");
    game('moving.r = 1');
    // Ziel: Übergang auf (23, 18); wo landet das Wegfeld nach dem Drehen?
    const [cx, cy, wx, wy] = game(`(() => { const ox = 23 - moving.cx, oy = 18 - moving.cy, at = it => { const P = groupPlaced(it); return [ox + P.dx, oy + P.dy]; };
      const c = moving.items.find(it => it.kind === 'tile' && isCrossing(it.t)), w = moving.items.find(it => it.kind === 'tile' && it.t.b === 'weg');
      return [...at(c), ...at(w)]; })()`);
    expect([cx, cy]).toEqual([23, 18]);
    expect(Math.abs(wx - cx) + Math.abs(wy - cy)).toBe(1);
    game(`state.edges.set(edgeBetween(${cx}, ${cy}, ${wx}, ${wy}), { b: 'zaun', style: 0 })`);
    expect(game('groupErrors(23, 18).first')).toBe(RAMPE);
    game(`state.edges.delete(edgeBetween(${cx}, ${cy}, ${wx}, ${wy}))`);
    expect(game('groupErrors(23, 18).first')).toBe(null);
    game("cancelMove(); setTool('look')");
  });
});

describe('Deck „Eigenes Muster“ zwischen Anhöhen (Nutzer 16.10.2026: „da ändert sich gar nix“)', () => {
  it('mit Weg auf dem Deck: „Wie der Weg“ malt den Weg, „Eigenes Muster“ das Deck der Brücke (Planken) ohne Weg', () => {
    game(`(() => { for (let y = 4; y <= 8; y++) for (const x of [3, 4, 8, 9]) state.hills.set(x + ',' + y, { w: 0 });
      const b = { ax: 0, n: 3, art: 'holz', weg: ['platten', 'platten', 'platten'] }; b.brp = { ...brPrice({ mat: 'holz' }, 'anhoehe', 3), k: brSig(b, 'anhoehe') };
      state.bruecken.set('5,6', b); groundVersion++; recalc(); })()`);
    const male = () => game(`(() => { let n = 0; const wp = bkWegPaint; bkWegPaint = (...a) => { n++; return wp(...a); };
      try { for (const gr of ['h', 'vd', 'o']) bkDrawLagen(6, 6, 400, 300, 2, gr, bkAt(6, 6)); } finally { bkWegPaint = wp; } return n; })()`);
    expect(game("brLook(state.bruecken.get('5,6'), 'anhoehe').deck")).toBe('belag');
    expect(male()).toBeGreaterThan(0);
    expect(game("brSet({ at: 'anhoehe', k: '5,6' }, { deck: 'muster' })")).toBe(true);
    expect(male()).toBe(0);
    expect(game("brSet({ at: 'anhoehe', k: '5,6' }, { deck: 'belag' })")).toBe(true);
    expect(male()).toBeGreaterThan(0);
  });
});
