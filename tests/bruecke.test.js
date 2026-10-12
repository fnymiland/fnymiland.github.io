const { loadGame, game } = require('./helpers/load-game');

// Brücke als eigenes Bauwerk (Block 160, bruecken.js; Nutzer 11.10.2026: „eine Brücke für alles – man baut sie, wo man will, dann zieht man
// einen Weg oder Schienen darüber“; Schritt 1: zwischen zwei Anhöhen, Holz und Stahl, darunter nur Flaches)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.delete('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.bruecken.clear(); hillWalkers.length = 0; walkers.length = 0; recalc(); resetUndo()");
  // zwei Anhöhen gegenüber: A x 10–13, B x 17–20 (y 10–14), dazwischen 3 Felder Lücke (x 14–16)
  game("for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
});
const plan = (tool, a, b) => game(`(() => { setTool('${tool}'); startPlan('line', ${JSON.stringify(a)}, ${JSON.stringify(b)}, false); const i = planInfo(plan); return { n: i.n, cost: i.cost, err: i.err, mat: i.mat }; })()`);
const run = () => game('runPlan()');
const BR = () => game("JSON.stringify([...state.bruecken])");

describe('Brücke bauen', () => {
  it('von Anhöhe zu Anhöhe gezogen (auch von weiter oben): Holz, 3 Felder, je Feld bezahlt; liegt als eigenes Bauwerk über der Lücke', () => {
    const i = plan('bruecke', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(i).toEqual({ n: 3, cost: 180, err: null, mat: { bretter: 9 } });
    const m0 = game('state.money');
    expect(run()).toBe(true);
    expect(BR()).toBe(JSON.stringify([['14,12', { ax: 0, n: 3, art: 'holz' }]]));
    expect(game('state.money')).toBe(m0 - 180);
    expect(game("[!!bkAt(14, 12), !!bkAt(16, 12), !!bkAt(17, 12), bkOnHill(13, 12).length, bkOnHill(17, 12).length, state.tiles.has('15,12')]")).toEqual([true, true, false, 1, 1, false]);
  });
  it('was nicht geht: schräg, keine zweite Anhöhe, Lücke zu lang, Haus darunter, Weg am Holzbock, Stahl ohne Bahn', () => {
    expect(plan('bruecke', { x: 12, y: 11 }, { x: 18, y: 13 }).err).toMatch(/Nur gerade/);
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 15, y: 12 }).err).toMatch(/Anhöhe gegenüber/);
    game("for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.delete('18,' + y); } groundVersion++; recalc()");
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }).err).toMatch(/Höchstens 4/);
    game("for (let y = 10; y <= 14; y++) for (const x of [17, 18]) state.hills.set(x + ',' + y, { w: 0 }); state.tiles.set('15,12', { b: 'haus', lvl: 1 }); groundVersion++; recalc()");
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/kein Platz für: Haus/);
    game("state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('14,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/Stütze der Brücke – der Weg darf nur quer/);   // Holz, 3 Felder: Stützen auf den Kanten (160c C1), der Weg läuft längs hindurch
    game("state.paintNew.bruecke = { form: 1 }");                                                     // Stahl
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/erst mit der Eisenbahn/);
    game("state.techs.add('bahn'); recalc()");                                                       // Forschen rechnet neu
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 })).toEqual({ n: 3, cost: 360, err: null, mat: { metall: 9 } });   // spannt frei
    run();
    expect(game("state.bruecken.get('14,12').art")).toBe('stahl');
  });
  it('darunter nur Flaches: Weg und Schiene ja (nicht längs durch eine Stütze), Haus, Anhöhe, Überdachung, Wald und hohe Deko nein', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("state.techs.add('bahn'); recalc()");
    expect(game("[placeError('weg', 15, 12), placeError('schiene', 15, 12), placeError('strand', 15, 12)]")).toEqual([null, null, null]);
    game("state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    expect(game("placeError('weg', 14, 12)")).toMatch(/Stütze der Brücke/);                       // längs über die Kante 14|15 (160c C1)
    expect(game("[placeError('weg', 15, 11), placeError('weg', 15, 13)]")).toEqual([null, null]);  // quer durch die Feldmitte: frei
    game("state.tiles.delete('15,12'); groundVersion++; recalc()");
    expect(game("placeError('haus', 15, 12)")).toMatch(/nur Platz für Flaches/);
    expect(game("placeError('wald', 15, 12)")).toMatch(/kein Wald/);
    expect(game("hillRaiseError(15, 12, true)")).toMatch(/Unter einer Brücke geht keine Anhöhe/);
    expect(game("roofError(15, 12, true)")).toMatch(/Unter einer Brücke/);
    expect(game("smallError('strassenlaterne', 15, 12, 0)")).toMatch(/zu hoch für unter die Brücke/);
    expect(game("smallError('blumen', 15, 12, 0)")).toBe(null);
  });
  it('die Anhöhen an den Enden tragen sie: kein Abtragen, keine Treppe hinein, im Rechteck rot', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    expect(game('lowerHill(13, 12)')).toBe(false);
    expect(game('demolishInfo(13, 12).err')).toMatch(/Brücke auf/);
    expect(game('stairIntoError(13, 12)')).toMatch(/Brücke auf/);
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 13, y: 11 }, b: { x: 13, y: 13 }, fixed: true }");
    expect(game("planInfo(plan).states.get('13,12')")).toBe('bad');
    game('runPlan()');
    expect(game("[!!hillAt(13, 12), !!hillAt(13, 11)]")).toEqual([true, false]);
  });
});

describe('Weg über die Brücke', () => {
  it('von Anhöhe zu Anhöhe gezogen: die Felder über der Lücke kommen aufs Deck, unten bleibt frei; Arm über die Kante, ein Viertel, eine Gegend', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    expect(game("(r => r && r.get('11,12') !== r.get('19,12'))(hillRegions())")).toBe(true);
    const i = plan('weg', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(i.err).toBe(null);
    run();
    expect(game("[state.bruecken.get('14,12').weg.length, state.bruecken.get('14,12').weg.every(Boolean), ['14,12', '15,12', '16,12'].some(k => state.tiles.has(k))]")).toEqual([3, true, false]);
    expect(game("[bAt(11, 12), bAt(13, 12), bAt(17, 12), bAt(19, 12)]")).toEqual(['weg', 'weg', 'weg', 'weg']);
    expect(game("pathArms(13, 12).map(a => a.join()).sort()")).toEqual(['-1,0', '1,0']);
    expect(game("pathArms(17, 12).map(a => a.join()).sort()")).toEqual(['-1,0', '1,0']);
    expect(game("T.net.vOf('11,12') === T.net.vOf('19,12')")).toBe(true);
    expect(game("(r => !r || r.get('11,12') === r.get('19,12'))(hillRegions())")).toBe(true);
  });
  it('unten quer durch die Lücke gezogen: ein Weg am Boden unter der Brücke, das Deck bleibt; auf dem Deck angefangen: oben', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    plan('weg', { x: 15, y: 6 }, { x: 15, y: 18 }); run();
    expect(game("[bAt(15, 12), bAt(15, 9), !!state.bruecken.get('14,12').weg]")).toEqual(['weg', 'weg', false]);
    game("setTool('weg'); startPlan('line', { x: 15, y: 12, deck: true }, { x: 16, y: 12 }, false); runPlan()");
    expect(game("state.bruecken.get('14,12').weg")).toEqual([null, game("currentStyle('weg')"), game("currentStyle('weg')")]);
    expect(game("bAt(16, 12)")).toBe(null);
  });
});

describe('Abreißen, Art, ↶, Speichern', () => {
  it('erst der Weg auf dem Deck, dann die Brücke (voll zurück); ↶ bringt beides; Fenster: Art wechseln und Abreißen', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    plan('weg', { x: 13, y: 12 }, { x: 17, y: 12 }); run();
    const m0 = game('state.money'), w = game('ITEMS.weg.cost');
    game('undoable(() => bkDemolishAt(15, 12))');
    expect([game("!!state.bruecken.get('14,12')"), game("!!state.bruecken.get('14,12').weg"), game('state.money')]).toEqual([true, false, m0 + 3 * w]);
    game('undoable(() => bkDemolishAt(15, 12))');
    expect([game('state.bruecken.size'), game('state.money'), game('state.res.bretter')]).toEqual([0, m0 + 3 * w + 180, 9999]);
    game('undo()'); game('undo()');
    expect([game("state.bruecken.get('14,12').weg.every(Boolean)"), game('state.money')]).toEqual([true, m0]);
    game("openBkInfo(15, 12)");
    expect(game("document.getElementById('panel').textContent")).toMatch(/Holzsteg/);
    game("document.querySelector('[data-bkart=\"stahl\"]').click()");
    expect(game("state.bruecken.get('14,12').art")).toBe('holz');                                    // ohne Bahn nicht
    game("state.techs.add('bahn'); openBkInfo(15, 12); document.querySelector('[data-bkart=\"stahl\"]').click()");
    expect([game("state.bruecken.get('14,12').art"), game('state.money'), game('state.res.metall')]).toEqual(['stahl', m0 + 180 - 360, 9999 - 9]);
    game("closePanel()");
  });
  it('↶ nimmt keine Anhöhe weg, auf der inzwischen eine Brücke liegt; Speichern und Laden behalten Brücke und Weg', () => {
    game("undoable(() => { state.hills.set('13,15', { w: 0 }); groundVersion++; })");             // ein Schritt, der eine Anhöhe baut …
    game("for (let y = 15; y <= 15; y++) for (const x of [17]) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
    game("state.tiles.delete('14,15'); state.tiles.delete('15,15'); state.tiles.delete('16,15')");
    plan('bruecke', { x: 13, y: 15 }, { x: 17, y: 15 }); run();                                       // … dann liegt dort eine Brücke auf
    expect(game('state.bruecken.size')).toBe(1);
    expect(game('undo()')).toBe(false);                                                             // die Anhöhe darunter bleibt
    expect([game("!!hillAt(13, 15)"), game('state.bruecken.size')]).toEqual([true, 1]);
    plan('weg', { x: 13, y: 15 }, { x: 17, y: 15 }); run();
    const before = BR();
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(BR()).toBe(before);
    const bad = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.bruecken = [['1,1', { ax: 0, n: 9 }], ['x', {}], ['2,2', { ax: 1, n: 2, art: 'gold', weg: ['sand', 'nix'] }]]; const m = parseSave(d).bruecken; return [m.size, m.get('2,2')]; })()");
    expect(bad).toEqual([1, { ax: 1, n: 2, art: 'holz', weg: ['sand', null] }]);                   // streng gelesen (fremde Inseln)
  });
  it('zeichnen ohne Fehler: Deck je Feld (Holz mit Böcken, Stahl), Bildchen fürs Menü und die Arten', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    plan('weg', { x: 13, y: 12 }, { x: 17, y: 12 }); run();
    expect(() => game("for (const x of [14, 15, 16]) bkDrawTile(x, 12, 300, 300, 2)")).not.toThrow();
    game("state.techs.add('bahn'); bkSetArt('14,12', 'stahl')");
    expect(() => game("for (const x of [14, 15, 16]) bkDrawTile(x, 12, 300, 300, 2); thumbRaw('bruecke'); lookThumb('bruecke', 1, 0); drawBkShadows(() => true)")).not.toThrow();
  });
});

describe('Gegengelesen (Block 160): Regeln dicht, Schatten, Laufwege', () => {
  it('nachträglich nichts Hohes darunter: keine Wasserbrücke, keine Fußgängerbrücke, kein Dach per ✋; Erz und Kristall wie Fels', () => {
    game("state.techs.add('bahn'); state.terra.set('15,12', 'water'); recalc()");
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    expect(game("placeError('weg', 15, 12)")).toMatch(/keine Wasserbrücke/);
    game("state.terra.set('15,12', 'grass'); state.tiles.set('15,12', { b: 'schiene', lvl: 1, cross: true }); groundVersion++; recalc()");
    expect(game("setCrossing(15, 12, true, 'holz')")).toBe(false);
    expect(game("state.tiles.get('15,12').foot")).toBe(undefined);
    expect(game("placeError('schiene', 15, 12, 0, { move: true, t: { b: 'schiene', cross: true, foot: true } })")).toMatch(/Fußgängerbrücke/);
    game("state.roofs.set('15,15', {}); state.tiles.delete('15,12'); groundVersion++; recalc(); setTool('verschieben'); pickUpRoofs(['15,15'])");
    expect(game("groupErrors(15, 12).first")).toMatch(/Unter einer Brücke geht keine Überdachung/);
    game("cancelMove(); setTool('look')");
    game("state.bruecken.clear(); state.terra.set('15,12', 'erz'); groundVersion++; recalc()");
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/Erzader/);
  });
  it('der Schatten wird wirklich gezeichnet (want bekommt nur das Feld)', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const n = game("(() => { let n = 0; const o = g.closePath.bind(g); g.closePath = () => { n++; return o(); }; try { drawBkShadows(([x, y], w = 1, h = 1) => w === 1 && h === 1); } finally { g.closePath = o; } return n; })()");
    expect(n).toBeGreaterThan(0);
  });
  it('Bewohner laufen nicht über Brücken: ihre Gegenden ohne Brücke, Wirtschaft und Spaziergänger mit; Trittsteine nicht aufs Deck', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    plan('weg', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    expect(game("(r => !r || r.get('11,12') === r.get('19,12'))(hillRegions())")).toBe(true);
    expect(game("(r => !!r && r.get('11,12') !== r.get('19,12'))(hillWalkRegions())")).toBe(true);
    expect(game("[hwSideOk(13, 12, 14, 12, 1), hwSideOk(14, 12, 15, 12, 1), hwSideOk(15, 12, 15, 13, 1), hwTileOk(15, 12, 1)]")).toEqual([true, true, false, true]);
    game("state.bruecken.get('14,12').weg = null; groundVersion++; recalc()");
    expect(plan('weg', { x: 13, y: 12 }, { x: 17, y: 12 }).err).toBe(null);
    game("state.design.add('wegmuster:tritt'); chosenStyle.weg = wegStyleOf('tritt'); groundVersion++");
    plan('weg', { x: 13, y: 12 }, { x: 17, y: 12 });
    expect(game("(i => [i.states.get('15,12'), i.firstErr])(planInfo(plan))")).toEqual(['bad', game('BK_NO_STONES')]);   // oben rot, die Anhöhen-Felder gehen
  });
  it('auf dem Deck angefangen und als Rechteck gezogen (Maus): oben; Abriss-Rechteck: was unter einer herausragenden Brücke abgerissen wird, ist grün', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("setTool('weg'); startPlan('rect', { x: 14, y: 12, deck: true }, { x: 16, y: 12 }, false); runPlan()");
    expect(game("[state.bruecken.get('14,12').weg.every(Boolean), ['14,12', '15,12', '16,12'].some(k => state.tiles.has(k))]")).toEqual([true, false]);
    game("state.tiles.set('15,13', { b: 'weg', lvl: 1, style: 'sand' }); state.decos.set('15,12', [{ b: 'blumen', rot: 0 }, null, null, null]); groundVersion++; recalc()");
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 15, y: 12 }, b: { x: 15, y: 13 }, fixed: true }");
    expect(game("planInfo(plan).states.get('15,12')")).toBe('ok');
  });
});

// 160c C1: Stützen und Böcke auf den Kachelkanten zwischen den Feldern der Lücke – die Feldmitte bleibt frei (Weg quer darunter)
describe('Stützen auf den Kachelkanten (160c C1)', () => {
  it('Tabelle: Holz-Fußgänger keine/wenige/jede, Holz-Bahn jede Kante, Stein je 2 Felder, Metall und Kristall keine, Wand nie', () => {
    const S = (mat, fam, st, n) => game(`brSupports({ mat: '${mat}', fam: '${fam}', stuetzen: '${st}' }, ${n})`);
    expect([1, 2, 3, 4, 5, 6, 8].map(n => S('holz', 'fuss', 'wenige', n))).toEqual([[], [1], [1, 2], [1, 3], [1, 4], [1, 3, 5], [1, 3, 5, 7]]);
    expect(S('holz', 'fuss', 'keine', 4)).toEqual([]); expect(S('holz', 'fuss', 'jede', 4)).toEqual([1, 2, 3]);
    expect(S('holz', 'bahn', 'keine', 4)).toEqual([1, 2, 3]);
    expect([2, 3, 4, 5, 6].map(n => S('stein', 'fuss', 'wenige', n))).toEqual([[], [], [2], [2, 3], [2, 4]]);
    expect([S('stahl', 'fuss', 'jede', 4), S('kristall', 'bahn', 'jede', 4)]).toEqual([[], []]);
  });
  it('Weg quer durch die Feldmitte unter dem Holzviadukt (mit Gleis): geht; längs über eine Kante nicht', () => {
    game("state.techs.add('bahn'); recalc()");
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    plan('schiene', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    expect(plan('weg', { x: 15, y: 9 }, { x: 15, y: 15 }).err).toBe(null);                    // quer: ganz durch
    expect(game("bAt(15, 12)")).toBe(null); run(); expect(game("bAt(15, 12)")).toBe('weg');
    expect(game("placeError('weg', 16, 12)")).toMatch(/Stütze der Brücke/);
  });
  it('Zaun auf der Stützenkante, Torbogen und Deko an der Seitenmitte davor: abgelehnt; Bergportal unter dem Brückenende auch', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();                               // Holz, 3 Felder: Kanten 14|15 und 15|16
    expect(game("edgeError('zaun', edgeBetween(14, 12, 15, 12))")).toMatch(/Stütze der Brücke/);
    expect(game("edgeError('zaun', edgeBetween(15, 12, 15, 13))")).toBe(null);                 // an der Seite (quer): frei
    const side = game("MID_SIDE.findIndex(([dx, dy]) => dx === 1 && dy === 0) + 4");
    expect(game(`smallError('blumen', 15, 12, ${side})`)).toMatch(/Stütze der Brücke/);
    expect(game(`smallError('blumen', 15, 12, ${game("MID_SIDE.findIndex(([dx, dy]) => dx === 0 && dy === 1) + 4")})`)).toBe(null);
    game("state.edges.set(edgeBetween(15, 12, 15, 13), { b: 'zaun', style: 'holz' }); for (const y of [12, 13]) state.tiles.set('15,' + y, { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    expect(game("setArch(edgeBetween(15, 12, 15, 13), Object.keys(ARCHES)[0])")).toBe(false);   // Torbogen unter dem Deck (R8)
    expect(game("bpError(13, 12, bpDirs(13, 12)[0], false, true)")).toMatch(/liegt eine Brücke auf/);   // R9: die Öffnung käme unter das Brückenende
    expect(game("bpError(13, 11, bpDirs(13, 11)[0], false, true)")).toBe(null);                // daneben: frei
  });
  it('alter Stand: eine Linie liegt schon auf der Stützenkante – die Stütze wird nur nicht gezeichnet, nichts geht verloren', () => {
    game("state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' }); state.edges.set(edgeBetween(14, 12, 15, 12), { b: 'zaun', style: 'holz' }); groundVersion++; recalc()");
    expect(game("bkSupports(state.bruecken.get('14,12'))")).toEqual([1, 2]);
    expect(game("bkSupportsShown(bkAt(15, 12))")).toEqual([2]);
    expect(game("state.edges.has(edgeBetween(14, 12, 15, 12))")).toBe(true);
    expect(() => game("for (const x of [14, 15, 16]) bkDrawTile(x, 12, 300, 300, 2)")).not.toThrow();
  });
  it('Rückgängig: eine Brücke kommt nicht zurück, wenn inzwischen ein Weg längs über ihre Stützenkante läuft', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("resetUndo(); undoable(() => bkDemolishAt(15, 12))");
    expect(game('state.bruecken.size')).toBe(0);
    game("build('weg', 14, 12, true); build('weg', 15, 12, true); recalc()");
    expect(game('undo()')).toBe(false);
    expect(game('state.bruecken.size')).toBe(0);
  });
});

// 160c C2e: Spaziergänger oben folgen dem Bogen (am Fußpunkt), stetig von der Anhöhe übers Deck; mit Gleis flach
describe('Figuren auf dem Bogen (160c C2e)', () => {
  it('Höhe am Scheitel, stetig über Wand und Deck, Gleisbrücke flach', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();                               // Holz, 3 Felder (14–16)
    const H = game('HILL_H'), pk = game("brPeak('fuss', 3)"), f = game('FOOT_D');
    expect(game(`hwTopH(15 - ${f}, 12 + ${f}, 1)`)).toBeCloseTo(H + pk, 3);                 // Füße in der Mitte des mittleren Felds = Scheitel
    expect(game(`hwTopH(15, 12, 1, true)`)).toBeCloseTo(H + pk, 3);                        // sitzend: in der Mitte
    expect(game('hwTopH(11, 12, 1)')).toBe(H);                                              // auf der Anhöhe
    const jump = game(`(() => { let m = 0, p = hwTopH(12, 12, 1); for (let u = 12.02; u <= 19; u += 0.02) { const h = hwTopH(u, 12, 1); m = Math.max(m, Math.abs(h - p)); p = h; } return m; })()`);
    expect(jump).toBeLessThan(1);
    game("state.bruecken.get('14,12').gleis = [0, 0, 0]; groundVersion++");
    expect(game(`hwTopH(15 - ${f}, 12 + ${f}, 1)`)).toBe(H);
  });
});

// 160c C2f: Antippen trifft das Deck dort, wo es auf dem Bogen gezeichnet ist (Vorschau = Klick); das Scheitelfeld nie das Feld dahinter
describe('Antippen auf dem Bogen (160c C2f)', () => {
  it('jeder Deckpunkt (t, s) trifft sein Feld; Gleisbrücke wie bisher flach', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const miss = game(`(() => { cam.z = 2; const p0 = iso(15, 12); cam.x = p0.x; cam.y = p0.y; const out = [];
      for (const x of [14, 15, 16]) { const c = bkAt(x, 12), p = toScreen(x, 12);
        for (let du = -0.3; du <= 0.31; du += 0.15) for (const s of [-0.3, 0, 0.3]) {   // am Feldrand zählt das Geländer des Nachbarfelds davor
          const h = bkH(c.b, c.i + du), sx = p.x + (du - s) * TW / 2 * cam.z, sy = p.y + (du + s) * TH / 2 * cam.z - h * cam.z, r = bkPick(sx, sy);
          if (!r || r.x !== x || r.y !== 12) out.push([x, du, s, r && r.x]); } }
      return out; })()`);
    expect(miss).toEqual([]);
    const hdr = game(`(() => { const c = bkAt(15, 12), p = toScreen(15, 12), h = bkH(c.b, 1); return [bkPick(p.x, p.y - (h + 22) * cam.z), bkPick(p.x, p.y - (h + 3) * cam.z)]; })()`);
    expect(hdr[0]).toBe(null); expect(hdr[1]).toMatchObject({ x: 15, y: 12, deck: true });    // über dem Geländer nicht, knapp darüber noch
  });
});

// 160c C2g: Schatten folgt dem Bogen, Wegstück der nahen Anhöhe nur knapp aufs Deck, Lichtraum unverändert
describe('Schatten und Anschluss am Bogen (160c C2g)', () => {
  it('ein Pfad je Brücke mit 2·(12n+1) Punkten, am Scheitel um SUN·(HILL_H+pk) versetzt; Überlapp 0,012 an der nahen Anhöhe', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const r = game(`(() => { const g0 = g, pts = []; let fills = 0;
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'fill' ? () => { fills++; } : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      try { drawBkShadows(() => true); } finally { g = g0; }
      const mid = iso(15, 12 - BK_W), top = pts[18];
      return [pts.length, fills, top[0] - mid.x, top[1] - mid.y]; })()`);
    expect(r[0]).toBe(2 * (12 * 3 + 1)); expect(r[1]).toBe(1);
    const h = game("HILL_H + brPeak('fuss', 3)");
    expect(r[2]).toBeCloseTo(game('SUN.dx') * h, 3); expect(r[3]).toBeCloseTo(game('SUN.dy') * h, 3);
    expect(game('[bkFlatOver(17, 12, -1, 0), bkFlatOver(13, 12, 1, 0)]')).toEqual([0.012, 0.06]);
    expect(game('brClear()')).toBe(game('BK_CLEAR'));
  });
});

// 160c C1 gegengelesen: Lücken in der Stützenregel (Übergang, Gruppe, Bergportal, alte Stände bei ↶ und Gleis)
describe('Stützen gegengelesen (160c C1)', () => {
  it('Bahnübergang unter dem Deck: kein Weg längs durch eine Stütze; Gruppe zählt ihre Wege mit', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();                               // Holz, 3 Felder: Kanten 14|15, 15|16
    game("state.techs.add('bahn'); for (const y of [11, 12, 13]) state.tiles.set('15,' + y, { b: 'schiene', lvl: 1 }); state.tiles.set('14,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    expect(game("crossError('weg', 15, 12, true)")).toMatch(/Stütze der Brücke/);
    game("state.tiles.delete('14,12'); groundVersion++; recalc()");
    expect(game("crossError('weg', 15, 12, true)")).toBe(null);                              // quer allein: geht
    expect(game("(() => { BK_GROUP = { weg: new Set(['15,12']), schiene: new Set() }; try { return placeError('weg', 16, 12); } finally { BK_GROUP = null; } })()")).toMatch(/Stütze der Brücke/);
  });
  it('Bergportal: die Brücke nie vor seine Öffnung (wie bpError)', () => {
    const e = game(`(() => { const f = bpFronts; bpFronts = (x, y) => x === 15 && y === 12 ? [[15, 11]] : []; try { setTool('bruecke'); startPlan('line', { x: 12, y: 12 }, { x: 18, y: 12 }, false); return planInfo(plan).firstErr; } finally { bpFronts = f; } })()`);
    expect(e).toMatch(/Bergportal/);
  });
  it('alter Stand (Zaun auf der Stützenkante): Art wechseln und ↶ geht, Gleis aufs Deck auch – nur neue Stützen zählen', () => {
    game("state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' }); state.edges.set(edgeBetween(14, 12, 15, 12), { b: 'zaun', style: 'holz' }); state.techs.add('bahn'); groundVersion++; recalc(); resetUndo()");
    expect(game("bkRailCheck(15, 12).err")).toBeUndefined();                                // Holz n 3: Fußgänger [1, 2] = Bahn [1, 2]
    expect(game("undoable(() => bkSetArt('14,12', 'stahl'))")).toBe(true);
    expect(game('undo()')).toBe(true);
    expect(game("state.bruecken.get('14,12').art")).toBe('holz');
    expect(game("state.edges.has(edgeBetween(14, 12, 15, 12))")).toBe(true);
  });
});

// 160c C2 gegengelesen: Weg-Muster folgt dem Bogen (Fugen in Stücken), Stützen im Wasser reichen bis auf die Wasserfläche
describe('Bogen gegengelesen (160c C2)', () => {
  it('Muster mit gebogenem L: jede Fuge in Stücken ≤ 1/12 Feld; ohne sub wie bisher zwei Punkte', () => {
    const r = game(`(() => { const g0 = g, segs = []; let cur = null;
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' ? (x, y) => { cur = [[x, y]]; segs.push(cur); } : k === 'lineTo' ? (x, y) => cur && cur.push([x, y]) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      const L = ([u, v]) => [u, v];
      try { PAT_SUB = 12; patternDraw(L, 'tiles', 0, 0, 1, '#000000', null, 0, null); const a = segs.splice(0); PAT_SUB = 0; patternDraw(L, 'tiles', 0, 0, 1, '#000000', null, 0, null); return [a, segs]; }
      finally { g = g0; PAT_SUB = 0; } })()`);
    const step = s => Math.max(...s.slice(1).map((p, i) => Math.max(Math.abs(p[0] - s[i][0]), Math.abs(p[1] - s[i][1]))));
    expect(r[0].length).toBeGreaterThan(0);
    expect(Math.max(...r[0].filter(s => s.length > 1).map(step))).toBeLessThanOrEqual(1 / 12 + 1e-9);
    expect(r[1].every(s => s.length === 2)).toBe(true);
  });
  it('Stütze über Wasser: Fuß auf der Wasserfläche (−0,7·DEPTH), über Land 0', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const foot = () => game(`(() => { const g0 = g, hs = []; g = new Proxy({}, { get: (o, k) => k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      try { const c = bkAt(15, 12), A = bkTileArgs(c, 0, 0, 1), P = (t, s, h) => { hs.push(h); return [t, h]; }; bkPaintLage('h', P, 1, A.art, A.n, A.t0, A.t1, A.weg, A.opts); } finally { g = g0; }
      return Math.min(...hs); })()`);
    expect(foot()).toBe(0);
    game("for (let x = 14; x <= 16; x++) state.terra.set(x + ',12', 'water'); waterChanged(); groundVersion++; recalc()");
    expect(foot()).toBeCloseTo(-0.7 * game('DEPTH'), 6);
  });
});
