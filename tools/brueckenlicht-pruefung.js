// Prüfbilder Brückenlicht (160c C7, plan-160c/karte-C7-bau.md §6): die echten Brücken des Spiels an den Stellen des abgenommenen Entwurfs
// (tools/brueckenlicht-entwurf.js: Lücke 4 zwischen Anhöhen x 10–13 und 18–21, Zoom 1,8, 500 × 400) – Tag/Nacht, an/aus/ohne Strom,
// beide Achsen, Dämmerung, weit weg. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/brueckenlicht-pruefung.js')).text()); await brueckenlichtPruefung('c7-licht.png')
// brueckenlichtPruefung(name, { licht: 'an'|'aus'|null, strom: true|false, nights: [0, NIGHT_MAX], ax: 0|1, n: 4, col: null, z: 1.8, only: ['F-holz', …] })
(function brueckenlichtPruefungTool() {
  const MODELLE = [['F-holz', 'holz', 0, 0], ['F-stein', 'stein', 0, 0], ['F-metall', 'stahl', 0, 0], ['F-kristall', 'kristall', 0, 0], ['F-zacken', 'kristall', 0, 1],
    ['B-holz', 'holz', 1, 0], ['B-stein', 'stein', 1, 0], ['B-metall', 'stahl', 1, 0], ['B-kristall', 'kristall', 1, 0]];
  const NAME = { 'F-holz': 'Fußgänger · Holz', 'F-stein': 'Fußgänger · Stein', 'F-metall': 'Fußgänger · Metall', 'F-kristall': 'Fußgänger · Kristall K1',
    'F-zacken': 'Fußgänger · Kristall mit Zacken', 'B-holz': 'Bahn · Holz', 'B-stein': 'Bahn · Stein', 'B-metall': 'Bahn · Metall', 'B-kristall': 'Bahn · Kristall B2' };
  // Ost-West: Zeilen y = 4, 8, … (Anhöhen x 10–13 | 18–21, Brücke 14–17); Nord-Süd: Spalten x = 4, 8, … (Anhöhen y 50–53 | 58–61, Brücke 54–57)
  function setup(o) {
    const N = o.n || 4;
    for (let y = 0; y <= 66; y++) for (let x = 0; x <= 44; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear();
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    MODELLE.forEach(([id, art, bahn, zk], i) => {
      for (const ax of [0, 1]) {
        const c = 4 + 4 * i, at = (u, v) => ax ? v + ',' + u : u + ',' + v, u0 = ax ? 50 : 10;
        for (let u = u0; u <= u0 + 3; u++) for (let v = c - 2; v <= c + 2; v++) state.hills.set(at(u, v), { w: 0 });
        for (let u = u0 + 4 + N; u <= u0 + 7 + N; u++) for (let v = c - 2; v <= c + 2; v++) state.hills.set(at(u, v), { w: 0 });
        for (let u = u0; u <= u0 + 7 + N; u++) if (u < u0 + 4 || u >= u0 + 4 + N) state.tiles.set(at(u, c), bahn ? { b: 'schiene', lvl: 1, rot: ax } : { b: 'weg', lvl: 1, style: 'sand', lauf: ax });
        const b = { ax, n: N, art };
        if (bahn) b.gleis = Array(N).fill(0);
        if (zk) b.brz = 'an';
        if (o.licht) b.brl = o.licht;
        if (o.col != null) b.brc = o.col;
        state.bruecken.set(at(u0 + 4, c), b);
      }
    });
    state.restore = { ...(state.restore || {}), klippe: 3 };                // Stadtstrom an (Windrad freigeschaltet)
    if (o.strom !== false) for (let i = 0; i < 40; i++) state.tiles.set((i % 20 + 24) + ',' + (40 + Math.floor(i / 20)), { b: 'windrad', lvl: 1 });
    for (const t of state.tiles.values()) delete t.born;
    groundVersion++; recalc(); floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
    return [...T.rail.power.dark].filter(k => k[0] === 'B').length;
  }
  function shot(cx, cy, z, W, H, nt, gl = false) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - HILL_H; cam.z = z;
    const na = nightAt, gh = gameHour, off = GL.off;
    nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12); GL.off = !gl;
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { nightAt = na; gameHour = gh; GL.off = off; }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, W, H);
    const src = gl && GL.canvas && GL.shown ? GL.canvas : canvas;
    q.drawImage(src, src.width / 2 - W / 2, src.height / 2 - H / 2, W, H, 0, 0, W, H);
    if (gl && src !== canvas) q.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  window.brueckenlichtPruefung = async (name = 'c7-licht.png', o = {}) => {
    closeModal(); closePanel();
    const opt = { licht: 'an', strom: true, nights: [0, NIGHT_MAX], ax: 0, n: 4, col: null, z: 1.8, W: 500, H: 400, cols: 4, ...o };
    const dunkel = setup(opt), N = opt.n, mid = 14 + (N - 1) / 2;
    const list = MODELLE.map((m, i) => [m, i]).filter(([m]) => !opt.only || opt.only.includes(m[0]))
      .flatMap(([m, i]) => opt.nights.map(nt => [opt.ax ? 4 + 4 * i : mid, opt.ax ? 50 + (N - 1) / 2 + 4 : 4 + 4 * i, nt, NAME[m[0]] + (opt.ax ? ' · Nord-Süd' : '') + ' · ' + (nt > 0.15 ? 'Nacht' : nt > 0 ? 'Dämmerung ' + nt : 'Tag')]));
    const shots = list.map(([x, y, nt, l]) => [shot(x, y, opt.z, opt.W, opt.H, nt, opt.gl), l]);
    const rows = Math.ceil(shots.length / opt.cols), sheet = document.createElement('canvas'); sheet.width = opt.cols * (opt.W + 16); sheet.height = rows * (opt.H + 46);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % opt.cols) * (opt.W + 16), Y = Math.floor(i / opt.cols) * (opt.H + 46) + 36; sx.drawImage(c, X, Y); sx.font = '700 18px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 10); });
    let r;
    try { r = await (await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { r = 'kein Sammler'; }
    return { r, dunkel };
  };
  return 'ok';
})();
