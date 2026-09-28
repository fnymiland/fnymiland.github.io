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

// Tür und Fenster je nach Drehung: 0 = Tür rechts vorn, 1 = Tür links vorn, 2/3 = Tür hinten (unsichtbar)
function doorWin(bx, h, z, rot, wins = [[0.32, 0.62]], doorH = 1) {
  const left = [bx.L, bx.B], right = [bx.B, bx.R], r = (rot || 0) & 3;
  const doorFace = r === 0 ? right : r === 1 ? left : null;
  const winFaces = r === 0 ? [left] : r === 1 ? [right] : [left, right];
  if (doorFace) door(doorFace[0], doorFace[1], h * doorH);
  for (const f of winFaces) for (const [a, b] of wins) windowOn(f[0], f[1], a, b, h * 0.35, h * 0.72, z);
}
// Unregelmäßige Objekte werden bei ungerader Drehung gespiegelt
const MIRROR = new Set(['holz', 'fischer', 'bank', 'hafen', 'fabrik', 'kunst', 'obst', 'stein', 'mine', 'markt']);
const ROTATABLE = new Set([...MIRROR, 'haus', 'muehle', 'baecker', 'schule', 'saege', 'steinmetz', 'schmiede']);
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
  const hw = TW / 2 * z, hh = TH / 2 * z;
  switch (type) {
    case 'haus': {
      const wall = WALLS[t && t.wall != null ? t.wall : Math.floor(hash(x, y, 3) * 7)];
      const roof = ROOFS[t && t.roof != null ? t.roof : Math.floor(hash(x, y, 4) * 7)];
      const s = 0.46 + 0.03 * lvl, h = (12 + 2.5 * lvl) * z;
      shadow(cx, cy, hw * s * 1.1, hh * s * 1.1);
      const bx = box(cx, cy, hw * s, hh * s, h, wall, roof, (12 + lvl) * z);
      doorWin(bx, h, z, t && t.rot);
      break;
    }
    case 'rathaus': {
      shadow(cx, cy, hw * 0.7, hh * 0.7);
      const h = 20 * z;
      drawFlag(cx + hw * 0.32, cy - hh * 0.5, z, now, state.town);
      const bx = box(cx, cy, hw * 0.58, hh * 0.58, h, '#fff1d6', '#6f8fd8', 16 * z);
      door(bx.B, bx.R, h);
      windowOn(bx.B, bx.R, 0.1, 0.3, h * 0.4, h * 0.75, z);
      windowOn(bx.B, bx.R, 0.72, 0.9, h * 0.4, h * 0.75, z);
      const m = lerp(bx.L, bx.B, 0.5), cy2 = m[1] - h * 0.62;
      circle(m[0], cy2, 4 * z, C('#ffffff'));
      g.strokeStyle = C('#6b4f3a'); g.lineWidth = 1 * z;
      g.beginPath(); g.arc(m[0], cy2, 4 * z, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(m[0], cy2); g.lineTo(m[0], cy2 - 3 * z); g.moveTo(m[0], cy2); g.lineTo(m[0] + 2 * z, cy2); g.stroke();
      break;
    }
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
    case 'baecker': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = (15 + lvl) * z;
      const bx = box(cx, cy, hw * 0.52, hh * 0.52, h, '#ffe8b0', '#9c5a32', 12 * z);
      doorWin(bx, h, z, t && t.rot, [[0.2, 0.45], [0.58, 0.82]]);
      const chx = cx + hw * 0.2, chy = cy - h - 3 * z;
      box(chx, chy, 2.6 * z, 1.3 * z, 9 * z, '#c0694a', null, 0);
      smoke(chx, chy - 11 * z, z, now);
      break;
    }
    case 'markt': {
      diamond(cx, cy, hw * 0.76, hh * 0.76, C('#eadcbf'));
      const stall = (sx, sy, roof) => {
        const bx = box(sx, sy, hw * 0.24, hh * 0.24, 8 * z, '#f5e1b8', roof, 5 * z);
        const f = lerp(bx.B, bx.R, 0.5);
        circle(f[0] - 2 * z, f[1] - 3 * z, 1.7 * z, C('#ff6b5e'));
        circle(f[0] + 1.5 * z, f[1] - 3.5 * z, 1.7 * z, C('#ffd23f'));
        circle(f[0] - 4 * z, f[1] - 1.5 * z, 1.7 * z, C('#7ccf5b'));
      };
      stall(cx - 10 * z, cy - 3 * z, '#e85d5d');
      stall(cx + 10 * z, cy - 3 * z, '#4fb0e0');
      stall(cx, cy + 6 * z, '#f2b53a');
      break;
    }
    case 'fabrik': {
      shadow(cx, cy, hw * 0.7, hh * 0.7);
      const h = 14 * z;
      const bx = box(cx, cy, hw * 0.62, hh * 0.62, h, '#d98a6a', null, 0);
      for (let i = 0; i < 3; i++) {
        const p = lerp([cx - hw * 0.5, cy - h], [cx + hw * 0.2, cy - h + hh * 0.35], i / 2.2);
        poly([[p[0], p[1]], [p[0] + 7 * z, p[1] + 3.5 * z], [p[0] + 7 * z, p[1] - 4 * z]], C('#8fa3b8'));
      }
      windowOn(bx.L, bx.B, 0.15, 0.4, h * 0.3, h * 0.7, z);
      windowOn(bx.L, bx.B, 0.55, 0.8, h * 0.3, h * 0.7, z);
      door(bx.B, bx.R, h);
      const chx = cx + hw * 0.35, chy = cy - h;
      box(chx, chy, 2.6 * z, 1.3 * z, 16 * z, '#b35a45', null, 0);
      smoke(chx, chy - 18 * z, z, now, true);
      break;
    }
    case 'hafen': {
      poly([[cx - hw * 0.9, cy], [cx, cy + hh * 0.9], [cx + hw * 0.9, cy], [cx, cy - hh * 0.9]], C('#c9955f'));
      g.strokeStyle = C('#a57645'); g.lineWidth = 1 * z;
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * 6 * z - 8 * z, cy + i * 3 * z - 4 * z); g.lineTo(cx + i * 6 * z + 8 * z, cy + i * 3 * z + 4 * z); g.stroke(); }
      g.strokeStyle = C('#e9a23b'); g.lineWidth = 2 * z;
      g.beginPath(); g.moveTo(cx - 8 * z, cy); g.lineTo(cx - 8 * z, cy - 28 * z); g.lineTo(cx + 8 * z, cy - 24 * z); g.stroke();
      g.lineWidth = 1 * z; g.beginPath(); g.moveTo(cx + 8 * z, cy - 24 * z); g.lineTo(cx + 8 * z, cy - 12 * z); g.stroke();
      box(cx + 8 * z, cy - 8 * z, 3 * z, 1.5 * z, 4 * z, '#5f8fe8', null, 0);
      const by = Math.sin(now / 700) * 1 * z;
      ellipse(cx + 14 * z, cy + 8 * z + by, 8 * z, 3 * z, C('#e8604f'));
      box(cx + 14 * z, cy + 5 * z + by, 3 * z, 1.5 * z, 4 * z, '#ffffff', null, 0);
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
    case 'schule': {
      shadow(cx, cy, hw * 0.65, hh * 0.65);
      const h = 16 * z;
      const bx = box(cx, cy, hw * 0.58, hh * 0.58, h, '#f6d7a7', '#d96c4f', 11 * z);
      doorWin(bx, h, z, t && t.rot, [[0.12, 0.35], [0.45, 0.68], [0.78, 0.95]]);
      box(cx, cy - h - 8 * z, 3 * z, 1.5 * z, 7 * z, '#fff4dc', '#d96c4f', 5 * z);
      circle(cx, cy - h - 11 * z, 1.4 * z, C('#e9a23b'));
      break;
    }
    case 'saege': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = 12 * z;
      const bx = box(cx - 3 * z, cy - 1 * z, hw * 0.44, hh * 0.44, h, '#c98d5c', '#7a4f2a', 9 * z);
      doorWin(bx, h, z, t && t.rot);
      for (const [lx, ly] of [[10, 5], [14, 3], [12, 1]]) {
        ellipse(cx + lx * z, cy + ly * z, 3.2 * z, 2.4 * z, C('#b57b4a'));
        ellipse(cx + lx * z - 2.4 * z, cy + ly * z, 1.4 * z, 2.2 * z, C('#ecd1a4'));
      }
      const sx = cx + 9 * z, sy = cy - 6 * z, a = now / 200;
      circle(sx, sy, 4.2 * z, C('#c7cad2'));
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 1 * z;
      g.beginPath(); for (let i = 0; i < 4; i++) { const b = a + i * Math.PI / 2; g.moveTo(sx, sy); g.lineTo(sx + Math.cos(b) * 4 * z, sy + Math.sin(b) * 4 * z); } g.stroke();
      break;
    }
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
    case 'bibliothek': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = 15 * z;
      const bx = box(cx, cy, hw * 0.52, hh * 0.52, h, '#efe6d8', '#7d6bb0', 9 * z);
      for (let i = 0; i < 4; i++) faceQuad(bx.B, bx.R, 0.1 + i * 0.22, 0.17 + i * 0.22, 0, h, C('#ffffff'));
      windowOn(bx.L, bx.B, 0.3, 0.7, h * 0.35, h * 0.75, z);
      break;
    }
    case 'uni': {
      shadow(cx, cy, hw * 0.8, hh * 0.8);
      const h = 20 * z;
      const bx = box(cx, cy, hw * 0.72, hh * 0.72, h, '#f3ead9', null, 0);
      for (let i = 0; i < 5; i++) faceQuad(bx.B, bx.R, 0.06 + i * 0.19, 0.12 + i * 0.19, 0, h, C('#ffffff'));
      windowOn(bx.L, bx.B, 0.15, 0.4, h * 0.35, h * 0.75, z);
      windowOn(bx.L, bx.B, 0.6, 0.85, h * 0.35, h * 0.75, z);
      g.beginPath(); g.ellipse(cx, cy - h, 12 * z, 12 * z, 0, Math.PI, 0); g.fillStyle = C('#5f8fe8'); g.fill();
      ellipse(cx - 3 * z, cy - h - 6 * z, 3 * z, 2 * z, C('#8fb4f2'));
      g.strokeStyle = C('#e9a23b'); g.lineWidth = 1.5 * z;
      g.beginPath(); g.moveTo(cx, cy - h - 12 * z); g.lineTo(cx, cy - h - 17 * z); g.stroke();
      break;
    }
    case 'kunst': {
      shadow(cx, cy, hw * 0.6, hh * 0.6);
      const h = 16 * z;
      const bx = box(cx, cy, hw * 0.52, hh * 0.52, h, '#ffe3ef', '#f28cb1', 12 * z);
      door(bx.B, bx.R, h);
      windowOn(bx.L, bx.B, 0.25, 0.75, h * 0.3, h * 0.8, z);
      const px = cx + hw * 0.55, py = cy - 6 * z;
      ellipse(px, py, 7 * z, 5 * z, C('#f7ecd4'));
      circle(px - 3 * z, py - 1 * z, 1.4 * z, C('#e8705f'));
      circle(px, py - 2 * z, 1.4 * z, C('#5f8fe8'));
      circle(px + 3 * z, py - 1 * z, 1.4 * z, C('#58b36a'));
      circle(px + 1 * z, py + 2 * z, 1.4 * z, C('#ffd23f'));
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
    case 'lm': drawLandmark(t ? t.lm : 'baum', cx, cy, z, now, x, y); break;
  }
}

function drawLandmark(type, cx, cy, z, now, x, y) {
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
