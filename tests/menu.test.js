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

  it('oben sechs Bereiche nach einer Regel; Wohnen ohne Filter und von Anfang an offen', () => {
    game('buildToolbar()');
    expect(q('#cats .cat').map(b => b.dataset.menu)).toEqual(['wohnen', 'herstellen', 'verkaufen', 'freizeit', 'deko', 'wege']);
    expect(game('menuTop')).toBe('wohnen');
    expect(q('#subcats .sub').length).toBe(0);
    expect(tools()).toEqual(['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']);
  });

  it('Filter ohne „Alle“, der erste ist gewählt', () => {
    game('buildToolbar()');
    area('herstellen').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['taler', 'rohstoffe', 'veredeln', 'strom']);
    expect(tools()).toEqual(['feld', 'muehle', 'fischer', 'baecker', 'fabrik'].filter(id => game(`available('${id}')`))
      .concat(['feld', 'muehle', 'fischer', 'baecker', 'fabrik'].filter(id => !game(`available('${id}')`))));
    area('verkaufen').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['laeden', 'essen', 'markt', 'gross']);
    area('freizeit').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['bildung', 'kultur', 'wunder']);
    area('wege').onclick();
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['bahn', 'schiff', 'land']);
  });

  it('die Regel: Herstellen ohne Kundschaft, Verkaufen nur mit (alle Läden), Freizeit Bildung/Kultur/Wunder', () => {
    const items = top => game(`MENU.find(m => m.id === '${top}').groups.flatMap(g => g.items)`);
    expect(items('herstellen').some(id => game(`!!ITEMS.${id}.shop`))).toBe(false);
    const shops = game("Object.keys(SHOPS).filter(id => ITEMS[id].cat === 'laden')");
    expect(shops.every(id => items('verkaufen').includes(id) || game(`!!SHOPS.${id}.hotel`))).toBe(true);   // Hotels: zieht an → Freizeit
    expect(items('herstellen')).toContain('baecker');
    expect(game("menuPlaceOf('baecker')")).toEqual({ top: 'herstellen', sub: 'taler' });
    expect(game("menuPlaceOf('stand_obst')")).toEqual({ top: 'verkaufen', sub: 'markt' });
    expect(game("menuPlaceOf('hotel')")).toEqual({ top: 'freizeit', sub: 'kultur' });
    expect(game("menuPlaceOf('leuchtturm')")).toEqual({ top: 'freizeit', sub: 'wunder' });
    expect(game("menuPlaceOf('obst')")).toEqual({ top: 'herstellen', sub: 'rohstoffe' });
    expect(game("menuPlaceOf('hafen')")).toEqual({ top: 'wege', sub: 'schiff' });
    expect(game("menuPlaceOf('blumen')")).toEqual({ top: 'deko', sub: 'alle' });
  });

  it('jeder Bereich merkt sich seinen Filter', () => {
    game('buildToolbar()');
    area('freizeit').onclick();
    sub('kultur').onclick();
    area('wohnen').onclick();
    area('freizeit').onclick();
    expect(game('menuSub')).toBe('kultur');
  });

  it('kein Filter hat mehr als 10 Dinge', () => {
    const all = game('MENU.flatMap(m => m.groups ? m.groups.map(g => g.items.length) : [])');
    expect(Math.max(...all)).toBeLessThanOrEqual(10);
  });

  it('„Deko“ hat keine Filter; Wechsel legt ein fremdes Werkzeug weg', () => {
    game("buildToolbar(); setTool('haus')");
    area('deko').onclick();
    expect(q('#subcats .sub').length).toBe(0);
    expect(game('tool')).toBe('look');
    expect(tools()).toContain('baum');
  });

  it('das Blumenbeet steht bei Deko und zählt im Spiel als Deko', () => {
    expect(game("MENU.find(m => m.id === 'deko').items")).toContain('blumen');
    expect(game("ITEMS.blumen.cat")).toBe('deko');
  });
});
