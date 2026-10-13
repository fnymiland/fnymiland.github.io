const { loadGame, game } = require('./helpers/load-game');

// 160c D1a (plan-160c/karte-D1.md): Wasser-Wegbrücken in Lagen h | vd | o wie die Anhöhen-Brücken (B2) – gleicher Maler (drawWegBridge),
// Brückenfeld wbAt (wie bkAt), Gruppen-Code der Anhöhe mit dem Feld als Parameter. Nichts Sichtbares: die Lagen nacheinander = das Ganze
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look')");
  game("for (let y = 2; y <= 50; y++) for (let x = 2; x <= 50; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); recalc()");
});
// Kanal längs x bzw. y: Wasser u0 … u0+N−1 (steg: bis +5 offen), Ufer mit Weg, Brücke aus Wegfeldern mit bridge
const kanal = (u0, v0, N, { ax = 0, breit = 1, steg = false, style = 'sand', brk = null } = {}) => game(`(() => {
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v, wet = ${steg ? 5 : 0};
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3; u <= ${u0} + ${N} + 2 + wet; u++) state.terra.set(K(u, v), u >= ${u0} && u < ${u0} + ${N} + wet ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    if (!${steg}) for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: ${ax}${brk ? `, brk: '${brk}'` : ''} });
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// Zeichenaufrufe mitschreiben (Attrappe wie setup.js: getTransform, createPattern)
const rec = js => game(`(() => { const g0 = g, out = [];
  g = new Proxy({ getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), createPattern: () => ({ setTransform() {} }) }, {
    get: (o, k) => k in o ? o[k] : (...a) => { out.push(k + ' ' + a.map(v => typeof v === 'number' ? v.toFixed(3) : typeof v === 'object' ? '' : v).join(',') + ' ' + o.fillStyle + '|' + o.strokeStyle + '|' + o.lineWidth + '|' + o.globalAlpha); },
    set: (o, k, v) => { o[k] = v; return true; } });
  try { ${js} } finally { g = g0; } return out; })()`);
const FAELLE = [];
const szene = () => {
  const out = [];
  [['sand', null], ['platten', null], ['kopf', null], ['sand', 'rot']].forEach(([style, brk], i) => {
    const v = 4 + i * 9;
    kanal(6, v, 1, { style, brk }); out.push([6, v]);
    kanal(14, v, 3, { style, brk }); out.push([14, v], [15, v], [16, v]);
    kanal(24, v, 6, { style, brk, breit: 3 }); out.push([24, v], [26, v], [26, v + 1], [26, v + 2]);
    kanal(36, v, 2, { style, brk, steg: true }); out.push([36, v], [37, v]);
  });
  kanal(42, 40, 3, { ax: 1, style: 'platten' }); out.push([40, 42], [40, 43]);   // Nord-Süd: x 38–42, y 39–47 (überschneidet nichts)
  return out;
};
void FAELLE;

describe('Wasser-Wegbrücken in Lagen (160c D1a)', () => {
  it('h, vd, o nacheinander = das Ganze (w auch) – alle Arten, flach, Bogen, breit, Steg, Nord-Süd, nah und weit; BRIDGE_FRONT gibt es nicht mehr (D1e)', () => {
    const felder = szene();
    for (const [x, y] of felder) for (const z of [0.5, 1, 2.5]) {
      const T = `state.tiles.get('${x},${y}')`;
      const ganz = rec(`drawWegBridge(0, 0, ${z}, ${x}, ${y}, ${T})`);
      expect(ganz.length, x + ',' + y).toBeGreaterThan(0);
      const lagen = rec(`for (const L of [BK_GRUPPEN.h, BK_GRUPPEN.vd, BK_GRUPPEN.o]) drawWegBridge(0, 0, ${z}, ${x}, ${y}, ${T}, L)`);
      expect(lagen, x + ',' + y + ' z ' + z).toEqual(ganz);
      expect(rec(`drawWegBridge(0, 0, ${z}, ${x}, ${y}, ${T}, BK_GRUPPEN.w)`), 'w ' + x + ',' + y).toEqual(ganz);   // D1b: ruhend alles in einem
    }
    expect(game("typeof BRIDGE_FRONT")).toBe('undefined');                                   // über dem Boot: Lagen v, d, o (drawBridgeOver)
  });
  it('wbAt: Brückenfeld nur für Wasser-Wegbrücken; Achse, Bogen, Höhe, Ufer; wegDeckH = die Höhe des Malers', () => {
    szene();
    expect(game("[wbAt(5, 4), wbAt(9, 4), wbAt(30, 30)]")).toEqual([null, null, null]);   // Landweg, Gras
    const c1 = game("(c => [c.water, c.ax, !!c.A, c.lift, c.landA, c.landB, c.W])(wbAt(6, 4))");
    expect(c1).toEqual([true, 0, false, 3, true, true, game('EDGE_W')]);
    expect(game("(c => [!!c.A, c.A.N, c.b.n, c.hm > 10])(wbAt(15, 4))")).toEqual([true, 3, 3, true]);
    expect(game("(c => [!!c.A, c.landA, c.landB])(wbAt(37, 4))")).toEqual([false, false, false]);   // Steg: Ende im Wasser
    expect(game("(c => [c.ax, !!c.A])(wbAt(40, 43))")).toEqual([1, true]);
    const st = game("(c => [c.lift, wegDeckH(c, 0), wegDeckH(c, 0.45)])(wbAt(6, 13))");   // Stein, Rampe zum Ufer
    expect(st.slice(0, 2)).toEqual([7, 7]); expect(st[2]).toBeCloseTo(7 * 0.05 / 0.3, 9);
    expect(game("(c => [wegDeckH(c, 0), archDeck(c.A, c.A.i0 + 0.5)])(wbAt(15, 4))")).toEqual(game("(c => [archDeck(c.A, c.A.i0 + 0.5), archDeck(c.A, c.A.i0 + 0.5)])(wbAt(15, 4))"));
    expect(game("wbAt(6, 4) === wbAt(6, 4)")).toBe(true);                                        // gemerkt je Boden-Fassung
    game("groundVersion++");
    expect(game("(c => c.lift)(wbAt(6, 4))")).toBe(3);
  });
  it('Gruppen-Code der Anhöhe mit dem Wasserfeld: Bildchen wb|x,y|gruppe|FOG ohne Licht, gemalt mit drawWegBridge(…, lagen); blass gilt nicht', () => {
    szene();
    const r = game(`(() => { const dw = drawWegBridge, calls = []; drawWegBridge = (cx, cy, z, x, y, t, L) => { calls.push(x + ',' + y + ':' + (L || []).join('')); return dw(cx, cy, z, x, y, t, L); };
      const S = spriteForce; spriteForce = true; spriteNoBudget = true;
      try { cam.z = 0.6; for (const gr of ['h', 'vd', 'o']) spriteBridge(15, 4, 100, 100, 0.6, gr, wbAt(15, 4)); }
      finally { drawWegBridge = dw; spriteForce = S; spriteNoBudget = false; }
      return [calls, [...objSprites.keys()].filter(k => k.startsWith('wb|15,4|')).sort(), [...objSprites.entries()].filter(([k]) => k.startsWith('wb|')).every(([, e]) => e.glows.length === 0)]; })()`);
    expect(r[0]).toEqual(['15,4:h', '15,4:vd', '15,4:o']);
    expect(r[1]).toEqual(['wb|15,4|h|0', 'wb|15,4|o|0', 'wb|15,4|vd|0']);
    expect(r[2]).toBe(true);
    game('setSeeThrough(true)');
    expect(game("(() => { const a = []; const dw = drawWegBridge; drawWegBridge = (...x) => { a.push(g.globalAlpha); return dw(...x); }; try { bkGroup(15, 4, 100, 100, 2, ['vd'], wbAt(15, 4)); } finally { drawWegBridge = dw; setSeeThrough(false); } return a; })()")).toEqual([1]);
  });
  it('Rahmen: jede Lage bleibt in brBox(gr, wbAt) (alle Arten, flach, Bogen, breit, Steg, z 0,5/1/2,5)', () => {
    const felder = szene();
    const bad = game(`(() => { const g0 = g, bad = [], st = []; let box = null, lw = 1, cur = '', clip = 0;
      const chk = (x, y) => { if (clip) return; const [l, u, r, d] = box, e = lw / 2 + 0.01; if (x < -l - e || x > r + e || y < -u - e || y > d + e) bad.push(cur + ' ' + x.toFixed(1) + ',' + y.toFixed(1)); };
      const fake = new Proxy({ getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), createPattern: () => ({ setTransform() {} }) }, {
        get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => chk(x, y) : k === 'fillRect' ? (x, y, w, h) => { chk(x, y); chk(x + w, y + h); } : k === 'arc' ? (x, y, r) => { chk(x - r, y - r); chk(x + r, y + r); }
          : k === 'save' ? () => st.push(clip) : k === 'restore' ? () => { clip = st.pop() || 0; } : k === 'clip' ? () => { clip = 1; } : k in o ? o[k] : () => {},
        set: (o, k, v) => { o[k] = v; if (k === 'lineWidth') lw = v; return true; } });
      try { for (const [x, y] of ${JSON.stringify(felder)}) for (const z of [0.5, 1, 2.5]) for (const gr of ['h', 'vd', 'o', 'w']) {
        const c = wbAt(x, y); cur = x + ',' + y + ' z' + z + ' ' + gr; box = brBox(gr, c).map(v => v * z);
        g = fake; try { drawWegBridge(0, 0, z, x, y, state.tiles.get(x + ',' + y), BK_GRUPPEN[gr]); } finally { g = g0; } } }
      finally { g = g0; } return bad.slice(0, 8); })()`);
    expect(bad).toEqual([]);
  });
});

// 160c D1d: Figuren auf flachen Wasserbrücken stehen auf dem Deck (wegDeckH, LIFT 3/7/8, Rampe zum Ufer) statt am Boden; Bögen wie bisher.
// Kopf (Antippen, Sprechblase: walkerHead) und GL-Rahmen (glMoverBox) gehen mit
describe('Wasser-Wegbrücken: Höhe der Figuren (160c D1d)', () => {
  it('wegBridgeLift = wegDeckH des Felds (flach: Deck, Rampe zum Ufer, Steg offen bis zum Ende; Bogen wie die alte Formel); an Land 0', () => {
    const felder = szene();
    for (const [x, y] of felder) for (const a of [-0.45, -0.3, 0, 0.2, 0.45]) {
      const r = game(`(() => { const c = wbAt(${x}, ${y}), px = ${x} + (c.ax ? 0 : ${a}), py = ${y} + (c.ax ? ${a} : 0), A = c.A;
        return [wegBridgeLift(px, py), wegDeckH(c, ${a}), A ? archDeck(A, A.i0 + ${a} + 0.5) : null]; })()`);
      expect(r[0], x + ',' + y + ' a ' + a).toBeCloseTo(r[1], 9);
      if (r[2] != null) expect(r[0], 'Bogen ' + x + ',' + y).toBeCloseTo(r[2], 9);
    }
    expect(game('[wegBridgeLift(6, 13), wegBridgeLift(6, 4), wegBridgeLift(6, 31)]')).toEqual([7, 3, 8]);   // Stein 7, Holz 3, Rot 8 (BRIDGE_LOOK, wie der Maler)
    expect(game('wegBridgeLift(6.45, 13)')).toBeCloseTo(7 * 0.05 / 0.3, 9);                // Rampe zum Ufer
    expect(game('wegBridgeLift(37.45, 4)')).toBe(3);                                        // Steg: offenes Ende bleibt oben
    expect(game('[wegBridgeLift(5, 4), wegBridgeLift(9, 4), wegBridgeLift(30, 30)]')).toEqual([0, 0, 0]);
  });
  it('Kopf (walkerHead) und GL-Rahmen (glMoverBox) um die Deckhöhe höher; auf dem Dach/der Treppe (figUp) zählt die nicht', () => {
    szene();
    const r = game(`(() => { const w = { px: 6, py: 13, kind: 0, fur: '#fff' }, l = { px: 5, py: 13, kind: 0, fur: '#fff' }, z = 2;
      return [toScreen(6, 13).y - walkerHead(w, z)[1], toScreen(5, 13).y - walkerHead(l, z)[1], glMoverBox(w, z)[1] - glMoverBox(l, z)[1],
        toScreen(6, 13).y - walkerHead({ ...w, up: 2 }, z)[1] - (toScreen(5, 13).y - walkerHead({ ...l, up: 2 }, z)[1])]; })()`);
    expect(r[0] - r[1]).toBeCloseTo(7 * 2, 9);
    expect(r[2]).toBeCloseTo(7 * 2, 9);
    expect(r[3]).toBeCloseTo(0, 9);
  });
});
