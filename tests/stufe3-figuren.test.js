const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 3 (Block 157j), Figuren: Bewohner aus Häusern oben kommen nur aus Türen auf ebenen Boden derselben Höhe (doorsOf, levelLink) und
// gehen nur über die Treppe hinunter; ohne Treppe bleiben sie oben (bummeln, gehen wieder hinein) – Ziele oben nur, wenn eine Treppe hinaufführt
// (findGoal/walkPath über hillRegions). Besucher fangen nie auf einer Anhöhe ohne Treppe an. Gebäude oben setzt der Test direkt (die Bau-Regeln
// gehören zu einem anderen Teil von 157j)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k)");
  game("for (let y = 2; y <= 26; y++) for (let x = 2; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; hillWalkers.length = 0; walkers.length = 0; strollers.length = 0; paraders.length = 0; critters.length = 0; recalc(); resetUndo()");
  game('window.__gh = gameHour; gameHour = () => 12');
});
afterEach(() => game('gameHour = window.__gh'));
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const put = (b, x, y, extra = {}) => game(`state.tiles.set('${x},${y}', ${JSON.stringify({ b, lvl: 1, ...extra })}); recalc()`);   // Gebäude oben: direkt gesetzt
const lv = (x, y) => game(`hillLevel(${x}, ${y})`);
// Bewohner des Hauses home an seiner Tür door losschicken (wie syncMovers)
const resident = (home, door, kind) => game(`(() => { const [sx, sy] = ${JSON.stringify(door)}; window.__w = { fx: sx, fy: sy, tx: sx, ty: sy, px: sx, py: sy, t: 1, wait: 0, speed: 1,
  ...residentLook('${home}', 0), shirt: '#f00' }; return setGoal(__w, '${kind}'); })()`);
// __w Schritt für Schritt laufen lassen, bis er drinnen/weg ist: alle Felder, auf die er tritt, und ob jeder Wechsel erlaubt war
const run = (n = 6000, dt = 0.05, until = 'false') => game(`(() => { const w = __w, tiles = [[w.fx, w.fy]]; let bad = 0;
  for (let i = 0; i < ${n} && !w.gone && !(w.inside > 0) && !(${until}); i++) {
    const a = [w.fx, w.fy]; stepWalker(w, ${dt});
    if (w.fx !== a[0] || w.fy !== a[1]) { tiles.push([w.fx, w.fy]); if (Math.abs(w.fx - a[0]) + Math.abs(w.fy - a[1]) !== 1 || edgeBlocks(a[0], a[1], w.fx, w.fy) || !walkable(w.fx, w.fy, true)) bad++; }
  }
  return { tiles, bad, inside: w.inside > 0, gone: !!w.gone, goal: w.goal }; })()`);

describe('Ohne Anhöhen wie vorher', () => {
  it('hillRegions ist null – Wegsuche und Ziele wie bisher (kein Feld wird ausgeschlossen)', () => {
    put('haus', 8, 8, { animal: 1 }); put('cafe', 14, 8); put('cafe', 20, 20);
    weg(block(8, 9, 20, 9));
    expect(game('hillRegions()')).toBe(null);
    expect(game("doorsOf('8,8').length")).toBe(4);
    const goals = new Set();
    for (let i = 0; i < 40; i++) goals.add(game("findGoal('essen', 8, 9).k"));
    expect([...goals].sort()).toEqual(['14,8', '20,20']);
    expect(game("walkPath(8, 9, [[14, 9]]).length")).toBe(6);
  });
});

describe('Haus oben mit Treppe', () => {
  beforeEach(() => {
    hills(block(10, 10, 14, 13));
    game("build('huegeltreppe', 12, 14); recalc()");                    // hinauf nach hinten (−y): oberes Feld 12,13
    weg([[12, 15], [12, 16], [12, 17], [12, 13], [12, 12]]);
  });

  it('Türen nur oben auf ebenem Boden; der Bewohner geht über die Treppe hinunter und kommt unten an', () => {
    put('haus', 11, 12, { animal: 1 }); put('cafe', 12, 18);
    expect(game('stairAt(12, 14) && STAIR_UP[stairRotOf(stairAt(12, 14))]')).toEqual([0, -1]);
    const doors = game("doorsOf('11,12')");
    expect(doors.length).toBe(4);
    expect(doors.every(([x, y]) => lv(x, y) === 1)).toBe(true);
    for (const door of doors) {
      expect(resident('11,12', door, 'essen')).toBe(true);
      expect(game('__w.goal')).toEqual({ kind: 'essen', k: '12,18' });
      const r = run();
      expect(r.bad).toBe(0);
      expect(r.inside).toBe(true);
      expect(r.tiles.some(([x, y]) => x === 12 && y === 14)).toBe(true);   // über die Treppe
      expect(lv(...r.tiles[r.tiles.length - 1])).toBe(0);
      // hinunter nur über die Treppe: jeder Wechsel oben → unten führt über das Treppenfeld
      for (let i = 1; i < r.tiles.length; i++) if (lv(...r.tiles[i - 1]) !== lv(...r.tiles[i]) && !game(`slopeAt(${r.tiles[i - 1]}) || slopeAt(${r.tiles[i]})`)) throw new Error('Ebenenwechsel ohne Treppe ' + r.tiles[i - 1] + ' → ' + r.tiles[i]);
      // und wieder heim: hinauf über die Treppe, an der Tür oben verschwinden
      game('__w.inside = 0.01; stepWalker(__w, 0.05)');                      // fertig: heimwärts
      const back = run();
      expect([back.bad, back.gone]).toEqual([0, true]);
      expect(back.tiles.some(([x, y]) => x === 12 && y === 14)).toBe(true);
      expect(lv(...back.tiles[back.tiles.length - 1])).toBe(1);
    }
  });

  it('Ziele oben (Laden, Arbeit, Schule, Park): Bewohner von unten gehen über die Treppe hinauf', () => {
    put('haus', 8, 17, { animal: 2 }); put('kiosk', 13, 11);
    game("state.tiles.set('10,10', { b: 'schule', lvl: 1 }); for (const [x, y] of [[13, 12], [14, 12], [14, 13]]) state.terra.set(x + ',' + y, 'park'); recalc()");
    weg([[8, 16], [9, 16], [10, 16], [11, 16]]);
    for (const [kind, k] of [['laden', '13,11'], ['schule', '10,10']]) {
      expect(resident('8,17', [8, 16], kind)).toBe(true);
      expect(game('__w.goal.k')).toBe(k);
      const r = run();
      expect([kind, r.bad, r.inside]).toEqual([kind, 0, true]);
      expect(r.tiles.some(([x, y]) => x === 12 && y === 14)).toBe(true);
      expect(lv(...r.tiles[r.tiles.length - 1])).toBe(1);
    }
    // Park oben (auch ohne Stufe: das Ziel ist ein begehbares Parkfeld derselben Gegend)
    game("PARKS.length = 0; PARKS.push({ tiles: ['13,12', '14,12', '14,13'], stage: 1 })");
    expect(resident('8,17', [8, 16], 'park')).toBe(true);
    const r = run(6000, 0.05, 'w.goal.there');
    expect([r.bad, game('!!__w.goal.there'), lv(...r.tiles[r.tiles.length - 1])]).toEqual([0, true, 1]);
    game('recalc()');
  });

  it('Haus direkt über der Treppe: die Treppe ist seine Tür (längs ihrer Achse), daneben stehende Häuser unten nutzen sie nie', () => {
    put('haus', 12, 13, { animal: 1 }); put('haus', 13, 14, { animal: 3 }); put('cafe', 12, 18);
    expect(game("doorsOf('12,13').some(([x, y]) => x === 12 && y === 14)")).toBe(true);
    expect(game("doorsOf('13,14').some(([x, y]) => x === 12 && y === 14)")).toBe(false);   // quer zur Treppe: keine Tür
    expect(game("doorsOf('13,14').every(([x, y]) => hillLevel(x, y) === 0 && !slopeAt(x, y))")).toBe(true);
    expect(resident('12,13', [12, 14], 'essen')).toBe(true);
    const r = run();
    expect([r.bad, r.inside]).toEqual([0, true]);
  });
});

describe('Haus oben ohne Treppe', () => {
  beforeEach(() => hills(block(10, 10, 14, 13)));

  it('kein Ziel unten: der Bewohner bummelt oben und geht wieder hinein – nie über die Kante, kein Hängenbleiben', () => {
    put('haus', 12, 11, { animal: 1 }); put('cafe', 12, 16); weg([[12, 14], [12, 15], [11, 15], [13, 15]]);
    expect(game('[...hillRegions().values()].every(r => r > 0)')).toBe(true);
    for (const kind of ['essen', 'laden', 'arbeit', 'park', 'fzpark', 'markt', 'schule']) {
      for (const door of game("doorsOf('12,11')")) {
        resident('12,11', door, kind);
        expect(game('__w.goal && __w.goal.kind')).toBe('bummel');
        const r = run(20000);
        expect([kind, r.bad, r.gone]).toEqual([kind, 0, true]);           // nach dem Bummeln wieder hinein
        expect(r.tiles.every(([x, y]) => lv(x, y) === 1)).toBe(true);
      }
    }
    // Ziel oben auf derselben Anhöhe: geht hin
    put('kiosk', 10, 10);
    expect(resident('12,11', [12, 12], 'laden')).toBe(true);
    const r = run();
    expect([r.bad, r.inside, game('__w.goal.k')]).toEqual([0, true, '10,10']);
    expect(r.tiles.every(([x, y]) => lv(x, y) === 1)).toBe(true);
  });

  it('Ziele oben ohne Treppe verdrängen keine erreichbaren: von unten wird immer das untere gewählt, die Suche bricht sofort ab', () => {
    put('haus', 12, 18, { animal: 1 }); put('cafe', 12, 13); put('cafe', 13, 13); put('cafe', 11, 13); put('cafe', 14, 13); put('cafe', 10, 13); put('cafe', 20, 22);
    weg(block(12, 17, 20, 17).concat(block(20, 17, 20, 21)));
    const picked = new Set();
    for (let i = 0; i < 30; i++) picked.add(game("findGoal('essen', 12, 17).k"));
    expect([...picked]).toEqual(['20,22']);
    // walkPath nach oben: null, ohne den Boden abzusuchen (kein Feld wird angesehen: terrainAt in walkable)
    game('hillRegions(); window.__n = 0; { const o = terrainAt; terrainAt = (...a) => { __n++; return o(...a); }; window.__unt = () => { terrainAt = o; }; }');
    try { expect(game('walkPath(12, 17, [[12, 12]])')).toBe(null); expect(game('__n')).toBe(0); expect(game('walkPath(12, 17, [[20, 21]])')).not.toBe(null); expect(game('__n')).toBeGreaterThan(0); } finally { game('__unt()'); }
    expect(resident('12,18', [12, 17], 'essen')).toBe(true);
    expect(run().inside).toBe(true);
  });

  it('Tür zur Kante wird nie benutzt (auch bei einem Haus unten direkt vor der Wand)', () => {
    put('haus', 14, 11, { animal: 1 }); put('haus', 12, 13, { animal: 2 }); put('haus', 15, 12, { animal: 3 }); put('haus', 12, 14, { animal: 4 });
    expect(game("doorsOf('14,11')").sort()).toEqual([[13, 11], [14, 10], [14, 12]]);   // nicht 15,11 (unten)
    expect(game("doorsOf('12,13')").sort()).toEqual([[11, 13], [12, 12], [13, 13]]);   // nicht 12,14
    expect(game("doorsOf('15,12')").sort()).toEqual([[15, 11], [15, 13], [16, 12]]);   // unten: nicht 14,12 (oben)
    expect(game("doorsOf('12,14')").sort()).toEqual([[11, 14], [12, 15], [13, 14]]);
    // viele Bewohner kommen heraus: alle auf der Ebene ihres Hauses
    game('walkers.length = 0; T.pop = 200');
    const r = game(`(() => { const lvOf = { '14,11': 1, '12,13': 1, '15,12': 0, '12,14': 0 }; let bad = 0, n = 0;
      for (let i = 0; i < 400; i++) { syncMovers(); for (const w of walkers) if (!w.__seen) { w.__seen = true; n++; if (hillLevel(w.fx, w.fy) !== lvOf[w.home]) bad++; } walkers.length = 0; }
      return [n > 50, bad]; })()`);
    expect(r).toEqual([true, 0]);
  });
});

describe('Besucher', () => {
  it('Rathaus oben ohne Treppe: Besucher fangen unten an; mit Treppe vor dem Rathaus', () => {
    hills(block(10, 10, 14, 14));
    put('rathaus', 11, 11);
    expect(game('townHallAt()')).toEqual([11, 11]);
    for (let i = 0; i < 20; i++) { const [x, y] = game('guestSpawn(0, 0)'); expect(lv(x, y)).toBe(0); expect(game(`walkable(${x}, ${y})`)).toBe(true); }
    game("build('huegeltreppe', 12, 15); recalc()");
    const s = new Set();
    for (let i = 0; i < 40; i++) s.add(game('guestSpawn(0, 0)').join(','));
    expect([...s].every(k => game(`(() => { const [x, y] = [${k}]; return hillLevel(x, y) === 1 && walkable(x, y); })()`))).toBe(true);   // an seiner Tür oben
  });
});

describe('Viele Schritte: niemand wechselt die Ebene ohne Treppe', () => {
  it('Anhöhe A mit Treppe, Anhöhe B ohne; Häuser, Läden, Arbeit oben und unten, alle Tageszeiten', () => {
    hills(block(6, 6, 11, 10)); hills(block(17, 5, 21, 8));
    game("build('huegeltreppe', 8, 11); build('huegeltreppe', 9, 11); recalc()");   // breit, hinauf nach hinten
    weg([[8, 12], [9, 12], [8, 13], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14], [16, 14], [8, 10], [8, 9], [9, 9], [10, 9]]);
    for (const [b, x, y, a] of [['haus', 7, 8, 1], ['haus', 10, 8, 2], ['haus', 11, 10, 3], ['cafe', 9, 8], ['kiosk', 6, 6], ['baecker', 10, 6],
      ['haus', 18, 6, 4], ['haus', 20, 7, 5], ['cafe', 19, 5],
      ['haus', 13, 15, 6], ['haus', 15, 15, 7], ['cafe', 14, 13], ['kiosk', 16, 13], ['haus', 12, 9, 8]]) put(b, x, y, a ? { animal: a, lvl: 3 } : {});
    game("for (const [x, y] of [[6, 9], [6, 10], [7, 10], [14, 16], [15, 16]]) state.terra.set(x + ',' + y, 'park'); recalc()");
    const onB = '(x, y) => x >= 17 && x <= 21 && y >= 5 && y <= 8';
    const r = game(`(() => { const B = ${onB}, st = { bad: [], stairs: 0, upB: 0, n: 0, hw: 0 }, last = new Map();
      const hours = [8, 12, 17, 23], gh = gameHour;
      try {
        for (let i = 0; i < 6000; i++) {
          const h = hours[Math.floor(i / 1500)]; gameHour = () => h;
          if (i % 8 === 0) syncMovers();
          stepMovers(0.06);
          for (const w of walkers.concat(hillWalkers)) {
            const x = Math.round(w.px), y = Math.round(w.py), p = last.get(w);
            if (!p) { last.set(w, { x, y, B: B(x, y) }); st.n++; if (w.hillw) st.hw++; continue; }
            if (p.x === x && p.y === y) continue;
            const step1 = Math.abs(p.x - x) + Math.abs(p.y - y) === 1, other = hillLevel(p.x, p.y) !== hillLevel(x, y) || slopeAt(p.x, p.y) || slopeAt(x, y);
            if (!w.hillw && !step1) st.bad.push('Sprung ' + [p.x, p.y, x, y]);                  // Bewohner: Feld für Feld
            if ((!w.hillw || other) && !(step1 && levelLink(p.x, p.y, x, y, 'fuss'))) st.bad.push('Ebene ' + [p.x, p.y, x, y] + (w.hillw ? ' hw ' + w.st : ''));   // Spaziergänger oben auch schräg (Bank)
            if (!w.hillw && !walkable(x, y, true)) st.bad.push('Wand ' + [x, y]);
            if (B(x, y) !== p.B) st.bad.push('B ' + [p.x, p.y, x, y]);
            if (slopeAt(x, y)) st.stairs++;
            p.x = x; p.y = y;
          }
        }
      } finally { gameHour = gh; }
      return st; })()`);
    expect(r.bad).toEqual([]);
    expect(r.n).toBeGreaterThan(40);
    expect(r.hw).toBeGreaterThan(0);
    expect(r.stairs).toBeGreaterThan(10);
  });
});
