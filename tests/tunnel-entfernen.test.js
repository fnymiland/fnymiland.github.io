const { loadGame, game } = require('./helpers/load-game');

// Tunnel entfernen im Tunnel-Werkzeug (Nutzer, 09.10.2026: „in der Tunnel-ziehen-Ansicht auch eine Tunnel-löschen-Ansicht, damit man
// nicht immer die halbe Stadt umbauen muss“): Schalter + Graben / − Entfernen; entfernt nur den Tunnel, oben bleibt alles stehen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999');
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); state.claimed.add(x + ',' + y); }");
  game("state.restore.erzberg = 1; state.techs.add('bahn'); state.techs.add('ubahn'); state.tunnels.clear(); recalc(); resetUndo(); setTool('look')");
});
const tunnels = () => game('[...state.tunnels.keys()].sort()');

describe('Tunnel entfernen im Tunnel-Werkzeug', () => {
  it('Schalter über der Leiste: Graben / Entfernen; anderes Werkzeug setzt auf Graben zurück', () => {
    game("setTool('tunnel')");
    expect(game("[...document.querySelectorAll('#style-bar [data-terase]')].map(b => b.textContent)")).toEqual(['+Graben', '−Entfernen']);
    game("document.querySelector('#style-bar [data-terase=\"1\"]').click()");
    expect(game('tunnelErase')).toBe(true);
    expect(game("document.querySelector('#style-bar [data-terase=\"1\"]').classList.contains('on')")).toBe(true);
    game("setTool('look'); setTool('tunnel')");
    expect(game('tunnelErase')).toBe(false);
  });

  it('Linie entfernt nur Tunnel – Haus und Weg darüber bleiben, Taler voll zurück; ↶ holt sie wieder', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 1 }); state.tiles.set('9,8', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    for (let x = 7; x <= 11; x++) game(`build('tunnel', ${x}, 8, true)`);
    const m = game('state.money'), back = game("[7, 8, 9].reduce((s, x) => s + costOf('tunnel', x, 8).cost, 0)");
    game("setTool('tunnel'); tunnelErase = true; startPlan('line', { x: 7, y: 8 }, { x: 9, y: 8 }, true)");
    expect(game('planText(plan, planInfo(plan))')).toContain('Tunnel entfernen: 3 Felder');
    game('undoable(() => runPlan())');
    expect(tunnels()).toEqual(['10,8', '11,8']);
    expect(game("[state.tiles.get('8,8').b, state.tiles.get('9,8').b]")).toEqual(['haus', 'weg']);
    expect(game('state.money')).toBe(m + back);
    game('undo()');
    expect(tunnels().length).toBe(5);
  });

  it('unter einer U-Bahn-Station nicht; ohne Tunnel: Hinweis', () => {
    game("build('tunnel', 12, 12, true); build('tunnel', 13, 12, true); build('ubahn', 12, 12, true)");
    expect(game("bAt(12, 12)")).toBe('ubahn');
    game("setTool('tunnel'); tunnelErase = true; startPlan('line', { x: 12, y: 12 }, { x: 13, y: 12 }, true)");
    const info = game('(() => { const i = planInfo(plan); return { n: i.n, bad: i.bad }; })()');
    expect(info).toEqual({ n: 1, bad: 1 });
    game('runPlan()');
    expect(tunnels()).toEqual(['12,12']);
    game("startPlan('line', { x: 15, y: 15 }, { x: 16, y: 15 }, true)");
    expect(game('planInfo(plan).err')).toBe('Hier liegt kein Tunnel');
  });
});
