const { loadGame, game } = require('./helpers/load-game');

// 160c G2 (Gesamtprüfung, plan-160c/g2-funde.md): Leistung. Stehende Vorschau malt den Brücken-Geist nicht jedes Bild neu (P1), wbLiveSet
// rechnet nur Kristall (P3), Anker der Wasser-Wegbrücke gemerkt und nur mit Licht (P3), Strom ohne Sortieren aller Felder (P4), der Geist
// lässt die Merker der echten Karte stehen (P6), Ablegen einer Gruppe gleicht je Spanne einmal an (P7)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; state.techs.add('bahn'); state.techs.add('terraform'); if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall')");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); if (state.bruecken) state.bruecken.clear(); recalc(); resetUndo()");
});
const wasser = (x0, x1, y0, y1) => game(`(() => { for (let y = ${y0}; y <= ${y1}; y++) for (let x = ${x0}; x <= ${x1}; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
const wegBruecke = (x0, x1, y) => game(`(() => { chosenStyle.weg = 'sand'; setTool('weg'); for (let x = ${x0}; x <= ${x1}; x++) build('weg', x, ${y}, true); setTool('look'); recalc(); })()`);

describe('stehende Vorschau: Geist der Brücke übers Wasser gemerkt (P1)', () => {
  it('gleicher Plan, gleiche Kamera: im zweiten Bild nicht neu gemalt, aber eingesetzt; Kamera bewegt: neu; Plan weg: Leinwand frei', () => {
    game("state.design = new Set(DESIGN.map(d => d.id))");
    wasser(10, 12, 3, 9);
    const r = game(`(() => { const n = { paint: 0, put: 0 }, wp = wbPaintLage; wbPaintLage = (...a) => { n.paint++; return wp(...a); };
      const out = [];
      try { chosenStyle.weg = 'asphalt'; setTool('weg'); startPlan('line', { x: 8, y: 6 }, { x: 14, y: 6 }, false);
        cam = state.cam; cam.z = 2; const p = iso(11, 6); cam.x = p.x; cam.y = p.y; spriteForce = false;
        render(1e6); out.push(n.paint); n.paint = 0;
        render(1e6 + 16); out.push(n.paint, GHOST_KEEP.size); n.paint = 0;
        cam.x += 7; render(1e6 + 32); out.push(n.paint); n.paint = 0;
        plan = null; setTool('look'); render(1e6 + 48); out.push(GHOST_KEEP.size);
      } finally { wbPaintLage = wp; plan = null; setTool('look'); spriteForce = null; } return out; })()`);
    expect(r[0]).toBeGreaterThan(0);
    expect(r[1]).toBe(0);              // stehend: nur eingesetzt
    expect(r[2]).toBe(1);              // eine Leinwand je Brücke
    expect(r[3]).toBeGreaterThan(0);   // Kamera bewegt: neu
    expect(r[4]).toBe(0);              // Vorschau weg: Leinwand frei
  });
});

describe('Wasser-Wegbrücken: Geometrie nur, wo nötig (P3)', () => {
  it('wbLiveSet rechnet nur Kristall-Brücken; die Kristallbrücke ist drin', () => {
    wasser(10, 12, 3, 9); wasser(20, 22, 3, 9);
    wegBruecke(9, 13, 6); wegBruecke(19, 23, 6);
    expect(game("wbSet(21, 6, { mat: 'kristall' })")).toBe(true);
    const r = game(`(() => { const seen = [], wa = wbAt; wbAt = (x, y) => { seen.push(x + ',' + y); return wa(x, y); };
      try { groundVersion++; return [wbLiveSet().arr.slice().sort(), seen.filter(k => +k.split(',')[0] < 15).length]; } finally { wbAt = wa; } })()`);
    expect(r[0]).toEqual(['20,6', '21,6', '22,6'].filter(k => game(`wbLiveSet().set.has('${k}')`)));
    expect(r[0].length).toBeGreaterThan(0);
    expect(r[1]).toBe(0);                                               // die Holzbrücke: keine Geometrie
  });
  it('Anker: ohne Licht keiner, mit Licht der der Spanne (gemerkt, wie brSpanAnchor)', () => {
    wasser(10, 13, 3, 9); wegBruecke(9, 14, 6);
    expect(game('wbAt(11, 6).G.anker')).toBe(null);
    expect(game("wbSet(11, 6, { licht: 'kaufen' })")).toBe(true);
    const a = game('brSpanAnchor(bridgeSpan(12, 6)).join(",")');
    expect(game('[10, 11, 12, 13].map(x => wbAt(x, 6).G.anker)')).toEqual([a, a, a, a]);
  });
});

describe('Strom: Übergänge ohne Sortieren aller Felder (P4)', () => {
  it('bei Mangel bleibt der Übergang dunkel, der nach Feldschlüssel zuletzt kommt (wie bisher)', () => {
    const ys = [3, 7, 11, 15, 19, 23];                                   // 6 Brücken × 2 Laternen = 12 > 10 je Strom
    for (const y of ys) {
      for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, ${y}, true)`);
      for (const dy of [-1, 0, 1]) game(`build('weg', 9, ${y + dy}, true)`);
      expect(game(`setCrossing(9, ${y}, true, 'holz')`), 'Brücke ' + y).toBe(true);
      expect(game(`brSet({ at: 'uebergang', x: 9, y: ${y} }, { licht: 'kaufen' })`), 'Licht ' + y).toBe(true);
    }
    const r = game(`(() => { const all = computePower([], 1e9, 1), one = computePower([], 1, 1), ks = ${JSON.stringify(ys.map(y => '9,' + y))};
      return [ks.filter(k => all.dark.has('U' + k)), ks.filter(k => one.dark.has('U' + k))]; })()`);
    expect(r[0]).toEqual([]);
    expect(r[1]).toEqual(['9,7']);                                      // sortiert: 9,11 < 9,15 < 9,19 < 9,23 < 9,3 < 9,7
  });
});

describe('Geist übers Wasser: die Merker der echten Karte bleiben (P6)', () => {
  it('wbVirtual: wbCache/gbCache/brSpanCache/bridgeArchCache danach mit denselben Maps und Einträgen', () => {
    wasser(10, 12, 3, 9); wegBruecke(9, 13, 6);
    const r = game(`(() => { wbAt(11, 6); brSpanLook(11, 6); bridgeArch(11, 6);
      const C = [wbCache, gbCache, brSpanCache, bridgeArchCache], before = C.map(c => [c.map, c.map.size, c.v, c.tiles]);
      wbVirtual([['11,9', { b: 'weg', lvl: 1, bridge: true, style: 'sand' }]], ['11,9']);
      return C.map((c, i) => c.map === before[i][0] && c.map.size === before[i][1] && c.v === before[i][2] && c.tiles === before[i][3] && !c.map.has('11,9')); })()`);
    expect(r).toEqual([true, true, true, true]);
  });
});

describe('Gruppe ablegen: je Spanne einmal angleichen (P7)', () => {
  it('lange Gleisbrücke als Gruppe verschoben: gbUnify einmal je Spanne, Aussehen bleibt', () => {
    game(`(() => { for (const y0 of [3, 15]) for (let y = y0; y <= y0 + 4; y++) for (let x = 2; x <= 12; x++) state.terra.set(x + ',' + y, 'water');
      for (const x of [0, 1, 13, 14]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0 });
      for (let x = 2; x <= 12; x++) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, bridge: true });
      terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
    expect(game("brSet({ at: 'gleis', x: 5, y: 5 }, { mat: 'stein' })")).toBe(true);
    const r = game(`(() => { let n = 0; const gu = gbUnify; gbUnify = (...a) => { n++; return gu(...a); };
      try { setTool('verschieben'); pickUpGroup(0, 5, 14, 5); const ok = dropGroup(7, 17); return [ok, n]; } finally { gbUnify = gu; setTool('look'); } })()`);
    expect(r).toEqual([true, 1]);
    expect(game("[...new Set([2, 5, 8, 12].map(x => brLook(state.tiles.get(x + ',17'), 'gleis').mat))]")).toEqual(['stein']);
  });
  it('Gruppe aus Gleisbrücken neben eine längere gelegt: alle Felder gleichen sich an (nicht nur das am Rand)', () => {
    game(`(() => { for (let y = 3; y <= 7; y++) { for (let x = 2; x <= 11; x++) state.terra.set(x + ',' + y, 'water'); for (let x = 20; x <= 22; x++) state.terra.set(x + ',' + y, 'water'); }
      for (const x of [0, 1, 12, 13, 19, 23]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0 });
      for (const x of [2, 3, 4, 5, 6, 7, 8, 20, 21, 22]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, bridge: true });
      terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
    expect(game("brSet({ at: 'gleis', x: 5, y: 5 }, { mat: 'stein' })")).toBe(true);
    expect(game("brLook(state.tiles.get('21,5'), 'gleis').mat")).toBe('holz');
    expect(game("(() => { setTool('verschieben'); pickUpGroup(20, 5, 22, 5); const ok = dropGroup(10, 5); setTool('look'); return ok; })()")).toBe(true);
    expect(game("[9, 10, 11].map(x => brLook(state.tiles.get(x + ',5'), 'gleis').mat)")).toEqual(['stein', 'stein', 'stein']);
  });
});
