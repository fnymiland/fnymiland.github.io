// Prüfwerkzeug Leiste oben (Konzept A, Nutzer 26.10.2026: „Text auf der Y-Achse zentriert“). Im Spiel laden, dann LT_CHECK():
// passt alles nebeneinander (nichts ragt rechts hinaus, nichts überdeckt sich), und sitzen Bildchen und Zahlen senkrecht mittig auf
// der Platte bzw. Scheibe? Für Zahlen zählt die Tinte der Ziffern (Schrift-Maße per measureText), nicht die Zeilenhöhe.
(() => {
  const cnv = document.createElement('canvas').getContext('2d');
  // senkrechte Mitte fürs Auge: Grundlinie bis Oberkante der Großbuchstaben/Ziffern (Unterlängen wie beim „y“ zählen nicht)
  const inkMid = el => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    cnv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = cnv.measureText(el.textContent.trim() || '0'), cap = cnv.measureText('H0').actualBoundingBoxAscent;
    const fA = m.fontBoundingBoxAscent, fD = m.fontBoundingBoxDescent;
    const baseline = r.top + (r.height - (fA + fD)) / 2 + fA;
    return baseline - cap / 2;
  };
  // Fläche einer Platte (Wolke: ohne ihre 3 px Dicke unten; Hecke: innerhalb des Rahmens)
  const face = g => {
    const r = g.getBoundingClientRect(), cs = getComputedStyle(g);
    if (cs.borderImageSource !== 'none') { const W = cs.borderImageWidth.split(' ').map(parseFloat), B = W[2] ?? W[0], T = W[0], f = Math.min(1, r.height / (T + B)); return { top: r.top, bottom: r.bottom - B * f * 3 / 19 }; }
    const bt = parseFloat(cs.borderTopWidth), bb = parseFloat(cs.borderBottomWidth);
    return { top: r.top + bt, bottom: r.bottom - bb };
  };
  const vis = e => e && e.offsetWidth > 0 && !e.hidden && getComputedStyle(e).visibility !== 'hidden';
  window.LT_CHECK = () => {
    const hud = document.getElementById('hud'), bad = [], hr = hud.getBoundingClientRect();
    for (const p of hud.querySelectorAll('.pill')) {
      if (!vis(p)) continue;
      const r = p.getBoundingClientRect();
      if (r.right > innerWidth - 4 || r.left < 4) bad.push(`${p.id} ragt hinaus (${Math.round(r.left)}–${Math.round(r.right)} von ${innerWidth})`);
    }
    const pills = [...hud.querySelectorAll('.pill')].filter(vis);
    for (let i = 0; i < pills.length; i++) for (let j = i + 1; j < pills.length; j++) {
      const a = pills[i].getBoundingClientRect(), b = pills[j].getBoundingClientRect();
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) bad.push(`${pills[i].id} überdeckt ${pills[j].id}`);
    }
    const mids = [];
    for (const g of hud.querySelectorAll('.hud-info, .hud-vals')) {
      const f = face(g), mid = (f.top + f.bottom) / 2;
      for (const el of g.querySelectorAll('.pill i.wi, .pill b, #hud-flag, #tod-i, .tod-t')) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect(), m = el.matches('b, .tod-t') ? inkMid(el) : (r.top + r.bottom) / 2, d = m - mid;
        mids.push(`${el.id || el.dataset.ic || el.className}:${d.toFixed(1)}`);
        if (Math.abs(d) > 1.5) bad.push(`${el.id || el.dataset.ic || el.className} nicht mittig (${d > 0 ? 'tiefer' : 'höher'} um ${Math.abs(d).toFixed(1)} px)`);
      }
    }
    for (const p of hud.querySelectorAll('.hud-act .pill')) {
      if (!vis(p)) continue;
      const r = p.getBoundingClientRect(), ic = p.querySelector('i.wi, #you-face');
      const q = ic.getBoundingClientRect(), d = (q.top + q.bottom) / 2 - (r.top + r.bottom) / 2, dx = (q.left + q.right) / 2 - (r.left + r.right) / 2;
      if (Math.abs(d) > 1.5 || Math.abs(dx) > 1.5) bad.push(`${p.id}: Bild nicht mittig (x ${dx.toFixed(1)}, y ${d.toFixed(1)})`);
    }
    return { w: innerWidth, hudBottom: Math.round(hr.bottom), bad, mids };
  };
})();
