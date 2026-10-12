'use strict';
// ---------------------------------------------------------------------------
// Brückenbild (160c B1): der Maler der Anhöhen-Brücken in Lagen (PLAN-160c.md §2.2 G2). Ein Feld zeichnet seine Lagen nacheinander:
// 'h' hinten (L1) · 'v' vorn unten (L3) · 'd' Deck mit Weg/Gleis (L4) · [Bewegtes darauf] · 'o' vorn oben (L6).
// Alles deckend (G5): halbdurchsichtige Striche sind fertige Mischfarben – so kann eine Lage später nachgemalt werden, ohne dunkler zu werden.
// ---------------------------------------------------------------------------
const BK_LAGEN = ['h', 'v', 'd', 'o', 'hg', 't1', 't2'];                    // hg/t1/t2: Glas (Kristall, 160c C4) – halbdurchsichtig, genau einmal je Bild
// Gruppen fürs Zeichnen (160c B2): ruhend in tileA h | (Deko unter dem Deck) | vd | o; nachgemalt je nach Bewegtem
const BK_GRUPPEN = { h: ['h'], vd: ['v', 'd'], o: ['o'], hg: ['hg'], t1: ['t1'], t2: ['t2'] };   // hg ruhend in tileA (nie nachgemalt), t1/t2 jedes Bild in tileB
// Rahmen einer Gruppe um die Feldmitte unten, in Welteinheiten (× z): [links, oben, rechts, unten] – für Bildchen, glLive und Nachmal-Clip
function brBox(gruppe, c = null) {                                         // c: Feld (bkAt) – oben bis zum Scheitel im Feld (Bogen, 160c C2)
  const hm = c ? bkHMax(c) : HILL_H, u = gruppe === 'vd' || gruppe === 't1' ? TH / 2 + hm + 8 : TH / 2 + hm + 16;
  return [TW / 2 + 6, u, TW / 2 + 6, TH / 2 + 6];
}
// Eine Lage eines Brückenstücks: P(t, s, h) bildet längs t (Felder ab der Mitte des ersten Lückenfelds), quer s und Höhe h auf den Schirm ab;
// gezeichnet wird nur t in [t0, t1] (ein Feld), damit Dinge davor und dahinter richtig darüber bzw. darunter liegen
function bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts = {}) {
  if (art === 'stein' && (opts.fam === 'fuss' || opts.fam === 'bahn')) return bkPaintStein(lage, P, z, n, t0, t1, weg, opts);   // Stein mit Pfeilern (160c C3), Viadukt (C5d)
  if (opts.fam === 'fuss' && BK_FUSS[art]) return bkPaintFuss(lage, P, z, art, n, t0, t1, weg, opts);   // Fußgänger: Bogen (160c C2)
  return bkPaintBahn(lage, P, z, BK_BAHN[art] ? art : 'holz', n, t0, t1, weg, opts);   // Bahn: flach (160c C5); auch Rückfall ohne Familie
}
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
  const L = BK_BAHN[art], H = opts.h != null ? opts.h : HILL_H, A = -0.5, B = n - 0.5, W = BK_W, T1 = t1 + (opts.ext || 0), last = t1 >= B - 1e-9;
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
    const T = 11, a = A + 0.15, b = B - 0.15, m = 2 * n;
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
  const glas = art === 'kristall' && opts.fam === 'fuss';                   // Kristall (160c C4): Glas hinten zuerst, Glasband vor dem Bewegten oben, vorderes Glas zuletzt
  for (const lage of glas ? ['hg', 'h', 'v', 'd', 't1'] : ['h', 'v', 'd']) bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts);
  if (opts.after) opts.after(opts.h != null ? opts.h : HILL_H);
  for (const lage of glas ? ['o', 't2'] : ['o']) bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts);
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
  if (G && G.back.length) drawSmall(k, px, py, z, now, x, y, G.back);
  if (bkGlasAt(c)) bkGroup(x, y, px, py, z, ['hg']);                      // Kristall: hintere Glasscheibe (eigener Aufruf: vor den Pfosten, auch wenn ein Bildchen fehlt)
  bkGroup(x, y, px, py, z, ['h']);
  if (under) under();
  if (G && G.under.length) drawSmall(k, px, py, z, now, x, y, G.under);
  bkGroup(x, y, px, py, z, ['vd', 'o']);
  if (G && G.front.length) drawSmall(k, px, py, z, now, x, y, G.front);
  const marks = DECK_MARKS && DECK_MARKS.get(k);                           // Plan-Rauten auf dem Deck (planPreview): über dem Deck
  if (marks) for (const f of marks) { g.save(); g.lineJoin = 'round'; try { f(); } finally { g.restore(); } }
}
function bkGroup(x, y, px, py, z, gruppen) {
  const fade = bkFadeNow(x, y);                                            // 👁 bzw. darunter bauen: blass (immer live)
  const live = gruppen.filter(gr => !(SPRITES_ON && !fade && spriteBridge(x, y, px, py, z, gr)));   // weit weg: Bildchen (im GL-Standbild ruhend)
  if (!live.length) return;
  const f = () => { const a0 = g.globalAlpha; if (fade) g.globalAlpha = a0 * SEE_A; try { for (const gr of live) bkDrawLagen(x, y, px, py, z, gr); } finally { g.globalAlpha = a0; } };
  if (!GLPASS) return f();
  const [l, u, r, d] = bkBoxOf(live, bkAt(x, y));
  glLive(px, py, l * z, u * z, r * z, d * z, f);
}
// Bildchen einer Gruppe (160c B2c): je Platz und Gruppe, Fassung groundVersion (jeder Setzer zählt sie hoch). Ohne Licht im Schlüssel:
// die Brücken haben noch keins (ein Test hält das fest) – kommt es in C, dann keyOf(lit) + prewarm wie spriteArchBridge (Regel 143)
function spriteBridge(x, y, px, py, z, gruppe) {
  const zs = spriteStep(z), key = `br|${x},${y}|${gruppe}|${FOG ? 1 : 0}`, fog = FOG, [l, u, , d] = brBox(gruppe, bkAt(x, y));
  const make = () => {
    const sp = paintSprite(l * zs, u * zs, d * zs, () => {
      const pf = FOG; FOG = fog;
      try { bkDrawLagen(x, y, 0, 0, zs, gruppe); } finally { FOG = pf; }
    });
    if (sp) sp.z = zs;
    return sp;
  };
  const e = getSprite(key, zs, make, groundVersion);
  if (!e) return false;
  putSprite(e, px, py, z);
  return true;
}
// Bewegtes auf einem Brückenfeld: 'B' hinter dem Deck, 'U' darunter, 'F' davor – Querlage s dort, wo gezeichnet wird (Figuren: am Fuß,
// FOOT_D wie slopeUp; Tiere in der Mitte). Fahrzeuge immer U
function bkMoverClass(m, c, x, y) {
  if (!(m.fur || m.critter) || m.train || m.boat || m.ship || m.cargo || m.fish) return 'U';
  const f = m.fur && !m.critter && !m.sit ? FOOT_D : 0, s = c.b.ax ? m.px + f - x : m.py - f - y;
  return s < -BK_W - 0.05 ? 'B' : s > BK_W ? 'F' : 'U';
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
function bkRedo(x, y, px, py, z, now, rect, gruppen, slots) {
  const [l, u, r, d] = bkBoxOf(gruppen, bkAt(x, y)), R = [Math.max(rect[0], px - l * z), Math.max(rect[1], py - u * z), Math.min(rect[2], px + r * z), Math.min(rect[3], py + d * z)];
  if (R[2] <= R[0] || R[3] <= R[1]) return;
  const k = x + ',' + y, f = () => {
    const fog = FOG;
    g.save(); g.beginPath(); g.rect(R[0], R[1], R[2] - R[0], R[3] - R[1]); g.clip();
    FOG = !ownedTile(x, y); GLOW_MUTE = 'pane';                            // nur Scheiben neu stanzen, nie einen zweiten Schein
    try { for (const gr of gruppen) if (!(SPRITES_ON && spriteBridge(x, y, px, py, z, gr))) bkDrawLagen(x, y, px, py, z, gr); if (slots && slots.length) drawSmall(k, px, py, z, now, x, y, slots); }
    finally { GLOW_MUTE = false; FOG = fog; g.restore(); }
  };
  if (GLPASS) glLive(px, py, l * z, u * z, r * z, d * z, f); else f();
}
// tileB eines Brückenfelds: ms = Bewegtes des Felds (nach Tiefe sortiert, noch nicht gezeichnet), figs = auf dem Deck. Folge: dahinter (B),
// h + Deko UNTER nachmalen, darunter (U), vd nachmalen, auf dem Deck, o + Deko VOR nachmalen, davor (F) – je im Rahmen des Bewegten
function bkDrawMoving(x, y, px, py, z, now, c, ms, figs, drawnMovers) {
  const fade = bkFadeNow(x, y), k = x + ',' + y, draw = list => { FOG = false; for (const m of list) { moverLive(m, z, now); drawnMovers.add(m); } };
  const glas = bkGlasAt(c), glass = gr => { if (!glas) return; const f = FOG; FOG = !ownedTile(x, y); try { bkGroup(x, y, px, py, z, [gr]); } finally { FOG = f; } };   // Kristall: Glas jedes Bild genau einmal
  const deck = () => { if (!figs) return; FOG = false;
    for (const m of figs.sort((a, b) => (a.px + a.py) - (b.px + b.py))) {
      const f = () => seeFaded(seeThrough, () => drawMover(m, z, now));   // 👁: auch Leute und Wagen oben blass
      if (GLPASS) { const p = toScreen(m.px, m.py), [l, u, r, d] = glMoverBox(m, z); glLive(p.x, p.y, l, u + HILL_H * z, r, d, f); }
      else f();
      drawnMovers.add(m);
    } };
  if (fade) { draw(ms); glass('t1'); deck(); glass('t2'); return; }       // blass: nie nachmalen
  const cls = new Map(ms.map(m => [m, bkMoverClass(m, c, x, y)])), B = ms.filter(m => cls.get(m) === 'B'), U = ms.filter(m => cls.get(m) === 'U'), F = ms.filter(m => cls.get(m) === 'F');
  const G = state.decos.has(k) ? bkDecoGroups(x, y, c) : null;
  const rB = B.length ? bkMoverRect(B, z) : null, rBU = B.length || U.length ? bkMoverRect(B.concat(U), z) : null;
  draw(B);
  if (rB) bkRedo(x, y, px, py, z, now, rB, ['h'], G && G.under);
  draw(U);
  if (rBU) bkRedo(x, y, px, py, z, now, rBU, ['vd']);
  glass('t1');
  deck();
  const rAll = rBU || figs ? bkMoverRect(B.concat(U, figs || []), z) : null;
  if (rAll) { rAll[1] -= HILL_H * z; bkRedo(x, y, px, py, z, now, rAll, ['o'], G && G.front); }
  glass('t2');
  draw(F);
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
  const { A, W, hf, sh, ts, stroke, line, band, deckTop, onEdge, vert } = bkKit(P, z, n, t0, t1, opts), L = BK_FUSS[art];
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
        if (t < t0 || tip < brClear()) continue;
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
  fuge: mix('#e6dcc8', '#96876e', 0.45), wall: 'aus', hair: true };   // wall: kein Widerlager an der Wand – die Felswand der Anhöhe bleibt sichtbar (Nutzer 12.10.2026)
function bkPaintStein(lage, P, z, n, t0, t1, weg, opts) {
  const { A, W, hf, T1, last, sh, ts, stroke, line, band, deckTop, onEdge } = bkKit(P, z, n, t0, t1, opts), L = BK_STEIN, B = n - 0.5;
  const S = opts.stone || brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)), gl = opts.gl || (() => 0), M = z < 0.6 ? 24 : 64;
  const arcTs = (lo, hi) => [lo, ...S.ts(M).filter(t => t > lo + 1e-9 && t < hi - 1e-9), hi];
  const rr = t => Math.min(S.ri(t) + S.S.ring, hf(t) - 0.2);               // Ring über der Leibung, nie über die Deckkante
  const hair = (pts, col, bg, w) => { const f = w * z; stroke(pts, L.hair && f < 0.6 ? mix(bg, col, Math.max(1, Math.round(f / 0.6 * 8)) / 8) : col, w); };
  const ramp = t => Math.max(0, Math.min(1, Math.min(t - A, B - t) / 0.45)), parH = t => 6.5 * ramp(t);   // Balustrade läuft an den Enden aus (kein Zipfel)
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
    if (opts.railPaint) { opts.railPaint(hf(t0)); return; }                  // Viadukt: Gleis auf dem Deck, keine Fugen (Entwurf)
    if (!weg) for (let j = Math.ceil((t0 - A) * 6 - 0.5 - 1e-9); A + (j + 0.5) / 6 < t1 + 1e-9; j++) {   // Fugen je ⅙ Feld, nie auf einer Kante
      const t = A + (j + 0.5) / 6;
      if (t < t0 - 1e-9 || (z < 0.6 && j % 2)) continue;
      hair([P(t, -W, hf(t)), P(t, W, hf(t))], L.fuge, L.deck, 0.3);
    }
    if (weg && opts.wegPaint) opts.wegPaint(hf);
  } else if (lage === 'o') balustrade(W, true);
}
