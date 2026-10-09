// Konzept (Nutzer, 09.10.2026: „zeig mal A nur als Konzept“): begehbare Anhöhe als Natur-Plateau – nur als Bild über das fertige
// Spielbild gezeichnet, nichts davon ist im Spiel. Im Browser (Bild-Sammler scratchpad/sink.py an):
// fetch('tools/anhoehe-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await anhoeheBild('anhoehe-konzept.png')
(function anhoeheEntwurf() {
  const HH = 26;                                                          // Höhe wie die Steinarkaden (eine Ebene)
  const FOOT = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]];   // 4×3, vorn links eine Ecke frei
  const VARS = [
    ['A', 'Felswand', 'fels', false],
    ['B', 'Erde mit Grasnarbe', 'erde', false],
    ['C', 'Trockenmauer', 'mauer', false],
    ['D', 'Felswand mit Bahntunnel', 'fels', true],
  ];
  const STY = {
    fels: { v: '#a69a8c', u: '#8a7f73', line: 'rgba(70,60,50,0.35)', lip: '#86c35b' },
    erde: { v: '#a57a52', u: '#8a6342', line: 'rgba(60,40,25,0.35)', lip: '#7fbf55' },
    mauer: { v: '#cbbda4', u: '#b2a48b', line: 'rgba(90,75,55,0.45)', lip: '#8fcf68' },
  };
  let ox = 0, oy = 0, z = 1;
  const P = (u, v, up = 0) => { const s = toScreen(ox + u, oy + v); return [s.x, s.y - up * z]; };
  const rnd = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const fill = (pts, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w * z; g.lineCap = 'round'; g.stroke(); };
  const inSet = (x, y) => FOOT.some(([a, b]) => a === x && b === y);
  // eine sichtbare Wand: von (a0, b0) nach (a1, b1) am Boden, dir 'u' (Seite nach +x) oder 'v' (nach +y)
  function wall(a0, b0, a1, b1, dir, kind) {
    const S = STY[kind], col = dir === 'u' ? S.u : S.v, at = (s, h) => P(a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, h);
    fill([at(0, 0), at(1, 0), at(1, HH), at(0, HH)], col);
    g.save(); g.beginPath(); [at(0, 0), at(1, 0), at(1, HH), at(0, HH)].forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
    if (kind === 'fels') {                                               // Schichten und Risse
      for (let r = 1; r < 5; r++) { const pts = []; for (let i = 0; i <= 6; i++) pts.push(at(i / 6, r * HH / 5 + (rnd(a0 + i, r) - 0.5) * 3)); line(pts, S.line, 0.9); }
      for (let c = 0; c < 3; c++) { const s = 0.2 + 0.3 * c + rnd(a0, c) * 0.1; line([at(s, HH * 0.85), at(s + 0.05, HH * 0.55), at(s - 0.02, HH * 0.3)], S.line, 0.8); }
    } else if (kind === 'erde') {                                        // Wurzeln und Steinchen
      for (let c = 0; c < 4; c++) { const s = 0.15 + 0.22 * c; line([at(s, HH - 3), at(s + 0.03, HH - 8 - rnd(a0, c) * 6)], 'rgba(70,45,25,0.5)', 0.7); }
      for (let c = 0; c < 6; c++) { const p = at(rnd(a0 + c, b0) * 0.9 + 0.05, 3 + rnd(c, a0) * (HH - 10)); g.beginPath(); g.ellipse(p[0], p[1], 1.6 * z, 1.1 * z, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(200,185,160,0.8)'; g.fill(); }
    } else {                                                             // Trockenmauer: Steine im Verband
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        const h0 = r * HH / rows, h1 = (r + 1) * HH / rows, n = 4, off = r % 2 ? 0.5 / n : 0;
        line([at(0, h1), at(1, h1)], S.line, 0.9);
        for (let i = 0; i <= n; i++) { const s = i / n + off; if (s > 0 && s < 1) line([at(s, h0), at(s, h1)], S.line, 0.9); }
      }
    }
    g.restore();
    // Grasnarbe oben (wellig)
    const lip = [];
    for (let i = 0; i <= 10; i++) lip.push(at(i / 10, HH + 0.4));
    for (let i = 10; i >= 0; i--) lip.push(at(i / 10, HH - (kind === 'erde' ? 4 : 2.2) - rnd(a0 + i, b0 + 3) * (kind === 'erde' ? 3 : 1.5)));
    fill(lip, STY[kind].lip);
  }
  function plateau(kind) {
    const faces = [];
    for (const [x, y] of FOOT) {
      if (!inSet(x + 1, y)) faces.push({ a0: x + 0.5, b0: y - 0.5, a1: x + 0.5, b1: y + 0.5, dir: 'u', d: x + 0.5 + y });
      if (!inSet(x, y + 1)) faces.push({ a0: x - 0.5, b0: y + 0.5, a1: x + 0.5, b1: y + 0.5, dir: 'v', d: x + y + 0.5 });
    }
    faces.sort((p, q) => p.d - q.d);
    for (const f of faces) wall(f.a0, f.b0, f.a1, f.b1, f.dir, kind);
    for (const [x, y] of FOOT) fill([P(x - 0.5, y - 0.5, HH), P(x + 0.5, y - 0.5, HH), P(x + 0.5, y + 0.5, HH), P(x - 0.5, y + 0.5, HH)], (x + y) % 2 ? '#a9dd80' : '#a2d879');
    for (const [x, y] of FOOT) {                                         // Kante oben: etwas dunkler, damit man die Höhe auch hinten sieht
      if (!inSet(x - 1, y)) line([P(x - 0.5, y - 0.5, HH), P(x - 0.5, y + 0.5, HH)], '#6faa4c', 1.6);
      if (!inSet(x, y - 1)) line([P(x - 0.5, y - 0.5, HH), P(x + 0.5, y - 0.5, HH)], '#6faa4c', 1.6);
    }
  }
  function shadow() {                                                    // weicher Schatten am Boden (Sonne von links)
    for (const [x, y] of FOOT) fill([P(x - 0.5, y - 0.5), P(x + 1.3, y - 0.5), P(x + 1.3, y + 0.5), P(x - 0.5, y + 0.5)], 'rgba(40,70,30,0.10)');
  }
  const box = (u0, u1, v0, v1, h0, h1, top, sideV, sideU) => {
    fill([P(u0, v1, h0), P(u1, v1, h0), P(u1, v1, h1), P(u0, v1, h1)], sideV);
    fill([P(u1, v0, h0), P(u1, v1, h0), P(u1, v1, h1), P(u1, v0, h1)], sideU);
    fill([P(u0, v0, h1), P(u1, v0, h1), P(u1, v1, h1), P(u0, v1, h1)], top);
  };
  // Treppe aus Steinstufen vor der vorderen Wand von Feld (2, 2), nach vorn hinunter
  function stairs(kind) {
    const E = 2.5, n = 8, dv = 0.11, u0 = 1.72, u1 = 2.28, top = kind === 'erde' ? '#cdbb9a' : '#d8ccb6';
    for (let i = 1; i <= n; i++) box(u0, u1, E + (i - 1) * dv, E + i * dv, 0, HH * (n - i + 0.5) / n, top, '#b9ab92', '#a3957d');
    return [[2.0, E + 0.45, HH * 0.55], [2.05, E + 0.75, HH * 0.25]];
  }
  // Tunnelportal in der rechten Wand von Feld (3, 1), Gleis hinein
  function portal() {
    const x = 3.5, c = 1, w = 0.26, at = (b, h) => P(x, c + b, h);
    for (const s of [-0.1, 0.1]) line([P(x, c + s, 0), P(x + 2.6, c + s, 0)], '#6d6a66', 1.4);
    for (let i = 0; i < 9; i++) { const u = x + 0.1 + i * 0.28; line([P(u, c - 0.16, 0), P(u, c + 0.16, 0)], '#8a6a4a', 1.6); }
    const arch = (ww, hh, rise, col) => { const pts = [at(-ww, 0)]; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; pts.push(at(-ww * Math.cos(a), hh + Math.sin(a) * rise)); } pts.push(at(ww, 0)); fill(pts, col); };
    arch(w + 0.07, 11, 8, '#c9bda7');                                     // Steinbogen
    arch(w, 10, 6.5, '#2c2724');                                          // Öffnung
    for (const s of [-0.1, 0.1]) line([P(x, c + s, 0), P(x - 0.3, c + s, 0)], '#4a4744', 1.2);
  }
  const fig = (i, u, v, up, now) => {
    const w = { px: ox + u, py: oy + v, kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    g.save(); g.translate(0, -up * z); try { drawWalker(w, z, now); } finally { g.restore(); }
  };
  const decoTop = (b, u, v, now, rot = 0) => { const p = P(u, v, HH); drawSmallOne(b, rot, p[0], p[1], z, now, Math.round(ox + u), Math.round(oy + v), 1, 0, 0, 0); };
  window.anhoeheBild = async (name = 'anhoehe-konzept.png', zz = 2.1) => {
    const c0 = toTile(W / 2, H / 2 + 200), bx = c0.x - 20, by = c0.y;
    for (let y = by - 4; y <= by + 6; y++) for (let x = bx - 4; x <= bx + 40; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); }
    for (const k of [...state.edges.keys()]) { const [x, y] = keyXY(k.slice(1)); if (x >= bx - 4 && x <= bx + 40 && y >= by - 4 && y <= by + 6) state.edges.delete(k); }
    recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
    const C = 900, sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 110;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let n = 0; n < 4; n++) {
      ox = bx + n * 10; oy = by; z = zz;
      // Weg zur Treppe und um die Anhöhe
      for (let x = ox - 1; x <= ox + 4; x++) state.tiles.set(x + ',' + (oy + 4), { b: 'weg', lvl: 1, style: 'kies' });
      state.tiles.set((ox + 2) + ',' + (oy + 3), { b: 'weg', lvl: 1, style: 'kies' });
      recalc(); groundVersion++;
      const p = iso(ox + 1.6, oy + 1.6); cam.x = p.x; cam.y = p.y - 14; cam.z = z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const now = performance.now();
      g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const [, , kind, tun] = VARS[n];
      shadow();
      plateau(kind);
      if (tun) portal();
      const onStairs = stairs(kind);
      decoTop('baum', 0.2, 0.1, now); decoTop('baum', 3.1, 0.0, now); decoTop('busch', 1.2, -0.25, now);
      decoTop('bank', 1.7, 1.0, now, 1); decoTop('laterne', 2.55, 1.6, now); decoTop('blumentopf', 0.2, 1.2, now);
      [[2.3, 0.6], [1.2, 1.3], [3.0, 1.9]].forEach(([u, v], i) => fig(i + n, u, v, HH, now));
      onStairs.forEach(([u, v, up], i) => fig(i + 4 + n, u, v, up, now));
      fig(7 + n, 2.6, 3.9, 0, now);
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 55) + 50;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C, C);
      sx.font = '800 34px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${VARS[n][0]}  ${VARS[n][1]}`, X + 10, Y - 12);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
