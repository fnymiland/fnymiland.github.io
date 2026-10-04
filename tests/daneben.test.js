const { loadGame, game } = require('./helpers/load-game');

// Block 81: Daneben tippen schließt Fenster – große Fenster nur, wenn man auch daneben gedrückt hat; Seitenfenster auch übers Meer
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true"); });
const ev = (type, target) => game(`document.getElementById('${target}').dispatchEvent(new (window.PointerEvent || MouseEvent)('${type}', { bubbles: true }))`);

describe('Daneben tippen (Block 81)', () => {
  it('großes Fenster: daneben drücken und loslassen schließt', () => {
    game('showMenu()');
    ev('pointerdown', 'modal'); ev('pointerup', 'modal'); ev('click', 'modal');
    expect(game("document.getElementById('modal').hidden")).toBe(true);
  });
  it('großes Fenster: im Fenster drücken und daneben loslassen schließt nicht (Text markieren, Regler)', () => {
    game('showMenu()');
    ev('pointerdown', 'modal-card'); ev('pointerup', 'modal'); ev('click', 'modal');
    expect(game("document.getElementById('modal').hidden")).toBe(false);
    ev('pointerdown', 'modal'); ev('pointerup', 'modal-card'); ev('click', 'modal');      // umgekehrt: daneben drücken, drinnen loslassen
    expect(game("document.getElementById('modal').hidden")).toBe(false);
    game('closeModal()');
  });
  it('Seitenfenster: aufs Meer getippt schließt es (wie Rasen)', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1, rot: 0 }); recalc(); openInfo(8, 8)");
    expect(game("document.getElementById('panel').hidden")).toBe(false);
    const [sx, sy] = game('(() => { for (let y = -60; y < 60; y++) for (let x = -60; x < 60; x++) if (isSea(x, y) && !ownedTile(x, y)) { const p = toScreen(x, y); return [p.x, p.y]; } })()');
    game(`tap(${sx}, ${sy}, false)`);
    expect(game("document.getElementById('panel').hidden")).toBe(true);
  });
});
