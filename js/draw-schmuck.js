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

// --- Bänke (gedreht wie bisher über den Baukasten: Sitz schaut nach vorn) ---------------------------------
function drawBench(cx, cy, z, t, hw, hh) {
  const col = lookCol('bank', t), form = lookForm('bank', t), top = shade(col, 0.1), K = kit(cx, cy, z, (t && t.rot) || 0);
  const iron = '#4a4a58';
  shadow(cx, cy, hw * 0.35, hh * 0.25);
  if (form === 'garten') {                                              // geschwungene Lehne, Armlehnen, filigrane Beine
    K.scene([
      [-0.1, 0, () => { for (const b of [-0.42, 0.42]) kPost(K, -0.1, b, 12, shade(col, -0.18), 1.1);
        K.block({ a: -0.1, ha: 0.03, hb: 0.44, h: 4, lift: 7, wall: col, roof: top, type: 'flat' });
        const [ax, ay] = K.P(-0.1, 0, 13.5);                                // Bogen über der Lehne
        g.strokeStyle = C(col); g.lineWidth = 1.2 * z; g.beginPath(); g.ellipse(ax, ay, 9 * z, 2 * z, 0, Math.PI, 0); g.stroke(); }],
      [0.08, 0, () => { for (const b of [-0.42, 0.42]) kPost(K, 0.16, b, 5, shade(col, -0.18), 1.1);
        K.block({ a: 0.06, ha: 0.14, hb: 0.44, h: 1.2, lift: 4.6, wall: col, roof: top, type: 'flat' });
        for (const b of [-0.44, 0.44]) K.block({ a: 0.02, b, ha: 0.12, hb: 0.03, h: 1, lift: 8, wall: col, roof: top, type: 'flat' }); }],
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
  } else if (form === 'rund') {                                         // Rundbank: Sitzring mit Rückenlehne, in der Mitte ein Bäumchen
    const ring = (r, lift, h, c) => { for (const s of [1, 0]) { g.fillStyle = s ? C(shade(c, -0.2)) : C(c); g.beginPath(); g.ellipse(cx, cy - (lift + (s ? 0 : h)) * z, r * z, r * 0.5 * z, 0, 0, Math.PI * 2); g.ellipse(cx, cy - (lift + (s ? 0 : h)) * z, (r - 2.4) * z, (r - 2.4) * 0.5 * z, 0, 0, Math.PI * 2, true); g.fill('evenodd'); } };
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillStyle = C(iron); g.fillRect(cx + Math.cos(a) * 9.5 * z - 0.5 * z, cy + Math.sin(a) * 4.75 * z - 6 * z, 1 * z, 6 * z); }
    ring(11, 6, 1.2, col);                                              // Sitz über den Beinen
    g.fillStyle = C('#8a5a3c'); g.fillRect(cx - 1.2 * z, cy - 18 * z, 2.4 * z, 13 * z);
    for (const [dx, dy, r, c] of [[-3, -20, 4.2, '#58ad52'], [3, -20, 4.2, '#4f9e4a'], [0, -24, 5, '#62b85a']]) circle(cx + dx * z, cy + dy * z, r * z, C(c));
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
