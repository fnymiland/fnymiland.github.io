// Entwurf Gleisbrücken übers Wasser (160c E0, plan-160c/karte-gleisbruecke-wasser.md): die abgenommenen Bahn-Modelle zwischen Anhöhen (C5:
// Holz mit Böcken, Metall/Kristall mit Fachwerk, Stein als Viadukt) über Wasser – Deck auf Landhöhe wie heute (Züge nicht angehoben), Fuß auf
// der Wasserfläche. Gerade Läufe: Modell im Weltraster (Fachwerk in Stücken zu 3 Feldern ab Weltkoordinate 0, Viadukt ein Bogen je Feld).
// Kurve, T, X (F4): schlichtes Kurvenstück im Material – Deck, Gleis, Geländer nur am Umriss; Variante A ohne Stützen, B mit Pfählen.
// Doppelgleis: eine breite Brücke, Geländer/Fachwerk nur außen. Nur Bild: drawRailBed wird während der Aufnahme für Brückenfelder umgeleitet.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/gleisbruecken-entwurf.js')).text()); await gleisEntwurf()   → tools/vorschau/gleis-*.png
(function gleisbrueckenEntwurf() {
  const WATER = -0.7 * DEPTH, H = 0, SEG = 3, W = BK_W;
  const NAME = { holz: 'Holz', stein: 'Stein', stahl: 'Metall', kristall: 'Kristall' }, MATS = ['holz', 'stein', 'stahl', 'kristall'];
  const LOOKS = new Map(), BOATS = [], CARS = [];
  let NEU = false, PFAEHLE = false, LICHT = false, MODE = 'all', O = null;
  const tileAt = (x, y) => state.tiles.get(x + ',' + y);
  const isBr = (x, y) => { const t = tileAt(x, y); return !!t && t.b === 'schiene' && !!t.bridge && LOOKS.has(x + ',' + y); };
  function straightAx(x, y) {                                               // gerade (oder Ende): Achse; Kurve, T, X: null
    const a = railArms(x, y);
    if (a.length === 1) return a[0][0] ? 0 : 1;
    if (a.length === 2 && a[0][0] === -a[1][0] && a[0][1] === -a[1][1]) return a[0][0] ? 0 : 1;
    if (!a.length) return (tileAt(x, y).rot || 0) & 1;
    return null;
  }
  const isStraight = (x, y, ax) => isBr(x, y) && straightAx(x, y) === ax;
  // Lauf längs ax, im Weltraster geschnitten (Stücke zu SEG Feldern; Holz/Stein: ganzer Lauf, die Böcke bzw. Bögen sitzen je Feld)
  function run(x, y, ax, cut) {
    const dx = ax ? 0 : 1, dy = ax ? 1 : 0, u = ax ? y : x, seg = q => Math.floor(q / SEG);
    let i0 = 0, i1 = 0;
    while (i0 < 200 && isStraight(x - dx * (i0 + 1), y - dy * (i0 + 1), ax) && (!cut || seg(u - i0 - 1) === seg(u))) i0++;
    while (i1 < 200 && isStraight(x + dx * (i1 + 1), y + dy * (i1 + 1), ax) && (!cut || seg(u + i1 + 1) === seg(u))) i1++;
    const land = j => terrainAt(x + dx * j, y + dy * j) !== 'water';
    return { i: i0, n: i0 + 1 + i1, landA: land(-i0 - 1), landB: land(i1 + 1), joinA: cut && isStraight(x - dx * (i0 + 1), y - dy * (i0 + 1), ax), joinB: cut && isStraight(x + dx * (i1 + 1), y + dy * (i1 + 1), ax) };
  }
  // ---------------------------------------------------------------------------------------------------------------------------------------
  // gerade: Bahn-Modell (Kopie von bkPaintBahn/bkPaintStein mit Deck auf H, Fuß im Wasser, Geländer nur außen)
  function gerade(lage, cx, cy, z, x, y, t, ax, L) {
    const art = L.mat, cut = art === 'stahl' || art === 'kristall', R = run(x, y, ax, cut), n = R.n, i = R.i, t0 = i - 0.5, t1 = i + 0.5, A = -0.5, B = n - 0.5;
    const lat = s => isStraight(x + (ax ? s : 0), y + (ax ? 0 : s), ax), latB = lat(-1), latF = lat(1);
    const P = (tt, s, h) => { const du = ax ? s : tt - i, dv = ax ? tt - i : s; return [cx + (du - dv) * TW / 2 * z, cy + (du + dv) * TH / 2 * z - h * z]; };
    const lw = f => Math.max(0.6, f * z), sh = col => ax ? shade(col, LIGHT.side) : col, last = t1 >= B - 1e-9;
    const seg = (ta, sa, ha, tb, sb, hb, col, w) => {
      let p = 0, q = 1;
      if (tb !== ta) { const u0 = (t0 - ta) / (tb - ta), u1 = (t1 - ta) / (tb - ta); p = Math.max(0, Math.min(u0, u1)); q = Math.min(1, Math.max(u0, u1)); }
      else if (ta < t0 - 1e-9 || (ta >= t1 - 1e-9 && !(last && ta <= t1 + 1e-9))) return;
      if (q <= p) return;
      const at = u => P(ta + (tb - ta) * u, sa + (sb - sa) * u, ha + (hb - ha) * u), a = at(p), b = at(q);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = C(col); g.lineWidth = lw(w); g.lineCap = 'butt'; g.stroke();
    };
    const line = (s, h, col, w, ta = A, tb = B) => seg(ta, s, h, tb, s, h, col, w);
    const vert = (tt, s, h0, h1, col, w) => seg(tt, s, h0, tt, s, h1, col, w);
    const T1 = t1 + (i < n - 1 || R.joinB ? 0.012 : 0);
    const band = (s, h0, h1, col) => { const a = Math.max(A, t0), b = Math.min(B, T1); if (b > a) poly([P(a, s, h1), P(b, s, h1), P(b, s, h0), P(a, s, h0)], C(col)); };
    const sB = latB ? -0.5 : -W, sF = latF ? 0.5 + 0.012 : W;                // Doppelgleis: ein Deck über die Lücke
    const deckTop = col => { const a = Math.max(A, t0), b = Math.min(B, T1); if (b > a) poly([P(a, sB, H), P(b, sB, H), P(b, sF, H), P(a, sF, H)], C(col)); };
    const onEdge = (K, fn) => { for (let k = Math.ceil((t0 - A) * K - 1e-9); A + k / K < t1 - 1e-9 || (last && A + k / K <= t1 + 1e-9); k++) fn(A + k / K, k); };
    const ft = tt => { const k = Math.round(tt + 0.5), d = ax ? [0, 1] : [1, 0], j = k - i; const wet = q => terrainAt(x + d[0] * q, y + d[1] * q) === 'water'; return wet(j - 1) && wet(j) ? WATER : 0; };
    const railPaint = () => O.drb(cx, cy - H * z, z, x, y, { ...t, bridge: false });
    const deckRest = () => { railPaint(); };
    const Lp = brPal(BK_BAHN[art], art, 'bahn', L.col, L.plank);
    const lamps = (lg, a = art) => { if (!LICHT) return; const S = brLampSpots(a, 'bahn', Math.min(n, 8)); if ((lg === S.back && latB) || (lg === S.front && latF)) return; bkLamps(lg, P, z, a, 'bahn', n, t0, t1, { h: H, hf: () => H, licht: 'an', dark: false }); };
    if (art === 'stein') { stein(lage, P, z, n, t0, t1, i, R, latB, latF, deckTop, railPaint, L, ax, sh); return lamps(lage, 'stein'); }
    if (art === 'holz') {
      const sup = []; for (let k = 0; k <= n; k++) { if ((k === 0 && R.landA) || (k === n && R.landB)) continue; sup.push(k - 0.5); }
      const supIn = sup.filter(tt => tt >= t0 - 1e-9 && (tt < t1 - 1e-9 || (last && tt <= t1 + 1e-9)));
      if (lage === 'h') {
        for (const tt of supIn) vert(tt, -W + 0.06, ft(tt), H - 3, Lp.side, 2.2);
        if (!latB) { onEdge(2, tt => vert(tt, -W, H, H + 8, Lp.side, 0.6)); line(-W, H + 8, Lp.side, 0.7); }
        for (const tt of supIn) { seg(tt, -W + 0.06, ft(tt) + 1, tt, W - 0.06, H - 3.5, Lp.side, 0.55); seg(tt, W - 0.06, ft(tt) + 1, tt, -W + 0.06, H - 3.5, Lp.side, 0.55); }
      } else if (lage === 'v') {
        for (const tt of supIn) vert(tt, W - 0.06, ft(tt), H - 3, Lp.side, 2.2);
        if (!latF) band(W, H - 3, H, sh(Lp.beam));
      } else if (lage === 'd') {
        deckTop(Lp.deck); onEdge(9, tt => seg(tt, sB, H, tt, sF, H, Lp.plank, 0.3)); deckRest();
      } else if (lage === 'o' && !latF) {
        onEdge(2, tt => vert(tt, W, H, H + 8, Lp.rail, 0.7)); line(W, H + 8, Lp.rail, 0.9); line(W, H + 4, Lp.rail, 0.5);
      }
      return lamps(lage);
    }
    // Metall, Kristall: Fachwerk je Stück (SEG Felder im Weltraster), an den Stoßstellen Pfeiler bis aufs Wasser
    const truss = (s, col, w) => {
      const Tt = BR_TRUSS.T, a = A + BR_TRUSS.inset, b = B - BR_TRUSS.inset, m = 2 * n;
      line(s, H, col, 0.7 * w); line(s, H + Tt, col, 0.7 * w, a, b);
      seg(A, s, H, a, s, H + Tt, col, 0.5 * w); seg(B, s, H, b, s, H + Tt, col, 0.5 * w);
      for (let j = 0; j < m; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; seg(p, s, H + Tt, q, s, H, col, 0.5 * w); if (j) vert(p, s, H, H + Tt, col, 0.4 * w); }
    };
    const pierTs = [...(R.landA ? [] : [A]), ...(R.landB ? [] : [B])].filter(tt => tt >= t0 - 1e-9 && (tt < t1 - 1e-9 || (last && tt <= t1 + 1e-9)));
    const pier = s => { for (const tt of pierTs) { vert(tt, s, WATER, H - 4, Lp.beam, 2.4); } };
    if (lage === 'h') { pier(-W + 0.06); if (!latB) truss(-W - 0.02, Lp.back, 1.2); }
    else if (lage === 'v') { pier(W - 0.06); if (!latF) { band(W, H - 4, H, sh(Lp.beam)); line(W, H, Lp.edge, 0.3); line(W, H - 4, Lp.edge, 0.3); } }
    else if (lage === 'd') { deckTop(Lp.deck); deckRest(); }
    else if (lage === 'o' && !latF) { truss(W + 0.02, Lp.front, 1.6); if (Lp.hi) line(W + 0.02, H + 11, Lp.hi, 0.35, A + 0.15, B - 0.15); }
    lamps(lage);
    if (art === 'kristall') { if (lage === 'd') lamps('t1'); if (lage === 'o') lamps('t2'); }   // Kristall: Lichtstreifen in eigenen Lagen (C7)
  }
  // Stein: Viadukt flach – ein Bogen je Feld (Weltraster), Pfeiler auf den Kanten, Balustrade nur außen
  function stein(lage, P, z, n, t0, t1, i, R, latB, latF, deckTop, railPaint, L, ax, sh) {
    const Lp = brPal(BK_STEIN, 'stein', 'bahn', L.col, null), S = BR_STEIN, A = -0.5, B = n - 0.5, pw = 0.11, cover = 1.6, last = t1 >= B - 1e-9;
    const tsK = (a, b, K = 16) => Array.from({ length: K + 1 }, (_, j) => a + (b - a) * j / K);
    const ri = tt => { const k = Math.round(tt), a = k - 0.5 + pw, c = k + 0.5 - pw; if (tt < a || tt > c) return null; const u = (tt - a) / (c - a); return Math.min(WATER + 0.2 + (H - cover - WATER) * Math.sqrt(Math.sin(Math.PI * u)), H - cover); };
    const k = i, a = Math.max(t0, k - 0.5), c = t1;
    const face = (s, col) => {
      const T = tsK(a, c, 24), bot = T.map(tt => { const r = ri(tt); return P(tt, s, r == null ? WATER : r); });
      poly([...T.map(tt => P(tt, s, H)), ...bot.reverse()], C(col));
    };
    const ramp = tt => Math.max(0, Math.min(1, Math.min(tt - A, B - tt) / 0.45)), parH = tt => S.par * (R.landA || tt > A + 0.5 ? (R.landB || tt < B - 0.5 ? 1 : ramp(tt)) : ramp(tt));
    const balustrade = (s, vorn) => {
      const tone = vorn ? Lp.top : shade(Lp.top, -0.14), T = tsK(t0, t1 + (i < n - 1 ? 0.012 : 0), 12);
      poly([...T.map(tt => P(tt, s, H + parH(tt))), ...T.slice().reverse().map(tt => P(tt, s, H))], C(shade(tone, -0.05)));
      g.beginPath(); for (let j = 0; j <= 10; j++) { const tt = t0 + (t1 - t0) * (j + 0.5) / 11, p = P(tt, s, H + 0.9), q = P(tt, s, H + parH(tt) - 1.6); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.strokeStyle = C(Lp.joint); g.lineWidth = Math.max(0.6, 0.5 * z); g.lineCap = 'butt'; g.stroke();
      const hl = T.map(tt => P(tt, s, H + parH(tt))); g.beginPath(); hl.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = C(shade(Lp.top, vorn ? 0.06 : -0.04)); g.lineWidth = Math.max(0.6, 0.65 * z); g.stroke();
    };
    if (lage === 'h') {
      const T = tsK(Math.max(t0, k - 0.5 + pw), Math.min(t1, k + 0.5 - pw), 24).filter(tt => ri(tt) != null);   // Laibung
      if (T.length > 1) poly([...T.map(tt => P(tt, W, ri(tt))), ...T.slice().reverse().map(tt => P(tt, -W, ri(tt)))], C(Lp.inner));
      if (!latB) balustrade(-W, false);
    } else if (lage === 'v') {
      if (!latF) {
        face(W, sh(Lp.face));
        const T = tsK(k - 0.5 + pw, k + 0.5 - pw, 20); g.beginPath(); T.forEach((tt, j) => { const p = P(tt, W, ri(tt)); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
        g.strokeStyle = C(sh(Lp.edge)); g.lineWidth = Math.max(0.6, 0.5 * z); g.stroke();
      }
    } else if (lage === 'd') { deckTop(Lp.deck); railPaint(); }
    else if (lage === 'o' && !latF) balustrade(W, true);
  }
  // ---------------------------------------------------------------------------------------------------------------------------------------
  // Kurve, T, X: Deck in der Gleisform, Geländer nur am Umriss (Stücke in fremden Bändern fallen weg), vorne/hinten nach der Normalen
  const PAL = art => art === 'stein' ? { deck: BK_STEIN.deck, edge: BK_STEIN.edge, side: BK_STEIN.face, rail: BK_STEIN.top, post: BK_STEIN.joint }
    : art === 'holz' ? { deck: BK_BAHN.holz.deck, edge: BK_BAHN.holz.plank, side: BK_BAHN.holz.beam, rail: BK_BAHN.holz.rail, post: BK_BAHN.holz.side }
    : art === 'stahl' ? { deck: BK_BAHN.stahl.deck, edge: BK_BAHN.stahl.edge, side: BK_BAHN.stahl.beam, rail: BK_BAHN.stahl.front, post: BK_BAHN.stahl.back }
    : { deck: BK_BAHN.kristall.deck, edge: BK_BAHN.kristall.edge, side: BK_BAHN.kristall.beam, rail: BK_BAHN.kristall.front, post: BK_BAHN.kristall.back, hi: BK_BAHN.kristall.hi };
  function fein(pts, step = 0.04) {
    const out = [pts[0]];
    for (let j = 1; j < pts.length; j++) { const [a, b] = [pts[j - 1], pts[j]], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let q = 1; q <= m; q++) out.push([a[0] + (b[0] - a[0]) * q / m, a[1] + (b[1] - a[1]) * q / m]); }
    return out;
  }
  const distSeg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)); return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy); };
  const distPath = (p, pts) => { let d = 1e9; for (let j = 1; j < pts.length; j++) d = Math.min(d, distSeg(p, pts[j - 1], pts[j])); return d; };
  function umriss(segs) {                                                    // Stücke [p, q, front] am Rand der Vereinigung
    const out = [];
    segs.forEach((sg, si) => {
      for (const s of [1, -1]) {
        const side = fein(offsetPath(fein(sg, 0.05), W * s));
        for (let j = 1; j < side.length; j++) {
          const p = side[j - 1], q = side[j], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
          if (segs.some((o, oi) => oi !== si && distPath(m, o) < W - 0.01)) continue;
          if (Math.max(Math.abs(m[0]), Math.abs(m[1])) > 0.5 + 1e-6) continue;
          const d = [q[0] - p[0], q[1] - p[1]], nrm = [-d[1] * s, d[0] * s];   // Normale nach außen
          out.push([p, q, nrm[0] + nrm[1] > 0, nrm]);
        }
      }
    });
    return out;
  }
  function kurve(lage, cx, cy, z, x, y, t, L) {
    const art = L.mat, arms = railArms(x, y), segs = railSegments(arms, t), pal = PAL(art);
    const Lw = ([u, v], h) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z];
    const U = umriss(segs), lw = f => Math.max(0.6, f * z);
    const strokeSeg = (p, q, h0, h1, col, w) => { const a = Lw(p, h0), b = Lw(q, h1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = C(col); g.lineWidth = lw(w); g.lineCap = 'butt'; g.stroke(); };
    const gelaender = front => {
      const parts = U.filter(e => e[2] === front);
      if (art === 'stein') { for (const [p, q] of parts) poly([Lw(p, H), Lw(q, H), Lw(q, H + 5), Lw(p, H + 5)], C(front ? pal.rail : shade(pal.rail, -0.14))); for (const [p, q] of parts) strokeSeg(p, q, H + 5, H + 5, shade(pal.rail, 0.06), 0.65); return; }
      const top = art === 'holz' ? 8 : 7, col = front ? pal.rail : pal.post;
      let acc = 0; for (const [p, q] of parts) { acc += Math.hypot(q[0] - p[0], q[1] - p[1]); if (acc >= 0.25) { acc = 0; strokeSeg(q, q, H, H + top, col, 0.6); } }
      for (const [p, q] of parts) { strokeSeg(p, q, H + top, H + top, col, 0.9); if (art === 'holz') strokeSeg(p, q, H + 4, H + 4, col, 0.5); }
      if (art === 'kristall' && front) for (const [p, q] of parts) strokeSeg(p, q, H + top + 0.6, H + top + 0.6, pal.hi, 0.35);
    };
    if (lage === 'h') {
      if (PFAEHLE) for (const sg of segs) alongPath(sg, 0.5, (p, dir) => { for (const s of [1, -1]) { const q = [p[0] - dir[1] * (W - 0.06) * s, p[1] + dir[0] * (W - 0.06) * s]; if (Math.max(Math.abs(q[0]), Math.abs(q[1])) < 0.5) strokeSeg(q, q, WATER, H - 2, pal.post, 2.2); } });
      gelaender(false);
    } else if (lage === 'v') {
      for (const [p, q, f] of U) if (f) poly([Lw(p, H), Lw(q, H), Lw(q, H - 2.6), Lw(p, H - 2.6)], C(shade(pal.side, 0)));
    } else if (lage === 'd') {
      for (const shp of roadShapes(arms, t, W)) poly(shp.map(q => Lw(q, H)), C(pal.edge));
      for (const shp of roadShapes(arms, t, W - 0.03)) poly(shp.map(q => Lw(q, H)), C(pal.deck));
      O.drb(cx, cy, z, x, y, { ...t, bridge: false });
    } else if (lage === 'o') gelaender(true);
  }
  // Ersatz für drawRailBed: Brückenfelder im Raster neu, sonst wie heute
  function maler(cx, cy, z, x, y, t, armsIn) {
    const L = NEU && t && t.bridge && !armsIn && LOOKS.get(x + ',' + y);
    if (!L) return O.drb(cx, cy, z, x, y, t, armsIn);
    const ax = straightAx(x, y), lagen = MODE === 'front' ? ['v', 'd', 'o'] : MODE === 'o' ? ['o'] : ['h', 'v', 'd', 'o'];
    for (const l of lagen) ax == null ? kurve(l, cx, cy, z, x, y, t, L) : gerade(l, cx, cy, z, x, y, t, ax, L);
  }
  // Zug: danach das vordere Geländer der Felder um den Wagen (gleiche Reihe) – der Zug fährt im Fachwerk bzw. hinter dem Geländer
  function wagen(car, z, now) {
    O.dtc(car, z, now);
    if (!NEU) return;
    const kx = Math.round(car.px), ky = Math.round(car.py), along = Math.abs(car.du) > Math.abs(car.dv) ? [1, 0] : [0, 1];
    const m0 = MODE; MODE = 'o';
    try { for (const j of [-1, 0, 1]) { const x = kx + along[0] * j, y = ky + along[1] * j, t = tileAt(x, y); if (isBr(x, y)) { const p = toScreen(x, y); maler(p.x, p.y, z, x, y, t); } } }
    finally { MODE = m0; }
  }
  // ---------------------------------------------------------------------------------------------------------------------------------------
  const REG = [2, 2, 70, 74];
  function leeren() {
    for (let y = REG[1] - 2; y <= REG[3]; y++) for (let x = REG[0] - 2; x <= REG[2]; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); if (state.bruecken) state.bruecken.clear(); LOOKS.clear(); BOATS.length = 0; CARS.length = 0;
  }
  const wasser = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water'); };
  const gleis = (x, y, look) => { const w = terrainAt(x, y) === 'water'; state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(w ? { bridge: true } : {}) }); if (w && look) LOOKS.set(x + ',' + y, look); };
  const linie = (x0, y0, x1, y1, look) => { const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); for (let x = x0, y = y0; ; x += dx, y += dy) { gleis(x, y, look); if (x === x1 && y === y1) break; } };
  // Fälle je Feld (x0, y0: Ecke eines 10 × 10-Teichs mit Ufer)
  const FAELLE = {
    gerade: (x0, y0, L) => { wasser(x0 + 2, y0, x0 + 6, y0 + 8); linie(x0, y0 + 4, x0 + 8, y0 + 4, L); return [x0 + 4, y0 + 4]; },
    nordsued: (x0, y0, L) => { wasser(x0, y0 + 2, x0 + 8, y0 + 6); linie(x0 + 4, y0, x0 + 4, y0 + 8, L); return [x0 + 4, y0 + 4]; },
    kurve: (x0, y0, L) => { wasser(x0 + 2, y0 + 2, x0 + 7, y0 + 8); linie(x0, y0 + 5, x0 + 4, y0 + 5, L); linie(x0 + 4, y0 + 4, x0 + 4, y0, L); return [x0 + 4, y0 + 4]; },
    t: (x0, y0, L) => { wasser(x0 + 2, y0 + 2, x0 + 6, y0 + 7); linie(x0, y0 + 4, x0 + 8, y0 + 4, L); linie(x0 + 4, y0 + 5, x0 + 4, y0 + 9, L); return [x0 + 4, y0 + 5]; },
    x: (x0, y0, L) => { wasser(x0 + 2, y0 + 2, x0 + 6, y0 + 6); linie(x0, y0 + 4, x0 + 8, y0 + 4, L); linie(x0 + 4, y0, x0 + 4, y0 + 3, L); linie(x0 + 4, y0 + 5, x0 + 4, y0 + 8, L); return [x0 + 4, y0 + 4]; },
    doppel: (x0, y0, L) => { wasser(x0 + 2, y0, x0 + 6, y0 + 8); linie(x0, y0 + 3, x0 + 8, y0 + 3, L); linie(x0, y0 + 5, x0 + 8, y0 + 5, L); return [x0 + 4, y0 + 4]; },   // direkt nebeneinander verbinden sich Gleise quer (Gitter) – mit einem Feld Abstand
  };
  const FNAME = { gerade: 'gerade', nordsued: 'Nord-Süd', kurve: 'Kurve', t: 'Abzweig (T)', x: 'Kreuzung (X)', doppel: 'zwei Gleise nebeneinander' };
  function fertig() {
    for (const t of state.tiles.values()) delete t.born;
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); if (typeof growWorld === 'function') growWorld();
    groundVersion++; recalc(); floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  function shot(cx, cy, zz, Wd, Hd, nt, neu, up = 0) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    O = { drb: drawRailBed, dtc: drawTrainCar, dbo: drawBridgeOver, sm: shipMovers, tc: trainCars, off: GL.off, sf: spriteForce, na: nightAt, gh: gameHour, sync: syncMovers };
    NEU = neu; drawRailBed = maler; drawTrainCar = wagen; shipMovers = () => BOATS.map(b => ({ ...b })); trainCars = () => CARS.map(c => ({ ...c })); syncMovers = () => {};
    drawBridgeOver = (...a) => { const m0 = MODE; MODE = 'front'; try { return O.dbo(...a); } finally { MODE = m0; } };
    GL.off = true; spriteForce = false; nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12);
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 4; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally {
      drawRailBed = O.drb; drawTrainCar = O.dtc; drawBridgeOver = O.dbo; shipMovers = O.sm; trainCars = O.tc; GL.off = O.off; spriteForce = O.sf; nightAt = O.na; gameHour = O.gh; syncMovers = O.sync;
      NEU = false; resetDrawCaches(); groundVersion++;
    }
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, Wd, Hd); q.drawImage(canvas, canvas.width / 2 - Wd / 2, canvas.height / 2 - Hd / 2, Wd, Hd, 0, 0, Wd, Hd);
    return c;
  }
  async function blatt(name, shots, cols, Wd, Hd) {
    const rows = Math.ceil(shots.length / cols), s = document.createElement('canvas'); s.width = cols * (Wd + 16); s.height = rows * (Hd + 46);
    const q = s.getContext('2d'); q.fillStyle = '#fffaf0'; q.fillRect(0, 0, s.width, s.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (Wd + 16), Y = Math.floor(i / cols) * (Hd + 46) + 36; if (c) q.drawImage(c, X, Y); q.font = '800 19px system-ui'; q.fillStyle = '#6b4f3a'; q.fillText(l, X + 4, Y - 10); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: s.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  }
  const zug = (px, py, du, dv, model = 'regio') => { const kind = TRAIN_KIND[model], tr = { kind, col: 0, model, route: {} }; for (let j = 0; j < kind.n; j++) CARS.push({ train: tr, px: px - du * j * (kind.len + kind.gap), py: py - dv * j * (kind.len + kind.gap), du, dv, i: j, n: kind.n, len: kind.len, d: 0, mv: 1 }); };
  // Blatt je Material: 6 Fälle × heute | neu | neu Nacht (Licht an)
  async function materialBlatt(mat, Wd = 440, Hd = 340) {
    leeren();
    const pos = [], L = { mat };
    Object.keys(FAELLE).forEach((f, j) => { const x0 = 4 + (j % 3) * 14, y0 = 4 + Math.floor(j / 3) * 14; pos.push([FAELLE[f](x0, y0, L), f]); });
    fertig();
    const shots = [];
    for (const [[cx, cy], f] of pos) {
      const kv = f === 'kurve' || f === 't' || f === 'x';
      shots.push([shot(cx, cy, 2.1, Wd, Hd, 0, false, 4), `${FNAME[f]} · heute`]);
      PFAEHLE = false; shots.push([shot(cx, cy, 2.1, Wd, Hd, 0, true, 4), `${NAME[mat]} · neu${kv ? ' · A ohne Stützen' : ''}`]);
      if (kv) { PFAEHLE = true; shots.push([shot(cx, cy, 2.1, Wd, Hd, 0, true, 4), `${NAME[mat]} · neu · B mit Pfählen`]); PFAEHLE = false; }
      else { LICHT = true; shots.push([shot(cx, cy, 2.1, Wd, Hd, NIGHT_MAX, true, 4), `${NAME[mat]} · neu · Nacht, Licht`]); LICHT = false; }
    }
    return blatt(`gleis-${mat}.png`, shots, 3, Wd, Hd);
  }
  // langer Lauf (14 Felder) mit Zug darauf und Boot quer, je Material
  async function laufBlatt(Wd = 760, Hd = 420) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => { const y0 = 4 + i * 12; wasser(6, y0, 19, y0 + 8); linie(3, y0 + 4, 22, y0 + 4, { mat }); pos.push([mat, y0]); });
    fertig();
    const shots = [];
    for (const [mat, y0] of pos) {
      CARS.length = 0; BOATS.length = 0; zug(10.6, y0 + 4, 1, 0); BOATS.push({ boat: true, ship: 'dampfer', px: 15, py: y0 + 4.05, du: 0, dv: 1 });
      shots.push([shot(12.5, y0 + 4, 1.25, Wd, Hd, 0, false, 4), `14 Felder · Zug · Boot quer · heute`]);
      shots.push([shot(12.5, y0 + 4, 1.25, Wd, Hd, 0, true, 4), `${NAME[mat]} · neu`]);
    }
    CARS.length = 0; BOATS.length = 0;
    return blatt('gleis-lauf.png', shots, 2, Wd, Hd);
  }
  // nah: Zug auf der Brücke und Boot darunter, je Material (gerade und Kurve)
  async function nahBlatt(Wd = 460, Hd = 360) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => { const x0 = 4 + i * 14; pos.push([mat, FAELLE.gerade(x0, 4, { mat }), FAELLE.kurve(x0, 20, { mat })]); });
    fertig();
    const shots = [];
    for (const [mat, [gx, gy], [kx, ky]] of pos) {
      CARS.length = 0; BOATS.length = 0; zug(gx + 0.3, gy, 1, 0); BOATS.push({ boat: true, ship: 'dampfer', px: gx + 1, py: gy + 0.1, du: 0, dv: 1 });
      shots.push([shot(gx + 0.5, gy, 2.6, Wd, Hd, 0, true, 6), `${NAME[mat]} · Zug und Boot`]);
      CARS.length = 0; BOATS.length = 0; zug(kx - 0.6, ky + 1, 1, 0, 'tram');
      shots.push([shot(kx, ky + 0.5, 2.6, Wd, Hd, 0, true, 6), `${NAME[mat]} · Kurve mit Zug`]);
    }
    CARS.length = 0; BOATS.length = 0;
    return blatt('gleis-nah.png', shots, 4, Wd, Hd);
  }
  // echte Stände (?welt=og bzw. ?welt=bauland): alle Gleisbrücken in einem Material; Ausschnitte an Kurven, Abzweigen und dem längsten Lauf
  async function weltBlatt(name, Wd = 560, Hd = 400) {
    LOOKS.clear(); BOATS.length = 0; CARS.length = 0;
    const br = [...state.tiles].filter(([k, t]) => t.b === 'schiene' && t.bridge).map(([k]) => keyXY(k));
    for (const [x, y] of br) LOOKS.set(x + ',' + y, { mat: 'holz' });
    const krumm = br.filter(([x, y]) => straightAx(x, y) == null), spots = [];
    const weit = (p, list) => list.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) > 8);
    for (const p of krumm) if (spots.length < 3 && weit(p, spots)) spots.push(p);
    let best = null; for (const [x, y] of br) { const ax = straightAx(x, y); if (ax == null) continue; const R = run(x, y, ax, false); if (!best || R.n > best.n) best = { n: R.n, x, y, ax, i: R.i }; }
    if (best) { const m = Math.floor(best.n / 2) - best.i; spots.push([best.x + (best.ax ? 0 : m), best.y + (best.ax ? m : 0)]); }
    const shots = [];
    for (const [x, y] of spots) {
      shots.push([shot(x, y, 1.6, Wd, Hd, 0, false, 4), `${name} ${x},${y} · heute`]);
      for (const mat of MATS) { for (const k of LOOKS.keys()) LOOKS.set(k, { mat }); shots.push([shot(x, y, 1.6, Wd, Hd, 0, true, 4), `${NAME[mat]} · neu`]); }
    }
    return { blatt: await blatt(`gleis-welt-${name}.png`, shots, 5, Wd, Hd), felder: br.length, krumm: krumm.length, laengster: best && best.n };
  }
  window.gleisWelt = weltBlatt;
  window.gleisEntwurf = async (nur = null) => {
    closeModal(); closePanel();
    const out = {};
    for (const mat of MATS) if (!nur || nur.includes(mat)) out[mat] = await materialBlatt(mat);
    if (!nur || nur.includes('lauf')) out.lauf = await laufBlatt();
    if (!nur || nur.includes('nah')) out.nah = await nahBlatt();
    return out;
  };
  window.gleisDbg = { leeren, linie, wasser, fertig, shot, blatt, LOOKS, BOATS, CARS, zug, FAELLE };
  return 'ok';
})();
