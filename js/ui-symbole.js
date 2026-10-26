'use strict';
// ---------------------------------------------------------------------------
// Weitere Symbole der Oberfläche (Aussehen 5b, Nutzer 25.10.2026: „bis alles im selben Stil ist“): Rohstoffe und die häufigen
// Emojis in Texten, gezeichnet mit den Grundformen des Spiels (Licht von links, rechte Seite dunkler, Schatten am Boden).
// Je Symbol ein 64×64-Feld, Boden bei y ≈ 56; ui-look.js schneidet den leeren Rand ab. Zuordnung Emoji → Symbol: WI_TEXT (ui-look.js)
// ---------------------------------------------------------------------------
const uiPath = (pts, col) => poly(pts, col);
const uiDisc = (x, y, r, col) => circle(x, y, Math.max(0.1, r), col);
function uiLog(cx, cy, r, len, bark = '#8a5a34') {          // Stamm, Schnittfläche nach vorn links
  uiPath([[cx, cy - r], [cx + len, cy - r - len * 0.5], [cx + len, cy + r - len * 0.5], [cx, cy + r]], bark);
  uiPath([[cx, cy - r], [cx + len, cy - r - len * 0.5], [cx + len, cy - r * 0.35 - len * 0.5], [cx, cy - r * 0.35]], shade(bark, 0.12));
  ellipse(cx, cy, r * 0.82, r, '#e3b77a');
  g.strokeStyle = '#c99a5e'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, r * 0.45, r * 0.55, 0, 0, Math.PI * 2); g.stroke();
}
function uiRock(cx, cy, s, col) {                             // Felsbrocken mit hellerer Oberseite
  uiPath([[cx - 16 * s, cy], [cx - 13 * s, cy - 11 * s], [cx - 3 * s, cy - 17 * s], [cx + 10 * s, cy - 14 * s], [cx + 16 * s, cy - 4 * s], [cx + 12 * s, cy + 3 * s], [cx - 8 * s, cy + 4 * s]], col);
  uiPath([[cx + 2 * s, cy - 9 * s], [cx + 10 * s, cy - 14 * s], [cx + 16 * s, cy - 4 * s], [cx + 12 * s, cy + 3 * s], [cx + 1 * s, cy + 3 * s]], shade(col, LIGHT.side));
  uiPath([[cx - 13 * s, cy - 11 * s], [cx - 3 * s, cy - 17 * s], [cx + 10 * s, cy - 14 * s], [cx + 2 * s, cy - 9 * s], [cx - 9 * s, cy - 7 * s]], shade(col, 0.16));
}
function uiCup(cx, cy, col, drink) {                          // Tasse auf Untertasse
  ellipse(cx, cy + 1, 15, 6, shade(col, -0.1)); ellipse(cx, cy, 15, 6, '#f4efe6');
  g.strokeStyle = col; g.lineWidth = 3.4; g.beginPath(); g.arc(cx + 10, cy - 9, 4.5, -Math.PI / 2, Math.PI / 2); g.stroke();
  cyl(cx, cy - 2, 10, 4.5, 14, col);
  ellipse(cx, cy - 16, 8.5, 3.6, drink);
}
function uiStar4(cx, cy, r, col) {                            // Funkel: vierzackiger Stern
  uiPath([[cx, cy - r], [cx + r * 0.26, cy - r * 0.26], [cx + r, cy], [cx + r * 0.26, cy + r * 0.26], [cx, cy + r], [cx - r * 0.26, cy + r * 0.26], [cx - r, cy], [cx - r * 0.26, cy - r * 0.26]], col);
}
function uiStar5(cx, cy, R, col, tilt = 0) {                // fünfzackiger Stern (Sternstaub)
  uiPath(Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + tilt + i * Math.PI / 5, q = i % 2 ? R * 0.46 : R; return [cx + Math.cos(a) * q, cy + Math.sin(a) * q]; }), col);
}
function uiGoldStar(cx, cy, R, tilt = 0) { uiStar5(cx, cy + R * 0.13, R, '#c98f1e', tilt); uiStar5(cx, cy, R, '#f2bd3a', tilt); uiStar5(cx - R * 0.1, cy - R * 0.1, R * 0.42, '#fbe39a', tilt); }
function uiHeart(cx, cy, s, col) {
  g.fillStyle = col; g.beginPath();
  g.moveTo(cx, cy + 12 * s); g.bezierCurveTo(cx - 18 * s, cy, cx - 12 * s, cy - 14 * s, cx, cy - 6 * s);
  g.bezierCurveTo(cx + 12 * s, cy - 14 * s, cx + 18 * s, cy, cx, cy + 12 * s); g.fill();
}
function uiCloud(cx, cy, s, col, under) {
  for (const [dx, dy, r] of [[-12, 2, 8], [-4, -4, 10], [7, -2, 9], [14, 3, 7], [0, 4, 9]]) uiDisc(cx + dx * s, cy + dy * s + 3 * s, r * s, under);
  for (const [dx, dy, r] of [[-12, 2, 8], [-4, -4, 10], [7, -2, 9], [14, 3, 7], [0, 4, 9]]) uiDisc(cx + dx * s, cy + dy * s, r * s, col);
}

Object.assign(UI_DRAW, {
  // ---------- Rohstoffe ----------
  holz() { uiShadow(32, 56, 21); uiLog(16, 48, 8, 22); uiLog(33, 50, 8, 22); uiLog(25, 36, 8, 22); },
  stein() { uiShadow(32, 56, 20); uiRock(31, 50, 1.25, '#a3a7ab'); },
  erz() {
    uiShadow(32, 56, 20); uiRock(31, 50, 1.25, '#7c7975');
    for (const [x, y, r] of [[22, 40, 2.6], [31, 35, 2], [27, 46, 1.8], [38, 42, 2.4]]) { uiDisc(x, y, r, '#e3a23c'); uiDisc(x - 0.6, y - 0.6, r * 0.45, '#ffd98a'); }
  },
  obst() {
    uiShadow(32, 56, 18);
    const apple = (x, y, r) => { uiDisc(x, y, r, '#d9443a'); uiDisc(x + r * 0.3, y + r * 0.15, r * 0.8, '#b8352c'); uiDisc(x, y, r * 0.78, '#e2564b'); uiDisc(x - r * 0.35, y - r * 0.35, r * 0.25, '#f59a90');
      uiLine([[x, y - r * 0.85], [x + 1.5, y - r - 4]], '#6b4f3a', 1.8); uiPath([[x + 1.5, y - r - 3], [x + 8, y - r - 6], [x + 3, y - r - 0.5]], '#5fae4a'); };
    apple(24, 46, 10); apple(40, 47, 9); apple(32, 34, 9.5);
  },
  quader() {
    uiShadow(32, 56, 21);
    const c = '#c9bea9';
    uiBox(24, 50, 11, 5.5, 9, c); uiBox(41, 50, 11, 5.5, 9, shade(c, -0.04)); uiBox(32, 41, 11, 5.5, 9, shade(c, 0.04));
  },
  metall() {
    uiShadow(32, 56, 19);
    const bar = (cx, cy, col) => {                       // Barren: Trapez mit Kante
      uiPath([[cx - 15, cy], [cx, cy + 7], [cx, cy + 1], [cx - 12, cy - 5]], col);
      uiPath([[cx, cy + 7], [cx + 15, cy], [cx + 12, cy - 5], [cx, cy + 1]], shade(col, LIGHT.side));
      uiPath([[cx - 12, cy - 5], [cx, cy + 1], [cx + 12, cy - 5], [cx, cy - 11]], shade(col, 0.18));
    };
    bar(26, 50, '#a9b2bc'); bar(40, 50, '#a9b2bc'); bar(33, 41, '#b8c0c9');
  },
  bretter() {
    uiShadow(32, 56, 20);
    const wd = '#cfa168';
    uiBox(32, 51, 18, 9, 4, shade(wd, -0.06)); uiBox(31, 45, 18, 9, 4, wd); uiBox(33, 39, 18, 9, 4, shade(wd, 0.05));
    g.strokeStyle = shade(wd, -0.25); g.lineWidth = 0.8;
    for (const y of [32, 38, 44]) { g.beginPath(); g.moveTo(26, y - 1); g.lineTo(40, y + 6); g.stroke(); }
  },
  kaffee() { uiShadow(32, 57, 16); uiCup(30, 52, '#f2ede4', '#6f4529'); for (const x of [25, 31, 36]) uiLine([[x, 30], [x + 2, 25], [x, 21]], 'rgba(255,255,255,.7)', 1.6); },
  tee() { uiShadow(32, 57, 16); uiCup(30, 52, '#8cc07a', '#c79a4a'); uiLine([[38, 36], [44, 22]], '#e8e2d2', 1.2); uiPath([[42, 22], [47, 22], [47, 27], [42, 27]], '#e9d9b0'); },
  kakao() {
    uiShadow(32, 56, 20);
    const c = '#6e4128';
    uiBox(32, 47, 18, 9, 5, c);
    for (const [x, y] of [[23, 40], [32, 36], [41, 40], [32, 44], [27, 38], [37, 38]]) diamond(x, y, 4, 2, shade(c, 0.22));
  },
  // ---------- Häufige Zeichen ----------
  blitz() {                                                // Strom
    uiShadow(32, 57, 13);
    const P = [[36, 6], [18, 34], [30, 34], [24, 56], [46, 24], [33, 24], [40, 6]];
    uiPath(P.map(([x, y]) => [x + 2.5, y + 2]), '#c98f1e');
    uiPath(P, '#f6c93c');
    uiPath([[36, 6], [24, 26], [27, 26], [38, 8]], '#fbe08a');
  },
  funkel() {                                               // Glitzer, Sternstaub, bereit
    uiStar4(30, 32, 20, '#e6b437'); uiStar4(30, 31, 18, '#ffe48a'); uiStar4(29, 30, 7, '#fff8d8');
    uiStar4(48, 14, 8, '#ffe48a'); uiStar4(47, 50, 6, '#ffe48a');
  },
  palette() {                                              // Farben, Kunst
    uiShadow(32, 56, 20);
    g.fillStyle = '#b8864f'; g.beginPath(); g.ellipse(32, 41, 22, 13, -0.12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d9a464'; g.beginPath(); g.ellipse(32, 39, 22, 13, -0.12, 0, Math.PI * 2); g.fill();
    ellipse(42, 44, 4.5, 3, '#b8864f');
    for (const [x, y, c] of [[20, 37, '#d9443a'], [27, 31, '#f2bd3a'], [36, 30, '#5fae4a'], [45, 34, '#4f86d9'], [24, 44, '#f4efe6']]) { ellipse(x, y, 3.8, 2.6, c); ellipse(x - 1, y - 0.8, 1.4, 0.9, 'rgba(255,255,255,.5)'); }
  },
  geschenk() {
    uiShadow(32, 56, 19);
    uiBox(32, 48, 16, 8, 16, '#d9534a');
    uiLine([[16, 40], [32, 48]], '#f2c14e', 3); uiLine([[32, 48], [32, 32]], '#c99a1e', 3); uiLine([[24, 28], [40, 36]], '#f2c14e', 3); uiLine([[24, 36], [40, 28]], '#f2c14e', 3);
    g.fillStyle = '#f2c14e';
    g.beginPath(); g.ellipse(27, 25, 6, 3.5, -0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(37, 25, 6, 3.5, 0.5, 0, Math.PI * 2); g.fill();
    uiDisc(32, 27, 2.6, '#c99a1e');
  },
  laterne() {                                              // Papierlaterne (Ziel: Laternen)
    uiLine([[32, 4], [32, 12]], '#6b4f3a', 1.6);
    ellipse(32, 52, 12, 4, 'rgba(255,190,90,.25)');
    cyl(32, 15, 6, 2.4, 3, '#5a3d24');
    g.fillStyle = '#e2574c'; g.beginPath(); g.ellipse(32, 31, 15, 16, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c4433a'; g.beginPath(); g.ellipse(32, 31, 15, 16, 0, -Math.PI / 2, Math.PI / 2); g.lineTo(32, 31); g.fill();
    g.strokeStyle = 'rgba(120,30,25,.45)'; g.lineWidth = 1;
    for (const k of [-0.55, 0, 0.55]) { g.beginPath(); g.ellipse(32, 31, 15 * Math.abs(Math.cos(k * 2)) + 0.1, 16, 0, -Math.PI / 2, Math.PI / 2, k < 0); g.stroke(); }
    ellipse(28, 27, 4, 6, 'rgba(255,220,150,.55)');
    cyl(32, 49, 6, 2.4, 3, '#5a3d24'); uiLine([[32, 49], [32, 55]], '#f2c14e', 1.6);
  },
  tonne() {                                                // Wegwerfen / Abreißen
    uiShadow(32, 57, 15);
    cyl(32, 55, 12, 5, 30, '#9aa3ad');
    g.strokeStyle = shade('#9aa3ad', -0.2); g.lineWidth = 1.3;
    for (const x of [26, 32, 38]) { g.beginPath(); g.moveTo(x, 30 + (x - 32) * 0.1); g.lineTo(x, 52 + Math.abs(x - 32) * -0.3); g.stroke(); }
    ellipse(32, 25, 14, 5.5, '#b9c0c8'); ellipse(32, 23.5, 14, 5.5, '#ccd2d8'); cyl(32, 22, 4, 1.6, 3, '#9aa3ad');
  },
  wolke() { uiCloud(32, 38, 1.15, '#ffffff', '#c7d4e8'); },
  gedanke() { uiCloud(34, 30, 1, '#ffffff', '#c7d4e8'); uiDisc(17, 49, 4, '#c7d4e8'); uiDisc(17, 48, 4, '#ffffff'); uiDisc(11, 55, 2.6, '#c7d4e8'); uiDisc(11, 54.5, 2.6, '#ffffff'); },
  buch() {
    uiShadow(32, 56, 20);
    uiBox(32, 49, 18, 9, 7, '#f4ead4');
    g.strokeStyle = '#d9c9a6'; g.lineWidth = 0.8;
    for (const d of [2, 4]) { g.beginPath(); g.moveTo(14, 49 - d); g.lineTo(32, 58 - d); g.lineTo(50, 49 - d); g.stroke(); }
    diamond(32, 41, 19, 9.5, '#b5523f'); diamond(32, 40, 15, 7.5, '#c4634f');
    uiLine([[27, 37.5], [37, 42.5]], '#f2c14e', 1.5);
  },
  zahnrad() {
    uiShadow(32, 56, 18);
    const gear = (cx, cy, col) => {
      g.fillStyle = col; g.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 15 : 20; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.62); }
      g.closePath(); g.fill();
    };
    gear(32, 44, '#a8824f'); gear(32, 41, '#c9a26b');
    ellipse(32, 41, 6, 3.8, '#8a6a3e'); ellipse(32, 40.4, 4, 2.4, '#6b4f30');
  },
  boot() {
    uiShadow(32, 57, 20);
    uiPath([[10, 44], [54, 44], [46, 54], [17, 54]], '#8a5a34'); uiPath([[10, 44], [54, 44], [52, 47], [12, 47]], '#a8703f');
    uiLine([[31, 44], [31, 8]], '#6b4f3a', 2);
    uiPath([[32, 10], [32, 40], [52, 40]], '#f4efe6'); uiPath([[30, 14], [30, 40], [15, 40]], '#e8e0d0');
    uiPath([[31, 6], [40, 9], [31, 12]], '#d9534a');
  },
  krone() {
    uiShadow(32, 56, 18);
    const P = [[12, 48], [12, 26], [22, 36], [32, 18], [42, 36], [52, 26], [52, 48]];
    uiPath(P.map(([x, y]) => [x + 1.5, y + 2]), '#c98f1e'); uiPath(P, '#f2bd3a');
    uiPath([[12, 44], [52, 44], [52, 50], [12, 50]], '#d9a43a');
    for (const [x, c] of [[20, '#d9443a'], [32, '#4f86d9'], [44, '#5fae4a']]) uiDisc(x, 47, 2.4, c);
    for (const [x, y] of [[12, 26], [32, 18], [52, 26]]) uiDisc(x, y, 2.6, '#fff1b8');
  },
  insel() {
    ellipse(32, 50, 26, 10, '#74d0e6'); ellipse(32, 47, 20, 7.5, '#f1dfae'); ellipse(30, 45, 13, 4.5, '#96d56f');
    uiLine([[33, 46], [35, 30], [33, 18]], '#8a5e38', 3);
    g.fillStyle = '#4f9a3c';
    for (const a of [-2.6, -2.0, -1.2, -0.5, 0.2]) { g.beginPath(); g.ellipse(33 + Math.cos(a) * 8, 18 + Math.sin(a) * 4 + 3, 9, 3, a, 0, Math.PI * 2); g.fill(); }
    uiDisc(31, 21, 2, '#8a5e38'); uiDisc(35, 21, 2, '#8a5e38');
  },
  korb() {
    uiShadow(32, 57, 18);
    uiDisc(26, 30, 7, '#e2564b'); uiDisc(37, 29, 6.5, '#f2bd3a'); uiDisc(32, 25, 6, '#e2564b'); uiDisc(42, 33, 5.5, '#5fae4a');
    uiPath([[13, 34], [51, 34], [46, 54], [18, 54]], '#b8864f'); uiPath([[32, 34], [51, 34], [46, 54], [32, 54]], shade('#b8864f', LIGHT.side));
    g.strokeStyle = shade('#b8864f', -0.3); g.lineWidth = 1;
    for (const y of [40, 46]) { g.beginPath(); g.moveTo(14.5 + (y - 34) * 0.25, y); g.lineTo(49.5 - (y - 34) * 0.25, y); g.stroke(); }
    ellipse(32, 34, 19, 4, '#d9a464');
  },
  schnecke() {                                             // weit weg (langsam)
    uiShadow(32, 56, 22);
    uiPath([[8, 54], [52, 54], [56, 48], [46, 46], [14, 48]], '#9cb08a'); uiPath([[8, 54], [52, 54], [52, 51], [10, 51]], '#86997a');
    uiLine([[50, 47], [53, 36]], '#9cb08a', 2.4); uiLine([[54, 47], [59, 37]], '#9cb08a', 2.4); uiDisc(53, 35, 2.3, '#5a4a3a'); uiDisc(59, 36, 2.3, '#5a4a3a');
    uiDisc(29, 36, 16, '#c98f52'); uiDisc(30, 35, 14, '#e0ac6a');
    g.strokeStyle = '#a8703f'; g.lineWidth = 2.2; g.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 1 + a * 0.8; g.lineTo(31 + Math.cos(a) * r, 35 + Math.sin(a) * r); }
    g.stroke();
  },
  rolle() {                                                // Erlass, Urkunde
    uiShadow(32, 56, 20);
    uiPath([[14, 20], [50, 14], [50, 46], [14, 52]], '#f1e3c0'); uiPath([[32, 17], [50, 14], [50, 46], [32, 49]], '#e6d4ab');
    g.strokeStyle = '#c8b28a'; g.lineWidth = 1.2; for (const y of [26, 32, 38]) { g.beginPath(); g.moveTo(19, y + 1); g.lineTo(44, y - 3); g.stroke(); }
    for (const [x, y] of [[14, 20], [14, 52]]) { ellipse(x, y, 4, 5, '#d9c08c'); ellipse(x, y, 2, 2.6, '#b8995e'); }
    uiDisc(42, 44, 4.5, '#c4433a'); uiDisc(41, 43, 1.8, '#e2574c');
  },
  sonne() {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; uiPath([[32 + Math.cos(a - 0.14) * 16, 32 + Math.sin(a - 0.14) * 16], [32 + Math.cos(a) * 27, 32 + Math.sin(a) * 27], [32 + Math.cos(a + 0.14) * 16, 32 + Math.sin(a + 0.14) * 16]], '#f2b53a'); }
    uiDisc(32, 32, 16, '#e8a52a'); uiDisc(31, 31, 15, '#f6c93c'); uiDisc(27, 27, 5, '#fbe08a');
  },
  dynamit() {
    uiShadow(32, 57, 16);
    for (const [x, c] of [[24, '#c4433a'], [32, '#d9534a'], [40, '#b8352c']]) { cyl(x, 55, 5, 2.4, 28, c); ellipse(x, 27, 5, 2.4, shade(c, 0.2)); }
    uiLine([[18, 42], [46, 42]], '#e8d9b0', 3);
    g.strokeStyle = '#6b4f3a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(32, 26); g.quadraticCurveTo(36, 16, 44, 14); g.stroke();
    uiStar4(45, 13, 7, '#ffd24a'); uiStar4(45, 13, 3.5, '#fff6c8');
  },
  warnung() {
    uiShadow(32, 57, 18);
    uiPath([[32, 9], [56, 52], [8, 52]].map(([x, y]) => [x + 1.5, y + 2.5]), '#c98f1e');
    uiPath([[32, 9], [56, 52], [8, 52]], '#f6c93c');
    uiPath([[32, 16], [50, 48], [14, 48]], '#fbd968');
    uiPath([[29.5, 24], [34.5, 24], [33.5, 39], [30.5, 39]], '#5a3d24'); uiDisc(32, 44, 2.6, '#5a3d24');
  },
  schnee() {
    g.strokeStyle = '#9fd0ea'; g.lineWidth = 4.5; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(32 - Math.cos(a) * 22, 32 - Math.sin(a) * 22); g.lineTo(32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22); g.stroke(); }
    g.strokeStyle = '#e6f5fc'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = 32 + Math.cos(a) * 14, y = 32 + Math.sin(a) * 14;
      for (const d of [-0.6, 0.6]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a + d) * 7, y + Math.sin(a + d) * 7); g.stroke(); } }
  },
  kette() {
    uiShadow(32, 56, 18);
    g.lineWidth = 5; g.strokeStyle = '#8a8f99';
    g.beginPath(); g.ellipse(24, 38, 11, 7, -0.5, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#b5bac3'; g.beginPath(); g.ellipse(40, 30, 11, 7, -0.5, 0, Math.PI * 2); g.stroke();
  },
  lineal() {
    uiShadow(32, 56, 22);
    uiPath([[6, 44], [50, 20], [58, 26], [14, 50]], '#e2bd5c'); uiPath([[14, 50], [58, 26], [58, 29], [14, 53]], '#b8923a');
    g.strokeStyle = '#7a5a20'; g.lineWidth = 1.2;
    for (let i = 1; i < 11; i++) { const x = 6 + i * 4.4, y = 44 - i * 2.4, l = i % 2 ? 4 : 7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * 0.5, y + l * 0.55); g.stroke(); }
  },
  noten() {
    uiLine([[26, 44], [26, 14], [46, 9], [46, 38]], '#5a3d24', 3.4); uiLine([[26, 18], [46, 13]], '#5a3d24', 5);
    g.fillStyle = '#5a3d24'; g.beginPath(); g.ellipse(21, 45, 6.5, 5, -0.4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(41, 39, 6.5, 5, -0.4, 0, Math.PI * 2); g.fill();
  },
  tuer() {
    uiShadow(32, 57, 16);
    uiPath([[18, 56], [18, 16], [32, 8], [46, 16], [46, 56]], '#8a5a34');
    uiPath([[21, 54], [21, 18], [32, 11.5], [43, 18], [43, 54]], '#b07a4a');
    g.strokeStyle = '#8a5a34'; g.lineWidth = 1.2; for (const x of [28, 36]) { g.beginPath(); g.moveTo(x, 15); g.lineTo(x, 54); g.stroke(); }
    uiDisc(38, 36, 2.2, '#f2c14e');
  },
  regenbogen() {
    g.lineCap = 'butt';
    ['#e2564b', '#f2a03a', '#f6c93c', '#7cc05a', '#4f86d9', '#9a6ad0'].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 3.6; g.beginPath(); g.arc(32, 48, 26 - i * 3.6, Math.PI, 0); g.stroke(); });
    uiCloud(10, 48, 0.55, '#ffffff', '#c7d4e8'); uiCloud(54, 48, 0.55, '#ffffff', '#c7d4e8');
  },
  kreispfeil() {
    g.lineCap = 'round'; g.lineWidth = 6;
    g.strokeStyle = '#5fae4a'; g.beginPath(); g.arc(32, 32, 16, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    uiPath([[44, 14], [52, 24], [40, 26]], '#5fae4a');
    g.strokeStyle = '#4f86d9'; g.beginPath(); g.arc(32, 32, 16, Math.PI * 0.1, Math.PI * 0.9); g.stroke();
    uiPath([[20, 50], [12, 40], [24, 38]], '#4f86d9');
  },
  schluessel() {
    uiShadow(32, 56, 16);
    g.lineWidth = 5; g.strokeStyle = '#d9a43a'; g.beginPath(); g.arc(20, 24, 9, 0, Math.PI * 2); g.stroke();
    uiLine([[27, 31], [50, 52]], '#d9a43a', 5); uiLine([[43, 45], [38, 50]], '#d9a43a', 4); uiLine([[48, 50], [44, 54]], '#d9a43a', 4);
    g.lineWidth = 1.6; g.strokeStyle = '#f2d27a'; g.beginPath(); g.arc(19, 23, 8, Math.PI, Math.PI * 1.6); g.stroke();
  },
  frage() {                                                // unbekannt / Hilfe: Holzschild mit Fragezeichen
    uiShadow(32, 57, 13); cyl(32, 57, 2.6, 1.3, 18, '#8a5e38');
    uiPath([[13, 14], [51, 10], [53, 40], [15, 44]], '#b8864f'); uiPath([[13, 12], [51, 8], [51, 38], [13, 42]], '#e0b47a');
    g.fillStyle = '#6b4a2a'; g.font = "700 30px Mali, system-ui, sans-serif"; g.textBaseline = 'middle'; g.textAlign = 'left';
    const w = g.measureText('?').width; g.fillText('?', 32 - w / 2, 26);
  },
  drehen() {                                               // Drehknopf: Holzpfeil im Kreis um ein kleines Haus
    uiShadow(32, 57, 20);
    uiBox(32, 44, 9, 4.5, 8, '#f4e6c8'); poly([[23, 36], [32, 31.5], [32, 24], [23, 36]], '#c4634f'); poly([[32, 31.5], [41, 36], [32, 24]], shade('#c4634f', -0.2));
    g.lineCap = 'round';
    g.strokeStyle = '#7a4f2e'; g.lineWidth = 7; g.beginPath(); g.ellipse(32, 38, 23, 15, 0, Math.PI * 0.15, Math.PI * 1.75); g.stroke();
    g.strokeStyle = '#b37b4c'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(32, 37, 23, 15, 0, Math.PI * 0.95, Math.PI * 1.7); g.stroke();
    const a = Math.PI * 1.75, ex = 32 + Math.cos(a) * 23, ey = 38 + Math.sin(a) * 15;
    poly([[ex - 7, ey - 6], [ex + 9, ey - 1], [ex - 2, ey + 9]], '#7a4f2e');
  },
  mond() {
    g.fillStyle = '#f2d77a'; g.beginPath(); g.arc(32, 32, 20, 0, Math.PI * 2); g.fill();
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(42, 26, 17, 0, Math.PI * 2); g.fill(); g.restore();
    uiDisc(20, 36, 2.4, '#e2c25e'); uiDisc(25, 46, 1.6, '#e2c25e');
  },
  herz() { uiShadow(32, 57, 14); uiHeart(33, 36, 1.55, '#b8352c'); uiHeart(32, 34, 1.55, '#e2564b'); ellipse(24, 28, 4, 2.6, 'rgba(255,255,255,.45)'); },
  flagge() {
    uiShadow(26, 57, 10); uiLine([[24, 56], [24, 6]], '#6b4f3a', 2.6); uiDisc(24, 6, 2.4, '#f2bd3a');
    g.fillStyle = '#d9534a'; g.beginPath(); g.moveTo(25, 9); g.quadraticCurveTo(40, 6, 54, 14); g.lineTo(25, 28); g.closePath(); g.fill();
    g.fillStyle = '#b8352c'; g.beginPath(); g.moveTo(25, 19); g.quadraticCurveTo(40, 18, 54, 14); g.lineTo(25, 28); g.closePath(); g.fill();
  },
  briefkasten() {
    uiShadow(32, 57, 12); cyl(32, 57, 2.4, 1.2, 22, '#6b4f3a');
    uiBox(32, 36, 12, 6, 18, '#f2c14e'); uiLine([[24, 25], [31, 29]], '#6b4f3a', 1.6);
    g.fillStyle = '#3d5a99'; g.beginPath(); g.moveTo(37, 26); g.lineTo(42, 23.5); g.lineTo(42, 27); g.closePath(); g.fill();
  },
  pin() { uiShadow(32, 57, 8); uiLine([[32, 56], [32, 34]], '#8a8f99', 2); uiDisc(32, 24, 12, '#b8352c'); uiDisc(31, 22, 11, '#e2564b'); uiDisc(27, 18, 3.5, '#f59a90'); },
  axt() {
    uiShadow(32, 57, 16); uiLine([[18, 54], [42, 12]], '#8a5e38', 4); uiLine([[19, 52], [42, 13]], '#a8763f', 1.6);
    uiPath([[34, 12], [52, 14], [50, 30], [38, 26]], '#9aa3ad'); uiPath([[44, 13], [52, 14], [50, 30], [45, 28]], '#c9d0d8');
  },
  kompass() {
    uiShadow(32, 56, 18); ellipse(32, 44, 20, 10, '#b8864f'); ellipse(32, 41, 20, 10, '#d9a464'); ellipse(32, 41, 16, 8, '#f4efe6');
    uiPath([[32, 41], [40, 35], [34.5, 42.5]], '#d9443a'); uiPath([[32, 41], [24, 47], [29.5, 39.5]], '#6b7480'); uiDisc(32, 41, 1.6, '#5a3d24');
  },
  besen() {
    uiShadow(32, 57, 16); uiLine([[44, 6], [28, 40]], '#a8763f', 3.2);
    uiPath([[22, 38], [34, 42], [36, 56], [12, 52]], '#e2bd5c'); uiPath([[26, 39], [34, 42], [36, 56], [28, 55]], '#c9a043');
    uiLine([[22, 40], [34, 44]], '#b5523f', 2.4);
  },
  welle() {
    g.fillStyle = '#4f9fd0'; g.beginPath(); g.moveTo(8, 54); g.bezierCurveTo(10, 30, 30, 14, 46, 22); g.bezierCurveTo(36, 22, 32, 32, 40, 38);
    g.bezierCurveTo(48, 42, 54, 36, 56, 34); g.lineTo(56, 54); g.closePath(); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(14, 46); g.bezierCurveTo(18, 30, 32, 20, 44, 23); g.stroke();
  },
  leiter() {
    uiShadow(32, 57, 12); uiLine([[22, 56], [26, 6]], '#a8763f', 3); uiLine([[40, 56], [44, 6]], '#8a5e38', 3);
    for (let y = 12; y < 54; y += 9) uiLine([[25.5 - (y - 6) * 0.08, y], [43.5 - (y - 6) * 0.08, y]], '#c99a5e', 2.4);
  },
  kran() {                                                 // Baustelle
    uiShadow(26, 57, 12);
    uiLine([[22, 56], [22, 8]], '#e0a43a', 4); uiLine([[28, 56], [28, 8]], '#c98a2a', 4);
    for (let y = 14; y < 56; y += 8) uiLine([[22, y], [28, y + 6]], '#c98a2a', 1.2);
    uiLine([[12, 9], [56, 9]], '#e0a43a', 4); uiLine([[48, 10], [48, 30]], '#6b4f3a', 1.2);
    uiPath([[44, 30], [52, 30], [52, 37], [44, 37]], '#9aa3ad'); uiBox(14, 14, 4, 2, 6, '#7a7f88');
  },
  // Sternstaub (Nutzer 26.10.2026: „eigenes Symbol, das Emoji sieht doof aus“ → Sternsäckchen): Samtbeutel, goldene Schleife, Sterne fallen heraus
  sternstaub() {
    uiShadow(32, 58, 18);
    const glow = g.createRadialGradient(32, 18, 0, 32, 18, 20); glow.addColorStop(0, 'rgba(255,225,130,.75)'); glow.addColorStop(1, 'rgba(255,225,130,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(32, 18, 20, 0, Math.PI * 2); g.fill();
    const body = () => { g.beginPath(); g.moveTo(25, 30); g.bezierCurveTo(15, 34, 9, 44, 13, 51); g.bezierCurveTo(17, 58, 47, 58, 51, 51); g.bezierCurveTo(55, 44, 49, 34, 39, 30); g.closePath(); };
    const cloth = g.createLinearGradient(12, 0, 52, 0); cloth.addColorStop(0, '#b3a7f5'); cloth.addColorStop(0.45, '#8a7be0'); cloth.addColorStop(1, '#5b4db5');
    g.fillStyle = cloth; body(); g.fill();
    g.save(); body(); g.clip(); g.fillStyle = 'rgba(60,40,140,.22)'; g.beginPath(); g.ellipse(32, 60, 24, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.ellipse(19, 41, 3.5, 8, 0.35, 0, Math.PI * 2); g.fill(); g.restore();
    for (const [x, y, r] of [[25, 47, 2.6], [38, 50, 2.2], [43, 40, 2], [31, 39, 1.8]]) uiStar5(x, y, r, '#f5cf5a');
    // Hals: gerafft, oben offen
    uiPath([[26, 30], [21, 22], [25, 20.5], [28.5, 22], [32, 20], [35.5, 22], [39, 20.5], [43, 22], [38, 30]], '#9a8de8');
    g.strokeStyle = '#6f61c4'; g.lineWidth = 0.9; for (const x of [27.5, 32, 36.5]) { g.beginPath(); g.moveTo(x, 22.5); g.lineTo(x + (32 - x) * 0.25, 29.5); g.stroke(); }
    ellipse(32, 21.5, 9.5, 2.6, '#3d3285');
    uiGoldStar(37, 13, 8, 0.2); uiGoldStar(26, 15.5, 5.6, -0.25);
    // Schleife
    g.fillStyle = '#e2ad2e'; g.beginPath(); g.ellipse(26.5, 31, 4.6, 2.6, -0.5, 0, Math.PI * 2); g.ellipse(37.5, 31, 4.6, 2.6, 0.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2c94c'; g.beginPath(); g.ellipse(26.8, 30.4, 3, 1.4, -0.5, 0, Math.PI * 2); g.ellipse(37.2, 30.4, 3, 1.4, 0.5, 0, Math.PI * 2); g.fill();
    uiLine([[31, 32], [28, 39]], '#e2ad2e', 2); uiLine([[33, 32], [36, 38.5]], '#e2ad2e', 2);
    uiDisc(32, 31.2, 2.4, '#f2c94c');
    uiStar4(13, 22, 3.4, '#ffe48a'); uiStar4(51, 18, 4.2, '#ffe48a'); uiStar4(45, 5, 2.6, '#fff3c4');
    for (const [x, y] of [[20, 9], [47, 26], [17, 28]]) uiDisc(x, y, 0.9, '#ffe9a8');
  },
  // Gestalten (Nutzer 26.10.2026: „das Beet sieht doof aus, weil es so braun ist“ → Gießkanne)
  giesskanne() {
    uiShadow(30, 57, 19);
    uiLine([[40, 44], [55, 24]], '#3f7fb6', 5); uiLine([[40, 43], [54, 24]], '#6aa7da', 2.2);
    ellipse(56, 22, 4.2, 3, '#3f7fb6'); ellipse(56, 21.5, 3, 2, '#9cc9ec');
    cyl(28, 55, 15, 7, 22, '#5d98cf'); ellipse(28, 33, 15, 7, '#7fb4e2'); ellipse(28, 33, 11, 5, '#3f7fb6');
    g.strokeStyle = '#3f7fb6'; g.lineWidth = 4.5; g.lineCap = 'round'; g.beginPath(); g.arc(28, 33, 13, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.strokeStyle = '#7fb4e2'; g.lineWidth = 1.6; g.beginPath(); g.arc(28, 32, 13, Math.PI * 1.15, Math.PI * 1.5); g.stroke();
    g.globalAlpha = 0.3; g.fillStyle = '#ffffff'; g.fillRect(16, 37, 3, 14); g.globalAlpha = 1;
    for (const [x, y] of [[59, 30], [61, 37], [57, 41]]) ellipse(x, y, 1.7, 2.4, '#7fc2ef');
    for (const [x, y, c] of [[22, 47, '#f2a0c8'], [30, 49, '#f6d35a'], [36, 46, '#f2a0c8']]) { uiDisc(x, y, 2.6, c); uiDisc(x, y, 1, '#fff6d0'); }
  },
});

// Ladebildschirm: eine langsam drehende Sonne statt des weißen Kreisels (läuft, während die übrigen Skripte noch laden)
if (typeof document !== 'undefined') {
  try {
    const u = uiIcon('sonne');
    if (u) for (const e of document.querySelectorAll('.ld-spin')) { e.classList.add('drawn'); e.style.backgroundImage = `url(${u})`; }
  } catch (e) { /* dann bleibt der Kreisel */ }
}
