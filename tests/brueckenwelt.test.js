// Testwelt „bruecken“ (160c A1): GEN=1 npx vitest run tests/brueckenwelt.test.js schreibt testsave-bruecken.json (Leistungs-Wächter, ?welt=bruecken)
// und die kleine, eingecheckte Vorlage tests/vorlagen/alte-bruecken.json (Umdeutungs-Tests). Ohne GEN nur prüfen, dass alles drin ist.
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
beforeAll(() => {
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
  loadGame();
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'tools', 'brueckenwelt.js'), 'utf8'));
});
it('Erzeuger baut alle alten Brückenarten roh (Wasser-Weg, Wasser-Gleis, Übergang, Anhöhe) – und alles lässt sich zeichnen', () => {
  const d = game('makeBrueckenWelt()');
  const r = game(`(() => {
    const T = [...state.tiles.entries()], wb = T.filter(([, t]) => isWegBridge(t)), rb = T.filter(([, t]) => t.b === 'schiene' && t.bridge);
    const kinds = [...new Set(wb.map(([, t]) => bridgeKind(t)))].sort();
    const curve = rb.some(([k]) => { const [x, y] = keyXY(k), a = railArms(x, y); return a.length === 2 && a[0][0] !== -a[1][0]; });
    const tee = rb.some(([k]) => railArms(...keyXY(k)).length === 3), cross4 = rb.some(([k]) => railArms(...keyXY(k)).length === 4);
    const feet = T.filter(([, t]) => t.cross).map(([, t]) => (t.foot ? 'F' : 'S') + ':' + (t.footPaid === true ? 'true' : t.footPaid || '-')).sort();
    const arches = wb.filter(([k]) => bridgeArch(...keyXY(k))).length, flat = wb.length - arches;
    const wide = wb.some(([k]) => { const [x, y] = keyXY(k); return isWegBridge(state.tiles.get(x + ',' + (y + 1))) && isWegBridge(state.tiles.get(x + ',' + (y + 2))) && isWegBridge(state.tiles.get(x + ',' + (y + 3))); });
    const ns = wb.some(([k]) => bridgeAxis(...keyXY(k), state.tiles.get(k)) === 1);
    const br = [...state.bruecken.values()];
    return { wb: wb.length, rb: rb.length, kinds, brk: [...new Set(wb.map(([, t]) => t.brk).filter(Boolean))].sort(), brc: wb.some(([, t]) => t.brc != null), brw: wb.some(([, t]) => t.brw != null),
      curve, tee, cross4, feet, arches, flat, wide, ns, bk: br.length, bkArt: [...new Set(br.map(b => b.art))].sort(), bkN: [...new Set(br.map(b => b.n))].sort(),
      bkWeg: br.filter(b => b.weg).length, bkGleis: br.filter(b => b.gleis).length, bkNS: br.some(b => b.ax === 1), lines: T.length && T.length };
  })()`);
  expect(r.kinds).toEqual(['holz', 'rot', 'stein', 'ziegel']);
  expect(r.brk).toEqual(['holz', 'rot', 'stein', 'ziegel']);
  expect([r.brc, r.brw, r.wide, r.ns]).toEqual([true, true, true, true]);
  expect(r.arches).toBeGreaterThan(30); expect(r.flat).toBeGreaterThanOrEqual(4);   // Bögen und flache (1 Feld, Steg)
  expect([r.curve, r.tee, r.cross4]).toEqual([true, true, true]);
  expect(r.rb).toBeGreaterThan(50);
  expect(r.feet).toEqual(['F:-', 'F:holz', 'F:kristall', 'F:stein', 'F:true', 'F:weg', 'S:-', 'S:stein']);
  expect([r.bk, r.bkArt, r.bkN, r.bkWeg, r.bkGleis, r.bkNS]).toEqual([13, ['holz', 'stahl'], [1, 2, 3, 4], 5, 4, true]);
  // alles zeichnen: nah, weit, Nacht
  expect(() => game(`(() => { const na = nightAt; try { for (const [z, n] of [[2, 0], [1, 0], [0.5, 0], [1.4, 1]]) { nightAt = () => n ? NIGHT_MAX : 0; cam.z = z;
    for (const [x, y] of [[10, 10], [30, 8], [22, 38], [16, 52], [55, 40], [58, 7]]) { const p = iso(x, y); cam.x = p.x; cam.y = p.y; render(1e6 + x * 31 + y); } } } finally { nightAt = na; } })()`)).not.toThrow();
  const vorlage = game('brueckenVorlage(serialize())');
  expect(vorlage.tiles.length).toBeGreaterThan(200);
  if (process.env.GEN) {
    fs.writeFileSync(path.join(ROOT, 'testsave-bruecken.json'), JSON.stringify(d));
    fs.writeFileSync(path.join(__dirname, 'vorlagen', 'alte-bruecken.json'), JSON.stringify(vorlage) + '\n');
  }
}, 120e3);
