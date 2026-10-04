const { loadGame, game } = require('./helpers/load-game');

// Block 83: Leuchtturm-Kap (3×3) – Bauen an der Küste, alte Leuchttürme wachsen oder bleiben klein, Fest
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e9");
  game("for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  // Küste: Land bis x = 12, Wasser ab x = 13 (Zeilen 4 … 14)
  game("for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) { state.terra.set(x + ',' + y, x >= 13 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } waterChanged(); sandCache.clear(); recalc()");
  game("for (let x = 2; x <= 8; x++) state.tiles.set(x + ',16', { b: 'haus', lvl: 5 }); nameHouses(); recalc()");   // Einwohner für den Wärter
});

describe('Leuchtturm-Kap (Block 83)', () => {
  it('ist 3×3, braucht die Küste, Bauen feiert mit Feuerwerk', () => {
    expect(game("sizeOf('leuchtturm', 0)")).toEqual([3, 3]);
    expect(game("placeError('leuchtturm', 5, 5, 0)")).toMatch(/Wasser/);                 // mitten im Land
    expect(game("placeError('leuchtturm', 10, 6, 0)")).toBe(null);                      // vorn das Wasser
    game('fireworksUntil = 0');
    expect(game("build('leuchtturm', 10, 6, true)")).toBe(true);
    expect(game('state.festival')).toBe(true);
    expect(game('fireworksUntil > performance.now()')).toBe(true);
    for (const r of [0, 1, 2, 3]) expect(() => game(`drawObject('leuchtturm', 200, 300, 1.2, 1000, 10, 6, 1, { b: 'leuchtturm', lvl: 1, rot: ${r} })`)).not.toThrow();
  });
  it('alter 1×1-Leuchtturm: wächst beim Laden, wenn Platz ist (Wege zurück); sonst bleibt er klein und wächst später im Fenster', () => {
    game("state.tiles.set('12,8', { b: 'leuchtturm', lvl: 1, rot: 0 }); state.tiles.set('11,9', { b: 'weg', lvl: 1, style: 'sand' })");
    game("state.tiles.set('12,12', { b: 'leuchtturm', lvl: 1, rot: 0 }); state.tiles.set('11,12', { b: 'haus', lvl: 1 }); state.tiles.set('12,11', { b: 'haus', lvl: 1 }); state.tiles.set('12,13', { b: 'haus', lvl: 1 })");
    const d = game('JSON.parse(JSON.stringify(serialize()))'); d.v = 11;
    const m = game('state.money');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    const lights = game("[...state.tiles].filter(([k, t]) => t.b === 'leuchtturm').map(([k, t]) => [k, !!t.mini]).sort()");
    expect(lights.filter(l => !l[1]).length).toBe(1);                                   // einer ist gewachsen …
    expect(lights.filter(l => l[1])).toEqual([['12,12', true]]);                        // … der andere hat keinen Platz
    const grown = game("(() => { const [k, t] = [...state.tiles].find(([k, t]) => t.b === 'leuchtturm' && !t.mini); return footprint('leuchtturm', ...keyXY(k), t.rot).map(p => p.join()); })()");
    expect(grown).toContain('12,8');                                                    // das alte Feld gehört dazu
    expect(game(`${JSON.stringify(grown)}.every(k => { const a = anchorAt(...keyXY(k)); return a && state.tiles.get(a).b === 'leuchtturm'; })`)).toBe(true);   // nichts darunter
    const gone = game("state.tiles.has('11,9')") ? 0 : 1;                                // Weg im Weg: zurückgegeben
    expect(game('state.money')).toBe(m + gone * game('ITEMS.weg.cost'));
    expect(game("sizeOf('leuchtturm', 0, state.tiles.get('12,12'))")).toEqual([1, 1]);
    game("state.tiles.delete('11,12'); state.tiles.delete('12,11'); state.tiles.delete('12,13'); recalc(); openInfo(12, 12)");
    game("document.querySelector('#panel [data-lgrow]').click()");
    expect(game("[...state.tiles.values()].filter(t => t.b === 'leuchtturm' && !t.mini).length")).toBe(2);
    const d2 = game('JSON.parse(JSON.stringify(serialize()))');
    expect(d2.v).toBe(12);
    game(`adoptState(parseSave(${JSON.stringify(d2)}))`);
    expect(game("[...state.tiles.values()].filter(t => t.b === 'leuchtturm').length")).toBe(2);
  });
  it('Bildchen im Baumenü und im Tagebuch: für jedes Bauteil ohne Fehler (auch der hohe Leuchtturm)', () => {
    const bad = game("Object.keys(ITEMS).filter(b => { try { thumbRaw(b); return false; } catch (e) { return true; } })");
    expect(bad).toEqual([]);
    expect(() => game('diaryPicture({ lighthouse: true, lit: true })')).not.toThrow();
  });
  it('nachts ab und zu ein Feuerwerk über dem Kap', () => {
    game("build('leuchtturm', 10, 6, true); closeModal(); fireworksUntil = 0; lightFireNext = 0; night = 0.6");
    game('SPRITE_PAINT = true');                                                         // zählt wie live gezeichnet
    expect(game('lightFireTick(1e9)')).toBe(true);
    expect(game('lightFireTick(1e9 + 1000)')).toBe(false);                              // nicht gleich wieder
    game('SPRITE_PAINT = false; night = 0');
  });
});
