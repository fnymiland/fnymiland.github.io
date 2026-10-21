// Figurenstudie für Monumente (Nutzer 21.10.2026: „das Design der Figur gefällt mir nicht – anatomisch korrekt“): drei Gestaltungen
// einer stehenden Statue mit Laterne, groß, Licht von links. Maße in Kopflängen (hd): Figur 8 hd, Schultern 2 hd, Oberarm 1,5 hd, Unterarm 1,3 hd.
// (0, eval)(await (await fetch('tools/figuren-studie.js')).text()); await figurenStudie()  → window.__fig
(function figurenTool() {
  const PAT = ['#6fae9a', '#4f8a78', '#a6d8c6'], GOLD = '#f5c84b', GOLD_D = '#c9962a';
  const path = (pts, fill) => { g.fillStyle = fill; g.beginPath(); pts(); g.fill(); };
  const limb = (a, b, w0, w1, col, colD) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], col);
    poly([[a[0] + nx * w0 * 0.15, a[1] + ny * w0 * 0.15], [b[0] + nx * w1 * 0.15, b[1] + ny * w1 * 0.15], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], colD);
    circle(b[0], b[1], w1, col); };
  // Schatten rechts, Licht links innerhalb einer Form
  const shadeShape = (clipFn, x0, hd, [col, colD, colL]) => { g.save(); g.beginPath(); clipFn(); g.clip();
    const gr = g.createLinearGradient(x0 - 1.4 * hd, 0, x0 + 1.4 * hd, 0); gr.addColorStop(0, colL); gr.addColorStop(0.42, col); gr.addColorStop(0.6, col); gr.addColorStop(1, colD);
    g.fillStyle = gr; g.fillRect(x0 - 4 * hd, -1e4, 8 * hd, 2e4); g.restore(); };
  function lantern(x, y, s) {
    L2(GOLD_D, 0.9 * s, [[x, y], [x, y - 4 * s]]);
    poly([[x - 5 * s, y - 4 * s], [x + 5 * s, y - 4 * s], [x + 4 * s, y - 6 * s], [x - 4 * s, y - 6 * s]], GOLD_D);
    poly([[x - 4.2 * s, y - 6 * s], [x + 4.2 * s, y - 6 * s], [x + 3.6 * s, y - 17 * s], [x - 3.6 * s, y - 17 * s]], '#ffe08a');
    for (const dx of [-4, 0, 4]) L2(GOLD_D, 0.8 * s, [[x + dx * s, y - 6 * s], [x + dx * 0.86 * s, y - 17 * s]]);
    path(() => { g.moveTo(x - 1.8 * s, y - 8 * s); g.quadraticCurveTo(x, y - 16 * s, x + 1.8 * s, y - 8 * s); }, '#ff9a3c');
    poly([[x - 5 * s, y - 17 * s], [x + 5 * s, y - 17 * s], [x, y - 23 * s]], GOLD); circle(x, y - 24 * s, 1.4 * s, GOLD);
  }
  const L2 = (col, w, pts) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const crown = (x, y, r, n) => { for (let j = 0; j < n; j++) { const a = -Math.PI * (0.12 + j * 0.76 / (n - 1)); poly([[x + Math.cos(a - 0.1) * r, y + Math.sin(a - 0.1) * r], [x + Math.cos(a) * r * 1.9, y + Math.sin(a) * r * 1.9], [x + Math.cos(a + 0.1) * r, y + Math.sin(a + 0.1) * r]], GOLD); } };

  // A · klassisch: 8 Kopflängen, Stola schräg über die Brust, rechter Arm hebt die Laterne, linker hält die Tafel an der Hüfte
  function figA(x0, y0, hd, P = PAT) {
    const [col, colD, colL] = P, ys = y0 - 6.6 * hd;
    // rechter Arm (hinter dem Kopf hoch): Ärmel bis zum Ellbogen, Unterarm, Faust, Laterne
    const shR = [x0 + 0.95 * hd, ys + 0.1 * hd], elR = [x0 + 1.25 * hd, ys - 1.35 * hd], hand = [x0 + 1.3 * hd, ys - 2.6 * hd];
    limb(shR, elR, 0.36 * hd, 0.3 * hd, col, colD); limb(elR, hand, 0.27 * hd, 0.22 * hd, col, colD);
    path(() => { g.moveTo(shR[0] - 0.35 * hd, shR[1]); g.quadraticCurveTo(shR[0] + 0.7 * hd, shR[1] - 0.3 * hd, elR[0] + 0.32 * hd, elR[1] + 0.2 * hd); g.lineTo(elR[0] - 0.3 * hd, elR[1] + 0.25 * hd); g.quadraticCurveTo(shR[0] - 0.1 * hd, shR[1] - 0.5 * hd, shR[0] - 0.35 * hd, shR[1]); }, colD);   // Ärmel, Schattenseite
    ellipse(hand[0], hand[1], 0.28 * hd, 0.32 * hd, col); ellipse(hand[0] - 0.08 * hd, hand[1] - 0.05 * hd, 0.12 * hd, 0.18 * hd, colL);
    lantern(hand[0], hand[1] - 0.15 * hd, hd / 12);
    // Gewand: Schultern → Taille → Hüfte → Saum, unten Falten
    const robe = () => { g.moveTo(x0 - 1.0 * hd, ys); g.bezierCurveTo(x0 - 1.08 * hd, ys + 1.1 * hd, x0 - 0.6 * hd, y0 - 5.2 * hd, x0 - 0.66 * hd, y0 - 4.9 * hd);
      g.bezierCurveTo(x0 - 0.9 * hd, y0 - 4.2 * hd, x0 - 1.1 * hd, y0 - 2 * hd, x0 - 1.25 * hd, y0);
      for (let i = 0; i <= 10; i++) g.lineTo(x0 - 1.25 * hd + 2.55 * hd * i / 10, y0 + Math.sin(i * 1.7) * 0.06 * hd);
      g.bezierCurveTo(x0 + 1.1 * hd, y0 - 2 * hd, x0 + 0.92 * hd, y0 - 4.2 * hd, x0 + 0.68 * hd, y0 - 4.9 * hd);
      g.bezierCurveTo(x0 + 0.62 * hd, y0 - 5.2 * hd, x0 + 1.08 * hd, ys + 1.1 * hd, x0 + 1.0 * hd, ys); g.quadraticCurveTo(x0, ys - 0.25 * hd, x0 - 1.0 * hd, ys); };
    shadeShape(robe, x0, hd, P);
    g.save(); g.beginPath(); robe(); g.clip();
    for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7, xb = x0 - 1.2 * hd + 2.45 * hd * t, xt = x0 - 0.7 * hd + 1.4 * hd * t; L2(i % 2 ? colD : colL, 0.07 * hd, [[xt, y0 - 4.3 * hd], [(xt + xb) / 2 + 0.05 * hd, y0 - 2 * hd], [xb, y0 - 0.05 * hd]]); }   // senkrechte Falten
    path(() => { g.moveTo(x0 - 1.0 * hd, ys + 0.05 * hd); g.lineTo(x0 - 0.55 * hd, ys - 0.05 * hd); g.lineTo(x0 + 0.95 * hd, y0 - 4.6 * hd); g.lineTo(x0 + 0.7 * hd, y0 - 4.1 * hd); g.closePath(); }, colL);   // Stola schräg
    for (let k = 1; k < 4; k++) L2(colD, 0.05 * hd, [[x0 - 1.0 * hd + k * 0.12 * hd, ys + 0.05 * hd + k * 0.02 * hd], [x0 + 0.95 * hd - k * 0.08 * hd, y0 - 4.6 * hd + k * 0.17 * hd]]);
    g.restore();
    for (const dx of [-0.35, 0.3]) { ellipse(x0 + dx * hd, y0 + 0.02 * hd, 0.24 * hd, 0.1 * hd, colD); ellipse(x0 + dx * hd - 0.03 * hd, y0 - 0.01 * hd, 0.2 * hd, 0.08 * hd, col); }   // Zehen
    // linker Arm: Oberarm am Körper, Unterarm nach vorn, Tafel zwischen Arm und Hüfte
    const shL = [x0 - 0.95 * hd, ys + 0.1 * hd], elL = [x0 - 1.2 * hd, ys + 1.45 * hd], hL = [x0 - 0.75 * hd, ys + 2.1 * hd];
    poly([[x0 - 1.45 * hd, ys + 0.9 * hd], [x0 - 0.62 * hd, ys + 0.75 * hd], [x0 - 0.5 * hd, ys + 2.75 * hd], [x0 - 1.33 * hd, ys + 2.9 * hd]], colD);
    poly([[x0 - 1.38 * hd, ys + 0.95 * hd], [x0 - 0.66 * hd, ys + 0.82 * hd], [x0 - 0.56 * hd, ys + 2.66 * hd], [x0 - 1.27 * hd, ys + 2.8 * hd]], col);
    for (let k = 0; k < 2; k++) L2(colD, 0.05 * hd, [[x0 - 1.2 * hd, ys + (1.4 + k * 0.4) * hd], [x0 - 0.8 * hd, ys + (1.33 + k * 0.4) * hd]]);
    limb(shL, elL, 0.34 * hd, 0.28 * hd, colL, col); limb(elL, hL, 0.26 * hd, 0.21 * hd, colL, col);
    // Hals, Kopf (Haar hinten, glattes Gesicht), Strahlenkrone
    poly([[x0 - 0.2 * hd, ys + 0.02 * hd], [x0 + 0.2 * hd, ys + 0.02 * hd], [x0 + 0.17 * hd, ys - 0.4 * hd], [x0 - 0.17 * hd, ys - 0.4 * hd]], colD);
    const hc = [x0, y0 - 7.5 * hd], r = 0.46 * hd;
    ellipse(hc[0] + 0.06 * hd, hc[1] + 0.12 * hd, r * 1.12, r * 1.18, colD);                                    // Haar hinten
    crown(hc[0], hc[1] - 0.1 * hd, r * 1.05, 7);
    ellipse(hc[0], hc[1] + 0.04 * hd, r * 0.86, r, col);
    g.save(); g.beginPath(); g.ellipse(hc[0], hc[1] + 0.04 * hd, r * 0.86, r, 0, 0, Math.PI * 2); g.clip(); g.globalAlpha = 0.55; ellipse(hc[0] + r * 0.6, hc[1] + 0.1 * hd, r * 0.6, r * 1.1, colD); g.globalAlpha = 1; g.restore();
    ellipse(hc[0] - r * 0.35, hc[1] - r * 0.1, r * 0.25, r * 0.35, colL);
    poly([[hc[0] + 0.02 * r, hc[1] - 0.1 * r], [hc[0] + 0.16 * r, hc[1] + 0.32 * r], [hc[0] - 0.04 * r, hc[1] + 0.34 * r]], colD);   // Nase
    path(() => { g.ellipse(hc[0], hc[1] - 0.42 * r, r * 0.95, r * 0.42, 0, Math.PI, 0); }, colD);           // Haaransatz
    poly([[hc[0] - r * 0.95, hc[1] - 0.42 * r], [hc[0] + r * 0.95, hc[1] - 0.42 * r], [hc[0] + r * 0.88, hc[1] - 0.62 * r], [hc[0] - r * 0.88, hc[1] - 0.62 * r]], GOLD_D);   // Stirnreif
  }
  // B · gemütlich: Spielfiguren-Stil, 4 Kopflängen, runder Kopf, Kapuzenumhang, Laterne mit beiden Händen vor der Brust
  function figB(x0, y0, hd, P = PAT) {
    const [col, colD, colL] = P, H = 4.2 * hd, hc = [x0, y0 - H + 0.75 * hd], r = 0.78 * hd;
    const cloak = () => { g.moveTo(x0 - 0.7 * hd, hc[1] + 0.7 * hd); g.bezierCurveTo(x0 - 1.3 * hd, y0 - 1.2 * hd, x0 - 1.35 * hd, y0 - 0.4 * hd, x0 - 1.3 * hd, y0); g.lineTo(x0 + 1.3 * hd, y0); g.bezierCurveTo(x0 + 1.35 * hd, y0 - 0.4 * hd, x0 + 1.3 * hd, y0 - 1.2 * hd, x0 + 0.7 * hd, hc[1] + 0.7 * hd); g.closePath(); };
    shadeShape(cloak, x0, hd, P);
    for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5; L2(i % 2 ? colD : colL, 0.06 * hd, [[x0 - 0.6 * hd + 1.2 * hd * t, hc[1] + 1.1 * hd], [x0 - 1.2 * hd + 2.4 * hd * t, y0 - 0.05 * hd]]); }
    ellipse(x0, hc[1] + 0.85 * hd, 0.95 * hd, 0.32 * hd, colD);                                              // Kapuze im Nacken
    lantern(x0, y0 - 1.0 * hd, hd / 15);                                                                     // kleine Laterne vor dem Bauch
    for (const s of [-1, 1]) { ellipse(x0 + s * 0.2 * hd, y0 - 1.4 * hd, 0.17 * hd, 0.15 * hd, s < 0 ? colL : col); L2(colD, 0.05 * hd, [[x0 + s * 0.12 * hd, y0 - 1.42 * hd], [x0 + s * 0.28 * hd, y0 - 1.42 * hd]]); }   // Hände halten den Griff
    circle(hc[0], hc[1], r, col);
    g.save(); g.beginPath(); g.arc(hc[0], hc[1], r, 0, Math.PI * 2); g.clip(); g.globalAlpha = 0.45; ellipse(hc[0] + r * 0.7, hc[1] + r * 0.1, r * 0.6, r * 1.1, colD); g.globalAlpha = 1; g.restore();
    ellipse(hc[0] - r * 0.4, hc[1] - r * 0.35, r * 0.28, r * 0.22, colL);
    for (const s of [-1, 1]) { g.strokeStyle = colD; g.lineWidth = 0.08 * hd; g.beginPath(); g.arc(hc[0] + s * 0.32 * r, hc[1] + 0.05 * r, 0.14 * r, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }   // fröhlich geschlossene Augen
    g.beginPath(); g.arc(hc[0], hc[1] + 0.3 * r, 0.12 * r, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    for (const s of [-1, 1]) ellipse(hc[0] + s * 0.55 * r, hc[1] + 0.28 * r, 0.14 * r, 0.08 * r, 'rgba(255,140,150,0.45)');
    crown(hc[0], hc[1] - 0.4 * r, r * 0.75, 5);
  }
  // C · verhüllt: Kapuze mit Schatten statt Gesicht, weite Ärmel, wehendes Gewand, Laterne hoch
  function figC(x0, y0, hd, P = PAT) {
    const [col, colD, colL] = P, ys = y0 - 6.5 * hd;
    const shR = [x0 + 0.9 * hd, ys + 0.15 * hd], elR = [x0 + 1.25 * hd, ys - 1.3 * hd], hand = [x0 + 1.3 * hd, ys - 2.55 * hd];
    limb(elR, hand, 0.25 * hd, 0.2 * hd, col, colD); ellipse(hand[0], hand[1], 0.27 * hd, 0.3 * hd, col);
    lantern(hand[0], hand[1] - 0.15 * hd, hd / 12);
    path(() => { g.moveTo(shR[0] - 0.4 * hd, shR[1] + 0.2 * hd); g.quadraticCurveTo(shR[0] + 0.9 * hd, shR[1] - 0.2 * hd, elR[0] + 0.5 * hd, elR[1] + 0.9 * hd); g.lineTo(elR[0] + 0.2 * hd, elR[1] - 0.1 * hd); g.lineTo(elR[0] - 0.35 * hd, elR[1]); g.quadraticCurveTo(shR[0] - 0.2 * hd, shR[1] - 0.6 * hd, shR[0] - 0.4 * hd, shR[1] + 0.2 * hd); }, colD);   // weiter Ärmel hängt herab
    const robe = () => { g.moveTo(x0 - 0.95 * hd, ys); g.bezierCurveTo(x0 - 1.15 * hd, ys + 2 * hd, x0 - 1.2 * hd, y0 - 2 * hd, x0 - 1.45 * hd, y0); for (let i = 0; i <= 10; i++) g.lineTo(x0 - 1.45 * hd + 2.6 * hd * i / 10, y0 + Math.sin(i * 1.5) * 0.07 * hd);
      g.bezierCurveTo(x0 + 1.1 * hd, y0 - 2 * hd, x0 + 1.05 * hd, ys + 2 * hd, x0 + 0.95 * hd, ys); g.quadraticCurveTo(x0, ys - 0.3 * hd, x0 - 0.95 * hd, ys); };
    shadeShape(robe, x0, hd, P);
    g.save(); g.beginPath(); robe(); g.clip(); for (let i = 0; i < 8; i++) { const t = (i + 0.5) / 8; L2(i % 2 ? colD : colL, 0.07 * hd, [[x0 - 0.8 * hd + 1.6 * hd * t, ys + 0.6 * hd], [x0 - 1.4 * hd + 2.5 * hd * t, y0 - 0.05 * hd]]); } g.restore();
    path(() => { g.moveTo(x0 - 0.95 * hd, ys + 0.3 * hd); g.bezierCurveTo(x0 - 1.6 * hd, ys + 2.4 * hd, x0 - 1.7 * hd, y0 - 1.8 * hd, x0 - 2.0 * hd, y0 - 0.3 * hd); g.lineTo(x0 - 1.45 * hd, y0); g.bezierCurveTo(x0 - 1.25 * hd, y0 - 2.2 * hd, x0 - 1.2 * hd, ys + 2 * hd, x0 - 0.8 * hd, ys + 0.6 * hd); }, colL);   // Umhang weht nach links
    // linker Arm: Ärmel hängt, Hand hält den Saum
    path(() => { g.moveTo(x0 - 0.95 * hd, ys + 0.15 * hd); g.quadraticCurveTo(x0 - 1.5 * hd, ys + 1.6 * hd, x0 - 1.15 * hd, ys + 2.7 * hd); g.lineTo(x0 - 0.55 * hd, ys + 2.5 * hd); g.quadraticCurveTo(x0 - 0.7 * hd, ys + 1.2 * hd, x0 - 0.6 * hd, ys + 0.2 * hd); }, col);
    // Kapuze: Gesicht im Schatten
    const hc = [x0, ys - 0.7 * hd];
    path(() => { g.moveTo(hc[0] - 0.75 * hd, ys + 0.2 * hd); g.bezierCurveTo(hc[0] - 0.85 * hd, hc[1] - 0.6 * hd, hc[0] - 0.2 * hd, hc[1] - 0.95 * hd, hc[0] + 0.15 * hd, hc[1] - 0.85 * hd); g.bezierCurveTo(hc[0] + 0.7 * hd, hc[1] - 0.6 * hd, hc[0] + 0.85 * hd, hc[1], hc[0] + 0.75 * hd, ys + 0.2 * hd); g.closePath(); }, col);
    shadeShape(() => { g.moveTo(hc[0] - 0.75 * hd, ys + 0.2 * hd); g.bezierCurveTo(hc[0] - 0.85 * hd, hc[1] - 0.6 * hd, hc[0] - 0.2 * hd, hc[1] - 0.95 * hd, hc[0] + 0.15 * hd, hc[1] - 0.85 * hd); g.bezierCurveTo(hc[0] + 0.7 * hd, hc[1] - 0.6 * hd, hc[0] + 0.85 * hd, hc[1], hc[0] + 0.75 * hd, ys + 0.2 * hd); g.closePath(); }, x0, hd * 0.6, P);
    path(() => { g.ellipse(hc[0] + 0.02 * hd, hc[1] + 0.12 * hd, 0.36 * hd, 0.46 * hd, 0, 0, Math.PI * 2); }, '#23332e');   // Schatten in der Kapuze
    crown(hc[0], hc[1] - 0.55 * hd, 0.42 * hd, 5);
  }
  window.FIGUREN = [['A · klassisch', figA], ['B · gemütlich', figB], ['C · verhüllt', figC]];
  window.figurenStudie = async () => {
    const W = 380, H = 520, sheet = document.createElement('canvas'); sheet.width = W * 3 + 40; sheet.height = H + 40;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const prev = g;
    try {
      FIGUREN.forEach(([label, fn], i) => {
        const c = document.createElement('canvas'); c.width = W; c.height = H; g = c.getContext('2d');
        g.fillStyle = '#9fd27a'; g.fillRect(0, 0, W, H);
        const fx = W / 2, fy = H - 40; cyl(fx, fy + 6, 120, 34, 18, '#d6cdb9');                               // Sockelausschnitt
        fn(fx, fy - 14, i === 1 ? 74 : 42);
        sx.drawImage(c, 10 + i * (W + 10), 34); sx.font = '700 20px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(label, 14 + i * (W + 10), 24);
      });
    } finally { g = prev; }
    window.__fig = sheet.toDataURL('image/png');
    return [sheet.width, sheet.height];
  };
  return 'ok';
})();
