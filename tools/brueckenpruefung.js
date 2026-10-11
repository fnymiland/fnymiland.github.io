// Prüfbilder der Testwelt „bruecken“ (160c A1): jede Brückenart nah, dazu Nacht und weit – vor und nach jedem Schritt des Umbaus
// vergleichen. Im Browser auf ?welt=bruecken (Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/brueckenpruefung.js')).text()); await brueckenPruefung('vorher')   → tools/vorschau/bruecken-vorher.png
// brueckenPruefung(name, { only: ['wasser-1', …], night: true, cols: 4, z: Faktor })
(function brueckenPruefungTool() {
  // [Name, x, y, Zoom] – Stellen in tools/brueckenwelt.js
  const VIEWS = [
    ['wasser 1 Feld', 6, 2, 3], ['wasser 2 sand', 6.5, 5, 3], ['wasser 3 kopf (Ziegel)', 7, 8, 2.6], ['wasser 3 platten', 7, 11, 2.6],
    ['wasser 3 m:verband', 7, 14, 2.6], ['wasser 6 rot', 8.5, 17, 2], ['wasser 6 ziegel brc', 8.5, 20, 2], ['wasser 9 stein brc', 10, 23, 1.6],
    ['wasser 16 holz brc/brw', 13.5, 26, 1.1], ['steg ins Meer', 7, 29, 2.4], ['breit 2', 32, 2.5, 2], ['breit 3', 32, 8, 1.8],
    ['breit 4', 32, 14.5, 1.6], ['Nord-Süd holz', 40, 23, 2.4], ['Nord-Süd stein', 43, 23, 2.4], ['Nord-Süd ziegel', 46, 23, 2.4],
    ['gleis gerade', 10, 35, 2], ['gleis Kurve', 22, 37, 2], ['gleis Abzweig', 32, 36, 2], ['gleis Kreuzung', 43, 36, 2],
    ['gleis doppelt', 10, 40.5, 2], ['gleis lang', 18, 46, 1], ['übergang Schranken', 5, 52, 3], ['übergang holz (true)', 8, 52, 3],
    ['übergang holz', 11, 52, 3], ['übergang stein', 14, 52, 3], ['übergang weg (fisch)', 17, 52, 3], ['übergang kristall', 20, 52, 3],
    ['anhöhe n1', 52, 31, 2.2], ['anhöhe n2', 53, 39, 2.2], ['anhöhe n3', 53.5, 47, 2], ['anhöhe n4', 54, 55, 1.8], ['anhöhe Nord-Süd', 58, 7, 2.2],
  ];
  function shot(x, y, z, W, H, night) {
    const p = iso(x, y); cam.x = p.x; cam.y = p.y - 10; cam.z = z;
    const na = nightAt, gh = gameHour, off = GL.off;
    nightAt = () => (night ? NIGHT_MAX : 0); gameHour = () => (night ? 23 : 12);
    GL.off = z >= 1 ? GL.off : true;                                           // weit weg: 2D-Bild (das GL-Bild liegt in einer eigenen Leinwand)
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { nightAt = na; gameHour = gh; GL.off = off; }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g2 = c.getContext('2d');
    g2.fillStyle = '#fffaf0'; g2.fillRect(0, 0, W, H); g2.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  window.brueckenPruefung = async (name = 'vorher', opts = {}) => {
    closeModal(); closePanel(); setTool('look');
    const list = VIEWS.filter(v => !opts.only || opts.only.some(o => v[0].includes(o))), W = opts.W || 420, H = opts.H || 340, cols = opts.cols || 5;
    const nights = opts.night === 'beide' ? [0, 1] : [opts.night ? 1 : 0];
    const shots = [];
    for (const [l, x, y, z] of list) for (const n of nights) shots.push([shot(x, y, z * (opts.z || 1), W, H, n), l + (n ? ' · Nacht' : '')]);
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 12); sheet.height = rows * (H + 40);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 12), Y = Math.floor(i / cols) * (H + 40) + 30; sx.drawImage(c, X, Y); sx.font = '700 17px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 8); });
    try { return await (await fetch('http://127.0.0.1:4181/bruecken-' + name + '.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
