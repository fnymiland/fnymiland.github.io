const { loadGame, game } = require('./helpers/load-game');

// Block 157d: Treppe in die Anhöhe (hills.js) und Spaziergänger (hill-walkers.js) zusammen – Bauen vor der Wand mit Drehung zur Anhöhe,
// Stufen im Wegstil (Leiste und Fenster), breite Treppe, Wange an der Kante, Abtragen/Abreißen, Speichern/Laden, ↶; Leute kommen vom
// Weg, steigen hinauf, bummeln oben, setzen sich auf Bänke, gehen wieder; Antippen; Zeichnen nah/weit/nachts
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; hillWalkers.length = 0; recalc(); resetUndo()");
  game("state.tiles.set('22,22', { b: 'haus', lvl: 3, animal: 1 }); recalc()");          // Bewohner, aus denen Spaziergänger werden
  game('cam = state.cam; cam.z = 2; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true)`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const panel = () => game("document.getElementById('panel').textContent");
// Treppe vor jeder Seite der Anhöhe 10–13 × 10–13: Feld, Drehung (hinauf: STAIR_UP[rot]) und ein Weg, der am Fuß endet
const SIDES = [[11, 14, 0], [14, 11, 3], [11, 9, 2], [9, 11, 1]];
const footWay = (x, y, rot) => { const [dx, dy] = game(`STAIR_UP[${rot}]`); return [1, 2, 3, 4].map(i => [x - dx * i, y - dy * i]); };
// Höhe über dem Boden (Bildpunkte bei Zoom 1): w.up gilt über dem Feld, auf dem die Figur steht (oben hebt das Feld sie an)
const H_ABS = "(w => w.up == null ? 0 : w.up + hillLift(Math.round(w.px), Math.round(w.py)))";

describe('Treppe in die Anhöhe (Block 157d)', () => {
  it('Menü: Anhöhe und Treppe in eigener Gruppe hinter „Wege & Gelände“ – auch bei gemerkter eigener Anordnung', () => {
    const top = "MENU.find(m => m.id === 'gestalten')";
    expect(game(`${top}.groups.map(g => g.id).slice(0, 2)`)).toEqual(['land', 'hoehen']);
    expect(game(`${top}.groups.find(g => g.id === 'hoehen').items`)).toEqual(['anhoehe', 'huegeltreppe']);
    game(`localStorage.setItem('kachelhausen_menuorder', JSON.stringify({ gestalten: ['dach', 'land', 'gruen', 'platz', 'linien', 'besonderes'] }))`);   // vor Block 157d angeordnet
    expect(game(`orderedGroups(${top}).map(g => g.id)`)).toEqual(['dach', 'land', 'hoehen', 'gruen', 'platz', 'linien', 'besonderes']);
    game("localStorage.removeItem('kachelhausen_menuorder')");
  });

  it('nur unten direkt vor der Wand, dreht sich von selbst zur Anhöhe; nicht auf Anhöhe, Wasser, Weg; kostet Taler und Stein', () => {
    hills(block(10, 10, 13, 13));
    expect(game("placeError('huegeltreppe', 11, 11)")).toMatch(/steht unten/);               // oben auf der Anhöhe
    expect(game("placeError('huegeltreppe', 17, 17)")).toMatch(/vor die Wand/);              // frei auf der Wiese
    game("state.terra.set('12,14', 'water'); recalc()");
    expect(game("placeError('huegeltreppe', 12, 14)")).toBe('Nicht auf dem Wasser');
    weg([[13, 14]]);
    expect(game("placeError('huegeltreppe', 13, 14)")).toMatch(/Nicht auf einen Weg/);
    const m0 = game('state.money'), s0 = game('state.res.stein');
    for (const [x, y, rot] of SIDES) {
      game(`buildRot = ${(rot + 1) % 4}`);                                                    // gewählte Drehung passt nicht: dreht trotzdem hinauf
      expect(game(`build('huegeltreppe', ${x}, ${y})`)).toBe(true);
      expect(game(`state.tiles.get('${x},${y}').rot || 0`)).toBe(rot);
    }
    expect(game('state.money')).toBe(m0 - 4 * game('ITEMS.huegeltreppe.cost'));
    expect(game('state.res.stein')).toBe(s0 - 4 * game('ITEMS.huegeltreppe.mat.stein'));
    expect(game('hillStairs().map(s => [s.x, s.y, s.rot, s.dx, s.dy])')).toEqual(expect.arrayContaining(SIDES.map(([x, y, r]) => [x, y, r, ...game(`STAIR_UP[${r}]`)])));
    expect(game('hillStairs().length')).toBe(4);
    // hinter der Treppe Anhöhe, davor Platz: keine Anhöhe vor den Fuß, keine Treppe auf die Treppe
    expect(game('hillRaiseError(11, 15)')).toMatch(/Fuß der Treppe/);
    expect(game("placeError('graben', 11, 15)")).toMatch(/Fuß der Treppe/);                  // kein Teich vor den Fuß
    expect(game("placeError('graben', 12, 15)")).toBe(null);
    expect(game("placeError('huegeltreppe', 11, 14)")).not.toBe(null);
    expect(game("placeError('haus', 11, 14)")).not.toBe(null);
  });

  it('Stufen im Wegstil: aus der Leiste (ohne Trittsteine und Wegform), im Fenster für die ganze breite Treppe, ↶ nimmt es zurück', () => {
    hills(block(10, 10, 13, 13));
    game("setTool('huegeltreppe')");
    const bar = () => game("document.getElementById('style-bar').innerHTML");
    expect(bar()).toMatch(/data-wpop="muster"/);
    expect(bar()).not.toMatch(/data-wegopt/);                                                 // keine Wegform (schmal/breit, Kurve)
    game("document.querySelector('#style-bar [data-wpop=\"muster\"]').click()");
    const pats = game("[...document.querySelectorAll('#style-bar [data-wm]')].map(b => b.dataset.wm)");
    expect(pats).toContain('platten');
    expect(pats).not.toContain('tritt');                                                      // Trittsteine haben keine Fläche
    game("document.querySelector('#style-bar [data-wm=\"platten\"]').click()");
    const st = game('chosenStyle.huegeltreppe');
    expect(game(`wegParts(${JSON.stringify(st)})[0]`)).toBe('platten');
    expect(game('chosenStyle.weg')).toBe('sand');                                             // der Weg behält seinen Stil
    expect(game('stairStyleNew()')).toBe(st);
    game("build('huegeltreppe', 11, 14); build('huegeltreppe', 12, 14); setTool('look')");
    expect(game("[state.tiles.get('11,14').style, state.tiles.get('12,14').style]")).toEqual([st, st]);
    // Fenster: Belag für die ganze breite Treppe
    game('openInfo(11, 14)');
    expect(panel()).toMatch(/Führt hinauf/);
    expect(panel()).toMatch(/2 Felder/);
    const other = game(`[...document.querySelectorAll('#panel [data-stairbel]')].map(b => b.dataset.stairbel).find(s => s !== ${JSON.stringify(st)} && !wegParts(s)[0].startsWith('tritt'))`);
    expect(other).toBeTruthy();
    expect(game("[...document.querySelectorAll('#panel [data-stairbel]')].some(b => wegParts(b.dataset.stairbel)[0] === 'tritt')")).toBe(false);
    game(`document.querySelector('#panel [data-stairbel=${JSON.stringify(other)}]').click()`);
    expect(game("[state.tiles.get('11,14').style, state.tiles.get('12,14').style]")).toEqual([other, other]);
    expect(game('undo()')).toBe(true);
    expect(game("[state.tiles.get('11,14').style, state.tiles.get('12,14').style]")).toEqual([st, st]);
    game('closePanel()');
  });

  it('breite Treppe: nebeneinander keine Wange dazwischen; an der Kante eine Wange in der Wandart der Anhöhe, neben Anhöhe ihre Wand', () => {
    game('state.paintNew.anhoehe = { form: 1 }');                                             // Erde
    hills(block(10, 10, 13, 13).concat([[10, 14]]));                                          // links vor der Wand ein Stück Anhöhe
    game("build('huegeltreppe', 11, 14); build('huegeltreppe', 12, 14); build('huegeltreppe', 13, 14)");
    const look = (x, y) => game(`(o => o.m + o.p + ':' + o.kind)(stairLook(${x}, ${y}, stairAt(${x}, ${y})))`);
    expect([look(11, 14), look(12, 14), look(13, 14)]).toEqual(['hj:erde', 'jj:erde', 'jk:erde']);   // h: Wand der Anhöhe, j: durch, k: Keil
    expect(game('stairRow(12, 14).length')).toBe(3);
    // keine Linie mitten durch die breite Treppe (sie stünde unten zwischen den Stufen) – und keine Treppe neben eine solche Linie
    expect(game("edgeError('zaun', edgeBetween(11, 14, 12, 14))")).toMatch(/breite Treppe/);
    game("state.edges.set(edgeBetween(15, 14, 16, 14), { b: 'zaun', style: 0 }); recalc()");
    hills([[15, 13], [16, 13]]);
    game("build('huegeltreppe', 15, 14)");
    expect(game("placeError('huegeltreppe', 16, 14)")).toMatch(/Zwischen den Treppen steht: Zaun/);
    game("state.edges.delete(edgeBetween(15, 14, 16, 14)); demolish(15, 14); state.hills.delete('15,13'); state.hills.delete('16,13'); recalc()");
    // gezeichnet als Bildchen: das Aussehen steckt im Schlüssel; Nachbar weg → eigenes neues Bild mit Keil
    game('render(1e6)');
    const base = game("hillSprites.get('s12,14').base");
    expect(base).toMatch(/jj/);
    game('demolish(13, 14)');
    expect(look(12, 14)).toBe('jk:erde');
    game('render(1e6)');
    expect(game("hillSprites.get('s12,14').base")).not.toBe(base);
    expect(game("hillSprites.get('s12,14').base")).toMatch(/jk/);
    // andere Richtung daneben: keine breite Treppe
    hills([[16, 13]]);
    game("build('huegeltreppe', 16, 14); build('huegeltreppe', 15, 13)");                    // 15,13: hinauf nach +x
    expect(game("stairAt(15, 13).rot")).toBe(1);
    expect(look(16, 14)).toBe('kk:erde');
    // Anhöhe vorn ohne Grasnarbe, hinten ohne Kante, wo die Treppe ankommt
    expect(game('hillStairEnds(11, 13)')).toBe('v');
  });

  it('Anhöhe mit Treppe davor lässt sich nicht abtragen (Fenster, ↶); Abreißen der Treppe gibt alles zurück, dann geht Abtragen', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegeltreppe', 11, 14)");
    expect(game('demolishInfo(11, 13).err')).toMatch(/Treppe hinauf/);
    expect(game('lowerHill(11, 13)')).toBe(false);
    game('openHillInfo(11, 13)');
    expect(game("document.getElementById('p-del').disabled")).toBe(true);
    game('closePanel()');
    const m0 = game('state.money'), s0 = game('state.res.stein');
    expect(game('demolishInfo(11, 14).full')).toBe(true);
    game('undoable(() => demolish(11, 14))');
    expect(game("state.tiles.has('11,14')")).toBe(false);
    expect([game('state.money'), game('state.res.stein')]).toEqual([m0 + game('ITEMS.huegeltreppe.cost'), s0 + game('ITEMS.huegeltreppe.mat.stein')]);
    expect(game('undo()')).toBe(true);                                                        // ↶: Treppe wieder da, Taler und Stein zurück
    expect([game("stairAt(11, 14) && stairAt(11, 14).rot || 0"), game('state.money'), game('state.res.stein')]).toEqual([0, m0, s0]);
    game('demolish(11, 14)');
    expect(game('lowerHill(11, 13)')).toBe(true);
    // ↶ einer Anhöhe, vor der inzwischen eine Treppe steht: geht nicht (sonst führte die Treppe ins Leere)
    game('resetUndo(); undoable(() => build("anhoehe", 17, 10))');
    game("build('huegeltreppe', 17, 11)");
    expect(game('undo()')).toBe(false);
    expect(game("state.hills.has('17,10')")).toBe(true);
  });

  it('✋ Gruppen: kein Dach über die Treppe legen; gedrehte Gruppe dreht die Treppe mit (zeigt weiter hinauf)', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegeltreppe', 11, 14); state.roofs.set('17,17', { form: 0 }); recalc()");
    game("pickUpRoofs(['17,17'])");
    expect(game('groupErrors(11, 14).first')).toMatch(/Über einer Treppe/);                    // sonst stünde ein Dach über den Stufen
    game('cancelMove()');
    expect(game("!!state.roofs.get('17,17') && !state.roofs.get('11,14')")).toBe(true);
    // Treppe mit Bank am Fuß kopieren, eine Vierteldrehung: Fuß jetzt links (−x), hinauf nach +x – passt vor die linke Wand
    game("buildSmall('bank', 11, 15, 0); startCopy(11, 14, 11, 15); rotateGroup(1)");
    expect(game('groupErrors(9, 12).first')).toBe(null);
    expect(game('dropGroup(9, 12)')).toBe(true);
    expect(game('stairAt(9, 12).rot')).toBe(1);
    game('cancelMove()');
  });

  it('Speichern und Laden behalten Drehung und Stil; ↶ nach dem Bauen nimmt die Treppe samt Preis zurück', () => {
    hills(block(10, 10, 13, 13));
    game("chosenStyle.huegeltreppe = 'klinker'; build('huegeltreppe', 11, 14); build('huegeltreppe', 14, 11)");
    const before = game('JSON.stringify(hillStairs().map(s => [s.k, s.rot]))');
    const tiles = game("[...state.tiles].filter(([, t]) => t.b === 'huegeltreppe').map(([k, t]) => [k, t.rot || 0, t.style])");
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(game("[...state.tiles].filter(([, t]) => t.b === 'huegeltreppe').map(([k, t]) => [k, t.rot || 0, t.style])")).toEqual(tiles);
    expect(game('JSON.stringify(hillStairs().map(s => [s.k, s.rot]))')).toBe(before);
    expect(game("state.tiles.get('11,14').style")).toBe('klinker');
    const m0 = game('state.money');
    expect(game("undoable(() => build('huegeltreppe', 12, 14))")).toBe(true);
    expect(game('undo()')).toBe(true);
    expect([game("state.tiles.has('12,14')"), game('state.money')]).toEqual([false, m0]);
  });
});

describe('Spaziergänger auf Anhöhen (Block 157d)', () => {
  // Spieluhr fest auf Mittag: nachts kommen nur halb so viele (die Spieluhr läuft mit der echten Zeit – sonst hinge das Ergebnis von der Uhrzeit ab)
  beforeEach(() => game('window.__gh = gameHour; gameHour = () => 12'));
  afterEach(() => game('gameHour = window.__gh'));
  it('erscheinen nur mit Treppe, kommen vom Weg in der Nähe; ohne Zugang zum Fuß keine', () => {
    game('for (let i = 0; i < 6; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBe(0);                                               // ohne Anhöhe
    hills(block(10, 10, 13, 13));
    game('for (let i = 0; i < 6; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBe(0);                                               // ohne Treppe
    game("build('huegeltreppe', 11, 14)");
    weg(footWay(11, 14, 0).slice(1));                                                         // Weg ab dem zweiten Feld vor dem Fuß
    game('for (let i = 0; i < 12; i++) syncHillWalkers()');
    const n = game('hillWalkers.length');
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(game('hwStairs()[0].G.want'));                              // je nach Größe der Anhöhe
    expect(game("hillWalkers.every(w => w.st === 'in' && w.up === null && hwIsWay(...w.path[0]))")).toBe(true);
    expect(game('hillWalkers.every(w => { const e = w.path[w.path.length - 1]; return e[0] === 11 && e[1] === 14.5; })')).toBe(true);   // an den Fuß
    // nachts halb so viele
    game('hillWalkers.length = 0; { const dp = dayPart; dayPart = () => "nacht"; try { for (let i = 0; i < 12; i++) syncHillWalkers(); } finally { dayPart = dp; } }');
    expect(game('hillWalkers.length')).toBeLessThanOrEqual(Math.floor(game('hwStairs()[0].G.want') / 2));
    // Fuß verbaut: niemand kommt hin
    game("hillWalkers.length = 0; state.tiles.set('11,15', { b: 'haus', lvl: 1, animal: 2 }); recalc(); for (let i = 0; i < 12; i++) syncHillWalkers()");
    expect(game('hillWalkers.length')).toBe(0);
  });

  for (const [sx, sy, rot] of SIDES) it(`Treppe ${['nach hinten', 'nach links', 'nach vorn', 'nach rechts'][[0, 3, 2, 1].indexOf(rot)]} (rot ${rot}): hinauf mit stetiger Höhe, oben nur auf der Anhöhe, gehen wieder`, () => {
    hills(block(10, 10, 13, 13));
    game(`build('huegeltreppe', ${sx}, ${sy}); buildSmall('baum', 12, 12, CSLOT)`);
    weg(footWay(sx, sy, rot));
    game('for (let i = 0; i < 12; i++) syncHillWalkers()');
    expect(game('hillWalkers.length')).toBeGreaterThan(0);
    const H = game('HILL_H');
    game(`window.__prev = new Map(hillWalkers.map(w => [w, ${H_ABS}(w)])); window.__jump = 0; window.__bad = []; window.__top = 0; window.__maxH = 0`);
    for (let k = 0; k < 150; k++) game(`(() => { for (let i = 0; i < 10; i++) { stepHillWalkers(0.05); if (i === 0) syncHillWalkers();
      for (const w of hillWalkers) { const h = ${H_ABS}(w), p = __prev.has(w) ? __prev.get(w) : h; __jump = Math.max(__jump, Math.abs(h - p)); __prev.set(w, h); __maxH = Math.max(__maxH, h);
        if (w.st !== 'top') continue;
        __top++;
        const x = Math.round(w.px), y = Math.round(w.py);
        if (hillLevel(x, y) !== 1 || w.up !== 0) __bad.push('Kante ' + w.px + ',' + w.py);   // nie über die Kante: immer auf einem Anhöhen-Feld
        if (!w.sit && !w.go && w.t === 0 && !hwSpotOk(w.fa, w.fb, 1)) __bad.push('Punkt ' + w.fa + ',' + w.fb);
        if (!w.sit && !w.go && Math.hypot(w.px - 12, w.py - 12) < 0.25) __bad.push('Baum');   // nicht durch die Deko
      } } })()`);
    expect(game('__top')).toBeGreaterThan(0);
    expect(game('__bad')).toEqual([]);
    expect(game('__maxH')).toBeCloseTo(H);                                                     // oben angekommen
    expect(game('__jump')).toBeLessThanOrEqual(H / 8 + 1e-9);                                  // höchstens eine Stufe auf einmal
    // genug gebummelt: alle gehen über die Treppe hinunter, unten den Weg zurück, und sind weg
    game('for (const w of hillWalkers) { w.life = -1; w.leave = true; }');
    const seen = new Set();
    for (let k = 0; k < 80 && game('hillWalkers.length'); k++) for (const s of game("(() => { const out = []; for (let i = 0; i < 25; i++) { stepHillWalkers(0.05); for (const w of hillWalkers) out.push(w.st); } return [...new Set(out)]; })()")) seen.add(s);
    expect(game('hillWalkers.length')).toBe(0);
    expect(seen.has('down') && seen.has('out')).toBe(true);
  });

  it('ohne Weg zurück zum Ausstieg (Zaun quer über die Anhöhe): verschwinden statt ewig oben zu kreisen', () => {
    hills(block(10, 10, 15, 13));
    game("build('huegeltreppe', 11, 14)");
    weg(footWay(11, 14, 0));
    for (let k = 0; k < 60 && !game("hillWalkers.some(w => w.st === 'top')"); k++) game('for (let i = 0; i < 10; i++) { stepHillWalkers(0.05); if (i === 0) syncHillWalkers(); }');
    game("for (let y = 10; y <= 13; y++) state.edges.set(edgeBetween(12, y, 13, y), { b: 'zaun', style: 'latten' }); recalc()");
    // alle oben hinter den Zaun stellen und heimschicken
    game("for (const w of hillWalkers) if (w.st === 'top') Object.assign(w, { fa: 42, fb: 33, ta: 42, tb: 33, t: 1, pa: null, pb: null, go: null, bench: null, sit: false, wait: 0, route: null, life: -1, leave: true })");
    const trapped = game("hillWalkers.filter(w => w.fa === 42)");
    expect(trapped.length).toBeGreaterThan(0);
    game('window.__trap = hillWalkers.filter(w => w.fa === 42)');
    for (let k = 0; k < 20; k++) game('stepHillWalkers(0.05)');
    expect(game('__trap.every(w => w.gone && !hillWalkers.includes(w))')).toBe(true);
  });

  it('setzen sich oben auf eine Bank; Treppe weg oder anderer Spielstand: alle weg', () => {
    hills(block(10, 10, 12, 12));
    game("build('huegeltreppe', 11, 13); buildSmall('bank', 10, 10, 4)");
    weg(footWay(11, 13, 0));
    let sat = false;
    for (let k = 0; k < 300 && !sat; k++) sat = game('(() => { for (let i = 0; i < 20; i++) { stepHillWalkers(0.05); if (i === 0) syncHillWalkers(); } return hillWalkers.some(w => w.sit); })()');
    expect(sat).toBe(true);
    const seat = game("(() => { const [u, v] = slotPos(10, 10, 4, decosAt('10,10')[4]); return [10 + u, 10 + v]; })()");
    expect(game(`hillWalkers.filter(w => w.sit).every(w => Math.hypot(w.px - ${seat[0]}, w.py - ${seat[1]}) < 1e-6 && w.up === 0)`)).toBe(true);
    expect(game("walkerDoing(hillWalkers.find(w => w.sit))")).toMatch(/Bank auf der Anhöhe/);
    // Treppe weg: verschwinden – wer auf den Stufen steht, sofort (nicht erst beim nächsten Abgleich in der Luft)
    game("hillWalkers.push({ ...hillWalkers[0], st: 'up', d: 0, wait: 0, sit: false, go: null }); hwOnStair(hillWalkers[hillWalkers.length - 1]); window.__onStair = hillWalkers[hillWalkers.length - 1]");
    game("demolish(11, 13); stepHillWalkers(0.05)");
    expect(game('__onStair.gone && !hillWalkers.includes(__onStair)')).toBe(true);
    game("syncHillWalkers(); stepHillWalkers(0.05)");
    expect(game('hillWalkers.length')).toBe(0);
    // anderer Spielstand: weg
    game("build('huegeltreppe', 11, 13); for (let i = 0; i < 8; i++) syncHillWalkers()");
    expect(game('hillWalkers.length')).toBeGreaterThan(0);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(game('hillWalkers.length')).toBe(0);
  });

  it('antippen öffnet das Bewohner-Fenster, und es bleibt offen, solange die Figur da ist (oben und auf der Treppe)', () => {
    hills(block(10, 10, 12, 12));
    game("build('huegeltreppe', 11, 13)");
    game('cam.z = 2.5; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
    game("hillWalkers.length = 0; hillWalkers.push({ hillw: true, st0: state, stair: hwStairs()[0], st: 'top', fa: 33, fb: 33, ta: 33, tb: 33, t: 0, px: 11, py: 11, up: 0, wait: 99, lane: 0, home: '22,22', who: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 99 })");
    const at = () => game('(() => { const [hx, hy] = walkerHead(hillWalkers[0], cam.z); return [hx, hy + 6 * cam.z * FIG_SCALE]; })()');
    let [sx, sy] = at();
    expect(game(`walkerHead(hillWalkers[0], cam.z)[1] < toScreen(11, 11).y - HILL_H * cam.z`)).toBe(true);   // Kopf über der Anhöhe
    game(`setTool('look'); tap(${sx}, ${sy}, false)`);
    expect(panel()).toMatch(/Spaziert auf der Anhöhe/);
    for (let i = 0; i < 3; i++) game('stepHillWalkers(0.05); panelLive()');                  // Fenster frischt sich auf (updateHud)
    expect(panel()).toMatch(/Spaziert auf der Anhöhe/);
    expect(panel()).not.toMatch(/nach Hause/);
    game('closePanel()');
    // auf der Treppe
    game("Object.assign(hillWalkers[0], { st: 'up', d: 0, wait: 99 }); hwOnStair(hillWalkers[0])");
    [sx, sy] = at();
    game(`tap(${sx}, ${sy}, false)`);
    expect(panel()).toMatch(/Geht auf die Anhöhe/);
    game('closePanel(); hillWalkers.length = 0');
  });

  it('zeichnen nah, weit und nachts ohne Fehler – mit Treppen in allen Richtungen und Leuten unten, auf den Stufen und oben', () => {
    hills(block(10, 10, 13, 13));
    for (const [x, y] of SIDES) game(`build('huegeltreppe', ${x}, ${y})`);
    game("build('huegeltreppe', 12, 14); buildSmall('bank', 12, 11, 4)");                    // breit, Bank oben
    for (const [x, y, rot] of SIDES) weg(footWay(x, y, rot));
    for (let k = 0; k < 40; k++) game('for (let i = 0; i < 10; i++) { stepHillWalkers(0.05); if (i === 0) syncHillWalkers(); }');
    expect(game("new Set(hillWalkers.map(w => w.st)).size")).toBeGreaterThan(1);
    // eine Figur je Treppe mitten auf den Stufen: davor liegende Teile der Treppe kommen danach noch einmal darüber
    game("for (const s of hwStairs()) { const w = { hillw: true, st0: state, stair: s, st: 'up', d: 0, px: 0, py: 0, up: 0, wait: 99, lane: 0.1, home: '22,22', who: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 99 }; hwOnStair(w); hillWalkers.push(w); }");
    game('window.__over = 0; { const o = drawHillStairOver; drawHillStairOver = (...a) => { __over++; return o(...a); }; window.__unover = () => { drawHillStairOver = o; }; }');
    try {
      for (const z of [2.5, 1.2, 0.45]) for (const nt of [0, 0.45]) {
        expect(() => game(`(() => { const n0 = nightAt; nightAt = () => ${nt}; try { cam.z = ${z}; const p = iso(11.5, 11.5); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = n0; } })()`)).not.toThrow();
      }
      expect(game('__over')).toBeGreaterThan(0);
    } finally { game('__unover()'); }
    // 👁 Durchsicht: Treppe bleibt wie die Anhöhe (nicht blass), Zeichnen ohne Fehler
    expect(() => game('setSeeThrough(true); render(1e6); setSeeThrough(false)')).not.toThrow();
    expect(() => game("thumbRaw('huegeltreppe', 1, { style: 'klinker' })")).not.toThrow();
  });
});
