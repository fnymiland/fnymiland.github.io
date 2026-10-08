'use strict';
// ---------------------------------------------------------------------------
// Testwelt „muster“ (Nutzer, 08.10.2026): für jedes Wegmuster ein breiter Weg (3 Felder breit, 18 lang) in seiner Grundfarbe,
// zum Ansehen weit weg am PC (?welt=muster). Reihenfolge wie in WEG_MUSTER, zwei Spalten.
// Erzeugt testsave-muster.json: GEN=1 npx vitest run tests/musterwelt.test.js
// ---------------------------------------------------------------------------
function makeMusterWelt() {
  startNew(); closeModal(); closePanel();
  QUIET = true;
  state.tutorial = -1; state.tipsOff = true;
  state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e6;
  for (const d of DESIGN) state.design.add(d.id);
  const ROWS = Math.ceil(WEG_MUSTER.length / 2), LEN = 18, X0 = 0, Y0 = 0;
  for (let y = Y0 - 2; y <= Y0 + ROWS * 5 + 1; y++) for (let x = X0 - 2; x <= X0 + 2 * (LEN + 4) + 1; x++) {
    const k = x + ',' + y;
    state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k);
  }
  state.edges.clear();
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
  const sty = M => M.fixed ? M.fixed : 'm:' + M.id + ':' + (M.farbe || 'sand');
  WEG_MUSTER.forEach((M, i) => {
    const col = Math.floor(i / ROWS), row = i % ROWS, x0 = X0 + col * (LEN + 4), y0 = Y0 + row * 5;
    for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + LEN; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: sty(M) });
  });
  rebuildCover(); recalc();
  QUIET = false;
  const out = serialize();
  out.cam = { x: 0, y: 0, z: 0.6 };
  return out;
}
