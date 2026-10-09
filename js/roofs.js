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
const roofAt = (x, y) => !!state.roofs && state.roofs.get(x + ',' + y);
const roofForm = r => (DECO_LOOKS.dach.forms[(r && r.form) || 0] || DECO_LOOKS.dach.forms[0]).id;
const ROOF_STY = {
  pergola: { post: '#8a5a3a', beam: '#6f4529', leaf: ['#4f9a3c', '#6fbf4f', '#3f8a35'], flower: ['#f28cb1', '#ffffff', '#c3a8e6', '#ffd23f'], vault: 0, lamp: true },
  glas:    { post: '#56606b', rib: 'rgba(70,82,95,0.9)', glass: 'rgba(196,232,246,0.42)', vault: 6, lamp: true },
  markise: { post: '#efe9dc', vault: 4 },
  arkaden: { stone: '#dccfb4', side: '#c8b896', dark: '#b3a283', top: '#e8dec9', vault: 0, lamp: false },   // geschlossenes Dach: kein Licht von oben sichtbar
};
// Teilstück-Gitter: Index s (je Achse) = 3·x + i, i ∈ {−1, 0, 1}
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
      const [du, dv] = slotPos(x, y, i, d), u = x + du, v = y + dv, on = e.ax === 'u' ? u : v, along = e.ax === 'u' ? v : u;
      if (Math.abs(on - line) < 0.04 && along > a - 0.04 && along < b + 0.04) out.push(along);
    });
  }
  return out;
}
const roofProf = (d, A) => A * Math.sin(Math.PI / 2 * Math.min(1, d / RW));

// Ein Feld malen. P(u, v, up) → Bildpunkt (Weltkoordinaten); lw: Strichstärke-Faktor. Nur die Teilstücke dieses Felds und seine
// Ränder – Nachbarn malen ihre eigenen (so überlappt nichts). Glas/Pergola: Rand rundum; Markise/Arkaden: Volant/Wand zum Betrachter.
function paintRoof(P, A, x, y, r, lw = 1) {
  const form = roofForm(r), S = ROOF_STY[form], H = ROOF_H;
  const poly = (pts, fill, stroke, w = 1) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); if (fill) { g.fillStyle = C(fill); g.fill(); } if (stroke) { g.strokeStyle = C(stroke); g.lineWidth = w * lw; g.lineJoin = 'round'; g.stroke(); } };
  const line = (pts, col, w) => { g.strokeStyle = C(col); g.lineWidth = w * lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  const hAt = (u, v) => H + roofProf(A.dist(u, v), S.vault);
  const edges = roofEdges(A, x, y);
  // Dach in kleine Vierecke (≤ 0,09), bei der Markise genau auf den Streifengrenzen geschnitten (Rand ± k · Streifen)
  const quads = [], lines = { u: new Set(), v: new Set() };
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
      return [...c].sort((p, q) => p - q);
    };
    const cu = cuts(u0, u1, 'u'), cv = cuts(v0, v1, 'v');
    for (let a = 0; a < cu.length - 1; a++) for (let b = 0; b < cv.length - 1; b++) quads.push([cu[a], cu[a + 1], cv[b], cv[b + 1]]);
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
  if (form === 'glas') {
    for (const q of quads) poly(corners(q), S.glass);
    ribs(0.25, hAt, S.rib, 0.7);
  } else if (form === 'markise') {
    const cols = [MARKISE_COLS[(r && r.col) || 0].c, '#fffaf0'];
    for (const q of quads) { const c = cols[Math.floor(A.dist((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, 2, true) / ROOF_STRIPE) % 2]; poly(corners(q), c, c, 0.35); }
  } else if (form === 'pergola') {
    ribs(0.25, () => H + 1, S.beam, 1.1);
    for (const q of quads) {
      const hh = hash(Math.round(q[0] * 97), Math.round(q[2] * 89), 3);
      if (hh > 0.45) continue;
      const i = Math.round(hh * 1000), p = P(q[0] + (q[1] - q[0]) * hash(i, 1, 5), q[2] + (q[3] - q[2]) * hash(i, 2, 5), H + 1.6);
      g.fillStyle = C(S.leaf[i % 3]); g.beginPath(); g.ellipse(p[0], p[1], 1.7 * lw, 1.1 * lw, 0, 0, 7); g.fill();
      if (i % 4 === 0) { g.fillStyle = C(S.flower[(i >> 2) % 4]); g.beginPath(); g.arc(p[0] + 0.7 * lw, p[1] - 0.5 * lw, 0.75 * lw, 0, 7); g.fill(); }
    }
  } else if (form === 'arkaden') {
    for (const q of quads) { const c = corners(q, 3); poly(c, S.top, S.top, 0.4); }
    for (const [ua, ub, va, vb] of quads) {                               // Steinfugen alle ½ Feld (an der Vorderkante des Vierecks)
      if (Math.abs(ub * 2 - Math.round(ub * 2)) < 1e-6) line([P(ub, va, H + 3), P(ub, vb, H + 3)], S.side, 0.4);
      if (Math.abs(vb * 2 - Math.round(vb * 2)) < 1e-6) line([P(ua, vb, H + 3), P(ub, vb, H + 3)], S.side, 0.4);
    }
  }
  // Ränder
  for (const e of edges) {
    const pt = (t, up) => e.ax === 'u' ? P(e.at, t, up) : P(t, e.at, up), front = e.n > 0;
    if (form === 'pergola') { line([pt(e.a, H), pt(e.b, H)], S.beam, 1.6); continue; }
    if (form === 'glas') { line([pt(e.a, H), pt(e.b, H)], S.rib, 0.9); continue; }
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
        arch.push(pt(t, H - 9 + 7 * Math.sin(Math.PI * Math.min(1, Math.max(0, f)))));
      }
      poly([...arch, pt(e.b, H), pt(e.a, H)], e.ax === 'v' ? S.side : S.stone);
      line(arch, S.dark, 0.6);
      poly([pt(e.a, H), pt(e.b, H), pt(e.b, H + 3), pt(e.a, H + 3)], e.ax === 'v' ? S.dark : S.side);
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
  let s = (r.form || 0) + ':' + (r.col || 0) + ':';
  for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) s += cov(x + dx, y + dy) ? 1 : 0;
  if (roofForm(r) === 'arkaden') {                                      // Bögen hängen an den Stützen des ganzen Laufs
    const A = roofArea(cov);
    for (const e of roofEdges(A, x, y)) if (e.n > 0) { const [a, b] = roofRun(A, e); s += '|' + a.toFixed(2) + ',' + b.toFixed(2) + ':' + roofPillarsOn(e, a, b).map(t => t.toFixed(2)).join(','); }
  }
  return s;
}
function drawRoofTile(x, y, px, py, z) {
  const r = roofAt(x, y);
  if (!r) return;
  const zs = spriteStep(z), want = zs * DPR, key = x + ',' + y;
  let e = roofSprites.get(key);
  // Schlüssel nur neu prüfen, wenn sich am Spielstand etwas getan hat (jedes Speichern zählt GL.drawEpoch hoch)
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + state.roofs.size + ':' + state.decos.size + '|' + want.toFixed(3) + (FOG ? 'n' : '');
  const sig = e && e.ver === ver ? e.sig : roofSig(x, y, r) + '|' + want.toFixed(3) + (FOG ? 'n' : '');
  if (e && e.sig === sig) e.ver = ver;
  if (roofFrame !== frameNo) { roofFrame = frameNo; roofSpent = 0; }
  const onlyZoom = e && e.base === sig.slice(0, sig.lastIndexOf('|'));     // nur die Zoomstufe ist anders
  if (!e || (e.sig !== sig && !(onlyZoom && roofSpent > ROOF_BUDGET))) {
    const t0 = performance.now(), B = ROOF_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try {
      g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want);
      const P = (u, v, up = 0) => [(u - x - (v - y)) * TW / 2, (u - x + v - y) * TH / 2 - up];
      paintRoof(P, roofArea(roofCov(r)), x, y, r, 1);
    } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, ver, base: sig.slice(0, sig.lastIndexOf('|')) };
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
// Dach weg/geändert: Bildchen der Nachbarschaft verwerfen (das Abstandsfeld reicht bis 3 Felder)
function roofDirty(x, y) {
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const k = (x + dx) + ',' + (y + dy), e = roofSprites.get(k); if (e) { freeCanvas(e.c); roofSprites.delete(k); } }
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
  const f = (DECO_LOOKS.dach.forms[form] || DECO_LOOKS.dach.forms[0]).id, H = ROOF_H;
  if (f === 'arkaden') {
    const w = 3.2;
    box(cx, cy, w * z, w * 0.5 * z, 2 * z, '#c8b896', null, 0);
    box(cx, cy - 2 * z, w * 0.8 * z, w * 0.4 * z, (H - 4) * z, '#dccfb4', null, 0);
    box(cx, cy - (H - 2) * z, w * z, w * 0.5 * z, 2 * z, '#e8dec9', null, 0);
  } else if (f === 'glas') {
    box(cx, cy, 2.4 * z, 1.2 * z, 0.8 * z, '#7a838c', null, 0);
    g.strokeStyle = C('#56606b'); g.lineWidth = 1.3 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - H * z); g.stroke();
  } else if (f === 'markise') {
    g.strokeStyle = C('#efe9dc'); g.lineWidth = 1.3 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - H * z); g.stroke();
    circle(cx, cy - H * z, 0.9 * z, C('#d9c9b8'));
  } else {
    box(cx, cy, 1.4 * z, 0.7 * z, H * z, '#8a5a3a', null, 0);
  }
}
// Vorschaubild (Leiste, Kunstakademie): ein Feld Weg mit Dach und vier Stützen
function drawRoofIcon(cx, cy, z, form = 0, col = 0) {
  const P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z];
  const cov = (x, y) => x === 0 && y === 0, A = roofArea(cov);
  for (const [u, v] of [[-RW, -RW], [RW, -RW], [-RW, RW], [RW, RW]]) { const p = P(u, v); drawPillar(p[0], p[1], z, form); }
  paintRoof(P, A, 0, 0, { form, col }, z);
}
