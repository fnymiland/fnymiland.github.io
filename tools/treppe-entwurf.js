// Entwurf (Block 157d, Nutzer: „alles klar weiter“ – Treppe auf die Anhöhe): Varianten der Treppe am Fuß der Wand, nur als Bild über
// echte Anhöhen im Spiel gezeichnet. Im Browser (Bild-Sammler scratchpad/sink.py an):
// fetch('tools/treppe-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await treppeBild('treppe-varianten.png')
(function treppeEntwurf() {
  const VARS = [
    ['A', 'Steinstufen frei (wie im Konzept)', 0, 'frei'],
    ['B', 'Steinstufen mit Wangen', 0, 'wangen'],
    ['C', 'Erde: Holzstufen mit Pfosten', 1, 'holz'],
    ['D', 'Trockenmauer: gemauert mit Wangen', 2, 'mauer'],
  ];
  let ox = 0, oy = 0, z = 1;
  const P = (u, v, up = 0) => { const s = toScreen(ox + u, oy + v); return [s.x, s.y - up * z]; };
  const fill = (pts, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w * z; g.lineCap = 'round'; g.stroke(); };
  const box = (u0, u1, v0, v1, h0, h1, top, sv, su) => {
    fill([P(u0, v1, h0), P(u1, v1, h0), P(u1, v1, h1), P(u0, v1, h1)], sv);
    fill([P(u1, v0, h0), P(u1, v1, h0), P(u1, v1, h1), P(u1, v0, h1)], su);
    fill([P(u0, v0, h1), P(u1, v0, h1), P(u1, v1, h1), P(u0, v1, h1)], top);
  };
  // Treppe vor der vorderen Wand (+y) von Feld (sx, sy): Stufen laufen von der Wand (v = sy + 0.5) nach vorn hinunter
  function stairs(kind, sx, sy) {
    const H = HILL_H, E = sy + 0.5, n = 8, dv = 0.11, u0 = sx - 0.28, u1 = sx + 0.28, vEnd = E + n * dv;
    const C = { frei: ['#d8ccb6', '#b9ab92', '#a3957d'], wangen: ['#d8ccb6', '#b9ab92', '#a3957d'], holz: ['#b98a5a', '#9a6f45', '#86603b'], mauer: ['#d6c9b0', '#bfb198', '#a99b82'] }[kind];
    const cheek = (c0, c1, col) => {                                     // Wange: oben schräg
      fill([P(c1, E, 0), P(c1, vEnd, 0), P(c1, vEnd, 4), P(c1, E, H + 4)], col[2]);
      fill([P(c0, E, H + 4), P(c1, E, H + 4), P(c1, vEnd, 4), P(c0, vEnd, 4)], col[0]);
      fill([P(c0, vEnd, 0), P(c1, vEnd, 0), P(c1, vEnd, 4), P(c0, vEnd, 4)], col[1]);
    };
    const wall = kind === 'wangen' ? ['#c9bca6', '#ad9f88', '#978a74'] : kind === 'mauer' ? ['#cbbda4', '#b2a48b', '#9d8f77'] : null;
    if (wall) cheek(u0 - 0.07, u0, wall);
    for (let i = 1; i <= n; i++) {
      const v0 = E + (i - 1) * dv, v1 = E + i * dv, h = H * (n - i + 0.5) / n;
      if (kind === 'frei' && i > 1) box(u0, u1, v0, v1, 0, h, C[0], C[1], C[2]);
      else box(u0, u1, v0, v1, 0, h, C[0], C[1], C[2]);
      if (kind === 'holz') line([P(u0 + 0.02, v1, h), P(u1 - 0.02, v1, h)], '#6e4b2c', 0.8);   // Bohlenkante
      if (kind === 'mauer') line([P(u0, v1, h * 0.5), P(u1, v1, h * 0.5)], 'rgba(90,75,55,0.4)', 0.7);
    }
    if (kind === 'holz') {                                               // Pfosten mit Seil
      for (const u of [u0 - 0.03, u1 + 0.03]) {
        line([P(u, vEnd - 0.05, 0), P(u, vEnd - 0.05, 9)], '#7a5434', 1.6);
        line([P(u, E + 0.05, H), P(u, E + 0.05, H + 9)], '#7a5434', 1.6);
        line([P(u, vEnd - 0.05, 8), P(u, E + 0.05, H + 8)], '#c9a46e', 0.9);
      }
    }
    if (wall) cheek(u1, u1 + 0.07, wall);
    return [[sx, E + 0.45, H * 0.55], [sx + 0.05, E + 0.75, H * 0.25]];
  }
  const fig = (i, u, v, up, now) => {
    const w = { px: ox + u, py: oy + v, kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    g.save(); g.translate(0, -up * z); try { drawWalker(w, z, now); } finally { g.restore(); }
  };
  window.treppeBild = async (name = 'treppe-varianten.png', zz = 2.6) => {
    const c0 = toTile(W / 2, H / 2 + 150), bx = c0.x - 14, by = c0.y;
    for (let y = by - 4; y <= by + 6; y++) for (let x = bx - 4; x <= bx + 30; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); }
    for (const k of [...state.edges.keys()]) state.edges.delete(k);
    state.money = 1e9; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id);
    VARS.forEach(([, , w], n) => {
      const x0 = bx + n * 7;
      state.paintNew.anhoehe = { form: w };
      for (let y = by; y <= by + 1; y++) for (let x = x0; x <= x0 + 2; x++) raiseHill(x, y);
      buildSmall('baum', x0, by, CSLOT); buildSmall('bank', x0 + 2, by, 4); buildSmall('laterne', x0 + 2, by + 1, 1);
      for (let y = by + 3; y <= by + 4; y++) for (let x = x0 - 1; x <= x0 + 3; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'kies' });
    });
    state.paintNew.anhoehe = {}; recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
    const C = 820, sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 110;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let n = 0; n < 4; n++) {
      ox = 0; oy = 0; z = zz;
      const x0 = bx + n * 7, p = iso(x0 + 1.2, by + 1.6); cam.x = p.x; cam.y = p.y - 10; cam.z = z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const now = performance.now();
      g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const on = stairs(VARS[n][3], x0 + 1, by + 1);
      on.forEach(([u, v, up], i) => fig(i + n, u, v, up, now));
      fig(5 + n, x0 + 0.4, by + 0.6, HILL_H, now);
      fig(7 + n, x0 + 2.4, by + 3.5, 0, now);
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 55) + 50;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C, C);
      sx.font = '800 32px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${VARS[n][0]}  ${VARS[n][1]}`, X + 10, Y - 12);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();

// --- eingelassene Treppe (Nutzer: „nicht als Rampe, die man ranstellt, sondern eingelassen – links und rechts Anhöhe, in der Mitte die
// Treppe“): das Treppenfeld bleibt unten, die Stufen steigen von der Vorderkante (Boden) zur Hinterkante (oben). Die Wände der Nachbarn
// sind von selbst die Wangen
(function treppeEingelassen() {
  const VARS2 = [
    ['A', 'Felswand: Steinstufen', 0, 'stein', 1],
    ['B', 'Erde: Holzstufen (Bohlen)', 1, 'holz', 1],
    ['C', 'Trockenmauer: gemauerte Stufen', 2, 'mauer', 1],
    ['D', 'breit: zwei Treppen nebeneinander', 0, 'stein', 2],
  ];
  let z = 1;
  const P = (u, v, up = 0) => { const s = toScreen(u, v); return [s.x, s.y - up * z]; };
  const fill = (pts, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w * z; g.lineCap = 'round'; g.stroke(); };
  const COL = { stein: ['#ddd2bd', '#bfb299', '#a99b82'], holz: ['#c09262', '#9f7349', '#8a6240'], mauer: ['#d6c9b0', '#bfb198', '#a99b82'] };
  function steps(kind, sx, sy, wide) {
    const H = HILL_H, n = 8, dv = 1 / n, u0 = sx - 0.5, u1 = sx - 0.5 + wide, c = COL[kind];
    for (let i = 0; i < n; i++) {                                         // von hinten (oben) nach vorn (unten)
      const v0 = sy - 0.5 + i * dv, v1 = v0 + dv, h = H * (n - i) / n;
      fill([P(u0, v0, h), P(u1, v0, h), P(u1, v1, h), P(u0, v1, h)], c[0]);           // Trittfläche
      fill([P(u0, v1, h - H / n), P(u1, v1, h - H / n), P(u1, v1, h), P(u0, v1, h)], c[1]);   // Stirnseite
      if (kind === 'holz') { line([P(u0 + 0.03, v1, h), P(u1 - 0.03, v1, h)], '#6e4b2c', 0.9); for (let k = 1; k < 3 * wide; k++) line([P(u0 + k / 3, v0, h), P(u0 + k / 3, v1, h)], 'rgba(90,60,35,0.35)', 0.6); }
      if (kind === 'mauer') for (let k = 1; k < 3 * wide; k++) { const u = u0 + k / 3 + (i % 2 ? 0.16 : 0); if (u < u1 - 0.02) line([P(u, v1, h - H / n), P(u, v1, h)], 'rgba(90,75,55,0.45)', 0.7); }
      if (kind === 'stein') line([P(u0 + 0.02, v1, h), P(u1 - 0.02, v1, h)], 'rgba(255,255,255,0.35)', 0.7);
    }
    return [[sx - 0.5 + wide / 2 - 0.1, sy + 0.25, H * 0.25], [sx - 0.5 + wide / 2 + 0.12, sy - 0.15, H * 0.65]];
  }
  const fig = (i, u, v, up, now) => {
    const w = { px: u, py: v, kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    g.save(); g.translate(0, -up * z); try { drawWalker(w, z, now); } finally { g.restore(); }
  };
  window.treppeEingelassenBild = async (name = 'treppe-eingelassen.png', zz = 2.6) => {
    const c0 = toTile(W / 2, H / 2 + 150), bx = c0.x - 14, by = c0.y;
    for (let y = by - 4; y <= by + 6; y++) for (let x = bx - 4; x <= bx + 34; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); }
    for (const k of [...state.edges.keys()]) state.edges.delete(k);
    state.money = 1e9; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id);
    const spots = [];
    VARS2.forEach(([, , w, , wide], n) => {
      const x0 = bx + n * 8, sx = x0 + 1;                                   // Treppe(n) ab sx, links und rechts Anhöhe
      state.paintNew.anhoehe = { form: w };
      for (let y = by; y <= by + 1; y++) for (let x = x0; x <= x0 + 1 + wide; x++) if (!(y === by + 1 && x >= sx && x < sx + wide)) raiseHill(x, y);
      buildSmall('baum', x0, by, CSLOT); buildSmall('bank', x0 + 1 + wide, by, 4); buildSmall('laterne', x0, by + 1, 1);
      for (let x = x0 - 1; x <= x0 + 2 + wide; x++) state.tiles.set(x + ',' + (by + 3), { b: 'weg', lvl: 1, style: 'kies' });
      for (let k = 0; k < wide; k++) state.tiles.set((sx + k) + ',' + (by + 2), { b: 'weg', lvl: 1, style: 'kies' });
      spots.push([x0, sx, wide]);
    });
    state.paintNew.anhoehe = {}; recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
    const C = 820, sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 110;
    const sx2 = sheet.getContext('2d'); sx2.fillStyle = '#fffaf0'; sx2.fillRect(0, 0, sheet.width, sheet.height);
    for (let n = 0; n < 4; n++) {
      z = zz;
      const [x0, sx, wide] = spots[n], p = iso(x0 + 1.4, by + 1.4); cam.x = p.x; cam.y = p.y - 8; cam.z = z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const now = performance.now();
      g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
      const on = steps(VARS2[n][3], sx, by + 1, wide);
      // die rechte Anhöhe liegt vor der Treppe: ihr Bildchen noch einmal darüber (wie es das Spiel in der Reihenfolge der Felder tut)
      for (let y = by; y <= by + 1; y++) { const x = sx + wide, s = toScreen(x, y); if (hillAt(x, y)) drawHillTile(x, y, s.x, s.y, z); }
      on.forEach(([u, v, up], i) => fig(i + n, u, v, up, now));
      fig(5 + n, x0 + 0.3, by + 0.5, HILL_H, now);
      fig(7 + n, x0 + 2.4, by + 3.0, 0, now);
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 55) + 50;
      sx2.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C, C);
      sx2.font = '800 32px Nunito, system-ui'; sx2.fillStyle = '#6b4f3a'; sx2.fillText(`${VARS2[n][0]}  ${VARS2[n][1]}`, X + 10, Y - 12);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return 'kein Sammler'; }
  };
})();
