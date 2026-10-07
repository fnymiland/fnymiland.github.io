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
    expect(game("menuPlaceOf('fz_torturm')")).toEqual({ top: 'freizeit', sub: 'fzschloss' });
    expect(game("menuPlaceOf('fz_schloss')")).toEqual({ top: 'freizeit', sub: 'fzschloss' });
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
    game("rotManual = true; buildRot = 0; build('fz_karussell', 11, 10, true); build('fz_torturm', 14, 10, true); build('fz_torturm', 14, 13, true); build('fz_zuckerwatte', 10, 14, true); recalc()");
    expect(stages()).toEqual([2]);
  });

  it('Wunderland: 49 Felder, 10 Attraktionen und das Märchenschloss (Block 60b)', () => {
    ground(5, 5, 13, 11);
    game("rotManual = true; buildRot = 0");
    for (const [b, x, y] of [['fz_karussell', 5, 5], ['fz_teetassen', 7, 5], ['fz_kette', 9, 5], ['fz_geister', 11, 5], ['fz_freifall', 13, 5], ['fz_zuckerwatte', 14, 5], ['fz_eis', 15, 5], ['fz_ballon', 16, 5], ['fz_wildwasser', 5, 11], ['fz_torturm', 17, 9], ['fz_torturm', 17, 13]])
      expect(game(`build('${b}', ${x}, ${y}, true)`), b).toBe(true);
    game('recalc()');
    expect(stages()).toEqual([2]);                                                   // ohne Schloss: Freizeitpark
    expect(game("build('fz_schloss', 8, 9, true)")).toBe(true);                       // 2×5 (Block 60g)
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
    game('state.incPeak = 2300');                                                  // 2 Minuten beim Bezugseinkommen 2.300/s
    expect(game('ITEMS.fz_zuckerwatte.cost')).toBe(280000);
    ground(10, 10, 1, 1);
    const m = game('state.money');
    game("build('fz_zuckerwatte', 10, 10, true)");
    expect(game("state.tiles.get('10,10').price")).toBe(280000);
    game('state.incPeak = 1e6');                                                   // später reicher: Erstattung bleibt
    game('demolish(10, 10)');
    expect(game('state.money')).toBe(m - 280000 + 140000);
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

  it('Torturm: Stockwerke und Fensterfarbe im Fenster, gespeichert; zwei Tortürme bilden den Eingang (Block 60f)', () => {
    ground(5, 5, 10, 6);
    game("build('fz_torturm', 6, 6, true); recalc(); openInfo(6, 6)");
    expect(game("state.tiles.get('6,6').fl")).toBe(2);
    game("document.querySelector('#panel [data-fl=\"1\"]').click()");
    expect(game("state.tiles.get('6,6').fl")).toBe(3);
    game("document.querySelector('#panel [data-win=\"2\"]').click()");
    expect(game("state.tiles.get('6,6').win")).toBe(2);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('6,6')")).toMatchObject({ fl: 3, win: 2 });
    game("build('fz_torturm', 8, 8, true); build('fz_torturm', 12, 8, true); recalc()");
    expect(game("TOR_PAIR.get('8,8')")).toBe('12,8');
    expect(game("[...computeFz()[0].sorts]")).toContain('tor');
    game("build('fz_torturm', 8, 10, true); recalc()");                        // dritter Turm näher dran: neues Paar, der ferne steht allein
    expect(game("TOR_PAIR.get('8,8')")).toBe('8,10');
    expect(game("TOR_PAIR.has('12,8')")).toBe(false);
    expect(() => game("drawObject('fz_torturm', 100, 100, 1.5, 1000, 8, 10, 1, state.tiles.get('8,10'))")).not.toThrow();
  });
});

describe('Station, Looping, Randlinien (Block 60f)', () => {
  it('Station bleibt flach, auch wenn die Nachbarn hoch liegen; Looping fährt erst vor, oben zurück', () => {
    ground(5, 5, 8, 6);
    const ring = [];
    for (let x = 6; x <= 11; x++) ring.push([x, 6]);
    for (let y = 7; y <= 9; y++) ring.push([11, y]);
    for (let x = 10; x >= 6; x--) ring.push([x, 9]);
    for (let y = 8; y >= 7; y--) ring.push([6, y]);
    for (const [x, y] of ring) if (!(x === 7 && y === 9)) game(`build('fz_bahn', ${x}, ${y}, true)`);
    game("build('fz_station', 7, 9, true); state.tiles.get('6,9').hgt = 8; state.tiles.get('8,9').hgt = 8; recalc()");
    expect(game("[COASTER_AT.get('7,9').hIn, COASTER_AT.get('7,9').h, COASTER_AT.get('7,9').hOut]")).toEqual([0, 0, 0]);
    for (const k of ['6,9', '8,9']) expect(game(`Math.min(COASTER_AT.get('${k}').hIn, COASTER_AT.get('${k}').hOut)`)).toBe(0);   // die Kante zur Station bleibt unten
    const info = "({ din: [1, 0], dout: [1, 0], h: 10, hIn: 10, hOut: 10 })";
    expect(game(`coasterGeo(5, 5, ${info}, 0.35, true)[0]`)).toBeGreaterThan(5);         // erst nach vorn
    expect(game(`coasterGeo(5, 5, ${info}, 0.65, true)[0]`)).toBeLessThan(5);            // oben zurück
  });

  it('Randlinien von Park und Freizeitpark lassen sich im Menü ausblenden (gespeichert)', () => {
    game('showMenu()');
    game("document.getElementById('m-borders').click()");
    expect(game('state.noBorders')).toBe(true);
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).noBorders')).toBe(true);
    game("document.getElementById('m-borders').click(); closeModal()");
    expect(game('state.noBorders')).toBe(false);
  });
});

describe('Märchenschloss (Block 60g)', () => {
  const cs = () => game("(() => { for (const [k, t] of state.tiles) if (t.b === 'fz_schloss') return [k, { ...t.cs }, t.price]; })()");
  it('ein Gebäude, Größe im Fenster: wächst abwechselnd zu beiden Seiten, kostet den Unterschied; kleiner gibt nichts, zurück kostet nichts (Block 137)', () => {
    ground(5, 5, 12, 8);
    game("rotManual = true; buildRot = 0");
    expect(game("build('fz_schloss', 8, 6, true)")).toBe(true);
    expect(cs()[1]).toEqual(game('csNew()'));                                       // neu: Turmgruppe, rund (Block 74)
    expect(game("sizeOf('fz_schloss', 0, state.tiles.get('8,6'))")).toEqual([2, 5]);
    expect(game("COVER.get('9,10')")).toBe('8,6');
    game('state.money = 1e9');
    const m0 = game('state.money'), p0 = cs()[2];
    expect(game('castleChange(8, 6, { w: 6 })')).toBe('8,6');                      // gerade Breite: nach +y
    expect(game("COVER.get('9,11')")).toBe('8,6');
    expect(game('state.money')).toBe(m0 - (cs()[2] - p0));
    expect(game('castleChange(8, 6, { w: 7 })')).toBe('8,5');                      // ungerade: nach −y
    expect(game("COVER.get('8,5')")).toBe('8,5');
    const m1 = game('state.money'), p1 = cs()[2];
    const k1 = game('castleChange(8, 5, { w: 6 })');
    expect(k1).toBeTruthy();
    expect(game('state.money')).toBe(m1);                                            // kleiner: nichts zurück …
    expect(cs()[2]).toBe(p1);                                                        // … das Guthaben bleibt im Schloss
    expect(game(`castleChange(${k1}, { w: 7 })`)).toBeTruthy();
    expect(game('state.money')).toBe(m1);                                            // wieder groß: kostenlos
  });

  it('kein Platz: Hinweis, nichts verändert; bis 4 Turmpaare auch im schmalen Schloss, ohne Überlappen (Block 60h)', () => {
    ground(5, 5, 12, 8);
    game("rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); build('fz_eis', 8, 5, true); build('fz_eis', 8, 11, true); recalc(); state.money = 1e9");
    const before = cs();
    expect(game('castleChange(8, 6, { w: 6 })')).toBe(null);
    expect(cs()).toEqual(before);
    expect(game("COVER.get('8,6')")).toBe('8,6');
    const four = JSON.stringify([0, 1, 2, 3].map(h => ({ h, k: 2, p: h % 3, r: h % 3 })));
    expect(game(`castleChange(8, 6, { tw: ${four} })`)).toBe('8,6');
    expect(game(`castleChange(8, 6, { tw: [...${four}, { h: 1 }] })`)).toBe(null);
    expect(game('castleChange(8, 6, { tw: [{ h: 9 }] })')).toBe(null);
    for (const w of [3, 5, 9]) {                                                    // Türme einer Seite überlappen nie
      const T = game(`castleTowers(csOf({ cs: { w: ${w}, cb: 2, tw: ${four} } }))`), core = game(`csCore(csOf({ cs: { w: ${w}, cb: 2 } }))`);
      expect(T[0].pos - T[0].r).toBeGreaterThanOrEqual(core / 2);
      for (let i = 1; i < T.length; i++) expect(T[i].pos - T[i].r).toBeGreaterThanOrEqual(T[i - 1].pos + T[i - 1].r - 1e-9);
      expect(T[3].pos + T[3].r).toBeLessThanOrEqual(w / 2);
    }
    expect(game('csOf({ cs: { w: 7, d: 2, m: 4, s: 2, r: 1 } })')).toMatchObject({ mr: 1, cr: 1, wr: 1, tw: [{ h: 3, r: 1 }, { h: 2, r: 1 }] });   // alte Form (60g)
  });

  it('Knöpfe im Fenster, Rückgängig, gespeichert; zählt als Schloss; zeichnet in jeder Form', () => {
    ground(5, 5, 12, 8);
    game("rotManual = true; buildRot = 1; build('fz_schloss', 7, 7, true); recalc(); state.money = 1e9; openInfo(7, 7)");
    expect(game("sizeOf('fz_schloss', 1, state.tiles.get('7,7'))")).toEqual([5, 2]);
    game("castleTab = 'form'; openInfo(7, 7); document.querySelector('#panel [data-cs=\"cr:1\"]').click()");
    game("document.querySelector('#panel [data-cs=\"m:4\"]').click()");
    expect(cs()[1]).toMatchObject({ cr: 1, m: 4 });
    game('undo()');
    expect(cs()[1]).toMatchObject({ cr: 1, m: 2 });
    game("document.querySelector('#panel [data-cs=\"d:+1\"]').click()");
    expect(cs()[1].d).toBe(3);
    game("document.querySelector('#panel [data-cstab=\"tuerme\"]').click()");
    game("document.querySelector('#panel [data-ctadd]').click()");
    game("document.querySelector('#panel [data-ct=\"1:p:n\"]').click()");
    game("document.querySelector('#panel [data-ct=\"0:h:+1\"]').click()");
    expect(cs()[1].tw).toEqual([{ h: 3, k: 1, p: 0, r: 0, f: 1 }, { h: 1, k: 1, p: 1, r: 0, f: 1 }]);
    game("document.querySelector('#panel [data-ctdel=\"0\"]').click()");
    expect(cs()[1].tw).toEqual([{ h: 1, k: 1, p: 1, r: 0, f: 1 }]);
    game("document.querySelector('#panel [data-cstab=\"form\"]').click(); document.querySelector('#panel [data-tpl=\"ritter\"]').click()");
    expect(cs()[1]).toMatchObject({ d: 3, wr: 2, cr: 2, tw: [{ k: 2, r: 2 }, { r: 2 }] });
    expect(game(`state.tiles.get('${cs()[0]}').win`)).toBe(6);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(cs()[1]).toMatchObject({ d: 3, cr: 2 });
    game('recalc()');
    expect(game("[...computeFz()[0].sorts]")).toContain('schloss');
    const k = cs()[0];
    for (let rot = 0; rot < 4; rot++) for (const r of [0, 1, 2]) for (const m of [0, 4]) for (const w of [3, 9]) for (const dd of [1, 3])
      expect(() => game(`(t => { t.rot = ${rot}; t.cs = { w: ${w}, d: ${dd}, m: ${m}, mk: ${m / 2}, mr: ${r}, cr: ${(r + 1) % 3}, wr: ${(r + 2) % 3}, cb: ${r}, cf: ${dd + 1}, wf: ${dd}, tw: [0, 1, 2, 3].map(h => ({ h, k: (h + ${r}) % 3, p: h % 3, r: (h + ${m}) % 3 })) }; drawObject('fz_schloss', 300, 300, 1.2, 1000, 7, 7, 1, t); })(state.tiles.get('${k}'))`)).not.toThrow();
    expect(() => game(`(t => { t.cs = { w: 5, d: 2, m: 3, s: 2, r: 1 }; drawObject('fz_schloss', 300, 300, 1.2, 1000, 7, 7, 1, t); })(state.tiles.get('${k}'))`)).not.toThrow();
  });
});

describe('Märchenschloss: Zierde und Umgebung (Block 60i)', () => {
  const cs = () => game("(() => { for (const [k, t] of state.tiles) if (t.b === 'fz_schloss') return [k, { ...t.cs }, t.price]; })()");
  it('Graben/Mauer/Garten: ein Feld rundum, mittig, kostet; wieder aus: schrumpft zurück', () => {
    ground(4, 4, 12, 9);
    game("rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); recalc(); state.money = 1e9");
    const p0 = cs()[2];
    expect(game('castleChange(8, 6, { mo: 1 })')).toBe('7,5');
    expect(game("sizeOf('fz_schloss', 0, state.tiles.get('7,5'))")).toEqual([4, 7]);
    expect(cs()[2]).toBeGreaterThan(p0);
    expect(game('castleChange(7, 5, { mw: 1, gn: 1 })')).toBe('7,5');                  // schon Platz: bleibt gleich groß
    expect(game("sizeOf('fz_schloss', 0, state.tiles.get('7,5'))")).toEqual([4, 7]);
    expect(game('castleChange(7, 5, { mo: 0, mw: 0, gn: 0 })')).toBe('8,6');
  });

  it('kein Platz rundum: Hinweis, nichts verändert', () => {
    ground(4, 4, 12, 9);
    game("rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); build('fz_eis', 7, 8, true); recalc(); state.money = 1e9");
    expect(game('castleChange(8, 6, { mw: 1 })')).toBe(null);
    expect(cs()[1].mw).toBe(0);
  });

  it('Schalter im Fenster (Zierde), gespeichert, zeichnet bei Tag und Nacht in jeder Drehung', () => {
    ground(4, 4, 12, 9);
    game("rotManual = true; buildRot = 1; build('fz_schloss', 7, 7, true); recalc(); state.money = 1e9; castleTab = 'zierde'; openInfo(7, 7)");
    game("document.querySelector('#panel [data-cs=\"lc:t\"]').click()");
    game("document.querySelector('#panel [data-cs=\"wp:2\"]').click()");
    game("document.querySelector('#panel [data-cs=\"fc:3\"]').click()");
    game("document.querySelector('#panel [data-cs=\"gd:t\"]').click()");
    expect(cs()[1]).toMatchObject({ lc: 1, wp: 2, fc: 3, gd: 0 });
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(cs()[1]).toMatchObject({ lc: 1, wp: 2, fc: 3, gd: 0 });
    const k = cs()[0];
    for (const n of [0, 0.6]) for (let rot = 0; rot < 4; rot++) for (const on of [0, 1]) for (const wp of [0, 1, 3]) for (const cf of [1, 3])
      expect(() => game(`(t => { night = ${n}; t.rot = ${rot}; t.cs = csOf({ cs: { w: 5, d: ${1 + on}, cf: ${cf}, wp: ${wp}, bk: ${on}, lc: ${on}, ex: ${on}, mo: ${on}, mw: ${on}, gn: ${on}, gd: ${1 - on}, fc: ${wp + on} } }); drawObject('fz_schloss', 300, 300, 1.2, 1000, 7, 7, 1, t); })(state.tiles.get('${k}'))`)).not.toThrow();
    game('night = 0');
  });
});

describe('Wunder-Schloss im neuen Stil (Block 60j)', () => {
  it('zeichnet jeden Bauabschnitt, jede Drehung und Dachform, bei Tag und Nacht', () => {
    game("state.tiles.set('5,5', { b: 'schloss', lvl: 1, phase: 0, rate: 1 }); rebuildCover()");
    for (const n of [0, 0.6]) for (let phase = 0; phase <= 6; phase++) for (let rot = 0; rot < 4; rot++) for (const r of [0, 1, 2])
      expect(() => game(`(t => { night = ${n}; t.phase = ${phase}; t.rot = ${rot}; t.cs = { r: ${r} }; for (const P of [null, 'ground', 'object']) { PASS = P; drawObject('schloss', 300, 300, 1, 1000, 5, 5, 1, t); } PASS = null; })(state.tiles.get('5,5'))`)).not.toThrow();
    game('night = 0');
  });

  it('Farben und Dachform erst nach der Einweihung; Dachform wird gespeichert', () => {
    game("state.tiles.set('5,5', { b: 'schloss', lvl: 1, phase: 3, rate: 1 }); rebuildCover(); recalc(); openInfo(5, 5)");
    expect(game("!!document.querySelector('#panel [data-royal]')")).toBe(false);
    expect(game("!!document.querySelector('#panel [data-wall]')")).toBe(false);
    game("state.tiles.get('5,5').phase = 6; openInfo(5, 5)");
    expect(game("!!document.querySelector('#panel [data-wall]')")).toBe(true);
    game("document.querySelector('#panel [data-royal=\"2\"]').click()");
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("royalRoof(state.tiles.get('5,5'))")).toBe(2);
  });

  it('nachts ab und zu ein Feuerwerk über dem fertigen Schloss', () => {
    game("state.tiles.set('5,5', { b: 'schloss', lvl: 1, phase: 6, rate: 1 }); rebuildCover(); royalFireNext = 0; fireworksUntil = 0");
    game('night = 0');
    expect(game('royalFireTick(1e6)')).toBe(false);
    game('night = 0.6');
    expect(game('royalFireTick(1e6)')).toBe(true);
    expect(game('fireworksAt')).toEqual([8, 8]);
    game('fireworksUntil = 0');
    expect(game('royalFireTick(1e6 + 1000)')).toBe(false);                            // erst ein paar Minuten später wieder
    expect(game('royalFireTick(1e6 + 160000)')).toBe(true);
    game('night = 0; fireworksUntil = 0');
  });
});

describe('Märchenschloss: runde Türme und Turmgruppe (Block 74)', () => {
  const fills = cs => game(`(() => {
    const seen = [];
    Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
    const ell = g.ellipse; let n = 0; g.ellipse = (...a) => { n++; return ell && ell(...a); };
    try { drawObject('fz_schloss', 200, 300, 1.2, 1000, 3, 4, 1, { b: 'fz_schloss', rot: 0, cs: ${JSON.stringify(cs)} }); } finally { delete g.fillStyle; delete g.ellipse; }
    return seen.length + '|' + n + '|' + seen.join(',');
  })()`);
  it('alte Schlösser bleiben Block und eckig, neue starten als Turmgruppe, rund', () => {
    expect(game("(({ mt, mf, tw }) => [mt, mf, tw[0].f])(csOf({ cs: { w: 5, d: 2, tw: [{ h: 2 }] } }))")).toEqual([0, 0, 0]);
    expect(game("(({ mt, mf, tw }) => [mt, mf, tw[0].f])(csNew())")).toEqual([1, 1, 1]);
  });
  it('Form, Mitte und Dächer ändern das Bild – in jeder Mischung, jeder Drehung', () => {
    const base = game('csOf(null)'), seen = new Set();
    for (const mt of [0, 1]) for (const mf of [0, 1]) for (const cr of [0, 1, 2]) {
      const cs = { ...base, m: 3, mt, mf, cr, tw: base.tw.map(o => ({ ...o, f: mf })) };
      const out = fills(cs);
      expect(seen.has(out)).toBe(false);                                           // jede Mischung sieht anders aus
      seen.add(out);
      for (const rot of [1, 2, 3]) game(`drawObject('fz_schloss', 200, 300, 1.2, 1000, 3, 4, 1, { b: 'fz_schloss', rot: ${rot}, cs: ${JSON.stringify(cs)} })`);
    }
    expect(fills({ ...base, mf: 1, mt: 0, tw: base.tw.map(o => ({ ...o, f: 1 })) }).split('|')[1] > 0).toBe(true);   // rund: Ellipsen
  });
  it('Fenster wenige … ganz viele (Block 75): mehr Fenster, alte Schlösser „normal“; Balkon in jeder Form', () => {
    const base = game('csOf(null)');
    expect(base.wn).toBe(1);
    const n = wn => +fills({ ...base, wn, bk: 1 }).split('|')[0];
    expect(n(0)).toBeLessThan(n(1));
    expect(n(1)).toBeLessThan(n(3));
    for (const f of [0, 1]) expect(() => fills({ ...base, bk: 1, mf: f, tw: [{ h: 4, k: 2, p: 0, r: 0, f }] })).not.toThrow();
    ground(5, 5, 12, 8);
    game("state.money = 1e9; rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); castleTab = 'zierde'; openInfo(8, 6)");
    game("document.querySelector('#panel [data-cs=\"wn:3\"]').click()");
    expect(game("state.tiles.get('8,6').cs.wn")).toBe(3);
  });
  it('Boden (Block 76): Sockel · Rasen · Platz – alte Schlösser Sockel, neue Rasen; jede Wahl sieht anders aus', () => {
    const base = game('csOf(null)');
    expect(base.gb).toBe(0);
    expect(game('csNew().gb')).toBe(1);
    const outs = [0, 1, 2].map(gb => fills({ ...base, gb }));
    expect(new Set(outs).size).toBe(3);
    ground(5, 5, 12, 8);
    game("state.money = 1e9; rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); castleTab = 'zierde'; openInfo(8, 6)");
    game("document.querySelector('#panel [data-cs=\"gb:2\"]').click()");
    expect(game("state.tiles.get('8,6').cs.gb")).toBe(2);
    expect(game("[...document.querySelectorAll('#panel [data-csgp]')].map(b => b.dataset.csgp)")).toEqual(game("STYLES.weg.filter(st => styleOk(st) && !PATH_LOOK[st.id].stones).map(st => st.id)"));
    game("document.querySelector('#panel [data-csgp=\"sand\"]').click()");
    expect(game("state.tiles.get('8,6').cs.gp")).toBe('sand');                        // Belag wie die Wege (Block 76b)
    expect(fills({ ...base, gb: 2, gp: 'sand' })).not.toBe(fills({ ...base, gb: 2, gp: 'platten' }));
    expect(game("castleChange(8, 6, { gp: 'gibtsnicht' })")).toBe(null);
  });
  it('Knöpfe: Mitte wählen, Form je Turmpaar umschalten; Hauptturm ohne „keiner“', () => {
    ground(5, 5, 12, 8);
    game("state.money = 1e9; rotManual = true; buildRot = 0; build('fz_schloss', 8, 6, true); castleTab = 'form'; openInfo(8, 6)");
    expect(game("!!document.querySelector('#panel [data-cs=\"m:0\"]')")).toBe(false);   // Turmgruppe: immer ein Hauptturm
    game("document.querySelector('#panel [data-cs=\"mt:0\"]').click()");
    expect(game("state.tiles.get('8,6').cs.mt")).toBe(0);
    expect(game("!!document.querySelector('#panel [data-cs=\"m:0\"]')")).toBe(true);
    game("document.querySelector('#panel [data-cs=\"mf:0\"]').click()");
    expect(game("state.tiles.get('8,6').cs.mf")).toBe(0);
    game("document.querySelector('#panel [data-cstab=\"tuerme\"]').click(); document.querySelector('#panel [data-ct=\"0:f:n\"]').click()");
    expect(game("state.tiles.get('8,6').cs.tw[0].f")).toBe(0);
    game("document.querySelector('#panel [data-ctadd]').click()");
    expect(game("state.tiles.get('8,6').cs.tw[1].f")).toBe(0);                     // neues Paar wie das letzte
  });
});
