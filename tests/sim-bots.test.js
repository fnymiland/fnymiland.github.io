// Bot-Simulation (Block 62): nur auf Wunsch – SIM=1 npx vitest run tests/sim-bots.test.js
// Ergebnis: /private/tmp/claude-501/sim-<strategie>.json
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path'), vm = require('vm');
beforeAll(() => { loadGame(); vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'tools', 'sim-bots.js'), 'utf8')); });
for (const strat of (process.env.SIM || '').split(',').filter(Boolean)) {
  it(`Simulation ${strat}`, () => {
    const t0 = Date.now(), r = game(`simRun('${strat}', { hours: ${+(process.env.SIM_H || 20)}, debug: ${!!process.env.SIM_DBG} })`);
    r.wall = (Date.now() - t0) / 1000;
    fs.writeFileSync(`/private/tmp/claude-501/sim-${strat}.json`, JSON.stringify(r, null, 1));
    console.log(strat, JSON.stringify(r.end), 'Sekunden', r.wall);
  }, 3600e3);
}
it('Simulator lädt', () => { expect(typeof game('simRun')).toBe('function'); });
