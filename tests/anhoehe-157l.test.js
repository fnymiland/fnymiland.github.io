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
