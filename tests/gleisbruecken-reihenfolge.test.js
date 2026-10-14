const { loadGame, game } = require('./helpers/load-game');

// 160c E1d (plan-160c/karte-E1.md): Gleisbrücken übers Wasser ruhend in tileA wie die Wasser-Wegbrücken (D1b) – je Feld in seiner Feldrunde
// (nach drawEdgesAt des Felds, vor dem nächsten), nicht mehr im Boden-Durchgang; eine Gruppe w = der alte Maler ganz; weit weg ein Bildchen
// gb|x,y|w statt flat|; Boote nur unter früher gezeichneten Feldern; Vorschau auf dem Deck (Höhe 0); GL: kein lebendiges Feld
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 60; y++) for (let x = 0; x <= 60; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0; recalc()");
});
const bau = (wasser, linien, extra = {}) => game(`(() => { const [x0, y0, x1, y1] = ${JSON.stringify(wasser)};
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water');
  for (const [a, b, c, d] of ${JSON.stringify(linien)}) { const dx = Math.sign(c - a), dy = Math.sign(d - b); for (let x = a, y = b; ; x += dx, y += dy) { const wet = terrainAt(x, y) === 'water';
    state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(wet ? { bridge: true, ...${JSON.stringify(extra)} } : {}) }); if (x === c && y === d) break; } }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// Fälle: [Name, Kamera, Brückenfelder]
const FAELLE = [];
const szene = () => {
  FAELLE.length = 0;
  bau([2, 0, 7, 9], [[0, 5, 9, 5]]); FAELLE.push(['gerade', [4.5, 5], [[2, 5], [4, 5], [7, 5]]]);
  bau([12, 2, 21, 7], [[17, 0, 17, 9]]); FAELLE.push(['Nord-Süd', [17, 4.5], [[17, 2], [17, 5], [17, 7]]]);
  bau([26, 2, 32, 9], [[24, 5, 29, 5], [29, 4, 29, 0]]); FAELLE.push(['Kurve', [29, 5], [[28, 5], [29, 5], [29, 4]]]);
  bau([42, 2, 47, 8], [[40, 5, 49, 5], [45, 6, 45, 10]]); FAELLE.push(['T', [45, 5.5], [[45, 5], [45, 6], [44, 5]]]);
  bau([2, 22, 7, 27], [[0, 25, 9, 25], [5, 20, 5, 24], [5, 26, 5, 29]]); FAELLE.push(['X', [5, 25], [[5, 25], [5, 24], [6, 25]]]);
  bau([12, 21, 17, 29], [[10, 24, 19, 24], [10, 25, 19, 25]]); FAELLE.push(['Leiter', [14.5, 24.5], [[14, 24], [14, 25], [15, 25]]]);
  bau([22, 20, 31, 29], [[20, 25, 26, 25]]); FAELLE.push(['Ende', [25, 25], [[24, 25], [26, 25]]]);
};
// ein Bild nah (live) mit Spionen: 'A x,y' (Feldrunde: drawEdgesAt), 'gr[g|w] x,y [fog]' (bkDrawLagen), 'rb x,y' (drawRailBed ganz, Brücke)
const order = (cx, cy, extra = '', z = 2.4) => game(`(() => {
  ${extra}
  const log = [], bl = bkDrawLagen, de = drawEdgesAt, rb = drawRailBed;
  drawEdgesAt = (x, y, ...r) => { log.push('A ' + x + ',' + y); return de(x, y, ...r); };
  bkDrawLagen = (x, y, px, py, z, gr, c) => { const cc = c === undefined ? bkAt(x, y) : c; log.push(gr + (cc && cc.rail ? 'g' : cc && cc.water ? 'w' : '') + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, c); };
  drawRailBed = (cx, cy, z, x, y, t, armsIn, lagen) => { if (t && t.bridge && !lagen) log.push('rb ' + x + ',' + y); return rb(cx, cy, z, x, y, t, armsIn, lagen); };
  try { cam = state.cam; cam.z = ${z}; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
  finally { bkDrawLagen = bl; drawEdgesAt = de; drawRailBed = rb; spriteForce = null; }
  return log;
})()`);
const dpr = d => { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => d }); game('resize()'); };

describe('Gleisbrücken übers Wasser ruhend in der Feldrunde (160c E1d)', () => {
  it('je Feld genau einmal w und der Maler ganz – nach dem eigenen Feld, vor dem nächsten; im Boden-Durchgang nichts (nah live, Boden gecacht, mittel)', () => {
    szene();
    for (const [d, z] of [[2, 2.4], [1, 2.4], [1, 2.2], [1, 1.2]]) {
      dpr(d);
      for (const [name, [cx, cy], felder] of FAELLE) {
        const log = order(cx, cy, '', z), first = log.findIndex(e => e.startsWith('A '));
        expect(log.slice(0, first).some(e => e.startsWith('rb ')), name + ' z ' + z + ': Boden-Durchgang').toBe(false);
        for (const [x, y] of felder) {
          const k = x + ',' + y, a = log.indexOf('A ' + k), next = log.findIndex((e, j) => j > a && e.startsWith('A '));
          expect(a, name + ' ' + k).toBeGreaterThan(-1);
          const own = log.map((e, j) => [e, j]).filter(([e]) => e === 'wg ' + k || e === 'rb ' + k);
          expect(own.map(([e]) => e), name + ' ' + k + ' z ' + z).toEqual(['wg ' + k, 'rb ' + k]);
          expect(own.every(([, j]) => j > a && (next < 0 || j < next)), name + ' ' + k + ': in der eigenen Feldrunde').toBe(true);
        }
      }
    }
    dpr(1);
  });
  it('fremdes Feld: im Nebel; das eigene daneben nicht', () => {
    szene();
    const log = order(4.5, 5, "state.claimed.delete('4,5'); state.owned.delete(chunkOf(4, 5)); groundVersion++;");
    expect(log.filter(e => /^wg 4,5/.test(e))).toEqual(['wg 4,5 fog']);
    expect(log.filter(e => /^wg 5,5/.test(e))).toEqual(['wg 5,5']);
  });
  it('Rückfall: Brückenfeld ohne Belegung (state.tiles.set ohne recalc) wird trotzdem gezeichnet; Altdaten mit Übergang ohne Fehler', () => {
    szene();
    let log = order(4.5, 5, "state.terra.set('5,4', 'water'); state.tiles.set('5,4', { b: 'schiene', lvl: 1, form: 0, bridge: true }); groundVersion++;");
    expect(game("COVER.has('5,4')")).toBe(false);
    expect(log.filter(e => / 5,4$/.test(e) && /^(wg|rb)/.test(e))).toEqual(['wg 5,4', 'rb 5,4']);
    log = order(4.5, 5, "state.tiles.get('4,5').cross = true; state.tiles.get('4,5').style = 'sand'; groundVersion++;");
    expect(log.filter(e => e === 'wg 4,5').length).toBe(1);
  });
  it('alte Daten: Anhöhen-Deck über einer Gleisbrücke – die Gleisbrücke zwischen h und vd des Decks, nichts doppelt', () => {
    szene();
    const log = order(4.5, 5, "state.bruecken.set('4,5', { ax: 0, n: 1, art: 'holz' }); groundVersion++;");
    expect(log.filter(e => / 4,5$/.test(e) && /^(h|vd|o|wg|rb) /.test(e))).toEqual(['h 4,5', 'wg 4,5', 'rb 4,5', 'vd 4,5', 'o 4,5']);
  });
});

describe('Gleisbrücken übers Wasser weit weg als Bildchen (160c E1d)', () => {
  const far = (cx, cy) => game(`(() => { cam = state.cam; cam.z = 0.5; lastZoom = 0.5; lastZoomChange = -1e9; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = null; })()`);
  it('je Feld ein Bildchen gb|x,y|w der aktuellen Fassung, ohne Licht, kein flat|; gemalt je einmal; das nächste Bild malt nichts live und nichts neu', () => {
    szene();
    far(10, 10);
    const made = game(`(() => { const rb = drawRailBed; let n = 0; drawRailBed = (...a) => { if (SPRITE_PAINT && a[5] && a[5].bridge) n++; return rb(...a); };
      try { spriteNoBudget = true; render(1e6); spriteNoBudget = false; } finally { drawRailBed = rb; } return n; })()`);
    const keys = game("[...objSprites.entries()].filter(([k]) => /^(gb|flat)\\|/.test(k)).map(([k, e]) => [k, e.ver === groundVersion, e.glows.length])");
    for (const [x, y] of [[2, 5], [4, 5], [7, 5], [17, 2], [17, 7], [5, 25], [14, 24]]) expect(keys.some(([k]) => k === `gb|${x},${y}|w|0`), x + ',' + y).toBe(true);
    const br = new Set(game("[...state.tiles].filter(([k, t]) => isGleisBridge(t)).map(([k]) => k)"));
    expect(keys.filter(([k]) => k.startsWith('flat|') && br.has(k.split('|')[1]))).toEqual([]);
    expect(keys.filter(([k]) => /^gb\|.*\|(h|vd|o)\|/.test(k))).toEqual([]);              // ruhend nur w
    expect(keys.filter(([k]) => k.startsWith('gb|')).every(([, v, gl]) => v && gl === 0)).toBe(true);
    expect(made).toBe(keys.filter(([k]) => k.startsWith('gb|')).length);
    const r = game(`(() => { const rb = drawRailBed; let live = 0; drawRailBed = (...a) => { if (!SPRITE_PAINT && a[5] && a[5].bridge) live++; return rb(...a); };
      const gb = () => [...objSprites.entries()].filter(([k]) => k.startsWith('gb|')), m0 = gb();
      try { render(1e6 + 16); } finally { drawRailBed = rb; } const m1 = gb(); return [live, m1.length === m0.length && m1.every(([k, e], i) => m0[i][0] === k && m0[i][1] === e) ? 0 : 1]; })()`);
    expect(r).toEqual([0, 0]);
  });
  it('GL: nur Gleisbrücken – keine lebendigen flachen Felder, der Boden-Durchgang öffnet keine Zelle', () => {
    szene();
    expect(game('liveFlatSet().size')).toBe(0);
  });
});

describe('Gleisbrücken übers Wasser: Boote und Vorschau (160c E1d)', () => {
  it('boatUnder: nur früher gezeichnete Gleisfelder (spätere malt ihr tileA darüber); Schiene ohne Kennung wie bisher', () => {
    szene();
    expect(game('boatUnder({ boat: true, px: 13.7, py: 24.5 })')).toEqual(['14,24', '13,25']);   // Leiter: beide früher als das eigene 14,25
    expect(game('boatUnder({ boat: true, px: 4, py: 4.6 })')).toBe(null);                // 4,5 ist das eigene Feld
    expect(game('boatUnder({ boat: true, px: 4.6, py: 4.4 })')).toEqual(['4,5']);        // eigenes 5,4: 4,5 auf derselben Diagonale früher, 5,5 später (nie)
    game("state.terra.set('40,40', 'water'); state.terra.set('40,41', 'water'); state.tiles.set('40,41', { b: 'schiene', lvl: 1 }); state.tiles.set('39,41', { b: 'schiene', lvl: 1 }); state.tiles.set('41,41', { b: 'schiene', lvl: 1 }); terrainCache.clear(); waterChanged(); recalc()");
    expect(game('boatUnder({ boat: true, px: 40, py: 40.4 })')).toEqual(['40,41']);        // ohne Kennung (nur Tests): auch das spätere
  });
  it('Einzelfeld-Rahmen (Abriss) auf einer Gleisbrücke: nach ihrem w, eingerückt 0,44, Höhe 0; daneben an Land wie vorher', () => {
    szene();
    const rahmen = (hx, hy) => game(`(() => { const out = [], bl = bkDrawLagen; let first = null;
      bkDrawLagen = (x, y, px, py, z, gr, c) => { out.push(gr + ' ' + x + ',' + y); return bl(x, y, px, py, z, gr, c); };
      g.beginPath = () => { first = null; }; g.moveTo = (a, b) => { if (first == null) first = b; };
      g.stroke = () => { if (g.lineWidth === 3 * cam.z && (g.strokeStyle === '#3fbf6f' || g.strokeStyle === '#e5484d')) out.push('rahmen ' + first.toFixed(3)); };
      let want;
      try {
        setTool('abriss'); hover = { x: ${hx}, y: ${hy} };
        cam = state.cam; cam.z = 2; const p = iso(${hx}, ${hy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6);
        const c = gbAt(${hx}, ${hy}), e = c ? 0.44 : 0.5; want = toScreen(${hx} - e, ${hy} - e).y.toFixed(3);
      } finally { bkDrawLagen = bl; delete g.beginPath; delete g.moveTo; delete g.stroke; hover = null; setTool('look'); spriteForce = null; }
      return [out, want]; })()`);
    {
      const [log, want] = rahmen(4, 5), i = log.findIndex(e => e.startsWith('rahmen'));
      expect(log.filter(e => e.startsWith('rahmen'))).toEqual(['rahmen ' + want]);
      expect(i).toBeGreaterThan(log.indexOf('w 4,5'));
    }
    {
      const [log] = rahmen(1, 5), i = log.findIndex(e => e.startsWith('rahmen'));
      expect(i).toBeLessThan(log.indexOf('w 2,5'));                                     // Land: wie vorher sofort
    }
  });
});
