'use strict';
// ---------------------------------------------------------------------------
// U-Bahn (Block 136): Tunneleinfahrt, U-Bahn-Eingänge, Tunnel in der Bauansicht.
// Tunneleinfahrt (Nutzer, 09.10.2026: „man will einen Tunnel bauen, eine Einfahrt dazu und dann Schienen ran“): eigenes Bauteil,
// immer 2 Felder lang, drehbar. A = vorderes Feld (Schiene davor), B = hinteres (Tunnel dahinter), d = Richtung zum Tunnel.
//   Rampe: Rinne über A und B, das Gleis sinkt gleichmäßig bis zur Wand am Ende von B. (Die Portale im Hügel – Backstein, Naturstein – sind
//   weg, Block 157m: in einen Berg führt jetzt das Bergportal in der Wand einer Anhöhe, hills.js; alte Stände bekommen die Rampe.)
// Gezeichnet wie jedes große Gebäude in Streifen je Feld – so liegen Zäune ringsum, Züge und Hügel von selbst richtig.
// Rahmen S(a, b, up): a längs d, b quer, up in Bildpunkten bei z = 1.
// ---------------------------------------------------------------------------
const RAMP_W = 0.42, RAMP_D = 32;                                 // tief genug, dass ein Zug (bis 14 hoch) vor der Wand ganz drin ist (Nutzer: „glitcht“ – er ragte heraus)
const portalFaceShown = d => d[0] + d[1] < 0;                     // Wand zeigt zum Betrachter (Tunnel läuft nach hinten)
function portalFrame(cx, cy, z, d) {
  const L = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  return (a, b, up = 0) => { const p = L(d[0] * a - d[1] * b, d[1] * a + d[0] * b); return [p[0], p[1] - up * z]; };
}
function portalArch(S, a0, w, spring, top, n = 12) {
  const pts = [S(a0, -w, 0), S(a0, -w, spring)];
  for (let i = 0; i <= n; i++) { const t = Math.PI - i * Math.PI / n; pts.push(S(a0, Math.cos(t) * w, spring + Math.sin(t) * (top - spring))); }
  pts.push(S(a0, w, 0));
  return pts;
}
function portalLine(pts, col, w, z) { g.strokeStyle = C(col); g.lineWidth = w * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
const EIN_DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]];                  // Drehung → Richtung zum Tunnel
// Felder einer Einfahrt (Anker ax, ay, Drehung r): { A, B, d }
function einTiles(ax, ay, r) {
  const d = EIN_DIR[r & 3], f = footprint('tunneleinfahrt', ax, ay, r);
  const [p, q] = f, B = (q[0] - p[0]) * d[0] + (q[1] - p[1]) * d[1] > 0 ? q : p, A = B === q ? p : q;
  return { A, B, d };
}
// Gleisbett vor der Einfahrt: wie die Schiene, die dort anschließt (Nutzer: „Schienen wie das gewählte Muster“)
function einRailLook(A, d) {
  if (!A || A[0] > 1e5) return RAIL_LOOK.schotter;
  const t = state.tiles.get((A[0] - d[0]) + ',' + (A[1] - d[1]));
  return t && t.b === 'schiene' ? railLookOf(t) : RAIL_LOOK.schotter;
}
// Ganze Einfahrt (Rampe), Mitte der Grundfläche bei (cx, cy); x, y = Anker (im Vorschaubild weit weg)
function drawEinfahrt(cx, cy, z, x, y, t) {
  const r = (t && t.rot) || 0, real = x < 1e5 && t && state.tiles.get(x + ',' + y) === t;
  const { A, d } = real ? einTiles(x, y, r) : { A: null, d: EIN_DIR[r & 3] };
  const shown = portalFaceShown(d), lk = einRailLook(A, d);
  const [bx, by] = [cx + (d[0] - d[1]) * TW / 4 * z, cy + (d[0] + d[1]) * TH / 4 * z];
  drawRamp(portalFrame(bx, by, z, d), z, d, shown, lk);                  // Rahmen am hinteren Feld
}
// Rampe: Rinne über zwei Felder (a −1,5 … 0,5, Rahmen am hinteren Feld), gleichmäßig bis RAMP_D tief
const RAMP_LEN = 2;
const rampDepth = a => RAMP_D * Math.max(0, Math.min(1, (a - 0.5 + RAMP_LEN) / RAMP_LEN));
function drawRamp(S, z, d, shown, lk) {
  const len = RAMP_LEN, a0 = 0.5 - len, w = RAMP_W, N = 10 * len, as = i => a0 + len * i / N, dep = rampDepth;
  g.save();
  g.beginPath(); [S(a0, -w, 0), S(0.5, -w, 0), S(0.5, w, 0), S(a0, w, 0)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const floor = [];
  for (let i = 0; i <= N; i++) floor.push(S(as(i), -w, -dep(as(i))));
  for (let i = N; i >= 0; i--) floor.push(S(as(i), w, -dep(as(i))));
  poly(floor, C('#8e8a82'));
  for (const sg of [-1, 1]) {                                            // Innenwände: nur die, die zum Betrachter zeigen
    const nu = -d[1] * -sg, nv = d[0] * -sg;
    if (nu + nv <= 0) continue;
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) { top.push(S(as(i), sg * w, 0)); bot.push(S(as(i), sg * w, -dep(as(i)))); }
    poly([...top, ...bot.reverse()], C('#bcb7ad'));
    for (let i = 3; i < N; i += 4) portalLine([top[i], bot[N - i]], 'rgba(90,85,78,0.25)', 0.5, z);   // Fugen
  }
  if (shown) {
    poly([S(0.5, -w, -RAMP_D), S(0.5, w, -RAMP_D), S(0.5, w, 0), S(0.5, -w, 0)], C('#a9a399'));
    poly(portalArch(S, 0.5, 0.3, 14, 22).map(([px, py]) => [px, py + RAMP_D * z]), C('#231d1a'));   // Tunnelmund mit Bogen, unten an der Wand
  }
  rampTrack(S, z, a0, 0.5, dep, lk);
  g.restore();
  for (const sg of [-1, 1]) {                                            // Betonkante; ein eigener Zaun auf der Feldkante geht
    const b = sg * (w + 0.04);
    poly([S(a0, b - 0.04, 0), S(0.5, b - 0.04, 0), S(0.5, b + 0.04, 0), S(a0, b + 0.04, 0)], C('#d9d5cc'));
  }
}
// Gleisbett und Schienen (a von lo bis hi, in der Rampe schräg), Farben wie drawRailBed
function rampTrack(S, z, lo, hi, dep, lk) {
  const M = 8, at = (a, b) => S(a, b, -dep(a)), band = w => { const pts = []; for (let i = 0; i <= M; i++) pts.push(at(lo + (hi - lo) * i / M, -w)); for (let i = M; i >= 0; i--) pts.push(at(lo + (hi - lo) * i / M, w)); return pts; };
  if (lk.pave) { const pl = pathLook(lk.pave); poly(band(RAIL_W + 0.05), C(pl.edge)); poly(band(RAIL_W + 0.02), C(pl.fill)); }
  else {
    poly(band(RAIL_W + 0.03), C(lk.edge)); poly(band(RAIL_W), C(lk.bed));
    g.strokeStyle = C(lk.tie); g.lineWidth = 1.7 * z; g.lineCap = 'butt'; g.beginPath();
    for (let a = lo + 0.0625; a < hi; a += 0.125) { const p = at(a, -0.15), q = at(a, 0.15); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
    g.stroke();
  }
  for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) {
    const line = Array.from({ length: M + 1 }, (_, i) => at(lo + (hi - lo) * i / M, o));
    portalLine(line, lk.rail, lk.rw, z);
    portalLine(line.map(p => [p[0], p[1] - 0.4 * z]), '#dfe3e8', 0.45, z);
  }
}

// Zugwagen an der Einfahrt (render.js): im Berg unsichtbar, an der Wand abgeschnitten, in der Rampe sinkend
// → { k: Feld, mit dem er gezeichnet wird, cut: [lo, hi] längs des Wagens, portal } | 'hide' | null
function einAt(x, y) {
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  if (!t || t.b !== 'tunneleinfahrt') return null;
  const [ax, ay] = keyXY(a);
  return { ...einTiles(ax, ay, t.rot || 0), t };
}
function trainTunnelCut(m) {
  if (state.hills && state.hills.size && bpOn()) { const c = bpCut(m); if (c) return c; }   // Bergportal (157m, hills.js)
  if (!state.tunnels || !state.tunnels.size) return null;
  const rx = Math.round(m.px), ry = Math.round(m.py);
  let E = einAt(rx, ry);
  if (!E && tunnelAt(rx, ry)) {                                         // im Tunnel: nur direkt hinter einer Einfahrt sichtbar
    for (const [dx, dy] of DIRS) { const e = einAt(rx - dx, ry - dy); if (e && e.B[0] === rx - dx && e.B[1] === ry - dy && e.d[0] === dx && e.d[1] === dy) { E = e; break; } }
    if (!E) return 'hide';
  }
  if (!E) return null;
  const { A, B, d } = E, ramp = true;                                   // nur noch die Rampe (Block 157m)
  const fx = B[0] + d[0] * 0.5, fy = B[1] + d[1] * 0.5;                // Wand am Ende von B
  const s = (m.px - fx) * d[0] + (m.py - fy) * d[1], ed = m.du * d[0] + m.dv * d[1], la = m.len / 2;
  if (Math.abs(ed) < 0.5) return tunnelAt(rx, ry) && !einAt(rx, ry) ? 'hide' : null;   // quer zur Einfahrt: im Tunnel (Kurve direkt dahinter, Nutzer 11.10.2026) unsichtbar – sonst stand er oben auf der Wiese
  const lo = ed > 0 ? -la : Math.max(-la, s), hi = ed > 0 ? Math.min(la, -s) : la;
  if (hi - lo < 0.02) return 'hide';
  const later = (B[0] + B[1] > A[0] + A[1]) ? B : A;                   // mit dem Feld, das zuletzt dran ist (nach Rinne und Zäunen)
  const k = later.join();
  return { k, cut: [lo, hi], portal: { R: B, d, ramp, len: RAMP_LEN } };
}
// Tiefe eines Weltpunkts in der Rampe (für die Wagen)
function rampSink(P, wx, wy) {
  const [rx, ry] = P.R, a = (wx - rx) * P.d[0] + (wy - ry) * P.d[1];
  return rampDepth(a);
}
// Wagen in der Rampe: was unter der Erde liegt, verdeckt die vordere Kante – unterhalb der vorderen Längskante und (zeigt die
// Wand weg) unterhalb der Kante an der Wand. Am Rampenanfang liegt das Gleis ebenerdig: dort nichts verdecken.
function rampClip(P, z) {
  const [rx, ry] = P.R, d = P.d, w = RAMP_W, a0 = 0.5 - RAMP_LEN;
  const W2 = (a, b) => { const p = toScreen(rx + d[0] * a - d[1] * b, ry + d[1] * a + d[0] * b); return [p.x, p.y]; };
  const edges = [];
  for (const sg of [-1, 1]) if (sg * (d[0] - d[1]) > 0) edges.push([W2(a0, sg * w), W2(0.5, sg * w)]);
  if (d[0] + d[1] > 0) edges.push([W2(0.5, -w), W2(0.5, w)]);
  g.beginPath(); g.rect(-1e4, -1e4, 3e4, 3e4);
  for (const [p, q] of edges) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(q[0], q[1] + 1e4); g.lineTo(p[0], p[1] + 1e4); g.closePath(); }
  g.clip('evenodd');
}

// U-Bahn-Eingang (1×1): Treppe mit Mast (frei), Pavillon mit Glasdach, Häuschen (Kunstakademie). Vorn = Drehrichtung.
// Umfärbbar (Nutzer: „Stationen farbig einfärben“): Wand = Mauern/Wände, Dach = Dach, Mast und Eisen; das U-Schild bleibt blau
// Pavillon (Nutzer: „Wand macht nichts“): Wand = das Eisengestell (dunkler getönt), Dach = das Glasdach (heller getönt)
REPAINT.ubahn = { names: ['Wand', 'Dach & Mast'], wall: ['#e9e1d2', '#d8cfbf', '#cfc6b4', '#e3dccd', ['#2f7a56', -0.32], ['#3f9068', -0.22]],
  roof: ['#2f62b8', '#3f74c8', ['#9fd3e3', 0.18], ['#c8ecf5', 0.42], ['#5b6470', -0.15], ['#6c7682', -0.08]] };
function uSign(p, size, z) {
  const a = size * z;
  g.fillStyle = '#2d5fb3'; g.fillRect(p[0] - a / 2, p[1] - a / 2, a, a);   // Schild bleibt immer U-Bahn-blau (nicht umfärbbar)
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.9 * z; g.strokeRect(p[0] - a / 2 + 0.8 * z, p[1] - a / 2 + 0.8 * z, a - 1.6 * z, a - 1.6 * z);
  g.fillStyle = '#ffffff'; g.font = `800 ${a * 0.72}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('U', p[0], p[1] + a * 0.04); g.textAlign = 'left';
}
// Mauer als ein Stück (Nutzer: „Mauerecken sind Schrott“): Grundriss pts (a, b) hochgezogen – sichtbare Seiten von hinten nach vorn,
// dann die Oberseite. Einzelne Kästen überlappen an den Ecken und landen je nach Drehung in falscher Reihenfolge
function ubPrism(S, du, dv, pts, h0, h1, col, top, z) {
  const n = pts.length;
  let area = 0; for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[(i + 1) % n]; area += a0 * b1 - a1 * b0; }
  const sg = area > 0 ? 1 : -1, faces = [];
  for (let i = 0; i < n; i++) {
    const [a0, b0] = pts[i], [a1, b1] = pts[(i + 1) % n], len = Math.hypot(a1 - a0, b1 - b0);
    const na = sg * (b1 - b0) / len, nb = -sg * (a1 - a0) / len;                // nach außen
    const nu = du * na - dv * nb, nv = dv * na + du * nb;
    if (nu + nv <= 0.02) continue;
    const ma = (a0 + a1) / 2, mb = (b0 + b1) / 2;
    faces.push({ p: [a0, b0], q: [a1, b1], nu, d: (du * ma - dv * mb) + (dv * ma + du * mb) });
  }
  faces.sort((f, h) => f.d - h.d);
  for (const f of faces) poly([S(...f.p, h0), S(...f.q, h0), S(...f.q, h1), S(...f.p, h1)], C(shade(col, f.nu > 0 ? LIGHT.side * Math.min(1, f.nu * 1.4) : 0)));
  poly(pts.map(([a, b]) => S(a, b, h1)), C(top || shade(col, 0.12)));
}
// U-förmige Mauer: hinten bei a0..a1 (Dicke), Seiten b ±(bi..bo), offen nach vorn bis aEnd
const ubU = (a0, a1, aEnd, bi, bo) => [[a0, -bo], [aEnd, -bo], [aEnd, -bi], [a1, -bi], [a1, bi], [aEnd, bi], [aEnd, bo], [a0, bo]];
function drawUbahn(cx, cy, z, t) {
  const r = (t && t.rot) || 0, du = [1, 0, -1, 0][r], dv = [0, 1, 0, -1][r];
  const L = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const S = (a, b, up = 0) => { const p = L(du * a - dv * b, dv * a + du * b); return [p[0], p[1] - up * z]; };
  const form = lookForm('ubahn', t);
  if (!t || wegUnder(t) == null) poly([S(-0.48, -0.48), S(0.48, -0.48), S(0.48, 0.48), S(-0.48, 0.48)], C('#d9d2c4'));   // gepflasterter Sockel (auf einem Weg: der Weg)
  const stairs = (a0, a1, w) => {
    poly([S(a0, -w), S(a1, -w), S(a1, w), S(a0, w)], C('#3a332e'));
    for (let i = 1; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 7; portalLine([S(a, -w, -i), S(a, w, -i)], 'rgba(220,210,195,0.55)', 0.8, z); }
  };
  if (form === 'pavillon') {
    const GR = '#2f7a56', GL = '#3f9068';
    stairs(-0.34, 0.36, 0.22);
    ubPrism(S, du, dv, ubU(-0.4, -0.34, 0.36, 0.24, 0.29), 0, 5, GR, GL, z);   // Rahmen als ein Stück (Ecken bündig)
    const posts = [[-0.4, -0.34, -0.29, -0.24], [-0.4, -0.34, 0.24, 0.29], [0.3, 0.36, -0.29, -0.24], [0.3, 0.36, 0.24, 0.29]];   // Pfosten genau auf den Rahmenecken
    posts.sort((p, q) => { const d = e => { const a = (e[0] + e[1]) / 2, b = (e[2] + e[3]) / 2; return (du * a - dv * b) + (dv * a + du * b); }; return d(p) - d(q); });
    for (const [a0, a1, b0, b1] of posts) pbBox(S, du, dv, a0, a1, b0, b1, 5, 18, GR, GL, z, false);   // stehen auf dem Rahmen (darunter ist er selbst) – sonst malten sie sich vor die Wand (Nutzer)
    g.globalAlpha *= 0.85; pbBox(S, du, dv, -0.44, 0.42, -0.36, 0.36, 18, 19.5, '#9fd3e3', '#c8ecf5', z, false); g.globalAlpha /= 0.85;
    const arc = []; for (let i = 0; i <= 12; i++) { const t2 = Math.PI - i * Math.PI / 12; arc.push(S(0.36, Math.cos(t2) * 0.3, 19.5 + Math.sin(t2) * 5)); }
    portalLine(arc, GR, 1.6, z);
    for (const b of [-0.3, 0.3]) { const p = S(0.36, b, 21); circle(p[0], p[1], 2 * z, C('#ffd56b')); }
    uSign(S(0.36, 0, 27), 9, z);
  } else if (form === 'haeuschen') {
    pbBox(S, du, dv, -0.36, 0.3, -0.32, 0.32, 0, 15, '#e9e1d2', '#d8cfbf', z, false);
    if (du + dv > 0) {                                                  // Glasfront nur, wenn sie zu sehen ist
      poly([S(0.3, -0.24, 0), S(0.3, 0.24, 0), S(0.3, 0.24, 12), S(0.3, -0.24, 12)], C('#9fc9dc'));
      poly([S(0.3, -0.1, 0), S(0.3, 0.1, 0), S(0.3, 0.1, 10), S(0.3, -0.1, 10)], C('#3a332e'));
    }
    pbBox(S, du, dv, -0.42, 0.36, -0.38, 0.38, 15, 17, '#2f62b8', '#3f74c8', z, false);
    portalLine([S(0, 0, 17), S(0, 0, 21)], '#5b6470', 1.4, z);
    uSign(S(0, 0, 26), 10, z);
  } else {                                                              // Treppe mit Mast
    stairs(-0.36, 0.38, 0.24);
    ubPrism(S, du, dv, ubU(-0.44, -0.36, 0.38, 0.24, 0.32), 0, 6, '#cfc6b4', '#e3dccd', z);   // Mauer als ein Stück – Ecken bündig (Nutzer)
    pbBox(S, du, dv, -0.43, -0.37, -0.03, 0.03, 6, 17, '#5b6470', '#6c7682', z, false);   // kleiner Mast mittig aus der Rückwand (Nutzer wählte „B, mittig“;
    uSign(S(-0.4, 0, 20), 7, z);                                                          // vorher 30 hoch neben der Ecke – „überdimensioniert“)
  }
}
// Geist des Tunnels beim Bauen: gestrichelte Raute
function drawTunnelGhost(cx, cy, z) {
  g.save(); g.setLineDash([5 * z, 4 * z]); g.strokeStyle = '#6a52c4'; g.lineWidth = 2.4 * z;
  diamondPath(cx, cy, TW / 2 * z * 0.7, TH / 2 * z * 0.7); g.stroke(); g.restore();
}
function diamondPath(cx, cy, a, b) { g.beginPath(); g.moveTo(cx, cy - b); g.lineTo(cx + a, cy); g.lineTo(cx, cy + b); g.lineTo(cx - a, cy); g.closePath(); }
// Bauleiste: kleines Bild des Tunnels als Querschnitt (Nutzer 11.10.2026: Tunnel und Bergportal sahen im Menü gleich aus; „es steht über den
// Untergrund“) – das Bild IST das Feld: oben die Wiese genau als Feld (wie die Bodenplatte der anderen Bilder), darunter aufgeschnitten das
// Erdreich, darin die runde Röhre mit Gleis (man sieht hinein, nach hinten dunkel), oben lila gestrichelt wie in der Tunnel-Ansicht.
// (cx, cy) = Mitte der Wiese, D = Tiefe des Schnitts in Bildpunkten (× z)
function drawTunnelIcon(cx, cy, z, D = 26) {
  const hw = TW / 2 * z, hh = TH / 2 * z, L = Math.hypot(hw, hh);
  const P = (u, v, h = 0) => [cx + (u - v) * hw, cy + (u + v) * hh + h * z];   // h nach unten
  const path = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const quad = (pts, col) => { path(pts); g.fillStyle = C(col); g.fill(); };
  quad([P(-0.5, 0.5), P(0.5, 0.5), P(0.5, 0.5, D), P(-0.5, 0.5, D)], '#a57a52');           // Schnitt vorn links (+y): Erdreich
  quad([P(0.5, -0.5), P(0.5, 0.5), P(0.5, 0.5, D), P(0.5, -0.5, D)], '#8a6342');          // Schnitt vorn rechts (+x)
  quad([P(-0.5, -0.5), P(0.5, -0.5), P(0.5, 0.5), P(-0.5, 0.5)], '#96d56f');              // Wiese (Farbe der Bodenplatte)
  quad([P(-0.5, 0.5), P(0.5, 0.5), P(0.5, 0.5, 2.4), P(-0.5, 0.5, 2.4)], '#7fbf55');      // Grasnarbe
  quad([P(0.5, -0.5), P(0.5, 0.5), P(0.5, 0.5, 2.4), P(0.5, -0.5, 2.4)], '#6aa847');
  // Röhre im linken Schnitt: Kreis in der Schnittfläche (t längs, h nach unten), Betonring; innen Boden mit Gleis, das in die Tiefe läuft
  const R = 7.5, mh = 14, rs = R * z / L, at = (t, h) => P(-0.5 + t, 0.5, h), into = (t, d, h) => P(-0.5 + t, 0.5 - d, h);
  const circ = r => { const o = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2; o.push(at(0.5 + Math.cos(a) * rs * r / R, mh + Math.sin(a) * r)); } return o; };
  quad(circ(R + 2), '#cfc8bc'); quad(circ(R), '#2b2723');
  g.save(); path(circ(R)); g.clip();
  const fh = mh + R * 0.66, fw = rs * 0.75;
  quad([at(0.5 - fw, fh), at(0.5 + fw, fh), into(0.5 + fw, 1, fh), into(0.5 - fw, 1, fh)], '#6d655b');
  g.strokeStyle = C('#8a909a'); g.lineWidth = 1 * z; g.lineCap = 'butt'; g.beginPath();
  for (const o of [-0.07, 0.07]) { const a = at(0.5 + o, fh - 0.4), b = into(0.5 + o, 1, fh - 0.4); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
  g.stroke();
  const p0 = at(0.5, mh), p1 = into(0.5, 0.6, mh), gr = g.createLinearGradient(p0[0], p0[1], p1[0], p0[1]);   // waagerecht: nur nach der Tiefe dunkler
  gr.addColorStop(0, 'rgba(30,26,22,0.1)'); gr.addColorStop(1, 'rgba(30,26,22,0.95)'); g.fillStyle = gr; path(circ(R)); g.fill();
  g.restore();
  g.save(); g.setLineDash([3 * z, 2.5 * z]); g.strokeStyle = C('#6a52c4'); g.lineWidth = 2 * z; g.lineCap = 'round'; g.beginPath();   // oben: die Linie der Tunnel-Ansicht, genau über der Röhre
  const a = P(0, -0.5), b = P(0, 0.5); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore();
}

// Bauansicht (Nutzer: „passt so“): mit Tunnel, Einfahrt oder U-Bahn-Station in der Hand wird die Welt blass; mit Schiene oder Abriss
// nicht (Nutzer: „beim Entfernen genauso ausgegraut“) – die Tunnel erscheinen immer lila gestrichelt, U-Bahn-Stationen als U.
// Auch bei 👁 Durchsicht (Block 155d: 🧹 ist nicht mehr in der Leiste)
const TUNNEL_VIEW = new Set(['schiene', 'tunnel', 'tunneleinfahrt', 'ubahn', 'abriss']);
function drawTunnelView(z) {
  if (!state.tunnels || !(TUNNEL_VIEW.has(tool) || seeThrough) || (tool !== 'tunnel' && tool !== 'ubahn' && tool !== 'tunneleinfahrt' && !state.tunnels.size)) return;
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (tool === 'tunnel' || tool === 'ubahn' || tool === 'tunneleinfahrt') { g.fillStyle = 'rgba(245,240,255,0.42)'; g.fillRect(0, 0, W, H); }
  const segs = [], hl = state.hills && state.hills.size;
  // Anhöhen (Nutzer 11.10.2026: „unter einer Anhöhe sieht das versetzt aus, ich checke gar nicht, wo der Tunnel ist“, Variante A): die Linie liegt
  // oben auf dem Feld, das man sieht und antippt (um den Hub angehoben), und führt an der Wand senkrecht hinunter – in ein Bergportal an seiner
  // Wand, sonst an der Feldgrenze. Ohne Anhöhen wie vorher
  const S = (x, y, h) => { const p = toScreen(x, y); return h ? { x: p.x, y: p.y - h } : p; }, up = (x, y) => hl ? hillLift(x, y) * z : 0;
  for (const k of state.tunnels.keys()) {
    const [x, y] = keyXY(k), p = toScreen(x, y), h0 = up(x, y);
    if (p.x < -80 || p.x > W + 80 || p.y < -80 - h0 || p.y > H + 80) continue;
    let n = 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, ny = y + dy, mine = tunnelAt(nx, ny), ein = !mine && trackLink(x, y, nx, ny);
      if (!mine && !ein) continue;
      n++;
      if (mine && (dx < 0 || dy < 0)) continue;                        // jede Verbindung einmal
      if (!hl) { const q = toScreen(ein ? x + dx * 0.5 : nx, ein ? y + dy * 0.5 : ny); segs.push([p, q]); continue; }
      if (ein) {                                                         // Einfahrt/Bergportal: bis an seine Wand, dort hinunter
        const bp = typeof bpAt === 'function' && bpAt(nx, ny), e = bp ? 1.5 : 0.5, ex = x + dx * e, ey = y + dy * e;
        segs.push([S(x, y, h0), S(ex, ey, h0)]);
        if (h0) segs.push([S(ex, ey, h0), S(ex, ey, 0)]);
        continue;
      }
      const h1 = up(nx, ny), mx = x + dx * 0.5, my = y + dy * 0.5;
      segs.push([S(x, y, h0), S(mx, my, h0)]);
      if (h1 !== h0) segs.push([S(mx, my, h0), S(mx, my, h1)]);         // an der Wand senkrecht
      segs.push([S(mx, my, h1), S(nx, ny, h1)]);
    }
    if (!n) segs.push([{ x: p.x - 4 * z, y: p.y - h0 }, { x: p.x + 4 * z, y: p.y - h0 }]);
  }
  g.lineCap = 'round'; g.setLineDash([6 * z, 5 * z]);
  for (const [col, w] of [['rgba(60,40,110,0.25)', 7], ['#6a52c4', 2.4]]) {
    g.strokeStyle = col; g.lineWidth = w * z; g.beginPath();
    for (const [p, q] of segs) { g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); }
    g.stroke();
  }
  g.setLineDash([]);
  for (const [k, t] of state.tiles) if (t.b === 'ubahn') {
    const [x, y] = keyXY(k), p = toScreen(x, y), up = state.hills && state.hills.size ? hillLift(x, y) * z : 0;   // Anhöhe (157j): Eingang oben
    if (p.x < -40 || p.x > W + 40 || p.y < -40 - up || p.y > H + 40) continue;
    uSign([p.x, p.y - 4 * z - up], 9, z);
  }
  g.restore();
}
