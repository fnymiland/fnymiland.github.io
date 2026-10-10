const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Anhöhen Stufe 3 – Gebäude oben zeichnen (Block 157j): Schlagschatten auf dem Plateau (nie über die Kante), flache Teile (Hof, Vorplatz)
// samt Schatten darauf, Zuschnitt an der Kante (Garten, Büsche, Vorplatz nie in der Luft), Felder davor vorgezogen (ihre Oberseite schnitt
// sonst ab, was über die Grundfläche ragt), weit weg als Bildchen (auch mit flachen Teilen), Antippen oben, U-Bahn-Eingang in der Tunnel-
// Ansicht, ohne Anhöhen alles wie vorher. Gebäude werden direkt gesetzt (unabhängig davon, ob die Bau-Regeln sie oben schon erlauben).
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; recalc()");
  game('cam = state.cam; cam.z = 3; { const p = iso(10, 10); cam.x = p.x; cam.y = p.y; } night = 0; errorShown = false');
});
const put = (b, x, y, rot = 0, extra = {}) => game(`state.tiles.set('${x},${y}', { b: '${b}', lvl: 1, rot: ${rot}, ...${JSON.stringify(extra)}, ...('${b}' === 'hbf' ? HBF_NEW : {}) }); recalc()`);
const hills = (x0, y0, x1, y1) => game(`for (let y = ${y0}; y <= ${y1}; y++) for (let x = ${x0}; x <= ${x1}; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()`);
// zählt Aufrufe globaler Funktionen während f (Namen → Anzahl)
const spy = (names, f) => game(`(() => {
  const n = {}, keep = {};
  for (const k of ${JSON.stringify(names)}) { keep[k] = globalThis[k]; n[k] = 0; globalThis[k] = (...a) => { n[k]++; return keep[k](...a); }; }
  try { (${f})(); } finally { for (const k in keep) globalThis[k] = keep[k]; }
  return n;
})()`);
const draw = (z, night = 0) => `() => { const na = nightAt, gh = gameHour; nightAt = () => ${night}; gameHour = () => ${night ? 23 : 12}; try { cam.z = ${z}; render(1e6); render(1e6 + 17); } finally { nightAt = na; gameHour = gh; } }`;

describe('ohne Anhöhen wie vorher', () => {
  it('nah, weit, nachts: keine der neuen Anhöhen-Funktionen läuft (früh aussteigen)', () => {
    put('haus', 9, 9, 0, { lvl: 3 }); put('schule', 11, 9); put('theater', 8, 12); put('muehle', 12, 12); put('reihenhaus', 13, 8);
    for (const [z, nt] of [[3, 0], [1.4, 0], [0.6, 0], [3, 0.45], [0.6, 0.45]]) {
      const n = spy(['hillShadeFresh', 'hillShadeOn', 'hillCutOf', 'hillCutClip', 'drawHillTile', 'hillShadeSig'], draw(z, nt));
      expect([z, nt, n]).toEqual([z, nt, { hillShadeFresh: 0, hillShadeOn: 0, hillCutOf: 0, hillCutClip: 0, drawHillTile: 0, hillShadeSig: 0 }]);
    }
    expect(game('errorShown')).toBe(false);
  });
  it('Bildchen weit weg: geteilt wie bisher (Häuser ohne Platz im Schlüssel), Tunnel-Ansicht: U am Tunnel', () => {
    put('haus', 9, 9, 0, { lvl: 3 }); put('haus', 10, 9, 0, { lvl: 3 });
    game(`(${draw(0.6)})()`);
    expect(game("[...objSprites.keys()].some(k => k.startsWith('g|') || k.startsWith('k'))")).toBe(false);
    game("state.tunnels.set('9,12', {}); state.tunnels.set('10,12', {}); state.tiles.set('10,12', { b: 'ubahn', lvl: 1, rot: 0 }); recalc(); setSeeThrough(true)");
    const ys = game(`(() => { const u = uSign, out = []; uSign = (p, s, z) => { out.push(p[1]); return u(p, s, z); }; try { cam.z = 2; render(1e6); } finally { uSign = u; setSeeThrough(false); } return [out, toScreen(10, 12).y - 4 * cam.z]; })()`);
    expect(ys[0]).toContain(ys[1]);
  });
});

describe('Schlagschatten oben', () => {
  it('fallen auf die Oberseite gleicher Höhe, nie auf tiefere Felder; im Bildchen der Anhöhe (Schlüssel), nicht im Boden-Bild', () => {
    hills(5, 5, 12, 12);
    put('uni', 11, 6);                                                   // hoch, hinten rechts an der Kante: Schatten nach +x/−y
    put('haus', 8, 8, 0, { lvl: 4 });
    const m = game("[...hillShadeFresh().m.keys()]");
    expect(m).toContain('9,8');                                          // rechts neben dem Haus (gleich hoch)
    expect(m.every(k => game(`hillLevel(${k}) === 1`))).toBe(true);    // nie unten neben der Wand
    expect(m.filter(k => /^13,/.test(k))).toEqual([]);                  // rechts der Kante liegt nichts
    expect(game("hillShadeSig(9, 8)")).toMatch(/^:s/);
    expect(game("hillSig(9, 8, hillAt(9, 8))")).toContain(game("hillShadeSig(9, 8)"));
    expect(game("hillShadeSig(6, 11)")).toBe('');                       // kein Schatten dort
    // Boden-Bild: Dinge oben bleiben draußen (wie bisher)
    const up = game(`(() => { const out = []; const s = shadowOf; shadowOf = (t, x, y) => { if (hillAt(x, y)) out.push(x + ',' + y); return s(t, x, y); }; try { drawShadows(() => true); } finally { shadowOf = s; } return out; })()`);
    expect(up).toEqual([]);
    // ⚙️ Schatten aus: keine
    game("setGfx('shadows', false)");
    try { expect(game("hillShadeFresh().m.size")).toBe(0); } finally { game("setGfx('shadows', true)"); }
  });
  it('unter Gebäuden mit flachen Teilen (Hof, Vorplatz) zwischen Boden und Gebäude – nah, weit, im Geist nicht doppelt', () => {
    hills(5, 5, 12, 12);
    put('schule', 7, 7); put('uni', 9, 7, 1); put('haus', 8, 10, 0, { lvl: 3 });
    expect(game("['7,7', '8,8', '9,7'].map(k => hillShadeFresh().own.has(k))")).toEqual([true, true, true]);
    expect(game("hillShadeSig(8, 8)")).not.toMatch(/^:s/);              // nicht im Bildchen der Anhöhe (sonst doppelt dunkel) – nur im Streifen vorn (:o, kritische Prüfung)
    for (const z of [3, 0.6]) {
      const n = spy(['hillShadeOn'], draw(z));
      expect([z, n.hillShadeOn > 0]).toEqual([z, true]);
    }
    expect(game("[...objSprites.keys()].some(k => k.startsWith('g|'))")).toBe(true);   // weit weg: Bildchen samt Hof (nicht mehr jedes Bild live)
    expect(game('errorShown')).toBe(false);
  });
});

describe('Kante: Zuschnitt und Felder davor', () => {
  it('hillCutOf: an der Vorderkante die tieferen Felder vorn, innen nichts; Vorschau „Treppe in die Anhöhe“ zählt mit', () => {
    hills(5, 5, 12, 12);
    expect(game('hillCutOf(8, 8, 1, 1)')).toBe(null);
    const c = game('hillCutOf(8, 12, 1, 1)');
    expect(c.front.map(p => p.join(','))).toEqual(['7,13', '8,13', '9,13']);
    expect(c.back).toEqual([]);
    const d = game('hillCutOf(5, 5, 2, 2)');                             // hinten links an der Ecke: nur dahinter tiefer
    expect([d.front.length, d.back.length]).toEqual([2, 5]);             // die beiden schrägen Nachbarn an der Seite zählen nach vorn
    expect(game('hillCutOf(11, 11, 2, 2).front.length')).toBe(7);        // vorn an der Ecke: 4 + 3
  });
  it('Gebäude an der Kante: nah und weit zugeschnitten (Bildchen je Platz), innen nicht; Geist an der Kante auch', () => {
    hills(5, 5, 12, 12);
    put('haus', 8, 12, 0, { lvl: 3 }); put('haus', 12, 8, 1, { lvl: 3 }); put('haus', 8, 8, 0, { lvl: 3 }); put('theater', 10, 10);
    for (const z of [3, 1.4, 0.6]) {
      const n = spy(['hillCutClip'], draw(z));
      expect([z, n.hillCutClip >= 3]).toEqual([z, true]);
    }
    expect(game("[...objSprites.keys()].filter(k => /^(g\\|)?k/.test(k)).length")).toBeGreaterThan(0);
    // Geist eines Hauses oben an der Kante
    game("tool = 'haus'; hover = { x: 12, y: 6 }");
    try { const n = spy(['hillCutClip'], draw(3)); expect(n.hillCutClip).toBeGreaterThan(0); } finally { game("tool = 'look'; hover = null"); }
    expect(game('errorShown')).toBe(false);
  });
  it('Felder gleicher Höhe vor einem Ding oben kommen vorher (nur einmal je Bild), sonst schnitte ihre Oberseite den Garten ab', () => {
    hills(5, 5, 12, 12);
    put('haus', 8, 8, 0, { lvl: 3 });
    const seq = game(`(() => {
      const out = [], dh = drawHillTile, dob = drawObject;
      drawHillTile = (x, y, ...a) => { out.push('h' + x + ',' + y); return dh(x, y, ...a); };
      drawObject = (b, ...a) => { if (b === 'haus') out.push('haus'); return dob(b, ...a); };
      try { cam.z = 3; const p = iso(8, 8); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawHillTile = dh; drawObject = dob; }
      return out;
    })()`);
    const at = s => seq.indexOf(s), cnt = s => seq.filter(v => v === s).length;
    expect(at('haus')).toBeGreaterThan(-1);
    for (const k of ['h9,8', 'h8,9', 'h9,9']) { expect([k, at(k) < at('haus'), cnt(k)]).toEqual([k, true, 1]); }
    expect(at('h8,8')).toBeLessThan(at('haus'));
    // ein tieferes Feld dahinter (Kante): nicht vorziehen – seine Oberseite muss das Tiefere dahinter decken
    game("state.hills.delete('9,7'); groundVersion++; recalc()");
    const seq2 = game(`(() => {
      const out = [], dh = drawHillTile, dob = drawObject;
      drawHillTile = (x, y, ...a) => { out.push('h' + x + ',' + y); return dh(x, y, ...a); };
      drawObject = (b, ...a) => { if (b === 'haus') out.push('haus'); return dob(b, ...a); };
      try { render(2e6); } finally { drawHillTile = dh; drawObject = dob; }
      return out;
    })()`);
    expect(seq2.indexOf('h9,8')).toBeGreaterThan(seq2.indexOf('haus'));
    expect(seq2.indexOf('h8,9')).toBeLessThan(seq2.indexOf('haus'));
  });
  it('große Grundfläche (Streifen): vorgezogene Felder daneben kommen nach den Feldern darunter noch einmal (genau auf ihre Raute, sonst ein Strich)', () => {
    hills(5, 5, 12, 12);
    put('theater', 7, 7);                                                // 7–9 × 7–9; daneben rechts 10,7 … 10,9 und vorn 7,10 … 9,10
    const seq = game(`(() => {
      const out = [], dh = drawHillTile, dob = drawObject;
      drawHillTile = (x, y, ...a) => { out.push('h' + x + ',' + y); return dh(x, y, ...a); };
      drawObject = (b, ...a) => { if (b === 'theater') out.push('T'); return dob(b, ...a); };
      try { cam.z = 3; const p = iso(8, 8); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawHillTile = dh; drawObject = dob; }
      return out;
    })()`);
    const firstT = seq.indexOf('T');
    for (const k of ['h10,8', 'h8,10']) {
      const at = seq.map((v, i) => v === k ? i : -1).filter(i => i >= 0);
      expect([k, at.length >= 2, at[0] < firstT]).toEqual([k, true, true]);   // vorgezogen und in seinem Streifen nach den Feldern darunter noch einmal
    }
  });
});

describe('alle Arten oben zeichnen', () => {
  const ALL = [['haus', 1, 1, 0, { lvl: 5 }], ['kiosk', 3, 1, 1], ['cafe', 4, 1, 2], ['schule', 6, 1, 3], ['bibliothek', 9, 1, 0], ['saege', 1, 4, 1], ['muehle', 3, 4, 2],
    ['theater', 5, 4, 3], ['uni', 9, 4, 1], ['windrad', 12, 1, 0], ['solarfeld', 12, 3, 0], ['zoo', 1, 8, 0], ['reihenhaus', 6, 8, 2], ['baecker', 8, 8, 1], ['hotel', 10, 8, 0],
    ['fz_karussell', 6, 12, 0], ['fz_teetassen', 9, 12, 0], ['station', 12, 6, 0], ['ubahn', 13, 9, 0], ['kino', 14, 11, 1], ['museum', 1, 13, 0], ['riesenrad', 16, 1, 0],
    ['botgarten', 16, 7, 0], ['schloss', 16, 13, 0], ['hbf', 23, 1, 0], ['sternwarte', 23, 6, 0], ['fz_schloss', 23, 10, 0], ['rathaus', 23, 16, 0], ['grandhotel', 4, 16, 0]];
  it('1×1 bis 7×7, alle Drehungen der Auswahl: nah, mittel, weit, nachts, 👁 – ohne Fehler, jedes Gebäude angehoben und antippbar', () => {
    for (const [b, x, y, rot, ex] of ALL) put(b, x + 2, y + 2, rot, ex || {});
    hills(2, 2, 29, 21);
    for (const [k, t] of game('[...state.tiles]')) if (t.b !== 'lm') expect([t.b, game(`hillLevel(${k})`)]).toEqual([t.b, 1]);
    for (const [z, nt] of [[3, 0], [1.4, 0], [0.8, 0], [0.45, 0], [3, 0.45], [0.6, 0.45]]) for (const [cx, cy] of [[8, 8], [20, 8], [26, 12], [10, 18]]) {
      game(`{ const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; }`);
      expect(() => game(`(${draw(z, nt)})()`)).not.toThrow();
    }
    game('setSeeThrough(true)'); game(`(${draw(2)})()`); game('setSeeThrough(false)');
    expect(game('errorShown')).toBe(false);
    // Antippen: der Körper eines hohen Gebäudes oben (über der Mitte) trifft es – je Gebäude allein auf der Anhöhe (jsdom kann keine Bildpunkte
    // lesen: inkAt deckt den Rahmen ganz); unangehoben gerechnet (unten) läge der Finger unter dem Gebäude auf der Wand
    game('cam.z = 2; globalThis.__ink = inkAt; inkAt = () => 1');
    for (const [b, rot] of [['theater', 0], ['uni', 1], ['schloss', 0], ['riesenrad', 0], ['haus', 2], ['hbf', 0]]) {
      game("for (const k of [...state.tiles.keys()]) if (state.tiles.get(k).b !== 'lm') state.tiles.delete(k); recalc()");
      put(b, 10, 8, rot, b === 'haus' ? { lvl: 4 } : {});
      const [w, h] = game(`sizeOf('${b}', ${rot}, state.tiles.get('10,8'))`);
      game(`{ const p = iso(${10 + (w - 1) / 2}, ${8 + (h - 1) / 2}); cam.x = p.x; cam.y = p.y; render(3e6); }`);
      const hit = game(`(() => { const c = toScreen(${10 + (w - 1) / 2}, ${8 + (h - 1) / 2}); c.y -= hillLift(10, 8) * cam.z; const o = objectAt(c.x, c.y - 12 * cam.z); return o && [o.x, o.y]; })()`);
      expect([b, hit]).toEqual([b, [10, 8]]);
    }
    game('inkAt = globalThis.__ink');
  });
});

describe('U-Bahn-Eingang oben', () => {
  it('Tunnel-Ansicht: U über dem Eingang oben, die Treppe als Strich vom Tunnel hinauf', () => {
    hills(5, 5, 12, 12);
    game("for (let x = 3; x <= 14; x++) state.tunnels.set(x + ',9', {}); state.tiles.set('8,9', { b: 'ubahn', lvl: 1, rot: 0 }); recalc(); setSeeThrough(true)");
    const r = game(`(() => { const u = uSign, out = []; uSign = (p, s, z) => { out.push(p[1]); return u(p, s, z); }; try { cam.z = 2; const p = iso(8, 9); cam.x = p.x; cam.y = p.y; render(1e6); } finally { uSign = u; setSeeThrough(false); } return [out, toScreen(8, 9).y - 4 * cam.z - HILL_H * cam.z]; })()`);
    expect(r[0].map(v => Math.round(v))).toContain(Math.round(r[1]));
    expect(game('errorShown')).toBe(false);
  });
});

describe('Leistung mit Anhöhen', () => {
  // Testwelt „gross“, ein großes Stück angehoben (samt Gebäuden): im ruhenden Bild wird nichts neu gemalt (Bildchen, Anhöhen, Boden), weit weg
  // stehen die Gebäude oben als Bildchen (live nicht mehr als ohne Anhöhe), und der Zuschnitt an der Kante kostet kaum etwas
  it('ruhendes Bild ohne Neumalen, weit weg nicht mehr live als ohne Anhöhen, Zuschnitt fast umsonst', () => {
    global.WG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'testsave-gross.json'), 'utf8'));
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 });
    game('adoptState(parseSave(WG)); closeModal(); closePanel(); state.tipsOff = true; resize()');
    const measure = (z, night, noCut = false) => game(`(() => {
      const pn = performance.now, na = nightAt, gh = gameHour, dO = drawObject, ph = paintHill, hc = hillCutOf, rgc = renderGroundChunk;
      performance.now = () => 0; nightAt = () => ${night} ? NIGHT_MAX : 0; gameHour = () => ${night} ? 23 : 12;
      if (${noCut}) hillCutOf = () => null;
      try {
        const ks = [...state.tiles.keys()].map(keyXY), cx = ks.reduce((a, k) => a + k[0], 0) / ks.length, cy = ks.reduce((a, k) => a + k[1], 0) / ks.length;
        cam = state.cam; cam.z = ${z}; const p = iso(Math.round(cx), Math.round(cy)); cam.x = p.x; cam.y = p.y; lastZoom = ${z}; lastZoomChange = -1e9;
        let warm = 0, quiet = 0, ground = 0;                             // vorlaufen, bis nichts mehr nachgemalt wird (wie der Leistungs-Wächter)
        renderGroundChunk = (...a) => { ground++; return rgc(...a); };
        for (; warm < 150 && quiet < 3; warm++) { ground = 0; render(1e6 + warm * 17); quiet = ground + SPRITE_STATS.made ? 0 : quiet + 1; }
        ground = 0;
        let live = 0, paint = 0; drawObject = (...a) => { live++; return dO(...a); }; paintHill = (...a) => { paint++; return ph(...a); };
        SPRITE_STATS.made = 0; globalThis.__ctxCount = {};
        render(1e6 + warm * 17);
        const c = globalThis.__ctxCount; let ops = 0; for (const k in c) ops += c[k];
        return { live, paint, made: SPRITE_STATS.made + ground, ops };
      } finally { globalThis.__ctxCount = null; performance.now = pn; nightAt = na; gameHour = gh; drawObject = dO; paintHill = ph; hillCutOf = hc; renderGroundChunk = rgc; }
    })()`);
    const flat = {};
    for (const z of [0.45, 0.8]) flat[z] = measure(z, 0);
    // angehoben: 16 × 16 Felder um die Mitte, samt allem, was dort steht
    game(`(() => { const ks = [...state.tiles.keys()].map(keyXY), cx = Math.round(ks.reduce((a, k) => a + k[0], 0) / ks.length), cy = Math.round(ks.reduce((a, k) => a + k[1], 0) / ks.length);
      for (let y = cy - 8; y < cy + 8; y++) for (let x = cx - 8; x < cx + 8; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc(); })()`);
    expect(game("[...state.tiles].filter(([k, t]) => state.hills.has(k) && t.b !== 'weg' && t.b !== 'schiene').length")).toBeGreaterThan(30);
    for (const z of [0.45, 0.8, 1.6]) for (const night of [0, 1]) {
      const m = measure(z, night);
      expect([z, night, m.paint, m.made]).toEqual([z, night, 0, 0]);     // nichts neu gemalt
      if (!night && flat[z]) expect([z, m.live <= flat[z].live]).toEqual([z, true]);
      if (!night) { const o = measure(z, 0, true); expect([z, m.ops <= o.ops * 1.02 + 100]).toEqual([z, true]); }
    }
  }, 60000);
});
