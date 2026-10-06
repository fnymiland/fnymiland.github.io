'use strict';
// ---------------------------------------------------------------------------
// Baukasten für Gebäude, die in alle vier Richtungen schauen
// Gebaut wird im eigenen Rahmen des Gebäudes: a zeigt nach vorn (zur Tür), b zur Seite; Maße in Feldern,
// Höhen in Pixeln (werden mit z multipliziert). rot dreht den Rahmen (siehe FRONT_DIR).
// Sichtbar sind nur Seiten, die nach +x oder +y zeigen; zeigt die Tür nach hinten, verraten Laterne und
// Trittstein an der Ecke, wo der Eingang ist.
// ---------------------------------------------------------------------------
const FACES = {
  front: { p: [1, -1], q: [1, 1], n: [1, 0] },
  right: { p: [1, 1], q: [-1, 1], n: [0, 1] },
  back:  { p: [-1, 1], q: [-1, -1], n: [-1, 0] },
  left:  { p: [-1, -1], q: [1, -1], n: [0, -1] },
};
const DOOR_COL = '#8a5a3c';
// Zeichen-Durchgang: 'ground' = nur Flaches (Plätze, Rasen, Beete – darauf fallen die Schatten),
// 'object' = alles Aufrechte, null = alles (Vorschaubilder, Tagebuch, Geister beim Bauen)
let PASS = null;
function groundPart(fn) { if (PASS !== 'object') fn(); return PASS === 'ground'; }

function kit(cx, cy, z, rot) {
  const r = (rot || 0) & 3;
  const turn = (a, b) => r === 0 ? [a, b] : r === 1 ? [-b, a] : r === 2 ? [-a, -b] : [b, -a];
  const P = (a, b, up = 0) => { const [u, v] = turn(a, b); return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up * z]; };
  const depth = (a, b) => { const [u, v] = turn(a, b); return u + v; };
  const facing = (na, nb) => { const [u, v] = turn(na, nb); return u + v; };
  const wallHex = (col, n) => { const [u] = turn(n[0], n[1]); return u > 0.5 ? shade(col, LIGHT.side) : col; };
  const wallCol = (col, n) => C(wallHex(col, n));
  const roofCol = (col, n) => {
    const [u, v] = turn(n[0], n[1]);
    return C(u < -0.5 ? shade(col, LIGHT.roofSun) : v < -0.5 ? shade(col, LIGHT.roofBack) : u > 0.5 ? shade(col, LIGHT.roofShade) : col);
  };
  const K = { r, z, P, depth, facing, turn, wallCol, roofCol };

  K.poly = (pts, fill, up = 0) => poly(pts.map(([a, b]) => P(a, b, up)), fill);
  K.rect = (a0, b0, a1, b1, fill, up = 0) => K.poly([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], fill, up);
  // Kreis mit Radius ra (in Feldern) auf dem Boden bzw. in Höhe up
  K.oval = (a, b, ra, fill, up = 0) => { const [x, y] = P(a, b, up); ellipse(x, y, ra * Math.SQRT2 * TW / 2 * z, ra * Math.SQRT2 * TH / 2 * z, fill); };
  // Welt-Richtung (u, v) im eigenen Rahmen
  K.local = (u, v) => r === 0 ? [u, v] : r === 1 ? [v, -u] : r === 2 ? [-u, -v] : [-v, u];
  // Teile von hinten nach vorn zeichnen: [[a, b, fn], …]
  K.scene = parts => parts.map(p => [depth(p[0], p[1]), p[2]]).sort((x, y) => x[0] - y[0]).forEach(p => p[1]());

  // Quader mit Dach. type: 'hip' (Walm), 'gable' (Sattel, ridge 'a' oder 'b'), 'mansard' (Mansard: steil, dann flach),
  // 'barrel' (Tonnendach: halbrund über der langen Seite), 'flat', 'none'
  K.block = ({ a = 0, b = 0, ha, hb, h, lift = 0, wall, roof = null, roofH = 0, type = 'hip', ridge = null, over = 1.12, entry = false, trim = null, strip = null }) => {
    const W = (sa, sb, up = 0) => P(a + sa * ha, b + sb * hb, lift + up);
    const faces = {};
    for (const [name, f] of Object.entries(FACES)) {
      faces[name] = facing(f.n[0], f.n[1]) > 0.01 ? { P: W(...f.p), Q: W(...f.q), H: h * z, n: f.n } : null;
    }
    if (entry && !faces.front) backEntry(K, a, b, ha, hb);
    const deep = h >= 6 && roof && type !== 'flat' && type !== 'none';
    for (const f of Object.values(faces)) {
      if (!f) continue;
      const hex = wallHex(wall, f.n);
      poly([f.P, f.Q, [f.Q[0], f.Q[1] - f.H], [f.P[0], f.P[1] - f.H]], C(hex));
      if (h >= 6 && !lift) faceQuad(f.P, f.Q, 0, 1, 0, Math.min(1.6 * z, f.H * 0.15), C(shade(hex, -0.07)));   // Wandfuß
      if (deep) faceQuad(f.P, f.Q, 0, 1, f.H - Math.min(2.6 * z, f.H * 0.22), f.H, C(shade(hex, -0.12)));  // unter dem Dach
    }
    if (trim) for (const f of Object.values(faces)) if (f) faceQuad(f.P, f.Q, 0, 1, f.H - 1.4 * z, f.H, C(trim));
    const top = lift + h;
    if (roof && type === 'mansard') {
      const ea = ha * over, eb = hb * over, k = 0.66, m = top + roofH * 0.62, ka = ea * k, kb = eb * k;
      const E1 = (sa, sb) => P(a + sa * ea, b + sb * eb, top), E2 = (sa, sb) => P(a + sa * ka, b + sb * kb, m);
      const SIDES4 = [[[1, -1], [1, 1], [1, 0]], [[1, 1], [-1, 1], [0, 1]], [[-1, 1], [-1, -1], [-1, 0]], [[-1, -1], [1, -1], [0, -1]]];
      const lower = SIDES4.map(([p, q, n]) => [[E1(...p), E1(...q), E2(...q), E2(...p)], n]);
      const rh = roofH * 0.38, alongA = ka >= kb, upper = [];
      if (alongA) {
        const R1 = P(a - (ka - kb), b, m + rh), R2 = P(a + (ka - kb), b, m + rh);
        upper.push([[E2(1, 1), E2(-1, 1), R1, R2], [0, 1]], [[E2(-1, -1), E2(1, -1), R2, R1], [0, -1]], [[E2(1, -1), E2(1, 1), R2], [1, 0]], [[E2(-1, 1), E2(-1, -1), R1], [-1, 0]]);
      } else {
        const R1 = P(a, b - (kb - ka), m + rh), R2 = P(a, b + (kb - ka), m + rh);
        upper.push([[E2(1, -1), E2(1, 1), R2, R1], [1, 0]], [[E2(-1, 1), E2(-1, -1), R1, R2], [-1, 0]], [[E2(1, 1), E2(-1, 1), R2], [0, 1]], [[E2(-1, -1), E2(1, -1), R1], [0, -1]]);
      }
      const upCol = shade(roof, 0.1);
      for (const [pts, n] of lower) if (facing(...n) < 0) poly(pts, roofCol(roof, n));
      for (const [pts, n] of upper) if (facing(...n) < 0) poly(pts, roofCol(upCol, n));
      for (const [pts, n] of upper) if (facing(...n) >= 0) poly(pts, roofCol(upCol, n));
      for (const [pts, n] of lower) if (facing(...n) >= 0) poly(pts, roofCol(roof, n));
      return { faces, a, b, ha, hb, h, lift, top: P(a, b, top), peak: P(a, b, m + rh), W };
    }
    if (roof && type === 'barrel') {
      // Halbrund quer zur langen Seite; Streifen von hinten nach vorn, Schattierung nach der Richtung der Fläche
      const alongA = ridge ? ridge === 'a' : ha >= hb, L = (alongA ? ha : hb) * over, R = (alongA ? hb : ha) * over, N = 10;
      const pt = (s, th, r = R) => { const q = Math.cos(th) * r, up = top + Math.sin(th) * roofH * r / R; return alongA ? P(a + s, b + q, up) : P(a + q, b + s, up); };
      const strips = [];
      for (let i = 0; i < N; i++) {
        const t0 = Math.PI * i / N, t1 = Math.PI * (i + 1) / N, c = Math.cos((t0 + t1) / 2);
        const n = alongA ? [0, c] : [c, 0], [u, v] = turn(...n);
        const amt = (u < 0 ? -u * LIGHT.roofSun : u * LIGHT.roofShade) + (v < 0 ? -v * LIGHT.roofBack : 0);
        strips.push([facing(...n), [pt(-L, t0), pt(L, t0), pt(L, t1), pt(-L, t1)], shade(roof, amt), t0, t1]);
      }
      // strip (Block 122): Schmuck je Streifen gleich danach – was weiter vorn liegt, deckt ihn wieder zu
      strips.sort((p, q) => p[0] - q[0]).forEach(([, pts, col, t0, t1]) => { poly(pts, C(col)); if (strip) strip(t0, t1, pt, L); });
      for (const sgn of [1, -1]) {                        // runde Giebel an den Enden (in der Wandflucht)
        const n = alongA ? [sgn, 0] : [0, sgn];
        if (facing(...n) <= 0.01) continue;
        const pts = [];
        for (let i = 0; i <= N; i++) pts.push(pt(sgn * L / over, Math.PI * i / N, R * 0.94));
        poly(pts, wallCol(wall, n));
        g.strokeStyle = C(shade(roof, -0.1)); g.lineWidth = 1.2 * z; g.beginPath();
        pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      }
      return { faces, a, b, ha, hb, h, lift, top: P(a, b, top), peak: P(a, b, top + roofH), W };
    }
    if (type === 'flat' || !roof) {
      if (type !== 'none') poly([W(-1, -1, h), W(1, -1, h), W(1, 1, h), W(-1, 1, h)], C(roof || shade(wall, 0.08)));
    } else {
      const ea = ha * over, eb = hb * over;
      const E = (sa, sb) => P(a + sa * ea, b + sb * eb, top);
      const alongA = ridge ? ridge === 'a' : ha >= hb;
      const slopes = [], gables = [];
      if (type === 'gable') {
        if (alongA) {
          const R1 = P(a - ea, b, top + roofH), R2 = P(a + ea, b, top + roofH);
          slopes.push([[E(1, 1), E(-1, 1), R1, R2], [0, 1]], [[E(-1, -1), E(1, -1), R2, R1], [0, -1]]);
          gables.push([[W(1, -1, h), W(1, 1, h), P(a + ha, b, top + roofH)], [1, 0]], [[W(-1, 1, h), W(-1, -1, h), P(a - ha, b, top + roofH)], [-1, 0]]);
        } else {
          const R1 = P(a, b - eb, top + roofH), R2 = P(a, b + eb, top + roofH);
          slopes.push([[E(1, -1), E(1, 1), R2, R1], [1, 0]], [[E(-1, 1), E(-1, -1), R1, R2], [-1, 0]]);
          gables.push([[W(1, 1, h), W(-1, 1, h), P(a, b + hb, top + roofH)], [0, 1]], [[W(-1, -1, h), W(1, -1, h), P(a, b - hb, top + roofH)], [0, -1]]);
        }
      } else if (alongA) {
        const R1 = P(a - (ea - eb), b, top + roofH), R2 = P(a + (ea - eb), b, top + roofH);
        slopes.push([[E(1, 1), E(-1, 1), R1, R2], [0, 1]], [[E(-1, -1), E(1, -1), R2, R1], [0, -1]],
                    [[E(1, -1), E(1, 1), R2], [1, 0]], [[E(-1, 1), E(-1, -1), R1], [-1, 0]]);
      } else {
        const R1 = P(a, b - (eb - ea), top + roofH), R2 = P(a, b + (eb - ea), top + roofH);
        slopes.push([[E(1, -1), E(1, 1), R2, R1], [1, 0]], [[E(-1, 1), E(-1, -1), R1, R2], [-1, 0]],
                    [[E(1, 1), E(-1, 1), R2], [0, 1]], [[E(-1, -1), E(1, -1), R1], [0, -1]]);
      }
      const back = slopes.filter(s => facing(...s[1]) < 0), front = slopes.filter(s => facing(...s[1]) >= 0);
      for (const [pts, n] of back) poly(pts, roofCol(roof, n));
      for (const [pts, n] of gables) if (facing(...n) > 0.01) poly(pts, wallCol(wall, n));
      for (const [pts, n] of front) poly(pts, roofCol(roof, n));
    }
    return { faces, a, b, ha, hb, h, lift, top: P(a, b, top), peak: P(a, b, top + roofH), W };
  };

  // Tür (mit Knauf und Trittstufe) auf einer sichtbaren Seite
  K.door = (B, side = 'front', t0 = 0.4, t1 = 0.62, hf = 0.55, col = DOOR_COL) => {
    const F = B.faces[side];
    if (!F) return false;
    faceQuad(F.P, F.Q, t0, t1, 0, F.H * hf, C(col));
    return true;
  };
  // n Fenster in einer Reihe; skip: Liste von Positionen (0 … n-1), die frei bleiben (z. B. für die Tür)
  K.wins = (B, side, n, h0 = 0.35, h1 = 0.72, from = 0.1, to = 0.9, skip = [], box = null) => {
    const F = B.faces[side];
    if (!F) return;
    const step = (to - from) / n;
    for (let i = 0; i < n; i++) {
      if (skip.includes(i)) continue;
      const t0 = from + step * (i + 0.12), t1 = from + step * (i + 0.88);
      windowOn(F.P, F.Q, t0, t1, F.H * h0, F.H * h1, z);
      if (box) flowerBox(F.P, F.Q, t0, t1, F.H * h0, z);
    }
  };
  // Beide sichtbaren Seiten außer der Tür-Seite mit Fenstern versehen
  K.sideWins = (B, n, h0, h1, box) => { for (const s of ['right', 'left', 'back']) K.wins(B, s, n, h0, h1, 0.1, 0.9, [], box); };
  return K;
}

// Tür zeigt nach hinten: Trittstein und ein runder Busch an der sichtbareren Ecke verraten den Eingang
function backEntry(K, a, b, ha, hb) {
  const s = K.depth(a + ha, b + hb) >= K.depth(a + ha, b - hb) ? 1 : -1;
  K.oval(a + ha + 0.08, b, 0.09, C('#e3d8c4'));
  kitBush(K, a + ha + 0.07, b + s * (hb + 0.02), 0.75);
}
function lampPost(lx, ly, z, hgt = 17) {
  ellipse(lx, ly + 0.5 * z, 2.6 * z, 1.2 * z, 'rgba(40,60,20,0.18)');
  g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.3 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly - hgt * z); g.stroke();
  const lit = night > 0.15 && isLive();
  const lb = box(lx, ly - hgt * z, 2 * z, 1.1 * z, 3.6 * z, lit ? '#ffe58a' : '#fff7d6', '#4a4a58', 2.2 * z);
  glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 3.6 * z], [lb.L[0], lb.L[1] - 3.6 * z]], 22 * z);
}
// Kleiner Baum/Busch an einer Stelle im Rahmen
function kitTree(K, a, b, s = 0.8, fruit) { const [x, y] = K.P(a, b); tree(x, y, K.z * s, 0.4, fruit); }
function kitBush(K, a, b, s = 1, col = '#58ad52') {
  const [x, y] = K.P(a, b), z = K.z * s;
  circle(x - 2.5 * z, y - 3 * z, 3.6 * z, C(col));
  circle(x + 2.5 * z, y - 3 * z, 3.6 * z, C(shade(col, -0.14)));
  circle(x, y - 5.5 * z, 3.8 * z, C(shade(col, 0.1)));
}
// Zaun entlang einer Linie im Rahmen (Latten)
function kitFence(K, a0, b0, a1, b1, col = '#fff6e4', n = 6) {
  g.strokeStyle = C(shade(col, -0.2)); g.lineWidth = 0.9 * K.z; g.lineCap = 'round';
  const p0 = K.P(a0, b0), p1 = K.P(a1, b1);
  g.beginPath(); g.moveTo(p0[0], p0[1] - 3 * K.z); g.lineTo(p1[0], p1[1] - 3 * K.z); g.stroke();
  g.strokeStyle = C(col); g.lineWidth = 1.2 * K.z;
  g.beginPath();
  for (let i = 0; i <= n; i++) { const p = lerp(p0, p1, i / n); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 5 * K.z); }
  g.stroke();
}
// Schornstein auf einem Dach (Position im Rahmen, Höhe über dem Boden)
function kitChimney(K, a, b, up, now, col = '#b35a45', dark) {
  const [x, y] = K.P(a, b, up);
  box(x, y, 2.2 * K.z, 1.1 * K.z, 8 * K.z, col, null, 0);
  smoke(x, y - 10 * K.z, K.z, now, dark);
}
