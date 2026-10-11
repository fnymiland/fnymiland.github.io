// Entwurf Brückenlicht (Nutzer: „Nacht sieht beschissen aus – nur kleine Punkte; Stein Laternen; Kristall ein Streifen am Fuß des Glasgeländers,
// der es von unten anleuchtet“): Modelle wie tools/brueckenfamilie-entwurf.js (abgenommen), nachts jetzt über den echten Nachtweg des Spiels
// (glowQuad stanzt Licht, drawNight legt die Nacht darüber) statt eines Schleiers. Davor: Entwurf Brückenfamilie (Besprechung 11.10.2026): vier Materialien Holz/Stein/Metall/Kristall, Fußgänger immer Bogen, Bahn immer flach,
// mit Beleuchtung – Tag und Nacht. Nur Bild, über das fertige Spielbild gemalt (wie tools/bogen-anhoehe-entwurf2.js). Lücke 4 zwischen zwei
// Anhöhen, unten quer zwei Wege durch die Feldmitten (Stützen, Böcke, Pfeiler auf den Kachelkanten).
// Fußgänger: Holz (Entwurf 3b), Stein (Pfeiler, Entwurf 10 Stufe 3), Metall (neu: Gitterrost, Stahlträger, Stahlbogen darunter),
// Kristall K1 (nachts nur ein schmaler Streifen unten), K1 mit Zacken (Option). Bahn: Holz (Böcke auf den Kanten), Stein (Viadukt, flach),
// Metall (Fachwerk), Kristall B2 (Fachwerk aus Kristall).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/brueckenlicht-entwurf.js')).text()); await brueckenlichtBild()   → tools/vorschau/brueckenlicht.png
(function brueckenlichtEntwurf() {
  const H = HILL_H, W = 0.3, A0 = 10, A1 = 13, B0 = 18, B1 = 21, HY = [2, 38];
  const ROWS = [
    [4, 'F-holz', 'Fußgänger · Holz'], [8, 'F-stein', 'Fußgänger · Stein'], [12, 'F-metall', 'Fußgänger · Metall (neu)'],
    [16, 'F-kristall', 'Fußgänger · Kristall K1'], [20, 'F-zacken', 'Fußgänger · Kristall K1 mit Zacken'],
    [24, 'B-holz', 'Bahn · Holz'], [28, 'B-stein', 'Bahn · Stein'], [32, 'B-metall', 'Bahn · Metall'], [36, 'B-kristall', 'Bahn · Kristall B2'],
  ];
  let STEIN_GEL = 'baluster';                                              // abgenommen: Balustrade                                                // Geländer der Steinbrücke: 'niedrig' (bisher), 'massiv' (A), 'baluster' (B)
  const LAMP = '#ffd873', LAMP_C = '#bff3ff', LANTERN_S = 0.6;   // Minilaterne auf der Brüstung
  const mock = new Set();
  function setup() {
    for (let y = 0; y <= 42; y++) for (let x = 4; x <= 36; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear();
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    for (const [x0, x1] of [[A0, A1], [B0, B1]]) for (let y = HY[0]; y <= HY[1]; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 });
    for (const [y, id] of ROWS) {
      const st = id === 'F-stein' ? 'platten' : id.startsWith('F-k') || id === 'F-zacken' ? 'kristall' : id === 'F-metall' ? 'asphalt' : 'sand';
      for (const x of [A0, A0 + 1, A0 + 2, A1, B0, B0 + 1, B0 + 2, B1]) state.tiles.set(x + ',' + y, id[0] === 'F' ? { b: 'weg', lvl: 1, style: st, lauf: 0 } : { b: 'schiene', lvl: 1, rot: 0 });
      for (let x = A1 + 1; x < B0; x++) mock.add(x + ',' + y);
    }
    for (const x of [15, 16]) for (let y = 0; y <= 40; y++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'sand', lauf: 1 });
    groundVersion++; recalc();
    for (const [x0, x1] of [[28, 29], [32, 33]]) for (let y = 39; y <= 41; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 });
    groundVersion++; recalc();
    setTool('bruecke'); startPlan('line', { x: 29, y: 40 }, { x: 32, y: 40 }, false); runPlan();   // echte Brücke weit weg: bkOn()
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  let dpr = 1, X = null, NIGHT = false;
  function bridge(y, id, lights) {
    const U0 = A1 + 0.5, U1 = B0 - 0.5, N = U1 - U0, M = 48, foot = id[0] === 'F';
    const pk = foot ? 0.5 * 20.4 * Math.pow(N / 2, 0.6) : 0;
    const S = (u, v, h) => { const p = toScreen(u, y + v); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
    const t01 = u => Math.max(0, Math.min(1, (u - U0) / N)), dk = u => H + pk * Math.sin(Math.PI * t01(u));
    const us = Array.from({ length: M + 1 }, (_, i) => U0 + N * i / M);
    const lw = w => w * cam.z * dpr * 0.5;
    const poly = (pts, fill, stroke, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); if (fill) { X.fillStyle = fill; X.fill(); } if (stroke) { X.strokeStyle = stroke; X.lineWidth = lw(w || 1); X.stroke(); } };
    const path = (pts, col, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.strokeStyle = col; X.lineWidth = lw(w); X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); };
    const band = (v, f0, f1, col, stroke, w) => poly([...us.map(u => S(u, v, f0(u))), ...[...us].reverse().map(u => S(u, v, f1(u)))], col, stroke, w || 0.6);
    const deckTop = (col, w0 = -W, w1 = W) => poly([...us.map(u => S(u, w0, dk(u))), ...[...us].reverse().map(u => S(u, w1, dk(u)))], col);
    // Licht wie im Spiel: nachts (X ist dann das Spielbild, kurz vor drawNight) ein Loch mit weichem Schein stanzen
    const glowAt = (p, s, r, tint) => { if (NIGHT && X === g) glowQuad([[p[0] - s, p[1] - s], [p[0] + s, p[1] - s], [p[0] + s, p[1] + s], [p[0] - s, p[1] + s]], r * cam.z, tint); };
    const point = (u, v, h, col, r = 5) => {                                // kleiner Lichtpunkt: Kappe, nachts warm
      const p = S(u, v, h); X.beginPath(); X.arc(p[0], p[1], 0.85 * cam.z * dpr, 0, 7); X.fillStyle = NIGHT ? '#ffe58a' : C(col); X.fill();
      glowAt(p, 0.8 * cam.z, r);
    };
    const lantern = (u, v, h, frame = null) => {                                          // Minilaterne: Kopf der Gaslaterne des Spiels (drawLantern) auf kurzem Stummel, gleiches Licht
      const p = S(u, v, h), z = cam.z * LANTERN_S, col = frame || lookCol('laterne', { b: 'laterne' }), lit = NIGHT && night > 0.15 && isLive();
      g.strokeStyle = C(col); g.lineWidth = 1.8 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 4 * z); g.stroke();
      const lb = box(p[0], p[1] - 4 * z, 2.6 * z, 1.4 * z, 5 * z, lit ? '#ffe58a' : '#fff7d6', col, 3 * z);
      if (NIGHT) glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 5 * z], [lb.L[0], lb.L[1] - 5 * z]], 30 * z);
    };
    const blueStrip = (v, f) => {                                           // Kristall: Leuchtstreifen, nachts bläulich nach oben
      for (let k = 0; k < 4 * N; k++) { const u0 = U0 + k / 4, u1 = u0 + 0.25;
        if (NIGHT && X === g) glowQuad([S(u0, v, f(u0)), S(u1, v, f(u1)), S(u1, v, f(u1) + 1.4), S(u0, v, f(u0) + 1.4)], 7 * cam.z, 'blue'); }
      path(us.map(u => S(u, v, f(u) + 0.5)), NIGHT ? '#dff8ff' : '#bfe9f8', 0.9);
    };
    const sh = (u, v, h) => { const p = S(u, v, 0); return [p[0] + SUN.dx * h * cam.z * dpr, p[1] + SUN.dy * h * cam.z * dpr]; };
    poly([...us.map(u => sh(u, -W, dk(u))), ...[...us].reverse().map(u => sh(u, W, dk(u)))], 'rgba(40,60,30,0.15)');
    const rails = () => {                                                    // Gleis (Schotter) auf dem flachen Deck
      poly([...us.map(u => S(u, -0.23, H)), ...[...us].reverse().map(u => S(u, 0.23, H))], C('#c3b9a8'));
      for (let k = 0; k <= 8 * N; k++) { const u = U0 + k / 8; path([S(u, -0.15, H), S(u, 0.15, H)], C('#8a6440'), 1.5); }
      for (const v of [-0.09, 0.09]) path(us.map(u => S(u, v, H + 0.6)), C('#6f7682'), 1.3);
    };
    const truss = (v, col, w) => {
      const T = 11, a = U0 + 0.15, b = U1 - 0.15, m = 2 * N;
      path([S(U0, v, H), S(U1, v, H)], col, w * 1.4); path([S(a, v, H + T), S(b, v, H + T)], col, w * 1.4);
      path([S(U0, v, H), S(a, v, H + T)], col, w); path([S(U1, v, H), S(b, v, H + T)], col, w);
      for (let j = 0; j < m; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; path([S(p, v, H + T), S(q, v, H)], col, w); if (j) path([S(p, v, H), S(p, v, H + T)], col, w * 0.8); }
    };
    // Stein: Bögen je 2 Felder, Pfeiler auf der Mittelkante (Entwurf 10 Stufe 3), Buckel pk (Bahn: flach)
    const stone = () => {
      const L = { face: '#d9d2c3', joint: '#a99f8c', deck: '#e6dcc8', top: '#efe8da' }, sp = 3, n = 2, hp = 13, gap = 7.5, PW = 0.09, edges = [U0, U0 + N / 2, U1];
      const ri = u => { const k = u < edges[1] ? 0 : 1, a = edges[k] + (k ? PW : 0), c = edges[k + 1] - (k ? 0 : PW), t = Math.max(0, Math.min(1, (u - a) / (c - a)));
        const sa = k ? hp : H - sp, sc = k ? H - sp : hp, base = sa + (sc - sa) * t, top = dk((a + c) / 2) - gap, mid = (sa + sc) / 2;
        return Math.min(dk(u) - 3, base + Math.max(0, top - mid) * Math.sqrt(Math.max(0, Math.sin(Math.PI * t)))); };
      const PH = STEIN_GEL === 'niedrig' ? 3 : 6.5, ramp = u => Math.min(1, Math.min(u - U0, U1 - u) / 0.45), parH = u => PH * ramp(u);
      // Geländer (Nutzer: „die Steinbrücke ist die einzige ohne Geländer“): A massiv hoch, B Balustrade (Pfosten + Handlauf)
      const parapet = (v, front) => {
        if (STEIN_GEL === 'baluster') {
          const n = Math.round(10 * N);
          for (let k = 0; k <= n; k++) { const u = U0 + N * k / n, h = parH(u); if (h < 1) continue;
            poly([S(u - 0.022, v, dk(u)), S(u + 0.022, v, dk(u)), S(u + 0.022, v, dk(u) + h - 1.4), S(u - 0.022, v, dk(u) + h - 1.4)], C(front ? L.top : shade(L.top, -0.14)), C(L.joint), 0.4); }
          band(v, u => dk(u) + parH(u) - 1.6, u => dk(u) + parH(u), C(front ? L.top : shade(L.top, -0.1)), C(L.joint), 0.5);
          band(v, u => dk(u) - 0.01, u => dk(u) + 0.9 * ramp(u), C(front ? shade(L.top, -0.05) : shade(L.top, -0.16)));
        } else {
          band(v, u => dk(u), u => dk(u) + parH(u), C(front ? L.top : shade(L.top, -0.12)), front ? C(L.joint) : null);
          if (front) for (let k = 1; k < 4 * N; k++) { const u = U0 + k / 4; if (ramp(u) > 0.9) path([S(u, v, dk(u) + 0.6), S(u, v, dk(u) + parH(u) - 1.4)], 'rgba(150,135,110,0.4)', 0.5); }
        }
        path(us.map(u => S(u, v, dk(u) + parH(u))), C(shade(L.top, front ? 0.06 : -0.04)), 1.3);   // Abdeckung
      };
      parapet(-W, false);
      deckTop(C(L.deck));
      if (foot) for (let i = 1; i < M; i += 2) path([S(us[i], -W, dk(us[i])), S(us[i], W, dk(us[i]))], 'rgba(150,135,110,0.45)', 0.6);
      poly([S(edges[1] + PW, -W, 0), S(edges[1] + PW, W, 0), S(edges[1] + PW, W, hp), S(edges[1] + PW, -W, hp)], C(shade(L.face, -0.12)), C(L.joint), 0.5);
      const UU = Array.from({ length: 6 * M + 1 }, (_, i) => U0 + N * i / (6 * M));
      const face = () => { X.beginPath();
        [...UU.map(u => S(u, W, dk(u))), S(U1, W, H - sp), S(U1, W, 0), S(U0, W, 0), S(U0, W, H - sp)].forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath();
        for (let k = 0; k < n; k++) { const a = edges[k] + (k ? PW : 0), c = edges[k + 1] - (k ? 0 : PW);
          [S(a, W, 0), ...UU.filter(u => u >= a && u <= c).map(u => S(u, W, ri(u))), S(c, W, 0)].forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); } };
      face(); X.fillStyle = C(L.face); X.fill('evenodd');
      for (let k = 0; k < n; k++) { const a = edges[k] + (k ? PW : 0), c = edges[k + 1] - (k ? 0 : PW), seg = UU.filter(u => u >= a && u <= c);
        for (let q = 1; q < 10; q++) { const u = a + (c - a) * q / 10; path([S(u, W, ri(u)), S(u, W, ri(u) + 3.2)], C(L.joint), 0.6); }
        path(seg.map(u => S(u, W, ri(u))), C(shade(L.face, -0.25)), 1); path(seg.map(u => S(u, W, ri(u) + 3.2)), C(L.joint), 0.6); }
      if (!foot) rails();
      parapet(W, true);
      for (let k = 1; k < N; k++) for (const v of [-W, W]) lantern(U0 + k, v, dk(U0 + k) + PH, '#b8ad97');   // Laterne in Stein (Nutzer: „dieselbe Farbe wie die Brücke“)   // Laternen auf der Brüstung (je Kante)
    };
    if (id === 'F-holz') {                                                   // Entwurf 3b, Stützen „wenige“ (Kanten 1 und 3)
      const L = { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238', rib: '#7a5a3d' };
      const rib = u => dk(u) - 7 + 3 * Math.sin(Math.PI * t01(u)), posts = [U0 + 1, U0 + 3];
      const post = (u, v) => poly([S(u - 0.035, v, 0), S(u + 0.035, v, 0), S(u + 0.035, v, dk(u) - 0.5), S(u - 0.035, v, dk(u) - 0.5)], C(L.side));
      for (const u of posts) post(u, -W + 0.06);
      for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(L.rail), 1); }
      path(us.map(u => S(u, -W, dk(u) + 6)), C(L.rail), 1.3);
      for (const u of posts) { path([S(u, -W + 0.06, 3), S(u, W - 0.06, rib(u) - 4)], C(shade(L.side, -0.1)), 0.9); path([S(u, W - 0.06, 3), S(u, -W + 0.06, rib(u) - 4)], C(shade(L.side, -0.1)), 0.9); }
      for (const u of posts) post(u, W - 0.06);
      deckTop(C(L.deck));
      for (let k = 0; k <= 9 * N; k++) { const u = U0 + k / 9; path([S(u, -W, dk(u)), S(u, W, dk(u))], C(L.plank), 0.6); }
      band(W, u => dk(u) - 2, dk, C(shade(L.side, 0.05)));
      for (let k = 1; k < 2 * N; k++) { const u = U0 + k / 2; path([S(u, W, rib(u)), S(u, W, dk(u) - 2)], C(L.side), 1); }
      band(W, u => rib(u) - 2.2, rib, C(L.rib));
      for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, W, dk(u)), S(u, W, dk(u) + 6)], C(L.rail), 1.1); }
      path(us.map(u => S(u, W, dk(u) + 6)), C(L.rail), 1.5); path(us.map(u => S(u, W, dk(u) + 3)), C(L.rail), 0.9);
      for (let k = 0; k <= 2 * N; k++) for (const v of [-W, W]) { const u = U0 + k / 2; point(u, v, dk(u) + 6.6, '#f3e3b0'); }   // kleine Punkte auf den Pfosten
    } else if (id === 'F-stein' || id === 'B-stein') stone();
    else if (id === 'F-metall') {                                            // neu: gewölbter Gitterrost, Stahlträger, dünner Stahlbogen darunter
      const L = { steel: '#5d7d7a', light: '#9bb7b3', dark: '#3e5452', grate: '#cfd3cf' };
      const rib = u => H - 6 + (pk + 6 - 6) * Math.sin(Math.PI * t01(u));
      for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6.5)], C(L.dark), 0.8); }
      path(us.map(u => S(u, -W, dk(u) + 6.5)), C(L.dark), 1.2); path(us.map(u => S(u, -W, dk(u) + 3.2)), C(L.dark), 0.7);
      deckTop(C(L.grate));
      for (let k = 0; k <= 10 * N; k++) { const u = U0 + k / 10; path([S(u, -W, dk(u)), S(u, W, dk(u))], 'rgba(90,100,100,0.35)', 0.5); }
      for (const v of [-0.15, 0, 0.15]) path(us.map(u => S(u, v, dk(u))), 'rgba(90,100,100,0.25)', 0.5);
      band(W, u => dk(u) - 2.6, dk, C(L.steel), C(L.dark), 0.5);             // Stahlträger
      for (let k = 1; k < 3 * N; k++) { const u = U0 + k / 3; if (dk(u) - 2.6 - rib(u) > 1) path([S(u, W, rib(u)), S(u, W, dk(u) - 2.6)], C(L.steel), 0.9); }   // Hänger
      path(us.map(u => S(u, W, rib(u))), C(L.steel), 2.2);                   // Stahlbogen
      path(us.map(u => S(u, W, rib(u) + 0.6)), C(L.light), 0.6);
      for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, W, dk(u)), S(u, W, dk(u) + 6.5)], C(L.steel), 0.9); }
      path(us.map(u => S(u, W, dk(u) + 6.5)), C(L.light), 1.5); path(us.map(u => S(u, W, dk(u) + 3.2)), C(L.steel), 0.8);
      for (let k = 0; k <= 2 * N; k++) for (const v of [-W, W]) { const u = U0 + k / 2; point(u, v, dk(u) + 7, '#eef3f2'); }   // kleine Punkte auf dem Handlauf
    } else if (id === 'F-kristall' || id === 'F-zacken') {                   // K1 Glasbogen; nachts nur ein schmaler Streifen unten
      const ri = u => H - 3 + pk * Math.sin(Math.PI * t01(u));
      const glassRail = (v, front) => {
        band(v, u => dk(u), u => dk(u) + 6, front ? 'rgba(175,225,248,0.42)' : 'rgba(175,225,248,0.3)');
        for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, v, dk(u)), S(u, v, dk(u) + 6)], '#d8f2fc', 0.6); }
        path(us.map(u => S(u, v, dk(u) + 6)), C(front ? '#8fd3f2' : shade('#8fd3f2', -0.1)), 1.3);
      };
      glassRail(-W, false);
      blueStrip(-W, u => dk(u));
      deckTop(C('#e6f6fc'));
      for (let k = 1; k < 6 * N; k++) { const u = U0 + k / 6; path([S(u, -W, dk(u)), S(u, W, dk(u))], C('#c3e7f5'), 0.5); }
      band(W, ri, dk, 'rgba(143,203,230,0.78)', C('#5aa9d6'), 0.7);
      if (id === 'F-zacken') for (let k = 1; k < 7 * N; k++) {               // Kristallzacken (Option)
        const u = U0 + (k + 0.5) / 7, len = 3 + 4 * Math.abs(Math.sin(k * 2.3)) * Math.sin(Math.PI * t01(u)), w2 = 0.05;
        if (ri(u) - len < H - 6) continue;
        poly([S(u - w2, W, ri(u - w2)), S(u + w2, W, ri(u + w2)), S(u, W, ri(u) - len)], k % 2 ? C('#7fc4e8') : C('#c9b8f0'), C('#5aa9d6'), 0.4);
      }
      path(us.map(u => S(u, W, dk(u) - 0.6)), C('#f7fdff'), 0.8);
      glassRail(W, true);
      blueStrip(W, u => dk(u));                                              // Leuchtstreifen am Fuß des Glasgeländers (vorn; hinten unten)
    } else if (id === 'B-holz') {                                            // flach, Böcke auf den Kanten, Geländer
      const L = { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', beam: '#8a5f38', rail: '#a9774a' };
      const bock = (u, v) => poly([S(u - 0.035, v, 0), S(u + 0.035, v, 0), S(u + 0.035, v, H - 3), S(u - 0.035, v, H - 3)], C(L.side));
      for (let k = 1; k < N; k++) bock(U0 + k, -W + 0.06);
      for (let k = 0; k <= 2 * N; k++) { const u = U0 + k / 2; path([S(u, -W, H), S(u, -W, H + 8)], C(L.side), 1.2); }
      path([S(U0, -W, H + 8), S(U1, -W, H + 8)], C(L.side), 1.4);
      for (let k = 1; k < N; k++) { const u = U0 + k; path([S(u, -W + 0.06, 2), S(u, W - 0.06, H - 5)], C(L.side), 1.1); path([S(u, W - 0.06, 2), S(u, -W + 0.06, H - 5)], C(L.side), 1.1); }
      for (let k = 1; k < N; k++) bock(U0 + k, W - 0.06);
      deckTop(C(L.deck));
      for (let k = 0; k <= 9 * N; k++) { const u = U0 + k / 9; path([S(u, -W, H), S(u, W, H)], C(L.plank), 0.6); }
      rails();
      band(W, () => H - 3, () => H, C(L.beam));
      for (let k = 0; k <= 2 * N; k++) { const u = U0 + k / 2; path([S(u, W, H), S(u, W, H + 8)], C(L.rail), 1.4); }
      path([S(U0, W, H + 8), S(U1, W, H + 8)], C(L.rail), 1.8); path([S(U0, W, H + 4), S(U1, W, H + 4)], C(L.rail), 1);
      for (let k = 0; k <= 2 * N; k++) for (const v of [-W, W]) point(U0 + k / 2, v, H + 8.6, '#f3e3b0');
    } else if (id === 'B-metall' || id === 'B-kristall') {                   // Fachwerk (Kristall: B2)
      const kr = id === 'B-kristall';
      truss(-W - 0.02, C(kr ? '#7fc4e8' : '#3e5452'), 1.2);
      deckTop(C(kr ? '#d7eef7' : '#cfd3cf'));
      band(W, () => H - 4, () => H, C(kr ? '#bfe6f7' : '#5d7d7a'), C(kr ? '#5aa9d6' : '#3e5452'), 0.6);
      rails();
      truss(W + 0.02, C(kr ? '#8fd3f2' : '#7fa09c'), 1.6);
      if (kr) { path([S(U0 + 0.15, W + 0.02, H + 11), S(U1 - 0.15, W + 0.02, H + 11)], C('#f7fdff'), 0.7); for (const v of [-W - 0.02, W + 0.02]) blueStrip(v, () => H); }   // Kristall: Streifen am Fuß des Fachwerks
      else for (const v of [-W - 0.02, W + 0.02]) for (let k = 0; k <= 2 * N; k++) point(U0 + 0.15 + (N - 0.3) * k / (2 * N), v, H + 11.6, '#e9eef0', 4);   // kleine Punkte am Obergurt
    }
  }
  function drawAll(ctx, d) {                                                 // alle Brücken in ctx (d: Gerätepunkte je Bildpunkt)
    X = ctx; dpr = d;
    for (const [y, id] of ROWS) { X.save(); try {
      const Q = (u, w, h) => { const q = toScreen(u, w); return [q.x * dpr, (q.y - h * cam.z) * dpr]; };   // ferne Anhöhe deckt das Ende
      for (const f of [[Q(B0 - 0.5, HY[0] - 0.5, H), Q(B1 + 0.5, HY[0] - 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, H), Q(B0 - 0.5, HY[1] + 0.5, H)],
                       [Q(B0 - 0.5, HY[1] + 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, 0), Q(B0 - 0.5, HY[1] + 0.5, 0)]]) {
        X.beginPath(); X.rect(-1e5, -1e5, 3e5, 3e5); f.forEach((q, i) => i ? X.lineTo(q[0], q[1]) : X.moveTo(q[0], q[1])); X.closePath(); X.clip('evenodd'); }
      bridge(y, id, []);
    } finally { X.restore(); } }
  }
  function shot(cx, cy, zz, Wd, Hd, nt) {
    NIGHT = nt;
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - H; cam.z = zz;
    nightAt = () => (nt ? NIGHT_MAX : 0); gameHour = () => (nt ? 23 : 12); night = nt ? NIGHT_MAX : 0;
    const o = { baf: bkArmFrom, braf: bkRailArmFrom, off: GL.off, dn: drawNight };
    bkArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.baf(x, y, dx, dy);
    bkRailArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.braf(x, y, dx, dy);
    if (nt) drawNight = (...a) => { g.save(); try { drawAll(g, 1); } finally { g.restore(); } return o.dn(...a); };   // nachts: vor der Nacht ins Spielbild, mit echtem Licht
    GL.off = true; resetDrawCaches(); groundVersion++;
    try { const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { bkArmFrom = o.baf; bkRailArmFrom = o.braf; GL.off = o.off; drawNight = o.dn; }
    if (!nt) { g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0); try { drawAll(g, 1); } finally { g.restore(); } }   // tags: ins Spielbild darüber (Laterne zeichnet in g)
    const d = canvas.width / innerWidth;
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const cx2 = c.getContext('2d');
    const ox = canvas.width / 2 - Wd / 2, oy = canvas.height / 2 - Hd / 2;
    cx2.fillStyle = '#fffaf0'; cx2.fillRect(0, 0, Wd, Hd); cx2.drawImage(canvas, ox, oy, Wd, Hd, 0, 0, Wd, Hd);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.steinGelaender = gel => { STEIN_GEL = gel; };
  window.brueckenlichtBild = async (name = 'brueckenlicht.png', Wd = 500, Hd = 400) => {
    setup();
    const na = nightAt, gh = gameHour, n0 = night;
    const list = ROWS.flatMap(([y, , l]) => [[15.5, y, 1.8, l + ' · Tag', false], [15.5, y, 1.8, l + ' · Nacht', true]]);
    const cols = 4, rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Wd + 16); sheet.height = rows * (Hd + 46);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      list.forEach(([x, y, z, l, nt], i) => {
        const c = shot(x, y, z, Wd, Hd, nt), Xs = (i % cols) * (Wd + 16), Ys = Math.floor(i / cols) * (Hd + 46) + 36;
        sx.drawImage(c, Xs, Ys); sx.font = '800 19px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, Xs + 6, Ys - 9);
      });
    } finally { nightAt = na; gameHour = gh; night = n0; resetDrawCaches(); groundVersion++; }
    return post(name, sheet);
  };
  return 'ok';
})();
