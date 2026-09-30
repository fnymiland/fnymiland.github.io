const { loadGame, game } = require('./helpers/load-game');

// Block 44: Park zum Selberbauen – Parkrasen malen, Deko darauf, daraus wird Grünanlage / Park / Stadtpark
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});
const build = (b, x, y) => game(`build('${b}', ${x}, ${y}, true)`);
const lawn = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) build('parkrasen', x, y); game('recalc()'); };

describe('Parkrasen', () => {
  it('ist ein Boden, der als Wiese zählt; steht im Menü unter Gestalten → Grün, der alte 3×3-Park nicht mehr', () => {
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(game("terraLook(10, 10)")).toBe('park');
    expect(game("terrainAt(10, 10)")).toBe('grass');
    expect(game("menuPlaceOf('parkrasen')")).toEqual({ top: 'gestalten', sub: 'gruen' });
    expect(game("menuItemsOf('gestalten', 'gruen')")).not.toContain('park');
  });

  it('auf den Rasen gehören nur Deko und Wege, keine Häuser', () => {
    lawn(10, 10, 3, 3);
    expect(build('baum', 10, 10)).toBe(true);
    expect(build('brunnen', 11, 11)).toBe(true);
    expect(build('weg', 12, 10)).toBe(true);
    expect(game("placeError('haus', 10, 12)")).toBe('Auf den Parkrasen gehören nur Deko und Wege');
  });

  it('darf unter Deko und Wege gemalt werden, nicht unter Gebäude', () => {
    build('brunnen', 10, 10); build('weg', 11, 10); build('haus', 12, 10);
    expect(build('parkrasen', 10, 10)).toBe(true);
    expect(build('parkrasen', 11, 10)).toBe(true);
    expect(game("placeError('parkrasen', 12, 10)")).toMatch(/Gebäude/);
  });
});
