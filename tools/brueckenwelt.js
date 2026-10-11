'use strict';
// ---------------------------------------------------------------------------
// Testwelt „bruecken“ (160c A1, Prüfstand für den Umbau der Brücken): ALLE alten Brückenarten, roh so geschrieben, wie sie in alten
// Spielständen liegen (nicht über build – damit genau die Altfelder brk/brc/brw/footPaid/bruecken stehen, die umgedeutet werden müssen):
// - Wegbrücken übers Wasser Ost-West: 1/2/3/3/3/6/6/9/16 Felder, Stile sand/kopf/platten/m:…, brk holz/stein/ziegel/rot, brc/brw;
//   Nord-Süd: holz/stein/ziegel; breit 2/3/4 Reihen; Steg ins Meer (offenes Ende)
// - Gleisbrücken übers Wasser: gerade, Kurve, Abzweig (T), Kreuzung (X), Doppelgleis, 30 Felder lang
// - Bahnübergänge: Schranken, Fußgängerbrücke footPaid true/holz/stein/weg/kristall, Schranken mit altem footPaid
// - Anhöhen-Brücken (160a/b): Holz/Stahl × leer/Weg/Gleis × 1–4 Felder, eine Nord-Süd
// Immer gleich (kein Zufall). Erzeugt testsave-bruecken.json und die kleine Vorlage tests/vorlagen/alte-bruecken.json:
// GEN=1 npx vitest run tests/brueckenwelt.test.js – im Browser ?welt=bruecken
// ---------------------------------------------------------------------------
function makeBrueckenWelt() {
  startNew(); closeModal(); closePanel();
  QUIET = true;
  state.tutorial = -1; state.tipsOff = true;
  state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e6;
  for (const d of DESIGN) state.design.add(d.id);
  state.techs = new Set(TECHS.map(t => t.id));
  for (let y = -1; y <= 62; y++) for (let x = -1; x <= 66; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); }
  state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.bruecken.clear();
  const water = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water'); };
  const put = (x, y, t) => state.tiles.set(x + ',' + y, { lvl: 1, ...t });
  const isW = (x, y) => state.terra.get(x + ',' + y) === 'water';
  // Weg über einen Kanal (Ost-West): Ufer x0−2 … x0+n+1, Brücke x0 … x0+n−1; Wasser drei Reihen hoch
  const wegEW = (x0, y, n, style, extra = {}) => {
    water(x0, y - 1, x0 + n - 1, y + 1);
    for (let x = x0 - 2; x <= x0 + n + 1; x++) put(x, y, { b: 'weg', style, ...(isW(x, y) ? { bridge: true, ...extra } : {}) });
  };
  const wegNS = (x, y0, n, style, extra = {}) => {
    water(x - 1, y0, x + 1, y0 + n - 1);
    for (let y = y0 - 2; y <= y0 + n + 1; y++) put(x, y, { b: 'weg', style, ...(isW(x, y) ? { bridge: true, ...extra } : {}) });
  };
  // 1) Wegbrücken Ost-West, je Zeile ein Fall (Zeilen 2, 5, 8, …)
  const CASES = [
    [1, 'sand'], [2, 'sand'], [3, 'kopf'], [3, 'platten'], [3, 'm:verband:beige'],
    [6, 'sand', { brk: 'rot', brw: 2 }], [6, 'kopf', { brk: 'ziegel', brc: 4 }], [9, 'platten', { brk: 'stein', brc: 2 }], [16, 'sand', { brk: 'holz', brc: 1, brw: 3 }],
  ];
  CASES.forEach(([n, style, extra], i) => wegEW(6, 2 + 3 * i, n, style, extra));
  // Steg ins Meer (offenes Ende): Weg endet auf dem Wasser
  water(6, 28, 12, 30);
  for (let x = 3; x <= 8; x++) put(x, 29, { b: 'weg', style: 'sand', ...(isW(x, 29) ? { bridge: true } : {}) });
  // breite Brücken (2, 3, 4 Reihen) über einen Kanal x 30–34
  for (const [y0, rows] of [[2, 2], [7, 3], [13, 4]]) {
    water(30, y0 - 1, 34, y0 + rows);
    for (let r = 0; r < rows; r++) for (let x = 28; x <= 36; x++) put(x, y0 + r, { b: 'weg', style: 'platten', ...(isW(x, y0 + r) ? { bridge: true } : {}) });
  }
  // Nord-Süd: Holz, Stein, Ziegel (je 3 Felder) über einen Kanal y 22–24
  [[40, 'sand'], [43, 'platten'], [46, 'kopf']].forEach(([x, st]) => wegNS(x, 22, 3, st));
  // 2) Gleisbrücken übers Wasser (Zeilen 33–50)
  const rail = (x, y, extra = {}) => put(x, y, { b: 'schiene', ...(isW(x, y) ? { bridge: true } : {}), ...extra });
  water(8, 34, 12, 36); for (let x = 5; x <= 15; x++) rail(x, 35);                                   // gerade
  water(19, 33, 25, 40); for (let x = 17; x <= 22; x++) rail(x, 36); for (let y = 37; y <= 42; y++) rail(22, y);   // Kurve auf dem Wasser (22,36)
  water(28, 33, 36, 38); for (let x = 27; x <= 37; x++) rail(x, 35); for (let y = 36; y <= 40; y++) rail(32, y);   // Abzweig (T) bei (32,35)
  water(40, 33, 46, 39); for (let x = 39; x <= 47; x++) rail(x, 36); for (let y = 32; y <= 40; y++) rail(43, y);   // Kreuzung (X) bei (43,36)
  water(8, 39, 13, 42); for (let x = 5; x <= 16; x++) { rail(x, 40); rail(x, 41); }                  // Doppelgleis
  water(3, 45, 34, 47); for (let x = 1; x <= 36; x++) rail(x, 46, x % 7 === 0 ? { form: 1 } : {});  // 30 Felder lang, mit Gleisbett-Wechsel
  // 3) Bahnübergänge: Schiene entlang y = 52, Wege quer
  for (let x = 2; x <= 30; x++) rail(x, 52);
  const CROSS = [[5, {}], [8, { foot: true, footPaid: true }], [11, { foot: true, footPaid: 'holz' }], [14, { foot: true, footPaid: 'stein' }],
    [17, { foot: true, footPaid: 'weg' }, 'fisch'], [20, { foot: true, footPaid: 'kristall' }], [23, { footPaid: 'stein' }], [26, { foot: true }]];
  for (const [x, o, st = 'sand'] of CROSS) {
    for (const y of [50, 51, 53, 54]) put(x, y, { b: 'weg', style: st });
    put(x, 52, { b: 'schiene', cross: true, style: st, ...o });
  }
  // 4) Anhöhen-Brücken (160a/b): je Lücke n ein Paar Anhöhen, darin drei Zeilen (leer, Weg, Gleis)
  const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
  [1, 2, 3, 4].forEach((n, i) => {
    const y0 = 28 + i * 8, xa = 50, xb = xa + 3 + n;                       // A x 50–52, B ab 53 + n
    hill(xa, y0, xa + 2, y0 + 6); hill(xb, y0, xb + 2, y0 + 6);
    const rows = [[y0 + 1, 'holz', null], [y0 + 3, i % 2 ? 'stahl' : 'holz', 'weg'], [y0 + 5, i % 2 ? 'holz' : 'stahl', 'gleis']];
    for (const [y, art, top] of rows) {
      const b = { ax: 0, n, art };
      if (top === 'weg') { b.weg = Array(n).fill('platten'); for (const x of [xa, xa + 1, xa + 2, xb, xb + 1, xb + 2]) put(x, y, { b: 'weg', style: 'platten' }); }
      if (top === 'gleis') { b.gleis = Array(n).fill(0); for (const x of [xa, xa + 1, xa + 2, xb, xb + 1, xb + 2]) rail(x, y); }
      state.bruecken.set((xa + 3) + ',' + y, b);
    }
  });
  hill(56, 2, 60, 5); hill(56, 9, 60, 12);                                // Nord-Süd: Lücke y 6–8, Holz mit Weg
  state.bruecken.set('58,6', { ax: 1, n: 3, art: 'holz', weg: ['sand', 'sand', 'sand'] });
  for (const y of [3, 4, 5, 9, 10, 11]) put(58, y, { b: 'weg', style: 'sand' });
  // 5) Bahnhöfe (eine Linie über die gerade Gleisbrücke) und Strom
  put(5, 34, { b: 'station', rot: 0, train: 'regio' }); put(15, 34, { b: 'station', rot: 0, train: 'regio' });
  for (let i = 0; i < 6; i++) put(62, 40 + 2 * i, { b: 'windrad' });
  setTool('look');
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++;
  rebuildCover(); recalc();
  QUIET = false;
  const out = serialize();
  out.cam = { x: 0, y: 0, z: 1 };
  return out;
}
// Kleine Vorlage (eingecheckt, tests/vorlagen/alte-bruecken.json): nur die Brückenfelder samt Nachbarn und die Anhöhen-Brücken – für die
// Umdeutungs-Tests (160c A2), ohne die große, nicht eingecheckte Testwelt
function brueckenVorlage(save) {
  const keep = new Set();
  for (const [k, t] of save.tiles) if (t.bridge || t.cross) { const [x, y] = keyXY(k); for (const [dx, dy] of [[0, 0], ...DIRS]) keep.add((x + dx) + ',' + (y + dy)); }
  return { tiles: save.tiles.filter(([k]) => keep.has(k)), bruecken: save.bruecken || [] };
}
