// Entwurfsbogen Sternenbasar-Händlerin (Block 161c): drei Figuren nach Märchen-Motiven auf Nachthimmel.
// (0, eval)(await (await fetch('tools/haendlerin-entwurf.js')).text()); haendlerinEntwurf()
(function haendlerinTool() {
  const star = (x, cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
  const ell = (x, cx, cy, rx, ry, col, rot = 0) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); x.fill(); };
  const eyes = (x, cx, cy, d, r = 4) => { ell(x, cx - d, cy, r, r * 1.15, '#2b2140'); ell(x, cx + d, cy, r, r * 1.15, '#2b2140'); ell(x, cx - d + 1.3, cy - 1.5, r * 0.35, r * 0.35, '#fff'); ell(x, cx + d + 1.3, cy - 1.5, r * 0.35, r * 0.35, '#fff'); };
  const smile = (x, cx, cy, w) => { x.strokeStyle = '#7a3b3b'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy - w * 0.4, w, 0.25 * Math.PI, 0.75 * Math.PI); x.stroke(); };
  const cheeks = (x, cx, cy, d) => { ell(x, cx - d, cy, 6, 3.5, 'rgba(255,120,140,.45)'); ell(x, cx + d, cy, 6, 3.5, 'rgba(255,120,140,.45)'); };

  // 1 · Sterntaler-Mädchen (Grimm): hält die Schürze auf, Sterne fallen hinein
  function sterntaler(x) {
    for (const [sx, sy, r] of [[70, 30, 7], [150, 22, 6], [110, 44, 8], [170, 60, 5], [52, 70, 5]]) star(x, sx, sy, r, '#ffd979');
    ell(x, 110, 205, 46, 8, 'rgba(0,0,0,.25)');
    x.fillStyle = '#f4ede0'; x.beginPath(); x.moveTo(84, 120); x.lineTo(136, 120); x.lineTo(150, 200); x.lineTo(70, 200); x.closePath(); x.fill();   // Hemdchen
    x.fillStyle = '#7d6bd6'; x.beginPath(); x.moveTo(74, 150); x.quadraticCurveTo(110, 185, 146, 150); x.lineTo(150, 168); x.quadraticCurveTo(110, 205, 70, 168); x.closePath(); x.fill(); // Schürze
    star(x, 98, 166, 6, '#ffd979'); star(x, 118, 172, 7, '#ffd979'); star(x, 132, 160, 5, '#ffe9a8');
    x.strokeStyle = '#f2c9a0'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(86, 128); x.lineTo(72, 152); x.moveTo(134, 128); x.lineTo(148, 152); x.stroke(); // Arme
    ell(x, 110, 96, 30, 30, '#f2c9a0');
    x.fillStyle = '#f0c24b'; x.beginPath(); x.arc(110, 92, 32, Math.PI * 1.05, Math.PI * 1.95); x.fill();                 // Haar
    ell(x, 76, 112, 8, 20, '#f0c24b', 0.2); ell(x, 144, 112, 8, 20, '#f0c24b', -0.2);                                     // Zöpfe
    ell(x, 74, 132, 5, 5, '#e8457a'); ell(x, 146, 132, 5, 5, '#e8457a');
    star(x, 124, 66, 8, '#ffd979');                                                                                     // Sternspange
    eyes(x, 110, 98, 11); cheeks(x, 110, 108, 18); smile(x, 110, 110, 6);
  }
  // 2 · Mondhase (Hase im Mond, alte Sage aus vielen Ländern): sitzt auf der Mondsichel, Laterne am Stab
  function mondhase(x) {
    x.fillStyle = '#ffe6a0'; x.beginPath(); x.arc(110, 150, 62, 0.15 * Math.PI, 0.85 * Math.PI); x.arc(110, 128, 58, 0.82 * Math.PI, 0.18 * Math.PI, true); x.closePath(); x.fill();
    ell(x, 110, 150, 34, 30, '#f6f1ea');                                                                               // Körper
    ell(x, 95, 52, 9, 30, '#f6f1ea', -0.15); ell(x, 125, 52, 9, 30, '#f6f1ea', 0.15);                                // Ohren
    ell(x, 95, 54, 4.5, 22, '#f7c2d0', -0.15); ell(x, 125, 54, 4.5, 22, '#f7c2d0', 0.15);
    ell(x, 110, 100, 30, 27, '#f6f1ea');
    x.fillStyle = '#4a3d8f'; x.beginPath(); x.moveTo(84, 82); x.quadraticCurveTo(112, 40, 150, 46); x.quadraticCurveTo(128, 64, 136, 82); x.closePath(); x.fill(); // Zipfelmütze
    star(x, 150, 46, 7, '#ffd979'); star(x, 104, 70, 3.5, '#ffd979'); star(x, 122, 66, 3, '#ffd979');
    eyes(x, 110, 102, 11); cheeks(x, 110, 111, 18); ell(x, 110, 108, 3, 2.2, '#e8869c'); smile(x, 110, 113, 4);
    x.strokeStyle = '#8a5a2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(150, 168); x.lineTo(172, 70); x.stroke();     // Stab
    x.beginPath(); x.moveTo(172, 70); x.quadraticCurveTo(186, 66, 184, 82); x.stroke();
    x.save(); x.globalCompositeOperation = 'lighter'; const gr = x.createRadialGradient(184, 98, 0, 184, 98, 34); gr.addColorStop(0, 'rgba(255,210,120,.7)'); gr.addColorStop(1, 'rgba(255,210,120,0)'); x.fillStyle = gr; x.fillRect(150, 64, 68, 68); x.restore();
    x.fillStyle = '#ffcf5a'; x.beginPath(); x.roundRect(176, 84, 16, 22, 5); x.fill(); x.fillStyle = '#c98a2a'; x.fillRect(176, 82, 16, 4); x.fillRect(176, 104, 16, 4);
    ell(x, 142, 160, 10, 7, '#f6f1ea');
  }
  // 3 · Frau Uhu (Eule als Kauffrau, eigene Figur): Brille, Schal, Sternenhut, kleine Waage
  function uhu(x) {
    ell(x, 110, 205, 44, 8, 'rgba(0,0,0,.25)');
    ell(x, 110, 140, 50, 60, '#a07850');
    ell(x, 110, 152, 32, 42, '#e9d6b5');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { x.strokeStyle = '#c4a57c'; x.lineWidth = 2; x.beginPath(); x.arc(94 + j * 16, 138 + i * 14, 5, 0.1 * Math.PI, 0.9 * Math.PI); x.stroke(); }
    ell(x, 66, 146, 14, 34, '#8a6440', 0.25); ell(x, 154, 146, 14, 34, '#8a6440', -0.25);                             // Flügel
    ell(x, 90, 112, 20, 20, '#f3e7d1'); ell(x, 130, 112, 20, 20, '#f3e7d1');                                           // Gesichtsscheiben
    x.strokeStyle = '#c99a3a'; x.lineWidth = 3; x.beginPath(); x.arc(90, 112, 13, 0, Math.PI * 2); x.moveTo(143, 112); x.arc(130, 112, 13, 0, Math.PI * 2); x.moveTo(103, 110); x.lineTo(117, 110); x.stroke(); // Brille
    eyes(x, 110, 112, 20, 5.5);
    x.fillStyle = '#e8a33a'; x.beginPath(); x.moveTo(104, 124); x.lineTo(116, 124); x.lineTo(110, 134); x.closePath(); x.fill();
    x.fillStyle = '#e8457a'; x.beginPath(); x.roundRect(72, 132, 76, 12, 6); x.fill(); x.fillRect(128, 138, 12, 30);    // Schal
    star(x, 134, 168, 5, '#ffd979');
    x.fillStyle = '#3d3a78'; x.beginPath(); x.ellipse(110, 82, 46, 9, 0, 0, Math.PI * 2); x.fill();                     // Hut
    x.beginPath(); x.moveTo(84, 82); x.lineTo(110, 22); x.lineTo(136, 82); x.closePath(); x.fill();
    star(x, 110, 22, 8, '#ffd979'); star(x, 100, 62, 4, '#ffd979'); star(x, 120, 50, 3.5, '#ffd979');
    ell(x, 96, 200, 8, 4, '#e8a33a'); ell(x, 124, 200, 8, 4, '#e8a33a');
  }

  window.haendlerinEntwurf = async () => {
    const figs = [['1 · Sterntaler-Mädchen', sterntaler], ['2 · Mondhase', mondhase], ['3 · Frau Uhu', uhu]];
    const W = 230, H = 250, sheet = document.createElement('canvas'); sheet.width = W * 3 + 40; sheet.height = H + 40;
    const s = sheet.getContext('2d'); s.fillStyle = '#fffaf0'; s.fillRect(0, 0, sheet.width, sheet.height);
    figs.forEach(([label, fn], i) => {
      const c = document.createElement('canvas'); c.width = W; c.height = H - 20; const x = c.getContext('2d');
      const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1d2448'); bg.addColorStop(1, '#45306b'); x.fillStyle = bg; x.beginPath(); x.roundRect(0, 0, W, H - 20, 18); x.fill();
      for (let k = 0; k < 30; k++) ell(x, (k * 67) % W, (k * 41) % (H - 20), 1.2, 1.2, 'rgba(255,255,255,.6)');
      x.save(); x.translate(5, 0); fn(x); x.restore();
      s.drawImage(c, 10 + i * (W + 10), 34); s.font = '700 17px system-ui'; s.fillStyle = '#6b4f3a'; s.fillText(label, 14 + i * (W + 10), 24);
    });
    try { return await (await fetch('http://127.0.0.1:4181/haendlerin.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
