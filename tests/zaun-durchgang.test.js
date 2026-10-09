const { loadGame, game } = require('./helpers/load-game');

// Nutzer, 09.10.2026: „warum kann ich um einen Brunnen keinen Zaun herummachen?“ – auf einem Platz liegt unter dem Brunnen Weg, jede
// Seite wurde ein Durchgang. Gewählt: nichts ändert sich von selbst, im Fenster der Linie „Durchgang / geschlossen“ (e.shut)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 999; for (const d of DESIGN) state.design.add(d.id)');
  game("for (let y = 0; y <= 12; y++) for (let x = 0; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc(); resetUndo()");
  game("for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'kopf' }); state.tiles.set('5,5', { b: 'brunnen', lvl: 1, weg: 'kopf' }); recalc()");
});

describe('Zaun um Dinge auf einem Platz', () => {
  it('Durchgang bleibt wie bisher; im Fenster schließen – gespeichert, ↶ geht, wieder öffnen', () => {
    game("buildEdge('zaun', 'b5,5')");
    expect(game("isGate('b5,5')")).toBe(true);                                      // wie bisher: von selbst ein Durchgang
    game("openGateInfo('b5,5')");
    expect(game("[...document.querySelectorAll('#panel [data-shut]')].map(b => b.textContent)")).toEqual(['⬜ Durchgang', 'Zaun geschlossen']);
    game("undoable(() => document.querySelector('#panel [data-shut=\"1\"]').click())");
    expect(game("[isGate('b5,5'), state.edges.get('b5,5').shut]")).toEqual([false, true]);
    const back = game("(() => { const s = parseSave(JSON.parse(JSON.stringify(serialize()))); return new Map(s.edges).get('b5,5'); })()");
    expect(back.shut).toBe(true);
    game('undo()');
    expect(game("isGate('b5,5')")).toBe(true);
    game("setShut('b5,5', true); setShut('b5,5', false)");
    expect(game("[isGate('b5,5'), 'shut' in state.edges.get('b5,5')]")).toEqual([true, false]);
  });

  it('Schließen nimmt einen Bogen weg (Taler zurück); auf Wiese gibt es den Schalter nicht', () => {
    game("buildEdge('zaun', 'a5,5'); setArch('a5,5', 'rosen')");
    const m = game('state.money');
    expect(game("setShut('a5,5', true)")).toBe(true);
    expect(game("state.edges.get('a5,5').arch")).toBe(undefined);
    expect(game('state.money')).toBe(m + game('ARCHES.rosen.cost'));
    game("buildEdge('zaun', 'a9,9'); openGateInfo('a9,9')");
    expect(game("document.querySelectorAll('#panel [data-shut]').length")).toBe(0);
  });
});
