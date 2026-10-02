const { loadGame, game } = require('./helpers/load-game');

// Block 28: Jedes Wunder hat einen dauerhaften Bonus und eine eigene Fähigkeit
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e9; state.science = 1e6; for (const r of Object.keys(RES)) state.res[r] = 99999');
  game("for (let y = 3; y <= 20; y++) for (let x = 3; x <= 20; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
afterEach(() => vi.useRealTimers());
const done = (b, k) => game(`state.tiles.set('${k}', { b: '${b}', lvl: 1, phase: WONDERS.${b}.phases.length }); recalc()`);
const at = ms => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(ms); };

describe('🎡 Riesenrad: Jahrmarkt', () => {
  it('in den ersten 3 Minuten jeder Viertelstunde dreifache Einnahmen – beim Verdienen und oben in der Anzeige', () => {
    game("for (let x = 3; x <= 6; x++) state.tiles.set(x + ',3', { b: 'feld', lvl: 1 })");
    done('riesenrad', '10,10');
    const q = 15 * 60e3 * 1000;                                  // eine volle Viertelstunde
    at(q + 60e3);
    expect(game('boostMul("inc")')).toBe(3);
    const m0 = game('state.money');
    game('earn(1)');
    expect(game('state.money') - m0).toBeCloseTo(game('T.inc') * 3);
    game('updateHud()');
    expect(document.getElementById('rate').textContent).toMatch(/×3/);
    at(q + 4 * 60e3);
    expect(game('boostMul("inc")')).toBe(1);
    expect(game('fairNext()')).toBe(11 * 60e3);
  });

  it('ohne Riesenrad kein Jahrmarkt', () => {
    at(15 * 60e3 * 1000 + 1000);
    expect(game('boostMul("inc")')).toBe(1);
  });
});

describe('🔭 Sternwarte', () => {
  it('Boot doppelt so schnell', () => {
    expect(game('expMinutes(ISLE_BY_ID.kristall)')).toBe(10);
    done('sternwarte', '10,10');
    expect(game('expMinutes(ISLE_BY_ID.kristall)')).toBe(5);
  });

  it('Sternschnuppe fällt neben ein Haus – antippen bringt Ideen', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 })");
    done('sternwarte', '12,12');
    const s = game('spawnStar(() => 0.5)');
    expect(Math.abs(s.x - 8)).toBeLessThanOrEqual(2);
    const sci = game('state.science');
    expect(game(`collectStarAt(${s.x}, ${s.y})`)).toBe(true);
    expect(game('state.science')).toBeGreaterThanOrEqual(sci + 50);
    expect(game('fallenStars.length')).toBe(0);
    expect(game(`collectStarAt(${s.x}, ${s.y})`)).toBe(false);
  });

  it('Sterne verschwinden nach einer Weile', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 })");
    game('spawnStar(() => 0.5, 0)');
    game('starTick(STAR_LIFE + 1)');
    expect(game('fallenStars.length')).toBe(0);
  });
});

describe('🌉 Seebrücke: Hafenstadt', () => {
  it('ein Auftragsplatz mehr, Aufträge zahlen +50 %, Schiffe schneller', () => {
    game("state.tiles.set('4,4', { b: 'hafen', lvl: 2 }); recalc()");
    const slots = game('orderSlots()'), seats = game("shipSeats({ model: 'holz' })");
    const rnd = '(() => { let i = 0; const v = [0.1, 0.5, 0.5, 0.5, 0.5]; return () => v[i++ % v.length]; })()';
    game('state.res.erz = 10000');
    const pay = game(`makeOrder(0, ${rnd}).pay`);
    done('seebruecke', '15,15');
    expect(game('orderSlots()')).toBe(slots + 1);
    expect(game("shipSeats({ model: 'holz' })")).toBe(Math.round(seats * 1.25));
    expect(Math.abs(game(`makeOrder(0, ${rnd}).pay`) / (pay * 1.5) - 1)).toBeLessThan(0.05);   // Preise sind gerundet
  });
});

describe('🌿 Botanischer Garten: grüner Daumen', () => {
  it('„Park“ und „schöne Umgebung“ überall erfüllt, Felder und Obst doppelt, exotische Deko frei', () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 3 }); state.tiles.set('4,8', { b: 'feld', lvl: 1 }); recalc()");
    expect(game("wishCheck('park', 4, 4).ok")).toBe(false);
    expect(game("available('palme')")).toBe(false);
    const feld = game("T.st.get('4,8').inc");
    done('botgarten', '12,12');
    expect(game("wishCheck('park', 4, 4)")).toEqual({ ok: true, how: 'garten' });
    expect(game("wishCheck('schoen', 4, 4).ok")).toBe(true);
    expect(game("T.st.get('4,8').inc")).toBeCloseTo(feld * 2);
    expect(game("available('palme') && available('riesenblume')")).toBe(true);
    expect(() => game("drawObject('palme', 300, 300, 1.5, 1000, 4, 4, 1, { slot: 0 }); drawObject('riesenblume', 300, 300, 1.5, 1000, 4, 4, 1, { slot: 1 })")).not.toThrow();
  });
});

describe('🏰 Schloss: Erlasse', () => {
  it('nach dem Bau wartet ein Erlass; gewählt wirkt er 5 Minuten, der nächste kommt 10 Minuten nach der Wahl', () => {
    at(1e12);
    game('state.festival = true');
    expect(game('decreeReady()')).toBe(false);
    done('schloss', '8,8');
    expect(game('decreeReady()')).toBe(true);
    expect(game('boostLines()')).toMatch(/Erlass wartet/);
    game('openInfo(8, 8)');
    expect(document.querySelectorAll('#panel [data-decree-pick]').length).toBe(4);
    document.querySelector('#panel [data-decree-pick="gelehrt"]').onclick();
    expect(game('boostMul("sci")')).toBe(3);
    expect(game('decreeReady()')).toBe(false);
    at(1e12 + 5 * 60e3 + 1);
    expect(game('boostMul("sci")')).toBe(1);
    expect(game('decreeReady()')).toBe(false);
    at(1e12 + 10 * 60e3 + 1);
    expect(game('decreeReady()')).toBe(true);
    expect(game('load().decreeNext')).toBe(1e12 + 10 * 60e3);   // gespeichert
  });

  it('Handelstag: sofort Frachter an alle Auftragsplätze', () => {
    game("state.festival = true; state.tiles.set('4,4', { b: 'hafen', lvl: 3 }); state.res.erz = 50000; state.orders = []");
    done('schloss', '8,8');
    expect(game("chooseDecree('handel')")).toBe(true);
    expect(game('state.orders.length')).toBe(game('orderSlots()'));
  });

  it('Doppelte Ernte: Rohstoffe ×2', () => {
    game("state.festival = true; state.terra.set('4,4', 'forest'); state.tiles.set('4,4', { b: 'holz', lvl: 1 }); state.tiles.set('5,5', { b: 'haus', lvl: 3 })");
    done('schloss', '8,8');
    const r0 = game('state.res.holz'), rate = game('T.prod.holz');
    game("chooseDecree('ernte'); produce(1)");
    expect(game('state.res.holz') - r0).toBeCloseTo(rate * 2);
  });
});
