const { loadGame, game } = require('./helpers/load-game');

// Block 162 (PLAN-162.md): 🏛️ Monumente – Wahrzeichen des Monats (Bauplan ✨, Baustelle in 3 Abschnitten, mehrfach baubar),
// Prachtstücke als seltene Basar-Ware, Sternenleuchte auch im Wasser, echte Bildhöhe (Spitzen nicht abgeschnitten)
beforeAll(() => loadGame());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 21, 12, 0, 0));
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e10");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc()");
  game('for (const r of Object.keys(RES)) if (r !== "money") state.res[r] = 5000');
});
afterEach(() => vi.useRealTimers());
const WAHR = ['mon_pagode', 'mon_leuchte', 'mon_obelisk', 'mon_bogen'], PRACHT = ['mon_statue', 'mon_stern', 'mon_brunnen'];

describe('Monumente: Daten und Bilder', () => {
  it('sieben Monumente, 2×2, Sammlung „Monumente“; Bild bei Tag/Nacht/weit und als Baustelle ohne Fehler', () => {
    expect(game('Object.keys(MONUMENTS)').sort()).toEqual([...WAHR, ...PRACHT].sort());
    for (const id of [...WAHR, ...PRACHT]) {
      expect(game(`[ITEMS['${id}'].size, ITEMS['${id}'].sdShop, ITEMS['${id}'].sammlung, !!BIG_ART['${id}']]`), id).toEqual([[2, 2], true, 'Monumente', true]);
      expect(game(`typeof MON_ART[MONUMENTS['${id}'].art]`), id).toBe('function');   // drawObject schluckt Fehler – Bild muss es geben
      for (const [zz, n] of [[2, 0], [2, 1], [0.4, 0]]) game(`(() => { const nv = night; night = ${n}; try { drawObject('${id}', 400, 300, ${zz}, 1e6, 5, 5, 1, { b: '${id}', rot: 0 }); } finally { night = nv; } })()`);
    }
    for (const id of WAHR) for (const p of [0, 1, 2]) game(`drawObject('${id}', 400, 300, 1, 1e6, 5, 5, 1, { b: '${id}', rot: 0, phase: ${p} })`);
  });
  it('Bildchen sind hoch genug für die Spitze (Nutzer: „beim Rauszoomen gehen die Spitzen verloren“)', () => {
    for (const id of [...WAHR, ...PRACHT]) expect(game(`spriteTop('${id}', 2, 2) >= ITEMS['${id}'].h + 20`), id).toBe(true);
    expect(game("ITEMS.mon_obelisk.h")).toBeGreaterThanOrEqual(160);
  });
  it('Preise: Bauplan 1000 ✨ (nur im Reiter Monumente), Prachtstück 500 ✨ als Seltenes; Abschnitte 100 / 300 / 600 Mio', () => {
    for (const id of WAHR) expect(game(`sdShopItem('${id}')`)).toEqual({ id, price: 1000, mon: true });
    for (const id of PRACHT) expect(game(`sdShopItem('${id}')`)).toEqual({ id, price: 500, rare: true });
    expect(game('MON_PHASES.map(p => p.money)')).toEqual([100e6, 300e6, 600e6]);
    game('state.sdItems = new Set()');
    for (let d = 20261001; d <= 20261031; d++) expect(game(`basarOffers(${d}).some(s => s.mon)`)).toBe(false);   // nie im Tagesangebot
    game("state.sdShown = new Set(['mon_pagode'])");
    expect(game('sdKatalog().some(s => s.mon)')).toBe(false);
  });
});

describe('Wahrzeichen des Monats', () => {
  it('gleicher Monat = gleiches; die vier wechseln sich ab; nächster Termin stimmt', () => {
    const of = (y, m) => game(`monOfMonth(new Date(${y}, ${m}, 15))`);
    expect(of(2026, 9)).toBe(game('monOfMonth()'));
    expect(game('monOfMonth(new Date(2026, 9, 1))')).toBe(game('monOfMonth(new Date(2026, 9, 31))'));
    expect(new Set([of(2026, 9), of(2026, 10), of(2026, 11), of(2027, 0)])).toEqual(new Set(WAHR));
    expect(of(2027, 1)).toBe(of(2026, 9));                                   // verpasste kommen wieder
    const next = of(2026, 10);
    expect(game(`monNext('${next}')`)).toEqual({ in: 1, name: 'November' });
    expect(game('[monDaysLeft(new Date(2026, 9, 21)), monDaysLeft(new Date(2026, 9, 31))]')).toEqual([11, 1]);
  });
  it('Bauplan nur im eigenen Monat, kostet 1000 ✨, schaltet frei; in der Gruppe Monumente, nicht in der ✨-Basar-Gruppe', () => {
    game('state.sdItems = new Set(); state.stardust = 5000');
    const cur = game('monOfMonth()'), other = WAHR.find(id => id !== cur);
    expect(game(`sdBuyItem('${other}')`)).toBe(false);
    expect(game(`sdBuyItem('${other}', true)`)).toBe(false);                // auch nicht über den Katalog
    expect(game(`available('${cur}')`)).toBe(false);
    expect(game(`sdBuyItem('${cur}')`)).toBe(true);
    expect(game(`[state.stardust, available('${cur}')]`)).toEqual([4000, true]);
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(gr => gr.id === 'monumente').items")).toEqual([cur]);   // nur Gekauftes
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(gr => gr.id === 'sternstaub').items")).not.toContain(cur);
  });
  it('Reiter Monumente: Wahrzeichen groß mit Countdown, alle sieben mit Stand; gesehen fürs Sammelbuch', () => {
    game('state.sdItems = new Set(); state.sdShown = new Set(); state.stardust = 5000; state.sdSeen = true');
    game("openBasar('monumente')");
    const html = game("document.getElementById('modal-card').innerHTML"), cur = game('monOfMonth()');
    expect(html).toContain('Wahrzeichen im Oktober · noch 11 Tage');
    expect(html).toContain(`data-sdbuy="${cur}"`);
    for (const id of [...WAHR, ...PRACHT]) expect(html).toContain(game(`escHtml(ITEMS['${id}'].name)`));
    expect(html).toContain('kommt als Seltenes der Woche');
    expect(game(`state.sdShown.has('${cur}')`)).toBe(true);
    game("document.querySelector('[data-sdbuy]').click()");
    expect(game(`state.sdItems.has('${cur}')`)).toBe(true);
    game('closeModal()');
  });
});

describe('Baustelle', () => {
  const plan = id => game(`state.sdItems.add('${id}')`);
  it('hinstellen = Baustelle (Abschnitt 0), keine Schönheit; drei Abschnitte kosten 100/300/600 Mio + Baustoffe; fertig: 🌸', () => {
    plan('mon_obelisk');
    expect(game("build('mon_obelisk', 4, 4)")).toBeTruthy();
    expect(game("state.tiles.get('4,4').phase")).toBe(0);
    expect(game("[monSite(state.tiles.get('4,4')), beautyOf(state.tiles.get('4,4'), 4, 4)]")).toEqual([true, 0]);
    const m0 = game('state.money'), q0 = game('state.res.quader');
    expect(game('monStep(4, 4)')).toBe(true);
    expect([m0 - game('state.money'), q0 - game('state.res.quader'), game("state.tiles.get('4,4').phase")]).toEqual([100e6, 300, 1]);
    expect(game('monStep(4, 4)')).toBe(true);
    expect(game('monStep(4, 4)')).toBe(true);
    expect(m0 - game('state.money')).toBe(1e9);
    expect(game("[monSite(state.tiles.get('4,4')), beautyOf(state.tiles.get('4,4'), 4, 4) > 0, monStep(4, 4)]")).toEqual([false, true, false]);
  });
  it('zu wenig Taler: Abschnitt wird nicht gebaut, nichts abgezogen', () => {
    plan('mon_pagode'); game("build('mon_pagode', 4, 4); state.money = 5e7");
    expect(game('monStep(4, 4)')).toBe(false);
    expect(game("[state.money, state.tiles.get('4,4').phase]")).toEqual([5e7, 0]);
  });
  it('mehrfach baubar (Nutzer: „Mehrfach“), aber kein Kopieren einer Baustelle', () => {
    plan('mon_bogen');
    expect(game("build('mon_bogen', 2, 2)")).toBeTruthy();
    expect(game("build('mon_bogen', 8, 8)")).toBeTruthy();
    expect(game("[...state.tiles.values()].filter(t => t.b === 'mon_bogen').length")).toBe(2);
    expect(game("noCopy('mon_bogen')")).toBe(true);
  });
  it('Infofenster: Abschnitt, Kosten, Knopf baut; Titel „(Baustelle)“', () => {
    plan('mon_pagode'); game("build('mon_pagode', 4, 4); openInfo(4, 4)");
    expect(game("document.body.innerHTML")).toContain('Große Pagode (Baustelle)');
    expect(game("document.body.innerHTML")).toContain('Abschnitt 1 von 3: Fundament');
    game("document.getElementById('p-mon').click()");
    expect(game("state.tiles.get('4,4').phase")).toBe(1);
    game('closePanel()');
  });
  it('Rathaus „Bereit“: bezahlbarer Abschnitt steht dort (eigene Gruppe, einzeln), Knopf baut ihn; nicht im „Alle ausbauen“', () => {
    plan('mon_obelisk'); game("build('mon_obelisk', 4, 4)");
    const e = () => game("readyList().ready.find(e => e.kind === 'mon')");
    expect(e()).toMatchObject({ x: 4, y: 4, b: 'mon_obelisk', cost: { money: 100e6, quader: 300 } });
    expect(game("readyGroups(readyList().ready).find(g => g.id === 'mon')")).toMatchObject({ bulk: false });
    expect(game("upgradeMany(readyList().ready.filter(e => e.kind === 'mon'))")).toBe(0);
    game("openTownHall('todo')");
    const i = game("readyList().ready.findIndex(e => e.kind === 'mon')");
    game(`document.querySelector('[data-up="${i}"]').click()`);
    expect(game("state.tiles.get('4,4').phase")).toBe(1);
    game('state.money = 1e6');
    expect(e()).toBeUndefined();                                             // nicht bezahlbar: nicht „bereit“
    game('closeModal()');
  });
  it('Abreißen gibt alles zurück, auch die Abschnitte', () => {
    plan('mon_obelisk'); game("build('mon_obelisk', 4, 4); monStep(4, 4)");
    const info = game('demolishInfo(4, 4)');
    expect(info.refund).toBe(game('ITEMS.mon_obelisk.cost') + 100e6);
    expect(info.mat).toMatchObject({ bretter: 50, quader: 300 });
  });
  it('Speichern: Bauplan und Abschnitt bleiben', () => {
    plan('mon_leuchte'); game("build('mon_leuchte', 4, 4); monStep(4, 4)");
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect([...d.sdItems]).toContain('mon_leuchte');
    expect(d.tiles.get('4,4')).toMatchObject({ b: 'mon_leuchte', phase: 1 });
  });
});

describe('Baumenü: nur Gekauftes (Nutzer 21.10.2026: wie Animal Crossing)', () => {
  const groupIds = () => game(`(() => { menuTop = 'gestalten'; renderTools(); return [...document.querySelectorAll('.sheet-h')].map(h => h.dataset.group); })()`);
  it('ohne Kauf: keine Gruppen ✨ Sternenbasar und 🏛️ Monumente, kein Vorgeschmack, nichts im Nachschlagebuch', () => {
    game('state.sdItems = new Set()');
    const grs = "MENU.find(m => m.id === 'gestalten').groups";
    expect(game(`${grs}.find(gr => gr.id === 'sternstaub').items`)).toEqual([]);
    expect(game(`${grs}.find(gr => gr.id === 'monumente').items`)).toEqual([]);
    expect(groupIds()).not.toContain('sternstaub');
    expect(groupIds()).not.toContain('monumente');
    expect(game('BUILDABLE().some(id => ITEMS[id].sdShop)')).toBe(false);
  });
  it('nach dem Kauf: Gruppe erscheint mit genau dem Gekauften', () => {
    game("state.sdItems = new Set(['mon_stern', 'sd_kirschbaum'])");
    expect(groupIds()).toContain('monumente');
    expect(groupIds()).toContain('sternstaub');
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(gr => gr.id === 'monumente').items")).toEqual(['mon_stern']);
  });
});

describe('Sternenleuchte im Wasser (Nutzer: „Überall“)', () => {
  it('Sternenleuchte darf ins Wasser und an Land; die anderen nicht ins Wasser', () => {
    game("for (let y = 10; y <= 11; y++) for (let x = 10; x <= 11; x++) state.terra.set(x + ',' + y, 'water'); recalc()");
    game("state.sdItems.add('mon_leuchte'); state.sdItems.add('mon_obelisk')");
    expect(game("placeError('mon_leuchte', 10, 10)")).toBeFalsy();
    expect(game("placeError('mon_leuchte', 3, 3)")).toBeFalsy();
    expect(game("placeError('mon_obelisk', 10, 10)")).toBeTruthy();
  });
});
