// Entwurf (Nutzer 26.10.2026: „die Kreise für Menü, Figur usw. oben passen irgendwie nicht zu den Wolken, kann man die wölkchenhafter
// machen?“). Im Spiel (Wolken) laden, dann WK_APPLY('A'…'E'), WK_APPLY(null) nimmt es zurück. Nur die vier runden Knöpfe oben rechts.
(() => {
  const S = 3, N = 64;
  const mk = f => { const c = document.createElement('canvas'); c.width = c.height = N * S; const x = c.getContext('2d'); x.scale(S, S); f(x); return c.toDataURL(); };
  const blob = (x, pts, dy, fill) => { x.fillStyle = fill; for (const [cx, cy, r] of pts) { x.beginPath(); x.arc(cx, cy + dy, r, 0, Math.PI * 2); x.fill(); } };
  // Wolke aus Kreisen: Unterseite blau (versetzt), oben weiß mit hellem Rand oben links, Schimmer
  const cloud = (pts, { under = '#93abd6', top = '#ffffff', tint = '#dfe9f8', depth = 4 } = {}) => mk(x => {
    blob(x, pts, depth, under);
    blob(x, pts, 0, top);
    const g = x.createLinearGradient(0, 6, 0, 58); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, tint);
    blob(x, pts, 0, g);                                                  // Verlauf nur auf der Oberseite (die blaue Unterseite bleibt sichtbar)
    x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.ellipse(22, 17, 7, 3, -0.5, 0, Math.PI * 2); x.fill();
  });
  const ring = (n, R, r, c = [32, 31], extra = []) => [[c[0], c[1], R - r * 0.35], ...Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i / n * Math.PI * 2; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, r]; }), ...extra];
  const V = {
    A: { name: 'A Runde Bauschwolke', sub: 'Kreis mit acht gleichen Buckeln rundherum', img: () => cloud(ring(8, 19, 9.5)) },
    B: { name: 'B Kleine Wolke', sub: 'breiter als hoch, große Buckel oben, flacher Boden', img: () => cloud([[32, 34, 17], [18, 38, 11], [46, 38, 11], [24, 25, 12], [40, 24, 13], [32, 18, 11], [12, 42, 7], [52, 42, 7], [32, 44, 13]]) },
    C: { name: 'C Wie die Knöpfe', sub: 'dieselbe Wolke wie alle Knöpfe im Spiel (Buckel ringsum, eckiger)', css: true },
    D: { name: 'D Pusteblume', sub: 'fünf große runde Buckel, weich wie ein Kissen', img: () => cloud(ring(5, 16, 13)) },
    E: { name: 'E Viele kleine Buckel', sub: 'Kreis mit zwölf kleinen Buckeln, wie gestanzt', img: () => cloud(ring(12, 22, 6.2)) },
  };
  const urls = {};
  window.WK_APPLY = v => {
    let st = document.getElementById('wk-style');
    if (!st) { st = document.createElement('style'); st.id = 'wk-style'; document.head.append(st); }
    if (!v) { st.textContent = ''; return 'aus'; }
    const o = V[v], sel = 'body.look-wolke #hud .hud-act .pill';
    if (o.css) st.textContent = `${sel} { background: none; border-radius: 0; box-shadow: none; border: 0 solid transparent; border-image: var(--cloud-s) 32 32 38 32 fill / 16px 16px 19px 16px round; filter: drop-shadow(0 4px 5px rgba(50,70,110,.18)); }`;
    else { const u = urls[v] ||= o.img();
      st.textContent = `${sel} { background: url(${u}) center / 118% 118% no-repeat; border: 0; border-radius: 0; box-shadow: none; filter: drop-shadow(0 4px 5px rgba(50,70,110,.2)); overflow: visible; }`; }
    return o.name;
  };
  window.WK_VARS = V;
})();
