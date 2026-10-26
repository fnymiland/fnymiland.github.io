// Entwurf (Nutzer 26.10.2026: „das Schilderzeichen für das Menü lässt nicht erkennen, dass man dort ins Menü kommt“). Im Spiel laden,
// dann MK_APPLY('A'…'E'); MK_APPLY(null) nimmt es zurück. Ändert nur das Bild im Menü-Knopf oben rechts (und bei D/E kleine Wörter).
//   A  drei Holzleisten (das übliche Menü-Zeichen, aus Holz wie die Wegweiser-Bretter)
//   B  drei schlichte Striche in der Schriftfarbe (wie der Pfeil am Ziel-Fenster)
//   C  Zahnrad (gibt es schon als Bildchen)
//   D  Wegweiser bleibt, unter allen vier Knöpfen steht ein kleines Wort (Lager, Du, Freunde, Menü)
//   E  drei schlichte Striche, dazu das Wort „Menü“ darunter
(() => {
  const S = 3;
  const draw = f => { const c = document.createElement('canvas'); c.width = c.height = 64 * S; const x = c.getContext('2d'); x.scale(S, S); f(x); return c.toDataURL(); };
  const rr = (x, X, Y, W, H, R) => { x.beginPath(); x.roundRect(X, Y, W, H, R); };
  const planks = () => draw(x => {
    x.fillStyle = 'rgba(40,50,70,0.16)'; x.beginPath(); x.ellipse(32, 58, 20, 4, 0, 0, Math.PI * 2); x.fill();
    for (const y of [12, 27, 42]) {
      rr(x, 11, y + 3, 42, 10, 4.5); x.fillStyle = '#8a5e38'; x.fill();
      rr(x, 11, y, 42, 10, 4.5); x.fillStyle = '#d9a464'; x.fill();
      x.strokeStyle = '#e8c08a'; x.lineWidth = 1.3; x.lineCap = 'round'; x.beginPath(); x.moveTo(16, y + 3); x.lineTo(40, y + 3); x.stroke();
      x.fillStyle = '#7a5232'; for (const nx of [16, 48]) { x.beginPath(); x.arc(nx, y + 5.5, 1.3, 0, Math.PI * 2); x.fill(); }
    }
  });
  const lines = col => draw(x => {
    x.strokeStyle = col; x.lineWidth = 6.5; x.lineCap = 'round';
    for (const y of [18, 32, 46]) { x.beginPath(); x.moveTo(15, y); x.lineTo(49, y); x.stroke(); }
  });
  const ink = () => document.body.classList.contains('look-wolke') ? '#3b4763' : '#5a3d24';
  const LABELS = { 'store-btn': 'Lager', 'you-btn': 'Du', 'net-btn': 'Freunde', 'menu-btn': 'Menü' };
  let orig = null;
  window.MK_APPLY = v => {
    const i = document.querySelector('#menu-btn i.wi');
    if (orig === null) orig = i.style.backgroundImage;
    let st = document.getElementById('mk-style');
    if (!st) { st = document.createElement('style'); st.id = 'mk-style'; document.head.append(st); }
    st.textContent = `
      #hud .mk-lab { position: relative; }
      #hud .mk-lab::after { content: attr(data-mk); position: absolute; top: calc(100% + 3px); left: 50%; transform: translateX(-50%); white-space: nowrap;
        font: 700 11px/1 var(--font); color: #5a3d24; background: #ecd4a3; border-radius: 6px; padding: 3px 6px 2px; box-shadow: 0 1px 0 #b48c5c; pointer-events: none; }
      body.look-wolke #hud .mk-lab::after { color: #3b4763; background: #fff; box-shadow: 0 1px 0 #c7d4e8; }`;
    for (const id of Object.keys(LABELS)) { const b = document.getElementById(id); b.classList.remove('mk-lab'); delete b.dataset.mk; }
    const label = ids => { for (const id of ids) { const b = document.getElementById(id); b.classList.add('mk-lab'); b.dataset.mk = LABELS[id]; } };
    let url = '';
    if (v === 'A') url = planks();
    if (v === 'B' || v === 'E') url = lines(ink());
    if (v === 'C') url = uiIcon('zahnrad');
    if (v === 'D') label(Object.keys(LABELS));
    if (v === 'E') label(['menu-btn']);
    i.style.backgroundImage = url ? `url(${url})` : orig;
    return v || 'heute';
  };
})();
