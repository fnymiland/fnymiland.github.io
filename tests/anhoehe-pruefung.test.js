const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2 – kritische Prüfung (10.10.2026, Nahaufnahmen tools/stufe2-nahszene.js → tools/vorschau/stufe2-nah.png): was dabei
// auffiel und behoben ist. Bündig: Felsschichten/Mauerreihen am Keil einer langen Rampe, dunkle Kante des hinteren Keils genau auf seiner
// Kante, Gehrung an der Innenecke, wenn der Keil schräg heranläuft. Regel: keine Eckpunkt-Deko auf der Schräge einer Rampe
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewLen = 1; hillWalkers.length = 0; walkers.length = 0; recalc(); resetUndo()");
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

describe('Keil einer langen Rampe: Wand über die Feldgrenze bündig', () => {
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

  it('paintRamp malt die Wände des Keils nach der ganzen Höhe der Anhöhe (Länge 1 und 2, jedes Feld)', () => {
    for (const [len, i] of [[1, 0], [2, 0], [2, 1]]) for (const rot of [0, 1, 2, 3]) {
      const o = { rot, len, i, style: 'sand', kind: 'fels', m: 'k', p: 'k', em: 0, ep: 0, top: '#123456' };
      const walls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`).filter(c => c.op === 'wall');
      expect(walls.length).toBe(2);
      for (const w of walls) expect([w.a[6], w.a[7], w.a[9], w.a[14]]).toEqual([0, H * i / len, H * (i + 1) / len, H]);
    }
  });
});

describe('Dunkle Kante des hinteren Keils und Gehrung an der Innenecke', () => {
  it('die Kante liegt genau auf der Oberkante des Keils, ab dem oberen Ende waagerecht (vorher eine Sehne: oben bis 2 Punkte darunter)', () => {
    // Drehung 0 (hinauf nach −y): hinterer Keil auf der −x-Seite; P bildet auf (v, Höhe) ab – längs der Rampe d = −v
    for (const [len, i] of [[1, 0], [2, 0], [2, 1]]) {
      const o = { rot: 0, len, i, style: 'sand', kind: 'fels', m: 'k', p: 'h', em: 0, ep: 0, top: '#123456' };
      const lines = paths(record(`paintRamp((u, v, up = 0) => [v, up], ${JSON.stringify(o)}, 5, 5)`), 'stroke').filter(p => p.stroke === KANTE);
      expect(lines.length).toBe(1);
      const h0 = H * i / len, h1 = H * (i + 1) / len, full = i === len - 1;
      for (const [v, h] of lines[0].pts) {
        const d = -v;
        expect(h).toBeCloseTo(full && d > 0.5 ? H : h0 + (h1 - h0) * (d + 0.5), 9);
      }
    }
  });

  it('rampMiter: gerade Arme wie bisher (Raute), Keil einer Rampe schräg – Enden genau an den Kanten des Felds', () => {
    const near = (p, q) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;
    const flat = game('rampMiter([0, 0], 0, 0)');
    [[0, 0], [-1.68, 0.84], [0, 1.68], [1.68, 0.84]].forEach((p, k) => expect(near(flat[k], p)).toBe(true));
    for (const len of [1, 2]) {
      // Keil hinten (Drehung 2): Kante kommt aus (32, 16 − 26/len) heran, Streifen 1,5 breit (höchstens der Keil, 0,1 Feld)
      const m = game(`rampMiter([0, 0], 0, ${len})`), q = m[m.length - 1], d = [-32, 16 - H / len], l = Math.hypot(...d);
      expect(Math.abs(q[1] - q[0] / 2)).toBeLessThan(1e-9);                                    // Ende auf der −y-Kante des Felds
      const dist = Math.abs(q[0] * d[1] - q[1] * d[0]) / l, keil = Math.abs(3.2 * d[1] - 1.6 * d[0]) / l;
      expect(dist).toBeCloseTo(Math.min(1.5, keil), 9);                                         // … und auf der Unterkante des Streifens
      expect(near(m[1], [-1.68, 0.84])).toBe(true);                                             // links die Anhöhe wie bisher
      // gespiegelt: Keil links (Drehung 1)
      const s = game(`rampMiter([0, 0], ${len}, 0)`);
      expect(s.length).toBe(m.length);
      for (const p of s) expect(m.some(r => near(p, [-r[0], r[1]]))).toBe(true);
    }
  });

  it('im Spiel: Rampe hinter der Wand (hinauf nach vorn) – das Feld oben schließt die Ecke mit der schrägen Gehrung', () => {
    hills(block(10, 13, 14, 15));
    game('rampNewLen = 2'); expect(game('placeError("huegelrampe", 12, 11)')).toBe(null);
    game('build("huegelrampe", 12, 11); rampNewLen = 1; recalc()');                            // Fuß 12,11, oben 12,12, hinauf nach +y
    expect(game('[rampAt(12, 12).i, rampAt(12, 12).rot, hillMiter(12, 13, 1), miterRamp(11, 13, 1, 1), miterRamp(12, 12, 2, 1)]')).toEqual([1, 2, true, 0, 2]);
    expect(game('hillSig(12, 13, hillAt(12, 13))')).toContain(':m02');
    const fills = paths(record('paintHill(12, 13, hillAt(12, 13))'), 'fill').filter(p => p.fill === KANTE);
    expect(fills.length).toBe(1);
    expect(fills[0].pts.length).toBe(4);
    // Treppe statt Rampe: wie bisher (gerade Gehrung, keine Fläche)
    game('state.tiles.delete("12,11"); recalc(); build("huegeltreppe", 12, 12); recalc()');
    expect(game('[!!stairAt(12, 12), hillMiter(12, 13, 1), miterRamp(12, 12, 2, 1)]')).toEqual([true, true, 0]);
    expect(game('hillSig(12, 13, hillAt(12, 13))')).toMatch(/:m(?!\d)/);
    expect(paths(record('paintHill(12, 13, hillAt(12, 13))'), 'fill').filter(p => p.fill === KANTE).length).toBe(0);
  });
});

describe('Geist beim Bauen', () => {
  it('Rampe über 2 Felder halb durchsichtig: erst zusammengesetzt, dann einmal gezeichnet (vorher heller Strich, wo sich die Felder überlappen)', () => {
    hills(block(10, 10, 13, 12));
    const t = "{ b: 'huegelrampe', lvl: 1, rot: 0, len: 2, style: 'sand' }";
    const images = alpha => record(`g.globalAlpha = ${alpha}; drawHillRamp(400, 300, 2, 11, 13, ${t})`).filter(c => c.op === 'drawImage').length;
    expect(images(0.65)).toBe(1);
    expect(images(1)).toBe(2);                                                                  // deckend wie bisher: Feld für Feld
    expect(record(`g.globalAlpha = 0.65; drawHillRamp(400, 300, 2, 11, 13, { b: 'huegelrampe', lvl: 1, rot: 0, style: 'sand' })`).filter(c => c.op === 'drawImage').length).toBe(1);   // 1 Feld wie bisher
  });
});

describe('Eckpunkt-Deko an der Rampe', () => {
  it('nicht auf ihrer Schräge (Mitte einer langen Rampe, zwischen breiten) – am Fuß schon; ohne Rampe wie bisher', () => {
    hills(block(10, 10, 13, 12));
    game('rampNewLen = 2; build("huegelrampe", 11, 13); build("huegelrampe", 12, 13); rampNewLen = 1; recalc()');   // Fuß y = 14, oben y = 13
    expect(game('hillRamps().length')).toBe(2);
    for (const [vx, vy] of [[12, 14], [11, 14], [13, 14]]) expect(game(`smallError('laterne', ${vx}, ${vy}, VSLOT)`)).toMatch(/Schräge der Rampe/);   // Mitte, Seiten
    expect(game("smallError('laterne', 12, 15, VSLOT)")).toBe(null);                          // vorn zwischen den Füßen: am Boden
    expect(game("smallError('laterne', 11, 15, VSLOT)")).toBe(null);
    expect(game("smallError('blumentopf', 12, 14, VSLOT)")).toMatch(/Schräge der Rampe/);
    expect(game("smallError('laterne', 16, 16, VSLOT)")).toBe(null);                          // anderswo wie bisher
  });
});
