const { loadGame, game } = require('./helpers/load-game');

// Block 157l (22.10.2026, Nutzer: „los“): Offenes zu Anhöhen – Bewohner-Sprung beim Losgehen (für alle Inseln), Treppen-Breite, Gleis-Rampe,
// Fußgängerbrücken an der Kante, Zaun-Vorschau oben, Menütext
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 34; y++) for (let x = 0; x <= 34; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(16, 16); cam.x = p.x; cam.y = p.y; } night = 0');
});
afterEach(() => game('trains.length = 0; syncTrains.sig = null'));
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);

describe('1 Bewohner springen beim Losgehen nicht schräg aufs erste Wegfeld (alle Inseln)', () => {
  // Weg y = 15 (x 8…14) und x = 11 (y 10…15), Haus oben an der Gasse. Der Bewohner bummelt gerade von (11,15) nach (12,15) und macht sich
  // dann auf den Heimweg: der Weg muss am Feld beginnen, auf das er zugeht – ab (11,15) ginge es von (12,15) schräg nach (11,14)
  for (const withHill of [false, true]) it(withHill ? 'mit einer Anhöhe irgendwo' : 'ohne Anhöhen', () => {
    weg([...block(8, 15, 14, 15), ...block(11, 10, 11, 14)]);
    game("state.tiles.set('11,9', { b: 'haus', lvl: 1, rot: 1, animal: 2 }); recalc()");
    if (withHill) hills(block(28, 28, 29, 29));
    expect(game('hillsOn()')).toBe(withHill);
    game("window.__w = { fx: 11, fy: 15, tx: 12, ty: 15, px: 11, py: 15, t: 0, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', home: '11,9' }; setGoal(__w, 'home')");
    expect(game('!!__w.path')).toBe(true);
    expect(game('__w.path[0]')).toEqual([11, 15]);                       // erst zurück, dann hinauf
    const moves = game(`(() => { const w = __w, out = []; let p = [w.px, w.py]; for (let i = 0; i < 4000 && w.path; i++) { stepWalker(w, 0.02); out.push([Math.abs(w.px - p[0]) > 1e-9, Math.abs(w.py - p[1]) > 1e-9]); p = [w.px, w.py]; } return out; })()`);
    expect(moves.filter(([a, b]) => a && b).length).toBe(0);              // nie in x und y zugleich
  });
});

describe('2/3 Treppe: Breite wie die Nachbartreppe, Antippen mit dem Werkzeug übernimmt die gewählte Breite', () => {
  const schmal = (x, y) => game(`stairSchmal(stairAt(${x}, ${y}))`);
  it('neu neben einer gleich gerichteten Treppe: ohne Wahl in der Leiste so breit wie sie (auch in der Vorschau in die Anhöhe); die Wahl in der Leiste gewinnt', () => {
    hills(block(10, 10, 17, 13));
    game("stairNewWide = true; build('huegeltreppe', 11, 14); stairNewWide = null; wegShape.wide = false");
    expect(schmal(11, 14)).toBe(false);
    expect(game("build('huegeltreppe', 12, 14)")).toBe(true);           // Wegform schmal – folgt aber der breiten daneben
    expect([schmal(12, 14), game("'schmal' in state.tiles.get('12,14')"), game('stairRow(11, 14).length')]).toEqual([false, false, 2]);
    // schmale daneben, Wegform breit: schmal
    game("stairNewWide = false; build('huegeltreppe', 15, 14); stairNewWide = null; wegShape.wide = true");
    expect(game("build('huegeltreppe', 16, 14)")).toBe(true);
    expect(schmal(16, 14)).toBe(true);
    // ohne Nachbarn wie bisher die Wegform
    expect(game("build('huegeltreppe', 18, 12)")).toBe(true);
    expect(schmal(18, 12)).toBe(false);
    // Vorschau (stairWideFor) und Bau gleich
    game('wegShape.wide = false');
    expect(game('stairWideFor(13, 14, 0)')).toBe(true);
    expect(game("build('huegeltreppe', 13, 14)")).toBe(true);
    expect(schmal(13, 14)).toBe(false);
    // Wahl in der Leiste: gewinnt (zwei Durchgänge)
    game('stairNewWide = false');
    expect(game('stairWideFor(14, 14, 0)')).toBe(false);
    game('wegShape.wide = false; stairNewWide = null');
  });

  it('Treppe mit dem Werkzeug angetippt: übernimmt die gewählte Breite für ihre Reihe (kostenlos, ein ↶-Schritt); gleich breit und passend: Hinweis', () => {
    hills(block(10, 10, 14, 13));
    game("stairNewWide = true; for (const x of [11, 12, 13]) build('huegeltreppe', x, 14)");
    expect(game("placeError('huegeltreppe', 12, 14)")).toBe('Hier steht schon eine Treppe, die passt');
    game('stairNewWide = false; resetUndo()');
    const m0 = game('state.money');
    expect(game("placeError('huegeltreppe', 12, 14)")).toBe(null);
    expect(game("undoable(() => build('huegeltreppe', 12, 14))")).toBe(true);
    expect([schmal(11, 14), schmal(12, 14), schmal(13, 14), game('state.money')]).toEqual([true, true, true, m0]);
    expect(game("placeError('huegeltreppe', 12, 14)")).toBe('Hier steht schon eine Treppe, die passt');
    expect(game('undo()')).toBe(true);
    expect([schmal(11, 14), schmal(12, 14), schmal(13, 14)]).toEqual([false, false, false]);
    game('stairNewWide = null');
  });

  it('an einer Ecktreppe: schmal geht nicht (Hinweis), die Ecktreppe selbst bleibt breit', () => {
    hills(block(10, 10, 13, 13));
    game("stairNewWide = true; build('huegeltreppe', 13, 14); build('huegeltreppe', 14, 13); build('huegeltreppe', 14, 14)");
    expect(game('!!stairAt(14, 14).ecke')).toBe(true);
    game('stairNewWide = false');
    expect(game("placeError('huegeltreppe', 13, 14)")).toMatch(/Ecke/);
    expect(game("placeError('huegeltreppe', 14, 14)")).toBe('Hier steht schon eine Treppe, die passt');
    expect([schmal(13, 14), schmal(14, 14)]).toEqual([false, false]);
    game('stairNewWide = null');
  });
});

describe('4 Treppe: Fuß nur über eine Ecktreppe erreichbar', () => {
  it('beide geraden Treppen am Fuß zugestellt, die Ecktreppe dazwischen frei: die Anhöhe ist erreichbar (kein Hinweis „zugestellt“), Bewohner gehen hinauf', () => {
    hills(block(10, 10, 13, 13));
    game("stairNewWide = true; build('huegeltreppe', 13, 14); build('huegeltreppe', 14, 13); build('huegeltreppe', 14, 14); stairNewWide = null");
    expect(game('!!stairAt(14, 14).ecke')).toBe(true);
    game("state.tiles.set('13,15', { b: 'brunnen', lvl: 1 }); state.tiles.set('15,13', { b: 'brunnen', lvl: 1 }); recalc()");
    expect(game('[walkable(13, 15, true), walkable(15, 13, true), walkable(15, 14, true)]')).toEqual([false, false, true]);
    expect(game('walkPath(15, 15, [[12, 12]]) != null')).toBe(true);                     // zu Fuß geht es über die Ecktreppe hinauf
    expect(game('[hillNoStair(12, 12), hillStairShut(12, 12)]')).toEqual([false, false]);
    // ohne die Ecktreppe: wirklich zugestellt
    game("state.tiles.delete('14,14'); groundVersion++; recalc()");
    expect(game('[hillNoStair(12, 12), hillStairShut(12, 12)]')).toEqual([true, true]);
  });
});

describe('13 Anhöhe im Baumenü nennt Gebäude oben', () => {
  it('Beschreibung und Tipp erwähnen, dass oben auch Häuser und andere Gebäude gehen', () => {
    expect(game('ITEMS.anhoehe.desc')).toMatch(/Gebäude/);
    expect(game('ITEM_TIPS.anhoehe')).toMatch(/Gebäude/);
  });
});

describe('12 Vorschau beim Zaun-Ziehen oben (hillMarkEdge)', () => {
  // Der Rahmen beim Bauen war oben vorn halb so breit (die Oberseite späterer Nachbarn deckte die äußere Hälfte, 157j). Eine Kante gehört zum
  // späteren ihrer zwei Felder – ihr Strich kommt nach der Oberseite beider, keine Oberseite eines der beiden Felder kommt danach
  it('Striche der Kanten (längs x und längs y, mitten auf der Anhöhe und zwischen den vordersten Reihen) liegen nach der Oberseite beider Felder', () => {
    hills(block(10, 10, 15, 15));
    game("setTool('zaun')");
    for (const [a, b] of [[[11, 13], [15, 13]], [[13, 11], [13, 15]], [[10, 15], [16, 15]], [[15, 10], [15, 16]]]) {
      const res = game(`(() => {
        const out = [], dh = drawHillTile, em = edgeMark;
        drawHillTile = (x, y, ...r) => { out.push('h' + x + ',' + y); return dh(x, y, ...r); };
        edgeMark = (k, ...r) => { out.push('e' + k); return em(k, ...r); };
        startPlan('edge', { x: ${a[0]}, y: ${a[1]} }, { x: ${b[0]}, y: ${b[1]} }, true);
        try { cam.z = 3; const p = iso(13, 13); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawHillTile = dh; edgeMark = em; plan = null; }
        return { out, edges: planEdges({ a: { x: ${a[0]}, y: ${a[1]} }, b: { x: ${b[0]}, y: ${b[1]} } }).map(k => [k, edgeTiles(k).filter(([x, y]) => hillAt(x, y)).map(([x, y]) => 'h' + x + ',' + y)]) };
      })()`);
      expect(res.edges.length).toBeGreaterThan(0);
      for (const [k, tiles] of res.edges) {
        const e = res.out.indexOf('e' + k);
        expect([k, e > -1]).toEqual([k, true]);
        for (const h of tiles) expect([k, h, res.out.lastIndexOf(h) < e]).toEqual([k, h, true]);
      }
    }
    game("setTool('look')");
  });
});

describe('9 Gleis-Rampe: Tunneleinfahrt direkt vor dem Fuß', () => {
  it('verbindet sich mit der Rampe (Netz, kein Prellbock am Fuß); quer davor nicht', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); recalc()");
    expect(game('rampAt(11, 16) && rampAt(11, 16).i')).toBe(0);                          // Fuß 11,16, hinauf nach −y
    game("for (let y = 19; y <= 22; y++) state.tunnels.set('11,' + y, {}); recalc()");
    expect(game("[placeRot('tunneleinfahrt', 11, 17), placeError('tunneleinfahrt', 11, 17)]")).toEqual([0, null]);   // so baut man sie auch
    expect(game("build('tunneleinfahrt', 11, 17)")).toBe(true);
    expect(game('einOf(11, 17) && [einOf(11, 17).A, einOf(11, 17).B]')).toEqual([[11, 17], [11, 18]]);
    expect(game('[trackLink(11, 16, 11, 17), trackLink(11, 17, 11, 16)]')).toEqual([true, true]);
    expect(game("rampLook(11, 16, rampAt(11, 16)).ef")).toBe(false);
    expect(game("T.rail.comp.get('11,16') != null && T.rail.comp.get('11,16') === T.rail.comp.get('11,20')")).toBe(true);
    // quer: Einfahrt neben dem Fuß (Achse x) verbindet nicht
    game("state.tiles.delete('11,17'); state.tiles.set('12,16', { b: 'tunneleinfahrt', lvl: 1, rot: 3 }); for (let x = 14; x <= 16; x++) state.tunnels.set(x + ',16', {}); recalc()");
    expect(game('[trackLink(11, 16, 12, 16), trackLink(12, 16, 11, 16)]')).toEqual([false, false]);
    expect(game("rampLook(11, 16, rampAt(11, 16)).ef")).toBe(true);
  });
});

describe('10 Gleis-Rampe A: Zaun an der offenen Seite (ohne Wange)', () => {
  it('geht nicht (er stünde in ihrer Wand); an der Seite eines Damms B weiter ja', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'a'; build('huegelrampe', 13, 12); recalc()");
    expect(game('[rampAt(13, 13) && rampAt(13, 13).i, rampAt(13, 12) && rampAt(13, 12).i, rampAt(13, 12) && rampAt(13, 12).form]')).toEqual([0, 1, 'a']);
    for (const [x, y] of [[13, 13], [13, 12]]) expect(game(`edgeError('zaun', edgeBetween(${x}, ${y}, 14, ${y}))`)).toMatch(/Seite der Gleis-Rampe/);
    // Linie gezogen: rot an der Seite
    const P = "{ kind: 'edge', tool: 'zaun', a: { x: 14, y: 12 }, b: { x: 14, y: 14 } }";
    expect(game(`planEdges(${P}).sort()`)).toEqual([game('edgeBetween(13, 12, 14, 12)'), game('edgeBetween(13, 13, 14, 13)')].sort());
    expect(game(`(s => [s.n, s.bad])(planScan(${P}))`)).toEqual([0, 2]);
    // Damm B vor der Wand: an seine Seiten geht es (wie bisher)
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); recalc()");
    expect(game("edgeError('zaun', edgeBetween(11, 15, 12, 15))")).toBe(null);
    game("rampNewForm = 'a'");
  });
});

describe('11 Fußgängerbrücken, die schon vor der Regel an einer Kante standen', () => {
  it('werden beim Laden nachgeprüft: wieder Schranken, bezahlt bleibt bezahlt (wieder einschalten, sobald der Boden eben ist); eben bleibt sie', () => {
    game("for (let x = 8; x <= 14; x++) build('schiene', x, 15, true); build('weg', 11, 14, true); build('weg', 11, 15, true); build('weg', 11, 16, true); recalc()");
    expect(game("isCrossing(state.tiles.get('11,15'))")).toBe(true);
    game("Object.assign(state.tiles.get('11,15'), { foot: true, footPaid: 'holz' }); for (const k of ['11,13', '11,14', '10,14', '12,14']) state.hills.set(k, { w: 0 }); groundVersion++; recalc()");
    expect(game('archHillError(11, 15)')).not.toBe(null);                             // so ginge sie heute nicht mehr
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    const t = () => game("(t => [!!t.foot, footPaidOf(t)])(state.tiles.get('11,15'))");
    expect(t()).toEqual([false, 'holz']);
    // eben (die Anhöhe ist weg): wieder einschalten kostet nichts
    game("for (const k of ['11,13', '11,14', '10,14', '12,14']) state.hills.delete(k); groundVersion++; recalc()");
    const m0 = game('state.money');
    expect(game("setCrossing(11, 15, true, 'holz')")).toBe(true);
    expect([...t(), game('state.money')]).toEqual([true, 'holz', m0]);
    // eine ebene bleibt beim Laden, wie sie ist
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(t()).toEqual([true, 'holz']);
  });
});

describe('8 Gleis-Rampe in ✋-Gruppen und ⧉ Kopien: Ablegen an der Wand wie die einzelne Rampe', () => {
  it('angetipptes Feld an der Wand: die Gruppe rückt so, dass die Rampe dort an der Wand steht (passt die Mitte schon, bleibt sie)', () => {
    hills(block(10, 10, 13, 13)); hills(block(20, 10, 23, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); build('schiene', 11, 17, true); recalc()");
    expect(game('rampAt(11, 16) && rampAt(11, 16).i')).toBe(0);
    // ⧉ Kopie nur der Rampe (Griff = Mitte, 11,15): an der Wand der zweiten Anhöhe (21,14 = oberstes Feld) angetippt
    game("setTool('verschieben'); startCopy(11, 14, 11, 16)");
    expect(game("moving && moving.kind === 'group' && moving.copy")).toBe(true);
    expect(game('rampTool()')).toBe(true);
    expect(game('groupErrors(21, 14).first')).not.toBe(null);                          // am Griff abgelegt: läge zur Hälfte auf der Anhöhe
    expect(game('rampAnchor(21, 14)')).toEqual([21, 15]);
    expect(game('rampAnchor(21, 15)')).toEqual([21, 15]);                              // passt schon: bleibt
    expect(game('dropAt(21, 15)')).toBe(true);
    expect(game('[rampAt(21, 16) && rampAt(21, 16).i, rampAt(21, 14) && rampAt(21, 14).i]')).toEqual([0, 2]);
    if (game('!!moving')) game('cancelMove()');
    // ✋-Gruppe Rampe + Schiene davor (Griff 11,16): an der Wand angetippt
    game("setTool('verschieben'); pickUpGroup(11, 14, 11, 17)");
    expect(game("moving && moving.kind === 'group' && !moving.copy")).toBe(true);
    expect(game('rampAnchor(22, 14)')).toEqual([22, 16]);
    expect(game('dropAt(22, 16)')).toBe(true);
    expect(game("[rampAt(22, 16) && rampAt(22, 16).i, bAt(22, 17)]")).toEqual([0, 'schiene']);
    game("setTool('look'); rampNewForm = 'a'");
  });
});

describe('6 Treppen vor einem Zug werden ausgespart', () => {
  const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
  const fakeTrain = keys => game(`(() => {
    trains.length = 0;
    const route = railPolyline(${JSON.stringify(keys.map(k => k.join()))}), kind = { ...TRAIN_KIND.regio, n: TRAIN_KIND.regio.n };
    const half = kind.n * (kind.len + kind.gap) / 2;
    trains.push({ id: 'probe', route, stops: [half, route.len - half], powered: true, model: 'regio', col: 0, kind, c: half, dir: 1, wait: 0, next: 1 });
    return route.len;
  })()`);
  it('Gleis unten längs einer Anhöhe, davor eine Treppe (früher gezeichnet): occ mit ihrem Keil, der Wagen malt nicht darüber', () => {
    hills(block(8, 14, 20, 16));
    game("build('huegeltreppe', 11, 13); build('huegeltreppe', 15, 13)");
    expect(game('[stairRotOf(stairAt(11, 13)), stairRotOf(stairAt(15, 13))]')).toEqual([2, 2]);
    const keys = []; for (let x = 6; x <= 22; x++) keys.push([x, 12]);
    rails(keys); const len = fakeTrain(keys);
    const seen = new Set();
    for (let c = 0.5; c <= len - 0.5; c += 0.05) {
      const occ = JSON.parse(game(`(() => { trains[0].c = ${c}; return JSON.stringify(trainCars().flatMap(m => { trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py)); return m.hill ? m.hill.occ : []; })); })()`));
      for (const q of occ) if (q[3] != null) { expect([q[1], q[3]]).toEqual([13, 2]); seen.add(q[0]); }
    }
    expect([...seen].sort()).toEqual([11, 15]);
    // Umriss: Keil – hinten (an der Wand) so hoch wie die Anhöhe, vorn eine Stufe
    const o = game(`(() => { const S = (u, v, h) => { const p = toScreen(u, v); return [p.x, p.y - h]; }; return occOutline([11, 13, 0, 2], S); })()`);
    const inside = (u, v, h) => game(`(p => ptInConvex(${JSON.stringify(o)}, p.x, p.y - ${h}))(toScreen(${u}, ${v}))`);
    expect([inside(11, 13.45, 24), inside(11, 12.55, 2), inside(11, 12.55, 20)]).toEqual([true, true, false]);   // vorn über der untersten Stufe frei
    // zeichnen ohne Fehler
    expect(() => game(`trains[0].c = ${len / 2}; render(1e6)`)).not.toThrow();
    game('trains.length = 0; syncTrains.sig = null');
  });
});

describe('7 Gleis-Rampe weit weg (WebGL): die Zelle des Wagens reicht für das Nachmalen der Rampe', () => {
  const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const anchor = (fx, fy, rot, len) => { const [Du, Dv] = UP[rot]; return [Math.min(fx, fx + (len - 1) * Du), Math.min(fy, fy + (len - 1) * Dv)]; };
  for (const form of ['d', 'c']) for (const rot of [0, 1, 2, 3]) it(`${form.toUpperCase()}, hinauf nach ${['−y', '+x', '+y', '−x'][rot]}, Tram (längster Wagen): alle Flächen von rampOverSpan liegen in glMoverBox`, () => {
    hills(block(10, 10, 18, 18));
    const len = game(`RAMP_FORMS.${form}.len`), cut = game(`RAMP_FORMS.${form}.cut`), [Du, Dv] = UP[rot];
    const o = len - 1 - cut, foot = [[14, 19 + o], [9 - o, 14], [14, 9 - o], [19 + o, 14]][rot];          // A/C in den Rand eingelassen, B/D davor (wie anhoehe-stufe2)
    const [ax, ay] = anchor(foot[0], foot[1], rot, len);
    game(`rampNewForm = '${form}'; buildRot = ${rot}; rotManual = true`);
    expect(game(`placeError('huegelrampe', ${ax}, ${ay})`)).toBe(null);
    game(`build('huegelrampe', ${ax}, ${ay}, true); rotManual = false; recalc()`);
    const keys = []; for (let i = -3; i < len + 3; i++) keys.push([foot[0] + i * Du, foot[1] + i * Dv]);
    game(`for (const [x, y] of ${JSON.stringify(keys.filter((_, i) => i < 3 || i >= 3 + len))}) build('schiene', x, y, true); recalc()`);
    const rl = game(`(() => { trains.length = 0; const route = railPolyline(${JSON.stringify(keys.map(k => k.join()))}), kind = { ...TRAIN_KIND.tram, n: 1 };
      trains.push({ id: 'probe', route, stops: [1, route.len - 1], powered: true, model: 'tram', col: 0, kind, c: 1, dir: 1, wait: 0, next: 1 }); return route.len; })()`);
    game(`cam.z = 2; { const p = iso(14, 14); cam.x = p.x; cam.y = p.y; } render(1e6)`);   // Bildchen der Rampe anlegen
    let checked = 0;
    for (let c = 0.5; c <= rl - 0.5; c += 0.1) {
      const bad = game(`(() => {
        trains[0].c = ${c};
        const out = [], z = cam.z;
        for (const m of trainCars()) {
          trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py));
          const hl = m.hill;
          if (!hl || !hl.ramp) continue;
          const pts = [], prev = g, st = {};
          g = new Proxy(st, { get: (t, p) => p in t ? t[p] : p === 'moveTo' || p === 'lineTo' ? (x, y) => pts.push([x, y + (st.ty || 0)]) : p === 'translate' ? (a, b) => { st.ty = (st.ty || 0) + b; } : p === 'save' ? () => { st.stack = (st.stack || []).concat([st.ty || 0]); } : p === 'restore' ? () => { st.ty = st.stack.pop(); } : () => {}, set: (t, p, v) => { t[p] = v; return true; } });
          try { g.translate(0, -hl.base * z); rampOverSpan(hl.ramp[0], hl.ramp[1], hl.ramp[2], hl.ramp[3], z, hl.base * z); } finally { g = prev; }
          const p = toScreen(m.px, m.py), cy = p.y - hl.base * z, [l, u, r, d] = glMoverBox(m, z);
          if (pts.length) out.push(pts.filter(([x, y]) => x < p.x - l - 0.01 || x > p.x + r + 0.01 || y < cy - u - 0.01 || y > cy + d + 0.01).length, 1);
        }
        return out;
      })()`);
      for (let i = 0; i < bad.length; i += 2) { expect([c, bad[i]]).toEqual([c, 0]); checked++; }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
