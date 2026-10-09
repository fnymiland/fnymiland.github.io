// Testszene: Dreifachtreppen in allen vier Drehungen (Block 138d) – Dachgarten mit Geländer, Belag mit Balustrade
// Im Browser (?probe): fetch('tools/breitdrehung.js').then(r => r.text()).then(t => (0, eval)(t))
(function breitDrehung() {
  for (let y = -18; y <= 14; y++) for (let x = -18; x <= 14; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const blocks = [[-16, -16, 0], [-8, -16, 1], [0, -16, 2], [-16, -8, 3]];
  for (const [ox, oy, rot] of blocks) {
    state.paintNew.dach = { form: 3 }; setTool('dach'); startPlan('rect', { x: ox, y: oy }, { x: ox + 5, y: oy + 5 }, true); runPlan();
    rotManual = true; buildRot = rot;
    for (let i = 0; i < 3; i++) { const [x, y] = rot & 1 ? [ox + 2, oy + 1 + i] : [ox + 1 + i, oy + 2]; build('dachtreppe', x, y); }
    rotManual = false;
  }
  for (const [k, r] of state.roofs) { const [x] = keyXY(k); r.par = x < -9 ? 3 : 2; if (x >= -9) r.bel = 'm:verband:beige'; }
  for (const [x, y] of [[-17, -17], [-17, -15]]) state.tiles.set(x + ',' + y, { b: 'haus', lvl: 3 });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  return [...state.tiles.values()].filter(t => t.b === 'dachtreppe').length;
})();
