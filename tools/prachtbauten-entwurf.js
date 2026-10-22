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
  const onRing = (R, t0, t1, h0, h1, fill) => { if (Math.cos((t0 + t1) / 2) < 0.35) return; const pts = [], n = 8, rise = (h1 - h0) * 0.3;   // fast seitliche Fenster wären nur halbe Striche
    for (let i = 0; i <= n; i++) pts.push(R(t0 + (t1 - t0) * i / n, h0));
    for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push(R(t, h1 - rise + Math.sqrt(Math.sin(Math.PI * i / n)) * rise)); }   // Wurzel: Rundbogen statt Spitze
    poly(pts, fill); };

  // Semperoper: zweigeschossiger runder Arkadenbau vorn, aus der Mitte ragt der höhere Saal mit Kupferkuppel; Portal nach links vorn (+b)
  function semper(K, stufe = 3) {
    const z = K.z, WALL = '#efe4cf', TRIM = '#e2d3b4', DOME = '#7fb8a4', s2 = stufe >= 2, s3 = stufe >= 3;
    const winCol = lit() ? '#ffd873' : C('#9fc3e3'), dark = C('#5f4a3a');
    // Stufen: 1 = eingeschossiger Ring, Saal mit flachem Dach; 2 = zweites Geschoss, Kuppel; 3 = Gold, Lyra, Krone
    const H = s2 ? 24 : 13, T = H + 2.5;
    K.block({ a: 0, b: 0, ha: 1.42, hb: 1.42, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    const [cx, cy] = K.P(-0.1, -0.1, 3), r1 = 1.15 * Math.SQRT2 * TW / 2 * z, r2 = 0.52 * Math.SQRT2 * TW / 2 * z;   // Ring breit, Saal schmaler
    // äußerer Rundbau mit Bögen (ab Stufe 2 zweigeschossig)
    cyl(cx, cy, r1, r1 / 2, H * z, WALL);
    const R = ring(cx, cy, r1, r1 / 2, z);
    for (let t = -1.35; t <= 1.36; t += 0.27) { onRing(R, t - 0.08, t + 0.08, 2, 10, dark); if (s2) onRing(R, t - 0.08, t + 0.08, 13, 21, winCol); if (lit() && Math.cos(t) > 0.15) glowP(R(t, s2 ? 17 : 7), 12 * z); }
    if (s2) { g.strokeStyle = C(s3 ? GOLD : shade(TRIM, -0.06)); g.lineWidth = 1 * z; g.beginPath(); for (let i = 0; i <= 24; i++) { const p = R(-Math.PI / 2 + Math.PI * i / 24, 11.5); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
    cyl(cx, cy - H * z, r1, r1 / 2, 2.5 * z, s3 ? GOLD : TRIM);            // Brüstung
    ellipse(cx, cy - T * z, r1 * 0.96, r1 * 0.48, C(shade(WALL, 0.07)));   // Terrasse
    // Saal: höherer Rundbau aus der Mitte, Kupferkuppel mit Laterne
    // (beginnt auf der Terrasse, nicht im Ring – sonst stand er vor dessen Obergeschoss)
    const sh = s2 ? 16 : 10, base = cy - T * z;
    cyl(cx, base, r2, r2 / 2, sh * z, shade(WALL, -0.02));
    const R2 = ring(cx, base, r2, r2 / 2, z);
    for (let t = -1.2; t <= 1.21; t += 0.4) onRing(R2, t - 0.1, t + 0.1, s2 ? 4 : 3, s2 ? 12 : 8, winCol);
    ellipse(cx, base - sh * z, r2 * 1.04, r2 * 0.52, C(s3 ? GOLD : TRIM));
    if (!s2) ellipse(cx, base - sh * z, r2 * 0.94, r2 * 0.47, C(shade(WALL, 0.05)));       // Stufe 1: flaches Dach (eine flache Kuppel sah wie eine Schüssel aus)
    else dome(cx, base - sh * z, r2, r2 / 2, 14 * z, DOME);
    if (s2 && !s3) cyl(cx, base - (sh + 14) * z, 3.2 * z, 1.6 * z, 4 * z, TRIM);    // Laterne schlicht
    if (s3) { cyl(cx, base - (sh + 14) * z, 3.2 * z, 1.6 * z, 4 * z, GOLD); crown(cx, base - (sh + 18) * z, z, 0.75); }
    // Portal nach links vorn (+b, wie die Eingänge aller Gebäude) als Teil des Rundbaus: ein Stück des Rings springt leicht vor und steigt über die Brüstung
    // (Exedra wie in Dresden) – kein angesetzter Kasten. Große Rundbogennische, Pilaster, oben die Lyra
    const tc = -Math.PI / 4, t0 = tc - 0.36, t1 = tc + 0.36, ph = s2 ? 40 : 24, ro = r1 * 1.05, ri = r1 * 0.9;
    const Ro = ring(cx, cy, ro, ro / 2, z), Ri = ring(cx, cy, ri, ri / 2, z), arc = (Rf, a, b, h) => Array.from({ length: 17 }, (_, i) => Rf(a + (b - a) * i / 16, h));
    const strip = (h0, h1, col, a, b) => poly([...arc(Ro, a, b, h0), ...arc(Ro, b, a, h1)], C(col));
    // Streifen auf dem Mantel; was rechts von vorn (t > 0) liegt, im Schatten wie der Ring
    const band = (h0, h1, col, a = t0, b = t1) => { const m = Math.min(Math.max(0, a), b);
      if (m > a) strip(h0, h1, col, a, m); if (b > m) strip(h0, h1, shade(col, LIGHT.side), m, b); };
    if (tc >= 0) poly([Ro(t0, T), Ro(t0, ph), Ri(t0, ph), Ri(t0, T)], C(shade(WALL, 0.06)));        // Stirnseiten über der Terrasse
    if (tc <= 0) poly([Ro(t1, T), Ro(t1, ph), Ri(t1, ph), Ri(t1, T)], C(shade(WALL, LIGHT.side)));
    band(0, ph, shade(WALL, 0.03));                                                                        // Mantel
    poly([...arc(Ro, t0, t1, ph), ...arc(Ri, t1, t0, ph)], C(shade(TRIM, -0.05)));                         // Abdeckung, dunkler als die Terrasse
    for (const d of [-0.31, -0.19, 0.19, 0.31]) band(0, ph - 1.2, shade(WALL, -0.04), tc + d - 0.025, tc + d + 0.025);   // Pilaster
    for (const d of [-0.25, 0.25]) { onRing(Ro, tc + d - 0.03, tc + d + 0.03, 2, 10, dark); if (s2) onRing(Ro, tc + d - 0.03, tc + d + 0.03, 15, 23, winCol); }
    onRing(Ro, tc - 0.13, tc + 0.13, 2, s2 ? 31 : 19, C('#4f3d30'));                                     // Nische
    onRing(Ro, tc - 0.08, tc + 0.08, 3, s2 ? 14 : 13, C('#8a5a3c'));                                     // Tor
    if (s2) onRing(Ro, tc - 0.08, tc + 0.08, 17, 28, winCol);
    // Gesimse auf Höhe der Ringgesimse (11,5 und Brüstung), in der Nische unterbrochen; oben die Attika-Kante
    const sims = [[H, T, s3 ? GOLD : TRIM, 0.13], [ph - 1.2, ph, s3 ? GOLD : TRIM, 0]];
    if (s2) sims.unshift([11.5, 13, s3 ? GOLD : shade(TRIM, -0.06), 0.13]);
    for (const [h0, h1, col, cut] of sims) {
      band(h0, h1, col, t0, tc - cut); band(h0, h1, col, tc + cut, t1); }
    if (s3) { const [o, i] = [Ro(tc, ph), Ri(tc, ph)]; lyre(o[0] * 0.25 + i[0] * 0.75, o[1] * 0.25 + i[1] * 0.75, z, 1.2); }   // ganz auf der Abdeckung
    if (lit()) glowP(Ro(tc, s2 ? 22 : 10), (s2 ? 22 : 14) * z);
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
  // --- Glaspalast (Nutzer 22.10.2026: „mach mit dem Glaspalast weiter“). Der Botanische Garten hat schon Glaskuppel + Flügel – darum andere
  // Vorbilder: A Kristallpalast (London 1851, ganz aus Glas, gestuftes Langhaus, hohes Querschiff mit Fächerfenster), B Grand Palais (Paris,
  // Steinfassade mit Säulen, dahinter riesiges Glasdach mit Kuppel). Grundfläche 4×3: lang nach a (Schauseite +b, links vorn, in der Sonne)
  const GLASS = '#bfe0ee', GLASS_D = '#9cc8dc', FRAME = '#ffffff', STONE2 = '#eadfca';
  // Glasfläche einer Wand: Sprossen senkrecht (cols) und Riegel waagerecht (Höhen hs), drinnen ein paar Palmen als weiche Flecken
  function glassFace(F, h0, h1, cols, hs, plants, shadeSide) {
    const z = F.z, tint = c => C(shadeSide ? shade(c, -0.2) : c);
    fRect(F, 0, 1, h0, h1, tint(GLASS_D));
    if (plants) for (let i = 0; i < plants; i++) {                        // Palmen drinnen – zuerst, das Glas liegt davor
      const t = (i + 0.5) / plants, [x, y] = F(t, h0 + 0.5);
      ellipse(x, y - 4 * z, 3.4 * z, 4.4 * z, C(shadeSide ? '#4f9a5e' : '#5fb06c')); ellipse(x + 2 * z, y - 7.5 * z, 2.6 * z, 2.8 * z, C(shadeSide ? '#62a86c' : '#78c67f'));
    }
    g.globalAlpha = 0.62; fRect(F, 0, 1, h0, h1, tint(GLASS)); g.globalAlpha = 1;
    g.strokeStyle = C(shadeSide ? shade(FRAME, -0.12) : FRAME); g.lineWidth = Math.max(0.5, 0.55 * z); g.beginPath();
    for (let i = 0; i <= cols; i++) { const t = i / cols; g.moveTo(...F(t, h0)); g.lineTo(...F(t, h1)); }
    for (const h of [h0, ...hs, h1]) { g.moveTo(...F(0, h)); g.lineTo(...F(1, h)); }
    g.stroke();
  }
  // Rippen auf einem Tonnendach (gleiche Form wie K.block 'barrel', over = 1): Bögen quer, Linien längs
  function barrelRibs(K, a, b, ha, hb, top, roofH, alongA, n, col, w = 0.55) {
    const L = alongA ? ha : hb, R = alongA ? hb : ha, z = K.z;
    const pt = (s, th) => { const q = Math.cos(th) * R, up = top + Math.sin(th) * roofH; return alongA ? K.P(a + s, b + q, up) : K.P(a + q, b + s, up); };
    g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, w * z); g.beginPath();
    const TH = 2.4;                                                        // dahinter neigt sich die Tonne vom Betrachter weg – sonst schienen Rippen der Rückseite durch
    for (let i = 0; i <= n; i++) { const s = -L + 2 * L * i / n; for (let j = 0; j <= 12; j++) { const p = pt(s, TH * j / 12); j ? g.lineTo(...p) : g.moveTo(...p); } }
    for (const th of [0.5, 1.0, 1.57, 2.14]) { g.moveTo(...pt(-L, th)); g.lineTo(...pt(L, th)); }
    g.stroke();
    return pt;
  }
  // Fächerfenster in einem runden Giebel: Mitte unten bei (a, b) in Höhe top, halbe Breite r längs der Wand (axis: Wand läuft längs 'a' oder 'b')
  function fan(K, a, b, r, top, roofH, axis, col, rim, shadeSide) {
    const z = K.z, pt = (th, k) => axis === 'a' ? K.P(a + Math.cos(th) * r * k, b, top + Math.sin(th) * roofH * k) : K.P(a, b + Math.cos(th) * r * k, top + Math.sin(th) * roofH * k);
    const outline = []; for (let j = 0; j <= 20; j++) outline.push(pt(Math.PI * j / 20, 1));
    poly(outline, C(shadeSide ? shade(GLASS, -0.2) : GLASS));
    const [cx0, cy0] = pt(0, 0);
    g.strokeStyle = C(shadeSide ? shade(col, -0.12) : col); g.lineWidth = Math.max(0.5, 0.7 * z); g.beginPath();
    for (let i = 0; i <= 8; i++) { g.moveTo(cx0, cy0); g.lineTo(...pt(Math.PI * i / 8, 1)); }
    for (const k of [0.35, 0.7, 1]) for (let j = 0; j <= 16; j++) { const p = pt(Math.PI * j / 16, k); j ? g.lineTo(...p) : g.moveTo(...p); }
    g.stroke();
    if (rim) { g.strokeStyle = C(rim); g.lineWidth = Math.max(0.6, 1.1 * z); g.beginPath(); outline.forEach((p, j) => j ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); }
  }
  const ground = (K, la, lb, col) => K.rect(-la / 2, -lb / 2, la / 2, lb / 2, C(col));

  // A: Kristallpalast – Stufe 1 nur das untere Langhaus und ein niedriges Querschiff; 2: zweites Geschoss mit Tonne, Querschiff hoch;
  // 3: Fächerfenster mit Goldkante, Fahnen auf dem Querschiff, Laternchen am First
  function kristall(K, stufe = 3) {
    const z = K.z, s2 = stufe >= 2, s3 = stufe >= 3;
    K.block({ a: 0, b: 0, ha: 1.95, hb: 1.45, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    // unteres Langhaus
    const H1 = 12;
    K.block({ a: 0, b: 0, ha: 1.8, hb: 1.25, h: H1, lift: 3, wall: GLASS, type: 'flat', roof: shade(GLASS, 0.06) });
    glassFace(wallOf(K, 1.25, 'b', -1.8, 1.8, 3, 'b'), 0, H1, 24, [H1 * 0.55], 6, false);
    glassFace(wallOf(K, 1.8, 'a', -1.25, 1.25, 3, 'a'), 0, H1, 16, [H1 * 0.55], 3, true);
    // Dachfläche des Langhauses: Glasrauten
    { const P = (a, b) => K.P(a, b, 3 + H1); g.strokeStyle = C(FRAME); g.lineWidth = Math.max(0.5, 0.4 * z); g.beginPath();
      for (let i = 0; i <= 12; i++) { const a = -1.8 + 3.6 * i / 12; g.moveTo(...P(a, -1.25)); g.lineTo(...P(a, 1.25)); } g.stroke(); }
    // oberes Langhaus mit Tonne längs
    if (s2) {
      const H2 = 8, top = 3 + H1 + H2;
      K.block({ a: 0, b: 0, ha: 1.8, hb: 0.72, h: H2, lift: 3 + H1, wall: GLASS, roof: shade(GLASS, 0.04), roofH: 9, type: 'barrel', ridge: 'a', over: 1 });
      barrelRibs(K, 0, 0, 1.8, 0.72, top, 9, true, 14, FRAME);
      glassFace(wallOf(K, 0.72, 'b', -1.8, 1.8, 3 + H1, 'b'), 0, H2, 24, [], 0, false);
      glassFace(wallOf(K, 1.8, 'a', -0.72, 0.72, 3 + H1, 'a'), 0, H2, 8, [], 0, true);
      fan(K, 1.8, 0, 0.72, top, 9, 'b', FRAME, s3 ? GOLD : null, true);   // Ende rechts: Glas mit Fächer statt Blechdeckel
    }
    // Querschiff (nach +b, zur Schauseite): hohe Tonne quer, vorn das große Fächerfenster
    const qa = 0, qha = 0.46, qhb = 1.32, qH = s2 ? 22 : 12, qRoof = s2 ? 14 : 8, qtop = 3 + qH;
    K.block({ a: qa, b: 0, ha: qha, hb: qhb, h: qH, lift: 3, wall: GLASS, roof: shade(GLASS, 0.05), roofH: qRoof, type: 'barrel', ridge: 'b', over: 1 });
    barrelRibs(K, qa, 0, qha, qhb, qtop, qRoof, false, 10, FRAME);
    const Fq = wallOf(K, qhb, 'b', qa - qha, qa + qha, 3, 'b');
    glassFace(Fq, 0, qH, 6, [qH * 0.5], 0, false);
    glassFace(wallOf(K, qa + qha, 'a', -qhb, qhb, 3, 'a'), 0, qH, 12, [qH * 0.5], 0, true);
    fan(K, qa, qhb, qha, qtop, qRoof, 'a', s3 ? GOLD : FRAME, s3 ? GOLD : null, false);   // großes Fächerfenster vorn
    // Eingang unten im Querschiff
    arch(Fq, 0.3, 0.7, 0, 8, C(shade('#8a5a3c', 0.1)));
    if (s3) for (const sb of [-1, 1]) {                                    // Fahnen auf dem First des Querschiffs (vorn und hinten)
      const [fx, fy] = K.P(qa, sb * qhb * 0.85, qtop + qRoof);
      g.strokeStyle = C('#9a8a78'); g.lineWidth = Math.max(0.5, 0.5 * z); g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 12 * z); g.stroke();
      poly([[fx, fy - 12 * z], [fx + 7 * z, fy - 10 * z], [fx, fy - 8 * z]], C(sb > 0 ? '#e8604f' : '#5f8fe8'));
    }
    if (lit()) { glowP(Fq(0.5, 10), 26 * z); glowP(wallOf(K, 1.25, 'b', -1.8, 1.8, 3, 'b')(0.2, 6), 18 * z); glowP(wallOf(K, 1.25, 'b', -1.8, 1.8, 3, 'b')(0.8, 6), 18 * z); }
  }

  // B: Grand Palais – Steinflügel vorn mit Säulenreihe und großem Bogentor, dahinter das lange Glasdach (Tonne) und die Glaskuppel.
  // Stufe 1: Steinflügel mit Portikus, niedrige Glashalle · 2: Säulenreihe, höhere Tonne, Kuppel · 3: Gold (Kanten, Kugeln, Kuppelring, Laterne)
  function grandpalais(K, stufe = 3, opt = {}) {
    // Stufe 3 (Nutzer 22.10.): goldenes Glasdach und goldene Kuppel („geil“)
    // Blöcke mit Zierband: auf Flächen nach +a (Schatten) dunkler – K.block malt trim auf allen Seiten gleich hell (Prüfer: „Gold auf
    // Schattenseiten nicht abgedunkelt“)
    const TB = ({ trim, ...o }) => { const r = K.block(o); if (trim) for (const f of Object.values(r.faces)) if (f) faceQuad(f.P, f.Q, 0, 1, f.H - 1.4 * K.z, f.H, C(K.turn(...f.n)[0] > 0.5 ? shade(trim, LIGHT.side) : trim)); return r; };
    const z = K.z, s2 = stufe >= 2, s3 = stufe >= 3, RIB = '#7d8f96', RIBC = s3 ? GOLD_D : RIB, RIBW = s3 ? 0.75 : 0.6;
    TB({ a: 0, b: 0, ha: 1.95, hb: 1.45, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    // Halle hinten: Steinwände, Glastonne längs. opt.buehne 'ausstellung': Konzept „Dein Ausstellungsstück“ (Nutzer 22.10.2026) in der Kuppel
    const hH = 12, htop = 3 + hH, hR = s2 ? 13 : 9, HA = 1.75, HB = 0.95, HBc = -0.35, show = (opt.buehne || '').includes('ausstellung');
    const d0 = show ? -1 : -6, dr = show ? 7 : 10;                         // Tambour: Fuß und Höhe (Ausstellung: beginnt am First, sonst sah man Pfosten in der Halle)
    const [dx, dy] = K.P(0, HBc, htop + hR + d0), R = (show ? 0.7 : 0.62) * Math.SQRT2 * TW / 2 * z;   // Kuppel: Tambour steckt im Glasdach (Vitrine etwas größer)
    const domeRibs = (few = false) => {                                   // Rippen wie auf der Tonne: Meridiane und Ringe auf der sichtbaren Hälfte (Vitrine: weniger)
      const DH = 20 * z, y0 = dy - dr * z, dp = (lat, ph) => [dx + R * Math.cos(lat) * Math.sin(ph), y0 + R / 2 * Math.cos(lat) * Math.cos(ph) - DH * Math.sin(lat)];
      g.strokeStyle = C(RIBC); g.lineWidth = Math.max(0.5, RIBW * z); g.beginPath();
      const M = few ? 2 : 4, step = few ? Math.PI / 5 : Math.PI / 10;
      for (let m = -M; m <= M; m++) { const ph = m * step; for (let j = 0; j <= 12; j++) { const p = dp(Math.PI / 2 * j / 12, ph); j ? g.lineTo(...p) : g.moveTo(...p); } }
      for (const lat of few ? [0.7] : [0.35, 0.78]) for (let j = 0; j <= 24; j++) { const p = dp(lat, -Math.PI / 2 + Math.PI * j / 24); j ? g.lineTo(...p) : g.moveTo(...p); }
      g.stroke();
    };
    const lantern = () => { if (s3) { const t = dy - (dr + 20) * z; cyl(dx, t, 2.6 * z, 1.3 * z, 4 * z, GOLD); cone(dx, t - 4 * z, 3 * z, 1.5 * z, 3.5 * z, GOLD_D); circle(dx, t - 8.5 * z, 1.4 * z, lit() ? '#fff1a8' : C(GOLD_L)); } };
    // Halle immer gleich (Nutzer: das halb durchsichtige Glasdach „sieht scheiße aus“); bei 'ausstellung' ist nur die Kuppel eine Vitrine:
    // Boden auf Firsthöhe, Sockel, ein Modell (verkleinertes Spielbild, passend zur Kuppelhöhe), darüber Tambour und Kuppel halb durchsichtig
    TB({ a: 0, b: HBc, ha: HA, hb: HB, h: hH, lift: 3, wall: STONE2, roof: GLASS, roofH: hR, type: 'barrel', ridge: 'a', over: 1 });
    barrelRibs(K, 0, HBc, HA, HB, htop, hR, true, 16, RIBC, RIBW);
    if (s2 && !show) { cyl(dx, dy, R, R / 2, dr * z, STONE2); ellipse(dx, dy - dr * z, R * 1.06, R * 0.53, C(s3 ? GOLD : shade(STONE2, -0.1))); dome(dx, dy - dr * z, R, R / 2, 20 * z, GLASS); domeRibs(); lantern(); }
    if (s2 && show) {
      // Gerüst der Vitrine ringsum (Nutzer: „die goldenen Leisten gehen nicht ganz rum – das sieht man, weil das Glas durchsichtig ist“):
      // ein Rahmen aus 10 Meridianen, Tambour-Pfosten, Ringen; erst die hintere Hälfte (gedämpft, durchs Glas), dann Stück, Glas, vordere Hälfte
      const DH = 20 * z, y0 = dy - dr * z, NM = 10;
      const dp = (lat, ph) => [dx + R * Math.cos(lat) * Math.sin(ph), y0 + R / 2 * Math.cos(lat) * Math.cos(ph) - DH * Math.sin(lat)];
      const ringPt = (yy, ph) => [dx + R * Math.sin(ph), yy + R / 2 * Math.cos(ph)];
      const frame = front => {                                            // front: Teile mit cos φ ≥ 0 (zum Betrachter), sonst die Rückseite
        const inHalf = ph => (Math.cos(ph) >= -1e-6) === front, col = front ? RIBC : shade(RIBC, 0.25);
        g.lineCap = 'round'; g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, (front ? RIBW : RIBW * 0.8) * z); g.beginPath();   // rund: Teilstücke stoßen ohne Fuge aneinander
        for (let m = 0; m < NM; m++) { const ph = m * 2 * Math.PI / NM; if (!inHalf(ph)) continue;
          for (let j = 0; j <= 12; j++) { const p = dp(Math.PI / 2 * j / 12, ph); j ? g.lineTo(...p) : g.moveTo(...p); }       // Meridian
          const [x, y] = ringPt(dy, ph); g.moveTo(x, y); g.lineTo(x, y - dr * z); }                                          // Pfosten
        // Ring: jedes Teilstück gehört zu der Hälfte, in der seine Mitte liegt – sonst fehlte an den Seiten je ein Stück zwischen vorn und hinten
        const arc = (fn) => { for (let j = 0; j < 48; j++) { if (!inHalf(2 * Math.PI * (j + 0.5) / 48)) continue; g.moveTo(...fn(2 * Math.PI * j / 48)); g.lineTo(...fn(2 * Math.PI * (j + 1) / 48)); } };
        arc(ph => dp(0.7, ph)); arc(ph => ringPt(dy, ph));                // Ring auf der Kuppel, Fußring
        g.stroke();
        g.strokeStyle = C(s3 ? (front ? GOLD : shade(GOLD, 0.2)) : col); g.lineWidth = Math.max(0.5, (s3 ? 1.3 : RIBW) * z); g.beginPath();
        arc(ph => ringPt(dy - dr * z, ph)); g.stroke();                   // Kranz oben am Tambour
      };
      ellipse(dx, dy, R, R / 2, C(shade(STONE2, -0.02)));                // Boden der Vitrine
      frame(false);
      cyl(dx, dy - 0.2 * z, R * 0.42, R * 0.21, 2.5 * z, shade(STONE2, 0.05));       // Sockel
      ellipse(dx, dy - 2.7 * z, R * 0.43, R * 0.215, C(s3 ? GOLD : shade(STONE2, 0.1)));
      const id = opt.stueck || 'mon_pagode', sc = Math.min(0.32, 27 / ((ITEMS[id] && ITEMS[id].h) || 60));
      if (lit()) glowP([dx, dy - 12 * z], 30 * z);
      drawObject(id, dx, dy - 2.7 * z, z * sc, 1e6, 0, 0, 1, { b: id, rot: 0 });
      g.globalAlpha = 0.2; cyl(dx, dy, R, R / 2, dr * z, GLASS); dome(dx, dy - dr * z, R, R / 2, 20 * z, GLASS); g.globalAlpha = 1;
      frame(true);
      lantern();
    }
    // Steinflügel vorn (+b): Säulenreihe, Bogentor in der Mitte, Attika
    const fH = 15, fb = 1.02, fhb = 0.26;
    TB({ a: 0, b: fb, ha: 1.85, hb: fhb, h: fH, lift: 3, wall: STONE2, type: 'flat', roof: shade(STONE2, 0.06), trim: s3 ? GOLD : shade(STONE2, -0.08) });
    const Fb = wallOf(K, fb + fhb, 'a', -1.85, 1.85, 3, 'b'), Fa = wallOf(K, 1.85, 'b', fb - fhb, fb + fhb, 3, 'a');
    for (let i = 0; i < 12; i++) { const t = 0.04 + i * 0.08; if (t > 0.42 && t < 0.58) continue; arch(Fb, t, t + 0.045, 3, 11, C('#9fc3e3')); }
    // Säulenreihe vor der Fassade (Paare zwischen den Fenstern), von hinten nach vorn
    const cols = []; for (let i = 0; i <= 12; i++) { const t = 0.02 + i * 0.08; if (t > 0.4 && t < 0.6) continue; cols.push(-1.85 + 3.7 * t); }
    if (s2) {                                                             // Stufe 2: Säulenreihe mit Gebälk
      cols.sort((p, q) => K.depth(p, fb + fhb + 0.06) - K.depth(q, fb + fhb + 0.06)).forEach(a => column(K, a, fb + fhb + 0.06, 3, fH - 2, '#f6efe0', s3));
      TB({ a: 0, b: fb + fhb + 0.02, ha: 1.85, hb: 0.08, h: 2.2, lift: 3 + fH - 2, wall: STONE2, type: 'flat', roof: shade(STONE2, 0.06), trim: s3 ? GOLD : null });   // Gebälk über den Säulen
    }
    // Dach des Steinflügels (Nutzer 22.10.: „so ein Geländer oben, das machen solche Gebäude da immer – dann Figuren auf Sockel, aber
    // übertreibs nicht“): ab Stufe 2 Terrasse mit Balustrade vorn und an der rechten Seite, vier Postamente (Ecken, neben dem Portikus);
    // Stufe 3: Flügelpferde auf den Ecken, Vasen innen. Stufe 1: schlichte Attika.
    // Reihenfolge (Nutzer: „schau, welche Linien vorne und welche hinten liegen“): alles hier liegt hinter dem Portikus, darum vor ihm;
    // Balustraden-Stücke und Postamente nach ihrer Tiefe (a + b) von hinten nach vorn – ein Sockel überdeckt nie Säulchen weiter vorn
    const be = fb + fhb - 0.03, h0 = 3 + fH, BAL = 3.7, POST_H = 5.9, bBack = fb - fhb + 0.03, aSide = 1.81;
    const vase = (x, y, sc = 1) => {                                       // Amphora: Fuß, Bauch mit Glanz (Licht von links), Hals, Henkel, Deckel
      const u = z * sc;
      poly([[x - 1.2 * u, y], [x + 1.2 * u, y], [x + 0.7 * u, y - 1 * u], [x - 0.7 * u, y - 1 * u]], C(GOLD_D));
      ellipse(x, y - 3.6 * u, 2.4 * u, 2.9 * u, C(GOLD));
      ellipse(x - 0.8 * u, y - 4.4 * u, 0.7 * u, 1.5 * u, C(GOLD_L));
      poly([[x - 1 * u, y - 6 * u], [x + 1 * u, y - 6 * u], [x + 1.3 * u, y - 7.6 * u], [x - 1.3 * u, y - 7.6 * u]], C(GOLD_D));
      g.strokeStyle = C(GOLD_D); g.lineWidth = Math.max(0.5, 0.6 * u); g.beginPath();
      g.moveTo(x - 1.2 * u, y - 7.1 * u); g.quadraticCurveTo(x - 3.4 * u, y - 7.2 * u, x - 2.2 * u, y - 4.6 * u);
      g.moveTo(x + 1.2 * u, y - 7.1 * u); g.quadraticCurveTo(x + 3.4 * u, y - 7.2 * u, x + 2.2 * u, y - 4.6 * u); g.stroke();
      ellipse(x, y - 7.7 * u, 1.6 * u, 0.6 * u, C(GOLD)); circle(x, y - 8.6 * u, 0.7 * u, C(GOLD_L));
    };
    const pegasus = (px, py, s, dir = 1) => {                              // Flügelpferd, steigend, Seitenansicht; dir 1 = Kopf rechts
      const P = (x, y) => [px + dir * (x - 5) * s * z, py - y * s * z];
      poly([[5.0, 7.4], [3.0, 11.6], [4.4, 11.0], [3.8, 12.8], [5.4, 11.6], [5.2, 13.4], [6.6, 11.4], [6.6, 8.2]].map(q => P(...q)), C(GOLD_D));
      poly([[3.2, 0], [3.6, 3.2], [2.6, 5.4], [1.0, 4.4], [0.6, 5.2], [1.4, 6.4], [3.4, 6.8], [5.8, 7.6], [6.6, 9.4], [7.8, 10.6], [9.4, 10.0], [9.6, 9.3],
        [8.5, 9.0], [7.6, 8.2], [7.9, 7.1], [9.3, 7.6], [9.8, 6.7], [8.8, 6.5], [8.6, 5.6], [7.4, 5.4], [5.6, 4.9], [4.8, 3.0], [4.6, 0]].map(q => P(...q)), C(GOLD));
      poly([[5.4, 7.6], [3.6, 11.0], [4.6, 10.8], [4.4, 12.0], [5.6, 11.0], [5.8, 12.4], [6.4, 10.6], [6.2, 8.0]].map(q => P(...q)), C(GOLD_L));
      circle(...P(8.6, 9.9), 0.35 * s * z, C(GOLD_D));
    };
    if (!s2) TB({ a: 0, b: be, ha: 1.85, hb: 0.05, h: 2.6, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.1) });   // Stufe 1: Attika
    else {
      g.strokeStyle = C(shade(STONE2, -0.06)); g.lineWidth = Math.max(0.5, 0.35 * z); g.beginPath();      // Terrasse: Plattenfugen (liegen ganz unten)
      for (let a = -1.8; a <= 1.81; a += 0.15) { g.moveTo(...K.P(a, fb - fhb, h0)); g.lineTo(...K.P(a, be, h0)); }
      for (const b of [fb - 0.12, fb + 0.06]) { g.moveTo(...K.P(-1.85, b, h0)); g.lineTo(...K.P(1.85, b, h0)); } g.stroke();
      const STONE_B = shade(STONE2, 0.08), GAP = shade(STONE2, -0.22);
      // ein Stück Balustrade: Sockelleiste, Schatten dahinter, Säulchen (von hinten nach vorn), Handlauf
      const front = (a0, a1) => () => {                                   // vorn, Wand nach +b (Sonnenseite)
        const am = (a0 + a1) / 2, ha = (a1 - a0) / 2;
        TB({ a: am, b: be, ha, hb: 0.05, h: 0.8, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.08) });
        fRect(wallOf(K, be + 0.05, 'a', a0, a1, h0, 'b'), 0, 1, 0.8, BAL - 0.7, C(GAP));
        for (let a = a0 + 0.04; a < a1 - 0.02; a += 0.075) { const [x, y] = K.P(a, be + 0.05, h0 + 0.8), w = 0.42 * z;
          poly([[x - w * 0.7, y], [x + w * 0.7, y], [x + w * 1.25, y - 0.8 * z], [x + w * 0.55, y - (BAL - 1.5) * z], [x - w * 0.55, y - (BAL - 1.5) * z], [x - w * 1.25, y - 0.8 * z]], C(STONE_B)); }
        TB({ a: am, b: be, ha, hb: 0.05, h: 0.7, lift: h0 + BAL - 0.7, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null });
      };
      const side = (b0, b1, aS = aSide) => () => {                         // Seitenstück: sichtbar ist immer die Seite nach +a (rechts außen; links die Innenseite)
        const bm = (b0 + b1) / 2, hb = (b1 - b0) / 2, sh = c => shade(c, LIGHT.side);
        TB({ a: aS, b: bm, ha: 0.03, hb, h: 0.8, lift: h0, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.08) });
        fRect(wallOf(K, aS + 0.03, 'b', b0, b1, h0, 'a'), 0, 1, 0.8, BAL - 0.7, C(sh(GAP)));
        for (let b = b0 + 0.04; b < b1 - 0.02; b += 0.075) { const [x, y] = K.P(aS + 0.03, b, h0 + 0.8), w = 0.42 * z;
          poly([[x - w * 0.7, y], [x + w * 0.7, y], [x + w * 1.25, y - 0.8 * z], [x + w * 0.55, y - (BAL - 1.5) * z], [x - w * 0.55, y - (BAL - 1.5) * z], [x - w * 1.25, y - 0.8 * z]], C(sh(STONE_B))); }
        TB({ a: aS, b: bm, ha: 0.03, hb, h: 0.7, lift: h0 + BAL - 0.7, wall: shade(STONE2, 0.03), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null });
      };
      const post = (a, b, deco) => () => {                                // Postament über die Balustrade hinaus, Stufe 3 mit Figur
        TB({ a, b, ha: 0.075, hb: 0.09, h: POST_H, lift: h0, wall: shade(STONE2, 0.05), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : shade(STONE2, -0.06) });
        if (s3 && deco) deco(...K.P(a, b, h0 + POST_H));
      };
      const POSTS = [[-1.78, be, (x, y) => pegasus(x, y, 1.25, -1)], [-0.62, be, (x, y) => vase(x, y, 0.9)], [0.62, be, (x, y) => vase(x, y, 0.9)], [1.78, be, (x, y) => pegasus(x, y, 1.25, 1)]];
      const parts = [];                                                   // [Tiefe, Zeichnen]
      const cuts = POSTS.map(p => p[0]);
      for (let i = 0; i + 1 < cuts.length; i++) { const a0 = cuts[i] + 0.075, a1 = cuts[i + 1] - 0.075; parts.push([(a0 + a1) / 2 + be, front(a0, a1)]); }
      const bS = bBack + 0.05, bE = be - 0.09;                            // Seitenstücke zwischen Endpfosten hinten und Eck-Postament vorn
      parts.push([aSide + (bS + bE) / 2, side(bS, bE)]);
      parts.push([-aSide + (bS + bE) / 2, side(bS, bE, -aSide)]);          // links: nur die Innenseite ist zu sehen
      for (const aS of [aSide, -aSide]) parts.push([aS + bBack, () => TB({ a: aS, b: bBack, ha: 0.045, hb: 0.05, h: BAL + 0.4, lift: h0, wall: shade(STONE2, 0.05), type: 'flat', roof: shade(STONE2, 0.12), trim: s3 ? GOLD : null })]);   // Endpfosten hinten
      for (const [a, b, deco] of POSTS) parts.push([a + b + 0.01, post(a, b, deco)]);
      parts.sort((p, q) => p[0] - q[0]).forEach(p => p[1]());
    }
    // Portikus in der Mitte: springt vor, höher, mit flachem Giebel; Tor mittelbraun, darüber Glas im Bogen
    const pb = fb + fhb + 0.16, pt = fH + 5;                            // Dach über dem Handlauf der Balustrade – sonst schimmerte sie als Streifen darüber
    TB({ a: 0, b: pb, ha: 0.32, hb: 0.14, h: pt, lift: 3, wall: shade(STONE2, 0.04), type: 'flat', roof: shade(STONE2, 0.1), trim: s3 ? GOLD : shade(STONE2, -0.08) });
    const Fp = wallOf(K, pb + 0.14, 'a', -0.32, 0.32, 3, 'b');
    poly([Fp(0, pt), Fp(1, pt), Fp(0.5, pt + 5)], C(shade(STONE2, 0.06)));   // flacher Giebel vorn, genau über den Ecken
    g.strokeStyle = C(s3 ? GOLD : shade(STONE2, -0.12)); g.lineWidth = Math.max(0.5, 0.8 * z); g.beginPath(); g.moveTo(...Fp(0, pt)); g.lineTo(...Fp(0.5, pt + 5)); g.lineTo(...Fp(1, pt)); g.stroke();
    arch(Fp, 0.22, 0.78, 0, 14, C('#8a5a3c'));
    arch(Fp, 0.3, 0.7, 7, 13.2, C('#9fc3e3'));
    for (const t of [0.08, 0.92]) fRect(Fp, t - 0.04, t + 0.04, 0, fH + 1, C(shade(STONE2, 0.1)));
    arch(Fa, 0.25, 0.75, 3, 11, C(shade('#9fc3e3', -0.1)));
    if (lit()) { glowP(Fp(0.5, 9), 24 * z); for (const t of [0.2, 0.8]) glowP(Fb(t, 7), 14 * z); }
  }

  window.PRACHT = { opernhaus, semper, garnier, kristall, grandpalais };
  window.prachtEntwurf = (opts = {}) => {
    document.getElementById('cmp')?.remove();
    const Wv = innerWidth, Hv = innerHeight, cv = document.createElement('canvas'); cv.id = 'cmp'; cv.width = Wv * 2; cv.height = Hv * 2;
    Object.assign(cv.style, { position: 'fixed', inset: 0, width: Wv + 'px', height: Hv + 'px', zIndex: 99999, background: opts.night ? '#1f2846' : '#fffaf0' });
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(2, 2); ctx.fillStyle = opts.night ? '#1f2846' : '#fffaf0'; ctx.fillRect(0, 0, Wv, Hv);   // Hintergrund auch im PNG
    const prev = g, n0 = night, sp0 = SPRITE_PAINT; g = ctx; night = opts.night ? NIGHT_MAX : 0; SPRITE_PAINT = true;   // isLive(): Licht wie im Spiel
    const z = opts.z || 2, stufen = opts.stufen || [1, 2, 3], cw = (Wv - 12 * (stufen.length + 1)) / stufen.length;
    try {
      stufen.forEach((st, i) => {
        const x = 12 + i * (cw + 12), cx = x + cw / 2, cy = Hv - 40 - 48 * z;
        const fl = (opts.flaeche || [])[i] || opts.flaeche1;
        if (fl) ground(kit(cx, cy, z, 0), fl[0] + 0.3, fl[1] + 0.3, opts.night ? '#33405e' : '#b4dd8c'); else diamond(cx, cy, 96 * z, 48 * z, opts.night ? '#33405e' : '#b4dd8c');
        PRACHT[(opts.baus || [])[i] || opts.bau || 'opernhaus'](kit(cx, cy, z, 0), st, { buehne: (opts.varianten || [])[i] || opts.buehne, stueck: (opts.stuecke || [])[i] });
        ctx.fillStyle = opts.night ? '#f1e3cf' : '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(opts.titel ? opts.titel[i] : opts.varianten ? 'Variante ' + opts.varianten[i] : 'Stufe ' + st, x + 4, 22);
      });
    } finally { g = prev; night = n0; SPRITE_PAINT = sp0; }
    return 'ok';
  };
  return 'ok';
})();
