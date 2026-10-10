const { loadGame, game } = require('./helpers/load-game');

// Gleis-Rampe (hills.js, seit 10.10.2026 nur für Züge – die alte Weg-Rampe gibt es nicht mehr): Regeln wie die Treppe – Meldungen, Fuß frei,
// Anhöhe dahinter bleibt, Linien, Höhe (rampHeight stetig über alle Formen und Drehungen), wer wohin kommt (levelLink: 'gleis' über die Rampe,
// 'weg'/'fuss'/'fahr' nie), was oben darf (Gleise ja, Bahnhöfe erst Stufe 3). Formen, Leiste, Fenster und Zeichnen: tests/gleisrampe.test.js
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 26; y++) for (let x = 2; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'b'; hillWalkers.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i])(rampAt(${x}, ${y}))`);
const H = 26;

describe('Gleis-Rampe: Meldungen', () => {
  it('Wasser, Weg, Gleis, frei auf der Wiese, Richtung, Mitte der Anhöhe, belegt, getragen, Dach', () => {
    hills(block(10, 10, 13, 13));
    expect(game("placeError('huegelrampe', 18, 18)")).toMatch(/vor der Wand/);                // Damm B frei auf der Wiese
    game("state.terra.set('12,15', 'water'); recalc()");
    expect(game("placeError('huegelrampe', 12, 14)")).toBe('Nicht auf dem Wasser');
    weg([[13, 15]]);
    expect(game("placeError('huegelrampe', 13, 14)")).toMatch(/Nicht auf einen Weg/);
    rails([[10, 16]]);
    expect(game("placeError('huegelrampe', 10, 14)")).toMatch(/Nicht auf ein Gleis/);
    expect(game("placeError('huegelrampe', 11, 14, 1)")).toMatch(/zur Anhöhe hinauf/);         // passt nur hinauf nach −y
    expect(game("placeError('huegelrampe', 11, 14)")).toBe(null);
    game("rampNewForm = 'a'");
    expect(game("placeError('huegelrampe', 11, 11)")).toMatch(/an den Rand der Anhöhe/);      // mitten in der Anhöhe
    game("buildSmall('baum', 11, 13, CSLOT)");
    expect(game("placeError('huegelrampe', 11, 12)")).toMatch(/Hier steht: Baum/);           // eingelassen: das Feld muss leer sein
    expect(game("placeError('huegelrampe', 12, 12, 0, { move: true, t: { b: 'huegelrampe', rot: 0, form: 'a' } })")).toMatch(/vorhandenen Einschnitt/);   // getragen: nie absenken
    game("rampNewForm = 'b'; state.roofs.set('11,16', { form: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 11, 14)")).toMatch(/Überdachung/);
    // alle Felder zählen: Ding, kleine Deko auf dem 2. bzw. 3. Feld
    game("state.roofs.clear(); state.terra.set('12,15', 'grass'); state.tiles.set('11,15', { b: 'brunnen', lvl: 1 }); buildSmall('bank', 12, 16, 0); recalc()");
    expect(game("placeError('huegelrampe', 11, 14)")).toMatch(/nicht genug Platz/);
    expect(game("placeError('huegelrampe', 12, 14)")).toMatch(/kleine Dekos/);
  });

  it('Linien: nicht quer vor den Fuß, nicht hinter das obere Feld, nicht zwischen die Felder, nicht durch einen Einschnitt mit zwei Gleisen; an die Seite schon', () => {
    hills(block(10, 8, 15, 13));
    expect(game("build('huegelrampe', 11, 14)")).toBe(true);                                  // B: 11,14 … 11,16
    expect(game("edgeError('zaun', edgeBetween(11, 16, 11, 17))")).toMatch(/quer vor die Gleis-Rampe/);
    expect(game("edgeError('zaun', edgeBetween(11, 14, 11, 13))")).toMatch(/quer vor die Gleis-Rampe|Kante einer Anhöhe/);   // oben: auch die Kante der Anhöhe
    expect(game("edgeError('zaun', edgeBetween(11, 14, 11, 15))")).toMatch(/quer über die Gleis-Rampe/);
    expect(game("edgeError('zaun', edgeBetween(11, 15, 12, 15))")).toBe(null);                 // Seite: geht
    game("rampNewForm = 'a'");
    expect(game("build('huegelrampe', 13, 12) && build('huegelrampe', 14, 12)")).toBe(true);  // zwei Einschnitte nebeneinander: einer mit zwei Gleisen
    expect(game("edgeError('zaun', edgeBetween(13, 13, 14, 13))")).toMatch(/Einschnitt/);
    game("state.edges.set(edgeBetween(17, 14, 17, 15), { b: 'zaun', style: 0 }); recalc()");
    game("rampNewForm = 'b'; state.hills.set('17,13', { w: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 17, 14)")).toMatch(/Quer über die Gleis-Rampe läuft: Zaun/);
    game("state.edges.clear(); state.edges.set(edgeBetween(17, 16, 17, 17), { b: 'zaun', style: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 17, 14)")).toMatch(/Quer vor der Gleis-Rampe steht: Zaun/);
  });
});

describe('Gleis-Rampe: Fuß frei, Anhöhe dahinter bleibt', () => {
  it('kein Anheben/Teich vor dem Fuß, kein Abtragen dahinter, Rechteck-Abriss und ↶ wissen es', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14)");                                                    // B: Fuß 11,16, oben 11,14
    expect(game('hillRaiseError(11, 17)')).toMatch(/Fuß der Gleis-Rampe/);
    expect(game("placeError('graben', 11, 17)")).toMatch(/Fuß der/);
    expect(game('hillRaiseError(11, 15)')).toMatch(/Gleis-Rampe/);
    expect(game('demolishInfo(11, 13).err')).toMatch(/Rampe hinauf/);
    expect(game('lowerHill(11, 13)')).toBe(false);
    expect(game('rampsAround(11, 13)')).toEqual([[11, 14]]);
    expect(game('rampsAround(11, 17, true)')).toEqual([[11, 16]]);
    game("tool = 'abriss'; plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 12 }, b: { x: 11, y: 13 }, keepLand: true }");
    expect(game('planInfo(plan).firstErr')).toMatch(/Rampe hinauf/);
    game("plan = null; tool = 'look'");
    const m0 = game('state.money');
    expect(game('demolishInfo(11, 15).full')).toBe(true);                                     // Abreißen: voll zurück (wie Deko)
    game('demolish(11, 16)');
    expect([ramp(11, 14), ramp(11, 16), game('state.money')]).toEqual([null, null, m0 + game('RAMP_FORMS.b.cost')]);
    expect(game('lowerHill(11, 13)')).toBe(true);
    game("resetUndo(); undoable(() => lowerHill(12, 13))");                                   // ↶ einer Anhöhe, vor der inzwischen eine Rampe steht: geht nicht
    game("build('anhoehe', 12, 13); build('huegelrampe', 12, 14)");
    game("demolish(12, 14); lowerHill(12, 13); rampNewForm = 'd'; state.hills.set('12,12', { w: 0 }); recalc(); build('huegelrampe', 12, 13)");
    expect(ramp(12, 13)).toEqual(['12,13', 0, 4, 3]);
    expect(game('undo()')).toBe(false);
  });
});

describe('Gleis-Rampe: Höhe und Verbindungen', () => {
  it('rampHeight stetig linear vom Fuß (0) bis zur Hinterkante (HILL_H), alle Formen und Drehungen; surfaceHeight passt an Boden und Anhöhe', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      game("state.hills.clear(); for (let y = 2; y <= 26; y++) for (let x = 2; x <= 26; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(9, 9, 17, 17));
      game(`rampNewForm = '${form}'`);
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut;
      for (const [fx, fy, rot] of [[13, 18 + o, 0], [18 + o, 13, 3], [13, 8 - o, 2], [8 - o, 13, 1]]) {
        const [Du, Dv] = game(`STAIR_UP[${rot}]`), ax = Math.min(fx, fx + (len - 1) * Du), ay = Math.min(fy, fy + (len - 1) * Dv);
        game(`buildRot = ${rot}`);
        expect([form, rot, game(`build('huegelrampe', ${ax}, ${ay})`)]).toEqual([form, rot, true]);
        for (let s = 0; s <= 20 * len; s++) {                                                 // vom Fuß (Vorderkante) bis zur Hinterkante oben
          const d = -0.5 + s / 20, u = fx + Du * d + 0.13 * Dv, v = fy + Dv * d - 0.13 * Du;  // etwas neben der Mitte
          expect(game(`surfaceHeight(${u}, ${v})`)).toBeCloseTo(H * (d + 0.5) / len, 9);
          if (s < 20 * len) expect(game(`rampAlong(${Math.round(u)}, ${Math.round(v)}, ${u}, ${v})`)).toBeCloseTo(d + 0.5, 9);   // (ganz oben: schon die Anhöhe)
        }
        expect(game(`surfaceHeight(${fx - Du * 0.7}, ${fy - Dv * 0.7})`)).toBe(0);            // davor: Boden
        expect(game(`surfaceHeight(${fx + Du * (len + 0.2)}, ${fy + Dv * (len + 0.2)})`)).toBe(H);   // dahinter: Anhöhe
        expect(game(`rampHeight(${fx}, ${fy}, ${fx + 2}, ${fy})`)).toBe(0);                    // außerhalb des Felds
      }
    }
  });

  it("levelLink: Gleise über die Rampe längs ihrer Achse, nie quer oder über die Kante; Wege, Bewohner und Fahrzeuge nie über die Rampe; Treppe nur zu Fuß und fürs Wegenetz; ohne Anhöhen immer", () => {
    expect(game("[levelLink(3, 3, 4, 3), levelLink(3, 3, 4, 4, 'fuss'), levelLink(3, 3, 4, 3, 'gleis')]")).toEqual([true, true, true]);   // ohne Anhöhen wie bisher
    hills(block(10, 8, 15, 13));
    game("build('huegelrampe', 11, 14)");                                                    // B: Fuß 11,16 … oben 11,14, Anhöhe 11,13
    game("rampNewForm = 'a'; build('huegelrampe', 13, 12); build('huegelrampe', 14, 12)");   // zwei Einschnitte A nebeneinander: 13/14,13 Fuß, 13/14,12 oben
    game("build('huegeltreppe', 16, 10)");                                                   // Treppe rechts, hinauf nach −x
    const L = (a, b, c, d, who) => game(`levelLink(${a}, ${b}, ${c}, ${d}, '${who}')`);
    expect([L(11, 17, 11, 16, 'gleis'), L(11, 16, 11, 17, 'gleis')]).toEqual([true, true]);   // Feld davor ↔ Fuß
    expect([L(11, 16, 11, 15, 'gleis'), L(11, 15, 11, 14, 'gleis'), L(11, 14, 11, 13, 'gleis'), L(11, 13, 11, 14, 'gleis')]).toEqual([true, true, true, true]);   // hinauf bis auf die Anhöhe
    expect([L(11, 15, 12, 15, 'gleis'), L(11, 15, 10, 15, 'gleis'), L(11, 16, 12, 17, 'gleis'), L(10, 14, 11, 14, 'gleis')]).toEqual([false, false, false, false]);   // quer, über Eck
    expect([L(13, 13, 14, 13, 'gleis'), L(13, 12, 14, 12, 'gleis')]).toEqual([false, false]);   // im breiten Einschnitt nie quer
    expect([L(13, 14, 13, 13, 'gleis'), L(13, 12, 13, 11, 'gleis')]).toEqual([true, true]);
    expect([L(11, 12, 11, 13, 'gleis'), L(9, 12, 10, 12, 'gleis'), L(17, 17, 18, 17, 'gleis')]).toEqual([true, false, true]);   // ohne Rampe: gleiche Ebene, nie über die Kante
    for (const who of ['weg', 'fuss', 'fahr']) {
      expect([L(11, 17, 11, 16, who), L(11, 16, 11, 15, who), L(11, 14, 11, 13, who), L(13, 13, 13, 12, who), L(12, 15, 11, 15, who)]).toEqual([false, false, false, false, false]);
      expect([L(11, 18, 12, 18, who), L(11, 11, 11, 12, who)]).toEqual([true, true]);        // sonst wie bisher
    }
    expect([L(17, 10, 16, 10, 'gleis'), L(17, 10, 16, 10, 'fahr'), L(16, 10, 15, 10, 'gleis')]).toEqual([false, false, false]);   // Treppe: keine Gleise, keine Fahrzeuge
    for (const who of ['weg', 'fuss']) expect([L(17, 10, 16, 10, who), L(16, 10, 15, 10, who), L(16, 10, 16, 11, who)]).toEqual([true, true, false]);
  });

  it('oben dürfen Gleise (kommen beim Anheben mit hinauf), Wege, Deko; Bahnhöfe, Tunneleinfahrt und Parkbahn nicht', () => {
    hills(block(5, 5, 7, 7));
    expect(game("placeError('schiene', 6, 6)")).toBe(null);
    expect(game("build('schiene', 6, 6) && build('schiene', 6, 5)")).toBe(true);
    expect(game("[hillOk('schiene'), hillOk('weg'), hillOk('huegelrampe'), hillOk('huegeltreppe'), hillOk('station'), hillOk('tunneleinfahrt'), hillOk('pb_gleis')]")).toEqual([true, true, false, false, false, false, false]);
    expect(game("hillError('station', [[5, 5], [5, 6]])")).toMatch(/Bahnhöfe auf Anhöhen kommen später/);
    expect(game("hillError('tunneleinfahrt', [[5, 5], [5, 6]])")).toMatch(/Prellbock/);
    expect(game("hillError('pb_gleis', [[5, 5]])")).toMatch(/Parkeisenbahn/);
    expect(game("hillError('schiene', [[7, 7], [8, 7]])")).toMatch(/Kante/);                 // nie über die Kante
    rails([[10, 10], [10, 11]]);
    expect(game('hillRaiseError(10, 10)')).toBe(null);                                        // Gleis kommt mit hinauf (wie Wege)
  });
});
