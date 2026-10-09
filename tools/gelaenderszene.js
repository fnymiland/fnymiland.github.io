// Testszene: Geländer-Ecken (Nutzer: „die Ecken sollen abschließen und bündig sein“) – Ring mit Hof, vier Dachtreppen-Drehungen, Doppeltreppe
// Im Browser (?probe): fetch('tools/gelaenderszene.js').then(r => r.text()).then(t => (0, eval)(t))
(function gelaenderSzene() {
  for (let y = -16; y <= 14; y++) for (let x = -18; x <= 14; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const rect = (x0, y0, x1, y1, skip) => { state.paintNew.dach = { form: 3 }; setTool('dach'); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!skip || !skip(x, y)) { startPlan('line', { x, y }, { x, y }, true); runPlan(); } };
  rect(-16, -14, -12, -11, (x, y) => x >= -15 && x <= -14 && y >= -13 && y <= -12);   // Ring mit Hof
  const blocks = [[-8, -14, 0, [1, 1]], [-2, -14, 1, [1, 1]], [4, -14, 2, [1, 0]], [-16, -6, 3, [0, 1]]];
  for (const [ox, oy, rot, at] of blocks) { rect(ox, oy, ox + 2, oy + 2); rotManual = true; buildRot = rot; build('dachtreppe', ox + at[0], oy + at[1]); rotManual = false; }
  rect(-8, -6, -3, -3); rotManual = true; buildRot = 0; for (const x of [-7, -6]) build('dachtreppe', x, -5); rotManual = false;   // Doppeltreppe
  for (const r of state.roofs.values()) { r.par = 3; r.bel = 'm:verband:beige'; }
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return [...state.tiles.values()].filter(t => t.b === 'dachtreppe').length;
})();
