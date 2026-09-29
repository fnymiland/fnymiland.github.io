const { loadGame, game } = require('./helpers/load-game');

// Linie (Weg, Schiene) und Rechteck (Gelände, Weg-Fläche): erst Vorschau, dann bestätigen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99; for (let y = 3; y <= 14; y++) for (let x = 3; x <= 14; x++) { state.terra.set(x + "," + y, "grass"); state.tiles.delete(x + "," + y); state.decos.delete(x + "," + y); } recalc()');
});
const canvas = () => document.getElementById('world');
const scr = (x, y) => game(`(() => { const p = toScreen(${x}, ${y}); return [p.x, p.y]; })()`);
// jsdom kennt kein PointerEvent: MouseEvent mit pointerId/pointerType
function ev(type, [x, y], { button = 0, buttons = 0, touch = false } = {}) {
  const e = new window.MouseEvent(type, { clientX: x, clientY: y, button, buttons, bubbles: true });
  Object.defineProperty(e, 'pointerId', { value: 7 }); Object.defineProperty(e, 'pointerType', { value: touch ? 'touch' : 'mouse' });
  canvas().dispatchEvent(e);
}
const click = (x, y, o = {}) => { const p = scr(x, y); ev('pointerdown', p, { ...o, buttons: 1 }); ev('pointerup', p, o); };
const hoverAt = (x, y) => ev('pointermove', scr(x, y));
function dragFromTo(a, b, o = {}) {
  const p = scr(...a), q = scr(...b);
  ev('pointerdown', p, { ...o, buttons: 1 });
  for (let i = 1; i <= 8; i++) ev('pointermove', [p[0] + (q[0] - p[0]) * i / 8, p[1] + (q[1] - p[1]) * i / 8], { ...o, buttons: 1 });
  ev('pointerup', q, o);
}
const at = (x, y) => game(`(state.tiles.get('${x},${y}') || {}).b`);
// nur im freigeräumten Stück zählen (am Rathaus liegen schon Wege)
const count = b => game(`[...state.tiles].filter(([k, t]) => { const [x, y] = k.split(',').map(Number); return t.b === '${b}' && x >= 3 && x <= 14 && y >= 3 && y <= 14; }).length`);
const coast = () => game(`(() => {
  for (let x = 2; x < 60; x++) { const y = 3; if (!ownedTile(x, y) && isSea(x, y) && ownedTile(x - 1, y)) return [x, y]; }
  return null;
})()`);

describe('Linie', () => {
  it('gerade, dann einmal abbiegen (die längere Richtung zuerst)', () => {
    expect(game('lineTiles({ x: 0, y: 0 }, { x: 3, y: 2 })')).toEqual([[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]]);
    expect(game('lineTiles({ x: 0, y: 0 }, { x: 1, y: -3 })')).toEqual([[0, 0], [0, -1], [0, -2], [0, -3], [1, -3]]);
    expect(game('lineTiles({ x: 2, y: 2 }, { x: 2, y: 2 })')).toEqual([[2, 2]]);
  });

  it('Maus: Klick auf A, die Vorschau folgt der Maus – erst der zweite Klick baut, alles auf einmal', () => {
    game("setTool('weg')");
    const m0 = game('state.money');
    click(4, 5);
    hoverAt(10, 7);
    expect(count('weg')).toBe(0);                                         // noch nichts gebaut
    expect(game('[plan.b.x, plan.b.y]')).toEqual([10, 7]);
    expect(game('planInfo(plan).n')).toBe(9);                             // 7 nach rechts, 2 nach unten
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    click(10, 7);
    const saves = spy.mock.calls.filter(c => c[0] === 'kachelhausen_v3').length;
    spy.mockRestore();
    expect(count('weg')).toBe(9);
    expect(at(4, 5)).toBe('weg'); expect(at(10, 5)).toBe('weg'); expect(at(10, 7)).toBe('weg');
    expect(game('state.money')).toBe(m0 - 9 * 5);
    expect(saves).toBe(1);                                                // einmal speichern, nicht je Feld
    expect(game('plan')).toBe(null);
  });

  it('ein einzelnes Feld: zweimal auf dasselbe Feld klicken', () => {
    game("setTool('weg')");
    click(6, 6); click(6, 6);
    expect(at(6, 6)).toBe('weg');
  });

  it('iPad: A antippen, G antippen (Vorschau), G nochmal antippen baut', () => {
    game("setTool('weg')");
    click(4, 4, { touch: true });
    click(8, 4, { touch: true });
    expect(count('weg')).toBe(0);
    expect(game('planInfo(plan).n')).toBe(5);
    click(8, 4, { touch: true });
    expect(count('weg')).toBe(5);
  });

  it('Hindernisse werden rot gezeigt und übersprungen, der Rest wird gebaut', () => {
    game("state.tiles.set('7,5', { b: 'haus', lvl: 1 }); recalc(); setTool('weg')");
    click(5, 5); hoverAt(9, 5);
    const info = game('(() => { const i = planInfo(plan); return { n: i.n, bad: i.bad, s: i.states.get("7,5") }; })()');
    expect(info).toEqual({ n: 4, bad: 1, s: 'bad' });
    expect(game('planText(plan, planInfo(plan))')).toMatch(/Weg: 4 Felder · −20 · 1 geht nicht/);
    click(9, 5);
    expect(count('weg')).toBe(4);
    expect(at(7, 5)).toBe('haus');
  });

  it('zu wenig Taler: nichts wird gebaut, die Vorschau bleibt', () => {
    game("state.money = 12; setTool('weg')");
    click(4, 4); click(10, 4);
    expect(count('weg')).toBe(0);
    expect(game('!!plan')).toBe(true);
    expect(game('planInfo(plan).err')).toMatch(/Zu wenig Taler \(35 nötig\)/);
  });

  it('Escape und Rechtsklick brechen nur die Planung ab, das Werkzeug bleibt', () => {
    game("setTool('weg')");
    click(4, 4); hoverAt(8, 4);
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(game('plan')).toBe(null);
    expect(game('tool')).toBe('weg');
    click(4, 4);
    click(8, 4, { button: 2 });
    expect(game('plan')).toBe(null);
    expect(game('tool')).toBe('weg');
    expect(count('weg')).toBe(0);
  });

  it('Schiene: Ziehen legt eine Linie als Vorschau, hineinklicken baut – auch als Brücke hinaus ins Meer', () => {
    const [cx, y] = coast();
    game(`state.techs.add('bahn'); for (let x = ${cx - 3}; x < ${cx}; x++) { state.terra.set(x + ',${y}', 'grass'); state.tiles.delete(x + ',${y}'); state.decos.delete(x + ',${y}'); } recalc(); setTool('schiene')`);
    dragFromTo([cx - 3, y], [cx + 2, y]);
    const rails = () => game(`[0, 1, 2, 3, 4, 5].filter(i => (state.tiles.get((${cx - 3} + i) + ',${y}') || {}).b === 'schiene').length`);
    expect(rails()).toBe(0);
    expect(game('plan.fixed')).toBe(true);
    expect(game('planInfo(plan).n')).toBe(6);                             // jedes Feld macht das nächste erreichbar
    click(cx - 2, y);
    expect(rails()).toBe(6);
    expect(game(`state.tiles.get('${cx + 2},${y}').bridge`)).toBe(true);
    expect(game(`ownedTile(${cx + 2}, ${y})`)).toBe(true);
  });
});

describe('Rechteck', () => {
  it('Weg aufziehen zeigt die Fläche, hineinklicken baut sie', () => {
    game("setTool('weg')");
    dragFromTo([4, 4], [6, 7]);
    expect(count('weg')).toBe(0);
    expect(game('[plan.kind, plan.fixed, planInfo(plan).n]')).toEqual(['rect', true, 12]);
    click(5, 5);
    expect(count('weg')).toBe(12);
  });

  it('daneben klicken bricht ab', () => {
    game("setTool('weg')");
    dragFromTo([4, 4], [6, 6]);
    click(12, 12);
    expect(game('plan')).toBe(null);
    expect(count('weg')).toBe(0);
  });

  it('Gelände: Wald pflanzen auf einer Fläche, bebaute Felder bleiben frei', () => {
    game("state.techs.add('terraform'); state.tiles.set('5,5', { b: 'haus', lvl: 1 }); recalc(); setTool('wald')");
    const m0 = game('state.money');
    dragFromTo([4, 4], [7, 6]);
    expect(game('planInfo(plan).n')).toBe(11);
    click(6, 6);
    expect(game("state.terra.get('4,4')")).toBe('forest');
    expect(game("state.terra.get('7,6')")).toBe('forest');
    expect(game("state.terra.get('5,5')")).toBe('grass');
    expect(game('state.money')).toBe(m0 - 11 * game('ITEMS.wald.cost'));
  });

  it('Aufschütten im Meer: Feld für Feld hinaus, alles in einem Zug', () => {
    const [cx, y] = coast();
    game("setTool('schuett')");
    dragFromTo([cx, y], [cx + 2, y]);
    expect(game('planInfo(plan).n')).toBe(3);
    click(cx + 1, y);
    for (let i = 0; i < 3; i++) expect(game(`terrainAt(${cx + i}, ${y}) === 'grass' && ownedTile(${cx + i}, ${y})`)).toBe(true);
  });

  it('ein einzelner Klick ohne Ziehen wirkt wie bisher sofort auf ein Feld', () => {
    game("state.techs.add('terraform'); setTool('wald')");
    click(9, 9);
    expect(game("state.terra.get('9,9')")).toBe('forest');
    expect(game('plan')).toBe(null);
  });

  it('höchstens 24 × 24 Felder auf einmal', () => {
    game("setTool('weg'); startPlan('rect', { x: 0, y: 0 }, { x: 100, y: -100 }, true)");
    expect(game('[plan.b.x, plan.b.y]')).toEqual([23, -23]);
  });

  it('Werkzeugwechsel verwirft die Planung – eine neu aufgebaute Leiste (Freischaltung) nicht', () => {
    game("setTool('weg')");
    click(4, 4);
    game('buildToolbar()');
    expect(game('!!plan')).toBe(true);
    game("setTool('haus')");
    expect(game('plan')).toBe(null);
  });
});

describe('Rechteck: Abriss und kleine Deko', () => {
  it('Abriss: alles, was ganz drin steht, kommt weg – mit Erstattung; Wald wird gerodet', () => {
    game("state.tiles.set('5,5', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('5,6', { b: 'brunnen', lvl: 1 })");
    game("state.decos.set('6,6', [{ b: 'blumentopf', rot: 0 }, null, null, null]); state.terra.set('7,6', 'forest'); recalc(); setTool('abriss')");
    const m0 = game('state.money');
    dragFromTo([5, 5], [7, 6]);
    const info = game('(() => { const i = planInfo(plan); return { things: i.things, cleared: i.cleared, err: i.err }; })()');
    expect(info).toEqual({ things: 4, cleared: 1, err: null });
    expect(game('planText(plan, planInfo(plan))')).toMatch(/^Abreißen: 4 Dinge \+\d+ · 1 Feld roden\/sprengen −10 · hineinklicken: abreißen$/);
    const gain = game('planInfo(plan).gain');
    click(6, 6);
    expect(at(5, 5)).toBe(undefined); expect(at(6, 5)).toBe(undefined); expect(at(5, 6)).toBe(undefined);
    expect(game("state.decos.has('6,6')")).toBe(false);
    expect(game("state.terra.get('7,6')")).toBe('grass');
    expect(game('state.money')).toBe(m0 + gain - 10);
  });

  it('Abriss: was aus dem Rechteck ragt, bleibt stehen (rot)', () => {
    game("state.tiles.set('5,5', { b: 'schule', lvl: 1, rot: 0 }); recalc(); setTool('abriss')");
    dragFromTo([4, 4], [5, 5]);
    expect(game("planInfo(plan).states.get('5,5')")).toBe('bad');
    click(4, 4);
    expect(at(5, 5)).toBe('schule');
  });

  it('Abriss: Bewohner, die gebraucht werden, bleiben – dann geht gar nichts', () => {
    game("state.tiles.set('5,5', { b: 'haus', lvl: 1 }); state.tiles.set('6,5', { b: 'haus', lvl: 1 }); state.tiles.set('10,10', { b: 'baecker', lvl: 1, rot: 0 }); recalc()");
    game("setTool('abriss')");
    dragFromTo([5, 5], [6, 5]);
    expect(game('T.pop - 8 < T.jobs')).toBe(true);                     // ohne die beiden Häuser fehlen Bäcker
    expect(game('planInfo(plan).err')).toMatch(/arbeiten/);
    click(5, 5);
    expect(at(5, 5)).toBe('haus');
  });

  it('kleine Deko: je Feld eine, in derselben Ecke', () => {
    game("setTool('blumentopf')");
    dragFromTo([4, 4], [6, 5]);
    expect(game('planInfo(plan).n')).toBe(6);
    expect(game('planText(plan, planInfo(plan))')).toMatch(/^Blumentopf ×6 · −\d+/);
    const slot = game('plan.slot');
    click(5, 5);
    for (const [x, y] of [[4, 4], [5, 4], [6, 4], [4, 5], [5, 5], [6, 5]]) expect(game(`decosAt('${x},${y}')[${slot}].b`)).toBe('blumentopf');
  });
});

describe('Mehrere Dinge verschieben', () => {
  const town = () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 2 }); state.tiles.set('5,4', { b: 'weg', lvl: 1, style: 'mulch' }); state.tiles.set('4,5', { b: 'brunnen', lvl: 1 })");
    game("state.decos.set('5,5', [null, { b: 'blumentopf', rot: 0 }, null, null]); recalc(); setTool('verschieben')");
  };
  it('Rechteck aufziehen hebt alles darin an, ein Klick setzt es mit gleichen Abständen ab', () => {
    town();
    dragFromTo([4, 4], [5, 5]);
    expect(game('moving.kind')).toBe('group');
    expect(game('moving.items.length')).toBe(4);
    expect(at(4, 4)).toBe(undefined);                                    // angehoben: der alte Platz ist frei
    hoverAt(10, 10);
    expect(game('groupErrors(10, 10).first')).toBe(null);
    click(10, 10);                                                        // Mitte der Gruppe (cx = cy = 1 → gerundet)
    const o = game('[10 - 1, 10 - 1]');
    expect(at(o[0], o[1])).toBe('haus');
    expect(game(`state.tiles.get('${o[0]},${o[1]}').lvl`)).toBe(2);
    expect(game(`state.tiles.get('${o[0] + 1},${o[1]}').style`)).toBe('mulch');
    expect(at(o[0], o[1] + 1)).toBe('brunnen');
    expect(game(`decosAt('${o[0] + 1},${o[1] + 1}')[1].b`)).toBe('blumentopf');
    expect(game('moving')).toBe(null);
  });

  it('besetztes Ziel: nichts passiert, die Gruppe bleibt in der Hand', () => {
    town();
    game("state.tiles.set('9,9', { b: 'haus', lvl: 1 }); recalc()");        // genau dort, wo das Haus hin soll
    dragFromTo([4, 4], [5, 5]);
    click(10, 10);
    expect(game('moving && moving.kind')).toBe('group');
    expect(game('groupErrors(10, 10).first')).toMatch(/steht/);
    expect(at(9, 9)).toBe('haus');
  });

  it('Esc bzw. anderes Werkzeug legt alles an den alten Platz zurück', () => {
    town();
    dragFromTo([4, 4], [5, 5]);
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    expect(game('moving')).toBe(null);
    expect(at(4, 4)).toBe('haus'); expect(at(5, 4)).toBe('weg'); expect(at(4, 5)).toBe('brunnen');
    expect(game("decosAt('5,5')[1].b")).toBe('blumentopf');
  });

  it('während des Tragens bleibt im Spielstand alles am alten Platz', () => {
    town();
    dragFromTo([4, 4], [5, 5]);
    game('save()');
    const s = game('load()');
    expect(s.tiles.get('4,4').b).toBe('haus');
    expect(s.tiles.get('5,4').b).toBe('weg');
    expect(s.decos.get('5,5')[1].b).toBe('blumentopf');
  });

  it('was hinausragt und das Rathaus bleiben stehen; ein einzelnes Ding wird wie gewohnt getragen', () => {
    game("state.tiles.set('5,5', { b: 'schule', lvl: 1, rot: 0 }); state.tiles.set('8,8', { b: 'haus', lvl: 1 }); recalc(); setTool('verschieben')");
    dragFromTo([4, 4], [5, 5]);
    expect(game('moving')).toBe(null);
    expect(at(5, 5)).toBe('schule');
    dragFromTo([7, 7], [9, 9]);
    expect(game('moving.kind')).toBe('tile');                             // nur das Haus
    game("setTool('look')");
    dragFromTo([1, 1], [3, 3]);                                            // Rathaus (Werkzeug „Ansehen“: Karte ziehen)
    game("setTool('verschieben')");
    dragFromTo([1, 1], [3, 3]);
    expect(at(2, 2)).toBe('rathaus');
  });

  it('iPad: Ziel antippen zeigt die Vorschau, nochmal antippen setzt ab', () => {
    town();
    dragFromTo([4, 4], [5, 5], { touch: true });
    click(11, 11, { touch: true });
    expect(game('moving && moving.kind')).toBe('group');
    click(11, 11, { touch: true });
    expect(game('moving')).toBe(null);
    expect(at(10, 10)).toBe('haus');
  });
});

describe('Neues Spiel oder Import', () => {
  it('was man gerade trägt, kommt nicht mit in den neuen Stand', () => {
    game("state.tiles.set('4,4', { b: 'haus', lvl: 1 }); recalc(); setTool('verschieben'); pickUp(4, 4, 0)");
    expect(game('moving.kind')).toBe('tile');
    game('startNew(); closeModal()');
    expect(game('moving')).toBe(null);
    expect(game('plan')).toBe(null);
  });
});
