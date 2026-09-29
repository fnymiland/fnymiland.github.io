const { loadGame, game } = require('./helpers/load-game');

// Block 27c: Nach dem Laternenfest tauchen ferne Inseln auf – zufällig, eine nach der anderen, mit Truhe
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e12; state.science = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("state.islands = new Set(['home', ...ISLES.map(i => i.id)]); for (const i of ISLES) ownIsland(i.id); recalc()");
});
const fest = () => game('festival(); closeModal()');
const steg = () => game(`(() => { for (let y = -20; y < 40; y++) for (let x = -20; x < 40; x++) if (placeError('bootssteg', x, y) === null) { build('bootssteg', x, y, true); return [x, y]; } })()`);

describe('Ferne Inseln', () => {
  it('vor dem Laternenfest gibt es keine; danach taucht die erste draußen auf', () => {
    expect(game('FAR.length')).toBe(0);
    expect(game('nextIsle()')).toBe(null);
    fest();
    expect(game('FAR.length')).toBe(1);
    const f = game('FAR[0]');
    expect(f.name).toMatch(/insel/);
    expect(game('nextIsle().id')).toBe(f.id);
    expect(Math.hypot(f.cx - game('ISLAND.cx'), f.cy - game('ISLAND.cy'))).toBeGreaterThan(game('ISLE_DIST + ISLE_R + 20'));
    expect(game(`islandAt(${f.cx}, ${f.cy})`)).toBe(f.id);              // echtes Land
    expect(game(`inWorld(${f.cx}, ${f.cy})`)).toBe(true);               // die Welt reicht bis dort
    expect(game(`regionAt(${f.cx}, ${f.cy})`)).toBe(f.id);
  });

  it('gleicher Spielstand, gleiche Insel (fester Startwert)', () => {
    const a = game('JSON.stringify(makeFar(1))'), b = game('JSON.stringify(makeFar(1))');
    expect(a).toBe(b);
  });

  it('per Expedition entdecken: Truhe in der Mitte, die nächste taucht auf', () => {
    fest();
    steg();
    const f = game('FAR[0]');
    expect(game('expeditionError()')).toBe(null);
    const m0 = game('state.money');
    expect(game('sendExpedition()')).toBe(true);
    expect(game('state.money')).toBe(m0 - f.need.money);
    expect(game('state.expedition.isle')).toBe(f.id);
    game('state.expedition.until = Date.now() - 1; checkExpedition(); closeModal()');
    expect(game(`isleOpen('${f.id}')`)).toBe(true);
    expect(game(`ownedTile(${f.cx}, ${f.cy})`)).toBe(true);
    expect(game(`state.tiles.get('${f.cx},${f.cy}').b`)).toBe('truhe');
    expect(game('FAR.length')).toBe(2);
    const g = game('FAR[1]');
    expect(Math.hypot(g.cx - f.cx, g.cy - f.cy)).toBeGreaterThan(f.r + g.r + 10);   // überlappen nicht
    expect(g.need.money).toBeGreaterThan(f.need.money);                // jede weitere kostet mehr
  });

  it('Truhe öffnen: Belohnung, dann ist sie weg', () => {
    fest();
    game('discoverIsland(FAR[0].id); closeModal()');
    const f = game('FAR[0]'), k = `${f.cx},${f.cy}`;
    const before = game(`({ money: state.money, sci: state.science, res: { ...state.res } })`);
    expect(game(`openChest('${k}')`)).toBe(true);
    const after = game(`({ money: state.money, sci: state.science, res: { ...state.res } })`);
    const gained = after.money > before.money || after.sci > before.sci || Object.keys(after.res).some(r => after.res[r] > before.res[r]);
    expect(gained).toBe(true);
    expect(game(`state.tiles.has('${k}')`)).toBe(false);
    expect(game(`openChest('${k}')`)).toBe(false);
  });

  it('bleibt gespeichert – auch eine laufende Expedition dorthin', () => {
    fest(); steg();
    game('sendExpedition(); save()');
    const s = game('load()');
    expect(s.far.length).toBe(1);
    expect(s.far[0].id).toBe(game('FAR[0].id'));
    expect(s.expedition && s.expedition.isle).toBe(game('FAR[0].id'));
  });

  it('Infofenster der fernen Insel zeigt, was zum Entdecken fehlt', () => {
    fest();
    game('state.money = 0; openIsle(FAR[0].id)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toMatch(/Nächste Insel entdecken/);
    expect(txt).toMatch(/Taler/);
  });

  it('Rathaus zeigt ferne Inseln in der Inselliste', () => {
    fest();
    game("openTownHall('isles')");
    expect(document.getElementById('modal-card').textContent).toContain(game('FAR[0].name'));
  });

  it('neues Spiel: keine fernen Inseln mehr', () => {
    fest();
    game('startNew()');
    expect(game('FAR.length')).toBe(0);
    expect(game('state.far.length')).toBe(0);
  });
});

describe('Truhe im Spiel', () => {
  it('antippen öffnet ein Fenster mit „Öffnen“, abreißen geht nicht', () => {
    game('festival(); closeModal(); discoverIsland(FAR[0].id); closeModal()');
    const f = game('FAR[0]');
    game(`openInfo(${f.cx}, ${f.cy})`);
    expect(document.getElementById('panel').textContent).toMatch(/Öffnen/);
    expect(game(`demolishInfo(${f.cx}, ${f.cy}).err`)).toMatch(/Truhe/);
    const m0 = game('state.money + state.science');
    document.getElementById('p-chest').click();
    expect(game(`state.tiles.has('${f.cx},${f.cy}')`)).toBe(false);
    expect(() => game(`drawObject('truhe', 300, 300, 1.5, 1000, 0, 0, 1, { b: 'truhe' })`)).not.toThrow();
  });

  it('die Ziel-Karte zeigt nach dem Fest die ferne Insel', () => {
    game('festival(); closeModal()');
    expect(game('goalHtml()')).toContain(game('FAR[0].name'));
  });
});
