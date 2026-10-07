const { loadGame, game } = require('./helpers/load-game');

// Block 124 Schritt 3: Zeitbudget fürs Neumalen zählt nur die Malzeit (Boden und Bildchen zusammen höchstens PAINT_MS, mindestens
// ein Bildchen je Bild). Vorher war es eine Frist ab Bildanfang – in großen Welten verbraucht, bevor das erste Gebäude drankam.
// Weit weg stehen jetzt auch in großen Welten Rauch, Fahnen, Fontänen still (Bildchen); was sich sichtbar dreht, bleibt live.
beforeAll(() => {
  loadGame();
  // Zeichenaufrufe mitschreiben (Zahlen gerundet), um zu prüfen, ob zwei Zeichnungen gleich sind
  game(`globalThis.__rec = (fn) => { const out = []; const r = v => typeof v === 'number' ? Math.round(v * 1000) / 1000 : typeof v === 'string' ? v : typeof v;
    const P = new Proxy({}, { get(t, p) { if (p === 'canvas') return { width: 100, height: 100 }; if (p === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }); if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createRadialGradient' || p === 'createLinearGradient') return (...a) => { out.push(p + a.map(r)); return { addColorStop: (...b) => out.push('stop' + b.map(r)) }; };
      if (p === 'createPattern') return () => ({}); if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      return (...a) => { out.push(String(p) + '(' + a.map(r).join(',') + ')'); }; }, set(t, p, v) { out.push(String(p) + '=' + r(v)); return true; } });
    const prev = g; g = P; try { fn(); } catch (e) { out.push('FEHLER ' + e.message); } finally { g = prev; } return out.join(';'); }`);
});
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; night = 0');
  game('if (!globalThis.__na) globalThis.__na = nightAt; nightAt = () => 0');                  // tags (die Spieluhr läuft echt)
  game("for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc(); resize(); objSprites.clear()");
});
afterAll(() => game('nightAt = globalThis.__na'));
// Uhr im Test: steht still, außer wo der Test sie vorstellt (Malen kostet so viel, wie er sagt)
const withClock = (setup, fn) => {
  game(`globalThis.__pn = performance.now; globalThis.__t = 0; performance.now = () => __t; ${setup}`);
  try { return fn(); } finally { game('performance.now = globalThis.__pn'); }
};
const view = (z, x = 9, y = 9) => game(`cam.z = ${z}; lastZoom = ${z}; lastZoomChange = -1e9; cam.x = iso(${x}, ${y}).x; cam.y = iso(${x}, ${y}).y`);
const frame = () => game('render(1e6); ({ miss: SPRITE_STATS.miss, made: SPRITE_STATS.made, spent: spriteSpent, ground: groundSpent })');

describe('Malzeit-Budget (Block 124 Schritt 3)', () => {
  it('auch wenn bis zu den Gebäuden schon 20 ms vergangen sind, entstehen Bildchen – bald fehlt keins mehr', () => {
    game("for (let i = 0; i < 12; i++) state.tiles.set((3 + (i % 6) * 2) + ',' + (4 + Math.floor(i / 6) * 4), { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    const runs = withClock("globalThis.__dg = drawGroundCached; drawGroundCached = (...a) => { __t += 20; return __dg(...a); }", () => {
      try { const out = []; for (let i = 0; i < 8; i++) out.push(frame()); return out; } finally { game('drawGroundCached = globalThis.__dg'); }
    });
    expect(runs[0].made).toBeGreaterThan(0);                                        // vorher: Frist längst vorbei, nichts gemalt
    expect(runs[runs.length - 1]).toMatchObject({ miss: 0, made: 0 });
    expect(game(`[...objSprites.values()].filter(e => e.used === frameNo).every(e => Math.abs(zoomStep(cam.z) / e.z - 1) < 0.02)`)).toBe(true);
  });
  it('höchstens SPRITE_MAX neue Bildchen je Bild (grobe Uhr: Malen kostet scheinbar nichts)', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    const r = withClock('', () => [frame(), frame()]);
    expect(r[0].made).toBe(game('SPRITE_MAX'));
    expect(r[1].made).toBeGreaterThan(0);
  });
  it('Boden und Bildchen teilen sich PAINT_MS: höchstens ein Bildchen darüber; malt der Boden alles, kommt trotzdem eins', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    const r = withClock("globalThis.__ps = paintSprite; paintSprite = (...a) => { __t += 3; return __ps(...a); }", () => {
      try { const a = frame(); game('groundCache.clear(); globalThis.__rg = renderGroundChunk; renderGroundChunk = (...a) => { __t += 9; return __rg(...a); }');
        try { return [a, frame()]; } finally { game('renderGroundChunk = globalThis.__rg'); } } finally { game('paintSprite = globalThis.__ps'); }
    });
    const P = game('PAINT_MS');
    expect(r[0].made).toBe(Math.floor(P / 3) + 1);                                 // 0, 3, 6, 9 → bei 12 Schluss
    expect(r[0].spent + r[0].ground - P).toBeLessThan(3 + 1e-9);
    expect(r[1].ground).toBeGreaterThan(P);                                         // fehlender Boden wird immer gemalt …
    expect(r[1].made).toBe(1);                                                      // … und trotzdem ein Bildchen
  });
  it('Aufholen: fehlten im letzten Bild viele Bildchen, darf mehr gemalt werden (PAINT_CATCH)', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    const r = withClock("globalThis.__ps = paintSprite; paintSprite = (...a) => { __t += 3; return __ps(...a); }", () => {
      try { game('SPRITE_STATS.miss = 0'); return [frame(), frame(), game('spriteCatch')]; } finally { game('paintSprite = globalThis.__ps'); }
    });
    const [P, C, M] = game('[PAINT_MS, PAINT_CATCH, CATCH_MISS]');
    expect(r[0].made).toBe(Math.floor(P / 3) + 1);                                 // erst normal …
    expect(r[0].miss).toBeGreaterThanOrEqual(M);
    expect(r[1].made).toBe(Math.floor(C / 3) + 1);                                 // … dann aufholen
  });
  it('nachts gilt seit Schritt 4 dasselbe Malzeit-Budget (vorher die Frist ab Bildanfang)', () => {
    game("state.tiles.set('6,6', { b: 'schule', lvl: 1 }); recalc(); nightAt = () => 0.45");
    view(0.5, 6, 6);
    try {
      const r = withClock("globalThis.__dg = drawGroundCached; drawGroundCached = (...a) => { __t += 20; return __dg(...a); }", () => {
        try { return frame(); } finally { game('drawGroundCached = globalThis.__dg'); }
      });
      expect(r.made).toBeGreaterThan(0);                                          // 20 ms bis zu den Gebäuden – trotzdem Bildchen
    } finally { game('nightAt = () => 0'); }
  });
  it('im Bildchen landet nichts in afterMovers (Bahnübergang legt seine Vorderseite über die Züge); nie verschachtelt', () => {
    const n = game('afterMovers.length');
    game('paintSprite(10, 10, 10, () => { afterMovers.push(() => {}); })');
    expect(game('afterMovers.length')).toBe(n);
    expect(game('paintSprite(10, 10, 10, () => { globalThis.__inner = paintSprite(5, 5, 5, () => {}); }), globalThis.__inner')).toBe(null);
  });
});

describe('Was weit weg still steht (Block 124, Entscheidung E1)', () => {
  // Jede Zeichnung, die sich mit der Zeit ändert, steht weit weg im Bildchen still – außer sie steht in SPRITE_LIVE.
  // Kommt etwas Neues dazu, das sich bewegt, schlägt dieser Test an: dann entscheiden, ob es live bleiben soll
  it('Bestandsliste: was sich bewegt und trotzdem ein Bildchen bekommt', () => {
    const still = game(`(() => { const out = [];
      for (const b of Object.keys(ITEMS)) { if (b === 'weg' || SPRITE_LIVE.has(b)) continue; const small = !!ITEMS[b].small;
        const draw = now => __rec(() => { PASS = small ? null : 'object'; try { drawObject(b, 0, 0, 0.5, now, 7, 7, 1, small ? { rot: 0, slot: 0, col: 0, form: 0 } : { b, lvl: 1, rot: 0 }); } finally { PASS = null; } });
        const a = draw(0); if ([700, 1900, 60000].some(n => draw(n) !== a)) out.push(b); }
      return out; })()`);
    expect(still).toEqual(game('[...ANIM_ITEMS]'));                                    // nah (Zoom 1–2) zeichnet render.js genau diese live (ANIM_ITEMS)
  });
  it('Fahrgeschäfte, Wasserrad und Bahnübergang bleiben weit weg live', () => {
    game("state.tiles.set('4,4', { b: 'fz_karussell', lvl: 1 }); state.tiles.set('8,4', { b: 'wasserkraft', lvl: 1 }); state.tiles.set('6,9', { b: 'schiene', lvl: 1, cross: true }); state.tiles.set('7,9', { b: 'schiene', lvl: 1 }); recalc()");
    view(0.5, 6, 6);
    game('spriteNoBudget = true; render(1e6); spriteNoBudget = false');
    const keys = game('[...objSprites.keys()]');
    for (const b of ['fz_karussell', 'wasserkraft', 'schiene']) expect(keys.some(k => k.includes(`|${b}|`))).toBe(false);
  });
});

describe('Zoomstufen und Vorbereiten (Block 124)', () => {
  it('zoomStep: nächstgrößere Stufe je 20 % – nie kleiner als der Zoom, höchstens 25 % größer', () => {
    for (const z of [0.2, 0.33, 0.45, 0.5, 0.64, 0.7, 0.8, 0.95, 1, 1.3, 2.6]) {
      const s = game(`zoomStep(${z})`);
      expect(s).toBeGreaterThanOrEqual(z - 1e-9);
      expect(s / z).toBeLessThan(1.25 + 1e-9);
    }
    expect(game('zoomStep(0.8)')).toBeCloseTo(0.8);
    expect(game('zoomStep(1)')).toBeCloseTo(1);
  });
  it('Zoomen innerhalb einer Stufe malt kein Bildchen und keinen Boden neu', () => {
    game("for (let i = 0; i < 6; i++) state.tiles.set((3 + i * 2) + ',6', { b: 'schule', lvl: 1 }); recalc()");
    view(0.7);
    game('spriteNoBudget = true; render(1e6); render(1e6); spriteNoBudget = false');
    const n0 = game('objSprites.size');
    expect(n0).toBeGreaterThan(0);
    const r = [0.68, 0.66, 0.65].map(z => { view(z); game('render(1e6)'); return game('SPRITE_STATS.made'); });
    expect(r).toEqual([0, 0, 0]);
    expect(game('objSprites.size')).toBe(n0);
  });
  it('nach dem Zoomen: scharfe Bildchen im Hintergrund, alle zugleich getauscht (keine Welle)', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    game('spriteNoBudget = true; render(1e6); render(1e6); spriteNoBudget = false');
    const zOf = () => game('[...new Set([...objSprites.values()].filter(e => e.used === frameNo).map(e => +e.z.toFixed(3)))]');
    expect(zOf()).toEqual([game('+zoomStep(0.5).toFixed(3)')]);
    view(0.7);
    const seen = withClock("globalThis.__ps = paintSprite; paintSprite = (...a) => { __t += 3; return __ps(...a); }", () => {
      try { const out = []; for (let i = 0; i < 60; i++) { frame(); out.push(zOf()); } return out; } finally { game('paintSprite = globalThis.__ps'); }
    });
    const zs = game('+zoomStep(0.7).toFixed(3)');
    expect(seen.every(l => l.length === 1)).toBe(true);                             // nie gemischt: alle alt oder alle neu
    expect(seen[0]).toEqual([game('+zoomStep(0.5).toFixed(3)')]);                   // erst noch die alten …
    expect(seen[seen.length - 1]).toEqual([zs]);                                    // … dann alle neuen
  });
  it('Vorbereiten: fehlte fast alles, viel größeres Budget und der Hinweis oben', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    const r = withClock("globalThis.__ps = paintSprite; paintSprite = (...a) => { __t += 3; return __ps(...a); }", () => {
      try { game('SPRITE_STATS.miss = 1000'); return [frame(), game('spritePrep')]; } finally { game('paintSprite = globalThis.__ps'); }
    });
    expect(r[1]).toBe(true);
    expect(r[0].made).toBeGreaterThan(game('Math.floor(PAINT_CATCH / 3) + 1'));
  });
});

describe('Schlüssel-Wächter (Block 124)', () => {
  // Geteilte Bildchen (Häuser, kleine Läden) gelten für jeden Platz mit gleichem Schlüssel. Zeichnet so ein Gebäude etwas, das
  // nicht im Schlüssel steht (Platz, Nachbarn, Eigenschaft), sähe es weit weg falsch aus – bisher in großen Welten verdeckt,
  // weil dort fast alles live gezeichnet wurde
  it('gleicher Schlüssel → gleiche Zeichnung, über Plätze, Nachbarn und Stufen', () => {
    const bad = game(`(() => {
      const keyOf = (t, x, y) => { let key; const o = getSprite; getSprite = k => { key = k; return null; }; try { spriteTile(t, x, y, { x: 0, y: 0 }, 0.6, 0, 1, 1); } finally { getSprite = o; } return key; };
      // bekannte Ausnahme: Kiesel/Muster im Gartenweg liegen je Platz anders – weit weg tragen alle das Muster des ersten (nicht zu sehen)
      const dgp = drawGardenPath; drawGardenPath = (cx, cy, z, x, y, gp) => dgp(cx, cy, z, 0, 0, gp);
      const drawOf = (t, x, y) => __rec(() => { PASS = 'object'; try { drawObject(t.b, 0, 0, 0.6, 0, x, y, t.lvl, t); } finally { PASS = null; } });
      const shared = Object.keys(ITEMS).filter(b => !ITEMS[b].small && ((isHome(b) && b !== 'hausboot') || (SHOPS[b] && !SHOPS[b].size)));
      // Plätze: allein, Weg davor, Weg rundum, gleiche Nachbarn, an der Ecke
      const spots = [[4, 4, []], [8, 4, [[8, 5, 'weg'], [9, 4, 'weg']]], [12, 4, [[11, 4, 'weg'], [13, 4, 'weg'], [12, 3, 'weg'], [12, 5, 'weg']]],
        [5, 9, [[4, 9, 'X'], [6, 9, 'X']]], [9, 9, [[9, 8, 'X'], [9, 10, 'X']]], [13, 9, [[13, 10, 'weg'], [14, 9, 'X']]], [4, 14, []], [10, 14, [[10, 15, 'weg']]]];
      const out = []; let same = 0;
      for (const b of shared) for (const lvl of [1, 2, 3]) for (const rot of [0, 1, 2, 3]) for (const paint of [{}, { wall: 1, roof: 2 }]) {   // gestrichen: alle Plätze ein Schlüssel
        for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) state.tiles.delete(x + ',' + y);
        for (const [x, y, nb] of spots) { state.tiles.set(x + ',' + y, { b, lvl, rot, ...paint }); for (const [a, c, n] of nb) state.tiles.set(a + ',' + c, n === 'X' ? { b, lvl, rot, ...paint } : { b: 'weg', lvl: 1, style: 'sand' }); }
        recalc();
        const seen = new Map();
        for (const [x, y] of spots) { const t = state.tiles.get(x + ',' + y), k = keyOf(t, x, y), d = drawOf(t, x, y);
          if (seen.has(k)) { same++; if (seen.get(k)[0] !== d) out.push(b + ' lvl ' + lvl + ' rot ' + rot + ' ' + JSON.stringify(paint) + ': ' + seen.get(k)[1] + ' ≠ ' + x + ',' + y); } else seen.set(k, [d, x + ',' + y]); }
      }
      drawGardenPath = dgp;
      return { out, same }; })()`);
    expect(bad.out).toEqual([]);
    expect(bad.same).toBeGreaterThan(500);                                          // es wurde wirklich verglichen
  }, 180e3);                                                                        // viele Zeichnungen: auf langsamen Rechnern (und unter Last) lange
});
