// Erzeugt testsave-freizeitpark.json (Testwelt ?welt=freizeitpark: fertiger Park mit Achterbahn + freie Fläche zum Bauen).
// Nur auf Wunsch:  TESTWELT=1 npx vitest run tests/testwelt-freizeitpark.test.js
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
beforeAll(() => loadGame());
it.skipIf(!process.env.TESTWELT)('erzeugt testsave-freizeitpark.json', () => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true");
  game("state.town.name = 'Wunderhausen'; state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const i of ISLES) state.islands.add(i.id); state.festival = true");
  const W = 30, H = 18;
  const area = game(`(() => { for (let y0 = -40; y0 < 40; y0++) for (let x0 = -40; x0 < 40; x0++) { let ok = true; for (let y = 0; y < ${H} && ok; y++) for (let x = 0; x < ${W} && ok; x++) if (!ownedTile(x0 + x, y0 + y) || isSea(x0 + x, y0 + y)) ok = false; if (ok) return [x0, y0]; } })()`);
  const [X, Y] = area;
  game(`for (let y = ${Y}; y < ${Y + H}; y++) for (let x = ${X}; x < ${X + W}; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }`);
  game('rebuildCover(); recalc()');
  const B = (b, x, y, rot = 0) => game(`(rotManual = true, buildRot = ${rot}, rebuildCover(), build('${b}', ${X + x}, ${Y + y}, true))`);
  // Häuser mit Bewohnern unten, Weg zum Park
  for (let x = 1; x < W - 1; x++) B('weg', x, 15);
  for (let x = 1; x < W - 1; x += 2) game(`state.tiles.set('${X + x},${Y + 16}', { b: 'haus', lvl: ${1 + (x % 5)}, rot: 0 })`);
  game('nameHouses(); rebuildCover(); recalc()');
  // Fertiger Park links (16×13): Wunderland mit Achterbahn
  for (let y = 1; y <= 13; y++) for (let x = 1; x <= 16; x++) B('fzboden', x, y);
  const ring = [];
  for (let x = 2; x <= 15; x++) ring.push([x, 2]);
  for (let y = 3; y <= 12; y++) ring.push([15, y]);
  for (let x = 14; x >= 2; x--) ring.push([x, 12]);
  for (let y = 11; y >= 3; y--) ring.push([2, y]);
  for (const [x, y] of ring) if (!(x === 5 && y === 12)) B('fz_bahn', x, y);
  B('fz_station', 5, 12); B('fz_looping', 9, 2);
  // Märchenschloss (Block 60g/h): Vorlage „Märchenschloss“, 7 breit, 2 tief – Portal zum Weg (Drehung 1)
  B('fz_schloss', 5, 7, 1);
  game(`(t => { t.cs = csOf({ cs: { w: 7, d: 2, ...CS_TPL.maerchen.cs, bk: 1, lc: 1, wp: 1, ex: 1, gb: 1 } }); t.roof = 1; t.price = castlePrice(t.cs); })(state.tiles.get('${X + 5},${Y + 7}')); rebuildCover()`);
  const T = (b, x, y, fl, rot = 0) => { B(b, x, y, rot); if (fl) game(`state.tiles.get('${X + x},${Y + y}').fl = ${fl}`); };
  // Eingang: zwei Tortürme
  T('fz_torturm', 16, 5, 2); T('fz_torturm', 16, 9, 2);
  for (const [b, x, y, r] of [['fz_karussell', 3, 3], ['fz_teetassen', 12, 3], ['fz_kette', 12, 10], ['fz_freifall', 4, 6], ['fz_geister', 3, 9], ['fz_wildwasser', 13, 4],
    ['fz_zuckerwatte', 6, 4], ['fz_eis', 10, 10], ['fz_ballon', 6, 10], ['fz_zuckerwatte', 14, 8]]) B(b, x, y, r || 0);
  for (let y = 9; y <= 11; y++) if (!game(`COVER.has('${X + 8},${Y + y}')`)) B('weg', 8, y);
  for (let x = 9; x <= 15; x++) if (!game(`COVER.has('${X + x},${Y + 11}')`)) B('weg', x, 11);
  // Freie Fläche rechts zum Selberbauen (11×13)
  for (let y = 1; y <= 13; y++) for (let x = 18; x <= 28; x++) B('fzboden', x, y);
  // Ritterburg mit Wassergraben, Mauer und Garten (Block 60i) oben in der freien Fläche
  B('fz_schloss', 20, 3, 1);
  expect(game(`castleChange(${X + 20}, ${Y + 3}, { ...CS_TPL.ritter.cs, mo: 1, mw: 1, gn: 1, wp: 3 })`)).toBe(`${X + 19},${Y + 2}`);
  game(`Object.assign(state.tiles.get('${X + 19},${Y + 2}'), { wall: 10, roof: 0, win: 6 })`);
  // Wunder-Schloss (Block 60j): eins fertig, eins als Baustelle (Abschnitt 3) – auf freiem Gras nahe beim Park
  const spots = game(`(() => { const out = [], free = (x0, y0) => { for (let y = y0 - 1; y < y0 + 8; y++) for (let x = x0 - 1; x < x0 + 8; x++) { const k = x + ',' + y; if (!ownedTile(x, y) || isSea(x, y) || terrainAt(x, y) === 'water' || COVER.has(k) || state.terra.get(k) === 'fz') return false; } return true; };
    for (let r = 0; r < 60 && out.length < 2; r++) for (let y = ${Y} - r; y <= ${Y} + r && out.length < 2; y++) for (let x = ${X} - r; x <= ${X} + r && out.length < 2; x++)
      if (Math.max(Math.abs(x - ${X}), Math.abs(y - ${Y})) === r && free(x, y) && !out.some(([a, b]) => Math.abs(a - x) < 9 && Math.abs(b - y) < 9)) out.push([x, y]);
    return out; })()`);
  for (const [sx, sy] of spots) game(`for (let y = ${sy}; y < ${sy} + 7; y++) for (let x = ${sx}; x < ${sx} + 7; x++) { state.terra.set(x + ',' + y, 'grass'); state.decos.delete(x + ',' + y); }`);
  game(`state.tiles.set('${spots[0].join()}', { b: 'schloss', lvl: 1, phase: 6, rate: 1 }); state.tiles.set('${spots[1].join()}', { b: 'schloss', lvl: 1, phase: 3, rate: 1 })`);
  console.log('Wunder-Schloss', JSON.stringify(spots));
  // Eckpunkte (Block 65): Weg mit Kurve, Laterne – Bank – Laterne – Bank im Takt, Laterne genau im Bogen
  const lp = game(`(() => { for (let y = ${Y} - 30; y < ${Y} + 40; y++) for (let x = ${X} - 30; x < ${X} + 40; x++) { let ok = true;
    for (let j = 0; j < 6 && ok; j++) for (let i = 0; i < 8 && ok; i++) { const k = (x + i) + ',' + (y + j); if (!ownedTile(x + i, y + j) || terrainAt(x + i, y + j) !== 'grass' || COVER.has(k) || state.terra.get(k) || state.decos.get(k)) ok = false; }
    if (ok) return [x, y]; } })()`);
  game(`(() => { const [X, Y] = ${JSON.stringify(lp)}; state.design = new Set(DESIGN.map(d => d.id));
    for (let x = X; x < X + 6; x++) state.tiles.set(x + ',' + (Y + 1), { b: 'weg', lvl: 1, style: 'platten' });
    for (let y = Y + 2; y < Y + 6; y++) state.tiles.set((X + 5) + ',' + y, { b: 'weg', lvl: 1, style: 'platten' });
    const put = (x, y, slot, b, rot = 0) => { const k = x + ',' + y; if (!state.decos.has(k)) state.decos.set(k, newSlots()); state.decos.get(k)[slot] = { b, rot }; };
    for (let x = X + 1; x <= X + 4; x++) put(x, Y + 1, 7, 'bank', midRot(7));
    for (let x = X + 1; x <= X + 5; x++) put(x, Y + 2, 8, 'laterne');
    rebuildCover(); recalc(); put(X + 5, Y + 1, curveSlot(X + 5, Y + 1).slot, 'laterne');   // mittig an der Außenkurve (Block 65b)
    recalc(); })()`);
  console.log('Laternen-Strecke', JSON.stringify(lp));
  // Schlossreihe (Block 74): Mitte Block/Turmgruppe, eckig/rund, Mittelbau-Dach Spitz/Kuppel/Zinnen, dazu die Vorlagen
  const sr = [34, -12];                                                                   // aufgeschüttetes Land östlich der Insel
  game(`for (let y = ${sr[1] - 1}; y < ${sr[1] + 32}; y++) for (let x = ${sr[0] - 1}; x < ${sr[0] + 20}; x++) { claimTile(x, y); state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }`);
  game('waterChanged(); sandCache.clear(); landCache.clear(); rebuildCover()');
  const tw = f => [{ h: 3, k: 1, p: 0, r: 0, f }, { h: 4, k: 0, p: 2, r: 0, f }];
  const variants = [
    { mt: 0, mf: 0, m: 3, cr: 0, tw: tw(0) }, { mt: 0, mf: 0, m: 3, cr: 1, tw: tw(0) }, { mt: 0, mf: 0, m: 3, cr: 2, tw: tw(0) }, { mt: 0, mf: 1, m: 3, cr: 1, mr: 1, tw: tw(1) },
    { ...CS_TPL_JS('maerchen'), bk: 1, wp: 1 }, { mt: 1, mf: 1, m: 4, cr: 1, mr: 1, cb: 2, tw: tw(1) }, { mt: 1, mf: 0, m: 3, cr: 2, mr: 2, cb: 1, tw: tw(0) },
    CS_TPL_JS('eis'), CS_TPL_JS('orient'), CS_TPL_JS('burg')];
  function CS_TPL_JS(id) { return game(`CS_TPL.${id}.cs`); }
  variants.forEach((v, i) => {
    const x = sr[0] + 1 + Math.floor(i / 5) * 9, y = sr[1] + 1 + (i % 5) * 6;   // gedreht: 7 breit in x, Portal nach vorn
    game(`for (let yy = ${y}; yy < ${y} + 2; yy++) for (let xx = ${x}; xx < ${x} + 7; xx++) state.terra.set(xx + ',' + yy, 'fz')`);
    game(`(() => { const cs = csOf({ cs: { w: 7, d: 2, gd: 1, gb: ${i % 3}, ...${JSON.stringify(v)} } }); state.tiles.set('${x},${y}', { b: 'fz_schloss', lvl: 1, rot: 1, cs, price: castlePrice(cs), roof: 1, wall: ${v.mt ? 1 : 'undefined'} }); })()`);
  });
  game('rebuildCover(); recalc()');
  console.log('Schlossreihe', JSON.stringify(sr));
  // Wegformen (Block 77): breite Allee mit Laternen am Rand, schmaler Weg trifft sie, Weg bis ans Haus, eckige/runde Kurven
  game(`(() => { const X = 36, Y = 24;
    for (let y = Y - 1; y < Y + 14; y++) for (let x = X - 1; x < X + 13; x++) { claimTile(x, y); state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }
    waterChanged(); sandCache.clear(); landCache.clear();
    const W = (x, y, o = {}) => state.tiles.set((X + x) + ',' + (Y + y), { b: 'weg', lvl: 1, style: 'platten', ...o });
    const put = (x, y, slot, b) => { const k = (X + x) + ',' + (Y + y); if (!state.decos.has(k)) state.decos.set(k, newSlots()); state.decos.get(k)[slot] = { b, rot: 0 }; };
    for (let x = 1; x <= 6; x++) { W(x, 1, { wide: true }); W(x, 2, { wide: true }); }
    for (let x = 1; x <= 6; x += 2) { put(x, 1, 0, 'laterne'); put(x, 2, 3, 'laterne'); }
    W(7, 1); W(8, 1); W(8, 2); W(8, 3);
    W(1, 4); W(1, 5); W(1, 6); state.tiles.set((X + 1) + ',' + (Y + 7), { b: 'haus', lvl: 2, rot: 0 });
    W(3, 4, { sq: true }); W(4, 4, { sq: true }); W(3, 5, { sq: true }); W(3, 6, { sq: true, end: 'rand' });
    for (const [x0, sq] of [[6, false], [9, true]]) for (const [x, y] of [[0, 0], [1, 0], [0, 1], [0, 2]]) W(x0 + x, 4 + y, { style: 'asphalt', ...(sq ? { sq: true } : {}) });
    // Block 78: Häuser am Weg – oben mit der Tür zum Weg (Gartenweg), unten mit der Tür nach hinten; davor füllt der Weg bis an die Wand
    for (let x = 1; x <= 10; x++) W(x, 11, { style: 'sand' });
    [[2, 1], [4, 1], [6, 0], [8, 1]].forEach(([x, r], i) => state.tiles.set((X + x) + ',' + (Y + 10), { b: i === 3 ? 'baecker' : 'haus', lvl: 1 + i % 3, rot: r }));
    [[3, 3], [5, 3], [7, 3]].forEach(([x, r], i) => state.tiles.set((X + x) + ',' + (Y + 12), { b: 'haus', lvl: 1 + i, rot: r }));
    nameHouses();
    state.tiles.set((X + 10) + ',' + (Y + 7), { b: 'leuchtturm', lvl: 1, rot: 0 });                       // Leuchtturm-Kap am Meer (Block 83)
    rebuildCover(); recalc(); })()`);
  // Hauptbahnhöfe (Block 85): alle drei Designs in verschiedenen Drehungen und Gleiszahlen, einer mit Weg zum Portal
  const hb = [36, 40];                                                           // südöstlich vor der Insel (wie die Wegformen)
  game(`(() => { const [X, Y] = ${JSON.stringify(hb)};
    for (let y = Y - 1; y < Y + 19; y++) for (let x = X - 1; x < X + 26; x++) { claimTile(x, y); state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }
    waterChanged(); sandCache.clear(); landCache.clear();
    const H = (x, y, rot, look, gleise) => state.tiles.set((X + x) + ',' + (Y + y), { b: 'hbf', lvl: 1, rot, look, gleise });
    H(1, 1, 2, 'glas', 3); H(14, 1, 3, 'backstein', 4); H(1, 12, 0, 'land', 2); H(14, 12, 1, 'glas', 5);
    rebuildCover();
    const t = state.tiles.get((X + 1) + ',' + (Y + 1)), [ex, ey] = hbfEntrance(t, X + 1, Y + 1)[0];
    for (let i = 0; i < 4; i++) state.tiles.set((ex + i) + ',' + ey, { b: 'weg', lvl: 1, style: 'platten' });
    for (let j = 1; j <= 3; j++) state.tiles.set((ex + 3) + ',' + (ey + j), { b: 'weg', lvl: 1, style: 'platten' });
    state.tiles.set((ex + 4) + ',' + (ey + 2), { b: 'haus', lvl: 3, rot: 2 }); nameHouses();
    rebuildCover(); recalc(); })()`);
  console.log('Hauptbahnhöfe', JSON.stringify(hb));
  // Wegbrücken (Block 66): Fluss mit Holzsteg, Steinbogen, Ziegelbrücke und roter Bogenbrücke; kurze Brücke ins Meer
  const rv = game(`(() => { for (let y = ${Y} - 70; y < ${Y} + 70; y++) for (let x = ${X} - 70; x < ${X} + 70; x++) { let ok = true;
    for (let j = 0; j < 10 && ok; j++) for (let i = 0; i < 11 && ok; i++) { const k = (x + i) + ',' + (y + j); if (!ownedTile(x + i, y + j) || isSea(x + i, y + j) || terrainAt(x + i, y + j) === 'water' || COVER.has(k) || state.terra.get(k) === 'fz' || state.decos.get(k)) ok = false; }
    if (ok) return [x, y]; } })()`);
  game(`(() => { const [X, Y] = ${JSON.stringify(rv)}; state.money = 1e12;
    for (let y = Y; y < Y + 10; y++) for (let x = X; x < X + 11; x++) state.terra.set(x + ',' + y, x >= X + 4 && x <= X + 6 ? 'water' : 'grass');
    waterChanged(); sandCache.clear(); landCache.clear(); rebuildCover(); recalc();
    const line = (style, y, kind) => { chosenStyle.weg = style; setTool('weg'); startPlan('line', { x: X + 1, y }, { x: X + 9, y }, false); planScan(plan); runPlan(); if (kind) for (let x = X + 4; x <= X + 6; x++) setBridgeKind(x, y, kind); };
    line('sand', Y + 1); line('asphalt', Y + 3); line('klinker', Y + 5); line('sand', Y + 7, 'rot');
    const c = (() => { for (let y = -60; y < 60; y++) for (let x = -60; x < 60; x++) if (ownedTile(x, y) && terrainAt(x, y) === 'grass' && !COVER.has(x + ',' + y) && !state.terra.get(x + ',' + y) && [1, 2, 3].every(i => isSea(x + i, y) && !ownedTile(x + i, y))) return [x, y]; })();
    if (c) { chosenStyle.weg = 'asphalt'; startPlan('line', { x: c[0], y: c[1] }, { x: c[0] + 3, y: c[1] }, false); planScan(plan); runPlan(); }
    setTool('look'); rebuildCover(); recalc(); })()`);
  console.log('Brücken', JSON.stringify(rv), game("[...state.tiles.values()].filter(t => t.bridge && t.b === 'weg').length"));
  game('rebuildCover(); recalc()');
  const st = game('computeFz().map(p => [p.tiles.length, p.rides, p.stage])'), coasters = game('COASTERS.length');
  const d = game('JSON.parse(JSON.stringify(serialize()))');
  d.cam = { x: game(`iso(${X + 14}, ${Y + 8}).x`), y: game(`iso(${X + 14}, ${Y + 8}).y`), z: 1.2 };
  fs.writeFileSync('testsave-freizeitpark.json', JSON.stringify(d));
  console.log('Bereich', JSON.stringify(area), 'Parks', JSON.stringify(st), 'Achterbahnen', coasters);
  expect(coasters).toBe(1);
  expect(st[0][2]).toBe(3);                                                      // Wunderland
});
