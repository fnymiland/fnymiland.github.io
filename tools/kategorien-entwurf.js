// Entwurf (Nutzer 11.10.2026: „Eisenbahn, Zäune, Wege, Terraforming als Kategorien – ein Knopf, Kugeln = Kategorien; Spielbilder statt Emojis“):
// nur Bild, kein Spielcode geändert. Im Browser: fetch('tools/kategorien-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); katEntwurf(1)
// Variante 1: die Dinge der Kategorie als schmale Reihe direkt über der Leiste (über dem großen Knopf beginnend)
// Variante 2: die Dinge in derselben Reihe, hinter den Kategorien, mit Trennstrich
(function kategorienEntwurf() {
  const KATS = [['bahn', 'schiene', ['schiene', 'tunnel', 'station', 'ubahn', 'tunneleinfahrt', 'huegelrampe', 'bergportal']],
    ['linien', 'zaun', ['zaun', 'hecke', 'mauer']], ['wege', 'weg', ['weg']],
    ['gelaende', 'anhoehe', ['graben', 'schuett', 'wiese', 'strand', 'parkrasen', 'anhoehe']]];
  // Spielbild, auf die Mitte des Felds zugeschnitten
  const pic = (id, s) => {
    const t = thumb(id), c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.drawImage(t, 14, 8, 84, 84, 0, 0, 64, 64);
    const i = document.createElement('img'); i.src = c.toDataURL(); i.style.cssText = `width:${s}px;height:${s}px;pointer-events:none;display:block`; return i;
  };
  const clear = () => { for (const e of document.querySelectorAll('.mock-kat')) e.remove(); };
  window.katEntwurf = (v = 1, kat = 0, cur = null) => {
    clear();
    const [, icon, items] = KATS[kat]; cur = cur || items[0];
    setTool(cur === 'graben' ? 'graben' : cur);
    const big = document.querySelector('#cats .quick.drag');
    for (const b of document.querySelectorAll('#cats .drag-ball')) b.style.display = 'none';
    const phone = innerWidth <= 600, B = phone ? 29 : 38, S = phone ? 22 : 26;
    big.dataset.mockText = big.textContent; big.textContent = ''; big.append(pic(icon, B - 6)); big.classList.add('mock-kat-big');
    let at = big;
    KATS.forEach(([, ic], k) => {
      if (k === kat) return;
      const b = document.createElement('button'); b.className = 'quick drag-ball mock-kat'; b.style.cssText = 'padding:0;overflow:hidden;display:inline-flex;align-items:center;justify-content:center';
      b.append(pic(ic, S)); at.after(b); at = b;
    });
    const chip = id => {
      const b = document.createElement('button'); b.className = 'mock-kat-item' + (id === cur ? ' on' : '');
      b.style.cssText = `width:${B}px;height:${B}px;border:0;border-radius:10px;padding:0;display:inline-flex;align-items:center;justify-content:center;flex:none;` +
        `background:${id === cur ? 'var(--brown)' : 'var(--cream)'};box-shadow:0 3px 0 var(--shadow);cursor:pointer`;
      b.append(pic(id, B - 4)); b.title = ITEMS[id].name; return b;
    };
    if (v === 3) {                                                          // vorn in der Stil-Zeile, die ohnehin aufgeht
      const bar = $('style-bar'), sep = document.createElement('span'); sep.className = 'style-sep mock-kat';
      if (!bar.hidden && bar.children.length) bar.prepend(sep);
      for (const id of [...items].reverse()) { const c = chip(id); c.classList.add('mock-kat'); bar.prepend(c); }
      bar.hidden = false; document.body.classList.add('has-styles');
    } else if (v === 1) {
      const row = document.createElement('div'); row.className = 'mock-kat';
      const r = big.getBoundingClientRect();
      row.style.cssText = `position:fixed;left:${r.left - 4}px;bottom:${innerHeight - r.top + 8}px;display:flex;gap:${phone ? 4 : 6}px;padding:4px;border-radius:14px;background:rgba(255,250,240,.85);box-shadow:0 2px 8px rgba(0,0,0,.12);z-index:30`;
      for (const id of items) row.append(chip(id));
      document.body.append(row);
    } else {
      const sep = document.createElement('span'); sep.className = 'quick-sep mock-kat'; at.after(sep); at = sep;
      for (const id of items) { const c = chip(id); c.classList.add('mock-kat'); at.after(c); at = c; }
      if (phone) for (const e of document.querySelectorAll('#cats > .quick[data-quick="verschieben"], #cats > .quick.recent')) e.style.display = 'none';
    }
    return 'ok';
  };
  window.katEntwurfWeg = () => {
    clear();
    const big = document.querySelector('#cats .quick.drag');
    if (big && big.dataset.mockText) { big.textContent = big.dataset.mockText; delete big.dataset.mockText; big.classList.remove('mock-kat-big'); }
    for (const e of document.querySelectorAll('#cats .drag-ball, #cats > .quick')) e.style.display = '';
    setTool('look'); return 'weg';
  };
  return 'ok';
})();
