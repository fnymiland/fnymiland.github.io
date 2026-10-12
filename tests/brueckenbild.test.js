const { loadGame, game } = require('./helpers/load-game');

// Brückenbild (160c B1): der Maler der Anhöhen-Brücken in Lagen h/v/d/o (PLAN-160c.md §2.2) – jede Lage bleibt in ihrem Feld (Prisma, G1)
// und ist deckend (G5: nachgemalt darf sie nicht dunkler werden)
beforeAll(() => loadGame());
beforeEach(() => game('startNew()'));

// alle Fälle: Holz/Stahl × n 1–4 × mit/ohne Gleis × jedes Feld × jede Lage; zeichnet in eine Attrappe und gibt Auffälliges zurück
const scan = () => game(`(() => {
  const g0 = g, bad = [];
  let cur = '';
  const fake = new Proxy({}, { get: (o, k) => k in o ? o[k] : () => {}, set: (o, k, v) => {
    if ((k === 'fillStyle' || k === 'strokeStyle') && !/^#[0-9a-f]{6}$/i.test(v)) bad.push(cur + ' ' + k + '=' + v);
    if (k === 'globalAlpha' && v < 1) bad.push(cur + ' globalAlpha=' + v);
    o[k] = v; return true; } });
  g = fake;
  try {
    for (const art of ['holz', 'stahl']) for (let n = 1; n <= 4; n++) for (const rail of [false, true]) for (let i = 0; i < n; i++) for (const lage of BK_LAGEN) {
      cur = art + ' n' + n + (rail ? ' gleis' : '') + ' feld ' + i + ' ' + lage;
      const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur + ' t=' + t); if (!Number.isFinite(t + s + h)) bad.push(cur + ' NaN'); return [t * 10, s * 10 - h]; };
      bkPaintLage(lage, P, 2, art, n, i - 0.5, i + 0.5, false, { supports: rail ? Array.from({ length: n - 1 }, (_, k) => k + 1) : [], ext: i < n - 1 ? 0.012 : 0 });
    }
  } finally { g = g0; }
  return bad;
})()`);

describe('Brückenbild in Lagen (160c B1)', () => {
  it('Prisma und deckend: jede Lage zeichnet nur in ihrem Feld, nur volle Farben, kein globalAlpha', () => {
    expect(scan()).toEqual([]);
  });
  it('bkPaint = h, v, d, Bewegtes, o – das Bewegte liegt zwischen Deck und vorderem Geländer', () => {
    const order = game(`(() => { const out = [], f = bkPaintLage;
      bkPaintLage = (lage, ...a) => { out.push(lage); return f(lage, ...a); };
      try { bkPaint((t, s, h) => [t, s - h], 1, 'holz', 3, 0.5, 1.5, false, { after: () => out.push('A') }); } finally { bkPaintLage = f; }
      return out.join(''); })()`);
    expect(order).toBe('hvdAo');
  });
});

// 160c B2a: Gerüst fürs Zeichnen in tileA/tileB – Gruppen h | vd | o, Rahmen, Deko nach Querlage, Lichtsperre, lebendige GL-Felder
describe('Brückenbild: Gerüst für B2', () => {
  const setup = () => game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.hills.clear(); state.bruecken.clear(); for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); for (let x = 10; x <= 14; x++) for (const y of [4, 5, 6, 7, 11, 12, 13, 14]) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");
  it('Rahmen: jede Gruppe bleibt in brBox (alle Materialien, n 1–4, Weg/Gleis/leer, beide Achsen, z 0,5/1/2,5, mit und ohne Licht – C7)', () => {
    setup();
    const bad = game(`(() => {
      const g0 = g, bad = [], st = []; let box = null, lw = 1, cur = '', clipped = 0;   // was nach clip() kommt, ist beschnitten (Muster im Weg)
      const chk = (x, y) => { if (clipped) return; const [l, u, r, d] = box, e = lw / 2 + 0.01; if (x < -l - e || x > r + e || y < -u - e || y > d + e) bad.push(cur + ' ' + x.toFixed(1) + ',' + y.toFixed(1)); };
      const fake = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => chk(x, y) : k === 'arc' ? (x, y, r) => { chk(x - r, y - r); chk(x + r, y + r); } : k === 'save' ? () => st.push(clipped) : k === 'restore' ? () => { clipped = st.pop() || 0; } : k === 'clip' ? () => { clipped = 1; } : k in o ? o[k] : () => {},
        set: (o, k, v) => { o[k] = v; if (k === 'lineWidth') lw = v; return true; } });
      try {
        for (const art of ['holz', 'stahl', 'stein', 'kristall']) for (let n = 1; n <= 4; n++) for (const top of ['', 'weg', 'gleis']) for (const ax of [0, 1]) for (const brl of [null, 'an']) {
          state.bruecken.clear();
          const b = { ax, n, art }; if (top === 'weg') b.weg = Array(n).fill('platten'); if (top === 'gleis') b.gleis = Array(n).fill(0); if (brl) b.brl = brl;
          state.bruecken.set(ax ? '12,8' : '14,12', b); groundVersion++;
          for (let i = 0; i < n; i++) for (const z of [0.5, 1, 2.5]) for (const gr of Object.keys(BK_GRUPPEN)) {
            const x = ax ? 12 : 14 + i, y = ax ? 8 + i : 12;
            cur = art + ' n' + n + ' ' + top + ' ax' + ax + (brl ? ' licht' : '') + ' i' + i + ' z' + z + ' ' + gr; box = brBox(gr, bkAt(x, y)).map(v => v * z);
            g = fake; try { bkDrawLagen(x, y, 0, 0, z, gr); } finally { g = g0; }
          }
        }
      } finally { g = g0; }
      return bad.slice(0, 10); })()`);
    expect(bad).toEqual([]);
  });
  it('Deko nach Querlage: hinter dem Deck, darunter, davor – beide Achsen, jede Deko genau einmal', () => {
    setup();
    game("state.bruecken.set('14,12', { ax: 0, n: 3, art: 'holz' }); state.bruecken.set('12,8', { ax: 1, n: 3, art: 'holz' }); groundVersion++");
    game("for (const k of ['15,12', '12,9']) { const ds = []; for (let i = 0; i < 10; i++) ds[i] = { b: 'blumen' }; state.decos.set(k, ds); }");
    const G0 = game("bkDecoGroups(15, 12, bkAt(15, 12))"), G1 = game("bkDecoGroups(12, 9, bkAt(12, 9))");
    for (const G of [G0, G1]) expect([...G.back, ...G.under, ...G.front].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(G0.back).toContain(8); expect(G1.back).toContain(8); expect(G0.under).toContain(9); expect(G1.under).toContain(9);
    const pos = (x, y, i) => game(`slotPos(${x}, ${y}, ${i}, { b: 'blumen' })`);
    for (const i of G0.front) expect(pos(15, 12, i)[1]).toBeGreaterThan(0.4);
    for (const i of G1.front) expect(pos(12, 9, i)[0]).toBeGreaterThan(0.4);
    for (const i of G0.back) expect(pos(15, 12, i)[1]).toBeLessThan(-0.4);
  });
  it('Lichtsperre: unter GLOW_MUTE kein Schein (weder gestanzt noch gemerkt)', () => {
    const r = game(`(() => { const pg = punchGlow, g0 = g, n0 = night; let hit = 0; punchGlow = () => { hit++; }; g = ctx; night = 1;
      const sink = GLOW_SINK; GLOW_SINK = null;
      try { GLOW_MUTE = true; glowQuad([[0, 0], [1, 0], [1, 1], [0, 1]], 3); GLOW_SINK = []; glowQuad([[0, 0], [1, 0], [1, 1], [0, 1]], 3); const muted = [hit, GLOW_SINK.length];
        GLOW_MUTE = false; GLOW_SINK = null; glowQuad([[0, 0], [1, 0], [1, 1], [0, 1]], 3); return [...muted, hit]; }
      finally { GLOW_MUTE = false; GLOW_SINK = sink; punchGlow = pg; g = g0; night = n0; } })()`);
    expect(r).toEqual([0, 0, 1]);
  });
  it('glEvTiles: dyn plus die Felder der Listen, sortiert, ohne Doppelte, Unbekanntes fällt weg', () => {
    expect(game("glEvTiles([5, 2], new Map([['1,1', 7], ['2,2', 2], ['3,3', 0]]), [['1,1', '9,9'], ['2,2', '3,3'], []])")).toEqual([0, 2, 5, 7]);
  });
});

// 160c C2b: Fußgänger-Maler (Bogen, Holz 3b) – Prisma, deckend, nie runde Kappen, Kanten genau einmal, Stützen nur auf brSupports
describe('Fußgänger-Brücke mit Bogen (160c C2)', () => {
  const scanFuss = art => game(`(() => {
    const g0 = g, bad = [], verts = new Map(); let cur = '', pts = [], fill = 0;
    const fake = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'stroke' ? () => {
        if (o.lineCap === 'round') bad.push(cur + ' round');
        if (pts.length === 2 && Math.abs(pts[0][0] - pts[1][0]) < 1e-6) { const key = cur.split(' feld')[0] + ' ' + o.strokeStyle + ' ' + pts[0][0].toFixed(3) + ' ' + Math.min(pts[0][1], pts[1][1]).toFixed(2); verts.set(key, (verts.get(key) || 0) + 1); }
      } : k in o ? o[k] : () => {},
      set: (o, k, v) => { if ((k === 'fillStyle' || k === 'strokeStyle') && !/^#[0-9a-f]{6}$/i.test(v)) bad.push(cur + ' ' + k + '=' + v); if (k === 'globalAlpha' && v < 1) bad.push(cur + ' alpha'); o[k] = v; return true; } });
    g = fake;
    try {
      for (let n = 1; n <= 8; n++) for (const ax of [0, 1]) { const hf = brDeckHFn('fuss', n), sp = brSupports({ mat: '${art}', fam: 'fuss', stuetzen: 'wenige' }, n);
        for (let i = 0; i < n; i++) for (const lage of BK_LAGEN) {
          cur = 'n' + n + ' ax' + ax + ' feld ' + i + ' ' + lage;
          const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur + ' t=' + t); if (!Number.isFinite(t + s + h)) bad.push(cur + ' NaN'); return [t * 32 - s * 7, s * 16 - h]; };
          bkPaintLage(lage, P, 1, '${art}', n, i - 0.5, i + 0.5, false, { fam: 'fuss', ax, hf, supports: i ? sp : [], ext: i < n - 1 ? 0.012 : 0 });
        } }
    } finally { g = g0; }
    return [bad.slice(0, 8), [...verts].filter(([, v]) => v > 1).slice(0, 8)];
  })()`);
  it('Holz und Metall: in seinem Feld, deckend, Längsstriche ohne runde Kappen, jeder senkrechte Strich (Kante) genau einmal', () => {
    expect(scanFuss('holz')).toEqual([[], []]);
    expect(scanFuss('stahl')).toEqual([[], []]);
  });
  it('das Deck folgt dem Bogen: Scheitel in der Mitte, an den Wänden HILL_H; Gleis legt es flach', () => {
    const hs = game(`(() => { const out = []; const g0 = g; let ys = [];
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => ys.push([x, y]) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      try { for (let i = 0; i < 4; i++) { ys = []; bkPaintLage('d', (t, s, h) => [t, h], 1, 'holz', 4, i - 0.5, i + 0.5, false, { fam: 'fuss', hf: brDeckHFn('fuss', 4) }); out.push(Math.max(...ys.map(p => p[1]))); } }
      finally { g = g0; } return out; })()`);
    expect(hs[1]).toBeCloseTo(game("HILL_H + brPeak('fuss', 4)"), 0); expect(hs[0]).toBeLessThan(hs[1]);
    expect(game("bkH({ ax: 0, n: 4, art: 'holz', gleis: [0, 0, 0, 0] }, 1.5)")).toBe(game('HILL_H'));
  });
});

const WAECHTER = 1946393987;   // Fußgänger Holz/Metall – vor dem Umbau gemessen (160c C3b; ohne Bahn neu gemessen vor C5)
// 160c C3b: Wächter – der Umbau für Stein (gemeinsame Helfer bkKit) zeichnet Holz, Metall und Bahn genau wie vorher
describe('Wächter: Fußgänger Holz/Metall aufrufgleich (160c C3b, C5)', () => {
  it('Fingerabdruck aller Zeichenaufrufe', () => {
    const h = game(`(() => {
      for (let y = 4; y <= 30; y++) for (let x = 4; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
      state.hills.clear(); state.bruecken.clear(); state.edges.clear();
      for (let y = 10; y <= 14; y++) for (const x of [6, 7, 8, 9, 18, 19, 20, 21]) state.hills.set(x + ',' + y, { w: 0 });
      for (let x = 6; x <= 14; x++) for (const y of [4, 5, 6, 7, 16, 17, 18, 19]) state.hills.set(x + ',' + y, { w: 0 });
      groundVersion++; recalc();
      const g0 = g; let acc = 2166136261 >>> 0;
      const mix = s => { for (let i = 0; i < s.length; i++) { acc ^= s.charCodeAt(i); acc = Math.imul(acc, 16777619) >>> 0; } };
      const r = v => typeof v === 'number' ? (Math.round(v * 1e4) / 1e4).toString() : String(v);
      g = new Proxy({}, { get: (o, k) => k in o ? o[k] : typeof k === 'string' ? (...a) => { mix(k + '(' + a.map(r).join(',') + ')'); } : undefined,
        set: (o, k, v) => { o[k] = v; mix(k + '=' + r(v)); return true; } });
      try {
        for (const art of ['holz', 'stahl']) for (const top of ['', 'weg']) for (const n of [1, 2, 3, 4, 8]) for (const ax of [0, 1]) {   // Bahn (Gleis) seit C5 eigener Maler
          state.bruecken.clear();
          const b = { ax, n, art }; if (top === 'weg') b.weg = Array(n).fill('platten'); if (top === 'gleis') b.gleis = Array(n).fill(0);
          if (n <= 8 && (ax ? 8 + n <= 16 : 10 + n <= 18)) { state.bruecken.set(ax ? '10,8' : '10,12', b); groundVersion++; }
          else continue;
          for (let i = 0; i < n; i++) for (const z of [0.45, 1, 2.5]) for (const gr of ['h', 'vd', 'o']) { mix('|' + [art, top, n, ax, i, z, gr].join(':')); bkDrawLagen(ax ? 10 : 10 + i, ax ? 8 + i : 12, 0, 0, z, gr); }
        }
      } finally { g = g0; }
      return acc; })()`);
    expect(h).toBe(WAECHTER);
  });
});

// 160c C3: Steinmaler – Prisma, deckend, nie runde Kappen, Kanten genau einmal, Stirn-Unterkante = Bögen bzw. Boden am Pfeiler, Laibung je Ansatz
describe('Steinbrücke (160c C3)', () => {
  const scanStein = (opt = '') => game(`(() => {
    const g0 = g, bad = [], verts = new Map(), polys = []; let cur = '', pts = [];
    const fake = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'closePath' ? () => { o.closed = true; } : k === 'fill' ? () => { polys.push([cur, o.fillStyle, pts.length]); o.closed = false; } : k === 'stroke' ? () => {
        if (o.lineCap === 'round') bad.push(cur + ' round'); if (o.closed) bad.push(cur + ' stroke nach closePath');
        if (pts.length === 2 && Math.abs(pts[0][0] - pts[1][0]) < 1e-6) { const key = cur.split(' feld')[0] + ' ' + o.strokeStyle + ' ' + pts[0][0].toFixed(3) + ' ' + Math.min(pts[0][1], pts[1][1]).toFixed(2); verts.set(key, (verts.get(key) || 0) + 1); }
      } : k in o ? o[k] : () => {},
      set: (o, k, v) => { if ((k === 'fillStyle' || k === 'strokeStyle') && !/^#[0-9a-f]{6}$/i.test(v)) bad.push(cur + ' ' + k + '=' + v); if (k === 'globalAlpha' && v < 1) bad.push(cur + ' alpha'); o[k] = v; return true; } });
    g = fake;
    try {
      for (let n = 1; n <= 8; n++) for (const ax of [0, 1]) for (const z of [0.45, 1, 2.5]) for (const wet of [0, 1]) { const hf = brDeckHFn('fuss', n), S = brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)), gl = t => wet && Math.round(t) % 2 ? -6.3 : 0;
        for (let i = 0; i < n; i++) for (const lage of BK_LAGEN) {
          cur = 'n' + n + ' ax' + ax + ' z' + z + ' w' + wet + ' feld ' + i + ' ' + lage;
          const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur + ' t=' + t); if (!Number.isFinite(t + s + h)) bad.push(cur + ' NaN'); return [t * 32 - s * 7, s * 16 - h]; };
          bkPaintLage(lage, P, z, 'stein', n, i - 0.5, i + 0.5, false, { fam: 'fuss', ax, hf, stone: S, gl, ext: i < n - 1 ? 0.012 : 0 ${opt} });
        } }
    } finally { g = g0; }
    return [bad.slice(0, 8), [...verts].filter(([, v]) => v > 1).slice(0, 8), polys.length];
  })()`);
  it('in seinem Feld, deckend, ohne runde Kappen, ohne Umriss, jede Senkrechte genau einmal (n 1–8, beide Achsen, nah/weit, Wasser)', () => {
    const r = scanStein();
    expect(r[0]).toEqual([]); expect(r[1]).toEqual([]); expect(r[2]).toBeGreaterThan(0);
  });
  it('Stirn: oben das Deck, unten die Bögen, am Pfeiler bis zum Boden; Laibung genau einmal je Bogenansatz im Feld seines Ansatzes', () => {
    const r = game(`(() => { const g0 = g, polys = []; let pts = [];
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'fill' ? () => polys.push([o.fillStyle, pts.slice()]) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      const n = 4, hf = brDeckHFn('fuss', n), S = brStoneGeom('fuss', n, [2]), out = { face: [], inner: [] };
      try { for (let i = 0; i < n; i++) for (const lage of ['h', 'v']) { polys.length = 0;
        bkPaintLage(lage, (t, s, h) => [t + (s > 0 ? 1000 : s < 0 ? -1000 : 0), h], 1, 'stein', n, i - 0.5, i + 0.5, false, { fam: 'fuss', ax: 0, hf, stone: S, gl: () => 0, ext: 0 });   // x: t, vorn +1000
        for (const [col, p] of polys) { if (col === BK_STEIN.inner) out.inner.push([i, p[0][0] - 1000]); if (col === BK_STEIN.face && lage === 'v') out.face.push([i, p]); } } }
      finally { g = g0; }
      const f1 = out.face.find(([i]) => i === 1)[1].map(([x, h]) => [x - 1000, h]);   // Feld 1: Pfeiler bei 1,41…1,5 bis zum Boden
      return { inner: out.inner, pierFloor: f1.some(([t, h]) => Math.abs(t - 1.41) < 1e-6 && h === 0), top: f1.some(([t, h]) => Math.abs(t - 1) < 1e-9 && Math.abs(h - hf(t)) < 1e-9) ? 1 : 0 }; })()`);
    expect(r.inner.map(([i, t]) => [i, +t.toFixed(2)])).toEqual([[2, 1.59]]);               // Pfeilerseite in Feld 2; an der Wand kein Widerlager (Felswand sichtbar)
    expect(r.pierFloor).toBe(true); expect(r.top).toBe(1);
  });
  it('Weiche: Stein-Fußgänger malt Stein, Bahn-Stein den flachen Rückfall; bkPaint-Folge h v d A o', () => {
    const order = game(`(() => { const out = [], f = bkPaintLage; bkPaintLage = (lage, ...a) => { out.push(lage); return f(lage, ...a); };
      try { bkPaint((t, s, h) => [t, s - h], 1, 'stein', 4, 0.5, 1.5, false, { fam: 'fuss', hf: brDeckHFn('fuss', 4), stone: brStoneGeom('fuss', 4, [2]), after: () => out.push('A') }); } finally { bkPaintLage = f; }
      return out.join(''); })()`);
    expect(order).toBe('hvdAo');
  });
});

describe('Stein gegengelesen: Pfeiler über Land→Wasser (160c C3)', () => {
  it('Stirn-Unterkante mit Stufe an der Feldkante, kein Keil über dem Ufer', () => {
    const pts = game(`(() => { const g0 = g, polys = []; let p = [];
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => p.push([x, y]) : k === 'beginPath' ? () => { p = []; } : k === 'fill' ? () => polys.push([o.fillStyle, p.slice()]) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      const n = 4, hf = brDeckHFn('fuss', n), S = brStoneGeom('fuss', n, [2]), gl = t => Math.round(t) >= 2 ? -6.3 : 0;
      try { bkPaintLage('v', (t, s, h) => [t, h], 1, 'stein', n, 0.5, 1.5, false, { fam: 'fuss', ax: 0, hf, stone: S, gl, ext: 0.012 }); } finally { g = g0; }
      return polys.find(([c]) => c === BK_STEIN.face)[1]; })()`);
    expect(pts.some(([t, h]) => Math.abs(t - 1.5) < 1e-9 && h === 0)).toBe(true);
    expect(pts.some(([t, h]) => Math.abs(t - 1.5) < 1e-9 && h === -6.3)).toBe(true);
    expect(pts.filter(([t]) => t > 1.41 + 1e-6 && t < 1.5 - 1e-9).every(([, h]) => h >= 0)).toBe(true);
  });
});

// 160c C4: Kristall K1 – Glas (hg/t1/t2) halbdurchsichtig mit den Deckkräften des Entwurfs, nie ins Nachbarfeld; sonst deckend; Zacken ≥ Lichtraum
describe('Kristallbrücke K1 (160c C4)', () => {
  const scanK = zacken => game(`(() => {
    const g0 = g, bad = [], verts = new Map(), zk = []; let cur = '', pts = [], lage = '', T0 = 0, T1 = 0;
    const fake = new Proxy({}, { get: (o, k) => k === 'drawn' ? o.n > 0 : k === 'moveTo' || k === 'lineTo' ? (x, y) => { pts.push([x, y]); o.n = (o.n || 0) + 1; } : k === 'beginPath' ? () => { pts = []; } : k === 'fill' ? () => {
        if (/^rgba/.test(o.fillStyle) && pts.some(([x]) => x < T0 * 32 - 1e-6 - 7 * 0.41 || x > T1 * 32 + 7 * 0.41 + 1e-6)) bad.push(cur + ' Glas über die Feldgrenze');
        if (o.fillStyle === C('${'#7fc4e8'}') || o.fillStyle === C('${'#c9b8f0'}')) zk.push(Math.min(...pts.map(([, y]) => -y)));   // Spitze = tiefster Punkt
      } : k === 'stroke' ? () => {
        if (o.lineCap === 'round') bad.push(cur + ' round');
        if (pts.length === 2 && Math.abs(pts[0][0] - pts[1][0]) < 1e-6) { const key = cur.split(' feld')[0] + ' ' + o.strokeStyle + ' ' + pts[0][0].toFixed(3) + ' ' + Math.min(pts[0][1], pts[1][1]).toFixed(2); verts.set(key, (verts.get(key) || 0) + 1); }
      } : k in o ? o[k] : () => {},
      set: (o, k, v) => {
        if (k === 'fillStyle' || k === 'strokeStyle') { const glas = lage === 'hg' || lage === 't1' || lage === 't2';
          if (!/^#[0-9a-f]{6}$/i.test(v) && !(glas && k === 'fillStyle' && /^rgba\\(\\d+,\\d+,\\d+,(0\\.3|0\\.42|0\\.78)\\)$/.test(v))) bad.push(cur + ' ' + k + '=' + v); }
        if (k === 'globalAlpha' && v < 1) bad.push(cur + ' alpha'); o[k] = v; return true; } });
    g = fake;
    try {
      for (let n = 1; n <= 8; n++) for (const ax of [0, 1]) { const hf = brDeckHFn('fuss', n);
        for (let i = 0; i < n; i++) for (const L of BK_LAGEN) {
          lage = L; cur = 'n' + n + ' ax' + ax + ' feld ' + i + ' ' + L; T0 = i - 0.5; T1 = i + 0.5; fake.n = 0;
          const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur + ' t=' + t); if (!Number.isFinite(t + s + h)) bad.push(cur + ' NaN'); return [t * 32 - s * 7, -h]; };
          bkPaintLage(L, P, 1, 'kristall', n, i - 0.5, i + 0.5, false, { fam: 'fuss', ax, hf, zacken: ${zacken}, ext: i < n - 1 ? 0.012 : 0 });
          if ((L === 'v' || L === 'o') && fake.drawn) bad.push(cur + ' nicht leer');   // K1: v und o leer
        } }
    } finally { g = g0; }
    return [bad.slice(0, 8), [...verts].filter(([, v]) => v > 1).slice(0, 8), zk];
  })()`);
  it('Prisma, Glas nur mit 0,30/0,42/0,78 und nie über die Feldgrenze, sonst deckend; Pfosten genau einmal; mit und ohne Zacken', () => {
    for (const zk of [false, true]) { const r = scanK(zk); expect(r[0]).toEqual([]); expect(r[1]).toEqual([]); }
  });
  it('Zacken: nur mit Option, Spitze nie unter den Lichtraum (brClear), 7 je Feld, symmetrisch (beide Enden gleich)', () => {
    expect(scanK(false)[2]).toEqual([]);
    const tips = scanK(true)[2];
    expect(tips.length).toBe([1, 2, 3, 4, 5, 6, 7, 8].reduce((s, n) => s + 7 * n, 0) - 2 * 0);   // gezählt in Ost-West (Nord-Süd: schattierte Farbe)
    expect(Math.min(...tips)).toBeGreaterThanOrEqual(game('brClear()') - 1e-9);
    const sym = game(`(() => { const out = [], g0 = g; let pts = [];
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'fill' ? () => { if (o.fillStyle === C('#7fc4e8') || o.fillStyle === C('#c9b8f0')) { const tip = pts.reduce((a, p) => p[1] < a[1] ? p : a); out.push([tip[0], +tip[1].toFixed(6), o.fillStyle]); } } : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      try { const n = 4, hf = brDeckHFn('fuss', n); for (let i = 0; i < n; i++) bkPaintLage('t1', (t, s, h) => [t, h], 1, 'kristall', n, i - 0.5, i + 0.5, false, { fam: 'fuss', ax: 0, hf, zacken: true, ext: 0 }); } finally { g = g0; }
      return out; })()`);
    expect(sym.length).toBe(28);
    for (let j = 0; j < 14; j++) { const a = sym[j], b = sym[27 - j]; expect(a[0] + b[0]).toBeCloseTo(3, 9); expect(a[1]).toBeCloseTo(b[1], 6); expect(a[2]).toBe(b[2]); }   // gespiegelt um die Mitte t = 1,5
  });
  it('Folge in bkPaint: hg h v d t1 A o t2 (Holz weiter h v d A o)', () => {
    const order = game(`(() => { const out = [], f = bkPaintLage; bkPaintLage = (lage, ...a) => { out.push(lage); return f(lage, ...a); };
      try { bkPaint((t, s, h) => [t, s - h], 1, 'kristall', 3, 0.5, 1.5, false, { fam: 'fuss', hf: brDeckHFn('fuss', 3), after: () => out.push('A') }); } finally { bkPaintLage = f; }
      return out.join(' '); })()`);
    expect(order).toBe('hg h v d t1 A o t2');
  });
  it('Glas im Nebel: gültiges rgba, anders als ohne Nebel', () => {
    const r = game("(() => { const f = FOG; try { FOG = false; const a = rgbaK('#afe1f8', 0.3); FOG = true; const b = rgbaK('#afe1f8', 0.3); return [a, b]; } finally { FOG = f; } })()");
    expect(r[0]).toMatch(/^rgba\(\d+,\d+,\d+,0\.3\)$/); expect(r[1]).toMatch(/^rgba\(\d+,\d+,\d+,0\.3\)$/); expect(r[0]).not.toBe(r[1]);
  });
});

// 160c C5: Bahn-Maler – Holz-Böcke auf jeder Kante (Kreuz hinten), Metall/Kristall B2 Fachwerk mit 2n Feldern; Prisma, deckend, 'butt', Kanten genau einmal
describe('Bahn-Brücke (160c C5)', () => {
  const scanBahn = art => game(`(() => {
    const g0 = g, bad = [], verts = new Map(), log = []; let cur = '', pts = [], lage = '';
    const fake = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'closePath' ? () => { o.closed = true; } : k === 'fill' ? () => { o.closed = false; } : k === 'stroke' ? () => {
        if (o.lineCap === 'round') bad.push(cur + ' round'); if (o.closed) bad.push(cur + ' closePath');
        if (pts.length === 2 && Math.abs(pts[0][0] - pts[1][0]) < 1e-6) { const key = cur.split(' feld')[0] + ' ' + lage + ' ' + o.strokeStyle + ' ' + pts[0][0].toFixed(3) + ' ' + Math.min(pts[0][1], pts[1][1]).toFixed(2); verts.set(key, (verts.get(key) || 0) + 1); log.push([cur, o.strokeStyle, pts[0][0], -Math.min(-pts[0][1], -pts[1][1])]); }
      } : k in o ? o[k] : () => {},
      set: (o, k, v) => { if ((k === 'fillStyle' || k === 'strokeStyle') && !/^#[0-9a-f]{6}$/i.test(v)) bad.push(cur + ' ' + k + '=' + v); if (k === 'globalAlpha' && v < 1) bad.push(cur + ' alpha'); o[k] = v; return true; } });
    g = fake;
    try {
      for (let n = 1; n <= 8; n++) for (const ax of [0, 1]) for (const wet of [0, 1]) { const sp = brSupports({ mat: '${art}', fam: 'bahn' }, n);
        for (let i = 0; i < n; i++) for (const L of BK_LAGEN) {
          lage = L; cur = 'n' + n + ' ax' + ax + ' w' + wet + ' feld ' + i + ' ' + L;
          const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur + ' t=' + t); if (!Number.isFinite(t + s + h)) bad.push(cur + ' NaN'); return [t * 32 - s * 7, s * 16 - h]; };
          bkPaintLage(L, P, 1, '${art}', n, i - 0.5, i + 0.5, false, { fam: 'bahn', ax, supports: i ? sp : [], foot: () => wet ? -6.3 : 0, ext: i < n - 1 ? 0.012 : 0 });
        } }
    } finally { g = g0; }
    return [bad.slice(0, 8), [...verts].filter(([, v]) => v > 1).slice(0, 8)];
  })()`);
  it('Holz, Metall, Kristall B2: in seinem Feld, deckend, ohne runde Kappen und Umriss, jede Senkrechte genau einmal (n 1–8, beide Achsen, Wasser)', () => {
    for (const art of ['holz', 'stahl', 'kristall']) expect(scanBahn(art)).toEqual([[], []]);
  });
  it('Holz: Bock hinten (h) und vorn (v) an jeder inneren Kante bis zum Boden bzw. Wasser, Kreuz nur hinten; Metall: Fachwerk mit 2n − 1 Pfosten je Seite', () => {
    const r = game(`(() => { const g0 = g, out = []; let pts = [], L = '';
      g = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => pts.push([x, y]) : k === 'beginPath' ? () => { pts = []; } : k === 'stroke' ? () => out.push([L, o.strokeStyle, o.lineWidth, pts.map(p => p.slice())]) : k in o ? o[k] : () => {}, set: (o, k, v) => { o[k] = v; return true; } });
      const P = (t, s, h) => [t, h], res = {};
      try {
        for (const art of ['holz', 'stahl']) { res[art] = {}; for (const lage of ['h', 'v']) { out.length = 0; L = lage;
          for (let i = 0; i < 4; i++) bkPaintLage(lage, P, 1, art, 4, i - 0.5, i + 0.5, false, { fam: 'bahn', supports: i ? [1, 2, 3] : [], foot: () => -6.3, ext: 0 });
          res[art][lage] = out.slice(); } }
      } finally { g = g0; }
      const bocks = l => l.filter(([, c, w, p]) => c === '#6f5238' && w === 2.2 && p[0][1] === -6.3).map(([, , , p]) => p[0][0]);
      const kreuz = l => l.filter(([, c, w, p]) => c === '#6f5238' && w === 0.6 && p[0][0] === p[1][0] && p[0][1] !== p[1][1] && Math.abs(p[0][1] + 4.3) < 1e-9).length;
      const posts = res.stahl.h.filter(([, , , p]) => Math.abs(p[0][0] - p[1][0]) < 1e-9 && Math.abs(p[0][1] - HILL_H) < 1e-9 && Math.abs(p[1][1] - HILL_H - 11) < 1e-9).length;
      return { bh: bocks(res.holz.h), bv: bocks(res.holz.v), kh: kreuz(res.holz.h), kv: kreuz(res.holz.v), posts }; })()`);
    expect(r.bh).toEqual([0.5, 1.5, 2.5]); expect(r.bv).toEqual([0.5, 1.5, 2.5]);
    expect(r.kh).toBe(6); expect(r.kv).toBe(0);
    expect(r.posts).toBe(2 * 4 - 1);
  });
});

// 160c C7: Brückenlicht – je Modell die Orte des Entwurfs (jede Lampe genau einmal je Seite, Kanten halboffen), hinten/vorn in der richtigen
// Lage, Schein warm/blau mit Radius; aus bzw. ohne Strom nachts grau ohne Schein (Kristall: Tagfarbe), tags Tagfarbe; nicht gekauft: nichts
describe('Brückenlicht (160c C7)', () => {
  const MODELLE = [['holz', 'fuss'], ['stahl', 'fuss'], ['stein', 'fuss'], ['kristall', 'fuss'], ['holz', 'bahn'], ['stein', 'bahn'], ['stahl', 'bahn'], ['kristall', 'bahn']];
  // je Modell, n, Achse: Lampen (Köpfe: circle/box, Scheine: glowQuad in GLOW_SINK, Streifen: Strichfarbe) mit Feld, Lage, Ort t, Seite
  const lampLog = (o = {}) => game(`(() => { const O = ${JSON.stringify({ licht: 'an', dark: false, nacht: 1, ...o })}, MOD = ${JSON.stringify(MODELLE)};
    const g0 = g, sp0 = SPRITE_PAINT, n0 = night, sink0 = GLOW_SINK, ci = circle, bx = box, out = [], bad = []; let cur = null, lage = '';
    const fake = new Proxy({}, { get: (t, k) => k === 'getTransform' ? () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) : k === 'stroke' ? () => { if (t.lineCap === 'round') bad.push(cur.join(' ') + ' round'); if (t.strokeStyle === C('#bfe9f8') || t.strokeStyle === C('#dff8ff')) out.push([...cur, 'strich', t.strokeStyle]); } : k in t ? t[k] : () => {},
      set: (t, k, v) => { if ((k === 'fillStyle' || k === 'strokeStyle') && !/^#[0-9a-f]{6}$/i.test(v) && !/^rgba/.test(v)) bad.push(cur.join(' ') + ' ' + k + '=' + v); if (k === 'globalAlpha' && v < 1) bad.push(cur.join(' ') + ' alpha'); t[k] = v; return true; } });
    circle = (x, y, r, f) => { out.push([...cur, 'kopf', +x.toFixed(4), Math.sign(y), f, +(r).toFixed(3)]); return ci(x, y, r, f); };
    box = (cx, cy, a, b, h, wall, roof, rh) => { out.push([...cur, 'laterne', +cx.toFixed(4), Math.sign(cy), C(wall), roof]); return bx(cx, cy, a, b, h, wall, roof, rh); };
    g = fake; SPRITE_PAINT = !!O.nacht; night = O.nacht ? NIGHT_MAX : 0; GLOW_SINK = [];
    try {
      for (const [art, fam] of MOD) for (const n of O.ns || [1, 2, 3, 4, 8]) for (const ax of [0, 1]) {
        const hf = brDeckHFn(fam, n), sup = brSupports({ mat: art, fam }, n), S = art === 'stein' ? brStoneGeom(fam, n, sup) : null;
        for (let i = 0; i < n; i++) for (const L of BK_LAGEN) {
          cur = [art + '-' + fam, n, ax, i, L]; const k0 = GLOW_SINK.length;
          const P = (t, s, h) => { if (!(t >= i - 0.5 - 0.013 && t <= i + 0.5 + 0.013)) bad.push(cur.join(' ') + ' t=' + t); return [t, (s > 0 ? 1000 : s < 0 ? -1000 : 0) - h]; };
          bkPaintLage(L, P, 1, art, n, i - 0.5, i + 0.5, false, { fam, ax, hf, stone: S, gl: () => 0, supports: i ? sup : [], ext: 0, licht: O.licht, dark: O.dark });
          for (const e of GLOW_SINK.slice(k0)) out.push([...cur, 'schein', +((e.q[0][0] + e.q[2][0]) / 2).toFixed(4), Math.sign((e.q[0][1] + e.q[2][1]) / 2), e.r, e.tint || 'warm']);
        } }
    } finally { g = g0; SPRITE_PAINT = sp0; night = n0; GLOW_SINK = sink0; circle = ci; box = bx; }
    return { out, bad: bad.slice(0, 8) }; })()`);
  const R = (n, K) => Array.from({ length: n * K + 1 }, (_, k) => +(-0.5 + k / K).toFixed(4));
  const ORTE = {
    'holz-fuss': n => R(n, 2), 'stahl-fuss': n => R(n, 2), 'holz-bahn': n => R(n, 2),
    'stein-fuss': n => n > 1 ? R(n, 1).slice(1, -1) : [0], 'stein-bahn': n => n > 1 ? R(n, 1).slice(1, -1) : [0],
    'stahl-bahn': n => Array.from({ length: 2 * n + 1 }, (_, k) => +(-0.35 + (n - 0.3) * k / (2 * n)).toFixed(4)),
    'kristall-fuss': n => Array.from({ length: 4 * n }, (_, j) => +(-0.5 + (j + 0.5) / 4).toFixed(4)), 'kristall-bahn': n => Array.from({ length: 4 * n }, (_, j) => +(-0.5 + (j + 0.5) / 4).toFixed(4)),
  };
  const LAGE = { 'kristall-fuss': ['h', 't2'], 'kristall-bahn': ['t1', 't2'] }, RAD = { 'stein-fuss': 18, 'stein-bahn': 18, 'stahl-bahn': 4, 'kristall-fuss': 7, 'kristall-bahn': 7 };
  it('nachts an: jede Lampe genau einmal je Seite am Ort des Entwurfs, hinten/vorn in ihrer Lage, Schein warm bzw. blau mit Radius', () => {
    const { out, bad } = lampLog();
    expect(bad).toEqual([]);
    for (const [art, fam] of MODELLE) for (const n of [1, 2, 3, 4, 8]) for (const ax of [0, 1]) {
      const id = art + '-' + fam, mine = out.filter(e => e[0] === id && e[1] === n && e[2] === ax), [hL, vL] = LAGE[id] || ['d', 'o'];
      for (const side of [-1, 1]) {
        const glows = mine.filter(e => e[5] === 'schein' && e[7] === side);
        const r3 = l => l.map(v => +v.toFixed(3));
        expect(r3(glows.map(e => e[6]).sort((a, b) => a - b)), id + ' n' + n + ' ax' + ax + ' Seite ' + side).toEqual(r3(ORTE[id](n)));
        expect([...new Set(glows.map(e => e[4]))], id + ' Lage').toEqual([side < 0 ? hL : vL]);
        expect([...new Set(glows.map(e => e[8] + ' ' + e[9]))]).toEqual([(RAD[id] || 5) + ' ' + (id.startsWith('kristall') ? 'blue' : 'warm')]);
        if (!id.startsWith('kristall')) expect(r3(mine.filter(e => (e[5] === 'kopf' || e[5] === 'laterne') && e[7] === side).map(e => e[6]).sort((a, b) => a - b))).toEqual(r3(ORTE[id](n)));
      }
    }
  });
  it('Köpfe: an gelb, aus und ohne Strom nachts grau, tags Tagfarbe; Kristall-Strich hell bzw. Tagfarbe; nie Schein ohne „an“; nicht gekauft: nichts', () => {
    const heads = (o, id) => { const r = lampLog({ ns: [3], ...o }); expect(r.bad).toEqual([]); return r.out.filter(e => e[0] === id); };
    const cols = (o, id) => [...new Set(heads(o, id).filter(e => e[5] !== 'schein').map(e => e[5] === 'strich' ? e[6] : e[8]))].sort();
    expect(cols({}, 'holz-fuss')).toEqual([game("C('#ffe58a')")]);
    expect(cols({ licht: 'aus' }, 'holz-fuss')).toEqual([game("C('#9a978c')")]);
    expect(cols({ dark: true }, 'stahl-bahn')).toEqual([game("C('#9a978c')")]);
    expect(cols({ nacht: 0 }, 'stahl-fuss')).toEqual([game("C('#eef3f2')")]);
    expect(cols({ nacht: 0 }, 'stein-fuss')).toEqual([game("C('#fff7d6')")]);
    expect(cols({}, 'kristall-fuss')).toEqual([game("C('#dff8ff')")]);
    expect(cols({ licht: 'aus' }, 'kristall-bahn')).toEqual([game("C('#bfe9f8')")]);
    for (const o of [{ licht: 'aus' }, { dark: true }, { nacht: 0 }]) expect(lampLog({ ns: [3], ...o }).out.filter(e => e[5] === 'schein')).toEqual([]);
    expect(lampLog({ ns: [3], licht: null }).out).toEqual([]);
  });
  it('Gehäuse der Steinlaterne in der Brückenfarbe (ohne Farbe #b8ad97)', () => {
    expect(game("brPal(BK_STEIN, 'stein', 'fuss', null, null).lamp")).toBe('#b8ad97');
    expect(game("brPal(BK_STEIN, 'stein', 'fuss', 3, null).lamp")).toBe(game("shade(BRIDGE_COLS[3], -0.15)"));
  });
  it('hinten nach dem Deck: der Schein kommt in d nach der Deckfläche (Fuß Holz, Viadukt nach dem Gleis)', () => {
    const seq = (art, fam, rail) => game(`(() => { const out = [], g0 = g, sp0 = SPRITE_PAINT, n0 = night, gq = glowQuad;
      g = new Proxy({}, { get: (t, k) => k === 'fill' ? () => out.push('fill ' + t.fillStyle) : k === 'getTransform' ? () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) : k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
      glowQuad = () => out.push('glow'); SPRITE_PAINT = true; night = NIGHT_MAX;
      try { const n = 3, hf = brDeckHFn('${fam}', n); bkPaintLage('d', (t, s, h) => [t, s - h], 1, '${art}', n, 0.5, 1.5, false, { fam: '${fam}', hf, stone: '${art}' === 'stein' ? brStoneGeom('${fam}', n, brSupports({ mat: '${art}', fam: '${fam}' }, n)) : null, licht: 'an', railPaint: ${rail ? "() => out.push('gleis')" : 'null'} }); }
      finally { g = g0; SPRITE_PAINT = sp0; night = n0; glowQuad = gq; } return out; })()`);
    const a = seq('holz', 'fuss', false);
    expect(a.indexOf('fill ' + game("C(BK_FUSS.holz.deck)"))).toBeGreaterThanOrEqual(0);
    expect(a.lastIndexOf('fill ' + game("C(BK_FUSS.holz.deck)"))).toBeLessThan(a.indexOf('glow'));
    const v = seq('stein', 'bahn', true);
    expect(v.indexOf('gleis')).toBeGreaterThanOrEqual(0); expect(v.indexOf('gleis')).toBeLessThan(v.indexOf('glow'));
  });
});
