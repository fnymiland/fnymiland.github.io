// 🍃 Sammlung Inselleben (Block 161c, Animal-Crossing-Gefühl – eigene Motive). Form wie SD_ART; Bogen: tools/waren-entwurf.js
window.WAREN_INSEL = (() => {
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const plank = (x0, y0, x1, y1, h, col, z) => poly([[x0, y0], [x1, y1], [x1, y1 - h * z], [x0, y0 - h * z]], C(col));
  return [
    ['Lagerfeuer', (cx, cy, z, now) => {
      const lit = sdLit();
      sdShadow(cx, cy, 9, z);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ellipse(cx + Math.cos(a) * 7 * z, cy + Math.sin(a) * 3 * z, 2 * z, 1.3 * z, C(k & 1 ? '#9b958a' : '#b5ad9c')); }
      sdLine('#6e4a3a', 1.6, z, [[cx - 4 * z, cy + 1 * z], [cx + 3 * z, cy - 3 * z]]); sdLine('#7a5236', 1.6, z, [[cx + 4 * z, cy + 1 * z], [cx - 3 * z, cy - 3 * z]]);
      poly([[cx - 3.4 * z, cy - 1 * z], [cx + 3.4 * z, cy - 1 * z], [cx + 1 * z, cy - 8 * z], [cx, cy - 11 * z], [cx - 1.4 * z, cy - 7 * z]], C('#ff8a3d'));
      poly([[cx - 1.8 * z, cy - 1 * z], [cx + 1.8 * z, cy - 1 * z], [cx + 0.4 * z, cy - 6.4 * z], [cx - 0.6 * z, cy - 4 * z]], C('#ffd23f'));
      if (lit) glowAt(cx, cy - 4 * z, 30 * z, z);
      for (const s of [-1, 1]) { poly([[cx + s * 10 * z, cy - 1 * z], [cx + s * 14 * z, cy + 1 * z], [cx + s * 14 * z, cy - 1.5 * z], [cx + s * 10 * z, cy - 3.5 * z]], C('#8a5a3c')); }   // Baumstämme zum Sitzen
    }],
    ['Hängematte', (cx, cy, z) => {
      sdShadow(cx, cy, 12, z);
      for (const s of [-1, 1]) { sdTrunk(cx + s * 11 * z, cy, z, 18, 1.4, '#7a5a3a'); sdBlob(cx + s * 11 * z, cy, z, [[0, -20, 5], [-3, -18, 3.4], [3, -18, 3.4]], '#4f9e4a', '#74c25e'); }
      g.beginPath(); g.moveTo(cx - 10 * z, cy - 12 * z); g.quadraticCurveTo(cx, cy - 2 * z, cx + 10 * z, cy - 12 * z); g.quadraticCurveTo(cx, cy - 6 * z, cx - 10 * z, cy - 12 * z); g.closePath();
      g.fillStyle = C('#e86f8f'); g.fill();
      for (const t of [0.3, 0.5, 0.7]) { const x = cx + (-10 + 20 * t) * z, y = cy - (12 - 10 * 4 * t * (1 - t) * 0.9) * z; sdLine('#fff3e0', 0.6, z, [[x - 0.6 * z, y - 1 * z], [x + 0.6 * z, y + 1 * z]]); }
    }],
    ['Picknickdecke', (cx, cy, z) => {
      poly([[cx - 11 * z, cy], [cx, cy - 5.5 * z], [cx + 11 * z, cy], [cx, cy + 5.5 * z]], C('#e8546f'));
      for (let k = -2; k <= 2; k++) { sdLine('#fff3f3', 0.9, z, [[cx + (k * 2.2 - 5.5) * z, cy + (k * 1.1 + 2.75) * z], [cx + (k * 2.2 + 5.5) * z, cy + (k * 1.1 - 2.75) * z]]); sdLine('#fff3f3', 0.9, z, [[cx + (k * 2.2 - 5.5) * z, cy - (k * 1.1 + 2.75) * z], [cx + (k * 2.2 + 5.5) * z, cy - (k * 1.1 - 2.75) * z]]); }
      poly([[cx - 4 * z, cy - 1 * z], [cx + 1 * z, cy - 1 * z], [cx + 1 * z, cy - 5 * z], [cx - 4 * z, cy - 5 * z]], C('#c69a5e'));   // Korb
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.5, 0.7 * z); g.beginPath(); g.ellipse(cx - 1.5 * z, cy - 5 * z, 2.4 * z, 2.4 * z, 0, Math.PI, 0); g.stroke();
      for (const [dx, dy, c] of [[4, -1, '#d6303a'], [5.6, 0.4, '#ffd23f'], [3, 1, '#5fb35a']]) circle(cx + dx * z, cy + dy * z, 1.2 * z, C(c));
    }],
    ['Briefkasten', (cx, cy, z) => {
      sdShadow(cx, cy, 5, z);
      sdLine('#8a5a3c', 1.4, z, [[cx, cy], [cx, cy - 10 * z]]);
      poly([[cx - 4 * z, cy - 10 * z], [cx + 4 * z, cy - 10 * z], [cx + 4 * z, cy - 15 * z], [cx - 4 * z, cy - 15 * z]], C('#58b3e8'));
      g.beginPath(); g.ellipse(cx, cy - 15 * z, 4 * z, 2.4 * z, 0, Math.PI, 0); g.fillStyle = C('#58b3e8'); g.fill();
      sdLine('#d9534a', 0.8, z, [[cx + 4.4 * z, cy - 11 * z], [cx + 4.4 * z, cy - 17 * z]]); poly([[cx + 4.4 * z, cy - 17 * z], [cx + 7 * z, cy - 16.4 * z], [cx + 4.4 * z, cy - 15.4 * z]], C('#d9534a'));
      poly([[cx - 2 * z, cy - 12 * z], [cx + 1 * z, cy - 12 * z], [cx + 1 * z, cy - 13 * z], [cx - 2 * z, cy - 13 * z]], C('#fffaf0'));   // Brief guckt raus
    }],
    ['Fossil ✦', (cx, cy, z) => {                                            // klein, selten
      sdShadow(cx, cy, 11, z);
      box(cx, cy, 9 * z, 4.5 * z, 3 * z, '#d9cfbf', '#e8e1d4', 0);
      const B = '#f3ecdf';
      sdLine(B, 1.4, z, [[cx - 6 * z, cy - 10 * z], [cx + 6 * z, cy - 12 * z]], [cx, cy - 15 * z]);   // Rücken
      for (let k = 0; k < 5; k++) { const x = cx + (-4 + k * 2) * z; sdLine(B, 0.7, z, [[x, cy - (13 - Math.abs(k - 2) * 0.4) * z], [x + 0.6 * z, cy - (8 + Math.abs(k - 2) * 0.3) * z]]); }   // Rippen
      sdLine(B, 1, z, [[cx + 6 * z, cy - 12 * z], [cx + 9 * z, cy - 18 * z]]); ellipse(cx + 10 * z, cy - 19.4 * z, 2.6 * z, 1.6 * z, C(B)); circle(cx + 10.6 * z, cy - 19.8 * z, 0.5 * z, C('#8a7a62'));   // Hals, Kopf
      sdLine(B, 1, z, [[cx - 6 * z, cy - 10 * z], [cx - 11 * z, cy - 6 * z]], [cx - 10 * z, cy - 11 * z]);   // Schwanz
      for (const dx of [-4, 3]) sdLine(B, 0.9, z, [[cx + dx * z, cy - 9 * z], [cx + (dx - 0.6) * z, cy - 3 * z]]);
    }],
    ['Strandkorb', (cx, cy, z) => {
      sdShadow(cx, cy, 8, z);
      poly([[cx - 6 * z, cy], [cx + 6 * z, cy], [cx + 6 * z, cy - 8 * z], [cx - 6 * z, cy - 8 * z]], C('#e8d0a0'));
      for (let k = 0; k < 5; k++) sdLine('#c9a86a', 0.35, z, [[cx - 6 * z, cy - (1.5 + k * 1.5) * z], [cx + 6 * z, cy - (1.5 + k * 1.5) * z]]);
      g.beginPath(); g.moveTo(cx - 6 * z, cy - 8 * z); g.lineTo(cx - 6 * z, cy - 17 * z); g.quadraticCurveTo(cx, cy - 21 * z, cx + 6 * z, cy - 17 * z); g.lineTo(cx + 6 * z, cy - 8 * z); g.closePath(); g.fillStyle = C('#e8d0a0'); g.fill();
      g.beginPath(); g.moveTo(cx - 4.6 * z, cy - 8 * z); g.lineTo(cx - 4.6 * z, cy - 16 * z); g.quadraticCurveTo(cx, cy - 19 * z, cx + 4.6 * z, cy - 16 * z); g.lineTo(cx + 4.6 * z, cy - 8 * z); g.closePath(); g.fillStyle = C('#58b3e8'); g.fill();
      for (let k = 0; k < 4; k++) poly([[cx + (-4.6 + k * 2.3) * z, cy - 8 * z], [cx + (-3.45 + k * 2.3) * z, cy - 8 * z], [cx + (-3.45 + k * 2.3) * z, cy - 17 * z], [cx + (-4.6 + k * 2.3) * z, cy - 17 * z]], C('#ffffff'));
      poly([[cx - 4.6 * z, cy - 8 * z], [cx + 4.6 * z, cy - 8 * z], [cx + 4.6 * z, cy - 9.6 * z], [cx - 4.6 * z, cy - 9.6 * z]], C('#e86f8f'));   // Kissen
    }],
    ['Vogelscheuche', (cx, cy, z) => {
      sdShadow(cx, cy, 6, z);
      sdLine('#8a5a3c', 1.2, z, [[cx, cy], [cx, cy - 20 * z]]); sdLine('#8a5a3c', 1, z, [[cx - 7 * z, cy - 14 * z], [cx + 7 * z, cy - 14 * z]]);
      poly([[cx - 4 * z, cy - 6 * z], [cx + 4 * z, cy - 6 * z], [cx + 4.6 * z, cy - 15 * z], [cx - 4.6 * z, cy - 15 * z]], C('#58b3e8'));
      poly([[cx - 2 * z, cy - 6 * z], [cx + 2 * z, cy - 6 * z], [cx + 1.6 * z, cy - 12 * z], [cx - 1.6 * z, cy - 12 * z]], C('#e86f8f'));   // Flicken
      for (const s of [-1, 1]) for (const k of [0, 1, 2]) sdLine('#e8c25a', 0.5, z, [[cx + s * 7 * z, cy - 14 * z], [cx + s * (8 + k * 0.4) * z, cy - (12.4 - k) * z]]);   // Stroh
      circle(cx, cy - 18 * z, 3.2 * z, C('#f3e2c2'));
      for (const dx of [-1.2, 1.2]) circle(cx + dx * z, cy - 18.4 * z, 0.45 * z, C('#3a3a44'));
      g.strokeStyle = C('#5a3a2a'); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.ellipse(cx, cy - 17.4 * z, 1.3 * z, 0.8 * z, 0, 0.2, Math.PI - 0.2); g.stroke();
      poly([[cx - 5.6 * z, cy - 20 * z], [cx + 5.6 * z, cy - 20 * z], [cx + 2.6 * z, cy - 21 * z], [cx + 1.6 * z, cy - 25 * z], [cx - 1.6 * z, cy - 25 * z], [cx - 2.6 * z, cy - 21 * z]], C('#e8c25a'));   // Strohhut
      poly([[cx - 2.6 * z, cy - 21 * z], [cx + 2.6 * z, cy - 21 * z], [cx + 2.4 * z, cy - 22 * z], [cx - 2.4 * z, cy - 22 * z]], C('#d9534a'));
    }],
    ['Wäscheleine', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      for (const s of [-1, 1]) sdLine('#8a5a3c', 1.2, z, [[cx + s * 10 * z, cy], [cx + s * 10 * z, cy - 16 * z]]);
      sdLine('#e8e2d6', 0.4, z, [[cx - 10 * z, cy - 15 * z], [cx + 10 * z, cy - 15 * z]], [cx, cy - 12 * z]);
      for (const [t, w, h, c] of [[0.2, 2.4, 6, '#58b3e8'], [0.42, 3, 4, '#ffd23f'], [0.62, 2.2, 5, '#e86f8f'], [0.82, 2.4, 3.4, '#ffffff']]) {
        const x = cx + (-10 + 20 * t) * z, y = cy - (15 - 3 * 4 * t * (1 - t)) * z;
        poly([[x - w * z, y], [x + w * z, y], [x + w * 0.9 * z, y + h * z], [x - w * 0.9 * z, y + h * z]], C(c));
        circle(x - w * 0.6 * z, y, 0.4 * z, C('#a8794e')); circle(x + w * 0.6 * z, y, 0.4 * z, C('#a8794e'));
      }
    }],
    ['Glockenbaum', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      sdTrunk(cx, cy, z, 15, 2, '#6e4a3a');
      sdBlob(cx, cy, z, SD_CROWN, '#3f8f4a', '#5fb35a');
      for (const [dx, dy] of [[-7, -16], [6, -19], [-1, -22], [9, -25], [-9, -24]]) { const x = cx + dx * z, y = cy + dy * z;   // goldene Glöckchen
        poly([[x - 1.6 * z, y + 1.6 * z], [x + 1.6 * z, y + 1.6 * z], [x + 1 * z, y - 1 * z], [x - 1 * z, y - 1 * z]], C('#f5c84b')); circle(x, y + 1.9 * z, 0.5 * z, C('#c9962a')); }
    }],
    ['Teleskop', (cx, cy, z) => {
      sdShadow(cx, cy, 6, z);
      for (const [dx, dy] of [[-4, 1], [4, 1], [0, 2]]) sdLine('#8a5a3c', 0.9, z, [[cx, cy - 9 * z], [cx + dx * z, cy + dy * z]]);
      g.save(); g.translate(cx, cy - 10 * z); g.rotate(-0.6);
      poly([[-5 * z, -1.4 * z], [7 * z, -2.2 * z], [7 * z, 2.2 * z], [-5 * z, 1.4 * z]], C('#c9962a')); poly([[7 * z, -2.4 * z], [9 * z, -2.4 * z], [9 * z, 2.4 * z], [7 * z, 2.4 * z]], C('#2f3b7a'));
      g.restore();
      sdStarDraw([cx + 9 * z, cy - 24 * z], 1.4 * z, '#f5c84b', '#c9962a');
    }],
    ['Kanu', (cx, cy, z) => {
      sdShadow(cx, cy, 12, z);
      g.beginPath(); g.moveTo(cx - 13 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy + 3 * z, cx + 13 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 1 * z, cx - 13 * z, cy - 4 * z); g.closePath(); g.fillStyle = C('#d9701e'); g.fill();
      g.beginPath(); g.moveTo(cx - 12 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 1.6 * z, cx + 12 * z, cy - 4 * z); g.quadraticCurveTo(cx, cy - 2.6 * z, cx - 12 * z, cy - 4 * z); g.closePath(); g.fillStyle = C('#8a4a1e'); g.fill();
      sdLine('#a8794e', 0.9, z, [[cx - 4 * z, cy - 8 * z], [cx + 6 * z, cy + 1 * z]]); ellipse(cx + 6.6 * z, cy + 1.6 * z, 1.4 * z, 0.7 * z, C('#a8794e'));
    }],
    ['Gartenwichtel', (cx, cy, z) => {
      sdShadow(cx, cy, 4, z);
      ellipse(cx, cy - 4 * z, 3.2 * z, 4 * z, C('#58b3e8'));
      circle(cx, cy - 9 * z, 2.4 * z, C('#f3d2b0'));
      poly([[cx - 2.6 * z, cy - 8 * z], [cx + 2.6 * z, cy - 8 * z], [cx, cy - 4.4 * z]], C('#ffffff'));            // Bart
      poly([[cx - 2.8 * z, cy - 10 * z], [cx + 2.8 * z, cy - 10 * z], [cx + 1 * z, cy - 17 * z]], C('#d9534a'));   // Zipfelmütze
      circle(cx, cy - 9.2 * z, 0.6 * z, C('#e8907a'));
      for (const s of [-1, 1]) ellipse(cx + s * 1.6 * z, cy - 0.3 * z, 1.4 * z, 0.7 * z, C('#6e4a3a'));
      ellipse(cx + 4 * z, cy - 1 * z, 2.2 * z, 1.6 * z, C('#e8546f')); circle(cx + 3.4 * z, cy - 1.8 * z, 0.4 * z, C('#ffffff'));   // Pilz daneben
    }],
    ['Hühnerhaus ✦', (cx, cy, z) => {                                       // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 16, z);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; sdLine('#c9a86a', 0.8, z, [[cx + Math.cos(a) * 15 * z, cy + Math.sin(a) * 7 * z], [cx + Math.cos(a) * 15 * z, cy + Math.sin(a) * 7 * z - 4 * z]]); }
      box(cx - 3 * z, cy - 1 * z, 6 * z, 3 * z, 8 * z, '#d9534a', null, 0);
      poly([[cx - 10 * z, cy - 9 * z], [cx - 3 * z, cy - 5.6 * z], [cx + 4 * z, cy - 9 * z], [cx - 3 * z, cy - 15 * z]], C('#fff3e0'));
      poly([[cx - 4 * z, cy - 2 * z], [cx - 1.6 * z, cy - 3 * z], [cx - 1.6 * z, cy - 6.4 * z], [cx - 4 * z, cy - 5.4 * z]], lit ? '#ffd27a' : C('#5a3a2a'));
      if (lit) glowAt(cx - 2.8 * z, cy - 4.4 * z, 12 * z, z);
      for (const [dx, dy, c] of [[6, 2, '#ffffff'], [9, -1, '#e8c25a'], [3, 4, '#ffffff']]) { const x = cx + dx * z, y = cy + dy * z;   // Hühner
        ellipse(x, y - 1.6 * z, 2 * z, 1.6 * z, C(c)); circle(x + 1.6 * z, y - 3 * z, 1 * z, C(c)); poly([[x + 2.4 * z, y - 3 * z], [x + 3.4 * z, y - 2.8 * z], [x + 2.4 * z, y - 2.5 * z]], C('#f0a24a')); circle(x + 1.6 * z, y - 4 * z, 0.5 * z, C('#d9534a')); }
    }, true],
  ];
})();
'ok';
