'use strict';
// ---------------------------------------------------------------------------
// Brückenbild (160c B1): der Maler der Anhöhen-Brücken in Lagen (PLAN-160c.md §2.2 G2). Ein Feld zeichnet seine Lagen nacheinander:
// 'h' hinten (L1) · 'v' vorn unten (L3) · 'd' Deck mit Weg/Gleis (L4) · [Bewegtes darauf] · 'o' vorn oben (L6).
// Alles deckend (G5): halbdurchsichtige Striche sind fertige Mischfarben – so kann eine Lage später nachgemalt werden, ohne dunkler zu werden.
// ---------------------------------------------------------------------------
const BK_LAGEN = ['h', 'v', 'd', 'o', 'hg', 't1', 't2'];                    // hg/t1/t2: Glas (Kristall, 160c C4) – halbdurchsichtig, genau einmal je Bild
// Gruppen fürs Zeichnen (160c B2): ruhend in tileA h | (Deko unter dem Deck) | vd | o; nachgemalt je nach Bewegtem
const BK_GRUPPEN = { h: ['h'], vd: ['v', 'd'], o: ['o'], hg: ['hg'], t1: ['t1'], t2: ['t2'], w: ['h', 'v', 'd', 'o'] };   // hg ruhend in tileA (nie nachgemalt), t1/t2 jedes Bild in tileB; w: alles in einem (ruhende Wasserbrücke, 160c D1)
// Rahmen einer Gruppe um die Feldmitte unten, in Welteinheiten (× z): [links, oben, rechts, unten] – für Bildchen, glLive und Nachmal-Clip
function brBox(gruppe, c = null) {                                         // c: Feld (bkAt) – oben bis zum Scheitel im Feld (Bogen, 160c C2)
  const hm = c ? (c.water ? c.hm : bkHMax(c)) : HILL_H;                  // Wasser-Wegbrücke (160c D1): eigene Höhe
  let top = gruppe === 'vd' || gruppe === 't1' ? 8 : 16;
  if ((gruppe === 'vd' || gruppe === 'w') && c && c.G && c.G.look.licht) {   // Licht (C7): hintere Lampe an der Feldkante, oben bei −s – Kopf + 1 Reserve
    const S = brLampSpots(c.G.art, c.G.fam, c.b.n);
    if (S.back === 'd') top = Math.max(top, S.up + { punkt: 0.85, laterne: 7.2, streifen: 1.4 }[S.form] + (0.5 + S.s) * TH / 2 - TH / 2 + 1);
  }
  return [TW / 2 + 6, TH / 2 + hm + top, TW / 2 + 6, TH / 2 + 6];
}
// Eine Lage eines Brückenstücks: P(t, s, h) bildet längs t (Felder ab der Mitte des ersten Lückenfelds), quer s und Höhe h auf den Schirm ab;
// gezeichnet wird nur t in [t0, t1] (ein Feld), damit Dinge davor und dahinter richtig darüber bzw. darunter liegen
function bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts = {}) {
  const stein = art === 'stein' && (opts.fam === 'fuss' || opts.fam === 'bahn'), fuss = !stein && opts.fam === 'fuss' && !!BK_FUSS[art];
  if (stein) bkPaintStein(lage, P, z, n, t0, t1, weg, opts);               // Stein mit Pfeilern (160c C3), Viadukt (C5d)
  else if (fuss) bkPaintFuss(lage, P, z, art, n, t0, t1, weg, opts);       // Fußgänger: Bogen (160c C2)
  else bkPaintBahn(lage, P, z, BK_BAHN[art] ? art : 'holz', n, t0, t1, weg, opts);   // Bahn: flach (160c C5); auch Rückfall ohne Familie
  if (opts.licht) bkLamps(lage, P, z, stein ? 'stein' : fuss ? art : BK_BAHN[art] ? art : 'holz', stein ? opts.fam : fuss ? 'fuss' : 'bahn', n, t0, t1, opts);   // Licht (C7): zuletzt in seiner Lage
}
// ---------------------------------------------------------------------------
// Brückenlicht (160c C7, plan-160c/karte-C7-bau.md; Orte und Formen aus brLampSpots). Hinten am Ende von 'd' (nach dem Deck: Figuren und
// Wagen darauf verdecken die Lampe, ihr Schein trifft das Deck), vorn am Ende von 'o'; Kristall: Streifen hinten in 'h' (das Deck deckt den
// unteren Schein, wie im Entwurf) bzw. B2 in t1, vorn in t2 (Blau hat keine Scheibe – nie nachmalen). Zustand erst zur Malzeit
// (Nachtbild, Vorwärmen): an = gelb mit Schein; aus bzw. ohne Strom nachts grau (Kristall: Tagfarbe), tags Tagfarbe. Nur Hex (G5)
// ---------------------------------------------------------------------------
function bkLamps(lage, P, z, art, fam, n, t0, t1, opts) {
  const S = brLampSpots(art, fam, n, opts.lampMax);
  if (lage !== S.back && lage !== S.front) return;
  const s = (lage === S.back ? -1 : 1) * S.s, H = opts.h != null ? opts.h : HILL_H, hOf = fam === 'bahn' && art !== 'stein' ? () => H : opts.hf || (() => H);
  const nt = night > 0.15 && isLive(), on = opts.licht === 'an' && !opts.dark, lit = nt && on, grau = nt && !on;
  if (S.form === 'streifen') {
    const K = bkKit(P, z, n, t0, t1, { ...opts, hf: hOf });
    K.line(s, t => hOf(t) + 0.5, lit ? '#dff8ff' : '#bfe9f8', 0.45);       // erst der Strich, dann der Schein (Bildchen = live)
    if (on) for (let j = Math.round((t0 + 0.5) * 4); -0.5 + j / 4 < t1 - 1e-9; j++) {
      const u0 = -0.5 + j / 4, u1 = u0 + 0.25;
      glowQuad([P(u0, s, hOf(u0)), P(u1, s, hOf(u1)), P(u1, s, hOf(u1) + 1.4), P(u0, s, hOf(u0) + 1.4)], S.r * z, 'blue');
    }
    return;
  }
  const last = t1 >= n - 0.5 - 1e-9, frame = S.form === 'laterne' ? brPal(BK_STEIN, 'stein', fam, opts.col, null).lamp : null;
  for (const t of S.ts) {
    if (!(t >= t0 - 1e-9 && (t < t1 - 1e-9 || (last && t <= t1 + 1e-9)))) continue;   // halboffen (G3): die Kante gehört dem späteren Feld
    const p = P(t, s, hOf(t) + S.up);
    if (S.form === 'punkt') {
      circle(p[0], p[1], 0.85 * z, C(lit ? '#ffe58a' : grau ? '#9a978c' : S.day));
      const d = 0.8 * z;
      if (on) glowQuad([[p[0] - d, p[1] - d], [p[0] + d, p[1] - d], [p[0] + d, p[1] + d], [p[0] - d, p[1] + d]], S.r * z);
      continue;
    }
    const zl = 0.6 * z;                                                      // Minilaterne: Kopf der Gaslaterne × 0,6 auf kurzem Stummel
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 4 * zl); g.strokeStyle = C(frame); g.lineWidth = Math.max(0.6, 1.8 * zl); g.lineCap = 'butt'; g.stroke();
    const lb = box(p[0], p[1] - 4 * zl, 2.6 * zl, 1.4 * zl, 5 * zl, lit ? '#ffe58a' : grau ? '#9a978c' : '#fff7d6', frame, 3 * zl);
    if (on) glowQuad([lb.L, lb.R, [lb.R[0], lb.R[1] - 5 * zl], [lb.L[0], lb.L[1] - 5 * zl]], S.r * z);
  }
}
// Gruppen eines Felds mit Lampen (Bildchen-Schlüssel |lit, Vorwärmen): nur mit gekauftem Licht (an und aus: nachts gelb bzw. grau)
const BK_LAGE_GR = { h: 'h', d: 'vd', o: 'o', t1: 't1', t2: 't2' };
const bkLampGroups = c => !c || !c.G || !c.G.look.licht ? [] : (S => [BK_LAGE_GR[S.back], BK_LAGE_GR[S.front]])(brLampSpots(c.G.art, c.G.fam, c.b.n));
// ---------------------------------------------------------------------------
// Bahn-Brücke zwischen Anhöhen (160c C5, plan-160c/karte-C5-bahn.md; abgenommen: tools/brueckenfamilie-entwurf.js 'B-holz', 'B-metall',
// 'B-kristall'): flach auf HILL_H, Gleis auf dem Deck. Holz: Böcke auf jeder Kante (Kreuz hinten), Geländer; Metall und Kristall (B2):
// Fachwerk mit 2n Feldern, spannt frei. Strichbreiten = Entwurf ÷ 2, 'butt', Kanten halboffen, deckend (G5)
// ---------------------------------------------------------------------------
const BK_BAHN = {
  holz: { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', beam: '#8a5f38', rail: '#a9774a' },
  stahl: { back: '#3e5452', front: '#7fa09c', deck: '#cfd3cf', beam: '#5d7d7a', edge: '#3e5452' },
  kristall: { back: '#7fc4e8', front: '#8fd3f2', deck: '#d7eef7', beam: '#bfe6f7', edge: '#5aa9d6', hi: '#f7fdff' },
};
function bkPaintBahn(lage, P, z, art, n, t0, t1, weg, opts) {
  const L = brPal(BK_BAHN[art], art, 'bahn', opts.col, opts.plank), H = opts.h != null ? opts.h : HILL_H, A = -0.5, B = n - 0.5, W = BK_W, T1 = t1 + (opts.ext || 0), last = t1 >= B - 1e-9;
  const lw = f => Math.max(0.6, f * z), sh = col => opts.ax ? shade(col, LIGHT.side) : col;
  const seg = (ta, sa, ha, tb, sb, hb, col, w) => {                       // Strich, längs auf [t0, t1] beschnitten; senkrecht (ta = tb) halboffen
    let p = 0, q = 1;
    if (tb !== ta) { const u0 = (t0 - ta) / (tb - ta), u1 = (t1 - ta) / (tb - ta); p = Math.max(0, Math.min(u0, u1)); q = Math.min(1, Math.max(u0, u1)); }
    else if (ta < t0 - 1e-9 || (ta >= t1 - 1e-9 && !(last && ta <= t1 + 1e-9))) return;
    if (q <= p || (tb !== ta && (q - p) * Math.abs(tb - ta) < 1e-7)) return;   // kein Reststück an der Feldkante
    const at = u => P(ta + (tb - ta) * u, sa + (sb - sa) * u, ha + (hb - ha) * u), a = at(p), b = at(q);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = C(col); g.lineWidth = lw(w); g.lineCap = 'butt'; g.stroke();
  };
  const line = (s, h, col, w, ta = A, tb = B) => seg(ta, s, h, tb, s, h, col, w);
  const band = (s, h0, h1, col) => { const a = Math.max(A, t0), b = Math.min(B, T1); if (b > a) poly([P(a, s, h1), P(b, s, h1), P(b, s, h0), P(a, s, h0)], C(col)); };
  const deckTop = col => { const a = Math.max(A, t0), b = Math.min(B, T1); if (b > a) poly([P(a, -W, H), P(b, -W, H), P(b, W, H), P(a, W, H)], C(col)); };
  const onEdge = (K, fn) => { for (let k = Math.ceil((t0 - A) * K - 1e-9); A + k / K < t1 - 1e-9 || (last && A + k / K <= t1 + 1e-9); k++) fn(A + k / K, k); };
  const vert = (t, s, h0, h1, col, w) => seg(t, s, h0, t, s, h1, col, w);
  const sup = (opts.supports || []).map(k => k - 0.5).filter(t => t >= t0 - 1e-9 && t < t1 - 1e-9);   // Böcke auf den Kanten (C1): das spätere Feld
  const ft = t => opts.foot ? opts.foot(Math.round(t + 0.5)) : 0;          // Fuß: Boden 0, Wasser −6,3
  const truss = (s, col, w) => {                                           // Fachwerk: Gurte, Enddiagonalen, Diagonalen und Pfosten (m = 2n)
    const T = BR_TRUSS.T, a = A + BR_TRUSS.inset, b = B - BR_TRUSS.inset, m = 2 * n;
    line(s, H, col, 0.7 * w); line(s, H + T, col, 0.7 * w, a, b);
    seg(A, s, H, a, s, H + T, col, 0.5 * w); seg(B, s, H, b, s, H + T, col, 0.5 * w);
    const j0 = Math.max(0, Math.floor((t0 - a) / (b - a) * m) - 1), j1 = Math.min(m - 1, Math.ceil((t1 - a) / (b - a) * m) + 1);   // nur, was dieses Feld trifft
    for (let j = j0; j <= j1; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; seg(p, s, H + T, q, s, H, col, 0.5 * w); if (j) vert(p, s, H, H + T, col, 0.4 * w); }
  };
  if (art === 'holz') {
    if (lage === 'h') {
      for (const t of sup) vert(t, -W + 0.06, ft(t), H - 3, L.side, 2.2);   // Bock hinten
      onEdge(2, t => vert(t, -W, H, H + 8, L.side, 0.6));                     // hinteres Geländer
      line(-W, H + 8, L.side, 0.7);
      for (const t of sup) { seg(t, -W + 0.06, ft(t) + 2, t, W - 0.06, H - 5, L.side, 0.55); seg(t, W - 0.06, ft(t) + 2, t, -W + 0.06, H - 5, L.side, 0.55); }   // Kreuz
    } else if (lage === 'v') {
      for (const t of sup) vert(t, W - 0.06, ft(t), H - 3, L.side, 2.2);     // Bock vorn
      band(W, H - 3, H, sh(L.beam));                                       // Längsträger
    } else if (lage === 'd') {
      deckTop(L.deck);
      if (!weg) onEdge(9, t => seg(t, -W, H, t, W, H, L.plank, 0.3));
    } else if (lage === 'o') {
      onEdge(2, t => vert(t, W, H, H + 8, L.rail, 0.7));                     // vorderes Geländer
      line(W, H + 8, L.rail, 0.9); line(W, H + 4, L.rail, 0.5);
    }
  } else {                                                                   // Metall, Kristall B2: Fachwerk
    if (lage === 'h') truss(-W - 0.02, L.back, 1.2);
    else if (lage === 'v') { band(W, H - 4, H, sh(L.beam)); line(W, H, L.edge, 0.3); line(W, H - 4, L.edge, 0.3); }
    else if (lage === 'd') deckTop(L.deck);
    else if (lage === 'o') { truss(W + 0.02, L.front, 1.6); if (L.hi) line(W + 0.02, H + 11, L.hi, 0.35, A + 0.15, B - 0.15); }
  }
  if (lage === 'd') {
    if (weg && opts.wegPaint) opts.wegPaint(H);                            // Altdaten mit Weg und Gleis: beides (G9)
    if (opts.railPaint) opts.railPaint(H);                                 // Gleis auf dem Deck (160b)
  }
}
// Das ganze Stück: alle Lagen, dazwischen Bewegtes auf dem Deck (opts.after: Leute, Züge oben – vor dem vorderen Geländer)
function bkPaint(P, z, art, n, t0, t1, weg, opts = {}) {
  const glas = art === 'kristall' && opts.fam === 'fuss', tb = glas || (art === 'kristall' && opts.fam === 'bahn' && !!opts.licht);   // Kristall (160c C4): Glas hinten zuerst, Glasband vor dem Bewegten oben, vorderes Glas zuletzt; B2-Licht in t1/t2 (C7)
  for (const lage of [...(glas ? ['hg'] : []), 'h', 'v', 'd', ...(tb ? ['t1'] : [])]) bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts);
  if (opts.after) opts.after(opts.h != null ? opts.h : HILL_H);
  for (const lage of tb ? ['o', 't2'] : ['o']) bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts);
}

// ---------------------------------------------------------------------------
// Zeichenort (160c B2, plan-160c/B2.md): das Ruhende liegt in tileA – Deko HINTER, h, [Bahnübergang], Deko UNTER, vd + o, Deko VOR.
// tileB malt nur nach, was Bewegtes des Felds zudeckt: im Rahmen des Bewegten, deckend, ohne zweiten Schein (GLOW_MUTE), blass nie.
// ---------------------------------------------------------------------------
function bkBoxOf(gruppen, c = null) {
  const B = gruppen.map(gr => brBox(gr, c));
  return [0, 1, 2, 3].map(j => Math.max(...B.map(b => b[j])));
}
// Ruhend (tileA): eine Zelle je Gruppe; under: was zwischen h und Deko UNTER liegt (Bahnübergang – eigene Zelle, nie verschachtelt)
function bkDrawStill(x, y, px, py, z, now, c, under) {
  const k = x + ',' + y, G = state.decos.has(k) ? bkDecoGroups(x, y, c) : null;
  if (c.water && !under && !G) bkGroup(x, y, px, py, z, ['w'], c);         // Wasserbrücke (160c D1): nichts zwischen den Lagen – ein Bildchen statt drei (nachgemalt wird je Lage)
  else {
  if (G && G.back.length) drawSmall(k, px, py, z, now, x, y, G.back);
  if (bkGlasAt(c)) bkGroup(x, y, px, py, z, ['hg'], c);                   // Kristall: hintere Glasscheibe (eigener Aufruf: vor den Pfosten, auch wenn ein Bildchen fehlt)
  bkGroup(x, y, px, py, z, ['h'], c);
  if (under) under();
  if (G && G.under.length) drawSmall(k, px, py, z, now, x, y, G.under);
  bkGroup(x, y, px, py, z, ['vd', 'o'], c);
  if (G && G.front.length) drawSmall(k, px, py, z, now, x, y, G.front);
  }
  if (c.water) wbRelight(x, y, px, py, z, c);                              // Nachtlicht früherer Felder wieder aufs Deck
  const marks = DECK_MARKS && DECK_MARKS.get(k);                           // Plan-Rauten auf dem Deck (planPreview): über dem Deck
  if (marks) for (const f of marks) { g.save(); g.lineJoin = 'round'; try { f(); } finally { g.restore(); } }
}
// Nachtlicht früherer Felder auf einer Wasserbrücke (160c D1, Gegenlesen D1b): ihr Schein ist vor der Brücke gestanzt, das Deck deckte das
// Loch wieder zu (vorher lag die flache Brücke im Boden-Durchgang, also unter allen Lichtern). Live in 2D auf dem Deck noch einmal stanzen –
// nur Oberseite und vorderes Randband (deckend; über Geländer oder Öffnungen wäre es doppelt), nur der Schein (halo: die Scheibe einer
// Lampe dahinter bleibt verdeckt), nur Lichter von vor dem Feld (WB_GLOW0, render.js tileA). Wie hillRelight; im GL-Bild/Nachtbild nicht
const WB_GLOW0 = new Map();                                                // Feld → glows.length vor seinem tileA (je Bild neu)
let WB_RELIGHT = null;                                                     // Feld, dessen Deck gerade neu gestanzt wird (Tests)
function wbRelight(x, y, px, py, z, c) {
  const n0 = WB_GLOW0.get(c.k);
  if (!n0 || GLPASS || SPRITE_PAINT || !(night > 0.15) || !isLive()) return;
  if (c.rail) return gbRelight(x, y, px, py, z, c, n0);
  const ax = c.ax, lat = s => isWegBridge(state.tiles.get((x + (ax ? s : 0)) + ',' + (y + (ax ? 0 : s))));
  const sB = lat(-1) ? -0.5 : -c.W, sF = lat(1) ? 0.5 : c.W, AS = c.A ? [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5] : [-0.5, -0.2, 0.2, 0.5];
  const P = (a, s, h) => { const [u, v] = ax ? [s, a] : [a, s]; return [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - h * z]; };
  const bh = { holz: 2, stahl: 2.6, stein: 2.5, kristall: 0 }[c.G.mat];   // deckendes Randband vorn (Kristall: Glas, nie doppelt)
  const top = AS.map(a => P(a, sB, wegDeckH(c, a))), front = AS.map(a => P(a, sF, wegDeckH(c, a))), band = AS.map(a => P(a, sF, wegDeckH(c, a) - bh));
  const m = g.getTransform(), k = 1 / DPR, S = ([X, Y]) => [(m.a * X + m.c * Y + m.e) * k, (m.b * X + m.d * Y + m.f) * k], pts = [...top, ...band].map(S);   // Lichter liegen in Bildschirmpunkten
  const X0 = Math.min(...pts.map(p => p[0])), X1 = Math.max(...pts.map(p => p[0])), Y0 = Math.min(...pts.map(p => p[1])), Y1 = Math.max(...pts.map(p => p[1]));
  const hits = [];
  for (let i = 0; i < n0 && i < glows.length; i++) {
    const L = glows[i], gx = (L.q[0][0] + L.q[2][0]) / 2, gy = (L.q[0][1] + L.q[2][1]) / 2;
    if (gx + L.r > X0 && gx - L.r < X1 && gy + L.r > Y0 && gy - L.r < Y1) hits.push(L);
  }
  if (!hits.length) return;
  const n1 = glows.length, gc = glowCells, gm = GLOW_MUTE;
  g.save(); WB_RELIGHT = c.k; glowCells = new Map(); GLOW_MUTE = false;
  try {
    g.beginPath();
    for (const ring of [[...top, ...front.slice().reverse()], [...front, ...band.slice().reverse()]]) { ring.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); }
    g.clip();
    for (const L of hits) punchGlow(L.q, L.r, L.tint, 'halo');
  } finally { g.restore(); WB_RELIGHT = null; glowCells = gc; GLOW_MUTE = gm; glows.length = n1; }   // kein Doppel in der Lichterliste
}
// Gleisbrücke übers Wasser (160c E1e): wie wbRelight, nur die Deckfläche (roadShapes 0,3, Höhe 0) – Pfähle und Geländer bleiben im Schein
// früherer Lichter dunkel (karte-E1 §6 Nr. 13). Lichter über ein Raster ihrer Mitten (glowsIn): sonst Felder × Lichter (bauland nachts, §6 Nr. 14)
function gbRelight(x, y, px, py, z, c, n0) {
  const sh = roadShapes(railArms(x, y), state.tiles.get(c.k), 0.3), L = ([u, v]) => [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
  const m = g.getTransform(), k = 1 / DPR, S = ([X, Y]) => [(m.a * X + m.c * Y + m.e) * k, (m.b * X + m.d * Y + m.f) * k], pts = sh.flat().map(q => S(L(q)));
  if (!pts.length) return;
  const X0 = Math.min(...pts.map(p => p[0])), X1 = Math.max(...pts.map(p => p[0])), Y0 = Math.min(...pts.map(p => p[1])), Y1 = Math.max(...pts.map(p => p[1]));
  const hits = glowsIn(X0, Y0, X1, Y1, n0);
  if (!hits.length) return;
  const n1 = glows.length, gc = glowCells, gm = GLOW_MUTE;
  g.save(); WB_RELIGHT = c.k; glowCells = new Map(); GLOW_MUTE = false;
  try {
    g.beginPath();
    for (const ring of sh) { ring.forEach((q, i) => { const p = L(q); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); }
    g.clip();
    for (const Lg of hits) punchGlow(Lg.q, Lg.r, Lg.tint, 'halo');
  } finally { g.restore(); WB_RELIGHT = null; glowCells = gc; GLOW_MUTE = gm; glows.length = n1; }   // kein Doppel in der Lichterliste
}
// Lichter (glows) der ersten n0, deren Schein den Rahmen [X0, X1] × [Y0, Y1] (Bildschirmpunkte) trifft – über ein Raster der Lichtmitten (64 px),
// je Bild neu und nur nachgeführt (glows wächst; was Bildchen und Neu-Stanzen kurz dazulegen, nehmen sie wieder weg)
const GLOW_GRID = { frame: -1, n: 0, cells: new Map() };
function glowsIn(X0, Y0, X1, Y1, n0) {
  const G = GLOW_GRID, C = 64;
  if (G.frame !== frameNo || G.n > glows.length) { G.frame = frameNo; G.n = 0; G.cells.clear(); }
  for (; G.n < glows.length; G.n++) {
    const L = glows[G.n], gx = (L.q[0][0] + L.q[2][0]) / 2, gy = (L.q[0][1] + L.q[2][1]) / 2;
    for (let cy = Math.floor((gy - L.r) / C); cy <= Math.floor((gy + L.r) / C); cy++) for (let cx = Math.floor((gx - L.r) / C); cx <= Math.floor((gx + L.r) / C); cx++) {
      const key = cx * 65536 + cy; let a = G.cells.get(key); if (!a) G.cells.set(key, a = []); a.push(G.n);
    }
  }
  const seen = new Set(), out = [];
  for (let cy = Math.floor(Y0 / C); cy <= Math.floor(Y1 / C); cy++) for (let cx = Math.floor(X0 / C); cx <= Math.floor(X1 / C); cx++) {
    for (const i of G.cells.get(cx * 65536 + cy) || []) {
      if (i >= n0 || seen.has(i)) continue;
      seen.add(i);
      const L = glows[i], gx = (L.q[0][0] + L.q[2][0]) / 2, gy = (L.q[0][1] + L.q[2][1]) / 2;
      if (gx + L.r > X0 && gx - L.r < X1 && gy + L.r > Y0 && gy - L.r < Y1) out.push([i, L]);
    }
  }
  return out.sort((a, b) => a[0] - b[0]).map(p => p[1]);                   // in der Reihenfolge der Liste (wie vorher)
}
// Geist einer Brücke, die eine Weg-/Gleislinie mitbaut (160c C9): alle Felder der gedachten Brücke (bkPlanNew) in Feldfolge auf EINE
// Zwischenleinwand (sonst lägen die Feldüberlappungen ext doppelt), 65 %, ohne Licht – gemalt beim letzten Feld (render.js), danach die
// Plan-Rauten auf dem Deck. Einmal je Bild (PLAN_GHOST_DONE)
function bkDrawGhost(last, z) {
  if (PLAN_GHOST_DONE) { if (PLAN_GHOST_DONE.get(last.k) === true) return; PLAN_GHOST_DONE.set(last.k, true); }
  const cells = [...PLAN_GHOST.values()].filter(c => c.k === last.k).sort((a, b) => a.i - b.i).map(c => {
    const x = c.x0 + c.dx * c.i, y = c.y0 + c.dy * c.i, p = toScreen(x, y), [l, u, r, d] = bkBoxOf(['h', 'vd', 'o'], c);
    return { c, x, y, px: p.x, py: p.y, R: [p.x - l * z, p.y - u * z, p.x + r * z, p.y + d * z] };
  });
  const R = cells.reduce((m, q) => [Math.min(m[0], q.R[0]), Math.min(m[1], q.R[1]), Math.max(m[2], q.R[2]), Math.max(m[3], q.R[3])], [Infinity, Infinity, -Infinity, -Infinity]);
  ghostPaint(R[0], R[1], R[2] - R[0], R[3] - R[1], 0.65, () => { for (const q of cells) { const A = bkTileArgs(q.c, q.px, q.py, z); bkPaint(A.P, z, A.art, A.n, A.t0, A.t1, A.weg, { ...A.opts, licht: null, dark: false }); } });
  for (const q of cells) { const marks = DECK_MARKS && DECK_MARKS.get(q.x + ',' + q.y); if (marks) for (const f of marks) { g.save(); g.lineJoin = 'round'; try { f(); } finally { g.restore(); } } }
}
function bkGroup(x, y, px, py, z, gruppen, c = bkAt(x, y)) {              // c: Brückenfeld (Anhöhe bkAt, Wasser wbAt – 160c D1)
  const fade = !(c && c.water) && bkFadeNow(x, y);                         // 👁 bzw. darunter bauen: blass (immer live); Wasser nie
  const live = gruppen.filter(gr => !(SPRITES_ON && !fade && spriteBridge(x, y, px, py, z, gr, c)));   // weit weg: Bildchen (im GL-Standbild ruhend)
  if (!live.length) return;
  const f = () => { const a0 = g.globalAlpha, gm = GLOW_MUTE; if (fade) { g.globalAlpha = a0 * SEE_A; GLOW_MUTE = true; }   // blass: Lampen ohne Schein (C7)
    try { for (const gr of live) bkDrawLagen(x, y, px, py, z, gr, c); } finally { g.globalAlpha = a0; GLOW_MUTE = gm; } };
  if (!GLPASS) return f();
  const [l, u, r, d] = bkBoxOf(live, c);
  glLive(px, py, l * z, u * z, r * z, d * z, f);
}
// Bildchen einer Gruppe (160c B2c): je Platz und Gruppe, Fassung groundVersion (jeder Setzer zählt sie hoch; recalc auch – der Strom ändert
// sich nur dort, darum steht „dunkel“ nicht im Schlüssel). Gruppen mit Lampen (C7, bkLampGroups) bekommen |lit und werden vor der
// Dämmerung beleuchtet vorbereitet (wie spriteFlat, Regel 143); alle anderen behalten den Schlüssel ohne Licht
function spriteBridge(x, y, px, py, z, gruppe, c = bkAt(x, y)) {
  const lg = bkLampGroups(c), lamp = lg.includes(gruppe) || (gruppe === 'w' && lg.some(gr => gr !== 't1' && gr !== 't2')), fog = FOG;   // w (Wasser, 160c D2h): mit, wenn eine seiner Lagen Lampen hat
  const zs = spriteStep(z), keyOf = lit => `${c && c.rail ? 'gb' : c && c.water ? 'wb' : 'br'}|${x},${y}|${gruppe}|${fog ? 1 : 0}` + (lamp ? '|' + lit : ''), key = keyOf(night > 0.15 && isLive() ? 1 : 0), [l, u, , d] = brBox(gruppe, c);
  const make = () => {
    const sp = paintSprite(l * zs, u * zs, d * zs, () => {
      const pf = FOG; FOG = fog;
      try { bkDrawLagen(x, y, 0, 0, zs, gruppe, c); } finally { FOG = pf; }
    });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, groundVersion);
  if (lamp && preLit()) prewarm(keyOf(1), zs, make, groundVersion);      // gleich wird es hell: beleuchtet schon vorbereiten
  if (!e) return false;
  putSprite(e, px, py, z);
  return true;
}
// Bewegtes auf einem Brückenfeld: 'B' hinter dem Deck, 'U' darunter, 'F' davor – Querlage s dort, wo gezeichnet wird (Figuren: am Fuß,
// FOOT_D wie slopeUp; Tiere in der Mitte). Fahrzeuge immer U. Wasserbrücke (160c D1e): halbe Breite c.W; Tiere dort fliegen (Fisch, Frosch,
// Robbe, Eisvogel sperrt movers.js) und sind höher als das Deck – davor
function bkMoverClass(m, c, x, y) {
  if (m.bkCls) return m.bkCls;                                             // Wagenstück unter der Brücke (brCarPiecesUnder)
  const W = c.W || BK_W;
  if (m.boat) return (c.b.ax ? m.px - x : m.py - y) > W ? 'F' : 'U';      // Boot vor der Stirn: davor (160c C10); hinten bleibt es darunter
  if (c.water && m.critter) return 'F';
  if (!(m.fur || m.critter) || m.train || m.boat || m.ship || m.cargo || m.fish) return 'U';
  const f = m.fur && !m.critter && !m.sit ? FOOT_D : 0, s = c.b.ax ? m.px + f - x : m.py - f - y;
  return s < -W - 0.05 ? 'B' : s > W ? 'F' : 'U';
}
// Rahmen des Bewegten auf dem Schirm [x0, y0, x1, y1] (wie sein glLive-Rahmen), vereinigt
function bkMoverRect(ms, z, lift = 0) {
  let R = null;
  for (const m of ms) {
    const p = toScreen(m.px, m.py), [l, u, r, d] = glMoverBox(m, z), q = [p.x - l, p.y - lift - u, p.x + r, p.y - lift + d];
    R = R ? [Math.min(R[0], q[0]), Math.min(R[1], q[1]), Math.max(R[2], q[2]), Math.max(R[3], q[3])] : q;
  }
  return R;
}
// Nachmalen (tileB): Gruppen und Deko-Plätze, beschnitten auf rect ∩ Rahmen der Gruppen
// cut (160c C10): Streifen der Anfangskante (Stütze, Bock, Pfeilerstirn bei s = W) auslassen – er liegt hinter einem Boot unter der Feldmitte
const BK_START_CUT = 25.5;                                                 // Feldmitte bis rechts neben die Stütze bzw. Pfeilerstirn der Anfangskante (× z)
const WB_START_CUT = 24.5;                                                 // Wasser (160c D2): Stütze bei s = 0,306 (EDGE_W), rechter Strichrand −24,7
function bkRedo(x, y, px, py, z, now, rect, gruppen, slots, cut = false, c0 = bkAt(x, y)) {
  const [l, u, r, d] = bkBoxOf(gruppen, c0), R = [Math.max(rect[0], px - l * z), Math.max(rect[1], py - u * z), Math.min(rect[2], px + r * z), Math.min(rect[3], py + d * z)];
  if (cut && c0) { const cw = c0.water ? WB_START_CUT : BK_START_CUT; if (c0.b.ax) R[2] = Math.min(R[2], px + cw * z); else R[0] = Math.max(R[0], px - cw * z); }
  if (R[2] <= R[0] || R[3] <= R[1]) return;
  const k = x + ',' + y, f = () => {
    const fog = FOG, gm = GLOW_MUTE;
    g.save(); g.beginPath(); g.rect(R[0], R[1], R[2] - R[0], R[3] - R[1]); g.clip();
    FOG = !ownedTile(x, y); GLOW_MUTE = gm || 'pane';                      // nur Scheiben neu stanzen, nie einen zweiten Schein (gesperrt bleibt gesperrt)
    try { for (const gr of gruppen) if (!(SPRITES_ON && !(c0 && c0.rail) && spriteBridge(x, y, px, py, z, gr, c0))) bkDrawLagen(x, y, px, py, z, gr, c0); if (slots && slots.length) drawSmall(k, px, py, z, now, x, y, slots); if (c0 && c0.water && !(c0.rail && !gruppen.includes('vd'))) wbRelight(x, y, px, py, z, c0); }   // Gleis: nur mit dem Deck (o allein: kein Schein über die Wagen)
    finally { GLOW_MUTE = gm; FOG = fog; g.restore(); }
  };
  if (GLPASS) glLive(px, py, l * z, u * z, r * z, d * z, f); else f();
}
// tileB eines Brückenfelds: ms = Bewegtes des Felds (nach Tiefe sortiert, noch nicht gezeichnet), figs = auf dem Deck. Folge: dahinter (B),
// h + Deko UNTER nachmalen, darunter (U), vd nachmalen, auf dem Deck, o + Deko VOR nachmalen, davor (F) – je im Rahmen des Bewegten.
// Wasserbrücke (160c D1e): Leute immer auf dem Deck (ihre Höhe hat drawFigure schon, wegBridgeLift), über dem Boot flach h + vd wie früher
// die ganze Brücke, nie blass. over(m): Boot unter früheren Brückenfeldern (render.js boatOver, samt Block 112)
function bkDrawMoving(x, y, px, py, z, now, c, ms, figs, drawnMovers, over = null) {
  if (c.water) { const on = ms.filter(m => (m.fur && !m.critter) || (c.rail && m.train)); if (on.length) { figs = (figs || []).concat(on); ms = ms.filter(m => !on.includes(m)); } }   // Gleisbrücke (160c E1b): Wagen auf dem Deck
  const fade = !c.water && bkFadeNow(x, y), up = c.water ? 0 : HILL_H * z, vd = c.water && !c.A ? ['h', 'vd'] : ['vd'];
  const k = x + ',' + y, draw = list => { FOG = false; for (const m of list) { moverLive(m, z, now); drawnMovers.add(m); } };
  const glas = bkTileBAt(c) && !(c.water && WB_GLASS_LATE && WB_GLASS_LATE.has(k));   // Wasser: über einem Boot malt das Boot das Glas (160c D3h)
  const glass = gr => { if (!glas) return; const f = FOG; FOG = !ownedTile(x, y); try { bkGroup(x, y, px, py, z, [gr], c); } finally { FOG = f; } };   // Kristall: Glas (B2: Licht) jedes Bild genau einmal
  const deck = () => { if (!figs) return; FOG = false;
    for (const m of figs.sort((a, b) => (a.px + a.py) - (b.px + b.py))) {
      const f = () => seeFaded(seeThrough, () => drawMover(m, z, now));   // 👁: auch Leute und Wagen oben blass
      if (GLPASS) { const p = toScreen(m.px, m.py), [l, u, r, d] = glMoverBox(m, z); glLive(p.x, p.y, l, u + up, r, d, f); }
      else f();
      drawnMovers.add(m);
    } };
  if (fade) { draw(ms); glass('t1'); deck(); glass('t2'); return; }       // blass: nie nachmalen
  const cls = new Map(ms.map(m => [m, bkMoverClass(m, c, x, y)])), B = ms.filter(m => cls.get(m) === 'B'), U = ms.filter(m => cls.get(m) === 'U'), F = ms.filter(m => cls.get(m) === 'F');
  const G = state.decos.has(k) ? bkDecoGroups(x, y, c) : null;
  const wcut = c.water && !!c.G && c.G.startPost;                                    // Wasser (160c D2): nur mit einer Stütze an der Anfangskante
  const boatMid = m => (!c.water || wcut) && m.boat && (c.b.ax ? m.px - x : m.py - y) > (c.water ? -0.19 : -0.16);   // Boot unter der Feldmitte vor der Stütze der Anfangskante (160c C10)
  const Ub = U.filter(boatMid), Ur = U.filter(m => !boatMid(m));
  const rB = B.length ? bkMoverRect(B, z) : null, rBU = B.length || Ur.length ? bkMoverRect(B.concat(Ur), z) : null, rUb = Ub.length ? bkMoverRect(Ub, z) : null;
  draw(B);
  if (rB) bkRedo(x, y, px, py, z, now, rB, ['h'], G && G.under, false, c);
  if (c.rail) { const gc = glowCells; glowCells = new Map(); try { draw(U); } finally { glowCells = gc; } }   // Gleis (160c E1b): Licht unter dem Deck zählt für sich – sonst nähme es dem Scheinwerfer oben die Stärke (Block 84d)
  else draw(U);
  if (c.rail) for (const m of U) if (m.boat && m.under) { if (over) over(m); else for (const bk of m.under) bridgeOverBoat(bk, z, now, m); }   // Gleis (160c E1b, K10): frühere Felder vor dem eigenen h + vd – sonst deckten sie den Zug darauf
  if (rBU) bkRedo(x, y, px, py, z, now, rBU, vd, null, false, c);
  if (rUb) bkRedo(x, y, px, py, z, now, rUb, vd, null, true, c);
  glass('t1');
  deck();
  const rF = figs ? bkMoverRect(figs, z) : null;                         // oben auf dem Deck: eine Anhöhe höher (Wasser: Höhe steckt im Rahmen); darunter/dahinter nur der eigene Rahmen (C7, L6)
  if (rF) rF[1] -= up;
  const rs = [rBU, rUb, rF].filter(Boolean), rAll = rs.length ? rs.reduce((a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]) : null;   // o: über alles Bewegte
  if (rAll && !(c.rail && !gbHasO(x, y))) bkRedo(x, y, px, py, z, now, rAll, ['o'], G && G.front, false, c);   // Gleis-Kurve/T/X: kein o (leere Zelle sparen)
  glass('t2');
  draw(F);
  for (const m of ms) if (m.boat && m.under && !(c.rail && cls.get(m) === 'U')) { if (over) over(m); else for (const bk of m.under) bridgeOverBoat(bk, z, now, m); }   // Wasserbrücken-Kachel davor (160c C10)
}

// ---------------------------------------------------------------------------
// Fußgänger-Brücke zwischen Anhöhen (160c C2, abgenommen: tools/brueckenfamilie-entwurf.js 'F-holz' = Entwurf 3b): Deck auf dem Bogen
// opts.hf(t) (brDeckHFn), alles im Parameterraum je Feld (G4: Stützpunkte im Weltraster k/12 und die exakten Feldenden), Längsstriche 'butt'
// (runde Kappen ragten an der Wand ins Prisma der Anhöhe, G1), Dinge auf Kanten halboffen (G3), Flächen und Striche deckend (G5).
// Strichbreiten = Entwurf ÷ 2 (der Entwurf rechnet in Gerätepunkten × 0,5). Lagen wie PLAN §2.4
// ---------------------------------------------------------------------------
const BK_FUSS = {
  holz: { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238', rib: '#7a5a3d' },
  stahl: { steel: '#5d7d7a', light: '#9bb7b3', dark: '#3e5452', grate: '#cfd3cf', quer: mix('#cfd3cf', '#5a6464', 0.35), laengs: mix('#cfd3cf', '#5a6464', 0.25) },   // „Metall“ (Entwurf 'F-metall'; Rost-Linien als Mischfarbe, G5)
  kristall: { glass: '#afe1f8', aBack: 0.3, aFront: 0.42, band: '#8fcbe6', aBand: 0.78, edge: '#5aa9d6', post: '#d8f2fc', rail: '#8fd3f2', deck: '#e6f6fc', seam: '#c3e7f5',
    hi: '#f7fdff', z1: '#7fc4e8', z2: '#c9b8f0' },                          // K1 (Entwurf brueckenlicht 'F-kristall'/'F-zacken'): Glas halbdurchsichtig, nur in hg/t1/t2
};
// Glasfarbe: Nebel/Umfärben nur auf Hex (C), dann rgba – C('rgba…') wäre ungültig (Falle 15)
const rgbaKCache = new Map();
function rgbaK(hex, a) {
  const h = C(hex), key = h + a;
  let v = rgbaKCache.get(key);
  if (!v) { const [r, gg, b] = hexToRgb(h); v = `rgba(${r},${gg},${b},${a})`; rgbaKCache.set(key, v); }
  return v;
}
// Gemeinsame Helfer der Bogen-Maler (Fußgänger Holz/Metall, Stein): Parameterraum je Feld, Längsstriche 'butt', Kanten halboffen
function bkKit(P, z, n, t0, t1, opts) {
  const A = -0.5, W = BK_W, hf = opts.hf || (() => HILL_H), T1 = t1 + (opts.ext || 0), last = t1 >= n - 0.5 - 1e-9;
  const lw = f => Math.max(0.6, f * z);
  const sh = col => opts.ax ? shade(col, LIGHT.side) : col;               // Nord-Süd: die Vorderseite zeigt nach +x (G11)
  const ts = (end, K = z < 0.6 ? 4 : 12) => { const out = [t0]; for (let j = Math.ceil((t0 - A) * K + 1e-9); A + j / K < end - 1e-9; j++) out.push(A + j / K); out.push(end); return out; };
  const stroke = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = C(col); g.lineWidth = lw(w); g.lineCap = 'butt'; g.lineJoin = 'round'; g.stroke(); };
  const line = (s, hOf, col, w) => stroke(ts(t1).map(t => P(t, s, hOf(t))), col, w);
  const band = (s, h0Of, h1Of, col) => { const T = ts(T1); poly([...T.map(t => P(t, s, h1Of(t))), ...T.reverse().map(t => P(t, s, h0Of(t)))], C(col)); };
  const deckTop = col => { const T = ts(T1); poly([...T.map(t => P(t, -W, hf(t))), ...T.reverse().map(t => P(t, W, hf(t)))], C(col)); };
  const onEdge = (K, fn) => { for (let k = Math.ceil((t0 - A) * K - 1e-9); A + k / K < t1 - 1e-9 || (last && A + k / K <= t1 + 1e-9); k++) fn(A + k / K, k); };
  const vert = (t, s, h0, h1, col, w) => stroke([P(t, s, h0), P(t, s, h1)], col, w);
  return { A, W, hf, T1, last, lw, sh, ts, stroke, line, band, deckTop, onEdge, vert };
}
function bkPaintFuss(lage, P, z, art, n, t0, t1, weg, opts) {
  const { A, W, hf, sh, ts, stroke, line, band, deckTop, onEdge, vert } = bkKit(P, z, n, t0, t1, opts), L = brPal(BK_FUSS[art], art, 'fuss', opts.col, opts.plank);
  const u01 = t => Math.max(0, Math.min(1, (t + 0.5) / n));
  const sup = (opts.supports || []).map(k => k - 0.5).filter(t => t >= t0 - 1e-9 && t < t1 - 1e-9);   // Stützen auf den Kanten (C1): das spätere Feld
  const ft = t => opts.foot ? opts.foot(Math.round(t + 0.5)) : 0;          // Fuß der Stütze: Boden 0, Wasser −6,3
  if (art === 'holz') {
    const rib = t => hf(t) - 7 + 3 * Math.sin(Math.PI * u01(t));          // Bogenträger unter dem Belag
    if (lage === 'h') {
      for (const t of sup) vert(t, -W + 0.06, ft(t), hf(t) - 0.5, L.side, 2.2);   // Stütze hinten
      onEdge(4, t => vert(t, -W, hf(t), hf(t) + 6, L.rail, 0.5));            // hinteres Geländer
      line(-W, t => hf(t) + 6, L.rail, 0.65);
      for (const t of sup) { const c = shade(L.side, -0.1), f = ft(t) + 3; stroke([P(t, -W + 0.06, f), P(t, W - 0.06, rib(t) - 4)], c, 0.45); stroke([P(t, W - 0.06, f), P(t, -W + 0.06, rib(t) - 4)], c, 0.45); }
    } else if (lage === 'v') {
      for (const t of sup) vert(t, W - 0.06, ft(t), hf(t) - 0.5, L.side, 2.2);    // Stütze vorn
      band(W, t => hf(t) - 2, hf, sh(shade(L.side, 0.05)));                   // Randbalken
      onEdge(2, t => { if (t > A + 1e-9 && t < n - 0.5 - 1e-9) vert(t, W, rib(t), hf(t) - 2, L.side, 0.5); });   // Hänger je halbes Feld
      band(W, t => rib(t) - 2.2, rib, sh(L.rib));                            // Bogenträger
    } else if (lage === 'd') {
      deckTop(L.deck);
      if (!weg) onEdge(9, t => stroke([P(t, -W, hf(t)), P(t, W, hf(t))], L.plank, 0.3));
      if (weg && opts.wegPaint) opts.wegPaint(hf);
    } else if (lage === 'o') {
      onEdge(4, t => vert(t, W, hf(t), hf(t) + 6, L.rail, 0.55));             // vorderes Geländer
      line(W, t => hf(t) + 6, L.rail, 0.75); line(W, t => hf(t) + 3, L.rail, 0.45);
    }
  } else if (art === 'kristall') {                                           // K1: Glasgeländer, Glasband unter dem Deck, Zacken (Option); v und o leer
    const ri = t => hf(t) - 3, T = ts(t1);
    const m0 = g.getTransform ? g.getTransform() : null;                    // Glasband: Feldkanten auf ganze Gerätepunkte (sonst eine helle Naht, Falle F5)
    const snap = (p, t) => m0 && m0.a && (Math.abs(t - t0) < 1e-9 || Math.abs(t - t1) < 1e-9) ? [(Math.round(m0.a * p[0] + m0.e) - m0.e) / m0.a, p[1]] : p;
    const bandT = (s, h0Of, h1Of, col, sn = false) => { const Q = T.slice(), at = (t, h) => sn ? snap(P(t, s, h), t) : P(t, s, h);
      g.beginPath(); [...Q.map(t => at(t, h1Of(t))), ...Q.reverse().map(t => at(t, h0Of(t)))].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };   // Durchsichtiges nie ins Nachbarfeld (ohne ext)
    const glassRail = (s, front) => {
      bandT(s, hf, t => hf(t) + 6, rgbaK(L.glass, front ? L.aFront : L.aBack));
      onEdge(4, t => vert(t, s, hf(t), hf(t) + 6, L.post, 0.3));
      line(s, t => hf(t) + 6, front ? L.rail : shade(L.rail, -0.1), 0.65);
    };
    if (lage === 'hg') bandT(-W, hf, t => hf(t) + 6, rgbaK(L.glass, L.aBack));                                       // hintere Scheibe (tileA, nie nachgemalt)
    else if (lage === 'h') { onEdge(4, t => vert(t, -W, hf(t), hf(t) + 6, L.post, 0.3)); line(-W, t => hf(t) + 6, shade(L.rail, -0.1), 0.65); }
    else if (lage === 'd') {
      deckTop(L.deck);
      if (!weg) onEdge(6, t => { if (t > A + 1e-9 && t < n - 0.5 - 1e-9) stroke([P(t, -W, hf(t)), P(t, W, hf(t))], L.seam, 0.25); });
      if (weg && opts.wegPaint) opts.wegPaint(hf);
    } else if (lage === 't1') {
      bandT(W, ri, hf, rgbaK(sh(L.band), L.aBand), true);                    // Glasband unter dem Deck (Kanten eingerastet)
      line(W, hf, sh(L.edge), 0.35); line(W, ri, sh(L.edge), 0.35);          // nur oben und unten (keine Naht an der Kachelkante)
      if (opts.zacken) for (let k = Math.max(0, Math.round((t0 - A) * 7)); A + (k + 0.5) / 7 < t1; k++) {   // Kristallzacken: Nummer ab dem Anker (Muster unabhängig von der Feldaufteilung)
        const t = A + (k + 0.5) / 7, m = Math.min(k, 7 * n - 1 - k), w2 = 0.05;   // m: gespiegelt – beide Enden gleich (Nutzer 12.10.2026: symmetrisch)
        const len = 3 + 4 * Math.abs(Math.sin(m * 2.3)) * Math.sin(Math.PI * u01(t)), tip = ri(t) - len;
        if (t < t0 || tip < (opts.clear != null ? opts.clear : brClear())) continue;   // Wasser (160c D2): eigene Grenze (D0 F-g)
        const pts = [P(t - w2, W, ri(t - w2)), P(t, W, tip), P(t + w2, W, ri(t + w2))];
        poly([pts[0], pts[2], pts[1]], C(sh(m % 2 ? L.z1 : L.z2)));
        stroke(pts, sh(L.edge), 0.2);
      }
      line(W, t => hf(t) - 0.6, L.hi, 0.4);                                  // Kantenglanz
    } else if (lage === 't2') glassRail(W, true);                            // vordere Scheibe, Pfosten, Handlauf (tileB, jedes Bild)
  } else if (art === 'stahl') {
    const rib = t => hf(t) - 6;                                              // dünner Stahlbogen unter dem Träger
    if (lage === 'h') {
      onEdge(4, t => vert(t, -W, hf(t), hf(t) + 6.5, L.dark, 0.4));          // hinteres Geländer
      line(-W, t => hf(t) + 6.5, L.dark, 0.6); line(-W, t => hf(t) + 3.2, L.dark, 0.35);
    } else if (lage === 'v') {
      band(W, t => hf(t) - 2.6, hf, sh(L.steel));                            // Stahlträger
      line(W, hf, L.dark, 0.25); line(W, t => hf(t) - 2.6, L.dark, 0.25);
      onEdge(3, (t, k) => { if (k % 3 && hf(t) - 2.6 - rib(t) > 1) vert(t, W, rib(t), hf(t) - 2.6, sh(L.steel), 0.45); });   // Hänger je Drittel, nie auf der Kante
      line(W, rib, sh(L.steel), 1.1); line(W, t => rib(t) + 0.6, L.light, 0.3);   // Bogen, Glanz
    } else if (lage === 'd') {
      deckTop(L.grate);                                                      // Gitterrost
      if (!weg) { onEdge(10, t => stroke([P(t, -W, hf(t)), P(t, W, hf(t))], L.quer, 0.25)); for (const s of [-0.2, 0, 0.2]) line(s, hf, L.laengs, 0.25); }
      if (weg && opts.wegPaint) opts.wegPaint(hf);
    } else if (lage === 'o') {
      onEdge(4, t => vert(t, W, hf(t), hf(t) + 6.5, L.steel, 0.45));         // vorderes Geländer
      line(W, t => hf(t) + 6.5, L.light, 0.75); line(W, t => hf(t) + 3.2, L.steel, 0.4);
    }
  }
}

// ---------------------------------------------------------------------------
// Stein-Fußgängerbrücke zwischen Anhöhen (160c C3, plan-160c/C3.md; abgenommen: tools/brueckenfamilie-entwurf.js stone(), Entwurf 10 Stufe 3,
// Balustrade aus tools/brueckenlicht-entwurf.js). Geometrie nur aus opts.stone (brStoneGeom). Stirn als Band (Unterkante = Bögen bzw. Boden
// am Pfeiler, kein evenodd), Laibung/Pfeilerseite/Widerlager nur, wo sie zur Kamera zeigen (Sehne steiler als TH), keine hintere Stirn
// (ihre Außenseite zeigt immer weg). Fugen, Keilsteine, Ring als deckende Mischfarben (G5, „Haarlinien“ unter 0,6 Bildpunkten)
// ---------------------------------------------------------------------------
const BK_STEIN = { face: '#d9d2c3', joint: '#a99f8c', deck: '#e6dcc8', top: '#efe8da', edge: shade('#d9d2c3', -0.25), inner: shade('#d9d2c3', -0.34),
  fuge: mix('#e6dcc8', '#96876e', 0.45), wall: 'aus', hair: true, lamp: '#b8ad97' };   // lamp: Laternengehäuse (C7, „dieselbe Farbe wie die Brücke“)   // wall: kein Widerlager an der Wand – die Felswand der Anhöhe bleibt sichtbar (Nutzer 12.10.2026)
function bkPaintStein(lage, P, z, n, t0, t1, weg, opts) {
  const { A, W, hf, T1, last, sh, ts, stroke, line, band, deckTop, onEdge } = bkKit(P, z, n, t0, t1, opts), L = brPal(BK_STEIN, 'stein', opts.fam, opts.col, null), B = n - 0.5;
  const S = opts.stone || brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)), gl = opts.gl || (() => 0), M = z < 0.6 ? 24 : 64;
  const arcTs = (lo, hi) => [lo, ...S.ts(M).filter(t => t > lo + 1e-9 && t < hi - 1e-9), hi];
  const rr = t => Math.min(S.ri(t) + S.S.ring, hf(t) - 0.2);               // Ring über der Leibung, nie über die Deckkante
  const hair = (pts, col, bg, w) => { const f = w * z; stroke(pts, L.hair && f < 0.6 ? mix(bg, col, Math.max(1, Math.round(f / 0.6 * 8)) / 8) : col, w); };
  const ramp = t => Math.max(0, Math.min(1, Math.min(t - A, B - t) / 0.45)), parH = t => BR_STEIN.par * ramp(t);   // Balustrade läuft an den Enden aus (kein Zipfel)
  const inCell = t => t >= t0 - 1e-9 && (t < t1 - 1e-9 || (last && t <= t1 + 1e-9));
  const balustrade = (s, vorn) => {
    const tone = vorn ? L.top : shade(L.top, -0.14), rail = vorn ? L.top : shade(L.top, -0.1), posts = [];
    onEdge(z < 0.6 ? 4 : 10, t => { if (parH(t) >= 1) posts.push(t); });
    for (const [col, w] of [[L.joint, 1.61], [tone, 1.21]]) {                // Baluster: ein Pfad je Farbe (Umriss, dann Ton)
      if (!posts.length) break;
      g.beginPath(); for (const t of posts) { const a = P(t, s, hf(t)), b = P(t, s, hf(t) + parH(t) - 1.4); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.strokeStyle = C(col); g.lineWidth = Math.max(0.6, w * z); g.lineCap = 'butt'; g.stroke();
    }
    const hl = t => hf(t) + Math.max(0, parH(t) - 1.6);
    band(s, hl, t => hf(t) + parH(t), rail);                                 // Handlauf
    hair(ts(t1).map(t => P(t, s, hl(t))), L.joint, rail, 0.25);
    band(s, t => hf(t) - 0.01, t => hf(t) + 0.9 * ramp(t), shade(L.top, vorn ? -0.05 : -0.16));   // Sockel
    line(s, t => hf(t) + parH(t), shade(L.top, vorn ? 0.06 : -0.04), 0.65);  // Abdeckung
  };
  if (lage === 'h') {
    for (const q of S.arcs) {                                                // Laibung und Pfeilerseite: am Ansatz q.a (Pfeiler: das spätere Feld); an der Wand nichts (L.wall)
      if (!(q.a >= t0 - 1e-9 && q.a < t1 - 1e-9)) continue;
      if (q.a === S.A && L.wall === 'aus') continue;
      const T = arcTs(q.a, Math.min(q.c, t1)), run = [T[0]];
      for (let j = 1; j < T.length && (S.ri(T[j]) - S.ri(T[j - 1])) / (T[j] - T[j - 1]) > TH; j++) run.push(T[j]);   // nur, solange sie zur Kamera zeigt
      const lo = q.a === S.A && L.wall === 'band' ? Math.max(gl(q.a), HILL_H - 7) : gl(q.a);
      poly([P(q.a, W, lo), ...run.map(t => P(t, W, S.ri(t))), ...run.slice().reverse().map(t => P(t, -W, S.ri(t))), P(q.a, -W, lo)], C(L.inner));
    }
    balustrade(-W, false);
  } else if (lage === 'v') {
    const bottom = [], T = arcTs(t0, T1);                                    // Unterkante der Stirn: Bögen, am Pfeiler der Boden
    if (T1 > t1 + 1e-9 && S.ri(t1) == null && gl(t1 - 1e-7) > gl(t1)) T.splice(T.findIndex(t => t > t1 - 1e-9), 0, t1);   // Pfeiler über Land→Wasser: Stufe an der Feldkante (kein Keil über dem Ufer)
    for (const t of T) {
      if (Math.abs(t - t1) < 1e-9 && T1 > t1 + 1e-9 && S.ri(t) == null && gl(t1 - 1e-7) > gl(t1)) { bottom.push([t, gl(t1 - 1e-7)], [t, gl(t1)]); continue; }
      const r = S.ri(t), g0 = gl(t);
      if (r != null && t < T1 - 1e-9 && S.ri(t + 1e-7) == null) bottom.push([t, r], [t, g0]);
      else if (r != null && t > t0 + 1e-9 && S.ri(t - 1e-7) == null) bottom.push([t, g0], [t, r]);
      else bottom.push([t, r == null ? g0 : r]);
    }
    poly([...ts(T1).map(t => P(t, W, hf(t))), ...bottom.reverse().map(([t, h]) => P(t, W, h))], C(sh(L.face)));
    for (const q of S.arcs) {
      const lo = Math.max(q.a, t0), hi = Math.min(q.c, t1);
      if (hi <= lo) continue;
      if (z >= 0.6) for (let j = 1; j <= 9; j++) { const t = q.a + (q.c - q.a) * j / 10; if (inCell(t)) hair([P(t, W, S.ri(t)), P(t, W, rr(t))], sh(L.joint), sh(L.face), 0.3); }   // Keilsteine
      const T = arcTs(lo, hi);
      stroke(T.map(t => P(t, W, S.ri(t))), sh(L.edge), 0.5);              // Bogenkante
      hair(T.map(t => P(t, W, rr(t))), sh(L.joint), sh(L.face), 0.3);     // Ring
    }
  } else if (lage === 'd') {
    deckTop(L.deck);
    if (opts.fam === 'bahn') { if (weg && opts.wegPaint) opts.wegPaint(hf); if (opts.railPaint) opts.railPaint(hf(t0)); return; }   // Viadukt: Gleis auf dem Deck, keine Fugen (Entwurf) – je Familie, nicht je Feld
    if (!weg) for (let j = Math.ceil((t0 - A) * 6 - 0.5 - 1e-9); A + (j + 0.5) / 6 < t1 + 1e-9; j++) {   // Fugen je ⅙ Feld, nie auf einer Kante
      const t = A + (j + 0.5) / 6;
      if (t < t0 - 1e-9 || (z < 0.6 && j % 2)) continue;
      hair([P(t, -W, hf(t)), P(t, W, hf(t))], L.fuge, L.deck, 0.3);
    }
    if (weg && opts.wegPaint) opts.wegPaint(hf);
  } else if (lage === 'o') balustrade(W, true);
}

// ---------------------------------------------------------------------------
// Brückenfarbe (160c C6d): Grundfarbe bc = BRIDGE_COLS[brc] färbt je Material das Tragende (Holz: Geländer, Stützen, Träger; Metall: Träger,
// Bogen, Fachwerk, Geländer; Stein: Stirn, Balustrade; Kristall: Pfosten, Handlauf, Fachwerk – das Glas bleibt), Planken (Holz) PLANK_COLS[brw].
// Nur Hex über shade/mix (G5, Falle 15). Ohne Wahl: die Palette des Materials unverändert (Bild pixelgleich)
// ---------------------------------------------------------------------------
const brPalCache = new Map();
function brPal(base, mat, fam, col, plank) {
  if (col == null && plank == null) return base;
  const key = mat + fam + '|' + col + '|' + plank;
  let L = brPalCache.get(key);
  if (L) return L;
  L = { ...base };
  const bc = col != null && BRIDGE_COLS[col], pc = plank != null && PLANK_COLS[plank];
  if (bc) {
    if (mat === 'holz') Object.assign(L, fam === 'bahn' ? { side: bc, rail: bc, beam: shade(bc, -0.15) } : { side: bc, rail: bc, rib: shade(bc, -0.05) });
    else if (mat === 'stahl') Object.assign(L, fam === 'bahn' ? { back: shade(bc, -0.3), front: shade(bc, 0.2), beam: bc, edge: shade(bc, -0.3) } : { steel: bc, dark: shade(bc, -0.3), light: shade(bc, 0.35) });
    else if (mat === 'stein') Object.assign(L, { face: bc, top: shade(bc, 0.12), joint: shade(bc, -0.2), edge: shade(bc, -0.25), inner: shade(bc, -0.34), lamp: shade(bc, -0.15) });
    else if (mat === 'kristall') Object.assign(L, fam === 'bahn' ? { back: shade(bc, -0.15), front: bc, beam: mix(bc, '#ffffff', 0.45), edge: shade(bc, -0.2) } : { post: mix(bc, '#ffffff', 0.5), rail: bc });
  }
  if (pc && mat === 'holz') Object.assign(L, { deck: pc, plank: shade(pc, -0.22) });
  brPalCache.set(key, L);
  return L;
}


// ---------------------------------------------------------------------------
// Wasser-Wegbrücken, neue Modelle (160c D2; abgenommen: Entwurf tools/wasserbruecken-entwurf.js maler(), plan-160c/karte-D0.md, karte-D2.md).
// Form, Bogenhöhe, Öffnungen und Durchfahrten bleiben aus Block 150 (bridgeArch); gemalt mit den Bausteinen der Anhöhe (bkPaintLage) in der
// schmalen Wasser-Breite: P staucht quer s (BK_W-Raum der Maler) auf EDGE_W bzw. bis in die Nachbarreihe (breit) und nie unter die Wasserfläche.
// Holz/Metall flach ohne Bogenträger (wbFlachV), Stein mit archWall (Quader) + Balustrade, offenes Ende: Abschluss quer (wbQuer). Je Lage
// (BK_GRUPPEN: h | v d | o, Glas hg/t1/t2) – dieselbe Folge wie der Entwurf: hg, h, Abschluss −, Rückwand, v, d, t1, o, t2, Abschluss +
// ---------------------------------------------------------------------------
let BR_STONE_NONE = null;                                                  // Stein: nur Balustrade + Deck (die Wand malt archWall)
function wbArgs(c, px, py, z) {
  const G = c.G, ax = c.ax, tc = G.i, t = c.t || state.tiles.get(c.k), L = G.look, art = G.art, stein = art === 'stein';   // c.t: gedachtes Feld (Geist, 160c D3h)
  if (!BR_STONE_NONE) BR_STONE_NONE = { arcs: [], S: BR_STEIN, ts: () => [], ri: () => null, pierHit: () => false, low: (tt, g0 = 0) => g0 };
  const Pw = (a, b, h) => { const [u, v] = ax ? [b, a] : [a, b]; return [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - h * z]; };
  const sq = s => s / BK_W * (s < 0 ? (G.latB ? 0.512 : EDGE_W) : (G.latF ? 0.512 : EDGE_W));
  const P = (tt, s, h) => Pw(tt - tc, sq(s), Math.max(h, WB_WATER));       // nie unter die Wasserfläche
  const H = a => G.hf(tc + a), weg = stein || L.deck === 'belag';
  const opts = { fam: 'fuss', ax, hf: G.hf, foot: () => WB_WATER, gl: () => -1, supports: G.supports, ext: G.ext, col: L.col, plank: L.plank,
    licht: L.licht || null, dark: L.licht === 'an' && typeof T !== 'undefined' && !!T.rail && !!T.rail.power && T.rail.power.dark.has('W' + G.anker), zacken: !!L.zacken, stone: stein ? BR_STONE_NONE : null, clear: 9, lampMax: G.n,
    wegPaint: weg ? () => wbBelag(t, c.x, c.y, z, ax, Pw, H, G.latB, G.latF, !!c.A) : null };
  return { G, t, xy: [c.x, c.y], P, Pw, H, art, weg, opts, face: brPal(BK_STEIN, 'stein', 'fuss', L.col, null).face };
}
function wbPaintLage(lage, c, A, z) {
  const G = A.G, glas = A.art === 'kristall', stein = A.art === 'stein';
  const L = (l, ex) => bkPaintLage(l, A.P, z, A.art, G.n, G.t0, G.t1, A.weg, ex ? { ...A.opts, ...ex } : A.opts);
  if (lage === 'hg') { if (glas && !G.latB) L('hg'); }
  else if (lage === 'h') {
    if (!G.latB) {
      L('h');
      if (G.endPost) { const K = bkKit(A.P, z, G.n, G.t0, G.t1, A.opts), Lp = brPal(BK_FUSS.holz, 'holz', 'fuss', G.look.col, G.look.plank); K.vert(G.t1, -BK_W + 0.06, WB_WATER, G.hf(G.t1) - 0.5, Lp.side, 2.2); }   // Stütze am offenen Ende, hinten
    }
    if (G.first) wbQuer(A, z, -0.5, false);                                // −Ende: nur der Abschluss quer, vor dem Deck
    if (stein && c.A && !G.latF) archWall(c.A, A.Pw, A.H, WB_AS9, { side: A.face }, EDGE_W, z, { ...A.t, brk: 'stein' }, false, G.depth, false);   // Rückwand, Gewölbe
  } else if (lage === 'v') {
    if (G.latF) return;
    if (stein) { if (c.A) archWall(c.A, A.Pw, A.H, WB_AS9, { side: A.face }, EDGE_W, z, { ...A.t, brk: 'stein' }, true, G.depth, true); else wbFlachWand(A, z); }
    else if (!c.A && (A.art === 'holz' || A.art === 'stahl')) wbFlachV(A, z);
    else L('v');
  } else if (lage === 'd') L('d', G.latB ? { licht: null } : null);     // innere Reihen ohne Licht (sonst stünde die Lampe auf der Fuge)
  else if (lage === 't1') { if (glas && !G.latF) L('t1'); }
  else if (lage === 'o') { if (!G.latF) L('o'); if (G.lastB && !glas) wbQuer(A, z, 0.5, true); }
  else if (lage === 't2') { if (glas) { if (!G.latF) L('t2'); if (G.lastB) wbQuer(A, z, 0.5, true); } }
}
// flach (1 Feld, Steg) ohne Bogenträger (D0 F-f): Holz Randbalken + Stützen vorn, Metall nur der Träger
function wbFlachV(A, z) {
  const G = A.G, K = bkKit(A.P, z, G.n, G.t0, G.t1, A.opts), hf = G.hf, Lp = brPal(A.art === 'holz' ? BK_FUSS.holz : BK_FUSS.stahl, A.art, 'fuss', G.look.col, G.look.plank);
  if (A.art === 'holz') {
    for (const k of G.supports) { const tt = k - 0.5; if ((tt >= G.t0 - 1e-9 && tt < G.t1 - 1e-9) || (G.endPost && Math.abs(tt - G.t1) < 1e-9)) K.vert(tt, BK_W - 0.06, WB_WATER, hf(tt) - 0.5, Lp.side, 2.2); }
    K.band(BK_W, tt => hf(tt) - 2, hf, K.sh(shade(Lp.side, 0.05)));
  } else { K.band(BK_W, tt => hf(tt) - 2.6, hf, K.sh(Lp.steel)); K.line(BK_W, hf, Lp.dark, 0.25); K.line(BK_W, tt => hf(tt) - 2.6, Lp.dark, 0.25); }
}
// Steinwand flach (1 Feld, Steg): Quader, mit der Bogen-Andeutung (wie Block 66, ohne Ziegel)
function wbFlachWand(A, z) {
  const { Pw, H, face } = A, AS = [-0.5, -0.2, 0.2, 0.5], hw = EDGE_W;
  for (let i = 0; i < 3; i++) { const a0 = AS[i], a1 = AS[i + 1]; poly([Pw(a0, hw, -1), Pw(a1, hw, -1), Pw(a1, hw, H(a1)), Pw(a0, hw, H(a0))], C(shade(face, -0.12))); }
  const wallPts = [...AS.map(a => Pw(a, hw, -1)), ...[...AS].reverse().map(a => Pw(a, hw, H(a)))], [tx, ty] = A.xy;
  g.save(); g.beginPath(); wallPts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
  pattern(([sa, st]) => Pw(sa, hw, -1 + (st + 0.5) * 22), 'tiles', tx, ty, z, C(shade(face, -0.3)), null);
  g.restore();
  const L = A.G.lift, arch = []; for (let k = 0; k <= 12; k++) { const a = -0.3 + 0.6 * k / 12; arch.push(Pw(a, hw, -1 + (L - 2.5) * Math.sqrt(Math.max(0, 1 - (a / 0.3) ** 2)))); }
  poly(arch, 'rgba(35,70,95,0.55)');
}
// offenes Ende (Steg): Abschluss quer – Stein: Stirn (nur am +Ende sichtbar) + Abdeckung, sonst Handlauf in der Farbe des Geländers
function wbQuer(A, z, a, sicht) {
  const { Pw, art, face } = A, hw = EDGE_W, h = A.H(a);
  if (art === 'stein') {
    if (sicht) poly([Pw(a, -hw, -1), Pw(a, hw, -1), Pw(a, hw, h), Pw(a, -hw, h)], C(shade(face, -0.2)));
    poly([Pw(a, -hw, h), Pw(a, hw, h), Pw(a, hw, h + BR_STEIN.par), Pw(a, -hw, h + BR_STEIN.par)], C(shade(face, 0.08)));
    return;
  }
  const Lp = brPal(BK_FUSS[art], art, 'fuss', A.G.look.col, A.G.look.plank), col = art === 'stahl' ? Lp.steel : Lp.rail, dh = art === 'stahl' ? 6.5 : 6;
  g.strokeStyle = C(col); g.lineWidth = Math.max(0.6, 0.7 * z); g.lineCap = 'butt'; g.beginPath();
  const p0 = Pw(a - Math.sign(a) * 0.03, -hw, h + dh), p1 = Pw(a - Math.sign(a) * 0.03, hw, h + dh); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
}
// Belag wie der Weg (Stein, Holz mit Belag): Kante, Füllung, Muster, Asphalt-Mittelstreifen – wie der alte Maler (Block 66b)
function wbBelag(t, x, y, z, ax, Pw, H, latB, latF, arch) {
  const AS = arch ? WB_AS9 : [-0.5, -0.2, 0.2, 0.5], hw = EDGE_W;
  const tfd = g.getTransform ? g.getTransform() : null, dpd = (tfd ? Math.hypot(tfd.a, tfd.b) : 1) * z, pd = Math.min(0.08, 1.5 / (dpd * TW * 0.56));
  const b0 = latB ? -0.5 - Math.max(0.01, pd) : -hw, b1 = latF ? 0.5 + Math.max(0.01, pd) : hw;
  const ASd = [AS[0] - pd, ...AS.slice(1, -1), AS[AS.length - 1] + pd], Hd = a => H(Math.max(-0.5, Math.min(0.5, a)));
  const st = styleDef('weg', t.style), lk = lookFar(pathLook(st.id), z) || {}, fill = lk.fill || '#dcc69d';
  const Lh = ([u, v]) => { const a = ax ? v : u, b = ax ? u : v; return Pw(a, b, Hd(a)); };
  const band2 = (w0, w1) => [...ASd.map(a => ax ? [w0, a] : [a, w0]), ...[...ASd].reverse().map(a => ax ? [w1, a] : [a, w1])];
  const inner = band2(latB ? b0 : -ROAD_W, latF ? b1 : ROAD_W);
  poly(band2(b0, b1).map(Lh), C(lk.edge || shade(fill, -0.18)));
  poly(inner.map(Lh), C(fill));
  if (lk.pat || lk.checker) { g.save(); clipTo([inner], Lh); pattern(Lh, lk.pat ? lk.pat[0] : 'tiles', x, y, z, lk.pat && lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, fill); g.restore(); }
  if (lk.dash) {                                                           // Asphalt: Mittelstreifen
    g.strokeStyle = C('#f4efe2'); g.lineWidth = 1.2 * z; g.lineCap = 'round'; g.setLineDash([2.5 * z, 3 * z]); g.beginPath();
    AS.forEach((a, i) => { const q = Pw(a, 0, H(a)); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); g.setLineDash([]);
  }
}

// Gedachte Wasserbrücken-Felder (160c D3h): Geist beim Ziehen übers Wasser und beim Tragen einer Brückenkachel. state.tiles wird kurz um die
// geplanten Kacheln ergänzt und wbAt daraus gerechnet (die Caches hängen an state.tiles und leeren sich von selbst), danach zurück – nie recalc,
// seaPath oder speichern währenddessen. extra: [[k, Kachel]], keys: welche Felder. Felder mit t (die gedachte Kachel) für wbArgs
function wbVirtual(extra, keys) {
  const real = state.tiles, out = new Map();
  try {
    state.tiles = new Map(real);
    for (const [k, t] of extra) state.tiles.set(k, t);
    for (const k of keys) { const c = wbAt(...keyXY(k)); if (c) out.set(k, { ...c, t: state.tiles.get(k) }); }
  } finally { state.tiles = real; }
  return out;
}
// gedachte Brückenkachel im Aussehen look (wie build: brWriteLook, brp gestempelt)
function wbGhostTile(look, style, lauf) {
  const t = { b: 'weg', lvl: 1, style, bridge: true, lauf };
  brWriteLook(t, look, look.kind && WEG_BRIDGE[look.kind] ? look.kind : brFallback('wasser', look.mat).brk, look.mat === 'kristall' && look.zacken ? 'an' : null, null);   // gekaufte Zacken mit
  t.brp = { ...brPrice(look, 'wasser'), k: brSig(t, 'wasser') };
  return t;
}
// Geistfelder je Brücke (zusammenhängend über Nachbarn): letztes Feld in Maler-Folge → Felder dieser Brücke (je eine Leinwand, wie bkDrawGhost)
function wbGhostGroups(cells) {
  const out = new Map(), seen = new Set();
  for (const [k0] of cells) {
    if (seen.has(k0)) continue;
    const grp = new Map(), todo = [k0];
    while (todo.length) { const k = todo.pop(); if (seen.has(k) || !cells.has(k)) continue; seen.add(k); grp.set(k, cells.get(k)); const [x, y] = keyXY(k); for (const [dx, dy] of DIRS) todo.push((x + dx) + ',' + (y + dy)); }
    const last = [...grp.values()].reduce((m, c) => !m || c.x + c.y > m.x + m.y || (c.x + c.y === m.x + m.y && c.x > m.x) ? c : m, null);
    out.set(last.k, grp);
  }
  return out;
}
// Geist ganz zeichnen: alle Felder in Maler-Folge auf EINE Zwischenleinwand (wie bkDrawGhost), 65 %, ohne Licht; danach die Plan-Rauten
function wbDrawGhost(cells, z) {
  const qs = [...cells.values()].sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.x - b.x).map(c => {
    const p = toScreen(c.x, c.y), [l, u, r, d] = bkBoxOf(['w', 'hg', 't1', 't2'], c);
    return { c, px: p.x, py: p.y, R: [p.x - l * z, p.y - u * z, p.x + r * z, p.y + d * z] };
  });
  if (!qs.length) return;
  const R0 = qs.reduce((m, q) => [Math.min(m[0], q.R[0]), Math.min(m[1], q.R[1]), Math.max(m[2], q.R[2]), Math.max(m[3], q.R[3])], [Infinity, Infinity, -Infinity, -Infinity]);
  const R = [Math.max(R0[0], -8), Math.max(R0[1], -8), Math.min(R0[2], W + 8), Math.min(R0[3], H + 8)];   // nur der sichtbare Teil (lange Brücke, nah: sonst riesige Leinwand)
  if (R[2] <= R[0] || R[3] <= R[1]) return;
  const fog = FOG; FOG = false;                                            // geplante Felder werden beim Bauen eigen: nie im Nebel
  try { ghostPaint(R[0], R[1], R[2] - R[0], R[3] - R[1], 0.65, () => {
    for (const q of qs) { const A = wbArgs(q.c, q.px, q.py, z); A.opts = { ...A.opts, licht: null, dark: false }; for (const l of ['hg', 'h', 'v', 'd', 't1', 'o', 't2']) wbPaintLage(l, q.c, A, z); }
  }); } finally { FOG = fog; }
  for (const q of qs) { const marks = DECK_MARKS && DECK_MARKS.get(q.c.k); if (marks) for (const f of marks) { g.save(); g.lineJoin = 'round'; try { f(); } finally { g.restore(); } } }
}
// Eine Brückenkachel außerhalb der Karte (Tragen mit ✋, drawObject('weg')): als gedachtes Feld an ihrem Ziel im neuen Modell (160c D3h).
// Gemerkt je Ziel, Fassung und Kachel (der Geist kommt jedes Bild als neue Kopie)
const WB_TILE_GHOST = { key: '', c: null };
function wbDrawTile(cx, cy, z, x, y, t) {
  const k = x + ',' + y, key = k + '|' + groundVersion + '|' + JSON.stringify(t), G = WB_TILE_GHOST;
  if (G.key !== key) { G.key = key; G.c = wbVirtual([[k, t]], [k]).get(k) || null; }
  if (!G.c) return;
  const A = wbArgs(G.c, cx, cy, z);
  A.opts = { ...A.opts, licht: null, dark: false };
  for (const l of ['hg', 'h', 'v', 'd', 't1', 'o', 't2']) wbPaintLage(l, G.c, A, z);
}
