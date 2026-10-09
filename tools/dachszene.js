// Testszene Überdachungen (Block 138): vier Formen, je ein schmaler Gang mit T und Kurve, 2 breit und ein 3 × 3-Platz, mit Stützen.
// Im Browser (?probe): fetch('tools/dachszene.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachSzene() {
  for (let y = -14; y <= 16; y++) for (let x = -18; x <= 16; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.edges.clear(); state.roofs.clear();
  state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const LAYOUT = [];
  for (let x = 0; x <= 3; x++) LAYOUT.push([x, 0]);
  LAYOUT.push([1, -1], [3, 1], [3, 2]);
  for (let x = 2; x <= 6; x++) for (let y = 3; y <= 4; y++) LAYOUT.push([x, y]);
  for (let x = 5; x <= 6; x++) for (let y = 5; y <= 6; y++) LAYOUT.push([x, y]);
  for (let x = -3; x <= -1; x++) for (let y = 3; y <= 5; y++) LAYOUT.push([x, y]);
  LAYOUT.push([0, 4], [1, 4]);
  const offs = [[-12, -10], [4, -10], [-12, 4], [4, 4]];
  window.__dach = offs.map(([ox, oy], form) => {
    chosenStyle.weg = 'm:platten:sand';
    for (const [x, y] of LAYOUT) build('weg', ox + x, oy + y, true);
    state.paintNew.dach = { form, col: form === 2 ? 1 : 0 };
    for (const [x, y] of LAYOUT) build('dach', ox + x, oy + y, true);
    // Stützen: Ecken und Seitenmitten am schmalen Gang, Ecken der breiten Teile
    const put = (x, y, slot) => buildSmall('stuetze', ox + x, oy + y, slot, true);
    for (const [x, y, s] of [[0, 0, 0], [0, 0, 2], [0, 0, 5], [1, 0, 7], [2, 0, 5], [2, 0, 7], [3, 0, 1], [3, 0, 3], [1, -1, 0], [1, -1, 1], [3, 1, 4], [3, 1, 6],
      [2, 3, 0], [6, 3, 1], [2, 4, 2], [4, 4, 7], [6, 6, 3], [5, 6, 2], [6, 5, 6], [-3, 3, 0], [-1, 3, 1], [-3, 5, 2], [-1, 5, 3], [-2, 5, 7], [-2, 3, 5]]) put(x, y, s);
    return { ox, oy, form };
  });
  state.paintNew.dach = {};
  recalc(); groundVersion++;
  return window.__dach.length;
})();
