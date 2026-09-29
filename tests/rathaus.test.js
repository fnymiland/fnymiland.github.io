const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel()');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99');
});

describe('Schilder', () => {
  it('Text wird selbst mittig gesetzt (Safari zentriert Emojis falsch)', () => {
    const calls = game(`(() => {
      const out = [], f = g.fillText, m = g.measureText;
      g.measureText = () => ({ width: 100 });
      g.fillText = (t, x, y) => out.push([t, x, g.textAlign]);
      pill('🏛 Alte Ruine 🏮', 200, 50, '#fff', '#000', 12);
      g.fillText = f; g.measureText = m;
      return out;
    })()`);
    expect(calls).toEqual([['🏛 Alte Ruine 🏮', 150, 'left']]);
  });
});

describe('Reetdachhaus', () => {
  it('nimmt die gewählte Dachfarbe an', () => {
    const cols = game(`(() => {
      const out = [], p = poly;
      poly = (pts, fill) => { out.push(fill); p(pts, fill); };
      HOUSE_ART[2](kit(100, 100, 1, 0), '#ffffff', '#3060d0', 0, 1, 1);
      poly = p;
      return out;
    })()`);
    expect(cols.some(c => typeof c === 'string' && /^#[0-9a-f]{6}$/.test(c) && parseInt(c.slice(5, 7), 16) > parseInt(c.slice(1, 3), 16))).toBe(true);   // bläulich
  });
});

describe('Rathaus', () => {
  const $ = id => document.getElementById(id);
  const readyHouse = () => {
    // Häuschen, dessen Wünsche (Weg, Deko) erfüllt sind
    game("for (let y = 5; y <= 9; y++) for (let x = 5; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
    game("state.tiles.set('7,7', { b: 'haus', lvl: 1, name: 'Mo' }); state.tiles.set('7,8', { b: 'weg', lvl: 1, style: 'sand' }); state.decos.set('8,7', [{ b: 'busch', rot: 0 }, null, null, null]); recalc()");
  };

  it('Bereit: direkt ausbauen, ohne hinzufahren – das Rathaus bleibt offen', () => {
    readyHouse();
    game("openTownHall('ready')");
    const btn = document.querySelector('[data-up]');
    expect(btn.textContent).toMatch(/Ausbauen/);
    expect(btn.disabled).toBe(false);
    btn.onclick();
    expect(game("state.tiles.get('7,7').lvl")).toBe(2);
    expect($('modal').hidden).toBe(false);
    expect($('panel').hidden).toBe(true);
  });

  it('fehlt Material, ist der Knopf grau – und wird von selbst grün', () => {
    readyHouse();
    game("state.res.bretter = 0; openTownHall('ready')");
    expect(document.querySelector('[data-up]').disabled).toBe(true);
    game('state.res.bretter = 10; updateHud()');
    expect(document.querySelector('[data-up]').disabled).toBe(false);
  });

  it('Inseln: jede mit „Hin“, die nächste lässt sich von hier erschließen', () => {
    game("openTownHall('isles')");
    const rows = [...document.querySelectorAll('[data-isle-go]')];
    expect(rows.length).toBe(1 + game('ISLES.length'));                  // Heimatinsel + Themen-Inseln
    const cam0 = game('[cam.x, cam.y]');
    document.querySelector('[data-isle-go="wald"]').onclick();
    expect(game('[cam.x, cam.y]')).not.toEqual(cam0);
    expect($('modal').hidden).toBe(true);
    expect($('panel').textContent).toContain('Waldinsel');                // Erschließen-Fenster der nächsten Insel
  });

  it('Übersicht: Schnellknöpfe zu Forschung, Kunstakademie, Tagebuch und Laternen', () => {
    game("openTownHall('overview')");
    expect(document.querySelectorAll('[data-quick-go]').length).toBeGreaterThanOrEqual(3);
    document.querySelector('[data-quick-go="design"]').onclick();
    expect(game('researchTab')).toBe('design');
    game("state.islands.add('wald'); ownIsland('wald'); recalc(); openTownHall('overview')");
    document.querySelector('[data-lm-go="baum"]').onclick();
    expect($('panel').textContent).toContain('Uralter Baum');
  });
});
