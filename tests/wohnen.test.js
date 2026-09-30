const { loadGame, game } = require('./helpers/load-game');

// Wohnen: Reihenhäuser, Baumhaus, Hausboot, Ferienhäuschen – feste Einwohner je Stufe, drei Ausbaustufen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999');
  game("for (let y = 3; y <= 14; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.restore = { baum: 2, obsthain: 1, klippe: 1, quelle: 1 }; sandCache.clear(); recalc()");
});

describe('Wohnen', () => {
  it('im Menü „Wohnen“ stehen jetzt fünf Wohnformen', () => {
    expect(game("MENU.find(m => m.id === 'wohnen').items")).toEqual(['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']);
  });

  it('Reihenhäuser (2×1): 10 Einwohner je Stufe', () => {
    const pop = game('T.pop');
    expect(game("build('reihenhaus', 8, 8, true)")).toBe(true);
    expect(game('T.pop')).toBe(pop + 10);
    game("state.tiles.get('8,8').lvl = 3; recalc()");
    expect(game('T.pop')).toBe(pop + 30);
  });

  it('Baumhaus nur im Wald – der Wald bleibt', () => {
    expect(game("placeError('baumhaus', 6, 6)")).toMatch(/Nur im Wald/);
    game("state.terra.set('6,6', 'forest')");
    expect(game("build('baumhaus', 6, 6, true)")).toBe(true);
    expect(game('terrainAt(6, 6)')).toBe('forest');
  });

  it('Hausboot aufs Wasser direkt am Ufer (auch im Teich)', () => {
    for (let x = 9; x <= 12; x++) for (let y = 9; y <= 12; y++) game(`state.terra.set('${x},${y}', 'water')`);
    game('recalc()');
    expect(game("placeError('hausboot', 7, 7)")).toBe('Aufs Wasser, direkt ans Ufer');
    expect(game("placeError('hausboot', 10, 10)")).toBe('Direkt ans Ufer legen');
    expect(game("build('hausboot', 9, 10, true)")).toBe(true);
  });

  it('Ferienhäuschen nur auf Sand am Wasser – bringt Taler', () => {
    expect(game("placeError('ferienhaus', 6, 6)")).toBe('Nur auf Sand am Wasser (Strand)');
    game("state.terra.set('6,6', 'sand'); recalc()");
    const inc = game('T.inc');
    expect(game("build('ferienhaus', 6, 6, true)")).toBe(true);
    expect(game('T.inc')).toBeGreaterThan(inc + 5);
  });

  it('drei Stufen mit einfachen Bedingungen; alle lassen sich zeichnen', () => {
    for (const b of ['reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']) {
      expect(game(`BUILD_STAGES.${b}.names.length`), b).toBe(3);
      for (let lvl = 1; lvl <= 3; lvl++) for (let rot = 0; rot < 4; rot++) for (const night of [0, 0.8])
        expect(() => game(`night = ${night}; drawObject('${b}', 300, 300, 1, 1000, 6, 6, ${lvl}, { b: '${b}', lvl: ${lvl}, rot: ${rot} })`), `${b} ${lvl}`).not.toThrow();
    }
    game('night = 0');
  });
});

describe('Hausboot an gezackten Küsten', () => {
  it('überall am Ufer der Quelleninsel – auch dort, wo das Wasser das Land nur mit der Ecke berührt', () => {
    game("state.islands.add('quelle'); ownIsland('quelle'); recalc()");
    const bad = game(`(() => {
      const i = ISLE_BY_ID.quelle, out = [];
      for (let y = Math.floor(i.cy - 20); y < i.cy + 20; y++) for (let x = Math.floor(i.cx - 20); x < i.cx + 20; x++) {
        if (terrainAt(x, y) !== 'water' || COVER.has(x + ',' + y)) continue;
        if (!NEAR8.some(([dx, dy]) => ownedTile(x + dx, y + dy) && terrainAt(x + dx, y + dy) !== 'water')) continue;
        const e = placeError('hausboot', x, y);
        if (e) out.push([x, y, e]);
      }
      return out;
    })()`);
    expect(bad).toEqual([]);
  });
});
