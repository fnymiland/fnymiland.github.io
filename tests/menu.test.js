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
    const ids = game("Object.keys(ITEMS).filter(id => ITEMS[id].cat && !ITEMS[id].variantOf && !ITEMS[id].old && !ITEMS[id].gift && !['verschieben', 'abriss'].includes(id))");
    const placed = game('MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)');
    for (const id of ids) expect(placed.filter(p => p === id).length, id).toBe(1);
    expect(placed.every(id => ids.includes(id))).toBe(true);
  });

  it('eine Reihe mit fünf Bereichen; ein Bereich klappt darüber ein Feld mit allem auf, Gruppen als Überschriften (Entwurf B)', () => {
    game('setSheet(false); buildToolbar()');
    expect(q('#cats .cat').map(b => b.dataset.menu)).toEqual(['stadt', 'herstellen', 'einkaufen', 'freizeit', 'gestalten']);
    expect(game("document.getElementById('toolbar').classList.contains('open')")).toBe(false);   // zu Beginn zu
    area('stadt').onclick();
    expect(game("document.getElementById('toolbar').classList.contains('open')")).toBe(true);
    expect(q('#tools .sheet-h').map(h => h.dataset.group)).toEqual(['wohnen', 'einrichtungen', 'verkehr']);
    expect(tools()).toEqual(game("MENU[0].groups.flatMap(g => [...g.items.filter(available), ...g.items.filter(id => !available(id))])"));
    expect(q('#subcats .sub').length).toBe(0);                                   // keine Gruppenzeile mehr
  });
  it('alle Bereiche: jede Gruppe als Überschrift, jedes Ding mit Namen', () => {
    game('setSheet(false); buildToolbar()');
    for (const m of game('MENU.map(m => m.id)')) {
      area(m).onclick();
      expect(q('#tools .sheet-h').map(h => h.dataset.group), m).toEqual(game(`MENU.find(x => x.id === '${m}').groups.map(g => g.id)`));
      expect(q('#tools .tool').every(b => b.querySelector('.nm') && b.querySelector('.nm').textContent === game(`ITEMS['${b.dataset.tool}'].name`)), m).toBe(true);
      area(m).onclick();                                                          // nochmal: zu
      expect(game("document.getElementById('toolbar').classList.contains('open')"), m).toBe(false);
    }
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

  it('kein Filter hat mehr als 10 Dinge', () => {
    const all = game('MENU.flatMap(m => m.groups ? m.groups.map(g => g.items.length) : [])');
    expect(Math.max(...all)).toBeLessThanOrEqual(10);
  });

  it('Bereich wechseln lässt das gewählte Werkzeug in der Hand; eine Wahl, Esc oder daneben tippen klappt zu', () => {
    game("setSheet(false); buildToolbar(); setTool('haus')");
    area('gestalten').onclick();
    expect(game('tool')).toBe('haus');
    expect(tools()).toContain('weg');
    expect(area('stadt').classList.contains('has-tool')).toBe(true);           // dort steckt das Haus
    document.querySelector('#tools [data-tool="baum"]').click();
    expect([game('tool'), game("document.getElementById('toolbar').classList.contains('open')")]).toEqual(['baum', false]);
    area('stadt').onclick();
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(game("document.getElementById('toolbar').classList.contains('open')")).toBe(false);
    expect(game('tool')).toBe('baum');                                        // Esc klappt nur zu
    area('stadt').onclick();
    document.getElementById('world').dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true }));
    expect(game("document.getElementById('toolbar').classList.contains('open')")).toBe(false);
  });

  it('das Blumenbeet steht bei Deko und zählt im Spiel als Deko', () => {
    expect(game("menuPlaceOf('blumen')")).toEqual({ top: 'gestalten', sub: 'gruen' });
    expect(game("ITEMS.blumen.cat")).toBe('deko');
  });
});
