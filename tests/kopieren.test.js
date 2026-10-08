const { loadGame, game } = require('./helpers/load-game');

// Block 134: Kopieren – mit ✋ markieren, Leiste „⧉ Kopieren · Preis“; gleiche Stufe zum vollen Preis, Stempel bleibt am Finger,
// neue Bewohner, Einzelstücke bleiben draußen; nur eine Linienart in einem Stil: Pipette (Werkzeug mit dem Stil in der Hand)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 999; for (let y = 3; y <= 24; y++) for (let x = 3; x <= 24; x++) { state.terra.set(x + "," + y, "grass"); state.tiles.delete(x + "," + y); state.decos.delete(x + "," + y); state.claimed.add(x + "," + y); } state.edges.clear(); recalc()');
});
const canvas = () => document.getElementById('world');
const scr = (x, y) => game(`(() => { const p = toScreen(${x}, ${y}); return [p.x, p.y]; })()`);
function ev(type, [x, y], { buttons = 0 } = {}) {
  const e = new window.MouseEvent(type, { clientX: x, clientY: y, button: 0, buttons, bubbles: true });
  Object.defineProperty(e, 'pointerId', { value: 7 }); Object.defineProperty(e, 'pointerType', { value: 'mouse' });
  canvas().dispatchEvent(e);
}
function select(a, b) {                                                   // mit ✋ ein Rechteck aufziehen
  game("setTool('verschieben')");
  const p = scr(...a), q = scr(...b);
  ev('pointerdown', p, { buttons: 1 });
  for (let i = 1; i <= 8; i++) ev('pointermove', [p[0] + (q[0] - p[0]) * i / 8, p[1] + (q[1] - p[1]) * i / 8], { buttons: 1 });
  ev('pointerup', q);
  game('syncSelBar()');
}
const at = (x, y) => game(`(state.tiles.get('${x},${y}') || {}).b`);
const town = () => game(`state.tiles.set('4,4', { b: 'haus', lvl: 3, animal: 'hase', name: 'Mia' }); state.tiles.set('5,4', { b: 'weg', lvl: 1, style: 'kopf' });
  state.tiles.set('4,5', { b: 'haus', lvl: 1 }); state.decos.set('5,5', [null, { b: 'blumentopf', rot: 0 }, null, null]); recalc()`);

describe('Kopieren (Block 134)', () => {
  it('Leiste nach dem Markieren: Verschieben und Kopieren mit Preis; Kopie setzt ab, Original bleibt, bezahlt wird der volle Preis', () => {
    town();
    select([4, 4], [5, 5]);
    expect(game("[!!plan, plan && plan.fixed, plan && plan.tool, moving]")).toEqual([true, true, 'verschieben', null]);
    expect(game("!document.getElementById('sel-bar').hidden")).toBe(true);
    const price = game("copyCost(copyCollect(4, 4, 5, 5).items).money");
    expect(price).toBe(game("fullValue({ b: 'haus', lvl: 3 }).money + ITEMS.weg.cost + fullValue({ b: 'haus', lvl: 1 }).money + ITEMS.blumentopf.cost"));
    expect(game("document.getElementById('sel-copy').textContent")).toContain(game(`fmt(${price})`));
    game("document.getElementById('sel-copy').click()");
    expect(game('moving && moving.copy')).toBe(true);
    expect(at(4, 4)).toBe('haus');                                         // Original steht noch
    const m0 = game('state.money');
    expect(game('[...groupErrors(12, 12).errs.values()].filter(Boolean)')).toEqual([]);
    expect(game('dropGroup(12, 12)')).toBe(true);
    expect(game('state.money')).toBe(m0 - price);
    expect(at(11, 11)).toBe('haus');
    expect(game("state.tiles.get('11,11').lvl")).toBe(3);
    expect(game("state.tiles.get('12,11').style")).toBe('kopf');
    expect(game("decosAt('12,12')[1].b")).toBe('blumentopf');
    expect(game("!!state.tiles.get('11,11').animal && state.tiles.get('11,11') !== state.tiles.get('4,4')")).toBe(true);   // eigene Bewohner
    // Stempel: bleibt am Finger, noch einmal absetzen
    expect(game('moving && moving.copy')).toBe(true);
    expect(game('dropGroup(18, 18)')).toBe(true);
    expect(at(17, 17)).toBe('haus');
    expect(game("state.tiles.get('17,17') !== state.tiles.get('11,11')")).toBe(true);   // eigene Objekte, nicht geteilt
    // Esc: Schluss, nichts wird zurückgelegt oder gelöscht
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(game('moving')).toBe(null);
    expect([at(4, 4), at(11, 11), at(17, 17)]).toEqual(['haus', 'haus', 'haus']);
  });
  it('zu wenig Geld: nichts wird gebaut; besetztes Ziel: nichts, Kopie bleibt in der Hand', () => {
    town();
    game('startCopy(4, 4, 5, 5); state.money = 10');
    expect(game('dropGroup(12, 12)')).toBe(false);
    expect(at(11, 11)).toBe(undefined);
    expect(game('state.money')).toBe(10);
    game("state.money = 1e6; state.tiles.set('15,15', { b: 'haus', lvl: 1 }); recalc()");
    expect(game('dropGroup(16, 16)')).toBe(false);
    expect(game('moving && moving.copy')).toBe(true);
  });
  it('drehen wie beim Verschieben; beim Speichern mit Kopie in der Hand bleibt alles, wie es ist (nichts doppelt)', () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 1 }); state.tiles.set('5,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    game('startCopy(4, 4, 6, 4); rotateGroup(1)');
    game('save()');
    const s = game('load()');
    expect([...s.tiles.values()].filter(t => t.b === 'haus').length).toBe(game("[...state.tiles.values()].filter(t => t.b === 'haus').length"));
    expect(game('dropGroup(12, 12)')).toBe(true);
    const ws = game("[11, 12, 13].map(y => (state.tiles.get('12,' + y) || {}).b)");
    expect(ws.filter(b => b === 'weg').length).toBe(2);                    // gedreht: senkrecht
  });
  it('Rathaus und Sehenswürdigkeiten bleiben draußen', () => {
    const r = game("(() => { const k = [...state.tiles].find(([, t]) => t.b === 'rathaus')[0], [x, y] = keyXY(k); return copyCollect(x - 1, y - 1, x + 3, y + 3); })()");
    expect(r.items.some(it => it.kind === 'tile' && it.t.b === 'rathaus')).toBe(false);
    expect(r.stays).toBeGreaterThan(0);
  });
  it('Pipette: nur Weg in einem Stil → Wegwerkzeug mit diesem Stil; nur Hecke → Hecke mit Stil und Farbe; gemischt → Stempel', () => {
    game("for (let x = 4; x <= 8; x++) state.tiles.set(x + ',6', { b: 'weg', lvl: 1, style: 'kopf' }); recalc(); chosenStyle.weg = 'sand'");
    select([4, 6], [8, 6]);
    expect(game("document.getElementById('sel-copy').textContent")).toMatch(/Pipette/);
    game("document.getElementById('sel-copy').click()");
    expect(game('[tool, chosenStyle.weg, moving]')).toEqual(['weg', 'kopf', null]);
    const hs = game("STYLES.hecke.map(s => s.id)");
    game(`state.edges.set('a5,10', { b: 'hecke', style: '${hs[1]}', col: 3 }); state.edges.set('a6,10', { b: 'hecke', style: '${hs[1]}', col: 3 }); recalc()`);
    game("startCopy(5, 9, 6, 10)");
    expect(game("[tool, chosenStyle.hecke, (state.paintNew.hecke || {}).col]")).toEqual(['hecke', hs[1], 3]);
    game("state.tiles.set('5,9', { b: 'haus', lvl: 1 }); recalc(); setTool('look'); startCopy(5, 9, 6, 10)");
    expect(game('moving && moving.copy')).toBe(true);                     // Haus + Hecke: Stempel
  });
});
