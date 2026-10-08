// Testszene U-Bahn (Block 136): Bahnhof – Schiene – Einfahrt (Rampe) – Tunnel unter Häusern mit U-Bahn-Station – Einfahrt (Rampe) –
// Schiene – Bahnhof, dazu senkrechte Einfahrten (Backstein nach hinten, Naturstein nach vorn).
// Im Browser (?probe): fetch('tools/ubahnszene.js').then(r => r.text()).then(eval)
(function ubahnSzene() {
  for (let y = -8; y <= 20; y++) for (let x = -8; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); }
  state.edges.clear(); state.tunnels.clear();
  state.restore.erzberg = 1; state.techs.add('bahn'); state.techs.add('ubahn');
  for (let x = -8; x <= 24; x++) for (let y = -8; y <= 20; y++) state.owned.add(Math.floor(x / 6) + ',' + Math.floor(y / 6));
  const put = (x, y, b, o = {}) => state.tiles.set(x + ',' + y, { b, lvl: 1, ...o });
  put(1, 4, 'station', { rot: 0, train: 'regio' });
  for (let x = 2; x <= 4; x++) put(x, 4, 'schiene');
  put(5, 4, 'tunneleinfahrt', { rot: 3 });                         // A 5, B 6, Tunnel ab 7
  for (let x = 7; x <= 13; x++) state.tunnels.set(x + ',4', {});
  for (let x = 8; x <= 9; x++) put(x, 4, 'haus', { lvl: 2 });
  put(11, 4, 'ubahn', { rot: 1 });
  put(14, 4, 'tunneleinfahrt', { rot: 1 });                        // B 14, A 15
  for (let x = 16; x <= 18; x++) put(x, 4, 'schiene');
  put(19, 4, 'station', { rot: 0 });
  for (let x = 7; x <= 13; x++) put(x, 5, 'weg', { style: 'platten' });
  // senkrecht: Backstein (Tunnel nach hinten, −y) und Naturstein (Tunnel nach vorn, +y)
  for (let y = 11; y <= 13; y++) put(3, y, 'schiene');
  put(3, 9, 'tunneleinfahrt', { rot: 2, form: 1 });                // B 3,9 – A 3,10
  for (let y = 6; y <= 8; y++) state.tunnels.set('3,' + y, {});
  for (let y = 9; y <= 11; y++) put(16, y, 'schiene');
  put(16, 12, 'tunneleinfahrt', { rot: 0, form: 2 });              // A 16,12 – B 16,13
  for (let y = 14; y <= 16; y++) state.tunnels.set('16,' + y, {});
  for (let i = 0; i < 12; i++) put(-6 + i, 18, 'windrad', { lvl: 3 });
  window.__raOrig = window.__raOrig || regionAt;
  regionAt = (x, y) => x > 10 ? 'wald' : 'home';
  recalc(); syncTrains();
  const c = iso(9, 6); cam.x = c.x; cam.y = c.y; cam.z = 1.5;
  return T.rail.lines.length;
})();
