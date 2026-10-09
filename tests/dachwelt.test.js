// Testwelt „dach“ für den Leistungs-Wächter (Block 138): GEN=1 npx vitest run tests/dachwelt.test.js schreibt testsave-dach.json
// (im Browser: ?welt=dach). Ohne GEN nur prüfen, dass der Erzeuger alles Gewollte baut.
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
beforeAll(() => {
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
  loadGame();
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'tools', 'dachwelt.js'), 'utf8'));
});
it('Erzeuger baut alle Dachformen, Ring mit Hof, alle Brüstungen, Deko oben, Dachtreppen in allen Drehungen (auch dreifach)', () => {
  const d = game('makeDachWelt()');
  const r = game(`(() => {
    const roofs = [...state.roofs.values()], stairs = [...state.tiles.values()].filter(t => t.b === 'dachtreppe');
    return {
      forms: [...new Set(roofs.map(r => r.form || 0))].sort(), pars: [...new Set(roofs.map(r => r.par || 0))].sort(),
      bels: roofs.filter(r => r.bel).length > 0, garden: roofs.some(r => (r.form || 0) === 3 && !r.bel),
      tops: [...roofTopAll()].length, stairRots: [...new Set(stairs.map(t => t.rot || 0))].sort(), stairs: stairs.length,
      pillars: [...state.decos.values()].flat().filter(o => o && o.b === 'stuetze').length, homes: [...state.tiles.values()].filter(t => t.b === 'haus').length,
    };
  })()`);
  expect(r.forms).toEqual([0, 1, 2, 3]);
  expect(r.pars).toEqual(expect.arrayContaining([1, 2, 3]));
  expect(r.bels && r.garden).toBe(true);
  expect(r.tops).toBeGreaterThanOrEqual(15);
  expect(r.stairRots).toEqual([0, 1, 2, 3]);
  expect(r.stairs).toBe(9);
  expect(r.pillars).toBeGreaterThan(20);
  expect(r.homes).toBe(10);
  if (process.env.GEN) fs.writeFileSync(path.join(ROOT, 'testsave-dach.json'), JSON.stringify(d));
}, 120e3);
