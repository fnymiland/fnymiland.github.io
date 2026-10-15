// Entwurf Fußgängerbrücke am Bahnübergang (160c F0, plan-160c/karte-fussgaenger-uebergang.md, PLAN-160c.md „F – Übergang“): die Form aus
// Block 148 bleibt (archH, Spanne ±0,9, Rampen ab |b| 0,46 massiv bis zum Boden, Durchfahrt über dem Gleis, zwei Hälften: hintere vor,
// vordere nach den Zügen). Neu ist die Bekleidung aus den Bausteinen der Wegbrücken (bkPaintLage, Familie 'fuss'): Geländer, Deck, Licht,
// Farbe, Kristall-Glas und -Zacken – dazu je Material die Wände: Holz Bretter mit Bogenträger und Hängern, Metall Blech mit Bogen und
// Hängern, Stein ein gemauerter Bogen über dem Gleis, Kristall Glasplatten mit dem Glasband. Bogen über dem Gleis: Ellipse über ±0,46 mit
// Scheitel 18 – über den Wagen (|b| ≤ 0,19) nie unter 16,4 (höchster Zug 13).
// Nur Bild: drawArch wird während der Aufnahme für die Felder in LOOKS umgeleitet. Abbildung: t = (b + 0,45) / 0,9, n = 2 – Pfosten,
// Lampen und Fugen liegen damit symmetrisch (t −0,5 … 1,5 ↔ b −0,9 … 0,9, Scheitel bei t 0,5).
// Seit 160c F1b malt das Spiel selbst so (ubArch) – „heute“ zeigt dann schon das neue Modell; die Bilder von F0 entstanden auf 8805250.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/uebergang-entwurf.js')).text()); await uebergangEntwurf()   → tools/vorschau/uebergang-*.png
(function uebergangEntwurf() {
  const NAME = { holz: 'Holz', stein: 'Stein', stahl: 'Metall', kristall: 'Kristall', weg: 'Wie der Weg' }, MATS = ['holz', 'stein', 'stahl', 'kristall'];
  const LOOKS = new Map(), CARS = [];
  let NEU = false, O = null;
  const RAMP = 0.46, RI = 18, bOf = t => 0.9 * t - 0.45, tOf = b => (b + 0.45) / 0.9;
  const ri = b => Math.abs(b) >= RAMP ? 0 : RI * Math.sqrt(1 - (b / RAMP) ** 2);   // Bogen über dem Gleis
  let STONE_NONE = null;
  function neu(P, z, b0, b1, lk, x, y, d, n, ...rest) {
    const L = NEU && LOOKS.get(x + ',' + y);
    if (!L) return O.arch(P, z, b0, b1, lk, x, y, d, n, ...rest);    // das Spiel: Kachel und Teil (unten/oben, F1d) weiterreichen
    const weg = L.mat === 'weg', art = weg ? 'holz' : L.mat, stein = art === 'stein', glas = art === 'kristall', W = ARCH_W;
    if (!STONE_NONE) STONE_NONE = { arcs: [], S: BR_STEIN, ts: () => [], ri: () => null, pierHit: () => false, low: (tt, g0 = 0) => g0 };
    const lo = Math.min(b0, b1), hi = Math.max(b0, b1), t0 = tOf(lo), t1 = tOf(hi), N = 2;
    const Pk = (t, s, h) => P(s / BK_W * W, bOf(t), h), hf = t => archH(bOf(t));
    const tile = state.tiles.get(x + ',' + y);
    const opts = { fam: 'fuss', ax: d[0] === 1 ? 1 : 0, hf, foot: () => 0, gl: () => 0, supports: [], col: L.col, plank: L.plank, licht: L.licht || null, dark: false,
      zacken: !!L.zacken, clear: ARCH_CLEAR, stone: stein ? STONE_NONE : null, wegPaint: weg ? () => belag(P, z, lo, hi, tile, x, y, d, n) : null };
    const lay = l => bkPaintLage(l, Pk, z, art, N, t0, t1, weg, opts);
    const K = bkKit(Pk, z, N, t0, t1, opts), sh = K.sh;
    const Lp = stein ? brPal(BK_STEIN, 'stein', 'fuss', L.col, null) : brPal(BK_FUSS[art], art, 'fuss', L.col, L.plank);
    const bs = (a, b, k = 36) => { const o = []; const m = Math.max(2, Math.ceil(Math.abs(b - a) * k)); for (let i = 0; i <= m; i++) o.push(a + (b - a) * i / m); return o; };
    const th = { holz: 4, stahl: 2.6, kristall: 3, stein: 0 }[art];
    const cheek = b => { const h = archH(b), l = Math.max(0, h - th); return Math.abs(b) < 0.38 ? Math.max(l, Math.min(h - 1.5, ARCH_CLEAR)) : l; };
    const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = C(col); g.lineWidth = Math.max(0.6, w * z); g.lineCap = 'butt'; g.lineJoin = 'round'; g.stroke(); };
    const segs = (a, b) => { const out = []; for (const [p, q] of [[-0.9, -RAMP], [-RAMP, RAMP], [RAMP, 0.9]]) { const l = Math.max(a, p), h = Math.min(b, q); if (h > l + 1e-9) out.push([l, h, p === -RAMP]); } return out; };
    // Wand einer Seite (s −1 hinten, innen gesehen; +1 vorn): Rampen massiv, über dem Gleis die Wange bzw. (Stein) die Stirn über dem Bogen
    const wand = s => {
      const a = s * W, dunkel = s < 0;
      if (stein) {
        const B = bs(lo, hi), face = dunkel ? shade(Lp.face, -0.22) : sh(Lp.face);
        const pts = [...B.map(b => P(a, b, archH(b))), ...B.slice().reverse().map(b => P(a, b, ri(b)))];
        poly(pts, C(face));
        if (dunkel) return;
        g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        g.beginPath();                                                     // Quader: Lagerfugen alle 3,2, Stoßfugen versetzt
        for (let r = 0; r * 3.2 < ARCH_H + 1; r++) {
          const h = r * 3.2, p = P(a, lo, h), q = P(a, hi, h); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]);
          for (let k = Math.ceil((lo + 0.9) / 0.11) - 1; -0.9 + k * 0.11 + (r % 2) * 0.055 < hi; k++) { const b = -0.9 + k * 0.11 + (r % 2) * 0.055; if (b < lo) continue; const u = P(a, b, h), v = P(a, b, h + 3.2); g.moveTo(u[0], u[1]); g.lineTo(v[0], v[1]); }
        }
        g.strokeStyle = C(mix(sh(Lp.face), sh(Lp.joint), 0.55)); g.lineWidth = Math.max(0.5, 0.3 * z); g.stroke(); g.restore();
        const A = bs(Math.max(lo, -RAMP), Math.min(hi, RAMP), 60);
        if (A.length > 1 && A[A.length - 1] > A[0]) {
          for (const b of A.filter((_, i) => i % 4 === 2)) if (ri(b) > 0.5) line([P(a, b, ri(b)), P(a, b, Math.min(ri(b) + 2.4, archH(b) - 0.4))], mix(sh(Lp.face), sh(Lp.joint), 0.7), 0.3);   // Keilsteine
          line(A.map(b => P(a, b, Math.min(ri(b) + 2.4, archH(b) - 0.4))), mix(sh(Lp.face), sh(Lp.joint), 0.7), 0.3);   // Ring
          line(A.map(b => P(a, b, ri(b))), sh(Lp.edge), 0.5);                // Bogenkante
        }
        return;
      }
      for (const [l, h, mitte] of segs(lo, hi)) {
        const B = bs(l, h);
        if (!mitte) {                                                      // Rampe massiv
          const col = art === 'holz' ? Lp.side : art === 'stahl' ? Lp.steel : mix(Lp.band, '#ffffff', 0.45);
          poly([...B.map(b => P(a, b, archH(b))), ...B.slice().reverse().map(b => P(a, b, 0))], C(dunkel ? shade(col, -0.18) : sh(col)));
          if (dunkel) continue;
          if (art === 'holz') { g.beginPath(); for (let k = Math.ceil(l / 0.075); k * 0.075 < h - 1e-9; k++) { const b = k * 0.075, p = P(a, b, 0), q = P(a, b, archH(b)); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.strokeStyle = C(sh(shade(Lp.side, -0.16))); g.lineWidth = Math.max(0.5, 0.35 * z); g.stroke(); }
          if (art === 'stahl') { g.beginPath(); for (let k = Math.ceil(l / 0.15); k * 0.15 < h - 1e-9; k++) { const b = k * 0.15, p = P(a, b, 0), q = P(a, b, archH(b)); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.strokeStyle = C(Lp.dark); g.lineWidth = Math.max(0.5, 0.45 * z); g.stroke(); line(B.map(b => P(a, b, 0.4)), Lp.dark, 0.5); }
          if (glas) { g.beginPath(); for (let k = Math.ceil(l / 0.12); k * 0.12 < h - 1e-9; k++) { const b = k * 0.12, p = P(a, b, 0), q = P(a, b + 0.06 * Math.sign(b || 1), Math.min(archH(b), 6)); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.strokeStyle = C(sh(Lp.edge)); g.lineWidth = Math.max(0.5, 0.25 * z); g.stroke(); line(B.map(b => P(a, b, archH(b) - 0.6)), Lp.hi, 0.4); }
          if (!glas) line(B.map(b => P(a, b, archH(b))), art === 'holz' ? shade(Lp.side, 0.08) : Lp.dark, 0.4);
          continue;
        }
        // über dem Gleis: Bogen mit Hängern (Holz, Metall) unter der Wange; Kristall: das Glasband (t1) ist die Wange
        if (!glas && !dunkel) {
          const rib = b => ri(b), w = art === 'holz' ? 2.2 : 1.1, col = art === 'holz' ? Lp.rib : Lp.steel;
          g.beginPath(); for (let k = Math.ceil((l + RAMP) / 0.1); -RAMP + k * 0.1 < h - 1e-9; k++) { const b = -RAMP + k * 0.1, top = cheek(b); if (top - rib(b) > 1) { const p = P(a, b, rib(b)), q = P(a, b, top); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } }
          g.strokeStyle = C(sh(art === 'holz' ? Lp.side : Lp.steel)); g.lineWidth = Math.max(0.5, 0.5 * z); g.stroke();
          const R = bs(l, h, 60);
          if (art === 'holz') poly([...R.map(b => P(a, b, rib(b))), ...R.slice().reverse().map(b => P(a, b, Math.max(0, rib(b) - w)))], C(sh(col)));
          else { line(R.map(b => P(a, b, rib(b))), sh(col), w); line(R.map(b => P(a, b, rib(b) + 0.6)), Lp.light, 0.3); }
        }
        if (!glas) {
          const col = art === 'holz' ? Lp.side : Lp.steel;
          poly([...B.map(b => P(a, b, archH(b))), ...B.slice().reverse().map(b => P(a, b, cheek(b)))], C(dunkel ? shade(col, -0.18) : sh(col)));
          if (!dunkel && art === 'holz') { const T = B; poly([...T.map(b => P(a, b, archH(b))), ...T.slice().reverse().map(b => P(a, b, archH(b) - 2))], C(sh(shade(Lp.side, 0.05)))); }   // Randbalken
          if (!dunkel && art === 'stahl') { line(B.map(b => P(a, b, archH(b))), Lp.dark, 0.25); line(B.map(b => P(a, b, cheek(b))), Lp.dark, 0.25); }
        }
      }
      if (!glas) for (const sg of [-1, 1]) {                               // Stirnwand der Rampe zur Gleisseite (wie Block 148)
        const b = sg * RAMP; if (b < lo - 1e-6 || b > hi + 1e-6 || s > 0) continue;
        const w = W + 0.02, col = art === 'holz' ? Lp.side : Lp.steel;
        poly([P(-w, b, 0), P(w, b, 0), P(w, b, archH(b)), P(-w, b, archH(b))], C(shade(col, -0.16)));
      }
    };
    // Laibung des Steinbogens (hintere Hälfte, wo sie zur Kamera zeigt)
    const laibung = () => {
      const A = bs(Math.max(lo, -RAMP), Math.min(hi, 0), 60).filter((b, i, arr) => i === 0 || (ri(b) - ri(arr[i - 1])) / (b - arr[i - 1]) > TH);
      if (A.length < 2) return;
      poly([...A.map(b => P(W, b, ri(b))), ...A.slice().reverse().map(b => P(-W, b, ri(b)))], C(Lp.inner));
    };
    if (glas) lay('hg');
    if (stein) laibung();
    wand(-1);
    lay('h');
    wand(1);
    lay('d');
    if (glas) lay('t1');
    lay('o');
    if (glas) lay('t2');
  }
  // Belag wie der Weg (Block 148): je Abschnitt eine eigene ebene Abbildung, damit Muster dem Bogen folgen
  const belag = (...a) => ubBelag(...a);                                  // seit F1b im Spiel (brueckenbild.js)
  // ---------------------------------------------------------------------------------------------------------------------------------------
  const REG = [2, 2, 70, 74];
  function leeren() {
    for (let y = REG[1] - 2; y <= REG[3]; y++) for (let x = REG[0] - 2; x <= REG[2]; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); if (state.bruecken) state.bruecken.clear(); LOOKS.clear(); CARS.length = 0;
  }
  const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
  // Übergang bei (cx, cy): Schiene längs ax (0: x, 1: y), Weg quer; alt: footPaid heute, look: Aussehen neu
  function uebergang(cx, cy, ax, alt, look, style = 'sand', foot = true) {
    const dx = ax ? 0 : 1, dy = ax ? 1 : 0;
    for (let j = -4; j <= 4; j++) if (j) state.tiles.set((cx + dx * j) + ',' + (cy + dy * j), { b: 'schiene', lvl: 1, form: 0 });
    for (let j = -3; j <= 3; j++) if (j) state.tiles.set((cx + dy * j) + ',' + (cy + dx * j), { b: 'weg', lvl: 1, style });
    state.tiles.set(cx + ',' + cy, { b: 'schiene', lvl: 1, form: 0, cross: true, style, ...(foot ? { foot: true } : {}), ...(alt ? { footPaid: alt } : {}) });
    if (look) LOOKS.set(cx + ',' + cy, look);
  }
  function fertig() {
    for (const t of state.tiles.values()) delete t.born;
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); if (typeof growWorld === 'function') growWorld();
    groundVersion++; recalc(); floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  const pin = (u, v, i) => {
    const a = ANIMALS[(i * 5 + 2) % ANIMALS.length], x = Math.round(u), y = Math.round(v);
    walkers.push({ fx: x, fy: y, tx: x, ty: y, px: u, py: v, t: 0, wait: 1e9, pin: true, kind: ANIMALS.indexOf(a), fur: a.fur || FUR[i % FUR.length],
      shirt: SHIRTS[(i + 2) % SHIRTS.length], speed: 0.8, goal: { kind: 'bummel' }, path: null, steps: 1e9 });
  };
  const leute = (cx, cy, ax, i = 0) => { const nx = ax ? 1 : 0, ny = ax ? 0 : 1; pin(cx - nx * 0.62 + 0.08 * ny, cy - ny * 0.62 + 0.08 * nx, i); pin(cx + nx * 0.55 - 0.08 * ny, cy + ny * 0.55 - 0.08 * nx, i + 1); };
  const zug = (px, py, du, dv, model = 'regio') => { const kind = TRAIN_KIND[model], tr = { kind, col: 0, model, route: {} }; for (let j = 0; j < kind.n; j++) CARS.push({ train: tr, px: px - du * j * (kind.len + kind.gap), py: py - dv * j * (kind.len + kind.gap), du, dv, i: j, n: kind.n, len: kind.len, d: 0, mv: 1 }); };
  function shot(cx, cy, zz, Wd, Hd, nt, neu_, up = 0) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const fig = walkers.slice();
    O = { arch: drawArch, toh: trainOnHills, tc: trainCars, off: GL.off, sf: spriteForce, na: nightAt, gh: gameHour, sync: syncMovers };
    NEU = neu_; drawArch = neu;
    trainOnHills = (m, k) => {                                            // Wagen ohne Fahrweg (route {}): oben auf der Anhöhe angehoben, Enden gerade
      const [kx, ky] = keyXY(k), la = m.len / 2; m.hill = null;
      if (!hillAt(kx, ky)) return k;
      m.hill = { up: true, base: hillLift(kx, ky), ha: surfaceHeight(m.px - m.du * la, m.py - m.dv * la), hb: surfaceHeight(m.px + m.du * la, m.py + m.dv * la), occ: [], ramp: null };
      return k;
    }; trainCars = () => CARS.map(c => ({ ...c })); syncMovers = () => {};
    GL.off = true; spriteForce = false; nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12);
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 4; k++) { walkers.length = 0; walkers.push(...fig); render(now + k * 16); } spriteNoBudget = false; walkers.length = 0; walkers.push(...fig); render(now + 200); }
    finally {
      drawArch = O.arch; trainOnHills = O.toh; trainCars = O.tc; GL.off = O.off; spriteForce = O.sf; nightAt = O.na; gameHour = O.gh; syncMovers = O.sync;
      NEU = false; resetDrawCaches(); groundVersion++; walkers.length = 0; walkers.push(...fig);
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
  const ALT = { holz: 'holz', stein: 'stein', stahl: null, kristall: 'kristall' };
  // Blatt 1: 4 Materialien × 2 Achsen, heute | neu, Zug darunter (Achse 0 nach Osten, Achse 1 nach Norden), Leute auf beiden Rampen
  async function materialBlatt(Wd = 440, Hd = 340) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => [0, 1].forEach(ax => { const cx = 8 + ax * 14, cy = 8 + i * 14; uebergang(cx, cy, ax, ALT[mat] || 'holz', { mat }); pos.push([mat, ax, cx, cy]); }));
    fertig();
    pos.forEach(([mat, ax, cx, cy], i) => leute(cx, cy, ax, i * 2));
    const shots = [];
    for (const [mat, ax, cx, cy] of pos) {
      CARS.length = 0; if (ax) zug(cx, cy + 0.3, 0, -1); else zug(cx + 0.3, cy, 1, 0);
      const A = ax ? 'Schiene Nord-Süd' : 'Schiene Ost-West';
      shots.push([ALT[mat] ? shot(cx, cy, 2.3, Wd, Hd, 0, false, 12) : null, `${A} · heute${ALT[mat] ? '' : ' (kein Metall)'}`]);
      shots.push([shot(cx, cy, 2.3, Wd, Hd, 0, true, 12), `${NAME[mat]} · neu`]);
    }
    CARS.length = 0;
    return blatt('uebergang-material.png', shots, 4, Wd, Hd);
  }
  // Blatt 2: oben auf einer Anhöhe, Tag | Nacht mit Licht, Kristall auch mit Zacken; Farbe (Brückenfarbe 5) an Holz und Metall
  async function nachtBlatt(Wd = 440, Hd = 340) {
    leeren();
    const pos = [];
    MATS.forEach((mat, i) => { const cx = 8 + (i % 2) * 16, cy = 8 + Math.floor(i / 2) * 16; hill(cx - 1, cy - 1, cx + 6, cy + 6); uebergang(cx, cy, i % 2, ALT[mat] || 'holz', { mat, licht: 'an', zacken: mat === 'kristall' }); pos.push([mat, i % 2, cx, cy]); });
    [['holz', 5], ['stahl', 2]].forEach(([mat, col], i) => { const cx = 8 + i * 16, cy = 40; uebergang(cx, cy, 0, 'holz', { mat, col }); pos.push([mat + '|' + col, 0, cx, cy]); });
    fertig();
    pos.forEach(([m, ax, cx, cy], i) => { if (!state.hills.has(cx + ',' + cy)) leute(cx, cy, ax, i * 2 + 1); });   // oben laufen Anhöhen-Bewohner (hillWalkers) – die einfachen stünden falsch
    const shots = [];
    for (const [m, ax, cx, cy] of pos) {
      const [mat, col] = m.split('|'), up = state.hills.has(cx + ',' + cy) ? 12 + HILL_H : 12;
      CARS.length = 0; if (ax) zug(cx, cy - 0.4, 0, 1, 'tram'); else zug(cx - 0.4, cy, -1, 0, 'tram');
      if (col) { shots.push([shot(cx, cy, 2.3, Wd, Hd, 0, true, up), `${NAME[mat]} · Brückenfarbe ${col}`]); continue; }
      shots.push([shot(cx, cy, 2.3, Wd, Hd, 0, true, up), `${NAME[mat]} · auf der Anhöhe${mat === 'kristall' ? ' · Zacken' : ''}`]);
      shots.push([shot(cx, cy, 2.3, Wd, Hd, NIGHT_MAX, true, up), `${NAME[mat]} · Nacht, Licht an`]);
    }
    CARS.length = 0;
    return blatt('uebergang-nacht.png', shots, 4, Wd, Hd);
  }
  // Blatt 3: alte Stände – og „Wie der Weg“ (Fischgrät), alter Holz-Übergang (footPaid true), Kristall unter Schranken (bleibt Schranken)
  async function altBlatt(Wd = 440, Hd = 340) {
    leeren();
    uebergang(8, 8, 0, 'weg', { mat: 'weg' }, 'fisch');
    uebergang(22, 8, 1, true, { mat: 'holz' });
    uebergang(36, 8, 0, 'kristall', null, 'sand', false);
    fertig();
    leute(8, 8, 0, 3); leute(22, 8, 1, 5);
    const shots = [];
    CARS.length = 0; zug(8.3, 8, 1, 0);
    shots.push([shot(8, 8, 2.3, Wd, Hd, 0, false, 12), 'og: Wie der Weg (Fischgrät) · heute'], [shot(8, 8, 2.3, Wd, Hd, 0, true, 12), 'neu: Holz mit Belag Fischgrät']);
    CARS.length = 0;
    shots.push([shot(22, 8, 2.3, Wd, Hd, 0, false, 12), 'alter Holz-Übergang (true) · heute'], [shot(22, 8, 2.3, Wd, Hd, 0, true, 12), 'neu: Holz']);
    shots.push([shot(36, 8, 2.3, Wd, Hd, 0, false, 6), 'Kristall bezahlt, Schranken · heute'], [shot(36, 8, 2.3, Wd, Hd, 0, true, 6), 'neu: bleibt Schranken']);
    return blatt('uebergang-alt.png', shots, 2, Wd, Hd);
  }
  window.uebergangEntwurf = async (nur = null) => {
    closeModal(); closePanel();
    const out = {};
    if (!nur || nur.includes('material')) out.material = await materialBlatt();
    if (!nur || nur.includes('nacht')) out.nacht = await nachtBlatt();
    if (!nur || nur.includes('alt')) out.alt = await altBlatt();
    return out;
  };
  window.uebergangDbg = { leeren, uebergang, fertig, shot, blatt, LOOKS, CARS, zug, leute, neu };
  return 'ok';
})();
