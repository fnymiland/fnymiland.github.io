const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2 – Wege zeichnen (render.js, draw-objects.js): Wege oben liegen nicht im Boden-Bild, sondern werden mit der Anhöhe angehoben
// gezeichnet (tileA: nach ihr, vor ihrer Vorschau und dem, was auf ihnen steht); Arme, Platz-Ecken, Bordsteine, Wegenden und Vorplätze nur
// zu Nachbarn, mit denen das Wegenetz zusammenhängt (levelLink) – nie über die Kante, die Rampe an Fuß und Oberkante. Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 34; y++) for (let x = 4; x <= 34; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); hillWalkers.length = 0; walkers.length = 0; critters.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 3; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()`);
const weg = (cells, st = 'kopf', extra = {}) => game(`for (const [x, y] of ${JSON.stringify(cells)}) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: '${st}', ...${JSON.stringify(extra)} }); groundVersion++; recalc()`);
const ramp = (x, y, rot, len = 1) => game(`state.tiles.set('${x},${y}', { b: 'huegelrampe', lvl: 1, rot: ${rot}, style: 'kopf'${len === 2 ? ', len: 2' : ''} }); groundVersion++; recalc()`);
const arms = (x, y) => game(`pathArms(${x}, ${y}).map(([a, b]) => a + ',' + b).sort()`);
const quads = (x, y) => game(`pathQuads(${x}, ${y}).map(([a, b]) => a + ',' + b).sort()`);
// Zeichnen mitschreiben (wie tests/treppe-buendig.test.js): g zeichnet nichts, merkt sich jeden Aufruf; poly mit Punkten und Farbe
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  try { ${body}; } finally { g = prev; poly = pp; }
  return calls;
})()`);
// Bildpunkt (Zoom 1, Feldmitte bei 0, 0) → Feldkoordinaten
const uv = ([X, Y]) => [(X / 32 + Y / 16) / 2, (Y / 16 - X / 32) / 2];

describe('Wege auf Anhöhen: wer mit wem verbunden gezeichnet wird', () => {
  it('Arme nie über die Kante; Rampe und Treppe sind ein Arm an Fuß und Oberkante, nicht an ihrer Seite', () => {
    hills(block(10, 10, 13, 13));
    weg([[11, 12], [11, 13], [12, 13], [11, 14], [11, 15], [12, 15], [13, 14], [10, 15], [10, 16]]);
    ramp(12, 14, 0);                                                                          // vor der Wand 12,13, hinauf nach −y
    game("state.tiles.set('10,14', { b: 'huegeltreppe', lvl: 1, rot: 0, style: 'kopf' }); groundVersion++; recalc()");
    expect(arms(11, 13)).toEqual(['0,-1', '1,0']);                                            // oben: nicht hinunter zu 11,14
    expect(arms(11, 14)).toEqual(['0,1']);                                                    // unten: nicht hinauf, nicht in die Seite der Rampe
    expect(arms(12, 15)).toEqual(['-1,0', '0,-1']);                                           // Fuß der Rampe
    expect(arms(12, 13)).toEqual(['-1,0', '0,1']);                                            // Oberkante der Rampe
    expect(arms(13, 14)).toEqual([]);                                                         // an der Seite der Rampe: Wegende
    expect(arms(10, 15)).toEqual(['0,-1', '0,1', '1,0']);                                     // vor der Treppe: ein Arm (Wegenetz, seit 10.10.2026)
    expect(game("hillEnds(10, 15, state.tiles.get('10,15'), [[0, -1]])")).toEqual([[0, -1]]);
  });

  it('Wegende über einem Gebäude unten endet rund (gerade bis an den Rand nur, wenn gewählt); kein Gartenweg-Anschluss über die Kante', () => {
    hills(block(10, 10, 13, 13));
    weg([[11, 12], [11, 13]]);
    game("state.tiles.set('11,14', { b: 'haus', lvl: 1, rot: 3 }); recalc()");                // Tür nach −y, zum Weg oben
    expect(game('pathEnds(11, 13, state.tiles.get("11,13"), pathArms(11, 13))')).toEqual([[0, 1]]);   // pathEnds sieht nur „Gebäude daneben“
    expect(game('hillEnds(11, 13, state.tiles.get("11,13"), [[0, 1]])')).toEqual([]);
    expect(game('hillEnds(11, 13, { ...state.tiles.get("11,13"), end: "rand" }, [[0, 1]])')).toEqual([[0, 1]]);
    expect(game('courtLinksAt(11, 13)')).toEqual([]);
    // dasselbe unten: wie bisher
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(game('hillEnds(11, 13, state.tiles.get("11,13"), [[0, 1]])')).toEqual([[0, 1]]);
    expect(game('courtLinksAt(11, 13).length')).toBe(1);
  });

  it('Platz-Ecken nur, wo alle vier Felder zusammenhängen; vor und hinter einer breiten Rampe schließt sich der Belag über ihre ganze Breite', () => {
    hills(block(10, 10, 13, 13));
    weg(block(10, 10, 11, 11));
    weg([[12, 13], [13, 13], [12, 14], [13, 14]]);                                            // 2×2 über die Kante
    expect(quads(10, 10)).toEqual(['1,1']);
    expect(quads(12, 13)).toEqual([]);
    expect(quads(12, 14)).toEqual([]);
    game("for (const k of ['12,13', '13,13', '12,14', '13,14']) state.tiles.delete(k); recalc()");
    ramp(11, 14, 0); ramp(12, 14, 0);                                                         // breite Rampe
    weg([[11, 15], [12, 15], [11, 13], [12, 13]]);
    expect(quads(11, 15)).toEqual(['1,-1']);
    expect(quads(12, 15)).toEqual(['-1,-1']);
    expect(quads(11, 13)).toEqual(['1,1']);
    expect(quads(12, 13)).toEqual(['-1,1']);
    game("state.tiles.delete('12,14'); groundVersion++; recalc()");                          // nur noch eine Rampe: dort bleibt Wiese
    expect(quads(11, 15)).toEqual([]);
  });

  it('breiter Weg oben: Bordstein an der Kante (auch über einem breiten Weg unten); vor der Rampe Lücke so breit wie ihre Fahrbahn', () => {
    hills(block(10, 10, 13, 13));
    weg([[11, 13]], 'kopf', { wide: true }); weg([[11, 14]], 'kopf', { wide: true });
    const curbFront = () => record("drawPath(0, 0, 1, 11, 13, state.tiles.get('11,13'))").filter(c => c.op === 'poly' && c.fill === game("C(pathLook('kopf').edge)")
      && c.pts.every(p => uv(p)[1] > 0.44)).length;
    expect(curbFront()).toBeGreaterThan(0);
    game("state.hills.clear(); groundVersion++; recalc()");
    expect(curbFront()).toBe(0);                                                              // unten an einem breiten Weg: kein Bordstein (wie bisher)
    hills(block(10, 10, 13, 13));
    ramp(12, 14, 0);
    expect(game('rampLane(12, 15, 0, -1)')).toEqual([-0.4, 0.4]);                             // Keil mit Geländer an beiden Seiten
    game("state.hills.delete('12,13'); state.tiles.delete('12,14'); groundVersion++; recalc()");
    ramp(12, 13, 0);                                                                          // in den Rand eingelassen: Wangen beidseits
    expect(game('rampLane(12, 14, 0, -1)')).toEqual([-0.5, 0.5]);
    expect(game('rampLane(11, 14, 0, -1)')).toBe(null);
  });

  it('Vorplatz eines Gebäudes unten läuft nicht bis an die Kante, als wäre oben Weg ringsum', () => {
    hills(block(10, 8, 13, 9));
    weg(block(10, 8, 13, 9));
    game("state.tiles.set('11,10', { b: 'bibliothek', lvl: 1, rot: 1 }); recalc()");
    const open = () => game("(() => { const t = state.tiles.get('11,10'); const o = courtOpenSides(kit(0, 0, 1, t.rot), t, 11, 10); return [o.back, o.lo, o.hi]; })()");
    expect(open()[0]).toBe(false);
    game("state.hills.clear(); groundVersion++; recalc()");
    expect(open()[0]).toBe(true);
  });
});

describe('Wege auf Anhöhen: wo und wann gezeichnet', () => {
  // Reihenfolge der Zeichenaufrufe in einem Bild: Anhöhe, Weg (am Boden bzw. oben), Dinge
  const order = (z, now = 1e6) => game(`(() => {
    const log = [], dt = drawHillTile, dh = drawHillFlat, dp = drawPath, dobj = drawObject;
    let inHill = null;
    drawHillTile = (x, y, ...a) => { log.push(['hill', x + ',' + y]); return dt(x, y, ...a); };
    drawHillFlat = (cx, cy, z, x, y, t) => { inHill = x + ',' + y; log.push(['up', x + ',' + y, Math.round(cy * 100) / 100]); try { return dh(cx, cy, z, x, y, t); } finally { inHill = null; } };
    drawPath = (cx, cy, z, x, y, t) => { log.push([inHill ? 'pathUp' : 'path', x + ',' + y]); return dp(cx, cy, z, x, y, t); };
    drawObject = (b, ...a) => { log.push(['obj', a[4] + ',' + a[5], b]); return dobj(b, ...a); };
    try { cam.z = ${z}; resetDrawCaches(); spriteNoBudget = true; render(${now}); } finally { drawHillTile = dt; drawHillFlat = dh; drawPath = dp; drawObject = dobj; spriteNoBudget = false; }
    return log;
  })()`);
  it('nah: Wege oben fehlen am Boden, oben angehoben nach ihrer Anhöhe und vor dem Stand darauf; unten wie bisher', () => {
    hills(block(10, 10, 12, 12));
    weg([[10, 11], [11, 11], [12, 11], [9, 11], [13, 11]]);
    const st = game('Object.keys(STANDS)[0]');
    game(`state.tiles.set('11,11', { b: '${st}', lvl: 1, weg: 'kopf' }); recalc()`);
    const log = order(3);
    const i = (op, k) => log.findIndex(l => l[0] === op && l[1] === k);
    for (const k of ['10,11', '11,11', '12,11']) {
      expect(log.some(l => l[0] === 'path' && l[1] === k)).toBe(false);                    // nicht flach am Boden
      expect(i('hill', k)).toBeGreaterThan(-1);
      expect(i('up', k)).toBeGreaterThan(i('hill', k));
      expect(i('pathUp', k)).toBeGreaterThan(i('up', k));
    }
    expect(i('obj', '11,11')).toBeGreaterThan(i('up', '11,11'));                             // der Stand steht auf dem Weg
    const up = log.find(l => l[0] === 'up' && l[1] === '10,11')[2];
    expect(up).toBeCloseTo(game('toScreen(10, 11).y - HILL_H * cam.z'), 6);                   // angehoben
    for (const k of ['9,11', '13,11']) expect(i('path', k)).toBeGreaterThan(-1);             // unten wie bisher
    expect(i('path', '13,11')).toBeLessThan(i('hill', '10,11'));                              // … im Boden-Durchgang vor allem anderen
  });

  it('Boden-Bild (Zwischenspeicher) und weit weg: Wege oben nie flach darin, oben als eigenes Bildchen', () => {
    hills(block(10, 10, 12, 12));
    weg([[10, 11], [11, 11], [12, 11], [9, 11], [13, 11]]);
    game('cam.z = 2; resetDrawCaches()');
    expect(game('cam.z * DPR <= GROUND_MAX_SCALE')).toBe(true);
    const log = order(2);
    expect(log.filter(l => l[0] === 'path').map(l => l[1]).filter(k => ['10,11', '11,11', '12,11'].includes(k))).toEqual([]);
    expect(log.filter(l => l[0] === 'pathUp').length).toBeGreaterThan(2);
    order(0.9);
    expect(game("[...objSprites.keys()].filter(k => k.startsWith('hflat|')).map(k => k.split('|')[1]).sort()")).toEqual(['10,11', '11,11', '12,11']);
    expect(game("[...objSprites.keys()].some(k => k.startsWith('flat|11,11'))")).toBe(false);
    expect(game('liveFlatSet().size')).toBe(0);
  });

  it('Weg unter großer Deko oben: in jedem Streifen nach den Anhöhen darunter, vor der Deko', () => {
    hills(block(10, 10, 12, 12));
    weg(block(10, 10, 12, 12));
    const big = game("Object.keys(ITEMS).find(b => ITEMS[b].cat === 'deko' && (ITEMS[b].size || [1, 1])[0] === 2 && plazaOk(b) && !ITEMS[b].small)");
    expect(big).toBeTruthy();
    game(`for (const k of ['10,10', '11,10', '10,11', '11,11']) state.tiles.delete(k); state.tiles.set('10,10', { b: '${big}', lvl: 1, weg: 'kopf', wegs: { '1,0': 'kopf', '0,1': 'kopf', '1,1': 'kopf' } }); recalc()`);
    const log = order(3);
    const first = log.findIndex(l => l[0] === 'obj' && l[2] === big);
    expect(first).toBeGreaterThan(-1);
    for (const k of ['10,10', '11,10', '10,11', '11,11']) {
      const u = log.findIndex(l => l[0] === 'up' && l[1] === k);
      expect(u).toBeGreaterThan(-1);
      expect(u).toBeLessThan(first);
    }
  });

  it('Zuschnitt: an der Kante genau auf der Raute, zu Nachbarn derselben Ebene und zur Rampe ein Stück darüber', () => {
    hills(block(10, 10, 12, 12));
    weg([[10, 10], [11, 10], [10, 11], [12, 12]]);
    ramp(12, 13, 0);
    const clipOf = (x, y) => {
      const calls = record(`drawHillFlat(0, 0, 1, ${x}, ${y}, state.tiles.get('${x},${y}'))`);
      let pts = [];
      for (const c of calls) { if (c.op === 'beginPath') pts = []; else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a); else if (c.op === 'clip') break; }
      const P = pts.map(uv);
      return [Math.min(...P.map(p => p[0])), Math.max(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[1]))].map(v => Math.round(v * 1000) / 1000);
    };
    expect(clipOf(10, 10)).toEqual([-0.5, 0.56, -0.5, 0.56]);                                 // hinten links Kante, rechts/vorn Anhöhe
    expect(clipOf(12, 12)).toEqual([-0.56, 0.5, -0.56, 0.56]);                                // vorn (+y) die Oberkante der Rampe
  });

  it('nachts: der Schein eines leuchtenden Wegs oben liegt auch auf den Anhöhen davor', () => {
    hills(block(10, 10, 12, 12));
    weg([[11, 11]], 'kristall');
    const n = game(`(() => { const na = nightAt, gh = gameHour, gq = glowQuad; let n = 0; nightAt = () => NIGHT_MAX; gameHour = () => 23; glowQuad = (...a) => { if (a[2] === 'blue' && a[1] === 26 * 3) n++; return gq(...a); };
      try { cam.z = 3; const p = iso(11, 11); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = na; gameHour = gh; glowQuad = gq; } return n; })()`);
    expect(n).toBe(4);                                                                       // der Weg selbst und die Anhöhen rechts, vorn und vorn rechts
  });
});

describe('ohne Anhöhen wie bisher', () => {
  const scene = () => {
    weg([[5, 5], [6, 5], [7, 5], [6, 6], [6, 4]]);
    weg(block(5, 8, 7, 10), 'platten');
    weg([[9, 8], [10, 8]], 'sand', { wide: true }); weg([[11, 8]], 'sand');
    weg([[14, 5], [15, 5]], 'asphalt', { sq: true }); weg([[15, 6]], 'asphalt', { end: 'rand' });
    game("state.tiles.set('16,5', { b: 'haus', lvl: 1, rot: 2 }); state.tiles.set('6,7', { b: Object.keys(STANDS)[0], lvl: 1, weg: 'kopf' }); recalc()");
  };
  const all = () => game(`(() => { const out = []; for (let y = 3; y <= 12; y++) for (let x = 3; x <= 18; x++) { const t = flatAt(x, y); if (!t || wegUnder(t) == null) continue;
    out.push(x + ',' + y + JSON.stringify(pathArms(x, y)) + JSON.stringify(pathQuads(x, y)) + JSON.stringify(courtLinksAt(x, y)));
    const calls = []; const prev = g; g = new Proxy({}, { get: (t, p) => p in t ? t[p] : (...a) => calls.push(p + a.filter(v => typeof v === 'number').map(v => v.toFixed(3)).join(',')), set: (t, p, v) => { t[p] = v; calls.push(p + '=' + v); return true; } });
    try { drawFlat(100, 100, 2, x, y, t); } finally { g = prev; }
    out.push(calls.join(';')); } return out; })()`);
  it('keine Anhöhen: nichts davon läuft (früh aussteigen)', () => {
    scene();
    const n = game(`(() => { const a = pathArmsHill, h = drawHillFlat; let n = 0; pathArmsHill = (...x) => { n++; return a(...x); }; drawHillFlat = (...x) => { n++; return h(...x); };
      try { for (const z of [3, 2, 0.8]) { cam.z = z; render(1e6); } } finally { pathArmsHill = a; drawHillFlat = h; } return n; })()`);
    expect(n).toBe(0);
    expect(game('ROTATABLE.has("huegelrampe")')).toBe(true);
  });
  it('eine Anhöhe weit weg ändert an keinem Weg etwas (Arme, Ecken, Anschlüsse, jeder Zeichenbefehl)', () => {
    scene();
    const before = all();
    expect(before.length).toBeGreaterThan(30);
    hills([[30, 30], [31, 30]]);
    ramp(30, 31, 0);
    expect(all()).toEqual(before);
  });
});

describe('Rampe zeichnen (Einbau)', () => {
  it('drawObject zeichnet die Rampe (je Feld ein Bildchen), nah, weit, nachts und mit Wegen und Vorschau oben ohne Fehler', () => {
    hills(block(10, 10, 13, 13));
    ramp(11, 14, 0); ramp(12, 14, 0); ramp(14, 11, 3);
    weg([[11, 15], [12, 15], [11, 13], [12, 13], [15, 11], [13, 11], [13, 12]]);
    let n = 0;
    n = game(`(() => { const d = drawHillRamp; let n = 0; drawHillRamp = (...a) => { n++; return d(...a); }; try { drawObject('huegelrampe', 0, 0, 1, 0, 11, 14, 1, state.tiles.get('11,14')); } finally { drawHillRamp = d; } return n; })()`);
    expect(n).toBe(1);
    for (const [z, h] of [[3, 12], [1.5, 12], [0.6, 12], [3, 23], [0.6, 23]]) game(`(() => { const gh = gameHour; gameHour = () => ${h}; try { cam.z = ${z}; render(1e6); render(1e6 + 17); } finally { gameHour = gh; } })()`);
    expect(game("hillSprites.has('r11,14') && hillSprites.has('r12,14') && hillSprites.has('r14,11')")).toBe(true);
    // Vorschau beim Wegebau oben: Rauten und Geist
    game("setTool('weg'); startPlan('line', { x: 10, y: 11 }, { x: 13, y: 11 }, true); cam.z = 3; render(2e6); cancelPlan()");
    game("(() => { const q = toScreen(10, 12); setHover(q.x, q.y - HILL_H * cam.z); render(2e6 + 17); })()");
    expect(game('[hover.x, hover.y]')).toEqual([10, 12]);
    game("setTool('look')");
    expect(game('errorShown')).toBe(false);
  });
});
