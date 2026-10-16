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
