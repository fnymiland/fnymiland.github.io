const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2 – Netz, Regeln, Bauen (rules.js, actions.js): Wege hängen nur auf gleicher Ebene zusammen und über die Rampe hinauf
// (levelLink 'weg'), nie über die Kante; die Treppe verbindet das Wegenetz nicht (nur zu Fuß). Viertel, Marktplätze, „verbundene Wege“,
// Wunsch „Weg“, Erreichbarkeit in der Nähe (hillRegions), Bauen/Erstatten/↶/Verschieben der Rampe, keine Dächer über ihr.
// Ohne Anhöhen fragt nichts davon nach (früh aussteigen)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewLen = 1; hillWalkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const put = (x, y, t) => game(`state.tiles.set('${x},${y}', ${JSON.stringify(t)}); recalc()`);
const V = (x, y) => game(`T.net.vOf('${x},${y}')`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i])(rampAt(${x}, ${y}))`);
// Anhöhe 10–13 × 10–13; Weg oben von 12,11 nach vorn bis 12,13 (Kante), unten von 12,14 (direkt vor der Wand) nach vorn bis 12,21
const TOP = [[12, 11], [12, 12], [12, 13]], BELOW = block(12, 15, 12, 21);
const scene = () => { hills(block(10, 10, 13, 13)); weg(TOP); weg(BELOW); };

describe('Wegenetz und Viertel', () => {
  it('Weg oben und Weg unten nebeneinander: getrennte Viertel, auch über Eck; ohne Anhöhe wären sie eins', () => {
    scene(); weg([[12, 14]]);
    expect([...TOP, ...BELOW, [12, 14]].every(([x, y]) => game(`bAt(${x}, ${y})`) === 'weg')).toBe(true);   // Wege oben gehen (Stufe 2)
    expect(V(12, 13)).not.toBe(V(12, 14));                                        // über die Kante
    expect(V(12, 14)).toBe(V(12, 21));
    expect(V(12, 11)).toBe(V(12, 13));
    put(13, 14, { b: 'brunnen', lvl: 1 });                                        // über Eck an 12,13 – trotzdem getrennt
    expect(V(13, 14)).toBe(V(12, 14));
    expect(V(13, 14)).not.toBe(V(12, 13));
    game('state.hills.clear(); recalc()');
    expect(V(12, 13)).toBe(V(12, 14));
  });

  it('mit Rampe verbunden (sie zählt wie ein Weg, nicht für die Größe des Viertels)', () => {
    scene();
    put(11, 11, { b: 'brunnen', lvl: 1 }); put(13, 21, { b: 'brunnen', lvl: 1 });  // je ein Brunnen oben und unten
    expect(game("build('huegelrampe', 12, 14)")).toBe(true);
    expect(ramp(12, 14)).toEqual(['12,14', 0, 1, 0]);
    expect(V(12, 13)).toBe(V(12, 15));
    expect(V(12, 14)).toBe(V(12, 11));
    expect(V(11, 11)).toBe(V(13, 21));
    expect(game("T.net.vSize.get(T.net.vOf('12,14'))")).toBe(2);
    expect(game("countsForViertel('huegelrampe')")).toBe(false);
  });

  it('Rampe der Länge 2 eingelassen: Fuß, oberes Feld und Anhöhe dahinter hängen zusammen', () => {
    hills(block(10, 10, 13, 13)); weg([[12, 11], [12, 14]]);
    game('rampNewLen = 2');
    expect(game("build('huegelrampe', 12, 12)")).toBe(true);                       // in den Rand: 12,13 Fuß, 12,12 oben
    expect([ramp(12, 13), ramp(12, 12)]).toEqual([['12,12', 0, 2, 0], ['12,12', 0, 2, 1]]);
    expect(V(12, 14)).toBe(V(12, 11));
  });

  it('Treppe verbindet das Wegenetz nicht – sie gehört zum Viertel unten', () => {
    scene();
    expect(game("build('huegeltreppe', 12, 14)")).toBe(true);
    expect(V(12, 14)).toBe(V(12, 15));
    expect(V(12, 13)).not.toBe(V(12, 15));
    expect(game('wegNetwork(12, 15).length')).toBe(BELOW.length);
  });

  it('„Alle verbundenen Wege“: je Ebene, über die Rampe weiter (die Rampe selbst ist kein Wegfeld)', () => {
    scene(); weg([[12, 14]]);
    expect(game('wegNetwork(12, 14).length')).toBe(BELOW.length + 1);
    expect(game('wegNetwork(12, 12).length')).toBe(TOP.length);
    game("state.tiles.delete('12,14'); recalc(); build('huegelrampe', 12, 14)");
    const all = game('wegNetwork(12, 21)');
    expect(all.length).toBe(BELOW.length + TOP.length);
    expect(all.some(([x, y]) => x === 12 && y === 14)).toBe(false);
  });

  it('Wunsch „Weg daneben“: nicht über die Kante, die Rampe zählt', () => {
    hills(block(10, 10, 13, 13)); weg([[11, 13]]);
    put(11, 14, { b: 'haus', lvl: 1 });
    expect(game("wishMet('weg', 11, 14)")).toBe(false);                            // Weg oben auf der Anhöhe dahinter
    weg([[10, 14]]);
    expect(game("wishMet('weg', 11, 14)")).toBe(true);
    game("state.tiles.delete('10,14'); state.tiles.delete('11,14'); recalc(); build('huegelrampe', 12, 14)");
    put(12, 15, { b: 'haus', lvl: 1 });                                            // vor dem Fuß
    expect(game("wishMet('weg', 12, 15)")).toBe(true);
    put(13, 14, { b: 'haus', lvl: 1 });                                            // neben der Rampe
    expect(game("wishMet('weg', 13, 14)")).toBe(false);
  });

  it('Marktplatz: oben und unten getrennt, über die Rampe ein Markt', () => {
    hills(block(10, 10, 13, 13)); weg(block(10, 11, 13, 11)); weg([[12, 12], [12, 13]]); weg(block(10, 15, 13, 15)); weg([[12, 14]]);
    for (const [x, y, b] of [[10, 11, 'stand_obst'], [11, 11, 'stand_brot'], [13, 11, 'stand_kaese'], [10, 15, 'stand_obst'], [11, 15, 'stand_brot'], [13, 15, 'stand_kaese']]) {
      expect(game(`placeError('${b}', ${x}, ${y})`)).toBe(null);                    // Stände auf dem Weg, auch oben
      expect(game(`build('${b}', ${x}, ${y}, true)`)).toBe(true);
    }
    game('recalc()');
    expect(game('MARKETS.map(m => m.stands.length).sort()')).toEqual([3, 3]);
    game("state.tiles.delete('12,14'); recalc(); build('huegelrampe', 12, 14); recalc()");
    expect(game('MARKETS.map(m => [m.stands.length, m.stage])')).toEqual([[6, 2]]);
  });
});

describe('Erreichbarkeit', () => {
  // Markt oben (3 Stände), Haus unten weit weg (mehr als 8 Felder) am Weg; der Weg führt bis direkt vor die Wand
  const market = () => {
    scene(); weg(block(10, 11, 13, 11)); weg([[12, 14]]);
    for (const [x, b] of [[10, 'stand_obst'], [11, 'stand_brot'], [13, 'stand_kaese']]) game(`build('${b}', ${x}, 11, true)`);
    put(12, 22, { b: 'haus', lvl: 1 });
  };
  it('Markt oben: ohne Rampe nicht erreichbar, über die Treppe auch nicht, über die Rampe im selben Viertel', () => {
    market();
    expect(game("wishCheck('markt', 12, 22)")).toEqual({ ok: false, how: null });
    game("state.tiles.delete('12,14'); recalc(); build('huegeltreppe', 12, 14); recalc()");
    expect(game("wishCheck('markt', 12, 22)")).toEqual({ ok: false, how: null });
    game("demolish(12, 14); build('huegelrampe', 12, 14); recalc()");
    expect(game("wishCheck('markt', 12, 22)")).toEqual({ ok: true, how: 'viertel' });
  });

  it('in der Nähe: nur, wenn man auf die Anhöhe kommt (irgendeine Rampe hinauf); Treppe zählt nicht', () => {
    market();
    put(15, 15, { b: 'haus', lvl: 1 });                                            // 4 Felder vom Markt, aber unten
    expect(game('hillRegions().get("12,11")')).toBeGreaterThan(0);
    expect(game("wishCheck('markt', 15, 15)")).toEqual({ ok: false, how: null });
    expect(game('nearMarket(15, 15)')).toBe(false);
    game("build('huegeltreppe', 14, 12); recalc()");
    expect(game("wishCheck('markt', 15, 15).ok")).toBe(false);
    game("build('huegelrampe', 10, 14); recalc()");                               // irgendwo hinauf, ohne Weg
    expect(game('hillRegions()')).toBe(null);                                     // alles erreichbar
    expect(game("wishCheck('markt', 15, 15)")).toEqual({ ok: true, how: 'nah' });
    expect(game('nearMarket(15, 15)')).toBe(true);
  });

  it('Park oben (Parkrasen mit Deko): in der Nähe nur über eine Rampe', () => {
    hills(block(10, 10, 13, 13));
    game("for (const [x, y] of [[10, 12], [11, 12], [10, 13], [11, 13]]) state.terra.set(x + ',' + y, 'park'); for (const [x, y] of [[10, 12], [11, 12], [10, 13]]) buildSmall('baum', x, y, 0); recalc()");
    expect(game('PARKS.length')).toBe(1);
    put(11, 16, { b: 'haus', lvl: 1 });
    expect(game('parkReach(T.access, 11, 16)')).toBe(null);
    game("build('huegelrampe', 12, 14); recalc()");
    expect(game('parkReach(T.access, 11, 16)')).toBe('nah');
  });
});

describe('Rampe bauen, erstatten, ↶, verschieben', () => {
  it('Preise: vor der Wand voll, eingelassen mit Erstattung (Länge 2: zwei Felder); Geldprüfung verrechnet; Abriss voll zurück', () => {
    hills(block(10, 10, 13, 13));
    const cost = game('ITEMS.huegelrampe.cost'), stein = game('ITEMS.huegelrampe.mat.stein'), back = game('ITEMS.anhoehe.cost');
    game('rampNewLen = 2; state.money = 60');
    expect(game("placeError('huegelrampe', 12, 14)")).toBe('Zu wenig Taler');      // vor der Wand: 200
    expect(game("placeError('huegelrampe', 12, 12)")).toBe(null);                  // ganz eingelassen: 200 − 160
    game('state.money = 10000');
    const s0 = game('state.res.stein');
    expect(game("build('huegelrampe', 12, 12)")).toBe(true);
    expect([game('state.money'), game('state.res.stein')]).toEqual([10000 - cost + 2 * back, s0 - stein]);
    expect([game('hillAt(12, 12)'), game('hillAt(12, 13)')]).toEqual([null, null]);
    expect(game('demolishInfo(12, 13)')).toMatchObject({ anchor: '12,12', refund: cost, full: true });
    game('demolish(12, 13)');
    expect([game('state.money'), game('state.res.stein'), ramp(12, 12), ramp(12, 13)]).toEqual([10000 + 2 * back, s0, null, null]);
    // Rechteck-Abriss: die ganze Rampe (beide Felder) oder rot, wenn sie hinausragt
    expect(game("build('huegelrampe', 11, 14)")).toBe(true);                       // vor der Wand, 11,15 Fuß
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 14 }, b: { x: 11, y: 15 } }");
    expect(game('(i => [i.things, i.gain])(planInfo(plan))')).toEqual([1, cost]);
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 15 }, b: { x: 11, y: 16 } }");
    expect(game('planInfo(plan).firstErr')).toMatch(/Ragt/);
    game('plan = null');
  });

  it('↶ in einem Schritt: eingelassene Rampe samt beiden Anhöhen-Feldern und Talern; Abriss zurück mit Länge 2', () => {
    hills(block(10, 10, 13, 13));
    const m0 = game('state.money');
    game("rampNewLen = 2; undoable(() => build('huegelrampe', 12, 12))");
    expect(game('undo()')).toBe(true);
    expect([!!game('hillAt(12, 12)'), !!game('hillAt(12, 13)'), ramp(12, 12), game('state.money')]).toEqual([true, true, null, m0]);
    game("undoable(() => build('huegelrampe', 11, 14))");
    const m1 = game('state.money');
    game('undoable(() => demolish(11, 15))');
    expect(game('undo()')).toBe(true);
    expect([ramp(11, 14), ramp(11, 15), game('state.money'), game("COVER.get('11,15')")]).toEqual([['11,14', 0, 2, 1], ['11,14', 0, 2, 0], m1, '11,14']);
  });

  it('Verschieben: behält die Länge, dreht sich zur Anhöhe, nie in eine Anhöhe; Gruppe dreht die Rampe mit; Kopie nicht in die Anhöhe', () => {
    hills(block(10, 10, 13, 13).concat(block(20, 10, 21, 13)));
    game("rampNewLen = 2; build('huegelrampe', 11, 14); rampNewLen = 1; setTool('verschieben')");
    game('pickUp(11, 15, 0)');
    expect(game("moveError(12, 12)")).toMatch(/Nur vor die Wand/);
    expect(game("placeRot('huegelrampe', 18, 11)")).toBe(1);                       // links vor der zweiten Anhöhe: hinauf nach +x
    game('dropAt(18, 11, 0)');
    expect([ramp(18, 11), ramp(19, 11), ramp(11, 14)]).toEqual([['18,11', 1, 2, 0], ['18,11', 1, 2, 1], null]);
    // Gruppe: Rampe (1 lang) mit Weg davor, eine Vierteldrehung → hinauf nach +x
    game("demolish(18, 11); build('huegelrampe', 12, 14); build('weg', 12, 15, true); recalc()");
    expect(game('pickUpGroup(12, 14, 12, 15)')).toBe(true);
    game('rotateGroup(1)');
    expect(game("groupPlaced(moving.items.find(it => it.t.b === 'huegelrampe')).t.rot")).toBe(1);
    expect(game('groupErrors(19, 12).first')).toBe(null);
    expect(game('dropGroup(19, 12)')).toBe(true);
    expect([ramp(19, 12), game("bAt(18, 12)")]).toEqual([['19,12', 1, 1, 0], 'weg']);
    // ⧉ Kopie: wie ein Neubau, aber nie in die Anhöhe eingelassen
    game('startCopy(19, 12, 19, 12)');
    expect(game('groupErrors(13, 12).first')).toMatch(/Nur vor die Wand/);
    expect(game('groupErrors(19, 13).first')).toBe(null);
    game("cancelMove(); setTool('look')");
  });

  it('keine Überdachung über der Rampe (einzeln und als Gruppe), keine Linie quer vor sie', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewLen = 2; build('huegelrampe', 12, 14)");
    expect(game("roofError(12, 15, true)")).toBe('Über einer Rampe geht keine Überdachung');
    expect(game("roofError(12, 14, true)")).toBe('Über einer Rampe geht keine Überdachung');
    game("build('dach', 17, 17, true); setTool('verschieben'); pickUpGroup(17, 17, 17, 17)");
    expect(game('groupErrors(12, 15).first')).toBe('Über einer Rampe geht keine Überdachung');
    game("cancelMove(); setTool('look')");
    expect(game("edgeError('zaun', edgeBetween(12, 15, 12, 16))")).toMatch(/quer vor die Rampe/);
    expect(game("edgeError('zaun', edgeBetween(12, 14, 12, 15))")).toMatch(/quer über die Rampe/);
  });
});

describe('Wege oben bauen, Pinsel über die Kante', () => {
  it('Linie von unten über die Anhöhe: alle Felder werden gebaut, aber nicht verbunden; die Rampe bleibt rot', () => {
    hills(block(10, 10, 13, 13));
    game("setTool('weg'); startPlan('line', { x: 11, y: 17 }, { x: 11, y: 8 }, true)");
    const info = game('(i => [i.n, i.bad, i.err])(planInfo(plan))');
    expect(info).toEqual([10, 0, null]);
    game('runPlan()');
    expect(block(11, 8, 11, 17).every(([x, y]) => game(`wegAt(${x}, ${y})`) != null)).toBe(true);
    expect([game('wegNetwork(11, 17).length'), game('wegNetwork(11, 12).length'), game('wegNetwork(11, 8).length')]).toEqual([4, 4, 2]);
    // mit Rampe in der Linie: nur dieses Feld geht nicht
    game("build('huegelrampe', 13, 14); startPlan('line', { x: 13, y: 17 }, { x: 13, y: 11 }, true)");   // zwei Felder neben der ersten Linie
    const s = game("(i => [i.states.get('13,14'), i.states.get('13,15'), i.states.get('13,13'), i.n, i.firstErr])(planInfo(plan))");
    expect(s).toEqual(['bad', 'ok', 'ok', 6, 'Auf der Rampe geht kein Weg – davor schon']);
    game('runPlan(); setTool("look")');
    expect(game('wegNetwork(13, 17).length')).toBe(6);                             // über die Rampe verbunden
  });

  it('Gebäude weiter nicht oben; Häuser drehen die Tür nicht zum Weg oben auf der Anhöhe', () => {
    hills(block(10, 10, 13, 13)); weg([[11, 13]]);
    expect(game("placeError('haus', 11, 12)")).toMatch(/Gebäude auf Anhöhen/);
    game('buildRot = 0');
    expect(game("FRONT_DIR[placeRot('haus', 11, 14)]")).not.toEqual([0, -1]);        // Weg oben dahinter zählt nicht
    weg([[11, 15]]);
    expect(game("FRONT_DIR[placeRot('haus', 11, 14)]")).toEqual([0, 1]);
  });
});

describe('Laufen und ohne Anhöhen', () => {
  it('edgeBlocks: zu Fuß über Treppe und Rampe längs, nicht seitlich, nie die Wand hinauf', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegeltreppe', 14, 11); build('huegelrampe', 12, 14)");
    const B = (a, b, c, d) => !!game(`edgeBlocks(${a}, ${b}, ${c}, ${d})`);
    expect([B(15, 11, 14, 11), B(14, 11, 13, 11), B(14, 12, 14, 11), B(14, 12, 13, 12)]).toEqual([false, false, true, true]);
    expect([B(12, 15, 12, 14), B(12, 14, 12, 13), B(11, 14, 12, 14), B(11, 14, 11, 13)]).toEqual([false, false, true, true]);
    expect([B(5, 5, 6, 5), B(11, 11, 12, 11)]).toEqual([false, false]);
  });

  it('ohne Anhöhen fragt das Netz nie nach Rampen und Ebenen (früh aussteigen)', () => {
    weg(block(6, 8, 14, 8)); put(10, 9, { b: 'haus', lvl: 1 });
    for (const [x, b] of [[6, 'stand_obst'], [7, 'stand_brot'], [8, 'stand_kaese']]) game(`build('${b}', ${x}, 8, true)`);
    const out = game(`(() => {
      const keep = { levelLink, rampAt, rampFresh };
      const boom = () => { throw new Error('ohne Anhöhen gefragt'); };
      levelLink = rampAt = rampFresh = boom;
      try {
        recalc();
        return [T.net.vOf('6,8') === T.net.vOf('14,8'), wegNetwork(6, 8).length, wishMet('weg', 10, 9), MARKETS.length, wishCheck('markt', 10, 9).how,
          placeError('weg', 15, 8), !!edgeBlocks(5, 5, 6, 5), armsWith(10, 8).length, hillRegions(), placeRot('haus', 12, 9)];
      } finally { levelLink = keep.levelLink; rampAt = keep.rampAt; rampFresh = keep.rampFresh; }
    })()`);
    expect(out).toEqual([true, 9, true, 1, 'nah', null, false, 2, null, game("placeRot('haus', 12, 9)")]);
  });
});
