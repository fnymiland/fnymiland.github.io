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
      expect(log.filter(e => !e.startsWith('figur'))).toEqual(['unten -0.9..0', 'unten 0..0.9', 'oben -0.9..0.45', 'oben 0.45..0.9']);
      const i = e => log.indexOf(e);
      expect(i('figur -0.60')).toBeGreaterThan(i('unten 0..0.9'));
      expect(i('oben -0.9..0.45')).toBeGreaterThan(i('figur -0.60'));
      expect(i('figur 0.70')).toBeGreaterThan(i('unten 0..0.9'));
      expect(i('oben 0.45..0.9')).toBeGreaterThan(i('figur 0.70'));
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

// 160c F1e (Karte Übergang R7): ein Wagen über der Feldkante des Übergangs in Stücken je Feld (wie die Gleisbrücke, gbCarPieces) – sonst malte
// ein Wagen, dessen Mitte schon auf dem Gleisfeld davor liegt, sein Heck über die vordere Wange; liegt die Mitte unter dem Bogen, deckte die
// vordere Hälfte die Spitze, die schon davor ist
const car = (px, py, du, dv) => `({ train: { kind: TRAIN_KIND.regio, col: 0, model: 'regio', route: {} }, px: ${px}, py: ${py}, du: ${du}, dv: ${dv}, i: 0, n: 1, len: TRAIN_KIND.regio.len, d: null, mv: 1 })`;
describe('Wagen unter der Fußgängerbrücke in Stücken je Feld (160c F1e)', () => {
  it('über der Kante: zwei Stücke, je Feld eines; ganz in einem Feld oder ohne Brücke: keine', () => {
    bau(0);
    expect(game(`ubCarPieces(${car(8.75, 8, 1, 0)}).map(p => [p.k, p.m.cut.map(v => +v.toFixed(2))])`)).toEqual([['8,8', [-0.39, -0.25]], ['9,8', [-0.25, 0.39]]]);
    expect(game(`ubCarPieces(${car(8, 8, 1, 0)})`)).toBe(null);
    expect(game(`ubCarPieces(${car(10.6, 8, 1, 0)})`)).toBe(null);
    bau(1);
    expect(game(`ubCarPieces(${car(8, 7.4, 0, 1)}).map(p => p.k)`)).toEqual(['8,7', '8,8']);
  });
  it('im Bild: das Stück unter dem Bogen vor dessen vorderer Hälfte, das Stück davor danach', () => {
    bau(0);
    const log = game(`(() => { const log = [], tc = trainCars, sm = syncMovers, body = drawTrainCarBody, da = drawArch;
      trainCars = () => [${car(8.75, 8, 1, 0)}]; syncMovers = () => {};
      drawTrainCarBody = (c, ...a) => { log.push('wagen ' + (c.gbK || '-')); return body(c, ...a); };
      drawArch = (P, z, b0, b1, L, x, y, d, n, t, teil = 'alles') => { log.push(teil + ' ' + b0 + '..' + b1); return da(P, z, b0, b1, L, x, y, d, n, t, teil); };
      try { cam = state.cam; cam.z = 2; const p = iso(8, 8); cam.x = p.x; cam.y = p.y - 30; resetDrawCaches(); spriteForce = false; render(1e6); }
      finally { trainCars = tc; syncMovers = sm; drawTrainCarBody = body; drawArch = da; spriteForce = null; }
      return log; })()`);
    const i = e => log.indexOf(e);
    expect(log.filter(e => e.startsWith('wagen'))).toEqual(['wagen 8,8', 'wagen 9,8']);
    expect(i('wagen 8,8')).toBeLessThan(i('unten 0..0.9'));
    expect(i('wagen 9,8')).toBeGreaterThan(i('oben -0.9..0.45'));
  });
});

// 160c G2 (Gesamtprüfung, plan-160c/g2-funde.md B3-2/3/4, G2V-5)
describe('Übergang: Gesamtprüfung Bild (160c G2)', () => {
  it('Figur auf dem Übergang oben auf der Anhöhe: mit dem Hub der Anhöhe gezeichnet (wie neben der Brücke)', () => {
    game("for (let y = 2; y <= 14; y++) for (let x = 2; x <= 14; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
    bau(0);
    figur(0, 0, 1); figur(0, -0.6, 2);
    const lifts = game(`(() => { const out = [], ml = moverLive; moverLive = (m, z, now, w, lift = 0) => { if (m.fur) out.push(Math.round(lift / z)); return ml(m, z, now, w, lift); };
      try { cam = state.cam; cam.z = 2; const p = iso(8, 8); cam.x = p.x; cam.y = p.y - 60; resetDrawCaches(); spriteNoBudget = true; spriteForce = false; render(1e6); }
      finally { moverLive = ml; spriteNoBudget = false; spriteForce = null; } return out; })()`);
    expect(lifts.length).toBe(2);
    expect(lifts.every(l => l === game('HILL_H'))).toBe(true);
  });
  it('Kristall-Lichtstreifen: das Geländer in zwei Stücken (b 0,5) stanzt jedes Viertel genau einmal', () => {
    const r = game(`(() => { const seen = [], gq = glowQuad; glowQuad = (pts) => { seen.push(pts[0].map(v => v.toFixed(2)).join()); };
      const P = (t, s, h) => [t * 10, s * 10 - h], opts = { licht: 'an', hf: () => 0, lampMax: 2 };
      try { const b = ubT(0.5); bkLamps('t2', P, 1, 'kristall', 'fuss', 2, -0.5, b, opts); bkLamps('t2', P, 1, 'kristall', 'fuss', 2, b, 1.5, opts); } finally { glowQuad = gq; }
      return [seen.length, new Set(seen).size]; })()`);
    expect(r[0]).toBe(r[1]);
    expect(r[1]).toBe(8);                                                   // 2 Felder × 4 Viertel
  });
  it('Nachmalen auf dem späteren Nachbarn (hillLate): nur unten – das vordere Geländer malt dieses Feld danach (archRails)', () => {
    bau(0, 'kristall');
    const r = game(`(() => { const out = [], da = drawArch; drawArch = (...a) => { out.push(a[2] + '..' + a[3] + ' ' + (a[10] || 'alles')); };
      const was = PASS; PASS = 'object'; hillLateK = '8,9';
      try { drawCrossing(0, 0, 1, 8, 8, state.tiles.get('8,8'), 1e6); } finally { drawArch = da; PASS = was; hillLateK = null; } return out; })()`);
    expect(r).toEqual(['-0.9..0.9 unten']);
  });
  it('Schranken ↔ Brücke rechnet den Strom neu (Licht der Brücke)', () => {
    bau(0);
    const n = game(`(() => { let n = 0; const rc = recalc; recalc = (...a) => { n++; return rc(...a); }; try { setCrossing(8, 8, false); setCrossing(8, 8, true); } finally { recalc = rc; } return n; })()`);
    expect(n).toBeGreaterThanOrEqual(2);
  });
});
