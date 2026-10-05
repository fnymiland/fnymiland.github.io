const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
const path = require('path');

// Block 84e: Oberfläche und Texte – Fehler aus der großen Fehlersuche
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true"); });
const ev = (el, type, y, pointerType = 'touch', x = 0) => game(`(() => { const e = new MouseEvent('${type}', { bubbles: true, clientX: ${x}, clientY: ${y} }); Object.defineProperty(e, 'pointerType', { value: '${pointerType}' }); ${el}.dispatchEvent(e); })()`);

describe('Oberfläche (84e)', () => {
  it('Handy-Griff: ein abgebrochener Wisch schließt beim nächsten Tipp nicht das Fenster', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); recalc(); openInfo(8, 8); document.getElementById('panel').insertAdjacentHTML('afterbegin', '<div class=\"grip\"></div>')");
    ev("document.querySelector('#panel .grip')", 'pointerdown', 100);
    ev("document.getElementById('panel')", 'pointercancel', 100);
    ev("document.querySelector('#panel button')", 'pointerdown', 160);
    ev("document.querySelector('#panel button')", 'pointerup', 160);
    expect(game("document.getElementById('panel').hidden")).toBe(false);
  });
  it('Infofenster: unter 600 px kein festes „top“ mehr', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); recalc(); openInfo(8, 8); window.innerWidth = 1000; updateHud()");
    expect(game("document.getElementById('panel').style.top")).not.toBe('');
    game('window.innerWidth = 500; updateHud()');
    expect(game("document.getElementById('panel').style.top")).toBe('');
    game('window.innerWidth = 1024');
  });
  it('Fenster liegen über Lager und Erfolgs-Band', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const z = sel => +((css.match(new RegExp(sel + ' \\{[^}]*z-index:\\s*(\\d+)')) || [])[1] || 0);
    expect(z('#modal')).toBeGreaterThan(z('#store'));
    expect(z('#modal')).toBeGreaterThan(z('#achv'));
  });
  it('Menü „Zum Rathaus“ springt zum Rathaus, auch wenn es umgezogen ist', () => {
    game("state.tiles.delete('1,1'); state.tiles.set('20,20', { b: 'rathaus', lvl: 1 }); recalc(); showMenu(); document.getElementById('m-home').click()");
    const c = game('iso(21, 21)');
    expect(game('state.cam.x')).toBeCloseTo(c.x);
    expect(game('state.cam.y')).toBeCloseTo(c.y);
  });
  it('Einführung: kein „ganz links“ mehr für den Weg', () => {
    expect(game('TUTORIAL.map(s => s.hint).join(" ")')).not.toMatch(/ganz links/);
  });
  it('Knöpfe oben lösen nach einem Wisch nicht aus', () => {
    game("window.__n = 0; const d = document.createElement('div'); d.id = 'ft'; document.body.append(d); d.onclick = () => window.__n++; fastTap(d)");
    ev("document.getElementById('ft')", 'pointerdown', 10);
    ev("document.getElementById('ft')", 'pointerup', 80);
    expect(game('window.__n')).toBe(0);
    ev("document.getElementById('ft')", 'pointerdown', 10);
    ev("document.getElementById('ft')", 'pointerup', 12);
    expect(game('window.__n')).toBe(1);
    game("document.getElementById('ft').remove()");
  });
});
