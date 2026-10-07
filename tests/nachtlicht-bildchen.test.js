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
    expect(game('glows.length')).toBe(2);                                   // fürs Nachtbild gemerkt: ganz und halo – pane/mark folgen dem halo, das hat es schon (Block 124)
    expect(record(`punchGlow(${Q}, 18, null, 'mark')`)).toEqual([]);
    expect(game("(() => { let n = 0; const o = g.save; g.save = () => { n++; }; try { punchGlow(" + Q + ", 18, null, 'mark'); } finally { g.save = o; } return n; })()")).toBe(0);   // mark: kein save/restore
    game('night = 0');
  });
  it('putSprite: Schein vor dem Bildchen, Fensterlicht danach über die Maske – ohne Maske die ganze Scheibe', () => {
    game('night = 0.4; glows.length = 0; glowCells.clear()');
    const e = `{ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: null }]`;
    expect(record(`putSprite(${e}, mask: { c: { width: 4, height: 4, tag: 'maske' }, x: 10, y: 10 } }, 100, 100, 1)`)).toEqual(['schein', 'bild', 'maske']);
    expect(record(`putSprite(${e}, mask: null }, 100, 100, 1)`)).toEqual(['schein', 'bild', 'scheibe']);   // keine Maske: ganze Scheibe wie früher
    expect(record(`putSprite(${e}, mask: false }, 100, 100, 1)`)).toEqual(['schein', 'bild']);            // alles verdeckt: keine Scheibe
    expect(record(`putSprite({ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: 'blue' }], mask: null }, 100, 100, 1)`))
      .toEqual(['bild', 'schein']);                                          // Kristall: Schein darüber wie bisher
    game('night = 0');
  });
  it('Lichtmaske: Viereck-Prüfung für Fenster ohne Kopie; ohne Licht keine Maske', () => {
    expect(game(`[inQuad(${Q}, 12, 12), inQuad(${Q}, 9, 12), inQuad(${Q}, 12, 17), inQuad([[0, 0], [4, 2], [4, 6], [0, 4]], 2, 3), inQuad([[0, 0], [4, 2], [4, 6], [0, 4]], 2, 0)]`)).toEqual([true, false, false, true, false]);
    expect(game("lightMask({ width: 10, height: 10 }, [], null)")).toBe(null);
    expect(game("lightMask({ width: 10, height: 10 }, [{ q: [[1, 1], [2, 1], [2, 2], [1, 2]], r: 4, tint: 'blue' }], null)")).toBe(null);
  });
});
