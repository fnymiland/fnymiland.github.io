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
// Anhöhe B (y 10–14) so setzen, dass die Lücke ab x 14 n Felder lang ist: B bei x 14+n … 17+n (160c C8)
const luecke = n => game(`for (let y = 10; y <= 14; y++) for (let x = 17; x <= 26; x++) { if (x >= 14 + ${n} && x <= 17 + ${n}) state.hills.set(x + ',' + y, { w: 0 }); else state.hills.delete(x + ',' + y); } groundVersion++; recalc()`);

describe('Brücke bauen', () => {
  it('von Anhöhe zu Anhöhe gezogen (auch von weiter oben): Holz, 3 Felder, je Feld bezahlt; liegt als eigenes Bauwerk über der Lücke', () => {
    const i = plan('bruecke', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(i).toEqual({ n: 3, cost: 180, err: null, mat: { bretter: 9 } });
    const m0 = game('state.money');
    expect(run()).toBe(true);
    expect(JSON.parse(BR())).toEqual([['14,12', { ax: 0, n: 3, art: 'holz', brp: { money: 180, bretter: 9, k: 'a:holz' } }]]);   // neues Format: bezahlt (160c C6)
    expect(game('state.money')).toBe(m0 - 180);
    expect(game("[!!bkAt(14, 12), !!bkAt(16, 12), !!bkAt(17, 12), bkOnHill(13, 12).length, bkOnHill(17, 12).length, state.tiles.has('15,12')]")).toEqual([true, true, false, 1, 1, false]);
  });
  it('was nicht geht: schräg, keine zweite Anhöhe, Lücke zu lang, Haus darunter, Weg am Holzbock, Stahl ohne Bahn', () => {
    expect(plan('bruecke', { x: 12, y: 11 }, { x: 18, y: 13 }).err).toMatch(/Nur gerade/);
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 15, y: 12 }).err).toMatch(/Anhöhe gegenüber/);
    luecke(9);                                                                                       // 160c C8: bis 8 Felder
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 24, y: 12 }).err).toMatch(/Höchstens 8 Felder Lücke$/);
    luecke(3);
    game("state.tiles.set('15,12', { b: 'haus', lvl: 1 }); groundVersion++; recalc()");
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
    expect(game("document.getElementById('panel').textContent")).toMatch(/Brücke aus Holz/);
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
    expect(JSON.parse(BR())).toEqual(JSON.parse(before));
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
  it('Tabelle: Holz-Fußgänger keine/wenige/jede, Holz-Bahn jede Kante, Stein je 2 Felder (ungerade ab 5: Mitte 3), Metall und Kristall keine, Wand nie', () => {
    const S = (mat, fam, st, n) => game(`brSupports({ mat: '${mat}', fam: '${fam}', stuetzen: '${st}' }, ${n})`);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(n => S('holz', 'fuss', 'wenige', n))).toEqual([[], [1], [1, 2], [1, 3], [1, 4], [1, 3, 5], [1, 3, 4, 6], [1, 3, 5, 7]]);   // 7: wie C1 (Nutzer 12.10.2026)
    expect(S('holz', 'fuss', 'keine', 4)).toEqual([]); expect(S('holz', 'fuss', 'jede', 4)).toEqual([1, 2, 3]);
    expect(S('holz', 'bahn', 'keine', 4)).toEqual([1, 2, 3]);
    expect([2, 3, 4, 5, 6, 7, 8].map(n => S('stein', 'fuss', 'wenige', n))).toEqual([[], [], [2], [1, 4], [2, 4], [2, 5], [2, 4, 6]]);   // gerade: je 2 von außen; ungerade ab 5: Mitte 3 Felder (C8, Nutzer 12.10.2026: 1-3-1, 2-3-2)
    expect([1, 2, 4].map(n => S('stein', 'bahn', 'wenige', n))).toEqual([[], [1], [1, 2, 3]]);   // Stein-Viadukt (Bahn): Pfeiler an jeder Kante (Variante B)
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

// 160c C3e: Steinbogen – der Boden darunter liegt im Schatten (Tunnel), ohne den Streifen im Schatten der Anhöhe, nicht über Wasser
describe('Tunnelschatten (160c C3)', () => {
  const stein = () => game("(() => { const b = { ax: 0, n: 3, art: 'stein' }; b.brp = { ...brPrice({ mat: 'stein' }, 'anhoehe', 3), k: brSig(b, 'anhoehe') }; state.bruecken.set('14,12', b); groundVersion++; recalc(); })()");
  const paths = () => game(`(() => { const g0 = g, out = []; let cur = null, fills = 0;
    g = new Proxy({}, { get: (o, k) => k === 'moveTo' ? (x, y) => { cur = [[x, y]]; out.push(cur); } : k === 'lineTo' ? (x, y) => cur.push([x, y]) : k === 'fill' ? () => { fills++; } : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
    try { drawBkShadows(() => true); } finally { g = g0; } return { n: out.map(p => p.length), fills, rect: out[1] }; })()`);
  it('ein fill: Deck (2·(12n+1) Punkte) und ein Rechteck auf Höhe 0 ab A + SUN-Versatz; Holz ohne; Wasser ohne', () => {
    stein();
    const r = paths();
    expect(r.fills).toBe(1); expect(r.n).toEqual([2 * (12 * 3 + 1), 4]);
    const sh = game('(SUN.dx / TW + SUN.dy / TH) * HILL_H'), p = game(`iso(14 - 0.5 + ${sh}, 12 - BK_W)`);
    expect(r.rect[0][0]).toBeCloseTo(p.x, 6); expect(r.rect[0][1]).toBeCloseTo(p.y, 6);
    game("for (let x = 14; x <= 16; x++) state.terra.set(x + ',12', 'water'); waterChanged(); groundVersion++; recalc()");
    expect(paths().n).toEqual([2 * (12 * 3 + 1)]);
    game("state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' }); for (let x = 14; x <= 16; x++) state.terra.set(x + ',12', 'grass'); waterChanged(); groundVersion++; recalc()");
    expect(paths().n).toEqual([2 * (12 * 3 + 1)]);
  });
});

// 160c C3f: Stein – Pfeiler und Lichtraum in den Regeln, Antippen trifft Stirn und Pfeiler (dieselbe Geometrie wie das Bild, G8)
describe('Pfeiler und Lichtraum (160c C3)', () => {
  const stein4 = (ax = 0) => game(`(() => { for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.set('21,' + y, { w: 0 }); }   // Lücke 14–17: 4 Felder
    const b = { ax: 0, n: 4, art: 'stein' }; b.brp = { ...brPrice({ mat: 'stein' }, 'anhoehe', 4), k: brSig(b, 'anhoehe') }; state.bruecken.set('14,12', b); groundVersion++; recalc(); })()`);
  it('Ecken am Pfeiler: kein Platz (auch nicht für Blumen); unter dem Bogen bis 20; Holz: dieselben Ecken frei', () => {
    stein4();
    expect(game("bkAt(15, 12).G.stone.piers")).toEqual([2]);
    for (const [x, s] of [[15, 1], [15, 3], [16, 0], [16, 2]]) expect(game(`smallError('blumen', ${x}, 12, ${s})`)).toMatch(/Pfeiler/);
    expect(game("smallError('blumen', 15, 12, 0)")).toBe(null);
    expect(game("bkTooTall('kristallaterne', 15, 12, CSLOT)")).toBe(null);                   // Feldmitte unter dem Bogen: 20 passt
    expect(game("smallError('strassenlaterne', 15, 12, CSLOT)")).toMatch(/zu hoch/);
    game("state.bruecken.set('14,12', { ax: 0, n: 4, art: 'holz' }); groundVersion++; recalc()");
    expect(game("smallError('blumen', 16, 12, 0)")).toBe(null);                              // Holz: Stützen [1, 3], nicht an Kante 2
  });
  it('↶: eine Steinbrücke kommt nicht zurück, wenn inzwischen Blumen an ihrer Pfeilerecke stehen', () => {
    stein4();
    game("resetUndo(); undoable(() => bkDemolishAt(15, 12))");
    expect(game('state.bruecken.size')).toBe(0);
    game("state.decos.set('15,12', [null, { b: 'blumen' }]); groundVersion++");
    expect(game('undo()')).toBe(false);
  });
  it('Antippen: Stirn und Pfeiler treffen die Brücke, die Öffnung nicht', () => {
    stein4();
    const hit = (t, s, h) => game(`(() => { cam.z = 2; const p0 = iso(15.5, 12); cam.x = p0.x; cam.y = p0.y; const c = bkAt(14, 12), p = toScreen(14, 12);
      const sx = p.x + (${t} - ${s}) * TW / 2 * cam.z, sy = p.y + (${t} + ${s}) * TH / 2 * cam.z - ${h} * cam.z, r = bkPick(sx, sy); return r ? r.x : null; })()`);
    expect(hit(1, 0.39, 30)).toBe(15);                                                     // Stirn über dem Bogen
    expect(hit(1.43, 0.4, 5)).toBe(15);                                                    // Pfeilerfront (Kante 15|16 bei 1,5)
    expect(hit(1.65, 0, 5)).toBe(16);                                                      // durch die Öffnung auf die Pfeilerseite
    expect(hit(1, 0.4, 12)).toBe(null);                                                    // Öffnung
  });
});

// 160c C3 gegengelesen: Randfälle der Steinbrücke
describe('Stein gegengelesen (160c C3)', () => {
  const stein4 = (rail = false) => game(`(() => { for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.set('21,' + y, { w: 0 }); }
    const b = { ax: 0, n: 4, art: 'stein' ${rail ? ", gleis: [0, 0, 0, 0]" : ''} }; b.brp = { ...brPrice({ mat: 'stein' }, 'anhoehe', 4), k: brSig(b, 'anhoehe') }; state.bruecken.set('14,12', b); groundVersion++; recalc(); })()`);
  it('Ecke, die eine Linie am Eckpunkt nach innen rückt: geprüft wird auch der Platz ohne Linie (fällt sie weg, stünde die Deko im Pfeiler)', () => {
    stein4();
    game("state.edges.set('a15,13', { b: 'zaun', style: 'holz' }); groundVersion++; recalc()");
    expect(game("slotPos(15, 12, 3, { b: 'blumen' })[0]")).toBeLessThan(0.3);                 // eingerückt
    expect(game("smallError('blumen', 15, 12, 3)")).toMatch(/Pfeiler/);
  });
  it('Gleis von einer Steinbrücke entfernen: nur, wenn darunter alles unter den Bogen passt', () => {
    stein4(true);
    const r = game(`(() => { const ue = bkUnderError; bkUnderError = (x, y, G) => G && G.stone && G.fam === 'fuss' && x === 15 ? 'Laterne ist zu hoch für unter die Brücke' : null;
      try { return [bkDemolishAt(15, 12), bkRailAny(state.bruecken.get('14,12'))]; } finally { bkUnderError = ue; } })()`);
    expect(r).toEqual([false, true]);
    expect(game("bkDemolishAt(15, 12)")).toBe(true);
    expect(game("bkRailAny(state.bruecken.get('14,12'))")).toBe(false);
  });
  it('Drehung zählt (gedrehte Bank); eine Linie vor dem Brückenfeld gewinnt beim Antippen', () => {
    stein4();
    const args = game(`(() => { const t = bkTooTall; let a = null; bkTooTall = (...x) => { a = x; return null; }; const br = buildRot; buildRot = 1;
      try { smallError('bank', 15, 12, 0); } finally { bkTooTall = t; buildRot = br; } return a; })()`);
    expect(args[5]).toBe(1);
    const r = game(`(() => { const en = edgeNear, bp = bkPick; edgeNear = () => 'a16,13'; bkPick = () => ({ x: 16, y: 12, deck: true });
      state.edges.set('a16,13', { b: 'zaun', style: 'holz' });
      try { return bkPickFront(0, 0); } finally { edgeNear = en; bkPick = bp; state.edges.delete('a16,13'); } })()`);
    expect(r).toBe(null);
  });
});

// 160c C5d: Stein-Viadukt (Variante B) – Gleis aufs Steindeck macht Pfeiler an jeder Kante und flachere Bögen: geprüft wird beides
describe('Stein-Viadukt (160c C5d)', () => {
  it('Gleis auf eine Steinbrücke: nur, wenn die neuen Pfeiler frei sind und darunter alles unter die Viadukt-Bögen passt', () => {
    game("state.techs.add('bahn'); for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.set('21,' + y, { w: 0 }); } const b = { ax: 0, n: 4, art: 'stein' }; b.brp = { ...brPrice({ mat: 'stein' }, 'anhoehe', 4), k: brSig(b, 'anhoehe') }; state.bruecken.set('14,12', b); groundVersion++; recalc()");
    expect(game("bkRailCheck(15, 12).err")).toBeUndefined();
    game("state.tiles.set('14,12', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");   // Weg längs über Kante 1 (beim Bogen ohne Pfeiler)
    expect(game("bkRailCheck(15, 12).err")).toMatch(/mehr Stützen/);
    game("state.tiles.delete('14,12'); state.tiles.delete('15,12'); state.decos.set('15,12', [null, null, null, null, null, null, null, null, null, { b: 'kristallaterne' }]); groundVersion++; recalc()");   // 20 hoch in der Feldmitte
    expect(game("bkRailCheck(15, 12).err")).toMatch(/Viadukt/);
  });
});

// 160c C5c: Zug quer unter der Brücke – Stücke je Feld, Schnitt an der Stirn (s = +W); darunter 'U', vor der Stirn im Brückenfeld 'F'
describe('Zug unter der Brücke in Stücken (160c C5c)', () => {
  it('Stücke ergeben den ganzen Wagen; Klassen nach Querlage; Schatten genau einmal; ohne Brücke null', () => {
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();                               // Holz, 3 Felder (14–16, y 12)
    for (const py of [11.4, 11.8, 12.0, 12.3, 12.6]) {                                         // bei 12,9 liegt der Wagen ganz vor der Brückenzeile
      const r = game(`(() => { const m = { train: {}, px: 15, py: ${py}, du: 0, dv: 1, len: 0.8 };
        const ps = brCarPiecesUnder(m); return ps && ps.map(p => ({ k: p.k, cut: p.m.cut, cls: p.m.bkCls || null, sh: !!p.m.shadow })); })()`);
      expect(r).not.toBe(null);
      const len = r.reduce((s, p) => s + (p.cut ? p.cut[1] - p.cut[0] : 0.8), 0);
      expect(len).toBeCloseTo(0.8, 6);
      for (const p of r) { if (p.k === '15,12') { expect(p.cls).not.toBe(null); } else expect(p.cls).toBe(null); }
      if (r.length > 1) expect(r.filter(p => p.sh).length).toBe(1);
    }
    const f = game(`(() => { const ps = brCarPiecesUnder({ train: {}, px: 15, py: 12.2, du: 0, dv: 1, len: 0.8 }); return ps.filter(p => p.k === '15,12').map(p => [p.m.cut[0], p.m.cut[1], p.m.bkCls]); })()`);
    expect(f).toEqual([[-0.4, expect.closeTo(0.2, 6), 'U'], [expect.closeTo(0.2, 6), expect.closeTo(0.3, 6), 'F']]);   // Schnitt an der Stirn (12 + 0,4)
    expect(game("brCarPiecesUnder({ train: {}, px: 8, py: 8, du: 0, dv: 1, len: 0.8 })")).toBe(null);
  });
});

// 160c C6: Leiste (Material, Farbe), Bau im neuen Format, Setzer brSet, Fenster
// 160c C9a: die Lücke wird je Feld ab dem Anker geprüft, nicht in Zugrichtung – von rechts gezogen war der Platz unter Stein gespiegelt
describe('Prüfung unter der Brücke unabhängig von der Zugrichtung (160c C9a)', () => {
  it('Stein 5 Felder (Pfeiler an Kante 1 und 4): Blumen am Pfeiler stören von links wie von rechts gezogen', () => {
    luecke(5); game("state.restore = { klippe: 1 }; state.paintNew.bruecke = { form: 2 }");
    const slot = game("(() => { for (let j = 0; j < 4; j++) { const [u] = slotPos(14, 12, j, { b: 'blumen' }); if (u > 0.3) return j; } return -1; })()");
    expect(slot).toBeGreaterThanOrEqual(0);
    game(`(() => { const ds = [null, null, null, null]; ds[${slot}] = { b: 'blumen' }; state.decos.set('14,12', ds); groundVersion++; recalc(); })()`);
    const lr = plan('bruecke', { x: 12, y: 12 }, { x: 20, y: 12 }).err, rl = plan('bruecke', { x: 20, y: 12 }, { x: 12, y: 12 }).err;
    expect(lr).toMatch(/Pfeiler/);
    expect(rl).toBe(lr);
  });
});

// 160c C8: bis 8 Felder Lücke (gelesen wurde schon bis 8, A3); 9 nicht
describe('Bis 8 Felder (160c C8)', () => {
  it('8 Felder: gebaut und je Feld bezahlt, beide Richtungen; 9 Felder nicht (nichts bezahlt)', () => {
    luecke(8);
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 23, y: 12 })).toEqual({ n: 8, cost: 480, err: null, mat: { bretter: 24 } });
    const m0 = game('state.money');
    expect(run()).toBe(true);
    expect(JSON.parse(BR())).toEqual([['14,12', { ax: 0, n: 8, art: 'holz', brp: { money: 480, bretter: 24, k: 'a:holz' } }]]);
    expect(game('state.money')).toBe(m0 - 480);
    expect(game('[!!bkAt(21, 12), !!bkAt(22, 12), bkOnHill(22, 12).length]')).toEqual([true, false, 1]);
    game("for (let y = 4; y <= 19; y++) for (const x of [6, 7, 8]) if (y <= 7 || y >= 16) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
    expect(plan('bruecke', { x: 7, y: 5 }, { x: 7, y: 17 })).toMatchObject({ n: 8, err: null });
    run();
    expect(game("[state.bruecken.get('7,8').ax, state.bruecken.get('7,8').n]")).toEqual([1, 8]);
    luecke(9); game("state.bruecken.delete('14,12'); groundVersion++; recalc()");
    const m1 = game('state.money'), n1 = game('state.bruecken.size');
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 24, y: 12 }).err).toMatch(/Höchstens 8 Felder Lücke/);
    run();
    expect([game('state.money'), game('state.bruecken.size')]).toEqual([m1, n1]);
    expect(game('BK_MAX <= BK_READ_MAX')).toBe(true);                                             // nie länger bauen, als jede Fassung liest
  });
  it('Spaziergänger über 8 Felder: Scheitel in der Mitte, stetig; Antippen trifft jedes Feld des hohen Bogens', () => {
    luecke(8);
    plan('bruecke', { x: 12, y: 12 }, { x: 23, y: 12 }); run();
    const H = game('HILL_H'), pk = game("brPeak('fuss', 8)"), f = game('FOOT_D');
    expect(game(`hwTopH(17.5 - ${f}, 12 + ${f}, 1)`)).toBeCloseTo(H + pk, 3);
    expect(pk).toBeGreaterThan(20);
    const jump = game(`(() => { let m = 0, p = hwTopH(12, 12, 1); for (let u = 12.02; u <= 24; u += 0.02) { const h = hwTopH(u, 12, 1); m = Math.max(m, Math.abs(h - p)); p = h; } return m; })()`);
    expect(jump).toBeLessThan(1);
    const miss = game(`(() => { cam.z = 2; const p0 = iso(17.5, 12); cam.x = p0.x; cam.y = p0.y; const out = [];
      for (let x = 14; x <= 21; x++) { const c = bkAt(x, 12), p = toScreen(x, 12);
        for (let du = -0.3; du <= 0.31; du += 0.15) for (const s of [-0.3, 0, 0.3]) {
          const h = bkH(c.b, c.i + du), sx = p.x + (du - s) * TW / 2 * cam.z, sy = p.y + (du + s) * TH / 2 * cam.z - h * cam.z, r = bkPick(sx, sy);
          if (!r || r.x !== x || r.y !== 12) out.push([x, du, s, r && r.x]); } }
      return out; })()`);
    expect(miss).toEqual([]);
  });
});

describe('Brücke wählen und ändern (160c C6)', () => {
  const lueckeVier = () => game("for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.set('21,' + y, { w: 0 }); } groundVersion++; recalc()");   // Lücke 14–17
  const wallet = () => game('({ money: state.money, ...state.res })');
  const spent = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]).filter(([, v]) => v));
  it('Leiste: Stein in Rot – Vorschau = Abbuchung (mit Gerüst-Brettern), gebaut mit brc und brp; Abriss gibt genau das zurück', () => {
    lueckeVier();
    game("state.restore = { ...(state.restore || {}), klippe: 1 }; state.paintNew.bruecke = { form: 2, col: 4 }");   // Stein, Farbe 4 = brc 3 (Rot)
    const i = plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 });
    expect(i).toEqual({ n: 4, cost: 480, err: null, mat: { quader: 12, bretter: 12 } });
    const w0 = wallet(); run();
    expect(spent(w0, wallet())).toEqual({ money: 480, quader: 12, bretter: 12 });
    expect(game("state.bruecken.get('14,12')")).toEqual({ ax: 0, n: 4, art: 'stein', brc: 3, brp: { money: 480, quader: 12, bretter: 12, k: 'a:stein' } });
    expect(() => game("bkDemolishInfo(15, 12); setTool('abriss'); hover = { x: 15, y: 12, deck: true }; render(1e6); setTool('look')")).not.toThrow();   // Abriss-Zeigen mit Stein (B3)
    const w1 = wallet(); game('bkDemolishAt(15, 12, true)');
    expect(spent(wallet(), w1)).toEqual({ money: 480, quader: 12, bretter: 12 });
  });
  it('Sperren: Stein erst mit der Klippe, Kristall erst mit der Kristallinsel, Metall erst mit der Eisenbahn – mit Grund', () => {
    game("state.restore = {}; state.techs.delete('bahn'); state.paintNew.bruecke = { form: 2 }");
    expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/^Stein: erst mit .*Klippe/);
    game("state.paintNew.bruecke = { form: 3 }"); expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/^Kristall: erst mit/);
    game("state.paintNew.bruecke = { form: 1 }"); expect(plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }).err).toMatch(/Metall: erst mit der Eisenbahn/);
  });
  it('Material wechseln: Bezahltes zurück, Neues bezahlt (je Rohstoff), Pfeiler/Stützen der neuen Art geprüft; Farbe kostenlos', () => {
    lueckeVier(); game("state.restore = { klippe: 1, kristall: 1 }");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();                               // Holz, 4 Felder
    const ref = "{ at: 'anhoehe', k: '14,12' }", w0 = wallet();
    expect(game(`brSet(${ref}, { mat: 'stein' })`)).toBe(true);
    expect(spent(w0, wallet())).toEqual({ money: 480 - 240, quader: 12 });                     // Holz 60 + 3 Bretter je Feld zurück, Stein 120 + 3 Quader + 3 Bretter bezahlt
    expect(game("[bkSupports(state.bruecken.get('14,12')), state.bruecken.get('14,12').brp.k]")).toEqual([[2], 'a:stein']);
    const g0 = game('groundVersion');
    expect(game(`brSet(${ref}, { col: 4 })`)).toBe(true); expect(game('groundVersion')).toBeGreaterThan(g0);
    expect(game(`brSet(${ref}, { col: null })`)).toBe(true); expect(game("'brc' in state.bruecken.get('14,12')")).toBe(false);
    expect(spent(w0, wallet())).toEqual({ money: 240, quader: 12 });                          // Farbe kostete nichts
    game(`brSet(${ref}, { mat: 'holz' })`);
    game("state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('16,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");   // Weg längs über Kante 2
    expect(game(`brSet(${ref}, { mat: 'stein' })`)).toBe(false);                              // Stein hätte dort einen Pfeiler
    expect(game("state.bruecken.get('14,12').art")).toBe('holz');
  });
  it('Stützen nur bei Holz-Fußgänger (keine/wenige/jede), Zacken nur bei Kristall: kaufen kostet je Feld, an/aus kostenlos, verfallen beim Materialwechsel', () => {
    lueckeVier(); game("state.restore = { kristall: 1 }");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    const ref = "{ at: 'anhoehe', k: '14,12' }";
    expect(game(`brSet(${ref}, { stuetzen: 'jede' })`)).toBe(true); expect(game("bkSupports(state.bruecken.get('14,12'))")).toEqual([1, 2, 3]);
    expect(game(`brSet(${ref}, { stuetzen: 'keine' })`)).toBe(true); expect(game("bkSupports(state.bruecken.get('14,12'))")).toEqual([]);
    expect(game(`brSet(${ref}, { zacken: 'kaufen' })`)).toBe(false);                          // Holz: keine Zacken
    game(`brSet(${ref}, { mat: 'kristall' })`);
    const w0 = wallet();
    expect(game(`brSet(${ref}, { zacken: 'kaufen' })`)).toBe(true);
    expect(spent(w0, wallet())).toEqual({ money: 4 * 150, kristall: 4 * 2 });
    const w1 = wallet();
    expect(game(`[brSet(${ref}, { zacken: 'aus' }), brSet(${ref}, { zacken: 'an' })]`)).toEqual([true, true]);
    expect(spent(w1, wallet())).toEqual({});
    expect(game("brLook(state.bruecken.get('14,12'), 'anhoehe').zacken")).toBe(true);
    const r = game("bkDemolishInfo(15, 12)"); expect(r.refund).toBe(game("state.bruecken.get('14,12').brp.money"));
    game(`brSet(${ref}, { mat: 'holz' })`); expect(game("'brz' in state.bruecken.get('14,12')")).toBe(false);   // verfallen
  });
  it('Fenster: Material, Farbe, Stützen; Deck-Wahl nur mit Weg; ↶ stellt Geld und Brücke wieder her', () => {
    lueckeVier(); game("state.restore = { klippe: 1 }; resetUndo()");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    game('openBkInfo(15, 12)');
    expect(game("document.querySelectorAll('[data-bkart]').length")).toBe(4);
    expect(game("document.querySelectorAll('[data-brc]').length")).toBe(11);
    expect(game("document.querySelectorAll('[data-bru]').length")).toBe(3);
    expect(game("document.querySelectorAll('[data-brb]').length")).toBe(0);
    expect(game("document.querySelector('[data-bkart=\"kristall\"]').classList.contains('locked')")).toBe(true);
    const before = game("JSON.stringify(state.bruecken.get('14,12'))"), m0 = game('state.money');
    game("document.querySelector('[data-bkart=\"stein\"]').click()");
    expect(game("state.bruecken.get('14,12').art")).toBe('stein');
    expect(game("document.querySelectorAll('[data-bru]').length")).toBe(0);                   // Stein: keine Stützen-Wahl
    game('undo()');
    expect([game("JSON.stringify(state.bruecken.get('14,12'))"), game('state.money')]).toEqual([before, m0]);
    plan('weg', { x: 13, y: 12 }, { x: 18, y: 12 }); run();
    game('openBkInfo(15, 12)'); expect(game("document.querySelectorAll('[data-brb]').length")).toBe(2);
    game("closePanel()");
  });
  it('alte Fassung (v1016) verwirft brp an Anhöhen-Brücken: das Aussehen bleibt, erstattet wird nie mehr als bezahlt', () => {
    lueckeVier(); game("state.restore = { klippe: 1 }; state.paintNew.bruecke = { form: 2, col: 4 }");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    const paid = game("state.bruecken.get('14,12').brp");
    game("delete state.bruecken.get('14,12').brp; groundVersion++");                       // so liest v1016 (k ist kein Rohstoff)
    expect(game("[brLook(state.bruecken.get('14,12'), 'anhoehe').mat, brLook(state.bruecken.get('14,12'), 'anhoehe').col]")).toEqual(['stein', 3]);
    const back = game("brPaid(state.bruecken.get('14,12'), 'anhoehe')");
    for (const [r, v] of Object.entries(back)) if (r !== 'k') expect(v).toBeLessThanOrEqual(paid[r] || 0);
  });
});

// 160c C7: Brückenlicht kaufen (je Feld 20 Taler + 1 Metall), an/aus kostenlos, bleibt beim Materialwechsel, Abriss erstattet samt Licht;
// Strom sofort (recalc); Fenster; alte Fassung v1016 (verwirft brp) erstattet nie mehr als bezahlt
describe('Brückenlicht kaufen (160c C7)', () => {
  const lueckeVier = () => game("for (let y = 10; y <= 14; y++) { state.hills.delete('17,' + y); state.hills.set('21,' + y, { w: 0 }); } groundVersion++; recalc()");   // Lücke 14–17
  const wallet = () => game('({ money: state.money, ...state.res })');
  const spent = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]).filter(([, v]) => v));
  const ref = "{ at: 'anhoehe', k: '14,12' }";
  it('kaufen kostet je Feld, an/aus kostenlos, zweimal kaufen nicht; Materialwechsel behält das Licht; Bilanz bis zum Abriss 0; ↶', () => {
    lueckeVier(); game("state.restore = { klippe: 1 }; resetUndo()");
    const w0 = wallet();
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();                               // Holz, 4 Felder
    expect(game(`brSet(${ref}, { licht: 'an' })`)).toBe(false);                               // erst kaufen
    const w1 = wallet(), g0 = game('groundVersion');
    expect(game(`undoable(() => brSet(${ref}, { licht: 'kaufen' }))`)).toBe(true);
    expect(spent(w1, wallet())).toEqual({ money: 80, metall: 4 });
    expect(game('groundVersion')).toBeGreaterThan(g0);
    expect(game("state.bruecken.get('14,12')")).toMatchObject({ brl: 'an', brp: { money: 320, bretter: 12, metall: 4, k: 'a:holz' } });
    game('undo()');
    expect(game("'brl' in state.bruecken.get('14,12')")).toBe(false); expect(spent(w1, wallet())).toEqual({});
    game(`brSet(${ref}, { licht: 'kaufen' })`);
    const w2 = wallet();
    expect(game(`[brSet(${ref}, { licht: 'aus' }), brSet(${ref}, { licht: 'aus' }), brSet(${ref}, { licht: 'an' }), brSet(${ref}, { licht: 'kaufen' })]`)).toEqual([true, false, true, false]);
    expect(spent(w2, wallet())).toEqual({});
    expect(game(`brSet(${ref}, { mat: 'stein' })`)).toBe(true);
    expect(game("brLook(state.bruecken.get('14,12'), 'anhoehe').licht")).toBe('an');
    expect(spent(w2, wallet())).toEqual({ money: 240, quader: 12 });                          // Licht hin und zurück: netto 0
    expect(game("bkDemolishInfo(15, 12).refund")).toBe(game("brPaid(state.bruecken.get('14,12'), 'anhoehe').money"));
    game('bkDemolishAt(15, 12, true)');
    expect(spent(w0, wallet())).toEqual({});
  });
  it('Strom: ohne Windrad ist das gekaufte Licht sofort dunkel, die Übersicht nennt die Brücke, nicht Laternen; aus = nicht dunkel', () => {
    lueckeVier(); game("state.restore = { klippe: 3 }");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    game(`brSet(${ref}, { licht: 'kaufen' })`);
    expect(game("[T.rail.power.city, T.rail.power.dark.has('B14,12'), T.rail.power.use.brlicht]")).toEqual([true, true, 1]);
    expect(game('bkTileArgs(bkAt(15, 12), 0, 0, 1).opts.dark')).toBe(true);
    const txt = game('powerStatus().join(" ")');
    expect(txt).toMatch(/Brückenlicht 1/); expect(txt).toMatch(/1 Brücke bleibt nachts dunkel/); expect(txt).not.toMatch(/Laterne bleibt|Laternen bleiben/);
    game(`brSet(${ref}, { licht: 'aus' })`);
    expect(game("[T.rail.power.dark.has('B14,12'), T.rail.power.use.brlicht || 0]")).toEqual([false, 0]);
  });
  it('Fenster: Licht kaufen, dann An/Aus; Hinweis ohne Strom; „Abreißen +“ = bezahlt samt Licht', () => {
    lueckeVier(); game("state.restore = { klippe: 3 }; resetUndo()");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    game('openBkInfo(15, 12)');
    expect(game("document.querySelectorAll('[data-brl]').length")).toBe(1);
    game("document.querySelector('[data-brl=\"kaufen\"]').click()");
    expect(game("state.bruecken.get('14,12').brl")).toBe('an');
    expect(game("[...document.querySelectorAll('[data-brl]')].map(e => e.dataset.brl)")).toEqual(['an', 'aus']);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Ohne Strom bleibt das Licht dunkel/);
    expect(game("document.getElementById('p-del').textContent")).toContain('+' + game("fmt(brPaid(state.bruecken.get('14,12'), 'anhoehe').money)"));
    game("document.querySelector('[data-brl=\"aus\"]').click()");
    expect(game("state.bruecken.get('14,12').brl")).toBe('aus');
    game('undo(); undo()');
    expect(game("'brl' in state.bruecken.get('14,12')")).toBe(false);
    game('closePanel()');
  });
  it('alte Fassung (v1016) verwirft brp: Licht bleibt sichtbar, an/aus kostenlos, erstattet wird nie mehr als bezahlt', () => {
    lueckeVier(); game("state.restore = { klippe: 1 }; state.paintNew.bruecke = { form: 2 }");
    plan('bruecke', { x: 12, y: 12 }, { x: 19, y: 12 }); run();
    game(`brSet(${ref}, { licht: 'kaufen' })`);
    const paid = game("state.bruecken.get('14,12').brp");
    game("delete state.bruecken.get('14,12').brp; groundVersion++");
    expect(game("brLook(state.bruecken.get('14,12'), 'anhoehe').licht")).toBe('an');
    const back = game("brPaid(state.bruecken.get('14,12'), 'anhoehe')");
    for (const [r, v] of Object.entries(back)) if (r !== 'k') expect(v).toBeLessThanOrEqual(paid[r] || 0);
    const w = wallet();
    expect(game(`brSet(${ref}, { licht: 'aus' })`)).toBe(true); expect(spent(w, wallet())).toEqual({});
    expect(game(`brSet(${ref}, { licht: 'kaufen' })`)).toBe(false);                          // schon gekauft
    game('bkDemolishAt(15, 12, true)');
    const got = spent(wallet(), w);
    for (const [r, v] of Object.entries(got)) expect(v).toBeLessThanOrEqual(paid[r] || 0);
  });
});

// 160c C5 gegengelesen: zwei Brücken nebeneinander über einem Gleis; Schatten am richtigen Stück; Kristall-Bahn ohne Glas-Leerlauf
describe('Zug unter Brücken gegengelesen (160c C5)', () => {
  it('zwei Brücken nebeneinander: Querlage je eigener Brücke (U statt F), Schnitt an beiden Stirnen; Schatten im selben Feld am U-Stück', () => {
    game("for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' }); state.bruecken.set('14,13', { ax: 0, n: 3, art: 'holz' }); groundVersion++; recalc()");
    const r = game("brCarPiecesUnder({ train: {}, px: 15, py: 12.4, du: 0, dv: 1, len: 0.8 }).map(p => [p.k, p.m.cut, p.m.bkCls || null, !!p.m.shadow])");
    expect(r.find(p => p[0] === '15,13')[2]).toBe('U');
    const r2 = game("brCarPiecesUnder({ train: {}, px: 15, py: 12.6, du: 0, dv: 1, len: 0.8 }).map(p => [p.k, p.m.cut, p.m.bkCls || null])");
    expect(r2.some(p => p[0] === '15,12' && p[2] === 'F')).toBe(true);                       // Schnitt an der Stirn der ersten Brücke (12,4)
    const sh = game("brCarPiecesUnder({ train: {}, px: 15, py: 12.3, du: 0, dv: -1, len: 1 }).filter(p => p.m.shadow).map(p => [p.k, p.m.bkCls || null])");
    expect(sh.length).toBe(1); expect(sh[0][1]).not.toBe('F');
    const one = game("brCarPiecesUnder({ train: {}, px: 15, py: 11.505 - 0.39, du: 0, dv: 1, len: 0.78 })");
    expect(one.filter(p => p.m.shadow).length).toBe(1);
  });
  it('Kristall-Bahnbrücke (B2) ist deckend: keine Glasfelder, kein Leerlauf in tileB', () => {
    game("(() => { const b = { ax: 0, n: 3, art: 'kristall', gleis: [0, 0, 0] }; b.brp = { ...brPrice({ mat: 'kristall' }, 'anhoehe', 3), k: brSig(b, 'anhoehe') }; state.bruecken.set('14,12', b); groundVersion++; recalc(); })()");
    expect(game("bkAt(15, 12).G.art")).toBe('kristall');
    expect(game('brLiveTiles()')).toEqual([]);
  });
});

// 160c C9: Weg oder Schiene oben von Anhöhe zu Anhöhe über eine Lücke gezogen baut die Brücke mit (Material/Farbe aus der Leiste des
// Brücken-Werkzeugs, Nutzer 12.10.2026: automatisch, ohne Wahl Holz, geht sie nicht: Lücke rot mit Grund) – ein Auftrag, ein ↶
describe('Brücke per Linie (160c C9)', () => {
  const planX = (tool, a, b, fixed = false) => game(`(() => { setTool('${tool}'); startPlan('line', ${JSON.stringify(a)}, ${JSON.stringify(b)}, ${fixed});
    const i = planInfo(plan); return { n: i.n, cost: i.cost, err: i.err, mat: i.mat, bad: i.bad, bkErr: i.bkErr || null, bk: i.bk || null,
      deck: i.deck ? [...i.deck].sort() : null, text: planText(plan, i) }; })()`);
  const wallet = () => game('({ money: state.money, ...state.res })');
  const spent = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]).filter(([, v]) => v));
  const st = () => game("currentStyle('weg')");
  const nordSued = () => game("for (const y of [4, 5, 6, 7, 11, 12, 13, 14]) for (let x = 23; x <= 25; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");   // Lücke y 8–10 bei x 23–25
  it('Weg oben von A nach B: Brücke + Deck + Wege oben, Summe im Schild; auch von B nach A und Nord-Süd', () => {
    const i = planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(i).toMatchObject({ n: 9, cost: 225, err: null, mat: { bretter: 9 }, bk: [{ mat: 'holz', n: 3 }], bkErr: null, deck: ['14,12', '15,12', '16,12'] });
    expect(i.text).toMatch(/🌉 Brücke: Holz · 3 Felder/);   // 160c G1: ein Format wie übers Wasser
    expect(run()).toBe(true);
    expect(game("state.bruecken.get('14,12')")).toEqual({ ax: 0, n: 3, art: 'holz', weg: [st(), st(), st()], brp: { money: 180, bretter: 9, k: 'a:holz' } });
    expect(game("[state.tiles.has('15,12'), bAt(11, 12), bAt(19, 12), bkWegFull(state.bruecken.get('14,12'))]")).toEqual([false, 'weg', 'weg', true]);
    expect(planX('weg', { x: 19, y: 11 }, { x: 11, y: 11 })).toMatchObject({ cost: 225, bk: [{ mat: 'holz', n: 3 }] });
    run();
    expect(game("[state.bruecken.get('14,11').n, state.bruecken.get('14,11').ax]")).toEqual([3, 0]);
    nordSued();
    expect(planX('weg', { x: 24, y: 5 }, { x: 24, y: 13 })).toMatchObject({ cost: 225, bk: [{ mat: 'holz', n: 3 }], deck: ['24,10', '24,8', '24,9'] });
    run();
    expect(game("[state.bruecken.get('24,8').ax, state.bruecken.get('24,8').n, bkWegFull(state.bruecken.get('24,8'))]")).toEqual([1, 3, true]);
  });
  it('unten begonnen, in der Lücke geendet oder quer: keine Brücke, Weg unten wie heute', () => {
    expect(planX('weg', { x: 14, y: 12 }, { x: 19, y: 12 }).bk).toBe(null);
    run();
    expect(game("[state.bruecken.size, bAt(15, 12)]")).toEqual([0, 'weg']);
    expect(planX('weg', { x: 12, y: 10 }, { x: 15, y: 10 })).toMatchObject({ bk: null, bkErr: null });
    expect(planX('weg', { x: 15, y: 6 }, { x: 15, y: 18 })).toMatchObject({ bk: null, bkErr: null });
  });
  it('zu wenig Taler oder Bretter: nichts gebaut; ↶ nimmt Brücke, Deck und Wege in einem Schritt zurück', () => {
    game('state.money = 224');
    expect(planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 }).err).toMatch(/Zu wenig Taler \(225 nötig\)/);
    expect(run()).toBe(false);
    game('state.money = 1e6; state.res.bretter = 8');
    expect(planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 }).err).toBe(game('matError({ bretter: 9 })'));
    game('state.res.bretter = 9999; resetUndo()');
    const w0 = wallet();
    planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(game('undoable(runPlan)')).toBe(true);
    expect(game('[state.bruecken.size, undoStack.length]')).toEqual([1, 1]);
    game('undo()');
    expect(game("[state.bruecken.size, bAt(11, 12), bAt(19, 12)]")).toEqual([0, null, null]);
    expect(spent(w0, wallet())).toEqual({});
  });
  it('Schiene: flache Bahnbrücke mit Böcken, Gleis auf dem Deck, verbunden; auch Nord-Süd', () => {
    game("state.techs.add('bahn'); recalc()");
    expect(planX('schiene', { x: 11, y: 12 }, { x: 19, y: 12 })).toMatchObject({ cost: 315, err: null, mat: { holz: 9, metall: 9, bretter: 9 }, bk: [{ mat: 'holz', n: 3 }] });
    run();
    expect(game("(() => { setTool('schiene'); startPlan('line', { x: 11, y: 10 }, { x: 19, y: 10 }, false); const G = planInfo(plan).bkGhost; plan = null; return [bkRailArms(G.get('14,10')).length, bkRailArms(G.get('16,10')).length]; })()")).toEqual([2, 2]);   // Geist: kein Prellbock an den Enden
    expect(game("[state.bruecken.get('14,12').gleis, bkFam(state.bruecken.get('14,12')), bkSupports(state.bruecken.get('14,12')), bkRailJumps(13, 12)]")).toEqual([[0, 0, 0], 'bahn', [1, 2], [[17, 12]]]);
    game("state.tiles.set('13,10', { b: 'haus', lvl: 1 }); groundVersion++; recalc()");             // Endfeld oben rot: dort kein Anschluss im Geist (wie gebaut)
    expect(game("(() => { setTool('schiene'); startPlan('line', { x: 11, y: 10 }, { x: 19, y: 10 }, false); const G = planInfo(plan).bkGhost; plan = null; return [bkRailArms(G.get('14,10')).length, bkRailArms(G.get('16,10')).length]; })()")).toEqual([1, 2]);
    nordSued();
    expect(planX('schiene', { x: 24, y: 5 }, { x: 24, y: 13 })).toMatchObject({ bk: [{ mat: 'holz', n: 3 }], bkErr: null });
    run();
    expect(game("[state.bruecken.get('24,8').ax, bkRailFull(state.bruecken.get('24,8'))]")).toEqual([1, true]);
  });
  it('geht die Brücke nicht: Lücke rot mit Grund im Schild, der Rest wird gebaut (Bahn-Böcke, Material gesperrt, Haus, Wald)', () => {
    luecke(4); game("state.techs.add('bahn'); state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('16,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");   // Weg unten längs über Kante 2
    const w = planX('weg', { x: 11, y: 12 }, { x: 20, y: 12 });
    expect(w).toMatchObject({ bk: [{ mat: 'holz', n: 4 }], bkErr: null });
    expect(w.cost).toBe(240 + 5 * w.n);
    const s = planX('schiene', { x: 11, y: 12 }, { x: 20, y: 12 });
    expect(s.bk).toBe(null); expect(s.bkErr).toMatch(/mehr Stützen/); expect(s.text).toMatch(/mehr Stützen/); expect(s.bad).toBe(4);
    expect(run()).toBe(true);                                                                     // die Schienen oben werden gebaut
    expect(game("[state.bruecken.size, bAt(12, 12), bAt(19, 12)]")).toEqual([0, 'schiene', 'schiene']);
    luecke(3); game("for (const k of ['15,12', '16,12', '11,12', '12,12', '13,12', '17,12', '18,12', '19,12', '20,12']) state.tiles.delete(k); groundVersion++; recalc()");
    game("state.paintNew.bruecke = { form: 2, col: 4 }; state.restore = {}");
    const r = planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(r.bkErr).toMatch(/^Stein: erst mit/); expect(r.bad).toBe(3);
    game("state.restore = { klippe: 1 }");                                                         // ohne recalc: der Schlüssel kennt die Sperre
    expect(planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 })).toMatchObject({ cost: 405, mat: { quader: 9, bretter: 9 }, bk: [{ mat: 'stein', n: 3 }], bkErr: null });
    run();
    expect(game("state.bruecken.get('14,12')")).toMatchObject({ art: 'stein', brc: 3, brp: { k: 'a:stein' } });
    game("state.paintNew.bruecke = { form: 1 }; state.techs.delete('bahn'); recalc()");
    expect(planX('weg', { x: 11, y: 10 }, { x: 19, y: 10 }).bkErr).toMatch(/Metall: erst mit der Eisenbahn/);
    game("state.paintNew.bruecke = {}; state.tiles.set('15,10', { b: 'haus', lvl: 1 }); groundVersion++; recalc()");
    expect(planX('weg', { x: 11, y: 10 }, { x: 19, y: 10 }).bkErr).toMatch(/kein Platz für: Haus/);
    game("state.tiles.delete('15,10'); state.terra.set('15,10', 'forest'); groundVersion++; recalc()");
    expect(planX('weg', { x: 11, y: 10 }, { x: 19, y: 10 }).bkErr).toMatch(/erst roden/);
    game("for (const x of [11, 12, 13, 17, 18, 19]) build('weg', x, 10, true); recalc()");          // oben schon alles da: nur die Lücke – Grund trotzdem im Schild
    const z0 = planX('weg', { x: 11, y: 10 }, { x: 19, y: 10 });
    expect(z0.n).toBe(0); expect(z0.text).toMatch(/erst roden/);
  });
  it('still unten wie heute: Lücke länger als 8; Brücke liegt schon: nur das Deck', () => {
    luecke(9);
    expect(planX('weg', { x: 12, y: 12 }, { x: 24, y: 12 })).toMatchObject({ bk: null, bkErr: null, err: null });
    run();
    expect(game("[state.bruecken.size, bAt(18, 12)]")).toEqual([0, 'weg']);
    luecke(8);
    expect(planX('weg', { x: 12, y: 11 }, { x: 23, y: 11 })).toMatchObject({ bk: [{ mat: 'holz', n: 8 }], bkErr: null });
    luecke(3); game("for (let x = 11; x <= 24; x++) for (const y of [11, 12]) state.tiles.delete(x + ',' + y); state.bruecken.clear(); groundVersion++; recalc()");
    plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("state.paintNew.bruecke = { form: 1 }");
    expect(planX('weg', { x: 11, y: 12 }, { x: 19, y: 12 })).toMatchObject({ bk: null, cost: 45, deck: ['14,12', '15,12', '16,12'] });
    const b0 = game("JSON.stringify(state.bruecken.get('14,12'))");
    run();
    expect(game("[state.bruecken.get('14,12').art, state.bruecken.get('14,12').brp]")).toEqual(JSON.parse(`[${JSON.stringify(JSON.parse(b0).art)}, ${JSON.stringify(JSON.parse(b0).brp)}]`));
  });
  it('Vorschau: Geist der Brücke in einem Stück (einmal je Bild, auch wenn das letzte Feld nicht im Bild liegt: erstes Feld bei x ≈ 1000), ohne Bau; Antippen auf den Geist baut', () => {
    const r = game(`(() => { const out = [], gd = bkDrawGhost; bkDrawGhost = (c, ...a) => { out.push(c.k + ':' + c.i); return gd(c, ...a); };
      setTool('weg'); startPlan('line', { x: 11, y: 12 }, { x: 19, y: 12 }, false); const gv = groundVersion;
      try { cam.z = 2; const p = iso(15, 12); cam.x = p.x; cam.y = p.y - HILL_H; render(1e6); cam.z = 5; const q = iso(14, 12); cam.x = q.x - 97.6; cam.y = q.y - HILL_H; render(1e6 + 16); } finally { bkDrawGhost = gd; }
      return [out, state.bruecken.size, groundVersion === gv]; })()`);
    expect(r).toEqual([['14,12:2', '14,12:2'], 0, true]);
    const t = game(`(() => { setTool('weg'); startPlan('line', { x: 11, y: 12 }, { x: 19, y: 12 }, true); cam.z = 2; const p0 = iso(15, 12); cam.x = p0.x; cam.y = p0.y;
      const p = toScreen(15, 12), h = HILL_H + brPeak('fuss', 3); return bkPick(p.x, p.y - h * cam.z); })()`);
    expect(t).toMatchObject({ x: 15, y: 12, deck: true });
    game('planTap(15, 12, true, true)');
    expect(game("[state.bruecken.size, plan]")).toEqual([1, null]);
  });
});

// 160c G1 (karte-querschnitt.md:174/192): Brücken zwischen Anhöhen ziehen beim Verschieben und Kopieren nie mit – die Hinweise nennen sie
describe('Verschieben und Kopieren: die Brücke zwischen Anhöhen bleibt stehen (160c G1)', () => {
  const toasts = js => game(`(() => { const out = [], t0 = toast; toast = m => out.push(m); try { ${js}; } finally { toast = t0; } return out; })()`);
  beforeEach(() => { plan('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 }); run(); game('plan = null; setTool("look")'); });
  it('nur die Brücke im Rechteck: „bleibt stehen“ nennt sie, nichts wird angehoben', () => {
    const t = toasts('pickUpGroup(14, 12, 16, 12)');
    expect(t.join(' ')).toMatch(/bleibt stehen.*Brücke zwischen Anhöhen/);
    expect(game('!!moving')).toBe(false);
  });
  it('mit Dingen darunter: sie ziehen mit, die Brücke bleibt – „(manches bleibt stehen)“', () => {
    game("state.tiles.set('14,13', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('15,13', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    const t = toasts('pickUpGroup(14, 12, 16, 13)');
    expect(t.join(' ')).toContain('(manches bleibt stehen)');
    expect(game("state.bruecken.has('14,12')")).toBe(true);
    game('cancelMove()');
  });
  it('Auswahl-Vorschau: die Brückenfelder rot (was darunter mitzieht bleibt grün), der Text sagt es', () => {
    game("state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");
    const r = game(`(() => { plan = { kind: 'rect', tool: 'verschieben', a: { x: 14, y: 12 }, b: { x: 16, y: 12 }, fixed: true }; const i = planInfo(plan);
      const out = [i.states.get('14,12'), i.states.get('15,12'), i.states.get('16,12'), planText(plan, i)]; plan = null; return out; })()`);
    expect(r.slice(0, 3)).toEqual(['bad', 'ok', 'bad']);
    expect(r[3]).toContain('bleibt stehen');
    const nurGrün = game(`(() => { state.tiles.set('14,12', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('16,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc();
      plan = { kind: 'rect', tool: 'verschieben', a: { x: 14, y: 12 }, b: { x: 16, y: 12 }, fixed: true }; const i = planInfo(plan), t = planText(plan, i); plan = null; return [i.bad, t]; })()`);
    expect(nurGrün[0]).toBe(0);
    expect(nurGrün[1]).toContain('Brücke bleibt stehen');                  // alles darunter zieht mit: kein Rot, aber der Hinweis
  });
  it('Auswahl-Vorschau: Parkrasen unter der Brücke zieht mit – grün, nicht rot (Gegenlesen G1)', () => {
    game("state.terra.set('15,12', 'park'); sandCache.clear(); landCache.clear(); groundVersion++; recalc()");
    const r = game(`(() => { plan = { kind: 'rect', tool: 'verschieben', a: { x: 14, y: 12 }, b: { x: 16, y: 12 }, fixed: true }; const i = planInfo(plan);
      const out = [i.states.get('14,12'), i.states.get('15,12'), i.states.get('16,12')]; plan = null; return out; })()`);
    expect(r).toEqual(['bad', 'ok', 'bad']);
  });
  it('Kopieren: die Brücke zählt als „bleibt draußen“, der Knopf sagt es', () => {
    game("state.tiles.set('14,13', { b: 'weg', lvl: 1, style: 'sand' }); state.decos.set('15,13', [{ b: 'bank', rot: 0 }, null, null, null]); groundVersion++; recalc()");   // ein Weg und eine Bank (nur Wege: Pipette)
    expect(game('copyCollect(14, 12, 16, 13).stays')).toBe(1);
    const t = toasts('startCopy(14, 12, 16, 13)');
    expect(t.join(' ')).toContain('(manches bleibt draußen)');
    game('cancelMove()');
    game(`plan = { kind: 'rect', tool: 'verschieben', a: { x: 14, y: 12 }, b: { x: 16, y: 13 }, fixed: true }; syncSelBar()`);
    expect(document.getElementById('sel-copy').title).toContain('Brücken zwischen Anhöhen');
    game('plan = null; syncSelBar()');
  });
});
