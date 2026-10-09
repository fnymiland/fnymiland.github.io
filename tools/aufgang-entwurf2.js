// Entwurf 2 (Nutzer, 09.10.2026: „Nur C. Aber auch ein Aufgang zwischen den Überdachungen – Decke offen, Treppe runter. Oben ein
// Zaun oder eine Mauer wie bei C, die rumgeht“): Freitreppe C mit drei Brüstungen oben (Mauer, Balustrade, Geländer) und eine Treppe
// durch eine Öffnung im Dach. Nur als Bild über dem Spielbild. Im Browser (?probe):
// fetch('tools/aufgang-entwurf2.js').then(r => r.text()).then(t => (0, eval)(t)); await aufgang2Bild('aufgang-varianten2.png')
(function aufgangEntwurf2() {
  for (let y = -14; y <= 12; y++) for (let x = -16; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const SPOTS = [[-12, -10], [-4, -10], [-12, -2], [-4, -2]];
  SPOTS.forEach(([ox, oy], n) => {
    state.paintNew.dach = { form: 3 };
    setTool('dach');
    startPlan('rect', { x: ox, y: oy }, { x: ox + 2, y: oy + 1 }, true); runPlan();
    for (let y = oy; y <= oy + 1; y++) for (let x = ox; x <= ox + 2; x++) state.roofs.get(x + ',' + y).bel = 'm:verband:beige';
    buildRoofTop('bank', ox, oy, 5); if (n < 3) buildRoofTop('baum', ox + 2, oy + 1, 1);
    if (n < 3) { buildRoofTop('blumentopf', ox + 2, oy, 1); buildRoofTop('laterne', ox, oy + 1, 2); }
  });
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;

  const H = ROOF_H, TOP = '#e8dec9', SU = '#b3a283', SV = '#c8b896', LINE = '#9c8b6c';
  const P = (u, v, up = 0) => { const s = toScreen(u, v); return [s.x, s.y - up * cam.z]; };
  const quad = (pts, col, line = LINE) => { poly(pts, col); if (line) { g.strokeStyle = line; g.lineWidth = 0.6 * cam.z; g.lineJoin = 'round'; g.stroke(); } };
  const box3 = (u0, u1, v0, v1, h0, h1, top = TOP, faces = 'uv') => {
    if (faces.includes('v')) quad([P(u0, v1, h0), P(u1, v1, h0), P(u1, v1, h1), P(u0, v1, h1)], SV);
    if (faces.includes('u')) quad([P(u1, v0, h0), P(u1, v1, h0), P(u1, v1, h1), P(u1, v0, h1)], SU);
    quad([P(u0, v0, h1), P(u1, v0, h1), P(u1, v1, h1), P(u0, v1, h1)], top);
  };
  const line = (pts, col, w = 1) => { g.strokeStyle = col; g.lineWidth = w * cam.z; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  // Freitreppe C (gewählt)
  function stairC(ox, oy) {
    const E = oy + 1 + RW, a = ox + 0.62, b = ox + 1.38, w = 0.06, n = 10, vL = E + 0.12, dv = 1.0 / n, vEnd = vL + n * dv;
    const cheek = (c0, c1) => {
      quad([P(c1, E, 0), P(c1, vEnd, 0), P(c1, vEnd, 6), P(c1, vL, H + 6), P(c1, E, H + 6)], SU);
      quad([P(c0, E, H + 6), P(c1, E, H + 6), P(c1, vL, H + 6), P(c1, vEnd, 6), P(c0, vEnd, 6), P(c0, vL, H + 6)], TOP);
      quad([P(c0, vEnd, 0), P(c1, vEnd, 0), P(c1, vEnd, 6), P(c0, vEnd, 6)], SV);
    };
    cheek(a - w, a);
    box3(a, b, E, vL, 0, H);
    for (let i = 1; i <= n; i++) box3(a, b, vL + (i - 1) * dv, vL + i * dv, 0, H * (n - i + 0.6) / n);
    cheek(b, b + w);
    return { gap: ['v', a - w, b + w], on: [[(a + b) / 2 - 0.12, vL + 0.45 * n * dv, H * 0.5], [(a + b) / 2 + 0.15, vL + 0.75 * n * dv, H * 0.22]] };
  }
  // Brüstung ringsum (Rand des Dachs u0…u1 × v0…v1), Lücke dort, wo ein Aufgang ankommt. hinten: vor den Figuren, vorn: danach
  const PAR = {
    mauer: { name: 'Mauer (wie die Treppenwangen)', h: 6 },
    balustrade: { name: 'Balustrade mit Säulchen', h: 7 },
    gelaender: { name: 'Geländer', h: 7 },
  };
  function parapet(kind, u0, u1, v0, v1, gap, part, hh = 0, openBack = false) {
    const t = 0.06, h = hh || PAR[kind].h;
    const runs = [];                                                       // [Achse, fest, von, bis, Seite nach innen]
    if (part === 'back') { if (!openBack) runs.push(['v', v0, u0, u1, +1]); runs.push(['u', u0, v0, v1, +1]); }
    else { runs.push(['u', u1, v0, v1, -1], ['v', v1, u0, u1, -1]); }
    for (const [ax, at, a, b, inw] of runs) {
      const segs = gap && gap[0] === ax && at === (ax === 'v' ? v1 : u1) ? [[a, gap[1]], [gap[2], b]] : [[a, b]];
      for (const [s0, s1] of segs) {
        const lo = inw > 0 ? at : at - t, hi = inw > 0 ? at + t : at;
        const B = (p0, p1, h0, h1, col) => ax === 'v' ? box3(p0, p1, lo, hi, h0, h1, col) : box3(lo, hi, p0, p1, h0, h1, col);
        if (kind === 'mauer') B(s0, s1, H, H + h);
        else if (kind === 'balustrade') {
          for (let p = s0 + 0.06; p < s1 - 0.03; p += 0.09) {                 // Säulchen
            const c = (lo + hi) / 2, q0 = P(ax === 'v' ? p : c, ax === 'v' ? c : p, H + 1.2), q1 = P(ax === 'v' ? p : c, ax === 'v' ? c : p, H + h - 1.2);
            line([q0, q1], '#d7cbb2', 2.1); line([[q0[0] - 0.35 * cam.z, q0[1]], [q1[0] - 0.35 * cam.z, q1[1]]], '#efe7d6', 0.8);
          }
          B(s0, s1, H, H + 1.2); B(s0, s1, H + h - 1.2, H + h);
        } else {
          for (let p = s0 + 0.03; p <= s1 - 0.02; p += 0.2) { const c = (lo + hi) / 2; line([P(ax === 'v' ? p : c, ax === 'v' ? c : p, H), P(ax === 'v' ? p : c, ax === 'v' ? c : p, H + h)], '#4f4a44', 0.9); }
          const c = (lo + hi) / 2;
          for (const hh of [h, h * 0.5]) line([P(ax === 'v' ? s0 : c, ax === 'v' ? c : s0, H + hh), P(ax === 'v' ? s1 : c, ax === 'v' ? c : s1, H + hh)], '#4f4a44', hh === h ? 1.1 : 0.6);
        }
      }
    }
  }
  // Treppe durch eine Öffnung im Dach (Feld ox+1, oy): Loch mit Brüstung, darin die Stufen nach unten (bis unters Dach)
  function hole(ox, oy) {
    const cu = ox + 1, cv = oy + 0.5, u0 = cu - 0.3, u1 = cu + 0.3, v0 = cv - 0.75, v1 = cv + 0.75, hRim = H - 2.5;
    const rim = [P(u0, v0, H), P(u1, v0, H), P(u1, v1, H), P(u0, v1, H)];
    g.save(); g.beginPath(); rim.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.clip();
    poly([P(u0 - 1, v0 - 1, 0), P(u1 + 1, v0 - 1, 0), P(u1 + 1, v1 + 1, 0), P(u0 - 1, v1 + 1, 0)], '#6b8f52');   // Boden darunter (im Schatten)
    const n = 12, a = u0 + 0.07, b = u1 - 0.07, len = 1.6, dv = len / n;   // Stufen von der hinteren Kante nach vorn hinunter
    for (let i = 0; i < n; i++) box3(a, b, v0 + i * dv, v0 + (i + 1) * dv, 0, H * (n - i - 0.4) / n, TOP);
    quad([P(u0, v0, hRim), P(u0, v1, hRim), P(u0, v1, H), P(u0, v0, H)], SU);          // Lochwände hinten (Dachstärke)
    quad([P(u0, v0, hRim), P(u1, v0, hRim), P(u1, v0, H), P(u0, v0, H)], SV);
    g.restore();
    return { u0, u1, v0, v1, on: [[cu - 0.05, v0 + 0.3, H * 0.8], [cu + 0.08, v0 + 0.7, H * 0.55]] };
  }
  const fig = (i, u, v, up, z, now) => {
    const w = { px: u, py: v, kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    g.save(); g.translate(0, -up * z); try { drawWalker(w, z, now); } finally { g.restore(); }
  };
  const PANELS = [['1', 'Freitreppe + Mauer', 'mauer'], ['2', 'Freitreppe + Balustrade', 'balustrade'], ['3', 'Freitreppe + Geländer', 'gelaender'], ['4', 'Treppe durch die Dachöffnung (+ Mauer)', 'hole']];
  window.aufgang2Bild = async (name, z = 2.0) => {
    const C = 900, sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 110;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let n = 0; n < 4; n++) {
      const [ox, oy] = SPOTS[n], p = iso(ox + 1.3, oy + 1.2); cam.x = p.x; cam.y = p.y - 6; cam.z = n === 3 ? z * 1.3 : z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const now = performance.now();
      g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const U0 = ox - RW, U1 = ox + 2 + RW, V0 = oy - RW, V1 = oy + 1 + RW, kind = PANELS[n][2] === 'hole' ? 'mauer' : PANELS[n][2];
      const ho = PANELS[n][2] === 'hole' ? hole(ox, oy) : null;
      if (ho) { parapet('mauer', ho.u0, ho.u1, ho.v0, ho.v1, null, 'back', 3.5, true); ho.on.forEach(([u, v, up], i) => fig(i + 5, u, v, up, z, now)); }   // Brüstung am Loch: hintere Ränder, dann wer auf der Treppe steht
      parapet(kind, U0, U1, V0, V1, null, 'back');
      [[ox + 0.3, oy + 0.1], [ox + 1.6, oy + 0.85], [ox + 2.1, oy - 0.1]].forEach(([u, v], i) => fig(i + n, u, v, H, z, now));
      if (ho) parapet('mauer', ho.u0, ho.u1, ho.v0, ho.v1, null, 'front', 3.5);
      let gap = null, on = [];
      if (!ho) ({ gap, on } = stairC(ox, oy));
      parapet(kind, U0, U1, V0, V1, gap, 'front');
      on.forEach(([u, v, up], i) => fig(i + 3 + n, u, v, up, z, now));
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 55) + 50;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2 - 40, C, C, X, Y, C, C);
      sx.font = '800 34px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${PANELS[n][0]}  ${PANELS[n][1]}`, X + 10, Y - 12);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return url.slice(0, 40); }
  };
  return 'ok';
})();
