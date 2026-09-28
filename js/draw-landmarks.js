'use strict';
// ---------------------------------------------------------------------------
// Sehenswürdigkeiten, die für ihre 2×2 Felder neu gezeichnet sind (Licht von links wie bei den Gebäuden).
// LANDMARK_ART[typ](K, stufe, now, x, y): K ist der Rahmen in der Mitte der 2×2 Felder (a, b von −1 bis 1),
// Punkte in Bildschirm-Pixeln werden mit S(x, y) relativ zur Mitte angegeben (× z).
// Stufe 0 = verfallen (Farben über RUIN, dazu Gestrüpp), 1–3 mit immer mehr Details.
// ---------------------------------------------------------------------------
function lmScreen(K) { const [cx, cy] = K.P(0, 0), z = K.z; return (x, y) => [cx + x * z, cy + y * z]; }
function facets(S, list) { for (const [pts, col] of list) poly(pts.map(p => S(...p)), C(col)); }

// Kristall wie ein Bergkristall: sechseckige Säule mit Spitze (von vorn: zwei Seiten, zwei Spitzenflächen)
const ICE = { light: '#e6f8ff', mid: '#a9def6', dark: '#62b1dc', tipL: '#ffffff', tipD: '#8fcdee' };
function crystal(x, y, z, h, w, tilt = 0, dim = false) {
  const t = tilt * h, k = w * 0.35;
  const BL = [x - w, y - k], BF = [x, y + k], BR = [x + w, y - k];
  const up = p => [p[0] + t, p[1] - h];
  const TL = up(BL), TF = up(BF), TR = up(BR), A = [x + t * 1.15, y - h - w * 1.5];
  const col = c => C(dim ? mix(c, '#8f9aa6', 0.5) : c);
  poly([BL, BF, TF, TL], col(ICE.light));
  poly([BF, BR, TR, TF], col(ICE.dark));
  poly([TL, TF, A], col(ICE.tipL));
  poly([TF, TR, A], col(ICE.tipD));
  g.strokeStyle = col('#ffffff'); g.lineWidth = 0.7 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(BL[0] + w * 0.35, BL[1] + k * 0.3); g.lineTo(TL[0] + w * 0.35, TL[1] + k * 0.3); g.stroke();
  if (!dim) glowQuad([[TL[0], TL[1]], [TR[0], TR[1]], [BR[0], BR[1]], [BL[0], BL[1]]], (8 + h * 0.6) * z, 'blue');
}
function crystalCluster(S, z, x, y, s, dim) {
  const [px, py] = S(x, y);
  crystal(px - 5 * s * z, py + 1 * z, z, 9 * s * z, 2.6 * s * z, -0.25, dim);
  crystal(px + 5 * s * z, py + 1.5 * z, z, 8 * s * z, 2.4 * s * z, 0.3, dim);
  crystal(px, py + 3 * z, z, 14 * s * z, 3.3 * s * z, 0.05, dim);
}
function paperLantern(x, y, z, col) {
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1 * z;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 13 * z); g.stroke();
  const lit = night > 0.15 && isLive();
  ellipse(x, y - 15.5 * z, 2.6 * z, 3.2 * z, lit ? '#ffcf73' : C(col));
  glowQuad([[x - 2, y - 18 * z], [x + 2, y - 18 * z], [x + 2, y - 13 * z], [x - 2, y - 13 * z]], 16 * z);
}

const LANDMARK_ART = {
  // Windige Klippe: ein Berg mit Haupt- und Nebengipfel, Schneekappe und grünem Fuß
  klippe(K, stage, now, x, y) {
    const S = lmScreen(K), z = K.z;
    if (groundPart(() => { K.oval(0, 0, 0.95, C('#9fcf7c')); K.oval(-0.1, 0.1, 0.8, C('#94c872')); })) return;
    const b0 = [-58, 4], b1 = [-36, 17], b2 = [-8, 27], b3 = [22, 23], b4 = [46, 12], b5 = [60, 0];
    const p1 = [-12, -82], p2 = [30, -48], m1 = [-36, -30], m2 = [8, -44], m3 = [48, -16], c1 = [-14, -22], c2 = [18, -6];
    ellipse(...S(2, 16), 62 * z, 20 * z, 'rgba(40,55,40,0.15)');
    facets(S, [
      [[b0, m1, p1, m2, p2, m3, b5, b4, b3, b2, b1], '#a3a9b3'],
      [[b0, b1, c1, m1], '#c4c8cf'],
      [[m1, c1, p1], '#d3d6dc'],
      [[c1, b1, b2], '#b4b9c2'],
      [[p1, c1, b2, c2, m2], '#979da8'],
      [[m2, c2, p2], '#b0b5be'],
      [[p2, c2, b3, b4, m3], '#8a909b'],
      [[m3, b4, b5], '#7c828d'],
      [[c2, b2, b3], '#a0a6b0'],
    ]);
    // Schneekappe
    facets(S, [
      [[p1, [-21, -62], [-17, -58], [-13, -61]], '#fbfdff'],
      [[p1, [-13, -61], [-8, -57], [-3, -60], [1, -58]], '#dce4ee'],
      [[p2, [22, -46], [25, -42], [27, -44]], '#f4f7fb'],
      [[p2, [27, -44], [31, -40], [34, -41]], '#d6dee9'],
    ]);
    // Felsbänder
    g.strokeStyle = C('#7f858f'); g.lineWidth = 0.9 * z; g.lineCap = 'round';
    g.beginPath();
    for (const [a, b] of [[[-44, -4], [-28, -8]], [[-30, -40], [-20, -46]], [[4, -18], [14, -24]], [[30, -2], [40, -8]]]) { g.moveTo(...S(...a)); g.lineTo(...S(...b)); }
    g.stroke();
    // Grüner Fuß (links in der Sonne, rechts im Schatten)
    // schmaler, welliger Grasstreifen entlang der Unterkante (links in der Sonne, rechts im Schatten)
    const lift = (p, d) => [p[0], p[1] - d];
    facets(S, [
      [[b0, b1, b2, lift(b2, 9), lift([-22, 22], 13), lift(b1, 10), lift([-47, 11], 12), lift(b0, 7)], '#8ccc66'],
      [[b2, b3, b4, b5, lift(b5, 6), lift(b4, 10), lift([34, 18], 12), lift(b3, 9), lift(b2, 9)], '#6fae52'],
    ]);
    for (let i = 0; i < 6; i++) { const [bx, by] = S(-46 + i * 19, 12 + (i % 2) * 6 - (i === 5 ? 6 : 0)); circle(bx, by, (2.4 + (i % 3) * 0.8) * z, C(i < 3 ? '#62b85a' : '#529c4b')); }
    if (stage <= 0) {                                             // verfallen: Gestrüpp, umgekippter Mast
      for (let i = 0; i < 6; i++) { const [bx, by] = S(-40 + i * 16, -6 - (i % 3) * 10); circle(bx, by, 3.4 * z, C('#7d9a55')); }
      const [fx, fy] = S(p1[0], p1[1] + 2);
      g.strokeStyle = C('#6b6f78'); g.lineWidth = 1.4 * z;
      g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + 8 * z, fy - 5 * z); g.stroke();
      return;
    }
    // Stufe 1: Pfad im Zickzack und Aussichtsplattform mit Windsack
    g.strokeStyle = C('#e2cfa6'); g.lineWidth = 1.8 * z; g.lineJoin = 'round';
    g.beginPath();
    [[-20, 22], [-42, 4], [-20, -10], [-36, -26], [-18, -44], [-24, -60], [-14, -76]].forEach((p, i) => i ? g.lineTo(...S(...p)) : g.moveTo(...S(...p)));
    g.stroke();
    const [tx, ty] = S(p1[0], p1[1] + 3);
    poly([[tx - 8 * z, ty], [tx, ty + 4 * z], [tx + 8 * z, ty], [tx, ty - 4 * z]], C('#a57645'));
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
    g.beginPath(); g.moveTo(tx - 8 * z, ty - 3 * z); g.lineTo(tx, ty + 1 * z); g.lineTo(tx + 8 * z, ty - 3 * z); g.stroke();
    g.lineWidth = 1.3 * z;
    g.beginPath(); g.moveTo(tx + 3 * z, ty); g.lineTo(tx + 3 * z, ty - 18 * z); g.stroke();
    const w = Math.sin(now / 250) * 2 * z;
    poly([[tx + 3 * z, ty - 18 * z], [tx + 15 * z, ty - 16 * z + w], [tx + 15 * z, ty - 13 * z + w], [tx + 3 * z, ty - 12 * z]], C('#ff8a3d'));
    poly([[tx + 7 * z, ty - 17.3 * z], [tx + 10 * z, ty - 16.8 * z + w * 0.6], [tx + 10 * z, ty - 13.2 * z + w * 0.6], [tx + 7 * z, ty - 12.7 * z]], C('#ffffff'));
    // Stufe 2: alte Windmühle auf dem Nebengipfel
    if (stage >= 2) {
      const [mx, my] = S(p2[0], p2[1] + 6);
      const pass = PASS; PASS = null;
      g.save(); g.translate(mx, my); g.scale(0.5, 0.5); drawObject('muehle', 0, 0, z, now, x, y, 2, { b: 'muehle', lvl: 2, rot: 1 }); g.restore();
      PASS = pass;
    }
    // Stufe 3: Drachen über der Wiese
    if (stage >= 3) for (let i = 0; i < 3; i++) {
      const [ax, ay] = S(-30 + i * 26, 8 - i * 3);
      const kx = ax + 10 * z + Math.sin(now / 900 + i) * 4 * z, ky = ay - 78 * z - i * 8 * z + Math.cos(now / 1100 + i) * 3 * z;
      poly([[kx, ky - 6 * z], [kx + 4.5 * z, ky], [kx, ky + 7 * z], [kx - 4.5 * z, ky]], C(['#e8705f', '#5f8fe8', '#f2b53a'][i]));
      poly([[kx, ky - 6 * z], [kx + 4.5 * z, ky], [kx, ky]], C(shade(['#e8705f', '#5f8fe8', '#f2b53a'][i], 0.2)));
      g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.6 * z;
      g.beginPath(); g.moveTo(kx, ky + 7 * z); g.quadraticCurveTo(kx + 6 * z, (ky + ay) / 2, ax, ay); g.stroke();
    }
  },

  // Heiße Quelle: natürliches Becken mit Dampf; später Einfassung und ein Badehaus daneben an Land
  quelle(K, stage, now, x, y) {
    const pool = [[0.3, 0.25, 0.62], [0.62, -0.2, 0.34], [0, 0.55, 0.34]];
    if (groundPart(() => {
      K.oval(0, 0, 0.95, C('#a9cf86'));
      if (stage >= 3) {                                          // Holzsteg vom Badehaus zum Wasser
        K.rect(-0.35, -0.55, 0.15, -0.25, C('#c9955f'));
        for (let i = 1; i < 6; i++) K.rect(-0.35 + i * 0.085, -0.55, -0.34 + i * 0.085, -0.25, C('#a57645'));
      }
      for (const [a, b, r] of pool) K.oval(a, b, r + 0.09, C(stage >= 2 ? '#c9c3b6' : '#9a9384'));
      for (const [a, b, r] of pool) K.oval(a, b, r, C(stage <= 0 ? '#8fa08a' : '#5fcfd0'));
      for (const [a, b, r] of pool) K.oval(a - 0.05, b - 0.05, r * 0.7, C(stage <= 0 ? '#9aab93' : '#8ae6e0'));
      if (stage >= 2) for (let i = 0; i < 18; i++) {             // Einfassung aus Steinen
        const an = i / 18 * Math.PI * 2, [px, py] = K.P(0.34 + Math.cos(an) * 0.82, 0.2 + Math.sin(an) * 0.76);
        ellipse(px, py, 3 * K.z, 1.8 * K.z, C(i % 2 ? '#d9d4c9' : '#bdb7aa'));
      }
    })) return;
    const z = K.z;
    const parts = [];
    // Felsen am Rand
    for (const [a, b, s] of [[-0.15, -0.1, 5], [0.95, 0.45, 4], [-0.45, 0.7, 4.5], [0.85, -0.65, 3.5]]) parts.push([a, b, () => { const [bx, by] = K.P(a, b); boulder(bx, by, s * z); }]);
    if (stage <= 0) {
      for (let i = 0; i < 6; i++) parts.push([-0.6 + i * 0.25, 0.7, () => kitBush(K, -0.7 + i * 0.28, 0.72 - (i % 2) * 0.2, 0.8, '#7d9a55')]);
      K.scene(parts);
      return;
    }
    // Dampf steigt auf
    parts.push([0.3, 0.2, () => {
      for (let i = 0; i < 5; i++) {
        const ph = (now / 2400 + i / 5) % 1, [sx, sy] = K.P(0.05 + (i % 3) * 0.3, 0.4 - (i % 2) * 0.35);
        circle(sx + Math.sin(ph * 5 + i) * 3 * z, sy - 4 * z - ph * 30 * z, (3 + ph * 7) * z, `rgba(255,255,255,${0.35 * (1 - ph) * Math.min(1, ph * 5)})`);
      }
    }]);
    if (stage >= 2) parts.push([0.95, -0.2, () => {               // Bambusrohr, aus dem Wasser plätschert
      const [px, py] = K.P(0.92, -0.25);
      g.strokeStyle = C('#8fa35a'); g.lineWidth = 2.2 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 12 * z); g.lineTo(px - 7 * z, py - 10 * z); g.stroke();
      const drip = (now / 300) % 1;
      circle(px - 7 * z, py - 10 * z + drip * 8 * z, 1 * z, C('#bff3f0'));
    }]);
    if (stage >= 3) {
      parts.push([-0.55, -0.55, () => {                           // Badehaus mit weitem Dach und Vorhang an der Tür
        const B = K.block({ a: -0.58, b: -0.5, ha: 0.28, hb: 0.3, h: 15, wall: '#f3e6cc', roof: '#5f7f9f', roofH: 11, over: 1.35, entry: true });
        K.door(B, 'front', 0.36, 0.64, 0.62, '#6b4a2e');
        const F = B.faces.front;
        if (F) { faceQuad(F.P, F.Q, 0.36, 0.64, F.H * 0.42, F.H * 0.62, C('#3f6f9f')); faceQuad(F.P, F.Q, 0.49, 0.51, F.H * 0.42, F.H * 0.62, C('#f3e6cc')); }
        K.sideWins(B, 1, 0.35, 0.7);
      }]);
      for (const [a, b, c] of [[0.02, -0.72, '#e8604f'], [0.2, -0.28, '#f2a33a']]) parts.push([a, b, () => { const [lx, ly] = K.P(a, b); paperLantern(lx, ly, z, c); }]);
    }
    K.scene(parts);
  },

  // Kristallhöhle: Felshügel mit Höhleneingang, ringsum blaue Kristallsäulen
  kristall(K, stage, now, x, y) {
    const S = lmScreen(K), z = K.z, dim = stage <= 0;
    if (groundPart(() => {
      K.oval(0, 0, 0.95, C('#aab1bd'));
      K.oval(0.1, 0.15, 0.75, C('#b7bdc8'));
      if (stage >= 2) {                                          // Weg zum Eingang
        g.strokeStyle = C('#d7d2c6'); g.lineWidth = 7 * z; g.lineCap = 'round';
        g.beginPath(); g.moveTo(...S(4, 12)); g.quadraticCurveTo(...S(20, 26), ...S(12, 36)); g.stroke();
      }
    })) return;
    ellipse(...S(0, 10), 54 * z, 18 * z, 'rgba(40,40,60,0.16)');
    // Felshügel (links hell, rechts im Schatten)
    const h0 = [-50, 6], h1 = [-44, -16], h2 = [-26, -36], h3 = [0, -42], h4 = [26, -32], h5 = [44, -14], h6 = [52, 6], f1 = [30, 18], f2 = [0, 24], f3 = [-28, 18], r = [-4, -12];
    facets(S, [
      [[h0, h1, h2, h3, h4, h5, h6, f1, f2, f3], '#9097a3'],
      [[h0, h1, r, f3], '#b3b9c3'],
      [[h1, h2, h3, r], '#c2c7cf'],
      [[h3, h4, r], '#9ea4af'],
      [[r, h4, h5, f1, f2], '#8a909c'],
      [[h5, h6, f1], '#7a808c'],
      [[f3, r, f2], '#a7adb7'],
    ]);
    // Höhleneingang
    const [ex, ey] = S(6, 12);
    g.beginPath(); g.ellipse(ex, ey, 9 * z, 13 * z, 0, Math.PI, 0); g.lineTo(ex + 9 * z, ey + 2 * z); g.lineTo(ex - 9 * z, ey + 2 * z); g.closePath();
    g.fillStyle = C('#2f3242'); g.fill();
    if (!dim) { g.globalAlpha = 0.5; ellipse(ex, ey - 2 * z, 5 * z, 6 * z, '#7fd3ff'); g.globalAlpha = 1; glowQuad([[ex - 4, ey - 8 * z], [ex + 4, ey - 8 * z], [ex + 4, ey], [ex - 4, ey]], 22 * z, 'blue'); }
    if (dim) for (const [ox, oy] of [[-4, 6], [4, 8], [0, 3]]) { const [bx, by] = S(6 + ox, 12 + oy); boulder(bx, by, 4 * z); }
    // Kristalle auf dem Hügel und am Boden
    crystalCluster(S, z, -2, -38, stage >= 3 ? 1.7 : 1.25, dim);
    crystalCluster(S, z, -36, -10, 0.9, dim);
    crystalCluster(S, z, 34, -8, 0.8, dim);
    if (stage >= 1) {                                             // Holzrahmen am Eingang
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(ex - 10 * z, ey + 2 * z); g.lineTo(ex - 10 * z, ey - 13 * z); g.lineTo(ex + 10 * z, ey - 13 * z); g.lineTo(ex + 10 * z, ey + 2 * z); g.stroke();
    }
    crystalCluster(S, z, -32, 18, 0.75, dim);
    crystalCluster(S, z, 38, 14, 0.7, dim);
    if (stage >= 2) for (const [lx, ly] of [[18, 30], [8, 40], [26, 42]]) {      // Kristall-Laternen am Weg
      const [px, py] = S(lx, ly);
      g.strokeStyle = C('#4a4a58'); g.lineWidth = 1 * z;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 9 * z); g.stroke();
      crystal(px, py - 9 * z, z, 5 * z, 1.6 * z, 0);
    }
    if (stage >= 3) for (let i = 0; i < 6; i++) {                // Funkeln
      const ph = (now / 1600 + i / 6) % 1, [sx, sy] = S(-40 + (i * 17) % 80, -50 + (i * 23) % 60), r = (1 - Math.abs(ph - 0.5) * 2) * 2.6 * z;
      poly([[sx, sy - r * 1.8], [sx + r * 0.5, sy], [sx, sy + r * 1.8], [sx - r * 0.5, sy]], '#ffffff');
      poly([[sx - r * 1.8, sy], [sx, sy - r * 0.5], [sx + r * 1.8, sy], [sx, sy + r * 0.5]], '#ffffff');
    }
  },
};
