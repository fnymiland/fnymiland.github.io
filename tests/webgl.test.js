const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 144: WebGL weit weg. Im Test (jsdom) gibt es kein WebGL – dort muss alles wie bisher in 2D laufen; und was für WebGL an der
// Feldschleife schneller wurde, muss genau dasselbe liefern wie vorher
beforeAll(() => {
  loadGame();
  global.WG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'testsave-gross.json'), 'utf8'));
  game('adoptState(parseSave(WG)); closeModal(); closePanel(); state.tipsOff = true; resize()');
});
describe('WebGL weit weg (Block 144)', () => {
  it('ohne WebGL (Test, alte Browser) bleibt alles 2D: kein Aufzeichnen, kein Absturz', () => {
    game('state.cam.z = 0.6; render(1e6); render(1e6)');
    expect(game('[GL.ready, GLPASS, GL.frame]')).toEqual([false, false, false]);
    expect(game('glFrameOk(0.6)')).toBe(false);
    expect(game("typeof ctx.drawImage === 'function' && !Object.prototype.hasOwnProperty.call(ctx, 'drawImage')")).toBe(true);   // kein Haken übrig
  });
  it('sichtbare Felder: genau dieselbe Liste wie mit toScreen je Feld (vorher), an mehreren Stellen und Zoomstufen', () => {
    const cmp = game(`(() => { const bad = [];
      for (const [z, cx, cy] of [[0.45, 0, 300], [0.6, 120, -80], [0.95, -300, 500], [1.4, 60, 330], [0.3, 0, 0]]) {
        cam = state.cam; cam.z = z; cam.x = cx; cam.y = cy;
        const cs = [toTile(0, 0), toTile(W, 0), toTile(0, H), toTile(W, H)];
        let minX = Math.min(...cs.map(c => c.x)) - 2, maxX = Math.max(...cs.map(c => c.x)) + 6, minY = Math.min(...cs.map(c => c.y)) - 2, maxY = Math.max(...cs.map(c => c.y)) + 6;
        const mX = TW * z, mTop = 110 * z, mBot = TH * z, mBig = 420 * z, old = [];
        const bigFront = (x, y) => { const a = COVER.get(x + ',' + y), t = a && state.tiles.get(a); if (!t) return false; const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot, t); return (w > 1 || h > 1) && (x === ax + w - 1 || y === ay + h - 1); };
        for (let s = minX + minY; s <= maxX + maxY + 30; s++) for (let x = Math.max(minX, s - maxY - 30); x <= Math.min(maxX + 30, s - minY); x++) {
          const y = s - x, p = toScreen(x, y);
          if (p.x < -mX || p.x > W + mX || p.y < -mBot) continue;
          if (p.y > H + mTop && (p.y > H + mBig || !bigFront(x, y))) continue;
          old.push(x, y, p.x, p.y);
        }
        const neu = visibleTiles(minX, maxX, minY, maxY, z);
        if (neu.length !== old.length || neu.some((v, i) => v !== old[i])) bad.push(z + ' ' + neu.length + ' ' + old.length);
      } return bad; })()`);
    expect(cmp).toEqual([]);
  });
  it('live gezeichnete Wege weit weg: dieselben Felder wie die Prüfung je Feld (Brücken, leuchtende Beläge)', () => {
    game("state.tiles.set('3,3', { b: 'weg', lvl: 1, style: 'sand', bridge: true }); groundVersion++");
    const r = game(`(() => { const set = liveFlatSet(), brute = new Set();
      for (const k of new Set([...state.tiles.keys(), ...COVER.keys()])) { const [x, y] = keyXY(k), t = flatAt(x, y); if (t && (t.b === 'schiene' || wegUnder(t) != null) && !cachedPath(t)) brute.add(k); }
      return [set.has('3,3'), set.size === brute.size && [...brute].every(k => set.has(k))]; })()`);
    expect(r).toEqual([true, true]);
    game("state.tiles.delete('3,3'); groundVersion++");
    expect(game("liveFlatSet().has('3,3')")).toBe(false);
  });
  it('Haken: drawImage/save/restore/clip nur während des Aufzeichnens, danach wieder die echten', () => {
    game('glHook(true)');
    expect(game("Object.prototype.hasOwnProperty.call(ctx, 'drawImage')")).toBe(true);
    game('glHook(false)');
    expect(game("['drawImage', 'save', 'restore', 'beginPath', 'rect', 'clip'].some(k => Object.prototype.hasOwnProperty.call(ctx, k))")).toBe(false);
  });
  it('GL-Bild nur bei Tag, weit weg, ohne Werkzeug; ?gl=0 schaltet ab', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'gl.js'), 'utf8');
    expect(src).toMatch(/night === 0/);
    expect(src).toMatch(/tool === 'look'/);
    expect(src).toMatch(/GL_Q === '0'/);
  });
});
