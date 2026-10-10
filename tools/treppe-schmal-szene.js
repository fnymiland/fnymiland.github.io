// Nahaufnahmen schmale Treppe (Nutzer, 10.10.2026: „die Treppe soll auch so dünn wie die Wege sein können“): Treppen echt gebaut (build,
// Spielregeln) und im Spiel gezeichnet – schmal eingelassen in alle vier Richtungen, schmal vor der Wand, zwei schmale nebeneinander,
// Weg-Anschluss am Fuß und oben, breit wie bisher. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/treppe-schmal-szene.js').then(r => r.text()).then(t => (0, eval)(t)); await treppeSchmal()        → tools/vorschau/treppe-schmal.png
// await treppeSchmalEinzel(n, name, z) – Szene n in voller Auflösung zum Sammler
(function treppeSchmalSzene() {
  const R = 9;                                                           // Rand um die Szene, der geräumt wird
  // Szenen relativ zum Grundpunkt: hills [x0, y0, x1, y1] (Rechtecke), stairs [x, y, breit?], wege [[x, y]…], look [u, v, h], z, figs [[u, v]…]
  const S = [
    { t: 'Schmal eingelassen, hinauf nach hinten', hills: [[0, 0, 4, 3]], stairs: [[2, 3]], wege: [[2, 4], [2, 5], [2, 2], [2, 1], [1, 1], [3, 1]], look: [2, 3, 13], z: 5, figs: [[2.05, 3.1]] },
    { t: 'Schmal eingelassen, hinauf nach links', hills: [[0, 0, 3, 4]], stairs: [[3, 2]], wege: [[4, 2], [5, 2], [2, 2], [1, 2], [1, 1], [1, 3]], look: [3, 2, 13], z: 5, figs: [[3.1, 2.05]] },
    { t: 'Schmal eingelassen, hinauf nach vorn', hills: [[0, 0, 4, 3]], stairs: [[2, 0]], wege: [[2, -1], [2, -2], [2, 1], [2, 2], [1, 2], [3, 2]], look: [2, -0.4, 20], z: 5, figs: [[1.95, 0.0]] },
    { t: 'Schmal eingelassen, hinauf nach rechts', hills: [[0, 0, 3, 4]], stairs: [[0, 2]], wege: [[-1, 2], [-2, 2], [1, 2], [2, 2], [2, 1], [2, 3]], look: [-0.4, 2, 20], z: 5, figs: [[0.0, 1.95]] },
    { t: 'Schmal vor der Wand, hinauf nach hinten', hills: [[0, 0, 4, 2]], stairs: [[2, 3]], wege: [[2, 4], [2, 5], [2, 2], [2, 1]], look: [2, 3, 13], z: 5, figs: [] },
    { t: 'Schmal vor der Wand, hinauf nach links', hills: [[0, 0, 2, 4]], stairs: [[3, 2]], wege: [[4, 2], [5, 2], [2, 2], [1, 2]], look: [3, 2, 13], z: 5, figs: [] },
    { t: 'Schmal vor der Wand, hinauf nach vorn', hills: [[0, 3, 4, 5]], stairs: [[2, 2]], wege: [[2, 1], [2, 0], [2, 3], [2, 4]], look: [2, 2.5, 13], z: 5, figs: [] },
    { t: 'Schmal vor der Wand, hinauf nach rechts', hills: [[3, 0, 5, 4]], stairs: [[2, 2]], wege: [[1, 2], [0, 2], [3, 2], [4, 2]], look: [2.5, 2, 13], z: 5, figs: [] },
    { t: 'Zwei schmale eingelassen nebeneinander', hills: [[0, 0, 5, 3]], stairs: [[2, 3], [3, 3]], wege: [[2, 4], [3, 4], [2, 5], [3, 5], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Zwei schmale vor der Wand nebeneinander', hills: [[0, 0, 5, 2]], stairs: [[2, 3], [3, 3]], wege: [[2, 4], [3, 4], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Fuß nah: Weg → schmale Treppe (eingelassen)', hills: [[0, 0, 4, 3]], stairs: [[2, 3]], wege: [[2, 4], [2, 5], [1, 5], [3, 5], [2, 2]], look: [2, 3.55, 4], z: 8, figs: [] },
    { t: 'Oben nah: schmale Treppe → Weg (eingelassen)', hills: [[0, 0, 4, 3]], stairs: [[2, 3]], wege: [[2, 4], [2, 2], [2, 1], [1, 2], [3, 2]], look: [2, 2.6, 26], z: 8, figs: [] },
    { t: 'Fuß nah: Weg → schmale Treppe (vor der Wand)', hills: [[0, 0, 4, 2]], stairs: [[2, 3]], wege: [[2, 4], [2, 5], [2, 2]], look: [2, 3.55, 4], z: 8, figs: [] },
    { t: 'Oben nah, hinauf nach vorn (eingelassen)', hills: [[0, 0, 4, 3]], stairs: [[2, 0]], wege: [[2, -1], [2, 1], [2, 2], [1, 1], [3, 1]], look: [2, 0.4, 26], z: 8, figs: [] },
    { t: 'Seite nah: Anhöhe neben der schmalen Treppe', hills: [[0, 0, 4, 3]], stairs: [[2, 3]], wege: [[2, 4], [2, 2]], look: [2.45, 3.1, 14], z: 8, figs: [] },
    { t: 'Breit eingelassen (wie bisher)', hills: [[0, 0, 4, 3]], stairs: [[2, 3, 1]], wege: [[2, 4], [2, 5], [2, 2], [2, 1]], look: [2, 3, 13], z: 5, figs: [] },
    { t: 'Breit vor der Wand, 2 nebeneinander (wie bisher)', hills: [[0, 0, 5, 2]], stairs: [[2, 3, 1], [3, 3, 1]], wege: [[2, 4], [3, 4], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Ganz breiter Weg vor der schmalen Treppe', hills: [[0, 0, 4, 3]], stairs: [[2, 3]], wege: [[1, 4], [2, 4], [3, 4], [2, 2]], wide: true, look: [2, 3.3, 10], z: 6, figs: [] },
    { t: 'Breit neben schmal (vor der Wand)', hills: [[0, 0, 5, 2]], stairs: [[2, 3, 1], [3, 3]], wege: [[2, 4], [3, 4], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Breit neben schmal (eingelassen)', hills: [[0, 0, 5, 3]], stairs: [[2, 3, 1], [3, 3]], wege: [[2, 4], [3, 4], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Schmal neben breit (eingelassen)', hills: [[0, 0, 5, 3]], stairs: [[2, 3], [3, 3, 1]], wege: [[2, 4], [3, 4], [2, 2], [3, 2]], look: [2.5, 3, 13], z: 5, figs: [] },
    { t: 'Drei schmale eingelassen, hinauf nach links', hills: [[0, 0, 3, 5]], stairs: [[3, 1], [3, 2], [3, 3]], wege: [[4, 1], [4, 2], [4, 3], [2, 2]], look: [3, 2, 13], z: 4.5, figs: [] },
    { t: 'Schmal in die Ecke der Anhöhe (Streifen und Keil)', hills: [[0, 0, 4, 3]], stairs: [[4, 3]], wege: [[4, 4], [4, 5], [4, 2]], look: [4, 3, 13], z: 5, figs: [] },
    { t: 'Figur nah, hinauf nach vorn', hills: [[0, 0, 4, 3]], stairs: [[2, 0]], wege: [[2, -1], [2, 1]], look: [2, 0, 16], z: 8, figs: [[2.0, -0.1], [1.95, 0.25]] },
    { t: 'Figur nah, hinauf nach rechts', hills: [[0, 0, 3, 4]], stairs: [[0, 2]], wege: [[-1, 2], [1, 2]], look: [0, 2, 16], z: 8, figs: [[-0.1, 2.0], [0.25, 1.95]] },
    { t: 'Schmal vor der Wand in der Innenecke (Streifen und Keil)', hills: [[0, 0, 4, 2], [0, 3, 1, 3]], stairs: [[2, 3]], wege: [[2, 4], [2, 1]], look: [2, 3, 13], z: 6, figs: [] },
    { t: 'Innenecke nah: hinterer Keil einer schmalen (Gehrung)', hills: [[2, 0, 4, 4]], stairs: [[1, 3]], wege: [[0, 3], [2, 3]], look: [1.6, 2.6, 26], z: 8, figs: [] },
    { t: 'Vorschau: schmal in den Rand setzen', hills: [[0, 0, 4, 4]], stairs: [], wege: [[2, 5], [2, 2]], preview: [2, 4], look: [2, 4, 13], z: 5, figs: [] },
  ];
  const sty = id => (typeof WEG_FROM_PRESET !== 'undefined' && WEG_FROM_PRESET.get(id + ':' + (WEG_MUSTER_BY[id] || {}).farbe)) || wegStyleOf(id);
  let base = null;
  function clear(bx, by) {
    for (let y = by - R; y <= by + R; y++) for (let x = bx - R; x <= bx + R; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); state.roofs.delete(k);
    }
    for (const k of [...state.edges.keys()]) { const [mx, my] = edgeMid(k); if (Math.abs(mx - bx) <= R + 1 && Math.abs(my - by) <= R + 1) state.edges.delete(k); }
    hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; floats.length = 0;
    recalc();
  }
  const setWide = v => { if (typeof stairNewWide !== 'undefined') stairNewWide = v; };
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 2, c0.y - 2]; }
    const [bx, by] = base;
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    clear(bx, by);
    state.paintNew.anhoehe = { form: s.wall || 0 };
    for (const [x0, y0, x1, y1] of s.hills) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) build('anhoehe', bx + x, by + y, true);
    state.paintNew.anhoehe = {};
    chosenStyle.weg = sty(s.wstyle || 'kopf');
    chosenStyle.huegeltreppe = sty(s.tstyle || s.wstyle || 'kopf');
    const errs = [];
    for (const [x, y, wide] of s.stairs) {
      setWide(!!wide);
      const e = placeError('huegeltreppe', bx + x, by + y);
      if (e) errs.push(`Treppe ${x},${y}: ${e}`); else build('huegeltreppe', bx + x, by + y);
    }
    setWide(null);
    const keep = wegShape.wide; wegShape.wide = !!s.wide;
    for (const [x, y] of s.wege) { const e = placeError('weg', bx + x, by + y); if (e) errs.push(`Weg ${x},${y}: ${e}`); else build('weg', bx + x, by + y, true); }
    wegShape.wide = keep;
    recalc(); groundVersion++; floats.length = 0;
    (s.figs || []).forEach(([u, v], i) => {
      const a = ANIMALS[(i * 5 + 2) % ANIMALS.length];
      walkers.push({ fx: Math.round(bx + u), fy: Math.round(by + v), tx: Math.round(bx + u), ty: Math.round(by + v), px: bx + u, py: by + v, t: 0, wait: 1e9, pin: true, kind: ANIMALS.indexOf(a),
        fur: a.fur || FUR[i % FUR.length], shirt: SHIRTS[(i + 2) % SHIRTS.length], speed: 0.8, goal: { kind: 'bummel' }, path: null, steps: 1e9 });
    });
    return errs;
  }
  async function show(s) {
    const [bx, by] = base, [u, v, h] = s.look, p = iso(bx + u, by + v);
    cam.x = p.x; cam.y = p.y - h; cam.z = s.z;
    if (typeof gameHour !== 'undefined') gameHour = () => 12;
    const pv = s.preview, keep = [tool, hover];
    if (pv) { tool = 'huegeltreppe'; setWide(false); hover = { x: bx + pv[0], y: by + pv[1] }; }   // Vorschau beim Bauen (render setzt hillGap)
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 12; k++) { render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      render(performance.now() + 300);
    } finally { if (pv) { [tool, hover] = keep; setWide(null); } }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  window.treppeSzene = async (n, z) => { const s = { ...S[n], ...(z ? { z } : {}) }, errs = build1(s), comp = await show(s); return { errs, t: s.t, comp }; };
  window.treppeSchmal = async (name = 'treppe-schmal.png', only = null) => {
    const list = only || S.map((_, i) => i), C = 960, cols = 5, rows = Math.ceil(list.length / cols), T = 0.5;   // Ausschnitt C (Gerätepunkte), verkleinert auf T
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 58) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = S[list[j]], e = build1(s);
      if (e.length) errs.push(s.t + ': ' + e.join('; '));
      const comp = await show(s), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 58) + 40;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C * T, C * T);
      sx.font = '800 16px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(s.t, X + 4, Y - 10);
    }
    const url = sheet.toDataURL('image/png');
    let res;
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); res = await r.text(); } catch (e) { res = 'kein Sammler'; }
    return { res, errs };
  };
  // einzelne Szene in voller Auflösung zum Sammler (zum genauen Hinsehen)
  window.treppeSchmalEinzel = async (n, name, z, C = 1000) => {
    const { errs, comp } = await window.treppeSzene(n, z), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return [await r.text(), errs]; } catch (e) { return ['kein Sammler', errs]; }
  };
})();
