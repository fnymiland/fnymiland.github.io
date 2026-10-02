// Erzeugt testsave-tiere.json (Testwelt ?welt=tiere: alle Bewohner-Arten und Natur-Tiere mit Namensschild).
// Nur auf Wunsch:  TESTWELT=1 npx vitest run tests/testwelt-tiere.test.js
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
beforeAll(() => loadGame());
it.skipIf(!process.env.TESTWELT)('erzeugt testsave-tiere.json', () => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true");
  game("state.town.name = 'Tierhausen'; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 5000; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const i of ISLES) state.islands.add(i.id)");
  // 22×18 eigenes Land auf der Insel (kein Meer), möglichst nah an der Küste
  const area = game(`(() => { let best = null, bd = 1e9; for (let y0 = -40; y0 < 40; y0++) for (let x0 = -40; x0 < 40; x0++) { let ok = true; for (let y = 0; y < 18 && ok; y++) for (let x = 0; x < 22 && ok; x++) if (!ownedTile(x0 + x, y0 + y) || isSea(x0 + x, y0 + y)) ok = false; if (!ok) continue; let d = 1e9; for (let y = -6; y < 24; y++) for (let x = -6; x < 28; x++) if (isSea(x0 + x, y0 + y) && terrainAt(x0 + x, y0 + y) === 'water') d = Math.min(d, Math.max(0, x - 21, -x) + Math.max(0, y - 17, -y)); if (d < bd) { bd = d; best = [x0, y0]; } } return best; })()`);
  const [X, Y] = area;
  game(`for (let y = ${Y}; y < ${Y} + 18; y++) for (let x = ${X}; x < ${X} + 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }`);
  game('recalc()');
  const P = (dx, dy) => [X + dx, Y + dy];
  game(`for (let y = 1; y <= 5; y++) for (let x = 1; x <= 6; x++) state.terra.set((${X} + x) + ',' + (${Y} + y), 'forest')`);
  game(`state.tiles.set('${P(3, 3)}', { b: 'holz', lvl: 1 })`);
  game(`for (let y = 1; y <= 4; y++) for (let x = 11; x <= 15; x++) state.terra.set((${X} + x) + ',' + (${Y} + y), 'water')`);
  for (const [dx, dy] of [[10, 2], [16, 3], [12, 5], [14, 0]]) game(`state.tiles.set('${P(dx, dy)}', { b: 'blumen', lvl: 1 })`);
  for (const [dx, dy] of [[10, 1], [16, 1], [11, 5], [15, 5], [13, 0], [10, 4]]) game(`buildSmall('blumentopf', ${P(dx, dy)[0]}, ${P(dx, dy)[1]}, 0)`);
  game(`state.tiles.set('${P(18, 2)}', { b: 'windrad', lvl: 2 })`);
  game(`for (let y = 8; y <= 11; y++) for (let x = 1; x <= 6; x++) state.terra.set((${X} + x) + ',' + (${Y} + y), 'park')`);
  for (const [dx, dy] of [[2, 9], [4, 9], [3, 10], [5, 11]]) game(`state.tiles.set('${P(dx, dy)}', { b: 'blumen', lvl: 1 })`);
  game(`state.tiles.set('${P(1, 11)}', { b: 'statue', lvl: 1 }); state.tiles.set('${P(6, 8)}', { b: 'pavillon', lvl: 1 })`);
  game(`state.tiles.set('${P(9, 8)}', { b: 'schmetterlingsgarten', lvl: 1 }); state.tiles.set('${P(11, 8)}', { b: 'vogelbaum', lvl: 1 }); state.tiles.set('${P(13, 8)}', { b: 'seerosenteich', lvl: 1 })`);
  game(`for (let x = 1; x <= 19; x++) state.tiles.set((${X} + x) + ',' + (${Y} + 15), { b: 'weg', lvl: 1 })`);
  const people = [];
  game('ANIMALS').forEach((a, i) => {
    const [hx, hy] = P(1 + i * 2, 14);
    game(`state.tiles.set('${hx},${hy}', { b: 'haus', lvl: ${1 + (i % 5)}, animal: '${a.id}', name: '${a.names[0]}', wall: ${i % 7}, roof: ${(i * 3) % 7} })`);
    people.push({ home: hx + ',' + hy, x: hx + 0.3, y: hy + 1.3, i });
  });
  game('recalc()');
  const sea = game(`(() => { let best = null, bd = 1e9; for (let y = -70; y < 90; y++) for (let x = -70; x < 90; x++) if (isSea(x, y) && terrainAt(x, y) === 'water' && nearOwnLand(x, y)) { const d = Math.hypot(x - ${X + 11}, y - ${Y + 9}); if (d < bd) { bd = d; best = [x, y]; } } return best; })()`);
  const nature = [
    ['eule', P(2, 2)], ['vogel', P(4, 1)], ['reh', P(6, 5)],
    ['fisch', P(12, 2)], ['goldfisch', P(14, 2)], ['frosch', P(11, 4)], ['eisvogel', P(15, 4)],
    ['schmetterling', P(2, 8)], ['regenbogenfalter', P(4, 10)], ['gluehwurm', P(2, 11)],
    ['robbe', sea], ['moewe', [sea[0], sea[1]]],
  ].map(([id, [x, y]]) => ({ id, x, y }));
  const d = game('JSON.parse(JSON.stringify(serialize()))');
  d.showcase = { nature, people, look: P(10, 8), sea };
  fs.writeFileSync('testsave-tiere.json', JSON.stringify(d));
  console.log('Bereich', JSON.stringify(area), 'Meer', JSON.stringify(sea), 'Abstand', Math.hypot(sea[0] - X - 11, sea[1] - Y - 9).toFixed(1));
});
