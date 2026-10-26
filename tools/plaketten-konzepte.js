// Entwurf (Nutzer 26.10.2026: „Plakette ist auf jeden Fall die Richtung, aber die muss schon besonderer aussehen, pro Stufe krasser,
// funkelnder, farbiger … gib mir ganz viele Konzepte“). Acht Konzepte, je fünf Stufen. Im Spiel laden, dann PK_SHEET(0) bzw. PK_SHEET(1)
// (je vier Konzepte groß), PK_SHEET(null) schließt. PK_IMG(konzept, n) liefert das Bild (für spätere Proben in der Leiste).
(() => {
  const S = 3, M = 16, H = 34, TOP = 20;                                     // Rand für Schmuck, Plattenhöhe, Platte ab y
  const rr = (x, X, Y, W, h, R) => { x.beginPath(); x.roundRect(X, Y, W, h, R); };
  const lin = (x, y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const linX = (x, x0, x1, stops) => { const g = x.createLinearGradient(x0, 0, x1, 0); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const starPath = (x, cx, cy, R, k = 0.46) => { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? R * k : R; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); };
  const star = (x, cx, cy, R, [fill, edge, hi] = ['#f6c444', '#a8700f', '#fff0b0']) => {
    x.fillStyle = edge; starPath(x, cx, cy + R * 0.13, R); x.fill();
    x.fillStyle = fill; starPath(x, cx, cy, R); x.fill();
    x.fillStyle = hi; starPath(x, cx - R * 0.12, cy - R * 0.12, R * 0.42); x.fill();
  };
  const glint = (x, cx, cy, r, col = '#fffbe6') => {                         // Funkeln: vierzackig mit Schein
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 1.6, 0, Math.PI * 2); x.fill();
    x.fillStyle = col; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.22, cy - r * 0.22); x.lineTo(cx + r, cy); x.lineTo(cx + r * 0.22, cy + r * 0.22);
    x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.22, cy + r * 0.22); x.lineTo(cx - r, cy); x.lineTo(cx - r * 0.22, cy - r * 0.22); x.closePath(); x.fill();
  };
  const gem = (x, cx, cy, r, col) => {                                      // geschliffener Stein
    x.fillStyle = shade(col, -0.35); x.beginPath(); x.arc(cx, cy + 0.6, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = shade(col, 0.35); x.beginPath(); x.moveTo(cx - r * 0.6, cy - r * 0.1); x.lineTo(cx, cy - r * 0.75); x.lineTo(cx + r * 0.2, cy - r * 0.2); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2); x.fill();
  };
  const halo = (x, cx, cy, rx, ry, col) => { x.save(); x.translate(cx, cy); x.scale(1, ry / rx); const g = x.createRadialGradient(0, 0, rx * 0.3, 0, 0, rx); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore(); };
  const rays = (x, cx, cy, r0, r1, n, col) => { x.fillStyle = col; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = Math.PI / n * 0.45; x.beginPath(); x.moveTo(cx + Math.cos(a - d) * r0, cy + Math.sin(a - d) * r0 * 0.6); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.6); x.lineTo(cx + Math.cos(a + d) * r0, cy + Math.sin(a + d) * r0 * 0.6); x.closePath(); x.fill(); } };
  const leaf = (x, cx, cy, ang, len, col) => { x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = col; x.beginPath(); x.ellipse(len / 2, 0, len / 2, len / 5, 0, 0, Math.PI * 2); x.fill(); x.restore(); };
  const laurel = (x, cx, cy, side, col) => { for (let i = 0; i < 5; i++) { const t = i / 4; leaf(x, cx + side * (2 + t * 4), cy + 14 - t * 24, side > 0 ? -0.9 + t * 0.3 : Math.PI + 0.9 - t * 0.3, 8, i % 2 ? col : shade(col, 0.18)); } };
  const crown = (x, cx, cy, s, col, gems) => {
    x.fillStyle = shade(col, -0.3); x.beginPath(); x.moveTo(cx - 9 * s, cy + 1); x.lineTo(cx - 9 * s, cy - 6 * s); x.lineTo(cx - 4.5 * s, cy - 2 * s); x.lineTo(cx, cy - 9 * s); x.lineTo(cx + 4.5 * s, cy - 2 * s); x.lineTo(cx + 9 * s, cy - 6 * s); x.lineTo(cx + 9 * s, cy + 1); x.closePath(); x.fill();
    x.fillStyle = col; x.beginPath(); x.moveTo(cx - 9 * s, cy); x.lineTo(cx - 9 * s, cy - 7 * s); x.lineTo(cx - 4.5 * s, cy - 3 * s); x.lineTo(cx, cy - 10 * s); x.lineTo(cx + 4.5 * s, cy - 3 * s); x.lineTo(cx + 9 * s, cy - 7 * s); x.lineTo(cx + 9 * s, cy); x.closePath(); x.fill();
    if (gems) { gem(x, cx, cy - 2.5 * s, 1.8 * s, '#e0405a'); gem(x, cx - 6 * s, cy - 2 * s, 1.3 * s, '#3f7fe0'); gem(x, cx + 6 * s, cy - 2 * s, 1.3 * s, '#3fbf7f'); }
  };
  // Grundplatte: Rand (Verlauf), Innenfläche (Verlauf oder Funktion), Sterne, Glanz
  const plate = (x, W, n, o) => {
    const X = M, Y = TOP, R = o.r ?? 8;
    if (o.under) o.under(X, Y, W);
    rr(x, X, Y + 2, W, H, R); x.fillStyle = o.shadow || 'rgba(60,40,10,.35)'; x.fill();
    rr(x, X, Y, W, H, R); x.fillStyle = typeof o.rim === 'function' ? o.rim(X, Y, W) : lin(x, Y, Y + H, o.rim); x.fill();
    const b = o.border ?? 3;
    rr(x, X + b, Y + b, W - 2 * b, H - 2 * b, Math.max(2, R - b)); x.fillStyle = typeof o.face === 'function' ? o.face(X + b, Y + b, W - 2 * b, H - 2 * b) : lin(x, Y, Y + H, o.face); x.fill();
    if (o.deco) { x.save(); rr(x, X + b, Y + b, W - 2 * b, H - 2 * b, Math.max(2, R - b)); x.clip(); o.deco(X + b, Y + b, W - 2 * b, H - 2 * b); x.restore(); }
    if (o.line) { x.strokeStyle = o.line; x.lineWidth = 0.9; rr(x, X + b + 2, Y + b + 2, W - 2 * b - 4, H - 2 * b - 4, Math.max(1.5, R - b - 2)); x.stroke(); }
    const s = o.star ?? 15, gap = 3, w0 = n * s + (n - 1) * gap;
    for (let i = 0; i < n; i++) star(x, X + W / 2 - w0 / 2 + s / 2 + i * (s + gap), Y + H / 2 + 0.5, s / 2, o.starCols);
    x.fillStyle = 'rgba(255,255,255,.16)'; rr(x, X + b + 1, Y + b + 1, W - 2 * b - 2, (H - 2 * b) / 2 - 1, Math.max(2, R - b - 1)); x.fill();
    if (o.over) o.over(X, Y, W);
  };
  const widthFor = (n, o = {}) => { const s = o.star ?? 15; return (o.pad ?? 12) * 2 + n * s + (n - 1) * 3; };
  const draw = (n, o, extraW = 0) => {
    const W = widthFor(n, o) + extraW, cw = W + 2 * M, ch = TOP + H + (o.below ?? 16);
    const c = document.createElement('canvas'); c.width = cw * S; c.height = ch * S; const x = c.getContext('2d'); x.scale(S, S);
    o.ctx = x; plate(x, W, n, o); return c.toDataURL();
  };
  const sparkles = (x, X, Y, W, k) => { const P = [[X - 4, Y + 2, 5], [X + W + 4, Y + H - 4, 5.5], [X + W * 0.3, Y - 6, 4], [X + W * 0.75, Y + H + 6, 4.5], [X + W + 6, Y - 2, 3.5], [X - 6, Y + H + 3, 3.5]]; for (let i = 0; i < Math.min(k, P.length); i++) glint(x, ...P[i]); };

  const K = [
    { name: '1 Edelmetalle', sub: 'Bronze · Silber · Gold · Platin mit Saphiren · Opal', f: n => {
      const T = [
        { rim: ['#f0b98a', '#b06a35', '#7a4420'], face: ['#5a3a2a', '#3a2418'], starCols: ['#e8a070', '#8a4a20', '#ffd2b0'] },
        { rim: ['#ffffff', '#c3cad6', '#8a93a3'], face: ['#4a5470', '#2c3348'], starCols: ['#eef2f8', '#8a93a3', '#ffffff'] },
        { rim: ['#fff0a8', '#e8b43a', '#a8700f'], face: ['#41549c', '#232d5c'] },
        { rim: ['#ffffff', '#dfe6f5', '#a9b6d4'], face: ['#2a3f8f', '#14204f'], over: (X, Y, W) => { gem(o.ctx, X + 6, Y + H / 2, 3.2, '#3f6fe8'); gem(o.ctx, X + W - 6, Y + H / 2, 3.2, '#3f6fe8'); } },
        { rim: (X, Y, W) => linX(o.ctx, X, X + W, ['#ffb3c7', '#ffe08a', '#a8f0c8', '#9fd0ff', '#d3b0ff', '#ffb3c7']), face: ['#2b2350', '#120c2a'],
          under: (X, Y, W) => halo(o.ctx, X + W / 2, Y + H / 2, W * 0.75, 40, 'rgba(255,220,250,.75)'),
          over: (X, Y, W) => { for (const gx of [X + 6, X + W - 6]) gem(o.ctx, gx, Y + H / 2, 3.4, '#e86fd0'); sparkles(o.ctx, X, Y, W, 5); } },
      ];
      const o = { ...T[n - 1], border: n >= 4 ? 4 : 3, line: n >= 3 ? 'rgba(255,230,160,.6)' : null, pad: n >= 4 ? 16 : 12 }; return draw(n, o);
    } },
    { name: '2 Emaillefarben', sub: 'Moosgrün · Himmelblau · Königslila · Rubin · Nachtschwarz mit Goldglitzer', f: n => {
      const F = [['#5aa069', '#2f6a3e'], ['#5b92e0', '#2c5bb0'], ['#8a5fd6', '#4d2c9a'], ['#e05068', '#8f1c34'], ['#2a2440', '#0e0b1a']][n - 1];
      const o = { rim: ['#fff0a8', '#e8b43a', '#a8700f'], face: F, border: 2 + Math.ceil(n / 2), line: 'rgba(255,230,160,.65)', pad: 12 + n,
        deco: n === 5 ? (X, Y, W, h) => { for (let i = 0; i < 70; i++) { o.ctx.fillStyle = i % 3 ? 'rgba(255,215,110,.85)' : 'rgba(255,255,255,.9)'; o.ctx.beginPath(); o.ctx.arc(X + (i * 37.7 % W), Y + (i * 13.3 % h), i % 4 ? 0.5 : 0.9, 0, Math.PI * 2); o.ctx.fill(); } } : null,
        under: n >= 4 ? (X, Y, W) => halo(o.ctx, X + W / 2, Y + H / 2, W * 0.7, 36, n === 5 ? 'rgba(255,210,120,.7)' : 'rgba(255,170,180,.5)') : null,
        over: (X, Y, W) => sparkles(o.ctx, X, Y, W, n - 1) };
      return draw(n, o);
    } },
    { name: '3 Ornamente wachsen', sub: 'Nieten · Ranken · Lorbeer · Krone · Strahlenkranz mit Edelsteinen', f: n => {
      const o = { rim: ['#fff0a8', '#e8b43a', '#a8700f'], face: ['#41549c', '#232d5c'], line: 'rgba(255,230,160,.6)', pad: 14, below: 18,
        under: (X, Y, W) => { if (n >= 5) { rays(o.ctx, X + W / 2, Y + H / 2, W * 0.45, W * 0.75, 18, 'rgba(255,214,110,.55)'); halo(o.ctx, X + W / 2, Y + H / 2, W * 0.7, 40, 'rgba(255,230,150,.6)'); }
          if (n >= 3) { laurel(o.ctx, X - 1, Y + H / 2, -1, '#5f9a3a'); laurel(o.ctx, X + W + 1, Y + H / 2, 1, '#5f9a3a'); } },
        over: (X, Y, W) => { const x = o.ctx;
          for (const [px, py] of [[X + 5, Y + 5], [X + W - 5, Y + 5], [X + 5, Y + H - 5], [X + W - 5, Y + H - 5]]) { x.fillStyle = '#a8700f'; x.beginPath(); x.arc(px, py + 0.4, 1.7, 0, 7); x.fill(); x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(px, py, 1.4, 0, 7); x.fill(); }
          if (n >= 2) { x.strokeStyle = '#e8b43a'; x.lineWidth = 1.6; for (const s of [-1, 1]) { const cx = X + W / 2 + s * (W / 2 - 1); x.beginPath(); x.moveTo(cx, Y + H / 2 - 7); x.quadraticCurveTo(cx + s * 7, Y + H / 2, cx, Y + H / 2 + 7); x.stroke(); } }
          if (n >= 4) crown(x, X + W / 2, Y + 1, 1.15, '#f2c14a', n >= 5);
          if (n >= 5) sparkles(x, X, Y, W, 6); } };
      return draw(n, o);
    } },
    { name: '4 Nachthimmel', sub: 'Sternenhimmel · Mond · Milchstraße · Polarlicht · Sternschnuppe mit Schein', f: n => {
      const o = { rim: n >= 5 ? ['#fff0a8', '#e8b43a', '#a8700f'] : ['#c7cfe6', '#8d97b8', '#5b6488'], face: ['#25306a', '#0d1236'], pad: 14 + (n >= 2 ? 6 : 0), border: n >= 5 ? 4 : 3,
        deco: (X, Y, W, h) => { const x = o.ctx;
          for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(X + (i * 23.3 % W), Y + (i * 11.7 % h), i % 5 ? 0.45 : 0.85, 0, 7); x.fill(); }
          if (n >= 3) { x.save(); x.translate(X + W / 2, Y + h / 2); x.rotate(-0.35); halo(x, 0, 0, W * 0.6, 7, 'rgba(220,225,255,.45)'); x.restore(); }
          if (n >= 4) { for (const [c, dy] of [['rgba(90,240,170,.45)', 4], ['rgba(240,120,220,.35)', 9]]) { x.strokeStyle = c; x.lineWidth = 4; x.beginPath(); for (let t = 0; t <= W; t += 3) x.lineTo(X + t, Y + dy + Math.sin(t / 9) * 2.5); x.stroke(); } }
          if (n >= 2) { x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(X + 9, Y + h / 2, 5, 0, 7); x.fill(); x.fillStyle = shade('#25306a', -0.1); x.beginPath(); x.arc(X + 11.5, Y + h / 2 - 1.5, 4.3, 0, 7); x.fill(); } },
        under: n >= 5 ? (X, Y, W) => halo(o.ctx, X + W / 2, Y + H / 2, W * 0.75, 40, 'rgba(160,190,255,.7)') : null,
        over: n >= 5 ? (X, Y, W) => { const x = o.ctx; x.strokeStyle = 'rgba(255,240,190,.9)'; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.moveTo(X + W - 30, Y - 12); x.lineTo(X + W + 2, Y - 2); x.stroke(); glint(x, X + W + 3, Y - 2, 5); sparkles(x, X, Y, W, 4); } : null };
      return draw(n, o);
    } },
    { name: '5 Vom Holz zum Gold', sub: 'Holzschild · mit Messingecken · Messing · Silber mit Gravur · Gold mit Juwelen', f: n => {
      const wood = (X, Y, W, h) => { const x = o.ctx; x.fillStyle = lin(x, Y, Y + h, ['#c99a5e', '#a8763f']); x.fillRect(X, Y, W, h); x.strokeStyle = 'rgba(110,70,30,.35)'; x.lineWidth = 0.8; for (const yy of [6, 13, 21]) { x.beginPath(); x.moveTo(X, Y + yy); x.bezierCurveTo(X + W * 0.3, Y + yy - 2, X + W * 0.6, Y + yy + 2, X + W, Y + yy); x.stroke(); } return x.fillStyle; };
      const T = [
        { rim: ['#9a6a3a', '#6b4422'], face: (X, Y, W, h) => '#b5844c', deco: (X, Y, W, h) => wood(X, Y, W, h), starCols: ['#f2d36a', '#8a5a20', '#fff2c0'], r: 5 },
        { rim: ['#9a6a3a', '#6b4422'], face: () => '#b5844c', deco: (X, Y, W, h) => wood(X, Y, W, h), r: 5,
          over: (X, Y, W) => { const x = o.ctx; for (const [px, py, sx, sy] of [[X, Y, 1, 1], [X + W, Y, -1, 1], [X, Y + H, 1, -1], [X + W, Y + H, -1, -1]]) { x.fillStyle = '#e8b43a'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + sx * 9, py); x.lineTo(px, py + sy * 9); x.closePath(); x.fill(); } } },
        { rim: ['#ffe0a0', '#d49a3a', '#9a6418'], face: ['#d9a95a', '#a8742a'], starCols: ['#fff2c0', '#9a6418', '#ffffff'], line: 'rgba(120,70,10,.5)' },
        { rim: ['#ffffff', '#c3cad6', '#8a93a3'], face: ['#dfe4ee', '#a9b2c4'], line: 'rgba(90,100,130,.5)',
          deco: (X, Y, W, h) => { const x = o.ctx; x.strokeStyle = 'rgba(120,130,160,.55)'; x.lineWidth = 0.8; for (let i = 0; i < W; i += 10) { x.beginPath(); x.arc(X + i, Y + h, 6, Math.PI, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(X + i + 5, Y, 6, 0, Math.PI); x.stroke(); } } },
        { rim: ['#fff6c0', '#f2c14a', '#a8700f'], face: ['#ffe28a', '#d9a12e'], starCols: ['#ffffff', '#c98f1e', '#ffffff'], border: 4, line: 'rgba(160,100,10,.55)',
          under: (X, Y, W) => { rays(o.ctx, X + W / 2, Y + H / 2, W * 0.45, W * 0.78, 20, 'rgba(255,214,110,.6)'); halo(o.ctx, X + W / 2, Y + H / 2, W * 0.72, 40, 'rgba(255,230,150,.7)'); },
          over: (X, Y, W) => { gem(o.ctx, X + 7, Y + H / 2, 3.4, '#e0405a'); gem(o.ctx, X + W - 7, Y + H / 2, 3.4, '#3f7fe0'); gem(o.ctx, X + W / 2, Y + 2, 3, '#3fbf7f'); sparkles(o.ctx, X, Y, W, 6); } },
      ];
      const o = { ...T[n - 1], pad: n >= 2 ? 16 : 12, starCols: T[n - 1].starCols }; return draw(n, o);
    } },
    { name: '6 Bonbon', sub: 'Pastell, das bunter wird · Regenbogenstreifen mit Glitzer', f: n => {
      const F = [['#bfe8d0', '#8fd0ae'], ['#ffd6b8', '#f7a98a'], ['#d9c8ff', '#ab94f0'], ['#ffc2dc', '#f283b5'], null][n - 1];
      const o = { rim: ['#ffffff', '#f3eefa', '#d8cfe6'], border: 3, r: 14, pad: 14, starCols: ['#ffd84a', '#d9902a', '#ffffff'],
        face: F || ((X, Y, W) => linX(o.ctx, X, X + W, ['#ff9aa8', '#ffcf6a', '#fff48a', '#9ff0b0', '#9cd6ff', '#c7a6ff'])),
        deco: n >= 4 ? (X, Y, W, h) => { const x = o.ctx; x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = -h; i < W; i += 9) { x.beginPath(); x.moveTo(X + i, Y + h); x.lineTo(X + i + 4, Y + h); x.lineTo(X + i + 4 + h, Y); x.lineTo(X + i + h, Y); x.closePath(); x.fill(); } } : null,
        under: n >= 5 ? (X, Y, W) => halo(o.ctx, X + W / 2, Y + H / 2, W * 0.75, 40, 'rgba(255,200,240,.75)') : null,
        over: (X, Y, W) => { sparkles(o.ctx, X, Y, W, n - 1); if (n >= 3) for (const [dx, c] of [[-1, '#ff8fb8'], [1, '#7fc8ff']]) { const x = o.ctx; const cx = dx < 0 ? X - 2 : X + W + 2; x.fillStyle = c; x.beginPath(); x.ellipse(cx, Y + H / 2, 4, 7, 0, 0, 7); x.fill(); } } };
      return draw(n, o);
    } },
    { name: '7 Mit Ehrentitel', sub: 'Band darunter: Hübsch · Beliebt · Berühmt · Prächtig · Legendär', f: n => {
      const titles = ['Hübsch', 'Beliebt', 'Berühmt', 'Prächtig', 'Legendär'], band = ['#5fa86a', '#4f86d9', '#8a5fd6', '#d9443a', '#e8b43a'][n - 1];
      const o = { rim: ['#fff0a8', '#e8b43a', '#a8700f'], face: ['#41549c', '#232d5c'], line: 'rgba(255,230,160,.6)', pad: 16, below: 30,
        under: n >= 4 ? (X, Y, W) => halo(o.ctx, X + W / 2, Y + H / 2, W * 0.7, 38, n === 5 ? 'rgba(255,220,130,.75)' : 'rgba(255,190,170,.5)') : null,
        over: (X, Y, W) => { const x = o.ctx, by = Y + H + 2, bw = Math.max(64, W * 0.8), bx = X + W / 2 - bw / 2;
          x.fillStyle = shade(band, -0.3); for (const s of [-1, 1]) { const ex = s < 0 ? bx : bx + bw; x.beginPath(); x.moveTo(ex, by + 3); x.lineTo(ex + s * 9, by + 3); x.lineTo(ex + s * 5, by + 9); x.lineTo(ex + s * 9, by + 15); x.lineTo(ex, by + 15); x.closePath(); x.fill(); }
          x.fillStyle = band; rr(x, bx, by, bw, 15, 3); x.fill();
          x.fillStyle = '#fff'; x.font = `700 10px ${getComputedStyle(document.body).getPropertyValue('--font') || 'sans-serif'}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(titles[n - 1].toUpperCase(), X + W / 2, by + 8);
          sparkles(x, X, Y, W, Math.max(0, n - 2)); } };
      return draw(n, o);
    } },
    { name: '8 Kristallglas', sub: 'klar · aqua · violett · rosé · Prisma mit Regenbogenlicht', f: n => {
      const tint = [['rgba(235,245,255,.95)', 'rgba(190,215,240,.95)'], ['rgba(190,245,240,.95)', 'rgba(90,200,200,.95)'], ['rgba(225,205,255,.95)', 'rgba(150,110,230,.95)'], ['rgba(255,210,230,.95)', 'rgba(235,120,170,.95)'], null][n - 1];
      const o = { rim: ['#ffffff', '#d7e4f2', '#9fb3cc'], border: 2.5, r: 6, pad: 14, starCols: ['#f6c444', '#a8700f', '#fff6cc'],
        face: tint || ((X, Y, W) => linX(o.ctx, X, X + W, ['#ffd0dc', '#fff0b0', '#c8f5d8', '#c4e4ff', '#e4d0ff'])),
        deco: (X, Y, W, h) => { const x = o.ctx; x.fillStyle = 'rgba(255,255,255,.55)'; for (const k of [0.15, 0.62]) { x.beginPath(); x.moveTo(X + W * k, Y); x.lineTo(X + W * k + 6, Y); x.lineTo(X + W * k - 4, Y + h); x.lineTo(X + W * k - 10, Y + h); x.closePath(); x.fill(); }
          x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(X + 4, Y + h / 2); x.lineTo(X + 10, Y + 3); x.lineTo(X + W - 10, Y + 3); x.lineTo(X + W - 4, Y + h / 2); x.lineTo(X + W - 10, Y + h - 3); x.lineTo(X + 10, Y + h - 3); x.closePath(); x.stroke(); },
        under: n >= 5 ? (X, Y, W) => { const x = o.ctx; ['#ff8fa8', '#ffd36a', '#8fe0a8', '#7fbfff', '#c79bff'].forEach((c, i) => { x.fillStyle = c; x.globalAlpha = 0.55; x.beginPath(); x.moveTo(X + W - 8, Y + H / 2); x.lineTo(X + W + 40, Y - 14 + i * 7); x.lineTo(X + W + 40, Y - 9 + i * 7); x.closePath(); x.fill(); }); x.globalAlpha = 1; halo(x, X + W / 2, Y + H / 2, W * 0.7, 38, 'rgba(220,240,255,.8)'); } : null,
        over: (X, Y, W) => sparkles(o.ctx, X, Y, W, n - 1) };
      return draw(n, o, n >= 5 ? 0 : 0);
    } },
  ];
  const cache = {};
  window.PK_IMG = (k, n) => cache[k + ':' + n] ||= K[k].f(n);
  window.PK_COUNT = K.length;
  window.PK_SHEET = (page, scale = 1.25) => {
    let el = document.getElementById('pk-sheet'); if (el) el.remove();
    if (page == null) return 'aus';
    el = document.createElement('div'); el.id = 'pk-sheet';
    el.style.cssText = 'position:fixed;inset:0;z-index:999;background:#f3efe6;padding:10px 16px;overflow:auto;font:700 14px/1.2 var(--font);color:#5a3d24';
    const ks = [0, 1, 2, 3].map(i => page * 4 + i).filter(i => i < K.length);
    el.innerHTML = ks.map(k => `<div style="margin:2px 0 0">${K[k].name} <span style="font-weight:500;font-size:12px;color:#8a6a4a">${K[k].sub}</span></div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">${[1, 2, 3, 4, 5].map(n => { const u = PK_IMG(k, n); return `<img data-pk="${k}-${n}" src="${u}">`; }).join('')}</div>`).join('');
    document.body.append(el);
    for (const im of el.querySelectorAll('img')) { const set = () => { im.style.height = Math.round(im.naturalHeight / 3 * scale) + 'px'; }; im.complete ? set() : im.onload = set; }
    return ks.map(k => K[k].name).join(', ');
  };
})();
