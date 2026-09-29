// Testszene: Linie Heimatinsel ↔ Waldinsel über eine Brücke, mit 2 Windrädern (?probe, per fetch + eval)
(function linienSzene() {
  state.owned = new Set(isleChunks('home')); state.claimed = new Set();
  state.islands.add('wald'); ownIsland('wald');
  state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 99999;
  state.techs.add('bahn'); state.restore.erzberg = 1; state.restore.klippe = 3;
  const Y = 20;
  const clear = (x, y) => { const k = x + ',' + y; if (!ownedTile(x, y)) return; if (terrainAt(x, y) !== 'water') state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); };
  for (let y = Y - 3; y <= Y + 2; y++) for (let x = 10; x <= 46; x++) clear(x, y);
  for (const [x, y] of [[12, 17], [13, 17], [12, 18]]) state.terra.set(x + ',' + y, 'grass');
  recalc();
  const out = [];
  for (let x = 12; x <= 45; x++) out.push(build('schiene', x, Y, true) ? 1 : 0);
  rotManual = false;
  const a = build('station', 14, Y - 1, true), b = build('station', 42, Y - 1, true);
  build('windrad', 12, Y - 3, true); build('windrad', 13, Y - 3, true);
  build('haus', 16, Y - 2, true); build('haus', 40, Y - 2, true);
  recalc();
  const c = iso(18, Y); cam.x = c.x; cam.y = c.y; cam.z = 1.5;
  return { rails: out.join(''), a, b, lines: T.rail.lines.length, powered: T.rail.lines[0] && T.rail.lines[0].powered, pop: T.pop };
})();
