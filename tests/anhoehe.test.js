const { loadGame, game } = require('./helpers/load-game');

// Block 157 (Stufe 1): Anhöhen – Felder eine Ebene höher (state.hills), per Rechteck aufziehen, Wand wählbar (Fels/Erde/Mauer).
// Oben nur Deko und Gelände; große Deko, Linien und Eckpunkt-Deko nie über die Kante; Abtragen gibt alles zurück.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 22; y++) for (let x = 4; x <= 22; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(9, 9); cam.x = p.x; cam.y = p.y; }');
});
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true)`);
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const scr = (x, y, up = 0) => game(`(() => { const p = toScreen(${x}, ${y}); return [p.x, p.y - ${up} * cam.z]; })()`);
const panel = () => game("document.getElementById('panel').textContent");

describe('Anhöhen (Block 157)', () => {
  it('Rechteck aufziehen hebt die Felder an (Kosten, Wand aus der Leiste); gleiche Wand ist schon fertig, andere Wand stellt kostenlos um', () => {
    expect(game("dragKind('anhoehe')")).toBe('rect');
    game("state.paintNew.anhoehe = { form: 1 }; setTool('anhoehe'); startPlan('rect', { x: 5, y: 5 }, { x: 7, y: 6 }, true)");
    const info = game('(() => { const i = planInfo(plan); return { n: i.n, cost: i.cost, err: i.err }; })()');
    expect(info).toEqual({ n: 6, cost: 6 * game('ITEMS.anhoehe.cost'), err: null });
    const m0 = game('state.money');
    expect(game('runPlan()')).toBe(true);
    expect(game('state.money')).toBe(m0 - 6 * game('ITEMS.anhoehe.cost'));
    expect(game('[...state.hills.values()].map(h => h.w)')).toEqual([1, 1, 1, 1, 1, 1]);   // Erde mit Grasnarbe
    expect(game('[hillLevel(5, 5), hillLift(7, 6), hillLevel(8, 6)]')).toEqual([1, game('HILL_H'), 0]);
    // dasselbe noch einmal: schon fertig
    game("startPlan('rect', { x: 5, y: 5 }, { x: 7, y: 6 }, true)");
    expect(game('(() => { const i = planInfo(plan); return [i.n, i.err]; })()')).toEqual([0, 'Hier ist schon alles fertig']);
    expect(game("placeError('anhoehe', 5, 5)")).toBe('Hier ist schon eine Anhöhe');
    // Trockenmauer: nur umstellen, kostet nichts
    game('state.paintNew.anhoehe = { form: 2 }');
    expect(game("placeError('anhoehe', 5, 5)")).toBe(null);
    expect(game('(() => { const i = planInfo(plan); return [i.n, i.cost, i.err]; })()')).toEqual([6, 0, null]);
    game('runPlan()');
    expect(game('[...state.hills.values()].every(h => h.w === 2)')).toBe(true);
    expect(game('state.money')).toBe(m0 - 6 * game('ITEMS.anhoehe.cost'));
    // ein Feld mit Haus im Rechteck: rot, der Rest wird gebaut
    game("state.tiles.set('10,5', { b: 'haus', lvl: 1 }); recalc(); startPlan('rect', { x: 9, y: 5 }, { x: 10, y: 5 }, true)");
    expect(game("(() => { const i = planInfo(plan); return [i.n, i.states.get('10,5'), i.states.get('9,5')]; })()")).toEqual([1, 'bad', 'ok']);
    game("cancelPlan(); setTool('look')");
  });

  it('Bauen und ↶: einzeln angehoben, ↶ nimmt Anhöhe und Taler zurück', () => {
    const m0 = game('state.money');
    expect(game("undoable(() => build('anhoehe', 6, 6))")).toBe(true);
    expect(game("state.hills.get('6,6')")).toEqual({ w: 0 });
    game('undo()');
    expect([game("state.hills.has('6,6')"), game('state.money')]).toEqual([false, m0]);
  });

  it('oben Wege, Plätze, Deko, Gelände (Stufe 2), Schienen (Gleis-Rampe), Gebäude und Bahnhöfe (Stufe 3): keine Dächer, Stützen; Großes nur ganz oben', () => {
    hills(block(5, 5, 6, 6));
    expect(game("placeError('haus', 5, 5)")).toBe(null);                              // Stufe 3 (157j): Gebäude oben
    expect(game("placeError('weg', 5, 5)")).toBe(null);                              // Stufe 2: Wege oben
    expect(game("placeError('schiene', 5, 5, 0, { move: true })")).toBe(null);          // Gleise oben (über die Gleis-Rampe erreichbar)
    expect(game("placeError('station', 5, 5, 0, { move: true })")).toBe(null);          // Stufe 3 (157j): Bahnhöfe oben
    expect(game("placeError('pb_gleis', 5, 5, 0, { move: true })")).toMatch(/Parkeisenbahn fährt unten/);   // Parkbahn fährt am Boden
    expect(game("placeError('seilbahn', 5, 5, 0, { move: true })")).toMatch(/Seilbahn-Station steht unten/);
    expect(game("placeError('dach', 5, 5)")).toBe('Auf einer Anhöhe geht keine Überdachung');
    expect(game("placeError('graben', 5, 5)")).toBe('Auf einer Anhöhe geht kein Teich');
    expect(game("placeError('haus', 5, 5, 0, { move: true, t: { b: 'haus', lvl: 1 } })")).toBe(null);   // auch Verschieben (157j)
    expect(game("smallError('stuetze', 5, 5, 0)")).toMatch(/keine Überdachung/);
    // ja: Deko-Felder, kleine Deko, Gelände
    expect(game("placeError('brunnen', 5, 5, 0, { move: true })")).toBe(null);
    expect(game("placeError('wald', 5, 5)")).toBe(null);
    expect(game("placeError('parkrasen', 6, 6, 0, { move: true })")).toBe(null);
    expect(game("smallError('baum', 5, 5, 0)")).toBe(null);
    expect(game("smallError('bank', 6, 5, 1)")).toBe(null);
    // große Deko: ganz oben ja, über die Kante nein; unten weiter wie immer
    expect(game("placeError('seerosenteich', 5, 5, 0, { move: true })")).toBe(null);
    expect(game("placeError('seerosenteich', 6, 6, 0, { move: true })")).toBe('Nicht über die Kante einer Anhöhe');
    expect(game("placeError('seerosenteich', 10, 10, 0, { move: true })")).toBe(null);
    expect(game("placeError('haus', 10, 10)")).toBe(null);
    // Linien: innerhalb der Anhöhe ja, an der Kante nein
    expect(game("edgeError('zaun', edgeBetween(5, 5, 6, 5))")).toBe(null);
    expect(game("edgeError('zaun', edgeBetween(6, 5, 7, 5))")).toBe('Nicht an der Kante einer Anhöhe');
    expect(game("edgeError('hecke', edgeBetween(5, 6, 5, 7))")).toBe('Nicht an der Kante einer Anhöhe');
    // Eckpunkt-Deko: alle vier Felder gleich hoch
    expect(game("smallError('laterne', 6, 6, VSLOT)")).toBe(null);                 // Mitte der 2×2-Anhöhe
    expect(game("smallError('laterne', 7, 7, VSLOT)")).toBe('Nicht über die Kante einer Anhöhe');
    expect(game("smallError('laterne', 10, 10, VSLOT)")).toBe(null);
    expect(game("smallError('stuetze', 6, 6, VSLOT)")).toMatch(/keine Überdachung/);
    // niemand läuft die Wand hinauf: oben ist begehbar (Stufe 2), hinauf nur über Treppe/Rampe (edgeBlocks an der Kante)
    expect(game('[walkable(5, 5), walkable(8, 8), !!edgeBlocks(6, 6, 7, 6), !!edgeBlocks(5, 5, 6, 5)]')).toEqual([true, true, true, false]);
    expect(game("natureAt(5, 5, 'mittag').length")).toBe(0);
  });

  it('anheben geht nicht unter Gebäude, Dach, großer Deko, Linie am Rand oder Eckpunkt-Deko; Deko-Feld und Weg (Stufe 2) darunter kommen mit hinauf', () => {
    game("build('weg', 10, 10, true); state.tiles.set('12,10', { b: 'haus', lvl: 1 }); state.tiles.set('14,14', { b: 'seerosenteich', lvl: 1 }); recalc()");
    game("build('dach', 16, 10, true); state.edges.set(edgeBetween(18, 10, 19, 10), { b: 'zaun', style: currentStyle('zaun') })");
    game("const ds = newSlots(); ds[VSLOT] = { b: 'laterne', rot: 0 }; state.decos.set('21,21', ds); state.tiles.set('5,12', { b: 'brunnen', lvl: 1 }); recalc()");
    expect(game('hillRaiseError(10, 10)')).toBe(null);                               // Weg kommt mit hinauf (Stufe 2)
    expect(game('hillRaiseError(12, 10)')).toBe('Hier steht ein Gebäude – erst mit ✋ wegtragen, dann oben absetzen');   // 157j
    expect(game('hillRaiseError(15, 15)')).toMatch(/Große Deko erst wegnehmen/);
    expect(game('hillRaiseError(16, 10)')).toBe('Unter einer Überdachung geht keine Anhöhe');
    expect(game('hillRaiseError(18, 10)')).toBe('Am Rand steht: Zaun – erst entfernen');
    expect(game('hillRaiseError(20, 20)')).toBe('An der Ecke steht schon etwas');   // Eckpunkt 21,21 = vordere Ecke von 20,20
    game("buildSmall('stuetze', 18, 18, 0)");                                         // Stütze im Eckplatz, auch ohne Dach: oben gibt es keine
    expect(game('hillRaiseError(18, 18)')).toBe('Hier steht eine Stütze – erst wegnehmen');
    expect(game("[...state.hills.keys()]")).toEqual([]);
    expect(game('hillRaiseError(5, 12)')).toBe(null);
    expect(game("build('anhoehe', 5, 12)")).toBe(true);
    expect(game("[hillLevel(5, 12), bAt(5, 12)]")).toEqual([1, 'brunnen']);
    // Gruppe mit Dach auf eine Anhöhe ablegen: geht nicht
    hills(block(7, 15, 9, 17));
    game("build('dach', 12, 16, true); setTool('verschieben'); pickUpGroup(12, 16, 12, 16)");
    expect(game('groupErrors(8, 16).first')).toBe('Auf einer Anhöhe geht keine Überdachung');
    game("cancelMove(); setTool('look')");
  });

  it('Speichern und Laden: Wandart und Ebene bleiben, Unsinn wird verworfen; alte Stände ohne Anhöhen', () => {
    game("state.hills.set('5,5', { w: 2 }); state.hills.set('6,5', { w: 0, h: 2 })");
    const back = game(`(() => { const d = JSON.parse(JSON.stringify(serialize()));
      d.hills.push(['quatsch', { w: 1 }], ['7,7', { w: 9 }], ['8,8', { w: 1, h: 7 }], ['9,9', null]);
      return [...parseSave(d).hills]; })()`);
    expect(back).toEqual([['5,5', { w: 2 }], ['6,5', { w: 0, h: 2 }], ['7,7', { w: 0 }], ['8,8', { w: 1 }], ['9,9', { w: 0 }]]);
    expect(game("(() => { const d = JSON.parse(JSON.stringify(serialize())); delete d.hills; return parseSave(d).hills.size; })()")).toBe(0);
  });

  it('👆 Fenster: Wand für die ganze Anhöhe, 🗑️ trägt ab (voll zurück, Deko bleibt unten stehen), ↶; Zaun am Rand sperrt', () => {
    hills([[5, 5], [6, 5], [7, 5]]);
    game("buildSmall('baum', 5, 5, 0)");
    game('openHillInfo(5, 5)');
    expect(game("document.querySelector('#panel h3').textContent")).toContain('Anhöhe · Felswand');
    expect(panel()).toContain('(3 Felder)');
    game("document.querySelector('#panel [data-hwall=\"1\"]').click()");
    expect(game('[...state.hills.values()].map(h => h.w)')).toEqual([1, 1, 1]);
    expect(game("document.querySelector('#panel h3').textContent")).toContain('Erde');
    const m0 = game('state.money');
    expect(game("document.getElementById('p-del').disabled")).toBe(false);
    game("document.getElementById('p-del').click()");
    expect(game("state.hills.has('5,5')")).toBe(false);
    expect(game('state.money')).toBe(m0 + game('ITEMS.anhoehe.cost'));
    expect(game("decosAt('5,5')[0].b")).toBe('baum');                                // der Baum steht jetzt unten
    game('undo()');
    expect([game("state.hills.has('5,5')"), game('state.money')]).toEqual([true, m0]);
    // Zaun oben zwischen 6,5 und 7,5: dort nicht abtragen (der Zaun stünde an der Kante)
    game("state.edges.set(edgeBetween(6, 5, 7, 5), { b: 'zaun', style: currentStyle('zaun') }); recalc(); openHillInfo(7, 5)");
    expect(game("document.getElementById('p-del').disabled")).toBe(true);
    expect(panel()).toContain('Am Rand steht: Zaun');
    game('demolish(7, 5)');
    expect(game("state.hills.has('7,5')")).toBe(true);
    game('closePanel()');
    // Wald oben: roden räumt nur den Wald, die Anhöhe bleibt
    game("state.terra.set('5,5', 'forest'); recalc(); openHillInfo(5, 5)");
    game("document.getElementById('p-clear').click()");
    expect([game('terrainAt(5, 5)'), game("state.hills.has('5,5')")]).toEqual(['grass', true]);
    game('closePanel()');
  });

  it('✋-Auswahl → Abreißen trägt Anhöhen ab (Erstattung), Deko darauf kommt mit weg, Wald bleibt; was hinausragt, bleibt samt Anhöhe', () => {
    hills(block(5, 5, 7, 6));
    game("state.decos.set('5,5', [null, { b: 'blumentopf', rot: 0 }, null, null]); state.terra.set('6,6', 'forest'); state.tiles.set('7,5', { b: 'seerosenteich', lvl: 1 }); recalc()");
    expect(game('hillRaiseError(9, 9)')).toBe(null);
    game("setTool('verschieben'); startPlan('rect', { x: 5, y: 5 }, { x: 6, y: 6 }, true)");
    const i = game('(() => { const i = planInfo(selDemolishPlan(plan)); return { gain: i.gain, err: i.err }; })()');
    expect(i.err).toBe(null);
    expect(i.gain).toBe(4 * game('ITEMS.anhoehe.cost') + game("decoBack({ b: 'blumentopf' })"));
    const m0 = game('state.money');
    game('demolishSelection()');
    expect(game('[...state.hills.keys()].sort()')).toEqual(['7,5', '7,6']);            // unter dem Teich (ragt hinaus) bleibt sie
    expect([game("!!decosAt('5,5')"), game('terrainAt(6, 6)'), game('state.money')]).toEqual([false, 'forest', m0 + i.gain]);
    game('undo()');
    expect([game('state.hills.size'), game("decosAt('5,5')[1].b"), game('state.money')]).toEqual([6, 'blumentopf', m0]);
    game("setTool('look')");
  });

  it('Antippen: die Oberseite einer Anhöhe trifft ihr Feld (toTile, slotAt, Ecke), die Wand auch; 👆 öffnet ihr Fenster', () => {
    const flat = scr(9.3, 9.3);
    const slot0 = game(`slotAt(${flat[0]}, ${flat[1]})`);
    expect([slot0.x, slot0.y]).toEqual([9, 9]);
    hills(block(8, 8, 10, 10));
    const H = game('HILL_H');
    const [sx, sy] = scr(9, 9, H);                                                     // Mitte der Oberseite
    expect(game(`toTile(${sx}, ${sy})`)).toEqual({ x: 9, y: 9 });
    expect(game(`(() => { const [a, b] = tileFrac(${sx}, ${sy}); return [Math.round(a), Math.round(b)]; })()`)).toEqual([8, 8]);   // flach läge dort 8,8
    const top = scr(9.3, 9.3, H), s1 = game(`slotAt(${top[0]}, ${top[1]})`);
    expect([s1.x, s1.y, s1.slot]).toEqual([9, 9, slot0.slot]);
    const v = scr(9.5, 9.5, H);                                                        // vordere Ecke von 9,9 oben
    expect(game(`toVertex(${v[0]}, ${v[1]})`)).toEqual({ x: 10, y: 10 });
    const wall = scr(10, 10.45, H / 2);                                                // vordere Wand (+y) halb hoch
    expect(game(`toTile(${wall[0]}, ${wall[1]})`)).toEqual({ x: 10, y: 10 });
    game(`setTool('abriss'); setHover(${sx}, ${sy})`);
    expect(game('[hover.x, hover.y]')).toEqual([9, 9]);
    game("setTool('look')");
    game(`tap(${sx}, ${sy}, false)`);
    expect(game("document.querySelector('#panel h3') && document.querySelector('#panel h3').textContent")).toContain('Anhöhe');
    game('closePanel()');
  });

  it('Tiere: nie durch die Wand, verschwinden unter einer neuen Anhöhe; Vögel darüber werden nicht doppelt angehoben', () => {
    game('critters.length = 0');
    hills([[10, 10]]);
    const res = game(`(() => { const now = 1e6, c = spawnCritter('schmetterling', 11, 10, now); let on = 0; for (let t = 0; t < 9000; t += 50) { critterPos(c, now + t); if (Math.round(c.px) === 10 && Math.round(c.py) === 10) on++; } return [on, c.px != null]; })()`);
    expect(res).toEqual([0, true]);
    const reh = game(`(() => { const now = 1e6, c = spawnCritter('reh', 11, 10, now); c.x = 11; c.y = 10; c.dir = Math.PI; c.flee = now; let on = 0; for (let t = 0; t < 1800; t += 30) { critterPos(c, now + t); if (Math.round(c.px) === 10) on++; } return [on, c.hold === true]; })()`);
    expect(reh).toEqual([0, true]);
    expect(game(`(() => { const now = 1e6, c = spawnCritter('schmetterling', 12, 12, now); state.hills.set('12,12', { w: 0 }); critterPos(c, now + 100); return c.until <= now + 100; })()`)).toBe(true);
    // Vogel hoch über der Anhöhe: seine Höhe zählt ab dem Boden – im Feld der Anhöhe nicht noch einmal anheben
    const lifts = game(`(() => { critters.length = 0; const c = { critter: true, id: 'moewe', x: 10, y: 10, px: 10, py: 10, h: 40, t0: 0, until: 1e12, seed: 1, dir: 0 }; critters.push(c);
      const now = 1e6, cp = critterPos; critterPos = () => {}; const ml = moverLive, out = []; moverLive = (m, ...a) => { if (m === c) out.push(a[3] || 0); return ml(m, ...a); };
      try { cam.z = 2; const p = iso(10, 10); cam.x = p.x; cam.y = p.y; render(now); } finally { moverLive = ml; critterPos = cp; critters.length = 0; } return out; })()`);
    expect(lifts).toEqual([0]);
  });

  it('Dach hinter einer Anhöhe: die Anhöhe davor gilt, sonst trifft man das Dach weiter', () => {
    game("state.roofs.set('10,10', {}); state.hills.set('11,10', { w: 0 }); recalc(); cam.z = 1.4");
    const r = game(`(() => { const p = toScreen(10, 10), z = cam.z; let roof = 0, hillWins = 0;
      for (let dy = -60; dy <= 30; dy += 1) for (let dx = -50; dx <= 70; dx += 1) {
        const sx = p.x + dx, sy = p.y + dy, [a, b] = tileFrac(sx, sy + ROOF_H * z), under = Math.round(a) === 10 && Math.round(b) === 10;
        const pf = pickFrac(sx, sy), onHill = Math.round(pf[0]) === 11 && Math.round(pf[1]) === 10, rp = roofPick(sx, sy);
        if (rp) roof++;
        if (under && onHill && !rp) hillWins++;
      } return { roof, hillWins }; })()`);
    expect(r.roof).toBeGreaterThan(50);
    expect(r.hillWins).toBeGreaterThan(0);
  });

  it('ohne Anhöhen alles wie vorher: pickFrac = tileFrac, keine Anhöhen-Zeichnung', () => {
    const pts = [[100, 100], [333.3, 251.7], [800, 40], [-20, 600]];
    for (const [x, y] of pts) expect(game(`pickFrac(${x}, ${y})`)).toEqual(game(`tileFrac(${x}, ${y})`));
    const calls = game(`(() => { const t = drawHillTile, s = drawHillShadows; let n = 0; drawHillTile = (...a) => { n++; return t(...a); }; drawHillShadows = (...a) => { n++; return s(...a); };
      try { for (const z of [2, 0.6]) { cam.z = z; render(1e6); } } finally { drawHillTile = t; drawHillShadows = s; } return n; })()`);
    expect(calls).toBe(0);
    expect(game('roofHillFront(100, 100)')).toBe(false);
  });

  it('zeichnet ohne Fehler: nah, weit weg, Tag und Nacht, mit Deko, Wald, Zaun, Brunnen und Vorschau oben', () => {
    hills(block(6, 6, 9, 8));
    game("state.paintNew.anhoehe = { form: 2 }"); hills([[12, 6], [12, 7]]);
    game("state.paintNew.anhoehe = { form: 1 }"); hills([[14, 6]]);
    game("buildSmall('baum', 6, 6, 0); buildSmall('bank', 7, 6, 1); buildSmall('laterne', 8, 7, 3); state.tiles.set('9,8', { b: 'brunnen', lvl: 1 }); state.tiles.set('7,7', { b: 'seerosenteich', lvl: 1 })");
    game("state.terra.set('6,8', 'forest'); state.edges.set(edgeBetween(8, 6, 9, 6), { b: 'hecke', style: currentStyle('hecke') }); recalc()");
    // Tor in einer Mauer direkt hinter einer Anhöhen-Ecke: der Torpfeiler gehört zur Mauer (unten)
    game("build('weg', 11, 9, true); build('weg', 11, 10, true); state.edges.set(edgeBetween(11, 9, 11, 10), { b: 'mauer', style: currentStyle('mauer') }); recalc()");
    expect(game("isGate(edgeBetween(11, 9, 11, 10))")).toBe(true);
    const pillarShift = () => game("(() => { const out = []; g = ctx; ctx.translate = (x, y) => out.push([x, y]); try { gatePillarsAt(12, 10, 2); } finally { delete ctx.translate; } return out; })()");
    expect(pillarShift()).toEqual([]);
    hills([[12, 10]]);                                                                 // Eckpunkt 12,10 = hintere Ecke dieser Anhöhe
    expect(pillarShift()).toEqual([[0, 2 * game('HILL_H')]]);                         // zurück nach unten, wo die Mauer steht
    for (const h of [12, 23]) for (const z of [2.5, 1.25, 0.5]) game(`(() => { const gh = gameHour; gameHour = () => ${h}; try { cam.z = ${z}; const p = iso(9, 8); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); } finally { gameHour = gh; } })()`);
    expect(game('hillSprites.size')).toBeGreaterThan(0);
    // Vorschau oben: Rechteck aufziehen, Hover, Abriss-Rahmen
    game("setTool('anhoehe'); startPlan('rect', { x: 8, y: 8 }, { x: 10, y: 9 }, true); cam.z = 2; render(2e6); cancelPlan()");
    const [sx, sy] = scr(8, 8, game('HILL_H'));
    game(`setHover(${sx}, ${sy}); render(2e6 + 17); setTool('abriss'); setHover(${sx}, ${sy}); render(2e6 + 34); setTool('look')`);
    expect(game('errorShown')).toBe(false);
    // Symbole in Leiste und Wandwahl
    for (let f = 0; f < 3; f++) expect(() => game(`thumbRaw('anhoehe', 1, { form: ${f} }); lookThumb('anhoehe', ${f}, 0)`)).not.toThrow();
    // Parkrand oben folgt ☰ „Ränder aus“ (sonst bliebe das alte Bildchen stehen)
    game("state.terra.set('12,6', 'park'); recalc()");
    const sig0 = game("hillSig(12, 6, hillAt(12, 6))");
    game('state.noBorders = true');
    expect(game("hillSig(12, 6, hillAt(12, 6))")).not.toBe(sig0);
    game('state.noBorders = false');
    // abgetragen: das Bildchen ist frei
    game('lowerHill(14, 6)');
    expect(game("hillSprites.has('14,6')")).toBe(false);
  });

  it('Kante: Linie oben und Linie unten sind nicht verbunden (beide mit Endstück); Stütze hinter einer Anhöhe wird nicht durch sie hindurch getroffen', () => {
    hills([[5, 5], [6, 5]]);
    game("buildEdge('mauer', 'b6,5'); buildEdge('mauer', 'b6,6')");
    expect(game("[freeEnd('b6,5', 6, 6), freeEnd('b6,6', 6, 6)]")).toEqual([true, true]);
    // Stütze hinter (kleineres x + y) einer Anhöhe: Tippen auf die Wand trifft die Anhöhe
    game("state.decos.set('8,7', [null, null, null, { b: 'stuetze', rot: 0 }, null, null, null, null, null, null]); recalc()");
    hills([[9, 9]]);
    const p = game("(() => { const r = pillarAt(...(() => { const q = toScreen(9.3, 9.3); return [q.x, q.y - 8 * cam.z]; })()); return r; })()");
    expect(p).toBe(null);
  });
});
