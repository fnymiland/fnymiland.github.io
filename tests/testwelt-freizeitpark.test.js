// Erzeugt testsave-freizeitpark.json (Testwelt ?welt=freizeitpark: fertiger Park mit Achterbahn + freie Fläche zum Bauen).
// Nur auf Wunsch:  TESTWELT=1 npx vitest run tests/testwelt-freizeitpark.test.js
const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
beforeAll(() => loadGame());
it.skipIf(!process.env.TESTWELT)('erzeugt testsave-freizeitpark.json', () => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true");
  game("state.town.name = 'Wunderhausen'; state.money = 1e12; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const i of ISLES) state.islands.add(i.id); state.festival = true");
  const W = 30, H = 18;
  const area = game(`(() => { for (let y0 = -40; y0 < 40; y0++) for (let x0 = -40; x0 < 40; x0++) { let ok = true; for (let y = 0; y < ${H} && ok; y++) for (let x = 0; x < ${W} && ok; x++) if (!ownedTile(x0 + x, y0 + y) || isSea(x0 + x, y0 + y)) ok = false; if (ok) return [x0, y0]; } })()`);
  const [X, Y] = area;
  game(`for (let y = ${Y}; y < ${Y + H}; y++) for (let x = ${X}; x < ${X + W}; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }`);
  game('rebuildCover(); recalc()');
  const B = (b, x, y, rot = 0) => game(`(rotManual = true, buildRot = ${rot}, rebuildCover(), build('${b}', ${X + x}, ${Y + y}, true))`);
  // Häuser mit Bewohnern unten, Weg zum Park
  for (let x = 1; x < W - 1; x++) B('weg', x, 15);
  for (let x = 1; x < W - 1; x += 2) game(`state.tiles.set('${X + x},${Y + 16}', { b: 'haus', lvl: ${1 + (x % 5)}, rot: 0 })`);
  game('nameHouses(); rebuildCover(); recalc()');
  // Fertiger Park links (16×13): Wunderland mit Achterbahn
  for (let y = 1; y <= 13; y++) for (let x = 1; x <= 16; x++) B('fzboden', x, y);
  const ring = [];
  for (let x = 2; x <= 15; x++) ring.push([x, 2]);
  for (let y = 3; y <= 12; y++) ring.push([15, y]);
  for (let x = 14; x >= 2; x--) ring.push([x, 12]);
  for (let y = 11; y >= 3; y--) ring.push([2, y]);
  for (const [x, y] of ring) if (!(x === 5 && y === 12)) B('fz_bahn', x, y);
  B('fz_station', 5, 12); B('fz_looping', 9, 2);
  // Schloss aus dem Baukasten: breite Front (Flügel, Portal in der Mitte), Ecktürme, große Türme, Hauptturm dahinter
  const T = (b, x, y, fl, rot = 0) => { B(b, x, y, rot); const t = game(`state.tiles.get('${X + x},${Y + y}')`); if (t && fl) game(`state.tiles.get('${X + x},${Y + y}').fl = ${fl}`); };
  T('fz_turm', 5, 8, 3); T('fz_fluegel', 6, 8, 2); T('fz_fluegel', 7, 8, 3); T('fz_portal', 8, 8, 3, 1); T('fz_fluegel', 9, 8, 3); T('fz_fluegel', 10, 8, 2); T('fz_turm', 11, 8, 3);
  T('fz_turm2', 7, 7, 3); T('fz_hauptturm', 8, 7, 4); T('fz_turm2', 9, 7, 3);
  // Eingang: zwei Tortürme
  T('fz_torturm', 16, 5, 2); T('fz_torturm', 16, 9, 2);
  for (const [b, x, y, r] of [['fz_karussell', 3, 3], ['fz_teetassen', 12, 3], ['fz_kette', 12, 10], ['fz_freifall', 4, 6], ['fz_geister', 3, 9], ['fz_wildwasser', 13, 4],
    ['fz_zuckerwatte', 6, 4], ['fz_eis', 10, 10], ['fz_ballon', 6, 10], ['fz_zuckerwatte', 14, 8]]) B(b, x, y, r || 0);
  for (let y = 9; y <= 11; y++) if (!game(`COVER.has('${X + 8},${Y + y}')`)) B('weg', 8, y);
  for (let x = 9; x <= 15; x++) if (!game(`COVER.has('${X + x},${Y + 11}')`)) B('weg', x, 11);
  // Freie Fläche rechts zum Selberbauen (11×13)
  for (let y = 1; y <= 13; y++) for (let x = 18; x <= 28; x++) B('fzboden', x, y);
  game('rebuildCover(); recalc()');
  const st = game('computeFz().map(p => [p.tiles.length, p.rides, p.stage])'), coasters = game('COASTERS.length');
  const d = game('JSON.parse(JSON.stringify(serialize()))');
  d.cam = { x: game(`iso(${X + 14}, ${Y + 8}).x`), y: game(`iso(${X + 14}, ${Y + 8}).y`), z: 1.2 };
  fs.writeFileSync('testsave-freizeitpark.json', JSON.stringify(d));
  console.log('Bereich', JSON.stringify(area), 'Parks', JSON.stringify(st), 'Achterbahnen', coasters);
  expect(coasters).toBe(1);
  expect(st[0][2]).toBe(3);                                                      // Wunderland
});
