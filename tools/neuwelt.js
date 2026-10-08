'use strict';
// ---------------------------------------------------------------------------
// Testwelt „neu“ für den Leistungs-Wächter (Block 149b): alles, was nach Block 149 dazukam, auf engem Raum –
// Bogenbrücken in allen Längen und Arten, eine breite Brücke, Parkeisenbahn mit drei Zügen, Straßenlaternen in allen Formen,
// die neuen Bänke an einem Platz mit bündiger Hecke, eine Fußgängerbrücke über ein Gleis. Immer gleich (kein Zufall beim Bauen).
// Erzeugt testsave-neu.json: GEN=1 npx vitest run tests/neuwelt.test.js
// ---------------------------------------------------------------------------
function makeNeuWelt() {
  startNew(); closeModal(); closePanel();
  QUIET = true;
  state.tutorial = -1; state.tipsOff = true;
  state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e6;
  for (const d of DESIGN) state.design.add(d.id);
  state.techs = new Set(TECHS.map(t => t.id));
  const X0 = 0, X1 = 30, Y0 = 0, Y1 = 28;
  for (let y = Y0 - 1; y <= Y1 + 1; y++) for (let x = X0 - 1; x <= X1 + 1; x++) {
    const k = x + ',' + y;
    state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k);
  }
  state.edges.clear();
  const water = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water'); };
  const row = (tool, a, b) => { setTool(tool); const info = planScan({ kind: 'line', tool, a, b }); for (const [, , run] of info.order) run(); return info.firstErr; };
  const kind = (y, x0, x1, brk) => { for (let x = x0; x <= x1; x++) { const t = state.tiles.get(x + ',' + y); if (t && t.bridge) t.brk = brk; } };
  // 1) Brücken: breit (3 Reihen × 16, Stein), dann 9 Ziegel + 6 Holz, dann 3 Rot + 2 Stein + 12 Stein
  water(4, 19, 1, 5); water(4, 12, 8, 10); water(15, 20, 8, 10); water(4, 6, 13, 15); water(9, 10, 13, 15); water(13, 24, 13, 15);
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc();
  chosenStyle.weg = 'kopf';
  for (const y of [2, 3, 4]) row('weg', { x: 1, y }, { x: 22, y });
  chosenStyle.weg = 'klinker'; row('weg', { x: 1, y: 9 }, { x: 23, y: 9 });
  chosenStyle.weg = 'sand'; row('weg', { x: 1, y: 14 }, { x: 28, y: 14 });
  kind(9, 4, 12, 'ziegel'); kind(9, 15, 20, 'holz'); kind(14, 4, 6, 'rot');
  // 2) Parkeisenbahn: Rundkurs auf Parkrasen, drei Stationen, drei Züge
  for (let y = 17; y <= 27; y++) for (let x = 1; x <= 14; x++) state.terra.set(x + ',' + y, 'park');
  row('pb_gleis', { x: 3, y: 18 }, { x: 13, y: 18 }); row('pb_gleis', { x: 13, y: 18 }, { x: 13, y: 25 });
  row('pb_gleis', { x: 13, y: 25 }, { x: 3, y: 25 }); row('pb_gleis', { x: 3, y: 25 }, { x: 3, y: 18 });
  setTool('pb_station'); build('pb_station', 7, 25); build('pb_station', 13, 21); build('pb_station', 6, 18);
  recalc();
  if (PB_RINGS[0]) pbWrite(PB_RINGS[0], [0, 1, 2]);
  // 3) Straßenlaternen: alle Formen beidseits einer Straße (y = 14) und einer Querstraße (x = 17)
  chosenStyle.weg = 'platten'; row('weg', { x: 17, y: 15 }, { x: 17, y: 28 });
  rotManual = false;
  const lamp = (x, y, slot, form, col) => { state.paintNew.strassenlaterne = { form, col }; buildSmall('strassenlaterne', x, y, slot); };
  for (let i = 0; i < 6; i++) { lamp(1 + i * 2, 14, 5, i, i); lamp(2 + i * 2, 14, 7, i, (i + 3) % 8); }
  for (let i = 0; i < 6; i++) { lamp(17, 16 + i * 2, 4, i, 1); lamp(17, 17 + i * 2, 6, 5 - i, 0); }
  // 4) Platz mit den neuen Bänken, rundum bündige Hecke
  chosenStyle.weg = 'klinker';
  for (let y = 18; y <= 24; y++) row('weg', { x: 20, y }, { x: 26, y });
  for (let i = 0; i < 7; i++) { state.paintNew.bank = { form: i, col: i }; buildSmall('bank', 21 + (i % 3) * 2, 19 + Math.floor(i / 3) * 2, 4 + (i % 4)); }
  setTool('hecke');
  for (let x = 20; x <= 26; x++) { buildEdge('hecke', edgeBetween(x, 17, x, 18)); buildEdge('hecke', edgeBetween(x, 24, x, 25)); }
  for (let y = 18; y <= 24; y++) { buildEdge('hecke', edgeBetween(19, y, 20, y)); buildEdge('hecke', edgeBetween(26, y, 27, y)); }
  // 5) Gleis quer über die Straße, dort eine Fußgängerbrücke
  row('schiene', { x: 29, y: 1 }, { x: 29, y: 27 });
  row('weg', { x: 28, y: 14 }, { x: 30, y: 14 });
  setCrossing(29, 14, true, Object.keys(FOOT_STYLES)[0]);
  setTool('look'); rebuildCover(); recalc();
  QUIET = false;
  const out = serialize();
  out.cam = { x: 0, y: 0, z: 1.2 };
  return out;
}
