const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2 – kritische Prüfung (10.10.2026, Nahaufnahmen tools/stufe2-nahszene.js → tools/vorschau/stufe2-nah.png): was dabei
// auffiel und behoben ist. Bündig: Felsschichten/Mauerreihen an schrägen Wänden (Keil der Treppe, Damm der Gleis-Rampe) über Feldgrenzen,
// dunkle Kante an der offenen Seite des Einschnitts A genau auf seiner Kante, Gehrung an der Innenecke, wenn sie schräg heranläuft. Regel: keine
// Eckpunkt-Deko auf der Schräge einer Gleis-Rampe
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; walkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const H = 26;
// Zeichnen mitschreiben (wie treppe-buendig.test.js): g zeichnet nichts, merkt sich jeden Aufruf samt Farben; poly und paintHillWall dazu
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly, pw = paintHillWall;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  paintHillWall = (...a) => { calls.push({ op: 'wall', a: a.slice(1) }); return pw(...a); };
  try { ${body}; } finally { g = prev; poly = pp; paintHillWall = pw; }
  return calls;
})()`);
const paths = (calls, op) => {
  let pts = [];
  const out = [];
  for (const c of calls) {
    if (c.op === 'beginPath') pts = [];
    else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a);
    else if (c.op === op) out.push({ pts, stroke: c.stroke, fill: c.fill });
  }
  return out;
};
const KANTE = 'rgba(45,85,30,0.5)';

describe('Schräge Wand über die Feldgrenze bündig', () => {
  it('Felsschichten und Mauerreihen liegen im unteren Feld so hoch wie im oberen (vorher sprangen sie an der Feldgrenze)', () => {
    // beide Stücke des Keils über 2 Felder: unten 0 → 13, oben 13 → 26 – die Linien treffen sich an der gemeinsamen Kante
    for (const kind of ['fels', 'mauer']) {
      const piece = (ht, ht1) => paths(record(`paintHillWall((u, v, up = 0) => [u, up], 0, 0, 1, 0, 'u', '${kind}', 0, ${ht}, 7, ${ht1}, true, 1, 0, 0, ${H})`), 'stroke');
      const lo = piece(0, H / 2), hi = piece(H / 2, H);
      const ends = (ps, s) => ps.map(p => p.pts).filter(pts => pts.length >= 2 && pts.every(q => q[0] >= -1e-9 && q[0] <= 1 + 1e-9) && pts.some(q => Math.abs(q[0] - s) < 1e-9) && Math.abs(pts[0][1] - pts[pts.length - 1][1]) < 1e-9)
        .map(pts => pts.find(q => Math.abs(q[0] - s) < 1e-9)[1]).filter(h => h > 0 && h < H / 2).sort((a, b) => a - b);
      expect(ends(lo, 1).length).toBeGreaterThan(0);
      expect(ends(lo, 1)).toEqual(ends(hi, 0));                                                // jede Linie unten läuft oben weiter
    }
  });
});

describe('Dunkle Kante an der offenen Seite des Einschnitts A und Gehrung an der Innenecke', () => {
  it('die Kante liegt genau auf der Oberkante der Schräge, ab dem oberen Ende waagerecht (vorher eine Sehne: oben bis 2 Punkte darunter)', () => {
    // Drehung 0 (hinauf nach −y): Einschnitt A, hinten (−x-Seite) offen; P bildet auf (v, Höhe) ab – längs der Rampe d = −v
    for (const i of [0, 1]) {
      const len = 2, o = { rot: 0, len, i, form: 'a', cut: true, first: i === 0, narrow: false, viadukt: false, kind: 'fels', wall: 'fels', m: 'k', p: 'h', top: '#123456', rl: 'schotter' };
      const lines = paths(record(`paintRamp((u, v, up = 0) => [v, up], ${JSON.stringify(o)}, 5, 5)`), 'stroke').filter(p => p.stroke === KANTE);
      expect(lines.length).toBe(1);
      const h0 = H * i / len, h1 = H * (i + 1) / len, full = i === len - 1;
      for (const [v, h] of lines[0].pts) {
        const d = -v;
        expect(h).toBeCloseTo(full && d > 0.5 ? H : h0 + (h1 - h0) * (d + 0.5), 9);
      }
    }
  });

  it('rampMiter: gerade Arme wie bisher (Raute), offene Seite des Einschnitts A schräg – Enden genau an den Kanten des Felds', () => {
    const near = (p, q) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;
    const flat = game('rampMiter([0, 0], 0, 0)');
    [[0, 0], [-1.68, 0.84], [0, 1.68], [1.68, 0.84]].forEach((p, k) => expect(near(flat[k], p)).toBe(true));
    const len = 2;                                                                              // nur A (ganz breit) hat eine Gehrung
    // Einschnitt hinten (Drehung 2): Kante kommt aus (32, 16 − 26/len) heran, Streifen 1,5 breit (ganz breit: nie schmaler)
    const m = game(`rampMiter([0, 0], 0, ${len})`), q = m[m.length - 1], d = [-32, 16 - H / len], l = Math.hypot(...d);
    expect(Math.abs(q[1] - q[0] / 2)).toBeLessThan(1e-9);                                      // Ende auf der −y-Kante des Felds
    expect(Math.abs(q[0] * d[1] - q[1] * d[0]) / l).toBeCloseTo(1.5, 9);                       // … und auf der Unterkante des Streifens
    expect(near(m[1], [-1.68, 0.84])).toBe(true);                                               // links die Anhöhe wie bisher
    // gespiegelt: Einschnitt links (Drehung 1)
    const s = game(`rampMiter([0, 0], ${len}, 0)`);
    expect(s.length).toBe(m.length);
    for (const p of s) expect(m.some(r => near(p, [-r[0], r[1]]))).toBe(true);
  });

  it('im Spiel: Einschnitt A hinauf nach vorn, links offen – das Feld oben dahinter schließt die Ecke mit der schrägen Gehrung', () => {
    hills(block(10, 13, 14, 15).concat([[12, 11], [13, 11], [12, 12], [13, 12]]));               // Zunge: 12/13 × 11/12, links davon unten
    expect(game('placeError("huegelrampe", 12, 11)')).toBe(null);
    game('build("huegelrampe", 12, 11); recalc()');                                            // Fuß 12,11, oben 12,12, hinauf nach +y
    expect(game('[rampAt(12, 12).i, rampAt(12, 12).rot, hillMiter(12, 13, 1), miterRamp(11, 13, 1, 1), miterRamp(12, 12, 2, 1)]')).toEqual([1, 2, true, 0, 2]);
    expect(game('hillSig(12, 13, hillAt(12, 13))')).toContain(':m02');
    const fills = paths(record('paintHill(12, 13, hillAt(12, 13))'), 'fill').filter(p => p.fill === KANTE);
    expect(fills.length).toBe(1);
    expect(fills[0].pts.length).toBe(4);
    // schmale Formen treffen die Kante nicht an der Ecke: keine Gehrung über sie
    game('state.tiles.get("12,11").form = "c"; groundVersion++; recalc()');
    expect(game('hillMiter(12, 13, 1)')).toBe(false);
    // Treppe statt Rampe: wie bisher (gerade Gehrung, keine Fläche)
    game('state.tiles.delete("12,11"); for (const k of ["12,11", "13,11", "12,12", "13,12"]) state.hills.delete(k); groundVersion++; recalc(); build("huegeltreppe", 12, 12); recalc()');   // Anhöhe ohne Zunge
    expect(game('[!!stairAt(12, 12), hillMiter(12, 13, 1), miterRamp(12, 12, 2, 1)]')).toEqual([true, true, 0]);
    expect(game('hillSig(12, 13, hillAt(12, 13))')).toMatch(/:m(?!\d)/);
    expect(paths(record('paintHill(12, 13, hillAt(12, 13))'), 'fill').filter(p => p.fill === KANTE).length).toBe(0);
  });
});

describe('Geist beim Bauen', () => {
  it('Gleis-Rampe über mehrere Felder halb durchsichtig: erst zusammengesetzt, dann einmal gezeichnet (sonst heller Strich, wo sich die Felder überlappen)', () => {
    hills(block(10, 10, 13, 12));
    for (const [f, len] of [['a', 2], ['b', 3], ['d', 4]]) {
      const t = `{ b: 'huegelrampe', lvl: 1, rot: 0, form: '${f}' }`;
      const images = alpha => record(`g.globalAlpha = ${alpha}; drawHillRamp(400, 300, 2, 11, 13, ${t})`).filter(c => c.op === 'drawImage').length;
      expect([f, images(0.65)]).toEqual([f, 1]);
      expect([f, images(1)]).toEqual([f, len]);                                                // deckend: Feld für Feld
    }
  });
});

describe('Eckpunkt-Deko an der Gleis-Rampe', () => {
  it('nicht auf ihrer Schräge (zwischen ihren Feldern, zwischen zwei Einschnitten nebeneinander) – am Fuß schon; ohne Rampe wie bisher', () => {
    hills(block(10, 10, 13, 12));
    game('build("huegelrampe", 11, 11); build("huegelrampe", 12, 11); recalc()');               // A nebeneinander: Fuß y = 12, oben y = 11
    expect(game('hillRamps().length')).toBe(2);
    expect(game("smallError('laterne', 12, 12, VSLOT)")).toMatch(/Schräge der Gleis-Rampe/);   // zwischen beiden, zwischen Fuß und oben
    for (const [vx, vy] of [[11, 12], [13, 12]]) expect(game(`smallError('laterne', ${vx}, ${vy}, VSLOT)`)).toMatch(/Kante einer Anhöhe/);   // an den Wangen
    expect(game("smallError('laterne', 12, 13, VSLOT)")).toBe(null);                          // vorn zwischen den Füßen: am Boden
    expect(game("smallError('blumentopf', 12, 12, VSLOT)")).toMatch(/Schräge der Gleis-Rampe/);
    expect(game("smallError('laterne', 16, 16, VSLOT)")).toBe(null);                          // anderswo wie bisher
  });
});
