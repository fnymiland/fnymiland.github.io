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

  // Erzberg: wuchtiger Berg aus warmem Fels mit glänzenden Erzadern, Stollen mit Lore; später Schmiede und Glockenturm
  erzberg(K, stage, now, x, y) {
    const S = lmScreen(K), z = K.z, dim = stage <= 0;
    if (groundPart(() => { K.oval(0, 0, 0.95, C('#a7c98a')); K.oval(0.05, 0.1, 0.8, C('#b3c79a')); })) return;
    const b0 = [-60, 6], b1 = [-38, 20], b2 = [-6, 28], b3 = [26, 24], b4 = [50, 14], b5 = [62, 2];
    const p1 = [-18, -62], p1b = [-8, -64], p2 = [26, -42], m1 = [-44, -24], m2 = [6, -38], m3 = [48, -12], c1 = [-14, -16], c2 = [16, -4];
    ellipse(...S(2, 18), 64 * z, 21 * z, 'rgba(50,40,30,0.16)');
    facets(S, [                                              // grauer Fels mit warmem Schimmer
      [[b0, m1, p1, p1b, m2, p2, m3, b5, b4, b3, b2, b1], '#9a948c'],
      [[b0, b1, c1, m1], '#bcb5aa'],
      [[m1, c1, p1b, p1], '#ccc5b9'],
      [[c1, b1, b2], '#aaa397'],
      [[p1b, c1, b2, c2, m2], '#8a847b'],
      [[m2, c2, p2], '#a9a296'],
      [[p2, c2, b3, b4, m3], '#7f7970'],
      [[m3, b4, b5], '#716c64'],
      [[c2, b2, b3], '#958f85'],
    ]);
    facets(S, [[[b0, b1, b2, [-6, 20], [-26, 13], [-44, 6]], '#8cc66a'], [[b2, b3, b4, b5, [52, 6], [30, 14], [-6, 20]], '#72ad55']]);   // Wiese am Fuß
    // Erzadern (Gold, Kupfer, Silber) und funkelnde Brocken
    const vein = (pts, col) => { g.strokeStyle = C(dim ? '#8f887c' : col); g.lineWidth = 1.6 * z; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...S(...p)) : g.moveTo(...S(...p))); g.stroke(); };
    vein([[-44, -8], [-38, -14], [-30, -10], [-22, -22]], '#f2c14e');
    vein([[-30, -40], [-24, -34], [-18, -42]], '#e08a4a');
    vein([[4, -20], [12, -26], [18, -18], [26, -24]], '#f2c14e');
    vein([[32, 4], [40, -4], [46, 2]], '#9cc3d8');
    for (const [nx, ny, c] of [[-36, -12, '#ffd75e'], [-20, -24, '#ffe28a'], [12, -24, '#ffd75e'], [40, -2, '#d9f0ff'], [-26, -38, '#f0a060'], [22, -30, '#ffe28a']]) {
      const [px, py] = S(nx, ny);
      circle(px, py, 2 * z, C(dim ? '#8f887c' : c));
      if (!dim) { const tw = (Math.sin(now / 400 + nx) + 1) / 2; circle(px - 0.7 * z, py - 0.7 * z, 0.8 * z * tw, '#ffffff'); }
    }
    // Stolleneingang
    const [ex, ey] = S(2, 18);
    g.beginPath(); g.ellipse(ex, ey, 8 * z, 11 * z, 0, Math.PI, 0); g.lineTo(ex + 8 * z, ey + 2 * z); g.lineTo(ex - 8 * z, ey + 2 * z); g.closePath();
    g.fillStyle = C('#2f2a2a'); g.fill();
    if (dim) { for (const [ox, oy] of [[-3, 4], [4, 6], [0, 1]]) { const [bx, by] = S(2 + ox, 18 + oy); boulder(bx, by, 4 * z); } for (let i = 0; i < 5; i++) { const [bx, by] = S(-40 + i * 20, 14 + (i % 2) * 6); circle(bx, by, 3 * z, C('#7d9a55')); } return; }
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2.2 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - 9 * z, ey + 2 * z); g.lineTo(ex - 9 * z, ey - 12 * z); g.lineTo(ex + 9 * z, ey - 12 * z); g.lineTo(ex + 9 * z, ey + 2 * z); g.stroke();
    // Schienen mit Lore voller Erz
    const r0 = S(4, 22), r1 = S(30, 40);
    g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.9 * z;
    g.beginPath(); g.moveTo(r0[0] - 3 * z, r0[1]); g.lineTo(r1[0] - 3 * z, r1[1]); g.moveTo(r0[0] + 3 * z, r0[1] + 1 * z); g.lineTo(r1[0] + 3 * z, r1[1] + 1 * z); g.stroke();
    const [lx, ly] = S(18, 32);
    poly([[lx - 6 * z, ly - 6 * z], [lx + 6 * z, ly - 6 * z], [lx + 4.5 * z, ly], [lx - 4.5 * z, ly]], C('#6b7a8f'));
    for (const [ox, c] of [[-3, '#f2c14e'], [0, '#8f95a0'], [3, '#e08a4a']]) circle(lx + ox * z, ly - 7 * z, 2.2 * z, C(c));
    circle(lx - 3 * z, ly + 1 * z, 1.2 * z, C('#3b3440')); circle(lx + 3 * z, ly + 1 * z, 1.2 * z, C('#3b3440'));
    const [mx, my] = S(-10, 14);
    lampPost(mx, my, z, 12);
    if (stage >= 2) {                                          // Schmiedeplatz: kleine Esse mit Glut und Rauch
      const [fx, fy] = S(40, 22);
      const B = kit(fx, fy, z, 1).block({ ha: 0.13, hb: 0.16, h: 11, wall: '#a86f5c', roof: '#4a4a58', roofH: 7 });
      const F = B.faces.front || B.faces.right || B.faces.left, glow = 0.6 + 0.4 * Math.sin(now / 180);
      if (F) faceQuad(F.P, F.Q, 0.3, 0.7, F.H * 0.1, F.H * 0.55, `rgba(255,${Math.round(120 + 60 * glow)},60,1)`);
      box(fx + 6 * z, fy - 16 * z, 2 * z, 1 * z, 8 * z, '#6b4f3a', null, 0);
      smoke(fx + 6 * z, fy - 26 * z, z, now, true);
      const [ax, ay] = S(30, 30);
      g.fillStyle = C('#4a4a58'); g.fillRect(ax - 1.4 * z, ay - 4 * z, 2.8 * z, 4 * z);
      poly([[ax - 4 * z, ay - 4 * z], [ax + 4 * z, ay - 4 * z], [ax + 3 * z, ay - 6 * z], [ax - 3 * z, ay - 6 * z]], C('#5a5a68'));
    }
    if (stage >= 3) {                                          // Glockenturm auf dem Nebengipfel
      const [tx, ty] = S(p2[0], p2[1] + 4);
      const T = kit(tx, ty, z, 0);
      for (const [a, b] of [[-0.06, -0.06], [0.06, -0.06], [0.06, 0.06], [-0.06, 0.06]]) { const p0 = T.P(a, b), p1x = T.P(a, b, 16); g.strokeStyle = C('#8a5a3c'); g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1x); g.stroke(); }
      T.block({ ha: 0.1, hb: 0.1, h: 0.1, lift: 16, wall: '#8a5a3c', roof: '#c65a45', roofH: 8 });
      const sw = Math.sin(now / 600) * 0.4, [bx, by] = T.P(0, 0, 13);
      g.save(); g.translate(bx, by - 2 * z); g.rotate(sw); g.beginPath(); g.moveTo(-2.4 * z, 3 * z); g.quadraticCurveTo(0, -4 * z, 2.4 * z, 3 * z); g.closePath(); g.fillStyle = C('#e9a23b'); g.fill(); g.restore();
    }
  },

  // Alte Ruine: antiker Tempel auf einem Steinsockel – gebrochene Säulen, umgestürzte Säule, Efeu.
  // Stufe 1 Ausgrabung (Grube, Zelt, Schubkarre), 2 Museum (kleiner Tempel), 3 wieder aufgebautes Amphitheater
  ruine(K, stage, now, x, y) {
    if (stage >= 3) { amphitheater(K, now, x, y); return; }
    const z = K.z, dim = stage <= 0;
    if (groundPart(() => {
      K.oval(0, 0, 0.95, C('#a9cf86'));
      K.rect(-0.55, -0.75, 0.45, 0.6, C('#cfc6b3'));                            // Sockel
      K.rect(-0.5, -0.7, 0.4, 0.55, C('#e5dccb'));
      g.strokeStyle = C('#d2c8b4'); g.lineWidth = 0.8 * z; g.beginPath();
      for (let i = 1; i < 5; i++) { const a0 = K.P(-0.5 + i * 0.18, -0.7), a1 = K.P(-0.5 + i * 0.18, 0.55); g.moveTo(...a0); g.lineTo(...a1); }
      g.stroke();
      if (stage >= 1) { K.rect(0.5, -0.45, 0.85, 0.05, C('#8a7456')); K.rect(0.55, -0.4, 0.8, 0, C('#6f5c44')); }   // Ausgrabungsgrube
    })) return;
    // Säule: Schaft (links hell, rechts im Schatten), Kapitell, Efeu; h = Höhe (gebrochen = niedrig)
    const column = (a, b, h, ivy) => {
      const [px, py] = K.P(a, b), w = 3.2 * z, H = h * z;
      g.fillStyle = C(dim ? '#b8b0a2' : '#f1e9da'); g.fillRect(px - w, py - H, w, H);
      g.fillStyle = C(dim ? '#9f978a' : '#d6ccb8'); g.fillRect(px, py - H, w, H);
      ellipse(px, py - H, w, w * 0.45, C(dim ? '#c9c1b3' : '#faf4e8'));
      if (h > 20) box(px, py - H, w * 1.25, w * 0.6, 2 * z, dim ? '#c9c1b3' : '#faf4e8', null, 0);
      if (ivy) for (let i = 0; i < 4; i++) circle(px - w * 0.4 + (i % 2) * w * 0.8, py - H * (0.2 + i * 0.18), 1.8 * z, C('#62b85a'));
    };
    const parts = [];
    // hintere Reihe: zwei heile Säulen mit Querbalken, dann gebrochene
    parts.push([-0.45, -0.45, () => {
      column(-0.42, -0.6, 30, false); column(-0.42, -0.2, 30, true);
      const a0 = K.P(-0.42, -0.66, 32), a1 = K.P(-0.42, -0.14, 32);
      poly([[a0[0] - 4 * z, a0[1]], [a1[0] + 4 * z, a1[1]], [a1[0] + 4 * z, a1[1] - 5 * z], [a0[0] - 4 * z, a0[1] - 5 * z]], C(dim ? '#c9c1b3' : '#efe6d6'));
    }]);
    parts.push([-0.42, 0.25, () => column(-0.42, 0.22, 14, true)]);
    parts.push([0.05, -0.62, () => column(0.02, -0.62, 20, false)]);
    parts.push([0.1, 0.35, () => column(0.1, 0.4, 9, false)]);
    parts.push([0.1, -0.1, () => {                               // umgestürzte Säule
      const p0 = K.P(-0.1, -0.25, 3), p1 = K.P(0.3, 0.05, 3);
      g.strokeStyle = C(dim ? '#b8b0a2' : '#ebe2d2'); g.lineWidth = 6 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
      ellipse(p1[0], p1[1], 3 * z, 3 * z, C(dim ? '#9f978a' : '#d6ccb8'));
      for (const [a, b] of [[0.35, -0.3], [-0.2, 0.45], [0.3, 0.45]]) kCrate(K, a, b, dim ? '#b8b0a2' : '#e5dccb', 1.2);
    }]);
    if (dim) for (let i = 0; i < 6; i++) parts.push([0.5, -0.6 + i * 0.25, () => kitBush(K, 0.55, -0.6 + i * 0.25, 0.8, '#7d9a55')]);
    if (stage >= 1) {
      parts.push([0.75, -0.75, () => {                           // Zelt der Ausgräber
        const [tx, ty] = K.P(0.72, -0.75), zz = z;
        poly([[tx - 10 * zz, ty], [tx, ty - 12 * zz], [tx + 3 * zz, ty + 3 * zz]], C('#f3e6c8'));
        poly([[tx + 3 * zz, ty + 3 * zz], [tx, ty - 12 * zz], [tx + 10 * zz, ty - 1 * zz]], C('#d9c7a2'));
      }]);
      parts.push([0.9, 0.2, () => {                              // Schubkarre und Seil-Pflöcke
        const [wx, wy] = K.P(0.92, 0.2);
        poly([[wx - 4 * z, wy - 5 * z], [wx + 4 * z, wy - 5 * z], [wx + 3 * z, wy - 1 * z], [wx - 3 * z, wy - 1 * z]], C('#6b7a8f'));
        circle(wx + 3 * z, wy, 1.6 * z, C('#3b3440'));
        for (const [a, b] of [[0.48, -0.5], [0.88, -0.5], [0.88, 0.1]]) kPost(K, a, b, 5, '#8a5a3c', 1);
      }]);
    }
    if (stage >= 2) parts.push([-0.75, 0.6, () => {              // Museum: kleiner Tempel mit Giebel
      const B = K.block({ a: -0.72, b: 0.62, ha: 0.2, hb: 0.28, h: 14, wall: '#f5eee0', roof: '#b9a5d6', roofH: 7, ridge: 'b', entry: true });
      kColumns(B, 'front', 4, z);
      K.door(B, 'front', 0.42, 0.58, 0.6);
    }]);
    K.scene(parts);
  },
};

// Das wieder aufgebaute Amphitheater (Alte Ruine, Stufe 3): steinerne Sitzreihen im Halbkreis, die nach hinten
// ansteigen, runde Bühne (Orchestra) mit Mosaik, vorn eine Säulenhalle; Zuschauer, Fahnen, nachts Fackeln
const AMPHI = { cu: 0.15, r0: 0.55, rN: 1.42, n: 5, step: 5 };
function amphitheater(K, now, x, y) {
  const z = K.z, { cu, r0, rN, n, step } = AMPHI, lit = night > 0.15 && isLive();
  const R = k => r0 + (rN - r0) * k / n;                       // Radius der k-ten Stufenkante
  const arc = (r, up, a0 = Math.PI / 2, a1 = Math.PI * 1.5, m = 18) => {
    const out = [];
    for (let i = 0; i <= m; i++) { const an = a0 + (a1 - a0) * i / m; out.push(K.P(cu + Math.cos(an) * r, Math.sin(an) * r, up)); }
    return out;
  };
  if (groundPart(() => {
    K.oval(0, 0, 1.5, C('#a9cf86'));
    kPave(K, () => kRectPath(K, -1.45, -1.45, 1.45, 1.45), PATH_LOOK.platten, x, y, 2);
    K.oval(cu, 0, r0, C('#e9dcc4'));                                          // Orchestra mit Mosaik-Ringen
    K.oval(cu, 0, r0 * 0.72, C('#d99a73'));
    K.oval(cu, 0, r0 * 0.5, C('#f3e6cf'));
    K.oval(cu, 0, r0 * 0.2, C('#d99a73'));
  })) return;
  // Sitzreihen von hinten (hoch) nach vorn: Oberseite, dann die Stufe darunter
  for (let k = n - 1; k >= 0; k--) {
    const top = (k + 1) * step;
    poly(arc(R(k + 1), top).concat(arc(R(k), top).reverse()), C(k % 2 ? '#efe6d6' : '#e7ddca'));
    poly(arc(R(k), top).concat(arc(R(k), k * step).reverse()), C('#cfc4ae'));
  }
  // Stirnseiten der Sitzreihen (Treppenprofil) an den beiden Enden, wenn sie zum Betrachter zeigen
  for (const sb of [1, -1]) {
    if (K.facing(0, sb) <= 0.01) continue;
    const pts = [K.P(cu, sb * rN, 0), K.P(cu, sb * r0, 0)];
    for (let k = 0; k < n; k++) pts.push(K.P(cu, sb * R(k), (k + 1) * step), K.P(cu, sb * R(k + 1), (k + 1) * step));
    poly(pts, K.wallCol('#e2d8c4', [0, sb]));
  }
  // Zuschauer auf den Stufen (fest verteilt, wippen leicht)
  for (let i = 0; i < 14; i++) {
    const k = Math.floor(hash(x + i, y, 71) * n), an = Math.PI / 2 + (0.12 + hash(x, y + i, 72) * 0.76) * Math.PI;
    const r = (R(k) + R(k + 1)) / 2, [px, py] = K.P(cu + Math.cos(an) * r, Math.sin(an) * r, (k + 1) * step);
    const bob = Math.abs(Math.sin(now / 260 + i)) * 0.8 * z;
    ellipse(px, py - 3 * z - bob, 2.3 * z, 2.8 * z, C(SHIRTS[i % SHIRTS.length]));
    circle(px, py - 7 * z - bob, 1.8 * z, C(FUR[i % FUR.length]));
  }
  const parts = [];
  // Säulenhalle vorn: Bühne mit Holzboden, Säulen und Gebälk (niedrig und luftig, damit man die Ränge sieht)
  parts.push([1.15, 0, () => {
    K.block({ a: 1.12, b: 0, ha: 0.2, hb: 1.05, h: 5, wall: '#d8cebb', type: 'flat', roof: '#c9a26f' });
    for (let i = 0; i < 7; i++) {
      const b = -0.95 + i * (1.9 / 6), [px, py] = K.P(1.22, b, 5), w = 2.6 * z, H = 26 * z;
      g.fillStyle = C('#f5eee0'); g.fillRect(px - w, py - H, w, H);
      g.fillStyle = C('#dcd2bf'); g.fillRect(px, py - H, w, H);
    }
    K.block({ a: 1.22, b: 0, ha: 0.09, hb: 1.05, h: 5, lift: 31, wall: '#f5eee0', type: 'flat', roof: '#fbf6ec' });
    K.poly([[1.22 - 0.09, -1.05], [1.22 + 0.09, -1.05], [1.22 + 0.09, 1.05], [1.22 - 0.09, 1.05]], C('#b9a5d6'), 36);
  }]);
  // Fahnen und Fackeln an den Enden der Ränge
  for (const sb of [1, -1]) parts.push([cu, sb * (rN + 0.02), () => {
    const [px, py] = kPost(K, cu, sb * (rN + 0.02), 32), wv = Math.sin(now / 300 + sb) * 1.5 * z;
    poly([[px, py], [px + 9 * z, py + 2 * z + wv], [px, py + 6 * z]], C(sb > 0 ? '#e8705f' : '#5f8fe8'));
  }]);
  for (const [a, b] of [[0.9, 1.25], [0.9, -1.25]]) parts.push([a, b, () => {
    const [px, py] = kPost(K, a, b, 14, '#6b4f3a', 1.4), fl = 1 + Math.sin(now / 120 + a * 7 + b) * 0.15;
    ellipse(px, py - 3 * z * fl, 2.2 * z, 3.4 * z * fl, lit ? '#ffb347' : C('#8a6440'));
    if (lit) { ellipse(px, py - 3.6 * z * fl, 1.2 * z, 2 * z * fl, '#fff3b0'); glowQuad([[px - 2, py - 6 * z], [px + 2, py - 6 * z], [px + 2, py], [px - 2, py]], 30 * z); }
  }]);
  // eine kleine Vorstellung auf der Orchestra
  parts.push([cu, 0, () => {
    const [px, py] = K.P(cu, 0), hop = Math.abs(Math.sin(now / 350)) * 2.5 * z;
    ellipse(px, py - 4 * z - hop, 3 * z, 3.6 * z, C('#f2c14e'));
    circle(px, py - 9.5 * z - hop, 2.3 * z, C('#fffaf2'));
    if (lit) glowQuad([[px - 6, py - 12 * z], [px + 6, py - 12 * z], [px + 6, py], [px - 6, py]], 26 * z);
  }]);
  K.scene(parts);
}
