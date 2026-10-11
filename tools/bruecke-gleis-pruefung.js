// Prüfung Gleis über die Brücke (Block 160b, bruecken.js): Holzsteg längs x zwischen A und B mit Gleis und Linie oben, darunter quer eine Schiene
// mit eigener Linie (Zug fährt unter dem Deck durch); Stahlbrücke längs y zwischen C und D mit Gleis und Linie, darunter ein Weg. Züge werden
// für die Bilder an feste Stellen gesetzt. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/bruecke-gleis-pruefung.js')).text()); await brueckeGleisBilder()   → tools/vorschau/bruecke-gleis-pruefung.png
(function brueckeGleisPruefung() {
  function clearArea(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
  }
  const pull = (tool, a, b, deck = false) => { setTool(tool); startPlan('line', { ...a, deck }, b, false); const i = planInfo(plan); const ok = runPlan(); return ok || i.err; };
  function setup() {
    clearArea(4, 2, 40, 30); state.bruecken.clear(); state.edges.clear(); groundVersion++; planMemo = null;
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    state.paintNew.schiene = {};
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
    hill(8, 10, 13, 14); hill(17, 10, 22, 14);                                  // A, B (Lücke x 14–16)
    hill(27, 4, 31, 9); hill(27, 13, 31, 17);                                    // C, D (Lücke y 10–12)
    hill(8, 24, 13, 27); hill(17, 24, 22, 27);                                  // E, F (Holzviadukt, Lücke x 14–16)
    groundVersion++; recalc();
    const log = {};
    state.paintNew.bruecke = { form: 0 }; log.holz = pull('bruecke', { x: 12, y: 12 }, { x: 18, y: 12 });
    state.paintNew.bruecke = { form: 1 }; log.stahl = pull('bruecke', { x: 29, y: 8 }, { x: 29, y: 14 });
    state.paintNew.bruecke = { form: 0 }; log.holzEF = pull('bruecke', { x: 12, y: 25 }, { x: 18, y: 25 });
    log.gleisEF = pull('schiene', { x: 9, y: 25 }, { x: 21, y: 25 });
    log.gleisAB = pull('schiene', { x: 9, y: 12 }, { x: 21, y: 12 });
    log.gleisCD = pull('schiene', { x: 29, y: 5 }, { x: 29, y: 16 });
    state.paintNew.bruecke = { form: 0 };
    log.stahlAB = bkSetArt('14,12', 'stahl') || 'Art';                           // unten quer durch die Lücke: Holz hätte einen Bock darüber
    log.unten = pull('schiene', { x: 15, y: 4 }, { x: 15, y: 22 });
    chosenStyle.weg = wegStyleOf('kies'); log.wegCD = pull('weg', { x: 24, y: 11 }, { x: 35, y: 11 });
    state.tiles.set('10,11', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('20,11', { b: 'station', lvl: 1, rot: 0, train: 'regio' });
    state.tiles.set('30,6', { b: 'station', lvl: 1, rot: 0, train: 'modern' }); state.tiles.set('30,15', { b: 'station', lvl: 1, rot: 0, train: 'modern' });
    state.tiles.set('16,5', { b: 'station', lvl: 1, rot: 0, train: 'tram' }); state.tiles.set('16,21', { b: 'station', lvl: 1, rot: 0, train: 'tram' });
    state.tiles.set('10,24', { b: 'station', lvl: 1, rot: 0, train: 'schnell' }); state.tiles.set('20,24', { b: 'station', lvl: 1, rot: 0, train: 'schnell' });
    for (let i = 0; i < 8; i++) state.tiles.set('38,' + (6 + 2 * i), { b: 'windrad', lvl: 1 });
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; syncMovers(); floats.length = 0; critters.length = 0; setTool('look');   // keine Tiere im Bild
    log.linien = T.rail.lines.map(l => l.stations.join('–') + (l.running ? ' ⚡' : ' –')).join(' | ');
    log.deck = trains.map(tr => tr.route.deck ? tr.route.deck.map(d => d.map(v => v.toFixed(1)).join('…')).join(',') : '-').join(' | ');
    return log;
  }
  const trainOf = st => trains.find(tr => tr.id === st);
  // c: Strecke, oder 'mid' (Mitte des Decks), 'e0'/'e1' (ein Wagen über der Kante am Anfang/Ende des Decks)
  function place(id, c) {
    const tr = trainOf(id); if (!tr) return;
    const dk = tr.route.deck && tr.route.deck[0], half = (tr.kind.len + tr.kind.gap) / 2 * (tr.kind.n > 1 && tr.kind.n % 2 === 0 ? 1 : 0);
    tr.c = c === 'mid' ? (dk[0] + dk[1]) / 2 : c === 'e0' ? dk[0] + half : c === 'e1' ? dk[1] - half : c; tr.wait = 1e9;
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
  // list: [x, y, Zoom, Text, { Zug-Id: Strecke }]
  window.brueckeGleisBilder = async (name = 'bruecke-gleis-pruefung.png', Cs = 520, only = null) => {
    const log = setup();
    const na = nightAt, gh = gameHour, shots = [];
    const day = () => { nightAt = () => 0; gameHour = () => 12; night = 0; };
    const AB = '10,11', CD = '30,15', UN = '16,21', EF = '10,24';
    try {
      day(); resetDrawCaches(); groundVersion++;
      const list = [
        [15, 12, 2.4, 'AB Stahl · Zug mitten auf dem Deck', { [AB]: 'mid', [UN]: 1 }],
        [15, 12, 2.4, 'AB · Zug unten durch', { [AB]: 1, [UN]: 10 }],
        [13.8, 12, 5, 'AB · Anschluss A, Wagen über der Kante', { [AB]: 'e0', [UN]: 1 }, HILL_H],
        [16.3, 12, 5, 'AB · Anschluss B, Wagen über der Kante', { [AB]: 'e1', [UN]: 1 }, HILL_H],
        [15, 12.2, 4, 'AB · Mitte: oben und unten zugleich', { [AB]: 'mid', [UN]: 10.3 }],
        [15, 25, 2.4, 'EF Holzviadukt · Zug drauf', { [EF]: 'mid' }],
        [13.8, 25, 5, 'EF · Anschluss E', { [EF]: 'e0' }, HILL_H],
        [15, 25, 4, 'EF · ohne Zug: Gleis, Böcke', { [EF]: 1 }],
        [29, 11, 2.4, 'CD Stahl längs y · Zug, Weg darunter', { [CD]: 'mid' }],
        [29, 9.6, 5, 'CD · Anschluss C (hinten)', { [CD]: 'e1' }, HILL_H],
        [29, 12.4, 5, 'CD · Anschluss D (vorn)', { [CD]: 'e0' }, HILL_H],
      ];
      for (const [i, [x, y, z, l, tp, up]] of list.entries()) {
        if (only && !only.includes(i)) continue;
        for (const [id, c] of Object.entries(tp)) place(id, c);
        shots.push([shot(x, y, z, Cs, up), l]);
      }
      if (!only) { nightAt = () => NIGHT_MAX; gameHour = () => 23; night = NIGHT_MAX; resetDrawCaches(); groundVersion++; place(AB, 'mid'); place(UN, 10); shots.push([shot(15, 12, 2.4, Cs), 'AB · Nacht']); place(EF, 'mid'); shots.push([shot(15, 25, 2.4, Cs), 'EF · Nacht']); place(CD, 'mid'); shots.push([shot(29, 11, 2.4, Cs), 'CD · Nacht']); }
    } finally { nightAt = na; gameHour = gh; }
    return [log, await post(name, sheetOf(shots, 4, Cs))];
  };
  return 'ok';
})();
