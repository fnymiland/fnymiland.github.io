const { loadGame, game } = require('./helpers/load-game');

// Eisenbahn: Forschung, Schienen an Land und als Brücke übers Wasser
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal()');
  game('state.money = 99999; state.science = 9999; for (const r of Object.keys(RES)) state.res[r] = 99');
  game("for (let y = 3; y <= 12; y++) for (let x = 6; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const unlock = () => game("state.tiles.set('3,10', { b: 'bibliothek', lvl: 1 }); state.restore.erzberg = 1; state.techs.add('bahn'); recalc()");
const coast = () => game(`(() => {
  for (let x = 2; x < 60; x++) { const y = 3; if (!ownedTile(x, y) && isSea(x, y) && ownedTile(x - 1, y)) return [x, y]; }
  return null;
})()`);

describe('Forschung Eisenbahn', () => {
  it('gibt es in Stufe 2, aber erst mit der Erzinsel (Erzberg, 1. Laterne)', () => {
    game("state.tiles.set('3,10', { b: 'bibliothek', lvl: 1 }); recalc()");
    const t = "TECH_BY_ID.bahn";
    expect(game(`${t}.tier`)).toBe(2);
    expect(game(`techReady(${t})`)).toBe(false);
    game('state.restore.erzberg = 1');
    expect(game(`techReady(${t})`)).toBe(true);
  });

  it('schaltet Schienen und Bahnhof frei', () => {
    expect(game("available('schiene')")).toBe(false);
    unlock();
    expect(game("available('schiene') && available('station')")).toBe(true);
  });
});

describe('Schienen', () => {
  beforeEach(unlock);

  it('an Land: 15 Taler, 1 Holz, 1 Metall', () => {
    const m = game('state.money'), h = game('state.res.holz');
    expect(game("build('schiene', 8, 8, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 15);
    expect(game('state.res.holz')).toBe(h - 1);
    expect(game("state.tiles.get('8,8').bridge")).toBeFalsy();
  });

  it('über Wasser als Brücke – teurer', () => {
    game("state.terra.set('8,8', 'water'); recalc()");
    const m = game('state.money');
    expect(game("placeError('schiene', 8, 8)")).toBe(null);
    expect(game("placeError('haus', 8, 8)")).toBe('Nicht auf dem Wasser');
    expect(game("build('schiene', 8, 8, true)")).toBe(true);
    expect(game("state.tiles.get('8,8').bridge")).toBe(true);
    expect(game('state.money')).toBe(m - 40);
  });

  it('als Brücke ins offene Meer, Feld für Feld von der Küste aus', () => {
    const [x, y] = coast();
    expect(game(`placeError('schiene', ${x + 1}, ${y})`)).toBe('Im Meer nur direkt neben deinem Land');
    expect(game(`build('schiene', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`build('schiene', ${x + 1}, ${y}, true)`)).toBe(true);
    expect(game(`state.claimed.has('${x + 1},${y}') && state.tiles.get('${x + 1},${y}').bridge`)).toBe(true);
  });

  it('abreißen gibt alles zurück, bei Brücken die Brückenkosten', () => {
    game("state.terra.set('9,9', 'water'); recalc()");
    game("build('schiene', 8, 8, true); build('schiene', 9, 9, true)");
    expect(game('demolishInfo(8, 8).refund')).toBe(15);
    expect(game('demolishInfo(9, 9).refund')).toBe(40);
    expect(game('demolishInfo(9, 9).mat')).toEqual({ holz: 2, metall: 2 });
  });

  it('unter einer Brücke aufschütten: wird normale Schiene, der Unterschied kommt zurück', () => {
    game("state.terra.set('9,9', 'water'); recalc(); build('schiene', 9, 9, true)");
    const m = game('state.money');
    expect(game("build('schuett', 9, 9, true)")).toBe(true);
    expect(game("state.tiles.get('9,9').bridge")).toBeFalsy();
    expect(game('state.money')).toBe(m - 60 + 25);
  });

  it('Schienen verbinden keine Viertel (Inseln bleiben eigene Orte)', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); state.tiles.set('12,6', { b: 'haus', lvl: 1 })");
    for (let x = 7; x <= 11; x++) game(`build('schiene', ${x}, 6, true)`);
    game('recalc()');
    expect(game("T.st.get('6,6').n")).toBe(1);
    expect(game("railArms(9, 6)")).toEqual([[1, 0], [-1, 0]]);
  });

  it('zeichnen geht ohne Fehler (gerade, Kurve, Kreuzung, Brücke, einzeln)', () => {
    game("state.terra.set('10,10', 'water'); recalc()");
    for (const [x, y] of [[8, 8], [9, 8], [10, 8], [9, 9], [9, 7], [10, 9], [10, 10], [13, 12]]) game(`build('schiene', ${x}, ${y}, true)`);
    for (const k of ['8,8', '9,8', '10,8', '9,9', '10,10', '13,12']) {
      expect(() => game(`drawRailBed(100, 100, 1, ${k}, state.tiles.get('${k}')); drawObject('schiene', 100, 100, 1, 0, ${k}, 1, state.tiles.get('${k}'))`)).not.toThrow();
    }
  });
});

describe('Speichern', () => {
  it('Brücken bleiben nach dem Laden Brücken', () => {
    unlock();
    game("state.terra.set('9,9', 'water'); recalc(); build('schiene', 9, 9, true); save()");
    expect(game('load()').tiles.get('9,9').bridge).toBe(true);
  });
});

describe('Alte Stände', () => {
  it('der neue Bahnhof bleibt beim Laden stehen (der alte, entfernte hieß „bahnhof“ und wird erstattet)', () => {
    unlock();
    game("state.tiles.set('8,8', { b: 'station', lvl: 1 }); save()");
    expect(game('load()').tiles.get('8,8').b).toBe('station');
  });
});

describe('Bahnhöfe, Linien, Strom und Bonus', () => {
  // Bahnhof auf der Heimatinsel bei (8,8), einer auf der Waldinsel; Schienen direkt als Felder (ohne Baukosten)
  const line = () => {
    unlock();
    const [wx, wy] = game('[Math.round(ISLE_BY_ID.wald.cx) + 4, Math.round(ISLE_BY_ID.wald.cy)]');
    game(`state.tiles.set('8,8', { b: 'station', lvl: 1, rot: 0 }); state.tiles.set('${wx},${wy}', { b: 'station', lvl: 1, rot: 0 })`);
    // Schiene: vor dem Heimatbahnhof (9,8) nach +x bis wx+1, dann in y bis wy – liegt dort direkt vor dem Waldbahnhof
    let x = 9, y = 8;
    const set = () => game(`if (!state.tiles.has('${x},${y}')) state.tiles.set('${x},${y}', { b: 'schiene', lvl: 1 })`);
    set();
    while (x !== wx + 1) { x += Math.sign(wx + 1 - x); set(); }
    while (y !== wy) { y += Math.sign(wy - y); set(); }
    game('recalc()');
    return [wx, wy];
  };

  it('zwei Bahnhöfe auf verschiedenen Inseln, verbunden: eine Linie – ohne Strom fährt sie nicht', () => {
    line();
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('T.rail.lines[0].regions')).toEqual(['home', 'wald']);
    expect(game('T.rail.lines[0].powered')).toBe(false);
    const tiles = game('T.rail.lines[0].tiles');
    expect(tiles).toBeGreaterThan(10);
    expect(game('T.rail.lines[0].need')).toBe(1 + Math.ceil(tiles / 10));      // 1 ⚡ + 1 ⚡ je km
    expect(game('T.rail.lines[0].loop')).toBe(null);                           // keine Kreisbahn
  });

  it('mit genug Windrädern fährt der Zug: +8 Pendler je Bahnhof, +10 % auf beiden Inseln', () => {
    line();
    game("state.tiles.set('6,4', { b: 'feld', lvl: 1 }); recalc()");
    const pop = game('T.pop'), inc = game("T.st.get('6,4').inc"), need = game('T.rail.lines[0].need');
    for (let i = 0; i < need - 1; i++) game(`state.tiles.set('${6 + i},12', { b: 'windrad', lvl: 1 })`);
    game('recalc()');
    expect(game('T.rail.lines[0].powered')).toBe(false);                       // ein Windrad zu wenig
    game(`state.tiles.set('${6 + need - 1},12', { b: 'windrad', lvl: 1 }); recalc()`);
    expect(game('T.rail.lines[0].powered')).toBe(true);
    expect(game('T.pop')).toBe(pop + 16);
    expect(game("T.st.get('6,4').inc")).toBeCloseTo(inc * 1.1);
    expect(game("T.rail.regions.has('home') && T.rail.regions.has('wald')")).toBe(true);
  });

  it('Infofenster: Linie, Strom, Zug wählen – gilt für alle Bahnhöfe der Linie', () => {
    const [wx, wy] = line();
    game('openInfo(8, 8)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toContain('Linie Heimatinsel ↔ Waldinsel');
    expect(txt).toContain('Zu wenig Strom');
    document.querySelector('[data-train="0:tram"]').onclick();
    document.querySelector('[data-tcol="0:2"]').onclick();
    expect(game(`[state.tiles.get('8,8').train, state.tiles.get('${wx},${wy}').train, state.tiles.get('${wx},${wy}').trainCol]`)).toEqual(['tram', 'tram', 2]);
  });

  it('zwei Bahnhöfe auf derselben Insel sind keine Linie', () => {
    unlock();
    game("state.tiles.set('8,4', { b: 'station', lvl: 1 }); state.tiles.set('8,8', { b: 'station', lvl: 1 })");
    for (let y = 4; y <= 9; y++) game(`state.tiles.set('10,${y}', { b: 'schiene', lvl: 1 })`);
    game("state.tiles.set('9,4', { b: 'schiene', lvl: 1 }); state.tiles.set('9,9', { b: 'schiene', lvl: 1 }); recalc()");
    expect(game('T.rail.lines.length')).toBe(0);
  });

  it('der Bahnhof dreht sich beim Setzen zur Schiene', () => {
    unlock();
    game("rotManual = false; for (let y = 3; y <= 10; y++) state.tiles.set('10,' + y, { b: 'schiene', lvl: 1 }); recalc()");
    expect(game("build('station', 9, 6, true)")).toBe(true);
    const front = game("frontTiles('station', 9, 6, state.tiles.get('9,6').rot)");
    expect(front.some(([x]) => x === 10)).toBe(true);
  });

  it('Zugmodell und Farbe werden gespeichert', () => {
    unlock();
    game("state.tiles.set('8,8', { b: 'station', lvl: 1, train: 'tram', trainCol: 3 }); save()");
    const t = game('load()').tiles.get('8,8');
    expect([t.train, t.trainCol]).toEqual(['tram', 3]);
  });
});

describe('Der Zug fährt', () => {
  // kleine Linie auf der Heimatinsel, mit einem „fremden“ Bahnhof: regionAt wird dafür umgebogen
  const setup = (wind = 2) => {
    unlock();
    game("state.tiles.set('7,4', { b: 'station', lvl: 1, rot: 0 }); state.tiles.set('7,10', { b: 'station', lvl: 1, rot: 0 })");
    for (let y = 4; y <= 11; y++) game(`state.tiles.set('8,${y}', { b: 'schiene', lvl: 1 })`);
    game("state.tiles.set('9,11', { b: 'schiene', lvl: 1 }); state.tiles.set('10,11', { b: 'schiene', lvl: 1 })");   // Kurve am Ende
    for (let i = 0; i < wind; i++) game(`state.tiles.set('12,${4 + i * 2}', { b: 'windrad', lvl: 1 })`);
    game("globalThis.__ra = regionAt; regionAt = (x, y) => y >= 9 ? 'wald' : 'home'; recalc(); syncMovers()");
  };
  afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc(); syncMovers()'));

  it('Weg über die Schienen von Bahnhof zu Bahnhof, Kurven als Bogen', () => {
    setup();
    const path = game("railPath('8,4', '8,10')");
    expect(path[0]).toBe('8,4');
    expect(path[path.length - 1]).toBe('8,10');
    expect(path.length).toBe(7);
    const pl = game("railPolyline(['8,10', '8,11', '9,11'])");
    expect(pl.len).toBeGreaterThan(1.5);
    expect(pl.len).toBeLessThan(2.1);                                   // Bogen (0,79) statt Ecke (1,0)
  });

  it('mit Strom fährt er los und hält an den Bahnhöfen', () => {
    setup();
    expect(game('trains.length')).toBe(1);
    const s0 = game('trains[0].c');
    for (let i = 0; i < 40; i++) game('stepMovers(0.1)');
    expect(game('trains[0].c')).not.toBe(s0);
    expect(game('trainCars().length')).toBe(2);                         // Regionalbahn: 2 Wagen
  });

  it('ohne Strom steht er still (und zeigt ⚡)', () => {
    setup(1);
    expect(game('trains.length')).toBe(1);
    expect(game('trains[0].powered')).toBe(false);
    const s0 = game('trains[0].c');
    for (let i = 0; i < 40; i++) game('stepMovers(0.1)');
    expect(game('trains[0].c')).toBe(s0);
  });

  it('alle drei Modelle lassen sich zeichnen, tags und nachts', () => {
    setup();
    for (const [model, n] of [['regio', 2], ['tram', 1], ['modern', 3]]) {
      game(`state.tiles.get('7,4').train = '${model}'; syncMovers()`);
      expect(game('trainCars().length')).toBe(n);
      for (const night of [0, 0.8]) {
        expect(() => game(`night = ${night}; for (const c of trainCars()) drawTrainCar(c, 1.5, 1000)`)).not.toThrow();
      }
    }
    game('night = 0');
  });
});
