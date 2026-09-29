// Testszene für kleine Dekos (im Browser mit ?probe laden und per fetch + eval ausführen)
(function dekoSzene() {
  const X0 = -6, Y0 = -6;
  for (let y = Y0; y < Y0 + 8; y++) for (let x = X0; x < X0 + 10; x++) {
    state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  const D = (x, y, list) => state.decos.set((X0 + x) + ',' + (Y0 + y), list.map(b => b && { b, rot: 0 }));
  D(1, 1, ['baum', 'blumentopf', 'busch', 'bank']);           // gemischtes Feld
  D(3, 1, ['baum', 'baum', 'baum', 'baum']);                  // Wäldchen
  D(5, 1, ['baum', null, null, 'bank']);                      // Baum mit Bank davor
  state.tiles.set((X0 + 1) + ',' + (Y0 + 4), { b: 'haus', lvl: 2 });
  D(1, 4, ['baum', null, null, 'blumentopf']);                // Baum hinter dem Haus, Topf davor
  D(2, 4, ['busch', 'baum', null, 'laterne']);
  for (let x = 0; x < 8; x++) state.tiles.set((X0 + x) + ',' + (Y0 + 6), { b: 'weg', lvl: 1, style: 'kies' });
  for (let x = 0; x < 8; x += 2) D(x, 6, ['baum', null, null, null]);   // Allee am Weg
  for (let x = 0; x < 8; x += 2) D(x, 5, [null, null, 'baum', null]);
  recalc();
  const c = iso(X0 + 3, Y0 + 3.5); cam.x = c.x; cam.y = c.y; cam.z = 2.4;
})();
