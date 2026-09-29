const { loadGame, game } = require('./helpers/load-game');

// Karte ziehen, während man ein Werkzeug hält: rechte/mittlere Maustaste, Leertaste oder Ctrl
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999; for (let y = 3; y <= 12; y++) for (let x = 3; x <= 12; x++) { state.terra.set(x + "," + y, "grass"); state.tiles.delete(x + "," + y); } recalc()');
  game("setTool('weg')");
});
const canvas = () => document.getElementById('world');
function drag(button, opts = {}, steps = 10) {
  // jsdom kennt kein PointerEvent: MouseEvent mit pointerId/pointerType
  const ev = (type, x, y, b, buttons) => {
    const e = new window.MouseEvent(type, { clientX: x, clientY: y, button: b, buttons, bubbles: true, ...opts });
    Object.defineProperty(e, 'pointerId', { value: 3 }); Object.defineProperty(e, 'pointerType', { value: 'mouse' });
    canvas().dispatchEvent(e);
  };
  const bits = button === 2 ? 2 : button === 1 ? 4 : 1;
  const [sx, sy] = game('(() => { const p = toScreen(6, 6); return [p.x, p.y]; })()');
  ev('pointerdown', sx, sy, button, bits);
  for (let i = 1; i <= steps; i++) ev('pointermove', sx + i * 12, sy + i * 6, -1, bits);
  ev('pointerup', sx + steps * 12, sy + steps * 6, button, 0);
}
const ways = () => game("[...state.tiles.values()].filter(t => t.b === 'weg').length");

describe('Karte ziehen mit Werkzeug in der Hand', () => {
  it('mit der linken Maustaste baut Ziehen den Weg', () => {
    const w = ways();
    drag(0);
    expect(ways()).toBeGreaterThan(w);
  });

  it('rechte Maustaste gedrückt halten: Karte bewegt sich, kein Weg, Werkzeug bleibt', () => {
    const w = ways(), c = game('[cam.x, cam.y]');
    drag(2);
    expect(ways()).toBe(w);
    expect(game('[cam.x, cam.y]')).not.toEqual(c);
    expect(game('tool')).toBe('weg');
  });

  it('auch mit der mittleren Maustaste, mit Ctrl und mit gehaltener Leertaste', () => {
    for (const run of [() => drag(1), () => drag(0, { ctrlKey: true }), () => {
      window.dispatchEvent(new window.KeyboardEvent('keydown', { key: ' ' }));
      drag(0);
      window.dispatchEvent(new window.KeyboardEvent('keyup', { key: ' ' }));
    }]) {
      const w = ways(), c = game('[cam.x, cam.y]');
      run();
      expect(ways()).toBe(w);
      expect(game('[cam.x, cam.y]')).not.toEqual(c);
    }
  });

  it('kurzer Rechtsklick ohne Ziehen legt das Werkzeug weg', () => {
    drag(2, {}, 0);
    expect(game('tool')).toBe('look');
  });
});
