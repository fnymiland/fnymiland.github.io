// Block 164 (Nutzer 21.10.2026: „klingen geil“): Entwürfe für besondere Stücke – Perlmutt-Dachfarbe, Gold-Fensterläden, Sternen-Wegmuster.
// Im Browser (Spiel geladen): (0, eval)(await (await fetch('tools/besondere-entwurf.js')).text()); besondereEntwurf()
// Zeichnet je Stück drei Varianten groß nebeneinander auf eine Leinwand über dem Spiel (id 'cmp').
(function besondereEntwurfTool() {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  // Haus in eine eigene Leinwand malen (Mitte cx, cy), Rückgabe: Leinwand
  const houseCanvas = (W, H, cx, cy, z, look, wall, roof, nightOn = false) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const prev = g, n0 = night; g = c.getContext('2d'); night = nightOn ? NIGHT_MAX : 0;
    try { HOUSE_ART[look - 1](kit(cx, cy, z, 0), wall, roof, 0, 3, 7); } finally { g = prev; night = n0; }
    return c;
  };
  // Dachfläche finden: zweimal mit verschiedenen Dachfarben malen, was sich unterscheidet, ist Dach
  function roofMask(W, H, cx, cy, z, look, wall) {
    const a = houseCanvas(W, H, cx, cy, z, look, wall, '#ff00ff'), b = houseCanvas(W, H, cx, cy, z, look, wall, '#00ff00');
    const da = a.getContext('2d').getImageData(0, 0, W, H), db = b.getContext('2d').getImageData(0, 0, W, H);
    const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d'), md = mx.createImageData(W, H);
    for (let i = 0; i < da.data.length; i += 4) {
      const diff = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
      if (diff > 60 && da.data[i + 3] > 0) { md.data[i] = 255; md.data[i + 1] = 255; md.data[i + 2] = 255; md.data[i + 3] = da.data[i + 3]; }
    }
    mx.putImageData(md, 0, 0);
    return m;
  }
  // Perlmutt: Grundfarbe hell, darüber ein Farbverlauf (rosa → flieder → mint → himmelblau) nur auf dem Dach, dazu Glanz
  function pearlHouse(W, H, cx, cy, z, look, wall, v) {
    const base = houseCanvas(W, H, cx, cy, z, look, wall, v.base), mask = roofMask(W, H, cx, cy, z, look, wall);
    const md = mask.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, x1 = 0, y0 = H, y1 = 0;   // Dach-Umriss
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (md[(yy * W + xx) * 4 + 3] > 0) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    const o = document.createElement('canvas'); o.width = W; o.height = H; const ox = o.getContext('2d');
    ox.drawImage(mask, 0, 0); ox.globalCompositeOperation = 'source-in';
    const gr = ox.createLinearGradient(x0, y0, x1, y1);                     // schräg über das ganze Dach
    v.stops.forEach(([p, col]) => gr.addColorStop(p, col));
    ox.fillStyle = gr; ox.fillRect(0, 0, W, H);
    if (v.stripes) { ox.globalCompositeOperation = 'source-atop'; ox.strokeStyle = 'rgba(255,255,255,0.85)'; for (const [f, w] of v.stripes) { ox.lineWidth = w * (x1 - x0) / 100; const xa = x0 + (x1 - x0) * f; ox.beginPath(); ox.moveTo(xa - (y1 - y0) * 0.6, y0); ox.lineTo(xa + (y1 - y0) * 0.6, y1); ox.stroke(); } }
    const out = base.getContext('2d'); out.globalAlpha = v.alpha; out.drawImage(o, 0, 0); out.globalAlpha = 1;
    return base;
  }
  // Fensterläden: houseWins vorübergehend mit Läden links und rechts neben jedem Fenster (in der Wandebene)
  function shutterHouse(W, H, cx, cy, z, look, wall, roof, v, nightOn = false) {
    const keep = houseWins;
    houseWins = (K, B, spots, h0 = 0.35, h1 = 0.72, box = false) => {
      keep(K, B, spots, h0, h1, box);
      for (const side of ['right', 'left', 'back']) {
        const F = B.faces[side];
        if (!F) continue;
        for (const [t0, t1] of spots) {
          const w = (t1 - t0) * 0.42, y0 = F.H * h0, y1 = F.H * h1;
          if (v.frame) {                                                   // nur goldener Rahmen ums Fenster
            const p = (t, hh) => { const q = lerp(F.P, F.Q, t); return [q[0], q[1] - hh]; };
            g.strokeStyle = C(v.frame); g.lineWidth = 1.1 * K.z; g.lineJoin = 'round';
            g.beginPath(); [p(t0, y0), p(t1, y0), p(t1, y1), p(t0, y1)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.stroke();
            continue;
          }
          for (const [a, b] of [[t0 - w - 0.01, t0 - 0.01], [t1 + 0.01, t1 + w + 0.01]]) {
            faceQuad(F.P, F.Q, a, b, y0 - 0.5, y1 + 0.5, C(v.fill));
            if (v.rim) { const p = (t, hh) => { const q = lerp(F.P, F.Q, t); return [q[0], q[1] - hh]; };
              g.strokeStyle = C(v.rim); g.lineWidth = 0.7 * K.z; g.beginPath(); [p(a, y0 - 0.5), p(b, y0 - 0.5), p(b, y1 + 0.5), p(a, y1 + 0.5)].forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); g.stroke(); }
            if (v.slats) { const p = (t, hh) => { const q = lerp(F.P, F.Q, t); return [q[0], q[1] - hh]; };   // Lamellen
              g.strokeStyle = C(v.slats); g.lineWidth = 0.45 * K.z; g.beginPath(); for (let k = 1; k < 5; k++) { const hh = y0 + (y1 - y0) * k / 5; g.moveTo(...p(a + 0.004, hh)); g.lineTo(...p(b - 0.004, hh)); } g.stroke(); }
          }
        }
      }
    };
    try { return houseCanvas(W, H, cx, cy, z, look, wall, roof, nightOn); } finally { houseWins = keep; }
  }
  // Sternen-Weg: 2×3 Felder Weg, darauf Sterne flach im Boden (Punkte über K.P)
  function starPath(W, H, cx, cy, z, v, nightOn = false) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const prev = g, n0 = night; g = c.getContext('2d'); night = nightOn ? NIGHT_MAX : 0;
    try {
      const K = kit(cx, cy, z, 0);
      K.rect(-1.5, -1, 1.5, 1, C('#9fd27a'));                             // Wiese drumherum
      K.rect(-1.5, -0.5, 1.5, 0.5, C(v.ground));                          // Weg, eine Bahn breit, drei Felder lang
      for (let a = -1.5; a < 1.5; a += v.tile || 0.5) for (let b = -0.5; b < 0.5; b += v.tile || 0.5) {   // Fugen
        if (!v.joint) continue;
        g.strokeStyle = C(v.joint); g.lineWidth = 0.5 * z; g.beginPath(); const q0 = K.P(a, b), q1 = K.P(a + (v.tile || 0.5), b), q2 = K.P(a + (v.tile || 0.5), b + (v.tile || 0.5));
        g.moveTo(...q0); g.lineTo(...q1); g.lineTo(...q2); g.stroke();
      }
      const star = (a, b, r, col, edge) => {
        const pts = []; for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; pts.push(K.P(a + Math.cos(an) * rr, b + Math.sin(an) * rr)); }
        poly(pts, C(col)); if (edge) { g.strokeStyle = C(edge); g.lineWidth = 0.5 * z; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.stroke(); }
        if (nightOn && v.glow) glowQuad([K.P(a - 0.02, b - 0.02), K.P(a + 0.02, b - 0.02), K.P(a + 0.02, b + 0.02), K.P(a - 0.02, b + 0.02)], 10 * z);
      };
      if (v.stars) v.stars(star);
      if (v.glitter) {                                                     // feiner Glitzer: winzige Punkte flach im Boden, ein paar Funkel-Kreuze
        let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const G = v.glitter;
        for (let i = 0; i < G.n; i++) {
          const a = -1.48 + rnd() * 2.96, b = -0.48 + rnd() * 0.96, p = K.P(a, b), r = Math.max(0.7, (0.35 + rnd() * 0.45) * z);   // klein wenigstens ein Pixel
          g.globalAlpha = 0.55 + rnd() * 0.45; circle(p[0], p[1], r * 0.62, G.cols[i % G.cols.length]); g.globalAlpha = 1;
        }
        for (let i = 0; i < G.glints; i++) {                               // gleichmäßig über die Länge verteilt (je Abschnitt einer), klein
          const a = -1.5 + (i + 0.2 + rnd() * 0.6) * 3 / G.glints, b = -0.38 + rnd() * 0.76, p = K.P(a, b), L = Math.max(1.4, (0.9 + rnd() * 0.6) * z);
          const w = L * 0.16, [x, y] = p;                                    // Funkelstern: vier spitze Strahlen
          poly([[x - L, y], [x - w, y - w], [x, y - L * 1.15], [x + w, y - w], [x + L, y], [x + w, y + w], [x, y + L * 1.15], [x - w, y + w]], G.glintCol);
          if (nightOn) glowQuad([[p[0] - 0.4, p[1] + 0.4], [p[0] + 0.4, p[1] + 0.4], [p[0] + 0.4, p[1] - 0.4], [p[0] - 0.4, p[1] - 0.4]], 6 * z);
        }
      }
    } finally { g = prev; night = n0; }
    return c;
  }
  const PEARL = [
    ['A · Perlmutt sanft', { base: '#f3eef5', alpha: 0.55, stops: [[0, '#f7c6dc'], [0.35, '#d9c8f2'], [0.65, '#c4ecdf'], [1, '#c7e2f7']] }],
    ['B · Perlmutt kräftig', { base: '#ece6f1', alpha: 0.75, stops: [[0, '#f4a9c9'], [0.35, '#c8b2ef'], [0.65, '#a9e3cf'], [1, '#a8d4f5']] }],
    ['C · kräftig, Schattenseite bleibt', { base: '#ece6f1', alpha: 0.55, stops: [[0, '#f4a9c9'], [0.35, '#c8b2ef'], [0.65, '#a9e3cf'], [1, '#a8d4f5']] }],
    ['D · Perlmutt mit Glanzstreifen', { base: '#f3eef5', alpha: 0.5, stops: [[0, '#f7c6dc'], [0.35, '#d9c8f2'], [0.65, '#c4ecdf'], [1, '#c7e2f7']], stripes: [[0.3, 2.2], [0.38, 0.9], [0.62, 1.6]] }],
  ];
  const SHUT = [
    ['A · Läden ganz in Gold', { fill: GOLD, slats: GOLD_D }],
    ['B · weiße Läden, Goldrand', { fill: '#fbf7ef', rim: GOLD_D, slats: '#e2dccd' }],
    ['C · nur goldener Fensterrahmen', { frame: GOLD_D }],
  ];
  const STARS = [
    ['A · Hellgrau mit Silberglitzer', { ground: '#d6d3cb', glitter: { n: 420, cols: ['#ffffff', '#9aa6bd', '#f4f6fa', '#7d89a3'], glints: 3, glintCol: 'rgba(255,255,255,0.95)' } }],
    ['B · Sand mit Goldglitzer', { ground: '#eadbb2', glitter: { n: 420, cols: ['#d9a93a', '#fff2b0', '#c48f22', '#ffe08a'], glints: 3, glintCol: 'rgba(255,250,220,0.95)' } }],
    ['C · Rosé mit Perlglitzer', { ground: '#ecccc2', glitter: { n: 420, cols: ['#ffffff', '#e79bbd', '#b9a3e6', '#8fd3b9'], glints: 3, glintCol: 'rgba(255,255,255,0.95)' } }],
    ['D · gedämpftes Blaugrau mit Sternenstaub', { ground: '#8592b2', glitter: { n: 380, cols: ['#ffffff', '#ffe9a0', '#e3e8f7'], glints: 3, glintCol: 'rgba(255,248,220,0.95)' } }],
  ];
  // ✨ Funkeln (Nutzer 22.10.2026: „1, zeig mal“): feine Pünktchen still, dazu blitzen einzelne Funkel kurz auf und vergehen wieder –
  // jeder Funkel mit eigenem Takt (2,5–5 s), hell nur einen Augenblick (sin⁸). Läuft als Schleife über dem Spiel, stop() beendet
  const FUNKEL = [
    ['Silberglitzer auf Hellgrau', { ground: '#d6d3cb', glitter: { n: 170, cols: ['#ffffff', '#aeb8cc', '#f4f6fa'], glints: 0 } }, 'rgba(255,255,255,', '210,225,255'],
    ['Goldglitzer auf Sand', { ground: '#eadbb2', glitter: { n: 170, cols: ['#e2b64a', '#fff2b0', '#d9a93a'], glints: 0 } }, 'rgba(255,248,210,', '255,220,120'],
    ['Perlglitzer auf Rosé', { ground: '#ecccc2', glitter: { n: 170, cols: ['#ffffff', '#e79bbd', '#b9a3e6', '#8fd3b9'], glints: 0 } }, 'rgba(255,255,255,', '255,210,240'],
  ];
  let funkelRaf = 0;
  window.besondereFunkeln = (opts = {}) => {
    cancelAnimationFrame(funkelRaf);
    document.getElementById('cmp')?.remove();
    const Wv = innerWidth, Hv = innerHeight, cv = document.createElement('canvas'); cv.id = 'cmp'; cv.width = Wv * 2; cv.height = Hv * 2;
    Object.assign(cv.style, { position: 'fixed', inset: 0, width: Wv + 'px', height: Hv + 'px', zIndex: 99999, background: '#fffaf0' });
    document.body.appendChild(cv);
    const tall = Wv < 600, cols = FUNKEL.length;                          // schmales Fenster: untereinander
    const cw = tall ? Wv - 24 : (Wv - 12 * (cols + 1)) / cols, chh = tall ? (Hv - 34 * cols - 10) / cols : Hv - 50;
    const ctx = cv.getContext('2d'), z = opts.z || Math.min(2.6, (cw - 16) / 128, (chh - 10) / 64), n = opts.n || 12;
    // je Weg: stilles Bild einmal malen, Funkel-Plätze und Takte festlegen
    const items = FUNKEL.map(([label, v, rgba, glow], i) => {
      const x = tall ? 12 : 12 + i * (cw + 12), y = tall ? 30 + i * (chh + 34) : 34, cx = cw * 0.5, cy = chh * 0.52;
      const still = starPath(cw * 2, chh * 2, cx * 2, cy * 2, z * 2, v, false);
      const K = kit(x + cx, y + cy, z, 0); let seed = 11 + i * 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const sp = Array.from({ length: n }, (_, k) => ({ p: K.P(-1.5 + (k + 0.15 + rnd() * 0.7) * 3 / n, -0.4 + rnd() * 0.8), T: 2500 + rnd() * 2500, off: rnd(), L: (2.0 + rnd() * 1.2) * z }));
      return { label, x, y, still, sp, rgba, glow };
    });
    const t0 = performance.now();
    const frame = now => {
      const t = now - t0;
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, Wv, Hv);
      for (const it of items) {
        ctx.fillStyle = '#cfe8b8'; ctx.fillRect(it.x, it.y, cw, chh); ctx.drawImage(it.still, it.x, it.y, cw, chh);
        ctx.fillStyle = '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(it.label, it.x + 4, it.y - 10);
        for (const s of it.sp) {
          const ph = ((t / s.T + s.off) % 1), a = Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 8);
          if (a < 0.02) continue;
          const [px, py] = s.p, L = s.L * (0.55 + 0.45 * a), w = L * 0.16;
          const gr = ctx.createRadialGradient(px, py, 0, px, py, L * 1.4); gr.addColorStop(0, `rgba(${it.glow},${0.45 * a})`); gr.addColorStop(1, `rgba(${it.glow},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, L * 1.4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = it.rgba + a + ')'; ctx.beginPath();
          [[px - L, py], [px - w, py - w], [px, py - L * 1.15], [px + w, py - w], [px + L, py], [px + w, py + w], [px, py + L * 1.15], [px - w, py + w]].forEach((q, j) => j ? ctx.lineTo(...q) : ctx.moveTo(...q));
          ctx.closePath(); ctx.fill();
        }
      }
      funkelRaf = requestAnimationFrame(frame);
    };
    funkelRaf = requestAnimationFrame(frame);
    window.besondereFunkeln.stop = () => { cancelAnimationFrame(funkelRaf); document.getElementById('cmp')?.remove(); };
    return 'läuft';
  };
  window.besondereEntwurf = (opts = {}) => {
    document.getElementById('cmp')?.remove();
    const Wv = innerWidth, Hv = innerHeight, cv = document.createElement('canvas'); cv.id = 'cmp'; cv.width = Wv * 2; cv.height = Hv * 2;
    Object.assign(cv.style, { position: 'fixed', inset: 0, width: Wv + 'px', height: Hv + 'px', zIndex: 99999, background: '#fffaf0' });
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    const z = opts.z || 3, cw = 120 * z, ch = 110 * z, which = opts.which || 'alle', nightOn = !!opts.night;
    const rows = [];
    const hz = z * 2 * 2.6, look = opts.look || 1, wall = opts.wall || WALLS[1];   // Haus groß: ~2,6 × so groß wie Weg-Zoom
    if (which === 'alle' || which === 'perlmutt') rows.push(PEARL.map(([l, v]) => [l, () => pearlHouse(cw * 2, ch * 2, cw, ch * 1.62, hz, look, wall, v)]));
    if (which === 'alle' || which === 'laeden') rows.push(SHUT.map(([l, v]) => [l, () => shutterHouse(cw * 2, ch * 2, cw, ch * 1.62, hz, look, wall, '#c9604f', v, nightOn)]));
    if (which === 'alle' || which === 'sterne') rows.push(STARS.map(([l, v]) => [l, () => starPath(cw * 2, ch * 2, cw, ch * 1.0, z * 2 * 0.85, v, nightOn)]));
    if (which === 'alle' || which === 'sterne') rows.push(STARS.map(([l, v]) => [l.slice(0, 1) + ' · im Spiel (Zoom 1)', () => starPath(cw * 2, ch * 2, cw, ch * 1.0, 2, v, nightOn)]));
    if (which === 'wege') {                                                // 2×2, groß; unten rechts das Feld im Spielmaßstab (Zoom 1)
      const W2 = (Wv - 36) / 2, H2 = (Hv - 70) / 2;
      STARS.forEach(([label, v], i) => {
        const x = 12 + (i % 2) * (W2 + 12), y = 26 + Math.floor(i / 2) * (H2 + 34);
        ctx.fillStyle = nightOn ? '#1f2846' : '#cfe8b8'; ctx.fillRect(x, y, W2, H2);
        ctx.drawImage(starPath(W2 * 2, H2 * 2, W2 * 0.92, H2 * 0.95, z * 2, v, nightOn), x, y, W2, H2);
        const iw = 200, ih = 110; ctx.fillStyle = nightOn ? '#1f2846' : '#cfe8b8'; ctx.fillRect(x + W2 - iw - 6, y + H2 - ih - 6, iw, ih);
        ctx.strokeStyle = '#8a7560'; ctx.strokeRect(x + W2 - iw - 6, y + H2 - ih - 6, iw, ih);
        ctx.drawImage(starPath(iw * 2, ih * 2, iw, ih, 2, v, nightOn), x + W2 - iw - 6, y + H2 - ih - 6, iw, ih);
        ctx.fillStyle = '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(label, x + 4, y - 8);
        ctx.font = '600 11px system-ui'; ctx.fillText('im Spiel (Zoom 1)', x + W2 - iw - 2, y + H2 - ih - 10);
      });
      return 'ok';
    }
    rows.forEach((row, r) => row.forEach(([label, make], i) => {
      const x = 12 + i * (cw + 14), y = 26 + r * (ch + 34);   // bis zu vier Varianten je Reihe
      ctx.fillStyle = nightOn ? '#1f2846' : '#cfe8b8'; ctx.fillRect(x, y, cw, ch);
      ctx.drawImage(make(), x, y, cw, ch);
      ctx.fillStyle = '#6b4f3a'; ctx.font = '700 15px system-ui'; ctx.fillText(label, x + 4, y - 8);
    }));
    return 'ok';
  };
  return 'ok';
})();
