const { loadGame, game } = require('./helpers/load-game');

// 160c B2b: Zeichenort der Anhöhen-Brücke – das Ruhende in tileA (Deko HINTER < h < Deko UNTER < vd < o < Deko VOR), tileB malt im Rahmen
// des Bewegten nach: dahinter h + Deko UNTER + vd + o + Deko VOR, darunter vd + o + Deko VOR, auf dem Deck o + Deko VOR, davor nichts (danach).
// Geprüft wird die Reihenfolge (Vorbild dachverdeckung.test.js), beide Achsen.
beforeAll(() => loadGame());
// Lücke Ost-West: Anhöhen x 10–13 und 17–20 (y 10–14), Brücke 14–16,12; Nord-Süd: Anhöhen y 4–7 und 11–14 (x 10–14) – Brücke 12,8–10
function scene(ax, figs = [], extra = '') {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool("look"); setSeeThrough(false)');
  game("for (let y = 0; y <= 26; y++) for (let x = 0; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.hills.clear(); state.bruecken.clear(); walkers.length = 0; hillWalkers.length = 0; critters.length = 0");
  if (ax) game("for (let x = 10; x <= 14; x++) for (const y of [4, 5, 6, 7, 11, 12, 13, 14]) state.hills.set(x + ',' + y, { w: 0 }); state.bruecken.set('12,8', { ax: 1, n: 3, art: 'holz' })");
  else game("for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' })");
  game(`(() => { const k = '${ax ? '12,9' : '15,12'}', ds = []; for (let i = 0; i < 10; i++) ds[i] = { b: 'blumen' }; state.decos.set(k, ds); })()`);
  game(`GFX.people = 'viele'; for (const f of ${JSON.stringify(figs)}) walkers.push({ fur: '#fff', shirt: '#f00', id: f.id, px: f.px, py: f.py, kind: 0, ...(f.critter ? { critter: true } : {}) }); ${extra} groundVersion++; recalc()`);
  return game(`(() => {
    const log = [], bl = bkDrawLagen, so = drawSmallOne, ml = moverLive;
    bkDrawLagen = (x, y, px, py, z, gr) => { log.push(gr + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr); };
    drawSmallOne = (b, rot, sx, sy, z, now, x, y, sc, slot, ...r) => { log.push('deko ' + slot + ' ' + x + ',' + y); return so(b, rot, sx, sy, z, now, x, y, sc, slot, ...r); };
    moverLive = (m, ...a) => { log.push('fig ' + m.id); };
    try { cam = state.cam; cam.z = 2.5; const p = iso(${ax ? '12, 9' : '15, 12'}); cam.x = p.x; cam.y = p.y - HILL_H; spriteForce = false; render(1e6); }
    finally { bkDrawLagen = bl; drawSmallOne = so; moverLive = ml; walkers.length = 0; }
    return log;
  })()`);
}
const at = ax => (ax ? '12,9' : '15,12');
const groups = (ax, side) => game(`(() => { const G = bkDecoGroups(${at(ax)}, bkAt(${at(ax)})); return G.${side}; })()`);
// Einträge des Felds der Deko-Brücke ab Index i
const own = (log, ax, from = 0) => log.slice(from).filter(e => e.endsWith(' ' + at(ax)) || e.endsWith(' ' + at(ax) + ' fog') || e.startsWith('fig'));

describe('Brücke: ruhend in tileA, nachgemalt in tileB (160c B2)', () => {
  for (const ax of [0, 1]) {
    const name = ax ? 'Nord-Süd' : 'Ost-West';
    it(`${name}: ohne Bewegtes je Feld genau einmal h, vd, o – Deko hinter < h < unter < vd < o < vor`, () => {
      const log = scene(ax);
      for (const k of ax ? ['12,8', '12,9', '12,10'] : ['14,12', '15,12', '16,12']) expect(log.filter(e => e.endsWith(' ' + k) && /^(h|vd|o) /.test(e)).map(e => e.split(' ')[0])).toEqual(['h', 'vd', 'o']);
      const L = own(log, ax), idx = e => L.indexOf(e), K = at(ax);
      const back = groups(ax, 'back'), under = groups(ax, 'under'), front = groups(ax, 'front');
      expect(back).toContain(8); expect(under.length).toBeGreaterThan(0);                  // Plätze liegen fast alle unter dem Deck (es ist 0,8 Felder breit)
      for (const i of back) expect(idx('deko ' + i + ' ' + K)).toBeLessThan(idx('h ' + K));
      for (const i of under) { expect(idx('deko ' + i + ' ' + K)).toBeGreaterThan(idx('h ' + K)); expect(idx('deko ' + i + ' ' + K)).toBeLessThan(idx('vd ' + K)); }
      for (const i of front) expect(idx('deko ' + i + ' ' + K)).toBeGreaterThan(idx('o ' + K));
      expect(L.filter(e => e.startsWith('deko')).length).toBe(10);                          // jede Deko genau einmal
    });
    it(`${name}: Figur dahinter → h, Deko unter, vd, o, Deko vor nachgemalt; darunter → vd, o; davor → nichts, danach gezeichnet`, () => {
      const [x, y] = at(ax).split(',').map(Number), off = (s, id, critter = false) => ({ id, px: ax ? x + s : x, py: ax ? y : y + s, critter });   // Nord-Süd: Füße FOOT_D weiter vorn – dahinter nur ein Tier (Mitte)
      for (const [f, want] of [[off(-0.47, 'B', !!ax), ['h', 'vd', 'o']], [off(0, 'U'), ['vd', 'o']]]) {
        const log = scene(ax, [f]), L = own(log, ax), i = L.indexOf('fig ' + f.id);
        expect(i).toBeGreaterThan(L.indexOf('o ' + at(ax)));                                // nach dem Ruhenden
        const after = L.slice(i + 1);
        expect(after.filter(e => /^(h|vd|o) /.test(e)).map(e => e.split(' ')[0])).toEqual(want);
        if (f.id === 'B') for (const s of groups(ax, 'under')) expect(after.indexOf('deko ' + s + ' ' + at(ax))).toBeGreaterThan(after.indexOf('h ' + at(ax)));
        expect(after.filter(e => e.startsWith('deko')).every(e => groups(ax, f.id === 'B' ? 'under' : 'front').concat(groups(ax, 'front')).includes(+e.split(' ')[1]))).toBe(true);
      }
      // davor (F): im Brückenfeld, der Fuß vor der Stirn (Nord-Süd zeichnet ihn FOOT_D weiter vorn) – danach nichts mehr übermalt
      const fF = ax ? off(0.4, 'F') : off(0.499, 'F');
      expect(game(`bkMoverClass({ fur: '#fff', px: ${fF.px}, py: ${fF.py} }, bkAt(${x}, ${y}), ${x}, ${y})`)).toBe('F');
      {
        const log = scene(ax, [fF]), L = own(log, ax), i = L.indexOf('fig F');
        expect(i).toBeGreaterThan(-1);
        expect(L.slice(i + 1).some(e => /^(h|vd|o|deko) /.test(e))).toBe(false);
      }
      expect(game(`bkMoverClass({ critter: true, px: ${ax ? x + 0.45 : x}, py: ${ax ? y : y + 0.45} }, bkAt(${x}, ${y}), ${x}, ${y})`)).toBe('F');   // Tier: Mitte
      // dahinter und darunter zugleich: das Bewegte darunter wird erst nach dem h-Nachmalen gezeichnet (nie davon übermalt)
      {
        const log = scene(ax, [off(-0.47, 'B', !!ax), off(0, 'U')]), L = own(log, ax), iU = L.indexOf('fig U'), iB = L.indexOf('fig B');
        const hRedo = L.findIndex((e, j) => j > iB && e === 'h ' + at(ax));
        expect(hRedo).toBeGreaterThan(iB); expect(iU).toBeGreaterThan(hRedo);
      }
    });
  }
  it('fremdes Feld: Ruhendes und Nachgemaltes im Nebel, Figuren nicht', () => {
    const log = scene(0, [{ id: 'U', px: 15, py: 12 }], "for (let y = 0; y <= 26; y++) for (let x = 0; x <= 26; x++) state.claimed.delete(x + ',' + y); state.owned.delete(chunkOf(15, 12));");
    const L = log.filter(e => /^(h|vd|o) 15,12/.test(e));
    expect(L.length).toBe(5);                                                                // h vd o ruhend, vd o nachgemalt
    expect(L.every(e => e.endsWith(' fog'))).toBe(true);
  });
  it('Rückfall: ein Ding (alte Daten) unter dem Deck – die Brücke wird trotzdem gezeichnet', () => {
    const log = scene(0, [], "state.tiles.set('15,12', { b: 'haus', lvl: 1 });");
    expect(log.filter(e => / 15,12/.test(e) && /^(h|vd|o) /.test(e)).map(e => e.split(' ')[0])).toEqual(['h', 'vd', 'o']);
  });
});

// 160c B2c: weit weg drei Bildchen je Brückenfeld (h | vd | o) – im GL-Standbild ruhend; tileB schlägt sie beim Nachmalen nur nach
describe('Brücke weit weg als Bildchen (160c B2c)', () => {
  const far = () => game("(() => { cam.z = 0.5; lastZoom = 0.5; lastZoomChange = -1e9; const p = iso(15, 12); cam.x = p.x; cam.y = p.y; spriteForce = null; })()");
  it('je Feld und Gruppe ein Bildchen der aktuellen Fassung, ohne Licht; das nächste Bild malt nichts live und nichts neu', () => {
    scene(0);
    far();
    game('spriteNoBudget = true; render(1e6); spriteNoBudget = false');
    const keys = game("[...objSprites.entries()].filter(([k]) => k.startsWith('br|')).map(([k, e]) => [k, e.ver === groundVersion, e.glows.length])");
    for (const x of [14, 15, 16]) for (const gr of ['h', 'vd', 'o']) expect(keys.some(([k]) => k === `br|${x},12|${gr}|0`)).toBe(true);
    expect(keys.every(([, v, gl]) => v && gl === 0)).toBe(true);
    const r = game(`(() => { const bl = bkDrawLagen; let live = 0; bkDrawLagen = (...a) => { if (!SPRITE_PAINT) live++; return bl(...a); };
      const br = () => [...objSprites.entries()].filter(([k]) => k.startsWith('br|')), m0 = br(); walkers.push({ fur: '#fff', shirt: '#f00', id: 'U', px: 15, py: 12, kind: 0, speed: 0.4, wait: 1 });
      try { render(1e6 + 16); } finally { bkDrawLagen = bl; walkers.length = 0; } const m1 = br(); return [live, m1.length === m0.length && m1.every(([k, e], i) => m0[i][0] === k && m0[i][1] === e) ? 0 : 1]; })()`);
    expect(r).toEqual([0, 0]);                                                                // auch das Nachmalen unter der Figur nur aus den Bildchen
  });
  it('blass (👁) immer live, nie aus dem Bildchen', () => {
    scene(0); far();
    game('setSeeThrough(true)');
    const live = game(`(() => { const bl = bkDrawLagen; let n = 0; bkDrawLagen = (...a) => { if (!SPRITE_PAINT) n++; return bl(...a); };
      try { spriteNoBudget = true; render(1e6); spriteNoBudget = false; } finally { bkDrawLagen = bl; setSeeThrough(false); } return n; })()`);
    expect(live).toBeGreaterThanOrEqual(9);
  });
});

// 160c B2 gegengelesen: Licht beim Nachmalen (nur Scheiben neu stanzen), Plan-Rauten über dem Deck, Fußfeld nur das spätere
describe('Brücke gegengelesen (160c B2/C2)', () => {
  it('nachts: Laterne unter dem Deck behält ihre Scheibe, wenn jemand dahinter geht – kein zweiter Schein', () => {
    scene(0, [], "state.decos.set('15,12', [null, null, null, { b: 'laterne' }]);");             // Platz 3: unter dem Deck (s 0,4)
    const parts = game(`(() => { const pg = punchGlow, out = []; let inRedo = false; const rd = bkRedo;
      punchGlow = (q, r, tint, part) => { out.push((inRedo ? 'redo:' : '') + (part || 'voll')); return pg(q, r, tint, part); };
      bkRedo = (...a) => { inRedo = true; try { return rd(...a); } finally { inRedo = false; } };
      const ml = moverLive; moverLive = () => {}; const na = nightAt; nightAt = () => NIGHT_MAX;
      walkers.push({ fur: '#fff', shirt: '#f00', id: 'B', px: 15, py: 11.53, kind: 0 });       // dahinter: h und Deko UNTER werden nachgemalt
      try { cam.z = 2.5; const p = iso(15, 12); cam.x = p.x; cam.y = p.y - HILL_H; spriteForce = false; render(1e6); }
      finally { punchGlow = pg; bkRedo = rd; moverLive = ml; nightAt = na; walkers.length = 0; }
      return out; })()`);
    expect(parts.some(p => !p.startsWith('redo:'))).toBe(true);                                // tileA: Licht wie immer
    const redo = parts.filter(p => p.startsWith('redo:'));
    expect(redo.length).toBeGreaterThan(0); expect(redo.every(p => p === 'redo:pane')).toBe(true);   // Nachmalen: nur die Scheibe
  });
  it('Plan-Rauten auf dem Deck kommen nach dem Deck; Spaziergänger am Feldrand: nur ins spätere Fußfeld', () => {
    scene(0);
    const log = game(`(() => { const out = [], bl = bkDrawLagen, pp = DECK_MARKS; bkDrawLagen = (x, y, px, py, z, gr) => { out.push(gr + ' ' + x + ',' + y); return bl(x, y, px, py, z, gr); };
      setTool('weg'); startPlan('line', { x: 14, y: 12, deck: true }, { x: 16, y: 12 }, false);
      const hm = hillMark; hillMark = (x, y, f) => { out.push('raute ' + x + ',' + y); return hm(x, y, f); };
      try { cam.z = 2; const p = iso(15, 12); cam.x = p.x; cam.y = p.y - HILL_H; render(1e6); } finally { bkDrawLagen = bl; hillMark = hm; plan = null; setTool('look'); }
      return out; })()`);
    const iR = log.indexOf('raute 15,12'), iD = log.indexOf('vd 15,12');
    expect(iR).toBeGreaterThan(-1); expect(iD).toBeGreaterThan(-1); expect(iR).toBeGreaterThan(iD);
    // Nord-Süd: Mitte knapp in Feld i, Fuß (FOOT_D) im früheren Feld → bleibt im Mittelfeld; Ost-West: Fuß im späteren → dorthin
    scene(1);
    const key = game(`(() => { const out = []; const dp = bkDrawMoving; bkDrawMoving = (x, y, px, py, z, now, c, ms, figs) => { if (figs) for (const m of figs) out.push(x + ',' + y); };
      hillWalkers.push({ hillw: true, st: 'top', fur: '#fff', shirt: '#f00', kind: 0, px: 12, py: 8.52, up: 0, wait: 99, lane: 0 });
      try { render(1e6); } finally { bkDrawMoving = dp; hillWalkers.length = 0; } return out; })()`);
    expect(key).toEqual(['12,9']);
  });
});
