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
  const log = [], bl = bkDrawLagen, de = drawEdgesAt, wa = wbArgs;   // Maler (160c D2): wbArgs je Gruppe
  drawEdgesAt = (x, y, ...r) => { log.push('A ' + x + ',' + y); return de(x, y, ...r); };
  bkDrawLagen = (x, y, px, py, z, gr, c) => { const cc = c === undefined ? bkAt(x, y) : c; log.push(gr + (cc && cc.water ? 'w' : '') + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, c); };
  wbArgs = (c, ...r) => { log.push('wb ' + c.x + ',' + c.y); return wa(c, ...r); };
  try { cam = state.cam; cam.z = ${z}; const p = iso(${cx}, ${cy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6); }
  finally { bkDrawLagen = bl; drawEdgesAt = de; wbArgs = wa; spriteForce = null; }
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
    const made = game(`(() => { const wa = wbArgs; let n = 0; wbArgs = (...a) => { if (SPRITE_PAINT) n++; return wa(...a); };
      try { spriteNoBudget = true; render(1e6); spriteNoBudget = false; } finally { wbArgs = wa; } return n; })()`);
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

// 160c D1c: Vorschau auf dem Deck – Plan-Rauten und der Einzelfeld-Rahmen (Hover, Abriss) auf Wasserbrücken kommen nach der Brücke
// (DECK_MARKS, bkDrawStill) und liegen auf der Deckhöhe (wegDeckH); an Land wie vorher sofort und am Boden
describe('Wasser-Wegbrücken: Vorschau auf dem Deck (160c D1c)', () => {
  it('Linienplan über die Brücke: Raute jedes Brückenfelds nach dessen w, um wegDeckH angehoben; an Land vorher und am Boden', () => {
    szene();
    const r = game(`(() => { const out = [], bl = bkDrawLagen, hm = hillMark;
      bkDrawLagen = (x, y, px, py, z, gr, c) => { out.push(gr + ' ' + x + ',' + y); return bl(x, y, px, py, z, gr, c); };
      hillMark = (x, y, f) => hm(x, y, () => { let first = null; g.moveTo = (a, b) => { if (first == null) first = b; }; try { f(); } finally { delete g.moveTo; } out.push('raute ' + x + ',' + y + ' ' + first.toFixed(3)); });
      const want = {};
      try {
        setTool('weg'); startPlan('line', { x: 11, y: 4 }, { x: 19, y: 4 }, false);
        cam = state.cam; cam.z = 2; const p = iso(15, 4); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6);
        for (const x of [13, 14, 15, 16]) { const c = wbAt(x, 4); want[x + ',4'] = (toScreen(x - 0.44, 4 - 0.44).y - (c ? wegDeckH(c, -0.44) : 0) * cam.z).toFixed(3); }
      } finally { bkDrawLagen = bl; hillMark = hm; plan = null; setTool('look'); spriteForce = null; }
      return [out, want]; })()`);
    const [log, want] = r, at = e => log.findIndex(l => l.startsWith(e));
    for (const k of ['14,4', '15,4', '16,4']) {
      expect(at('raute ' + k + ' '), k).toBeGreaterThan(at('w ' + k));
      expect(log[at('raute ' + k + ' ')], k).toBe('raute ' + k + ' ' + want[k]);
    }
    expect(+want['15,4']).toBeLessThan(game('toScreen(15 - 0.44, 4 - 0.44).y') - 5);    // wirklich angehoben (Bogen)
    expect(at('raute 13,4 ')).toBeLessThan(at('w 14,4'));                                // Land: sofort, am Boden
    expect(log[at('raute 13,4 ')]).toBe('raute 13,4 ' + want['13,4']);
  });
  it('Einzelfeld-Rahmen (Abriss) auf einer Wasserbrücke: nach ihrem w, Ecken auf der Deckhöhe, eingerückt (das nächste Feld deckt sonst die Strichhälfte); daneben an Land am Boden', () => {
    szene();
    const rahmen = (hx, hy) => game(`(() => { const out = [], bl = bkDrawLagen; let first = null;
      bkDrawLagen = (x, y, px, py, z, gr, c) => { out.push(gr + ' ' + x + ',' + y); return bl(x, y, px, py, z, gr, c); };
      g.beginPath = () => { first = null; }; g.moveTo = (a, b) => { if (first == null) first = b; };
      g.stroke = () => { if (g.lineWidth === 3 * cam.z && (g.strokeStyle === '#3fbf6f' || g.strokeStyle === '#e5484d')) out.push('rahmen ' + first.toFixed(3)); };
      let want;
      try {
        setTool('abriss'); hover = { x: ${hx}, y: ${hy} };
        cam = state.cam; cam.z = 2; const p = iso(${hx}, ${hy}); cam.x = p.x; cam.y = p.y; spriteForce = false; render(1e6);
        const c = wbAt(${hx}, ${hy}), e = c ? 0.44 : 0.5; want = (toScreen(${hx} - e, ${hy} - e).y - (c ? wegDeckH(c, -e) : 0) * cam.z).toFixed(3);   // auf dem Deck eingerückt
      } finally { bkDrawLagen = bl; delete g.beginPath; delete g.moveTo; delete g.stroke; hover = null; setTool('look'); spriteForce = null; }
      return [out, want]; })()`);
    {
      const [log, want] = rahmen(15, 4), i = log.findIndex(e => e.startsWith('rahmen'));
      expect(log.filter(e => e.startsWith('rahmen'))).toEqual(['rahmen ' + want]);
      expect(i).toBeGreaterThan(log.indexOf('w 15,4'));
      expect(+want).toBeLessThan(game('toScreen(15 - 0.5, 4 - 0.5).y') - 5);
    }
    {
      const [log, want] = rahmen(13, 4), i = log.findIndex(e => e.startsWith('rahmen'));
      expect(log.filter(e => e.startsWith('rahmen'))).toEqual(['rahmen ' + want]);
      expect(i).toBeLessThan(log.indexOf('w 14,4'));                                    // Land: wie vorher sofort
    }
  });
});
