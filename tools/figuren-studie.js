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
  // A2 · klassisch, ausgearbeitet: alle Maße in Kopflängen (P(u, v): u nach rechts, v nach oben, Fuß = 0)
  function figA2(x0, y0, hd, Pal = PAT) {
    const [col, colD, colL] = Pal, P = (u, v) => [x0 + u * hd, y0 - v * hd], W = w => w * hd;
    const sh = (fn) => shadeShape(fn, x0, hd, Pal);
    const curve = pts => { g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(...pts[i], ...m); } g.lineTo(...pts[pts.length - 1]); };
    // Haar hinten mit Knoten
    ellipse(...P(0.06, 7.42), W(0.48), W(0.55), col); circle(...P(0.16, 7.0), W(0.18), col);   // Haar hinten, Knoten
    // Gewand (Chiton): Schultern – Brust – Taille – Hüfte – Knie – Saum
    const robe = () => { curve([P(-0.92, 6.58), P(-1.02, 6.0), P(-0.72, 5.05), P(-0.9, 4.25), P(-1.1, 2.3), P(-1.26, 0.02)]);
      for (let i = 0; i <= 12; i++) g.lineTo(...P(-1.26 + 2.56 * i / 12, 0.02 + Math.sin(i * 1.9) * 0.05));
      const r = [P(1.3, 0.02), P(1.12, 2.3), P(0.92, 4.25), P(0.74, 5.05), P(1.04, 6.0), P(0.94, 6.62)]; for (let i = 1; i < r.length; i++) g.lineTo(...r[i]);
      g.quadraticCurveTo(...P(0, 6.42), ...P(-0.92, 6.58)); g.closePath(); };
    sh(robe);
    g.save(); g.beginPath(); robe(); g.clip();
    for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, xb = -1.2 + 2.45 * t, xt = -0.62 + 1.3 * t; L2(i % 2 ? colD : colL, W(0.05), [P(xt, 4.6), P((xt + xb) / 2 + 0.04 * Math.sin(i), 2.2), P(xb, 0.05)]); }   // senkrechte Falten
    for (let i = 0; i < 4; i++) L2(colD, W(0.04), [P(-0.4 + i * 0.25, 6.2), P(-0.25 + i * 0.22, 5.55), P(-0.35 + i * 0.25, 5.1)]);   // weiche Falten an der Brust
    g.restore();
    ellipse(...P(-0.86, 6.45), W(0.2), W(0.17), colL); ellipse(...P(0.86, 6.48), W(0.2), W(0.17), colD);   // runde Schultern
    // Überwurf (Stola): von der linken Schulter schräg zur rechten Hüfte, Ende hängt rechts herab
    const stola = () => { g.moveTo(...P(-0.95, 6.6)); g.lineTo(...P(-0.55, 6.55)); g.quadraticCurveTo(...P(0.4, 5.4), ...P(0.98, 4.7)); g.lineTo(...P(1.05, 4.05)); g.quadraticCurveTo(...P(0.2, 4.6), ...P(-0.98, 6.05)); g.closePath(); };
    g.fillStyle = colL; g.beginPath(); stola(); g.fill();
    g.save(); g.beginPath(); stola(); g.clip(); for (let k = 0; k < 4; k++) L2(colD, W(0.04), [P(-0.9 + k * 0.08, 6.45 - k * 0.12), P(0.95 - k * 0.02, 4.55 - k * 0.12)]); g.restore();
    g.fillStyle = col; g.beginPath(); g.moveTo(...P(0.95, 4.65)); g.quadraticCurveTo(...P(1.22, 3.6), ...P(1.1, 2.6)); g.lineTo(...P(0.92, 2.7)); g.quadraticCurveTo(...P(0.98, 3.7), ...P(0.86, 4.4)); g.closePath(); g.fill();   // hängendes Ende
    L2(colD, W(0.04), [P(1.02, 4.3), P(1.02, 2.75)]);
    // Zehen unter dem Saum
    for (const [u, f] of [[-0.42, 0], [0.32, 1]]) { ellipse(...P(u, 0.03), W(0.22), W(0.09), colD); for (let t = 0; t < 4; t++) circle(...P(u - 0.13 + t * 0.085, 0.02), W(0.045), f ? col : colL); }
    // Tafel an der Hüfte (Platte mit Kante und Inschrift), Unterarm davor, Finger auf der Tafel
    const T = [P(-1.5, 5.5), P(-0.9, 5.98), P(-0.3, 3.82), P(-0.9, 3.36)];
    poly(T.map(([x, y]) => [x + W(0.12), y + W(0.06)]), colD);
    poly(T, colL); g.strokeStyle = colD; g.lineWidth = W(0.03); g.beginPath(); T.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke();
    for (let r = 0; r < 4; r++) { const a = [T[0][0] + (T[3][0] - T[0][0]) * (0.22 + r * 0.17), T[0][1] + (T[3][1] - T[0][1]) * (0.22 + r * 0.17)], b = [a[0] + (T[1][0] - T[0][0]) * 0.75, a[1] + (T[1][1] - T[0][1]) * 0.75]; L2(colD, W(0.035), [a, b]); }
    const shL = P(-0.93, 6.5), elL = P(-1.12, 5.25), wrL = P(-0.72, 4.55);
    limb(shL, elL, W(0.2), W(0.17), colL, col); limb(elL, wrL, W(0.16), W(0.13), colL, col);
    ellipse(...P(-0.94, 6.5), W(0.24), W(0.18), colL);                                                          // Ärmelkappe
    for (let f = 0; f < 4; f++) ellipse(...P(-0.66 + f * 0.07, 4.43 - f * 0.11), W(0.06), W(0.1), f % 2 ? col : colL);   // Finger auf der Tafel
    // Hals, Kopf, Gesicht (Statue: ruhig, keine gemalten Augen), Haar vorn, Diadem mit Strahlen
    poly([P(-0.21, 6.5), P(0.21, 6.5), P(0.18, 7.0), P(-0.18, 7.0)], col); poly([P(0.04, 6.5), P(0.21, 6.5), P(0.18, 7.0), P(0.04, 7.0)], colD);
    const hc = P(0, 7.46);
    for (let j = 0; j < 7; j++) { const a = -Math.PI * (0.14 + j * 0.72 / 6); poly([[hc[0] + Math.cos(a - 0.09) * W(0.42), hc[1] + Math.sin(a - 0.09) * W(0.42) - W(0.1)], [hc[0] + Math.cos(a) * W(0.95), hc[1] + Math.sin(a) * W(0.95) - W(0.1)], [hc[0] + Math.cos(a + 0.09) * W(0.42), hc[1] + Math.sin(a + 0.09) * W(0.42) - W(0.1)]], GOLD); }
    ellipse(hc[0], hc[1], W(0.42), W(0.52), colL);
    g.save(); g.beginPath(); g.ellipse(hc[0], hc[1], W(0.42), W(0.52), 0, 0, Math.PI * 2); g.clip(); g.globalAlpha = 0.45; ellipse(hc[0] + W(0.3), hc[1] + W(0.04), W(0.22), W(0.56), colD); g.globalAlpha = 1; g.restore();
    ellipse(hc[0] - W(0.16), hc[1] + W(0.1), W(0.1), W(0.11), 'rgba(255,255,255,0.25)');                   // Wange im Licht
    g.strokeStyle = colD; g.lineWidth = W(0.035); g.lineCap = 'round';
    g.beginPath(); g.arc(hc[0] - W(0.15), hc[1] - W(0.02), W(0.09), 1.1 * Math.PI, 1.9 * Math.PI); g.stroke();   // Lid, ruhig
    g.beginPath(); g.arc(hc[0] + W(0.12), hc[1] - W(0.02), W(0.08), 1.1 * Math.PI, 1.9 * Math.PI); g.stroke();
    poly([P(0.0, 7.5), P(0.07, 7.3), P(-0.02, 7.28)], colD);                                                  // Nase
    L2(colD, W(0.03), [P(-0.07, 7.16), P(0.06, 7.16)]);                                                       // Mund
    g.fillStyle = col; g.beginPath(); g.ellipse(hc[0], hc[1] - W(0.3), W(0.44), W(0.22), 0, Math.PI, 0); g.fill();   // Haar über der Stirn (schmal)
    for (const s of [-1, 1]) { g.fillStyle = s < 0 ? col : colD; g.beginPath(); g.ellipse(hc[0] + s * W(0.38), hc[1] - W(0.02), W(0.08), W(0.22), 0, 0, Math.PI * 2); g.fill(); }   // Wellen über den Ohren
    L2(colD, W(0.025), [P(-0.3, 7.72), P(-0.1, 7.66), P(0.1, 7.72), P(0.3, 7.66)]);
    poly([P(-0.43, 7.74), P(0.43, 7.74), P(0.41, 7.86), P(-0.41, 7.86)], GOLD_D);                                  // Diadem
    // erhobener Arm: Oberarm, Ärmel fällt zur Schulter, nackter Unterarm, Faust mit Fingern und Daumen
    const shR = P(0.92, 6.55), elR = P(1.18, 7.95), wrR = P(1.24, 9.15);
    limb(shR, elR, W(0.2), W(0.17), col, colD); limb(elR, wrR, W(0.16), W(0.13), col, colD);
    g.fillStyle = colD; g.beginPath(); g.moveTo(...P(0.7, 6.45)); g.quadraticCurveTo(...P(1.5, 7.0), ...P(1.36, 7.75)); g.lineTo(...P(1.02, 7.8)); g.quadraticCurveTo(...P(1.02, 7.0), ...P(0.75, 6.75)); g.closePath(); g.fill();   // Ärmel
    const fist = P(1.25, 9.32); ellipse(fist[0], fist[1], W(0.17), W(0.2), col);
    for (let f = 0; f < 4; f++) L2(colD, W(0.025), [[fist[0] - W(0.14), fist[1] - W(0.12) + f * W(0.07)], [fist[0] + W(0.06), fist[1] - W(0.12) + f * W(0.07)]]);
    ellipse(fist[0] - W(0.13), fist[1] + W(0.02), W(0.06), W(0.11), colL);                                    // Daumen
    lantern(fist[0], fist[1] - W(0.16), hd / 13);
  }
  // A3 · klassisch, nach Prüfung neu aufgebaut (21.10.2026): Maße in Kopflängen, Hand ¾ Kopf, Fuß sichtbar, Tafel auf dem Unterarm
  function figA3(x0, y0, hd, Pal = PAT) {
    const [col, colD, colL] = Pal, P = (u, v) => [x0 + u * hd, y0 - v * hd], W = w => w * hd;
    const curve = pts => { g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; g.quadraticCurveTo(...pts[i], ...m); } g.lineTo(...pts[pts.length - 1]); };
    const seg = (a, b, w0, w1, c) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], c); };
    // Haar hinten (Knoten im Nacken)
    ellipse(...P(0.04, 7.42), W(0.47), W(0.54), col); circle(...P(0.18, 6.98), W(0.17), colD);
    // Gewand: runde Schultern, Brust, Gurt, Taille, Hüfte, weiter Saum mit Wellen
    const robe = () => { curve([P(-0.62, 6.66), P(-0.98, 6.5), P(-1.0, 5.95), P(-0.66, 5.4), P(-0.86, 4.3), P(-1.12, 2.3), P(-1.3, 0.02)]);
      for (let i = 0; i <= 14; i++) g.lineTo(...P(-1.3 + 2.62 * i / 14, 0.02 + Math.sin(i * 1.6) * 0.08));
      const r = [P(1.32, 0.02), P(1.14, 2.3), P(0.9, 4.3), P(0.68, 5.4), P(1.02, 5.95), P(1.0, 6.52), P(0.62, 6.68)]; for (let i = 1; i < r.length - 1; i++) { const m = [(r[i][0] + r[i + 1][0]) / 2, (r[i][1] + r[i + 1][1]) / 2]; g.quadraticCurveTo(...r[i], ...m); } g.lineTo(...r[r.length - 1]);
      g.quadraticCurveTo(...P(0, 6.5), ...P(-0.62, 6.66)); g.closePath(); };
    shadeShape(robe, x0, hd, Pal);
    g.save(); g.beginPath(); robe(); g.clip();
    for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, xb = -1.24 + 2.5 * t, xt = -0.6 + 1.25 * t; L2(i % 2 ? colD : colL, W(0.05), [P(xt, 5.3), P((xt + xb) / 2 + 0.05 * Math.sin(i * 2), 2.4), P(xb, 0.08)]); }
    for (let i = 0; i < 4; i++) L2(colD, W(0.035), [P(-0.45 + i * 0.28, 6.3), P(-0.3 + i * 0.25, 5.85)]);
    poly([P(-0.72, 5.62), P(0.74, 5.62), P(0.72, 5.5), P(-0.7, 5.5)], colD);                                     // Gurt unter der Brust
    g.restore();
    // Fuß: rechter Fuß tritt leicht vor, linker nur angedeutet
    ellipse(...P(-0.42, 0.04), W(0.2), W(0.07), colD);
    ellipse(...P(0.36, 0.0), W(0.34), W(0.13), colD); ellipse(...P(0.33, 0.03), W(0.3), W(0.11), col);
    for (let t = 0; t < 3; t++) L2(colD, W(0.02), [P(0.42 + t * 0.07, 0.06), P(0.45 + t * 0.07, -0.04)]);
    // linker Arm: Oberarm hängt (hinter der Tafel), Unterarm waagerecht davor, Hand hält die untere Ecke
    const shL = P(-0.86, 6.42), elL = P(-1.18, 4.85), haL = P(-0.62, 4.62);
    seg(shL, elL, W(0.19), W(0.15), colL); circle(...elL, W(0.15), colL);
    // Stola über der linken Schulter, schräg zur rechten Hüfte
    const stola = () => { g.moveTo(...P(-1.02, 6.4)); g.quadraticCurveTo(...P(-0.85, 6.72), ...P(-0.5, 6.6)); g.quadraticCurveTo(...P(0.4, 5.6), ...P(0.98, 4.75)); g.lineTo(...P(1.04, 4.1)); g.quadraticCurveTo(...P(0.2, 4.65), ...P(-1.0, 6.0)); g.closePath(); };
    g.fillStyle = colL; g.beginPath(); stola(); g.fill();
    g.save(); g.beginPath(); stola(); g.clip(); for (let k = 0; k < 4; k++) L2(colD, W(0.035), [P(-0.92 + k * 0.08, 6.45 - k * 0.12), P(0.98 - k * 0.02, 4.6 - k * 0.12)]); g.restore();
    // hängendes Stola-Ende: breite Bahn mit Falten, unten schräg
    const end = () => { g.moveTo(...P(0.8, 4.75)); g.quadraticCurveTo(...P(1.12, 3.9), ...P(1.18, 2.7)); g.lineTo(...P(0.88, 2.5)); g.quadraticCurveTo(...P(0.86, 3.6), ...P(0.62, 4.45)); g.closePath(); };
    g.fillStyle = col; g.beginPath(); end(); g.fill();
    g.save(); g.beginPath(); end(); g.clip(); for (const u of [0.82, 0.95, 1.06]) L2(colD, W(0.035), [P(u - 0.08, 4.5), P(u + 0.05, 2.6)]); g.restore();
    // Tafel: steht auf dem Unterarm, oben an der Brust; helle Oberkante links, dunkle Dicke rechts/unten
    const T = [P(-1.42, 6.05), P(-0.86, 6.16), P(-0.56, 4.64), P(-1.14, 4.52)];
    poly([T[1], [T[1][0] + W(0.1), T[1][1] + W(0.04)], [T[2][0] + W(0.1), T[2][1] + W(0.04)], T[2]], colD);
    poly([T[2], [T[2][0] + W(0.1), T[2][1] + W(0.04)], [T[3][0] + W(0.1), T[3][1] + W(0.04)], T[3]], colD);
    poly(T, colL);
    for (let r = 0; r < 4; r++) { const t = 0.22 + r * 0.17, a = [T[0][0] + (T[3][0] - T[0][0]) * t + W(0.08), T[0][1] + (T[3][1] - T[0][1]) * t], b = [T[1][0] + (T[2][0] - T[1][0]) * t - W(0.08), T[1][1] + (T[2][1] - T[1][1]) * t]; L2(colD, W(0.03), [a, b]); }
    seg(elL, haL, W(0.15), W(0.12), colL);                                                                       // Unterarm waagerecht vor der Tafel
    const hand = P(-0.55, 4.6); ellipse(...hand, W(0.2), W(0.15), colL);
    for (let f = 0; f < 4; f++) L2(col, W(0.022), [[hand[0] - W(0.1) + f * W(0.06), hand[1] - W(0.12)], [hand[0] - W(0.1) + f * W(0.06), hand[1] + W(0.06)]]);   // Finger um die Ecke
    // Hals und Kopf: helles Gesicht, Haar beidseitig, ruhige Lider, Diadem mit Strahlen
    poly([P(-0.2, 6.52), P(0.2, 6.52), P(0.17, 7.0), P(-0.17, 7.0)], col); poly([P(0.04, 6.52), P(0.2, 6.52), P(0.17, 7.0), P(0.04, 7.0)], colD);
    const hc = P(0, 7.46);
    for (let j = 0; j < 7; j++) { const a = -Math.PI * (0.14 + j * 0.72 / 6), c = [hc[0], hc[1] - W(0.32)]; poly([[c[0] + Math.cos(a - 0.1) * W(0.3), c[1] + Math.sin(a - 0.1) * W(0.3)], [c[0] + Math.cos(a) * W(0.8), c[1] + Math.sin(a) * W(0.8)], [c[0] + Math.cos(a + 0.1) * W(0.3), c[1] + Math.sin(a + 0.1) * W(0.3)]], GOLD); }
    ellipse(hc[0], hc[1], W(0.41), W(0.51), colL);
    g.save(); g.beginPath(); g.ellipse(hc[0], hc[1], W(0.41), W(0.51), 0, 0, Math.PI * 2); g.clip(); g.globalAlpha = 0.4; ellipse(hc[0] + W(0.3), hc[1] + W(0.05), W(0.22), W(0.56), colD); g.globalAlpha = 1; g.restore();
    for (const s of [-1, 1]) { g.fillStyle = s < 0 ? col : colD; g.beginPath(); g.moveTo(hc[0] + s * W(0.42), hc[1] - W(0.3)); g.quadraticCurveTo(hc[0] + s * W(0.5), hc[1], hc[0] + s * W(0.38), hc[1] + W(0.32)); g.lineTo(hc[0] + s * W(0.3), hc[1] + W(0.2)); g.quadraticCurveTo(hc[0] + s * W(0.36), hc[1] - W(0.05), hc[0] + s * W(0.28), hc[1] - W(0.3)); g.closePath(); g.fill(); }   // Haar beidseitig
    g.fillStyle = col; g.beginPath(); g.ellipse(hc[0], hc[1] - W(0.32), W(0.42), W(0.2), 0, Math.PI, 0); g.fill();   // Haar oben
    L2(colD, W(0.028), [P(-0.24, 7.5), P(-0.07, 7.48)]); L2(colD, W(0.028), [P(0.07, 7.48), P(0.22, 7.5)]);   // ruhige Lider
    L2(colD, W(0.02), [P(-0.25, 7.6), P(-0.07, 7.62)]); L2(colD, W(0.02), [P(0.07, 7.62), P(0.24, 7.6)]);     // Brauen
    poly([P(0.0, 7.5), P(0.07, 7.3), P(-0.02, 7.29)], colD); L2(colD, W(0.028), [P(-0.08, 7.17), P(0.07, 7.17)]);
    poly([P(-0.43, 7.74), P(0.43, 7.74), P(0.41, 7.86), P(-0.41, 7.86)], GOLD_D);
    // erhobener Arm: runde Schulter, gerader Oberarm, Ellbogen, Unterarm verjüngt, große Faust um den Griff, Daumen vorn
    const shR = P(0.84, 6.56), elR = P(1.12, 8.0), wrR = P(1.2, 9.1);
    circle(...shR, W(0.22), col);
    seg(shR, elR, W(0.2), W(0.17), col); circle(...elR, W(0.17), col);
    g.fillStyle = col; g.beginPath(); g.moveTo(...P(0.66, 6.5)); g.quadraticCurveTo(...P(1.3, 6.75), ...P(1.32, 7.55)); g.lineTo(...P(1.12, 7.62)); g.quadraticCurveTo(...P(1.02, 7.0), ...P(0.64, 6.8)); g.closePath(); g.fill();   // Ärmel liegt auf dem Oberarm, fällt zur Schulter
    L2(colD, W(0.03), [P(1.0, 6.75), P(1.24, 7.45)]);
    seg(elR, wrR, W(0.17), W(0.13), col); seg([elR[0] + W(0.04), elR[1]], [wrR[0] + W(0.03), wrR[1]], W(0.06), W(0.05), colD);
    const fist = P(1.21, 9.32);
    ellipse(fist[0], fist[1], W(0.21), W(0.25), col);
    for (let f = 0; f < 4; f++) ellipse(fist[0] - W(0.05), fist[1] - W(0.15) + f * W(0.1), W(0.15), W(0.05), f % 2 ? colD : col);   // vier Finger um den Griff
    ellipse(fist[0] - W(0.15), fist[1] + W(0.0), W(0.07), W(0.15), colL);                                       // Daumen vorn
    lantern(fist[0], fist[1] - W(0.22), hd / 12);
  }
  // A4 · ruhig (Nutzer 21.10.2026: „zu viele Details“): Körperbau und Haltung wie A3, große ruhige Flächen, kaum Linien
  function figA4(x0, y0, hd, Pal = PAT) {
    const [col, colD, colL] = Pal, P = (u, v) => [x0 + u * hd, y0 - v * hd], W = w => w * hd;
    const seg = (a, b, w0, w1, c) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; poly([[a[0] + nx * w0, a[1] + ny * w0], [b[0] + nx * w1, b[1] + ny * w1], [b[0] - nx * w1, b[1] - ny * w1], [a[0] - nx * w0, a[1] - ny * w0]], c); circle(...b, w1, c); };
    ellipse(...P(0.04, 7.42), W(0.46), W(0.53), col);                                                          // Haar hinten
    const robe = () => { g.moveTo(...P(-0.62, 6.66)); g.quadraticCurveTo(...P(-1.02, 6.55), ...P(-0.98, 6.0)); g.quadraticCurveTo(...P(-0.62, 5.4), ...P(-0.86, 4.3)); g.quadraticCurveTo(...P(-1.1, 2.2), ...P(-1.3, 0.02));
      g.quadraticCurveTo(...P(0, -0.1), ...P(1.32, 0.02)); g.quadraticCurveTo(...P(1.12, 2.2), ...P(0.9, 4.3)); g.quadraticCurveTo(...P(0.66, 5.4), ...P(1.0, 6.0)); g.quadraticCurveTo(...P(1.04, 6.55), ...P(0.62, 6.68)); g.quadraticCurveTo(...P(0, 6.5), ...P(-0.62, 6.66)); g.closePath(); };
    shadeShape(robe, x0, hd, Pal);
    g.save(); g.beginPath(); robe(); g.clip(); for (const [u, c] of [[-0.45, colL], [0.15, colD], [0.6, colD]]) L2(c, W(0.07), [P(u * 0.6, 4.4), P(u, 2.2), P(u * 1.15, 0.1)]); g.restore();   // drei weiche Falten
    ellipse(...P(0.34, 0.02), W(0.3), W(0.11), colD);                                                          // Fuß
    const shL = P(-0.86, 6.42), elL = P(-1.18, 4.85), haL = P(-0.62, 4.62);
    seg(shL, elL, W(0.19), W(0.15), colL);
    const stola = () => { g.moveTo(...P(-1.02, 6.4)); g.quadraticCurveTo(...P(-0.85, 6.72), ...P(-0.5, 6.6)); g.quadraticCurveTo(...P(0.4, 5.6), ...P(0.98, 4.75)); g.lineTo(...P(1.04, 4.15)); g.quadraticCurveTo(...P(0.2, 4.7), ...P(-1.0, 6.0)); g.closePath(); };
    g.fillStyle = colL; g.beginPath(); stola(); g.fill();
    g.fillStyle = col; g.beginPath(); g.moveTo(...P(0.8, 4.75)); g.quadraticCurveTo(...P(1.12, 3.9), ...P(1.16, 2.7)); g.lineTo(...P(0.88, 2.55)); g.quadraticCurveTo(...P(0.86, 3.6), ...P(0.62, 4.45)); g.closePath(); g.fill();   // Stola-Ende
    const T = [P(-1.42, 6.05), P(-0.86, 6.16), P(-0.56, 4.64), P(-1.14, 4.52)];
    poly([T[1], [T[1][0] + W(0.09), T[1][1] + W(0.04)], [T[2][0] + W(0.09), T[2][1] + W(0.04)], [T[3][0] + W(0.09), T[3][1] + W(0.04)], T[3], T[2]], colD);
    poly(T, colL);                                                                                               // Tafel, glatt
    seg(elL, haL, W(0.15), W(0.12), colL); ellipse(...P(-0.56, 4.6), W(0.19), W(0.15), colL);                   // Unterarm, Hand an der Ecke
    poly([P(-0.2, 6.52), P(0.2, 6.52), P(0.17, 7.0), P(-0.17, 7.0)], col);
    const hc = P(0, 7.46);
    for (let j = 0; j < 7; j++) { const a = -Math.PI * (0.14 + j * 0.72 / 6), c = [hc[0], hc[1] - W(0.32)]; poly([[c[0] + Math.cos(a - 0.1) * W(0.3), c[1] + Math.sin(a - 0.1) * W(0.3)], [c[0] + Math.cos(a) * W(0.8), c[1] + Math.sin(a) * W(0.8)], [c[0] + Math.cos(a + 0.1) * W(0.3), c[1] + Math.sin(a + 0.1) * W(0.3)]], GOLD); }
    ellipse(hc[0], hc[1], W(0.41), W(0.51), colL);
    g.save(); g.beginPath(); g.ellipse(hc[0], hc[1], W(0.41), W(0.51), 0, 0, Math.PI * 2); g.clip(); g.globalAlpha = 0.35; ellipse(hc[0] + W(0.32), hc[1] + W(0.05), W(0.22), W(0.56), colD); g.globalAlpha = 1; g.restore();
    g.fillStyle = col; g.beginPath(); g.ellipse(hc[0], hc[1] - W(0.3), W(0.43), W(0.22), 0, Math.PI, 0); g.fill();
    for (const s of [-1, 1]) ellipse(hc[0] + s * W(0.38), hc[1] - W(0.02), W(0.08), W(0.26), s < 0 ? col : colD);   // Haar an den Seiten
    poly([P(0.0, 7.5), P(0.07, 7.32), P(-0.02, 7.31)], colD);                                                   // Nase
    poly([P(-0.43, 7.74), P(0.43, 7.74), P(0.41, 7.86), P(-0.41, 7.86)], GOLD_D);
    const shR = P(0.84, 6.56), elR = P(1.12, 8.0), wrR = P(1.2, 9.1);
    circle(...shR, W(0.22), col); seg(shR, elR, W(0.2), W(0.17), col); seg(elR, wrR, W(0.17), W(0.13), col);
    const fist = P(1.21, 9.32); ellipse(fist[0], fist[1], W(0.21), W(0.25), col); ellipse(fist[0] - W(0.14), fist[1], W(0.07), W(0.14), colL);
    lantern(fist[0], fist[1] - W(0.22), hd / 12);
  }
  window.FIGUREN = [['A · klassisch', figA], ['B · gemütlich', figB], ['C · verhüllt', figC]];
  window.FIG_A2 = figA2; window.FIG_A3 = figA3; window.FIG_A4 = figA4;
  window.figurA2 = async (hd = 46, W = 520, H = 620) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const prev = g; g = c.getContext('2d'); try { g.fillStyle = '#9fd27a'; g.fillRect(0, 0, W, H); cyl(W / 2, H - 34, 130, 36, 18, '#d6cdb9'); figA3(W / 2, H - 48, hd); } finally { g = prev; } window.__fig = c.toDataURL('image/png'); return [W, H]; };
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
