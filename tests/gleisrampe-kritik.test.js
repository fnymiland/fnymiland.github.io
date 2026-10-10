const { loadGame, game } = require('./helpers/load-game');

// Gleis-Rampe, kritische Prüfung (10.10.2026): was beim Versuch, die Regeln zu brechen, und in den Nahaufnahmen (tools/gleisrampe-pruefung.js,
// tools/vorschau/gleisrampe-nah-final.png) auffiel – Treppe in die Anhöhe hinter der Rampe, Schienenlinie quer über die Rampe, Fußgängerbrücke
// über die Kante, Übermalen des schmalen Einschnitts über einen Zug (nur seine sichtbaren Flächen), Schatten der Wagen an Damm- und Viaduktwand
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 34; y++) for (let x = 0; x <= 34; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(13, 13); cam.x = p.x; cam.y = p.y; } night = 0');
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } if (moving) cancelMove(); plan = null; trains.length = 0; syncTrains.sig = null; recalc()'));
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i, r.form])(rampAt(${x}, ${y}))`);

describe('Regeln brechen', () => {
  it('Treppe in die Anhöhe direkt hinter dem oberen Feld einer Gleis-Rampe: nie (sie führte sonst gegen die Treppe)', () => {
    hills(block(10, 8, 16, 14));
    game("rampNewForm = 'b'; build('huegelrampe', 12, 15); rampNewForm = 'a'; build('huegelrampe', 14, 13)");
    expect([ramp(12, 15), ramp(14, 13)]).toEqual([['12,15', 0, 3, 2, 'b'], ['14,13', 0, 2, 1, 'a']]);
    // hinter B (12,14) und hinter A (14,12): Randfelder der Anhöhe, davor die Rampe – die Treppe sänke sie ab
    for (const [x, y] of [[12, 14], [14, 12]]) {
      expect(game(`placeError('huegeltreppe', ${x}, ${y})`)).toBe('Hierher führt schon eine Gleis-Rampe hinauf');
      expect(game(`build('huegeltreppe', ${x}, ${y})`)).toBe(false);
      expect(!!game(`hillAt(${x}, ${y})`)).toBe(true);
    }
    expect(game('hillRamps().length')).toBe(2);
    // daneben (nicht hinter der Rampe) geht die Treppe in die Anhöhe weiter
    expect(game("placeError('huegeltreppe', 10, 14)")).toBe(null);
  });

  it('Schienenlinie (Pinsel) quer über die Rampe: dort rot mit Hinweis; längs weiter grün (ist schon Gleis)', () => {
    hills(block(10, 8, 16, 14));
    game("rampNewForm = 'b'; build('huegelrampe', 12, 15)");                  // 12,15 oben … 12,17 Fuß, längs y
    game("tool = 'schiene'; startPlan('line', { x: 9, y: 16 }, { x: 15, y: 16 }, true)");   // quer über das mittlere Feld
    let s = game('(r => [r.states.get("12,16"), r.firstErr, r.order.length])(planScan(plan))');
    expect(s).toEqual(['bad', 'Quer über die Gleis-Rampe geht kein Gleis – sie führt nur hinauf', 6]);
    game("startPlan('line', { x: 12, y: 21 }, { x: 12, y: 11 }, true)");      // längs: unten, Rampe, oben
    s = game('(r => [r.states.get("12,16"), r.states.get("12,15"), r.firstErr, r.bad])(planScan(plan))');
    expect(s).toEqual(['same', 'same', null, 0]);
    game("startPlan('line', { x: 12, y: 19 }, { x: 12, y: 17 }, true)");      // endet am Fuß
    expect(game('planScan(plan).states.get("12,17")')).toBe('same');
    game("startPlan('line', { x: 9, y: 17 }, { x: 12, y: 17 }, true)");       // kommt von der Seite an den Fuß
    expect(game('planScan(plan).states.get("12,17")')).toBe('bad');
    game('plan = null');
  });

  it('Fußgängerbrücke über den Bahnübergang oben an der Kante: nie (sie hinge über der Kante); daneben bleibt der Boden eben', () => {
    hills(block(10, 8, 16, 14));
    rails([[10, 14], [11, 14], [12, 14], [13, 14], [14, 14]]);                 // oben längs der vorderen Kante (y = 14)
    game("build('weg', 12, 13, true); build('weg', 12, 15, true); build('weg', 12, 14, true); recalc()");   // Weg quer: oben 12,13, unten 12,15
    expect(game("isCrossing(state.tiles.get('12,14'))")).toBe(true);
    expect(game('crossingAxes(12, 14).n')).toEqual([0, 1]);                    // die Brücke spannt längs y: 12,13 oben, 12,15 unten
    expect(game('archHillError(12, 14)')).toBe(game('ARCH_LEVEL'));
    const m0 = game('state.money');
    expect(game("setCrossing(12, 14, true, 'holz')")).toBe(false);
    expect([game("state.tiles.get('12,14').foot"), game('state.money')]).toEqual([undefined, m0]);
    game('openInfo(12, 14)');
    expect(game("document.getElementById('panel').textContent")).toMatch(/ebenen Boden in derselben Höhe/);
    game('closePanel()');
    // eine Reihe weiter innen (12,12 auf beiden Seiten oben): geht – und dann bleiben die Nachbarn längs des Wegs, wie sie sind
    game("for (const k of ['10,14', '11,14', '12,14', '13,14', '14,14', '12,13', '12,15']) state.tiles.delete(k); recalc()");
    rails([[10, 12], [11, 12], [12, 12], [13, 12], [14, 12]]);
    game("build('weg', 12, 11, true); build('weg', 12, 13, true); build('weg', 12, 12, true); recalc()");
    expect([game('archHillError(12, 12)'), game("setCrossing(12, 12, true, 'holz')")]).toEqual([null, true]);
    expect([game('archAround(12, 13)'), game('archAround(12, 12)'), game('archAround(13, 12)'), game('archAround(12, 14)')]).toEqual([true, true, false, false]);
    expect(game('demolishInfo(12, 13).err')).toBe(undefined);                // der Weg selbst darf weg (der Boden bleibt) …
    game("state.tiles.delete('12,13'); recalc()");                            // … die Anhöhe darunter nicht
    expect(game('demolishInfo(12, 13).err')).toBe(game('ARCH_HERE'));
    expect(game('lowerHill(12, 13)')).toBe(false);
    expect(game('demolishInfo(13, 13).hill')).toBe('13,13');                  // daneben (nicht längs des Wegs) wie bisher
    // unten: Anheben neben einer Brücke am Boden – auch die erste Anhöhe überhaupt
    game("state.hills.clear(); groundVersion++; for (const k of [...state.tiles.keys()]) state.tiles.delete(k); recalc()");
    rails([[20, 20], [21, 20], [22, 20]]);
    game("build('weg', 21, 19, true); build('weg', 21, 21, true); build('weg', 21, 20, true); recalc(); setCrossing(21, 20, true, 'holz')");
    expect(game("state.tiles.get('21,20').foot")).toBe(true);
    // getragen (✋) an die Kante einer Anhöhe: geht nicht (sie hinge darüber); auf ebenen Boden schon
    game("build('anhoehe', 25, 25, true); build('anhoehe', 26, 25, true); build('anhoehe', 27, 25, true); recalc(); pickUp(21, 20)");
    expect(game('moving && moving.t.foot')).toBe(true);
    expect(game("placeError('schiene', 26, 25, undefined, { t: moving.t, move: true })")).toBe(game('ARCH_LEVEL'));   // oben, quer zur Kante
    expect(game("placeError('schiene', 21, 28, undefined, { t: moving.t, move: true })")).toBe(null);
    game('cancelMove()');
    expect(game("state.tiles.get('21,20').foot")).toBe(true);
    expect([game('hillRaiseError(21, 22)'), game('hillRaiseError(21, 21)'), game('hillRaiseError(21, 20)')]).toEqual([null, game('ARCH_HERE'), game('ARCH_HERE')]);
    expect(game("placeError('huegeltreppe', 22, 21)")).not.toBe(game('ARCH_HERE'));
    // oben am Rand, Weg längs der Kante: Treppe bzw. Gleis-Rampe A in das Nachbarfeld der Brücke würden es absenken
    game("for (const k of [...state.tiles.keys()]) state.tiles.delete(k); recalc()");
    hills(block(10, 8, 16, 14));
    rails([[12, 11], [12, 12], [12, 13], [12, 14]]);
    game("build('weg', 11, 14, true); build('weg', 12, 14, true); recalc()");
    expect([game("isCrossing(state.tiles.get('12,14'))"), game('crossingAxes(12, 14).n'), game('archHillError(12, 14)')]).toEqual([true, [1, 0], null]);
    expect(game("setCrossing(12, 14, true, 'stein')")).toBe(true);
    expect([game('stairIntoError(13, 14)'), game("rampNewForm = 'a'; rampError(13, 13, 0, 2, false, 'a')")]).toEqual([game('ARCH_HERE'), game('ARCH_HERE')]);
  });
});

describe('Nahaufnahme: was nach dem Zug noch einmal darüber kommt', () => {
  // ein Wagen mitten im schmalen Einschnitt C bzw. auf dem Viadukt D (echte Route über die Rampe, Zug angehalten)
  const scene = (form, rot) => {
    hills(block(10, 8, 16, 14));
    const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]], D = UP[rot], F = game(`RAMP_FORMS.${form}`);
    const e = rot === 0 ? [13, 14] : rot === 2 ? [13, 8] : rot === 1 ? [10, 11] : [16, 11];   // Randfeld der Anhöhe, an dem die Rampe heraufkommt
    const top = F.cut ? [e[0] + D[0] * (F.cut - 1), e[1] + D[1] * (F.cut - 1)] : [e[0] - D[0], e[1] - D[1]];
    const fields = [...Array(F.len).keys()].map(i => [top[0] - D[0] * (F.len - 1 - i), top[1] - D[1] * (F.len - 1 - i)]);
    const [ax, ay] = [Math.min(...fields.map(f => f[0])), Math.min(...fields.map(f => f[1]))];
    game(`rampNewForm = '${form}'; rotManual = true; buildRot = ${rot}`);
    expect(game(`build('huegelrampe', ${ax}, ${ay})`)).toBe(true);
    game('rotManual = false; buildRot = 0');
    const below = [1, 2, 3].map(k => [fields[0][0] - D[0] * k, fields[0][1] - D[1] * k]), above = [1, 2, 3].map(k => [top[0] + D[0] * k, top[1] + D[1] * k]);
    rails([...below, ...above]);
    const keys = [...below.slice().reverse(), ...fields, ...above].map(p => p.join());
    game(`trains.length = 0; { const route = railPolyline(${JSON.stringify(keys)}); trains.push({ id: 't', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind: { ...TRAIN_KIND.regio, n: 1 }, c: 3 + ${F.len - 0.5}, dir: 1, wait: 1e9, next: 1 }); }`);
    return { fields, top, D };
  };
  // Zeichenbefehle mitschreiben: g (der Zeichenkontext des Spiels) durch einen mitschreibenden ersetzen
  const spy = `(() => { const log = [], g0 = g; g = new Proxy(g0, { get(t, p) { const v = t[p];
      if (typeof v === 'function' && ['clip', 'drawImage', 'moveTo', 'lineTo', 'rect'].includes(p)) return (...a) => { log.push([p, ...a.filter(n => typeof n === 'number').map(n => Math.round(n * 10) / 10)]); return v(...a); };
      return v; }, set(t, p, v) { t[p] = v; return true; } });
    return { log, done: () => { g = g0; } }; })()`;

  it('schmaler Einschnitt: nur Oberseite (und Wand außen, wo gemalt) des vorderen Streifens – nie sein Umriss mit Boden und Gleis darin', () => {
    for (const rot of [0, 1, 2, 3]) {
      game('hillSprites.clear()');
      const { top } = scene('c', rot);
      game('render(1e6)');                                                     // Bildchen der Rampenfelder entstehen
      const o = game(`hillSprites.get('r${top[0]},${top[1]}').o`);
      expect([rot, o.narrow, o.cut, o.first]).toEqual([rot, true, true, false]);
      const front = (-[[0, -1], [1, 0], [0, 1], [-1, 0]][rot][1]) + [[0, -1], [1, 0], [0, 1], [-1, 0]][rot][0] > 0 ? o.p : o.m;
      game(`window.__s = ${spy}`);
      try { game(`drawHillRampOver(${top[0]}, ${top[1]}, 2)`); } finally { game('__s.done()'); }
      const log = game('__s.log'), n = 1 + (front === 'k' ? 1 : 0);
      expect([rot, log.filter(l => l[0] === 'clip').length, log.filter(l => l[0] === 'drawImage').length]).toEqual([rot, n, n]);   // oberes Feld: keine Stirn
      // der erste Ausschnitt (Oberseite) liegt ganz auf Höhe HILL_H (früher: Umriss bis zum Boden, h = 0 – dort Boden und Gleis des Einschnitts)
      const c = game(`toScreen(${top[0]}, ${top[1]})`), pts = log.filter(l => l[0] === 'moveTo' || l[0] === 'lineTo').slice(0, 4);
      expect(pts.length).toBe(4);
      for (const [, , py] of pts) expect(py).toBeLessThan(c.y - 26 * 2 + 16 * 2 * 1.02 + 0.5);
      game("for (const k of [...state.tiles.keys()]) state.tiles.delete(k); state.hills.clear(); trains.length = 0; recalc()");
    }
  });

  it('Schatten der Wagen: auf Damm und Viadukt ohne die Streifen neben der Oberseite (nicht an der Wand); Einschnitt und ohne Rampe wie bisher', () => {
    game('window.__rc = rampShadowClip; window.__n = []; rampShadowClip = (...a) => { const r = __rc(...a); __n.push(r); return r; }');
    try {
      for (const form of ['b', 'd']) {
        scene(form, 0);
        game('__n.length = 0; render(1e6)');
        expect([form, game('__n')]).toEqual([form, [true]]);                     // ein Wagen auf der Rampe: ausgeschnitten
        game(`window.__s = ${spy}`);
        try { game('rampShadowClip(13, 16, (u, v, h) => [u * 10, v * 10 - h])'); } finally { game('__s.done()'); }
        const log = game('__s.log');
        expect([log.filter(l => l[0] === 'rect').length, log.filter(l => l[0] === 'clip').length, log.filter(l => l[0] === 'moveTo').length]).toEqual([1, 1, 2]);   // alles außer zwei Streifen
        game("for (const k of [...state.tiles.keys()]) state.tiles.delete(k); state.hills.clear(); trains.length = 0; recalc()");
      }
      scene('a', 0);                                                           // Einschnitt A: Wände der Anhöhe daneben, nichts auszuschneiden
      game('__n.length = 0; render(1e6)');
      expect(game('__n')).toEqual([false]);
      game("trains.length = 0; state.hills.clear(); recalc()");               // ohne Anhöhen: rampShadowClip läuft gar nicht
      rails([[3, 3], [4, 3], [5, 3], [6, 3]]);
      game("{ const route = railPolyline(['3,3', '4,3', '5,3', '6,3']); trains.push({ id: 'u', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind: { ...TRAIN_KIND.regio, n: 1 }, c: 1.5, dir: 1, wait: 1e9, next: 1 }); }");
      game('__n.length = 0; render(1e6)');
      expect(game('__n')).toEqual([]);
    } finally { game('rampShadowClip = __rc'); }
  });
});
