const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Anhöhen Stufe 2 – Gesamtprüfung nach dem Zusammenbau (Rampe, Netz, Wege oben, Bewegtes): alles verbunden, der ganze Weg hinauf in allen
// Drehungen (Länge 1 und 2, vor der Wand und in den Rand eingesetzt) für Wegenetz, Wegzeichnung, Bewohner und Fahrzeuge, Speichern/Laden
// und ↶; dazu die Lücken, die erst beim Zusammenbau auffielen (Namensgleichheit, Gartenweg/Vorplatz über die Kante, Leute auf dem Weg zur
// Dachtreppe, GL-Rahmen um Figuren, Album)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewLen = 1; hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(11.5, 11.5); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const V = (x, y) => game(`T.net.vOf('${x},${y}')`);
const H = 26, UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const DIR = ['hinten', 'rechts', 'vorn', 'links'];
// Anhöhe 10–13 × 10–13. Je Drehung: Anker, Fuß, oberes Feld – vor der Wand (unten) bzw. in den Rand eingesetzt (Felder abgesenkt)
const CASES = {
  wand: { 1: [[11, 14, 0, [11, 14], [11, 14]], [14, 11, 3, [14, 11], [14, 11]], [11, 9, 2, [11, 9], [11, 9]], [9, 11, 1, [9, 11], [9, 11]]],
    2: [[11, 14, 0, [11, 15], [11, 14]], [14, 11, 3, [15, 11], [14, 11]], [11, 8, 2, [11, 8], [11, 9]], [8, 11, 1, [8, 11], [9, 11]]] },
  rand: { 1: [[11, 13, 0, [11, 13], [11, 13]], [13, 11, 3, [13, 11], [13, 11]], [11, 10, 2, [11, 10], [11, 10]], [10, 11, 1, [10, 11], [10, 11]]],
    2: [[11, 12, 0, [11, 13], [11, 12]], [12, 11, 3, [13, 11], [12, 11]], [11, 10, 2, [11, 10], [11, 11]], [10, 11, 1, [10, 11], [11, 11]]] },
};

describe('Einbau: alles verbunden', () => {
  it('jeder globale Name nur in einer Datei (die Rampe hatte rampSink der U-Bahn überschrieben – Züge sanken nicht mehr in den Tunnel)', () => {
    const dir = path.join(__dirname, '..', 'js'), files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(dir, f))
      .concat(fs.readdirSync(path.join(dir, 'shopart')).filter(f => f.endsWith('.js')).map(f => path.join(dir, 'shopart', f)));
    const where = new Map();
    for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/^(?:async )?(?:function\*? |const |let |var )([A-Za-z_$][\w$]*)/gm)) {
      if (!where.has(m[1])) where.set(m[1], new Set());
      where.get(m[1]).add(path.basename(f));
    }
    expect([...where].filter(([, s]) => s.size > 1).map(([n, s]) => `${n}: ${[...s].join(', ')}`)).toEqual([]);
    expect(game('[rampSink.length, typeof rampIntoSink]')).toEqual([3, 'function']);   // U-Bahn (P, wx, wy) bleibt
  });

  it('Rampe überall eingehängt: Menü, Tipp, drawObject, Drehen, Länge im Spielstand, Album; Leiste und Vorschaubild ohne Fehler', () => {
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(g => g.id === 'hoehen').items")).toEqual(['anhoehe', 'huegeltreppe', 'huegelrampe']);
    expect(game("[!!FX.huegelrampe, !!ITEM_TIPS.huegelrampe, ROTATABLE.has('huegelrampe'), BIG_ON_TILE.has('huegelrampe'), LATE_ALBUM.has('b:huegelrampe'), LATE_ALBUM.has('b:huegeltreppe')]"))
      .toEqual([true, true, true, true, true, true]);
    expect(game("[tileOut({ b: 'huegelrampe', lvl: 1, rot: 1, len: 2, style: 'sand' }).len, tileOut({ b: 'huegelrampe', lvl: 1, len: 1 }).len, tileOut({ b: 'station', lvl: 1, len: 2 }).len]"))
      .toEqual([2, undefined, undefined]);
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14); window.__n = 0; { const o = drawHillRamp; drawHillRamp = (...a) => { __n++; return o(...a); }; window.__un = () => { drawHillRamp = o; }; }");
    try { game("drawObject('huegelrampe', 400, 300, 2, 1e6, 11, 14, 1, state.tiles.get('11,14'))"); } finally { game('__un()'); }
    expect(game('__n')).toBe(1);
    expect(() => game("setTool('huegelrampe'); renderStyleBar('huegelrampe'); thumbRaw('huegelrampe'); setTool('look')")).not.toThrow();
    expect(game("document.querySelectorAll('#style-bar [data-rlen]').length")).toBe(2);
  });
});

describe('Der ganze Weg hinauf: alle Drehungen, Länge 1 und 2, vor der Wand und eingesetzt', () => {
  for (const mode of ['wand', 'rand']) for (const len of [1, 2]) for (const [ax, ay, rot, foot, top] of CASES[mode][len]) {
    it(`${mode === 'wand' ? 'vor der Wand' : 'in den Rand'}, Länge ${len}, hinauf nach ${DIR[rot]}: Netz, Wege, Bewohner, Fahrzeuge, Speichern, ↶`, () => {
      hills(block(10, 10, 13, 13));
      const [dx, dy] = UP[rot], low = [1, 2, 3].map(i => [foot[0] - dx * i, foot[1] - dy * i]), high = [1, 2].map(i => [top[0] + dx * i, top[1] + dy * i]);
      weg(low); weg(high);
      expect(high.every(([x, y]) => game(`hillLevel(${x}, ${y})`) === 1)).toBe(true);
      expect(V(...low[0])).not.toBe(V(...high[0]));                                          // ohne Rampe getrennt
      const m0 = game('state.money'), into = mode === 'rand' ? len : 0;
      game(`rampNewLen = ${len}`);
      expect(game(`[placeRot('huegelrampe', ${ax}, ${ay}), placeError('huegelrampe', ${ax}, ${ay})]`)).toEqual([rot, null]);
      expect(game(`undoable(() => build('huegelrampe', ${ax}, ${ay}))`)).toBe(true);
      game('rampNewLen = 1');
      // Felder, Höhe, Kosten (eingesetzt: Erstattung der abgesenkten Anhöhe verrechnet)
      expect(game(`[rampAt(${foot}).i, rampAt(${top}).i, rampAt(${foot}).k, rampAt(${top}).len, rampAt(${top}).rot]`)).toEqual([0, len - 1, `${ax},${ay}`, len, rot]);
      expect(game(`[hillLevel(${foot}), hillLevel(${top})]`)).toEqual([0, 0]);
      expect(game(`hillRamps().map(r => [r.foot, r.top])`)).toEqual([[foot, top]]);
      expect(game('state.money')).toBe(m0 - game('ITEMS.huegelrampe.cost') + into * game('ITEMS.anhoehe.cost'));
      expect(game(`[rampHeight(${foot}, ${foot[0] - dx / 2}, ${foot[1] - dy / 2}), rampHeight(${top}, ${top[0] + dx / 2}, ${top[1] + dy / 2})]`)).toEqual([0, H]);
      // Wegenetz: unten, Rampe, oben ein Viertel; „alle verbundenen“ Wege über die Rampe; gezeichnet mit Armen an Fuß und Oberkante
      expect(V(...low[2])).toBe(V(...high[1]));
      expect(game(`wegNetwork(${low[2]}).map(p => p.join()).sort()`)).toEqual([...low, ...high].map(p => p.join()).sort());
      expect(game(`pathArms(${low[0]})`)).toContainEqual([dx, dy]);
      expect(game(`pathArms(${high[0]})`)).toContainEqual([-dx || 0, -dy || 0]);
      for (const [x, y] of [...low, ...high]) for (const [ex, ey] of UP) {                    // sonst nie über die Kante
        if (game(`hillLevel(${x + ex}, ${y + ey})`) !== game(`hillLevel(${x}, ${y})`) && !game(`!!rampAt(${x + ex}, ${y + ey})`)) expect(game(`pathArms(${x}, ${y})`)).not.toContainEqual([ex, ey]);
      }
      // Bewohner gehen hinauf (gerade über die Rampe), Fahrzeuge fahren hinauf und wieder hinunter – Höhe stetig
      const wp = game(`walkPath(${low[2]}, [[${high[1]}]])`);
      expect(wp && wp.length).toBe(3 + len + 1);
      const drive = game(`(() => { const line = new Set(${JSON.stringify([...low, foot, top, ...high].map(p => p.join()))}), ok = (x, y) => line.has(x + ',' + y) && walkable(x, y);
        const c = { fx: ${low[2][0]}, fy: ${low[2][1]}, tx: ${low[2][0]}, ty: ${low[2][1]}, px: ${low[2][0]}, py: ${low[2][1]}, t: 1, wait: 0, speed: 1 }, hAt = () => (slopeUp(c.px, c.py, 0, 'weg') || 0) + hillLift(Math.round(c.px), Math.round(c.py));
        let prev = hAt(), jump = 0, max = 0, back = false;
        for (let i = 0; i < 800; i++) { stepMover(c, 0.04, ok, false); const h = hAt(); jump = Math.max(jump, Math.abs(h - prev)); prev = h; max = Math.max(max, h); if (max >= ${H} && h === 0) back = true; }
        return [max, back, jump]; })()`);
      expect(drive[0]).toBeCloseTo(H);
      expect(drive[1]).toBe(true);                                                             // oben gewesen und wieder unten
      expect(drive[2]).toBeLessThanOrEqual(H / len * 0.04 + 1e-6);                              // ein Schritt auf der Schräge, nie ein Sprung
      // Zeichnen (nah, weit) ohne Fehler
      for (const z of [2.5, 0.5]) expect(() => game(`(() => { cam.z = ${z}; const p = iso(${top[0]}, ${top[1]}); cam.x = p.x; cam.y = p.y; render(1e6); })()`)).not.toThrow();
      // ↶: ein Schritt – Rampe weg, Anhöhe zurück, Taler zurück, wieder getrennt
      expect(game('undo()')).toBe(true);
      expect(game(`[rampAt(${foot}), rampAt(${top}), state.money]`)).toEqual([null, null, m0]);
      expect(game(`[hillLevel(${foot}), hillLevel(${top})]`)).toEqual(mode === 'rand' ? [1, 1] : [0, 0]);
      expect(V(...low[0])).not.toBe(V(...high[0]));
      // Speichern und Laden: Länge, Richtung, Belag und Verbindung bleiben
      game(`rampNewLen = ${len}; build('huegelrampe', ${ax}, ${ay}); rampNewLen = 1`);
      const before = game(`(t => [t.rot || 0, t.len || 1, t.style])(state.tiles.get('${ax},${ay}'))`);
      game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
      expect(game(`(t => [t.rot || 0, t.len || 1, t.style])(state.tiles.get('${ax},${ay}'))`)).toEqual(before);
      expect(game(`[rampAt(${foot}).i, rampAt(${top}).i]`)).toEqual([0, len - 1]);
      expect(V(...low[2])).toBe(V(...high[1]));
    });
  }
});

describe('Lücken aus der Gesamtprüfung', () => {
  it('Gartenweg und Vorplatz unten führen nie zu einem Weg oben auf der Anhöhe (sonst bis an die Felswand)', () => {
    hills(block(10, 10, 13, 13));
    weg([[11, 13], [12, 13], [14, 11]]);                                              // oben am Rand bzw. unten
    game("state.tiles.set('11,14', { b: 'haus', lvl: 1, rot: 3, animal: 1 }); state.tiles.set('12,14', { b: 'muehle', lvl: 1, rot: 3 }); state.tiles.set('15,11', { b: 'haus', lvl: 1, rot: 2, animal: 2 }); recalc()");
    expect(game("[kitTurn(3, 1, 0), kitTurn(2, 1, 0)]").map(p => p.map(v => v || 0))).toEqual([[0, -1], [-1, 0]]);   // Türen zur Anhöhe bzw. zum Weg unten
    expect(game("gardenPath(state.tiles.get('11,14'), 11, 14)")).toBe(null);
    expect(game("courtFrontTiles(state.tiles.get('12,14'), 12, 14).map(f => [f.weg, f.wide])")).toEqual([[false, false]]);
    expect(game("courtOf(state.tiles.get('12,14'), 12, 14)")).toBe(null);
    expect(game("gardenPath(state.tiles.get('15,11'), 15, 11)")).toMatchObject({ d: [-1, 0] });   // unten weiter wie bisher
    // ohne Anhöhe hätten beide einen
    game('state.hills.clear(); recalc()');
    expect(game("gardenPath(state.tiles.get('11,14'), 11, 14)")).toMatchObject({ d: [0, -1] });
    expect(game("courtFrontTiles(state.tiles.get('12,14'), 12, 14)[0].weg")).toBe(true);
  });

  it('Leute auf dem Weg zur Dachtreppe bleiben unten; führt ihr Weg doch über eine Rampe, stehen sie auf ihr (nicht darin)', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14); recalc()");
    weg([[11, 15], [11, 16], [11, 17], [11, 18]]);
    // Feld vor dem Fuß der Dachtreppe: 11,17 (s.mu − 1,5 · Du); von dort erreichbar wären auch Rampe und Anhöhe
    const s = "{ mu: 11, mv: 15.5, Du: 0, Dv: -1 }";
    for (let i = 0; i < 25; i++) {
      const p = game(`rfWalkIn(${s})`);
      expect(p).not.toBe(null);
      expect(game(`flatGround(${p[0][0]}, ${p[0][1]})`)).toBe(true);
    }
    expect(game('rfWalkIn({ mu: 11, mv: 12.5, Du: 0, Dv: -1 })')).toBe(null);           // davor die Rampe: kein Weg
    // auf der Rampe: Höhe der Schräge statt 0
    game("roofers.push({ roofer: true, stair: {}, st: 'in', path: [[11, 16], [11, 15], [11, 14.25], [11, 14], [11, 13]], pi: 1, px: 11, py: 15, up: 0, wait: 0, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', life: 9 })");
    game('stepRoofers(0.75)');
    expect(game('roofers[0].py')).toBeCloseTo(14.25);
    expect(game('roofers[0].up')).toBeCloseTo(game('slopeUp(roofers[0].px, roofers[0].py, FOOT_D)'));
    expect(game('roofers[0].up')).toBeGreaterThan(0);
    game('roofers.length = 0');
  });

  it('Besuch ohne Rathaus-Tür taucht unten auf, nicht oben auf einer Anhöhe', () => {
    hills(block(10, 10, 13, 13));
    game("for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k); recalc()");
    expect(game('townHallAt()')).toBeFalsy();
    const [x, y] = game('guestSpawn(11, 11)');
    expect(game(`[hillLevel(${x}, ${y}), walkable(${x}, ${y})]`)).toEqual([0, true]);
    expect(Math.max(Math.abs(x - 11), Math.abs(y - 11))).toBe(2);                         // nächstes Feld unten
  });

  it('GL-Rahmen um eine Figur auf Rampe oder Treppe reicht um ihre Höhe weiter hinauf (Ballon); ohne Anhöhen wie bisher', () => {
    const fig = "{ fur: '#fff', px: 11, py: 14, kind: 0 }";
    expect(game(`glMoverBox(${fig}, 2)`)).toEqual([60, 120, 80, 24]);
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14); recalc()");
    const up = game(`figUp(${fig})`);
    expect(up).toBeGreaterThan(10);
    expect(game(`glMoverBox(${fig}, 2)[1]`)).toBeCloseTo((60 + up) * 2);
    expect(game(`glMoverBox({ ...${fig}, py: 16 }, 2)`)).toEqual([60, 120, 80, 24]);          // am Boden daneben unverändert
  });

  it('Album: Treppe und Rampe kamen nach der Deko-Seite – wer sie voll hatte, behält die Belohnung', () => {
    const p = "ALBUM.find(q => q.id === 'deko')";
    expect(game(`albumKeys(${p}).filter(k => k === 'b:huegelrampe' || k === 'b:huegeltreppe').sort()`)).toEqual(['b:huegelrampe', 'b:huegeltreppe']);
    game(`state.album = new Set(albumKeys(${p}).filter(k => k !== 'b:huegelrampe' && k !== 'b:huegeltreppe')); state.legacy = new Set(); collectAlbum()`);
    expect(game(`state.legacy.has(${p}.reward)`)).toBe(true);
  });
});
