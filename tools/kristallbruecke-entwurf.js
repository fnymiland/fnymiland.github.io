// Entwurf Kristallbrücke (Besprechung 11.10.2026: vier Materialien Holz/Stein/Metall/Kristall, Fußgänger immer Bogen, Bahn immer flach –
// „entwirf mir erst Designs für die Kristallbrücke“): nur Bild, über das fertige Spielbild gemalt (wie tools/bogen-anhoehe-entwurf2.js).
// Drei Fußgänger-Bögen (K1–K3) und drei flache Bahnbrücken (B1–B3) zwischen zwei Anhöhen, Lücke 4, unten quer zwei Wege.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/kristallbruecke-entwurf.js')).text()); await kristallBild()   → tools/vorschau/kristallbruecke.png
(function kristallbrueckeEntwurf() {
  const H = HILL_H, W = 0.3, A0 = 10, A1 = 13, B0 = 18, B1 = 21, HY = [2, 26];
  const K = { light: '#e6f6fc', glass: 'rgba(175,225,248,0.45)', mid: '#bfe6f7', deep: '#7fc4e8', edge: '#5aa9d6', hi: '#f7fdff', vio: '#c9b8f0', rail: '#8fd3f2' };
  const ROWS = [
    [4, 'K1', 'Fußgänger K1 · Glasbogen'], [8, 'K2', 'Fußgänger K2 · Kristallsplitter am Bogen'], [12, 'K3', 'Fußgänger K3 · Eisbogen mit Leuchtband'],
    [16, 'B1', 'Bahn B1 · Glasdeck auf Kristallsäulen'], [20, 'B2', 'Bahn B2 · Kristall-Fachwerk'], [24, 'B3', 'Bahn B3 · facettierter Träger'],
  ];
  const mock = new Set();
  function setup() {
    for (let y = 0; y <= 30; y++) for (let x = 4; x <= 34; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear();
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    for (const [x0, x1] of [[A0, A1], [B0, B1]]) for (let y = HY[0]; y <= HY[1]; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 });
    for (const [y, id] of ROWS) {
      for (const x of [A0, A0 + 1, A0 + 2, A1, B0, B0 + 1, B0 + 2, B1]) state.tiles.set(x + ',' + y, id[0] === 'K' ? { b: 'weg', lvl: 1, style: 'kristall', lauf: 0 } : { b: 'schiene', lvl: 1, rot: 0 });
      for (let x = A1 + 1; x < B0; x++) mock.add(x + ',' + y);
    }
    for (const x of [15, 16]) for (let y = 0; y <= 28; y++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'sand', lauf: 1 });
    groundVersion++; recalc();
    for (const [x0, x1] of [[28, 29], [32, 33]]) for (let y = 27; y <= 29; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 });
    groundVersion++; recalc();
    setTool('bruecke'); startPlan('line', { x: 29, y: 28 }, { x: 32, y: 28 }, false); runPlan();   // echte Brücke weit weg: bkOn()
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  let dpr = 1, X = null;
  function bridge(y, id) {
    const U0 = A1 + 0.5, U1 = B0 - 0.5, N = U1 - U0, M = 40, arch = id[0] === 'K';
    const pk = arch ? 0.5 * 20.4 * Math.pow(N / 2, 0.6) : 0;
    const S = (u, v, h) => { const p = toScreen(u, y + v); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
    const t01 = u => Math.max(0, Math.min(1, (u - U0) / N)), dk = u => H + pk * Math.sin(Math.PI * t01(u));
    const us = Array.from({ length: M + 1 }, (_, i) => U0 + N * i / M);
    const lw = w => w * cam.z * dpr * 0.5;
    const poly = (pts, fill, stroke, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); if (fill) { X.fillStyle = fill; X.fill(); } if (stroke) { X.strokeStyle = stroke; X.lineWidth = lw(w || 1); X.stroke(); } };
    const path = (pts, col, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.strokeStyle = col; X.lineWidth = lw(w); X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); };
    const band = (v, f0, f1, col, stroke, w) => poly([...us.map(u => S(u, v, f0(u))), ...[...us].reverse().map(u => S(u, v, f1(u)))], col, stroke, w || 0.6);
    const deckTop = (col, w0 = -W, w1 = W) => poly([...us.map(u => S(u, w0, dk(u))), ...[...us].reverse().map(u => S(u, w1, dk(u)))], col);
    // ferne Anhöhe deckt das Ende (wie Entwurf 2)
    { const Q = (u, w, h) => { const p = toScreen(u, w); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
      for (const f of [[Q(B0 - 0.5, HY[0] - 0.5, H), Q(B1 + 0.5, HY[0] - 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, H), Q(B0 - 0.5, HY[1] + 0.5, H)],
                       [Q(B0 - 0.5, HY[1] + 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, H), Q(B1 + 0.5, HY[1] + 0.5, 0), Q(B0 - 0.5, HY[1] + 0.5, 0)]]) {
        X.beginPath(); X.rect(-1e5, -1e5, 3e5, 3e5); f.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); X.clip('evenodd');
      } }
    const sh = (u, v, h) => { const p = S(u, v, 0); return [p[0] + SUN.dx * h * cam.z * dpr, p[1] + SUN.dy * h * cam.z * dpr]; };
    poly([...us.map(u => sh(u, -W, dk(u))), ...[...us].reverse().map(u => sh(u, W, dk(u)))], 'rgba(60,110,160,0.13)');   // Schatten, bläulich
    const glassRail = (v, h, front) => {                                     // Glasscheiben mit leuchtendem Handlauf (wie die Kristall-Fußgängerbrücke)
      band(v, u => dk(u), u => dk(u) + h, front ? 'rgba(175,225,248,0.42)' : 'rgba(175,225,248,0.3)');
      for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, v, dk(u)), S(u, v, dk(u) + h)], '#d8f2fc', 0.6); }
      path(us.map(u => S(u, v, dk(u) + h)), front ? K.rail : C(shade(K.rail, -0.1)), 1.3);
    };
    const rails = () => {                                                    // Gleis auf dem Deck (Schotter)
      poly([...us.map(u => S(u, -0.23, H)), ...[...us].reverse().map(u => S(u, 0.23, H))], C('#c3b9a8'));
      for (let k = 0; k <= 8 * N; k++) { const u = U0 + k / 8; path([S(u, -0.15, H), S(u, 0.15, H)], C('#8a6440'), 1.5); }
      for (const v of [-0.09, 0.09]) path(us.map(u => S(u, v, H + 0.6)), C('#6f7682'), 1.3);
    };
    if (id === 'K1') {                                                       // Glasbogen: dünnes, durchscheinendes Band
      const ri = u => H - 3 + (pk + 3 - 3) * Math.sin(Math.PI * t01(u));
      glassRail(-W, 6, false);
      deckTop(K.light);
      for (let k = 1; k < 6 * N; k++) { const u = U0 + k / 6; path([S(u, -W, dk(u)), S(u, W, dk(u))], C('#c3e7f5'), 0.5); }
      band(W, ri, dk, 'rgba(143,203,230,0.75)', C(K.edge), 0.7);
      path(us.map(u => S(u, W, dk(u) - 0.6)), C(K.hi), 0.8);
      glassRail(W, 6, true);
    } else if (id === 'K2') {                                                // Kristallsplitter: unter dem Bogen hängen Prismen, wie gewachsen
      const ri = u => H - 3 + (pk + 3 - 4) * Math.sin(Math.PI * t01(u));
      glassRail(-W, 6, false);
      deckTop(K.light);
      band(W, ri, dk, C(K.mid), C(K.edge), 0.7);
      for (let k = 1; k < 7 * N; k++) {                                    // Prismen nach unten, Länge je nach Lage
        const u = U0 + (k + 0.5) / 7, len = 3 + 4 * Math.abs(Math.sin(k * 2.3)) * Math.sin(Math.PI * t01(u)), w2 = 0.05;
        if (ri(u) - len < H - 6) continue;
        poly([S(u - w2, W, ri(u - w2)), S(u + w2, W, ri(u + w2)), S(u, W, ri(u) - len)], k % 2 ? C(K.deep) : C(K.vio), C(K.edge), 0.4);
      }
      path(us.map(u => S(u, W, dk(u) - 0.6)), C(K.hi), 0.8);
      glassRail(W, 6, true);
    } else if (id === 'K3') {                                                // Eisbogen: kräftiger, violett-blau, Leuchtband an der Kante
      const ri = u => H - 5 + (pk + 5 - 5) * Math.sin(Math.PI * t01(u));
      band(-W, u => dk(u), u => dk(u) + 3, C(shade(K.vio, -0.1)));
      deckTop(K.light);
      for (let k = 1; k < 5 * N; k++) { const u = U0 + k / 5; path([S(u, -W, dk(u)), S(u, W, dk(u))], C('#cbe3f2'), 0.5); }
      const g2 = X.createLinearGradient(...S(U0, W, H + pk), ...S(U0, W, H - 5)); g2.addColorStop(0, '#d6ccf4'); g2.addColorStop(1, '#8fbfe6');
      band(W, ri, dk, g2, C(K.edge), 0.7);
      path(us.map(u => S(u, W, ri(u) + 1)), '#ffffff', 1.4);              // Leuchtband (nachts hell)
      band(W, u => dk(u), u => dk(u) + 3, C(K.vio), C(shade(K.vio, -0.25)), 0.5);
      path(us.map(u => S(u, W, dk(u) + 3)), C(K.hi), 1.1);
    } else if (id === 'B1') {                                                // Glasdeck auf Kristallsäulen (Kachelkanten)
      const cols = [1, 2, 3].map(k => U0 + k);
      const pillar = (u, v) => { const hw = 0.06; poly([S(u - hw, v, 0), S(u + hw, v, 0), S(u + hw, v, H - 3), S(u, v, H - 1.5), S(u - hw, v, H - 3)], C(K.mid), C(K.edge), 0.5); path([S(u - hw * 0.2, v, 2), S(u - hw * 0.2, v, H - 4)], C(K.hi), 0.6); };
      for (const u of cols) pillar(u, -W + 0.08);
      for (const u of cols) pillar(u, W - 0.08);
      deckTop('rgba(214,240,250,0.92)');
      band(W, u => H - 3, u => H, 'rgba(143,203,230,0.8)', C(K.edge), 0.6);
      rails();
      band(W, u => H, u => H + 2, 'rgba(175,225,248,0.5)'); path(us.map(u => S(u, W, H + 2)), K.rail, 1.1);
    } else if (id === 'B2') {                                                // Fachwerk aus Kristall (Form wie Stahl)
      const truss = (v, col, w) => {
        const T = 11, a = U0 + 0.15, b = U1 - 0.15, m = 2 * N;
        path([S(U0, v, H), S(U1, v, H)], col, w * 1.4); path([S(a, v, H + T), S(b, v, H + T)], col, w * 1.4);
        path([S(U0, v, H), S(a, v, H + T)], col, w); path([S(U1, v, H), S(b, v, H + T)], col, w);
        for (let j = 0; j < m; j++) { const p = a + (b - a) * j / m, q = a + (b - a) * (j + 1) / m; path([S(p, v, H + T), S(q, v, H)], col, w); if (j) path([S(p, v, H), S(p, v, H + T)], col, w * 0.8); }
      };
      truss(-W - 0.02, C(K.deep), 1.2);
      deckTop(C('#d7eef7'));
      band(W, u => H - 4, u => H, C(K.mid), C(K.edge), 0.6);
      rails();
      truss(W + 0.02, C(K.rail), 1.6);
      path([S(U0, W + 0.02, H + 11), S(U1, W + 0.02, H + 11)], C(K.hi), 0.7);
    } else if (id === 'B3') {                                                // facettierter Träger: dicker Kristallbalken mit Dreiecks-Facetten
      deckTop(C('#d7eef7'));
      const bot = u => H - 7 + 2.5 * Math.sin(Math.PI * t01(u));
      band(W, bot, u => H, C(K.mid), C(K.edge), 0.6);
      for (let k = 0; k < 4 * N; k++) {                                    // Facetten
        const u0 = U0 + k / 4, u1 = u0 + 0.25, um = (u0 + u1) / 2;
        poly([S(u0, W, H), S(u1, W, H), S(um, W, bot(um))], k % 2 ? C('#d4f0fb') : C('#a9d9f0'), C(shade(K.mid, -0.15)), 0.4);
      }
      rails();
      band(W, u => H, u => H + 2, 'rgba(175,225,248,0.5)'); path(us.map(u => S(u, W, H + 2)), K.rail, 1.1);
    }
  }
  function shot(cx, cy, zz, Wd, Hd, up = H) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const o = { baf: bkArmFrom, braf: bkRailArmFrom, off: GL.off };
    bkArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.baf(x, y, dx, dy);
    bkRailArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.braf(x, y, dx, dy);
    GL.off = true; resetDrawCaches(); groundVersion++;
    try { const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { bkArmFrom = o.baf; bkRailArmFrom = o.braf; GL.off = o.off; }
    dpr = canvas.width / innerWidth;
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; X = c.getContext('2d');
    const ox = canvas.width / 2 - Wd / 2, oy = canvas.height / 2 - Hd / 2;
    X.fillStyle = '#fffaf0'; X.fillRect(0, 0, Wd, Hd); X.drawImage(canvas, ox, oy, Wd, Hd, 0, 0, Wd, Hd);
    X.translate(-ox, -oy); for (const [y, id] of ROWS) { X.save(); try { bridge(y, id); } finally { X.restore(); } }
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.kristallBild = async (name = 'kristallbruecke.png', Wd = 620, Hd = 470) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const list = ROWS.map(([y, , l]) => [15.5, y, 1.8, l]).concat([[14.6, 8, 4.2, 'K2 nah'], [14.8, 16, 4.2, 'B1 nah']]);
    const cols = 2, rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Wd + 16); sheet.height = rows * (Hd + 50);
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
