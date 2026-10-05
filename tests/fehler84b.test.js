const { loadGame, game } = require('./helpers/load-game');

// Block 84b: Bauen, Verschieben, Abreißen – Fehler aus der großen Fehlersuche
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; resetUndo()");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = 4; y <= 18; y++) for (let x = 4; x <= 18; x++) { state.terra.set(x + ',' + y, x >= 13 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); waterChanged(); sandCache.clear()");
  game("for (let x = 4; x <= 10; x++) state.tiles.set(x + ',18', { b: 'haus', lvl: 5 }); nameHouses(); recalc()");
});
const W = (x, y) => game(`state.tiles.set('${x},${y}', { b: 'weg', lvl: 1, style: 'sand' })`);

describe('Bauregeln (84b)', () => {
  it('auf einem Weg gilt die Geländebedingung weiter', () => {
    W(8, 8); game('recalc()');
    expect(game("placeError('kristallmine', 8, 8, 0)")).toMatch(/Kristallfels/);
    game("state.techs.delete(ANYWHERE.forest.tech)");
    expect(game("placeError('holz', 8, 8, 0)")).toMatch(/Wald/);
  });
  it('Mehrfeld-Gebäude nicht quer über Zaun, Hecke, Mauer', () => {
    game("state.edges.set('a7,7', { b: 'zaun', style: STYLES.zaun[0].id }); recalc()");
    expect(game("placeError('schule', 6, 6, 0)")).toMatch(/Zaun|Linie|Hecke/);
    expect(game("placeError('schule', 8, 8, 0)")).toBe(null);
  });
  it('kleine Deko: kein Gebäude über eine Bank in der Seitenmitte, kein Teich unter Dekos', () => {
    game("state.decos.set('8,8', newSlots()); state.decos.get('8,8')[4] = { b: 'bank', rot: 0 }; recalc()");
    expect(game("placeError('haus', 8, 8, 0)")).toBeTruthy();
    game("state.decos.set('9,9', newSlots()); state.decos.get('9,9')[0] = { b: 'baum', rot: 0 }; recalc()");
    expect(game("placeError('graben', 9, 9, 0)")).toBeTruthy();
  });
  it('Parkrasen im Wald: die geschenkten Bäume bringen beim Entfernen nichts', () => {
    game("state.terra.set('8,8', 'forest'); recalc(); build('parkrasen', 8, 8, true)");
    const m = game('state.money');
    game("for (let s = 0; s < 8; s++) removeSmall(8, 8, s)");
    expect(game('state.money')).toBe(m);
  });
  it('Haus: „Neu gebaute bekommen diese Farben“ wirkt', () => {
    game('state.paintNew.haus = { wall: 1, roof: 1 }');
    for (const x of [6, 8, 10]) game(`build('haus', ${x}, 6, true)`);
    expect(game("[6, 8, 10].map(x => state.tiles.get(x + ',6').wall + '/' + state.tiles.get(x + ',6').roof)")).toEqual(['1/1', '1/1', '1/1']);
  });
  it('großes Glashaus lässt sich drehen; eine Freischaltung setzt die Drehung nicht zurück', () => {
    expect(game("ROTATABLE.has('glashaus_l')")).toBe(true);
    game("setTool('haus'); rotateBuild()");
    expect(game('rotManual')).toBe(true);
    game("setTool('haus')");
    expect(game('rotManual')).toBe(true);
  });
});

describe('Abreißen und Erstatten (84b)', () => {
  it('Haus: Ausbau-Taler zur Hälfte zurück, mit Rückfrage', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 5 }); recalc()");
    const i = game('demolishInfo(8, 8)');
    expect(i.refund).toBeGreaterThan(1000);
    expect(i.lost).toBeGreaterThanOrEqual(game('DEL_ASK'));
  });
  it('Hafen: gekaufte Schiffe kommen beim Abriss voll zurück', () => {
    game("state.tiles.set('10,8', { b: 'hafen', lvl: 1, rot: 0, ships: [{ model: 'katamaran', to: 'x' }, { model: 'katamaran', to: 'x' }] }); recalc()");
    const i = game('demolishInfo(10, 8)'), m = game('state.money'), k = game('state.res.kristall');
    expect(i.refund).toBeGreaterThanOrEqual(100000);
    game('demolish(10, 8)');
    expect(game('state.money')).toBe(m + i.refund);
    expect(game('state.res.kristall')).toBe(k + 16);
  });
  it('Leuchtturm: erstattet wird der bezahlte Preis, nicht der heutige', () => {
    game("state.money = 1e9; build('leuchtturm', 10, 6); closeModal(); state.incPeak = 1e6");
    expect(game('demolishInfo(10, 6).refund')).toBeLessThanOrEqual(7.5e6);
  });
  it('Einwohner beim Abriss: zählt wie im Spiel (Villa 16, nicht 20)', () => {
    game("for (let x = 4; x <= 10; x++) state.tiles.delete(x + ',18'); state.tiles.set('8,8', { b: 'haus', lvl: 5 }); state.tiles.set('6,6', { b: 'haus', lvl: 1 }); state.tiles.set('10,10', { b: 'saege', lvl: 1, rot: 0 }); state.tiles.set('10,12', { b: 'saege', lvl: 1, rot: 0 }); recalc()");
    expect(game('T.pop - T.jobs')).toBeGreaterThanOrEqual(16);
    expect(game('demolishInfo(8, 8).err')).toBe(undefined);
  });
  it('Linie über eine andere ziehen: die alte wird erstattet', () => {
    game("chosenStyle.mauer = STYLES.mauer[0].id; chosenStyle.hecke = STYLES.hecke[0].id; buildEdge('mauer', 'a8,8')");
    const m = game('state.money'), q = game('state.res.quader');
    game("buildEdge('hecke', 'a8,8')");
    expect(game('state.money')).toBe(m - game('ITEMS.hecke.cost') + game('ITEMS.mauer.cost'));
    expect(game('state.res.quader')).toBe(q + (game('ITEMS.mauer.mat.quader') || 0));
  });
});

describe('Verschieben (84b)', () => {
  it('Weg nicht auf eine Schiene (und umgekehrt) – das Ziel ginge verloren', () => {
    game("for (let x = 8; x <= 10; x++) state.tiles.set(x + ',10', { b: 'schiene', lvl: 1 }); recalc()");
    W(6, 6); game("recalc(); setTool('verschieben'); undoable(() => pickUp(6, 6, 0))");
    expect(game('moveError(9, 10, 0)')).toBeTruthy();
    game("setTool('look')");
  });
  it('Brücken: eine Brücke nicht an Land, ein Weg nicht ohne Brücke aufs Wasser', () => {
    game("state.tiles.set('13,8', { b: 'weg', lvl: 1, style: 'sand', bridge: true })"); W(12, 8); W(6, 6);
    game("recalc(); setTool('verschieben'); undoable(() => pickUp(13, 8, 0))");
    expect(game('moveError(8, 8, 0)')).toMatch(/Brücke/);
    game("setTool('look'); setTool('verschieben'); undoable(() => pickUp(6, 6, 0))");
    expect(game('moveError(13, 9, 0)')).toMatch(/Brücke/);
    game("setTool('look')");
  });
  it('ins Meer verschoben: das Feld gehört danach dir', () => {
    const spots = game("(() => { const out = []; for (let y = -70; y <= 70; y++) for (let x = -70; x <= 70; x++) if (isSea(x, y) && !ownedTile(x, y) && claimable(x, y) && nearOwnLand(x, y)) out.push([x, y]); return out; })()");
    expect(spots.length).toBeGreaterThan(1);
    const [a, b] = [spots[0], spots[spots.length - 1]];
    expect(game(`build('hausboot', ${a[0]}, ${a[1]}, true)`)).toBe(true);
    game(`setTool('verschieben'); undoable(() => pickUp(${a[0]}, ${a[1]}, 0)); undoable(() => dropAt(${b[0]}, ${b[1]}, 0)); setTool('look')`);
    expect(game(`state.tiles.get('${b[0]},${b[1]}') && state.tiles.get('${b[0]},${b[1]}').b`)).toBe('hausboot');
    expect(game(`ownedTile(${b[0]}, ${b[1]})`)).toBe(true);
  });
  it('✋ im Hausfenster hebt das Haus auf, nicht die Deko in der Ecke', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1, rot: 0 }); state.decos.set('8,8', newSlots()); state.decos.get('8,8')[0] = { b: 'blumentopf', rot: 0 }; recalc(); openInfo(8, 8)");
    game("document.getElementById('p-move').click()");
    expect(game('movingType()')).toBe('haus');
    game("setTool('look')");
  });
  it('Deko-Fenster schließt, wenn ↶ die Deko wegnimmt', () => {
    W(8, 8); game("recalc(); undoable(() => buildSmall('bank', 8, 8, 4)); openDecoInfo(8, 8, 4)");
    expect(game("document.getElementById('panel').hidden")).toBe(false);
    game('undo()');
    expect(game("document.getElementById('panel').hidden")).toBe(true);
  });
  it('iPad: Zaun beim Abreißen – erstes Tippen zeigt, zweites entfernt', () => {
    game("chosenStyle.zaun = STYLES.zaun[0].id; buildEdge('zaun', 'a8,8'); recalc(); resize(); const c = iso(8, 8); cam.x = c.x; cam.y = c.y; cam.z = 2; setTool('abriss')");
    const p = game('(() => { const a = toScreen(8, 7), b = toScreen(8, 8); return [(a.x + b.x) / 2, (a.y + b.y) / 2]; })()');
    expect(game(`edgeNear(${p[0]}, ${p[1]})`)).toBe('a8,8');
    game(`tap(${p[0]}, ${p[1]}, true)`);
    expect(game("state.edges.has('a8,8')")).toBe(true);
    game(`tap(${p[0]}, ${p[1]}, true)`);
    expect(game("state.edges.has('a8,8')")).toBe(false);
    game("setTool('look')");
  });
});
