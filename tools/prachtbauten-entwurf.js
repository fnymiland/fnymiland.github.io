// Prachtbauten (Block 161f, Nutzer 22.10.2026: „fang mit dem Opernhaus an“; Taler, drei Stufen, Größe je Bau). Entwurfswerkzeug:
// (0, eval)(await (await fetch('tools/prachtbauten-entwurf.js')).text()); prachtEntwurf({ z: 2.2 })
// Gezeichnet mit dem Wunderwerk-Rahmen kit (K.P(a, b, up) in Feldern/Einheiten, Mitte der Fläche). Sonne von links: Wände nach +b
// (FACES.right, links vorn) hell, nach +a (FACES.front, rechts vorn) im Schatten. Keine mitgelieferte Deko – nur das Bauwerk mit Sockel.
(function prachtEntwurfTool() {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  const lit = () => night > 0.15 && isLive();
  const glowP = (p, r) => { const q = 0.4; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], r); };
  const L = (col, w, z, pts) => { g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };

  // Rundbogen-Öffnung in einer Wandebene: F(t, h) = Punkt bei Anteil t längs der Wand, Höhe h (Einheiten); bogen oben
  function arch(F, t0, t1, h0, h1, fill, span) {
    const tm = (t0 + t1) / 2, r = (t1 - t0) / 2, rise = (h1 - h0) * 0.22, pts = [F(t0, h0), F(t1, h0), F(t1, h1 - rise)];
    for (let i = 1; i < 12; i++) { const an = i / 12 * Math.PI; pts.push(F(tm + Math.cos(an) * r, h1 - rise + Math.sin(an) * rise)); }
    pts.push(F(t0, h1 - rise));
    poly(pts, fill);
    if (span) { g.strokeStyle = span; g.lineWidth = Math.max(0.5, 0.5 * F.z); g.beginPath(); g.moveTo(...F(tm, h0)); g.lineTo(...F(tm, h1)); g.stroke(); }
  }
  // Wand eines Blocks als Ebene: A = feste Koordinate, dir 'a' (Wand quer zu a, läuft längs b) oder 'b'
  const wallOf = (K, fix, along, from, to, lift, axis) => {
    const f = (t, h) => axis === 'b' ? K.P(from + (to - from) * t, fix, lift + h) : K.P(fix, from + (to - from) * t, lift + h);
    f.z = K.z; return f;
  };
  // Säule: Schaft (links hell, rechts im Schatten), Basis und Kapitell
  function column(K, a, b, lift, h, col, gold) {
    const z = K.z, [px, py0] = K.P(a, b, lift), w = 2.3 * z, H = h * z, py = py0;
    ellipse(px, py, w * 1.35, w * 0.6, C(shade(col, -0.12)));
    g.fillStyle = C(col); g.fillRect(px - w, py - H, w, H);
    g.fillStyle = C(shade(col, -0.18)); g.fillRect(px, py - H, w, H);
    for (const k of [-0.5, 0.5]) { g.fillStyle = C(shade(col, -0.06)); g.fillRect(px + k * w - 0.25 * z, py - H, 0.5 * z, H); }   // Kanneluren
    ellipse(px, py - H, w * 1.3, w * 0.55, C(gold ? GOLD : shade(col, 0.06)));
    box(px, py - H - 0.2 * z, w * 1.45, w * 0.7, 1.6 * z, gold ? GOLD : shade(col, 0.04), null, 0);
  }

  // Opernhaus 3×3, Stufe 1–3. Saal a ∈ [−1,0,0,7], b ∈ [−0,95,0,85]; Säulenhalle nach +b (links vorn, in der Sonne)
  function opernhaus(K, stufe = 3, opt = {}) {
    const buehne = opt.buehne || 'A';                                      // Stufe 2: A Bühnenhaus im Bau, B Seitenflügel, C kleines Bühnenhaus
    const z = K.z, WALL = '#f3e9d6', TRIM = '#e2d3b4', STONE = '#d9cdb4', DOME = '#7fb8a4', ROOF = '#cbbd9f';
    const winCol = lit() ? '#ffd873' : C('#9fc3e3');
    const s2 = stufe >= 2, s3 = stufe >= 3;
    // Sockel (fest, ganze Fläche bis knapp an den Rand)
    K.block({ a: 0, b: 0, ha: 1.42, hb: 1.42, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    // Stufe 2 hinter/neben dem Saal (Nutzer 22.10.: das alte Bühnenhaus sah „herangestellt“ aus) – drei Varianten zur Wahl
    if (s2 && buehne === 'A') {                                            // A: Bühnenhaus gehört zum Bau – gleich breit, Wände bündig, gleiches Mansarddach, höher
      K.block({ a: -0.15, b: -1.0, ha: 0.85, hb: 0.38, h: 42, lift: 3, wall: WALL, roof: DOME, roofH: 9, type: 'mansard', over: 1.02, trim: s3 ? GOLD : TRIM });
      // Fenster nur auf dem freien Stück hinter dem Saaldach (b < −0,97, t < 0,54) – sonst schnitt das Dach sie an
      const F = wallOf(K, 0.7, 'b', -1.38, -0.62, 3, 'a');
      for (const t of [0.08, 0.3]) { arch(F, t, t + 0.14, 5, 14, C('#7a6248')); arch(F, t, t + 0.14, 28, 38, winCol, C(shade('#9fc3e3', -0.2))); }
      if (s3) {                                                            // Goldkante am Dachknick wie beim Saal
        const ea = 0.85 * 1.02 * 0.66, eb = 0.38 * 1.02 * 0.66, m = 45 + 9 * 0.62, A = -0.15, B = -1.0;
        L(C(GOLD), 1.1, z, [K.P(A - ea, B + eb, m), K.P(A + ea, B + eb, m), K.P(A + ea, B - eb, m)]);
      }
    }
    if (s2 && buehne === 'C') {                                            // C: kleines Bühnenhaus, mittig hinter der Kuppel
      K.block({ a: -0.15, b: -0.98, ha: 0.42, hb: 0.3, h: 38, lift: 3, wall: WALL, roof: DOME, roofH: 8, type: 'mansard', over: 1.02, trim: s3 ? GOLD : TRIM });
    }
    if (s2 && buehne === 'B') {                                            // B: zwei niedrigere Seitenflügel links und rechts vom Saal
      for (const [a, ha] of [[-1.2, 0.2], [0.9, 0.2]]) K.block({ a, b: -0.05, ha, hb: 0.6, h: 20, lift: 3, wall: WALL, roof: DOME, roofH: 6, type: 'mansard', over: 1.02, trim: s3 ? GOLD : TRIM });
      const F = wallOf(K, 1.1, 'b', -0.65, 0.55, 3, 'a');
      for (const t of [0.12, 0.42, 0.72]) arch(F, t, t + 0.16, 5, 15, winCol, C(shade('#9fc3e3', -0.2)));
    }
    // Saal
    const hallH = 30, top = 3 + hallH, mRoofH = 9, mTop = top + mRoofH * 0.62 + mRoofH * 0.38;   // Mansarddach (Kupfer), Kuppel auf seiner Kuppe
    K.block({ a: -0.15, b: -0.05, ha: 0.85, hb: 0.9, h: hallH, lift: 3, wall: WALL, roof: DOME, roofH: mRoofH, type: 'mansard', over: 1.02, trim: s3 ? GOLD : TRIM });
    // Fenster rechts vorn (Schattenseite): zwei Reihen Rundbögen
    const Fa = wallOf(K, 0.7, 'b', -0.95, 0.85, 3, 'a');
    for (let i = 0; i < 5; i++) { const t = 0.08 + i * 0.18; arch(Fa, t, t + 0.1, 5, 13, C('#7a6248')); arch(Fa, t, t + 0.1, 17, 26, winCol, C(shade('#9fc3e3', -0.2))); }
    if (lit()) for (let i = 0; i < 5; i++) glowP(Fa(0.13 + i * 0.18, 21), 16 * z);
    // Kuppel (Stufe 2) über dem Saal: Tambour mit Fenstern, Kupferkuppel; Stufe 3: Goldrippen und Laterne
    if (s2) {
      const [dx, dy] = K.P(-0.15, -0.05, mTop - 1.2), R = 20 * z;           // mitten auf der Kuppe des Mansarddachs
      cyl(dx, dy, R, R / 2, 9 * z, shade(WALL, -0.02));
      for (let i = -2; i <= 2; i++) { const x = dx + i * R * 0.36, y = dy - 5.5 * z + Math.abs(i) * -0.2 * z; poly([[x - 1.6 * z, y + 1.5 * z], [x + 1.6 * z, y + 1.5 * z], [x + 1.6 * z, y - 2.5 * z], [x, y - 3.6 * z], [x - 1.6 * z, y - 2.5 * z]], winCol); }
      ellipse(dx, dy - 9 * z, R * 1.04, R * 0.52, C(s3 ? GOLD : TRIM));
      dome(dx, dy - 9 * z, R * 0.98, R * 0.49, 26 * z, s3 ? '#8fc6b2' : DOME);
      if (s3) {
        for (const k of [-0.62, -0.25, 0.12, 0.5, 0.85]) {                // Rippen auf der sichtbaren Seite
          g.strokeStyle = C(GOLD); g.lineWidth = 1.1 * z; g.beginPath();
          for (let j = 0; j <= 10; j++) { const t = j / 10, an = Math.PI * (0.5 + k * 0.5); const x = dx + Math.cos(an) * R * 0.98 * Math.cos(t * Math.PI / 2), y = dy - 9 * z + Math.sin(an) * R * 0.49 * Math.cos(t * Math.PI / 2) - 26 * z * Math.sin(t * Math.PI / 2); j ? g.lineTo(x, y) : g.moveTo(x, y); }
          g.stroke();
        }
        cyl(dx, dy - 34 * z, 4 * z, 2 * z, 7 * z, GOLD);
        cone(dx, dy - 41 * z, 4.6 * z, 2.3 * z, 6 * z, GOLD_D);
        circle(dx, dy - 48 * z, 1.8 * z, lit() ? '#fff1a8' : C(GOLD_L));
        if (lit()) glowP([dx, dy - 37 * z], 26 * z);
      }
    }
    // Stufe 3: Goldkante rings um den Knick des Mansarddachs (statt Balustrade – Nutzer: „ergibt keinen Sinn, nicht ums ganze Gebäude“)
    if (s3) {
      const ea = 0.85 * 1.02 * 0.66, eb = 0.9 * 1.02 * 0.66, m = top + 9 * 0.62, A = -0.15, B = -0.05;
      L(C(GOLD), 1.1, z, [K.P(A - ea, B + eb, m), K.P(A + ea, B + eb, m), K.P(A + ea, B - eb, m)]);
    }
    // Eingangswand hinter der Säulenhalle (+b, Sonnenseite): drei Türen unten, drei große Bogenfenster oben
    const Fb = wallOf(K, 0.85, 'a', -0.95, 0.7, 3, 'b');
    for (const t of [0.24, 0.45, 0.66]) { arch(Fb, t, t + 0.1, 4, 14, C('#8a5a3c')); arch(Fb, t, t + 0.1, 17, 27, winCol, C(shade('#9fc3e3', -0.2))); }
    if (lit()) for (const t of [0.29, 0.5, 0.71]) glowP(Fb(t, 22), 18 * z);
    // Podest der Säulenhalle und Freitreppe davor
    K.block({ a: -0.12, b: 1.05, ha: 0.72, hb: 0.2, h: 4, lift: 3, wall: STONE, type: 'flat', roof: shade(STONE, 0.06) });
    for (let k = 0; k < 3; k++) K.block({ a: -0.12, b: 1.28 + k * 0.06, ha: 0.62 + k * 0.04, hb: 0.03, h: 3 - k, lift: 3, wall: shade(STONE, -0.12), type: 'flat', roof: shade(STONE, 0.16) });   // am Podest hoch, außen niedriger und breiter; helle Auftritte
    for (const sa of [-1, 1]) K.block({ a: -0.12 + sa * 0.74, b: 1.34, ha: 0.035, hb: 0.09, h: 4, lift: 3, wall: STONE, type: 'flat', roof: shade(STONE, 0.06) });   // Treppenwangen links und rechts
    // Säulen (von hinten nach vorn) – sechs in einer Reihe vor der Wand
    const cols = [0, 1, 2, 3, 4, 5].map(i => [-0.7 + i * 0.232, 1.19]);        // gleichmäßig, Mitte −0,12 wie der Giebel; vorn bündig mit dem Gebälk
    cols.sort((p, q) => K.depth(...p) - K.depth(...q)).forEach(([a, b]) => column(K, a, b, 7, 21, '#f6efe0', s3));
    // Gebälk über den Säulen, darauf ein Satteldach (First quer zur Wand, nach vorn): die vordere Giebelwand ist das Giebeldreieck
    const PB = K.block({ a: -0.12, b: 1.06, ha: 0.72, hb: 0.2, h: 4.5, lift: 28, wall: s3 ? shade(GOLD, 0.15) : TRIM, roof: DOME, roofH: 9, type: 'gable', ridge: 'b', over: 1.0 });   // Kupfer wie das übrige Dach
    const bF = 1.26, gt = 32.5, P1 = K.P(-0.84, bF, gt), P2 = K.P(0.6, bF, gt), PK = K.P(-0.12, bF, gt + 9);
    poly([P1, P2, PK], C(shade(WALL, 0.04)));
    poly([K.P(-0.76, bF + 0.002, gt + 0.9), K.P(0.52, bF + 0.002, gt + 0.9), K.P(-0.12, bF + 0.002, gt + 7.6)], C(shade(WALL, -0.07)));   // Giebelfeld vertieft
    L(C(s3 ? GOLD_D : shade(TRIM, -0.1)), 0.8, z, [P1, PK, P2]);
    // Stufe 3: goldene Lyra auf der Giebelspitze und goldenes Relief im Giebelfeld
    if (s3) {
      const [lx, ly] = K.P(-0.12, bF, gt + 9.4);
      g.strokeStyle = C(GOLD); g.lineWidth = 1.2 * z; g.beginPath();
      g.moveTo(lx - 3 * z, ly); g.quadraticCurveTo(lx - 4.6 * z, ly - 6 * z, lx - 2 * z, ly - 9 * z);
      g.moveTo(lx + 3 * z, ly); g.quadraticCurveTo(lx + 4.6 * z, ly - 6 * z, lx + 2 * z, ly - 9 * z);
      g.moveTo(lx - 2.4 * z, ly - 8 * z); g.lineTo(lx + 2.4 * z, ly - 8 * z); g.stroke();
      L(C(GOLD_D), 0.4, z, [[lx - 1 * z, ly - 1 * z], [lx - 1 * z, ly - 8 * z]]); L(C(GOLD_D), 0.4, z, [[lx + 1 * z, ly - 1 * z], [lx + 1 * z, ly - 8 * z]]);
      box(lx, ly + 0.5 * z, 3.6 * z, 1.8 * z, 1.2 * z, GOLD_D, null, 0);
      const [cx, cy] = K.P(-0.12, bF + 0.004, gt + 3.6);
      ellipse(cx, cy, 3 * z, 2 * z, C(GOLD));                              // Medaillon im Giebelfeld
    }
  }

  // --- Vorbilder (Nutzer 22.10.2026: „sieht aus wie ein Rucksack – an echten Opernhäusern orientieren“, „zeig mir beide“) ---
  // Die Schauseite blickt zum Betrachter (Normale +a+b): solche Wände erscheinen im Bild als gerade Rechtecke, Tiefe geht senkrecht nach
  // oben (halbe Länge). F(u, h) = Punkt der Front: u waagerecht (Einheiten × z), h Höhe; Grundfläche liegt im 3×3-Rhombus
  const front = (C, z, y0) => (u, h) => [C[0] + u * z, C[1] + y0 * z - h * z];
  const rect = (F, u0, u1, h0, h1, fill) => poly([F(u0, h0), F(u1, h0), F(u1, h1), F(u0, h1)], fill);
  const archF = (F, u0, u1, h0, h1, fill) => { const um = (u0 + u1) / 2, r = (u1 - u0) / 2, pts = [F(u0, h0), F(u1, h0), F(u1, h1 - r)];
    for (let i = 1; i < 12; i++) { const an = i / 12 * Math.PI; pts.push(F(um + Math.cos(an) * r, h1 - r + Math.sin(an) * r)); } pts.push(F(u0, h1 - r)); poly(pts, fill); };
  // Kasten mit Schauseite nach vorn: Front, Oberseite (Tiefe d nach hinten = d/2 nach oben im Bild)
  const fbox = (C, z, y0, u0, u1, h, d, wall, top, lift = 0) => { const F = front(C, z, y0); rect(F, u0, u1, lift, lift + h, C_(wall)); poly([F(u0, lift + h), F(u1, lift + h), F(u1, lift + h + d / 2), F(u0, lift + h + d / 2)], C_(top)); return F; };
  const C_ = c => C(c);
  const lyre = (x, y, z, s = 1) => { g.strokeStyle = C(GOLD); g.lineWidth = 1.2 * z * s; g.beginPath();
    g.moveTo(x - 3 * z * s, y); g.quadraticCurveTo(x - 4.6 * z * s, y - 6 * z * s, x - 2 * z * s, y - 9 * z * s);
    g.moveTo(x + 3 * z * s, y); g.quadraticCurveTo(x + 4.6 * z * s, y - 6 * z * s, x + 2 * z * s, y - 9 * z * s);
    g.moveTo(x - 2.4 * z * s, y - 8 * z * s); g.lineTo(x + 2.4 * z * s, y - 8 * z * s); g.stroke();
    L(C(GOLD_D), 0.4 * s, z, [[x - 1 * z * s, y - 1 * z * s], [x - 1 * z * s, y - 8 * z * s]]); L(C(GOLD_D), 0.4 * s, z, [[x + 1 * z * s, y - 1 * z * s], [x + 1 * z * s, y - 8 * z * s]]);
    box(x, y + 0.5 * z * s, 4 * z * s, 2 * z * s, 1.4 * z * s, GOLD_D, null, 0); };
  const crown = (x, y, z, s = 1) => { ellipse(x, y, 4 * z * s, 1.8 * z * s, C(GOLD_D)); for (const k of [-3, -1.5, 0, 1.5, 3]) poly([[x + (k - 0.7) * z * s, y], [x + (k + 0.7) * z * s, y], [x + k * z * s, y - 3.4 * z * s]], C(GOLD)); circle(x, y - 4.4 * z * s, 1 * z * s, C(GOLD_L)); };

  // Fläche in einer Wand: Rechteck von t0 bis t1, Höhe h0 bis h1 (für Säulen, Bänder)
  const fRect = (F, t0, t1, h0, h1, fill) => poly([F(t0, h0), F(t1, h0), F(t1, h1), F(t0, h1)], fill);
  // Rundbau (Bildschirm-Zylinder): Punkt auf dem Mantel, Winkel t (0 = vorn, Blick +a+b), Höhe h über dem Fuß
  const ring = (cx, cy, rx, ry, z) => (t, h) => [cx + Math.sin(t) * rx, cy + Math.cos(t) * ry - h * z];
  const onRing = (R, t0, t1, h0, h1, fill) => { if (Math.cos((t0 + t1) / 2) < 0.15) return; const pts = [], n = 8, rise = (h1 - h0) * 0.3;
    for (let i = 0; i <= n; i++) pts.push(R(t0 + (t1 - t0) * i / n, h0));
    for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push(R(t, h1 - rise + Math.sin(Math.PI * i / n) * rise)); }
    poly(pts, fill); };

  // Semperoper: zweigeschossiger runder Arkadenbau vorn, aus der Mitte ragt der höhere Saal mit Kupferkuppel; Portal nach links vorn (+b)
  function semper(K, stufe = 3) {
    const z = K.z, WALL = '#efe4cf', TRIM = '#e2d3b4', DOME = '#7fb8a4', s3 = stufe >= 3;
    const winCol = lit() ? '#ffd873' : C('#9fc3e3'), dark = C('#5f4a3a');
    K.block({ a: 0, b: 0, ha: 1.42, hb: 1.42, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    const [cx, cy] = K.P(-0.1, -0.1, 3), r1 = 1.15 * Math.SQRT2 * TW / 2 * z, r2 = 0.52 * Math.SQRT2 * TW / 2 * z;   // Ring breit, Saal schmaler
    // äußerer Rundbau, zwei Geschosse mit Bögen
    cyl(cx, cy, r1, r1 / 2, 24 * z, WALL);
    const R = ring(cx, cy, r1, r1 / 2, z);
    for (let t = -1.35; t <= 1.36; t += 0.27) { onRing(R, t - 0.08, t + 0.08, 2, 10, dark); onRing(R, t - 0.08, t + 0.08, 13, 21, winCol); if (lit() && Math.cos(t) > 0.15) glowP(R(t, 17), 12 * z); }
    g.strokeStyle = C(s3 ? GOLD : shade(TRIM, -0.06)); g.lineWidth = 1 * z; g.beginPath(); for (let i = 0; i <= 24; i++) { const p = R(-Math.PI / 2 + Math.PI * i / 24, 11.5); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke();
    cyl(cx, cy - 24 * z, r1, r1 / 2, 2.5 * z, s3 ? GOLD : TRIM);           // Brüstung
    ellipse(cx, cy - 26.5 * z, r1 * 0.96, r1 * 0.48, C(shade(WALL, 0.07)));   // Terrasse
    // Saal: höherer Rundbau aus der Mitte, Kupferkuppel mit Laterne
    // (beginnt auf der Terrasse, nicht im Ring – sonst stand er vor dessen Obergeschoss)
    const s0 = 26.5, sh = 16, base = cy - s0 * z;
    cyl(cx, base, r2, r2 / 2, sh * z, shade(WALL, -0.02));
    const R2 = ring(cx, base, r2, r2 / 2, z);
    for (let t = -1.2; t <= 1.21; t += 0.4) onRing(R2, t - 0.1, t + 0.1, 4, 12, winCol);
    ellipse(cx, base - sh * z, r2 * 1.04, r2 * 0.52, C(s3 ? GOLD : TRIM));
    dome(cx, base - sh * z, r2, r2 / 2, 14 * z, DOME);
    if (s3) { cyl(cx, base - (sh + 14) * z, 3.2 * z, 1.6 * z, 4 * z, GOLD); crown(cx, base - (sh + 18) * z, z, 0.75); }
    // Portal vorn (zum Betrachter) als Teil des Rundbaus: ein Stück des Rings springt leicht vor und steigt über die Brüstung
    // (Exedra wie in Dresden) – kein angesetzter Kasten. Große Rundbogennische, Pilaster, oben die Lyra
    const tc = 0, t0 = tc - 0.36, t1 = tc + 0.36, ph = 40, ro = r1 * 1.05, ri = r1 * 0.9;
    const Ro = ring(cx, cy, ro, ro / 2, z), Ri = ring(cx, cy, ri, ri / 2, z), arc = (Rf, a, b, h) => Array.from({ length: 17 }, (_, i) => Rf(a + (b - a) * i / 16, h));
    const band = (h0, h1, col, a = t0, b = t1) => poly([...arc(Ro, a, b, h0), ...arc(Ro, b, a, h1)], C(col));
    const sideOf = (t, col) => t > 0 ? shade(col, LIGHT.side) : col;                                      // rechte Hälfte im Schatten wie der Ring
    poly([Ro(t0, 26.5), Ro(t0, ph), Ri(t0, ph), Ri(t0, 26.5)], C(shade(WALL, 0.06)));                      // Stirnseiten über der Terrasse
    poly([Ro(t1, 26.5), Ro(t1, ph), Ri(t1, ph), Ri(t1, 26.5)], C(shade(WALL, LIGHT.side)));
    band(0, ph, shade(WALL, 0.03), t0, 0); band(0, ph, sideOf(1, shade(WALL, 0.03)), 0, t1);               // Mantel, hell | Schatten
    poly([...arc(Ro, t0, t1, ph), ...arc(Ri, t1, t0, ph)], C(shade(TRIM, -0.05)));                         // Abdeckung, dunkler als die Terrasse
    for (const d of [-0.31, -0.19, 0.19, 0.31]) band(0, ph - 1.2, sideOf(d, shade(WALL, -0.04)), tc + d - 0.025, tc + d + 0.025);   // Pilaster
    for (const d of [-0.25, 0.25]) { onRing(Ro, tc + d - 0.03, tc + d + 0.03, 2, 10, dark); onRing(Ro, tc + d - 0.03, tc + d + 0.03, 15, 23, winCol); }
    onRing(Ro, tc - 0.13, tc + 0.13, 2, 31, C('#4f3d30'));                                                // Nische
    onRing(Ro, tc - 0.08, tc + 0.08, 3, 14, C('#8a5a3c'));                                                // Tor
    onRing(Ro, tc - 0.08, tc + 0.08, 17, 28, winCol);
    // Gesimse auf Höhe der Ringgesimse (11,5 und Brüstung 24), in der Nische unterbrochen; oben die Attika-Kante
    for (const [h0, h1, col, gap] of [[11.5, 13, s3 ? GOLD : shade(TRIM, -0.06), 1], [24, 26.5, s3 ? GOLD : TRIM, 1], [ph - 1.2, ph, s3 ? GOLD : TRIM, 0]]) {
      const cut = gap ? 0.13 : 0; band(h0, h1, col, t0, -cut); band(h0, h1, sideOf(1, col), cut, t1) }
    if (s3) { const [o, i] = [Ro(tc, ph), Ri(tc, ph)]; lyre(o[0] * 0.25 + i[0] * 0.75, o[1] * 0.25 + i[1] * 0.75, z, 1.2); }   // ganz auf der Abdeckung
    if (lit()) glowP(Ro(tc, 22), 22 * z);
  }

  // Palais Garnier: Schauseite nach links vorn – Arkaden unten, Loggia mit Säulenpaaren oben, Eckpavillons mit Goldkronen;
  // dahinter der Saal mit hoher Kupferkuppel und Krone
  function garnier(K, stufe = 3) {
    const z = K.z, WALL = '#efe4cf', TRIM = '#e2d3b4', DOME = '#7fb8a4', s3 = stufe >= 3;
    const winCol = lit() ? '#ffd873' : C('#9fc3e3'), dark = C('#5f4a3a');
    K.block({ a: 0, b: 0, ha: 1.42, hb: 1.42, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    // Saal hinten mit Kuppel
    K.block({ a: -0.1, b: -0.5, ha: 0.72, hb: 0.6, h: 26, lift: 3, wall: shade(WALL, -0.03), roof: DOME, roofH: 6, type: 'mansard', over: 1.02, trim: s3 ? GOLD : TRIM });
    const [dx, dy] = K.P(-0.1, -0.5, 3 + 26 + 5), rd = 0.5 * Math.SQRT2 * TW / 2 * z;
    cyl(dx, dy, rd, rd / 2, 7 * z, shade(WALL, -0.02));
    ellipse(dx, dy - 7 * z, rd * 1.04, rd * 0.52, C(s3 ? GOLD : TRIM));
    dome(dx, dy - 7 * z, rd, rd / 2, 20 * z, DOME);
    if (s3) crown(dx, dy - 27 * z, z, 1);
    // Eckpavillon (springt vor): Fenster vorn und an der Seite, kleine Kuppel mit Krone
    const pav = a => {
      K.block({ a, b: 0.86, ha: 0.2, hb: 0.42, h: 36, lift: 3, wall: shade(WALL, 0.02), type: 'flat', roof: shade(WALL, 0.1), trim: s3 ? GOLD : TRIM });
      const Pb = wallOf(K, 1.28, 'a', a - 0.2, a + 0.2, 3, 'b'), Pa = wallOf(K, a + 0.2, 'b', 0.44, 1.28, 3, 'a');
      arch(Pb, 0.3, 0.7, 1, 12, dark); arch(Pb, 0.32, 0.68, 16, 27, winCol); fRect(Pb, 0, 1, 13, 14.5, C(s3 ? GOLD : TRIM));
      for (const t of [0.22, 0.62]) { arch(Pa, t, t + 0.16, 1, 12, dark); arch(Pa, t + 0.01, t + 0.15, 16, 27, winCol); }
      fRect(Pa, 0, 1, 13, 14.5, C(s3 ? GOLD : TRIM));
      const [px, py] = K.P(a, 0.86, 39);
      dome(px, py, 7 * z, 3.5 * z, 5 * z, DOME);
      if (s3) crown(px, py - 5 * z, z, 0.7);
    };
    pav(-0.98);                                                            // links: liegt weiter hinten, zuerst
    // Mittelbau (Foyer) genau zwischen den Pavillons: Arkaden unten, Loggia mit Säulenpaaren oben
    K.block({ a: -0.1, b: 0.82, ha: 0.68, hb: 0.36, h: 30, lift: 3, wall: WALL, type: 'flat', roof: shade(WALL, 0.08), trim: s3 ? GOLD : TRIM });
    const Fb = wallOf(K, 1.18, 'a', -0.78, 0.58, 3, 'b'), n = 5;
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; arch(Fb, t - 0.06, t + 0.06, 1, 12, dark); arch(Fb, t - 0.048, t + 0.048, 16, 25, winCol); if (lit()) glowP(Fb(t, 20), 12 * z); }
    fRect(Fb, 0, 1, 13, 14.5, C(s3 ? GOLD : TRIM));
    for (let i = 0; i <= n; i++) { const t = i / n; for (const dt of [-0.016, 0.016]) fRect(Fb, t + dt - 0.008, t + dt + 0.008, 15, 26.5, C(s3 ? GOLD_L : '#f8f2e4')); }
    if (s3) lyre(...K.P(-0.1, 0.82, 33.5), z, 1.3);                       // Lyra mitten auf dem Mittelbau
    pav(0.78);                                                             // rechts: liegt vorn, zuletzt
  }
  window.PRACHT = { opernhaus, semper, garnier };
  window.prachtEntwurf = (opts = {}) => {
    document.getElementById('cmp')?.remove();
    const Wv = innerWidth, Hv = innerHeight, cv = document.createElement('canvas'); cv.id = 'cmp'; cv.width = Wv * 2; cv.height = Hv * 2;
    Object.assign(cv.style, { position: 'fixed', inset: 0, width: Wv + 'px', height: Hv + 'px', zIndex: 99999, background: opts.night ? '#1f2846' : '#fffaf0' });
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    const prev = g, n0 = night, sp0 = SPRITE_PAINT; g = ctx; night = opts.night ? NIGHT_MAX : 0; SPRITE_PAINT = true;   // isLive(): Licht wie im Spiel
    const z = opts.z || 2, stufen = opts.stufen || [1, 2, 3], cw = (Wv - 12 * (stufen.length + 1)) / stufen.length;
    try {
      stufen.forEach((st, i) => {
        const x = 12 + i * (cw + 12), cx = x + cw / 2, cy = Hv - 40 - 48 * z;
        diamond(cx, cy, 96 * z, 48 * z, opts.night ? '#33405e' : '#b4dd8c');
        PRACHT[(opts.baus || [])[i] || opts.bau || 'opernhaus'](kit(cx, cy, z, 0), st, { buehne: (opts.varianten || [])[i] || opts.buehne });
        ctx.fillStyle = opts.night ? '#f1e3cf' : '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(opts.titel ? opts.titel[i] : opts.varianten ? 'Variante ' + opts.varianten[i] : 'Stufe ' + st, x + 4, 22);
      });
    } finally { g = prev; night = n0; SPRITE_PAINT = sp0; }
    return 'ok';
  };
  return 'ok';
})();
