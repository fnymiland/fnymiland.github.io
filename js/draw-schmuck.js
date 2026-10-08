'use strict';
// ---------------------------------------------------------------------------
// Stadtschmuck (Block 106): Laternen, Bänke und Brunnen in mehreren Formen (t.form) und Farben (t.col) – siehe DECO_LOOKS.
// Gezeichnet um den Bodenpunkt (cx, cy); kleine Deko kommt hier schon skaliert an (drawSmallOne).
// ---------------------------------------------------------------------------
const lookCol = (b, t) => { const L = DECO_LOOKS[b], c = L && L.cols && L.cols[(t && t.col) || 0]; return c ? c.c : L && L.cols ? L.cols[0].c : '#888'; };
const lookForm = (b, t) => { const L = DECO_LOOKS[b], i = (t && t.form) || 0; return (L && L.forms[i] ? L.forms[i] : L.forms[0]).id; };

// --- Laternen ---------------------------------------------------------------------------------------
// Licht: warm; ohne Strom (Block 84) bleibt sie aus
function drawLantern(cx, cy, z, now, x, y, t) {
  const col = lookCol('laterne', t), form = lookForm('laterne', t), hi = shade(col, 0.12);
  const dark = t && T.rail.power.dark.has(x + ',' + y + ',' + (t.slot || 0));
  const lit = night > 0.15 && isLive() && !dark;
  const lamp = lit ? '#ffe58a' : dark && night > 0.15 ? '#9a978c' : '#fff7d6';
  const glow = (gx, gy, w, h, r = 34) => { if (!dark) glowQuad([[gx - w, gy], [gx + w, gy], [gx + w, gy - h], [gx - w, gy - h]], r * z); };
  const pole = (x0, y0, x1, y1, w = 1.8) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  ellipse(cx, cy + 1 * z, 4 * z, 2 * z, 'rgba(40,60,20,0.15)');
  if (form === 'kandelaber') {                                          // zwei Arme mit je einer Lampe, Kugel obenauf
    pole(cx, cy, cx, cy - 22 * z, 2);
    ellipse(cx, cy - 1 * z, 2.4 * z, 1.1 * z, C(shade(col, -0.15)));
    g.strokeStyle = C(col); g.lineWidth = 1.2 * z; g.beginPath();
    g.moveTo(cx - 6 * z, cy - 19 * z); g.quadraticCurveTo(cx - 6 * z, cy - 23 * z, cx, cy - 22 * z); g.quadraticCurveTo(cx + 6 * z, cy - 23 * z, cx + 6 * z, cy - 19 * z); g.stroke();
    for (const s of [-1, 1]) {
      const lb = box(cx + s * 6 * z, cy - 19 * z, 2.2 * z, 1.2 * z, 4.2 * z, lamp, col, 2.4 * z);
      glow(cx + s * 6 * z, lb.L[1], 2.2 * z, 4.2 * z, 26);
    }
    circle(cx, cy - 25 * z, 1.4 * z, C(hi));
  } else if (form === 'lampion') {                                      // Holzpfosten mit Arm, daran ein runder Lampion
    pole(cx, cy, cx, cy - 21 * z, 1.9);
    pole(cx, cy - 21 * z, cx + 6 * z, cy - 21 * z, 1.4);
    g.strokeStyle = C(shade(col, -0.2)); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(cx + 5.5 * z, cy - 21 * z); g.lineTo(cx + 5.5 * z, cy - 18.5 * z); g.stroke();
    const ly = cy - 15 * z, paper = lit ? '#ff9a5a' : '#e8604f';
    ellipse(cx + 5.5 * z, ly, 3.2 * z, 3.8 * z, C(paper));
    for (const dy of [-1.6, 0, 1.6]) { g.strokeStyle = 'rgba(120,40,30,0.35)'; g.lineWidth = 0.35 * z; g.beginPath(); g.ellipse(cx + 5.5 * z, ly + dy * z, 3.1 * z, 0.6 * z, 0, 0, Math.PI); g.stroke(); }
    bar(cx + 4.3 * z, ly - 4.3 * z, 2.4 * z, 0.8 * z, C('#3a3a44')); bar(cx + 4.3 * z, ly + 3.5 * z, 2.4 * z, 0.8 * z, C('#3a3a44'));
    if (lit) ellipse(cx + 5.5 * z, ly, 2 * z, 2.6 * z, 'rgba(255,240,170,0.55)');
    glow(cx + 5.5 * z, ly + 4 * z, 3.2 * z, 8 * z, 30);
  } else if (form === 'pilz') {                                         // kurzer Stiel, großer Pilzhut (Farbe) mit Tupfen, leuchtet von unten
    g.fillStyle = C('#f4ecd8'); g.beginPath(); g.moveTo(cx - 1.6 * z, cy); g.lineTo(cx - 1.1 * z, cy - 8 * z); g.lineTo(cx + 1.1 * z, cy - 8 * z); g.lineTo(cx + 1.6 * z, cy); g.closePath(); g.fill();
    ellipse(cx, cy - 8 * z, 5.6 * z, 1.8 * z, lit ? '#ffe58a' : C('#efe3c8'));                 // Unterseite: das Licht
    g.fillStyle = C(col); g.beginPath(); g.ellipse(cx, cy - 8.4 * z, 6 * z, 5.4 * z, 0, Math.PI, 0); g.closePath(); g.fill();
    for (const [dx, dy, r] of [[-3, -11, 1], [1.5, -12.5, 0.9], [3.6, -9.6, 0.7], [-0.8, -9.4, 0.6]]) circle(cx + dx * z, cy + dy * z, r * z, C('#fffaf0'));
    glow(cx, cy - 6 * z, 5 * z, 4 * z, 28);
  } else if (form === 'stab') {                                         // schlanke moderne Stablaterne mit Lichtband
    const top = cy - 26 * z;
    g.fillStyle = C(col); g.fillRect(cx - 1.1 * z, top, 2.2 * z, 26 * z);
    g.fillStyle = C(hi); g.fillRect(cx - 1.1 * z, top, 0.7 * z, 26 * z);
    g.fillStyle = lamp; g.fillRect(cx - 1.1 * z, top + 1.5 * z, 2.2 * z, 6 * z);
    glow(cx, top + 7.5 * z, 1.4 * z, 6 * z, 30);
  } else {                                                              // Gaslaterne (wie bisher)
    pole(cx, cy, cx, cy - 22 * z, 1.8);
    const lb = box(cx, cy - 22 * z, 2.6 * z, 1.4 * z, 5 * z, lamp, col, 3 * z);
    if (!dark) glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 5 * z], [lb.L[0], lb.L[1] - 5 * z]], 34 * z);
  }
}

// --- Große Straßenlaternen (Block 132): hoher Mast, nachts großer Lichtkegel auf dem Boden ---------------------------
// Licht: die Lampe selbst (Scheibe) und ein weiter, weicher Schein am Boden (zwei winzige Lichter mit großem Radius – gehen
// durch alle Wege: live, Bildchen, Nachtbilder, GL). Ohne Strom bleibt sie dunkel. Ausleger in Feldrichtung je rot (Block 132b)
function drawStreetLamp(cx, cy, z, now, x, y, t) {
  const col = lookCol('strassenlaterne', t), form = lookForm('strassenlaterne', t), hi = shade(col, 0.18), lo = shade(col, -0.22);
  const dark = t && T.rail.power.dark.has(x + ',' + y + ',' + (t.slot || 0));
  const lit = night > 0.15 && isLive() && !dark;
  const lamp = lit ? '#ffe9a0' : dark && night > 0.15 ? '#9a978c' : '#fff7d6';
  // Ausleger entlang einer Feldrichtung (am Wegrand dreht smallRot zur Wegmitte, MID_TURN; sonst ⟳): rot 0 +u, 1 −v, 2 −u, 3 +v.
  // A(k, h): k Bildpunkte (× z) waagerecht in Auslegerrichtung, h hoch; Q(k, q, h) zusätzlich q quer dazu
  const [au, av] = [[1, 0], [0, -1], [-1, 0], [0, 1]][((t && t.rot) || 0) & 3], ex = au - av, ey = (au + av) / 2, qx = -av - au, qy = (au - av) / 2;
  const A = (k, h) => [cx + ex * k * z, cy + ey * k * z - h * z], Q = (k, q, h) => [cx + (ex * k + qx * q) * z, cy + (ey * k + qy * q) * z - h * z];
  const pane = (gx, gy, w, h, r = 16) => { if (!dark) glowQuad([[gx - w, gy], [gx + w, gy], [gx + w, gy - h], [gx - w, gy - h]], r * z); };
  const pool = (px, py, R = 30) => {                                    // Lichtfleck am Boden: flach und breit (drei weiche Flecken nebeneinander)
    if (dark) return;
    for (const dx of [-0.75, 0, 0.75]) { const ax = px + dx * R * z, ay = py; glowQuad([[ax - 0.2, ay], [ax + 0.2, ay], [ax + 0.2, ay - 0.2], [ax - 0.2, ay - 0.2]], R * z * (dx ? 0.8 : 1)); }
  };
  const mast = (x0, y0, y1, w0, w1) => {                                // runder Mast: helle linke, dunkle rechte Hälfte
    poly([[x0 - w0 * z, y0], [x0, y0 + 0.4 * z], [x0, y1], [x0 - w1 * z, y1]], C(hi));
    poly([[x0, y0 + 0.4 * z], [x0 + w0 * z, y0], [x0 + w1 * z, y1], [x0, y1]], C(lo));
  };
  const arm = (pts, w = 1.3) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); };
  const lantern = (lx, ly, s = 1) => {                                  // klassischer Laternenkopf, ly = Unterkante
    poly([[lx - 1.6 * s * z, ly], [lx + 1.6 * s * z, ly], [lx + 3.2 * s * z, ly - 7 * s * z], [lx - 3.2 * s * z, ly - 7 * s * z]], lamp);
    g.strokeStyle = C(lo); g.lineWidth = 0.5 * z; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly - 7 * s * z); g.stroke();
    poly([[lx - 3.9 * s * z, ly - 7 * s * z], [lx + 3.9 * s * z, ly - 7 * s * z], [lx + 1.2 * s * z, ly - 10 * s * z], [lx - 1.2 * s * z, ly - 10 * s * z]], C(col));
    circle(lx, ly - 10.8 * s * z, 0.9 * s * z, C(hi));
    bar(lx - 1.9 * s * z, ly - 0.2 * z, 3.8 * s * z, 1 * z, C(col));
    pane(lx, ly, 3 * s * z, 7 * s * z);
  };
  ellipse(cx, cy + 1 * z, 5 * z, 2.4 * z, 'rgba(40,60,20,0.18)');
  if (form === 'peitsche') {                                            // Peitschenmast: schlank, oben im Bogen über den Weg, flacher Kopf
    mast(cx, cy, cy - 44 * z, 1.5, 0.9);
    arm([A(0, 44), A(0.4, 49.5), A(2.6, 52.2), A(6, 52.2)], 1.6);     // lädt ~⅓ Feld aus: zwei gegenüber treffen sich nicht
    const plate = (h, w, k0, k1) => [Q(k0, -w, h), Q(k1, -w, h), Q(k1, w, h), Q(k0, w, h)];
    poly(plate(51, 1.6, 5.4, 11.6), lamp);                                  // Leuchtfläche unten schaut unter dem Kopf hervor
    poly(plate(52.6, 1.8, 5, 12), C(col));
    const hc = A(8.5, 51); pane(hc[0], hc[1], 3 * z, 1 * z); pool(...A(5, -2));
  } else if (form === 'doppel') {                                       // Doppelausleger mit zwei hängenden Laternen
    mast(cx, cy, cy - 42 * z, 2, 1.2);
    bar(cx - 2.6 * z, cy - 4 * z, 5.2 * z, 4 * z, C(col));
    arm([[cx - 11 * z, cy - 40 * z], [cx - 6 * z, cy - 44 * z], [cx, cy - 42.5 * z], [cx + 6 * z, cy - 44 * z], [cx + 11 * z, cy - 40 * z]], 1.4);
    arm([[cx - 6 * z, cy - 36 * z], [cx, cy - 39 * z], [cx + 6 * z, cy - 36 * z]], 0.8);
    circle(cx, cy - 45 * z, 1.4 * z, C(hi));
    for (const s of [-1, 1]) { arm([[cx + s * 11 * z, cy - 40 * z], [cx + s * 11 * z, cy - 38 * z]], 0.7); lantern(cx + s * 11 * z, cy - 28 * z, 0.8); }
    pool(cx, cy + 2 * z, 32);
  } else if (form === 'kugel') {                                        // Parkleuchte mit drei Kugeln
    mast(cx, cy, cy - 40 * z, 1.8, 1.1);
    ellipse(cx, cy - 1 * z, 3 * z, 1.4 * z, C(lo));
    arm([[cx - 7 * z, cy - 38 * z], [cx - 7 * z, cy - 40 * z], [cx, cy - 41 * z], [cx + 7 * z, cy - 40 * z], [cx + 7 * z, cy - 38 * z]], 1.2);
    for (const [dx, dy, r] of [[-7, -41.5, 3.4], [7, -41.5, 3.4], [0, -46, 3.8]]) {
      circle(cx + dx * z, cy + dy * z, r * z, lit ? '#fff3c4' : C('#f6f2e8'));
      if (!lit) circle(cx + (dx - r * 0.35) * z, cy + (dy - r * 0.35) * z, r * 0.35 * z, C('#ffffff'));
      pane(cx + dx * z, cy + (dy + r * 0.7) * z, r * 0.7 * z, r * 1.4 * z, 12);
    }
    pool(cx, cy + 2 * z, 30);
  } else if (form === 'hirtenstab') {                                   // Bischofsstab: Mast biegt sich oben zum Haken, daran die Laterne
    mast(cx, cy, cy - 40 * z, 1.9, 1.1);
    for (const h of [6, 7.4]) bar(cx - 2.4 * z, cy - h * z, 4.8 * z, 0.8 * z, C(hi));
    const p0 = A(0, 40), c1 = A(0, 52), c2 = A(8, 52.5), p1 = A(7.5, 44);
    g.strokeStyle = C(col); g.lineWidth = 2 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(...p0);
    g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p1[0], p1[1]); g.stroke();
    arm([p1, A(7.5, 41.5)], 0.7);
    const L = A(7.5, 31); lantern(L[0], L[1], 0.9); pool(...A(4, -2));
  } else if (form === 'boulevard') {                                    // großer Kandelaber: fünf Lampen
    mast(cx, cy, cy - 38 * z, 2.4, 1.3);
    bar(cx - 3 * z, cy - 5 * z, 6 * z, 5 * z, C(col)); bar(cx - 3.6 * z, cy - 1 * z, 7.2 * z, 1.5 * z, C(lo));
    for (const s of [-1, 1]) for (const [w, h] of [[13, 30], [7, 34]]) arm([[cx, cy - (h - 4) * z], [cx + s * w * 0.6 * z, cy - (h + 1) * z], [cx + s * w * z, cy - h * z]], 1.1);
    for (const [dx, h] of [[-13, 30], [13, 30], [-7, 34], [7, 34], [0, 38]]) lantern(cx + dx * z, cy - h * z, 0.62);
    pool(cx, cy + 2 * z, 34);
  } else {                                                              // Schinkel-Mastleuchte (Standard): Sockel, Ringe, Laternenkopf
    poly([[cx - 3 * z, cy], [cx + 3 * z, cy], [cx + 2.2 * z, cy - 5 * z], [cx - 2.2 * z, cy - 5 * z]], C(col));
    poly([[cx, cy + 0.6 * z], [cx + 3 * z, cy], [cx + 2.2 * z, cy - 5 * z], [cx, cy - 5 * z]], C(lo));
    mast(cx, cy - 5 * z, cy - 40 * z, 1.6, 1);
    for (const h of [5, 20]) bar(cx - 2.2 * z, cy - h * z - 0.6 * z, 4.4 * z, 1.2 * z, C(hi));
    arm([[cx - 3.5 * z, cy - 37 * z], [cx, cy - 39.5 * z], [cx + 3.5 * z, cy - 37 * z]], 0.8);
    lantern(cx, cy - 40 * z, 1.1); pool(cx, cy + 2 * z);
  }
}

let BED_SOIL = null;                                                       // nur Vorschau: Bodenart erzwingen (sonst t.col → BED_SOILS)
// --- Beete (Block 152): Formen wie Laternen/Bänke (DECO_LOOKS.blumen), je Größe (span 1–3) mehr Blumen statt größerer ---------
// Bodenpunkt (cx, cy) = Mitte der Fläche; R = halbe Kante in Feldern. Alles von hinten nach vorn (u + v), damit nichts durchscheint
function drawBed(cx, cy, z, x, y, t, span) {
  const form = lookForm('blumen', t), R = (0.72 + span - 1) / 2;
  const P = (u, v, h = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z];
  const quad = (r, h = 0) => [P(-r, -r, h), P(r, -r, h), P(r, r, h), P(-r, r, h)];
  const H = (i, s = 0) => hash(x * 7 + i, y * 13 + s, 777);
  const ring = (r, n) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; });
  const disc = (r, col, h = 0) => { g.fillStyle = C(col); g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, q = P(Math.cos(a) * r, Math.sin(a) * r, h); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.fill(); };
  const scatter = (n, inside, jit = 0.5) => {                               // Punkte im Beet, hinten zuerst
    const out = [], k = Math.ceil(Math.sqrt(n * 1.6));
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
      const u = -R + (i + 0.5 + (H(i * 31 + j) - 0.5) * jit) * 2 * R / k, v = -R + (j + 0.5 + (H(j * 17 + i, 1) - 0.5) * jit) * 2 * R / k;
      if (inside(u, v)) out.push([u, v, i * k + j]);
    }
    return out.sort((a, b) => a[0] + a[1] - b[0] - b[1]);
  };
  const flower = (u, v, col, s = 1, h = 3) => { const q = P(u, v); circle(q[0], q[1] - (h - 1.5) * z * s, 2.3 * z * s, C('#5aa84f')); circle(q[0], q[1] - h * z * s, 2.1 * z * s, C(col)); };
  const stones = (pts, col = '#b9b4aa') => { for (const [u, v, i] of pts.sort((a, b) => a[0] + a[1] - b[0] - b[1])) { const q = P(u, v); const w = (2.2 + H(i, 5) * 1.2) * z; ellipse(q[0], q[1] + 0.6 * z, w, w * 0.55, C(shade(col, -0.25))); ellipse(q[0], q[1] - 0.2 * z, w, w * 0.6, C(shade(col, (H(i, 6) - 0.5) * 0.18))); } };
  const edgePts = (r, step) => { const out = []; let i = 0; for (const [a0, b0, a1, b1] of [[-r, -r, r, -r], [r, -r, r, r], [r, r, -r, r], [-r, r, -r, -r]]) for (let s = 0; s < 1; s += step) out.push([a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, i++]); return out; };
  ellipse(cx, cy + 1 * z, TW / 2 * z * R * 1.6, TH / 2 * z * R * 1.6, 'rgba(40,60,20,0.08)');
  // Boden (Nutzer: „das Braun ist zu kackig“) – Vorschau-Schalter BED_SOIL: erde, mulch, gruen, kies
  const soilId = BED_SOIL || (BED_SOILS[(t && t.col) || 0] || BED_SOILS[0]).id;
  const SOIL = { erde: ['#5b4232', '#4a3427', '#7a5a44'], mulch: ['#8a5038', '#6e3c2a', '#b0704e'], gruen: ['#5f9a4a', '#4f8a3e', '#7fb85c'], kies: ['#cfc8bb', '#b8b0a2', '#e8e2d6'], gruen0: ['#6aa852'] }[soilId === 'gruen' ? 'gruen0' : soilId] || null;
  const soilPoly = (pts, fallback) => {
    if (!SOIL) { poly(pts, C(fallback)); return; }
    poly(pts, C(SOIL[0]));
    if (SOIL.length < 2) return;                                            // schlicht: nur die Farbe
    g.save(); g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const n = Math.round((x1 - x0) * (y1 - y0) / (30 * z * z)), r = (soilId === 'mulch' ? 1.3 : 0.8) * z;
    for (const k of [1, 2]) {                                              // je Farbe ein Pfad, ein fill; Krümel als Ellipse (Leistungs-Wächter)
      g.beginPath();
      for (let i = k - 1; i < n; i += 2) { const px = x0 + H(i, 41) * (x1 - x0), py = y0 + H(i, 42) * (y1 - y0), rot = soilId === 'mulch' ? H(i, 43) * 3 : 0;
        g.moveTo(px + r, py); g.ellipse(px, py, r, r * (soilId === 'mulch' ? 0.45 : 0.6), rot, 0, Math.PI * 2); }
      g.fillStyle = C(SOIL[k]); g.fill();
    }
    g.restore();
  };
  if (form === 'stein') {                                                  // Feldsteine rundum, gemischte Blumen
    soilPoly(quad(R * 0.94), '#8f6542');
    const back = edgePts(R, 0.11 / span).filter(([u, v]) => u + v < 0), front = edgePts(R, 0.11 / span).filter(([u, v]) => u + v >= 0);
    stones(back);
    for (const [u, v, i] of scatter(10 * span * span, (u, v) => Math.abs(u) < R * 0.8 && Math.abs(v) < R * 0.8)) flower(u, v, FLOWER_COLS[i % FLOWER_COLS.length]);
    stones(front);
  } else if (form === 'rund') {                                            // Rundbeet: Steinkreis, Ringe aus Blumen, Mitte hoch
    disc(R * 0.98, '#b9b4aa'); { const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(P(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86)); } soilPoly(pts, '#8f6542'); }
    const rings = [[R * 0.7, '#ffffff', 8], [R * 0.45, '#ff8fb1', 6], [R * 0.2, '#e8604f', 4]].map(([r, col, n]) => ring(r, Math.round(n * span)).map(([u, v]) => [u, v, col]));
    const all = rings.flat().sort((a, b) => a[0] + a[1] - b[0] - b[1]);
    const mid = P(0, 0);
    for (const [u, v, col] of all) { if (u + v > 0) continue; flower(u, v, col); }
    g.strokeStyle = C('#4f8f45'); g.lineWidth = 1.2 * z; g.beginPath(); g.moveTo(mid[0], mid[1]); g.lineTo(mid[0], mid[1] - 9 * z); g.stroke();
    circle(mid[0], mid[1] - 10 * z, 3.4 * z, C('#ffd23f')); circle(mid[0], mid[1] - 10 * z, 1.3 * z, C('#a8662a'));
    for (const [u, v, col] of all) { if (u + v <= 0) continue; flower(u, v, col); }
  } else if (form === 'rosen') {                                           // Rosenbüsche, Ziegelkante
    poly(quad(R, 1.6), C('#b8553f')); poly(quad(R), C(shade('#b8553f', -0.25)));
    soilPoly(quad(R * 0.88, 1.6), '#7a5236');
    const nR = span + 1, bushes = [];                                       // gleichmäßig verteilt (1×1: vier Büsche, nicht an den Rand gedrängt)
    for (let i = 0; i < nR; i++) for (let j = 0; j < nR; j++) bushes.push([-R * 0.5 + i * R / (nR - 1), -R * 0.5 + j * R / (nR - 1), i * nR + j]);
    for (const [u, v, i] of bushes.sort((a, b) => a[0] + a[1] - b[0] - b[1])) {
      const q = P(u, v, 1.6);
      for (const [dx, dy, r] of [[-2.2, -2, 3.2], [2.2, -2, 3.2], [0, -4, 3.4], [0, -1, 3.4]]) circle(q[0] + dx * z, q[1] + dy * z, r * z, C(i % 2 ? '#3f7d3a' : '#46883f'));
      const rc = ['#e8364f', '#ff8fb1', '#ffffff', '#d81b60'][i % 4];
      for (const [dx, dy] of [[-2.6, -3.6], [1.8, -4.4], [0.2, -6.2], [2.8, -1.8], [-1.4, -1.2]]) { circle(q[0] + dx * z, q[1] + dy * z, 1.25 * z, C(rc)); circle(q[0] + dx * z - 0.3 * z, q[1] + dy * z - 0.3 * z, 0.45 * z, 'rgba(255,255,255,0.5)'); }
    }
  } else if (form === 'tulpen') {                                          // Tulpen in Farbstreifen
    soilPoly(quad(R), '#8f6542');
    const cols = ['#e8364f', '#ffd23f', '#ff8fb1', '#ffffff', '#c49bff'], rows = 3 + 2 * (span - 1);
    const pts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < 4 * span; c++) pts.push([-R * 0.8 + (r + 0.5) * 1.6 * R / rows, -R * 0.82 + (c + 0.5) * 1.64 * R / (4 * span), cols[r % cols.length]]);
    for (const [u, v, col] of pts.sort((a, b) => a[0] + a[1] - b[0] - b[1])) {
      const q = P(u, v);
      g.strokeStyle = C('#4f8f45'); g.lineWidth = 0.8 * z; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0], q[1] - 5 * z); g.stroke();
      ellipse(q[0] - 1 * z, q[1] - 1.2 * z, 0.9 * z, 2 * z, C('#5aa84f'));
      poly([[q[0] - 1.5 * z, q[1] - 5 * z], [q[0] + 1.5 * z, q[1] - 5 * z], [q[0] + 1.6 * z, q[1] - 7.6 * z], [q[0] + 0.5 * z, q[1] - 6.6 * z], [q[0], q[1] - 7.8 * z], [q[0] - 0.5 * z, q[1] - 6.6 * z], [q[0] - 1.6 * z, q[1] - 7.6 * z]], C(col));
    }
  } else if (form === 'lavendel') {                                        // Kiesbett mit Lavendelreihen
    poly(quad(R), C('#d9cdb4'));
    for (const [u, v, i] of scatter(30 * span * span, () => true, 1)) { const q = P(u, v); circle(q[0], q[1], 0.5 * z, C(i % 3 ? '#c4b796' : '#efe6d0')); }
    const rows = 2 + span, pts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < 3 * span; c++) pts.push([-R * 0.7 + (r + 0.5) * 1.4 * R / rows, -R * 0.72 + (c + 0.5) * 1.44 * R / (3 * span), r * 10 + c]);
    for (const [u, v, i] of pts.sort((a, b) => a[0] + a[1] - b[0] - b[1])) {
      const q = P(u, v);
      ellipse(q[0], q[1] - 1.6 * z, 3.4 * z, 2.2 * z, C('#7f9c6a'));
      for (let k = -3; k <= 3; k++) { const hx = q[0] + k * 0.95 * z, hy = q[1] - 2 * z; g.strokeStyle = C(k % 2 ? '#8e6cc8' : '#a888dc'); g.lineWidth = 1.1 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + k * 0.3 * z, hy - (5 + H(i * 7 + k, 3) * 2) * z); g.stroke(); }
    }
  } else if (form === 'hochbeet') {                                        // Hochbeet aus Holz
    const h = 6, r = R * 0.92, wood = '#a5713f';
    poly([P(-r, r), P(r, r), P(r, r, h), P(-r, r, h)], C(wood));           // vorn links
    poly([P(r, -r), P(r, r), P(r, r, h), P(r, -r, h)], C(shade(wood, -0.15)));   // vorn rechts
    g.strokeStyle = C(shade(wood, -0.3)); g.lineWidth = 0.5 * z; g.beginPath();
    for (const hh of [2, 4]) { for (const [a, b] of [[P(-r, r, hh), P(r, r, hh)], [P(r, -r, hh), P(r, r, hh)]]) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } } g.stroke();
    soilPoly(quad(r, h), '#6f4a2f'); g.strokeStyle = C(shade(wood, 0.15)); g.lineWidth = 1.2 * z; g.beginPath(); quad(r, h).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
    for (const [u, v, i] of scatter(8 * span * span, (u, v) => Math.abs(u) < r * 0.8 && Math.abs(v) < r * 0.8)) { const q = P(u, v, h); circle(q[0], q[1] - 1.5 * z, 2.3 * z, C('#5aa84f')); circle(q[0], q[1] - 3 * z, 2.1 * z, C(FLOWER_COLS[(i + 2) % FLOWER_COLS.length])); }
  } else if (form === 'sonnen') {                                          // Sonnenblumen
    soilPoly(quad(R), '#8f6542');
    for (const [u, v] of scatter(4 * span * span, (u, v) => Math.abs(u) < R * 0.75 && Math.abs(v) < R * 0.75, 0.6)) {
      const q = P(u, v), top = q[1] - 15 * z;
      g.strokeStyle = C('#4f8f45'); g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0], top); g.stroke();
      for (const s of [-1, 1]) ellipse(q[0] + s * 2.2 * z, q[1] - 7 * z + s * z, 2.4 * z, 1.1 * z, C('#5aa84f'));
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ellipse(q[0] + Math.cos(a) * 2.6 * z, top + Math.sin(a) * 2.6 * z, 1.5 * z, 1.5 * z, C('#ffcf2a')); }
      circle(q[0], top, 2 * z, C('#7a4a22'));
    }
  } else if (form === 'wild') {                                            // Wildblumen: ohne Rand, Gräser dazwischen
    disc(R * 0.95, '#6fae55');
    for (const [u, v, i] of scatter(24 * span * span, (u, v) => u * u + v * v < R * R * 0.82, 0.9)) {   // kräftiger (Nutzer: zu blass)
      const q = P(u, v);
      if (i % 4 === 0) { g.strokeStyle = C('#4f8a3e'); g.lineWidth = 0.8 * z; g.beginPath(); for (const k of [-1, 0, 1]) { g.moveTo(q[0], q[1]); g.lineTo(q[0] + k * 1.6 * z, q[1] - 5.5 * z); } g.stroke(); }
      else { g.strokeStyle = C('#4f8a3e'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0], q[1] - 4.5 * z); g.stroke();
        const col = ['#ffffff', '#ffd23f', '#4f7fe0', '#e8364f', '#b07ad6', '#ff8f3a'][i % 6]; circle(q[0], q[1] - 5 * z, 1.9 * z, C(col)); circle(q[0], q[1] - 5 * z, 0.6 * z, C(col === '#ffffff' ? '#ffd23f' : '#fff3b0')); }
    }
  } else {                                                                 // Blumenfeld (bisher)
    soilPoly(quad(R), '#a8764c');
    const pts = [];
    for (let i = 0; i < 14 * span * span; i++) {
      const u = (hash(x, y, 100 + i) - 0.5) * (0.62 + span - 1), v = (hash(x, y, 120 + i) - 0.5) * (0.62 + span - 1);
      pts.push([cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z, i]);
    }
    pts.sort((a, b) => a[1] - b[1]);
    for (const [px, py, i] of pts) { circle(px, py - 1.5 * z, 2.4 * z, C('#5aa84f')); circle(px, py - 3 * z, 2.2 * z, C(FLOWER_COLS[i % FLOWER_COLS.length])); }
  }
}

// --- Bänke (gedreht wie bisher über den Baukasten: Sitz schaut nach vorn) ---------------------------------
function drawBench(cx, cy, z, t, hw, hh) {
  const col = lookCol('bank', t), form = lookForm('bank', t), top = shade(col, 0.1), K = kit(cx, cy, z, (t && t.rot) || 0);
  const iron = '#4a4a58';
  shadow(cx, cy, hw * 0.35, hh * 0.25);
  const dk = shade(col, -0.2);
  const seat = (hb = 0.46) => { for (const b of [-hb + 0.06, hb - 0.06]) kPost(K, 0.16, b, 5, dk, 1.3); K.block({ a: 0.06, ha: 0.14, hb, h: 1.4, lift: 4.6, wall: col, roof: top, type: 'flat' }); };
  if (form === 'garten') {
    // Englische Gartenbank (Block 147, vorher ein frei schwebender Bogen über der Lehne): Latten-Lehne mit geschwungenem
    // Abschluss, Armlehnen auf Pfosten
    K.scene([
      [-0.1, 0, () => { for (const b of [-0.44, 0.44]) kPost(K, -0.1, b, 13, dk, 1.4);
        K.block({ a: -0.1, ha: 0.03, hb: 0.44, h: 6.5, lift: 6, wall: col, roof: top, type: 'flat' });
        g.strokeStyle = C(dk); g.lineWidth = 0.7 * z; g.beginPath();
        for (let i = -3; i <= 3; i++) { const b = i * 0.11, p0 = K.P(-0.07, b, 6.4), p1 = K.P(-0.07, b, 12); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); }
        g.stroke();
        g.fillStyle = C(top); g.beginPath();
        for (let i = 0; i <= 12; i++) { const b = -0.46 + 0.92 * i / 12, p = K.P(-0.1, b, 12.5 + 2.6 * Math.cos(b / 0.46 * Math.PI / 2)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        for (let i = 12; i >= 0; i--) { const p = K.P(-0.1, -0.46 + 0.92 * i / 12, 11.6); g.lineTo(p[0], p[1]); }
        g.closePath(); g.fill(); }],
      [0.08, 0, () => { seat(); for (const b of [-0.46, 0.46]) { K.block({ a: 0.02, b, ha: 0.13, hb: 0.03, h: 1.2, lift: 8.4, wall: col, roof: top, type: 'flat' }); kPost(K, 0.14, b, 8.4, dk, 1.2); } }],
    ]);
  } else if (form === 'blumen') {                                       // kurze Bank mit je einem Blumenkasten (Block 147)
    const box = b => {
      K.block({ a: 0.02, b, ha: 0.16, hb: 0.1, h: 5, wall: '#9a6a46', roof: '#7a5236', type: 'flat' });
      for (const [da, db] of [[-0.1, 0], [0.1, 0.02]]) { const p = K.P(0.02 + da, b + db, 5.6); circle(p[0], p[1], 1.6 * z, C('#5aa84f')); }
      for (const [da, db, c] of [[-0.08, -0.05, '#f28cb1'], [0.06, 0.04, '#ffd36e'], [-0.02, 0.06, '#ffffff'], [0.08, -0.06, '#b9a3ee'], [0, 0, '#f6b6cb']]) { const p = K.P(0.02 + da, b + db, 6.6); circle(p[0], p[1], 1.8 * z, C(c)); }
    };
    K.scene([
      [-0.1, 0, () => { for (const b of [-0.32, 0.32]) kPost(K, -0.1, b, 11, dk, 1.4); K.block({ a: -0.1, ha: 0.035, hb: 0.34, h: 5, lift: 6.5, wall: col, roof: top, type: 'flat' }); }],
      [0.04, -0.5, () => box(-0.5)],
      [0.08, 0, () => seat(0.34)],
      [0.04, 0.5, () => box(0.5)],
    ]);
  } else if (form === 'laube') {                                        // Laubenbank: Bank unter einem Rosenbogen (Block 147)
    const archH = b => 22 + 6 * Math.cos(Math.min(0.5, Math.abs(b)) / 0.5 * Math.PI / 2);
    K.scene([
      [-0.22, 0, () => {
        for (const b of [-0.5, 0.5]) kPost(K, -0.2, b, 22, '#7a5236', 1.4);
        g.strokeStyle = C('#7a5236'); g.lineWidth = 1.4 * z; g.beginPath();
        for (let i = 0; i <= 14; i++) { const b = -0.5 + i / 14, p = K.P(-0.2, b, archH(b)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.stroke();
        const leaf = (b, h, i) => { const p = K.P(-0.2, b, h); circle(p[0], p[1], 2.6 * z, C(i % 2 ? '#4f9e4a' : '#5db556')); if (i % 3 === 0) circle(p[0] + 1 * z, p[1] - 1 * z, 1.3 * z, C('#f28cb1')); };
        let i = 0;
        for (const b of [-0.5, 0.5]) for (let h = 4; h < 21; h += 4.5) leaf(b, h, i++);   // an den Pfosten hoch
        for (let k = 0; k <= 12; k++) { const b = -0.5 + k / 12; leaf(b, archH(b), i++); }   // über den Bogen
        for (const b of [-0.4, 0.4]) kPost(K, -0.1, b, 11, dk, 1.3);
        K.block({ a: -0.1, ha: 0.035, hb: 0.42, h: 5, lift: 6.5, wall: col, roof: top, type: 'flat' });
      }],
      [0.08, 0, () => seat(0.44)],
    ]);
  } else if (form === 'stein') {                                        // Steinplatte auf zwei Blöcken, Sitzkissen in Farbe
    K.scene([[0, 0, () => {
      for (const b of [-0.32, 0.32]) K.block({ a: 0, b, ha: 0.12, hb: 0.06, h: 4.2, wall: '#b9b4a8', roof: '#cdc8bc', type: 'flat' });
      K.block({ a: 0, ha: 0.16, hb: 0.46, h: 1.6, lift: 4.2, wall: '#c9c4b8', roof: '#dcd7cb', type: 'flat' });
      K.block({ a: 0.01, ha: 0.12, hb: 0.38, h: 0.9, lift: 5.8, wall: shade(col, -0.1), roof: col, type: 'flat' }); }]]);
  } else if (form === 'picknick') {                                     // Tisch mit zwei Bänken
    K.scene([
      [-0.2, 0, () => { for (const b of [-0.3, 0.3]) kPost(K, -0.2, b, 3.6, shade(col, -0.25), 1.1); K.block({ a: -0.2, ha: 0.05, hb: 0.36, h: 1, lift: 3.6, wall: col, roof: top, type: 'flat' }); }],
      [0, 0, () => { for (const b of [-0.28, 0.28]) kPost(K, 0, b, 7, shade(col, -0.25), 1.3); K.block({ a: 0, ha: 0.11, hb: 0.38, h: 1.2, lift: 7, wall: col, roof: top, type: 'flat' }); }],
      [0.2, 0, () => { for (const b of [-0.3, 0.3]) kPost(K, 0.2, b, 3.6, shade(col, -0.25), 1.1); K.block({ a: 0.2, ha: 0.05, hb: 0.36, h: 1, lift: 3.6, wall: col, roof: top, type: 'flat' }); }],
    ]);
  } else if (form === 'rund') {
    // Rundbank (Block 147, Rückmeldung Nutzer: viel zu klein neben der Parkbank): Sitzring so breit wie eine Parkbank lang ist,
    // innen eine niedrige Lehne, in der Mitte ein richtiger kleiner Baum. Hintere Hälfte – Stamm – vordere Hälfte, damit der Ring
    // den Stamm vorn verdeckt
    const R = 17, W = 4.2, lift = 6, oy = 0.5;
    const band = (r0, r1, l, h, c, a0, a1) => {                         // Ringstück zwischen r0 und r1 (innen/außen), Höhe h über l
      const top = cy - (l + h) * z;
      g.fillStyle = C(shade(c, -0.22)); g.beginPath(); g.ellipse(cx, cy - l * z, r1 * z, r1 * oy * z, 0, a0, a1); g.ellipse(cx, top, r1 * z, r1 * oy * z, 0, a1, a0, true); g.closePath(); g.fill();
      g.fillStyle = C(c); g.beginPath(); g.ellipse(cx, top, r1 * z, r1 * oy * z, 0, a0, a1); g.ellipse(cx, top, r0 * z, r0 * oy * z, 0, a1, a0, true); g.closePath(); g.fill();
    };
    shadow(cx, cy + 1 * z, (R + 3) * z, (R + 3) * oy * z);
    const legs = (front) => { for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; if ((Math.sin(a) > 0) !== front) continue;
      g.fillStyle = C(iron); g.fillRect(cx + Math.cos(a) * (R - 2) * z - 0.6 * z, cy + Math.sin(a) * (R - 2) * oy * z - lift * z, 1.2 * z, lift * z); } };
    legs(false);
    band(R - W, R, lift, 1.4, col, Math.PI, Math.PI * 2);              // Sitz hinten
    band(R - W - 1.2, R - W, lift, 5.5, col, Math.PI, Math.PI * 2);    // Lehne hinten (innen)
    g.fillStyle = C('#8a5a3c'); g.fillRect(cx - 2.2 * z, cy - 26 * z, 4.4 * z, 22 * z);                     // Stamm
    g.fillStyle = C('#74492f'); g.fillRect(cx + 0.7 * z, cy - 26 * z, 1.5 * z, 22 * z);
    for (const [dx, dy, r, c] of [[-9, -27, 9.5, '#4a9446'], [9, -27, 9.5, '#458c42'], [0, -31, 12, '#4f9e4a'], [-6, -38, 9.5, '#58ad52'], [6, -38, 9, '#5db556'], [0, -44, 8, '#6cc062']])
      circle(cx + dx * z, cy + dy * z, r * z, C(c));
    legs(true);
    band(R - W - 1.2, R - W, lift, 5.5, col, 0, Math.PI);              // Lehne vorn
    band(R - W, R, lift, 1.4, col, 0, Math.PI);                        // Sitz vorn
  } else {                                                              // Parkbank (wie bisher)
    K.scene([
      [-0.1, 0, () => { for (const b of [-0.4, 0.4]) kPost(K, -0.1, b, 11, '#6b4f3a', 1.4);
        K.block({ a: -0.1, ha: 0.035, hb: 0.47, h: 5, lift: 6.5, wall: col, roof: top, type: 'flat' }); }],
      [0.08, 0, () => { for (const b of [-0.4, 0.4]) kPost(K, 0.16, b, 5, '#6b4f3a', 1.4);
        K.block({ a: 0.06, ha: 0.14, hb: 0.47, h: 1.4, lift: 4.6, wall: col, roof: top, type: 'flat' }); }],
    ]);
  }
}

// --- Brunnen (Größen über die Feldgröße hw/hh) ---------------------------------------------------------
function waterDrops(cx, cy, z, now, n, spread, high, col = 'rgba(200,240,255,') {
  for (let i = 0; i < n; i++) {
    const ph = (now / 900 + i / n) % 1, a = i / n * Math.PI * 2;
    circle(cx + Math.cos(a) * ph * spread * z, cy + Math.sin(a) * ph * spread * 0.5 * z - Math.sin(ph * Math.PI) * high * z, 1.2 * z, `${col}${(1 - ph).toFixed(2)})`);
  }
}
function basin(cx, cy, hw, hh, z, k = 0.7, rim = '#d2d5de', side = '#aeb2bd', water = '#74d0e6') {
  ellipse(cx, cy, hw * k, hh * k, C(side));
  ellipse(cx, cy - 3 * z, hw * k, hh * k, C(rim));
  ellipse(cx, cy - 3 * z, hw * (k - 0.13), hh * (k - 0.13), C(water));
  ellipse(cx - hw * 0.18, cy - 3.8 * z, hw * 0.16, hh * 0.08, 'rgba(255,255,255,0.4)');
}
function drawFountain(cx, cy, z, now, x, y, t, hw, hh) {
  const form = lookForm('brunnen', t);
  if (form === 'fontaene') {                                            // flaches Becken, hohe Fontäne mit Sprühregen
    basin(cx, cy, hw, hh, z, 0.74);
    const h = 26;
    g.strokeStyle = 'rgba(214,244,255,0.85)'; g.lineWidth = 2.2 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, cy - 4 * z); g.lineTo(cx, cy - h * z); g.stroke();
    circle(cx, cy - h * z, 1.8 * z, C('#ecfaff'));
    for (let i = 0; i < 10; i++) {                                      // fällt rundherum herab
      const ph = (now / 1100 + i / 10) % 1, a = i / 10 * Math.PI * 2, r = 3 + ph * 9;
      circle(cx + Math.cos(a) * r * z, cy - (h - ph * (h - 4)) * z + Math.sin(a) * r * 0.4 * z, 1.1 * z, `rgba(205,240,255,${(1 - ph * 0.8).toFixed(2)})`);
    }
  } else if (form === 'fisch') {                                        // Sockel mit Fisch, der einen Bogen ins Becken spuckt
    basin(cx, cy, hw, hh, z, 0.72);
    const px = cx - 4 * z, py = cy - 3 * z;
    box(px, py, 3.2 * z, 1.8 * z, 6 * z, '#cfc9bc', '#e0dbcf', 0);
    const fy = py - 9 * z;
    ellipse(px, fy, 4.2 * z, 2.6 * z, C('#e9a23b'));
    poly([[px - 3.6 * z, fy], [px - 6.6 * z, fy - 2.6 * z], [px - 6.6 * z, fy + 2.6 * z]], C('#d98b2a'));   // Schwanz
    circle(px + 2 * z, fy - 0.7 * z, 0.6 * z, C('#3d2c22'));
    g.strokeStyle = 'rgba(200,240,255,0.85)'; g.lineWidth = 1.4 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(px + 4 * z, fy); g.quadraticCurveTo(px + 11 * z, fy - 6 * z, px + 12 * z, cy - 3 * z); g.stroke();
    for (let i = 0; i < 4; i++) { const ph = (now / 600 + i / 4) % 1; circle(px + 12 * z + Math.cos(i * 1.7) * ph * 3 * z, cy - 3 * z - Math.sin(ph * Math.PI) * 2 * z, 0.9 * z, `rgba(220,248,255,${(1 - ph).toFixed(2)})`); }
  } else if (form === 'blumen') {                                       // Becken mit Blumenkranz, kleine Quelle in der Mitte
    basin(cx, cy, hw, hh, z, 0.7);
    const cols = ['#f28cb1', '#ffd23f', '#fffaf0', '#b07ad6', '#e8604f'];
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, fx = cx + Math.cos(a) * hw * 0.66, fy = cy - 3.5 * z + Math.sin(a) * hh * 0.66;
      circle(fx, fy, 1.6 * z, C(i % 2 ? '#58ad52' : '#62b85a'));
      circle(fx, fy - 1 * z, 1.1 * z, C(cols[i % cols.length]));
    }
    ellipse(cx, cy - 4 * z, 3 * z, 1.5 * z, C('#d2d5de'));
    waterDrops(cx, cy - 6 * z, z, now, 6, 6, 4);
  } else {                                                              // Etagenbrunnen: zwei Schalen, Wasser fällt kaskadenartig
    basin(cx, cy, hw, hh, z, 0.72);
    const stone = '#d8d4cc', dark = '#b9b4a8';
    g.fillStyle = C(dark); g.fillRect(cx - 2 * z, cy - 16 * z, 4 * z, 13 * z);
    g.fillStyle = C(stone); g.fillRect(cx - 2 * z, cy - 16 * z, 1.4 * z, 13 * z);
    const bowl = (y0, r) => { ellipse(cx, y0 + 1.6 * z, r * 0.8 * z, r * 0.34 * z, C(dark)); ellipse(cx, y0, r * z, r * 0.42 * z, C(stone)); ellipse(cx, y0 - 0.3 * z, (r - 1.6) * z, (r - 1.6) * 0.42 * z, C('#8fdcef')); };
    bowl(cy - 11 * z, 12);
    g.fillStyle = C(dark); g.fillRect(cx - 1.4 * z, cy - 23 * z, 2.8 * z, 12 * z);
    bowl(cy - 21 * z, 7);
    for (const [r, y0] of [[12, -11], [7, -21]]) for (let i = 0; i < 6; i++) {   // Wasser läuft über den Rand
      const a = Math.PI * (0.12 + i / 5 * 0.76), ph = (now / 700 + i / 6 + r) % 1, wx = cx + Math.cos(a) * r * z, wy = cy + y0 * z + Math.sin(a) * r * 0.42 * z;
      g.strokeStyle = `rgba(190,236,250,${0.8 - ph * 0.4})`; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx, wy + (r === 12 ? 7 : 8.5) * z * (0.6 + ph * 0.4)); g.stroke();
    }
    waterDrops(cx, cy - 25 * z, z, now, 6, 5, 3);
  }
}
// Kristallbrunnen: achteckiges Becken, Kristallkrone in der Mitte, leuchtende Kaskade, funkelt
function drawCrystalFountain(cx, cy, z, now, x, y, hw, hh) {
  const oct = (r, dy, c) => poly(Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) / 8 * Math.PI * 2; return [cx + Math.cos(a) * hw * r, cy + dy * z + Math.sin(a) * hh * r]; }), C(c));
  oct(0.78, 0, '#9fb0c4'); oct(0.78, -3, '#e6edf6'); oct(0.64, -3, '#9fdcf7');
  ellipse(cx - hw * 0.2, cy - 4 * z, hw * 0.16, hh * 0.08, 'rgba(255,255,255,0.5)');
  crystal(cx - 6 * z, cy - 2 * z, z, 10 * z, 2.4 * z, -0.32);
  crystal(cx + 6.5 * z, cy - 1.5 * z, z, 9 * z, 2.3 * z, 0.34);
  crystal(cx - 2.5 * z, cy - 1 * z, z, 15 * z, 2.8 * z, -0.1);
  crystal(cx + 2.5 * z, cy - 1 * z, z, 14 * z, 2.6 * z, 0.14);
  crystal(cx, cy - 2 * z, z, 22 * z, 3.6 * z, 0.02);
  for (let i = 0; i < 8; i++) {                                         // leuchtende Kaskade von der Spitze
    const ph = (now / 1000 + i / 8) % 1, a = i / 8 * Math.PI * 2;
    circle(cx + Math.cos(a) * ph * 11 * z, cy - 24 * z + ph * 20 * z + Math.sin(a) * ph * 3 * z, 1.2 * z, `rgba(170,235,255,${(1 - ph).toFixed(2)})`);
  }
  for (let i = 0; i < 7; i++) {                                         // Sterne blitzen nacheinander auf
    const ph = (now / 1300 + i / 7) % 1, a = ph < 0.5 ? Math.sin(ph * 2 * Math.PI) : 0;
    if (a <= 0.05) continue;
    const sx = cx + (hash(x, y, 150 + i) - 0.5) * hw * 1.1, sy = cy - 3 * z + (hash(x, y, 160 + i) - 0.5) * hh * 0.8 - hash(x, y, 170 + i) * 22 * z, s = 2.4 * z * a;
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * 0.3, sy); g.lineTo(sx, sy + s); g.lineTo(sx - s * 0.3, sy); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx, sy + s * 0.3); g.lineTo(sx + s, sy); g.lineTo(sx, sy - s * 0.3); g.closePath(); g.fill();
  }
  glowQuad([[cx - 6 * z, cy - 24 * z], [cx + 6 * z, cy - 24 * z], [cx + 6 * z, cy - 2 * z], [cx - 6 * z, cy - 2 * z]], 56 * z, 'blue');
}
