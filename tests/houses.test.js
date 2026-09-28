const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game("state.owned.add('1,1'); state.money = 99999; state.stars = 5");
  game("for (const t of TECHS) state.techs.add(t.id)");
  game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  game('buildRot = 0; recalc()');
});
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);
const wishes = (x, y) => game(`houseWishes(state.tiles.get('${x},${y}'), ${x}, ${y})`);

describe('Bewohner', () => {
  it('jedes neue Haus bekommt ein Tier mit Namen', () => {
    build('haus', 8, 8);
    const t = game("state.tiles.get('8,8')");
    expect(['katze', 'baer', 'hase']).toContain(t.animal);
    expect(t.name).toMatch(/^[A-ZÄÖÜ]/);
  });

  it('alte Häuser ohne Namen bekommen beim Laden einen – immer denselben', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 })");
    game('nameHouses()');
    const a = game("state.tiles.get('8,8').name");
    game("delete state.tiles.get('8,8').name; delete state.tiles.get('8,8').animal; nameHouses()");
    expect(game("state.tiles.get('8,8').name")).toBe(a);
  });

  it('Name und Tier werden gespeichert', () => {
    build('haus', 8, 8);
    game("state.tiles.get('8,8').name = 'Ottilie'");
    game('save()');
    expect(game('load()').tiles.get('8,8').name).toBe('Ottilie');
  });
});

describe('Wünsche und Ausbauen', () => {
  it('Stufe 2 wünscht sich einen Weg vor der Tür und Deko in der Nähe', () => {
    build('haus', 8, 8);
    game('recalc()');
    expect(wishes(8, 8).list.map(w => [w.id, w.ok])).toEqual([['weg', false], ['deko', false]]);
    build('weg', 8, 9);
    game('state.res.bretter = 10');
    game("buildSmall('blumentopf', 8, 8, 0)");
    game('recalc()');
    expect(wishes(8, 8).ready).toBe(true);
  });

  it('Ausbauen braucht erfüllte Wünsche und Material', () => {
    build('haus', 8, 8);
    game('recalc()');
    game('houseUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(1);
    build('weg', 8, 9);
    game("buildSmall('blumentopf', 8, 8, 0)");
    game('state.res.bretter = 0; recalc()');
    game('houseUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(1);        // Bretter fehlen
    game('state.res.bretter = 2');
    game('houseUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(2);
    expect(game('state.res.bretter')).toBe(0);
    expect(game('T.pop')).toBe(6);
  });

  it('Ruhe: ein Sägewerk direkt daneben stört', () => {
    build('haus', 8, 8); build('haus', 6, 6); build('haus', 6, 7);
    game("state.tiles.get('8,8').lvl = 2; recalc()");
    const ruhe = () => wishes(8, 8).list.find(w => w.id === 'ruhe').ok;
    expect(ruhe()).toBe(true);
    build('saege', 9, 9);
    game('recalc()');
    expect(ruhe()).toBe(false);
  });

  it('Häuser schrumpfen nie – fällt ein Wunsch weg, bleibt die Stufe', () => {
    build('haus', 8, 8);
    build('weg', 8, 9);
    game("buildSmall('blumentopf', 8, 8, 0)");
    game('state.res.bretter = 2; recalc(); houseUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(2);
    game('demolish(8, 9); recalc()');
    expect(game("state.tiles.get('8,8').lvl")).toBe(2);
    expect(wishes(8, 8).list.find(w => w.id === 'weg').ok).toBe(false);
  });

  it('fehlt nur noch ein Wunsch, zeigt das Haus eine Sprechblase (met = total - 1)', () => {
    build('haus', 8, 8);
    build('weg', 8, 9);
    game('recalc()');
    const w = game("T.st.get('8,8').wish");
    expect(w.met).toBe(w.total - 1);
  });
});
