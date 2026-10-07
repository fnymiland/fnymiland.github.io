// Große Testwelt für die Leistung (Block 124): nur auf Wunsch – GEN=1 npx vitest run tests/grossstadt.test.js
// schreibt testsave-gross.json (im Browser: ?welt=gross)
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
beforeAll(() => {
  loadGame();
  global.GROSS_BASE = fs.readFileSync(path.join(ROOT, 'testsave-alles.json'), 'utf8');
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'tools', 'grossstadt.js'), 'utf8'));
});
it('Generator lädt', () => { expect(typeof game('makeGrossstadt')).toBe('function'); });
if (process.env.GEN) it('große Testwelt erzeugen', () => {
  const d = game('makeGrossstadt()');
  fs.writeFileSync(path.join(ROOT, 'testsave-gross.json'), JSON.stringify(d));
  console.log('Felder', d.tiles.length, 'Dekos', d.decos.length, 'Linien', (d.edges || []).length);
}, 600e3);
