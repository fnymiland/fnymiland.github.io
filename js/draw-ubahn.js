'use strict';
// ---------------------------------------------------------------------------
// U-Bahn (Block 136, Entwürfe mit dem Nutzer 08.10.2026): Tunnelportale, U-Bahn-Eingänge, Tunnel in der Bauansicht.
// Portal = Schienenfeld R neben einem Tunnelfeld T (portalDir). Rahmen am Portal: a läuft von R zum Tunnel (Wand bei a = 0,5),
// b quer dazu, up in Bildpunkten bei z = 1.
//   Backstein/Naturstein: Stirnwand mit Bogen, dahinter ein Erdhügel über T (nur, wenn auf T oben nichts steht).
//   Rampe: offene Betonrinne im Feld R, das Gleis sinkt bis zur Wand ab; an den Längsseiten das eigene Geländer – außer dort
//   steht ein Zaun/eine Mauer/Hecke des Spielers auf der Feldkante (Nutzer: „eigenen Zaun drübersetzen“).
// Sieht man die Wand nicht (Tunnel läuft nach vorn, +x/+y), malt das Tunnelfeld den Hügel (drawTunnelHill) – sonst läge er unter
// den Wagen, die auf R vor ihm fahren.
// ---------------------------------------------------------------------------
const RAMP_W = 0.42, RAMP_D = 22;
const portalFaceShown = d => d[0] + d[1] < 0;                     // Wand zeigt zum Betrachter (Tunnel läuft nach hinten)
function portalFrame(cx, cy, z, d) {
  const L = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  return (a, b, up = 0) => { const p = L(d[0] * a - d[1] * b, d[1] * a + d[0] * b); return [p[0], p[1] - up * z]; };
}
function portalArch(S, a0, w, spring, top, n = 12) {
  const pts = [S(a0, -w, 0), S(a0, -w, spring)];
  for (let i = 0; i <= n; i++) { const t = Math.PI - i * Math.PI / n; pts.push(S(a0, Math.cos(t) * w, spring + Math.sin(t) * (top - spring))); }
  pts.push(S(a0, w, 0));
  return pts;
}
function portalLine(pts, col, w, z) { g.strokeStyle = C(col); g.lineWidth = w * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); }
// Erdhügel über dem Tunnelfeld: Kuppel aus Schichten, vorn an der Wand (a0) abgeschnitten
function portalHill(S, a0, len, H, wb, col) {
  const N = 22, ac = a0 + len * 0.32, ra = len * 0.68, M = 28;
  for (let k = 0; k <= N; k++) {
    const f = k / N, sc = Math.sqrt(1 - f * f), h = H * f, pts = [];
    for (let i = 0; i < M; i++) { const t = i / M * Math.PI * 2; pts.push(S(Math.max(a0, ac - ra * sc * Math.cos(t)), wb * sc * Math.sin(t), h)); }
    poly(pts, C(shade(col, -0.16 + 0.22 * f)));
  }
}
const HILL = { backstein: [1.8, 32, 0.78, '#8fcf68'], stein: [1.9, 36, 0.85, '#86c75f'] };
// Hügel nur, wenn auf dem Tunnelfeld oben nichts steht (sonst bleibt die Wand allein)
const hillFree = (x, y) => x > 1e5 || !COVER.has(x + ',' + y) && !decosAt(x + ',' + y) && terrainAt(x, y) !== 'water';
function drawPortal(cx, cy, z, x, y, d, form) {
  const S = portalFrame(cx, cy, z, d), shown = portalFaceShown(d), tx = x + d[0], ty = y + d[1];
  if (form === 'rampe') return drawRamp(S, z, x, y, d, shown);
  if (shown && hillFree(tx, ty)) portalHill(S, 0.5, ...HILL[form]);
  if (!shown) return;                                                   // Wand abgewandt: den Hügel malt das Tunnelfeld
  if (form === 'stein') {
    poly(portalArch(S, 0.48, 0.46, 9, 27), C('#a8a197'));
    for (let i = 0; i < 9; i++) {
      const t = Math.PI - i * Math.PI / 8, p = S(0.48, Math.cos(t) * 0.43, 10 + Math.sin(t) * 16);
      g.fillStyle = C(shade('#a8a197', hash(x * 9 + i, y, 3) * 0.25 - 0.12)); g.beginPath(); g.ellipse(p[0], p[1], 3.6 * z, 2.6 * z, 0, 0, 7); g.fill();
    }
    poly(portalArch(S, 0.48, 0.33, 9, 21), C('#231d1a'));
    if (hillFree(tx, ty)) for (const [b, h] of [[-0.7, 6], [0.72, 9], [0.1, 33]]) { const p = S(0.6, b, h); circle(p[0], p[1], 4.5 * z, C('#5fa847')); circle(p[0] - z, p[1] - 1.5 * z, 3 * z, C('#7cc45c')); }
    return;
  }
  const W0 = 0.44;                                                      // Backstein
  poly([S(0.5, -W0, 0), S(0.5, W0, 0), S(0.5, W0, 26), S(0.5, -W0, 26)], C('#b9644a'));
  for (let h = 3; h < 26; h += 3) portalLine([S(0.5, -W0, h), S(0.5, W0, h)], 'rgba(90,40,25,0.35)', 0.5, z);
  poly(portalArch(S, 0.5, 0.34, 10, 21), C('#d6c3a5'));
  poly(portalArch(S, 0.5, 0.29, 10, 18.5), C('#231d1a'));
  poly([S(0.5, -W0 - 0.03, 26), S(0.5, W0 + 0.03, 26), S(0.5, W0 + 0.03, 28.5), S(0.5, -W0 - 0.03, 28.5)], C('#d9cbb5'));
  for (const b of [-W0, W0 - 0.06]) poly([S(0.5, b, 0), S(0.5, b + 0.06, 0), S(0.5, b + 0.06, 26), S(0.5, b, 26)], C('#a3543d'));
}
// Hügel eines Portals mit abgewandter Wand – gemalt vom Tunnelfeld (render.js, nach den Wagen auf der Schiene davor)
function drawTunnelHill(x, y, px, py, z) {
  if (!hillFree(x, y)) return;
  for (const [dx, dy] of DIRS) {
    const rx = x - dx, ry = y - dy, d = portalDir(rx, ry);
    if (!d || d[0] !== dx || d[1] !== dy || portalFaceShown(d)) continue;
    const form = portalForm(rx, ry, d);
    if (form === 'rampe') continue;
    const p0 = toScreen(rx, ry);
    portalHill(portalFrame(p0.x, p0.y, z, d), 0.5, ...HILL[form]);
  }
}
// Rampe: Rinne über das Schienenfeld (a −0,5 … 0,5), am Tunnel RAMP_D tief
const rampDepth = a => RAMP_D * Math.pow(Math.max(0, Math.min(1, a + 0.5)), 1.25);
// Feldkante des Schienenfelds an der Längsseite b = ±0,5 (für Zaun statt Geländer)
function rampSideEdge(x, y, d, sg) {
  const u = -d[1] * sg * 0.5, v = d[0] * sg * 0.5;
  return Math.abs(v) > 0.4 ? 'a' + x + ',' + (y + (v > 0 ? 1 : 0)) : 'b' + (x + (u > 0 ? 1 : 0)) + ',' + y;
}
function drawRamp(S, z, x, y, d, shown) {
  const w = RAMP_W, N = 10, as = i => -0.5 + i / N;
  g.save();
  g.beginPath(); [S(-0.5, -w, 0), S(0.5, -w, 0), S(0.5, w, 0), S(-0.5, w, 0)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const floor = [];
  for (let i = 0; i <= N; i++) floor.push(S(as(i), -w, -rampDepth(as(i))));
  for (let i = N; i >= 0; i--) floor.push(S(as(i), w, -rampDepth(as(i))));
  poly(floor, C('#8e8a82'));
  for (const sg of [-1, 1]) {                                            // Innenwände: nur die, die zum Betrachter zeigen
    const nu = -d[1] * -sg, nv = d[0] * -sg;
    if (nu + nv <= 0) continue;
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) { top.push(S(as(i), sg * w, 0)); bot.push(S(as(i), sg * w, -rampDepth(as(i)))); }
    poly([...top, ...bot.reverse()], C('#bcb7ad'));
  }
  if (shown) {
    poly([S(0.5, -w, -RAMP_D), S(0.5, w, -RAMP_D), S(0.5, w, 0), S(0.5, -w, 0)], C('#a9a399'));
    poly([S(0.5, -0.28, -RAMP_D), S(0.5, 0.28, -RAMP_D), S(0.5, 0.28, -RAMP_D + 17), S(0.5, -0.28, -RAMP_D + 17)], C('#231d1a'));
  }
  for (const o of [-0.09, 0.09]) portalLine(Array.from({ length: N + 1 }, (_, i) => S(as(i), o, -rampDepth(as(i)))), '#7c838e', 1.1, z);
  g.restore();
  for (const sg of [-1, 1]) {                                            // Kante; Geländer nur ohne eigenen Zaun auf der Feldkante
    const b = sg * (w + 0.04);
    poly([S(-0.5, b - 0.04, 0), S(0.5, b - 0.04, 0), S(0.5, b + 0.04, 0), S(-0.5, b + 0.04, 0)], C('#d9d5cc'));
    if (state.edges.has(rampSideEdge(x, y, d, sg))) continue;
    portalLine([S(-0.5, b, 6), S(0.5, b, 6)], '#6a7280', 1, z);
    for (let a = -0.5; a <= 0.51; a += 0.25) portalLine([S(a, b, 0), S(a, b, 6)], '#6a7280', 0.8, z);
  }
  portalLine([S(0.5, -w - 0.04, 6), S(0.5, w + 0.04, 6)], '#6a7280', 1, z);
}

// Zugwagen am Portal (render.js): wo die Wand ist, wird der Wagen abgeschnitten; in der Rampe sinkt er mit dem Gleis
// → { k: Feld, auf dem er gezeichnet wird, cut: [lo, hi] längs des Wagens, portal } | 'hide' | null (kein Tunnel in der Nähe)
function trainTunnelCut(m) {
  if (!state.tunnels || !state.tunnels.size) return null;
  const rx = Math.round(m.px), ry = Math.round(m.py);
  let R = null, d = null;
  const pd = portalDir(rx, ry);
  if (pd) { R = [rx, ry]; d = pd; }
  else if (tunnelAt(rx, ry)) {
    for (const [dx, dy] of DIRS) { const q = portalDir(rx - dx, ry - dy); if (q && q[0] === dx && q[1] === dy) { R = [rx - dx, ry - dy]; d = q; break; } }
    if (!R) return 'hide';
  } else return null;
  const fx = R[0] + d[0] * 0.5, fy = R[1] + d[1] * 0.5, s = (m.px - fx) * d[0] + (m.py - fy) * d[1];
  const ed = m.du * d[0] + m.dv * d[1], la = m.len / 2;
  if (Math.abs(ed) < 0.5) return tunnelAt(rx, ry) ? 'hide' : null;   // quer zum Portal (Kurve davor): nicht schneiden
  const lo = ed > 0 ? -la : Math.max(-la, s), hi = ed > 0 ? Math.min(la, -s) : la;
  if (hi - lo < 0.02) return 'hide';
  return { k: R[0] + ',' + R[1], cut: [lo, hi], portal: { R, d, ramp: portalForm(R[0], R[1], d) === 'rampe' } };
}
// Tiefe eines Weltpunkts in der Rampe (für die Wagen)
function rampSink(P, wx, wy) {
  const [rx, ry] = P.R, a = (wx - rx) * P.d[0] + (wy - ry) * P.d[1];
  return a < -0.5 ? 0 : rampDepth(a);
}
// Wagen in der Rampe: nur durch die Öffnung und darüber sichtbar (die vordere Kante verdeckt, was tiefer liegt)
function rampClip(P, z) {
  const [rx, ry] = P.R, d = P.d, w = RAMP_W;
  const W2 = (a, b) => { const p = toScreen(rx + d[0] * a - d[1] * b, ry + d[1] * a + d[0] * b); return [p.x, p.y]; };
  const q = [W2(-0.5, -w), W2(0.5, -w), W2(0.5, w), W2(-0.5, w)];
  const left = q.reduce((p, c) => c[0] < p[0] ? c : p), right = q.reduce((p, c) => c[0] > p[0] ? c : p);
  const low = q.filter(c => c !== left && c !== right).reduce((p, c) => c[1] > p[1] ? c : p);
  g.beginPath(); g.moveTo(left[0], -1e4); g.lineTo(left[0], left[1]); g.lineTo(low[0], low[1]); g.lineTo(right[0], right[1]); g.lineTo(right[0], -1e4); g.closePath(); g.clip();
}

// U-Bahn-Eingang (1×1): Treppe mit Mast (frei), Pavillon mit Glasdach, Häuschen (Kunstakademie). Vorn = Drehrichtung.
function uSign(p, size, z) {
  const a = size * z;
  g.fillStyle = C('#2f62b8'); g.fillRect(p[0] - a / 2, p[1] - a / 2, a, a);
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.9 * z; g.strokeRect(p[0] - a / 2 + 0.8 * z, p[1] - a / 2 + 0.8 * z, a - 1.6 * z, a - 1.6 * z);
  g.fillStyle = '#ffffff'; g.font = `800 ${a * 0.72}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('U', p[0], p[1] + a * 0.04); g.textAlign = 'left';
}
function drawUbahn(cx, cy, z, t) {
  const r = (t && t.rot) || 0, du = [1, 0, -1, 0][r], dv = [0, 1, 0, -1][r];
  const L = (u, v) => [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z];
  const S = (a, b, up = 0) => { const p = L(du * a - dv * b, dv * a + du * b); return [p[0], p[1] - up * z]; };
  const form = lookForm('ubahn', t);
  poly([S(-0.48, -0.48), S(0.48, -0.48), S(0.48, 0.48), S(-0.48, 0.48)], C('#d9d2c4'));      // gepflasterter Sockel
  const stairs = (a0, a1, w) => {
    poly([S(a0, -w), S(a1, -w), S(a1, w), S(a0, w)], C('#3a332e'));
    for (let i = 1; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 7; portalLine([S(a, -w, -i), S(a, w, -i)], 'rgba(220,210,195,0.55)', 0.8, z); }
  };
  if (form === 'pavillon') {
    const GR = '#2f7a56', GL = '#3f9068';
    stairs(-0.34, 0.36, 0.22);
    for (const sg of [-1, 1]) pbBox(S, du, dv, -0.4, 0.36, sg > 0 ? 0.24 : -0.29, sg > 0 ? 0.29 : -0.24, 0, 5, GR, GL, z, false);
    pbBox(S, du, dv, -0.4, -0.34, -0.29, 0.29, 0, 5, GR, GL, z, false);
    for (const [a, b] of [[-0.38, -0.3], [-0.38, 0.3], [0.34, -0.3], [0.34, 0.3]]) pbBox(S, du, dv, a - 0.025, a + 0.025, b - 0.025, b + 0.025, 0, 18, GR, GL, z, false);
    g.globalAlpha *= 0.85; pbBox(S, du, dv, -0.44, 0.42, -0.36, 0.36, 18, 19.5, '#9fd3e3', '#c8ecf5', z, false); g.globalAlpha /= 0.85;
    const arc = []; for (let i = 0; i <= 12; i++) { const t2 = Math.PI - i * Math.PI / 12; arc.push(S(0.36, Math.cos(t2) * 0.3, 19.5 + Math.sin(t2) * 5)); }
    portalLine(arc, GR, 1.6, z);
    for (const b of [-0.3, 0.3]) { const p = S(0.36, b, 21); circle(p[0], p[1], 2 * z, C('#ffd56b')); }
    uSign(S(0.36, 0, 27), 9, z);
  } else if (form === 'haeuschen') {
    pbBox(S, du, dv, -0.36, 0.3, -0.32, 0.32, 0, 15, '#e9e1d2', '#d8cfbf', z, false);
    if (du + dv > 0) {                                                  // Glasfront nur, wenn sie zu sehen ist
      poly([S(0.3, -0.24, 0), S(0.3, 0.24, 0), S(0.3, 0.24, 12), S(0.3, -0.24, 12)], C('#9fc9dc'));
      poly([S(0.3, -0.1, 0), S(0.3, 0.1, 0), S(0.3, 0.1, 10), S(0.3, -0.1, 10)], C('#3a332e'));
    }
    pbBox(S, du, dv, -0.42, 0.36, -0.38, 0.38, 15, 17, '#2f62b8', '#3f74c8', z, false);
    portalLine([S(0, 0, 17), S(0, 0, 21)], '#5b6470', 1.4, z);
    uSign(S(0, 0, 26), 10, z);
  } else {                                                              // Treppe mit Mast
    stairs(-0.36, 0.38, 0.24);
    pbBox(S, du, dv, -0.44, -0.36, -0.32, 0.32, 0, 6, '#cfc6b4', '#e3dccd', z, false);
    for (const sg of [-1, 1]) pbBox(S, du, dv, -0.44, 0.38, sg > 0 ? 0.24 : -0.32, sg > 0 ? 0.32 : -0.24, 0, 6, '#cfc6b4', '#e3dccd', z, false);
    pbBox(S, du, dv, -0.42, -0.36, -0.44, -0.36, 0, 30, '#5b6470', '#6c7682', z, false);
    uSign(S(-0.39, -0.4, 34), 11, z);
  }
}
// Vorschaubild/Geist des Tunnels: kleines Portal mit Hügel (Bauleiste) bzw. gestrichelte Strecke (Geist auf der Karte)
function drawTunnelIcon(cx, cy, z, t) {
  const f = DECO_LOOKS.tunnel.forms[(t && t.form) || 0].id, d = [-1, 0], S = portalFrame(cx + 10 * z, cy + 5 * z, z, d);
  if (f === 'rampe') { drawRamp(S, z, 1e6, 1e6, d, true); return; }
  drawPortal(cx + 10 * z, cy + 5 * z, z, 1e6, 1e6, d, f === 'auto' ? 'backstein' : f);
}
function drawTunnelGhost(cx, cy, z) {
  g.save(); g.setLineDash([5 * z, 4 * z]); g.strokeStyle = '#6a52c4'; g.lineWidth = 2.4 * z;
  diamondPath(cx, cy, TW / 2 * z * 0.7, TH / 2 * z * 0.7); g.stroke(); g.restore();
}
function diamondPath(cx, cy, a, b) { g.beginPath(); g.moveTo(cx, cy - b); g.lineTo(cx + a, cy); g.lineTo(cx, cy + b); g.lineTo(cx - a, cy); g.closePath(); }

// Bauansicht (Nutzer: „passt so“): mit Schiene, Tunnel, U-Bahn-Station oder Abriss in der Hand wird die Welt blass, die Tunnel
// erscheinen lila gestrichelt, U-Bahn-Stationen als U
const TUNNEL_VIEW = new Set(['schiene', 'tunnel', 'ubahn', 'abriss']);
function drawTunnelView(z) {
  if (!state.tunnels || !TUNNEL_VIEW.has(tool) || (tool !== 'tunnel' && tool !== 'ubahn' && !state.tunnels.size)) return;
  g.save(); g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.fillStyle = 'rgba(245,240,255,0.42)'; g.fillRect(0, 0, W, H);
  const segs = [];
  for (const k of state.tunnels.keys()) {
    const [x, y] = keyXY(k), p = toScreen(x, y);
    if (p.x < -80 || p.x > W + 80 || p.y < -80 || p.y > H + 80) continue;
    let n = 0;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, ny = y + dy, mine = tunnelAt(nx, ny), rail = bAt(nx, ny) === 'schiene';
      if (!mine && !rail) continue;
      n++;
      if (mine && (dx < 0 || dy < 0)) continue;                        // jede Verbindung einmal
      const q = toScreen(rail ? x + dx * 0.5 : nx, rail ? y + dy * 0.5 : ny);
      segs.push([p, q]);
    }
    if (!n) segs.push([{ x: p.x - 4 * z, y: p.y }, { x: p.x + 4 * z, y: p.y }]);
  }
  g.lineCap = 'round'; g.setLineDash([6 * z, 5 * z]);
  for (const [col, w] of [['rgba(60,40,110,0.25)', 7], ['#6a52c4', 2.4]]) {
    g.strokeStyle = col; g.lineWidth = w * z; g.beginPath();
    for (const [p, q] of segs) { g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); }
    g.stroke();
  }
  g.setLineDash([]);
  for (const [k, t] of state.tiles) if (t.b === 'ubahn') { const p = toScreen(...keyXY(k)); if (p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40) uSign([p.x, p.y - 4 * z], 9, z); }
  g.restore();
}
