const { loadGame, game } = require('./helpers/load-game');

// Stufe 3 (Block 157j, Nutzer 10.10.2026): Bahn oben – Bahnhof und Hbf auf Anhöhen (Züge halten oben, Linien unten ↔ oben über die Gleis-Rampe,
// nie über die Kante), U-Bahn-Eingang oben auf dem Tunnel unter der Anhöhe, Tunneleinfahrt nur unten, Achterbahn oben nur auf einer Ebene.
// Anbindung: ein Halt oben bedient nur seine Gegend (hillRegions), unten bedient er oben nur mit Treppe. Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = -2; y <= 36; y++) for (let x = -2; x <= 36; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k); state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(16, 16); cam.x = p.x; cam.y = p.y; } night = 0');
});
afterEach(() => game('trains.length = 0; syncTrains.sig = null; if (globalThis.__spy) { for (const [n, f] of globalThis.__spy) globalThis[n] = f; delete globalThis.__spy }'));
const H = 26;
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const power = () => game("for (let i = 0; i < 6; i++) state.tiles.set((28 + (i % 3) * 2) + ',' + (30 + Math.floor(i / 3) * 2), { b: 'windrad', lvl: 3 }); recalc()");
const net = k => game(`T.rail.stationNet.get('${k}')`);
// Gleis-Rampe A (2 Felder eingelassen) mit Fuß (fx, fy), hinauf in Richtung rot (0 = −y, 1 = +x, 2 = +y, 3 = −x)
const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
function rampA(fx, fy, rot) {
  const [Du, Dv] = UP[rot], ax = Math.min(fx, fx + Du), ay = Math.min(fy, fy + Dv);
  game(`rampNewForm = 'a'; buildRot = ${rot}; rotManual = true`);
  expect(game(`placeError('huegelrampe', ${ax}, ${ay})`)).toBe(null);
  game(`build('huegelrampe', ${ax}, ${ay}, true); rotManual = false; buildRot = 0; recalc()`);
}
// Bauen wie der Spieler: Prüfung, dann build (Drehung von selbst oder fest)
function put(b, x, y, rot = null) {
  if (rot != null) game(`buildRot = ${rot}; rotManual = true`);
  const e = game(`placeError('${b}', ${x}, ${y})`);
  expect([b, x, y, e]).toEqual([b, x, y, null]);
  expect(game(`build('${b}', ${x}, ${y}, true)`)).toBe(true);
  game('rotManual = false; buildRot = 0; recalc()');
}
// Zug fährt (echte Zeit in kleinen Schritten): hält er an jedem Halt, springt seine Höhe nie?
const drive = (steps = 6000) => JSON.parse(game(`(() => {
  const tr = trains[0], seen = new Set(); let prev = null, jump = 0;
  for (let i = 0; i < ${steps} && seen.size < tr.stops.length; i++) {
    stepTrains(0.05);
    if (tr.wait > 0) { const j = tr.stops.findIndex(d => Math.abs(d - tr.c) < 1e-6); if (j >= 0) seen.add(j); }
    const hs = trainCars().map(m => { trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py)); return m.hill ? (m.hill.ha + m.hill.hb) / 2 : 0; });
    if (prev) hs.forEach((h, j) => { jump = Math.max(jump, Math.abs(h - prev[j])); });
    prev = hs;
  }
  return JSON.stringify({ seen: seen.size, jump, ups: tr.stops.map(d => { const [u, v] = railPoint(tr.route, d); return surfaceHeight(u, v); }) });
})()`));

describe('Bahnhof oben', () => {
  // Anhöhe 10…20 × 2…12, Treppe vorn, Gleis-Rampe A bei x = 15 (Fuß 15,12 · oben 15,11), Gleis unten 15,13…22, oben 15,3…10
  const world = () => {
    hills(block(10, 2, 20, 12));
    expect(game("build('huegeltreppe', 12, 13)")).toBe(true);
    rampA(15, 12, 0);
    rails([...block(15, 13, 15, 22), ...block(15, 3, 15, 10)]);
  };

  it('echte Welt: Bahnhof unten und oben, Linie über die Gleis-Rampe, der Zug hält oben; ↶; Speichern und Laden', () => {
    world();
    put('station', 16, 17);                                                   // unten: dreht sich von selbst zur Schiene
    expect(game("objAt(16, 17).rot")).toBe(2);
    expect(game("[placeRot('station', 16, 5), hillLevel(16, 5)]")).toEqual([2, 1]);   // oben ebenso – zur Schiene oben
    expect(game("undoable(() => build('station', 16, 5))")).toBe(true);
    game('recalc()');
    power();
    expect(game("[objAt(16, 5).b, objAt(16, 6).b, hillLevel(16, 6)]")).toEqual(['station', 'station', 1]);
    expect(net('16,5')).not.toBe(null);
    expect(net('16,5')).toBe(net('16,17'));                                   // ein Netz: über die Gleis-Rampe
    expect(game('railStop("16,5")')).toMatch(/^15,[56]$/);                    // hält an der Schiene oben
    game('syncMovers()');
    expect([game('T.rail.lines.length'), game('trains.length'), game('trains[0].powered')]).toEqual([1, 1, true]);
    const route = game("trains[0].route.pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1]))");
    for (const k of ['15,12', '15,11']) expect(route).toContain(k);          // über die Rampe
    const d = drive();
    expect(d.seen).toBe(2);                                                   // hält unten und oben
    expect([...d.ups].sort((a, b) => a - b)).toEqual([0, H]);                 // ein Halt oben (angehoben), einer unten
    expect(d.jump).toBeLessThan(2.2);                                         // Höhe stetig
    expect(game("stationStatus('16,5').join('')")).toMatch(/Linie/);
    // ↶: der Bahnhof oben ist weg, die Linie auch
    expect(game('undo()')).toBe(true);
    game('recalc(); syncMovers()');
    expect([game('objAt(16, 5)'), game('T.rail.lines.length')]).toEqual([null, 0]);
    put('station', 16, 5);
    // Speichern und Laden: Bahnhof oben, Netz und Linie bleiben
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc(); trains.length = 0; syncTrains.sig = null; syncMovers()');
    expect([game("objAt(16, 5).b"), game('hillLevel(16, 5)'), game('T.rail.lines.length'), game('trains.length')]).toEqual(['station', 1, 1, 1]);
    expect(net('16,5')).toBe(net('16,17'));
    expect(drive().seen).toBe(2);
    expect(game('errorShown')).toBe(false);
  });

  it('nie über die Kante: Bahnhof oben an der Schiene unten (und umgekehrt) hält nicht, das Fenster sagt warum; auf der Rampe hält keiner', () => {
    hills(block(10, 2, 20, 12));
    rails(block(11, 13, 18, 13));                                             // unten längs der Wand
    put('station', 13, 12, 1);                                                // oben an der Kante, Bahnsteig nach +y (zur Schiene unten)
    expect(game('hillLevel(13, 12)')).toBe(1);
    expect(net('13,12')).toBe(null);
    expect(game("stationStatus('13,12').join('')")).toMatch(/liegt unten/);
    rails(block(16, 11, 17, 11));                                             // Schiene oben (y = 11) und unten (y = 13) am Bahnhof 16,12 + 17,12
    expect(game("placeRot('station', 16, 12)")).toBe(3);                      // dreht sich zur Schiene oben, nicht zur unten (rot 1)
    game("state.tiles.delete('16,11'); state.tiles.delete('17,11'); recalc()");
    // unten an einer Schiene oben: Graben y = 13 zwischen zwei Anhöhen, Schiene oben auf der vorderen (y = 14)
    game("for (let x = 11; x <= 18; x++) state.tiles.delete(x + ',13'); recalc()");
    hills(block(10, 14, 20, 16));
    rails(block(11, 14, 18, 14));
    put('station', 15, 13, 1);                                                // unten im Graben, Bahnsteig nach +y (zur Schiene oben)
    expect(game('hillLevel(15, 13)')).toBe(0);
    expect(net('15,13')).toBe(null);
    expect(game("stationStatus('15,13').join('')")).toMatch(/oben auf der Anhöhe/);
    // neben der Gleis-Rampe: kein Halt (sie ist schräg)
    game('state.hills.clear(); for (let y = 0; y <= 34; y++) for (let x = 0; x <= 34; x++) state.tiles.delete(x + "," + y); recalc()');
    hills(block(10, 2, 20, 12));
    game("rampNewForm = 'b'; buildRot = 0; rotManual = true"); expect(game("placeError('huegelrampe', 15, 13)")).toBe(null);   // Damm B: 15,13 oben … 15,15 Fuß
    game("build('huegelrampe', 15, 13, true); rotManual = false; recalc()");
    put('station', 16, 14, 2);                                                // unten neben dem Damm
    expect(net('16,14')).toBe(null);
    expect(game("stationStatus('16,14').join('')")).toMatch(/Gleis-Rampe hält kein Zug/);
  });

  it('Rundkurs ganz oben: Bahnhöfe oben am Ring, Züge fahren im Kreis (oben angehoben)', () => {
    hills(block(8, 2, 22, 12));
    const ring = [];
    for (let x = 10; x <= 20; x++) ring.push([x, 4], [x, 10]);
    for (let y = 5; y <= 9; y++) ring.push([10, y], [20, y]);
    rails(ring);
    put('station', 11, 6); put('station', 19, 7);                             // innen am Ring, drehen sich von selbst zur Schiene
    power(); game('syncMovers()');
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('!!T.rail.lines[0].loop')).toBe(true);
    expect(game('trains.length')).toBeGreaterThan(0);
    game('for (let i = 0; i < 200; i++) stepTrains(0.05)');
    const hs = game("trainCars().map(m => { trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py)); return m.hill ? [m.hill.ha, m.hill.hb] : null; })");
    for (const h of hs) expect(h).toEqual([H, H]);
  });

  it('länger (3 Felder) nur auf seiner Ebene: oben nicht über die Kante, unten nicht in die Anhöhe', () => {
    hills(block(10, 2, 20, 12));
    // oben: Bahnhof an der Kante x = 20 (rot 2: Bahnsteig nach −x zur Schiene x = 19), Felder 20,11 + 20,12 – wächst nach −y (oben, frei)
    rails(block(19, 3, 19, 12));
    put('station', 20, 11, 2);
    expect(game("(p => typeof p === 'string' ? p : p.nk)(stationLenPlan('20,11', 3))")).toBe('20,10');   // nach oben, nicht über die Kante (20,13)
    game("state.tiles.set('20,10', { b: 'blumen', lvl: 1 }); recalc()");                              // oben zu: dann bliebe nur über die Kante
    expect(game("stationLenPlan('20,11', 3)")).toMatch(/Daneben geht es die Anhöhe hinunter/);
    // unten vor der Wand, oben und unten Anhöhe: nicht in die Anhöhe
    rails(block(21, 6, 21, 16));
    put('station', 22, 12, 2);                                                // 22,12 + 22,13 unten
    game("for (let y = 6; y <= 11; y++) build('anhoehe', 22, y, true); for (let y = 14; y <= 16; y++) build('anhoehe', 22, y, true); recalc()");
    expect(game("stationLenPlan('22,12', 3)")).toMatch(/Daneben ist eine Anhöhe/);
    expect(game("hillLevel(22, 12)")).toBe(0);
  });

  it('Anbindung: ein Halt oben bedient ohne Treppe nur die Anhöhe, unten nichts oben; mit Treppe alles (Bahn statt 🐌)', () => {
    hills(block(12, 2, 18, 12));
    rampA(15, 12, 0);
    rails([...block(15, 13, 15, 22), ...block(15, 3, 15, 10)]);
    put('station', 16, 17); put('station', 16, 5);
    power();
    // Mühlen (weit weg von Häusern): oben bei 18,4; unten 19,5 (3 Felder neben dem Bahnhof oben, unter der Kante); unten 12,16 am Bahnhof unten
    game("state.tiles.set('18,4', { b: 'muehle', lvl: 1 }); state.tiles.set('19,5', { b: 'muehle', lvl: 1 }); state.tiles.set('12,16', { b: 'muehle', lvl: 1 }); recalc()");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('hillRegions() && hillRegions().get("18,4") > 0')).toBe(true);   // ohne Treppe: eigene Gegend
    expect(game("T.st.get('18,4').how")).toBe('bahn');                         // oben: Bahnhof oben in Laufweite
    expect(game("T.st.get('12,16').how")).toBe('bahn');                        // unten: Bahnhof unten in Laufweite
    expect(game("T.st.get('19,5').how")).toBe('weit');                         // unten neben der Anhöhe: der Bahnhof oben zählt nicht (keine Treppe)
    // Bahnhof unten bedient oben nur mit Treppe: Mühle oben an der Kante, Bahnhof unten direkt davor
    game("state.tiles.delete('18,4'); state.tiles.delete('19,5'); state.tiles.delete('16,5'); state.tiles.delete('16,17'); state.tiles.set('17,12', { b: 'muehle', lvl: 1 }); recalc()");
    rails(block(15, 23, 15, 30));
    put('station', 16, 14); put('station', 16, 28);
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game("T.st.get('17,12').how")).toBe('weit');                        // Bahnhof unten direkt davor, aber keine Treppe
    expect(game("build('huegeltreppe', 13, 13)")).toBe(true);
    game('recalc()');
    expect(game('hillRegions()')).toBe(null);                                  // Treppe: alles eine Gegend
    expect(game("T.st.get('17,12').how")).toBe('bahn');
  });
});

describe('Hauptbahnhof oben', () => {
  // große Anhöhe 2…26 × 0…14, Gleis-Rampe A bei x = 14 (Fuß 14,14), Gleis unten 14,15…24 mit Bahnhof, oben 14,10…13 bis vor ein Gleis
  // des Hbf (Bahnsteige nach +y, rot 1)
  const world = () => {
    hills(block(2, 0, 26, 14));
    expect(game("build('huegeltreppe', 5, 15)")).toBe(true);
    rampA(14, 14, 0);
    rails([...block(14, 15, 14, 24), ...block(14, 10, 14, 12)]);
    put('station', 15, 20);
    // Anker so, dass die Ausfahrt eines Gleises auf 14,9 liegt (Hbf rot 1: Gleise nach +y)
    const anc = JSON.parse(game(`(() => { const t = { b: 'hbf', rot: 1, ...HBF_NEW }; for (let y = -6; y <= 12; y++) for (let x = 2; x <= 26; x++) for (let g = 0; g < hbfGleise(t); g++) { const G = gleisTiles(t, x, y, g); if (G.exit[0] === 14 && G.exit[1] === 9) return JSON.stringify([x, y]); } return 'null'; })()`));
    rails([[14, 9]]);
    put('hbf', anc[0], anc[1], 1);
    power();
    game('syncMovers()');
    return anc;
  };

  it('Gleis oben an der Schiene oben: Linie zum Bahnhof unten, der Zug fährt bis in die Halle und hält oben; Speichern/Laden', () => {
    const anc = world();
    const gk = game(`[...GLEIS].find(([k, G]) => G.hub === '${anc.join()}' && gleisTiles(state.tiles.get(G.hub), ${anc[0]}, ${anc[1]}, G.g).exit.join() === '14,9')[0]`);
    expect(game(`hillLevel(${gk})`)).toBe(1);
    expect(net(gk)).not.toBe(null);
    expect(net(gk)).toBe(net('15,20'));
    expect([game('T.rail.lines.length'), game('trains.length')]).toEqual([1, 1]);
    const route = game("trains[0].route.pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1]))");
    expect(route).toContain(gk);                                              // bis in die Halle (oben)
    const d = drive();
    expect(d.seen).toBe(2);
    expect([...d.ups].sort((a, b) => a - b)).toEqual([0, H]);
    expect(d.jump).toBeLessThan(2.2);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc(); trains.length = 0; syncTrains.sig = null; syncMovers()');
    expect([game('T.rail.lines.length'), game('trains.length'), net(gk) === net('15,20')]).toEqual([1, 1, true]);
  });

  it('Hbf oben an der Kante: die Schiene unten vor dem Gleis hält nicht, ein Zug unten fährt nie in seine Halle; Gleise dazu nie über die Kante', () => {
    // Anker so, dass die Ausfahrt eines Gleises auf 14,15 liegt (unten), die Halle 14,12 … 14,14 oben; die Anhöhe genau so breit wie der Hbf
    const anc = JSON.parse(game(`(() => { const t = { b: 'hbf', rot: 1, ...HBF_NEW }; for (let y = 0; y <= 14; y++) for (let x = 2; x <= 26; x++) for (let g = 0; g < hbfGleise(t); g++) { const G = gleisTiles(t, x, y, g); if (G.exit[0] === 14 && G.exit[1] === 15) return JSON.stringify([x, y]); } return 'null'; })()`));
    const [w, h] = game(`sizeOf('hbf', 1, { b: 'hbf', rot: 1, ...HBF_NEW })`);
    expect(anc[1] + h - 1).toBe(14);
    hills(block(anc[0], 0, anc[0] + w - 1, 14));
    put('hbf', anc[0], anc[1], 1);
    rails(block(14, 15, 14, 24));
    put('station', 15, 16); put('station', 15, 22);
    power(); game('syncMovers()');
    const gk = game(`[...GLEIS].find(([k, G]) => G.hub === '${anc.join()}' && gleisTiles(state.tiles.get(G.hub), ${anc[0]}, ${anc[1]}, G.g).exit.join() === '14,15')[0]`);
    expect(net(gk)).toBe(null);                                               // Gleis oben, Schiene davor unten: kein Halt
    expect(game(`stationStatus('${gk}').join('')`)).toMatch(/vor dem Gleis liegt unten/);
    expect(game('railArms(14, 15)')).not.toContainEqual([0, -1]);              // kein Arm in die Halle (Prellbock)
    expect([game('T.rail.lines.length'), game('trains.length')]).toEqual([1, 1]);
    const route = game("trains[0].route.pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1]))");
    expect(route).toContain('14,15');                                         // bis ans Ende davor …
    expect(route.filter(k => game(`HALL.has('${k}')`))).toEqual([]);           // … nie in die Halle oben
    // ohne Anhöhe führe er hinein (wie bisher)
    game('globalThis.__hl = new Map(state.hills); state.hills.clear(); groundVersion++; recalc(); trains.length = 0; syncTrains.sig = null; syncMovers()');
    expect(net(gk)).not.toBe(null);
    game('state.hills = globalThis.__hl; delete globalThis.__hl; groundVersion++; recalc()');   // Anheben unter dem Hbf geht nicht (erst wegtragen)
    // Gleise dazu: links und rechts geht es hinunter
    expect(game(`hbfResizeError('${anc.join()}', 1, 1)`)).toMatch(/Anhöhe hinunter\. Dort ist kein Platz für ein Gleis/);
    expect(game(`hbfResizeError('${anc.join()}', 1, -1)`)).toMatch(/Anhöhe hinunter\. Dort ist kein Platz für ein Gleis/);
    game(`for (let y = 0; y <= 14; y++) for (const x of [${anc[0] - 2}, ${anc[0] - 1}, ${anc[0] + w}, ${anc[0] + w + 1}]) build('anhoehe', x, y, true); recalc()`);
    expect([game(`hbfResizeError('${anc.join()}', 1, 1)`), game(`hbfResizeError('${anc.join()}', 1, -1)`)]).toEqual([null, null]);   // oben Platz: geht
  });

  it('Zug in der Halle oben: zwischen Boden und Gebäude gezeichnet (unten wie bisher vor allen Streifen)', () => {
    world();
    // den Zug ganz in die Halle stellen (Halt oben)
    game("(() => { const tr = trains[0]; const up = tr.stops.find(d => { const [u, v] = railPoint(tr.route, d); return surfaceHeight(u, v) > 0; }); tr.c = up; tr.wait = 1e9; })()");
    game("globalThis.__spy = [['drawObject', drawObject], ['drawMover', drawMover]]; globalThis.__log = []; (() => { const o = drawObject, m0 = drawMover; drawObject = function (type, ...r) { if (type === 'hbf') __log.push('hbf:' + PASS); return o.call(this, type, ...r); }; drawMover = function (m, ...r) { if (m.train) __log.push('zug'); return m0.call(this, m, ...r); }; })()");
    game("syncTrains = (s => { globalThis.__spy.push(['syncTrains', s]); return () => {}; })(syncTrains)");
    game('cam.z = 2.5; { const p = iso(14, 6); cam.x = p.x; cam.y = p.y; } render(1e6)');
    const log = game('__log.join(" ")');
    expect(log).toMatch(/hbf:ground (zug )+hbf:object/);                     // Boden → Zug → Gebäude (in jedem Streifen)
    expect(log).not.toMatch(/^zug/);                                          // nicht vorher (sonst deckt die Anhöhe ihn zu)
    expect(game('errorShown')).toBe(false);
    // dieselbe Welt ohne Anhöhe: Zug vor allen Streifen, keine flachen Teile im Feld (die liegen im Boden-Bild)
    expect(log).toMatch(/^(hbf:ground (zug )+hbf:object ?)+$/);               // jeder Streifen: Boden, Zug, Gebäude
    game("state.hills.clear(); groundVersion++; recalc(); __log.length = 0; render(1e6 + 20)");
    const low = game('__log.join(" ")');
    expect(low).toMatch(/^(hbf:ground )*(zug )+(hbf:object ?)+$/);            // Boden-Bild, Zug, dann die Streifen (wie bisher)
  });
});

describe('U-Bahn-Eingang oben', () => {
  it('steht auf dem Tunnel unter der Anhöhe; Linie wie unten; Anbindung nur in der Gegend der Anhöhe', () => {
    hills(block(10, 2, 20, 12));
    game("for (let y = 0; y <= 24; y++) build('tunnel', 15, y, true); recalc()");
    expect(game('[tunnelAt(15, 5), hillLevel(15, 5)]')).toEqual([true, 1]);
    expect(game("placeError('ubahn', 16, 5)")).toMatch(/Tunnel/);              // nur auf dem Tunnel
    put('ubahn', 15, 5);
    put('ubahn', 15, 20);
    power();
    game('syncMovers()');
    expect(net('15,5')).not.toBe(null);
    expect(net('15,5')).toBe(net('15,20'));
    expect([game('T.rail.lines.length'), game('trains.length')]).toEqual([1, 1]);
    expect(game('railStop("15,5")')).toBe('15,5');                           // hält auf ihrem Tunnelfeld (unter der Anhöhe)
    // Anbindung: Mühle oben neben dem Eingang → Bahn; Mühle unten an der Kante, 3 Felder weg → nicht (keine Treppe)
    game("state.tiles.set('17,6', { b: 'muehle', lvl: 1 }); state.tiles.set('15,14', { b: 'muehle', lvl: 1 }); state.tiles.set('22,22', { b: 'muehle', lvl: 1 }); recalc()");
    expect(game("T.st.get('17,6').how")).toBe('bahn');
    expect(game("T.st.get('15,14').how")).toBe('weit');
    game("state.tiles.delete('15,14'); state.tiles.set('16,13', { b: 'haus', lvl: 1, rot: 0, animal: 1 }); recalc()");
    expect(game("[...stopViertel(computeNet(), '15,5')].includes(computeNet().vOf('16,13'))")).toBe(false);   // Haus unten an der Kante: nicht ihr Viertel
    expect(game("build('huegeltreppe', 12, 13)")).toBe(true);
    game('recalc()');
    expect(game("[...stopViertel(computeNet(), '15,5')].length")).toBeGreaterThan(0);
    // Speichern/Laden
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
    expect([game("objAt(15, 5).b"), game('hillLevel(15, 5)'), net('15,5') === net('15,20')]).toEqual(['ubahn', 1, true]);
    expect(() => game('render(1e6)')).not.toThrow();
    expect(game('errorShown')).toBe(false);
  });

  it('Tunneleinfahrt nur unten; ein Gleis oben verbindet nie mit einer Einfahrt unten', () => {
    hills(block(10, 2, 20, 12));
    game("for (let y = 15; y <= 24; y++) build('tunnel', 15, y, true); recalc()");
    expect(game("placeError('tunneleinfahrt', 15, 4)")).not.toBe(null);      // oben: nie
    // unten am Ende des Tunnels (13/14), vorn (−y) direkt die Anhöhe: das Gleis oben dort hängt nicht an ihr
    const ok = game("(() => { const a = einAnchor(15, 14), r = placeRot('tunneleinfahrt', a[0], a[1]); buildRot = r; rotManual = true; const e = placeError('tunneleinfahrt', a[0], a[1]); if (!e) build('tunneleinfahrt', a[0], a[1], true); rotManual = false; recalc(); return e; })()");
    expect(ok).toBe(null);
    const E = game("(e => ({ A: e.A, B: e.B, d: e.d }))(einOf(15, 14))");
    const front = [E.A[0] - E.d[0], E.A[1] - E.d[1]];
    expect(game(`hillLevel(${front})`)).toBe(1);
    rails([front, [front[0], front[1] - 1]]);
    expect(game(`trackLink(${E.A}, ${front})`)).toBe(false);
    expect(game(`railArms(${front})`)).not.toContainEqual([E.d[0], E.d[1]]);
    expect(game(`T.rail.comp.get('${front}') === T.rail.comp.get('15,20')`)).toBe(false);
  });
});

describe('Achterbahn oben', () => {
  const ring = (x0, y0) => { const r = []; for (let x = x0; x <= x0 + 4; x++) r.push([x, y0]); for (let y = y0 + 1; y <= y0 + 3; y++) r.push([x0 + 4, y]); for (let x = x0 + 3; x >= x0; x--) r.push([x, y0 + 3]); for (let y = y0 + 2; y >= y0 + 1; y--) r.push([x0, y]); return r; };
  const fz = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('fzboden', x, y, true); recalc()`);
  it('Rundkurs ganz oben fährt; Schienen verbinden sich nie über die Kante', () => {
    hills(block(10, 2, 20, 12));
    fz([...block(9, 3, 21, 12), ...block(9, 13, 21, 14)]);
    const R = ring(12, 4);
    for (const [x, y] of R) if (!(x === 13 && y === 4)) expect([x, y, game(`placeError('fz_bahn', ${x}, ${y})`)]).toEqual([x, y, null]);
    game(`for (const [x, y] of ${JSON.stringify(R)}) if (!(x === 13 && y === 4)) build('fz_bahn', x, y, true); build('fz_station', 13, 4, true); recalc()`);
    expect(game('COASTERS.length')).toBe(1);
    expect(game('COASTERS[0].ring.every(k => hillLevel(...keyXY(k)) === 1)')).toBe(true);
    // Stück unten direkt vor der Kante neben einem Stück oben: hängt nicht dran (kein Arm, eigener Teil)
    game("build('fz_bahn', 14, 13, true); build('fz_bahn', 14, 12, true); build('fz_bahn', 15, 12, true); recalc()");
    expect(game('[hillLevel(14, 13), hillLevel(14, 12)]')).toEqual([0, 1]);
    expect(game('coasterArms(14, 12)')).not.toContainEqual([0, 1]);
    expect(game('coasterArms(14, 13)')).not.toContainEqual([0, -1]);
    // Ring über die Kante: fährt nicht (wäre ohne Anhöhe ein Rundkurs)
    game("for (const [k, t] of [...state.tiles]) if (t.b === 'fz_bahn' || t.b === 'fz_station') state.tiles.delete(k); recalc()");
    const R2 = ring(12, 10);                                                  // y 10…13: halb oben, halb unten
    game(`for (const [x, y] of ${JSON.stringify(R2)}) if (!(x === 13 && y === 10)) build('fz_bahn', x, y, true); build('fz_station', 13, 10, true); recalc()`);
    expect(game('COASTERS.length')).toBe(0);
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(game('COASTERS.length')).toBe(1);
  });

  it('oben gezeichnet: Wagen um den Hub angehoben (wie alles auf dem Feld), kein Fehler nah/weit/nachts', () => {
    hills(block(10, 2, 20, 12));
    fz(block(10, 2, 20, 12));
    const R = ring(12, 4);
    game(`for (const [x, y] of ${JSON.stringify(R)}) if (!(x === 13 && y === 4)) build('fz_bahn', x, y, true); build('fz_station', 13, 4, true); build('fz_looping', 14, 4, true); recalc()`);
    expect(game('COASTERS.length')).toBe(1);
    game("for (let i = 0; i < 40; i++) stepCoasters(0.1)");
    game("globalThis.__spy = [['moverLive', moverLive]]; globalThis.__lifts = []; (() => { const o = moverLive; moverLive = function (m, z, now, w, lift) { if (m.coaster) __lifts.push(lift / z); return o.apply(this, arguments); }; })()");
    for (const [z, nt] of [[2.5, 0], [0.5, 0], [2.5, 0.45]]) {
      expect(() => game(`(() => { const n0 = nightAt; nightAt = () => ${nt}; try { cam.z = ${z}; const p = iso(14, 6); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = n0; } })()`)).not.toThrow();
    }
    const lifts = game('__lifts');
    expect(lifts.length).toBeGreaterThan(0);
    for (const l of lifts) expect(l).toBeCloseTo(H, 6);
    expect(game('errorShown')).toBe(false);
  });
});

describe('Ohne Anhöhen unverändert', () => {
  it('Bahnhof wächst, Linie, Viertel der Halte, Achterbahn-Arme wie vorher', () => {
    rails(block(15, 3, 15, 22));
    put('station', 16, 5); put('station', 16, 17);
    power(); game('syncMovers()');
    expect([game('T.rail.lines.length'), game('trains.length')]).toEqual([1, 1]);
    expect(game("(p => p.nk)(stationLenPlan('16,5', 3))")).toBe('16,5');
    expect(game('hillRegions()')).toBe(null);
    expect(game("growLevelErr(3, 3, 0)")).toBe(null);
    expect(drive().seen).toBe(2);
    game("for (let x = 4; x <= 7; x++) build('fzboden', x, 5, true); build('fz_bahn', 5, 5, true); build('fz_bahn', 6, 5, true); recalc()");
    expect(game('coasterArms(5, 5)')).toEqual([[1, 0]]);
  });
});
