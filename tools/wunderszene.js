// Testszene: alle Wunderwerke fertig und eine Baustelle (?probe, per fetch + eval); gibt die Mitte zurück
(function wunderSzene() {
  const X0 = 16, Y0 = 14;
  for (const k of ['2,2', '3,2', '4,2', '2,3', '3,3', '4,3', '2,4', '3,4', '4,4']) state.owned.add(k);
  for (let y = Y0; y < Y0 + 14; y++) for (let x = X0; x < X0 + 16; x++) {
    state.terra.set(x + ',' + y, x >= X0 + 13 && y >= Y0 + 9 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  const P = (id, x, y, phase, rot = 0) => state.tiles.set((X0 + x) + ',' + (Y0 + y), { b: id, lvl: 1, rot, phase: phase == null ? WONDERS[id].phases.length : phase });
  P('riesenrad', 0, 0); P('sternwarte', 5, 0); P('botgarten', 9, 0);
  P('schloss', 0, 5); P('riesenrad', 6, 5, 2); P('sternwarte', 10, 5, 1);
  P('seebruecke', 12, 10, null, 0);
  recalc();
  return [X0 + 7, Y0 + 6];
})();
