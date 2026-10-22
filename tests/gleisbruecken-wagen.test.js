const { loadGame, game } = require('./helpers/load-game');

// 160c E1c (plan-160c/karte-E1.md, §6 Nr. 11/12): Wagen an Gleisbrücken übers Wasser in Stücken je Feld (gbCarPieces) – sonst malte nach dem
// Umzug (E1d) das Deck des späteren Felds über das Wagenende. Schnitte nur an Feldkanten mindestens 0,01 vor den Enden (sonst gälte die Stirn
// als Schnitt: keine Fenster, kein Scheinwerfer); schräg (Kurve) ganz ins späteste Feld; Schatten je Stück auf seiner Feldraute
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 50; y++) for (let x = 0; x <= 50; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0");
});
const bau = (wasser, linien) => game(`(() => { const [x0, y0, x1, y1] = ${JSON.stringify(wasser)};
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water');
  for (const [a, b, c, d] of ${JSON.stringify(linien)}) { const dx = Math.sign(c - a), dy = Math.sign(d - b); for (let x = a, y = b; ; x += dx, y += dy) { const wet = terrainAt(x, y) === 'water';
    state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(wet ? { bridge: true } : {}) }); if (x === c && y === d) break; } }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// gerade O-W (Gleis y 5, Wasser x 2–7), Nord-Süd (Gleis x 25, Wasser y 2–7), Kurve 25,25 (von Westen nach Norden)
const szene = () => { bau([2, 0, 7, 9], [[0, 5, 9, 5]]); bau([20, 2, 29, 7], [[25, 0, 25, 9]]); bau([22, 22, 28, 29], [[20, 25, 25, 25], [25, 24, 25, 20]]); };
const car = (px, py, du, dv, model = 'regio') => `({ train: { kind: TRAIN_KIND.${model}, col: 0, model: '${model}', route: {} }, px: ${px}, py: ${py}, du: ${du}, dv: ${dv}, i: 0, n: 1, len: TRAIN_KIND.${model}.len, d: null, mv: 1 })`;
const stuecke = (px, py, du, dv, model) => game(`(ps => ps && ps.map(p => [p.k, p.m.cut && p.m.cut.map(v => +v.toFixed(3)), p.m.gbK || null, p.m.portal]))(gbCarPieces(${car(px, py, du, dv, model)}))`);

describe('Gleisbrücken übers Wasser: Wagen in Stücken (160c E1c)', () => {
  it('gerade über eine Feldkante: zwei Stücke, zusammen so lang wie der Wagen; Nord-Süd ebenso', () => {
    szene();
    expect(stuecke(4.4, 5, 1, 0)).toEqual([['4,5', [-0.39, 0.1], '4,5', null], ['5,5', [0.1, 0.39], '5,5', null]]);
    expect(stuecke(25, 4.4, 0, 1)).toEqual([['25,4', [-0.39, 0.1], '25,4', null], ['25,5', [0.1, 0.39], '25,5', null]]);
    expect(stuecke(4.4, 5, -1, 0)).toEqual([['5,5', [-0.39, -0.1], '5,5', null], ['4,5', [-0.1, 0.39], '4,5', null]]);   // rückwärts: a längs der Fahrt
  });
  it('halb am Ufer: Landfeld und Brückenfeld; mittig im Feld, nur an Land: keine Stücke', () => {
    szene();
    expect(stuecke(1.6, 5, 1, 0).map(p => p[0])).toEqual(['1,5', '2,5']);
    expect(stuecke(4, 5, 1, 0)).toBe(null);
    expect(stuecke(0.6, 5, 1, 0)).toBe(null);
  });
  it('Ende 0,005 hinter der Kante: kein Schnitt (sonst gälte die Stirn als Schnittfläche – Fenster und Scheinwerfer weg)', () => {
    szene();
    const la = game('TRAIN_KIND.regio.len / 2');
    expect(stuecke(4.5 + 0.005 - la, 5, 1, 0)).toBe(null);
    expect(stuecke(4.5 - 0.005 + la, 5, -1, 0)).toBe(null);
    const ps = stuecke(4.5 + 0.02 - la, 5, 1, 0);
    expect(ps.length).toBe(2);
    expect(ps.every(p => p[1][1] - p[1][0] >= 0.01)).toBe(true);
  });
  it('schräg in der Kurve: ein ganzer Wagen im spätesten Feld unter Mitte und Ecken; lange Tram höchstens zwei Stücke', () => {
    szene();
    const s = 1 / Math.SQRT2, ps = stuecke(24.8, 24.8, s, -s);
    expect(ps.length).toBe(1);
    expect(ps[0][1]).toBeFalsy();                                                   // ungeschnitten
    const order = ([x, y]) => (x + y) * 1e5 + x;
    const ecken = game(`(m => { const la = m.len / 2, wb = trainHalfW(m.train); return [[0, 0], [-la, -wb], [la, -wb], [la, wb], [-la, wb]].map(([a, b]) => [Math.round(m.px + m.du * a - m.dv * b), Math.round(m.py + m.dv * a + m.du * b)]); })(${car(24.8, 24.8, 0.7071067811865476, -0.7071067811865476)})`);
    const spaet = ecken.reduce((p, q) => order(q) > order(p) ? q : p);
    expect(ps[0][0]).toBe(spaet.join());
    expect(stuecke(4.4, 5, 1, 0, 'tram').length).toBeLessThanOrEqual(2);
  });
  it('im Bild: jedes Stück genau einmal, in seinem Feld; Schatten je Stück auf der Raute seines Felds', () => {
    szene();
    const log = game(`(() => {
      const log = [], tc = trainCars, sm = syncMovers, body = drawTrainCarBody, el = poly, cl = g.clip;
      trainCars = () => [${car(4.4, 5, 1, 0)}]; syncMovers = () => {};
      drawTrainCarBody = (c, ...a) => { log.push('car ' + (c.gbK || '-') + ' ' + (c.cut ? c.cut.map(v => v.toFixed(2)).join('..') : 'ganz')); return body(c, ...a); };
      poly = (...a) => { if (a[1] === 'rgba(40,50,70,0.2)') log.push('schatten'); return el(...a); };   // Schatten: Fläche in Richtung des Wagens (166)
      g.clip = function (...a) { log.push('clip'); return cl.apply(this, a); };
      try { cam = state.cam; cam.z = 2; const p = iso(4.5, 5); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
      finally { trainCars = tc; syncMovers = sm; drawTrainCarBody = body; poly = el; g.clip = cl; spriteForce = null; }
      return log; })()`);
    const cars = log.filter(e => e.startsWith('car'));
    expect(cars).toEqual(['car 4,5 -0.39..0.10', 'car 5,5 0.10..0.39']);
    for (const c of cars) { const i = log.indexOf(c); expect(log.slice(i + 1, i + 3), c).toEqual(['clip', 'schatten']); }
  });
  it('ohne Gleisbrücken keine Stücke (gbCarPieces wird nicht gerufen)', () => {
    bau([30, 30, 31, 31], []);
    const n = game(`(() => { let n = 0; const f = gbCarPieces, tc = trainCars; gbCarPieces = m => { n++; return f(m); }; trainCars = () => [${car(10.4, 10, 1, 0)}];
      try { cam = state.cam; cam.z = 2; const p = iso(10, 10); cam.x = p.x; cam.y = p.y; render(1e6); } finally { gbCarPieces = f; trainCars = tc; } return n; })()`);
    expect(n).toBe(0);
  });
  it('Tunnel-/Bergportal (tc): liegt unter dem Wagen ein späteres Gleisbrückenfeld, kommt der Wagen dorthin (§6 Nr. 12)', () => {
    szene();
    const r = game(`(() => {
      const tc = trainCars, tt = trainTunnelCut, put = []; const dl = bkDrawMoving;
      trainCars = () => [${car(1.6, 5, 1, 0)}];
      trainTunnelCut = m => ({ k: '1,5', cut: [-0.39, 0.39], portal: {} });            // Portal auf 1,5 (früher als die Brücke 2,5)
      bkDrawMoving = (x, y, ...a) => { const ms = a[5] || []; if (ms.some(m => m.train)) put.push(x + ',' + y); return dl(x, y, ...a); };
      try { cam = state.cam; cam.z = 2; const p = iso(2, 5); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
      finally { trainCars = tc; trainTunnelCut = tt; bkDrawMoving = dl; spriteForce = null; }
      return put; })()`);
    expect(r).toEqual(['2,5']);
  });
  it('Block 112 (gbBoatOver): ein Wagenstück auf dem Landfeld am Ufer bekommt kein Landgleis übergemalt (Gegenlesen E1)', () => {
    szene();
    const r = game(`(() => { const out = [], rb = drawRailBed; drawRailBed = (...a) => { if (!a[7] && !isGleisBridge(state.tiles.get(a[3] + ',' + a[4]))) out.push('ganz ' + a[3] + ',' + a[4]); return rb(...a); };
      const ps = gbCarPieces(${car(25, 7.6, 0, 1)}), byTile = new Map(), done = new Set();
      for (const p of ps) { byTile.set(p.k, [p.m]); done.add(p.m); }
      try { gbBoatOver({ boat: true, ship: 'dampfer', px: 25.6, py: 6.7, du: 0, dv: 1 }, '25,7', 1, 1e6, byTile, done); } finally { drawRailBed = rb; }
      return [ps.map(p => p.k), out]; })()`);
    expect(r[0]).toEqual(['25,7', '25,8']);
    expect(r[1]).toEqual([]);
  });
});

