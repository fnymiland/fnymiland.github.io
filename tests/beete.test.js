const { loadGame, game } = require('./helpers/load-game');

// Block 152: Beete in neun Formen, Boden wählbar (Rindenmulch, Kies, Grün frei; Gartenerde in der Kunstakademie)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 3; y <= 20; y++) for (let x = 3; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } recalc()");
});

describe('Beete (Block 152)', () => {
  it('neun Formen, Boden als Auswahl; zwei Formen und drei Böden frei, der Rest in der Kunstakademie', () => {
    expect(game("DECO_LOOKS.blumen.forms.map(f => f.id)")).toEqual(['feld', 'stein', 'rund', 'rosen', 'tulpen', 'lavendel', 'hochbeet', 'sonnen', 'wild']);
    expect(game("DECO_LOOKS.blumen.cols.map(c => c.id)")).toEqual(['mulch', 'kies', 'gruen', 'erde']);
    expect(game("[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => lookOk('blumen', 'form', i))")).toEqual([true, true, false, false, false, false, false, false, false]);
    expect(game("[0, 1, 2, 3].map(i => lookOk('blumen', 'col', i))")).toEqual([true, true, true, false]);
    expect(game("!!DESIGN_BY_ID['blumen:form:rosen'] && !!DESIGN_BY_ID['blumen:col:erde']")).toBe(true);
  });
  it('alle Formen × Größen × Böden zeichnen ohne Fehler, nah und weit, Tag und Nacht', () => {
    game("for (const d of DESIGN) state.design.add(d.id)");
    for (const [b, x] of [['blumen', 4], ['blumen_l', 8], ['blumen_xl', 13]]) for (let f = 0; f < 9; f++) for (let c = 0; c < 4; c++)
      game(`drawObject('${b}', 0, 0, 1.5, 0, ${x}, 4, 1, { b: '${b}', form: ${f}, col: ${c} })`);
    game("state.tiles.set('5,5', { b: 'blumen', lvl: 1, form: 3, col: 1 }); state.tiles.set('8,8', { b: 'blumen_l', lvl: 1, form: 7 }); recalc()");
    for (const z of [2.5, 0.6]) game(`(() => { cam = state.cam; cam.z = ${z}; const p = iso(7, 7); cam.x = p.x; cam.y = p.y; render(1e6); render(1e6 + 17); })()`);
  });
  it('im Fenster heißt die Auswahl „Boden“; alte Beete ohne Wahl liegen auf Rindenmulch und behalten Form/Boden beim Speichern', () => {
    game("state.tiles.set('6,6', { b: 'blumen', lvl: 1 }); recalc(); openInfo(6, 6)");
    expect(game("[...document.querySelectorAll('#panel .label')].some(l => l.textContent === 'Boden')")).toBe(true);
    expect(game("(BED_SOILS[state.tiles.get('6,6').col || 0]).id")).toBe('mulch');
    game("closePanel(); state.tiles.get('6,6').form = 4; state.tiles.get('6,6').col = 1; adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()");
    expect(game("[state.tiles.get('6,6').form, state.tiles.get('6,6').col]")).toEqual([4, 1]);
  });
});
