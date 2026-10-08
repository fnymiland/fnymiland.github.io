const { loadGame, game } = require('./helpers/load-game');

// Block 125: Wegbeläge – neue ruhige Stadtbeläge und Holz, Muster blassen weit weg aus
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 40; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); state.claimed.add(x + ',' + y); }");
});
describe('Wegbeläge (Block 125)', () => {
  it('jeder alte Belag hat ein Aussehen und ist eine Kombination aus Muster + Farbe; Muster gibt es in der Kunstakademie', () => {
    expect(game(`STYLES.weg.filter(s => !PATH_LOOK[s.id] || !WEG_PRESET[s.id]).map(s => s.id)`)).toEqual([]);
    expect(game(`Object.keys(WEG_PRESET).filter(id => wegStyleOf(...WEG_PRESET[id]) !== id)`)).toEqual([]);   // hin und zurück gleich
    for (const m of ['platten', 'drittel', 'gemischt', 'verband', 'reihen', 'pflaster', 'holz', 'fischgross'])
      expect(game(`!!DESIGN_BY_ID['wegmuster:${m}'] && designPrice(DESIGN_BY_ID['wegmuster:${m}']) > 0`)).toBe(true);
    expect(game(`wegStyleOf('verband', 'anthrazit')`)).toBe('m:verband:anthrazit');
    expect(game(`pathLook('m:verband:anthrazit').fill`)).toBe('#64676d');
  });
  it('alle Beläge zeichnen in allen Formen ohne Fehler – nah und weit weg', () => {
    game(`WEG_MUSTER.map(m => wegStyleOf(m.id, 'ziegel')).concat(STYLES.weg.map(s => s.id)).forEach((id, i) => { const x = (i % 9) * 4, y = Math.floor(i / 9) * 4;
      for (const [a, b] of [[0, 1], [1, 1], [2, 1], [1, 0], [1, 2]]) state.tiles.set((x + a) + ',' + (y + b), { b: 'weg', lvl: 1, style: id }); }); recalc(); resize()`);
    for (const z of [2, 0.8, 0.45]) game(`cam.x = iso(12, 6).x; cam.y = iso(12, 6).y; cam.z = ${z}; groundVersion++; render(1e6); render(1e6)`);
  });
  it('alte Spielstände: unbekannte Belag-Namen werden weiter umgestellt, die neuen bleiben', () => {
    const ok = game(`(() => { const d = serialize(); d.tiles.push(['40,40', { b: 'weg', lvl: 1, style: 'm:holz:treibholz' }], ['41,40', { b: 'weg', lvl: 1, style: 'steg' }]);
      const s = parseSave(d); return [s.tiles.get('40,40').style, s.tiles.get('41,40').style]; })()`);
    expect(ok).toEqual(['m:holz:treibholz', 'sand']);
  });
  it('Muster blassen beim Rauszoomen aus (nah voll, weit weg schwach)', () => {
    // Boden-Bilder werden ~2,27 Gerätepunkte je Einheit von z gemalt (Zoom 0,8 / 0,45 / 0,35 → z 0,91 / 0,51 / 0,4 bei Maßstab 2)
    const f = game(`(() => { const t = g.getTransform; g.getTransform = () => ({ a: 2, b: 0 }); try { return [patternFade('dots', 0.91), patternFade('dots', 0.51), patternFade('dots', 0.4), patternFade('tiles', 0.91), patternFade('tiles', 0.4)]; } finally { g.getTransform = t; } })()`);
    expect(f[0]).toBeGreaterThan(0.95); expect(f[1]).toBeGreaterThan(0.2); expect(f[1]).toBeLessThan(0.5); expect(f[2]).toBeLessThan(0.05);
    expect(f[3]).toBeGreaterThan(0.95); expect(f[4]).toBeLessThan(0.05);
  });
});
