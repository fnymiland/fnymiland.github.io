const { loadGame, game } = require('./helpers/load-game');

// Block 60a: Freizeitpark – Boden malen, Module darauf, Stufen Rummelplatz/Freizeitpark/Wunderland, Wirkung, Preise
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; undoStack.length = 0");
  game("state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const ground = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) game(`build('fzboden', ${x}, ${y}, true)`); game('recalc()'); };
const stages = () => game('computeFz().map(p => p.stage)');

describe('Freischalten und Boden', () => {
  it('erst nach dem Laternenfest; im Menü unter Freizeit → Freizeitpark', () => {
    game('state.festival = false');
    expect(game("available('fzboden') || available('fz_karussell')")).toBe(false);
    game('state.festival = true');
    expect(game("menuPlaceOf('fz_karussell')")).toEqual({ top: 'freizeit', sub: 'fzfahrt' });
    expect(game("menuPlaceOf('fz_tor')")).toEqual({ top: 'freizeit', sub: 'fzpark' });
    expect(game("build('fzboden', 10, 10, true)")).toBe(true);
    expect(game('terraLook(10, 10)')).toBe('fz');
    expect(game('terrainAt(10, 10)')).toBe('grass');
  });

  it('Module nur auf Freizeitpark-Boden; Häuser nicht auf den Boden', () => {
    expect(game("placeError('fz_zuckerwatte', 10, 10)")).toMatch(/Freizeitpark-Boden/);
    ground(10, 10, 3, 3);
    expect(game("placeError('fz_zuckerwatte', 10, 10)")).toBe(null);
    expect(game("placeError('haus', 11, 11)")).toMatch(/Freizeitpark/);
    expect(game("placeError('blumentopf', 11, 11)")).toBe(null);
    expect(game("placeError('fz_karussell', 12, 12)")).toMatch(/Freizeitpark-Boden/);   // ragt hinaus
  });
});

describe('Stufen und Wirkung', () => {
  it('Rummelplatz ab 9 Feldern und 2 Attraktionen; Freizeitpark braucht 25 Felder, 5 Attraktionen, Eingang, Fahrt, Stand', () => {
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); recalc()");
    expect(stages()).toEqual([0]);
    game("build('fz_zuckerwatte', 12, 12, true); recalc()");
    expect(stages()).toEqual([1]);
    ground(10, 10, 5, 5);
    game("rotManual = true; buildRot = 0; build('fz_karussell', 11, 10, true); build('fz_tor', 14, 10, true); build('fz_zuckerwatte', 10, 14, true); recalc()");
    expect(stages()).toEqual([2]);
  });

  it('Wunderland: 49 Felder, 10 Attraktionen und das Märchenschloss (Block 60b)', () => {
    ground(5, 5, 13, 11);
    game("rotManual = true; buildRot = 0");
    for (const [b, x, y] of [['fz_karussell', 5, 5], ['fz_teetassen', 7, 5], ['fz_kette', 9, 5], ['fz_geister', 11, 5], ['fz_freifall', 13, 5], ['fz_zuckerwatte', 14, 5], ['fz_eis', 15, 5], ['fz_ballon', 16, 5], ['fz_wildwasser', 5, 11], ['fz_tor', 17, 9]])
      expect(game(`build('${b}', ${x}, ${y}, true)`), b).toBe(true);
    game('recalc()');
    expect(stages()).toEqual([2]);                                                   // ohne Schloss: Freizeitpark
    expect(game("build('fz_schloss', 10, 9, true)")).toBe(true);
    game('recalc()');
    expect(stages()).toEqual([3]);
  });

  it('bringt Einnahmen (+%), Besucher und Schönheit – auch ringsum', () => {
    game("for (let x = 3; x <= 8; x++) state.tiles.set(x + ',22', { b: 'haus', lvl: 3 })");    // etwas Einkommen
    const before = game('(recalc(), [T.inc, T.beauty, placeStats().attr.get(regionAt(10, 10)) || 0])');
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); build('fz_zuckerwatte', 12, 12, true); recalc()");
    const after = game('[T.inc, T.beauty, placeStats().attr.get(regionAt(10, 10)) || 0]');
    expect(after[0]).toBeGreaterThan(before[0] * 1.07);
    expect(after[1]).toBeGreaterThanOrEqual(before[1] + game('FZ_BEAUTY[1]'));
    expect(after[2]).toBeGreaterThanOrEqual(before[2] + game('FZ_ATTR[1]'));
    expect(game('beautyAround(15, 11, 0)')).toBeGreaterThanOrEqual(game('FZ_BEAUTY[1]'));    // 3 Felder daneben
  });
});

describe('Preise', () => {
  it('nach dem besten Einkommen (mindestens Grundpreis); Abriss erstattet die Hälfte dessen, was man bezahlt hat', () => {
    game('state.incPeak = 0');
    expect(game('ITEMS.fz_zuckerwatte.cost')).toBe(20000);
    game('state.incPeak = 1000');                                                  // 2 Minuten von 1000/s
    expect(game('ITEMS.fz_zuckerwatte.cost')).toBe(120000);
    ground(10, 10, 1, 1);
    const m = game('state.money');
    game("build('fz_zuckerwatte', 10, 10, true)");
    expect(game("state.tiles.get('10,10').price")).toBe(120000);
    game('state.incPeak = 1e6');                                                   // später reicher: Erstattung bleibt
    game('demolish(10, 10)');
    expect(game('state.money')).toBe(m - 120000 + 60000);
  });

  it('Boden entfernen geht nicht unter einem Fahrgeschäft', () => {
    ground(10, 10, 1, 1);
    game("build('fz_zuckerwatte', 10, 10, true)");
    expect(game('removeFzGround(10, 10)')).toBe(false);
    game('demolish(10, 10)');
    expect(game('removeFzGround(10, 10)')).toBe(true);
    expect(game('terraLook(10, 10)')).not.toBe('fz');
  });

  it('Fenster: Boden zeigt Stufe und was fehlt', () => {
    ground(10, 10, 3, 3);
    game("build('fz_zuckerwatte', 10, 10, true); recalc(); openFzInfo(11, 11)");
    expect(game("document.getElementById('panel').textContent")).toMatch(/Noch kein Freizeitpark.*fehlt noch: 1 Attraktion/s);
  });
});

describe('Achterbahn (Block 60c)', () => {
  const loop = () => {                                   // Rechteck 6×4 als Rundkurs, Station unten links
    ground(5, 5, 8, 6);
    const ring = [];
    for (let x = 6; x <= 11; x++) ring.push([x, 6]);
    for (let y = 7; y <= 9; y++) ring.push([11, y]);
    for (let x = 10; x >= 6; x--) ring.push([x, 9]);
    for (let y = 8; y >= 7; y--) ring.push([6, y]);
    for (const [x, y] of ring) if (!(x === 7 && y === 9)) game(`build('fz_bahn', ${x}, ${y}, true)`);
    return ring;
  };
  it('ohne Station oder offen: kein Rundkurs; mit Station: fährt, zählt als Attraktion „Achterbahn“', () => {
    loop();
    game("build('fz_bahn', 7, 9, true); recalc()");
    expect(game('COASTERS.length')).toBe(0);                                     // keine Station
    game("demolish(7, 9); build('fz_station', 7, 9, true); recalc()");
    expect(game('COASTERS.length')).toBe(1);
    expect(game("state.tiles.get(COASTERS[0].key).b")).toBe('fz_station');      // Station vorn im Ring
    expect(game('COASTERS[0].h[0]')).toBe(0);
    expect(game('Math.max(...COASTERS[0].h)')).toBeCloseTo(game('COASTERS[0].Hmax'));
    const p = game('computeFz()')[0];
    expect(p.rides).toBe(1);
    expect(game('[...computeFz()[0].sorts]')).toEqual(expect.arrayContaining(['fahrt', 'achterbahn']));
    game('demolish(11, 7); recalc()');                                           // Lücke
    expect(game('COASTERS.length')).toBe(0);
  });

  it('der Zug fährt den Ring ab und hält an der Station', () => {
    loop(); game("build('fz_station', 7, 9, true); recalc(); coasterRuns.clear()");
    game('stepCoasters(0.1)');
    const key = game('COASTERS[0].key');
    game(`coasterRuns.get('${key}').wait = 0`);
    for (let i = 0; i < 20; i++) game('stepCoasters(0.1)');
    expect(game(`coasterRuns.get('${key}').s`)).toBeGreaterThan(0.5);
    expect(game('coasterCars().length')).toBe(3);
    for (let i = 0; i < 400; i++) game('stepCoasters(0.1)');
    expect(game(`coasterRuns.get('${key}').wait`)).toBeGreaterThanOrEqual(0);    // eine Runde geschafft (oder wartet)
  });

  it('Looping nur auf ein gerades Stück; wird gespeichert und beim Abreißen anteilig erstattet', () => {
    loop(); game("build('fz_station', 7, 9, true); recalc()");
    expect(game("placeError('fz_looping', 11, 6)")).toMatch(/gerades Stück/);   // Ecke
    expect(game("placeError('fz_looping', 5, 5)")).toMatch(/Achterbahn-Schiene/);
    expect(game("build('fz_looping', 8, 6, true)")).toBe(true);
    expect(game("state.tiles.get('8,6').loop")).toBe(true);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('8,6').loop")).toBe(true);
    const info = game('demolishInfo(8, 6)');
    expect(info.refund).toBe(Math.floor((game("state.tiles.get('8,6').price") + game("state.tiles.get('8,6').loopPrice")) / 2));
  });
});

describe('Parade, Besuch, Album, Erfolg (Block 60d)', () => {
  const rummel = () => { ground(10, 10, 3, 3); game("build('fz_zuckerwatte', 10, 10, true); build('fz_eis', 12, 12, true); recalc()"); };
  it('Parade nur mit Freizeitpark: 3 Minuten Einnahmen ×1,3, Umzug, danach Pause; wird gespeichert', () => {
    expect(game('startFzFest(1e12)')).toBe(false);
    rummel();
    expect(game('startFzFest(1e12)')).toBe(true);
    expect(game('boostMul("inc", 1e12 + 60e3)')).toBeCloseTo(1.3);
    expect(game('boostMul("inc", 1e12 + 4 * 60e3)')).toBe(1);
    expect(game('startFzFest(1e12 + 5 * 60e3)')).toBe(false);                    // Pause
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).fzFest.mul')).toBeCloseTo(1.3);
    game('state.fzFest.until = Date.now() + 60e3; paraders.length = 0; for (let i = 0; i < 10; i++) syncParade()');
    expect(game('paraders.length')).toBeGreaterThan(0);
    expect(game("paraders.every(w => terraLook(w.fx, w.fy) === 'fz' && !!w.flag)")).toBe(true);
    game('state.fzFest.until = 0; syncParade()');
    expect(game('paraders.length')).toBe(0);
  });

  it('Bewohner gehen in den Freizeitpark', () => {
    rummel();
    game("for (let x = 6; x <= 10; x++) state.tiles.set(x + ',9', { b: 'weg', lvl: 1 }); state.tiles.set('6,8', { b: 'haus', lvl: 1 }); nameHouses(); recalc()");
    game("walkers.length = 0; walkers.push({ fx: 6, fy: 9, tx: 6, ty: 9, px: 6, py: 9, t: 1, wait: 0, ...residentLook('6,8', 0), shirt: '#fff', speed: 1 }); setGoal(walkers[0], 'fzpark')");
    expect(game('walkers[0].goal.kind')).toBe('fzpark');
    expect(game('walkerDoing(walkers[0])')).toMatch(/Freizeitpark/);
  });

  it('Album-Seite „Freizeitpark“ mit Zauberbrunnen; Erfolg nach Parkstufe', () => {
    const keys = game("albumKeys(ALBUM.find(p => p.id === 'fzpark'))");
    expect(keys).toContain('b:fz_bahn');
    expect(keys).toContain('b:fz_looping');
    expect(game("available('zauberbrunnen')")).toBe(false);
    game("for (const k of albumKeys(ALBUM.find(p => p.id === 'fzpark'))) state.album.add(k)");
    expect(game("available('zauberbrunnen')")).toBe(true);
    rummel();
    expect(game("ACHIEVEMENTS.find(a => a.id === 'fzpark').value()")).toBe(1);
  });
});

describe('Überarbeitung (Block 60e)', () => {
  it('Schiene, Höhen-Pinsel und Boden lassen sich ziehen', () => {
    expect(game("dragKind('fz_bahn')")).toBe('line');
    expect(game("dragKind('fz_hoch')")).toBe('line');
    expect(game("dragKind('fzboden')")).toBe('rect');
    ground(10, 10, 6, 1);
    game("setTool('fz_bahn'); startPlan('line', { x: 10, y: 10 }, { x: 15, y: 10 }, true); runPlan(); setTool('look')");
    expect(game("[10, 11, 12, 13, 14, 15].every(x => state.tiles.get(x + ',10') && state.tiles.get(x + ',10').b === 'fz_bahn')")).toBe(true);
  });

  it('Höhen-Pinsel: jede Fahrt eine Stufe höher/tiefer, Grenzen, gespeichert; nur über Schienen', () => {
    ground(10, 10, 4, 1);
    for (let x = 10; x <= 13; x++) game(`build('fz_bahn', ${x}, 10, true)`);
    game('recalc()');
    expect(game("placeError('fz_hoch', 10, 11)")).toMatch(/Achterbahn-Schienen/);
    game("build('fz_hoch', 11, 10, true); build('fz_hoch', 11, 10, true)");
    expect(game("state.tiles.get('11,10').hgt")).toBe(2);
    expect(game("COASTER_AT.get('11,10').h")).toBe(2 * game('COASTER_STEP'));
    game("build('fz_tief', 11, 10, true)");
    expect(game("state.tiles.get('11,10').hgt")).toBe(1);
    game("state.tiles.get('11,10').hgt = 10; recalc()");
    expect(game("placeError('fz_hoch', 11, 10)")).toMatch(/Höher geht es nicht/);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('11,10').hgt")).toBe(10);
  });

  it('Looping auch auf offener Strecke sichtbar (gerades Stück)', () => {
    ground(10, 10, 4, 1);
    for (let x = 10; x <= 13; x++) game(`build('fz_bahn', ${x}, 10, true)`);
    game('recalc()');
    expect(game("build('fz_looping', 11, 10, true)")).toBe(true);
    expect(game("!!COASTER_AT.get('11,10').din")).toBe(true);
    expect(() => game("drawCoasterTile(100, 100, 1.5, 11, 10, state.tiles.get('11,10'))")).not.toThrow();
  });

  it('Schloss und Eingang frei aufziehen: Größe in Grenzen, Preis nach Fläche, gespeichert; Fensterfarbe', () => {
    ground(5, 5, 12, 10);
    expect(game("sizedDim('fz_schloss', 9, 1)")).toEqual([6, 2]);
    expect(game("sizedDim('fz_tor', 5, 3)")).toEqual([5, 2]);
    expect(game("sizedDim('fz_tor', 1, 1)")).toEqual([1, 2]);
    game('state.incPeak = 0');
    game("setTool('fz_schloss'); startPlan('rect', { x: 5, y: 5 }, { x: 10, y: 7 }, true)");
    const info = game('planInfo(plan)');
    expect(info.dim).toEqual([6, 3]);
    expect(info.cost).toBe(game('niceRound(ITEMS.fz_schloss.cost * 18 / 9)'));
    game("runPlan(); setTool('look')");
    expect(game("state.tiles.get('5,5').dim")).toEqual([6, 3]);
    expect(game("footprint('fz_schloss', 5, 5, 0, state.tiles.get('5,5')).length")).toBe(18);
    game("recalc(); openInfo(5, 5)");
    expect(game("document.querySelectorAll('#panel [data-win]').length")).toBe(game('WIN_COLS.length'));
    game("document.querySelector('#panel [data-win=\"2\"]').click()");
    expect(game("state.tiles.get('5,5').win")).toBe(2);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('5,5')")).toMatchObject({ dim: [6, 3], win: 2 });
  });
});
