'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Gebäude & Deko
// ---------------------------------------------------------------------------
let night = 0;
const glows = [];
const isLive = () => g === ctx;

let NO_GLOW = false;                        // große Gebäude werden in Streifen gezeichnet: Licht nur einmal
function glowQuad(pts, r, tint) {           // tint 'blue': kühles Kristall-Leuchten statt warmem Lampenlicht
  if (NO_GLOW || !(night > 0.15 && isLive())) return;
  const m = g.getTransform(), k = 1 / DPR;
  glows.push({ q: pts.map(([x, y]) => [(m.a * x + m.c * y + m.e) * k, (m.b * x + m.d * y + m.f) * k]), r, tint });
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
  return DIRS.filter(([dx, dy]) => { const b = bAt(x + dx, y + dy); return b === 'weg' || b === 'rathaus' || crossingAt(x + dx, y + dy); });
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
function roadShapes(arms, t, w, quads = [], flares = []) {
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
  const curve = roadCurve(arms);
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
function pattern(L, kind, x, y, z, col, cols, ext = 0, box = null) {
  const R = 0.55, E = R + ext;
  const out = (u, v) => box && (u < box[0] || u > box[1] || v < box[2] || v > box[3]);
  const span = step => [-Math.ceil(ext / step - 1e-9), Math.floor((2 * R + ext) / step + 1e-9)];   // Indizes im festen Raster
  if (kind === 'stones' || kind === 'dots') {
    const step = kind === 'stones' ? 0.11 : 0.09, [i0, i1] = span(step);
    for (let i = i0; i <= i1; i++) for (let j = i0; j <= i1; j++) {
      const u = -R + i * step, v = -R + j * step;
      if (out(u, v)) continue;
      const h = hash(x * 16 + i, y * 16 + j, 333);
      if (kind === 'dots' && h > 0.45) continue;
      const q = L([u + (h - 0.5) * 0.04, v + (hash(x * 16 + i, y * 16 + j, 334) - 0.5) * 0.04]);
      g.fillStyle = cols ? cols[Math.floor(h * 97) % cols.length] : col;
      g.beginPath(); g.ellipse(q[0], q[1], (kind === 'stones' ? 2.6 : 1.3) * z, (kind === 'stones' ? 1.6 : 0.9) * z, 0, 0, Math.PI * 2); g.fill();
    }
    return;
  }
  if (kind === 'rainbow') {                // schräge Streifen in Regenbogenfarben (pastell)
    const RB = ['#f7a8b8', '#f9c98a', '#f8e38c', '#a8dcb0', '#9fcdf0', '#c6b2ee'], w = 0.1, n = Math.ceil(2 * E / w) + 1;
    for (let i = -n; i <= n; i++) {
      const c0 = i * w;
      poly([[c0 + E, -E], [c0 + w * 0.8 + E, -E], [c0 + w * 0.8 - E, E], [c0 - E, E]].map(L), C(RB[(i + 600) % RB.length]));
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
  const line = (a, b) => { const p0 = L(a), p1 = L(b); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); };
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
  const curve = roadCurve(arms);
  if (curve) return arcPts(curve.cu, curve.cv, 0.5, curve.a0, curve.a1);
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
  mulch:   { edge: '#6f4a2e', fill: '#8b5e3c', pat: ['dots', null], cols: ['#6f4a2e', '#a0714d'] },
  asphalt: { edge: '#cfc8bb', fill: '#9e988e', dash: true },
  regenbogen: { edge: '#ecd3de', fill: '#fff7fb', pat: ['rainbow', null] },
  konfetti: { edge: '#e8d8cf', fill: '#fbf4ec', pat: ['confetti', null], cols: ['#f2a7c0', '#8fd3bf', '#b9a3ee', '#ffd36e', '#8fc1f0', '#f7b58a'] },
  blueten: { edge: '#e9c6d2', fill: '#f7e3ea', pat: ['dots', null], cols: ['#f29bb8', '#ffffff', '#ffd36e', '#f6b6cb'] },
  tritt:   { stones: true },
  kristall: { edge: '#9fcfe8', fill: '#e1f4fb', pat: ['dots', null], cols: ['#9fdcf7', '#ffffff', '#62b1dc'], glow: true },
  // Flächen
  platten:    { fill: '#e6dfd0', pat: ['tiles', '#d6ccb9'] },
  kopf:       { fill: '#cfc8bb', pat: ['stones', '#ddd7cc'] },
  klinker:    { fill: '#c97a5e', pat: ['bricks', '#a95a43'] },
  terrakotta: { fill: '#d99a73', pat: ['tiles', '#c4805a'] },
  fisch:      { fill: '#ecccc2', pat: ['herring', '#d8aea2'] },
  goldpflaster: { fill: '#f3d27a', pat: ['tiles', '#d9b152'] },
};
const pathAt = (x, y) => { const t = state.tiles.get(x + ',' + y); return t && t.b === 'weg' ? styleDef('weg', t.style) : null; };
const isFillPath = (x, y) => { const s = pathAt(x, y); return !!s && s.shape === 'fill'; };

// Plätze: Ecken rund, wo die Fläche frei endet; wo ein Weg einmündet, bleibt die Ecke spitz (dort sitzt sein Trichter)
const PLAZA_R = 0.2, CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]], SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// own: Stil des Felds – bei der Vorschau (noch kein Weg dort) der Stil, der gleich gebaut wird
function plazaSides(x, y, own = pathAt(x, y)) {
  return SIDES.map(([dx, dy]) => {
    const n = pathAt(x + dx, y + dy);
    if (!n || n.id === 'tritt') return 'open';
    if (n.shape === 'band') return 'band';
    return own && n.id === own.id ? 'same' : 'seam';
  });
}
function plazaCorners(x, y, sides = plazaSides(x, y)) {
  return CORNERS.map(([sx, sy], i) => {
    if (sides[(i + 3) % 4] !== 'open' || sides[i] !== 'open') return [[sx * 0.5, sy * 0.5]];
    const a = Math.atan2(sy, sx), c = 0.5 - PLAZA_R;
    return arcPts(sx * c, sy * c, PLAZA_R, a - Math.PI / 4, a + Math.PI / 4, 6);
  });
}
function drawPlaza(L, x, y, z, lk, st) {
  const sides = plazaSides(x, y, st), corners = plazaCorners(x, y, sides), outline = corners.flat();
  poly(outline.map(L), C(lk.fill));
  if (lk.checker || lk.pat) {
    g.save(); clipTo([outline], L);
    if (lk.checker) {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if ((i + j) & 1) continue;
        const u = -0.5 + i * 0.25, v = -0.5 + j * 0.25;
        poly([[u, v], [u + 0.25, v], [u + 0.25, v + 0.25], [u, v + 0.25]].map(L), C(lk.checker));
      }
    } else pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols);
    g.restore();
  }
  // Randkante: wo die Fläche endet ganz, an einer Einmündung bis zum Trichter; zu anderem Pflaster keine (bündig)
  const line = pts => pts.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
  g.strokeStyle = C(shade(lk.fill, -0.18)); g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 1.4 * z;
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    const c = corners[i], p0 = c[c.length - 1], p1 = corners[(i + 1) % 4][0];
    if (c.length > 1) line(c);
    if (sides[i] === 'open') line([p0, p1]);
    else if (sides[i] === 'band') {
      const gap = EDGE_W + FLARE_R;
      line([p0, lerp(p0, p1, 0.5 - gap)]); line([lerp(p0, p1, 0.5 + gap), p1]);
    }
  }
  g.stroke();
}
// Ecken, die ganz gefüllt werden, weil ringsum Weg ist (Band oder Platz) – keine Löcher in breiten Wegen und an Plätzen
function pathQuads(x, y) {
  const paved = (px, py) => { const n = pathAt(px, py); return !!n && n.id !== 'tritt'; };
  const out = [];
  for (const su of [1, -1]) for (const sv of [1, -1]) if (paved(x + su, y) && paved(x, y + sv) && paved(x + su, y + sv)) out.push([su, sv]);
  return out;
}
// Arme, die in einen Platz münden (Trichter)
const pathFlares = (x, y) => pathArms(x, y).filter(([dx, dy]) => isFillPath(x + dx, y + dy));
// Belag eines Felds zeichnen (ext: über seine Kante hinaus verlängert – z. B. für große Flächen der Wunderwerke)
function paintLook(L, lk, x, y, z, band, ext, box = null) {
  const E = 0.5 + ext, rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const fillArea = band ? [rect(-E, E, -ROAD_W, ROAD_W), rect(-ROAD_W, ROAD_W, -E, E)] : [rect(-E, E, -E, E)];
  if (band) for (const sh of [rect(-E, E, -EDGE_W, EDGE_W), rect(-EDGE_W, EDGE_W, -E, E)]) poly(sh.map(L), C(lk.edge));
  for (const sh of fillArea) poly(sh.map(L), C(lk.fill));
  if (!lk.pat && !lk.checker) return;
  g.save(); clipTo(fillArea, L);
  if (lk.checker) {
    const n = Math.ceil(ext / 0.25);
    for (let i = -n; i < 4 + n; i++) for (let j = -n; j < 4 + n; j++) {
      if ((i + j) & 1) continue;
      const u = -0.5 + i * 0.25, v = -0.5 + j * 0.25;
      poly([[u, v], [u + 0.25, v], [u + 0.25, v + 0.25], [u, v + 0.25]].map(L), C(lk.checker));
    }
  } else pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols, ext, box);
  g.restore();
}
// Trittsteine: auf jedem Arm 1/8 und 3/8 vom Mittelpunkt → überall derselbe Abstand, auch über Feldgrenzen.
// Kreuzungen bekommen einen großen Stein in der Mitte, Kurven drei Steine auf dem Bogen.
function stonePoints(arms, t) {
  const curve = roadCurve(arms);
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
// Schienen: Schotterbett, Schwellen, zwei Stahlschienen; über Wasser eine Holzbrücke. Fahrdraht und Masten
// (elektrischer Zug) kommen als Objekt dazu (drawObject 'schiene').
// ---------------------------------------------------------------------------
const RAIL_W = 0.2, RAIL_GAUGE = 0.075, WIRE_H = 17;
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
function drawRailBed(cx, cy, z, x, y, t) {
  const arms = railArms(x, y), segs = railSegments(arms, t);
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
  for (const sh of roadShapes(arms, t, RAIL_W + 0.03)) poly(sh.map(L), C(t && t.bridge ? '#9a8f80' : '#a79d8c'));
  for (const sh of roadShapes(arms, t, RAIL_W)) poly(sh.map(L), C('#c3b9a8'));
  // Schwellen
  g.strokeStyle = C('#8a6440'); g.lineWidth = 1.7 * z; g.lineCap = 'butt';
  g.beginPath();
  for (const seg of segs) alongPath(seg, 0.125, (p, dir) => {
    const n = [-dir[1] * 0.15, dir[0] * 0.15], a = L([p[0] + n[0], p[1] + n[1]]), b = L([p[0] - n[0], p[1] - n[1]]);
    g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
  });
  g.stroke();
  if (t && t.cross && !t.foot) {                     // Bahnübergang: Wegbelag quer über die Gleise (nicht unter der Brücke)
    const st = styleDef('weg', t.style), lk = PATH_LOOK[st.id], pa = pathArms(x, y);
    const fill = lk.fill || '#dcc69d', edge = lk.edge || shade(fill, -0.18);
    const across = { rot: arms.length && arms[0][0] ? 1 : 0 };      // ohne Weg-Nachbarn: quer zur Schiene
    for (const [w, col] of [[EDGE_W, edge], [ROAD_W, fill]]) for (const sh of roadShapes(pa, across, w)) poly(sh.map(L), C(col));
    if (lk.pat || lk.checker) {                      // Muster des Wegs auch zwischen den Schienen
      g.save(); clipTo(roadShapes(pa, across, ROAD_W), L);
      if (lk.checker) paintLook(L, lk, x, y, z, false, 0);
      else pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols);
      g.restore();
    }
  }
  // Schienen: dunkel, darauf ein heller Glanz
  const rails = segs.flatMap(seg => [offsetPath(seg, RAIL_GAUGE), offsetPath(seg, -RAIL_GAUGE)]);
  stroke(rails, '#6f7682', 1.3);
  g.save(); g.translate(0, -0.45 * z); stroke(rails, '#d6dbe2', 0.5); g.restore();
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
// und rechts), in der Mitte über dem Fahrdraht. b = Abstand zur Mitte entlang des Wegs in Feldern.
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
  const st = styleDef('weg', t.style), lk = st.id === 'tritt' ? PATH_LOOK.kopf : PATH_LOOK[st.id];
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
const drawFlat = (cx, cy, z, x, y, t) => t.b === 'schiene' ? drawRailBed(cx, cy, z, x, y, t) : drawPath(cx, cy, z, x, y, t);
// Fahrdraht über der Schiene, auf jedem zweiten Feld ein Mast seitlich
function drawRailWire(cx, cy, z, x, y, t) {
  const segs = railSegments(railArms(x, y), t);
  const L = ([u, v], up = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z];
  if ((x + y) % 2 === 0) {
    const seg = segs[0], m = seg[Math.floor(seg.length / 2)], a = seg[Math.max(0, Math.floor(seg.length / 2) - 1)], b = seg[Math.min(seg.length - 1, Math.floor(seg.length / 2) + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, n = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
    const side = n[0] + n[1] > 0 ? -1 : 1;             // Mast auf die hintere Seite, damit er den Zug nicht verdeckt
    const foot = L([m[0] + n[0] * 0.3 * side, m[1] + n[1] * 0.3 * side]), top = [foot[0], foot[1] - (WIRE_H + 3) * z], hook = L(m, WIRE_H + 1);
    ellipse(foot[0], foot[1] + 0.4 * z, 1.8 * z, 0.9 * z, 'rgba(40,60,20,0.18)');
    g.strokeStyle = C('#8d939e'); g.lineWidth = 1.3 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(foot[0], foot[1]); g.lineTo(top[0], top[1]); g.lineTo(hook[0], hook[1]); g.stroke();
  }
  g.strokeStyle = C('#4f545e'); g.lineWidth = 0.6 * z;
  g.beginPath();
  for (const seg of segs) seg.forEach((p, i) => { const q = L(p, WIRE_H); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
  g.stroke();
}

function drawPath(cx, cy, z, x, y, t) {
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const st = styleDef('weg', t && t.style), lk = PATH_LOOK[st.id];
  if (st.shape === 'fill') { drawPlaza(L, x, y, z, lk, st); return; }
  const arms = pathArms(x, y);
  if (lk.stones) { drawStones(L, arms, t, x, y, z); return; }
  const quads = pathQuads(x, y);
  const flares = pathFlares(x, y);
  for (const [w, col] of [[EDGE_W, lk.edge], [ROAD_W, lk.fill]]) {
    for (const sh of roadShapes(arms, t, w, quads, flares)) poly(sh.map(L), C(col));
  }
  if (lk.pat) {
    g.save(); clipTo(roadShapes(arms, t, ROAD_W, quads, flares), L); pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols); g.restore();
  }
  if (lk.glow) glowQuad([L([-0.15, -0.15]), L([0.15, -0.15]), L([0.15, 0.15]), L([-0.15, 0.15])], 26 * z, 'blue');
  const cl = roadCenterline(arms, t);
  if (lk.dash && cl && !quads.length) {
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
  if (pat) { g.save(); clipTo([sq], L); pattern(L, pat[0], x, y, z, pat[1] && C(pat[1]), pat[2]); g.restore(); }
  return L;
}
const BIG_ART = {
  rathaus(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const K = kit(cx, cy, z, t.rot);
    if (groundPart(() => {
      K.rect(-0.98, -0.98, 0.98, 0.98, C('#e6dfd0'));
      g.save(); clipTo([[[-0.98, -0.98], [0.98, -0.98], [0.98, 0.98], [-0.98, 0.98]]], p => K.P(p[0], p[1]));
      pattern(p => K.P(p[0] * 1.8, p[1] * 1.8), 'tiles', x, y, z, C('#d6ccb9'));
      g.restore();
    })) return;
    const hall = () => {
      const [wall, roof] = paint(t, '#fff1d6', '#6f8fd8');
      const B = K.block({ ha: 0.6, hb: 0.6, h: 24, wall, roof, roofH: 18, over: 1.15, entry: true });
      K.door(B, 'front', 0.42, 0.58, 0.5);
      K.wins(B, 'front', 4, 0.35, 0.72, 0.05, 0.95, [1, 2]);
      K.sideWins(B, 3, 0.35, 0.72);
      const T2 = K.block({ ha: 0.17, hb: 0.17, h: 20, lift: 28, wall, roof: '#e8705f', roofH: 12 });
      const F = T2.faces.front || T2.faces.right || T2.faces.left, m = lerp(F.P, F.Q, 0.5), cyc = m[1] - 20 * z * 0.6;
      circle(m[0], cyc, 4.2 * z, C('#ffffff'));
      g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1 * z;
      g.beginPath(); g.arc(m[0], cyc, 4.2 * z, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(m[0], cyc); g.lineTo(m[0], cyc - 3 * z); g.moveTo(m[0], cyc); g.lineTo(m[0] + 2.2 * z, cyc); g.stroke();
    };
    const flag = () => { const [fx, fy] = K.P(0.78, -0.78); drawFlag(fx, fy, z * 1.3, now, state.town); };
    K.scene([[0, 0, hall], [0.78, -0.78, flag], [0.8, 0.75, () => kitBush(K, 0.8, 0.75, 0.9)]]);
  },
  park(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const F = (u, v) => L([u, v]);
    const [px2, py2] = F(-hu * 0.45, hv * 0.45);
    if (groundPart(() => {
      groundRect(cx, cy, z, hu * 0.98, hv * 0.98, '#8fd16a');
      poly([[-hu * 0.98, -0.12], [hu * 0.98, -0.12], [hu * 0.98, 0.12], [-hu * 0.98, 0.12]].map(L), C('#eadbb2'));
      poly([[-0.12, -hv * 0.98], [0.12, -hv * 0.98], [0.12, hv * 0.98], [-0.12, hv * 0.98]].map(L), C('#eadbb2'));
      ellipse(px2, py2, 24 * z, 11 * z, C('#5fb8cf'));
      ellipse(px2, py2 - 1 * z, 22 * z, 9.6 * z, C('#74d0e6'));
      ellipse(px2 - 6 * z, py2 - 2.5 * z, 7 * z, 2.6 * z, C('#b8ecf6'));
      for (let i = 0; i < 18; i++) {
        const u = (hash(x, y, 300 + i) - 0.5) * 1.7 * hu, v = (hash(x, y, 320 + i) - 0.5) * 1.7 * hv;
        if (Math.abs(u) < 0.2 || Math.abs(v) < 0.2 || Math.hypot(u + hu * 0.45, v - hv * 0.45) < 0.7) continue;
        const [fx, fy] = F(u, v);
        circle(fx, fy, 1.8 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
      }
    })) return;
    const dx = Math.sin(now / 1800) * 6 * z;                 // Ente auf dem Teich
    ellipse(px2 + dx, py2 + 1 * z, 2.2 * z, 1.4 * z, C('#fffaf0')); circle(px2 + dx + 1.8 * z, py2 - 0.8 * z, 1.2 * z, C('#fffaf0'));
    const pass = PASS; PASS = null;
    const bench = (u, v, rot) => { const [bx2, by2] = F(u, v); g.save(); g.translate(bx2, by2); g.scale(0.6, 0.6); drawObject('bank', 0, 0, z, now, x, y, 1, { rot }); g.restore(); };
    const parts = [[-1.05, -1.05], [0.35, -1.1], [1.05, -0.4], [1.1, 0.85], [-1.1, -0.15]].map(([u, v], i) => [u + v, () => { const [tx, ty] = F(u, v); tree(tx, ty + 2 * z, z * 0.95, hash(x, y, i * 7) + 0.3); }]);
    parts.push([0.9, () => bench(0.5, 0.4, 1)], [-0.85, () => bench(-0.4, -0.45, 0)]);
    parts.sort((p, q) => p[0] - q[0]).forEach(p => p[1]());
    PASS = pass;
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
const MIRROR = new Set(['bank']);
const ROTATABLE = new Set([...MIRROR, 'riesenrad', 'sternwarte', 'seebruecke', 'botgarten', 'schloss', 'holz', 'fischer', 'obst', 'stein', 'mine', 'kristallmine', 'glashaus', 'station', 'haus', 'muehle', 'steinmetz', 'schmiede',
  'rathaus', 'markt', 'hafen', 'schule', 'uni', 'park', 'baecker', 'saege', 'fabrik', 'bibliothek', 'kunst', 'leuchtturm', 'wasserkraft', 'geothermie', 'solarfeld', 'reihenhaus', 'ferienhaus', 'baumhaus', 'hausboot']);
let buildRot = 0;
// Deko im Verhältnis zu Häusern: kleine Dinge auch klein zeichnen
const DECO_SCALE = { rosenbogen: 0.75, denkmal: 0.8, uhrturm: 0.85, karussell: 0.85, pokal_bronze: 0.6, pokal_silber: 0.6, pokal_gold: 0.6, bank: 0.45, laterne: 0.62, kristallaterne: 0.66, glaskugel: 0.7, kristallbrunnen: 0.72, hecke: 0.5, blumentopf: 0.8, busch: 0.8, brunnen: 0.72, pavillon: 0.8, statue: 0.7, baum: 0.89, blumen: 0.85, windrad: 0.9 };
const decoScale = b => DECO_SCALE[b] || 1;
// Drehen per ⟳/R (+1) oder Mausrad (±1): ab der Richtung, die man gerade sieht (auch wenn sie automatisch war)
function rotateBuild(dir = 1) {
  const type = tool === 'verschieben' ? movingType() : tool;
  const cur = hover && type && ITEMS[type] && ROTATABLE.has(type) ? placeRot(type, hover.x, hover.y) : buildRot;
  buildRot = (cur + dir + 4) % 4;
  rotManual = true;
  previewCache = null;
  sfx('deco');
}

const GROUND_TYPES = new Set(['riesenrad', 'sternwarte', 'seebruecke', 'botgarten', 'schloss', 'rathaus', 'park', 'feld', 'obst', 'stein', 'mine', 'kristallmine', 'markt', 'hafen', 'schule', 'uni', 'lm', 'solarfeld', 'geothermie']);
const hasGroundPart = t => GROUND_TYPES.has(t.b) || (t.b === 'haus' && [3, 5, 6].includes(houseLook(t)));
function drawObject(type, cx, cy, z, now, x, y, lvl, t) {
  if (PASS === 'ground' && !hasGroundPart(t || { b: type, lvl })) return;
  if (BUILDING_ART[type]) { drawBuilding(type, cx, cy, z, now, x, y, lvl, t); return; }
  if (BIG_ART[type]) { const [w, h] = sizeOf(type, t && t.rot); BIG_ART[type](cx, cy, z, now, x, y, lvl, t || {}, w / 2, h / 2); return; }
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'haus': drawHouse(cx, cy, z, now, x, y, lvl, t); break;
    case 'blumen': {
      diamond(cx, cy, hw * 0.72, hh * 0.72, C('#a8764c'));
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const u = (hash(x, y, 100 + i) - 0.5) * 0.62, v = (hash(x, y, 120 + i) - 0.5) * 0.62;
        pts.push([cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z, i]);
      }
      pts.sort((a, b) => a[1] - b[1]);
      for (const [px, py, i] of pts) {
        circle(px, py - 1.5 * z, 2.4 * z, C('#5aa84f'));
        circle(px, py - 3 * z, 2.2 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
      }
      break;
    }
    case 'leuchtturm': {
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
    case 'windrad': {                        // Stufe 1 Windrad, 2 Großes Windrad, 3 Windturbine (schlank, rote Spitzen)
      const s = Math.max(1, Math.min(lvl || 1, 3)), H = [38, 56, 80][s - 1], w0 = [3, 4.4, 5.4][s - 1] * z, w1 = [3, 2.4, 2.6][s - 1] * z;
      ellipse(cx, cy + 1 * z, (4 + s * 2) * z, (2 + s) * z, 'rgba(40,60,20,0.15)');
      if (s > 1) box(cx, cy, 5 * z, 2.6 * z, 3 * z, '#e3ddd1', null, 0);                   // Sockel
      poly([[cx - w0 / 2, cy], [cx + w0 / 2, cy], [cx + w1 / 2, cy - H * z], [cx - w1 / 2, cy - H * z]], C('#f4f4f4'));
      poly([[cx, cy], [cx + w0 / 2, cy], [cx + w1 / 2, cy - H * z], [cx, cy - H * z]], C('#dedbd4'));
      const hy = cy - (H + 1) * z;
      if (s > 1) ellipse(cx + 1.5 * z, hy, (2.5 + s) * z, 2.4 * z, C('#e9e6df'));        // Gondel
      blades(cx, hy, z, now * (s === 3 ? 0.9 : 1.2), 3, [16, 24, 34][s - 1] * z, '#ffffff');
      if (s === 3) {                                                                      // rote Flügelspitzen
        const ang = now * 0.9 / 650;
        for (let i = 0; i < 3; i++) { const a = ang + i * Math.PI * 2 / 3; circle(cx + Math.cos(a) * 32 * z, hy + Math.sin(a) * 32 * z, 1.6 * z, C('#e8604f')); }
      }
      circle(cx, hy, (1.8 + s * 0.4) * z, C('#8a8f99'));
      if (s === 3 && night > 0.15 && isLive() && Math.floor(now / 700) % 2 === 0) {       // Warnlicht nachts
        circle(cx + 3 * z, hy - 2.5 * z, 1.4 * z, '#ff4a3d'); glowQuad([[cx + 2, hy - 4 * z], [cx + 4, hy - 4 * z], [cx + 4, hy - 1 * z], [cx + 2, hy - 1 * z]], 14 * z);
      }
      break;
    }
    // --- Bildung ---
    // --- Deko ---
    case 'weg': drawPath(cx, cy, z, x, y, t); break;
    case 'schiene':
      if (PASS !== 'object') drawRailBed(cx, cy, z, x, y, t);
      drawRailWire(cx, cy, z, x, y, t);
      if (t && t.cross) drawCrossing(cx, cy, z, x, y, t, now);
      break;
    case 'baum': {                        // Obstbaum; je Ecke eine andere Frucht, damit vier Bäume nicht gleich aussehen
      const h = hash(x, y, 40 + (t && t.slot || 0));
      tree(cx, cy + 2 * z, z * 1.05, 0.9, h < 0.4 ? '#ff6b5e' : h < 0.7 ? '#ffb13b' : h < 0.85 ? '#b07ad6' : '#ff8fb1');
      break;
    }
    case 'blumentopf': {
      ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,60,20,0.15)');
      poly([[cx - 7 * z, cy - 9 * z], [cx + 7 * z, cy - 9 * z], [cx + 5 * z, cy], [cx - 5 * z, cy]], C('#d9825b'));
      ellipse(cx, cy - 9 * z, 7 * z, 2.6 * z, C('#b8663f'));
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, fx = cx + Math.cos(a) * 4 * z, fy = cy - 12 * z + Math.sin(a) * 2 * z;
        circle(fx, fy + 2 * z, 2.6 * z, C('#5aa84f'));
        circle(fx, fy - 1 * z, 2.4 * z, C(FLOWER_COLS[(i + Math.floor(hash(x, y, 7 + (t && t.slot || 0)) * 5)) % FLOWER_COLS.length]));
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
    case 'busch': {
      ellipse(cx, cy + 1 * z, 9 * z, 3.5 * z, 'rgba(40,60,20,0.18)');
      circle(cx - 4 * z, cy - 5 * z, 6 * z, C('#5aae54'));
      circle(cx + 4 * z, cy - 5 * z, 6 * z, C('#4a944a'));
      circle(cx, cy - 9 * z, 6.5 * z, C('#62b85a'));
      circle(cx - 2 * z, cy - 11 * z, 2.6 * z, C('#86d37c'));
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
    case 'bank': {
      shadow(cx, cy, hw * 0.35, hh * 0.25);
      g.fillStyle = C('#6b4f3a');
      for (const dx of [-8, 8]) g.fillRect(cx + dx * z - 0.8 * z, cy - 4 * z + dx * 0.25 * z, 1.6 * z, 5 * z);
      poly([[cx - 11 * z, cy - 5 * z], [cx + 7 * z, cy - 1 * z], [cx + 11 * z, cy - 3 * z], [cx - 7 * z, cy - 7 * z]], C('#c68b59'));
      poly([[cx - 7 * z, cy - 7 * z], [cx + 11 * z, cy - 3 * z], [cx + 11 * z, cy - 9 * z], [cx - 7 * z, cy - 13 * z]], C('#b57b4a'));
      break;
    }
    case 'laterne': {
      ellipse(cx, cy + 1 * z, 4 * z, 2 * z, 'rgba(40,60,20,0.15)');
      g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.8 * z;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 22 * z); g.stroke();
      const dark = t && T.rail.power.dark.has(x + ',' + y + ',' + (t.slot || 0));     // ohne Strom bleibt sie aus
      const lit = night > 0.15 && isLive() && !dark;
      const lb = box(cx, cy - 22 * z, 2.6 * z, 1.4 * z, 5 * z, lit ? '#ffe58a' : dark && night > 0.15 ? '#9a978c' : '#fff7d6', '#4a4a58', 3 * z);
      if (!dark) glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 5 * z], [lb.L[0], lb.L[1] - 5 * z]], 34 * z);
      break;
    }
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
        const m = lerp(F.P, F.Q, 0.5), yc = m[1] - F.H * 0.8;
        circle(m[0], yc, 3.4 * z, C('#ffffff'));
        g.strokeStyle = C('#4a4a58'); g.lineWidth = 0.7 * z;
        const an = (now / 60000) * Math.PI * 2;
        g.beginPath(); g.arc(m[0], yc, 3.4 * z, 0, Math.PI * 2); g.moveTo(m[0], yc); g.lineTo(m[0] + Math.sin(an) * 2.6 * z, yc - Math.cos(an) * 2.6 * z);
        g.moveTo(m[0], yc); g.lineTo(m[0], yc - 1.8 * z); g.stroke();
        faceQuad(F.P, F.Q, 0.35, 0.65, 0, F.H * 0.25, C('#8a5a3c'));
      }
      const [px, py] = K.P(0, 0, 40 + 16);
      circle(px, py, 1.4 * z, C('#f2c14e'));
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
    case 'kristallbrunnen': {             // Becken mit hellem Wasser, in der Mitte wachsen Kristalle; Funkeln
      ellipse(cx, cy, hw * 0.72, hh * 0.72, C('#b9c3cf'));
      ellipse(cx, cy - 3 * z, hw * 0.72, hh * 0.72, C('#e3e8ef'));
      ellipse(cx, cy - 3 * z, hw * 0.57, hh * 0.57, C('#9fdcf7'));
      ellipse(cx - 5 * z, cy - 4.5 * z, hw * 0.2, hh * 0.12, 'rgba(255,255,255,0.45)');
      crystal(cx - 5 * z, cy - 2 * z, z, 9 * z, 2.4 * z, -0.28);
      crystal(cx + 5.5 * z, cy - 1.5 * z, z, 8 * z, 2.3 * z, 0.3);
      crystal(cx, cy - 1 * z, z, 17 * z, 3.4 * z, 0.04);
      for (let i = 0; i < 5; i++) {                      // kleine Sterne, die nacheinander aufblitzen
        const ph = (now / 1300 + i / 5) % 1, a = ph < 0.5 ? Math.sin(ph * 2 * Math.PI) : 0;
        if (a <= 0.05) continue;
        const sx = cx + (hash(x, y, 150 + i) - 0.5) * hw * 0.9, sy = cy - 3 * z + (hash(x, y, 160 + i) - 0.5) * hh * 0.7 - hash(x, y, 170 + i) * 16 * z;
        const s = 2.2 * z * a;
        g.fillStyle = `rgba(255,255,255,${a})`;
        g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx, sy + s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx, sy - s * 0.3); g.closePath(); g.fill();
      }
      glowQuad([[cx - 4 * z, cy - 18 * z], [cx + 4 * z, cy - 18 * z], [cx + 4 * z, cy - 2 * z], [cx - 4 * z, cy - 2 * z]], 46 * z, 'blue');
      break;
    }
    case 'brunnen': {
      ellipse(cx, cy, hw * 0.7, hh * 0.7, C('#aeb2bd'));
      ellipse(cx, cy - 3 * z, hw * 0.7, hh * 0.7, C('#d2d5de'));
      ellipse(cx, cy - 3 * z, hw * 0.55, hh * 0.55, C('#74d0e6'));
      g.fillStyle = C('#c9ccd6');
      g.fillRect(cx - 1.8 * z, cy - 14 * z, 3.6 * z, 11 * z);
      for (let i = 0; i < 6; i++) {
        const ph = (now / 900 + i / 6) % 1, a = i / 6 * Math.PI * 2;
        circle(cx + Math.cos(a) * ph * 10 * z, cy - 15 * z + Math.sin(a) * ph * 5 * z - Math.sin(ph * Math.PI) * 6 * z,
          1.3 * z, `rgba(200,240,255,${1 - ph})`);
      }
      break;
    }
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
function drawSmallOne(b, rot, sx, sy, z, now, x, y, sc, slot = 0) {
  const s = decoScale(b) * 0.9 * sc;
  g.save(); g.translate(sx, sy); g.scale((rot & 1) && MIRROR.has(b) ? -s : s, s);
  drawObject(b, 0, 0, z, now, x, y, 1, { rot, slot });
  g.restore();
}
function drawSmall(k, px, py, z, now, x, y, which) {
  const ds = state.decos.get(k);
  if (!ds) return;
  for (const i of which) {
    const d = ds[i];
    if (!d) continue;
    const [u, v] = slotUV(i);
    let sc = 1;
    if (d.born) { const a = (now - d.born) / 380; if (a < 1) sc = 0.5 + 0.5 * Math.sin(a * Math.PI / 2); }
    drawSmallOne(d.b, d.rot || 0, px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z, z, now, x, y, sc, i);
  }
}

function drawStatusIcon(cx, cy, z, icon, now) {
  const bob = Math.sin(now / 300) * 1.5 * z, x = cx - 10 * z, y = cy - 34 * z + bob, r = 6.5 * z;
  circle(x, y + 1.5, r, 'rgba(107,79,58,0.3)');
  circle(x, y, r, '#fffaf0');
  g.font = `${8 * z}px system-ui, sans-serif`;
  g.textBaseline = 'middle';
  centerText(icon, x, y + 0.5 * z);
}
