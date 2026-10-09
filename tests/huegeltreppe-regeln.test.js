const { loadGame, game } = require('./helpers/load-game');

// Block 157d: Treppe in die Anhöhe – Regeln, Drehung, Stil, Abtragen, Antippen, Zeichnen (ohne draw-objects.js: drawHillStair direkt)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 22; y++) for (let x = 4; x <= 22; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(9, 9); cam.x = p.x; cam.y = p.y; }');
});
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true)`);
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };

describe('Treppe in die Anhöhe (Block 157d)', () => {
  it('steht im Menü hinter der Anhöhe (eigene Gruppe „Anhöhen“), mit Kurzwirkung und Tipp', () => {
    const items = game("MENU.find(m => m.id === 'gestalten').groups.find(g => g.id === 'hoehen').items");
    expect(items).toEqual(['anhoehe', 'huegeltreppe']);
    expect(game("menuPlaceOf('huegeltreppe')")).toEqual({ top: 'gestalten', sub: 'hoehen' });
    expect(game("[ITEMS.huegeltreppe.cat, ITEMS.huegeltreppe.tech, !!FX.huegeltreppe, !!ITEM_TIPS.huegeltreppe]")).toEqual(['deko', 'terraform', true, true]);
  });

  it('nur unten direkt vor der Wand; dreht sich von selbst zur Anhöhe', () => {
    hills(block(6, 6, 8, 7));                                            // Anhöhe 3 × 2
    expect(game("placeError('huegeltreppe', 12, 12)")).toMatch(/vor die Wand einer Anhöhe/);
    expect(game("placeError('huegeltreppe', 7, 7)")).toMatch(/steht unten/);
    // vor der vorderen Wand (+y): hinauf = −y (rot 0); vor der rechten (+x): hinauf = −x (rot 3); hinter der Anhöhe: +y (rot 2)
    expect(game("[placeRot('huegeltreppe', 7, 8), placeRot('huegeltreppe', 9, 6), placeRot('huegeltreppe', 7, 5), placeRot('huegeltreppe', 5, 6)]")).toEqual([0, 3, 2, 1]);
    expect(game("placeError('huegeltreppe', 7, 8)")).toBe(null);
    expect(game("placeError('huegeltreppe', 7, 8, 1)")).toMatch(/zur Anhöhe hinauf/);
    // Ecke außen (9, 8): nur über Eck – keine Anhöhe direkt dahinter
    expect(game("placeError('huegeltreppe', 9, 8)")).toMatch(/vor die Wand/);
    // nicht auf Weg, Wasser, unter Dach; keine kleine Deko darauf
    game("state.tiles.set('6,8', { b: 'weg', lvl: 1, style: 'sand' }); state.terra.set('8,8', 'water'); recalc()");
    expect(game("placeError('huegeltreppe', 6, 8)")).toMatch(/Nicht auf einen Weg/);
    expect(game("placeError('huegeltreppe', 8, 8)")).toBe('Nicht auf dem Wasser');
    game("state.roofs.set('9,7', { form: 0 }); recalc()");
    expect(game("placeError('huegeltreppe', 9, 7)")).toMatch(/Überdachung/);
    game("state.roofs.clear(); buildSmall('baum', 9, 7, 0)");
    expect(game("placeError('huegeltreppe', 9, 7)")).toMatch(/kleine Dekos/);
    // zwei Anhöhen in Frage: lieber zum Weg am Fuß; ohne Weg die gewählte Drehung, sonst die erste
    game("state.decos.clear(); state.tiles.delete('6,8'); state.terra.set('8,8', 'grass'); recalc()");
    hills([[10, 10], [11, 9]]);                                          // Feld (11, 10): Anhöhe links (−x) und oben (−y)
    expect(game("stairDirs(11, 10)")).toEqual([0, 3]);
    expect(game("buildRot = 3; placeRot('huegeltreppe', 11, 10)")).toBe(3);
    expect(game("buildRot = 1; placeRot('huegeltreppe', 11, 10)")).toBe(0);
    game("state.tiles.set('12,10', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");   // Weg rechts am Fuß von rot 3
    expect(game("placeRot('huegeltreppe', 11, 10)")).toBe(3);
  });

  it('Bauen: Stil aus der Leiste (sonst wie der Weg, nie Trittsteine), Linie quer davor geht nicht, Abriss voll zurück', () => {
    hills(block(6, 6, 8, 7));
    game("chosenStyle.weg = 'klinker'");
    const m0 = game('state.money');
    expect(game("build('huegeltreppe', 7, 8)")).toBe(true);
    expect(game("(t => [t.rot || 0, t.style])(state.tiles.get('7,8'))")).toEqual([0, 'klinker']);
    expect(game('state.money')).toBe(m0 - game('ITEMS.huegeltreppe.cost'));
    game("chosenStyle.huegeltreppe = 'm:platten:hell'; build('huegeltreppe', 6, 8)");
    expect(game("state.tiles.get('6,8').style")).toBe('m:platten:hell');
    game("delete chosenStyle.huegeltreppe; chosenStyle.weg = 'tritt'");
    expect(game("stairStyleNew()")).not.toBe('tritt');
    // Linien: quer vor den Fuß nicht, an die Seite (zwischen zwei Treppen: dort ist keine Seite frei – daneben) schon
    expect(game("edgeError('zaun', edgeBetween(7, 8, 7, 9))")).toMatch(/quer vor die Treppe/);
    expect(game("edgeError('zaun', edgeBetween(7, 8, 8, 8))")).toBe(null);
    expect(game("placeError('weg', 7, 8)")).not.toBe(null);              // kein Weg unter die Treppe
    expect(game("smallError('bank', 7, 8, 3)")).toMatch(/kein Platz/);
    const m1 = game('state.money');
    expect(game("(i => [i.full, i.refund])(demolishInfo(7, 8))")).toEqual([true, game('ITEMS.huegeltreppe.cost')]);
    game('demolish(7, 8)');
    expect(game("state.tiles.has('7,8')")).toBe(false);
    expect(game('state.money')).toBe(m1 + game('ITEMS.huegeltreppe.cost'));
  });

  it('Anhöhe mit Treppe bleibt (Abtragen gesperrt), Fuß bleibt frei; im Rechteck geht beides zusammen', () => {
    hills(block(6, 6, 8, 7));
    game("build('huegeltreppe', 7, 8)");
    expect(game("hillStairs().map(s => [s.x, s.y, s.dx, s.dy, s.rot])")).toEqual([[7, 8, 0, -1, 0]]);
    expect(game('demolishInfo(7, 7).err')).toMatch(/Treppe hinauf/);
    expect(game('lowerHill(7, 7)')).toBe(false);
    expect(game('demolishInfo(6, 7).hill')).toBe('6,7');                // daneben geht
    expect(game('hillRaiseError(7, 9)')).toMatch(/Fuß der Treppe/);
    expect(game('hillRaiseError(7, 8)')).toMatch(/Treppe/);
    // Rechteck nur über die Anhöhe: das Feld oben bleibt rot; mit der Treppe zusammen geht alles
    game("setTool('abriss'); startPlan('rect', { x: 6, y: 6 }, { x: 8, y: 7 }, true)");
    expect(game("planInfo(plan).states.get('7,7')")).toBe('bad');
    game("startPlan('rect', { x: 6, y: 6 }, { x: 8, y: 8 }, true)");
    expect(game("planInfo(plan).states.get('7,7')")).toBe('ok');
    game('runPlan()');
    expect(game('[state.hills.size, state.tiles.has("7,8")]')).toEqual([0, false]);
  });

  it('Höhe auf der Treppe und Antippen der oberen Stufen', () => {
    hills(block(6, 6, 8, 7));
    game("build('huegeltreppe', 7, 8)");                                // steigt nach −y: vorn (y + 0,5) unten, hinten oben
    const H = game('HILL_H');
    expect(game('stairHeight(7, 8, 7, 8.49)')).toBeCloseTo(H / 8);
    expect(game('stairHeight(7, 8, 7, 7.51)')).toBeCloseTo(H);
    expect(game('stairHeight(7, 8, 7, 8)')).toBeCloseTo(H * 5 / 8);
    expect(game('stairHeight(7, 8, 8.6, 8)')).toBe(0);
    expect(game('stairHeight(6, 8, 6, 8)')).toBe(0);
    // auf die oberste Stufe getippt: das Treppenfeld, nicht die Anhöhe dahinter
    const hit = game(`(() => { const p = toScreen(7, 7.56); return toTile(p.x, p.y - ${H} * cam.z); })()`);
    expect(hit).toEqual({ x: 7, y: 8 });
    const top = game(`(() => { const p = toScreen(7, 7.3); return toTile(p.x, p.y - ${H} * cam.z); })()`);
    expect(top).toEqual({ x: 7, y: 7 });                                 // oben auf der Anhöhe bleibt sie selbst
  });

  it('Zeichnen in allen vier Richtungen, mit Keil, Wange und breiter Treppe – ohne Fehler; Bildchen werden wiederverwendet', () => {
    hills(block(8, 8, 10, 10));
    for (const [x, y] of [[9, 11], [11, 9], [9, 7], [7, 9], [10, 11]]) game(`build('huegeltreppe', ${x}, ${y})`);
    expect(game("[9, 10].map(x => stairLook(x, 11, stairAt(x, 11))).map(o => o.m + o.p)")).toEqual(['kj', 'jk']);   // breite Treppe: Keil nur außen
    game('globalThis.__ctxCount = {}');
    for (const [x, y] of [[9, 11], [11, 9], [9, 7], [7, 9], [10, 11]]) game(`(() => { const p = toScreen(${x}, ${y}); drawHillStair(p.x, p.y, cam.z, ${x}, ${y}); })()`);
    const first = game('({ ...globalThis.__ctxCount })');
    expect(first.drawImage).toBe(5);
    game('globalThis.__ctxCount = {}; frameNo++');
    for (const [x, y] of [[9, 11], [11, 9], [9, 7], [7, 9], [10, 11]]) game(`(() => { const p = toScreen(${x}, ${y}); drawHillStair(p.x, p.y, cam.z, ${x}, ${y}); })()`);
    expect(game('globalThis.__ctxCount')).toEqual({ drawImage: 5 });     // nächstes Bild: nur noch die Bildchen
    game('globalThis.__ctxCount = {}');
    for (const [x, y] of [[9, 11], [11, 9], [9, 7], [7, 9]]) game(`drawHillStairOver(${x}, ${y}, cam.z, -0.2)`);   // vor Figuren: Keil, Stufen davor
    expect(game('globalThis.__ctxCount.drawImage')).toBe(3);   // (9, 11): vorn die breite Nachbartreppe, steigt weg – nichts davor
    game('globalThis.__ctxCount = null');
    // Vorschau (Ding ohne Feld) und Vorschaubild
    game("(() => { const p = toScreen(8, 11); drawHillStair(p.x, p.y, cam.z, 8, 11, { b: 'huegeltreppe', rot: 0, style: 'sand' }); })()");
    expect(game("thumb('huegeltreppe') instanceof HTMLCanvasElement")).toBe(true);
    // Anhöhe vorn an der Treppe: keine Grasnarbe, hinten keine Kante
    expect(game('hillStairEnds(9, 10)')).toBe('v');
    expect(game('hillStairEnds(10, 9)')).toBe('u');
    expect(game('hillStairEnds(9, 8)')).toBe('V');
    expect(game('hillStairEnds(8, 9)')).toBe('U');
    game('drawHillShadows(() => true)');
  });

  it('ohne Anhöhen: Antippen und Zeichnen wie vorher', () => {
    expect(game('stairFresh().n')).toBe(0);
    expect(game('(() => { const a = pickFrac(300, 200), b = tileFrac(300, 200); return a[0] === b[0] && a[1] === b[1]; })()')).toBe(true);
    expect(game('hillStairs()')).toEqual([]);
  });
});
