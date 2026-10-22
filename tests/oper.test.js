const { loadGame, game } = require('./helpers/load-game');

// Block 161f: 🎭 Opernhaus (Prachtbau nach der Semperoper) – einmal im Spiel, 3×3, Taler, drei Stufen per Knopf;
// Wirkung: „Deine Insel als Lied“ (Spieluhr, je Stufe mehr Instrumente)
beforeAll(() => loadGame());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 22, 12, 0, 0));
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e10; state.festival = true");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
});
afterEach(() => vi.useRealTimers());

describe('Opernhaus', () => {
  it('3×3, nach dem Laternenfest, im Baumenü unter Freizeit → Kultur; Bild in allen Stufen, Tag/Nacht/weit, ohne Fehler', () => {
    expect(game('[ITEMS.oper.size, ITEMS.oper.cost, !!BIG_ART.oper]')).toEqual([[3, 3], 500e6, true]);
    expect(game("MENU.find(m => m.id === 'freizeit').groups.find(gr => gr.id === 'kultur').items")).toContain('oper');
    game('state.festival = false');
    expect(game("unlockOk(ITEMS.oper, 'oper')")).toBe(false);
    game('state.festival = true');
    expect(game("unlockOk(ITEMS.oper, 'oper')")).toBe(true);
    for (const lvl of [1, 2, 3]) for (const [zz, n] of [[2, 0], [2, 1], [0.4, 0]])   // drawObject schluckt Fehler – darum das Bild direkt
      game(`(() => { const nv = night; night = ${n}; try { OPER_ART(kit(400, 300, ${zz}, 0), ${lvl}); } finally { night = nv; } })()`);
    expect(game("spriteTop('oper', 3, 3) >= ITEMS.oper.h + 20")).toBe(true);
  });
  it('gibt es nur einmal; Ausbau kostet 1,5 / 4 Mrd, mehr Schönheit je Stufe; Abriss gibt alles zurück', () => {
    expect(game("build('oper', 4, 4)")).toBeTruthy();
    expect(game("placeError('oper', 12, 12)")).toBe('Das Opernhaus gibt es schon');
    const m0 = game('state.money'), b1 = game("beautyOf(state.tiles.get('4,4'), 4, 4)");
    expect(game('operUpgrade(4, 4)')).toBe(true);
    expect(game("[state.tiles.get('4,4').lvl, state.money]")).toEqual([2, m0 - 1.5e9]);
    expect(game("beautyOf(state.tiles.get('4,4'), 4, 4)")).toBe(b1 * 2);
    expect(game('operUpgrade(4, 4)')).toBe(true);
    expect(game("[state.tiles.get('4,4').lvl, state.money]")).toEqual([3, m0 - 5.5e9]);
    expect(game('operUpgrade(4, 4)')).toBe(false);                          // höchste Stufe
    expect(game('demolishInfo(4, 4).refund')).toBe(500e6 + 5.5e9);
  });
  it('Ausbau ohne genug Taler geht nicht; Infofenster zeigt Lied-Knopf und Ausbau', () => {
    game("build('oper', 4, 4); state.money = 1e9");
    expect(game('operUpgrade(4, 4)')).toBe(false);
    expect(game("state.tiles.get('4,4').lvl")).toBe(1);
    game('openInfo(4, 4)');
    const html = game("document.getElementById('panel').innerHTML");
    expect(html).toContain('id="p-oper-lied"');
    expect(html).toContain('▶ Lied spielen');
    expect(html).toContain('Nächste Stufe: Großes Opernhaus');
    game('closePanel()');
  });
  it('Lied: Takte folgen dem, was gebaut ist (Häuser ruhig, Läden lebhaft, Wahrzeichen Fanfare)', () => {
    game("for (let x = 0; x < 8; x++) build('haus', x, 0); for (let y = 2; y < 10; y++) build('weg', 0, y); build('oper', 10, 14)");
    const sc = game('(() => { const s = OPER_LIED.score(); return { kinds: s.bars.map(b => b.kind), n: s.steps.length, first: s.first, last: s.last }; })()');
    expect(sc.kinds).toContain('haus');
    expect(sc.kinds).toContain('fest');
    expect(sc.first).toBeGreaterThanOrEqual(4);                             // vier Schläge Meer davor
    expect(sc.n - 1 - sc.last).toBeGreaterThanOrEqual(4);
  });
  it('Bauklänge: Ton der Stelle aus dem Lied (Fünftonleiter), Takt fürs Ausbauen; ohne Opernhaus der gewohnte Klang', () => {
    game("for (let x = 0; x < 8; x++) build('haus', x, 0)");
    expect(game('operTone(3, 0)')).toBe(false);                             // kein Opernhaus
    game("build('oper', 10, 14)");
    const n = game('OPER_LIED.noteAt(3, 0)');
    const inScale = f => { const semi = Math.round(12 * Math.log2(f / 261.63)); return [0, 2, 4, 7, 9].includes(((semi % 12) + 12) % 12); };
    expect(inScale(n.f)).toBe(true);
    expect(n.phrase.filter(Boolean).every(inScale)).toBe(true);
    expect(n.phrase).toHaveLength(8);
    expect(game('OPER_LIED.noteAt(40, -40)')).toBe(null);                   // fremde Stelle ohne Lied: kein Ton
  });
  it('ohne Ton: freundlicher Hinweis statt Fehler', () => {
    game('state.muted = true');
    expect(game('operPlay(1)')).toBe(false);
    expect(game('operPlaying()')).toBe(false);
    game('state.muted = false');
  });
});
