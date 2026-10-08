// Testwelt „neu“ für den Leistungs-Wächter (Block 149b): GEN=1 npx vitest run tests/neuwelt.test.js schreibt testsave-neu.json
// (im Browser: ?welt=neu). Ohne GEN nur prüfen, dass der Erzeuger alles Gewollte baut.
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
beforeAll(() => {
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';          // Vorschaubilder der Bauleiste: jsdom kann sie nicht malen
  loadGame();
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'tools', 'neuwelt.js'), 'utf8'));
});
it('Erzeuger baut Brücken, Parkbahn mit 3 Zügen, alle Laternenformen, neue Bänke, Hecke, Fußgängerbrücke', () => {
  const d = game('makeNeuWelt()');
  const r = game(`(() => {
    const tiles = [...state.tiles.values()], decos = [...state.decos.values()].flat().filter(Boolean);
    const arches = new Set(); for (const [k, t] of state.tiles) if (t.bridge) { const [x, y] = keyXY(k), A = bridgeArch(x, y); if (A) arches.add(A.N + (t.brk || '')); }
    return {
      bridges: tiles.filter(t => t.bridge).length, arches: [...arches].sort(),
      trains: PB_RINGS.length ? pbForms(PB_RINGS[0]) : [],
      lampForms: [...new Set(decos.filter(o => o.b === 'strassenlaterne').map(o => o.form || 0))].sort(),
      benchForms: [...new Set(decos.filter(o => o.b === 'bank').map(o => o.form || 0))].sort(),
      hedges: [...state.edges.values()].filter(e => e.b === 'hecke').length,
      foot: !!(state.tiles.get('29,14') || {}).foot,
    };
  })()`);
  expect(r.bridges).toBeGreaterThan(70);
  expect(r.arches).toEqual(expect.arrayContaining(['16', '9ziegel', '6holz', '3rot', '2', '12']));
  expect(r.trains).toEqual([0, 1, 2]);
  expect(r.lampForms).toEqual([0, 1, 2, 3, 4, 5]);
  expect(r.benchForms).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(r.hedges).toBe(28);
  expect(r.foot).toBe(true);
  if (process.env.GEN) fs.writeFileSync(path.join(ROOT, 'testsave-neu.json'), JSON.stringify(d));
}, 120e3);
