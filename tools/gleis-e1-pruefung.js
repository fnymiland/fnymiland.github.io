// Prüfbilder 160c E1 (plan-160c/karte-E1.md §4, §6 Nr. 15): Gleisbrücken übers Wasser mit fester Zeit, vorher/nachher Bildpunkt für Bildpunkt
// vergleichbar. Baut seine Fälle selbst (?welt=neu): am Ufer mit Hohem dahinter (Wald, Haus, Hecke, Zaun, Laterne, großes Haus links für den
// Schatten) und frei im Wasser mit Zug und Boot (gerade, Nord-Süd, Kurve, T, X, Leiter, Ende ins Meer).
// Im Browser auf ?welt=neu (Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/gleis-e1-pruefung.js')).text()); await gleisE1('vorher')   → tools/vorschau/e1-vorher-*.png
// Danach gleisE1('nach-E1b') … und mit Python/PIL vergleichen (Δ > 8 je Bildpunkt zählen).
(function gleisE1Tool() {
  const REG = [2, 2, 74, 74], BOATS = [], CARS = [];
  const leeren = () => {
    for (let y = REG[1] - 2; y <= REG[3]; y++) for (let x = REG[0] - 2; x <= REG[2]; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
      if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); if (state.bruecken) state.bruecken.clear();
  };
  const wasser = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.terra.set(x + ',' + y, 'water'); };
  const gleis = (x, y) => { const w = terrainAt(x, y) === 'water'; state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(w ? { bridge: true } : {}) }); };
  const linie = (x0, y0, x1, y1) => { const dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); for (let x = x0, y = y0; ; x += dx, y += dy) { gleis(x, y); if (x === x1 && y === y1) break; } };
  const hecke = (x1, y1, x2, y2, b = 'hecke') => state.edges.set(edgeBetween(x1, y1, x2, y2), { b, style: currentStyle(b) });
  const laterne = (x, y) => state.decos.set(x + ',' + y, [null, null, null, null, null, null, null, null, null, { b: 'laterne' }]);
  // Am Ufer: Brücke längs des Ufers, dahinter (−y bzw. −x) Land mit Hohem. Frei: Kanal quer, Wasser ringsum (Boote, Züge)
  const FAELLE = {
    'ufer O-W': (x0, y0) => { wasser(x0 + 1, y0 + 5, x0 + 8, y0 + 9); linie(x0 - 1, y0 + 5, x0 + 10, y0 + 5);
      state.terra.set((x0 + 3) + ',' + (y0 + 4), 'forest'); state.tiles.set((x0 + 5) + ',' + (y0 + 3), { b: 'haus', lvl: 2, wall: 1, roof: 2 });
      hecke(x0 + 6, y0 + 4, x0 + 6, y0 + 5); hecke(x0 + 7, y0 + 4, x0 + 7, y0 + 5, 'zaun'); laterne(x0 + 2, y0 + 4);
      state.tiles.set((x0 - 1) + ',' + (y0 + 6), { b: 'haus', lvl: 4, wall: 3, roof: 1 }); return [x0 + 4.5, y0 + 4.3]; },
    'ufer N-S': (x0, y0) => { wasser(x0 + 5, y0 + 1, x0 + 9, y0 + 8); linie(x0 + 5, y0 - 1, x0 + 5, y0 + 10);
      state.terra.set((x0 + 4) + ',' + (y0 + 3), 'forest'); state.tiles.set((x0 + 3) + ',' + (y0 + 5), { b: 'haus', lvl: 2, wall: 4, roof: 0 });
      hecke(x0 + 4, y0 + 6, x0 + 5, y0 + 6); hecke(x0 + 4, y0 + 7, x0 + 5, y0 + 7, 'zaun'); laterne(x0 + 4, y0 + 2); return [x0 + 4.3, y0 + 4.5]; },
    'ufer Kurve': (x0, y0) => { wasser(x0 + 2, y0 + 5, x0 + 8, y0 + 10); linie(x0 - 1, y0 + 5, x0 + 5, y0 + 5); linie(x0 + 5, y0 + 6, x0 + 5, y0 + 11);
      state.terra.set((x0 + 4) + ',' + (y0 + 4), 'forest'); state.tiles.set((x0 + 6) + ',' + (y0 + 4), { b: 'haus', lvl: 2, wall: 2, roof: 3 }); hecke(x0 + 5, y0 + 4, x0 + 5, y0 + 5);
      laterne(x0 + 3, y0 + 4); return [x0 + 4.6, y0 + 5]; },
    'frei gerade': (x0, y0) => { wasser(x0 + 2, y0, x0 + 7, y0 + 9); linie(x0, y0 + 5, x0 + 9, y0 + 5); return [x0 + 4.5, y0 + 5]; },
    'frei Nord-Süd': (x0, y0) => { wasser(x0, y0 + 2, x0 + 9, y0 + 7); linie(x0 + 5, y0, x0 + 5, y0 + 9); return [x0 + 5, y0 + 4.5]; },
    'frei Kurve': (x0, y0) => { wasser(x0 + 2, y0 + 2, x0 + 8, y0 + 9); linie(x0, y0 + 5, x0 + 5, y0 + 5); linie(x0 + 5, y0 + 4, x0 + 5, y0); return [x0 + 5, y0 + 5]; },
    'frei T': (x0, y0) => { wasser(x0 + 2, y0 + 2, x0 + 7, y0 + 8); linie(x0, y0 + 5, x0 + 9, y0 + 5); linie(x0 + 5, y0 + 6, x0 + 5, y0 + 10); return [x0 + 5, y0 + 5.5]; },
    'frei X': (x0, y0) => { wasser(x0 + 2, y0 + 2, x0 + 7, y0 + 7); linie(x0, y0 + 5, x0 + 9, y0 + 5); linie(x0 + 5, y0, x0 + 5, y0 + 4); linie(x0 + 5, y0 + 6, x0 + 5, y0 + 9); return [x0 + 5, y0 + 5]; },
    'frei Leiter': (x0, y0) => { wasser(x0 + 2, y0 + 1, x0 + 7, y0 + 9); linie(x0, y0 + 4, x0 + 9, y0 + 4); linie(x0, y0 + 5, x0 + 9, y0 + 5); return [x0 + 4.5, y0 + 4.5]; },
    'frei Ende': (x0, y0) => { wasser(x0 + 2, y0, x0 + 11, y0 + 9); linie(x0, y0 + 5, x0 + 6, y0 + 5); return [x0 + 5, y0 + 5]; },
  };
  // Szenen je Fall: [Name, Wagen, Boote] relativ zur Mitte (cx, cy); Achse des Falls aus dem Namen
  const tr = model => ({ kind: TRAIN_KIND[model], col: 0, model, route: {} });
  const zug = (px, py, du, dv, model = 'regio') => { const kind = TRAIN_KIND[model], t = tr(model), out = []; for (let j = 0; j < kind.n; j++) out.push({ train: t, px: px - du * j * (kind.len + kind.gap), py: py - dv * j * (kind.len + kind.gap), du, dv, i: j, n: kind.n, len: kind.len, d: null, mv: 1 }); return out; };
  const boot = (px, py, du, dv) => ({ boat: true, ship: 'dampfer', px, py, du, dv });
  function szenen(name, cx, cy) {
    const ns = /N-S|Nord/.test(name), d = ns ? [0, 1] : [1, 0], q = ns ? [1, 0] : [0, 1];
    const S = [['leer', [], []], ['Zug mittig', zug(cx, cy, ...d), []], ['Zug Kante', zug(cx + d[0] * 0.95, cy + d[1] * 0.95, ...d), []]];
    if (/frei/.test(name) && !/Kurve|T|X|Ende/.test(name)) S.push(['Boot s 0', [], [boot(cx + d[0] * 0.5, cy + d[1] * 0.5, ...q)]], ['Boot s −0,25', [], [boot(cx + d[0] * 0.5 - q[0] * 0.25, cy + d[1] * 0.5 - q[1] * 0.25, ...q)]],
      ['Boot s +0,35', [], [boot(cx + d[0] * 0.5 + q[0] * 0.35, cy + d[1] * 0.5 + q[1] * 0.35, ...q)]], ['Zug und Boot', zug(cx, cy, ...d), [boot(cx + d[0] * 0.5, cy + d[1] * 0.5, ...q)]]);
    if (/Kurve/.test(name)) S.push(['Tram in der Kurve', zug(cx - 0.6, cy, 1, 0, 'tram'), []]);
    return S;
  }
  let POS = null;
  function bauen() {
    leeren(); POS = [];
    Object.keys(FAELLE).forEach((f, j) => { const x0 = 4 + (j % 5) * 14, y0 = 4 + Math.floor(j / 5) * 16; POS.push([f, FAELLE[f](x0, y0)]); });
    for (const t of state.tiles.values()) delete t.born;
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); if (typeof growWorld === 'function') growWorld();
    groundVersion++; recalc(); floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; setTool('look');
  }
  const figurenWeg = () => { walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0;
    if (typeof meFigs !== 'undefined' && Array.isArray(meFigs)) meFigs.length = 0; if (typeof visitorFigs !== 'undefined' && Array.isArray(visitorFigs)) visitorFigs.length = 0;
    if (Array.isArray(floats)) floats.length = 0; };
  async function shot(x, y, z, W, H, nt, gl = false) {
    figurenWeg();
    const p = iso(x, y); cam.x = p.x; cam.y = p.y - 6; cam.z = z;
    const o = { na: nightAt, gh: gameHour, off: GL.off, sf: spriteForce };
    nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12); GL.off = !gl;
    lastFrame = 1e15;                                                     // Spielschleife steht – nichts bewegt sich beim Warten
    try {
      resetDrawCaches(); groundVersion++; spriteNoBudget = true; for (let k = 0; k < 6; k++) render(1e6);
      for (let k = 0; k < 3; k++) { await new Promise(r => setTimeout(r, 100)); render(1e6); }
      spriteNoBudget = false; render(1e6);
    } finally { nightAt = o.na; gameHour = o.gh; GL.off = o.off; spriteForce = o.sf; lastFrame = 0; }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, W, H);
    if (gl && GL.canvas && GL.shown) q.drawImage(GL.canvas, GL.canvas.width / 2 - W / 2, GL.canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    q.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  async function blatt(name, shots, cols, W, H) {
    const rows = Math.ceil(shots.length / cols), s = document.createElement('canvas'); s.width = cols * (W + 12); s.height = rows * (H + 40);
    const q = s.getContext('2d'); q.fillStyle = '#fffaf0'; q.fillRect(0, 0, s.width, s.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 12), Y = Math.floor(i / cols) * (H + 40) + 30; if (c) q.drawImage(c, X, Y); q.font = '700 17px system-ui'; q.fillStyle = '#6b4f3a'; q.fillText(l, X + 4, Y - 8); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: s.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  }
  // name: Präfix der Dateien; Blätter: nah Tag (z 2,4 live), nah Nacht, mittel (z 1,2 Bildchen), weit (z 0,6; gl: mit GL)
  window.gleisE1 = async (name, { W = 560, H = 440, nur = null, gl = false } = {}) => {
    closeModal(); closePanel();
    const o = { sm: syncMovers, ship: shipMovers, fb: fishBoats, cs: cargoShip, tc: trainCars };
    syncMovers = () => {}; shipMovers = () => BOATS.map(b => ({ ...b })); fishBoats = () => []; cargoShip = () => null; trainCars = () => CARS.map(c => ({ ...c }));
    const out = {};
    try {
      bauen();
      for (const [teil, nt, z] of [['nah', 0, 2.4], ['nacht', NIGHT_MAX, 2.4], ['mittel', 0, 1.2], ['weit', 0, 0.6]]) {
        if (nur && !nur.includes(teil)) continue;
        const shots = [];
        for (const [f, [cx, cy]] of POS) for (const [s, cars, boats] of (teil === 'nah' || teil === 'nacht' ? szenen(f, cx, cy) : [['leer', [], []]])) {
          CARS.length = 0; BOATS.length = 0; CARS.push(...cars); BOATS.push(...boats);
          shots.push([await shot(cx, cy, z, W, H, nt, gl && teil === 'weit'), `${f} · ${s}`]);
        }
        CARS.length = 0; BOATS.length = 0;
        out[teil] = await blatt(`e1-${name}-${teil}.png`, shots, 7, W, H);
      }
    } finally { syncMovers = o.sm; shipMovers = o.ship; fishBoats = o.fb; cargoShip = o.cs; trainCars = o.tc; }
    return out;
  };
  window.gleisE1Bg = (name, opt) => { window.gleisE1Fertig = null; gleisE1(name, opt).then(r => { window.gleisE1Fertig = r; }, e => { window.gleisE1Fertig = 'Fehler ' + e; }); return 'läuft'; };
  window.gleisE1Dbg = { bauen, shot, blatt, BOATS, CARS, zug, boot, get POS() { return POS; } };
  return 'ok';
})();
