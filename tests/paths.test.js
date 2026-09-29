const { loadGame, game } = require('./helpers/load-game');

// Wege: Trittsteine, Plätze, Übergänge, Konfetti, Stil-Leiste
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game("for (let y = 6; y <= 14; y++) for (let x = 6; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); }");
});
const W = (x, y, style) => game(`state.tiles.set('${x},${y}', { b: 'weg', lvl: 1, style: '${style}' }); recalc()`);

describe('Trittsteine', () => {
  const stones = (x, y) => game(`stonePoints(pathArms(${x}, ${y}), state.tiles.get('${x},${y}'))`);
  // Abstand zum nächsten Stein im Nachbarfeld entlang eines Arms (in Feldern)
  const gapToEdge = pts => Math.min(...pts.filter(([u, v]) => v === 0 && u > 0).map(([u]) => 0.5 - u));

  it('gleicher Abstand über die Feldgrenze hinweg – auch an Kreuzungen', () => {
    for (let x = 8; x <= 12; x++) W(x, 10, 'tritt');
    W(10, 9, 'tritt'); W(10, 11, 'tritt');                        // Kreuzung bei 10,10
    W(9, 11, 'tritt');                                             // T bei 9,10
    const straight = stones(11, 10);
    expect(straight.length).toBe(4);
    expect(gapToEdge(straight)).toBeCloseTo(0.125);
    // jeder Arm von Kreuzung und T hat seinen Stein 1/8 vor dem Rand – wie das gerade Stück, also keine Lücke
    for (const [x, y, n] of [[10, 10, 4], [9, 10, 3]]) {
      const arms = game(`pathArms(${x}, ${y})`), pts = stones(x, y);
      expect(arms.length).toBe(n);
      for (const [dx, dy] of arms) {
        expect(pts.some(([u, v]) => Math.abs(u - dx * 0.375) < 1e-9 && Math.abs(v - dy * 0.375) < 1e-9)).toBe(true);
      }
    }
  });

  it('in der Kurve liegen die Steine auf dem Bogen, der erste 1/8 vom Rand', () => {
    W(9, 10, 'tritt'); W(10, 10, 'tritt'); W(10, 11, 'tritt');
    const pts = stones(10, 10);
    expect(pts.length).toBe(3);
    for (const [u, v] of pts) expect(Math.hypot(u + 0.5, v - 0.5)).toBeCloseTo(0.5);   // Bogen um die Ecke (-½, ½)
  });
});

describe('Plätze und Übergänge', () => {
  it('ein einzelnes Platzfeld hat vier runde Ecken, eines mit Nachbarn nur die freien', () => {
    W(8, 8, 'platten');
    expect(game("plazaCorners(8, 8).filter(c => c.length > 1).length")).toBe(4);
    W(9, 8, 'platten');
    expect(game("plazaCorners(8, 8).filter(c => c.length > 1).length")).toBe(2);
  });

  it('mündet ein Weg in den Platz, weitet er sich (Trichter) und die Platzkante hat dort eine Lücke', () => {
    W(8, 8, 'platten'); W(7, 8, 'sand');
    expect(game("pathFlares(7, 8)")).toEqual([[1, 0]]);
    expect(game("plazaSides(8, 8)")).toEqual(['open', 'open', 'open', 'band']);
    expect(game("plazaCorners(8, 8).filter(c => c.length > 1).length")).toBe(2);   // Ecken an der Einmündung bleiben spitz
  });

  it('zwischen zwei Weg-Stilen liegt eine Schwelle, zwischen gleichen nicht', () => {
    W(8, 8, 'sand'); W(9, 8, 'kies'); W(10, 8, 'kies'); W(11, 8, 'tritt');
    expect(game('pathThresholds(8, 8)')).toEqual([[1, 0]]);
    expect(game('pathThresholds(9, 8)')).toEqual([[-1, 0]]);
    expect(game('pathThresholds(10, 8)')).toEqual([]);            // Trittsteine brauchen keine Schwelle
  });

  it('ein einzelnes Wegfeld ist rund (Kapsel), nicht eckig', () => {
    const sh = game('roadShapes([], null, EDGE_W)');
    expect(sh.length).toBe(1);
    const pts = sh[0];
    expect(Math.max(...pts.map(p => p[0]))).toBeCloseTo(0.5);
    expect(pts.length).toBeGreaterThan(10);
  });

  it('zeichnen geht in allen Fällen ohne Fehler', () => {
    W(8, 8, 'platten'); W(7, 8, 'sand'); W(9, 8, 'klinker'); W(8, 9, 'konfetti'); W(8, 10, 'kristall'); W(9, 10, 'tritt');
    game('recalc()');
    for (const k of ['8,8', '7,8', '9,8', '8,9', '8,10', '9,10']) {
      expect(() => game(`drawPath(100, 100, 1, ${k}, state.tiles.get('${k}'))`)).not.toThrow();
    }
  });
});

describe('Konfetti', () => {
  it('Pastell-Mosaik und Mosaik sind ein Stil', () => {
    const ids = game('STYLES.weg.map(s => s.id)');
    expect(ids).toContain('konfetti');
    expect(ids).not.toContain('pastell');
    expect(ids).not.toContain('mosaik');
  });

  it('alte Stände: Wege werden Konfetti, wer mehr bezahlt hat, bekommt die Differenz zurück', () => {
    const d = game('serialize()');
    d.tiles.push(['8,8', { b: 'weg', lvl: 1, style: 'pastell' }], ['9,8', { b: 'weg', lvl: 1, style: 'mosaik' }]);
    d.design = ['weg:kies', 'weg:pastell', 'weg:mosaik'];
    const money = d.money;
    const s = game(`parseSave(${JSON.stringify(d)})`);
    expect(s.tiles.get('8,8').style).toBe('konfetti');
    expect(s.tiles.get('9,8').style).toBe('konfetti');
    expect([...s.design].sort()).toEqual(['weg:kies', 'weg:konfetti']);
    const price = game("styleDef('weg', 'konfetti').design");
    expect(s.money).toBe(money + 250 + 500 - price);
    // nur Pastell gehabt: nichts zurück (Konfetti ist ja da)
    d.design = ['weg:pastell'];
    expect(game(`parseSave(${JSON.stringify(d)}).money`)).toBe(money);
  });
});

describe('Stil-Leiste', () => {
  it('zeigt nur, was man hat, plus einen Knopf zur Kunstakademie', () => {
    game("setTool('weg')");
    const chips = [...document.querySelectorAll('#style-bar .style-chip')];
    expect(chips.filter(c => c.dataset.style).map(c => c.dataset.style)).toEqual(['sand']);
    const more = document.querySelector('#style-bar [data-more]');
    expect(more).not.toBe(null);
    more.onclick();
    expect(document.getElementById('modal').hidden).toBe(false);
    expect(game('researchTab')).toBe('design');
  });
});

describe('Breite Wege am Platz', () => {
  it('die Ecke zwischen zwei Wegfeldern und zwei Platzfeldern wird gefüllt', () => {
    W(8, 8, 'sand'); W(8, 9, 'sand'); W(9, 8, 'platten'); W(9, 9, 'platten');
    expect(game('pathQuads(8, 8)')).toEqual([[1, 1]]);
    W(10, 10, 'tritt'); W(10, 11, 'tritt'); W(11, 10, 'tritt'); W(11, 11, 'tritt');
    expect(game('pathQuads(10, 10)')).toEqual([]);                 // Trittsteine bleiben Steine
  });
});
