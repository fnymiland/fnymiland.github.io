const { loadGame, game } = require('./helpers/load-game');

// Rundkurs, mehrere Züge und Strom für Züge und Stadt
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99');
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.restore.erzberg = 1; state.techs.add('bahn'); recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc(); syncMovers()'));
const wind = n => { for (let i = 0; i < n; i++) game(`state.tiles.set('${2 + (i % 20)},${22 - Math.floor(i / 20)}', { b: 'windrad', lvl: 1 })`); };
// Ring von (a,a) bis (b,b), zwei Bahnhöfe außen an der linken und rechten Seite; der rechte liegt „auf einer anderen Insel“
function ring(a, b) {
  for (let x = a; x <= b; x++) for (const y of [a, b]) game(`state.tiles.set('${x},${y}', { b: 'schiene', lvl: 1 })`);
  for (let y = a + 1; y < b; y++) for (const x of [a, b]) game(`state.tiles.set('${x},${y}', { b: 'schiene', lvl: 1 })`);
  const m = Math.floor((a + b) / 2);
  game(`state.tiles.set('${a - 1},${m}', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('${b + 1},${m}', { b: 'station', lvl: 1, rot: 0, train: 'regio' })`);
  game(`globalThis.__ra = regionAt; regionAt = (x, y) => x > ${m} ? 'wald' : 'home'; recalc(); syncMovers()`);
  return m;
}

describe('Rundkurs', () => {
  it('ein geschlossener Kreis mit Bahnhöfen daran ist ein Rundkurs', () => {
    ring(6, 12);
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('T.rail.lines[0].loop.length')).toBe(24);
    expect(game('T.rail.lines[0].tiles')).toBe(24);
  });

  it('der Zug fährt immer in dieselbe Richtung weiter, statt umzudrehen', () => {
    ring(6, 12); wind(10); game('recalc(); syncMovers()');
    expect(game('trains[0].loop')).toBe(true);
    const len = game('trains[0].route.len');
    let prev = game('trains[0].ls.tau'), laps = 0, last = game('trains[0].c');
    for (let i = 0; i < 600; i++) {
      game('stepMovers(0.1)');
      const c = game('trains[0].c');
      if (c < last - len / 2) laps++;                                        // über den Nahtpunkt: weiter vorwärts
      else expect(c).toBeGreaterThanOrEqual(last - 1e-9);                    // nie rückwärts
      last = c;
    }
    expect(laps).toBeGreaterThanOrEqual(1);
    expect(game('trains[0].ls.tau')).toBeGreaterThan(prev);
  });

  it('eine Strecke mit Ästen (kein Kreis) bleibt hin und zurück', () => {
    ring(6, 12);
    game("state.tiles.delete('9,6'); recalc()");
    expect(game('T.rail.lines[0].loop')).toBe(null);
  });

  it('ein Stumpfgleis am Kreis stört nicht – der Ring ist trotzdem ein Rundkurs', () => {
    ring(6, 12);
    game("state.tiles.set('9,5', { b: 'schiene', lvl: 1 }); state.tiles.set('9,4', { b: 'schiene', lvl: 1 }); recalc()");
    expect(game('T.rail.lines[0].loop.length')).toBe(24);
  });
});

describe('Mehrere Züge', () => {
  it('erst ab 4 km Kreis: + Zug kaufen – dann fahren beide gleichmäßig verteilt', () => {
    ring(4, 8);                                                              // 16 Felder = 1,6 km
    expect(game('T.rail.lines[0].max')).toBe(1);
    game('closePanel(); state.tiles.clear()');
    for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) game(`state.terra.set('${x},${y}', 'grass')`);
    ring(4, 16);                                                             // 48 Felder = 4,8 km
    expect(game('T.rail.lines[0].max')).toBe(2);
    wind(20); game('recalc(); syncMovers(); openInfo(3, 10)');
    const m = game('state.money');
    document.querySelector('[data-tadd]').onclick();
    expect(game('state.money')).toBe(m - game('EXTRA_TRAIN.money'));
    expect(game("state.tiles.get('3,10').extra.length")).toBe(1);
    expect(game("state.tiles.get('17,10').extra.length")).toBe(1);        // an allen Bahnhöfen der Linie
    expect(game('T.rail.lines[0].running')).toBe(2);
    expect(game('trains.length')).toBe(2);
    const gap = () => { const L = game('trains[0].route.len'), d = ((game('trains[1].c') - game('trains[0].c')) % L + L) % L; return Math.min(d, L - d); };
    for (let i = 0; i < 300; i++) { game('stepMovers(0.1)'); expect(gap()).toBeGreaterThan(3); }   // nie aufeinander
  });

  it('jeder Zug braucht eigenen Strom – mit Strom für nur einen fährt nur einer', () => {
    ring(4, 16);
    game("state.tiles.get('3,10').extra = [{ model: 'tram', col: 2 }]; state.tiles.get('17,10').extra = [{ model: 'tram', col: 2 }]; recalc()");
    const need = game('T.rail.lines[0].need');
    expect(need).toBe(1 + 5);                                                // 4,8 km → 5
    wind(need); game('recalc(); syncMovers()');
    expect(game('T.rail.lines[0].running')).toBe(1);
    expect(game('trains.length')).toBe(1);
  });

  it('zweiter Zug: mehr Plätze; Aussehen je Zug; wird gespeichert', () => {
    ring(4, 16); wind(6); game('recalc()');
    expect(game('T.rail.lines[0].seats')).toBe(2 * 60);                      // Regionalbahn: 2 Wagen
    game("for (const k of ['3,10', '17,10']) state.tiles.get(k).extra = [{ model: 'modern', col: 4 }]");
    wind(20); game('recalc(); syncMovers()');
    expect(game('T.rail.lines[0].seats')).toBe(120 + game("trainSeats({ model: 'modern' })"));   // dazu ein Triebwagen (3 Wagen, schneller)
    expect(game('trains.map(t => t.model)')).toEqual(['regio', 'modern']);
    game('save()');
    expect(game("load().tiles.get('3,10').extra")).toEqual([{ model: 'modern', col: 4 }]);
  });
});

describe('Strom für die Stadt', () => {
  const lamps = n => { for (let i = 0; i < n; i++) game(`state.decos.set('${3 + (i % 18)},${3 + Math.floor(i / 18) * 2}', [{ b: 'laterne', rot: 0 }, null, null, null])`); };

  it('ohne Windräder (noch nicht freigeschaltet) braucht die Stadt keinen Strom', () => {
    game("state.tiles.set('10,10', { b: 'fabrik', lvl: 1 }); recalc()");
    expect(game("available('windrad')")).toBe(false);
    expect(game("T.st.get('10,10').noPower")).toBeFalsy();
    expect(game('T.rail.power.demand')).toBe(0);
  });

  it('Werkstatt ohne Strom: halbe Einnahmen und ⚡; mit 2 Windrädern voll', () => {
    game("state.restore.klippe = 3; state.tiles.set('10,10', { b: 'fabrik', lvl: 1 }); recalc()");
    expect(game("T.st.get('10,10').noPower")).toBe(true);
    const half = game("T.st.get('10,10').inc");
    wind(2); game('recalc()');
    expect(game("T.st.get('10,10').noPower")).toBeFalsy();
    expect(game("T.st.get('10,10').inc")).toBeCloseTo(half * 2);
  });

  it('je 10 Laternen 1 ⚡ – ohne Strom bleiben sie dunkel und zählen halb für die Schönheit', () => {
    game('state.restore.klippe = 3'); lamps(15); game('recalc()');
    expect(game('T.rail.power.demand')).toBe(2);
    expect(game('T.rail.power.dark.size')).toBe(15);
    const b0 = game('T.beauty');
    wind(1); game('recalc()');
    expect(game('T.rail.power.dark.size')).toBe(5);                          // die ersten 10 leuchten
    wind(2); game('recalc()');
    expect(game('T.rail.power.dark.size')).toBe(0);
    expect(game('T.beauty')).toBeGreaterThan(b0);
    expect(() => game("night = 0.8; state.decos.get('3,3'); drawObject('laterne', 100, 100, 1, 1000, 3, 3, 1, { rot: 0, slot: 0 }); night = 0")).not.toThrow();
  });

  it('erst die Stadt, dann die Züge', () => {
    game('state.restore.klippe = 3');
    ring(6, 12);
    game("state.tiles.set('16,16', { b: 'fabrik', lvl: 1 })"); wind(3); game('recalc()');
    expect(game("T.st.get('16,16').noPower")).toBeFalsy();
    expect(game('T.rail.lines[0].powered')).toBe(false);                     // 3 ⚡ − 2 für die Werkstatt < 4 für den Zug
  });

  it('Windrad-Fenster zeigt die Bilanz', () => {
    game("state.restore.klippe = 3; state.tiles.set('10,10', { b: 'fabrik', lvl: 1 })"); wind(1); game('recalc(); openInfo(2, 22)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toContain('1 erzeugt, 2 gebraucht');
    expect(txt).toContain('Werkstätten 2');
  });
});
