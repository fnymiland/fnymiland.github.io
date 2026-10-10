// Entwurf Bergportal (Nutzer 11.10.2026: „Tunneleinfahrt an einer Seitenwand … als Wand mit Öffnung, kein Block vor der Wand“, „einfach eine
// Öffnung reicht“): die Schiene fährt eben in die Wand der Anhöhe, dahinter läuft der Tunnel unter der Anhöhe weiter. Nur als Bild, kein
// Spielcode geändert: paintHill malt für die Portalfelder nach der Wand das Portal in dieselbe Wand (gleiche Bildchen, gleiche Reihenfolge),
// railArmsHill gibt der Schiene davor den Arm zur Wand (sonst Prellbock).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/bergportal-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await bergportalBild()   → tools/vorschau/bergportal-varianten.png
(function bergportalEntwurf() {
  // Nutzer 11.10.2026 nach dem ersten Bogen (A–E): „nur A und D“ – beide zur Wahl. Je Szene: Variante (0 = A Steinbogen, 3 = D nur die
  // Öffnung), Wand (+y 'v' / +x 'u'), Wandart, mit Zug (fährt gerade hinein)
  const VARS = [
    ['A', 'Steinbogen, Wand vorn links (+y)', 'fels', 0, 'v', true],
    ['D', 'Nur die Öffnung, Wand vorn links (+y)', 'fels', 3, 'v', true],
    ['A', 'Steinbogen, Wand vorn rechts (+x)', 'fels', 0, 'u', true],
    ['D', 'Nur die Öffnung, Wand vorn rechts (+x)', 'fels', 3, 'u', true],
    ['A', 'Steinbogen an Erde, ohne Zug', 'erde', 0, 'v', false],
    ['D', 'Nur die Öffnung an Trockenmauer', 'mauer', 3, 'v', true],
  ];
  const ORIG = [[0, 0], [10, 0], [20, 0], [0, 11], [10, 11], [20, 11]];
  const PORT = new Map();                                                // Feld der Anhöhe → { n, side: 'v' (+y) | 'u' (+x) }
  const FRONT = new Map();                                               // Schienenfeld davor → Arm zur Wand
  const STONE = { face: '#d6cdbb', dark: '#bcb29f', top: '#e6dfcf', line: 'rgba(90,75,55,0.45)' };
  const HOLE = '#2b2723', JAMB = '#5a5148', FLOOR = '#8a8070';
  const O = {};
  let base = null;

  // Wand eines Felds: at(s, h) – s längs der Wand (0 … 1, von links nach rechts im Bild), h Höhe über dem Boden; into(s, d, h): d Felder
  // in die Anhöhe hinein (für Laibung und Boden im Tunnel)
  function wallMap(P, side) {
    if (side === 'v') return { at: (s, h) => P(-0.5 + s, 0.5, h), into: (s, d, h) => P(-0.5 + s, 0.5 - d, h) };
    return { at: (s, h) => P(0.5, 0.5 - s, h), into: (s, d, h) => P(0.5 - d, 0.5 - s, h) };
  }
  const path = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const fill = (pts, col) => { path(pts); g.fillStyle = C(col); g.fill(); };
  const strokeL = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = C(col); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
  // Bogenöffnung in der Wand: s0 … s1, Kämpfer bei hk, Scheitel hk + Radius (Halbkreis in der Wandebene, Radius in Bildpunkten der Wand)
  const WALL_LEN = Math.hypot(TW / 2, TH / 2);                           // Bildpunkte je Feld längs der Wand
  function archPts(at, s0, s1, hk, grow = 0, n = 16) {
    const sm = (s0 + s1) / 2, rs = (s1 - s0) / 2 + grow / WALL_LEN, rh = (s1 - s0) / 2 * WALL_LEN + grow, out = [at(sm - rs, 0)];
    for (let i = 0; i <= n; i++) { const a = Math.PI - i * Math.PI / n; out.push(at(sm + Math.cos(a) * rs, hk + Math.sin(a) * rh)); }
    out.push(at(sm + rs, 0));
    return out;
  }
  const rectPts = (at, s0, s1, h1) => [at(s0, 0), at(s0, h1), at(s1, h1), at(s1, 0)];
  // Inneres: dunkel, Laibung links (sichtbar), Boden mit Gleis, das ins Dunkle läuft
  function inside(W, hole, s0, s1, hTop) {
    // Naht an der Wand: das Gleis draußen (Boden-Bild) endet genau an der Wandlinie – das Innere reicht deshalb einen halben Punkt unter
    // sie (sonst schien dort ein Haar Gras durch die Kantenglättung)
    const clipHole = hole.map((p, i) => i === 0 || i === hole.length - 1 ? [p[0], p[1] + 0.6] : p);
    g.save(); path(clipHole); g.clip();
    fill(hole, HOLE);
    const D = 0.9;
    fill([W.at(s0, 0), W.into(s0, D, 0), W.into(s0, D, hTop), W.at(s0, hTop)], JAMB);   // Laibung (zur Kamera hin offen)
    fill([W.at(s0, 0), W.at(s1, 0), W.into(s1, D, 0), W.into(s0, D, 0)], FLOOR);   // Boden neben dem Gleis
    // Gleis im Tunnel: Bett, Schwellen, Schienen wie draußen (Farben und Maße wie drawRailBed, Schwellen im selben Takt ab der Wand) –
    // dunkel wird es erst über den Verlauf, so geht das Gleis an der Wand ohne Stufe weiter
    const sm = (s0 + s1) / 2, lk = RAIL_LOOK.schotter, band = w => [W.into(sm - w, -0.03, 0), W.into(sm + w, -0.03, 0), W.into(sm + w, D, 0), W.into(sm - w, D, 0)];
    fill(band(RAIL_W + 0.03), lk.edge); fill(band(RAIL_W), lk.bed);
    g.strokeStyle = C(lk.tie); g.lineWidth = 1.7; g.lineCap = 'butt'; g.beginPath();
    for (let d = 0.0625; d < D; d += 0.125) { const p = W.into(sm - 0.15, d, 0), q = W.into(sm + 0.15, d, 0); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
    g.stroke();
    for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) { strokeL([W.into(sm + o, -0.03, 0), W.into(sm + o, D, 0)], lk.rail, lk.rw); const p = W.into(sm + o, -0.03, 0.4), q = W.into(sm + o, D, 0.4); strokeL([p, q], '#dfe3e8', 0.45); }
    // Dunkel nach hinten: Verlauf über die Tiefe
    const p0 = W.at(sm, 0), p1 = W.into(sm, 0.7, 0), gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
    gr.addColorStop(0, 'rgba(30,26,22,0.05)'); gr.addColorStop(0.35, 'rgba(30,26,22,0.6)'); gr.addColorStop(1, 'rgba(30,26,22,0.97)');
    g.fillStyle = gr; path(hole); g.fill();
    g.restore();
  }
  // Steinring (Keilsteine) um eine Bogenöffnung, mit Schlussstein
  function ring(W, s0, s1, hk, t, col = STONE) {
    const outer = archPts(W.at, s0, s1, hk, t), inner = archPts(W.at, s0, s1, hk, 0);
    fill([...outer, ...inner.slice().reverse()], col.face);
    const n = 16, sm = (s0 + s1) / 2, rs = (s1 - s0) / 2, rh = rs * WALL_LEN;
    for (let i = 1; i < n; i += 2) {                                     // Fugen der Keilsteine
      const a = Math.PI - i * Math.PI / n, c = Math.cos(a), s = Math.sin(a);
      strokeL([W.at(sm + c * rs, hk + s * rh), W.at(sm + c * (rs + t / WALL_LEN), hk + s * (rh + t))], col.line, 0.8);
    }
    for (const sg of [-1, 1]) for (const h of [hk * 0.33, hk * 0.66]) strokeL([W.at(sm + sg * rs, h), W.at(sm + sg * (rs + t / WALL_LEN), h)], col.line, 0.8);   // Fugen der Pfeiler
    const seg = [];                                                       // Schlussstein: der Keilstein im Scheitel heller (im Ring, nichts steht über)
    for (let i = 7; i <= 9; i++) { const a = Math.PI - i * Math.PI / n; seg.push(W.at(sm + Math.cos(a) * (rs + t / WALL_LEN), hk + Math.sin(a) * (rh + t))); }
    for (let i = 9; i >= 7; i--) { const a = Math.PI - i * Math.PI / n; seg.push(W.at(sm + Math.cos(a) * rs, hk + Math.sin(a) * rh)); }
    fill(seg, col.top);
    for (const i of [7, 9]) { const a = Math.PI - i * Math.PI / n, c = Math.cos(a), sn = Math.sin(a); strokeL([W.at(sm + c * rs, hk + sn * rh), W.at(sm + c * (rs + t / WALL_LEN), hk + sn * (rh + t))], col.line, 0.8); }
    strokeL(outer.slice(1, -1), col.dark, 0.7);
  }
  // Mauerwerk aus Quadern auf einer Fläche (s0 … s1, h0 … h1)
  function ashlar(W, s0, s1, h0, h1, rows, cols, col) {
    fill([W.at(s0, h0), W.at(s0, h1), W.at(s1, h1), W.at(s1, h0)], col.face);
    for (let k = 1; k < rows; k++) { const h = h0 + (h1 - h0) * k / rows; strokeL([W.at(s0, h), W.at(s1, h)], col.line, 0.8); }
    for (let k = 0; k < rows; k++) {
      const ha = h0 + (h1 - h0) * k / rows, hb = h0 + (h1 - h0) * (k + 1) / rows, off = k % 2 ? 0.5 / cols : 0;
      for (let i = 0; i <= cols; i++) { const s = s0 + (s1 - s0) * (i / cols + off); if (s > s0 + 0.01 && s < s1 - 0.01) strokeL([W.at(s, ha), W.at(s, hb)], col.line, 0.8); }
    }
  }

  // --- die Portale ---
  const S0 = 0.2, S1 = 0.8;                                              // Öffnung: 0,6 Feld breit (Gleisbett ±0,23, Wagen ±0,19)
  function portal(n, P, side, H, kind) {
    const W = wallMap(P, side), lipH = HILL_STY[kind].lipH;
    if (n === 0 || n === 5) {                                            // A: Steinbogen, Ring aus Keilsteinen
      const hk = 7, hole = archPts(W.at, S0, S1, hk);
      inside(W, hole, S0, S1, H);
      ring(W, S0, S1, hk, 2.6);
    } else if (n === 1) {                                                // B: ganze Wand des Felds als Portalmauer, Gesims unter der Grasnarbe
      const hk = 7, top = H - lipH - 0.6;
      ashlar(W, 0, 1, 0, top, 5, 4, { face: '#cfc6b3', line: 'rgba(90,75,55,0.4)' });
      fill([W.at(-0.004, top - 1.6), W.at(-0.004, top), W.at(1.004, top), W.at(1.004, top - 1.6)], STONE.top);   // Gesims
      strokeL([W.at(0, top - 1.6), W.at(1, top - 1.6)], STONE.dark, 0.7);
      for (const s of [0.035, 0.965]) fill([W.at(s - 0.035, 0), W.at(s - 0.035, top - 1.6), W.at(s + 0.035, top - 1.6), W.at(s + 0.035, 0)], STONE.dark);   // Kanten
      const hole = archPts(W.at, S0, S1, hk);
      inside(W, hole, S0, S1, H);
      ring(W, S0, S1, hk, 2.2);
    } else if (n === 2) {                                                // C: rau ausgebrochene Öffnung, Grubenholz (2 Pfosten, Kappe)
      const r = i => hash(n * 31, i, 77), pts = [W.at(S0 - 0.04, 0)];
      for (let i = 0; i <= 10; i++) { const a = Math.PI - i * Math.PI / 10; pts.push(W.at(0.5 + Math.cos(a) * (0.34 + r(i) * 0.04), 6 + Math.sin(a) * (12 + r(i + 20) * 2.5))); }
      pts.push(W.at(S1 + 0.04, 0));
      fill(pts, '#7a6f63');                                              // Ausbruch (Fels, dunkler)
      const hole = rectPts(W.at, S0 + 0.02, S1 - 0.02, 16.5);
      inside(W, hole, S0 + 0.02, S1 - 0.02, H);
      const WOOD = '#8a5a3a', WD = '#6f4529', pw = 0.045;
      for (const s of [S0 + 0.02, S1 - 0.02]) { fill([W.at(s - pw, 0), W.at(s - pw, 17), W.at(s + pw, 17), W.at(s + pw, 0)], WOOD); strokeL([W.at(s + pw, 0), W.at(s + pw, 17)], WD, 0.7); }
      fill([W.at(S0 - 0.06, 16), W.at(S0 - 0.06, 19.2), W.at(S1 + 0.06, 19.2), W.at(S1 + 0.06, 16)], WOOD);   // Kappe
      strokeL([W.at(S0 - 0.06, 16), W.at(S1 + 0.06, 16)], WD, 0.8);
      const lp = W.at(S1 + 0.1, 14);                                      // kleine Laterne
      g.fillStyle = C('#3e3a35'); g.fillRect(lp[0] - 1, lp[1] - 3, 2, 4); g.fillStyle = C('#ffd56a'); g.fillRect(lp[0] - 0.8, lp[1] - 2.4, 1.6, 2);
    } else if (n === 3) {                                                // D: nur die Öffnung, ein schmaler dunkler Rand in Wandfarbe
      const hk = 7, hole = archPts(W.at, S0, S1, hk);
      fill(archPts(W.at, S0, S1, hk, 1.3), HILL_STY[kind].u);
      inside(W, hole, S0, S1, H);
    } else {                                                             // E: Rechteckportal: Pfeiler und Sturz aus hellem Stein
      const h1 = 15.5, hole = rectPts(W.at, S0, S1, h1), pw = 0.07;
      inside(W, hole, S0, S1, H);
      for (const [a, b] of [[S0 - pw, S0], [S1, S1 + pw]]) { fill([W.at(a, 0), W.at(a, h1), W.at(b, h1), W.at(b, 0)], STONE.face); strokeL([W.at(a, h1 / 2), W.at(b, h1 / 2)], STONE.line, 0.8); }
      fill([W.at(S0 - pw - 0.03, h1), W.at(S0 - pw - 0.03, h1 + 4.2), W.at(S1 + pw + 0.03, h1 + 4.2), W.at(S1 + pw + 0.03, h1)], STONE.top);   // Sturz
      strokeL([W.at(S0 - pw - 0.03, h1), W.at(S1 + pw + 0.03, h1)], STONE.dark, 0.8);
      const pl = [W.at(0.42, h1 + 1.2), W.at(0.42, h1 + 3), W.at(0.58, h1 + 3), W.at(0.58, h1 + 1.2)];
      fill(pl, '#6f7682');                                               // Schild (Name des Tunnels)
    }
  }

  // Öffnung auf dem Bildschirm (wie im Bildchen der Anhöhe, aber über toScreen)
  function holeScreen(bp) {
    const z = cam.z, at = bp.side === 'v'
      ? (s, h) => { const p = toScreen(bp.px - 0.5 + s, bp.py + 0.5); return [p.x, p.y - h * z]; }
      : (s, h) => { const p = toScreen(bp.px + 0.5, bp.py + 0.5 - s); return [p.x, p.y - h * z]; };
    return archPts((s, h) => { const q = at(s, h / 1); return q; }, S0, S1, 7).map(([x, y], i, A) => i === 0 || i === A.length - 1 ? [x, y + 0.6 * z] : [x, y]);
  }
  let off = null;
  function drawCarPortal(car, z, now) {
    const bp = car.bp, la = car.len / 2, c = bp.side === 'v' ? car.py : car.px, aw = c - bp.wall;   // a > aw: im Berg (Fahrtrichtung zur Wand)
    if (aw < la) {
      if (!off || off.width !== canvas.width || off.height !== canvas.height) { off = document.createElement('canvas'); off.width = canvas.width; off.height = canvas.height; }
      const o = off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height); o.setTransform(g.getTransform());
      const prev = g; g = o;
      try { car.cut = [Math.max(-la, aw), la]; drawTrainCarBody(car, z, now); } finally { g = prev; }
      // nach hinten dunkel wie das Gleis im Tunnel (gleicher Verlauf über die Tiefe)
      const d0 = bp.side === 'v' ? toScreen(bp.px, bp.wall) : toScreen(bp.wall, bp.py), d1 = bp.side === 'v' ? toScreen(bp.px, bp.wall - 0.7) : toScreen(bp.wall - 0.7, bp.py);
      const gr = o.createLinearGradient(d0.x, d0.y, d1.x, d1.y);
      gr.addColorStop(0, 'rgba(30,26,22,0.05)'); gr.addColorStop(0.35, 'rgba(30,26,22,0.6)'); gr.addColorStop(1, 'rgba(30,26,22,0.97)');
      o.globalCompositeOperation = 'source-atop'; o.fillStyle = gr; o.fillRect(-1e4, -1e4, 3e4, 3e4); o.globalCompositeOperation = 'source-over';
      g.save();
      try { path(holeScreen(bp)); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(off, 0, 0); } finally { g.restore(); }
    }
    // erst das Stück im Berg, dann das draußen darüber: dessen Seiten decken die Schnittfläche an der Wand (sonst stünde dort eine Stirn mit Fenster)
    if (aw > -la) { car.cut = [-la, Math.min(la, aw)]; drawTrainCarBody(car, z, now); }
    car.cut = null;
  }

  function patched(fn) {
    Object.assign(O, { paintHill, railArmsHill, trainCars, trainTunnelCut, drawTrainCar });
    window.trainCars = () => (base && !window.bergportalOhneZug ? base.cars : []);
    window.trainTunnelCut = m => {                                        // Wagen an der Wand: mit dem Gleisfeld davor (nach dem Portalfeld)
      if (!m.bp) return O.trainTunnelCut(m);
      const c = m.bp.side === 'v' ? m.py : m.px;
      return { k: c - m.bp.wall < 0.5 ? m.bp.front : Math.round(m.px) + ',' + Math.round(m.py), cut: null, portal: null };
    };
    window.drawTrainCar = (car, zz, now) => car.bp ? drawCarPortal(car, zz, now) : O.drawTrainCar(car, zz, now);
    window.paintHill = (x, y, h) => {
      O.paintHill(x, y, h);
      const p = PORT.get(x + ',' + y);
      if (!p) return;
      const P = (u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up];
      portal(p.n, P, p.side, (h.h || 1) * HILL_H, hillWall(h));
    };
    window.railArmsHill = (x, y, e) => {                                 // railArms selbst ist const – mit Anhöhen fragt es railArmsHill
      const a = O.railArmsHill(x, y, e), f = FRONT.get(x + ',' + y);
      return f && !a.some(([dx, dy]) => dx === f[0] && dy === f[1]) ? [...a, f] : a;
    };
    const clear = () => { for (const e of hillSprites.values()) freeCanvas(e.c); hillSprites.clear(); };
    const me0 = state.me; state.me = { ...(me0 || {}), off: true }; bubble = null;
    clear(); groundVersion++;
    try { return fn(); } finally { Object.assign(window, O); state.me = me0; groundVersion++; clear(); }
  }

  function setup() {
    for (const [ox, oy] of ORIG) for (let y = oy - 6; y <= oy + 10; y++) for (let x = ox - 4; x <= ox + 10; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'wiese'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    PORT.clear(); FRONT.clear();
    const spots = [], cars = [];
    VARS.forEach(([, , kind, n, side, train], i) => {
      const [ox, oy] = ORIG[i], w = HILL_WALLS.indexOf(kind);
      for (let y = oy; y <= oy + 3; y++) for (let x = ox; x <= ox + 4; x++) state.hills.set(x + ',' + y, { w });
      // Portal: +y in der Vorderwand des mittleren Randfelds (Gleis nach +y), +x in der rechten Wand (Gleis nach +x)
      const [px, py, Du, Dv] = side === 'v' ? [ox + 2, oy + 3, 0, 1] : [ox + 4, oy + 2, 1, 0];
      PORT.set(px + ',' + py, { n, side });
      FRONT.set((px + Du) + ',' + (py + Dv), [-Du, -Dv]);
      for (let k = 1; k <= 4; k++) state.tiles.set((px + Du * k) + ',' + (py + Dv * k), { b: 'schiene', lvl: 1 });
      for (let k = 1; k <= 4; k++) state.tiles.set((px + Du * 4 + Dv * k) + ',' + (py + Dv * 4 + Du * k), { b: 'schiene', lvl: 1 });
      for (const [u, v] of [[0, 0], [4, 0], [1, 2], [3, 1]]) if (!PORT.has((ox + u) + ',' + (oy + v))) buildSmall('baum', ox + u, oy + v, CSLOT);
      // Wand (Ebene): Punkt (wx, wy) der Wand; der Zug fährt hinein (Richtung −Du, −Dv), der vordere Wagen steckt mit gut der Hälfte im Berg
      const wall = side === 'v' ? py + 0.5 : px + 0.5;
      if (train) {
        const TR = { kind: { ...TRAIN_KIND.regio, n: 2 }, model: 'regio', col: 0, powered: true }, step = TR.kind.len + TR.kind.gap;
        for (let j = 0; j < 2; j++) {
          const c = wall - 0.12 + j * step;                                // Mitte des Wagens längs der Strecke (Koordinate quer zur Wand)
          cars.push({ bp: { px, py, side, n, wall, front: (px + Du) + ',' + (py + Dv) }, train: TR, px: side === 'v' ? px : c, py: side === 'v' ? c : py,
            du: -Du, dv: -Dv, i: j, n: 2, len: TR.kind.len });
        }
      }
      spots.push([px + Du * 0.6, py + Dv * 0.6]);
    });
    base = { spots, cars };
    recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
  }

  function shot(cxW, cyW, zz, Cs, up = 0) {
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; if (typeof meFigs !== 'undefined') meFigs.length = 0;
    const now = performance.now();
    spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const comp = document.createElement('canvas'); comp.width = Cs; comp.height = Cs;
    const c2 = comp.getContext('2d'); c2.fillStyle = '#fffaf0'; c2.fillRect(0, 0, Cs, Cs);
    if (typeof GL !== 'undefined' && GL.shown && GL.canvas.width) c2.drawImage(GL.canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    c2.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return comp;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };

  window.bergportalSetup = setup;
  window.bergportalBild = async (name = 'bergportal-varianten.png', zz = 4, Cs = 640, cols = 3) => {
    setup();
    const rows = Math.ceil(VARS.length / cols), sheet = document.createElement('canvas');
    sheet.width = cols * (Cs + 20); sheet.height = rows * (Cs + 60);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    patched(() => VARS.forEach(([L, name2], n) => {
      const [cx, cy] = base.spots[n], comp = shot(cx, cy, zz, Cs, HILL_H * 0.45);
      const X = (n % cols) * (Cs + 20), Y = Math.floor(n / cols) * (Cs + 60) + 45;
      sx.drawImage(comp, X, Y);
      sx.font = '800 28px Nunito, system-ui'; sx.fillStyle = '#6b4f3a';
      sx.fillText(`${L}  ${name2}`, X + 8, Y - 12);
    }));
    return post(name, sheet);
  };
  window.bergportalWeit = async (name = 'bergportal-weit.png', zz = 1.6, Cs = 1100) => {
    if (!base) setup();
    let comp;
    patched(() => { comp = shot(13, 9, zz, Cs, 0); });
    return post(name, comp);
  };
  return 'ok';
})();
