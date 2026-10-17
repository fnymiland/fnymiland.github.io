// 🏰 Turm & Himmelslaternen und 👑 Prinzessinnen & Märchen (Block 161c): eigene Motive nach Grimms Märchen (Rapunzel, Aschenputtel,
// Dornröschen, Schneewittchen, Froschkönig) – keine Disney-Figuren. Form wie SD_ART; Bogen: tools/waren-entwurf.js
(() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', PINK = '#ff9ec0', ROSE = '#e8546f', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const heart = (x, y, r, col) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35); g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); g.fillStyle = col; g.fill(); };
  const skyLantern = (x, y, w, z, lit) => { poly([[x - w * z, y], [x + w * z, y], [x + w * 0.8 * z, y - w * 2 * z], [x - w * 0.8 * z, y - w * 2 * z]], lit ? '#ffcf6a' : C('#ffb347')); ellipse(x, y - w * 2 * z, w * 0.8 * z, w * 0.3 * z, lit ? '#ffe39a' : C('#ffc76a')); if (lit) glowAt(x, y - w * z, w * 7 * z, z); };

  window.WAREN_TURM = [
    ['Turm mit Zopf ✦', (cx, cy, z) => {                                    // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 14, z);
      const R = 6.5 * z, H = 44 * z, top = cy - H;
      poly([[cx - R, cy], [cx + R, cy], [cx + R * 0.9, top], [cx - R * 0.9, top]], C('#e9dcc6'));
      poly([[cx, cy + 1 * z], [cx + R, cy], [cx + R * 0.9, top], [cx, top]], C('#d9c9ae'));
      for (let k = 1; k < 7; k++) { const y = cy - k * 6 * z; g.strokeStyle = C('#cdbb9c'); g.lineWidth = Math.max(0.4, 0.4 * z); g.beginPath(); g.moveTo(cx - R * 0.95, y); g.lineTo(cx + R * 0.95, y); g.stroke(); }
      for (const [dx, dy] of [[-3, 6], [2, 9], [-1, 2]]) { sdLine('#5f9e4a', 1, z, [[cx + dx * z, cy - dy * z], [cx + (dx + 2) * z, cy - (dy + 6) * z]]); circle(cx + (dx + 2) * z, cy - (dy + 6) * z, 1.4 * z, C(PINK)); }   // Ranken mit Blüten
      ellipse(cx, top, R * 1.25, R * 0.45, C('#c9b897'));
      const win = [cx - 2.4 * z, top + 3 * z];
      poly([[win[0] - 2 * z, win[1] + 5 * z], [win[0] + 2 * z, win[1] + 5 * z], [win[0] + 2 * z, win[1]], [win[0], win[1] - 2 * z], [win[0] - 2 * z, win[1]]], lit ? '#ffd27a' : C('#5d4f73'));
      if (lit) glowAt(win[0], win[1] + 2 * z, 16 * z, z);
      g.strokeStyle = C('#f2c24e'); g.lineWidth = Math.max(0.8, 2 * z); g.lineCap = 'round';                // langer goldener Zopf
      g.beginPath(); g.moveTo(win[0] + 1.6 * z, win[1] + 4 * z); g.bezierCurveTo(cx + 9 * z, cy - 30 * z, cx + 3 * z, cy - 14 * z, cx + 9 * z, cy - 1 * z); g.stroke();
      for (let k = 0; k < 7; k++) { const t = k / 7, x = cx + (2 + 7 * t) * z, y = top + (8 + 34 * t) * z; circle(x + Math.sin(k * 1.7) * 1.2 * z, y, 0.7 * z, C('#ffe08a')); }
      for (const [dx, c] of [[6, PINK], [8, '#ffffff'], [9, LILA]]) circle(cx + dx * z, cy - (2 + dx) * z, 1 * z, C(c));
      poly([[cx - R * 1.35, top], [cx + R * 1.35, top], [cx, top - 16 * z]], C('#7b5ea7')); poly([[cx, top], [cx + R * 1.35, top], [cx, top - 16 * z]], C('#664b8f'));
      sdLine('#6b4f3a', 0.6, z, [[cx, top - 16 * z], [cx, top - 21 * z]]); poly([[cx, top - 21 * z], [cx + 4 * z, top - 20 * z], [cx, top - 19 * z]], C('#ffd23f'));
    }, true],
    ['Himmelslaternen', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 6, z);
      for (const [dx, dy, w] of [[-4, -16, 1.8], [3, -24, 2.2], [-1, -31, 1.6], [6, -14, 1.4]]) skyLantern(cx + dx * z, cy + dy * z, w, z, lit);
      for (const [dx] of [[-4], [3]]) sdLine('#d8c3a0', 0.25, z, [[cx + dx * z, cy - 6 * z], [cx + dx * z, cy - 13 * z]]);
      poly([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx + 3 * z, cy - 5 * z], [cx - 3 * z, cy - 5 * z]], C('#8a5a3c'));   // Kiste, aus der sie steigen
    }],
    ['Blumenranken-Tor', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      g.strokeStyle = C('#5a8f3a'); g.lineWidth = Math.max(0.8, 2 * z); g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 9 * z, cy); g.lineTo(cx - 9 * z, cy - 16 * z); g.quadraticCurveTo(cx, cy - 30 * z, cx + 9 * z, cy - 16 * z); g.lineTo(cx + 9 * z, cy); g.stroke();
      const along = t => { if (t < 0.33) return [cx - 9 * z, cy - t / 0.33 * 16 * z]; if (t > 0.67) return [cx + 9 * z, cy - (1 - t) / 0.33 * 16 * z]; const u = (t - 0.33) / 0.34, a = 1 - u; return [a * a * (cx - 9 * z) + 2 * a * u * cx + u * u * (cx + 9 * z), a * a * (cy - 16 * z) + 2 * a * u * (cy - 30 * z) + u * u * (cy - 16 * z)]; };
      for (let k = 0; k <= 16; k++) { const p = along(k / 16); circle(p[0] + (k & 1 ? 1 : -1) * z, p[1], 1.8 * z, C('#6fb04a')); if (k % 2 === 0) rose(p[0] + (k & 2 ? 1.2 : -1.2) * z, p[1] - 0.6 * z, 1.3 * z, [PINK, '#ffffff', LILA, '#ffd23f'][k % 4]); }
    }],
    ['Malstaffelei', (cx, cy, z) => {
      sdShadow(cx, cy, 7, z);
      sdLine('#8a5a3c', 1, z, [[cx - 4 * z, cy], [cx, cy - 20 * z], [cx + 4 * z, cy]]); sdLine('#8a5a3c', 1, z, [[cx, cy - 20 * z], [cx + 1 * z, cy + 1 * z]]);
      poly([[cx - 6 * z, cy - 6 * z], [cx + 6 * z, cy - 6 * z], [cx + 6 * z, cy - 18 * z], [cx - 6 * z, cy - 18 * z]], C('#fffaf0'));
      poly([[cx - 5 * z, cy - 7 * z], [cx + 5 * z, cy - 7 * z], [cx + 5 * z, cy - 17 * z], [cx - 5 * z, cy - 17 * z]], C('#bfe0ff'));
      circle(cx + 2.4 * z, cy - 14.4 * z, 1.6 * z, C('#ffd23f'));                                          // gemalte Sonne
      poly([[cx - 5 * z, cy - 7 * z], [cx - 1 * z, cy - 12 * z], [cx + 2 * z, cy - 9 * z], [cx + 5 * z, cy - 11 * z], [cx + 5 * z, cy - 7 * z]], C('#6fb04a'));
      sdLine('#8a5a3c', 1, z, [[cx - 7 * z, cy - 6 * z], [cx + 7 * z, cy - 6 * z]]);
      ellipse(cx + 8 * z, cy - 1 * z, 3.2 * z, 1.6 * z, C('#e8d0a8'));                                  // Palette
      for (const [dx, c] of [[-1, '#e8546f'], [0.4, '#58b3e8'], [1.6, '#ffd23f']]) circle(cx + (8 + dx) * z, cy - 1.4 * z, 0.6 * z, C(c));
    }],
    ['Laternenboot', (cx, cy, z) => {                                       // kleine Deko am Ufer (steht auf Gras)
      const lit = sdLit();
      ellipse(cx, cy + 1 * z, 12 * z, 3.4 * z, C('#6fc6e0'));
      poly([[cx - 10 * z, cy - 3 * z], [cx + 10 * z, cy - 3 * z], [cx + 7 * z, cy + 1 * z], [cx - 7 * z, cy + 1 * z]], C('#8a5a3c'));
      poly([[cx - 10 * z, cy - 3 * z], [cx + 10 * z, cy - 3 * z], [cx + 9 * z, cy - 4.4 * z], [cx - 9 * z, cy - 4.4 * z]], C('#a8794e'));
      sdLine('#6b4f3a', 0.7, z, [[cx + 6 * z, cy - 4 * z], [cx + 6 * z, cy - 13 * z], [cx + 8 * z, cy - 13 * z]]);
      skyLantern(cx + 8 * z, cy - 9 * z, 1.3, z, lit);
      for (const [dx, dy] of [[-6, -16], [-1, -21]]) skyLantern(cx + dx * z, cy + dy * z, 1.5, z, lit);
    }],
    ['Blumenschaukel', (cx, cy, z) => {
      sdShadow(cx, cy, 8, z);
      sdLine('#6e4a3a', 2, z, [[cx - 8 * z, cy], [cx - 8 * z, cy - 24 * z]]);
      sdLine('#6e4a3a', 1.6, z, [[cx - 8 * z, cy - 22 * z], [cx + 7 * z, cy - 24 * z]]);
      sdBlob(cx, cy, z, [[-8, -26, 5], [-2, -27, 4.5], [5, -25, 4]], '#5fa84a', '#86c95e');
      for (const s of [-1, 1]) sdLine('#5a8f3a', 0.5, z, [[cx + (1 + s * 3) * z, cy - 23 * z], [cx + (1 + s * 3) * z, cy - 6 * z]]);
      poly([[cx - 3 * z, cy - 6 * z], [cx + 5 * z, cy - 6 * z], [cx + 5 * z, cy - 5 * z], [cx - 3 * z, cy - 5 * z]], C('#e8d0a8'));
      for (let k = 0; k < 8; k++) { const s = k & 1 ? -1 : 1, y = cy - (8 + k * 2) * z; circle(cx + (1 + s * 3) * z, y, 0.9 * z, C([PINK, '#ffffff', '#ffd23f', LILA][k % 4])); }
    }],
  ];

  window.WAREN_MAERCHEN = [
    ['Kürbiskutsche ✦', (cx, cy, z) => {                                    // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 18, z);
      for (const [dx, r] of [[-9, 4.4], [9, 4.4]]) { circle(cx + dx * z, cy - r * z, r * z, C('#e8d6a8')); circle(cx + dx * z, cy - r * z, r * 0.7 * z, C('#fff3d6')); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; sdLine(GOLD_D, 0.35, z, [[cx + dx * z, cy - r * z], [cx + (dx + Math.cos(a) * r) * z, cy - (r + Math.sin(a) * r) * z]]); } }
      ellipse(cx, cy - 13 * z, 13 * z, 10 * z, C('#f08a2e'));
      for (const dx of [-8, -3, 3, 8]) { g.strokeStyle = C('#d9701e'); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); g.ellipse(cx + dx * 0.4 * z, cy - 13 * z, Math.abs(dx) * 0.9 * z + 2 * z, 10 * z, 0, -Math.PI / 2, Math.PI / 2, dx < 0); g.stroke(); }
      poly([[cx - 3 * z, cy - 8 * z], [cx + 3 * z, cy - 8 * z], [cx + 3 * z, cy - 16 * z], [cx, cy - 18 * z], [cx - 3 * z, cy - 16 * z]], lit ? '#ffd27a' : C('#fff0c2'));   // Fenster
      if (lit) glowAt(cx, cy - 13 * z, 22 * z, z);
      sdLine(GOLD, 1.2, z, [[cx - 12 * z, cy - 4 * z], [cx + 12 * z, cy - 4 * z]]);
      sdLine('#4f9e3a', 1.2, z, [[cx, cy - 23 * z], [cx + 2 * z, cy - 27 * z]], [cx - 1 * z, cy - 26 * z]);
      ellipse(cx + 3 * z, cy - 26 * z, 2.4 * z, 1.2 * z, C('#5fb35a'));
      sdStarDraw([cx, cy - 31 * z], 2.2 * z, GOLD, GOLD_D);
    }, true],
    ['Glasschuh auf Kissen', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 7, z);
      box(cx, cy, 4 * z, 2 * z, 7 * z, '#f3ecdf', null, 0);
      ellipse(cx, cy - 8 * z, 6.4 * z, 2.6 * z, C('#d64f7a')); ellipse(cx, cy - 8.8 * z, 5.6 * z, 2 * z, C('#ec6f97'));
      for (const s of [-1, 1]) circle(cx + s * 6 * z, cy - 8 * z, 0.9 * z, C(GOLD));
      g.beginPath(); g.moveTo(cx - 4 * z, cy - 9.6 * z); g.quadraticCurveTo(cx - 4 * z, cy - 13 * z, cx, cy - 12.6 * z); g.lineTo(cx + 3 * z, cy - 13.4 * z); g.lineTo(cx + 4 * z, cy - 9.6 * z); g.closePath();
      g.fillStyle = lit ? 'rgba(220,245,255,0.95)' : 'rgba(200,236,252,0.85)'; g.fill();
      sdLine('#ffffff', 0.4, z, [[cx - 3 * z, cy - 11.6 * z], [cx - 1 * z, cy - 12.4 * z]]);
      sdLine('#cfeefc', 0.9, z, [[cx + 3.6 * z, cy - 9.8 * z], [cx + 3.6 * z, cy - 13.6 * z]]);
      if (lit) glowAt(cx, cy - 11 * z, 12 * z, z, 'blue');
    }],
    ['Froschkönig-Brunnen', (cx, cy, z) => {
      sdShadow(cx, cy, 11, z);
      ellipse(cx, cy, 11 * z, 5 * z, C('#c9c1b1')); ellipse(cx, cy - 0.6 * z, 9 * z, 3.8 * z, C('#74d0e6'));
      poly([[cx - 2 * z, cy - 1 * z], [cx + 2 * z, cy - 1 * z], [cx + 1.4 * z, cy - 7 * z], [cx - 1.4 * z, cy - 7 * z]], C('#d9d2c4'));
      ellipse(cx, cy - 10 * z, 4 * z, 3.2 * z, C('#5fb35a'));                                             // Frosch
      for (const s of [-1, 1]) { circle(cx + s * 2 * z, cy - 13 * z, 1.5 * z, C('#5fb35a')); circle(cx + s * 2 * z, cy - 13.2 * z, 0.7 * z, C('#ffffff')); circle(cx + s * 2 * z, cy - 13.2 * z, 0.35 * z, C('#2f3440')); }
      poly([[cx - 2.4 * z, cy - 14.6 * z], [cx + 2.4 * z, cy - 14.6 * z], [cx + 2.2 * z, cy - 17 * z], [cx + 1 * z, cy - 15.6 * z], [cx, cy - 17.4 * z], [cx - 1 * z, cy - 15.6 * z], [cx - 2.2 * z, cy - 17 * z]], C(GOLD));   // Krönchen
      circle(cx + 6 * z, cy - 1 * z, 1.6 * z, C(GOLD)); circle(cx + 5.6 * z, cy - 1.4 * z, 0.6 * z, C('#fff3a0'));   // goldene Kugel
      for (const s of [-1, 1]) { g.strokeStyle = 'rgba(184,236,246,0.9)'; g.lineWidth = Math.max(0.5, 0.7 * z); g.beginPath(); g.moveTo(cx + s * 1 * z, cy - 9 * z); g.quadraticCurveTo(cx + s * 5 * z, cy - 11 * z, cx + s * 6.5 * z, cy - 2 * z); g.stroke(); }
    }],
    ['Rosenhecke mit Spinnrad', (cx, cy, z) => {
      sdShadow(cx, cy, 11, z);
      sdBlob(cx, cy, z, [[-6, -6, 5], [0, -7, 5.4], [6, -6, 5], [-3, -10, 4], [3, -11, 4]], '#3f7f3a', '#5a9e4a');
      for (const [dx, dy] of [[-7, -7], [-2, -11], [3, -9], [7, -5], [0, -5], [-4, -3], [5, -12]]) rose(cx + dx * z, cy + dy * z, 1.3 * z, ROSE);
      const W = [cx + 3 * z, cy - 1 * z];                                                                   // Spinnrad davor
      circle(W[0] + 4 * z, W[1] - 5 * z, 4 * z, C('#8a5a3c')); circle(W[0] + 4 * z, W[1] - 5 * z, 3.2 * z, C('#3f7f3a'));
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; sdLine('#a8794e', 0.35, z, [[W[0] + 4 * z, W[1] - 5 * z], [W[0] + (4 + Math.cos(a) * 3.4) * z, W[1] - (5 + Math.sin(a) * 3.4) * z]]); }
      sdLine('#8a5a3c', 0.9, z, [[W[0] + 1 * z, W[1]], [W[0] + 4 * z, W[1] - 5 * z]]); sdLine('#8a5a3c', 0.9, z, [[W[0] + 7 * z, W[1]], [W[0] + 4 * z, W[1] - 5 * z]]);
      circle(W[0] + 8.4 * z, W[1] - 8 * z, 0.9 * z, C('#fff3d6'));
    }],
    ['Apfelbaum mit Bank', (cx, cy, z) => {
      sdShadow(cx, cy, 11, z);
      sdTrunk(cx - 3 * z, cy, z, 16, 2, '#6e4a3a');
      sdBlob(cx - 3 * z, cy, z, SD_CROWN, '#3f8f4a', '#5fb35a');
      for (const [dx, dy] of [[-8, -18], [0, -24], [4, -19], [-5, -28], [6, -26]]) { circle(cx + (dx - 3) * z, cy + dy * z, 1.7 * z, C('#d6303a')); circle(cx + (dx - 3.5) * z, cy + (dy - 0.6) * z, 0.5 * z, C('#ff9a9a')); }
      poly([[cx + 1 * z, cy - 3 * z], [cx + 10 * z, cy - 3 * z], [cx + 10 * z, cy - 4.4 * z], [cx + 1 * z, cy - 4.4 * z]], C('#a8794e'));
      for (const dx of [2, 9]) sdLine('#8a5a3c', 0.8, z, [[cx + dx * z, cy - 3 * z], [cx + dx * z, cy]]);
      circle(cx + 6 * z, cy - 5.6 * z, 1.4 * z, C('#d6303a'));                                          // ein Apfel auf der Bank
    }],
    ['Zwergenhäuschen ✦', (cx, cy, z) => {                                  // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 16, z);
      box(cx, cy, 11 * z, 5.5 * z, 11 * z, '#f3e2c2', null, 0);
      for (const dx of [-7, 2]) { poly([[cx + dx * z, cy - 4 * z], [cx + (dx + 3) * z, cy - 4.6 * z], [cx + (dx + 3) * z, cy - 8 * z], [cx + dx * z, cy - 7.4 * z]], lit ? '#ffd27a' : C('#a8d8ff')); if (lit) glowAt(cx + (dx + 1.5) * z, cy - 6 * z, 12 * z, z); }
      poly([[cx + 6 * z, cy - 1 * z], [cx + 9 * z, cy - 2 * z], [cx + 9 * z, cy - 8 * z], [cx + 6 * z, cy - 7 * z]], C('#8a5a3c'));
      const top = cy - 11 * z;
      poly([[cx - 14 * z, top + 2 * z], [cx, top + 9 * z], [cx + 14 * z, top + 2 * z], [cx + 4 * z, top - 12 * z], [cx - 6 * z, top - 10 * z]], C('#c9443a'));
      for (const [dx, dy] of [[-6, -2], [2, 2], [7, -4], [-1, -7]]) circle(cx + dx * z, top + dy * z, 1.3 * z, C('#ffffff'));   // Fliegenpilz-Punkte
      poly([[cx + 6 * z, top - 4 * z], [cx + 8.4 * z, top - 5 * z], [cx + 8.4 * z, top - 13 * z], [cx + 6 * z, top - 12 * z]], C('#b4634a'));
      for (const [dx, h] of [[-12, 4], [-9, 3], [12, 3.4]]) { poly([[cx + (dx - 1) * z, cy + 1 * z], [cx + (dx + 1) * z, cy + 1 * z], [cx + (dx + 0.8) * z, cy - h * z], [cx + (dx - 0.8) * z, cy - h * z]], C('#fff3e0')); ellipse(cx + dx * z, cy - h * z, 2.4 * z, 1.4 * z, C('#d9534a')); }
    }, true],
    ['Zauberspiegel', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 6, z);
      sdLine(GOLD_D, 1.2, z, [[cx - 3 * z, cy], [cx, cy - 4 * z], [cx + 3 * z, cy]]);
      ellipse(cx, cy - 14 * z, 6 * z, 9 * z, C(GOLD)); ellipse(cx, cy - 14 * z, 4.8 * z, 7.6 * z, lit ? '#d9e9ff' : C('#b9cfe8'));
      ellipse(cx - 1.6 * z, cy - 16 * z, 1.2 * z, 3.4 * z, 'rgba(255,255,255,0.7)');
      for (const a of [0, 1.2, 2.4, 3.6, 4.8]) circle(cx + Math.cos(a) * 6 * z, cy - 14 * z + Math.sin(a) * 9 * z, 0.7 * z, C('#ff9ec0'));
      sdStarDraw([cx, cy - 24 * z], 1.6 * z, GOLD, GOLD_D);
      if (lit) glowAt(cx, cy - 14 * z, 14 * z, z, 'blue');
    }],
    ['Einhorn ✦', (cx, cy, z) => {                                          // klein, selten
      sdShadow(cx, cy, 9, z);
      for (const dx of [-4, -2, 3, 5]) sdLine('#e6e0f0', 1.2, z, [[cx + dx * z, cy - 6 * z], [cx + dx * z, cy - 0.5 * z]]);
      for (const dx of [-4, -2, 3, 5]) ellipse(cx + dx * z, cy - 0.4 * z, 0.8 * z, 0.5 * z, C(GOLD));
      ellipse(cx, cy - 8 * z, 6.5 * z, 3.6 * z, C('#ffffff'));
      poly([[cx + 4 * z, cy - 10 * z], [cx + 6.5 * z, cy - 16 * z], [cx + 8.4 * z, cy - 15 * z], [cx + 6.6 * z, cy - 9 * z]], C('#ffffff'));
      ellipse(cx + 8.6 * z, cy - 16 * z, 2.6 * z, 1.7 * z, C('#ffffff')); circle(cx + 8.8 * z, cy - 16.6 * z, 0.5 * z, C('#3a3a44'));
      poly([[cx + 8 * z, cy - 17.4 * z], [cx + 9.4 * z, cy - 17.6 * z], [cx + 9.4 * z, cy - 23 * z]], C(GOLD));   // Horn
      for (const [k, c] of [[0, PINK], [1, LILA], [2, '#7fd3ff'], [3, '#ffd23f']]) { sdLine(c, 1.3, z, [[cx + (6.4 - k * 0.6) * z, cy - (16 - k * 1.5) * z], [cx + (4.4 - k * 0.8) * z, cy - (11 - k * 0.6) * z]]); }   // Regenbogenmähne
      for (const [k, c] of [[0, PINK], [1, LILA], [2, '#7fd3ff']]) sdLine(c, 1.2, z, [[cx - 6 * z, cy - 9 * z], [cx - (9 + k) * z, cy - (4 - k * 0.5) * z]], [cx - (9 - k) * z, cy - 10 * z]);   // Schweif
    }],
    ['Herzchen-Laube', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      g.strokeStyle = C('#ffffff'); g.lineWidth = Math.max(0.8, 1.4 * z);
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 8 * z, cy); g.lineTo(cx + s * 8 * z, cy - 14 * z); g.stroke(); }
      heart(cx, cy - 18 * z, 9 * z, C('#ffb3cf')); heart(cx, cy - 18.4 * z, 6.6 * z, C('#ff8fb1'));
      for (const [dx, dy] of [[-8, -8], [8, -11], [-8, -3], [8, -5]]) rose(cx + dx * z, cy + dy * z, 1.2 * z, '#ffffff');
      poly([[cx - 5 * z, cy - 3 * z], [cx + 5 * z, cy - 3 * z], [cx + 5 * z, cy - 4.2 * z], [cx - 5 * z, cy - 4.2 * z]], C('#ffffff'));
    }],
    ['Krönchen-Laterne', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 4, z);
      sdLine('#e8d0e8', 1.6, z, [[cx, cy], [cx, cy - 17 * z]]);
      ellipse(cx, cy - 20 * z, 2.8 * z, 3.4 * z, lit ? '#ffe9b0' : C('#fff0f6'));
      if (lit) glowAt(cx, cy - 20 * z, 22 * z, z);
      poly([[cx - 3.4 * z, cy - 23 * z], [cx + 3.4 * z, cy - 23 * z], [cx + 3.2 * z, cy - 26.4 * z], [cx + 1.6 * z, cy - 24.6 * z], [cx, cy - 27.2 * z], [cx - 1.6 * z, cy - 24.6 * z], [cx - 3.2 * z, cy - 26.4 * z]], C(GOLD));
      for (const dx of [-3.2, 0, 3.2]) circle(cx + dx * z, cy - (dx ? 26.6 : 27.4) * z, 0.5 * z, C(PINK));
    }],
    ['Tanzpavillon ✦', (cx, cy, z) => {                                     // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 18, z);
      ellipse(cx, cy, 17 * z, 8 * z, C('#f3ecdf')); ellipse(cx, cy - 1.4 * z, 15 * z, 7 * z, C('#fff8ee'));
      for (let k = 0; k < 6; k++) { const a = Math.PI * 0.05 + k / 5 * Math.PI * 0.9, x = cx + Math.cos(a) * 14 * z, y = cy - 1.4 * z + Math.sin(a) * 6.4 * z;
        poly([[x - 0.8 * z, y], [x + 0.8 * z, y], [x + 0.8 * z, y - 16 * z], [x - 0.8 * z, y - 16 * z]], C('#ffffff')); }
      const top = cy - 17 * z;
      g.beginPath(); g.moveTo(cx - 17 * z, top + 2 * z); g.quadraticCurveTo(cx, top - 16 * z, cx + 17 * z, top + 2 * z); g.quadraticCurveTo(cx, top + 9 * z, cx - 17 * z, top + 2 * z); g.closePath(); g.fillStyle = C('#ffb3cf'); g.fill();
      for (let k = 0; k < 7; k++) { const x = cx + (-15 + k * 5) * z; heart(x, top + 3.4 * z + Math.sin(k / 6 * Math.PI) * 3 * z, 1.2 * z, C('#ff8fb1')); }
      sdStarDraw([cx, top - 9 * z], 2 * z, GOLD, GOLD_D);
      if (lit) for (let k = 0; k < 5; k++) glowAt(cx + (-12 + k * 6) * z, top + 4 * z, 10 * z, z);
    }, true],
  ];
})();
'ok';
