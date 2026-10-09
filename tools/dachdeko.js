// Testszene: Deko auf dem Dach der Steinarkaden (Block 138b) – Dachgarten und Belag mit Bänken, Laternen, Bäumen, Blumen
// Im Browser (?probe): fetch('tools/dachdeko.js').then(r => r.text()).then(t => (0, eval)(t))
(function dachDeko() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const offs = [[-14, -12], [-4, -12]], bels = [null, 'm:verband:beige'];
  offs.forEach(([ox, oy], i) => {
    state.paintNew.dach = { form: 3 };
    setTool('dach');
    for (let y = 0; y <= 3; y++) for (let x = 0; x <= 4; x++) if (!(x >= 1 && x <= 2 && y >= 1 && y <= 2)) { startPlan('line', { x: ox + x, y: oy + y }, { x: ox + x, y: oy + y }, true); runPlan(); }
    if (bels[i]) for (const [k, r] of state.roofs) { const [x, y] = keyXY(k); if (x >= ox && x <= ox + 4 && y >= oy && y <= oy + 3) r.bel = bels[i]; }
    const put = (b, x, y, s) => buildRoofTop(b, ox + x, oy + y, s);
    put('bank', 1, 0, 6); put('bank', 3, 0, 6); put('laterne', 0, 0, 0); put('laterne', 4, 0, 1); put('laterne', 0, 3, 2); put('laterne', 4, 3, 3);
    put('baum', 0, 1, 0); put('baum', 0, 2, 3); put('blumentopf', 3, 1, 4); put('blumentopf', 3, 2, 4); put('busch', 4, 1, 3); put('busch', 4, 2, 1);
    put('bank', 1, 3, 5); put('bank', 2, 3, 5); put('blumentopf', 2, 0, 0);
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++;
  return 'ok';
})();
