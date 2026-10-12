'use strict';
// ---------------------------------------------------------------------------
// Brückenbild (160c B1): der Maler der Anhöhen-Brücken in Lagen (PLAN-160c.md §2.2 G2). Ein Feld zeichnet seine Lagen nacheinander:
// 'h' hinten (L1) · 'v' vorn unten (L3) · 'd' Deck mit Weg/Gleis (L4) · [Bewegtes darauf] · 'o' vorn oben (L6).
// Alles deckend (G5): halbdurchsichtige Striche sind fertige Mischfarben – so kann eine Lage später nachgemalt werden, ohne dunkler zu werden.
// ---------------------------------------------------------------------------
const BK_LOOK = {
  holz: { deck: '#c99a68', beam: '#8a5f38', rail: '#a9774a', dark: '#6d4a2c', line: mix('#c99a68', '#5a3c1e', 0.5) },   // Fuge: früher rgba(90,60,30,.5) auf dem Deck
  stahl: { deck: '#cfd3cf', beam: '#5d7d7a', rail: '#7fa09c', dark: '#3e5452', line: mix('#cfd3cf', '#505a5a', 0.25) },  // früher rgba(80,90,90,.25)
};
const BK_LAGEN = ['h', 'v', 'd', 'o'];
// Gruppen fürs Zeichnen (160c B2): ruhend in tileA h | (Deko unter dem Deck) | vd | o; nachgemalt je nach Bewegtem
const BK_GRUPPEN = { h: ['h'], vd: ['v', 'd'], o: ['o'] };
// Rahmen einer Gruppe um die Feldmitte unten, in Welteinheiten (× z): [links, oben, rechts, unten] – für Bildchen, glLive und Nachmal-Clip
function brBox(gruppe) {
  const u = gruppe === 'vd' ? TH / 2 + HILL_H + 8 : TH / 2 + HILL_H + 16;
  return [TW / 2 + 6, u, TW / 2 + 6, TH / 2 + 6];
}
// Eine Lage eines Brückenstücks: P(t, s, h) bildet längs t (Felder ab der Mitte des ersten Lückenfelds), quer s und Höhe h auf den Schirm ab;
// gezeichnet wird nur t in [t0, t1] (ein Feld), damit Dinge davor und dahinter richtig darüber bzw. darunter liegen
function bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts = {}) {
  const L = BK_LOOK[art] || BK_LOOK.holz, H = opts.h != null ? opts.h : HILL_H, A = -0.5, B = n - 0.5, W = BK_W, lw = f => Math.max(0.6, f * z);
  const T1 = t1 + (opts.ext || 0);                                         // Flächen etwas ins nächste Feld (das deckt es zu): keine Fuge (Windows)
  const clip = (ta, tb) => [Math.max(ta, t0), Math.min(tb, T1)];
  const quad = (ta, tb, s0, s1, h0, h1, col) => { const [a, b] = clip(ta, tb); if (b <= a) return; poly([P(a, s0, h0), P(b, s1, h0), P(b, s1, h1), P(a, s0, h1)], C(col)); };
  const top = (ta, tb, h, col) => { const [a, b] = clip(ta, tb); if (b <= a) return; poly([P(a, -W, h), P(b, -W, h), P(b, W, h), P(a, W, h)], C(col)); };
  const seg = (ta, sa, ha, tb, sb, hb, col, w) => {                     // Strich, längs auf [t0, t1] beschnitten
    let p = 0, q = 1;
    if (tb !== ta) { const u0 = (t0 - ta) / (tb - ta), u1 = (t1 - ta) / (tb - ta); p = Math.max(0, Math.min(u0, u1)); q = Math.min(1, Math.max(u0, u1)); }
    else if (ta < t0 || ta > t1) return;
    if (q <= p) return;
    const at = u => P(ta + (tb - ta) * u, sa + (sb - sa) * u, ha + (hb - ha) * u), a = at(p), b = at(q);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = C(col); g.lineWidth = lw(w); g.lineCap = 'round'; g.stroke();
  };
  const sideTruss = (s, col, w) => {                                       // Fachwerk (Stahl): Gurte, Pfosten, Streben über die ganze Brücke
    const T = 11, a = A + 0.15, b = B - 0.15, m = Math.max(2, Math.round((b - a) * 2));
    seg(A, s, H, B, s, H, col, w * 1.4); seg(a, s, H + T, b, s, H + T, col, w * 1.4);
    seg(A, s, H, a, s, H + T, col, w); seg(B, s, H, b, s, H + T, col, w);
    for (let j = 0; j < m; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; seg(p, s, H + T, q, s, H, col, w); if (j) seg(p, s, H, p, s, H + T, col, w * 0.8); }
  };
  const rail = (s, col, w) => {                                            // Geländer (Holz): Pfosten je halbes Feld, Handlauf und Mittelholm
    for (let j = 0; j <= 2 * n; j++) { const t = A + j / 2; seg(t, s, H, t, s, H + 8, L.dark, w); }
    seg(A, s, H + 8, B, s, H + 8, col, w * 1.3); seg(A, s, H + 4, B, s, H + 4, col, w * 0.8);
  };
  const bocks = art !== 'holz' ? [] : opts.rail && n >= 2 ? Array.from({ length: n }, (_, i) => i) : n > BK_ARTEN.holz.frei ? [A + 0.55, B - 0.55] : [];
  if (lage === 'h') {
    for (const t of bocks) seg(t, -W + 0.06, 0, t, -W + 0.06, H - 3, L.dark, 2.2);   // Holzböcke: hinteres Bein
    if (art === 'stahl') sideTruss(-W - 0.02, L.dark, 1.1); else rail(-W, L.dark, 1.2);
  } else if (lage === 'v') {
    for (const t of bocks) {                                               // vorderes Bein und Kreuz (mit Gleis unter jedem Feld)
      seg(t, W - 0.06, 0, t, W - 0.06, H - 3, L.dark, 2.2);
      seg(t, -W + 0.06, 2, t, W - 0.06, H - 5, L.dark, 1.1); seg(t, W - 0.06, 2, t, -W + 0.06, H - 5, L.dark, 1.1);
    }
    quad(A, B, W, W, H - (art === 'holz' ? 3 : 4), H, L.beam);            // Längsträger vorn
  } else if (lage === 'd') {
    top(A, B, H, L.deck);
    const a0 = Math.max(A, t0), b0 = Math.min(B, t1), k = art === 'holz' ? 9 : 6;
    if (b0 > a0) for (let j = 0, N = Math.ceil((B - A) * k); j <= N; j++) { const t = A + j / k; if (t >= a0 && t <= b0) seg(t, -W, H, t, W, H, L.line, 0.6); }
    if (weg && opts.wegPaint) opts.wegPaint(H);
    if (opts.railPaint) opts.railPaint(H);                                 // Gleis auf dem Deck (160b)
  } else if (lage === 'o') {
    if (art === 'stahl') sideTruss(W + 0.02, L.rail, 1.5); else rail(W, L.rail, 1.4);
  }
}
// Das ganze Stück: alle Lagen, dazwischen Bewegtes auf dem Deck (opts.after: Leute, Züge oben – vor dem vorderen Geländer)
function bkPaint(P, z, art, n, t0, t1, weg, opts = {}) {
  for (const lage of ['h', 'v', 'd']) bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts);
  if (opts.after) opts.after(opts.h != null ? opts.h : HILL_H);
  bkPaintLage('o', P, z, art, n, t0, t1, weg, opts);
}
