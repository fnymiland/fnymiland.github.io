const { loadGame, game } = require('./helpers/load-game');

// U-Bahn (Block 136, Konzept mit dem Nutzer): Tunnel unter der Erde gehören zum selben Netz wie Schienen; verbunden über eine
// Tunneleinfahrt; U-Bahn-Stationen stehen auf dem Tunnel und zählen wie Bahnhöfe. Auch ein Netz ganz ohne Schienen fährt.
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
    expect(game("MENU[0].groups.find(g => g.id === 'verkehr').items.slice(0, 5)")).toEqual(['schiene', 'tunnel', 'tunneleinfahrt', 'station', 'ubahn']);
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
    game("build('tunnel', 8, 8, true); build('tunnel', 9, 8, true); save()");
    const s = game('load()');
    expect(game(`[...load().tunnels]`)).toEqual([['8,8', {}], ['9,8', {}]]);
    expect(s).toBeTruthy();
  });
  it('als Linie ziehen (wie eine Schiene)', () => {
    expect(game("LINE_TOOLS.has('tunnel') && dragKind('tunnel')")).toBe('line');
  });
});

describe('Tunneleinfahrt (Nutzer: „einen Tunnel bauen, eine Einfahrt dazu und dann Schienen ran“)', () => {
  // Schiene 4–5, Einfahrt A = 6, B = 7 (Drehung 3: zum Tunnel nach +x), Tunnel ab 8
  const ein = (form = 0) => game(`state.tiles.set('6,10', { b: 'tunneleinfahrt', lvl: 1, rot: 3, ${form ? `form: ${form}` : ''} }); recalc()`);
  it('Schiene direkt am Tunnel verbindet nicht (Hinweis im Fenster); mit Einfahrt ist es ein Netz', () => {
    for (let x = 4; x <= 7; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    for (let x = 8; x <= 12; x++) game(`state.tunnels.set('${x},10', {})`);
    game('recalc()');
    expect(game("T.rail.comp.get('4,10') === T.rail.comp.get('12,10')")).toBe(false);
    game('openInfo(7, 10)');
    expect(document.getElementById('panel').textContent).toContain('Tunneleinfahrt');
    game("closePanel(); state.tiles.delete('6,10'); state.tiles.delete('7,10')"); ein();
    expect(game("T.rail.comp.get('4,10') === T.rail.comp.get('12,10')")).toBe(true);
    expect(game("railArms(5, 10).map(a => a.join())").sort()).toEqual(['-1,0', '1,0']);   // die Schiene läuft in die Einfahrt
  });
  it('dreht sich von selbst mit dem hinteren Ende zum Tunnel; nicht auf den Tunnel; kostet 1.000', () => {
    game("state.tunnels.set('8,10', {}); state.tunnels.set('20,8', {}); recalc(); rotManual = false");
    expect(game("placeRot('tunneleinfahrt', 6, 10)")).toBe(3);
    expect(game("placeRot('tunneleinfahrt', 20, 9)")).toBe(2);
    expect(game("placeError('tunneleinfahrt', 8, 10)")).toMatch(/Nicht auf den Tunnel/);
    const m = game('state.money');
    expect(game("build('tunneleinfahrt', 6, 10, true)")).toBe(true);
    expect(game('state.money')).toBe(m - 1000);
    expect(game("einOf(7, 10)")).toEqual({ A: [6, 10], B: [7, 10], d: [1, 0] });
  });
  it('Nutzer: „du stellst sie falschherum hin“ – das Feld unter der Maus wird das hintere Feld am Tunnel, aus allen vier Richtungen', () => {
    game("state.tunnels.set('10,10', {}); recalc(); rotManual = false");
    for (const [hx, hy] of [[11, 10], [9, 10], [10, 11], [10, 9]]) {
      const [ax, ay] = game(`einAnchor(${hx}, ${hy})`), r = game(`placeRot('tunneleinfahrt', ${ax}, ${ay})`);
      const E = game(`einTiles(${ax}, ${ay}, ${r})`);
      expect(E.B, `${hx},${hy}`).toEqual([hx, hy]);                              // hinten = das Feld unter der Maus
      expect([E.B[0] + E.d[0], E.B[1] + E.d[1]], `${hx},${hy}`).toEqual([10, 10]);   // dahinter der Tunnel
    }
  });
  it('nur vorn Schiene und hinten Tunnel verbinden – seitlich nicht', () => {
    game("state.tunnels.set('8,10', {}); state.tiles.set('5,10', { b: 'schiene', lvl: 1 }); state.tiles.set('6,11', { b: 'schiene', lvl: 1 }); state.tunnels.set('7,9', {})"); ein();
    expect(game('[trackLink(6, 10, 5, 10), trackLink(6, 10, 7, 10), trackLink(7, 10, 8, 10)]')).toEqual([true, true, true]);
    expect(game('[trackLink(6, 10, 6, 11), trackLink(7, 10, 7, 9), trackLink(5, 10, 8, 10)]')).toEqual([false, false, false]);
  });
  it('Zug fährt hindurch: Rampe sinkt über beide Felder bis zur Wand; Portal: Wand zwischen A und B, dahinter unsichtbar', () => {
    twoPlaces();
    for (let x = 4; x <= 5; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    for (let x = 8; x <= 16; x++) game(`state.tunnels.set('${x},10', {})`);
    game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('15,10', { b: 'ubahn', lvl: 1 })"); ein();
    wind(10); game('syncTrains()');
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('trains[0].route.pts.map(p => Math.round(p[0]) + "," + Math.round(p[1]))')).toContain('12,10');
    let c = game("trainTunnelCut({ px: 6, py: 10, du: 1, dv: 0, len: 0.8 })");                  // Rampe (Form 0)
    expect([c.k, c.portal.ramp]).toEqual(['7,10', true]);                                   // mit dem späteren Feld
    expect(game("rampSink({ R: [7, 10], d: [1, 0] }, 5.5, 10)")).toBe(0);
    expect(game("rampSink({ R: [7, 10], d: [1, 0] }, 7.5, 10)")).toBe(game('RAMP_D'));
    c = game("trainTunnelCut({ px: 7.4, py: 10, du: 1, dv: 0, len: 0.8 })");
    expect(c.cut[1]).toBeCloseTo(0.1);
    expect(game("trainTunnelCut({ px: 12, py: 10, du: 1, dv: 0, len: 0.8 })")).toBe('hide');
    game("state.tiles.get('6,10').form = 1");                                                // Backstein: Wand zwischen A und B
    c = game("trainTunnelCut({ px: 6.4, py: 10, du: 1, dv: 0, len: 0.8 })");
    expect([c.k, c.portal.ramp]).toEqual(['6,10', false]); expect(c.cut[1]).toBeCloseTo(0.1);
    expect(game("trainTunnelCut({ px: 7, py: 10, du: 1, dv: 0, len: 0.8 })")).toBe('hide');
  });
  it('Fenster der Einfahrt: Form wählen; zeigt, ob hinten Tunnel und vorn Schiene sind', () => {
    game("state.tunnels.set('8,10', {})"); ein();
    game('openInfo(6, 10)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toContain('Hinten am Tunnel'); expect(txt).toContain('Vorn noch keine Schiene');
    [...document.querySelectorAll('#panel [data-dform]')].find(b => b.getAttribute('aria-label') === 'Form: Backstein').click();
    expect(game("state.tiles.get('6,10').form")).toBe(1);
    game('closePanel()');
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

describe('Bauansicht', () => {
  it('blass nur mit Tunnel/U-Bahn in der Hand, beim Entfernen nur die Linien (Nutzer: „genauso ausgegraut“)', () => {
    game("state.tunnels.set('8,8', {}); recalc()");
    const fills = t => game(`(() => { setTool('${t}'); let n = 0; const f0 = g.fillRect; g.fillRect = function (...a) { if (a[2] >= W) n++; return f0.apply(this, a); }; try { drawTunnelView(1) } finally { g.fillRect = f0 } setTool('look'); return n; })()`);
    expect(fills('tunnel')).toBe(1);
    expect(fills('abriss')).toBe(0);
    expect(fills('schiene')).toBe(0);
  });
});

describe('Tunnel antippen', () => {
  it('Tunnel ohne etwas darüber: eigenes Fenster mit Entfernen; neben einer Schiene der Hinweis auf die Einfahrt', () => {
    game("state.tiles.set('7,10', { b: 'schiene', lvl: 1 }); for (let x = 8; x <= 10; x++) state.tunnels.set(x + ',10', {}); recalc()");
    game('openTunnelInfo(8, 10)');
    expect(document.getElementById('panel').textContent).toContain('Tunneleinfahrt');
    game('openTunnelInfo(10, 10)');
    document.getElementById('p-del').click();
    expect(game("state.tunnels.has('10,10')")).toBe(false);
    game('closePanel()');
  });
});

describe('Zugarten (Nutzer: „wieso kann man keinen Schnellzug auswählen?“)', () => {
  it('gesperrte Züge: sichtbarer Hinweis, Antippen öffnet die Forschung bei Verkehr', () => {
    twoPlaces();
    for (let x = 4; x <= 16; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('17,10', { b: 'station', lvl: 1, rot: 0 })");
    wind(10); game('recalc(); openInfo(3, 10)');
    const lock = [...document.querySelectorAll('#panel [data-vlock]')];
    expect(lock.map(b => b.textContent)).toEqual(['🔒 Triebwagen', '🔒 Schnellzug']);
    expect(document.getElementById('panel').textContent).toContain('Forschung → 🚢 Verkehr');
    lock[1].click();
    expect(game('researchTab')).toBe('verkehr');
    expect(game("document.getElementById('modal').hidden")).toBe(false);
    game('closeModal()');
  });
});

describe('U-Bahn-Station einfärben (Nutzer: „Stationen farbig einfärben“)', () => {
  it('Wand und Dach wählbar wie beim Bahnhof; das U-Schild bleibt blau', () => {
    game("state.tunnels.set('8,8', {}); state.tiles.set('8,8', { b: 'ubahn', lvl: 1 }); recalc(); openInfo(8, 8)");
    const labels = [...document.querySelectorAll('#panel .label')].map(l => l.textContent);
    expect(labels).toEqual(expect.arrayContaining(['Wand', 'Dach & Mast']));
    const m = game("[...repaintMap(REPAINT.ubahn, { wall: 3, roof: 5 })].map(([k]) => k)");
    expect(m).toContain('#2f62b8');                                         // Dachkante folgt der Wahl
    expect(m).not.toContain('#2d5fb3');                                     // Schild nicht
    const pav = game("(() => { const m = repaintMap(REPAINT.ubahn, { wall: 3, roof: 5 }); return [m.has('#2f7a56'), m.has('#9fd3e3')]; })()");
    expect(pav).toEqual([true, true]);                                      // Pavillon: Gestell = Wand, Glasdach = Dach
    expect(game("REPAINT.ubahn.roof.some(e => (Array.isArray(e) ? e[0] : e) === '#2f7a56')")).toBe(false);
    game('closePanel()');
  });
});

describe('Tunnel abreißen (Nutzer: „nicht mehrfach löschen, auch nicht in der Mitte einzeln“)', () => {
  it('mit 🧹 als Rechteck und einzeln mitten im Tunnel; unter einem Haus bleibt er (erst das Haus)', () => {
    for (let x = 4; x <= 12; x++) game(`state.tunnels.set('${x},10', {})`);
    game("state.tiles.set('6,10', { b: 'haus', lvl: 1 }); recalc(); setTool('abriss')");
    game("startPlan('rect', { x: 8, y: 10 }, { x: 8, y: 10 }, true); undoable(() => runPlan())");   // einzeln in der Mitte
    expect(game("state.tunnels.has('8,10')")).toBe(false);
    game("startPlan('rect', { x: 4, y: 10 }, { x: 7, y: 10 }, true); undoable(() => runPlan())");   // mehrere, eins unter dem Haus
    expect(game("[4, 5, 6, 7].map(x => state.tunnels.has(x + ',10'))")).toEqual([false, false, true, false]);
    expect(game("state.tiles.has('6,10')")).toBe(false);                     // das Haus ist weg, der Tunnel darunter noch da
    game("setTool('look')");
  });
});


// Nutzer, 09.10.2026: „man kann keinen Weg als Untergrund machen – auf einem Platz ist Wiese drunter“
describe('U-Bahn-Station auf einem Weg', () => {
  it('der Weg bleibt darunter (wie bei Ständen); nachträglich Weg darunter legen geht auch; kein Dach drüber, keine Deko an die Seiten', () => {
    game("for (let x = 8; x <= 10; x++) state.tiles.set(x + ',8', { b: 'weg', lvl: 1, style: 'kopf' }); recalc(); build('tunnel', 9, 8, true)");
    expect(game("build('ubahn', 9, 8, true)")).toBe(true);
    expect(game("[bAt(9, 8), wegUnder(state.tiles.get('9,8'))]")).toEqual(['ubahn', 'kopf']);
    game("build('tunnel', 12, 12, true); build('ubahn', 12, 12, true)");
    expect(game("wegUnder(state.tiles.get('12,12'))")).toBe(null);
    expect(game("build('weg', 12, 12, true)")).toBe(true);                       // Weg unter die Station legen
    expect(game("[bAt(12, 12), wegUnder(state.tiles.get('12,12'))]")).toEqual(['ubahn', game("currentStyle('weg')")]);
    expect(game("roofError(9, 8, true)")).toBeTruthy();
    expect(game("smallError('blumentopf', 9, 8, 5, { noCost: true })")).toBe('Auf Gebäudefeldern nur an die Ecken');
  });
});
