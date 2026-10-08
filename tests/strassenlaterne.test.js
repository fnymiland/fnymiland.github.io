const { loadGame, game } = require('./helpers/load-game');

// Block 132: große Straßenlaternen – kleine Deko am Wegrand, hoher Mast, nachts Lichtfleck; 6 Formen, Farben wie die Laternen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999; for (const d of DESIGN) state.design.add(d.id)');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } chosenStyle.weg = 'sand'; for (let x = 2; x <= 14; x++) build('weg', x, 8); for (let y = 2; y <= 14; y++) build('weg', 8, y); recalc(); rotManual = false");
});

describe('Straßenlaternen (Block 132)', () => {
  it('am Wegrand: Ausleger zeigt über den Weg (beide Seiten, beide Richtungen); Eckpunkt erlaubt', () => {
    const side = (x, y, slot) => { game(`buildSmall('strassenlaterne', ${x}, ${y}, ${slot})`); const r = game(`state.decos.get('${x},${y}')[${slot}].rot`); return r & 2 ? -1 : 1; };
    // Weg entlang x (y = 8): Platz 5 liegt oben rechts → Ausleger nach links; Platz 7 unten links → nach rechts
    expect([side(4, 8, 5), side(5, 8, 7)]).toEqual([-1, 1]);
    // Weg entlang y (x = 8): Platz 4 oben links → nach rechts; Platz 6 unten rechts → nach links
    expect([side(8, 4, 4), side(8, 5, 6)]).toEqual([1, -1]);
    expect(game("smallError('strassenlaterne', 11, 9, VSLOT)")).toBeFalsy();
  });
  it('braucht doppelt so viel Strom wie eine kleine Laterne: 6 große = 12 kleine = 2 Einheiten', () => {
    const put = (b, n) => game(`(() => { for (let i = 0; i < ${n}; i++) { const ds = newSlots(); ds[5] = { b: '${b}', rot: 0 }; state.decos.set((2 + i) + ',3', ds); } })()`);
    const clear = () => game("for (let i = 0; i < 14; i++) state.decos.delete((2 + i) + ',3')");
    put('strassenlaterne', 6); const big = game('computePower([], 100, 1).use.lamps'); clear();
    put('laterne', 12); const small = game('computePower([], 100, 1).use.lamps'); clear();
    put('laterne', 6); const half = game('computePower([], 100, 1).use.lamps');
    expect(big).toBe(small); expect(big).toBe(2); expect(half).toBe(1);
  });
  it('alle Formen und Farben zeichnen ohne Fehler, Tag und Nacht, nah und weit', () => {
    for (let f = 0; f < 6; f++) game(`(() => { const ds = newSlots(); ds[5] = { b: 'strassenlaterne', form: ${f}, col: ${f}, rot: ${f % 4} }; state.decos.set('${2 + f},8', ds); })()`);
    game('recalc()');
    for (const h of [12, 23]) for (const z of [2.5, 0.6]) game(`(() => { const gh = gameHour; gameHour = () => ${h}; try { cam = state.cam; cam.z = ${z}; const p = iso(5, 8); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); } finally { gameHour = gh; } })()`);
    expect(game("DECO_LOOKS.strassenlaterne.forms.map(f => f.id)")).toEqual(['schinkel', 'peitsche', 'kugel', 'doppel', 'hirtenstab', 'boulevard']);
    expect(game("!!DESIGN_BY_ID['strassenlaterne'] && !!DESIGN_BY_ID['strassenlaterne:form:boulevard']")).toBe(true);
  });
});

describe('Ballons & Zeppelin abschaltbar (Nutzer, 08.10.2026)', () => {
  it('Schalter im Menü (nur mit Ballon/Zeppelin), aus = nichts am Himmel, gilt je Gerät', () => {
    game("closeModal(); state.inventions = new Set(); showMenu()");
    expect(game("!!document.getElementById('m-sky')")).toBe(false);
    game("closeModal(); state.inventions = new Set(['ballon', 'zeppelin']); setSkyShow(true); showMenu()");
    const drawn = () => game("(() => { let n = 0; const b = drawBalloon, zz = drawZeppelin; drawBalloon = () => { n++; }; drawZeppelin = () => { n++; }; try { drawSky(1e6, 1); } finally { drawBalloon = b; drawZeppelin = zz; } return n; })()");
    expect(drawn()).toBe(5);
    game("document.getElementById('m-sky').click()");
    expect(game('skyShow')).toBe(false);
    expect(game("localStorage.getItem('kachelhausen_himmel')")).toBe('0');
    expect(drawn()).toBe(0);
    expect(game("document.getElementById('m-sky').textContent")).toMatch(/aus/);
    game("setSkyShow(true); closeModal()");
  });
});
