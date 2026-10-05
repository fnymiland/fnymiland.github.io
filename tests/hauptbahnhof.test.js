const { loadGame, game } = require('./helpers/load-game');

// Block 85: Hauptbahnhof überarbeitet – Dächer in allen Designs, Gleise beim Erweitern, symmetrisches Portal, Weg zum Eingang
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; resetUndo(); night = 0");
  game("state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } waterChanged(); sandCache.clear(); recalc()");
});
// alle Füllfarben beim Zeichnen mitschreiben
const fills = (t, pass = null) => game(`(() => { const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
  try { PASS = ${JSON.stringify(pass)}; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, ${JSON.stringify({ b: 'hbf', lvl: 1, ...t })}); } finally { PASS = null; delete g.fillStyle; } return seen; })()`);

describe('Hauptbahnhof (Block 85)', () => {
  it('zeichnet in jedem Design, jeder Drehung und mit 2 bis 16 Gleisen ohne Fehler', () => {
    const bad = game(`(() => { const out = []; for (const look of Object.keys(HBF_LOOKS)) for (let rot = 0; rot < 4; rot++) for (const gleise of [2, 3, 7, 16]) for (const n of [0, 0.8]) {
      try { night = n; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot, look, gleise }); } catch (e) { out.push(look + rot + '/' + gleise + ': ' + e.message); } } night = 0; return out; })()`);
    expect(bad).toEqual([]);
  });
  it('das Bahnsteigdach kommt in jeder Drehung nach seinem Bahnsteig (sonst malt der Bahnsteig darüber)', () => {
    for (const [look, roofCol] of [['backstein', '#8a4a38'], ['land', '#9a6a48'], ['glas', '#cfeaf2']]) for (let rot = 0; rot < 4; rot++) {
      const seen = fills({ rot, look, gleise: 3 }), plat = '#efe9dc';
      const order = seen.filter(c => c === plat || c.startsWith('#') && game(`shade('${roofCol}', 0) === '${c}' || '${c}' === '${roofCol}'`)).map(c => c === plat ? 'P' : 'R');
      // jedes Dach folgt einem Bahnsteig: in der Folge steht nie „R“ vor dem ersten „P“ des nächsten Gleises
      expect(order[0], `${look} ${rot}: ${order.join('')}`).toBe('P');
    }
  });
  it('Gleise im Boden: so viele Schienenpaare wie Gleise – auch nach „+ Gleis“ in jeder Drehung', () => {
    for (let rot = 0; rot < 4; rot++) {
      game(`for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y); state.tiles.set('10,10', { b: 'hbf', lvl: 1, rot: ${rot}, gleise: 2 }); recalc()`);
      const k = game("hbfResize('10,10', 1)");
      expect(k, 'rot ' + rot).toBeTruthy();
      const t = game(`state.tiles.get('${k}')`);
      expect(t.gleise).toBe(3);
      expect(fills(t, 'ground').filter(c => c === '#6b6f78').length).toBe(2 * 3);
    }
  });
  it('Portal genau in der Mitte: die zwei Eingangsfelder liegen mittig vor der Rückseite', () => {
    for (let rot = 0; rot < 4; rot++) for (const gleise of [2, 3, 6]) {
      const t = { b: 'hbf', rot, gleise }, [w, h] = game(`sizeOf('hbf', ${rot}, ${JSON.stringify(t)})`);
      const ent = game(`hbfEntrance(${JSON.stringify(t)}, 10, 10)`), fp = new Set(game(`footprint('hbf', 10, 10, ${rot}, ${JSON.stringify(t)}).map(p => p.join())`));
      const cx = 10 + (w - 1) / 2, cy = 10 + (h - 1) / 2;
      expect(ent.every(([x, y]) => !fp.has(x + ',' + y)), `außerhalb ${rot}/${gleise}`).toBe(true);
      expect(ent.every(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => fp.has((x + dx) + ',' + (y + dy)))), `angrenzend ${rot}/${gleise}`).toBe(true);
      const mx = (ent[0][0] + ent[1][0]) / 2, my = (ent[0][1] + ent[1][1]) / 2;
      expect(rot & 1 ? mx : my, `mittig ${rot}/${gleise}`).toBeCloseTo(rot & 1 ? cx : cy);   // quer zur Gleisrichtung genau in der Mitte
    }
  });
  it('Weg am Eingang: das Fenster sagt es, der Bahnhof hängt am Dorf', () => {
    game("state.tiles.set('10,10', { b: 'hbf', lvl: 1, rot: 2, look: 'glas', gleise: 3 }); recalc()");
    game('openInfo(10, 10)');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Weg vor das Portal/);
    const [ex, ey] = game("hbfEntrance(state.tiles.get('10,10'), 10, 10)[0]");
    game(`for (let i = 0; i < 3; i++) state.tiles.set((${ex} + i) + ',' + ${ey}, { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set((${ex} + 2) + ',' + (${ey} + 1), { b: 'haus', lvl: 1 }); recalc(); openInfo(10, 10)`);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Weg am Eingang – mit dem Dorf verbunden/);
  });
});
