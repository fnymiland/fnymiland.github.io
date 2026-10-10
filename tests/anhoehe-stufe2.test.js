const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Anhöhen Stufe 2 mit Gleis-Rampe – Gesamtprüfung nach dem Zusammenbau (Nutzer 10.10.2026: „die Rampe ist nur für Züge da“): alles verbunden;
// die ganze Strecke über die Anhöhe für jede Form A–D in allen vier Drehungen (vorn hinauf, hinten hinunter; längs y und längs x): bauen über
// die echte Bau-Prüfung, Länge, Einsetzen bei A/C (Erstattung), ↶, Gleisnetz (oben/unten getrennt, über die Rampe verbunden), Wege nie über sie,
// ein echter Zug zwischen zwei Bahnhöfen hinauf und hinunter mit stetiger Höhe, Zeichnen nah/weit/nachts, Speichern/Laden; dazu die Lücken,
// die erst beim Zusammenbau auffielen (Namensgleichheit, Gartenweg/Vorplatz über die Kante, Leute auf dem Weg zur Dachtreppe, GL-Rahmen, Album)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 34; y++) for (let x = 0; x <= 34; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(16, 16); cam.x = p.x; cam.y = p.y; } night = 0');
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } trains.length = 0; syncTrains.sig = null'));
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const H = 26, UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const DIR = ['−y', '+x', '+y', '−x'];
const net = (x, y) => game(`T.rail.comp.get('${x},${y}')`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i, r.form])(rampAt(${x}, ${y}))`);
const anchor = (fx, fy, rot, len) => { const [Du, Dv] = UP[rot]; return [Math.min(fx, fx + (len - 1) * Du), Math.min(fy, fy + (len - 1) * Dv)]; };
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

  it('Gleis-Rampe überall eingehängt: Menü (Verkehr), Tipp, drawObject, Drehen, Form im Spielstand, Album, Antippen des Zugs; Leiste und Vorschaubild ohne Fehler', () => {
    expect(game("MENU.find(m => m.id === 'stadt').groups.find(g => g.id === 'verkehr').items.slice(0, 2)")).toEqual(['schiene', 'huegelrampe']);
    expect(game("MENU.some(m => m.groups.some(g => g.id !== 'verkehr' && g.items.includes('huegelrampe')))")).toBe(false);
    expect(game("[!!FX.huegelrampe, !!ITEM_TIPS.huegelrampe, ROTATABLE.has('huegelrampe'), BIG_ON_TILE.has('huegelrampe'), LATE_ALBUM.has('b:huegelrampe'), LATE_ALBUM.has('b:huegeltreppe')]"))
      .toEqual([true, true, true, true, true, true]);
    expect(game("tileOut({ b: 'huegelrampe', lvl: 1, rot: 1, len: 2, form: 'c', price: 600 })")).toEqual({ b: 'huegelrampe', lvl: 1, rot: 1, form: 'c', price: 600 });
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 12); window.__n = 0; { const o = drawHillRamp; drawHillRamp = (...a) => { __n++; return o(...a); }; window.__un = () => { drawHillRamp = o; }; }");
    try { game("drawObject('huegelrampe', 400, 300, 2, 1e6, 11, 12, 1, state.tiles.get('11,12'))"); } finally { game('__un()'); }
    expect(game('__n')).toBe(1);
    expect(() => game("setTool('huegelrampe'); renderStyleBar('huegelrampe'); thumbRaw('huegelrampe'); setTool('look')")).not.toThrow();
    game("setTool('huegelrampe')");
    expect(game("document.querySelectorAll('#style-bar [data-rform]').length")).toBe(4);
    game("setTool('look')");
    // Antippen: ein Zug oben auf der Anhöhe öffnet das Fenster seines Gleisfelds (tap → trainAt)
    game("window.__ta = trainAt; trainAt = () => ({ x: 11, y: 12, car: null })");
    try { game("closePanel(); tap(5, 5, false)"); } finally { game('trainAt = window.__ta'); }
    expect(game("document.getElementById('panel').textContent")).toMatch(/Gleis-Rampe/);
    game('closePanel()');
  });
});

describe('Die ganze Strecke über die Anhöhe: jede Form, alle Drehungen, mit echtem Zug', () => {
  // Anhöhe 12–20 × 12–20. Längs y (ax 'y'): vorn hinauf nach −y (rot 0), hinten hinunter (rot 2) in der Spalte 16; längs x (ax 'x'): rechts
  // hinauf nach −x (rot 3), links (rot 1) in der Zeile 16. Fuß so, dass A/C in den Rand eingelassen sind, B/D davor stehen
  for (const form of ['a', 'b', 'c', 'd']) for (const ax of ['y', 'x']) {
    const rots = ax === 'y' ? [0, 2] : [3, 1];
    it(`${form.toUpperCase()}, hinauf nach ${DIR[rots[0]]} und ${DIR[rots[1]]}: bauen, ↶, Netz, Wege nicht, Zug hinauf und hinunter, Zeichnen, Speichern`, () => {
      hills(block(12, 12, 20, 20));
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut, back = game('ITEMS.anhoehe.cost');
      const P = (a, b) => ax === 'y' ? [16, a] : [a, 16];                  // a: Lage längs der Achse
      const feet = [21 + o, 11 - o].map(a => P(a, 0));
      const R = rots.map((rot, j) => {
        const [fx, fy] = feet[j], [Du, Dv] = UP[rot], fields = [...Array(len).keys()].map(i => [fx + i * Du, fy + i * Dv]);
        return { rot, foot: feet[j], top: fields[len - 1], fields, D: [Du, Dv], anchor: anchor(fx, fy, rot, len) };
      });
      game(`rampNewForm = '${form}'`);
      // bauen über die Bau-Prüfung (gewählte Drehung passt nicht: dreht sich trotzdem hinauf); ↶ in einem Schritt; noch einmal bauen
      for (const r of R) {
        const [x, y] = r.anchor, m0 = game('state.money');
        game(`buildRot = ${(r.rot + 2) % 4}`);
        expect([form, r.rot, game(`placeRot('huegelrampe', ${x}, ${y})`), game(`placeError('huegelrampe', ${x}, ${y})`)]).toEqual([form, r.rot, r.rot, null]);
        expect(game(`undoable(() => build('huegelrampe', ${x}, ${y}))`)).toBe(true);
        r.fields.forEach(([fx, fy], i) => expect(ramp(fx, fy)).toEqual([`${x},${y}`, r.rot, len, i, form]));
        expect(r.fields.map(([fx, fy]) => game(`hillLevel(${fx}, ${fy})`))).toEqual(r.fields.map(() => 0));   // A/C: eingelassen (abgesenkt)
        expect(game('state.money')).toBe(m0 - F.cost + F.cut * back);
        expect(game(`[rampHeight(${r.foot}, ${r.foot[0] - r.D[0] / 2}, ${r.foot[1] - r.D[1] / 2}), rampHeight(${r.top}, ${r.top[0] + r.D[0] / 2}, ${r.top[1] + r.D[1] / 2})]`)).toEqual([0, H]);
        expect(game('undo()')).toBe(true);
        expect([ramp(...r.foot), ramp(...r.top), game('state.money')]).toEqual([null, null, m0]);
        expect(r.fields.map(([fx, fy]) => game(`hillLevel(${fx}, ${fy})`))).toEqual(r.fields.map((_, i) => (i >= len - F.cut ? 1 : 0)));
        game(`build('huegelrampe', ${x}, ${y})`);
      }
      expect(game('hillRamps().map(r => [r.foot, r.top, r.form]).sort()')).toEqual(R.map(r => [r.foot, r.top, form]).sort());
      // Gleise: unten vor beiden Füßen (6 Felder), oben dazwischen
      const below = R.map(r => [1, 2, 3, 4, 5, 6].map(i => [r.foot[0] - r.D[0] * i, r.foot[1] - r.D[1] * i]));
      const a0 = ax === 'y' ? R[1].top[1] : R[1].top[0], a1 = ax === 'y' ? R[0].top[1] : R[0].top[0], above = [];
      for (let a = Math.min(a0, a1) + 1; a < Math.max(a0, a1); a++) above.push(P(a, 0));
      game(`for (const [x, y] of ${JSON.stringify([...below[0], ...above])}) build('schiene', x, y, true); recalc()`);
      expect(above.every(([x, y]) => game(`hillLevel(${x}, ${y})`) === 1)).toBe(true);
      expect(net(...below[0][0])).toBe(net(...above[0]));                                 // über die vordere Rampe verbunden
      expect(net(...below[0][0])).toBe(net(...R[0].top));
      game(`for (const [x, y] of ${JSON.stringify(below[1])}) build('schiene', x, y, true); recalc()`);
      expect(net(...below[1][5])).toBe(net(...below[0][5]));                               // über beide Rampen ein Netz
      for (const r of R) {
        expect(game(`railArms(${r.foot[0] - r.D[0]}, ${r.foot[1] - r.D[1]})`)).toContainEqual(r.D);
        expect(game(`railArms(${r.top[0] + r.D[0]}, ${r.top[1] + r.D[1]})`)).toContainEqual(r.D.map(v => -v || 0));
        expect(game(`trackLink(${r.foot[0] - r.D[0]}, ${r.foot[1] - r.D[1]}, ${r.foot})`)).toBe(true);
        expect(game(`[levelLink(${r.foot[0] - r.D[0]}, ${r.foot[1] - r.D[1]}, ${r.foot}, 'weg'), levelLink(${r.top}, ${r.top[0] + r.D[0]}, ${r.top[1] + r.D[1]}, 'fuss')]`)).toEqual([false, false]);
      }
      // nie über die Kante: kein Arm zu einem Nachbarn anderer Ebene, der nicht die Rampe ist
      for (const [x, y] of [...below[0], ...below[1], ...above]) for (const [ex, ey] of UP) {
        if (game(`hillLevel(${x + ex}, ${y + ey}) !== hillLevel(${x}, ${y}) && !rampAt(${x + ex}, ${y + ey})`)) expect(game(`railArms(${x}, ${y})`)).not.toContainEqual([ex, ey]);
      }
      // Gleis oben neben der Rampe, unten am Fuß der Wand: getrennt (Prellbock), auch wenn sie Feld an Feld liegen
      const sideTop = ax === 'y' ? [17, 20] : [20, 17], sideLow = ax === 'y' ? [17, 21] : [21, 17];
      expect([game(`placeError('schiene', ${sideTop})`), game(`placeError('schiene', ${sideLow})`)]).toEqual([null, null]);
      game(`build('schiene', ${sideTop}, true); build('schiene', ${sideLow}, true); recalc()`);
      expect([game(`hillLevel(${sideTop})`), game(`hillLevel(${sideLow})`), game(`trackLink(${sideTop}, ${sideLow})`)]).toEqual([1, 0, false]);
      expect(net(...sideTop)).not.toBe(net(...sideLow));
      const toLow = [sideLow[0] - sideTop[0], sideLow[1] - sideTop[1]], toSide = ax === 'y' ? [-1, 0] : [0, -1];
      expect(game(`railArms(${sideTop})`)).not.toContainEqual(toLow);                         // kein Arm über die Kante (dort Prellbock)
      expect(game(`railArms(${sideLow})`)).not.toContainEqual(toLow.map(v => -v || 0));      // unten: nicht hinauf …
      if (game(`!!rampAt(${sideLow[0] + toSide[0]}, ${sideLow[1] + toSide[1]})`)) expect(game(`railArms(${sideLow})`)).not.toContainEqual(toSide);   // … und nie seitlich in die Rampe (B/D)
      game(`state.tiles.delete('${sideTop}'); state.tiles.delete('${sideLow}'); recalc()`);
      // Bahnhöfe unten an beiden Enden, Strom, zwei Orte: eine Linie, ein Zug über die Anhöhe
      const st = R.map((r, j) => { const [x, y] = below[j][4]; return ax === 'y' ? [x - 1, y] : [x, y - 1]; });
      game(`for (const [x, y] of ${JSON.stringify(st)}) state.tiles.set(x + ',' + y, { b: 'station', lvl: 1, rot: ${ax === 'y' ? 0 : 1}, train: 'regio' })`);
      for (let i = 0; i < 6; i++) game(`state.tiles.set('${26 + (i % 3) * 2},${26 + Math.floor(i / 3) * 2}', { b: 'windrad', lvl: 3 })`);
      game(`globalThis.__ra = regionAt; regionAt = (x, y) => ${ax === 'y' ? 'y' : 'x'} >= 16 ? 'wald' : 'home'; recalc(); syncMovers()`);
      expect([game('T.rail.lines.length'), game('trains.length'), game('trains[0].powered')]).toEqual([1, 1, true]);
      const route = game("trains[0].route.pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1]))");
      for (const r of R) for (const p of r.fields) expect(route).toContain(p.join());
      const drive = game(`(() => {
        let prev = null, jump = 0, top = 0, low = 0, turns = 0, dir = trains[0].dir, tilt = 0, onRamp = 0;
        for (let i = 0; i < 4000 && (turns < 2 || !top); i++) {
          stepTrains(0.05);
          const hs = trainCars().map(m => { trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py)); if (m.hill && Math.abs(m.hill.hb - m.hill.ha) > 1) tilt++; if (rampAt(Math.round(m.px), Math.round(m.py))) onRamp++; return m.hill ? (m.hill.ha + m.hill.hb) / 2 : 0; });
          if (prev) hs.forEach((h, j) => { jump = Math.max(jump, Math.abs(h - prev[j])); });
          if (hs.some(h => h === ${H})) top++;
          if (hs.every(h => h === 0)) low++;
          if (trains[0].dir !== dir) { turns++; dir = trains[0].dir; }
          prev = hs;
        }
        const stopsLow = trains[0].stops.every(d => { const [u, v] = railPoint(trains[0].route, d); return surfaceHeight(u, v) === 0; });
        return { jump, top, low, turns, tilt, onRamp, stopsLow };
      })()`);
      expect([form, ax, drive.top > 0, drive.low > 0, drive.turns >= 2, drive.tilt > 0, drive.onRamp > 0, drive.stopsLow]).toEqual([form, ax, true, true, true, true, true, true]);
      expect(drive.jump).toBeLessThan(2.2);                                                  // Höhe stetig: nie ein Sprung
      // Zeichnen nah, weit und nachts – der Zug mitten auf der vorderen Rampe
      const mid = game(`(() => { const pts = trains[0].route.pts; let best = 0, bd = 1e9; for (let i = 0; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - ${(R[0].foot[0] + R[0].top[0]) / 2}, pts[i][1] - ${(R[0].foot[1] + R[0].top[1]) / 2}); if (d < bd) { bd = d; best = i; } } let c = 0; for (let i = 1; i <= best; i++) c += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return c; })()`);
      game(`trains[0].c = ${mid}; trains[0].wait = 0; window.__st = syncTrains; syncTrains = () => {}`);
      try {
        for (const [z, nt] of [[2.5, 0], [0.5, 0], [2.5, 0.45], [0.5, 0.45]]) {
          expect(() => game(`(() => { const n0 = nightAt; nightAt = () => ${nt}; try { cam.z = ${z}; const p = iso(${R[0].top}); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); } finally { nightAt = n0; } })()`)).not.toThrow();
          if (z > 1) for (const [fx, fy] of R[0].fields) expect([form, z, nt, fx, fy, game(`hillSprites.has('r${fx},${fy}')`)]).toEqual([form, z, nt, fx, fy, true]);
        }
      } finally { game('syncTrains = window.__st'); }
      expect(game('errorShown')).toBe(false);
      // Speichern und Laden: Form, Richtung, Preis, Netz und Linie bleiben
      const before = game(`[${JSON.stringify(R.map(r => r.anchor.join()))}].flat().map(k => (t => [t.form, t.rot || 0, t.price])(state.tiles.get(k)))`);
      game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc(); trains.length = 0; syncTrains.sig = null; syncMovers()');
      expect(game(`[${JSON.stringify(R.map(r => r.anchor.join()))}].flat().map(k => (t => [t.form, t.rot || 0, t.price])(state.tiles.get(k)))`)).toEqual(before);
      for (const r of R) r.fields.forEach(([fx, fy], i) => expect(ramp(fx, fy)).toEqual([r.anchor.join(), r.rot, len, i, form]));
      expect(net(...below[1][5])).toBe(net(...below[0][5]));
      expect([game('T.rail.lines.length'), game('trains.length')]).toEqual([1, 1]);
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

  it('Leute auf dem Weg zur Dachtreppe bleiben unten, nie über die Gleis-Rampe', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewForm = 'b'; build('huegelrampe', 11, 14); recalc()");                     // Damm 11,14 oben … 11,16 Fuß
    game("for (const [x, y] of [[11, 17], [11, 18], [11, 19], [11, 20], [11, 21]]) build('weg', x, y, true); recalc()");
    // Feld vor dem Fuß der Dachtreppe: 11,20 (s.mu − 1,5 · Du); von dort erreichbar wären ohne Regel auch Rampe und Anhöhe
    const s = "{ mu: 11, mv: 18.5, Du: 0, Dv: -1 }";
    for (let i = 0; i < 25; i++) {
      const p = game(`rfWalkIn(${s})`);
      expect(p).not.toBe(null);
      expect(p.every(([x, y]) => !game(`rampAt(${Math.round(x)}, ${Math.round(y)})`))).toBe(true);
      expect(game(`flatGround(${p[0][0]}, ${p[0][1]})`)).toBe(true);
    }
    expect(game('rfWalkIn({ mu: 11, mv: 12.5, Du: 0, Dv: -1 })')).toBe(null);           // davor die Gleis-Rampe: kein Weg
  });

  it('Besuch ohne Rathaus-Tür taucht unten auf, nicht oben auf einer Anhöhe', () => {
    hills(block(10, 10, 13, 13));
    game("for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k); recalc()");
    expect(game('townHallAt()')).toBeFalsy();
    const [x, y] = game('guestSpawn(11, 11)');
    expect(game(`[hillLevel(${x}, ${y}), walkable(${x}, ${y})]`)).toEqual([0, true]);
    expect(Math.max(Math.abs(x - 11), Math.abs(y - 11))).toBe(2);                         // nächstes Feld unten
  });

  it('GL-Rahmen um eine Figur auf der Treppe reicht um ihre Höhe weiter hinauf (Ballon); ohne Anhöhen wie bisher', () => {
    const fig = "{ fur: '#fff', px: 11, py: 14, kind: 0 }";
    expect(game(`glMoverBox(${fig}, 2)`)).toEqual([60, 120, 80, 24]);
    hills(block(10, 10, 13, 13));
    game("build('huegeltreppe', 11, 14); recalc()");
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
