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
