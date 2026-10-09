'use strict';
// ---------------------------------------------------------------------------
// Überdachungen (Block 138, Entwürfe mit dem Nutzer 09.10.2026): eine Fläche über Wegen, auch 2–3 breit. Stützen stellt man
// selbst (kleines Ding „Stütze“ auf Ecken/Seitenmitten/Eckpunkten, wie Laternen) – das Spiel setzt keine von selbst.
//
// state.roofs: Feld → { form?, col? } (Formen: DECO_LOOKS.dach – Pergola, Glas, Markise, Arkaden; col nur für die Markise).
// Geometrie: jedes überdachte Feld in 3 × 3 Teilstücke, Grenzen bei x − ½, x − RW, x + RW, x + ½ (RW = Platz der Laternen am
// Wegrand, dort stehen die Stützen genau unter der Dachkante). Mitte immer, Rand in Richtung d nur, wenn der Nachbar dort auch
// überdacht ist (gleiche Form), Ecke nur mit beiden Nachbarn UND dem schrägen – nichts überlappt, breite Flächen wachsen ohne Fuge
// zusammen. Dachform aus dem Abstand zum nächsten freien Teilstück: am Rand H, nach innen gewölbt (breit: oben flach) – so laufen
// Gewölbe, Latten und Streifen von selbst um Ecken. Je Feld als Bildchen gemerkt (roofSprites), gezeichnet nach den Figuren des
// Felds (render.js, tileB) – sie laufen darunter durch.
// ---------------------------------------------------------------------------
const RW = 0.42, ROOF_H = 22, ROOF_STRIPE = 0.09;
const PERG_T = 0.05, PERG_BH = 1.6;   // Pergola (Nutzer wählte Entwurf D): Randbalken und Pfosten gleich stark (Felder), Balkenhöhe
// Rahmen je Form nach dem Modell der Pergola (Nutzer, 09.10.2026: „auf Basis dieses Modells die anderen 3 anpassen“): Randbalken
// (Stärke T, Höhe BH unter H) auf der Dachkante, Ecken auf Gehrung, Pfosten gleich stark bündig darunter, Balken über inneren Pfosten
const ROOF_FRAME = {
  pergola: { T: PERG_T, BH: PERG_BH, top: '#9c6a45', sU: '#6f4529', sV: '#8a5a3a', post: '#8a5a3a' },
  glas:    { T: 0.03, BH: 1.0, top: '#7d8893', sU: '#4a535d', sV: '#5d6772', post: '#5d6772' },
  markise: { T: 0.03, BH: 0.9, top: '#ffffff', sU: '#d8d2c6', sV: '#ece6da', post: '#ece6da' },
  arkaden: { T: 0.09, BH: 3.0, top: '#e8dec9', sU: '#b3a283', sV: '#c8b896', post: '#dccfb4', solid: true },   // massiv: Platten bündig, Innenseiten verdeckt
};
const roofAt = (x, y) => !!state.roofs && state.roofs.get(x + ',' + y);
const roofForm = r => (DECO_LOOKS.dach.forms[(r && r.form) || 0] || DECO_LOOKS.dach.forms[0]).id;
const ROOF_STY = {
  pergola: { post: '#8a5a3a', beam: '#6f4529', leaf: ['#4f9a3c', '#6fbf4f', '#3f8a35'], flower: ['#f28cb1', '#ffffff', '#c3a8e6', '#ffd23f'], vault: 0, lamp: true },
  glas:    { post: '#56606b', rib: 'rgba(70,82,95,0.9)', glass: 'rgba(196,232,246,0.42)', vault: 6, lamp: true },
  markise: { post: '#efe9dc', vault: 4 },
  arkaden: { stone: '#dccfb4', side: '#c8b896', dark: '#b3a283', top: '#e8dec9', vault: 0, lamp: false },   // geschlossenes Dach: kein Licht von oben sichtbar
};
// Teilstück-Gitter: Index s (je Achse) = 3·x + i, i ∈ {−1, 0, 1}
// Teilstück eines Punkts (Weltkoordinate) – mit Spielraum: −50,42 − (−50) ist im Rechner −0,4200000000000017, und ohne ROOF_EPS
// zählte ein Punkt genau auf der Dachkante je nach Lage auf der Insel als „draußen“ (Nutzer: „selbe Version, anderes Verhalten“)
const ROOF_EPS = 1e-6;
// Brüstung oben auf Steinarkaden (Nutzer, 09.10.2026: „oben drauf ein Zaun oder eine Mauer wie bei C, die rumgeht“ – alle drei wählbar,
// abschaltbar): r.par = 1 Mauer, 2 Balustrade, 3 Geländer; fehlt = keine. Steht genau auf dem Steinrahmen (gleiche Stärke, gleiche Ecken)
const ROOF_PAR = [null, { id: 'mauer', name: 'Mauer', h: 6 }, { id: 'balustrade', name: 'Balustrade', h: 7 }, { id: 'gelaender', name: 'Geländer', h: 7 }];
const roofSubOf = w => { const k = Math.round(w), f = w - k; return 3 * k + (f < -RW - ROOF_EPS ? -1 : f > RW + ROOF_EPS ? 1 : 0); };
const roofLo = s => { const x = Math.round(s / 3), i = s - 3 * x; return i === -1 ? x - 0.5 : i === 0 ? x - RW : x + RW; };
const roofHi = s => { const x = Math.round(s / 3), i = s - 3 * x; return i === -1 ? x - RW : i === 0 ? x + RW : x + 0.5; };
// Fläche einer Form: cov(x, y) sagt, ob das Feld dazugehört (Spiel: gleiche Form; Vorschaubild: nur ein Feld)
function roofArea(cov) {
  const subMemo = new Map();
  const sub = (su, sv) => {
    const key = su * 100003 + sv, m = subMemo.get(key);
    if (m !== undefined) return m;
    const x = Math.round(su / 3), y = Math.round(sv / 3), i = su - 3 * x, j = sv - 3 * y;
    const r = cov(x, y) && !(i && !cov(x + i, y)) && !(j && !cov(x, y + j)) && !(i && j && !cov(x + i, y + j));
    subMemo.set(key, r);
    return r;
  };
  // freie Teilstücke direkt am Dach (nur die zählen für den Abstand – das nächste Freie liegt immer am Rand), je Feld und Reichweite
  const rings = new Map();
  const ring = (x, y, reach) => {
    const key = x + ',' + y + ',' + reach;
    let l = rings.get(key);
    if (l) return l;
    l = [];
    for (let su = 3 * x - reach; su <= 3 * x + reach; su++) for (let sv = 3 * y - reach; sv <= 3 * y + reach; sv++) {
      if (sub(su, sv)) continue;
      if (sub(su + 1, sv) || sub(su - 1, sv) || sub(su, sv + 1) || sub(su, sv - 1) || sub(su + 1, sv + 1) || sub(su - 1, sv - 1) || sub(su + 1, sv - 1) || sub(su - 1, sv + 1))
        l.push([roofLo(su), roofHi(su), roofLo(sv), roofHi(sv)]);
    }
    rings.set(key, l);
    return l;
  };
  const memo = new Map();
  // Abstand von (u, v) zum nächsten freien Teilstück, gedeckelt bei cap; box: eckig (max) statt rund – Linien gleichen Abstands
  // laufen dann längs der Achsen (Markisenstreifen ohne Treppen)
  const dist = (u, v, cap = RW, box = false) => {
    const key = Math.round(u * 400) + ',' + Math.round(v * 400) + ',' + cap + (box ? 'b' : '');
    const m = memo.get(key);
    if (m !== undefined) return m;
    const x = Math.round(u), y = Math.round(v), reach = Math.ceil(cap * 3) + 2;
    let d = cap;
    for (const [u0, u1, v0, v1] of ring(x, y, reach)) {
      const dx = Math.max(u0 - u, 0, u - u1), dy = Math.max(v0 - v, 0, v - v1);
      const e = box ? Math.max(dx, dy) : Math.hypot(dx, dy);
      if (e < d) d = e;
    }
    memo.set(key, d);
    return d;
  };
  return { sub, dist };
}
// Ränder eines Felds: Kanten zwischen überdachtem und freiem Teilstück – { ax: 'u'|'v' (Linie u = at bzw. v = at), n: ±1 nach
// außen, at, a, b (Lauf über das Teilstück) }. Für Bögen und Glasränder zählt der ganze Lauf über die Felder hinweg (roofRun).
function roofEdges(A, x, y) {
  const out = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const su = 3 * x + i, sv = 3 * y + j;
    if (!A.sub(su, sv)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (A.sub(su + dx, sv + dy)) continue;
      if (dx) out.push({ ax: 'u', n: dx, at: dx > 0 ? roofHi(su) : roofLo(su), a: roofLo(sv), b: roofHi(sv), s: sv, si: su });
      else out.push({ ax: 'v', n: dy, at: dy > 0 ? roofHi(sv) : roofLo(sv), a: roofLo(su), b: roofHi(su), s: su, si: sv });
    }
  }
  return out;
}
// ganzer Lauf einer Kante (über Nachbarfelder): Anfang und Ende entlang der Linie
function roofRun(A, e) {
  const has = s => e.ax === 'u' ? A.sub(e.si, s) && !A.sub(e.si + e.n, s) : A.sub(s, e.si) && !A.sub(s, e.si + e.n);
  let s0 = e.s, s1 = e.s;
  for (let k = 0; k < 600 && has(s0 - 1); k++) s0--;
  for (let k = 0; k < 600 && has(s1 + 1); k++) s1++;
  return [roofLo(s0), roofHi(s1)];
}
// Stützen auf einer Linie (Weltkoordinaten längs der Linie): Stütze-Dekos, deren Platz genau auf der Dachkante steht
function roofPillarsOn(e, a, b) {
  const out = [];
  if (!state.decos.size) return out;
  const lo = Math.floor(Math.min(a, b)) - 1, hi = Math.ceil(Math.max(a, b)) + 1, line = e.at;
  const cand = e.ax === 'u' ? [Math.floor(line), Math.ceil(line)] : [Math.floor(line), Math.ceil(line)];
  for (const c of new Set(cand)) for (let t = lo; t <= hi; t++) {
    const [x, y] = e.ax === 'u' ? [c, t] : [t, c], ds = state.decos.get(x + ',' + y);
    if (!ds) continue;
    ds.forEach((d, i) => {
      if (!d || d.b !== 'stuetze') return;
      const [u, v] = pillarPos(x, y, i, d), on = e.ax === 'u' ? u : v, along = e.ax === 'u' ? v : u;
      if (Math.abs(on - line) < 0.04 && along > a - 0.04 && along < b + 0.04) out.push(along);
    });
  }
  return out;
}
const roofPar = r => r && roofForm(r) === 'arkaden' && ROOF_PAR[r.par] ? ROOF_PAR[r.par] : null;
// gesammelte Zeichenschritte in Weltkoordinaten [u, v, Höhe] – für das Dachbild und für das, was davor live gezeichnet wird
function roofOps(ops, P, lw) {
  for (const o of ops) {
    g.beginPath(); o.pts.forEach((q, i) => { const p = P(q[0], q[1], q[2]); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
    if (o.line) { g.strokeStyle = C(o.col); g.lineWidth = o.line * lw; g.lineCap = 'round'; g.stroke(); continue; }
    g.closePath(); g.fillStyle = C(o.col); g.fill(); g.strokeStyle = C(o.col); g.lineWidth = 0.3 * lw; g.lineJoin = 'round'; g.stroke();
  }
}
// Liegt hinter dem Fuß einer Öffnung gleich der Dachrand (näher als 0,3)? Dann keine eigene Fuß-Brüstung (sonst zwei fast aufeinander,
// Nutzer: „Ecken bündig“) – die Seiten laufen bis an die Randbrüstung. edge: Lage der Dachkante längs der Treppe; joints: wo die Seiten
// auf die Randbrüstung treffen (quer), für deren Pfosten
function holeFootEdge(h) {
  const longV = !!h.Dv, d = h.Dv || h.Du, sg = d > 0 ? -1 : 1, footE = longV ? (d > 0 ? h.v0 : h.v1) : (d > 0 ? h.u0 : h.u1), qc = longV ? h.mu : h.mv;
  const r = roofAt(Math.round(h.mu + h.Du * 0.4), Math.round(h.mv + h.Dv * 0.4)), A = r && roofArea(roofCov(r));
  let edge = null;
  for (let k = 1; A && k <= 40; k++) {
    const l = footE + sg * k * 0.01, [u, v] = longV ? [qc, l] : [l, qc];
    if (!A.sub(roofSubOf(u), roofSubOf(v))) { const a = footE + sg * (k - 1) * 0.01; edge = Math.round(a - sg * RW) + sg * RW; break; }
  }
  const near = edge != null && Math.abs(edge - footE) < 0.3, t = ROOF_FRAME.arkaden.T, [p0, p1] = longV ? [h.u0, h.u1] : [h.v0, h.v1];
  return { edge, near, longV, joints: near ? [...(h.jM ? [] : [p0 - t / 2]), ...(h.jP ? [] : [p1 + t / 2])] : [] };
}
// Brüstung um eine Öffnung (Dachtreppe): hinten/vorn getrennt (vorn nach der Deko oben und den Leuten darin)
function holeWallOps(h, Pd, clip = null) {   // clip [u0, u1, v0, v1]: nur dieser Teil (ein Feld); sonst die ganze Öffnung
  const H = ROOF_H, back = [], front = [], Fa = ROOF_FRAME.arkaden, t = Fa.T, hh = Pd && Pd.id !== 'mauer' ? Pd.h : 3.5;   // Mauer niedrig, damit man die Treppe sieht; Balustrade und Geländer sind durchsichtig
  const [fu0, fu1, fv0, fv1] = clip || [-1e9, 1e9, -1e9, 1e9];
  const clipBox = (u0, u1, v0, v1) => [Math.max(u0, fu0), Math.min(u1, fu1), Math.max(v0, fv0), Math.min(v1, fv1)];
  const box = (B, h0, h1, list, faces = 'uvt') => {
    const [u0, u1, v0, v1] = clipBox(...B);
    if (u1 <= u0 + 1e-6 || v1 <= v0 + 1e-6) return;
    if (faces.includes('v')) list.push({ pts: [[u0, v1, h0], [u1, v1, h0], [u1, v1, h1], [u0, v1, h1]], col: Fa.sV });
    if (faces.includes('u')) list.push({ pts: [[u1, v0, h0], [u1, v1, h0], [u1, v1, h1], [u1, v0, h1]], col: Fa.sU });
    if (faces.includes('t')) list.push({ pts: [[u0, v0, h1], [u1, v0, h1], [u1, v1, h1], [u0, v1, h1]], col: Fa.top });
  };
  // Lage längs der Treppe (l) und quer (q); d > 0: hinauf zu größerem l. Fuß-Ende, offenes Ende
  const longV = !!h.Dv, d = h.Dv || h.Du, sg = d > 0 ? -1 : 1;           // sg: vom Loch zum Fuß hin
  const [p0, p1, l0, l1] = longV ? [h.u0, h.u1, h.v0, h.v1] : [h.v0, h.v1, h.u0, h.u1];
  const footE = d > 0 ? l0 : l1, openE = d > 0 ? l1 : l0, qc = longV ? h.mu : h.mv;
  const pt = (q, l, up) => longV ? [q, l, up] : [l, q, up];
  const { edge, near } = Pd ? holeFootEdge(h) : { edge: null, near: false };
  if (Pd && Pd.id === 'gelaender') {
    // Geländer: Handläufe auf der Mitte der Mauerlinien, an den Ecken genau bis zur Mitte des anderen, Eckpfosten; am offenen Ende ein
    // Pfosten. Nur der Teil auf diesem Feld (clip)
    const lineOps = [], posts = [];
    const footC = near ? edge - sg * t / 2 : footE + sg * t / 2;          // Fuß: eigene Linie oder die Mitte der Randbrüstung
    const sides = [];
    if (!h.jM) sides.push(p0 - t / 2);
    if (!h.jP) sides.push(p1 + t / 2);
    for (const q of sides) { lineOps.push([[q, Math.min(footC, openE)], [q, Math.max(footC, openE)], q]); posts.push(...(near ? [] : [[q, footC]]), [q, openE]); }   // am Rand: den Pfosten setzt die Randbrüstung
    if (!near) lineOps.push([[h.jM ? p0 : p0 - t / 2, footC], [h.jP ? p1 : p1 + t / 2, footC], null]);
    const inF = (u, v) => u >= fu0 - 1e-6 && u <= fu1 + 1e-6 && v >= fv0 - 1e-6 && v <= fv1 + 1e-6;
    const isF = (q, l) => q + l > h.mu + h.mv;
    const post = (q, l) => { const [u, v] = pt(q, l, 0); if (inF(u, v)) (isF(q, l) ? front : back).push({ pts: [pt(q, l, H), pt(q, l, H + hh)], col: '#4f4a44', line: 0.9 }); };
    posts.forEach(([q, l]) => post(q, l));
    for (const [[qa, la], [qb, lb], side] of lineOps) {
      const alongL = side != null, s0 = alongL ? la : qa, s1 = alongL ? lb : qb, fix = alongL ? side : la;
      for (let s = Math.ceil(s0 / 0.2 - 1e-6) * 0.2; s < s1 - 1e-6; s += 0.2) if (Math.abs(s - s0) > 0.08 && Math.abs(s - s1) > 0.08) alongL ? post(fix, s) : post(s, fix);
      const [uA, vA] = alongL ? pt(fix, s0, 0) : pt(s0, fix, 0), [uB, vB] = alongL ? pt(fix, s1, 0) : pt(s1, fix, 0);
      const cu0 = Math.max(Math.min(uA, uB), fu0), cu1 = Math.min(Math.max(uA, uB), fu1), cv0 = Math.max(Math.min(vA, vB), fv0), cv1 = Math.min(Math.max(vA, vB), fv1);
      if (cu1 < cu0 - 1e-9 || cv1 < cv0 - 1e-9) continue;
      const L = isF(alongL ? fix : (s0 + s1) / 2, alongL ? (s0 + s1) / 2 : fix) ? front : back;
      for (const [hgt, lw] of [[hh, 1.1], [hh / 2, 0.6]]) L.push({ pts: [[cu0, cv0, H + hgt], [cu1, cv1, H + hgt]], col: '#4f4a44', line: lw });
    }
  } else {
    // Mauer: lange Seiten mit den Ecken (bis zur Fuß-Mauer außen bzw. bis an die Randbrüstung), Fuß-Mauer dazwischen
    const fEnd = near ? edge - sg * t : footE + sg * t;                    // wo die Seiten am Fuß enden
    const sa = Math.min(fEnd, openE), sb = Math.max(fEnd, openE);
    const walls = [];
    if (!near) {                                                         // Fuß-Mauer zwischen den langen: ihre Stirnseiten sind innen
      const fa = Math.min(footE, footE + sg * t), fb = Math.max(footE, footE + sg * t), f = longV ? [p0, p1, fa, fb] : [fa, fb, p0, p1];
      f.faces = longV ? 'vt' : 'ut'; walls.push(f);
    }
    if (!h.jM) walls.push(longV ? [p0 - t, p0, sa, sb] : [sa, sb, p0 - t, p0]);   // lange Seiten nur außen (Doppel-/Dreifachtreppe: innen offen)
    if (!h.jP) walls.push(longV ? [p1, p1 + t, sa, sb] : [sa, sb, p1, p1 + t]);
    for (const W of walls) {
      const L = (W[0] + W[1]) / 2 + (W[2] + W[3]) / 2 > h.mu + h.mv ? front : back;
      if (!(Pd && Pd.id === 'balustrade')) { box(W, H, H + hh, L, W.faces || 'uvt'); continue; }
      // Balustrade wie am Rand (Nutzer: „Balustrade ändert das Geländer beim Aufgang nicht“): Sockel, Säulchen, Deckplatte – gleiche Ecken
      box(W, H, H + 1.2, L, W.faces || 'uvt');
      const [u0, u1, v0, v1] = clipBox(...W), alongU = W[1] - W[0] > W[3] - W[2], cu = (W[0] + W[1]) / 2, cv = (W[2] + W[3]) / 2;
      if (u1 > u0 && v1 > v0) {
        const a0 = alongU ? u0 : v0, a1 = alongU ? u1 : v1, at = (q, up) => alongU ? [q, cv, up] : [cu, q, up];
        for (let q = Math.ceil(a0 / 0.09 - 1e-6) * 0.09; q < a1 - 1e-6; q += 0.09) if (q > (alongU ? W[0] : W[2]) + 0.03 && q < (alongU ? W[1] : W[3]) - 0.03) {
          L.push({ pts: [at(q, H + 1.2), at(q, H + hh - 1.2)], col: '#d7cbb2', line: 2.1 }, { pts: [at(q - 0.008, H + 1.2), at(q - 0.008, H + hh - 1.2)], col: '#efe7d6', line: 0.7 });
        }
      }
      box(W, H + hh - 1.2, H + hh, L, W.faces || 'uvt');
    }
  }
  return { back, front };
}
// Steinarkaden: Belag auf dem Dach (Weg-Stilname) statt Dachgarten – Trittsteine gibt es oben nicht
const roofBel = r => r && typeof r.bel === 'string' && isWegStyle(r.bel) && !pathLook(r.bel).stones ? r.bel : null;
// Belag beim Umschalten: ein Plattenmuster, das man schon hat, in Steinfarbe (sonst glatt)
const roofBelDefault = () => wegStyleOf(['verband', 'reihen', 'drittel', 'platten', 'gemischt', 'schach'].find(m => wegMusterOk(m)) || 'glatt', 'beige');
const roofProf = (d, A) => A * Math.sin(Math.PI / 2 * Math.min(1, d / RW));

// Ein Feld malen. P(u, v, up) → Bildpunkt (Weltkoordinaten); lw: Strichstärke-Faktor. Nur die Teilstücke dieses Felds und seine
// Ränder – Nachbarn malen ihre eigenen (so überlappt nichts). Glas/Pergola: Rand rundum; Markise/Arkaden: Volant/Wand zum Betrachter.
function paintRoof(P, A, x, y, r, lw = 1, frontOut = null) {          // frontOut: vordere Brüstung dorthin statt gleich malen (vor die Deko oben)
  const form = roofForm(r), S = ROOF_STY[form], H = ROOF_H;
  const poly = (pts, fill, stroke, w = 1) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); if (fill) { g.fillStyle = C(fill); g.fill(); } if (stroke) { g.strokeStyle = C(stroke); g.lineWidth = w * lw; g.lineJoin = 'round'; g.stroke(); } };
  const line = (pts, col, w) => { g.strokeStyle = C(col); g.lineWidth = w * lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  const hAt = (u, v) => H + roofProf(A.dist(u, v), S.vault);
  const edges = roofEdges(A, x, y);
  // Dach in kleine Vierecke (≤ 0,09), bei der Markise genau auf den Streifengrenzen geschnitten (Rand ± k · Streifen)
  const quads = [], lines = { u: new Set(), v: new Set() }, holes = roofForm(r) === 'arkaden' ? roofHoles(x, y) : [], hcut = { u: new Set(), v: new Set() };
  for (const h of holes) { hcut.u.add(h.u0); hcut.u.add(h.u1); hcut.v.add(h.v0); hcut.v.add(h.v1); }   // Öffnung (Dachtreppe): genau an ihren Rändern schneiden
  if (form === 'markise') for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) for (const e of roofEdges(A, x + dx, y + dy)) lines[e.ax].add(e.at);   // echte Dachkanten
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const su = 3 * x + i, sv = 3 * y + j;
    if (!A.sub(su, sv)) continue;
    const u0 = roofLo(su), u1 = roofHi(su), v0 = roofLo(sv), v1 = roofHi(sv);
    const cuts = (a, b, ax) => {
      const c = new Set([a, b]), n = Math.max(1, Math.round((b - a) / 0.09));
      for (let k = 1; k < n; k++) c.add(a + (b - a) * k / n);
      for (const at of lines[ax]) for (let k = 1; k <= 23; k++) for (const t of [at + k * ROOF_STRIPE, at - k * ROOF_STRIPE])   // Streifengrenzen
        if (t > a + 1e-6 && t < b - 1e-6) c.add(Math.round(t * 1e6) / 1e6);
      for (const t of hcut[ax]) if (t > a + 1e-6 && t < b - 1e-6) c.add(t);
      return [...c].sort((p, q) => p - q);
    };
    const cu = cuts(u0, u1, 'u'), cv = cuts(v0, v1, 'v');
    for (let a = 0; a < cu.length - 1; a++) for (let b = 0; b < cv.length - 1; b++) if (!inHole(holes, (cu[a] + cu[a + 1]) / 2, (cv[b] + cv[b + 1]) / 2)) quads.push([cu[a], cu[a + 1], cv[b], cv[b + 1]]);
  }
  quads.sort((p, q) => (p[0] + p[2]) - (q[0] + q[2]));
  const corners = ([ua, ub, va, vb], up = 0) => [P(ua, va, hAt(ua, va) + up), P(ub, va, hAt(ub, va) + up), P(ub, vb, hAt(ub, vb) + up), P(ua, vb, hAt(ua, vb) + up)];
  const across = (u, v) => { const e = 0.02, gu = A.dist(u + e, v) - A.dist(u - e, v), gv = A.dist(u, v + e) - A.dist(u, v - e); return Math.abs(gu) < 1e-4 && Math.abs(gv) < 1e-4 ? 'both' : Math.abs(gv) > Math.abs(gu) ? 'v' : 'u'; };
  const ribs = (step, hFn, col, w) => {
    for (const [ua, ub, va, vb] of quads) {
      const dir = across((ua + ub) / 2, (va + vb) / 2);
      if (dir !== 'u') for (let u = Math.ceil(ua / step - 1e-6) * step; u < ub - 1e-6; u += step) line([P(u, va, hFn(u, va)), P(u, vb, hFn(u, vb))], col, w);
      if (dir !== 'v') for (let v = Math.ceil(va / step - 1e-6) * step; v < vb - 1e-6; v += step) line([P(ua, v, hFn(ua, v)), P(ub, v, hFn(ub, v))], col, w);
    }
  };
  const beams = edges.map(e => ({ e, k: e.at + (e.a + e.b) / 2 })).sort((p, q) => p.k - q.k);
  const drawFrame = F => { for (const { e } of beams) {
      const inn = e.at - e.n * F.T, lo = Math.min(e.at, inn), hi2 = Math.max(e.at, inn);
      const at = (w, t, up) => e.ax === 'u' ? P(w, t, up) : P(t, w, up);
      // Innenecke (Ring mit offener Mitte, Nutzer): geht das Dach hinter dem Lauf-Ende auf der Balkenseite weiter, läuft der Balken um
      // seine Stärke weiter – sonst bliebe in der Ecke ein Quadrat ohne Balken (Stufe). Außenecken überlappen ohnehin
      const [ra, rb] = roofRun(A, e), w = e.at - e.n * F.T / 2;
      const cov = (t) => { const [u, v] = e.ax === 'u' ? [w, t] : [t, w]; return A.sub(roofSubOf(u), roofSubOf(v)); };
      const endA = Math.abs(e.a - ra) < 1e-6, endB = Math.abs(e.b - rb) < 1e-6, inA = endA && cov(ra - 0.01), inB = endB && cov(rb + 0.01);
      const a0 = inA ? e.a - F.T : e.a, b0 = inB ? e.b + F.T : e.b;
      // sichtbare Seite: bei n < 0 die Innenseite (zum Dach hin) – sie endet genau dort, wo der andere Balken beginnt (Nutzer wählte C):
      // an Außenecken um die Stärke kürzer, an Innenecken um die Stärke länger. Bei n > 0 die Außenseite: endet an der Lauf-Ecke
      const fa = e.n < 0 && endA ? e.a + (inA ? -F.T : F.T) : e.a, fb = e.n < 0 && endB ? e.b + (inB ? F.T : -F.T) : e.b;
      if (fb > fa && !(F.solid && e.n < 0)) poly([at(hi2, fa, H - F.BH), at(hi2, fb, H - F.BH), at(hi2, fb, H), at(hi2, fa, H)], e.ax === 'u' ? F.sU : F.sV);   // massiv: Innenseite unter den Platten
      poly([at(lo, a0, H), at(hi2, a0, H), at(hi2, b0, H), at(lo, b0, H)], F.top, F.top, 0.3);
    } };
    // Balken über Pfosten mitten unterm Dach, in beide Richtungen bis zum Rand – nur wo wirklich ein Pfosten steht (Nutzer, 09.10.2026:
    // „sonst bleibt es bei den dünnen“). Gleiche Stärke wie die Randbalken, die Latten liegen darunter eingelassen
  const drawInnerFrame = F => {
      for (const [ax, at] of roofInnerBeams(A, x, y)) for (const [ua, ub, va, vb] of quads) {
        const t = F.T;
        if (ax === 'u') {                                                // Balken längs u (v = at)
          const v0 = Math.max(va, at - t / 2), v1 = Math.min(vb, at + t / 2);
          if (v1 <= v0) continue;
          poly([P(ua, v1, H - F.BH), P(ub, v1, H - F.BH), P(ub, v1, H), P(ua, v1, H)], F.sV);
          poly([P(ua, v0, H), P(ub, v0, H), P(ub, v1, H), P(ua, v1, H)], F.top, F.top, 0.3);
        } else {                                                         // Balken längs v (u = at)
          const u0 = Math.max(ua, at - t / 2), u1 = Math.min(ub, at + t / 2);
          if (u1 <= u0) continue;
          poly([P(u1, va, H - F.BH), P(u1, vb, H - F.BH), P(u1, vb, H), P(u1, va, H)], F.sU);
          poly([P(u0, va, H), P(u1, va, H), P(u1, vb, H), P(u0, vb, H)], F.top, F.top, 0.3);
        }
      }
    };
  // Brüstung (Steinarkaden): auf jedem Randstück der Rahmen nach oben verlängert – dieselben Enden wie drawFrame (Außenecken laufen
  // zusammen, Innenecken um die Stärke weiter, sichtbare Innenseite endet an der Ecke), also bündig. front: Stücke mit Außenseite
  // zum Betrachter (n > 0) – die stehen vor der Deko oben und werden danach gezeichnet
  const parapetOps = (F, Pd, front) => {
    const ops = [], T = F.T, h = Pd.h;
    for (const { e } of beams) {
      if ((e.n > 0) !== front) continue;
      const inn = e.at - e.n * T, lo = Math.min(e.at, inn), hi2 = Math.max(e.at, inn), mid = (lo + hi2) / 2;
      const at = (w, t, up) => e.ax === 'u' ? [w, t, up] : [t, w, up];
      const [ra, rb] = roofRun(A, e), w = e.at - e.n * T / 2;
      const cov = t => { const [u, v] = e.ax === 'u' ? [w, t] : [t, w]; return A.sub(roofSubOf(u), roofSubOf(v)); };
      const endA = Math.abs(e.a - ra) < 1e-6, endB = Math.abs(e.b - rb) < 1e-6, inA = endA && cov(ra - 0.01), inB = endB && cov(rb + 0.01);
      const a0 = inA ? e.a - T : e.a, b0 = inB ? e.b + T : e.b;
      const fa = e.n < 0 && endA ? e.a + (inA ? -T : T) : e.a, fb = e.n < 0 && endB ? e.b + (inB ? T : -T) : e.b;
      const side = e.ax === 'u' ? F.sU : F.sV;
      const face = (h0, h1) => { if (fb > fa) ops.push({ pts: [at(hi2, fa, H + h0), at(hi2, fb, H + h0), at(hi2, fb, H + h1), at(hi2, fa, H + h1)], col: side }); };
      const top = hh => ops.push({ pts: [at(lo, a0, H + hh), at(hi2, a0, H + hh), at(hi2, b0, H + hh), at(lo, b0, H + hh)], col: F.top });
      const each = (step, f) => { for (let t = Math.ceil(a0 / step - 1e-6) * step; t < b0 - 1e-6; t += step) f(t); };   // im Weltraster: läuft über Felder weiter
      if (Pd.id === 'mauer') { face(0, h); top(h); }
      else if (Pd.id === 'balustrade') {
        face(0, 1.2); top(1.2);
        each(0.09, t => { ops.push({ pts: [at(mid, t, H + 1.2), at(mid, t, H + h - 1.2)], col: '#d7cbb2', line: 2.1 }); ops.push({ pts: [at(mid, t - 0.008, H + 1.2), at(mid, t - 0.008, H + h - 1.2)], col: '#efe7d6', line: 0.7 }); });
        face(h - 1.2, h); top(h);
      } else {
        // Geländer (Nutzer: „die Ecken sollen abschließen und bündig sein“): Handläufe auf der Mitte des Rahmens, an Ecken genau bis zur
        // Mitte des anderen (außen um T/2 kürzer, innen um T/2 länger) – kein Kreuz, kein Überstand; dort ein Eckpfosten, Rasterpfosten
        // zu nah an der Ecke fallen weg
        const r0 = endA ? e.a + (inA ? -T / 2 : T / 2) : e.a, r1 = endB ? e.b + (inB ? T / 2 : -T / 2) : e.b, corner = [];
        if (endA) corner.push(r0);
        if (endB) corner.push(r1);
        for (const hl of holes) {                                       // Seiten einer Öffnung stoßen hier an: dort der Pfosten (T-Stoß)
          const f = holeFootEdge(hl);
          if (f.near && (f.longV ? e.ax === 'v' : e.ax === 'u') && Math.abs(f.edge - e.at) < 0.02) for (const j of f.joints) if (j > r0 - 1e-6 && j < r1 + 1e-6) corner.push(j);
        }
        const post = t => ops.push({ pts: [at(mid, t, H), at(mid, t, H + h)], col: '#4f4a44', line: 0.9 });
        corner.forEach(post);
        each(0.2, t => { if (t > r0 - 1e-6 && t < r1 + 1e-6 && !corner.some(c => Math.abs(c - t) < 0.08)) post(t); });
        ops.push({ pts: [at(mid, r0, H + h * 0.5), at(mid, r1, H + h * 0.5)], col: '#4f4a44', line: 0.6 });
        ops.push({ pts: [at(mid, r0, H + h), at(mid, r1, H + h)], col: '#4f4a44', line: 1.1 });
      }
    }
    return ops;
  };
  // Öffnung im Dach: eine Brüstung außen um drei Seiten –
  // die zwei langen laufen über die Ecken, die am Fuß liegt zwischen ihnen (bündig, nichts doppelt). Nur der Teil auf diesem Feld
  const holeOps = (hs, Pd) => {                                       // nur der Teil auf diesem Feld
    const back = [], front = [];
    for (const h of hs) { const o = holeWallOps(h, Pd, [x - 0.5, x + 0.5, y - 0.5, y + 0.5]); back.push(...o.back); front.push(...o.front); }
    return { back, front };
  };
  const F = ROOF_FRAME[form];
  if (form === 'glas') {                                                // Stahlrahmen, darauf Glas mit Stahlbögen
    drawInnerFrame(F); drawFrame(F);
    for (const q of quads) poly(corners(q), S.glass);
    // Stahlbögen in beide Richtungen, alle 0,25 Felder, überall gleich – keine halben Bögen an Ecken (Nutzer wählte A, 09.10.2026)
    for (const [ua, ub, va, vb] of quads) {
      for (let u = Math.ceil(ua / 0.25 - 1e-6) * 0.25; u < ub - 1e-6; u += 0.25) line([P(u, va, hAt(u, va)), P(u, vb, hAt(u, vb))], S.rib, 0.7);
      for (let v = Math.ceil(va / 0.25 - 1e-6) * 0.25; v < vb - 1e-6; v += 0.25) line([P(ua, v, hAt(ua, v)), P(ub, v, hAt(ub, v))], S.rib, 0.7);
    }
  } else if (form === 'markise') {                                      // schlanker Rahmen, darüber der Stoff (Zackenrand hängt über den Rahmen)
    drawInnerFrame(F); drawFrame(F);
    const cols = [MARKISE_COLS[(r && r.col) || 0].c, '#fffaf0'];
    for (const q of quads) { const c = cols[Math.floor(A.dist((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, 2, true) / ROOF_STRIPE) % 2]; poly(corners(q), c, c, 0.35); }
  } else if (form === 'pergola') {
    // Randbalken als Kanthölzer (Entwurf D): Außenseite genau auf der Dachkante, Stärke PERG_T nach innen, Höhe PERG_BH unter H;
    // sichtbar die Seite zum Betrachter (+u dunkler, +v heller) und die Oberseite – an Ecken laufen sie zusammen (keine Kerbe, kein Kreuz)
    const drawBeams = () => drawFrame(F);
    // Latten als Gitter in beiden Richtungen, alle 0,25 Felder, überall gleich (Nutzer wählte B), fein und zwischen den Randbalken
    // eingelassen, oben knapp unter deren Oberkante (Nutzer wählte C, 09.10.2026: nichts steht über) – erst die Latten, dann die Balken davor
    const inset = PERG_T, lh = H - 0.5, lw2 = 0.7;
    const trim = (u0, v0, u1, v1) => {
      const d0 = A.dist(u0, v0), d1 = A.dist(u1, v1);
      if (d0 < inset - 1e-6 && d1 < inset - 1e-6) return null;
      if (d0 < inset) { const t = (inset - d0) / (d1 - d0); u0 += (u1 - u0) * t; v0 += (v1 - v0) * t; }
      else if (d1 < inset) { const t = (inset - d1) / (d0 - d1); u1 += (u0 - u1) * t; v1 += (v0 - v1) * t; }
      return [u0, v0, u1, v1];
    };
    const lath = (u0, v0, u1, v1) => { const q = trim(u0, v0, u1, v1); if (q) line([P(q[0], q[1], lh), P(q[2], q[3], lh)], S.beam, lw2); };
    const drawLaths = () => { for (const [ua, ub, va, vb] of quads) {
      for (let u = Math.ceil(ua / 0.25 - 1e-6) * 0.25; u < ub - 1e-6; u += 0.25) lath(u, va, u, vb);
      for (let v = Math.ceil(va / 0.25 - 1e-6) * 0.25; v < vb - 1e-6; v += 0.25) lath(ua, v, ub, v);
    } };
    const drawInner = () => drawInnerFrame(F);
    drawLaths(); drawInner(); drawBeams();
    for (const q of quads) {
      const hh = hash(Math.round(q[0] * 97), Math.round(q[2] * 89), 3);
      if (hh > 0.45) continue;
      const i = Math.round(hh * 1000), p = P(q[0] + (q[1] - q[0]) * hash(i, 1, 5), q[2] + (q[3] - q[2]) * hash(i, 2, 5), H + 1.6);
      g.fillStyle = C(S.leaf[i % 3]); g.beginPath(); g.ellipse(p[0], p[1], 1.7 * lw, 1.1 * lw, 0, 0, 7); g.fill();
      if (i % 4 === 0) { g.fillStyle = C(S.flower[(i >> 2) % 4]); g.beginPath(); g.arc(p[0] + 0.7 * lw, p[1] - 0.5 * lw, 0.75 * lw, 0, 7); g.fill(); }
    }
  } else if (form === 'arkaden' && roofBel(r)) {                      // Belag (Nutzer, 09.10.2026: „ein Muster aufm Dach“): Muster und Farbe der
    const lk = lookFar(pathLook(roofBel(r)), lw), L = ([u, v]) => P(x + u, y + v, H);   // Wege, im selben Weltraster – läuft über Feldgrenzen weiter
    const loc = ([ua, ub, va, vb]) => [[ua - x, va - y], [ub - x, va - y], [ub - x, vb - y], [ua - x, vb - y]];
    for (const q of quads) poly(loc(q).map(L), lk.fill, lk.fill, 0.35);
    if (lk.pat) {
      g.save(); clipTo(quads.map(loc), L); patSeam = true;
      try { pattern(L, lk.pat[0], x, y, lw, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); }
    }
    drawFrame(F);
  } else if (form === 'arkaden') {                                      // Dachgarten (Nutzer, 09.10.2026): Rasen mit Büschen und Blumen im Steinrand,
    for (const q of quads) poly(corners(q), '#86c35b', '#86c35b', 0.4);   // massiv: Innenseiten und innere Balken liegen darunter
    drawFrame(F);
    for (const q of quads) {
      const hh = hash(Math.round(q[0] * 97), Math.round(q[2] * 89), 7);
      if (hh > 0.18 || A.dist((q[0] + q[1]) / 2, (q[2] + q[3]) / 2) < 0.12) continue;
      const p = P((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, H);
      g.fillStyle = C(hh < 0.08 ? '#4f9a3c' : '#6fbf4f'); g.beginPath(); g.ellipse(p[0], p[1] - 1.5 * lw, 2.6 * lw, 2 * lw, 0, 0, 7); g.fill();
      if (hh < 0.05) { g.fillStyle = C(['#f28cb1', '#ffd23f', '#ffffff'][Math.floor(hh * 60) % 3]); g.beginPath(); g.arc(p[0] + 0.8 * lw, p[1] - 2.5 * lw, 0.9 * lw, 0, 7); g.fill(); }
    }
  }
  const Pd = roofPar(r);
  if (holes.length) {                                                   // durch die Öffnung (nur der Teil dieses Felds): die Treppen darunter –
    g.save(); g.beginPath();                                            // auch die der Nachbarn, schräg sieht man in einer breiten Öffnung hinüber
    const e = 0.012;                                                    // wo die Öffnung ins Nachbarfeld weitergeht: knapp darüber (keine Fuge)
    for (const h of holes) {
      // bis zur Feldgrenze oder darüber (auch genau darauf: breite Treppe, die Nachbarspur geht dort weiter – Nutzer: „Linie in der Mitte“)
      const u0 = h.u0 <= x - 0.5 + 1e-9 ? x - 0.5 - e : h.u0, u1 = h.u1 >= x + 0.5 - 1e-9 ? x + 0.5 + e : h.u1;
      const v0 = h.v0 <= y - 0.5 + 1e-9 ? y - 0.5 - e : h.v0, v1 = h.v1 >= y + 0.5 - 1e-9 ? y + 0.5 + e : h.v1;
      if (u1 > u0 && v1 > v0) [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].forEach(([u, v], i) => { const p = P(u, v, H); i ? g.lineTo(...p) : g.moveTo(...p); });
      g.closePath();
    }
    g.clip();
    try {
      const all = roofHoles(x, y, 0.01).sort((a, b) => a.mu + a.mv - b.mu - b.mv), F0 = ROOF_FRAME.arkaden;
      // Schachtwände bis zum Boden an den Seiten, die man von oben sieht (kleines u bzw. v), dann die Stufen davor
      // – nie am Fuß: dort geht man unter dem Dach in die Treppe hinein (Nutzer: „unten ist gar nicht offen sondern eine Wand“)
      for (const h of all) {
        if (h.Dv ? !h.jM : h.Du < 0) poly([P(h.u0, h.v0, 0), P(h.u0, h.v1, 0), P(h.u0, h.v1, H), P(h.u0, h.v0, H)], F0.sU, F0.sU, 0.3);   // längs: Seite; quer: nur oben
        if (h.Du ? !h.jM : h.Dv < 0) poly([P(h.u0, h.v0, 0), P(h.u1, h.v0, 0), P(h.u1, h.v0, H), P(h.u0, h.v0, H)], F0.sV, F0.sV, 0.3);
      }
      const parts = [];                                                 // alle Spuren gemeinsam von hinten nach vorn
      for (const h of all) { parts.base = h.mu + h.mv; dtSteps(h.rot, (u, v, up) => P(h.mu + u, h.mv + v, up), (pts, col, w) => w ? line(pts, col, w) : poly(pts, col, col, 0.3), h.jM, h.jP, null, parts); }
      parts.sort((p, r) => p.k - r.k).forEach(p => p.draw());
    } finally { g.restore(); }
  }
  // Brüstung am Rand und um die Öffnung (Dachtreppe): hinten erst der Rand, dann die Öffnung davor; vorn erst die Öffnung, dann der Rand
  // davor (die Seiten der Öffnung stoßen dort an) – vorn nach der Deko oben (frontOut) oder gleich
  const hop = holes.length ? holeOps(holes, Pd) : null, fr = [];
  if (Pd) roofOps(parapetOps(F, Pd, false), P, lw);
  if (hop) { roofOps(hop.back, P, lw); fr.push(...hop.front); }
  if (Pd) fr.push(...parapetOps(F, Pd, true));
  if (frontOut) frontOut.push(...fr); else roofOps(fr, P, lw);
  // Ränder
  for (const e of edges) {
    const pt = (t, up) => e.ax === 'u' ? P(e.at, t, up) : P(t, e.at, up), front = e.n > 0;
    if (form === 'glas') continue;                                        // Rand: der Stahlrahmen
    if (!front) continue;
    if (form === 'markise') {
      const cols = [MARKISE_COLS[(r && r.col) || 0].c, '#fffaf0'], n = Math.max(1, Math.round((e.b - e.a) / 0.12));
      for (let i = 0; i < n; i++) {
        const t0 = e.a + (e.b - e.a) * i / n, t1 = e.a + (e.b - e.a) * (i + 1) / n, A0 = pt(t0, H), B0 = pt(t1, H);
        poly([A0, B0, [B0[0], B0[1] + 1.4 * lw], [(A0[0] + B0[0]) / 2, (A0[1] + B0[1]) / 2 + 2.8 * lw], [A0[0], A0[1] + 1.4 * lw]], cols[Math.floor(((t0 + t1) / 2) / 0.12 + 1000) % 2], '#d9c9b8', 0.3);
      }
    } else if (form === 'arkaden') {
      // Bögen zwischen den Stützen dieses Laufs (ohne Stützen: von Ende zu Ende): Kämpfer H − 9, Scheitel H − 2
      const [ra, rb] = roofRun(A, e), springs = [ra, ...roofPillarsOn(e, ra, rb), rb].sort((p, q) => p - q);
      const arch = [], n = 10;
      for (let k = 0; k <= n; k++) {
        const t = e.a + (e.b - e.a) * k / n, j = Math.max(0, springs.findIndex((s, i) => i < springs.length - 1 && t >= s - 1e-9 && t <= springs[i + 1] + 1e-9));
        const s0 = springs[j], s1 = springs[j + 1] != null ? springs[j + 1] : s0 + 1, f = s1 - s0 > 1e-6 ? (t - s0) / (s1 - s0) : 0;
        arch.push(pt(t, H - F.BH - 7 + 5.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, f)))));   // Bogen unter dem Steinbalken
      }
      poly([...arch, pt(e.b, H - F.BH), pt(e.a, H - F.BH)], e.ax === 'v' ? S.side : S.stone);
      line(arch, S.dark, 0.6);
    }
  }
}
// Feld im Spiel: Bildchen je (Feld, Form, Farbe, Nachbarschaft, Stützen der Arkaden, Zoomstufe); nachts ein warmes Licht darunter
const roofSprites = new Map(), ROOF_BUDGET = 8;   // ms je Bild fürs Neumalen; danach das alte Bildchen (andere Zoomstufe) weiter
let roofSpent = 0, roofFrame = -1;
const ROOF_BOX = { left: -TW / 2 - 4, top: -TH / 2 - ROOF_H - 12, w: TW + 8, h: TH + ROOF_H + 18 };
function roofCov(r) { const f = (r && r.form) || 0; return (x, y) => { const o = roofAt(x, y); return !!o && ((o.form || 0) === f); }; }
function roofSig(x, y, r) {
  const reach = roofForm(r) === 'markise' ? 3 : 1, cov = roofCov(r);
  let s = (r.form || 0) + ':' + (r.col || 0) + ':' + (roofBel(r) || '') + ':' + (r.par || 0) + ':';
  for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) s += cov(x + dx, y + dy) ? 1 : 0;
  s += '|' + roofHoles(x, y).map(h => [h.u0, h.u1, h.v0, h.v1, h.Du, h.Dv].join(',')).join(';');   // Öffnung (Dachtreppe), auch breiter
  s += '|' + roofInnerBeams(roofArea(cov), x, y).map(([a, t]) => a + t.toFixed(3)).sort().join(',');   // innere Balken
  if (roofForm(r) === 'arkaden') {                                      // Bögen hängen an den Stützen des ganzen Laufs
    const A = roofArea(cov);
    for (const e of roofEdges(A, x, y)) if (e.n > 0) { const [a, b] = roofRun(A, e); s += '|' + a.toFixed(2) + ',' + b.toFixed(2) + ':' + roofPillarsOn(e, a, b).map(t => t.toFixed(2)).join(','); }
  }
  return s;
}
function drawRoofTile(x, y, px, py, z) {
  const r = roofAt(x, y);
  if (!r) return;
  // Auflösung: mindestens so fein wie gezoomt (halbe Stufen nach oben gerundet) – nie hochgezogen (Nutzer: „das Dach ist verpixelt“)
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2), key = x + ',' + y;
  let e = roofSprites.get(key);
  // Schlüssel nur neu prüfen, wenn sich am Spielstand etwas getan hat (jedes Speichern zählt GL.drawEpoch hoch)
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + state.roofs.size + ':' + state.decos.size + '|' + want.toFixed(3) + (FOG ? 'n' : '');
  const sig = e && e.ver === ver ? e.sig : roofSig(x, y, r) + '|' + want.toFixed(3) + (FOG ? 'n' : '');
  if (e && e.sig === sig) e.ver = ver;
  if (roofFrame !== frameNo) { roofFrame = frameNo; roofSpent = 0; }
  const onlyZoom = e && e.base === sig.slice(0, sig.lastIndexOf('|'));     // nur die Zoomstufe ist anders
  if (!e || (e.sig !== sig && !(onlyZoom && roofSpent > ROOF_BUDGET))) {
    const t0 = performance.now(), B = ROOF_BOX, c = document.createElement('canvas'), front = [];
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try {
      g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want);
      const P = (u, v, up = 0) => [(u - x - (v - y)) * TW / 2, (u - x + v - y) * TH / 2 - up];
      paintRoof(P, roofArea(roofCov(r)), x, y, r, 1, front);
    } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, ver, base: sig.slice(0, sig.lastIndexOf('|')), front };
    roofSpent += performance.now() - t0;
    roofSprites.set(key, e);
  }
  const B = ROOF_BOX;
  g.drawImage(e.c, px + B.left * z, py + B.top * z, B.w * z, B.h * z);
  const S = ROOF_STY[roofForm(r)];
  if (S.lamp && night > 0.15) {                                          // weiches Licht unter dem Dach (durchsichtige Dächer), ohne helle Scheibe
    const ly = py - (ROOF_H - 4) * z, e = 0.3 * z;
    glowQuad([[px - e, ly], [px + e, ly], [px + e, ly - e], [px - e, ly - e]], (roofForm(r) === 'glas' ? 30 : 22) * z);
  }
}
// Schatten am Boden (render.js drawShadows, im Boden-Bild): die Dachfläche, mit der Sonne um ROOF_H verschoben – so sieht man,
// worüber das Dach liegt. Durchsichtiges wirft weniger Schatten.
const ROOF_SHADE = { pergola: 'rgba(30,42,62,0.16)', glas: 'rgba(30,42,62,0.1)', markise: 'rgba(30,42,62,0.26)', arkaden: 'rgba(30,42,62,0.28)' };
function drawRoofShadows(want) {
  const dx = SUN.dx * ROOF_H, dy = SUN.dy * ROOF_H, by = {};
  for (const [k, r] of state.roofs) {
    const [x, y] = keyXY(k);
    if (!want([x, y])) continue;
    const f = roofForm(r), A = roofArea(roofCov(r));
    (by[f] = by[f] || []).push([A, x, y]);
  }
  for (const [f, list] of Object.entries(by)) {
    g.beginPath();
    for (const [A, x, y] of list) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const su = 3 * x + i, sv = 3 * y + j;
      if (!A.sub(su, sv)) continue;
      const c = [[roofLo(su), roofLo(sv)], [roofHi(su), roofLo(sv)], [roofHi(su), roofHi(sv)], [roofLo(su), roofHi(sv)]].map(([u, v]) => { const p = iso(u, v); return [p.x + dx, p.y + dy]; });
      c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    }
    g.fillStyle = ROOF_SHADE[f]; g.fill('nonzero');
  }
}
// Antippen (👆, 🧹): getroffen ist das Dach, das man sieht – nicht das Bodenfeld dahinter. Der Punkt ROOF_H unter dem Zeiger liegt
// auf dem Boden unter dem Dach; ist dort Dach, gilt dieses Feld
function roofPick(sx, sy) {
  if (!state.roofs || !state.roofs.size || !cam) return null;
  const [a, b] = tileFrac(sx, sy + ROOF_H * cam.z), x = Math.round(a), y = Math.round(b), r = roofAt(x, y);
  if (!r) return null;
  const A = roofArea(roofCov(r)), s = v => { return roofSubOf(v); };
  return A.sub(s(a), s(b)) ? { x, y } : null;
}
// Stützen werden mit dem hintersten Feld gezeichnet, das sie berühren – direkt vor dessen Dach (Nutzer: „das Dach liegt unter den
// Pfeilern“: eine Stütze, die zum Feld davor gehört, kam sonst nach dem Dach des Felds dahinter). Ohne Dächer zeichnet drawSmall.
// Stützen-Speicherfelder, die eine Stütze in Feld (x, y) haben können: das Feld und alle acht Nachbarn (Ecken der Nachbarfelder rücken
// ans Dach – Säulen erst, Dach danach, Nutzer)
const PILLAR_NEAR = (x, y) => [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]];
const pillarOwner = (pu, pv) => [Math.round(pu - 1e-6), Math.round(pv - 1e-6)];
function drawPillarsOf(x, y, px, py, z, now) {
  for (const [tx, ty] of PILLAR_NEAR(x, y)) {
    const ds = state.decos.get(tx + ',' + ty);
    if (!ds) continue;
    ds.forEach((d, i) => {
      if (!d || d.b !== 'stuetze') return;
      const [pu, pv] = pillarPos(tx, ty, i, d), [ox, oy] = pillarOwner(pu, pv);
      if (ox !== x || oy !== y) return;
      let sc = 1;
      if (d.born) { const a = (now - d.born) / 380; if (a < 1) sc = 0.5 + 0.5 * Math.sin(a * Math.PI / 2); }
      const form = pillarForm(x, y, pu - x, pv - y), [qu, qv] = pillarInset(pu, pv, form), u = qu - x, v = qv - y;
      drawSmallOne('stuetze', d.rot || 0, px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z, z, now, tx, ty, sc, i, 0, form);
    });
  }
}
const hasPillarNear = (x, y) => PILLAR_NEAR(x, y).some(([tx, ty]) => { const ds = state.decos.get(tx + ',' + ty); return !!ds && ds.some(d => d && d.b === 'stuetze'); });
// Antippen einer Stütze (👆, 🧹): die Stütze geht vor dem Dach darüber (Nutzer: „wenn ich eine Stütze entferne, geht das ganze Dach
// weg“ – der Dach-Treffer nahm sonst alles unter dem Dach). Getroffen: Zeiger auf dem Pfosten zwischen Fuß und Dach, ± ein paar Punkte
function pillarAt(sx, sy) {
  if (!state.decos.size || !cam) return null;
  const z = cam.z, c = toTile(sx, sy + ROOF_H * z / 2);
  let best = null;
  for (let ty = c.y - 2; ty <= c.y + 2; ty++) for (let tx = c.x - 2; tx <= c.x + 2; tx++) {
    const ds = state.decos.get(tx + ',' + ty);
    if (ds) ds.forEach((d, i) => {
      if (!d || d.b !== 'stuetze') return;
      const [pu, pv] = pillarPos(tx, ty, i, d), [qu, qv] = pillarInset(pu, pv, pillarForm(tx, ty, pu - tx, pv - ty)), p = toScreen(qu, qv);
      if (Math.abs(sx - p.x) <= Math.max(5, 3 * z) && sy <= p.y + 3 * z && sy >= p.y - ROOF_H * z && (!best || p.y > best.fy)) best = { x: tx, y: ty, slot: i, fy: p.y };
    });
  }
  return best;
}
// Felder, deren tileB Dach oder Stützen zeichnet (GL-Standbild, gl.js glPlayTiles: sie werden jedes Bild neu gezeichnet – sonst fehlten
// Dach und Stützen weit weg ganz, Nutzer: „in meiner Welt immer noch so“)
let roofLiveCache = { v: -1, keys: [] };
function roofLiveTiles() {
  if (!state.roofs || (!state.roofs.size && !state.decos.size)) return [];
  const v = (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + groundVersion + ':' + state.roofs.size + ':' + state.decos.size;
  if (roofLiveCache.v === v) return roofLiveCache.keys;
  const out = new Set(state.roofs.keys());
  if (state.roofs.size) for (const [k, ds] of state.decos) ds.forEach((d, i) => {
    if (!d || d.b !== 'stuetze') return;
    const [x, y] = keyXY(k), [ox, oy] = pillarOwner(...pillarPos(x, y, i, d));
    out.add(ox + ',' + oy);
  });
  roofLiveCache = { v, keys: [...out] };
  return roofLiveCache.keys;
}
// Stützen kommen mit (Nutzer wählte A, 09.10.2026): nach dem Bauen einer Fläche an jede Außenecke eine Stütze, wo noch keine steht –
// gratis (free: Abreißen gibt nichts zurück), frei versetz- und entfernbar. Nur Außenecken (Innenecken, Seiten: stellt der Nutzer).
function roofAutoPillars(cells) {
  let n = 0;
  const near = (pu, pv) => { for (const [tx, ty] of PILLAR_NEAR(Math.round(pu), Math.round(pv))) { const ds = state.decos.get(tx + ',' + ty);
    if (ds && ds.some((d, i) => d && d.b === 'stuetze' && (([qu, qv]) => Math.hypot(qu - pu, qv - pv) < 0.15)(pillarPos(tx, ty, i, d)))) return true; } return false; };
  for (const [x, y] of cells) {
    const r = roofAt(x, y);
    if (!r) continue;
    const cov = roofCov(r);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      if (cov(x + sx, y) || cov(x, y + sy)) continue;                     // keine Außenecke
      const pu = x + sx * RW, pv = y + sy * RW, slot = (sx > 0 ? 1 : 0) + (sy > 0 ? 2 : 0);
      if (near(pu, pv) || smallError('stuetze', x, y, slot, { noCost: true })) continue;   // steht schon eine / Platz belegt
      const k = x + ',' + y;
      if (!state.decos.has(k)) state.decos.set(k, newSlots());
      state.decos.get(k)[slot] = { b: 'stuetze', rot: smallRot('stuetze', slot), free: true, born: performance.now() };
      n++;
    }
  }
  return n;
}
// Dach weg/geändert: Bildchen der Nachbarschaft verwerfen (das Abstandsfeld reicht bis 3 Felder)
function roofDirty(x, y) {
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const k = (x + dx) + ',' + (y + dy), e = roofSprites.get(k); if (e) { freeCanvas(e.c); roofSprites.delete(k); } }
}
// Stütze an die Dachkante (Nutzer: „man kann die Pfeiler auf die Ecken stellen“ – der Eckpunkt zwischen vier Feldern liegt bei 0,5,
// die Kante bei RW = 0,42): steht eine Stütze bis ROOF_SNAP neben einem Dach, rückt sie auf den nächsten Punkt seiner Fläche.
// Mitten unter einem breiten Dach bleibt sie, wo sie ist. Weltkoordinaten rein und raus.
const ROOF_SNAP = 0.24;   // reicht bis zu Ecken und Seitenmitten der Nachbarfelder (0,16 bzw. schräg 0,23) – Säulen erst, Dach danach (Nutzer)
function pillarSnap(pu, pv) {
  if (!state.roofs || !state.roofs.size) return [pu, pv];
  let best = null, bd = ROOF_SNAP, onU = null, onV = null;
  for (let ty = Math.round(pv) - 1; ty <= Math.round(pv) + 1; ty++) for (let tx = Math.round(pu) - 1; tx <= Math.round(pu) + 1; tx++) {
    const r = roofAt(tx, ty);
    if (!r) continue;
    const A = roofArea(roofCov(r));
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const su = 3 * tx + i, sv = 3 * ty + j;
      if (!A.sub(su, sv)) continue;
      const cu = Math.min(roofHi(su), Math.max(roofLo(su), pu)), cv = Math.min(roofHi(sv), Math.max(roofLo(sv), pv)), d = Math.hypot(cu - pu, cv - pv);
      if (d < 1e-9) return [pu, pv];                                   // liegt schon unter dem Dach
      if (d < bd) { bd = d; best = [cu, cv]; }
      if (d < ROOF_SNAP) { if (Math.abs(cv - pv) < 1e-9 && (!onU || d < onU.d)) onU = { u: cu, d }; if (Math.abs(cu - pu) < 1e-9 && (!onV || d < onV.d)) onV = { v: cv, d }; }
    }
  }
  // nah an zwei Kanten zugleich (Innenecke, z. B. Ecke des Hofs in einem Ring): in die Ecke, nicht an eine der beiden Kanten (Nutzer)
  if (onU && onV && Math.abs(onU.d - onV.d) < 0.05) { const r = roofAt(Math.round(onU.u), Math.round(onV.v)); if (r && roofArea(roofCov(r)).sub(roofSubOf(onU.u), roofSubOf(onV.v))) return [onU.u, onV.v]; }
  return best || [pu, pv];
}
// Pergola (Block 138): innere Pfosten (nicht am Rand) tragen Balken in beide Richtungen bis zum Rand. Welche laufen durch Feld (x, y)?
// Ein Balken längs u liegt bei v = Pfosten-v; er gilt hier, wenn das Dach vom Pfosten bis hierher ohne Lücke weitergeht. → [[ax, at]]
const ROOF_REACH = 14;
function roofInnerBeams(A, x, y) {
  if (!state.decos.size) return [];
  const sOf = roofSubOf;
  const cov = (u, v) => A.sub(sOf(u), sOf(v));
  const clear = (u0, v0, u1, v1) => { const n = Math.ceil(Math.hypot(u1 - u0, v1 - v0) / 0.2); for (let i = 0; i <= n; i++) if (!cov(u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n)) return false; return true; };
  const out = new Map();
  const look = (tx, ty) => {
    const ds = state.decos.get(tx + ',' + ty);
    if (ds) ds.forEach((d, i) => {
      if (!d || d.b !== 'stuetze') return;
      const [pu, pv] = pillarPos(tx, ty, i, d);
      if (A.dist(pu, pv) <= 0.15) return;                                  // am Rand: trägt der Randbalken
      if (Math.abs(pv - y) <= 0.5 + PERG_T && clear(pu, pv, x, pv)) out.set('u' + pv.toFixed(3), ['u', pv]);
      if (Math.abs(pu - x) <= 0.5 + PERG_T && clear(pu, pv, pu, y)) out.set('v' + pu.toFixed(3), ['v', pu]);
    });
  };
  for (let ty = y - 1; ty <= y + 1; ty++) for (let tx = x - ROOF_REACH; tx <= x + ROOF_REACH; tx++) look(tx, ty);
  for (let tx = x - 1; tx <= x + 1; tx++) for (let ty = y - ROOF_REACH; ty <= y + ROOF_REACH; ty++) if (Math.abs(ty - y) > 1) look(tx, ty);
  return [...out.values()];
}
// Platz einer Stütze in Weltkoordinaten (Slot, an die Dachkante gerückt)
function pillarPos(x, y, i, d) { const [u, v] = slotPos(x, y, i, d); return pillarSnap(x + u, y + v); }
// Dicke Pfosten (Pergola, Arkaden) bündig: um ihre halbe Breite nach innen unters Dach, damit ihre Außenseiten genau unter der Kante
// liegen (Nutzer: „bündig“) – sonst stünde die Hälfte über die Kante hinaus. Nur zum Zeichnen; Bögen rechnen mit der Kante.
const PILLAR_HALF = Object.fromEntries(Object.entries(ROOF_FRAME).map(([k, F]) => [k, F.T / 2]));   // Pfosten so stark wie der Rahmen
function pillarInset(pu, pv, form) {
  const h = PILLAR_HALF[(DECO_LOOKS.dach.forms[form] || {}).id];
  if (!h) return [pu, pv];
  const at = (u, v) => { const r = roofAt(Math.round(u), Math.round(v)); if (!r) return false; const A = roofArea(roofCov(r)), s = roofSubOf; return A.sub(s(u), s(v)); };
  // Richtung ins Dach aus den vier schrägen Nachbarpunkten: Außenecke (nur einer gedeckt) → zu ihm, Kante (zwei) → senkrecht zur Kante,
  // Innenecke (drei gedeckt, Ecke eines Hofs) → weg vom freien, mitten im Dach (vier) → bleibt
  const e = 0.06, c = [[1, 1], [1, -1], [-1, 1], [-1, -1]].filter(([a, b]) => at(pu + a * e, pv + b * e));
  if (c.length === 4 || !c.length) return [pu, pv];
  const su = c.reduce((t, [a]) => t + a, 0), sv = c.reduce((t, [, b]) => t + b, 0);
  return [pu + Math.sign(su) * h, pv + Math.sign(sv) * h];
}
// Form der Stütze: die des Dachs darüber (Feld des Platzes, am Eckpunkt eins der vier), sonst Pergola (Holzpfosten)
function pillarForm(x, y, u, v) {
  const fx = Math.round(x + u), fy = Math.round(y + v);
  for (const [dx, dy] of [[0, 0], [-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1]]) {
    const r = roofAt(fx + dx, fy + dy);
    if (r && Math.abs(x + u - (fx + dx)) <= 0.51 && Math.abs(y + v - (fy + dy)) <= 0.51) return r.form || 0;
  }
  return 0;
}
// Stütze zeichnen (drawObject 'stuetze'): Fuß bei (cx, cy), Höhe genau bis unters Dach
function drawPillar(cx, cy, z, form) {
  const f = (DECO_LOOKS.dach.forms[form] || DECO_LOOKS.dach.forms[0]).id, F = ROOF_FRAME[f], H = ROOF_H, a = F.T * TW / 2 * z, b = F.T * TH / 2 * z;
  if (f === 'arkaden') {                                                 // Steinpfeiler mit Sockel; oben trägt der Steinbalken
    box(cx, cy, a * 1.25, b * 1.25, 1.6 * z, '#c8b896', null, 0);
    box(cx, cy - 1.6 * z, a, b, (H - F.BH - 1.6) * z, F.post, null, 0);
  } else box(cx, cy, a, b, (H - F.BH) * z, F.post, null, 0);            // so stark wie der Rahmen, trägt ihn bündig
}
// Vorschaubild (Leiste, Kunstakademie): ein Feld Weg mit Dach und vier Stützen
function drawRoofIcon(cx, cy, z, form = 0, col = 0) {
  const P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z];
  const cov = (x, y) => x === 0 && y === 0, A = roofArea(cov);
  const h = PILLAR_HALF[(DECO_LOOKS.dach.forms[form] || {}).id] || 0;   // bündig unter der Kante wie im Spiel
  for (const [u, v] of [[-RW, -RW], [RW, -RW], [-RW, RW], [RW, RW]]) { const p = P(u - Math.sign(u) * h, v - Math.sign(v) * h); drawPillar(p[0], p[1], z, form); }
  paintRoof(P, A, 0, 0, { form, col }, z);
}

// ---------------------------------------------------------------------------
// Deko auf dem Dach (Block 138b, Nutzer 09.10.2026: „imagine man könnte da jetzt Deko oben draufstellen“): nur auf Steinarkaden,
// nur kleine Deko. Sie gehört zum Dachfeld (r.top, 8 Plätze wie am Boden: 4 Ecken, 4 Seitenmitten) – so zieht sie beim Verschieben,
// Kopieren und Rückgängig mit dem Dach mit. Wer das Dach abreißt, bekommt sie voll zurück (roofTopClear); die Form wechseln geht erst, wenn sie weg ist (roofFormLock).
// Gezeichnet mit dem Dach des Felds (render.js tileB), Laternen als Platz 10 + i (Strom: computePower)
// ---------------------------------------------------------------------------
const ROOF_TOP_OFF = 0.3, ROOF_TOP_SLOT0 = 10;                        // Abstand von der Feldmitte (der Steinrand liegt bei 0,41)
const ROOF_TOP_NO = new Set(['stuetze', 'souvenir']);                  // Stütze trägt das Dach; Souvenirs hängen am Bodenplatz
const roofTopOk = b => !!(ITEMS[b] && ITEMS[b].small && !ROOF_TOP_NO.has(baseOf(b)));
const roofTopRoof = (x, y) => { const r = roofAt(x, y); return r && roofForm(r) === 'arkaden' ? r : null; };
const roofTopPos = i => i < 4 ? [(i & 1 ? 1 : -1) * ROOF_TOP_OFF, (i & 2 ? 1 : -1) * ROOF_TOP_OFF] : [[-1, 0], [0, -1], [1, 0], [0, 1]][i - 4].map(c => c * ROOF_TOP_OFF);
const roofTopsOf = r => (r && Array.isArray(r.top) ? r.top : []);
// Platz auf dem Dach unter dem Finger (Steinarkaden): nächster der 8 Plätze, gemessen auf Dachhöhe
function roofTopAt(sx, sy) {
  if (!state.roofs || !state.roofs.size || !cam) return null;
  const p = roofPick(sx, sy);
  if (!p || !roofTopRoof(p.x, p.y)) return null;
  const [a, b] = tileFrac(sx, sy + ROOF_H * cam.z), du = a - p.x, dv = b - p.y;
  let slot = 0, best = Infinity;
  for (let i = 0; i < 8; i++) { const [u, v] = roofTopPos(i), d = (u - du) ** 2 + (v - dv) ** 2; if (d < best) { best = d; slot = i; } }
  return { x: p.x, y: p.y, slot };
}
// Deko oben, die man dort sieht (Antippen, 🧹): Platz unter dem Finger, sonst die Deko, deren Bild den Punkt trifft
function roofTopHit(sx, sy) {
  if (!state.roofs || !state.roofs.size || !cam) return null;
  const z = cam.z, cand = [];
  for (const [k, r] of state.roofs) {
    if (!r.top) continue;
    const [x, y] = keyXY(k), p = toScreen(x, y);
    r.top.forEach((d, i) => {
      if (!d) return;
      const [u, v] = roofTopPos(i), s = decoScale(d.b) * 0.9, qx = p.x + (u - v) * TW / 2 * z, qy = p.y + (u + v) * TH / 2 * z - ROOF_H * z;
      if (Math.abs(sx - qx) <= 9 * z * s && sy <= qy + 4 * z * s && sy >= qy - 40 * z * s) cand.push({ x, y, slot: i, d: x + y + (u + v) * 0.1 });
    });
  }
  if (!cand.length) return null;
  cand.sort((p, q) => q.d - p.d);
  return cand[0];
}
function roofTopError(b, x, y, slot, opts = {}) {
  const d = ITEMS[b];
  if (!ownedTile(x, y)) return notMine(x, y);
  if (!roofTopOk(b)) return 'Das passt nicht aufs Dach';
  if (!opts.move && !available(b)) return `${d.name}: ${lockText(b).replace('🔒 ', 'erst mit ')}`;
  const r = roofTopRoof(x, y);
  if (!r) return 'Deko geht nur auf Steinarkaden';
  const top = roofTopsOf(r);
  if (top[slot]) return top.slice(0, 8).every(Boolean) ? 'Alle Plätze auf dem Dach sind belegt' : 'Dieser Platz ist schon belegt';
  if (inHole(roofHoles(x, y), x + roofTopPos(slot)[0], y + roofTopPos(slot)[1], 0.12)) return 'Hier ist die Öffnung der Treppe';
  if (opts.move || opts.noCost) return null;
  if (state.money < d.cost) return 'Zu wenig Taler';
  return matError(d.mat);
}
function roofTopFree(x, y, slot) {
  const top = roofTopsOf(roofAt(x, y));
  const i = (slot < 4 ? [slot, slot ^ 1, slot ^ 2, slot ^ 3] : [slot, 4 + ((slot - 2) & 3), 4 + ((slot - 3) & 3), 4 + ((slot - 1) & 3)]).find(n => !top[n]);
  return i == null ? slot : i;
}
function buildRoofTop(b, x, y, slot) {
  const err = roofTopError(b, x, y, slot);
  if (err) { fail(err); return false; }
  const r = roofAt(x, y);
  state.money -= ITEMS[b].cost;
  payMat(ITEMS[b].mat);
  if (!r.top) r.top = newSlots();
  r.top[slot] = { b, rot: smallRot(b, slot), born: performance.now(), ...(b === 'busch' ? bushColNew('busch') : {}), ...(DECO_LOOKS[baseOf(b)] ? decoLookNew(baseOf(b)) : {}) };
  sfx('deco'); recalc(); checkStars(); save();
  return true;
}
function removeRoofTop(x, y, slot) {
  const r = roofAt(x, y), d = r && roofTopsOf(r)[slot];
  if (!d) return false;
  payBackDeco(d);
  r.top[slot] = null;
  if (r.top.every(v => !v)) delete r.top;
  sfx('dig'); recalc(); save();
  return true;
}
// Steinarkaden in eine andere Form? Nicht, solange oben Deko steht oder darunter eine Dachtreppe (Nutzer: „verschwindet ALLES darauf –
// das sollte gesperrt sein“). keys: die Felder, die umgestellt werden sollen
function roofFormLock(keys) {
  for (const k of keys) {
    const r = state.roofs.get(k);
    if (!r || roofForm(r) !== 'arkaden') continue;
    if (roofTopsOf(r).some(Boolean)) return 'Auf dem Dach steht Deko – erst wegräumen, dann die Form ändern';
    const [x, y] = keyXY(k), a = COVER.get(k) || k, t = state.tiles.get(a);
    if (t && t.b === 'dachtreppe') return 'Unter dem Dach steht eine Treppe – erst abreißen, dann die Form ändern';
  }
  return null;
}
// Dach mit seiner Deko kopieren (Verschieben, Kopieren): eigene Liste, ohne Animation; fresh: die Kopie ist bezahlt
const roofCopy = (r, fresh = false) => { const o = { ...r }; if (r.top) o.top = r.top.map(d => { if (!d) return null; const { born, ...e } = d; if (fresh) delete e.free; return e; }); return o; };
// alles von einem Dach herunter, voll zurück (Abreißen, andere Form); Rückgabe: wie viele
function roofTopClear(r) {
  let n = 0;
  for (const d of roofTopsOf(r)) if (d) { payBackDeco(d); n++; }
  if (r) delete r.top;
  return n;
}
const roofTopBack = r => roofTopsOf(r).reduce((s, d) => s + (d ? decoBack(d) : 0), 0);
// Zeichnen: nach dem Dach desselben Felds, von hinten nach vorn
function drawRoofTops(x, y, px, py, z, now) {
  const r = roofAt(x, y);
  if (!r || !r.top) return;
  for (const i of SLOTS_ALL) {
    const d = i < 8 && r.top[i];
    if (!d) continue;
    const [u, v] = roofTopPos(i);
    let sc = 1;
    if (d.born) { const a = (now - d.born) / 380; if (a < 1) sc = 0.5 + 0.5 * Math.sin(a * Math.PI / 2); }
    drawSmallOne(d.b, d.rot || 0, px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - ROOF_H * z, z, now, x, y, sc, ROOF_TOP_SLOT0 + i, d.col || 0, d.form || 0);
  }
}
// vordere Brüstung eines Felds (nach der Deko oben und den Leuten darauf): aus dem Dachbild gemerkt, live gezeichnet
function drawRoofFront(x, y, px, py, z) {
  const e = roofSprites.get(x + ',' + y);
  if (!e || !e.front || !e.front.length) return;
  roofOps(e.front, (u, v, up = 0) => [px + (u - x - (v - y)) * TW / 2 * z, py + (u - x + v - y) * TH / 2 * z - up * z], z);
}
// alle Deko auf Dächern: [Feldschlüssel, Platz, Deko] (Schönheit, Strom, Erfolge)
function* roofTopAll() {
  if (!state.roofs) return;
  for (const [k, r] of state.roofs) if (r.top) for (let i = 0; i < 8; i++) if (r.top[i]) yield [k, i, r.top[i]];
}
// Deko oben verschieben (Nutzer: „kein Verschieben-Knopf“): aufnehmen wie Deko am Boden (moving.top merkt, wohin sie zurückgehört);
// ablegen aufs Steindach (dropRoofTop) oder an den Boden (dropAt) – und Deko vom Boden darf genauso aufs Dach
function pickUpRoofTop(x, y, slot) {
  if (moving) return false;
  const r = roofAt(x, y), d = r && roofTopsOf(r)[slot];
  if (!d) { toast('Hier ist nichts zum Verschieben'); return false; }
  moving = { kind: 'deco', d, from: [x + ',' + y, slot], top: true };
  r.top[slot] = null;
  if (r.top.every(v => !v)) delete r.top;
  buildRot = d.rot || 0; rotManual = false;
  recalc(); sfx('deco');
  $('rot-btn').hidden = !ROTATABLE.has(d.b);
  toast('Tippe, wohin es soll – aufs Dach oder an den Boden' + (ROTATABLE.has(d.b) ? ' · drehen mit ⟳ oder Mausrad' : ''));
  return true;
}
function dropRoofTop(x, y, slot) {
  const err = roofTopError(moving.d.b, x, y, slot, { move: true });
  if (err) { fail(err); return false; }
  const r = roofAt(x, y);
  if (!r.top) r.top = newSlots();
  r.top[slot] = { ...moving.d, rot: ROTATABLE.has(moving.d.b) ? buildRot : 0, born: performance.now() };
  moving = null;
  $('rot-btn').hidden = true;
  sfx('build'); recalc(); save();
  return true;
}
// zurück aufs Dach, von dem sie kam (Abbrechen, Speichern zwischendurch); ist das Dach weg, zurück ins Lager
function roofTopPutBack(it) {
  const [k, slot] = it.from, r = state.roofs.get(k);
  if (!r || roofForm(r) !== 'arkaden' || (r.top && r.top[slot])) { payBackDeco(it.d); return; }
  if (!r.top) r.top = newSlots();
  r.top[slot] = it.d;
}
// was gerade getragen wird, ist Deko, die aufs Dach darf (Verschieben)
const roofTopCarried = () => tool === 'verschieben' && moving && moving.kind === 'deco' && !moving.copy && roofTopOk(moving.d.b) ? moving.d.b : null;

// ---------------------------------------------------------------------------
// Treppe durch die Dachöffnung (Block 138d, Nutzer 09.10.2026: „Aufgang zwischen den Überdachungen – Decke offen, Treppe runter“;
// die Freitreppe außen nicht): Bauteil auf zwei Feldern unter Steinarkaden (ITEMS.dachtreppe, 1 × 2). Die Treppe steht unten wie
// jedes Gebäude; das Dach darüber hat dort eine Öffnung (roofHoles) mit niedriger Brüstung an drei Seiten – offen, wo man oben
// ankommt. rot: hinauf = DT_UP[rot] (rot 0/2 längs v, 1/3 längs u)
// ---------------------------------------------------------------------------
const DT_UP = [[0, -1], [-1, 0], [0, 1], [1, 0]], DT_LEN = 0.75, DT_HALF = 0.3, DT_FOOT = 0.85, DT_N = 12;
// Mitte (zwischen den zwei Feldern) und Richtung einer Dachtreppe
function dtGeo(ax, ay, rot) {
  const [Du, Dv] = DT_UP[rot & 3], long = rot & 1;
  return { mu: ax + (long ? 0.5 : 0), mv: ay + (long ? 0 : 0.5), Du, Dv };
}
// Öffnungen, die Feld (x, y) berühren: Rechteck in Weltkoordinaten, dazu die obere Seite (dort keine Brüstung)
function roofHoles(x, y, pad = 0) {                                     // pad: auch Öffnungen, die das Feld nur berühren
  const out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const k = (x + dx) + ',' + (y + dy), t = state.tiles.get(k);
    if (!t || t.b !== 'dachtreppe') continue;
    const rot = (t.rot || 0) & 3, ax = x + dx, ay = y + dy, G = dtGeo(ax, ay, rot), lu = G.Du ? DT_LEN : DT_HALF, lv = G.Dv ? DT_LEN : DT_HALF;
    // Nebeneinander, gleiche Richtung (Nutzer: „Doppel-/Dreifach-Aufgang, breiter“): die Öffnungen gehen bis zur Feldgrenze ineinander über
    const same = (bx, by) => { const n = state.tiles.get(bx + ',' + by); return !!n && n.b === 'dachtreppe' && ((n.rot || 0) & 3) === rot; };
    const [pu, pv] = rot & 1 ? [0, 1] : [1, 0], jP = same(ax + pu, ay + pv), jM = same(ax - pu, ay - pv);
    const h = { u0: G.mu - lu, u1: G.mu + lu, v0: G.mv - lv, v1: G.mv + lv, Du: G.Du, Dv: G.Dv, mu: G.mu, mv: G.mv, rot, jP, jM };
    if (pu) { if (jM) h.u0 = G.mu - 0.5; if (jP) h.u1 = G.mu + 0.5; } else { if (jM) h.v0 = G.mv - 0.5; if (jP) h.v1 = G.mv + 0.5; }
    if (h.u1 > x - 0.5 - pad && h.u0 < x + 0.5 + pad && h.v1 > y - 0.5 - pad && h.v0 < y + 0.5 + pad) out.push(h);
  }
  return out;
}
const inHole = (hs, u, v, m = 0) => hs.some(h => u > h.u0 - m && u < h.u1 + m && v > h.v0 - m && v < h.v1 + m);
function dtError(x, y, rot) {
  const [w, h] = sizeOf('dachtreppe', rot);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const r = roofTopRoof(x + i, y + j);
    if (!r) return 'Unter Steinarkaden stellen (beide Felder überdacht)';
    const G = dtGeo(x, y, rot), lu = G.Du ? DT_LEN : DT_HALF, lv = G.Dv ? DT_LEN : DT_HALF, hs = [{ u0: G.mu - lu, u1: G.mu + lu, v0: G.mv - lv, v1: G.mv + lv }];
    if (roofTopsOf(r).some((d, s) => d && s < 8 && inHole(hs, x + i + roofTopPos(s)[0], y + j + roofTopPos(s)[1], 0.12))) return 'Erst die Deko oben an der Öffnung wegräumen';
  }
  // oben Platz zum Aussteigen: hinter dem oberen Ende noch Dach, nicht gleich die Brüstung
  const G = dtGeo(x, y, rot), eu = G.mu + G.Du * (DT_LEN + 0.25), ev = G.mv + G.Dv * (DT_LEN + 0.25), er = roofTopRoof(Math.round(eu), Math.round(ev));
  if (!er || roofArea(roofCov(er)).dist(eu, ev) < 0.16) return 'Oben braucht die Treppe Platz zum Aussteigen – ein Feld weiter ins Dach';
  return null;
}
// Stufen der Treppe als Quader vom Boden, oben bündig mit dem Dach, unten bis kurz hinter die Öffnung; P in Weltkoordinaten
// relativ zur Mitte (u, v, Höhe). Von hinten nach vorn
// Zeichnen auf dem Spielbild (Bildpunkte): Fläche, oder mit w eine Linie (Schattenkante)
const dtLive = z => (pts, col, w) => {
  if (w) { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke(); return; }
  poly(pts, C(col)); g.strokeStyle = C(col); g.lineWidth = 0.3 * z; g.lineJoin = 'round'; g.stroke();
};
function dtSteps(rot, P, q, jM = false, jP = false, only = null, out = null) {   // out: Teile dort sammeln (mehrere Spuren gemeinsam sortieren)     // jM/jP: Nachbartreppe auf der Seite mit kleinerem/größerem u bzw. v; only(d0, d1): nur diese Stufen
  const H = ROOF_H, F = ROOF_FRAME.arkaden, [Du, Dv] = DT_UP[rot & 3], [Su, Sv] = [-Dv, Du], w = DT_HALF;   // bis an die Lochwand
  const plus = Su + Sv > 0, wp = (plus ? jP : jM) ? 0.51 : w, wm = (plus ? jM : jP) ? 0.51 : w;   // zur Nachbartreppe: über die Feldgrenze, ohne Fuge
  const parts = [], dd = (DT_LEN + DT_FOOT) / DT_N;
  for (let i = 0; i < DT_N; i++) {
    const d1 = DT_LEN - i * dd, d0 = d1 - dd, h = H * (DT_N - i) / DT_N;
    if (only && !only(d0, d1)) continue;
    const a = [Du * d0 + Su * -wm, Dv * d0 + Sv * -wm], b = [Du * d1 + Su * wp, Dv * d1 + Sv * wp];
    const u0 = Math.min(a[0], b[0]), u1 = Math.max(a[0], b[0]), v0 = Math.min(a[1], b[1]), v1 = Math.max(a[1], b[1]);
    parts.push({ k: u0 + u1 + v0 + v1 + 2 * (out ? out.base || 0 : 0), draw: () => {
      q([P(u0, v1, 0), P(u1, v1, 0), P(u1, v1, h), P(u0, v1, h)], F.sV);
      q([P(u1, v0, 0), P(u1, v1, 0), P(u1, v1, h), P(u1, v0, h)], F.sU);
      q([P(u0, v0, h), P(u1, v0, h), P(u1, v1, h), P(u0, v1, h)], F.top);
      if (Du + Dv > 0 && i < DT_N - 1) {                                 // steigt zum Betrachter an: die Stufe davor sieht man nicht –
        const e0 = [Du * d0 + Su * -wm, Dv * d0 + Sv * -wm], e1 = [Du * d0 + Su * wp, Dv * d0 + Sv * wp];   // Schattenkante, wo es hinabgeht
        q([P(e0[0], e0[1], h), P(e1[0], e1[1], h)], F.sU, 0.9);
      }
    } });
  }
  if (out) { out.push(...parts); return; }
  parts.sort((p, r) => p.k - r.k).forEach(p => p.draw());
}
// drawObject 'dachtreppe': unter Steinarkaden malt das Dach die Treppe (durch die Öffnung, paintRoof) – sonst würden Stufen, die zu
// einem späteren Feld gehören, über das Dach davor gemalt. Ohne Dach darüber (oder als Bildchen) hier
function drawDachtreppe(cx, cy, z, rot, x, y) {
  if (x != null && roofTopRoof(x, y) && (state.tiles.get(x + ',' + y) || {}).b === 'dachtreppe') return;
  const P = (u, v, up) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z];
  dtSteps(rot, P, dtLive(z));
}
// Antippen in einer Öffnung (Dachhöhe): die Dachtreppe darunter – ihr Ankerfeld (Fenster, Abreißen, Verschieben)
function holeHit(sx, sy) {
  if (!state.roofs || !state.roofs.size || !cam) return null;
  const [a, b] = tileFrac(sx, sy + ROOF_H * cam.z), x = Math.round(a), y = Math.round(b);
  if (!roofTopRoof(x, y) || !inHole(roofHoles(x, y), a, b)) return null;
  const k = COVER.get(x + ',' + y) || x + ',' + y, t = state.tiles.get(k);
  if (!t || t.b !== 'dachtreppe') return null;
  const [ax, ay] = keyXY(k);
  return { x: ax, y: ay };
}
// Höhe auf der Treppe (für die Leute darauf): die Stufe, auf der man bei d steht (oben das Dach, unten der Boden)
const dtHeight = d => { const i = Math.floor((DT_LEN - d) / ((DT_LEN + DT_FOOT) / DT_N)); return i < 0 ? ROOF_H : i >= DT_N ? 0 : ROOF_H * (DT_N - i) / DT_N; };

// ---------------------------------------------------------------------------
// Leute auf dem Dach (Block 138d): erscheinen am Fuß einer Dachtreppe, steigen hinauf, bummeln über die Steinarkaden (Raster 1/3
// Feld, nicht an die Brüstung, nicht in Öffnungen oder Deko), setzen sich gern auf eine Bank oben und gehen wieder hinunter.
// Gezeichnet mit dem Dachfeld (render.js): auf der Treppe nur durch die Öffnung, oben vor der Deko und hinter der vorderen Brüstung
// ---------------------------------------------------------------------------
const roofers = [], ROOFER_MAX = 16;
let rfCache = { ver: '', spots: new Map(), areas: new Map() };
function rfVer() { return groundVersion + ':' + state.roofs.size + ':' + state.tiles.size + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0); }
function rfFresh() { const v = rfVer(); if (rfCache.ver !== v) rfCache = { ver: v, spots: new Map(), areas: new Map() }; return rfCache; }
// Rasterpunkt (a/3, b/3) begehbar? Auf Steinarkaden, weg vom Rand (Brüstung), nicht in einer Öffnung, nicht auf Deko oben
function rfSpotOk(a, b) {
  const c = rfFresh(), key = a + ',' + b;
  if (c.spots.has(key)) return c.spots.get(key);
  const u = a / 3, v = b / 3, x = Math.round(u), y = Math.round(v), r = roofTopRoof(x, y);
  let ok = false;
  if (r) {
    let A = c.areas.get(r.form || 0);
    if (!A) { A = roofArea(roofCov(r)); c.areas.set(r.form || 0, A); }
    ok = A.sub(roofSubOf(u), roofSubOf(v)) && A.dist(u, v) >= 0.16 && !inHole(roofHoles(x, y), u, v, 0.1)
      && !roofTopsOf(r).some((d, i) => d && i < 8 && d.b !== 'bank' && Math.hypot(x + roofTopPos(i)[0] - u, y + roofTopPos(i)[1] - v) < 0.14);
  }
  c.spots.set(key, ok);
  return ok;
}
// alle Dachtreppen unter Steinarkaden: Mitte, Richtung hinauf, Rasterpunkt oben am Ausgang
function roofStairs() {
  const out = [];
  for (const [k, t] of state.tiles) {
    if (t.b !== 'dachtreppe') continue;
    const [ax, ay] = keyXY(k), G = dtGeo(ax, ay, t.rot || 0);
    if (!roofTopRoof(ax, ay)) continue;
    const ex = Math.round((G.mu + G.Du * (DT_LEN + 0.09)) * 3), ey = Math.round((G.mv + G.Dv * (DT_LEN + 0.09)) * 3);
    out.push({ k, ...G, ex, ey, rot: (t.rot || 0) & 3 });
  }
  return out;
}
function syncRoofers() {
  const stairs = typeof T !== 'undefined' && T.pop ? roofStairs() : [];
  const night = typeof dayPart === 'function' && dayPart() === 'nacht';
  const want = Math.min(ROOFER_MAX, stairs.reduce((n, s) => n + Math.min(4, 1 + Math.floor(roofRunKeys(...keyXY(s.k)).length / 3)), 0) >> (night ? 1 : 0));
  for (const w of roofers) if (!stairs.some(s => s.k === w.stair.k)) w.gone = true;   // Treppe weg: verschwinden
  const live = roofers.filter(w => !w.gone && w.st !== 'down' && !w.leave);
  for (let i = want; i < live.length; i++) live[i].leave = true;                      // zu viele: gehen wieder hinunter
  if (live.length >= want || !stairs.length) return;
  const s = stairs[Math.floor(Math.random() * stairs.length)];
  const homes = [...state.tiles].filter(([, t]) => isHome(t.b) && t.animal), [hk, ht] = homes.length ? homes[Math.floor(Math.random() * homes.length)] : [null, null];
  roofers.push({ roofer: true, stair: s, st: 'up', d: -DT_FOOT - 0.05, px: s.mu - s.Du * DT_FOOT, py: s.mv - s.Dv * DT_FOOT, up: 0, wait: 0,
    ...(hk ? residentLook(hk, Math.floor(Math.random() * residentsOf(ht).length)) : { kind: Math.floor(Math.random() * 3), fur: FUR[Math.floor(Math.random() * FUR.length)] }),
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.35 + Math.random() * 0.25, life: 18 + Math.random() * 25 });
}
// Bank oben auf Feld (x, y) nahe am Rasterpunkt: Platz zum Sitzen
function rfBench(a, b) {
  const x = Math.round(a / 3), y = Math.round(b / 3), r = roofAt(x, y);
  for (const [i, d] of roofTopsOf(r).entries()) if (d && i < 8 && d.b === 'bank') { const [u, v] = roofTopPos(i); if (Math.hypot(x + u - a / 3, y + v - b / 3) < 0.25) return [x + u, y + v]; }
  return null;
}
function stepRoofers(dt) {
  for (const w of roofers) {
    const s = w.stair;
    if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0 && w.sit) { w.sit = false; w.px = w.fa / 3; w.py = w.fb / 3; } continue; }
    if (w.st === 'up' || w.st === 'down') {
      w.d += (w.st === 'up' ? 1 : -1) * dt * w.speed * 0.9;
      if (w.st === 'up' && w.d >= DT_LEN) { w.st = 'roof'; w.fa = w.ta = s.ex; w.fb = w.tb = s.ey; w.t = 1; }
      else if (w.st === 'down' && w.d <= -DT_FOOT - 0.05) { w.gone = true; continue; }
      if (w.st !== 'roof') { w.px = s.mu + s.Du * w.d; w.py = s.mv + s.Dv * w.d; w.up = dtHeight(w.d); continue; }
    }
    w.up = ROOF_H;
    w.life -= dt;
    w.t += dt * w.speed * 3;                                            // ein Rasterschritt ist 1/3 Feld
    if (w.t >= 1) {
      w.fa = w.ta; w.fb = w.tb; w.t = 0;
      const home = w.fa === s.ex && w.fb === s.ey;
      if ((w.leave || w.life < 0) && home) { w.st = 'down'; w.d = DT_LEN; continue; }
      const bench = !w.leave && w.life > 0 && Math.random() < 0.3 && rfBench(w.fa, w.fb);
      if (bench && !roofers.some(o => o !== w && o.sit && o.fa === w.fa && o.fb === w.fb)) { w.sit = true; w.wait = 5 + Math.random() * 7; w.px = bench[0]; w.py = bench[1]; continue; }
      const cand = DIRS.map(([dx, dy]) => [w.fa + dx, w.fb + dy]).filter(([a, b]) => rfSpotOk(a, b) || (a === s.ex && b === s.ey));
      let pool = cand.length > 1 && w.pa != null ? cand.filter(([a, b]) => a !== w.pa || b !== w.pb) : cand;
      if (w.leave || w.life < 0) {                                       // heimwärts: zum Ausgang an der Treppe
        const dist = ([a, b]) => Math.abs(a - s.ex) + Math.abs(b - s.ey), m = Math.min(...cand.map(dist));
        pool = Math.random() < 0.85 ? cand.filter(c => dist(c) === m) : pool;
      }
      w.pa = w.fa; w.pb = w.fb;
      if (!pool.length) { w.ta = w.fa; w.tb = w.fb; w.wait = 1; }
      else { [w.ta, w.tb] = pool[Math.floor(Math.random() * pool.length)]; if (Math.random() < 0.1) w.wait = 1 + Math.random() * 2; }
    }
    w.px = (w.fa + (w.ta - w.fa) * w.t) / 3; w.py = (w.fb + (w.tb - w.fb) * w.t) / 3;
  }
  for (let i = roofers.length - 1; i >= 0; i--) if (roofers[i].gone) roofers.splice(i, 1);
}
// Eine Treppe samt Nachbartreppen (breite Treppe): ihre Öffnungen und das Feld, das davon zuletzt gezeichnet wird (render.js: nach
// Diagonale x + y, dann x) – Leute auf der Treppe kommen erst dort dran, sonst malt das Dachbild eines späteren Felds seine Stufen
// über sie (Nutzer: „glitchen durch die Stufen“)
function rfGroup(s) {
  const c = rfFresh(), hit = c.groups && c.groups.get(s.k);
  if (hit) return hit;
  const t0 = state.tiles.get(s.k), rot = ((t0 && t0.rot) || 0) & 3, [pu, pv] = rot & 1 ? [0, 1] : [1, 0], [ax, ay] = keyXY(s.k), anchors = [[ax, ay]];
  const same = (x, y) => { const t = state.tiles.get(x + ',' + y); return !!t && t.b === 'dachtreppe' && ((t.rot || 0) & 3) === rot; };
  for (const sg of [1, -1]) for (let i = 1; i < 50 && same(ax + sg * i * pu, ay + sg * i * pv); i++) anchors.push([ax + sg * i * pu, ay + sg * i * pv]);
  const holes = new Map();
  let last = null;
  for (const [x, y] of anchors) for (const [fx, fy] of footprint('dachtreppe', x, y, rot)) {
    if (!last || fx + fy > last[0] + last[1] || (fx + fy === last[0] + last[1] && fx > last[0])) last = [fx, fy];
    for (const h of roofHoles(fx, fy)) holes.set(h.mu + ',' + h.mv, h);
  }
  const g = { last: last[0] + ',' + last[1], holes: [...holes.values()] };
  if (!c.groups) c.groups = new Map();
  c.groups.set(s.k, g);
  return g;
}
// je Feld (gerundete Lage), wer dort auf dem Dach bzw. auf der Treppe ist – render.js baut das einmal je Bild
function roofersByTile() {
  const m = new Map();
  for (const w of roofers) {
    if (typeof gfxPersonShown === 'function' && !gfxPersonShown(w)) continue;
    const k = w.st === 'roof' ? Math.round(w.px) + ',' + Math.round(w.py) : rfGroup(w.stair).last;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(w);
  }
  return m;
}
// zeichnen: stair = auf der Treppe (nur durch die Öffnung dieses Felds zu sehen, darüber frei), sonst oben
function drawRoofers(list, x, y, z, now, onStair) {
  for (const w of list) {
    if ((w.st === 'roof') === onStair) continue;
    if (!onStair) { drawWalker(w, z, now); continue; }
    const hs = rfGroup(w.stair).holes;
    if (!hs.length) continue;
    // sichtbar ist, was man durch die ganze Öffnung sieht (die Dächer danach sind dort durchsichtig) – und darüber nur, was wirklich
    // über das Dach hinausragt: alles oberhalb der Dachhöhe an der Stelle der Figur (Nutzer: „laufen unter dem Belag durch“)
    g.save(); g.beginPath();
    for (const h of hs) {
      const c = [[h.u0, h.v0], [h.u1, h.v0], [h.u1, h.v1], [h.u0, h.v1]].map(([u, v]) => { const p = toScreen(u, v); return [p.x, p.y - ROOF_H * z]; });
      g.moveTo(c[0][0], c[0][1]); for (let i = 1; i < 4; i++) g.lineTo(c[i][0], c[i][1]); g.closePath();
    }
    const top = toScreen(w.px, w.py).y - ROOF_H * z;
    g.rect(-1e5, -1e5, 2e5, 1e5 + top);
    g.clip('nonzero');
    try { drawWalker(w, z, now); } finally { g.restore(); }
    // Was vor der Figur liegt, noch einmal darüber – nur im Bereich der Figur (Nutzer: „glitchen durch die Treppe“, alle Drehungen):
    // steigt die Treppe zum Betrachter hin an, die höheren Stufen davor (in der Öffnung); immer die vorderen Mauern der Öffnung –
    // auch ihr Stück auf einem Nachbarfeld, das schon vorher gezeichnet war
    const s = w.stair, p0 = toScreen(w.px, w.py), feet = p0.y - w.up * z;
    const Pl = (u, v, up = 0) => { const p = toScreen(u, v); return [p.x, p.y - up * z]; };
    g.save(); g.beginPath(); g.rect(p0.x - 12 * z, feet - 50 * z, 38 * z, 58 * z); g.clip();
    try {
      if (s.Du + s.Dv > 0) {
        g.save(); g.beginPath();
        for (const h of hs) { const c = [[h.u0, h.v0], [h.u1, h.v0], [h.u1, h.v1], [h.u0, h.v1]].map(([u, v]) => Pl(u, v, ROOF_H)); g.moveTo(...c[0]); for (let i = 1; i < 4; i++) g.lineTo(...c[i]); g.closePath(); }
        g.clip();
        try {
          const parts = [];                                             // auch die Spuren daneben (breite Treppe), gemeinsam sortiert
          for (const h of hs) if (h.rot === s.rot) { parts.base = h.mu + h.mv; dtSteps(h.rot, (u, v, up) => Pl(h.mu + u, h.mv + v, up), dtLive(z), h.jM, h.jP, d0 => d0 >= w.d - 1e-6, parts); }
          parts.sort((p, r) => p.k - r.k).forEach(p => p.draw());
        } finally { g.restore(); }
      }
      for (const h of hs) roofOps(holeWallOps(h, roofPar(roofAt(Math.round(h.mu + h.Du * 0.4), Math.round(h.mv + h.Dv * 0.4)))).front, Pl, z);
    } finally { g.restore(); }
  }
}
