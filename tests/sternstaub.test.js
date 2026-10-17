const { loadGame, game } = require('./helpers/load-game');

// Block 161 (PLAN-161.md): ✨ Sternstaub – Quellen (Erfolge, Album, Fest, Sternschnuppe, Truhe, Feste), Nachzahlung beim Laden,
// Schatzkammer zum Tageskurs, Speichern, Anzeige
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e10");
});

describe('Sternstaub: Quellen', () => {
  it('Erfolgsstufen: 10 ✨ × Stufe, einmal je Stufe', () => {
    game("state.achieved = {}; state.sdGot = new Set(); state.stardust = 0; state.achieved[ACHIEVEMENTS[0].id] = 3");
    expect(game('sdCheck()')).toBe(10 + 20 + 30);
    expect(game('sdCheck()')).toBe(0);                                     // nie doppelt
    expect(game('state.stardust')).toBe(60);
    game("state.achieved[ACHIEVEMENTS[0].id] = 4");
    expect(game('sdCheck()')).toBe(40);
  });
  it('volle Albumseite 50 ✨, das Laternenfest 150 ✨', () => {
    game("state.achieved = {}; state.sdGot = new Set(); state.stardust = 0; const p = ALBUM[0]; for (const k of albumKeys(p)) state.album.add(k); state.festival = true");
    expect(game('sdCheck()')).toBe(50 + 150);
  });
  it('Sternschnuppe: 2 ✨, selten 10; Truhe 10 ✨ × Inselnummer, einmal', () => {
    game('state.stardust = 0');
    expect(game('sdStar(() => 0.5)')).toBe(2);
    expect(game('sdStar(() => 0.05)')).toBe(10);
    expect(game("sdAdd(SD.chest * 3, 'chest:x')")).toBe(30);
    expect(game("sdAdd(SD.chest * 3, 'chest:x')")).toBe(0);
  });
});

describe('Sternstaub: Schatzkammer (Tageskurs)', () => {
  it('erstes ✨ des Tages 20 Mio, jedes weitere 10 % mehr; neuer Tag von vorn; Uhr zurück bringt nichts', () => {
    game('state.treasury = null; state.stardust = 0');
    expect(game('sdPrice(0)')).toBe(20e6);
    expect(game('sdPrice(1)')).toBe(22e6);
    const m0 = game('state.money');
    expect(game('sdBuy(1, 20261016)')).toBe(1);
    expect(game('sdBuy(5, 20261016)')).toBe(5);
    expect(m0 - game('state.money')).toBe(game('sdPriceOf(6, 0)'));
    expect(game('[state.stardust, state.treasury.n]')).toEqual([6, 6]);
    expect(game('sdTreasury(20261017).n')).toBe(0);                       // neuer Tag
    expect(game('sdTreasury(20261015).n')).toBe(6);                       // Uhr zurückgedreht: der Tag bleibt
    game('state.money = 1');
    expect(game('sdBuy(1, 20261016)')).toBe(0);                           // zu wenig Taler: nichts
    expect(game('state.stardust')).toBe(6);
  });
  it('mit 1 Mrd an einem Tag etwa 19 ✨ – nie unbezahlbar', () => {
    let n = 0; while (game(`sdPriceOf(${n + 1}, 0)`) <= 1e9) n++;
    expect(n).toBeGreaterThanOrEqual(17); expect(n).toBeLessThanOrEqual(20);
  });
});

describe('Sternstaub: Speichern, Nachzahlung, Anzeige', () => {
  it('serialize/parseSave: Sternstaub, Gutschriften, Schatzkammer bleiben', () => {
    game("state.stardust = 123; state.sdGot = new Set(['a:x:1', 'fest']); state.sdSeen = true; state.treasury = { day: 20261016, n: 4 }");
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.stardust).toBe(123);
    expect([...d.sdGot].sort()).toEqual(['a:x:1', 'fest']);
    expect(d.sdSeen).toBe(true);
    expect(d.treasury).toEqual({ day: 20261016, n: 4 });
  });
  it('alter Spielstand ohne Sternstaub: 0, und rohe Werte werfen nie', () => {
    const d = game("(() => { const s = JSON.parse(JSON.stringify(serialize())); delete s.stardust; delete s.sdGot; delete s.sdSeen; delete s.treasury; return parseSave(s); })()");
    expect(d.stardust).toBe(0);
    expect(d.sdGot.size).toBe(0);
    const e = game("(() => { const s = JSON.parse(JSON.stringify(serialize())); s.stardust = 'viel'; s.sdGot = 'x'; s.treasury = { day: 'heute' }; return parseSave(s); })()");
    expect([e.stardust, e.sdGot.size, e.treasury]).toEqual([0, 0, null]);
  });
  it('Nachzahlung beim Laden: Erreichtes still gutgeschrieben, Willkommensfenster einmal', () => {
    game("state.achieved = {}; state.achieved[ACHIEVEMENTS[0].id] = 2; state.sdGot = new Set(); state.stardust = 0; state.sdSeen = false");
    expect(game('sdCheck(true)')).toBe(30);
    expect(game("document.getElementById('modal').hidden")).toBe(true);   // still
  });
  it('Pille oben: erst mit Sternstaub; antippen öffnet das Fenster mit Schatzkammer', () => {
    game('state.stardust = 0; state.sdSeen = false; sdHud()');
    expect(game("document.getElementById('sd-btn').hidden")).toBe(true);
    game('state.stardust = 7; sdHud()');
    expect(game("[document.getElementById('sd-btn').hidden, document.getElementById('sd').textContent]")).toEqual([false, '7']);
    game("document.getElementById('sd-btn').click()");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Schatzkammer/);
    game("document.getElementById('sd-buy1').click()");
    expect(game('state.stardust')).toBe(8);
    game('closeModal()');
  });
});

describe('Sternstaub im Lager (Handy: oben kein Platz)', () => {
  it('Zeile im 📦-Lager, antippen öffnet das Sternstaub-Fenster', () => {
    game('state.stardust = 9; state.sdSeen = true; toggleStore(true)');
    expect(game("document.getElementById('store').textContent")).toMatch(/Sternstaub\s*9/);
    game("document.querySelector('#store [data-sd]').click()");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Schatzkammer/);
    game('closeModal()');
  });
});

describe('Tageswunsch (161b)', () => {
  const land = () => game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
  it('jeden Tag einer, auf allen Geräten derselbe (Tag + Spielstand), neuer Tag → neuer Wunsch; Uhr zurück: bleibt', () => {
    land(); game('state.dayWish = null');
    const a = game('twToday(20261016).id');
    game('state.dayWish = null');
    expect(game('twToday(20261016).id')).toBe(a);
    const w = game('twToday(20261017)');
    expect(w.day).toBe(20261017);
    expect(game('twToday(20261015).day')).toBe(20261017);
  });
  it('gezählt ab dem Stand beim Erscheinen: 3 Bänke am Wasser → 25 ✨ einmal', () => {
    land();
    game("for (let x = 5; x <= 9; x++) state.terra.set(x + ',10', 'water'); waterChanged(); state.decos.set('5,9', [{ b: 'bank', rot: 0 }, null, null, null, null, null, null, null, null].slice(0, SLOTS))");
    game("state.dayWish = { day: 20261016, id: 'bank', base: TW_BY_ID.bank.count(), done: false, who: 'Mika', icon: '🐰' }; state.stardust = 0; state.sdGot = new Set(); twAt = 0");
    expect(game('twGot(state.dayWish)')).toBe(0);                          // die schon da war, zählt nicht
    game("state.decos.set('6,9', [{ b: 'bank', rot: 0 }, { b: 'bank', rot: 0 }, null, null, null, null, null, null, null].slice(0, SLOTS)); state.decos.set('15,15', [{ b: 'bank', rot: 0 }, null, null, null, null, null, null, null, null].slice(0, SLOTS))");
    game('twTick(Date.now(), 20261016)');
    expect(game('state.dayWish.done')).toBe(false);                          // 2 am Wasser, die dritte steht nicht am Wasser
    game("state.decos.get('6,9')[2] = { b: 'bank', rot: 0 }; twAt = 0; twTick(Date.now(), 20261016)");
    expect(game('[state.dayWish.done, state.stardust]')).toEqual([true, 25]);
    game("twAt = 0; twTick(Date.now(), 20261016)");
    expect(game('state.stardust')).toBe(25);
  });
  it('nur Baubares: ohne Pavillon-Freischaltung kein Pavillon-Wunsch; im Fenster mit Fortschritt; speichert', () => {
    land();
    const ids = new Set(); for (let d = 1; d <= 28; d++) { game('state.dayWish = null'); ids.add(game(`twToday(202611${String(d).padStart(2, '0')}).id`)); }
    if (!game("available('pavillon')")) expect(ids.has('pavillon')).toBe(false);
    expect(ids.size).toBeGreaterThan(3);
    game("state.dayWish = { day: 20261016, id: 'baum', base: 0, done: false, who: 'Bruno', icon: '🐻' }; openStardust()");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Bruno hätte gern 6 neue Bäume/);
    game('closeModal()');
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.dayWish).toMatchObject({ day: 20261016, id: 'baum', who: 'Bruno' });
  });
});

describe('Sternenbasar (161c)', () => {
  const land = () => game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc(); state.res.bretter = 99");
  it('frei mit dem ersten Sternstaub; nur einer je Insel; Antippen öffnet den Basar', () => {
    land(); game('state.sdSeen = false; state.stardust = 0');
    expect(game("available('sternenbasar')")).toBe(false);
    expect(game("lockText('sternenbasar')")).toMatch(/Sternstaub/);
    game('state.stardust = 5');
    expect(game("available('sternenbasar')")).toBe(true);
    expect(game("build('sternenbasar', 5, 5)")).toBe(true);
    expect(game("placeError('sternenbasar', 10, 10)")).toMatch(/nur einer/);
    game('openInfo(5, 5)');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Sternenbasar/);
    game('closeModal()');
  });
  it('Zeichnen: Tag, Nacht, weit – ohne Fehler; nicht im Album', () => {
    land(); game("state.stardust = 5; build('sternenbasar', 5, 5)");
    for (const [z, n] of [[2, 0], [2, 1], [0.4, 0]]) game(`(() => { const nv = night; night = ${n}; try { drawObject('sternenbasar', 400, 300, ${z}, 1e6, 5, 5, 1, state.tiles.get('5,5')); } finally { night = nv; } })()`);
    expect(game("ALBUM.some(p => albumKeys(p).includes('b:sternenbasar'))")).toBe(false);
  });
  it('Angebote: gleicher Tag = gleiche, Ungekauftes zuerst; Kaufen kostet Sternstaub, schaltet frei, bleibt gespeichert', () => {
    game(`(() => { for (const id of ['sdtest_a', 'sdtest_b', 'sdtest_c', 'sdtest_d', 'sdtest_e']) ITEMS[id] = { cat: 'deko', name: id, sdShop: true, cost: 10, small: true };
      SD_SHOP.length = 0; SD_SHOP.push({ id: 'sdtest_a', price: 40 }, { id: 'sdtest_b', price: 60 }, { id: 'sdtest_c', price: 80 }, { id: 'sdtest_d', price: 90 }, { id: 'sdtest_e', price: 300, rare: true }); })()`);
    game('state.sdItems = new Set(); state.stardust = 100');
    const o1 = game('basarOffers(20261017).map(s => s.id)');
    expect(o1.length).toBe(4);
    expect(o1[3]).toBe('sdtest_e');
    expect(game('basarOffers(20261017).map(s => s.id)')).toEqual(o1);
    expect(game("available('sdtest_a')")).toBe(false);
    expect(game("sdBuyItem('sdtest_a')")).toBe(true);
    expect(game("[state.stardust, available('sdtest_a')]")).toEqual([60, true]);
    expect(game("sdBuyItem('sdtest_e')")).toBe(false);                   // zu wenig
    expect(game('basarOffers(20261017).map(s => s.id)').slice(0, 3)).not.toContain('sdtest_a');   // Ungekauftes zuerst
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect([...d.sdItems]).toEqual(['sdtest_a']);
    game("SD_SHOP.length = 0; for (const id of ['sdtest_a', 'sdtest_b', 'sdtest_c', 'sdtest_d', 'sdtest_e']) delete ITEMS[id]");
  });
});
