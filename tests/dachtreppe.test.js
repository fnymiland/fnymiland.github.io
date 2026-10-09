const { loadGame, game } = require('./helpers/load-game');

// Block 138d: Treppe durch die Dachöffnung (Nutzer: „Aufgang zwischen den Überdachungen – Decke offen, Treppe runter“)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); for (const id of ['dach:form:arkaden', 'dach:form:glas']) state.design.add(id); buildRot = 0; rotManual = false; recalc(); resetUndo()");
});
const roof = (cells, form = 3) => game(`state.paintNew.dach = { form: ${form} }; for (const [x, y] of ${JSON.stringify(cells)}) build('dach', x, y, true); state.paintNew.dach = {}; recalc()`);
const rect = (x0, x1, y0, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };

describe('Treppe durch die Dachöffnung (Block 138d)', () => {
  it('nur unter Steinarkaden (beide Felder), oben Platz zum Aussteigen; Stützen und Wege darunter stören nicht', () => {
    roof(rect(5, 7, 5, 7)); roof(rect(10, 11, 5, 6), 1);
    game('roofAutoPillars(' + JSON.stringify(rect(5, 7, 5, 7)) + ')');
    expect(game("placeError('dachtreppe', 6, 6, 0)")).toBe(null);
    expect(game("placeError('dachtreppe', 6, 7, 0)")).toMatch(/Steinarkaden/);       // zweites Feld nicht überdacht
    expect(game("placeError('dachtreppe', 10, 5, 0)")).toMatch(/Steinarkaden/);      // Glas
    expect(game("placeError('dachtreppe', 6, 5, 0)")).toMatch(/Aussteigen/);         // oben gleich die Brüstung
    expect(game("placeError('dachtreppe', 6, 6, 2)")).toMatch(/Aussteigen/);
    expect(game("placeError('dachtreppe', 5, 6, 0)")).toBe(null);                    // Randfeld mit Stütze
    game("build('weg', 7, 6, true); build('weg', 7, 7, true)");
    expect(game("placeError('dachtreppe', 7, 6, 0)")).toBe(null);                    // über einem Weg
    expect(game("build('dachtreppe', 6, 6)")).toBe(true);
    expect(game("[state.tiles.get('6,6').b, COVER.get('6,7')]")).toEqual(['dachtreppe', '6,6']);
  });

  it('das Dach darüber hat eine Öffnung (neues Bild); dort keine Deko oben', () => {
    roof(rect(5, 7, 5, 7));
    const before = game('roofSig(6, 6, roofAt(6, 6))');
    game("build('dachtreppe', 6, 6)");
    expect(game('roofSig(6, 6, roofAt(6, 6))')).not.toBe(before);
    expect(game('[roofHoles(6, 5).length, roofHoles(6, 6).length, roofHoles(6, 7).length]')).toEqual([0, 1, 1]);
    expect(game("roofTopError('blumentopf', 6, 6, 7)")).toMatch(/Öffnung/);        // Seitenmitte: in der Öffnung
    expect(game("roofTopError('blumentopf', 5, 5, 0)")).toBe(null);
    game("buildRoofTop('blumentopf', 7, 7, 4)");
    expect(game("placeError('dachtreppe', 7, 6, 0)")).toMatch(/Deko oben/);
  });

  it('zeichnet in alle vier Richtungen ohne Fehler, mit jeder Brüstung', () => {
    roof(rect(3, 9, 3, 9));
    for (const [x, y, r] of [[4, 4, 0], [7, 4, 1], [4, 7, 2], [7, 7, 3]]) expect(game(`buildRot = ${r}; build('dachtreppe', ${x}, ${y})`)).toBe(true);
    for (const par of [0, 1, 2, 3]) {
      game(`for (const r of state.roofs.values()) r.par = ${par}`);
      for (const z of [2.5, 0.6]) expect(() => game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); })()`)).not.toThrow();
    }
    expect(() => game("thumbRaw('dachtreppe', 1, { rot: 0 })")).not.toThrow();
  });
  it('Leute auf dem Dach: kommen über die Treppe hinauf, bleiben oben auf freien Plätzen (nicht am Rand, nicht in der Öffnung), gehen wieder hinunter', () => {
    roof(rect(5, 8, 5, 8));
    game("build('dachtreppe', 6, 6); buildRoofTop('bank', 8, 8, 3); state.tiles.set('1,1', { b: 'haus', lvl: 1 }); recalc(); roofers.length = 0");
    expect(game('T.pop > 0')).toBe(true);
    expect(game('rfSpotOk(21, 21)')).toBe(true);                                   // Mitte von 7,7
    expect(game('rfSpotOk(18, 19)')).toBe(false);                                  // in der Öffnung (6 / 6,33)
    expect(game('rfSpotOk(14, 18)')).toBe(false);                                  // am Rand (Brüstung, 4,67)
    for (let i = 0; i < 6; i++) game('syncRoofers()');
    expect(game('roofers.length')).toBeGreaterThan(0);
    expect(game('roofers.length')).toBeLessThanOrEqual(game('ROOFER_MAX'));
    // kommen von draußen (Nutzer: „spawnen aus dem Nichts“): Start nicht überdacht, Weg am Boden bis an den Fuß der Stufen
    expect(game("roofers.every(w => w.st === 'in' && w.up === 0 && !roofAt(Math.round(w.path[0][0]), Math.round(w.path[0][1])))")).toBe(true);
    expect(game("roofers.every(w => { const e = w.path[w.path.length - 1]; return Math.abs(e[0] - (w.stair.mu - w.stair.Du * DT_FOOT)) < 1e-9 && Math.abs(e[1] - (w.stair.mv - w.stair.Dv * DT_FOOT)) < 1e-9; })")).toBe(true);
    game('for (let i = 0; i < 700; i++) stepRoofers(0.05)');
    expect(game("roofers.some(w => w.st === 'roof')")).toBe(true);
    expect(game("roofers.filter(w => w.st === 'roof' && !w.sit).every(w => rfSpotOk(w.fa, w.fb) || (w.fa === w.stair.ex && w.fb === w.stair.ey))")).toBe(true);
    expect(game("roofers.filter(w => w.st === 'roof').every(w => w.up === ROOF_H)")).toBe(true);
    // zeichnen (oben und auf der Treppe) ohne Fehler
    expect(() => game("(() => { cam = state.cam; cam.z = 2.5; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); })()")).not.toThrow();
    // Treppe weg: alle weg
    game("demolish(6, 6); syncRoofers(); stepRoofers(0.05)");
    expect(game('roofers.length')).toBe(0);
  });

  it('wer genug hat, geht über den Ausgang wieder hinunter und verschwindet unten', () => {
    roof(rect(5, 8, 5, 8));
    game("build('dachtreppe', 6, 6); state.tiles.set('1,1', { b: 'haus', lvl: 1 }); recalc(); roofers.length = 0; syncRoofers()");
    game('for (let i = 0; i < 100; i++) stepRoofers(0.05)');
    game('for (const w of roofers) w.life = -1');
    let gone = false;
    for (let i = 0; i < 40 && !gone; i++) gone = game('(() => { for (let i = 0; i < 100; i++) stepRoofers(0.05); return roofers.length === 0; })()');
    expect(gone).toBe(true);
  });
  it('nebeneinander in gleicher Richtung: eine breite Treppe – Öffnungen gehen ineinander über, innen keine Mauer (Nutzer)', () => {
    roof(rect(3, 9, 3, 9));
    game("buildRot = 0; for (const x of [5, 6, 7]) build('dachtreppe', x, 6)");
    const hs = game("[5, 6, 7].map(x => roofHoles(x, 6).find(h => Math.abs(h.mu - x) < 1e-9))");
    expect(hs.map(h => [h.jM, h.jP])).toEqual([[false, true], [true, true], [true, false]]);
    expect(hs.map(h => [h.u0, h.u1])).toEqual([[4.7, 5.5], [5.5, 6.5], [6.5, 7.3]]);   // durchgehend von 4,7 bis 7,3
    expect(game('[5.45, 5.55].every(u => inHole(roofHoles(6, 6).concat(roofHoles(5, 6)), u, 6.5))')).toBe(true);   // zwischen zwei Treppen: offen
    game("buildRot = 2; build('dachtreppe', 4, 4)");                                   // andere Richtung: eigene Treppe
    expect(game("roofHoles(4, 4).find(h => h.rot === 2).jP")).toBe(false);
    const before = game('roofSig(6, 6, roofAt(6, 6))');
    game("demolish(7, 6)");
    expect(game('roofSig(6, 6, roofAt(6, 6))')).not.toBe(before);                  // Nachbar weg: wieder schmal (neues Bild)
    expect(() => game("(() => { cam = state.cam; cam.z = 2.5; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); })()")).not.toThrow();
  });
  it('mit Treppe darunter keine andere Form (Nutzer); Leute auf der Treppe kommen mit dem letzten Feld der ganzen Öffnung dran', () => {
    roof(rect(3, 9, 3, 9));
    game("buildRot = 0; for (const x of [5, 6, 7]) build('dachtreppe', x, 6)");
    expect(game("roofFormLock(['6,7'])")).toMatch(/Treppe/);
    game("openRoofInfo(6, 6); document.querySelector('[data-roofform=\"1\"]').click(); closePanel()");
    expect(game('roofAt(6, 6).form')).toBe(3);
    // Gruppe: drei Treppen nebeneinander, zuletzt gezeichnet wird 7,7 (größte Diagonale, dann größtes x)
    expect(game("rfGroup(roofStairs().find(s => s.k === '5,6'))")).toMatchObject({ last: '7,7' });
    expect(game("rfGroup(roofStairs().find(s => s.k === '5,6')).holes.length")).toBe(3);
    game("roofers.length = 0; roofers.push({ roofer: true, stair: roofStairs().find(s => s.k === '5,6'), st: 'up', d: 0, px: 5, py: 6.5, up: 10, wait: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 9 })");
    expect(game('[...roofersByTile().keys()]')).toEqual(['7,7']);
    expect(() => game("(() => { cam = state.cam; cam.z = 2.5; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); })()")).not.toThrow();
    game('roofers.length = 0');
  });

  it('Brüstung um die Öffnung wie am Rand: Mauer niedrig, Balustrade mit Säulchen, Geländer mit Handlauf (Nutzer)', () => {
    roof(rect(3, 9, 3, 9));
    game("buildRot = 0; build('dachtreppe', 6, 6)");
    const kinds = par => game(`(() => { const h = roofHoles(6, 6)[0], o = holeWallOps(h, ROOF_PAR[${par}]); return o.back.concat(o.front).map(op => op.line ? 'l' + op.line : 'p'); })()`);
    expect(kinds(1).every(k => k === 'p')).toBe(true);
    expect(kinds(2).filter(k => k === 'l2.1').length).toBeGreaterThan(10);               // Säulchen
    expect(kinds(3).filter(k => k === 'l1.1').length).toBeGreaterThan(0);                // Handlauf
  });
  it('Verschieben und Kopieren nehmen die Dachtreppe mit dem Dach mit (Nutzer: „kann die Aufgänge nicht mitkopieren und bewegen“)', () => {
    roof(rect(3, 5, 3, 5));
    game("buildRot = 0; build('dachtreppe', 4, 4)");
    game("setTool('verschieben'); pickUpGroup(3, 3, 5, 5)");
    expect(game('groupErrors(11, 11).first')).toBe(null);
    game("hover = { x: 11, y: 11 }; dropGroup(11, 11); setTool('look')");
    expect(game("[state.tiles.get('11,11') && state.tiles.get('11,11').b, roofAt(11, 11) && roofAt(11, 11).form, state.roofs.size]")).toEqual(['dachtreppe', 3, 9]);
    expect(game('roofHoles(11, 11).length')).toBe(1);
    game("startCopy(10, 10, 12, 12); hover = { x: 16, y: 16 }");
    expect(game('groupErrors(16, 16).first')).toBe(null);
    game("dropGroup(16, 16); cancelMove(); setTool('look')");
    expect(game("[state.tiles.get('16,16') && state.tiles.get('16,16').b, state.roofs.size]")).toEqual(['dachtreppe', 18]);
    expect(game("state.roofs.has('11,11') && state.roofs.has('12,12')")).toBe(true);   // Probe-Dächer wieder weg, Original bleibt
  });

  it('✋ im Dach-Fenster nimmt Treppen ganz unter den Feldern mit; in die Öffnung tippen trifft die Treppe (Fenster, 🧹)', () => {
    roof(rect(3, 5, 3, 5));
    game("buildRot = 0; build('dachtreppe', 4, 4); roofScope = 'run'; openRoofInfo(3, 3); document.getElementById('p-move').click()");
    expect(game("moving.items.filter(i => i.kind === 'tile').map(i => i.t.b)")).toEqual(['dachtreppe']);
    game("hover = { x: 11, y: 11 }; dropGroup(11, 11); setTool('look')");
    expect(game("state.tiles.get('11,11').b")).toBe('dachtreppe');
    game('cam = state.cam; cam.z = 2.5; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
    const s = game('(() => { const p = toScreen(11, 11.3); return [p.x, p.y - ROOF_H * cam.z]; })()');   // mitten in der Öffnung
    expect(game(`holeHit(${s[0]}, ${s[1]})`)).toEqual({ x: 11, y: 11 });
    game(`tap(${s[0]}, ${s[1]}, false)`);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Treppe aufs Dach/);
    expect(game("demolishInfo(11, 11, true).label")).not.toMatch(/Überdachung/);
    game(`setTool('abriss'); setHover(${s[0]}, ${s[1]}); undoable(() => tap(${s[0]}, ${s[1]}, false)); setTool('look')`);
    expect(game("[state.tiles.has('11,11'), state.roofs.has('11,11')]")).toEqual([false, true]);   // Treppe weg, Dach bleibt
  });
  it('Leute auf dem Dach antippen (Nutzer): ihr Fenster wie bei Bewohnern, Kopf auf Dachhöhe', () => {
    roof(rect(3, 5, 3, 5));
    game("buildRot = 0; build('dachtreppe', 4, 4); state.tiles.set('1,1', { b: 'haus', lvl: 3, animal: 1 }); recalc(); roofers.length = 0");
    game("roofers.push({ roofer: true, stair: roofStairs()[0], st: 'roof', px: 3.3, py: 3.3, up: ROOF_H, wait: 0, fa: 10, fb: 10, ta: 10, tb: 10, t: 0, home: '1,1', who: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 99 })");
    game('cam = state.cam; cam.z = 2.5; { const p = iso(4, 4); cam.x = p.x; cam.y = p.y; }');
    const s = game('(() => { const [hx, hy] = walkerHead(roofers[0], cam.z); return [hx, hy + 6 * cam.z * FIG_SCALE]; })()');
    expect(game('walkerHead(roofers[0], cam.z)[1] < toScreen(3.3, 3.3).y - ROOF_H * cam.z')).toBe(true);
    game(`setTool('look'); tap(${s[0]}, ${s[1]}, false)`);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Spaziert auf dem Dach/);
    game('closePanel(); roofers.length = 0');
  });
});
