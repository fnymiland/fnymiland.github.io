// Entwurf (Nutzer 24.10.2026): Riesenrad und Sternwarte wie der Botanische Garten – nur das Gebäude, ringsum echte Dinge.
// Im Spiel laden (Testwelt, speichert nie): fetch('tools/wunder-garten-entwurf.js').then(r => r.text()).then(t => (0, eval)(t))
// Danach: WGE.szene() baut alle Varianten nebeneinander auf (Felder −14…14 × −32…−6 werden geleert).
(function () {
  const W = window.WGE = {};
  // --- Riesenrad nur das Gebäude (3×3): Rad, Einstiegsplattform, Kassenhäuschen und Zuckerwatte-Stand vorn; Bäume/Laternen/Beete/Weg weg
  W.riesenrad = function (K, cx, cy, z, now, x, y) {
    if (groundPart(() => { if (W.platz) kPave(K, () => kRectPath(K, -1.5, -1.5, 1.5, 1.5), PATH_LOOK[W.platz] || PATH_LOOK.sand, x, y); })) return;   // Platz unter dem Rad (Entwurf: im Belag des Wegs)
    kShadow(K, 1.2);
    const idle = false, R = 86 * z, hx = cx, hy = cy - 120 * z, rot = now / 11000, lit = night > 0.15 && isLive();
    const leg = (bx, by, w, col) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.lineTo(hx, hy); g.stroke(); };
    const wheel = () => {
      cyl(cx, cy + 2 * z, 20 * z, 10 * z, 4 * z, '#e8e2d6');                          // Einstiegsplattform: klein (keine Platte)
      leg(cx - R * 0.62, cy - 8 * z, 4.5, '#dcd6ca'); leg(cx + R * 0.62, cy - 8 * z, 4.5, '#dcd6ca');
      g.strokeStyle = C('#f4f1ea'); g.lineWidth = 3.2 * z; g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.6 * z; g.beginPath(); g.arc(hx, hy, R * 0.9, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1 * z; g.beginPath(); g.arc(hx, hy, R * 0.3, 0, Math.PI * 2); g.stroke();
      g.beginPath(); for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2; g.moveTo(hx + Math.cos(a) * R * 0.3, hy + Math.sin(a) * R * 0.3); g.lineTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); } g.stroke();
      const cols = ['#e8604f', '#6f8fd8', '#f2c14e', '#58b36a', '#f28cb1', '#b07ad6', '#5fc4c9', '#f29a5a'];
      for (let i = 0; i < 16; i++) {
        const a = rot + i / 16 * Math.PI * 2, gx = hx + Math.cos(a) * R, gy = hy + Math.sin(a) * R, col = cols[i % cols.length];
        g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 4 * z); g.stroke();
        ellipse(gx, gy + 4 * z, 6.2 * z, 2.2 * z, C(shade(col, -0.18)));
        poly([[gx - 5.6 * z, gy + 4.5 * z], [gx + 5.6 * z, gy + 4.5 * z], [gx + 4.6 * z, gy + 14 * z], [gx - 4.6 * z, gy + 14 * z]], C(col));
        poly([[gx - 3.8 * z, gy + 6 * z], [gx + 3.8 * z, gy + 6 * z], [gx + 3.4 * z, gy + 9.6 * z], [gx - 3.4 * z, gy + 9.6 * z]], lit ? '#ffd873' : C('#e6f4ff'));
      }
      circle(hx, hy, 7 * z, C('#d9534a')); circle(hx, hy, 3 * z, C('#f4f1ea'));
      leg(cx - R * 0.8, cy + 10 * z, 5, '#f4f1ea'); leg(cx + R * 0.8, cy + 10 * z, 5, '#f4f1ea');
      if (lit) for (let i = 0; i < 32; i++) { const a = rot + i / 32 * Math.PI * 2, lx = hx + Math.cos(a) * R, ly = hy + Math.sin(a) * R; circle(lx, ly, 1.4 * z, ['#ffe58a', '#ff9fc4', '#9fdcf7'][i % 3]); glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 12 * z); }
    };
    const booth = (a, b, roof) => () => { const B = K.block({ a, b, ha: 0.22, hb: 0.22, h: 14, wall: '#fffaf0', roof, roofH: 9 }); K.door(B, 'front', 0.25, 0.75, 0.7, '#6f8fd8'); K.door(B, 'right', 0.25, 0.75, 0.7, '#6f8fd8'); };
    // Standbeine in der Bildebene: Füße vorn bei (1,39 | −0,77) und (−0,77 | 1,39), hinten bei (0,59 | −1,09) und (−1,09 | 0,59) – die Buden
    // stehen vorn zwischen den Füßen, beidseits der Plattform (Bild-x ±22, die Beine sind dort schon bei ±65)
    // Tickethäuschen links vom Tor (vorn Mitte offen): rechts davon stehen die vorderen Standbeine (Fuß bei b −0,77), dort ist kein Platz.
    // Schalterfenster nach vorn zu den Leuten auf dem Platz, Tür seitlich
    const ticket = () => {
      const a = 1.3, b = 1.0, B = K.block({ a, b, ha: 0.2, hb: 0.44, h: 15, wall: '#fff6e6', roof: '#e8604f', roofH: 8 });   // in der Absperrung: ersetzt das Zaunstück links vom Tor
      const F = B.faces.front;
      if (F) { for (const [t0, t1] of [[0.1, 0.45], [0.55, 0.9]]) { faceQuad(F.P, F.Q, t0, t1, F.H * 0.42, F.H * 0.8, C('#3d4a5c')); faceQuad(F.P, F.Q, t0 - 0.03, t1 + 0.03, F.H * 0.36, F.H * 0.44, C('#c9a46a')); }   // zwei Schalter mit Brett
        faceQuad(F.P, F.Q, 0.08, 0.92, F.H * 0.86, F.H * 1.02, C('#f2c14e')); }                                     // Schild über dem Schalter
      K.door(B, 'right', 0.3, 0.7, 0.75, '#6f8fd8');
    };
    K.scene(W.alt ? [[0, 0, wheel], [1.15, 0.45, booth(1.15, 0.45, '#e8604f')], [0.45, 1.15, booth(0.45, 1.15, '#f28cb1')]] : [[0, 0, wheel], [1.3, 1.0, ticket]]);
  };
  // --- Sternwarte nur das Gebäude: v 'schmal' (1 tief × 2 breit: Turm links, Institut rechts) oder 'quadrat' (2×2: Turm hinten, Institut vorn rechts)
  W.sternwarte = v => function (K, cx, cy, z, now) {
    if (groundPart(() => {})) return;
    // Turm: Welt-Radius r (Bild rx = r·TW/√2); muss ganz in der Fläche liegen und darf das Institut nicht schneiden
    const lit = night > 0.15 && isLive(), r = v === 'schmal' ? 0.42 : 0.57, T = v === 'schmal' ? [0, -0.5] : [-0.33, -0.33], A = v === 'schmal' ? [0, 0.5] : [0.55, 0.55], ah = v === 'schmal' ? 0.42 : 0.36;
    kShadow(K, v === 'schmal' ? 0.8 : 1);
    const tower = () => {
      const [x0, y0] = K.P(T[0], T[1]), rx = r * TW / Math.SQRT2 * z, ry = rx / 2, H = 46 * z, q = rx / (36 * z);
      cyl(x0, y0, rx, ry, H, '#f6efe2');
      g.fillStyle = C('#e6dccb'); g.beginPath(); g.ellipse(x0, y0 - H * 0.52, rx, ry, 0, 0, Math.PI); g.lineTo(x0 - rx, y0 - H * 0.52 - 3 * z); g.ellipse(x0, y0 - H * 0.52 - 3 * z, rx, ry, 0, Math.PI, 0, true); g.fill();
      for (const dx of [-22, -8, 6, 20]) for (const f of [[0.12, 0.42], [0.62, 0.9]]) faceQuadRect(x0 + dx * q * z, y0 + ry * 0.75 * Math.sqrt(Math.max(0, 1 - (dx * q * z / rx) ** 2)), 5.5 * q * z, H * f[0], H * f[1], lit);
      ellipse(x0, y0 - H, rx * 1.16, ry * 1.16, C('#d8cfbd'));
      g.strokeStyle = C('#f4f1ea'); g.lineWidth = 0.9 * z; g.beginPath();
      for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, px = x0 + Math.cos(a) * rx * 1.14, py = y0 - H + Math.sin(a) * ry * 1.14; g.moveTo(px, py); g.lineTo(px, py - 6 * z); }
      g.stroke(); g.beginPath(); g.ellipse(x0, y0 - H - 6 * z, rx * 1.14, ry * 1.14, 0, 0, Math.PI); g.stroke();
      const dh = 36 * q * z, top = y0 - H - dh;
      dome(x0, y0 - H, rx * 0.92, ry * 0.92, dh, '#cfd8e3');
      g.strokeStyle = C('#b9c4d2'); g.lineWidth = 0.9 * z; g.beginPath(); g.ellipse(x0, y0 - H, rx * 0.5, dh, 0, Math.PI, Math.PI * 2); g.stroke();
      g.strokeStyle = C('#aab5c2'); g.lineWidth = 4 * z; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x0, y0 - H - 1 * z); g.lineTo(x0, top + 1 * z); g.stroke();
      circle(x0, top - 1.5 * z, 2.2 * z, C('#f2c14e'));
    };
    const annex = () => { const B = K.block({ a: A[0], b: A[1], ha: ah, hb: ah, h: 20, wall: '#f3e1c4', roof: '#6f8fd8', roofH: 12, entry: true }); K.door(B, 'front', 0.4, 0.6, 0.55); K.wins(B, 'front', 3, 0.35, 0.72, 0.1, 0.9, [1]); K.sideWins(B, 2, 0.35, 0.72); };
    K.scene([[T[0], T[1], tower], [A[0], A[1], annex]]);
  };

  // --- Garten aus echten Dingen um einen Bau (Drehung 0: vorn = +x). spec(c) bekommt { side: 'vorn'|'hinten'|'links'|'rechts', p, n, ecke }
  // und gibt Aktionen: 'weg' | 'blumen' | 'teich' | ['klein', b, Plätze] | ['hecke'] (Kante nach außen) – mehrere als Liste
  W.garten = (X, Y, w, h, spec, offen) => {
    const x0 = X - 1, x1 = X + w, y0 = Y - 1, y1 = Y + h, money = state.money; BATCH = 1;
    const T = (b, x, y) => { state.money = 1e15; build(b, x, y, true); const t = state.tiles.get(x + ',' + y); if (t) t.price = 0; return t; };
    const S = (b, x, y, slots) => { const k = x + ',' + y, ds = state.decos.get(k) || newSlots(); for (const s of slots) ds[s] = { b, rot: 0, free: true, ...(DECO_LOOKS[b] ? decoLookNew(b) : {}) }; state.decos.set(k, ds); };
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (x > x0 && x < x1 && y > y0 && y < y1) continue;
      const side = x === x1 ? 'vorn' : x === x0 ? 'hinten' : y === y0 ? 'links' : 'rechts', p = side === 'vorn' || side === 'hinten' ? y - y0 : x - x0, n = side === 'vorn' || side === 'hinten' ? y1 - y0 : x1 - x0;
      const ecke = (x === x0 || x === x1) && (y === y0 || y === y1);
      const r = spec({ side, p, n, ecke, x, y }), acts = !r ? [] : typeof r === 'string' ? [[r]] : typeof r[0] === 'string' ? [r] : r;   // eine Aktion oder eine Liste
      for (const a of acts.map(v => Array.isArray(v) ? v : [v])) {
        if (a[0] === 'weg') { const t = T('weg', x, y); if (t && a[1]) Object.assign(t, a[1]); }
        else if (a[0] === 'blumen') T('blumen', x, y);
        else if (a[0] === 'teich') { state.money = 1e15; build('graben', x, y, true); }
        else if (a[0] === 'klein') S(a[1], x, y, a[2]);
      }
    }
    if (offen !== undefined) for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (x > x0 && x < x1 && y > y0 && y < y1) continue;
      for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) continue;
        if (offen && offen(x, y, dx, dy)) continue;
        const k = edgeBetween(x, y, nx, ny); state.edges.set(k, { b: 'hecke', style: currentStyle('hecke'), free: true, flush: newFlush(k) }); }
    }
    BATCH = 0; state.money = money; recalc(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++;
  };

  W.leeren = () => {
    for (let x = -14; x <= 14; x++) for (let y = -34; y <= -4; y++) { const k = x + ',' + y; state.tiles.delete(k); state.decos.delete(k); state.terra.set(k, 'grass'); state.claimed.add(k); }
    for (const k of [...state.edges.keys()]) { const m = k.slice(1).split(',').map(Number); if (m[0] >= -15 && m[0] <= 15 && m[1] >= -35 && m[1] <= -3) state.edges.delete(k); }
    rebuildCover(); recalc();
  };
  // Riesenrad auf dem Platz (Stand 24.10.): 3×3, ringsum breite Wege (Ecken hinten mit Bäumen), Laternen vorn, Bänke an den Seiten,
  // Zaun um den Fuß, vorn Mitte ein offenes Tor
  W.szeneRiesenrad = (X = -6, Y = -28) => {
    W.platz = 'sand';
    W.bau('riesenrad', X, Y, [3, 3], W.riesenrad);
    W.garten(X, Y, 3, 3, c => c.side === 'hinten' && c.ecke ? [['weg', { wide: true, sq: true }], ['klein', 'baum', [0, 1, 2, 3]]] : c.side === 'vorn' && c.p === 2 ? [['weg', { wide: true, sq: true }], ['klein', 'laterne', [1, 3]]]   // Laternen beidseits vor dem Tor
      : (c.side === 'links' || c.side === 'rechts') && c.p === 2 ? [['weg', { wide: true, sq: true }], ['klein', 'bank', [c.side === 'links' ? 0 : 3]]] : ['weg', { wide: true, sq: true }]);
    for (let x = X; x <= X + 2; x++) for (let y = Y; y <= Y + 2; y++) for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy; if (nx >= X && nx <= X + 2 && ny >= Y && ny <= Y + 2) continue;
      if (dx === 1 && y === Y + 2) continue;                              // dort steht das Tickethäuschen
      const k = edgeBetween(x, y, nx, ny), tor = dx === 1 && y === Y + 1; state.edges.set(k, { b: 'zaun', style: currentStyle('zaun'), ...(tor ? { gate: 'offen' } : {}) }); }
    groundVersion++; resetDrawCaches();
    const c = iso(X + 1.5, Y + 1.5); state.cam.x = c.x; state.cam.y = c.y - 50; state.cam.z = 3.4;
  };
  W.bau = (b, x, y, size, art) => { ITEMS[b].size = size; WONDER_ART[b] = art; state.tiles.set(x + ',' + y, { b, lvl: 1, rot: 0, phase: WONDERS[b].phases.length }); rebuildCover(); recalc(); };
})();
