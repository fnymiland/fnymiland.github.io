// Entwurf (Besprechung 11.10.2026: „Fußgängerbrücken immer als Bogen – zeig mal, wie eine Bogenbrücke über zwei Anhöhen aussieht“): nur Bild,
// kein Spielcode geändert. Die echten Bogenbrücken (Wegbrücke übers Wasser, Block 150) liegen hier in der Lücke zwischen zwei Anhöhen und werden
// beim Zeichnen um HILL_H angehoben (Umleitungen nur während der Aufnahme); Holz/Rot bekommen Stützen bis zum Boden, Stein/Ziegel bleiben, wie sie
// sind (ihre Mauer endet unten auf Anhöhenhöhe). Zum Vergleich die flache Brücke von heute (Block 160).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bogen-anhoehe-entwurf.js')).text()); await bogenAnhoeheBild()   → tools/vorschau/bogen-anhoehe.png
(function bogenAnhoeheEntwurf() {
  const mock = new Map();                                                   // Feld der Lücke → { flach: Höhenfaktor }
  const ROWS = [                                                             // Anhöhen A x 10–13, B x 17–20 (Lücke 14–16)
    [6, 'flach'], [9, 'holz'], [12, 'stein'], [15, 'ziegel'], [18, 'rot'], [21, 'holz', 0.5],
  ];
  const STY = { holz: 'sand', stein: 'platten', ziegel: 'kopf', rot: 'sand' };
  function setup() {
    for (let y = 2; y <= 26; y++) for (let x = 4; x <= 40; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear();
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    hill(10, 5, 13, 22); hill(17, 5, 20, 22);                                // Lücke 3
    hill(26, 5, 29, 9); hill(31, 5, 34, 9);                                  // Lücke 1 (x 30)
    hill(26, 13, 29, 19); hill(34, 13, 37, 19);                              // Lücke 4 (x 30–33)
    const weg = (x, y, st, extra = {}) => state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: st, lauf: 0, ...extra });
    const row = (y, xa0, xa1, xb0, xb1, kind, f = 1) => {
      for (let x = xa0; x <= xa1; x++) weg(x, y, STY[kind]);
      for (let x = xb0; x <= xb1; x++) weg(x, y, STY[kind]);
      for (let x = xa1 + 1; x < xb0; x++) { weg(x, y, STY[kind], { bridge: true, brk: kind }); mock.set(x + ',' + y, f); }
    };
    for (const [y, kind, f] of ROWS) if (kind !== 'flach') row(y, 10, 13, 17, 20, kind, f);
    row(7, 26, 29, 31, 34, 'holz'); row(15, 26, 29, 34, 37, 'holz'); row(18, 26, 29, 34, 37, 'stein');
    groundVersion++; recalc();
    // flach (Block 160): echte Brücke mit Weg
    state.paintNew.bruecke = { form: 0 }; setTool('bruecke'); startPlan('line', { x: 12, y: 6 }, { x: 18, y: 6 }, false); runPlan();
    chosenStyle.weg = wegStyleOf('sand'); setTool('weg'); startPlan('line', { x: 10, y: 6 }, { x: 20, y: 6 }, false); runPlan();
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  // Umleitungen nur während der Aufnahme
  function patched(fn) {
    const o = { dwb: drawWegBridge, sab: spriteArchBridge, bac: bridgeArchCalc, baf: bkArmFrom, off: GL.off };
    const P = (x, y, ax, a, b, h, cx, cy, z) => { const [u, v] = ax ? [b, a] : [a, b]; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z]; };
    drawWegBridge = (cx, cy, z, x, y, t) => {                                // (bkOn gilt: die flache Brücke ist echt)
      if (!mock.has(x + ',' + y)) return o.dwb(cx, cy, z, x, y, t);
      const A = bridgeArch(x, y), kind = bridgeKind(t), ax = A ? A.ax : 0, hw = EDGE_W;
      if (!BRIDGE_LOOK[kind].wall) {                                         // Holz/Rot: Stützen vom Boden bis unter den Bogen
        const col = BRIDGE_LOOK[kind].side, pw = 1.2;
        const as = A && archSpan(A.N) > 1 ? archCenters(A.N).map(c => c - A.i0 - 0.5).filter(a => a >= -0.5 && a < 0.5) : [-0.3, 0.3];
        g.fillStyle = C(col);
        for (const b of [-hw + 0.1, hw - 0.1]) for (const a of as) { const p0 = P(x, y, ax, a, b, 0, cx, cy, z), p1 = P(x, y, ax, a, b, HILL_H + 1, cx, cy, z); g.fillRect(p0[0] - pw * z, p1[1], 2 * pw * z, p0[1] - p1[1]); }
      }
      return o.dwb(cx, cy - HILL_H * z, z, x, y, t);
    };
    spriteArchBridge = (x, y, ...r) => mock.has(x + ',' + y) ? false : o.sab(x, y, ...r);
    bridgeArchCalc = (x, y) => { const A = o.bac(x, y); if (A && mock.has(x + ',' + y)) { A.peak *= mock.get(x + ',' + y); A.open = archOpenings(A); } return A; };
    bkArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.baf(x, y, dx, dy);
    GL.off = true;
    try { return fn(); } finally { drawWegBridge = o.dwb; spriteArchBridge = o.sab; bridgeArchCalc = o.bac; bkArmFrom = o.baf; GL.off = o.off; bridgeArchCache.v = -1; resetDrawCaches(); groundVersion++; }
  }
  function shot(cx, cy, zz, W, H, up = HILL_H) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, W, H);
    x.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.bogenAnhoeheBild = async (name = 'bogen-anhoehe.png', W = 600, H = 600) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    bridgeArchCache.v = -1; resetDrawCaches(); groundVersion++;
    const list = [
      [15, 6, 2.6, 'Heute: flacher Holzsteg (Block 160)'], [15, 9, 2.6, 'Holz-Bogen'], [15, 12, 2.6, 'Steinbogen'],
      [15, 15, 2.6, 'Ziegel-Bogen'], [15, 18, 2.6, 'Roter Bogen'], [15, 21, 2.6, 'Holz-Bogen, halb so hoch'],
      [30, 7, 2.6, 'Lücke 1 Feld (Holz)'], [31.5, 15, 2.2, 'Lücke 4 Felder (Holz)'], [31.5, 18, 2.2, 'Lücke 4 Felder (Stein)'],
      [15, 13.5, 1.1, 'Übersicht'],
    ];
    const cols = 3, rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 16); sheet.height = rows * (H + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      patched(() => list.forEach(([x, y, z, l], i) => {
        const c = shot(x, y, z, W, H), X = (i % cols) * (W + 16), Y = Math.floor(i / cols) * (H + 50) + 40;
        sx.drawImage(c, X, Y); sx.font = '800 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 6, Y - 10);
      }));
    } finally { nightAt = na; gameHour = gh; }
    return post(name, sheet);
  };
  return 'ok';
})();
