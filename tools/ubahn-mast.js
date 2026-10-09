// Entwurf (Nutzer, 09.10.2026: „die Stange mit dem U steht drauf, nicht bündig, viel zu groß – vergleich mit einem Bahnhof“): Varianten
// des Masts der U-Bahn-Station (Form „Treppe mit Mast“), nur zum Anschauen. Im Browser:
// fetch('tools/ubahn-mast.js').then(r => r.text()).then(t => (0, eval)(t)); ubahnMast(ox, oy)
(function () {
  const orig = window.__ubOrig || (window.__ubOrig = drawUbahn);
  // Variante je Feld: t.mv = 'A' (heute) | 'B' | 'C' | 'D'
  window.drawUbahn = function (cx, cy, z, t) {
    const mv = t && t.mv;
    if (!mv || mv === 'A' || lookForm('ubahn', t) !== 'treppe') return orig(cx, cy, z, t);
    const r = (t && t.rot) || 0, du = [1, 0, -1, 0][r], dv = [0, 1, 0, -1][r];
    const L = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const S = (a, b, up = 0) => { const p = L(du * a - dv * b, dv * a + du * b); return [p[0], p[1] - up * z]; };
    const stairs = (a0, a1, w) => {
      poly([S(a0, -w), S(a1, -w), S(a1, w), S(a0, w)], C('#3a332e'));
      for (let i = 1; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 7; portalLine([S(a, -w, -i), S(a, w, -i)], 'rgba(220,210,195,0.55)', 0.8, z); }
    };
    const wall = (a0, a1, b0, b1, h = 6) => pbBox(S, du, dv, a0, a1, b0, b1, 0, h, '#cfc6b4', '#e3dccd', z, false);
    const mast = (a, b, h0, h1, w = 0.03) => pbBox(S, du, dv, a - w, a + w, b - w, b + w, h0, h1, '#5b6470', '#6c7682', z, false);
    if (wegUnder(t) == null) poly([S(-0.48, -0.48), S(0.48, -0.48), S(0.48, 0.48), S(-0.48, 0.48)], C('#d9d2c4'));
    stairs(-0.36, 0.38, 0.24);
    if (mv === 'B') {                         // kleiner Mast in der hinteren Ecke, wächst aus der Mauer
      wall(-0.44, -0.36, -0.24, 0.24);
      wall(-0.44, 0.38, 0.24, 0.32);
      wall(-0.44, 0.38, -0.32, -0.24);
      mast(-0.4, -0.28, 6, 17);
      uSign(S(-0.4, -0.28, 20), 7, z);
    } else if (mv === 'C') {                  // Mast vorn an der Mauerkante neben dem Eingang
      wall(-0.44, -0.36, -0.24, 0.24);
      wall(-0.44, 0.38, 0.24, 0.32);
      wall(-0.44, 0.38, -0.32, -0.24);
      mast(0.34, -0.28, 6, 16);
      uSign(S(0.34, -0.28, 19), 7, z);
    } else if (mv === 'D') {                  // ohne Mast: Rückwand etwas höher, U-Schild darauf
      wall(-0.44, -0.36, -0.24, 0.24, 11);
      wall(-0.44, 0.38, 0.24, 0.32);
      wall(-0.44, 0.38, -0.32, -0.24);
      uSign(S(-0.4, 0, 15), 7, z);
    }
  };
  window.ubahnMast = (ox, oy, rot = 1) => {
    for (let y = oy - 1; y <= oy + 5; y++) for (let x = ox - 1; x <= ox + 9; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.tunnels.delete(k); }
    for (let y = oy; y <= oy + 1; y++) for (let x = ox; x <= ox + 8; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'kopf' });
    recalc();
    ['A', 'B', 'C', 'D'].forEach((mv, i) => {
      const x = ox + i * 2, y = oy;
      build('tunnel', x, y, true); buildRot = rot; rotManual = true; build('ubahn', x, y, true);
      state.tiles.get(x + ',' + y).mv = mv;
    });
    buildRot = 0;
    build('station', ox + 1, oy + 3, true); build('haus', ox + 4, oy + 3, true); build('haus', ox + 6, oy + 3, true);
    recalc(); glTouch();
    const p = iso(ox + 3.5, oy + 1.5); cam.x = p.x; cam.y = p.y; cam.z = 3.2;
    return 'ok';
  };
  // Vergleichsbild: je Variante ein Ausschnitt mit Bahnhof und Haus daneben (2 × 2), an den Bild-Sammler (scratchpad/sink.py)
  window.ubahnMastBild = async (ox, oy, name = 'ubahn-mast.png', rot = 1, z = 2.4) => {
    for (let y = oy - 3; y <= oy + 3; y++) for (let x = ox - 2; x <= ox + 16; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.tunnels.delete(k); }
    const V = [['A', 'heute (30 hoch)'], ['B', 'kleiner Mast hinten in der Mauerecke'], ['C', 'kleiner Mast vorn am Eingang'], ['D', 'ohne Mast: Schild auf der Rückwand']];
    V.forEach(([mv], i) => {
      const X = ox + i * 4, Y = oy;
      for (let y = Y - 1; y <= Y + 1; y++) for (let x = X - 1; x <= X + 1; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'kopf' });
    });
    recalc();
    V.forEach(([mv], i) => {
      const X = ox + i * 4, Y = oy;
      build('tunnel', X, Y, true); buildRot = rot; rotManual = true; build('ubahn', X, Y, true); state.tiles.get(X + ',' + Y).mv = mv;
      buildRot = 0; build('station', X + 2, Y - 2, true); build('haus', X - 1, Y + 2, true);
    });
    recalc(); glTouch(); setTool('look'); gameHour = () => 12;
    const C0 = 820, sheet = document.createElement('canvas'); sheet.width = C0 * 2 + 30; sheet.height = C0 * 2 + 120;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let i = 0; i < 4; i++) {
      const p = iso(ox + i * 4 + 0.6, oy - 0.9); cam.x = p.x; cam.y = p.y - 6; cam.z = z; floats.length = 0;
      spriteNoBudget = true; for (let k = 0; k < 4; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 100);
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const X = (i % 2) * (C0 + 30), Y = Math.floor(i / 2) * (C0 + 60) + 55;
      sx.drawImage(comp, comp.width / 2 - C0 / 2, comp.height / 2 - C0 / 2, C0, C0, X, Y, C0, C0);
      sx.font = '800 30px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${V[i][0]}  ${V[i][1]}`, X + 8, Y - 14);
    }
    const url = sheet.toDataURL('image/png');
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
