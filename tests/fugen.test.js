const { loadGame, game } = require('./helpers/load-game');

// Block 116: keine grünen Fugen auf Wegen und Plätzen – weder zwischen zwei Wegfeldern noch an den Grenzen der Bodenstücke
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6");
  game("for (let y = 6; y <= 14; y++) for (let x = 6; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } for (let y = 8; y <= 12; y++) for (let x = 8; x <= 12; x++) build('weg', x, y, true); recalc()");
});

describe('Fugen (Block 116)', () => {
  it('jedes Wegfeld zieht seine Fläche hauchdünn in Belagfarbe nach (Nachbarfelder überlappen)', () => {
    const strokes = game(`(() => { const out = []; g.stroke = () => out.push([String(g.strokeStyle), g.lineWidth]); try { const t = state.tiles.get('10,10'); drawPath(100, 100, 1, 10, 10, t); } finally { delete g.stroke; } return out; })()`);
    const fill = game("C(PATH_LOOK[styleDef('weg', state.tiles.get('10,10').style).id].fill)");
    expect(strokes.some(([c, w]) => c === String(fill) && w === 0.6)).toBe(true);
  });
  it('auch breite Wege (▬) und jeder Belag ziehen ihre Fläche nach', () => {
    for (const st of game('STYLES.weg.map(s => s.id)')) {
      if (game(`!!PATH_LOOK['${st}'].stones`)) continue;                                 // Trittsteine: Gras dazwischen ist gewollt
      for (const wide of [false, true]) {
        const ok = game(`(() => { const out = []; g.stroke = () => out.push([String(g.strokeStyle), g.lineWidth]); try { const t = { ...state.tiles.get('10,10'), style: '${st}', ${wide ? 'wide: true' : ''} }; drawPath(100, 100, 1, 10, 10, t); } finally { delete g.stroke; } const f = String(C(PATH_LOOK['${st}'].fill)); return out.some(([c, w]) => c === f && w === 0.6); })()`);
        expect(ok, st + (wide ? ' breit' : '')).toBe(true);
      }
    }
  });
  it('Bodenstücke: Wege samt Ring der Nachbarfelder, Schatten exakt an der Kante', () => {
    const src = game('renderGroundChunk.toString()');
    expect(src).toMatch(/for \(let i = -1; i <= CHUNK; i\+\+\)/);
    expect(src).toMatch(/clipTo\(0\.03 \+ 0\.052 \/ scale\)/);
    expect(src).toMatch(/clipTo\(0\);\s*\n?\s*try \{ drawShadows/);
    expect(() => game('renderGroundChunk(1, 1, 1.2)')).not.toThrow();
  });
});
