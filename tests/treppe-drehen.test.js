const { loadGame, game } = require('./helpers/load-game');

// Treppe drehen (Nutzer 11.10.2026: „kann man eine Treppe zur Anhöhe drehen?“ – „ja!“ – und „warum erlaubt er mir hier nicht, die Treppe nach
// rechts zu drehen?“): beim Bauen gewinnt die selbst gewählte Drehung (R, ⟳: rotManual), solange sie hinaufführt – vorher entschied die Wertung
// (Weg am Fuß, Treppe daneben) und R tat nichts. Stehende Treppe: ⟳ im Fenster reihum durch die Richtungen, in die sie hier hinaufführt
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e6; state.techs.add('terraform'); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 20; y++) for (let x = 4; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); buildRot = 0; rotManual = false; recalc(); resetUndo()");
  // Innenecke: Anhöhe links (−x) und hinten (−y) von 10,10 – die Treppe dort kann nach −x (3) oder nach −y (0) hinauf
  game("for (const [x, y] of [[8, 8], [9, 8], [10, 8], [8, 9], [9, 9], [10, 9], [8, 10], [9, 10], [8, 11], [9, 11]]) build('anhoehe', x, y, true); recalc()");
});

describe('beim Bauen', () => {
  it('Wertung bevorzugt eine Richtung (Weg am Fuß), R wählt trotzdem die andere – solange sie hinaufführt', () => {
    game("build('weg', 10, 11, true); recalc()");                           // Weg am Fuß der Richtung −y
    expect(game('stairDirs(10, 10, 0).sort()')).toEqual([0, 3]);
    expect(game('placeRot("huegeltreppe", 10, 10)')).toBe(0);              // ohne eigene Drehung: die mit dem Weg
    game('buildRot = 3; rotManual = true');
    expect(game('placeRot("huegeltreppe", 10, 10)')).toBe(3);              // selbst gedreht: gilt
    expect(game('placeError("huegeltreppe", 10, 10)')).toBe(null);
    game('buildRot = 1; rotManual = true');                                // führt nicht hinauf: die nächste passende
    expect(game('placeRot("huegeltreppe", 10, 10)')).toBe(3);
    game('buildRot = 3; rotManual = true'); game("build('huegeltreppe', 10, 10)");
    expect(game('stairRotOf(stairAt(10, 10))')).toBe(3);
  });
});

describe('Drehen beim Bauen: ⟳ unten, R, Mausrad', () => {
  // Nutzer 11.10.2026: „wieso gibt es keinen R-Drehen-Knopf?“ – für die Treppe fehlten ⟳, R und Mausrad (nur ROTATABLE)
  it('⟳ ist zu sehen, R und Mausrad drehen reihum unter den Richtungen, die hinaufführen – in beide Richtungen', () => {
    game("setTool('huegeltreppe'); hover = { x: 10, y: 10 }");
    expect(game("document.getElementById('rot-btn').hidden")).toBe(false);
    const r0 = game('placeRot("huegeltreppe", 10, 10)');
    game("document.getElementById('rot-btn').click()");
    const r1 = game('placeRot("huegeltreppe", 10, 10)');
    expect(r1).not.toBe(r0); expect([0, 3]).toContain(r1);
    game("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' })); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }))");
    const r2 = game('placeRot("huegeltreppe", 10, 10)');
    expect([0, 3]).toContain(r2);
    game('rotateBuild(-1)');                                                // Mausrad rückwärts: ebenso reihum
    expect(game('placeRot("huegeltreppe", 10, 10)')).not.toBe(r2);
    game('rotateBuild(-1)');
    expect(game('placeRot("huegeltreppe", 10, 10)')).toBe(r2);
    // gerade Wand: nur eine Richtung – drehen ändert nichts
    game('hover = { x: 7, y: 9 }; rotateBuild(1)');
    expect(game('placeRot("huegeltreppe", 7, 9)')).toBe(1);
    game("setTool('look')");
    expect(game("document.getElementById('rot-btn').hidden")).toBe(true);
  });
});

describe('im Fenster', () => {
  it('⟳ reihum durch die Richtungen, die hinaufführen; ↶ zurück; nur eine Richtung: Knopf aus', () => {
    game("build('huegeltreppe', 10, 10, true); recalc()");
    const r0 = game('stairRotOf(stairAt(10, 10))');
    expect(game('stairTurns(10, 10).sort()')).toEqual([0, 3]);
    game('openInfo(10, 10)');
    expect(game("!!document.getElementById('p-stairrot') && !document.getElementById('p-stairrot').disabled")).toBe(true);
    game("document.getElementById('p-stairrot').click()");
    const r1 = game('stairRotOf(stairAt(10, 10))');
    expect(r1).not.toBe(r0); expect([0, 3]).toContain(r1);
    game("document.getElementById('p-stairrot').click()");
    expect(game('stairRotOf(stairAt(10, 10))')).toBe(r0);
    game("document.getElementById('p-stairrot').click()");
    expect(game('undo()')).toBe(true);
    expect(game('stairRotOf(stairAt(10, 10))')).toBe(r0);
    // gerade Wand: nur eine Richtung – Knopf ausgegraut
    game("build('huegeltreppe', 7, 9, true); recalc(); openInfo(7, 9)");
    expect(game('stairTurns(7, 9)')).toEqual([1]);
    expect(game("document.getElementById('p-stairrot').disabled")).toBe(true);
    game('closePanel()');
  });
});
