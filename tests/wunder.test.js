const { loadGame, game } = require('./helpers/load-game');

// Große Bauprojekte: Baustelle, Abschnitt für Abschnitt, Wirkung erst fertig
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 99999');
  game("for (let y = 3; y <= 14; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});
const $ = id => document.getElementById(id);
const finish = (x, y) => { const n = game(`WONDERS[state.tiles.get('${x},${y}').b].phases.length`); for (let i = 0; i < n; i++) game(`wonderStep(${x}, ${y}, true)`); };

describe('Wunderwerke', () => {
  it('Riesenrad erst ab 10 Laternen', () => {
    expect(game("available('riesenrad')")).toBe(false);
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }");
    expect(game("available('riesenrad')")).toBe(true);
  });

  it('erst eine Baustelle: ohne Wirkung, Abschnitt für Abschnitt – fertig gibt es ein Fest und die Wirkung', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; for (let i = 0; i < 5; i++) state.tiles.set((5 + i * 2) + ',13', { b: 'geothermie', lvl: 3 }); recalc()");
    const inc0 = game('T.inc');
    expect(game("build('riesenrad', 8, 8, true)")).toBe(true);
    expect(game("state.tiles.get('8,8').phase")).toBe(0);
    game('recalc()');
    expect(game('T.inc')).toBeCloseTo(inc0);                                   // Baustelle bringt nichts
    const m = game('state.money'), c = game("wonderCost(state.tiles.get('8,8')).money");
    expect(game('wonderStep(8, 8, true)')).toBe(true);
    expect(game('state.money')).toBe(m - c);
    expect(game("state.tiles.get('8,8').phase")).toBe(1);
    finish(8, 8);
    expect(game("wonderDone(state.tiles.get('8,8'))")).toBe(true);
    expect($('modal-card').textContent).toContain('Riesenrad');
    expect(game('T.inc')).toBeGreaterThan(inc0 + 70);
  });

  it('jedes Wunderwerk nur einmal', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; build('riesenrad', 6, 4, true)");
    expect(game("placeError('riesenrad', 10, 10)")).toBe('Das Riesenrad gibt es schon');
  });

  it('Sternwarte: +25 % Ideen', () => {
    game("state.techs.add('uni'); state.tiles.set('5,12', { b: 'bibliothek', lvl: 1 }); recalc()");
    const sci = game('T.sci');
    expect(game("build('sternwarte', 8, 8, true)")).toBe(true);
    finish(8, 8);
    expect(game('T.sci')).toBeCloseTo(sci * 1.25);
  });

  it('Seebrücke: vom Ufer ins Wasser, Kurgäste bringen Einwohner', () => {
    game("state.restore.quelle = 1; for (let x = 9; x <= 13; x++) state.terra.set(x + ',8', 'water'); recalc()");
    expect(game("placeError('seebruecke', 5, 5, 0)")).toBe('Vom Ufer aus ins Wasser bauen');
    const pop = game('T.pop');
    expect(game("placeError('seebruecke', 8, 8, 0)")).toBe(null);
    expect(game("build('seebruecke', 8, 8, true)")).toBe(true);
    finish(8, 8);
    expect(game('T.pop')).toBe(pop + 40);
  });

  it('Schloss erst nach dem Laternenfest – danach „Königliche Inselperle“ und +20 % auf alles', () => {
    expect(game("available('schloss')")).toBe(false);
    game("state.festival = true; state.tiles.set('5,12', { b: 'feld', lvl: 1 }); recalc()");
    const inc = game('T.inc');
    expect(game("build('schloss', 8, 5, true)")).toBe(true);
    finish(8, 5);
    expect(game('townTitle()')).toBe('Königliche Inselperle');
    expect(game('T.inc')).toBeCloseTo(inc * 1.2);
  });

  it('Infofenster: nächster Abschnitt mit Kosten und Knopf; bezahlbar steht es im Rathaus unter „Bereit“', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; build('riesenrad', 8, 8, true); openInfo(8, 8)");
    expect($('panel').textContent).toMatch(/Abschnitt 1 von 4/);
    expect($('p-wonder').disabled).toBe(false);
    expect(game("readyList().ready.some(e => e.kind === 'wonder')")).toBe(true);
  });

  it('groß: Riesenrad 5×5, Sternwarte 3×3, Botanischer Garten 5×5, Schloss 7×7 – die Seebrücke bleibt', () => {
    expect(game("['riesenrad', 'sternwarte', 'botgarten', 'schloss', 'seebruecke'].map(b => ITEMS[b].size)")).toEqual([[5, 5], [3, 3], [5, 5], [7, 7], [4, 1]]);
  });

  it('Preis: Minuten Einkommen beim Aufstellen (mindestens ein Sockel), dazu viel Material', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; T.inc = 2000; build('riesenrad', 8, 8, true)");
    const t = "state.tiles.get('8,8')";
    expect(game(`${t}.rate`)).toBe(2000);
    expect(game(`wonderCost(${t}, 0).money`)).toBe(game("niceRound(2000 * 60 * 12)"));   // 12 Minuten, gerundet
    game('T.inc = 99999');
    expect(game(`wonderCost(${t}, 0).money`)).toBe(1400000);                   // bleibt beim Preis vom Aufstellen
    game(`${t}.rate = 5`);
    expect(game(`wonderCost(${t}, 0).money`)).toBe(30000);                     // Sockel für kleine Einkommen
    expect(game(`wonderCost(${t}, 0).quader`)).toBeGreaterThanOrEqual(100);
    const total = game(`WONDERS.riesenrad.phases.reduce((s, p) => s + p.min, 0)`);
    expect(total).toBeGreaterThanOrEqual(55);                                    // etwa eine Stunde
    expect(game('WONDERS.schloss.phases.reduce((s, p) => s + p.min, 0)')).toBeGreaterThanOrEqual(180);
  });

  it('bezahlte Abschnitte werden gemerkt (Abriss erstattet die Hälfte davon)', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; T.inc = 1000; build('riesenrad', 8, 8, true)");
    const c = game("wonderCost(state.tiles.get('8,8'))");
    game('wonderStep(8, 8, true)');
    expect(game("state.tiles.get('8,8').paid")).toEqual(c);
    expect(game('demolishInfo(8, 8).refund')).toBe(Math.floor((2000 + c.money) / 2));
  });

  it('alte Stände: das Bauwerk wächst um seine Mitte, Natur weicht, der Fortschritt bleibt', () => {
    game("state.tiles.set('9,9', { b: 'riesenrad', lvl: 1, phase: 2 }); state.terra.set('8,8', 'forest'); state.growWonders = true");
    expect(game('growWonders().length')).toBe(1);
    expect(game("state.tiles.get('8,8')")).toMatchObject({ b: 'riesenrad', phase: 2 });   // 3×3 bei 9,9 → 5×5 bei 8,8
    expect(game("terrainAt(8, 8)")).toBe('grass');
    expect(game('state.growWonders')).toBeUndefined();
  });

  it('alte Stände: kein Platz (Häuser drumherum) → alles erstattet, auch die bezahlten Abschnitte', () => {
    game("state.tiles.set('9,9', { b: 'schloss', lvl: 1, phase: 1 }); state.growWonders = true");
    for (let x = 5; x <= 14; x++) for (const y of [8, 13]) game(`state.tiles.set('${x},${y}', { b: 'haus', lvl: 1 })`);
    const m = game('state.money'), q = game('state.res.quader');
    const list = game('growWonders()');
    expect(list[0].refunded).toBe(true);
    expect(game("[...state.tiles.values()].some(t => t.b === 'schloss')")).toBe(false);
    expect(game('state.money')).toBe(m + 10000 + 40000);
    expect(game('state.res.quader')).toBe(q + 150);
  });

  it('Speichern: Stand v11, alte Stände (v8) wachsen beim Laden', () => {
    game('save()');
    expect(JSON.parse(game("localStorage.getItem(SAVE_KEY)")).v).toBe(11);
    expect(game('load().growWonders')).toBe(false);
  });

  it('wird gespeichert', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; build('riesenrad', 8, 8, true); wonderStep(8, 8, true); save()");
    expect(game('load()').tiles.get('8,8').phase).toBe(1);
  });

  it('alle Wunderwerke lassen sich in jedem Abschnitt zeichnen, tags und nachts', () => {
    for (const id of game('Object.keys(WONDERS)')) {
      const n = game(`WONDERS.${id}.phases.length`);
      for (let p = 0; p <= n; p++) for (const night of [0, 0.8]) {
        expect(() => game(`night = ${night}; drawObject('${id}', 300, 300, 1, 1000, 8, 8, 1, { b: '${id}', rot: 0, phase: ${p} })`), `${id} ${p}`).not.toThrow();
      }
    }
    game('night = 0');
  });
});
