// Erzeugt testsave-farben.json (Testwelt ?welt=farben, Block 72): jedes umfärbbare Gebäude ohne eigenes paint() in einer
// Reihe – erst die vier Drehungen in Originalfarben, dann alle 14 Farben (Wand i + Dach i). Schild am Anfang jeder Reihe.
// Nur auf Wunsch:  TESTWELT=1 npx vitest run tests/testwelt-farben.test.js
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
beforeAll(() => loadGame());
it.skipIf(!process.env.TESTWELT)('erzeugt testsave-farben.json', () => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true");
  game("state.town.name = 'Farbenhausen'; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 5000; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const i of ISLES) state.islands.add(i.id)");
  game('for (let i = 0; i < WALLS.length; i++) state.design.add("wall:" + i); for (let i = 0; i < ROOFS.length; i++) state.design.add("roof:" + i)');
  // Reihen: Windräder (je Stufe), Läden, Hotels, Kultur, Deko-Bauten
  const rows = [['windrad', 1], ['windrad', 2], ['windrad', 3], ['offshore', 1],
    ...game('Object.keys(REPAINT).filter(b => !["windrad", "offshore"].includes(b))').map(b => [b, 3])];
  const N = game('WALLS.length'), X0 = 34, GAP = 1;
  const signs = [];
  let y = -70, maxX = X0;
  for (const [b, lvl] of rows) {
    const items = [0, 1, 2, 3].map(rot => ({ rot })).concat(Array.from({ length: N }, (_, i) => ({ rot: 0, wall: i, roof: i })));
    let x = X0 + 3, rowH = 1;
    const placed = items.map(it => {
      const [w, h] = game(`sizeOf('${b}', ${it.rot}, { b: '${b}', rot: ${it.rot}, lvl: ${lvl} })`);
      const p = { ...it, x, w, h };
      x += w + GAP; rowH = Math.max(rowH, h);
      return p;
    });
    for (const p of placed) game(`state.tiles.set('${p.x},${y}', ${JSON.stringify({ b, lvl, rot: p.rot, ...(p.wall != null ? { wall: p.wall, roof: p.roof } : {}) })})`);
    signs.push({ x: X0 + 1, y: y + (rowH - 1) / 2, text: game(`ITEMS['${b}'].name`) + (b === 'windrad' ? ` (Stufe ${lvl})` : '') });
    for (let yy = y; yy < y + rowH; yy++) for (let xx = X0; xx < x; xx++) if (b === 'offshore' && xx > X0 + 1) game(`state.terra.set('${xx},${yy}', 'water')`);
    maxX = Math.max(maxX, x);
    y += rowH + 2;
  }
  // Land (aufgeschüttet) unter allem, ringsum ein Rand; Gelände der Inseln hier überschreiben
  game(`for (let yy = -72; yy < ${y + 1}; yy++) for (let xx = ${X0 - 2}; xx < ${maxX + 2}; xx++) { const k = xx + ',' + yy; claimTile(xx, yy); if (!state.terra.has(k)) state.terra.set(k, 'grass'); state.decos.delete(k); const t = state.tiles.get(k); if (t && !(${JSON.stringify(rows.map(r => r[0]))}).includes(t.b)) state.tiles.delete(k); }`);
  game('sandCache.clear(); waterChanged(); recalc()');
  const d = game('JSON.parse(JSON.stringify(serialize()))');
  d.showcase = { signs, quiet: true, look: [X0 + 14, -66] };
  fs.writeFileSync('testsave-farben.json', JSON.stringify(d));
  console.log('Reihen', rows.length, 'Breite', maxX - X0, 'Höhe', y + 70, 'Größe', (JSON.stringify(d).length / 1024).toFixed(0) + ' KB');
});
