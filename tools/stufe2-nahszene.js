// Nahaufnahmen Anhöhen Stufe 2 (Prüfung „bündig“, 10.10.2026): Rampen echt gebaut (build, Spielregeln) und im Spiel gezeichnet – alle
// Drehungen, Länge 1 und 2, Keil mit Geländer, längs der Wand, breit, Wegübergänge an Fuß und Oberkante, Weg oben an der Kante.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/stufe2-nahszene.js').then(r => r.text()).then(t => (0, eval)(t)); await stufe2Nah()        → tools/vorschau/stufe2-nah.png
// await stufe2Szene(n, z) baut nur Szene n und zeigt sie (zum Nachsehen einzelner Stellen)
(function stufe2Nahszene() {
  const R = 9;                                                           // Rand um die Szene, der geräumt wird
  // Szenen relativ zum Grundpunkt: hills [x0, y0, x1, y1] (Rechtecke), ramps [x, y, len, rot?] (Anker; rot erzwingt eine Richtung),
  // wege [[x, y]…] (Stil wstyle), look [u, v, h] (Bildmitte), z, figs [[u, v]…] (Figuren)
  const S = [
    { t: 'A 1 Feld, eingesetzt, hinauf nach hinten', hills: [[0, 0, 4, 3]], ramps: [[2, 3, 1]], wege: [[2, 4], [2, 5], [2, 2], [2, 1], [1, 1], [3, 1]], look: [2, 3, 13], z: 5, figs: [[2.05, 3.1]] },
    { t: 'A 1 Feld, eingesetzt, hinauf nach links', hills: [[0, 0, 3, 4]], ramps: [[3, 2, 1]], wege: [[4, 2], [5, 2], [2, 2], [1, 2], [1, 1], [1, 3]], look: [3, 2, 13], z: 5, figs: [[3.1, 2.05]] },
    { t: 'A 1 Feld, eingesetzt, hinauf nach vorn', hills: [[0, 0, 4, 3]], ramps: [[2, 0, 1]], wege: [[2, -1], [2, -2], [2, 1], [2, 2], [1, 2], [3, 2]], look: [2, 0.5, 13], z: 5, figs: [[1.95, 0.0]] },
    { t: 'A 1 Feld, eingesetzt, hinauf nach rechts', hills: [[0, 0, 3, 4]], ramps: [[0, 2, 1]], wege: [[-1, 2], [-2, 2], [1, 2], [2, 2], [2, 1], [2, 3]], look: [0.5, 2, 13], z: 5, figs: [[0.0, 1.95]] },
    { t: 'C 2 Felder vor der Wand, hinauf nach hinten', hills: [[0, 0, 4, 2]], ramps: [[2, 3, 2]], wege: [[2, 5], [2, 6], [2, 2], [2, 1]], look: [2, 3.6, 10], z: 4, figs: [[2.05, 4.0]] },
    { t: 'C 2 Felder vor der Wand, hinauf nach links', hills: [[0, 0, 2, 4]], ramps: [[3, 2, 2]], wege: [[5, 2], [6, 2], [2, 2], [1, 2]], look: [3.6, 2, 10], z: 4, figs: [[4.0, 2.05]] },
    { t: 'C 2 Felder hinter der Wand, hinauf nach vorn', hills: [[0, 3, 4, 5]], ramps: [[2, 1, 2]], wege: [[2, 0], [2, -1], [2, 3], [2, 4]], look: [2, 1.6, 10], z: 4, figs: [[1.95, 1.2]] },
    { t: 'C 2 Felder hinter der Wand, hinauf nach rechts', hills: [[3, 0, 5, 4]], ramps: [[1, 2, 2]], wege: [[0, 2], [-1, 2], [3, 2], [4, 2]], look: [1.6, 2, 10], z: 4, figs: [[1.2, 1.95]] },
    { t: 'D längs der vorderen Wand, hinauf nach links', hills: [[0, 0, 4, 2], [0, 3, 0, 3]], ramps: [[1, 3, 2, 3]], wege: [[3, 3], [4, 3], [5, 3], [0, 3], [0, 2], [1, 2]], look: [1.8, 3, 10], z: 4, figs: [[2.2, 3.05]] },
    { t: 'D längs der rechten Wand, hinauf nach hinten', hills: [[0, 0, 2, 4], [3, 0, 3, 0]], ramps: [[3, 1, 2, 0]], wege: [[3, 3], [3, 4], [3, 5], [2, 0], [2, 1]], look: [3, 1.8, 10], z: 4, figs: [[3.05, 2.2]] },
    { t: 'Breit: 3 × 1 Feld eingesetzt, Weg davor und oben', hills: [[0, 0, 5, 3]], ramps: [[2, 3, 1], [3, 3, 1], [4, 3, 1]], wege: [[2, 4], [3, 4], [4, 4], [3, 5], [2, 2], [3, 2], [4, 2], [3, 1]], look: [3, 3, 13], z: 4.5, figs: [[2.6, 3.1], [3.4, 3.3]] },
    { t: 'Breit: 2 × 2 Felder vor der Wand (Keile außen)', hills: [[0, 0, 5, 2]], ramps: [[2, 3, 2], [3, 3, 2]], wege: [[2, 5], [3, 5], [2, 2], [3, 2]], look: [2.5, 3.6, 10], z: 4, figs: [] },
    { t: 'Weg oben an der Kante, Weg unten daneben (getrennt)', hills: [[0, 0, 5, 3]], ramps: [[2, 4, 1]], wege: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [0, 4], [4, 4]], look: [2, 4, 10], z: 4, figs: [] },
    { t: 'Fuß nah: Übergang Weg → Rampe (anderer Belag)', hills: [[0, 0, 4, 2]], ramps: [[2, 3, 2]], rstyle: 'pflaster', wege: [[2, 5], [2, 6], [1, 5], [3, 5], [2, 2], [2, 1]], look: [2, 4.55, 2], z: 8, figs: [] },
    { t: 'Oberkante nah: Rampe → Weg oben', hills: [[0, 0, 4, 2]], ramps: [[2, 3, 2]], wege: [[2, 5], [2, 2], [2, 1], [1, 2], [3, 2]], look: [2, 2.6, 26], z: 8, figs: [] },
    { t: 'Keil am Fuß nah (Geländer, Grasnarbe)', hills: [[0, 0, 4, 2]], ramps: [[2, 3, 2]], wege: [[2, 5], [2, 2]], look: [2.45, 4.35, 4], z: 8, figs: [] },
    { t: 'Platz oben mit Ständen, breite Rampe', hills: [[0, 0, 5, 4]], ramps: [[2, 4, 1], [3, 4, 1]], wege: [[2, 5], [3, 5], [2, 6], [3, 6], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [4, 2], [2, 3], [3, 3]],
      stands: [['stand_obst', 1, 1], ['stand_brot', 4, 1], ['stand_kaese', 2, 2]], look: [2.6, 2.6, 20], z: 3, figs: [[2.4, 3.6], [3.3, 4.2]] },
    { t: 'Erdwand: 2 Felder vor der Wand, Keil', wall: 1, hills: [[0, 0, 4, 2]], ramps: [[2, 3, 2]], wege: [[2, 5], [2, 6], [2, 2], [2, 1]], look: [2, 3.6, 10], z: 4, figs: [] },
    { t: 'Trockenmauer: 2 Felder hinter der Wand', wall: 2, hills: [[0, 3, 4, 5]], ramps: [[2, 1, 2]], wege: [[2, 0], [2, -1], [2, 3], [2, 4]], look: [2, 1.8, 12], z: 5, figs: [] },
    { t: 'Innenecke nah: hinterer Keil an der Anhöhe (Gehrung)', hills: [[0, 3, 4, 5]], ramps: [[2, 1, 2]], wege: [[2, 0], [2, 3], [2, 4]], look: [1.6, 2.5, 26], z: 8, figs: [] },
    { t: 'Innenecke nah: 1 Feld, hinterer Keil (Gehrung)', hills: [[3, 0, 5, 4]], ramps: [[2, 2, 1]], wege: [[1, 2], [3, 2]], look: [2.5, 1.6, 26], z: 8, figs: [] },
    { t: 'Oberkante nah, hinauf nach vorn (anderer Belag)', hills: [[0, 3, 4, 5]], ramps: [[2, 1, 2]], rstyle: 'pflaster', wege: [[2, 0], [2, 3], [2, 4], [1, 3], [3, 3]], look: [2, 2.5, 26], z: 8, figs: [] },
    { t: 'Oberkante nah, 1 Feld hinauf nach rechts (anderer Belag)', hills: [[3, 0, 5, 4]], ramps: [[2, 2, 1]], rstyle: 'pflaster', wege: [[1, 2], [3, 2], [4, 2], [3, 1], [3, 3]], look: [2.5, 2, 26], z: 8, figs: [] },
    { t: 'Vorschau: 2 Felder in den Rand setzen', hills: [[0, 0, 4, 4]], ramps: [], wege: [[2, 5], [2, 6], [2, 1], [2, 0]], preview: [2, 3, 2], look: [2, 3.2, 14], z: 4, figs: [] },
    { t: 'Vorschau: 1 Feld in den Rand (hinauf nach vorn)', hills: [[0, 0, 4, 4]], ramps: [], wege: [[2, -1], [2, -2], [2, 1], [2, 2]], preview: [2, 0, 1], look: [2, 0.6, 14], z: 4, figs: [] },
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
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 2, c0.y - 2]; }
    const [bx, by] = base;
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    clear(bx, by);
    state.paintNew.anhoehe = { form: s.wall || 0 };
    for (const [x0, y0, x1, y1] of s.hills) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) build('anhoehe', bx + x, by + y, true);
    state.paintNew.anhoehe = {};
    chosenStyle.weg = sty(s.wstyle || 'kopf');
    chosenStyle.huegelrampe = sty(s.rstyle || s.wstyle || 'kopf');
    const errs = [];
    for (const [x, y, len, rot] of s.ramps) {
      rampNewLen = len;
      if (rot != null) { rotManual = true; buildRot = rot; }
      const e = placeError('huegelrampe', bx + x, by + y);
      if (e) errs.push(`Rampe ${x},${y}: ${e}`); else build('huegelrampe', bx + x, by + y);
      rotManual = false; buildRot = 0; rampNewLen = 1;
    }
    for (const [x, y] of s.wege) { const e = placeError('weg', bx + x, by + y); if (e) errs.push(`Weg ${x},${y}: ${e}`); else build('weg', bx + x, by + y, true); }
    for (const [b, x, y] of s.stands || []) { const e = placeError(b, bx + x, by + y); if (e) errs.push(`${b} ${x},${y}: ${e}`); else build(b, bx + x, by + y, true); }
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
    const pv = s.preview, keep = [tool, hover, rampNewLen];
    if (pv) { tool = 'huegelrampe'; rampNewLen = pv[2]; hover = { x: bx + pv[0], y: by + pv[1] }; }   // Vorschau beim Bauen (render setzt hillGap)
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 12; k++) { render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      render(performance.now() + 300);
    } finally { if (pv) [tool, hover, rampNewLen] = keep; }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  window.stufe2Szene = async (n, z) => { const s = { ...S[n], ...(z ? { z } : {}) }, errs = build1(s), comp = await show(s); return { errs, t: s.t, comp }; };
  window.stufe2Nah = async (name = 'stufe2-nah.png', only = null) => {
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
  window.stufe2Einzel = async (n, name, z, C = 1000) => {
    const { errs, comp } = await window.stufe2Szene(n, z), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return [await r.text(), errs]; } catch (e) { return ['kein Sammler', errs]; }
  };
})();
