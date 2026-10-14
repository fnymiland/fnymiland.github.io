const { loadGame, game } = require('./helpers/load-game');

// 160c E1b (plan-160c/karte-E1.md): Bewegtes auf Gleisbrücken übers Wasser über bkDrawMoving (wie Wasser-Wegbrücken D1e) – Wagen auf dem Deck
// (vor dem vorderen Geländer o), Boot darunter (h + vd nachgemalt, dann o), vor der Stirn davor; frühere Felder über dem Boot: h + vd, dann
// was schon darauf fuhr (Block 112), dann o. Die Brücke liegt in E1b noch im Boden-Durchgang (rb = drawRailBed ganz)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 50; y++) for (let x = 0; x <= 50; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; hillWalkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0");
});
// Wasser (Rechteck) und Gleislinien; auf Wasser mit bridge
const bau = (wasser, linien) => game(`(() => { const [x0, y0, x1, y1] = ${JSON.stringify(wasser)};
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water');
  for (const [a, b, c, d] of ${JSON.stringify(linien)}) { const dx = Math.sign(c - a), dy = Math.sign(d - b); for (let x = a, y = b; ; x += dx, y += dy) { const wet = terrainAt(x, y) === 'water';
    state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(wet ? { bridge: true } : {}) }); if (x === c && y === d) break; } }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// gerade O-W über 2–7 × 0–9 (Gleis y 5), Leiter (zwei Gleise y 24/25) über 2–7 × 20–29
const szene = () => { bau([2, 0, 7, 9], [[0, 5, 9, 5]]); bau([2, 20, 7, 29], [[0, 24, 9, 24], [0, 25, 9, 25]]); };
// ein Bild nah, live: 'gr[g|w] x,y [fog]' (bkDrawLagen), 'rb x,y' (drawRailBed ganz, Brücke), 'dbo k gruppen' (drawBridgeOver),
// 'fig zug x,y' / 'fig boot' (drawMover); cars: Wagen { px, py, du, dv }, boats: Boote
const bild = (cx, cy, { cars = [], boats = [], crits = [], extra = '' } = {}) => game(`(() => {
  ${extra}
  const log = [], bl = bkDrawLagen, rb = drawRailBed, dm = drawMover, dbo = drawBridgeOver, S0 = shipMovers, tc = trainCars, sm = syncMovers;
  const tr = { kind: TRAIN_KIND.regio, col: 0, model: 'regio', route: {} };
  trainCars = () => ${JSON.stringify(cars)}.map((c, i) => ({ train: tr, i, n: 1, len: TRAIN_KIND.regio.len, d: null, mv: 1, ...c }));
  shipMovers = () => ${JSON.stringify(boats)}.map(b => ({ boat: true, ship: 'dampfer', du: 0, dv: 1, ...b })); syncMovers = () => {};
  for (const c of ${JSON.stringify(crits)}) critters.push({ critter: true, kind: 'schmetterling', h: 8, ...c });
  bkDrawLagen = (x, y, px, py, z, gr, c) => { const cc = c === undefined ? bkAt(x, y) : c; log.push(gr + (cc && cc.rail ? 'g' : cc && cc.water ? 'w' : '') + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, c); };
  drawRailBed = (cx, cy, z, x, y, t, armsIn, lagen) => { if (t && t.bridge && !lagen) log.push('rb ' + x + ',' + y); return rb(cx, cy, z, x, y, t, armsIn, lagen); };
  drawBridgeOver = (k, ...a) => { log.push('dbo ' + k + ' ' + (a[3] ? a[3].join('+') : '-')); return dbo(k, ...a); };
  drawMover = (m, ...a) => { log.push('fig ' + (m.train ? 'zug ' + Math.round(m.px) + ',' + Math.round(m.py) : m.boat ? 'boot' : m.critter ? 'tier' : '?') + (FOG ? ' fog' : '')); };
  try { cam = state.cam; cam.z = 2; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
  finally { bkDrawLagen = bl; drawRailBed = rb; drawMover = dm; drawBridgeOver = dbo; shipMovers = S0; trainCars = tc; syncMovers = sm; spriteForce = null; critters.length = 0; }
  return log;
})()`);
const nach = (log, e) => log.slice(log.indexOf(e) + 1);

describe('Gleisbrücken übers Wasser: Bewegtes (160c E1b)', () => {
  it('Zug mittig: auf dem Deck – nach der Brücke, vor dem vorderen Geländer o; danach nichts mehr vom Feld darunter', () => {
    szene();
    const log = bild(4, 5, { cars: [{ px: 4, py: 5, du: 1, dv: 0 }] }), i = log.indexOf('fig zug 4,5');
    expect(i).toBeGreaterThan(log.indexOf('rb 4,5'));
    expect(nach(log, 'fig zug 4,5')).toContain('og 4,5');
    expect(nach(log, 'fig zug 4,5').filter(e => /^(hg|vdg) 4,5/.test(e))).toEqual([]);
    expect(log.filter(e => e === 'fig zug 4,5').length).toBe(1);
  });
  it('Boot quer mittig: eigenes Feld über bkDrawMoving (h + vd, dann o), kein drawBridgeOver; boatUnder ohne das eigene Feld', () => {
    szene();
    expect(game("boatUnder({ boat: true, px: 4, py: 5 })")).toBe(null);
    const log = bild(4, 5, { boats: [{ px: 4, py: 5 }] }), iB = log.indexOf('fig boot');
    expect(iB).toBeGreaterThan(log.indexOf('rb 4,5'));
    expect(nach(log, 'fig boot').slice(0, 3)).toEqual(['hg 4,5', 'vdg 4,5', 'og 4,5']);
    expect(log.some(e => e.startsWith('dbo 4,5'))).toBe(false);
  });
  it('Klasse: Boot bis s 0,3 darunter, ab 0,31 davor (beide Achsen); Längsversatz bleibt darunter', () => {
    szene(); bau([20, 40, 29, 46], [[25, 38, 25, 48]]);
    const cls = (x, y, px, py) => game(`bkMoverClass({ boat: true, px: ${px}, py: ${py} }, gbAt(${x}, ${y}), ${x}, ${y})`);
    expect([cls(4, 5, 4, 5.3), cls(4, 5, 4, 5.31), cls(4, 5, 4.35, 5)]).toEqual(['U', 'F', 'U']);
    expect([cls(25, 43, 25.25, 43), cls(25, 43, 25.31, 43)]).toEqual(['U', 'F']);   // 25,3 − 25 ist in Gleitkomma 0,30000000000000071
  });
  it('Zug und Boot: Boot < h, vd < Zug < o; Boot vor der Stirn (s 0,45) zuletzt', () => {
    szene();
    let log = bild(4, 5, { cars: [{ px: 4, py: 5, du: 1, dv: 0 }], boats: [{ px: 4, py: 5 }] });
    const iB = log.indexOf('fig boot'), iV = log.indexOf('vdg 4,5'), iZ = log.indexOf('fig zug 4,5'), iO = log.lastIndexOf('og 4,5');
    expect(iB < iV && iV < iZ && iZ < iO).toBe(true);
    log = bild(4, 5, { boats: [{ px: 4, py: 5.45 }] });
    expect(nach(log, 'fig boot').filter(e => / 4,5/.test(e))).toEqual([]);
  });
  it('Möwe über dem Feld: davor, danach kein Nachmalen', () => {
    szene();
    const log = bild(4, 5, { crits: [{ px: 4, py: 5, h: 30 }] });
    expect(nach(log, 'fig tier').filter(e => / 4,5/.test(e))).toEqual([]);
  });
  it('fremdes Feld: das Nachgemalte im Nebel, Boot nicht', () => {
    szene();
    const log = bild(4, 5, { boats: [{ px: 4, py: 5 }], extra: "state.claimed.delete('4,5'); state.owned.delete(chunkOf(4, 5)); groundVersion++;" });
    expect(log).toContain('vdg 4,5 fog');
    expect(log).toContain('fig boot');
  });
  it('Boot unter einem früheren Gleisfeld (Leiter): dessen h + vd, dann der Zug darauf (Block 112), dann o – in einer GL-Zelle je Schritt', () => {
    szene();
    expect(game('boatUnder({ boat: true, px: 3.8, py: 24.5 })')).toEqual(['4,24', '3,25']);   // eigenes Feld 4,25 (bkDrawMoving); 3,25: |3 − 3,8| knapp unter 0,8
    const log = bild(4, 24.5, { cars: [{ px: 4, py: 24, du: 1, dv: 0 }], boats: [{ px: 3.8, py: 24.5 }] }), rest = nach(log, 'fig boot');
    const iH = rest.indexOf('hg 4,24'), iV = rest.indexOf('vdg 4,24'), iZ = rest.indexOf('fig zug 4,24');
    expect(iH >= 0 && iH < iV && iV < iZ).toBe(true);
    expect(rest).toContain('dbo 4,24 h+vd');
    const tiefe = game(`(() => { let d = 0, max = 0; const gl = glLive, gp = GLPASS; glLive = (px, py, l, u, r, dd, f) => { d++; max = Math.max(max, d); try { f(); } finally { d--; } };
      GLPASS = true; const byTile = new Map([['4,24', [{ train: { kind: TRAIN_KIND.regio, col: 0, model: 'regio', route: {} }, px: 4, py: 24, du: 1, dv: 0, len: 0.78, i: 0, n: 1, d: null }]]]), done = new Set(byTile.get('4,24'));
      try { gbBoatOver({ boat: true, ship: 'dampfer', px: 3.8, py: 24.5, du: 0, dv: 1 }, '4,24', 1, 1e6, byTile, done); bridgeOverBoat('4,5', 1, 1e6, { boat: true, ship: 'dampfer', px: 4, py: 5, du: 0, dv: 1 }); }
      finally { glLive = gl; GLPASS = gp; } return max; })()`);
    expect(tiefe).toBe(1);                                                                 // nie Zelle in Zelle
  });
  it('Leiter, Zug auf beiden Reihen, Boot darunter: das frühere Feld samt Zug zuerst, dann das eigene h + vd, dann der eigene Zug (K10)', () => {
    szene();
    const log = bild(4, 24.5, { cars: [{ px: 4, py: 24, du: 1, dv: 0 }, { px: 4, py: 25, du: 1, dv: 0 }], boats: [{ px: 3.8, py: 24.5 }] }), rest = nach(log, 'fig boot');
    const at = e => rest.indexOf(e), seq = ['hg 4,24', 'vdg 4,24', 'fig zug 4,24', 'hg 4,25', 'vdg 4,25', 'fig zug 4,25'].map(at);
    expect(seq.every(i => i >= 0), JSON.stringify(rest)).toBe(true);
    expect([...seq].sort((a, b) => a - b)).toEqual(seq);
    expect(rest.slice(at('fig zug 4,25')).filter(e => /^(hg|vdg) 4,24/.test(e))).toEqual([]);   // das frühere Feld deckt den eigenen Zug nie
  });
  it('nachts Zug und Boot darunter: das Bootslicht unter dem Deck nimmt dem Zugscheinwerfer nicht die Stärke (eigenes Licht-Raster, Block 84d)', () => {
    szene();
    const r = game(`(() => {
      const out = [], pg = punchGlow, dm = drawMover, na = nightAt, gh = gameHour, sm = syncMovers, S0 = shipMovers, tc = trainCars; let wer = null;
      const tr = { kind: TRAIN_KIND.regio, col: 0, model: 'regio', route: {} };
      trainCars = () => [{ train: tr, px: 4.5, py: 5, du: 1, dv: 0, i: 0, n: 1, len: TRAIN_KIND.regio.len, d: null, mv: 1 }];   // wie im Prüfbild: Scheinwerfer
      shipMovers = () => [{ boat: true, ship: 'dampfer', px: 5, py: 5, du: 0, dv: 1 }];                                       // und Bootslicht in einer 24-px-Zelle
      syncMovers = () => {}; nightAt = () => NIGHT_MAX; gameHour = () => 23;
      drawMover = (m, ...a) => { const w0 = wer; wer = m.train ? 'zug' : m.boat ? 'boot' : wer; try { return dm(m, ...a); } finally { wer = w0; } };
      punchGlow = (q, rr, tint, part) => { if (!part && wer) { const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2, cell = (Math.round(gx / 24) + 4096) * 8192 + Math.round(gy / 24) + 4096, seen = glowCells.get(cell);
        out.push(wer + ' ' + (seen ? seen.size : 0)); } return pg(q, rr, tint, part); };
      try { cam = state.cam; cam.z = 2; const p = iso(4, 5); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
      finally { punchGlow = pg; drawMover = dm; nightAt = na; gameHour = gh; syncMovers = sm; shipMovers = S0; trainCars = tc; spriteForce = null; }
      return out; })()`);
    const zug = r.filter(e => e.startsWith('zug'));
    expect(zug.length, JSON.stringify(r)).toBeGreaterThan(0);
    expect(zug.every(e => e === 'zug 0'), JSON.stringify(r)).toBe(true);                // jedes Zuglicht als erstes in seiner Zelle (volle Stärke)
    expect(r.some(e => e.startsWith('boot'))).toBe(true);
  });
});
