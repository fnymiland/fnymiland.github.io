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
