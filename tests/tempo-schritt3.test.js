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
  game('if (!globalThis.__na) globalThis.__na = nightAt; nightAt = () => 0; if (!globalThis.__gh) globalThis.__gh = gameHour; gameHour = () => 12');                  // tags (die Spieluhr läuft echt) – Uhr fest (Uhren-Gebäude, Rathaus-Fassung)
  game("for (let y = 2; y <= 16; y++) for (let x = 2; x <= 16; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc(); resize(); objSprites.clear()");
});
afterAll(() => game('nightAt = globalThis.__na; if (globalThis.__gh) gameHour = globalThis.__gh'));
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
  it('Bahnübergang bleibt weit weg live; Fahrgeschäfte und Wasserrad stehen still als Bildchen (Block 144)', () => {
    game("state.tiles.set('4,4', { b: 'fz_karussell', lvl: 1 }); state.tiles.set('8,4', { b: 'wasserkraft', lvl: 1 }); state.tiles.set('6,9', { b: 'schiene', lvl: 1, cross: true }); state.tiles.set('7,9', { b: 'schiene', lvl: 1 }); recalc()");
    view(0.5, 6, 6);
    game('spriteNoBudget = true; render(1e6); spriteNoBudget = false');
    const keys = game('[...objSprites.keys()]');
    expect(keys.some(k => k.includes('|schiene|'))).toBe(false);
    for (const b of ['fz_karussell', 'wasserkraft']) expect(keys.some(k => k.includes(`|${b}|`))).toBe(true);
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

describe('Nachbesserung nach der Prüfung (Block 124)', () => {
  it('nach dem Bauen (recalc): Bildchen mit Platz und Linien fehlen nicht, sondern werden weiter gezeigt und einzeln erneuert – nichts bleibt liegen', () => {
    game("for (let i = 0; i < 6; i++) state.tiles.set((3 + i * 2) + ',6', { b: 'schule', lvl: 1 }); for (let x = 3; x <= 13; x++) buildEdge && state.edges.set('a' + x + ',9', { b: 'zaun', style: Object.keys(STYLES.zaun)[0] }); recalc()");
    view(0.5);
    game('spriteNoBudget = true; render(1e6); render(1e6); spriteNoBudget = false');
    const n0 = game('objSprites.size');
    expect(game("[...objSprites.keys()].some(k => k.startsWith('edges|'))")).toBe(true);
    game('recalc()');                                                              // wie nach jedem Bauen
    const r = withClock("globalThis.__ps = paintSprite; paintSprite = (...a) => { __t += 3; return __ps(...a); }", () => {
      try { const out = []; for (let i = 0; i < 12; i++) out.push(frame()); return out; } finally { game('paintSprite = globalThis.__ps'); }
    });
    expect(r.every(f => f.miss === 0)).toBe(true);                                // nie live, nie „Insel wird gezeichnet“
    expect(game('objSprites.size')).toBe(n0);                                     // ersetzt, nicht dazugelegt
    expect(game('[...objSprites.values()].filter(e => e.used === frameNo).every(e => e.ver === 0 || e.ver === "" || String(e.ver).startsWith(String(groundVersion)) || e.ver === groundVersion)')).toBe(true);
  });
  it('bei voller Nacht gemalt: in der Morgendämmerung weiter mit Nachtbild, nicht neu gemalt (Block 143)', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 2 }); recalc(); nightAt = () => NIGHT_MAX");
    view(0.5, 6, 6);
    game('spriteNoBudget = true; render(1e6); render(1e6); spriteNoBudget = false');
    const k = game("[...objSprites.keys()].find(k => k.startsWith('haus|'))");
    game(`globalThis.__e = objSprites.get(${JSON.stringify(k)})`);
    game('nightAt = () => 0.3');                                                  // Morgendämmerung
    game('render(1e6); render(1e6); render(1e6)');
    expect(game(`objSprites.get(${JSON.stringify(k)}) === globalThis.__e && !!globalThis.__e.night`)).toBe(true);
    game('nightAt = () => 0');
  });
  it('Vorwärmen (Block 143): kurz vor dem Einschalten entstehen die beleuchteten Bildchen samt Nachtbild schon', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 2 }); state.tiles.set('8,6', { b: 'schule', lvl: 1 }); recalc(); nightAt = () => 0.1");
    view(0.5, 6, 6);
    game('for (let i = 0; i < 6; i++) render(1e6 + i * 16)');
    const lit = game("[...objSprites.entries()].filter(([k]) => k.startsWith('haus|') && k.split('|').includes('1')).map(([, e]) => !!e.night)");
    expect(lit.length).toBeGreaterThan(0);
    expect(lit.every(Boolean)).toBe(true);
    game('nightAt = () => 0.2; render(2e6)');                                    // jetzt an: nichts fehlt
    expect(game('SPRITE_STATS.miss')).toBe(0);
    game('nightAt = () => 0');
  });
  it('kein Speicher (getContext null): Pause fürs Neumalen, kein Aufholen/Vorbereiten, kein Hinweis', () => {
    game("for (let y = 3; y <= 15; y++) for (let x = 3; x <= 15; x += 2) state.tiles.set(x + ',' + y, { b: 'schule', lvl: 1 }); recalc()");
    view(0.5);
    game('globalThis.__gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function () { return this === canvas ? globalThis.__gc.call(this) : null; }; prepShown = 0');
    try {
      const r = [0, 1, 2, 3].map(() => frame());
      expect(r.slice(1).every(f => f.made === 0)).toBe(true);                     // nach dem ersten Fehlschlag Pause
      expect(game('[spritePrep, spriteCatch, frameNo < spritePause]')).toEqual([false, false, true]);
      expect(game('prepShown')).toBe(0);
    } finally { game('HTMLCanvasElement.prototype.getContext = globalThis.__gc; spritePause = 0'); }
  });
  it('Zuschneiden höchstens CROP_MS je Bild, der Rest im nächsten', () => {
    const r = withClock('', () => game(`(() => { spriteCrops.length = 0; const es = []; for (let i = 0; i < 5; i++) { const e = paintSprite(10, 10, 10, () => {}); es.push(e); }
      const oc = cropSprite; cropSprite = e => { __t += 5; oc(e); };
      try { cropSprites(8); return [spriteCrops.length, es.filter(e => !e.crop).length]; } finally { cropSprite = oc; spriteCrops.length = 0; } })()`));
    expect(r).toEqual([3, 2]);                                                    // 0 → 5 → 10 ms: zwei geschnitten, drei warten
  });
  it('andere Pixeldichte (Browser-Zoom, anderer Bildschirm): Bildchen werden verworfen', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); recalc()");
    view(0.5, 6, 6);
    game('spriteNoBudget = true; render(1e6); spriteNoBudget = false');
    expect(game('objSprites.size')).toBeGreaterThan(0);
    game("globalThis.__dpr = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio'); Object.defineProperty(window, 'devicePixelRatio', { value: 1.5, configurable: true }); resize()");
    try { expect(game('objSprites.size')).toBe(0); }
    finally { game("if (globalThis.__dpr) Object.defineProperty(window, 'devicePixelRatio', globalThis.__dpr); else delete window.devicePixelRatio; resize()"); }
  });
  it('Bewegtes in allen Stufen, Aussehen und nachts: animLive deckt alles ab, was sich bewegt (zwischen Zoom 1 und 2 live)', () => {
    const missing = game(`(() => { const out = [];
      const moves = (b, t, nt) => { const small = !!ITEMS[b].small, was = night, sp = SPRITE_PAINT, gs = GLOW_SINK;
        const draw = now => { night = nt ? NIGHT_MAX : 0; SPRITE_PAINT = !!nt; GLOW_SINK = []; try { return __rec(() => { PASS = small ? null : 'object'; try { drawObject(b, 0, 0, 0.5, now, 7, 7, t.lvl || 1, small ? { rot: 0, slot: 0, col: 0, form: 0 } : t); } finally { PASS = null; } }); } finally { night = was; SPRITE_PAINT = sp; GLOW_SINK = gs; } };
        const a = draw(0); return [700, 1900, 60000].some(n => draw(n) !== a); };
      const live = (t, nt) => { const was = night; night = nt ? NIGHT_MAX : 0; try { return animLive(t); } finally { night = was; } };
      for (const b of Object.keys(ITEMS)) { if (b === 'weg' || b === 'lm' || SPRITE_LIVE.has(b) || ITEMS[b].small) continue;
        const stages = Math.max(b === 'haus' ? HOUSE_STAGES.length : 0, BUILD_STAGES[b] ? (BUILD_STAGES[b].names || []).length : 0, 3);
        for (let lvl = 1; lvl <= stages; lvl++) for (const look of b === 'haus' ? [undefined, 1, 2, 3, 4, 5, 6] : [undefined]) for (const nt of [0, 1]) {
          const t = { b, lvl, rot: 0, look };
          if (moves(b, t, nt) && !live(t, nt)) out.push(b + ' ' + lvl + ' ' + look + ' ' + nt);
        } }
      for (const lm of Object.keys(LANDMARKS)) for (const stage of [0, 1, 2, 3]) for (const nt of [0, 1]) {
        const was = state.restore[lm]; state.restore[lm] = stage; const t = { b: 'lm', lm, lvl: 1, rot: 0 };
        try { if (moves('lm', t, nt) && !live(t, nt)) out.push('lm ' + lm + ' ' + stage + ' ' + nt); } finally { state.restore[lm] = was; }
      }
      return out; })()`);
    expect(missing).toEqual([]);
  }, 180e3);
  it('volle Nacht: Nachtbild = Bildchen + Löschbild (kein zweites Bild), Scheiben für die Nähe von Blau gemerkt; Geister ohne Löschbild', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 2 }); recalc(); nightAt = () => NIGHT_MAX");
    view(0.5, 6, 6);
    try {
      game('spriteNoBudget = true; render(1e6); render(1e6); render(1e6); spriteNoBudget = false');
      const n = game("(() => { const e = [...objSprites.values()].find(e => e.night); return e && { c: 'c' in e.night, erase: !!e.night.erase.c, panes: e.night.panes.length }; })()");
      expect(n).toMatchObject({ c: false, erase: true });
      expect(n.panes).toBeGreaterThan(0);
      // halb durchsichtig (Vorschau-Geist): kein Löschbild – sonst stanzt es Löcher in alles dahinter
      const used = game(`(() => { const e = [...objSprites.values()].find(e => e.night); let erased = 0;
        const was = g.globalAlpha; g.globalAlpha = 0.5; g.drawImage = (c) => { if (c === e.night.erase.c) erased++; };
        try { putSprite(e, 100, 100, 0.5); } finally { g.globalAlpha = was; delete g.drawImage; } return erased; })()`);
      expect(used).toBe(0);
    } finally { game('nightAt = () => 0'); }
  });
});
