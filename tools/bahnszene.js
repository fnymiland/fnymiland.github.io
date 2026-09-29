// Testszene: Schienen, Brücken, (später) Bahnhöfe und Zug (?probe, per fetch + eval)
(function bahnSzene() {
  state.owned = new Set(isleChunks('home')); state.claimed = new Set();
  state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 9999;
  state.techs.add('bahn'); state.restore.erzberg = 1;
  const X0 = 20, Y0 = -2;
  for (let y = Y0; y < Y0 + 10; y++) for (let x = X0; x < X0 + 8; x++) {
    if (!ownedTile(x, y)) continue;
    state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  recalc();
  const R = (x, y) => build('schiene', X0 + x, Y0 + y, true);
  for (let x = 0; x < 5; x++) R(x, 1);           // gerade
  R(4, 2); R(4, 3);                               // Kurve
  for (let y = 3; y < 8; y++) R(1, y);            // T bei (1,1)? nein: Abzweig
  R(1, 2); R(0, 5); R(2, 5);                      // Kreuzung bei (1,5)
  state.terra.set((X0 + 4) + ',' + (Y0 + 5), 'water'); state.terra.set((X0 + 4) + ',' + (Y0 + 6), 'water'); recalc();
  R(4, 4); R(4, 5); R(4, 6); R(4, 7);             // Brücke über den Teich
  // hinaus ins Meer: von der rechten Kante der Strecke weiter nach +x
  let x = 5, y = 1;
  while (x < 30 && build('schiene', X0 + x, Y0 + y, true)) x++;
  recalc();
  const c = iso(X0 + 4, Y0 + 3); cam.x = c.x; cam.y = c.y; cam.z = 2.4;
  return x;
})();
