const { loadGame, game } = require('./helpers/load-game');

// Handy (kürzere Seite < 540 px): eigene Anordnung – iPad und Desktop bleiben, wie sie sind
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true'); });
afterEach(() => size(1024, 768));
function size(w, h) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
  game('resize()');
}
const body = () => document.body.classList;
const bar = () => document.getElementById('toolbar').classList;
const catBtn = id => document.querySelector(`#cats [data-menu="${id}"]`);

describe('Handy erkennen', () => {
  it('Handy hoch und quer ist .phone, iPad und Desktop nie', () => {
    for (const [w, h, phone, land] of [[375, 812, true, false], [812, 375, true, true], [430, 932, true, false],
      [768, 1024, false, false], [1024, 768, false, false], [1366, 1024, false, false], [1440, 900, false, false]]) {
      size(w, h);
      expect([w, h, body().contains('phone'), body().contains('phone-land')]).toEqual([w, h, phone, land]);
      expect(game('PHONE')).toBe(phone);
    }
  });
});

describe('Leiste auf dem Handy', () => {
  it('ist eingeklappt; ein Bereich klappt den Katalog auf, nochmal antippen klappt ihn zu', () => {
    size(375, 812);
    game('buildToolbar()');
    expect(bar().contains('open')).toBe(false);
    catBtn('wohnen').click();
    expect(bar().contains('open')).toBe(true);
    catBtn('wohnen').click();
    expect(bar().contains('open')).toBe(false);
  });

  it('Werkzeug wählen oder auf die Karte tippen klappt ihn zu', () => {
    size(375, 812);
    game('buildToolbar()');
    catBtn('wohnen').click();
    document.querySelector('#tools [data-tool="haus"]').click();
    expect(game('tool')).toBe('haus');
    expect(bar().contains('open')).toBe(false);
    catBtn('wohnen').click();
    const e = new window.MouseEvent('pointerdown', { clientX: 100, clientY: 100, button: 2, buttons: 2, bubbles: true });
    Object.defineProperty(e, 'pointerId', { value: 5 }); Object.defineProperty(e, 'pointerType', { value: 'touch' });
    document.getElementById('world').dispatchEvent(e);
    expect(bar().contains('open')).toBe(false);
  });

  it('der Hinweis ist kurz: Name, Preis, wie man baut', () => {
    size(375, 812);
    game("setTool('haus')");
    expect(document.getElementById('hint').textContent).toBe('Haus · 🪙 40 · Platz antippen, nochmal tippen baut ⓘ');
    game("setTool('weg')");
    expect(document.getElementById('hint').textContent).toMatch(/^Weg · 🪙 5 · Anfang und Ende antippen ⓘ$/);
  });

  it('Desktop/iPad: Bereiche klappen nichts, der Hinweis ohne Beschreibung', () => {
    size(1024, 768);
    game('buildToolbar()');
    catBtn('wohnen').click();
    expect(bar().contains('open')).toBe(false);
    game("setTool('haus')");
    expect(document.getElementById('hint').textContent).not.toContain(game('ITEMS.haus.desc'));   // Beschreibung steht im Infofenster
  });
});

describe('Zielkasten auf dem Handy', () => {
  it('von selbst klein, antippen klappt ihn auf; auf dem Desktop von selbst groß', () => {
    size(375, 812);
    game('goalSmall = null; updateHud()');
    const goal = document.getElementById('goal');
    expect(goal.classList.contains('small')).toBe(true);
    goal.click();
    expect(goal.classList.contains('small')).toBe(false);
    size(1024, 768);
    game('goalSmall = null; updateHud()');
    expect(goal.classList.contains('small')).toBe(false);
  });
});

describe('Infofenster auf dem Handy', () => {
  it('hat oben einen Griff (antippen = groß/klein), auf dem Desktop nicht', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); recalc()");
    size(375, 812);
    game('openInfo(6, 6)');
    const panel = document.getElementById('panel'), grip = () => panel.querySelector('.grip');
    expect(grip()).not.toBe(null);
    grip().click();
    expect(panel.classList.contains('tall')).toBe(true);
    grip().click();
    expect(panel.classList.contains('tall')).toBe(false);
    game('closePanel()');
    size(1024, 768);
    game('openInfo(6, 6)');
    expect(grip()).toBe(null);
  });
});
