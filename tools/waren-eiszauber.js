// ❄️ Sammlung Eiszauber (Block 161c, Nutzer 17.10.2026: „Fanny liebt …“ – eigene Motive nach der Schneekönigin, keine Disney-Figuren).
// Form wie SD_ART (cx, cy, z, now, x, y, t); Helfer aus sternstaub.js. Bogen: tools/waren-entwurf.js
window.WAREN_EISZAUBER = (() => {
  const ICE = '#bfe6f7', ICE_D = '#8cc7e6', ICE_L = '#eaf8ff', SNOW = '#fbfdff', SNOW_S = '#dfeaf2';
  const snow = (cx, cy, rx, z) => { ellipse(cx, cy + 0.6 * z, rx * z, rx * 0.42 * z, C(SNOW_S)); ellipse(cx - 0.6 * z, cy, rx * 0.86 * z, rx * 0.34 * z, C(SNOW)); };
  const flake = (x, y, r, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.stroke(); };
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  return [
    ['Schneemann', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      circle(cx, cy - 5 * z, 6 * z, C(SNOW)); circle(cx - 1.5 * z, cy - 6.5 * z, 3 * z, C('#ffffff'));
      circle(cx, cy - 14 * z, 4.6 * z, C(SNOW)); circle(cx, cy - 21 * z, 3.6 * z, C(SNOW));
      ellipse(cx, cy - 17.6 * z, 4.8 * z, 1.4 * z, C('#d9534a'));                                      // Schal
      poly([[cx + 2 * z, cy - 18 * z], [cx + 4.6 * z, cy - 18 * z], [cx + 5.4 * z, cy - 13 * z], [cx + 3.4 * z, cy - 13.4 * z]], C('#c23f37'));
      poly([[cx + 0.8 * z, cy - 21 * z], [cx + 5 * z, cy - 20.4 * z], [cx + 0.8 * z, cy - 20 * z]], C('#f08a2e'));   // Karotte
      for (const dx of [-1.2, 1]) circle(cx + dx * z, cy - 22.2 * z, 0.5 * z, C('#3a3a44'));
      for (const dy of [-12.5, -15]) circle(cx, cy + dy * z, 0.55 * z, C('#3a3a44'));
      sdLine('#6b4f3a', 0.9, z, [[cx - 4 * z, cy - 14 * z], [cx - 9 * z, cy - 18 * z]]); sdLine('#6b4f3a', 0.9, z, [[cx + 4 * z, cy - 14 * z], [cx + 8.5 * z, cy - 11 * z]]);
      poly([[cx - 3.4 * z, cy - 24 * z], [cx + 3.4 * z, cy - 24 * z], [cx + 2.6 * z, cy - 30 * z], [cx - 2.6 * z, cy - 30 * z]], C('#3a3a44'));   // Hut
      ellipse(cx, cy - 24 * z, 4.4 * z, 1.2 * z, C('#3a3a44')); poly([[cx - 2.9 * z, cy - 25.4 * z], [cx + 2.9 * z, cy - 25.4 * z], [cx + 2.8 * z, cy - 26.4 * z], [cx - 2.8 * z, cy - 26.4 * z]], C('#d9534a'));
    }],
    ['Eiskristall-Laterne', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 5, z);
      sdLine('#9fc3d8', 1.6, z, [[cx, cy], [cx, cy - 17 * z]]);
      const L = [cx, cy - 21 * z];
      poly([[L[0], L[1] - 6 * z], [L[0] + 3.4 * z, L[1] - 1 * z], [L[0] + 2 * z, L[1] + 4 * z], [L[0] - 2 * z, L[1] + 4 * z], [L[0] - 3.4 * z, L[1] - 1 * z]], lit ? '#e6f6ff' : C(ICE));
      poly([[L[0], L[1] - 6 * z], [L[0] + 3.4 * z, L[1] - 1 * z], [L[0], L[1] + 1 * z]], lit ? '#ffffff' : C(ICE_L));
      if (lit) glowAt(L[0], L[1], 24 * z, z, 'blue');
      flake(L[0], L[1] - 9 * z, 2 * z, C('#ffffff'), Math.max(0.5, 0.6 * z));
    }],
    ['Verschneite Tanne', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      poly([[cx - 1.4 * z, cy], [cx + 1.4 * z, cy], [cx + 1.4 * z, cy - 4 * z], [cx - 1.4 * z, cy - 4 * z]], C('#6e4a3a'));
      for (const [y0, w] of [[-4, 9], [-12, 7], [-19, 5]]) {
        poly([[cx - w * z, cy + y0 * z], [cx + w * z, cy + y0 * z], [cx, cy + (y0 - 11) * z]], C('#2f7a4a'));
        poly([[cx - w * 0.9 * z, cy + (y0 - 1) * z], [cx - w * 0.2 * z, cy + (y0 - 2.5) * z], [cx, cy + (y0 - 11) * z], [cx - w * 0.5 * z, cy + (y0 - 5) * z]], C(SNOW));
      }
      sdStarDraw([cx, cy - 31 * z], 2 * z, '#f5c84b', '#c9962a');
    }],
    ['Schlitten mit Geschenken', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      sdLine('#8a5a3c', 1.2, z, [[cx - 10 * z, cy - 1 * z], [cx + 8 * z, cy - 1 * z], [cx + 11 * z, cy - 4 * z]]);
      for (const dx of [-6, 4]) sdLine('#8a5a3c', 1, z, [[cx + dx * z, cy - 1 * z], [cx + dx * z, cy - 4 * z]]);
      poly([[cx - 9 * z, cy - 4 * z], [cx + 8 * z, cy - 4 * z], [cx + 9 * z, cy - 8 * z], [cx - 8 * z, cy - 8 * z]], C('#c9443a'));
      for (const [dx, w, h, c, r] of [[-5, 3.4, 5, '#58b3e8', '#ffd23f'], [0, 3, 7, '#b57bff', '#ffffff'], [5, 2.8, 4, '#58b36a', '#e86f8f']]) {
        poly([[cx + (dx - w) * z, cy - 8 * z], [cx + (dx + w) * z, cy - 8 * z], [cx + (dx + w) * z, cy - (8 + h) * z], [cx + (dx - w) * z, cy - (8 + h) * z]], C(c));
        poly([[cx + (dx - 0.5) * z, cy - 8 * z], [cx + (dx + 0.5) * z, cy - 8 * z], [cx + (dx + 0.5) * z, cy - (8 + h) * z], [cx + (dx - 0.5) * z, cy - (8 + h) * z]], C(r));
        circle(cx + (dx - 0.8) * z, cy - (8.6 + h) * z, 0.9 * z, C(r)); circle(cx + (dx + 0.8) * z, cy - (8.6 + h) * z, 0.9 * z, C(r));
      }
    }],
    ['Rentier', (cx, cy, z) => {
      snow(cx, cy, 8, z);
      for (const dx of [-4, -2, 3, 5]) sdLine('#7a5236', 1.1, z, [[cx + dx * z, cy - 6 * z], [cx + dx * z, cy - 0.5 * z]]);
      ellipse(cx, cy - 8 * z, 6.5 * z, 3.4 * z, C('#a0724a')); ellipse(cx - 1 * z, cy - 7 * z, 4.5 * z, 1.8 * z, C('#e8d4b4'));
      poly([[cx + 4 * z, cy - 10 * z], [cx + 6.5 * z, cy - 16 * z], [cx + 8 * z, cy - 15 * z], [cx + 6.4 * z, cy - 9 * z]], C('#a0724a'));
      ellipse(cx + 8 * z, cy - 16.4 * z, 2.6 * z, 1.8 * z, C('#a0724a')); circle(cx + 10.4 * z, cy - 16 * z, 0.9 * z, C('#d9534a'));
      for (const s of [-1, 1]) { const b = [cx + 7.4 * z, cy - 18 * z]; sdLine('#6e4a3a', 0.6, z, [b, [b[0] + s * 2.4 * z, b[1] - 4.4 * z]]); sdLine('#6e4a3a', 0.6, z, [[b[0] + s * 1.2 * z, b[1] - 2.2 * z], [b[0] + s * 3.4 * z, b[1] - 2.8 * z]]); }
      circle(cx - 6.6 * z, cy - 9 * z, 1.1 * z, C('#ffffff'));
    }],
    ['Iglu', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 20, z);
      g.beginPath(); g.ellipse(cx, cy - 1 * z, 15 * z, 13 * z, 0, Math.PI, 0); g.closePath(); g.fillStyle = C('#f2f8fc'); g.fill();
      g.strokeStyle = C('#cfdde8'); g.lineWidth = Math.max(0.5, 0.5 * z);
      for (const k of [4, 8, 11]) { g.beginPath(); g.ellipse(cx, cy - 1 * z, 15 * z * Math.sqrt(1 - (k / 13) ** 2), 1, 0, 0, 0); g.moveTo(cx - 15 * z * Math.sqrt(1 - (k / 13) ** 2), cy - (1 + k) * z); g.lineTo(cx + 15 * z * Math.sqrt(1 - (k / 13) ** 2), cy - (1 + k) * z); g.stroke(); }
      g.beginPath(); g.ellipse(cx + 6 * z, cy, 5 * z, 6 * z, 0, Math.PI, 0); g.closePath(); g.fillStyle = C('#e6f1f8'); g.fill();
      g.beginPath(); g.ellipse(cx + 6.4 * z, cy, 3 * z, 4.2 * z, 0, Math.PI, 0); g.closePath(); g.fillStyle = lit ? '#ffcf7a' : C('#5d7f99'); g.fill();
      if (lit) glowAt(cx + 6.4 * z, cy - 2 * z, 20 * z, z);
    }, true],
    ['Eisblumen', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 7, z);
      for (const [dx, dy, h] of [[-4, 1, 8], [0, 0, 11], [4, 1, 9]]) {
        sdLine('#7fb6cf', 0.7, z, [[cx + dx * z, cy + dy * z], [cx + dx * z, cy + (dy - h) * z]]);
        const p = [cx + dx * z, cy + (dy - h) * z];
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; poly([[p[0], p[1]], [p[0] + Math.cos(a - 0.25) * 2.6 * z, p[1] + Math.sin(a - 0.25) * 1.8 * z], [p[0] + Math.cos(a + 0.25) * 2.6 * z, p[1] + Math.sin(a + 0.25) * 1.8 * z]], lit ? '#e6f6ff' : C(ICE)); }
        circle(p[0], p[1], 0.8 * z, C('#ffffff'));
        if (lit) glowAt(p[0], p[1], 7 * z, z, 'blue');
      }
    }],
    ['Schneeflocken-Bogen', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 10, z);
      g.strokeStyle = C(ICE_D); g.lineWidth = Math.max(0.7, 1.6 * z); g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx - 9 * z, cy); g.quadraticCurveTo(cx - 9 * z, cy - 26 * z, cx, cy - 26 * z); g.quadraticCurveTo(cx + 9 * z, cy - 26 * z, cx + 9 * z, cy); g.stroke();
      for (const [dx, dy] of [[-6, -18], [-2, -23], [3, -22], [7, -15], [0, -14]]) {
        const p = [cx + dx * z, cy + dy * z];
        sdLine('#cfe6f2', 0.3, z, [[p[0], p[1] - 3 * z], p]);
        flake(p[0], p[1] + 1.4 * z, 1.6 * z, lit ? '#ffffff' : C('#9fd3ee'), Math.max(0.5, 0.55 * z));
        if (lit) glowAt(p[0], p[1] + 1.4 * z, 7 * z, z, 'blue');
      }
    }],
    ['Eisbank', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      for (const dx of [-6, 6]) poly([[cx + (dx - 1.4) * z, cy], [cx + (dx + 1.4) * z, cy], [cx + (dx + 1.2) * z, cy - 5 * z], [cx + (dx - 1.2) * z, cy - 5 * z]], C(ICE_D));
      poly([[cx - 8 * z, cy - 5 * z], [cx + 8 * z, cy - 5 * z], [cx + 8 * z, cy - 7 * z], [cx - 8 * z, cy - 7 * z]], C(ICE));
      poly([[cx - 8 * z, cy - 7 * z], [cx + 8 * z, cy - 7 * z], [cx + 8 * z, cy - 14 * z], [cx - 8 * z, cy - 14 * z]], C(ICE_L));
      for (const [dx, l] of [[-6, 3], [-3, 2], [1, 3.4], [5, 2.2]]) poly([[cx + (dx - 0.7) * z, cy - 5 * z], [cx + (dx + 0.7) * z, cy - 5 * z], [cx + dx * z, cy - (5 - l) * z]], C('#e6f6ff'));
      ellipse(cx, cy - 14 * z, 8.4 * z, 1.2 * z, C(SNOW));
    }],
    ['Eisbär', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      ellipse(cx - 1 * z, cy - 6 * z, 7.5 * z, 5 * z, C('#f6f3ea'));
      for (const dx of [-6, -2.5, 2, 4.6]) ellipse(cx + dx * z, cy - 1.4 * z, 1.8 * z, 1.6 * z, C('#ece7da'));
      circle(cx + 6 * z, cy - 9 * z, 3.6 * z, C('#f6f3ea')); ellipse(cx + 9 * z, cy - 8.4 * z, 1.8 * z, 1.4 * z, C('#ece7da'));
      circle(cx + 10.4 * z, cy - 8.8 * z, 0.6 * z, C('#3a3a44')); circle(cx + 7 * z, cy - 10 * z, 0.5 * z, C('#3a3a44'));
      circle(cx + 4.4 * z, cy - 12.2 * z, 1.2 * z, C('#f6f3ea'));
    }],
    ['Pinguine', (cx, cy, z) => {
      snow(cx, cy, 9, z);
      for (const [dx, s] of [[-4, 1], [3.6, 0.85]]) {
        const x = cx + dx * z, H = 11 * s;
        ellipse(x, cy - H * 0.45 * z, 3.4 * s * z, H * 0.5 * z, C('#2f3440'));
        ellipse(x + 0.6 * z, cy - H * 0.42 * z, 2.2 * s * z, H * 0.4 * z, C('#ffffff'));
        circle(x, cy - H * z, 2.4 * s * z, C('#2f3440')); circle(x + 0.9 * s * z, cy - H * z, 0.4 * z, C('#ffffff'));
        poly([[x + 2 * s * z, cy - H * z], [x + 3.6 * s * z, cy - (H - 0.6) * z], [x + 2 * s * z, cy - (H - 1) * z]], C('#f0a24a'));
        ellipse(x, cy - 0.3 * z, 1.8 * s * z, 0.7 * z, C('#f0a24a'));
      }
      ellipse(cx - 4 * z, cy - 9.6 * z, 3 * z, 0.9 * z, C('#d9534a'));                                    // Mützchen-Schal
    }],
    ['Schneekugel', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 6, z);
      poly([[cx - 5 * z, cy], [cx + 5 * z, cy], [cx + 4 * z, cy - 4 * z], [cx - 4 * z, cy - 4 * z]], C('#8a5a3c'));
      circle(cx, cy - 11 * z, 7.6 * z, lit ? 'rgba(220,240,255,0.75)' : 'rgba(210,236,250,0.7)');
      ellipse(cx, cy - 5.4 * z, 6 * z, 1.8 * z, C(SNOW));
      poly([[cx - 2.4 * z, cy - 5.4 * z], [cx + 2.4 * z, cy - 5.4 * z], [cx + 2.4 * z, cy - 9 * z], [cx - 2.4 * z, cy - 9 * z]], C('#e8705f'));
      poly([[cx - 3 * z, cy - 9 * z], [cx + 3 * z, cy - 9 * z], [cx, cy - 12 * z]], C('#4a5f9e'));
      circle(cx + 0.9 * z, cy - 7 * z, 0.7 * z, lit ? '#ffd27a' : C('#ffe9b8'));
      for (const [dx, dy] of [[-4, -13], [3, -15], [5, -10], [-2, -16], [1, -12]]) circle(cx + dx * z, cy + dy * z, 0.5 * z, C('#ffffff'));
      ellipse(cx - 3 * z, cy - 14 * z, 1.6 * z, 2.6 * z, 'rgba(255,255,255,0.55)');
      if (lit) glowAt(cx, cy - 9 * z, 14 * z, z);
    }],
    ['Schlittschuh-Teich', (cx, cy, z) => {
      snow(cx, cy, 24, z);
      ellipse(cx, cy, 20 * z, 9.6 * z, C('#a9d8ef')); ellipse(cx - 3 * z, cy - 1.5 * z, 13 * z, 5 * z, C('#c9ebfa'));
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = Math.max(0.5, 0.5 * z);
      g.beginPath(); g.ellipse(cx + 2 * z, cy + 1 * z, 9 * z, 3.6 * z, 0.2, 0, Math.PI * 1.6); g.stroke();
      g.beginPath(); g.ellipse(cx - 5 * z, cy - 1 * z, 5 * z, 2 * z, -0.3, 0.4, Math.PI * 2); g.stroke();
      for (const [dx, dy] of [[14, -4], [-16, 2], [10, 6]]) { ellipse(cx + dx * z, cy + dy * z, 2.4 * z, 1.4 * z, C(SNOW)); }
      sdLine('#6b4f3a', 0.9, z, [[cx + 16 * z, cy + 1 * z], [cx + 16 * z, cy - 9 * z]]); poly([[cx + 16 * z, cy - 9 * z], [cx + 21 * z, cy - 8 * z], [cx + 16 * z, cy - 6.6 * z]], C('#d9534a'));
    }, true],
    ['Eispalast-Pavillon ✦', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 22, z);
      box(cx, cy, 13 * z, 6.5 * z, 2 * z, '#d6ebf6', '#eaf6fc', 0);
      for (const [dx, dy] of [[-10, -1], [10, -1], [-5, 2.5], [5, 2.5]]) { const x = cx + dx * z, y = cy + (dy - 2) * z;
        poly([[x - 1 * z, y], [x + 1 * z, y], [x + 0.8 * z, y - 16 * z], [x - 0.8 * z, y - 16 * z]], lit ? 'rgba(230,246,255,0.95)' : C(ICE)); }
      const top = cy - 18 * z;
      poly([[cx - 14 * z, top + 2 * z], [cx, top + 9 * z], [cx + 14 * z, top + 2 * z], [cx, top - 5 * z]], C(ICE_L));
      for (const [dx, h] of [[0, 18], [-7, 11], [7, 11]]) { poly([[cx + (dx - 2.4) * z, top + (dx ? 3 : 0) * z], [cx + (dx + 2.4) * z, top + (dx ? 3 : 0) * z], [cx + dx * z, top - h * z]], lit ? '#e6f6ff' : C(ICE)); poly([[cx + dx * z, top + (dx ? 3 : 0) * z], [cx + (dx + 2.4) * z, top + (dx ? 3 : 0) * z], [cx + dx * z, top - h * z]], C(ICE_D)); }
      flake(cx, top - 21 * z, 2.4 * z, lit ? '#ffffff' : C('#ffffff'), Math.max(0.6, 0.7 * z));
      if (lit) { glowAt(cx, top - 21 * z, 24 * z, z, 'blue'); glowAt(cx, cy - 8 * z, 26 * z, z, 'blue'); }
    }, true],
    ['Schneeflocken-Brunnen ✦', (cx, cy, z) => {
      const lit = sdLit();
      snow(cx, cy, 22, z);
      ellipse(cx, cy + 1 * z, 19 * z, 9 * z, C('#b9cbd8')); ellipse(cx, cy, 17 * z, 8 * z, C('#e6f1f8')); ellipse(cx, cy - 0.5 * z, 14.5 * z, 6.6 * z, C('#bfe6f7'));
      for (const [dx, dy] of [[-8, -1], [6, 2], [9, -2], [-3, 3]]) { poly([[cx + dx * z, cy + dy * z], [cx + (dx + 2.6) * z, cy + (dy - 0.6) * z], [cx + (dx + 1.6) * z, cy + (dy + 1) * z]], C('#ffffff')); }   // Eisschollen
      poly([[cx - 2.2 * z, cy - 1 * z], [cx + 2.2 * z, cy - 1 * z], [cx + 1.4 * z, cy - 14 * z], [cx - 1.4 * z, cy - 14 * z]], C(ICE_L));
      for (const s of [-1, 1]) { g.strokeStyle = 'rgba(230,246,255,0.95)'; g.lineWidth = Math.max(0.6, 1.4 * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + s * 1.6 * z, cy - 13 * z); g.quadraticCurveTo(cx + s * 7 * z, cy - 17 * z, cx + s * 9 * z, cy - 4 * z); g.stroke(); }   // gefrorene Strahlen
      const F = [cx, cy - 21 * z];
      flake(F[0], F[1], 6 * z, lit ? '#ffffff' : C('#9fd3ee'), Math.max(0.8, 1.4 * z));
      circle(F[0], F[1], 1.4 * z, lit ? '#ffffff' : C(ICE_L));
      if (lit) glowAt(F[0], F[1], 28 * z, z, 'blue');
    }, true],
  ];
})();
'ok';
