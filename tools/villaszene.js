// Testszene: Villa und Glasvilla in verschiedenen Farben und Drehungen (?probe, per fetch + eval)
(function villaSzene() {
  const X0 = 20, Y0 = 20;
  for (const k of ['3,3', '4,3', '3,4', '4,4']) state.owned.add(k);
  for (let y = Y0; y < Y0 + 6; y++) for (let x = X0; x < X0 + 8; x++) {
    state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y);
  }
  const at = (x, y) => (X0 + x) + ',' + (Y0 + y);
  state.tiles.set(at(1, 1), { b: 'haus', lvl: 5, name: 'Mo', rot: 0 });
  state.tiles.set(at(3, 1), { b: 'haus', lvl: 6, name: 'Lu', rot: 0, wall: 2, roof: 1 });
  state.tiles.set(at(5, 1), { b: 'haus', lvl: 6, name: 'Pip', rot: 1, wall: 5, roof: 3 });
  state.tiles.set(at(3, 3), { b: 'haus', lvl: 6, name: 'Kim', rot: 2, wall: 0, roof: 6 });
  state.tiles.set(at(5, 3), { b: 'haus', lvl: 6, name: 'Ari', rot: 3, wall: 4, roof: 2 });
  for (let x = 0; x < 8; x++) state.tiles.set(at(x, 2), { b: 'weg', lvl: 1, style: 'platten' });
  state.terra.set(at(7, 0), 'water'); state.terra.set(at(7, 1), 'water');
  recalc();
  const c = iso(X0 + 3.5, Y0 + 2); cam.x = c.x; cam.y = c.y - 12; cam.z = 3;
})();
