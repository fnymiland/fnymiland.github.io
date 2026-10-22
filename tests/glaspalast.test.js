const { loadGame, game } = require('./helpers/load-game');

// Block 161f: 🏛️ Glaspalast (Prachtbau nach dem Grand Palais) – einmal, 4×3, Taler, drei Stufen; ab Stufe 2 Vitrine in der Kuppel
// mit einem Ausstellungsstück, das man besitzt (wird gespeichert)
beforeAll(() => loadGame());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 22, 12, 0, 0));
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e11; state.festival = true");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
});
afterEach(() => vi.useRealTimers());

describe('Glaspalast', () => {
  it('4×3, Freizeit → Kultur, nach dem Laternenfest; Bild in allen Stufen mit und ohne Stück, Tag/Nacht/weit, ohne Fehler', () => {
    expect(game('[ITEMS.glaspalast.size, ITEMS.glaspalast.cost, !!BIG_ART.glaspalast]')).toEqual([[4, 3], 1e9, true]);
    expect(game("MENU.find(m => m.id === 'freizeit').groups.find(gr => gr.id === 'kultur').items")).toContain('glaspalast');
    game('state.festival = false');
    expect(game("unlockOk(ITEMS.glaspalast, 'glaspalast')")).toBe(false);
    game('state.festival = true');
    for (const lvl of [1, 2, 3]) for (const st of ['', 'haus', 'mon_pagode']) for (const [zz, n] of [[2, 0], [2, 1], [0.4, 0]])   // drawObject schluckt Fehler – darum das Bild direkt
      game(`(() => { const nv = night; night = ${n}; try { GLAS_ART(kit(400, 300, ${zz}, 0), ${lvl}, { stueck: '${st}' || undefined }); } finally { night = nv; } })()`);
    expect(game("spriteTop('glaspalast', 4, 3) >= ITEMS.glaspalast.h + 20")).toBe(true);
  });
  it('gibt es nur einmal; Ausbau 3 / 8 Mrd (gemeinsam mit dem Opernhaus: prachtUpgrade), Schönheit je Stufe, Abriss gibt alles zurück', () => {
    expect(game("build('glaspalast', 4, 4)")).toBeTruthy();
    expect(game("placeError('glaspalast', 12, 12)")).toBe('Der Glaspalast gibt es schon');
    const m0 = game('state.money'), b1 = game("beautyOf(state.tiles.get('4,4'), 4, 4)");
    expect(game('prachtUpgrade(4, 4)')).toBe(true);
    expect(game("[state.tiles.get('4,4').lvl, state.money]")).toEqual([2, m0 - 3e9]);
    expect(game("beautyOf(state.tiles.get('4,4'), 4, 4)")).toBe(b1 * 2);
    expect(game('prachtUpgrade(4, 4)')).toBe(true);
    expect(game('prachtUpgrade(4, 4)')).toBe(false);
    expect(game('demolishInfo(4, 4).refund')).toBe(1e9 + 11e9);
  });
  it('Vitrine erst ab Stufe 2; nur Seltenes (Basar) und Freigeschaltetes aus Besonderes, keine Häuser; Stück wird gespeichert', () => {
    game("build('glaspalast', 4, 4); build('haus', 12, 12); state.sdItems = new Set(['mon_stern'])");
    expect(game("glasSetStueck(4, 4, 'mon_stern')")).toBe(false);            // Stufe 1: keine Vitrine
    game('prachtUpgrade(4, 4)');
    expect(game('glasChoices()')).toContain('mon_stern');
    expect(game('glasChoices()')).not.toContain('haus');                     // „ein Haus da oben drin ist doch stupid“
    expect(game('glasChoices()')).not.toContain('glaspalast');
    expect(game("glasSetStueck(4, 4, 'mon_pagode')")).toBe(false);           // nicht gekauft
    expect(game("glasChoices().includes('pokal_gold')")).toBe(game("unlockOk(ITEMS.pokal_gold, 'pokal_gold')"));   // Pokal nur mit den Erfolgen
    expect(game("glasSetStueck(4, 4, 'mon_stern')")).toBe(true);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
    expect(game("state.tiles.get('4,4').stueck")).toBe('mon_stern');
    game('openInfo(4, 4)');
    const html = game("document.getElementById('panel').innerHTML");
    expect(html).toContain('data-glas="mon_stern"');
    expect(html).toContain('Vitrine leeren');
    game('closePanel()');
    expect(game("glasSetStueck(4, 4, '')")).toBe(true);
    expect(game("state.tiles.get('4,4').stueck")).toBe(undefined);
  });
});
