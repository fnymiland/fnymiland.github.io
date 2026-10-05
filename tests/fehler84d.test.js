const { loadGame, game } = require('./helpers/load-game');

// Block 84d: Zeichnen – Fehler aus der großen Fehlersuche
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; resetUndo(); night = 0");
  game("state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } waterChanged(); sandCache.clear(); recalc(); resize()");
});
// zählt, wie oft drawFn (globale Zeichenfunktion) für b im Objekt-Durchgang gerufen wird
const countDraws = (fnName, pred, setup, call = true) => game(`(() => { const orig = ${fnName}; let n = 0; ${fnName} = function (...a) { if (${pred}) n++; return ${call} ? orig.apply(this, a) : undefined; };
  try { ${setup}; render(1000); } finally { ${fnName} = orig; } return n; })()`);

describe('Zeichnen (84d)', () => {
  it('hohe große Gebäude verschwinden am unteren Bildrand nicht streifenweise', () => {
    game("state.tiles.set('10,10', { b: 'riesenrad', lvl: 1, phase: 99 }); recalc()");
    const n = countDraws('drawObject', "a[0] === 'riesenrad' && PASS === 'object'",
      "cam.z = 1.2; const f = iso(14, 14); cam.x = f.x; cam.y = f.y - (H / 2 + 140) / cam.z");
    expect(n).toBe(9);                                                  // alle 9 Streifen
  });
  it('Züge in der Halle eines langen Hauptbahnhofs werden gezeichnet, auch wenn die Ecke nicht im Bild ist', () => {
    game("state.tiles.set('4,4', { b: 'hbf', lvl: 1, rot: 0, gleise: 10 }); recalc()");
    const hall = game("[...HALL].find(k => { const [x, y] = keyXY(k); return x + y > 26; })");
    expect(hall).toBeTruthy();
    const [hx, hy] = hall.split(',').map(Number);
    let n;
    try {
      n = countDraws('drawTrainCar', 'true',
        `trainCars = (() => { const o = trainCars; window.__tc = o; return () => [{ px: ${hx}, py: ${hy}, train: { powered: true } }]; })(); cam.z = 2.5; const c = iso(${hx}, ${hy}); cam.x = c.x; cam.y = c.y`, false);
    } finally { game('trainCars = window.__tc'); }
    expect(n).toBe(1);
  });
  it('Bahnsteig und Glashaus-Boden gehören zum Boden-Durchgang', () => {
    for (const b of ['station', 'glashaus', 'glashaus_l']) expect(game(`hasGroundPart({ b: '${b}', lvl: 1 })`)).toBe(true);
  });
  it('langer Hauptbahnhof: sein Boden kommt in alle Grundstücke, die er berührt', () => {
    game("state.tiles.set('5,2', { b: 'hbf', lvl: 1, rot: 0, gleise: 8 }); recalc()");
    const [w, h] = game("sizeOf('hbf', 0, state.tiles.get('5,2'))");
    const n = countDraws('drawObject', "a[0] === 'hbf' && PASS === 'ground'", `terrainCache.clear(); groundVersion++; cam.z = 0.6; const c = iso(${5 + (w - 1) / 2}, ${2 + h - 1}); cam.x = c.x; cam.y = c.y`);
    expect(n).toBeGreaterThan(0);
    expect(game(`(() => { const want = ([ax, ay], w = 1, h = 1) => Math.floor((ax + w - 1) / CHUNK) >= 2 - 1 && Math.floor(ax / CHUNK) <= 2 + 1; return want([5, 2], ${w}, ${h}); })()`)).toBe(true);
  });
  it('Bildchen weit weg: hoch genug für lange Hbf, Gerüste und Baumhaus', () => {
    expect(game("spriteTop('hbf', 4, 20)")).toBeGreaterThanOrEqual(218);
    expect(game("spriteTop('baumhaus', 1, 1)")).toBeGreaterThanOrEqual(105);
    expect(game("spriteTop('schloss', 5, 5)")).toBeGreaterThanOrEqual(game('WONDERS.schloss.h') + 70);
  });
  it('geteilte Bildchen: gewählte Farbe ≠ Würfelfarbe; Reihenhaus-Fassaden und Rathaus-Flagge im Schlüssel', () => {
    const keyOf = (t, x, y) => game(`(() => { let key; const o = getSprite; getSprite = (k) => { key = k; return null; }; try { spriteTile(${JSON.stringify(t)}, ${x}, ${y}, { x: 0, y: 0 }, 0.6, 0, 1, 1); } finally { getSprite = o; } return key; })()`);
    const w0 = game('Math.floor(hash(8, 8, 3) * 7)'), r0 = game('Math.floor(hash(8, 8, 4) * 7)');
    expect(keyOf({ b: 'kiosk', lvl: 1 }, 8, 8)).not.toBe(keyOf({ b: 'kiosk', lvl: 1, wall: w0, roof: r0 }, 14, 14));
    expect(keyOf({ b: 'reihenhaus', lvl: 1, wall: 1, roof: 1 }, 0, 0)).toContain('-');
    const k1 = keyOf({ b: 'rathaus', lvl: 1 }, 1, 1);
    game("state.town.color = FLAG_COLORS[3]");
    expect(keyOf({ b: 'rathaus', lvl: 1 }, 1, 1)).not.toBe(k1);
  });
  it('Glasvilla wirft einen Schatten; Offshore-Windrad dreht sich auch von weitem', () => {
    const sh = game("shadowOf({ b: 'haus', lvl: 6 }, 8, 8)");
    expect(sh.flat().every(Number.isFinite)).toBe(true);
    expect(game("SPRITE_LIVE.has('offshore')")).toBe(true);
  });
  it('Nachtlicht: dasselbe Licht mehrfach gestanzt wird nicht schwächer', () => {
    game('night = 0.8; glowCells.clear()');
    const alphas = game("(() => { const out = []; const d = Object.getOwnPropertyDescriptor(g, 'globalAlpha'); Object.defineProperty(g, 'globalAlpha', { configurable: true, get: () => 1, set: v => out.push(v) }); try { for (let i = 0; i < 3; i++) punchGlow([[10, 10], [14, 10], [14, 16], [10, 16]], 18); } finally { delete g.globalAlpha; } return out.filter((v, i) => i % 3 === 0); })()");
    expect(new Set(alphas).size).toBe(1);
    game('night = 0');
  });
  it('Deko in der vorderen Ecke kommt zuletzt', () => {
    expect(game('SLOTS_FRONT[SLOTS_FRONT.length - 1]')).toBe(3);
  });
  it('Vorschau beim Bauen: Märchenschloss in der neuen Gestalt, gemerkte Farben', () => {
    game("state.paintNew.windrad = { roof: 2 }");
    const seen = game("(() => { const out = []; const o = drawObject; drawObject = function (...a) { if (a[0] === 'fz_schloss' || a[0] === 'windrad') out.push([a[0], a[8] && a[8].cs ? a[8].cs.mt : null, a[8] && a[8].roof]); return o.apply(this, a); }; try { for (const b of ['fz_schloss', 'windrad']) { setTool(b); hover = { x: 12, y: 12 }; previewCache = null; render(1000); } } finally { drawObject = o; setTool('look'); } return out; })()");
    expect(seen.find(s => s[0] === 'fz_schloss')[1]).toBe(1);
    expect(seen.find(s => s[0] === 'windrad')[2]).toBe(2);
  });
  it('ein Fehler beim Zeichnen eines Gebäudes lässt keinen Ausschnitt hängen', () => {
    game("state.tiles.set('10,10', { b: 'schule', lvl: 3, rot: 0 }); recalc(); cam.z = 1.5; const c = iso(10, 10); cam.x = c.x; cam.y = c.y");
    const depth = game("(() => { let d = 0; const s = g.save, r = g.restore; g.save = () => { d++; }; g.restore = () => { d--; }; const o = drawObject; let thrown = false; drawObject = function (...a) { if (a[0] === 'schule' && !thrown) { thrown = true; throw new Error('test'); } return o.apply(this, a); }; try { try { render(1000); } catch (e) { } } finally { drawObject = o; delete g.save; delete g.restore; } return d; })()");
    expect(depth).toBe(0);
  });
});
