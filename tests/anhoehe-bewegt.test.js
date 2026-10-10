const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2, Bewegtes (movers.js, hill-walkers.js): Bewohner gehen über die Treppe hinauf (walkable, edgeBlocks = levelLink 'fuss'),
// nie über die Gleis-Rampe (Nutzer 10.10.2026: „nur für Züge“, „Autos soll es nie geben“); Fahrzeuge kommen nie hinauf. Höhe auf der Treppe am
// gezeichneten Fußpunkt (figUp, slopeUp); Stufen davor kommen über die Figur; Spaziergänger nur über Treppen; Tiere bleiben unten (auch nicht
// auf die Gleis-Rampe). Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; critters.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const panel = () => game("document.getElementById('panel').textContent");
const H = 26, F = 3 / 32;                                                // Fußpunkt: 6 Punkte rechts = (3/32, −3/32) Feld
// Treppe vor jeder Seite der Anhöhe 10–13 × 10–13: Feld, Drehung (hinauf: STAIR_UP[rot])
const SIDES = { 1: [[11, 14, 0], [14, 11, 3], [11, 9, 2], [9, 11, 1]] };
const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// Anker (kleinstes x/y) einer Gleis-Rampe mit Fuß (fx, fy), Drehung rot und Länge len
const anchor = (fx, fy, rot, len) => { const [Du, Dv] = UP[rot]; return [Math.min(fx, fx + (len - 1) * Du), Math.min(fy, fy + (len - 1) * Dv)]; };
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

describe('Bewohner über die Treppe, nie über die Gleis-Rampe (Stufe 2)', () => {
  it('Gleis-Rampe (alle Formen, alle Drehungen): kein Weg über sie, nicht darauf, nicht von der Seite – Wege davor und dahinter bleiben getrennt', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      game("state.hills.clear(); for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(11, 11, 17, 17));
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut;
      for (const [fx, fy, rot] of [[14, 18 + o, 0], [18 + o, 14, 3], [14, 10 - o, 2], [10 - o, 14, 1]]) {
        const [ax, ay] = anchor(fx, fy, rot, len), [dx, dy] = UP[rot];
        game(`rampNewForm = '${form}'; buildRot = ${rot}; rotManual = true`);
        expect([form, rot, game(`build('huegelrampe', ${ax}, ${ay})`)]).toEqual([form, rot, true]);
        game('rotManual = false');
        const below = [fx - dx, fy - dy], above = [fx + len * dx, fy + len * dy], side = [fx - dy, fy + dx];
        weg([below, [below[0] - dx, below[1] - dy], above]);
        expect([form, rot, game(`walkPath(${below}, [[${above}]])`)]).toEqual([form, rot, null]);
        expect([form, rot, game(`walkPath(${above}, [[${below}]])`)]).toEqual([form, rot, null]);
        expect([form, rot, game(`[walkable(${fx}, ${fy}), walkable(${fx}, ${fy}, true), wayish(bAt(${fx}, ${fy})), flatGround(${fx}, ${fy})]`)]).toEqual([form, rot, [false, false, false, false]]);
        expect([form, rot, game(`[!!edgeBlocks(${below}, ${fx}, ${fy}), !!edgeBlocks(${side}, ${fx}, ${fy}), levelLink(${below}, ${fx}, ${fy}, 'fuss')]`)]).toEqual([form, rot, [true, true, false]]);
      }
    }
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

  it('Markt oben: Bewohner gehen über die Treppe hin, ins Feld davor; Fahrzeuge kommen nie hinauf (weder über die Treppe noch über die Gleis-Rampe)', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegeltreppe', 11, 14)");
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
    // Fahrzeug (ohne Fell, levelLink 'fahr') in einer Gasse x = 11: nicht über die Treppe …
    const drive = () => game(`(() => { const c = { fx: 11, fy: 17, tx: 11, ty: 17, px: 11, py: 17, t: 1, wait: 0, speed: 1 }, ok = (x, y) => x === 11 && walkable(x, y); let top = 0, bad = 0, pf = [11, 17];
      for (let i = 0; i < 600; i++) { stepMover(c, 0.5, ok, false); if (c.fx !== pf[0] || c.fy !== pf[1]) { if (!levelLink(pf[0], pf[1], c.fx, c.fy, 'fahr')) bad++; pf = [c.fx, c.fy]; } if (hillLevel(c.fx, c.fy)) top++; }
      return [top > 0, bad]; })()`);
    expect(drive()).toEqual([false, 0]);
    // … und nicht über die Gleis-Rampe (Damm B an derselben Stelle); Bewohner auch nicht
    game("demolish(11, 14); state.tiles.delete('11,15'); state.tiles.delete('11,16'); recalc(); rampNewForm = 'b'; build('huegelrampe', 11, 14); recalc()");
    expect(game("rampAt(11, 16) && rampAt(11, 16).i")).toBe(0);
    expect(drive()).toEqual([false, 0]);
    expect(game("walkPath(11, 18, [[11, 12]])")).toBe(null);
  });

  it('bummelnde Bewohner bleiben auf Weg und Treppe; die Gleis-Rampe ist kein Weg; Park-Spaziergänger und Parade tauchen nur unten auf', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 12, 14); build('huegeltreppe', 11, 14)");   // Damm 12,14 … 12,16, daneben die Treppe
    expect(game('[wayish(bAt(12, 15)), flatGround(12, 15), flatGround(12, 14), flatGround(11, 14), flatGround(11, 12), flatGround(12, 17)]')).toEqual([false, false, false, false, false, true]);
    // Bewohner, der auf dem Weg vor der Treppe bummelt, geht hinauf und kommt nie seitlich herunter (auch nicht über die Gleis-Rampe)
    weg([[11, 15], [11, 16], [11, 17], [12, 17]]);
    const r = game(`(() => { const w = { fx: 11, fy: 17, tx: 11, ty: 17, px: 11, py: 17, t: 1, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00' }; let top = 0, bad = 0, ramp = 0, pf = [11, 17];
      for (let i = 0; i < 3000; i++) { stepMover(w, 0.3, walkable, true); if (w.fx !== pf[0] || w.fy !== pf[1]) { if (edgeBlocks(pf[0], pf[1], w.fx, w.fy)) bad++; pf = [w.fx, w.fy]; } if (hillLevel(w.fx, w.fy)) top++; if (rampAt(w.fx, w.fy)) ramp++; }
      return [top > 0, bad, ramp]; })()`);
    expect(r).toEqual([true, 0, 0]);
  });
});

describe('Zeichnen, Antippen, Sprechblase', () => {
  it('auf der Treppe: die Stufen davor kommen über die Figur; neben der Gleis-Rampe wird nichts nachgemalt; nah, weit, nachts ohne Fehler', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); rampNewForm = 'd'; build('huegelrampe', 14, 11); build('huegeltreppe', 11, 9); build('huegeltreppe', 12, 9); recalc()");
    const at = [[11, 9.2], [12, 9.4]], ground = [[11, 17.2], [15.5, 12.2]];
    game(`walkers.length = 0; for (const [x, y] of ${JSON.stringify([...at, ...ground])}) walkers.push({ fx: Math.round(x), fy: Math.round(y), tx: Math.round(x), ty: Math.round(y), px: x, py: y, t: 0, wait: 99, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', home: '22,22', goal: { kind: 'bummel' } })`);
    expect(game('walkers.map(w => figUp(w) > 0)')).toEqual([true, true, false, false]);
    game("window.__c = [0, 0, 0]; { const a = drawHillRampOver, b = drawHillStairOver, f = drawFigure; drawHillRampOver = (...x) => { __c[0]++; return a(...x); }; drawHillStairOver = (...x) => { __c[1]++; return b(...x); }; drawFigure = (...x) => { __c[2]++; return f(...x); }; window.__un = () => { drawHillRampOver = a; drawHillStairOver = b; drawFigure = f; }; }");
    try {
      for (const z of [2.5, 1.2, 0.45]) for (const nt of [0, 0.45]) {
        expect(() => game(`(() => { const n0 = nightAt, sm = syncMovers, st = stepMovers; nightAt = () => ${nt}; syncMovers = () => {}; stepMovers = () => {}; try { cam.z = ${z}; const p = iso(11.5, 11.5); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = n0; syncMovers = sm; stepMovers = st; } })()`)).not.toThrow();
      }
      expect(game('__c[0]')).toBe(0);                                                          // ohne Zug: nichts über die Rampe
      expect(game('__c[1]')).toBeGreaterThan(0);
      // je Figur genau einmal (auch auf der Treppe, die zum Betrachter ansteigt, nur einmal – beschnitten)
      game('__c[2] = 0; for (const w of walkers) drawWalker(w, 2, 0)');
      expect(game('__c[2]')).toBe(at.length + ground.length);
    } finally { game('__un()'); }
    expect(() => game("drawCar({ px: 11, py: 18.3, col: '#f00' }, 2); drawCar({ px: 18, py: 12, bus: true }, 2)")).not.toThrow();
  });
});

describe('Spaziergänger auf Anhöhen nur über die Treppe', () => {
  beforeEach(() => game("window.__gh = gameHour; gameHour = () => 12; state.tiles.set('22,22', { b: 'haus', lvl: 3, animal: 1 }); recalc()"));
  afterEach(() => game('gameHour = window.__gh'));
  it('an Gleis-Rampen (A, B) mit Weg bis an den Fuß kommt keiner hinauf; mit einer Treppe schon – und nur über sie', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 12); rampNewForm = 'b'; build('huegelrampe', 14, 11)");   // A vorn (11,12 oben, 11,13 Fuß), B rechts (14,11 oben … 16,11 Fuß)
    weg([[11, 14], [11, 15], [11, 16], [17, 11], [18, 11], [19, 11], [11, 11], [15, 12]]);
    expect(game('hillRamps().length')).toBe(2);
    expect(game('hwStairs()')).toEqual([]);
    game('for (let i = 0; i < 12; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBe(0);
    game("build('huegeltreppe', 12, 14); build('weg', 12, 15, true); recalc()");
    expect(game('hwStairs().map(s => [s.x, s.y, s.len, "ramp" in s])')).toEqual([[12, 14, 1, false]]);
    game('for (let i = 0; i < 12; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBeGreaterThan(0);
    const bad = game(`(() => { let bad = 0; for (let i = 0; i < 1500; i++) { stepHillWalkers(0.05); if (i % 10 === 0) syncHillWalkers(); for (const w of hillWalkers) if (rampAt(Math.round(w.px), Math.round(w.py))) bad++; } return bad; })()`);
    expect(bad).toBe(0);
  });
});

describe('Tiere bleiben unten', () => {
  it('keine auf Anhöhe, Gleis-Rampe und Treppe; laufen und fliegen nicht hindurch; Fische tauchen trotz Anhöhe auf der Insel', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); build('huegeltreppe', 14, 11); recalc()");   // Damm 11,14 … 11,16
    game("for (const [x, y] of [[11, 14], [14, 11], [12, 12]]) state.terra.set(x + ',' + y, 'park'); recalc()");
    expect(game("[natureAt(11, 14, 'mittag').length, natureAt(14, 11, 'mittag').length, natureAt(12, 12, 'mittag').length]")).toEqual([0, 0, 0]);
    // Reh flieht genau auf die Rampe zu: bleibt vor ihr stehen (nie in die Schräge)
    const reh = game(`(() => { const now = 1e6, c = spawnCritter('reh', 11, 18, now); c.x = 11; c.y = 18; c.dir = -Math.PI / 2; c.flee = now; let on = 0;
      for (let t = 0; t < 1800; t += 30) { critterPos(c, now + t); if (c.h < surfaceHeight(c.px, c.py) - 1e-9) on++; } return [on, c.hold === true]; })()`);
    expect(reh).toEqual([0, true]);
    // Fisch im Teich: taucht unter (h < 0) und wieder auf – verschwindet dabei nicht, nur weil es Anhöhen gibt
    game("state.terra.set('18,18', 'water'); recalc(); critters.length = 0");
    const fish = game(`(() => { const now = 1e6, c = spawnCritter('fisch', 18, 18, now), u0 = c.until; let low = 0; for (let t = 0; t < 3000; t += 50) { critterPos(c, now + t); if (c.h < 0) low++; } return [low > 0, c.until === u0]; })()`);
    expect(fish).toEqual([true, true]);
  });
});
