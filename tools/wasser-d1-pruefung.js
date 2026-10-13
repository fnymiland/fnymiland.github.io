// Prüfbilder 160c D1 (plan-160c/karte-D1.md §4): Wasser-Wegbrücken der Testwelt „bruecken“ mit fester Zeit, damit vorher und nachher
// Bildpunkt für Bildpunkt vergleichbar sind (Wellen, Wolken). Im Browser auf ?welt=bruecken (Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/wasser-d1-pruefung.js')).text()); await wasserD1('vorher')   → tools/vorschau/d1-vorher-*.png
// Danach z. B. wasserD1('nach-D1b') und mit Python/PIL vergleichen.
(function wasserD1Tool() {
  const VIEWS = [
    ['wasser 1 Feld', 6, 2, 3], ['wasser 2 sand', 6.5, 5, 3], ['wasser 3 kopf (Ziegel)', 7, 8, 2.6], ['wasser 3 platten', 7, 11, 2.6],
    ['wasser 3 m:verband', 7, 14, 2.6], ['wasser 6 rot', 8.5, 17, 2], ['wasser 6 ziegel brc', 8.5, 20, 2], ['wasser 9 stein brc', 10, 23, 1.6],
    ['wasser 16 holz brc/brw', 13.5, 26, 1.1], ['steg ins Meer', 7, 29, 2.4], ['breit 2', 32, 2.5, 2], ['breit 3', 32, 8, 1.8],
    ['breit 4', 32, 14.5, 1.6], ['Nord-Süd holz', 40, 23, 2.4], ['Nord-Süd stein', 43, 23, 2.4], ['Nord-Süd ziegel', 46, 23, 2.4],
    ['gleis gerade (Kontrolle)', 10, 35, 2],
  ];
  function shot(x, y, z, W, H, nt, gl = false) {
    const p = iso(x, y); cam.x = p.x; cam.y = p.y - 10; cam.z = z;
    const o = { na: nightAt, gh: gameHour, off: GL.off, sf: spriteForce, sync: syncMovers };
    nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12); GL.off = !gl; syncMovers = () => {};
    try { resetDrawCaches(); groundVersion++; spriteNoBudget = true; for (let k = 0; k < 6; k++) render(1e6); spriteNoBudget = false; render(1e6); }
    finally { nightAt = o.na; gameHour = o.gh; GL.off = o.off; spriteForce = o.sf; syncMovers = o.sync; }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d');
    q.fillStyle = '#fffaf0'; q.fillRect(0, 0, W, H);
    if (gl && GL.canvas && GL.shown) q.drawImage(GL.canvas, GL.canvas.width / 2 - W / 2, GL.canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    q.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  async function blatt(name, shots, cols, W, H) {
    const rows = Math.ceil(shots.length / cols), s = document.createElement('canvas'); s.width = cols * (W + 12); s.height = rows * (H + 40);
    const q = s.getContext('2d'); q.fillStyle = '#fffaf0'; q.fillRect(0, 0, s.width, s.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 12), Y = Math.floor(i / cols) * (H + 40) + 30; q.drawImage(c, X, Y); q.font = '700 17px system-ui'; q.fillStyle = '#6b4f3a'; q.fillText(l, X + 4, Y - 8); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: s.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  }
  // name: Präfix; Blätter: nah Tag, nah Nacht, weit (Bildchen, z × 0,4) Tag
  window.wasserD1 = async (name, { W = 420, H = 320, cols = 6, gl = false } = {}) => {
    closeModal(); closePanel(); setTool('look'); walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0;
    const out = {};
    for (const [teil, nt, zf] of [['nah', 0, 1], ['nacht', NIGHT_MAX, 1], ['weit', 0, 0.4]]) {
      const shots = VIEWS.map(([l, x, y, z]) => [shot(x, y, z * zf, W, H, nt, gl && zf < 1), l]);
      out[teil] = await blatt(`d1-${name}-${teil}.png`, shots, cols, W, H);
    }
    return out;
  };
  return 'ok';
})();
