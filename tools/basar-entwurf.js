// Entwurf Sternenbasar (Block 161c, Nutzer 16.10.2026: „ein Haus zum Hinstellen, am besten mit Sternen, richtig cozy“): drei Varianten,
// je 2×2 Felder, Tag und Nacht, nah und mittel. Im Browser (beliebige Welt, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/basar-entwurf.js')).text()); await basarEntwurf()   → tools/vorschau/basar-entwurf.png
(function basarEntwurfTool() {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', NIGHT_BLUE = '#2f3b7a', CREAM = '#f7efe0';
  const sternPts = (x, y, r, rot = -Math.PI / 2) => Array.from({ length: 10 }, (_, i) => { const a = rot + i * Math.PI / 5, rr = i & 1 ? r * 0.45 : r; return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; });
  const stern = (p, r, col, edge = null) => { poly(sternPts(p[0], p[1], r), C(col)); if (edge) { g.strokeStyle = C(edge); g.lineWidth = Math.max(0.5, r * 0.12); g.beginPath(); sternPts(p[0], p[1], r).forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke(); } };
  const lit = () => !!window.__basarNacht;
  const glows = [];                                                         // Entwurf: Leuchten selbst malen (im Spiel macht das drawNight)
  const glowAt = (p, r, col = '255,200,110') => { if (lit()) glows.push([p[0], p[1], r, col]); };
  const warm = (pts, z) => { if (lit()) { const m = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]); glowAt(m, 22 * z); } };
  const glowQuad = (pts, r) => warm(pts, r / 18);
  const drawGlows = () => { for (const [x, y, r, col] of glows.splice(0)) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.32)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } };

  // A: Sternenzelt – rundes Zelt (12 Seiten) mit Streifen Nachtblau/Creme, Spitzdach mit goldenen Sternen, Wimpel mit Stern, Tresen mit Gläsern
  function zelt(K) {
    const z = K.z, N = 12, R = 0.82, H = 16, RH = 26, ring = (r, up) => Array.from({ length: N }, (_, i) => { const t = i / N * Math.PI * 2; return { a: Math.cos(t) * r, b: Math.sin(t) * r, up, t }; });
    const lo = ring(R, 0), hi = ring(R, H), eave = ring(R * 1.1, H - 1), apex = K.P(0, 0, H + RH);
    K.oval(0, 0, 1.0, 'rgba(60,40,30,0.18)');
    const faces = lo.map((p, i) => { const q = lo[(i + 1) % N], m = [(p.a + q.a) / 2, (p.b + q.b) / 2]; return { i, p, q, d: K.depth(m[0], m[1]), front: K.facing(m[0], m[1]) > 0 }; });
    for (const f of faces.filter(f => f.front).sort((x, y) => x.d - y.d)) {
      const col = f.i & 1 ? CREAM : NIGHT_BLUE, P0 = K.P(f.p.a, f.p.b, 0), Q0 = K.P(f.q.a, f.q.b, 0), shadeK = K.facing(f.p.a + f.q.a, 0) > 0.5 ? -0.12 : 0;
      poly([P0, Q0, [Q0[0], Q0[1] - H * z], [P0[0], P0[1] - H * z]], C(shade(col, shadeK)));
    }
    // Eingang mit Tresen vorn (a > 0)
    const T0 = K.P(R * 0.98, -0.3, 0), T1 = K.P(R * 0.98, 0.3, 0);
    poly([T0, T1, [T1[0], T1[1] - 11 * z], [T0[0], T0[1] - 11 * z]], lit() ? '#ffd27a' : C('#ffe9b8'));
    warm([T0, T1, [T1[0], T1[1] - 11 * z], [T0[0], T0[1] - 11 * z]], z);
    poly([T0, T1, [T1[0], T1[1] - 4 * z], [T0[0], T0[1] - 4 * z]], C('#8a5a3c'));
    for (let i = 0; i < 4; i++) { const m = lerp(T0, T1, (i + 0.5) / 4); circle(m[0], m[1] - 5.5 * z, 1.1 * z, C(['#b48cff', '#7fd3ff', '#ffd23f', '#ff8fb1'][i])); }   // Gläser mit Sternstaub
    // Dach: Dreiecke zur Spitze, hinten zuerst
    const tri = eave.map((p, i) => { const q = eave[(i + 1) % N], m = [(p.a + q.a) / 2, (p.b + q.b) / 2]; return { i, P: K.P(p.a, p.b, p.up), Q: K.P(q.a, q.b, q.up), d: K.depth(m[0], m[1]), m }; }).sort((x, y) => x.d - y.d);
    for (const f of tri) poly([f.P, f.Q, apex], C(shade(f.i & 1 ? CREAM : NIGHT_BLUE, K.facing(f.m[0], f.m[1]) > 0 ? -0.06 : 0.08)));
    for (const f of tri) if (K.facing(f.m[0], f.m[1]) > 0 && (f.i & 1) === 0) stern(lerp(lerp(f.P, f.Q, 0.5), apex, 0.4), 1.6 * z, GOLD, GOLD_D);
    // Zackenkante (Wimpelkranz) an der Traufe
    for (const f of tri) if (K.facing(f.m[0], f.m[1]) > 0) { const m = lerp(f.P, f.Q, 0.5); poly([f.P, f.Q, [m[0], m[1] + 3 * z]], C(f.i & 1 ? GOLD : '#e86f8f')); }
    // Mast und Wimpel mit Stern
    g.strokeStyle = C('#6b4f3a'); g.lineWidth = Math.max(0.6, 0.8 * z); g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(apex[0], apex[1] - 9 * z); g.stroke();
    poly([[apex[0], apex[1] - 9 * z], [apex[0] + 7 * z, apex[1] - 7.5 * z], [apex[0], apex[1] - 6 * z]], C('#e86f8f'));
    stern([apex[0], apex[1] - 11 * z], 2.2 * z, GOLD, GOLD_D);
    glowAt([apex[0], apex[1] - 11 * z], 24 * z);
    for (const f of tri) if (K.facing(f.m[0], f.m[1]) > 0) glowAt(lerp(f.P, f.Q, 0.5), 7 * z);   // Lichterkette am Kranz
  }

  // B: Sternhäuschen – cremefarbenes Häuschen, nachtblaues Walmdach mit Sternen, goldener Stern auf dem First, Mondfenster,
  // Sternen-Lichterkette an der Traufe, Holztür mit Stern, Laterne
  function haus(K) {
    const z = K.z;
    K.oval(0, 0, 1.0, 'rgba(60,40,30,0.18)');
    const ch = K.P(-0.25, 0.35, 0);                                                                    // Schornstein (hinter dem Dach)
    const B = K.block({ a: 0, b: 0, ha: 0.6, hb: 0.58, h: 22, wall: CREAM, roof: NIGHT_BLUE, roofH: 20, type: 'hip', over: 1.18, trim: GOLD });
    poly([[ch[0] - 2 * z, ch[1] - 34 * z], [ch[0] + 2 * z, ch[1] - 34 * z], [ch[0] + 2 * z, ch[1] - 44 * z], [ch[0] - 2 * z, ch[1] - 44 * z]], C('#b4634a'));
    for (const F of [B.faces.front, B.faces.right]) if (F) for (const t of [0, 0.5, 1]) faceQuad(F.P, F.Q, Math.max(0, t - 0.02), Math.min(1, t + 0.02), 0, F.H, C('#a8794e'));   // Fachwerk
    for (const F of [B.faces.front, B.faces.right]) if (F) faceQuad(F.P, F.Q, 0, 1, F.H * 0.48, F.H * 0.52, C('#a8794e'));
    for (const side of ['front', 'right', 'left']) {
      const F = B.faces[side];
      if (!F) continue;
      if (side === 'front') {
        faceQuad(F.P, F.Q, 0.38, 0.62, 0, F.H * 0.62, C('#8a5a3c'));                                  // Tür
        stern(lerp(lerp(F.P, F.Q, 0.5), lerp(F.P, F.Q, 0.5), 0).map((v, i) => i ? v - F.H * 0.42 : v), 1.6 * z, GOLD, GOLD_D);
        for (const [t0, t1] of [[0.1, 0.3], [0.7, 0.9]]) { windowOn(F.P, F.Q, t0, t1, F.H * 0.58, F.H * 0.86, z); const W0 = lerp(F.P, F.Q, t0), W1 = lerp(F.P, F.Q, t1); warm([[W0[0], W0[1] - F.H * 0.6], [W1[0], W1[1] - F.H * 0.85]], z);
          faceQuad(F.P, F.Q, t0 - 0.02, t1 + 0.02, F.H * 0.52, F.H * 0.58, C('#8a5a3c')); for (let i = 0; i < 3; i++) { const m = lerp(W0, W1, (i + 0.5) / 3); circle(m[0], m[1] - F.H * 0.6, 1.1 * z, C(['#ff8fb1', '#ffd23f', '#b48cff'][i])); } }
      } else {
        const m = lerp(F.P, F.Q, 0.5), r = F.H * 0.22;                                                  // Mondfenster: runde Scheibe mit Sichel
        ellipse(m[0], m[1] - F.H * 0.52, r * 0.8, r, lit() ? '#ffd27a' : C('#cfe6ff'));
        ellipse(m[0] + r * 0.32, m[1] - F.H * 0.56, r * 0.6, r * 0.8, C(shade(CREAM, side === 'right' ? -0.12 : 0)));
        if (lit()) glowQuad([[m[0] - r, m[1] - F.H * 0.72], [m[0] + r, m[1] - F.H * 0.72], [m[0] + r, m[1] - F.H * 0.32], [m[0] - r, m[1] - F.H * 0.32]], 16 * z);
      }
    }
    // Sterne auf dem Dach und goldener Stern auf der Spitze
    const top = K.P(0, 0, 22 + 20);
    for (const [a, b, up] of [[0.4, -0.22, 30], [0.38, 0.28, 28], [0.08, 0.5, 29], [0.5, 0.04, 26]]) stern(K.P(a, b, up), 1.3 * z, GOLD, GOLD_D);
    stern([top[0], top[1] - 4 * z], 3 * z, GOLD, GOLD_D);
    glowAt([top[0], top[1] - 4 * z], 26 * z);
    // Lichterkette an der Traufe (vorn und rechts): kleine Sterne
    for (const side of ['front', 'right']) {
      const F = B.faces[side];
      if (!F) continue;
      for (let i = 0; i <= 6; i++) { const m = lerp(F.P, F.Q, i / 6), sag = Math.sin(i / 6 * Math.PI) * 1.5 * z, p = [m[0], m[1] - F.H + sag + 1.2 * z]; stern(p, 0.9 * z, lit() ? '#fff1a8' : '#ffe27a'); if (i % 2 === 0) glowAt(p, 4 * z); }
    }
    // Laterne neben der Tür
    const L = K.P(0.9, 0.55, 0);
    g.strokeStyle = C('#3b3b3b'); g.lineWidth = Math.max(0.6, 0.9 * z); g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(L[0], L[1] - 12 * z); g.stroke();
    ellipse(L[0], L[1] - 13 * z, 1.5 * z, 2 * z, lit() ? '#ffd27a' : C('#fff4cf')); glowAt([L[0], L[1] - 13 * z], 20 * z);
  }

  // C: Kuppelladen – runder Turm mit Sternenkuppel (Mini-Sternwarte), daneben ein Ladentresen mit gestreifter Markise
  function kuppel(K) {
    const z = K.z;
    K.oval(0, 0, 1.05, 'rgba(60,40,30,0.18)');
    K.scene([
      [-0.3, -0.3, () => {                                                          // Turm hinten links
        const c = K.P(-0.3, -0.25, 0), rx = 0.55 * TW / 2 * z * 1.2, ry = rx * TH / TW, H = 22 * z;
        poly([[c[0] - rx, c[1]], [c[0] + rx, c[1]], [c[0] + rx, c[1] - H], [c[0] - rx, c[1] - H]], C(CREAM));
        ellipse(c[0], c[1], rx, ry, C(shade(CREAM, -0.08)));
        poly([[c[0], c[1]], [c[0] + rx, c[1]], [c[0] + rx, c[1] - H], [c[0], c[1] - H]], C(shade(CREAM, -0.1)));
        const d = [c[0], c[1] - H];                                                  // Kuppel: Halbellipse
        g.beginPath(); g.ellipse(d[0], d[1], rx * 1.05, rx * 1.0, 0, Math.PI, 0); g.closePath(); g.fillStyle = C(NIGHT_BLUE); g.fill();
        ellipse(d[0], d[1], rx * 1.05, ry * 1.05, C(shade(NIGHT_BLUE, -0.1)));
        for (const [dx, dy, r] of [[-0.45, -0.45, 1.3], [0.1, -0.75, 1.6], [0.5, -0.35, 1.1], [-0.1, -0.25, 0.9]]) stern([d[0] + dx * rx, d[1] + dy * rx], r * z, GOLD, GOLD_D);
        poly([[d[0] + rx * 0.15, d[1] - rx * 0.98], [d[0] + rx * 0.35, d[1] - rx * 0.92], [d[0] + rx * 0.35, d[1] - rx * 0.1], [d[0] + rx * 0.15, d[1] - rx * 0.1]], C(lit() ? '#ffd27a' : '#93b6ff'));   // Spalt
        const win = [[c[0] + rx * 0.2, c[1] - H * 0.75], [c[0] + rx * 0.55, c[1] - H * 0.75], [c[0] + rx * 0.55, c[1] - H * 0.5], [c[0] + rx * 0.2, c[1] - H * 0.5]];
        poly(win, lit() ? '#ffd27a' : C('#cfe6ff')); warm(win, z);
      }],
      [0.35, 0.25, () => {                                                          // Laden vorn rechts
        const B = K.block({ a: 0.4, b: 0.3, ha: 0.42, hb: 0.5, h: 13, wall: '#cdb8f0', roof: '#7a6bc4', roofH: 6, type: 'gable', ridge: 'b', trim: GOLD });
        const F = B.faces.front;
        if (F) {
          const p = [F.P, F.Q];
          faceQuad(F.P, F.Q, 0.12, 0.88, F.H * 0.25, F.H * 0.7, lit() ? '#ffd27a' : C('#fff4dc'));
          warm([lerp(F.P, F.Q, 0.12), lerp(F.P, F.Q, 0.88), [lerp(F.P, F.Q, 0.88)[0], lerp(F.P, F.Q, 0.88)[1] - F.H * 0.7], [lerp(F.P, F.Q, 0.12)[0], lerp(F.P, F.Q, 0.12)[1] - F.H * 0.7]], z);
          faceQuad(F.P, F.Q, 0.08, 0.92, F.H * 0.12, F.H * 0.26, C('#8a5a3c'));
          for (let i = 0; i < 5; i++) { const m = lerp(F.P, F.Q, 0.18 + i * 0.16); circle(m[0], m[1] - F.H * 0.33, 1 * z, C(['#b48cff', '#7fd3ff', '#ffd23f', '#ff8fb1', '#9be7a0'][i])); }
          for (let i = 0; i < 6; i++) { const a = lerp(F.P, F.Q, i / 6), b = lerp(F.P, F.Q, (i + 1) / 6), h1 = F.H * 0.92, h0 = F.H * 0.72, o = 3 * z;   // Markise
            poly([[a[0], a[1] - h1], [b[0], b[1] - h1], [b[0] + o, b[1] - h0 + o * 0.5], [a[0] + o, a[1] - h0 + o * 0.5]], C(i & 1 ? CREAM : '#7a6bc4')); }
          void p;
        }
      }],
    ]);
  }

  const VARIANTS = [['A · Sternenzelt', zelt], ['B · Sternhäuschen', haus], ['C · Kuppelladen', kuppel]];
  window.basarEntwurf = async (name = 'basar-entwurf') => {
    const W = 420, H = 360, shots = [];
    for (const [label, fn] of VARIANTS) for (const [nacht, zoom] of [[false, 3.2], [true, 3.2], [false, 1.6]]) {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const cx = c.getContext('2d');
      cx.fillStyle = nacht ? '#2b3550' : '#9fd27a'; cx.fillRect(0, 0, W, H);
      const prev = g, n0 = night; g = cx; window.__basarNacht = nacht; night = nacht ? 1 : 0;
      try { const K = kit(W / 2, H * 0.72, zoom, 0); fn(K); g.globalCompositeOperation = 'lighter'; drawGlows(); g.globalCompositeOperation = 'source-over'; } finally { g = prev; window.__basarNacht = false; night = n0; }
      shots.push([c, `${label}${nacht ? ' · Nacht' : zoom < 2 ? ' · mittel' : ''}`]);
    }
    const cols = 3, rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 12); sheet.height = rows * (H + 40);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 12), Y = Math.floor(i / cols) * (H + 40) + 30; sx.drawImage(c, X, Y); sx.font = '700 17px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 8); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name + '.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
