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

  window.PRACHT = { opernhaus };
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
        PRACHT[opts.bau || 'opernhaus'](kit(cx, cy, z, 0), st, { buehne: (opts.varianten || [])[i] || opts.buehne });
        ctx.fillStyle = opts.night ? '#f1e3cf' : '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(opts.varianten ? 'Variante ' + opts.varianten[i] : 'Stufe ' + st, x + 4, 22);
      });
    } finally { g = prev; night = n0; SPRITE_PAINT = sp0; }
    return 'ok';
  };
  return 'ok';
})();
