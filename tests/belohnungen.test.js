const { loadGame, game } = require('./helpers/load-game');

// Block 163 (PLAN-163.md, Nutzer 21.10.2026: „zu schnell zu viel, zu wenig Ziele, Belohnungen langweilig“):
// ✦ Meisterstücke für ✨, Fenster/Brücken/Flaggenfarben je 3 frei, Baupläne aus Truhen und Erfolgen
beforeAll(() => loadGame());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e12; state.science = 1e9");
});
afterEach(() => vi.useRealTimers());

describe('163a Meisterstücke für Sternstaub', () => {
  it('jedes ✦ kostet 100–200 ✨, keine Taler und Ideen; zusammen gut 1.300 ✨', () => {
    const m = game('DESIGN.filter(d => d.master).map(d => [d.id, designStardust(d), designPrice(d), designIdeas(d)])');
    expect(m.length).toBeGreaterThanOrEqual(10);
    for (const [id, sd, p, i] of m) { expect(sd, id).toBeGreaterThanOrEqual(100); expect(sd, id).toBeLessThanOrEqual(200); expect([p, i], id).toEqual([0, 0]); }
    expect(m.reduce((n, x) => n + x[1], 0)).toBeGreaterThan(1200);
    expect(game("designStardust(DESIGN_BY_ID['wall:5'])")).toBe(0);                    // normale Stücke: weiter Taler + Ideen
  });
  it('kaufen: braucht Kunstakademie und genug ✨, zieht nur ✨ ab, meldet die Cloud', () => {
    game("state.design = new Set(); state.stardust = 50");
    expect(game("designError(DESIGN_BY_ID['statue'])")).toBe('Braucht eine Kunstakademie');
    game("state.tiles.set('30,30', { b: 'kunst', lvl: 1 })");
    expect(game("designError(DESIGN_BY_ID['statue'])")).toBe('Zu wenig Sternstaub');
    game('state.stardust = 1000; globalThis.__ct = 0; globalThis.__cto = cloudTouched; cloudTouched = () => globalThis.__ct++');
    const m0 = game('state.money'), s0 = game('state.science');
    expect(game("buyDesign('statue')")).toBe(true);
    expect(game('[state.stardust, state.money, state.science, state.design.has("statue")]')).toEqual([1000 - game("designStardust(DESIGN_BY_ID['statue'])"), m0, s0, true]);
    expect(game('globalThis.__ct')).toBeGreaterThan(0);
    game('cloudTouched = globalThis.__cto');
  });
  it('Karten zeigen ✨ statt Taler/Ideen', () => {
    game("state.design = new Set(); openResearch('design')");
    const html = game("document.querySelector('[data-design=\"wall:12\"]').innerHTML");
    expect(html).toContain(`✨ ${game("designStardust(DESIGN_BY_ID['wall:12'])")}`);
    expect(html).not.toContain('🪙');
    expect(game("designCostText(DESIGN_BY_ID['wall:12'])")).toBe(`✨ ${game("designStardust(DESIGN_BY_ID['wall:12'])")}`);
    game('closeModal()');
  });
});

describe('163b Fenster-, Brücken-, Flaggenfarben: je 3 frei', () => {
  it('die ersten drei frei, der Rest in der Kunstakademie (kaufbar); Wegfarben bleiben frei', () => {
    game('state.design = new Set(); state.legacy = new Set()');
    expect(game('[0, 1, 2, 3, 6].map(winOk)')).toEqual([true, true, true, false, false]);
    expect(game('FLAG_COLORS.map(flagColOk)')).toEqual([true, true, true, false, false, false]);
    expect(game("BRIDGE_COL_DEFS.map((c, i) => lookOk('bruecke', 'col', i + 1))")).toEqual([true, true, true, false, false, false, false, false, false, false]);
    for (const id of ['win:3', 'win:6', 'flag:3', 'flag:5', 'bruecke:col:rot', 'bruecke:col:gelb']) expect(game(`!!DESIGN_BY_ID['${id}'] && designPrice(DESIGN_BY_ID['${id}']) > 0`), id).toBe(true);
    expect(game("buyDesign('win:4')")).toBe(true);
    expect(game('winOk(4)')).toBe(true);
    expect(game("buyDesign('flag:3')")).toBe(true);
    expect(game('flagColOk(FLAG_COLORS[3])')).toBe(true);
    expect(game("buyDesign('bruecke:col:blau')")).toBe(true);
    expect(game("lookOk('bruecke', 'col', BRIDGE_COL_DEFS.findIndex(c => c.id === 'blau') + 1)")).toBe(true);
  });
  it('Verbautes bleibt frei: Fenster, Brückenfarbe, Flagge und „Neu gebaute“ aus dem Spielstand', () => {
    game('state.design = new Set(); state.legacy = new Set()');
    game("state.tiles.set('5,5', { b: 'fz_schloss', lvl: 1, win: 5 }); state.tiles.set('9,9', { b: 'weg', lvl: 1, brc: 6 }); state.town.color = FLAG_COLORS[4]; state.paintNew.bruecke = { form: 0, col: 9 }");   // Leiste col 9 = Ziegel (col 0 ist „Wie das Material“)
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect([...d.design].sort()).toEqual(['bruecke:col:sandstein', 'bruecke:col:ziegel', 'flag:4', 'win:5'].sort());
  });
  it('Auswahl zeigt nur Freies (und die gerade gewählte), dazu „Mehr Farben freischalten“', () => {
    game('state.design = new Set(); state.legacy = new Set()');
    game("state.town.color = FLAG_COLORS[4]");                                        // gewählt (z. B. aus altem Stand): bleibt sichtbar
    const html = game('townEditor(state.town)');
    const fc = [...html.matchAll(/data-fc="([^"]+)"/g)].map(m => m[1]);
    expect(fc).toEqual(game('[...FLAG_COLORS.slice(0, 3), FLAG_COLORS[4]]'));
    expect(html).toContain('data-flagmore');
  });
});

describe('163c Baupläne aus Truhen und Erfolgen', () => {
  const chest = kind => game(`(() => { ISLE_BY_ID.__truhe = { id: '__truhe', chest: '${kind}', n: 2, res: 'quader' }; state.tiles.set('40,40', { b: 'truhe', isle: '__truhe' }); return '__truhe'; })()`);   // ferne Insel nachgebaut
  it('Truhe: ein noch gesperrtes Stück (nie ✦) geschenkt, dafür nur ein Viertel der Taler; Fenster „Bauplan gefunden“', () => {
    game('state.design = new Set(); state.legacy = new Set()');
    const id = chest('taler');
    const full = game(`chestLoot(ISLE_BY_ID['${id}']).money`), m0 = game('state.money');
    expect(game("openChest('40,40')")).toBe(true);
    const got = game('[...state.design]');
    expect(got.length).toBe(1);
    expect(game(`DESIGN_BY_ID['${got[0]}'].master`)).toBeFalsy();
    expect(game('state.money') - m0).toBe(game(`niceRound(${full} / 4)`));
    const html = game("document.getElementById('modal-card').innerHTML");
    expect(html).toContain('Bauplan gefunden');
    expect(html).toContain(game(`escHtml(DESIGN_BY_ID['${got[0]}'].name)`));
    game("document.getElementById('m-bp-go').click()");                       // „Ansehen“ öffnet das Stück in der Kunstakademie
    expect(game("document.getElementById('modal-card').textContent")).toContain('Schon da');
    game('closeModal()');
  });
  it('Truhe, wenn schon alles frei ist: volle Beute wie bisher, kein Bauplan', () => {
    game('state.design = new Set(DESIGN.filter(d => d.price).map(d => d.id))');
    const id = chest('taler'), full = game(`chestLoot(ISLE_BY_ID['${id}']).money`), m0 = game('state.money');
    game("openChest('40,40')");
    expect(game('state.money') - m0).toBe(full);
    expect(game("document.getElementById('modal').hidden")).toBe(true);
  });
  it('Erfolge: jeder dritte Stern schenkt einen Bauplan – nur neue Sterne, alte Spielstände bekommen nichts nachgereicht', () => {
    game('state.design = new Set(); state.legacy = new Set(); state.achieved = {}; state.bpStars = null');
    game(`state.achieved[ACHIEVEMENTS[0].id] = 4; checkAchievements(true)`);   // Laden: 4 Sterne schon da → nichts nachträglich
    expect([game('state.bpStars'), game('state.design.size')]).toEqual([4, 0]);
    game(`(() => { const a = ACHIEVEMENTS[1]; a.__v = a.value; a.value = () => a.tiers[2]; checkAchievements(); a.value = a.__v; })()`);   // +3 Sterne → 7
    expect([game('state.bpStars'), game('state.design.size')]).toEqual([7, 1]);
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.bpStars).toBe(7);
  });
  it('neues Spiel: Zähler bei 0; privat (nicht in Live-Daten)', () => {
    game('startNew()');
    expect(game('state.bpStars')).toBe(0);
    expect(game("LIVE_PRIV.includes('bpStars')")).toBe(true);
  });
});
