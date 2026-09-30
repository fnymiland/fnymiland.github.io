const { loadGame, game } = require('./helpers/load-game');

// Block 45: Rückgängig (bis 20 Schritte) und Löschen in jedem Fenster
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; undoStack.length = 0");
  game("state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});
const u = expr => game(`undoable(() => ${expr})`);
const money = () => game('state.money');

describe('Rückgängig', () => {
  it('Bauen zurücknehmen: das Ding ist weg, die Taler sind zurück', () => {
    const m = money();
    u("build('haus', 10, 10, true)");
    expect(money()).toBeLessThan(m);
    expect(game('undo()')).toBe(true);
    expect(game("state.tiles.has('10,10')")).toBe(false);
    expect(money()).toBe(m);
  });

  it('Abreißen zurücknehmen: das Haus steht wieder (mit Bewohner), die Erstattung ist wieder weg', () => {
    u("build('haus', 10, 10, true)");
    game("state.tiles.get('10,10').name = 'Minka'");
    const m = money();
    u('demolish(10, 10)');
    expect(money()).toBeGreaterThan(m);
    game('undo()');
    expect(game("state.tiles.get('10,10')")).toMatchObject({ b: 'haus', name: 'Minka' });
    expect(money()).toBe(m);
  });

  it('Kleinkram, Linien und Parkrasen lassen sich zurücknehmen', () => {
    u("buildSmall('bank', 10, 10, 4)");
    u("buildEdge('zaun', 'a12,10')");
    u("build('parkrasen', 14, 14, true)");
    game('undo()'); expect(game("terraLook(14, 14)")).not.toBe('park');
    game('undo()'); expect(game("state.edges.has('a12,10')")).toBe(false);
    game('undo()'); expect(game("state.decos.has('10,10')")).toBe(false);
    expect(game('undo()')).toBe(false);                                           // nichts mehr da
  });

  it('Verschieben (Aufheben … Ablegen) ist ein Schritt', () => {
    u("build('brunnen', 10, 10, true)");
    game("setTool('verschieben')");
    u('pickUp(10, 10, 0)');
    expect(game('undoStack.length')).toBe(1);                                     // Aufheben allein: noch kein Schritt
    u('dropAt(15, 15, 0)');
    expect(game('undoStack.length')).toBe(2);
    game('undo()');
    expect(game("state.tiles.get('10,10').b")).toBe('brunnen');
    expect(game("state.tiles.has('15,15')")).toBe(false);
  });

  it('hat sich an der Stelle seitdem etwas verändert, wird nichts kaputt gemacht', () => {
    u("build('haus', 10, 10, true)");
    game("state.tiles.get('10,10').lvl = 3");                                       // z. B. ausgebaut
    expect(game('undo()')).toBe(false);
    expect(game("state.tiles.get('10,10').lvl")).toBe(3);
  });

  it('höchstens 20 Schritte', () => {
    for (let i = 0; i < 25; i++) u(`build('weg', ${3 + i % 20}, ${3 + Math.floor(i / 20)}, true)`);
    expect(game('undoStack.length')).toBe(20);
  });

  it('Knopf in der Werkzeugleiste, grau ohne Schritte; Strg/⌘+Z', () => {
    game('buildToolbar()');
    expect(game("document.querySelector('.quick.undo').disabled")).toBe(true);
    u("build('haus', 10, 10, true)");
    expect(game("document.querySelector('.quick.undo').disabled")).toBe(false);
    game("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))");
    expect(game("state.tiles.has('10,10')")).toBe(false);
  });
});

describe('Löschen im Fenster', () => {
  it('jedes Gebäude-Fenster hat einen Löschen-Knopf (nicht beim Rathaus); löschen ist rückgängig machbar', () => {
    u("build('haus', 10, 10, true)"); game('recalc(); openInfo(10, 10)');
    expect(game("!!document.getElementById('p-del')")).toBe(true);
    game("document.getElementById('p-del').click()");
    expect(game("state.tiles.has('10,10')")).toBe(false);
    game('undo()');
    expect(game("state.tiles.has('10,10')")).toBe(true);
    const [rx, ry] = game("keyXY([...state.tiles].find(([, t]) => t.b === 'rathaus')[0])");
    game(`openInfo(${rx}, ${ry})`);
    expect(game("!document.getElementById('panel').hidden && !!document.getElementById('p-del')")).toBe(false);
  });

  it('Teures fragt einmal nach (zweites Tippen), Billiges nicht', () => {
    u("build('reihenhaus', 10, 10, true)"); game('recalc(); openInfo(10, 10)');             // 1500 Taler, halb zurück
    game("document.getElementById('p-del').click()");
    expect(game("state.tiles.has('10,10')")).toBe(true);
    expect(game("document.getElementById('p-del').textContent")).toMatch(/Wirklich/);
    game("document.getElementById('p-del').click()");
    expect(game("state.tiles.has('10,10')")).toBe(false);
  });

  it('Linien und Parkrasen: auch dort ein Löschen-Knopf', () => {
    u("buildEdge('hecke', 'a12,10')"); game("openGateInfo('a12,10'); document.getElementById('p-del').click()");
    expect(game("state.edges.has('a12,10')")).toBe(false);
    u("build('parkrasen', 14, 14, true)"); game("openParkInfo(14, 14); document.getElementById('p-del').click()");
    expect(game('terraLook(14, 14)')).not.toBe('park');
    game('undo()');
    expect(game('terraLook(14, 14)')).toBe('park');
  });
});
