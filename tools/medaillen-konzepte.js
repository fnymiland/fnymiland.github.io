// Entwurf (Nutzer 26.10.2026: „mach mal nicht diese Schleifen da unten und den Kreis nicht so wie einen Badge – mir gefällt die Anordnung
// wie eine Medaille da innen, zeig mir solche“). Acht Medaillen-Konzepte, je fünf Stufen, nur verdiente Sterne innen.
// Im Spiel laden, dann MD_SHEET(0) / MD_SHEET(1), MD_SHEET(null) schließt; MD_IMG(k, n).
(() => {
  const S = 3, C = 96, X0 = 48, Y0 = 48, R = 25;
  const lin = (x, y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const starPath = (x, cx, cy, r, k = 0.46) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * k : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); };
  const STAR_GOLD = ['#f6c444', '#a8700f', '#fff0b0'];
  const star = (x, cx, cy, r, [fill, edge, hi] = STAR_GOLD) => {
    x.fillStyle = edge; starPath(x, cx, cy + r * 0.14, r); x.fill(); x.fillStyle = fill; starPath(x, cx, cy, r); x.fill();
    x.fillStyle = hi; starPath(x, cx - r * 0.12, cy - r * 0.12, r * 0.42); x.fill();
  };
  const glint = (x, cx, cy, r) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.7); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 1.7, 0, 7); x.fill();
    x.fillStyle = '#fffbe6'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, q = i % 2 ? r * 0.24 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill();
  };
  const gem = (x, cx, cy, r, col) => {
    x.fillStyle = shade(col, -0.35); x.beginPath(); x.arc(cx, cy + 0.6, r, 0, 7); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    x.fillStyle = shade(col, 0.3); x.beginPath(); x.arc(cx + r * 0.2, cy + r * 0.25, r * 0.5, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.26, 0, 7); x.fill();
  };
  const halo = (x, r, col) => { const g = x.createRadialGradient(X0, Y0, r * 0.4, X0, Y0, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(X0, Y0, r, 0, 7); x.fill(); };
  const sparkle = (x, k) => { const P = [[X0 - 31, Y0 - 24, 5], [X0 + 32, Y0 - 16, 5.5], [X0 + 27, Y0 + 28, 4.5], [X0 - 29, Y0 + 22, 4], [X0 + 8, Y0 - 38, 4], [X0 - 16, Y0 - 37, 3.2]]; for (let i = 0; i < Math.min(k, P.length); i++) glint(x, ...P[i]); };
  // Medaille: Schatten, Rand (Verlauf), vertiefte Innenfläche, Sterne, Glanz
  const medal = (x, n, o = {}) => {
    const r = o.r ?? R, b = o.rim ?? 4.5;
    x.fillStyle = 'rgba(60,40,10,.3)'; x.beginPath(); x.ellipse(X0, Y0 + r + 3, r * 0.8, 3.2, 0, 0, 7); x.fill();
    if (o.outline) o.outline(r); else { x.fillStyle = shade((o.rimCols || GOLD).at(-1), -0.3); x.beginPath(); x.arc(X0, Y0 + 1.6, r, 0, 7); x.fill();
      x.fillStyle = lin(x, Y0 - r, Y0 + r, o.rimCols || GOLD); x.beginPath(); x.arc(X0, Y0, r, 0, 7); x.fill(); }
    if (o.rimDeco) o.rimDeco(r);
    x.fillStyle = lin(x, Y0 - r, Y0 + r, ['rgba(0,0,0,.28)', 'rgba(255,255,255,.35)']); x.beginPath(); x.arc(X0, Y0, r - b + 1.2, 0, 7); x.fill();   // Kante innen
    x.fillStyle = typeof o.face === 'function' ? o.face(r - b) : lin(x, Y0 - r, Y0 + r, o.face || ['#41549c', '#1d2550']); x.beginPath(); x.arc(X0, Y0, r - b, 0, 7); x.fill();
    if (o.faceDeco) { x.save(); x.beginPath(); x.arc(X0, Y0, r - b, 0, 7); x.clip(); o.faceDeco(r - b); x.restore(); }
    const k = (r - b) / 15, P = { 1: [[0, 0, 9.5]], 2: [[-5.6, 0, 5.8], [5.6, 0, 5.8]], 3: [[0, -4.9, 5.2], [-5.5, 3.9, 5.2], [5.5, 3.9, 5.2]],
      4: [[-4.9, -4.9, 4.6], [4.9, -4.9, 4.6], [-4.9, 4.9, 4.6], [4.9, 4.9, 4.6]], 5: [[0, -6.5, 4.2], [-6.3, -1.6, 4.2], [6.3, -1.6, 4.2], [-3.9, 5.7, 4.2], [3.9, 5.7, 4.2]] }[n];
    for (const [dx, dy, s] of P) star(x, X0 + dx * k, Y0 + dy * k, s * k, o.starCols);
    x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.ellipse(X0 - r * 0.32, Y0 - r * 0.45, r * 0.42, r * 0.17, -0.55, 0, 7); x.fill();
    if (o.over) o.over(r);
  };
  const GOLD = ['#fff0a8', '#f2c14a', '#d49a2a', '#a8700f'];
  const mk = f => { const c = document.createElement('canvas'); c.width = C * S; c.height = C * S; const x = c.getContext('2d'); x.scale(S, S); f(x); return c.toDataURL(); };
  const RB = ['#ff6f86', '#ffae42', '#ffe066', '#6fd08a', '#5fa8f5', '#a98cf0'];

  const K = [
    { name: '1 Metalle', sub: 'Bronze · Silber · Gold · Platin · Regenbogen-Opal', f: n => mk(x => {
      const T = [
        { rimCols: ['#f6c9a0', '#c98250', '#8a4a20'], face: ['#a8653a', '#6b3a1c'], starCols: ['#f6c9a0', '#7a4420', '#fff0e0'] },
        { rimCols: ['#ffffff', '#d9dee8', '#9aa3b5', '#6f7890'], face: ['#7f8aa3', '#4a5470'], starCols: ['#ffffff', '#7a8296', '#ffffff'] },
        { rimCols: GOLD, face: ['#e8b43a', '#a8700f'], starCols: ['#fff6cc', '#a8700f', '#ffffff'] },
        { rimCols: ['#ffffff', '#e8eef9', '#b9c6e0', '#8796b8'], face: ['#2c4a9e', '#16245c'], over: () => sparkle(x, 3) },
        { rimCols: ['#ffd0e0', '#fff0b0', '#c8f5d8', '#c4e4ff', '#e4d0ff'], face: ['#3a2a6a', '#140c30'], over: () => sparkle(x, 6),
          faceDeco: r => { for (let i = 0; i < 6; i++) { x.fillStyle = RB[i]; x.globalAlpha = 0.28; x.beginPath(); x.arc(X0 - 12 + i * 5, Y0 + 14 - i * 5, 8, 0, 7); x.fill(); } x.globalAlpha = 1; } },
      ][n - 1];
      if (n >= 4) halo(x, 46, n === 5 ? 'rgba(255,205,245,.8)' : 'rgba(200,215,255,.7)');
      medal(x, n, T);
    }) },
    { name: '2 Emaillefarben', sub: 'Grün · Blau · Lila · Rubin · Schwarz mit Goldglitzer', f: n => mk(x => {
      const F = [['#6fc07a', '#2f7a42'], ['#6aa4ef', '#2c5bb0'], ['#9a70e6', '#4d2c9a'], ['#ef5a74', '#8f1c34'], ['#2c2444', '#0c0918']][n - 1];
      if (n >= 4) halo(x, 46, n === 5 ? 'rgba(255,214,120,.8)' : 'rgba(255,150,170,.55)');
      medal(x, n, { face: F, rim: 3.5 + n * 0.6,
        faceDeco: n === 5 ? r => { for (let i = 0; i < 90; i++) { x.fillStyle = i % 3 ? 'rgba(255,215,110,.9)' : 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(X0 - r + (i * 37.7 % (2 * r)), Y0 - r + (i * 13.3 % (2 * r)), i % 4 ? 0.45 : 0.9, 0, 7); x.fill(); } } : null,
        over: () => sparkle(x, n - 1) });
    }) },
    { name: '3 Geprägter Rand', sub: 'glatt · Perlrand · Riffelrand · Zackenrand · Sternform mit Glanz', f: n => mk(x => {
      if (n === 5) halo(x, 47, 'rgba(255,220,130,.8)');
      const outline = r => {
        const pts = n === 4 ? 24 : 10, out = n === 4 ? r + 4 : r + 9, inn = n === 4 ? r : r + 1;
        if (n >= 4) { for (const [col, dy] of [['#a8700f', 1.6], [null, 0]]) { x.fillStyle = col || lin(x, Y0 - out, Y0 + out, GOLD); x.beginPath(); for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, q = i % 2 ? inn : out; x.lineTo(X0 + Math.cos(a) * q, Y0 + dy + Math.sin(a) * q); } x.closePath(); x.fill(); } }
        x.fillStyle = '#a8700f'; x.beginPath(); x.arc(X0, Y0 + 1.6, r, 0, 7); x.fill(); x.fillStyle = lin(x, Y0 - r, Y0 + r, GOLD); x.beginPath(); x.arc(X0, Y0, r, 0, 7); x.fill();
      };
      medal(x, n, { outline,
        rimDeco: r => { if (n === 2 || n >= 4) for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(X0 + Math.cos(a) * (r - 2.2), Y0 + Math.sin(a) * (r - 2.2), 0.95, 0, 7); x.fill(); }
          if (n === 3) { x.strokeStyle = 'rgba(140,90,10,.6)'; x.lineWidth = 0.8; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; x.beginPath(); x.moveTo(X0 + Math.cos(a) * (r - 4), Y0 + Math.sin(a) * (r - 4)); x.lineTo(X0 + Math.cos(a) * r, Y0 + Math.sin(a) * r); x.stroke(); } } },
        over: () => sparkle(x, n >= 4 ? n : 0) });
    }) },
    { name: '4 Lorbeer', sub: 'ohne · Zweige · halber Kranz · ganzer Kranz · goldener Kranz mit Beeren', f: n => mk(x => {
      if (n === 5) halo(x, 47, 'rgba(255,220,130,.75)');
      const leaves = n === 1 ? 0 : n === 2 ? 4 : n === 3 ? 8 : 12, col = n === 5 ? '#f2c14a' : '#5f9a3a';
      for (const side of [-1, 1]) for (let i = 0; i < leaves; i++) { const t = i / 12, a = Math.PI / 2 + side * (0.35 + t * Math.PI * 0.82);
        x.save(); x.translate(X0 + Math.cos(a) * (R + 5), Y0 + Math.sin(a) * (R + 5)); x.rotate(a + side * 1.15);
        x.fillStyle = shade(col, i % 2 ? -0.15 : 0.12); x.beginPath(); x.ellipse(0, 0, 2.9, 6.6, 0, 0, 7); x.fill(); x.restore(); }
      if (n === 5) for (const [dx, dy] of [[-27, 8], [27, 8], [-20, 21], [20, 21]]) gem(x, X0 + dx, Y0 + dy, 1.8, '#e0405a');
      medal(x, n, { over: () => sparkle(x, n - 1) });
    }) },
    { name: '5 Edelsteine', sub: 'ohne · 2 · 4 · 8 · 12 bunte Steine im Rand', f: n => mk(x => {
      if (n >= 4) halo(x, 46, n === 5 ? 'rgba(255,200,240,.8)' : 'rgba(180,210,255,.65)');
      const k = [0, 2, 4, 8, 12][n - 1];
      medal(x, n, { rim: 6, r: 26, over: r => { for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + i / k * Math.PI * 2 + (k === 2 ? Math.PI / 2 : 0); gem(x, X0 + Math.cos(a) * (r - 3), Y0 + Math.sin(a) * (r - 3), k > 8 ? 2.2 : 2.6, n === 5 ? RB[i % 6] : ['#e0405a', '#3f7fe0', '#3fbf7f', '#a96fe0'][i % 4]); } sparkle(x, n - 1); } });
    }) },
    { name: '6 Strahlen', sub: 'Sonnenstrahlen dahinter, länger, doppelt, golden mit Glitzer', f: n => mk(x => {
      if (n >= 2) { const cnt = n >= 4 ? 24 : 16, r1 = R + [0, 6, 10, 13, 17][n - 1];
        for (let i = 0; i < cnt; i++) { const a = i / cnt * Math.PI * 2, d = Math.PI / cnt * 0.55, len = i % 2 && n >= 4 ? r1 - 5 : r1;
          x.fillStyle = n === 5 ? (i % 2 ? '#ffd86a' : '#f2b93a') : (i % 2 ? '#ffe9a8' : '#f6d47a'); x.beginPath(); x.moveTo(X0 + Math.cos(a - d) * (R - 2), Y0 + Math.sin(a - d) * (R - 2)); x.lineTo(X0 + Math.cos(a) * len, Y0 + Math.sin(a) * len); x.lineTo(X0 + Math.cos(a + d) * (R - 2), Y0 + Math.sin(a + d) * (R - 2)); x.closePath(); x.fill(); } }
      if (n === 5) halo(x, 46, 'rgba(255,230,140,.6)');
      medal(x, n, { face: n === 5 ? ['#ffe28a', '#e0a020'] : ['#41549c', '#1d2550'], starCols: n === 5 ? ['#ffffff', '#c98f1e', '#ffffff'] : undefined, over: () => sparkle(x, n >= 3 ? n : 0) });
    }) },
    { name: '7 Ringe', sub: 'jede Stufe ein farbiger Ring mehr, zuletzt Regenbogen', f: n => mk(x => {
      if (n >= 4) halo(x, 47, 'rgba(255,215,140,.7)');
      const cols = n === 5 ? RB.slice(0, 5) : ['#5fae6a', '#4f86d9', '#8a5fd6', '#d9445a'].slice(0, n - 1), r0 = R - 4;
      medal(x, n, { r: R + (n - 1) * 2.4, rim: 4.5 + (n - 1) * 2.4, rimDeco: r => { cols.forEach((c, i) => { x.strokeStyle = c; x.lineWidth = 2.2; x.beginPath(); x.arc(X0, Y0, r - 3.2 - i * 2.4, 0, 7); x.stroke(); }); }, over: () => sparkle(x, n - 1) });
    }) },
    { name: '8 Nachthimmel', sub: 'Sternenhimmel · Mond · Milchstraße · Polarlicht · Gold mit Schein und Sternschnuppe', f: n => mk(x => {
      if (n === 5) halo(x, 47, 'rgba(160,190,255,.85)');
      medal(x, n, { rimCols: n >= 3 ? GOLD : ['#e3e8f3', '#a9b3cc', '#6f7a99'], face: ['#25306a', '#0b1030'],
        faceDeco: r => { for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(X0 - r + (i * 23.3 % (2 * r)), Y0 - r + (i * 11.7 % (2 * r)), i % 5 ? 0.45 : 0.9, 0, 7); x.fill(); }
          if (n >= 3) { x.save(); x.translate(X0, Y0); x.rotate(-0.6); const g = x.createRadialGradient(0, 0, 1, 0, 0, r); g.addColorStop(0, 'rgba(230,230,255,.45)'); g.addColorStop(1, 'rgba(230,230,255,0)'); x.scale(1, 0.3); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore(); }
          if (n >= 4) for (const [c, dy] of [['rgba(90,240,170,.5)', -r * 0.55], ['rgba(240,120,220,.4)', -r * 0.35]]) { x.strokeStyle = c; x.lineWidth = 4; x.beginPath(); for (let t = -r; t <= r; t += 2) x.lineTo(X0 + t, Y0 + dy + Math.sin(t / 5) * 2); x.stroke(); }
          if (n >= 2) { x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(X0 + r * 0.55, Y0 + r * 0.5, 3.6, 0, 7); x.fill(); x.fillStyle = '#121a48'; x.beginPath(); x.arc(X0 + r * 0.55 + 1.8, Y0 + r * 0.5 - 1.2, 3.1, 0, 7); x.fill(); } },
        over: () => { if (n === 5) { x.strokeStyle = 'rgba(255,240,190,.9)'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(X0 + 6, Y0 - 42); x.lineTo(X0 + 30, Y0 - 27); x.stroke(); glint(x, X0 + 31, Y0 - 26, 5); } sparkle(x, n >= 3 ? n - 1 : 0); } });
    }) },
  ];
  // Runde 2 (Nutzer: „die Rahmen von 1 sind so genial, aber die Innenfarbe sowie die Sterne sollten gleich bleiben wie bei 8“)
  const METAL = [['#f6c9a0', '#c98250', '#8a4a20'], ['#ffffff', '#d9dee8', '#9aa3b5', '#6f7890'], GOLD, ['#ffffff', '#e8eef9', '#b9c6e0', '#8796b8'], ['#ffd0e0', '#fff0b0', '#c8f5d8', '#c4e4ff', '#e4d0ff']];
  const night = (n, grow) => r => {
    for (let i = 0; i < 30; i++) { x0.fillStyle = 'rgba(255,255,255,.8)'; x0.beginPath(); x0.arc(X0 - r + (i * 23.3 % (2 * r)), Y0 - r + (i * 11.7 % (2 * r)), i % 5 ? 0.45 : 0.9, 0, 7); x0.fill(); }
    if (!grow) return; const x = x0;
    if (n >= 3) { x.save(); x.translate(X0, Y0); x.rotate(-0.6); const g = x.createRadialGradient(0, 0, 1, 0, 0, r); g.addColorStop(0, 'rgba(230,230,255,.45)'); g.addColorStop(1, 'rgba(230,230,255,0)'); x.scale(1, 0.3); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.restore(); }
    if (n >= 4) for (const [c, dy] of [['rgba(90,240,170,.5)', -r * 0.55], ['rgba(240,120,220,.4)', -r * 0.35]]) { x.strokeStyle = c; x.lineWidth = 4; x.beginPath(); for (let t = -r; t <= r; t += 2) x.lineTo(X0 + t, Y0 + dy + Math.sin(t / 5) * 2); x.stroke(); }
    if (n >= 2) { x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(X0 + r * 0.55, Y0 + r * 0.5, 3.6, 0, 7); x.fill(); x.fillStyle = '#121a48'; x.beginPath(); x.arc(X0 + r * 0.55 + 1.8, Y0 + r * 0.5 - 1.2, 3.1, 0, 7); x.fill(); }
  };
  let x0 = null;
  const metalNight = grow => n => mk(x => {
    x0 = x;
    if (n >= 4) halo(x, 46, n === 5 ? 'rgba(255,205,245,.8)' : 'rgba(200,215,255,.7)');
    medal(x, n, { rimCols: METAL[n - 1], face: ['#25306a', '#0b1030'], faceDeco: night(n, grow), over: () => sparkle(x, n >= 4 ? (n === 5 ? 6 : 3) : 0) });
  });
  K.push({ name: 'A Metallrahmen, Nachthimmel innen gleich', sub: 'Bronze · Silber · Gold · Platin · Opal', f: metalNight(false) },
    { name: 'B Metallrahmen, Nachthimmel wächst mit', sub: 'dazu Mond · Milchstraße · Polarlicht', f: metalNight(true) });
  // Runde 3 (Nutzer: „A, aber in der Leiste kaum ein Unterschied zwischen 4 und 5 – Regenbogen leicht(!!) kräftiger, etwas glitzernd
  // diamantig; Stufe 4 Gold, 3 Silber, 2 Bronze, 1 gar kein Rahmen“)
  const RAINBOW = ['#ff7fa6', '#ffb84a', '#ffe452', '#5fd895', '#5fb0ff', '#a986ff', '#ff7fa6'];
  const rainbowRim = x => r => {
    x.fillStyle = '#8a7aa8'; x.beginPath(); x.arc(X0, Y0 + 1.6, r, 0, 7); x.fill();
    const g = x.createConicGradient(-Math.PI / 2, X0, Y0); RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c));
    x.fillStyle = g; x.beginPath(); x.arc(X0, Y0, r, 0, 7); x.fill();
    x.fillStyle = lin(x, Y0 - r, Y0 + r, ['rgba(255,255,255,.32)', 'rgba(255,255,255,0)', 'rgba(60,30,90,.25)']); x.beginPath(); x.arc(X0, Y0, r, 0, 7); x.fill();
  };
  const diamond = x => r => {                                             // Schliff: helle Facettenkanten und funkelnde Punkte auf dem Rand
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 0.6;
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; x.beginPath(); x.moveTo(X0 + Math.cos(a) * (r - 4.4), Y0 + Math.sin(a) * (r - 4.4)); x.lineTo(X0 + Math.cos(a + 0.2) * r, Y0 + Math.sin(a + 0.2) * r); x.stroke(); }
    for (const [a, s] of [[-2.3, 2.4], [-0.4, 1.9], [2.4, 2.1]]) glint(x, X0 + Math.cos(a) * (r - 2.2), Y0 + Math.sin(a) * (r - 2.2), s);
  };
  const tier3 = n => mk(x => {
    x0 = x;
    if (n === 4) halo(x, 44, 'rgba(255,215,120,.55)');
    if (n === 5) halo(x, 47, 'rgba(255,200,240,.85)');
    const o = { face: ['#25306a', '#0b1030'], faceDeco: night(n, false) };
    if (n === 1) Object.assign(o, { rim: 1.4, rimCols: ['#4a578f', '#1a2050'] });
    else if (n === 5) Object.assign(o, { r: 26.5, rim: 6, outline: rainbowRim(x), rimDeco: diamond(x), over: () => sparkle(x, 6) });
    else Object.assign(o, { rimCols: [null, ['#f6c9a0', '#c98250', '#8a4a20'], ['#ffffff', '#d9dee8', '#9aa3b5', '#6f7890'], GOLD][n - 1], over: n === 4 ? () => sparkle(x, 2) : null });
    medal(x, n, o);
  });
  K.push({ name: 'C ohne Rahmen · Bronze · Silber · Gold · Regenbogen-Diamant', sub: 'innen Nachthimmel, immer gleich', f: tier3 });
  window.MD_C = () => {
    let el = document.getElementById('md-sheet'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'md-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:10px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24';
    const k = K.length - 1, big = h => [1, 2, 3, 4, 5].map(n => `<img src="${MD_IMG(k, n)}" style="height:${h}px">`).join('');
    const tight = h => [1, 2, 3, 4, 5].map(n => `<span style="display:inline-block;width:${h}px;height:${h}px;position:relative"><img src="${MD_IMG(k, n)}" style="position:absolute;height:${Math.round(h * 1.75)}px;left:50%;top:50%;transform:translate(-50%,-50%)"></span>`).join('');
    el.innerHTML = `<div>${K[k].name} <span style="font-weight:500;font-size:12px;color:#8a6a4a">${K[k].sub}</span></div>
      <div style="display:flex;align-items:center;gap:14px;margin:-4px 0 4px">${big(140)}</div>
      <div style="display:flex;gap:16px;align-items:center;margin:4px 0 10px">
        <span style="display:flex;gap:12px;align-items:center;padding:4px 12px;border-radius:6px;background:#ecd4a3;border:1.5px solid #8a5a34">Leiste (Hecke): ${tight(30)}</span>
        <span style="display:flex;gap:12px;align-items:center;padding:4px 12px;border-radius:12px;background:#fff;border:2px solid #a9bde0;color:#3b4763">Leiste (Wolken): ${tight(30)}</span></div>
      <div style="display:flex;gap:16px;align-items:center"><span style="display:flex;gap:12px;align-items:center;padding:4px 12px;border-radius:8px;background:#fffaf0">Freundesliste: ${tight(22)}</span>
        <span style="display:flex;gap:12px;align-items:center;padding:4px 12px;border-radius:8px;background:#fffaf0">Stufe 4 und 5 nebeneinander, Leistengröße: ${tight(30).split('</span>').slice(3, 5).join('</span>')}</span></span></div>`;
    document.body.append(el); return 'C';
  };
  // Runde 4 (Nutzer: „Stufe 5 gefällt mir noch nicht ganz – diese schrägen Linien im Rahmen sind … hm“): Fassungen für Stufe 5 ohne Schräglinien
  const DIA = {
    a: x => r => { for (const [a, s] of [[-2.3, 2.6], [-0.3, 2.1], [2.4, 2.3]]) glint(x, X0 + Math.cos(a) * (r - 2.6), Y0 + Math.sin(a) * (r - 2.6), s); },
    b: x => r => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, cx = X0 + Math.cos(a) * (r - 3), cy = Y0 + Math.sin(a) * (r - 3);
      x.fillStyle = 'rgba(80,60,120,.35)'; x.beginPath(); x.arc(cx, cy + 0.5, 1.9, 0, 7); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx, cy - 1.9); x.lineTo(cx + 1.9, cy); x.lineTo(cx, cy + 1.9); x.lineTo(cx - 1.9, cy); x.closePath(); x.fill();
      x.fillStyle = '#d8ecff'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 1.9, cy); x.lineTo(cx, cy + 1.9); x.closePath(); x.fill(); }
      glint(x, X0 + Math.cos(-2.3) * (r - 3), Y0 + Math.sin(-2.3) * (r - 3), 3); glint(x, X0 + Math.cos(0.5) * (r - 3), Y0 + Math.sin(0.5) * (r - 3), 2.4); },
    c: x => r => { for (let i = 0; i < 70; i++) { const a = i * 2.39996, d = r - 1 - (i * 7.31 % 5); x.fillStyle = i % 3 ? 'rgba(255,255,255,.9)' : 'rgba(255,245,200,.95)'; x.beginPath(); x.arc(X0 + Math.cos(a) * d, Y0 + Math.sin(a) * d, i % 5 ? 0.4 : 0.75, 0, 7); x.fill(); }
      glint(x, X0 + Math.cos(-2.3) * (r - 2.6), Y0 + Math.sin(-2.3) * (r - 2.6), 2.4); glint(x, X0 + Math.cos(2.4) * (r - 2.6), Y0 + Math.sin(2.4) * (r - 2.6), 2); },
    d: x => r => { for (let i = 0; i < 24; i++) { const a0 = i / 24 * Math.PI * 2, a1 = (i + 1) / 24 * Math.PI * 2; x.fillStyle = i % 2 ? 'rgba(255,255,255,.28)' : 'rgba(60,30,100,.12)';
      x.beginPath(); x.arc(X0, Y0, r, a0, a1); x.arc(X0, Y0, r - 6, a1, a0, true); x.closePath(); x.fill(); }
      glint(x, X0 + Math.cos(-2.3) * (r - 2.6), Y0 + Math.sin(-2.3) * (r - 2.6), 2.6); glint(x, X0 + Math.cos(0.6) * (r - 2.6), Y0 + Math.sin(0.6) * (r - 2.6), 2.1); },
    e: x => r => { x.strokeStyle = '#f2c14a'; x.lineWidth = 1.3; x.beginPath(); x.arc(X0, Y0, r - 0.65, 0, 7); x.stroke(); x.beginPath(); x.arc(X0, Y0, r - 5.4, 0, 7); x.stroke();
      glint(x, X0 + Math.cos(-2.3) * (r - 3), Y0 + Math.sin(-2.3) * (r - 3), 2.6); glint(x, X0 + Math.cos(0.6) * (r - 3), Y0 + Math.sin(0.6) * (r - 3), 2.1); },
    f: x => r => { for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; x.fillStyle = '#fff8ee'; x.beginPath(); x.arc(X0 + Math.cos(a) * (r - 5.2), Y0 + Math.sin(a) * (r - 5.2), 0.95, 0, 7); x.fill(); }
      glint(x, X0 + Math.cos(-2.3) * (r - 2.4), Y0 + Math.sin(-2.3) * (r - 2.4), 2.6); glint(x, X0 + Math.cos(0.6) * (r - 2.4), Y0 + Math.sin(0.6) * (r - 2.4), 2.1); },
  };
  const five = v => mk(x => { x0 = x; halo(x, 47, 'rgba(255,200,240,.85)');
    medal(x, 5, { r: 26.5, rim: 6, face: ['#25306a', '#0b1030'], faceDeco: night(5, false), outline: rainbowRim(x), rimDeco: DIA[v](x), over: () => sparkle(x, 6) }); });
  window.MD_FIVE = () => {
    let el = document.getElementById('md-sheet'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'md-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:10px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px';
    const gold = MD_IMG(K.length - 1, 4), names = { a: 'a glatt, Lichtpunkte', b: 'b eingesetzte Diamanten', c: 'c Glitzerstaub', d: 'd Brillantschliff', e: 'e mit Goldfassung', f: 'f Perlenring innen' };
    const tight = (u, h) => `<span style="display:inline-block;width:${h}px;height:${h}px;position:relative"><img src="${u}" style="position:absolute;height:${Math.round(h * 1.75)}px;left:50%;top:50%;transform:translate(-50%,-50%)"></span>`;
    el.innerHTML = Object.keys(DIA).map(v => { const u = five(v); return `<div style="background:#fffaf0;border-radius:12px;padding:6px 8px">${names[v]}
      <div style="display:flex;align-items:center;justify-content:center"><img src="${u}" style="height:150px"></div>
      <div style="display:flex;gap:10px;align-items:center;justify-content:center;padding:4px 8px;border-radius:6px;background:#ecd4a3;border:1.5px solid #8a5a34">Leiste: ${tight(gold, 30)} ${tight(u, 30)}</div></div>`; }).join('');
    document.body.append(el); return 'Stufe 5';
  };
  // Probe: groß und klein (Leiste ≈ 30 px, Freundesliste ≈ 22 px) auf Holz und Wolke
  window.MD_MIX = () => {
    let el = document.getElementById('md-sheet'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'md-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:8px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24';
    const row = (k, h) => [1, 2, 3, 4, 5].map(n => `<img src="${MD_IMG(k, n)}" style="height:${h}px">`).join('');
    // klein: eng zugeschnitten (Medaille füllt den Platz, Schein und Glitzer ragen nur wenig hinaus)
    const tight = (k, h) => [1, 2, 3, 4, 5].map(n => `<span style="display:inline-block;width:${h}px;height:${h}px;position:relative"><img src="${MD_IMG(k, n)}" style="position:absolute;height:${Math.round(h * 1.75)}px;left:50%;top:50%;transform:translate(-50%,-50%)"></span>`).join('');
    el.innerHTML = [8, 9].map(k => `<div>${K[k].name} <span style="font-weight:500;font-size:12px;color:#8a6a4a">${K[k].sub}</span></div>
      <div style="display:flex;align-items:center;gap:14px;margin:-4px 0 -2px">${row(k, 128)}</div>
      <div style="display:flex;gap:16px;align-items:center;margin:0 0 10px">
        <span style="display:flex;gap:4px;align-items:center;padding:3px 10px;border-radius:6px;background:var(--grain, none), #ecd4a3;border:1.5px solid #8a5a34">klein in der Leiste: ${tight(k, 30)}</span>
        <span style="display:flex;gap:4px;align-items:center;padding:3px 10px;border-radius:10px;background:#fff;border:2px solid #a9bde0;color:#3b4763">Freundesliste: ${tight(k, 22)}</span></div>`).join('');
    document.body.append(el); return 'Probe';
  };
  const cache = {};
  window.MD_IMG = (k, n) => cache[k + ':' + n] ||= K[k].f(n);
  window.MD_SHEET = (page, h = 112) => {
    let el = document.getElementById('md-sheet'); if (el) el.remove();
    if (page == null) return 'aus';
    el = document.createElement('div'); el.id = 'md-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:8px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24';
    const ks = [0, 1, 2, 3].map(i => page * 4 + i).filter(i => i < K.length);
    el.innerHTML = ks.map(k => `<div>${K[k].name} <span style="font-weight:500;font-size:12px;color:#8a6a4a">${K[k].sub}</span></div>
      <div style="display:flex;align-items:center;gap:14px;margin:-4px 0 -4px 0">${[1, 2, 3, 4, 5].map(n => `<img src="${MD_IMG(k, n)}" style="height:${h}px">`).join('')}</div>`).join('');
    document.body.append(el);
    return ks.map(k => K[k].name).join(', ');
  };
})();
