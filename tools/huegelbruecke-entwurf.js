// Entwurf (Nutzer 11.10.2026: „Brücke von einer Anhöhe zur anderen, darunter ein Weg“ – „Flaches reicht, zeig Steinbogen, Holzsteg und Stahl“):
// nur Bild, kein Spielcode geändert. Zwei Anhöhen gegenüber (3 Felder Lücke), oben Wege bis an die Kante, unten ein Weg quer durch die Lücke;
// die Brücke wird über das fertige Spielbild gemalt (Fahrbahn auf Anhöhenhöhe HILL_H, von Kante zu Kante).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/huegelbruecke-entwurf.js')).text()); await brueckeBild()   → tools/vorschau/huegelbruecke.png
(function huegelbrueckeEntwurf() {
  const A = [10, 13], B = [17, 20], Y0 = 10, Y1 = 14, YB = 12, XU = 15;   // Anhöhen x 10–13 und 17–20, y 10–14; Brücke bei y 12; Weg unten bei x 15
  const U0 = A[1] + 0.5, U1 = B[0] - 0.5, W = 0.3;                           // Brücke von Kante zu Kante, halbe Breite
  function setup() {
    for (let y = 2; y <= 24; y++) for (let x = 4; x <= 26; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); state.money = 1e9; groundVersion++; planMemo = null;
    for (const [x0, x1] of [A, B]) for (let y = Y0; y <= Y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 });
    const weg = (x, y, st) => state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: st, lauf: 0 });
    for (let x = A[0]; x <= A[1]; x++) weg(x, YB, 'm:platten:sand');                 // oben bis an die Kante
    for (let x = B[0]; x <= B[1]; x++) weg(x, YB, 'm:platten:sand');
    for (let y = 6; y <= 18; y++) weg(XU, y, 'kies');                               // unten quer durch die Lücke
    for (const [x, y] of [[14, 9], [16, 15], [14, 15]]) state.decos.set(x + ',' + y, [{ b: 'blumen', rot: 0 }, null, null, null]);
    recalc(); groundVersion++; floats.length = 0;
    for (const t of state.tiles.values()) delete t.born;
  }
  // Weltpunkt (u entlang x, v entlang y, h Höhe) → Gerätepunkt im Spielbild
  let dpr = 1;
  const S = (u, v, h) => { const p = toScreen(u, YB + v); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };   // v quer zur Brücke, ab ihrer Mitte
  const poly = (x, pts, fill, stroke, lw) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = (lw || 1) * cam.z * dpr * 0.5; x.stroke(); } };
  const line = (x, a, b, col, lw) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.strokeStyle = col; x.lineWidth = lw * cam.z * dpr * 0.5; x.lineCap = 'round'; x.stroke(); };
  const H = HILL_H, N = 24, us = Array.from({ length: N + 1 }, (_, i) => U0 + (U1 - U0) * i / N);
  function shadow(x) { poly(x, [S(U0, W + 0.35, 0), S(U1, W + 0.35, 0), S(U1, -W + 0.35, 0), S(U0, -W + 0.35, 0)], 'rgba(40,60,30,0.18)'); }
  function deck(x, fill, edge) {
    poly(x, [S(U0, -W, H), S(U1, -W, H), S(U1, W, H), S(U0, W, H)], fill);
    line(x, S(U0, W, H), S(U1, W, H), edge, 1.2);
  }
  // Steinbogen: ein flacher Bogen über die ganze Lücke, Brüstung beidseits, Stein mit Fugen
  function stone(x) {
    const st = '#cdbb9c', sd = '#b39f80', dk = '#8f7d62', m = (U0 + U1) / 2, R = (U1 - U0) / 2, top = H - 7;
    const arch = (u, v) => S(u, v, top * Math.sqrt(Math.max(0, 1 - ((u - m) / R) ** 2)) * 0.85);
    shadow(x);
    for (let i = 0; i < N; i++) poly(x, [arch(us[i], -W), arch(us[i + 1], -W), arch(us[i + 1], W), arch(us[i], W)], '#6f6150');   // Bogenleibung (innen)
    poly(x, [S(U0, -W, H), S(U1, -W, H), S(U1, -W, H + 5), S(U0, -W, H + 5)], sd);              // hintere Brüstung (Innenseite)
    deck(x, '#e6dcc8', dk);
    const face = [S(U0, W, 0), ...us.map(u => arch(u, W)), S(U1, W, 0), S(U1, W, H + 5), S(U0, W, H + 5)];
    poly(x, face, st, dk, 1);                                                                    // Stirnseite mit Bogen
    x.save(); x.beginPath(); face.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.clip();
    for (let h = 4; h < H + 5; h += 4.5) line(x, S(U0, W, h), S(U1, W, h), 'rgba(110,90,60,0.35)', 0.6);   // Steinlagen
    for (let i = 0; i <= 12; i++) { const u = U0 + (U1 - U0) * i / 12; for (let h = 0; h < H + 5; h += 9) line(x, S(u + (h % 18 ? 0.06 : 0), W, h), S(u + (h % 18 ? 0.06 : 0), W, h + 4.5), 'rgba(110,90,60,0.3)', 0.5); }
    x.restore();
    for (let i = 0; i <= 10; i++) { const u = m + (i - 5) * R / 5.5, a = arch(u, W), b = S(u, W, top * Math.sqrt(Math.max(0, 1 - ((u - m) / R) ** 2)) * 0.85 + 5); line(x, a, b, dk, 0.7); }   // Keilsteine am Bogen
    poly(x, [S(U0, W, H + 5), S(U1, W, H + 5), S(U1, W - 0.07, H + 5), S(U0, W - 0.07, H + 5)], '#ddd0b6');   // Brüstungskrone
  }
  // Holzsteg: Bohlen quer, zwei Joche (Böcke) neben dem Weg unten, Geländer aus Pfosten und Handlauf
  function wood(x) {
    const wd = '#a9774a', wl = '#c99a68', dk = '#6d4a2c';
    shadow(x);
    const post = (u, v, h0, h1, w = 1.6) => line(x, S(u, v, h0), S(u, v, h1), dk, w * 1.4);
    for (const u of [U0 + 0.55, U1 - 0.55]) for (const v of [-W + 0.05, W - 0.05]) post(u, v, 0, H - 3, 2.4);   // Böcke
    for (const u of [U0 + 0.55, U1 - 0.55]) { line(x, S(u, -W + 0.05, 2), S(u, W - 0.05, H - 5), dk, 1.2); line(x, S(u, W - 0.05, 2), S(u, -W + 0.05, H - 5), dk, 1.2); }
    for (let i = 0; i <= 8; i++) post(U0 + (U1 - U0) * i / 8, -W, H, H + 8, 1.2);           // hinteres Geländer
    line(x, S(U0, -W, H + 8), S(U1, -W, H + 8), dk, 1.4);
    poly(x, [S(U0, W, H), S(U1, W, H), S(U1, W, H - 3), S(U0, W, H - 3)], '#8a5f38');          // Längsträger vorn
    deck(x, wl, dk);
    for (let i = 0; i <= 26; i++) { const u = U0 + (U1 - U0) * i / 26; line(x, S(u, -W, H), S(u, W, H), 'rgba(90,60,30,0.55)', 0.6); }   // Bohlen quer
    for (let i = 0; i <= 8; i++) post(U0 + (U1 - U0) * i / 8, W, H, H + 8, 1.4);            // vorderes Geländer
    line(x, S(U0, W, H + 8), S(U1, W, H + 8), wd, 1.8); line(x, S(U0, W, H + 4), S(U1, W, H + 4), wd, 1.0);
  }
  // Stahl: Fachwerk beidseits (Ober- und Untergurt, Streben), dünne Fahrbahn, ohne Pfeiler
  function steel(x) {
    const sc = '#5d7d7a', sl = '#7fa09c', dk = '#3e5452', TH2 = 11, n = 6;
    shadow(x);
    const truss = (v, col, w) => {
      line(x, S(U0, v, H), S(U1, v, H), col, w * 1.4); line(x, S(U0 + 0.15, v, H + TH2), S(U1 - 0.15, v, H + TH2), col, w * 1.4);
      line(x, S(U0, v, H), S(U0 + 0.15, v, H + TH2), col, w); line(x, S(U1, v, H), S(U1 - 0.15, v, H + TH2), col, w);
      for (let i = 0; i < n; i++) { const a = U0 + 0.15 + (U1 - U0 - 0.3) * i / n, b = U0 + 0.15 + (U1 - U0 - 0.3) * (i + 1) / n; line(x, S(a, v, H + TH2), S(b, v, H), col, w); line(x, S(a, v, H), S(a, v, H + TH2), col, w * 0.8); }
    };
    truss(-W - 0.02, dk, 1.1);                                                                   // hinteres Fachwerk
    poly(x, [S(U0, W, H), S(U1, W, H), S(U1, W, H - 4), S(U0, W, H - 4)], sc, dk, 0.6);          // Längsträger
    deck(x, '#cfd3cf', dk);
    for (let i = 0; i <= 18; i++) { const u = U0 + (U1 - U0) * i / 18; line(x, S(u, -W, H), S(u, W, H), 'rgba(80,90,90,0.25)', 0.5); }
    truss(W + 0.02, sl, 1.5);                                                                    // vorderes Fachwerk
  }
  const KINDS = [['Steinbogen', stone], ['Holzsteg', wood], ['Stahl', steel]];
  window._bru = { S, stone, poly, shadow, setDpr: d => { dpr = d; } };   // zum Nachprüfen
  function shot(drawB, zz, Cs, cx, cy) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - HILL_H * 0.4; cam.z = zz;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    dpr = canvas.width / innerWidth;
    const c = document.createElement('canvas'); c.width = c.height = Cs; const x = c.getContext('2d');
    const ox = canvas.width / 2 - Cs / 2, oy = canvas.height / 2 - Cs / 2;
    x.drawImage(canvas, ox, oy, Cs, Cs, 0, 0, Cs, Cs);
    x.save(); x.translate(-ox, -oy); drawB(x); x.restore();
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.brueckeBild = async (zz = 2.6, Cs = 640) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    resetDrawCaches(); groundVersion++;
    const sheet = document.createElement('canvas'); sheet.width = 3 * (Cs + 16); sheet.height = 2 * (Cs + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      KINDS.forEach(([name, f], i) => {
        for (const [r, z, lab] of [[0, zz, ''], [1, zz * 1.9, ' · nah']]) {
          const c = shot(f, z, Cs, 15, 12), X = i * (Cs + 16), Y = r * (Cs + 50) + 40;
          sx.drawImage(c, X, Y); sx.font = '800 24px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(name + lab, X + 6, Y - 10);
        }
      });
    } finally { nightAt = na; gameHour = gh; }
    return post('huegelbruecke.png', sheet);
  };
  return 'ok';
})();
