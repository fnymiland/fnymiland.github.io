'use strict';
// ---------------------------------------------------------------------------
// Wunderwerke: Baustelle (Zaun, Material, Gerüst, das Bauwerk wächst von unten) und die fertigen Bauwerke
// ---------------------------------------------------------------------------
// Rundbauten in Bildschirm-Koordinaten: (x, y) = Mitte unten, rx/ry = Radien, h = Höhe (Pixel)
function cyl(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.lineTo(x - rx, y - h); g.lineTo(x + rx, y - h); g.closePath(); g.fill();
  g.fillStyle = C(shade(col, LIGHT.side));
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y - h); g.lineTo(x + rx, y - h); g.closePath(); g.fill();
  ellipse(x, y - h, rx, ry, C(shade(col, 0.06)));
}
function cone(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.lineTo(x, y - h); g.closePath(); g.fill();
  g.fillStyle = C(shade(col, LIGHT.roofShade));
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y - h); g.closePath(); g.fill();
}
function dome(x, y, rx, ry, h, col) {
  g.fillStyle = C(col);
  g.beginPath(); g.ellipse(x, y, rx, h, 0, Math.PI, 0); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.fill();
  g.fillStyle = C(shade(col, -0.12));
  g.beginPath(); g.ellipse(x, y, rx, h, 0, -Math.PI / 2, 0); g.ellipse(x, y, rx, ry, 0, 0, Math.PI / 2); g.lineTo(x, y); g.closePath(); g.fill();
}
function pennant(x, y, z, now, col) {
  g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9 * z); g.stroke();
  const w = Math.sin(now / 260 + x) * 1.5 * z;
  poly([[x, y - 9 * z], [x + 7 * z, y - 7.5 * z + w], [x, y - 5.5 * z]], C(col));
}

const PLANK_LOOK = { fill: '#c89a6a', pat: ['planks', '#a97d52'] };        // Holzbohlen (Zugbrücke)
// Boden mit Wegbelag (Muster wie die Wege) in einer Fläche: clip zeichnet den Umriss (Pfad) im Rahmen K
function kPave(K, clip, lk, x, y, ext = 3, evenodd = false) {
  g.save(); g.beginPath(); clip(); evenodd ? g.clip('evenodd') : g.clip();
  paintLook(p => K.P(p[0], p[1]), lk, x, y, K.z, false, ext);
  g.restore();
}
const kRectPath = (K, a0, b0, a1, b1) => { [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].forEach(([a, b], i) => { const q = K.P(a, b); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
const kOvalPath = (K, a, b, r) => { const [x, y] = K.P(a, b); g.moveTo(x + r * Math.SQRT2 * TW / 2 * K.z, y); g.ellipse(x, y, r * Math.SQRT2 * TW / 2 * K.z, r * Math.SQRT2 * TH / 2 * K.z, 0, 0, Math.PI * 2); };
// Blumenbeet: Erde und bunte Tupfen
function kBed(K, a, b, r, seed) {
  K.oval(a, b, r, C('#a8764c'));
  for (let i = 0; i < 9; i++) {
    const ang = i * 2.4 + seed, rr = r * 0.6 * Math.sqrt((i + 1) / 9), [fx, fy] = K.P(a + Math.cos(ang) * rr, b + Math.sin(ang) * rr);
    circle(fx, fy - 1 * K.z, 1.9 * K.z, C(FLOWER_COLS[(i + seed) % FLOWER_COLS.length]));
  }
}
// Zinnen: eine Zackenlinie oben auf den sichtbaren Wänden eines Blocks (eine Fläche je Wand – spart Zeichenaufrufe)
function kMerlons(B, z, col, n, hgt = 5) {
  for (const F of Object.values(B.faces)) {
    if (!F) continue;
    const top = p => [p[0], p[1] - F.H], pts = [top(F.P)];
    for (let i = 0; i < n; i++) {
      const p0 = top(lerp(F.P, F.Q, (i + 0.15) / n)), p1 = top(lerp(F.P, F.Q, (i + 0.65) / n));
      pts.push(p0, [p0[0], p0[1] - hgt * z], [p1[0], p1[1] - hgt * z], p1);
    }
    pts.push(top(F.Q));
    poly(pts.concat([[F.Q[0], F.Q[1] - F.H + 0.5], [F.P[0], F.P[1] - F.H + 0.5]]), C(col));
  }
}
// runder Turm mit Fenstern und Spitzdach, Fahne oben (x, y = Fuß in Bildschirm-Koordinaten)
function roundTower(x, y, z, now, rx, H, roofH, wall, roof, lit, flag) {
  cyl(x, y, rx, rx / 2, H, wall);
  for (const f of [0.3, 0.55, 0.8]) if (H * f < H - 6 * z) {
    const wy = y + rx * 0.2 - H * f;
    poly([[x - 2 * z, wy], [x + 2 * z, wy], [x + 2 * z, wy - 5.5 * z], [x - 2 * z, wy - 5.5 * z]], lit ? '#ffd873' : C('#a8dcff'));
    if (lit) glowQuad([[x - 2, wy - 5 * z], [x + 2, wy - 5 * z], [x + 2, wy], [x - 2, wy]], 14 * z);
  }
  cone(x, y - H, rx * 1.2, rx * 0.6, roofH, roof);
  if (flag) pennant(x, y - H - roofH, z, now, flag);
}

const WONDER_ART = {
  // Riesenrad (5×5): runder Platz mit Beeten, großes Rad mit 16 Gondeln (dreht sich, Gondeln hängen gerade),
  // Einstiegsplattform, Kassenhäuschen und Zuckerwatte-Stand; nachts eine bunte Lichterkette
  riesenrad(K, cx, cy, z, now, x, y) {
    if (groundPart(() => {
      K.rect(-2.48, -2.48, 2.48, 2.48, C('#8ccb67'));
      kPave(K, () => kOvalPath(K, 0, 0, 2.15), PATH_LOOK.platten, x, y);
      kPave(K, () => kRectPath(K, 1.7, -0.32, 2.48, 0.32), PATH_LOOK.platten, x, y);
      K.oval(0, 0, 0.95, C('#d8cfbd'));
      for (const [a, b, i] of [[-2.05, -2.05, 1], [-2.05, 2.05, 2], [2.05, -2.05, 3], [2.05, 2.05, 4]]) kBed(K, a, b, 0.38, i);
    })) return;
    kShadow(K, 1.7);
    const idle = T.rail.power.idle.has(x + ',' + y);                          // ohne Strom: Rad steht, Lichter aus
    const R = 86 * z, hx = cx, hy = cy - 120 * z, rot = idle ? 0.12 : now / 11000, lit = night > 0.15 && isLive() && !idle;
    const leg = (bx, by, w, col) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.lineTo(hx, hy); g.stroke(); };
    const wheel = () => {
      cyl(cx, cy + 2 * z, 34 * z, 17 * z, 6 * z, '#e8e2d6');                            // Einstiegsplattform
      leg(cx - R * 0.62, cy - 8 * z, 4.5, '#dcd6ca'); leg(cx + R * 0.62, cy - 8 * z, 4.5, '#dcd6ca');   // hintere Stützen
      g.strokeStyle = C('#f4f1ea'); g.lineWidth = 3.2 * z;
      g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.6 * z; g.beginPath(); g.arc(hx, hy, R * 0.9, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1 * z; g.beginPath(); g.arc(hx, hy, R * 0.3, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1 * z; g.beginPath();
      for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2; g.moveTo(hx + Math.cos(a) * R * 0.3, hy + Math.sin(a) * R * 0.3); g.lineTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); }
      g.stroke();
      const cols = ['#e8604f', '#6f8fd8', '#f2c14e', '#58b36a', '#f28cb1', '#b07ad6', '#5fc4c9', '#f29a5a'];
      for (let i = 0; i < 16; i++) {                                              // Gondeln
        const a = rot + i / 16 * Math.PI * 2, gx = hx + Math.cos(a) * R, gy = hy + Math.sin(a) * R, col = cols[i % cols.length];
        g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 4 * z); g.stroke();
        ellipse(gx, gy + 4 * z, 6.2 * z, 2.2 * z, C(shade(col, -0.18)));                // Dach
        poly([[gx - 5.6 * z, gy + 4.5 * z], [gx + 5.6 * z, gy + 4.5 * z], [gx + 4.6 * z, gy + 14 * z], [gx - 4.6 * z, gy + 14 * z]], C(col));
        poly([[gx - 3.8 * z, gy + 6 * z], [gx + 3.8 * z, gy + 6 * z], [gx + 3.4 * z, gy + 9.6 * z], [gx - 3.4 * z, gy + 9.6 * z]], lit ? '#ffd873' : C('#e6f4ff'));
      }
      circle(hx, hy, 7 * z, C('#d9534a')); circle(hx, hy, 3 * z, C('#f4f1ea'));
      leg(cx - R * 0.8, cy + 10 * z, 5, '#f4f1ea'); leg(cx + R * 0.8, cy + 10 * z, 5, '#f4f1ea');   // vordere Stützen
      if (lit) for (let i = 0; i < 32; i++) {
        const a = rot + i / 32 * Math.PI * 2, lx = hx + Math.cos(a) * R, ly = hy + Math.sin(a) * R;
        circle(lx, ly, 1.4 * z, ['#ffe58a', '#ff9fc4', '#9fdcf7'][i % 3]);
        glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 12 * z);
      }
    };
    const booth = (a, b, roof) => () => {
      const B = K.block({ a, b, ha: 0.22, hb: 0.22, h: 14, wall: '#fffaf0', roof, roofH: 9 });
      K.door(B, 'front', 0.25, 0.75, 0.7, '#6f8fd8'); K.door(B, 'right', 0.25, 0.75, 0.7, '#6f8fd8');
    };
    const lamp = (a, b) => () => { const [lx, ly] = K.P(a, b); lampPost(lx, ly, z, 20); };
    K.scene([
      [-2.0, -1.2, () => kitTree(K, -2.0, -1.2, 1.1)], [-1.2, -2.0, () => kitTree(K, -1.2, -2.0, 1.1)],
      [0, 0, wheel],
      [1.75, 1.35, booth(1.75, 1.35, '#e8604f')], [1.75, -1.35, booth(1.75, -1.35, '#f28cb1')],
      [2.1, 0.55, lamp(2.1, 0.55)], [2.1, -0.55, lamp(2.1, -0.55)],
    ]);
  },
  // Sternwarte (3×3): Terrasse aus Kopfstein, hoher runder Turm mit Umgang und großer Kuppel; nachts öffnet sich
  // der Spalt und das Fernrohr schaut heraus. Daneben das Institut mit Walmdach
  sternwarte(K, cx, cy, z, now, x, y) {
    if (groundPart(() => {
      K.rect(-1.48, -1.48, 1.48, 1.48, C('#8ccb67'));
      kPave(K, () => kOvalPath(K, -0.2, 0.05, 1.05), PATH_LOOK.kopf, x, y, 2);
      kPave(K, () => kRectPath(K, 0.7, -0.32, 1.48, 0.32), PATH_LOOK.kopf, x, y, 2);
      kBed(K, 1.1, 1.1, 0.28, 2); kBed(K, -1.15, 1.15, 0.26, 4);
    })) return;
    kShadow(K, 1.05);
    const lit = night > 0.15 && isLive();
    const tower = () => {
      const [x0, y0] = K.P(-0.2, 0.05), rx = 36 * z, ry = 18 * z, H = 46 * z;
      cyl(x0, y0, rx, ry, H, '#f6efe2');
      g.fillStyle = C('#e6dccb'); g.beginPath(); g.ellipse(x0, y0 - H * 0.52, rx, ry, 0, 0, Math.PI); g.lineTo(x0 - rx, y0 - H * 0.52 - 3 * z); g.ellipse(x0, y0 - H * 0.52 - 3 * z, rx, ry, 0, Math.PI, 0, true); g.fill();   // Gesims
      for (const dx of [-22, -8, 6, 20]) for (const f of [[0.12, 0.42], [0.62, 0.9]]) faceQuadRect(x0 + dx * z, y0 + ry * 0.75 * Math.sqrt(Math.max(0, 1 - (dx * z / rx) ** 2)), 5.5 * z, H * f[0], H * f[1], lit);
      ellipse(x0, y0 - H, rx * 1.16, ry * 1.16, C('#d8cfbd'));                        // Umgang
      g.strokeStyle = C('#f4f1ea'); g.lineWidth = 0.9 * z; g.beginPath();
      for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, px = x0 + Math.cos(a) * rx * 1.14, py = y0 - H + Math.sin(a) * ry * 1.14; g.moveTo(px, py); g.lineTo(px, py - 6 * z); }
      g.stroke();
      g.beginPath(); g.ellipse(x0, y0 - H - 6 * z, rx * 1.14, ry * 1.14, 0, 0, Math.PI); g.stroke();
      const dh = 36 * z, top = y0 - H - dh;
      dome(x0, y0 - H, rx * 0.92, ry * 0.92, dh, '#cfd8e3');
      g.strokeStyle = C('#b9c4d2'); g.lineWidth = 0.9 * z;
      g.beginPath(); g.ellipse(x0, y0 - H, rx * 0.5, dh, 0, Math.PI, Math.PI * 2); g.stroke();   // Rippen
      if (lit) {
        poly([[x0 - 5 * z, y0 - H - 3 * z], [x0 + 5 * z, y0 - H - 3 * z], [x0 + 4 * z, top + 1 * z], [x0 - 4 * z, top + 1 * z]], '#2c3245');
        g.strokeStyle = '#5a6278'; g.lineWidth = 6 * z; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0 - H - 16 * z); g.lineTo(x0 + 14 * z, top - 12 * z); g.stroke();
        for (let i = 0; i < 6; i++) { const tw = (Math.sin(now / 500 + i * 1.7) + 1) / 2; circle(x0 - 30 * z + i * 12 * z, top - 18 * z - (i % 2) * 9 * z, (0.7 + tw) * z, `rgba(255,248,200,${0.4 + tw * 0.6})`); }
      } else {
        g.strokeStyle = C('#aab5c2'); g.lineWidth = 4 * z; g.lineCap = 'butt';
        g.beginPath(); g.moveTo(x0, y0 - H - 1 * z); g.lineTo(x0, top + 1 * z); g.stroke();
      }
      circle(x0, top - 1.5 * z, 2.2 * z, C('#f2c14e'));
    };
    const annex = () => {
      const B = K.block({ a: 0.78, b: -0.78, ha: 0.42, hb: 0.42, h: 20, wall: '#f3e1c4', roof: '#6f8fd8', roofH: 12, entry: true });
      K.door(B, 'front', 0.4, 0.6, 0.55);
      K.wins(B, 'front', 3, 0.35, 0.72, 0.1, 0.9, [1]);
      K.sideWins(B, 2, 0.35, 0.72);
    };
    K.scene([[-1.1, -1.1, () => kitTree(K, -1.15, -1.1, 1)], [-0.2, 0.05, tower], [0.78, -0.78, annex],
      [1.2, 0.45, () => { const [lx, ly] = K.P(1.2, 0.45); lampPost(lx, ly, z, 18); }]]);
  },
  // Seebrücke: Holzsteg auf Pfählen vom Ufer ins Meer, Geländer und Laternen, am Ende ein runder Pavillon
  seebruecke(K, cx, cy, z, now) {
    if (groundPart(() => {})) return;
    const Wb = 0.26;
    const deck = () => {
      for (let a = -1.7; a <= 1.9; a += 0.45) for (const s of [-1, 1]) {
        const [px, py] = K.P(a, s * Wb);
        g.fillStyle = C('#6f5238'); g.fillRect(px - 1.2 * z, py - 5 * z, 2.4 * z, 9 * z);
      }
      K.rect(-2, -Wb - 0.02, 1.3, Wb + 0.02, C('#8a6440'), 3);
      K.rect(-2, -Wb, 1.3, Wb, C('#c29a6a'), 5);
      g.strokeStyle = C('#a57c52'); g.lineWidth = 0.6 * z; g.beginPath();
      for (let a = -1.9; a < 1.3; a += 0.14) { const p = K.P(a, -Wb, 5), q = K.P(a, Wb, 5); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
      for (const s of [-1, 1]) {
        kLine(K, K.P(-2, s * Wb, 11), K.P(1.3, s * Wb, 11), '#f4f1ea', 1);
        for (let a = -2; a <= 1.3; a += 0.33) kLine(K, K.P(a, s * Wb, 5), K.P(a, s * Wb, 11), '#f4f1ea', 0.8);
      }
      for (const a of [-1.2, 0.2]) { const [lx, ly] = K.P(a, Wb, 5); lampPost(lx, ly, z, 14); }
    };
    const pav = () => {
      const [px, py] = K.P(1.6, 0, 5);
      ellipse(px, py, 22 * z, 11 * z, C('#8a6440'));
      ellipse(px, py - 2 * z, 22 * z, 11 * z, C('#c29a6a'));
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2, x0 = px + Math.cos(a) * 17 * z, y0 = py - 2 * z + Math.sin(a) * 8.5 * z;
        g.strokeStyle = C('#f4f1ea'); g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 - 14 * z); g.stroke();
      }
      cone(px, py - 16 * z, 24 * z, 12 * z, 14 * z, '#6f8fd8');
      circle(px, py - 30 * z, 1.8 * z, C('#f2c14e'));
    };
    K.scene([[-0.4, 0, deck], [1.6, 0, pav]]);
  },
  // Botanischer Garten (5×5): Rasen mit Wegen so breit wie normale Wege (Rundweg und Zugang), Beete, Teich, Hecken;
  // in der Mitte das Palmenhaus aus Glas (Rotunde mit Kuppel) mit zwei Glasflügeln
  botgarten(K, cx, cy, z, now, x, y) {
    if (groundPart(() => {
      K.rect(-2.48, -2.48, 2.48, 2.48, C('#8ccb67'));
      kPave(K, () => { kRectPath(K, -2.2, -2.2, 2.2, 2.2); kRectPath(K, -1.56, -1.56, 1.56, 1.56); }, PATH_LOOK.sand, x, y, 3, true);   // Rundweg
      kPave(K, () => kRectPath(K, 0.6, -0.32, 2.48, 0.32), PATH_LOOK.sand, x, y);             // Zugang
      K.oval(-1.05, -1.05, 0.42, C('#5fb8d0')); K.oval(-1.05, -1.05, 0.36, C('#74d0e6'));    // Teich
      for (const [a, b] of [[-1.2, -0.85], [-0.9, -1.25]]) K.oval(a, b, 0.06, C('#8fd48a'));   // Seerosen
      for (const [a, b, i] of [[1.1, 1.1, 1], [1.1, -1.1, 2], [-1.1, 1.1, 3], [-2.35, 0, 4], [0, 2.35, 0], [0, -2.35, 2]]) kBed(K, a, b, 0.3, i);
    })) return;
    kShadow(K, 1.5);
    const lit = night > 0.15 && isLive(), glass = lit ? '#ffe7a8' : '#cbecf8';
    const wing = b0 => () => {
      const [wx, wy] = K.P(0, b0);
      BUILDING_ART.glashaus(kit(wx, wy, z, K.r), 1, now, x, y, {});
    };
    const rotunda = () => {
      const [x0, y0] = K.P(0, 0), rx = 38 * z, ry = 19 * z, H = 32 * z;
      cyl(x0, y0, rx, ry, H, glass);
      for (let i = 0; i < 9; i++) {                                               // Palmen hinter dem Glas
        const px = x0 - rx * 0.85 + i * rx * 0.21, py = y0 - 3 * z;
        g.strokeStyle = lit ? 'rgba(96,120,58,0.8)' : C('#6a9a4a'); g.lineWidth = 1.6 * z;
        g.beginPath(); g.moveTo(px, py + 4 * z); g.lineTo(px, py - 20 * z); g.stroke();
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(px, py - 20 * z); g.quadraticCurveTo(px + s * 7 * z, py - 26 * z, px + s * 11 * z, py - 17 * z); g.stroke(); }
      }
      g.strokeStyle = C('#ffffff'); g.lineWidth = 1.2 * z;
      g.beginPath();
      for (let i = 0; i <= 10; i++) { const px = x0 - rx + i * rx / 5; g.moveTo(px, y0 + Math.sqrt(Math.max(0, 1 - ((px - x0) / rx) ** 2)) * ry); g.lineTo(px, y0 - H); }
      g.stroke();
      ellipse(x0, y0 - H, rx * 1.04, ry * 1.04, C('#f4f1ea'));                       // Kranz
      dome(x0, y0 - H - 1 * z, rx, ry, 36 * z, lit ? '#fff0c4' : '#e0f5fc');
      g.strokeStyle = C('#ffffff'); g.lineWidth = 1.1 * z;
      for (let i = 1; i < 7; i++) { g.beginPath(); g.ellipse(x0, y0 - H - 1 * z, rx * i / 7, 36 * z, 0, Math.PI, 0); g.stroke(); }
      circle(x0, y0 - H - 38 * z, 2.4 * z, C('#f2c14e'));
      if (lit) glowQuad([[x0 - rx * 0.6, y0 - H * 0.8], [x0 + rx * 0.6, y0 - H * 0.8], [x0 + rx * 0.6, y0 - H * 0.2], [x0 - rx * 0.6, y0 - H * 0.2]], 22 * z);
    };
    const hedge = (a, b, ha, hb) => () => K.block({ a, b, ha, hb, h: 6, wall: '#58ad52', type: 'flat', roof: '#6cc062' });
    const lamp = (a, b) => () => { const [lx, ly] = K.P(a, b); lampPost(lx, ly, z, 18); };
    K.scene([
      [-2.38, 0, hedge(-2.38, 0, 0.08, 2.3)], [0, -2.38, hedge(0, -2.38, 2.3, 0.08)],
      [0, 2.38, hedge(0, 2.38, 2.3, 0.08)], [2.38, -1.4, hedge(2.38, -1.4, 0.08, 0.95)], [2.38, 1.4, hedge(2.38, 1.4, 0.08, 0.95)],
      [-2.3, -2.3, () => kitTree(K, -2.3, -2.3, 1.1, '#ff6b5e')], [-2.3, 2.3, () => kitTree(K, -2.3, 2.3, 1)], [2.3, -2.3, () => kitTree(K, 2.3, -2.3, 1)],
      [0, -1.2, wing(-1.2)], [0, 0, rotunda], [0, 1.2, wing(1.2)],
      [1.9, 0.5, lamp(1.9, 0.5)], [1.9, -0.5, lamp(1.9, -0.5)], [2.3, 2.3, () => kitTree(K, 2.3, 2.3, 1, '#ffd36e')],
    ]);
  },
  // Schloss (7×7, Block 60j): Königsschloss im Stil des Märchenschlosses, eine Klasse größer – Wassergraben mit Zugbrücke,
  // Mauer mit Ecktürmen und Torhaus, Hof mit Brunnen, hinten das Palais mit gestaffelten Türmen und dem höchsten Turm
  // samt Königskrone; Wachen am Tor. stage = fertige Bauabschnitte (0 … 6): beim Bauen wächst es Stück für Stück.
  // Nach der Einweihung: Fassade/Dach (t.wall/t.roof) und Dachform (t.cs.r: 0 Spitz, 1 Kuppel, 2 Zinnen) im Fenster.
  schloss(K, cx, cy, z, now, x, y, t, hu, hv, stage = 6) {
    if (groundPart(() => schlossGround(K, x, y, stage))) return;
    const done = stage >= 6, lit = night > 0.15 && isLive(), R = stage >= 4 ? royalRoof(t) : -1;
    const wall = fzCol(t, 'wall', '#f6e7d0'), roof = fzCol(t, 'roof', '#6f8fd8'), win = lit ? '#ffd873' : C('#a8dcff');
    const gold = done ? '#f2c14e' : shade(roof, 0.3);
    const ck = castleKit(K, z, now, x, { wall, roof, win, gold, flags: CASTLE_FLAG_SETS[0], lit, bk: done ? 1 : 0, lc: done ? 1 : 0, wp: 1 });
    if (stage >= 1) kShadow(K, 2.6);
    const roofOf = (gab = 'gable') => R === 0 ? { roof, roofH: 12, type: gab } : R === 1 ? { roof, roofH: 9, type: 'hip' } : { roof: shade(wall, -0.08), roofH: 0, type: 'flat' };
    // Palais: Mittelbau (Hauptturm obendrauf), Flügel, Turmpaare – in b nebeneinander, darum nach b sortiert
    const aP = -1.25, haP = 0.95, core = 0.85, hC = stage >= 5 ? 66 : stage >= 2 ? 26 : 5, hWg = stage >= 5 ? 48 : stage >= 2 ? 22 : 5;
    const wingAt = (b0, b1) => () => {
      const B = K.block({ a: aP + 0.4, b: (b0 + b1) / 2, ha: 0.5, hb: (b1 - b0) / 2, h: hWg, wall, ridge: 'b', over: 1.06, trim: R === 2 ? roof : stage >= 4 ? shade(roof, 0.15) : null, ...(stage >= 4 ? roofOf('hip') : { roof: shade(wall, -0.08), type: 'flat' }) });
      for (const side of ['front', 'back', 'left', 'right']) { const F = B.faces[side]; if (F && stage >= 2) for (let f = 0; f * 11 + 10 < hWg; f++) ck.archWins(F, Math.max(1, Math.round(ck.faceLen(B, side) * 2.6)), 5 + f * 11, 10.5 + f * 11); }
      if (R === 2) ck.merlons(B);
      if (done) ck.bulbs(B, R === 2 ? 0 : 1.5);
    };
    const center = () => {
      const B = K.block({ a: aP, b: 0, ha: haP, hb: core, h: hC, wall, roof: shade(wall, -0.08), type: 'flat', trim: done ? gold : null });
      for (const side of ['front', 'back', 'left', 'right']) {
        const F = B.faces[side];
        if (!F || stage < 2) continue;
        const n = Math.max(3, Math.round(ck.faceLen(B, side) * 2.4)), mid = side === 'front';
        for (let f = 0; f * 11 + 11 < hC; f++) ck.archWins(F, n, 6 + f * 11, 12.5 + f * 11, i => mid && f < 3 && Math.abs(i - (n - 1) / 2) < (f ? 0.6 : 1));
        if (mid) {                                         // großes Portal mit Balkon, darüber das Wappen mit Krone
          const A = lerp(F.P, F.Q, 0.38), Bq = lerp(F.P, F.Q, 0.62), rr = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) / 2;
          faceQuad(F.P, F.Q, 0.38, 0.62, 0, 15 * z, C(done ? '#c9962b' : shade(wall, -0.3)));
          circle((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 - 15 * z, rr, C(done ? '#c9962b' : shade(wall, -0.3)));
          faceQuad(F.P, F.Q, 0.41, 0.59, 0, 14 * z, C('#6b4630'));
          circle((A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2 - 14 * z, rr * 0.75, C('#6b4630'));
          if (stage >= 5) {
            faceQuad(F.P, F.Q, 0.3, 0.7, 19 * z, 20.5 * z, C(gold));
            const m = lerp(F.P, F.Q, 0.5);
            if (done) ck.shield(m[0], m[1] - 27 * z); else { circle(m[0], m[1] - 27 * z, 5 * z, C(gold)); circle(m[0], m[1] - 27 * z, 4 * z, win); }
          }
        }
      }
      if (stage >= 2) ck.merlons(B, 6);
      if (done) ck.bulbs(B, 0);
      if (stage >= 3) {
        const peak = ck.tower(aP, 0, 0.5, stage >= 5 ? 124 : 40, hC, 0, R, R >= 0, !done);   // der höchste Turm der Insel
        if (done) royalCrown(peak[0], peak[1] - (R === 0 ? 0 : 1) * z, z, now, lit);
      }
    };
    // Reihenfolge: ferne Seite von außen nach innen, Mittelbau, nahe Seite von innen nach außen. Der hintere Turm steht ganz
    // hinter seinem Flügel (vor ihm gezeichnet), der vordere schließt den Flügel außen ab.
    const palace = () => {
      if (stage >= 1) K.block({ a: aP, b: 0, ha: haP + 0.1, hb: 2.32, h: 3, wall: '#e3d6c2', roof: '#efe6d8', type: 'flat' });   // Sockel
      const near = K.facing(0, 1) > 0 ? 1 : -1, side = sg => {
        const t1 = () => stage >= 3 && ck.tower(aP - 0.5, sg * 1.3, 0.24, stage >= 5 ? 112 : 56, 0, 1, R, false, !done);
        const t2 = () => stage >= 3 && ck.tower(aP + 0.5, sg * 2.0, 0.26, stage >= 5 ? 92 : 48, 0, 2, R, false, !done);
        const wg = wingAt(Math.min(sg * 0.85, sg * 1.74), Math.max(sg * 0.85, sg * 1.74));
        return sg === near ? [t1, wg, t2] : [t2, t1, wg];
      };
      [...side(-near), center, ...side(near)].forEach(f => f());
    };
    const wallSeg = (a, b, ha, hb) => () => { const B = K.block({ a, b, ha, hb, h: 28, wall, type: 'flat', roof: shade(wall, -0.06) }); ck.merlons(B, 6); };
    const gate = () => {
      const B = K.block({ a: 2.62, b: 0, ha: 0.24, hb: 0.42, h: 40, wall, type: 'flat', roof: shade(wall, -0.06) });
      ck.merlons(B, 6);
      K.door(B, 'front', 0.28, 0.72, 0.6, '#4a3a30');
    };
    const fountain = () => {
      const [fx, fy] = K.P(1.15, 0);
      cyl(fx, fy, 16 * z, 8 * z, 5 * z, '#dcd6ca');
      ellipse(fx, fy - 5 * z, 13 * z, 6.5 * z, C('#74d0e6'));
      cyl(fx, fy - 5 * z, 3 * z, 1.5 * z, 10 * z, '#e6e0d3');
      circle(fx, fy - 16 * z, 2 * z, C(gold));
      for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + now / 900; circle(fx + Math.cos(an) * 6 * z, fy - 15 * z + Math.abs(Math.sin(now / 300 + i)) * 4 * z, 1.3 * z, C('#dff5fb')); }
    };
    const items = [];
    if (stage >= 2) items.push([-2.62, 0, wallSeg(-2.62, 0, 0.12, 2.5)], [0, -2.62, wallSeg(0, -2.62, 2.5, 0.12)], [0, 2.62, wallSeg(0, 2.62, 2.5, 0.12)],
      [2.62, -1.55, wallSeg(2.62, -1.55, 0.12, 0.95)], [2.62, 1.55, wallSeg(2.62, 1.55, 0.12, 0.95)], [2.63, 0, gate]);
    if (stage >= 3) {
      for (const [a, b] of [[-2.62, -2.62], [-2.62, 2.62], [2.62, -2.62], [2.62, 2.62]]) items.push([a, b, () => ck.tower(a, b, 0.34, stage >= 5 ? 76 : 50, 0, 3, R, false, !done)]);
      for (const sb of [-0.62, 0.62]) items.push([2.62, sb, () => ck.tower(2.62, sb, 0.2, 58, 0, 1, R, false, !done)]);
    }
    items.push([aP, 0, palace]);
    if (done) {
      items.push([1.15, 0, fountain], [1.9, 1.9, () => kitTree(K, 1.9, 1.9, 0.9)], [1.9, -1.9, () => kitTree(K, 1.9, -1.9, 0.9)]);
      for (const sg of [-1, 1]) { const b = sg * (0.42 + 0.14 * Math.sin(now / 1600)); items.push([2.2, b, () => royalGuard(K, 2.2, b, z, now, sg)]); }   // Wachen gehen auf und ab
    }
    K.scene(items);
  },
};
// Wunder-Schloss (Block 60j): Dachform, Boden, Krone, Wachen
const royalRoof = t => (t.cs && t.cs.r != null ? t.cs.r : 0);
function schlossGround(K, x, y, stage) {
  if (stage >= 6) K.rect(-3.48, -3.48, 3.48, 3.48, C('#8ccb67'));
  if (stage < 1) return;
  g.save(); g.beginPath(); kRectPath(K, -3.3, -3.3, 3.3, 3.3); kRectPath(K, -2.78, -2.78, 2.78, 2.78); g.clip('evenodd');
  K.rect(-3.3, -3.3, 3.3, 3.3, C('#5fb8d0')); K.rect(-3.22, -3.22, 3.22, 3.22, C('#74d0e6'));
  g.restore();
  if (stage < 2) return;
  kPave(K, () => kRectPath(K, -2.6, -2.6, 2.6, 2.6), PATH_LOOK.kopf, x, y, 3);
  K.rect(2.7, -0.4, 3.48, 0.4, C('#8a6440')); kPave(K, () => kRectPath(K, 2.7, -0.36, 3.48, 0.36), PLANK_LOOK, x, y, 3);   // Zugbrücke
  if (stage < 6) return;
  K.rect(0.4, -0.22, 2.55, 0.22, C('#e8604f'));                                   // roter Teppich vom Tor zum Palais
  for (const s of [-1, 1]) {                                                      // Gartenbeete im Hof
    K.rect(0.35, s * 0.55, 1.95, s * 1.95, C('#6cc062'));
    K.rect(0.45, s * 0.65, 1.85, s * 1.85, C('#8ccb67'));
    kBed(K, 1.15, s * 1.25, 0.28, s > 0 ? 1 : 3);
  }
}
function royalCrown(px, py, z, now, lit) {                                      // Königskrone auf dem Hauptturm
  const w = 6 * z, h = 7 * z, b0 = py - 1 * z, gold = C('#f2c14e');
  if (lit) glowQuad([[px - w, b0 - h], [px + w, b0 - h], [px + w, b0], [px - w, b0]], 26 * z);
  poly([[px - w, b0], [px + w, b0], [px + w * 1.1, b0 - h], [px + w * 0.5, b0 - h * 0.5], [px, b0 - h * 1.15], [px - w * 0.5, b0 - h * 0.5], [px - w * 1.1, b0 - h]], gold);
  poly([[px - w, b0], [px + w, b0], [px + w, b0 - 2 * z], [px - w, b0 - 2 * z]], C('#d9a82e'));
  for (const [dx, col] of [[-0.55, '#5f8fe8'], [0, '#e8604f'], [0.55, '#58b36a']]) circle(px + dx * w, b0 - 1 * z, 1 * z, C(col));
  for (const [dx, dy] of [[-1.1, 1], [0, 1.15], [1.1, 1]]) circle(px + dx * w, b0 - h * dy, 1.1 * z, C('#fffaf0'));
  if (lit) circle(px, b0 - h * 1.15, (1.6 + Math.sin(now / 400) * 0.4) * z, '#fff3b0');
}
function royalGuard(K, a, b, z, now, sg) {                                      // Wache: rote Jacke, hohe Bärenfellmütze
  const [px, py] = K.P(a, b), step = Math.sin(now / 200) * 0.6 * z;
  ellipse(px, py, 2.6 * z, 1.2 * z, 'rgba(40,60,20,0.2)');
  g.fillStyle = C('#2b2b3a'); g.fillRect(px - 1.3 * z, py - 5 * z, 1.1 * z, 5 * z + step); g.fillRect(px + 0.2 * z, py - 5 * z, 1.1 * z, 5 * z - step);
  g.fillStyle = C('#d4473b'); g.fillRect(px - 1.9 * z, py - 11.5 * z, 3.8 * z, 6.8 * z);
  g.fillStyle = C('#fffaf0'); g.fillRect(px - 1.9 * z, py - 7.2 * z, 3.8 * z, 0.8 * z);
  circle(px, py - 12.6 * z, 1.4 * z, C('#f2c9a0'));
  g.fillStyle = C('#22222c'); g.fillRect(px - 1.6 * z, py - 18 * z, 3.2 * z, 5 * z); circle(px, py - 18 * z, 1.6 * z, C('#22222c'));
  g.strokeStyle = C('#8a8a96'); g.lineWidth = 0.6 * z; g.beginPath(); g.moveTo(px + sg * 2.4 * z, py - 4 * z); g.lineTo(px + sg * 2.4 * z, py - 17 * z); g.stroke();   // Lanze
  circle(px + sg * 2.4 * z, py - 17.5 * z, 0.7 * z, C('#f2c14e'));
}
// kleines Fenster auf einem Rundbau (in Bildschirm-Koordinaten)
function faceQuadRect(x, y, w, h0, h1, lit) {
  poly([[x - w / 2, y - h0], [x + w / 2, y - h0], [x + w / 2, y - h1], [x - w / 2, y - h1]], lit ? '#ffd873' : C('#a8dcff'));
}

// Baustelle: Boden, Zaun, Kisten, Gerüst; das fertige Bauwerk wächst mit den Abschnitten von unten herauf
function drawWonder(id, cx, cy, z, now, x, y, t, hu, hv) {
  const W = WONDERS[id], N = W.phases.length, p = t.phase == null ? N : Math.min(t.phase, N);   // ohne Stand (Vorschaubild): fertig
  const K = kit(cx, cy, z, t.rot);
  if (p >= N) { WONDER_ART[id](K, cx, cy, z, now, x, y, t, hu, hv); return; }
  const [ha, hb] = (K.r & 1) ? [hv, hu] : [hu, hv], pier = id === 'seebruecke';
  if (groundPart(() => { if (!pier) K.rect(-ha + 0.05, -hb + 0.05, ha - 0.05, hb - 0.05, C('#d9c7a0')); if (id === 'schloss') schlossGround(K, x, y, p); })) return;
  if (id === 'schloss' && p > 0) WONDER_ART.schloss(K, cx, cy, z, now, x, y, t, hu, hv, p);   // wächst Abschnitt für Abschnitt (Block 60j)
  else if (p > 0) {
    g.save();
    const cut = cy - (W.h * p / N) * z;
    g.beginPath(); g.rect(-1e5, cut, 2e5, 2e5); g.clip();
    WONDER_ART[id](K, cx, cy, z, now, x, y, t, hu, hv);
    g.restore();
  }
  // Gerüst bis knapp über den aktuellen Stand
  const H = W.h * Math.max(p, 0.6) / N + 6, step = pier ? 0.8 : 0.7;
  const posts = [];
  for (let a = -ha + 0.15; a <= ha - 0.15 + 1e-6; a += step) posts.push([a, -hb + 0.15], [a, hb - 0.15]);
  for (let b = -hb + 0.15 + step; b < hb - 0.15; b += step) posts.push([-ha + 0.15, b], [ha - 0.15, b]);
  posts.sort((p1, p2) => K.depth(...p1) - K.depth(...p2));
  for (const [a, b] of posts) kPost(K, a, b, H, '#b08a5e', 1.2);
  g.strokeStyle = C('#9c7449'); g.lineWidth = 0.8 * z; g.beginPath();
  for (let hgt = 8; hgt <= H; hgt += 9) for (const [a0, b0, a1, b1] of [[-ha + 0.15, -hb + 0.15, ha - 0.15, -hb + 0.15], [-ha + 0.15, hb - 0.15, ha - 0.15, hb - 0.15],
    [-ha + 0.15, -hb + 0.15, -ha + 0.15, hb - 0.15], [ha - 0.15, -hb + 0.15, ha - 0.15, hb - 0.15]]) {
    const q0 = K.P(a0, b0, hgt), q1 = K.P(a1, b1, hgt); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]);
  }
  g.stroke();
  if (!pier) {
    K.scene([[ha - 0.3, hb - 0.35, () => K.block({ a: ha - 0.3, b: hb - 0.35, ha: 0.12, hb: 0.12, h: 6, wall: '#c9a26f', type: 'flat', roof: '#d9b98f' })],
      [ha - 0.3, -hb + 0.4, () => kPlanks(K, ha - 0.3, -hb + 0.4, 3)]]);
  }
}
for (const id of Object.keys(WONDERS)) BIG_ART[id] = (cx, cy, z, now, x, y, lvl, t, hu, hv) => drawWonder(id, cx, cy, z, now, x, y, t || {}, hu, hv);
