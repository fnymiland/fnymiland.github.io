const { loadGame, game } = require('./helpers/load-game');

// Block 124 Schritt 0/1: Messzähler, und schneller ohne Bildänderung – Felder ohne Linien und ohne Dekos werden übersprungen,
// Bildchen ohne Licht nur eingesetzt, Licht-Einträge nur einmal
beforeAll(() => loadGame());
afterAll(() => game('if (globalThis.__na) nightAt = globalThis.__na'));
beforeEach(() => {
  game('if (!globalThis.__na) globalThis.__na = nightAt; nightAt = () => 0');   // tags (die Spieluhr läuft echt)
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; night = 0');
  game("for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc()");
});
// alter Weg (vor Block 124): jedes Feld Pfeiler und beide hinteren Kanten
const oldEdgesAt = '(x, y, z, now) => { if (!state.edges.size) return; gatePillarsAt(x, y, z); for (const k of ["a" + x + "," + y, "b" + x + "," + y]) { const e = state.edges.get(k); if (e) drawEdge(k, e, z, now); } }';
const calls = fn => game(`(() => { const out = []; const od = drawEdge, og = gatePillarsAt;
  drawEdge = (k) => out.push('E' + k); const ocircle = circle; let n = 0;
  try { ${fn} } finally { drawEdge = od; } return out; })()`);

describe('Block 124: schneller, gleiches Bild', () => {
  it('Linien: nur Felder mit Linie (bzw. Mauer-Eckpunkt) werden angefasst – gleiche Aufrufe wie vorher, auch ohne recalc', () => {
    game("state.edges.set('a5,5', { b: 'hecke', style: 'niedrig' }); state.edges.set('b7,7', { b: 'mauer', style: 'backstein' }); state.edges.set('a9,4', { b: 'zaun', style: 'latten' }); recalc()");
    const grid = f => `for (let y = 2; y <= 14; y++) for (let x = 2; x <= 14; x++) (${f})(x, y, 1, 0);`;
    expect(calls(grid('drawEdgesAt'))).toEqual(calls(grid(oldEdgesAt)));
    game("state.edges.set('a11,11', { b: 'hecke', style: 'hoch' })");                           // ohne recalc: trotzdem gezeichnet
    expect(calls('drawEdgesAt(11, 11, 1, 0)')).toEqual(['Ea11,11']);
    expect(game('edgeFieldsHas(3, 3)')).toBe(false);
    // Mauer: an beiden Eckpunkten der Pfeiler-Platz (Tor durch Weg auf beiden Seiten)
    game("state.tiles.set('6,7', { b: 'weg', lvl: 1 }); state.tiles.set('7,7', { b: 'weg', lvl: 1 }); recalc()");
    expect(game('[edgeFieldsHas(7, 7), edgeFieldsHas(7, 8)]')).toEqual([true, true]);
    let pillars = 0;
    game("globalThis.__wp = wallPillar; wallPillar = (...a) => { globalThis.__p = (globalThis.__p || 0) + 1; return globalThis.__wp(...a); }; globalThis.__p = 0");
    game('for (let y = 2; y <= 14; y++) for (let x = 2; x <= 14; x++) drawEdgesAt(x, y, 1, 0)');
    pillars = game('globalThis.__p'); game('wallPillar = globalThis.__wp');
    game("globalThis.__p = 0; wallPillar = (...a) => { globalThis.__p++; return globalThis.__wp(...a); }");
    game(`(${oldEdgesAt.replace(/drawEdge\(k, e, z, now\)/, 'drawEdge(k, e, z, now)')}); for (let y = 2; y <= 14; y++) for (let x = 2; x <= 14; x++) (${oldEdgesAt})(x, y, 1, 0)`);
    expect(pillars).toBe(game('globalThis.__p')); game('wallPillar = globalThis.__wp');
    expect(pillars).toBeGreaterThan(0);
  });
  it('Bildchen ohne Licht: genau ein drawImage, kein save/restore', () => {
    const r = game(`(() => { const out = []; const od = g.drawImage, os = g.save; g.drawImage = () => out.push('bild'); g.save = () => out.push('save');
      try { putSprite({ c: { width: 20, height: 20 }, ox: 0, oy: 0, z: 1, glows: [], mask: null }, 100, 100, 1); } finally { g.drawImage = od; g.save = os; } return out; })()`);
    expect(r).toEqual(['bild']);
  });
  it('Felder ohne Dekos: drawSmall wird gar nicht erst gerufen; mit Deko wie bisher', () => {
    game("state.decos.set('6,6', [{ b: 'laterne', rot: 0 }, null, null, null, null, null, null, null, null]); state.tiles.set('8,8', { b: 'haus', lvl: 1 }); recalc(); resize()");
    const seen = game(`(() => { const out = []; const od = drawSmall; drawSmall = (k, ...a) => { out.push(k); return od(k, ...a); };
      try { cam.z = 1.5; cam.x = iso(8, 8).x; cam.y = iso(8, 8).y; render(performance.now()); } finally { drawSmall = od; } return out; })()`);
    expect(seen).toContain('6,6');
    expect(seen.every(k => game(`state.decos.has('${k}')`))).toBe(true);
  });
  it('Zähler: fehlende und neu gemalte Bildchen je Bild; Messschalter wirken', () => {
    game("for (let i = 0; i < 5; i++) state.tiles.set((3 + i * 2) + ',6', { b: 'haus', lvl: 2 }); recalc(); resize(); objSprites.clear(); cam.x = iso(8, 8).x; cam.y = iso(8, 8).y; cam.z = 0.5");
    game('spriteNoBudget = true; render(performance.now()); spriteNoBudget = false');
    expect(game('SPRITE_STATS.made')).toBeGreaterThan(0);
    game('render(performance.now())');
    expect(game('[SPRITE_STATS.made, SPRITE_STATS.miss]')).toEqual([0, 0]);
    game('spriteForce = false; objSprites.clear(); render(performance.now()); spriteForce = null');
    expect(game('objSprites.size')).toBe(0);                                                    // live: keine Bildchen
    expect(game('MESS')).toBe(null);                                                            // ohne ?messen nichts
  });
});
