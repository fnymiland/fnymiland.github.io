const { loadGame, game } = require('./helpers/load-game');

// Block 166: Züge ordentlich. (1) Ein Wagen längs x, der nach links oben ins vorige Feld ragt, malte über die Bäume vorn links (die Felder
// einer Schräge kommen von links nach rechts) – das Stück im vorigen Feld kommt jetzt mit dem Feld dahinter (trainBackPieces). (2) Die
// Oberseite des Wagenkastens war offen: neben dem eingerückten Dach sah man durch den Wagen auf die Schwellen („das Dach schwebt“).
beforeAll(() => loadGame());
const car = (px, py, du, dv, extra = '') => `({ train: { kind: TRAIN_KIND.schnell, col: 0, model: 'schnell', route: null }, px: ${px}, py: ${py}, du: ${du}, dv: ${dv}, i: 1, n: 4, len: TRAIN_KIND.schnell.len, d: null, mv: 1${extra} })`;
const pieces = (px, py, du, dv, k) => game(`(ps => ps && ps.map(p => [p.k, p.m.cut.map(v => +v.toFixed(3)), p.m.gbK]))(trainBackPieces(${car(px, py, du, dv)}, '${k}'))`);

describe('Wagen ins vorige Feld (Bäume vorn links)', () => {
  it('längs x: das Stück im vorigen Feld kommt mit dem Feld dahinter (T, y−1), der Rest mit seinem Feld; Schatten je Stück auf seinem Feld', () => {
    expect(pieces(3.6, 5, 1, 0, '4,5')).toEqual([['4,4', [-0.31, -0.1], '3,5'], ['4,5', [-0.1, 0.31], '4,5']]);
    expect(pieces(3.6, 5, -1, 0, '4,5')).toEqual([['4,4', [0.1, 0.31], '3,5'], ['4,5', [-0.31, 0.1], '4,5']]);
  });
  it('ganz in einem Feld, nach rechts unten hinaus, längs y oder schräg: wie bisher (null)', () => {
    expect(pieces(4, 5, 1, 0, '4,5')).toBe(null);
    expect(pieces(4.3, 5, -1, 0, '4,5')).toBe(null);
    expect(pieces(5, 4.45, 0, 1, '5,4')).toBe(null);
    expect(pieces(4.45, 5, 0.71, 0.71, '4,5')).toBe(null);
  });
});

describe('Wagenkasten oben geschlossen', () => {
  const tops = cut => game(`(() => {
    const out = [], p0 = poly; poly = (pts, col) => { out.push(pts.map(p => p.map(v => Math.round(v * 10) / 10))); return p0(pts, col); };
    const m = ${car(5, 5, 1, 0, cut ? `, cut: ${JSON.stringify(cut)}` : '')}, H = m.train.kind.h, z = 1;
    try { drawTrainCarBody(m, z, 0); } finally { poly = p0; }
    const [lo, hi] = m.cut || [-m.len / 2, m.len / 2], wb = trainHalfW(m.train);
    const want = [[lo, -wb], [hi, -wb], [hi, wb], [lo, wb]].map(([a, b]) => { const p = toScreen(5 + a, 5 + b); return [Math.round(p.x * 10) / 10, Math.round((p.y - H * z) * 10) / 10]; });
    return out.some(pts => JSON.stringify(pts) === JSON.stringify(want));
  })()`);
  it('ganzer Wagen und abgeschnittenes Stück: eine Fläche über die ganze Oberseite, das Dach liegt darauf', () => {
    expect(tops(null)).toBe(true);
    expect(tops([-0.31, 0.05])).toBe(true);
  });
});

describe('Wagen in der Kurve (knickt) und Schatten', () => {
  // Strecke: gerade nach +x, dann ein Viertelkreis (Radius 0,5) nach +y, dann gerade
  const route = `(() => { const pts = [[0, 5]]; for (let x = 1; x <= 5; x++) pts.push([x, 5]); for (let i = 1; i <= 8; i++) { const t = i / 8 * Math.PI / 2; pts.push([5 + Math.sin(t) * 0.5, 5.5 - Math.cos(t) * 0.5]); }
    for (let y = 6; y <= 10; y++) pts.push([5.5, y]); const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1], loop: false }; })()`;
  const onRoute = d => `(() => { const r = ${route}, [u, v, du, dv] = railPoint(r, ${d}); return { train: { kind: TRAIN_KIND.schnell, col: 0, model: 'schnell', route: r }, px: u, py: v, du, dv, i: 1, n: 4, len: TRAIN_KIND.schnell.len, d: ${d}, mv: 1 }; })()`;
  it('auf der Geraden: ganz wie bisher; in der Kurve: zwei Hälften, die sich auf dem Gleis treffen und je zu ihrem Ende zeigen', () => {
    expect(game(`trainCarBend(${onRoute(2)})`)).toBe(null);
    const b = game(`(() => { const r = trainCarBend(${onRoute(5.4)}); return r && { J: r.J.slice(0, 2), f: r.f, b: r.b, lf: r.lf, lb: r.lb }; })()`);
    expect(b).not.toBe(null);
    expect(b.f[1]).toBeGreaterThan(b.b[1] + 0.3);                          // vordere Hälfte schon mehr nach +y gedreht als die hintere
    const cuts = game(`(() => { const out = [], f = drawTrainCarBody; drawTrainCarBody = (m, ...a) => { out.push([m.cut, m.noShadow, m.du, m.dv]); return f(m, ...a); };
      try { drawTrainCar(${onRoute(5.4)}, 1, 0); } finally { drawTrainCarBody = f; } return out; })()`);
    expect(cuts).toHaveLength(2);
    for (const [cut, noShadow] of cuts) { expect(noShadow).toBe(true); expect(cut[0]).toBeLessThan(0.05); expect(cut[1]).toBeGreaterThan(-0.05); }   // überlappen an der Mitte (Gehrung)
    expect(game(`trainBackPieces(${onRoute(5.4)}, '5,5')`)).toBe(null);   // gebogen: nicht zusätzlich zerteilen
  });
  it('Schatten folgt der Richtung des Wagens (quer im Bild nicht breiter als der Wagen lang ist)', () => {
    const w = (du, dv) => game(`(() => { const out = [], p = poly; poly = (pts, fill) => { if (fill === 'rgba(40,50,70,0.2)') out.push(pts); return p(pts, fill); };
      try { trainShadow({ train: { kind: TRAIN_KIND.schnell, model: 'schnell' }, px: 5, py: 5, du: ${du}, dv: ${dv}, len: TRAIN_KIND.schnell.len }, 1); } finally { poly = p; }
      const xs = out[0].map(q => q[0]), ys = out[0].map(q => q[1]); return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; })()`);
    const S = Math.SQRT1_2, [vw, vh] = w(S, S), [hw] = w(1, 0);
    expect(vh).toBeGreaterThan(vw * 0.6);                                 // senkrecht im Bild: eher hoch als breit
    expect(vw).toBeLessThan(hw);
  });
});
