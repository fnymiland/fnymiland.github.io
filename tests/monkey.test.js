// Zufallstest: viele zufällige Spielzüge hintereinander – nichts darf abstürzen, nichts darf sich überlappen,
// und Speichern/Laden muss den Stand genau erhalten.
const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());

function check(label) {
  const problems = game(`(() => {
    const out = [], seen = new Map();
    for (const [k, t] of state.tiles) {
      if (!ITEMS[t.b]) { out.push('unbekannt ' + t.b); continue; }
      const [x, y] = keyXY(k);
      for (const [fx, fy] of footprint(t.b, x, y, t.rot)) {
        const kk = fx + ',' + fy;
        if (seen.has(kk)) out.push('Überlappung ' + kk + ' ' + seen.get(kk) + '/' + t.b);
        seen.set(kk, t.b);
      }
      if (BUILD_STAGES[t.b] && !(t.lvl >= 1 && t.lvl <= 3)) out.push('Stufe ' + t.b + ' ' + t.lvl);
      if (t.rot != null && !(t.rot >= 0 && t.rot <= 3)) out.push('Drehung ' + t.rot);
    }
    for (const [k, ds] of state.decos) if (seen.has(k) && (isBig(seen.get(k)) || BIG_ON_TILE.has(seen.get(k)))) out.push('Deko auf ' + seen.get(k));
    if (!Number.isFinite(state.money)) out.push('Geld ' + state.money);
    for (const r of Object.keys(RES)) if (!Number.isFinite(state.res[r]) || state.res[r] < -1e-6) out.push('Lager ' + r + ' ' + state.res[r]);
    return out;
  })()`);
  expect(problems, label).toEqual([]);
}

describe('Zufällige Spielzüge', () => {
  for (const seed of [1, 2, 3]) {
    it(`Durchlauf ${seed}`, () => {
      game('startNew(); closeModal(); state.tutorial = -1');
      game("for (let cy = -1; cy <= 1; cy++) for (let cx = -1; cx <= 1; cx++) state.owned.add(cx + ',' + cy)");
      game("state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 500");
      game("for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
      // meist Wiese, dazu Streifen mit Wald, Fels, Erz, Obst und Wasser; eine Reihe Villen für Einwohner
      game(`for (let y = -6; y <= 11; y++) for (let x = -6; x <= 11; x++) {
        const k = x + ',' + y;
        state.terra.set(k, x === -4 ? 'forest' : x === -2 ? 'rock' : y === -4 ? 'erz' : y === -2 ? 'obst' : x === 9 && y < 4 ? 'water' : 'grass');
      }`);
      game("for (let x = -6; x <= 11; x++) if (!COVER.has(x + ',11')) { rebuildCover(); state.tiles.set(x + ',11', { b: 'haus', lvl: 5 }); } recalc()");
      game(`window.__r = (() => { let s = ${seed} * 9973; return () => (s = (s * 16807) % 2147483647) / 2147483647; })()`);
      const R = 'window.__r()';
      const kinds = game("Object.keys(ITEMS).filter(b => ITEMS[b].cat && !['verschieben', 'abriss'].includes(b))");
      for (let i = 0; i < 2500; i++) {
        const x = Math.floor(game(R) * 17) - 6, y = Math.floor(game(R) * 16) - 6, what = game(R);
        const b = kinds[Math.floor(game(R) * kinds.length)];
        if (what < 0.45) {
          game(`buildRot = ${Math.floor(game(R) * 4)}; rotManual = ${game(R) < 0.3}`);
          if (game(`ITEMS['${b}'].small`)) game(`buildSmall('${b}', ${x}, ${y}, ${Math.floor(game(R) * 4)})`);
          else game(`build('${b}', ${x}, ${y}, true)`);
        } else if (what < 0.55) game(`demolish(${x}, ${y})`);
        else if (what < 0.65) {
          game(`setTool('verschieben'); pickUp(${x}, ${y}, 0)`);
          if (game('!!moving')) {
            if (game(R) < 0.5) game('rotateBuild()');
            game(`dropAt(${x + Math.floor(game(R) * 5) - 2}, ${y + Math.floor(game(R) * 5) - 2}, ${Math.floor(game(R) * 4)})`);
            if (game(R) < 0.3) game("setTool('look')");      // Abbruch legt es zurück
          }
          game("setTool('look')");
        } else if (what < 0.75) {
          const a = game(`anchorAt(${x}, ${y})`);
          if (a) { game(`stageUpgrade(${a.replace(',', ', ')})`); game(`houseUpgrade(${a.replace(',', ', ')})`); }
        } else if (what < 0.8) {
          const a = game(`anchorAt(${x}, ${y})`);
          if (a) game(`openInfo(${a.replace(',', ', ')}); if ($('p-rot')) $('p-rot').click(); closePanel()`);
        } else if (what < 0.85) {
          game('produce(30); recalc()');
        } else if (what < 0.9) {
          // Speichern mitten im Tragen und wieder laden
          if (game(R) < 0.5) { game(`setTool('verschieben'); pickUp(${x}, ${y}, 0)`); }
          const before = game('JSON.stringify(serialize().tiles.slice().sort())');
          game('setTool("look"); state = parseSave(JSON.parse(JSON.stringify(serialize()))); recalc()');
          expect(game('JSON.stringify(serialize().tiles.slice().sort())')).toBe(before);
        } else {
          game('render(performance.now())');
        }
        if (i % 50 === 0) check(`Schritt ${i}`);
      }
      check('Ende');
      game("setTool('look')");
      expect(game('state.tiles.size')).toBeGreaterThan(20);
    }, 120000);
  }
});
