const { loadGame, game } = require('./helpers/load-game');

// Offene Fenster aktualisieren sich von selbst (updateHud läuft im Spiel alle 200 ms)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal(); closePanel()');
});
const $ = id => document.getElementById(id);

describe('Fenster aktualisieren sich live', () => {
  it('Sehenswürdigkeit: der Knopf wird grün, sobald das Geld reicht – ohne neu anzuklicken', () => {
    game("state.islands.add('wald'); ownIsland('wald'); state.res.holz = 99; recalc()");
    const need = game("restoreInfo('baum').money");
    game(`state.money = ${need - 10}`);
    game("openLandmark(...lmTile('baum'))");
    const btn = $('p-restore');
    expect(btn.disabled).toBe(true);
    game(`state.money = ${need}; updateHud()`);
    expect($('p-restore').disabled).toBe(false);
    expect($('p-restore')).toBe(btn);                          // derselbe Knopf, nur umgestellt
    expect($('panel').textContent).not.toContain('Zu wenig Taler');
  });

  it('Insel: Bedingungen werden abgehakt, sobald sie erfüllt sind', () => {
    game("state.tiles.set('0,0', { b: 'bootssteg', lvl: 1 }); recalc(); openIsle('wald')");
    expect($('p-expo').disabled).toBe(true);
    game("state.money = 1000; state.tiles.set('4,4', { b: 'haus', lvl: 1 }); state.tiles.set('6,4', { b: 'haus', lvl: 1 }); recalc(); updateHud()");
    expect($('p-expo').disabled).toBe(false);
  });

  it('Forschung: Erforschen-Knopf und Ideen-Anzeige folgen dem Stand', () => {
    game("state.tiles.set('8,8', { b: 'schule', lvl: 1 }); recalc(); state.science = 0; openResearch('wissen')");
    const btn = document.querySelector('[data-tech="forst"]');
    expect(btn.disabled).toBe(true);
    game('state.science = 500; updateHud()');
    expect(document.querySelector('[data-tech="forst"]').disabled).toBe(false);
    expect(document.querySelector('.sci-have').textContent).toContain('500');
  });

  it('Gebäude: Ausbau-Kosten zählen mit', () => {
    game("state.money = 0; state.tiles.set('4,4', { b: 'haus', lvl: 1 }); state.tiles.set('5,4', { b: 'feld', lvl: 1 }); recalc(); openInfo(5, 4)");
    const before = $('panel').textContent;
    game('state.money = 7; updateHud()');
    expect($('panel').textContent).not.toBe(before);
    expect($('panel').textContent).toMatch(/🪙 7\//);
  });

  it('beim Umbenennen wird das Eingabefeld nicht weggeworfen', () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 1, name: 'Mo' }); recalc(); openInfo(4, 4)");
    $('p-rename').onclick();
    const inp = $('p-name-in');
    inp.value = 'Lu';
    game('state.money += 500; updateHud()');
    expect($('p-name-in')).toBe(inp);
    expect(inp.value).toBe('Lu');
  });

  it('abgerissenes Gebäude: das Fenster geht zu', () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 1 }); recalc(); openInfo(4, 4)");
    game("state.tiles.delete('4,4'); recalc(); updateHud()");
    expect($('panel').hidden).toBe(true);
  });

  it('ein anderes Fenster wird nicht vom alten überschrieben', () => {
    game("state.money = 1000; state.tiles.set('4,4', { b: 'haus', lvl: 1 }); recalc(); openInfo(4, 4)");
    game("buildSmall('blumentopf', 5, 5, 0); openDecoInfo(5, 5, 0); updateHud()");
    expect($('panel').textContent).toContain('Blumentopf');
  });
});

describe('Leiste unten', () => {
  it('schaltet frei, sobald die Bedingung erfüllt ist – ohne neu zu öffnen', () => {
    game("menuTop = 'herstellen'; menuSub = 'werkstatt'; buildToolbar(); updateHud()");
    expect(document.querySelector('[data-tool="saege"]').classList.contains('locked')).toBe(true);
    game('state.restore.baum = 1; updateHud()');
    expect(document.querySelector('[data-tool="saege"]').classList.contains('locked')).toBe(false);
  });
});
