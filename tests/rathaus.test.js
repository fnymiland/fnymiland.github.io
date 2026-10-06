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

  it('Übersicht: Laternen mit „Hin“; nur noch Stadt-Reiter (Block 98)', () => {
    game("openTownHall('overview')");
    expect(game("[...document.querySelectorAll('#modal-card [data-tab]')].map(b => b.dataset.tab)")).toEqual(['overview', 'todo', 'bewohner', 'isles', 'town']);
    expect(document.querySelector('[data-quick-go="design"]')).toBe(null);           // Forschung & Co. haben eigene Knöpfe
    game("state.islands.add('wald'); ownIsland('wald'); recalc(); openTownHall('overview')");
    document.querySelector('[data-lm-go="baum"]').onclick();
    expect($('panel').textContent).toContain('Uralter Baum');
  });
});

describe('Rathaus 3×3 (Spielstand v10)', () => {
  // alter Stand: Rathaus 2×2 bei (2,2), dann v9 speichern und neu laden
  const oldSave = setup => {
    game("state.tiles.delete('1,1'); for (let y = -2; y <= 8; y++) for (let x = -2; x <= 8; x++) { state.terra.set(x + ',' + y, 'grass'); if (!state.tiles.get(x + ',' + y) || state.tiles.get(x + ',' + y).b !== 'lm') state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
    game("state.tiles.set('2,2', { b: 'rathaus', lvl: 1 })");
    game(setup);
    const raw = game('serialize()');
    raw.v = 9;
    game(`localStorage.setItem(SAVE_KEY, ${JSON.stringify(JSON.stringify(raw))})`);
    game('state = load(); growTownHall(); fitFootprints(); recalc()');
  };

  it('wächst nach hinten, wenn dort Platz ist – vorn bleiben die Wege', () => {
    oldSave("for (const k of ['4,2', '4,3', '2,4', '3,4']) state.tiles.set(k, { b: 'weg', lvl: 1, style: 'sand' })");
    expect(game("state.tiles.get('1,1').b")).toBe('rathaus');
    expect(game("['4,2', '4,3', '2,4', '3,4'].every(k => state.tiles.get(k).b === 'weg')")).toBe(true);
  });

  it('ist hinten alles bebaut, wächst es nach vorn – Wege weichen, gegen Erstattung', () => {
    oldSave(`for (const k of ['1,1', '1,2', '1,3', '2,1', '3,1']) state.tiles.set(k, { b: 'haus', lvl: 1 });
      for (const k of ['4,2', '4,3', '2,4', '3,4']) state.tiles.set(k, { b: 'weg', lvl: 1, style: 'sand' })`);
    expect(game("state.tiles.get('2,2').b")).toBe('rathaus');
    expect(game("['1,1', '1,2', '1,3', '2,1', '3,1'].every(k => state.tiles.get(k).b === 'haus')")).toBe(true);
    expect(game("state.tiles.has('4,2')")).toBe(false);
  });

  it('was weichen muss, gibt es voll zurück – auch den Ausbau eines Hauses', () => {
    const v = game("fullValue({ b: 'haus', lvl: 3 })");
    expect(v.money).toBe(40 + 100 + 600);
    expect(v.bretter).toBe(2 + 4);
  });
});

describe('Alles ausbauen', () => {
  // drei Felder neben einer Mühle: Stufe 2 braucht „Mühle direkt daneben“
  const fields = () => {
    game("for (let y = 6; y <= 10; y++) for (let x = 6; x <= 10; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); }");
    game("state.tiles.set('8,8', { b: 'muehle', lvl: 1 }); for (const k of ['7,8', '9,8', '8,9']) state.tiles.set(k, { b: 'feld', lvl: 1 })");
    game("for (const k of ['6,6', '10,6', '6,10']) state.tiles.set(k, { b: 'haus', lvl: 3 }); recalc()");        // Mitarbeiter
  };
  it('baut alles Bereite aus, das Günstigste zuerst – so weit es reicht', () => {
    fields();
    const cost = game('BUILD_STAGES.feld.up[0].cost.money');
    game(`state.money = ${cost * 2 + 5}`);
    const n = game('upgradeMany(readyList().ready)');
    expect(n).toBe(2);
    expect(game("['7,8', '9,8', '8,9'].filter(k => state.tiles.get(k).lvl === 2).length")).toBe(2);
  });

  it('im Rathaus: Gruppen wie im Bau-Menü, je „Alle ausbauen“, oben „Alles ausbauen“', () => {
    fields();
    game("state.tiles.set('4,6', { b: 'haus', lvl: 1 }); recalc(); openTownHall('ready')");
    const labels = [...document.querySelectorAll('.hall-group')].map(l => l.textContent);
    expect(labels.some(t => /🪙 Taler \(\d+\)/.test(t))).toBe(true);       // Felder und Mühle
    expect(document.querySelector('[data-upall="taler"]')).not.toBe(null);
    expect(document.querySelector('[data-upall="all"]')).not.toBe(null);
    document.querySelector('[data-upall="taler"]').onclick();
    expect(game("['7,8', '9,8', '8,9'].every(k => state.tiles.get(k).lvl === 2)")).toBe(true);
    game('closeModal()');
  });
});
