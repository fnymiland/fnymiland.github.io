const { loadGame, game } = require('./helpers/load-game');

// Nutzer (10.10.2026): „achte drauf, dass die Zeichnungen bündig sind“ – Keil der Treppe in die Anhöhe, Anhöhenwände, dunkle Kante oben
// (hills.js): Kanten treffen sich genau, nichts steht über, Grasnarbe und Kante laufen gleich dick über Feldgrenzen und um Ecken
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; hillWalkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const H = 26;
const near = (a, b) => Math.abs(a - b) < 1e-9;
// Zeichnen mitschreiben: g zeichnet nichts, merkt sich jeden Aufruf samt Farben; poly und paintHillWall zusätzlich mit ihren Werten
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly, pw = paintHillWall;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle, cap: t.lineCap, lw: t.lineWidth }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  paintHillWall = (...a) => { calls.push({ op: 'wall', a: a.slice(1) }); return pw(...a); };
  try { ${body}; } finally { g = prev; poly = pp; paintHillWall = pw; }
  return calls;
})()`);
// Pfade (Punkte seit beginPath), die mit op enden (clip, stroke …), samt Farben
const paths = (calls, op) => {
  let pts = [];
  const out = [];
  for (const c of calls) {
    if (c.op === 'beginPath') pts = [];
    else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a);
    else if (c.op === op) out.push({ pts, stroke: c.stroke });
  }
  return out;
};
const samePts = (a, b) => a.length === b.length && a.every((p, i) => near(p[0], b[i][0]) && near(p[1], b[i][1]));

describe('Treppe und Anhöhe bündig', () => {
  it('Keil: oben auf der Linie der Stufenkanten – vorn so hoch wie die erste Stufe, hinten genau so hoch wie die Anhöhe, nie darüber', () => {
    for (let rot = 0; rot < 4; rot++) {
      const o = { rot, style: 'sand', kind: 'fels', m: 'k', p: 'k', top: '#123456' };
      const calls = record(`paintStair((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const tops = calls.filter(c => c.op === 'poly' && c.fill === game("C('#123456')"));
      expect(tops.length).toBe(2);                                                              // Oberseite beider Keile wie der Boden
      for (const t of tops) expect([...new Set(t.pts.map(p => p[2]))].sort((a, b) => a - b)).toEqual([H / 8, H]);
      // hinten einen Hauch über die Feldgrenze (wie Anhöhe an Anhöhe): sonst feiner dunkler Strich zur Oberseite dahinter
      const [Du, Dv] = game(`STAIR_UP[${rot}]`);
      for (const t of tops) expect(Math.max(...t.pts.map(p => p[0] * Du + p[1] * Dv))).toBeCloseTo(0.5075, 9);
      for (const c of calls) if (c.op === 'poly') for (const p of c.pts) expect(p[2]).toBeLessThanOrEqual(H + 0.4 + 1e-9);   // nichts über der Anhöhe (Grasnarbe deckt die Kante wie dort)
      const walls = calls.filter(c => c.op === 'wall');
      const sides = walls.filter(c => c.a[9] === H);                                           // Längsseiten: vorn H/8, hinten H, ab der obersten Stufe waagerecht
      expect(sides.length).toBe(2);
      for (const w of sides) expect([w.a[6], w.a[7], w.a[9], w.a[10], w.a[11]]).toEqual([0, H / 8, H, true, 7 / 8]);
      const ends = walls.filter(c => c.a[9] !== H);                                            // Stirn am Fuß: nur sichtbar, wenn die Treppe vom Betrachter weg steigt
      expect(ends.length).toBe(rot === 0 || rot === 3 ? 2 : 0);
      for (const w of ends) expect([w.a[6], w.a[7], w.a[8] !== undefined]).toEqual([0, H / 8, true]);
    }
  });

  it('Grasnarbe: an den Enden jeder Wand gleich tief (Feldgrenzen, Ecken, Keil an der Anhöhe), dazwischen wellig; nie unter dem Fuß', () => {
    for (const kind of ['fels', 'erde', 'mauer']) {
      const S = game(`HILL_STY.${kind}`), lipCol = game(`C(HILL_STY.${kind}.lip)`);
      const lip = (ht, seed, ht1 = ht, knee = 1) => record(`paintHillWall((u, v, up = 0) => [u, up], 0, 0, 1, 0, 'u', '${kind}', 0, ${ht}, ${seed}, ${ht1}, true, ${knee})`).find(c => c.op === 'poly' && c.fill === lipCol).pts;
      const bottoms = pts => pts.slice(9).reverse();                                            // unten von s = 0 bis 1
      const a = bottoms(lip(H, 3)), b = bottoms(lip(H, 77)), k = bottoms(lip(H / 8, 5, H, 7 / 8));
      const end = H - S.lipH * 1.35;
      expect([a[0][1], a[8][1], b[0][1], b[8][1], k[8][1]].every(h => near(h, end))).toBe(true);   // Anhöhe an Anhöhe, Keil an Anhöhe: gleich
      expect(new Set(a.map(p => p[1])).size).toBeGreaterThan(3);                                // dazwischen wellig wie bisher
      expect(k.every(p => p[1] >= 0)).toBe(true);                                               // Keil vorn: bis zum Fuß, nicht darunter
      expect(k[0][1]).toBe(0);
      expect(lip(H / 8, 9).slice(9).every(p => p[1] === 0)).toBe(true);                         // Stirn des Keils: ganz Grasnarbe, keine Zacken
    }
    // Felsschichten treffen sich an Feldgrenzen und Ecken (Enden ohne Versatz)
    const layers = paths(record("paintHillWall((u, v, up = 0) => [u, up], 0, 0, 1, 0, 'u', 'fels', 0, 26, 11)"), 'stroke').slice(0, 4);
    layers.forEach((l, i) => { expect(near(l.pts[0][1], (i + 1) * H / 5) && near(l.pts[6][1], (i + 1) * H / 5)).toBe(true); });
  });

  it('Oberseite: nach hinten und über einer Wand genau auf der Raute (keine Spitze an Ecken und Feldgrenzen), zu gleich hohen Nachbarn vorn etwas größer', () => {
    hills([[10, 10]]);
    const single = paths(record("paintHill(10, 10, hillAt(10, 10))"), 'clip')[0].pts;
    expect(samePts(single, [[0, -H - 16], [32, -H], [0, -H + 16], [-32, -H]])).toBe(true);
    hills([[11, 10], [10, 11]]);                                                               // vorn rechts und links gleich hoch
    const both = paths(record("paintHill(10, 10, hillAt(10, 10))"), 'clip')[0].pts;
    expect(samePts([both[0]], [[0, -H - 16]])).toBe(true);                                      // hinten genau
    expect(both[1][0]).toBeGreaterThan(32); expect(both[3][0]).toBeLessThan(-32);               // vorn größer …
    for (const [px, py] of both) expect(Math.abs(px) / 32.5 + Math.abs(py + H) / 16.3).toBeLessThanOrEqual(1 + 1e-9);   // … aber innerhalb des Bodens (keine braunen Seiten)
  });

  it('dunkle Kante oben: zugeschnitten wie die Oberseite (gerade Enden), neben einer Treppe nur bis zur obersten Stufe; ohne Treppe wie bisher', () => {
    hills([[10, 10]]);
    const lineCol = 'rgba(45,85,30,0.5)';
    const strokes = record("paintHill(10, 10, hillAt(10, 10))").filter(c => c.op === 'stroke' && c.stroke === lineCol);
    expect(strokes.length).toBe(2);                                                             // −x und −y, je eine Hälfte der Raute
    expect(strokes.every(c => c.cap === 'butt' && c.lw === 1.5)).toBe(true);
    // Treppe eingelassen zwischen Anhöhen, je Seite: die Anhöhe daneben (Wange hinten) kennt sie und kürzt ihre Kante
    game("state.hills.clear(); recalc()");
    hills(block(10, 10, 13, 13));
    for (const [x, y] of [[11, 13], [13, 11], [11, 10], [10, 11]]) game(`build('huegeltreppe', ${x}, ${y})`);
    expect(game('[[11, 13], [13, 11], [11, 10], [10, 11]].map(([x, y]) => stairAt(x, y).rot || 0)')).toEqual([0, 3, 2, 1]);
    expect(game('hillStairEnds(12, 13)')).toContain('a');                                     // hinauf nach −y: oberste Stufe hinten
    expect(game('hillStairEnds(13, 12)')).toContain('c');                                     // hinauf nach −x
    expect(game('hillStairEnds(12, 10)')).toContain('b');                                     // hinauf nach +y
    expect(game('hillStairEnds(10, 12)')).toContain('d');                                     // hinauf nach +x
    expect(game('hillSig(12, 13, hillAt(12, 13))')).toMatch(/:t.*a/);                          // eigenes Bildchen
    const cut = record("paintHill(12, 13, hillAt(12, 13))"), w = cut.findIndex(c => c.op === 'wall');
    expect(cut.slice(0, w).filter(c => c.op === 'clip').length).toBe(3);                        // Oberseite; Kante: Raute, bis zur obersten Stufe
    const edge = paths(cut, 'clip')[2].pts.map(p => game(`(([px, py]) => { const a = px / 32, b = (py + 26) / 16; return [(a + b) / 2, (b - a) / 2]; })(${JSON.stringify(p)})`));
    expect(edge.filter(([u, v]) => near(v, -0.5 + 1 / 8)).length).toBe(2);                    // endet genau an der Kante der obersten Stufe
  });

  it('Innenecke hinten: Kanten von links und rechts schließen auf Gehrung – Anhöhe in L-Form und Treppe an der Kante', () => {
    hills([[16, 10], [15, 11], [16, 11]]);
    expect(game('hillMiter(16, 11, 1)')).toBe(true);
    expect(game('hillMiter(16, 10, 1) || hillMiter(15, 11, 1)')).toBe(false);
    expect(game('hillSig(16, 11, hillAt(16, 11))')).toMatch(/:m$/);
    hills([[15, 10]]);                                                                          // Ecke gefüllt: keine Innenecke mehr
    expect(game('hillMiter(16, 11, 1)')).toBe(false);
    // Treppe vor die Wand an der Kante (hinauf nach +x): der hintere Keil trägt die Kante weiter, die Anhöhe dahinter schließt die Gehrung
    hills(block(20, 10, 22, 12));
    game('buildRot = 1; rotManual = true'); game("build('huegeltreppe', 19, 11)"); game('rotManual = false');
    expect(game('stairAt(19, 11).rot')).toBe(1);
    expect(game('hillMiter(20, 11, 1)')).toBe(true);
    expect(game('hillMiter(20, 12, 1)')).toBe(false);                                         // vorderer Keil: seine Wand hat Grasnarbe, keine Kante
    hills([[19, 10]]);                                                                          // daneben Anhöhe: Wange statt Keil
    expect(game('hillMiter(20, 11, 1)')).toBe(false);
  });

  it('Keil hinten außen: dunkle Kante wie bei der Anhöhe, vorn keine; breite Treppe: Lichtkanten nur bis zur Feldgrenze (nie doppelt)', () => {
    const lineCol = 'rgba(45,85,30,0.5)';
    for (let rot = 0; rot < 4; rot++) {
      const calls = record(`paintStair((u, v, up = 0) => [u, v, up], { rot: ${rot}, style: 'sand', kind: 'fels', m: 'k', p: 'k', top: '#8dcd67' }, 5, 5)`);
      expect(calls.filter(c => c.op === 'stroke' && c.stroke === lineCol).length).toBe(1);
    }
    const calls = record("paintStair((u, v) => [u, v], { rot: 0, style: 'sand', kind: 'fels', m: 'j', p: 'j', top: '#8dcd67' }, 5, 5)");
    let pts = [];
    const light = [];
    for (const c of calls) {
      if (c.op === 'beginPath') pts = [];
      else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a);
      else if (c.op === 'stroke' && c.stroke === 'rgba(255,255,255,0.35)') light.push(...pts);
    }
    expect(light.length).toBe(16);                                                              // 8 Stufen, je eine Kante
    for (const [u] of light) expect(Math.abs(u)).toBeLessThanOrEqual(0.5 + 1e-9);              // hinauf −y: quer = u
    expect(game("stairLook(5, 5, { b: 'huegeltreppe', rot: 0 }).top")).toBe(game('groundTopAt(5, 5)'));
  });

  it('Wandfuge: gerade weiter und an Innenecken reicht die Wand ein Stück unter das spätere Nachbarbild, an Außenecken und Treppen nicht', () => {
    hills(block(6, 6, 9, 7));                                             // 4 × 2, Vorderwand +y in Zeile 7, rechte Wand +x in Spalte 9
    const ext = (x, y) => game(`hillExt(${x}, ${y}, 1, hillStairEnds(${x}, ${y}))`);
    expect(ext(6, 7)).toEqual([game('HILL_EXT'), 0]);                    // Vorderwand läuft nach +x weiter
    expect(ext(8, 7)).toEqual([game('HILL_EXT'), 0]);
    expect(ext(9, 7)).toEqual([0, 0]);                                    // Außenecke vorn rechts: nichts
    expect(ext(9, 6)).toEqual([0, game('HILL_EXT')]);                    // rechte Wand läuft nach +y weiter
    expect(game("hillSig(6, 7, hillAt(6, 7))")).toContain(':e10');
    // Innenecke: Anhöhe davor rechts – die Wand von (11, 7) endet unter (12, 8)
    hills([[11, 7], [12, 7], [12, 8]]);
    expect(ext(11, 7)).toEqual([game('HILL_EXT'), 0]);
    // an einer Treppe nicht (sie deckt die Wand ohne Grasnarbe)
    game("build('huegeltreppe', 7, 8, true)");
    expect(ext(6, 7)[0]).toBe(0);
    expect(ext(7, 7)[0]).toBe(0);
  });
});
