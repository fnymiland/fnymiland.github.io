// Entwurf der ersten Sternenbasar-Waren (Block 161c): je ein Bild nah (Tag) und klein daneben nachts. Gezeichnet wie kleine Deko im Spiel
// (Mitte unten cx, cy; Pixel × z), damit die Zeichnungen danach in draw-objects übernommen werden können.
// (0, eval)(await (await fetch('tools/basar-waren-entwurf.js')).text()); await basarWaren()   → tools/vorschau/basar-waren.png
(function basarWarenTool() {
  let LIT = false;
  const glows = [];
  const glowAt = (x, y, r, col = '255,200,110') => { if (LIT) glows.push([x, y, r, col]); };
  const drawGlows = () => { g.globalCompositeOperation = 'lighter'; for (const [x, y, r, col] of glows.splice(0)) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.35)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } g.globalCompositeOperation = 'source-over'; };
  const shadowE = (cx, cy, rx, z) => ellipse(cx, cy + 1 * z, rx * z, rx * 0.42 * z, 'rgba(40,60,20,0.16)');
  const trunk = (cx, cy, z, h, w = 2, col = '#8a5a3c') => { poly([[cx - w * z, cy], [cx + w * z, cy], [cx + w * 0.7 * z, cy - h * z], [cx - w * 0.7 * z, cy - h * z]], C(col)); };
  const blob = (cx, cy, z, pts, base, hi) => { for (const [dx, dy, r] of pts) circle(cx + dx * z, cy + dy * z, r * z, C(base)); for (const [dx, dy, r] of pts) circle(cx + (dx - r * 0.25) * z, cy + (dy - r * 0.3) * z, r * 0.55 * z, C(hi)); };
  const CROWN = [[0, -22, 8], [-7, -18, 6.5], [7, -18, 6.5], [-4, -26, 6], [5, -26, 6], [0, -30, 5.5], [-9, -24, 4.5], [9, -24, 4.5]];
  const sternPts = (x, y, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i & 1 ? r * 0.45 : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });

  const WAREN = [
    ['Kirschbaum', (cx, cy, z) => {
      shadowE(cx, cy, 10, z);
      for (const [dx, dy] of [[-7, 1], [5, 2], [9, -1], [-3, 3], [2, -1]]) ellipse(cx + dx * z, cy + dy * z, 1.4 * z, 0.7 * z, C('#ffc2d6'));   // Blüten am Boden
      trunk(cx, cy, z, 16, 2, '#6e4a3a');
      blob(cx, cy, z, CROWN, '#ff9ec0', '#ffd2e3');
      for (const [dx, dy] of [[-5, -20], [4, -24], [8, -19], [-2, -29], [-8, -25]]) circle(cx + dx * z, cy + dy * z, 0.9 * z, C('#ffffff'));
    }],
    ['Herbstahorn', (cx, cy, z) => {
      shadowE(cx, cy, 10, z);
      trunk(cx, cy, z, 15, 2, '#6e4a3a');
      blob(cx, cy, z, CROWN, '#e0582f', '#ffa24a');
      for (const [dx, dy] of [[-6, -18], [6, -25], [1, -31]]) circle(cx + dx * z, cy + dy * z, 2.2 * z, C('#ffd23f'));
      for (const [dx, dy] of [[-8, 2], [6, 1], [2, 3]]) ellipse(cx + dx * z, cy + dy * z, 1.6 * z, 0.8 * z, C('#e86a3a'));
    }],
    ['Trauerweide', (cx, cy, z) => {
      shadowE(cx, cy, 12, z);
      trunk(cx, cy, z, 18, 2.4, '#6e5a3a');
      blob(cx, cy, z, [[0, -26, 8], [-7, -23, 6], [7, -23, 6], [0, -32, 6]], '#7fae4a', '#a9d36a');
      g.lineWidth = Math.max(0.6, 1.3 * z); g.lineCap = 'round';
      for (let i = 0; i < 13; i++) { const a = -12 + i * 2, top = -24 - Math.cos(i / 12 * Math.PI - Math.PI / 2) * 6, len = 15 + (i % 3) * 3;
        g.strokeStyle = C(i & 1 ? '#6f9d3f' : '#94c45a'); g.beginPath(); g.moveTo(cx + a * z, cy + top * z); g.quadraticCurveTo(cx + (a * 1.2) * z, cy + (top + len * 0.5) * z, cx + (a * 1.15) * z, cy + (top + len) * z); g.stroke(); }
    }],
    ['Laternenbaum', (cx, cy, z) => {
      shadowE(cx, cy, 10, z);
      trunk(cx, cy, z, 15, 2, '#6e4a3a');
      blob(cx, cy, z, CROWN, '#3f8f4a', '#5fb35a');
      for (const [dx, dy, c] of [[-8, -15, '#ff8a3d'], [7, -16, '#ffd23f'], [-2, -19, '#ff5d8f'], [10, -22, '#ff8a3d'], [-10, -22, '#ffd23f']]) {
        g.strokeStyle = C('#5a4636'); g.lineWidth = Math.max(0.5, 0.5 * z); g.beginPath(); g.moveTo(cx + dx * z, cy + (dy - 4) * z); g.lineTo(cx + dx * z, cy + (dy - 1.5) * z); g.stroke();
        ellipse(cx + dx * z, cy + dy * z, 1.8 * z, 2.2 * z, LIT ? '#ffe9a0' : C(c)); glowAt(cx + dx * z, cy + dy * z, 9 * z);
      }
    }],
    ['Nachtblumen', (cx, cy, z) => {
      shadowE(cx, cy, 8, z);
      for (const [dx, dy, h] of [[-5, 1, 9], [0, 0, 12], [5, 1, 10], [-2, 2, 7], [3, 2, 8]]) {
        g.strokeStyle = C('#4f9e5a'); g.lineWidth = Math.max(0.5, 0.8 * z); g.beginPath(); g.moveTo(cx + dx * z, cy + dy * z); g.lineTo(cx + dx * z, cy + (dy - h) * z); g.stroke();
        const p = [cx + dx * z, cy + (dy - h) * z];
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; circle(p[0] + Math.cos(a) * 1.6 * z, p[1] + Math.sin(a) * 1 * z, 1.3 * z, LIT ? '#bfe4ff' : C('#8fa8ff')); }
        circle(p[0], p[1], 0.9 * z, LIT ? '#ffffff' : C('#fff3a0'));
        glowAt(p[0], p[1], 7 * z, '150,190,255');
      }
    }],
    ['Pfau', (cx, cy, z) => {
      shadowE(cx, cy, 9, z);
      for (let k = 0; k < 9; k++) { const a = Math.PI + k / 8 * Math.PI, ex = cx + 3 * z + Math.cos(a) * 12 * z, ey = cy - 10 * z + Math.sin(a) * 10 * z;   // Rad
        g.strokeStyle = C('#3f8f6a'); g.lineWidth = Math.max(0.6, 1.6 * z); g.beginPath(); g.moveTo(cx + 3 * z, cy - 8 * z); g.lineTo(ex, ey); g.stroke();
        circle(ex, ey, 2.2 * z, C('#2aa58f')); circle(ex, ey, 1.2 * z, C('#2b4fa8')); circle(ex, ey, 0.5 * z, C('#ffd23f')); }
      ellipse(cx, cy - 5 * z, 4 * z, 3.4 * z, C('#2b5fb8'));                                          // Körper
      poly([[cx - 2 * z, cy - 7 * z], [cx - 1 * z, cy - 14 * z], [cx + 0.6 * z, cy - 7 * z]], C('#2b5fb8'));   // Hals
      circle(cx - 1 * z, cy - 15 * z, 1.8 * z, C('#2f6fd0')); poly([[cx - 2.6 * z, cy - 15 * z], [cx - 4.5 * z, cy - 14.4 * z], [cx - 2.6 * z, cy - 14 * z]], C('#e9a23b'));
      for (const dx of [-1.6, -0.6, 0.4]) { g.strokeStyle = C('#2f6fd0'); g.lineWidth = Math.max(0.4, 0.4 * z); g.beginPath(); g.moveTo(cx + (dx - 0.6) * z, cy - 16.5 * z); g.lineTo(cx + dx * z, cy - 19 * z); g.stroke(); circle(cx + dx * z, cy - 19 * z, 0.5 * z, C('#2f6fd0')); }
    }],
    ['Katze auf Kissen', (cx, cy, z) => {
      shadowE(cx, cy, 7, z);
      ellipse(cx, cy - 1.5 * z, 7 * z, 3.2 * z, C('#b48cff')); ellipse(cx, cy - 2.4 * z, 6 * z, 2.4 * z, C('#cdb0ff'));   // Kissen
      ellipse(cx, cy - 5 * z, 4.6 * z, 3 * z, C('#f0a24a'));                                                  // zusammengerollt
      circle(cx + 3.4 * z, cy - 7 * z, 2.6 * z, C('#f0a24a'));
      poly([[cx + 2 * z, cy - 9 * z], [cx + 2.4 * z, cy - 11.4 * z], [cx + 3.4 * z, cy - 9.4 * z]], C('#e08a2e'));
      poly([[cx + 4 * z, cy - 9.2 * z], [cx + 5.2 * z, cy - 11 * z], [cx + 5.4 * z, cy - 8.6 * z]], C('#e08a2e'));
      g.strokeStyle = C('#e08a2e'); g.lineWidth = Math.max(0.6, 1.4 * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 4 * z, cy - 4 * z); g.quadraticCurveTo(cx - 6 * z, cy - 7 * z, cx - 2 * z, cy - 7.5 * z); g.stroke();
      for (const dx of [2.6, 4.2]) { g.strokeStyle = C('#5a3a2a'); g.lineWidth = Math.max(0.4, 0.5 * z); g.beginPath(); g.moveTo(cx + (dx - 0.5) * z, cy - 7.2 * z); g.lineTo(cx + (dx + 0.5) * z, cy - 7.2 * z); g.stroke(); }   // Augen zu
    }],
    ['Koi-Teich', (cx, cy, z) => {                                          // ganzes Feld
      const rx = 22 * z, ry = 11 * z;
      ellipse(cx, cy + 1 * z, rx + 3 * z, ry + 2 * z, C('#a69c8a'));
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; ellipse(cx + Math.cos(a) * (rx + 1 * z), cy + Math.sin(a) * (ry + 0.6 * z), 3 * z, 1.8 * z, C(k & 1 ? '#c9c1b1' : '#b5ad9c')); }
      ellipse(cx, cy, rx, ry, C('#5fb8d6')); ellipse(cx - 4 * z, cy - 2 * z, rx * 0.6, ry * 0.5, C('#7fcde6'));
      for (const [dx, dy, c, r] of [[-8, 1, '#ff7a2f', 0.3], [6, -3, '#ffffff', -0.4], [2, 4, '#ff9a4a', 2.6]]) {
        const p = [cx + dx * z, cy + dy * z]; g.save(); g.translate(...p); g.rotate(r); ellipse(0, 0, 3.4 * z, 1.4 * z, C(c)); poly([[-3.2 * z, 0], [-5.2 * z, -1.4 * z], [-5.2 * z, 1.4 * z]], C(c)); if (c === '#ffffff') circle(0.5 * z, 0, 0.9 * z, C('#ff5a2a')); g.restore(); }
      for (const [dx, dy] of [[12, 3], [-14, -2]]) { ellipse(cx + dx * z, cy + dy * z, 3.4 * z, 1.8 * z, C('#4f9e5a')); circle(cx + (dx + 1) * z, cy + (dy - 0.6) * z, 1 * z, C('#ffb3cf')); }   // Seerosen
    }],
    ['Sternbrunnen ✦', (cx, cy, z) => {                                     // ganzes Feld, selten
      ellipse(cx, cy + 1 * z, 20 * z, 9.5 * z, C('#b9b0a0'));
      ellipse(cx, cy, 18 * z, 8.4 * z, C('#e8e1d4')); ellipse(cx, cy - 0.5 * z, 15.5 * z, 7 * z, C('#6fc6e0'));
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; circle(cx + Math.cos(a) * 9 * z, cy - 0.5 * z + Math.sin(a) * 4 * z, 0.8 * z, C('#ffffff')); }   // Glitzern
      poly([[cx - 2.4 * z, cy - 1 * z], [cx + 2.4 * z, cy - 1 * z], [cx + 1.6 * z, cy - 16 * z], [cx - 1.6 * z, cy - 16 * z]], C('#e8e1d4'));   // Säule
      const S = [cx, cy - 22 * z]; poly(sternPts(S[0], S[1], 6.5 * z), LIT ? '#ffe680' : C('#f5c84b')); glowAt(S[0], S[1], 26 * z);
      g.strokeStyle = 'rgba(184,236,246,0.9)'; g.lineWidth = Math.max(0.6, 1 * z);
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 2 * z, cy - 15 * z); g.quadraticCurveTo(cx + s * 8 * z, cy - 18 * z, cx + s * 10 * z, cy - 2 * z); g.stroke(); }
    }],
    ['Pagode ✦', (cx, cy, z) => {                                            // ganzes Feld, selten
      shadowE(cx, cy, 16, z);
      box(cx, cy, 11 * z, 5.5 * z, 2 * z, '#d9cfbf', '#e8e1d4', 0);
      let base = cy - 2 * z;
      for (let k = 0; k < 3; k++) {
        const w = (10 - k * 2.2) * z, h = (8 - k) * z;
        box(cx, base, w, w * 0.5, h, '#fff1d6', null, 0);
        if (LIT) { poly([[cx - w * 0.3, base - h * 0.2], [cx - w * 0.05, base - h * 0.1], [cx - w * 0.05, base - h * 0.7], [cx - w * 0.3, base - h * 0.8]], '#ffd27a'); glowAt(cx - w * 0.2, base - h * 0.5, 10 * z); }
        base -= h;
        const R = w * 1.45;
        poly([[cx - R, base + 1 * z], [cx, base + R * 0.5 + 1 * z], [cx + R, base + 1 * z], [cx + R * 0.55, base - 4 * z], [cx, base - 4 * z + R * 0.2], [cx - R * 0.55, base - 4 * z]], C('#c9443a'));
        poly([[cx - R, base + 1 * z], [cx - R - 1.5 * z, base - 1 * z], [cx - R * 0.6, base - 1 * z]], C('#a8352d'));
        poly([[cx + R, base + 1 * z], [cx + R + 1.5 * z, base - 1 * z], [cx + R * 0.6, base - 1 * z]], C('#a8352d'));
        base -= 4 * z;
      }
      g.strokeStyle = C('#e9a23b'); g.lineWidth = Math.max(0.6, 1.2 * z); g.beginPath(); g.moveTo(cx, base); g.lineTo(cx, base - 7 * z); g.stroke(); circle(cx, base - 7 * z, 1.5 * z, C('#f5c84b'));
    }],
    ['Lampion-Bogen', (cx, cy, z) => {
      shadowE(cx, cy, 10, z);
      for (const s of [-1, 1]) { g.strokeStyle = C('#6b4f3a'); g.lineWidth = Math.max(0.6, 1.4 * z); g.beginPath(); g.moveTo(cx + s * 9 * z, cy); g.lineTo(cx + s * 9 * z, cy - 18 * z); g.stroke(); }
      g.strokeStyle = C('#5a4636'); g.lineWidth = Math.max(0.4, 0.5 * z); g.beginPath(); g.moveTo(cx - 9 * z, cy - 17 * z); g.quadraticCurveTo(cx, cy - 11 * z, cx + 9 * z, cy - 17 * z); g.stroke();
      ['#ff5d8f', '#ffd23f', '#58b3e8', '#ff8a3d', '#b57bff'].forEach((c, k) => { const t = (k + 0.5) / 5, x0 = cx + (-9 + 18 * t) * z, y0 = cy + (-17 + 6 * 4 * t * (1 - t)) * z;
        ellipse(x0, y0 + 2.4 * z, 2 * z, 2.4 * z, LIT ? '#ffe9a0' : C(c)); poly([[x0 - 1.2 * z, y0 + 0.2 * z], [x0 + 1.2 * z, y0 + 0.2 * z], [x0 + 1.2 * z, y0 + 0.8 * z], [x0 - 1.2 * z, y0 + 0.8 * z]], C('#5a4636')); glowAt(x0, y0 + 2.4 * z, 8 * z); });
    }],
    ['Sonnenuhr', (cx, cy, z) => {
      shadowE(cx, cy, 6, z);
      box(cx, cy, 3.4 * z, 1.7 * z, 8 * z, '#e5dccb', null, 0);
      ellipse(cx, cy - 8.5 * z, 6 * z, 3 * z, C('#d9cfbf')); ellipse(cx, cy - 9 * z, 5.6 * z, 2.7 * z, C('#f3ecdf'));
      for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; circle(cx + Math.cos(a) * 4.4 * z, cy - 9 * z + Math.sin(a) * 2.1 * z, 0.35 * z, C('#8a7a62')); }
      poly([[cx, cy - 9 * z], [cx - 0.5 * z, cy - 13 * z], [cx + 3 * z, cy - 9.4 * z]], C('#c9962a'));
      poly([[cx, cy - 9 * z], [cx + 3 * z, cy - 9.4 * z], [cx + 5 * z, cy - 7.6 * z]], 'rgba(60,40,30,0.25)');
    }],
    ['Schaukel', (cx, cy, z) => {
      shadowE(cx, cy, 10, z);
      g.lineCap = 'round';
      for (const s of [-1, 1]) { g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.7, 1.6 * z); g.beginPath(); g.moveTo(cx + s * 11 * z, cy + 1 * z); g.lineTo(cx + s * 8 * z, cy - 20 * z); g.lineTo(cx + s * 5 * z, cy + 2 * z); g.stroke(); }
      g.beginPath(); g.moveTo(cx - 9 * z, cy - 20 * z); g.lineTo(cx + 9 * z, cy - 20 * z); g.stroke();
      g.strokeStyle = C('#5a4636'); g.lineWidth = Math.max(0.4, 0.5 * z); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 2.6 * z, cy - 20 * z); g.lineTo(cx + s * 2.6 * z, cy - 6 * z); g.stroke(); }
      poly([[cx - 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 6 * z], [cx + 3.4 * z, cy - 5 * z], [cx - 3.4 * z, cy - 5 * z]], C('#e86f8f'));
      for (const dx of [-6, 0, 6]) circle(cx + dx * z, cy - 20.5 * z, 1.2 * z, C(['#ffb3cf', '#ffffff', '#ffd23f'][(dx + 6) / 6]));   // Blümchen am Balken
    }],
  ];

  window.basarWaren = async (name = 'basar-waren') => {
    const W = 260, H = 230, cols = 5, shots = [];
    for (const [label, fn] of WAREN) {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const cx = c.getContext('2d');
      cx.fillStyle = '#9fd27a'; cx.fillRect(0, 0, W, H);
      cx.fillStyle = '#2b3550'; cx.fillRect(W * 0.66, H * 0.58, W * 0.34, H * 0.42);
      const prev = g; g = cx;
      try {
        LIT = false; fn(W * 0.36, H * 0.8, 4.2);
        g.save(); g.beginPath(); g.rect(W * 0.66, H * 0.58, W * 0.34, H * 0.42); g.clip(); LIT = true; fn(W * 0.83, H * 0.95, 1.8); drawGlows(); g.restore(); LIT = false;
      } finally { g = prev; }
      shots.push([c, label]);
    }
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 10); sheet.height = rows * (H + 34);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 10), Y = Math.floor(i / cols) * (H + 34) + 26; sx.drawImage(c, X, Y); sx.font = '700 16px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 7); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name + '.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
