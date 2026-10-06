const fs = require('fs');
const path = require('path');
const { loadGame, game } = require('./helpers/load-game');

// Block 110: Die Seite zoomt nie heran – weder doppelt getippte Knöpfe noch zwei Finger auf einem Fenster (iPad).
// Die Karte zoomt weiter selbst.
beforeAll(() => loadGame());
const root = path.join(__dirname, '..');

describe('Kein Seiten-Zoom (Block 110)', () => {
  it('CSS: Seite nur wischen (kein Doppeltipp-/Zwei-Finger-Zoom), die Karte behandelt Gesten selbst', () => {
    const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    expect(css).toMatch(/html, body \{[^}]*touch-action: pan-x pan-y;/);
    expect(css).toMatch(/#world \{[^}]*touch-action: none;/);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toMatch(/name="viewport" content="[^"]*maximum-scale=1[^"]*user-scalable=no/);
  });
  it('Safari-Gesten und Trackpad-Zoom über Fenstern werden abgefangen, Mausrad an der Karte nicht', () => {
    const ev = (type, init = {}) => game(`(() => { const e = new Event('${type}', { bubbles: true, cancelable: true }); Object.assign(e, ${JSON.stringify(init)}); document.getElementById('modal').dispatchEvent(e); return e.defaultPrevented; })()`);
    expect(ev('gesturestart')).toBe(true);
    expect(ev('gesturechange')).toBe(true);
    expect(game("(() => { const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: true }); document.getElementById('modal').dispatchEvent(e); return e.defaultPrevented; })()")).toBe(true);
    expect(game("(() => { const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, ctrlKey: false }); document.getElementById('modal').dispatchEvent(e); return e.defaultPrevented; })()")).toBe(false);   // normales Scrollen im Fenster
  });
  it('Block 113: Hinweise (Toast) und Konfetti liegen über Fenstern, das antippbare Erfolgs-Band darunter', () => {
    const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
    const z = sel => { const m = css.match(new RegExp(sel.replace(/[#.]/g, c => '\\' + c) + '\\s*\\{[^}]*?z-index:\\s*(\\d+)')); return m ? +m[1] : 0; };
    expect(z('#toast')).toBeGreaterThan(z('#modal'));
    expect(z('#confetti')).toBeGreaterThan(z('#modal'));
    expect(z('#achv')).toBeLessThan(z('#modal'));
    expect(z('#modal')).toBe(40);
  });
});
