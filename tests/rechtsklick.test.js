const { loadGame, game } = require('./helpers/load-game');

// Block 82: Rechtsklick öffnet nirgends im Spiel das Kontextmenü des Browsers – außer in Texteingaben
beforeAll(() => loadGame());
const menu = sel => game(`(() => { const el = ${sel}; const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); el.dispatchEvent(e); return e.defaultPrevented; })()`);

describe('Rechtsklick (Block 82)', () => {
  it('Karte, Leiste oben, Werkzeugleiste, Seitenfenster, großes Fenster: kein Kontextmenü', () => {
    game("startNew(); closeModal(); state.tutorial = -1; state.tipsOff = true");
    expect(menu('canvas')).toBe(true);
    expect(menu("document.getElementById('toolbar')")).toBe(true);
    expect(menu('document.body')).toBe(true);
    game('openInfo(2, 2)');
    expect(menu("document.querySelector('#panel h3') || document.getElementById('panel')")).toBe(true);
    game('showMenu()');
    expect(menu("document.getElementById('m-close')")).toBe(true);
    expect(menu("document.getElementById('modal')")).toBe(true);
    game('closeModal(); closePanel()');
  });
  it('in Texteingaben bleibt es (Einfügen)', () => {
    game("document.body.insertAdjacentHTML('beforeend', '<input id=\"rk-test\">')");
    expect(menu("document.getElementById('rk-test')")).toBe(false);
    game("document.getElementById('rk-test').remove()");
  });
});

// Nutzer 26.10.2026: „Wenn man auf einen Weg klickt, öffnet sich rechts ein Fenster … hat man den ganzen Bildschirm voller Wege und will
// wegklicken, klickt man einen neuen Weg an und das Fenster bleibt offen“ → Rechtsklick auf die Karte schließt es
describe('Rechtsklick schließt das Infofenster', () => {
  const canvas = () => document.getElementById('world');
  const ev = (type, x, y, button, buttons) => { const e = new window.MouseEvent(type, { clientX: x, clientY: y, button, buttons, bubbles: true });
    Object.defineProperty(e, 'pointerId', { value: 9 }); Object.defineProperty(e, 'pointerType', { value: 'mouse' }); canvas().dispatchEvent(e); };
  const right = (x = 200, y = 200, to = null) => { ev('pointerdown', x, y, 2, 2); if (to) ev('pointermove', to[0], to[1], 2, 2); ev('pointerup', to ? to[0] : x, to ? to[1] : y, 2, 0); };
  beforeEach(() => game("startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; state.terra.set('4,4', 'grass'); build('weg', 4, 4, true); recalc()"));
  it('mit „Ansehen“: Rechtsklick (ohne Ziehen) schließt das offene Fenster', () => {
    game('openInfo(4, 4)');
    expect(game("document.getElementById('panel').hidden")).toBe(false);
    right();
    expect(game("document.getElementById('panel').hidden")).toBe(true);
  });
  it('mit rechts ziehen verschiebt nur die Karte, das Fenster bleibt', () => {
    game('openInfo(4, 4)');
    right(200, 200, [260, 240]);
    expect(game("document.getElementById('panel').hidden")).toBe(false);
  });
  it('mit einem Werkzeug: erst das Werkzeug weg (wie bisher), dann das Fenster', () => {
    game("setTool('haus')");
    right();
    expect(game('tool')).toBe('look');
  });
});
