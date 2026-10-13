const { loadGame, game } = require('./helpers/load-game');

// 160c D1e (plan-160c/karte-D1.md): Bewegtes auf Wasser-Wegbrücken wie bei den Anhöhen-Brücken (B2) – tileB malt nur nach, was Bewegtes
// zudeckt: Leute immer auf dem Deck (vor vd, hinter o), Boot darunter (flach h + vd nachgemalt wie früher die ganze Brücke, Bogen nur vd),
// Boot vor der Stirn und fliegende Tiere davor; frühere Brückenfelder über dem Boot (boatUnder, drawBridgeOver im Bootsrahmen, Block 112)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 2; y <= 50; y++) for (let x = 2; x <= 50; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; hillWalkers.length = 0; critters.length = 0");
});
// Kanal wie wasserbruecken-lagen.test.js
const kanal = (u0, v0, N, { ax = 0, breit = 1, style = 'sand' } = {}) => game(`(() => {
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v;
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3; u <= ${u0} + ${N} + 2; u++) state.terra.set(K(u, v), u >= ${u0} && u < ${u0} + ${N} ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: ${ax} });
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// Holz flach (6,4), Stein-Bogen 3 (14–16, 10), Holz breit 3 × 6 (24–29, 4–6), Nord-Süd Bogen 3 (40, 42–44)
const szene = () => { kanal(6, 4, 1); kanal(14, 10, 3, { style: 'platten' }); kanal(24, 4, 6, { breit: 3 }); kanal(42, 40, 3, { ax: 1 }); };
// ein Bild nah, live: 'gr[w] x,y [fog]' (bkDrawLagen), 'fig id' (drawMover/drawWalker); figs: Leute, boats: Boote (shipMovers), crits: Tiere
const bild = (cx, cy, { figs = [], boats = [], crits = [], extra = '' } = {}) => game(`(() => {
  ${extra}
  for (const f of ${JSON.stringify(figs)}) walkers.push({ fur: '#fff', shirt: '#f00', kind: 0, wait: 99, speed: 0.4, ...f });
  for (const c of ${JSON.stringify(crits)}) critters.push({ critter: true, kind: 'schmetterling', h: 8, ...c });
  const log = [], bl = bkDrawLagen, dm = drawMover, dw = drawWalker, S0 = shipMovers, sm = syncMovers;
  shipMovers = () => ${JSON.stringify(boats)}.map(b => ({ boat: true, ship: 'motor', du: 0, dv: 1, ...b })); syncMovers = () => {};
  bkDrawLagen = (x, y, px, py, z, gr, c) => { const cc = c === undefined ? bkAt(x, y) : c; log.push(gr + (cc && cc.water ? 'w' : '') + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, c); };
  drawMover = (m, ...a) => { log.push('fig ' + (m.id || (m.boat ? 'boot' : m.critter ? 'tier' : '?')) + (FOG ? ' fog' : '')); };
  drawWalker = (m, ...a) => { log.push('fig ' + m.id + (FOG ? ' fog' : '')); };
  try { cam = state.cam; cam.z = 2; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
  finally { bkDrawLagen = bl; drawMover = dm; drawWalker = dw; shipMovers = S0; syncMovers = sm; spriteForce = null; walkers.length = 0; critters.length = 0; }
  return log;
})()`);
const nach = (log, e) => log.slice(log.indexOf(e) + 1);
const lagen = (list, k) => list.filter(e => new RegExp(`^(h|vd|o|w)w ${k}( fog)?$`).test(e)).map(e => e.split(' ')[0]);

describe('Wasser-Wegbrücken: Bewegtes (160c D1e)', () => {
  it('Figur auf dem Deck: w (tileA) < Figur < o – flach, Bogen, breit (jede Reihe), Nord-Süd; auch am Feldrand quer', () => {
    szene();
    for (const [cx, cy, f] of [[6, 4, { id: 'F', px: 6, py: 4 }], [15, 10, { id: 'F', px: 15.2, py: 10 }], [26, 5, { id: 'F', px: 26, py: 5 }], [26, 4, { id: 'F', px: 26, py: 4.2 }],
      [26, 6, { id: 'F', px: 26.3, py: 5.8 }], [40, 43, { id: 'F', px: 40, py: 43.1 }], [6, 4, { id: 'F', px: 6, py: 4.3 }]]) {
      const k = Math.round(f.px) + ',' + Math.round(f.py), log = bild(cx, cy, { figs: [f] }), i = log.indexOf('fig F');
      expect(i, k).toBeGreaterThan(log.indexOf('ww ' + k));
      expect(lagen(nach(log, 'fig F'), k), k).toEqual(['ow']);                             // nur das Vordere darüber
      expect(log.filter(e => e === 'fig F').length).toBe(1);
    }
  });
  it('Boot darunter: flach h + vd < o nachgemalt, Bogen vd < o; vor der Stirn (s > 0,36) danach nichts; Tier fliegt davor', () => {
    szene();
    let log = bild(6, 4, { boats: [{ px: 6, py: 4.1 }] });
    expect(lagen(nach(log, 'fig boot'), '6,4')).toEqual(['hw', 'vdw', 'ow']);
    log = bild(15, 10, { boats: [{ px: 15, py: 10 }] });
    expect(lagen(nach(log, 'fig boot'), '15,10')).toEqual(['vdw', 'ow']);
    log = bild(15, 10, { boats: [{ px: 15, py: 10.45 }] });
    expect(lagen(nach(log, 'fig boot'), '15,10')).toEqual([]);
    expect(game("[0.3, 0.36, 0.4].map(s => bkMoverClass({ boat: true, px: 15, py: 10 + s }, wbAt(15, 10), 15, 10))")).toEqual(['U', 'U', 'F']);   // halbe Breite EDGE_W
    log = bild(15, 10, { crits: [{ px: 15, py: 10 }] });
    expect(log.indexOf('fig tier')).toBeGreaterThan(log.indexOf('ww 15,10'));
    expect(lagen(nach(log, 'fig tier'), '15,10')).toEqual([]);                             // Schmetterling über dem Deck: nichts darüber
  });
  it('fremdes Feld: Nachgemaltes im Nebel, Figuren und Boote nicht', () => {
    szene();
    const log = bild(6, 4, { boats: [{ px: 6, py: 4.1 }], figs: [{ id: 'F', px: 6, py: 4 }], extra: "state.claimed.delete('6,4'); state.owned.delete(chunkOf(6, 4)); groundVersion++;" });
    expect(log.filter(e => e.startsWith('fig'))).toEqual(['fig boot', 'fig F']);
    expect(nach(log, 'fig boot').filter(e => / 6,4/.test(e)).every(e => e.endsWith(' fog'))).toBe(true);
  });
  it('boatUnder: eigenes Feld nie (bkDrawMoving), spätere nie (ihr tileA malt darüber), frühere schon; Gleisbrücken wie bisher', () => {
    szene();
    expect(game('boatUnder({ boat: true, px: 15, py: 10.3 })')).toBe(null);
    expect(game('boatUnder({ boat: true, px: 15, py: 9.4 })')).toBe(null);
    expect(game('boatUnder({ boat: true, px: 25.6, py: 4.4 })')).toEqual(['25,5']);
    game("for (const x of [44, 45, 46]) state.tiles.set(x + ',30', { b: 'schiene', lvl: 1, bridge: true }); for (let y = 28; y <= 32; y++) for (let x = 42; x <= 48; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); waterChanged(); recalc()");
    expect(game('boatUnder({ boat: true, px: 45, py: 29.6 })')).toEqual(['45,30']);       // Schiene: auch das spätere Feld
  });
  it('Boot auf seinem Brückenfeld unter einem früheren: das frühere im Bootsrahmen nachgemalt, Leute darauf wieder obenauf (Block 112)', () => {
    szene();
    const log = bild(25.6, 4.6, { boats: [{ px: 25.6, py: 4.4 }], figs: [{ id: 'F', px: 25, py: 5 }] });
    const iB = log.indexOf('fig boot'), after = log.slice(iB + 1);
    expect(log.indexOf('fig F')).toBeLessThan(iB);                                         // 25,5 kommt vor 26,4
    expect(game('!!wbAt(25, 5).A')).toBe(true);
    expect(lagen(after, '25,5')).toEqual(['vdw', 'ow']);                                   // Bogen: das Vordere im Bootsrahmen
    expect(after.indexOf('fig F')).toBeGreaterThan(after.lastIndexOf('ow 25,5'));          // die Figur wieder obenauf
  });
  it('GL: Nachmalen über dem Boot ohne verschachtelte Zellen; drawBridgeOver ohne Rahmen bleibt aufrufbar', () => {
    szene();
    const max = game(`(() => { const gl = glLive; let dep = 0, max = 0; glLive = (x, y, l, u, r, d, f) => { dep++; max = Math.max(max, dep); try { f(); } finally { dep--; } };
      GLPASS = true; try { bridgeOverBoat('15,10', 1, 1e6, { boat: true, ship: 'motor', px: 15, py: 10, du: 0, dv: 1 }); bridgeOverBoat('6,4', 1, 1e6, { boat: true, ship: 'motor', px: 6, py: 4, du: 0, dv: 1 }); }
      finally { GLPASS = false; glLive = gl; } return max; })()`);
    expect(max).toBe(1);
    expect(() => game("drawBridgeOver('15,10', 1.5, 1e6); drawBridgeOver('6,4', 1.5, 1e6)")).not.toThrow();
  });
});
