const { loadGame, game } = require('./helpers/load-game');

// Block 124 Schritt 2: Deko-Bildchen nach Variante geteilt, Bildchen auf den Inhalt zugeschnitten, ohne Speicher kein Absturz,
// Leinwände freigegeben, Zwischenspeicher beim Wechsel der Welt geleert
beforeAll(() => loadGame());
afterAll(() => game('if (globalThis.__na) nightAt = globalThis.__na'));
beforeEach(() => {
  game('if (!globalThis.__na) globalThis.__na = nightAt; nightAt = () => 0');   // tags (die Spieluhr läuft echt)
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; night = 0');
  game("for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc(); resize(); objSprites.clear()");
});

describe('Block 124 Schritt 2', () => {
  it('Deko-Bildchen: gleiche Variante → gleicher Schlüssel, andere Frucht/Blüte → anderer; Riesenblume je Platz und Welt', () => {
    const v = (b, x, y, s) => game(`decoVariant('${b}', ${x}, ${y}, ${s})`);
    const pairs = [];
    for (let i = 0; i < 60; i++) pairs.push([v('baum', i, 3, i % 4), game(`TREE_FRUIT[treeFruitOf(${i}, 3, ${i % 4})]`)]);
    const byKey = new Map();
    for (const [k, col] of pairs) { if (byKey.has(k)) expect(byKey.get(k)).toBe(col); else byKey.set(k, col); }
    expect(byKey.size).toBe(4);                                                   // vier Fruchtfarben
    expect(new Set([...Array(60).keys()].map(i => v('blumentopf', i, 2, 0))).size).toBe(5);
    expect(v('busch', 3, 3, 0)).toBe(v('busch', 9, 7, 2));                         // Busch: nur Farbe (im Schlüssel)
    const r1 = v('riesenblume', 3, 3, 0);
    game('state.seed = state.seed + 1');
    expect(v('riesenblume', 3, 3, 0)).not.toBe(r1);
    // weit weg: viele Bäume, nur so viele Bildchen wie Varianten
    game("for (let i = 0; i < 8; i++) state.decos.set((3 + i) + ',5', [{ b: 'baum', rot: 0 }, null, null, null, null, null, null, null, null]); recalc(); cam.x = iso(7, 5).x; cam.y = iso(7, 5).y; cam.z = 0.6; spriteNoBudget = true; render(performance.now()); spriteNoBudget = false");
    const keys = game("[...objSprites.keys()].filter(k => k.startsWith('deco|baum'))");
    expect(keys.length).toBe(new Set([...Array(8).keys()].map(i => v('baum', 3 + i, 5, 0))).size);
  });
  it('Bildchen werden auf den Inhalt zugeschnitten (am Anfang des nächsten Bilds); Ursprung und Lichter verschoben', () => {
    game(`globalThis.__gi = ctx.getImageData; ctx.getImageData = (x, y, w, h) => { const d = new Uint8ClampedArray(w * h * 4); for (let yy = 20; yy <= 22; yy++) for (let xx = 10; xx <= 12; xx++) d[(yy * w + xx) * 4 + 3] = 255; return { data: d, width: w, height: h }; }`);
    const e = game(`(() => { const r = paintSprite(40, 60, 20, () => { glows; }); const w0 = r.c.width; cropSprites(); if (w0 !== Math.ceil(80 * DPR)) throw new Error('vorher ungeschnitten'); return { w: r.c.width, h: r.c.height, ox: r.ox, oy: r.oy }; })()`);
    game('ctx.getImageData = globalThis.__gi');
    const dpr = game('DPR');
    expect([e.w, e.h]).toEqual([5, 5]);                                           // 3 × 3 Inhalt + 1 Rand
    expect(e.ox).toBeCloseTo(40 - 9 / dpr);
    expect(e.oy).toBeCloseTo(60 - 19 / dpr);
  });
  it('ohne Speicher (getContext liefert null): kein Absturz, dann eben live; g bleibt die Hauptleinwand', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); state.decos.set('7,7', [{ b: 'laterne', rot: 0 }, null, null, null, null, null, null, null, null]); state.terra.set('9,9', 'forest'); recalc()");
    game("globalThis.__gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = () => null; groundCache.clear(); spriteCache.clear()");
    let err = null;
    try { game('cam.x = iso(7, 7).x; cam.y = iso(7, 7).y; cam.z = 0.6; render(performance.now()); render(performance.now())'); } catch (e) { err = e.message; }
    game('HTMLCanvasElement.prototype.getContext = globalThis.__gc');
    expect(err).toBe(null);
    expect(game('g === ctx')).toBe(true);
    expect(game('objSprites.size')).toBe(0);
  });
  it('andere Welt laden: Bildchen und Boden der alten sind weg; ersetzte Bildchen werden freigegeben', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); recalc(); cam.x = iso(6, 6).x; cam.y = iso(6, 6).y; cam.z = 0.6; spriteNoBudget = true; render(performance.now()); spriteNoBudget = false");
    expect(game('objSprites.size')).toBeGreaterThan(0);
    const c = game('(() => { const e = [...objSprites.values()][0]; globalThis.__c = e.c; return !!e.c; })()');
    expect(c).toBe(true);
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(s)}))`);
    expect(game('[objSprites.size, groundCache.size]')).toEqual([0, 0]);
    expect(game('globalThis.__c.width')).toBe(0);                                  // Leinwand freigegeben
  });
});
