const { loadGame, game } = require('./helpers/load-game');

// Block 31: weit weg Gebäude und Dekos als fertige Bildchen (schneller), nah dran alles live
beforeAll(() => loadGame());
afterAll(() => game('if (globalThis.__na) nightAt = globalThis.__na'));
beforeEach(() => {
  game('if (!globalThis.__na) globalThis.__na = nightAt; nightAt = () => 0');   // tags (die Spieluhr läuft echt)
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("for (let y = 2; y <= 14; y++) for (let x = 2; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("for (let i = 0; i < 6; i++) state.tiles.set((3 + i * 2) + ',6', { b: 'haus', lvl: 2, wall: 1, roof: 2 }); state.tiles.set('4,10', { b: 'schule', lvl: 1 })");
  game("state.decos.set('5,8', [{ b: 'laterne' }, null, { b: 'bank' }, null]); recalc(); resize()");
  game('objSprites.clear(); cam.x = iso(8, 8).x; cam.y = iso(8, 8).y');
});
// ein paar Bilder: das Zeitbudget je Bild verteilt das Neumalen
const frame = z => game(`cam.z = ${z}; lastZoom = ${z}; lastZoomChange = -1e9; for (let i = 0; i < 6; i++) render(performance.now() + 1e6)`);

describe('Bildchen weit weg', () => {
  it('weit weg: Gebäude und Dekos kommen aus Bildchen – gleiche Häuser teilen sich eins', () => {
    for (let i = 0; i < 6; i++) frame(0.5);                                 // je Bild nur SPRITE_MS Zeit: unter Last braucht es mehrere
    const keys = game('[...objSprites.keys()]');
    expect(keys.filter(k => k.startsWith('haus|')).length).toBe(1);        // sechs gleiche Häuser, ein Bild
    expect(keys.some(k => k.includes('|schule|'))).toBe(true);              // eigenes Bild (vom Platz abhängig)
    expect(keys.some(k => k.startsWith('deco|laterne'))).toBe(true);
    let drawn = 0;
    game('globalThis.__do = drawObject; drawObject = (...a) => { globalThis.__n = (globalThis.__n || 0) + 1; return globalThis.__do(...a); }; globalThis.__n = 0');
    frame(0.5);
    drawn = game('globalThis.__n'); game('drawObject = globalThis.__do');
    expect(drawn).toBe(0);                                                    // nichts mehr neu gezeichnet
  });

  it('nah dran wird alles live gezeichnet', () => {
    frame(1.5);
    expect(game('objSprites.size')).toBe(0);
  });

  it('ändert sich ein Haus, bekommt es ein neues Bild', () => {
    frame(0.5);
    game("state.tiles.get('3,6').lvl = 3");
    frame(0.5);
    expect(game('[...objSprites.keys()].filter(k => k.startsWith("haus|")).length')).toBe(2);
  });

  it('Dämmerung: Lichter aus den Bildchen werden gestanzt wie sonst', () => {
    game('globalThis.__pn = performance.now; performance.now = () => 0; nightAt = () => 0.3');   // Uhr steht: Malzeit kostet nichts
    try {
      frame(1.5); const live = game('glows.length');
      frame(0.5); const cached = game('glows.length');
      expect(live).toBeGreaterThan(0);
      expect(cached).toBeGreaterThan(0);
      expect(game('[...objSprites.values()].some(e => e.glows.length > 0)')).toBe(true);
      expect(game('nightPics.length')).toBe(0);                                  // keine Nachtbilder in der Dämmerung
    } finally { game('performance.now = globalThis.__pn; nightAt = () => 0'); }
  });

  it('volle Nacht (Schritt 4): Bildchen mit Licht kommen als Nachtbild – kein Licht mehr einzeln, Lichtbilder für drawNight', () => {
    game('globalThis.__pn = performance.now; performance.now = () => 0; nightAt = () => NIGHT_MAX');
    try {
      frame(1.5); const live = game('glows.length');
      frame(0.5);
      expect(live).toBeGreaterThan(0);
      expect(game('glows.length')).toBe(0);                                      // alles aus Nachtbildern
      expect(game('nightPics.length')).toBeGreaterThan(0);
      const n = game('(() => { const e = [...objSprites.values()].find(e => e.night); return e && { lights: e.night.lights, erase: !!e.night.erase.c, light: !!e.night.light.c, z: e.night.z === e.z }; })()');
      expect(n).toMatchObject({ erase: true, light: true, z: true });
      expect(n.lights).toBeGreaterThan(0);
      game('nightAt = () => 0; frameNo = Math.ceil(frameNo / 120) * 120 - 1'); frame(0.5);   // tags: Nachtbilder werden freigegeben
      expect(game('[...objSprites.values()].some(e => e.night)')).toBe(false);
    } finally { game('performance.now = globalThis.__pn; nightAt = () => 0'); }
  });

  it('nie mitten im Bild zurücklesen (wartet auf die Grafikkarte): nur beim Zuschneiden am Bildanfang – Tag, Dämmerung, Nacht', () => {
    const n = game(`(() => {
      const P = Object.getPrototypeOf(document.createElement('canvas').getContext('2d')), gi = P.getImageData, oc = cropSprites;
      let inCrop = false, bad = 0, ok = 0;
      P.getImageData = function (...a) { if (inCrop) ok++; else bad++; return gi.apply(this, a); };
      cropSprites = () => { inCrop = true; try { oc(); } finally { inCrop = false; } };
      try {
        for (const nt of [0, 0.3, NIGHT_MAX]) { nightAt = () => nt; objSprites.clear(); cam.z = 0.5; lastZoom = 0.5; lastZoomChange = -1e9; spriteNoBudget = true; for (let i = 0; i < 4; i++) render(performance.now() + 1e6); spriteNoBudget = false; }
      } finally { P.getImageData = gi; cropSprites = oc; nightAt = () => 0; }
      return { bad, ok, night: [...objSprites.values()].some(e => e.night) };
    })()`);
    expect(n.bad).toBe(0);
    expect(n.ok).toBeGreaterThan(0);
    expect(n.night).toBe(true);                                                  // Nachtbilder entstehen trotzdem (ein Bild später)
  });

  it('Riesenrad und Windräder drehen sich auch von weitem (live)', () => {
    game("state.tiles.set('10,10', { b: 'windrad', lvl: 1 }); recalc()");
    frame(0.5);
    expect(game('[...objSprites.keys()].some(k => k.includes("|windrad|"))')).toBe(false);
  });
});

describe('Schnelles Nachschlagen', () => {
  it('Zählen über die Liste je Sorte ergibt dasselbe wie Feld für Feld', () => {
    game("for (let i = 0; i < 40; i++) { const x = 5 + (i * 7) % 9, y = 5 + (i * 5) % 9; if (!COVER.has(x + ',' + y)) state.tiles.set(x + ',' + y, { b: ['haus', 'blumen', 'feld', 'schule'][i % 4], lvl: 1 }); } recalc()");
    const slow = game(`(() => { const out = []; for (const [k] of state.tiles) { const [x, y] = keyXY(k); for (const r of [1, 3, 6]) { const seen = new Set(); for (const [a, b] of aroundTiles(x, y, r)) { const q = anchorAt(a, b); if (q && isHome(state.tiles.get(q).b)) seen.add(q); } out.push(seen.size); } } return out; })()`);
    const fast = game(`(() => { const out = []; for (const [k] of state.tiles) { const [x, y] = keyXY(k); for (const r of [1, 3, 6]) out.push(countNear(x, y, r, isHome)); } return out; })()`);
    expect(fast).toEqual(slow);
    const near = game(`(() => { const out = []; for (const [k] of state.tiles) { const [x, y] = keyXY(k); const seen = new Set(); for (const [a, b] of aroundTiles(x, y, 2)) { const q = anchorAt(a, b); if (q && isHome(state.tiles.get(q).b)) seen.add(q); } out.push([seen.size > 0, nearHouse(x, y)]); } return out; })()`);
    expect(near.every(([a, b]) => a === b)).toBe(true);
  });
});
