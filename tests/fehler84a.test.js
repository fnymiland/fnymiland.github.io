const { loadGame, game } = require('./helpers/load-game');

// Block 84a: Spielstand und Rückgängig – Fehler aus der großen Fehlersuche
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; undoStack.length = 0; undoPending = null");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  // Küste: Land bis x = 12, Wasser ab x = 13
  game("for (let y = 4; y <= 18; y++) for (let x = 4; x <= 18; x++) { state.terra.set(x + ',' + y, x >= 13 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } waterChanged(); sandCache.clear()");
  game("for (let x = 4; x <= 10; x++) state.tiles.set(x + ',18', { b: 'haus', lvl: 5 }); nameHouses(); recalc()");
});
const count = b => game(`[...state.tiles.values()].filter(t => t.b === '${b}').length`);
const reload = (v) => { const d = game('JSON.parse(JSON.stringify(serialize()))'); if (v) d.v = v; game(`adoptState(parseSave(${JSON.stringify(d)}))`); };

describe('Verschieben und Rückgängig (84a)', () => {
  it('etwas anderes aus einem Fenster aufheben legt das Getragene erst zurück', () => {
    game("build('brunnen', 8, 8, true); setTool('verschieben'); undoable(() => pickUp(8, 8, 0))");
    expect(count('brunnen')).toBe(0);
    game('startMove(1, 1)');                                            // „✋ Rathaus verschieben“
    expect(game('movingType()')).toBe('rathaus');
    expect(game("state.tiles.get('8,8') && state.tiles.get('8,8').b")).toBe('brunnen');
    game("setTool('look')");
    expect(count('brunnen')).toBe(1);
    expect(game("serialize().tiles.filter(([k, t]) => t.b === 'brunnen').length")).toBe(1);
  });

  it('↶ nach „Neue Insel“ und nach dem Laden einer Datei gilt nicht mehr fürs alte Spiel', () => {
    game("undoable(() => build('haus', 8, 8, true)); undoable(() => demolish(8, 8))");
    game('startNew()');
    expect(game('undoStack.length')).toBe(0);
    expect(game('undo()')).toBe(false);
    expect(game("state.tiles.has('8,8')")).toBe(false);
    game("build('brunnen', 8, 8, true); setTool('verschieben'); undoable(() => pickUp(8, 8, 0))");
    reload();
    expect(game('undoPending')).toBe(null);
  });

  it('↶ nach dem Verschieben bucht nur das Verschieben zurück – nicht, was man währenddessen verdient oder gekauft hat', () => {
    game("build('brunnen', 8, 8, true); setTool('verschieben'); undoable(() => pickUp(8, 8, 0))");
    game('state.money += 5000; state.res.holz += 50');
    const m = game('state.money'), h = game('state.res.holz');
    game('undoable(() => dropAt(10, 10, 0))');
    expect(game('undo()')).toBe(true);
    expect(game("state.tiles.get('8,8').b")).toBe('brunnen');
    expect(game('state.money')).toBe(m);
    expect(game('state.res.holz')).toBe(h);
  });

  it('Tragen abgebrochen (Esc/anderes Werkzeug): das nächste ↶ spult nicht die Zwischenzeit zurück', () => {
    game("build('brunnen', 8, 8, true); setTool('verschieben'); undoable(() => pickUp(8, 8, 0)); setTool('look')");
    expect(game('undoPending')).toBe(null);
    game('state.money += 500000');
    const m = game('state.money');
    game("undoable(() => build('weg', 10, 10, true))");
    expect(game('undo()')).toBe(true);
    expect(game('state.money')).toBe(m);
  });

  it('das Laternenfest lässt sich nicht per ↶ zurückkaufen', () => {
    game("for (let x = 4; x <= 10; x++) state.tiles.set(x + ',17', { b: 'haus', lvl: 5 }); recalc()");
    game("state.money = 1e8; undoable(() => build('weg', 6, 6, true)); undoable(() => build('leuchtturm', 10, 6)); closeModal()");
    expect(game('state.festival')).toBe(true);
    expect(game('undoStack.length')).toBe(0);
    expect(game('undo()')).toBe(false);
    expect(count('leuchtturm')).toBe(1);
  });

  it('↶ stellt kein großes Gebäude über inzwischen Gebautes', () => {
    game("undoable(() => build('schule', 6, 6, true)); undoable(() => demolish(6, 6)); build('haus', 7, 7, true)");
    expect(game('undo()')).toBe(false);
    expect(count('schule')).toBe(0);
    expect(game("state.tiles.get('7,7').b")).toBe('haus');
  });
});

describe('Laden und Aufschütten (84a)', () => {
  it('Aufschütten geht nicht unter Gebäuden und nicht vor dem letzten Wasser eines Ufer-Gebäudes', () => {
    game("state.tiles.set('13,8', { b: 'hausboot', lvl: 1 }); state.tiles.set('12,12', { b: 'fischer', lvl: 1 }); recalc()");
    expect(game("placeError('schuett', 13, 8, 0)")).toBeTruthy();
    for (let y = 9; y <= 16; y++) if (y !== 12) game(`state.terra.set('13,${y}', 'grass')`);
    game('waterChanged(); recalc()');
    expect(game("placeError('schuett', 13, 12, 0)")).toMatch(/Wasser/);
    expect(game("placeError('schuett', 14, 12, 0)")).toBe(null);
  });

  it('aktuelle Stände werden beim Laden nicht mehr nach heutigen Bauregeln umgeräumt (nur alte)', () => {
    game('state.festival = true');
    game("for (let y = 4; y <= 12; y++) for (let x = 4; x <= 9; x++) build('fzboden', x, y, true); rotManual = true; buildRot = 0; build('fz_schloss', 6, 6, true); recalc()");
    game('state.money = 1e9; castleChange(6, 6, { w: 3 })');
    const [k] = game("[...state.tiles].find(([k, t]) => t.b === 'fz_schloss')");
    reload();
    expect(game("[...state.tiles].find(([k, t]) => t.b === 'fz_schloss')[0]")).toBe(k);
    reload(11);                                                          // alter Stand: geprüft wird mit der echten Gestalt
    expect(game("[...state.tiles].find(([k, t]) => t.b === 'fz_schloss')[0]")).toBe(k);
    expect(game("state.tiles.get(k = [...state.tiles].find(([k, t]) => t.b === 'fz_schloss')[0]).cs.w")).toBe(3);
  });

  it('das Kap wächst nicht auf Parkrasen', () => {
    game("state.tiles.set('12,8', { b: 'leuchtturm', lvl: 1, rot: 0, mini: true }); for (let y = 6; y <= 10; y++) for (let x = 10; x <= 12; x++) if (!(x === 12 && y === 8)) state.terra.set(x + ',' + y, 'park'); recalc()");
    game("growLighthouse('12,8')");
    const t = game("[...state.tiles].find(([k, t]) => t.b === 'leuchtturm')");
    if (!t[1].mini) {
      const fp = game(`footprint('leuchtturm', ...keyXY('${t[0]}'), ${t[1].rot || 0}).map(p => terraLook(...p))`);
      expect(fp).not.toContain('park');
    }
    reload();
    expect(count('leuchtturm')).toBe(1);
  });

  it('alter Stand: ein wachsender Hafen reißt den alten kleinen Leuchtturm nicht ab', () => {
    game("state.tiles.set('12,8', { b: 'hafen', lvl: 1, rot: 0 }); state.tiles.set('11,7', { b: 'leuchtturm', lvl: 1, rot: 0 })");
    const m = game('state.money');
    reload(10);
    expect(count('leuchtturm')).toBe(1);
    expect(game('state.money')).toBeLessThan(m + 1e6);
  });

  it('beim normalen Start werden Erfolge still gezählt', () => {
    expect(game('typeof afterLoad')).toBe('function');
    game('state.achieved = {}; afterLoad(); ');
    expect(game('Object.keys(state.achieved).length')).toBeGreaterThan(0);
  });
});

describe('Unlesbarer Stand und Neue Insel (84a)', () => {
  it('kann die Kopie nicht gespeichert werden, wird der kaputte Stand nicht überschrieben', () => {
    game("localStorage.setItem(SAVE_KEY, '{kaputt'); window.__si = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k.includes('_defekt_')) throw new Error('voll'); return window.__si.call(this, k, v); }");
    expect(game('load()')).toBe(null);
    game('Storage.prototype.setItem = window.__si');
    expect(game('loadFailure')).toBe('nicht gesichert');
    game('save()');
    expect(game('localStorage.getItem(SAVE_KEY)')).toBe('{kaputt');
    game('loadFailure = null; saveBlocked = false; localStorage.clear()');
  });

  it('„Neue Insel beginnen“ fragt in einem eigenen Fenster – zweimal schnell tippen löscht nichts', () => {
    game('state.money = 777777; showSaveMenu()');
    game("document.getElementById('m-reset').click()");
    expect(game("!!document.getElementById('m-reset')")).toBe(false);          // anderes Fenster, anderer Knopf
    expect(game('state.money')).toBe(777777);
    game("document.getElementById('m-no').click()");
    expect(game('state.money')).toBe(777777);
  });
});
