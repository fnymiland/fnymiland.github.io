// Prüfung Wegrichtung (Block 158): echte Wege gezogen (runPlan) – T-Kreuzung und L-Kurve je Muster mit Richtung, dazu eine Fläche, ein breiter
// Weg und ein Weg oben auf einer Anhöhe; zweites Blatt: Kleine/Gemischte Platten u. a. normal vs. gedreht (sieht man die Drehung?).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/weg-richtung-pruefung.js')).text()); await wegRichtungBild()   → tools/vorschau/weg-richtung.png, weg-richtung-muster.png
(function wegRichtungPruefung() {
  const MUSTER = ['holz', 'klinker', 'verband', 'reihen', 'fisch', 'fischgross'];
  function clearArea(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
  }
  const pull = (m, a, b, kind = 'line') => { setTool('weg'); chosenStyle.weg = wegStyleOf(m); startPlan(kind, a, b, false); return runPlan(); };
  function setup() {
    clearArea(10, -4, 60, 44); groundVersion++; planMemo = null;           // sonst kennt die Plan-Vorschau noch die alten Wege
    state.edges.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    for (const m of WEG_MUSTER) state.design.add('wegmuster:' + m.id);
    const errs = [];
    MUSTER.forEach((m, i) => {
      const ox = 14 + (i % 3) * 13, oy = Math.floor(i / 3) * 13;
      if (!pull(m, { x: ox, y: oy + 3 }, { x: ox + 6, y: oy + 3 })) errs.push(m + ' T');   // T: waagrecht, Abzweig nach oben
      if (!pull(m, { x: ox + 3, y: oy }, { x: ox + 3, y: oy + 2 })) errs.push(m + ' Abzweig');
      if (!pull(m, { x: ox, y: oy + 7 }, { x: ox + 4, y: oy + 10 })) errs.push(m + ' L');   // L: erst entlang x, dann y
    });
    // breiter Weg (Fläche) und ein Weg oben auf einer Anhöhe, beides Holz
    wegShape.wide = true; if (!pull('holz', { x: 14, y: 28 }, { x: 18, y: 30 }, 'rect')) errs.push('breit'); wegShape.wide = false;
    for (let y = 28; y <= 32; y++) for (let x = 26; x <= 32; x++) build('anhoehe', x, y, true);
    recalc();
    if (!pull('holz', { x: 27, y: 30 }, { x: 31, y: 30 })) errs.push('Anhöhe');
    if (!pull('holz', { x: 29, y: 29 }, { x: 29, y: 29 })) errs.push('Anhöhe Abzweig');
    recalc();
    for (const t of state.tiles.values()) delete t.born;                 // sonst noch in der Bau-Animation
    setTool('look'); recalc(); groundVersion++; floats.length = 0;
    return errs;
  }
  function shot(cxW, cyW, zz, Cs) {
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y; cam.z = zz;
    walkers.length = 0;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const c = document.createElement('canvas'); c.width = Cs; c.height = Cs; const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, Cs, Cs);
    x.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  function sheetOf(shots, cols, Cs) {
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Cs + 16); sheet.height = rows * (Cs + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, label], i) => { const X = (i % cols) * (Cs + 16), Y = Math.floor(i / cols) * (Cs + 50) + 40; sx.drawImage(c, X, Y); sx.font = '800 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(label, X + 6, Y - 10); });
    return sheet;
  }
  window.wegRichtungBild = async (zz = 3.2, Cs = 520) => {
    const errs = setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    resetDrawCaches(); groundVersion++;
    const shots = [];
    try {
      MUSTER.forEach((m, i) => {
        const ox = 14 + (i % 3) * 13, oy = Math.floor(i / 3) * 13, name = WEG_MUSTER_BY[m].name;
        shots.push([shot(ox + 3, oy + 2.4, zz, Cs), name + ' · Kreuzung']);
        shots.push([shot(ox + 3.5, oy + 8.2, zz, Cs), name + ' · Kurve']);
      });
      shots.push([shot(16, 29, zz * 0.8, Cs), 'Holz · breite Fläche (länger entlang x)']);
      shots.push([shot(29, 30 - 1.4, zz, Cs), 'Holz · oben auf der Anhöhe']);
      // Nahaufnahmen der Stoßstellen
      shots.push([shot(17, 3, 7, Cs), 'Holz · Kreuzung nah']);
      shots.push([shot(18, 7, 7, Cs), 'Holz · Kurve nah']);
      shots.push([shot(30, 3, 7, Cs), 'Klinker · Kreuzung nah']);
      shots.push([shot(17, 16, 7, Cs), 'Steinreihen · Kreuzung nah']);
    } finally { nightAt = na; gameHour = gh; }
    const a = await post('weg-richtung.png', sheetOf(shots, 4, Cs));
    // Muster einzeln, normal vs. gedreht – sieht man die Drehung?
    const KINDS = ['thirds', 'modular', 'big', 'setts', 'herring2', 'boards'], S = 200, b2 = document.createElement('canvas');
    b2.width = KINDS.length * (S + 10); b2.height = 2 * (S + 40);
    const bx = b2.getContext('2d'); bx.fillStyle = '#fffaf0'; bx.fillRect(0, 0, b2.width, b2.height);
    const pg = g;
    KINDS.forEach((k, i) => [0, 1].forEach(r => {
      const c = document.createElement('canvas'); c.width = c.height = S; g = c.getContext('2d'); g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, S, S);
      patNoFade = true; patRot = r;
      try { const L = ([u, v]) => [S / 2 + (u - v) * S * 0.5, S / 2 + (u + v) * S * 0.25]; pattern(L, k, 3, 3, 4, '#8a6d4c', null); } finally { patRot = 0; patNoFade = false; }
      bx.drawImage(c, i * (S + 10), r * (S + 40) + 30); bx.font = '700 16px system-ui'; bx.fillStyle = '#6b4f3a'; bx.fillText(k + (r ? ' gedreht' : ''), i * (S + 10) + 4, r * (S + 40) + 22);
    }));
    g = pg;
    const b = await post('weg-richtung-muster.png', b2);
    return [errs, a, b];
  };
  return 'ok';
})();
