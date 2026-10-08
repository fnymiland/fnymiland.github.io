const { loadGame, game } = require('./helpers/load-game');

// Block 150: Wegbrücken ab 2 Feldern (an beiden Enden Land) sind ein Bogen; 1 Feld und Stege ins Meer bleiben flach
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 24; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
});
// Fluss quer (x = 10 … 10 + N − 1), Weg darüber auf y = 12
const river = (N, kind = 'stein') => game(`(() => { for (let y = 0; y <= 24; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); } recalc(); for (let y = 5; y <= 20; y++) for (let x = 10; x < 10 + ${N}; x++) state.terra.set(x + ',' + y, 'water'); recalc();
  chosenStyle.weg = 'sand'; for (let x = 6; x < 14 + ${N}; x++) build('weg', x, 12);
  for (let x = 10; x < 10 + ${N}; x++) { const t = state.tiles.get(x + ',12'); if (t && t.bridge) t.brk = '${kind}'; } recalc(); })()`);
const crossings = N => game(`Array.from({ length: ${N} }, (_, i) => { const c = seaCross(10 + i, 12); return c === 'block' ? '#' : c ? '-' : '?'; }).join('')`);

describe('Bogenbrücken (Block 150)', () => {
  it('1 Feld flach, ab 2 Feldern Bogen; Höhe in der Mitte wächst mit der Länge, an den Enden 0', () => {
    river(1); expect(game('bridgeArch(10, 12)')).toBe(null);
    for (const [N, min] of [[2, 12], [6, 35], [9, 40], [16, 65]]) {
      river(N);
      const A = game('bridgeArch(10, 12)');
      expect(A && A.N, 'N=' + N).toBe(N);
      expect(game(`archDeck(bridgeArch(10, 12), ${N} / 2)`)).toBeGreaterThan(min);
      expect(game('archDeck(bridgeArch(10, 12), 0)')).toBeCloseTo(0);
    }
  });
  it('Steg ins Meer (ein Ende offen) bleibt flach', () => {
    game("for (let y = 5; y <= 20; y++) for (let x = 10; x <= 40; x++) state.terra.set(x + ',' + y, 'water'); recalc(); chosenStyle.weg = 'sand'; for (let x = 6; x <= 12; x++) build('weg', x, 12); recalc()");
    expect(game("!!state.tiles.get('11,12') && state.tiles.get('11,12').bridge")).toBe(true);
    expect(game('bridgeArch(11, 12)')).toBe(null);
  });
  it('Stein: Bögen wie mit dem Nutzer entschieden – 6: einer, 9: Haupt + 2 Neben, 12: 2 große + 2 kleine, 16: zwei große', () => {
    const n = N => { river(N); return game('bridgeArch(10, 12).open.length'); };
    expect(n(6)).toBe(1); expect(n(9)).toBe(3); expect(n(12)).toBe(4); expect(n(16)).toBe(2);
  });
  it('Boote nur unter hohen Stellen bzw. durch die Öffnungen; kurze Brücken nie ganz gesperrt', () => {
    river(9); expect(crossings(9)).toBe('##-#-#-##');
    river(2); expect(crossings(2)).not.toContain('#');
    river(9, 'holz'); expect(crossings(9)).toBe('#-------#');
    river(1); expect(crossings(1)).toBe('-');
  });
  it('Bewohner gehen über den Bogen (Höhe), daneben 0', () => {
    river(9);
    expect(game('wegBridgeLift(14, 12)')).toBeGreaterThan(40);
    expect(game('wegBridgeLift(7, 12)')).toBe(0);
  });
  it('alle Arten und Längen zeichnen ohne Fehler (nah, weit, über einem Boot)', () => {
    for (const kind of ['stein', 'ziegel', 'holz', 'rot']) for (const N of [1, 2, 3, 6, 9, 12, 16]) {
      river(N, kind);
      for (const z of [2, 0.6]) game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(10 + ${N} / 2, 12); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); })()`);
      game("drawBridgeOver('10,12', 1.5, 1e6)");
    }
  });
});
