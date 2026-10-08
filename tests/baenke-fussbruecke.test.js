const { loadGame, game } = require('./helpers/load-game');

// Block 147 (Bänke) und 148 (Fußgängerbrücke über Schienen)
beforeAll(() => loadGame());
describe('Bänke (Block 147)', () => {
  it('neue Formen Bank mit Blumenkästen und Laubenbank in der Kunstakademie; alte Formen behalten ihre Nummer', () => {
    expect(game("DECO_LOOKS.bank.forms.map(f => f.id)")).toEqual(['park', 'garten', 'stein', 'picknick', 'rund', 'blumen', 'laube']);
    expect(game("!!DESIGN_BY_ID['bank:form:blumen'] && !!DESIGN_BY_ID['bank:form:laube']")).toBe(true);
  });
  it('alle Formen zeichnen ohne Fehler; die Rundbank ist so breit wie eine Parkbank lang (vorher halb so breit)', () => {
    const w = f => game(`(() => { let x0 = 1e9, x1 = -1e9; const og = g, P = new Proxy({}, { get: (t, p) => p === 'ellipse' ? (x, y, rx) => { x0 = Math.min(x0, x - rx); x1 = Math.max(x1, x + rx); }
      : p === 'lineTo' || p === 'moveTo' ? (x) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } : (p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
      g = P; try { drawBench(0, 0, 1, { b: 'bank', form: ${f} }, 32, 16); } finally { g = og; } return x1 - x0; })()`);
    for (let f = 0; f < 7; f++) expect(w(f), 'Form ' + f).toBeGreaterThan(0);
    expect(w(4)).toBeGreaterThan(w(0) * 0.9);
  });
});
describe('Fußgängerbrücke (Block 148)', () => {
  it('Deck so breit wie der Weg samt Rand – der Weg schaut an den Rampen nicht mehr seitlich hervor', () => {
    expect(game('ARCH_W >= EDGE_W')).toBe(true);
  });
  it('Rampen auf den Wegfeldern massiv bis zum Boden: Wand vorn von der Rampe bis Höhe 0', () => {
    const r = game(`(() => { const ys = []; const og = g; const P = (a, b, up = 0) => [a * 10 + b * 10, -up];
      const Px = new Proxy({}, { get: (t, p) => p === 'lineTo' || p === 'moveTo' ? (x, y) => ys.push(y) : (p in t ? t[p] : () => {}), set: (t, p, v) => { t[p] = v; return true; } });
      g = Px; try { drawArch(P, 1, -ARCH_SPAN, 0, ARCH_LOOK.holz, 0, 0, [1, 0], [0, 1]); } finally { g = og; } return ys.filter(y => y === 0).length; })()`);
    expect(r).toBeGreaterThan(4);                                                               // viele Punkte am Boden (Wand bis 0)
  });
});
