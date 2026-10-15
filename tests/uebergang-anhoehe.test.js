const { loadGame, game } = require('./helpers/load-game');

// 160c F1 (Nutzer 15.10.2026, Bild tools/vorschau/uebergang-mass.png): Fußgängerbrücke am Bahnübergang oben auf einer Anhöhe. Das Wegfeld vor
// der Brücke (b > 0,5) kam im Bild erst nach dem Übergang und malte seine Oberseite über das vordere Rampenende – die Rampe wirkte abgeschnitten
// und versetzt. Wie bei Dingen oben (hillPre, Block 157j): die Felder davor zuerst
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); if (state.bruecken) state.bruecken.clear(); walkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0");
});
// Übergang bei 8,8: Schiene längs ax (0: x, 1: y), Weg quer; hill: alles oben auf einer Anhöhe
const bau = (ax, hill) => game(`(() => {
  if (${hill}) for (let y = 3; y <= 13; y++) for (let x = 3; x <= 13; x++) state.hills.set(x + ',' + y, { w: 0 });
  const dx = ${ax} ? 0 : 1, dy = ${ax} ? 1 : 0;
  for (let j = -4; j <= 4; j++) if (j) state.tiles.set((8 + dx * j) + ',' + (8 + dy * j), { b: 'schiene', lvl: 1, form: 0 });
  for (let j = -3; j <= 3; j++) if (j) state.tiles.set((8 + dy * j) + ',' + (8 + dx * j), { b: 'weg', lvl: 1, style: 'sand' });
  state.tiles.set('8,8', { b: 'schiene', lvl: 1, form: 0, cross: true, foot: true, footPaid: 'holz', style: 'sand' });
  terrainCache.clear(); groundVersion++; recalc(); })()`);
// Reihenfolge in einem Bild: Oberseiten oben (drawHillFlat) und die beiden Bogenhälften (drawArch)
const order = () => game(`(() => {
  const log = [], dh = drawHillFlat, da = drawArch;
  drawHillFlat = (cx, cy, z, x, y, t) => { log.push('oben ' + x + ',' + y); return dh(cx, cy, z, x, y, t); };
  drawArch = (P, z, b0, b1, ...a) => { log.push('bogen ' + b0 + '..' + b1); return da(P, z, b0, b1, ...a); };
  try { cam = state.cam; cam.z = 2; const p = iso(8, 8); cam.x = p.x; cam.y = p.y - 40; resetDrawCaches(); spriteNoBudget = true; spriteForce = false; render(1e6); }
  finally { drawHillFlat = dh; drawArch = da; spriteNoBudget = false; spriteForce = null; }
  return log; })()`);

describe('Fußgängerbrücke am Übergang auf einer Anhöhe (160c F1)', () => {
  for (const [ax, vorn] of [[0, '8,9'], [1, '9,8']]) {
    it(`Schiene ${ax ? 'Nord-Süd' : 'Ost-West'}: die Oberseite des Wegfelds davor (${vorn}) vor der vorderen Bogenhälfte, je einmal`, () => {
      bau(ax, true);
      const log = order();
      const i = log.indexOf('oben ' + vorn), j = log.indexOf('bogen 0..0.9');
      expect(i, log.join(' | ')).toBeGreaterThanOrEqual(0);
      expect(j).toBeGreaterThan(i);
      expect(log.filter(e => e === 'oben ' + vorn).length).toBe(1);
      expect(log.filter(e => e === 'bogen 0..0.9').length).toBe(1);
      expect(log.filter(e => e === 'bogen -0.9..0').length).toBe(1);
    });
  }
  it('am Boden: keine Oberseiten, jedes Stück einmal', () => {
    bau(0, false);
    const log = order();
    expect(log.filter(e => e.startsWith('oben'))).toEqual([]);
    expect(log).toEqual(['bogen -0.9..0', 'bogen 0..0.9', 'bogen -0.9..0.5', 'bogen 0.5..0.9']);   // F1d: unten hinten, unten vorn, vorderes Geländer in zwei Stücken
  });
});
