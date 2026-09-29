const { loadGame, game } = require('./helpers/load-game');

// Inseln entdecken: Steg am Ufer, Boot losschicken, nach einer Weile ist die Insel entdeckt
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("state.money = 5000; for (let i = 0; i < 3; i++) state.tiles.set((4 + 2 * i) + ',4', { b: 'haus', lvl: 1 }); recalc()");
});
const $ = id => document.getElementById(id);
// Wasser am eigenen Ufer (für den Steg)
const shore = () => game(`(() => {
  for (let y = -20; y < 40; y++) for (let x = -20; x < 40; x++) if (placeError('bootssteg', x, y) === null) return [x, y];
})()`);

describe('Steg', () => {
  it('von Anfang an baubar, aber nur ins Meer direkt an der Küste (nicht in den Teich)', () => {
    expect(game("available('bootssteg')")).toBe(true);
    expect(game("placeError('bootssteg', 4, 6)")).toMatch(/Meer/);
    game("state.terra.set('8,8', 'water'); sandCache.clear()");
    expect(game("placeError('bootssteg', 8, 8)")).toMatch(/Meer/);
    const [x, y] = shore();
    expect(game(`build('bootssteg', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`ownedTile(${x}, ${y})`)).toBe(true);
  });

  it('lässt sich zeichnen – mit Boot zu Hause und ohne (unterwegs)', () => {
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true)`);
    expect(() => game(`drawObject('bootssteg', 300, 300, 1.5, 1000, ${x}, ${y}, 1, state.tiles.get('${x},${y}'))`)).not.toThrow();
    game('sendExpedition()');
    expect(() => game(`drawObject('bootssteg', 300, 300, 1.5, 1000, ${x}, ${y}, 1, state.tiles.get('${x},${y}'))`)).not.toThrow();
    expect(() => game('drawBoatMover(expeditionBoat(), 1.5, 1000)')).not.toThrow();
  });
});

describe('Expedition', () => {
  it('ohne Steg geht es nicht; mit Steg kostet das Ablegen, das Boot ist dann unterwegs', () => {
    expect(game('expeditionError()')).toMatch(/Steg/);
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true)`);
    const m = game('state.money');
    expect(game('sendExpedition()')).toBe(true);
    expect(game('state.money')).toBe(m - 150);
    expect(game('state.expedition.isle')).toBe('wald');
    expect(game('(state.expedition.until - state.expedition.t0) / 60000')).toBe(1);   // Waldinsel: 1 Minute
    expect(game('sendExpedition()')).toBe(false);                                     // schon unterwegs
    expect(game('checkExpedition()')).toBe(false);                                    // noch nicht zurück
    expect(game("isleOpen('wald')")).toBe(false);
  });

  it('kommt das Boot zurück, ist die Insel entdeckt – mit Tagebuchseite', () => {
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true); sendExpedition(); state.expedition.until = Date.now() - 1`);
    expect(game('checkExpedition()')).toBe(true);
    expect(game("isleOpen('wald')")).toBe(true);
    expect(game('state.expedition')).toBe(null);
    expect(game('state.diary.includes("isle:wald")')).toBe(true);
    expect(game('diaryPage("isle:wald").title')).toContain('Waldinsel');
    expect($('modal').textContent).toContain('Land in Sicht');
    game('closeModal()');
  });

  it('wird gespeichert (auch wenn das Spiel zwischendurch zu ist)', () => {
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true); sendExpedition(); save()`);
    const e = game('load().expedition');
    expect(e.isle).toBe('wald');
    expect(e.from).toBe(`${x},${y}`);
  });

  it('das Boot fährt hin, sucht und kommt zurück', () => {
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true); sendExpedition()`);
    const at = p => game(`(() => { const e = state.expedition; e.t0 = Date.now() - ${p} * 60000; e.until = e.t0 + 60000; const b = expeditionBoat(); return [b.px, b.py]; })()`);
    const [sx, sy] = at(0.001), [mx, my] = at(0.45), [ex, ey] = at(0.999);
    const [ix, iy] = game('[ISLE_BY_ID.wald.cx, ISLE_BY_ID.wald.cy]');
    expect(Math.hypot(sx - x, sy - y)).toBeLessThan(1);
    expect(Math.hypot(mx - ix, my - iy)).toBeLessThan(game('ISLE_R') + 3);
    expect(Math.hypot(ex - x, ey - y)).toBeLessThan(1);
  });

  it('Inselfenster: ohne Steg „Steg bauen“, mit Steg „Boot losschicken“', () => {
    game("openIsle('wald')");
    expect($('p-steg')).not.toBe(null);
    $('p-steg').onclick();
    expect(game('tool')).toBe('bootssteg');
    const [x, y] = shore();
    game(`build('bootssteg', ${x}, ${y}, true); openIsle('wald')`);
    expect($('p-expo').disabled).toBe(false);
    $('p-expo').onclick();
    expect(game('!!state.expedition')).toBe(true);
    expect($('panel').textContent).toContain('unterwegs');
  });
});

describe('Fähre', () => {
  // zwei Häfen, links „Heimatinsel“, rechts „Waldinsel“
  const ports = () => {
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
    game("for (const k of ['4,12', '16,12']) state.tiles.set(k, { b: 'hafen', lvl: 1, rot: 0 }); state.res.bretter = 50; recalc()");
  };
  afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));

  it('am Hafen einrichten: kostet einmal, dann fährt sie – Plätze nach Hafen-Stufe, ohne Strom', () => {
    ports();
    game('openInfo(4, 12)');
    const m = game('state.money');
    document.querySelector('[data-ferry="16,12"]').onclick();
    expect(game('state.money')).toBe(m - game('FERRY_COST.money'));
    expect(game('T.ferries.length')).toBe(1);
    expect(game('T.ferries[0].regions')).toEqual(['home', 'wald']);
    expect(game('T.ferries[0].seats')).toBe(100);
    game("state.tiles.get('4,12').lvl = 3; state.tiles.get('16,12').lvl = 2; recalc()");
    expect(game('T.ferries[0].seats')).toBe(180);                        // die kleinere Stufe zählt
    game('save()');
    expect(game("load().tiles.get('4,12').ferry")).toBe('16,12');         // bleibt gespeichert
  });

  it('befördert Fahrgäste, bindet an und lässt sich wieder einstellen (Geld zurück)', () => {
    ports();
    for (let i = 0; i < 12; i++) game(`state.tiles.set('${2 + (i % 4)},${2 + Math.floor(i / 4)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('14,4', { b: 'riesenrad', lvl: 1, phase: 99 }); state.terra.set('18,14', 'forest'); state.tiles.set('18,14', { b: 'holz', lvl: 1 })");
    game("state.tiles.get('4,12').ferry = '16,12'; recalc()");
    expect(game('T.ferries[0].traffic.demand')).toBeGreaterThan(0);
    expect(game("T.st.get('18,14').how")).toBe('bahn');
    expect(() => game('for (const b of ferryBoats(1000)) drawFerryMover(b, 1.5, 1000)')).not.toThrow();
    game('openInfo(16, 12)');
    expect(document.getElementById('panel').textContent).toMatch(/Fähre Heimatinsel ↔ Waldinsel/);
    const m = game('state.money');
    document.querySelector('[data-ferry-off]').onclick();
    expect(game('T.ferries.length')).toBe(0);
    expect(game('state.money')).toBe(m + game('FERRY_COST.money'));
  });

  it('ohne zweiten Hafen auf einer anderen Insel: nur der Hinweis', () => {
    game("state.tiles.set('4,12', { b: 'hafen', lvl: 1, rot: 0 }); recalc(); openInfo(4, 12)");
    expect(document.getElementById('panel').textContent).toMatch(/zweiten Hafen auf einer anderen Insel/);
  });
});

describe('Fischkutter', () => {
  it('je Hafen-Stufe ein Kutter, jeder bringt Taler', () => {
    const [x, y] = game(`(() => { for (let yy = -20; yy < 40; yy++) for (let xx = -20; xx < 40; xx++) if (placeError('hafen', xx, yy, 0, { move: true }) === null && DIRS.some(([dx, dy]) => terrainAt(xx + 0.5 + dx * 4 | 0, yy + 0.5 + dy * 4 | 0) === 'water')) return [xx, yy]; })()`);
    game(`state.tiles.set('${x},${y}', { b: 'hafen', lvl: 1, rot: 0 }); recalc()`);
    const inc1 = game(`T.st.get('${x},${y}').inc`);
    expect(inc1).toBeGreaterThan(0);
    game(`state.tiles.get('${x},${y}').lvl = 3; recalc()`);
    expect(game(`T.st.get('${x},${y}').inc`)).toBeCloseTo(inc1 * 3);
    expect(game('fishBoats(1000).length')).toBe(3);
    expect(() => game('for (const b of fishBoats(1000)) drawFishMover(b, 1.5, 1000)')).not.toThrow();
  });
});

describe('Handel und Kreuzfahrt', () => {
  const harbor = lvl => {
    const [x, y] = game(`(() => { for (let yy = -20; yy < 40; yy++) for (let xx = -20; xx < 40; xx++) if (placeError('hafen', xx, yy, 0, { move: true }) === null && seaDir(xx + 0.5, yy + 0.5)) return [xx, yy]; })()`);
    game(`state.tiles.set('${x},${y}', { b: 'hafen', lvl: ${lvl}, rot: 0 }); recalc()`);
    return [x, y];
  };
  it('Handel erst ab dem Handelshafen; verkaufen bringt den Preis, kaufen kostet anderthalbmal so viel', () => {
    harbor(1);
    game('state.res.holz = 30');
    expect(game("trade('holz', -10)")).toBe(false);
    game("for (const t of state.tiles.values()) if (t.b === 'hafen') t.lvl = 2");
    const m = game('state.money'), p = game("tradePrice('holz')");
    expect(game("trade('holz', -10)")).toBe(true);
    expect(game('state.res.holz')).toBe(20);
    expect(game('state.money')).toBeCloseTo(m + 10 * p, 5);
    const m2 = game('state.money');
    expect(game("trade('metall', 10)")).toBe(true);
    expect(game('state.res.metall')).toBe(10);
    expect(game('state.money')).toBeCloseTo(m2 - 10 * game("tradePrice('metall')") * 1.5, 1);
    expect(game("trade('holz', -100)")).toBe(false);                     // so viel ist nicht da
  });

  it('die Preise schwanken zwischen 60 % und 140 %', () => {
    const ps = [];
    for (let t = 0; t < 30 * 60e3; t += 30e3) ps.push(game(`tradePrice('bretter', ${t})`));
    expect(Math.min(...ps)).toBeGreaterThanOrEqual(10 * 0.6 - 1e-9);
    expect(Math.max(...ps)).toBeLessThanOrEqual(10 * 1.4 + 1e-9);
    expect(Math.max(...ps) - Math.min(...ps)).toBeGreaterThan(5);
  });

  it('Kreuzfahrt am Großen Hafen: Gäste bringen Geld, je mehr es in der Nähe anzieht', () => {
    const [x, y] = harbor(3);
    game(`state.tiles.set('${x + 4},${y - 6}', { b: 'riesenrad', lvl: 1, phase: 99 }); recalc()`);
    const a = game(`cruiseAttraction(${x + 0.5}, ${y + 0.5})`);
    expect(a).toBeGreaterThanOrEqual(300);
    expect(game('checkCruises(1000)')).toBe(0);                          // erstes Mal: Termin setzen
    const m = game('state.money');
    expect(game(`checkCruises(state.tiles.get('${x},${y}').cruise + 1)`)).toBe(1);
    expect(game('state.money')).toBeCloseTo(m + a * game('CRUISE_PAY'), 5);
    expect(() => game('for (const s of cruiseShips()) drawCruiseMover(s, 1.5, 1000)')).not.toThrow();
    game(`openInfo(${x}, ${y})`);
    expect(document.getElementById('panel').textContent).toMatch(/Kreuzfahrt/);
    expect(document.getElementById('panel').textContent).toMatch(/Handel/);
  });
});
