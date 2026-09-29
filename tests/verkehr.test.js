const { loadGame, game } = require('./helpers/load-game');

// Verkehr: Orte ziehen Leute an, Linien befördern sie – so viele, wie Plätze da sind
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99');
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.restore.erzberg = 1; state.techs.add('bahn'); recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));
const wind = n => { for (let i = 0; i < n; i++) game(`state.tiles.set('${2 + (i % 20)},${22 - Math.floor(i / 20)}', { b: 'windrad', lvl: 3 })`); };
// Gerade Strecke von x=4 bis x=16 (y=10), Bahnhöfe an beiden Enden; rechts von x=10 ist „die Waldinsel“
function line(power = 10) {
  for (let x = 4; x <= 16; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
  game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0 }); state.tiles.set('17,10', { b: 'station', lvl: 1, rot: 0 })");
  game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
  wind(power); game('recalc()');
}
const L = () => 'T.rail.lines[0]';

describe('Einwohner und Anziehung je Ort', () => {
  it('Häuser zählen als Einwohner ihres Orts; Sehenswürdigkeit, Wunderwerk und Deko ziehen an', () => {
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
    game("state.tiles.set('4,4', { b: 'haus', lvl: 1 }); state.tiles.set('14,4', { b: 'haus', lvl: 3 })");
    game("state.tiles.set('12,14', { b: 'riesenrad', lvl: 1, phase: 99 }); state.decos.set('4,6', [{ b: 'blumentopf' }, null, null, null])");
    const p = game('(() => { const s = placeStats(); return { home: s.pop.get("home"), wald: s.pop.get("wald"), attrW: s.attr.get("wald"), attrH: s.attr.get("home") }; })()');
    expect(p.home).toBe(4);
    expect(p.wald).toBe(game('HOUSE_STAGES[2].pop'));
    expect(p.attrW).toBe(300);                                                          // Riesenrad
    expect(p.attrH).toBeCloseTo(game('ITEMS.blumentopf.beauty') / 10);
  });
});

describe('Fahrgäste einer Linie', () => {
  it('Pendler: ½ je Einwohner außerhalb des größten Orts; Besucher: Anziehung, höchstens ½ je Einwohner drüben', () => {
    const tr = game(`lineTraffic({ regions: ['home', 'wald'], seats: 120 },
      { pop: new Map([['home', 400], ['wald', 60]]), attr: new Map([['home', 20], ['wald', 150]]) })`);
    expect(tr.commute).toBe(30);                    // 60 Einwohner drüben
    expect(tr.visits.get('wald')).toBe(150);        // Anziehung 150, 400 × ½ wären genug
    expect(tr.visits.get('home')).toBe(20);         // Anziehung 20 (60 × ½ = 30 wären da)
    expect(tr.demand).toBe(200);
    expect(tr.served).toBeCloseTo(0.6);             // 120 Plätze für 200
    expect(tr.fare).toBeCloseTo(120 * game('FARE') / 60);
    expect(tr.spend).toBeCloseTo(170 * 0.6 * game('VISIT_SPEND') / 60);
  });

  it('eine Sehenswürdigkeit braucht Leute, die kommen können: ohne Einwohner drüben keine Besucher', () => {
    const tr = game(`lineTraffic({ regions: ['home', 'wald'], seats: 120 },
      { pop: new Map([['home', 0], ['wald', 0]]), attr: new Map([['wald', 150]]) })`);
    expect(tr.demand).toBe(0);
    expect(tr.served).toBe(1);
  });
});

describe('Züge im Spiel', () => {
  it('Fahrkarten und Besucher bringen Taler; die Sehenswürdigkeit drüben ist angebunden', () => {
    for (let i = 0; i < 30; i++) game(`state.tiles.set('${3 + (i % 6)},${3 + Math.floor(i / 6)}', { b: 'haus', lvl: 3 })`);  // 30 Häuser daheim
    game("state.tiles.set('12,14', { b: 'riesenrad', lvl: 1, phase: 99 })");
    line(60);                                                                           // genug Strom auch fürs Riesenrad
    expect(game(`${L()}.powered`)).toBe(true);
    game("const _s = state.tiles.get('17,10'); state.tiles.delete('17,10'); recalc(); globalThis.__inc0 = T.inc; state.tiles.set('17,10', _s); recalc()");
    const inc0 = game('globalThis.__inc0');
    const pop = 30 * game('HOUSE_STAGES[2].pop');
    expect(game(`${L()}.traffic.visits.get('wald')`)).toBe(Math.min(300, pop / 2));  // Riesenrad zieht 300 an – so viele Leute gibt es
    expect(game('T.traffic.fare + T.traffic.spend')).toBeGreaterThan(0);
    expect(game('T.inc')).toBeGreaterThan(inc0);
    expect(game(`${L()}.traffic.served`)).toBeCloseTo(120 / game(`${L()}.traffic.demand`));   // eine Regionalbahn: 120 Plätze
  });

  it('überfüllt: angebunden, aber nur so gut, wie die Linie es schafft', () => {
    for (let i = 0; i < 30; i++) game(`state.tiles.set('${3 + (i % 6)},${3 + Math.floor(i / 6)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('12,14', { b: 'riesenrad', lvl: 1, phase: 99 }); state.terra.set('17,13', 'forest'); state.tiles.set('17,13', { b: 'holz', lvl: 1 })");
    line();
    const s = game("T.st.get('17,13')"), served = game(`${L()}.traffic.served`);
    expect(s.how).toBe('bahn');
    expect(served).toBeLessThan(1);
    expect(s.eff).toBeCloseTo(0.5 + 0.5 * served);
  });

  it('Wagen anhängen: +60 Plätze, kostet Taler und Metall, braucht mehr Strom; abhängen gibt es zurück', () => {
    line();
    game('openInfo(3, 10)');
    const m0 = game('state.money'), met0 = game('state.res.metall'), need0 = game(`${L()}.needs[0]`);
    document.querySelector('[data-carplus="0"]').onclick();
    expect(game('state.money')).toBe(m0 - game('EXTRA_CAR.money'));
    expect(game('state.res.metall')).toBe(met0 - game('EXTRA_CAR.metall'));
    expect(game("[state.tiles.get('3,10').trainPlus, state.tiles.get('17,10').trainPlus]")).toEqual([1, 1]);
    expect(game(`${L()}.seats`)).toBe(3 * 60);
    expect(game(`${L()}.needs[0]`)).toBeCloseTo(need0 * 1.5);
    game('openInfo(3, 10)');
    document.querySelector('[data-carminus="0"]').onclick();
    expect(game('state.money')).toBe(m0);
    expect(game("state.tiles.get('3,10').trainPlus")).toBe(undefined);
    document.querySelector('[data-carplus="0"]') || game('openInfo(3, 10)');
    document.querySelector('[data-carplus="0"]').onclick();
    game('save()');
    expect(game("load().tiles.get('3,10').trainPlus")).toBe(1);             // angehängte Wagen bleiben gespeichert
  });

  it('Bahnhof-Fenster zeigt Fahrgäste, Plätze, Auslastung und Einnahmen', () => {
    for (let i = 0; i < 30; i++) game(`state.tiles.set('${3 + (i % 6)},${3 + Math.floor(i / 6)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('12,14', { b: 'riesenrad', lvl: 1, phase: 99 })");
    line();
    game('openInfo(17, 10)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toMatch(/Fahrgäste: \d+\/min/);
    expect(txt).toMatch(/Plätze: 120\/min/);
    expect(txt).toMatch(/Überfüllt/);
    expect(txt).toMatch(/Fahrkarten/);
  });
});

describe('Anzeige', () => {
  it('Lager zeigt die Fahrgäste; überfüllte Bahnhöfe zeigen 😣', () => {
    for (let i = 0; i < 49; i++) game(`state.tiles.set('${3 + (i % 7)},${3 + Math.floor(i / 7)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('12,14', { b: 'riesenrad', lvl: 1, phase: 99 })");
    line(60);
    expect(game('storeHtml()')).toMatch(/Fahrgäste<\/span><b>120\/min/);
    expect(game('storeHtml()')).toMatch(/wollen mit/);
    game("resize(); const c = iso(10, 10); cam.x = c.x; cam.y = c.y; cam.z = 1");
    game('globalThis.__dsi = drawStatusIcon; drawStatusIcon = (x, y, z, icon) => globalThis.__icons.push(icon)');
    game('globalThis.__icons = []; render(1000)');
    expect(game('globalThis.__icons')).toContain('😣');
    game('drawStatusIcon = globalThis.__dsi');
  });
});

describe('Seilbahn', () => {
  const cable = () => {
    game("state.inventions.add('seilbahn')");
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
    game("state.tiles.set('6,15', { b: 'seilbahn', lvl: 1 }); state.tiles.set('20,15', { b: 'seilbahn', lvl: 1 }); recalc()");
  };
  it('zwei Stationen bis 20 Felder: eine Verbindung mit 80 Plätzen, ohne Strom', () => {
    cable();
    expect(game('T.cables.length')).toBe(1);
    expect(game('T.cables[0].regions')).toEqual(['home', 'wald']);
    expect(game('T.cables[0].seats')).toBe(80);
  });

  it('befördert Besucher und bindet die Gegend drüben an', () => {
    for (let i = 0; i < 30; i++) game(`state.tiles.set('${3 + (i % 6)},${3 + Math.floor(i / 6)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('12,3', { b: 'riesenrad', lvl: 1, phase: 99 }); state.terra.set('20,18', 'forest'); state.tiles.set('20,18', { b: 'holz', lvl: 1 })");
    cable();
    const tr = game('T.cables[0].traffic');
    expect(tr.demand).toBeGreaterThan(80);
    expect(tr.served).toBeCloseTo(80 / tr.demand);
    expect(game("T.st.get('20,18').how")).toBe('bahn');
    game('openInfo(20, 15)');
    expect(document.getElementById('panel').textContent).toMatch(/Seil zur Station auf der Heimatinsel/);
  });

  it('Zug und Seilbahn zwischen denselben Inseln teilen sich die Fahrgäste nach Plätzen', () => {
    for (let i = 0; i < 30; i++) game(`state.tiles.set('${3 + (i % 6)},${3 + Math.floor(i / 6)}', { b: 'haus', lvl: 3 })`);
    game("state.tiles.set('12,3', { b: 'riesenrad', lvl: 1, phase: 99 })");
    line(60);
    game("state.inventions.add('seilbahn'); state.tiles.set('6,15', { b: 'seilbahn', lvl: 1 }); state.tiles.set('20,15', { b: 'seilbahn', lvl: 1 }); recalc()");
    const rail = game(`${L()}.traffic`), cab = game('T.cables[0].traffic');
    expect(rail.groupSeats).toBe(120 + 80);
    expect(rail.served).toBeCloseTo(cab.served);
    expect(rail.carried + cab.carried).toBeCloseTo(rail.demand * rail.served);
    expect(rail.carried / cab.carried).toBeCloseTo(120 / 80);
  });
});
