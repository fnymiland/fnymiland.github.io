const { loadGame, game } = require('./helpers/load-game');

// Wegrichtung (Block 158, Nutzer 11.10.2026: „Wege drehen – die Textur dreht sich mit“; gewählt: folgt der Zugrichtung, R dreht um, ohne
// Randfuge; „bedenke, dass man auch im Nachhinein drehen will – Boden anklicken oder per Auswahl aufnehmen“)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; setTool('look')");
  game("for (let y = 18; y <= 32; y++) for (let x = 18; x <= 32; x++) { const a = anchorAt(x, y); if (a && state.tiles.get(a).b === 'rathaus') continue; state.claimed.add(x + ',' + y); state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("for (const m of ['holz', 'klinker']) state.design.add('wegmuster:' + m); recalc()");
});
const HOLZ = "wegStyleOf('holz')", KLINKER = "wegStyleOf('klinker')", KIES = "wegStyleOf('kies')";
const draw = (a, b, style, kind = 'line') => game(`(() => { setTool('weg'); chosenStyle.weg = ${style}; startPlan('${kind}', ${JSON.stringify(a)}, ${JSON.stringify(b)}, false); return runPlan(); })()`);
const lauf = (x, y) => game(`(t => t ? t.lauf : 'leer')(state.tiles.get('${x},${y}'))`);
const rot = (x, y) => game(`wegPatRot(state.tiles.get('${x},${y}'))`);

describe('Wegrichtung beim Bauen', () => {
  it('alte Wege (ohne lauf) bleiben, wie sie sind – auch mit Holz', () => {
    game(`state.tiles.set('23,23', { b: 'weg', lvl: 1, style: ${HOLZ} }); recalc()`);
    expect(rot(23, 23)).toBe(0);
    expect(game("wegLauf(state.tiles.get('23,23'))")).toBe(1);                      // so gezählt, dass es aussieht wie bisher
  });
  it('Zugrichtung: Holz quer zum Weg, Klinker längs; im L-Zug gehört die Ecke zum ersten Schenkel', () => {
    expect(draw({ x: 21, y: 22 }, { x: 25, y: 25 }, HOLZ)).toBe(true);            // erst entlang x (y = 22), dann entlang y (x = 25)
    expect([lauf(21, 22), lauf(24, 22), lauf(25, 22), lauf(25, 23), lauf(25, 25)]).toEqual([0, 0, 0, 1, 1]);
    expect([rot(23, 22), rot(25, 22), rot(25, 24)]).toEqual([1, 1, 0]);               // Holz: Bohlen quer – entlang x gedreht
    draw({ x: 21, y: 28 }, { x: 24, y: 28 }, KLINKER);
    expect([lauf(22, 28), rot(22, 28)]).toEqual([0, 0]);                              // Klinker längs: entlang x wie das Grundmuster
  });
  it('Fläche: die längere Seite; R dreht um (gilt bis zum Werkzeugwechsel), ⟳ nur bei einem Belag mit Richtung', () => {
    draw({ x: 21, y: 21 }, { x: 22, y: 25 }, HOLZ, 'rect');
    expect([lauf(21, 21), lauf(22, 25)]).toEqual([1, 1]);
    game(`setTool('weg'); chosenStyle.weg = ${HOLZ}; renderStyleBar('weg')`);
    expect(game("$('rot-btn').hidden")).toBe(false);
    game('rotateBuild()');
    expect(game('wegFlip')).toBe(1);
    draw({ x: 25, y: 21 }, { x: 29, y: 21 }, HOLZ);
    expect([lauf(25, 21), rot(25, 21)]).toEqual([1, 0]);                              // umgedreht: Holz längs
    game("setTool('look')");
    expect(game('wegFlip')).toBe(0);
    game(`setTool('weg'); chosenStyle.weg = ${KIES}; renderStyleBar('weg')`);
    expect(game("$('rot-btn').hidden")).toBe(true);                             // Kies hat keine Richtung
    game('rotateBuild()');
    expect(game('wegFlip')).toBe(0);
    game("setTool('look')");
  });
  it('einzelnes Feld: wie der Weg daneben; alter Weg mit neuem Belag bekommt eine Richtung', () => {
    draw({ x: 23, y: 21 }, { x: 23, y: 24 }, HOLZ);                                  // entlang y
    draw({ x: 23, y: 25 }, { x: 23, y: 25 }, HOLZ);
    expect(lauf(23, 25)).toBe(1);
    game(`state.tiles.set('27,27', { b: 'weg', lvl: 1, style: ${KIES} }); state.tiles.set('28,27', { b: 'weg', lvl: 1, style: ${KIES} }); recalc()`);
    draw({ x: 27, y: 27 }, { x: 28, y: 27 }, HOLZ);                                  // übermalen
    expect([lauf(27, 27), rot(27, 27)]).toEqual([0, 1]);
  });
  it('das Muster wird beim Zeichnen gedreht – nur bei Wegfeldern mit Richtung', () => {
    draw({ x: 21, y: 22 }, { x: 24, y: 22 }, HOLZ);
    const seen = (x, y) => game(`(() => { const o = pattern, out = []; pattern = (...a) => { out.push(patRot); return o(...a); };
      try { drawPath(300, 300, 4, ${x}, ${y}, state.tiles.get('${x},${y}')); } finally { pattern = o; } return [out, patRot]; })()`);
    expect(seen(22, 22)).toEqual([[1, 0], 0]);                                      // gedreht (ruft sich gedreht selbst auf), danach wieder aus
    draw({ x: 21, y: 26 }, { x: 24, y: 26 }, KLINKER);
    expect(seen(22, 26)).toEqual([[0], 0]);                                         // Klinker entlang x: wie das Grundmuster
  });
});

describe('Wegrichtung nachträglich', () => {
  it('Weg anklicken: „⟳ Muster drehen“ dreht dieses Feld, ↶ nimmt es zurück; Kies hat keinen Knopf', () => {
    draw({ x: 21, y: 22 }, { x: 24, y: 22 }, HOLZ);
    game("setTool('look'); openInfo(22, 22)");
    expect(game("!!document.querySelector('#panel [data-wlauf]')")).toBe(true);
    expect(game("document.querySelector('#panel').textContent.includes('quer zum Weg')")).toBe(true);
    game("document.querySelector('#panel [data-wlauf]').click()");
    expect([lauf(22, 22), lauf(23, 22)]).toEqual([1, 0]);                            // nur dieses Feld
    expect(game("document.querySelector('#panel').textContent.includes('längs zum Weg')")).toBe(true);
    game('undo()');
    expect(lauf(22, 22)).toBe(0);
    game('closePanel()');
    draw({ x: 21, y: 28 }, { x: 24, y: 28 }, KIES);
    game("setTool('look'); openInfo(22, 28)");
    expect(game("!!document.querySelector('#panel [data-wlauf]')")).toBe(false);
    game('closePanel()');
  });
  it('Auswahl: „⟳ Wegmuster“ dreht alle Wege darin, ohne etwas zu verschieben; ↶ nimmt es zurück', () => {
    draw({ x: 21, y: 22 }, { x: 24, y: 22 }, HOLZ);
    draw({ x: 21, y: 24 }, { x: 24, y: 24 }, KIES);
    expect(game('selWegTurns([20, 20, 26, 26]).length')).toBe(4);                   // Kies zählt nicht
    game('turnSelWegs([20, 20, 26, 26])');
    expect([21, 22, 23, 24].map(x => lauf(x, 22))).toEqual([1, 1, 1, 1]);
    expect(game("state.tiles.has('22,22') && state.tiles.has('22,24')")).toBe(true);
    game('undo()');
    expect([21, 22, 23, 24].map(x => lauf(x, 22))).toEqual([0, 0, 0, 0]);
    game("setTool('verschieben'); plan = { kind: 'rect', tool: 'verschieben', a: { x: 20, y: 20 }, b: { x: 26, y: 26 }, fixed: true }; syncSelBar()");
    expect(game("!!$('sel-turn')")).toBe(true);
    game("$('sel-turn').click()");
    expect(lauf(22, 22)).toBe(1);
    game("plan = null; syncSelBar(); setTool('look')");
  });
  it('aufgenommen: die Gruppe dreht ihr Muster mit; ein einzelnes Wegfeld dreht mit ⟳/R, Abbrechen legt es wie vorher hin', () => {
    draw({ x: 21, y: 22 }, { x: 24, y: 22 }, HOLZ);
    game("setTool('verschieben'); pickUpGroup(21, 22, 24, 22); rotateGroup(1)");
    expect(game("moving.items.filter(it => it.t && it.t.b === 'weg').map(it => groupPlaced(it).t.lauf)")).toEqual([1, 1, 1, 1]);
    game("cancelMove(); setTool('look')");
    expect(lauf(22, 22)).toBe(0);
    game("setTool('verschieben'); pickUp(22, 22, 0)");
    expect(game("[moving && moving.kind, $('rot-btn').hidden]")).toEqual(['tile', false]);
    game('rotateBuild()');
    expect(game('moving.t.lauf')).toBe(1);
    game("cancelMove(); setTool('look')");
    expect(lauf(22, 22)).toBe(0);
  });
});
