// Testwelt „muster“: GEN=1 npx vitest run tests/musterwelt.test.js schreibt testsave-muster.json (im Browser: ?welt=muster).
// Ohne GEN nur prüfen, dass jedes Wegmuster als breiter Weg liegt.
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
beforeAll(() => {
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
  loadGame();
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'tools', 'musterwelt.js'), 'utf8'));
});
it('jedes Wegmuster liegt als breiter Weg (3 × 18)', () => {
  const d = game('makeMusterWelt()');
  const n = game("(() => { const c = new Map(); for (const t of state.tiles.values()) if (t.b === 'weg') c.set(t.style, (c.get(t.style) || 0) + 1); return [c.size, Math.min(...c.values())]; })()");
  expect(n[0]).toBe(game('WEG_MUSTER.length'));
  expect(n[1]).toBe(54);
  expect(game("[...state.tiles.values()].filter(t => t.b === 'weg').every(t => styleDef('weg', t.style).id === t.style)")).toBe(true);   // alle Stile gültig
  if (process.env.GEN) fs.writeFileSync(path.join(ROOT, 'testsave-muster.json'), JSON.stringify(d));
}, 120e3);
