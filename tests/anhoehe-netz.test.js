const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2 – Netz, Regeln, Bauen (rules.js, actions.js): Wege hängen nur auf gleicher Ebene zusammen und über die Treppe hinauf
// (levelLink 'weg', Nutzer 10.10.2026), nie über die Kante und nie über die Gleis-Rampe (die ist nur für Züge). Viertel, Marktplätze, „verbundene
// Wege“, Wunsch „Weg“, Erreichbarkeit in der Nähe (hillRegions), Bauen/Erstatten/↶/Verschieben der Gleis-Rampe, keine Dächer über ihr.
// Ohne Anhöhen fragt nichts davon nach (früh aussteigen)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const put = (x, y, t) => game(`state.tiles.set('${x},${y}', ${JSON.stringify(t)}); recalc()`);
const V = (x, y) => game(`T.net.vOf('${x},${y}')`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i])(rampAt(${x}, ${y}))`);
const form = f => game(`rampNewForm = '${f}'`);
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

  it('Gleis-Rampe verbindet keine Wege (nur Züge): weder eingelassen (A) noch vor der Wand (B); sie gehört zu keinem Viertel', () => {
    scene();
    put(11, 11, { b: 'brunnen', lvl: 1 }); put(13, 21, { b: 'brunnen', lvl: 1 });  // je ein Brunnen oben und unten
    form('a');
    expect(game("build('huegelrampe', 10, 12)")).toBe(true);                       // A in den Rand: 10,12 oben, 10,13 Fuß
    expect([ramp(10, 13), ramp(10, 12)]).toEqual([['10,12', 0, 2, 0], ['10,12', 0, 2, 1]]);
    weg([[10, 14], [10, 15], [10, 11]]);
    expect(V(10, 14)).not.toBe(V(10, 11));
    expect(game("[levelLink(10, 14, 10, 13, 'weg'), levelLink(10, 12, 10, 11, 'weg'), levelLink(10, 14, 10, 13, 'fuss'), levelLink(10, 14, 10, 13, 'fahr')]")).toEqual([false, false, false, false]);
    form('b');
    expect(game("build('huegelrampe', 13, 14)")).toBe(true);                       // B davor: 13,14 oben … 13,16 Fuß
    weg([[13, 17], [13, 13]]);
    expect(V(13, 17)).toBe(V(12, 21));                                             // unten ein Viertel (über 12,17) …
    expect(V(13, 17)).not.toBe(V(12, 11));                                         // … nicht mit oben
    expect(V(11, 11)).not.toBe(V(13, 21));
    expect(game("[T.net.vOf('13,15'), T.net.vOf('10,13'), countsForViertel('huegelrampe'), slopeWegAt(13, 15)]")).toEqual([null, null, false, false]);
  });

  it('Treppe verbindet das Wegenetz wie die Rampe (schmal und breit; zählt wie ein Weg, nicht für die Größe des Viertels)', () => {
    scene();
    put(11, 11, { b: 'brunnen', lvl: 1 }); put(13, 21, { b: 'brunnen', lvl: 1 });  // je ein Brunnen oben und unten
    expect(game("build('huegeltreppe', 12, 14)")).toBe(true);
    expect(game("stairSchmal(stairAt(12, 14))")).toBe(true);                       // neu: wie die Wegform (schmal)
    expect(V(12, 14)).toBe(V(12, 15));
    expect(V(12, 13)).toBe(V(12, 15));
    expect(V(11, 11)).toBe(V(13, 21));
    expect(game("T.net.vSize.get(T.net.vOf('12,14'))")).toBe(2);
    expect(game("countsForViertel('huegeltreppe')")).toBe(false);
    expect(game('wegNetwork(12, 15).length')).toBe(BELOW.length + TOP.length);
    game("delete state.tiles.get('12,14').schmal; groundVersion++; recalc()");     // breit genauso
    expect(V(12, 13)).toBe(V(12, 15));
    // nicht über Eck und nicht von der Seite (wie die Rampe)
    put(13, 15, { b: 'brunnen', lvl: 1 }); game("state.tiles.delete('12,15'); recalc()");
    expect(V(13, 15)).not.toBe(V(12, 14));
    put(11, 14, { b: 'brunnen', lvl: 1 });
    expect(V(11, 14)).not.toBe(V(12, 14));
  });

  it('„Alle verbundenen Wege“: je Ebene, nie über die Gleis-Rampe', () => {
    hills(block(10, 10, 13, 13)); weg([[11, 11], [11, 10]]); weg(block(11, 14, 11, 18));
    form('a'); game("build('huegelrampe', 11, 12)");                                // 11,12 oben, 11,13 Fuß: zwischen den Wegen
    expect(game('[wegNetwork(11, 18).length, wegNetwork(11, 10).length]')).toEqual([5, 2]);
    expect(game('wegNetwork(11, 14).some(([x, y]) => x === 11 && y < 14)')).toBe(false);
  });

  it('Wunsch „Weg daneben“: nicht über die Kante, die Treppe zählt (längs), die Gleis-Rampe nie', () => {
    hills(block(10, 10, 13, 13)); weg([[11, 13]]);
    put(11, 14, { b: 'haus', lvl: 1 });
    expect(game("wishMet('weg', 11, 14)")).toBe(false);                            // Weg oben auf der Anhöhe dahinter
    weg([[10, 14]]);
    expect(game("wishMet('weg', 11, 14)")).toBe(true);
    game("state.tiles.delete('10,14'); state.tiles.delete('11,14'); recalc(); build('huegeltreppe', 12, 14)");
    put(12, 15, { b: 'haus', lvl: 1 });                                            // vor dem Fuß
    expect(game("wishMet('weg', 12, 15)")).toBe(true);
    put(13, 14, { b: 'haus', lvl: 1 });                                            // neben der Treppe
    expect(game("wishMet('weg', 13, 14)")).toBe(false);
    game("demolish(12, 14); state.tiles.delete('12,15'); recalc()");
    form('b'); game("build('huegelrampe', 12, 14)");                               // Gleis-Rampe: 12,14 … 12,16
    put(12, 17, { b: 'haus', lvl: 1 });
    expect(game("[wishMet('weg', 12, 17), wishMet('weg', 13, 14)]")).toEqual([false, false]);
  });

  it('Marktplatz: oben und unten getrennt, über die Treppe ein Markt', () => {
    hills(block(10, 10, 13, 13)); weg(block(10, 11, 13, 11)); weg([[12, 12], [12, 13]]); weg(block(10, 15, 13, 15)); weg([[12, 14]]);
    for (const [x, y, b] of [[10, 11, 'stand_obst'], [11, 11, 'stand_brot'], [13, 11, 'stand_kaese'], [10, 15, 'stand_obst'], [11, 15, 'stand_brot'], [13, 15, 'stand_kaese']]) {
      expect(game(`placeError('${b}', ${x}, ${y})`)).toBe(null);                    // Stände auf dem Weg, auch oben
      expect(game(`build('${b}', ${x}, ${y}, true)`)).toBe(true);
    }
    game('recalc()');
    expect(game('MARKETS.map(m => m.stands.length).sort()')).toEqual([3, 3]);
    game("state.tiles.delete('12,14'); recalc(); build('huegeltreppe', 12, 14); recalc()");
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
  it('Markt oben: ohne Aufgang nicht erreichbar, über Treppe (schmal oder breit) im selben Viertel, über die Gleis-Rampe nie; ein Markt über die Treppe', () => {
    market();
    expect(game("wishCheck('markt', 12, 22)")).toEqual({ ok: false, how: null });
    game("state.tiles.delete('12,14'); recalc(); build('huegeltreppe', 12, 14); recalc()");
    expect(game("wishCheck('markt', 12, 22)")).toEqual({ ok: true, how: 'viertel' });
    game("stairNewWide = true; demolish(12, 14); build('huegeltreppe', 12, 14); stairNewWide = null; recalc()");
    expect([game("stairSchmal(stairAt(12, 14))"), game("wishCheck('markt', 12, 22)")]).toEqual([false, { ok: true, how: 'viertel' }]);
    game("demolish(12, 14); state.tiles.delete('12,15'); state.tiles.delete('12,16'); recalc(); rampNewForm = 'b'; build('huegelrampe', 12, 14); build('weg', 12, 17, true); recalc()");
    expect([ramp(12, 16), game("wishCheck('markt', 12, 22)")]).toEqual([['12,14', 0, 3, 0], { ok: false, how: null }]);   // Gleis-Rampe: nur Züge
    // Stände oben und unten hängen über die Treppe zu einem Markt zusammen
    game("demolish(12, 14); build('weg', 12, 15, true); build('weg', 12, 16, true); build('huegeltreppe', 12, 14); for (const [x, b] of [[10, 'stand_obst'], [11, 'stand_brot'], [13, 'stand_kaese']]) { build('weg', x, 15, true); build(b, x, 15, true); } recalc()");
    expect(game('MARKETS.map(m => m.stands.length)')).toEqual([6]);
  });

  it('in der Nähe: nur, wenn man auf die Anhöhe kommt (irgendeine Treppe hinauf – die Gleis-Rampe nicht)', () => {
    market();
    put(15, 15, { b: 'haus', lvl: 1 });                                            // 4 Felder vom Markt, aber unten
    expect(game('hillRegions().get("12,11")')).toBeGreaterThan(0);
    expect(game("wishCheck('markt', 15, 15)")).toEqual({ ok: false, how: null });
    expect(game('nearMarket(15, 15)')).toBe(false);
    game("build('huegeltreppe', 14, 12); recalc()");                              // Treppe hinauf, ohne Weg
    expect(game('hillRegions()')).toBe(null);
    expect(game("wishCheck('markt', 15, 15)")).toEqual({ ok: true, how: 'nah' });
    game("demolish(14, 12); recalc()");
    expect(game("wishCheck('markt', 15, 15).ok")).toBe(false);
    game("build('huegelrampe', 10, 12); recalc()");                               // Gleis-Rampe A in den Rand: führt nur Züge hinauf
    expect(game('!!rampAt(10, 13) && hillRegions() !== null')).toBe(true);
    expect(game("wishCheck('markt', 15, 15).ok")).toBe(false);
    game("build('huegeltreppe', 11, 14); recalc()");                              // irgendwo eine Treppe hinauf, ohne Weg
    expect(game('hillRegions()')).toBe(null);                                     // alles erreichbar
    expect(game("wishCheck('markt', 15, 15)")).toEqual({ ok: true, how: 'nah' });
    expect(game('nearMarket(15, 15)')).toBe(true);
  });

  it('Park oben (Parkrasen mit Deko): in der Nähe nur über eine Treppe, nicht über die Gleis-Rampe', () => {
    hills(block(10, 10, 13, 13));
    game("for (const [x, y] of [[10, 12], [11, 12], [10, 13], [11, 13]]) state.terra.set(x + ',' + y, 'park'); for (const [x, y] of [[10, 12], [11, 12], [10, 13]]) buildSmall('baum', x, y, 0); recalc()");
    expect(game('PARKS.length')).toBe(1);
    put(11, 16, { b: 'haus', lvl: 1 });
    expect(game('parkReach(T.access, 11, 16)')).toBe(null);
    form('b'); game("build('huegelrampe', 12, 14); recalc()");
    expect([ramp(12, 16), game('parkReach(T.access, 11, 16)')]).toEqual([['12,14', 0, 3, 0], null]);
    game("demolish(12, 14); build('huegeltreppe', 12, 14); recalc()");
    expect(game('parkReach(T.access, 11, 16)')).toBe('nah');
  });
});

describe('Gleis-Rampe bauen, erstatten, ↶, verschieben', () => {
  it('Preise je Form: vor der Wand voll (B), eingelassen mit Erstattung (A: zwei Felder); Geldprüfung verrechnet; Abriss voll zurück', () => {
    hills(block(10, 10, 13, 13));
    const A = game('RAMP_FORMS.a'), B = game('RAMP_FORMS.b'), back = game('ITEMS.anhoehe.cost');
    form('b'); game(`state.money = ${A.cost - 2 * back + 10}`);
    expect(game("placeError('huegelrampe', 12, 14)")).toBe('Zu wenig Taler');      // B vor der Wand: voller Preis
    form('a');
    expect(game("placeError('huegelrampe', 12, 12)")).toBe(null);                  // A eingelassen: Preis − 2 Anhöhen
    game('state.money = 10000');
    const s0 = game('state.res.stein');
    expect(game("build('huegelrampe', 12, 12)")).toBe(true);
    expect([game('state.money'), game('state.res.stein')]).toEqual([10000 - A.cost + 2 * back, s0 - A.mat.stein]);
    expect([game('hillAt(12, 12)'), game('hillAt(12, 13)')]).toEqual([null, null]);
    expect(game('demolishInfo(12, 13)')).toMatchObject({ anchor: '12,12', refund: A.cost, full: true });
    game('demolish(12, 13)');
    expect([game('state.money'), game('state.res.stein'), ramp(12, 12), ramp(12, 13)]).toEqual([10000 + 2 * back, s0, null, null]);
    expect([game('hillLevel(12, 12)'), game('hillLevel(12, 13)')]).toEqual([0, 0]);  // abgesenkt bleibt unten
    // Rechteck-Abriss: die ganze Rampe (alle drei Felder von B) oder rot, wenn sie hinausragt
    form('b');
    expect(game("build('huegelrampe', 11, 14)")).toBe(true);                       // vor der Wand: 11,14 oben … 11,16 Fuß
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 14 }, b: { x: 11, y: 16 } }");
    expect(game('(i => [i.things, i.gain])(planInfo(plan))')).toEqual([1, B.cost]);
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 15 }, b: { x: 11, y: 17 } }");
    expect(game('planInfo(plan).firstErr')).toMatch(/Ragt/);
    game('plan = null');
  });

  it('↶ in einem Schritt: eingelassene Rampe A samt beiden Anhöhen-Feldern und Talern; Abriss von B zurück mit allen drei Feldern', () => {
    hills(block(10, 10, 13, 13));
    const m0 = game('state.money');
    game("undoable(() => build('huegelrampe', 12, 12))");
    expect(ramp(12, 13)).toEqual(['12,12', 0, 2, 0]);
    expect(game('undo()')).toBe(true);
    expect([!!game('hillAt(12, 12)'), !!game('hillAt(12, 13)'), ramp(12, 12), game('state.money')]).toEqual([true, true, null, m0]);
    form('b'); game("undoable(() => build('huegelrampe', 11, 14))");
    const m1 = game('state.money');
    game('undoable(() => demolish(11, 15))');
    expect(ramp(11, 16)).toBe(null);
    expect(game('undo()')).toBe(true);
    expect([ramp(11, 14), ramp(11, 16), game('state.money'), game("COVER.get('11,16')")]).toEqual([['11,14', 0, 3, 2], ['11,14', 0, 3, 0], m1, '11,14']);
  });

  it('Verschieben: behält die Form, dreht sich zur Anhöhe; getragen nie in eine Anhöhe (nur zurück in den eigenen Einschnitt); Kopie auch nicht', () => {
    hills(block(10, 10, 13, 13).concat(block(20, 10, 21, 13)));
    form('b'); game("build('huegelrampe', 11, 14); rampNewForm = 'a'; setTool('verschieben')");   // die Leiste zeigt eine andere Form
    game('pickUp(11, 15, 0)');
    expect(game('moving.t.form')).toBe('b');
    expect(game("moveError(12, 12)")).toMatch(/Damm B steht unten vor der Wand/);
    expect(game("placeRot('huegelrampe', 17, 11)")).toBe(1);                       // links vor der zweiten Anhöhe: hinauf nach +x
    game('dropAt(17, 11, 0)');
    expect([ramp(17, 11), ramp(19, 11), ramp(11, 14)]).toEqual([['17,11', 1, 3, 0], ['17,11', 1, 3, 2], null]);
    // A getragen: nicht in den Rand einer Anhöhe (Ablegen senkt nichts ab), zurück in den eigenen Einschnitt schon
    game("cancelMove(); setTool('look'); build('huegelrampe', 12, 12); setTool('verschieben'); pickUp(12, 13, 0)");
    expect(game('moving.t.form')).toBe('a');
    expect(game('moveError(10, 12)')).toMatch(/Nur in einen schon vorhandenen Einschnitt/);
    expect(game('moveError(12, 12)')).toBe(null);
    game('cancelMove()');
    expect(ramp(12, 13)).toEqual(['12,12', 0, 2, 0]);
    // ⧉ Kopie: wie ein Neubau, aber nie in die Anhöhe eingelassen
    game('startCopy(12, 12, 12, 13)');
    expect(game('groupErrors(10 + moving.cx, 12 + moving.cy).first')).toMatch(/Nur in einen schon vorhandenen Einschnitt/);
    game("cancelMove(); setTool('look')");
  });

  it('keine Überdachung über der Gleis-Rampe (einzeln und als Gruppe), keine Linie quer vor sie', () => {
    hills(block(10, 10, 13, 13));
    form('b'); game("build('huegelrampe', 12, 14)");                               // 12,14 oben … 12,16 Fuß
    expect(game("roofError(12, 15, true)")).toBe('Über einer Gleis-Rampe geht keine Überdachung');
    expect(game("roofError(12, 14, true)")).toBe('Über einer Gleis-Rampe geht keine Überdachung');
    game("build('dach', 17, 17, true); setTool('verschieben'); pickUpGroup(17, 17, 17, 17)");
    expect(game('groupErrors(12, 15).first')).toBe('Über einer Gleis-Rampe geht keine Überdachung');
    game("cancelMove(); setTool('look')");
    expect(game("edgeError('zaun', edgeBetween(12, 16, 12, 17))")).toMatch(/quer vor die Gleis-Rampe/);
    expect(game("edgeError('zaun', edgeBetween(12, 14, 12, 15))")).toMatch(/quer über die Gleis-Rampe/);
    expect(game("edgeError('zaun', edgeBetween(12, 15, 13, 15))")).toBe(null);   // an die Seite schon
  });
});

describe('Wege oben bauen, Pinsel über die Kante', () => {
  it('Linie von unten über die Anhöhe: alle Felder werden gebaut, aber nicht verbunden; die Gleis-Rampe bleibt rot', () => {
    hills(block(10, 10, 13, 13));
    game("setTool('weg'); startPlan('line', { x: 11, y: 17 }, { x: 11, y: 8 }, true)");
    const info = game('(i => [i.n, i.bad, i.err])(planInfo(plan))');
    expect(info).toEqual([10, 0, null]);
    game('runPlan()');
    expect(block(11, 8, 11, 17).every(([x, y]) => game(`wegAt(${x}, ${y})`) != null)).toBe(true);
    expect([game('wegNetwork(11, 17).length'), game('wegNetwork(11, 12).length'), game('wegNetwork(11, 8).length')]).toEqual([4, 4, 2]);
    // mit Gleis-Rampe in der Linie: ihre Felder gehen nicht, verbunden wird nichts
    game("build('huegelrampe', 13, 12); startPlan('line', { x: 13, y: 17 }, { x: 13, y: 11 }, true)");   // A: 13,12 oben, 13,13 Fuß
    const s = game("(i => [i.states.get('13,13'), i.states.get('13,12'), i.states.get('13,14'), i.states.get('13,11'), i.n, i.firstErr])(planInfo(plan))");
    expect(s).toEqual(['bad', 'bad', 'ok', 'ok', 5, 'Auf der Gleis-Rampe geht kein Weg, über die Schiene davor schon']);
    game('runPlan(); setTool("look")');
    expect([game('wegNetwork(13, 17).length'), game('wegNetwork(13, 11).length')]).toEqual([4, 1]);   // nicht über die Rampe verbunden
  });

  it('Gebäude oben (Stufe 3, 157j); Häuser drehen die Tür nicht zum Weg oben auf der Anhöhe', () => {
    hills(block(10, 10, 13, 13)); weg([[11, 13]]);
    expect(game("placeError('haus', 11, 12)")).toBe(null);                          // Stufe 3 (157j): Gebäude oben
    game('buildRot = 0');
    expect(game("FRONT_DIR[placeRot('haus', 11, 14)]")).not.toEqual([0, -1]);        // Weg oben dahinter zählt nicht
    weg([[11, 15]]);
    expect(game("FRONT_DIR[placeRot('haus', 11, 14)]")).toEqual([0, 1]);
  });
});

describe('Laufen und ohne Anhöhen', () => {
  it('edgeBlocks: zu Fuß über die Treppe längs, nicht seitlich, nie die Wand hinauf; über die Gleis-Rampe nie', () => {
    hills(block(10, 10, 13, 13));
    form('b'); game("build('huegeltreppe', 14, 11); build('huegelrampe', 12, 14)");   // Gleis-Rampe B: 12,14 oben … 12,16 Fuß
    const B = (a, b, c, d) => !!game(`edgeBlocks(${a}, ${b}, ${c}, ${d})`);
    expect([B(15, 11, 14, 11), B(14, 11, 13, 11), B(14, 12, 14, 11), B(14, 12, 13, 12)]).toEqual([false, false, true, true]);
    expect([B(12, 17, 12, 16), B(12, 16, 12, 15), B(12, 14, 12, 13), B(11, 14, 12, 14), B(12, 13, 12, 14)]).toEqual([true, true, true, true, true]);
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
