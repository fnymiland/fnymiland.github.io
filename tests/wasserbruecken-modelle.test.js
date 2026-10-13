const { loadGame, game } = require('./helpers/load-game');

// 160c D2 (plan-160c/karte-D2.md): neue Modelle der Wasser-Wegbrücken nach dem abgenommenen Entwurf D0 (tools/wasserbruecken-entwurf.js).
// D2a: Brückenfeld wbAt bekommt seine Geometrie G (wbGeom: Spanne, gedachte Felder an offenen Enden, Höhe, Stützen, Reihen) – noch nichts Sichtbares
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 2; y <= 60; y++) for (let x = 2; x <= 60; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear()");
});
// Kanal längs x bzw. y: Wasser u0 … u0+N−1; steg 1: offen am +Ende, −1: am −Ende (5 Felder Wasser dahinter); ohneWeg: Ufer ohne Wegkachel
const kanal = (u0, v0, N, { ax = 0, breit = 1, steg = 0, style = 'sand', brk = null, ohneWeg = false, look = null } = {}) => game(`(() => {   // look: neues Format (br-Felder + brStamp, wie D3 baut)
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v, wA = ${steg < 0 ? 5 : 0}, wB = ${steg > 0 ? 5 : 0};
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3 - wA; u <= ${u0} + ${N} + 2 + wB; u++) state.terra.set(K(u, v), u >= ${u0} - wA && u < ${u0} + ${N} + wB ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    if (!${ohneWeg} && ${steg} >= 0) for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    if (!${ohneWeg} && ${steg} <= 0) for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) { const t = { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: ${ax}${brk ? `, brk: '${brk}'` : ''} }; const L = ${JSON.stringify(look)};
      if (L) { t.brm = L.mat; if (L.licht) t.brl = L.licht; if (L.zacken) t.brz = 'an'; brStamp(t, 'wasser', { ...brLegacyLook(t, 'wasser'), ...L }); }
      state.tiles.set(K(u, ${v0} + r), t); }
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const G = (x, y, keys) => game(`(c => ${JSON.stringify(keys)}.map(k => c.G[k]))(wbAt(${x}, ${y}))`);

describe('Wasser-Wegbrücken: Geometrie G (160c D2a)', () => {
  it('Holz-Bogen 6: Stützen auf den Kanten (wenige 1, 3, 5), Feld = Index, Rahmen t0/t1 um das Feld', () => {
    kanal(10, 4, 6);
    expect(G(10, 4, ['mat', 'art', 'n', 'i', 't0', 't1', 'supports', 'oA', 'oB'])).toEqual(['holz', 'holz', 6, 0, -0.5, 0.5, [1, 3, 5], false, false]);
    expect(G(13, 4, ['i', 'startPost'])).toEqual([3, true]);                                   // Kante 3 = Anfang von Feld 3
    expect(G(12, 4, ['i', 'startPost'])).toEqual([2, false]);
  });
  it('Steg: offenes Ende nach Gelände (Wasser) – gedachtes Feld, Abschluss; +Ende: lastB/endPost nur im letzten Feld, −Ende: first im ersten', () => {
    kanal(10, 4, 3, { steg: 1 });
    expect(G(10, 4, ['S', 'oA', 'oB', 'vA', 'n', 'lastB', 'endPost', 'first'])).toEqual([{ i0: 0, N: 3, landA: true, landB: false }, false, true, 0, 4, false, false, false]);
    expect(G(12, 4, ['lastB', 'endPost', 'supports'])).toEqual([true, true, [1, 2, 3]]);       // wenige bei 3 = 1, 2; dazu die Stütze am offenen Ende (Kante 3)
    kanal(30, 4, 3, { steg: -1 });
    expect(G(30, 4, ['oA', 'oB', 'vA', 'n', 'i', 'first'])).toEqual([true, false, 1, 4, 1, true]);
    expect(G(31, 4, ['first', 'i'])).toEqual([false, 2]);
  });
  it('1 Feld und Landende ohne Weg: nie offen (Gras), keine Rampe ohne Wegkachel – wie die Figuren (wegDeckH)', () => {
    kanal(10, 4, 1);
    expect(G(10, 4, ['n', 'oA', 'oB', 'supports', 'lift'])).toEqual([1, false, false, [], 3]);
    kanal(30, 4, 1, { ohneWeg: true });
    expect(G(30, 4, ['n', 'oA', 'oB', 'S'])).toEqual([1, false, false, { i0: 0, N: 1, landA: false, landB: false }]);
    expect(game('(c => [c.G.hf(c.G.i - 0.45), c.G.hf(c.G.i)])(wbAt(30, 4))')).toEqual([3, 3]);   // keine Rampe
  });
  it('Höhe G.hf: flach = flatDeckH mit dem LIFT des Materials (Holz 3, Stein 7), Bogen = archDeck', () => {
    kanal(10, 4, 1); kanal(10, 12, 1, { style: 'platten' }); kanal(10, 20, 3, { steg: 1 }); kanal(30, 4, 6);
    for (const [x, y] of [[10, 4], [10, 12], [10, 20], [11, 20], [12, 20], [30, 4], [32, 4]]) for (const a of [-0.5, -0.3, 0, 0.3, 0.5]) {
      const [h, want] = game(`(c => [c.G.hf(c.G.i + ${a}), c.A ? archDeck(c.A, c.A.i0 + ${a} + 0.5) : flatDeckH(c.G.lift, c.landA, c.landB, ${a})])(wbAt(${x}, ${y}))`);
      expect(h, x + ',' + y + ' a ' + a).toBeCloseTo(want, 9);
    }
    expect(G(10, 12, ['mat', 'lift'])).toEqual(['stein', 7]);
  });
  it('breit 3: Reihen latB/latF/depth; Nord-Süd: Achse; Rot ist Holz (brLegacyLook), Ziegel ist Stein', () => {
    kanal(10, 4, 6, { breit: 3 });
    expect([4, 5, 6].map(y => G(12, y, ['latB', 'latF', 'depth']))).toEqual([[false, true, 0], [true, true, 1], [true, false, 2]]);
    kanal(40, 30, 3, { ax: 1 });
    expect(game('(c => [c.ax, c.G.n, c.G.i])(wbAt(30, 41))')).toEqual([1, 3, 1]);
    kanal(10, 20, 1, { brk: 'rot' }); kanal(10, 28, 3, { style: 'kopf' });
    expect(G(10, 20, ['mat'])).toEqual(['holz']); expect(G(11, 28, ['mat'])).toEqual(['stein']);
  });
  it('Deckhöhe: LIFT je Material (Rot = Holz 3); Lampen-Stellen bis 8 unverändert', () => {
    kanal(10, 4, 1, { brk: 'rot' });
    expect(game('(c => [c.lift, c.G.lift])(wbAt(10, 4))')).toEqual([3, 3]);
    for (const [a, f] of [['holz', 'fuss'], ['stein', 'fuss'], ['stahl', 'fuss'], ['kristall', 'fuss'], ['stahl', 'bahn']]) for (let n = 1; n <= 8; n++)
      expect(game(`JSON.stringify(brLampSpots('${a}', '${f}', ${n}, ${n}))`), a + f + n).toBe(game(`JSON.stringify(brLampSpots('${a}', '${f}', ${n}))`));
    expect(game("brLampSpots('holz', 'fuss', 16, 16).ts.length")).toBe(17);                  // ab 9 Feldern nur auf den Feldkanten (D0 F-h)
    expect(game("brLampSpots('stein', 'fuss', 16, 16).ts.length")).toBe(15);                 // innere Kanten
    expect(game("brLampSpots('holz', 'fuss', 16).ts.length")).toBe(17);                      // ohne max: wie bisher auf 8 begrenzt (2·8 + 1)
  });
});

// D2e: Mauer (und damit Boot-Durchfahrt, Seewege) aus dem Aussehen der Spanne – Maler und Boote aus einer Quelle (PLAN-160c D2)
describe('Wasser-Wegbrücken: Mauer aus dem Aussehen (160c D2e)', () => {
  const neu = (keys, mat) => game(`(() => { for (const k of ${JSON.stringify(keys)}) { const t = state.tiles.get(k); t.brm = '${mat}'; brStamp(t, 'wasser', { ...brLegacyLook(t, 'wasser'), mat: '${mat}' }); } })()`);
  const zellen = (x0, y, N) => Array.from({ length: N }, (_, i) => (x0 + i) + ',' + y);
  it('neues Format: Metall auf Stein-Belag ohne Mauer, Stein auf Sand mit Mauer; Altfelder wie bisher', () => {
    kanal(10, 4, 6, { style: 'platten' }); kanal(10, 12, 6); kanal(10, 20, 6, { style: 'kopf' }); kanal(10, 28, 6);
    expect(game('[bridgeArch(12, 4).wall, bridgeArch(12, 12).wall, bridgeArch(12, 20).wall]')).toEqual([true, false, true]);
    neu(zellen(10, 4, 6), 'stahl'); neu(zellen(10, 28, 6), 'stein'); game('groundVersion++; recalc()');
    expect(game('[bridgeArch(12, 4).wall, bridgeArch(12, 28).wall]')).toEqual([false, true]);
  });
  it('Seewege: Material ohne groundVersion++ umgestellt, recalc liest das neue Aussehen (brSpanCache) und verwirft die alten Wege', () => {
    kanal(10, 4, 6);
    const p0 = game("(() => { brSpanLook(12, 4); bridgeArch(12, 4); seaCache.set('test', 1); return bridgeArch(12, 4).pass.join(''); })()");
    neu(zellen(10, 4, 6), 'stein'); game('recalc()');
    expect(game("[bridgeArch(12, 4).wall, seaCache.has('test')]")).toEqual([true, false]);
    expect(game("bridgeArch(12, 4).pass.join('')")).not.toBe(p0);
  });
});

// D2c: Holz (samt Rot) im neuen Maler (wbPaintLage) – Lagen nacheinander = das Ganze, alles im Rahmen brBox, Rot in seiner Farbe, Boot-Schnitt
const rec = js => game(`(() => { const g0 = g, out = [];
  g = new Proxy({ getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), createPattern: () => ({ setTransform() {} }) }, {
    get: (o, k) => k in o ? o[k] : (...a) => { out.push(k + ' ' + a.map(v => typeof v === 'number' ? v.toFixed(3) : typeof v === 'object' ? '' : v).join(',') + ' ' + o.fillStyle + '|' + o.strokeStyle + '|' + o.lineWidth); },
    set: (o, k, v) => { o[k] = v; return true; } });
  try { ${js} } finally { g = g0; } return out; })()`);
const holzSzene = (style = 'sand', look = null) => {                      // style: sand = Holz, platten = Stein, kopf = Ziegel (→ Stein); look: neues Format (Metall, Kristall)
  const out = [], k = (u0, v0, N, o = {}) => kanal(u0, v0, N, { ...o, ...(look ? { look } : {}) });
  k(6, 4, 1, { style }); out.push([6, 4]);
  k(14, 4, 6, { style }); out.push([14, 4], [16, 4], [19, 4]);
  k(28, 4, 3, { steg: 1, style }); out.push([28, 4], [30, 4]);
  k(44, 4, 3, { steg: -1, style }); out.push([44, 4], [46, 4]);
  k(10, 14, 6, { breit: 3, style }); out.push([12, 14], [12, 15], [12, 16]);
  k(30, 14, 1, style === 'sand' ? { brk: 'rot' } : { style: 'kopf' }); out.push([30, 14]);
  k(40, 24, 6, { ax: 1, style }); out.push([24, 42], [24, 45]);
  k(40, 34, 3, { ax: 1, steg: 1, style }); out.push([34, 40], [34, 42]);
  k(10, 30, 1, { ohneWeg: true, style }); out.push([10, 30]);
  k(20, 52, 9, { style }); out.push([20, 52], [24, 52]);
  return out;
};
describe('Wasser-Wegbrücken: Holz im neuen Maler (160c D2c)', () => {
  const MAT = [['sand', 'holz', null], ['platten', 'stein', null], ['sand', 'stahl', { mat: 'stahl', licht: 'an' }], ['sand', 'kristall', { mat: 'kristall', licht: 'an', zacken: true }]];
  for (const [style, mat, look] of MAT) it(`${mat}: (hg,) h, vd, o nacheinander = w; alle Felder im neuen Maler (Rot ist Holz, Ziegel ist Stein)`, () => {
    const felder = holzSzene(style, look);
    for (const [x, y] of felder) {
      expect(game(`wbAt(${x}, ${y}).G.mat`), x + ',' + y).toBe(mat);
      for (const z of [0.5, 1, 2.5]) {
        const ganz = rec(`bkDrawLagen(${x}, ${y}, 0, 0, ${z}, 'w', wbAt(${x}, ${y}))`);
        expect(ganz.length).toBeGreaterThan(10);
        expect(rec(`for (const gr of ${mat === 'kristall' ? "['hg', 'h', 'vd', 'o']" : "['h', 'vd', 'o']"}) bkDrawLagen(${x}, ${y}, 0, 0, ${z}, gr, wbAt(${x}, ${y}))`), x + ',' + y + ' z ' + z).toEqual(ganz);
      }
    }
  });
  for (const [style, mat, look] of MAT) it(`Rahmen (${mat}): jede Gruppe bleibt in brBox(gr, wbAt) – Stützen bis aufs Wasser, Steg-Enden, breit, Nord-Süd, Licht, Zacken, z 0,5/1/2,5`, () => {
    const felder = holzSzene(style, look);
    const bad = game(`(() => { const g0 = g, bad = [], st = []; let box = null, lw = 1, cur = '', clip = 0;
      const chk = (x, y) => { if (clip) return; const [l, u, r, d] = box, e = lw / 2 + 0.01; if (x < -l - e || x > r + e || y < -u - e || y > d + e) bad.push(cur + ' ' + x.toFixed(1) + ',' + y.toFixed(1)); };
      const fake = new Proxy({ getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), createPattern: () => ({ setTransform() {} }) }, {
        get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => chk(x, y) : k === 'fillRect' ? (x, y, w, h) => { chk(x, y); chk(x + w, y + h); } : k === 'arc' ? (x, y, r) => { chk(x - r, y - r); chk(x + r, y + r); }
          : k === 'save' ? () => st.push(clip) : k === 'restore' ? () => { clip = st.pop() || 0; } : k === 'clip' ? () => { clip = 1; } : k in o ? o[k] : () => {},
        set: (o, k, v) => { o[k] = v; if (k === 'lineWidth') lw = v; return true; } });
      try { for (const [x, y] of ${JSON.stringify(felder)}) for (const z of [0.5, 1, 2.5]) for (const gr of ['h', 'vd', 'o', 'w', 'hg', 't1', 't2']) {
        const c = wbAt(x, y); cur = x + ',' + y + ' z' + z + ' ' + gr; box = brBox(gr, c).map(v => v * z);
        g = fake; try { bkDrawLagen(x, y, 0, 0, z, gr, c); } finally { g = g0; } } }
      finally { g = g0; } return bad.slice(0, 8); })()`);
    expect(bad).toEqual([]);
  });
  it('Rot: Geländer in Rot (#d9483b), Planken in Rot-Holz; Holz ohne Farbe im Standard', () => {
    holzSzene();
    const rot = rec("bkDrawLagen(30, 14, 0, 0, 2, 'w', wbAt(30, 14))").join('\n'), holz = rec("bkDrawLagen(6, 4, 0, 0, 2, 'w', wbAt(6, 4))").join('\n');
    expect(rot).toContain('#d9483b'); expect(holz).not.toContain('#d9483b');
  });
  it('Boot mittig unter einem Feld mit Stütze an der Anfangskante: vd im Bootsrahmen ab der Stütze nachgemalt (Schnitt 24,5 – rechts neben ihrem Strich), ohne Stütze kein Schnitt', () => {
    holzSzene();
    const redo = (x, y, s) => game(`(() => { const out = [], br = bkRedo, c = wbAt(${x}, ${y}); bkRedo = (...a) => { out.push([a[8], a[9], a[7].join('')]); };
      try { bkDrawMoving(${x}, ${y}, 100, 100, 2, 1e6, c, [{ boat: true, ship: 'motor', px: ${x}, py: ${y} + ${s}, du: 0, dv: 1 }], null, new Set()); } finally { bkRedo = br; } return [c.G.startPost, out]; })()`);
    const [sp1, r1] = redo(15, 4, 0.1), [sp2, r2] = redo(16, 4, 0.1);   // Kanten 1, 3, 5: Feld 15 (i 1) hat die Stütze, 16 (i 2) nicht
    expect([sp1, sp2]).toEqual([true, false]);
    expect(r1.some(([, cut, gr]) => cut === true && gr === 'vd')).toBe(true);
    expect(r2.some(([, cut]) => cut === true)).toBe(false);
    // Stütze der Anfangskante: bei s = (BK_W − 0,06) gestaucht auf EDGE_W, Strich 2,2 (lw = Breite · z / 2): rechter Rand links vom Schnitt
    expect(game('(0.5 + (BK_W - 0.06) / BK_W * EDGE_W) * TW / 2 - 1.1')).toBeGreaterThan(game('WB_START_CUT'));
  });
});

// D2g/D2h: Kristall – Glas t1/t2 jedes Bild genau einmal in tileB (auch ohne Bewegtes, GL: brLiveTiles), nie in w; Licht im Bildchen w
describe('Wasser-Wegbrücken: Kristall und Licht (160c D2g/D2h)', () => {
  it('Kristall: ohne Bewegtes je Bild genau einmal t1 und t2, hg ruhend im Bildchen w; brLiveTiles kennt das Feld (innere Reihe nicht)', () => {
    kanal(10, 4, 3, { look: { mat: 'kristall' } }); kanal(10, 12, 6, { breit: 2, look: { mat: 'kristall' } });
    const log = game(`(() => { const out = [], bl = bkDrawLagen; bkDrawLagen = (x, y, px, py, z, gr, c) => { out.push(gr + ' ' + x + ',' + y); return bl(x, y, px, py, z, gr, c); };
      try { cam = state.cam; cam.z = 2; const p = iso(11, 4); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); } finally { bkDrawLagen = bl; spriteForce = null; } return out; })()`);
    for (const x of [10, 11, 12]) expect(log.filter(e => e.endsWith(' ' + x + ',4')), x).toEqual(['w ' + x + ',4', 't1 ' + x + ',4', 't2 ' + x + ',4']);
    expect(game("[brLiveTiles().includes('11,4'), brLiveTiles().includes('12,13'), brLiveTiles().includes('12,12')]")).toEqual([true, true, false]);   // vorderste Reihe 13, innere 12
  });
  it('Licht: Bildchen w nachts mit |lit (Lampe in vd/o); ohne Licht ohne; Holz 16 Felder mit Lampen auf allen Feldkanten', () => {
    kanal(10, 4, 3, { look: { mat: 'holz', licht: 'an' } }); kanal(10, 12, 3);
    const keys = game(`(() => { const o = { na: nightAt, gh: gameHour }; nightAt = () => NIGHT_MAX; gameHour = () => 23;
      try { cam = state.cam; cam.z = 0.5; lastZoom = 0.5; lastZoomChange = -1e9; const p = iso(11, 8); cam.x = p.x; cam.y = p.y; spriteForce = null; spriteNoBudget = true; render(1e6); spriteNoBudget = false; }
      finally { nightAt = o.na; gameHour = o.gh; } return [...objSprites.keys()].filter(k => /^wb\|1[012],(4|12)\|w\|/.test(k)).sort(); })()`);
    expect(keys).toContain('wb|11,4|w|0|1'); expect(keys).toContain('wb|11,12|w|0');
    expect(keys.some(k => k.startsWith('wb|11,12|w|0|'))).toBe(false);
    kanal(6, 30, 16, { look: { mat: 'holz', licht: 'an' } });
    expect(game('(c => brLampSpots(c.G.art, c.G.fam, c.G.n, c.G.n).ts.length)(wbAt(14, 30))')).toBe(17);
  });
});

// Wächter (D2g, beim Prüfbild gefunden): die Nachtlicht-Listen fangen jedes Bild leer an – sonst wachsen sie und greifen auf freigegebene Leinwände
it('Bildanfang: glows, nightPics, nightPanes, nightSeen, nightWarm, WB_GLOW0 zurückgesetzt', () => {
  const r = game(`(() => { glows.push({ q: [[0, 0], [1, 0], [1, 1], [0, 1]], r: 1 }); nightPics.push(['x']); nightPanes.push(['x']); nightSeen.add('x'); nightWarm = true; WB_GLOW0.set('x', 1);
    const o = { na: nightAt, gh: gameHour }; nightAt = () => 0; gameHour = () => 12;
    try { render(1e6); } finally { nightAt = o.na; gameHour = o.gh; }
    return [nightPics.includes('x') || nightPics.some(p => p[0] === 'x'), nightPanes.some(p => p[0] === 'x'), nightSeen.has('x'), nightWarm, WB_GLOW0.has('x')]; })()`);
  expect(r).toEqual([false, false, false, false, false]);
});
