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
  it('Rahmen: jede Gruppe bleibt in brBox (Holz/Stahl, n 1–4, Weg/Gleis/leer, beide Achsen, z 0,5/1/2,5)', () => {
    setup();
    const bad = game(`(() => {
      const g0 = g, bad = [], st = []; let box = null, lw = 1, cur = '', clipped = 0;   // was nach clip() kommt, ist beschnitten (Muster im Weg)
      const chk = (x, y) => { if (clipped) return; const [l, u, r, d] = box, e = lw / 2 + 0.01; if (x < -l - e || x > r + e || y < -u - e || y > d + e) bad.push(cur + ' ' + x.toFixed(1) + ',' + y.toFixed(1)); };
      const fake = new Proxy({}, { get: (o, k) => k === 'moveTo' || k === 'lineTo' ? (x, y) => chk(x, y) : k === 'arc' ? (x, y, r) => { chk(x - r, y - r); chk(x + r, y + r); } : k === 'save' ? () => st.push(clipped) : k === 'restore' ? () => { clipped = st.pop() || 0; } : k === 'clip' ? () => { clipped = 1; } : k in o ? o[k] : () => {},
        set: (o, k, v) => { o[k] = v; if (k === 'lineWidth') lw = v; return true; } });
      try {
        for (const art of ['holz', 'stahl']) for (let n = 1; n <= 4; n++) for (const top of ['', 'weg', 'gleis']) for (const ax of [0, 1]) {
          state.bruecken.clear();
          const b = { ax, n, art }; if (top === 'weg') b.weg = Array(n).fill('platten'); if (top === 'gleis') b.gleis = Array(n).fill(0);
          state.bruecken.set(ax ? '12,8' : '14,12', b); groundVersion++;
          for (let i = 0; i < n; i++) for (const z of [0.5, 1, 2.5]) for (const gr of Object.keys(BK_GRUPPEN)) {
            const x = ax ? 12 : 14 + i, y = ax ? 8 + i : 12;
            cur = art + ' n' + n + ' ' + top + ' ax' + ax + ' i' + i + ' z' + z + ' ' + gr; box = brBox(gr, bkAt(x, y)).map(v => v * z);
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

const WAECHTER = 2528765785;   // vor dem Umbau gemessen (160c C3b)
// 160c C3b: Wächter – der Umbau für Stein (gemeinsame Helfer bkKit) zeichnet Holz, Metall und Bahn genau wie vorher
describe('Wächter: Holz/Metall/Bahn aufrufgleich (160c C3b)', () => {
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
        for (const art of ['holz', 'stahl']) for (const top of ['', 'weg', 'gleis']) for (const n of [1, 2, 3, 4, 8]) for (const ax of [0, 1]) {
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
