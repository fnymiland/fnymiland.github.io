const { loadGame, game } = require('./helpers/load-game');

// Block 138b: Deko auf dem Dach der Steinarkaden (Nutzer: „imagine man könnte da jetzt Deko oben draufstellen“)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.design.add('dach:form:arkaden'); state.design.add('dach:form:glas'); state.design.add('laterne'); recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(5, 5); cam.x = p.x; cam.y = p.y; }');
});
const roof = (cells, form = 3) => game(`state.paintNew.dach = { form: ${form} }; for (const [x, y] of ${JSON.stringify(cells)}) build('dach', x, y, true); state.paintNew.dach = {}`);
const row = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]);
// Bildschirmpunkt eines Platzes auf dem Dach von Feld (x, y)
const onTop = (x, y, slot) => game(`(() => { const [u, v] = roofTopPos(${slot}), p = toScreen(${x} + u, ${y} + v); return [p.x, p.y - ROOF_H * cam.z]; })()`);
const tapAt = (tool, [sx, sy]) => game(`setTool('${tool}'); setHover(${sx}, ${sy}); undoable(() => tap(${sx}, ${sy}, false)); setTool('look')`);

describe('Deko auf dem Dach (Block 138b)', () => {
  it('kleine Deko übers Steindach getippt landet oben – mit Vorschau, kostet, zählt für die Schönheit; Rückgängig nimmt sie wieder', () => {
    roof(row(3, 6, 5));
    const m = game('state.money'), b0 = game('T.beauty');
    const s = onTop(4, 5, 3);
    expect(game(`roofTopAt(${s[0]}, ${s[1]})`)).toEqual({ x: 4, y: 5, slot: 3 });
    game(`setTool('blumentopf'); setHover(${s[0]}, ${s[1]})`);
    expect(game('[hover.x, hover.y, !!hover.top, hoverSlot]')).toEqual([4, 5, true, 3]);
    tapAt('blumentopf', s);
    expect(game("roofAt(4, 5).top[3].b")).toBe('blumentopf');
    expect(game("decosAt('4,5')")).toBeFalsy();                                     // nicht am Boden darunter
    expect(game('state.money')).toBe(m - game('ITEMS.blumentopf.cost'));
    expect(game('T.beauty')).toBeGreaterThan(b0);
    tapAt('blumentopf', s);                                                          // derselbe Platz: nächster freier
    expect(game("roofAt(4, 5).top.filter(Boolean).length")).toBe(2);
    game('undo()');
    expect(game("roofAt(4, 5).top.filter(Boolean).length")).toBe(1);
  });

  it('nur auf Steinarkaden und nur kleine Deko (keine Stütze, kein Souvenir)', () => {
    roof(row(3, 4, 5)); roof(row(3, 4, 8), 1);
    expect(game("roofTopError('laterne', 3, 5, 0)")).toBe(null);
    expect(game("roofTopError('laterne', 3, 8, 0)")).toBe('Deko geht nur auf Steinarkaden');
    expect(game("roofTopError('stuetze', 3, 5, 0)")).toBe('Das passt nicht aufs Dach');
    expect(game("roofTopError('souvenir', 3, 5, 0)")).toBe('Das passt nicht aufs Dach');
    expect(game("roofTopError('haus', 3, 5, 0)")).toBe('Das passt nicht aufs Dach');
    const s = onTop(3, 8, 0);
    expect(game(`roofTopAt(${s[0]}, ${s[1]})`)).toBe(null);                          // Glasdach: bleibt beim Boden
  });

  it('🧹: erst die Deko oben, dann das Dach samt Rest – alles voll zurück', () => {
    roof(row(3, 5, 5));
    const m = game('state.money');
    game("buildRoofTop('laterne', 4, 5, 0); buildRoofTop('bank', 4, 5, 6)");
    const s = game('(() => { const [u, v] = roofTopPos(6), p = toScreen(4 + u, 5 + v); return [p.x, p.y - ROOF_H * cam.z - 4 * cam.z]; })()');   // auf die Bank
    expect(game(`roofTopHit(${s[0]}, ${s[1]})`)).toMatchObject({ x: 4, y: 5, slot: 6 });
    tapAt('abriss', s);
    expect(game("roofAt(4, 5).top.filter(Boolean).map(d => d.b)")).toEqual(['laterne']);
    expect(game("demolishInfo(4, 5)")).toMatchObject({ label: 'Überdachung samt Deko entfernen', refund: game('ITEMS.dach.cost + ITEMS.laterne.cost') });
    const metall = game('state.res.metall');
    game('demolish(4, 5)');
    expect(game("state.roofs.has('4,5')")).toBe(false);
    expect(game('state.res.metall')).toBe(metall + 1);                              // Material der Laterne zurück
    expect(game('state.money')).toBe(m + game('ITEMS.dach.cost'));                  // alles zurück (Dach war vorher bezahlt)
  });

  it('andere Form gesperrt, solange oben Deko steht (Nutzer: „verschwindet ALLES – sollte gesperrt sein“); Belag/Dachgarten geht', () => {
    roof(row(3, 4, 5));
    game("buildRoofTop('blumentopf', 3, 5, 0); buildRoofTop('blumentopf', 4, 5, 1)");
    game("openRoofInfo(3, 5); document.querySelector('[data-roofscope=\"run\"]').click(); document.querySelector('[data-roofbel]').click()");
    expect(game("[...state.roofs.values()].every(r => r.top)")).toBe(true);           // Belag: Deko bleibt
    const m = game('state.money');
    game("openRoofInfo(3, 5); document.querySelector('[data-roofform=\"1\"]').click()");
    expect(game("[...state.roofs.values()].map(r => [r.form, r.top.filter(Boolean).length])")).toEqual([[3, 1], [3, 1]]);   // nichts geändert
    expect(game('state.money')).toBe(m);
    expect(game("roofFormLock(['3,5'])")).toMatch(/Deko/);
    game("state.paintNew.dach = { form: 1 }");
    expect(game("placeError('dach', 3, 5)")).toMatch(/Deko/);                         // auch nicht mit Glas überbauen
    game("state.paintNew.dach = {}; removeRoofTop(3, 5, 0); removeRoofTop(4, 5, 1); openRoofInfo(3, 5); document.querySelector('[data-roofform=\"1\"]').click()");
    expect(game("[...state.roofs.values()].map(r => r.form)")).toEqual([1, 1]);       // leer: geht
    game('closePanel()');
  });

  it('👆 auf die Deko oben: ihr Fenster (Farbe/Form, Entfernen)', () => {
    roof(row(3, 5, 5));
    game("buildRoofTop('laterne', 4, 5, 3)");
    const s = game('(() => { const [u, v] = roofTopPos(3), p = toScreen(4 + u, 5 + v); return [p.x, p.y - ROOF_H * cam.z - 10 * cam.z]; })()');
    game(`setTool('look'); tap(${s[0]}, ${s[1]}, false)`);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Laterne.*auf dem Dach/s);
    game("document.getElementById('p-del').click()");
    expect(game("!!roofAt(4, 5).top")).toBe(false);
  });

  it('Verschieben und Kopieren nehmen die Deko oben mit; die Kopie kostet sie mit', () => {
    roof([[3, 3], [4, 3], [3, 4], [4, 4]]);
    game("buildRoofTop('blumentopf', 3, 3, 0); buildRoofTop('laterne', 4, 4, 3)");
    game("setTool('verschieben'); pickUpGroup(3, 3, 4, 4); hover = { x: 11, y: 11 }; dropGroup(11, 11); setTool('look')");
    expect(game("[roofAt(10, 10).top[0].b, roofAt(11, 11).top[3].b]")).toEqual(['blumentopf', 'laterne']);
    const cost = game('copyCost(copyCollect(10, 10, 11, 11).items).money');
    expect(cost).toBe(4 * game('ITEMS.dach.cost') + game('ITEMS.blumentopf.cost + ITEMS.laterne.cost') + game('copyCost(copyCollect(10, 10, 11, 11).items.filter(i => i.kind !== "roof")).money'));
    game("startCopy(10, 10, 11, 11); hover = { x: 15, y: 15 }; dropGroup(15, 15); cancelMove(); setTool('look')");
    expect(game("roofAt(14, 14).top[0].b")).toBe('blumentopf');
    game("roofAt(14, 14).top[0].col = 2");
    expect(game("roofAt(10, 10).top[0].col")).toBeUndefined();                      // eigene Kopie, nicht dieselbe Deko
  });

  it('Speichern und Laden; Unbekanntes und Stützen fallen weg; Laternen oben brauchen Strom wie unten', () => {
    roof(row(3, 4, 5));
    game("buildRoofTop('laterne', 3, 5, 0)");
    const back = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.roofs.push(['9,9', { form: 3, top: [{ b: 'stuetze' }, { b: 'quatsch' }, { b: 'bank', rot: 1 }] }]); return Object.fromEntries(parseSave(d).roofs); })()");
    expect(back['3,5'].top[0]).toMatchObject({ b: 'laterne' });
    expect(back['4,5'].top).toBeUndefined();
    expect(back['9,9'].top.map(d => d && d.b)).toEqual([null, null, 'bank', null, null, null, null, null, null]);
    expect(game("[...roofTopAll()].length")).toBe(1);
    expect(game("[...computePower([], 0, 1).dark]")).toContain('3,5,10');          // ohne Strom: dunkel (Platz 10 + i)
    expect(game("computePower([], 1, 1).dark.has('3,5,10')")).toBe(false);
  });

  it('✋ im Fenster der Deko oben: aufnehmen, auf ein anderes Dachfeld oder an den Boden legen; Abbrechen legt sie zurück (Nutzer)', () => {
    roof(row(3, 6, 5));
    game("buildRoofTop('laterne', 4, 5, 3)");
    game("openRoofTopInfo(4, 5, 3)");
    expect(game("!!document.getElementById('p-move')")).toBe(true);
    game("document.getElementById('p-move').click()");
    expect(game("[tool, moving && moving.d.b, !!moving.top, !!roofAt(4, 5).top]")).toEqual(['verschieben', 'laterne', true, false]);
    expect(game("JSON.parse(JSON.stringify(serialize())).roofs.find(([k]) => k === '4,5')[1].top[3].b")).toBe('laterne');   // Speichern zwischendurch: am alten Platz
    game('cancelMove()');
    expect(game("roofAt(4, 5).top[3].b")).toBe('laterne');
    // aufs Nachbarfeld oben
    game("openRoofTopInfo(4, 5, 3); document.getElementById('p-move').click()");
    const s = onTop(6, 5, 0);
    game(`setHover(${s[0]}, ${s[1]})`);
    expect(game('[hover.x, hover.y, !!hover.top]')).toEqual([6, 5, true]);
    game(`undoable(() => tap(${s[0]}, ${s[1]}, false))`);
    expect(game("[moving, roofAt(6, 5).top[0].b, !!roofAt(4, 5).top]")).toEqual([null, 'laterne', false]);
    game('undo()');                                                                  // ein Schritt: wieder auf 4,5
    expect(game("[roofAt(4, 5).top[3].b, !!roofAt(6, 5).top]")).toEqual(['laterne', false]);
    // an den Boden
    game("openRoofTopInfo(4, 5, 3); document.getElementById('p-move').click(); dropAt(9, 9, 0); setTool('look')");
    expect(game("[decosAt('9,9')[0].b, !!roofAt(4, 5).top]")).toEqual(['laterne', false]);
  });

  it('✋ im Fenster der Überdachung: dieses Feld oder alle verbundenen samt Deko oben und Stützen; Drehen dreht die Deko mit (Nutzer)', () => {
    roof([[3, 3], [4, 3], [3, 4], [4, 4]]);
    game("roofAutoPillars([[3, 3], [4, 3], [3, 4], [4, 4]]); buildRoofTop('bank', 3, 3, 4); buildRoofTop('laterne', 4, 4, 3); recalc()");
    const pillars = () => game("[...state.decos].reduce((n, [, ds]) => n + ds.filter(d => d && d.b === 'stuetze').length, 0)");
    expect(pillars()).toBe(4);
    game("roofScope = 'run'; openRoofInfo(3, 3)");
    expect(game("!!document.getElementById('p-move')")).toBe(true);
    game("document.getElementById('p-move').click()");
    expect(game("[tool, moving.kind, state.roofs.size, moving.items.filter(i => i.kind === 'deco').length]")).toEqual(['verschieben', 'group', 0, 4]);
    game("hover = { x: 11, y: 11 }; undoable(() => dropGroup(11, 11)); setTool('look')");
    expect(game('[...state.roofs.keys()].sort()')).toEqual(['10,10', '10,11', '11,10', '11,11']);
    expect(game("[roofAt(10, 10).top[4].b, roofAt(11, 11).top[3].b]")).toEqual(['bank', 'laterne']);
    expect(pillars()).toBe(4);
    // nur ein Feld, gedreht: die Deko oben wandert mit auf ihren gedrehten Platz
    game("roofScope = 'one'; openRoofInfo(11, 11); document.getElementById('p-move').click(); rotateGroup(1); hover = { x: 15, y: 15 }; dropGroup(15, 15); setTool('look')");
    expect(game("[state.roofs.has('11,11'), roofAt(15, 15) && roofAt(15, 15).top.findIndex(Boolean)]")).toEqual([false, 2]);   // Ecke 3 (vorn) → nach einer Vierteldrehung Ecke 2
  });

  it('✋-Werkzeug: Deko oben antippen nimmt sie auf, ein Dachfeld ohne Deko nimmt das Dach; Deko vom Boden darf aufs Dach', () => {
    roof(row(3, 6, 5));
    game("buildRoofTop('blumentopf', 4, 5, 3)");
    const d = game('(() => { const [u, v] = roofTopPos(3), p = toScreen(4 + u, 5 + v); return [p.x, p.y - ROOF_H * cam.z - 4 * cam.z]; })()');
    game(`setTool('verschieben'); setHover(${d[0]}, ${d[1]}); undoable(() => tap(${d[0]}, ${d[1]}, false))`);
    expect(game("moving && [moving.d.b, !!moving.top]")).toEqual(['blumentopf', true]);
    game('cancelMove()');
    const r = onTop(6, 5, 7);
    game(`undoable(() => tap(${r[0]}, ${r[1]}, false))`);
    expect(game("moving && [moving.kind, moving.items.map(i => i.kind)]")).toEqual(['group', ['roof']]);
    game("cancelMove(); buildSmall('bank', 9, 9, 0); pickUp(9, 9, 0)");
    const s = onTop(5, 5, 3);
    game(`setHover(${s[0]}, ${s[1]}); undoable(() => tap(${s[0]}, ${s[1]}, false)); setTool('look')`);
    expect(game("[roofAt(5, 5).top[3].b, decosAt('9,9')]")).toEqual(['bank', undefined]);
  });
  it('Deko oben ragt nicht über den Rand (Nutzer): am Rand rückt sie nach innen, zwischen zwei Dachfeldern nicht', () => {
    roof(row(3, 5, 5));
    game("buildRoofTop('bank', 5, 5, 6); buildRoofTop('bank', 4, 5, 6); buildRoofTop('busch', 5, 5, 3)");
    const edge = 0.42 - 0.09;
    const bankR = game("(() => { const d = roofAt(5, 5).top[6], [u] = roofTopSpot(5, 5, 6, d); return u + decoExt(d)[0]; })()");
    expect(bankR).toBeLessThanOrEqual(edge);                                         // rechter Rand: innen
    const busch = game("(() => { const d = roofAt(5, 5).top[3], [u, v] = roofTopSpot(5, 5, 3, d), [eu, ev] = decoExt(d); return [u + eu, v + ev]; })()");
    expect(busch[0]).toBeLessThanOrEqual(edge); expect(busch[1]).toBeLessThanOrEqual(edge);
    expect(game("roofTopSpot(4, 5, 6, roofAt(4, 5).top[6])[0]")).toBeCloseTo(0.3);  // Mitte: Nachbar ist Dach, bleibt
  });
  it('Dächer ausblenden beim Bauen darunter (Nutzer): Weg/Stütze immer, kleine Deko unter Glas immer, unter Stein mit „⬇ Unters Dach“', () => {
    roof(row(3, 5, 5)); roof(row(3, 4, 8), 1);
    const stein = () => game("roofFade(roofAt(4, 5))"), glas = () => game("roofFade(roofAt(3, 8))");
    game("setTool('look')"); expect([stein(), glas()]).toEqual([false, false]);
    game("setTool('weg')"); expect([stein(), glas()]).toEqual([true, true]);
    game("setTool('stuetze')"); expect([stein(), glas()]).toEqual([true, true]);
    game("setTool('blumentopf')"); expect([stein(), glas()]).toEqual([false, true]);      // oben ginge es nur auf Stein
    expect(game("document.querySelector('#style-bar [data-roofdown]').textContent")).toMatch(/Aufs Dach/);
    game("document.querySelector('#style-bar [data-roofdown]').click()");
    expect(game('roofDown')).toBe(true);
    expect(game("document.querySelectorAll('#style-bar [data-roofdown]').length")).toBe(1);              // nicht doppelt
    expect(game("document.querySelector('#style-bar [data-roofdown]').textContent")).toMatch(/Unters Dach/);
    expect(stein()).toBe(true);
    // getippt aufs (durchsichtige) Dach: landet unten, nicht oben
    const s = onTop(4, 5, 3);
    expect(game(`(() => { setHover(${s[0]}, ${s[1]}); return !!hover.top; })()`)).toBe(false);
    game(`undoable(() => tap(${s[0]}, ${s[1]}, false))`);
    expect(game("!!(roofAt(4, 5).top || []).some(Boolean)")).toBe(false);
    game("roofDown = false; setTool('look')");
  });
});
