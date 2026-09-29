'use strict';
// Ladenbilder, Gruppe b (Block 32, Block 35) – trägt sich in SHOP_ART ein (siehe draw-shops.js: shopHouse, hangSign)
// Café, Teeladen, Bubble Tea, Eisdiele – so wie die alten Gebäude: helle Wände, klare Dachfarben, große ruhige Flächen,
// und jeder Laden hat seine eigene Bauform (Café: Mansarddach mit Gauben; Teeladen: niedriges Teehaus mit geschwungenem
// Dach; Bubble Tea: moderner Rundbau mit runden Ecken; Eisdiele: achteckiger Pavillon mit Zeltdach). Das Wahrzeichen
// (Tasse, Teeblatt, Becher, Eiswaffel) hängt klein im Ausleger-Schild an der Hausecke (hangSign), das Dach bleibt frei.
(function () {
  const isLit = () => night > 0.15 && isLive();
  const line = (p, q, col, w, z) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
  const q50 = t => Math.round(t * 50) / 50;                                              // wenige Farbstufen (shade merkt sie sich)
  // Wandfarbe stufenlos nach der Richtung (für runde und schräge Wände; bei geraden Seiten wie K.wallCol)
  const wallHexAt = (K, col, n) => shade(col, q50(LIGHT.side * Math.max(0, Math.min(1, K.turn(n[0], n[1])[0]))));
  // Dachfarbe stufenlos nach der Richtung der Fläche (wie K.roofCol)
  const roofHexAt = (K, col, n) => {
    const [u, v] = K.turn(n[0], n[1]);
    return shade(col, q50((u < 0 ? -u * LIGHT.roofSun : u * LIGHT.roofShade) + (v < 0 ? -v * LIGHT.roofBack : 0)));
  };

  // Becher/Tasse als Pfad: unten Radius rb (Boden rund), oben rt; bulge wölbt die Seiten nach außen
  function cupPath(x, y0, y1, rb, rt, ry, bulge = 0) {
    const my = (y0 + y1) / 2, mr = (rb + rt) / 2 + bulge;
    g.beginPath();
    g.moveTo(x - rt, y1);
    g.quadraticCurveTo(x - mr, my, x - rb, y0);
    g.ellipse(x, y0, rb, rb * ry, 0, Math.PI, 0, true);
    g.quadraticCurveTo(x + mr, my, x + rt, y1);
    g.closePath();
  }
  // Band um einen Zylinder (vordere Hälfte) zwischen yA (oben) und yB (unten)
  function bandPath(x, yA, yB, rA, rB, ry) {
    g.beginPath();
    g.ellipse(x, yA, rA, rA * ry, 0, Math.PI, 0, true);
    g.ellipse(x, yB, rB, rB * ry, 0, 0, Math.PI, false);
    g.closePath();
  }

  // ---------------------------------------------------------------- Bauformen
  // Aufrechte Wände um einen konvexen Grundriss (Ecken [a, b] im Rahmen, Reihenfolge wie FACES: vorn → rechts → hinten →
  // links). Zeichnet nur die sichtbaren Seiten, mit Wandfuß und (deep) dunklem Streifen unter dem Dach.
  // Rückgabe: die sichtbaren Seiten { P, Q, H, n, len, curved } (runde Teile bestehen aus vielen schmalen Seiten).
  function prismWalls(K, pts, h, wall, { lift = 0, deep = false, foot = true } = {}) {
    const z = K.z, out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 1e-6) continue;
      const n = [(q[1] - p[1]) / len, -(q[0] - p[0]) / len];
      if (K.facing(n[0], n[1]) <= 0.01) continue;
      const F = { P: K.P(p[0], p[1], lift), Q: K.P(q[0], q[1], lift), H: h * z, n, len, curved: len < 0.1 };
      // schmale Teile einer Rundung überlappen ein wenig, sonst schimmern feine Fugen durch
      const t0 = F.curved ? -0.04 : 0, t1 = F.curved ? 1.04 : 1, hex = wallHexAt(K, wall, n);
      faceQuad(F.P, F.Q, t0, t1, 0, F.H, C(hex));
      if (foot && !lift && h >= 6) faceQuad(F.P, F.Q, t0, t1, 0, Math.min(1.6 * z, F.H * 0.15), C(shade(hex, -0.07)));
      if (deep) faceQuad(F.P, F.Q, t0, t1, F.H - Math.min(2.6 * z, F.H * 0.22), F.H, C(shade(hex, -0.12)));
      out.push(F);
    }
    return out;
  }
  // Glas auf einer Seite (bei Rundungen mit Überlappung, damit das Band durchgeht)
  function glass(K, F, t0, t1, h0, h1) {
    if (F.curved) { if (t0 <= 0) t0 = -0.04; if (t1 >= 1) t1 = 1.04; }
    windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, K.z);
  }
  // Rechteck, dessen beide vorderen Ecken rund sind (Radius r), Ecken wie FACES
  function roundFront(a, b, ha, hb, r, steps = 7) {
    const A = a + ha, pts = [];
    const arc = (ca, cb, th0) => { for (let k = 0; k < steps; k++) { const th = th0 + Math.PI / 2 * k / steps; pts.push([ca + Math.cos(th) * r, cb + Math.sin(th) * r]); } };
    arc(A - r, b - hb + r, -Math.PI / 2);                                                // Ecke vorn links (−b)
    pts.push([A, b - hb + r]);                                                           // gerade Vorderseite
    arc(A - r, b + hb - r, 0);                                                           // Ecke vorn rechts (+b)
    pts.push([A - r, b + hb], [a - ha, b + hb], [a - ha, b - hb]);
    return pts;
  }
  // Achteck um (a, b) mit Abstand ap von der Mitte bis zu den Seiten; Seite 0 zeigt nach vorn (+a)
  function octagon(a, b, ap) {
    const R = ap / Math.cos(Math.PI / 8);
    return Array.from({ length: 8 }, (_, k) => { const th = -Math.PI / 8 + k * Math.PI / 4; return [a + Math.cos(th) * R, b + Math.sin(th) * R]; });
  }
  // Zeltdach über einem konvexen Grundriss: alle Flächen laufen in einer Spitze zusammen. Rückgabe: die vorderen Flächen
  // { E0, E1, n, hex } (für die Traufe) und die Spitze
  function tentRoof(K, pts, a, b, top, roofH, over, col) {
    const eave = pts.map(([pa, pb]) => K.P(a + (pa - a) * over, b + (pb - b) * over, top)), apex = K.P(a, b, top + roofH);
    const slopes = pts.map((p, i) => {
      const q = pts[(i + 1) % pts.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const n = [(q[1] - p[1]) / len, -(q[0] - p[0]) / len];
      return { E0: eave[i], E1: eave[(i + 1) % pts.length], n, f: K.facing(n[0], n[1]), hex: roofHexAt(K, col, n) };
    });
    const draw = s => { poly([s.E0, s.E1, apex], C(s.hex)); g.strokeStyle = C(s.hex); g.lineWidth = 0.6; g.stroke(); };
    slopes.filter(s => s.f < 0).forEach(draw);
    slopes.filter(s => s.f >= 0).forEach(draw);
    return { front: slopes.filter(s => s.f > 0.01), apex };
  }

  // ---------------------------------------------------------------- Café
  // Kaffeetasse klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Untertasse, weiße Tasse mit
  // Espresso-Band, Kaffee und zwei Dampfkringel
  function miniCup(x, y, z) {
    const ry = 0.3, y0 = y + 2.1 * z, y1 = y - 0.9 * z, rb = 1.7 * z, rt = 2.4 * z, bulge = 0.3 * z;
    ellipse(x, y + 2.55 * z, 3.1 * z, 0.95 * z, C('#b9a896'));                          // Untertasse
    ellipse(x, y + 2.35 * z, 2.9 * z, 0.8 * z, C('#ebe1d3'));
    g.strokeStyle = C('#5b3a26'); g.lineWidth = 0.7 * z; g.lineCap = 'round';           // Henkel
    g.beginPath(); g.arc(x + rt - 0.1 * z, (y0 + y1) / 2 - 0.2 * z, 1.05 * z, -Math.PI / 2, Math.PI / 2); g.stroke();
    cupPath(x, y0, y1, rb, rt, ry, bulge);
    g.fillStyle = C('#ffffff'); g.fill();
    g.save(); g.clip();
    g.fillStyle = C('#e8ddcf'); g.fillRect(x + rt * 0.38, y1 - 1 * z, rt, y0 - y1 + 2 * z);   // Schattenseite
    bandPath(x, y1 + 1.2 * z, y1 + 2.2 * z, rt * 1.05, rt, ry);                            // Espresso-Band
    g.fillStyle = C('#5b3a26'); g.fill();
    g.restore();
    cupPath(x, y0, y1, rb, rt, ry, bulge);
    g.lineWidth = 0.4 * z; g.strokeStyle = C('#5b3a26'); g.stroke();
    ellipse(x, y1, rt, rt * ry, C('#ffffff'));                                             // Rand und Kaffee
    g.beginPath(); g.ellipse(x, y1, rt, rt * ry, 0, 0, Math.PI * 2); g.stroke();
    ellipse(x, y1 + 0.1 * z, rt - 0.45 * z, (rt - 0.45 * z) * ry, C('#6b3e22'));
    ellipse(x - 0.2 * z, y1 + 0.08 * z, rt - 1.2 * z, (rt - 1.2 * z) * ry, C('#9a6236'));
    g.strokeStyle = C('#a07a5a'); g.lineWidth = 0.5 * z; g.lineCap = 'round';            // Dampfkringel (still)
    for (const s of [-1, 1]) {
      const sx = x + s * 0.8 * z, sy = y1 - 0.8 * z, w = s * 0.6 * z;
      g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + w, sy - 0.6 * z, sx - w, sy - 1.2 * z, sx, sy - 1.8 * z); g.stroke();
    }
    kGlow(x, y, z, 14);
  }
  // Gauben auf dem steilen unteren Teil des Mansarddachs, je eine auf jeder Seite, die man sieht: Häuschen mit
  // Satteldach und Fenster, das nach außen schaut
  function dormers(K, a, b, ha, hb, h, over, wall, roof) {
    for (const [name, f] of Object.entries(FACES)) {
      const [na, nb] = f.n;
      if (K.facing(na, nb) <= 0.01) continue;
      const d = 0.045, w = 0.08, out = (na ? ha : hb) * over * 0.86 - d;
      const D = K.block({ a: a + na * out, b: b + nb * out, ha: na ? d : w, hb: na ? w : d, h: 5.5, lift: h + 2.5, wall, roof, roofH: 3.5, type: 'gable', ridge: na ? 'a' : 'b', over: 1.22 });
      K.wins(D, name, 1, 0.15, 0.85, 0.2, 0.8);
    }
  }
  SHOP_ART.cafe = function (K, s, now) {
    const a = -0.06, ha = 0.29, hb = 0.31, h = 18, roofH = 16, over = 1.14, wall = '#fff4dc', roof = '#8b5a3c';
    K.scene([
      [a, 0, () => {
        shopHouse(K, { wall, roof, awning: '#c98d5c', roofType: 'mansard', a, ha, hb, h, roofH, over, trim: roof });
        kitChimney(K, a - 0.05, 0.09, h + 11.5, now, '#c9785f');                           // Schornstein mit Rauch
        dormers(K, a, 0, ha, hb, h, over, wall, roof);
      }],
      hangSign(K, (cx, cy, z) => miniCup(cx, cy, z), roof, { up: 13 }),                 // Tasse klein am Ausleger
      [0.38, -0.24, () => kTable(K, 0.38, -0.24, '#c98d5c')],
    ]);
  };
  ART_SHADOW.cafe = [28, 0.2];

  // ---------------------------------------------------------------- Teeladen
  function leafPath(L, W) {
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(W * 1.25, -L * 0.2, W * 1.05, -L * 0.72, 0, -L);
    g.bezierCurveTo(-W * 1.05, -L * 0.72, -W * 1.25, -L * 0.2, 0, 0);
    g.closePath();
  }
  // Teeblatt mit Mittelrippe und Adern, Spitze nach oben, um ang gekippt (L, W in px)
  function teaLeaf(x, y, z, L, W, ang, light, dark, veins = 4) {
    const l = L * z, w = W * z;
    g.save(); g.translate(x, y); g.rotate(ang);
    leafPath(l, w);
    g.save(); g.clip();
    g.fillStyle = C(light); g.fillRect(-w * 2, -l, w * 2, l + 1);
    g.fillStyle = C(dark); g.fillRect(0, -l, w * 2, l + 1);
    ellipse(-w * 0.45, -l * 0.55, w * 0.25, l * 0.16, C(shade(light, 0.3)));           // Glanz
    g.strokeStyle = C('#2e7d4f'); g.lineCap = 'round';
    g.lineWidth = 0.55 * z; g.beginPath();
    for (let k = 1; k <= veins; k++) {
      const vy = -l * (0.12 + k * 0.72 / (veins + 1)), vw = w * (1.05 - k * 0.12);
      g.moveTo(0, vy); g.lineTo(-vw, vy - l * 0.12); g.moveTo(0, vy); g.lineTo(vw, vy - l * 0.12);
    }
    g.stroke();
    g.lineWidth = 0.95 * z; g.beginPath(); g.moveTo(0, -0.3 * z); g.lineTo(0, -l * 0.9); g.stroke();   // Mittelrippe
    g.restore();
    leafPath(l, w);
    g.lineWidth = 1.1 * z; g.strokeStyle = C('#1f5e3a'); g.stroke();
    g.restore();
  }
  // Teezweig klein fürs Ausleger-Schild: Knospe, kleines und großes Blatt am Stiel (verkleinert, Mitte bei x, y)
  function miniTea(x, y, z) {
    const k = 0.26;
    g.save(); g.translate(x - 1 * k * z, y + 14.5 * k * z); g.scale(k, k);
    line([0, 0.5 * z], [0, -3.5 * z], '#4f7a2e', 1.6, z);
    teaLeaf(0, -3 * z, z, 10, 2.6, -0.2, '#d4f59c', '#aee27a', 2);                         // Knospe
    teaLeaf(-0.5 * z, -2 * z, z, 14, 4.2, -0.95, '#a6e878', '#7acb5c', 3);                 // kleines Blatt
    teaLeaf(0.3 * z, -2.5 * z, z, 27, 7.5, 0.3, '#8ee06a', '#5cbf55', 4);                  // großes Blatt
    g.restore();
    kGlow(x, y, z, 14);
  }
  // Geschwungenes Teehaus-Dach: Walmdach mit weiter Traufe, die Ecken hochgebogen und die Grate durchhängend
  function teaRoof(K, a, b, ha, hb, top, roofH, over, col, curl = 6) {
    const z = K.z, ea = ha * over, eb = hb * over, alongA = ha >= hb;
    const CORNERS = [[1, -1], [1, 1], [-1, 1], [-1, -1]];                               // im Kreis wie FACES
    const at = (da, db, up) => K.P(a + da, b + db, up);
    const tip = ([sa, sb]) => [sa * ea * 1.1, sb * eb * 1.1];                            // Ecke: weiter raus und hoch
    const rid = ([sa, sb]) => alongA ? [sa * (ea - eb), 0] : [0, sb * (eb - ea)];
    const E = CORNERS.map(c => at(...tip(c), top + curl));
    const R = CORNERS.map(c => at(...rid(c), top + roofH));
    const hip = CORNERS.map(c => { const [ta, tb] = tip(c), [ra, rb] = rid(c); return at((ta + ra) / 2, (tb + rb) / 2, top + curl + (roofH - curl) * 0.3); });
    const slopes = CORNERS.map((c, i) => {
      const j = (i + 1) % 4, d = CORNERS[j], n = [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2];
      const mid = at(n[0] * ea, n[1] * eb, top), eaveCtl = [2 * mid[0] - (E[i][0] + E[j][0]) / 2, 2 * mid[1] - (E[i][1] + E[j][1]) / 2];
      return { i, j, n, eaveCtl, f: K.facing(n[0], n[1]), hex: roofHexAt(K, col, n) };
    });
    const outline = s => {
      g.beginPath(); g.moveTo(...E[s.i]);
      g.quadraticCurveTo(...s.eaveCtl, ...E[s.j]);
      g.quadraticCurveTo(...hip[s.j], ...R[s.j]);
      g.lineTo(...R[s.i]);
      g.quadraticCurveTo(...hip[s.i], ...E[s.i]);
      g.closePath();
    };
    const draw = s => { outline(s); g.fillStyle = C(s.hex); g.fill(); g.strokeStyle = C(s.hex); g.lineWidth = 0.6; g.stroke(); };
    slopes.filter(s => s.f < 0).forEach(draw);
    slopes.filter(s => s.f >= 0).forEach(draw);
    g.lineCap = 'round';
    for (const s of slopes) {                                                              // Traufkante vorn
      if (s.f <= 0.01) continue;
      g.strokeStyle = C(shade(s.hex, -0.22)); g.lineWidth = 1.3 * z;
      g.beginPath(); g.moveTo(...E[s.i]); g.quadraticCurveTo(...s.eaveCtl, ...E[s.j]); g.stroke();
    }
    const r0 = alongA ? R[3] : R[0], r1 = alongA ? R[0] : R[1];                            // Firstbalken
    line(r0, r1, shade(col, -0.25), 1.6, z);
  }
  // Bambus im Topf (neben der Tür)
  function bambooPot(K, a, b) {
    const [x, y] = K.P(a, b), z = K.z;
    ellipse(x, y + 0.5 * z, 3.6 * z, 1.4 * z, 'rgba(40,60,20,0.18)');
    for (const [dx, hgt] of [[-1.3, 12], [0.2, 16], [1.4, 10]]) {
      const sx = x + dx * z, top = y - (4.5 + hgt) * z;
      line([sx, y - 4 * z], [sx, top], '#8cc85a', 1.3, z);
      poly([[sx, top + 1.2 * z], [sx + 4.2 * z, top - 0.6 * z], [sx + 0.6 * z, top + 2.4 * z]], C('#58b36a'));
      poly([[sx, top + 2.4 * z], [sx - 4 * z, top + 0.6 * z], [sx - 0.4 * z, top + 3.4 * z]], C('#4a9e50'));
    }
    poly([[x - 3 * z, y - 4.6 * z], [x + 3 * z, y - 4.6 * z], [x + 2.2 * z, y], [x - 2.2 * z, y]], C('#2f9e9e'));   // Topf
    poly([[x + 0.8 * z, y - 4.6 * z], [x + 3 * z, y - 4.6 * z], [x + 2.2 * z, y], [x + 0.6 * z, y]], C(shade('#2f9e9e', -0.2)));
    ellipse(x, y - 4.6 * z, 3.1 * z, 1 * z, C(shade('#2f9e9e', 0.25)));
  }
  // Niedriges Teehaus auf einem Holzsockel: helle Wände zwischen Holzpfosten, Vorhang (Noren) über der Tür
  function teaHouse(K, a, ha, hb, h, roofH, wall, roof) {
    const z = K.z, wood = '#8b5a3c', base = 2;
    K.block({ a, b: 0, ha: ha + 0.05, hb: hb + 0.05, h: base, wall: '#d8c3a5', roof: '#e8dcc6', type: 'flat' });   // Sockel
    const B = K.block({ a, b: 0, ha, hb, h, lift: base, wall, type: 'none', entry: true });
    for (const [name, F] of Object.entries(B.faces)) {
      if (!F) continue;
      faceQuad(F.P, F.Q, 0, 1, F.H - 2.2 * z, F.H, K.wallCol(wood, F.n));               // Balken unter der Traufe
      kColumns(B, name, 2, z, wood);                                                      // Eckpfosten
      if (name !== 'front') windowOn(F.P, F.Q, 0.28, 0.72, F.H * 0.3, F.H * 0.7, z);
    }
    const F = B.faces.front;
    if (F) {
      windowOn(F.P, F.Q, 0.16, 0.5, F.H * 0.3, F.H * 0.7, z);
      faceQuad(F.P, F.Q, 0.6, 0.84, 0, F.H * 0.74, C(DOOR_COL));
      faceQuad(F.P, F.Q, 0.57, 0.87, F.H * 0.5, F.H * 0.8, C(roof));                   // Noren in der Markenfarbe
    }
    teaRoof(K, a, 0, ha, hb, base + h, roofH, 1.22, roof);
  }
  SHOP_ART.teeladen = function (K, s, now) {
    const a = -0.05, roof = '#58b36a';
    K.scene([
      [a, 0, () => teaHouse(K, a, 0.27, 0.3, 13, 15, '#f0ffe0', roof)],
      hangSign(K, (cx, cy, z) => miniTea(cx, cy, z), roof, { up: 11 }),                   // Teezweig klein am Ausleger
      [0.4, -0.32, () => bambooPot(K, 0.4, -0.32)],
    ]);
  };
  ART_SHADOW.teeladen = [22, 0.21];

  // ---------------------------------------------------------------- Bubble Tea
  // Bubble-Tea-Becher klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Milchtee mit dunklen
  // Tapioka-Perlen, gewölbter Deckel, dicker türkiser Strohhalm mit rosa Ringeln; Kante nachts in Neon-Pink
  const MINI_PEARLS = [[-0.95, -0.55], [0, -0.45], [0.95, -0.55], [-0.5, -1.35], [0.5, -1.35]];
  function miniBoba(x, y, z, lit) {
    const ry = 0.3, y0 = y + 3.2 * z, y1 = y - 0.5 * z, H = y0 - y1, rb = 1.55 * z, rt = 2.2 * z, tea = y1 + H * 0.24;
    const rAt = yy => rb + (rt - rb) * (y0 - yy) / H;
    cupPath(x, y0, y1, rb, rt, ry);
    g.save(); g.clip();
    g.fillStyle = C('#f6f2ff'); g.fillRect(x - rt - z, y1 - rt, 2 * rt + 2 * z, H + 2 * rt);         // leerer Teil
    g.fillStyle = C('#d6ad84'); g.fillRect(x - rt - z, tea, 2 * rt + 2 * z, y0 - tea + rt);         // Milchtee
    ellipse(x, tea, rAt(tea), rAt(tea) * ry, C('#e7c7a0'));
    for (const [px, py] of MINI_PEARLS) {                                                // Tapioka-Perlen
      circle(x + px * z, y0 + py * z, 0.52 * z, C('#3a2216'));
      circle(x + (px - 0.16) * z, y0 + (py - 0.18) * z, 0.17 * z, C('#8a6552'));
    }
    g.fillStyle = 'rgba(90,45,94,0.16)'; g.fillRect(x + rt * 0.42, y1 - rt, rt, H + 2 * rt);
    g.restore();
    cupPath(x, y0, y1, rb, rt, ry);                                                      // Kante (nachts Neon)
    g.lineWidth = (lit ? 0.7 : 0.45) * z; g.strokeStyle = lit ? '#ff6fc0' : C('#b39ddb'); g.stroke();
    ellipse(x, y1, rt + 0.3 * z, (rt + 0.3 * z) * ry, C('#d9cdef'));                      // Deckel: Rand
    g.beginPath(); g.ellipse(x, y1 - 0.1 * z, rt * 0.93, rt * 0.6, 0, Math.PI, 0); g.closePath();   // gewölbte Kuppel
    g.fillStyle = C('#f8f5ff'); g.fill();
    g.lineWidth = 0.35 * z; g.strokeStyle = C('#b39ddb'); g.stroke();
    const p0 = [x + 0.15 * z, y1 - 0.9 * z], p1 = [x + 1.05 * z, y - 3.75 * z];               // dicker bunter Strohhalm
    line(p0, p1, '#39c5bb', 0.95, z);
    for (const k of [0.35, 0.75]) {
      const m = lerp(p0, p1, k);
      line([m[0] - 0.45 * z, m[1] + 0.05 * z], [m[0] + 0.45 * z, m[1] - 0.05 * z], '#ff8fc4', 0.35, z);
    }
    kGlow(x, y, z, 14);
  }
  // Moderner Rundbau: Flachdach mit Rand, beide vorderen Ecken rund; unten Glas, das um die Ecken läuft, oben ein
  // Fensterband rundum
  function roundHouse(K, a, ha, hb, r, h, wall, rim, doorCol) {
    const z = K.z;
    if (K.facing(1, 0) <= 0.01) backEntry(K, a, 0, ha, hb);
    for (const F of prismWalls(K, roundFront(a, 0, ha, hb, r), h, wall)) {
      const [na, nb] = F.n, band = (t0, t1) => glass(K, F, t0, t1, 0.62, 0.84);
      if (F.curved) { glass(K, F, 0, 1, 0.1, 0.5); band(0, 1); }                          // runde Ecke: Glas rundum
      else if (na > 0.99) { faceQuad(F.P, F.Q, 0.14, 0.86, 0, F.H * 0.52, C(doorCol)); band(0, 1); }   // gerade Vorderseite: Tür
      else if (nb > 0.99) { glass(K, F, 0, 0.3, 0.1, 0.5); band(0, 0.82); }            // rechts: läuft von der Rundung weg
      else if (nb < -0.99) { glass(K, F, 0.7, 1, 0.1, 0.5); band(0.18, 1); }             // links
      else { band(0.12, 0.88); windowOn(F.P, F.Q, 0.35, 0.65, F.H * 0.12, F.H * 0.46, z); }   // hinten
    }
    const d = 0.018, outer = roundFront(a, 0, ha + d, hb + d, r + d);                     // Dachrand und Flachdach
    prismWalls(K, outer, 3, rim, { lift: h, foot: false });
    poly(outer.map(p => K.P(p[0], p[1], h + 3)), C(shade(rim, 0.3)));
    poly(roundFront(a, 0, ha - 0.03, hb - 0.03, r - 0.03).map(p => K.P(p[0], p[1], h + 3)), C(shade(rim, 0.62)));
  }
  SHOP_ART.bubbletea = function (K, s, now) {
    const a = -0.06, ha = 0.29, hb = 0.31, r = 0.22, rim = '#b07ad6', lit = isLit();
    K.scene([                                                                             // Schild seitlich neben der Rundung
      [a, 0, () => roundHouse(K, a, ha, hb, r, 20, '#ffc2d9', rim, rim)],
      hangSign(K, (cx, cy, zz) => miniBoba(cx, cy, zz, lit), rim, { up: 12, a0: a + ha - r, b0: hb + 0.01, back: a - ha - 0.02 }),
      [0.38, -0.26, () => kTable(K, 0.38, -0.26, rim)],
    ]);
  };
  ART_SHADOW.bubbletea = [23, 0.2];

  // ---------------------------------------------------------------- Eisdiele
  function scoop(sx, sy, r, col, hi) {
    circle(sx, sy, r, C(shade(col, -0.14)));
    for (let i = -2; i <= 2; i++) circle(sx + i * r * 0.42, sy + r * 0.74 + (i & 1 ? 0.12 : 0) * r, r * 0.3, C(shade(col, -0.14)));   // wellige Unterkante
    circle(sx - r * 0.1, sy - r * 0.1, r * 0.88, C(col));
    for (let i = -2; i <= 1; i++) circle(sx + (i + 0.5) * r * 0.42 - r * 0.06, sy + r * 0.62, r * 0.26, C(col));
    ellipse(sx - r * 0.38, sy - r * 0.42, r * 0.32, r * 0.2, C(hi));
  }
  // Eiswaffel klein fürs Ausleger-Schild (passt in einen Kreis mit Radius 4 × z): Waffel mit Rautenmuster,
  // Schoko- und Pistazienkugel, oben Erdbeer mit Streuseln und Kirsche
  function miniCone(x, y, z) {
    const yT = y + 0.55 * z, yB = y + 4 * z, w = 1.85 * z;
    const cone = () => { g.beginPath(); g.moveTo(x - w, yT); g.lineTo(x + w, yT); g.lineTo(x, yB); g.closePath(); };
    cone(); g.fillStyle = C('#e6ac5c'); g.fill();
    g.save(); cone(); g.clip();
    poly([[x + 0.6 * z, yT], [x + w + 1, yT], [x, yB + 1]], C('#cf9447'));                // Schattenseite
    g.strokeStyle = C('#a8692c'); g.lineWidth = 0.28 * z; g.beginPath();                   // Rautenmuster
    for (let k = -3; k <= 3; k++) {
      const bx = x + k * 1 * z;
      g.moveTo(bx, yT - 0.3 * z); g.lineTo(bx + 4.5 * z, yT + 5.4 * z);
      g.moveTo(bx, yT - 0.3 * z); g.lineTo(bx - 4.5 * z, yT + 5.4 * z);
    }
    g.stroke(); g.restore();
    ellipse(x, yT, w + 0.2 * z, 0.5 * z, C('#f2c681'));
    scoop(x - 1.05 * z, yT - 0.85 * z, 1.4 * z, '#8a5a3c', '#b98c68');                    // Schoko
    scoop(x + 1.05 * z, yT - 0.85 * z, 1.4 * z, '#8fdcaa', '#d6f7e3');                    // Pistazie
    scoop(x, yT - 2.6 * z, 1.5 * z, '#ff8fb1', '#ffd0de');                                // Erdbeer
    for (const [dx, dy, col, ang] of [[-0.7, -3, '#fff27a', 0.6], [0.6, -3.3, '#5f8fe8', -0.5], [0.8, -2.3, '#ffffff', 0.3]]) {
      const cx = x + dx * z, cy = yT + dy * z;
      line([cx - Math.cos(ang) * 0.25 * z, cy - Math.sin(ang) * 0.25 * z], [cx + Math.cos(ang) * 0.25 * z, cy + Math.sin(ang) * 0.25 * z], col, 0.3, z);
    }
    circle(x + 0.25 * z, yT - 4.05 * z, 0.6 * z, C('#d91f3a'));                           // Kirsche
    circle(x + 0.05 * z, yT - 4.25 * z, 0.2 * z, C('#ff9aa8'));
    kGlow(x, y, z, 14);
  }
  // Achteckiger Pavillon: rundum große Fenster, vorn die Tür, spitzes Zeltdach mit gewellter Traufe (wie ein Sonnenschirm)
  function pavilion(K, a, ap, h, roofH, wall, roof, doorCol) {
    const z = K.z, pts = octagon(a, 0, ap);
    if (K.facing(1, 0) <= 0.01) backEntry(K, a, 0, ap, ap);
    for (const F of prismWalls(K, pts, h, wall, { deep: true })) {
      if (F.n[0] > 0.99) faceQuad(F.P, F.Q, 0.28, 0.72, 0, F.H * 0.66, C(doorCol));     // Tür
      else windowOn(F.P, F.Q, 0.16, 0.84, F.H * 0.22, F.H * 0.72, z);                    // Fenster rundum
    }
    const R = tentRoof(K, pts, a, 0, h, roofH, 1.24, roof);
    for (const s of R.front) {                                                             // gewellte Traufe: ein Bogen je Seite
      const m = lerp(s.E0, s.E1, 0.5);
      g.beginPath(); g.moveTo(...s.E0); g.quadraticCurveTo(m[0], m[1] + 5.2 * z, ...s.E1); g.closePath();
      g.fillStyle = C(shade(s.hex, -0.1)); g.fill();
    }
    circle(R.apex[0], R.apex[1] - 1.2 * z, 2 * z, C('#fff4dc'));                          // Knauf auf der Spitze
  }
  SHOP_ART.eisdiele = function (K, s, now) {
    const a = -0.04, ap = 0.26, roof = '#f28cb1', k = ap * Math.SQRT1_2 + 0.01;          // Schild an der schrägen Seite
    K.scene([
      [a, 0, () => pavilion(K, a, ap, 15, 16, '#fff4dc', roof, '#d94f8a')],
      hangSign(K, (cx, cy, z) => miniCone(cx, cy, z), '#d94f8a', { up: 11, a0: a + k, b0: k, back: a - k }),
      [0.38, -0.26, () => kTable(K, 0.38, -0.26, roof)],
    ]);
  };
  ART_SHADOW.eisdiele = [23, 0.23];
})();
