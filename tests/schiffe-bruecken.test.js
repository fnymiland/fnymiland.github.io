const { loadGame, game } = require('./helpers/load-game');

// Block 107: Schiffe fahren unter Brücken (Schienen, Wegbrücken) nur quer durch – nie längs auf den Schienen entlang
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal()");
  game("for (let y = 30; y <= 50; y++) for (let x = 30; x <= 60; x++) { state.terra.set(x + ',' + y, 'water'); state.tiles.delete(x + ',' + y); } recalc()");
});
const route = (s, g) => game(`seaSearch([${s}], (x, y) => x === ${g[0]} && y === ${g[1]}, [28, 28, 62, 52])`);

describe('Schiffe und Brücken (Block 107)', () => {
  it('lange Schienenbrücke in Fahrtrichtung: das Schiff fährt daneben, nicht darauf', () => {
    game("for (let x = 35; x <= 55; x++) state.tiles.set(x + ',40', { b: 'schiene', lvl: 1 }); recalc()");
    const p = route([33, 40], [57, 40]);
    expect(p).not.toBe(null);
    const onRail = p.filter(([x, y]) => game(`seaCross(${x}, ${y})`));
    expect(onRail).toEqual([]);
  });
  it('Brücke quer über das ganze Wasser: genau einmal gerade darunter durch', () => {
    game("for (let y = 30; y <= 50; y++) state.tiles.set('45,' + y, { b: 'schiene', lvl: 1 }); recalc()");
    const p = route([40, 40], [50, 40]);
    expect(p).not.toBe(null);
    const i = p.findIndex(([x, y]) => game(`seaCross(${x}, ${y})`));
    expect(p.filter(([x, y]) => game(`seaCross(${x}, ${y})`)).length).toBe(1);
    expect(p[i - 1][1]).toBe(p[i][1]); expect(p[i + 1][1]).toBe(p[i][1]);               // rein und raus quer zur Brücke
  });
  it('Seewege werden neu berechnet, wenn eine Brücke dazukommt', () => {
    game("seaCache.set('test', 1); recalc()");
    expect(game("seaCache.has('test')")).toBe(true);                                        // nichts geändert: bleibt
    game("state.tiles.set('45,40', { b: 'schiene', lvl: 1 }); recalc()");
    expect(game("seaCache.has('test')")).toBe(false);
  });
  it('Fischkutter kreisen nicht über einer Brücke (ihr Fanggebiet hat ringsum keine)', () => {
    game("state.tiles.set('40,40', { b: 'hafen', lvl: 1, rot: 0 }); for (let x = 30; x <= 60; x++) state.tiles.set(x + ',44', { b: 'schiene', lvl: 1 }); recalc()");
    const fg = game("fishingGround('40,40')");
    expect(fg).not.toBe(null);
    if (fg) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) expect(game(`seaCross(${fg[0] + dx}, ${fg[1] + dy})`)).toBe(null);
  });
  it('Block 112: breite Brücke (Doppelgleis) über das ganze Wasser: quer darunter durch – Kreuzung bleibt gesperrt', () => {
    game("for (let y = 30; y <= 50; y++) { state.tiles.set('45,' + y, { b: 'schiene', lvl: 1 }); state.tiles.set('46,' + y, { b: 'schiene', lvl: 1 }); } recalc()");
    expect(game("seaCross(45, 40)")).toBe('y');
    const p = route([40, 40], [52, 40]);
    expect(p).not.toBe(null);
    expect(p.filter(([x, y]) => game(`seaCross(${x}, ${y})`)).length).toBe(2);              // genau quer über beide Gleise
    game("state.tiles.set('44,40', { b: 'schiene', lvl: 1 }); state.tiles.set('47,40', { b: 'schiene', lvl: 1 }); state.tiles.set('43,40', { b: 'schiene', lvl: 1 }); state.tiles.set('48,40', { b: 'schiene', lvl: 1 })");
    expect(game("[seaStep(43, 40, 44, 40), seaStep(44, 40, 45, 40)]")).toEqual([false, false]);   // Querschiene: nicht längs darauf entlang
    const q = route([40, 40], [52, 40]);
    expect(q.some(([x, y]) => y === 40 && x >= 43 && x <= 48)).toBe(false);                  // um die Kreuzung herum
  });
});

// 160c C10: Anhöhen-Brücke über Wasser – Schiffe nur quer durch die Feldmitte (Stützen und Pfeiler stehen auf den Kanten längs), Seewege neu
// bei Bau/Abriss, keine Fischkutter/Fische/Möwen an der Brücke, Boote vor der Stirn davor gezeichnet
describe('Schiffe unter Anhöhen-Brücken (160c C10)', () => {
  // Landriegel y 38–42 über das ganze Wasser, nur die Lücke x 44–46 bleibt Wasser; Anhöhen x 40–43 und 47–50; Brücke 44,40 (n 3, längs x)
  const riegel = (art = 'holz', extra = {}) => game(`(() => {
    for (let y = 38; y <= 42; y++) for (let x = 30; x <= 60; x++) { const k = x + ',' + y; state.claimed.add(k); if (x < 44 || x > 46) state.terra.set(k, 'grass'); }
    for (let y = 38; y <= 42; y++) for (const x of [40, 41, 42, 43, 47, 48, 49, 50]) state.hills.set(x + ',' + y, { w: 0 });
    state.bruecken.set('44,40', { ax: 0, n: 3, art: '${art}', ...${JSON.stringify(extra)} });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
  it('seaCross kennt die Brücke: Richtung der Brücke, nur über Wasser; quer erlaubt, längs, schräg und Stützenkanten nicht – alle Materialien', () => {
    for (const [art, extra] of [['holz', {}], ['holz', { bru: 'jede' }], ['holz', { gleis: [0, 0, 0] }], ['stahl', {}], ['stein', {}], ['stein', { gleis: [0, 0, 0] }], ['kristall', {}]]) {
      game('state.bruecken.clear(); state.hills.clear()'); riegel(art, extra);
      const id = art + JSON.stringify(extra);
      expect(game('[44, 45, 46].map(x => seaCross(x, 40))'), id).toEqual(['x', 'x', 'x']);
      expect(game('[seaStep(44, 40, 45, 40), seaStep(45, 40, 44, 40), seaStep(44, 39, 45, 40), seaStep(45, 39, 45, 40), seaStep(45, 40, 45, 41)]'), id).toEqual([false, false, false, true, true]);
      const edges = game("(() => { const b = state.bruecken.get('44,40'); return bkSupports(b).map(e => bkEdgeCells(44, 40, b.ax, e)); })()");
      for (const [[ax, ay], [bx, by]] of edges) expect(game(`[seaStep(${ax}, ${ay}, ${bx}, ${by}), seaStep(${bx}, ${by}, ${ax}, ${ay})]`), id).toEqual([false, false]);
    }
    expect(game('seaCross(43, 40)')).toBe(null);                                                 // auf der Anhöhe (Land)
  });
  it('Nord-Süd: Richtung y; Seeweg genau einmal gerade unter der Brücke durch, nie schräg darunter', () => {
    riegel();
    const p = route([45, 32], [45, 48]);
    expect(p).not.toBe(null);
    const under = p.filter(([x, y]) => game(`!!bkAt(${x}, ${y})`));
    expect(under.length).toBe(1);
    const i = p.findIndex(([x, y]) => x === under[0][0] && y === under[0][1]);
    expect(p[i - 1][0]).toBe(under[0][0]); expect(p[i + 1][0]).toBe(under[0][0]);              // rein und raus quer
    const pts = game(`(() => { const r = seaRoute(${JSON.stringify(p)}), out = []; for (let d = 0; d <= r.len; d += 0.05) { const q = routeAt(r, d); out.push([q[0], q[1]]); } return out; })()`);
    for (const [x, y] of pts) if (Math.abs(y - 40) <= 0.5) expect(Math.abs(x - Math.round(x))).toBeLessThan(1e-6);
    game("state.bruecken.clear(); for (let y = 30; y <= 50; y++) for (let x = 30; x <= 60; x++) { state.terra.set(x + ',' + y, 'water'); } state.hills.clear()");
    game("for (let x = 38; x <= 42; x++) for (let y = 30; y <= 60; y++) if (y < 44 || y > 46) state.terra.set(x + ',' + y, 'grass'); for (let x = 38; x <= 42; x++) for (const y of [40, 41, 42, 43, 47, 48, 49, 50]) state.hills.set(x + ',' + y, { w: 0 }); state.bruecken.set('40,44', { ax: 1, n: 3, art: 'holz' }); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc()");
    expect(game('[44, 45, 46].map(y => seaCross(40, y))')).toEqual(['y', 'y', 'y']);
    expect(game('[seaStep(40, 44, 40, 45), seaStep(39, 45, 40, 45)]')).toEqual([false, true]);
  });
  it('Seewege neu, wenn eine Brücke über Wasser gebaut oder abgerissen wird – über Land nicht; Materialwechsel ändert die Durchfahrt nicht', () => {
    riegel(); game("state.bruecken.clear(); groundVersion++; recalc(); seaCache.set('t', 1); recalc()");
    expect(game("seaCache.has('t')")).toBe(true);
    game("state.bruecken.set('44,40', { ax: 0, n: 3, art: 'holz' }); groundVersion++; recalc()");
    expect(game("seaCache.has('t')")).toBe(false);
    game("seaCache.set('t', 1); state.bruecken.set('33,40', { ax: 0, n: 2, art: 'holz' }); groundVersion++; recalc()");   // über Land (im Riegel)
    expect(game("seaCache.has('t')")).toBe(true);
    game("state.restore = { klippe: 1 }; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 9999");
    const before = game('[44, 45, 46].map(x => seaCross(x, 40))');
    expect(game("brSet({ at: 'anhoehe', k: '44,40' }, { mat: 'stein' })")).toBe(true);
    expect(game('[44, 45, 46].map(x => seaCross(x, 40))')).toEqual(before);
    game("state.bruecken.delete('44,40'); groundVersion++; recalc()");
    expect(game("seaCache.has('t')")).toBe(false);
  });
  it('Fischkutter, Fische, Robben und Möwen nicht an der Brücke; weiter weg schon', () => {
    riegel();
    const kinds = (x, y) => game(`natureAt(${x}, ${y}, 'tag').map(([id]) => id)`);
    for (const [x, y] of [[44, 40], [45, 40], [46, 40], [45, 39], [45, 41]]) { const k = kinds(x, y); expect(k, x + ',' + y).not.toContain('fisch'); expect(k).not.toContain('moewe'); }
    expect(kinds(45, 36)).toContain('fisch');
    expect(kinds(45, 36)).toContain('moewe');
    game("state.tiles.set('45,36', { b: 'hafen', lvl: 1, rot: 0 }); recalc()");
    const fg = game("fishingGround('45,36')");
    if (fg) for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) expect(game(`!!bkAt(${fg[0] + dx}, ${fg[1] + dy})`)).toBe(false);
  });
  it('Zeichnen: Boot vor der Stirn (s > BK_W) davor, sonst darunter; über Anhöhen-Brücken kein Nachmalen der Kachel-Brücke (boatUnder)', () => {
    riegel();
    const c = "bkAt(45, 40)";
    expect(game(`[bkMoverClass({ boat: true, px: 45, py: 40.45 }, ${c}, 45, 40), bkMoverClass({ boat: true, px: 45, py: 40.2 }, ${c}, 45, 40), bkMoverClass({ boat: true, px: 45, py: 39.55 }, ${c}, 45, 40)]`)).toEqual(['F', 'U', 'U']);
    expect(game('boatUnder({ boat: true, px: 45, py: 39.4 })')).toBe(null);
    game("state.tiles.set('35,45', { b: 'schiene', lvl: 1, bridge: true }); state.tiles.set('34,45', { b: 'schiene', lvl: 1, bridge: true }); state.tiles.set('36,45', { b: 'schiene', lvl: 1, bridge: true }); recalc()");
    expect(game('boatUnder({ boat: true, px: 35, py: 44.4 })')).toEqual(['35,45']);
  });
  it('Anleger auf einem Brückenfeld: der Seeweg verlässt es quer, nie längs unter dem Deck (Gegenlesen C10)', () => {
    riegel();
    for (const [a, b] of [[[45, 40], [45, 48]], [[45, 48], [45, 40]], [[44.2, 40.1], [46, 33]]]) {
      const r = game(`(() => { const r = seaPath(${JSON.stringify(a)}, ${JSON.stringify(b)}); if (!r) return null; const out = []; for (let d = 0; d <= r.len; d += 0.02) { const q = routeAt(r, d); out.push([q[0], q[1]]); } return out; })()`);
      expect(r, JSON.stringify([a, b])).not.toBe(null);
      const near = r.filter(([x, y]) => Math.abs(y - 40) <= 0.4 && Math.abs(x - Math.round(x)) > 0.35);   // unter dem Deck nie an eine Kante (Stützen bei x,5)
      expect(near, JSON.stringify([a, b])).toEqual([]);
    }
  });
  it('Boot auf einem Anhöhen-Brückenfeld neben einer Wasserbrücken-Kachel: die Kachel wird über den Rumpf nachgemalt', () => {
    riegel();
    game("for (const x of [44, 45, 46]) state.tiles.set(x + ',41', { b: 'schiene', lvl: 1, bridge: true }); recalc()");
    const r = game(`(() => { const out = [], bo = drawBridgeOver; drawBridgeOver = (k, ...a) => { out.push(k); return bo(k, ...a); };
      const S0 = shipMovers; shipMovers = () => [{ boat: true, ship: 'motor', px: 45, py: 40.45, du: 0, dv: 1 }];
      try { cam = state.cam; cam.z = 2; const p = iso(45, 40); cam.x = p.x; cam.y = p.y - HILL_H; spriteForce = false; render(1e6); } finally { drawBridgeOver = bo; shipMovers = S0; }
      return out; })()`);
    expect(r).toContain('45,41');
  });
});

// 160c C10 (Nutzer 12.10.2026: „das Boot fährt hinter dem Pfeiler, es sollte vor dem linken fahren“): Stütze/Pfeiler/Bock an der Anfangskante
// eines Felds liegt hinter einem Boot unter der Feldmitte – beim Nachmalen von vd über dem Boot wird dieser Streifen ausgespart
describe('Boot vor der Stütze an der Anfangskante (160c C10)', () => {
  const szene = (ax) => game(`(() => {
    for (let y = 30; y <= 50; y++) for (let x = 30; x <= 60; x++) state.terra.set(x + ',' + y, 'water');
    for (let a = 38; a <= 42; a++) for (let b = 30; b <= 60; b++) { const [x, y] = ${ax} ? [a, b] : [b, a], k = x + ',' + y; state.claimed.add(k); if (b < 44 || b > 46) state.terra.set(k, 'grass'); }
    for (let a = 38; a <= 42; a++) for (const b of [40, 41, 42, 43, 47, 48, 49, 50]) state.hills.set((${ax} ? a + ',' + b : b + ',' + a), { w: 0 });
    state.bruecken.set(${ax} ? '40,44' : '44,40', { ax: ${ax}, n: 3, art: 'holz' });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
  const redo = (ax, s) => game(`(() => { const rd = bkRedo, out = []; bkRedo = (x, y, px, py, z, now, rect, gr, slots, cut) => {
      const gr0 = g.rect, clips = []; g.rect = function (...r) { clips.push(r); return gr0.apply(this, r); };
      try { return rd(x, y, px, py, z, now, rect, gr, slots, cut); } finally { g.rect = gr0; out.push([gr.join(), clips[0] ? [clips[0][0], clips[0][1], clips[0][0] + clips[0][2], clips[0][1] + clips[0][3]] : null, px, z, !!cut]); } };
    const S0 = shipMovers; shipMovers = () => [{ boat: true, ship: 'dampfer', px: ${ax} ? 40 + ${s} : 45, py: ${ax} ? 45 : 40 + ${s}, du: ${ax} ? 1 : 0, dv: ${ax} ? 0 : 1 }];
    try { cam = state.cam; cam.z = 2; const p = iso(${ax} ? 40 : 45, ${ax} ? 45 : 40); cam.x = p.x; cam.y = p.y - HILL_H; spriteForce = false; render(1e6); }
    finally { bkRedo = rd; shipMovers = S0; } return out.filter(o => o[0] === 'vd'); })()`);
  it('Ost-West und Nord-Süd: unter der Mitte die Anfangskante ausgespart, hinter der Brücke nicht', () => {
    for (const ax of [0, 1]) {
      szene(ax);
      const v = redo(ax, 0.2);
      expect(v.length, 'ax ' + ax).toBe(1);
      const [, R, px, z] = v[0];
      if (ax) expect(R[2]).toBeLessThanOrEqual(px + 25.5 * z + 1e-6); else expect(R[0]).toBeGreaterThanOrEqual(px - 25.5 * z - 1e-6);
      expect(v[0][4]).toBe(true);
      const b = redo(ax, -0.45)[0];                                                               // hinter der Stütze (s < −0,16): ganz nachmalen
      expect(b[4]).toBe(false);
      if (ax) expect(b[1][2]).toBeGreaterThan(b[2] + 25.5 * b[3]); else expect(b[1][0]).toBeLessThan(b[2] - 25.5 * b[3]);
      game("state.bruecken.clear(); state.hills.clear()");
    }
  });
});
