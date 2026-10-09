// Testszene: Treppe durch die Dachöffnung (Block 138d) – vier Richtungen, jede Brüstung, Dachgarten und Belag
// Im Browser (?probe): fetch('tools/dachtreppeszene.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachtreppeSzene() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-12, -10], [-4, -10], [-12, -2], [-4, -2]], pars = [1, 2, 3, 1], rots = [0, 1, 2, 3], bels = ['m:verband:beige', 'm:verband:beige', 'm:verband:beige', null];
  offs.forEach(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 }; setTool('dach');
    startPlan('rect', { x: ox, y: oy }, { x: ox + 2, y: oy + 2 }, true); runPlan();
    for (let y = oy; y <= oy + 2; y++) for (let x = ox; x <= ox + 2; x++) { const r = state.roofs.get(x + ',' + y); r.par = pars[i]; if (bels[i]) r.bel = bels[i]; }
    buildRot = rots[i]; rotManual = true; build('dachtreppe', ox + 1, oy + (rots[i] & 1 ? 1 : 0)); rotManual = false;
    buildRoofTop('bank', ox, oy, 5); buildRoofTop('baum', ox + 2, oy + 2, 3);
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return [...state.tiles.values()].filter(t => t.b === 'dachtreppe').length;
})();
