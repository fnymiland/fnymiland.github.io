// Prüfbilder 160c D2 (plan-160c/karte-D2.md §4): neue Modelle der Wasser-Wegbrücken. Anders als der D0-Entwurf wird nichts umgeleitet –
// die Brücken bekommen echte br-Felder (brStamp), das Spiel malt sie selbst; vorher (alter Maler) und nachher sind dieselben Aufnahmen.
// Feste Zeit, angehaltene Spielschleife, ohne Bewegtes (Boote/Figuren nur, wo ein Blatt sie setzt). Im Browser (Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/wasser-d2-pruefung.js')).text());
// ?welt=bruecken:  wasserD2Bg('raster', 'vorher')   → tools/vorschau/d2-vorher-{material-holz…,abnehmen,boot}.png (Raster ab x 2 überschreibt die Welt)
// jede Welt:       wasserD2Bg('welt', 'vorher')     → tools/vorschau/d2-vorher-welt-<welt>.png (je Art/Länge/Achse/breit eine Spanne)
// Fertig: window.wasserD2Fertig
(function wasserD2Tool() {
  const NAME = { holz: 'Holz', stein: 'Stein', stahl: 'Metall', kristall: 'Kristall' }, MATS = ['holz', 'stein', 'stahl', 'kristall'];
  const BOATS = [], FIGS = [];
  // --- Raster (wie tools/wasserbruecken-entwurf.js, Region x 2–62, y 2–70) ---------------------------------------------------------
  const REG = [2, 2, 62, 70];
  function leeren() {
    for (let y = REG[1] - 2; y <= REG[3]; y++) for (let x = REG[0] - 2; x <= REG[2]; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); if (state.bruecken) state.bruecken.clear(); BOATS.length = 0; FIGS.length = 0;
  }
  // u0, v0: erstes Wasserfeld; N Brückenfelder, breit Reihen; steg: 0 (Ufer beidseits) | 1 (offen am +Ende) | -1 (offen am −Ende)
  // look: neues Format { mat, col, plank, deck, licht, zacken, stuetzen } | alt: { style, brk, brc, brw } (Altfelder) ; ohneWeg: Ufer ohne Wegkachel
  function kanal(u0, v0, N, { breit = 1, ax = 0, steg = 0, look = null, alt = null, ohneWeg = false } = {}) {
    const K = (u, v) => ax ? v + ',' + u : u + ',' + v, wA = steg < 0 ? 5 : 0, wB = steg > 0 ? 5 : 0;
    for (let v = v0 - 2; v <= v0 + breit + 1; v++) for (let u = u0 - 3 - wA; u <= u0 + N + 2 + wB; u++) state.terra.set(K(u, v), u >= u0 - wA && u < u0 + N + wB ? 'water' : 'grass');
    const style = alt ? alt.style : look && look.mat === 'stein' ? 'platten' : 'sand';
    for (let r = 0; r < breit; r++) {
      if (!ohneWeg && steg >= 0) for (let u = u0 - 3; u < u0; u++) state.tiles.set(K(u, v0 + r), { b: 'weg', lvl: 1, style, lauf: ax });
      if (!ohneWeg && steg <= 0) for (let u = u0 + N; u <= u0 + N + 2; u++) state.tiles.set(K(u, v0 + r), { b: 'weg', lvl: 1, style, lauf: ax });
      for (let u = u0; u < u0 + N; u++) {
        const t = { b: 'weg', lvl: 1, style, bridge: true, lauf: ax };
        if (alt) { if (alt.brk) t.brk = alt.brk; if (alt.brc != null) t.brc = alt.brc; if (alt.brw != null) t.brw = alt.brw; }
        if (look) {                                                            // neues Format: br-Felder + brp (wie D3 bauen wird)
          t.brm = look.mat; if (look.col != null) t.brc = look.col; if (look.plank != null) t.brw = look.plank;
          if (look.deck) t.brb = look.deck; if (look.licht) t.brl = look.licht; if (look.zacken) t.brz = 'an'; if (look.stuetzen) t.bru = look.stuetzen;
          if (look.mat === 'stein') t.brk = 'stein'; else if (look.mat === 'holz') delete t.brk;
          brStamp(t, 'wasser', { ...brLegacyLook(t, 'wasser'), ...look, at: 'wasser', fam: 'fuss' });
        }
        state.tiles.set(K(u, v0 + r), t);
      }
    }
  }
  function fertig() {
    for (const t of state.tiles.values()) delete t.born;
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); if (typeof growWorld === 'function') growWorld();
    groundVersion++; recalc(); floats.length = 0; setTool('look');
  }
  // --- Aufnahme mit fester Zeit (wie tools/wasser-d1-pruefung.js) ------------------------------------------------------------------
  async function shot(x, y, z, Wd, Hd, nt, up = 0, gl = false) {
    const p = iso(x, y); cam.x = p.x; cam.y = p.y - up; cam.z = z;
    const o = { na: nightAt, gh: gameHour, off: GL.off, sm: syncMovers, sh: shipMovers, fb: fishBoats, cs: cargoShip };
    nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12); GL.off = !gl; syncMovers = () => {};
    shipMovers = () => BOATS.map(b => ({ ...b })); fishBoats = () => []; cargoShip = () => null;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0;
    for (const f of FIGS) walkers.push({ ...f });
    lastFrame = 1e15;
    try {
      resetDrawCaches(); groundVersion++; spriteNoBudget = true; for (let k = 0; k < 6; k++) render(1e6);
      for (let k = 0; k < 4; k++) { await new Promise(r => setTimeout(r, 120)); render(1e6); }
      spriteNoBudget = false; render(1e6);
    } finally { nightAt = o.na; gameHour = o.gh; GL.off = o.off; syncMovers = o.sm; shipMovers = o.sh; fishBoats = o.fb; cargoShip = o.cs; lastFrame = 0; walkers.length = 0; }
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, Wd, Hd);
    if (gl && GL.canvas && GL.shown) q.drawImage(GL.canvas, GL.canvas.width / 2 - Wd / 2, GL.canvas.height / 2 - Hd / 2, Wd, Hd, 0, 0, Wd, Hd);
    q.drawImage(canvas, canvas.width / 2 - Wd / 2, canvas.height / 2 - Hd / 2, Wd, Hd, 0, 0, Wd, Hd);
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
  // --- Blätter im Raster ----------------------------------------------------------------------------------------------------------
  // je Material N 1/2/3/6/9/16 × Tag | Nacht (wie D0 wasser-<mat>.png Spalte „neu“; dort im Raster ab x 6, y 4 + i·6)
  async function materialBlatt(pre, mat, Wd = 500, Hd = 380) {
    leeren();
    const NS = [1, 2, 3, 6, 9, 16], pos = [];
    NS.forEach((N, i) => { const u0 = 6, v0 = 4 + i * 6; kanal(u0, v0, N, { look: { mat, licht: 'an' } }); pos.push([u0, v0, N]); });
    fertig();
    const shots = [];
    for (const [u0, v0, N] of pos) {
      const [cx, cy] = mitte(u0, v0, N, 1, 0), z = ZOOM[N], up = hoch(N);
      shots.push([await shot(cx, cy, z, Wd, Hd, 0, up), `${NAME[mat]} · ${N} ${N === 1 ? 'Feld' : 'Felder'} · Tag`]);
      shots.push([await shot(cx, cy, z, Wd, Hd, NIGHT_MAX, up), `${NAME[mat]} · ${N} · Nacht`]);
    }
    return blatt(`d2-${pre}-material-${mat}.png`, shots, 2, Wd, Hd);
  }
  // nicht im D0-Bild abgenommen (karte-D2 §6.12): Steg −x/−y, alte Farben, Landende ohne Weg – vorher (alter Maler) und nachher je Zelle
  async function abnehmenBlatt(pre, Wd = 440, Hd = 340) {
    leeren();
    const pos = [];
    // Steg offen am −Ende (Ost-West und Nord-Süd) und am +Ende, je Material
    MATS.forEach((mat, i) => {
      kanal(10, 4 + i * 6, 3, { steg: -1, look: { mat } }); pos.push([10, 4 + i * 6, 3, 0, `${NAME[mat]} · Steg −x`]);
      kanal(26, 4 + i * 6, 3, { steg: 1, look: { mat } }); pos.push([26, 4 + i * 6, 3, 0, `${NAME[mat]} · Steg +x`]);
      kanal(56, 42 + i * 5, 3, { steg: -1, ax: 1, look: { mat } }); pos.push([56, 42 + i * 5, 3, 1, `${NAME[mat]} · Steg −y`]);   // Wasser y 51–58, Ufer 59–61
    });
    // alte Farben (Altfelder mit brc/brw): Holz Farbe 6 + Planke 2, Stein Farbe 6, Ziegel, Rot
    const ALT = [['Holz brc 6 brw 2', { style: 'sand', brc: 6, brw: 2 }], ['Stein brc 6', { style: 'platten', brc: 6 }], ['Ziegel', { style: 'kopf' }], ['Rot', { style: 'sand', brk: 'rot' }]];
    ALT.forEach(([l, alt], i) => { kanal(10, 30 + i * 6, 3, { alt }); pos.push([10, 30 + i * 6, 3, 0, 'alt · ' + l]); kanal(26, 30 + i * 6, 1, { alt }); pos.push([26, 30 + i * 6, 1, 0, 'alt · ' + l + ' · 1 Feld']); });
    // Landende ohne Weg (Gras an beiden Enden), Holz und Stein, 1 und 3 Felder
    [['holz', 1], ['holz', 3], ['stein', 1], ['stein', 3]].forEach(([mat, N], i) => { kanal(44 + (i % 2) * 9, 34 + Math.floor(i / 2) * 7, N, { ohneWeg: true, look: { mat } }); pos.push([44 + (i % 2) * 9, 34 + Math.floor(i / 2) * 7, N, 0, `${NAME[mat]} · ${N} · Landende ohne Weg`]); });
    fertig();
    const shots = [];
    for (const [u0, v0, N, ax, l] of pos) { const [cx, cy] = mitte(u0, v0, N, 1, ax); shots.push([await shot(cx, cy, N === 1 ? 2.8 : 2.2, Wd, Hd, 0, 6), l]); }
    return blatt(`d2-${pre}-abnehmen.png`, shots, 4, Wd, Hd);
  }
  // Boot unter flacher Brücke, mittig und am Rand, unter Holz- und Steinbogen (Frage 1/2) und Figuren auf dem Deck
  async function bootBlatt(pre, Wd = 440, Hd = 340) {
    leeren();
    kanal(6, 4, 1, { look: { mat: 'holz' } }); kanal(16, 4, 1, { look: { mat: 'stein' } });
    kanal(6, 12, 6, { look: { mat: 'holz' } }); kanal(6, 20, 6, { look: { mat: 'stein' } }); kanal(30, 12, 6, { look: { mat: 'stahl' } }); kanal(30, 20, 6, { look: { mat: 'kristall' } });
    fertig();
    const shots = [];
    const fall = async (l, x, y, z, up, boats, figs = []) => { BOATS.length = 0; BOATS.push(...boats); FIGS.length = 0; FIGS.push(...figs); shots.push([await shot(x, y, z, Wd, Hd, 0, up), l]); };
    const B = (px, py) => ({ boat: true, ship: 'motor', px, py, du: 0, dv: 1 }), F = (px, py, kind = 0) => ({ fur: ['#e8b04a', '#c98a5a', '#9ad0f0'][kind], shirt: '#3a7bd5', id: 'F' + px + py, px, py, kind, speed: 0.4, wait: 1e9 });
    await fall('Holz flach · Boot mittig', 6, 4, 2.8, 4, [B(6, 4.1)], [F(6, 4)]);
    await fall('Stein flach · Boot mittig', 16, 4, 2.8, 6, [B(16, 4.1)], [F(16, 4)]);
    for (const [mat, v0] of [['holz', 12], ['stein', 20]]) {
      const A = bridgeArch(6, v0), j = A ? Math.max(1, A.pass.findIndex(Boolean)) : 2;
      await fall(`${NAME[mat]} Bogen 6 · Boot mittig im Feld ${j}`, 6 + j, v0, 2.1, 14, [B(6 + j, v0 + 0.1)], [F(6 + j - 1, v0), F(6 + j + 1, v0 + 0.1, 1)]);
      await fall(`${NAME[mat]} Bogen 6 · Boot vor der Stirn`, 6 + j, v0, 2.1, 14, [B(6 + j, v0 + 0.45)]);
    }
    for (const [mat, v0] of [['stahl', 12], ['kristall', 20]]) {
      const A = bridgeArch(30, v0), j = A ? Math.max(1, A.pass.findIndex(Boolean)) : 2;
      await fall(`${NAME[mat]} Bogen 6 · Boot mittig`, 30 + j, v0, 2.1, 14, [B(30 + j, v0 + 0.1)], [F(30 + j - 1, v0, 2)]);
    }
    BOATS.length = 0; FIGS.length = 0;
    return blatt(`d2-${pre}-boot.png`, shots, 4, Wd, Hd);
  }
  // --- Blatt aus der geladenen Welt: je (Art, Länge, Achse, breit, flach/Bogen) eine Spanne, sortiert (vorher/nachher gleich) ----------
  async function weltBlatt(pre, Wd = 440, Hd = 340) {
    const seen = new Set(), arten = new Map();
    for (const [k, t] of [...state.tiles].sort(([a], [b]) => a < b ? -1 : 1)) {
      if (!isWegBridge(t) || seen.has(k)) continue;
      const span = bridgeSpan(...keyXY(k)); for (const [x, y] of span) seen.add(x + ',' + y);
      const [x, y] = keyXY(k), A = bridgeArch(x, y), ax = A ? A.ax : bridgeAxis(x, y, t), xs = span.map(p => p[0]), ys = span.map(p => p[1]);
      const N = ax ? Math.max(...ys) - Math.min(...ys) + 1 : Math.max(...xs) - Math.min(...xs) + 1, breit = span.length / N;
      const key = [bridgeKind(t), N, ax, breit, A ? 'A' : 'f', t.brc != null ? 'c' : '', t.brw != null ? 'w' : ''].join('|');
      if (!arten.has(key)) arten.set(key, { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, N, key, up: A ? A.peak / 2 : 4 });
    }
    const list = [...arten.values()].slice(0, 16), shots = [];
    for (const s of list) shots.push([await shot(s.cx, s.cy, s.N >= 9 ? 1.1 : s.N >= 3 ? 1.6 : 2.4, Wd, Hd, 0, s.up), s.key.replace(/\|/g, ' · ')]);
    const welt = (new URLSearchParams(location.search)).get('welt') || 'spiel';
    return blatt(`d2-${pre}-welt-${welt}.png`, shots, 4, Wd, Hd);
  }
  window.wasserD2 = async (was, pre) => {
    closeModal(); closePanel(); setTool('look');
    const out = {};
    if (was === 'raster') {
      for (const mat of MATS) out[mat] = await materialBlatt(pre, mat);
      out.abnehmen = await abnehmenBlatt(pre); out.boot = await bootBlatt(pre);
    } else if (was === 'welt') out.welt = await weltBlatt(pre);
    else if (MATS.includes(was)) out[was] = await materialBlatt(pre, was);
    else if (was === 'abnehmen') out.abnehmen = await abnehmenBlatt(pre);
    else if (was === 'boot') out.boot = await bootBlatt(pre);
    return out;
  };
  window.wasserD2Bg = (was, pre) => { window.wasserD2Fertig = null; wasserD2(was, pre).then(r => { window.wasserD2Fertig = r; }, e => { window.wasserD2Fertig = 'Fehler ' + (e && e.stack || e); }); return 'läuft'; };
  window.wasserD2Dbg = { leeren, kanal, fertig, shot, blatt, BOATS, FIGS };
  return 'ok';
})();
