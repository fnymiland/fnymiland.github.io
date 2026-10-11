const { loadGame, game } = require('./helpers/load-game');

// Gleis über die Brücke (Block 160b, bruecken.js; Nutzer: „man sollte über diese Brücke auch Schienen legen dürfen“): Weg ODER Gleis je Brücke,
// am Holzsteg mit Gleis ein Bock unter jedem Feld; das Netz verbindet die beiden Anhöhen-Endfelder direkt (bkRailJumps), der Zug fährt oben
// auf Höhe der Anhöhen gerade übers Deck (route.deck), gezeichnet in Stücken je Feld (bkCarPieces). Unten darf weiter ein Gleis durch
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999; state.paintNew.schiene = {}; state.paintNew.bruecke = {}");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.bruecken.clear(); hillWalkers.length = 0; walkers.length = 0; trains.length = 0; recalc(); resetUndo()");
  // zwei Anhöhen gegenüber: A x 10–13, B x 17–20 (y 10–14), dazwischen 3 Felder Lücke (x 14–16)
  game("for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));
const plan = (tool, a, b) => game(`(() => { setTool('${tool}'); startPlan('line', ${JSON.stringify(a)}, ${JSON.stringify(b)}, false); const i = planInfo(plan); return { n: i.n, cost: i.cost, err: i.err, mat: i.mat }; })()`);
const run = () => game('runPlan()');
const bridge = (art = 0, y = 12) => { game(`state.paintNew.bruecke = { form: ${art} }`); plan('bruecke', { x: 12, y }, { x: 18, y }); expect(run()).toBe(true); };
const arms = (x, y) => game(`railArms(${x}, ${y}).map(a => a.join()).sort()`);
// Linie zwischen zwei Bahnhöfen oben auf A und B (Strom: Windräder; zwei Gegenden, damit sie zuerst Strom bekommt)
const line = () => {
  game("state.tiles.set('11,11', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('19,11', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
  game("for (let i = 0; i < 5; i++) state.tiles.set('24,' + (16 + 2 * i), { b: 'windrad', lvl: 1 })");
  game("globalThis.__ra = regionAt; regionAt = (x, y) => x >= 15 ? 'wald' : 'home'; recalc(); syncMovers()");
};

describe('Gleis aufs Deck', () => {
  it('von Anhöhe zu Anhöhe gezogen: die Lücke kommt aufs Deck (je Feld bezahlt, Holz und Metall), Arme über die Kante, ein Netz', () => {
    bridge();
    expect(game("T.rail.comp.get('11,12')")).toBe(undefined);
    const i = plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 });
    expect(i.err).toBe(null);
    expect(i.n).toBe(9);
    expect(i.mat).toEqual({ holz: 9, metall: 9 });
    run();
    expect(game("[state.bruecken.get('14,12').gleis, ['14,12', '15,12', '16,12'].some(k => state.tiles.has(k)), bAt(13, 12), bAt(17, 12)]")).toEqual([[0, 0, 0], false, 'schiene', 'schiene']);
    expect([arms(13, 12), arms(17, 12)]).toEqual([['-1,0', '1,0'], ['-1,0', '1,0']]);   // kein Prellbock an der Kante
    expect(game("bkRailArms(bkAt(14, 12)).map(a => a.join()).sort()")).toEqual(['-1,0', '1,0']);
    expect(game("T.rail.comp.get('11,12') === T.rail.comp.get('19,12')")).toBe(true);
    expect(game("railPath('11,12', '19,12')")).toEqual(['11,12', '12,12', '13,12', '17,12', '18,12', '19,12']);
    expect(game("bkRailJumps(13, 12)")).toEqual([[17, 12]]);
    // eine Lücke im Gleis: kein Netz hinüber
    game("state.bruecken.get('14,12').gleis[1] = null; groundVersion++; recalc()");
    expect(game("[T.rail.comp.get('11,12') === T.rail.comp.get('19,12'), bkRailJumps(13, 12).length]")).toEqual([false, 0]);
  });
  it('Weg oder Gleis, nicht beides; Holzsteg mit Gleis: Bock unter jedem Feld (nichts darunter), Stahl spannt frei', () => {
    bridge();
    game("setTool('weg'); startPlan('line', { x: 14, y: 12, deck: true }, { x: 16, y: 12 }, false); runPlan()");   // Weg nur aufs Deck
    expect(game("bkWegAny(state.bruecken.get('14,12'))")).toBe(true);
    expect(game("bkRailCheck(15, 12).err")).toMatch(/Weg oder Gleis/);
    game("bkDemolishAt(15, 12)");                                                           // Weg runter
    game("state.tiles.set('15,12', { b: 'weg', lvl: 1, style: 'sand' }); groundVersion++; recalc()");   // unten quer ein Weg (Holz, 3 Felder: in der Mitte kein Bock)
    expect(game("bkRailCheck(15, 12).err")).toMatch(/unter jedem Feld einen Bock/);
    game("state.tiles.delete('15,12'); groundVersion++; recalc()");
    plan('schiene', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    expect(game("bkRailAny(state.bruecken.get('14,12'))")).toBe(true);
    expect(game("bkWegCheck(15, 12).err")).toMatch(/Weg oder Gleis/);
    expect(game("[placeError('weg', 15, 12), placeError('schiene', 15, 12)]").every(e => /Holzbock/.test(e))).toBe(true);
    expect(game("bkUnderError(15, 12, bkBockOf(state.bruecken.get('14,12'), 1))")).toBe(null);   // frei: geht
    game("bkSetArt('14,12', 'stahl')");
    expect(game("[placeError('weg', 15, 12), placeError('schiene', 15, 12)]")).toEqual([null, null]);
    game("build('schiene', 15, 12, true); recalc()");                                         // unten quer ein Gleis
    expect(game("bkSetArt('14,12', 'holz')")).toBe(false);                                   // Holz käme mit Bock auf das Gleis
    expect(game("state.bruecken.get('14,12').art")).toBe('stahl');
    // das Gleis unten bleibt ein eigenes Netz: hängt weder am Deck noch an den Anhöhen
    expect(game("T.rail.comp.get('15,12') !== T.rail.comp.get('13,12')")).toBe(true);
  });
  it('Gleis-Stil auf dem Deck umstellen: kostenlos; auf dem Deck angefangen: oben; Vorschau', () => {
    bridge();
    plan('schiene', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("state.paintNew.schiene = { form: 1 }");
    expect(plan('schiene', { x: 14, y: 12 }, { x: 16, y: 12 })).toMatchObject({ n: 0 });  // unten angefangen: am Boden – dort stehen die Böcke
    game("setTool('schiene'); startPlan('line', { x: 14, y: 12, deck: true }, { x: 16, y: 12 }, false)");
    expect(game("[plan.deck, planInfo(plan).cost, [...planInfo(plan).deck].sort()]")).toEqual([true, 0, ['14,12', '15,12', '16,12']]);
    run();
    expect(game("[state.bruecken.get('14,12').gleis, ['14,12', '15,12', '16,12'].some(k => state.tiles.has(k))]")).toEqual([[1, 1, 1], false]);
    game("setTool('schiene'); hover = { x: 15, y: 12, deck: true }; previewCache = null");
    expect(() => game('render(1e6)')).not.toThrow();
  });
  it('Abreißen: erst das Gleis (Taler und Holz/Metall zurück), dann die Brücke; ↶; ↶ bringt das Gleis nicht über einen neuen Weg am Holzbock', () => {
    bridge();
    plan('schiene', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const m0 = game('state.money'), h0 = game('state.res.holz'), s = game('ITEMS.schiene.cost');
    expect(game('bkDemolishInfo(15, 12)')).toMatchObject({ gleis: true, refund: 3 * s, label: 'Gleis auf der Brücke entfernen' });
    game('resetUndo(); undoable(() => bkDemolishAt(15, 12))');
    expect([game("!!state.bruecken.get('14,12')"), game("!!state.bruecken.get('14,12').gleis"), game('state.money'), game('state.res.holz')]).toEqual([true, false, m0 + 3 * s, h0 + 3]);
    expect(arms(13, 12)).toEqual(['-1,0']);                                                  // Prellbock an der Kante
    game('undo()');
    expect(game("state.bruecken.get('14,12').gleis")).toEqual([0, 0, 0]);
    game('resetUndo(); undoable(() => bkDemolishAt(15, 12))');
    game("undoable(() => build('weg', 15, 12, true))");                                     // unten quer ein Weg (ohne Gleis: kein Bock in der Mitte)
    expect(game('bAt(15, 12)')).toBe('weg');
    game("undoStack.splice(undoStack.length - 1, 1)");                                         // nur den Gleis-Abriss zurücknehmen wollen
    expect(game('undo()')).toBe(false);
    expect(game("!!state.bruecken.get('14,12').gleis")).toBe(false);
    // Rechteck-Abriss: die ganze Brücke samt Gleis, voll zurück
    game("state.tiles.delete('15,12'); groundVersion++; recalc()");
    plan('schiene', { x: 13, y: 12 }, { x: 17, y: 12 }); run();
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 14, y: 11 }, b: { x: 16, y: 13 }, fixed: true }");
    expect(game('planInfo(plan).gain')).toBe(180 + 3 * s);
    game('runPlan()');
    expect(game('state.bruecken.size')).toBe(0);
  });
  it('Speichern und Laden behalten das Gleis; streng gelesen (Weg ODER Gleis, gültige Formen)', () => {
    bridge();
    plan('schiene', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    const before = game("JSON.stringify([...state.bruecken])");
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
    expect(game("JSON.stringify([...state.bruecken])")).toBe(before);
    expect(game("T.rail.comp.get('12,12') === T.rail.comp.get('18,12')")).toBe(true);
    const bad = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.bruecken = [['2,2', { ax: 1, n: 2, art: 'holz', gleis: [1, 99] }], ['3,3', { ax: 0, n: 2, weg: ['sand', null], gleis: [0, 0] }]]; const m = parseSave(d).bruecken; return [m.get('2,2'), m.get('3,3')]; })()");
    expect(bad).toEqual([{ ax: 1, n: 2, art: 'holz', gleis: [1, null] }, { ax: 0, n: 2, art: 'holz', weg: ['sand', null] }]);
  });
});

describe('Zug über die Brücke', () => {
  it('die Linie fährt hinüber: Strecke gerade übers Deck (route.deck), Wagen oben auf Höhe der Anhöhen, Schranke darunter bleibt offen', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    line();
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('trains.length')).toBe(1);
    expect(game('trains[0].route.deck')).toEqual([[2.5, 5.5]]);                            // 11 … 13 | Lücke 14–16 | 17 … 19
    let over = 0, xs = [];
    for (let i = 0; i < 300; i++) {
      game('stepMovers(0.1)');
      const cs = game("trainCars().map(c => { trainOnHills(c, Math.round(c.px) + ',' + Math.round(c.py)); return [c.px, !!c.deck, c.hill && c.hill.ha, c.hill && c.hill.hb]; })");
      for (const [x, deck, ha, hb] of cs) {
        xs.push(x);
        if (x > 13.6 && x < 16.4) { expect(deck).toBe(true); over++; }
        if (deck) expect([ha, hb]).toEqual([game('HILL_H'), game('HILL_H')]);
      }
    }
    expect(over).toBeGreaterThan(10);
    expect(Math.min(...xs)).toBeLessThan(13);
    expect(Math.max(...xs)).toBeGreaterThan(17);
    // ein Bahnübergang darunter: der Zug oben schließt die Schranke nicht
    game("trains[0].c = 4; trains[0].wait = 99");
    expect(game("trainCars().some(c => c.deck)")).toBe(true);
    expect(game('crossingClosed(15, 12)')).toBe(false);
  });
  it('Stücke je Feld: übers Deck nach dem Deck gezeichnet (vor dem vorderen Geländer), auf der Anhöhe mit ihrem Feld; Zeichnen ohne Fehler, auch Stahl', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    line();
    game("trains[0].c = 2.6; trains[0].wait = 99");                                         // erster Wagen halb auf A, halb überm Deck
    const ps = game("(() => { const m = trainCars().filter(c => c.deck).find(c => bkCarPieces(c).length > 1); return bkCarPieces(m).map(p => [p.k, p.deck, p.m.cut ? p.m.cut[1] - p.m.cut[0] : 0, p.m.hill.base]); })()");
    expect(ps.length).toBeGreaterThan(1);
    expect(ps.some(p => p[1] && p[0] === '14,12')).toBe(true);
    expect(ps.some(p => !p[1] && p[0] === '13,12' && p[3] === game('HILL_H'))).toBe(true);
    expect(ps.reduce((s, p) => s + p[2], 0)).toBeCloseTo(0.78, 1);                           // die Stücke ergeben den ganzen Wagen
    // gezeichnet: je Stück einmal, über dem Deck nach seiner Oberseite (im Rückruf des Decks)
    const drawn = game(`(() => { const f = drawTrainCarBody, bt = bkDrawTile, out = []; let inDeck = false;
      bkDrawTile = (...a) => { const after = a[5]; return bt(a[0], a[1], a[2], a[3], a[4], after ? H => { inDeck = true; try { after(H); } finally { inDeck = false; } } : null); };
      drawTrainCarBody = (c, ...r) => { out.push([!!c.cut, inDeck, c.hill && c.hill.ha]); return f(c, ...r); };
      try { cam.z = 2; const p = iso(15, 12); cam.x = p.x; cam.y = p.y - HILL_H; render(1e6); } finally { drawTrainCarBody = f; bkDrawTile = bt; }
      return out; })()`);
    expect(drawn.some(d => d[0] && d[1] && d[2] === game('HILL_H'))).toBe(true);
    expect(drawn.some(d => d[0] && !d[1])).toBe(true);                                       // das Stück auf der Anhöhe
    game("trains[0].c = 4"); expect(() => game('render(1e6 + 17)')).not.toThrow();
    game("bkSetArt('14,12', 'stahl')"); expect(() => game('render(1e6 + 34)')).not.toThrow();
  });
  it('Rundkurs über zwei Brücken: Ring mit Sprüngen, Strecke geschlossen mit zwei Deck-Stücken', () => {
    bridge(0, 11); bridge(0, 13);
    plan('schiene', { x: 13, y: 11 }, { x: 17, y: 11 }); run();
    plan('schiene', { x: 13, y: 13 }, { x: 17, y: 13 }); run();
    game("build('schiene', 13, 12, true); build('schiene', 17, 12, true); recalc()");
    const net = game("T.rail.comp.get('13,11')");
    expect(game("['17,11', '17,12', '17,13', '13,13', '13,12'].every(k => T.rail.comp.get(k) === " + net + ")")).toBe(true);
    expect(game("(railLoop(['13,11', '17,11', '17,12', '17,13', '13,13', '13,12'], null, trackLink) || []).length")).toBe(6);
    game("state.tiles.set('12,12', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('18,12', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
    game("for (let i = 0; i < 5; i++) state.tiles.set('24,' + (16 + 2 * i), { b: 'windrad', lvl: 1 })");
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x >= 15 ? 'wald' : 'home'; recalc(); syncMovers()");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('!!T.rail.lines[0].loop')).toBe(true);
    expect(game('trains[0].route.deck.length')).toBe(2);
    expect(game('trains[0].route.deck.every(([a, b]) => Math.abs(b - a - 3) < 0.01)')).toBe(true);
    for (let i = 0; i < 200; i++) game('stepMovers(0.1)');
    expect(() => game('render(1e6)')).not.toThrow();
  });
});

describe('Gegengelesen (160b)', () => {
  it('Schranke auf dem Endfeld schließt auch für einen Wagen, der schon übers Deck reicht; Übergang unter der Brücke nicht', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    line();
    game("trains[0].c = 2.78; trains[0].wait = 99");                                        // beide Wagen reichen übers Deck, der hintere (Mitte 13,36) steht noch über 13,12
    expect(game("trainCars().map(c => [!!c.deck, +c.px.toFixed(2)])")).toEqual([[true, 14.2], [true, 13.36]]);
    expect(game('crossingClosed(13, 12)')).toBe(true);
    game("trains[0].c = 4");
    expect(game('crossingClosed(15, 12)')).toBe(false);
  });
  it('Wagen knapp über der Kante: Stücke gefunden; ohne Stücke mit dem Feld der Anhöhe nicht doppelt angehoben', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    line();
    game("trains[0].c = 2.62; trains[0].wait = 99");                                        // hinterer Wagen: Mitte 13,2, Ende knapp über der Kante 13,5
    const r = game("(() => { const m = trainCars().find(c => c.deck && c.px < 13.3); return [!!m, m && bkCarPieces(m).length, m && (trainOnHills(m, '13,12'), m.hill.base)]; })()");
    expect(r).toEqual([true, 2, game('HILL_H')]);
  });
  it('Gleise umstellen (ganze Strecke): über die Brücke hinweg samt Deck; Streckenlänge zählt die Brücke mit', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    expect(game("railNetwork(11, 12).map(p => p.join()).sort()")).toEqual(['11,12', '12,12', '13,12', '17,12', '18,12', '19,12']);
    expect(game("restyleRails(railScope(11, 12, 'run'), 1)")).toBe(9);
    expect(game("[state.bruecken.get('14,12').gleis, objAt(19, 12).form]")).toEqual([[1, 1, 1], 1]);
    line();
    expect(game('T.rail.lines[0].tiles')).toBe(9);
    expect(game("ACHIEVEMENTS.find(a => a.id === 'bahn').value()")).toBeCloseTo(0.9, 5);
  });
  it('Zug oben angetippt: die Brücke, nicht was darunter liegt', () => {
    bridge();
    plan('schiene', { x: 11, y: 12 }, { x: 19, y: 12 }); run();
    line();
    game("trains[0].c = 4; trains[0].wait = 99; setTool('look'); cam.z = 2");
    const hit = game("(() => { const m = trainCars().find(c => c.deck && Math.abs(c.px - 15) < 0.5) || trainCars().find(c => c.deck); const p = toScreen(m.px, m.py); return trainAt(p.x, p.y - (HILL_H + m.train.kind.h * 0.7) * cam.z); })()");
    expect(hit && [hit.deck, bkAt(hit.x, hit.y) ? true : false]).toEqual([true, true]);
  });
  it('↶ an der Brücke: der Zwischenspeicher kennt danach das zurückgeholte Objekt; stehende Brücke prüft nur neue Böcke', () => {
    game("state.paintNew.bruecke = { form: 1 }");
    bridge(1);
    plan('weg', { x: 12, y: 12 }, { x: 18, y: 12 }); run();
    game("state.tiles.set('15,12', { b: 'fz_bahn', lvl: 1 }); groundVersion++; recalc()");  // so stand es in alten Ständen schon darunter
    expect(game("bkPlaceError('fz_bahn', [[15, 12]])")).toMatch(/nur Platz für Flaches/);
    game('resetUndo(); undoable(() => bkDemolishAt(15, 12))');
    expect(game('undo()')).toBe(true);
    expect(game("bkAt(15, 12).b === state.bruecken.get('14,12') && bkWegAt(bkAt(15, 12))")).toBe(true);
  });
});
