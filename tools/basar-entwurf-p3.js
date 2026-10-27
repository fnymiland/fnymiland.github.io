// Entwürfe Paket 3 (Basar-Durchsicht 28.10.2026): Zwergenhäuschen „wie einen Pilz“, Sonnenuhr „relativ klein und nutzlos“.
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p3.js')).text()); dann basarBlatt(Object.keys(ENTW_P3), { art: ENTW_P3, … })
(() => {
  const dots = (pts, x, y, z) => { for (const [dx, dy, r] of pts) { ellipse(x + dx * z, y + dy * z, r * z, r * 0.7 * z, C('#ffffff')); } };
  // Pilzkappe: Halbkugel als Ellipse oben, Unterseite (Lamellen) als flache Ellipse, Licht oben links
  const cap = (x, y, rx, ry, col, z) => {
    ellipse(x, y + 0.6 * z, rx, ry * 0.28, C('#f2e2c4'));                                              // Unterseite
    for (let k = -4; k <= 4; k++) sdLine('#dcc7a0', 0.2, z, [[x + k * rx / 5, y + 0.5 * z], [x + k * rx / 6.5, y + ry * 0.2]]);
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(x, y + ry * 0.35, x - rx, y); g.closePath(); g.fillStyle = C(col); g.fill();
    g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.55, rx * 0.4, ry * 0.25, -0.3, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fill();
  };
  // dicker Stiel als Haus: unten breiter, Tür rund, Fenster rund mit Kreuz
  const stem = (x, y, w, h, z, lit, col = '#fbf1de') => {
    poly([[x - w * z, y], [x + w * z, y], [x + w * 0.82 * z, y - h * z], [x - w * 0.82 * z, y - h * z]], C(col));
    poly([[x + w * 0.3 * z, y], [x + w * z, y], [x + w * 0.82 * z, y - h * z], [x + w * 0.25 * z, y - h * z]], 'rgba(160,120,80,0.14)');
    ellipse(x, y, w * z, w * 0.32 * z, C(col));
    g.beginPath(); g.moveTo(x - 1.8 * z, y + 0.4 * z); g.lineTo(x - 1.8 * z, y - 4 * z); g.arc(x, y - 4 * z, 1.8 * z, Math.PI, 0); g.lineTo(x + 1.8 * z, y + 0.4 * z); g.closePath(); g.fillStyle = C('#8a5a3c'); g.fill();
    circle(x + 1 * z, y - 2.4 * z, 0.3 * z, C('#f5c84b'));
    for (const dx of [-w * 0.55, w * 0.55]) { const wx = x + dx * z, wy = y - h * 0.62 * z; circle(wx, wy, 1.5 * z, C('#8a5a3c')); circle(wx, wy, 1.15 * z, lit ? '#ffd27a' : C('#a8d8ff'));
      sdLine('#8a5a3c', 0.25, z, [[wx - 1.1 * z, wy], [wx + 1.1 * z, wy]]); sdLine('#8a5a3c', 0.25, z, [[wx, wy - 1.1 * z], [wx, wy + 1.1 * z]]); }
  };
  const grassTufts = (cx, cy, z, pts) => { for (const [dx, dy] of pts) { for (const a of [-0.5, 0, 0.5]) sdLine('#4f9e3a', 0.4, z, [[cx + dx * z, cy + dy * z], [cx + (dx + a * 1.4) * z, cy + (dy - 2.2) * z]]); } };
  const stones = (cx, cy, z, pts) => { for (const [dx, dy, r] of pts) { ellipse(cx + dx * z, cy + dy * z, r * z, r * 0.55 * z, C('#c9c2b4')); ellipse(cx + (dx - 0.2) * z, cy + (dy - 0.2) * z, r * 0.7 * z, r * 0.35 * z, C('#e2ddd2')); } };
  const smallShroom = (x, y, s, z, col) => { poly([[x - 0.8 * s * z, y], [x + 0.8 * s * z, y], [x + 0.6 * s * z, y - 3 * s * z], [x - 0.6 * s * z, y - 3 * s * z]], C('#fbf1de')); cap(x, y - 3 * s * z, 2.4 * s * z, 1.9 * s * z, col, z); };
  // Sonnenuhr: Schatten nach der Spielzeit (Stunde h), Sonne von links oben; nachts kein Schatten, ein Mond auf dem Zeiger
  const sundial = (cx, cy, z, h, big) => {
    const S = big ? 1.6 : 1.25, top = cy - 8 * S * z, night = h < 6 || h > 20;
    sdShadow(cx, cy, 7 * S, z);
    const ring = big ? Array.from({ length: 12 }, (_, k) => { const a = k / 12 * Math.PI * 2; return [cx + Math.cos(a) * 10 * z, cy + 1 * z + Math.sin(a) * 4.6 * z, k]; }) : [];
    const flower = ([fx, fy, k]) => { sdLine('#4f9e3a', 0.4, z, [[fx, fy], [fx, fy - 2.4 * z]]); ellipse(fx - 0.8 * z, fy - 1 * z, 0.8 * z, 0.4 * z, C('#5aa84f')); circle(fx, fy - 2.8 * z, 1.1 * z, C(['#ff8fb1', '#ffd23f', '#ffffff', '#c49bff'][k % 4])); circle(fx, fy - 2.8 * z, 0.4 * z, C('#f5c84b')); };
    ring.filter(p => p[1] < cy + 1 * z).forEach(flower);
    poly([[cx - 2.6 * S * z, cy], [cx + 2.6 * S * z, cy], [cx + 2 * S * z, top + 1 * z], [cx - 2 * S * z, top + 1 * z]], C('#e5dccb'));
    poly([[cx + 0.5 * S * z, cy], [cx + 2.6 * S * z, cy], [cx + 2 * S * z, top + 1 * z], [cx + 0.4 * S * z, top + 1 * z]], C('#d3c8b4'));
    ellipse(cx, top + 1 * z, 6.4 * S * z, 3.2 * S * z, C('#cfc4b0')); ellipse(cx, top, 6 * S * z, 2.9 * S * z, C('#f6efe2'));
    for (let k = 0; k < 12; k++) { const a = Math.PI + k / 11 * Math.PI; const r1 = 4.6 * S, r2 = 5.4 * S;
      sdLine('#8a7a62', k % 3 ? 0.25 : 0.45, z, [[cx + Math.cos(a) * r1 * z, top + Math.sin(a) * r1 * 0.48 * z], [cx + Math.cos(a) * r2 * z, top + Math.sin(a) * r2 * 0.48 * z]]); }
    if (!night) {                                                               // Schatten: morgens rechts, mittags hinten, abends links
      const th = Math.PI * (h - 6) / 14, L = 4.4 * S, ex = cx + Math.cos(th) * L * z, ey = top - Math.sin(th) * L * 0.48 * z;
      const n = (w) => [-Math.sin(th) * w * z, -Math.cos(th) * w * 0.48 * z];                 // quer zum Schatten, in der Ebene der Scheibe
      const [ax, ay] = n(1.6), [bx, by] = n(0.7);
      poly([[cx + ax, top + ay], [ex + bx, ey + by], [ex - bx, ey - by], [cx - ax, top - ay]], 'rgba(70,50,35,0.42)');
    }
    poly([[cx - 0.35 * z, top + 0.1 * z], [cx + 0.35 * z, top + 0.1 * z], [cx, top - 3.6 * S * z]], C('#b8862a'));          // Zeiger: schmales Dreieck
    poly([[cx, top - 3.6 * S * z], [cx + 0.35 * z, top + 0.1 * z], [cx + 2.2 * S * z, top - 0.1 * z]], C('#e0b04a'));
    if (!night) circle(cx - 6 * S * z, top - 7 * S * z, 1.2 * z, 'rgba(255,215,90,0.9)');                                  // kleine Sonne (nur im Entwurf)
    ring.filter(p => p[1] >= cy + 1 * z).forEach(flower);
  };
  window.ENTW_P3 = {
    'Pilzhaus A: Fliegenpilz': (cx, cy, z) => {
      sdShadow(cx, cy, 15, z);
      stem(cx, cy, 7, 12, z, false);
      cap(cx, cy - 12 * z, 15 * z, 11 * z, '#d9443a', z);
      dots([[-8, -16, 2], [-2, -20, 2.4], [5, -17, 2], [9, -13, 1.5], [-11, -13, 1.4], [1, -14, 1.6]], cx, cy, z);
      stones(cx, cy, z, [[-3, 3, 1.2], [0, 4, 1.1], [3, 5, 1.2]]);
      grassTufts(cx, cy, z, [[-9, 1], [9, 1.5]]);
    },
    'Pilzhaus B: Steinpilz mit Schornstein': (cx, cy, z) => {
      sdShadow(cx, cy, 15, z);
      stem(cx, cy, 7.5, 12, z, false, '#f3e2c2');
      cap(cx, cy - 12 * z, 15 * z, 10 * z, '#9a5a34', z);
      poly([[cx + 6 * z, cy - 19 * z], [cx + 8.4 * z, cy - 19.6 * z], [cx + 8.4 * z, cy - 25 * z], [cx + 6 * z, cy - 24.4 * z]], C('#b4634a'));
      for (const [d, r] of [[0, 1.2], [1.6, 1.6], [3.4, 2]]) circle(cx + (7.3 + d * 0.6) * z, cy - (26 + d * 1.6) * z, r * z, 'rgba(255,255,255,0.75)');
      stones(cx, cy, z, [[-3, 3, 1.2], [0, 4, 1.1], [3, 5, 1.2]]);
      grassTufts(cx, cy, z, [[-9, 1], [9, 1.5]]);
    },
    'Pilzhaus C: Fliegenpilz mit Kinderpilzen': (cx, cy, z) => {
      sdShadow(cx, cy, 16, z);
      smallShroom(cx - 11 * z, cy - 1 * z, 1, z, '#e8604f');
      stem(cx, cy, 7, 12, z, false);
      cap(cx, cy - 12 * z, 15 * z, 11 * z, '#d9443a', z);
      dots([[-8, -16, 2], [-2, -20, 2.4], [5, -17, 2], [9, -13, 1.5], [-11, -13, 1.4], [1, -14, 1.6]], cx, cy, z);
      smallShroom(cx + 11 * z, cy + 2 * z, 0.8, z, '#d9443a');
      smallShroom(cx + 13.5 * z, cy - 0.5 * z, 0.6, z, '#e8604f');
      stones(cx, cy, z, [[-3, 3, 1.2], [0, 4, 1.1], [3, 5, 1.2]]);
    },
    'Sonnenuhr A: größer, Schatten mit der Uhrzeit (9 Uhr)': (cx, cy, z) => sundial(cx, cy, z, 9, false),
    'Sonnenuhr A um 16 Uhr': (cx, cy, z) => sundial(cx, cy, z, 16, false),
    'Sonnenuhr B: größer, mit Blumenkreis (11 Uhr)': (cx, cy, z) => sundial(cx, cy, z, 11, true),
  };
})();
