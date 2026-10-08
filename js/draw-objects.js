'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Gebäude & Deko
// ---------------------------------------------------------------------------
let night = 0;
const glows = [];
let SPRITE_PAINT = false;                   // render.js malt gerade ein Bildchen fürs Spiel (zählt wie live)
const isLive = () => g === ctx || SPRITE_PAINT || (GLPASS && g === LA.x);   // Sammelfläche im GL-Bild (Block 144) zählt wie die Hauptleinwand

// Nachtlicht: stanzt an Ort und Stelle ein Loch ins Bild (Fenster ganz, Lichtschein weich). Was danach davor
// gezeichnet wird (Laub, das vordere Reihenhaus, Bewohner), füllt das Loch wieder – so scheint nichts durch.
// Am Ende wird die Nacht nur über das Bild gelegt und die Löcher mit Licht hinterlegt (render.js, „Nacht“).
// Beim Zeichnen eines Bildchens (render.js, weit weg) werden die Lichter nur gemerkt und beim Einsetzen gestanzt
let GLOW_SINK = null;
function glowQuad(pts, r, tint) {           // tint 'blue': kühles Kristall-Leuchten statt warmem Lampenlicht
  if (!(night > 0.15 && isLive())) return;
  const m = g.getTransform(), k = 1 / DPR;
  const q = pts.map(([x, y]) => [(m.a * x + m.c * y + m.e) * k, (m.b * x + m.d * y + m.f) * k]);
  if (GLOW_SINK) { GLOW_SINK.push({ q, r, tint, snap: tint === 'blue' ? null : glowSnap(q) }); return; }
  punchGlow(q, r, tint);
}
// Bildchen (Block 112): wie die Scheibe aussah, als ihr Licht anging – als Kopie in eine Ablage (kein Rücklesen, schnell).
// Am Ende zählt nur, was sich seitdem nicht verändert hat (render.js, lightMask) – genau wie live, wo später Gemaltes das
// gestanzte Loch wieder zudeckt. GLOW_ATLAS setzt paintSprite; die Leinwand entsteht erst beim ersten Licht.
let GLOW_ATLAS = null;
function glowSnap(q) {
  const A = GLOW_ATLAS, src = g.canvas;
  if (!A || !src) return null;
  const xs = q.map(p => p[0] * DPR), ys = q.map(p => p[1] * DPR);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), y0 = Math.max(0, Math.floor(Math.min(...ys)));
  const w = Math.min(src.width, Math.ceil(Math.max(...xs))) - x0, h = Math.min(src.height, Math.ceil(Math.max(...ys))) - y0;
  if (w <= 0 || h <= 0) return null;
  try {
    if (!A.c) { A.c = document.createElement('canvas'); A.c.width = Math.min(512, src.width); A.c.height = Math.min(512, src.height); A.ctx = A.c.getContext('2d'); if (!A.ctx) { A.c = null; return null; } }   // nie größer als das Bildchen (Block 124: lag sonst je Bildchen 1 MB bis zum Zuschneiden)
    if (A.x + w > A.c.width) { A.x = 0; A.y += A.row; A.row = 0; }
    if (w > A.c.width || A.y + h > A.c.height) return null;              // Ablage voll: dieses Fenster ganz (wie früher)
    A.ctx.drawImage(src, x0, y0, w, h, A.x, A.y, w, h);
    const sn = { x0, y0, w, h, ax: A.x, ay: A.y };
    A.x += w; A.row = Math.max(A.row, h); A.used = Math.max(A.used, A.y + h);
    return sn;
  } catch (e) { return null; }
}
// Licht in Bildschirm-Punkten (q) ins Bild stanzen und für die Nacht merken
// Viele Fenster dicht beieinander (Reihenhäuser, Schloss) stanzen sich gegenseitig durch und werden taghell (Block 70):
// je Bildschirm-Zelle zählt der Schein mit; jeder weitere wird schwächer, die Fensterscheiben selbst bleiben hell
let glowCells = new Map();                  // let: Nachtbilder (render.js, Block 124) zählen in einer eigenen
// part (Block 112): 'halo' nur der weiche Schein, 'pane' nur die Scheibe, 'mark' nichts stanzen, nur fürs Nachtbild merken – Bildchen stanzen den
// Schein vor dem Einsetzen (trifft, was dahinter liegt, wie live) und die Scheiben über ihre Lichtmaske (render.js)
// Block 124 (schneller, gleiches Bild): Zellen und Lichter als Zahlen statt Text; 'pane'/'mark' folgen immer auf das 'halo' desselben
// Lichts – das hat es schon gezählt und in glows eingetragen (die Scheibe braucht n nicht); 'mark' zeichnet nichts, also kein save/restore
function punchGlow(q, r, tint, part = null) {
  const blue = tint === 'blue';
  if (part === 'mark' || (part === 'pane' && blue)) return;
  const strength = night / NIGHT_MAX;
  const gx = (q[0][0] + q[2][0]) / 2, gy = (q[0][1] + q[2][1]) / 2;
  if (part === 'pane') {
    if (glOnWorld()) { glOutQuad(q, 1); if (!GL.sky) return; }             // GL-Bild: Loch als Rechteck (Stärke im Shader, Block 144)
    g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = Math.min(1, strength); poly(q, '#000');
    g.restore();
    return;
  }
  // dasselbe Licht (große Gebäude stanzen es je Streifen) zählt nur einmal (Block 84d)
  const cell = (Math.round(gx / 24) + 4096) * 8192 + Math.round(gy / 24) + 4096, id = (Math.round(gx * 2) + 100000) * 400000 + Math.round(gy * 2) + 100000;
  let seen = glowCells.get(cell);
  if (!seen) glowCells.set(cell, seen = new Map());
  let n = seen.get(id);
  if (n === undefined) { n = seen.size; seen.set(id, n); }
  const rr = (n ? r * 0.7 : r) * (blue && SPRITES_ON && nightPicOn() ? BLUE_SPOT : 1);   // weit weg mit Nachtbildern (auch Dämmerung, Block 143): blaues Loch so groß wie sein Fleck (render.js)
  if (glOnWorld()) {                                                       // GL-Bild: Löcher als Rechtecke, Stärke im Shader (Block 144)
    glOut(glowImage(blue), gx - rr, gy - rr, rr * 2, rr * 2, 0.45 / (1 + n * 1.8));
    if (!blue && !part) glOutQuad(q, 1);
    if (!GL.sky) { glows.push({ q, r, tint }); return; }
    // Himmel (Ballon, Zeppelin): liegt in 2D obendrauf – dort zusätzlich stanzen, damit das Licht durch seine Fenster scheint
  }
  g.save();                                 // der Ausschnitt (Streifen großer Gebäude) bleibt erhalten
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  g.globalAlpha = 0.45 * strength / (1 + n * 1.8);
  g.drawImage(glowImage(blue), gx - rr, gy - rr, rr * 2, rr * 2);
  if (!blue && !part) { g.globalAlpha = Math.min(1, strength); poly(q, '#000'); }
  g.restore();
  glows.push({ q, r, tint });               // große Gebäude (Streifen) tragen es mehrfach ein – drawNight fasst zusammen
}
function windowOn(P, Q, t0, t1, h0, h1, z) {
  const lit = night > 0.15 && isLive();
  faceQuad(P, Q, t0, t1, h0, h1, lit ? '#ffd873' : C('#a8dcff'));
  const a = lerp(P, Q, t0), b = lerp(P, Q, t1);
  glowQuad([[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]], 18 * z);
}
function door(P, Q, h) { faceQuad(P, Q, 0.4, 0.62, 0, h * 0.55, C('#8a5a3c')); }
function shadow(cx, cy, a, b) { ellipse(cx, cy + 2, a, b, 'rgba(40,60,20,0.15)'); }
function smoke(x, y, z, now, dark) {
  for (let i = 0; i < 3; i++) {
    const ph = (now / 1800 + i / 3) % 1;
    circle(x + Math.sin(ph * 6) * 2 * z, y - ph * 18 * z, (2 + ph * 4) * z,
      dark ? `rgba(180,180,190,${0.7 * (1 - ph)})` : `rgba(255,255,255,${0.7 * (1 - ph)})`);
  }
}
function blades(hx, hy, z, now, n, len, col) {
  const ang = now / 650;
  for (let i = 0; i < n; i++) {
    const a = ang + i * Math.PI * 2 / n, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, wd = 2.4 * z;
    poly([[hx + px * 0.6 * z, hy + py * 0.6 * z], [hx + ca * len + px * wd, hy + sa * len + py * wd],
          [hx + ca * len, hy + sa * len], [hx + ca * 3 * z, hy + sa * 3 * z]], C(col));
  }
  circle(hx, hy, 1.8 * z, C('#8a8f99'));
}

function drawFlag(px, py, z, now, town) {
  g.strokeStyle = C('#8a8f99'); g.lineWidth = 1.6 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 40 * z); g.stroke();
  const fw = 16 * z, fh = 11 * z, top = py - 40 * z, wave = Math.sin(now / 400) * 1.5 * z;
  g.beginPath();
  g.moveTo(px, top);
  g.quadraticCurveTo(px + fw / 2, top - wave, px + fw, top + wave * 0.5);
  g.lineTo(px + fw, top + fh + wave * 0.5);
  g.quadraticCurveTo(px + fw / 2, top + fh - wave, px, top + fh);
  g.closePath();
  g.fillStyle = C(town.color); g.fill();
  g.font = `${7.5 * z}px system-ui, sans-serif`;
  g.textBaseline = 'middle';
  centerText(town.symbol, px + fw / 2, top + fh / 2 + 0.5 * z);
}

// Wege: schmale Bänder, die sich mit Nachbar-Wegen verbinden, oder ganze Flächen (Plätze)
const ROAD_W = 0.32;                      // halbe Breite eines Weg-Bands in Feldern
const ang = (u, v) => Math.atan2(v, u);
function arcPts(cu, cv, r, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
  return out;
}
const sweep = (a0, a1) => { let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; return a0 + d; };
function pathArms(x, y) {
  return DIRS.filter(([dx, dy]) => { const b = bAt(x + dx, y + dy); return b === 'weg' || b === 'rathaus' || crossingAt(x + dx, y + dy) || wegAt(x + dx, y + dy) != null; });
}
// Kurve: zwei Arme über Eck → Mittelpunkt ist die gemeinsame Feldecke
function roadCurve(arms) {
  if (arms.length !== 2) return null;
  const [[ax, ay], [bx, by]] = arms;
  if (ax === -bx && ay === -by) return null;
  const cu = 0.5 * (ax + bx), cv = 0.5 * (ay + by);
  const a0 = ang(ax * 0.5 - cu, ay * 0.5 - cv);
  return { cu, cv, a0, a1: sweep(a0, ang(bx * 0.5 - cu, by * 0.5 - cv)) };
}
// Umriss der Fahrbahn (halbe Breite w) als Liste von Polygonen im Feld-Koordinatensystem.
// quads: Ecken [su, sv], die ganz gefüllt werden, weil dort vier Wegfelder ein 2×2-Quadrat bilden –
// so verschmelzen Wege nebeneinander zu einem breiten Weg.
// flares: Arme, die auf einen Platz treffen – dort weitet sich der Weg mit runden Ecken (Trichter).
const EDGE_W = ROAD_W + 0.04, FLARE_R = 0.1;
// Arm-System (a entlang des Arms [dx, dy], b quer dazu) → Feld-Koordinaten
const armUV = ([dx, dy], a, b) => [a * dx - b * dy, a * dy + b * dx];
function roadShapes(arms, t, w, quads = [], flares = [], straight = false) {
  const out = quads.map(([su, sv]) => [[0, 0], [0.5 * su, 0], [0.5 * su, 0.5 * sv], [0, 0.5 * sv]]);
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const arm = ([dx, dy], from = 0) => dx > 0 ? rect(from, 0.5, -w, w) : dx < 0 ? rect(-0.5, -from, -w, w)
    : dy > 0 ? rect(-w, w, from, 0.5) : rect(-w, w, -0.5, -from);
  // Trichter: fester Mittelpunkt für Rand und Belag, damit beide parallel laufen
  for (const d of flares) for (const sb of [1, -1]) {
    const ca = 0.5 - FLARE_R, cb = EDGE_W + FLARE_R, r = cb - w;
    const pts = arcPts(ca, cb, r, -Math.PI / 2, -Math.acos(Math.min(1, FLARE_R / r)), 6).concat([[0.5, w]]);
    out.push(pts.map(([a, b]) => armUV(d, a, b * sb)));
  }
  if (!arms.length) {                            // einzelnes Feld: Kapsel mit runden Enden
    const c = 0.5 - EDGE_W;
    const pts = arcPts(c, 0, w, -Math.PI / 2, Math.PI / 2, 10).concat(arcPts(-c, 0, w, Math.PI / 2, Math.PI * 1.5, 10));
    out.push((t && t.rot & 1) ? pts.map(([u, v]) => [v, u]) : pts);
    return out;
  }
  const curve = straight ? null : roadCurve(arms);           // straight: Kurve an einer Hecke/Mauer eckig
  if (curve) {
    const { cu, cv, a0, a1 } = curve;
    out.push(arcPts(cu, cv, 0.5 + w, a0, a1).concat(arcPts(cu, cv, Math.max(0, 0.5 - w), a1, a0)));
    return out;
  }
  if (arms.length === 1) {                       // Sackgasse mit rundem Ende
    out.push(arm(arms[0]));
    out.push(arcPts(0, 0, w, 0, Math.PI * 2, 20));
    return out;
  }
  out.push(rect(-w, w, -w, w));
  for (const a of arms) out.push(arm(a));
  // Innenecken zwischen zwei Armen abrunden (Mittelpunkt fest, damit die Bordsteinbreite gleich bleibt)
  const c0 = EDGE_W + 0.1, r = c0 - w;
  const has = (dx, dy) => arms.some(a => a[0] === dx && a[1] === dy);
  for (const su of [1, -1]) for (const sv of [1, -1]) {
    if (!has(su, 0) || !has(0, sv)) continue;
    const pts = [[w, w], [c0, w]].concat(arcPts(c0, c0, r, -Math.PI / 2, -Math.PI, 8)).concat([[w, c0]]);
    out.push(pts.map(([u, v]) => [u * su, v * sv]));
  }
  return out;
}
// Muster innerhalb einer Fläche (Feld-Koordinaten, L bildet auf den Bildschirm ab).
// Alle Teilflächen im selben Drehsinn, sonst heben sich Überlappungen beim Zuschneiden auf.
function clipTo(shapes, L) {
  g.beginPath();
  for (const sh of shapes) {
    let area = 0;
    for (let i = 0; i < sh.length; i++) { const p = sh[i], q = sh[(i + 1) % sh.length]; area += p[0] * q[1] - q[0] * p[1]; }
    const pts = area < 0 ? [...sh].reverse() : sh;
    pts.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
    g.closePath();
  }
  g.clip();
}
// ext: Muster über das Feld hinaus fortsetzen (gleiches Raster, wie es das Nachbarfeld selbst zeichnet) – für Übergänge
// box [u0, u1, v0, v1]: nur Punkte darin zeichnen (Übergänge brauchen nur einen Streifen)
// Weit weg blassen feine Muster aus (Block 125, wie Mipmapping): Je kleiner Punkte und Fugen in Gerätepunkten werden, desto
// schwächer – sonst werden aus Kiespunkten Streifen und aus Fugen Linien und graues Flimmern. Nah dran unverändert
const PAT_FADE = { dots: [1.0, 1.0], stones: [2.0, 2.1], confetti: [1.2, 1.3], line: [0.62, 0.66] };   // [ab Größe, voll nach +] in Gerätepunkten: voll ab Zoom ~0,8, ein Drittel bei 0,45
// Abstand der Wiederholung je Muster (in Feldern): weit auseinander (große Platten, Schachbrett) flimmert nicht und bleibt auch weit
// weg zu sehen – sonst waren dort nur noch einfarbige Flächen (Rückmeldung Nutzer); eng (Kies, Pflaster, Holz) blasst aus
const PAT_STEP = { dots: 0.09, stones: 0.11, confetti: 0.085, tiles: 0.25, big: 0.5, thirds: 1 / 3, setts: 0.125, slabs: 0.25, ashlar: 0.2,
  boards: 0.1, bricks: 0.1, herring: 0.125, herring2: 0.125, herring3: 1 / 6, checker: 0.25, basket: 0.25, diag: 0.25, stack: 0.25, modular: 0.25, planks: 0.07 };
function patternFade(kind, z) {
  const t = g.getTransform ? g.getTransform() : null, px = (t ? Math.hypot(t.a, t.b) : 1) * z;   // Gerätepunkte je Einheit von z
  const size = kind === 'dots' ? 1.3 * px : kind === 'stones' ? 2.6 * px : kind === 'confetti' ? 1.6 * px : 0.8 * px;
  const [a, b] = PAT_FADE[kind] || PAT_FADE.line;
  const bySize = Math.max(0, Math.min(1, (size - a) / b));
  const gap = (PAT_STEP[kind] || 0.1) * Math.hypot(TW / 2, TH / 2) * px;                           // Abstand in Gerätepunkten
  // Bildschirme mit weniger Pixeldichte (PC, 100–150 %): dieselben Fugen fallen auf halbe Bildpunkte und verschwimmen zu einem grauen
  // Raster (Rückmeldung Nutzer: am PC Linien, am Mac nicht) – dort erst bei weiterem Abstand zeigen
  const thr = 4 + 6 * (2 - Math.max(1, Math.min(2, DPR)));
  const byGap = Math.max(0, Math.min(1, (gap - thr) / 8));
  return Math.max(bySize, byGap);
}
let patNoFade = false;                                                    // Vorschaubilder (Leiste, Kunstakademie): Muster immer voll
// Fuge auf der hinteren Feldkante (u bzw. v = +0,5) zeichnet nur das Nachbarfeld (seine vordere, −0,5) – doppelt gezeichnet war sie
// dunkler (auch die Kantenglättung addiert sich), und weit weg sah man jedes Feld als Kachel (Block 125c). Nur für Felder im Raster
let patSeam = false;
// bg: Belagfarbe darunter – dann blasst das Muster per Farbmischung aus statt per Deckkraft (Block 125c): Fugen auf der Feldkante
// zeichnen beide Nachbarfelder, halb durchsichtig doppelt gemalt wurden sie dunkler, und weit weg sah man jedes Feld als Kachel
const patMixCache = new Map();
const patMix = (bg, c, f) => { const k = bg + c + f; let v = patMixCache.get(k); if (!v) { if (patMixCache.size > 4000) patMixCache.clear(); v = mix(bg, c, f); patMixCache.set(k, v); } return v; };
function pattern(L, kind, x, y, z, col, cols, ext = 0, box = null, bg = null) {
  if (kind === 'rainbow' || patNoFade) return patternDraw(L, kind, x, y, z, col, cols, ext, box);   // breite Streifen: bleiben
  let f = patternFade(kind, z);
  if (f <= 0.02) return;
  if (bg && f < 1) {
    f = Math.round(f * 32) / 32;                                         // Stufen: wenige Mischfarben im Zwischenspeicher
    const B = C(bg);
    col = col && patMix(B, col, f); cols = cols && cols.map(c => patMix(bg, c, f));
    if (patTileFill(L, kind, x, y, z, col, C(bg), ext, box)) return;
    return patternDraw(L, kind, x, y, z, col, cols, ext, box);
  }
  if (bg && patTileFill(L, kind, x, y, z, col, C(bg), ext, box)) return;
  const a0 = g.globalAlpha;
  g.globalAlpha = a0 * f;
  try { patternDraw(L, kind, x, y, z, col, cols, ext, box); } finally { g.globalAlpha = a0; }
}
// Muster als Kachelbild (Block 125c, Ruckeln am Freizeitpark): Linienmuster mit festem Weltraster (Wiederholung P Felder) einmal je
// Farbe und Größe in ein kleines Bild malen – mit der Belagfarbe als Grund, also deckend – und als Füllmuster legen, statt je Feld
// hunderte Striche (Fischgrät ~300). Deckend heißt auch: doppelt gemalte Ränder sehen gleich aus. Das Raster der Iso-Ansicht
// wiederholt sich auf dem Bildschirm achsenparallel (2aP × 2bP), daher ein gerades Rechteck. Nur für die übliche Feldabbildung L.
const PAT_TILE = { tiles: 0.5, big: 0.5, setts: 0.5, thirds: 1, checker: 0.5, herring2: 0.5, herring3: 2, basket: 0.5, diag: 0.5, stack: 0.5, slabs: 0.5, bricks: 1, herring: 0.5 };
const patTiles = new Map();
function patTileFill(L, kind, x, y, z, col, bg, ext, box) {
  const P = PAT_TILE[kind];
  if (!P || !col || typeof col !== 'string' || col[0] !== '#' || !Number.isInteger(x) || !Number.isInteger(y) || typeof g.createPattern !== 'function') return false;
  const O = L([0, 0]), U = L([1, 0]), V = L([0, 1]), a = U[0] - O[0], b = U[1] - O[1], T = L([0.37, 0.61]);
  if (!(a > 0.5 && b > 0.25) || Math.abs(V[0] - O[0] + a) > 1e-6 * a || Math.abs(V[1] - O[1] - b) > 1e-6 * b
    || Math.abs(T[0] - (O[0] + 0.37 * a - 0.61 * a)) > 0.01 || Math.abs(T[1] - (O[1] + 0.98 * b)) > 0.01) return false;   // nur affin, ohne Drehung
  const tr = g.getTransform ? g.getTransform() : null, ds = tr ? Math.hypot(tr.a, tr.b) : 1;
  const Wt = Math.max(4, Math.round(2 * P * a * ds)), Ht = Math.max(4, Math.round(2 * P * b * ds));
  if (Wt * Ht > 600 * 600) return false;                                 // ganz nah: Striche sind dann ohnehin wenige je Bildpunkt
  const key = kind + col + bg + Wt + ',' + Ht;
  let e = patTiles.get(key);
  if (!e) {
    const c = document.createElement('canvas'); c.width = Wt; c.height = Ht;
    const X = c.getContext('2d');
    if (!X) return false;
    X.fillStyle = bg; X.fillRect(0, 0, Wt, Ht);
    const sx = Wt / (2 * P), sy = Ht / (2 * P), g0 = g, ps = patSeam;
    g = X; patSeam = false;                                              // Feld (0, 0): Bildpunkt (0, 0) = Weltpunkt (−0,5, −0,5)
    try { patternDraw(([u, v]) => [(u - v) * sx, (u + v + 1) * sy], kind, 0, 0, z * (sx / a + sy / b) / 2, col, null, 2 * P + 0.6); }   // Strichbreite: z in Bildpunkten der Kachel
    finally { g = g0; patSeam = ps; }
    const pat = g.createPattern(c, 'repeat');
    if (!pat || typeof pat.setTransform !== 'function') return false;
    if (patTiles.size > 200) patTiles.clear();
    e = { pat }; patTiles.set(key, e);
  }
  const A = L([-0.5 - x, -0.5 - y]);
  const M = { a: 2 * P * a / Wt, b: 0, c: 0, d: 2 * P * b / Ht, e: A[0], f: A[1] };
  e.pat.setTransform(typeof DOMMatrix === 'function' ? new DOMMatrix([M.a, 0, 0, M.d, M.e, M.f]) : M);
  const E = 0.55 + ext, [u0, u1, v0, v1] = box || [-E, E, -E, E];
  g.fillStyle = e.pat;
  g.beginPath(); [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(L).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.fill();
  return true;
}
function patternDraw(L, kind, x, y, z, col, cols, ext = 0, box = null) {
  const R = 0.55, E = R + ext;
  const out = (u, v) => box && (u < box[0] || u > box[1] || v < box[2] || v > box[3]);
  const span = step => [-Math.ceil(ext / step - 1e-9), Math.floor((2 * R + ext) / step + 1e-9)];   // Indizes im festen Raster
  if (kind === 'stones' || kind === 'dots') {
    // Raster über die ganze Insel (Block 100): Steine auf der Feldkante zeichnen beide Felder gleich – sonst bleiben an
    // jeder Kante angeschnittene halbe Steine stehen, die auf breiten Wegen wie Striche aussehen
    // je Farbe ein Pfad, ein fill (Block 125c: vorher je Punkt – ~80 Füllungen je Kiesfeld)
    const step = kind === 'stones' ? 0.11 : 0.09, M = R + ext, rx = (kind === 'stones' ? 2.6 : 1.3) * z, ry = (kind === 'stones' ? 1.6 : 0.9) * z;
    const gi0 = Math.ceil((x - M) / step), gi1 = Math.floor((x + M) / step), gj0 = Math.ceil((y - M) / step), gj1 = Math.floor((y + M) / step);
    const nc = cols ? cols.length : 1;
    for (let k = 0; k < nc; k++) {
      g.beginPath();
      for (let i = gi0; i <= gi1; i++) for (let j = gj0; j <= gj1; j++) {
        const u = i * step - x, v = j * step - y;
        if (out(u, v)) continue;
        const h = hash(i, j, 333);
        if (kind === 'dots' && h > 0.45) continue;
        if (cols && Math.floor(h * 97) % nc !== k) continue;
        const q = L([u + (h - 0.5) * 0.04, v + (hash(i, j, 334) - 0.5) * 0.04]);
        g.moveTo(q[0] + rx, q[1]); g.ellipse(q[0], q[1], rx, ry, 0, 0, Math.PI * 2);
      }
      g.fillStyle = cols ? cols[k] : col; g.fill();
    }
    return;
  }
  if (kind === 'rainbow') {                // schräge Streifen in Regenbogenfarben (pastell)
    // Streifen in Weltkoordinaten (Block 125): Farbe nach dem Streifen der Welt, nicht des Felds – sonst sah man jede Feldgrenze
    const RB = ['#f7a8b8', '#f9c98a', '#f8e38c', '#a8dcb0', '#9fcdf0', '#c6b2ee'], w = 0.1, n = Math.ceil(2 * E / w) + 1, k0 = Math.round((x + y) / w);   // Streifen u + v = c0, in der Welt x + y + c0
    for (let i = -n; i <= n; i++) {
      const c0 = i * w;
      poly([[c0 + E, -E], [c0 + w * 0.8 + E, -E], [c0 + w * 0.8 - E, E], [c0 - E, E]].map(L), C(RB[(((i + k0) % RB.length) + RB.length) % RB.length]));
    }
    return;
  }
  if (kind === 'confetti') {
    // kleine, zufällig gedrehte Papierstreifen – je Farbe ein Pfad, das spart Zeichenaufrufe
    const bits = cols.map(() => []), [i0, i1] = span(0.085);
    for (let i = i0; i <= i1; i++) for (let j = i0; j <= i1; j++) {
      const u = -R + i * 0.085, v = -R + j * 0.085;
      if (out(u, v)) continue;
      const h = hash(x * 16 + i, y * 16 + j, 335);
      if (h > 0.6) continue;
      const cu = u + (hash(x * 16 + i, y * 16 + j, 336) - 0.5) * 0.05, cv = v + (hash(x * 16 + i, y * 16 + j, 337) - 0.5) * 0.05;
      const a = h * 23, ca = Math.cos(a), sa = Math.sin(a);
      bits[Math.floor(h * 97) % cols.length].push([[0.042, 0.02], [-0.042, 0.02], [-0.042, -0.02], [0.042, -0.02]]
        .map(([du, dv]) => L([cu + du * ca - dv * sa, cv + du * sa + dv * ca])));
    }
    bits.forEach((list, k) => {
      g.beginPath();
      for (const pts of list) { pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); }
      g.fillStyle = C(cols[k]); g.fill();
    });
    return;
  }
  g.strokeStyle = col; g.lineWidth = 0.8 * z;
  g.beginPath();
  const hi = patSeam && !ext && !box ? 0.499 : Infinity;
  const line = (a, b) => {
    if ((a[0] > hi && b[0] > hi) || (a[1] > hi && b[1] > hi)) return;
    const p0 = L(a), p1 = L(b); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
  };
  if (kind === 'bricks') {
    const [r0, r1] = span(0.1), [c0, c1] = span(0.2);
    for (let r = r0; r <= r1; r++) {
      const v = -R + r * 0.1;
      line([-E, v], [E, v]);
      for (let c = c0; c <= c1; c++) { const u = -R + c * 0.2 + (r & 1 ? 0.1 : 0); line([u, v], [u, v + 0.1]); }
    }
  } else if (kind === 'planks') {
    const [i0, i1] = span(0.07);
    for (let i = i0; i <= i1; i++) { const v = -R + i * 0.07; line([-E, v], [E, v]); }
  } else if (kind === 'tiles') {
    const n = 2 + Math.ceil(ext / 0.25);
    for (let k = -n; k <= n; k++) { line([-E, k * 0.25], [E, k * 0.25]); line([k * 0.25, -E], [k * 0.25, E]); }
  } else if (kind === 'checker') {                                     // Schachbrett: Felder abwechselnd in der Fugenfarbe (Weltraster)
    g.fillStyle = col;
    const s = 0.25;
    for (let i = Math.floor((x - E) / s); i <= Math.ceil((x + E) / s); i++) for (let j = Math.floor((y - E) / s); j <= Math.ceil((y + E) / s); j++) {
      if ((i + j) & 1) continue;
      const u0 = i * s - x - 0.5, v0 = j * s - y - 0.5;
      if (u0 > E || v0 > E || u0 + s < -E || v0 + s < -E) continue;
      g.beginPath(); [[u0, v0], [u0 + s, v0], [u0 + s, v0 + s], [u0, v0 + s]].map(L).forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.fill();
    }
    return;
  } else if (kind === 'herring2' || kind === 'herring3') {               // echtes Fischgrät: Steine 2:1 im Treppenverband (Weltraster)
    const s = kind === 'herring2' ? 0.125 : 1 / 6;
    for (let a = Math.floor((x - E) / s) - 2; a <= Math.ceil((x + E) / s) + 1; a++) for (let b = Math.floor((y - E) / s) - 2; b <= Math.ceil((y + E) / s) + 1; b++) {
      const d = (((a - b) % 4) + 4) % 4, u = a * s - x, v = b * s - y;
      if (d === 0) { line([u, v], [u + 2 * s, v]); line([u, v + s], [u + 2 * s, v + s]); line([u, v], [u, v + s]); line([u + 2 * s, v], [u + 2 * s, v + s]); }
      else if (d === 3) { line([u, v], [u + s, v]); line([u, v + 2 * s], [u + s, v + 2 * s]); line([u, v], [u, v + 2 * s]); line([u + s, v], [u + s, v + 2 * s]); }
    }
  } else if (kind === 'basket') {                                       // Korbgeflecht: je Quadrat zwei Steine, abwechselnd gedreht
    const s = 0.25;
    for (let i = Math.floor((x - E) / s); i <= Math.ceil((x + E) / s); i++) for (let j = Math.floor((y - E) / s); j <= Math.ceil((y + E) / s); j++) {
      const u0 = i * s - x - 0.5, v0 = j * s - y - 0.5;
      if (u0 > E || v0 > E || u0 + s < -E || v0 + s < -E) continue;
      line([u0, v0], [u0 + s, v0]); line([u0, v0], [u0, v0 + s]);
      if ((i + j) & 1) line([u0 + s / 2, v0], [u0 + s / 2, v0 + s]); else line([u0, v0 + s / 2], [u0 + s, v0 + s / 2]);
    }
  } else if (kind === 'diag') {                                         // Rauten: Platten schräg verlegt
    const s = 0.25, n = Math.ceil(2 * E / s) + 2;
    for (let k = -n; k <= n; k++) { const c = k * s - ((x + y) % s); line([c + E, -E], [c - E, E]); const d = k * s - ((x - y) % s); line([-E, d - E], [E, d + E]); }
  } else if (kind === 'stack') {                                        // Platten 2:1 im Kreuzfugenverband
    for (let k = -3; k <= 3; k++) { const v = -0.5 + k * 0.25; if (Math.abs(v) <= E) line([-E, v], [E, v]); const u = -0.5 + k * 0.5; if (Math.abs(u) <= E) line([u, -E], [u, E]); }
  } else if (kind === 'modular') {                                      // Platten verschiedener Größe (je halbes Feld: ganz, halbiert oder geviertelt)
    const s = 0.5;
    for (let i = Math.floor((x - E) / s); i <= Math.ceil((x + E) / s); i++) for (let j = Math.floor((y - E) / s); j <= Math.ceil((y + E) / s); j++) {
      const u0 = i * s - x - 0.5, v0 = j * s - y - 0.5, h = hash(i, j, 343);
      if (u0 > E || v0 > E || u0 + s < -E || v0 + s < -E) continue;
      line([u0, v0], [u0 + s, v0]); line([u0, v0], [u0, v0 + s]);
      if (h < 0.35) line([u0 + s / 2, v0], [u0 + s / 2, v0 + s]);
      else if (h < 0.6) line([u0, v0 + s / 2], [u0 + s, v0 + s / 2]);
      else if (h < 0.8) { line([u0 + s / 2, v0], [u0 + s / 2, v0 + s]); line([u0, v0 + s / 2], [u0 + s, v0 + s / 2]); }
    }
  } else if (kind === 'big' || kind === 'setts' || kind === 'thirds') {   // Raster ab der Feldkante (Kanten liegen auf Fugen)
    const step = kind === 'big' ? 0.5 : kind === 'setts' ? 0.125 : 1 / 3, n = Math.ceil((E + 0.5) / step);
    for (let k = -n; k <= n; k++) { const c = -0.5 + k * step; if (Math.abs(c) > E) continue; line([-E, c], [E, c]); line([c, -E], [c, E]); }
  } else if (kind === 'slabs' || kind === 'ashlar' || kind === 'boards') {
    // Reihen in Weltkoordinaten (über Feldgrenzen durchgehend): Fugen quer zur Reihe versetzt bzw. (Sandstein, Holz) verschieden lang
    const h = kind === 'slabs' ? 0.25 : kind === 'ashlar' ? 0.2 : 0.1, w = kind === 'slabs' ? 0.5 : kind === 'ashlar' ? 0.32 : 0.6;
    for (let r = Math.floor((y - E) / h); r <= Math.ceil((y + E) / h); r++) {
      const v = r * h - y;
      if (v >= -E && v <= E) line([-E, v], [E, v]);
      const off = kind === 'slabs' ? (r & 1) * w / 2 : 0;
      for (let c = Math.floor((x - E - w) / w); c <= Math.ceil((x + E + w) / w); c++) {
        const jit = kind === 'slabs' ? 0 : (hash(c, r, kind === 'ashlar' ? 341 : 342) - 0.5) * w * 0.7;
        const u = c * w + off + jit - x;
        if (u < -E || u > E) continue;
        line([u, Math.max(-E, v)], [u, Math.min(E, v + h)]);
      }
    }
  } else if (kind === 'herring') {
    const n = Math.ceil(ext / 0.125);
    for (let i = -n; i < 9 + n; i++) for (let j = -n; j < 9 + n; j++) {
      const u = -0.5 + i * 0.125, v = -0.5 + j * 0.125;
      if ((i + j) & 1) line([u, v], [u + 0.125, v]); else line([u, v], [u, v + 0.125]);
    }
  }
  g.stroke();
}
function roadCenterline(arms, t) {
  const curve = t && t.sq ? null : roadCurve(arms);
  if (curve) return arcPts(curve.cu, curve.cv, 0.5, curve.a0, curve.a1);
  if (arms.length === 2 && roadCurve(arms)) return [[arms[0][0] * 0.5, arms[0][1] * 0.5], [0, 0], [arms[1][0] * 0.5, arms[1][1] * 0.5]];   // eckige Kurve
  if (arms.length === 2 || !arms.length) {
    const d = arms.length ? arms[0] : ((t && t.rot & 1) ? [0, 1] : [1, 0]), e = arms.length ? 0.5 : 0.5 - EDGE_W;
    return [[d[0] * e, d[1] * e], [-d[0] * e, -d[1] * e]];
  }
  if (arms.length === 1) return [[arms[0][0] * 0.5, arms[0][1] * 0.5], [0, 0]];
  return null;
}
const PATH_LOOK = {
  // Bänder
  sand:    { edge: '#d9c393', fill: '#eadbb2', pat: ['dots', null], cols: ['#c9b183', '#d8c79d'] },   // Kiesweg
  mulch:   { edge: '#86593a', fill: '#a87a55', pat: ['dots', null], cols: ['#86593a', '#c49a74'] },   // heller (Block 125)
  asphalt: { edge: '#cfc8bb', fill: '#9e988e', dash: true },
  regenbogen: { edge: '#d9a7bf', fill: '#fff7fb', pat: ['rainbow', null] },
  konfetti: { edge: '#e8d8cf', fill: '#fbf4ec', pat: ['confetti', null], cols: ['#f2a7c0', '#8fd3bf', '#b9a3ee', '#ffd36e', '#8fc1f0', '#f7b58a'] },
  blueten: { edge: '#dc9db4', fill: '#f7e3ea', pat: ['dots', null], cols: ['#f29bb8', '#ffffff', '#ffd36e', '#f6b6cb'] },
  tritt:   { stones: true },
  kristall: { edge: '#6fb4dc', fill: '#e1f4fb', pat: ['dots', null], cols: ['#9fdcf7', '#ffffff', '#62b1dc'], glow: true },
  // früher Flächen (Plätze), jetzt Bänder wie alle
  platten:    { edge: '#b3a68c', fill: '#ece6d8', pat: ['checker', '#d6cbb4'] },   // Schachbrett: zweifarbig, kräftiger Rand (Block 125)
  kopf:       { edge: '#b3ab9c', fill: '#cfc8bb', pat: ['stones', '#ddd7cc'] },
  klinker:    { edge: '#a95a43', fill: '#c97a5e', pat: ['bricks', '#a95a43'] },
  terrakotta: { edge: '#bf7f58', fill: '#d99a73', pat: ['tiles', '#c4805a'] },
  fisch:      { edge: '#c79a8d', fill: '#ecccc2', pat: ['herring2', '#cfa093'] },   // echtes Fischgrät (Block 125, Wahl A)
  goldpflaster: { edge: '#c2932f', fill: '#f3d27a', pat: ['checker', '#e7bd55'] },   // Gold-Schachbrett (Block 125)
};
// Aussehen eines Belags: alte Namen fest (PATH_LOOK), Muster + Farbe ('m:…') daraus berechnet – Rand kräftig, Fugen und Punkte
// aus der Farbe (Block 125)
const pathLookCache = new Map();
function pathLook(id) {
  if (PATH_LOOK[id]) return PATH_LOOK[id];
  if (pathLookCache.has(id)) return pathLookCache.get(id);
  const def = wegComposite(id);
  let lk = PATH_LOOK.sand;
  if (def) {
    const M = WEG_MUSTER_BY[def.muster], c = WEG_FARBEN_BY[def.farbe].c, dark = shade(c, -0.25), joint = shade(c, M.kind === 'checker' ? -0.09 : -0.14);
    lk = { edge: dark, fill: c, ...(M.kind ? { pat: [M.kind, joint] } : {}), ...(M.kind === 'dots' ? { cols: [shade(c, -0.16), shade(c, 0.08)] } : {}), ...(M.dash ? { dash: true } : {}) };
  }
  pathLookCache.set(id, lk);
  return lk;
}
const pathAt = (x, y) => { const w = wegAt(x, y); return w != null ? styleDef('weg', w) : null; };   // auch unter Marktständen
// Ecken, die ganz gefüllt werden, weil ringsum Weg ist (Band oder Platz) – keine Löcher in breiten Wegen und an Plätzen
// gepflastert für volle Ecken: Weg (außer Trittsteinen) – und das Rathaus-Grundstück (es ist selbst ein Arm der Wege), sonst
// bleibt an jeder Feldgrenze davor ein Zwickel Wiese stehen (Block 100)
const quadPaved = (px, py) => { const n = pathAt(px, py); return n ? n.id !== 'tritt' : bAt(px, py) === 'rathaus'; };
function pathQuads(x, y, hall = true) {
  const paved = hall ? quadPaved : (px, py) => { const n = pathAt(px, py); return !!n && n.id !== 'tritt'; };
  const out = [];
  for (const su of [1, -1]) for (const sv of [1, -1]) if (paved(x + su, y) && paved(x, y + sv) && paved(x + su, y + sv)) out.push([su, sv]);
  return out;
}
// (Trichter zu Plätzen gibt es nicht mehr – alle Wege sind Bänder; roadShapes kann sie aber noch)
const pathFlares = () => [];
// Belag eines Felds zeichnen (ext: über seine Kante hinaus verlängert – z. B. für große Flächen der Wunderwerke)
function paintLook(L, lk, x, y, z, band, ext, box = null) {
  const E = 0.5 + ext, rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], Ep = E + 0.01;
  const patArea = band ? [rect(-Ep, Ep, -ROAD_W, ROAD_W), rect(-ROAD_W, ROAD_W, -Ep, Ep)] : [rect(-Ep, Ep, -Ep, Ep)];   // Muster etwas über die Kante (wie drawPath)
  const fillArea = band ? [rect(-E, E, -ROAD_W, ROAD_W), rect(-ROAD_W, ROAD_W, -E, E)] : [rect(-E, E, -E, E)];
  if (band) for (const sh of [rect(-E, E, -EDGE_W, EDGE_W), rect(-EDGE_W, EDGE_W, -E, E)]) poly(sh.map(L), C(lk.edge));
  for (const sh of fillArea) poly(sh.map(L), C(lk.fill));
  if (!lk.pat && !lk.checker) return;
  g.save(); clipTo(patArea, L);
  if (lk.checker) {
    const n = Math.ceil(ext / 0.25);
    for (let i = -n; i < 4 + n; i++) for (let j = -n; j < 4 + n; j++) {
      if ((i + j) & 1) continue;
      const u = -0.5 + i * 0.25, v = -0.5 + j * 0.25;
      poly([[u, v], [u + 0.25, v], [u + 0.25, v + 0.25], [u, v + 0.25]].map(L), C(lk.checker));
    }
  } else { patSeam = true; try { pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols, ext, box, lk.fill); } finally { patSeam = false; } }
  g.restore();
}
// Trittsteine: auf jedem Arm 1/8 und 3/8 vom Mittelpunkt → überall derselbe Abstand, auch über Feldgrenzen.
// Kreuzungen bekommen einen großen Stein in der Mitte, Kurven drei Steine auf dem Bogen.
function stonePoints(arms, t) {
  const curve = t && t.sq ? null : roadCurve(arms);
  if (curve) return [1 / 6, 1 / 2, 5 / 6].map(f => {
    const a = curve.a0 + (curve.a1 - curve.a0) * f;
    return [curve.cu + Math.cos(a) * 0.5, curve.cv + Math.sin(a) * 0.5, 1];
  });
  const hub = arms.length > 2, pts = hub ? [[0, 0, 1.45]] : [];
  const list = arms.length ? arms : ((t && t.rot & 1) ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]);
  for (const [dx, dy] of list) for (const d of hub ? [0.375] : [0.125, 0.375]) pts.push([dx * d, dy * d, 1]);
  return pts;
}
function drawStones(L, arms, t, x, y, z) {
  const pts = stonePoints(arms, t).sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
  pts.forEach(([u, v, s], i) => {
    const h = hash(x * 7 + i, y * 7 - i, 91), k = s * (0.92 + h * 0.14), q = L([u, v]);
    ellipse(q[0], q[1] + 0.8 * z, 6 * k * z, 3.1 * k * z, C('#aaa498'));
    ellipse(q[0], q[1], 6 * k * z, 3.1 * k * z, C(h > 0.5 ? '#d6d1c6' : '#ddd8cd'));
  });
}

// ---------------------------------------------------------------------------
// Schienen: Gleisbett je nach Stil (Block 109), Schwellen, zwei Schienen; über Wasser eine Holzbrücke. Keine Oberleitung
// mehr (Block 109: ruhigeres Bild) – Bahnübergänge kommen als Objekt dazu (drawObject 'schiene').
// ---------------------------------------------------------------------------
const RAIL_W = 0.2, RAIL_GAUGE = 0.075;
// Mittellinien einer Schiene als Punktfolgen im Feld (Kurve als Bogen, sonst gerade Stücke von der Mitte)
function railSegments(arms, t) {
  const curve = roadCurve(arms);
  if (curve) return [arcPts(curve.cu, curve.cv, 0.5, curve.a0, curve.a1, 10)];
  if (!arms.length) { const d = (t && t.rot & 1) ? [0, 1] : [1, 0]; return [[[-d[0] * 0.36, -d[1] * 0.36], [d[0] * 0.36, d[1] * 0.36]]]; }
  const [a, b] = arms;
  if (arms.length === 2 && a[0] === -b[0] && a[1] === -b[1]) return [[[b[0] * 0.5, b[1] * 0.5], [a[0] * 0.5, a[1] * 0.5]]];
  return arms.map(([dx, dy]) => [[0, 0], [dx * 0.5, dy * 0.5]]);
}
// Punkte entlang einer Folge im Abstand step (ab step/2) mit Richtung – für Schwellen
function alongPath(pts, step, fn) {
  let carry = step / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!len) continue;
    const dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    for (let d = carry; d < len; d += step) fn([a[0] + dir[0] * d, a[1] + dir[1] * d], dir);
    carry = (carry - len) % step; if (carry < 0) carry += step;
  }
}
// dieselbe Folge seitlich versetzt (für die beiden Schienen)
function offsetPath(pts, off) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] - (b[1] - a[1]) / len * off, p[1] + (b[0] - a[0]) / len * off];
  });
}
// Gleisbett je Stil (Block 109): Rand und Fläche, Schwellen, Schienen; pave: Pflaster bis an die Schienen (Straßenbahn),
// tufts: Grasbüschel, flowers: Blumenbänder an beiden Seiten (edgeFlowers: nur hier und da eine Blüte)
const RAIL_LOOK = {
  schotter: { edge: '#a79d8c', bed: '#c3b9a8', tie: '#8a6440', rail: '#6f7682', rw: 1.3 },
  rasen:    { edge: '#7fbd5e', bed: '#9fd979', tie: '#d6b585', rail: '#7d818b', rw: 1.1, tufts: '#78b957' },
  wald:     { edge: '#cbb17d', bed: '#e6d3a5', tie: '#b98a58', rail: '#7d7568', rw: 1.1, tufts: '#6fae55', edgeFlowers: 0.3 },
  pflaster: { pave: 'kopf', rail: '#7b766c', rw: 0.9 },
  blumen:   { edge: '#7fbd5e', bed: '#9fd979', tie: '#d6b585', rail: '#7d818b', rw: 1.1, flowers: true },
};
const railLookOf = t => RAIL_LOOK[(DECO_LOOKS.schiene.forms[(t && t.form) || 0] || {}).id] || RAIL_LOOK.schotter;   // auch auf Brücken (Block 109b)
function drawRailBed(cx, cy, z, x, y, t) {
  const arms = railArms(x, y), segs = railSegments(arms, t), lk = railLookOf(t);
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const stroke = (paths, col, w) => {
    g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (const p of paths) p.forEach((q, i) => { const s = L(q); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); });
    g.stroke();
  };
  if (t && t.bridge) {                               // Holzbrücke: Pfähle ins Wasser, Deck, Geländer
    g.fillStyle = C('#6f5238');
    alongPath(segs[0], 0.5, (p, dir) => {
      for (const s of [1, -1]) {
        const q = L([p[0] - dir[1] * 0.27 * s, p[1] + dir[0] * 0.27 * s]);
        g.fillRect(q[0] - 1.2 * z, q[1] - 1 * z, 2.4 * z, 7 * z);
      }
    });
    for (const sh of roadShapes(arms, t, 0.3)) poly(sh.map(L), C('#8a6440'));
    for (const sh of roadShapes(arms, t, 0.27)) poly(sh.map(L), C('#b08a5e'));
  }
  if (lk.pave) {                                     // Pflastergleis: Belag des Wegs bis an die Schienen
    const pl = pathLook(lk.pave);
    for (const sh of roadShapes(arms, t, RAIL_W + 0.05)) poly(sh.map(L), C(pl.edge));
    for (const sh of roadShapes(arms, t, RAIL_W + 0.02)) poly(sh.map(L), C(pl.fill));
    g.save(); clipTo(roadShapes(arms, t, RAIL_W + 0.02), L); pattern(L, pl.pat[0], x, y, z, pl.pat[1] && C(pl.pat[1]), pl.cols); g.restore();
  } else {
    for (const sh of roadShapes(arms, t, RAIL_W + 0.03)) poly(sh.map(L), C(t && t.bridge && lk === RAIL_LOOK.schotter ? '#9a8f80' : lk.edge));
    for (const sh of roadShapes(arms, t, RAIL_W)) poly(sh.map(L), C(lk.bed));
    // Schwellen
    g.strokeStyle = C(lk.tie); g.lineWidth = 1.7 * z; g.lineCap = 'butt';
    g.beginPath();
    for (const seg of segs) alongPath(seg, 0.125, (p, dir) => {
      const n = [-dir[1] * 0.15, dir[0] * 0.15], a = L([p[0] + n[0], p[1] + n[1]]), b = L([p[0] - n[0], p[1] - n[1]]);
      g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
    });
    g.stroke();
    railTrim(L, segs, lk, x, y, z);
  }
  if (t && t.cross && !t.foot) {                     // Bahnübergang: Wegbelag quer über die Gleise (nicht unter der Brücke)
    const st = styleDef('weg', t.style), lk = pathLook(st.id), pa = pathArms(x, y);
    const fill = lk.fill || '#dcc69d', edge = lk.edge || shade(fill, -0.18);
    const across = { rot: arms.length && arms[0][0] ? 1 : 0 };      // ohne Weg-Nachbarn: quer zur Schiene
    for (const [w, col] of [[EDGE_W, edge], [ROAD_W, fill]]) for (const sh of roadShapes(pa, across, w)) poly(sh.map(L), C(col));
    if (lk.pat || lk.checker) {                      // Muster des Wegs auch zwischen den Schienen
      g.save(); clipTo(roadShapes(pa, across, ROAD_W), L);
      if (lk.checker) paintLook(L, lk, x, y, z, false, 0);
      else pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, fill);
      g.restore();
    }
  }
  // Schienen: dunkel, darauf ein heller Glanz
  const rails = segs.flatMap(seg => [offsetPath(seg, RAIL_GAUGE), offsetPath(seg, -RAIL_GAUGE)]);
  stroke(rails, lk.rail, lk.rw);
  g.save(); g.translate(0, -0.4 * z); stroke(rails, '#dfe3e8', 0.45); g.restore();
  if (arms.length === 1) {                           // Prellbock am Ende
    const [dx, dy] = arms[0], n = [-dy * 0.17, dx * 0.17], a = L([-dx * 0.02 + n[0], -dy * 0.02 + n[1]]), b = L([-dx * 0.02 - n[0], -dy * 0.02 - n[1]]);
    g.strokeStyle = C('#d9534a'); g.lineWidth = 2.6 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(a[0], a[1] - 1.5 * z); g.lineTo(b[0], b[1] - 1.5 * z); g.stroke();
    g.strokeStyle = C('#ffffff'); g.lineWidth = 1 * z;
    g.beginPath(); g.moveTo(...lerp(a, b, 0.35)); g.lineTo(...lerp(a, b, 0.65)); g.stroke();
  }
  if (t && t.bridge) {                               // Geländer an den Seiten, wo kein Nachbar-Gleis anschließt
    g.strokeStyle = C('#6f5238'); g.lineWidth = 0.9 * z;
    g.beginPath();
    for (const seg of segs) for (const s of [1, -1]) {
      const side = offsetPath(seg, 0.29 * s).map(q => { const p = L(q); return [p[0], p[1] - 3 * z]; });
      side.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    }
    g.stroke();
  }
}
// Grasbüschel und Blumen am Gleis (Block 109): fest nach Feld und Stelle, damit nichts flackert
function railTrim(L, segs, lk, x, y, z) {
  if (!lk.tufts && !lk.flowers) return;
  let i = 0;
  for (const seg of segs) for (const s of [1, -1]) alongPath(offsetPath(seg, s * (RAIL_W + 0.01)), lk.flowers ? 0.07 : 0.1, p => {
    const h = hash(x * 31 + i, y * 17 + s, 109), q = L(p); i++;
    if (lk.flowers) {
      circle(q[0], q[1] - 0.6 * z, 1.25 * z, C(h < 0.5 ? '#6fb553' : '#7cc463'));
      circle(q[0] + (h - 0.5) * 1.4 * z, q[1] - 1.5 * z, 0.95 * z, C(FLOWER_COLS[Math.floor(h * 97) % FLOWER_COLS.length]));
      return;
    }
    if (h > 0.55) return;                                          // Büschel hier und da
    g.strokeStyle = C(lk.tufts); g.lineWidth = 0.6 * z; g.lineCap = 'round';
    g.beginPath();
    for (const d of [-0.9, 0, 0.9]) { g.moveTo(q[0] + d * z, q[1]); g.lineTo(q[0] + d * 1.6 * z, q[1] - (1.6 + h * 1.4) * z); }
    g.stroke();
    if (lk.edgeFlowers && h < lk.edgeFlowers * 0.55) circle(q[0], q[1] - 2.6 * z, 0.85 * z, C(FLOWER_COLS[Math.floor(h * 131) % FLOWER_COLS.length]));
  });
}
const afterMovers = [], archWalkers = new Map();  // Zeichnungen über den Fahrzeugen ihres Felds (Bogenbrücke), Bewohner darauf
// Bahnübergang: Schranken (senken sich, wenn ein Zug kommt; nachts blinkt es rot) oder eine Fußgängerbrücke
const crossAnim = new Map();
// Richtung eines Übergangs: Schiene entlang d, Weg entlang n (beide als positive Einheitsachse)
function crossingAxes(x, y) {
  const ra = railArms(x, y), along = ra.length ? ra[0] : [1, 0];
  const d = [Math.abs(along[0]), Math.abs(along[1])];
  return { d, n: [d[1], d[0]] };
}
// Bogenbrücke: flacher Bogen quer über die Gleise, über zwei Felder gespannt (halbe Rampe auf den Wegen links
// und rechts), in der Mitte hoch über dem Zug. b = Abstand zur Mitte entlang des Wegs in Feldern.
// So breit wie ein Weg; Design wählbar (Holz, Stein, wie der Weg, Kristall)
const ARCH_H = 22, ARCH_W = 0.3, ARCH_SPAN = 1;
const archH = b => ARCH_H * Math.cos(Math.max(-1, Math.min(1, b / ARCH_SPAN)) * Math.PI / 2);
const ARCH_LOOK = {
  holz:     { deck: '#c9a26f', seam: '#b08a5e', side: '#8a6440', rail: '#7a5236', th: 4, kind: 'posts' },
  stein:    { deck: '#ddd6c8', seam: '#c9c0ae', side: '#b8ad98', rail: '#e7e1d4', th: 7, kind: 'wall' },
  kristall: { deck: '#e6f6fc', seam: '#c3e7f5', side: '#8fcbe6', rail: '#8fd3f2', th: 3, kind: 'glass' },
};
function archLook(t) {
  const id = footPaidOf(t) || 'holz';
  if (id !== 'weg') return ARCH_LOOK[id];
  const st = styleDef('weg', t.style), lk = st.id === 'tritt' ? PATH_LOOK.kopf : pathLook(st.id);
  const edge = lk.edge || shade(lk.fill, -0.18);
  return { deck: lk.fill, side: shade(edge, -0.12), rail: shade(edge, -0.25), th: 4, kind: 'posts', path: lk };
}
// Steht ein Bewohner auf einer Bogenbrücke? → Feld der Brücke und seine Lage b auf ihr
function archAt(px, py) {
  const rx = Math.round(px), ry = Math.round(py);
  for (const [dx, dy] of [[0, 0], ...DIRS]) {
    const x = rx + dx, y = ry + dy, t = state.tiles.get(x + ',' + y);
    if (!isCrossing(t) || !t.foot) continue;
    const { d, n } = crossingAxes(x, y), a = (px - x) * d[0] + (py - y) * d[1], b = (px - x) * n[0] + (py - y) * n[1];
    if (Math.abs(a) < 0.5 && Math.abs(b) < ARCH_SPAN) return { key: x + ',' + y, b };
  }
  return null;
}
function drawArch(P, z, b0, b1, lk, x, y, d, n) {
  const bs = [];
  for (let i = 0; i <= 12; i++) bs.push(b0 + (b1 - b0) * i / 12);
  const rail = (s, off) => bs.map(b => P(s * ARCH_W, b, archH(b) + off));
  const line = (pts, col, w) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
  const posts = (s, h, col, w) => {
    g.beginPath();
    for (const b of bs) { const p = P(s * ARCH_W, b, archH(b)), q = P(s * ARCH_W, b, archH(b) + h); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
    g.strokeStyle = C(col); g.lineWidth = w * z; g.stroke();
  };
  const railing = s => {
    if (lk.kind === 'wall') {                              // Stein: niedrige Brüstung mit heller Abdeckung
      poly(rail(s, 0).concat(rail(s, 5).reverse()), C(s < 0 ? shade(lk.rail, -0.06) : lk.side));
      line(rail(s, 5), shade(lk.rail, 0.2), 1.3);
    } else if (lk.kind === 'glass') {                      // Kristall: Glasscheiben, oben ein leuchtender Handlauf
      poly(rail(s, 0).concat(rail(s, 7).reverse()), 'rgba(175,225,248,0.38)');
      posts(s, 7, '#cfeefb', 0.6);
      line(rail(s, 7), lk.rail, 1.2);
    } else {
      line(rail(s, 6), lk.rail, 1.1);
      posts(s, 6, lk.rail, 0.8);
    }
  };
  railing(-1);                                             // hinteres Geländer
  const deck = rail(-1, 0).concat(rail(1, 0).reverse());
  poly(deck, C(lk.deck));
  if (lk.path) {
    // Belag wie der Weg: je Abschnitt eine eigene (ebene) Abbildung, damit Muster dem Bogen folgen
    for (let i = 0; i < 12; i++) {
      const bA = bs[i], bB = bs[i + 1], hA = archH(bA), hB = archH(bB), k = (hB - hA) / ((bB - bA) || 1);
      const Ls = ([u, v]) => { const a = u * d[0] + v * d[1], b = u * n[0] + v * n[1]; return P(a, b, hA + (b - bA) * k); };
      const cs = [[-ARCH_W, bA], [ARCH_W, bA], [ARCH_W, bB], [-ARCH_W, bB]].map(([a, b]) => [a * d[0] + b * n[0], a * d[1] + b * n[1]]);
      const only = [Math.min(...cs.map(c => c[0])) - 0.1, Math.max(...cs.map(c => c[0])) + 0.1, Math.min(...cs.map(c => c[1])) - 0.1, Math.max(...cs.map(c => c[1])) + 0.1];
      g.save();
      g.beginPath(); cs.forEach((c, j) => { const q = Ls(c); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.clip();
      paintLook(Ls, lk.path, x, y, z, false, 0.55, only);
      g.restore();
    }
  } else if (lk.kind !== 'glass') {
    g.strokeStyle = C(lk.seam); g.lineWidth = 0.6 * z; g.beginPath();
    for (const b of lk.kind === 'wall' ? bs.filter((_, i) => i % 2 === 0) : bs) { const p = P(-ARCH_W, b, archH(b)), q = P(ARCH_W, b, archH(b)); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
    g.stroke();
  } else {
    line(bs.map(b => P(0, b, archH(b))), '#ffffff', 1.4);  // Kristall: heller Glanz in der Mitte
    glowQuad([P(-ARCH_W, b0, archH(b0)), P(ARCH_W, b0, archH(b0)), P(ARCH_W, b1, archH(b1)), P(-ARCH_W, b1, archH(b1))], 22 * z, 'blue');
  }
  poly(rail(1, 0).concat(rail(1, -lk.th).reverse()), C(lk.side));  // vordere Wange
  railing(1);
}
function drawCrossing(cx, cy, z, x, y, t, now) {
  const { d, n } = crossingAxes(x, y);
  const P = (a, b, up = 0) => { const u = d[0] * a + n[0] * b, v = d[1] * a + n[1] * b; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z]; };
  if (t.foot) {
    // hintere Hälfte jetzt, vordere erst nach den Fahrzeugen dieses Felds (der Zug fährt darunter durch)
    const lk = archLook(t);
    if (PASS === 'object') {
      drawArch(P, z, -ARCH_SPAN, 0, lk, x, y, d, n);
      const m = g.getTransform();
      afterMovers.push(() => { g.save(); g.setTransform(m); drawArch(P, z, 0, ARCH_SPAN, lk, x, y, d, n); g.restore(); });
    } else drawArch(P, z, -ARCH_SPAN, ARCH_SPAN, lk, x, y, d, n);
    return;
  }
  const key = x + ',' + y, target = crossingClosed(x, y) ? 1 : 0;
  let k = crossAnim.has(key) ? crossAnim.get(key) : target;
  k += Math.max(-0.05, Math.min(0.05, target - k));
  crossAnim.set(key, k);
  const th = (1 - k) * Math.PI * 0.44, blink = k > 0.5 && Math.floor(now / 420) % 2 === 0;
  for (const s of [1, -1]) {
    const pa = -0.4 * s, pb = 0.38 * s, foot = P(pa, pb), top = P(pa, pb, 10);
    ellipse(foot[0], foot[1] + 0.4 * z, 1.8 * z, 0.9 * z, 'rgba(40,60,20,0.18)');
    g.strokeStyle = C('#6b6f78'); g.lineWidth = 1.3 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(foot[0], foot[1]); g.lineTo(top[0], top[1]); g.stroke();
    circle(top[0], top[1] - 1 * z, 1.3 * z, k > 0.5 ? (blink ? '#ff4a3d' : C('#b8352c')) : C('#7a2a24'));
    if (blink) glowQuad([[top[0] - 1, top[1] - 2], [top[0] + 1, top[1] - 2], [top[0] + 1, top[1]], [top[0] - 1, top[1]]], 12 * z);
    const piv = P(pa, pb, 7), end = P(pa + s * 0.7 * Math.cos(th), pb, 7 + 0.7 * 26 * Math.sin(th));
    g.lineWidth = 1.9 * z; g.strokeStyle = C('#ffffff');
    g.beginPath(); g.moveTo(piv[0], piv[1]); g.lineTo(end[0], end[1]); g.stroke();
    g.strokeStyle = C('#d9534a'); g.setLineDash([2.2 * z, 2.2 * z]);
    g.beginPath(); g.moveTo(piv[0], piv[1]); g.lineTo(end[0], end[1]); g.stroke();
    g.setLineDash([]);
  }
}
const drawFlat = (cx, cy, z, x, y, t) => t.b === 'schiene' ? drawRailBed(cx, cy, z, x, y, t) : drawPath(cx, cy, z, x, y, t.weg != null ? { style: t.weg, rot: 0 } : t);

// Steht an einer Seite des Wegfelds eine Hecke, ein Zaun oder eine Mauer, läuft der Weg dort bis an die Feldkante
// (eckig) – kein Grasstreifen zwischen Weg und Linie (Block 41)
// Winkel für das runde Eckstück: vom Punkt auf der u-Seite (Richtung su) zum Punkt auf der v-Seite (Richtung sv), kurzer Weg
function angStep(su, sv, f) {
  const a0 = Math.atan2(0, su), a1 = Math.atan2(sv, 0);
  let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  return a0 + d * f;
}
function lineFill(x, y, arms, w) {
  if (x > 1e5 || !state.edges.size) return [];
  const has = (dx, dy) => arms.some(([ax, ay]) => ax === dx && ay === dy);
  const side = ([dx, dy]) => { const k = edgeBetween(x, y, x + dx, y + dy); return state.edges.has(k) && !isGate(k) && edgeFlush(k); };   // nur, wo bündig gewollt (Block 57)
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], out = [];
  // runde Ecken (roundCorner): dort hört das Rechteck vor dem Bogen auf, das Eckstück folgt dem Viertelkreis der Linie
  const rounded = (su, sv) => side([su, 0]) && side([0, sv]) && !!(roundCorner(x + (su + 1) / 2, y + (sv + 1) / 2) || {}).inPath;
  const lo = (d, a, b) => Math.min(has(...d) ? 0.5 : w, rounded(a, b) ? 0.5 - ROUND_R : 0.5);
  for (const [dx, dy] of DIRS) {
    if (!side([dx, dy])) continue;
    if (dx) out.push(rect(dx > 0 ? 0 : -0.5, dx > 0 ? 0.5 : 0, -lo([0, -1], dx, -1), lo([0, 1], dx, 1)));
    else out.push(rect(-lo([-1, 0], -1, dy), lo([1, 0], 1, dy), dy > 0 ? 0 : -0.5, dy > 0 ? 0.5 : 0));
  }
  for (const su of [1, -1]) for (const sv of [1, -1]) {
    if (!side([su, 0]) || !side([0, sv])) continue;
    if (!rounded(su, sv)) { out.push(rect(Math.min(0, su * 0.5), Math.max(0, su * 0.5), Math.min(0, sv * 0.5), Math.max(0, sv * 0.5))); continue; }
    const c = [su * (0.5 - ROUND_R), sv * (0.5 - ROUND_R)], arc = [];
    for (let s = 0; s <= 8; s++) { const a = angStep(su, sv, s / 8); arc.push([c[0] + Math.cos(a) * ROUND_R, c[1] + Math.sin(a) * ROUND_R]); }
    out.push([[0, 0], [su * 0.5, 0], ...arc, [0, sv * 0.5]]);
  }
  // Innenseite einer Wegkurve an einer Linie: die Ecke zwischen den beiden Armen ganz füllen (bis an den Bogen der Linie)
  for (const su of [1, -1]) for (const sv of [1, -1]) {
    if (!has(su, 0) || !has(0, sv)) continue;
    const i = x + (su + 1) / 2, j = y + (sv + 1) / 2;
    if (['a' + (i - 1) + ',' + j, 'a' + i + ',' + j, 'b' + i + ',' + (j - 1), 'b' + i + ',' + j].some(k => state.edges.has(k) && edgeFlush(k)))
      out.push(rect(Math.min(0, su * 0.5), Math.max(0, su * 0.5), Math.min(0, sv * 0.5), Math.max(0, sv * 0.5)));
  }
  out.sides = DIRS.some(side);                                    // Linie an einer Seite: Weg gerade bis an sie (sonst bleibt die Kurve rund)
  return out;
}
// Wegbrücke (Block 66): gerade über das Wasser, leicht angehoben, an Land-Enden eine kurze Rampe. Art nach Wegstil
// (bridgeKind): Holzsteg (Pfähle, Planken, Geländer), Steinbogen und Ziegelbrücke (Seitenwand mit Bogen, Brüstung,
// Belag wie der Weg), rote Bogenbrücke (höher, rote Pfosten und Geländer).
const BRIDGE_COLS = ['#6f5238', '#b08a5e', '#fbf7ef', '#d9483b', '#3f6fb5', '#3f8f5a', '#d9d2c3', '#8c8a85', '#b5654a', '#f2c14e'];   // Bauwerk
const PLANK_COLS = ['#b08a5e', '#8a6440', '#c9b79c', '#a9a9a3', '#f1e7d6'];                                                        // Holzplanken
const BRIDGE_LOOK = {
  holz:   { lift: 3, side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238' },
  stein:  { lift: 7, side: '#d9d2c3', wall: true, rail: '#cfc6b4' },
  ziegel: { lift: 7, side: '#b5654a', wall: true, rail: '#c97a5e' },
  rot:    { lift: 8, side: '#a8392f', deck: '#c79a6a', plank: '#9a7048', rail: '#d9483b' },
};
function drawWegBridge(cx, cy, z, x, y, t) {
  const arms = pathArms(x, y), ax = arms.length ? (arms[0][0] ? 0 : 1) : ((t.rot || 0) & 1);   // 0: längs u, 1: längs v
  const P = (a, b, h = 0) => { const [u, v] = ax ? [b, a] : [a, b]; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z]; };
  const B0 = BRIDGE_LOOK[bridgeKind(t)] || BRIDGE_LOOK.holz, hw = EDGE_W, LIFT = B0.lift;
  // Farben aus dem Fenster (Block 66b): Bauwerk (Wand/Geländer/Pfähle) und bei Holz die Planken
  const bc = BRIDGE_COLS[t.brc], pc = PLANK_COLS[t.brw];
  const B = { ...B0, ...(bc ? (B0.wall ? { side: bc, rail: shade(bc, 0.1) } : { side: shade(bc, -0.15), rail: bc }) : {}), ...(pc ? { deck: pc, plank: shade(pc, -0.22) } : {}) };
  const land = s => { const [dx, dy] = ax ? [0, s] : [s, 0], n = state.tiles.get((x + dx) + ',' + (y + dy)); return !!n && !isWegBridge(n) && terrainAt(x + dx, y + dy) !== 'water'; };
  const H = a => Math.max(0, Math.min(LIFT, land(1) && a > 0.2 ? LIFT * (0.5 - a) / 0.3 : LIFT, land(-1) && a < -0.2 ? LIFT * (a + 0.5) / 0.3 : LIFT));
  const AS = [-0.5, -0.2, 0.2, 0.5];
  const strip = (b0, b1, dh = 0) => AS.slice(0, -1).map((a, i) => [P(a, b0, H(a) + dh), P(AS[i + 1], b0, H(AS[i + 1]) + dh), P(AS[i + 1], b1, H(AS[i + 1]) + dh), P(a, b1, H(a) + dh)]);
  const posts = (b, col) => { for (const a of [-0.3, 0.3]) { const p0 = P(a, b, -1), p1 = P(a, b, H(a)); g.fillStyle = C(col); g.fillRect(p0[0] - 1 * z, p1[1], 2 * z, p0[1] - p1[1] + 1 * z); } };
  const railing = b => {                                                // Pfosten und Handlauf
    g.strokeStyle = C(B.rail); g.lineWidth = 1 * z; g.beginPath();
    AS.forEach((a, i) => { const p = P(a, b, H(a) + 4.5); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
    for (const a of [-0.4, 0, 0.4]) { const p0 = P(a, b, H(a)), p1 = P(a, b, H(a) + 4.5); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
    g.stroke();
  };
  const parapet = b => { for (const q of strip(b - 0.03, b + 0.03, 0)) poly(q, C(shade(B.rail, -0.05))); for (const q of strip(b - 0.03, b + 0.03, 2.5)) poly(q, C(B.rail)); };
  // hinten: Pfähle bzw. Brüstung der fernen Seite; Holz: auch die vorderen Pfähle schon jetzt – der Belag deckt ihr oberes
  // Ende, sie stehen also unter der Brücke statt davor
  if (!B.wall) { posts(-hw + 0.1, B.side); railing(-hw + 0.03); posts(hw - 0.1, B.side); } else parapet(-hw);
  // vorn sichtbare Seitenwand (Stein/Ziegel) mit Bogen über dem Wasser
  if (B.wall) {
    for (let i = 0; i < 3; i++) { const a0 = AS[i], a1 = AS[i + 1]; poly([P(a0, hw, -1), P(a1, hw, -1), P(a1, hw, H(a1)), P(a0, hw, H(a0))], C(shade(B.side, -0.12))); }
    const wallPts = [...AS.map(a => P(a, hw, -1)), ...[...AS].reverse().map(a => P(a, hw, H(a)))];   // Mauerwerk: Ziegel bzw. Quader
    g.save(); g.beginPath(); wallPts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
    pattern(([sa, st]) => P(sa, hw, -1 + (st + 0.5) * 22), bridgeKind(t) === 'ziegel' ? 'bricks' : 'tiles', x, y, z, C(shade(B.side, -0.3)), null);
    g.restore();
    const arch = []; for (let k = 0; k <= 12; k++) { const a = -0.3 + 0.6 * k / 12; arch.push(P(a, hw, -1 + (LIFT - 2.5) * Math.sqrt(Math.max(0, 1 - (a / 0.3) ** 2)))); }
    poly(arch, 'rgba(35,70,95,0.55)');
  }
  // Belag: Planken (Holz/rot) oder der Weg selbst (Stein/Ziegel)
  const deck = strip(-hw, hw);
  if (B.wall) {                                                         // Belag wie der Weg – mit seinem Muster (Block 66b)
    const st = styleDef('weg', t.style), lk = pathLook(st.id) || {}, fill = lk.fill || '#dcc69d';
    const Lh = ([u, v]) => { const a = ax ? v : u, b = ax ? u : v; return P(a, b, H(a)); };
    const band = w => [...AS.map(a => ax ? [-w, a] : [a, -w]), ...[...AS].reverse().map(a => ax ? [w, a] : [a, w])];
    poly(band(hw).map(Lh), C(lk.edge || shade(fill, -0.18)));
    poly(band(ROAD_W).map(Lh), C(fill));
    if (lk.pat || lk.checker) { g.save(); clipTo([band(ROAD_W)], Lh); pattern(Lh, lk.pat ? lk.pat[0] : 'tiles', x, y, z, lk.pat && lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, fill); g.restore(); }
    if (lk.dash) {                                                     // Asphalt: Mittelstreifen
      g.strokeStyle = C('#f4efe2'); g.lineWidth = 1.2 * z; g.lineCap = 'round'; g.setLineDash([2.5 * z, 3 * z]); g.beginPath();
      AS.forEach((a, i) => { const q = P(a, 0, H(a)); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); g.setLineDash([]);
    }
  } else {
    for (const q of deck) poly(q, C(B.deck));
    g.strokeStyle = C(B.plank); g.lineWidth = 0.7 * z; g.beginPath();
    for (let a = -0.45; a < 0.5; a += 0.12) { const p0 = P(a, -hw, H(a)), p1 = P(a, hw, H(a)); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
    g.stroke();
    for (let i = 0; i < 3; i++) { const a0 = AS[i], a1 = AS[i + 1]; poly([P(a0, hw, H(a0) - 1.6), P(a1, hw, H(a1) - 1.6), P(a1, hw, H(a1)), P(a0, hw, H(a0))], C(shade(B.side, 0.05))); }   // Randbalken vorn
  }
  // vorn: Brüstung bzw. Geländer
  if (B.wall) parapet(hw); else railing(hw - 0.03);
  // offenes Ende (z. B. ins Meer): sichtbare Stirnseite zu, Geländer quer
  const [ex, ey] = ax ? [0, 1] : [1, 0];
  if (!wegLike(x + ex, y + ey)) {
    const h = H(0.5);
    if (B.wall) { poly([P(0.5, -hw, -1), P(0.5, hw, -1), P(0.5, hw, h), P(0.5, -hw, h)], C(shade(B.side, -0.2))); poly([P(0.5, -hw, h), P(0.5, hw, h), P(0.5, hw, h + 2.5), P(0.5, -hw, h + 2.5)], C(B.rail)); }
    else { g.strokeStyle = C(B.rail); g.lineWidth = 1 * z; g.beginPath(); const p0 = P(0.47, -hw, h + 4.5), p1 = P(0.47, hw, h + 4.5); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
  }
}
// Ganz breiter Weg (Block 77): Belag über das ganze Feld, Bordstein an den Seiten ohne breiten Nachbarweg – dort, wo ein
// schmaler Weg ankommt, mit Lücke; an breiten Nachbarn geht der Belag nahtlos weiter
const WIDE_CURB = 0.05;
function drawWidePath(L, lk, x, y, z, arms, stubs = []) {
  g.strokeStyle = C(lk.fill); g.lineWidth = 0.6; g.lineJoin = 'round';     // Fuge zum Nachbarfeld schließen (Block 116, wie drawPath)
  g.beginPath(); [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(L).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
  const near = (dx, dy) => state.tiles.get((x + dx) + ',' + (y + dy));
  const wideAt = (dx, dy) => { const n = near(dx, dy); return !!n && n.b === 'weg' && !!n.wide && !n.bridge; };
  const pad = seamPad(L);                                                // zu breiten Nachbarn ~1 Gerätepunkt überlappen (Block 125c, PC)
  if (pad) poly([[-0.5 - (wideAt(-1, 0) ? pad : 0), -0.5 - (wideAt(0, -1) ? pad : 0)], [0.5 + (wideAt(1, 0) ? pad : 0), -0.5 - (wideAt(0, -1) ? pad : 0)],
    [0.5 + (wideAt(1, 0) ? pad : 0), 0.5 + (wideAt(0, 1) ? pad : 0)], [-0.5 - (wideAt(-1, 0) ? pad : 0), 0.5 + (wideAt(0, 1) ? pad : 0)]].map(L), C(lk.fill));
  paintLook(L, lk, x, y, z, false, 0);
  const rect = (u0, u1, v0, v1) => poly([[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(L), C(lk.edge));
  for (const [dx, dy] of DIRS) {
    if (wideAt(dx, dy)) continue;
    // Weg bzw. Gartenweg/Vorplatz kommt an: Lücke im Bordstein (quer q wie armUV: auf der Seite v = q·dx bzw. u = −q·dy)
    const arm = arms.some(a => a[0] === dx && a[1] === dy);
    // schmaler Weg (oder Rathaus) daneben, und auf einer Hälfte der Kante ist auch quer daneben Weg: dort füllt der Nachbar
    // seine Ecke ganz (pathQuads) – kein Bordstein-Stück mitten in die Fläche (Block 100)
    const nb = near(dx, dy), nbFills = arm && quadPaved(x + dx, y + dy) && !(nb && nb.bridge);   // Trittsteine/Brücke füllen keine Ecken
    const halves = nbFills ? [-1, 1].filter(s => quadPaved(x + (dx ? 0 : s), y + (dx ? s : 0)) && quadPaved(x + dx + (dx ? 0 : s), y + dy + (dx ? s : 0)))
      .map(s => s < 0 ? [-0.5, 0] : [0, 0.5]) : [];
    const gaps = (arm ? [[-ROAD_W, ROAD_W]] : []).concat(halves, stubs.filter(s => s.d[0] === dx && s.d[1] === dy)
      .map(s => (dx ? [s.q0 * dx, s.q1 * dx] : [-s.q1 * dy, -s.q0 * dy]).sort((p, q) => p - q))).sort((p, q) => p[0] - q[0]), e0 = 0.5 - WIDE_CURB;
    const seg = (s0, s1) => dx ? rect(dx > 0 ? e0 : -0.5, dx > 0 ? 0.5 : -e0, s0, s1) : rect(s0, s1, dy > 0 ? e0 : -0.5, dy > 0 ? 0.5 : -e0);
    let at = -0.5;
    for (const [g0, g1] of gaps) { if (g0 > at) seg(at, g0); at = Math.max(at, g1); }
    if (at < 0.5) seg(at, 0.5);
  }
  if (lk.glow) glowQuad([L([-0.15, -0.15]), L([0.15, -0.15]), L([0.15, 0.15]), L([-0.15, 0.15])], 26 * z, 'blue');
}
// Überlapp zum Nachbarfeld in Feldeinheiten: etwa 1 Gerätepunkt, wie weit auch rausgezoomt (Block 125c)
function seamPad(L) {
  const a = L([0, 0]), b = L([1, 0]), tr = g.getTransform ? g.getTransform() : null, ds = tr ? Math.hypot(tr.a, tr.b) : 1;
  const px = Math.hypot(b[0] - a[0], b[1] - a[1]) * ds;                  // Gerätepunkte je Feld
  return px > 0 ? Math.min(0.08, 1.2 / px) : 0;
}
// Punkte auf der Feldkante (|u| bzw. |v| = 0,5) um d nach außen – dort geht der Weg im Nachbarfeld weiter
const padBorder = (sh, d) => d ? sh.map(([u, v]) => [u > 0.499 ? u + d : u < -0.499 ? u - d : u, v > 0.499 ? v + d : v < -0.499 ? v - d : v]) : sh;
function drawPath(cx, cy, z, x, y, t) {
  if (isWegBridge(t)) { drawWegBridge(cx, cy, z, x, y, t); return; }    // Block 66
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const st = styleDef('weg', t && t.style), lk = pathLook(st.id);
  const arms0 = pathArms(x, y), arms = arms0.concat(pathEnds(x, y, t, arms0));   // Enden bis ans Gebäude bzw. an den Rand (Block 77)
  if (lk.stones) {                                                                       // Trittsteine; zu Vorplätzen ein Stein mehr (Block 91)
    drawStones(L, arms, t, x, y, z);
    for (const s of courtLinksAt(x, y)) { const q = L(armUV(s.d, 0.375, (s.q0 + s.q1) / 2)); ellipse(q[0], q[1] + 0.8 * z, 6 * z, 3.1 * z, C('#aaa498')); ellipse(q[0], q[1], 6 * z, 3.1 * z, C('#d9d4c9')); }
    return;
  }
  // Gartenwege der Nachbarhäuser (Block 78c) und Vorplätze (Block 91): ihr Stück auf diesem Feld gehört zum Weg – ein Guss,
  // ohne Bordstein davor
  const stubs = courtLinksAt(x, y);
  if (t && t.wide && !t.cross) { drawWidePath(L, lk, x, y, z, arms0, stubs); return; }
  const quads = pathQuads(x, y);
  const flares = pathFlares(x, y);
  // Rand nur dort, wo das Stück nicht am Nachbarfeld weitergeht (sonst malt der Rand eine Linie über dessen Belag)
  const stubPolys = w => stubs.map(s => { const e = w > ROAD_W ? COURT_CURB : 0, q0 = s.q0 > -0.49 ? s.q0 - e : s.q0, q1 = s.q1 < 0.49 ? s.q1 + e : s.q1; return [[0, q0], [0.5, q0], [0.5, q1], [0, q1]].map(([a, bq]) => armUV(s.d, a, bq)); });
  const shapes = w => { const lf = lineFill(x, y, arms, w); return roadShapes(arms, t, w, quads, flares, !!lf.sides || !!(t && t.sq)).concat(lf, stubPolys(w)); };
  // Kanten, an denen das Feld weitergeht, ~1 Gerätepunkt ins Nachbarfeld (Block 125c): am PC (Windows-Chrome, 100–125 %) ließ die
  // Kantenglättung zweier Nachbarfelder einen Hauch Spalt – weit weg sah man auf glatten Plätzen jede Feldgrenze als Linie
  const pad = seamPad(L);
  for (const [w, col] of [[EDGE_W, lk.edge], [ROAD_W, lk.fill]]) {
    for (const sh of shapes(w)) poly(padBorder(sh, pad).map(L), C(col));
  }
  // Fuge zwischen zwei Wegfeldern (Block 116): beide Kanten sind nur halb deckend, das Gras darunter schimmerte als grüner Saum
  // durch – die Fläche hauchdünn in Belagfarbe nachziehen, damit sich Nachbarfelder überlappen
  g.strokeStyle = C(lk.fill); g.lineWidth = 0.6; g.lineJoin = 'round';
  g.beginPath(); for (const sh of shapes(ROAD_W)) { sh.map(L).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); } g.stroke();
  if (lk.pat) {
    // Muster 2 % über die Feldkante (Block 125): die geglätteten Kanten zweier Nachbarfelder decken sich sonst nicht ganz, und der
    // helle Belag schimmert als feine Linie durch (Regenbogen); die Muster liegen im Weltraster, also deckungsgleich
    const grow = sh => sh.map(([u, v]) => [u * 1.02, v * 1.02]);
    g.save(); clipTo(shapes(ROAD_W).map(sh => padBorder(grow(sh), pad)), L); patSeam = true;
    try { pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); }
  }
  if (lk.glow) glowQuad([L([-0.15, -0.15]), L([0.15, -0.15]), L([0.15, 0.15]), L([-0.15, 0.15])], 26 * z, 'blue');
  const cl = roadCenterline(arms, t);
  if (lk.dash && cl && !pathQuads(x, y, false).length) {              // Ecken am Rathaus sind keine breite Straße
    g.strokeStyle = C('#f4efe2'); g.lineWidth = 1.2 * z; g.lineCap = 'round';
    g.setLineDash([2.5 * z, 3 * z]);
    g.beginPath();
    cl.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
    g.stroke();
    g.setLineDash([]);
  }
}

// ---------------------------------------------------------------------------
// Große Gebäude (mehrere Felder): Quader über einem Rechteck, Walmdach
// ---------------------------------------------------------------------------
function boxR(cx, cy, z, hu, hv, h, wall, roof, roofH) {
  const P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up];
  const L = P(-hu, hv), B = P(hu, hv), R = P(hu, -hv), Tp = P(-hu, -hv);
  poly([L, B, [B[0], B[1] - h], [L[0], L[1] - h]], C(wall));
  poly([B, R, [R[0], R[1] - h], [B[0], B[1] - h]], C(shade(wall, LIGHT.side)));
  if (roof) {
    const o = 1.12, eu = hu * o, ev = hv * o;
    const lt = P(-eu, ev, h), bt = P(eu, ev, h), rt = P(eu, -ev, h), tt = P(-eu, -ev, h);
    if (hu >= hv) {
      const r1 = P(-(eu - ev), 0, h + roofH), r2 = P(eu - ev, 0, h + roofH);
      poly([tt, rt, r2, r1], C(shade(roof, LIGHT.roofBack)));
      poly([lt, tt, r1], C(shade(roof, LIGHT.roofSun)));
      poly([lt, bt, r2, r1], C(roof));
      poly([bt, rt, r2], C(shade(roof, LIGHT.roofShade)));
    } else {
      const r1 = P(0, -(ev - eu), h + roofH), r2 = P(0, ev - eu, h + roofH);
      poly([rt, tt, r1], C(shade(roof, LIGHT.roofBack)));
      poly([tt, lt, r2, r1], C(shade(roof, LIGHT.roofSun)));
      poly([lt, bt, r2], C(roof));
      poly([bt, rt, r1, r2], C(shade(roof, LIGHT.roofShade)));
    }
  } else {
    poly([P(-hu, hv, h), P(hu, hv, h), P(hu, -hv, h), P(-hu, -hv, h)], C(shade(wall, 0.08)));
  }
  return { L, B, R, T: Tp, h, P };
}
// vordere lange und kurze Seite eines Quaders
const longFace = (bx, hu, hv) => hu >= hv ? [bx.L, bx.B] : [bx.B, bx.R];
const shortFace = (bx, hu, hv) => hu >= hv ? [bx.B, bx.R] : [bx.L, bx.B];
function windowsOn(face, n, h, z, from = 0.08, to = 0.92, h0 = 0.35, h1 = 0.72) {
  const step = (to - from) / n;
  for (let i = 0; i < n; i++) windowOn(face[0], face[1], from + step * (i + 0.2), from + step * (i + 0.8), h * h0, h * h1, z);
}
function groundRect(cx, cy, z, hu, hv, fill, pat, x, y) {
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const sq = [[-hu, -hv], [hu, -hv], [hu, hv], [-hu, hv]];
  poly(sq.map(L), C(fill));
  if (pat) { g.save(); clipTo([sq], L); pattern(L, pat[0], x, y, z, pat[1] && C(pat[1]), pat[2], 0, null, fill); g.restore(); }
  return L;
}
const RH_ROOF = 10;                                     // Rathausdach bis zum Plateau unter dem Uhrturm (Block 88c, flacher: 88d)
const BIG_ART = {
  // Rathaus (3×3): großes Haus mit Uhrturm hinten, davor ein kleiner Platz mit Treppe, Laternen, Brunnen und Fahne
  rathaus(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const K = kit(cx, cy, z, t.rot), E = 1.47;
    if (groundPart(() => {
      courtFloor(K, t, x, y, () => {                                                      // Platz (Block 91: im Belag des Wegs davor)
        K.rect(-E, -E, E, E, C('#e6dfd0'));
        g.save(); clipTo([[[-E, -E], [E, -E], [E, E], [-E, E]]], p => K.P(p[0], p[1]));
        pattern(p => K.P(p[0] * 1.8, p[1] * 1.8), 'tiles', x, y, z, C('#d6ccb9'), null, 0, null, '#e6dfd0');
        g.restore();
        K.rect(0.35, -0.28, E, 0.28, C('#efe8da'));                                      // heller Weg zur Tür
      });
      for (const [a, b] of [[-1.3, 1.3], [-1.3, -1.3]]) K.rect(a - 0.12, b - 0.12, a + 0.12, b + 0.12, C('#86c35b'));   // Beete hinten
    })) return;
    const [wall, roof] = paint(t, '#fff1d6', '#6f8fd8');
    const hall = () => {
      const B = K.block({ a: -0.45, ha: 0.85, hb: 1.1, h: 26, wall, type: 'none', entry: true });
      K.door(B, 'front', 0.44, 0.56, 0.5);
      K.wins(B, 'front', 6, 0.36, 0.7, 0.04, 0.96, [2, 3]);
      K.sideWins(B, 3, 0.36, 0.7);
      // Walmdach mit flacher Spitze (Block 88c): die Dachflächen laufen auf ein Plateau so groß wie der Uhrturm zu – der Turm
      // steht bündig darauf, statt im spitzen Dach zu stecken
      const top = 26, TW2 = 0.2, ea = 0.85 * 1.12, eb = 1.1 * 1.12, up = top + RH_ROOF;
      const lo = (sa, sb) => K.P(-0.45 + sa * ea, sb * eb, top), hi = (sa, sb) => K.P(-0.45 + sa * TW2, sb * TW2, up);
      const slopes = [[[lo(1, -1), lo(1, 1), hi(1, 1), hi(1, -1)], [1, 0]], [[lo(1, 1), lo(-1, 1), hi(-1, 1), hi(1, 1)], [0, 1]],
        [[lo(-1, 1), lo(-1, -1), hi(-1, -1), hi(-1, 1)], [-1, 0]], [[lo(-1, -1), lo(1, -1), hi(1, -1), hi(-1, -1)], [0, -1]]];
      for (const back of [true, false]) for (const [pts, n] of slopes) if ((K.facing(...n) < 0) === back) poly(pts, K.roofCol(roof, n));
      const T2 = K.block({ a: -0.45, ha: TW2, hb: TW2, h: 19, lift: up, wall, roof: '#e8705f', roofH: 12 });   // bündig auf dem Plateau (88d–f)
      const ck = clockNow(), hr = (ck.getHours() % 12 + ck.getMinutes() / 60) / 6 * Math.PI, mi = ck.getMinutes() / 30 * Math.PI;   // Spielzeit (Block 101)
      for (const F of [T2.faces.front, T2.faces.right, T2.faces.left, T2.faces.back]) if (F) faceClock(F, 0.5, F.H * 0.66, 4.6 * z, z, { hands: [[hr, 0.52, 1], [mi, 0.74, 0.9]] });   // auf jeder Turmseite, die man sieht (oben)
    };
    const steps = () => K.block({ a: 0.5, ha: 0.1, hb: 0.3, h: 1.6, wall: '#d6ccb9', type: 'flat', roof: '#efe8da' });
    const lamp = b => () => { const [lx, ly] = K.P(0.95, b); lampPost(lx, ly, z, 15); };
    const fountain = () => {
      const [fx, fy] = K.P(1.05, 0.95);
      ellipse(fx, fy + 1 * z, 9 * z, 4.4 * z, C('#c9c1b1'));
      ellipse(fx, fy - 0.5 * z, 7.6 * z, 3.6 * z, C('#74d0e6'));
      ellipse(fx - 2 * z, fy - 1.2 * z, 2.6 * z, 1 * z, C('#b8ecf6'));
      const jet = 7 + Math.sin(now / 300) * 0.8;
      g.strokeStyle = C('#b8ecf6'); g.lineWidth = 1.4 * z;
      g.beginPath(); g.moveTo(fx, fy - 1 * z); g.lineTo(fx, fy - jet * z); g.stroke();
      circle(fx, fy - jet * z, 1.4 * z, C('#e6f8fc'));
    };
    const flag = () => { const [fx, fy] = K.P(1.15, -1.1); drawFlag(fx, fy, z * 1.35, now, state.town); };
    // Briefkasten (Block 96): Päckchen von Freunden – das rote Fähnchen steht hoch, wenn etwas drin ist
    const post = typeof mailWaiting === 'function' && mailWaiting() && x < 1e5;
    const mailbox = () => {
      kPost(K, 1.3, -0.72, 7, '#8a5a3c', 1.3);
      K.block({ a: 1.3, b: -0.72, ha: 0.05, hb: 0.08, h: 4.5, lift: 7, wall: '#5f8fe8', type: 'barrel', roof: '#7aa6f0', roofH: 2.5, ridge: 'b' });
      const [px, py] = K.P(1.3, -0.62, 9), zz = K.z;
      kLine(K, [px, py], post ? [px, py - 6 * zz] : [px + 5 * zz, py], '#8a5a3c', 0.8);
      poly(post ? [[px, py - 6 * zz], [px + 3.5 * zz, py - 5 * zz], [px, py - 4 * zz]] : [[px + 5 * zz, py], [px + 4 * zz, py - 3 * zz], [px + 3 * zz, py]], C('#e8604f'));
    };
    const P = state.partner;                                              // Partnerstadt (Block 105): zweite, kleinere Fahne
    const pflag = () => { const [fx, fy] = K.P(1.38, -1.38); drawFlag(fx, fy, z * 1.05, now + 700, { color: P.c, symbol: P.s }); };   // neben der eigenen Fahne
    K.scene([[-0.45, 0, hall], [0.5, 0, steps], [0.95, -0.55, lamp(-0.55)], [0.95, 0.55, lamp(0.55)], [1.05, 0.95, fountain], [1.15, -1.1, flag], [1.3, -0.72, mailbox],
      [-1.3, 1.3, () => kitBush(K, -1.3, 1.3, 0.9)], [-1.3, -1.3, () => kitBush(K, -1.3, -1.3, 0.8, '#62b85a')], [1.25, 1.35, () => kitBush(K, 1.3, 1.35, 0.7, '#f28cb1')],
      ...(P ? [[1.38, -1.38, pflag]] : [])]);
  },

};

// ---------------------------------------------------------------------------
// Häuser in fünf Stufen – jede sichtbar schöner als die davor:
// Häuschen · Fachwerkhaus · Reetdachhaus mit Garten · Stadthaus mit Balkon · Villa mit Veranda und Garten.
// Aussehen wählbar (t.look) aus allen Stufen, die das Haus schon erreicht hat.
// ---------------------------------------------------------------------------
function flowerBox(P, Q, t0, t1, h, z) {
  faceQuad(P, Q, t0 - 0.03, t1 + 0.03, h - 1.6 * z, h, C('#8a5a3c'));
  const a = lerp(P, Q, t0), b = lerp(P, Q, t1);
  for (let i = 0; i < 4; i++) {
    const m = lerp(a, b, (i + 0.5) / 4);
    circle(m[0], m[1] - h - 1.2 * z, 1.4 * z, C(['#ff8fb1', '#fff27a', '#ffffff', '#c49bff'][i]));
  }
}
const houseLook = t => { const lvl = Math.min((t && t.lvl) || 1, HOUSE_STAGES.length); return t && t.look >= 1 && t.look <= lvl ? t.look : lvl; };
function kShadow(K, r) { const [x, y] = K.P(0, 0); ellipse(x, y + 1 * K.z, r * TW * K.z, r * TH * K.z, 'rgba(40,60,20,0.15)'); }
// Fachwerk: Balken auf allen sichtbaren Wänden
function timber(B, z, col = '#7a5236') {
  g.strokeStyle = C(col); g.lineWidth = 1.1 * z; g.lineCap = 'round';
  for (const F of Object.values(B.faces)) {
    if (!F) continue;
    const up = (p, h) => [p[0], p[1] - h];
    g.beginPath();
    for (const tt of [0.02, 0.5, 0.98]) { const m = lerp(F.P, F.Q, tt); g.moveTo(...m); g.lineTo(...up(m, F.H)); }
    g.moveTo(...up(F.P, F.H * 0.5)); g.lineTo(...up(F.Q, F.H * 0.5));
    g.moveTo(...up(F.P, F.H * 0.5)); g.lineTo(...up(lerp(F.P, F.Q, 0.25), F.H));
    g.moveTo(...up(F.Q, F.H * 0.5)); g.lineTo(...up(lerp(F.P, F.Q, 0.75), F.H));
    g.stroke();
  }
}
function gableWindow(K, B, roofH) {
  if (!B.faces.front) return;
  const [x, y] = K.P(B.a + B.ha, B.b, B.lift + B.h + roofH * 0.38);
  const lit = night > 0.15 && isLive();
  circle(x, y, 2.4 * K.z, C('#fff6e4'));
  circle(x, y, 1.7 * K.z, lit ? '#ffd873' : C('#a8dcff'));
  glowQuad([[x - 2, y - 2], [x + 2, y - 2], [x + 2, y + 2], [x - 2, y + 2]], 12 * K.z);
}
// Fenster wie früher: eines pro Seite (breit), auf allen sichtbaren Seiten außer der Tür-Seite
function houseWins(K, B, spots, h0 = 0.35, h1 = 0.72, box = false) {
  for (const side of ['right', 'left', 'back']) {
    const F = B.faces[side];
    if (!F) continue;
    for (const [t0, t1] of spots) { windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, K.z); if (box) flowerBox(F.P, F.Q, t0, t1, F.H * h0, K.z); }
  }
}
const HOUSE_ART = [
  // 1 Häuschen
  (K, wall, roof) => {
    kShadow(K, 0.28);
    const B = K.block({ ha: 0.25, hb: 0.25, h: 13, wall, roof, roofH: 12, over: 1.18, entry: true });
    K.door(B);
    houseWins(K, B, [[0.32, 0.62]]);
  },
  // 2 Fachwerkhaus mit Blumenkasten
  (K, wall, roof) => {
    kShadow(K, 0.3);
    const B = K.block({ ha: 0.27, hb: 0.27, h: 17, wall, roof, roofH: 13, over: 1.18, entry: true });
    timber(B, K.z);
    K.door(B, 'front', 0.4, 0.62, 0.5);
    houseWins(K, B, [[0.28, 0.46]], 0.2, 0.42);
    houseWins(K, B, [[0.58, 0.76]], 0.62, 0.86, true);
  },
  // 3 Reetdachhaus mit Garten
  (K, wall, roof, now) => {
    const z = K.z, [cx, cy] = K.P(0, 0), hw = TW / 2 * z, hh = TH / 2 * z;
    if (groundPart(() => ellipse(cx, cy + 2 * z, hw * 0.8, hh * 0.8, C('#86c35b')))) return;
    for (let i = 0; i < 7; i++) {
      const an = Math.PI * (0.15 + i * 0.12), gx = cx + Math.cos(an) * hw * 0.78, gy = cy + Math.sin(an) * hh * 0.78;
      circle(gx, gy - 2 * z, 2.6 * z, C('#5aa84f'));
      if (i % 2) circle(gx, gy - 3.5 * z, 1.3 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
    }
    kShadow(K, 0.29);
    const reet = mix(roof, '#c9a25a', 0.3);          // Reetdach in der gewählten Dachfarbe, mit etwas Stroh
    const B = K.block({ ha: 0.26, hb: 0.26, h: 13, wall, roof: reet, roofH: 19, over: 1.18, entry: true });
    K.door(B);
    houseWins(K, B, [[0.32, 0.62]]);
    const top = K.P(0, 0, 13 + 17);
    circle(top[0] - 1 * z, top[1], 1.3 * z, C(shade(reet, -0.2)));
    kitChimney(K, 0.1, -0.12, 13 + 6, now);
  },
  // 4 Stadthaus mit Balkon
  (K, wall, roof) => {
    kShadow(K, 0.32);
    const B = K.block({ ha: 0.26, hb: 0.26, h: 27, wall, roof, roofH: 8, over: 1.18, entry: true });
    K.door(B, 'front', 0.4, 0.62, 0.45);
    houseWins(K, B, [[0.15, 0.4], [0.6, 0.85]], 0.12, 0.36);
    houseWins(K, B, [[0.15, 0.4], [0.6, 0.85]], 0.58, 0.82);
    const F = B.faces.front || B.faces.right || B.faces.left, z = K.z;
    if (B.faces.front) { windowOn(F.P, F.Q, 0.15, 0.3, F.H * 0.12, F.H * 0.36, z); windowOn(F.P, F.Q, 0.15, 0.4, F.H * 0.58, F.H * 0.82, z); windowOn(F.P, F.Q, 0.6, 0.85, F.H * 0.58, F.H * 0.82, z); }
    // Balkon mit Geländer und Pflanze
    faceQuad(F.P, F.Q, 0.3, 0.7, F.H * 0.52, F.H * 0.56, C('#8a5a3c'));
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
    g.beginPath();
    for (let i = 0; i <= 6; i++) { const m = lerp(F.P, F.Q, 0.3 + i * 0.4 / 6); g.moveTo(m[0], m[1] - F.H * 0.56); g.lineTo(m[0], m[1] - F.H * 0.66); }
    const a = lerp(F.P, F.Q, 0.3), b = lerp(F.P, F.Q, 0.7);
    g.moveTo(a[0], a[1] - F.H * 0.66); g.lineTo(b[0], b[1] - F.H * 0.66);
    g.stroke();
    const pl = lerp(F.P, F.Q, 0.36);
    circle(pl[0], pl[1] - F.H * 0.6, 1.8 * z, C('#58b36a'));
  },
  // 5 Villa: breiter, mit Vorbau, Vordach und rundem Garten
  (K, wall, roof, now, x, y) => {
    const z = K.z;
    if (groundPart(() => K.oval(0, 0, 0.5, C('#8ccb67')))) return;
    const main = () => {
      kShadow(K, 0.4);
      const B = K.block({ ha: 0.24, hb: 0.34, h: 22, wall, roof, roofH: 12, over: 1.15 });
      houseWins(K, B, [[0.2, 0.42], [0.58, 0.8]], 0.12, 0.38);
      houseWins(K, B, [[0.2, 0.42], [0.58, 0.8]], 0.58, 0.84);
      const F = B.faces.front;
      if (F) for (const [t0, t1] of [[0.08, 0.26], [0.74, 0.92]]) { windowOn(F.P, F.Q, t0, t1, F.H * 0.12, F.H * 0.38, z); windowOn(F.P, F.Q, t0, t1, F.H * 0.58, F.H * 0.84, z); flowerBox(F.P, F.Q, t0, t1, F.H * 0.58, z); }
      kitChimney(K, -0.08, 0.2, 22 + 7, now);
    };
    const bay = () => {
      const B = K.block({ a: 0.29, ha: 0.07, hb: 0.13, h: 22, wall, roof, roofH: 10, over: 1.15, entry: true });
      K.door(B, 'front', 0.3, 0.7, 0.42);
      K.wins(B, 'front', 1, 0.58, 0.84, 0.25, 0.75);
    };
    const porch = () => {
      for (const b of [-0.12, 0.12]) K.block({ a: 0.42, b, ha: 0.018, hb: 0.018, h: 10, wall: '#fff6e4', type: 'flat' });
      K.block({ a: 0.4, ha: 0.06, hb: 0.15, h: 1.6, lift: 10, wall: shade(roof, -0.1), type: 'flat', roof: shade(roof, 0.08) });
    };
    K.scene([
      [-0.34, -0.3, () => kitTree(K, -0.34, -0.3, 0.7)],
      [-0.3, 0.36, () => kitBush(K, -0.3, 0.36, 1)],
      [0, 0, main], [0.3, 0, bay], [0.42, 0, porch],
      [0.4, -0.3, () => kitBush(K, 0.4, -0.3, 0.8)], [0.4, 0.3, () => kitBush(K, 0.4, 0.3, 0.8)],
    ]);
  },
  // 6 Glasvilla: zwei Kuben mit großen Glasfronten und Flachdach, davor Holzdeck mit kleinem Pool
  (K, wall, roof, now) => {
    const z = K.z;
    if (groundPart(() => {
      K.oval(0, 0, 0.5, C('#8ccb67'));
      K.rect(0.18, -0.44, 0.46, 0.4, C('#d9b98f'));                       // Holzdeck
      K.rect(0.24, -0.36, 0.42, 0.08, C('#f3efe6'));                      // Poolrand
      K.rect(0.265, -0.335, 0.395, 0.055, C('#7fd3ea'));                  // Wasser
      const w = Math.sin(now / 900) * 0.03;
      K.rect(0.3 + w, -0.28, 0.33 + w, -0.05, 'rgba(255,255,255,0.45)');
    })) return;
    { const [px, py] = K.P(0.33, -0.14); glowQuad([[px - 3 * z, py - 1 * z], [px + 3 * z, py - 1 * z], [px + 3 * z, py + 1 * z], [px - 3 * z, py + 1 * z]], 16 * z, 'blue'); }
    const lit = night > 0.15 && isLive();
    // Glasfront über fast die ganze Wand, feine helle Sprossen, tags schräge Spiegelungen
    const glass = (B, n, h0, h1) => {
      for (const F of Object.values(B.faces)) {
        if (!F) continue;
        faceQuad(F.P, F.Q, 0.06, 0.94, F.H * h0, F.H * h1, lit ? '#ffd873' : C('#a8dcff'));
        if (lit) {                        // Licht aus der Mitte der Scheiben, damit die Sprossen sichtbar bleiben
          const m0 = lerp(F.P, F.Q, 0.2), m1 = lerp(F.P, F.Q, 0.8), hm0 = F.H * (h0 + (h1 - h0) * 0.25), hm1 = F.H * (h1 - (h1 - h0) * 0.25);
          glowQuad([[m0[0], m0[1] - hm0], [m1[0], m1[1] - hm0], [m1[0], m1[1] - hm1], [m0[0], m0[1] - hm1]], 13 * z);
        } else {
          g.fillStyle = 'rgba(255,255,255,0.35)';
          for (const t0 of [0.16, 0.58]) {
            const a0 = lerp(F.P, F.Q, t0), a1 = lerp(F.P, F.Q, t0 + 0.07), b0 = lerp(F.P, F.Q, t0 + 0.13), b1 = lerp(F.P, F.Q, t0 + 0.2);
            g.beginPath(); g.moveTo(a0[0], a0[1] - F.H * h0); g.lineTo(a1[0], a1[1] - F.H * h0);
            g.lineTo(b1[0], b1[1] - F.H * h1); g.lineTo(b0[0], b0[1] - F.H * h1); g.closePath(); g.fill();
          }
        }
        g.strokeStyle = C('#f7f5f0'); g.lineWidth = 1 * z; g.lineCap = 'butt';
        g.beginPath();
        for (let i = 1; i < n; i++) { const m = lerp(F.P, F.Q, 0.06 + 0.88 * i / n); g.moveTo(m[0], m[1] - F.H * h0); g.lineTo(m[0], m[1] - F.H * h1); }
        g.stroke();
      }
    };
    const house = () => {
      kShadow(K, 0.42);
      const low = K.block({ a: -0.08, ha: 0.25, hb: 0.37, h: 12, wall: '#f7f5f0', type: 'flat', roof: '#e8e4dc', trim: roof });
      glass(low, 4, 0.1, 0.86);
      const up = K.block({ a: -0.15, b: 0.1, ha: 0.2, hb: 0.26, h: 10, lift: 12, wall, type: 'flat', roof: '#e8e4dc', trim: roof });
      glass(up, 3, 0.18, 0.8);
    };
    K.scene([
      [-0.36, -0.34, () => kitTree(K, -0.36, -0.34, 0.75)],
      [0, 0, house],
      [0.2, 0.36, () => kitBush(K, 0.22, 0.38, 0.8)], [-0.3, 0.42, () => kitBush(K, -0.3, 0.42, 0.9)],
    ]);
  },
];
function drawHouse(cx, cy, z, now, x, y, lvl, t) {
  const wall = WALLS[t && t.wall != null ? t.wall : Math.floor(hash(x, y, 3) * 7)];
  const roof = ROOFS[t && t.roof != null ? t.roof : Math.floor(hash(x, y, 4) * 7)];
  const look = houseLook({ lvl, look: t && t.look });
  HOUSE_ART[look - 1](kit(cx, cy, z, t && t.rot), wall, roof, now, x, y);
}

// Tür und Fenster je nach Drehung: 0 = Tür rechts vorn, 1 = Tür links vorn, 2/3 = Tür hinten (unsichtbar)
function doorWin(bx, h, z, rot, wins = [[0.32, 0.62]], doorH = 1) {
  const left = [bx.L, bx.B], right = [bx.B, bx.R], r = (rot || 0) & 3;
  const doorFace = r === 0 ? right : r === 1 ? left : null;
  const winFaces = r === 0 ? [left] : r === 1 ? [right] : [left, right];
  if (doorFace) door(doorFace[0], doorFace[1], h * doorH);
  for (const f of winFaces) for (const [a, b] of wins) windowOn(f[0], f[1], a, b, h * 0.35, h * 0.72, z);
}
// Kleine unregelmäßige Dekos werden bei ungerader Drehung gespiegelt; Gebäude drehen im Baukasten selbst
const MIRROR = new Set();                 // (die Bank dreht sich seit Block 42 selbst in 4 Richtungen)
// Bogen mit Schild zwischen zwei Tortürmen (Block 60f) – gezeichnet vom Turm, der später drankommt (der vordere)
function drawTorArch(cx, cy, z, x, y, t, H, now) {
  const o = TOR_PAIR.get(x + ',' + y);
  if (!o) return;
  const [ox, oy] = keyXY(o);
  if (ox + oy > x + y || (ox + oy === x + y && ox > x)) return;            // der andere Turm zeichnet
  const ot = state.tiles.get(o), oH = ITEMS.fz_torturm ? 22 + ((ot && ot.fl) || 2) * 8 : H, top = Math.min(H, oH), lit = night > 0.15 && isLive();
  const S = (u, v, up) => [cx + ((u - x) - (v - y)) * TW / 2 * z, cy + ((u - x) + (v - y)) * TH / 2 * z - up * z];
  const dx = Math.sign(x - ox), dy = Math.sign(y - oy), span = Math.abs(x - ox) + Math.abs(y - oy) - 0.6, rise = 6 + span * 2.5, pts = [];
  for (let i = 0; i <= 20; i++) { const f = i / 20, d = 0.3 + span * f; pts.push(S(ox + dx * d, oy + dy * d, top - 8 + Math.sin(f * Math.PI) * rise)); }
  g.lineCap = 'round';
  g.strokeStyle = C('#c9962b'); g.lineWidth = 4.2 * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  g.strokeStyle = C('#f2c14e'); g.lineWidth = 2.6 * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  const s0 = S(ox + dx * (0.3 + span * 0.12), oy + dy * (0.3 + span * 0.12), top - 15), s1 = S(ox + dx * (0.3 + span * 0.88), oy + dy * (0.3 + span * 0.88), top - 15), Hs = 10 * z;
  poly([[s0[0], s0[1]], [s1[0], s1[1]], [s1[0], s1[1] - Hs], [s0[0], s0[1] - Hs]], C(fzCol(t, 'roof', '#f7b2c8')));
  g.strokeStyle = C('#fffaf0'); g.lineWidth = 1 * z; g.beginPath(); g.moveTo(s0[0], s0[1] - 1 * z); g.lineTo(s1[0], s1[1] - 1 * z); g.moveTo(s0[0], s0[1] - Hs + 1 * z); g.lineTo(s1[0], s1[1] - Hs + 1 * z); g.stroke();
  const n = Math.max(5, Math.round(span * 3));
  for (let i = 0; i < n; i++) { const m = lerp(s0, s1, (i + 0.5) / n); circle(m[0], m[1] - Hs / 2, 1.5 * z, lit ? '#fff4a8' : C(['#ffd23f', '#5f8fe8', '#58b36a', '#e8604f', '#b07ad6', '#ffffff'][i % 6])); }
  for (const pp of [s0, s1]) { g.strokeStyle = C('#c9962b'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(pp[0], pp[1] - Hs); g.lineTo(pp[0], pp[1] - Hs - 7 * z); g.stroke(); }
}
// Freizeitpark-Farben (Block 60e): Fassade/Dach aus WALLS/ROOFS, Fenster aus WIN_COLS – sonst die Grundfarbe
const fzCol = (t, kind, def) => !t || t[kind] == null ? def : (kind === 'wall' ? WALLS : kind === 'roof' ? ROOFS : WIN_COLS)[t[kind]] || def;
const ROTATABLE = new Set([...MIRROR, 'bank', 'riesenrad', 'sternwarte', 'seebruecke', 'botgarten', 'schloss', 'holz', 'fischer', 'obst', 'stein', 'mine', 'kristallmine', 'glashaus', 'glashaus_l', 'station', 'hbf', 'haus', 'muehle', 'steinmetz', 'schmiede',
  'rathaus', 'hafen', 'schule', 'uni', 'baecker', 'saege', 'fabrik', 'bibliothek', 'kunst', 'leuchtturm', 'wasserkraft', 'geothermie', 'solarfeld', 'reihenhaus', 'ferienhaus', 'baumhaus', 'hausboot',
  'kaffeeplantage', 'teegarten', 'kakaoplantage', 'fz_schloss', 'fz_zuckerwatte', 'fz_geister', 'fz_wildwasser', 'fz_eis', 'fz_station', ...Object.keys(SHOPS), ...Object.keys(STANDS)]);
let buildRot = 0;
// Deko im Verhältnis zu Häusern: kleine Dinge auch klein zeichnen
const DECO_SCALE = { freundesbank: 0.5, rosenbogen: 0.75, denkmal: 0.8, uhrturm: 0.85, karussell: 0.85, pokal_bronze: 0.6, pokal_silber: 0.6, pokal_gold: 0.6, bank: 0.45, laterne: 0.62, kristallaterne: 0.66, glaskugel: 0.7, kristallbrunnen: 0.72, hecke: 0.5, blumentopf: 0.8, busch: 0.8, brunnen: 0.72, pavillon: 0.8, statue: 0.7, baum: 0.89, blumen: 0.85, windrad: 0.9, offshore: 0.9 };
// Größen (Block 43): das Grundmodell, um vf größer; kleine (Ecke) und Feld-Deko werden verschieden skaliert gezeichnet
function decoScale(b) {
  const d = ITEMS[b];
  if (!d || !d.variantOf) return DECO_SCALE[b] || 1;
  const B = ITEMS[d.variantOf];
  return (DECO_SCALE[d.variantOf] || 1) * (B.small ? 0.9 : 1) * d.vf / (d.small ? 0.9 : 1);
}
// Drehen per ⟳/R (+1) oder Mausrad (±1): ab der Richtung, die man gerade sieht (auch wenn sie automatisch war)
function rotateBuild(dir = 1) {
  if (tool === 'verschieben' && rotateGroup(dir)) { previewCache = null; sfx('deco'); return; }   // ganze Gruppe (Block 117)
  const type = tool === 'verschieben' ? movingType() : tool;
  const cur = hover && type && ITEMS[type] && ROTATABLE.has(type) ? placeRot(type, hover.x, hover.y) : buildRot;
  buildRot = (cur + dir + 4) % 4;
  rotManual = true;
  previewCache = null;
  sfx('deco');
}

const GROUND_TYPES = new Set(['station', 'glashaus', 'glashaus_l', 'hbf', 'riesenrad', 'sternwarte', 'seebruecke', 'botgarten', 'schloss', 'rathaus', 'feld', 'obst', 'stein', 'mine', 'kristallmine', 'hafen', 'schule', 'uni', 'lm', 'solarfeld', 'geothermie']);
const hasGroundPart = t => GROUND_TYPES.has(t.b) || (COURTS[t.b] && !COURTS[t.b].own) || (t.b === 'haus' && [3, 5, 6].includes(houseLook(t)));
// Marktstand (Block 39): Theke mit Waren, gestreifte Markise auf zwei Pfosten, Lichterkette (nachts an)
function drawStand(type, cx, cy, z, now, x, y, t) {
  const S = STANDS[type], K = kit(cx, cy, z, t && t.rot);
  kShadow(K, 0.3);
  const post = (a, b) => kPost(K, a, b, 17, '#8a5a3c', 1.3);
  const back = [post(-0.28, -0.34), post(-0.28, 0.34)];
  // Theke (vorn) mit Stoffbahn in der Markenfarbe
  const T0 = K.block({ a: 0.12, ha: 0.14, hb: 0.36, h: 7, wall: '#e8d2a8', type: 'flat', roof: '#c98d5c' });
  const F = T0.faces.front || T0.faces.right || T0.faces.left;
  if (F) { for (let i = 0; i < 6; i++) faceQuad(F.P, F.Q, i / 6, (i + 1) / 6, F.H * 0.35, F.H * 0.95, C(i & 1 ? '#fbf2e2' : S.awn)); }
  // Waren auf der Theke
  for (let i = 0; i < 7; i++) {
    const b = -0.3 + i * 0.1, a = 0.12 + ((i * 37) % 3 - 1) * 0.05, [gx, gy] = K.P(a, b, 7);
    circle(gx, gy - 1.2 * z, 1.9 * z, C(S.goods[(i + hash(x, y, 3) * 4 | 0) % S.goods.length]));
  }
  kCrate(K, -0.14, 0.3, '#c9955f', 0.8);
  // Markise: schräges Dach über Pfosten und Theke, gestreift
  const front = [K.P(0.3, -0.42, 13), K.P(0.3, 0.42, 13)], rear = [K.P(-0.3, -0.42, 18), K.P(-0.3, 0.42, 18)];
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6, t1 = (i + 1) / 6, L = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    poly([L(rear[0], rear[1], t0), L(rear[0], rear[1], t1), L(front[0], front[1], t1), L(front[0], front[1], t0)], C(i & 1 ? '#fbf2e2' : S.awn));
  }
  for (let i = 0; i < 6; i++) {                                  // Volant vorn
    const f0 = i / 6, f1 = (i + 1) / 6, p0 = [front[0][0] + (front[1][0] - front[0][0]) * f0, front[0][1] + (front[1][1] - front[0][1]) * f0],
      p1 = [front[0][0] + (front[1][0] - front[0][0]) * f1, front[0][1] + (front[1][1] - front[0][1]) * f1];
    poly([p0, p1, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + 2.6 * z]], C(i & 1 ? '#fbf2e2' : S.awn));
  }
  kLine(K, back[0], rear[0], '#8a5a3c', 1.1); kLine(K, back[1], rear[1], '#8a5a3c', 1.1);
  // Lichterkette unter der Markisenkante
  const lit = night > 0.15 && isLive();
  for (let i = 0; i < 5; i++) {
    const f = (i + 0.5) / 5, p = [front[0][0] + (front[1][0] - front[0][0]) * f, front[0][1] + (front[1][1] - front[0][1]) * f + 3.6 * z + Math.sin(f * Math.PI) * 1.5 * z];
    circle(p[0], p[1], 0.9 * z, lit ? '#fff3b0' : C('#f5e6b0'));
    glowQuad([[p[0] - 1, p[1] - 1], [p[0] + 1, p[1] - 1], [p[0] + 1, p[1] + 1], [p[0] - 1, p[1] + 1]], 9 * z);
  }
}
function drawObject(type, cx, cy, z, now, x, y, lvl, t) {
  const rs = t && (t.wall != null || t.roof != null) && repaintOf(type);   // gewählte Farben (Block 72)
  if (!rs) { drawObjectAs(type, cx, cy, z, now, x, y, lvl, t); return; }
  const prev = REPAINT_MAP;
  REPAINT_MAP = repaintMap(rs, t);
  try { drawObjectAs(type, cx, cy, z, now, x, y, lvl, t); } finally { REPAINT_MAP = prev; }
}
// Gartenweg (Block 78): von der Feldkante bis unter die Haustür, schmal, im Stil des Wegs – vor dem Haus gezeichnet (das Haus
// deckt ihn ab). Das Stück auf dem Wegfeld zeichnet der Weg selbst mit (drawPath, Block 78c), sonst läge es obendrauf.
const GP_EDGE = 0.125, GP_FILL = 0.095;
function drawGardenPath(cx, cy, z, x, y, gp) {
  const lk = gp.style ? pathLook(gp.style) : PATH_LOOK.platten, [dx, dy] = gp.d;
  const L = ([a, b]) => { const u = a * dx - b * dy, v = a * dy + b * dx; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z]; };
  if (lk.stones) {                                                                      // Trittstein zur Tür, im Takt des Wegs (Block 91)
    const q = L([0.375, 0]); ellipse(q[0], q[1] + 0.8 * z, 6 * z, 3.1 * z, C('#aaa498')); ellipse(q[0], q[1], 6 * z, 3.1 * z, C('#d9d4c9'));
    return;
  }
  const band = w => [[0.18, -w], [0.5, -w], [0.5, w], [0.18, w]];
  poly(band(GP_EDGE).map(L), C(lk.edge));
  poly(band(GP_FILL).map(L), C(lk.fill));
  if (lk.pat) { g.save(); clipTo([band(GP_FILL)], L); pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); g.restore(); }
}
// Vorplatz bzw. Weg zur Tür (Block 91, Regeln: COURTS in rules.js): flach im Boden-Durchgang, Schatten fallen darauf
const COURT_CURB = GP_EDGE - GP_FILL;
// Wegfelder, in die ein Gartenweg oder Vorplatz der Nachbarn mündet: je { d (vom Wegfeld zum Gebäude), q0, q1 (quer, wie armUV) }
function courtLinksAt(x, y) {
  const out = [];
  for (const [dx, dy] of DIRS) {
    const k = anchorAt(x + dx, y + dy);
    if (!k) continue;
    const t = state.tiles.get(k), [ax, ay] = keyXY(k), gp = gardenPath(t, ax, ay);
    if (gp) { if (gp.d[0] === -dx && gp.d[1] === -dy) out.push({ d: [dx, dy], q0: -GP_FILL, q1: GP_FILL }); continue; }
    const ct = courtOf(t, ax, ay);
    if (ct && ct.d[0] === dx && ct.d[1] === dy) for (const l of ct.links) if (l.x === x && l.y === y) out.push({ d: [dx, dy], q0: l.q0, q1: l.q1 });
  }
  return out;
}
// Belag jedes Stücks von a bis an die Vorderkante A, quer s (Platz bzw. schmaler Weg); vorn ohne Bordstein. Trittsteine nur
// auf schmalen Wegen, Plätze dann in Schachbrett
function paveCourt(K, C0, A, lk, x, y, t) { const open = courtOpenSides(K, t, x, y); for (const c of courtPartsAt(t, x, y)) pavePart(K, c, A, c.band || !lk.stones ? lk : PATH_LOOK.platten, x, y, open); }
// Welche Seiten des Grundstücks sind ganz von Weg umgeben (Block 100)? Dort läuft der Platz bis an die Grenze, ohne
// Bordstein – sonst bliebe zwischen Platz und Wegfläche eine Linie stehen. Rahmen wie kit: a nach vorn, s quer.
function courtOpenSides(K, t, x, y) {
  if (!t || !ITEMS[t.b] || x > 1e5) return null;
  const [w, h] = sizeOf(t.b, t.rot, t), [sa, sb] = ITEMS[t.b].size || [1, 1], HA = sa / 2, HB = sb / 2;
  const mx = x + (w - 1) / 2, my = y + (h - 1) / 2;
  const paved = (a, b) => { const [u, v] = K.turn(a, b); return quadPaved(Math.round(mx + u), Math.round(my + v)); };
  const along = n => Array.from({ length: n }, (_, i) => -n / 2 + 0.5 + i);
  return { HA, HB, mx, my, back: along(sb).every(b => paved(-HA - 0.5, b)), lo: along(sa).every(a => paved(a, -HB - 0.5)), hi: along(sa).every(a => paved(a, HB + 0.5)) };
}
function pavePart(K, { a: a0, s: [s0, s1] }, A, lk, x, y, open = null) {
  let e0 = COURT_CURB, e1 = COURT_CURB;
  const z = K.z;
  if (open && !lk.stones) {                                             // bis an die Grenze, wo ringsum Weg ist
    if (open.lo && s0 <= -open.HB + 0.05) { s0 = -open.HB; e0 = 0; }
    if (open.hi && s1 >= open.HB - 0.05) { s1 = open.HB; e1 = 0; }
    if (open.back && a0 <= -open.HA + 0.05) a0 = -open.HA;
  }
  if (lk.stones) {                                                                      // Trittsteine bis zur Tür
    const m = (s0 + s1) / 2;                                                             // wie am Weg: alle ¼ Feld, gleich groß
    for (let i = 0, a = A - 0.125; i < 4 && a >= a0 - 0.05; i++, a -= 0.25) { const q = K.P(a, m), k = 0.94 + hash(x + i, y, 93) * 0.1; ellipse(q[0], q[1] + 0.8 * z, 6 * k * z, 3.1 * k * z, C('#aaa498')); ellipse(q[0], q[1], 6 * k * z, 3.1 * k * z, C('#d9d4c9')); }
    return;
  }
  K.rect(a0, s0 - e0, A, s1 + e1, C(lk.edge));
  const L = p => K.P(p[0], p[1]);
  g.save(); clipTo([[[a0, s0], [A, s0], [A, s1], [a0, s1]]], L);
  // Muster im Raster der Insel (Block 100): von der Gebäudemitte aus, achsengleich mit der Welt (Drehung zurückrechnen) – sonst
  // liegen die Steine gegen die Wegfläche daneben versetzt
  const r = K.r, Lw = ([u, v]) => K.P(...(r === 0 ? [u, v] : r === 1 ? [v, -u] : r === 2 ? [-u, -v] : [-v, u]));
  if (open) paintLook(Lw, lk, open.mx, open.my, z, false, Math.max(A, s1, -s0) + 0.5);
  else paintLook(L, lk, x, y, z, false, Math.max(A, s1, -s0) + 0.5);
  g.restore();
}
const courtFront = b => (ITEMS[b].size || [1, 1])[0] / 2;
// Gebäude mit eigenem Platz (COURTS[b].own): im Belag des Wegs davor bzw. dem gewählten; sonst classic() wie früher, aus: Wiese
function courtFloor(K, t, x, y, classic) {
  if (t.zug === false) return;
  const st = courtStyle(t, x, y), lk = st && pathLook(st);
  if (!lk || (lk.stones && courtPartsAt(t, x, y).some(c => !c.band))) { if (!COURTS[t.b] || !COURTS[t.b].bare || x > 1e5) classic(); } else paveCourt(K, COURTS[t.b], courtFront(t.b), lk, x, y, t);
}
const courtShown = (t, x, y) => !!courtStyle(t, x, y);                                // für Bilder, die dann anders aussehen (Büsche, Rasen)
function drawObjectAs(type, cx, cy, z, now, x, y, lvl, t) {
  if (PASS === 'ground' && !hasGroundPart(t || { b: type, lvl })) return;
  let span = 1;
  if (ITEMS[type] && ITEMS[type].variantOf) { span = ITEMS[type].span; type = ITEMS[type].variantOf; }   // Größe: Bild des Grundmodells
  const C0 = t && t.b === type && COURTS[type] && !COURTS[type].own ? COURTS[type] : null;   // Vorplatz (Block 91)
  if (C0 && PASS === null) {                                                            // alles auf einmal: Boden, Vorplatz, Gebäude
    PASS = 'ground'; try { drawObjectAs(type, cx, cy, z, now, x, y, lvl, t); } finally { PASS = 'object'; }
    try { drawObjectAs(type, cx, cy, z, now, x, y, lvl, t); } finally { PASS = null; }
    return;
  }
  if (C0 && PASS === 'ground') {
    if (GROUND_TYPES.has(type)) drawBuilding(type, cx, cy, z, now, x, y, lvl, t);     // eigene flache Teile zuerst
    const st = courtStyle(t, x, y), lk = st && pathLook(st);
    if (lk) paveCourt(kit(cx, cy, z, t.rot), C0, courtFront(type), lk, x, y, t);
    return;
  }
  const gp = PASS !== 'ground' && t && t.b === type && gardenPath(t, x, y);
  if (gp) drawGardenPath(cx, cy, z, x, y, gp);
  if (BUILDING_ART[type]) { drawBuilding(type, cx, cy, z, now, x, y, lvl, t); return; }
  if (BIG_ART[type] && !(type === 'leuchtturm' && t && t.mini)) { const [w, h] = sizeOf(type, t && t.rot, t); BIG_ART[type](cx, cy, z, now, x, y, lvl, t || {}, w / 2, h / 2); return; }
  if (STANDS[type]) { drawStand(type, cx, cy, z, now, x, y, t); return; }
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'haus': drawHouse(cx, cy, z, now, x, y, lvl, t); break;
    case 'blumen': {                         // großes Beet (span): mehr Blumen, nicht größere
      diamond(cx, cy, hw * (0.72 + span - 1), hh * (0.72 + span - 1), C('#a8764c'));
      const pts = [];
      for (let i = 0; i < 14 * span * span; i++) {
        const u = (hash(x, y, 100 + i) - 0.5) * (0.62 + span - 1), v = (hash(x, y, 120 + i) - 0.5) * (0.62 + span - 1);
        pts.push([cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z, i]);
      }
      pts.sort((a, b) => a[1] - b[1]);
      for (const [px, py, i] of pts) {
        circle(px, py - 1.5 * z, 2.4 * z, C('#5aa84f'));
        circle(px, py - 3 * z, 2.2 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
      }
      break;
    }
    case 'leuchtturm': {                     // alter 1×1-Leuchtturm (t.mini, Block 83) – das Kap zeichnet BIG_ART.leuchtturm
      const K = kit(cx, cy, z, t && t.rot);
      kShadow(K, 0.24);
      K.rect(-0.25, -0.25, 0.25, 0.25, C('#c9ccd6'));
      const h = 46 * z, a = hw * 0.26, b = hh * 0.26;
      const B = K.block({ ha: 0.13, hb: 0.13, h: 46, wall: '#ffffff', type: 'flat', entry: true });
      for (const F of Object.values(B.faces)) if (F) for (const [h0, h1] of [[0.18, 0.34], [0.52, 0.68]]) faceQuad(F.P, F.Q, 0, 1, h * h0, h * h1, K.wallCol('#e8604f', F.n));
      K.door(B, 'front', 0.3, 0.7, 0.28);
      const top = cy - h;
      const lamp = box(cx, top, a * 0.8, b * 0.8, 8 * z, '#fff3b0', '#e8604f', 7 * z);
      glowQuad([[lamp.L[0], lamp.L[1]], [lamp.B[0], lamp.B[1]], [lamp.B[0], lamp.B[1] - 8 * z], [lamp.L[0], lamp.L[1] - 8 * z]], 60 * z);
      if (night > 0.15 && isLive()) {
        const ang = now / 1400, lx = cx, ly = top - 4 * z, len = 140 * z;
        g.save();
        g.globalCompositeOperation = 'lighter';
        const grd = g.createRadialGradient(lx, ly, 0, lx, ly, len);
        grd.addColorStop(0, 'rgba(255,230,150,0.35)'); grd.addColorStop(1, 'rgba(255,230,150,0)');
        g.fillStyle = grd;
        g.beginPath(); g.moveTo(lx, ly);
        g.lineTo(lx + Math.cos(ang - 0.12) * len, ly + Math.sin(ang - 0.12) * len * 0.5);
        g.lineTo(lx + Math.cos(ang + 0.12) * len, ly + Math.sin(ang + 0.12) * len * 0.5);
        g.closePath(); g.fill();
        g.restore();
      }
      break;
    }
    // --- Verkehr & Strom ---
    case 'offshore': {                       // Offshore-Windrad (Block 48): Pfahl im Wasser, gelbes Übergangsstück, hoher weißer Turm
      const H = 64, L = 25 * z, w0 = 3.6 * z, w1 = 2 * z, ph = now / 900;
      for (let i = 0; i < 2; i++) {                                                       // Wellenring am Pfahl
        const r = ((now / 1400 + i / 2) % 1), a = 0.55 * (1 - r);
        ellipse(cx, cy + 1 * z, (4 + r * 6) * z, (2 + r * 3) * z, `rgba(255,255,255,${a.toFixed(2)})`);
      }
      poly([[cx - 1.8 * z, cy + 1 * z], [cx + 1.8 * z, cy + 1 * z], [cx + 1.8 * z, cy - 5 * z], [cx - 1.8 * z, cy - 5 * z]], C('#4d5360'));   // Pfahl
      poly([[cx, cy + 1 * z], [cx + 1.8 * z, cy + 1 * z], [cx + 1.8 * z, cy - 5 * z], [cx, cy - 5 * z]], C('#3d424d'));
      box(cx, cy - 5 * z, 2.2 * z, 1.2 * z, 4.5 * z, '#f2c230', null, 0);                // Übergangsstück (gelb)
      diamond(cx, cy - 9.5 * z, 5 * z, 2.5 * z, C('#9aa0a8'));                             // Plattform
      g.strokeStyle = C('#f2c230'); g.lineWidth = 0.5 * z; g.beginPath();                 // Geländer
      g.moveTo(cx - 5 * z, cy - 9.5 * z); g.lineTo(cx, cy - 7 * z); g.lineTo(cx + 5 * z, cy - 9.5 * z);
      g.moveTo(cx - 5 * z, cy - 11 * z); g.lineTo(cx, cy - 8.5 * z); g.lineTo(cx + 5 * z, cy - 11 * z); g.stroke();
      poly([[cx - w0 / 2, cy - 9.5 * z], [cx + w0 / 2, cy - 9.5 * z], [cx + w1 / 2, cy - H * z], [cx - w1 / 2, cy - H * z]], C('#f6f6f4'));   // Turm
      poly([[cx, cy - 9.5 * z], [cx + w0 / 2, cy - 9.5 * z], [cx + w1 / 2, cy - H * z], [cx, cy - H * z]], C('#dedbd4'));
      const hy = cy - (H + 1) * z;
      ellipse(cx + 3.4 * z, hy, 6.6 * z, 2.6 * z, C('#f4f4f4')); ellipse(cx + 3.4 * z, hy + 0.9 * z, 6.2 * z, 1.5 * z, C('#dedbd4'));   // Gondel
      blades(cx, hy, z, ph * 650, 3, L, '#ffffff');
      const ang = ph;
      for (let i = 0; i < 3; i++) { const a = ang + i * Math.PI * 2 / 3; circle(cx + Math.cos(a) * (L - 2 * z), hy + Math.sin(a) * (L - 2 * z), 1.3 * z, C('#e8604f')); }
      circle(cx, hy, 2.3 * z, C('#f4f4f4'));
      if (night > 0.15 && isLive() && Math.floor(now / 700) % 2 === 0) {                 // Warnlicht nachts
        circle(cx + 5.5 * z, hy - 2.6 * z, 1.2 * z, '#ff4a3d'); glowQuad([[cx + 4.5 * z, hy - 4 * z], [cx + 6.5 * z, hy - 4 * z], [cx + 6.5 * z, hy - 1 * z], [cx + 4.5 * z, hy - 1 * z]], 12 * z);
      }
      break;
    }
    case 'windrad': {                        // Stufe 1 Windrad, 2 Großes Windrad, 3 Windturbine – alle in gemütlicher Größe
      if (Math.min(lvl || 1, 3) === 3) { drawHelixTurbine(cx, cy, z, now); break; }
      const s = Math.max(1, Math.min(lvl || 1, 3)), H = [38, 46, 50][s - 1], L = [16, 20, 22][s - 1] * z;
      const w0 = [3, 4, 3.8][s - 1] * z, w1 = [3, 2.6, 1.8][s - 1] * z;
      ellipse(cx, cy + 1 * z, (4 + s * 2) * z, (2 + s) * z, 'rgba(40,60,20,0.15)');
      if (s > 1) box(cx, cy, 5 * z, 2.6 * z, 3 * z, '#e3ddd1', null, 0);                   // Sockel
      poly([[cx - w0 / 2, cy], [cx + w0 / 2, cy], [cx + w1 / 2, cy - H * z], [cx - w1 / 2, cy - H * z]], C('#f4f4f4'));
      poly([[cx, cy], [cx + w0 / 2, cy], [cx + w1 / 2, cy - H * z], [cx, cy - H * z]], C('#dedbd4'));
      if (s === 3) {                                                                      // Windturbine: Tür und roter Ring
        poly([[cx - 1.1 * z, cy - 3 * z], [cx + 0.3 * z, cy - 3 * z], [cx + 0.3 * z, cy - 7 * z], [cx - 1.1 * z, cy - 7 * z]], C('#8a8f99'));
        const ry = cy - H * 0.62 * z, rw = w0 + (w1 - w0) * 0.62;
        poly([[cx - rw / 2, ry], [cx + rw / 2, ry], [cx + rw / 2, ry - 2 * z], [cx - rw / 2, ry - 2 * z]], C('#e8604f'));
      }
      const hy = cy - (H + 1) * z;
      if (s === 2) ellipse(cx + 1.5 * z, hy, 4.5 * z, 2.4 * z, C('#e9e6df'));               // Gondel
      if (s === 3) {                                                                      // schlanke, lange Gondel mit Kappe
        ellipse(cx + 3 * z, hy, 6 * z, 2.4 * z, C('#f4f4f4'));
        ellipse(cx + 3 * z, hy + 0.8 * z, 5.6 * z, 1.4 * z, C('#dedbd4'));
      }
      blades(cx, hy, z, now * (s === 3 ? 0.9 : 1.2), 3, L, '#ffffff');
      if (s === 3) {                                                                      // rote Flügelspitzen
        const ang = now * 0.9 / 650;
        for (let i = 0; i < 3; i++) { const a = ang + i * Math.PI * 2 / 3; circle(cx + Math.cos(a) * (L - 2 * z), hy + Math.sin(a) * (L - 2 * z), 1.3 * z, C('#e8604f')); }
      }
      circle(cx, hy, (1.8 + s * 0.3) * z, C(s === 3 ? '#f4f4f4' : '#8a8f99'));
      if (s === 3 && night > 0.15 && isLive() && Math.floor(now / 700) % 2 === 0) {       // Warnlicht nachts
        circle(cx + 5 * z, hy - 2.4 * z, 1.2 * z, '#ff4a3d'); glowQuad([[cx + 4 * z, hy - 4 * z], [cx + 6 * z, hy - 4 * z], [cx + 6 * z, hy - 1 * z], [cx + 4 * z, hy - 1 * z]], 12 * z);
      }
      break;
    }
    // --- Bildung ---
    // --- Deko ---
    case 'weg': drawPath(cx, cy, z, x, y, t); break;
    case 'schiene':
      if (PASS !== 'object') drawRailBed(cx, cy, z, x, y, t);
      if (t && t.cross) drawCrossing(cx, cy, z, x, y, t, now);
      break;
    case 'baum': {                        // Obstbaum; je Ecke eine andere Frucht, damit vier Bäume nicht gleich aussehen
      tree(cx, cy + 2 * z, z * 1.05, 0.9, TREE_FRUIT[treeFruitOf(x, y, t && t.slot || 0)]);
      break;
    }
    case 'blumentopf': {
      ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,60,20,0.15)');
      poly([[cx - 7 * z, cy - 9 * z], [cx + 7 * z, cy - 9 * z], [cx + 5 * z, cy], [cx - 5 * z, cy]], C('#d9825b'));
      ellipse(cx, cy - 9 * z, 7 * z, 2.6 * z, C('#b8663f'));
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, fx = cx + Math.cos(a) * 4 * z, fy = cy - 12 * z + Math.sin(a) * 2 * z;
        circle(fx, fy + 2 * z, 2.6 * z, C('#5aa84f'));
        circle(fx, fy - 1 * z, 2.4 * z, C(FLOWER_COLS[(i + potOf(x, y, t && t.slot || 0)) % FLOWER_COLS.length]));
      }
      break;
    }
    case 'kristall': {
      ellipse(cx, cy + 1 * z, 7 * z, 2.8 * z, 'rgba(40,50,70,0.18)');
      crystal(cx - 4 * z, cy, z, 7 * z, 2.2 * z, -0.3);
      crystal(cx + 4.5 * z, cy + 0.5 * z, z, 6 * z, 2 * z, 0.3);
      crystal(cx, cy + 2 * z, z, 11 * z, 2.8 * z, 0.05);
      break;
    }
    case 'busch': {                                                  // Farbe: t.col (Block 89)
      const [c0, c1, c2, c3] = (BUSH_COLS[(t && t.col) || 0] || BUSH_COLS[0]).c;
      ellipse(cx, cy + 1 * z, 9 * z, 3.5 * z, 'rgba(40,60,20,0.18)');
      circle(cx - 4 * z, cy - 5 * z, 6 * z, C(c0));
      circle(cx + 4 * z, cy - 5 * z, 6 * z, C(c1));
      circle(cx, cy - 9 * z, 6.5 * z, C(c2));
      circle(cx - 2 * z, cy - 11 * z, 2.6 * z, C(c3));
      break;
    }
    case 'palme': {                        // gebogener Stamm in Ringen, Wedel hängen rundum herab, Kokosnüsse
      ellipse(cx, cy + 1 * z, 8 * z, 3 * z, 'rgba(40,60,20,0.18)');
      const tx = cx + 4 * z, ty = cy - 24 * z;
      g.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const a = i / 7, b = (i + 1) / 7;
        g.strokeStyle = C(i % 2 ? '#9b7045' : '#b0835a'); g.lineWidth = (3.4 - 1.4 * a) * z;
        g.beginPath(); g.moveTo(cx + 4 * z * a * a, cy - 24 * z * a); g.lineTo(cx + 4 * z * b * b, cy - 24 * z * b); g.stroke();
      }
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.52 + Math.sin(now / 900 + i) * 0.04, len = 12 * z;
        const ex = tx + Math.cos(a) * len * 1.25, ey = ty + Math.sin(a) * len * 0.5 + 6 * z;
        g.strokeStyle = C(i % 2 ? '#3f9a4a' : '#56b35a'); g.lineWidth = 3 * z;
        g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * len * 0.7, ty + Math.sin(a) * len * 0.45 - 4 * z, ex, ey); g.stroke();
      }
      circle(tx - 1.2 * z, ty + 1.8 * z, 1.7 * z, C('#7a5a34')); circle(tx + 1.3 * z, ty + 2.2 * z, 1.7 * z, C('#6b4c2a'));
      break;
    }
    case 'riesenblume': {                  // hoher Stiel, zwei Blätter, große Blüte (Farbe je Platz)
      ellipse(cx, cy + 1 * z, 7 * z, 2.8 * z, 'rgba(40,60,20,0.18)');
      g.strokeStyle = C('#4f9a45'); g.lineWidth = 1.9 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx - 2 * z, cy - 10 * z, cx + 1 * z, cy - 19 * z); g.stroke();
      poly([[cx - 0.5 * z, cy - 5 * z], [cx - 7 * z, cy - 9 * z], [cx - 1 * z, cy - 8.5 * z]], C('#5aae54'));
      poly([[cx, cy - 9 * z], [cx + 7 * z, cy - 13 * z], [cx + 1 * z, cy - 12.5 * z]], C('#62b85a'));
      const hx = cx + 1 * z, hy = cy - 21 * z, col = FLOWER_COLS[Math.floor(hash(x, y, 71 + ((t && t.slot) || 0)) * FLOWER_COLS.length)];
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + now / 5000; ellipse(hx + Math.cos(a) * 4.2 * z, hy + Math.sin(a) * 4.2 * z, 3.1 * z, 3.1 * z, C(col)); }
      circle(hx, hy, 2.8 * z, C('#f2c14e')); circle(hx - 0.8 * z, hy - 0.8 * z, 1 * z, C('#ffe28a'));
      break;
    }
    case 'hecke': {
      box(cx, cy, hw * 0.45, hh * 0.45, 6 * z, '#4f9e4a', null, 0);
      for (let i = 0; i < 5; i++) {
        const p = lerp([cx - hw * 0.45, cy - 6 * z], [cx + hw * 0.45, cy - 6 * z], i / 4);
        circle(p[0], p[1] - Math.sin(i / 4 * Math.PI) * hh * 0.3, 3.4 * z, C('#62b85a'));
      }
      break;
    }
    case 'bank': drawBench(cx, cy, z, t, hw, hh); break;             // Formen und Farben (Block 106)
    case 'souvenir': drawSouvenir(cx, cy, z, svAt(x, y, (t && t.slot) || 0)); break;   // Geschenk eines Freundes (Block 129, souvenir.js)
    case 'freundesbank': {                   // Bank mit Herzlehne (Block 105)
      const K = kit(cx, cy, z, (t && t.rot) || 0);
      shadow(cx, cy, hw * 0.35, hh * 0.25);
      K.scene([
        [-0.1, 0, () => { for (const b of [-0.4, 0.4]) kPost(K, -0.1, b, 9, '#6b4f3a', 1.4);
          const [hx, hy] = K.P(-0.1, 0, 12), r = 2.6 * z;                                  // Herz als Lehne
          circle(hx - r * 0.55, hy - r * 0.3, r * 0.7, C('#e8604f')); circle(hx + r * 0.55, hy - r * 0.3, r * 0.7, C('#e8604f'));
          poly([[hx - r * 1.2, hy - 0.05 * r], [hx + r * 1.2, hy - 0.05 * r], [hx, hy + r * 1.3]], C('#e8604f'));
          K.block({ a: -0.1, ha: 0.035, hb: 0.47, h: 2.2, lift: 6.5, wall: '#f28cb1', roof: '#f6a5c0', type: 'flat' }); }],
        [0.08, 0, () => { for (const b of [-0.4, 0.4]) kPost(K, 0.16, b, 5, '#6b4f3a', 1.4);
          K.block({ a: 0.06, ha: 0.14, hb: 0.47, h: 1.4, lift: 4.6, wall: '#f28cb1', roof: '#f6a5c0', type: 'flat' }); }],
      ]);
      break;
    }
    case 'freundschaftsbaum': {              // runder Baum, an dem Herzen wachsen (Block 105)
      shadow(cx, cy, hw * 0.55, hh * 0.45);
      g.fillStyle = C('#8a5a3c'); g.fillRect(cx - 2.2 * z, cy - 16 * z, 4.4 * z, 16 * z);
      for (const [dx, dy, r, c] of [[-7, -22, 9, '#58ad52'], [7, -22, 9, '#4f9e4a'], [0, -30, 11, '#62b85a'], [-4, -26, 7, '#6cc164'], [5, -27, 6, '#58ad52']]) circle(cx + dx * z, cy + dy * z, r * z, C(c));
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + 0.4, hx = cx + Math.cos(a) * 9 * z, hy = cy - 26 * z + Math.sin(a) * 6 * z + Math.sin(now / 900 + i) * 0.6 * z, r = 1.5 * z;
        circle(hx - r * 0.55, hy - r * 0.3, r * 0.7, C(i % 2 ? '#f28cb1' : '#e8604f')); circle(hx + r * 0.55, hy - r * 0.3, r * 0.7, C(i % 2 ? '#f28cb1' : '#e8604f'));
        poly([[hx - r * 1.2, hy - 0.05 * r], [hx + r * 1.2, hy - 0.05 * r], [hx, hy + r * 1.3]], C(i % 2 ? '#f28cb1' : '#e8604f'));
      }
      break;
    }
    case 'laterne': drawLantern(cx, cy, z, now, x, y, t); break;      // Formen und Farben (Block 106, draw-schmuck.js)
    case 'denkmal': {                        // Sockel, Obelisk mit goldener Spitze, Tafel
      ellipse(cx, cy + 1 * z, 16 * z, 7 * z, 'rgba(40,40,40,0.15)');
      box(cx, cy, hw * 0.42, hh * 0.42, 6 * z, '#d8d2c4', '#c2baa8', 0);
      box(cx, cy - 6 * z, hw * 0.3, hh * 0.3, 4 * z, '#e8e3d6', '#cfc8b7', 0);
      const b = box(cx, cy - 10 * z, hw * 0.16, hh * 0.16, 26 * z, '#efeae0', '#d6cfbf', 0);
      const top = cy - 36 * z;
      poly([[b.L[0], b.L[1] - 26 * z], [b.B[0], b.B[1] - 26 * z], [cx, top - 8 * z]], C('#f2c14e'));
      poly([[b.B[0], b.B[1] - 26 * z], [b.R[0], b.R[1] - 26 * z], [cx, top - 8 * z]], C('#c9962b'));
      faceQuad(b.L, b.B, 0.25, 0.75, 8 * z, 14 * z, C('#c9962b'));
      glowQuad([[cx - 2, top - 8 * z], [cx + 2, top - 8 * z], [cx + 2, top - 4 * z], [cx - 2, top - 4 * z]], 18 * z);
      break;
    }
    case 'rosenbogen': {                     // Bogen mit Rosen
      ellipse(cx, cy + 1 * z, 9 * z, 3 * z, 'rgba(40,60,20,0.15)');
      g.strokeStyle = C('#ffffff'); g.lineWidth = 1.6 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 7 * z, cy); g.lineTo(cx - 7 * z, cy - 13 * z); g.arc(cx, cy - 13 * z, 7 * z, Math.PI, 0); g.lineTo(cx + 7 * z, cy); g.stroke();
      for (let i = 0; i < 14; i++) {
        const a = Math.PI + i / 13 * Math.PI, r = 7 * z, px = cx + Math.cos(a) * r, py = cy - 13 * z + Math.sin(a) * r;
        circle(px, py, 1.9 * z, C(i % 2 ? '#5aa84f' : '#6fbf5f'));
        if (i % 2 === 0) circle(px + 0.6 * z, py - 0.4 * z, 1.3 * z, C(i % 4 ? '#f28cb1' : '#e8604f'));
      }
      for (const sx of [-7, 7]) for (let j = 0; j < 3; j++) circle(cx + sx * z, cy - (3 + j * 4) * z, 1.7 * z, C(j % 2 ? '#f28cb1' : '#5aa84f'));
      break;
    }
    case 'uhrturm': {                        // schlanker Turm mit Uhr und spitzem Dach
      const K = kit(cx, cy, z, t && t.rot);
      kShadow(K, 0.25);
      const B = K.block({ ha: 0.15, hb: 0.15, h: 40, wall: '#f3e1c4', roof: '#6f8fd8', roofH: 16, over: 1.2 });
      for (const F of Object.values(B.faces)) if (F) {
        const ck = clockNow(), hr = (ck.getHours() % 12 + ck.getMinutes() / 60) / 6 * Math.PI, mi = ck.getMinutes() / 30 * Math.PI;   // Spielzeit (Block 101)
        faceClock(F, 0.5, F.H * 0.8, 3.4 * z, z, { ring: '#4a4a58', ringW: 0.7, hands: [[hr, 0.53, 0.8], [mi, 0.76, 0.7]] });   // flach auf der Wand (Block 80)
        faceQuad(F.P, F.Q, 0.35, 0.65, 0, F.H * 0.25, C('#8a5a3c'));
      }
      const [px, py] = K.P(0, 0, 40 + 16);
      circle(px, py, 1.4 * z, C('#f2c14e'));
      break;
    }
    case 'schmetterlingsgarten': {           // Blumenhügel, darüber tanzen immer Falter (Block 56)
      ellipse(cx, cy + 1 * z, hw * 0.8, hh * 0.8, 'rgba(40,60,20,0.15)');
      ellipse(cx, cy - 1 * z, hw * 0.72, hh * 0.72, C('#6fae4f'));
      ellipse(cx, cy - 3 * z, hw * 0.55, hh * 0.5, C('#82c25c'));
      ellipse(cx, cy - 5 * z, hw * 0.32, hh * 0.3, C('#94d06a'));
      const cols = ['#f28cb1', '#ffd23f', '#ffffff', '#b07ad6', '#e8604f', '#9ad0f5'];
      for (let i = 0; i < 26; i++) {
        const a = hash(x, y, 300 + i) * Math.PI * 2, r = Math.sqrt(hash(x, y, 330 + i)), fx = cx + Math.cos(a) * r * hw * 0.62, fy = cy - 2 * z + Math.sin(a) * r * hh * 0.6 - (1 - r) * 3 * z;
        g.strokeStyle = C('#4f8f3c'); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 2 * z); g.stroke();
        circle(fx, fy - 2.2 * z, 1.1 * z, C(cols[i % cols.length])); circle(fx, fy - 2.2 * z, 0.4 * z, C('#f2c14e'));
      }
      for (let i = 0; i < 3; i++) {                                         // die eigenen Falter
        const t = now / 1000 + i * 2.1, bx = cx + Math.sin(t * 0.8 + i) * hw * 0.4, by = cy - 12 * z - Math.cos(t * 0.7 + i * 2) * 4 * z;
        const f = Math.abs(Math.sin(t * 17 + i)), w = (1 + f * 1.3) * z, col = cols[(i * 2) % cols.length];
        ellipse(bx - w * 0.9, by, w, 1.7 * z, col); ellipse(bx + w * 0.9, by, w, 1.7 * z, col); ellipse(bx, by + 0.3 * z, 0.4 * z, 1.2 * z, '#4a3328');
      }
      break;
    }
    case 'vogelbaum': {                      // alter Baum mit Vogelhäuschen, Vögel fliegen ein und aus (Block 56)
      ellipse(cx, cy + 1 * z, 14 * z, 6 * z, 'rgba(40,60,20,0.18)');
      poly([[cx - 2.4 * z, cy], [cx + 2.4 * z, cy], [cx + 1.6 * z, cy - 20 * z], [cx - 1.6 * z, cy - 20 * z]], C('#8a5a34'));
      poly([[cx - 2.4 * z, cy], [cx - 4 * z, cy + 1 * z], [cx - 1 * z, cy - 2 * z]], C('#7a4e2c')); poly([[cx + 2.4 * z, cy], [cx + 4 * z, cy + 1 * z], [cx + 1 * z, cy - 2 * z]], C('#7a4e2c'));
      for (const [ox, oy, r, col] of [[-7, -24, 7, '#4f9a45'], [7, -25, 7.5, '#4f9a45'], [0, -31, 9, '#5aa84f'], [-4, -27, 6, '#6fbf5f'], [5, -30, 5.5, '#6fbf5f']]) circle(cx + ox * z, cy + oy * z, r * z, C(col));
      const house = (hx, hy, col) => {                                      // Häuschen mit Dach und Flugloch
        poly([[hx - 2.4 * z, hy], [hx + 2.4 * z, hy], [hx + 2.4 * z, hy - 3.6 * z], [hx - 2.4 * z, hy - 3.6 * z]], C(col));
        poly([[hx - 3.2 * z, hy - 3.4 * z], [hx, hy - 6.2 * z], [hx + 3.2 * z, hy - 3.4 * z]], C('#c0533f'));
        circle(hx, hy - 1.9 * z, 0.9 * z, C('#3d2c22'));
      };
      house(cx - 2.6 * z, cy - 12 * z, '#f3e1c4'); house(cx + 4.4 * z, cy - 19 * z, '#bfe3ff');
      for (let i = 0; i < 2; i++) {                                         // Vögel kreisen um die Krone
        const t = now / 1000 + i * 3, a = t * 0.9 + i * Math.PI, bx = cx + Math.cos(a) * 12 * z, by = cy - 30 * z + Math.sin(a) * 4 * z, f = Math.sin(t * 13 + i) * 1.8 * z;
        g.strokeStyle = '#5a4636'; g.lineWidth = 0.9 * z; g.lineCap = 'round';
        g.beginPath(); g.moveTo(bx - 2.6 * z, by - f); g.quadraticCurveTo(bx - 1.2 * z, by - 1.3 * z, bx, by); g.quadraticCurveTo(bx + 1.2 * z, by - 1.3 * z, bx + 2.6 * z, by - f); g.stroke();
      }
      break;
    }
    case 'seerosenteich': {                  // 2×2: Steinrand, Wasser, Seerosen, Schilf, eine Libelle (Block 56)
      const rx = hw * 1.55, ry = hh * 1.55;
      ellipse(cx, cy + 1.5 * z, rx * 1.04, ry * 1.04, 'rgba(40,60,20,0.15)');
      ellipse(cx, cy, rx, ry, C('#bdb6a8'));
      ellipse(cx, cy + 0.6 * z, rx * 0.88, ry * 0.86, C('#5fa9cc'));
      ellipse(cx, cy, rx * 0.86, ry * 0.84, C('#7cc4e0'));
      for (let i = 0; i < 5; i++) { const a = now / 2400 + i * 1.3; ellipse(cx + Math.cos(a) * rx * 0.4, cy + Math.sin(a * 1.2) * ry * 0.35, 4 * z, 1.2 * z, 'rgba(255,255,255,0.22)'); }
      for (let i = 0; i < 7; i++) {
        const a = hash(x, y, 400 + i) * Math.PI * 2, r = 0.25 + 0.5 * hash(x, y, 420 + i), px = cx + Math.cos(a) * rx * r * 0.85, py = cy + Math.sin(a) * ry * r * 0.85;
        g.fillStyle = C('#5aa84f'); g.beginPath(); g.ellipse(px, py, 3.4 * z, 1.7 * z, 0, 0.35, Math.PI * 2 - 0.1); g.lineTo(px, py); g.fill();
        if (i % 2 === 0) { circle(px + 0.4 * z, py - 0.9 * z, 1.4 * z, C('#f7c6d8')); circle(px + 0.4 * z, py - 1.1 * z, 0.6 * z, C('#f2c14e')); }
      }
      for (let i = 0; i < 6; i++) {                                         // Schilf an der linken Ecke
        const sx = cx - rx * 0.8 + i * 1.4 * z, sy = cy - ry * 0.05 + (i % 2) * z, sway = Math.sin(now / 900 + i) * 0.8 * z;
        g.strokeStyle = C('#6f9a3e'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sway, sy - (7 + (i % 3) * 2) * z); g.stroke();
        if (i % 2) ellipse(sx + sway, sy - (7 + (i % 3) * 2) * z, 0.7 * z, 1.6 * z, C('#8a5a34'));
      }
      const t = now / 1000, lx = cx + Math.sin(t * 0.6) * rx * 0.5, ly = cy - 10 * z + Math.sin(t * 1.7) * 2 * z, f = Math.abs(Math.sin(t * 25));
      g.strokeStyle = '#2f8fd8'; g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(lx - 2.4 * z, ly); g.lineTo(lx + 2.4 * z, ly); g.stroke();
      ellipse(lx - 0.6 * z, ly - 1 * z, 1.6 * z, (0.4 + f * 0.6) * z, 'rgba(220,240,255,0.8)'); ellipse(lx + 0.6 * z, ly - 1 * z, 1.6 * z, (0.4 + f * 0.6) * z, 'rgba(220,240,255,0.8)');
      break;
    }
    case 'fz_bahn': case 'fz_station': drawCoasterTile(cx, cy, z, x, y, t && t.b ? t : { b: type }); break;   // Achterbahn (Block 60c)
    case 'fz_looping': drawCoasterTile(cx, cy, z, x, y, { b: 'fz_bahn', loop: true }); break;
    case 'zauberbrunnen': {                  // Album-Belohnung (Block 60d): Brunnen mit Regenbogen und Funkeln
      ellipse(cx, cy + 1 * z, hw * 0.8, hh * 0.8, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy, hw * 0.7, hh * 0.7, C('#d8d2e8')); ellipse(cx, cy - 2.5 * z, hw * 0.7, hh * 0.7, C('#ece6f6'));
      ellipse(cx, cy - 2.5 * z, hw * 0.55, hh * 0.55, C('#8fd8ef'));
      const cols = ['#e8604f', '#f2a03a', '#ffd23f', '#58b36a', '#5f8fe8', '#b07ad6'];
      g.lineCap = 'butt';
      cols.forEach((col, i) => { g.strokeStyle = C(col); g.lineWidth = 1.3 * z; g.beginPath(); g.ellipse(cx, cy - 4 * z, (12 - i * 1.3) * z, (16 - i * 1.3) * z, 0, Math.PI, 0); g.stroke(); });
      g.fillStyle = C('#ece6f6'); g.fillRect(cx - 1.5 * z, cy - 12 * z, 3 * z, 9 * z);
      for (let i = 0; i < 6; i++) { const t = (now / 900 + i / 6) % 1, a = i / 6 * Math.PI * 2; circle(cx + Math.cos(a) * 5 * z * t, cy - 12 * z - Math.sin(t * Math.PI) * 6 * z + t * 6 * z, 1 * z, 'rgba(220,245,255,0.9)'); }
      for (let i = 0; i < 5; i++) { const a = now / 1200 + i * 1.3, sx = cx + Math.cos(a) * 9 * z, sy = cy - 20 * z + Math.sin(a * 1.4) * 4 * z, tw = 0.6 + 0.4 * Math.sin(now / 200 + i);
        poly([[sx, sy - 2 * z * tw], [sx + 0.6 * z, sy], [sx, sy + 2 * z * tw], [sx - 0.6 * z, sy]], C('#fff4a8')); }
      break;
    }
    // --- Freizeitpark (Block 60) ---
    case 'fz_karussell': {                   // 2×2: großes Pferdekarussell mit Zeltdach, Wimpeln und Lichtern
      const R = hw * 1.25, r2 = hh * 1.25, H = 22 * z, rot = now / 2400, lit = night > 0.15 && isLive();
      ellipse(cx, cy + 2 * z, R + 3 * z, r2 + 1.5 * z, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy + 1.5 * z, R, r2, C('#c9a26f'));
      ellipse(cx, cy - 1 * z, R, r2, C('#f6e3c8'));
      ellipse(cx, cy - 1 * z, R * 0.82, r2 * 0.82, C('#efd6b2'));
      const seats = [];
      for (let i = 0; i < 10; i++) { const a = rot + i / 10 * Math.PI * 2; seats.push([cx + Math.cos(a) * R * 0.7, cy - 1 * z + Math.sin(a) * r2 * 0.7, i]); }
      const horse = ([sx, sy, i]) => {
        const bob = Math.sin(now / 350 + i * 1.3) * 2 * z, col = C(['#ffffff', '#f7c6d8', '#bfe3ff', '#fff0b8', '#d9c7f2'][i % 5]);
        g.strokeStyle = C('#e2b84a'); g.lineWidth = 1 * z; g.beginPath(); g.moveTo(sx, sy - H); g.lineTo(sx, sy); g.stroke();
        ellipse(sx, sy - 9 * z + bob, 4 * z, 2.2 * z, col);                              // Rumpf
        circle(sx + 3.6 * z, sy - 12 * z + bob, 1.7 * z, col);                           // Kopf
        poly([[sx + 2.4 * z, sy - 13 * z + bob], [sx + 1.6 * z, sy - 15 * z + bob], [sx + 3.2 * z, sy - 13.5 * z + bob]], C('#e2b84a'));   // Mähne
        g.strokeStyle = col; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(sx - 2 * z, sy - 8 * z + bob); g.lineTo(sx - 2.6 * z, sy - 5 * z + bob); g.moveTo(sx + 2 * z, sy - 8 * z + bob); g.lineTo(sx + 2.6 * z, sy - 5 * z + bob); g.stroke();
      };
      seats.filter(p => p[1] < cy - 1 * z).forEach(horse);
      g.fillStyle = C('#e2b84a'); g.fillRect(cx - 2 * z, cy - H - 4 * z, 4 * z, H + 3 * z);       // Mittelsäule
      g.fillStyle = C('#f7b2c8'); g.fillRect(cx - 2 * z, cy - H * 0.7, 4 * z, H * 0.35);
      seats.filter(p => p[1] >= cy - 1 * z).forEach(horse);
      const top = cy - H - 18 * z;
      for (let i = 0; i < 16; i++) {                                                     // Zeltdach in Streifen
        const a0 = i / 16 * Math.PI * 2 + rot * 0.15, a1 = (i + 1) / 16 * Math.PI * 2 + rot * 0.15;
        if (Math.sin((a0 + a1) / 2) < -0.25) continue;
        poly([[cx, top], [cx + Math.cos(a0) * R * 1.08, cy - H + Math.sin(a0) * r2 * 1.08], [cx + Math.cos(a1) * R * 1.08, cy - H + Math.sin(a1) * r2 * 1.08]], C(i % 2 ? '#e8604f' : '#fffaf0'));
      }
      for (let i = 0; i < 24; i++) {                                                     // Bogenkante mit Lichtern
        const a = i / 24 * Math.PI * 2, px = cx + Math.cos(a) * R * 1.08, py = cy - H + Math.sin(a) * r2 * 1.08;
        if (Math.sin(a) < -0.3) continue;
        circle(px, py + 1.5 * z, 1.6 * z, C(i % 2 ? '#e8604f' : '#fffaf0'));
        circle(px, py + 1.5 * z, 0.6 * z, lit ? '#fff4a8' : C('#f2c14e'));
        if (lit) glowQuad([[px - 1, py], [px + 1, py], [px + 1, py + 2], [px - 1, py + 2]], 6 * z);
      }
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, top - 8 * z); g.stroke();
      poly([[cx, top - 8 * z], [cx + 6 * z, top - 6.5 * z + Math.sin(now / 300) * z], [cx, top - 5 * z]], C('#5f8fe8'));
      break;
    }
    case 'fz_zuckerwatte': {                 // Wägelchen mit gestreiftem Dach, rosa Zuckerwatte am Stiel
      const K = kit(cx, cy, z, t && t.rot);
      kShadow(K, 0.25);
      const B = K.block({ a: 0, b: 0, ha: 0.24, hb: 0.18, h: 9, wall: '#f7c6d8', type: 'flat', roof: '#fffaf0', trim: '#e8604f' });
      for (const [b0, cc] of [[-0.13, '#f9a8c6'], [0.02, '#fbc6da'], [0.15, '#f7b2c8']]) { const [px, py] = K.P(0.2, b0, 9); g.strokeStyle = C('#fffaf0'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 4 * z); g.stroke(); circle(px, py - 6 * z, 2.4 * z, C(cc)); circle(px - 1 * z, py - 6.6 * z, 1.2 * z, C('#ffe3ee')); }
      const posts = [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]];
      for (const [a, b] of posts) { const p0 = K.P(a, b, 9), p1 = K.P(a, b, 19); g.strokeStyle = C('#fffaf0'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
      for (let i = 0; i < 6; i++) { const b0 = -0.27 + i * 0.09, b1 = b0 + 0.09; K.poly([[0.3, b0], [0.3, b1], [-0.3, b1], [-0.3, b0]], C(i % 2 ? '#e8604f' : '#fffaf0'), 19); }
      void B;
      break;
    }
    case 'fz_torturm': {                      // Torturm (Block 60f): zwei in einer Reihe sind der Parkeingang, der spätere zeichnet den Bogen
      const K = kit(cx, cy, z, t && t.rot), fl = (t && t.fl) || ITEMS[type].fl0, lit = night > 0.15 && isLive();
      const r = 0.3, H = 22 + fl * 8, wall = fzCol(t, 'wall', '#fff3e6'), roof = fzCol(t, 'roof', '#e8604f');
      const win = lit ? '#ffd873' : C(fzCol(t, 'win', '#a8dcff'));
      kShadow(K, r + 0.1);
      const T = K.block({ a: 0, b: 0, ha: r, hb: r, h: H, wall, roof, roofH: 16, trim: roof });
      for (const side of ['front', 'back', 'left', 'right']) {
        const F = T.faces[side];
        if (!F) continue;
        faceQuad(F.P, F.Q, 0, 1, F.H - 7 * z, F.H - 5 * z, C(shade(roof, 0.25)));                      // Zierband
        for (let f = 0; f < fl + 1; f++) { const h0 = (5 + f * 8) * z; if (h0 + 5 * z < F.H - 8 * z) faceQuad(F.P, F.Q, 0.36, 0.64, h0, h0 + 5 * z, win); }
      }
      const [fx, fy] = K.P(0, 0, H + 16);                                  // Spitze und Fahne
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 10 * z); g.stroke();
      poly([[fx, fy - 10 * z], [fx + 7 * z, fy - 8.5 * z + Math.sin(now / 280 + x + y) * 1.2 * z], [fx, fy - 7 * z]], C('#5f8fe8'));
      if (x < 1e5) drawTorArch(cx, cy, z, x, y, t, H, now);
      break;
    }
    case 'fz_teetassen': {                   // 2×2: Teekanne in der Mitte, Tassen kreisen und drehen sich selbst
      const R = hw * 1.2, r2 = hh * 1.2, rot = now / 3000;
      ellipse(cx, cy + 2 * z, R + 3 * z, r2 + 1.5 * z, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy + 1 * z, R, r2, C('#e8a0b8')); ellipse(cx, cy - 0.5 * z, R, r2, C('#f7c6d8'));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; poly([[cx, cy - 0.5 * z], [cx + Math.cos(a) * R, cy - 0.5 * z + Math.sin(a) * r2], [cx + Math.cos(a + 0.39) * R, cy - 0.5 * z + Math.sin(a + 0.39) * r2]], C(i % 2 ? '#fbd6e3' : '#f7c6d8')); }
      const cups = [];
      for (let i = 0; i < 6; i++) { const a = rot + i / 6 * Math.PI * 2; cups.push([cx + Math.cos(a) * R * 0.66, cy - 1 * z + Math.sin(a) * r2 * 0.66, i]); }
      const cup = ([px, py, i]) => {
        const col = ['#5f8fe8', '#ffd23f', '#58b36a', '#e8604f', '#b07ad6', '#6fd3d8'][i], spin = now / 500 + i;
        ellipse(px, py - 1 * z, 5.2 * z, 2.4 * z, C(shade(col, -0.2)));
        poly([[px - 5.2 * z, py - 1 * z], [px - 4 * z, py - 6 * z], [px + 4 * z, py - 6 * z], [px + 5.2 * z, py - 1 * z]], C(col));
        ellipse(px, py - 6 * z, 4 * z, 1.8 * z, C(shade(col, 0.3))); ellipse(px, py - 6 * z, 3.2 * z, 1.3 * z, C('#fffaf0'));
        const hx = px + Math.cos(spin) * 5 * z; g.strokeStyle = C(col); g.lineWidth = 1.2 * z; g.beginPath(); g.ellipse(hx, py - 3.5 * z, 1.4 * z, 1.8 * z, 0, 0, Math.PI * 2); g.stroke();
        circle(px - 1.5 * z, py - 7.2 * z, 1.2 * z, C(['#f4c28f', '#b9b9c6', '#fffaf2'][i % 3]));   // ein Gast
      };
      cups.filter(c => c[1] < cy - 1 * z).forEach(cup);
      ellipse(cx, cy - 8 * z, 7 * z, 7 * z, C('#fffaf0')); ellipse(cx, cy - 9 * z, 6 * z, 5.5 * z, C('#f7f0e6'));   // Kanne
      for (let i = 0; i < 6; i++) circle(cx - 4 * z + i * 1.6 * z, cy - 8 * z + Math.sin(i) * 1.5 * z, 0.8 * z, C('#f28cb1'));
      ellipse(cx, cy - 15 * z, 3.5 * z, 1.4 * z, C('#e8604f')); circle(cx, cy - 16.5 * z, 1.2 * z, C('#f2c14e'));
      poly([[cx + 6 * z, cy - 9 * z], [cx + 11 * z, cy - 14 * z], [cx + 12 * z, cy - 13 * z], [cx + 6.5 * z, cy - 6.5 * z]], C('#fffaf0'));   // Tülle
      g.strokeStyle = C('#fffaf0'); g.lineWidth = 1.6 * z; g.beginPath(); g.ellipse(cx - 7.5 * z, cy - 9 * z, 2.2 * z, 3.4 * z, 0, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
      cups.filter(c => c[1] >= cy - 1 * z).forEach(cup);
      break;
    }
    case 'fz_kette': {                       // 2×2: Turm, oben dreht sich das Dach, Sitze fliegen an Ketten hinaus
      const H = 42 * z, rot = now / 1600, R = hw * 0.85, r2 = hh * 0.85, top = cy - H, lit = night > 0.15 && isLive();
      ellipse(cx, cy + 2 * z, hw * 1.2, hh * 1.2, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy, hw * 0.55, hh * 0.55, C('#d9c7f2'));
      const seats = [];
      for (let i = 0; i < 12; i++) { const a = rot + i / 12 * Math.PI * 2; seats.push([a, i]); }
      const seat = ([a, i]) => {
        const ax = cx + Math.cos(a) * R * 0.7, ay = top + 4 * z + Math.sin(a) * r2 * 0.7, sx = cx + Math.cos(a) * R * 1.35, sy = top + 22 * z + Math.sin(a) * r2 * 1.35;
        g.strokeStyle = C('#8a8f98'); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(ax, ay); g.lineTo(sx, sy); g.stroke();
        poly([[sx - 1.8 * z, sy], [sx + 1.8 * z, sy], [sx + 1.4 * z, sy + 2.4 * z], [sx - 1.4 * z, sy + 2.4 * z]], C(['#e8604f', '#ffd23f', '#5f8fe8', '#58b36a'][i % 4]));
        circle(sx, sy - 1 * z, 1.1 * z, C(['#f4c28f', '#b9b9c6', '#fffaf2', '#c9a27e'][i % 4]));
      };
      seats.filter(([a]) => Math.sin(a) < 0).forEach(seat);
      g.fillStyle = C('#b07ad6'); g.fillRect(cx - 2.4 * z, top, 4.8 * z, H);                       // Turm
      g.fillStyle = C('#9a64c4'); g.fillRect(cx, top, 2.4 * z, H);
      for (let i = 0; i < 16; i++) {                                                          // Dach
        const a0 = rot + i / 16 * Math.PI * 2, a1 = rot + (i + 1) / 16 * Math.PI * 2;
        poly([[cx, top - 10 * z], [cx + Math.cos(a0) * R, top + Math.sin(a0) * r2], [cx + Math.cos(a1) * R, top + Math.sin(a1) * r2]], C(i % 2 ? '#ffd23f' : '#fffaf0'));
      }
      for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2; circle(cx + Math.cos(a) * R, top + Math.sin(a) * r2, 1 * z, lit ? '#fff4a8' : C('#e8604f')); }
      circle(cx, top - 11 * z, 1.6 * z, C('#e8604f'));
      seats.filter(([a]) => Math.sin(a) >= 0).forEach(seat);
      break;
    }
    case 'fz_freifall': {                    // 1×1: hoher Gitterturm, Sitzring fährt langsam hoch und fällt
      const H = 70 * z, lit = night > 0.15 && isLive(), T = (now / 1000) % 10;
      const f = T < 6 ? T / 6 : T < 7 ? 1 : T < 7.6 ? 1 - ((T - 7) / 0.6) ** 2 : 0;          // hinauf, warten, fallen, unten
      ellipse(cx, cy + 1 * z, hw * 0.7, hh * 0.7, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy, hw * 0.45, hh * 0.45, C('#c9c3d6'));
      g.strokeStyle = C('#e8604f'); g.lineWidth = 1.6 * z;
      for (const dx of [-3, 3]) { g.beginPath(); g.moveTo(cx + dx * z, cy); g.lineTo(cx + dx * z, cy - H); g.stroke(); }
      g.lineWidth = 0.6 * z; g.beginPath();
      for (let y = 0; y < 70; y += 6) { g.moveTo(cx - 3 * z, cy - y * z); g.lineTo(cx + 3 * z, cy - (y + 6) * z); g.moveTo(cx + 3 * z, cy - y * z); g.lineTo(cx - 3 * z, cy - (y + 6) * z); }
      g.stroke();
      const ry = cy - (6 + f * 56) * z;                                                    // Sitzring
      ellipse(cx, ry, 8 * z, 3.2 * z, C('#5f8fe8')); ellipse(cx, ry - 1.5 * z, 8 * z, 3.2 * z, C('#7aa6f0'));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; if (Math.sin(a) < 0) continue; circle(cx + Math.cos(a) * 7 * z, ry - 2 * z + Math.sin(a) * 2.8 * z, 1.2 * z, C(['#f4c28f', '#b9b9c6', '#fffaf2'][i % 3])); }
      for (let i = 0; i < 8; i++) {                                                         // Lichterkrone
        const a = i / 8 * Math.PI * 2 + now / 800, px = cx + Math.cos(a) * 5 * z, py = cy - H - 2 * z + Math.sin(a) * 2 * z;
        circle(px, py, 1.1 * z, lit || (i + Math.floor(now / 300)) % 2 ? '#fff4a8' : C('#ffd23f'));
      }
      circle(cx, cy - H - 5 * z, 1.8 * z, C('#e8604f'));
      break;
    }
    case 'fz_geister': {                     // 2×2: schiefes Spukhaus, grüne Fenster, Gespenst kreist ums Dach
      const K = kit(cx, cy, z, t && t.rot), lit = night > 0.15 && isLive(), glow = lit || Math.sin(now / 700) > 0.3 ? '#9cf29a' : '#6fbf6a';
      kShadow(K, 0.9);
      const B = K.block({ a: 0, b: 0, ha: 0.7, hb: 0.75, h: 26, wall: '#6a5a7e', roof: '#3e3448', roofH: 18, type: 'gable', ridge: 'b', trim: '#4a3e5c' });
      for (const side of ['front', 'back', 'left', 'right']) { const F = B.faces[side]; if (!F) continue;
        for (const [t0, t1, h0, h1] of [[0.15, 0.3, 0.55, 0.78], [0.7, 0.85, 0.55, 0.78], [0.15, 0.3, 0.2, 0.42]]) faceQuad(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, C(glow)); }
      if (B.faces.front) { const F = B.faces.front; faceQuad(F.P, F.Q, 0.42, 0.58, 0, F.H * 0.5, C('#2a2032')); faceQuad(F.P, F.Q, 0.35, 0.65, F.H * 0.55, F.H * 0.68, C('#e8604f')); }
      const T = K.block({ a: -0.35, b: 0.45, ha: 0.18, hb: 0.18, h: 40, wall: '#5a4a6e', roof: '#3e3448', roofH: 14, trim: '#4a3e5c' });   // schiefes Türmchen
      void T;
      const a = now / 2200, [gx, gy] = K.P(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 40 + Math.sin(now / 400) * 3);   // Gespenst
      g.globalAlpha = 0.9;
      poly([[gx - 4 * z, gy], [gx - 4 * z, gy - 5 * z], [gx, gy - 9 * z], [gx + 4 * z, gy - 5 * z], [gx + 4 * z, gy], [gx + 2.7 * z, gy - 1.2 * z], [gx + 1.3 * z, gy], [gx, gy - 1.2 * z], [gx - 1.3 * z, gy], [gx - 2.7 * z, gy - 1.2 * z]], '#ffffff');
      circle(gx - 1.4 * z, gy - 5 * z, 0.7 * z, '#2a2032'); circle(gx + 1.4 * z, gy - 5 * z, 0.7 * z, '#2a2032'); ellipse(gx, gy - 3 * z, 0.8 * z, 1 * z, '#2a2032');
      g.globalAlpha = 1;
      break;
    }
    case 'fz_wildwasser': {                  // 2×3: Kanal-Schleife, Felsen mit Wasserfall, Baumstamm-Boote
      const K = kit(cx, cy, z, t && t.rot), T = now / 1000;
      kShadow(K, 1);
      const loop = [];                                                                       // Kanal als Rundkurs (Feld-Rahmen)
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; loop.push([Math.cos(a) * 0.72, Math.sin(a) * 1.15]); }
      K.poly(loop.map(([a, b]) => [a * 1.18, b * 1.1]), C('#a8916f'));
      K.poly(loop, C('#5fb6dc'));
      K.poly(loop.map(([a, b]) => [a * 0.62, b * 0.75]), C('#a8916f'));
      for (let i = 0; i < 6; i++) { const a = T * 0.8 + i; K.oval(Math.cos(a) * 0.62, Math.sin(a) * 0.98, 0.04, 'rgba(255,255,255,0.6)'); }
      const rock = () => {                                                                  // Felsen (runde Brocken) mit Wasserfall
        const [rx, ry] = K.P(-0.05, -0.1);
        for (const [dx, dy, r, h, col] of [[-6, 2, 13, 0, '#8a8078'], [7, 3, 11, 0, '#9a8f86'], [0, 0, 12, 10, '#a39a91'], [-4, -1, 9, 18, '#9a8f86'], [3, 0, 8, 22, '#b0a79e'], [0, 0, 6, 27, '#7f9a5a']]) {
          ellipse(rx + dx * z, ry - h * z + dy * z, r * z, r * 0.62 * z, C(col));
          ellipse(rx + dx * z - r * 0.25 * z, ry - h * z + dy * z - r * 0.2 * z, r * 0.45 * z, r * 0.25 * z, C(shade(col, 0.12)));
        }
        circle(rx + 2 * z, ry - 31 * z, 2.6 * z, C('#62b85a')); circle(rx - 2 * z, ry - 30 * z, 2.2 * z, C('#58ad52'));   // Büsche oben
        const [w0x, w0y] = K.P(0.18, -0.1, 24), [w1x, w1y] = K.P(0.6, -0.1, 0);
        g.strokeStyle = 'rgba(190,232,250,0.9)'; g.lineWidth = 4 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(w0x, w0y); g.lineTo(w1x, w1y); g.stroke();
        for (let i = 0; i < 4; i++) { const f = ((T * 1.6 + i / 4) % 1); circle(w0x + (w1x - w0x) * f, w0y + (w1y - w0y) * f, 1.4 * z, '#ffffff'); }
      };
      const boat = (k) => () => {                                                           // Baumstamm-Boot
        const a = T * 0.45 + k * Math.PI, [bx, by] = K.P(Math.cos(a) * 0.72, Math.sin(a) * 1.15, 1.5);
        ellipse(bx, by, 5 * z, 2.2 * z, C('#8a5a34')); ellipse(bx, by - 1 * z, 4 * z, 1.4 * z, C('#a87448'));
        circle(bx - 1.5 * z, by - 3 * z, 1.2 * z, C('#f4c28f')); circle(bx + 1.5 * z, by - 3 * z, 1.2 * z, C('#b9b9c6'));
      };
      const splash = Math.max(0, Math.sin(T * 2)), [sx, sy] = K.P(0.62, -0.1, 0);
      const parts = [[0, -0.1, rock], [Math.cos(T * 0.45) * 0.72, Math.sin(T * 0.45) * 1.15, boat(0)], [Math.cos(T * 0.45 + Math.PI) * 0.72, Math.sin(T * 0.45 + Math.PI) * 1.15, boat(1)]];
      K.scene(parts);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; circle(sx + Math.cos(a) * (3 + splash * 4) * z, sy - Math.sin(a) * (2 + splash * 5) * z, 1 * z, 'rgba(255,255,255,0.85)'); }
      break;
    }
    case 'fz_eis': {                         // Wägelchen mit riesiger Eiswaffel auf dem Dach
      const K = kit(cx, cy, z, t && t.rot);
      kShadow(K, 0.25);
      K.block({ a: 0, b: 0, ha: 0.24, hb: 0.18, h: 10, wall: '#bfe3ff', type: 'flat', roof: '#fffaf0', trim: '#5f8fe8' });
      for (const [a, b] of [[-0.18, -0.28], [0.18, -0.28], [-0.18, 0.28], [0.18, 0.28]]) { const [px, py] = K.P(a, b, 0); circle(px, py, 1.4 * z, C('#4a4a58')); }   // Räder
      const [ix, iy] = K.P(0, 0, 10);
      poly([[ix - 3.5 * z, iy - 2 * z], [ix + 3.5 * z, iy - 2 * z], [ix, iy + 7 * z - 4 * z]], C('#e2b07a'));       // Waffel
      g.strokeStyle = C('#c9955f'); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(ix - 2 * z, iy - 1 * z); g.lineTo(ix + 1 * z, iy + 2 * z); g.moveTo(ix + 2 * z, iy - 1 * z); g.lineTo(ix - 1 * z, iy + 2 * z); g.stroke();
      circle(ix - 1.6 * z, iy - 4 * z, 2.8 * z, C('#f7c6d8')); circle(ix + 1.6 * z, iy - 4 * z, 2.8 * z, C('#fff0b8')); circle(ix, iy - 7 * z, 2.8 * z, C('#8a5a3c'));
      circle(ix + 0.5 * z, iy - 9.8 * z, 1 * z, C('#e8604f'));
      break;
    }
    case 'fz_ballon': {                      // Bündel bunter Luftballons, die schaukeln
      ellipse(cx, cy + 1 * z, 5 * z, 2 * z, 'rgba(40,60,20,0.15)');
      g.fillStyle = C('#8a5a3c'); g.fillRect(cx - 1.2 * z, cy - 6 * z, 2.4 * z, 6 * z);
      circle(cx, cy - 7 * z, 2.2 * z, C('#f4c28f'));
      const cols = ['#e8604f', '#ffd23f', '#5f8fe8', '#58b36a', '#f28cb1', '#b07ad6', '#6fd3d8'];
      for (let i = 0; i < 7; i++) {
        const sw = Math.sin(now / 900 + i * 0.9) * 2.5 * z, bx = cx + (i - 3) * 2.6 * z + sw, by = cy - 22 * z - Math.abs(i - 3) * -1.5 * z - (i % 2) * 3 * z;
        g.strokeStyle = 'rgba(80,80,80,0.6)'; g.lineWidth = 0.4 * z; g.beginPath(); g.moveTo(cx + 1 * z, cy - 7 * z); g.lineTo(bx, by + 3.4 * z); g.stroke();
        ellipse(bx, by, 2.6 * z, 3.3 * z, C(cols[i])); circle(bx - 0.9 * z, by - 1.2 * z, 0.8 * z, 'rgba(255,255,255,0.5)');
      }
      break;
    }
    case 'karussell': {                      // runder Boden, Mittelstange, gestreiftes Zeltdach, Pferdchen drehen sich
      const rx = hw * 0.62, ry = hh * 0.62, H = 16 * z, rot = now / 1500;
      ellipse(cx, cy + 1 * z, rx + 2 * z, ry + 1 * z, 'rgba(40,40,40,0.15)');
      ellipse(cx, cy, rx, ry, C('#c9a26f'));
      ellipse(cx, cy - 1.5 * z, rx, ry, C('#f3e1c4'));
      const seats = [];
      for (let i = 0; i < 6; i++) { const a = rot + i / 6 * Math.PI * 2; seats.push([cx + Math.cos(a) * rx * 0.72, cy - 1.5 * z + Math.sin(a) * ry * 0.72, i]); }
      const drawSeat = ([sx, sy, i]) => {
        const bob = Math.sin(now / 300 + i) * 1.5 * z;
        g.strokeStyle = C('#d6b35a'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(sx, sy - H); g.lineTo(sx, sy); g.stroke();
        ellipse(sx, sy - 6 * z + bob, 3 * z, 1.8 * z, C(['#ffffff', '#f7c6d8', '#bfe3ff'][i % 3]));
        circle(sx + 2.4 * z, sy - 7.6 * z + bob, 1.3 * z, C(['#ffffff', '#f7c6d8', '#bfe3ff'][i % 3]));
      };
      seats.filter(p => p[1] < cy - 1.5 * z).forEach(drawSeat);          // hintere Sitze
      g.fillStyle = C('#d6b35a'); g.fillRect(cx - 1.2 * z, cy - H - 2 * z, 2.4 * z, H + 1 * z);
      seats.filter(p => p[1] >= cy - 1.5 * z).forEach(drawSeat);         // vordere Sitze
      const top = cy - H - 12 * z;
      for (let i = 0; i < 12; i++) {                                       // Zeltdach in Streifen
        const a0 = i / 12 * Math.PI * 2 + rot * 0.2, a1 = (i + 1) / 12 * Math.PI * 2 + rot * 0.2;
        if (Math.sin((a0 + a1) / 2) < -0.2) continue;
        poly([[cx, top], [cx + Math.cos(a0) * rx * 1.08, cy - H + Math.sin(a0) * ry * 1.08], [cx + Math.cos(a1) * rx * 1.08, cy - H + Math.sin(a1) * ry * 1.08]],
          C(i % 2 ? '#e8604f' : '#fffaf0'));
      }
      circle(cx, top - 1 * z, 1.6 * z, C('#f2c14e'));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; glowQuad([[cx + Math.cos(a) * rx - 1, cy - H + Math.sin(a) * ry - 1], [cx + Math.cos(a) * rx + 1, cy - H + Math.sin(a) * ry - 1], [cx + Math.cos(a) * rx + 1, cy - H + Math.sin(a) * ry + 1], [cx + Math.cos(a) * rx - 1, cy - H + Math.sin(a) * ry + 1]], 8 * z); }
      break;
    }
    case 'truhe': drawChest(cx, cy, z, now); break;
    case 'pokal_bronze': drawTrophy(cx, cy, z, now, ['#c98a4b', '#e3ad76', '#9a6534']); break;
    case 'pokal_silber': drawTrophy(cx, cy, z, now, ['#c7ced8', '#eef2f6', '#98a1ad']); break;
    case 'pokal_gold': drawTrophy(cx, cy, z, now, ['#f2c14e', '#ffe28a', '#c9962b']); break;
    case 'kristallaterne': {              // silberner Pfahl, oben ein Kristall als Lampe
      ellipse(cx, cy + 1 * z, 4 * z, 2 * z, 'rgba(40,50,70,0.16)');
      g.strokeStyle = C('#c3cad3'); g.lineWidth = 1.8 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 19 * z); g.stroke();
      ellipse(cx, cy - 19 * z, 4.2 * z, 1.9 * z, C('#aeb7c2'));          // Fassung
      ellipse(cx, cy - 19.8 * z, 3.6 * z, 1.5 * z, C('#e8edf2'));
      crystal(cx - 2 * z, cy - 19.5 * z, z, 6 * z, 1.7 * z, -0.25);
      crystal(cx + 2.2 * z, cy - 19.3 * z, z, 5.5 * z, 1.6 * z, 0.25);
      crystal(cx, cy - 18.8 * z, z, 11 * z, 2.9 * z, 0.03);
      glowQuad([[cx - 3 * z, cy - 32 * z], [cx + 3 * z, cy - 32 * z], [cx + 3 * z, cy - 20 * z], [cx - 3 * z, cy - 20 * z]], 40 * z, 'blue');
      break;
    }
    case 'glaskugel': {                   // Sockel mit schillernder Kugel; der Glanzpunkt wandert langsam
      ellipse(cx, cy + 1 * z, 6 * z, 2.6 * z, 'rgba(40,50,70,0.16)');
      box(cx, cy, 3.2 * z, 1.7 * z, 7 * z, '#ebe5da', '#d8d0c2', 0);
      ellipse(cx, cy - 7 * z, 4.4 * z, 2.2 * z, C('#f6f1e8'));
      const r = 6.5 * z, ky = cy - 7 * z - r * 0.85, sh = Math.sin(now / 1600) * 0.25;
      const grd = g.createRadialGradient(cx - r * (0.35 + sh * 0.3), ky - r * 0.4, r * 0.1, cx, ky, r);
      grd.addColorStop(0, C('#ffffff')); grd.addColorStop(0.35, C('#d9ccfa')); grd.addColorStop(0.7, C('#9fd0f3')); grd.addColorStop(1, C('#8fd3bf'));
      g.fillStyle = grd; g.beginPath(); g.arc(cx, ky, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.9 * z;
      g.beginPath(); g.arc(cx, ky, r * 0.72, Math.PI * 0.15 + sh, Math.PI * 0.55 + sh); g.stroke();
      ellipse(cx - r * (0.35 + sh * 0.3), ky - r * 0.42, 1.6 * z, 1.1 * z, 'rgba(255,255,255,0.9)');
      glowQuad([[cx - 3 * z, ky - 3 * z], [cx + 3 * z, ky - 3 * z], [cx + 3 * z, ky + 3 * z], [cx - 3 * z, ky + 3 * z]], 20 * z, 'blue');
      break;
    }
    case 'kristallbrunnen': drawCrystalFountain(cx, cy, z, now, x, y, hw, hh); break;   // prächtiger (Block 106)
    case 'brunnen': drawFountain(cx, cy, z, now, x, y, t, hw, hh); break;   // vier Formen (Block 106)
    case 'pavillon': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      diamond(cx, cy, hw * 0.62, hh * 0.62, C('#efe6d8'));
      g.strokeStyle = C('#ffffff'); g.lineWidth = 2 * z;
      for (const [px, py] of [[-14, 0], [14, 0], [0, 7], [0, -7]]) { g.beginPath(); g.moveTo(cx + px * z, cy + py * z); g.lineTo(cx + px * z, cy + py * z - 14 * z); g.stroke(); }
      const top = cy - 14 * z;
      poly([[cx - 18 * z, top], [cx, top + 9 * z], [cx, top - 12 * z]], C('#8fd0c3'));
      poly([[cx, top + 9 * z], [cx + 18 * z, top], [cx, top - 12 * z]], C('#6fb8aa'));
      circle(cx, top - 12 * z, 1.8 * z, C('#f2c14e'));
      break;
    }
    case 'statue': {
      shadow(cx, cy, hw * 0.4, hh * 0.4);
      box(cx, cy, hw * 0.3, hh * 0.3, 9 * z, '#e5dccb', null, 0);
      const sx = cx, sy = cy - 22 * z, R = 9 * z, r = 4 * z, rot = Math.sin(now / 1500) * 0.15;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
        pts.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr]);
      }
      poly(pts, C('#f2c14e'));
      circle(sx - 2 * z, sy - 3 * z, 1.8 * z, 'rgba(255,255,255,0.7)');
      break;
    }
    case 'lm': drawLandmarkBig(t ? t.lm : 'baum', cx, cy, z, now, x, y, t && t.stage != null ? t.stage : lmStage(t ? t.lm : 'baum')); break;
  }
}

// Auf der Karte belegt eine Sehenswürdigkeit 2×2 Felder: weicher Untergrund, darauf das Wahrzeichen in groß
const LM_GROUND = { baum: '#8fd16a', obsthain: '#94d36c', klippe: '#b7bcb2', ruine: '#dcd3c2', erzberg: '#b9ad94', quelle: '#cfc9bb', kristall: '#b4aac6' };
// Auf der Karte 3×3 Felder: die Zeichnungen (für 2×2 entworfen) werden 1,5-mal so groß gezeichnet
function drawLandmarkBig(type, cx, cy, z0, now, x, y, stage) {
  const z = z0 * 1.5, K = kit(cx, cy, z, 0);
  if (LANDMARK_ART[type]) {
    if (stage <= 0) RUIN = true;
    LANDMARK_ART[type](K, stage, now, x, y);
    RUIN = false;
    return;
  }
  if (groundPart(() => {
    if (stage <= 0) RUIN = true;
    K.oval(0, 0, 0.92, C(shade(LM_GROUND[type] || '#8fd16a', -0.06)));
    K.oval(0, 0, 0.84, C(LM_GROUND[type] || '#8fd16a'));
    RUIN = false;
  })) return;
  drawLandmark(type, cx, cy + 3 * z, z * 1.2, now, x, y, stage);
}
// Sehenswürdigkeit in ihrer Stufe: 0 = verfallen (grau, überwuchert), 1–3 mit immer mehr Details
function drawLandmark(type, cx, cy, z, now, x, y, stage = 1) {
  if (LANDMARK_ART[type]) {                 // für 2×2 gezeichnet: im Tagebuch etwas kleiner
    if (stage <= 0) RUIN = true;
    LANDMARK_ART[type](kit(cx, cy + 6 * z, z * 0.62, 0), stage, now, x, y);
    RUIN = false;
    return;
  }
  if (stage <= 0) {
    RUIN = true;
    drawLandmarkBase(type, cx, cy, z, 0, x, y);
    RUIN = false;
    // Gestrüpp und Schutt
    for (let i = 0; i < 7; i++) {
      const a = hash(x, y, 700 + i) * Math.PI * 2, r = 0.25 + hash(x, y, 710 + i) * 0.25;
      const bx = cx + Math.cos(a) * r * TW * z, by = cy + Math.sin(a) * r * TH * z;
      if (i % 3) circle(bx, by - 2 * z, (3 + hash(x, y, 720 + i) * 3) * z, C(i % 2 ? '#6f8f4a' : '#7d9a55'));
      else ellipse(bx, by, 3 * z, 1.8 * z, C('#9a948a'));
    }
    return;
  }
  drawLandmarkBase(type, cx, cy, z, now, x, y);
  const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const mini = (b, u, v, s, rot = 0) => { const [px, py] = F(u, v); g.save(); g.translate(px, py); g.scale(s, s); drawObject(b, 0, 0, z, now, x, y, 1, { rot }); g.restore(); };
  switch (type) {
    case 'baum':
      if (stage >= 2) { mini('bank', 0.38, 0.1, 0.45, 1); mini('bank', -0.1, 0.38, 0.45, 0); }
      if (stage >= 3) for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, lx = cx + Math.cos(a) * 16 * z, ly = cy - 38 * z + Math.sin(a) * 9 * z;
        const lit = night > 0.15 && isLive();
        circle(lx, ly, 1.6 * z, lit ? '#ffe58a' : C(['#ffd23f', '#ff8fb1', '#8fc1f0'][i % 3]));
        glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 10 * z);
      }
      break;
    case 'obsthain':
      if (stage >= 2) { tree(...F(0.35, -0.25), z * 0.8, 0.3, '#ff6b5e'); for (const [u, v] of [[0.3, 0.3], [0.1, 0.4]]) box(...F(u, v), 3 * z, 1.5 * z, 3 * z, '#c98d5c', null, 0); }
      if (stage >= 3) mini('pavillon', -0.3, 0.35, 0.5);
      break;
    case 'klippe':
      if (stage >= 2) mini('muehle', -0.4, 0.2, 0.55, 1);
      if (stage >= 3) for (let i = 0; i < 3; i++) {
        const kx = cx + (i - 1) * 16 * z + Math.sin(now / 900 + i) * 3 * z, ky = cy - 60 * z - i * 6 * z;
        poly([[kx, ky - 5 * z], [kx + 4 * z, ky], [kx, ky + 6 * z], [kx - 4 * z, ky]], C(['#e8705f', '#5f8fe8', '#f2b53a'][i]));
        g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.6 * z;
        g.beginPath(); g.moveTo(kx, ky + 6 * z); g.quadraticCurveTo(kx + 6 * z, ky + 24 * z, cx + 4 * z, cy - 20 * z); g.stroke();
      }
      break;
    case 'ruine':
      if (stage >= 2) { const [mx, my] = F(0.3, -0.3); boxR(mx, my, z, 0.18, 0.14, 12 * z, '#efe6d8', '#7d6bb0', 6 * z); }
      if (stage >= 3) for (let i = 0; i < 3; i++) {
        const [ax, ay] = F(0.1, 0.35);
        g.strokeStyle = C('#d6ccb8'); g.lineWidth = 2 * z;
        g.beginPath(); g.ellipse(ax, ay, (8 + i * 4) * z, (3 + i * 2) * z, 0, Math.PI, 0); g.stroke();
      }
      break;
    case 'erzberg':
      poly([[cx - 4 * z, cy + 2 * z], [cx + 4 * z, cy + 2 * z], [cx + 4 * z, cy - 7 * z], [cx - 4 * z, cy - 7 * z]], C('#3b3440'));
      if (stage >= 2) { const [sx, sy] = F(0.4, 0.25); box(sx, sy, 4 * z, 2 * z, 7 * z, '#a86f5c', '#4a4a58', 4 * z); smoke(sx, sy - 13 * z, z, now, true); }
      if (stage >= 3) { const [tx, ty] = F(-0.4, 0.3); box(tx, ty, 2.5 * z, 1.3 * z, 20 * z, '#cfc8bb', '#6b7a8f', 6 * z); circle(tx, ty - 17 * z, 2 * z, C('#e9a23b')); }
      break;
    case 'quelle':
      for (let i = 0; i < 12 && stage >= 2; i++) {
        const a = i / 12 * Math.PI * 2;
        ellipse(cx + Math.cos(a) * hwq(z) , cy + Math.sin(a) * hwq(z) * 0.5, 2.6 * z, 1.6 * z, C('#aeb2bd'));
      }
      if (stage >= 3) { const [bx2, by2] = F(-0.35, -0.35); boxR(bx2, by2, z, 0.22, 0.2, 12 * z, '#fff1d6', '#c65a45', 8 * z); }
      break;
    case 'kristall':
      if (stage >= 2) for (const [u, v] of [[0.35, 0.1], [0.1, 0.35], [0.4, 0.35]]) {
        const [lx, ly] = F(u, v);
        g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.2 * z;
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly - 12 * z); g.stroke();
        circle(lx, ly - 13 * z, 2 * z, '#e9d8ff');
        glowQuad([[lx - 2, ly - 15 * z], [lx + 2, ly - 15 * z], [lx + 2, ly - 11 * z], [lx - 2, ly - 11 * z]], 16 * z);
      }
      if (stage >= 3) { poly([[cx + 12 * z, cy + 2 * z], [cx + 18 * z, cy + 1 * z], [cx + 15 * z, cy - 16 * z]], C('#d9c7f7')); glowQuad([[cx - 8 * z, cy - 10 * z], [cx + 8 * z, cy - 10 * z], [cx + 8 * z, cy], [cx - 8 * z, cy]], 40 * z); }
      break;
  }
}
const hwq = z => TW / 2 * z * 0.78;
function drawLandmarkBase(type, cx, cy, z, now, x, y) {
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'quelle': {
      ellipse(cx, cy, hw * 0.85, hh * 0.85, C('#b9b3a8'));
      ellipse(cx, cy - 1 * z, hw * 0.7, hh * 0.7, C('#7fe0d8'));
      ellipse(cx - 5 * z, cy - 3 * z, hw * 0.25, hh * 0.2, C('#b8f3ee'));
      for (let i = 0; i < 4; i++) {
        const ph = (now / 2200 + i / 4) % 1;
        circle(cx + (i - 1.5) * 6 * z + Math.sin(ph * 5 + i) * 2 * z, cy - 6 * z - ph * 26 * z, (3 + ph * 5) * z, `rgba(255,255,255,${0.6 * (1 - ph)})`);
      }
      break;
    }
    case 'ruine': {
      diamond(cx, cy, hw * 0.8, hh * 0.8, C('#cfc6b3'));
      for (const [ox, oy, h] of [[-12, -2, 22], [-2, -6, 14], [9, -2, 26], [0, 6, 8]]) {
        box(cx + ox * z, cy + oy * z, 3 * z, 1.8 * z, h * z, '#e5dccb', null, 0);
      }
      box(cx + 10 * z, cy + 7 * z, 8 * z, 2 * z, 3 * z, '#d6ccb8', null, 0);
      circle(cx - 12 * z, cy - 23 * z, 3 * z, C('#62b85a'));
      break;
    }
    case 'erzberg': {
      ellipse(cx, cy - 6 * z, hw * 0.95, 20 * z, C('#9a9ea8'));
      ellipse(cx - 6 * z, cy - 16 * z, hw * 0.5, 10 * z, C('#b7bac3'));
      ellipse(cx - 9 * z, cy - 22 * z, 8 * z, 4 * z, C('#ffffff'));
      for (const [ox, oy] of [[6, -8], [-10, -4], [12, -16], [-2, -12], [16, -4]]) circle(cx + ox * z, cy + oy * z, 2 * z, C('#f2c14e'));
      break;
    }
    case 'obsthain': {
      tree(cx, cy + 4 * z, z * 1.8, 0.3, '#ff6b5e');
      tree(cx - 14 * z, cy + 2 * z, z * 0.9, 0.6, '#ffb13b');
      break;
    }
    case 'klippe': {
      poly([[cx - 18 * z, cy + 2 * z], [cx - 6 * z, cy - 30 * z], [cx + 8 * z, cy - 26 * z], [cx + 18 * z, cy + 4 * z], [cx, cy + 10 * z]], C('#a7abb6'));
      poly([[cx - 6 * z, cy - 30 * z], [cx + 8 * z, cy - 26 * z], [cx + 2 * z, cy - 18 * z]], C('#8fce6a'));
      g.strokeStyle = C('#6b6f78'); g.lineWidth = 1.4 * z;
      g.beginPath(); g.moveTo(cx + 4 * z, cy - 26 * z); g.lineTo(cx + 4 * z, cy - 44 * z); g.stroke();
      const w = Math.sin(now / 250) * 2 * z;
      poly([[cx + 4 * z, cy - 44 * z], [cx + 16 * z, cy - 42 * z + w], [cx + 4 * z, cy - 38 * z]], C('#ff8a3d'));
      break;
    }
    case 'baum': {
      ellipse(cx, cy + 2 * z, 20 * z, 8 * z, 'rgba(40,60,20,0.18)');
      g.fillStyle = C('#8a5a3c');
      g.fillRect(cx - 5 * z, cy - 26 * z, 10 * z, 26 * z);
      circle(cx, cy - 40 * z, 22 * z, C('#3f9a4f'));
      circle(cx - 12 * z, cy - 32 * z, 12 * z, C('#4aa857'));
      circle(cx + 12 * z, cy - 34 * z, 13 * z, C('#4aa857'));
      circle(cx - 6 * z, cy - 50 * z, 10 * z, C('#74cc7a'));
      for (let i = 0; i < 5; i++) {
        const ph = (now / 3000 + i / 5) % 1;
        circle(cx + Math.sin(ph * 7 + i) * 18 * z, cy - 60 * z + ph * 60 * z, 1.5 * z, `rgba(255,190,220,${1 - ph})`);
      }
      break;
    }
    case 'kristall': {
      ellipse(cx, cy - 2 * z, hw * 0.7, hh * 0.9, C('#8a8f99'));
      poly([[cx - 12 * z, cy - 2 * z], [cx - 6 * z, cy], [cx - 9 * z, cy - 20 * z]], C('#b98cf2'));
      poly([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx, cy - 30 * z]], C('#9d6fe0'));
      poly([[cx, cy - 30 * z], [cx + 4 * z, cy], [cx + 1 * z, cy - 1 * z]], C('#c7a6f7'));
      poly([[cx + 6 * z, cy], [cx + 13 * z, cy - 2 * z], [cx + 11 * z, cy - 18 * z]], C('#b98cf2'));
      glowQuad([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx + 1 * z, cy - 25 * z], [cx - 1 * z, cy - 25 * z]], 30 * z);
      break;
    }
  }
}

// Pokal: Sockel, Fuß, Schale mit zwei Henkeln, Glanz; ab und zu blitzt es
// Truhe auf einer fernen Insel: Holzkiste mit Goldbeschlägen, leicht offener Deckel, Goldschimmer
function drawChest(cx, cy, z, now) {
  ellipse(cx, cy + 1.5 * z, 12 * z, 5 * z, 'rgba(40,40,40,0.18)');
  box(cx, cy, 10 * z, 5 * z, 7 * z, '#8a5a34', null);                     // Kiste
  g.strokeStyle = C('#e2b448'); g.lineWidth = 1.4 * z;                    // Beschläge
  for (const f of [-0.55, 0.55]) {
    g.beginPath(); g.moveTo(cx + f * 10 * z, cy + (1 - Math.abs(f)) * 5 * z); g.lineTo(cx + f * 10 * z, cy + (1 - Math.abs(f)) * 5 * z - 7 * z); g.stroke();
  }
  const top = cy - 7 * z;
  ellipse(cx, top - 1.5 * z, 8 * z, 3 * z, C('#ffd873'));                // Gold schaut heraus
  circle(cx - 3 * z, top - 2.5 * z, 1.6 * z, C('#fff0a8')); circle(cx + 2.5 * z, top - 2 * z, 1.4 * z, C('#f2c14e'));
  poly([[cx - 10 * z, top], [cx, top - 5 * z], [cx + 1 * z, top - 12 * z], [cx - 9 * z, top - 7 * z]], C('#a06b3f'));   // Deckel, hinten hochgeklappt
  poly([[cx, top - 5 * z], [cx + 10 * z, top], [cx + 11 * z, top - 7 * z], [cx + 1 * z, top - 12 * z]], C('#7a4c2a'));
  g.strokeStyle = C('#e2b448'); g.lineWidth = 1.2 * z;
  g.beginPath(); g.moveTo(cx - 9.5 * z, top - 3.5 * z); g.lineTo(cx + 0.5 * z, top - 8.5 * z); g.lineTo(cx + 10.5 * z, top - 3.5 * z); g.stroke();
  diamond(cx, cy + 1.2 * z, 1.6 * z, 1.2 * z, C('#e2b448'));                // Schloss
  glowQuad([[cx - 6 * z, top - 5 * z], [cx + 6 * z, top - 5 * z], [cx + 6 * z, top + 1 * z], [cx - 6 * z, top + 1 * z]], 30 * z);
  const tw = Math.sin(now / 380 + cx * 0.07);
  if (tw > 0.6) {                                                         // funkeln
    const s = 3 * z * (tw - 0.6) * 2.5, sx = cx + 4 * z, sy = top - 6 * z;
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx, sy + s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx, sy - s * 0.3); g.closePath(); g.fill();
  }
}
function drawTrophy(cx, cy, z, now, [base, light, dark]) {
  ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,40,40,0.15)');
  box(cx, cy, 4.6 * z, 2.4 * z, 5 * z, '#5a4636', '#6f5745', 0);
  poly([[cx - 3.2 * z, cy - 5 * z], [cx + 3.2 * z, cy - 5 * z], [cx + 1.1 * z, cy - 8 * z], [cx - 1.1 * z, cy - 8 * z]], C(dark));
  g.fillStyle = C(base); g.fillRect(cx - 0.9 * z, cy - 12 * z, 1.8 * z, 4.5 * z);
  g.strokeStyle = C(dark); g.lineWidth = 1.3 * z;
  g.beginPath(); g.arc(cx - 5.4 * z, cy - 17 * z, 2.3 * z, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
  g.beginPath(); g.arc(cx + 5.4 * z, cy - 17 * z, 2.3 * z, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
  g.beginPath(); g.moveTo(cx - 5.6 * z, cy - 20 * z);
  g.quadraticCurveTo(cx - 5.2 * z, cy - 11.2 * z, cx, cy - 11.5 * z); g.quadraticCurveTo(cx + 5.2 * z, cy - 11.2 * z, cx + 5.6 * z, cy - 20 * z);
  g.closePath(); g.fillStyle = C(base); g.fill();
  ellipse(cx, cy - 20 * z, 5.6 * z, 1.6 * z, C(dark));
  poly([[cx - 3.8 * z, cy - 19 * z], [cx - 2.6 * z, cy - 19 * z], [cx - 2.2 * z, cy - 14 * z], [cx - 3 * z, cy - 14 * z]], C(light));
  const tw = Math.sin(now / 450 + cx * 0.1);
  if (tw > 0.75) {
    const s = 2.4 * z * (tw - 0.75) * 4, sx = cx + 3.4 * z, sy = cy - 19 * z;
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx, sy + s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx, sy - s * 0.3); g.closePath(); g.fill();
  }
}
// Was kleine Deko abhängig vom Platz zeichnet (Block 124): Bildchen weit weg teilen sich alle mit gleicher Variante – Bäume nach
// Fruchtfarbe, Blumentöpfe nach Blütenfolge, Busch nur nach Farbe (steht schon im Schlüssel). Wer etwas Neues vom Platz abhängig
// zeichnet, nimmt es hier auf (sonst sähen alle gleich aus). Riesenblume: je Platz (Farbe hängt am Seed der Welt)
const TREE_FRUIT = ['#ff6b5e', '#ffb13b', '#b07ad6', '#ff8fb1'];
const treeFruitOf = (x, y, s) => { const h = hash(x, y, 40 + s); return h < 0.4 ? 0 : h < 0.7 ? 1 : h < 0.85 ? 2 : 3; };
const potOf = (x, y, s) => Math.floor(hash(x, y, 7 + s) * 5);
const decoVariant = (b, x, y, s) => { b = baseOf(b); return b === 'baum' ? 'f' + treeFruitOf(x, y, s) : b === 'blumentopf' ? 'p' + potOf(x, y, s) : b === 'riesenblume' ? `${x},${y},${s},${state.seed}` : b === 'souvenir' ? 'sv' + svVariant(x, y, s) : ''; };   // Souvenir: Art, Farbe, Flagge, Tier (Block 129)
function drawSmallOne(b, rot, sx, sy, z, now, x, y, sc, slot = 0, col = 0, form = 0) {
  if (SPRITES_ON && sc === 1 && g === ctx && spriteOk(b) && spriteSmall(b, rot, sx, sy, z, now, x, y, slot, col, form)) return;   // weit weg: Bildchen (render.js); nah Bewegtes live
  const s = decoScale(b) * 0.9 * sc;
  const live = () => {
    g.save(); g.translate(sx, sy); g.scale((rot & 1) && MIRROR.has(b) ? -s : s, s);
    drawObject(b, 0, 0, z, now, x, y, 1, { rot, slot, col, form });
    g.restore();
  };
  if (GLPASS && g === ctx) glLive(sx, sy, 30 * z * s, 100 * z * s, 30 * z * s, 14 * z * s, live); else live();   // GL-Bild: in die Sammelfläche (Block 144)
}
function drawSmall(k, px, py, z, now, x, y, which) {
  const ds = state.decos.get(k);
  if (!ds) return;
  for (const i of which) {
    const d = ds[i];
    if (!d) continue;
    const [u, v] = slotPos(x, y, i, d);
    let sc = 1;
    if (d.born) { const a = (now - d.born) / 380; if (a < 1) sc = 0.5 + 0.5 * Math.sin(a * Math.PI / 2); }
    drawSmallOne(d.b, d.rot || 0, px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z, z, now, x, y, sc, i, d.col || 0, d.form || 0);
  }
}

// Farben wählbar (Block 72): „Turm“ = Mast, Gondel, Sockel; „Flügel“ = Flügel (Turbine: Holzschraube), Ring und Spitzen
const WIND_PAINT = {
  names: ['Turm', 'Flügel'],
  wall: ['#f4f4f4', '#f6f6f4', ['#dedbd4', -0.1], ['#e9e6df', -0.05], ['#e3ddd1', -0.08],
    ['#454b57', -0.22], ['#353a44', -0.34], ['#2e323b', -0.42], ['#3b404b', -0.3]],
  roof: ['#ffffff', '#e0bb7e', ['#e8604f', -0.18]],
};
REPAINT.windrad = WIND_PAINT; REPAINT.offshore = WIND_PAINT;
Object.assign(REPAINT, {                           // Deko-Bauten (Block 72)
  leuchtturm: { names: ['Turm', 'Streifen'], wall: ['#ffffff'], roof: ['#e8604f'] },
  uhrturm: { wall: ['#f3e1c4'], roof: ['#6f8fd8'] },
  karussell: { names: ['Boden', 'Zeltdach'], wall: ['#f3e1c4', '#c9a26f'], roof: ['#e8604f'] },
  pavillon: { names: ['Säulen', 'Dach'], wall: ['#ffffff', '#efe6d8'], roof: ['#8fd0c3', '#6fb8aa'] },
  brunnen: { names: ['Becken'], wall: ['#d2d5de', '#aeb2bd', '#c9ccd6'] },
});
// Windturbine (Stufe 3 des Windrads): senkrechte Achse, drei gedrehte Holzflügel um einen dunklen Mast, Streben, Lagerring.
// Hintere Flügelstücke vor dem Mast zeichnen, vordere danach.
function drawHelixTurbine(cx, cy, z, now) {
  const H = 54, h0 = 15, h1 = 47, R = 13, twist = Math.PI * 0.8, n = 16, ph = now / 1100, flat = 0.42, wide = 0.35, band = 6;   // band: Breite des Flügels in der Höhe
  const P = (a, h, r) => [cx + Math.cos(a) * r * z, cy - h * z + Math.sin(a) * r * flat * z];
  const rad = t => R * (0.72 + 0.28 * Math.sin(Math.PI * t));             // oben und unten etwas eingezogen
  ellipse(cx, cy + 1 * z, 9 * z, 4 * z, 'rgba(40,60,20,0.15)');
  box(cx, cy, 5 * z, 2.6 * z, 3 * z, '#d9d3c6', null, 0);                          // Sockel
  const segs = [];
  for (let i = 0; i < 3; i++) for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n, a0 = ph + i * Math.PI * 2 / 3 + t0 * twist, a1 = ph + i * Math.PI * 2 / 3 + t1 * twist;
    const hA = h0 + (h1 - h0) * t0, hB = h0 + (h1 - h0) * t1;
    const q = [P(a0, hA, rad(t0)), P(a1, hB, rad(t1)), P(a1 - wide, hB + band, rad(t1)), P(a0 - wide, hA + band, rad(t0))];   // Band quer zur Schraube
    const mid = (a0 + a1 - wide) / 2, front = Math.sin(mid) > 0;
    segs.push({ q, front, depth: Math.sin(mid), shade: 0.12 * Math.cos(mid) - (front ? 0 : 0.14) });
  }
  const paint = list => list.sort((A, B) => A.depth - B.depth).forEach(S => { const col = C(shade('#e0bb7e', S.shade)); poly(S.q, col); g.strokeStyle = col; g.lineWidth = 0.6; g.stroke(); });
  const arms = front => {                                                            // Streben vom Mast zu den Flügeln
    g.strokeStyle = C('#3b404b'); g.lineWidth = 1.1 * z; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < 3; i++) for (const t of [0.12, 0.5, 0.88]) {
      const a = ph + i * Math.PI * 2 / 3 + t * twist - wide / 2;
      if ((Math.sin(a) > 0) !== front) continue;
      const h = h0 + (h1 - h0) * t + band / 2; g.moveTo(cx, cy - h * z); g.lineTo(...P(a, h, rad(t) * 0.96));
    }
    g.stroke();
  };
  paint(segs.filter(S => !S.front)); arms(false);
  poly([[cx - 1.8 * z, cy - 3 * z], [cx + 1.8 * z, cy - 3 * z], [cx + 1.5 * z, cy - H * z], [cx - 1.5 * z, cy - H * z]], C('#454b57'));   // Mast
  poly([[cx, cy - 3 * z], [cx + 1.8 * z, cy - 3 * z], [cx + 1.5 * z, cy - H * z], [cx, cy - H * z]], C('#353a44'));
  const my = cy - (h0 + (h1 - h0) * 0.5) * z;                                         // Lagerring
  ellipse(cx, my, 3.2 * z, 1.4 * z, C('#b9bcc2')); ellipse(cx, my - 1.6 * z, 3.2 * z, 1.4 * z, C('#d5d8dd'));
  arms(true); paint(segs.filter(S => S.front));
  ellipse(cx, cy - H * z, 1.3 * z, 0.6 * z, C('#2e323b'));                             // Kappe
  if (night > 0.15 && isLive() && Math.floor(now / 700) % 2 === 0) {                   // Warnlicht nachts
    circle(cx, cy - (H + 1.2) * z, 1.1 * z, '#ff4a3d'); glowQuad([[cx - 1 * z, cy - (H + 2) * z], [cx + 1 * z, cy - (H + 2) * z], [cx + 1 * z, cy - H * z], [cx - 1 * z, cy - H * z]], 12 * z);
  }
}
const ICON_SPRITES = new Map();               // weit weg (Block 124): ✨/🐌/💭 als fertiges Bildchen je Zoomstufe statt Kreise + Emoji-Schrift
let iconPaint = false;
function drawStatusIcon(cx, cy, z, icon, now) {
  const bob = Math.sin(now / 300) * 1.5 * z, x = cx - 10 * z, y = cy - 34 * z + bob, r = 6.5 * z;
  if (SPRITES_ON && g === ctx && !iconPaint) {
    const zs = zoomStep(z), key = icon + '|' + zs + '|' + DPR;
    let c = ICON_SPRITES.get(key);
    if (!c) {
      const R = Math.ceil(8 * zs + 2), cv = document.createElement('canvas'), cx2 = cv.getContext('2d');
      cv.width = cv.height = Math.ceil(2 * R * DPR);
      if (cx2) {
        const prev = g; g = cx2; iconPaint = true;
        try { g.setTransform(DPR, 0, 0, DPR, R * DPR, R * DPR); drawStatusIcon(10 * zs, 34 * zs, zs, icon, 0); } finally { g = prev; iconPaint = false; }
        c = { c: cv, R, zs }; ICON_SPRITES.set(key, c);
      }
    }
    if (c) { const k = z / c.zs; g.drawImage(c.c, x - c.R * k, y - c.R * k, 2 * c.R * k, 2 * c.R * k); return; }
  }
  circle(x, y + 1.5, r, 'rgba(107,79,58,0.3)');
  circle(x, y, r, '#fffaf0');
  g.font = `${8 * z}px system-ui, sans-serif`;
  g.textBaseline = 'middle';
  centerText(icon, x, y + 0.5 * z);
}

// ---------------------------------------------------------------------------
// Märchenschloss (Block 60g/60h): EIN Gebäude aus Sockel, Mittelbau, Flügeln und Türmen – alles aus csOf(t) berechnet.
// Im eigenen Rahmen: a nach vorn (Portal), b quer. Alle Teile liegen in b nebeneinander, ohne sich zu überlappen (Türme
// werden schlanker, wenn es eng wird – castleTowers), darum genügt es, sie nach b zum Betrachter hin zu sortieren.
// ---------------------------------------------------------------------------
const CASTLE_FLAG_SETS = [['#e8604f', '#f2c14e', '#e8604f', '#5f8fe8'], ['#e8604f'], ['#5f8fe8'], ['#f2c14e'], ['#fffaf0'], ['#58b36a']];   // bunt, rot, blau, gold, weiß, grün
const CASTLE_BULBS = ['#ffd873', '#ff8fa3', '#8fd3ff', '#b6f09c'];
const CT_R = [0.2, 0.28, 0.38], CT_H = [12, 24, 38, 54, 74], CM_R = [0.24, 0.34, 0.44], CM_H = [0, 20, 36, 56, 82];
// Türme einer Seite (+b), von innen nach außen: { pos, r } – der äußerste steht an der Ecke, Platz übrig: Flügel dazwischen
function castleTowers(c) {
  const n = c.tw.length;
  if (!n) return [];
  const L0 = csCore(c) / 2 + 0.04, avail = c.w / 2 - 0.04 - L0;
  let rs = c.tw.map(o => CT_R[o.k]);
  const need = rs.reduce((s, r) => s + 2 * r, 0);
  if (need > avail) rs = rs.map(r => r * avail / need);
  const gap = Math.max(0, avail - rs.reduce((s, r) => s + 2 * r, 0)) / n;
  let at = L0;
  return rs.map(r => { at += gap; const pos = at + r; at += 2 * r; return { pos, r }; });
}
// Bausteine fürs Schloss (Block 60h/60i/60j) – Märchenschloss und Wunder-Schloss teilen sie.
// o: { wall, roof, win, gold, flags, lit, bk (Balkone), lc (Lichterketten), wp (Wappen) }
function castleKit(K, z, now, x, o) {
  const { wall, roof, win, gold, flags, lit } = o;
  // Fenster (Block 75): wenige … ganz viele – je Wand mehr oder weniger, in Türmen enger oder weiter übereinander
  const WF = [0.6, 1, 1.5, 2][o.wn != null ? o.wn : 1], WS = [18, 13, 10, 8][o.wn != null ? o.wn : 1];
  const winRows = (lift, H) => { const out = []; for (let h0 = (lift ? 6 : 8); h0 + 6 < H - 9; h0 += WS) out.push(h0); return out; };
  // Balkon auf Höhe einer Fensterreihe (die Fenster dort werden zu Balkontüren): Platte knapp darunter
  const balconyAt = (lift, H) => { const rows = winRows(lift, H); return rows.length > 1 ? rows[Math.min(rows.length - 1, Math.max(1, Math.round(rows.length * 0.5)))] - 1.6 : null; };
  const archWins = (F, n, h0, h1, skip, q = 0.22) => {   // Rundbogenfenster in einer Reihe (q: halbe Breite im Abschnitt)
    if (!F) return;
    n = Math.max(1, Math.round(n * WF));
    const step = 0.84 / n;
    for (let i = 0; i < n; i++) {
      if (skip && skip(i, n)) continue;
      const t0 = 0.08 + step * (i + 0.5 - q), t1 = 0.08 + step * (i + 0.5 + q), A = lerp(F.P, F.Q, t0), B = lerp(F.P, F.Q, t1);
      faceQuad(F.P, F.Q, t0, t1, h0 * z, h1 * z, win);
      circle((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - h1 * z, Math.hypot(B[0] - A[0], B[1] - A[1]) / 2, win);
    }
  };
  const faceLen = (B, side) => (side === 'front' || side === 'back' ? 2 * B.hb : 2 * B.ha);
  const merlons = (B, n0 = 5, mh = 3.2) => {            // Zinnen über den sichtbaren Wänden (mh: Höhe)
    for (const side of ['front', 'back', 'left', 'right']) {
      const F = B.faces[side];
      if (!F) continue;
      const n = Math.max(3, Math.round(faceLen(B, side) * n0) | 1), col = K.wallCol(shade(wall, -0.04), F.n);
      for (let i = 0; i < n; i += 2) faceQuad(F.P, F.Q, i / n, (i + 1) / n, F.H, F.H + mh * z, col);
    }
  };
  const flag = (px, py, i) => {
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 10 * z); g.stroke();
    poly([[px, py - 10 * z], [px + 7 * z, py - 8.5 * z + Math.sin(now / 280 + i * 1.7 + x) * 1.2 * z], [px, py - 7 * z]], C(flags[i % flags.length]));
  };
  // Lichterkette an der Oberkante der sichtbaren Wände (Block 60i), nachts leuchtend
  const bulbs = (B, up = 1.5) => {
    if (!o.lc) return;
    for (const side of ['front', 'back', 'left', 'right']) {
      const F = B.faces[side];
      if (!F) continue;
      const n = Math.max(4, Math.round(faceLen(B, side) * 8));
      for (let i = 0; i < n; i++) {
        const tt = (i + 0.5) / n, sag = Math.sin(((tt * n) % 2) / 2 * Math.PI) * 1.4, [px, py] = lerp(F.P, F.Q, tt), yy = py - F.H + (up + sag) * z, col = CASTLE_BULBS[i % 4];
        if (lit) { circle(px, yy, 1.5 * z, col); glowQuad([[px - 1, yy - 1], [px + 1, yy - 1], [px + 1, yy + 1], [px - 1, yy + 1]], 5 * z); }
        else circle(px, yy, 0.9 * z, C(col));
      }
    }
  };
  const onion = (a, b, r, up, i, withFlag = true) => {   // Zwiebelkuppel mit goldener Spitze
    const [px, py] = K.P(a, b, up), w = r * Math.SQRT2 * TW / 2 * z, h = r * 80 * z;
    const shape = (s, col) => { g.beginPath(); g.moveTo(px - w * s, py); g.bezierCurveTo(px - w * 1.4 * s, py - h * 0.5, px - w * 0.2 * s, py - h * 0.72, px, py - h); g.bezierCurveTo(px + w * 0.2 * s, py - h * 0.72, px + w * 1.4 * s, py - h * 0.5, px + w * s, py); g.closePath(); g.fillStyle = col; g.fill(); };
    shape(1, C(shade(roof, -0.12))); shape(0.62, C(roof));
    g.beginPath(); g.ellipse(px - w * 0.3, py - h * 0.45, w * 0.18, h * 0.16, 0, 0, Math.PI * 2); g.fillStyle = C(shade(roof, 0.28)); g.fill();
    circle(px, py - h - 1.5 * z, 1.6 * z, C(gold));
    if (withFlag) flag(px, py - h - 2 * z, i);
    return [px, py - h - 2 * z];
  };
  // Balkon bzw. Kranz rund um einen Turm (Block 75): Platte mit Unterkante bei up, steht w (Felder) vor, Stabgeländer und
  // Handlauf. back: der Teil hinter dem Turm (vor dem Turm zeichnen – ragt seitlich vorbei), sonst der vordere mit Kante
  // und Konsolen (brackets). Eckig wie rund; Balkone der Türme und die Kränze am Hauptturm nutzen ihn gleich.
  // Band um einen runden Turm (Block 75): Fläche zwischen zwei Ellipsenbögen, überall gleich hoch – ein Strich liefe an den
  // Seiten spitz aus. back: die hintere Hälfte. Licht von links wie der Turm.
  const arcBand = (cx, cy, rx, ry, h0, h1, col, back) => {
    const [a0, a1] = back ? [Math.PI, 2 * Math.PI] : [0, Math.PI], gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
    gr.addColorStop(0, C(shade(col, back ? -0.05 : 0.1))); gr.addColorStop(1, C(shade(col, back ? -0.2 : -0.18)));
    g.beginPath(); g.ellipse(cx, cy - h0 * z, rx, ry, 0, a0, a1); g.ellipse(cx, cy - h1 * z, rx, ry, 0, a1, a0, true); g.closePath();
    g.fillStyle = gr; g.fill();
  };
  const balconyRing = (a, b, r, up, back, round, w = 0.11, brackets = true) => {
    const stone = '#e3d6c2', rodC = C(shade(gold, back ? -0.12 : 0));
    if (round) {
      const [cx0, cy0] = K.P(a, b, 0), rx = r * Math.SQRT2 * TW / 2 * z, ry = r * Math.SQRT2 * TH / 2 * z, s2 = (r + w) / r;
      const top0 = cy0 - (up + 1.4) * z, bot0 = cy0 - up * z, [a0, a1] = back ? [Math.PI, 2 * Math.PI] : [0, Math.PI];
      if (!back) {
        if (brackets) for (let j = 1; j < 6; j++) {                                          // Konsolen unter der Platte
          const ph = -Math.PI / 2 + j * Math.PI / 6, wx = cx0 + rx * Math.sin(ph), wy = cy0 + ry * Math.cos(ph) - (up - 3.2) * z, ox = cx0 + rx * s2 * Math.sin(ph), oy = bot0 + ry * s2 * Math.cos(ph);
          poly([[wx - 0.6 * z, wy], [ox - 0.6 * z, oy], [ox + 0.6 * z, oy], [wx + 0.6 * z, wy]], C(shade(stone, -0.18)));
        }
        const gr = g.createLinearGradient(cx0 - rx * s2, 0, cx0 + rx * s2, 0); gr.addColorStop(0, C(shade(stone, 0.07))); gr.addColorStop(1, C(shade(stone, -0.15)));
        g.beginPath(); g.ellipse(cx0, bot0, rx * s2, ry * s2, 0, 0, Math.PI); g.ellipse(cx0, top0, rx * s2, ry * s2, 0, Math.PI, 0, true); g.closePath();
        g.fillStyle = gr; g.fill();                                                          // Kante
      }
      g.beginPath(); g.ellipse(cx0, top0, rx * s2, ry * s2, 0, a0, a1); g.ellipse(cx0, top0, rx, ry, 0, a1, a0, true); g.closePath();
      g.fillStyle = C(shade(stone, back ? 0.02 : 0.08)); g.fill();                        // Oberseite
      g.strokeStyle = rodC; g.lineWidth = 0.45 * z; g.beginPath();
      const nr = Math.max(8, Math.round((r + w) * 40));
      for (let j = 0; j <= nr; j++) { const ph = (back ? Math.PI / 2 : -Math.PI / 2) + j * Math.PI / nr, px = cx0 + rx * s2 * 0.97 * Math.sin(ph), py = top0 + ry * s2 * 0.97 * Math.cos(ph); g.moveTo(px, py); g.lineTo(px, py - 3.4 * z); }
      g.stroke();
      arcBand(cx0, cy0, rx * s2 * 0.97, ry * s2 * 0.97, up + 4.8, up + 5.6, gold, back);   // Handlauf
      return;
    }
    const e = r + w, sides = Object.keys(FACES).filter(sd => (K.facing(...FACES[sd].n) > 0.01) !== back);
    for (const side of sides) {
      const f = FACES[side], at = (s, k, h) => K.P(a + f.p[0] * s + (f.q[0] - f.p[0]) * s * k, b + f.p[1] * s + (f.q[1] - f.p[1]) * s * k, h);
      if (!back && brackets) for (const k of [0.2, 0.5, 0.8]) poly([at(r, k, up - 3.2), at(e, k, up), at(e, k + 0.03, up), at(r, k + 0.03, up - 3.2)], C(shade(stone, -0.18)));   // Konsolen
      poly([at(r, 0, up + 1.4), at(r, 1, up + 1.4), at(e, 1, up + 1.4), at(e, 0, up + 1.4)], C(shade(stone, back ? 0.02 : 0.08)));   // Oberseite
    }
    for (const side of sides) {
      const f = FACES[side], P = K.P(a + f.p[0] * e, b + f.p[1] * e), Q = K.P(a + f.q[0] * e, b + f.q[1] * e), sh = back ? -0.12 : side === 'front' || side === 'back' ? 0 : -0.12;
      if (!back) faceQuad(P, Q, 0, 1, up * z, (up + 1.4) * z, C(shade(stone, sh - 0.06)));   // Kante
      const nr = Math.max(6, Math.round(e * 30));
      for (let j = 0; j <= nr; j++) faceQuad(P, Q, j / nr - 0.01, j / nr + 0.01, (up + 1.4) * z, (up + 4.8) * z, rodC);   // Stäbe
      faceQuad(P, Q, 0, 1, (up + 4.8) * z, (up + 5.6) * z, C(shade(gold, sh)));       // Handlauf
    }
  };
  // Runder Turm (Block 74): Zylinder, Licht von links; Bogenfenster nach vorn, Kegeldach, Kuppel oder Zinnenkranz.
  // Gleiche Maße wie der eckige (r = halbe Seite), damit beide gleich wirken. Rückgabe: Spitze
  const roundTower = (a, b, r, H, lift, i, R, big, noFlag) => {
    const [cx0, cy0] = K.P(a, b, lift), rx = r * Math.SQRT2 * TW / 2 * z, ry = r * Math.SQRT2 * TH / 2 * z, top = cy0 - H * z;
    const lightX = (col, x0, x1, dark = LIGHT.side) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, C(shade(col, 0.07))); gr.addColorStop(0.42, C(col)); gr.addColorStop(1, C(shade(col, dark))); return gr; };
    const at = (phi, up) => [cx0 + rx * Math.sin(phi), cy0 + ry * Math.cos(phi) - up * z];   // phi = 0: genau nach vorn
    // Balkon rundum (Block 75): hinten zuerst (ragt seitlich am Turm vorbei), vorn nach dem Turm – mit Konsolen und Kante
    const bh = o.bk && !lift && H >= 34 ? balconyAt(lift, H) : null;
    const balcony = back => balconyRing(a, b, r, bh, back, true);
    if (bh != null) balcony(true);
    g.beginPath(); g.moveTo(cx0 - rx, top); g.lineTo(cx0 - rx, cy0); g.ellipse(cx0, cy0, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx0 + rx, top); g.closePath();
    g.fillStyle = lightX(wall, cx0 - rx, cx0 + rx); g.fill();
    const nw = Math.max(1, Math.round((r < 0.17 ? 1 : r < 0.3 ? 2 : 3) * WF)), ww = Math.min(1.6, 0.9 + r * 2) * z, spread = Math.min(0.8, 2.2 / nw);
    for (const h0 of winRows(lift, H)) for (let j = 0; j < nw; j++) {
      const phi = (j - (nw - 1) / 2) * spread, k = Math.cos(phi), [px, py] = at(phi, h0), hw = ww * k;
      g.fillStyle = win; g.fillRect(px - hw, py - 5 * z, 2 * hw, 5 * z);
      g.beginPath(); g.ellipse(px, py - 5 * z, hw, hw, 0, Math.PI, 0); g.fill();
    }
    if (R === 0) arcBand(cx0, cy0, rx, ry, H - 5.5, H - 4, gold);                        // goldenes Band (wie beim eckigen)
    if (bh != null) balcony(false);
    const cap = () => { g.beginPath(); g.ellipse(cx0, top, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = C(shade(wall, -0.08)); g.fill(); };
    const merlon = th => { const w = Math.max(0.6 * z, rx * 0.5 * Math.abs(Math.cos(th)) * (Math.PI * 2 / n) + 0.4 * z), px = cx0 + rx * Math.sin(th), py = top + ry * Math.cos(th); g.fillStyle = C(shade(wall, -0.04 + 0.08 * Math.sin(-th) * 0.5)); g.fillRect(px - w / 2, py - 3.2 * z, w, 3.2 * z); };
    const n = Math.max(6, Math.round(r * 32) & ~1);
    let peak = [cx0, top];
    if (R === 2) for (let k = 0; k < n; k++) { const th = k * Math.PI * 2 / n; if (Math.cos(th) < 0) merlon(th); }   // hintere Zinnen
    cap();
    if (R === 2) {
      for (let k = 0; k < n; k++) { const th = k * Math.PI * 2 / n; if (Math.cos(th) >= 0) merlon(th); }
      arcBand(cx0, cy0, rx, ry, H - 1.4, H, roof);                                        // Rand in Dachfarbe
      if (!noFlag) flag(cx0, top - 3 * z, i);
    }
    if (R === 1) peak = onion(a, b, r * 1.02, lift + H, i, !noFlag);
    if (R === 0) {
      const rX = rx * 1.14, rY = ry * 1.14, roofH = (20 + r * 60 + H * 0.06) * z;
      if (big) for (const ph of [-Math.PI / 2, Math.PI / 2]) {                             // Türmchen an den Seiten
        const px = cx0 + rx * 0.95 * Math.sin(ph); poly([[px - 2.6 * z, top], [px + 2.6 * z, top], [px, top - 11 * z]], C(shade(roof, -0.1))); circle(px, top - 11 * z, 0.8 * z, C(gold));
      }
      g.beginPath(); g.moveTo(cx0 - rX, top); g.lineTo(cx0, top - roofH); g.lineTo(cx0 + rX, top); g.ellipse(cx0, top, rX, rY, 0, 0, Math.PI); g.closePath();
      g.fillStyle = lightX(roof, cx0 - rX, cx0 + rX, LIGHT.roofShade); g.fill();
      peak = [cx0, top - roofH];
      circle(peak[0], peak[1], 1.3 * z, C(gold));
      if (!noFlag) flag(peak[0], peak[1], i);
    }
    return peak;
  };
  // Turm mit eigener Dachform R: Spitzdach, Kuppel oder Zinnen; lift: steht auf etwas (Mittelturm auf dem Mittelbau)
  // R < 0: Rohbau ohne Dach und Schmuck (Wunder-Baustelle); noFlag: oben kommt etwas anderes hin (Krone); round: rund
  // (Block 74). Rückgabe: Spitze
  const tower = (a, b, r, H, lift, i, R, big, noFlag, round) => {
    if (round) return roundTower(a, b, r, H, lift, i, R, big, noFlag);
    // Balkon rundum (Block 60i/75): hinten zuerst (ragt seitlich vorbei), vorn nach dem Turm – Konsolen, Platte, Kante, Stäbe
    const bh = o.bk && !lift && H >= 34 ? balconyAt(lift, H) : null;
    const balcony = back => balconyRing(a, b, r, bh, back, false);
    if (bh != null) balcony(true);
    const T = K.block({ a, b, ha: r, hb: r, h: H, lift, wall, roof: R === 0 ? roof : shade(wall, -0.08), roofH: R === 0 ? 20 + r * 60 + H * 0.06 : 0, type: R === 0 ? 'hip' : 'flat', trim: R === 1 || R < 0 ? null : roof });
    for (const side of ['front', 'back', 'left', 'right']) {
      const F = T.faces[side];
      if (!F) continue;
      for (const h0 of winRows(lift, H)) archWins(F, 1, h0, h0 + 5, null, Math.min(0.22, 0.06 / r) / Math.sqrt(WF));   // dicke Türme: kleine Fenster
      if (R === 0) faceQuad(F.P, F.Q, 0, 1, F.H - 5.5 * z, F.H - 4 * z, C(gold));                   // goldenes Band
    }
    if (bh != null) balcony(false);
    let peak = R === 0 ? T.peak : K.P(a, b, lift + H);
    if (R === 2) { merlons(T, 6); if (!noFlag) flag(peak[0], peak[1] - 3 * z, i); }
    if (R === 1) peak = onion(a, b, r * 1.02, lift + H, i, !noFlag);
    if (R === 0) {
      if (big) for (const [sa, sb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {      // Türmchen an den Ecken
        const [px, py] = K.P(a + sa * r * 0.92, b + sb * r * 0.92, lift + H); poly([[px - 2.6 * z, py], [px + 2.6 * z, py], [px, py - 11 * z]], C(shade(roof, -0.1))); circle(px, py - 11 * z, 0.8 * z, C(gold));
      }
      circle(peak[0], peak[1], 1.3 * z, C(gold));
      if (!noFlag) flag(peak[0], peak[1], i);
    }
    return peak;
  };
  // Wappen (Block 60i): Schild mit Krone, Herz oder Stern
  const shield = (px, py) => {
    const w = 3.4 * z, h = 8 * z, top = py - h / 2;
    poly([[px - w, top], [px + w, top], [px + w, top + h * 0.55], [px, top + h], [px - w, top + h * 0.55]], C(gold));
    poly([[px - w * 0.78, top + 0.8 * z], [px + w * 0.78, top + 0.8 * z], [px + w * 0.78, top + h * 0.53], [px, top + h - 1.2 * z], [px - w * 0.78, top + h * 0.53]], C(roof));
    const my = top + h * 0.42, sym = o.wp === 2 ? '#e8604f' : '#ffe9a8';
    if (o.wp === 1) poly([[px - 2.2 * z, my + 1.4 * z], [px - 2.2 * z, my - 1.2 * z], [px - 1.1 * z, my], [px, my - 1.8 * z], [px + 1.1 * z, my], [px + 2.2 * z, my - 1.2 * z], [px + 2.2 * z, my + 1.4 * z]], C(sym));
    if (o.wp === 2) { circle(px - 0.9 * z, my - 0.5 * z, 1.1 * z, C(sym)); circle(px + 0.9 * z, my - 0.5 * z, 1.1 * z, C(sym)); poly([[px - 2 * z, my - 0.1 * z], [px + 2 * z, my - 0.1 * z], [px, my + 2.2 * z]], C(sym)); }
    if (o.wp === 3) { const pts = []; for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = (k % 2 ? 0.9 : 2.2) * z; pts.push([px + Math.cos(an) * rr, my + Math.sin(an) * rr]); } poly(pts, C(sym)); }
  };
  return { archWins, faceLen, merlons, flag, bulbs, onion, tower, roundTower, shield, balconyRing };
}
function drawCastle(cx, cy, z, now, x, y, t) {
  const c = csOf(t), K = kit(cx, cy, z, t.rot), lit = night > 0.15 && isLive();
  const wall = fzCol(t, 'wall', '#f8e3ea'), roof = fzCol(t, 'roof', '#5f8fe8'), win = lit ? '#ffd873' : C(fzCol(t, 'win', '#a8dcff'));
  const gold = c.gd ? '#f2c14e' : shade(roof, 0.3), frame = c.gd ? '#c9962b' : shade(wall, -0.3), flags = CASTLE_FLAG_SETS[c.fc];
  const HA = c.d / 2, HB = c.w / 2, core = csCore(c);
  const stairD = c.ex ? 0.3 : 0, hW = 8 + c.wf * 7, hC = 14 + c.cf * 10, front = HA - 0.26 - stairD;   // Freitreppe: Bau rückt nach hinten
  const wd = Math.min(0.62 + 0.45 * (Math.min(c.d, 2) - 1), front + HA - 0.08), aW = front - wd / 2;
  const haC = Math.min(HA - 0.14 - stairD / 2, 0.86), aC = HA - 0.14 - stairD - haC;
  const { archWins, faceLen, merlons, flag, bulbs, onion, tower, shield, balconyRing } = castleKit(K, z, now, x, { wall, roof, win, gold, flags, lit, bk: c.bk, lc: c.lc, wp: c.wp, wn: c.wn });
  const wing = (b0, b1) => {
    const R = c.wr, B = K.block({ a: aW, b: (b0 + b1) / 2, ha: wd / 2, hb: (b1 - b0) / 2, h: hW, wall, roof: R === 2 ? shade(wall, -0.08) : roof, roofH: R === 0 ? 11 : R === 1 ? 8 : 0, type: R === 0 ? 'gable' : R === 1 ? 'hip' : 'flat', ridge: 'b', over: 1.06, trim: R === 2 ? roof : shade(roof, 0.15) });
    for (const side of ['front', 'back', 'left', 'right']) { const F = B.faces[side]; if (F) { const n = Math.max(1, Math.round(faceLen(B, side) * 2.4)); for (let f = 0; f < c.wf; f++) archWins(F, n, 4 + f * 7, 8.2 + f * 7); } }
    if (R === 2) merlons(B);
    bulbs(B, R === 2 ? 0 : 1.5);
    if (c.bk && B.faces.front && b1 - b0 > 0.7) {      // Erker vorn in der Mitte des Flügels (Block 60i)
      const E = K.block({ a: aW + wd / 2 + 0.07, b: (b0 + b1) / 2, ha: 0.08, hb: 0.15, h: 7, lift: hW * 0.4, wall, roof, roofH: 6, type: 'hip', trim: gold });
      archWins(E.faces.front, 1, 1.5, 5);
    }
  };
  // Portal auf der Vorderseite F (Rahmen, Tor, darüber Rosette oder Wappen); dB: Torschwelle, Höhe h der Wand
  const portal = (F, dB, h) => {
    const dT = dB + 12, emb = dT + 9, rose = emb + 4.6 <= h;
    faceQuad(F.P, F.Q, 0.39, 0.61, dB * z, dT * z, C(frame));
    const A = lerp(F.P, F.Q, 0.39), Bq = lerp(F.P, F.Q, 0.61), rr = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) / 2;
    circle((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 - dT * z, rr, C(frame));
    faceQuad(F.P, F.Q, 0.42, 0.58, dB * z, (dT - 1) * z, C('#6b4630'));
    circle((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 - (dT - 1) * z, rr * 0.73, C('#6b4630'));
    if (rose) {
      faceQuad(F.P, F.Q, 0.32, 0.68, (dT + 2.5) * z, (dT + 4) * z, C(gold));
      const m = lerp(F.P, F.Q, 0.5);
      if (c.wp) shield(m[0], m[1] - emb * z);
      else { circle(m[0], m[1] - emb * z, 4.4 * z, C(gold)); circle(m[0], m[1] - emb * z, 3.4 * z, win); }
    }
    return rose;
  };
  // Freitreppe vor dem Portal (Block 60i), von unten nach oben; f0: Vorderkante des Baus
  const stairs = f0 => { if (c.ex) for (let k = 0; k < 3; k++) { const a1 = HA - 0.03 - k * 0.1; K.block({ a: (f0 + a1) / 2, b: 0, ha: (a1 - f0) / 2, hb: 0.34 - k * 0.04, h: 4 + k * 1.5, wall: '#efe6d8', roof: k === 2 ? '#e8604f' : '#f5eee2', type: 'flat' }); } };
  // Teile nach Tiefe zeichnen (hinten zuerst): [a, b, fn, Zusatz]
  const inOrder = items => items.sort((p, q) => K.depth(p[0], p[1]) + (p[3] || 0) - K.depth(q[0], q[1]) - (q[3] || 0)).forEach(p => p[2]());
  const round = !!c.mf;
  // Mittelbau als Block: Dachform deutlich (Block 74) – Spitz: Walmdach; Kuppel: Zwiebelkuppeln auf den Ecken;
  // Zinnen: hohe Zinnen und Ecktürmchen. Der Mittelturm steht obenauf.
  const center = () => {
    const R = c.cr, hip = R === 0, roofH = 12 + core * 4, rM = Math.min(CM_R[c.mk], haC - 0.04, core / 2 - 0.08);
    const dB = c.ex ? 7 : 0;
    const items = [[aC, 0, () => {
      const B = K.block({ a: aC, b: 0, ha: haC, hb: core / 2, h: hC, wall, roof: hip ? roof : shade(wall, -0.08), roofH, type: hip ? 'hip' : 'flat', trim: R === 2 ? roof : hip ? shade(roof, 0.15) : null });
      let rose = true;
      for (const side of ['front', 'back', 'left', 'right']) {
        const F = B.faces[side];
        if (!F) continue;
        const n = Math.max(3, Math.round(faceLen(B, side) * 2.2)), mid = side === 'front', ros = dB + 21 + 4.6 <= hC;
        for (let f = 0; f < c.cf; f++) archWins(F, n, 5 + f * 10, 11 + f * 10, (i, m) => mid && (f === 0 || (f === 1 && (ros || c.ex)) || (f === 2 && c.ex && ros)) && Math.abs(i - (m - 1) / 2) < (f ? 0.6 : 1));
        if (mid) rose = portal(F, dB, hC);
      }
      if (R === 2) merlons(B, 5, 4.6);
      bulbs(B, R === 2 ? 0 : 1.5);
      stairs(aC + haC);
      if (c.wp && !rose && B.faces.front) { const m = lerp(B.faces.front.P, B.faces.front.Q, 0.5); shield(m[0], m[1] - (hC + 7) * z); }   // zu niedrig: Wappen auf dem Dachrand
      if (!c.m && R === 0) flag(...B.peak, 0);
    }]];
    const ea = haC - 0.15, eb = core / 2 - 0.15;
    if (R !== 0) for (const sa of [-1, 1]) for (const sb of [-1, 1]) {                  // Ecken: Kuppeln bzw. Türmchen
      const a = aC + sa * ea, b = sb * eb;
      items.push([a, b, R === 1 ? () => onion(a, b, 0.23, hC, 0, false) : () => tower(a, b, 0.15, hC + 13, 0, 0, 2, false, true, round), 0.01]);
    }
    if (c.m) items.push([aC, 0, () => tower(aC, 0, rM, CM_H[c.m], hip ? hC + roofH * Math.max(0, 1 - rM / Math.min(haC, core / 2)) : hC, 0, c.mr, true, false, round), 0.005]);
    else if (R === 1) items.push([aC, 0, () => onion(aC, 0, Math.min(haC, core / 2) * 0.62, hC, 0), 0.005]);
    else if (R === 2) items.push([aC, 0, () => flag(...K.P(aC, 0, hC), 0), 0.005]);
    inOrder(items);
  };
  // Mittelbau als Turmgruppe (Block 74, wie ein Märchenschloss): vorn ein niedriger Torbau mit Portal und zwei Türmchen,
  // dahinter der Hauptturm vom Boden aus in Stufen (oben schlanker, Kranz an jedem Absatz), ringsum kleinere Türme
  const group = () => {
    const R = c.cr, m = Math.max(1, c.m), hT = 10 + c.cf * 6, dB = c.ex ? 7 : 0;
    const haT = Math.min(0.24, haC), aT = HA - 0.14 - stairD - haT, bT = Math.min(core / 2 - 0.06, 0.3 + c.cb * 0.1);
    const rM = Math.min(CM_R[c.mk], core / 2 - 0.12), Htot = hC + CM_H[m] + 26, aM = Math.max(-HA + rM + 0.04, aT - haT - rM * 0.45);
    const items = [[aM, 0, () => {
      const n = m >= 3 ? 3 : 2, fr = n === 3 ? [0.46, 0.3, 0.24] : [0.58, 0.42], rr = [1, 0.8, 0.64];
      let lift = 0;
      for (let s = 0; s < n; s++) {                                                     // Kranz am Absatz: wie ein Balkon (Block 75)
        const H = Htot * fr[s], last = s === n - 1, r = rM * rr[s], w = s ? rM * rr[s - 1] + 0.07 - r : 0;
        if (s) balconyRing(aM, 0, r, lift - 1, true, round, w, false);
        tower(aM, 0, r, H, lift, 0, last ? c.mr : -1, last, false, round);
        if (s) balconyRing(aM, 0, r, lift - 1, false, round, w, false);
        lift += H;
      }
    }]];
    const sats = c.cb === 0 ? 2 : 4;                                                      // Nebentürme, gestaffelt
    for (let k = 0; k < sats; k++) {
      const sg = k % 2 ? 1 : -1, far = k >= 2, rS = rM * (far ? 0.46 : 0.6), bS = sg * Math.min(core / 2 - rS - 0.02, rM * 0.75 + rS * (far ? 2.4 : 0.9));
      const aS = aM + (far ? 0.14 : -0.06);
      items.push([aS, bS, () => tower(aS, bS, rS, Htot * (far ? 0.42 : 0.62), 0, k + 1, c.mr, false, false, round)]);
    }
    items.push([aT, 0, () => {                                                            // Torbau
      const hip = R === 0, B = K.block({ a: aT, b: 0, ha: haT, hb: bT, h: hT, wall, roof: hip ? roof : shade(wall, -0.08), roofH: 8, type: hip ? 'hip' : 'flat', trim: R === 2 ? roof : hip ? shade(roof, 0.15) : null });
      let rose = true;
      for (const side of ['front', 'back', 'left', 'right']) {
        const F = B.faces[side];
        if (!F) continue;
        if (side === 'front') { rose = portal(F, dB, hT); for (let f = 1; f < c.cf; f++) archWins(F, 4, 5 + f * 6, 9 + f * 6, (i, m) => Math.abs(i - (m - 1) / 2) < m * 0.22); }
        else for (let f = 0; f < c.cf; f++) archWins(F, Math.max(1, Math.round(faceLen(B, side) * 2.2)), 4 + f * 6, 8 + f * 6);
      }
      if (R === 2) merlons(B, 5, 4.6);
      bulbs(B, R === 2 ? 0 : 1.5);
      stairs(aT + haT);
      if (c.wp && !rose && B.faces.front) { const mm = lerp(B.faces.front.P, B.faces.front.Q, 0.5); shield(mm[0], mm[1] - (hT + 6) * z); }
    }]);
    for (const sg of [-1, 1]) {                                                           // zwei Türmchen am Torbau
      const a = aT + haT - 0.1, b = sg * (bT - 0.02);
      items.push([a, b, () => tower(a, b, 0.11, hT + 10, 0, 5 + sg, R, false, false, round), 0.02]);
    }
    inOrder(items);
  };
  // Umgebung (Block 60i): ein Feld rundum – Weg zum Tor, Wassergraben mit Zugbrücke, Beete; Mauer und Brunnen stehen auf
  // ihrer Seite vor oder hinter dem Schloss (pre/post)
  const groundLk = c.gp && isWegStyle(c.gp) && !pathLook(c.gp).stones ? pathLook(c.gp) : PATH_LOOK.platten;   // Belag (Block 76b)
  const RG = csRing(c), OA = HA + RG, OB = HB + RG, pre = [], post = [], tvB = K.facing(0, 1);
  const place = (a, b, fn) => (a > HA ? post : a < -HA ? pre : b * tvB > 0 ? post : pre).push([a, b, fn]);
  if (RG) {
    const mo = 0.32, gIn = c.mo ? mo + 0.06 : 0.06;
    if (c.gb) { K.rect(HA - 0.03, -0.18, OA - 0.02, 0.18, C(groundLk.edge)); kPave(K, () => kRectPath(K, HA - 0.03, -0.15, OA - 0.02, 0.15), groundLk, x, y, Math.max(OA, OB) + 1); }
    else K.rect(HA - 0.03, -0.16, OA - 0.02, 0.16, C('#e9d8b4'));                               // Weg vom Tor zum Portal (Belag wie der Boden)
    if (c.mo) {
      const water = C(lit ? '#3d6f99' : '#7cc4e8'), edge = C('#b9e3f5');
      for (const [a0, b0, a1, b1] of [[HA, -HB - mo, HA + mo, HB + mo], [-HA - mo, -HB - mo, -HA, HB + mo], [-HA, -HB - mo, HA, -HB], [-HA, HB, HA, HB + mo]]) K.rect(a0, b0, a1, b1, water);
      for (let k = 0; k < 6; k++) { const bb = -HB + (k + 0.5) * c.w / 6, ph = Math.sin(now / 700 + k) * 0.03; K.rect(HA + 0.12 + ph, bb - 0.12, HA + 0.15 + ph, bb + 0.12, edge); }
      K.rect(HA - 0.03, -0.17, HA + mo + 0.04, 0.17, C('#a8764c'), 1.2);                           // Zugbrücke
      for (let k = 1; k < 6; k++) { const aa = HA - 0.03 + k * (mo + 0.07) / 6; K.rect(aa - 0.006, -0.17, aa + 0.006, 0.17, C('#7d5537'), 1.25); }
      for (const sb of [-0.17, 0.17]) { const p0 = K.P(HA + mo + 0.02, sb, 1.2), p1 = K.P(HA - 0.03, sb, 14); g.strokeStyle = C('#4a4a58'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
    }
    if (c.gn) for (const sg of [-1, 1]) {                                                        // Beete links und rechts vom Weg
      const a0 = HA + gIn, a1 = OA - (c.mw ? 0.22 : 0.1), b0 = sg * 0.3, b1 = sg * (OB - (c.mw ? 0.25 : 0.12));
      if (a1 - a0 < 0.15) continue;
      K.rect(a0, Math.min(b0, b1), a1, Math.max(b0, b1), C('#a8764c'));
      for (let k = 0; k < 14; k++) { const aa = a0 + 0.05 + (a1 - a0 - 0.1) * ((k * 37) % 13) / 12, bb = b0 + (b1 - b0) * ((k * 53) % 14) / 13, [px, py] = K.P(aa, bb); circle(px, py - 0.8 * z, 0.9 * z, C(['#f7b2c8', '#ffd873', '#e8604f', '#fffaf0'][k % 4])); }
      place((a0 + a1) / 2, sg * (OB * 0.62), () => {                                              // Brunnen
        const [px, py] = K.P((a0 + a1) / 2, sg * (OB * 0.62));
        ellipse(px, py, 7 * z, 3.5 * z, C('#d9cbb3')); ellipse(px, py - 1.5 * z, 6 * z, 3 * z, C(lit ? '#3d6f99' : '#8fd3ff'));
        g.strokeStyle = C('#d9cbb3'); g.lineWidth = 1.6 * z; g.beginPath(); g.moveTo(px, py - 1.5 * z); g.lineTo(px, py - 6 * z); g.stroke();
        const jet = 1 + Math.sin(now / 250) * 0.15;
        for (const dx of [-1, 1]) { g.strokeStyle = 'rgba(190,230,255,0.85)'; g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(px, py - 6 * z); g.quadraticCurveTo(px + dx * 3 * z, py - 10 * z * jet, px + dx * 4.5 * z, py - 2 * z); g.stroke(); }
      });
      for (const aa of [-OA + 0.35, 0]) place(aa, sg * (OB - 0.38), () => kitTree(K, aa, sg * (OB - 0.38), 0.7));   // Bäume an den Seiten
    }
    if (c.mw) {                                                                                   // Mauer mit Torhaus vorn
      const stone = '#d9cbb3', e = 0.09, wallSeg = (a, b, ha, hb) => place(a, b, () => {
        const W = K.block({ a, b, ha, hb, h: 8, wall: stone, roof: shade(stone, -0.08), type: 'flat' });
        for (const side of ['front', 'back', 'left', 'right']) { const F = W.faces[side]; if (!F) continue; const n = Math.max(3, Math.round(faceLen(W, side) * 6) | 1); for (let k = 0; k < n; k += 2) faceQuad(F.P, F.Q, k / n, (k + 1) / n, F.H, F.H + 2.6 * z, K.wallCol(shade(stone, -0.04), F.n)); }
      });
      wallSeg(-OA + e, 0, e, OB - e);
      for (const sg of [-1, 1]) {
        wallSeg(0, sg * (OB - e), OA - 2 * e, e);
        wallSeg(OA - e, sg * (0.3 + (OB - 0.3) / 2), e, (OB - 0.3) / 2);
        place(OA - e, sg * 0.3, () => {                                                          // Torhaus: zwei Türmchen, Bogen
          K.block({ a: OA - e, b: sg * 0.3, ha: 0.12, hb: 0.12, h: 15, wall: stone, roof: roof, roofH: 9, type: 'hip', trim: gold });
          if (sg * tvB > 0) K.block({ a: OA - e, b: 0, ha: e * 0.8, hb: 0.18, h: 4, lift: 10, wall: stone, roof: shade(stone, -0.08), type: 'flat' });
        });
      }
    }
  }
  // Boden (Block 76): 0 Sockel (erhöhte Platte), 1 Rasen (Weg aus Steinplatten zum Portal), 2 Platz (gepflasterter Hof) –
  // darauf der rote Teppich (oder die Freitreppe) und zwei Laternen vor dem Portal
  const up0 = c.gb ? 0 : 3, A0 = -HA + 0.03, A1 = HA - 0.03, B1 = HB - 0.03;
  if (!c.gb) K.block({ a: 0, b: 0, ha: HA - 0.03, hb: HB - 0.03, h: 3, wall: '#e3d6c2', roof: '#efe6d8', type: 'flat' });
  else {                                                                                     // Belag wie ein Weg (Block 76b, cs.gp)
    const lk = groundLk, ext = Math.max(HA, HB) + 1;
    const pave = (a0, b0, a1, b1) => { K.rect(a0, b0, a1, b1, C(lk.edge)); kPave(K, () => kRectPath(K, a0 + 0.04, b0 + 0.04, a1 - 0.04, b1 - 0.04), lk, x, y, ext); };
    if (c.gb === 1) { K.rect(A0, -B1, A1, B1, C('#8fcf68')); pave(front - 0.08, -0.3, A1, 0.3); }   // Rasen, Weg zum Portal
    else pave(A0, -B1, A1, B1);                                                              // Platz
  }
  if (!c.ex) K.rect(front - 0.02, -0.17, HA - 0.03, 0.17, C('#e8604f'), up0 + 0.2);
  for (const sb of [-0.22, 0.22]) { const [px, py] = K.P(HA - 0.1, sb * (c.ex ? 1.75 : 1), up0); circle(px, py - 4 * z, 1.4 * z, C(gold)); g.strokeStyle = C(gold); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 4 * z); g.stroke(); }
  // Tiefes Schloss: hinten ein Schlossgarten mit Bäumen und Büschen (steht hinter allem, darum zuerst)
  const garden = aW - wd / 2 + HA;
  if (garden > 0.9) for (let b = -HB + 0.45, i = 0; b < HB - 0.3; b += 0.7, i++) {
    const a = -HA + garden / 2;
    if (Math.abs(b) < core / 2 + 0.25 && a > aC - haC - 0.3) continue;
    if (i % 2) kitBush(K, a, b, 1.1); else kitTree(K, a, b, 0.75);
  }
  // Teile in b-Abschnitten: Flügel zwischen Mittelbau, Türmen und Enden; Türme vorn, in der Fassade oder hinten
  const parts = [[0, c.mt ? group : center]], TW_ = castleTowers(c);
  for (const sg of [1, -1]) {
    let from = core / 2;
    TW_.forEach(({ pos, r }, i) => {
      const o = c.tw[i], b1 = pos - r, H = hW + CT_H[o.h];
      if (b1 - from > 0.05) { const f0 = from; parts.push([sg * (f0 + b1) / 2, () => wing(Math.min(sg * f0, sg * b1), Math.max(sg * f0, sg * b1))]); }
      const want = o.p === 0 ? front - r * 0.4 : o.p === 1 ? aW : aW - wd / 2 + r * 0.4;
      const a = Math.max(-HA + 0.03 + r, Math.min(HA - 0.03 - r, want));
      parts.push([sg * pos, () => tower(a, sg * pos, r, H, 0, i + 1, o.r, false, false, o.f)]);
      from = pos + r;
    });
    const b1 = HB - 0.06;
    if (b1 - from > 0.05) { const f0 = from; parts.push([sg * (f0 + b1) / 2, () => wing(Math.min(sg * f0, sg * b1), Math.max(sg * f0, sg * b1))]); }
  }
  const byDepth = (p, q) => K.depth(p[0], p[1]) - K.depth(q[0], q[1]);
  pre.sort(byDepth).forEach(p => p[2]());
  parts.sort((p, q) => p[0] * tvB - q[0] * tvB).forEach(p => p[1]());
  post.sort(byDepth).forEach(p => p[2]());
}
BIG_ART.fz_schloss = (cx, cy, z, now, x, y, lvl, t) => drawCastle(cx, cy, z, now, x, y, t);

// ---------------------------------------------------------------------------
// Leuchtturm-Kap (Block 83, 3×3): das Finale. Vorn (+a) das Meer: Felsen mit Brandung und ein Steg; hinten das Wärterhaus mit
// Garten; vorn rechts der hohe Turm (verjüngt, rote Streifen, Fenster in der Wendel), oben Galerie, Glaskammer mit Kuppel und
// Wetterfahne, Lichtstrahl (tags zart, nachts weit übers Meer). Von der Galerie hängen die 21 Laternen als drei Girlanden.
// Turm weiß / Streifen rot – über REPAINT umfärbbar (Turm/Streifen); das Wärterhaus nimmt dieselben Farben.
const LIGHT_LANTERNS = ['#ffd873', '#ff8fa3', '#8fd3ff', '#b6f09c', '#ffb36b', '#d6a6ff', '#fff2b8'];   // je Insel drei
BIG_ART.leuchtturm = (cx, cy, z, now, x, y, lvl, t) => {
  const K = kit(cx, cy, z, t.rot), lit = night > 0.15 && isLive(), wall = '#ffffff', roof = '#e8604f', gold = '#f2c14e', stone = '#d9d3c6';
  const ck = castleKit(K, z, now, x, { wall, roof, win: lit ? '#ffd873' : C('#a8dcff'), gold, flags: CASTLE_FLAG_SETS[0], lit, bk: 0, lc: 0, wp: 0 });
  const RX = r => r * Math.SQRT2 * TW / 2 * z, RY = r => r * Math.SQRT2 * TH / 2 * z;
  const AT = 0.5, BT = -0.5, R0 = 0.38, R1 = 0.27, H0 = 6, HT = 130;                // Turm: Mitte, Radius unten/oben, Sockel, Höhe
  const rAt = h => R0 + (R1 - R0) * Math.max(0, Math.min(1, (h - H0) / HT));
  const lightX = (col, x0, x1, dark = LIGHT.side) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, C(shade(col, 0.08))); gr.addColorStop(0.42, C(col)); gr.addColorStop(1, C(shade(col, dark))); return gr; };
  // --- Boden: Weg zum Turm, Garten, Brandung, Felsen, Steg ---------------------------------------------------------
  K.rect(-0.25, 0.5, AT + 0.1, 0.7, C('#ddd3bf'));                                   // Plattenweg vom Haus zum Turm
  K.rect(AT - 0.1, BT + 0.3, AT + 0.1, 0.7, C('#ddd3bf'));
  for (let i = 0; i < 6; i++) { const ph = (now / 1600 + i / 6) % 1, b0 = -1.5 + i * 0.5, al = (0.6 * (1 - ph)).toFixed(2);   // Brandung vor dem Kap
    const p0 = K.P(1.55 + ph * 0.25, b0), p1 = K.P(1.55 + ph * 0.25, b0 + 0.42); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = 1.2 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
  const rock = (a, b, s, k) => {                                                      // runder Fels, Licht von links
    const [px, py] = K.P(a, b), w = 9 * s * z, h = 6 * s * z, c = shade('#9b958a', (hash(x + k, y, 77) - 0.5) * 0.15);
    ellipse(px, py + 1 * z, w, h * 0.55, 'rgba(40,40,40,0.18)');
    g.beginPath(); g.ellipse(px, py - h * 0.3, w, h, 0, Math.PI, 0); g.lineTo(px + w, py); g.ellipse(px, py, w, h * 0.45, 0, 0, Math.PI); g.closePath();
    g.fillStyle = lightX(c, px - w, px + w, -0.25); g.fill();
    ellipse(px - w * 0.25, py - h * 0.85, w * 0.35, h * 0.22, C(shade(c, 0.18)));
  };
  const steg = () => {                                                                // Steg ins Meer (vorn links)
    const b0 = -1.05, b1 = -0.8;
    for (const a of [1.75, 2.15]) for (const b of [b0, b1]) { const [px, py] = K.P(a, b); g.strokeStyle = C('#6f5238'); g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(px, py + 3 * z); g.lineTo(px, py - 3 * z); g.stroke(); }
    K.rect(1.3, b0, 2.25, b1, C('#b08a5e'), 2.5);
    for (let a = 1.35; a < 2.25; a += 0.1) { const p0 = K.P(a, b0, 2.5), p1 = K.P(a, b1, 2.5); g.strokeStyle = C('#8a6440'); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
  };
  // --- Wärterhaus mit Garten ----------------------------------------------------------------------------------
  const house = () => {
    K.rect(-1.4, -0.3, -0.2, 1.4, C('#8fcf68'));                                      // Garten
    for (let i = 0; i < 9; i++) { const [px, py] = K.P(-1.3 + (i % 3) * 0.45, -0.15 + Math.floor(i / 3) * 0.12); circle(px, py - 1 * z, 1.1 * z, C(['#f7b2c8', '#ffd873', '#e8604f'][i % 3])); }
    const B = K.block({ a: -0.7, b: 0.65, ha: 0.42, hb: 0.5, h: 15, wall, roof, roofH: 12, type: 'gable', ridge: 'b', entry: true });
    K.door(B, 'front', 0.42, 0.58, 0.55);
    K.wins(B, 'front', 2, 0.35, 0.75, 0.1, 0.9, [1]); K.sideWins(B, 2, 0.35, 0.75);
    const [qx, qy] = K.P(-0.9, 0.45, 24); poly([[qx - 1.6 * z, qy], [qx + 1.6 * z, qy], [qx + 1.6 * z, qy - 6 * z], [qx - 1.6 * z, qy - 6 * z]], C('#b5654a'));   // Schornstein
    kitBush(K, -0.15, 1.3, 1.1); kitTree(K, -1.25, -0.95, 0.75); kitBush(K, -0.6, -1.25, 0.9);
  };
  // --- Turm -------------------------------------------------------------------------------------------------
  const [tx, ty] = K.P(AT, BT), Y = h => ty - h * z;
  const band = (h0, h1, col, back) => {                                               // Band um den verjüngten Turm
    const [a0, a1] = back ? [Math.PI, 2 * Math.PI] : [0, Math.PI], r0 = rAt(h0), r1 = rAt(h1), gr = g.createLinearGradient(tx - RX(r0), 0, tx + RX(r0), 0);
    gr.addColorStop(0, C(shade(col, 0.08))); gr.addColorStop(0.42, C(col)); gr.addColorStop(1, C(shade(col, LIGHT.side)));
    g.beginPath(); g.ellipse(tx, Y(h0), RX(r0), RY(r0), 0, a0, a1); g.ellipse(tx, Y(h1), RX(r1), RY(r1), 0, a1, a0, true); g.closePath(); g.fillStyle = gr; g.fill();
  };
  const tower = () => {
    ellipse(tx + 6 * z, ty + 2 * z, RX(R0 + 0.12), RY(R0 + 0.12), 'rgba(40,40,40,0.18)');   // Schatten
    const rs = R0 + 0.1;                                                               // Sockel aus Stein
    g.beginPath(); g.moveTo(tx - RX(rs), Y(H0)); g.lineTo(tx - RX(rs), ty); g.ellipse(tx, ty, RX(rs), RY(rs), 0, Math.PI, 0, true); g.lineTo(tx + RX(rs), Y(H0)); g.closePath();
    g.fillStyle = lightX(stone, tx - RX(rs), tx + RX(rs), -0.25); g.fill();
    g.beginPath(); g.ellipse(tx, Y(H0), RX(rs), RY(rs), 0, 0, Math.PI * 2); g.fillStyle = C(shade(stone, 0.1)); g.fill();
    const top = H0 + HT;                                                               // Turmschaft, nach oben schlanker
    g.beginPath(); g.moveTo(tx - RX(R1), Y(top)); g.lineTo(tx - RX(R0), Y(H0)); g.ellipse(tx, Y(H0), RX(R0), RY(R0), 0, Math.PI, 0, true); g.lineTo(tx + RX(R1), Y(top)); g.closePath();
    g.fillStyle = lightX(wall, tx - RX(R0), tx + RX(R0)); g.fill();
    for (let i = 0; i < 4; i++) { const h0 = H0 + 14 + i * 30; band(h0, h0 + 14, roof); }   // rote Streifen
    for (let i = 0; i < 6; i++) {                                                      // Fenster in der Wendel
      const h = H0 + 22 + i * 18, phi = (i % 2 ? 0.55 : -0.55), r = rAt(h), px = tx + RX(r) * Math.sin(phi), py = Y(h) + RY(r) * Math.cos(phi), hw = 1.3 * z * Math.cos(phi);
      g.fillStyle = lit ? '#ffd873' : C('#a8dcff'); g.fillRect(px - hw, py - 4.5 * z, 2 * hw, 4.5 * z); g.beginPath(); g.ellipse(px, py - 4.5 * z, hw, hw, 0, Math.PI, 0); g.fill();
      if (lit) glowQuad([[px - hw, py - 5 * z], [px + hw, py - 5 * z], [px + hw, py], [px - hw, py]], 8 * z);
    }
    const [dx0, dy0] = [tx, Y(H0) + RY(R0)];                                           // Tür
    g.fillStyle = C('#6b4630'); g.fillRect(dx0 - 2.2 * z, dy0 - 9 * z, 4.4 * z, 9 * z); g.beginPath(); g.ellipse(dx0, dy0 - 9 * z, 2.2 * z, 2.2 * z, 0, Math.PI, 0); g.fill();
    band(top - 3, top, shade(wall, -0.08));                                            // Kranz unter der Galerie
    // Galerie (hinten), Glaskammer, Kuppel, Galerie (vorn)
    const gUp = top, rg = R1 * 0.9, hg = 21, gTop = gUp + 2 + hg;
    ck.balconyRing(AT, BT, R1, gUp, true, true, 0.13, true);
    const gx0 = tx - RX(rg), gx1 = tx + RX(rg);
    g.beginPath(); g.moveTo(gx0, Y(gTop)); g.lineTo(gx0, Y(gUp + 2)); g.ellipse(tx, Y(gUp + 2), RX(rg), RY(rg), 0, Math.PI, 0, true); g.lineTo(gx1, Y(gTop)); g.closePath();
    const glass = g.createLinearGradient(gx0, 0, gx1, 0); glass.addColorStop(0, lit ? '#fff6c8' : C('#d8f2fb')); glass.addColorStop(0.5, lit ? '#ffe28a' : C('#bfe6f5')); glass.addColorStop(1, lit ? '#f2c14e' : C('#93c8de'));
    g.fillStyle = glass; g.fill();
    const lampY = Y(gUp + 2 + hg * 0.5);
    circle(tx, lampY, (lit ? 4.2 : 3) * z, lit ? '#fffbe6' : C('#fff3b0'));            // Lampe
    g.strokeStyle = C('#4a4a58'); g.lineWidth = 0.8 * z; g.beginPath();                // Sprossen
    for (const ph of [-1.1, -0.4, 0.3, 1.0]) { const px = tx + RX(rg) * Math.sin(ph), py = RY(rg) * Math.cos(ph); g.moveTo(px, Y(gUp + 2) + py); g.lineTo(px, Y(gTop) + py); }
    g.stroke();
    const rd = rg * 1.18, dome = 15;                                                   // Kuppel mit Rand
    g.beginPath(); g.ellipse(tx, Y(gTop), RX(rd), RY(rd), 0, 0, Math.PI * 2); g.fillStyle = C(shade(roof, -0.15)); g.fill();
    g.beginPath(); g.moveTo(tx - RX(rd) * 0.95, Y(gTop)); g.bezierCurveTo(tx - RX(rd) * 0.95, Y(gTop + dome * 0.9), tx - RX(rd) * 0.3, Y(gTop + dome), tx, Y(gTop + dome)); g.bezierCurveTo(tx + RX(rd) * 0.3, Y(gTop + dome), tx + RX(rd) * 0.95, Y(gTop + dome * 0.9), tx + RX(rd) * 0.95, Y(gTop)); g.closePath();
    g.fillStyle = lightX(roof, tx - RX(rd), tx + RX(rd)); g.fill();
    circle(tx, Y(gTop + dome + 1.5), 1.6 * z, C(gold));                               // Knauf und Wetterfahne
    g.strokeStyle = C('#4a4a58'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(tx, Y(gTop + dome + 1.5)); g.lineTo(tx, Y(gTop + dome + 9)); g.stroke();
    const vane = Math.sin(now / 3000) * 0.6;
    poly([[tx, Y(gTop + dome + 7.5)], [tx + Math.cos(vane) * 6 * z, Y(gTop + dome + 8)], [tx, Y(gTop + dome + 9)]], C(gold));
    ck.balconyRing(AT, BT, R1, gUp, false, true, 0.13, true);
    if (lit) glowQuad([[gx0, Y(gTop)], [gx1, Y(gTop)], [gx1, Y(gUp)], [gx0, Y(gUp)]], 70 * z);
    return [tx, lampY, Y(gUp + 4)];
  };
  // --- Zeichnen von hinten nach vorn ---------------------------------------------------------------------------
  const parts = [[-0.7, 0.65, house], [AT, BT, () => { lamp = tower(); }], [1.6, -0.92, steg]];
  let lamp = null;
  for (const [a, b, s] of [[1.35, 1.25, 1.3], [1.25, 0.7, 1], [1.4, 0.15, 1.15], [1.3, -0.4, 0.9], [0.9, 1.4, 1.1], [0.3, 1.38, 0.9], [-0.5, 1.4, 0.8], [1.4, -1.4, 1]]) parts.push([a, b, () => rock(a, b, s, a * 7 + b)]);
  parts.sort((p, q) => K.depth(p[0], p[1]) - K.depth(q[0], q[1])).forEach(p => p[2]());
  if (!lamp) return;
  // --- 21 Laternen in drei Girlanden: zum Haus, zum Steg, zur Ecke vorn rechts -------------------------------------------
  const [lx, ly, gy] = lamp, ends = [K.P(-0.25, 0.25, 17), K.P(2.15, -0.92, 9), K.P(1.35, 1.35, 6)];
  ends.forEach((e, gi) => {
    const sx = lx + (e[0] - lx) * 0.06, sy = gy, sag = 22 * z;
    const pt = f => [sx + (e[0] - sx) * f, sy + (e[1] - sy) * f + Math.sin(Math.PI * f) * sag];
    g.strokeStyle = C('#5a4636'); g.lineWidth = 0.5 * z; g.beginPath();
    for (let i = 0; i <= 16; i++) { const p = pt(i / 16); i ? g.lineTo(...p) : g.moveTo(...p); }
    g.stroke();
    for (let i = 0; i < 7; i++) {
      const [px, py] = pt((i + 0.6) / 7.4), col = LIGHT_LANTERNS[(gi * 7 + i) % 7], sw = Math.sin(now / 700 + i + gi) * 0.6 * z;
      g.strokeStyle = C('#5a4636'); g.lineWidth = 0.4 * z; g.beginPath(); g.moveTo(px, py); g.lineTo(px + sw, py + 1.5 * z); g.stroke();
      ellipse(px + sw, py + 3.4 * z, 1.7 * z, 2.2 * z, lit ? col : C(shade(col, -0.1)));
      g.fillStyle = C('#5a4636'); g.fillRect(px + sw - 1.1 * z, py + 1.1 * z, 2.2 * z, 0.6 * z);
      if (lit) glowQuad([[px - 2 * z, py + 1 * z], [px + 2 * z, py + 1 * z], [px + 2 * z, py + 6 * z], [px - 2 * z, py + 6 * z]], 10 * z, null);
    }
  });
  // --- Lichtstrahl: dreht sich; tags zart, nachts weit übers Meer -----------------------------------------------------
  if (!isLive()) return;
  const ang = now / 2200, len = (lit ? 360 : 110) * z, al = lit ? 0.42 : 0.12;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const off of [0, Math.PI]) {
    const a = ang + off, grd = g.createRadialGradient(lx, ly, 0, lx, ly, len);
    grd.addColorStop(0, `rgba(255,236,170,${al})`); grd.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = grd; g.beginPath(); g.moveTo(lx, ly);
    g.lineTo(lx + Math.cos(a - 0.1) * len, ly + Math.sin(a - 0.1) * len * 0.5);
    g.lineTo(lx + Math.cos(a + 0.1) * len, ly + Math.sin(a + 0.1) * len * 0.5);
    g.closePath(); g.fill();
  }
  g.restore();
};
