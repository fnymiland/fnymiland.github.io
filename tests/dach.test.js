const { loadGame, game } = require('./helpers/load-game');

// Block 138: Überdachungen – Fläche über Wegen (auch 2–3 breit), Stützen stellt man selbst
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.paintNew.dach = {}; chosenStyle.weg = 'sand'; recalc(); resetUndo()");
});
const way = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true)`);
const roof = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('dach', x, y, true)`);
const row = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);

describe('Überdachungen (Block 138)', () => {
  it('über Wege, Wiese und Deko – nicht über Gebäude oder Wasser; kostet, gibt beim Abreißen alles zurück, der Weg bleibt', () => {
    way(row(2, 5, 5));
    expect(game("placeError('dach', 2, 7)")).toBe(null);                              // Wiese geht (Nutzer: nicht zwingend Weg)
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); state.terra.set('9,9', 'water'); recalc()");
    expect(game("placeError('dach', 8, 8)")).toMatch(/Nicht über Gebäude/);
    expect(game("placeError('dach', 9, 9)")).toBe('Nicht übers Wasser');
    game("build('dach', 2, 7, true)");
    expect(game("placeError('haus', 2, 7)")).toMatch(/Überdachung/);                 // unter ein Dach kein Haus
    game("demolish(2, 7)");
    const m = game('state.money');
    roof(row(2, 5, 5));
    expect(game('state.roofs.size')).toBe(4);
    expect(game('state.money')).toBe(m - 4 * game('ITEMS.dach.cost'));
    expect(game("placeError('dach', 3, 5)")).toBe('Hier ist schon so ein Dach');
    expect(game("demolishInfo(3, 5).label")).toBe('Überdachung entfernen');
    game('demolish(3, 5)');
    expect(game("state.roofs.has('3,5')")).toBe(false);
    expect(game("state.tiles.get('3,5').b")).toBe('weg');                           // erst das Dach, der Weg bleibt
    expect(game('state.money')).toBe(m - 3 * game('ITEMS.dach.cost'));
  });

  it('als Fläche ziehen wie Wege (Rechteck); schon gleich gedeckte Felder zählen nicht', () => {
    for (let y = 4; y <= 6; y++) way(row(3, 6, y));
    game("setTool('dach'); startPlan('rect', { x: 3, y: 4 }, { x: 6, y: 6 }, true)");
    const info = game('(() => { const i = planInfo(plan); return { n: i.order.length, err: i.firstErr }; })()');
    expect(info).toEqual({ n: 12, err: null });
    game('(() => { for (const [, , run] of planInfo(plan).order) run(); cancelPlan(); })()');
    expect(game('state.roofs.size')).toBe(12);
    game("startPlan('rect', { x: 3, y: 4 }, { x: 6, y: 6 }, true)");
    expect(game('planInfo(plan).order.length')).toBe(0);
    game("cancelPlan(); setTool('look')");
  });

  it('Teilstücke: Mitte immer, Rand nur zum gedeckten Nachbarn, Ecke nur mit beiden Nachbarn und dem schrägen – nichts überlappt', () => {
    // L aus einem schmalen Gang (5,5)-(6,5)-(6,6) und daneben ein 2×2-Block (10..11, 5..6)
    way([[5, 5], [6, 5], [6, 6], [10, 5], [11, 5], [10, 6], [11, 6]]); roof([[5, 5], [6, 5], [6, 6], [10, 5], [11, 5], [10, 6], [11, 6]]);
    const sub = (su, sv) => game(`roofArea(roofCov(roofAt(5, 5))).sub(${su}, ${sv})`);
    expect(sub(15, 15)).toBe(true);                                                  // Mitte von 5,5
    expect(sub(16, 15)).toBe(true);                                                  // Rand Richtung 6,5
    expect(sub(15, 16)).toBe(false);                                                 // Rand nach unten: dort kein Dach
    expect(sub(17, 16)).toBe(false);                                                 // Innenecke der Kurve bei 6,5 bleibt frei
    expect(sub(31, 16)).toBe(true);                                                  // 2×2-Block: Ecke zwischen allen vier gedeckt
    // jeder Punkt gehört höchstens zu einem Feld: die Teilstück-Grenzen berühren sich nur
    expect(game('[roofHi(15), roofLo(16), roofHi(16), roofLo(17)]')).toEqual([5.42, 5.42, 5.5, 5.5]);
  });

  it('andere Form = eigene Fläche; Umstellen im Fenster für dieses Feld oder alle verbundenen', () => {
    way(row(3, 8, 5)); roof(row(3, 8, 5));
    game('openInfo(4, 5)');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Überdachung.*Alle verbundenen \(6\)/s);
    game("state.design.add('dach:form:glas'); openInfo(4, 5); document.querySelector('[data-roofform=\"1\"]').click()");
    expect(game("[...state.roofs.values()].map(r => r.form || 0)")).toEqual([0, 1, 0, 0, 0, 0]);
    expect(game('roofCov(roofAt(4, 5))(5, 5)')).toBe(false);                         // Glas und Pergola wachsen nicht zusammen
    game("document.querySelector('[data-roofscope=\"run\"]').click(); document.querySelector('[data-roofform=\"1\"]').click()");
    expect(game("[...state.roofs.values()].every(r => r.form === 1)")).toBe(true);
    game('undo()');
    expect(game("[...state.roofs.values()].map(r => r.form || 0)")).toEqual([0, 1, 0, 0, 0, 0]);
  });

  it('Stützen: stehen genau unter der Dachkante, sehen aus wie das Dach darüber, auch auf dem Punkt zwischen vier Feldern', () => {
    way(row(3, 6, 5));
    game("state.paintNew.dach = { form: 3 }; state.design.add('dach:form:arkaden')"); roof(row(3, 6, 5));
    expect(game("buildSmall('stuetze', 4, 5, 5)")).toBe(true);                       // Seitenmitte am Wegrand
    expect(game("buildSmall('stuetze', 4, 5, 0)")).toBe(true);                       // Ecke
    expect(game("buildSmall('stuetze', 5, 5, VSLOT)")).toBe(true);                   // Eckpunkt
    const at = game("[slotPos(4, 5, 5, state.decos.get('4,5')[5]), slotPos(4, 5, 0, state.decos.get('4,5')[0])]");
    expect(at[0][1]).toBeCloseTo(-game('RW'), 6);
    expect(at[1].map(Math.abs)).toEqual([game('RW'), game('RW')]);
    expect(game('pillarForm(4, 5, 0, -RW)')).toBe(3);                                 // Arkaden-Pfeiler
    expect(game('pillarForm(9, 9, 0, 0)')).toBe(0);                                   // ohne Dach: Holzpfosten
    // Arkaden: Bögen spannen sich zwischen den Stützen der Kante
    const e = game("(() => { const A = roofArea(roofCov(roofAt(4, 5))); const e = roofEdges(A, 4, 5).find(e => e.ax === 'v' && e.n < 0); const [a, b] = roofRun(A, e); return { a, b, p: roofPillarsOn(e, a, b) }; })()");
    expect(e.a).toBeCloseTo(2.58, 6); expect(e.b).toBeCloseTo(6.42, 6);       // Gang-Enden: Dachkante bei Feldmitte ± RW
    expect(e.p.map(v => +v.toFixed(2)).sort()).toEqual([3.58, 4, 4.5]);   // auch die vom Eckpunkt (an die Kante gerückt)
  });

  it('Antippen trifft das Dach, das man sieht (nicht das Feld dahinter); 🧹 dort nimmt nur das Dach; Schatten am Boden', () => {
    way(row(3, 6, 5)); way(row(3, 6, 4)); roof(row(3, 6, 5));
    game('cam = state.cam; cam.z = 2; { const p = iso(5, 5); cam.x = p.x; cam.y = p.y; }');
    // Bildschirmpunkt auf dem Dach über 4,5 – am Boden läge dort 4,4 (ein Weg ohne Dach)
    const s = game('(() => { const p = toScreen(4, 5); return [p.x, p.y - ROOF_H * cam.z]; })()');
    expect(game(`toTile(${s[0]}, ${s[1]})`)).not.toEqual({ x: 4, y: 5 });
    expect(game(`roofPick(${s[0]}, ${s[1]})`)).toEqual({ x: 4, y: 5 });
    game(`setTool('abriss'); setHover(${s[0]}, ${s[1]})`);
    expect(game('[hover.x, hover.y]')).toEqual([4, 5]);
    game(`tap(${s[0]}, ${s[1]}, false); tap(${s[0]}, ${s[1]}, false)`);
    expect(game("[state.roofs.has('4,5'), bAt(4, 5), bAt(4, 4)]")).toEqual([false, 'weg', 'weg']);   // Dach weg, beide Wege bleiben
    game("setTool('look')");
    // Schatten: gezeichnet, mit der Sonne verschoben
    const n = game("(() => { let n = 0; const f = g.fill; g.fill = (...a) => { n++; return f.apply(g, a); }; try { drawRoofShadows(() => true); } finally { g.fill = f; } return n; })()");
    expect(n).toBe(1);
  });

  it('🧹 auf eine Stütze entfernt nur die Stütze, nicht das Dach (Nutzer); 👆 öffnet ihr Fenster', () => {
    way(row(3, 6, 5)); roof(row(3, 6, 5));
    game("buildSmall('stuetze', 4, 5, 7)");                                           // vordere Seitenmitte von 4,5
    game('cam = state.cam; cam.z = 2.5; { const p = iso(5, 5); cam.x = p.x; cam.y = p.y; }');
    const mid = game("(() => { const d = state.decos.get('4,5')[7], [u, v] = pillarPos(4, 5, 7, d), p = toScreen(u, v); return [p.x, p.y - ROOF_H * cam.z * 0.5]; })()");   // halbe Höhe am Pfosten
    expect(game(`pillarAt(${mid[0]}, ${mid[1]})`)).toMatchObject({ x: 4, y: 5, slot: 7 });
    game(`setTool('abriss'); setHover(${mid[0]}, ${mid[1]})`);
    expect(game('[hover.x, hover.y, hoverSlot]')).toEqual([4, 5, 7]);
    game(`tap(${mid[0]}, ${mid[1]}, false)`);
    expect(game("[!!(state.decos.get('4,5') || [])[7], state.roofs.has('4,5')]")).toEqual([false, true]);   // Stütze weg, Dach bleibt
    game("buildSmall('stuetze', 4, 5, 7); setTool('look')");
    game(`tap(${mid[0]}, ${mid[1]}, false)`);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Stütze/);
    game('closePanel()');
  });

  it('unter eine Überdachung darf man nachträglich einen Weg ziehen (Nutzer); das Dach bleibt', () => {
    roof(row(3, 6, 9));
    expect(game("placeError('weg', 4, 9)")).toBe(null);
    game("setTool('weg'); startPlan('line', { x: 3, y: 9 }, { x: 6, y: 9 }, true)");
    expect(game('(() => { const i = planInfo(plan); return [i.order.length, i.firstErr]; })()')).toEqual([4, null]);
    game('(() => { for (const [, , run] of planInfo(plan).order) run(); cancelPlan(); setTool("look"); })()');
    expect(game('[3, 4, 5, 6].map(x => bAt(x, 9))')).toEqual(['weg', 'weg', 'weg', 'weg']);
    expect(game('[3, 4, 5, 6].every(x => roofAt(x, 9))')).toBe(true);
    expect(game("placeError('haus', 4, 9)")).toMatch(/Überdachung|Weg|belegt|frei/);   // Gebäude weiter nicht
  });

  it('Dach über der Wiese: eigenes Fenster mit Form und Abreißen', () => {
    roof(row(3, 4, 9));
    game('openRoofInfo(3, 9)');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Holz-Pergola.*Alle verbundenen \(2\)/s);
    game("document.getElementById('p-del').click()");
    expect(game("state.roofs.has('3,9')")).toBe(false);
  });

  it('Stützen auf dem Eckpunkt rücken an die Dachkante (Nutzer: „man kann die Pfeiler auf die Ecken stellen“); mitten unterm Dach bleiben sie', () => {
    way(row(3, 6, 5)); roof(row(3, 6, 5));
    game("buildSmall('stuetze', 5, 5, VSLOT); buildSmall('stuetze', 5, 6, VSLOT)");   // Eckpunkte (4,5 | 4,5 hinten) und (4,5 | 5,5 vorn)
    expect(game("pillarPos(5, 5, VSLOT, state.decos.get('5,5')[VSLOT]).map(v => +v.toFixed(2))")).toEqual([4.5, 4.58]);
    expect(game("pillarPos(5, 6, VSLOT, state.decos.get('5,6')[VSLOT]).map(v => +v.toFixed(2))")).toEqual([4.5, 5.42]);
    expect(game('pillarSnap(4.5, 7.5)')).toEqual([4.5, 7.5]);                         // weit weg vom Dach: bleibt
    // erst Säulen, dann Dach (Nutzer): Ecken der Nachbarfelder (0,16 weg, schräg 0,23) rücken auch an die Dachkante
    expect(game('pillarSnap(2.42, 4.42).map(v => +v.toFixed(2))')).toEqual([2.58, 4.58]);
    expect(game('pillarSnap(2.42, 5).map(v => +v.toFixed(2))')).toEqual([2.58, 5]);
    for (let y = 8; y <= 9; y++) { way(row(8, 9, y)); roof(row(8, 9, y)); }
    expect(game('pillarSnap(8.5, 8.5)')).toEqual([8.5, 8.5]);                         // Mitte eines 2×2-Dachs: bleibt
  });

  it('Pergola: Balken in beide Richtungen nur über Pfosten mitten unterm Dach – ohne Pfosten bleibt das dünne Gitter (Nutzer)', () => {
    for (let y = 3; y <= 5; y++) roof(row(3, 5, y));                                  // 3 × 3, Pergola
    const beams = (x, y) => game(`roofInnerBeams(roofArea(roofCov(roofAt(${x}, ${y}))), ${x}, ${y}).map(([a, t]) => a + t)`).sort();
    expect(beams(3, 3)).toEqual([]);                                                  // noch kein innerer Pfosten
    game("buildSmall('stuetze', 3, 3, 0)");                                           // Außenecke: trägt der Randbalken
    expect(beams(3, 3)).toEqual([]);
    const sig0 = game('roofSig(3, 4, roofAt(3, 4))');
    game("buildSmall('stuetze', 5, 5, VSLOT)");                                       // innen: Eckpunkt bei 4,5 | 4,5
    expect(beams(4, 4)).toEqual(['u4.5', 'v4.5']);
    expect(beams(3, 4)).toEqual(['u4.5']);                                             // Balken längs u läuft bis zum Rand
    expect(beams(4, 3)).toEqual(['v4.5']);
    expect(beams(3, 3)).toEqual([]);
    expect(game('roofSig(3, 4, roofAt(3, 4))')).not.toBe(sig0);                       // Bildchen wird neu gemalt
    way(row(7, 9, 4)); roof(row(7, 9, 4));                                            // getrennte Fläche in derselben Reihe
    expect(beams(8, 4)).toEqual([]);                                                  // der Balken springt nicht über die Lücke
  });

  it('erst vier Säulen auf die Ecken der Nachbarfelder, dann das Dach: alle vier werden gezeichnet, an der Dachkante (Nutzer)', () => {
    game("buildSmall('stuetze', 9, 9, 3); buildSmall('stuetze', 11, 9, 2); buildSmall('stuetze', 9, 11, 1); buildSmall('stuetze', 11, 11, 0); build('dach', 10, 10, true); recalc()");
    const n = game("(() => { const o = drawSmallOne; let n = 0; drawSmallOne = (b, ...a) => { if (b === 'stuetze') n++; return o(b, ...a); }; try { cam = state.cam; cam.z = 2; const p = iso(10, 10); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawSmallOne = o; } return n; })()");
    expect(n).toBe(4);
  });

  it('Pfosten bündig an jeder Stelle der Insel – auch wo Kommazahlen schief runden (Nutzer: Dach bei −15, −50)', () => {
    for (const [X, Y] of [[-15, -50], [-5, -6], [37, 81], [-123, 64]]) {
      game(`state.claimed.add('${X},${Y}'); state.roofs.set('${X},${Y}', {})`);
      for (const [su, sv] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const q = game(`pillarInset(${X} + ${su} * RW, ${Y} + ${sv} * RW, 0)`);
        expect([+(q[0] - X).toFixed(3), +(q[1] - Y).toFixed(3)], `${X},${Y} Ecke ${su},${sv}`).toEqual([su * 0.395, sv * 0.395]);   // halbe Stärke nach innen
      }
      game(`state.roofs.delete('${X},${Y}')`);
    }
  });

  it('Ring mit offenem Hof: Stützen in den Hof-Ecken rutschen in die Ecke und stehen bündig unter dem Eck der Balken (Nutzer)', () => {
    for (let y = 3; y <= 5; y++) for (let x = 3; x <= 5; x++) if (x !== 4 || y !== 4) game(`build('dach', ${x}, ${y}, true)`);
    for (const s of [0, 1, 2, 3]) game(`buildSmall('stuetze', 4, 4, ${s})`);   // Ecken des Hof-Felds
    const T = game('PERG_T');
    for (const [s, su, sv] of [[0, -1, -1], [1, 1, -1], [2, -1, 1], [3, 1, 1]]) {
      const q = game(`pillarPos(4, 4, ${s}, state.decos.get('4,4')[${s}]).map(v => +v.toFixed(3))`);
      expect(q, 'Hof-Ecke ' + s).toEqual([4 + su * 0.58, 4 + sv * 0.58]);
      const r = game(`pillarInset(${q[0]}, ${q[1]}, 0).map(v => +v.toFixed(3))`);
      expect(r, 'bündig ' + s).toEqual([+(4 + su * (0.58 + T / 2)).toFixed(3), +(4 + sv * (0.58 + T / 2)).toFixed(3)]);   // ins Eck der Balken
    }
  });

  it('Stützen kommen mit (Nutzer wählte A): nach dem Ziehen an jede Außenecke eine, gratis; vorhandene zählen; entfernen gibt nichts zurück', () => {
    const pillars = () => game("[...state.decos].flatMap(([k, ds]) => ds.map((d, i) => d && d.b === 'stuetze' ? pillarPos(...keyXY(k), i, d).map(v => +v.toFixed(2)).join('|') : null).filter(Boolean)).sort()");
    game("buildSmall('stuetze', 6, 3, 1)");                                           // schon eine an der späteren Ecke (6,42 | 2,58)
    const m = game('state.money');
    game("resetUndo(); setTool('dach'); startPlan('rect', { x: 3, y: 3 }, { x: 6, y: 4 }, true); undoable(runPlan); setTool('look')");   // 4 × 2, ein Schritt wie beim Tippen
    expect(pillars()).toEqual(['2.58|2.58', '2.58|4.42', '6.42|2.58', '6.42|4.42']);  // vier Außenecken, keine doppelt, keine an den Seiten
    expect(game('state.money')).toBe(m - 8 * game('ITEMS.dach.cost'));                // Stützen gratis
    expect(game("state.decos.get('3,3')[0].free")).toBe(true);
    game('undo()');
    expect(game('state.roofs.size')).toBe(0);                                         // ↶ nimmt Dach samt Stützen
    expect(pillars()).toEqual(['6.42|2.58']);
    game("setTool('dach'); startPlan('rect', { x: 3, y: 3 }, { x: 6, y: 4 }, true); runPlan(); setTool('look')");
    const m2 = game('state.money');
    game("removeSmall(3, 3, 0)");
    expect(game('state.money')).toBe(m2);                                             // gratis gekommen: nichts zurück
  });

  it('Verschieben und Kopieren nehmen das Dach mit, nicht nur die Stützen (Nutzer)', () => {
    game("state.paintNew.dach = { form: 0 }; setTool('dach'); startPlan('rect', { x: 3, y: 3 }, { x: 4, y: 4 }, true); runPlan(); setTool('look')");   // 2 × 2 samt Eckstützen
    const pillars = () => game("[...state.decos].reduce((n, [, ds]) => n + ds.filter(d => d && d.b === 'stuetze').length, 0)");
    expect([game('state.roofs.size'), pillars()]).toEqual([4, 4]);
    // verschieben
    game("setTool('verschieben'); pickUpGroup(3, 3, 4, 4)");
    expect(game('state.roofs.size')).toBe(0);                                         // angehoben
    expect(game("JSON.parse(JSON.stringify(serialize())).roofs.length")).toBe(4);     // Speichern zwischendurch: am alten Platz
    game("hover = { x: 11, y: 11 }; dropGroup(11, 11)");
    expect(game('[...state.roofs.keys()].sort()')).toEqual(['10,10', '10,11', '11,10', '11,11']);
    expect(pillars()).toBe(4);
    // kopieren: kostet auch die Dächer, die Kopie hat Dach und Stützen
    const cost = game('copyCost(copyCollect(10, 10, 11, 11).items).money');
    expect(cost).toBe(4 * game('ITEMS.dach.cost') + 4 * game('ITEMS.stuetze.cost'));
    game("setTool('look'); startCopy(10, 10, 11, 11); hover = { x: 15, y: 15 }; dropGroup(15, 15); cancelMove(); setTool('look')");
    expect(game('[...state.roofs.keys()].filter(k => k.startsWith("14") || k.startsWith("15")).sort()')).toEqual(['14,14', '14,15', '15,14', '15,15']);
    expect(pillars()).toBe(8);
    // abbrechen legt das Dach zurück
    game("setTool('verschieben'); pickUpGroup(14, 14, 15, 15); cancelMove(); setTool('look')");
    expect(game("state.roofs.has('14,14')")).toBe(true);
  });

  it('Speichern und Laden; unbekannte Werte fallen weg', () => {
    way(row(3, 5, 5)); game("state.paintNew.dach = { form: 2, col: 1 }; state.design.add('dach:form:markise')"); roof(row(3, 5, 5));
    const back = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.roofs.push(['x', {}], ['9,9', { form: 99, col: -1 }]); return [...parseSave(d).roofs]; })()");
    expect(back).toEqual([['3,5', { form: 2, col: 1 }], ['4,5', { form: 2, col: 1 }], ['5,5', { form: 2, col: 1 }], ['9,9', {}]]);
    expect(game('[...parseSave({ ...JSON.parse(JSON.stringify(serialize())), roofs: undefined }).roofs].length')).toBe(0);   // alter Stand ohne Dächer
  });

  it('Steinarkaden: Dachgarten oder Belag mit Wegmuster und -farbe (Nutzer); bleibt beim Speichern, Unbekanntes fällt weg', () => {
    way(row(3, 5, 5)); game("state.paintNew.dach = { form: 3 }; state.design.add('dach:form:arkaden'); state.design.add('wegmuster:verband')"); roof(row(3, 5, 5));
    game('openInfo(4, 5)');
    expect(game("[...document.querySelectorAll('.looks [data-roofbel]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : ''))")).toEqual(['Dachgarten*', 'Belag']);
    game("document.querySelector('[data-roofscope=\"run\"]').click(); [...document.querySelectorAll('.looks [data-roofbel]')][1].click()");
    expect(game("[...state.roofs.values()].map(r => r.bel)")).toEqual(['m:verband:beige', 'm:verband:beige', 'm:verband:beige']);   // Plattenmuster, das man hat, in Steinfarbe
    expect(game("document.querySelectorAll('.wpick [data-roofbel]').length")).toBeGreaterThan(5);   // Muster und Farben wie beim Weg
    expect(game("[...document.querySelectorAll('.wpick [data-roofbel]')].some(b => b.dataset.roofbel === 'tritt')")).toBe(false);   // keine Trittsteine auf dem Dach
    game("document.querySelector('[data-roofbel=\"m:verband:anthrazit\"]').click()");
    expect(game("roofAt(3, 5).bel")).toBe('m:verband:anthrazit');
    expect(game("roofSig(3, 5, roofAt(3, 5)) !== roofSig(3, 5, { form: 3 })")).toBe(true);   // neues Bildchen
    const back = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.roofs.push(['9,9', { form: 3, bel: 'quatsch' }]); return [...parseSave(d).roofs]; })()");
    expect(back).toEqual([['3,5', { form: 3, bel: 'm:verband:anthrazit' }], ['4,5', { form: 3, bel: 'm:verband:anthrazit' }], ['5,5', { form: 3, bel: 'm:verband:anthrazit' }], ['9,9', { form: 3 }]]);
    expect(game("roofBel({ form: 3, bel: 'tritt' })")).toBe(null);                   // alter Stand mit Trittsteinen: Dachgarten
    for (const z of [2.5, 0.5]) game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(4, 5); cam.x = p.x; cam.y = p.y; render(1e6); })()`);
    game("[...document.querySelectorAll('.looks [data-roofbel]')][0].click()");
    expect(game("[...state.roofs.values()].some(r => 'bel' in r)")).toBe(false);     // zurück zum Dachgarten
  });

  it('alle Formen zeichnen ohne Fehler – nah, weit weg, Tag und Nacht, mit Figuren darunter; Schönheit zählt', () => {
    for (let y = 4; y <= 6; y++) way(row(2, 9, y));
    const b0 = game('T.beauty');
    for (let f = 0; f < 4; f++) game(`state.paintNew.dach = { form: ${f}, col: ${f} }; state.design.add('dach:form:' + DECO_LOOKS.dach.forms[${f}].id); for (let x = 2 + 2 * ${f}; x <= 3 + 2 * ${f}; x++) for (let y = 4; y <= 6; y++) build('dach', x, y, true)`);
    game("buildSmall('stuetze', 2, 4, 0); buildSmall('stuetze', 9, 6, 3); recalc()");
    expect(game('T.beauty')).toBeGreaterThan(b0);
    for (const h of [12, 23]) for (const z of [2.5, 1, 0.5]) game(`(() => { const gh = gameHour; gameHour = () => ${h}; try { cam = state.cam; cam.z = ${z}; const p = iso(5, 5); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); } finally { gameHour = gh; } })()`);
    expect(game("roofSprites.size")).toBeGreaterThan(0);
    for (let f = 0; f < 4; f++) expect(() => game(`thumbRaw('dach', 1, { form: ${f}, col: 0 }); lookThumb('dach', ${f}, 0)`)).not.toThrow();
  });

  it('Kunstakademie: Pergola frei, Glas, Markise und Arkaden zu kaufen; Farbknopf in der Leiste nur bei der Markise', () => {
    expect(game("lookOk('dach', 'form', 0)")).toBe(true);
    expect(game("['glas', 'markise', 'arkaden'].map(id => !!DESIGN_BY_ID['dach:form:' + id] && !lookOk('dach', 'form', DECO_LOOKS.dach.forms.findIndex(f => f.id === id)))")).toEqual([true, true, true]);
    game("setTool('dach'); renderStyleBar('dach')");
    expect(game("!!document.querySelector('#style-bar [data-lpop=\"col\"]')")).toBe(false);
    game("state.design.add('dach:form:markise'); state.paintNew.dach = { form: 2 }; renderStyleBar('dach')");
    expect(game("!!document.querySelector('#style-bar [data-lpop=\"col\"]')")).toBe(true);
    game("setTool('look')");
  });
});
