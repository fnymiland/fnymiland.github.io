// Prüfung (Nutzer 11.10.2026: „ragt unter die Minimap“): jedes Ding wählen, offene Aufklappfelder mit – liegt Stil-Zeile, Drehknopf oder Hinweis
// über der Minikarte oder aus dem Bild? Im Browser: (0, eval)(await (await fetch('tools/karte-ueberlapp-pruefung.js')).text()); dann window.__check
(async () => {
  await new Promise(r => setTimeout(r, 1000));
  try { closeModal(); } catch (e) {} state.tutorial = -1; for (const t of TECHS) state.techs.add(t.id); state.money = 1e9; buildToolbar();
  await new Promise(r => setTimeout(r, 500));
  miniTick(performance.now());                                          // Karte zeigen, auch wenn der Tab gerade nicht zeichnet
  const W = innerWidth, H = innerHeight, shown = miniWanted() && miniOpen && !$('minimap').hidden;
  const mm = [W - 226, H - 276, W - 14, H - 64];
  const hit = r => shown && r.width && r.left < mm[2] && r.right > mm[0] && r.top < mm[3] && r.bottom > mm[1];
  const bad = []; let n = 0;
  const check = (id, extra = '') => {
    for (const sel of ['#style-bar', '#rot-btn', '#hint', '#style-bar .wpop']) {
      const e = document.querySelector(sel); if (!e || e.hidden || e.closest('[hidden]')) continue;
      const r = e.getBoundingClientRect(); if (!r.width) continue;
      if (hit(r)) bad.push(id + extra + ' ' + sel + ' über Karte ' + [r.left, r.top, r.right, r.bottom].map(Math.round));
      if (r.left < 0 || r.right > W) bad.push(id + extra + ' ' + sel + ' aus dem Bild ' + [r.left, r.right].map(Math.round));
    }
  };
  for (const id of Object.keys(ITEMS)) {
    if (ITEMS[id].gift || !available(id)) continue;
    try { setTool(id); } catch (e) { bad.push(id + ' FEHLER ' + e.message); continue; }
    n++; check(id);
    for (const b of [...document.querySelectorAll('#style-bar [data-wpop], #style-bar [data-epop]')].map(b => b.dataset.wpop ? ['wpop', b.dataset.wpop] : ['epop', b.dataset.epop])) {
      if (b[0] === 'wpop') wegPop = b[1]; else edgePop = b[1];
      renderStyleBar(id); check(id, ' [' + b[1] + ' offen]');
      wegPop = null; edgePop = null; renderStyleBar(id);
    }
  }
  setTool('look');
  window.__check = [W, 'Karte ' + (shown ? 'da' : 'nicht da'), n + ' Dinge', ...bad].join('\n');
})();
