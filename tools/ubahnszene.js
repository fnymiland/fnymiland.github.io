// Testszene U-Bahn (Block 136): Bahnhof – Schiene – Portal – Tunnel unter Häusern mit U-Bahn-Station – Portal – Schiene – Bahnhof,
// dazu senkrechte Portale (Rampe, Naturstein). Im Browser (?probe): fetch('tools/ubahnszene.js').then(r => r.text()).then(eval)
(function ubahnSzene() {
  for (let y = -8; y <= 20; y++) for (let x = -8; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); }
  state.edges.clear(); state.tunnels.clear();
  state.restore.erzberg = 1; state.techs.add('bahn'); state.techs.add('ubahn');
  for (let x = -8; x <= 24; x++) for (let y = -8; y <= 20; y++) state.owned.add(Math.floor(x / 6) + ',' + Math.floor(y / 6));
  const put = (x, y, b, o = {}) => state.tiles.set(x + ',' + y, { b, lvl: 1, ...o });
  put(1, 4, 'station', { rot: 0, train: 'regio' });
  for (let x = 2; x <= 6; x++) put(x, 4, 'schiene');
  for (let x = 7; x <= 13; x++) state.tunnels.set(x + ',4', {});
  for (let x = 8; x <= 9; x++) put(x, 4, 'haus', { lvl: 2 });
  put(11, 4, 'ubahn', { rot: 1 });
  for (let x = 14; x <= 18; x++) put(x, 4, 'schiene');
  put(19, 4, 'station', { rot: 0 });
  for (let x = 7; x <= 13; x++) put(x, 5, 'weg', { style: 'platten' });
  // senkrecht: Rampe (Tunnel nach hinten, −y) und Naturstein (Tunnel nach vorn, +y)
  for (let y = 9; y <= 12; y++) put(3, y, 'schiene');
  for (let y = 6; y <= 8; y++) state.tunnels.set('3,' + y, { form: 1 });
  for (let y = 9; y <= 12; y++) put(16, y, 'schiene');
  for (let y = 13; y <= 15; y++) state.tunnels.set('16,' + y, { form: 3 });
  for (let i = 0; i < 12; i++) put(-6 + i, 18, 'windrad', { lvl: 3 });
  window.__raOrig = window.__raOrig || regionAt;
  regionAt = (x, y) => x > 10 ? 'wald' : 'home';
  recalc(); syncTrains();
  const c = iso(9, 6); cam.x = c.x; cam.y = c.y; cam.z = 1.5;
  return T.rail.lines.length;
})();
