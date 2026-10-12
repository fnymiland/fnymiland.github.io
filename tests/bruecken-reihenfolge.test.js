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
  game(`GFX.people = 'viele'; for (const f of ${JSON.stringify(figs)}) walkers.push({ fur: '#fff', shirt: '#f00', id: f.id, px: f.px, py: f.py, kind: 0 }); ${extra} groundVersion++; recalc()`);
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
      const [x, y] = at(ax).split(',').map(Number), off = (s, id) => ({ id, px: ax ? x + s : x, py: ax ? y : y + s });
      for (const [f, want] of [[off(-0.47, 'B'), ['h', 'vd', 'o']], [off(0, 'U'), ['vd', 'o']]]) {
        const log = scene(ax, [f]), L = own(log, ax), i = L.indexOf('fig ' + f.id);
        expect(i).toBeGreaterThan(L.indexOf('o ' + at(ax)));                                // nach dem Ruhenden
        const after = L.slice(i + 1);
        expect(after.filter(e => /^(h|vd|o) /.test(e)).map(e => e.split(' ')[0])).toEqual(want);
        if (f.id === 'B') for (const s of groups(ax, 'under')) expect(after.indexOf('deko ' + s + ' ' + at(ax))).toBeGreaterThan(after.indexOf('h ' + at(ax)));
        expect(after.filter(e => e.startsWith('deko')).every(e => groups(ax, f.id === 'B' ? 'under' : 'front').concat(groups(ax, 'front')).includes(+e.split(' ')[1]))).toBe(true);
      }
      const log = scene(ax, [off(0.6, 'F')]), L = own(log, ax), i = L.indexOf('fig F');
      expect(L.slice(i + 1).some(e => /^(h|vd|o|deko) /.test(e))).toBe(false);              // davor: nichts danach übermalt
      expect(i).toBeGreaterThan(L.lastIndexOf('o ' + at(ax)));
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
