const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal()'); });

describe('Zeichnen', () => {
  it('jedes Objekt lässt sich in jeder Stufe und Richtung zeichnen', () => {
    const errors = game(`(() => {
      const out = [];
      for (const b of Object.keys(ITEMS)) for (let lvl = 1; lvl <= 5; lvl++) for (let rot = 0; rot < 4; rot++) {
        try { drawObject(b, 100, 100, 1.3, 1000, 3, 4, lvl, { b, lvl, rot, lm: 'baum' }); }
        catch (e) { out.push(b + ' ' + lvl + '/' + rot + ': ' + e.message); }
      }
      for (const b of Object.keys(ITEMS)) { try { drawObject(b, 50, 50, 1, 0, 3, 7, 1, null); } catch (e) { out.push(b + ' (Vorschaubild): ' + e.message); } }
      return out;
    })()`);
    expect(errors).toEqual([]);
  });

  it('die ganze Szene lässt sich zeichnen – auch mit Vorschau beim Bauen', () => {
    game("state.owned.add('1,1'); for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
    game("state.tiles.set('8,8', { b: 'saege', lvl: 2, rot: 3 }); state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'kopf' }); state.tiles.set('6,7', { b: 'stand_obst', lvl: 1, rot: 1, weg: 'kopf' }); recalc()");
    game("resize(); const c = iso(8, 8); cam.x = c.x; cam.y = c.y; cam.z = 1.5");
    game("setTool('schule'); hover = { x: 10, y: 10 }");
    expect(() => game('render(1000)')).not.toThrow();
    game("setTool('verschieben'); pickUp(8, 8, 0); hover = { x: 10, y: 6 }");
    expect(() => game('render(2000)')).not.toThrow();
  });
});

describe('Dächer und Amphitheater', () => {
  it('neue Dachformen (Mansard, Tonne) in allen Richtungen', () => {
    for (let r = 0; r < 4; r++) for (const type of ['mansard', 'barrel']) for (const [ha, hb] of [[0.3, 0.5], [0.5, 0.3]]) {
      expect(() => game(`kit(100, 100, 1, ${r}).block({ ha: ${ha}, hb: ${hb}, h: 12, wall: '#ffeecc', roof: '#cc6644', roofH: 12, type: '${type}' })`), `${type} ${r}`).not.toThrow();
    }
  });

  it('Bäckerei, Schule, Bibliothek und Kunstakademie zeichnen in jeder Stufe', () => {
    for (const b of ['baecker', 'schule', 'bibliothek', 'kunst']) for (let lvl = 1; lvl <= 3; lvl++) for (let rot = 0; rot < 4; rot++) {
      expect(() => game(`drawObject('${b}', 300, 300, 1, 1000, 5, 5, ${lvl}, { b: '${b}', lvl: ${lvl}, rot: ${rot} })`), `${b} ${lvl} ${rot}`).not.toThrow();
    }
  });

  it('die Alte Ruine ist voll ausgebaut ein Amphitheater (Tag und Nacht)', () => {
    for (const night of [0, 0.8]) for (let stage = 0; stage <= 3; stage++) {
      expect(() => game(`night = ${night}; LANDMARK_ART.ruine(kit(300, 300, 1, 0), ${stage}, 1000, 5, 5)`)).not.toThrow();
    }
    game('night = 0');
  });
});

describe('Farbwahl (Block 57)', () => {
  it('jedes Gebäude mit Farbauswahl übernimmt Wand- und Dachfarbe (sonst gibt es die Auswahl nicht)', () => {
    const bad = game(`(() => {
      const used = (b, wall, roof) => {                                  // alle Füllfarben beim Zeichnen mitschreiben
        const seen = [], d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g), 'fillStyle') || {};
        Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
        try { drawObject(b, 100, 100, 1.3, 1000, 3, 4, 3, { b, lvl: 3, rot: 0, wall, roof }); } finally { delete g.fillStyle; }
        return seen.join('|');
      };
      const out = [];
      for (const b of ['haus', ...PAINTABLE, ...Object.keys(REPAINT)]) {
        const base = used(b, 0, 0);
        if (used(b, 4, 0) === base) out.push(b + ': Wand');
        if (used(b, 0, 4) === base) out.push(b + ': Dach');
      }
      return out;
    })()`);
    expect(bad).toEqual([]);
  });
});

describe('Reihenhaus: „bunt“ für Fassaden und Dächer', () => {
  it('Fassade einfarbig, Dächer bunt – und zurück', () => {
    game("state.money = 1e6; state.tiles.set('8,8', { b: 'reihenhaus', lvl: 2, rot: 0, wall: 3, roof: 2 }); recalc(); openInfo(8, 8)");
    expect(game("document.querySelectorAll('#panel .sw.bunt').length")).toBe(2);
    expect(game("!!document.querySelector('#panel [data-orig]')")).toBe(false);             // braucht keinen Umweg mehr
    game("document.querySelector('#panel [data-roof=\"bunt\"]').click()");
    expect(game("state.tiles.get('8,8').roof")).toBe(undefined);
    expect(game("state.tiles.get('8,8').wall")).toBe(3);
    expect(game("document.querySelector('#panel [data-roof=\"bunt\"]').classList.contains('on')")).toBe(true);
    game("document.querySelector('#panel [data-wall=\"bunt\"]').click()");
    expect(game("state.tiles.get('8,8').wall")).toBe(undefined);
  });
});
