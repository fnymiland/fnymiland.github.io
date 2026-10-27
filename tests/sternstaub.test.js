const { loadGame, game } = require('./helpers/load-game');

// Block 161 (PLAN-161.md): ✨ Sternstaub: Quellen (Erfolge, Album, Fest, Sternschnuppe, Truhe, Feste), Nachzahlung beim Laden,
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
  it('jeden Tag einer, auf allen Geräten derselbe (Tag + Spielstand), neuer Tag → neuer Wunsch; Uhr einen Tag zurück: bleibt', () => {
    land(); game('state.dayWish = null');
    const a = game('twToday(20261016).id');
    game('state.dayWish = null');
    expect(game('twToday(20261016).id')).toBe(a);
    const w = game('twToday(20261017)');
    expect(w.day).toBe(20261017);
    expect(game('twToday(20261016).day')).toBe(20261017);                // Uhr einen Tag zurück (Zeitzone, Mitternacht): bleibt
    expect(game('twToday(20261015).day')).toBe(20261015);                // weiter in der Zukunft: falsche Uhr – Wunsch für heute (sdFuture)
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
      globalThis.__shop = SD_SHOP.slice(); SD_SHOP.length = 0; SD_SHOP.push({ id: 'sdtest_a', price: 40 }, { id: 'sdtest_b', price: 60 }, { id: 'sdtest_c', price: 80 }, { id: 'sdtest_d', price: 90 }, { id: 'sdtest_e', price: 300, rare: true }); })()`);
    game('state.sdItems = new Set(); state.sdOffers = null; state.stardust = 100');
    const D = game('sdDay()'), D2 = game('(t => { t.setDate(t.getDate() + 1); return sdDay(t); })(new Date())');   // heute: Kaufen nur aus dem heutigen Angebot
    const o1 = game(`basarOffers(${D}).map(s => s.id)`);
    expect(o1.length).toBe(4);
    expect(o1[3]).toBe('sdtest_e');
    expect(game(`basarOffers(${D}).map(s => s.id)`)).toEqual(o1);
    const a = o1[0];                                                         // was heute im Angebot ist
    expect(game(`available('${a}')`)).toBe(false);
    expect(game(`sdBuyItem('${a}')`)).toBe(true);
    expect(game(`[state.stardust, available('${a}')]`)).toEqual([100 - game(`sdShopItem('${a}').price`), true]);
    expect(game("sdBuyItem('sdtest_e')")).toBe(false);                   // zu wenig
    expect(game(`basarOffers(${D}).map(s => s.id)`)).toEqual(o1);                     // gekauft: bleibt bis zum Wechsel stehen (161h)
    expect(game(`basarOffers(${D2}).map(s => s.id)`).slice(0, 3)).not.toContain(a);   // neuer Tag: Ungekauftes zuerst
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect([...d.sdItems]).toEqual([a]);
    game("SD_SHOP.length = 0; SD_SHOP.push(...globalThis.__shop); for (const id of ['sdtest_a', 'sdtest_b', 'sdtest_c', 'sdtest_d', 'sdtest_e']) delete ITEMS[id]");
  });
});

describe('Sternenbasar-Waren (161c)', () => {
  it('jede Ware: ITEMS mit sdShop, Bild bei Tag/Nacht/weit ohne Fehler, gesperrt bis gekauft, dann baubar; nicht im Album', () => {
    const ids = game('SD_SHOP.filter(s => !ITEMS[s.id].mon).map(s => s.id)');   // Monumente (Block 162): eigene Tests, Bild in BIG_ART
    expect(ids.length).toBeGreaterThanOrEqual(13);
    for (const id of ids) {
      expect(game(`!!ITEMS['${id}'] && !!ITEMS['${id}'].sdShop && !!SD_ART['${id}']`), id).toBe(true);
      for (const [zz, n] of [[2, 0], [2, 1], [0.4, 0]]) game(`(() => { const nv = night; night = ${n}; try { drawObject('${id}', 400, 300, ${zz}, 1e6, 5, 5, 1, { b: '${id}', rot: 0, slot: 0 }); } finally { night = nv; } })()`);
      expect(game(`ALBUM.some(p => albumKeys(p).includes('b:${id}'))`), id).toBe(false);
    }
    game("state.sdItems = new Set(); state.stardust = 1000; state.sdOffers = { day: sdDay(), week: sdWeek(sdDay()), ids: ['sd_kirschbaum', 'sd_ahorn', 'sd_weide'], rare: 'sd_sternbrunnen' }");   // heute im Angebot
    expect(game("available('sd_kirschbaum')")).toBe(false);
    expect(game("sdBuyItem('sd_kirschbaum')")).toBe(true);
    expect(game("available('sd_kirschbaum')")).toBe(true);
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(gr => gr.id === 'sternstaub').items")).toEqual(['sd_kirschbaum']);
  });
});

describe('Seltenheit (Nutzer 17.10.2026: „wirklich ein Spielziel“)', () => {
  it('Nachzahlung beim ersten Mal höchstens 300 ✨, die Stufen zählen trotzdem als bezahlt', () => {
    game("state.achieved = {}; for (const a of ACHIEVEMENTS.slice(0, 6)) state.achieved[a.id] = a.tiers.length; state.sdGot = new Set(); state.stardust = 0; state.sdSeen = false");
    expect(game('sdBackPay()')).toBe(300);
    expect(game('state.stardust')).toBe(300);
    expect(game('sdCheck()')).toBe(0);
  });
  it('Seltenes der Woche: Montag bis Sonntag dasselbe, nächste Woche ein anderes; normale wechseln täglich', () => {
    game('state.sdItems = new Set()');
    const rare = d => game(`basarOffers(${d}).find(s => s.rare).id`), norm = d => game(`basarOffers(${d}).filter(s => !s.rare).map(s => s.id).join()`);
    const week = [20261019, 20261020, 20261021, 20261022, 20261023, 20261024, 20261025];   // Mo–So
    expect(new Set(week.map(rare)).size).toBe(1);
    expect(rare(20261026)).not.toBe(rare(20261019));
    expect(norm(20261019)).not.toBe(norm(20261020));
    expect(game('[sdWeekLeft(20261019), sdWeekLeft(20261025)]')).toEqual([7, 1]);
  });
  it('Preise: normal 80–200, selten 350–450; mindestens 58 Waren, davon mindestens 10 selten', () => {
    const shop = game('SD_SHOP.filter(s => !ITEMS[s.id].mon).map(s => [s.id, s.price, !!s.rare])');   // Monumente: eigene Preise (monumente.test.js)
    expect(shop.length).toBeGreaterThanOrEqual(65);
    for (const [id, p, r] of shop) { if (r) { expect(p, id).toBeGreaterThanOrEqual(350); expect(p, id).toBeLessThanOrEqual(450); } else { expect(p, id).toBeGreaterThanOrEqual(80); expect(p, id).toBeLessThanOrEqual(200); } }
    expect(shop.filter(s => s[2]).length).toBeGreaterThanOrEqual(10);
  });
});

describe('Basar-Durchsicht: Fehler (Nutzer 27.10.2026)', () => {
  it('Himmelslaternen wiegen sich: bewegt (ANIM_ITEMS), zu zwei Zeiten verschieden gezeichnet', () => {
    expect(game("ANIM_ITEMS.has('sd_himmelslaternen')")).toBe(true);
    const at = now => game(`(() => { const c = document.createElement('canvas'); c.width = c.height = 200; const pg = g, out = []; g = c.getContext('2d');
      const mt = g.moveTo; g.moveTo = (x, y) => { out.push(Math.round(x * 10), Math.round(y * 10)); };
      try { SD_ART.sd_himmelslaternen(100, 150, 2, ${now}); } finally { g.moveTo = mt; g = pg; } return out.join(); })()`);
    expect(at(0)).not.toBe(at(900));
  });
});

describe('Basar-Durchsicht: neue Regeln (Nutzer 28.10.2026)', () => {
  const place = "for (let y = 3; y <= 8; y++) for (let x = 3; x <= 8; x++) { const k = x + ',' + y; state.terra.set(k, x === 5 ? 'water' : 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.sdItems = new Set(['sd_kanu']); recalc()";
  it('Kanu nur aufs Wasser: auf Gras abgelehnt, auf Wasser gebaut (Wasser bleibt), schaukelt', () => {
    game(place);
    expect(game('smallError("sd_kanu", 4, 4, 0)')).toBe('Das gehört aufs Wasser');
    expect(game('ownedTile(5, 4) && smallError("sd_kanu", 5, 4, 0)')).toBe(null);
    expect(game('buildSmall("sd_kanu", 5, 4, 0)')).toBe(true);
    expect(game("[terrainAt(5, 4), decosAt('5,4')[0].b]")).toEqual(['water', 'sd_kanu']);
    expect(game('smallError("sd_kanu", 5, 4, 0)')).toBe('Dieser Platz ist schon belegt');
    expect(game("ANIM_ITEMS.has('sd_kanu')")).toBe(true);
  });
  it('Nachtblumen-/Eisblumen-Beet: frei erst mit dem Basar-Stück, nicht in der Kunstakademie; gleiche Beete nebeneinander ohne Lücke', () => {
    game(place);
    const fi = game("DECO_LOOKS.blumen.forms.findIndex(f => f.id === 'nachtblumen')"), ei = game("DECO_LOOKS.blumen.forms.findIndex(f => f.id === 'eisblumen')");
    game('state.sdItems = new Set()');
    expect(game(`[lookOk('blumen', 'form', ${fi}), lookOk('blumen', 'form', ${ei})]`)).toEqual([false, false]);
    expect(game("DESIGN.some(d => /nachtblumen|eisblumen/.test(d.id))")).toBe(false);
    const more0 = game("lookMore('blumen')");
    game("state.sdItems = new Set(['sd_nachtblumen'])");
    expect(game(`[lookOk('blumen', 'form', ${fi}), lookOk('blumen', 'form', ${ei})]`)).toEqual([true, false]);
    expect(game("lookMore('blumen')")).toBe(more0);
    // Breite der Fläche: allein mit Rand, mit gleichem Nachbarn rechts bis an die Feldkante
    const width = () => game(`(() => { const pp = poly; let w = 0; poly = (pts, col) => { if (!w) w = Math.max(...pts.map(q => q[0])) - Math.min(...pts.map(q => q[0])); return pp(pts, col); };
      try { drawObject('blumen', 400, 300, 2, 0, 4, 4, 1, state.tiles.get('4,4')); } finally { poly = pp; } return Math.round(w); })()`);
    game(`state.tiles.set('4,4', { b: 'blumen', lvl: 1, form: ${fi} }); state.tiles.delete('5,4'); state.tiles.delete('4,5'); recalc()`);
    const alone = width();
    game(`state.terra.set('5,4', 'grass'); state.tiles.set('5,4', { b: 'blumen', lvl: 1, form: ${fi} }); recalc()`);
    expect(width()).toBeGreaterThan(alone);
    game(`state.tiles.set('5,4', { b: 'blumen', lvl: 1, form: 0 }); recalc()`);
    expect(width()).toBe(alone);                                          // anderes Beet: kein Zusammenwachsen
    for (const n of [0, 1]) game(`(() => { const nv = night; night = ${n} ? NIGHT_MAX : 0; try { drawObject('blumen', 400, 300, 2, 0, 4, 4, 1, { b: 'blumen', lvl: 1, form: ${ei} }); drawObject('blumen_l', 400, 300, 2, 0, 4, 4, 1, { b: 'blumen_l', lvl: 1, form: ${fi} }); } finally { night = nv; } })()`);
  });
  it('ein altes Kanu auf der Wiese bleibt stehen und lässt sich weiter zeichnen', () => {
    game(place + "; state.decos.set('4,4', [{ b: 'sd_kanu', rot: 0 }, null, null, null, null, null, null, null, null, null]); adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()");
    expect(game("decosAt('4,4')[0].b")).toBe('sd_kanu');
    game("drawObject('sd_kanu', 400, 300, 2, 1e6, 4, 4, 1, decosAt('4,4')[0])");
  });
});

describe('Nicht mehr im Verkauf (Basar-Durchsicht, Nutzer 27.10.2026)', () => {
  const WEG = ['sd_pagode', 'sd_leseecke', 'sd_wandbild', 'sd_apfelbaum', 'sd_glockenbaum', 'sd_huehnerhaus'];
  it('nie im Angebot, Katalog, Kauf oder Ausprobieren; zählt nicht zu „n von allen“', () => {
    game(`state.sdItems = new Set(); state.sdShown = new Set(${JSON.stringify(WEG)}); state.stardust = 1e6; state.sdOffers = { day: sdDay(), week: sdWeek(sdDay()), ids: ['sd_leseecke', 'sd_ahorn', 'sd_weide'], rare: 'sd_pagode' }`);
    const offered = new Set();
    for (let d = 20261019; d < 20261019 + 120; d++) for (const o of game(`(state.sdOffers = null, basarOffers(${d}).map(s => s.id))`)) offered.add(o);
    expect(WEG.filter(id => offered.has(id))).toEqual([]);
    game(`state.sdOffers = { day: sdDay(), week: sdWeek(sdDay()), ids: ['sd_leseecke', 'sd_ahorn', 'sd_weide'], rare: 'sd_pagode' }`);   // gemerktes Angebot von gestern
    expect(game('basarOffers().map(s => s.id)').filter(id => WEG.includes(id))).toEqual([]);
    expect(game('sdKatalog().map(s => s.id)').filter(id => WEG.includes(id))).toEqual([]);
    for (const id of WEG) expect(game(`sdBuyItem('${id}', true) || sdBuyItem('${id}')`), id).toBe(false);
    game("sdTryStart('sd_leseecke')"); expect(game('sdTry')).toBe(null);
    const [, all] = game("sdSmlgCount('Inselleben')");
    expect(all).toBe(game("SD_SHOP.filter(s => sdSammlung(s.id) === 'Inselleben').length") - 2);   // Glockenbaum und Hühnerhaus
  });
  it('wer sie gekauft hat, behält sie: baubar, im Baumenü und im Sammelbuch', () => {
    game(`state.sdItems = new Set(['sd_pagode', 'sd_glockenbaum'])`);
    expect(game("available('sd_pagode') && available('sd_glockenbaum')")).toBe(true);
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(gr => gr.id === 'sternstaub').items")).toEqual(expect.arrayContaining(['sd_pagode', 'sd_glockenbaum']));
    const book = game("basarBook()");
    expect(book).toContain('Glockenbaum');
    expect(book).not.toContain('Leseecke');
  });
});

describe('Katalog (18.10.2026)', () => {
  it('Gesehenes zum anderthalbfachen Preis nachbestellen; Seltenes nie; Ungesehenes nie; gemerkt im Spielstand', () => {
    game("state.sdItems = new Set(); state.sdShown = new Set(); state.stardust = 1000; state.sdSeen = true; openBasar('heute'); closeModal()");
    const shown = game('[...state.sdShown]');
    expect(shown.length).toBe(4);
    const norm = game("[...state.sdShown].find(id => !sdShopItem(id).rare)"), rare = game("[...state.sdShown].find(id => sdShopItem(id).rare)");
    expect(game('sdKatalog().map(s => s.id)')).toEqual(expect.arrayContaining([norm]));
    expect(game('sdKatalog().some(s => s.rare)')).toBe(false);
    const p = game(`sdKatalogPrice(sdShopItem('${norm}'))`), p0 = game(`sdShopItem('${norm}').price`);
    expect(p).toBe(Math.ceil(p0 * 1.5 / 10) * 10);
    expect(game(`sdBuyItem('${rare}', true)`)).toBe(false);
    const nie = game("SD_SHOP.find(s => !s.rare && !state.sdShown.has(s.id)).id");
    expect(game(`sdBuyItem('${nie}', true)`)).toBe(false);
    expect(game(`sdBuyItem('${norm}', true)`)).toBe(true);
    expect(game('state.stardust')).toBe(1000 - p);
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect([...d.sdShown].length).toBe(4);
  });
  it('Reiter „Heute“ zeigt den normalen Preis, nie den Katalogpreis (Fehler 18.10.: map übergab den Index)', () => {
    game("state.sdItems = new Set(); state.sdShown = new Set(); state.stardust = 1000; state.sdSeen = true; openBasar('heute')");
    const cards = [...document.querySelectorAll('#modal [data-sdbuy]')].map(b => [b.dataset.sdbuy, b.textContent, b.hasAttribute('data-kat')]);
    game('closeModal()');
    expect(cards.length).toBe(4);
    for (const [id, text, kat] of cards) {
      expect(kat, id).toBe(false);
      expect(text, id).toContain(game(`fmt(sdShopItem('${id}').price)`));
    }
  });
});

describe('Basar „mehr special“ (161h, Nutzer 18.10.2026)', () => {
  const land = () => game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc(); state.res.bretter = 99");
  const fresh = "state.sdItems = new Set(); state.sdShown = new Set(); state.sdNew = null; state.sdWish = new Set(); state.sdWishNote = 0; state.sdSeen = true; state.stardust = 1000";
  const card = id => `[...document.querySelectorAll('#modal .basar-card')].find(c => c.querySelector('[data-sdbuy="${id}"]'))`;
  it('Sternennacht: Mondhase spricht, Seltenes groß oben, Countdown, Sammlung auf jeder Karte', () => {
    game(fresh); game("openBasar('heute')");
    const offers = game('basarOffers().map(s => [s.id, !!s.rare])');
    expect(game("document.getElementById('modal-card').classList.contains('basar')")).toBe(true);   // hell wie alle Fenster (Aussehen)
    expect(game("document.querySelector('#modal .basar-say').textContent.length")).toBeGreaterThan(10);
    expect(game("document.querySelector('#modal .basar-when').textContent")).toMatch(/Neue Ware in \d/);
    const rare = offers.find(o => o[1])[0];
    expect(game(`${card(rare)}.classList.contains('feature')`)).toBe(true);
    for (const [id] of offers) expect(game(`${card(id)}.querySelector('.basar-smlg').textContent`)).toMatch(/\d+\/\d+/);
    game('closeModal()');
  });
  it('Tagesspruch: letzter Tag des Seltenen zuerst, sonst gleicher Tag = gleicher Spruch', () => {
    game(fresh);
    const sun = 20261025, mon = 20261019;                                          // Sonntag: noch 1 Tag; Montag: noch 7
    expect(game(`sdWeekLeft(${sun})`)).toBe(1);
    expect(game(`sdHareSay(basarOffers(${sun}), ${sun})`)).toMatch(/nur noch heute/);
    expect(game(`sdHareSay(basarOffers(${mon}), ${mon})`)).toMatch(/Ganz neu diese Woche/);
    const d = 20261021;
    expect(game(`sdHareSay(basarOffers(${d}), ${d})`)).toBe(game(`sdHareSay(basarOffers(${d}), ${d})`));
  });
  it('NEU: nur am Tag, an dem es zum ersten Mal angeboten wird; gespeichert', () => {
    game(fresh); game("openBasar('heute'); closeModal()");
    const ids = game('basarOffers().map(s => s.id)');
    for (const id of ids) expect(game(`sdIsNew('${id}')`)).toBe(true);
    game("openBasar('heute')");                                                     // gleicher Tag, nochmal geöffnet: bleibt NEU
    expect(game("document.querySelectorAll('#modal .basar-new').length")).toBe(ids.length);
    game('closeModal()');
    expect(game(`sdIsNew('${ids[0]}', 20991231)`)).toBe(false);
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.sdNew.ids.length).toBe(ids.length);
  });
  it('Herzchen: merken/entmerken, Hinweis einmal am Tag, wenn es im Angebot ist; gespeichert, privat', () => {
    game(fresh);
    const id = game('basarOffers(20261021)[0].id');
    game(`sdToggleWish('${id}')`);
    expect(game(`state.sdWish.has('${id}')`)).toBe(true);
    game("globalThis.__t = []; globalThis.__toast = toast; toast = m => __t.push(m)");
    game('sdWishTick(1e13, 20261021)'); game('sdWishTick(2e13, 20261021)');
    const t = game('__t'); game('toast = __toast');
    expect(t.filter(m => /Herzchen/.test(m)).length).toBe(1);
    expect(game('state.sdWishNote')).toBe(20261021);
    expect([...game('parseSave(JSON.parse(JSON.stringify(serialize())))').sdWish]).toEqual([id]);
    expect(game("LIVE_PRIV.includes('sdWish') && LIVE_PRIV.includes('sdNew') && LIVE_PRIV.includes('sdWishNote')")).toBe(true);
    game(`sdToggleWish('${id}')`);
    expect(game(`state.sdWish.has('${id}')`)).toBe(false);
  });
  it('Sammelbuch: alle Waren; gekauft bunt mit Namen, gesehen mit Namen, nie gesehen „???“', () => {
    game(fresh);
    const [a, b] = game("SD_SHOP.filter(s => !s.rare && sdSammlung(s.id) === 'Eiszauber').slice(0, 2).map(s => s.id)");
    game(`state.sdItems.add('${a}'); state.sdShown.add('${b}'); openBasar('buch')`);
    expect(game("document.querySelectorAll('#modal .book-item').length")).toBe(game('SD_SHOP.filter(sdForSale).length'));   // Entferntes nur, wenn gekauft
    const items = game("[...document.querySelectorAll('#modal .book-item')].map(e => [e.classList.contains('have'), e.textContent.trim()])");
    expect(items.filter(i => i[0]).length).toBe(1);
    expect(items.map(i => i[1])).toEqual(expect.arrayContaining([game(`ITEMS['${a}'].name`), game(`ITEMS['${b}'].name`)]));
    expect(items.filter(i => /\?\?\?/.test(i[1])).length).toBe(game('SD_SHOP.filter(s => sdForSale(s) && !state.sdItems.has(s.id) && !state.sdShown.has(s.id)).length'));
    expect(game("document.querySelector('#modal .book-head').textContent")).toMatch(/\d+\/\d+/);
    game('closeModal()');
  });
  it('Ausprobieren: Vorschau wie beim Bauen, Tippen baut nie; Zurück/anderes Werkzeug beendet; Kaufen stellt es hin', () => {
    land(); game(fresh); game('for (const r of Object.keys(RES)) if (r !== "money") state.res[r] = 99');   // Rohstoffe für jede Ware
    const id = game("basarOffers().find(s => !s.rare && ITEMS[s.id].small).id");
    expect(game(`available('${id}')`)).toBe(false);
    game(`sdTryStart('${id}')`);
    expect(game(`[tool, available('${id}'), document.getElementById('sd-try-bar').hidden]`)).toEqual([id, true, false]);
    expect(game(`placeError('${id}', 5, 5)`)).toBeFalsy();
    game('const q = toScreen(5, 5); tap(q.x, q.y, true); tap(q.x, q.y, true); tap(q.x, q.y, false)');
    expect(game("(state.decos.get('5,5') || []).filter(Boolean).length")).toBe(0);  // nie gebaut
    expect(game('[hover.x, hover.y]')).toEqual([5, 5]);
    game("setTool('look')");
    expect(game(`[sdTry, available('${id}'), document.getElementById('sd-try-bar').hidden]`)).toEqual([null, false, true]);
    game(`sdTryStart('${id}'); hover = { x: 6, y: 6 }; hoverSlot = 0`);
    const st0 = game('state.stardust');
    expect(game('sdTryBuy()')).toBe(true);
    expect(game('state.stardust')).toBe(st0 - game(`sdShopItem('${id}').price`));
    expect(game(`(state.decos.get('6,6') || []).some(d => d && d.b === '${id}')`)).toBe(true);
    expect(game(`[sdTry, tool, available('${id}')]`)).toEqual([null, id, true]);
    game("setTool('look')");
  });
  it('Gekauftes bleibt im Laden stehen: Tagesware bis morgen, das Seltene bis Montag (kein Nachrücken)', () => {
    game(fresh + '; state.sdOffers = null');
    const mon = 20261019, tue = 20261020, mon2 = 20261026;
    const o1 = game(`basarOffers(${mon}).map(s => s.id)`), rare = o1[3];
    game(`sdBuyItem('${o1[0]}'); sdBuyItem('${rare}')`);
    expect(game(`basarOffers(${mon}).map(s => s.id)`)).toEqual(o1);
    const o2 = game(`basarOffers(${tue}).map(s => s.id)`);
    expect(o2[3]).toBe(rare);                                                       // gleiche Woche: das (gekaufte) Seltene bleibt
    expect(o2.slice(0, 3)).not.toContain(o1[0]);
    expect(game(`basarOffers(${mon2}).map(s => s.id)`)[3]).not.toBe(rare);           // neue Woche: neues Seltenes
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.sdOffers.day).toBe(mon2);
    expect(game("LIVE_PRIV.includes('sdOffers')")).toBe(true);
  });
  it('Kauf: Glöckchen statt Forschungston', () => {
    game(fresh);
    game("globalThis.__s = []; globalThis.__sfx = SFX.bell; SFX.bell = () => __s.push('bell')");
    game("sdBuyItem(basarOffers()[0].id)");
    expect(game('__s')).toEqual(['bell']);
    game('SFX.bell = __sfx');
  });
});

describe('Prüfung vor dem Push (19.10.2026)', () => {
  const land = () => game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); recalc(); state.res.bretter = 99");
  const fresh = "state.sdItems = new Set(); state.sdShown = new Set(); state.sdNew = null; state.sdOffers = null; state.sdWish = new Set(); state.sdWishNote = 0; state.sdSeen = true; state.stardust = 1000";
  it('Ausprobieren: auch Ziehen, Rechteck und direkte Bau-Aufrufe bauen nichts', () => {
    land(); game(fresh);
    const small = game("basarOffers().find(s => ITEMS[s.id].small).id");
    game(`sdTryStart('${small}')`);
    expect(game(`dragKind('${small}')`)).toBe(null);
    expect(game(`buildSmall('${small}', 3, 3, 0)`)).toBe(false);
    game(`plan = { kind: 'rect', tool: '${small}', a: { x: 2, y: 2 }, b: { x: 6, y: 6 }, fixed: true, slot: 0 }; try { runPlan(); } catch (e) {} plan = null`);
    expect(game("[...state.decos.values()].flat().filter(d => d && ITEMS[d.b] && ITEMS[d.b].sdShop).length")).toBe(0);
    game("setTool('look')");
    const tile = game("SD_SHOP.find(s => !ITEMS[s.id].small).id");
    game(`state.sdOffers = null; globalThis.__try = '${tile}'; sdTry = '${tile}'`);
    expect(game(`build('${tile}', 8, 8, true)`)).toBe(false);
    game('sdTryClear()');
  });
  it('Katalog: Ausprobieren und Kaufen nimmt den Katalogpreis; ohne Katalog nur, was heute im Angebot ist', () => {
    game(fresh);
    const id = game('SD_SHOP.find(s => !s.rare && !basarOffers().some(o => o.id === s.id)).id');
    expect(game(`sdBuyItem('${id}')`)).toBe(false);                                 // nicht im Angebot: nicht zum Normalpreis
    game(`state.sdShown.add('${id}'); sdTryStart('${id}', true); hover = null`);
    expect(game("document.getElementById('sd-try-buy').textContent")).toContain(game(`fmt(sdKatalogPrice(sdShopItem('${id}')))`));
    const st0 = game('state.stardust');
    expect(game('sdTryBuy()')).toBe(true);
    expect(st0 - game('state.stardust')).toBe(game(`sdKatalogPrice(sdShopItem('${id}'))`));
    game("setTool('look')");
  });
  it('Sternstaub-Änderungen melden sich bei der Cloud (außer der stillen Nachzahlung beim Laden)', () => {
    game(fresh);
    game("globalThis.__ct = 0; globalThis.__ctf = cloudTouched; cloudTouched = () => { __ct++; }");
    game('sdStar(() => 0.5)'); const a = game('__ct');
    game("sdToggleWish(basarOffers()[0].id)"); const b = game('__ct');
    game("openBasar('heute'); closeModal()"); const c = game('__ct');
    game("state.sdGot = new Set(); state.achieved = { [ACHIEVEMENTS[0].id]: 1 }; sdCheck(true)"); const d = game('__ct');
    game('cloudTouched = __ctf');
    expect([a > 0, b > a, c > b, d === c]).toEqual([true, true, true, true]);
  });
  it('Zuschauendes Gerät: Basar ändert nichts, Herzchen gesperrt', () => {
    game(fresh);
    game("globalThis.__vo = viewOnly; viewOnly = () => true; globalThis.__cb = cloudBlocked; cloudBlocked = () => {}");
    game("openBasar('heute'); closeModal(); sdToggleWish(basarOffers()[0].id)");
    const r = game('[state.sdShown.size, state.sdWish.size]');
    game('viewOnly = __vo; cloudBlocked = __cb');
    expect(r).toEqual([0, 0]);
  });
});
