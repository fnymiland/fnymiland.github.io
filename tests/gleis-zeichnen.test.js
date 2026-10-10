const { loadGame, game } = require('./helpers/load-game');

// Gleise zeichnen mit Anhöhen und Gleis-Rampe (draw-objects.js drawRailBed/drawHillFlat, render.js hillFlat; Arme aus railArms, rules.js): Gleise oben liegen nicht im
// Boden-Bild, sondern werden mit ihrer Anhöhe angehoben gezeichnet (wie die Wege oben); Kurven, Weichen und Prellböcke nur aus Nachbarn, mit
// denen das Gleis zusammenhängt (levelLink 'gleis': nie über die Kante, die Rampe an Fuß und Oberkante). Bündig: Gleisbett unten, auf der Rampe
// und oben treffen sich genau (alle Formen, alle Drehungen). Rampenfelder nie als flaches Gleis. Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e9; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; critters.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 3; { const p = iso(16, 16); cam.x = p.x; cam.y = p.y; }');
});
const H = 26;
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) { const e = placeError('schiene', x, y); if (e) throw new Error('Schiene ' + x + ',' + y + ': ' + e); build('schiene', x, y, true); } recalc()`);
// Gleis-Rampe der Form f mit oberem Feld top, hinauf nach STAIR_UP[rot] (Anker = kleinstes x/y)
const buildRamp = (f, rot, [tx, ty]) => game(`(() => {
  const len = RAMP_FORMS['${f}'].len, [Du, Dv] = STAIR_UP[${rot}], fx = ${tx} - (len - 1) * Du, fy = ${ty} - (len - 1) * Dv, ax = Math.min(fx, ${tx}), ay = Math.min(fy, ${ty});
  rampNewForm = '${f}'; buildRot = ${rot}; rotManual = true;
  try { const e = placeError('huegelrampe', ax, ay); if (e) throw new Error('Rampe ${f}${rot}: ' + e); build('huegelrampe', ax, ay); } finally { rotManual = false; buildRot = 0; rampNewForm = 'a'; }
  recalc();
})()`);
const arms = (x, y) => game(`railArms(${x}, ${y}).map(([a, b]) => a + ',' + b).sort()`);
// Zeichnen mitschreiben (wie tests/anhoehe-wege.test.js): g zeichnet nichts, merkt sich jeden Aufruf; poly mit Punkten und Farbe
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  try { ${body}; } finally { g = prev; poly = pp; }
  return calls;
})()`);
const uv = ([X, Y]) => [(X / 32 + Y / 16) / 2, (Y / 16 - X / 32) / 2];
const prellbock = calls => calls.some(c => c.op === 'stroke' && c.stroke === game("C('#d9534a')"));

// Szene: Anhöhe 10–16 × 6–12 (Rand vorn bei y = 12), Einschnitt A bei x = 13 (oben 13,11, Fuß 13,12), Gleis davor und dahinter (Kurve oben),
// ein Gleis oben bis an die Kante (11,12 → 11,11), darunter eins bis an die Wand (11,13 – 11,14), eins oben neben der Wange (14,12 – 15,12)
const sceneA = () => {
  hills(block(10, 6, 16, 12));
  buildRamp('a', 0, [13, 11]);
  rails([[13, 13], [13, 14], [13, 10], [13, 9], [14, 9], [11, 12], [11, 11], [11, 13], [11, 14], [14, 12], [15, 12]]);
};

describe('Gleise auf Anhöhen: wer mit wem verbunden gezeichnet wird', () => {
  it('nie über die Kante (dort Prellbock), die Rampe ist ein Arm an Fuß und Oberkante, nie an ihrer Seite', () => {
    sceneA();
    expect(game('[rampAt(13, 12).i, rampAt(13, 11).i, hillLevel(13, 10), hillLevel(13, 13)]')).toEqual([0, 1, 1, 0]);
    expect(arms(13, 13)).toEqual(['0,-1', '0,1']);                                           // unten vor dem Fuß: zur Rampe weiter
    expect(arms(13, 10)).toEqual(['0,-1', '0,1']);                                           // oben hinter der Oberkante: zur Rampe hinab
    expect(arms(13, 9)).toEqual(['0,1', '1,0']);                                             // oben: Kurve wie am Boden
    expect(arms(11, 12)).toEqual(['0,-1']);                                                  // oben an der Kante: nicht hinunter
    expect(arms(11, 13)).toEqual(['0,1']);                                                   // unten an der Wand: nicht hinauf
    expect(arms(14, 12)).toEqual(['1,0']);                                                   // oben neben der Wange: nicht in die Seite der Rampe
    const bed = (x, y) => record(`drawRailBed(0, 0, 1, ${x}, ${y}, state.tiles.get('${x},${y}'))`);
    expect(prellbock(bed(11, 12))).toBe(true);
    expect(prellbock(bed(11, 13))).toBe(true);
    expect(prellbock(bed(14, 12))).toBe(true);
    expect(prellbock(bed(13, 13))).toBe(false);                                              // läuft auf die Rampe
    expect(prellbock(bed(13, 10))).toBe(false);
  });

  it('Gleis-Ebenen: zwei Anhöhen-Ebenen nebeneinander hängen nicht zusammen, gleiche Ebene oben schon', () => {
    hills(block(10, 6, 14, 10));
    game("state.hills.get('12,8').h = 2; groundVersion++; recalc()");                       // Ebene 2 (Fundament)
    expect(game('[hillLevel(12, 8), hillLevel(11, 8)]')).toEqual([2, 1]);
    game("for (const k of ['11,8', '12,8', '13,8', '11,7', '11,9']) state.tiles.set(k, { b: 'schiene', lvl: 1 }); groundVersion++; recalc()");
    expect(arms(11, 8)).toEqual(['0,-1', '0,1']);
    expect(arms(12, 8)).toEqual([]);
  });

  it('Zuschnitt oben: an der Kante genau auf der Raute, zu Nachbarn oben ein Stück darüber, zur Rampe nur GR_E (sie ist schräg)', () => {
    sceneA();
    const clipOf = (x, y) => {
      const calls = record(`drawHillFlat(0, 0, 1, ${x}, ${y}, state.tiles.get('${x},${y}'))`);
      let pts = [];
      for (const c of calls) { if (c.op === 'beginPath') pts = []; else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a); else if (c.op === 'clip') break; }
      const P = pts.map(uv);
      return [Math.min(...P.map(p => p[0])), Math.max(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[1]))].map(v => Math.round(v * 1e4) / 1e4);
    };
    const E = game('GR_E');
    expect(clipOf(13, 10)).toEqual([-0.56, 0.56, -0.56, 0.5 + E]);                          // vorn (+y) die Oberkante der Rampe
    expect(clipOf(11, 12)).toEqual([-0.56, 0.56, -0.56, 0.5]);                               // vorn (+y) die Kante, sonst Anhöhe ringsum
  });
});

describe('Gleise auf Anhöhen: wo und wann gezeichnet', () => {
  // Zeichenaufrufe eines Bilds: Anhöhe, Gleis (am Boden bzw. oben), Dinge
  const order = (z, now = 1e6) => game(`(() => {
    const log = [], dt = drawHillTile, dh = drawHillFlat, dr = drawRailBed, dc = drawCrossing;
    let inHill = null, ty = 0;
    ctx.translate = (x, y) => { ty = y; };                                                    // Dinge zeichnet tileA um ihre Mitte verschoben
    drawHillTile = (x, y, ...a) => { log.push(['hill', x + ',' + y]); return dt(x, y, ...a); };
    drawHillFlat = (cx, cy, z, x, y, t) => { inHill = x + ',' + y; log.push(['up', x + ',' + y, Math.round(cy * 100) / 100]); try { return dh(cx, cy, z, x, y, t); } finally { inHill = null; } };
    drawRailBed = (cx, cy, z, x, y, t) => { log.push([inHill ? 'railUp' : 'rail', x + ',' + y]); return dr(cx, cy, z, x, y, t); };
    drawCrossing = (cx, cy, z, x, y, t, now) => { log.push(['cross', x + ',' + y, Math.round((ty + cy) * 100) / 100]); return dc(cx, cy, z, x, y, t, now); };
    try { cam.z = ${z}; resetDrawCaches(); spriteNoBudget = true; render(${now}); } finally { drawHillTile = dt; drawHillFlat = dh; drawRailBed = dr; drawCrossing = dc; spriteNoBudget = false; delete ctx.translate; }
    return log;
  })()`);
  it('nah: Gleise oben fehlen am Boden, oben angehoben nach ihrer Anhöhe; Rampenfelder nie als flaches Gleis; unten wie bisher', () => {
    sceneA();
    game('{ const p = iso(13, 11); cam.x = p.x; cam.y = p.y; }');
    const log = order(3);
    const i = (op, k) => log.findIndex(l => l[0] === op && l[1] === k);
    for (const k of ['13,10', '13,9', '14,9', '11,12', '11,11']) {
      expect(i('rail', k)).toBe(-1);                                                        // nicht flach am Boden
      expect(i('hill', k)).toBeGreaterThan(-1);
      expect(i('up', k)).toBeGreaterThan(i('hill', k));
      expect(i('railUp', k)).toBeGreaterThan(i('up', k));
    }
    const up = log.find(l => l[0] === 'up' && l[1] === '13,10')[2];
    expect(up).toBeCloseTo(game('toScreen(13, 10).y - HILL_H * cam.z'), 6);
    for (const k of ['13,12', '13,11']) expect(log.some(l => (l[0] === 'rail' || l[0] === 'railUp') && l[1] === k)).toBe(false);   // Rampe
    for (const k of ['13,13', '13,14', '11,13']) expect(i('rail', k)).toBeGreaterThan(-1);  // unten wie bisher
  });

  it('Boden-Bild (Zwischenspeicher) und weit weg: Gleise oben und Rampenfelder nie darin, oben als eigenes Bildchen', () => {
    sceneA();
    const inChunks = game(`(() => { const ks = new Set(), dr = drawRailBed; drawRailBed = (cx, cy, z, x, y, t) => { ks.add(x + ',' + y); return dr(cx, cy, z, x, y, t); };
      try { for (let cy = 0; cy <= 3; cy++) for (let cx = 0; cx <= 3; cx++) renderGroundChunk(cx, cy, 1); } finally { drawRailBed = dr; } return [...ks].sort(); })()`);
    expect(inChunks).toEqual(['11,13', '11,14', '13,13', '13,14']);
    game('{ const p = iso(13, 11); cam.x = p.x; cam.y = p.y; }');
    order(0.9);                                                                              // (Dämmerung: auch das Nachtbild je Feld – einmal zählen)
    expect(game("[...new Set([...objSprites.keys()].filter(k => k.startsWith('hflat|')).map(k => k.split('|')[1]))].sort()")).toEqual(['11,11', '11,12', '13,10', '13,9', '14,12', '14,9', '15,12']);
    expect(game('liveFlatSet().size')).toBe(0);
  });

  it('Bahnübergang oben: Wegbelag quer über das Gleis oben, Schranken angehoben als Ding des Felds', () => {
    hills(block(10, 6, 16, 12));
    rails([[13, 8], [13, 9], [13, 10]]);
    game("for (const [x, y] of [[12, 9], [14, 9]]) build('weg', x, y, true); build('weg', 13, 9, true); recalc()");
    expect(game("[isCrossing(state.tiles.get('13,9')), JSON.stringify(railArms(13, 9))]")).toEqual([true, '[[0,1],[0,-1]]']);
    game('{ const p = iso(13, 9); cam.x = p.x; cam.y = p.y; }');
    const log = order(3);
    const i = (op, k) => log.findIndex(l => l[0] === op && l[1] === k);
    expect(i('railUp', '13,9')).toBeGreaterThan(i('up', '13,9'));
    expect(i('cross', '13,9')).toBeGreaterThan(i('railUp', '13,9'));
    expect(log.find(l => l[0] === 'cross' && l[1] === '13,9')[2]).toBeCloseTo(game('toScreen(13, 9).y - HILL_H * cam.z'), 6);
    // der Belag quer liegt im Gleisbett des Felds (Wegarme oben, nie über die Kante)
    const st = game("C(lookFar(pathLook(styleDef('weg', state.tiles.get('13,9').style).id), 3).fill || '#dcc69d')");
    expect(record("drawHillFlat(0, 0, 3, 13, 9, state.tiles.get('13,9'))").some(c => c.op === 'poly' && c.fill === st)).toBe(true);
  });
});

describe('bündig: Gleis unten → Gleis-Rampe → Gleis oben, alle Formen und Drehungen', () => {
  // Weltpunkt (u, v) auf dem Bildschirm bei Zoom 1, Höhe up
  const scr = (u, v, up = 0) => [(u - v) * 32, (u + v) * 16 - up];
  const near = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;
  const has = (polys, p) => polys.some(c => c.pts.some(q => near(q, p)));
  for (const f of ['a', 'b', 'c', 'd']) for (let rot = 0; rot < 4; rot++) it(`${f.toUpperCase()}, hinauf nach ${['−y', '+x', '+y', '−x'][rot]}`, () => {
    const [Du, Dv] = [[0, -1], [1, 0], [0, 1], [-1, 0]][rot], Su = -Dv, Sv = Du;
    const P = (d, s) => [16 + Du * d + Su * s, 16 + Dv * d + Sv * s];                    // d längs (0 = oberes Feld), s quer
    const len = game(`RAMP_FORMS['${f}'].len`), cut = game(`RAMP_FORMS['${f}'].cut`), d0 = cut ? -cut + 1 : 1;
    const cells = [];
    for (let d = d0; d <= 4; d++) for (let s = -3; s <= 3; s++) cells.push(P(d, s));
    hills(cells);
    buildRamp(f, rot, P(0, 0));
    const [Fx, Fy] = P(-(len - 1), 0), [Tx, Ty] = P(0, 0), [Gx, Gy] = P(-len, 0), [Ux, Uy] = P(1, 0);
    rails([[Gx, Gy], P(-len - 1, 0), [Ux, Uy], P(2, 0)]);
    expect(game(`[rampAt(${Fx}, ${Fy}).i, rampAt(${Tx}, ${Ty}).i, rampAt(${Tx}, ${Ty}).form]`)).toEqual([0, len - 1, f]);
    expect(arms(Gx, Gy)).toContain(`${Du},${Dv}`);
    expect(arms(Ux, Uy)).toContain(`${-Du},${-Dv}`);
    const edge = game(`C(railLookOf(state.tiles.get('${Gx},${Gy}')).edge)`), w = game('RAIL_W + 0.03');
    // Gleisbett unten (Arm zum Fuß) und oben (Arm zur Oberkante, angehoben)
    const ground = record(`drawRailBed(${scr(Gx, Gy)}, 1, ${Gx}, ${Gy}, state.tiles.get('${Gx},${Gy}'))`).filter(c => c.op === 'poly' && c.fill === edge);
    const top = record(`drawHillFlat(${scr(Ux, Uy, H)}, 1, ${Ux}, ${Uy}, state.tiles.get('${Ux},${Uy}'))`).filter(c => c.op === 'poly' && c.fill === edge);
    // die Rampe selbst (Fuß und oberes Feld) wie im Bildchen, aber in Weltpunkten
    const ramp = (x, y) => record(`paintRamp((u, v, up = 0) => [(${x} + u - ${y} - v) * 32, (${x} + u + ${y} + v) * 16 - up], rampLook(${x}, ${y}, rampAt(${x}, ${y})), ${x}, ${y})`).filter(c => c.op === 'poly' && c.fill === edge);
    const foot = ramp(Fx, Fy), upper = ramp(Tx, Ty);
    for (const s of [-w, w]) {
      const pf = scr(Fx - Du * 0.5 + Su * s, Fy - Dv * 0.5 + Sv * s), pt = scr(Tx + Du * 0.5 + Su * s, Ty + Dv * 0.5 + Sv * s, H);
      expect(has(ground, pf)).toBe(true);                                                     // Bettkante unten endet an der Vorderkante des Fußes …
      expect(has(foot, pf)).toBe(true);                                                       // … genau dort beginnt die der Rampe (Höhe 0)
      expect(has(upper, pt)).toBe(true);                                                      // oben endet sie an der Hinterkante (Höhe HILL_H) …
      expect(has(top, pt)).toBe(true);                                                        // … genau dort beginnt die des Gleises oben
    }
    expect(prellbock(record(`drawRailBed(0, 0, 1, ${Gx}, ${Gy}, state.tiles.get('${Gx},${Gy}'))`))).toBe(false);
    expect(prellbock(record(`drawHillFlat(0, 0, 1, ${Ux}, ${Uy}, state.tiles.get('${Ux},${Uy}'))`))).toBe(false);
  });
});

describe('ohne Anhöhen wie vorher', () => {
  it('Arme wie früher (nur Nachbar-Schienen, Einfahrt, Hbf-Ausfahrt); drawHillFlat läuft gar nicht', () => {
    rails([[5, 5], [6, 5], [7, 5], [8, 5], [8, 6], [8, 7], [6, 6], [6, 7], [10, 5], [11, 5], [12, 5], [12, 6], [13, 6]]);
    game("build('weg', 11, 4, true); build('weg', 11, 6, true); build('weg', 11, 5, true); recalc()");   // Bahnübergang
    expect(game("isCrossing(state.tiles.get('11,5'))")).toBe(true);
    const list = game("[...state.tiles].filter(([, t]) => t.b === 'schiene').map(([k]) => keyXY(k))");
    expect(list.length).toBe(13);
    // so rechnete railArms vor den Anhöhen (Stand vor der Gleis-Rampe)
    const old = (x, y) => `(() => { const e = GEXIT.get(${x} + ',' + ${y}); return DIRS.filter(([dx, dy]) => bAt(${x} + dx, ${y} + dy) === 'schiene' || (isEinfahrt(${x} + dx, ${y} + dy) && trackLink(${x}, ${y}, ${x} + dx, ${y} + dy)) || (e && e[0] === dx && e[1] === dy)); })()`;
    for (const [x, y] of list) expect(game(`JSON.stringify(railArms(${x}, ${y})) === JSON.stringify(${old(x, y)})`)).toBe(true);
    const n = game(`(() => { const dh = drawHillFlat; let n = 0; drawHillFlat = (...a) => { n++; return dh(...a); };
      try { const p = iso(9, 6); cam.x = p.x; cam.y = p.y; for (const z of [3, 1.5, 0.8]) { cam.z = z; resetDrawCaches(); spriteNoBudget = true; render(1e6); } } finally { drawHillFlat = dh; spriteNoBudget = false; } return n; })()`);
    expect(n).toBe(0);
  });
});
