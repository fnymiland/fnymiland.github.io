const { loadGame, game } = require('./helpers/load-game');

// Tipps beim ersten Mal (je einer, mit Abstand) und das Tipp-Buch im Menü
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); updateHud()');
  game('lastTipAt = -1e9');
});
const $ = id => document.getElementById(id);
const readyHouse = () => {
  game("for (let y = 5; y <= 9; y++) for (let x = 5; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.tiles.set('7,7', { b: 'haus', lvl: 1, name: 'Mo' }); state.tiles.set('7,8', { b: 'weg', lvl: 1, style: 'sand' }); state.decos.set('8,7', [{ b: 'busch', rot: 0 }, null, null, null]); recalc()");
};

describe('Tipps beim ersten Mal', () => {
  it('während der Einführung kommen keine Tipps', () => {
    readyHouse();
    game('updateHud()');
    expect($('modal').hidden).toBe(true);
  });

  it('das erste ✨ bringt den Tipp zum Ausbauen – nur einmal', () => {
    game('state.tutorial = -1; for (const g of GUIDE) if (g.id !== "ausbau") state.tipsSeen.add(g.id)');
    readyHouse();
    game('updateHud()');
    expect($('modal').hidden).toBe(false);
    expect($('modal-card').textContent).toContain(game('GUIDE.find(g => g.id === "ausbau").title'));
    game('closeModal(); lastTipAt = -1e9; updateHud()');
    expect($('modal').hidden).toBe(true);
    expect(game('state.tipsSeen.has("ausbau")')).toBe(true);
  });

  it('immer nur einer, mit Abstand', () => {
    game('state.tutorial = -1');
    readyHouse();
    game('updateHud()');
    const first = $('modal-card').textContent;
    game('closeModal(); updateHud()');
    expect($('modal').hidden).toBe(true);                      // der nächste erst später
    game('lastTipAt = -1e9; updateHud()');
    expect($('modal').hidden).toBe(false);
    expect($('modal-card').textContent).not.toBe(first);
  });

  it('„Keine Tipps mehr“ stellt sie ab; gesehene Tipps werden gespeichert', () => {
    game('state.tutorial = -1');
    readyHouse();
    game('updateHud()');
    $('m-notips').onclick();
    game('lastTipAt = -1e9; updateHud()');
    expect($('modal').hidden).toBe(true);
    game('save()');
    const s = game('load()');
    expect(s.tipsOff).toBe(true);
    expect(s.tipsSeen.size).toBeGreaterThan(0);
  });
});

describe('Tipp-Buch', () => {
  it('im Menü: alle Tipps zum Nachlesen', () => {
    game('showMenu()');
    $('m-tips').onclick();
    expect(document.querySelectorAll('#modal-card details').length).toBe(game('GUIDE.length'));
    expect(game('GUIDE.length')).toBeGreaterThanOrEqual(12);
  });
});

describe('Tipp-Bedingungen', () => {
  it('ein neues Spiel löst keinen Tipp aus (gesperrte Sehenswürdigkeiten zählen nicht als „weit weg“)', () => {
    expect(game('GUIDE.filter(g => g.when()).map(g => g.id)')).toEqual([]);
  });
});
