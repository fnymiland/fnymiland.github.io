const { loadGame, game } = require('./helpers/load-game');

// U-Bahn (Block 136, Konzept mit dem Nutzer): Tunnel unter der Erde gehören zum selben Netz wie Schienen; Portale entstehen
// von selbst; U-Bahn-Stationen stehen auf dem Tunnel und zählen wie Bahnhöfe. Auch ein Netz ganz ohne Schienen fährt.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999');
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.restore.erzberg = 1; state.techs.add('bahn'); state.techs.add('ubahn'); recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));
const wind = n => { for (let i = 0; i < n; i++) game(`state.tiles.set('${2 + (i % 20)},${22 - Math.floor(i / 20)}', { b: 'windrad', lvl: 3 })`); };
const twoPlaces = () => game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");

describe('Forschung und Menü', () => {
  it('U-Bahn kommt nach der Eisenbahn; Tunnel und U-Bahn-Station stehen unter Verkehr', () => {
    expect(game('TECH_BY_ID.ubahn.req')).toEqual(['bahn']);
    expect(game("MENU[0].groups.find(g => g.id === 'verkehr').items.slice(0, 4)")).toEqual(['schiene', 'tunnel', 'station', 'ubahn']);
    game("state.techs.delete('ubahn')");
    expect(game("placeError('tunnel', 8, 8)")).toMatch(/erst mit/);
  });
});

describe('Tunnel bauen', () => {
  it('unter einem Haus und einem Weg – oben bleibt alles stehen; kostet 60 Taler', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); state.tiles.set('9,8', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    const m = game('state.money');
    expect(game("build('tunnel', 8, 8, true) && build('tunnel', 9, 8, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 120);
    expect(game("[state.tiles.get('8,8').b, state.tiles.get('9,8').b, state.tunnels.has('8,8')]")).toEqual(['haus', 'weg', true]);
  });
  it('unter Wasser teurer (150) und ins Meer nur direkt neben eigenem Land', () => {
    game("state.terra.set('8,8', 'water'); recalc()");
    const m = game('state.money');
    expect(game("build('tunnel', 8, 8, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 150);
  });
  it('nicht unter Schienen/Bahnhöfen, und keine Schiene über einen Tunnel (ein Feld ist Schiene ODER Tunnel)', () => {
    game("build('schiene', 8, 8, true); build('tunnel', 10, 8, true)");
    expect(game("placeError('tunnel', 8, 8)")).toMatch(/Unter Schienen/);
    expect(game("placeError('schiene', 10, 8)")).toMatch(/Über einem Tunnel/);
    expect(game("placeError('station', 10, 8)")).toMatch(/U-Bahn-Station/);
  });
  it('abreißen: erst was oben steht, dann der Tunnel – voll zurück', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); recalc(); build('tunnel', 8, 8, true)");
    expect(game('demolishInfo(8, 8).tunnel')).toBeUndefined();               // erst das Haus
    game("state.tiles.delete('8,8'); recalc()");
    expect(game('demolishInfo(8, 8).refund')).toBe(60);
    const m = game('state.money');
    game('demolish(8, 8)');
    expect(game("state.tunnels.has('8,8')")).toBe(false);
    expect(game('state.money')).toBe(m + 60);
  });
  it('rückgängig, speichern und laden', () => {
    game("undoable(() => build('tunnel', 8, 8, true))");
    expect(game('undo()')).toBe(true);
    expect(game("state.tunnels.has('8,8')")).toBe(false);
    game("build('tunnel', 8, 8, true); build('tunnel', 9, 8, true); state.tunnels.get('9,8').form = 3; save()");
    const s = game('load()');
    expect(game(`[...load().tunnels]`)).toEqual([['8,8', {}], ['9,8', { form: 3 }]]);
    expect(s).toBeTruthy();
  });
  it('als Linie ziehen (wie eine Schiene)', () => {
    expect(game("LINE_TOOLS.has('tunnel') && dragKind('tunnel')")).toBe('line');
  });
});

describe('Ein Netz: Schiene – Portal – Tunnel', () => {
  it('Schiene neben Tunnel ist ein Portal; beide sind ein Netz', () => {
    for (let x = 4; x <= 7; x++) game(`build('schiene', ${x}, 10, true)`);
    for (let x = 8; x <= 12; x++) game(`build('tunnel', ${x}, 10, true)`);
    game('recalc()');
    expect(game('portalDir(7, 10)')).toEqual([1, 0]);
    expect(game('portalDir(6, 10)')).toBe(null);
    expect(game("T.rail.comp.get('4,10') === T.rail.comp.get('12,10')")).toBe(true);
    expect(game("railArms(7, 10).map(a => a.join())").sort()).toEqual(['-1,0', '1,0']);
  });
  it('Form „Passend“: Rampe neben Häusern/Wegen, sonst Backstein; gewählte Form gilt', () => {
    game("build('schiene', 7, 10, true); build('tunnel', 8, 10, true); recalc()");
    expect(game('portalForm(7, 10)')).toBe('backstein');
    game("state.tiles.set('6,9', { b: 'haus', lvl: 1 }); recalc()");
    expect(game('portalForm(7, 10)')).toBe('rampe');
    game("state.tunnels.get('8,10').form = DECO_LOOKS.tunnel.forms.findIndex(f => f.id === 'stein')");
    expect(game('portalForm(7, 10)')).toBe('stein');
  });
  it('Rampe zwei Felder lang (Nutzer: „sonst zu steil“), wenn davor gerade Schiene liegt; die Wagen dort sinken schon mit', () => {
    for (let x = 4; x <= 7; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    game("state.tunnels.set('8,10', { form: 1 }); recalc()");
    expect(game('rampLen(7, 10, [1, 0])')).toBe(2);
    const c = game("trainTunnelCut({ px: 6, py: 10, du: 1, dv: 0, len: 0.8 })");
    expect([c.k, c.portal.len, c.portal.ramp]).toEqual(['7,10', 2, true]);
    expect(game("rampSink({ R: [7, 10], d: [1, 0], len: 2 }, 5.5, 10)")).toBe(0);           // oben am Anfang
    expect(game("rampSink({ R: [7, 10], d: [1, 0], len: 2 }, 7.5, 10)")).toBe(game('RAMP_D'));   // unten an der Wand
    game("state.tiles.delete('5,10'); state.tiles.set('6,11', { b: 'schiene', lvl: 1 }); recalc()");   // davor eine Kurve
    expect(game('rampLen(7, 10, [1, 0])')).toBe(1);
  });
  it('Zug fährt durch den Tunnel; im Berg ist der Wagen unsichtbar, am Portal abgeschnitten', () => {
    twoPlaces();
    for (let x = 4; x <= 7; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    for (let x = 8; x <= 16; x++) game(`state.tunnels.set('${x},10', {})`);
    game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('15,10', { b: 'ubahn', lvl: 1 })");
    wind(10); game('recalc(); syncTrains()');
    expect(game('T.rail.lines.length')).toBe(1);
    const route = game('trains[0].route.pts.map(p => Math.round(p[0]) + "," + Math.round(p[1]))');
    expect(route).toContain('12,10');                                       // durch den Tunnel
    expect(game("trainTunnelCut({ px: 12, py: 10, du: 1, dv: 0, len: 0.8 })")).toBe('hide');
    expect(game("trainTunnelCut({ px: 4, py: 10, du: 1, dv: 0, len: 0.8 })")).toBe(null);
    const c = game("trainTunnelCut({ px: 7.4, py: 10, du: 1, dv: 0, len: 0.8 })");   // Wand bei x = 7,5: vorne 0,1 drin
    expect(c.k).toBe('7,10');
    expect(c.cut[0]).toBeCloseTo(-0.4); expect(c.cut[1]).toBeCloseTo(0.1);
  });
});

describe('U-Bahn-Station', () => {
  it('nur auf einen Tunnel; zählt wie ein Bahnhof und hält auf ihrem eigenen Feld', () => {
    expect(game("placeError('ubahn', 8, 8)")).toMatch(/Auf einen Tunnel/);
    game("build('tunnel', 8, 8, true)");
    expect(game("placeError('ubahn', 8, 8)")).toBe(null);
    expect(game("build('ubahn', 8, 8, true)")).toBe(true);
    game('recalc()');
    expect(game("railStop('8,8')")).toBe('8,8');
    expect(game("T.rail.stationNet.get('8,8')")).not.toBe(null);
  });
  it('Nutzer: „was, wenn jemand 100 % U-Bahn baut?“ – ein Netz nur aus Tunneln und U-Bahn-Stationen fährt', () => {
    twoPlaces();
    for (let x = 4; x <= 16; x++) game(`state.tunnels.set('${x},10', {})`);
    game("state.tiles.set('5,10', { b: 'ubahn', lvl: 1, train: 'regio' }); state.tiles.set('15,10', { b: 'ubahn', lvl: 1 })");
    game("for (let x = 3; x <= 17; x++) state.tiles.set(x + ',9', { b: 'haus', lvl: 1 })");   // oben eine ganze Häuserzeile
    wind(10); game('recalc(); syncTrains()');
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('T.rail.lines[0].running')).toBe(1);
    expect(game('trains.length')).toBe(1);
    const stops = game('trains[0].stops.length');
    expect(stops).toBe(2);
  });
  it('Bahnhof oben hängt nicht an einem Tunnel daneben (nur an Schienen)', () => {
    game("state.tunnels.set('8,10', {}); state.tiles.set('7,10', { b: 'station', lvl: 1, rot: 0 }); recalc()");
    expect(game("T.rail.stationNet.get('7,10')")).toBe(null);
  });
});

describe('Viertel verbinden (Nutzer: „Bahn und U-Bahn ergänzen sich“ – nur zusätzlich, nie schlechter)', () => {
  // Viertel A: Häuser x 3–5 mit U-Bahn bei 6; Lücke ohne Weg; Viertel B: Schule und Café bei x 19 mit U-Bahn bei 18; Tunnel 6–18
  function city(withLine = true) {
    for (let x = 3; x <= 5; x++) game(`state.tiles.set('${x},4', { b: 'haus', lvl: 2 })`);
    game("state.tiles.set('19,4', { b: 'schule', lvl: 1 }); state.tiles.set('19,5', { b: 'cafe', lvl: 1 }); state.tiles.set('20,4', { b: 'haus', lvl: 1 })");
    if (withLine) {
      for (let x = 6; x <= 18; x++) game(`state.tunnels.set('${x},4', {})`);
      game("state.tiles.set('6,4', { b: 'ubahn', lvl: 1, train: 'regio' }); state.tiles.set('18,4', { b: 'ubahn', lvl: 1 })");
    }
    wind(12); game('recalc()');
  }
  it('ohne Linie: getrennte Viertel – der Schul-Wunsch bleibt offen, das Café hat keine Kundschaft von drüben', () => {
    city(false);
    expect(game("NET.vOf('4,4') === NET.vOf('19,4')")).toBe(false);
    expect(game("wishCheck('schule', 4, 4).ok")).toBe(false);
  });
  it('mit U-Bahn: Schule erfüllt den Wunsch (über die Bahn), Café bekommt Kundschaft aus Viertel A, Fahrkarten', () => {
    city(false);
    const want0 = game("T.st.get('19,5').want"), fare0 = game('T.traffic.fare');
    for (let x = 6; x <= 18; x++) game(`state.tunnels.set('${x},4', {})`);
    game("state.tiles.set('6,4', { b: 'ubahn', lvl: 1, train: 'regio' }); state.tiles.set('18,4', { b: 'ubahn', lvl: 1 }); recalc()");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('T.rail.lines[0].inner && T.rail.lines[0].running')).toBe(1);
    expect(game("wishCheck('schule', 4, 4)")).toEqual({ ok: true, how: 'bahn' });
    expect(game("T.st.get('19,5').line")).toBeGreaterThan(0);
    expect(game("T.st.get('19,5').want")).toBeGreaterThan(want0);
    expect(game('T.traffic.fare')).toBeGreaterThan(fare0);
  });
  it('nie statt der eigenen: haben beide Viertel ein Café, kommt keins dazu und keins verliert', () => {
    city(false);
    game("state.tiles.set('3,5', { b: 'cafe', lvl: 1 }); recalc()");
    const a0 = game("T.st.get('3,5').want"), b0 = game("T.st.get('19,5').want");
    for (let x = 6; x <= 18; x++) game(`state.tunnels.set('${x},4', {})`);
    game("state.tiles.set('6,4', { b: 'ubahn', lvl: 1, train: 'regio' }); state.tiles.set('18,4', { b: 'ubahn', lvl: 1 }); recalc()");
    expect(game("T.st.get('3,5').want")).toBe(a0);
    expect(game("T.st.get('19,5').want")).toBe(b0);
  });
  it('Strom: eine Linie zwischen Inseln behält ihren Zug, auch wenn eine Insel-Linie dazukommt', () => {
    twoPlaces();
    for (let x = 4; x <= 16; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('17,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
    wind(1); game('recalc()');
    const need = game('T.rail.lines[0].need');
    game('state.tiles.forEach((t, k) => { if (t.b === "windrad") state.tiles.delete(k) })');
    const perMill = game("powerOf({ b: 'windrad', lvl: 3 }, '2,22')");
    wind(Math.ceil(need / perMill)); game('recalc()');
    expect(game('T.rail.lines[0].running')).toBe(1);
    for (let x = 4; x <= 8; x++) game(`state.tunnels.set('${x},14', {})`);   // U-Bahn auf der Heimatinsel
    game("state.tiles.set('4,14', { b: 'ubahn', lvl: 1 }); state.tiles.set('8,14', { b: 'ubahn', lvl: 1 }); recalc()");
    const lines = game('T.rail.lines.map(l => [!!l.inner, l.running])');
    expect(lines[0]).toEqual([false, 1]);                                    // die Insel-Linie kommt hinten dran
  });
});

