const { loadGame, game } = require('./helpers/load-game');

// 160c G2, Gegenprüfung der Fixes (plan-160c/g2-funde.md N4–N8): Kristallglas hinten auch beim Nachtlicht-Stanzen, Seeweg-Hinweis nur für
// Wege, deren Endpunkte bleiben, Teich am Brückenende, Linie der Gruppe auf der Rampe des mitkommenden Übergangs
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; state.techs.add('bahn'); state.techs.add('terraform'); if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall')");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); if (state.bruecken) state.bruecken.clear(); recalc(); resetUndo()");
});
const enge = () => game(`(() => { for (let y = 3; y <= 9; y++) for (const x of [10, 11, 12]) state.terra.set(x + ',' + y, 'water');
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
  chosenStyle.weg = 'sand'; setTool('weg'); for (const x of [8, 9, 10, 13, 14, 12, 11]) build('weg', x, 6, true); setTool('look'); recalc(); resetUndo(); })()`);

describe('Kristall-Wasserbrücke nachts mit Licht davor: hintere Scheibe zuerst (N4)', () => {
  it('Split-Zweig: hg vor h', () => {
    enge();
    expect(game("wbSet(11, 6, { mat: 'kristall' })")).toBe(true);
    const log = game(`(() => { const out = [], bg = bkGroup, rh = wbRelightHits, rl = wbRelight;
      bkGroup = (x, y, px, py, z, grs, c) => { out.push(grs.join('+')); }; wbRelightHits = () => ({ hits: [1] }); wbRelight = () => out.push('licht');
      try { const c = wbAt(11, 6); bkDrawStill(11, 6, 400, 300, 2, 1e6, c, null); } finally { bkGroup = bg; wbRelightHits = rh; wbRelight = rl; } return out; })()`);
    expect(log.indexOf('hg')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('hg')).toBeLessThan(log.indexOf('h+vd'));
  });
});

describe('Übergang: vorderes Geländer geteilt auf dem Viertelraster (N5)', () => {
  it('oben in zwei Stücken: −0,9…0,45 und 0,45…0,9 (ubT(0,45) = 1)', () => {
    for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, 8, true)`);
    for (let y = 6; y <= 10; y++) game(`build('weg', 9, ${y}, true)`);
    expect(game("setCrossing(9, 8, true, 'kristall')")).toBe(true);
    const r = game(`(() => { const out = [], da = drawArch, p0 = PASS; drawArch = (P, z, b0, b1, ...rest) => { if (rest[rest.length - 1] === 'oben') out.push([b0, b1]); };
      try { PASS = 'object'; drawCrossing(400, 300, 2, 9, 8, state.tiles.get('9,8'), 1e6); for (const fs of archRails.values()) for (const f of fs) f(); } finally { drawArch = da; PASS = p0; archRails.clear(); afterMovers.length = 0; } return [out, ubT(0.45)]; })()`);
    expect(r[0].map(([a, b]) => [+a.toFixed(2), +b.toFixed(2)])).toEqual([[-0.9, 0.45], [0.45, 0.9]]);
    expect(r[1]).toBeCloseTo(1, 9);
  });
});

describe('Seeweg-Hinweis nur, wenn beide Enden noch stehen (N6)', () => {
  it('Steg mit abgerissen: still; Steg steht noch: Hinweis', () => {
    game("state.tiles.set('2,2', { b: 'bootssteg', lvl: 1 }); state.tiles.set('4,4', { b: 'bootssteg', lvl: 1 })");
    const r = game(`(() => { const out = [], ts = toast; toast = m => out.push(m);
      try { const b = new Set(['f:2,2|4,4']), sr = seaRoutesNow; seaRoutesNow = () => new Set();
        try { const a1 = seaRoutesWarn(b, true); state.tiles.delete('4,4'); const a2 = seaRoutesWarn(b, true); return [a1, a2, out.length]; } finally { seaRoutesNow = sr; } }
      finally { toast = ts; } })()`);
    expect(r).toEqual([true, false, 1]);
  });
});

describe('Teich am Ufer-Ende einer Bogenbrücke: Seeweg-Hinweis (N7)', () => {
  const mitSeeweg = (x, y, fn) => game(`(() => { const out = [], ts = toast, sr = seaRoutesNow; toast = m => out.push(m);
    for (const k of ['0,0', '0,2']) state.tiles.set(k, { b: 'bootssteg', lvl: 1 });
    seaRoutesNow = () => new Set(seaCross(${x}, ${y}) === 'block' ? [] : ['f:0,0|0,2']);
    try { (${fn})(); } finally { toast = ts; seaRoutesNow = sr; } return out.filter(m => /versperrt den Seeweg/.test(m)); })()`);
  it('Ufer-Weg weg, Teich gegraben (Einzeltipp und Rechteck): der Bogen wird flach – Hinweis', () => {
    enge();
    game("state.tiles.delete('9,6'); recalc()");
    expect(game('seaCross(11, 6)')).toBe('x');
    const t = mitSeeweg(11, 6, "() => { setTool('graben'); build('graben', 9, 6); setTool('look'); }");
    expect(game("terrainAt(9, 6)")).toBe('water');
    expect(t.length).toBe(1);
    expect(t[0]).toMatch(/Was von der Brücke bleibt/);
    enge(); game("state.tiles.delete('13,6'); recalc()");
    expect(mitSeeweg(11, 6, "() => { setTool('graben'); startPlan('rect', { x: 13, y: 6 }, { x: 13, y: 6 }, false); runPlan(); setTool('look'); }").length).toBe(1);
  });
});

describe('Linie der Gruppe auf der Rampe des mitkommenden Übergangs (N8)', () => {
  it('Zaun und Übergang zusammen kopiert, Zaun landet auf der Rampenkante: abgelehnt', () => {
    for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, 8, true)`);
    for (let y = 6; y <= 10; y++) game(`build('weg', 9, ${y}, true)`);
    expect(game("setCrossing(9, 8, true, 'holz')")).toBe(true);
    // ein Zaun zwischen zwei Wegfeldern kommt mit; eine Kante höher läge er zwischen Übergang und Wegfeld (Rampe)
    game("state.edges.set(edgeBetween(9, 9, 9, 10), { b: 'zaun', style: 0 })");     // nicht auf der Rampe (Kante Wegfeld | Wegfeld)
    game("setTool('verschieben'); startCopy(8, 7, 10, 10)");
    expect(game('groupErrors(23, 18).first')).toBe(null);
    game("(() => { const e = moving.items.find(it => it.kind === 'edge'); e.my -= 1; })()");   // dieselbe Linie eine Kante höher (alter Stand, an der Rampe vorbei gebaut)
    expect(game('groupErrors(23, 18).first')).toBe(game('ARCH_RAMP_LINE'));
    game("cancelMove(); setTool('look')");
  });
});
