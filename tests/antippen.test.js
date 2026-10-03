const { loadGame, game } = require('./helpers/load-game');

// Block 71: Antippen trifft, was gezeichnet ist – Dach, Turm, Schild – nicht nur das Bodenfeld.
// jsdom malt nicht: inkAt wird durch eine Attrappe ersetzt (Gebäude = Kasten 20 breit, 80 hoch über seiner Mitte).
beforeAll(() => {
  loadGame();
  game('const _ink = inkAt; globalThis.realInk = _ink');
});
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('walkers.length = 0; strollers.length = 0; critters.length = 0; pillHits.length = 0; recalc()');
  game('cam.x = iso(12, 12).x; cam.y = iso(12, 12).y; cam.z = 1');
  game('inkAt = (sx, sy, cx, cy) => Math.abs(sx - cx) < 20 && sy > cy - 80 && sy < cy + 10 ? (globalThis.INK_FILL || 1) : 0; globalThis.INK_FILL = 1');
});
afterAll(() => game('inkAt = realInk'));
const panel = () => game("document.getElementById('panel').textContent");

describe('Antippen (Block 71)', () => {
  it('Dach eines Hauses: über einem leeren Feld öffnet das Haus, nicht den Rasen', () => {
    game("state.tiles.set('12,12', { b: 'haus', lvl: 1 }); recalc()");
    const [sx, sy] = game('(() => { const p = toScreen(12, 12); return [p.x, p.y - 60]; })()');
    expect(game(`(() => { const t = toTile(${sx}, ${sy}); return anchorAt(t.x, t.y); })()`)).toBeFalsy();   // Boden dort: leer
    game(`tap(${sx}, ${sy}, false)`);
    expect(game("document.getElementById('panel').hidden")).toBe(false);
    expect(panel()).toMatch(/Häuschen|Haus/);
  });

  it('vorderes Haus verdeckt das hintere: das vordere ist getroffen', () => {
    game("state.tiles.set('12,12', { b: 'haus', lvl: 1, name: 'Vorne' }); state.tiles.set('11,11', { b: 'haus', lvl: 1, name: 'Hinten' }); recalc()");
    const [sx, sy] = game('(() => { const p = toScreen(12, 12); return [p.x, p.y - 30]; })()');
    expect(game(`(() => { const t = toTile(${sx}, ${sy}); return anchorAt(t.x, t.y); })()`)).toBe('11,11');   // Boden: das hintere
    expect(game(`(() => { const h = objectAt(${sx}, ${sy}); return h.x + ',' + h.y; })()`)).toBe('12,12');
  });

  it('dünnes Ding davor (Gerüst): das Haus auf dem Bodenfeld gewinnt; auf leerem Boden das Dünne', () => {
    game("state.tiles.set('12,12', { b: 'haus', lvl: 1 }); recalc(); INK_FILL = 0.1");
    const [sx, sy] = game('(() => { const p = toScreen(12, 12); return [p.x, p.y - 30]; })()');
    expect(game(`(() => { const h = objectAt(${sx}, ${sy}); return h && h.x + ',' + h.y; })()`)).toBe('12,12');   // Boden darunter leer: das Dünne
    game("state.tiles.set('11,11', { b: 'haus', lvl: 1 }); recalc()");
    expect(game(`(() => { const h = objectAt(${sx}, ${sy}); return h && h.x + ',' + h.y; })()`)).toBe(null);   // Haus auf dem Bodenfeld: das zählt
  });

  it('Schild antippen öffnet die Sehenswürdigkeit – nur beim Ansehen', () => {
    game("pillHits.push({ x0: 100, y0: 100, x1: 200, y1: 120, look: true, open: () => { globalThis.PILL_OPEN = (globalThis.PILL_OPEN || 0) + 1; } })");
    game('tap(150, 110, false)');
    expect(game('globalThis.PILL_OPEN')).toBe(1);
    game("setTool('abriss'); tap(150, 110, false)");
    expect(game('globalThis.PILL_OPEN')).toBe(1);
  });

  it('Abreißen bleibt beim Bodenfeld: ein Tippen übers Dach reißt nichts ab', () => {
    game("state.tiles.set('12,12', { b: 'haus', lvl: 1 }); recalc(); setTool('abriss')");
    const [sx, sy] = game('(() => { const p = toScreen(12, 12); return [p.x, p.y - 60]; })()');
    game(`tap(${sx}, ${sy}, false)`);
    expect(game("state.tiles.has('12,12')")).toBe(true);
  });

  it('echte Zeichenprüfung schluckt Fehler (jsdom liefert kein Bild): nichts getroffen', () => {
    game("state.tiles.set('12,12', { b: 'haus', lvl: 1 }); recalc(); inkAt = realInk");
    const [sx, sy] = game('(() => { const p = toScreen(12, 12); return [p.x, p.y - 30]; })()');
    expect(game(`objectAt(${sx}, ${sy})`)).toBe(null);
  });
});
