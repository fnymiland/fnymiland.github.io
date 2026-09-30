const { loadGame, game } = require('./helpers/load-game');

// Baumenü (Block 36): Wohnen · Arbeit · Stadt · Schön · Verbinden · Gelände; Arbeit und Stadt mit Filtern, kein „Alle“
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal()'); });
const q = sel => [...document.querySelectorAll(sel)];
const area = id => q('#cats .cat').find(b => b.dataset.menu === id);
const sub = id => q('#subcats .sub').find(b => b.dataset.sub === id);
const tools = () => q('#tools .tool').map(b => b.dataset.tool);

describe('Baumenü', () => {
  it('jedes Ding steht in genau einer Gruppe', () => {
    const ids = game("Object.keys(ITEMS).filter(id => ITEMS[id].cat)");
    const placed = game('MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)');
    for (const id of ids) expect(placed.filter(p => p === id).length, id).toBe(1);
    expect(placed.every(id => ids.includes(id))).toBe(true);
  });

  it('oben sechs Bereiche; Wohnen ohne Filter und von Anfang an offen', () => {
    game('buildToolbar()');
    expect(q('#cats .cat').map(b => b.dataset.menu)).toEqual(['wohnen', 'arbeit', 'stadt', 'schoen', 'verbinden', 'land']);
    expect(game('menuTop')).toBe('wohnen');
    expect(document.getElementById('subcats').hidden).toBe(true);
    expect(tools()).toEqual(['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']);
  });

  it('Arbeit und Stadt: Filter ohne „Alle“, der erste ist gewählt', () => {
    game('buildToolbar()');
    area('arbeit').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['betriebe', 'rohstoffe', 'strom', 'boost']);
    expect(game('menuSub')).toBe('betriebe');
    expect(tools()).toEqual(['feld', 'muehle', 'fischer', 'baecker', 'fabrik']);
    area('stadt').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['laeden', 'essen', 'gross', 'kultur', 'bildung', 'wunder']);
    expect(game('menuSub')).toBe('laeden');
  });

  it('jeder Bereich merkt sich seinen Filter', () => {
    game('buildToolbar()');
    area('stadt').onclick();
    sub('kultur').onclick();
    area('wohnen').onclick();
    area('stadt').onclick();
    expect(game('menuSub')).toBe('kultur');
  });

  it('Läden in drei Gruppen: Läden, Essen, Großstadt – kein Filter hat mehr als 11 Dinge', () => {
    const groups = game("MENU.find(m => m.id === 'stadt').groups.map(g => [g.id, g.items.length])");
    expect(Object.fromEntries(groups)).toMatchObject({ laeden: 10, essen: 9, gross: 6, kultur: 7 });
    const all = game('MENU.flatMap(m => m.groups ? m.groups.map(g => g.items.length) : [])');
    expect(Math.max(...all)).toBeLessThanOrEqual(11);
    expect(game("menuPlaceOf('cafe')")).toEqual({ top: 'stadt', sub: 'essen' });
    expect(game("menuPlaceOf('baum')")).toEqual({ top: 'schoen', sub: 'alle' });
  });

  it('„Schön“ blendet die Filter aus; Wechsel legt ein fremdes Werkzeug weg', () => {
    game("buildToolbar(); setTool('haus')");
    area('schoen').onclick();
    expect(document.getElementById('subcats').hidden).toBe(true);
    expect(game('tool')).toBe('look');
    expect(tools()).toContain('baum');
  });

  it('das Blumenbeet steht bei den Verstärkern, zählt aber weiter als Deko', () => {
    expect(game("MENU.find(m => m.id === 'arbeit').groups.find(g => g.id === 'boost').items")).toContain('blumen');
    expect(game("ITEMS.blumen.cat")).toBe('deko');
  });
});
