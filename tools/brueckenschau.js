// Brückenschau (Besprechung 11.10.2026): alle Brücken, die es im Spiel gibt, nebeneinander in einer frischen Welt – als Spielstand zum
// Importieren (☰ → 💾). Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/brueckenschau.js')).text()); await brueckenschau()   → tools/vorschau/brueckenschau.json (+ .png)
// Reihe 1 (Fluss y 10–13): Wegbrücken übers Wasser – Holzsteg, Steinbogen, Ziegel, Rote Bogenbrücke, breiter Steinbogen, flacher Steg (1 Feld),
//                          Gleisbrücke übers Wasser
// Reihe 2 (Gleis y 22):    Fußgängerbrücken über die Schiene – Holz, Stein, Wie der Weg, Kristall; daneben ein Bahnübergang ohne Brücke
// Reihe 3 (Anhöhen y 27–33): Anhöhen-Brücken – Holzsteg mit Weg, Stahl mit Gleis (Zug), Holzviadukt mit Gleis, Stahl mit Weg, unten Schiene
(function brueckenschauSetup() {
  const X0 = 2, Y0 = 2, X1 = 52, Y1 = 38;
  const pull = (tool, a, b) => { setTool(tool); startPlan('line', a, b, false); const i = planInfo(plan); const ok = runPlan(); return ok || i.err; };
  const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set(x + ',' + y, { w: 0 }); };
  function world() {
    startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true;
    state.town.name = 'Brückenschau';
    state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 5000; for (const t of TECHS) state.techs.add(t.id);
    for (const d of DESIGN) state.design.add(d.id);
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    state.bruecken.clear(); state.edges.clear();
    for (let y = 10; y <= 13; y++) for (let x = X0; x <= 40; x++) state.terra.set(x + ',' + y, 'water');   // Fluss
    state.terra.set('30,10', 'grass'); state.terra.set('30,11', 'grass'); state.terra.set('30,13', 'grass');   // Landzunge: 1 Feld Wasser (30,12)
    for (let x = 29; x <= 31; x++) { state.terra.set(x + ',10', 'grass'); state.terra.set(x + ',11', 'grass'); state.terra.set(x + ',13', 'grass'); }
    hill(4, 27, 8, 33); hill(12, 27, 16, 33);                                    // Anhöhen-Paar 1 (Lücke x 9–11)
    hill(22, 27, 26, 33); hill(30, 27, 34, 33);                                  // Anhöhen-Paar 2 (Lücke x 27–29)
    groundVersion++; recalc();
  }
  function buildAll() {
    const log = {}, sty = id => { chosenStyle.weg = wegStyleOf(id); };
    // Reihe 1: Wegbrücken (Art aus dem Wegstil), quer über den Fluss
    sty('sand'); log.holzsteg = pull('weg', { x: 6, y: 8 }, { x: 6, y: 15 });
    sty('platten'); log.steinbogen = pull('weg', { x: 10, y: 8 }, { x: 10, y: 15 });
    sty('kopf'); log.ziegel = pull('weg', { x: 14, y: 8 }, { x: 14, y: 15 });
    sty('platten'); log.rot = pull('weg', { x: 18, y: 8 }, { x: 18, y: 15 }); log.rotArt = setBridgeKind(18, 11, 'rot');
    sty('platten'); log.breit = [22, 23, 24].map(x => pull('weg', { x, y: 8 }, { x, y: 15 }));
    sty('sand'); log.einFeld = pull('weg', { x: 30, y: 9 }, { x: 30, y: 15 });
    log.gleisbruecke = pull('schiene', { x: 36, y: 6 }, { x: 36, y: 17 });
    // Reihe 2: Schiene längs, Wege quer → Bahnübergänge, darauf Fußgängerbrücken
    log.gleis2 = pull('schiene', { x: 3, y: 22 }, { x: 40, y: 22 });
    sty('platten');
    const foot = [[7, 'holz'], [13, 'stein'], [19, 'weg'], [25, 'kristall'], [31, null]];
    for (const [x, st] of foot) { log['weg' + x] = pull('weg', { x, y: 19 }, { x, y: 25 }); if (st) log['fuss_' + st] = setCrossing(x, 22, true, st); }
    // Reihe 3: Anhöhen-Brücken
    state.paintNew.bruecke = { form: 0 }; log.ahHolz = pull('bruecke', { x: 7, y: 28 }, { x: 13, y: 28 });
    state.paintNew.bruecke = { form: 1 }; log.ahStahl = pull('bruecke', { x: 7, y: 32 }, { x: 13, y: 32 });
    state.paintNew.bruecke = { form: 0 }; log.ahViadukt = pull('bruecke', { x: 25, y: 28 }, { x: 31, y: 28 });
    state.paintNew.bruecke = { form: 1 }; log.ahStahl2 = pull('bruecke', { x: 25, y: 32 }, { x: 31, y: 32 });
    sty('platten'); log.ahWeg1 = pull('weg', { x: 5, y: 28 }, { x: 15, y: 28 });
    log.ahGleis1 = pull('schiene', { x: 5, y: 32 }, { x: 15, y: 32 });
    log.ahGleis2 = pull('schiene', { x: 23, y: 28 }, { x: 33, y: 28 });
    sty('platten'); log.ahWeg2 = pull('weg', { x: 23, y: 32 }, { x: 33, y: 32 });
    log.unten = pull('schiene', { x: 28, y: 30 }, { x: 28, y: 36 });           // unten quer unter der Stahlbrücke durch (unter dem Holzviadukt stehen Böcke)
    // Treppen hinauf, damit man oben hinkommt; Bahnhöfe für Züge auf den Anhöhen-Brücken
    log.treppe1 = build_('huegeltreppe', 6, 34); log.treppe2 = build_('huegeltreppe', 24, 34);
    state.tiles.set('6,31', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('14,31', { b: 'station', lvl: 1, rot: 0, train: 'regio' });
    state.tiles.set('24,29', { b: 'station', lvl: 1, rot: 0, train: 'schnell' }); state.tiles.set('32,29', { b: 'station', lvl: 1, rot: 0, train: 'schnell' });
    state.tiles.set('5,20', { b: 'station', lvl: 1, rot: 0, train: 'tram' }); state.tiles.set('38,20', { b: 'station', lvl: 1, rot: 0, train: 'tram' });
    state.tiles.set('36,5', { b: 'station', lvl: 1, rot: 0, train: 'modern' }); state.tiles.set('37,17', { b: 'station', lvl: 1, rot: 0, train: 'modern' });
    for (let i = 0; i < 12; i++) state.tiles.set((44 + (i % 4) * 2) + ',' + (4 + Math.floor(i / 4) * 2), { b: 'windrad', lvl: 1 });
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; syncMovers(); floats.length = 0; setTool('look');
    const p = iso(20, 20); cam.x = p.x; cam.y = p.y; cam.z = 1;
    log.linien = T.rail.lines.map(l => l.stations.join('–') + (l.running ? ' ⚡' : ' (kein Strom)')).join(' | ');
    return log;
  }
  const build_ = (b, x, y) => window.build(b, x, y) ? true : placeError(b, x, y);
  window.brueckenschau = async () => {
    world();
    const log = buildAll();
    save();
    const json = JSON.stringify(serialize());
    let r1 = 'kein Sammler';
    try { r1 = await (await fetch('http://127.0.0.1:4181/brueckenschau.json', { method: 'POST', body: json })).text(); } catch (e) { /* ohne Sammler */ }
    return [log, json.length, r1];
  };
  return 'ok';
})();
