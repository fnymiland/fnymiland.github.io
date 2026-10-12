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
      bkPaintLage(lage, P, 2, art, n, i - 0.5, i + 0.5, false, { rail, ext: i < n - 1 ? 0.012 : 0 });
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
