const { loadGame, game } = require('./helpers/load-game');

// Block 112: Nachtlicht weit weg (Bildchen) wie live – erst der Schein (trifft, was dahinter liegt), dann das Bildchen, zuletzt
// nur, was darin wirklich noch Fensterlicht ist (Lichtmaske). Vorher stanzten Schein und Scheiben nachträglich durch
// Blumenkästen, Rahmen und Nachbarhäuser: Reihenhäuser sahen nachts von weitem zackig aus.
beforeAll(() => loadGame());
// Zeichenaufrufe mitschreiben: drawImage (Schein, Bildchen, Maske) und fill (Scheibe)
const record = fn => game(`(() => { const out = [];
  g.drawImage = (img) => out.push(img && img.tag ? img.tag : 'schein'); g.fill = () => out.push('scheibe');
  try { ${fn} } finally { delete g.drawImage; delete g.fill; } return out; })()`);
const Q = '[[10, 10], [14, 10], [14, 16], [10, 16]]';

describe('Nachtlicht der Bildchen (Block 112)', () => {
  it('punchGlow: halo nur Schein, pane nur Scheibe, mark gar nichts (nur fürs Nachtbild gemerkt)', () => {
    game('night = 0.4; glows.length = 0; glowCells.clear()');
    expect(record(`punchGlow(${Q}, 18)`)).toEqual(['schein', 'scheibe']);
    expect(record(`punchGlow(${Q}, 18, null, 'halo')`)).toEqual(['schein']);
    expect(record(`punchGlow(${Q}, 18, null, 'pane')`)).toEqual(['scheibe']);
    expect(record(`punchGlow(${Q}, 18, null, 'mark')`)).toEqual([]);
    expect(game('glows.length')).toBe(4);                                   // alle fürs Nachtbild gemerkt (drawNight fasst zusammen)
    game('night = 0');
  });
  it('putSprite: Schein vor dem Bildchen, Fensterlicht danach über die Maske – ohne Maske die ganze Scheibe', () => {
    game('night = 0.4; glows.length = 0; glowCells.clear()');
    const e = `{ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: null }]`;
    expect(record(`putSprite(${e}, mask: { tag: 'maske' } }, 100, 100, 1)`)).toEqual(['schein', 'bild', 'maske']);
    expect(record(`putSprite(${e}, mask: null }, 100, 100, 1)`)).toEqual(['schein', 'bild', 'scheibe']);
    expect(record(`putSprite({ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: 'blue' }], mask: null }, 100, 100, 1)`))
      .toEqual(['bild', 'schein']);                                          // Kristall: Schein darüber wie bisher
    game('night = 0');
  });
  it('Lichtmaske: nur warmes Fenstergelb zählt – nicht Wand, Blüten, Weiß', () => {
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    for (const c of ['#ffd873', '#ffe58a', '#ffe7a8']) expect(game(`litPx(${hex(c)})`), c).toBe(true);
    for (const c of ['#ffffff', '#ff8fb1', '#c49bff', '#f6c9c0', '#fbe6a2', '#cfe8c4', '#bfe0f2', '#a8dcff', '#8a5a3c']) expect(game(`litPx(${hex(c)})`), c).toBe(false);
  });
});
