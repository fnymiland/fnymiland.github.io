const { loadGame, game } = require('./helpers/load-game');

// Block 49: gesperrte Dinge – ein Knopf im Info-Fenster springt dorthin, wo man sie freischaltet
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true"); });
const open = id => game(`openBuildInfo('${id}')`);
const btn = () => game("document.getElementById('p-unlock') && document.getElementById('p-unlock').textContent");

describe('Freischalten per Knopf', () => {
  it('Forschung: öffnet die Forschung und leuchtet bei der richtigen', () => {
    game("state.techs.delete('offshore')");
    open('offshore');
    expect(btn()).toMatch(/Forschung/);
    game("document.getElementById('p-unlock').click()");
    expect(game("!document.getElementById('modal').hidden")).toBe(true);
    expect(game("document.querySelector('#modal [data-techid=\"offshore\"]').classList.contains('spot')")).toBe(true);
  });

  it('Kunstakademie: die Laterne leuchtet dort auf', () => {
    game("state.design.delete('laterne')");
    open('laterne');
    expect(btn()).toMatch(/Kunstakademie/);
    game("document.getElementById('p-unlock').click()");
    expect(game("!!document.querySelector('#modal .design.spot')")).toBe(true);
  });

  it('Sehenswürdigkeit: fährt hin und öffnet ihr Fenster', () => {
    const lm = game("ITEMS.baumhaus.lm");                                     // z. B. 'baum:2'
    game(`state.restore['${lm.split(':')[0]}'] = 0`);
    open('baumhaus');
    expect(btn()).toMatch(/Sehenswürdigkeit/);
    game("document.getElementById('p-unlock').click()");
    expect(game("document.querySelector('#panel h3').textContent")).toContain(game(`LANDMARKS['${lm.split(':')[0]}'].name`));
  });

  it('Album-Seite: öffnet das Album bei der Seite; ohne Fenster (Sterne, Garten …) nur der Text', () => {
    open('rosenbogen');
    expect(btn()).toMatch(/Album/);
    game("document.getElementById('p-unlock').click()");
    expect(game("!!document.querySelector('#modal .album-page.spot')")).toBe(true);
    game('closeModal()');
    open('palme');                                                           // Botanischer Garten
    expect(btn()).toBeFalsy();
  });

  it('freigeschaltete Dinge haben keinen Knopf', () => {
    open('haus');
    expect(btn()).toBeFalsy();
  });
});
