'use strict';
// ---------------------------------------------------------------------------
// Testwelt „dach“ für den Leistungs-Wächter (Block 138, Nutzer 09.10.2026: „testen, vor allem mit unserem Wächter“): alle vier
// Überdachungen mit Stützen, Steinarkaden als Ring mit Hof, Dachgarten und Belag, alle Brüstungen, Deko oben, Dachtreppen in allen
// Drehungen (einzeln und dreifach breit), Häuser für die Leute oben. Immer gleich (kein Zufall beim Bauen).
// Erzeugt testsave-dach.json: GEN=1 npx vitest run tests/dachwelt.test.js – im Browser ?welt=dach
// ---------------------------------------------------------------------------
function makeDachWelt() {
  startNew(); closeModal(); closePanel();
  QUIET = true;
  state.tutorial = -1; state.tipsOff = true;
  state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e6;
  for (const d of DESIGN) state.design.add(d.id);
  state.techs = new Set(TECHS.map(t => t.id));
  for (let y = -1; y <= 29; y++) for (let x = -1; x <= 31; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.edges.clear(); state.roofs.clear();
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc();
  const roofRect = (form, x0, y0, x1, y1, skip, col = 0) => {
    state.paintNew.dach = { form, col }; setTool('dach');
    const cells = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!skip || !skip(x, y)) { build('dach', x, y, true); cells.push([x, y]); }
    roofAutoPillars(cells);
    return cells;
  };
  const set = (cells, o) => { for (const [x, y] of cells) Object.assign(state.roofs.get(x + ',' + y), o); };
  const stair = (rot, x, y) => { rotManual = true; buildRot = rot; build('dachtreppe', x, y); rotManual = false; };
  // 1) Pergola, Glas, Markise: je 3 × 4 über einem Weg, mit einem inneren Pfosten
  chosenStyle.weg = 'platten';
  for (const [i, form] of [[0, 0], [1, 1], [2, 2]]) {
    const x0 = 1 + i * 5;
    setTool('weg'); for (let y = 1; y <= 4; y++) build('weg', x0 + 1, y, true);
    roofRect(form, x0, 1, x0 + 2, 4, null, form === 2 ? 3 : 0);
    buildSmall('stuetze', x0 + 1, 3, VSLOT);
  }
  // 2) Steinarkaden-Ring mit Hof (Dachgarten, Mauer), Deko oben, Dachtreppe
  const ring = roofRect(3, 16, 1, 22, 6, (x, y) => x >= 18 && x <= 20 && y >= 3 && y <= 4);
  set(ring, { par: 1 });
  buildRoofTop('bank', 17, 1, 6); buildRoofTop('laterne', 16, 1, 0); buildRoofTop('baum', 22, 6, 3); buildRoofTop('blumentopf', 21, 1, 4);
  stair(0, 21, 3);
  // 3) Steinarkaden 6 × 6 je Drehung, Belag + Balustrade / Geländer, Dreifachtreppe bzw. einzeln
  const blocks = [[1, 8, 0, 2, 'm:verband:beige', true], [9, 8, 1, 3, 'fisch', false], [17, 8, 2, 2, 'm:pflaster:anthrazit', true], [1, 16, 3, 3, null, false]];
  for (const [ox, oy, rot, par, bel, triple] of blocks) {
    const cells = roofRect(3, ox, oy, ox + 5, oy + 5);
    set(cells, { par, ...(bel ? { bel } : {}) });
    const n = triple ? 3 : 1;
    for (let i = 0; i < n; i++) { const [x, y] = rot & 1 ? [ox + 2, oy + 1 + i] : [ox + 1 + i, oy + 2]; stair(rot, x, y); }
    buildRoofTop('bank', ox + 4, oy, 6); buildRoofTop('laterne', ox + 5, oy + 5, 3); buildRoofTop('busch', ox, oy + 5, 2);
  }
  // 4) Häuser (Bewohner für die Leute auf dem Dach) und ein Weg dazwischen
  for (let x = 9; x <= 27; x += 2) state.tiles.set(x + ',24', { b: 'haus', lvl: 3 });
  setTool('weg'); for (let x = 9; x <= 27; x++) build('weg', x, 25, true);
  setTool('look'); rebuildCover(); recalc();
  QUIET = false;
  const out = serialize();
  out.cam = { x: 0, y: 0, z: 1.2 };
  return out;
}
