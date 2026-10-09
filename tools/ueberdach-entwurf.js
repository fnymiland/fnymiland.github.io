// Entwurf Block 138 Überdachungen, Version 3: Fläche statt Linie (Nutzer: Ecken sauber, nichts überlagert, auch 2–3 breit).
// Im Browser (?probe): fetch('tools/ueberdach-entwurf.js').then(r => r.text()).then(t => (0, eval)(t))
//
// Jedes überdachte Feld in 3 × 3 Teilstücke: Grenzen bei x − ½, x − W2, x + W2, x + ½. Mitte immer überdacht, Rand in Richtung d,
// wenn der Nachbar dort überdacht ist, Ecke nur, wenn beide Nachbarn UND der schräge überdacht sind. Teilstücke überlappen nie.
// Dachhöhe aus dem Abstand zum nächsten nicht überdachten Teilstück (Abstandsfeld): am Rand H, nach innen bis H + A gewölbt –
// so laufen Gewölbe, Streifen und Latten von selbst sauber um Ecken, und breite Flächen werden oben flach.
// Rand = Grenzen zwischen überdacht/frei, zu geraden Läufen zusammengefasst; Stützen an den Lauf-Enden und auf jeder Feldmitte.
(function ueberdachEntwurf() {
  const W2 = 0.36, H = 22, STRIPE = 0.09;
  const STY = {
    glas:    { post: '#56606b', rib: 'rgba(70,82,95,0.9)', vault: 6 },
    pergola: { post: '#8a5a3a', beam: '#6f4529', leaf: ['#4f9a3c', '#6fbf4f', '#3f8a35'], flower: ['#f28cb1', '#ffffff', '#c3a8e6', '#ffd23f'], vault: 0 },
    markise: { post: '#efe9dc', cols: ['#e8604f', '#fffaf0'], vault: 4 },
    arkaden: { stone: '#dccfb4', side: '#c8b896', dark: '#b3a283', top: '#e8dec9', vault: 0 },
  };
  const P = (u, v, up = 0) => { const p = toScreen(u, v); return [p.x, p.y - up * cam.z]; };
  const poly = (pts, fill, stroke, lw = 1) => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * cam.z; g.lineJoin = 'round'; g.stroke(); } };
  const line = (pts, col, lw) => { g.strokeStyle = col; g.lineWidth = lw * cam.z; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(...q) : g.moveTo(...q)); g.stroke(); };
  // Teilstück-Gitter: Index s (je Achse) = 3·x + i, i ∈ {−1, 0, 1}
  const lo = s => { const x = Math.round(s / 3), i = s - 3 * x; return i === -1 ? x - 0.5 : i === 0 ? x - W2 : x + W2; };
  const hi = s => { const x = Math.round(s / 3), i = s - 3 * x; return i === -1 ? x - W2 : i === 0 ? x + W2 : x + 0.5; };
  function makeArea(cov) {
    const C = (x, y) => cov.has(x + ',' + y);
    const sub = (su, sv) => {
      const x = Math.round(su / 3), y = Math.round(sv / 3), i = su - 3 * x, j = sv - 3 * y;
      if (!C(x, y)) return false;
      if (i && !C(x + i, y)) return false;
      if (j && !C(x, y + j)) return false;
      if (i && j && !C(x + i, y + j)) return false;
      return true;
    };
    const cache = new Map();
    // Abstand (Felder) von (u, v) zum nächsten freien Teilstück, gedeckelt bei cap (Dachform: W2; Markisenstreifen: weiter)
    // box: eckiger Abstand (max statt Pythagoras) – Linien gleichen Abstands laufen dann immer längs der Achsen (Markise)
    const dist = (u, v, cap = W2, box = false) => {
      const key = Math.round(u * 400) + ',' + Math.round(v * 400) + ',' + cap + (box ? 'b' : '');
      if (cache.has(key)) return cache.get(key);
      const x = Math.round(u), y = Math.round(v);
      let d = cap;
      for (let su = 3 * x - 7; su <= 3 * x + 7; su++) for (let sv = 3 * y - 7; sv <= 3 * y + 7; sv++) {
        if (sub(su, sv)) continue;
        const dx = Math.max(lo(su) - u, 0, u - hi(su)), dy = Math.max(lo(sv) - v, 0, v - hi(sv));
        d = Math.min(d, box ? Math.max(dx, dy) : Math.hypot(dx, dy));
      }
      cache.set(key, d);
      return d;
    };
    // Rand: Kanten überdacht → frei, je Linie und Außenrichtung zu Läufen zusammengefasst
    const edges = new Map();
    for (const k of cov) {
      const [x, y] = k.split(',').map(Number);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const su = 3 * x + i, sv = 3 * y + j;
        if (!sub(su, sv)) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (sub(su + dx, sv + dy)) continue;
          // Kante: liegt bei u = hi/lo (dx) bzw. v = hi/lo (dy), läuft entlang der anderen Achse über das Teilstück
          const key = dx ? `u|${dx}|${(dx > 0 ? hi(su) : lo(su)).toFixed(3)}` : `v|${dy}|${(dy > 0 ? hi(sv) : lo(sv)).toFixed(3)}`;
          if (!edges.has(key)) edges.set(key, []);
          edges.get(key).push(dx ? [lo(sv), hi(sv)] : [lo(su), hi(su)]);
        }
      }
    }
    const runs = [];
    for (const [key, segs] of edges) {
      const [ax, n, at] = key.split('|'); segs.sort((a, b) => a[0] - b[0]);
      let cur = null;
      for (const s of segs) { if (cur && Math.abs(cur[1] - s[0]) < 1e-6) cur[1] = s[1]; else { if (cur) runs.push({ ax, n: +n, at: +at, a: cur[0], b: cur[1] }); cur = s.slice(); } }
      if (cur) runs.push({ ax, n: +n, at: +at, a: cur[0], b: cur[1] });
    }
    // Stützen je Lauf: an beiden Enden und auf jeder Feldmitte dazwischen (Abstand ≥ 0,3 zu den Enden); doppelte Ecken einmal
    const postSet = new Map(), spots = new Map();
    for (const r of runs) {
      for (let t = Math.ceil(r.a * 2 - 1e-6) / 2; t <= r.b + 1e-6; t += 0.5) { const [u, v] = r.ax === 'u' ? [r.at, t] : [t, r.at]; spots.set(u.toFixed(3) + ',' + v.toFixed(3), [u, v]); }
      for (const t of [r.a, r.b]) { const [u, v] = r.ax === 'u' ? [r.at, t] : [t, r.at]; spots.set(u.toFixed(3) + ',' + v.toFixed(3), [u, v]); }
      const ts = [r.a, r.b];
      // Zwischenstützen nur am schmalen Gang: ist das Dach hinter dieser Stelle mehr als ein Feld tief (2–3 breit), trägt es
      // sich frei bis zur nächsten Ecke (Nutzer: „die extra Stützen weg, wenn man es breit macht“)
      const deep = t => { const inX = Math.round(r.at - r.n * 0.3); return r.ax === 'u' ? cov.has((inX - r.n) + ',' + t) : cov.has(t + ',' + (inX - r.n)); };
      for (let t = Math.ceil(r.a); t <= r.b; t++) if (t - r.a > 0.3 && r.b - t > 0.3 && !deep(t)) ts.push(t);
      r.posts = ts.sort((p, q) => p - q);
      for (const t of ts) { const [u, v] = r.ax === 'u' ? [r.at, t] : [t, r.at]; postSet.set(u.toFixed(3) + ',' + v.toFixed(3), [u, v]); }
    }
    const flip = (window.__canopy && window.__canopy.flip) || new Set();
    for (const [k, p] of spots) if (flip.has(k)) { if (postSet.has(k)) postSet.delete(k); else postSet.set(k, p); }
    return { sub, dist, runs, posts: [...postSet.values()], spots: [...spots.entries()], cov, postKeys: new Set(postSet.keys()) };
  }
  const prof = (d, A) => A * Math.sin(Math.PI / 2 * Math.min(1, d / W2));
  function drawMarks(area) {                                            // Bearbeiten: wo eine Stütze stehen kann
    const z = cam.z;
    for (const [k, [u, v]] of area.spots) {
      const p = P(u, v), on = area.postKeys.has(k);
      g.beginPath(); g.ellipse(p[0], p[1], 4.2 * z, 2.4 * z, 0, 0, 7);
      g.fillStyle = on ? '#3f8f43' : 'rgba(255,255,255,0.85)'; g.fill();
      g.lineWidth = 1.2 * z; g.strokeStyle = on ? '#ffffff' : '#3f8f43'; g.stroke();
    }
  }
  function drawArea(st, area) {
    const S = STY[st], z = cam.z, { sub, dist, runs } = area;
    const hAt = (u, v) => H + prof(dist(u, v), S.vault);
    // 1) Stützen (hinten zuerst)
    const posts = area.posts.slice().sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    if (st === 'arkaden') for (const [u, v] of posts) { const w = 0.06; poly([P(u - w, v + w), P(u + w, v + w), P(u + w, v + w, H), P(u - w, v + w, H)], S.side); poly([P(u + w, v - w), P(u + w, v + w), P(u + w, v + w, H), P(u + w, v - w, H)], S.stone); }
    else for (const [u, v] of posts) line([P(u, v), P(u, v, H)], S.post, st === 'pergola' ? 2 : 1.3);
    // 2) Dach: alle Teilstücke in kleine Vierecke, hinten zuerst
    const quads = [];
    for (const k of area.cov) {
      const [x, y] = k.split(',').map(Number);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const su = 3 * x + i, sv = 3 * y + j;
        if (!sub(su, sv)) continue;
        const u0 = lo(su), u1 = hi(su), v0 = lo(sv), v1 = hi(sv);
        // Schnitte: gleichmäßig (≤ 0,09) und – für die Markise – genau auf den Streifengrenzen (Rand ± k · Streifenbreite)
        const cuts = (a, b, ax) => {
          const c = new Set([a, b]), n = Math.max(1, Math.round((b - a) / 0.09));
          for (let i = 1; i < n; i++) c.add(a + (b - a) * i / n);
          if (st === 'markise') for (const r of runs) if (r.ax === ax) for (let k = 1; k <= 22; k++) for (const t of [r.at + k * STRIPE, r.at - k * STRIPE]) if (t > a + 1e-6 && t < b - 1e-6) c.add(t);
          return [...c].sort((p, q) => p - q);
        };
        const cu = cuts(u0, u1, 'u'), cv = cuts(v0, v1, 'v');
        for (let a = 0; a < cu.length - 1; a++) for (let b = 0; b < cv.length - 1; b++) quads.push([cu[a], cu[a + 1], cv[b], cv[b + 1]]);
      }
    }
    quads.sort((p, q) => (p[0] + p[2]) - (q[0] + q[2]));
    const corners = ([ua, ub, va, vb]) => [P(ua, va, hAt(ua, va)), P(ub, va, hAt(ub, va)), P(ub, vb, hAt(ub, vb)), P(ua, vb, hAt(ua, vb))];
    // Richtung quer zum Gang: dort, wo der Abstand am stärksten wächst; flach (Mitte breiter Flächen): beide
    const across = (u, v) => { const e = 0.02, gu = dist(u + e, v) - dist(u - e, v), gv = dist(u, v + e) - dist(u, v - e); return Math.abs(gu) < 1e-4 && Math.abs(gv) < 1e-4 ? 'both' : Math.abs(gv) > Math.abs(gu) ? 'v' : 'u'; };
    if (st === 'glas') {
      for (const q of quads) poly(corners(q), 'rgba(196,232,246,0.42)');
      ribLines(quads, 0.25, (u, v) => hAt(u, v), across, S.rib, 0.7);
    } else if (st === 'markise') {
      for (const q of quads) { const d = dist((q[0] + q[1]) / 2, (q[2] + q[3]) / 2, 2, true), c = S.cols[Math.floor(d / STRIPE) % 2]; poly(corners(q), c, c, 0.35); }   // Streifen rundum bis in die Mitte, eckig wie ein Bilderrahmen
    } else if (st === 'pergola') {
      ribLines(quads, 0.25, () => H + 1, across, S.beam, 1.1);
      let i = 0;
      for (const q of quads) {
        if (hash(Math.round(q[0] * 97), Math.round(q[2] * 89), 3) > 0.45) continue;
        const p = P(q[0] + (q[1] - q[0]) * hash(i, 1, 5), q[2] + (q[3] - q[2]) * hash(i, 2, 5), H + 1.6);
        g.fillStyle = S.leaf[i % 3]; g.beginPath(); g.ellipse(p[0], p[1], 1.7 * z, 1.1 * z, 0, 0, 7); g.fill();
        if (i % 4 === 0) { g.fillStyle = S.flower[(i >> 2) % 4]; g.beginPath(); g.arc(p[0] + 0.7 * z, p[1] - 0.5 * z, 0.75 * z, 0, 7); g.fill(); }
        i++;
      }
    } else if (st === 'arkaden') {
      for (const q of quads) poly(corners(q).map(([a, b]) => [a, b - 3 * z]), S.top, S.top, 0.4);
      for (const [ua, ub, va, vb] of quads) {                          // Steinfugen alle ½ Feld
        for (const u of [0.5, 1].map(k => Math.floor(ua) + k)) if (u > ua + 1e-6 && u < ub + 1e-6 && Math.abs(u - ub) < 1e-6) line([P(u, va, H + 3), P(u, vb, H + 3)], S.side, 0.4);
        for (const v of [0.5, 1].map(k => Math.floor(va) + k)) if (v > va + 1e-6 && v < vb + 1e-6 && Math.abs(v - vb) < 1e-6) line([P(ua, v, H + 3), P(ub, v, H + 3)], S.side, 0.4);
      }
    }
    // 3) Rand: zum Betrachter (+u, +v) Wände/Volant/Balken; Pergola-Balken rundum
    for (const r of runs) {
      const front = r.n > 0, pt = (t, up) => r.ax === 'u' ? P(r.at, t, up) : P(t, r.at, up);
      if (st === 'pergola') { line([pt(r.a, H), pt(r.b, H)], S.beam, 1.6); continue; }
      if (st === 'glas') { line([pt(r.a, H), pt(r.b, H)], S.rib, 0.9); continue; }
      if (!front) continue;
      if (st === 'markise') {
        const n = Math.max(1, Math.round((r.b - r.a) / 0.12));
        for (let i = 0; i < n; i++) { const A = pt(r.a + (r.b - r.a) * i / n, H), B = pt(r.a + (r.b - r.a) * (i + 1) / n, H); poly([A, B, [B[0], B[1] + 1.4 * z], [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 2.8 * z], [A[0], A[1] + 1.4 * z]], S.cols[i % 2], '#d9c9b8', 0.3); }
      } else if (st === 'arkaden') {
        // Bögen zwischen benachbarten Stützen: Kämpfer H − 9 an der Stütze, Scheitel H − 2 in der Mitte
        const top = [], arch = [];
        for (let i = 0; i < r.posts.length - 1; i++) {
          const a = r.posts[i], b = r.posts[i + 1];
          for (let k = 0; k <= 10; k++) { const t = a + (b - a) * k / 10; arch.push(pt(t, H - 9 + 7 * Math.sin(Math.PI * k / 10))); }
        }
        poly([...arch, pt(r.b, H), pt(r.a, H)], r.ax === 'v' ? S.side : S.stone);
        line(arch, S.dark, 0.6);
        poly([pt(r.a, H), pt(r.b, H), pt(r.b, H + 3), pt(r.a, H + 3)], r.ax === 'v' ? S.dark : S.side);
      }
    }
  }
  // Linien quer zum Gang alle step Felder (u = konst. bzw. v = konst.), in flachen Mitten beide Richtungen
  function ribLines(quads, step, hFn, across, col, lw) {
    for (const [ua, ub, va, vb] of quads) {
      const dir = across((ua + ub) / 2, (va + vb) / 2);
      if (dir !== 'u') for (let u = Math.ceil(ua / step - 1e-6) * step; u < ub - 1e-6; u += step) line([P(u, va, hFn(u, va)), P(u, vb, hFn(u, vb))], col, lw);
      if (dir !== 'v') for (let v = Math.ceil(va / step - 1e-6) * step; v < vb - 1e-6; v += step) line([P(ua, v, hFn(ua, v)), P(ub, v, hFn(ub, v))], col, lw);
    }
  }
  // Szene: schmaler Gang mit T und Kurve, der in ein 2 breites Stück mit Kurve mündet; daneben ein 3 × 3-Platz
  const LAYOUT = [];
  for (let x = 0; x <= 3; x++) LAYOUT.push([x, 0]);
  LAYOUT.push([1, -1], [3, 1], [3, 2]);
  for (let x = 2; x <= 6; x++) for (let y = 3; y <= 4; y++) LAYOUT.push([x, y]);
  for (let x = 5; x <= 6; x++) for (let y = 5; y <= 6; y++) LAYOUT.push([x, y]);
  for (let x = -3; x <= -1; x++) for (let y = 3; y <= 5; y++) LAYOUT.push([x, y]);
  LAYOUT.push([0, 4], [1, 4]);
  window.__canopy = { scenes: [], flip: (window.__canopy || {}).flip };
  const offs = [[-12, -10], [4, -10], [-12, 4], [4, 4]];
  for (let y = -14; y <= 16; y++) for (let x = -18; x <= 16; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); }
  state.edges.clear();
  Object.keys(STY).forEach((st, i) => {
    const [ox, oy] = offs[i], cov = new Set();
    for (const [x, y] of LAYOUT) { state.tiles.set((ox + x) + ',' + (oy + y), { b: 'weg', lvl: 1, style: 'm:platten:sand' }); cov.add((ox + x) + ',' + (oy + y)); }
    for (let y = -3; y <= 9; y++) for (let x = -5; x <= 9; x++) state.claimed.add((ox + x) + ',' + (oy + y));   // eigenes Land (sonst blass)
    state.tiles.set((ox + 0) + ',' + (oy + 2), { b: 'haus', lvl: 2 });
    window.__canopy.scenes.push({ st, ox, oy, area: makeArea(cov) });
  });
  recalc(); groundVersion++;
  if (!window.__renderOrig) window.__renderOrig = render;
  render = function (now) { window.__renderOrig(now); for (const sc of window.__canopy.scenes) { drawArea(sc.st, sc.area); if (sc.edit) drawMarks(sc.area); } };
  return 'ok';
})();
