// Entwurf 8 (Nutzer: „wieder der Zipfel am Ende; Bögen etwas höher, sie war geil, weil sie so flach aussah – stufenweise, mehrere Varianten“):
// die äußeren Bögen setzen an der Wand knapp unter der Kante an (wie C), Stein über den Bögen dünn, Ansatz an den Pfeilern in 5 Stufen höher.
// Davor Entwurf 7 (Nutzer: „Stein mit Stützen? Zeig 4, 6, 8 Felder“): Steinbrücke mit Pfeilern auf den Kachelkanten, Bögen je 2 Felder, Belag ein
// durchgehender Buckel, Enden wie Entwurf 6 C. Nur Bild. Davor Entwurf 6 (Nutzer: „dieser Zipfel am Anfang, der unnatürlich übersteht“ – Stirn und Brüstung laufen an den Kanten aus). Davor Entwurf 5 (Besprechung 11.10.2026: „Stein zurück zu Entwurf 2 und davon 10 Alternativen – fast gut, aber irgendwas stört; keine Stacheln“):
// zehn Abwandlungen des dünnen Steinbogens aus Entwurf 2, je eine Zeile. Bisher (Entwurf 2):
// nur Bild, kein Spielcode geändert. Fußgänger-Bogen zwischen zwei Anhöhen, halb so hoch wie übers Wasser, über das fertige Spielbild gemalt:
// Stein als dünner Bogen (liegt an den Kanten auf, der Bogen setzt unten an der Wand der Anhöhe an), Holz und Rot mit Bogenträger unter dem Belag,
// bis 3 Felder ohne Stützen, bei 4 ein Paar in der Mitte; 1 Feld: kleiner Buckel. Unten quer ein Weg (Platz darunter).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bogen-anhoehe-entwurf8.js')).text()); await bogenEntwurf8()   → tools/vorschau/bogen-anhoehe-8.png
(function bogenAnhoeheEntwurf8() {
  const H = HILL_H, W = 0.3;
  const LOOK = {
    holz: { side: '#6f5238', deck: '#b08a5e', plank: '#8a6440', rail: '#6f5238', rib: '#7a5a3d' },
    rot: { side: '#a8392f', deck: '#c79a6a', plank: '#9a7048', rail: '#d9483b', rib: '#a8392f' },
    stein: { face: '#d9d2c3', joint: '#a99f8c', deck: '#e6dcc8', top: '#efe8da', soff: '#8f8676' },
  };
  // Brücken: [Zeile y, Anhöhe A bis xa1, Anhöhe B ab xb0, Art]
  const BR = [];
  // Abwandlungen: pk Höhe (× Entwurf 2), sp Ansatz unter der Kante, th Dicke am Scheitel, par Brüstung, ring Bogenkante, col Farben, deck Belag
  const VAR = [], STUFEN = [10, 14, 17, 20, 23];                             // Ansatz der Bögen an den Pfeilern (Anhöhe: 26)
  const mock = new Set();
  function setup() {
    for (let y = 0; y <= 38; y++) for (let x = 2; x <= 30; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.edges.clear(); state.bruecken.clear(); mock.clear(); BR.length = 0;
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    const weg = (x, y, st) => state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: st, lauf: 0 });
    let hy = [0, 0];                                                       // Zeilen der Anhöhe B (Ausschnitt)
    const row = (y, xa0, xa1, xb0, xb1, art, o = {}) => {
      const st = art === 'stein' ? 'platten' : 'sand';
      for (let x = xa0; x <= xa1; x++) weg(x, y, st);
      for (let x = xb0; x <= xb1; x++) weg(x, y, st);
      for (let x = xa1 + 1; x < xb0; x++) mock.add(x + ',' + y);
      BR.push({ y, U0: xa1 + 0.5, U1: xb0 - 0.5, art, st, B: [xb0, xb1, ...hy], o });
    };
    hill(6, 2, 9, 31); hill(16, 2, 19, 31); hy = [2, 31];                    // Lücke 6, fünf Stufen
    STUFEN.forEach((hp, k) => row(4 + 6 * k, 6, 9, 16, 19, 'stein', { piers: true, hp }));
    for (const px of [10, 13, 15]) for (let y = 0; y <= 33; y++) weg(px, y, 'sand');
    groundVersion++; recalc();
    hill(24, 20, 25, 22); hill(28, 20, 29, 22);                              // eine echte Brücke weit weg: bkOn() gilt (Arme über die Kante)
    groundVersion++; recalc();
    setTool('bruecke'); startPlan('line', { x: 25, y: 21 }, { x: 28, y: 21 }, false); runPlan();
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; setTool('look');
  }
  // --- Zeichnen über das Spielbild ---
  let dpr = 1, X = null;
  const peakOf = N => N >= 2 ? 0.5 * 20.4 * Math.pow(Math.min(N, 16) / 2, 0.6) : 5;
  function bridge(b) {
    const { y, U0, U1, art } = b, N = U1 - U0, pk = peakOf(N) * ((b.o && b.o.pk) || 1), M = 32;
    const S = (u, v, h) => { const p = toScreen(u, y + v); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
    const dk = u => H + pk * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - U0) / N)));
    const us = Array.from({ length: M + 1 }, (_, i) => U0 + N * i / M);
    const lw = w => w * cam.z * dpr * 0.5;
    const poly = (pts, fill, stroke, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); if (fill) { X.fillStyle = fill; X.fill(); } if (stroke) { X.strokeStyle = stroke; X.lineWidth = lw(w || 1); X.stroke(); } };
    const path = (pts, col, w) => { X.beginPath(); pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.strokeStyle = col; X.lineWidth = lw(w); X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); };
    // Anhöhe B liegt vor dem Ende des Bogens (ihre Oberseite und Wand vorn decken, was unter der Kante ansetzt): ausschneiden
    { const [bx0, bx1, by0, by1] = b.B, Q = (u, w, h) => { const p = toScreen(u, w); return [p.x * dpr, (p.y - h * cam.z) * dpr]; };
      for (const f of [[Q(bx0 - 0.5, by0 - 0.5, H), Q(bx1 + 0.5, by0 - 0.5, H), Q(bx1 + 0.5, by1 + 0.5, H), Q(bx0 - 0.5, by1 + 0.5, H)],
                       [Q(bx0 - 0.5, by1 + 0.5, H), Q(bx1 + 0.5, by1 + 0.5, H), Q(bx1 + 0.5, by1 + 0.5, 0), Q(bx0 - 0.5, by1 + 0.5, 0)]]) {
        X.beginPath(); X.rect(-1e5, -1e5, 3e5, 3e5); f.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); X.clip('evenodd');
      } }
    const band = (v, f0, f1, col, stroke) => poly([...us.map(u => S(u, v, f0(u))), ...[...us].reverse().map(u => S(u, v, f1(u)))], col, stroke, 0.6);
    // Schatten auf dem Boden (Sonne wie im Spiel)
    const sh = (u, v) => { const p = S(u, v, 0); return [p[0] + SUN.dx * dk(u) * cam.z * dpr, p[1] + SUN.dy * dk(u) * cam.z * dpr]; };
    poly([...us.map(u => sh(u, -W)), ...[...us].reverse().map(u => sh(u, W))], 'rgba(40,60,30,0.16)');
    if (art === 'stein' && b.o && b.o.piers) {                           // mehrere Bögen je 2 Felder, Pfeiler auf den Kachelkanten
      const L = LOOK.stein, sp = 3, th = 3.2, n = Math.max(1, Math.round(N / 2)), hp = b.o.hp || 10, PW = 0.09;
      const piers = Array.from({ length: n - 1 }, (_, k) => U0 + N * (k + 1) / n);
      const edgesA = [U0, ...piers, U1];
      const ri = u => {                                                      // Leibung über u: Ansatz am Pfeiler hp, an der Wand knapp unter der Kante (wie C); dünn unter dem Belag
        const k = Math.min(n - 1, Math.floor((u - U0) / (N / n))), a = edgesA[k] + (k ? PW : 0), c = edgesA[k + 1] - (k < n - 1 ? PW : 0);
        const t = Math.max(0, Math.min(1, (u - a) / (c - a))), sa = k ? hp : H - sp, sc = k < n - 1 ? hp : H - sp;
        const base = sa + (sc - sa) * t, top = dk((a + c) / 2) - th, mid = (sa + sc) / 2;
        return Math.min(dk(u) - th, base + Math.max(0, top - mid) * Math.sqrt(Math.max(0, Math.sin(Math.PI * t))));
      };
      const parH = u => 3 * Math.min(1, Math.min(u - U0, U1 - u) / 0.45);
      band(-W, u => dk(u), u => dk(u) + parH(u), C(shade(L.top, -0.12)));                           // hintere Brüstung
      poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag
      for (let i = 1; i < M; i += 2) path([S(us[i], -W, dk(us[i])), S(us[i], W, dk(us[i]))], 'rgba(150,135,110,0.45)', 0.6);
      for (const pu of piers) poly([S(pu + PW, -W, 0), S(pu + PW, W, 0), S(pu + PW, W, hp), S(pu + PW, -W, hp)], C(shade(L.face, -0.12)), C(L.joint), 0.5);   // Pfeiler: Seite zur Lücke rechts
      // Stirn: vom Belag bis zum Boden, Bogenöffnungen ausgespart (evenodd)
      const UU = Array.from({ length: 8 * M + 1 }, (_, i) => U0 + N * i / (8 * M));
      const face = () => { X.beginPath();
        [...UU.map(u => S(u, W, dk(u))), S(U1, W, H - sp), S(U1, W, 0), S(U0, W, 0), S(U0, W, H - sp)].forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath();
        for (let k = 0; k < n; k++) { const a = edgesA[k] + (k ? PW : 0), c = edgesA[k + 1] - (k < n - 1 ? PW : 0), seg = UU.filter(u => u >= a && u <= c);
          const pts = [S(a, W, 0), ...seg.map(u => S(u, W, ri(u))), S(c, W, 0)];
          pts.forEach((p, i) => i ? X.lineTo(p[0], p[1]) : X.moveTo(p[0], p[1])); X.closePath(); } };
      face(); X.fillStyle = C(L.face); X.fill('evenodd');
      X.save(); face(); X.clip('evenodd');
      for (let k = 0; k < n; k++) { const a = edgesA[k] + (k ? PW : 0), c = edgesA[k + 1] - (k < n - 1 ? PW : 0);   // Keilsteine am Bogen
        for (let q = 1; q < 10; q++) { const u = a + (c - a) * q / 10; path([S(u, W, ri(u)), S(u, W, ri(u) + 3.2)], C(L.joint), 0.6); }
        path(UU.filter(u => u >= a && u <= c).map(u => S(u, W, ri(u) + 3.2)), C(L.joint), 0.6); }
      X.restore();
      for (let k = 0; k < n; k++) { const a = edgesA[k] + (k ? PW : 0), c = edgesA[k + 1] - (k < n - 1 ? PW : 0); path(UU.filter(u => u >= a && u <= c).map(u => S(u, W, ri(u))), C(shade(L.face, -0.25)), 1); }
      path([...UU.map(u => S(u, W, dk(u)))], C(L.joint), 0.6);
      band(W, u => dk(u), u => dk(u) + parH(u), C(L.top), C(L.joint));                              // vordere Brüstung, läuft aus
      path(us.map(u => S(u, W, dk(u) + parH(u))), C(shade(L.top, 0.06)), 1.2);
      return;
    }
    if (art === 'stein') {
      const o = b.o || {}, L = { ...LOOK.stein, ...(o.col || {}) }, t01 = u => Math.max(0, Math.min(1, (u - U0) / N));
      const sp = o.sp || 9, th = o.th || 4;
      const ri = u => H - sp + (pk + sp - th) * (o.round ? Math.sqrt(Math.max(0, Math.sin(Math.PI * t01(u)))) : Math.sin(Math.PI * t01(u)));
      const parH0 = o.par === 'kante' ? 1 : 3, parH = u => parH0 * (o.ramp ? Math.min(1, Math.min(u - U0, U1 - u) / 0.45) : 1);
      if (o.par !== 'kante') band(-W, u => dk(u), u => dk(u) + parH(u), C(shade(L.top, -0.12)));          // hintere Brüstung (Innenseite)
      if (o.par === 'pfosten') { for (let k = 0; k <= 6 * N; k++) { const u = U0 + k / 6; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(shade(L.top, -0.18)), 1.6); } path(us.map(u => S(u, -W, dk(u) + 6)), C(shade(L.top, -0.12)), 2); }
      poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag
      if (o.deckWeg) {                                                      // Belag wie der Weg (Platten), schmaler Rand
        const lk = pathLook('platten');
        poly([...us.map(u => S(u, -W + 0.05, dk(u))), ...[...us].reverse().map(u => S(u, W - 0.05, dk(u)))], C(lk.fill || '#e9e2d3'));
        for (let k = 0; k <= 5 * N; k++) { const u = U0 + k / 5; path([S(u, -W + 0.05, dk(u)), S(u, W - 0.05, dk(u))], C(lk.edge || '#cfc6b4'), 0.6); }
        path(us.map(u => S(u, 0, dk(u))), C(lk.edge || '#cfc6b4'), 0.5);
      } else for (let i = 1; i < M; i += 2) path([S(us[i], -W, dk(us[i])), S(us[i], W, dk(us[i]))], 'rgba(150,135,110,0.45)', 0.6);   // Fugen quer
      band(W, ri, dk, C(L.face), C(L.joint));                                                         // Stirn: dünner Bogen
      if (o.ring) {                                                          // Bogenring: Keilsteine nur am Bogen, darüber glatte Wand
        const rr = u => ri(u) + 3.2;
        band(W, ri, rr, C(shade(L.face, 0.06)), C(L.joint));
        for (let k = 1; k < 18; k++) { const u = U0 + N * k / 18; path([S(u, W, ri(u)), S(u, W, rr(u))], C(L.joint), 0.6); }
      } else for (let k = 1; k < 12; k++) { const u = U0 + N * k / 12; path([S(u, W, ri(u)), S(u, W, dk(u))], C(L.joint), 0.6); }   // Keilsteine
      path(us.map(u => S(u, W, ri(u))), C(shade(L.face, -0.25)), 1);                                  // Bogenkante
      if (o.gesims) band(W, u => dk(u) - 1.4, u => dk(u), C(shade(L.top, -0.06)), C(L.joint));        // Gesims unter dem Belag
      if (o.par === 'pfosten') {                                             // Geländer: Pfosten und Handlauf aus Stein
        for (let k = 0; k <= 6 * N; k++) { const u = U0 + k / 6; poly([S(u - 0.025, W, dk(u)), S(u + 0.025, W, dk(u)), S(u + 0.025, W, dk(u) + 6), S(u - 0.025, W, dk(u) + 6)], C(L.top), C(L.joint), 0.5); }
        band(W, u => dk(u) + 5, u => dk(u) + 7, C(L.top), C(L.joint));
      } else {
        band(W, u => dk(u), u => dk(u) + parH(u), C(L.top), C(L.joint));                              // vordere Brüstung
        path(us.map(u => S(u, W, dk(u) + parH(u))), C(shade(L.top, 0.06)), 1.2);
      }
      return;
    }
    const L = LOOK[art];
    const rib = u => dk(u) - 7 + 3 * Math.sin(Math.PI * Math.max(0, Math.min(1, (u - U0) / N)));   // Bogenträger unter dem Belag
    const posts = N >= 4 ? [U0 + N / 2] : [];
    const post = (u, v) => poly([S(u - 0.04, v, 0), S(u + 0.04, v, 0), S(u + 0.04, v, rib(u)), S(u - 0.04, v, rib(u))], C(L.side));
    for (const u of posts) post(u, -W + 0.06);                                                       // Stütze hinten
    for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, -W, dk(u)), S(u, -W, dk(u) + 6)], C(L.rail), 1); }   // hinteres Geländer
    path(us.map(u => S(u, -W, dk(u) + 6)), C(L.rail), 1.3);
    for (const u of posts) post(u, W - 0.06);                                                        // Stütze vorn (unter dem Belag)
    poly([...us.map(u => S(u, -W, dk(u))), ...[...us].reverse().map(u => S(u, W, dk(u)))], C(L.deck));   // Belag
    for (let k = 0; k <= 9 * N; k++) { const u = U0 + k / 9; path([S(u, -W, dk(u)), S(u, W, dk(u))], C(L.plank), 0.6); }   // Planken
    band(W, u => dk(u) - 2, dk, C(shade(L.side, 0.05)));                                              // Randbalken
    for (let k = 1; k < 2 * N; k++) { const u = U0 + k / 2; path([S(u, W, rib(u)), S(u, W, dk(u) - 2)], C(L.side), 1); }   // Hänger zwischen Träger und Belag
    band(W, u => rib(u) - 2.2, rib, C(L.rib));                                                         // Bogenträger
    for (let k = 0; k <= 4 * N; k++) { const u = U0 + k / 4; path([S(u, W, dk(u)), S(u, W, dk(u) + 6)], C(L.rail), 1.1); }   // vorderes Geländer
    path(us.map(u => S(u, W, dk(u) + 6)), C(L.rail), 1.5); path(us.map(u => S(u, W, dk(u) + 3)), C(L.rail), 0.9);
  }
  function shot(cx, cy, zz, Wd, Hd, up = H) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const o = { baf: bkArmFrom, off: GL.off };
    bkArmFrom = (x, y, dx, dy) => (mock.has((x + dx) + ',' + (y + dy)) && hillLevel(x, y) >= 1) || o.baf(x, y, dx, dy);
    GL.off = true; resetDrawCaches(); groundVersion++;
    try { const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { bkArmFrom = o.baf; GL.off = o.off; }
    dpr = canvas.width / innerWidth;
    const c = document.createElement('canvas'); c.width = Wd; c.height = Hd; X = c.getContext('2d');
    const ox = canvas.width / 2 - Wd / 2, oy = canvas.height / 2 - Hd / 2;
    X.fillStyle = '#fffaf0'; X.fillRect(0, 0, Wd, Hd); X.drawImage(canvas, ox, oy, Wd, Hd, 0, 0, Wd, Hd);
    X.translate(-ox, -oy); for (const b of [...BR].sort((a, b) => a.y - b.y)) { X.save(); try { bridge(b); } finally { X.restore(); } }
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.bogenEntwurf8 = async (name = 'bogen-anhoehe-8.png', Wd = 620, Hd = 460) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const list = STUFEN.map((hp, k) => [12.5, 4 + 6 * k, 1.45, `Stufe ${k + 1}: Bögen setzen bei ${hp} an`]).concat([[9.9, 4, 5, 'Stufe 1, Anfang nah'], [9.9, 16, 5, 'Stufe 3, Anfang nah'], [9.9, 28, 5, 'Stufe 5, Anfang nah']]);
    const cols = 2, rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Wd + 16); sheet.height = rows * (Hd + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      list.forEach(([x, y, z, l], i) => {
        const c = shot(x, y, z, Wd, Hd), Xs = (i % cols) * (Wd + 16), Ys = Math.floor(i / cols) * (Hd + 50) + 40;
        sx.drawImage(c, Xs, Ys); sx.font = '800 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, Xs + 6, Ys - 10);
      });
    } finally { nightAt = na; gameHour = gh; resetDrawCaches(); groundVersion++; }
    return post(name, sheet);
  };
  return 'ok';
})();
