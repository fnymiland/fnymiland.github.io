// Entwurf Wasser-Wegbrücken (160c D0, plan-160c/karte-D0.md): die abgenommenen Brücken-Modelle (Holz 3b mit Stützen auf den Kanten, Stein mit
// den Öffnungen aus Block 150 und Balustrade, Metall, Kristall K1) über Wasser – Form, Bogenhöhe, Öffnungen und Boot-Durchfahrten bleiben
// wie Block 150 (Nutzer F1). Nur Bild: drawWegBridge wird während der Aufnahme je Feld umgeleitet, kein Spielcode geändert.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/wasserbruecken-entwurf.js')).text()); await wasserEntwurf()   → tools/vorschau/wasser-*.png
(function wasserbrueckenEntwurf() {
  const WATER = -0.7 * DEPTH, AS9 = [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5];
  const LIFT = { holz: 3, stein: 7, stahl: 3, kristall: 3 };                 // flach (1 Feld, Steg); Metall/Kristall wie Holz (F-e)
  const OPT = { fuss: WATER, clear: 9, kanteAb: 9 };                         // Stützenfuß (F-a), Zackengrenze (F-g), Lampen nur auf Feldkanten ab 9 Feldern (F-h)
  const NO_ARCS = { arcs: [], S: BR_STEIN, ts: () => [], ri: () => null, pierHit: () => false, low: (t, g0 = 0) => g0 };   // Stein: nur Balustrade + Deck
  const NAME = { holz: 'Holz', stein: 'Stein', stahl: 'Metall', kristall: 'Kristall' }, MATS = ['holz', 'stein', 'stahl', 'kristall'];
  const LOOKS = new Map(), BOATS = [];
  let NEU = false, O = null;
  // Spanne längs ax (wie bridgeArchCalc, ohne Land-Bedingung)
  function span(x, y, ax) {
    const dx = ax ? 0 : 1, dy = ax ? 1 : 0, at = i => state.tiles.get((x + dx * i) + ',' + (y + dy * i));
    let i0 = 0, i1 = 0;
    while (i0 < 60 && isWegBridge(at(-i0 - 1))) i0++;
    while (i1 < 60 && isWegBridge(at(i1 + 1))) i1++;
    const land = i => terrainAt(x + dx * i, y + dy * i) !== 'water';
    return { i0, N: i0 + 1 + i1, landA: land(-i0 - 1), landB: land(i1 + 1) };
  }
  const flatH = (j, S, L) => Math.max(0, Math.min(L, S.landA ? L * (j + 0.5) / 0.3 : L, S.landB ? L * (S.N - 0.5 - j) / 0.3 : L));
  // Belag wie der Weg (Kopie von drawWegBridge, draw-objects.js: Stein/Ziegel-Zweig)
  function belag(t, x, y, z, ax, Pw, H, latB, latF, arch) {
    const AS = arch ? AS9 : [-0.5, -0.2, 0.2, 0.5], hw = EDGE_W;
    const tfd = g.getTransform ? g.getTransform() : null, dpd = (tfd ? Math.hypot(tfd.a, tfd.b) : 1) * z, pd = Math.min(0.08, 1.5 / (dpd * TW * 0.56));
    const b0 = latB ? -0.5 - Math.max(0.01, pd) : -hw, b1 = latF ? 0.5 + Math.max(0.01, pd) : hw;
    const ASd = [AS[0] - pd, ...AS.slice(1, -1), AS[AS.length - 1] + pd], Hd = a => H(Math.max(-0.5, Math.min(0.5, a)));
    const st = styleDef('weg', t.style), lk = lookFar(pathLook(st.id), z) || {}, fill = lk.fill || '#dcc69d';
    const Lh = ([u, v]) => { const a = ax ? v : u, b = ax ? u : v; return Pw(a, b, Hd(a)); };
    const band2 = (w0, w1) => [...ASd.map(a => ax ? [w0, a] : [a, w0]), ...[...ASd].reverse().map(a => ax ? [w1, a] : [a, w1])];
    const inner = band2(latB ? b0 : -ROAD_W, latF ? b1 : ROAD_W);
    poly(band2(b0, b1).map(Lh), C(lk.edge || shade(fill, -0.18)));
    poly(inner.map(Lh), C(fill));
    if (lk.pat || lk.checker) { g.save(); clipTo([inner], Lh); pattern(Lh, lk.pat ? lk.pat[0] : 'tiles', x, y, z, lk.pat && lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, fill); g.restore(); }
  }
  // Steinwand flach (1 Feld, Steg): wie heute (Quader), mit der Bogen-Andeutung
  function flachWand(Pw, H, side, x, y, z, L) {
    const AS = [-0.5, -0.2, 0.2, 0.5], hw = EDGE_W;
    for (let i = 0; i < 3; i++) { const a0 = AS[i], a1 = AS[i + 1]; poly([Pw(a0, hw, -1), Pw(a1, hw, -1), Pw(a1, hw, H(a1)), Pw(a0, hw, H(a0))], C(shade(side, -0.12))); }
    const wallPts = [...AS.map(a => Pw(a, hw, -1)), ...[...AS].reverse().map(a => Pw(a, hw, H(a)))];
    g.save(); g.beginPath(); wallPts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.clip();
    pattern(([sa, st]) => Pw(sa, hw, -1 + (st + 0.5) * 22), 'tiles', x, y, z, C(shade(side, -0.3)), null);
    g.restore();
    const arch = []; for (let k = 0; k <= 12; k++) { const a = -0.3 + 0.6 * k / 12; arch.push(Pw(a, hw, -1 + (L - 2.5) * Math.sqrt(Math.max(0, 1 - (a / 0.3) ** 2)))); }
    poly(arch, 'rgba(35,70,95,0.55)');
  }
  // offenes Ende (Steg): Abschluss quer – Stein: Stirn + Abdeckung, sonst Handlauf
  function quer(art, Pw, h, a, side, z, sicht) {
    const hw = EDGE_W;
    if (art === 'stein') {
      if (sicht) poly([Pw(a, -hw, -1), Pw(a, hw, -1), Pw(a, hw, h), Pw(a, -hw, h)], C(shade(side, -0.2)));
      poly([Pw(a, -hw, h), Pw(a, hw, h), Pw(a, hw, h + BR_STEIN.par), Pw(a, -hw, h + BR_STEIN.par)], C(shade(side, 0.08)));
      return;
    }
    const col = art === 'kristall' ? '#8fd3f2' : art === 'stahl' ? '#5d7d7a' : '#6f5238', dh = art === 'stahl' ? 6.5 : 6;
    g.strokeStyle = C(col); g.lineWidth = Math.max(0.6, 0.7 * z); g.lineCap = 'butt'; g.beginPath();
    const p0 = Pw(a - Math.sign(a) * 0.03, -hw, h + dh), p1 = Pw(a - Math.sign(a) * 0.03, hw, h + dh); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke();
  }
  // Der neue Maler je Brückenfeld (ersetzt drawWegBridge während der Aufnahme)
  function maler(cx, cy, z, x, y, t) {
    const L = NEU && LOOKS.get(x + ',' + y);
    if (!L) return O.dwb(cx, cy, z, x, y, t);                               // vorher bzw. nicht im Raster: wie heute
    const A = bridgeArch(x, y), ax = A ? A.ax : bridgeAxis(x, y, t), art = L.mat, glas = art === 'kristall', stein = art === 'stein', front = BRIDGE_FRONT;
    const lat = s => isWegBridge(state.tiles.get((x + (ax ? s : 0)) + ',' + (y + (ax ? 0 : s)))), latF = lat(1), latB = lat(-1);
    let depth = 0; while (depth < 8 && lat(-depth - 1)) depth++;
    const S = A ? { i0: A.i0, N: A.N, landA: true, landB: true } : span(x, y, ax);
    const oA = !A && !S.landA, oB = !A && !S.landB, vA = oA ? 1 : 0, n = S.N + vA + (oB ? 1 : 0);   // offene Enden: ein gedachtes Feld (Balustrade läuft dort nicht aus)
    const tc = S.i0 + vA, t0 = tc - 0.5, t1 = tc + 0.5;
    const hf = A ? tt => archDeck(A, tt + 0.5) : tt => flatH(tt - vA, S, LIFT[art]);
    const Pw = (a, b, h) => { const [u, v] = ax ? [b, a] : [a, b]; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z]; };
    const sq = s => s / BK_W * (s < 0 ? (latB ? 0.512 : EDGE_W) : (latF ? 0.512 : EDGE_W));
    const P = (tt, s, h) => Pw(tt - tc, sq(s), Math.max(h, WATER));          // nie unter die Wasserfläche
    const sup = art !== 'holz' ? [] : [...brSupports({ mat: 'holz', fam: 'fuss', stuetzen: L.stuetzen || 'wenige' }, S.N).map(k => k + vA),
      ...(oA ? [vA] : []), ...(oB ? [S.N + vA] : [])].filter(k => hf(k - 0.5) >= 2);
    const pal = brPal(BK_STEIN, 'stein', 'fuss', L.col, null), weg = stein || L.deck === 'belag';
    const H = a => hf(tc + a);
    const opts = { fam: 'fuss', ax, hf, foot: () => OPT.fuss, gl: () => -1, supports: sup, ext: S.i0 < S.N - 1 ? 0.012 : 0,
      col: L.col, plank: L.plank, licht: L.licht || null, dark: !!L.dunkel, zacken: !!L.zacken, stone: stein ? NO_ARCS : null,
      wegPaint: weg ? () => belag(t, x, y, z, ax, Pw, H, latB, latF, !!A) : null };
    const lage = (l, ex) => bkPaintLage(l, P, z, art, n, t0, t1, weg, ex ? { ...opts, ...ex } : opts);
    const endPost = art === 'holz' && oB && S.i0 === S.N - 1;               // Stütze am offenen Ende: gehört dem gedachten Feld dahinter – das letzte Feld malt sie
    const flachV = fr => {                                                  // flach ohne Bogenträger (F-f): nur Randbalken (Holz) bzw. Träger (Metall), Stützen
      const K = bkKit(P, z, n, t0, t1, opts), Lp = brPal(art === 'holz' ? BK_FUSS.holz : BK_FUSS.stahl, art, 'fuss', L.col, L.plank);
      if (art === 'holz') { if (!fr) for (const k of sup) { const tt = k - 0.5; if ((tt >= t0 - 1e-9 && tt < t1 - 1e-9) || (endPost && Math.abs(tt - t1) < 1e-9)) K.vert(tt, BK_W - 0.06, OPT.fuss, hf(tt) - 0.5, Lp.side, 2.2); }
        K.band(BK_W, tt => hf(tt) - 2, hf, K.sh(shade(Lp.side, 0.05))); }
      else { K.band(BK_W, tt => hf(tt) - 2.6, hf, K.sh(Lp.steel)); K.line(BK_W, hf, Lp.dark, 0.25); K.line(BK_W, tt => hf(tt) - 2.6, Lp.dark, 0.25); }
    };
    const wand = fr => {
      if (!stein && !A && (art === 'holz' || art === 'stahl')) return flachV(fr);
      if (!stein) return lage('v', fr ? { supports: [] } : null);           // über dem Boot: die Stütze der Anfangskante liegt dahinter (C10)
      if (A) archWall(A, Pw, H, AS9, { side: pal.face }, EDGE_W, z, { ...t, brk: 'stein' }, fr, depth);
      else flachWand(Pw, H, pal.face, x, y, z, LIFT.stein);
    };
    const vorn = () => {
      if (!latF) { lage('o'); if (glas) lage('t2'); }
      if (oB && S.i0 === S.N - 1) quer(art, Pw, H(0.5), 0.5, pal.face, z, true);
    };
    if (front) { if (!latF) wand(true); lage('d', { licht: null }); if (glas && !latF) lage('t1'); return vorn(); }
    if (glas && !latB) lage('hg');
    if (!latB) lage('h');
    if (!latB && endPost) { const K = bkKit(P, z, n, t0, t1, opts), Lp = brPal(BK_FUSS.holz, 'holz', 'fuss', L.col, L.plank); K.vert(t1, -BK_W + 0.06, OPT.fuss, hf(t1) - 0.5, Lp.side, 2.2); }
    if (oA && S.i0 === 0) quer(art, Pw, H(-0.5), -0.5, pal.face, z, false);
    if (!latF) wand(false);
    lage('d', latB ? { licht: null } : null);
    if (glas && !latF) lage('t1');
    vorn();
  }
  // ---------------------------------------------------------------------------------------------------------------------------------------
  // Raster: Kanal je Fall, Ufer mit Weg, Wasserbrücken-Kacheln; Zeilen untereinander
  const REG = [2, 2, 62, 70];
  function leeren() {
    for (let y = REG[1] - 2; y <= REG[3]; y++) for (let x = REG[0] - 2; x <= REG[2]; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); if (state.bruecken) state.bruecken.clear(); LOOKS.clear(); BOATS.length = 0;
  }
  // u0, v0: erstes Wasserfeld; N Felder Brücke, breit Reihen, steg: 0 (Ufer beidseits) | 1 (offen am Ende) ; look: { mat, … }
  function kanal(u0, v0, N, breit, ax, steg, look, alt = null) {   // alt: { style, brk } – alte Brücke, Aussehen aus brLegacyLook
    const K = (u, v) => ax ? v + ',' + u : u + ',' + v, wet = steg ? 5 : 0;
    for (let v = v0 - 1; v <= v0 + breit; v++) for (let u = u0 - 3; u <= u0 + N + 2 + wet; u++) state.terra.set(K(u, v), u >= u0 && u < u0 + N + wet ? 'water' : 'grass');
    for (let v = v0 - 2; v <= v0 + breit + 1; v++) for (let u = u0; u < u0 + N + wet; u++) state.terra.set(K(u, v), 'water');   // Fluss breiter als die Brücke
    const style = alt ? alt.style : look.mat === 'stein' ? 'platten' : 'sand';
    for (let r = 0; r < breit; r++) {
      for (let u = u0 - 3; u < u0; u++) state.tiles.set(K(u, v0 + r), { b: 'weg', lvl: 1, style, lauf: ax });
      if (!steg) for (let u = u0 + N; u <= u0 + N + 2; u++) state.tiles.set(K(u, v0 + r), { b: 'weg', lvl: 1, style, lauf: ax });
      for (let u = u0; u < u0 + N; u++) {
        const t = { b: 'weg', lvl: 1, style, bridge: true, lauf: ax, ...(alt && alt.brk ? { brk: alt.brk } : {}) };
        state.tiles.set(K(u, v0 + r), t); LOOKS.set(K(u, v0 + r), alt ? { ...brLegacyLook(t, 'wasser'), licht: null } : look);
      }
    }
  }
  function fertig() {
    for (const t of state.tiles.values()) delete t.born;
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); if (typeof growWorld === 'function') growWorld();
    groundVersion++; recalc(); floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  function shot(cx, cy, zz, Wd, Hd, nt, neu, up = 0) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    O = { dwb: drawWegBridge, sm: shipMovers, lsp: brLampSpots, bcl: brClear, off: GL.off, sf: spriteForce, na: nightAt, gh: gameHour, sync: syncMovers };
    NEU = neu; drawWegBridge = maler; shipMovers = () => BOATS.map(b => ({ ...b })); syncMovers = () => {};
    brLampSpots = (a, f, nn) => {                                          // länger als 8 (Lesegrenze der Anhöhe): Lampen ab 9 Feldern nur auf den Feldkanten
      if (nn <= 8) return O.lsp(a, f, nn);
      const Sx = { ...O.lsp(a, f, 8) }, grid = K => Array.from({ length: nn * K + 1 }, (_, i) => -0.5 + i / K);
      if (Sx.form === 'laterne') Sx.ts = grid(1).slice(1, -1); else if (Sx.form === 'punkt') Sx.ts = grid(nn >= OPT.kanteAb ? 1 : 2);
      return Sx;
    };
    brClear = (Sx, ...r) => (Sx ? O.bcl(Sx, ...r) : OPT.clear);
    GL.off = true; spriteForce = false; nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12);
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally {
      drawWegBridge = O.dwb; shipMovers = O.sm; brLampSpots = O.lsp; brClear = O.bcl; GL.off = O.off; spriteForce = O.sf; nightAt = O.na; gameHour = O.gh; syncMovers = O.sync;
      NEU = false; resetDrawCaches(); groundVersion++;
    }
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, Wd, Hd); q.drawImage(canvas, canvas.width / 2 - Wd / 2, canvas.height / 2 - Hd / 2, Wd, Hd, 0, 0, Wd, Hd);
    return c;
  }
  async function blatt(name, shots, cols, Wd, Hd) {
    const rows = Math.ceil(shots.length / cols), s = document.createElement('canvas'); s.width = cols * (Wd + 16); s.height = rows * (Hd + 46);
    const q = s.getContext('2d'); q.fillStyle = '#fffaf0'; q.fillRect(0, 0, s.width, s.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (Wd + 16), Y = Math.floor(i / cols) * (Hd + 46) + 36; if (c) q.drawImage(c, X, Y); q.font = '800 19px system-ui'; q.fillStyle = '#6b4f3a'; q.fillText(l, X + 4, Y - 10); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: s.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  }
  const ZOOM = { 1: 3, 2: 2.8, 3: 2.4, 6: 1.7, 9: 1.25, 16: 0.85 };
  const mitte = (u0, v0, N, breit, ax) => ax ? [v0 + (breit - 1) / 2, u0 + (N - 1) / 2] : [u0 + (N - 1) / 2, v0 + (breit - 1) / 2];
  const hoch = N => N >= 2 ? 0.5 * 20.4 * Math.pow(Math.min(N, 16) / 2, 0.6) * 0.5 : 4;
  // Blatt je Material: N 1/2/3/6/9/16 × heute | neu Tag | neu Nacht
  async function materialBlatt(mat, Wd = 500, Hd = 380) {
    leeren();
    const NS = [1, 2, 3, 6, 9, 16], pos = [];
    NS.forEach((N, i) => { const u0 = 6, v0 = 4 + i * 6; kanal(u0, v0, N, 1, 0, 0, { mat, licht: 'an' }); pos.push([u0, v0, N]); });
    fertig();
    const shots = [];
    for (const [u0, v0, N] of pos) {
      const [cx, cy] = mitte(u0, v0, N, 1, 0), z = ZOOM[N], up = hoch(N);
      shots.push([shot(cx, cy, z, Wd, Hd, 0, false, up), `${N} ${N === 1 ? 'Feld' : 'Felder'} · heute`]);
      shots.push([shot(cx, cy, z, Wd, Hd, 0, true, up), `${NAME[mat]} · neu`]);
      shots.push([shot(cx, cy, z, Wd, Hd, NIGHT_MAX, true, up), `${NAME[mat]} · neu · Nacht`]);
    }
    return blatt(`wasser-${mat}.png`, shots, 3, Wd, Hd);
  }
  // breit 1–4 × Material (N 6), Nord-Süd, Steg, 1 Feld
  async function breitBlatt(Wd = 460, Hd = 380) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => [1, 2, 3, 4].forEach((b, j) => { const u0 = 4 + j * 14, v0 = 4 + i * 9; kanal(u0, v0, 6, b, 0, 0, { mat, licht: 'an' }); pos.push([u0, v0, b, mat]); }));
    fertig();
    const shots = [];
    for (const [u0, v0, b, mat] of pos) { const [cx, cy] = mitte(u0, v0, 6, b, 0); shots.push([shot(cx, cy, 1.15, Wd, Hd, 0, true, hoch(6)), `${NAME[mat]} · ${b} ${b === 1 ? 'Reihe' : 'Reihen'}`]); }
    return blatt('wasser-breit.png', shots, 4, Wd, Hd);
  }
  async function stegBlatt(Wd = 460, Hd = 360) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => {
      const v0 = 4 + i * 8;
      kanal(4, v0, 1, 1, 0, 0, { mat, licht: 'an' }); pos.push([4, v0, 1, 0, mat, '1 Feld']);
      kanal(16, v0, 3, 1, 0, 1, { mat, licht: 'an' }); pos.push([16, v0, 3, 0, mat, 'Steg ins Wasser']);
      kanal(4 + i * 12, 40, 3, 1, 1, 1, { mat, licht: 'an' }); pos.push([4 + i * 12, 40, 3, 1, mat, 'Steg Nord-Süd']);
    });
    fertig();
    const shots = [];
    for (const [u0, v0, N, ax, mat, l] of pos) { const [cx, cy] = mitte(u0, v0, N, 1, ax); shots.push([shot(cx + (ax ? 0 : 1), cy + (ax ? 1 : 0), 2.4, Wd, Hd, 0, true, 6), `${NAME[mat]} · ${l}`]); }
    return blatt('wasser-steg.png', shots, 3, Wd, Hd);
  }
  async function nordSuedBlatt(Wd = 460, Hd = 380) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => [3, 6].forEach((N, j) => { const u0 = 6, v0 = 4 + i * 12 + j * 6; kanal(u0, v0, N, 1, 1, 0, { mat, licht: 'an' }); pos.push([u0, v0, N, mat]); }));
    fertig();
    const shots = [];
    for (const [u0, v0, N, mat] of pos) { const [cx, cy] = mitte(u0, v0, N, 1, 1); shots.push([shot(cx, cy, ZOOM[N], Wd, Hd, 0, true, hoch(N)), `${NAME[mat]} · Nord-Süd · ${N} Felder`]); }
    return blatt('wasser-nordsued.png', shots, 4, Wd, Hd);
  }
  async function bootBlatt(Wd = 460, Hd = 380) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => { const u0 = 6, v0 = 4 + i * 8; kanal(u0, v0, 6, 1, 0, 0, { mat }); pos.push([u0, v0, mat]); });
    ['keine', 'jede'].forEach((st, j) => { const u0 = 30, v0 = 4 + j * 8; kanal(u0, v0, 6, 1, 0, 0, { mat: 'holz', stuetzen: st }); pos.push([u0, v0, 'holz', st]); });
    fertig();
    const shots = [];
    for (const [u0, v0, mat, st] of pos) {
      const A = bridgeArch(u0, v0), j = A ? A.pass.findIndex(Boolean) : 2;
      BOATS.length = 0; BOATS.push({ boat: true, ship: 'dampfer', px: u0 + Math.max(1, j), py: v0 + 0.15, du: 0, dv: 1 });
      const cx = u0 + Math.max(1, j) + 0.5, cy = v0;
      shots.push([shot(cx, cy, 2.1, Wd, Hd, 0, false, 14), `${NAME[mat]}${st ? ' · Stützen ' + st : ''} · Boot · heute`]);
      shots.push([shot(cx, cy, 2.1, Wd, Hd, 0, true, 14), `${NAME[mat]}${st ? ' · Stützen ' + st : ''} · Boot · neu`]);
    }
    BOATS.length = 0;
    return blatt('wasser-boot.png', shots, 4, Wd, Hd);
  }
  // alte Brücken (Block 66/150): heute | neu (Material und Farbe aus brLegacyLook – Ziegel → Stein in Ziegelfarbe, Rot → Holz in Rot)
  async function altBlatt(Wd = 460, Hd = 360) {
    leeren();
    const ALT = [['Holz (Sand)', { style: 'sand' }], ['Stein (Platten)', { style: 'platten' }], ['Ziegel (Kopfstein)', { style: 'kopf' }], ['Rot', { style: 'sand', brk: 'rot' }]], pos = [];
    ALT.forEach(([l, alt], i) => [1, 3, 6].forEach((N, j) => { const u0 = 4 + j * 14, v0 = 4 + i * 7; kanal(u0, v0, N, 1, 0, 0, null, alt); pos.push([u0, v0, N, l]); }));
    fertig();
    const shots = [];
    for (const [u0, v0, N, l] of pos) {
      const [cx, cy] = mitte(u0, v0, N, 1, 0), z = { 1: 2.6, 3: 2, 6: 1.5 }[N];
      shots.push([shot(cx, cy, z, Wd, Hd, 0, false, hoch(N)), `${l} · ${N} · heute`]);
      shots.push([shot(cx, cy, z, Wd, Hd, 0, true, hoch(N)), `${l} · ${N} · neu`]);
    }
    return blatt('wasser-alt.png', shots, 6, Wd, Hd);
  }
  window.wasserEntwurf = async (nur = null) => {
    if (nur && nur.includes('alt')) return { alt: await altBlatt() };
    closeModal(); closePanel();
    const out = {};
    for (const mat of MATS) if (!nur || nur.includes(mat)) out[mat] = await materialBlatt(mat);
    if (!nur || nur.includes('breit')) out.breit = await breitBlatt();
    if (!nur || nur.includes('steg')) out.steg = await stegBlatt();
    if (!nur || nur.includes('nordsued')) out.nordsued = await nordSuedBlatt();
    if (!nur || nur.includes('boot')) out.boot = await bootBlatt();
    return out;
  };
  window.wasserOpt = OPT;
  window.wasserDbg = { leeren, kanal, fertig, shot, blatt, LOOKS, BOATS };
  return 'ok';
})();
