const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 3 (Block 157j) als Ganzes: eine Welt wie beim Spieler – Anhöhe mit Treppe, oben Häuser, Betrieb, Laden, ein großer Bau,
// Bahnhof unten und oben mit Gleis-Rampe und fahrender Linie, U-Bahn-Eingang oben und unten auf einem Tunnel. Dann Bewohner, Speichern/
// Laden, Abriss-Rechteck, ✋-Gruppe, ↶ und Zeichnen nah/weit/nachts – alles zusammen, nicht nur je Teil (die Teile prüfen stufe3-*.test.js)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = -2; y <= 36; y++) for (let x = -2; x <= 36; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k); state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(16, 12); cam.x = p.x; cam.y = p.y; } night = 0; errorShown = false');
  game('window.__gh = gameHour; gameHour = () => 12');
});
afterEach(() => game('gameHour = window.__gh; trains.length = 0; syncTrains.sig = null'));

const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const each = (cells, b) => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('${b}', x, y, true); recalc()`);
// Bauen wie der Spieler: Prüfung, dann build (Drehung von selbst oder fest)
function put(b, x, y, rot = null) {
  if (rot != null) game(`buildRot = ${rot}; rotManual = true`);
  expect([b, x, y, game(`placeError('${b}', ${x}, ${y})`)]).toEqual([b, x, y, null]);
  expect(game(`build('${b}', ${x}, ${y}, true)`)).toBe(true);
  game('rotManual = false; buildRot = 0; recalc()');
}
const lv = (x, y) => game(`hillLevel(${x}, ${y})`);
const b = (x, y) => game(`bAt(${x}, ${y})`);
const net = k => game(`T.rail.stationNet.get('${k}')`);
const warn = (x, y) => game(`hillInfoStatus(state.tiles.get('${x},${y}'), ${x}, ${y}).join(' ')`);   // Hinweise im Fenster (Gebäude oben)
// Stand der Welt, der Speichern/Laden, ↶ usw. überstehen muss
const snapshot = () => game(`JSON.stringify({
  hills: [...state.hills.keys()].sort(),
  tiles: [...state.tiles].map(([k, t]) => k + ':' + t.b + ':' + (t.rot || 0)).sort(),
  tunnels: [...state.tunnels.keys()].sort(),
})`);

// Anhöhe 10…20 × 2…12, Treppe vorn bei 12,13 (hinauf nach −y), Gleis-Rampe A bei x = 15 (Fuß 15,12 · oben 15,11), Gleis unten 15,13…22,
// oben 15,3…10; Wege unten und oben zur Treppe; Tunnel bei x = 22 … (unten) und unter der Anhöhe quer (y = 4)
function world() {
  each(block(10, 2, 20, 12), 'anhoehe');
  expect(game("build('huegeltreppe', 12, 13)")).toBe(true);
  game("rampNewForm = 'a'; buildRot = 0; rotManual = true");
  expect(game("placeError('huegelrampe', 15, 11)")).toBe(null);
  game("build('huegelrampe', 15, 11, true); rotManual = false; recalc()");
  each([...block(15, 13, 15, 22), ...block(15, 3, 15, 10)], 'schiene');
  each([...block(12, 14, 12, 18), ...block(11, 12, 13, 12), ...block(11, 8, 11, 11)], 'weg');
  each([...block(5, 4, 9, 4), ...block(9, 5, 9, 20)], 'tunnel');
  each(block(10, 4, 13, 4), 'tunnel');                                  // unter der Anhöhe
  for (let i = 0; i < 6; i++) game(`state.tiles.set('${28 + (i % 3) * 2},${30 + Math.floor(i / 3) * 2}', { b: 'windrad', lvl: 3 })`);
  game('recalc()');
  // oben: zwei Häuser, ein Betrieb, ein Laden, ein großer Bau, Bahnhof, U-Bahn-Eingang
  put('haus', 13, 10); put('haus', 13, 8);
  put('baecker', 10, 9, 0);
  put('station', 16, 5);
  put('ubahn', 12, 4);
  put('sternwarte', 17, 8, 0);
  // unten: Bahnhof, U-Bahn-Eingang, ein Haus
  put('station', 16, 17);
  put('ubahn', 9, 18);
  put('haus', 13, 16);
  game('recalc(); syncMovers()');
}

describe('Stufe 3 als Ganzes', () => {
  it('alles steht oben, wo es soll; Linie unten ↔ oben fährt; U-Bahn verbindet oben und unten; Erreichbarkeit über die Treppe', () => {
    world();
    for (const [x, y, w] of [[13, 10, 'haus'], [13, 8, 'haus'], [10, 9, 'baecker'], [16, 5, 'station'], [12, 4, 'ubahn'], [17, 8, 'sternwarte']]) {
      expect([x, y, b(x, y), lv(x, y)]).toEqual([x, y, w, 1]);
    }
    // Sternwarte 3×3 ganz oben
    for (let y = 8; y <= 10; y++) for (let x = 17; x <= 19; x++) expect([x, y, lv(x, y)]).toEqual([x, y, 1]);
    // Bahn: ein Netz über die Gleis-Rampe, Linie fährt, Zug hält oben an der Schiene oben
    expect(net('16,5')).not.toBe(null);
    expect(net('16,5')).toBe(net('16,17'));
    expect(game('railStop("16,5")')).toMatch(/^15,[56]$/);
    expect([game('T.rail.lines.length') >= 1, game('trains.length') >= 1]).toEqual([true, true]);
    // U-Bahn: oben und unten an einem Tunnel
    expect(net('12,4')).not.toBe(null);
    expect(net('12,4')).toBe(net('9,18'));
    // eine Treppe führt hinauf: keine eigene Gegend, Betrieb oben ist nicht „weit weg“ wegen der Kante
    expect(game('hillRegions()')).toBe(null);
    expect(game("(T.st.get('10,9') || {}).how")).not.toBe('weit');
    expect(warn(13, 10)).not.toMatch(/Keine Treppe|zugestellt/);
  });

  it('ohne Treppe: Gebäude oben stehen weiter (oben unter sich nah), das Fenster warnt; mit Treppe wieder wie vorher', () => {
    world();
    const before = game("(T.st.get('10,9') || {}).how");
    game("demolish(12, 13); recalc()");                                   // Treppe weg
    expect(b(12, 13)).toBe(null);
    expect([b(13, 10), lv(13, 10)]).toEqual(['haus', 1]);
    expect(game("hillRegions() && hillRegions().get('13,10')")).toBeGreaterThan(0);
    expect(warn(13, 10)).toMatch(/Keine Treppe/);
    expect(game("(T.st.get('10,9') || {}).how")).toBe('nah');            // die Häuser oben sind nah (oben unter sich)
    expect(before).not.toBe('weit');
    game("build('huegeltreppe', 12, 13, true); recalc()");
    expect(game('hillRegions()')).toBe(null);
    expect(warn(13, 10)).not.toMatch(/Keine Treppe/);
    expect(game("(T.st.get('10,9') || {}).how")).toBe(before);
  });

  it('Bewohner aus den Häusern oben: nie über die Kante, nur über die Treppe – viele Schritte ohne Fehler', () => {
    world();
    const r = game(`(() => {
      let bad = 0, moves = 0, stairUse = 0;
      for (let i = 0; i < 3000; i++) {
        const prev = walkers.map(w => [w, w.fx, w.fy]);
        stepMovers(0.05);
        if (i % 50 === 0) syncMovers();
        for (const [w, ax, ay] of prev) {
          if (!walkers.includes(w) || (w.fx === ax && w.fy === ay)) continue;
          moves++;
          if (hillLevel(w.fx, w.fy) !== hillLevel(ax, ay) && !stairAt(w.fx, w.fy) && !stairAt(ax, ay)) bad++;
          if (stairAt(w.fx, w.fy)) stairUse++;
        }
      }
      return { bad, moves };
    })()`);
    expect(r.bad).toBe(0);
    expect(r.moves).toBeGreaterThan(0);
  });

  it('Speichern und Laden: alles bleibt (Anhöhe, Gebäude oben, Treppe, Gleis-Rampe, Tunnel, U-Bahn), die Linie fährt wieder', () => {
    world();
    const s0 = snapshot();
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc(); trains.length = 0; syncTrains.sig = null; syncMovers()');
    expect(snapshot()).toBe(s0);
    expect(net('16,5')).toBe(net('16,17'));
    expect(net('12,4')).toBe(net('9,18'));
    expect(game('trains.length')).toBeGreaterThan(0);
  });

  it('Abriss-Rechteck über die Anhöhe mit Gebäuden: Gebäude weg, Anhöhe darunter erst mit; ↶ bringt alles zurück', () => {
    world();
    const s0 = snapshot();
    // nur über einen Teil der Sternwarte: die Sternwarte wird nicht angefasst, die Anhöhe darunter bleibt
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 19, y: 10 }, b: { x: 20, y: 11 }, fixed: true }");
    game('undoable(() => runPlan()); recalc()');
    expect([b(17, 8), lv(19, 10)]).toEqual(['sternwarte', 1]);
    // ganz über die beiden Häuser oben: Häuser weg, Anhöhe dort weg (die Sternwarte bleibt oben)
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 13, y: 8 }, b: { x: 14, y: 10 }, fixed: true }");
    game('undoable(() => runPlan()); recalc()');
    expect([b(13, 8), b(13, 10)]).toEqual([null, null]);
    expect([b(17, 8), lv(17, 8), lv(19, 10)]).toEqual(['sternwarte', 1, 1]);
    // nie ein Gebäude über der Kante: jedes Gebäude steht ganz auf einer Ebene
    expect(game(`[...state.tiles].filter(([k, t]) => { const [x, y] = keyXY(k), [w, h] = sizeOf(t.b, t.rot || 0, t), l = hillLevel(x, y);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hillLevel(x + i, y + j) !== l && !['huegeltreppe', 'huegelrampe'].includes(t.b)) return true; return false; }).length`)).toBe(0);
    game('undo(); undo(); recalc()');
    expect(snapshot()).toBe(s0);
  });

  it('✋ Gruppe oben aufnehmen, drehen, ganz oben ablegen; über die Kante nie; Zeichnen nah/weit/nachts/Tunnel-Ansicht ohne Fehler', () => {
    world();
    // Bäckerei (1×2) mit den beiden Häusern als Gruppe aufnehmen, quer drehen: an der Seitenkante (x = 20 | 21) rot – einzelne 1×1-Häuser
    // dürfen dabei auf verschiedenen Ebenen landen (jedes ganz auf einer), die Bäckerei nie über die Kante; weiter hinten ganz oben frei
    game("setTool('verschieben'); pickUpGroup(10, 8, 13, 10)");
    expect(game("moving && moving.kind")).toBe('group');
    game('rotateGroup(1)');
    const side = game(`(() => { const out = []; for (let hx = 14; hx <= 26; hx++) for (let hy = 3; hy <= 7; hy++) out.push([hx, hy, groupErrors(hx, hy).first]); return out; })()`);
    expect(side.some(([, , e]) => e === 'Nicht über die Kante einer Anhöhe')).toBe(true);
    const free = side.find(([hx, hy, e]) => e === null && hx <= 18);
    expect(free).toBeTruthy();
    expect(game(`dropGroup(${free[0]}, ${free[1]})`)).toBe(true);
    game('recalc()');
    // nach dem Ablegen: jedes Gebäude ganz auf einer Ebene
    expect(game(`[...state.tiles].filter(([k, t]) => { const [x, y] = keyXY(k), [w, h] = sizeOf(t.b, t.rot || 0, t), l = hillLevel(x, y);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hillLevel(x + i, y + j) !== l && !['huegeltreppe', 'huegelrampe'].includes(t.b)) return true; return false; }).length`)).toBe(0);
    expect(game("[...state.tiles].filter(([k, t]) => t.b === 'baecker').length")).toBe(1);
    game("setTool('look')");
    for (const [z, nt] of [[3, 0], [1.2, 0], [0.6, 0], [3, 0.45], [0.6, 0.45]]) {
      expect(() => game(`(() => { const na = nightAt, gh = gameHour; nightAt = () => ${nt}; gameHour = () => ${nt ? 23 : 12};
        try { cam.z = ${z}; render(1e6); render(1e6 + 17); } finally { nightAt = na; gameHour = gh; } })()`)).not.toThrow();
    }
    game('setSeeThrough(true)');
    expect(() => game('cam.z = 2; render(2e6)')).not.toThrow();
    game('setSeeThrough(false)');
    expect(game('errorShown')).toBe(false);
  });
});
