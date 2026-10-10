const { loadGame, game } = require('./helpers/load-game');

// Gleise auf Anhöhen (Nutzer 10.10.2026): Schienen dürfen oben liegen, hängen aber nie über die Kante zusammen – nur über die Gleis-Rampe
// (levelLink 'gleis'; trackAt/trackLink/railArms/railNetwork/computeRail). Netz, Linie, Zug, Bauen/Abreißen/↶/Verschieben/Kopieren/Gruppe
// drehen der Rampe, Wegenetz ohne Rampe. Ohne Anhöhen alles wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; recalc(); resetUndo()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } if (moving) cancelMove(); recalc()'));
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const col = (x, y0, y1) => block(x, Math.min(y0, y1), x, Math.max(y0, y1));
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const arms = (x, y) => game(`railArms(${x}, ${y}).map(a => a.join()).sort()`);
const net = k => game(`T.rail.comp.get('${k}')`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i, r.form])(rampAt(${x}, ${y}))`);
// Anhöhe 10–16 × 8–14; vorn (y = 14/15) und hinten (y = 8/7) je eine Gleis-Rampe A in der Spalte x = 12, oben Gleis dazwischen
const twoRamps = () => {
  hills(block(10, 8, 16, 14));
  game("rampNewForm = 'a'");
  expect(game("build('huegelrampe', 12, 13)")).toBe(true);                    // vorn: oben 12,13, Fuß 12,14 (hinauf nach −y)
  expect(game("build('huegelrampe', 12, 8)")).toBe(true);                     // hinten: Fuß 12,8, oben 12,9 (hinauf nach +y)
  expect([ramp(12, 14), ramp(12, 13), ramp(12, 8), ramp(12, 9)]).toEqual([['12,13', 0, 2, 0, 'a'], ['12,13', 0, 2, 1, 'a'], ['12,8', 2, 2, 0, 'a'], ['12,8', 2, 2, 1, 'a']]);
  rails([...col(12, 15, 18), ...col(12, 10, 12), ...col(12, 4, 7)]);
};

describe('Gleise oben und unten', () => {
  it('Schienen dürfen auf die Anhöhe (nicht auf die Gleis-Rampe); Bahnhöfe oben (Stufe 3), Einfahrten nur unten', () => {
    hills(block(10, 8, 16, 14));
    expect(game("placeError('schiene', 12, 10)")).toBe(null);
    expect(game("build('schiene', 12, 10)")).toBe(true);
    expect(game("placeError('station', 13, 10)")).toBe(null);                        // Stufe 3 (157j)
    game("state.techs.add('ubahn')");
    expect(game("placeError('tunneleinfahrt', 13, 10)")).toMatch(/Tunneleinfahrt steht unten/);
    game("build('huegelrampe', 12, 13)");
    expect(game("placeError('schiene', 12, 14)")).toMatch(/Gleis-Rampe – die Schiene schließt an ihren Fuß/);
    expect(game("placeError('weg', 12, 14)")).toMatch(/Gleis-Rampe/);
    expect(game("tunnelError(12, 14)")).toMatch(/kein Tunnel/);                 // ein Feld ist Gleis oder Tunnel
  });

  it('ohne Rampe getrennt: kein Arm, kein Zusammenhang, kein Weg über die Kante; ohne Anhöhen wieder ein Netz', () => {
    hills(block(10, 8, 16, 14));
    rails(col(12, 11, 17));                                                      // 12,11–12,14 oben, 12,15–12,17 unten
    expect(arms(12, 15)).toEqual(['0,1']);                                       // zur Kante hin: Prellbock
    expect(arms(12, 14)).toEqual(['0,-1']);
    expect(game('[trackLink(12, 15, 12, 14), trackLink(12, 14, 12, 15), trackLink(12, 14, 12, 13), trackAt(12, 14)]')).toEqual([false, false, true, true]);
    expect(net('12,15')).not.toBe(net('12,14'));
    expect(game("railPath('12,17', '12,11')")).toBe(null);
    expect(game('railNetwork(12, 16).length')).toBe(3);                          // Gleise umstellen: „alle verbundenen“ je Ebene
    expect(game('railNetwork(12, 12).length')).toBe(4);
    // ohne Anhöhen genau wie vorher
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(arms(12, 15)).toEqual(['0,-1', '0,1']);
    expect(game('trackLink(12, 15, 12, 14)')).toBe(true);
    expect(net('12,17')).toBe(net('12,11'));
    expect(game("railPath('12,17', '12,11').length")).toBe(7);
    expect(game('railNetwork(12, 16).length')).toBe(7);
  });

  it('Kante seitlich, Ebenen 1 ↔ 2, Bahnübergang oben mit Weg oben', () => {
    hills(block(10, 8, 16, 14));
    game("state.hills.get('15,10').h = 2; state.hills.get('15,11').h = 2; groundVersion++; recalc()");
    rails([[14, 10], [15, 10], [16, 11], [17, 11], [17, 12]]);
    expect(game('[trackLink(14, 10, 15, 10), trackLink(16, 11, 17, 11), trackLink(17, 11, 17, 12)]')).toEqual([false, false, true]);
    expect([arms(14, 10), arms(16, 11), arms(17, 11)]).toEqual([[], [], ['0,1']]);
    // Weg oben, Schiene darüber: Bahnübergang
    game("build('weg', 13, 12); build('weg', 13, 13)");
    rails([[12, 12], [14, 12]]);
    expect(game("crossCandidate('schiene', 13, 12) && crossError('schiene', 13, 12)")).toBe(null);
    expect(game("build('schiene', 13, 12)")).toBe(true);
    expect(game("isCrossing(state.tiles.get('13,12'))")).toBe(true);
    expect(arms(13, 12)).toEqual(['-1,0', '1,0']);
    expect(game("wegLink(13, 12, 13, 13)")).toBe(true);
  });

  it('Tunnel unter der Anhöhe: die Einfahrt davor verbindet; eine Schiene oben vor der Einfahrt nicht', () => {
    hills(block(10, 8, 16, 14));
    for (let x = 10; x <= 14; x++) game(`state.tunnels.set('${x},11', {})`);   // unter der Anhöhe hindurch
    game("state.tiles.set('8,11', { b: 'tunneleinfahrt', lvl: 1, rot: 3 }); recalc()");   // A = 8,11, B = 9,11 (zum Tunnel nach +x)
    rails([[6, 11], [7, 11]]);
    expect(game('[trackLink(9, 11, 10, 11), trackLink(8, 11, 9, 11), trackLink(7, 11, 8, 11)]')).toEqual([true, true, true]);
    expect(net('6,11')).toBe(net('14,11'));
    // dieselbe Einfahrt, aber die Schiene vor ihr liegt oben auf einer Anhöhe: kein Anschluss
    game("state.tiles.delete('6,11'); state.tiles.delete('7,11'); recalc()");
    hills([[7, 11], [6, 11]]);
    rails([[7, 11], [6, 11]]);
    expect(game('[trackLink(7, 11, 8, 11), trackLink(9, 11, 10, 11)]')).toEqual([false, true]);
    expect(arms(7, 11)).toEqual(['-1,0']);
  });

  it('Bahnhof unten hängt nicht an der Schiene oben daneben (Netz, Ausrichtung)', () => {
    hills(block(10, 8, 16, 14));
    rails([[16, 9], [16, 10], [19, 9], [19, 10]]);                               // 16,… oben, 19,… unten
    game("state.tiles.set('17,9', { b: 'station', lvl: 1, rot: 0 }); state.tiles.set('18,9', { b: 'station', lvl: 1, rot: 0 }); recalc()");
    expect(game("T.rail.stationNet.get('17,9')")).toBe(null);
    expect(game("T.rail.stationNet.get('18,9')")).toBe(net('19,9'));
    game("state.tiles.delete('17,9'); state.tiles.delete('18,9'); state.tiles.delete('19,9'); state.tiles.delete('19,10'); recalc()");
    expect(game("autoRot('station', 17, 9, 0)")).toBe(0);                       // dreht sich nicht zur Schiene oben (sonst 2: Tür nach −x)
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(game("autoRot('station', 17, 9, 0)")).toBe(2);
  });

  it('Schiene als Linie gezogen (Pinsel) über die Kante: baut, was geht – oben und unten getrennt; über die Rampe: ihre Felder sind schon Gleis', () => {
    hills(block(10, 8, 16, 14));
    game("build('huegelrampe', 12, 13)");
    game("setTool('schiene'); startPlan('line', { x: 14, y: 18 }, { x: 14, y: 10 }, true)");
    let info = game('(i => [i.n, i.bad])(planInfo(plan))');
    expect(info).toEqual([9, 0]);
    expect(game('runPlan()')).toBe(true);
    expect(game("[...Array(9).keys()].every(i => bAt(14, 10 + i) === 'schiene')")).toBe(true);
    expect(game('trackLink(14, 14, 14, 15)')).toBe(false);
    expect(net('14,14')).not.toBe(net('14,15'));
    // über die Rampe gezogen: ihre Felder zählen wie schon gebautes Gleis (nicht rot, nicht ersetzt), der Rest wird gebaut
    game("startPlan('line', { x: 12, y: 17 }, { x: 12, y: 10 }, true)");
    info = game('(i => [i.n, i.bad, i.firstErr])(planInfo(plan))');
    expect(info).toEqual([6, 0, null]);
    expect(game("[planCheck('schiene', 12, 13), planCheck('schiene', 12, 14)]")).toEqual([{ same: true }, { same: true }]);
    game('runPlan()');
    expect(game('[trackLink(12, 15, 12, 14), trackLink(12, 13, 12, 12)]')).toEqual([true, true]);
    expect(net('12,17')).toBe(net('12,10'));
    game("setTool('look')");
  });
});

describe('Über die Gleis-Rampe verbunden', () => {
  it('Arme, trackLink, Netz und Weg über beide Rampen; quer und am Fuß seitlich nie', () => {
    twoRamps();
    expect(arms(12, 15)).toEqual(['0,-1', '0,1']);                               // vor dem Fuß: in die Rampe, kein Prellbock
    expect(arms(12, 12)).toEqual(['0,-1', '0,1']);                               // oben: in die Rampe
    expect(arms(12, 14)).toEqual(['0,-1', '0,1']);                               // Rampenfeld: in Achsrichtung
    expect(arms(12, 13)).toEqual(['0,-1', '0,1']);
    expect(game('[trackAt(12, 14), trackAt(12, 13), trackAt(13, 14)]')).toEqual([true, true, false]);
    expect(game('[trackLink(12, 15, 12, 14), trackLink(12, 14, 12, 13), trackLink(12, 13, 12, 12), trackLink(12, 9, 12, 10), trackLink(12, 7, 12, 8)]')).toEqual([true, true, true, true, true]);
    expect(net('12,18')).toBe(net('12,4'));
    const path = game("railPath('12,18', '12,4')");
    expect(path.length).toBe(15);
    expect(path).toEqual(expect.arrayContaining(['12,14', '12,13', '12,9', '12,8']));
    // quer neben dem Fuß (unten) und neben der Rampe (oben auf der Wange): nie
    rails([[13, 14], [11, 13], [11, 15], [13, 15]]);                             // 13,14 und 11,13 oben auf den Wangen
    expect(game('[trackLink(13, 14, 12, 14), trackLink(11, 13, 12, 13), trackLink(13, 14, 13, 15), trackLink(11, 15, 12, 15)]')).toEqual([false, false, false, true]);
    expect([arms(13, 14), arms(11, 13)]).toEqual([[], []]);
    expect(game('railNetwork(12, 18).length')).toBe(11 + 2);                     // alle Schienen außer 13,14 (oben, getrennt) – die Rampenfelder zählen nicht
  });

  it('Linie zwischen zwei Bahnhöfen unten, über die Anhöhe: sie fährt, der Zug fährt hinauf und hinunter', () => {
    twoRamps();
    game("state.tiles.set('11,17', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('11,4', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
    game("for (let i = 0; i < 5; i++) state.tiles.set('22,' + (16 + 2 * i), { b: 'windrad', lvl: 1 })");
    game("globalThis.__ra = regionAt; regionAt = (x, y) => y >= 15 ? 'wald' : 'home'; recalc(); syncMovers()");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('T.rail.lines[0].stations.slice().sort()')).toEqual(['11,17', '11,4']);
    expect(game('T.rail.lines[0].running')).toBe(1);
    expect(game('trains.length')).toBe(1);
    const pts = game('trains[0].route.pts.map(p => p.join())');
    for (const k of ['12,14', '12,13', '12,9', '12,8']) expect(pts).toContain(k);
    let ys = [];
    for (let i = 0; i < 400; i++) { game('stepMovers(0.1)'); ys.push(game('railPoint(trains[0].route, trains[0].c)[1]')); }
    expect(Math.min(...ys)).toBeLessThan(7);                                     // bis hinten hinunter …
    expect(Math.max(...ys)).toBeGreaterThan(15);                                 // … und vorn wieder
    // ohne die vordere Rampe: keine Linie mehr
    game("state.tiles.delete('12,13'); recalc(); syncMovers()");
    expect(game('T.rail.lines.length')).toBe(0);
  });

  it('Abreißen trennt (voll zurück, die Felder bleiben unten), ↶ verbindet wieder', () => {
    twoRamps();
    const m0 = game('state.money'), s0 = game('state.res.stein');
    expect(game('demolishInfo(12, 14)')).toMatchObject({ anchor: '12,13', refund: game('RAMP_FORMS.a.cost'), mat: game('RAMP_FORMS.a.mat'), full: true, label: 'Gleis-Rampe entfernen' });
    game("rampNewForm = 'd'");                                                   // Leiste zeigt eine andere Form: erstattet wird die gebaute
    expect(game('demolishInfo(12, 14).mat')).toEqual(game('RAMP_FORMS.a.mat'));
    game('resetUndo(); undoable(() => demolish(12, 14))');
    expect([ramp(12, 14), game('hillAt(12, 14)'), game('hillAt(12, 13)')]).toEqual([null, null, null]);
    expect([game('state.money'), game('state.res.stein')]).toEqual([m0 + game('RAMP_FORMS.a.cost'), s0 + game('RAMP_FORMS.a.mat.stein')]);
    expect(net('12,18')).not.toBe(net('12,4'));
    expect(arms(12, 15)).toEqual(['0,1']);
    expect(game('undo()')).toBe(true);
    expect(ramp(12, 14)).toEqual(['12,13', 0, 2, 0, 'a']);
    expect([game('state.money'), game('state.res.stein')]).toEqual([m0, s0]);
    expect(net('12,18')).toBe(net('12,4'));
    // Bauen in die Anhöhe ist ein Schritt: ↶ nimmt Rampe und Absenken zurück, das Netz ist wieder getrennt
    game("state.tiles.delete('12,8'); state.hills.set('12,8', { w: 0 }); state.hills.set('12,9', { w: 0 }); groundVersion++; recalc()");
    expect(net('12,7')).not.toBe(net('12,10'));
    game("resetUndo(); rampNewForm = 'a'; undoable(() => build('huegelrampe', 12, 8))");
    expect(net('12,7')).toBe(net('12,10'));
    expect(game('undo()')).toBe(true);
    expect([ramp(12, 8), !!game('hillAt(12, 8)'), !!game('hillAt(12, 9)')]).toEqual([null, true, true]);
    expect(net('12,7')).not.toBe(net('12,10'));
  });
});

describe('Gleis-Rampe tragen, kopieren, Gruppe drehen', () => {
  // Damm B vorn vor der Wand (12,15 oben … 12,17 Fuß), Viadukt D rechts (17,11 oben … 20,11 Fuß, hinauf nach −x)
  const setup = () => {
    hills(block(10, 8, 16, 14));
    game("rampNewForm = 'b'; build('huegelrampe', 12, 15); rampNewForm = 'd'; build('huegelrampe', 17, 11)");
    expect([ramp(12, 17), ramp(20, 11)]).toEqual([['12,15', 0, 3, 0, 'b'], ['17,11', 3, 4, 0, 'd']]);
  };

  it('verschieben: an eine andere Wand, sie dreht sich hinauf; Gleise schließen dort an', () => {
    setup();
    rails([[12, 18], [6, 11], [10, 11]]);                                        // vorn das Gleis vor dem Fuß, links eins davor und eins oben
    game('resetUndo(); undoable(() => pickUp(12, 16))');
    expect(game('moving && moving.t.form')).toBe('b');
    expect(game("placeRot('huegelrampe', 7, 11)")).toBe(1);                       // links: hinauf nach +x, Fuß 7,11
    game('undoable(() => dropAt(7, 11))');
    expect(game('moving')).toBe(null);
    expect([ramp(7, 11), ramp(9, 11), ramp(12, 16)]).toEqual([['7,11', 1, 3, 0, 'b'], ['7,11', 1, 3, 2, 'b'], null]);
    expect(game('[trackLink(6, 11, 7, 11), trackLink(9, 11, 10, 11)]')).toEqual([true, true]);
    expect(net('6,11')).toBe(net('10,11'));
    expect(arms(12, 18)).toEqual([]);                                            // vorn ist sie weg
    expect(game('undo()')).toBe(true);                                           // ↶: wieder vorn
    expect([ramp(12, 17), ramp(7, 11)]).toEqual([['12,15', 0, 3, 0, 'b'], null]);
    expect(arms(12, 18)).toEqual(['0,-1']);
  });

  it('kopieren: die Form der Kopie zählt (Prüfung und Preis), nicht die der Leiste', () => {
    setup();
    game("rampNewForm = 'c'");                                                   // gleich lang wie D, liegt aber halb in der Anhöhe
    game('startCopy(17, 11, 20, 11)');
    expect(game('moving && moving.copy && moving.items.length')).toBe(1);
    expect(game('moving.cost')).toEqual({ money: game('RAMP_FORMS.d.cost'), ...game('RAMP_FORMS.d.mat') });
    // Ziel: rechts vor der Wand, eine Reihe weiter (17,12 oben … 20,12 Fuß): D passt, C nicht
    expect(game("rampError(17, 12, 3, 4, true, 'c')")).not.toBe(null);
    const hx = game('17 + moving.cx'), hy = game('12 + moving.cy');
    expect(game(`groupErrors(${hx}, ${hy}).first`)).toBe(null);
    const m0 = game('state.money');
    expect(game(`dropGroup(${hx}, ${hy})`)).toBe(true);
    expect(ramp(20, 12)).toEqual(['17,12', 3, 4, 0, 'd']);
    expect(game('state.money')).toBe(m0 - game('RAMP_FORMS.d.cost'));
    game('cancelMove()');
  });

  it('Gruppe drehen: Rampe mit Gleis davor dreht mit und führt an der anderen Wand hinauf', () => {
    setup();
    rails([[12, 18]]);
    expect(game('pickUpGroup(12, 15, 12, 18)')).toBe(true);
    expect(game('moving.items.length')).toBe(2);
    game('rotateGroup(1)');                                                      // hinauf jetzt nach +x: Fuß links, Gleis davor
    const [hx, hy] = [game('6 + moving.cx'), game('11 + moving.cy')];
    expect(game(`groupErrors(${hx}, ${hy}).first`)).toBe(null);
    expect(game(`dropGroup(${hx}, ${hy})`)).toBe(true);
    expect([ramp(7, 11), ramp(9, 11)]).toEqual([['7,11', 1, 3, 0, 'b'], ['7,11', 1, 3, 2, 'b']]);
    expect(game("bAt(6, 11)")).toBe('schiene');
    expect(game('[trackLink(6, 11, 7, 11), trackLink(9, 11, 10, 11)]')).toEqual([true, false]);   // oben noch kein Gleis
    rails([[10, 11]]);
    expect(game('trackLink(9, 11, 10, 11)')).toBe(true);
    expect(net('6,11')).toBe(net('10,11'));
  });
});

describe('Wegenetz und Anhöhe', () => {
  it('die Gleis-Rampe verbindet keine Wege, keine Viertel, keine Gegend – die Treppe schon', () => {
    hills(block(10, 8, 16, 14));
    game("build('huegelrampe', 12, 13)");
    game("build('weg', 12, 15); build('weg', 12, 12); build('weg', 12, 11)");
    expect(game("[levelLink(12, 15, 12, 14, 'weg'), levelLink(12, 13, 12, 12, 'weg'), levelLink(12, 15, 12, 14, 'fuss'), slopeWegAt(12, 14)]")).toEqual([false, false, false, false]);
    expect(game("wegNetwork(12, 15).length")).toBe(1);
    const N = 'computeNet()';
    expect(game(`(n => n.vOf('12,15') === n.vOf('12,12'))(${N})`)).toBe(false);
    expect(game(`(n => n.vOf('12,14'))(${N})`)).toBe(null);                     // die Rampe gehört zu keinem Viertel (wie die Schiene)
    expect(game("(m => m && m.get('12,12'))(hillRegions())")).toBeGreaterThan(0);   // nur mit Rampe: eigene Gegend
    // Treppe daneben: Wege und Gegend hängen zusammen
    game("build('huegeltreppe', 14, 15); build('weg', 14, 16); build('weg', 14, 14)");
    expect(game("[levelLink(14, 16, 14, 15, 'weg'), levelLink(14, 15, 14, 14, 'weg'), slopeWegAt(14, 15)]")).toEqual([true, true, true]);
    expect(game('hillRegions()')).toBe(null);
  });
});

describe('Ohne Anhöhen exakt wie vorher', () => {
  it('railArms, trackLink, trackAt, Netz: dieselben Werte wie die alte Rechnung (Kurven, Übergang, Einfahrt, Tunnel)', () => {
    rails([...col(8, 4, 12), [9, 12], [10, 12], [6, 8], [7, 8]]);
    game("build('weg', 9, 8); build('weg', 7, 6); build('schiene', 7, 6); state.tunnels.set('13,12', {}); state.tunnels.set('14,12', {}); state.tiles.set('11,12', { b: 'tunneleinfahrt', lvl: 1, rot: 3 }); recalc()");
    const old = (x, y) => game(`(() => { const e = GEXIT.get('${x},${y}'); return DIRS.filter(([dx, dy]) => bAt(${x} + dx, ${y} + dy) === 'schiene' || (isEinfahrt(${x} + dx, ${y} + dy) && trackLink(${x}, ${y}, ${x} + dx, ${y} + dy)) || (e && e[0] === dx && e[1] === dy)).map(a => a.join()).sort(); })()`);
    for (const [x, y] of [[8, 4], [8, 8], [8, 12], [9, 12], [10, 12], [7, 8], [7, 6], [6, 8], [11, 12]]) expect([x, y, arms(x, y)]).toEqual([x, y, old(x, y)]);
    expect(arms(10, 12)).toEqual(['-1,0', '1,0']);                               // in die Einfahrt
    expect(game('[hillsOn(), rampTrackAt(8, 8), trackAt(13, 12), trackAt(12, 12), trackAt(9, 9)]')).toEqual([false, false, true, true, false]);
    expect(net('8,4')).toBe(net('14,12'));
    expect(game('railNetwork(8, 4).length')).toBe(game("[...state.tiles.values()].filter(t => t.b === 'schiene').length"));   // auch der Übergang 7,6
  });
});
