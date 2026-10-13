const { loadGame, game } = require('./helpers/load-game');

// 160c D2 (plan-160c/karte-D2.md): neue Modelle der Wasser-Wegbrücken nach dem abgenommenen Entwurf D0 (tools/wasserbruecken-entwurf.js).
// D2a: Brückenfeld wbAt bekommt seine Geometrie G (wbGeom: Spanne, gedachte Felder an offenen Enden, Höhe, Stützen, Reihen) – noch nichts Sichtbares
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 2; y <= 60; y++) for (let x = 2; x <= 60; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear()");
});
// Kanal längs x bzw. y: Wasser u0 … u0+N−1; steg 1: offen am +Ende, −1: am −Ende (5 Felder Wasser dahinter); ohneWeg: Ufer ohne Wegkachel
const kanal = (u0, v0, N, { ax = 0, breit = 1, steg = 0, style = 'sand', brk = null, ohneWeg = false } = {}) => game(`(() => {
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v, wA = ${steg < 0 ? 5 : 0}, wB = ${steg > 0 ? 5 : 0};
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3 - wA; u <= ${u0} + ${N} + 2 + wB; u++) state.terra.set(K(u, v), u >= ${u0} - wA && u < ${u0} + ${N} + wB ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    if (!${ohneWeg} && ${steg} >= 0) for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    if (!${ohneWeg} && ${steg} <= 0) for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: ${ax}${brk ? `, brk: '${brk}'` : ''} });
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
  it('nichts Sichtbares: alte Deckhöhe bleibt, solange das Material nicht umgestellt ist (WB_NEU leer); Lampen-Stellen bis 8 unverändert', () => {
    kanal(10, 4, 1, { brk: 'rot' });
    expect(game('[wbAt(10, 4).lift, WB_NEU.size]')).toEqual([8, 0]);
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
