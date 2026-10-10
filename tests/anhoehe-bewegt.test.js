const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2, Bewegtes (movers.js, hill-walkers.js): Bewohner gehen über Rampe und Treppe hinauf (walkable, edgeBlocks = levelLink
// 'fuss'), Fahrzeuge nur über die Rampe ('weg'); Höhe auf Rampe und Treppe am gezeichneten Fußpunkt, stetig auch beim Feldwechsel (figUp,
// slopeUp); Keil und Stufen davor kommen über die Figur; Antippen und Sprechblase mit dieser Höhe; Spaziergänger auch über Rampen;
// Tiere bleiben unten. Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewLen = 1; hillWalkers.length = 0; walkers.length = 0; critters.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const panel = () => game("document.getElementById('panel').textContent");
const H = 26, F = 3 / 32;                                                // Fußpunkt: 6 Punkte rechts = (3/32, −3/32) Feld
// vor jeder Seite der Anhöhe 10–13 × 10–13: Anker, Drehung, Fuß, oberes Feld (Länge 1: alles dasselbe Feld)
const SIDES = { 1: [[11, 14, 0, [11, 14], [11, 14]], [14, 11, 3, [14, 11], [14, 11]], [11, 9, 2, [11, 9], [11, 9]], [9, 11, 1, [9, 11], [9, 11]]],
  2: [[11, 14, 0, [11, 15], [11, 14]], [14, 11, 3, [15, 11], [14, 11]], [11, 8, 2, [11, 8], [11, 9]], [8, 11, 1, [8, 11], [9, 11]]] };
const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// Bewohner auf dem Weg von (sx, sy) zum Feld (gx, gy) laufen lassen (stepWalker, kleine Schritte): Lage und Höhe über dem Boden je Schritt
function walk(sx, sy, gx, gy) {
  const path = game(`(() => { const path = walkPath(${sx}, ${sy}, [[${gx}, ${gy}]]); window.__w = { fx: ${sx}, fy: ${sy}, tx: ${sx}, ty: ${sy}, px: ${sx}, py: ${sy}, t: 1, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', path: path && path.slice(), goal: { kind: 'markt', k: '0,0' } }; return path; })()`);
  const samples = game(`(() => { const w = __w, out = []; for (let i = 0; i < 3000 && w.path; i++) { stepWalker(w, 0.02); out.push([w.px, w.py, (figUp(w) ?? 0) + hillLift(Math.round(w.px), Math.round(w.py))]); } return out; })()`);
  return { path, samples };
}
const steps = (from, path) => [from, ...path].slice(1).map((p, i) => [[from, ...path][i], p]);

describe('Ohne Anhöhen wie vorher', () => {
  it('keine Höhe, kein Nachzeichnen, levelLink wird nie gefragt; eine Treppe ohne Anhöhe bleibt unbegehbar', () => {
    weg([[8, 8], [9, 8], [10, 8]]);
    game("state.tiles.set('12,8', { b: 'huegeltreppe', rot: 0 }); recalc()");
    expect(game('[walkable(8, 8), walkable(11, 8), walkable(12, 8), slopeAt(12, 8), flatGround(12, 8)]')).toEqual([true, true, false, false, true]);
    game('window.__ll = 0; { const o = levelLink; levelLink = (...a) => { __ll++; return o(...a); }; window.__unll = () => { levelLink = o; }; }');
    try {
      expect(game('walkPath(8, 8, [[14, 12]])')).not.toBe(null);
      game("state.tiles.set('9,12', { b: 'haus', lvl: 1, animal: 1 }); recalc()");
      expect(game("doorsOf('9,12').length")).toBe(4);
      game("window.__m = { fx: 8, fy: 8, tx: 8, ty: 8, px: 8, py: 8, t: 1, wait: 0, speed: 1 }; for (let i = 0; i < 50; i++) stepMover(__m, 0.3, walkable, false)");
      expect(game('__ll')).toBe(0);
    } finally { game('__unll()'); }
    expect(game("[slopeUp(8.2, 8, FOOT_D), figUp({ px: 9, py: 8 }), figUp({ px: 9, py: 8, up: 5 })]")).toEqual([null, null, 5]);
    // Zeichnen: nur die Figur
    game("window.__n = [0, 0]; { const a = drawFigure, b = drawHillRampOver; drawFigure = (...x) => { __n[0]++; return a(...x); }; drawHillRampOver = (...x) => { __n[1]++; return b(...x); }; window.__un = () => { drawFigure = a; drawHillRampOver = b; }; }");
    try { game("drawWalker({ px: 9, py: 8, kind: 0, fur: '#fff', shirt: '#f00', wait: 0, speed: 1 }, 2, 0)"); } finally { game('__un()'); }
    expect(game('__n')).toEqual([1, 0]);
  });
});

describe('Bewohner über Rampe und Treppe (Stufe 2)', () => {
  for (const len of [1, 2]) for (const [ax, ay, rot, foot, top] of SIDES[len]) it(`Rampe Länge ${len}, hinauf nach ${['hinten', 'rechts', 'vorn', 'links'][rot]}: Weg führt über die Rampe, Höhe am Fußpunkt stetig, wieder hinunter`, () => {
    hills(block(10, 10, 13, 13));
    game(`rampNewLen = ${len}; build('huegelrampe', ${ax}, ${ay}); rampNewLen = 1; recalc()`);
    expect(game(`rampAt(${foot}) && [rampAt(${foot}).rot, rampAt(${foot}).i, rampAt(${top}).i]`)).toEqual([rot, 0, len - 1]);
    const [dx, dy] = UP[rot], s = [foot[0] - 2 * dx, foot[1] - 2 * dy], goal = [top[0] + 2 * dx, top[1] + 2 * dy];
    for (const [a, b] of [[s, goal], [goal, s]]) {
      const { path, samples } = walk(...a, ...b);
      expect(path).not.toBe(null);
      expect(path.length).toBe(len + 3);                                                     // gerade über die Rampe
      for (const [p, q] of steps(a, path)) expect(game(`levelLink(${p}, ${q}, 'fuss')`)).toBe(true);
      // Höhe = Rampe am gezeichneten Fußpunkt (längs der Achse vom Fuß aus gemessen), davor 0, dahinter oben
      let jump = 0, prev = null, bad = 0;
      for (const [px, py, h] of samples) {
        const along = (px + F - foot[0]) * dx + (py - F - foot[1]) * dy, want = H * Math.max(0, Math.min(1, (along + 0.5) / len));
        if (Math.abs(h - want) > 1e-6) bad++;
        if (prev != null) jump = Math.max(jump, Math.abs(h - prev));
        prev = h;
      }
      expect(bad).toBe(0);
      expect(jump).toBeLessThanOrEqual(H / len * 0.02 + 1e-6);                                // kein Sprung, auch nicht beim Feldwechsel
      expect(Math.max(...samples.map(q => q[2]))).toBeCloseTo(H);
    }
    // seitlich nie auf die Rampe, nie über die Kante
    const side = [foot[0] - dy, foot[1] + dx], wall = [top[0] - dy + dx, top[1] + dx + dy];
    expect(game(`[edgeBlocks(${side}, ${foot}), edgeBlocks(${foot}, ${side}), edgeBlocks(${foot[0] - dx}, ${foot[1] - dy}, ${foot})]`)).toEqual([true, true, false]);
    expect(game(`edgeBlocks(${wall[0] - dx}, ${wall[1] - dy}, ${wall})`)).toBe(true);
  });

  for (const [sx, sy, rot] of SIDES[1]) it(`Treppe hinauf nach ${['hinten', 'rechts', 'vorn', 'links'][rot]}: zu Fuß über die Stufen, Stufe am Fußpunkt, höchstens eine Stufe auf einmal`, () => {
    hills(block(10, 10, 13, 13));
    game(`build('huegeltreppe', ${sx}, ${sy}); recalc()`);
    const [dx, dy] = UP[rot], s = [sx - 2 * dx, sy - 2 * dy], goal = [sx + 3 * dx, sy + 3 * dy];
    for (const [a, b] of [[s, goal], [goal, s]]) {
      const { path, samples } = walk(...a, ...b);
      expect(path && path.length).toBe(5);
      let jump = 0, prev = null, bad = 0;
      for (const [px, py, h] of samples) {
        const along = (px + F - sx) * dx + (py - F - sy) * dy;
        const want = along < -0.5 ? 0 : along >= 0.5 ? H : H * (Math.min(7, Math.floor((along + 0.5) * 8)) + 1) / 8;
        if (Math.abs(h - want) > 1e-6) bad++;
        if (prev != null) jump = Math.max(jump, Math.abs(h - prev));
        prev = h;
      }
      expect(bad).toBe(0);
      expect(jump).toBeLessThanOrEqual(H / 8 + 1e-6);
    }
  });

  it('Markt oben: Bewohner gehen über die Rampe hin, ins Feld davor; Fahrzeuge kommen nur über die Rampe, nie über die Treppe', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14)");
    weg([[11, 15], [11, 16], [11, 17], [11, 18], [11, 13], [11, 12], [12, 12]]);
    game("build('stand_obst', 12, 12, true); state.tiles.set('12,19', { b: 'haus', lvl: 1, animal: 2 }); recalc()");
    expect(game("bAt(12, 12)")).toBe('stand_obst');
    // Türen des Stands nur oben (dieselbe Ebene), die des Hauses nur unten
    expect(game("doorsOf('12,12').every(([x, y]) => hillLevel(x, y) === 1)")).toBe(true);
    game("window.__w = { fx: 11, fy: 18, tx: 11, ty: 18, px: 11, py: 18, t: 1, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', home: '12,19' }; setGoal(__w, 'markt')");
    expect(game('__w.goal')).toEqual({ kind: 'markt', k: '12,12' });
    expect(game('__w.path.some(([x, y]) => x === 11 && y === 14)')).toBe(true);
    let n = 0;
    while (n++ < 2000 && !game('__w.inside > 0')) game('stepWalker(__w, 0.05)');
    expect(game('__w.inside > 0')).toBe(true);                                                // angekommen
    expect(game('hillLevel(__w.fx, __w.fy)')).toBe(1);
    // Fahrzeug (ohne Fell, levelLink 'weg') in einer Gasse x = 11: über die Rampe hinauf …
    const drive = () => game(`(() => { const c = { fx: 11, fy: 17, tx: 11, ty: 17, px: 11, py: 17, t: 1, wait: 0, speed: 1 }, ok = (x, y) => x === 11 && walkable(x, y); let top = 0, bad = 0, pf = [11, 17];
      for (let i = 0; i < 600; i++) { stepMover(c, 0.5, ok, false); if (c.fx !== pf[0] || c.fy !== pf[1]) { if (!levelLink(pf[0], pf[1], c.fx, c.fy, 'weg')) bad++; pf = [c.fx, c.fy]; } if (hillLevel(c.fx, c.fy)) top++; }
      return [top > 0, bad]; })()`);
    expect(drive()).toEqual([true, 0]);
    // … über die Treppe nicht (Bewohner schon)
    game("demolish(11, 14); build('huegeltreppe', 11, 14); recalc()");
    expect(game("stairAt(11, 14) != null")).toBe(true);
    expect(drive()).toEqual([false, 0]);
    expect(game("walkPath(11, 17, [[11, 11]]).some(([x, y]) => x === 11 && y === 14)")).toBe(true);
  });

  it('bummelnde Bewohner bleiben auf Weg und Rampe; Park-Spaziergänger und Parade tauchen nur unten auf', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14)");
    expect(game('[wayish(bAt(11, 14)), flatGround(11, 14), flatGround(11, 12), flatGround(11, 16)]')).toEqual([true, false, false, true]);
    // Bewohner, der auf dem Weg vor der Rampe bummelt, geht hinauf und kommt nie seitlich herunter
    weg([[11, 15], [11, 16], [11, 17]]);
    const r = game(`(() => { const w = { fx: 11, fy: 17, tx: 11, ty: 17, px: 11, py: 17, t: 1, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00' }; let top = 0, bad = 0, pf = [11, 17];
      for (let i = 0; i < 3000; i++) { stepMover(w, 0.3, walkable, true); if (w.fx !== pf[0] || w.fy !== pf[1]) { if (edgeBlocks(pf[0], pf[1], w.fx, w.fy)) bad++; pf = [w.fx, w.fy]; } if (hillLevel(w.fx, w.fy)) top++; }
      return [top > 0, bad]; })()`);
    expect(r).toEqual([true, 0]);
  });
});

describe('Zeichnen, Antippen, Sprechblase', () => {
  it('auf Rampe und Treppe: der Keil (und die Stufen davor) kommen über die Figur; nah, weit, nachts ohne Fehler', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewLen = 2; build('huegelrampe', 11, 14); build('huegelrampe', 8, 11); rampNewLen = 1; build('huegelrampe', 14, 11); build('huegeltreppe', 11, 9); build('huegeltreppe', 12, 9); recalc()");
    const at = [[11, 15.1], [11, 14.2], [8.4, 11], [9.3, 11], [14, 11], [11, 9.2], [12, 9.4]];
    game(`walkers.length = 0; for (const [x, y] of ${JSON.stringify(at)}) walkers.push({ fx: Math.round(x), fy: Math.round(y), tx: Math.round(x), ty: Math.round(y), px: x, py: y, t: 0, wait: 99, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', home: '22,22', goal: { kind: 'bummel' } })`);
    expect(game('walkers.map(w => figUp(w) > 0)')).toEqual(at.map(() => true));
    game("window.__c = [0, 0, 0]; { const a = drawHillRampOver, b = drawHillStairOver, f = drawFigure; drawHillRampOver = (...x) => { __c[0]++; return a(...x); }; drawHillStairOver = (...x) => { __c[1]++; return b(...x); }; drawFigure = (...x) => { __c[2]++; return f(...x); }; window.__un = () => { drawHillRampOver = a; drawHillStairOver = b; drawFigure = f; }; }");
    try {
      for (const z of [2.5, 1.2, 0.45]) for (const nt of [0, 0.45]) {
        expect(() => game(`(() => { const n0 = nightAt, sm = syncMovers, st = stepMovers; nightAt = () => ${nt}; syncMovers = () => {}; stepMovers = () => {}; try { cam.z = ${z}; const p = iso(11.5, 11.5); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = n0; syncMovers = sm; stepMovers = st; } })()`)).not.toThrow();
      }
      expect(game('__c[0]')).toBeGreaterThan(0);
      expect(game('__c[1]')).toBeGreaterThan(0);
      // je Figur genau einmal (auch auf der Treppe, die zum Betrachter ansteigt, nur einmal – beschnitten)
      game('__c[2] = 0; for (const w of walkers) drawWalker(w, 2, 0)');
      expect(game('__c[2]')).toBe(at.length);
    } finally { game('__un()'); }
    // Fahrzeug auf der Rampe: angehoben, gerade
    expect(() => game("drawCar({ px: 11, py: 14.3, col: '#f00' }, 2); drawCar({ px: 14, py: 11, bus: true }, 2)")).not.toThrow();
  });

  it('Antippen und Sprechblase sitzen auf der Höhe der Rampe', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14); recalc()");
    game("state.tiles.set('22,22', { b: 'haus', lvl: 1, animal: 1 }); recalc(); walkers.length = 0; walkers.push({ fx: 11, fy: 14, tx: 11, ty: 14, px: 11, py: 14, t: 0, wait: 99, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', home: '22,22', who: 0, goal: { kind: 'bummel' } })");
    const up = game('figUp(walkers[0])');
    expect(up).toBeCloseTo(H * (0.5 + F));                                                     // Fußpunkt 3/32 weiter oben (hinauf nach −y)
    const [hx, hy] = game('walkerHead(walkers[0], cam.z)'), [gx, gy] = game('walkerHead({ ...walkers[0], up: 0 }, cam.z)');
    expect(hx).toBeCloseTo(gx);
    expect(gy - hy).toBeCloseTo(up * 2);
    game(`setTool('look'); tap(${hx}, ${hy + 6 * 2 * 0.7}, false)`);
    expect(panel()).toMatch(/Bummelt/);
    game('closePanel()');
    expect(() => game("speak(walkers[0], 'Hallo von der Rampe!'); drawBubble(cam.z); bubble = null")).not.toThrow();
  });
});

describe('Spaziergänger auf Anhöhen auch über die Rampe', () => {
  beforeEach(() => game("window.__gh = gameHour; gameHour = () => 12; state.tiles.set('22,22', { b: 'haus', lvl: 3, animal: 1 }); recalc()"));
  afterEach(() => game('gameHour = window.__gh'));
  const H_ABS = "(w => w.up == null ? (figUp(w) ?? 0) + hillLift(Math.round(w.px), Math.round(w.py)) : w.up + hillLift(Math.round(w.px), Math.round(w.py)))";
  for (const len of [1, 2]) for (const [ax, ay, rot, foot, top] of SIDES[len]) it(`Länge ${len}, hinauf nach ${['hinten', 'rechts', 'vorn', 'links'][rot]}: kommen vom Weg, steigen stetig hinauf, bummeln oben, gehen wieder`, () => {
    hills(block(10, 10, 13, 13));
    game(`rampNewLen = ${len}; build('huegelrampe', ${ax}, ${ay}); rampNewLen = 1; recalc()`);
    const [dx, dy] = UP[rot];
    weg([1, 2, 3, 4].map(i => [foot[0] - dx * i, foot[1] - dy * i]));
    expect(game('hwStairs().map(s => [s.ramp, s.len, s.x, s.y, s.tx, s.ty])')).toEqual([[true, len, ...foot, ...top]]);
    game('for (let i = 0; i < 12; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBeGreaterThan(0);
    game(`window.__prev = new Map(hillWalkers.map(w => [w, ${H_ABS}(w)])); window.__jump = 0; window.__top = 0; window.__maxH = 0; window.__bad = []`);
    for (let k = 0; k < 150; k++) game(`(() => { for (let i = 0; i < 10; i++) { stepHillWalkers(0.05); if (i === 0) syncHillWalkers();
      for (const w of hillWalkers) { const h = ${H_ABS}(w), p = __prev.has(w) ? __prev.get(w) : h; __jump = Math.max(__jump, Math.abs(h - p)); __prev.set(w, h); __maxH = Math.max(__maxH, h);
        if (w.st === 'up' || w.st === 'down') { const x = Math.round(w.px), y = Math.round(w.py); if (!rampAt(x, y) && hillLevel(x, y) !== 1 && !(x === ${foot[0] - dx} && y === ${foot[1] - dy})) __bad.push('neben ' + w.px + ',' + w.py); }
        if (w.st === 'top') { __top++; if (hillLevel(Math.round(w.px), Math.round(w.py)) !== 1 || w.up !== 0) __bad.push('Kante'); } } } })()`);
    expect(game('__top')).toBeGreaterThan(0);
    expect(game('__bad')).toEqual([]);
    expect(game('__maxH')).toBeCloseTo(H);
    expect(game('__jump')).toBeLessThanOrEqual(H / len * 0.05 * 0.6 + 1e-6);                    // höchstens ein Schritt (Tempo ≤ 0,6) auf der Schräge – auch beim Übergang
    expect(game("walkerDoing(hillWalkers.find(w => w.st === 'top') || hillWalkers[0])")).not.toMatch(/🪜/);
    game('for (const w of hillWalkers) { w.life = -1; w.leave = true; }');
    const seen = new Set();
    for (let k = 0; k < 120 && game('hillWalkers.length'); k++) for (const s of game("(() => { const out = []; for (let i = 0; i < 25; i++) { stepHillWalkers(0.05); for (const w of hillWalkers) out.push(w.st); } return [...new Set(out)]; })()")) seen.add(s);
    expect(game('hillWalkers.length')).toBe(0);
    expect(seen.has('down') && seen.has('out')).toBe(true);
  });

  it('oben auch auf Wegen; Rampe weg: wer darauf ist, ist sofort weg', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14)");
    weg([[11, 15], [11, 16], [11, 17], [11, 13], [11, 12]]);
    expect(game('[hwTileOk(11, 12, 1), hwTileOk(12, 12, 1), hwTileOk(11, 15, 1)]')).toEqual([true, true, false]);
    game('for (let i = 0; i < 8; i++) syncHillWalkers()');
    game("hillWalkers.push({ ...hillWalkers[0], st: 'up', d: 0, wait: 0, sit: false, go: null }); hwOnStair(hillWalkers[hillWalkers.length - 1]); window.__on = hillWalkers[hillWalkers.length - 1]");
    expect(game('__on.up')).toBeGreaterThan(0);
    game('demolish(11, 14); stepHillWalkers(0.05)');
    expect(game('__on.gone && !hillWalkers.includes(__on)')).toBe(true);
  });
});

describe('Tiere bleiben unten', () => {
  it('keine auf Anhöhe, Rampe und Treppe; laufen und fliegen nicht hindurch; Fische tauchen trotz Anhöhe auf der Insel', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14); build('huegeltreppe', 14, 11); recalc()");
    game("for (const [x, y] of [[11, 14], [14, 11], [12, 12]]) state.terra.set(x + ',' + y, 'park'); recalc()");
    expect(game("[natureAt(11, 14, 'mittag').length, natureAt(14, 11, 'mittag').length, natureAt(12, 12, 'mittag').length]")).toEqual([0, 0, 0]);
    // Reh flieht genau auf die Rampe zu: bleibt vor ihr stehen (nie in die Schräge)
    const reh = game(`(() => { const now = 1e6, c = spawnCritter('reh', 11, 16, now); c.x = 11; c.y = 16; c.dir = -Math.PI / 2; c.flee = now; let on = 0;
      for (let t = 0; t < 1800; t += 30) { critterPos(c, now + t); if (c.h < surfaceHeight(c.px, c.py) - 1e-9) on++; } return [on, c.hold === true]; })()`);
    expect(reh).toEqual([0, true]);
    // Fisch im Teich: taucht unter (h < 0) und wieder auf – verschwindet dabei nicht, nur weil es Anhöhen gibt
    game("state.terra.set('18,18', 'water'); recalc(); critters.length = 0");
    const fish = game(`(() => { const now = 1e6, c = spawnCritter('fisch', 18, 18, now), u0 = c.until; let low = 0; for (let t = 0; t < 3000; t += 50) { critterPos(c, now + t); if (c.h < 0) low++; } return [low > 0, c.until === u0]; })()`);
    expect(fish).toEqual([true, true]);
  });
});
