// Testszene: Freitreppen an Steinarkaden (Block 138d) – Treppen an allen vier Seiten, jede Brüstung
// Im Browser (?probe): fetch('tools/aufgangszene.js').then(r => r.text()).then(t => (0, eval)(t))
(function aufgangSzene() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-12, -10], [-4, -10], [-12, -2], [-4, -2]], pars = [1, 2, 3, 0];
  offs.forEach(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 }; setTool('dach');
    startPlan('rect', { x: ox, y: oy }, { x: ox + 2, y: oy + 1 }, true); runPlan();
    for (let y = oy; y <= oy + 1; y++) for (let x = ox; x <= ox + 2; x++) { const r = state.roofs.get(x + ',' + y); r.bel = 'm:verband:beige'; if (pars[i]) r.par = pars[i]; else delete r.par; }
    for (const [x, y] of [[ox + 1, oy + 2], [ox + 3, oy], [ox + 2, oy - 1], [ox - 1, oy + 1]]) { rotManual = false; build('aufgang', x, y); }
    buildRoofTop('bank', ox, oy, 5); buildRoofTop('baum', ox + 2, oy + 1, 3);
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return 'ok';
})();
