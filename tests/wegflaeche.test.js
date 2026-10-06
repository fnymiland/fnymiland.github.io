const { loadGame, game } = require('./helpers/load-game');

// Block 100: große Wegflächen ohne Lücken und ohne Striche – am Rathaus, bei „ganz breit“ und im Punktmuster
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); state.tutorial = -1");
  game("for (let y = -3; y <= 14; y++) for (let x = -3; x <= 14; x++) { if (state.tiles.get(x + ',' + y) && state.tiles.get(x + ',' + y).b === 'rathaus') continue; if (anchorAt(x, y) && state.tiles.get(anchorAt(x, y)).b === 'rathaus') continue; state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
});
const W = (x, y, extra = {}) => game(`state.tiles.set('${x},${y}', { b: 'weg', lvl: 1, ...${JSON.stringify(extra)} })`);
const curbArea = (x, y, style = 'sand') => game(`(() => { let area = 0; const o = poly, edge = C(PATH_LOOK['${style}'].edge);
  poly = (pts, fill) => { if (fill === edge) area += Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2; return o(pts, fill); };
  try { drawPath(300, 300, 4, ${x}, ${y}, state.tiles.get('${x},${y}')); } finally { poly = o; } return area; })()`);

describe('Wegflächen (Block 100)', () => {
  it('am Rathaus: die Ecken zwischen zwei Wegfeldern davor werden voll – keine grünen Zwickel', () => {
    const [hx, hy] = game('townHallAt()');
    for (let y = hy; y <= hy + 2; y++) W(hx - 1, y);                       // Wegspalte links am Rathaus entlang
    game('recalc()');
    const q = game(`pathQuads(${hx - 1}, ${hy + 1})`);
    expect(q).toContainEqual([1, 1]);
    expect(q).toContainEqual([1, -1]);
  });
  it('ganz breit neben schmal: kein Bordstein-Stück mitten in der Fläche, aber am Rand zur Wiese', () => {
    for (let x = 7; x <= 9; x++) for (let y = 9; y <= 11; y++) W(x, y, x === 8 && y === 10 ? { wide: true } : {});
    game('recalc()');
    const inside = curbArea(8, 10);                                      // rundherum Weg
    expect(inside).toBe(0);
    game("state.tiles.delete('8,9'); state.tiles.delete('9,9'); state.tiles.delete('7,9'); recalc()");   // oben jetzt Wiese
    expect(curbArea(8, 10)).toBeGreaterThan(0);
  });
  it('Punktmuster: Steine auf der Feldkante zeichnen beide Nachbarn gleich (keine halben Steine)', () => {
    const dots = x => game(`(() => { const out = [], oe = g.ellipse, of = g.fill; g.ellipse = (px, py) => out.push([+px.toFixed(3), +py.toFixed(3)]); g.fill = () => {};
      try { pattern(([u, v]) => [${x} + u, 10 + v], 'dots', ${x}, 10, 1, '#000'); } finally { g.ellipse = oe; g.fill = of; }
      return out.filter(([u]) => Math.abs(u - 8.5) < 0.05).sort((p, q) => p[1] - q[1] || p[0] - q[0]); })()`);
    const a = dots(8), b = dots(9);
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });
  it('Rathausplatz: Seiten ganz von Weg umgeben laufen bis an die Grenze (ohne Bordstein), sonst nicht', () => {
    const [hx, hy] = game('townHallAt()'), key = `${hx},${hy}`;
    const open = () => game(`(() => { const t = state.tiles.get('${key}'); return courtOpenSides(kit(0, 0, 1, t.rot), t, ${hx}, ${hy}); })()`);
    expect(open()).toMatchObject({ back: false, lo: false, hi: false });
    for (let x = hx - 1; x <= hx + 3; x++) for (let y = hy - 1; y <= hy + 3; y++) if (x < hx || x > hx + 2 || y < hy || y > hy + 2) W(x, y);
    game('recalc()');
    expect(open()).toMatchObject({ back: true, lo: true, hi: true });
  });
});
