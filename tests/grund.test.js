const { loadGame, game } = require('./helpers/load-game');

// Grundstücke am Inselrand: erschlossene Inseln gehören ganz dir, das Meer ist nie „nicht dein Grundstück“
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true'); });

describe('Inselrand', () => {
  it('jedes Feld der Heimatinsel gehört dir – auch der äußerste Rand', () => {
    const missing = game(`(() => { let n = 0; for (let y = -45; y <= 50; y++) for (let x = -45; x <= 50; x++) if (islandAt(x, y) === 'home' && !ownedTile(x, y)) n++; return n; })()`);
    expect(missing).toBe(0);
  });

  it('alte Stände bekommen den fehlenden Rand beim Laden dazu', () => {
    game("state.owned = new Set([...state.owned].filter(ck => { const [cx, cy] = ck.split(',').map(Number); return Math.abs(cx) <= 4 && Math.abs(cy) <= 4; })); save()");
    game('adoptState(load())');
    const missing = game(`(() => { let n = 0; for (let y = -45; y <= 50; y++) for (let x = -45; x <= 50; x++) if (islandAt(x, y) === 'home' && !ownedTile(x, y)) n++; return n; })()`);
    expect(missing).toBe(0);
  });

  it('auf dem Meer heißt es „Nicht auf dem Wasser“, nie „nicht dein Grundstück“', () => {
    const [x, y] = game(`(() => { for (let x = 2; x < 80; x++) if (isSea(x, 3) && !ownedTile(x, 3)) return [x, 3]; })()`);
    expect(game(`placeError('haus', ${x}, ${y})`)).toBe('Nicht auf dem Wasser');
    expect(game(`placeError('weg', ${x}, ${y})`)).toMatch(/Ufer/);                       // Weg: Brücke, nur vom Ufer aus (Block 66)
    expect(game(`smallError('bank', ${x}, ${y}, 0)`)).toBe('Nicht auf dem Wasser');
  });

  it('die Seebrücke darf vom Ufer ins offene Meer – die Felder werden deine', () => {
    game("state.restore.quelle = 1; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 9999; recalc()");
    // Küstenfeld der Heimatinsel mit offenem Meer in +x-Richtung suchen
    const spot = game(`(() => {
      for (let y = -20; y < 25; y++) for (let x = 0; x < 45; x++) {
        if (!ownedTile(x, y) || terrainAt(x, y) !== 'grass' || COVER.has(x + ',' + y)) continue;
        if ([1, 2, 3].every(d => isSea(x + d, y) && !ownedTile(x + d, y))) return [x, y];
      }
      return null;
    })()`);
    expect(spot).not.toBe(null);
    const [x, y] = spot;
    expect(game(`placeError('seebruecke', ${x}, ${y}, 0)`)).toBe(null);
    expect(game(`build('seebruecke', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`ownedTile(${x + 3}, ${y})`)).toBe(true);
  });
});
