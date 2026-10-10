// Entwurf (Nutzer 10.10.2026: die Weg-Rampe wird zur GLEIS-RAMPE – Züge fahren auf die Anhöhe, Autos gibt es nie): vier Varianten an
// echten Anhöhen, je mit Gleis unten, Gleis oben weiter und einem Zug (Regionalbahn wie im Spiel, 2 Wagen) auf der Schräge.
// Nur als Bild, kein Spielcode geändert. Die Rampenfelder stehen als einzelne 'huegelrampe' im Spielstand; nur für dieses Bild sagen
// rampAt/rampFresh, dass sie eine Rampe aus len Feldern sind (das Spiel kann nur 1 und 2) – so zeichnet die echte Bildchen-Maschine sie (Reihenfolge,
// Wangen, Keile, Kanten der Anhöhe). Gemalt wird ein Rampenfeld von paintRamp (hier: Boden/Damm/Viadukt + Gleis statt Wegbelag), das Gleis
// oben von paintHill (drawRailBed auf der Oberseite), das unten liegt als echte Schiene im Boden-Bild (bAt meldet die Rampenfelder als
// Schiene, damit railArms anschließt). Züge: trainCars liefert die Wagen, trainTunnelCut legt sie ins vorderste Feld unter ihnen (danach
// kommen nur noch, die vor ihnen liegen – Wangen), rampSink hebt jede Ecke auf die Höhe des Gleises (wie das Absinken in der U-Bahn-Rampe).
// Breite (Nutzer: Rampe/Treppe sind breiter als die Wege): A ist ein Einschnitt über das ganze Feld (Wangen = Wände der Anhöhe daneben),
// B und C sind schmal wie das Gleis (G.narrow: Damm ±DW mit Stützmauer bzw. Erdwand, im Einschnitt bleibt beidseits ein Streifen Anhöhe stehen),
// D (Viadukt) ±VW mit Brüstung. Unter den vier Bildern dieselben Rampen ohne Zug.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/gleisrampe-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await gleisrampeBild()   → tools/vorschau/gleisrampe-varianten.png
// Nahaufnahmen: await gleisrampeNah([[n, u, v, höhe, 'Text'], …], 'name.png', zoom)  (n = Variante 0–3, u/v relativ zu ihrem Ursprung;
// window.gleisrampeOhneZug = true lässt den Zug weg – sonst verdeckt er die Anschlüsse)
(function gleisrampeEntwurf() {
  const VARS = [
    ['A', '2 Felder, eingelassen (Einschnitt)'],
    ['B', '3 Felder, Damm mit Stützmauer'],
    ['C', '4 Felder, halb eingelassen, halb Damm'],
    ['D', '4 Felder, Viadukt auf Bögen'],
  ];
  const E = 0.0075, VW = 0.3, PW = 0.035, PH = 3;                       // Überlapp; Viadukt: halbe Breite, Brüstung dick/hoch
  const DW = 0.32;                                                       // schmal (Damm, Einschnitt): halbe Breite – Gleisbett ist ±0,23
  const STONE = { v: '#d6cdbb', u: '#bcb29f', top: '#e6dfcf', deck: '#bdb4a3' };   // Viadukt (hell wie die Steinbogenbrücke)
  const GROUPS = [], RF = new Map(), TOP = new Set(), ORIG = [[0, 2], [16, 2], [0, 19], [16, 19]];
  let base = null, z = 1;

  // --- Rampe aus len Feldern: foot = Fußfeld, rot wie STAIR_UP (zeigt hinauf), body 'damm' (seitlich Anhöhe = Wange, sonst Damm) | 'viadukt'
  function group(n, fx, fy, rot, len, body, wall) {
    const [Du, Dv] = STAIR_UP[rot], F = [];
    for (let i = 0; i < len; i++) F.push([fx + i * Du, fy + i * Dv]);
    const ax = Math.min(...F.map(p => p[0])), ay = Math.min(...F.map(p => p[1]));
    const G = { n, fx, fy, rot, len, body, wall, Du, Dv, F, ax, ay, k: ax + ',' + ay };
    F.forEach(([x, y], i) => { const k = x + ',' + y; RF.set(k, { G, i }); state.tiles.set(k, { b: 'huegelrampe', lvl: 1, rot, style: 'sand', gr: true }); });
    GROUPS.push(G);
    return G;
  }
  // Höhe des Gleises (Bildpunkte) an Weltpunkt (wx, wy): linear von der Vorderkante des Fußes (0) bis zur Hinterkante oben (HILL_H)
  const along = (G, wx, wy) => (wx - G.fx) * G.Du + (wy - G.fy) * G.Dv + 0.5;
  const surfH = (G, wx, wy) => HILL_H * Math.max(0, Math.min(1, along(G, wx, wy) / G.len));
  // Feld i der Rampe liegt im Einschnitt (beidseits Anhöhe)
  const cutAt = (G, i) => { if (i < 0 || i >= G.len) return false; const [x, y] = G.F[i], Su = -G.Dv, Sv = G.Du; return hillLevel(x + Su, y + Sv) > 0 && hillLevel(x - Su, y - Sv) > 0; };

  // --- Gleis gerade über ein Rampenfeld (d0 … d1 längs, Höhe W liefert), Farben und Maße wie drawRailBed ---
  function railStraight(W, d0, d1, lk) {
    const ds = [d0, ...[-0.5, 0.5].filter(d => d > d0 && d < d1), d1];  // Knicke der Höhe (oben waagerecht) mitnehmen
    const band = w => [...ds.map(d => W(d, -w)), ...ds.slice().reverse().map(d => W(d, w))];
    poly(band(RAIL_W + 0.03), C(lk.edge)); poly(band(RAIL_W), C(lk.bed));
    g.strokeStyle = C(lk.tie); g.lineWidth = 1.7; g.lineCap = 'butt'; g.beginPath();
    for (let d = -0.4375; d < 0.5; d += 0.125) { const a = W(d, -0.15), b = W(d, 0.15); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
    g.stroke();
    const line = (o, col, w, dy) => { g.beginPath(); ds.forEach((d, i) => { const p = W(d, o); i ? g.lineTo(p[0], p[1] + dy) : g.moveTo(p[0], p[1] + dy); }); g.strokeStyle = C(col); g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
    for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) { line(o, lk.rail, lk.rw, 0); line(o, '#dfe3e8', 0.45, -0.4); }
  }

  // Stirn eines Streifens im schmalen Einschnitt (vorn an der Anhöhe, s0 … s1 quer): die Wand, die hier ohne Einschnitt stünde (ganzes Feld,
  // Seite und Muster wie paintHill), auf den Streifen zugeschnitten – so liegen Steine und Wurzeln wie an jeder Anhöhe und nie halb an der
  // Feldgrenze. Die Grasnarbe eigens für das Stück: an beiden Enden genau in der Mitte (wie paintHillWall), so läuft sie um die Ecke zur
  // Wand des Einschnitts und über die Feldgrenze zur Anhöhe daneben bündig weiter
  function stirn(P, x, y, UV, s0, s1, dir, kind) {
    const H = HILL_H, S = HILL_STY[kind], sa = Math.min(s0, s1), sb = Math.max(s0, s1), o = 0.5 + 2 * E;
    const lo = sa <= -0.5 ? -o : sa, hi = sb >= 0.5 ? o : sb;            // zur Feldgrenze hin ein Stück darüber (keine Fuge zur Anhöhe daneben)
    const [ua, va] = UV(-0.5, lo), [ub, vb] = UV(-0.5, hi);
    g.save();
    try {
      g.beginPath(); [P(ua, va, -2), P(ub, vb, -2), P(ub, vb, H + 2), P(ua, va, H + 2)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
      if (dir === 'v') paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, 0, H, x * 7 + y * 13, H, false, 1, E, E);
      else paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, 0, H, x * 11 + y * 5 + 3, H, false, 1, E, E);
    } finally { g.restore(); }
    const [a0, b0] = UV(-0.5, s0), [a1, b1] = UV(-0.5, s1), at = (t, h) => P(a0 + (a1 - a0) * t, b0 + (b1 - b0) * t, h);
    const ext0 = Math.abs(s0) >= 0.5 ? E / Math.abs(s1 - s0) : 0, ext1 = Math.abs(s1) >= 0.5 ? E / Math.abs(s1 - s0) : 0, n = 2;
    const low = i => H - S.lipH - (i % n ? hash(x * 3 + y, 90 + i, 157) : 0.5) * S.lipH * 0.7;
    const pts = [at(-ext0, H + 0.4)];
    for (let i = 0; i <= n; i++) pts.push(at(i / n, H + 0.4));
    pts.push(at(1 + ext1, H + 0.4), at(1 + ext1, low(n)));
    for (let i = n; i >= 0; i--) pts.push(at(i / n, low(i)));
    pts.push(at(-ext0, low(0)));
    poly(pts, C(S.lip));
  }

  // --- Ein Rampenfeld malen (statt paintRamp). P(u, v, up) wie dort; o aus rampLook (m/p: 'h' Anhöhe = Wange, 'k' offen) ---
  function paintGleis(P, o, x, y) {
    const R = RF.get(x + ',' + y);
    if (!R) return ORIG_FN.paintRamp(P, o, x, y);
    const G = R.G, H = HILL_H, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du;
    const h0 = H * o.i / o.len, h1 = H * (o.i + 1) / o.len, full = o.i === o.len - 1, prev = o.i > 0;
    const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];
    const hd = d => { const h = Math.max(0, h0 + (h1 - h0) * (d + 0.5)); return full ? Math.min(H, h) : h; };
    const W = (d, s, up = 0) => P(...UV(d, s), hd(d) + up);
    const sgF = Su + Sv > 0 ? 1 : -1;                                    // Seite, die zum Betrachter zeigt
    const ft = prev ? -0.5 : -0.5 - E, bk = 0.5 + E;                     // vorn flach auf den Boden davor, hinten unter das nächste Feld
    const ds = [ft, -0.5, 0.5, bk];
    const quad = (s0, s1) => [...ds.map(d => W(d, s0)), ...ds.slice().reverse().map(d => W(d, s1))];
    const lk = RAIL_LOOK.schotter, seed = x * 5 + y * 9 + o.rot;
    if (G.body === 'viadukt' && o.m !== 'h' && o.p !== 'h') return paintViadukt(P, o, x, y, R, { UV, hd, W, ds, quad, sgF, h0, h1, prev, lk });
    const cut = o.m === 'h' && o.p === 'h', w = G.narrow ? DW : 0.5, kind = G.wall || o.kind;
    const Hq = (d, s) => P(...UV(d, s), H);                              // Punkt auf der Oberkante der Anhöhe
    const trace = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
    const dk = 'rgba(45,85,30,0.5)';
    if (G.narrow && cut) {
      // Schmaler Einschnitt: links und rechts bleibt ein Streifen Anhöhe stehen (bis ±DW), dazwischen der Boden mit dem Gleis. Vorn im
      // ersten Feld (davor kein Einschnitt) die Stirn der Streifen – sie setzt die Wand der Anhöhe daneben fort
      const first = !cutAt(G, R.i - 1), fs = first ? -0.5 : -0.5 - E;
      const topQ = (s0, s1) => [Hq(fs, s0), Hq(0.5 + E, s0), Hq(0.5 + E, s1), Hq(fs, s1)];
      const sBo = -(0.5 + E) * sgF, sBi = -DW * sgF, sFi = DW * sgF, sFo = (0.5 + E) * sgF;
      const dirS = sgF * Su > 0 ? 'u' : 'v', dirD = -Du > 0 ? 'u' : 'v';
      poly(topQ(sBo, sBi), C(o.top));                                     // hinterer Streifen: Oberseite, Wand zum Einschnitt, Stirn
      { const [a0, b0] = UV(-0.5, sBi), [a1, b1] = UV(0.5, sBi); paintHillWall(P, a0, b0, a1, b1, dirS, kind, 0, H, seed + 11, H, true, 1, first ? 0 : E, 0); }
      if (first) stirn(P, x, y, UV, -0.5 * sgF, sBi, dirD, kind);
      poly(quad(-w, w), C(o.top));                                        // Boden (deckt den unteren Teil der Wand) und Gleis
      railStraight(W, ft, bk, lk);
      const fq = topQ(sFi, sFo);                                          // vorderer Streifen: Oberseite mit dunkler Kante zum Einschnitt
      poly(fq, C(o.top));
      g.save();
      try {
        trace(fq); g.closePath(); g.clip();
        // die Kante blendet aus, wo der Boden die Oberkante erreicht (oben am Ende des Einschnitts gleich hoch: keine Kante)
        const dA = (H * 0.75 - h0) / (h1 - h0) - 0.5, dB = (H - h0) / (h1 - h0) - 0.5;
        let st = dk;
        if (dA < 0.5 + E) { const a = Hq(dA, sFi), b = Hq(dB, sFi), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); if (gr) { gr.addColorStop(0, dk); gr.addColorStop(1, 'rgba(45,85,30,0)'); st = gr; } }
        trace([Hq(-0.6, sFi), Hq(0.6, sFi)]); g.strokeStyle = st; g.lineWidth = 3; g.lineCap = 'butt'; g.stroke();
      } finally { g.restore(); }
      if (first) stirn(P, x, y, UV, sFi, 0.5 * sgF, dirD, kind);
      return;
    }
    // Einschnitt über das ganze Feld (Wangen = Wände der Anhöhe daneben) bzw. Damm (schmal: ±DW): Oberseite in Bodenfarbe, darauf das Gleis
    // Oberseite hinten (über die Feldgrenze) an den offenen Seiten etwas schmaler: sonst stand ihr Eck über der Stirn des Einschnitts dahinter
    const tp = (sa, sb) => [W(ft, sa), W(-0.5, sa), W(0.5, sa), W(bk, sa === -0.5 ? sa : sa + 2 * E), W(bk, sb === 0.5 ? sb : sb - 2 * E), W(0.5, sb), W(-0.5, sb), W(ft, sb)];
    poly(tp(-w, w), C(o.top));
    railStraight(W, ft, bk, lk);
    // offene Seite hinten: dunkle Kante oben (wie der hintere Keil der Rampe), am Fuß bis ¼ Höhe eingeblendet
    const back = sgF > 0 ? o.m : o.p;
    if (back === 'k') {
      const sOut = -w * sgF;
      g.save();
      try {
        trace(quad(-w, w)); g.closePath(); g.clip();
        const WL = (d, s) => P(...UV(d, s), h0 + (h1 - h0) * (d + 0.5));
        const e = full ? [WL(-0.6, sOut), WL(0.5, sOut), W(0.6, sOut)] : [WL(-0.6, sOut), WL(0.6, sOut)], d1 = (H / 4 - h0) / (h1 - h0) - 0.5;
        let st = dk;
        if (d1 > -0.5) { const a = W(-0.5, sOut), b = W(Math.min(0.5, d1), sOut), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); if (gr) { gr.addColorStop(0, 'rgba(45,85,30,0)'); gr.addColorStop(1, dk); st = gr; } }
        trace(e); g.strokeStyle = st; g.lineWidth = 3; g.lineCap = 'butt'; g.stroke();
      } finally { g.restore(); }
    }
    // offene Seite vorn: Wand des Damms (Stützmauer bzw. wie die Anhöhe), Grasnarbe oben; Schichten nach der ganzen Höhe (bündig über Feldgrenzen)
    const front = sgF > 0 ? o.p : o.m;
    if (front === 'k') {
      const sF = w * sgF, [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF), nu = sgF * Su;
      // oben am Ende nur bis zur hinteren Kante der Oberseite: die Grasnarbe steht 0,4 über der Kante (sonst unter der Oberseite) und
      // schaute dort als hellgrüner Zipfel über die Wand dahinter (Stirn des Einschnitts, Anhöhe)
      const c = W(0.5, sF), q = W(0.5, -sF), f = W(-0.5, sF), dx = q[0] - c[0], dy = q[1] - c[1], side = Math.sign(dx * (f[1] - c[1]) - dy * (f[0] - c[0]));
      g.save();
      try {
        g.beginPath(); g.moveTo(c[0] + dx * 50, c[1] + dy * 50); g.lineTo(c[0] - dx * 50, c[1] - dy * 50);
        g.lineTo(c[0] - dx * 50 - side * dy * 50, c[1] - dy * 50 + side * dx * 50); g.lineTo(c[0] + dx * 50 - side * dy * 50, c[1] + dy * 50 + side * dx * 50); g.closePath(); g.clip();
        // Grasnarbe in der Farbe der Anhöhe (Stützmauer vor Fels: an der Ecke sonst zwei Grüntöne)
        const S0 = HILL_STY[kind];
        HILL_STY[kind] = { ...S0, lip: (HILL_STY[o.kind] || S0).lip };
        try { paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', kind, 0, h0, seed + 3, h1, true, 1, prev ? E : 0, 0, H); } finally { HILL_STY[kind] = S0; }
      } finally { g.restore(); }
    }
  }

  // --- Viadukt: schmaler als das Feld (±VW), Wand mit Bögen, Brüstung beidseits, Gleis obenauf ---
  // Bögen: zwei je Feld (Pfeiler an Feldgrenze und Feldmitte), Scheitel 4,5 unter der Fahrbahn an ihrem unteren Ende; zu niedrig: voll
  function arches(G) {
    const out = [], r = 0.17;
    for (let c = 0.25; c < G.len; c += 0.5) {
      const hc = HILL_H * (c - r) / G.len - 4.5;
      if (hc < 7) continue;
      const rv = Math.min(6, hc - 1.5);
      out.push({ c, r, hc, hs: hc - rv });
    }
    return out;
  }
  function paintViadukt(P, o, x, y, R, K) {
    const { UV, hd, W, ds, sgF, prev, lk } = K, G = R.G, i0 = o.i;      // gd = i0 + d + 0.5: Lage längs der ganzen Rampe
    const sF = sgF * VW, sB = -sgF * VW, Su = -STAIR_UP[o.rot & 3][1];
    const faceU = sgF * Su > 0, side = faceU ? STONE.u : STONE.v;
    const Wh = (d, s, h) => P(...UV(d, s), h);
    const trace = pts => pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
    const strip = (s0, s1, up) => [...ds.map(d => W(d, s0, up)), ...ds.slice().reverse().map(d => W(d, s1, up))];
    // hintere Brüstung: Innenseite und Oberseite
    const sBi = sB + sgF * PW;
    poly([...ds.map(d => W(d, sBi, 0)), ...ds.slice().reverse().map(d => W(d, sBi, PH))], C(shade(STONE.v, -0.08)));
    poly(strip(sB, sBi, PH), C(STONE.top));
    // Fahrbahn und Gleis
    poly(strip(sBi, sF - sgF * PW, 0), C(STONE.deck));
    railStraight(W, ds[0], ds[3], lk);
    // vordere Wand mit Bögen (Bildpunkte: Höhe; d − 0,5 … 0,5 im Feld, vorn ein Stück unter das Feld davor)
    const e0 = prev ? E : 0, dA = -0.5 - e0, dB = 0.5 + E;              // hinten ein Hauch über das Feld dahinter: Fuge an der Grenze ganz
    const opens = arches(G).map(a => ({ ...a, d: a.c - i0 - 0.5 })).filter(a => a.d + a.r > -0.5 && a.d - a.r < 0.5);
    const archPts = (a, s) => {
      const out = [Wh(a.d - a.r, s, -1)];
      for (let k = 0; k <= 16; k++) { const t = Math.PI - k * Math.PI / 16; out.push(Wh(a.d + Math.cos(t) * a.r, s, a.hs + Math.sin(t) * (a.hc - a.hs))); }
      out.push(Wh(a.d + a.r, s, -1));
      return out;
    };
    const wallPts = s => { const dd = [dA, ...[-0.5, 0.5].filter(d => d > dA && d < dB), dB]; return [...dd.map(d => Wh(d, s, 0)), ...dd.slice().reverse().map(d => W(d, s, 0))]; };
    const inner = shade(side, -0.4), pier = shade(side, -0.16);
    for (const a of opens) {                                             // durch die Öffnung: Rückwand (mit ihrer Öffnung) und Laibung
      const F = archPts(a, sF), B = archPts(a, sB);
      g.save();
      try {
        g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip();
        g.beginPath(); trace(F); g.closePath(); g.clip();
        g.beginPath(); trace(wallPts(sB)); g.closePath(); trace(B); g.closePath();
        g.fillStyle = C(inner); g.fill('evenodd');
        // Laibung: nur die Flächen, die zum Betrachter zeigen – Normale nach innen (Δh, −Δd) gegen die Blickrichtung (1, 1, 32/39,2 je
        // Feld; 39,2 Bildpunkte Höhe = 1 Feld). Von oben sieht man nie ins Gewölbe, nur die Laibung des hinteren Pfeilers
        const pts = [[a.d - a.r, -1], ...Array.from({ length: 17 }, (_, k) => { const t = Math.PI - k * Math.PI / 16; return [a.d + Math.cos(t) * a.r, a.hs + Math.sin(t) * (a.hc - a.hs)]; }), [a.d + a.r, -1]];
        for (let k = 0; k < F.length - 1; k++) {
          const dd = pts[k + 1][0] - pts[k][0], dh = (pts[k + 1][1] - pts[k][1]) / 39.2;
          if (dh * (STAIR_UP[o.rot & 3][0] + STAIR_UP[o.rot & 3][1]) - 0.816 * dd > 1e-6) poly([F[k], F[k + 1], B[k + 1], B[k]], C(pier));
        }
      } finally { g.restore(); }
    }
    g.save();
    try {
      g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip();
      g.beginPath(); g.rect(-1e4, -1e4, 2e4, 2e4); for (const a of opens) { trace(archPts(a, sF)); g.closePath(); } g.clip('evenodd');
      poly(wallPts(sF), C(side));
      // Mauerwerk in festen Steinen (wie archWall), längs der ganzen Rampe ausgerichtet: über Feldgrenzen bündig
      const RH = 4.2, BL = 0.3;
      g.strokeStyle = C(shade(side, -0.2)); g.lineWidth = 0.6; g.lineCap = 'butt'; g.beginPath();
      for (let k = 0, h = -1; h < HILL_H + 2; k++, h += RH) {
        const p0 = Wh(dA, sF, h), p1 = Wh(dB, sF, h); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
        const sh = (k & 1) * BL / 2, g0 = i0 + dA + 0.5;
        // Stoßfugen bis einschließlich der Feldgrenze dahinter (dieses Feld liegt darüber – sonst nur eine halbe Fuge)
        for (let s = Math.ceil((g0 - sh) / BL) * BL + sh; s < i0 + 1 + 1e-6; s += BL) { const d = s - i0 - 0.5, q0 = Wh(d, sF, h), q1 = Wh(d, sF, h + RH); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); }
      }
      g.stroke();
    } finally { g.restore(); }
    g.strokeStyle = C(shade(side, 0.14)); g.lineWidth = 0.8; g.lineCap = 'butt';   // heller Bogenrand
    for (const a of opens) { g.save(); try { g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip(); g.beginPath(); trace(archPts(a, sF).slice(1, -1)); g.stroke(); } finally { g.restore(); } }
    // vordere Brüstung: Außenseite (in der Ebene der Wand, etwas heller) und Oberseite; am Fuß die Stirn. Außen reicht sie als Gesims 1,6
    // unter die Fahrbahn – dort liefen die waagerechten Fugen sonst flach in die schräge Oberkante (lange dünne Keile)
    const sFi = sF - sgF * PW, gs = d => -Math.min(1.6, hd(d)), dk = -0.5 + (1.6 - K.h0) / (K.h1 - K.h0), dg = [ds[0], ds[1], ...(dk > -0.5 && dk < 0.5 ? [dk] : []), ...ds.slice(2)];   // am Fuß nie unter den Boden
    poly([...dg.map(d => W(d, sF, gs(d))), ...ds.slice().reverse().map(d => W(d, sF, PH))], C(shade(side, 0.06)));
    g.strokeStyle = C(shade(side, -0.12)); g.lineWidth = 0.5; g.lineCap = 'butt'; g.beginPath();
    dg.forEach((d, i) => { const p = W(d, sF, gs(d)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
    poly(strip(sFi, sF, PH), C(STONE.top));
    if (!prev) for (const s0 of [sBi, sF]) { const s1 = s0 === sF ? sFi : sB; poly([W(-0.5, s0, 0), W(-0.5, s1, 0), W(-0.5, s1, PH), W(-0.5, s0, PH)], C(shade(STONE.v, -0.04))); }
  }
  // Was vor dem Zug liegt, über ihm noch einmal (aus dem Bildchen, wie drawHillRampOver): beim Viadukt die vordere Brüstung, im schmalen
  // Einschnitt der vordere Streifen Anhöhe (sein ganzer Block – was darin sonst steht, deckt danach die Anhöhe daneben)
  function frontOver(G, a0, a1, zz, lift) {
    const [Du, Dv] = STAIR_UP[G.rot], Su = -Dv, Sv = Du, sgF = Su + Sv > 0 ? 1 : -1;
    G.F.forEach(([fx, fy], i) => {
      if (i + 1 < a0 || i > a1) return;
      const e = hillSprites.get('r' + fx + ',' + fy);
      if (!e) return;
      const c = toScreen(fx, fy), h0 = HILL_H * i / G.len, h1 = HILL_H * (i + 1) / G.len;
      const Wp = (d, s, h) => { const u = Du * d + Su * s, v = Dv * d + Sv * s; return [c.x + (u - v) * TW / 2 * zz, c.y + (u + v) * TH / 2 * zz - h * zz]; };
      let pts;
      if (G.body === 'viadukt') { const sF = sgF * VW, sFi = sF - sgF * PW; pts = [[-0.5, h0], [0.5, h1]].flatMap(([d, h]) => [Wp(d, sF, h - 0.5), Wp(d, sF, h + PH + 0.6), Wp(d, sFi, h + PH + 0.6), Wp(d, sFi, h)]); }
      else if (G.narrow && cutAt(G, i)) pts = [-0.5, 0.5].flatMap(d => [DW, 0.5].flatMap(s => [Wp(d, s * sgF, 0), Wp(d, s * sgF, HILL_H)]));
      else return;
      pts = hull(pts);
      g.save();
      try {
        g.translate(0, lift);
        g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        const B = HILL_BOX; g.drawImage(e.c, c.x + B.left * zz, c.y + B.top * zz, B.w * zz, B.h * zz);
      } finally { g.restore(); }
    });
  }

  // --- Schatten am Boden (statt drawHillShadows): Anhöhen wie im Spiel, Rampenfelder mit ihrer Höhe (Viadukt schmal) ---
  function shadows(want) {
    if (!state.hills || !state.hills.size) return;
    g.beginPath();
    const ring = c => { let area = 0; for (let n = 0; n < c.length; n++) { const a = c[n], b = c[(n + 1) % c.length]; area += a[0] * b[1] - b[0] * a[1]; } if (area < 0) c = c.reverse(); c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
    for (const [k, h] of state.hills) {
      const [x, y] = keyXY(k);
      if (!want([x, y])) continue;
      const Hh = (h.h || 1) * HILL_H, dx = SUN.dx * Hh, dy = SUN.dy * Hh;
      const c = [[x - 0.5, y - 0.5], [x + 0.5, y - 0.5], [x + 0.5, y + 0.5], [x - 0.5, y + 0.5]].map(([u, v]) => { const p = iso(u, v); return [p.x + dx, p.y + dy]; });
      c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    }
    for (const [k, { G, i }] of RF) {
      const [x, y] = keyXY(k);
      if (!want([x, y])) continue;
      const h0 = HILL_H * i / G.len, h1 = HILL_H * (i + 1) / G.len, w = G.body === 'viadukt' ? VW : G.narrow && !cutAt(G, i) ? DW : 0.5, Su = -G.Dv, Sv = G.Du;
      const P = (u, v, up) => { const p = iso(x + u, y + v); return [p.x + SUN.dx * up, p.y + SUN.dy * up]; };
      const pts = [[-0.5, -w], [0.5, -w], [0.5, w], [-0.5, w]].flatMap(([d, s]) => { const u = G.Du * d + Su * s, v = G.Dv * d + Sv * s, h = d > 0 ? h1 : h0; return h > 0 ? [P(u, v, 0), P(u, v, h)] : [P(u, v, 0)]; });
      ring(hull(pts));
    }
    g.fillStyle = 'rgba(30,42,62,0.22)'; g.fill('nonzero');
  }

  // --- Patches nur fürs Bild ---
  const ORIG_FN = {};
  function patched(fn) {
    Object.assign(ORIG_FN, { rampAt, rampFresh, paintRamp, paintHill, drawHillShadows, bAt, trainCars, trainTunnelCut, drawTrainCar, rampSink, hillStairEnds });
    const o = ORIG_FN;
    window.rampAt = (x, y) => {
      const R = RF.get(x + ',' + y);
      if (!R) return o.rampAt(x, y);
      const G = R.G;
      return { k: G.k, t: state.tiles.get(x + ',' + y), ax: G.ax, ay: G.ay, len: G.len, rot: G.rot, i: R.i };
    };
    let fresh = null;
    window.rampFresh = () => {
      if (fresh && fresh.gv === groundVersion) return fresh;
      const list = GROUPS.filter(G => { const [tx, ty] = G.F[G.len - 1]; return hillLevel(tx + G.Du, ty + G.Dv) === hillLevel(tx, ty) + 1; })
        .map(G => ({ k: G.k, ax: G.ax, ay: G.ay, len: G.len, rot: G.rot, dx: G.Du, dy: G.Dv, foot: G.F[0], top: G.F[G.len - 1] }));
      return (fresh = { gv: groundVersion, list, n: GROUPS.length, f: RF.size, s: 0 });
    };
    window.paintRamp = paintGleis;
    window.drawHillShadows = shadows;
    window.bAt = (x, y) => RF.has(x + ',' + y) ? 'schiene' : o.bAt(x, y);
    // Schmal (Damm, Viadukt): die Wand der Anhöhe hinter dem oberen Feld behält ihre Grasnarbe (die Rampe deckt sie nicht ganz). Schmaler
    // Einschnitt: daneben steht ein Streifen Anhöhe gleich hoch – keine dunkle Kante oben zu ihm hin (U/V wie neben einer Treppe)
    window.hillStairEnds = (x, y) => {
      let s = o.hillStairEnds(x, y);
      for (const [c, dx, dy] of [['v', 0, 1], ['u', 1, 0], ['U', -1, 0], ['V', 0, -1]]) {
        const R = RF.get((x + dx) + ',' + (y + dy));
        if (R && R.i === R.G.len - 1 && (R.G.body === 'viadukt' || (R.G.narrow && !cutAt(R.G, R.i)))) s = s.replace(c, '');
      }
      for (const [c, dx, dy, ax] of [['U', -1, 0, 'Du'], ['V', 0, -1, 'Dv']]) {
        const R = RF.get((x + dx) + ',' + (y + dy));
        if (R && R.G.narrow && R.G[ax] === 0 && cutAt(R.G, R.i) && !s.includes(c)) s += c;
      }
      return s;
    };
    window.paintHill = (x, y, h) => {
      o.paintHill(x, y, h);
      const k = x + ',' + y, t = state.tiles.get(k);
      if (!TOP.has(k) || !t) return;
      // Gleis oben: wie am Boden (drawRailBed), angehoben; auf die Raute zugeschnitten, ringsum 0,0075 darüber (keine Fuge zum Nachbarn)
      const top = (h.h || 1) * HILL_H, P = (u, v) => [(u - v) * TW / 2, (u + v) * TH / 2 - top];
      g.save();
      try {
        g.beginPath(); [P(-0.5 - E, -0.5 - E), P(0.5 + E, -0.5 - E), P(0.5 + E, 0.5 + E), P(-0.5 - E, 0.5 + E)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        drawRailBed(0, -top, 1, x, y, t);
      } finally { g.restore(); }
    };
    // Züge: Wagen längs der Rampe, ins vorderste Feld unter ihnen einsortiert, jede Ecke auf der Höhe des Gleises
    window.trainCars = () => base && !window.gleisrampeOhneZug ? base.cars : [];   // gleisrampeOhneZug = true: Nahaufnahmen ohne Zug
    window.trainTunnelCut = m => {
      if (!m.gr) return o.trainTunnelCut(m);
      const G = m.G, la = m.len / 2;
      const keys = [-la, 0, la].map(a => [Math.round(m.px + G.Du * a), Math.round(m.py + G.Dv * a)]).sort((p, q) => (q[0] + q[1]) - (p[0] + p[1]) || q[0] - p[0]);
      const [bx, by] = keys[0];
      return { k: bx + ',' + by, cut: null, portal: { ramp: true, gr: true, G, base: hillLift(bx, by) } };
    };
    window.rampSink = (Pp, wx, wy) => Pp && Pp.gr ? -(surfH(Pp.G, wx, wy) - Pp.base) : o.rampSink(Pp, wx, wy);
    window.drawTrainCar = (car, zz, now) => {
      if (!(car.portal && car.portal.gr)) return o.drawTrainCar(car, zz, now);
      // Schatten: die Grundfläche auf dem Gleis (statt der Ellipse – sie hinge über die Kante von Damm und Viadukt)
      const la = car.len / 2 + 0.05, wb = 0.2, b0 = car.portal.base;
      poly([[-la, -wb], [la, -wb], [la, wb], [-la, wb]].map(([a, b]) => { const wx = car.px + car.du * a - car.dv * b, wy = car.py + car.dv * a + car.du * b, p = toScreen(wx, wy); return [p.x, p.y + 1 * zz - (surfH(car.G, wx, wy) - b0) * zz]; }), 'rgba(40,50,70,0.2)');
      car.cut = [-car.len / 2, car.len / 2];                            // ganz zu sehen, aber ohne die Ellipse
      drawTrainCarBody(car, zz, now);
      const G = car.G, a = along(G, car.px, car.py);
      frontOver(G, a - car.len / 2, a + car.len / 2, zz, car.portal.base * zz);
    };
    const clear = () => { for (const e of hillSprites.values()) freeCanvas(e.c); hillSprites.clear(); };
    const me0 = state.me;                                                // die eigene Figur (Bürgermeister·in) nicht im Bild
    state.me = { ...(me0 || {}), off: true }; bubble = null;
    clear();
    groundVersion++;                                                     // Boden-Bild neu – mit den Schienen, die an die Rampe anschließen
    try { return fn(); } finally { Object.assign(window, o); state.me = me0; groundVersion++; clear(); }
  }

  // --- Welt aufbauen: vier Szenen im Raster 2 × 2, fest auf der Insel von ?welt=neu ---
  function setup() {
    for (const [ox, oy] of ORIG) for (let y = oy - 8; y <= oy + 14; y++) for (let x = ox - 10; x <= ox + 13; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'wiese'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    for (const k of [...state.edges.keys()]) state.edges.delete(k);
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6;
    GROUPS.length = 0; RF.clear(); TOP.clear();
    const of = window.fail, errs = [];
    window.fail = m => errs.push(m);
    const cars = [], spots = [];
    try {
      VARS.forEach((v, n) => {
        const [ox, oy] = ORIG[n];
        const hills = (x0, x1, y0, y1, w, skip = () => false) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!skip(x, y)) state.hills.set((ox + x) + ',' + (oy + y), { w }); };
        const rail = (list, top) => { for (const [x, y] of list) { const k = (ox + x) + ',' + (oy + y); state.tiles.set(k, { b: 'schiene', lvl: 1 }); if (top) TOP.add(k); } };
        const tree = (x, y, slot = CSLOT) => buildSmall('baum', ox + x, oy + y, slot);
        let G;
        if (n === 0) {                                                   // A: 2 Felder in die Anhöhe eingelassen (Wangen links und rechts)
          hills(0, 4, -2, 3, 0, (x, y) => x === 2 && y >= 2);
          G = group(n, ox + 2, oy + 3, 0, 2, 'damm');
          rail([[2, 4], [2, 5], [2, 6], [1, 6], [0, 6], [-1, 6], [-2, 6]]);
          rail([[2, 1], [2, 0], [2, -1], [3, -1], [4, -1]], true);
          tree(0, -1); tree(4, 1); tree(0, 2); tree(4, 6);
          spots.push({ c: [ox + 2.4, oy + 2.5], up: 10 });
        } else if (n === 1) {                                            // B: 3 Felder als Damm vor der Wand (Stützmauer)
          hills(0, 4, -3, 1, 0);
          G = group(n, ox + 2, oy + 4, 0, 3, 'damm', 'mauer'); G.narrow = true;
          rail([[2, 5], [2, 6], [2, 7], [1, 7], [0, 7], [-1, 7], [-2, 7]]);
          rail([[2, 1], [2, 0], [2, -1], [3, -1], [4, -1]], true);
          tree(0, -2); tree(4, 0); tree(0, 1); tree(4, 5);
          spots.push({ c: [ox + 2.4, oy + 2.9], up: 8 });
        } else if (n === 2) {                                            // C: 4 Felder, oben 2 eingelassen, unten 2 als Damm (Erdwand)
          hills(0, 4, -3, 3, 1, (x, y) => x === 2 && y >= 2);
          G = group(n, ox + 2, oy + 5, 0, 4, 'damm'); G.narrow = true;
          rail([[2, 6], [2, 7], [2, 8], [1, 8], [0, 8], [-1, 8], [-2, 8]]);
          rail([[2, 1], [2, 0], [2, -1], [3, -1], [4, -1]], true);
          tree(0, -2); tree(4, 1); tree(0, 2); tree(4, 7);
          spots.push({ c: [ox + 2.4, oy + 3.4], up: 8 });
        } else {                                                         // D: 4 Felder Viadukt vor der Wand, hinauf nach links hinten
          hills(-4, 1, -3, 2, 0);
          G = group(n, ox + 5, oy, 3, 4, 'viadukt');
          rail([[6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4]]);
          rail([[1, 0], [0, 0], [-1, 0], [-1, -1], [-1, -2]], true);
          tree(-3, 1); tree(1, -2); tree(-3, -2); tree(6, 2);
          spots.push({ c: [ox + 3.4, oy + 0.6], up: 8 });
        }
        // Zug: Regionalbahn (2 Wagen, wie im Spiel) bergauf, Mitte auf halber Rampe
        const TR = { kind: { ...TRAIN_KIND.regio, n: 2 }, model: 'regio', col: 0, powered: true }, mid = G.len / 2, step = TR.kind.len + TR.kind.gap;
        for (let i = 0; i < 2; i++) {
          const a = mid + (0.5 - i) * step, px = G.fx + G.Du * (a - 0.5), py = G.fy + G.Dv * (a - 0.5);
          cars.push({ gr: true, G, train: TR, px, py, du: G.Du, dv: G.Dv, i, n: 2, len: TR.kind.len });
        }
      });
    } finally { window.fail = of; }
    recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
    base = { spots, cars };
    return errs;
  }

  function shot(n, cxW, cyW, zz, Cs, now, up = 0) {
    z = zz;
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y - up; cam.z = z;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; meFigs.length = 0;
    spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const comp = document.createElement('canvas'); comp.width = Cs; comp.height = Cs;
    const c2 = comp.getContext('2d'); c2.fillStyle = '#fffaf0'; c2.fillRect(0, 0, Cs, Cs);
    if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    c2.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return comp;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };

  window.gleisrampeSetup = setup;
  window.gleisrampeBild = async (name = 'gleisrampe-varianten.png', zz = 1.7, Cs = 1100, zi = 1.5, Ci = 530) => {
    const errs = setup(), rowY = 2 * (Cs + 60) + 50;
    const sheet = document.createElement('canvas'); sheet.width = Cs * 2 + 30; sheet.height = rowY + Ci + 70;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    patched(() => {
      for (let n = 0; n < 4; n++) {
        const s = base.spots[n], comp = shot(n, s.c[0], s.c[1], zz, Cs, performance.now(), s.up);
        const X = (n % 2) * (Cs + 30), Y = Math.floor(n / 2) * (Cs + 60) + 55;
        sx.drawImage(comp, X, Y);
        // Steigung: eine Ebene (HILL_H Bildpunkte) über len Felder; 1 Feld = 39,2 Bildpunkte Höhe (Blick wie im Spiel: 2:1, 30° von oben)
        const G = GROUPS[n], gr = HILL_H / 39.2 / G.len;
        sx.font = '800 34px Nunito, system-ui'; sx.fillStyle = '#6b4f3a';
        sx.fillText(`${VARS[n][0]}  ${VARS[n][1]} · Steigung ≈ ${Math.round(gr * 100)} % (${Math.round(Math.atan(gr) * 180 / Math.PI)}°)`, X + 10, Y - 14);
        // unten in einer Reihe: die Rampe ohne Zug (ihre Form), Mitte auf halber Länge und halber Höhe
        const mid = G.len / 2 - 0.5, gap = (sheet.width - 4 * Ci) / 5, ix = gap + n * (Ci + gap);
        window.gleisrampeOhneZug = true;
        let ins;
        try { ins = shot(n, G.fx + G.Du * mid, G.fy + G.Dv * mid, zi, Ci, performance.now(), HILL_H / 2); } finally { window.gleisrampeOhneZug = false; }
        sx.drawImage(ins, ix, rowY + 50);
        sx.font = '800 28px Nunito, system-ui'; sx.fillText(`${VARS[n][0]} ohne Zug`, ix + 4, rowY + 36);
      }
    });
    return [await post(name, sheet), errs];
  };
  // mehrere Nahaufnahmen als ein Bogen: list = [[n, u, v, höhe, Beschriftung], …] (u, v relativ zum Ursprung der Variante)
  window.gleisrampeNah = async (list, name, zz = 6, Cs = 700, cols = 3) => {
    if (!base) setup();
    const rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas');
    sheet.width = cols * (Cs + 20); sheet.height = rows * (Cs + 60);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    patched(() => list.forEach(([n, u, v, up, label], i) => {
      const [ox, oy] = ORIG[n], comp = shot(n, ox + u, oy + v, zz, Cs, performance.now(), up);
      const X = (i % cols) * (Cs + 20), Y = Math.floor(i / cols) * (Cs + 60) + 45;
      sx.drawImage(comp, X, Y);
      sx.font = '800 28px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(label, X + 8, Y - 12);
    }));
    return post(name, sheet);
  };
  return 'ok';
})();
