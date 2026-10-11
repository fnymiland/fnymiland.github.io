// Entwurf 3 (Besprechung 11.10.2026: „Rakotz war ein geiler Take – so will ich das“; „Holz braucht mehr Pfeiler – einstellbar, auf den
// Kachelkanten, damit Wege darunter bleiben“). Wie Entwurf 2, Stein jetzt dunkler Basalt, unregelmäßig, steiler Bogen, Basaltsäulen an den
// Enden; Holz/Rot mit Stützen auf den Kanten zwischen den Feldern der Lücke (keine / wenige / alle). Bisher:
// nur Bild, kein Spielcode geändert. Fußgänger-Bogen zwischen zwei Anhöhen, halb so hoch wie übers Wasser, über das fertige Spielbild gemalt:
// Stein als dünner Bogen (liegt an den Kanten auf, der Bogen setzt unten an der Wand der Anhöhe an), Holz und Rot mit Bogenträger unter dem Belag,
// bis 3 Felder ohne Stützen, bei 4 ein Paar in der Mitte; 1 Feld: kleiner Buckel. Unten quer ein Weg (Platz darunter).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bogen-anhoehe-entwurf3.js')).text()); await bogenEntwurf3()   → tools/vorschau/bogen-anhoehe-3.png
(function bogenAnhoeheEntwurf3() {
  const H = HILL_H, W = 0.3;
  const LOOK = {
    holz: { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238', rib: '#7a5a3d' },
    rot: { side: '#a8392f', deck: '#c79a6a', plank: '#9a7048', rail: '#d9483b', rib: '#a8392f' },
    stein: { face: '#5d5852', joint: '#36322e', deck: '#77716a', top: '#6b665f', soff: '#3e3a36', col: '#4a4641' },
  };
  // Brücken: [Zeile y, Anhöhe A bis xa1, Anhöhe B ab xb0, Art]
  const BR = [];
  const mock = new Set();
  function setup() {
    for (let y = 2; y <= 26; y++) for (let x = 4; x <= 54; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear(); BR.length = 0;
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    const weg = (x, y, st) => state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: st, lauf: 0 });
    let hy = [0, 0];                                                       // Zeilen der Anhöhe B (Ausschnitt)
    const row = (y, xa0, xa1, xb0, xb1, art, edges = []) => {
      const st = art === 'stein' ? 'platten' : 'sand';
      for (let x = xa0; x <= xa1; x++) weg(x, y, st);
      for (let x = xb0; x <= xb1; x++) weg(x, y, st);
      for (let x = xa1 + 1; x < xb0; x++) mock.add(x + ',' + y);
      BR.push({ y, U0: xa1 + 0.5, U1: xb0 - 0.5, art, st, B: [xb0, xb1, ...hy], edges });
    };
    hill(10, 5, 13, 16); hill(17, 5, 20, 16); hy = [5, 16];                  // Lücke 3
    row(6, 10, 13, 17, 20, 'stein'); row(9, 10, 13, 17, 20, 'holz'); row(12, 10, 13, 17, 20, 'holz', [1, 2]); row(15, 10, 13, 17, 20, 'rot', [1, 2]);
    hill(26, 5, 29, 10); hill(31, 5, 34, 10); hy = [5, 10];                  // Lücke 1
    row(6, 26, 29, 31, 34, 'stein'); row(9, 26, 29, 31, 34, 'holz');
    hill(26, 13, 29, 22); hill(34, 13, 37, 22); hy = [13, 22];               // Lücke 4
    row(14, 26, 29, 34, 37, 'holz', [2]); row(17, 26, 29, 34, 37, 'holz', [1, 3]); row(20, 26, 29, 34, 37, 'holz', [1, 2, 3]);
    hill(40, 5, 43, 13); hill(46, 5, 49, 13); hy = [5, 13];                  // Lücke 2
    row(6, 40, 43, 46, 49, 'stein'); row(9, 40, 43, 46, 49, 'holz', [1]); row(12, 40, 43, 46, 49, 'stein');
    for (let y = 3; y <= 18; y++) weg(15, y, 'sand');                         // unten quer durch die Lücke
    for (let y = 11; y <= 24; y++) { weg(31, y, 'sand'); weg(32, y, 'kopf'); }
    state.terra.set('44,12', 'water'); state.terra.set('45,12', 'water'); for (let y = 3; y <= 16; y++) if (y !== 12) weg(44, y, 'sand');
    groundVersion++; recalc();
    hill(4, 20, 5, 22); hill(8, 20, 9, 22);                                  // eine echte Brücke weit weg: bkOn() gilt (Arme über die Kante)
    groundVersion++; recalc();
    setTool('bruecke'); startPlan('line', { x: 5, y: 21 }, { x: 8, y: 21 }, false); runPlan();
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  // --- Zeichnen über das Spielbild ---
  let dpr = 1, X = null;
  const peakOf = N => N >= 2 ? 0.5 * 20.4 * Math.pow(Math.min(N, 16) / 2, 0.6) : 5;
  const rakPeak = N => N >= 2 ? 8 + 5 * N : 7;                               // Basalt: steiler (Rakotz)
  const rnd = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  function bridge(b) {
    const { y, U0, U1, art } = b, N = U1 - U0, pk = art === 'stein' ? rakPeak(N) : peakOf(N), M = 32;
    const S = (u, v, h) => { const p = toScreen(u, y + v); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
    const dk = u => H + pk * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - U0) / N)));
    const us = Array.from({ length: M + 1 }, (_, i) => U0 + N * i / M);
    const lw = w => w * cam.z * dpr * 0.5;
    const poly = (pts, fill, stroke, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); if (fill) { X.fillStyle = fill; X.fill(); } if (stroke) { X.strokeStyle = stroke; X.lineWidth = lw(w || 1); X.stroke(); } };
    const path = (pts, col, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.strokeStyle = col; X.lineWidth = lw(w); X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); };
    // Anhöhe B liegt vor dem Ende des Bogens (ihre Oberseite und Wand vorn decken, was unter der Kante ansetzt): ausschneiden
    { const [bx0, bx1, by0, by1] = b.B, Q = (u, w, h) => { const p = toScreen(u, w); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
      for (const f of [[Q(bx0 - 0.5, by0 - 0.5, H), Q(bx1 + 0.5, by0 - 0.5, H), Q(bx1 + 0.5, by1 + 0.5, H), Q(bx0 - 0.5, by1 + 0.5, H)],
                       [Q(bx0 - 0.5, by1 + 0.5, H), Q(bx1 + 0.5, by1 + 0.5, H), Q(bx1 + 0.5, by1 + 0.5, 0), Q(bx0 - 0.5, by1 + 0.5, 0)]]) {
        X.beginPath(); X.rect(-1e5, -1e5, 3e5, 3e5); f.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); X.clip('evenodd');
      } }
    const band = (v, f0, f1, col, stroke) => poly([...us.map(u => S(u, v, f0(u))), ...[...us].reverse().map(u => S(u, v, f1(u)))], col, stroke, 0.6);
    // Schatten auf dem Boden (Sonne wie im Spiel)
    const sh = (u, v) => { const p = S(u, v, 0); return [p[0] + SUN.dx * dk(u) * cam.z * dpr, p[1] + SUN.dy * dk(u) * cam.z * dpr]; };
    poly([...us.map(u => sh(u, -W)), ...[...us].reverse().map(u => sh(u, W))], 'rgba(40,60,30,0.16)');
    if (art === 'stein') {                                                // Basalt wie die Rakotzbrücke: fast halbrunde Leibung, unregelmäßige Steine
      const L = LOOK.stein, t01 = u => Math.max(0, Math.min(1, (u - U0) / N));
      const ri = u => H - 16 + (pk + 16 - 3.5) * Math.sqrt(Math.max(0, Math.sin(Math.PI * t01(u))));   // Leibung: setzt tief an der Wand an, rund
      band(-W, u => dk(u), u => dk(u) + 2.5, C(shade(L.top, -0.15)));                                // hintere Brüstung (Innenseite)
      poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag: Bruchstein
      for (let k = 0; k < 7 * N; k++) { const u0 = U0 + (k + rnd(k, y) * 0.4) / 7, u1 = Math.min(U1, u0 + 0.08); const v = (rnd(k, y + 1) - 0.5) * 0.4;
        path([S(u0, v - 0.08, dk(u0)), S(u1, v + 0.06, dk(u1))], 'rgba(30,28,25,0.35)', 0.6); }
      band(W, ri, dk, C(L.face));                                                                     // Stirn
      { // unregelmäßige Steine: Lagen längs des Bogens, Fugen versetzt
        X.save(); X.beginPath(); [...us.map(u => S(u, W, ri(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))].forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); X.clip();
        const layers = 3;
        for (let l = 1; l < layers; l++) path(us.map(u => S(u, W, ri(u) + (dk(u) - ri(u)) * (l / layers + (rnd(Math.round(u * 8), l) - 0.5) * 0.12))), C(L.joint), 0.7);
        for (let l = 0; l < layers; l++) for (let u = U0 + rnd(l, y) * 0.2; u < U1; u += 0.16 + rnd(u * 10, l) * 0.16) {
          const f0 = l / layers, f1 = (l + 1) / layers, h = (f, uu) => ri(uu) + (dk(uu) - ri(uu)) * f;
          path([S(u, W, h(f0, u)), S(u + 0.02, W, h(f1, u + 0.02))], C(L.joint), 0.7);
        }
        X.restore();
      }
      path(us.map(u => S(u, W, ri(u))), C(L.joint), 1.1);                                             // Bogenkante
      band(W, u => dk(u), u => dk(u) + 2.5, C(L.top), C(L.joint));                                    // vordere Brüstung, niedrig
      for (const [u0, sg] of [[U0, 1], [U1, -1]]) for (const v of [-W + 0.04, W - 0.04]) {            // Basaltsäulen an den Enden
        const n = 4;
        for (let k = 0; k < n; k++) { const u = u0 + sg * (0.04 + k * 0.05), hh = 5 + rnd(k + u0, v) * 7 + (k === 1 ? 3 : 0), d = 0.022;
          const base = dk(u), p = [S(u - d, v, base), S(u + d, v, base), S(u + d, v, base + hh), S(u, v, base + hh + 1.2), S(u - d, v, base + hh)];
          poly(p, C(k % 2 ? L.col : shade(L.col, 0.12)), C(L.joint), 0.5); }
      }
      return;
    }
    const L = LOOK[art];
    const rib = u => dk(u) - 7 + 3 * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - U0) / N)));   // Bogenträger unter dem Belag
    const posts = (b.edges || []).map(k => U0 + k);                        // Stützen auf den Kanten zwischen den Feldern der Lücke
    const post = (u, v) => { poly([S(u - 0.035, v, 0), S(u + 0.035, v, 0), S(u + 0.035, v, rib(u) - 1), S(u - 0.035, v, rib(u) - 1)], C(L.side));
      path([S(u, v, 1), S(u, v + (v < 0 ? 0.001 : 0), 1)], C(L.side), 1); };
    for (const u of posts) post(u, -W + 0.06);                                                       // Stütze hinten
    for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(L.rail), 1); }   // hinteres Geländer
    path(us.map(u => S(u, -W, dk(u) + 6)), C(L.rail), 1.3);
    for (const u of posts) { path([S(u, -W + 0.06, 3), S(u, W - 0.06, rib(u) - 4)], C(shade(L.side, -0.1)), 0.9); path([S(u, W - 0.06, 3), S(u, -W + 0.06, rib(u) - 4)], C(shade(L.side, -0.1)), 0.9); }   // Kreuz zwischen den Stützen
    for (const u of posts) post(u, W - 0.06);                                                        // Stütze vorn (unter dem Belag)
    poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag
    for (let k = 0; k <= 9 * N; k++) { const u = U0 + k / 9; path([S(u, -W, dk(u)), S(u, W, dk(u))], C(L.plank), 0.6); }   // Planken
    band(W, u => dk(u) - 2, dk, C(shade(L.side, 0.05)));                                              // Randbalken
    for (let k = 1; k < 2 * N; k++) { const u = U0 + k / 2; path([S(u, W, rib(u)), S(u, W, dk(u) - 2)], C(L.side), 1); }   // Hänger zwischen Träger und Belag
    band(W, u => rib(u) - 2.2, rib, C(L.rib));                                                         // Bogenträger
    for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, W, dk(u)), S(u, W, dk(u) + 6)], C(L.rail), 1.1); }   // vorderes Geländer
    path(us.map(u => S(u, W, dk(u) + 6)), C(L.rail), 1.5); path(us.map(u => S(u, W, dk(u) + 3)), C(L.rail), 0.9);
  }
  function shot(cx, cy, zz, Wd, Hd, up = H) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const o = { baf: bkArmFrom, off: GL.off };
    bkArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.baf(x, y, dx, dy);
    GL.off = true; resetDrawCaches(); groundVersion++;
    try { const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { bkArmFrom = o.baf; GL.off = o.off; }
    dpr = canvas.width / innerWidth;
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; X = c.getContext('2d');
    const ox = canvas.width / 2 - Wd / 2, oy = canvas.height / 2 - Hd / 2;
    X.fillStyle = '#fffaf0'; X.fillRect(0, 0, Wd, Hd); X.drawImage(canvas, ox, oy, Wd, Hd, 0, 0, Wd, Hd);
    X.translate(-ox, -oy); for (const b of [...BR].sort((a, b) => a.y - b.y)) { X.save(); try { bridge(b); } finally { X.restore(); } }
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.bogenEntwurf3 = async (name = 'bogen-anhoehe-3.png', Wd = 600, Hd = 600) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const list = [
      [15, 6, 2.6, 'Basalt (Rakotz), 3 Felder'], [14.3, 6, 4.4, 'Basalt nah: Säulen, Steine'], [45, 6, 2.6, 'Basalt, 2 Felder'],
      [30, 6, 3.2, 'Basalt, 1 Feld'], [45, 12, 2.6, 'Basalt übers Wasser (Vergleich)'], [15, 9, 2.6, 'Holz: keine Stützen'],
      [15, 12, 2.6, 'Holz: Stützen an jeder Kante (3 Felder)'], [15, 15, 2.6, 'Rot: Stützen an jeder Kante'], [45, 9, 2.6, 'Holz, 2 Felder: Mitte'],
      [31.5, 14, 2.2, 'Holz, 4 Felder: Mitte'], [31.5, 17, 2.2, 'Holz, 4 Felder: wenige (2)'], [31.5, 20, 2.2, 'Holz, 4 Felder: jede Kante (3)'],
    ];
    const cols = 3, rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Wd + 16); sheet.height = rows * (Hd + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      list.forEach(([x, y, z, l], i) => {
        const c = shot(x, y, z, Wd, Hd), Xs = (i % cols) * (Wd + 16), Ys = Math.floor(i / cols) * (Hd + 50) + 40;
        sx.drawImage(c, Xs, Ys); sx.font = '800 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, Xs + 6, Ys - 10);
      });
    } finally { nightAt = na; gameHour = gh; resetDrawCaches(); groundVersion++; }
    return post(name, sheet);
  };
  return 'ok';
})();
