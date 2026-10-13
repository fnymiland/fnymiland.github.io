const { loadGame, game } = require('./helpers/load-game');

// 160c D1b (plan-160c/karte-D1.md): Wasser-Wegbrücken ruhend in tileA wie die Anhöhen-Brücken (B2) – je Feld in seiner Feldrunde (nach
// drawEdgesAt des Felds, vor dem nächsten Feld), nicht mehr im Boden-Durchgang. Ruhend liegt nichts zwischen den Lagen: eine Gruppe w (= h + vd + o),
// weit weg ein Bildchen wb|x,y|w statt flat|/arch| (gleich viele Zeichenbefehle wie vorher); nachgemalt wird je Lage (D1e)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 2; y <= 50; y++) for (let x = 2; x <= 50; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; hillWalkers.length = 0; critters.length = 0");
});
// Kanal längs x bzw. y wie wasserbruecken-lagen.test.js: Wasser u0 … u0+N−1 (steg: bis +5 offen), Ufer mit Weg, Brücke aus Wegfeldern mit bridge
const kanal = (u0, v0, N, { ax = 0, breit = 1, steg = false, style = 'sand', brk = null } = {}) => game(`(() => {
  const K = (u, v) => ${ax} ? v + ',' + u : u + ',' + v, wet = ${steg ? 5 : 0};
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3; u <= ${u0} + ${N} + 2 + wet; u++) state.terra.set(K(u, v), u >= ${u0} && u < ${u0} + ${N} + wet ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    if (!${steg}) for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: ${ax} });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(K(u, ${v0} + r), { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: ${ax}${brk ? `, brk: '${brk}'` : ''} });
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
// Fälle: [Name, Kamera x, y, Brückenfelder]; Holz (sand), Stein (platten), Ziegel (kopf), Rot; 1 Feld, Bogen 3, breit 3 (Bogen 6), Steg, Nord-Süd
const FAELLE = [];
const szene = () => {
  FAELLE.length = 0;
  [['sand', null], ['platten', null], ['kopf', null], ['sand', 'rot']].forEach(([style, brk], i) => {
    const v = 4 + i * 9, n = style + (brk || '');
    kanal(6, v, 1, { style, brk }); FAELLE.push([n + ' 1 Feld', 6, v, [[6, v]]]);
    kanal(14, v, 3, { style, brk }); FAELLE.push([n + ' Bogen 3', 15, v, [[14, v], [15, v], [16, v]]]);
    kanal(24, v, 6, { style, brk, breit: 3 }); FAELLE.push([n + ' breit 3', 26.5, v + 1, [[25, v], [26, v + 1], [27, v + 2]]]);
    kanal(36, v, 2, { style, brk, steg: true }); FAELLE.push([n + ' Steg', 36.5, v, [[36, v], [37, v]]]);
  });
  kanal(42, 40, 3, { ax: 1, style: 'platten' }); FAELLE.push(['Nord-Süd', 40, 43, [[40, 42], [40, 43], [40, 44]]]);
};
// ein Bild nah (live, ohne Bildchen) mit Spionen: 'A x,y' (Feldrunde: drawEdgesAt), 'gr[w] x,y [fog]' (bkDrawLagen, w: Wasserfeld), 'wb x,y' (Maler)
const order = (cx, cy, extra = '', z = 2) => game(`(() => {
  ${extra}
  const log = [], bl = bkDrawLagen, de = drawEdgesAt, dw = drawWegBridge;
  drawEdgesAt = (x, y, ...r) => { log.push('A ' + x + ',' + y); return de(x, y, ...r); };
  bkDrawLagen = (x, y, px, py, z, gr, c) => { const cc = c === undefined ? bkAt(x, y) : c; log.push(gr + (cc && cc.water ? 'w' : '') + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, c); };
  drawWegBridge = (cx, cy, z, x, y, ...r) => { log.push('wb ' + x + ',' + y); return dw(cx, cy, z, x, y, ...r); };
  try { cam = state.cam; cam.z = ${z}; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
  finally { bkDrawLagen = bl; drawEdgesAt = de; drawWegBridge = dw; spriteForce = null; }
  return log;
})()`);
const lagenOf = (log, x, y) => log.filter(e => new RegExp(`^(h|vd|o|w)w? ${x},${y}( fog)?$`).test(e)).map(e => e.split(' ')[0]);

describe('Wasser-Wegbrücken ruhend in der Feldrunde (160c D1b)', () => {
  it('je Feld genau einmal w – nach dem eigenen Feld (drawEdgesAt), vor dem nächsten; im Boden-Durchgang nichts (alle Arten, flach, Bogen, breit, Steg, Nord-Süd)', () => {
    szene();
    for (const [name, cx, cy, felder] of FAELLE) {
      const log = order(cx, cy), first = log.findIndex(e => e.startsWith('A '));
      expect(first, name).toBeGreaterThan(-1);
      expect(log.slice(0, first).some(e => e.startsWith('wb ')), name + ': Boden-Durchgang').toBe(false);
      for (const [x, y] of felder) {
        const k = x + ',' + y, a = log.indexOf('A ' + k), next = log.findIndex((e, j) => j > a && e.startsWith('A '));
        expect(a, name + ' ' + k).toBeGreaterThan(-1);
        expect(lagenOf(log, x, y), name + ' ' + k).toEqual(['ww']);
        const own = log.map((e, j) => [e, j]).filter(([e]) => e === 'wb ' + k || / /.test(e) && e.split(' ')[1] === k && /^(h|vd|o|w)w$/.test(e.split(' ')[0]));
        expect(own.length, name + ' ' + k).toBe(2);                                       // eine Gruppe, einmal gemalt
        expect(own.every(([, j]) => j > a && (next < 0 || j < next)), name + ' ' + k + ': in der eigenen Feldrunde').toBe(true);
      }
    }
  });
  it('fremdes Feld: im Nebel; das eigene daneben nicht', () => {
    szene();
    const log = order(15, 4, "state.claimed.delete('15,4'); state.owned.delete(chunkOf(15, 4)); groundVersion++;");
    expect(log.filter(e => /^(h|vd|o|w)w 15,4/.test(e))).toEqual(['ww 15,4 fog']);
    expect(log.filter(e => /^(h|vd|o|w)w 14,4/.test(e))).toEqual(['ww 14,4']);
  });
  it('Rückfall: Brückenfeld ohne Belegung (state.tiles.set ohne recalc) wird trotzdem gezeichnet', () => {
    szene();
    const log = order(37, 4, "state.tiles.set('38,4', { b: 'weg', lvl: 1, style: 'sand', bridge: true, lauf: 0 }); groundVersion++;");
    expect(game("COVER.has('38,4')")).toBe(false);
    expect(lagenOf(log, 38, 4)).toEqual(['ww']);
  });
  it('alte Daten: Anhöhen-Deck über einer Wasserbrücke – die Wasserbrücke zwischen h und vd des Decks, nie verschachtelt, nichts doppelt', () => {
    szene();
    const log = order(6, 4, "state.bruecken.set('6,4', { ax: 0, n: 1, art: 'holz' }); groundVersion++;");
    expect(lagenOf(log, 6, 4)).toEqual(['h', 'ww', 'vd', 'o']);
    expect(log.filter(e => e === 'wb 6,4').length).toBe(1);
  });
});

describe('Wasser-Wegbrücken weit weg als Bildchen (160c D1b)', () => {
  const far = (cx, cy) => game(`(() => { cam = state.cam; cam.z = 0.5; lastZoom = 0.5; lastZoomChange = -1e9; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = null; })()`);
  it('je Feld ein Bildchen wb|x,y|w der aktuellen Fassung, ohne Licht, kein flat|/arch|; gemalt je einmal; das nächste Bild malt nichts live und nichts neu', () => {
    szene();
    far(20, 8);
    const made = game(`(() => { const dw = drawWegBridge; let n = 0; drawWegBridge = (...a) => { if (SPRITE_PAINT) n++; return dw(...a); };
      try { spriteNoBudget = true; render(1e6); spriteNoBudget = false; } finally { drawWegBridge = dw; } return n; })()`);
    const keys = game("[...objSprites.entries()].filter(([k]) => /^(wb|br|flat|arch)\\|/.test(k)).map(([k, e]) => [k, e.ver === groundVersion, e.glows.length])");
    for (const [x, y] of [[6, 4], [14, 4], [15, 4], [16, 4], [26, 5], [36, 4], [37, 4], [6, 13], [15, 13]]) expect(keys.some(([k]) => k === `wb|${x},${y}|w|0`), x + ',' + y).toBe(true);
    expect(keys.filter(([k]) => /^(flat|arch|br)\|/.test(k) || /^wb\|.*\|(h|vd|o)\|/.test(k))).toEqual([]);   // ruhend nur w
    expect(keys.every(([, v, gl]) => v && gl === 0)).toBe(true);
    expect(made).toBe(keys.length);                                                       // jedes Bildchen genau einmal gemalt, jedes mit einem Malaufruf
    const r = game(`(() => { const bl = bkDrawLagen; let live = 0; bkDrawLagen = (...a) => { if (!SPRITE_PAINT) live++; return bl(...a); };
      const wb = () => [...objSprites.entries()].filter(([k]) => k.startsWith('wb|')), m0 = wb();
      try { render(1e6 + 16); } finally { bkDrawLagen = bl; } const m1 = wb(); return [live, m1.length === m0.length && m1.every(([k, e], i) => m0[i][0] === k && m0[i][1] === e) ? 0 : 1]; })()`);
    expect(r).toEqual([0, 0]);
  });
});
