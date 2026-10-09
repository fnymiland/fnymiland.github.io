// Entwurf (Nutzer, 09.10.2026: „einen Aufgang, wo die Bewohner drauf rumlaufen können“) – vier Varianten des Aufgangs an
// Steinarkaden, nur als Bild (über das fertige Spielbild gezeichnet). Im Browser (?probe):
// fetch('tools/aufgang-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await aufgangBild('aufgang-varianten.png')
(function aufgangEntwurf() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const SPOTS = [[-12, -10], [-4, -10], [-12, -2], [-4, -2]];
  for (const [ox, oy] of SPOTS) {
    state.paintNew.dach = { form: 3 };
    setTool('dach');
    startPlan('rect', { x: ox, y: oy }, { x: ox + 2, y: oy + 1 }, true); runPlan();
    for (let y = oy; y <= oy + 1; y++) for (let x = ox; x <= ox + 2; x++) state.roofs.get(x + ',' + y).bel = 'm:verband:beige';
    buildRoofTop('bank', ox, oy, 5); buildRoofTop('blumentopf', ox + 2, oy, 1); buildRoofTop('baum', ox + 2, oy + 1, 1); buildRoofTop('laterne', ox, oy + 1, 2);
  }
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;

  const H = ROOF_H, TOP = '#e8dec9', SU = '#b3a283', SV = '#c8b896', LINE = '#9c8b6c';
  const P = (u, v, up = 0) => { const s = toScreen(u, v); return [s.x, s.y - up * cam.z]; };
  const quad = (pts, col) => { poly(pts, col); g.strokeStyle = LINE; g.lineWidth = 0.6 * cam.z; g.lineJoin = 'round'; g.stroke(); };
  const box3 = (u0, u1, v0, v1, h0, h1, top = TOP) => {
    quad([P(u0, v1, h0), P(u1, v1, h0), P(u1, v1, h1), P(u0, v1, h1)], SV);
    quad([P(u1, v0, h0), P(u1, v1, h0), P(u1, v1, h1), P(u1, v0, h1)], SU);
    quad([P(u0, v0, h1), P(u1, v0, h1), P(u1, v1, h1), P(u0, v1, h1)], top);
  };
  const rail = (pts, col = '#6e604a') => { g.strokeStyle = col; g.lineWidth = 1 * cam.z; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  // A: gerade Treppe längs der vorderen linken Kante, steigt nach hinten an (Stufen sichtbar), Mauerwange außen
  function stairA(ox, oy) {
    const E = oy + 1 + RW, v1 = E + 0.3, n = 11, u0 = ox - 0.3, uL = ox + 0.05, du = 1.55 / n;
    box3(u0, uL, E, v1, 0, H);                                                 // Podest oben
    for (let i = 1; i <= n; i++) box3(uL + (i - 1) * du, uL + i * du, E, v1, 0, H * (n - i + 0.6) / n);
    const top = [P(u0, v1, H + 5), P(uL, v1, H + 5), P(uL + n * du, v1, 5)];
    for (let i = 0; i <= n; i += 2) { const u = uL + i * du, h = H * (n - i + 0.6) / n; rail([P(u, v1 - 0.02, h), P(u, v1 - 0.02, h + 5)]); }
    rail([P(u0, v1 - 0.02, H + 5), P(uL, v1 - 0.02, H + 5), P(uL + n * du, v1 - 0.02, 0.6 * H / n + 5)]);
    return [[uL + 0.55 * n * du, E + 0.15, H * 0.45]];
  }
  // B: Treppenturm mit Wendeltreppe an der Kante: Tür unten, Fenster im Kreis, spitzes Dach; oben ein Durchgang aufs Dach
  function stairB(ox, oy) {
    const E = oy + 1 + RW, u0 = ox + 1.45, u1 = ox + 2.05, v0 = E + 0.02, v1 = E + 0.62, T = H + 12;
    box3(u0, u1, v0, v1, 0, T);
    const door = (fu, hb, ht, face, col = '#5b4a36') => {                     // Bogenöffnung auf der +v- bzw. +u-Seite
      const pts = [], m = 8;
      for (let k = 0; k <= m; k++) { const a = Math.PI * k / m, t = fu + Math.cos(Math.PI - a) * 0.08; const hh = ht + Math.sin(a) * 2.5;
        pts.push(face === 'v' ? P(t, v1, hh) : P(u1, t, hh)); }
      poly([face === 'v' ? P(fu - 0.08, v1, hb) : P(u1, fu - 0.08, hb), ...pts, face === 'v' ? P(fu + 0.08, v1, hb) : P(u1, fu + 0.08, hb)], col);
    };
    door((u0 + u1) / 2, 0, 7, 'v');
    for (const [f, h, face] of [[u0 + 0.15, 13, 'v'], [v0 + 0.3, 20, 'u'], [u1 - 0.15, 26, 'v']]) door(f, h, h + 2.5, face, '#7d6a50');
    const apex = P((u0 + u1) / 2, (v0 + v1) / 2, T + 14), c = [P(u0 - 0.04, v0 - 0.04, T), P(u1 + 0.04, v0 - 0.04, T), P(u1 + 0.04, v1 + 0.04, T), P(u0 - 0.04, v1 + 0.04, T)];
    quad([c[0], c[1], apex], '#b86a45'); quad([c[3], c[0], apex], '#d98a5e'); quad([c[1], c[2], apex], '#a85f3d'); quad([c[2], c[3], apex], '#c9774f');
    return [[(u0 + u1) / 2 + 0.02, v1 + 0.18, 0]];
  }
  // C: breite Freitreppe frontal aufs Dach, mit steinernen Wangen links und rechts
  function stairC(ox, oy) {
    const E = oy + 1 + RW, a = ox + 0.62, b = ox + 1.38, w = 0.06, n = 10, vL = E + 0.12, dv = 1.0 / n, vEnd = vL + n * dv;
    const cheek = (c0, c1) => {                                                 // Wange: oben schräg, Seite +u sichtbar
      quad([P(c1, E, 0), P(c1, vEnd, 0), P(c1, vEnd, 6), P(c1, vL, H + 6), P(c1, E, H + 6)], SU);
      quad([P(c0, E, H + 6), P(c1, E, H + 6), P(c1, vL, H + 6), P(c1, vEnd, 6), P(c0, vEnd, 6), P(c0, vL, H + 6)], TOP);
      quad([P(c0, vEnd, 0), P(c1, vEnd, 0), P(c1, vEnd, 6), P(c0, vEnd, 6)], SV);
    };
    cheek(a - w, a);
    box3(a, b, E, vL, 0, H);
    for (let i = 1; i <= n; i++) box3(a, b, vL + (i - 1) * dv, vL + i * dv, 0, H * (n - i + 0.6) / n);
    cheek(b, b + w);
    return [[(a + b) / 2 - 0.12, vL + 0.45 * n * dv, H * 0.5], [(a + b) / 2 + 0.15, vL + 0.75 * n * dv, H * 0.22]];
  }
  // D: flache Rampe längs der vorderen rechten Kante, auf Bögen, mit Geländer aus Pfosten und Handlauf
  function stairD(ox, oy) {
    const F = ox + 2 + RW, F2 = F + 0.3, vL = oy - 0.35, vT = oy + 0.05, vB = oy + 2.1;
    const h = v => v <= vT ? H : Math.max(0, H * (vB - v) / (vB - vT));
    quad([P(F2, vL, 0), P(F2, vB, 0), P(F2, vT, H), P(F2, vL, H)], SU);
    for (let k = 0; k < 4; k++) {                                              // Bögen in der Seitenwand
      const c0 = vT + 0.08 + k * 0.42, c1 = c0 + 0.3, top = Math.min(h(c0), h(c1)) - 4;
      if (top < 5) continue;
      const pts = []; for (let s = 0; s <= 8; s++) { const t = c0 + (c1 - c0) * s / 8; pts.push(P(F2, t, top - 4 + 4 * Math.sin(Math.PI * s / 8))); }
      poly([P(F2, c0, 0), ...pts, P(F2, c1, 0)], '#9e8f72');
    }
    quad([P(F, vL, H), P(F2, vL, H), P(F2, vT, H), P(F2, vB, 0), P(F, vB, 0), P(F, vT, H)], TOP);
    for (let v = vL + 0.05; v < vB; v += 0.22) rail([P(F2 - 0.02, v, h(v)), P(F2 - 0.02, v, h(v) + 6)], '#5d5448');
    const hr = []; for (let v = vL + 0.05; v <= vB; v += 0.05) hr.push(P(F2 - 0.02, v, h(v) + 6)); rail(hr, '#5d5448');
    return [[F + 0.13, oy + 1.0, h(oy + 1.0)]];
  }
  const VARS = [['A', 'Gerade Treppe an der Kante', stairA], ['B', 'Treppenturm (Wendeltreppe)', stairB], ['C', 'Freitreppe frontal', stairC], ['D', 'Rampe mit Geländer', stairD]];
  const fig = (i, u, v, up, z, now) => {                                       // Bewohner (wie im Spiel), um up angehoben
    const w = { px: u, py: v, kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    g.save(); g.translate(0, -up * z); try { drawWalker(w, z, now); } finally { g.restore(); }
  };
  window.aufgangBild = async (name, z = 2.3) => {
    const C = 900, sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 110;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let n = 0; n < 4; n++) {
      const [ox, oy] = SPOTS[n], p = iso(ox + 1.3, oy + 1.2); cam.x = p.x; cam.y = p.y - 6; cam.z = z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const now = performance.now();
      g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      [[ox + 0.3, oy + 0.1], [ox + 1.5, oy + 0.7], [ox + 1.1, oy - 0.2]].forEach(([u, v], i) => fig(i + n, u, v, H, z, now));   // oben auf dem Dach
      const on = VARS[n][2](ox, oy);
      on.forEach(([u, v, up], i) => fig(i + 3 + n, u, v, up, z, now));           // auf dem Aufgang
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 55) + 50;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2 - 40, C, C, X, Y, C, C);
      sx.font = '800 34px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${VARS[n][0]}  ${VARS[n][1]}`, X + 10, Y - 12);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return url.slice(0, 40); }
  };
  return 'ok';
})();
