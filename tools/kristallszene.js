// Testszene: Kristall- und Glas-Dekos (im Browser mit ?probe laden, per fetch + eval ausführen)
(function kristallSzene() {
  const X0 = 20, Y0 = 20;
  for (let y = Y0; y < Y0 + 7; y++) for (let x = X0; x < X0 + 8; x++) {
    state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  const at = (x, y) => (X0 + x) + ',' + (Y0 + y);
  const D = (x, y, list) => state.decos.set(at(x, y), list.map(b => b && { b, rot: 0 }));
  D(1, 1, ['kristallaterne', 'glaskugel', 'kristall', 'kristallaterne']);
  D(2, 1, ['baum', 'kristallaterne', 'glaskugel', 'bank']);
  state.tiles.set(at(4, 1), { b: 'kristallbrunnen', lvl: 1 });
  state.tiles.set(at(2, 4), { b: 'glashaus', lvl: 1, rot: 0 });
  state.tiles.set(at(5, 4), { b: 'glashaus', lvl: 1, rot: 1 });
  for (let x = 0; x < 8; x++) state.tiles.set(at(x, 3), { b: 'weg', lvl: 1, style: 'kristall' });
  recalc();
  const c = iso(X0 + 3.5, Y0 + 3); cam.x = c.x; cam.y = c.y - 10; cam.z = 2.6;
})();
