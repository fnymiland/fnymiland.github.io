'use strict';
// ---------------------------------------------------------------------------
// Große Testwelt für die Leistung (Block 124): alle Inseln, das Land fast ganz bebaut – Straßenraster, Häuser, Reihenhäuser,
// Läden, Parks mit Bäumen, Bänken, Laternen, Brunnen und Hecken, Zäune um Gärten, ein paar große Gebäude. Feste Zufallswerte
// (hash), also immer gleich. Erzeugt testsave-gross.json: GEN=1 npx vitest run tests/grossstadt.test.js
// ---------------------------------------------------------------------------
function makeGrossstadt() {
  const base = JSON.parse(GROSS_BASE);
  adoptState(parseSave(base));
  QUIET = true;
  state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e6;
  for (const d of DESIGN) state.design.add(d.id);
  for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3;
  state.techs = new Set(TECHS.map(t => t.id));
  const h = (x, y, s) => hash(x, y, s);
  const land = [];
  for (const c of state.owned) {
    const [cx, cy] = c.split(',').map(Number);
    for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++) for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) {
      if (isSea(x, y) || terrainAt(x, y) === 'water' || state.tiles.has(x + ',' + y) || COVER.has(x + ',' + y)) continue;
      land.push([x, y]);
    }
  }
  // 85 % roden (Wald, Fels, Obst bleiben hier und da stehen – wie in einer echten Welt)
  for (const [x, y] of land) if (terrainAt(x, y) !== 'grass' && h(x, y, 901) < 0.85) state.terra.set(x + ',' + y, 'grass');
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc();
  const free = (x, y) => !isSea(x, y) && terrainAt(x, y) === 'grass' && ownedTile(x, y) && !COVER.has(x + ',' + y) && !state.tiles.has(x + ',' + y);
  const put = (x, y, t) => { state.tiles.set(x + ',' + y, { lvl: 1, ...t }); for (const [fx, fy] of footprint(t.b, x, y, t.rot || 0, t)) COVER.set(fx + ',' + fy, x + ',' + y); };
  const fits = (b, x, y, rot, t) => footprint(b, x, y, rot, t).every(([fx, fy]) => free(fx, fy));
  const STY = ['kopf', 'sand', 'platten', 'klinker', 'kopf', 'terrakotta'];
  const SH = Object.keys(SHOPS).filter(s => !SHOPS[s].size);
  const BIG = ['theater', 'kino', 'uni', 'bibliothek', 'museum', 'hotel', 'konzerthalle'];
  // 1) Straßen: Raster alle 5 Felder (je Insel ein Stil), dazu breite Hauptstraßen
  for (const [x, y] of land) if (free(x, y) && (((x % 5) + 5) % 5 === 0 || ((y % 5) + 5) % 5 === 0)) {
    const st = STY[Math.floor(h(Math.floor(x / 24), Math.floor(y / 24), 902) * STY.length)];
    put(x, y, { b: 'weg', style: st, ...(((x % 20) + 20) % 20 === 0 ? { wide: true } : {}) });
  }
  // 2) Blöcke: große Gebäude, Parks, Häuser, Reihenhäuser, Läden
  const decos = (x, y, list) => { const ds = state.decos.get(x + ',' + y) || newSlots(); list.forEach(([i, d]) => { ds[i] = d; }); state.decos.set(x + ',' + y, ds); };
  for (const [x, y] of land) {
    if (!free(x, y)) continue;
    const r = h(x, y, 903), bx = ((x % 5) + 5) % 5, by = ((y % 5) + 5) % 5;
    if (bx === 1 && by === 1 && r < 0.12) {                       // großes Gebäude im Block (3×3 bzw. 2×2)
      const b = BIG[Math.floor(h(x, y, 904) * BIG.length)];
      if (fits(b, x, y, 0)) { put(x, y, { b, lvl: 3, rot: 0 }); continue; }
    }
    if (r < 0.3) {                                                // Park: Rasen, Bäume, Bänke, Laternen, Blumen
      state.terra.set(x + ',' + y, 'park');
      const k = Math.floor(h(x, y, 905) * 4);
      if (k === 0) put(x, y, { b: 'brunnen' });
      else decos(x, y, [[0, { b: 'baum', rot: 0 }], [3, { b: 'busch', rot: 0, col: Math.floor(h(x, y, 906) * 11) }], [1, { b: 'laterne', rot: 0, form: k % 3 }], [6, { b: 'bank', rot: midRot(6) }]]);
      for (const [e, side] of [['a' + x + ',' + y, by === 1], ['b' + x + ',' + y, bx === 1]]) if (side) state.edges.set(e, { b: 'hecke', style: ['niedrig', 'wilmer', 'bluete', 'buchs'][k], ...(k ? { col: k * 2 } : {}) });
      continue;
    }
    if (r < 0.62) { put(x, y, { b: 'haus', lvl: 1 + Math.floor(h(x, y, 907) * 3), rot: Math.floor(h(x, y, 908) * 4), wall: Math.floor(h(x, y, 909) * 6), roof: Math.floor(h(x, y, 910) * 6) });
      decos(x, y, [[0, { b: h(x, y, 911) < 0.5 ? 'busch' : 'blumentopf', rot: 0 }], [3, { b: 'laterne', rot: 0 }]]);
      if (h(x, y, 912) < 0.4) state.edges.set('a' + x + ',' + y, { b: 'zaun', style: ['latten', 'staketen', 'eisen'][Math.floor(h(x, y, 913) * 3)] });
      continue; }
    if (r < 0.75 && fits('reihenhaus', x, y, 0)) { put(x, y, { b: 'reihenhaus', lvl: 3, rot: 0 }); continue; }
    if (r < 0.92) { put(x, y, { b: SH[Math.floor(h(x, y, 914) * SH.length)], lvl: 1 + Math.floor(h(x, y, 915) * 3), rot: Math.floor(h(x, y, 916) * 4) }); decos(x, y, [[1, { b: 'kristallaterne', rot: 0 }]]); continue; }
    decos(x, y, [[0, { b: 'baum', rot: 0 }], [1, { b: 'baum', rot: 0 }], [2, { b: 'busch', rot: 0 }], [3, { b: 'baum', rot: 0 }]]);   // kleines Wäldchen
  }
  // Laternen an den Straßenecken
  for (const [x, y] of land) { const t = state.tiles.get(x + ',' + y); if (t && t.b === 'weg' && ((x % 5) + 5) % 5 === 0 && ((y % 5) + 5) % 5 === 0) decos(x, y, [[0, { b: 'laterne', rot: 0, form: 1 }]]); }
  rebuildCover(); recalc();
  QUIET = false;
  const out = serialize();
  out.cam = { x: 0, y: 0, z: 0.45 };
  return out;
}
