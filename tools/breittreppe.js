// Testszene: Doppel- und Dreifach-Dachtreppen (Block 138d) – nebeneinander in gleicher Richtung werden sie eine breite Treppe
// Im Browser (?probe): fetch('tools/breittreppe.js').then(r => r.text()).then(t => (0, eval)(t))
(function breitTreppe() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-12, -10], [-4, -10]], pars = [1, 3];
  offs.forEach(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 }; setTool('dach');
    startPlan('rect', { x: ox, y: oy }, { x: ox + 4, y: oy + 3 }, true); runPlan();
    for (let y = oy; y <= oy + 3; y++) for (let x = ox; x <= ox + 4; x++) { const r = state.roofs.get(x + ',' + y); r.par = pars[i]; r.bel = 'm:verband:beige'; }
    rotManual = true; buildRot = 0;
    for (let x = ox + 1; x <= ox + (i ? 3 : 2); x++) build('dachtreppe', x, oy + 2);   // links doppelt, rechts dreifach
    rotManual = false;
  });
  for (const [x, y] of [[-15, -13], [-15, -11]]) state.tiles.set(x + ',' + y, { b: 'haus', lvl: 3 });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return [...state.tiles.values()].filter(t => t.b === 'dachtreppe').length;
})();
