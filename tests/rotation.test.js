const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game("state.owned.add('1,1'); state.money = 99999; state.res.bretter = 99");
  game("for (const t of TECHS) state.techs.add(t.id)");
  game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  game("state.tiles.set('11,6', { b: 'haus', lvl: 5 }); state.tiles.set('11,7', { b: 'haus', lvl: 5 })");
  game("setTool('haus'); buildRot = 0; recalc()");
});
const weg = (x, y) => game(`state.tiles.set('${x},${y}', { b: 'weg', lvl: 1, style: 'sand' }); recalc()`);
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);

describe('Drehen in vier Richtungen', () => {
  it('⟳ geht reihum durch alle vier Richtungen', () => {
    const seen = [];
    for (let i = 0; i < 4; i++) { game('rotateBuild()'); seen.push(game('buildRot')); }
    expect(seen).toEqual([1, 2, 3, 0]);
  });

  it('das Mausrad dreht auch rückwärts', () => {
    game('rotateBuild(-1)');
    expect(game('buildRot')).toBe(3);
  });

  it('alle Gebäude lassen sich drehen', () => {
    const b = game("Object.keys(ITEMS).filter(id => ['bau', 'bildung', 'laden', 'kultur'].includes(ITEMS[id].cat) && id !== 'feld' && !ROTATABLE.has(id))");
    expect(b).toEqual([]);
  });
});

describe('Automatisch mit der Tür zum Weg', () => {
  const cases = [[[9, 8], 0], [[8, 9], 1], [[7, 8], 2], [[8, 7], 3]];
  for (const [[wx, wy], rot] of cases) {
    it(`Weg bei ${wx},${wy} → Richtung ${rot}`, () => {
      weg(wx, wy);
      expect(build('haus', 8, 8)).toBe(true);
      expect(game("state.tiles.get('8,8').rot")).toBe(rot);
    });
  }

  it('ohne Weg bleibt die gewählte Richtung', () => {
    game('buildRot = 2');
    build('haus', 8, 8);
    expect(game("state.tiles.get('8,8').rot")).toBe(2);
  });

  it('wer selbst dreht, behält seine Richtung – bis zum Werkzeugwechsel', () => {
    weg(9, 8);
    game('hover = { x: 8, y: 8 }; rotateBuild()');       // automatisch wäre 0, gedreht also 1
    build('haus', 8, 8);
    expect(game("state.tiles.get('8,8').rot")).toBe(1);
    game("setTool('look'); setTool('haus')");
    weg(9, 10);
    build('haus', 8, 10);
    expect(game("state.tiles.get('8,10').rot")).toBe(0);
  });

  it('lange Gebäude drehen sich mit der Längsseite zum Weg', () => {
    weg(8, 9); weg(9, 9);                                 // Weg unter der Längsseite (+y)
    expect(build('baecker', 8, 8)).toBe(true);
    expect(game("state.tiles.get('8,8').rot")).toBe(1);
    expect(game("anchorAt(9, 8)")).toBe('8,8');
  });

  it('beim Verschieben dreht sich das Gebäude zum Weg am neuen Platz', () => {
    build('haus', 8, 8);
    weg(10, 11);
    game("setTool('verschieben'); pickUp(8, 8, 0); dropAt(10, 10, 0)");
    expect(game("state.tiles.get('10,10').rot")).toBe(1);
  });
});

describe('Alte Spielstände', () => {
  it('lange Gebäude behalten ihre Grundfläche, die Tür bleibt an der Längsseite', () => {
    const d = game('serialize()');
    d.v = 3;
    d.tiles.push(['8,8', { b: 'saege', lvl: 1 }], ['8,10', { b: 'baecker', lvl: 1, rot: 1 }]);
    game(`state = parseSave(${JSON.stringify(d)}); rebuildCover()`);
    expect(game("state.tiles.get('8,8').rot")).toBe(1);        // war waagerecht (2×1) – bleibt waagerecht
    expect(game("anchorAt(9, 8)")).toBe('8,8');
    expect(game("state.tiles.get('8,10').rot || 0")).toBe(0);  // war senkrecht – bleibt senkrecht
    expect(game("anchorAt(8, 11)")).toBe('8,10');
    // zweimal laden verändert nichts mehr
    game('state = parseSave(serialize()); rebuildCover()');
    expect(game("state.tiles.get('8,8').rot")).toBe(1);
  });
});
