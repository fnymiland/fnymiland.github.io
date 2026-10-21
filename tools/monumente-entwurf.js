// Entwurfsbogen Monumente (Nutzer 21.10.2026: „Monumente – im Itemshop, ein Konzept, mehrere Bilder“). Zeichnet in der Art von SD_ART
// (Mitte der Grundfläche cx, cy; Einheit z: ein Feld ist 64 × 32 Einheiten), Grundfläche n × n Felder, Tag und Nacht (glowQuad als Schein).
// (0, eval)(await (await fetch('tools/monumente-entwurf.js')).text()); await monumenteEntwurf()  → Bild als data-URL in window.__monu
(function monumenteTool() {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', STONE = '#eee5d0', STONE_D = '#d6c8a8', SAND = '#e6c27a', BRONZE = '#c98b45', BRONZE_D = '#9a6330';
  const lit = () => night > 0.15;
  const glow = (x, y, r, z, tint) => { const q = 0.35 * z; glowQuad([[x - q, y + q], [x + q, y + q], [x + q, y - q], [x - q, y - q]], r, tint); };
  const line = (col, w, z, pts) => { g.strokeStyle = C(col); g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const shadow = (cx, cy, rx, z) => ellipse(cx, cy + 2 * z, rx * z, rx * 0.45 * z, 'rgba(40,60,20,0.18)');
  const star = (cx, cy, r, fill, edge) => { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } poly(pts, fill); if (edge) { g.strokeStyle = edge; g.lineWidth = Math.max(0.5, r * 0.12); g.stroke(); } };
  // Punkt auf einer Seitenfläche einer Kiste: links (L→B) oder rechts (B→R), t längs, h nach oben
  const face = (cx, cy, a, b, side, t, h) => side < 0 ? [cx - a + t * a, cy + t * b - h] : [cx + t * a, cy + b - t * b - h];
  // Bogenöffnung auf einer Seitenfläche (t0..t1 breit, hs gerade Höhe, Halbkreis darauf)
  function archHole(cx, cy, a, b, side, t0, t1, hs, col) {
    const tm = (t0 + t1) / 2, rt = (t1 - t0) / 2, rh = rt * a * 1.1, pts = [face(cx, cy, a, b, side, t0, 0)];
    for (let i = 0; i <= 12; i++) { const ang = Math.PI - i * Math.PI / 12; pts.push(face(cx, cy, a, b, side, tm + Math.cos(ang) * rt, hs + Math.sin(ang) * rh)); }
    pts.push(face(cx, cy, a, b, side, t1, 0)); poly(pts, col);
  }
  function lion(cx, cy, z0, flip = 1) {                                     // liegender Löwe auf Sockel
    const z = z0 * 1.5;
    box(cx, cy, 7 * z, 3.5 * z, 5 * z, STONE_D, null, 0);
    const y = cy - 5 * z;
    ellipse(cx - flip * 1 * z, y - 2.5 * z, 5.5 * z, 2.6 * z, C(SAND));
    ellipse(cx + flip * 4 * z, y - 5 * z, 3.2 * z, 3.4 * z, C('#c9963f'));       // Mähne
    circle(cx + flip * 4.6 * z, y - 5 * z, 2 * z, C(SAND));
    ellipse(cx + flip * 4 * z, y - 0.6 * z, 2.6 * z, 0.9 * z, C(SAND));          // Pfoten
    line('#c9963f', 0.8, z, [[cx - flip * 6 * z, y - 2 * z], [cx - flip * 8 * z, y - 4 * z]]);
  }
  const M = [];
  // 1 · Obelisk mit Löwen (2×2)
  M.push(['Obelisk mit Löwen', 2, 'gras', (cx, cy, z) => {
    shadow(cx, cy, 40, z);
    box(cx, cy, 30 * z, 15 * z, 4 * z, STONE_D, null, 0);
    box(cx, cy - 4 * z, 20 * z, 10 * z, 5 * z, STONE, null, 0);
    const b = cy - 9 * z, t = cy - 78 * z;
    poly([[cx - 7 * z, b], [cx, b + 3.5 * z], [cx, t + 2.4 * z], [cx - 4.4 * z, t]], C('#efe2c4'));
    poly([[cx, b + 3.5 * z], [cx + 7 * z, b], [cx + 4.4 * z, t], [cx, t + 2.4 * z]], C('#d8c6a0'));
    for (let i = 0; i < 6; i++) { const y = b - 10 * z - i * 9 * z; poly([[cx - 4.6 * z, y], [cx - 1.4 * z, y + 1.4 * z], [cx - 1.4 * z, y - 2 * z], [cx - 4.6 * z, y - 3.4 * z]], C(i % 2 ? GOLD_D : '#c4ab7c')); }
    poly([[cx - 4.4 * z, t], [cx, t + 2.4 * z], [cx, t - 9 * z]], C(GOLD));
    poly([[cx, t + 2.4 * z], [cx + 4.4 * z, t], [cx, t - 9 * z]], C(GOLD_D));
    if (lit()) glow(cx, t - 4 * z, 26 * z, z);
    lion(cx - 30 * z, cy + 8 * z, z, 1); lion(cx + 30 * z, cy + 8 * z, z, -1);
  }]);
  // 2 · Triumphbogen (2×2, Weg führt hindurch)
  M.push(['Triumphbogen', 2, 'weg', (cx, cy, z) => {
    shadow(cx, cy, 38, z);
    const a = 30 * z, b = 15 * z, h = 50 * z;
    box(cx, cy, a, b, h, STONE, null, 0);
    archHole(cx, cy, a, b, -1, 0.28, 0.72, 20 * z, C('#6d6250'));
    archHole(cx, cy, a, b, 1, 0.34, 0.66, 14 * z, C('#5a5040'));
    for (const t of [0.12, 0.88]) { const p = face(cx, cy, a, b, -1, t, 0), q = face(cx, cy, a, b, -1, t, 36 * z); line('#d8cdb4', 2.4, z, [p, q]); }   // Säulen
    const p0 = face(cx, cy, a, b, -1, 0.1, 40 * z), p1 = face(cx, cy, a, b, -1, 0.9, 40 * z);
    poly([p0, p1, [p1[0], p1[1] - 6 * z], [p0[0], p0[1] - 6 * z]], C(GOLD));             // Inschrift-Band
    box(cx, cy - h, a * 0.9, b * 0.9, 4 * z, STONE_D, null, 0);
    // Viergespann als goldene Gruppe oben
    const top = cy - h - 4 * z;
    for (const dx of [-9, -3, 3]) { ellipse(cx + dx * z, top - 5 * z, 3.2 * z, 2 * z, C(GOLD_D)); line(GOLD_D, 0.9, z, [[cx + dx * z, top - 4 * z], [cx + dx * z, top]]); circle(cx + (dx + 2.6) * z, top - 7 * z, 1.4 * z, C(GOLD_D)); }
    poly([[cx + 6 * z, top], [cx + 12 * z, top], [cx + 11 * z, top - 5 * z], [cx + 7 * z, top - 5 * z]], C(GOLD));
    circle(cx + 9 * z, top - 9 * z, 1.8 * z, C(GOLD)); line(GOLD, 0.9, z, [[cx + 9 * z, top - 8 * z], [cx + 9 * z, top - 4 * z]]);
    for (const s of [-1, 1]) { const f = [cx + s * 27 * z, cy - h - 4 * z]; line('#8a6a4a', 0.8, z, [f, [f[0], f[1] - 16 * z]]); poly([[f[0], f[1] - 16 * z], [f[0] + 7 * z, f[1] - 14 * z], [f[0], f[1] - 11 * z]], C('#e8546f')); }
    if (lit()) { glow(cx - 15 * z, cy - 12 * z, 22 * z, z); glow(cx, top - 6 * z, 22 * z, z); }
  }]);
  // 3 · Koloss am Hafen (2×2 über Wasser, Schiffe fahren zwischen den Beinen durch)
  M.push(['Koloss am Hafen', 2, 'wasser', (cx, cy, z) => {
    const L = [cx - 36 * z, cy - 2 * z], R = [cx + 36 * z, cy + 2 * z];
    for (const P of [L, R]) { box(P[0], P[1], 10 * z, 5 * z, 12 * z, '#c9c0ae', null, 0); }
    // Boot zwischen den Beinen
    poly([[cx - 9 * z, cy + 6 * z], [cx + 9 * z, cy + 6 * z], [cx + 6 * z, cy + 10 * z], [cx - 6 * z, cy + 10 * z]], C('#8a5a3c'));
    line('#6b4f3a', 0.7, z, [[cx, cy + 6 * z], [cx, cy - 8 * z]]); poly([[cx, cy - 8 * z], [cx + 7 * z, cy + 4 * z], [cx, cy + 4 * z]], C('#fffaf0'));
    const hip = [cx, cy - 66 * z];
    for (const [P, s] of [[L, -1], [R, 1]]) { poly([[P[0] - 4 * z, P[1] - 12 * z], [P[0] + 4 * z, P[1] - 12 * z], [hip[0] + s * 3 * z + 4 * z, hip[1]], [hip[0] + s * 3 * z - 4 * z, hip[1]]], C(s < 0 ? BRONZE : BRONZE_D)); }
    poly([[cx - 13 * z, hip[1] + 4 * z], [cx + 13 * z, hip[1] + 4 * z], [cx + 10 * z, hip[1] - 10 * z], [cx - 10 * z, hip[1] - 10 * z]], C('#e8dcc0'));   // Gewand
    poly([[cx - 10 * z, hip[1] - 8 * z], [cx + 10 * z, hip[1] - 8 * z], [cx + 9 * z, hip[1] - 34 * z], [cx - 9 * z, hip[1] - 34 * z]], C(BRONZE));
    poly([[cx, hip[1] - 8 * z], [cx + 10 * z, hip[1] - 8 * z], [cx + 9 * z, hip[1] - 34 * z], [cx, hip[1] - 34 * z]], C(BRONZE_D));
    circle(cx, hip[1] - 41 * z, 7 * z, C(BRONZE));
    for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; line(GOLD, 1.2, z, [[cx + Math.cos(a) * 7 * z, hip[1] - 41 * z + Math.sin(a) * 7 * z], [cx + Math.cos(a) * 11 * z, hip[1] - 41 * z + Math.sin(a) * 11 * z]]); }   // Strahlenkranz
    line(BRONZE_D, 4, z, [[cx - 8 * z, hip[1] - 30 * z], [cx - 16 * z, hip[1] - 14 * z]]);
    line(BRONZE, 4, z, [[cx + 8 * z, hip[1] - 30 * z], [cx + 16 * z, hip[1] - 56 * z]]);                                  // erhobener Arm
    const lamp = [cx + 17 * z, hip[1] - 62 * z];
    poly([[lamp[0] - 4 * z, lamp[1]], [lamp[0] + 4 * z, lamp[1]], [lamp[0] + 3 * z, lamp[1] - 6 * z], [lamp[0] - 3 * z, lamp[1] - 6 * z]], C(GOLD_D));
    circle(lamp[0], lamp[1] - 9 * z, 3.4 * z, lit() ? '#fff1a8' : C('#ffb347'));
    if (lit()) { glow(lamp[0], lamp[1] - 9 * z, 46 * z, z); }
  }]);
  // 4 · Statue deiner Figur (2×2): hier als Bär – im Spiel in deinem Aussehen (Fell, Hut)
  M.push(['Deine Statue', 2, 'gras', (cx, cy, z) => {
    shadow(cx, cy, 36, z);
    box(cx, cy, 24 * z, 12 * z, 5 * z, STONE_D, null, 0);
    box(cx, cy - 5 * z, 16 * z, 8 * z, 12 * z, STONE, null, 0);
    const pl = face(cx, cy - 5 * z, 16 * z, 8 * z, -1, 0.25, 4 * z), pr = face(cx, cy - 5 * z, 16 * z, 8 * z, -1, 0.75, 4 * z);
    poly([pl, pr, [pr[0], pr[1] - 5 * z], [pl[0], pl[1] - 5 * z]], C(GOLD));                                         // Namensschild
    const y = cy - 17 * z;
    ellipse(cx - 5 * z, y - 2 * z, 4 * z, 3 * z, C(GOLD_D)); ellipse(cx + 5 * z, y - 2 * z, 4 * z, 3 * z, C(GOLD_D));   // Füße
    ellipse(cx, y - 18 * z, 12 * z, 16 * z, C(GOLD));
    ellipse(cx + 4 * z, y - 18 * z, 7 * z, 14 * z, C(GOLD_D));
    ellipse(cx, y - 14 * z, 6 * z, 8 * z, C('#ffe28a'));                                                                // Bauch
    line(GOLD_D, 4.4, z, [[cx - 10 * z, y - 26 * z], [cx - 18 * z, y - 42 * z]]);                                        // winkt
    circle(cx - 18.5 * z, y - 43 * z, 3 * z, C(GOLD));
    circle(cx, y - 40 * z, 11 * z, C(GOLD));
    circle(cx - 8 * z, y - 49 * z, 4 * z, C(GOLD)); circle(cx + 8 * z, y - 49 * z, 4 * z, C(GOLD_D));
    ellipse(cx + 1 * z, y - 36 * z, 4.6 * z, 3.4 * z, C('#ffe28a')); circle(cx + 1 * z, y - 37.5 * z, 1.4 * z, C(GOLD_D));
    circle(cx - 4 * z, y - 42 * z, 1.1 * z, C(GOLD_D)); circle(cx + 5 * z, y - 42 * z, 1.1 * z, C(GOLD_D));
    poly([[cx - 9 * z, y - 50 * z], [cx + 9 * z, y - 50 * z], [cx + 7 * z, y - 57 * z], [cx - 7 * z, y - 57 * z]], C('#e8546f'));   // Hut der Figur
    ellipse(cx, y - 50 * z, 12 * z, 2.4 * z, C('#c9443a'));
    if (lit()) { for (const s of [-1, 1]) glow(cx + s * 22 * z, cy - 2 * z, 20 * z, z); }
  }]);
  // 5 · Mondtor (2×2): runde Pforte in einer weißen Mauer (längs der Feldachse), Ziegeldach, Laternen – passt zum Mondhasen
  M.push(['Mondtor', 2, 'weg', (cx, cy, z) => {
    shadow(cx, cy, 34, z);
    const P0 = [cx - 30 * z, cy - 15 * z], P1 = [cx + 30 * z, cy + 15 * z], d = [3.2 * z, -1.6 * z], h = 36 * z;   // Mauer: Mittellinie, Dicke nach hinten
    const at = (t, up, back = 0) => [P0[0] + (P1[0] - P0[0]) * t + d[0] * back, P0[1] + (P1[1] - P0[1]) * t + d[1] * back - up];
    poly([at(1, 0, -1), at(1, 0, 1), at(1, h, 1), at(1, h, -1)], C('#e2dccd'));                          // Stirnseite rechts
    const front = [at(0, 0, -1), at(1, 0, -1), at(1, h, -1), at(0, h, -1)];
    poly(front, C('#f7f2e8'));
    const ring = []; for (let i = 0; i <= 28; i++) { const ang = i / 28 * Math.PI * 2; ring.push(at(0.5 + Math.cos(ang) * 0.25, 17 * z + Math.sin(ang) * 15 * z, -1)); }
    poly(ring, lit() ? '#2c3a66' : C('#9fd27a'));
    g.strokeStyle = C('#b9a37a'); g.lineWidth = 2 * z; g.stroke();
    for (let i = 0; i < 10; i++) { const t0 = i / 10 - 0.04, t1 = (i + 1) / 10 + 0.04; poly([at(t0, h - 1 * z, -1.8), at(t1, h - 1 * z, -1.8), at(t1, h + 7 * z, 0.4), at(t0, h + 7 * z, 0.4)], C(i % 2 ? '#3d4a5c' : '#4a586c')); }   // Ziegeldach
    const m = at(0.5, h + 16 * z, 0);
    g.fillStyle = lit() ? '#fff1a8' : C(GOLD); g.beginPath(); g.arc(m[0], m[1], 6 * z, 0.3 * Math.PI, 1.7 * Math.PI); g.arc(m[0] + 2.8 * z, m[1] - 0.6 * z, 4.8 * z, 1.6 * Math.PI, 0.4 * Math.PI, true); g.fill();   // Mondsichel
    for (const t of [0.12, 0.88]) { const p = at(t, 26 * z, -1.4); line('#5a4636', 0.6, z, [p, [p[0], p[1] + 4 * z]]); ellipse(p[0], p[1] + 7 * z, 2.8 * z, 3.6 * z, lit() ? '#ffe9a0' : C('#e8546f')); if (lit()) glow(p[0], p[1] + 7 * z, 18 * z, z); }
    if (lit()) glow(m[0], m[1], 28 * z, z);
  }]);
  // 6 · Sternendenkmal (2×2): Stufensockel, Kristallsäule, großer goldener Stern – nachts hell
  M.push(['Sternendenkmal', 2, 'gras', (cx, cy, z) => {
    shadow(cx, cy, 36, z);
    box(cx, cy, 26 * z, 13 * z, 4 * z, '#d9d2e8', null, 0); box(cx, cy - 4 * z, 18 * z, 9 * z, 4 * z, '#e6e0f2', null, 0); box(cx, cy - 8 * z, 10 * z, 5 * z, 4 * z, '#f0ecf8', null, 0);
    const b = cy - 12 * z, t = cy - 46 * z;
    poly([[cx - 5 * z, b], [cx, b + 2.5 * z], [cx, t], [cx - 3 * z, t - 2 * z]], lit() ? '#bfe4ff' : C('#a9d3f5'));
    poly([[cx, b + 2.5 * z], [cx + 5 * z, b], [cx + 3 * z, t - 2 * z], [cx, t]], lit() ? '#8fc3f2' : C('#7fb2e0'));
    star(cx, t - 16 * z, 15 * z, lit() ? '#fff1a8' : C(GOLD), C(GOLD_D));
    star(cx, t - 16 * z, 7 * z, lit() ? '#ffffff' : C('#ffe28a'));
    for (const [dx, dy, r] of [[-22, -60, 2.4], [20, -70, 2], [-16, -84, 1.6], [24, -50, 1.6]]) star(cx + dx * z, cy + dy * z, r * z, lit() ? '#ffffff' : C('#ffe9a0'));
    if (lit()) { glow(cx, t - 16 * z, 60 * z, z); glow(cx, b - 10 * z, 24 * z, z, 'blue'); }
  }]);
  // 7 · Steinkreis (3×3): Torsteine im Ring, Altarstein in der Mitte, nachts leuchtende Zeichen
  M.push(['Steinkreis', 3, 'gras', (cx, cy, z) => {
    const ring = [], n = 10;
    for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2; ring.push([cx + Math.cos(ang) * 64 * z, cy + Math.sin(ang) * 32 * z, ang]); }
    const stone = (x, y, hgt) => { box(x, y, 6.4 * z, 3.4 * z, hgt, '#b8b3a6', null, 0); if (lit()) { const p = [x - 2 * z, y - hgt * 0.5]; poly([[p[0], p[1]], [p[0] + 1.6 * z, p[1] - 3 * z], [p[0] + 3 * z, p[1]]], '#9fe7ff'); glow(p[0] + 1.5 * z, p[1] - 1 * z, 10 * z, z, 'blue'); } };
    const back = ring.filter(r => Math.sin(r[2]) < 0).sort((p, q) => p[1] - q[1]), front = ring.filter(r => Math.sin(r[2]) >= 0).sort((p, q) => p[1] - q[1]);
    for (const [x, y] of back) stone(x, y, 30 * z);
    for (let i = 0; i < n; i += 2) { const p = ring[i], q = ring[(i + 1) % n]; if (Math.sin(p[2]) < 0 && Math.sin(q[2]) < 0) poly([[p[0] - 6 * z, p[1] - 30 * z], [q[0] + 6 * z, q[1] - 30 * z], [q[0] + 6 * z, q[1] - 36 * z], [p[0] - 6 * z, p[1] - 36 * z]], C('#a8a396')); }
    box(cx, cy, 12 * z, 6 * z, 5 * z, '#c9c3b4', null, 0);
    if (lit()) glow(cx, cy - 6 * z, 30 * z, z, 'blue');
    for (const [x, y] of front) stone(x, y, 30 * z);
    for (let i = 0; i < n; i += 2) { const p = ring[i], q = ring[(i + 1) % n]; if (Math.sin(p[2]) >= 0 && Math.sin(q[2]) >= 0) poly([[p[0] + 6 * z, p[1] - 30 * z], [q[0] - 6 * z, q[1] - 30 * z], [q[0] - 6 * z, q[1] - 36 * z], [p[0] + 6 * z, p[1] - 36 * z]], C('#a8a396')); }
  }]);
  // 8 · Prachtbrunnen (2×2): achteckiges Becken, Figurensäule mit Schalen, Wasserbögen
  M.push(['Prachtbrunnen', 2, 'platz', (cx, cy, z) => {
    shadow(cx, cy, 40, z);
    ellipse(cx, cy, 34 * z, 17 * z, C('#d6c8a8')); ellipse(cx, cy - 3 * z, 34 * z, 17 * z, C(STONE)); ellipse(cx, cy - 3 * z, 30 * z, 15 * z, lit() ? '#5fa8d8' : C('#8fd0ee'));
    for (const [dx, dy] of [[-12, 2], [10, -4], [2, 6]]) ellipse(cx + dx * z, cy + dy * z - 3 * z, 4 * z, 1.4 * z, 'rgba(255,255,255,0.55)');
    const col = [cx, cy - 3 * z];
    poly([[col[0] - 3 * z, col[1]], [col[0] + 3 * z, col[1]], [col[0] + 2 * z, col[1] - 30 * z], [col[0] - 2 * z, col[1] - 30 * z]], C(STONE_D));
    for (const [yy, r] of [[-14, 12], [-28, 8]]) { ellipse(col[0], col[1] + yy * z, r * z, r * 0.4 * z, C(STONE_D)); ellipse(col[0], col[1] + (yy - 1) * z, r * z, r * 0.4 * z, C(STONE)); }
    circle(col[0], col[1] - 38 * z, 4 * z, C(GOLD)); ellipse(col[0], col[1] - 33 * z, 3 * z, 5 * z, C(GOLD_D));            // goldene Figur
    g.strokeStyle = lit() ? 'rgba(220,240,255,0.95)' : 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2 * z; g.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2, ex = cx + Math.cos(ang) * 22 * z, ey = cy - 3 * z + Math.sin(ang) * 11 * z; g.beginPath(); g.moveTo(col[0], col[1] - 15 * z); g.quadraticCurveTo((col[0] + ex) / 2, col[1] - 26 * z, ex, ey); g.stroke(); }
    if (lit()) { glow(cx, cy - 3 * z, 34 * z, z, 'blue'); glow(col[0], col[1] - 38 * z, 18 * z, z); }
  }]);
  window.MONU = M;
  // Bauphasen (Konzept): Bauplatz → Rohbau mit Gerüst → fertig – am Beispiel des Obelisken
  const scaffold = (cx, cy, z, hgt) => {
    for (const [dx, dy] of [[-10, 0], [10, 0], [0, 5], [0, -5]]) line('#a8794a', 1, z, [[cx + dx * z, cy + dy * z], [cx + dx * z, cy + dy * z - hgt]]);
    for (let y = 8; y < hgt / z; y += 9) { line('#c9965a', 0.9, z, [[cx - 10 * z, cy - y * z], [cx, cy + 5 * z - y * z], [cx + 10 * z, cy - y * z]]); poly([[cx - 11 * z, cy - y * z], [cx, cy + 5.5 * z - y * z], [cx, cy + 3.5 * z - y * z], [cx - 11 * z, cy - 2 * z - y * z]], C('#d9a86a')); }
  };
  window.PHASEN = [
    ['Bauplatz (Abschnitt 1)', 2, 'gras', (cx, cy, z) => {
      diamond(cx, cy, 30 * z, 15 * z, C('#d8c49a'));
      for (const [dx, dy] of [[-30, 0], [30, 0], [0, 15], [0, -15]]) { line('#8a5a3c', 1, z, [[cx + dx * z, cy + dy * z], [cx + dx * z, cy + dy * z - 7 * z]]); }
      line('#e8546f', 0.5, z, [[cx - 30 * z, cy - 6 * z], [cx, cy + 9 * z], [cx + 30 * z, cy - 6 * z]]);
      for (const [dx, dy] of [[-14, 4], [-8, 7]]) box(cx + dx * z, cy + dy * z, 5 * z, 2.5 * z, 4 * z, STONE_D, null, 0);
      box(cx + 14 * z, cy + 2 * z, 6 * z, 3 * z, 3 * z, '#b48a5a', null, 0);
      const s = [cx + 2 * z, cy - 26 * z]; poly([[s[0] - 9 * z, s[1]], [s[0] + 9 * z, s[1]], [s[0] + 9 * z, s[1] - 8 * z], [s[0] - 9 * z, s[1] - 8 * z]], C('#fffaf0')); line('#8a5a3c', 0.8, z, [[s[0], s[1]], [s[0], cy - 4 * z]]);
      g.fillStyle = C('#6b4f3a'); g.font = `700 ${4 * z}px system-ui`; g.fillText('🏛️ Bauplan', s[0] - 8 * z, s[1] - 2.6 * z);
    }],
    ['Rohbau mit Gerüst (Abschnitt 2)', 2, 'gras', (cx, cy, z) => {
      shadow(cx, cy, 40, z);
      box(cx, cy, 30 * z, 15 * z, 4 * z, STONE_D, null, 0); box(cx, cy - 4 * z, 20 * z, 10 * z, 5 * z, STONE, null, 0);
      const b = cy - 9 * z, t = cy - 46 * z;
      poly([[cx - 7 * z, b], [cx, b + 3.5 * z], [cx, t + 2.4 * z], [cx - 5.6 * z, t]], C('#efe2c4'));
      poly([[cx, b + 3.5 * z], [cx + 7 * z, b], [cx + 5.6 * z, t], [cx, t + 2.4 * z]], C('#d8c6a0'));
      scaffold(cx, b, z, 46 * z);
      line('#e8a33a', 1.4, z, [[cx + 26 * z, cy + 6 * z], [cx + 26 * z, cy - 70 * z]]); line('#e8a33a', 1.4, z, [[cx + 26 * z, cy - 70 * z], [cx - 6 * z, cy - 70 * z]]);   // Kran
      line('#6b4f3a', 0.5, z, [[cx - 2 * z, cy - 70 * z], [cx - 2 * z, cy - 56 * z]]); box(cx - 2 * z, cy - 52 * z, 3 * z, 1.5 * z, 4 * z, STONE, null, 0);
      lion(cx - 30 * z, cy + 8 * z, z, 1);
    }],
    ['Fertig (Abschnitt 3)', 2, 'gras', M[0][3]],
  ];

  // Grundfläche n × n (Einheit z = Pixel je Einheit): Gras, Wasser, Weg (Streifen hindurch), Platz
  function ground(cx, cy, n, z, kind) {
    const a = 32 * n * z, b = 16 * n * z;
    diamond(cx, cy, a, b, kind === 'wasser' ? (night ? '#2c4f7a' : '#7fc6e8') : night ? '#33405e' : '#b4dd8c');
    if (kind === 'weg') poly([[cx - a * 0.75, cy - b * 0.25], [cx - a * 0.25, cy - b * 0.75], [cx + a * 0.75, cy + b * 0.25], [cx + a * 0.25, cy + b * 0.75]], night ? '#4a5470' : '#e8dcc0');
    if (kind === 'platz') diamond(cx, cy, a * 0.92, b * 0.92, night ? '#4a5470' : '#e8dcc0');
  }
  window.monumenteEntwurf = async (opts = {}) => {
    const DW = 330, DH = 330, NW = 150, NH = 170, W = DW + 8 + NW, H = DH, cols = opts.cols || 3, shots = [], list = opts.list || M;
    const gq = glowQuad, n0 = night, prevG = g, glows = [];
    glowQuad = (pts, r, tint) => { const m = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]); glows.push([m[0], m[1], r, tint === 'blue' ? '140,190,255' : '255,200,110']); };
    try {
      for (const [label, n, kind, fn] of list) {
        const c = document.createElement('canvas'); c.width = W; c.height = H; const cx = c.getContext('2d');
        cx.fillStyle = '#fffaf0'; cx.fillRect(0, 0, W, H);
        for (const nightOn of [false, true]) {
          g = ctx; night = nightOn ? 1 : 0;
          ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          const w = nightOn ? NW : DW, h = nightOn ? NH : DH, z = (n === 3 ? 1.05 : 1.6) * (nightOn ? 0.42 : 1), X0 = nightOn ? DW + 8 : 0, Y0 = nightOn ? H - NH : 0;
          ctx.fillStyle = nightOn ? '#1f2846' : '#9fd27a'; ctx.fillRect(0, 0, w, h);
          const gx = w / 2, gy = h - 16 * n * z - (nightOn ? 8 : 16);
          ground(gx, gy, n, z, kind);
          fn(gx, gy, z);
          ctx.globalCompositeOperation = 'lighter';
          for (const [x, y, r, col] of glows.splice(0)) { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.45)`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
          ctx.globalCompositeOperation = 'source-over';
          cx.drawImage(canvas, 0, 0, w * DPR, h * DPR, X0, Y0, w, h);
          ctx.restore();
        }
        shots.push([c, label]);
      }
    } finally { glowQuad = gq; night = n0; g = prevG; }
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 14); sheet.height = rows * (H + 36);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 14), Y = Math.floor(i / cols) * (H + 36) + 28; sx.drawImage(c, X, Y); sx.font = '700 18px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${i + 1} · ${l}`, X + 4, Y - 8); });
    window.__monu = sheet.toDataURL('image/png');
    window.__monuShots = shots.map(([c]) => c.toDataURL('image/png'));
    return [sheet.width, sheet.height];
  };
  return 'ok';
})();
