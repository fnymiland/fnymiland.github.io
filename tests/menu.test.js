const { loadGame, game } = require('./helpers/load-game');

// Baumenü (Variante B): Bauen mit Filtern nach Zweck · Verschönern · Verbinden · Gelände
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal()'); });
const q = sel => [...document.querySelectorAll(sel)];

describe('Baumenü', () => {
  it('jedes Ding steht in genau einer Gruppe', () => {
    const ids = game("Object.keys(ITEMS).filter(id => ITEMS[id].cat)");
    const placed = game('MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)');
    for (const id of ids) expect(placed.filter(p => p === id).length, id).toBe(1);
    expect(placed.every(id => ids.includes(id))).toBe(true);
  });

  it('oben vier Bereiche, bei „Bauen“ darunter die Filter', () => {
    game("menuTop = 'bauen'; menuSub = 'alle'; buildToolbar()");
    expect(q('#cats .cat').map(b => b.dataset.menu)).toEqual(['bauen', 'schoen', 'verbinden', 'land']);
    expect(q('#subcats .sub').map(b => b.dataset.sub)).toEqual(['alle', 'wohnen', 'geld', 'rohstoffe', 'boost', 'bildung', 'strom', 'wunder']);
    expect(document.getElementById('subcats').hidden).toBe(false);
  });

  it('Filter „Geld“ zeigt nur, was Geld bringt – mit Wirkung auf der Karte', () => {
    game("menuTop = 'bauen'; buildToolbar()");
    q('#subcats .sub').find(b => b.dataset.sub === 'geld').onclick();
    const tools = q('#tools .tool').map(b => b.dataset.tool).filter(t => t !== 'look');
    expect(tools).toEqual(['feld', 'muehle', 'fischer', 'baecker', 'fabrik']);
    const muehle = q('#tools .tool').find(b => b.dataset.tool === 'muehle');
    expect(muehle.querySelector('.fx').textContent).toBe('+2/s je Feld');
  });

  it('„Verschönern“ blendet die Filter aus; Wechsel legt ein fremdes Werkzeug weg', () => {
    game("menuTop = 'bauen'; buildToolbar(); setTool('haus')");
    q('#cats .cat').find(b => b.dataset.menu === 'schoen').onclick();
    expect(document.getElementById('subcats').hidden).toBe(true);
    expect(game('tool')).toBe('look');
    expect(q('#tools .tool').some(b => b.dataset.tool === 'baum')).toBe(true);
  });

  it('das Blumenbeet steht bei den Verstärkern, zählt aber weiter als Deko', () => {
    expect(game("MENU[0].groups.find(g => g.id === 'boost').items")).toContain('blumen');
    expect(game("ITEMS.blumen.cat")).toBe('deko');
  });
});
