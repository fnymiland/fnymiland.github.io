const { loadGame, game } = require('./helpers/load-game');

// 160c F1d (Karte Übergang 6a, Bauplan K15): Bewohner auf der Fußgängerbrücke laufen zwischen Deck und vorderem Geländer. Vorher zeichnete jede
// Hälfte ihr Geländer gleich mit, die Bewohner kamen danach – sie standen vor dem vorderen Geländer. Jetzt: unten (Wände, Deck) wie bisher, das
// vordere Geländer bis b 0,5 nach den Bewohnern des Übergangsfelds (archWalkers), den Rest nach denen des Wegfelds davor (archRails)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); walkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0");
});
const bau = (ax, mat = 'holz') => game(`(() => {
  const dx = ${ax} ? 0 : 1, dy = ${ax} ? 1 : 0;
  for (let j = -4; j <= 4; j++) if (j) state.tiles.set((8 + dx * j) + ',' + (8 + dy * j), { b: 'schiene', lvl: 1, form: 0 });
  for (let j = -3; j <= 3; j++) if (j) state.tiles.set((8 + dy * j) + ',' + (8 + dx * j), { b: 'weg', lvl: 1, style: 'sand' });
  state.tiles.set('8,8', { b: 'schiene', lvl: 1, form: 0, cross: true, foot: true, footPaid: '${mat}', style: 'sand' });
  groundVersion++; recalc(); })()`);
// Bewohner fest auf b (längs des Wegs) bei a = 0
const figur = (ax, b, i) => game(`(() => { const a = ANIMALS[${i}], u = 8 + (${ax} ? ${b} : 0), v = 8 + (${ax} ? 0 : ${b});
  walkers.push({ fx: Math.round(u), fy: Math.round(v), tx: Math.round(u), ty: Math.round(v), px: u, py: v, t: 0, wait: 1e9, pin: true, kind: ${i}, fur: a.fur || FUR[0],
    shirt: SHIRTS[0], speed: 0.8, goal: { kind: 'bummel' }, path: null, steps: 1e9 }); })()`);
const order = () => game(`(() => {
  const log = [], da = drawArch, ml = moverLive;
  drawArch = (P, z, b0, b1, L, x, y, d, n, t, teil = 'alles') => { log.push(teil + ' ' + b0 + '..' + b1); return da(P, z, b0, b1, L, x, y, d, n, t, teil); };
  moverLive = (m, ...a) => { if (m.fur) log.push('figur ' + (m.px + m.py - 16).toFixed(2)); return ml(m, ...a); };
  try { cam = state.cam; cam.z = 2; const p = iso(8, 8); cam.x = p.x; cam.y = p.y - 30; resetDrawCaches(); spriteNoBudget = true; spriteForce = false; render(1e6); }
  finally { drawArch = da; moverLive = ml; spriteNoBudget = false; spriteForce = null; }
  return log; })()`);

describe('Bewohner auf der Fußgängerbrücke zwischen Deck und vorderem Geländer (160c F1d)', () => {
  for (const ax of [0, 1]) {
    it(`Schiene ${ax ? 'Nord-Süd' : 'Ost-West'}: unten hinten, unten vorn, dann Bewohner, dann das vordere Geländer darüber – jedes Stück einmal`, () => {
      bau(ax);
      figur(ax, -0.6, 1); figur(ax, 0.7, 2);                              // hintere Rampe (Feld davor im Bild: früher), vordere Rampe (Wegfeld davor)
      const log = order().filter(e => !e.startsWith('figur') || e.endsWith('-0.60') || e.endsWith('0.70'));
      expect(log.filter(e => !e.startsWith('figur'))).toEqual(['unten -0.9..0', 'unten 0..0.9', 'oben -0.9..0.5', 'oben 0.5..0.9']);
      const i = e => log.indexOf(e);
      expect(i('figur -0.60')).toBeGreaterThan(i('unten 0..0.9'));
      expect(i('oben -0.9..0.5')).toBeGreaterThan(i('figur -0.60'));
      expect(i('figur 0.70')).toBeGreaterThan(i('unten 0..0.9'));
      expect(i('oben 0.5..0.9')).toBeGreaterThan(i('figur 0.70'));
    });
  }
  it('GL-Bild: das Wegfeld vor jeder Fußgängerbrücke läuft live (archFrontTiles); nach dem Bild ist nichts übrig', () => {
    bau(0); expect(game('archFrontTiles()')).toEqual(['8,9']);
    bau(1); expect(game('archFrontTiles()')).toEqual(['9,8']);
    order();
    expect(game('archRails.size')).toBe(0);
  });
  it('unten und oben zusammen sind das ganze Bild (alles): dieselben Bausteine, nur in anderer Folge', () => {
    const lagen = teile => game(`(() => { const out = [], bp = bkPaintLage; bkPaintLage = (l, P, z, art, n, t0, t1, ...r) => { out.push(l); return bp(l, P, z, art, n, t0, t1, ...r); };
      const t = { footPaid: 'kristall' }, L = brLook(t, 'uebergang'), P = (a, b, up = 0) => [a * 10 + b * 10, a * 5 - b * 5 - up];
      try { for (const [b0, b1, teil] of ${JSON.stringify(teile)}) drawArch(P, 1, b0, b1, L, 0, 0, [1, 0], [0, 1], t, teil); } finally { bkPaintLage = bp; } return out.sort(); })()`);
    expect(lagen([[-0.9, 0, 'unten'], [0, 0.9, 'unten'], [-0.9, 0.5, 'oben'], [0.5, 0.9, 'oben']])).toEqual(lagen([[-0.9, 0, 'alles'], [0, 0.9, 'alles']]));
  });
});
