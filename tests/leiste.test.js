const { loadGame, game } = require('./helpers/load-game');

// Block 36: schmale Kacheln (Bild + Preis), Klick zeigt rechts das Bau-Infofenster; Handy: ⓘ im Hinweis
beforeAll(() => loadGame());
beforeEach(() => { size(1024, 768); game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true"); });
afterAll(() => size(1024, 768));
function size(w, h) {
  Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
  game('resize()');
}
const $ = id => document.getElementById(id);
const card = id => document.querySelector(`#tools [data-tool="${id}"]`);
const panel = () => $('panel');
const open = (top, sub = 'alle') => game(`menuTop = '${top}'; menuSub = '${sub}'; buildToolbar(); updateHud()`);

describe('Kacheln', () => {
  it('zeigen nur Bild und Preis; der Name steht im Tooltip und für Vorleser', () => {
    open('wohnen');
    const b = card('haus');
    expect(b.querySelector('canvas')).not.toBe(null);
    expect(b.querySelector('.cost').textContent).toBe('🪙 40');
    expect(b.querySelector('.name')).toBe(null);
    expect(b.querySelector('.fx')).toBe(null);
    expect(b.textContent).toBe('🪙 40');
    expect(b.title).toBe('Haus');
    expect(b.getAttribute('aria-label')).toBe('Haus');
  });

  it('große Preise kurz: Tsd. und Mio.', () => {
    expect(game('shortMoney(150)')).toBe('150');
    expect(game('shortMoney(2500)')).toBe('2.500');
    expect(game('shortMoney(12000)')).toBe('12 Tsd.');
    expect(game('shortMoney(12345)')).toBe('12,3 Tsd.');
    expect(game('shortMoney(500000)')).toBe('500 Tsd.');
    expect(game('shortMoney(1200000)')).toBe('1,2 Mio.');
  });

  it('Freigeschaltetes zuerst, Gesperrtes mit Schloss dahinter – in Menü-Reihenfolge', () => {
    open('stadt', 'laeden');
    const shown = [...document.querySelectorAll('#tools .tool')];
    const locked = shown.map(b => b.classList.contains('locked'));
    expect(locked.indexOf(true)).toBeGreaterThan(-1);
    expect(locked.slice(locked.indexOf(true)).every(Boolean)).toBe(true);       // hinter dem ersten gesperrten nur gesperrte
    expect(shown.filter(b => b.classList.contains('locked')).every(b => b.querySelector('.lock'))).toBe(true);
    game('state.restore.ruine = 1; updateHud()');                               // Buchladen wird frei → rückt nach vorn
    const ids = [...document.querySelectorAll('#tools .tool')].map(b => b.dataset.tool);
    const firstLocked = [...document.querySelectorAll('#tools .tool')].findIndex(b => b.classList.contains('locked'));
    expect(ids.indexOf('buchladen')).toBeLessThan(firstLocked);
  });

  it('Zahlentasten wählen wie die Leiste sortiert ist', () => {
    open('stadt', 'laeden');
    const first = game('menuList()[0]');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: '1' }));
    expect(game('tool')).toBe(first);
  });
});

describe('Bau-Infofenster (iPad/Mac)', () => {
  it('Kachel anklicken wählt aus und zeigt rechts alles Wichtige', () => {
    open('stadt', 'essen');
    game('state.lanterns = 99; state.money = 1e6; state.res.bretter = 100; updateHud()');
    card('cafe').click();
    expect(game('tool')).toBe('cafe');
    expect(panel().hidden).toBe(false);
    const txt = panel().textContent;
    expect(txt).toContain('Café');
    expect(txt).toContain(game('FX.cafe'));
    expect(txt).toContain('🪙 500');
    expect(txt).toContain('Bretter');
    expect(txt).toContain('👷 1 Mitarbeiter');
    expect(txt).toContain(game('ITEM_TIPS.cafe'));
  });

  it('bleibt offen, wenn die Leiste sich neu aufbaut; schließt beim Weglegen und bei einem anderen Werkzeug', () => {
    open('wohnen');
    card('haus').click();
    game('buildToolbar()');
    expect(panel().hidden).toBe(false);
    card('haus').click();                                                         // nochmal: weglegen
    expect(game('tool')).toBe('look');
    expect(panel().hidden).toBe(true);
    card('haus').click();
    game("setTool('weg')");
    expect(panel().hidden).toBe(true);
    card('haus').click();
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(panel().hidden).toBe(true);
  });

  it('gesperrt: sagt, wie man es freischaltet', () => {
    open('stadt', 'kultur');
    card('theater').click();
    expect(panel().textContent).toContain('🔒 Freischalten');
    expect(panel().textContent).toContain('Laternenfest');
  });

  it('zu wenig Geld: Preis rot, und der Preis wird live grün', () => {
    open('wohnen');
    game('state.money = 0; updateHud()');
    card('haus').click();
    expect(panel().querySelector('.stats span.bad')).not.toBe(null);
    game('state.money = 1000; updateHud()');
    expect(panel().querySelector('.stats span.bad')).toBe(null);
  });

  it('der Hinweis ist dann kurz (nur wie man baut), ohne Infofenster ausführlich', () => {
    open('wohnen');
    card('haus').click();
    expect($('hint').textContent.startsWith('Haus · ')).toBe(true);
    expect($('hint').textContent).not.toContain(game('ITEMS.haus.desc'));
    game('closePanel()');
    expect($('hint').textContent).toContain(game('ITEMS.haus.desc'));
  });

  it('ein Gebäude-Infofenster ersetzt das Bau-Infofenster sauber', () => {
    open('wohnen');
    card('haus').click();
    game("showPanel('<h3>Anderes</h3>')");
    expect(game('buildInfo')).toBe(null);
    expect(panel().classList.contains('build-info')).toBe(false);
  });
});

describe('Handy', () => {
  it('Kachel antippen öffnet kein Fenster; ⓘ im Hinweis öffnet es, Tippen auf die Karte schließt es', () => {
    size(375, 812);
    open('wohnen');
    card('haus').click();
    expect(game('tool')).toBe('haus');
    expect(panel().hidden).toBe(true);
    const i = document.querySelector('#hint .hint-info');
    expect(i).not.toBe(null);
    expect(i.getAttribute('aria-label')).toBe('Mehr über Haus');
    i.click();
    expect(panel().hidden).toBe(false);
    expect(panel().textContent).toContain('Haus');
    const e = new window.MouseEvent('pointerdown', { clientX: 100, clientY: 100, button: 0, buttons: 1, bubbles: true });
    Object.defineProperty(e, 'pointerId', { value: 7 }); Object.defineProperty(e, 'pointerType', { value: 'touch' });
    document.getElementById('world').dispatchEvent(e);
    expect(panel().hidden).toBe(true);
    expect(game('tool')).toBe('haus');
  });
});
