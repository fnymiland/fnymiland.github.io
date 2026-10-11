// Prüfung Brücke (Block 160, bruecken.js): echte Brücken über echte Pläne gebaut – Holz längs x mit Weg darüber und Kiesweg darunter,
// Stahl längs y mit Schiene darunter, Treppe auf Anhöhe A (Spaziergänger), eine Figur oben auf dem Deck. Übersicht, Nahaufnahmen aller vier
// Anschlüsse, Nacht. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bruecke-pruefung.js')).text()); await brueckeBilder()   → tools/vorschau/bruecke-pruefung.png
(function brueckePruefung() {
  function clearArea(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
  }
  const pull = (tool, a, b, kind = 'line') => { setTool(tool); startPlan(kind, a, b, false); const i = planInfo(plan); const ok = runPlan(); return ok || i.err; };
  function setup() {
    clearArea(4, 2, 36, 26); state.bruecken.clear(); state.edges.clear(); groundVersion++; planMemo = null;
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    for (const m of WEG_MUSTER) state.design.add('wegmuster:' + m.id);
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    hill(8, 10, 13, 14); hill(17, 10, 22, 14);                                  // A, B (Lücke x 14–16)
    hill(25, 4, 29, 9); hill(25, 13, 29, 17);                                    // C, D (Lücke y 10–12)
    groundVersion++; recalc();
    const log = {};
    state.paintNew.bruecke = { form: 0 }; log.holz = pull('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 });
    state.paintNew.bruecke = { form: 1 }; log.stahl = pull('bruecke', { x: 27, y: 8 }, { x: 27, y: 14 });
    chosenStyle.weg = wegStyleOf('platten'); log.wegOben = pull('weg', { x: 9, y: 12 }, { x: 21, y: 12 });
    log.wegC = pull('weg', { x: 27, y: 5 }, { x: 27, y: 16 });
    chosenStyle.weg = wegStyleOf('kies'); log.wegUnten = pull('weg', { x: 15, y: 6 }, { x: 15, y: 19 });
    log.schiene = pull('schiene', { x: 23, y: 11 }, { x: 33, y: 11 });
    log.treppe = build('huegeltreppe', 10, 15) ? true : placeError('huegeltreppe', 10, 15);
    chosenStyle.weg = wegStyleOf('kies'); log.wegTreppe = pull('weg', { x: 10, y: 16 }, { x: 15, y: 16 });
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; setTool('look');
    return log;
  }
  function figuresOnDeck() {                                                     // zwei Spaziergänger: einer auf der Holzbrücke, einer auf Stahl
    hillWalkers.length = 0; syncHillWalkers();
    const st = hwStairs()[0];
    if (!st) return 'keine Treppe';
    for (const [u, v] of [[15, 12], [27, 11]]) {
      const w = { hillw: true, st0: state, stair: st, st: 'top', path: [[u, v]], pi: 0, px: u, py: v, up: 0, wait: 99, lane: 0, kind: 1, fur: FUR[0], shirt: SHIRTS[2], speed: 0, life: 99, fa: 3 * u, fb: 3 * v, ta: 3 * u, tb: 3 * v, t: 1 };
      hwPut(w, u, v, HILL_H); hillWalkers.push(w);
    }
    return hillWalkers.length;
  }
  function shot(cxW, cyW, zz, Cs, up = HILL_H * 0.5) {
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
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
  window.brueckeBilder = async (name = 'bruecke-pruefung.png', Cs = 520, only = null) => {
    const log = setup(), figs = figuresOnDeck();
    const na = nightAt, gh = gameHour;
    const shots = [];
    const day = () => { nightAt = () => 0; gameHour = () => 12; night = 0; };
    try {
      day(); resetDrawCaches(); groundVersion++;
      const list = [
        [15, 12, 2.4, 'Holz · Übersicht'], [27, 11, 2.4, 'Stahl · Übersicht'],
        [13.6, 12, 6, 'Holz · Anschluss A (links)'], [16.4, 12, 6, 'Holz · Anschluss B (rechts)'],
        [27, 9.6, 6, 'Stahl · Anschluss C (hinten)'], [27, 12.4, 6, 'Stahl · Anschluss D (vorn)'],
        [15, 12.3, 5, 'Holz · Mitte, Kiesweg darunter'], [27, 11, 5, 'Stahl · Mitte, Schiene darunter'],
      ];
      for (const [x, y, z, l] of (only ? list.filter((e, i) => only.includes(i)) : list)) shots.push([shot(x, y, z, Cs), l]);
      if (!only) { nightAt = () => 1; gameHour = () => 23; night = 1; resetDrawCaches(); groundVersion++; shots.push([shot(15, 12, 2.4, Cs), 'Holz · Nacht']); shots.push([shot(27, 11, 2.4, Cs), 'Stahl · Nacht']); }
    } finally { nightAt = na; gameHour = gh; }
    return [log, figs, await post(name, sheetOf(shots, 4, Cs))];
  };
  return 'ok';
})();
