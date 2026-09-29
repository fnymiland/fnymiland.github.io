'use strict';
// ---------------------------------------------------------------------------
// Wunderwerke: Baustelle (Zaun, Material, Gerüst, das Bauwerk wächst von unten) und die fertigen Bauwerke
// ---------------------------------------------------------------------------
// Rundbauten in Bildschirm-Koordinaten: (x, y) = Mitte unten, rx/ry = Radien, h = Höhe (Pixel)
function cyl(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.lineTo(x - rx, y - h); g.lineTo(x + rx, y - h); g.closePath(); g.fill();
  g.fillStyle = C(shade(col, LIGHT.side));
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y - h); g.lineTo(x + rx, y - h); g.closePath(); g.fill();
  ellipse(x, y - h, rx, ry, C(shade(col, 0.06)));
}
function cone(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.lineTo(x, y - h); g.closePath(); g.fill();
  g.fillStyle = C(shade(col, LIGHT.roofShade));
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y - h); g.closePath(); g.fill();
}
function dome(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, h, 0, Math.PI, 0); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.fill();
  g.fillStyle = C(shade(col, -0.12));
  g.beginPath(); g.ellipse(x, y, rx, h, 0, -Math.PI / 2, 0); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y); g.closePath(); g.fill();
}
function pennant(x, y, z, now, col) {
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9 * z); g.stroke();
  const w = Math.sin(now / 260 + x) * 1.5 * z;
  poly([[x, y - 9 * z], [x + 7 * z, y - 7.5 * z + w], [x, y - 5.5 * z]], C(col));
}

const WONDER_ART = {
  // Riesenrad: zwei Stützböcke, Rad mit Speichen dreht sich langsam, Gondeln hängen immer gerade; nachts Lichterkette
  riesenrad(K, cx, cy, z, now) {
    if (groundPart(() => { K.rect(-1.45, -1.45, 1.45, 1.45, C('#e6dfd0')); K.oval(0, 0, 1.1, C('#d8cfbd')); })) return;
    kShadow(K, 1.1);
    const R = 40 * z, hx = cx, hy = cy - 58 * z, rot = now / 9000, lit = night > 0.15 && isLive();
    const leg = (bx, by) => { g.beginPath(); g.moveTo(bx, by); g.lineTo(hx, hy); g.stroke(); };
    g.strokeStyle = C('#dcd6ca'); g.lineWidth = 3 * z; g.lineCap = 'round';
    leg(cx - R * 0.55, cy - 10 * z); leg(cx + R * 0.55, cy - 10 * z);                    // hintere Stützen
    g.strokeStyle = C('#f4f1ea'); g.lineWidth = 2.3 * z;
    g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1.2 * z; g.beginPath(); g.arc(hx, hy, R * 0.9, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 0.8 * z; g.beginPath();
    for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2; g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); }
    g.stroke();
    const cols = ['#e8604f', '#6f8fd8', '#f2c14e', '#58b36a', '#f28cb1', '#b07ad6'];
    for (let i = 0; i < 12; i++) {                                              // Gondeln
      const a = rot + i / 12 * Math.PI * 2, gx = hx + Math.cos(a) * R, gy = hy + Math.sin(a) * R;
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.7 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 3 * z); g.stroke();
      poly([[gx - 3.6 * z, gy + 3 * z], [gx + 3.6 * z, gy + 3 * z], [gx + 3 * z, gy + 9 * z], [gx - 3 * z, gy + 9 * z]], C(cols[i % 6]));
      poly([[gx - 2.4 * z, gy + 4.2 * z], [gx + 2.4 * z, gy + 4.2 * z], [gx + 2.2 * z, gy + 6.4 * z], [gx - 2.2 * z, gy + 6.4 * z]], lit ? '#ffd873' : C('#e6f4ff'));
      ellipse(gx, gy + 3 * z, 4 * z, 1.4 * z, C(shade(cols[i % 6], -0.15)));
    }
    circle(hx, hy, 4 * z, C('#d9534a')); circle(hx, hy, 1.8 * z, C('#f4f1ea'));
    g.strokeStyle = C('#f4f1ea'); g.lineWidth = 3.2 * z;
    leg(cx - R * 0.8, cy + 4 * z); leg(cx + R * 0.8, cy + 4 * z);                     // vordere Stützen
    if (lit) for (let i = 0; i < 24; i++) {
      const a = rot + i / 24 * Math.PI * 2, lx = hx + Math.cos(a) * R, ly = hy + Math.sin(a) * R;
      circle(lx, ly, 1.1 * z, ['#ffe58a', '#ff9fc4', '#9fdcf7'][i % 3]);
      glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 9 * z);
    }
    K.scene([[1.1, 1.0, () => {                                                    // Kassenhäuschen
      const B = K.block({ a: 1.1, b: 1.0, ha: 0.16, hb: 0.16, h: 10, wall: '#fffaf0', roof: '#e8604f', roofH: 7 });
      K.door(B, 'front', 0.3, 0.7, 0.7, '#6f8fd8');
    }]]);
  },
  // Sternwarte: runder Turm mit Kuppel; nachts ist der Spalt offen und das Fernrohr schaut heraus
  sternwarte(K, cx, cy, z, now) {
    if (groundPart(() => { K.rect(-0.95, -0.95, 0.95, 0.95, C('#e6dfd0')); })) return;
    kShadow(K, 0.8);
    const lit = night > 0.15 && isLive();
    const tower = () => {
      const [x0, y0] = K.P(-0.15, 0.05), rx = 25 * z, ry = 12.5 * z, H = 26 * z;
      cyl(x0, y0, rx, ry, H, '#f6efe2');
      for (const dx of [-14, -4, 6]) faceQuadRect(x0 + dx * z, y0 + (ry * 0.6), 5 * z, H * 0.28, H * 0.62, lit);
      dome(x0, y0 - H, rx * 1.03, ry * 1.03, 24 * z, '#cfd8e3');
      const top = y0 - H - 24 * z;
      if (lit) {
        poly([[x0 - 3.5 * z, y0 - H - 2 * z], [x0 + 3.5 * z, y0 - H - 2 * z], [x0 + 3 * z, top + 1 * z], [x0 - 3 * z, top + 1 * z]], '#2c3245');
        g.strokeStyle = '#5a6278'; g.lineWidth = 4 * z; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0 - H - 12 * z); g.lineTo(x0 + 10 * z, top - 8 * z); g.stroke();
        for (let i = 0; i < 5; i++) { const tw = (Math.sin(now / 500 + i * 1.7) + 1) / 2; circle(x0 - 20 * z + i * 11 * z, top - 14 * z - (i % 2) * 7 * z, (0.6 + tw) * z, `rgba(255,248,200,${0.4 + tw * 0.6})`); }
      } else {
        g.strokeStyle = C('#aab5c2'); g.lineWidth = 3 * z; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(x0, y0 - H - 1 * z); g.lineTo(x0, top + 1 * z); g.stroke();
      }
      circle(x0, top - 1 * z, 1.6 * z, C('#f2c14e'));
    };
    const annex = () => {
      const B = K.block({ a: 0.55, b: -0.5, ha: 0.28, hb: 0.3, h: 13, wall: '#f3e1c4', roof: '#6f8fd8', roofH: 7, entry: true });
      K.door(B, 'front', 0.4, 0.6, 0.6);
      K.sideWins(B, 1, 0.35, 0.72);
    };
    K.scene([[-0.15, 0.05, tower], [0.55, -0.5, annex]]);
  },
  // Seebrücke: Holzsteg auf Pfählen vom Ufer ins Meer, Geländer und Laternen, am Ende ein runder Pavillon
  seebruecke(K, cx, cy, z, now) {
    if (groundPart(() => {})) return;
    const Wb = 0.26;
    const deck = () => {
      for (let a = -1.7; a <= 1.9; a += 0.45) for (const s of [-1, 1]) {
        const [px, py] = K.P(a, s * Wb);
        g.fillStyle = C('#6f5238'); g.fillRect(px - 1.2 * z, py - 5 * z, 2.4 * z, 9 * z);
      }
      K.rect(-2, -Wb - 0.02, 1.3, Wb + 0.02, C('#8a6440'), 3);
      K.rect(-2, -Wb, 1.3, Wb, C('#c29a6a'), 5);
      g.strokeStyle = C('#a57c52'); g.lineWidth = 0.6 * z; g.beginPath();
      for (let a = -1.9; a < 1.3; a += 0.14) { const p = K.P(a, -Wb, 5), q = K.P(a, Wb, 5); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
      for (const s of [-1, 1]) {
        kLine(K, K.P(-2, s * Wb, 11), K.P(1.3, s * Wb, 11), '#f4f1ea', 1);
        for (let a = -2; a <= 1.3; a += 0.33) kLine(K, K.P(a, s * Wb, 5), K.P(a, s * Wb, 11), '#f4f1ea', 0.8);
      }
      for (const a of [-1.2, 0.2]) { const [lx, ly] = K.P(a, Wb, 5); lampPost(lx, ly, z, 14); }
    };
    const pav = () => {
      const [px, py] = K.P(1.6, 0, 5);
      ellipse(px, py, 22 * z, 11 * z, C('#8a6440'));
      ellipse(px, py - 2 * z, 22 * z, 11 * z, C('#c29a6a'));
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, x0 = px + Math.cos(a) * 17 * z, y0 = py - 2 * z + Math.sin(a) * 8.5 * z;
        g.strokeStyle = C('#f4f1ea'); g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 - 14 * z); g.stroke();
      }
      cone(px, py - 16 * z, 24 * z, 12 * z, 14 * z, '#6f8fd8');
      circle(px, py - 30 * z, 1.8 * z, C('#f2c14e'));
    };
    K.scene([[-0.4, 0, deck], [1.6, 0, pav]]);
  },
  // Botanischer Garten: Gärten mit Wegkreuz, Beeten und Teich; Palmenhaus aus Glas (Rotunde mit Kuppel, zwei Flügel)
  botgarten(K, cx, cy, z, now, x, y, t) {
    if (groundPart(() => {
      K.rect(-1.45, -1.45, 1.45, 1.45, C('#8ccb67'));
      K.rect(-1.45, -0.13, 1.45, 0.13, C('#e6dcc4')); K.rect(-0.13, -1.45, 0.13, 1.45, C('#e6dcc4'));
      K.oval(0.9, -0.9, 0.32, C('#74d0e6'));
      for (const [a, b] of [[0.9, 0.9], [-0.9, 0.9], [-0.9, -0.9]]) {
        K.oval(a, b, 0.3, C('#a8764c'));
        for (let i = 0; i < 7; i++) { const [fx, fy] = K.P(a + Math.cos(i) * 0.18, b + Math.sin(i * 1.3) * 0.18); circle(fx, fy - 1 * z, 1.8 * z, C(FLOWER_COLS[(i + a * 3 | 0) % FLOWER_COLS.length])); }
      }
    })) return;
    const lit = night > 0.15 && isLive(), glass = lit ? '#ffe7a8' : '#cbecf8';
    const wing = b0 => () => {
      const [wx, wy] = K.P(0, b0);
      BUILDING_ART.glashaus(kit(wx, wy, z * 0.72, K.r), 1, now, x, y, {});
    };
    const rotunda = () => {
      const [x0, y0] = K.P(0, 0), rx = 22 * z, ry = 11 * z, H = 20 * z;
      cyl(x0, y0, rx, ry, H, glass);
      for (let i = 0; i < 7; i++) {                                               // Palmen hinter dem Glas
        const px = x0 - rx * 0.8 + i * rx * 0.27, py = y0 - 4 * z;
        g.strokeStyle = lit ? 'rgba(96,120,58,0.8)' : C('#6a9a4a'); g.lineWidth = 1.2 * z;
        g.beginPath(); g.moveTo(px, py + 4 * z); g.lineTo(px, py - 12 * z); g.stroke();
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(px, py - 12 * z); g.quadraticCurveTo(px + s * 5 * z, py - 16 * z, px + s * 8 * z, py - 10 * z); g.stroke(); }
      }
      g.strokeStyle = C('#ffffff'); g.lineWidth = 1 * z;
      g.beginPath();
      for (let i = 0; i <= 8; i++) { const px = x0 - rx + i * rx / 4; g.moveTo(px, y0 + Math.sqrt(Math.max(0, 1 - ((px - x0) / rx) ** 2)) * ry); g.lineTo(px, y0 - H); }
      g.stroke();
      dome(x0, y0 - H, rx, ry, 20 * z, lit ? '#fff0c4' : '#e0f5fc');
      g.strokeStyle = C('#ffffff'); g.lineWidth = 1 * z;
      for (let i = 1; i < 6; i++) { g.beginPath(); g.ellipse(x0, y0 - H, rx * i / 6, 20 * z, 0, Math.PI, 0); g.stroke(); }
      circle(x0, y0 - H - 21 * z, 1.8 * z, C('#f2c14e'));
      if (lit) glowQuad([[x0 - rx * 0.6, y0 - H * 0.8], [x0 + rx * 0.6, y0 - H * 0.8], [x0 + rx * 0.6, y0 - H * 0.2], [x0 - rx * 0.6, y0 - H * 0.2]], 16 * z);
    };
    K.scene([[0, -0.9, wing(-0.9)], [0, 0, rotunda], [0, 0.9, wing(0.9)]]);
  },
  // Schloss: Hof mit Mauern und Zinnen, vier runde Ecktürme mit spitzen Dächern und Fahnen, großes Haupthaus, Tor
  schloss(K, cx, cy, z, now) {
    if (groundPart(() => {
      K.rect(-1.95, -1.95, 1.95, 1.95, C('#8ccb67'));
      K.rect(-1.45, -1.45, 1.45, 1.45, C('#e6dfd0'));
      K.rect(1.45, -0.22, 1.95, 0.22, C('#e6dfd0'));
    })) return;
    const wall = '#f6e7d0', roof = '#6f8fd8', lit = night > 0.15 && isLive();
    const tower = (a, b) => () => {
      const [px, py] = K.P(a, b), rx = 13 * z, ry = 6.5 * z, H = 40 * z;
      cyl(px, py, rx, ry, H, wall);
      for (const f of [0.35, 0.65]) { const wy = py - H * f; poly([[px - 1.6 * z, wy], [px + 1.6 * z, wy], [px + 1.6 * z, wy - 4.5 * z], [px - 1.6 * z, wy - 4.5 * z]], lit ? '#ffd873' : C('#a8dcff')); }
      cone(px, py - H, rx * 1.2, ry * 1.2, 26 * z, roof);
      pennant(px, py - H - 26 * z, z, now, '#e8604f');
    };
    const wallSeg = (a, b, ha, hb) => () => {
      K.block({ a, b, ha, hb, h: 18, wall, type: 'flat', roof: shade(wall, -0.04) });
      const n = Math.round(Math.max(ha, hb) / 0.2);
      for (let i = 0; i <= n; i += 2) {
        const t0 = -1 + 2 * i / n, ca = a + (ha > hb ? t0 * ha : 0), cb = b + (hb > ha ? t0 * hb : 0);
        K.block({ a: ca, b: cb, ha: 0.07, hb: 0.07, h: 4, lift: 18, wall, type: 'flat', roof: shade(wall, -0.04) });
      }
    };
    const keep = () => {
      const B = K.block({ a: -0.2, ha: 0.7, hb: 0.95, h: 42, wall, roof, roofH: 26, entry: true });
      K.wins(B, 'front', 5, 0.18, 0.4, 0.06, 0.94, [2]);
      K.wins(B, 'front', 5, 0.58, 0.8);
      K.sideWins(B, 3, 0.25, 0.45); K.sideWins(B, 3, 0.6, 0.8);
      K.door(B, 'front', 0.44, 0.56, 0.3, '#6b4f3a');
      const [fx, fy] = K.P(-0.2, 0, 42 + 26);
      pennant(fx, fy, z * 1.3, now, '#f2c14e');
    };
    const gate = () => {
      const B = K.block({ a: 1.45, ha: 0.2, hb: 0.34, h: 26, wall, roof, roofH: 12 });
      K.door(B, 'front', 0.3, 0.7, 0.62, '#4a3a30');
    };
    K.scene([
      [-1.45, -1.45, tower(-1.45, -1.45)], [-1.45, 0, wallSeg(-1.45, 0, 0.08, 1.45)], [0, -1.45, wallSeg(0, -1.45, 1.45, 0.08)],
      [1.45, -1.45, tower(1.45, -1.45)], [-1.45, 1.45, tower(-1.45, 1.45)], [-0.2, 0, keep],
      [0, 1.45, wallSeg(0, 1.45, 1.45, 0.08)], [1.45, 0, wallSeg(1.45, 0, 0.08, 1.45)], [1.46, 0, gate], [1.45, 1.45, tower(1.45, 1.45)],
    ]);
  },
};
// kleines Fenster auf einem Rundbau (in Bildschirm-Koordinaten)
function faceQuadRect(x, y, w, h0, h1, lit) {
  poly([[x - w / 2, y - h0], [x + w / 2, y - h0], [x + w / 2, y - h1], [x - w / 2, y - h1]], lit ? '#ffd873' : C('#a8dcff'));
}

// Baustelle: Boden, Zaun, Kisten, Gerüst; das fertige Bauwerk wächst mit den Abschnitten von unten herauf
function drawWonder(id, cx, cy, z, now, x, y, t, hu, hv) {
  const W = WONDERS[id], N = W.phases.length, p = t.phase == null ? N : Math.min(t.phase, N);   // ohne Stand (Vorschaubild): fertig
  const K = kit(cx, cy, z, t.rot);
  if (p >= N) { WONDER_ART[id](K, cx, cy, z, now, x, y, t, hu, hv); return; }
  const [ha, hb] = (K.r & 1) ? [hv, hu] : [hu, hv], pier = id === 'seebruecke';
  if (groundPart(() => { if (!pier) K.rect(-ha + 0.05, -hb + 0.05, ha - 0.05, hb - 0.05, C('#d9c7a0')); })) return;
  if (p > 0) {
    g.save();
    const cut = cy - (W.h * p / N) * z;
    g.beginPath(); g.rect(-1e5, cut, 2e5, 2e5); g.clip();
    WONDER_ART[id](K, cx, cy, z, now, x, y, t, hu, hv);
    g.restore();
  }
  // Gerüst bis knapp über den aktuellen Stand
  const H = W.h * Math.max(p, 0.6) / N + 6, step = pier ? 0.8 : 0.7;
  const posts = [];
  for (let a = -ha + 0.15; a <= ha - 0.15 + 1e-6; a += step) posts.push([a, -hb + 0.15], [a, hb - 0.15]);
  for (let b = -hb + 0.15 + step; b < hb - 0.15; b += step) posts.push([-ha + 0.15, b], [ha - 0.15, b]);
  posts.sort((p1, p2) => K.depth(...p1) - K.depth(...p2));
  for (const [a, b] of posts) kPost(K, a, b, H, '#b08a5e', 1.2);
  g.strokeStyle = C('#9c7449'); g.lineWidth = 0.8 * z; g.beginPath();
  for (let hgt = 8; hgt <= H; hgt += 9) for (const [a0, b0, a1, b1] of [[-ha + 0.15, -hb + 0.15, ha - 0.15, -hb + 0.15], [-ha + 0.15, hb - 0.15, ha - 0.15, hb - 0.15],
    [-ha + 0.15, -hb + 0.15, -ha + 0.15, hb - 0.15], [ha - 0.15, -hb + 0.15, ha - 0.15, hb - 0.15]]) {
    const q0 = K.P(a0, b0, hgt), q1 = K.P(a1, b1, hgt); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]);
  }
  g.stroke();
  if (!pier) {
    K.scene([[ha - 0.3, hb - 0.35, () => K.block({ a: ha - 0.3, b: hb - 0.35, ha: 0.12, hb: 0.12, h: 6, wall: '#c9a26f', type: 'flat', roof: '#d9b98f' })],
      [ha - 0.3, -hb + 0.4, () => kPlanks(K, ha - 0.3, -hb + 0.4, 3)]]);
  }
}
for (const id of Object.keys(WONDERS)) BIG_ART[id] = (cx, cy, z, now, x, y, lvl, t, hu, hv) => drawWonder(id, cx, cy, z, now, x, y, t || {}, hu, hv);
