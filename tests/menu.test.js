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
    // Größen stehen nicht einzeln im Menü, ✋ Verschieben und 🧹 Abreißen nur in der Werkzeugleiste
    const ids = game("Object.keys(ITEMS).filter(id => ITEMS[id].cat && !ITEMS[id].variantOf && !ITEMS[id].old && !['verschieben', 'abriss'].includes(id))");
    const placed = game('MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)');
    for (const id of ids) expect(placed.filter(p => p === id).length, id).toBe(1);
    expect(placed.every(id => ids.includes(id))).toBe(true);
  });

  it('oben fünf Bereiche nach dem, was man tun will; Stadt → Wohnen ist von Anfang an offen', () => {
    game('buildToolbar()');
    expect(q('#cats .cat').map(b => b.dataset.menu)).toEqual(['stadt', 'herstellen', 'einkaufen', 'freizeit', 'gestalten']);
    expect([game('menuTop'), game('menuSub')]).toEqual(['stadt', 'wohnen']);
    expect(tools()).toEqual(['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus']);
  });

  it('Filter ohne „Alle“, der erste ist gewählt', () => {
    game('buildToolbar()');
    const subs = () => q('#subcats .sub').map(b => b.dataset.sub);
    expect(subs()).toEqual(['wohnen', 'einrichtungen', 'verkehr']);
    area('herstellen').onclick();
    expect(subs()).toEqual(['taler', 'rohstoffe', 'veredeln', 'strom']);
    expect(tools().sort()).toEqual(['feld', 'muehle', 'fischer', 'baecker', 'fabrik'].sort());
    area('einkaufen').onclick();
    expect(subs()).toEqual(['laeden', 'essen', 'markt', 'gross']);
    area('freizeit').onclick();
    expect(subs()).toEqual(['kultur', 'wunder', 'fzpark', 'fzfahrt']);
    area('gestalten').onclick();
    expect(subs()).toEqual(['land', 'gruen', 'linien', 'platz', 'besonderes']);
  });

  it('Einordnung: Schule, Post, Hotel sind Einrichtungen; Bahn und Hafen Verkehr; Weg, Parkrasen, Leuchtturm', () => {
    const at = id => game(`menuPlaceOf('${id}')`);
    for (const id of ['schule', 'post', 'apotheke', 'hotel', 'grandhotel']) expect(at(id), id).toEqual({ top: 'stadt', sub: 'einrichtungen' });
    for (const id of ['schiene', 'station', 'hafen', 'bootssteg']) expect(at(id), id).toEqual({ top: 'stadt', sub: 'verkehr' });
    expect(at('baecker')).toEqual({ top: 'herstellen', sub: 'taler' });
    expect(at('stand_obst')).toEqual({ top: 'einkaufen', sub: 'markt' });
    expect(at('weg')).toEqual({ top: 'gestalten', sub: 'land' });
    expect(at('parkrasen')).toEqual({ top: 'gestalten', sub: 'land' });
    expect(at('leuchtturm')).toEqual({ top: 'freizeit', sub: 'wunder' });
    expect(at('kino')).toEqual({ top: 'freizeit', sub: 'kultur' });
  });

  it('jeder Bereich merkt sich seinen Filter', () => {
    game('buildToolbar()');
    area('freizeit').onclick();
    sub('wunder').onclick();
    area('stadt').onclick();
    area('freizeit').onclick();
    expect(game('menuSub')).toBe('wunder');
  });

  it('kein Filter hat mehr als 10 Dinge', () => {
    const all = game('MENU.flatMap(m => m.groups ? m.groups.map(g => g.items.length) : [])');
    expect(Math.max(...all)).toBeLessThanOrEqual(10);
  });

  it('Wechsel des Bereichs legt ein fremdes Werkzeug weg', () => {
    game("buildToolbar(); setTool('haus')");
    area('gestalten').onclick();
    expect(game('tool')).toBe('look');
    expect(tools()).toContain('weg');                                           // Gestalten beginnt mit Wege & Gelände
  });

  it('das Blumenbeet steht bei Deko und zählt im Spiel als Deko', () => {
    expect(game("menuPlaceOf('blumen')")).toEqual({ top: 'gestalten', sub: 'gruen' });
    expect(game("ITEMS.blumen.cat")).toBe('deko');
  });
});
