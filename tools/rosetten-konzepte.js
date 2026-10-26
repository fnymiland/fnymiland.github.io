// Entwurf (Nutzer 26.10.2026: „mir hat Rosette gefallen … als Basis für deine Entwürfe“ – pro Stufe krasser, funkelnder, farbiger).
// Acht Rosetten-Konzepte, je fünf Stufen. Im Spiel laden, dann RS_SHEET(0) / RS_SHEET(1), RS_SHEET(null) schließt; RS_IMG(k, n).
(() => {
  const S = 3, CW = 96, CH = 118, CX = 48, CY = 46;
  const lin = (x, x0, y0, x1, y1, stops) => { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const starPath = (x, cx, cy, R, k = 0.46) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * k : R; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); };
  const star = (x, cx, cy, R, [fill, edge, hi] = ['#f6c444', '#a8700f', '#fff0b0']) => {
    x.fillStyle = edge; starPath(x, cx, cy + R * 0.14, R); x.fill(); x.fillStyle = fill; starPath(x, cx, cy, R); x.fill();
    x.fillStyle = hi; starPath(x, cx - R * 0.12, cy - R * 0.12, R * 0.42); x.fill();
  };
  const glint = (x, cx, cy, r) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.7); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 1.7, 0, 7); x.fill();
    x.fillStyle = '#fffbe6'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, q = i % 2 ? r * 0.24 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill();
  };
  const gem = (x, cx, cy, r, col) => {
    x.fillStyle = shade(col, -0.35); x.beginPath(); x.arc(cx, cy + 0.6, r, 0, 7); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.25, 0, 7); x.fill();
  };
  const halo = (x, cx, cy, r, col) => { const g = x.createRadialGradient(cx, cy, r * 0.35, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
  const rays = (x, cx, cy, r0, r1, n, col) => { x.fillStyle = col; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = Math.PI / n * 0.5; x.beginPath(); x.moveTo(cx + Math.cos(a - d) * r0, cy + Math.sin(a - d) * r0); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.lineTo(cx + Math.cos(a + d) * r0, cy + Math.sin(a + d) * r0); x.closePath(); x.fill(); } };
  const crown = (x, cx, cy, s, gems) => {
    for (const [col, dy] of [['#a8700f', 1], ['#f2c14a', 0]]) { x.fillStyle = col; x.beginPath(); x.moveTo(cx - 10 * s, cy + dy); x.lineTo(cx - 10 * s, cy - 8 * s + dy); x.lineTo(cx - 5 * s, cy - 3 * s + dy); x.lineTo(cx, cy - 11 * s + dy); x.lineTo(cx + 5 * s, cy - 3 * s + dy); x.lineTo(cx + 10 * s, cy - 8 * s + dy); x.lineTo(cx + 10 * s, cy + dy); x.closePath(); x.fill(); }
    for (const px of [-10, 0, 10]) { x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(cx + px * s, cy - (px ? 8 : 11) * s, 1.4 * s, 0, 7); x.fill(); }
    if (gems) { gem(x, cx, cy - 3 * s, 2 * s, '#e0405a'); gem(x, cx - 6 * s, cy - 2.4 * s, 1.4 * s, '#3f7fe0'); gem(x, cx + 6 * s, cy - 2.4 * s, 1.4 * s, '#3fbf7f'); }
  };
  const leafRing = (x, cx, cy, r, col) => { for (let i = 0; i < 18; i++) { const a = Math.PI * 0.62 + i / 17 * Math.PI * 1.76; x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.rotate(a + Math.PI / 2 + (i % 2 ? 0.5 : -0.5)); x.fillStyle = i % 2 ? col : shade(col, 0.2); x.beginPath(); x.ellipse(0, 0, 2.6, 6, 0, 0, 7); x.fill(); x.restore(); } };
  // Bänder: Liste [farbe, winkel, länge]; jedes Band mit Schwalbenschwanz
  const tails = (x, list) => { for (const [col, ang, len] of list) { x.save(); x.translate(CX, CY + 6); x.rotate(ang); const w = 7;
    x.fillStyle = shade(col, -0.25); x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(-w / 2 + 0.5, len); x.lineTo(0, len - 5); x.lineTo(w / 2 + 0.5, len); x.lineTo(w / 2, 0); x.closePath(); x.fill();
    x.fillStyle = col; x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(-w / 2, len - 1.5); x.lineTo(0, len - 6); x.lineTo(w / 2 - 1.5, len - 1); x.lineTo(w / 2 - 1.5, 0); x.closePath(); x.fill(); x.restore(); } };
  const petals = (x, r, count, size, cols) => { for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2; x.fillStyle = shade(cols[i % cols.length], -0.25); x.beginPath(); x.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r + 0.8, size, 0, 7); x.fill(); }
    for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2; x.fillStyle = cols[i % cols.length]; x.beginPath(); x.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r, size, 0, 7); x.fill(); } };
  const disc = (x, r, rim, face) => {
    x.fillStyle = shade(rim[rim.length - 1], -0.25); x.beginPath(); x.arc(CX, CY + 1.2, r, 0, 7); x.fill();
    x.fillStyle = lin(x, 0, CY - r, 0, CY + r, rim); x.beginPath(); x.arc(CX, CY, r, 0, 7); x.fill();
    x.fillStyle = typeof face === 'function' ? face() : lin(x, 0, CY - r, 0, CY + r, face); x.beginPath(); x.arc(CX, CY, r - 2.6, 0, 7); x.fill();
  };
  const innerStars = (x, n, r, cols) => { const k = r / 15, P = { 1: [[0, 0, 8.5]], 2: [[-5.5, 0, 5.6], [5.5, 0, 5.6]], 3: [[0, -4.8, 5], [-5.4, 3.8, 5], [5.4, 3.8, 5]],
    4: [[-4.8, -4.8, 4.4], [4.8, -4.8, 4.4], [-4.8, 4.8, 4.4], [4.8, 4.8, 4.4]], 5: [[0, -6.4, 4], [-6.2, -1.6, 4], [6.2, -1.6, 4], [-3.8, 5.6, 4], [3.8, 5.6, 4]] }[n];
    for (const [dx, dy, s] of P) star(x, CX + dx * k, CY + dy * k, s * k, cols); };
  const gloss = (x, r) => { x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.ellipse(CX - r * 0.3, CY - r * 0.42, r * 0.45, r * 0.2, -0.5, 0, 7); x.fill(); };
  const sparkle = (x, k) => { const P = [[CX - 30, CY - 22, 5], [CX + 31, CY - 14, 5.5], [CX + 26, CY + 26, 4.5], [CX - 28, CY + 20, 4], [CX + 6, CY - 38, 4], [CX - 14, CY - 37, 3.2]]; for (let i = 0; i < Math.min(k, P.length); i++) glint(x, ...P[i]); };
  const mk = f => { const c = document.createElement('canvas'); c.width = CW * S; c.height = CH * S; const x = c.getContext('2d'); x.scale(S, S); f(x); return c.toDataURL(); };
  const RB = ['#ff7a8a', '#ffb347', '#ffe066', '#7ed38a', '#6aa8f0', '#a98cf0'];
  const GOLD = ['#fff0a8', '#e8b43a', '#a8700f'];

  const K = [
    { name: '1 Farbe je Stufe', sub: 'Grün · Blau · Lila · Rubin · Gold mit Glanz und Glitzer', f: n => mk(x => {
      const c = ['#5fae6a', '#4f86d9', '#8a5fd6', '#d9445a', '#f2b93a'][n - 1], c2 = shade(c, 0.3), len = 34 + n * 4;
      if (n >= 4) halo(x, CX, CY, 46, n === 5 ? 'rgba(255,215,120,.8)' : 'rgba(255,160,170,.55)');
      tails(x, [[c, 0.32, len], [shade(c, -0.1), -0.32, len]]);
      petals(x, 19, 16, 6.2, [c, c2]); if (n === 5) petals(x, 15, 12, 4.4, ['#ffffff', '#fff3c4']);
      disc(x, 15.5, GOLD, n === 5 ? ['#fff3c4', '#f2c14a'] : ['#33407a', '#1d2550']); innerStars(x, n, 15.5, n === 5 ? ['#ffffff', '#c98f1e', '#ffffff'] : undefined); gloss(x, 15.5);
      sparkle(x, n - 1);
    }) },
    { name: '2 Blütenkränze', sub: 'ein Kranz · zwei · drei · bunter · Regenbogen', f: n => mk(x => {
      const rings = n === 1 ? [[19, 16, 6.2, ['#4f86d9', '#7fa6ea']]] : n <= 3 ? [[23, 20, 6, n === 3 ? ['#8a5fd6', '#b494ef'] : ['#3f6fc0', '#5b86d9']], [18, 16, 5.6, ['#7fa6ea', '#a9c4f5']]]
        : [[27, 24, 6, n === 5 ? RB : ['#d9445a', '#ff7a8a']], [22, 20, 5.6, n === 5 ? RB.slice().reverse() : ['#f2b93a', '#ffd86a']], [17.5, 16, 5, n === 5 ? ['#ffffff', '#fff3c4'] : ['#4f86d9', '#7fa6ea']]];
      if (n >= 4) halo(x, CX, CY, 50, 'rgba(255,220,140,.7)');
      tails(x, [['#3f6fc0', 0.32, 40 + n * 3], ['#5b86d9', -0.32, 40 + n * 3]]);
      for (const [r, cnt, s, cols] of rings) petals(x, r, cnt, s, cols);
      disc(x, 15, GOLD, ['#33407a', '#1d2550']); innerStars(x, n, 15); gloss(x, 15); sparkle(x, n - 1);
    }) },
    { name: '3 Edelmetall-Mitte', sub: 'Bronze · Silber · Gold · Platin mit Saphiren · Opal', f: n => mk(x => {
      const rim = [['#f0b98a', '#b06a35', '#7a4420'], ['#ffffff', '#c3cad6', '#8a93a3'], GOLD, ['#ffffff', '#dfe6f5', '#a9b6d4'], ['#ffd0e0', '#fff0b0', '#c8f5d8', '#c4e4ff']][n - 1];
      const sc = [['#e8a070', '#8a4a20', '#ffd2b0'], ['#eef2f8', '#8a93a3', '#ffffff'], undefined, undefined, undefined][n - 1];
      if (n === 5) halo(x, CX, CY, 48, 'rgba(255,210,250,.75)');
      tails(x, [['#2f4a9e', 0.32, 42], ['#4867c2', -0.32, 42]]);
      petals(x, 19, 16, 6.2, ['#5b7bd6', '#8aa6ea']);
      disc(x, 16, rim, n === 5 ? ['#2b2350', '#120c2a'] : ['#33407a', '#1d2550']); innerStars(x, n, 16, sc); gloss(x, 16);
      if (n >= 4) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; gem(x, CX + Math.cos(a) * 14.6, CY + Math.sin(a) * 14.6, 1.6, n === 5 ? RB[i % 6] : '#3f6fe8'); }
      sparkle(x, n >= 4 ? n : 0);
    }) },
    { name: '4 Sternenkranz (gut lesbar)', sub: 'Sterne außen im Bogen, groß; in der Mitte deine Insel', f: n => mk(x => {
      const c = ['#5fae6a', '#4f86d9', '#8a5fd6', '#d9445a', '#f2b93a'][n - 1];
      if (n >= 4) halo(x, CX, CY, 48, 'rgba(255,215,120,.7)');
      tails(x, [[c, 0.3, 40], [shade(c, -0.1), -0.3, 40]]);
      petals(x, 19, 16, 6.2, [c, shade(c, 0.3)]);
      disc(x, 15, GOLD, () => lin(x, 0, CY - 13, 0, CY + 13, ['#9fd8f5', '#4fa3d9']));
      x.fillStyle = '#6fbf5a'; x.beginPath(); x.ellipse(CX, CY + 4, 9, 4.5, 0, Math.PI, 0); x.fill(); x.fillStyle = '#e8d49a'; x.beginPath(); x.ellipse(CX, CY + 4.2, 10, 2, 0, 0, 7); x.fill();
      x.strokeStyle = '#8a5a34'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(CX + 2, CY + 2); x.quadraticCurveTo(CX + 3, CY - 4, CX + 1, CY - 7); x.stroke();
      for (const a of [-2.6, -1.9, -1.2, -0.5]) { x.fillStyle = '#4f9a3a'; x.save(); x.translate(CX + 1, CY - 7); x.rotate(a); x.beginPath(); x.ellipse(4, 0, 4.5, 1.6, 0, 0, 7); x.fill(); x.restore(); }
      gloss(x, 15);
      for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1), a = Math.PI * (1.15 + t * 0.7); star(x, CX + Math.cos(a) * 27, CY + Math.sin(a) * 27, 7.2); }
      sparkle(x, Math.max(0, n - 2));
    }) },
    { name: '5 Krone und Strahlen', sub: 'schlicht · Perlenrand · Lorbeer · Krone · Strahlenkranz mit Edelsteinen', f: n => mk(x => {
      if (n >= 5) { rays(x, CX, CY, 26, 46, 20, 'rgba(255,214,110,.6)'); halo(x, CX, CY, 46, 'rgba(255,230,150,.75)'); }
      if (n >= 3) leafRing(x, CX, CY, 25, '#5f9a3a');
      tails(x, [['#2f4a9e', 0.32, 42], ['#4867c2', -0.32, 42]]);
      petals(x, 19, 16, 6.2, ['#5b7bd6', '#8aa6ea']);
      if (n >= 2) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(CX + Math.cos(a) * 24.5, CY + Math.sin(a) * 24.5, 1.3, 0, 7); x.fill(); }
      disc(x, 15.5, GOLD, ['#33407a', '#1d2550']); innerStars(x, n, 15.5); gloss(x, 15.5);
      if (n >= 4) crown(x, CX, CY - 22, 1.05, n >= 5);
      sparkle(x, n >= 4 ? 6 : 0);
    }) },
    { name: '6 Bänderfächer', sub: 'jede Stufe ein Band mehr, immer bunter', f: n => mk(x => {
      const cols = ['#4f86d9', '#d9445a', '#f2b93a', '#5fae6a', '#a98cf0', '#ff9a5a'], k = n + 1, list = [];
      for (let i = 0; i < k; i++) { const t = k === 1 ? 0.5 : i / (k - 1); list.push([cols[i], (0.5 - t) * (0.35 + k * 0.12), 38 + (i % 2) * 6]); }
      if (n >= 4) halo(x, CX, CY, 48, 'rgba(255,215,130,.7)');
      tails(x, list);
      petals(x, 19, 16, 6.2, n >= 3 ? RB.slice(0, Math.min(6, n + 1)) : ['#ffffff', '#e9eef8']);
      disc(x, 15.5, GOLD, ['#33407a', '#1d2550']); innerStars(x, n, 15.5); gloss(x, 15.5); sparkle(x, n - 1);
    }) },
    { name: '7 Mit Ehrentitel', sub: 'Schleife über den Bändern: Hübsch · Beliebt · Berühmt · Prächtig · Legendär', f: n => mk(x => {
      const c = ['#5fae6a', '#4f86d9', '#8a5fd6', '#d9445a', '#e8b43a'][n - 1], t = ['Hübsch', 'Beliebt', 'Berühmt', 'Prächtig', 'Legendär'][n - 1];
      if (n >= 4) halo(x, CX, CY, 46, 'rgba(255,215,120,.7)');
      tails(x, [['#2f4a9e', 0.32, 44], ['#4867c2', -0.32, 44]]);
      petals(x, 19, 16, 6.2, ['#5b7bd6', '#8aa6ea']);
      disc(x, 15.5, GOLD, ['#33407a', '#1d2550']); innerStars(x, n, 15.5); gloss(x, 15.5);
      const by = CY + 30, bw = 62;
      x.fillStyle = shade(c, -0.3); for (const s of [-1, 1]) { const ex = CX + s * bw / 2; x.beginPath(); x.moveTo(ex, by + 2); x.lineTo(ex + s * 8, by + 2); x.lineTo(ex + s * 4.5, by + 8); x.lineTo(ex + s * 8, by + 14); x.lineTo(ex, by + 14); x.closePath(); x.fill(); }
      x.fillStyle = c; x.beginPath(); x.roundRect(CX - bw / 2, by, bw, 14, 3); x.fill();
      x.fillStyle = '#fff'; x.font = `800 9px ${getComputedStyle(document.body).getPropertyValue('--font') || 'sans-serif'}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t.toUpperCase(), CX, by + 7.5);
      sparkle(x, Math.max(0, n - 2));
    }) },
    { name: '8 Nachthimmel', sub: 'Sternenhimmel in der Mitte · Mond · Polarlicht-Blätter · goldene Spitzen · Sternschnuppe', f: n => mk(x => {
      if (n >= 5) halo(x, CX, CY, 50, 'rgba(160,190,255,.8)');
      tails(x, [['#2a2f6a', 0.32, 42], ['#3c4590', -0.32, 42]]);
      petals(x, 19, 16, 6.2, n >= 3 ? ['#3c4590', n >= 4 ? '#5fd0a8' : '#6a5fc0', '#2a2f6a', n >= 4 ? '#e07ac8' : '#6a5fc0'] : ['#2a2f6a', '#3c4590']);
      if (n >= 5) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; x.fillStyle = '#f2c14a'; x.beginPath(); x.arc(CX + Math.cos(a) * 24, CY + Math.sin(a) * 24, 1.8, 0, 7); x.fill(); }
      disc(x, 15.5, n >= 3 ? GOLD : ['#c7cfe6', '#8d97b8', '#5b6488'], ['#25306a', '#0d1236']);
      for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(CX - 11 + (i * 7.3 % 22), CY - 11 + (i * 5.9 % 22), i % 4 ? 0.4 : 0.8, 0, 7); x.fill(); }
      if (n >= 2) { x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(CX - 8, CY - 7, 3.4, 0, 7); x.fill(); x.fillStyle = '#1a2152'; x.beginPath(); x.arc(CX - 6.5, CY - 8, 3, 0, 7); x.fill(); }
      innerStars(x, n, 13.5); gloss(x, 15.5);
      if (n >= 5) { x.strokeStyle = 'rgba(255,240,190,.9)'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(CX + 8, CY - 40); x.lineTo(CX + 30, CY - 26); x.stroke(); glint(x, CX + 31, CY - 25, 5); }
      sparkle(x, n >= 3 ? n - 1 : 0);
    }) },
  ];
  const cache = {};
  window.RS_IMG = (k, n) => cache[k + ':' + n] ||= K[k].f(n);
  window.RS_SHEET = (page, h = 104) => {
    let el = document.getElementById('rs-sheet'); if (el) el.remove();
    if (page == null) return 'aus';
    el = document.createElement('div'); el.id = 'rs-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:8px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24';
    const ks = [0, 1, 2, 3].map(i => page * 4 + i).filter(i => i < K.length);
    el.innerHTML = ks.map(k => `<div>${K[k].name} <span style="font-weight:500;font-size:12px;color:#8a6a4a">${K[k].sub}</span></div>
      <div style="display:flex;align-items:center;gap:30px;margin:0 0 4px 6px">${[1, 2, 3, 4, 5].map(n => `<img src="${RS_IMG(k, n)}" style="height:${h}px">`).join('')}</div>`).join('');
    document.body.append(el);
    return ks.map(k => K[k].name).join(', ');
  };
})();
