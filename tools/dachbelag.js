// Testszene: Steinarkaden als Ring (3 × 4, offener Hof) – Dachgarten und drei Beläge (Wegmuster auf dem Dach)
// Im Browser (?probe): fetch('tools/dachbelag.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachBelag() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-14, -12], [-4, -12], [-14, -2], [-4, -2]], bels = [null, 'm:verband:beige', 'fisch', 'm:pflaster:anthrazit'];
  window.__ring = offs.map(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 };
    setTool('dach');
    for (let y = 0; y <= 3; y++) for (let x = 0; x <= 4; x++) if (!(x >= 1 && x <= 2 && y >= 1 && y <= 2)) { startPlan('line', { x: ox + x, y: oy + y }, { x: ox + x, y: oy + y }, true); runPlan(); }
    if (bels[i]) for (const [k, r] of state.roofs) { const [x, y] = keyXY(k); if (x >= ox && x <= ox + 4 && y >= oy && y <= oy + 3) r.bel = bels[i]; }
    return { ox, oy, bel: bels[i] };
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++;
  return 'ok';
})();
