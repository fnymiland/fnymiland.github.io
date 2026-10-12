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
  // 160c C7 (karte-C7-bau.md a1): Nachmalen unter GLOW_MUTE 'pane' stanzt nur Scheiben – nie bei „alles verdeckt“ (mask false), nie blau,
  // im GL-Bild nie über die Maske (destination-out in der Zelle macht dort kein Loch: Scheiben über glOutQuad)
  it('putSprite beim Nachmalen (pane): Bild, dann nur Scheiben bzw. Maske – nichts bei verdeckt, blau oder true', () => {
    game('night = 0.4; glows.length = 0; glowCells.clear()');
    const E = (mask, tint = null) => `({ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: ${JSON.stringify(tint)} }], mask: ${mask} })`;
    const put = (e, m = "'pane'") => record(`GLOW_MUTE = ${m}; try { putSprite(${e}, 100, 100, 1); } finally { GLOW_MUTE = false; }`);
    const MASK = "{ c: { width: 4, height: 4, tag: 'maske' }, x: 10, y: 10 }";
    expect(put(E('null'))).toEqual(['bild', 'scheibe']);
    expect(put(E(MASK))).toEqual(['bild', 'maske']);
    expect(put(E('false'))).toEqual(['bild']);                                 // alles verdeckt: keine Scheibe (wie 'mark' im normalen Weg)
    expect(put(E('null', 'blue'))).toEqual(['bild']);
    expect(put(E('null'), 'true')).toEqual(['bild']);
    expect(game('glows.length')).toBe(0);                                      // nie gemerkt (kein zweiter Schein)
    const gl = game(`(() => { const out = [], ow = glOnWorld, oq = glOutQuad, sky = GL.sky; glOnWorld = () => true; glOutQuad = () => out.push('gl'); GL.sky = false;
      g.drawImage = img => out.push(img && img.tag ? img.tag : 'schein');
      try { GLOW_MUTE = 'pane'; putSprite(${E(MASK)}, 100, 100, 1); } finally { GLOW_MUTE = false; glOnWorld = ow; glOutQuad = oq; GL.sky = sky; delete g.drawImage; } return out; })()`);
    expect(gl).toEqual(['bild', 'gl']);                                        // GL: Scheibe als Loch nach der Zelle, nicht über die Maske
    game('night = 0');
  });
  // L10: zwei Nachtbilder am selben Punkt mit gleich breitem Löschbild (Brücke: Kristall h und t2 symmetrisch) – beide Lichtbilder zählen;
  // dasselbe Nachtbild noch einmal (Streifen großer Gebäude) nur einmal
  it('putNight: verschiedene Nachtbilder am selben Punkt zählen beide, dasselbe nur einmal', () => {
    game('night = 0.4; nightPics.length = 0; nightPanes.length = 0; nightSeen.clear()');
    const N = tag => `({ erase: { c: { width: 30, height: 10 }, ox: 0, oy: 0 }, light: { c: { width: 30, height: 10, tag: '${tag}' }, ox: 0, oy: 0 }, panes: [] })`;
    const tags = game(`(() => { const e = { c: { width: 30, height: 10 }, ox: 0, oy: 0, z: 1 }, a = ${N('h')}, b = ${N('t2')};
      g.drawImage = () => {}; try { putNight(e, a, 100, 100, 1); putNight(e, b, 100, 100, 1); putNight(e, a, 100, 100, 1); } finally { delete g.drawImage; }
      return nightPics.map(p => p[0].tag); })()`);
    expect(tags).toEqual(['h', 't2']);
    game('night = 0; nightPics.length = 0; nightPanes.length = 0; nightSeen.clear(); nightWarm = false');
  });
});
