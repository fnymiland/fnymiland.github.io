'use strict';
// ---------------------------------------------------------------------------
// Sternenbasar-Sammlungen (Block 161c, Nutzer 17.10.2026: „mehr davon, viel mehr – riesiger Itemshop für ganz viele Tage … angelehnt an
// Disney und Animal Crossing, Fanny liebt Frozen, Rapunzel und die Prinzessinnen“): ❄️ Eiszauber, 🏰 Turm & Himmelslaternen, 👑 Prinzessinnen
// & Märchen, 🍃 Inselleben – eigene Motive nach den (freien) Märchen, keine Disney-Figuren. Bilder aus den Entwürfen (tools/waren-*.js,
// im Browser abgenommen), Form wie SD_ART (cx, cy, z, now, x, y, t; Licht über sdLit, Schein über glowQuad). Preise: Nutzer „wirklich ein
// Spielziel“ – normal 80–200 ✨, selten 350–450 ✨ (Seltenes der Woche, basarOffers)
// ---------------------------------------------------------------------------
const SD_WAREN = {};
// ❄️ Sammlung Eiszauber (Block 161c, Nutzer 17.10.2026: „Fanny liebt …“ – eigene Motive nach der Schneekönigin, keine Disney-Figuren).
// Form wie SD_ART (cx, cy, z, now, x, y, t); Helfer aus sternstaub.js. Bogen: tools/waren-entwurf.js
SD_WAREN.EISZAUBER = (() => {
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
// 🏰 Turm & Himmelslaternen und 👑 Prinzessinnen & Märchen (Block 161c): eigene Motive nach Grimms Märchen (Rapunzel, Aschenputtel,
// Dornröschen, Schneewittchen, Froschkönig) – keine Disney-Figuren. Form wie SD_ART; Bogen: tools/waren-entwurf.js
(() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', PINK = '#ff9ec0', ROSE = '#e8546f', LILA = '#b48cff';
  const glowAt = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const rose = (x, y, r, col) => { circle(x, y, r, C(col)); circle(x - r * 0.2, y - r * 0.2, r * 0.55, C(shade(col, 0.18))); };
  const heart = (x, y, r, col) => { g.beginPath(); g.moveTo(x, y + r * 0.9); g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35); g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); g.fillStyle = col; g.fill(); };
  const skyLantern = (x, y, w, z, lit) => { poly([[x - w * z, y], [x + w * z, y], [x + w * 0.8 * z, y - w * 2 * z], [x - w * 0.8 * z, y - w * 2 * z]], lit ? '#ffcf6a' : C('#ffb347')); ellipse(x, y - w * 2 * z, w * 0.8 * z, w * 0.3 * z, lit ? '#ffe39a' : C('#ffc76a')); if (lit) glowAt(x, y - w * z, w * 7 * z, z); };

  SD_WAREN.TURM = [
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
    // Auffüllung (Nutzer 18.10.2026: „ja“)
    ['Leseecke', (cx, cy, z) => {
      const lit = sdLit();
      sdShadow(cx, cy, 9, z);
      poly([[cx - 6 * z, cy], [cx + 2 * z, cy], [cx + 2 * z, cy - 6 * z], [cx - 6 * z, cy - 6 * z]], C('#8a62c4'));            // Sessel
      poly([[cx - 6 * z, cy - 6 * z], [cx + 2 * z, cy - 6 * z], [cx + 2 * z, cy - 7.4 * z], [cx - 6 * z, cy - 7.4 * z]], C('#a986e0'));
      poly([[cx - 6 * z, cy - 7 * z], [cx - 4 * z, cy - 7 * z], [cx - 4 * z, cy - 15 * z], [cx - 6 * z, cy - 14 * z]], C('#7a54b4'));
      for (const s of [-1, 1]) ellipse(cx + (s < 0 ? -6.4 : 2.4) * z, cy - 8 * z, 1.4 * z, 2.2 * z, C('#9b74d4'));
      ellipse(cx - 2 * z, cy - 8 * z, 2.2 * z, 1.4 * z, C('#ffd23f'));                                                // Kissen
      for (const [k, c] of [[0, '#d9534a'], [1, '#58b3e8'], [2, '#58b36a'], [3, '#e9a23b']]) poly([[cx + 4 * z, cy - k * 1.6 * z], [cx + 9 * z, cy - k * 1.6 * z], [cx + 9 * z, cy - (k + 1) * 1.6 * z + 0.3 * z], [cx + 4 * z, cy - (k + 1) * 1.6 * z + 0.3 * z]], C(c));   // Bücherstapel
      sdLine('#6b4f3a', 0.8, z, [[cx + 7 * z, cy - 6.4 * z], [cx + 7 * z, cy - 14 * z]]);
      poly([[cx + 4.6 * z, cy - 13 * z], [cx + 9.4 * z, cy - 13 * z], [cx + 8.4 * z, cy - 17 * z], [cx + 5.6 * z, cy - 17 * z]], lit ? '#ffe39a' : C('#fff0c2'));   // Leselampe
      if (lit) glowAt(cx + 7 * z, cy - 13 * z, 18 * z, z);
    }],
    ['Kräutergarten', (cx, cy, z) => {
      sdShadow(cx, cy, 10, z);
      poly([[cx - 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx + 10 * z, cy - 2 * z], [cx, cy - 7 * z]], C('#6b4f3a'));
      poly([[cx - 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx, cy + 5 * z], [cx - 10 * z, cy]], C('#8a5a3c')); poly([[cx + 10 * z, cy - 2 * z], [cx, cy + 3 * z], [cx, cy + 5 * z], [cx + 10 * z, cy]], C('#7a4f30'));
      for (const [dx, dy, c, r] of [[-6, -2, '#5fa84a', 2.2], [-2, -4, '#7fbf5a', 2], [2, -2, '#4f9e3a', 2.4], [6, -3, '#8fcf6a', 1.8], [0, 0, '#6fb04a', 2], [-3, 1, '#b48cff', 1.2], [4, 0, '#ffffff', 1]])
        { for (let k = 0; k < 3; k++) circle(cx + (dx + (k - 1) * 0.8) * z, cy + (dy - 1.5 - (k & 1)) * z, r * 0.6 * z, C(c)); }
      sdLine('#a8794e', 0.6, z, [[cx + 8 * z, cy - 1 * z], [cx + 8 * z, cy - 7 * z]]); poly([[cx + 6 * z, cy - 7 * z], [cx + 10 * z, cy - 7 * z], [cx + 10 * z, cy - 9.4 * z], [cx + 6 * z, cy - 9.4 * z]], C('#f3e2c2'));   // Schildchen
    }],
    ['Blumenkranz-Bank', (cx, cy, z) => {
      sdShadow(cx, cy, 9, z);
      poly([[cx - 8 * z, cy - 4 * z], [cx + 8 * z, cy - 4 * z], [cx + 8 * z, cy - 5.6 * z], [cx - 8 * z, cy - 5.6 * z]], C('#c69a5e'));
      for (const dx of [-7, 7]) sdLine('#8a5a3c', 1, z, [[cx + dx * z, cy - 4 * z], [cx + dx * z, cy]]);
      poly([[cx - 8 * z, cy - 6 * z], [cx + 8 * z, cy - 6 * z], [cx + 8 * z, cy - 12 * z], [cx - 8 * z, cy - 12 * z]], C('#d8b27a'));
      for (let k = 0; k <= 12; k++) { const x = cx + (-8 + k * 16 / 12) * z, y = cy - (12.6 - Math.sin(k / 12 * Math.PI) * 1.4) * z; circle(x, y, 1.2 * z, C('#6fb04a')); if (k % 2 === 0) rose(x, y - 0.4 * z, 1 * z, [PINK, '#ffffff', LILA, '#ffd23f'][k / 2 % 4]); }
    }],
    ['Sonnenblumen', (cx, cy, z) => {
      sdShadow(cx, cy, 7, z);
      for (const [dx, h] of [[-4, 16], [0, 20], [4, 14]]) {
        sdLine('#5f9e3a', 1, z, [[cx + dx * z, cy], [cx + dx * z, cy - h * z]]);
        ellipse(cx + (dx + 1.6) * z, cy - h * 0.5 * z, 2 * z, 1 * z, C('#6fb04a'));
        const p = [cx + dx * z, cy - h * z];
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ellipse(p[0] + Math.cos(a) * 2.6 * z, p[1] + Math.sin(a) * 2.2 * z, 1.2 * z, 1.2 * z, C('#ffd23f')); }
        circle(p[0], p[1], 1.7 * z, C('#7a4a1e'));
      }
    }],
    ['Wandgemälde', (cx, cy, z) => {
      sdShadow(cx, cy, 9, z);
      poly([[cx - 9 * z, cy], [cx + 9 * z, cy], [cx + 9 * z, cy - 14 * z], [cx - 9 * z, cy - 14 * z]], C('#e9dcc6'));
      poly([[cx - 9.6 * z, cy - 14 * z], [cx + 9.6 * z, cy - 14 * z], [cx + 9.6 * z, cy - 15.6 * z], [cx - 9.6 * z, cy - 15.6 * z]], C('#cdbb9c'));
      poly([[cx - 8 * z, cy - 1 * z], [cx + 8 * z, cy - 1 * z], [cx + 8 * z, cy - 13 * z], [cx - 8 * z, cy - 13 * z]], C('#bfe0ff'));      // gemalter Himmel
      circle(cx + 3 * z, cy - 9 * z, 3 * z, C('#ffd23f'));
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; sdLine('#ffd23f', 0.6, z, [[cx + (3 + Math.cos(a) * 3.8) * z, cy - (9 + Math.sin(a) * 3.8) * z], [cx + (3 + Math.cos(a) * 5) * z, cy - (9 + Math.sin(a) * 5) * z]]); }
      poly([[cx - 8 * z, cy - 1 * z], [cx - 4 * z, cy - 6 * z], [cx, cy - 3 * z], [cx + 4 * z, cy - 6.5 * z], [cx + 8 * z, cy - 2 * z], [cx + 8 * z, cy - 1 * z]], C('#6fb04a'));
      for (const [dx, c] of [[-6, PINK], [-3, '#ffffff'], [1, LILA], [5, ROSE]]) circle(cx + dx * z, cy - 2 * z, 0.8 * z, C(c));
      for (const dx of [-6, -1, 4]) skyLantern(cx + dx * z, cy - 11 * z, 0.7, z, false);
    }],
    ['Glühwürmchen-Glas', (cx, cy, z, now) => {
      const lit = sdLit();
      sdShadow(cx, cy, 5, z);
      poly([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx + 3.6 * z, cy - 5 * z], [cx - 3.6 * z, cy - 5 * z]], C('#8a5a3c')); ellipse(cx, cy - 5 * z, 3.6 * z, 1.4 * z, C('#a8794e'));   // Baumstumpf
      poly([[cx - 2.6 * z, cy - 5.4 * z], [cx + 2.6 * z, cy - 5.4 * z], [cx + 2.8 * z, cy - 12 * z], [cx - 2.8 * z, cy - 12 * z]], lit ? 'rgba(255,248,200,0.55)' : 'rgba(220,240,250,0.65)');
      poly([[cx - 2 * z, cy - 12 * z], [cx + 2 * z, cy - 12 * z], [cx + 2 * z, cy - 13.4 * z], [cx - 2 * z, cy - 13.4 * z]], C('#c9962a'));
      for (const [dx, dy] of [[-1, -7], [1, -9], [0, -10.6], [1.4, -6.6], [-1.4, -9.6]]) { circle(cx + dx * z, cy + dy * z, 0.55 * z, lit ? '#fff7a0' : C('#d8e86a')); if (lit) glowAt(cx + dx * z, cy + dy * z, 5 * z, z); }
    }],
    ['Sonnenpavillon ✦', (cx, cy, z) => {                                   // ganzes Feld, selten
      const lit = sdLit();
      sdShadow(cx, cy, 18, z);
      ellipse(cx, cy, 16 * z, 7.6 * z, C('#f3ecdf')); ellipse(cx, cy - 1.4 * z, 14 * z, 6.6 * z, C('#fff8ee'));
      for (let k = 0; k < 6; k++) { const a = Math.PI * 0.05 + k / 5 * Math.PI * 0.9, x = cx + Math.cos(a) * 13 * z, y = cy - 1.4 * z + Math.sin(a) * 6 * z;
        poly([[x - 0.8 * z, y], [x + 0.8 * z, y], [x + 0.8 * z, y - 15 * z], [x - 0.8 * z, y - 15 * z]], C('#e9d8b4')); sdLine('#6fb04a', 0.8, z, [[x, y - 2 * z], [x, y - 13 * z]], [x + 1.6 * z, y - 7 * z]); }
      const top = cy - 16 * z;
      poly([[cx - 16 * z, top + 2 * z], [cx, top + 8 * z], [cx + 16 * z, top + 2 * z], [cx, top - 9 * z]], C('#e9a23b')); poly([[cx, top + 8 * z], [cx + 16 * z, top + 2 * z], [cx, top - 9 * z]], C('#d4892a'));
      for (let k = 0; k < 5; k++) skyLantern(cx + (-10 + k * 5) * z, top + 6 * z + Math.sin(k / 4 * Math.PI) * 2 * z, 0.9, z, lit);
      const S = [cx, top - 14 * z];
      circle(S[0], S[1], 3.4 * z, C(GOLD)); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; poly([[S[0] + Math.cos(a - 0.12) * 3.6 * z, S[1] + Math.sin(a - 0.12) * 3.6 * z], [S[0] + Math.cos(a) * 6 * z, S[1] + Math.sin(a) * 6 * z], [S[0] + Math.cos(a + 0.12) * 3.6 * z, S[1] + Math.sin(a + 0.12) * 3.6 * z]], C(GOLD)); }
      if (lit) glowAt(S[0], S[1], 26 * z, z);
    }, true],
  ];

  SD_WAREN.MAERCHEN = [
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
// 🍃 Sammlung Inselleben (Block 161c, Animal-Crossing-Gefühl – eigene Motive). Form wie SD_ART; Bogen: tools/waren-entwurf.js
SD_WAREN.INSEL = (() => {
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
// Kennung, ✨-Preis, selten, Schönheit, Taler je Stück (Bauen), Material – je Bildtitel aus den Entwürfen
const SD_WAREN_META = {
  'Schneemann': { id: 'sd_schneemann', price: 110, rare: false, beauty: 5, cost: 120 },
  'Eiskristall-Laterne': { id: 'sd_eislaterne', price: 140, rare: false, beauty: 6, cost: 200 },
  'Verschneite Tanne': { id: 'sd_schneetanne', price: 110, rare: false, beauty: 5, cost: 120 },
  'Schlitten mit Geschenken': { id: 'sd_schlitten', price: 130, rare: false, beauty: 6, cost: 150 },
  'Rentier': { id: 'sd_rentier', price: 150, rare: false, beauty: 6, cost: 150 },
  'Iglu': { id: 'sd_iglu', price: 200, rare: false, beauty: 14, cost: 600 },
  'Eisblumen': { id: 'sd_eisblumen', price: 120, rare: false, beauty: 4, cost: 80 },
  'Schneeflocken-Bogen': { id: 'sd_flockenbogen', price: 150, rare: false, beauty: 7, cost: 200 },
  'Eisbank': { id: 'sd_eisbank', price: 90, rare: false, beauty: 4, cost: 80 },
  'Eisbär': { id: 'sd_eisbaer', price: 150, rare: false, beauty: 6, cost: 150 },
  'Pinguine': { id: 'sd_pinguine', price: 140, rare: false, beauty: 6, cost: 150 },
  'Schneekugel': { id: 'sd_schneekugel', price: 120, rare: false, beauty: 5, cost: 120 },
  'Schlittschuh-Teich': { id: 'sd_eisteich', price: 200, rare: false, beauty: 14, cost: 600 },
  'Eispalast-Pavillon ✦': { id: 'sd_eispalast', price: 450, rare: true, beauty: 28, cost: 2500, mat: {'kristall': 4} },
  'Schneeflocken-Brunnen ✦': { id: 'sd_flockenbrunnen', price: 400, rare: true, beauty: 24, cost: 1500, mat: {'quader': 6} },
  'Leseecke': { id: 'sd_leseecke', price: 140, rare: false, beauty: 5, cost: 150 }, 'Kräutergarten': { id: 'sd_kraeuter', price: 110, rare: false, beauty: 5, cost: 120 },
  'Blumenkranz-Bank': { id: 'sd_kranzbank', price: 120, rare: false, beauty: 5, cost: 120 }, 'Sonnenblumen': { id: 'sd_sonnenblumen', price: 90, rare: false, beauty: 4, cost: 60 },
  'Wandgemälde': { id: 'sd_wandbild', price: 100, rare: false, beauty: 5, cost: 100 }, 'Glühwürmchen-Glas': { id: 'sd_gluehglas', price: 130, rare: false, beauty: 5, cost: 120 },
  'Sonnenpavillon ✦': { id: 'sd_sonnenpavillon', price: 400, rare: true, beauty: 26, cost: 2500, mat: {'bretter': 8} },
  'Turm mit Zopf ✦': { id: 'sd_zopfturm', price: 450, rare: true, beauty: 26, cost: 2500, mat: {'quader': 8} },
  'Himmelslaternen': { id: 'sd_himmelslaternen', price: 150, rare: false, beauty: 6, cost: 150 },
  'Blumenranken-Tor': { id: 'sd_rankentor', price: 130, rare: false, beauty: 6, cost: 150 },
  'Malstaffelei': { id: 'sd_staffelei', price: 90, rare: false, beauty: 4, cost: 80 },
  'Laternenboot': { id: 'sd_laternenboot', price: 150, rare: false, beauty: 6, cost: 200 },
  'Blumenschaukel': { id: 'sd_blumenschaukel', price: 130, rare: false, beauty: 6, cost: 150 },
  'Kürbiskutsche ✦': { id: 'sd_kuerbiskutsche', price: 450, rare: true, beauty: 26, cost: 2500 },
  'Glasschuh auf Kissen': { id: 'sd_glasschuh', price: 140, rare: false, beauty: 5, cost: 150 },
  'Froschkönig-Brunnen': { id: 'sd_froschbrunnen', price: 170, rare: false, beauty: 8, cost: 300, mat: {'quader': 2} },
  'Rosenhecke mit Spinnrad': { id: 'sd_spinnrad', price: 150, rare: false, beauty: 7, cost: 200 },
  'Apfelbaum mit Bank': { id: 'sd_apfelbaum', price: 120, rare: false, beauty: 6, cost: 150 },
  'Zwergenhäuschen ✦': { id: 'sd_zwergenhaus', price: 400, rare: true, beauty: 24, cost: 2000, mat: {'bretter': 6} },
  'Zauberspiegel': { id: 'sd_zauberspiegel', price: 150, rare: false, beauty: 6, cost: 200 },
  'Einhorn ✦': { id: 'sd_einhorn', price: 400, rare: true, beauty: 12, cost: 500 },
  'Herzchen-Laube': { id: 'sd_herzlaube', price: 130, rare: false, beauty: 6, cost: 150 },
  'Krönchen-Laterne': { id: 'sd_kroenchenlaterne', price: 120, rare: false, beauty: 5, cost: 150 },
  'Tanzpavillon ✦': { id: 'sd_tanzpavillon', price: 450, rare: true, beauty: 28, cost: 2500, mat: {'bretter': 8} },
  'Lagerfeuer': { id: 'sd_lagerfeuer', price: 110, rare: false, beauty: 5, cost: 100 },
  'Hängematte': { id: 'sd_haengematte', price: 130, rare: false, beauty: 6, cost: 150 },
  'Picknickdecke': { id: 'sd_picknick', price: 90, rare: false, beauty: 4, cost: 80 },
  'Briefkasten': { id: 'sd_briefkasten', price: 80, rare: false, beauty: 3, cost: 60 },
  'Fossil ✦': { id: 'sd_fossil', price: 350, rare: true, beauty: 12, cost: 500, mat: {'quader': 4} },
  'Strandkorb': { id: 'sd_strandkorb', price: 110, rare: false, beauty: 5, cost: 120 },
  'Vogelscheuche': { id: 'sd_vogelscheuche', price: 90, rare: false, beauty: 4, cost: 80 },
  'Wäscheleine': { id: 'sd_waescheleine', price: 80, rare: false, beauty: 3, cost: 60 },
  'Glockenbaum': { id: 'sd_glockenbaum', price: 150, rare: false, beauty: 6, cost: 150 },
  'Teleskop': { id: 'sd_teleskop', price: 120, rare: false, beauty: 4, cost: 150, mat: {'metall': 1} },
  'Kanu': { id: 'sd_kanu', price: 100, rare: false, beauty: 4, cost: 100 },
  'Gartenwichtel': { id: 'sd_wichtel', price: 90, rare: false, beauty: 3, cost: 60 },
  'Hühnerhaus ✦': { id: 'sd_huehnerhaus', price: 350, rare: true, beauty: 20, cost: 1200, mat: {'bretter': 6} },
};
for (const [list, smlg] of [[SD_WAREN.EISZAUBER, 'Eiszauber'], [SD_WAREN.TURM, 'Turm & Himmelslaternen'], [SD_WAREN.MAERCHEN, 'Prinzessinnen & Märchen'], [SD_WAREN.INSEL, 'Inselleben']])
  for (const [label, fn, tile] of list) {
    const m = SD_WAREN_META[label], name = label.replace(' ✦', '');
    ITEMS[m.id] = { cat: 'deko', name, sdShop: true, cost: m.cost, ...(m.mat ? { mat: m.mat } : {}), beauty: m.beauty, ...(tile ? { needs: 'grass' } : { small: true }), sammlung: smlg, desc: `Aus der Sammlung „${smlg}“ im Sternenbasar.` };
    SD_ART[m.id] = fn;
    SD_SHOP.push({ id: m.id, price: m.price, ...(m.rare ? { rare: true } : {}) });
    if (!ITEM_TIPS[m.id]) ITEM_TIPS[m.id] = tile ? 'Aus dem Sternenbasar ✨ – braucht ein ganzes Feld Wiese.' : 'Aus dem Sternenbasar ✨ – kleine Deko für eine Ecke, bis zu 4 pro Feld.';
  }
