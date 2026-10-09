// Testszene: Steinarkaden-Ringe (offener Hof) mit Brüstung – Mauer, Balustrade, Geländer, Dachgarten mit Mauer (Block 138c)
// Im Browser (?probe): fetch('tools/dachbruestung.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachBruestung() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-14, -12], [-4, -12], [-14, -2], [-4, -2]], pars = [1, 2, 3, 1], bels = ['m:verband:beige', 'm:verband:beige', 'm:verband:beige', null];
  offs.forEach(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 };
    setTool('dach');
    for (let y = 0; y <= 3; y++) for (let x = 0; x <= 4; x++) if (!(x >= 1 && x <= 2 && y >= 1 && y <= 2)) { startPlan('line', { x: ox + x, y: oy + y }, { x: ox + x, y: oy + y }, true); runPlan(); }
    for (const [k, r] of state.roofs) { const [x, y] = keyXY(k); if (x >= ox && x <= ox + 4 && y >= oy && y <= oy + 3) { r.par = pars[i]; if (bels[i]) r.bel = bels[i]; } }
    buildRoofTop('bank', ox + 1, oy, 6); buildRoofTop('laterne', ox + 4, oy + 3, 3); buildRoofTop('baum', ox, oy + 1, 0);
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return 'ok';
})();
