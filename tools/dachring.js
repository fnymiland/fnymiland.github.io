// Testszene: alle vier Dachformen als Ring (3 × 4, offener Hof), mit Auto-Eckstützen, Hof-Ecken-Stützen und einem inneren Pfosten
// Im Browser (?probe): fetch('tools/dachring.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachRing() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-14, -12], [-4, -12], [-14, -2], [-4, -2]];
  window.__ring = offs.map(([ox, oy], form) => {
    state.paintNew.dach = { form, col: form === 2 ? 1 : 0 };
    setTool('dach');
    for (let y = 0; y <= 3; y++) for (let x = 0; x <= 4; x++) if (!(x >= 1 && x <= 2 && y >= 1 && y <= 2)) { startPlan('line', { x: ox + x, y: oy + y }, { x: ox + x, y: oy + y }, true); runPlan(); }
    for (const s of [0, 1, 2, 3]) { buildSmall('stuetze', ox + 1, oy + 1, s); buildSmall('stuetze', ox + 2, oy + 2, s); }   // Hof-Ecken
    buildSmall('stuetze', ox + 4, oy + 2, VSLOT);                                                                       // innen (2 breit)
    return { ox, oy, form };
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++;
  return 'ok';
})();
