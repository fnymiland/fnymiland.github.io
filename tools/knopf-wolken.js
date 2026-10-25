// Entwurf (Nutzer 25.10.2026: „A für Hecke ist klasse – für Wolken: kannst du nicht mal wolkige Buttons zeichnen?“).
// Im Spiel ausführen: KW_APPLY(1…4) malt jeden echten Knopf (Haupt, Neben, Wahl-Chips, Los) als gemalte Wolke in seiner Größe,
// KW_APPLY(null) nimmt es wieder weg. Neu gezeichnete Knöpfe (Ziel-Fenster tickt) holt ein MutationObserver nach. Ändert nichts Gespeichertes.
(() => {
  const SEL = {
    p: '.btn:not(.ghost):not(.danger):not(:disabled), #goal .task.ready .t-go',
    on: '.look.on, .style-chip.on',
    s: '.btn.ghost, .look:not(.on), .set-btn, .arrange-btn, .style-chip:not(.on), #goal .task-chips .chip',
  };
  const COL = {
    p:  { top: '#6b95d8', under: '#46699f', hi: '#9dbbea', tx: '#ffffff', line: '#3a5d94' },
    on: { top: '#5a86cf', under: '#3c5f97', hi: '#8fb0e4', tx: '#ffffff', line: '#34558a' },
    s:  { top: '#eaf1fb', under: '#b3c3dd', hi: '#ffffff', tx: '#3b4763', line: '#7f97c0' },
  };
  const PAD = {                                   // Innenabstand je Form: Text sitzt im glatten Bauch der Wolke
    1: '8px 17px 10px', 2: '13px 16px 8px', 3: '13px 16px 8px', 4: '7px 20px 9px',
  };
  // Kreise + Bauch (roundRect) einer Wolke der Größe w×H; alles in einer Farbe gefüllt ergibt die Silhouette
  const shape = (v, w, H) => {
    const C = [];
    let body;
    if (v === 1) {                                // Schäfchen: gleichmäßige Buckel rundum
      const rb = Math.max(5, Math.min(9, H * 0.3));
      body = [rb, rb, w - 2 * rb, H - 2 * rb, (H - 2 * rb) / 2];
      roundRectRing(w - 2 * rb, H - 2 * rb, Math.min((H - 2 * rb) / 2, 12), rb * 1.7, true)
        .forEach(([x, y], i) => C.push([x + rb, y + rb, i % 2 ? rb * 0.9 : rb]));
    } else if (v === 2 || v === 3) {              // Kumulus: unten glatt, oben Buckel, der höchste links der Mitte
      const by = H * 0.36;
      body = [0, by, w, H - by, (H - by) / 2];
      const n = Math.max(3, Math.round(w / (H * 0.95)));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, peak = 1 - Math.abs(t - 0.42) * 1.5;
        const r = H * (0.26 + 0.17 * Math.max(0, peak));
        C.push([w * (0.08 + 0.84 * t), Math.max(r + 0.5, by + r * 0.25), r]);
      }
      C.push([H * 0.36, H - H * 0.36, H * 0.36], [w - H * 0.36, H - H * 0.36, H * 0.36]);
    } else {                                      // Kissen: Mitte glatt, an beiden Enden ein Wolkenbausch, der oben heraussteht
      const top = H * 0.24, r = (H - top) / 2;
      body = [r * 0.5, top, w - r, H - top, r];
      for (const s of [1, -1]) {
        const ex = s > 0 ? 0 : w;                 // Außenkante
        C.push([ex + s * r * 1.0, top + r, r], [ex + s * H * 0.62, H * 0.36, H * 0.34]);
      }
    }
    return { C, body };
  };
  const fill = (x, sh, dy, col) => {
    x.fillStyle = col;
    for (const [cx, cy, r] of sh.C) { x.beginPath(); x.arc(cx, cy + dy, r, 0, Math.PI * 2); x.fill(); }
    const [bx, by, bw, bh, br] = sh.body;
    x.beginPath(); x.roundRect(bx, by + dy, bw, bh, Math.min(br, bh / 2)); x.fill();
  };
  const draw = (v, kind, w, h, dpr = Math.min(window.devicePixelRatio || 1, 2)) => {
    const depth = 3, H = h - depth - 2, col = COL[kind];
    const c = document.createElement('canvas'); c.width = Math.ceil(w * dpr); c.height = Math.ceil(h * dpr);
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const sh = shape(v, w, H);
    x.save(); x.filter = 'blur(2px)'; fill(x, sh, depth + 1.5, 'rgba(50,70,110,.22)'); x.restore();
    fill(x, sh, depth, col.under);
    if (v === 3) {                                // gezeichnet: dunkle Linie um die Silhouette
      x.save(); x.filter = `drop-shadow(1.4px 0 0 ${col.line}) drop-shadow(-1.4px 0 0 ${col.line}) drop-shadow(0 1.4px 0 ${col.line}) drop-shadow(0 -1.4px 0 ${col.line})`;
      fill(x, sh, 0, col.top); x.restore();
    }
    fill(x, sh, 0, col.top);
    // Licht von oben: Silhouette hell, darüber dieselbe Silhouette 2 px tiefer in der Grundfarbe, nur innerhalb der Wolke
    const sil = document.createElement('canvas'); sil.width = c.width; sil.height = c.height;
    const y = sil.getContext('2d'); y.scale(dpr, dpr);
    fill(y, sh, 0, col.hi); y.globalCompositeOperation = 'source-atop'; fill(y, sh, 2, col.top);
    x.drawImage(sil, 0, 0, w, h);
    return c;
  };
  window.KW_DRAW = draw;
  const paint = (el, v, kind) => {
    const w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    const key = `${v}|${kind}|${w}x${h}`;
    if (el.dataset.kw === key) return;
    el.dataset.kw = key;
    el.querySelector(':scope > canvas.kw-c')?.remove();
    const c = draw(v, kind, w, h); c.className = 'kw-c';
    c.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;z-index:-1;pointer-events:none`;
    el.prepend(c);
  };
  let cur = null, mo = null, raf = 0;
  const run = () => {
    raf = 0;
    if (!cur) return;
    for (const kind of ['p', 'on', 's']) for (const el of document.querySelectorAll(SEL[kind])) {
      if (el.dataset.kwKind !== kind || el.dataset.kwV !== String(cur)) {
        el.dataset.kwKind = kind; el.dataset.kwV = cur; delete el.dataset.kw;
        if (getComputedStyle(el).position === 'static') el.style.setProperty('position', 'relative', 'important');
        for (const [p, val] of [['background', 'none'], ['isolation', 'isolate'], ['border', '0'], ['box-shadow', 'none'], ['outline', 'none'], ['border-radius', '0'],
          ['padding', PAD[cur]], ['color', COL[kind].tx], ['min-height', '0']]) el.style.setProperty(p, val, 'important');
      }
      paint(el, cur, kind);
    }
  };
  window.KW_APPLY = v => {
    cur = v || null;
    for (const el of document.querySelectorAll('[data-kw-v]')) {
      el.querySelector(':scope > canvas.kw-c')?.remove();
      for (const p of ['position', 'isolation', 'background', 'border', 'box-shadow', 'outline', 'border-radius', 'padding', 'color', 'min-height']) el.style.removeProperty(p);
      delete el.dataset.kw; delete el.dataset.kwV; delete el.dataset.kwKind;
    }
    if (!cur) { mo?.disconnect(); mo = null; return; }
    if (!mo) { mo = new MutationObserver(() => { if (!raf) raf = setTimeout(run, 30); }); mo.observe(document.body, { childList: true, subtree: true }); }
    run();
  };
})();
