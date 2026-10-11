// Entwurf 5 (Besprechung 11.10.2026: „Stein zurück zu Entwurf 2 und davon 10 Alternativen – fast gut, aber irgendwas stört; keine Stacheln“):
// zehn Abwandlungen des dünnen Steinbogens aus Entwurf 2, je eine Zeile. Bisher (Entwurf 2):
// nur Bild, kein Spielcode geändert. Fußgänger-Bogen zwischen zwei Anhöhen, halb so hoch wie übers Wasser, über das fertige Spielbild gemalt:
// Stein als dünner Bogen (liegt an den Kanten auf, der Bogen setzt unten an der Wand der Anhöhe an), Holz und Rot mit Bogenträger unter dem Belag,
// bis 3 Felder ohne Stützen, bei 4 ein Paar in der Mitte; 1 Feld: kleiner Buckel. Unten quer ein Weg (Platz darunter).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bogen-anhoehe-entwurf5.js')).text()); await bogenEntwurf5()   → tools/vorschau/bogen-anhoehe-5.png
(function bogenAnhoeheEntwurf5() {
  const H = HILL_H, W = 0.3;
  const LOOK = {
    holz: { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238', rib: '#7a5a3d' },
    rot: { side: '#a8392f', deck: '#c79a6a', plank: '#9a7048', rail: '#d9483b', rib: '#a8392f' },
    stein: { face: '#d9d2c3', joint: '#a99f8c', deck: '#e6dcc8', top: '#efe8da', soff: '#8f8676' },
  };
  // Brücken: [Zeile y, Anhöhe A bis xa1, Anhöhe B ab xb0, Art]
  const BR = [];
  // Abwandlungen: pk Höhe (× Entwurf 2), sp Ansatz unter der Kante, th Dicke am Scheitel, par Brüstung, ring Bogenkante, col Farben, deck Belag
  const VAR = [
    { name: '1 · Entwurf 2 (wie gehabt)' },
    { name: '2 · flacher (Höhe × 0,6)', pk: 0.6 },
    { name: '3 · höher (Höhe × 1,5)', pk: 1.5 },
    { name: '4 · dicker (Scheitel 7)', th: 7, sp: 12 },
    { name: '5 · Ansatz tiefer, Bogen runder', sp: 16, round: true },
    { name: '6 · ohne Brüstung, nur Kante', par: 'kante' },
    { name: '7 · Geländer aus Stein (Pfosten)', par: 'pfosten' },
    { name: '8 · Bogenring betont, glatte Wand', ring: true },
    { name: '9 · Sandstein, warm', col: { face: '#dcc49a', joint: '#b39a6e', deck: '#ead8b4', top: '#f1e3c4' } },
    { name: '10 · Belag wie der Weg, Gesims', deckWeg: true, gesims: true },
  ];
  const mock = new Set();
  function setup() {
    for (let y = 0; y <= 38; y++) for (let x = 4; x <= 30; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear(); BR.length = 0;
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    const weg = (x, y, st) => state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: st, lauf: 0 });
    let hy = [0, 0];                                                       // Zeilen der Anhöhe B (Ausschnitt)
    const row = (y, xa0, xa1, xb0, xb1, art, o = {}) => {
      const st = art === 'stein' ? 'platten' : 'sand';
      for (let x = xa0; x <= xa1; x++) weg(x, y, st);
      for (let x = xb0; x <= xb1; x++) weg(x, y, st);
      for (let x = xa1 + 1; x < xb0; x++) mock.add(x + ',' + y);
      BR.push({ y, U0: xa1 + 0.5, U1: xb0 - 0.5, art, st, B: [xb0, xb1, ...hy], o });
    };
    hill(10, 2, 13, 33); hill(17, 2, 20, 33); hy = [2, 33];                  // Lücke 3, zehn Zeilen
    VAR.forEach((o, k) => row(4 + 3 * k, 10, 13, 17, 20, 'stein', o));
    for (let y = 1; y <= 35; y++) weg(15, y, 'sand');                         // unten quer durch die Lücke
    groundVersion++; recalc();
    hill(24, 20, 25, 22); hill(28, 20, 29, 22);                              // eine echte Brücke weit weg: bkOn() gilt (Arme über die Kante)
    groundVersion++; recalc();
    setTool('bruecke'); startPlan('line', { x: 25, y: 21 }, { x: 28, y: 21 }, false); runPlan();
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  // --- Zeichnen über das Spielbild ---
  let dpr = 1, X = null;
  const peakOf = N => N >= 2 ? 0.5 * 20.4 * Math.pow(Math.min(N, 16) / 2, 0.6) : 5;
  function bridge(b) {
    const { y, U0, U1, art } = b, N = U1 - U0, pk = peakOf(N) * ((b.o && b.o.pk) || 1), M = 32;
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
    if (art === 'stein') {
      const o = b.o || {}, L = { ...LOOK.stein, ...(o.col || {}) }, t01 = u => Math.max(0, Math.min(1, (u - U0) / N));
      const sp = o.sp || 9, th = o.th || 4;
      const ri = u => H - sp + (pk + sp - th) * (o.round ? Math.sqrt(Math.max(0, Math.sin(Math.PI * t01(u)))) : Math.sin(Math.PI * t01(u)));
      const parH = o.par === 'kante' ? 1 : 3;
      if (o.par !== 'kante') band(-W, u => dk(u), u => dk(u) + parH, C(shade(L.top, -0.12)));          // hintere Brüstung (Innenseite)
      if (o.par === 'pfosten') { for (let k = 0; k <= 6 * N; k++) { const u = U0 + k / 6; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(shade(L.top, -0.18)), 1.6); } path(us.map(u => S(u, -W, dk(u) + 6)), C(shade(L.top, -0.12)), 2); }
      poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag
      if (o.deckWeg) {                                                      // Belag wie der Weg (Platten), schmaler Rand
        const lk = pathLook('platten');
        poly([...us.map(u => S(u, -W + 0.05, dk(u))), ...[...us].reverse().map(u => S(u, W - 0.05, dk(u)))], C(lk.fill || '#e9e2d3'));
        for (let k = 0; k <= 5 * N; k++) { const u = U0 + k / 5; path([S(u, -W + 0.05, dk(u)), S(u, W - 0.05, dk(u))], C(lk.edge || '#cfc6b4'), 0.6); }
        path(us.map(u => S(u, 0, dk(u))), C(lk.edge || '#cfc6b4'), 0.5);
      } else for (let i = 1; i < M; i += 2) path([S(us[i], -W, dk(us[i])), S(us[i], W, dk(us[i]))], 'rgba(150,135,110,0.45)', 0.6);   // Fugen quer
      band(W, ri, dk, C(L.face), C(L.joint));                                                         // Stirn: dünner Bogen
      if (o.ring) {                                                          // Bogenring: Keilsteine nur am Bogen, darüber glatte Wand
        const rr = u => ri(u) + 3.2;
        band(W, ri, rr, C(shade(L.face, 0.06)), C(L.joint));
        for (let k = 1; k < 18; k++) { const u = U0 + N * k / 18; path([S(u, W, ri(u)), S(u, W, rr(u))], C(L.joint), 0.6); }
      } else for (let k = 1; k < 12; k++) { const u = U0 + N * k / 12; path([S(u, W, ri(u)), S(u, W, dk(u))], C(L.joint), 0.6); }   // Keilsteine
      path(us.map(u => S(u, W, ri(u))), C(shade(L.face, -0.25)), 1);                                  // Bogenkante
      if (o.gesims) band(W, u => dk(u) - 1.4, u => dk(u), C(shade(L.top, -0.06)), C(L.joint));        // Gesims unter dem Belag
      if (o.par === 'pfosten') {                                             // Geländer: Pfosten und Handlauf aus Stein
        for (let k = 0; k <= 6 * N; k++) { const u = U0 + k / 6; poly([S(u - 0.025, W, dk(u)), S(u + 0.025, W, dk(u)), S(u + 0.025, W, dk(u) + 6), S(u - 0.025, W, dk(u) + 6)], C(L.top), C(L.joint), 0.5); }
        band(W, u => dk(u) + 5, u => dk(u) + 7, C(L.top), C(L.joint));
      } else {
        band(W, u => dk(u), u => dk(u) + parH, C(L.top), C(L.joint));                                 // vordere Brüstung
        path(us.map(u => S(u, W, dk(u) + parH)), C(shade(L.top, 0.06)), 1.2);
      }
      return;
    }
    const L = LOOK[art];
    const rib = u => dk(u) - 7 + 3 * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - U0) / N)));   // Bogenträger unter dem Belag
    const posts = N >= 4 ? [U0 + N / 2] : [];
    const post = (u, v) => poly([S(u - 0.04, v, 0), S(u + 0.04, v, 0), S(u + 0.04, v, rib(u)), S(u - 0.04, v, rib(u))], C(L.side));
    for (const u of posts) post(u, -W + 0.06);                                                       // Stütze hinten
    for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(L.rail), 1); }   // hinteres Geländer
    path(us.map(u => S(u, -W, dk(u) + 6)), C(L.rail), 1.3);
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
  window.bogenEntwurf5 = async (name = 'bogen-anhoehe-5.png', Wd = 560, Hd = 480) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const list = VAR.map((o, k) => [15, 4 + 3 * k, 1.9, o.name]).concat([[15, 17.5, 0.9, 'Übersicht']]);
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
