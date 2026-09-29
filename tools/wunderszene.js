// Testszene: alle Wunderwerke fertig und Baustellen (?probe, per fetch + eval); gibt die Mitte zurück
(function wunderSzene() {
  const X0 = 16, Y0 = 12;
  for (let cy = 1; cy <= 5; cy++) for (let cx = 1; cx <= 6; cx++) state.owned.add(cx + ',' + cy);
  for (let y = Y0; y < Y0 + 20; y++) for (let x = X0; x < X0 + 22; x++) {
    state.terra.set(x + ',' + y, x >= X0 + 18 && y >= Y0 + 14 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  const P = (id, x, y, phase, rot = 0) => state.tiles.set((X0 + x) + ',' + (Y0 + y), { b: id, lvl: 1, rot, phase: phase == null ? WONDERS[id].phases.length : phase });
  P('riesenrad', 0, 0); P('sternwarte', 6, 0); P('botgarten', 10, 0);
  P('schloss', 0, 7); P('riesenrad', 8, 7, 2); P('sternwarte', 14, 7, 1);
  P('botgarten', 8, 13, 2); P('schloss', 0, 14, 3); P('seebruecke', 17, 15, null, 0);
  recalc();
  return [X0 + 9, Y0 + 8];
})();
