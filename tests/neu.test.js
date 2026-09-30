const { loadGame, game } = require('./helpers/load-game');

// „Neu freigeschaltet“: Fenster in der Mitte mit Bild, Wirkung, Tipp und „Ausprobieren“
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; updateHud()');
});
const $ = id => document.getElementById(id);

describe('Neu freigeschaltet', () => {
  it('nach dem Laden kommt nichts', () => {
    game('updateHud()');
    expect($('modal').hidden).toBe(true);
  });

  it('eine Laterne schaltet das Sägewerk frei: Fenster mit Erklärung und Tipp', () => {
    game('state.restore.baum = 1; updateHud()');
    expect($('modal').hidden).toBe(false);
    const txt = $('modal-card').textContent;
    expect(txt).toContain('Neu freigeschaltet');
    expect(txt).toContain('Sägewerk');
    expect(txt).toContain(game("ITEM_TIPS.saege"));
    expect(document.querySelector('#modal-card canvas')).not.toBe(null);     // Bild
  });

  it('„Ausprobieren“ wählt es aus und springt in die richtige Gruppe', () => {
    game('state.restore.baum = 1; updateHud()');
    document.querySelector('[data-try="saege"]').onclick();
    expect($('modal').hidden).toBe(true);
    expect(game('tool')).toBe('saege');
    expect(game('[menuTop, menuSub]')).toEqual(['herstellen', 'werkstatt']);
  });

  it('ist gerade ein anderes Fenster offen, wartet es', () => {
    game("openModal('<h2>Feier</h2><button id=\"m-ok\">ok</button>'); state.restore.baum = 1; updateHud()");
    expect($('modal-card').textContent).toContain('Feier');
    game('closeModal(); updateHud()');
    expect($('modal-card').textContent).toContain('Sägewerk');
  });

  it('Geschenk-Wegstile und die Glasvilla bekommen auch ein Fenster', () => {
    game('state.restore.baum = 2; updateHud()');
    let txt = $('modal-card').textContent;                          // mehrere Seiten („Weiter“)
    while (!txt.includes('Schachbrett') && /Weiter/.test($('m-close').textContent)) { $('m-close').click(); game('updateHud()'); txt = $('modal-card').textContent; }
    expect(txt).toContain('Schachbrett');
    game('closeModal(); state.restore.kristall = 1; updateHud()');
    expect($('modal-card').textContent).toContain('Glasvilla');
  });

  it('jedes freischaltbare Ding hat einen Tipp', () => {
    const missing = game("Object.keys(ITEMS).filter(id => ITEMS[id].cat && !['verschieben', 'abriss'].includes(id) && !ITEM_TIPS[id])");
    expect(missing).toEqual([]);
  });
});
