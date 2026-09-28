'use strict';
// ---------------------------------------------------------------------------
// Zeichnen – Gebäude & Deko
// ---------------------------------------------------------------------------
let night = 0;
const glows = [];
const isLive = () => g === ctx;

function glowQuad(pts, r) {
  if (!(night > 0.15 && isLive())) return;
  const m = g.getTransform(), k = 1 / DPR;
  glows.push({ q: pts.map(([x, y]) => [(m.a * x + m.c * y + m.e) * k, (m.b * x + m.d * y + m.f) * k]), r });
}
function windowOn(P, Q, t0, t1, h0, h1, z) {
  const lit = night > 0.15 && isLive();
  faceQuad(P, Q, t0, t1, h0, h1, lit ? '#ffd873' : C('#a8dcff'));
  const a = lerp(P, Q, t0), b = lerp(P, Q, t1);
  glowQuad([[a[0], a[1] - h0], [b[0], b[1] - h0], [b[0], b[1] - h1], [a[0], a[1] - h1]], 18 * z);
}
function door(P, Q, h) { faceQuad(P, Q, 0.4, 0.62, 0, h * 0.55, C('#8a5a3c')); }
function shadow(cx, cy, a, b) { ellipse(cx, cy + 2, a, b, 'rgba(40,60,20,0.15)'); }
function smoke(x, y, z, now, dark) {
  for (let i = 0; i < 3; i++) {
    const ph = (now / 1800 + i / 3) % 1;
    circle(x + Math.sin(ph * 6) * 2 * z, y - ph * 18 * z, (2 + ph * 4) * z,
      dark ? `rgba(180,180,190,${0.7 * (1 - ph)})` : `rgba(255,255,255,${0.7 * (1 - ph)})`);
  }
}
function blades(hx, hy, z, now, n, len, col) {
  const ang = now / 650;
  for (let i = 0; i < n; i++) {
    const a = ang + i * Math.PI * 2 / n, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, wd = 2.4 * z;
    poly([[hx + px * 0.6 * z, hy + py * 0.6 * z], [hx + ca * len + px * wd, hy + sa * len + py * wd],
          [hx + ca * len, hy + sa * len], [hx + ca * 3 * z, hy + sa * 3 * z]], C(col));
  }
  circle(hx, hy, 1.8 * z, C('#8a8f99'));
}

function drawFlag(px, py, z, now, town) {
  g.strokeStyle = C('#8a8f99'); g.lineWidth = 1.6 * z; g.lineCap = 'round';
  g.beginPath(); g.moveTo(px, py); g.lineTo(px, py - 40 * z); g.stroke();
  const fw = 16 * z, fh = 11 * z, top = py - 40 * z, wave = Math.sin(now / 400) * 1.5 * z;
  g.beginPath();
  g.moveTo(px, top);
  g.quadraticCurveTo(px + fw / 2, top - wave, px + fw, top + wave * 0.5);
  g.lineTo(px + fw, top + fh + wave * 0.5);
  g.quadraticCurveTo(px + fw / 2, top + fh - wave, px, top + fh);
  g.closePath();
  g.fillStyle = C(town.color); g.fill();
  g.font = `${7.5 * z}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(town.symbol, px + fw / 2, top + fh / 2 + 0.5 * z);
}

// Wege: schmale Bänder, die sich mit Nachbar-Wegen verbinden, oder ganze Flächen (Plätze)
const ROAD_W = 0.32;                      // halbe Breite eines Weg-Bands in Feldern
const ang = (u, v) => Math.atan2(v, u);
function arcPts(cu, cv, r, a0, a1, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cu + Math.cos(a) * r, cv + Math.sin(a) * r]); }
  return out;
}
const sweep = (a0, a1) => { let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; return a0 + d; };
function pathArms(x, y) {
  return DIRS.filter(([dx, dy]) => { const b = bAt(x + dx, y + dy); return b === 'weg' || b === 'rathaus'; });
}
// Kurve: zwei Arme über Eck → Mittelpunkt ist die gemeinsame Feldecke
function roadCurve(arms) {
  if (arms.length !== 2) return null;
  const [[ax, ay], [bx, by]] = arms;
  if (ax === -bx && ay === -by) return null;
  const cu = 0.5 * (ax + bx), cv = 0.5 * (ay + by);
  const a0 = ang(ax * 0.5 - cu, ay * 0.5 - cv);
  return { cu, cv, a0, a1: sweep(a0, ang(bx * 0.5 - cu, by * 0.5 - cv)) };
}
// Umriss der Fahrbahn (halbe Breite w) als Liste von Polygonen im Feld-Koordinatensystem
function roadShapes(arms, t, w) {
  const out = [];
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const arm = ([dx, dy], from = 0) => dx > 0 ? rect(from, 0.5, -w, w) : dx < 0 ? rect(-0.5, -from, -w, w)
    : dy > 0 ? rect(-w, w, from, 0.5) : rect(-w, w, -0.5, -from);
  if (!arms.length) {
    out.push((t && t.rot & 1) ? rect(-w, w, -0.5, 0.5) : rect(-0.5, 0.5, -w, w));
    return out;
  }
  const curve = roadCurve(arms);
  if (curve) {
    const { cu, cv, a0, a1 } = curve;
    out.push(arcPts(cu, cv, 0.5 + w, a0, a1).concat(arcPts(cu, cv, Math.max(0, 0.5 - w), a1, a0)));
    return out;
  }
  if (arms.length === 1) {                       // Sackgasse mit rundem Ende
    out.push(arm(arms[0]));
    out.push(arcPts(0, 0, w, 0, Math.PI * 2, 20));
    return out;
  }
  out.push(rect(-w, w, -w, w));
  for (const a of arms) out.push(arm(a));
  // Innenecken zwischen zwei Armen abrunden (Mittelpunkt fest, damit die Bordsteinbreite gleich bleibt)
  const c0 = ROAD_W + 0.04 + 0.1, r = c0 - w;
  const has = (dx, dy) => arms.some(a => a[0] === dx && a[1] === dy);
  for (const su of [1, -1]) for (const sv of [1, -1]) {
    if (!has(su, 0) || !has(0, sv)) continue;
    const pts = [[w, w], [c0, w]].concat(arcPts(c0, c0, r, -Math.PI / 2, -Math.PI, 8)).concat([[w, c0]]);
    out.push(pts.map(([u, v]) => [u * su, v * sv]));
  }
  return out;
}
// Muster innerhalb einer Fläche (Feld-Koordinaten, L bildet auf den Bildschirm ab)
function clipTo(shapes, L) {
  g.beginPath();
  for (const sh of shapes) { sh.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); }
  g.clip();
}
function pattern(L, kind, x, y, z, col, cols) {
  const R = 0.55;
  if (kind === 'stones' || kind === 'dots') {
    const step = kind === 'stones' ? 0.11 : 0.09;
    for (let u = -R, i = 0; u <= R; u += step, i++) for (let v = -R, j = 0; v <= R; v += step, j++) {
      const h = hash(x * 16 + i, y * 16 + j, 333);
      if (kind === 'dots' && h > 0.45) continue;
      const q = L([u + (h - 0.5) * 0.04, v + (hash(x * 16 + i, y * 16 + j, 334) - 0.5) * 0.04]);
      g.fillStyle = cols ? cols[Math.floor(h * 97) % cols.length] : col;
      g.beginPath(); g.ellipse(q[0], q[1], (kind === 'stones' ? 2.6 : 1.3) * z, (kind === 'stones' ? 1.6 : 0.9) * z, 0, 0, Math.PI * 2); g.fill();
    }
    return;
  }
  g.strokeStyle = col; g.lineWidth = 0.8 * z;
  g.beginPath();
  const line = (a, b) => { const p0 = L(a), p1 = L(b); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); };
  if (kind === 'bricks') {
    for (let r = 0; r < 11; r++) {
      const v = -R + r * 0.1;
      line([-R, v], [R, v]);
      for (let u = -R + (r & 1 ? 0.1 : 0); u <= R; u += 0.2) line([u, v], [u, v + 0.1]);
    }
  } else if (kind === 'planks') {
    for (let v = -R; v <= R; v += 0.07) line([-R, v], [R, v]);
  } else if (kind === 'tiles') {
    for (let k = -2; k <= 2; k++) { line([-R, k * 0.25], [R, k * 0.25]); line([k * 0.25, -R], [k * 0.25, R]); }
  } else if (kind === 'herring') {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      const u = -0.5 + i * 0.125, v = -0.5 + j * 0.125;
      if ((i + j) & 1) line([u, v], [u + 0.125, v]); else line([u, v], [u, v + 0.125]);
    }
  }
  g.stroke();
}
function roadCenterline(arms, t) {
  const curve = roadCurve(arms);
  if (curve) return arcPts(curve.cu, curve.cv, 0.5, curve.a0, curve.a1);
  if (arms.length === 2 || !arms.length) {
    const d = arms.length ? arms[0] : ((t && t.rot & 1) ? [0, 1] : [1, 0]);
    return [[d[0] * 0.5, d[1] * 0.5], [-d[0] * 0.5, -d[1] * 0.5]];
  }
  if (arms.length === 1) return [[arms[0][0] * 0.5, arms[0][1] * 0.5], [0, 0]];
  return null;
}
const PATH_LOOK = {
  // Bänder
  sand:    { edge: '#c9b083', fill: '#dcc69d', pat: ['dots', null], cols: ['#cbb286', '#e6d3ad'] },
  kies:    { edge: '#d9c393', fill: '#eadbb2', pat: ['dots', null], cols: ['#c9b183', '#d8c79d'] },
  mulch:   { edge: '#6f4a2e', fill: '#8b5e3c', pat: ['dots', null], cols: ['#6f4a2e', '#a0714d'] },
  asphalt: { edge: '#cfc8bb', fill: '#9e988e', dash: true },
  holz:    { edge: '#9c7449', fill: '#c89a6a', pat: ['planks', '#a97d52'] },
  pastell: { edge: '#d9bcc6', fill: '#f5e4ea', pat: ['dots', null], cols: ['#f2a7c0', '#a7d8c9', '#c7b4ee', '#ffe08a'] },
  blueten: { edge: '#e9c6d2', fill: '#f7e3ea', pat: ['dots', null], cols: ['#f29bb8', '#ffffff', '#ffd36e', '#f6b6cb'] },
  tritt:   { stones: true },
  kristall: { edge: '#b9a0e8', fill: '#e6dbfb', pat: ['dots', null], cols: ['#c7a6f7', '#ffffff', '#9d6fe0'], glow: true },
  // Flächen
  platten:    { fill: '#e6dfd0', pat: ['tiles', '#d6ccb9'] },
  kopf:       { fill: '#cfc8bb', pat: ['stones', '#ddd7cc'] },
  klinker:    { fill: '#c97a5e', pat: ['bricks', '#a95a43'] },
  terrakotta: { fill: '#d99a73', pat: ['tiles', '#c4805a'] },
  schach:     { fill: '#f5dce6', checker: '#dcefe6' },
  fisch:      { fill: '#ecccc2', pat: ['herring', '#d8aea2'] },
  mosaik:     { fill: '#efe6d8', pat: ['dots', null], cols: ['#f2a7c0', '#a7d8c9', '#c7b4ee', '#ffd36e', '#8fc1f0'] },
};
const isFillPath = (x, y) => { const t = state.tiles.get(x + ',' + y); return !!t && t.b === 'weg' && styleDef('weg', t.style).shape === 'fill'; };

function drawPath(cx, cy, z, x, y, t) {
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const st = styleDef('weg', t && t.style), lk = PATH_LOOK[st.id];
  if (st.shape === 'fill') {
    const sq = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    poly(sq.map(L), C(lk.fill));
    if (lk.checker) {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if ((i + j) & 1) continue;
        const u = -0.5 + i * 0.25, v = -0.5 + j * 0.25;
        poly([[u, v], [u + 0.25, v], [u + 0.25, v + 0.25], [u, v + 0.25]].map(L), C(lk.checker));
      }
    } else if (lk.pat) {
      g.save(); clipTo([sq], L); pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols); g.restore();
    }
    // Randkante, wo die Fläche endet
    g.strokeStyle = C(shade(lk.fill, -0.18)); g.lineWidth = 1.4 * z; g.lineCap = 'round';
    g.beginPath();
    for (const [dx, dy, a, b] of [[1, 0, [0.5, -0.5], [0.5, 0.5]], [-1, 0, [-0.5, -0.5], [-0.5, 0.5]],
                                  [0, 1, [-0.5, 0.5], [0.5, 0.5]], [0, -1, [-0.5, -0.5], [0.5, -0.5]]]) {
      if (isFillPath(x + dx, y + dy)) continue;
      const p0 = L(a), p1 = L(b);
      g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
    }
    g.stroke();
    return;
  }
  const arms = pathArms(x, y);
  if (lk.stones) {
    // Trittsteine entlang der Mittellinie
    const cl = roadCenterline(arms, t) || [[0, 0]];
    const pts = [];
    for (let i = 0; i < cl.length - 1; i++) {
      const [a, b] = [cl[i], cl[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let d = 0; d < len; d += 0.26) pts.push([a[0] + (b[0] - a[0]) * d / len, a[1] + (b[1] - a[1]) * d / len]);
    }
    if (arms.length > 2 || cl.length < 2) pts.push([0, 0]);
    for (const [u, v] of pts) {
      const q = L([u, v]);
      ellipse(q[0], q[1] + 0.8 * z, 6 * z, 3.1 * z, C('#aaa498'));
      ellipse(q[0], q[1], 6 * z, 3.1 * z, C('#d6d1c6'));
    }
    return;
  }
  for (const [w, col] of [[ROAD_W + 0.04, lk.edge], [ROAD_W, lk.fill]]) {
    for (const sh of roadShapes(arms, t, w)) poly(sh.map(L), C(col));
  }
  if (lk.pat) {
    g.save(); clipTo(roadShapes(arms, t, ROAD_W), L); pattern(L, lk.pat[0], x, y, z, lk.pat[1] && C(lk.pat[1]), lk.cols); g.restore();
  }
  if (lk.glow) glowQuad([L([-0.15, -0.15]), L([0.15, -0.15]), L([0.15, 0.15]), L([-0.15, 0.15])], 26 * z);
  const cl = roadCenterline(arms, t);
  if (lk.dash && cl) {
    g.strokeStyle = C('#f4efe2'); g.lineWidth = 1.2 * z; g.lineCap = 'round';
    g.setLineDash([2.5 * z, 3 * z]);
    g.beginPath();
    cl.forEach((p, i) => { const q = L(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); });
    g.stroke();
    g.setLineDash([]);
  }
}

// ---------------------------------------------------------------------------
// Große Gebäude (mehrere Felder): Quader über einem Rechteck, Walmdach
// ---------------------------------------------------------------------------
function boxR(cx, cy, z, hu, hv, h, wall, roof, roofH) {
  const P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - up];
  const L = P(-hu, hv), B = P(hu, hv), R = P(hu, -hv), Tp = P(-hu, -hv);
  poly([L, B, [B[0], B[1] - h], [L[0], L[1] - h]], C(wall));
  poly([B, R, [R[0], R[1] - h], [B[0], B[1] - h]], C(shade(wall, -0.13)));
  if (roof) {
    const o = 1.12, eu = hu * o, ev = hv * o;
    const lt = P(-eu, ev, h), bt = P(eu, ev, h), rt = P(eu, -ev, h), tt = P(-eu, -ev, h);
    if (hu >= hv) {
      const r1 = P(-(eu - ev), 0, h + roofH), r2 = P(eu - ev, 0, h + roofH);
      poly([tt, rt, r2, r1], C(shade(roof, 0.1)));
      poly([lt, tt, r1], C(shade(roof, 0.1)));
      poly([lt, bt, r2, r1], C(roof));
      poly([bt, rt, r2], C(shade(roof, -0.18)));
    } else {
      const r1 = P(0, -(ev - eu), h + roofH), r2 = P(0, ev - eu, h + roofH);
      poly([rt, tt, r1], C(shade(roof, 0.1)));
      poly([tt, lt, r2, r1], C(shade(roof, 0.1)));
      poly([lt, bt, r2], C(roof));
      poly([bt, rt, r1, r2], C(shade(roof, -0.18)));
    }
  } else {
    poly([P(-hu, hv, h), P(hu, hv, h), P(hu, -hv, h), P(-hu, -hv, h)], C(shade(wall, 0.08)));
  }
  return { L, B, R, T: Tp, h, P };
}
// vordere lange und kurze Seite eines Quaders
const longFace = (bx, hu, hv) => hu >= hv ? [bx.L, bx.B] : [bx.B, bx.R];
const shortFace = (bx, hu, hv) => hu >= hv ? [bx.B, bx.R] : [bx.L, bx.B];
function windowsOn(face, n, h, z, from = 0.08, to = 0.92, h0 = 0.35, h1 = 0.72) {
  const step = (to - from) / n;
  for (let i = 0; i < n; i++) windowOn(face[0], face[1], from + step * (i + 0.2), from + step * (i + 0.8), h * h0, h * h1, z);
}
function groundRect(cx, cy, z, hu, hv, fill, pat, x, y) {
  const L = ([u, v]) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const sq = [[-hu, -hv], [hu, -hv], [hu, hv], [-hu, hv]];
  poly(sq.map(L), C(fill));
  if (pat) { g.save(); clipTo([sq], L); pattern(L, pat[0], x, y, z, pat[1] && C(pat[1]), pat[2]); g.restore(); }
  return L;
}
const BIG_ART = {
  rathaus(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    groundRect(cx, cy, z, hu * 0.98, hv * 0.98, '#e6dfd0', ['tiles', '#d6ccb9']);
    const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const fp = F(hu * 0.75, -hv * 0.8);
    drawFlag(fp[0], fp[1], z * 1.3, now, state.town);
    const H = 24 * z, bx = boxR(cx, cy + 2 * z, z, hu * 0.6, hv * 0.6, H, '#fff1d6', '#6f8fd8', 18 * z);
    const front = (t.rot || 0) & 1 ? [bx.L, bx.B] : [bx.B, bx.R], side = (t.rot || 0) & 1 ? [bx.B, bx.R] : [bx.L, bx.B];
    faceQuad(front[0], front[1], 0.42, 0.58, 0, H * 0.5, C('#8a5a3c'));
    windowOn(front[0], front[1], 0.12, 0.3, H * 0.35, H * 0.72, z);
    windowOn(front[0], front[1], 0.7, 0.88, H * 0.35, H * 0.72, z);
    windowsOn(side, 3, H, z);
    const tw = boxR(cx, cy - H - 4 * z, z, 0.17, 0.17, 20 * z, '#fff1d6', '#e8705f', 12 * z);
    const m = lerp(tw.L, tw.B, 0.5), cyc = m[1] - 20 * z * 0.6;
    circle(m[0], cyc, 4.2 * z, C('#ffffff'));
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1 * z;
    g.beginPath(); g.arc(m[0], cyc, 4.2 * z, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(m[0], cyc); g.lineTo(m[0], cyc - 3 * z); g.moveTo(m[0], cyc); g.lineTo(m[0] + 2.2 * z, cyc); g.stroke();
  },
  markt(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    groundRect(cx, cy, z, hu * 0.96, hv * 0.96, '#eadcbf', ['stones', '#dccdae']);
    const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const fruit = ['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a', '#c77dff'];
    const stall = (u, v, col, i) => {
      const [sx, sy] = F(u, v);
      const bx = boxR(sx, sy, z, 0.3, 0.22, 7 * z, '#f5e1b8', col, 7 * z);
      const f = lerp(bx.L, bx.B, 0.5);
      for (let j = 0; j < 4; j++) circle(f[0] - 5 * z + j * 3.4 * z, f[1] - 2.3 * z, 1.8 * z, C(fruit[(j + i) % 5]));
    };
    const umbrella = (u, v, col) => {
      const [sx, sy] = F(u, v);
      box(sx, sy + 2 * z, 5 * z, 2.5 * z, 3 * z, '#c9955f', null, 0);
      g.strokeStyle = C('#8a6a4a'); g.lineWidth = 1.2 * z;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 15 * z); g.stroke();
      poly([[sx - 11 * z, sy - 12 * z], [sx, sy - 19 * z], [sx + 11 * z, sy - 12 * z], [sx, sy - 7 * z]], C(col));
      poly([[sx, sy - 19 * z], [sx + 11 * z, sy - 12 * z], [sx, sy - 7 * z]], C(shade(col, -0.15)));
      poly([[sx - 4 * z, sy - 16.5 * z], [sx, sy - 19 * z], [sx + 4 * z, sy - 16.5 * z], [sx, sy - 14.5 * z]], C('#ffffff'));
    };
    const crate = (u, v, c) => { const [sx, sy] = F(u, v); box(sx, sy, 3.5 * z, 1.8 * z, 4 * z, c, null, 0); };
    // hinten nach vorn zeichnen
    stall(-1.05, -1.05, '#e85d5d', 0);
    stall(0, -1.1, '#4fb0e0', 1);
    stall(-1.1, 0, '#f2b53a', 2);
    stall(1.05, -1.05, '#58b36a', 3);
    stall(-1.05, 1.05, '#c77dff', 4);
    crate(0.55, -0.6, '#c9955f'); crate(-0.6, 0.55, '#b98a55');
    const [fx, fy] = F(0, 0);
    ellipse(fx, fy + 1 * z, 14 * z, 7 * z, C('#aeb2bd'));
    ellipse(fx, fy - 1 * z, 11.5 * z, 5.6 * z, C('#74d0e6'));
    const jet = Math.sin(now / 300) * 1.2 * z;
    g.strokeStyle = C('#bfeefa'); g.lineWidth = 1.6 * z;
    g.beginPath(); g.moveTo(fx, fy - 1 * z); g.lineTo(fx, fy - 9 * z - jet); g.stroke();
    umbrella(1.1, 0, '#e8705f');
    umbrella(0, 1.1, '#58b36a');
    crate(0.95, 0.75, '#f2b53a'); crate(0.7, 1.0, '#c9955f');
    umbrella(1.05, 1.1, '#4fb0e0');
  },
  hafen(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    groundRect(cx, cy, z, hu * 0.98, hv * 0.98, '#c9955f', ['planks', '#a57645']);
    const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const [wx, wy] = F(-hu * 0.45, -hv * 0.45);
    const bx = boxR(wx, wy, z, 0.42, 0.42, 16 * z, '#d98a6a', '#8b5a3c', 10 * z);
    faceQuad(bx.B, bx.R, 0.3, 0.7, 0, 16 * z * 0.6, C('#8a5a3c'));
    windowOn(bx.L, bx.B, 0.3, 0.7, 16 * z * 0.45, 16 * z * 0.75, z);
    const [kx, ky] = F(hu * 0.55, -hv * 0.4);
    g.strokeStyle = C('#e9a23b'); g.lineWidth = 2.2 * z; g.lineCap = 'round';
    g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx, ky - 36 * z); g.lineTo(kx + 18 * z, ky - 30 * z); g.stroke();
    g.lineWidth = 1 * z; g.beginPath(); g.moveTo(kx + 18 * z, ky - 30 * z); g.lineTo(kx + 18 * z, ky - 16 * z); g.stroke();
    box(kx + 18 * z, ky - 12 * z, 3 * z, 1.5 * z, 4 * z, '#5f8fe8', null, 0);
    for (const [u, v, c] of [[-0.2, 0.5, '#5f8fe8'], [0, 0.6, '#e8705f'], [-0.35, 0.35, '#f2b53a']]) { const [bx2, by2] = F(u * hu, v * hv); box(bx2, by2, 3.5 * z, 1.8 * z, 5 * z, c, null, 0); }
    const [sx, sy] = F(hu * 1.15, hv * 0.6), bob = Math.sin(now / 700) * 1.2 * z;
    ellipse(sx, sy + 3 * z + bob, 13 * z, 4.5 * z, C('#e8604f'));
    box(sx - 2 * z, sy - 1 * z + bob, 4 * z, 2 * z, 6 * z, '#ffffff', '#3e8ed0', 3 * z);
  },
  schule(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    groundRect(cx, cy, z, hu * 0.97, hv * 0.97, '#e2d9c6');
    const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
    const odd = (t.rot || 0) & 1, [ox, oy] = odd ? F(-hu * 0.35, 0) : F(0, -hv * 0.35);
    const bu = odd ? hu * 0.45 : hu * 0.85, bv = odd ? hv * 0.85 : hv * 0.45, H = 18 * z;
    const bx = boxR(ox, oy, z, bu, bv, H, '#f6d7a7', '#d96c4f', 12 * z);
    const lf = longFace(bx, bu, bv);
    windowsOn(lf, 5, H, z);
    faceQuad(lf[0], lf[1], 0.45, 0.55, 0, H * 0.55, C('#8a5a3c'));
    windowsOn(shortFace(bx, bu, bv), 2, H, z);
    boxR(ox, oy - H - 10 * z, z, 0.1, 0.1, 8 * z, '#fff4dc', '#d96c4f', 7 * z);
    circle(ox, oy - H - 14 * z, 1.6 * z, C('#e9a23b'));
    const [tx, ty] = odd ? F(hu * 0.55, hv * 0.5) : F(hu * 0.5, hv * 0.55);
    tree(tx, ty, z * 0.9, 0.9);
    const [px2, py2] = odd ? F(hu * 0.55, -hv * 0.4) : F(-hu * 0.4, hv * 0.55);
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.4 * z;
    g.beginPath(); g.moveTo(px2 - 6 * z, py2); g.lineTo(px2 - 6 * z, py2 - 12 * z); g.lineTo(px2 + 6 * z, py2 - 12 * z); g.lineTo(px2 + 6 * z, py2); g.stroke();
    const sw = Math.sin(now / 500) * 3 * z;
    g.beginPath(); g.moveTo(px2, py2 - 12 * z); g.lineTo(px2 + sw, py2 - 4 * z); g.stroke();
    box(px2 + sw, py2 - 3 * z, 2.2 * z, 1 * z, 1 * z, '#e8705f', null, 0);
  },
  uni(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    groundRect(cx, cy, z, hu * 0.97, hv * 0.97, '#9ad26f');
    const H = 22 * z, bx = boxR(cx, cy, z, hu * 0.75, hv * 0.6, H, '#f3ead9', null, 0);
    const odd = (t.rot || 0) & 1, colFace = odd ? [bx.L, bx.B] : [bx.B, bx.R], winFace = odd ? [bx.B, bx.R] : [bx.L, bx.B];
    for (let i = 0; i < 6; i++) faceQuad(colFace[0], colFace[1], 0.08 + i * 0.155, 0.13 + i * 0.155, 0, H, C('#ffffff'));
    windowsOn(winFace, 4, H, z);
    g.beginPath(); g.ellipse(cx, cy - H, 16 * z, 16 * z, 0, Math.PI, 0); g.fillStyle = C('#5f8fe8'); g.fill();
    ellipse(cx - 4 * z, cy - H - 9 * z, 4 * z, 2.5 * z, C('#8fb4f2'));
    g.strokeStyle = C('#e9a23b'); g.lineWidth = 1.6 * z;
    g.beginPath(); g.moveTo(cx, cy - H - 16 * z); g.lineTo(cx, cy - H - 22 * z); g.stroke();
  },
  park(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const L = groundRect(cx, cy, z, hu * 0.98, hv * 0.98, '#8fd16a');
    poly([[-hu * 0.98, -0.1], [hu * 0.98, -0.1], [hu * 0.98, 0.1], [-hu * 0.98, 0.1]].map(L), C('#eadbb2'));
    poly([[-0.1, -hv * 0.98], [0.1, -hv * 0.98], [0.1, hv * 0.98], [-0.1, hv * 0.98]].map(L), C('#eadbb2'));
    const F = (u, v) => L([u, v]);
    const [px2, py2] = F(-hu * 0.5, hv * 0.5);
    ellipse(px2, py2, 16 * z, 7 * z, C('#74d0e6'));
    ellipse(px2 - 4 * z, py2 - 1.5 * z, 5 * z, 2 * z, C('#b8ecf6'));
    const dx = Math.sin(now / 1800) * 4 * z;
    ellipse(px2 + dx, py2 + 1 * z, 2.2 * z, 1.4 * z, C('#fffaf0')); circle(px2 + dx + 1.8 * z, py2 - 0.8 * z, 1.2 * z, C('#fffaf0'));
    for (const [u, v] of [[-0.55, -0.55], [0.55, -0.55], [0.55, 0.2]]) { const [tx, ty] = F(u * hu, v * hv); tree(tx, ty + 2 * z, z * 0.95, hash(x, y, u * 7 + v) + 0.3); }
    const [bx2, by2] = F(hu * 0.4, hv * 0.55);
    g.save(); g.translate(bx2, by2); g.scale(0.6, 0.6); drawObject('bank', 0, 0, z, now, x, y, 1, { rot: 1 }); g.restore();
    for (let i = 0; i < 10; i++) {
      const u = (hash(x, y, 300 + i) - 0.5) * 1.6 * hu, v = (hash(x, y, 320 + i) - 0.5) * 1.6 * hv;
      if (Math.abs(u) < 0.15 || Math.abs(v) < 0.15) continue;
      const [fx, fy] = F(u, v);
      circle(fx, fy, 1.8 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
    }
  },
  baecker(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const bu = hu * 0.85, bv = hv * 0.8, H = (15 + lvl) * z;
    shadow(cx, cy, (bu + bv) * TW / 2 * z * 0.9, (bu + bv) * TH / 2 * z * 0.9);
    const bx = boxR(cx, cy, z, bu, bv, H, '#ffe8b0', '#9c5a32', 12 * z);
    const lf = longFace(bx, bu, bv);
    windowsOn(lf, 3, H, z, 0.35, 0.95);
    faceQuad(lf[0], lf[1], 0.12, 0.26, 0, H * 0.6, C('#8a5a3c'));
    for (let i = 0; i < 6; i++) faceQuad(lf[0], lf[1], 0.08 + i * 0.14, 0.15 + i * 0.14, H * 0.74, H * 0.86, C(i & 1 ? '#ffffff' : '#e8705f'));
    const P = bx.P, [chx, chy] = P(bu * 0.3, -bv * 0.4, H + 6 * z);
    box(chx, chy, 2.6 * z, 1.3 * z, 9 * z, '#c0694a', null, 0);
    smoke(chx, chy - 11 * z, z, now);
    const sf = shortFace(bx, bu, bv), sb = lerp(sf[0], sf[1], 0.5);
    ellipse(sb[0], sb[1] - H * 0.55, 4 * z, 2.4 * z, C('#d99a4e'));
  },
  saege(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const bu = hu * 0.8, bv = hv * 0.75, H = 13 * z;
    shadow(cx, cy, (bu + bv) * TW / 2 * z * 0.9, (bu + bv) * TH / 2 * z * 0.9);
    const bx = boxR(cx, cy, z, bu, bv, H, '#c98d5c', '#7a4f2a', 10 * z);
    const lf = longFace(bx, bu, bv);
    faceQuad(lf[0], lf[1], 0.35, 0.65, 0, H * 0.75, C('#6b4a2e'));
    windowsOn(shortFace(bx, bu, bv), 1, H, z);
    const P = bx.P, odd = hu < hv;
    const [lx, ly] = odd ? P(bu * 0.3, bv * 1.1) : P(bu * 1.05, bv * 0.2);
    for (const [ox, oy] of [[0, 0], [5, -2], [2.5, -4.5]]) {
      ellipse(lx + ox * z, ly + oy * z, 3.4 * z, 2.6 * z, C('#b57b4a'));
      ellipse(lx + ox * z - 2.6 * z, ly + oy * z, 1.4 * z, 2.4 * z, C('#ecd1a4'));
    }
    const m = lerp(lf[0], lf[1], 0.5), sx = m[0], sy = m[1] - H - 4 * z, a = now / 200;
    circle(sx, sy, 5 * z, C('#c7cad2'));
    g.strokeStyle = C('#8a8f99'); g.lineWidth = 1 * z;
    g.beginPath(); for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; g.moveTo(sx, sy); g.lineTo(sx + Math.cos(b) * 5 * z, sy + Math.sin(b) * 5 * z); } g.stroke();
  },
  fabrik(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const bu = hu * 0.85, bv = hv * 0.8, H = 15 * z;
    shadow(cx, cy, (bu + bv) * TW / 2 * z * 0.9, (bu + bv) * TH / 2 * z * 0.9);
    const bx = boxR(cx, cy, z, bu, bv, H, '#d98a6a', null, 0);
    const P = bx.P, odd = hu < hv;
    for (let i = 0; i < 4; i++) {
      const f = -0.75 + i * 0.5;
      const a = odd ? P(-bu, f * bv, H) : P(f * bu, -bv, H), b2 = odd ? P(bu, f * bv, H) : P(f * bu, bv, H);
      const c2 = odd ? P(bu, (f + 0.3) * bv, H + 7 * z) : P((f + 0.3) * bu, bv, H + 7 * z), d2 = odd ? P(-bu, (f + 0.3) * bv, H + 7 * z) : P((f + 0.3) * bu, -bv, H + 7 * z);
      poly([a, b2, c2, d2], C('#8fa3b8'));
    }
    const lf = longFace(bx, bu, bv);
    windowsOn(lf, 4, H, z);
    const [chx, chy] = P(-bu * 0.6, -bv * 0.5, H);
    box(chx, chy, 2.8 * z, 1.4 * z, 20 * z, '#b35a45', null, 0);
    smoke(chx, chy - 22 * z, z, now, true);
  },
  bibliothek(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const bu = hu * 0.82, bv = hv * 0.78, H = 16 * z;
    shadow(cx, cy, (bu + bv) * TW / 2 * z * 0.9, (bu + bv) * TH / 2 * z * 0.9);
    const bx = boxR(cx, cy, z, bu, bv, H, '#efe6d8', '#7d6bb0', 10 * z);
    const lf = longFace(bx, bu, bv);
    for (let i = 0; i < 6; i++) faceQuad(lf[0], lf[1], 0.06 + i * 0.16, 0.12 + i * 0.16, 0, H, C('#ffffff'));
    faceQuad(lf[0], lf[1], 0.44, 0.56, 0, H * 0.55, C('#8a5a3c'));
    windowsOn(shortFace(bx, bu, bv), 2, H, z);
  },
  kunst(cx, cy, z, now, x, y, lvl, t, hu, hv) {
    const bu = hu * 0.82, bv = hv * 0.78, H = 17 * z;
    shadow(cx, cy, (bu + bv) * TW / 2 * z * 0.9, (bu + bv) * TH / 2 * z * 0.9);
    const bx = boxR(cx, cy, z, bu, bv, H, '#ffe3ef', '#f28cb1', 12 * z);
    const lf = longFace(bx, bu, bv);
    windowsOn(lf, 2, H, z, 0.1, 0.9, 0.25, 0.85);
    windowsOn(shortFace(bx, bu, bv), 1, H, z);
    const P = bx.P, odd = hu < hv, [px2, py2] = odd ? P(bu * 1.1, bv * 0.5) : P(bu * 0.5, bv * 1.15);
    ellipse(px2, py2 - 4 * z, 8 * z, 5.5 * z, C('#f7ecd4'));
    ['#e8705f', '#5f8fe8', '#58b36a', '#ffd23f'].forEach((c, i) => circle(px2 - 4 * z + i * 2.8 * z, py2 - 5 * z + (i & 1) * 2.4 * z, 1.5 * z, C(c)));
  },
};

// ---------------------------------------------------------------------------
// Häuser in fünf Stufen: Häuschen, Fachwerk, Reetdach, Stadthaus, Turmhaus
// ---------------------------------------------------------------------------
function flowerBox(P, Q, t0, t1, h, z) {
  faceQuad(P, Q, t0 - 0.03, t1 + 0.03, h - 1.6 * z, h, C('#8a5a3c'));
  const a = lerp(P, Q, t0), b = lerp(P, Q, t1);
  for (let i = 0; i < 4; i++) {
    const m = lerp(a, b, (i + 0.5) / 4);
    circle(m[0], m[1] - h - 1.2 * z, 1.4 * z, C(['#ff8fb1', '#fff27a', '#ffffff', '#c49bff'][i]));
  }
}
function drawHouse(cx, cy, z, now, x, y, lvl, t) {
  const hw = TW / 2 * z, hh = TH / 2 * z;
  const wall = WALLS[t && t.wall != null ? t.wall : Math.floor(hash(x, y, 3) * 7)];
  const roof = ROOFS[t && t.roof != null ? t.roof : Math.floor(hash(x, y, 4) * 7)];
  const rot = (t && t.rot) || 0;
  const stage = Math.min(lvl || 1, 5);
  const faces = bx => {
    const left = [bx.L, bx.B], right = [bx.B, bx.R], r = rot & 3;
    return { door: r === 0 ? right : r === 1 ? left : null, win: r === 0 ? [left] : r === 1 ? [right] : [left, right] };
  };
  if (stage === 1) {                               // Häuschen
    const s = 0.5, h = 13 * z;
    shadow(cx, cy, hw * s * 1.1, hh * s * 1.1);
    const bx = box(cx, cy, hw * s, hh * s, h, wall, roof, 12 * z);
    doorWin(bx, h, z, rot);
    return;
  }
  if (stage === 2) {                               // Fachwerkhaus mit Blumenkasten
    const s = 0.54, h = 17 * z;
    shadow(cx, cy, hw * s * 1.1, hh * s * 1.1);
    const bx = box(cx, cy, hw * s, hh * s, h, wall, roof, 13 * z);
    const f = faces(bx);
    g.strokeStyle = C('#7a5236'); g.lineWidth = 1.1 * z;
    for (const [P, Q] of [[bx.L, bx.B], [bx.B, bx.R]]) {
      g.beginPath();
      for (const tt of [0.02, 0.5, 0.98]) { const a = lerp(P, Q, tt); g.moveTo(a[0], a[1]); g.lineTo(a[0], a[1] - h); }
      const a = P, b = Q;
      g.moveTo(a[0], a[1] - h * 0.5); g.lineTo(b[0], b[1] - h * 0.5);
      const m = lerp(P, Q, 0.25), n = lerp(P, Q, 0.75);
      g.moveTo(a[0], a[1] - h * 0.5); g.lineTo(m[0], m[1] - h); g.moveTo(b[0], b[1] - h * 0.5); g.lineTo(n[0], n[1] - h);
      g.stroke();
    }
    if (f.door) door(f.door[0], f.door[1], h * 0.9);
    for (const w of f.win) { windowOn(w[0], w[1], 0.28, 0.46, h * 0.2, h * 0.42, z); windowOn(w[0], w[1], 0.58, 0.76, h * 0.62, h * 0.86, z); flowerBox(w[0], w[1], 0.58, 0.76, h * 0.62, z); }
    return;
  }
  if (stage === 3) {                               // Reetdachhaus mit Garten
    const s = 0.52, h = 13 * z;
    ellipse(cx, cy + 2 * z, hw * 0.8, hh * 0.8, C('#86c35b'));
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + i * 0.12), gx = cx + Math.cos(a) * hw * 0.78, gy = cy + Math.sin(a) * hh * 0.78;
      circle(gx, gy - 2 * z, 2.6 * z, C('#5aa84f'));
      if (i % 2) circle(gx, gy - 3.5 * z, 1.3 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
    }
    shadow(cx, cy, hw * s * 1.1, hh * s * 1.1);
    const bx = box(cx, cy, hw * s, hh * s, h, wall, '#c9a25a', 19 * z);
    doorWin(bx, h, z, rot);
    circle(cx - 1 * z, cy - h - 17 * z, 1.3 * z, C('#a8833f'));
    const chx = cx + hw * 0.18, chy = cy - h - 6 * z;
    box(chx, chy, 2 * z, 1 * z, 8 * z, '#b35a45', null, 0);
    smoke(chx, chy - 9 * z, z, now);
    return;
  }
  if (stage === 4) {                               // Stadthaus mit Balkon
    const s = 0.52, h = 27 * z;
    shadow(cx, cy, hw * s * 1.15, hh * s * 1.15);
    const bx = box(cx, cy, hw * s, hh * s, h, wall, roof, 8 * z);
    const f = faces(bx);
    if (f.door) door(f.door[0], f.door[1], h * 0.45);
    for (const w of [[bx.L, bx.B], [bx.B, bx.R]]) {
      for (const [t0, t1] of [[0.15, 0.4], [0.6, 0.85]]) {
        if (f.door && w === f.door && t0 > 0.5) continue;
        windowOn(w[0], w[1], t0, t1, h * 0.12, h * 0.36, z);
      }
      windowOn(w[0], w[1], 0.15, 0.4, h * 0.58, h * 0.82, z);
      windowOn(w[0], w[1], 0.6, 0.85, h * 0.58, h * 0.82, z);
    }
    const bf = f.door || f.win[0];
    faceQuad(bf[0], bf[1], 0.3, 0.7, h * 0.52, h * 0.56, C('#8a5a3c'));
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = 0.9 * z;
    g.beginPath();
    for (let i = 0; i <= 6; i++) { const m = lerp(bf[0], bf[1], 0.3 + i * 0.4 / 6); g.moveTo(m[0], m[1] - h * 0.56); g.lineTo(m[0], m[1] - h * 0.66); }
    const a = lerp(bf[0], bf[1], 0.3), b = lerp(bf[0], bf[1], 0.7);
    g.moveTo(a[0], a[1] - h * 0.66); g.lineTo(b[0], b[1] - h * 0.66);
    g.stroke();
    circle(lerp(bf[0], bf[1], 0.36)[0], lerp(bf[0], bf[1], 0.36)[1] - h * 0.6, 1.8 * z, C('#58b36a'));
    return;
  }
  // Stufe 5: Turmhaus mit Katze am Fenster
  const s = 0.5, h = 20 * z;
  shadow(cx, cy, hw * s * 1.2, hh * s * 1.2);
  const bx = box(cx - 2 * z, cy, hw * s, hh * s, h, wall, roof, 12 * z);
  doorWin(bx, h, z, rot);
  const tx = cx + hw * 0.42, ty = cy + hh * 0.1, tr = 6 * z, th = 34 * z;
  ellipse(tx, ty, tr, tr * 0.5, C(shade(wall, -0.13)));
  g.fillStyle = C(wall); g.fillRect(tx - tr, ty - th, tr * 2, th);
  g.fillStyle = C(shade(wall, -0.13)); g.fillRect(tx, ty - th, tr, th);
  ellipse(tx, ty - th, tr, tr * 0.5, C(shade(wall, 0.05)));
  poly([[tx - tr * 1.2, ty - th], [tx + tr * 1.2, ty - th], [tx, ty - th - 16 * z]], C(roof));
  poly([[tx, ty - th], [tx + tr * 1.2, ty - th], [tx, ty - th - 16 * z]], C(shade(roof, -0.18)));
  const wy = ty - th * 0.62;
  g.fillStyle = night > 0.15 && isLive() ? '#ffd873' : C('#a8dcff');
  g.beginPath(); g.ellipse(tx - 1.5 * z, wy, 2.4 * z, 3.4 * z, 0, 0, Math.PI * 2); g.fill();
  glowQuad([[tx - 4 * z, wy - 3 * z], [tx + 1 * z, wy - 3 * z], [tx + 1 * z, wy + 3 * z], [tx - 4 * z, wy + 3 * z]], 16 * z);
  // Katze auf dem Fensterbrett
  const cxw = tx - 1.5 * z, cyw = wy + 3.6 * z, tail = Math.sin(now / 400) * 1.5 * z;
  ellipse(cxw, cyw, 2.4 * z, 1.4 * z, C('#f4c28f'));
  circle(cxw - 1.6 * z, cyw - 1.8 * z, 1.4 * z, C('#f4c28f'));
  poly([[cxw - 2.8 * z, cyw - 2.2 * z], [cxw - 2.4 * z, cyw - 3.8 * z], [cxw - 1.6 * z, cyw - 2.8 * z]], C('#f4c28f'));
  g.strokeStyle = C('#f4c28f'); g.lineWidth = 0.9 * z;
  g.beginPath(); g.moveTo(cxw + 2 * z, cyw); g.quadraticCurveTo(cxw + 3.5 * z, cyw + 2 * z, cxw + 3 * z + tail, cyw + 3.5 * z); g.stroke();
}

// Tür und Fenster je nach Drehung: 0 = Tür rechts vorn, 1 = Tür links vorn, 2/3 = Tür hinten (unsichtbar)
function doorWin(bx, h, z, rot, wins = [[0.32, 0.62]], doorH = 1) {
  const left = [bx.L, bx.B], right = [bx.B, bx.R], r = (rot || 0) & 3;
  const doorFace = r === 0 ? right : r === 1 ? left : null;
  const winFaces = r === 0 ? [left] : r === 1 ? [right] : [left, right];
  if (doorFace) door(doorFace[0], doorFace[1], h * doorH);
  for (const f of winFaces) for (const [a, b] of wins) windowOn(f[0], f[1], a, b, h * 0.35, h * 0.72, z);
}
// Unregelmäßige Objekte werden bei ungerader Drehung gespiegelt
const MIRROR = new Set(['holz', 'fischer', 'bank', 'obst', 'stein', 'mine']);
const ROTATABLE = new Set([...MIRROR, 'haus', 'muehle', 'steinmetz', 'schmiede',
  'rathaus', 'markt', 'hafen', 'schule', 'uni', 'park', 'baecker', 'saege', 'fabrik', 'bibliothek', 'kunst']);
let buildRot = 0;
// Deko im Verhältnis zu Häusern: kleine Dinge auch klein zeichnen
const DECO_SCALE = { bank: 0.45, laterne: 0.62, hecke: 0.5, blumentopf: 0.8, busch: 0.8, brunnen: 0.72, pavillon: 0.8, statue: 0.7, baum: 0.8, blumen: 0.85, windrad: 0.9 };
const decoScale = b => DECO_SCALE[b] || 1;
function rotateBuild() {
  buildRot = (buildRot + 1) % 4;
  previewCache = null;
  sfx('deco');
}

function drawObject(type, cx, cy, z, now, x, y, lvl, t) {
  if (BIG_ART[type]) { const [w, h] = sizeOf(type, t && t.rot); BIG_ART[type](cx, cy, z, now, x, y, lvl, t || {}, w / 2, h / 2); return; }
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'haus': drawHouse(cx, cy, z, now, x, y, lvl, t); break;
    case 'feld': {
      diamond(cx, cy, hw * 0.76, hh * 0.76, C('#b8885a'));
      g.strokeStyle = C('#e9b93f'); g.lineWidth = 1.7 * z; g.lineCap = 'round';
      g.beginPath();
      const th = (5 + lvl * 0.8) * z;
      for (let s = -4; s <= 4; s++) for (let i = -2; i <= 2; i++) {
        const j = s - i;
        if (j < -2 || j > 2) continue;
        const u = i * 0.13, v = j * 0.13;
        const bx = cx + (u - v) * TW / 2 * z, by = cy + (u + v) * TH / 2 * z;
        const sw = Math.sin(now / 700 + i * 0.7 + j) * 1.2 * z;
        g.moveTo(bx - 1.5 * z, by); g.lineTo(bx - 1.5 * z + sw, by - th);
        g.moveTo(bx + 1.5 * z, by); g.lineTo(bx + 1.5 * z + sw, by - th * 0.85);
      }
      g.stroke();
      break;
    }
    case 'blumen': {
      diamond(cx, cy, hw * 0.72, hh * 0.72, C('#a8764c'));
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const u = (hash(x, y, 100 + i) - 0.5) * 0.62, v = (hash(x, y, 120 + i) - 0.5) * 0.62;
        pts.push([cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z, i]);
      }
      pts.sort((a, b) => a[1] - b[1]);
      for (const [px, py, i] of pts) {
        circle(px, py - 1.5 * z, 2.4 * z, C('#5aa84f'));
        circle(px, py - 3 * z, 2.2 * z, C(FLOWER_COLS[i % FLOWER_COLS.length]));
      }
      break;
    }
    case 'holz': {
      drawForest(cx, cy, z, x, y, 2);
      const bx = box(cx + 5 * z, cy + 4 * z, hw * 0.3, hh * 0.3, 9 * z, '#c98d5c', '#7a4f2a', 8 * z);
      door(bx.B, bx.R, 9 * z);
      for (const [lx, ly] of [[-11, 7], [-7, 9], [-9, 5]]) {
        ellipse(cx + lx * z, cy + ly * z, 3.2 * z, 2.6 * z, C('#b57b4a'));
        ellipse(cx + lx * z - 2.4 * z, cy + ly * z, 1.6 * z, 2.4 * z, C('#ecd1a4'));
      }
      break;
    }
    case 'obst': {
      diamond(cx, cy, hw * 0.76, hh * 0.76, C('#86c35b'));
      for (const [u, v] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
        const px = cx + (u - v) * TW / 2 * z, py = cy + (u + v) * TH / 2 * z;
        tree(px, py, z * 0.7, 0.3, '#ff6b5e');
      }
      box(cx + 11 * z, cy + 5 * z, 3 * z, 1.5 * z, 3 * z, '#c98d5c', null, 0);
      break;
    }
    case 'fischer': {
      shadow(cx, cy, hw * 0.45, hh * 0.45);
      const h = 11 * z;
      const bx = box(cx - 2 * z, cy, hw * 0.38, hh * 0.38, h, '#eef8ff', '#3e8ed0', 9 * z);
      door(bx.B, bx.R, h);
      windowOn(bx.L, bx.B, 0.35, 0.62, h * 0.4, h * 0.75, z);
      g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1.3 * z;
      g.beginPath();
      g.moveTo(cx + 9 * z, cy + 2 * z); g.lineTo(cx + 20 * z, cy - 12 * z);
      g.quadraticCurveTo(cx + 25 * z, cy - 4 * z, cx + 24 * z, cy + 6 * z);
      g.stroke();
      circle(cx + 24 * z, cy + 6 * z + Math.sin(now / 400) * 0.8 * z, 1.8 * z, C('#ff5a4f'));
      break;
    }
    case 'stein': {
      diamond(cx, cy, hw * 0.76, hh * 0.76, C('#9ea3ab'));
      boulder(cx - 8 * z, cy - 2 * z, (6 + lvl * 0.5) * z);
      boulder(cx + 7 * z, cy - 3 * z, (5 + lvl * 0.5) * z);
      const bx = box(cx + 2 * z, cy + 6 * z, hw * 0.16, hh * 0.16, 4 * z, '#8a5a3c', null, 0);
      circle(bx.L[0] + 3 * z, bx.L[1] - 5 * z, 2 * z, C('#c7cad2'));
      break;
    }
    case 'mine': {
      diamond(cx, cy, hw * 0.76, hh * 0.76, C('#a89a80'));
      ellipse(cx - 2 * z, cy - 4 * z, 14 * z, 10 * z, C('#9a9ea8'));
      ellipse(cx - 5 * z, cy - 8 * z, 7 * z, 4 * z, C('#c3c6ce'));
      poly([[cx - 4 * z, cy + 2 * z], [cx + 4 * z, cy + 2 * z], [cx + 4 * z, cy - 7 * z], [cx - 4 * z, cy - 7 * z]], C('#3b3440'));
      g.strokeStyle = C('#8a5a3c'); g.lineWidth = 2 * z;
      g.beginPath(); g.moveTo(cx - 5 * z, cy + 2 * z); g.lineTo(cx - 5 * z, cy - 8 * z); g.lineTo(cx + 5 * z, cy - 8 * z); g.lineTo(cx + 5 * z, cy + 2 * z); g.stroke();
      box(cx + 10 * z, cy + 5 * z, 3.5 * z, 2 * z, 4 * z, '#6b7a8f', null, 0);
      circle(cx + 10 * z, cy + 0.5 * z, 2 * z, C('#f2c14e'));
      break;
    }
    case 'muehle': {
      shadow(cx, cy, hw * 0.45, hh * 0.45);
      const h = (24 + 2 * lvl) * z;
      const bx = box(cx, cy, hw * 0.34, hh * 0.34, h, '#fff6e4', '#c65a45', 12 * z);
      doorWin(bx, h, z, t && t.rot, [], 0.5);
      const odd = t && (t.rot & 1);
      const m = odd ? lerp(bx.B, bx.R, 0.5) : lerp(bx.L, bx.B, 0.5);
      blades(m[0] - 1 * z, m[1] - h * 0.8, z, now, 4, 15 * z, '#f3e3c3');
      break;
    }
    case 'leuchtturm': {
      shadow(cx, cy, hw * 0.45, hh * 0.45);
      diamond(cx, cy, hw * 0.5, hh * 0.5, C('#c9ccd6'));
      const h = 46 * z, a = hw * 0.26, b = hh * 0.26;
      const bx = box(cx, cy, a, b, h, '#ffffff', null, 0);
      for (const [h0, h1] of [[0.18, 0.34], [0.52, 0.68]]) {
        faceQuad(bx.L, bx.B, 0, 1, h * h0, h * h1, C('#e8604f'));
        faceQuad(bx.B, bx.R, 0, 1, h * h0, h * h1, C('#c94f40'));
      }
      door(bx.B, bx.R, h * 0.3);
      const top = cy - h;
      const lamp = box(cx, top, a * 0.8, b * 0.8, 8 * z, '#fff3b0', '#e8604f', 7 * z);
      glowQuad([[lamp.L[0], lamp.L[1]], [lamp.B[0], lamp.B[1]], [lamp.B[0], lamp.B[1] - 8 * z], [lamp.L[0], lamp.L[1] - 8 * z]], 60 * z);
      if (night > 0.15 && isLive()) {
        const ang = now / 1400, lx = cx, ly = top - 4 * z, len = 140 * z;
        g.save();
        g.globalCompositeOperation = 'lighter';
        const grd = g.createRadialGradient(lx, ly, 0, lx, ly, len);
        grd.addColorStop(0, 'rgba(255,230,150,0.35)'); grd.addColorStop(1, 'rgba(255,230,150,0)');
        g.fillStyle = grd;
        g.beginPath(); g.moveTo(lx, ly);
        g.lineTo(lx + Math.cos(ang - 0.12) * len, ly + Math.sin(ang - 0.12) * len * 0.5);
        g.lineTo(lx + Math.cos(ang + 0.12) * len, ly + Math.sin(ang + 0.12) * len * 0.5);
        g.closePath(); g.fill();
        g.restore();
      }
      break;
    }
    // --- Verkehr & Strom ---
    case 'windrad': {
      ellipse(cx, cy + 1 * z, 5 * z, 2.5 * z, 'rgba(40,60,20,0.15)');
      g.strokeStyle = C('#f4f4f4'); g.lineWidth = 3 * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 38 * z); g.stroke();
      blades(cx, cy - 39 * z, z, now * 1.4, 3, 16 * z, '#ffffff');
      break;
    }
    // --- Bildung ---
    case 'steinmetz': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = 12 * z;
      const bx = box(cx - 3 * z, cy - 1 * z, hw * 0.44, hh * 0.44, h, '#dcd6ca', '#8a8f99', 9 * z);
      doorWin(bx, h, z, t && t.rot);
      box(cx + 11 * z, cy + 5 * z, 3 * z, 1.5 * z, 3 * z, '#cfc8bb', null, 0);
      box(cx + 7 * z, cy + 7 * z, 3 * z, 1.5 * z, 3 * z, '#bdb7ab', null, 0);
      box(cx + 9 * z, cy + 6 * z - 3 * z, 3 * z, 1.5 * z, 3 * z, '#e0dbd1', null, 0);
      break;
    }
    case 'schmiede': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = 13 * z;
      const bx = box(cx, cy, hw * 0.48, hh * 0.48, h, '#a86f5c', '#4a4a58', 9 * z);
      doorWin(bx, h, z, t && t.rot, []);
      const glow = 0.6 + 0.4 * Math.sin(now / 180);
      faceQuad(bx.L, bx.B, 0.3, 0.7, h * 0.2, h * 0.6, `rgba(255,${Math.round(120 + 60 * glow)},60,1)`);
      const chx = cx + hw * 0.25, chy = cy - h - 2 * z;
      box(chx, chy, 2.6 * z, 1.3 * z, 10 * z, '#6b4f3a', null, 0);
      smoke(chx, chy - 12 * z, z, now, true);
      box(cx + 13 * z, cy + 5 * z, 3 * z, 1.5 * z, 3 * z, '#4a4a58', null, 0);
      break;
    }
    // --- Deko ---
    case 'weg': drawPath(cx, cy, z, x, y, t); break;
    case 'baum': tree(cx, cy + 2 * z, z * 1.05, 0.9); break;
    case 'blumentopf': {
      ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,60,20,0.15)');
      poly([[cx - 7 * z, cy - 9 * z], [cx + 7 * z, cy - 9 * z], [cx + 5 * z, cy], [cx - 5 * z, cy]], C('#d9825b'));
      ellipse(cx, cy - 9 * z, 7 * z, 2.6 * z, C('#b8663f'));
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2, fx = cx + Math.cos(a) * 4 * z, fy = cy - 12 * z + Math.sin(a) * 2 * z;
        circle(fx, fy + 2 * z, 2.6 * z, C('#5aa84f'));
        circle(fx, fy - 1 * z, 2.4 * z, C(FLOWER_COLS[(i + Math.floor(hash(x, y, 7) * 5)) % FLOWER_COLS.length]));
      }
      break;
    }
    case 'kristall': {
      ellipse(cx, cy + 1 * z, 6 * z, 2.6 * z, 'rgba(40,40,60,0.18)');
      poly([[cx - 5 * z, cy], [cx - 1 * z, cy + 1 * z], [cx - 3 * z, cy - 10 * z]], C('#b98cf2'));
      poly([[cx - 1 * z, cy + 1 * z], [cx + 3 * z, cy], [cx + 1 * z, cy - 15 * z]], C('#9d6fe0'));
      poly([[cx + 3 * z, cy], [cx + 6 * z, cy - 1 * z], [cx + 5 * z, cy - 8 * z]], C('#c7a6f7'));
      glowQuad([[cx - 2 * z, cy - 12 * z], [cx + 2 * z, cy - 12 * z], [cx + 2 * z, cy - 4 * z], [cx - 2 * z, cy - 4 * z]], 18 * z);
      break;
    }
    case 'busch': {
      ellipse(cx, cy + 1 * z, 9 * z, 3.5 * z, 'rgba(40,60,20,0.18)');
      circle(cx - 4 * z, cy - 5 * z, 6 * z, C('#4f9e4a'));
      circle(cx + 4 * z, cy - 5 * z, 6 * z, C('#58ad52'));
      circle(cx, cy - 9 * z, 6.5 * z, C('#62b85a'));
      circle(cx - 2 * z, cy - 11 * z, 2.6 * z, C('#86d37c'));
      break;
    }
    case 'hecke': {
      box(cx, cy, hw * 0.45, hh * 0.45, 6 * z, '#4f9e4a', null, 0);
      for (let i = 0; i < 5; i++) {
        const p = lerp([cx - hw * 0.45, cy - 6 * z], [cx + hw * 0.45, cy - 6 * z], i / 4);
        circle(p[0], p[1] - Math.sin(i / 4 * Math.PI) * hh * 0.3, 3.4 * z, C('#62b85a'));
      }
      break;
    }
    case 'bank': {
      shadow(cx, cy, hw * 0.35, hh * 0.25);
      g.fillStyle = C('#6b4f3a');
      for (const dx of [-8, 8]) g.fillRect(cx + dx * z - 0.8 * z, cy - 4 * z + dx * 0.25 * z, 1.6 * z, 5 * z);
      poly([[cx - 11 * z, cy - 5 * z], [cx + 7 * z, cy - 1 * z], [cx + 11 * z, cy - 3 * z], [cx - 7 * z, cy - 7 * z]], C('#c68b59'));
      poly([[cx - 7 * z, cy - 7 * z], [cx + 11 * z, cy - 3 * z], [cx + 11 * z, cy - 9 * z], [cx - 7 * z, cy - 13 * z]], C('#b57b4a'));
      break;
    }
    case 'laterne': {
      ellipse(cx, cy + 1 * z, 4 * z, 2 * z, 'rgba(40,60,20,0.15)');
      g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.8 * z;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 22 * z); g.stroke();
      const lit = night > 0.15 && isLive();
      const lb = box(cx, cy - 22 * z, 2.6 * z, 1.4 * z, 5 * z, lit ? '#ffe58a' : '#fff7d6', '#4a4a58', 3 * z);
      glowQuad([[lb.L[0], lb.L[1]], [lb.R[0], lb.R[1]], [lb.R[0], lb.R[1] - 5 * z], [lb.L[0], lb.L[1] - 5 * z]], 34 * z);
      break;
    }
    case 'brunnen': {
      ellipse(cx, cy, hw * 0.7, hh * 0.7, C('#aeb2bd'));
      ellipse(cx, cy - 3 * z, hw * 0.7, hh * 0.7, C('#d2d5de'));
      ellipse(cx, cy - 3 * z, hw * 0.55, hh * 0.55, C('#74d0e6'));
      g.fillStyle = C('#c9ccd6');
      g.fillRect(cx - 1.8 * z, cy - 14 * z, 3.6 * z, 11 * z);
      for (let i = 0; i < 6; i++) {
        const ph = (now / 900 + i / 6) % 1, a = i / 6 * Math.PI * 2;
        circle(cx + Math.cos(a) * ph * 10 * z, cy - 15 * z + Math.sin(a) * ph * 5 * z - Math.sin(ph * Math.PI) * 6 * z,
          1.3 * z, `rgba(200,240,255,${1 - ph})`);
      }
      break;
    }
    case 'pavillon': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      diamond(cx, cy, hw * 0.62, hh * 0.62, C('#efe6d8'));
      g.strokeStyle = C('#ffffff'); g.lineWidth = 2 * z;
      for (const [px, py] of [[-14, 0], [14, 0], [0, 7], [0, -7]]) { g.beginPath(); g.moveTo(cx + px * z, cy + py * z); g.lineTo(cx + px * z, cy + py * z - 14 * z); g.stroke(); }
      const top = cy - 14 * z;
      poly([[cx - 18 * z, top], [cx, top + 9 * z], [cx, top - 12 * z]], C('#8fd0c3'));
      poly([[cx, top + 9 * z], [cx + 18 * z, top], [cx, top - 12 * z]], C('#6fb8aa'));
      circle(cx, top - 12 * z, 1.8 * z, C('#f2c14e'));
      break;
    }
    case 'statue': {
      shadow(cx, cy, hw * 0.4, hh * 0.4);
      box(cx, cy, hw * 0.3, hh * 0.3, 9 * z, '#e5dccb', null, 0);
      const sx = cx, sy = cy - 22 * z, R = 9 * z, r = 4 * z, rot = Math.sin(now / 1500) * 0.15;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
        pts.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr]);
      }
      poly(pts, C('#f2c14e'));
      circle(sx - 2 * z, sy - 3 * z, 1.8 * z, 'rgba(255,255,255,0.7)');
      break;
    }
    case 'lm': drawLandmark(t ? t.lm : 'baum', cx, cy, z, now, x, y, t && t.stage != null ? t.stage : lmStage(t ? t.lm : 'baum')); break;
  }
}

// Sehenswürdigkeit in ihrer Stufe: 0 = verfallen (grau, überwuchert), 1–3 mit immer mehr Details
function drawLandmark(type, cx, cy, z, now, x, y, stage = 1) {
  if (stage <= 0) {
    RUIN = true;
    drawLandmarkBase(type, cx, cy, z, 0, x, y);
    RUIN = false;
    // Gestrüpp und Schutt
    for (let i = 0; i < 7; i++) {
      const a = hash(x, y, 700 + i) * Math.PI * 2, r = 0.25 + hash(x, y, 710 + i) * 0.25;
      const bx = cx + Math.cos(a) * r * TW * z, by = cy + Math.sin(a) * r * TH * z;
      if (i % 3) circle(bx, by - 2 * z, (3 + hash(x, y, 720 + i) * 3) * z, C(i % 2 ? '#6f8f4a' : '#7d9a55'));
      else ellipse(bx, by, 3 * z, 1.8 * z, C('#9a948a'));
    }
    return;
  }
  drawLandmarkBase(type, cx, cy, z, now, x, y);
  const F = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const mini = (b, u, v, s, rot = 0) => { const [px, py] = F(u, v); g.save(); g.translate(px, py); g.scale(s, s); drawObject(b, 0, 0, z, now, x, y, 1, { rot }); g.restore(); };
  switch (type) {
    case 'baum':
      if (stage >= 2) { mini('bank', 0.38, 0.1, 0.45, 1); mini('bank', -0.1, 0.38, 0.45, 0); }
      if (stage >= 3) for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, lx = cx + Math.cos(a) * 16 * z, ly = cy - 38 * z + Math.sin(a) * 9 * z;
        const lit = night > 0.15 && isLive();
        circle(lx, ly, 1.6 * z, lit ? '#ffe58a' : C(['#ffd23f', '#ff8fb1', '#8fc1f0'][i % 3]));
        glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 10 * z);
      }
      break;
    case 'obsthain':
      if (stage >= 2) { tree(...F(0.35, -0.25), z * 0.8, 0.3, '#ff6b5e'); for (const [u, v] of [[0.3, 0.3], [0.1, 0.4]]) box(...F(u, v), 3 * z, 1.5 * z, 3 * z, '#c98d5c', null, 0); }
      if (stage >= 3) mini('pavillon', -0.3, 0.35, 0.5);
      break;
    case 'klippe':
      if (stage >= 2) mini('muehle', -0.4, 0.2, 0.55, 1);
      if (stage >= 3) for (let i = 0; i < 3; i++) {
        const kx = cx + (i - 1) * 16 * z + Math.sin(now / 900 + i) * 3 * z, ky = cy - 60 * z - i * 6 * z;
        poly([[kx, ky - 5 * z], [kx + 4 * z, ky], [kx, ky + 6 * z], [kx - 4 * z, ky]], C(['#e8705f', '#5f8fe8', '#f2b53a'][i]));
        g.strokeStyle = C('#6b6f78'); g.lineWidth = 0.6 * z;
        g.beginPath(); g.moveTo(kx, ky + 6 * z); g.quadraticCurveTo(kx + 6 * z, ky + 24 * z, cx + 4 * z, cy - 20 * z); g.stroke();
      }
      break;
    case 'ruine':
      if (stage >= 2) { const [mx, my] = F(0.3, -0.3); boxR(mx, my, z, 0.18, 0.14, 12 * z, '#efe6d8', '#7d6bb0', 6 * z); }
      if (stage >= 3) for (let i = 0; i < 3; i++) {
        const [ax, ay] = F(0.1, 0.35);
        g.strokeStyle = C('#d6ccb8'); g.lineWidth = 2 * z;
        g.beginPath(); g.ellipse(ax, ay, (8 + i * 4) * z, (3 + i * 2) * z, 0, Math.PI, 0); g.stroke();
      }
      break;
    case 'erzberg':
      poly([[cx - 4 * z, cy + 2 * z], [cx + 4 * z, cy + 2 * z], [cx + 4 * z, cy - 7 * z], [cx - 4 * z, cy - 7 * z]], C('#3b3440'));
      if (stage >= 2) { const [sx, sy] = F(0.4, 0.25); box(sx, sy, 4 * z, 2 * z, 7 * z, '#a86f5c', '#4a4a58', 4 * z); smoke(sx, sy - 13 * z, z, now, true); }
      if (stage >= 3) { const [tx, ty] = F(-0.4, 0.3); box(tx, ty, 2.5 * z, 1.3 * z, 20 * z, '#cfc8bb', '#6b7a8f', 6 * z); circle(tx, ty - 17 * z, 2 * z, C('#e9a23b')); }
      break;
    case 'quelle':
      for (let i = 0; i < 12 && stage >= 2; i++) {
        const a = i / 12 * Math.PI * 2;
        ellipse(cx + Math.cos(a) * hwq(z) , cy + Math.sin(a) * hwq(z) * 0.5, 2.6 * z, 1.6 * z, C('#aeb2bd'));
      }
      if (stage >= 3) { const [bx2, by2] = F(-0.35, -0.35); boxR(bx2, by2, z, 0.22, 0.2, 12 * z, '#fff1d6', '#c65a45', 8 * z); }
      break;
    case 'kristall':
      if (stage >= 2) for (const [u, v] of [[0.35, 0.1], [0.1, 0.35], [0.4, 0.35]]) {
        const [lx, ly] = F(u, v);
        g.strokeStyle = C('#4a4a58'); g.lineWidth = 1.2 * z;
        g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly - 12 * z); g.stroke();
        circle(lx, ly - 13 * z, 2 * z, '#e9d8ff');
        glowQuad([[lx - 2, ly - 15 * z], [lx + 2, ly - 15 * z], [lx + 2, ly - 11 * z], [lx - 2, ly - 11 * z]], 16 * z);
      }
      if (stage >= 3) { poly([[cx + 12 * z, cy + 2 * z], [cx + 18 * z, cy + 1 * z], [cx + 15 * z, cy - 16 * z]], C('#d9c7f7')); glowQuad([[cx - 8 * z, cy - 10 * z], [cx + 8 * z, cy - 10 * z], [cx + 8 * z, cy], [cx - 8 * z, cy]], 40 * z); }
      break;
  }
}
const hwq = z => TW / 2 * z * 0.78;
function drawLandmarkBase(type, cx, cy, z, now, x, y) {
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'quelle': {
      ellipse(cx, cy, hw * 0.85, hh * 0.85, C('#b9b3a8'));
      ellipse(cx, cy - 1 * z, hw * 0.7, hh * 0.7, C('#7fe0d8'));
      ellipse(cx - 5 * z, cy - 3 * z, hw * 0.25, hh * 0.2, C('#b8f3ee'));
      for (let i = 0; i < 4; i++) {
        const ph = (now / 2200 + i / 4) % 1;
        circle(cx + (i - 1.5) * 6 * z + Math.sin(ph * 5 + i) * 2 * z, cy - 6 * z - ph * 26 * z, (3 + ph * 5) * z, `rgba(255,255,255,${0.6 * (1 - ph)})`);
      }
      break;
    }
    case 'ruine': {
      diamond(cx, cy, hw * 0.8, hh * 0.8, C('#cfc6b3'));
      for (const [ox, oy, h] of [[-12, -2, 22], [-2, -6, 14], [9, -2, 26], [0, 6, 8]]) {
        box(cx + ox * z, cy + oy * z, 3 * z, 1.8 * z, h * z, '#e5dccb', null, 0);
      }
      box(cx + 10 * z, cy + 7 * z, 8 * z, 2 * z, 3 * z, '#d6ccb8', null, 0);
      circle(cx - 12 * z, cy - 23 * z, 3 * z, C('#62b85a'));
      break;
    }
    case 'erzberg': {
      ellipse(cx, cy - 6 * z, hw * 0.95, 20 * z, C('#9a9ea8'));
      ellipse(cx - 6 * z, cy - 16 * z, hw * 0.5, 10 * z, C('#b7bac3'));
      ellipse(cx - 9 * z, cy - 22 * z, 8 * z, 4 * z, C('#ffffff'));
      for (const [ox, oy] of [[6, -8], [-10, -4], [12, -16], [-2, -12], [16, -4]]) circle(cx + ox * z, cy + oy * z, 2 * z, C('#f2c14e'));
      break;
    }
    case 'obsthain': {
      tree(cx, cy + 4 * z, z * 1.8, 0.3, '#ff6b5e');
      tree(cx - 14 * z, cy + 2 * z, z * 0.9, 0.6, '#ffb13b');
      break;
    }
    case 'klippe': {
      poly([[cx - 18 * z, cy + 2 * z], [cx - 6 * z, cy - 30 * z], [cx + 8 * z, cy - 26 * z], [cx + 18 * z, cy + 4 * z], [cx, cy + 10 * z]], C('#a7abb6'));
      poly([[cx - 6 * z, cy - 30 * z], [cx + 8 * z, cy - 26 * z], [cx + 2 * z, cy - 18 * z]], C('#8fce6a'));
      g.strokeStyle = C('#6b6f78'); g.lineWidth = 1.4 * z;
      g.beginPath(); g.moveTo(cx + 4 * z, cy - 26 * z); g.lineTo(cx + 4 * z, cy - 44 * z); g.stroke();
      const w = Math.sin(now / 250) * 2 * z;
      poly([[cx + 4 * z, cy - 44 * z], [cx + 16 * z, cy - 42 * z + w], [cx + 4 * z, cy - 38 * z]], C('#ff8a3d'));
      break;
    }
    case 'baum': {
      ellipse(cx, cy + 2 * z, 20 * z, 8 * z, 'rgba(40,60,20,0.18)');
      g.fillStyle = C('#8a5a3c');
      g.fillRect(cx - 5 * z, cy - 26 * z, 10 * z, 26 * z);
      circle(cx, cy - 40 * z, 22 * z, C('#3f9a4f'));
      circle(cx - 12 * z, cy - 32 * z, 12 * z, C('#4aa857'));
      circle(cx + 12 * z, cy - 34 * z, 13 * z, C('#4aa857'));
      circle(cx - 6 * z, cy - 50 * z, 10 * z, C('#74cc7a'));
      for (let i = 0; i < 5; i++) {
        const ph = (now / 3000 + i / 5) % 1;
        circle(cx + Math.sin(ph * 7 + i) * 18 * z, cy - 60 * z + ph * 60 * z, 1.5 * z, `rgba(255,190,220,${1 - ph})`);
      }
      break;
    }
    case 'kristall': {
      ellipse(cx, cy - 2 * z, hw * 0.7, hh * 0.9, C('#8a8f99'));
      poly([[cx - 12 * z, cy - 2 * z], [cx - 6 * z, cy], [cx - 9 * z, cy - 20 * z]], C('#b98cf2'));
      poly([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx, cy - 30 * z]], C('#9d6fe0'));
      poly([[cx, cy - 30 * z], [cx + 4 * z, cy], [cx + 1 * z, cy - 1 * z]], C('#c7a6f7'));
      poly([[cx + 6 * z, cy], [cx + 13 * z, cy - 2 * z], [cx + 11 * z, cy - 18 * z]], C('#b98cf2'));
      glowQuad([[cx - 4 * z, cy], [cx + 4 * z, cy], [cx + 1 * z, cy - 25 * z], [cx - 1 * z, cy - 25 * z]], 30 * z);
      break;
    }
  }
}

function drawSmallOne(b, rot, sx, sy, z, now, x, y, sc) {
  const s = decoScale(b) * 0.9 * sc;
  g.save(); g.translate(sx, sy); g.scale((rot & 1) && MIRROR.has(b) ? -s : s, s);
  drawObject(b, 0, 0, z, now, x, y, 1, { rot });
  g.restore();
}
function drawSmall(k, px, py, z, now, x, y, which) {
  const ds = state.decos.get(k);
  if (!ds) return;
  for (const i of which) {
    const d = ds[i];
    if (!d) continue;
    const [u, v] = slotUV(i);
    let sc = 1;
    if (d.born) { const a = (now - d.born) / 380; if (a < 1) sc = 0.5 + 0.5 * Math.sin(a * Math.PI / 2); }
    drawSmallOne(d.b, d.rot || 0, px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z, z, now, x, y, sc);
  }
}

function drawBadge(cx, cy, z, lvl) {
  const r = 5.5 * z, bx = cx + 12 * z, by = cy - 30 * z;
  circle(bx, by, r, '#ffd75e');
  g.strokeStyle = '#b8860b'; g.lineWidth = 1.2 * z;
  g.beginPath(); g.arc(bx, by, r, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#6b4f3a';
  g.font = `900 ${7.5 * z}px Nunito, system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(lvl, bx, by + 0.4 * z);
}
function drawStatusIcon(cx, cy, z, icon, now) {
  const bob = Math.sin(now / 300) * 1.5 * z, x = cx - 10 * z, y = cy - 34 * z + bob, r = 6.5 * z;
  circle(x, y + 1.5, r, 'rgba(107,79,58,0.3)');
  circle(x, y, r, '#fffaf0');
  g.font = `${8 * z}px system-ui, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(icon, x, y + 0.5 * z);
}
