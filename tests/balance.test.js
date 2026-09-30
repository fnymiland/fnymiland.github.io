const { loadGame, game } = require('./helpers/load-game');

// Block 37: Läden bedienen nur so viele Kunden, wie sie Personal haben; Besucher teilen sich gleiche Läden einer Insel;
// Rohstoffe haben einen Vorrat; erst verarbeiten, dann verkaufen; Wunder-Preis nach dem besten Einkommen; ferne Inseln
// und Taler-Truhen nach Minuten Einkommen; nur drei Häfen zählen.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game('state.money = 1e8; for (const r of Object.keys(RES)) state.res[r] = 0');
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)})`);
const st = k => game(`recalc(), T.st.get('${k}')`);
// Weg y = 10, oben dran Häuser: n Häuser Stufe 6 (22 Einwohner) → viele Leute in einem Viertel
function street(houses, y = 10, x0 = 3) {
  for (let x = x0; x <= x0 + 17; x++) put(`${x},${y}`, { b: 'weg', lvl: 1, style: 'sand' });
  for (let i = 0; i < houses; i++) put(`${x0 + i},${y - 1}`, { b: 'haus', lvl: 6 });
}

describe('Personal: höchstens 150 Kunden je Mitarbeiter', () => {
  it('ein Kiosk (1 Mitarbeiter) bedient 150, der Rest geht leer aus – das Infofenster sagt es', () => {
    street(12);                                                                 // 12 × 22 = 264 Einwohner
    put('8,11', { b: 'kiosk', lvl: 1 });
    const s = st('8,11');
    expect(s.want).toBe(264);
    expect(s.kunden).toBe(150);
    expect(s.full).toBe(true);
    game('openInfo(8, 11)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toContain('150 von höchstens 150');
    expect(txt).toContain('Voll');
    expect(txt).toContain('zweiter Laden');
  });

  it('ein zweiter Kiosk im Viertel hat wieder Kundschaft: beide zusammen verdienen mehr', () => {
    street(12);
    put('8,11', { b: 'kiosk', lvl: 1 });
    const one = st('8,11').inc;
    put('9,11', { b: 'kiosk', lvl: 1 });
    const a = st('8,11'), b = st('9,11');
    expect(a.kunden).toBe(132); expect(b.kunden).toBe(132);                   // 264 / 2, beide unter 150
    expect(a.full).toBe(false);
    expect(a.inc + b.inc).toBeGreaterThan(one * 1.7);
  });

  it('größere Läden bedienen mehr (Pizzeria 2 Mitarbeiter → 300); kleine Viertel merken nichts', () => {
    expect(game("shopCap('pizzeria')")).toBe(300);
    expect(game("shopCap('stadion')")).toBe(2250);
    street(4);                                                                  // 88 Einwohner
    put('8,11', { b: 'kiosk', lvl: 1 });
    expect(st('8,11').kunden).toBe(88);
    expect(st('8,11').full).toBe(false);
  });

  it('auch der Warenverkauf richtet sich nach den bedienten Kunden', () => {
    street(12);
    put('8,11', { b: 'eisdiele', lvl: 1 });
    const s = st('8,11'), S = game('SHOPS.eisdiele'), sl = s.sales[0];
    const f = s.inc / (S.rate / 100 * s.kunden * (1 + s.inner));                  // Viertel-Bonus & Co. wie beim Einkommen
    expect(s.kunden).toBe(150);
    expect(sl.rate).toBeCloseTo(S.sell / 100 * 150 * f);
  });

  it('das Bau-Infofenster nennt, wie viele Kunden ein Laden bedient', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 3 }; openBuildInfo('pizzeria')");
    expect(document.getElementById('panel').textContent).toContain('🛒 bedient bis 300 Kunden');
  });
});

describe('Kaufkraft je Viertel', () => {
  const shops = ['kiosk', 'blumenladen', 'friseur', 'cafe', 'teeladen', 'post', 'apotheke', 'bubbletea', 'pizzeria', 'nudelbar'];
  beforeEach(() => game('state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 3, erzberg: 2, kristall: 1 }'));

  it('die Arten mit dem besten Ertrag je Rate-Punkt zählen bis 40 Punkte voll, der Rest ein Viertel', () => {
    const m = game("[...kaufShares([{ b: 'a', rate: 30, value: 300 }, { b: 'b', rate: 20, value: 100 }, { b: 'c', rate: 5, value: 5 }])]");
    expect(Object.fromEntries(m)).toEqual({ a: 1, b: (10 + 0.25 * 10) / 20, c: 0.25 });
    expect(game("[...kaufShares([{ b: 'a', rate: 10, value: 50 }, { b: 'b', rate: 20, value: 10 }])].every(([, f]) => f === 1)")).toBe(true);
  });

  it('in einem Viertel mit vielen Läden: Infofenster zeigt die Kaufkraft', () => {
    street(18);
    shops.forEach((b, i) => put(`${3 + i},11`, { b, lvl: 1 }));
    game('recalc()');
    const buys = shops.map((b, i) => game(`T.st.get('${3 + i},11').buy`));
    expect(Math.min(...buys)).toBeLessThan(1);
    expect(Math.max(...buys)).toBe(1);
    const low = shops.findIndex((b, i) => buys[i] < 0.995);
    game(`openInfo(${3 + low}, 11)`);
    expect(document.getElementById('panel').textContent).toContain('💰 Kaufkraft');
  });

  it('ein weiterer Laden – neue Art oder Kopie – senkt das Einkommen nie', () => {
    street(18);
    shops.forEach((b, i) => put(`${3 + i},11`, { b, lvl: 1 }));
    let before = game('recalc(), T.inc');
    for (const [k, b] of [['13,11', 'boutique'], ['14,11', 'kiosk'], ['15,11', 'juwelier'], ['16,11', 'friseur'], ['17,11', 'hofladen'], ['18,11', 'uhrmacher']]) {
      put(k, { b, lvl: 1 });
      const now = game('recalc(), T.inc');
      expect(now, b).toBeGreaterThanOrEqual(before - 1e-9);
      before = now;
    }
  });

  it('ohne viele Läden merkt man nichts', () => {
    street(4);
    put('3,11', { b: 'kiosk', lvl: 1 }); put('4,11', { b: 'cafe', lvl: 1 });
    expect(st('3,11').buy).toBe(1);
    expect(st('4,11').buy).toBe(1);
  });
});

describe('Besucher: gleiche Läden einer Insel teilen sie sich', () => {
  it('zwei getrennte Viertel mit je einem Kiosk bekommen die Besucher nicht doppelt', () => {
    street(1, 6); street(1, 16);                                               // zwei Viertel, je ein Haus (22)
    put('6,7', { b: 'kiosk', lvl: 1 }); put('6,17', { b: 'kiosk', lvl: 1 });
    // 100 Besucher auf der Heimatinsel (sonst kämen sie per Bahn und Schiff)
    game("window.__sw = shopWorld; shopWorld = (net, links) => { const w = window.__sw(net, links); w.visitors.set(regionAt(6, 7), 100); return w; }");
    try {
      const a = st('6,7'), b = st('6,17');
      expect(a.sameIsle).toBe(2);
      expect(a.kunden).toBe(22 + 50);
      expect(b.kunden).toBe(22 + 50);
    } finally { game('shopWorld = window.__sw'); }
  });
});

describe('Rohstoffe: Vorrat und erst verarbeiten', () => {
  it('Holz, Stein, Erz behalten 500, Obst 2.000 (Schloss braucht 1.000 auf einmal) – Läden verkaufen nur darüber', () => {
    expect(game("['holz', 'stein', 'erz', 'obst'].map(keepOf)")).toEqual([500, 500, 500, 2000]);
    expect(game("KEEP_STEPS.includes(500) && KEEP_STEPS.includes(2000)")).toBe(true);
  });

  it('das Sägewerk bekommt sein Holz, bevor die Markthalle verkauft; das Lager zeigt, was wirklich verkauft wird', () => {
    game("state.res.holz = 510; T = { ...T, prod: {}, conv: [{ from: 'holz', to: 'bretter', rate: 1 }], sales: [{ k: '1,1', res: 'holz', rate: 100, pay: 3 }] }");
    game('produce(1)');
    expect(game('state.res.bretter')).toBeCloseTo(1);                          // 2 Holz → 1 Brett, zuerst
    expect(game('state.res.holz')).toBeCloseTo(500);                           // der Rest über dem Vorrat verkauft
    expect(game("soldRate.holz")).toBeCloseTo(8);
    expect(game("soldRate['1,1|holz']")).toBeCloseTo(8);
    game('produce(1)');                                                       // nichts mehr über dem Vorrat …
    expect(game('state.res.holz')).toBeCloseTo(498);                           // … das Sägewerk arbeitet weiter, verkauft wird nichts
    expect(game("soldRate.holz || 0")).toBeLessThan(0.01);
  });

  it('ein neues Spiel vergisst die Verkäufe', () => {
    game("soldRate.holz = 5; startNew(); closeModal()");
    expect(game('Object.keys(soldRate).length')).toBe(0);
  });
});

describe('Wunder-Preis nach dem besten Einkommen', () => {
  beforeEach(() => game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; for (const r of Object.keys(RES)) state.res[r] = 99999; buildRot = 0; rotManual = true"));

  it('das beste Einkommen bleibt gemerkt (auch im Spielstand), wenn das Einkommen sinkt', () => {
    for (let x = 5; x <= 9; x++) put(`${x},3`, { b: 'fabrik', lvl: 1 });
    game('recalc()');
    const peak = game('state.incPeak');
    expect(peak).toBeGreaterThan(0);
    for (let x = 5; x <= 9; x++) game(`state.tiles.delete('${x},3')`);
    game('recalc()');
    expect(game('state.incPeak')).toBe(peak);
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).incPeak')).toBe(peak);
  });

  it('früh aufstellen oder Betriebe kurz wegräumen macht das Wunder nicht billiger', () => {
    for (let x = 5; x <= 9; x++) put(`${x},3`, { b: 'fabrik', lvl: 1 });
    game('recalc()');
    const peak = game('state.incPeak');
    for (let x = 5; x <= 9; x++) game(`state.tiles.delete('${x},3')`);
    game('recalc()');
    expect(game("build('riesenrad', 8, 8, true)")).toBe(true);
    expect(game("state.tiles.get('8,8').rate")).toBe(peak);
  });

  it('der Preis folgt dem besten Einkommen – auch bei einer schon stehenden Baustelle', () => {
    expect(game("build('riesenrad', 8, 8, true)")).toBe(true);
    game('T.inc = 1000; T.salesInc = 0; state.incPeak = 1000');
    const c0 = game("wonderCost(state.tiles.get('8,8')).money");
    game('state.incPeak = 4000');
    expect(game("wonderCost(state.tiles.get('8,8')).money")).toBeGreaterThan(c0 * 3);
  });

  it('das beste Einkommen sinkt langsam zum jetzigen (Halbwertszeit 20 min) – nicht, solange etwas getragen wird', () => {
    game('T.inc = 1000; T.salesInc = 0; state.incPeak = 5000; peakTick(1200)');
    expect(game('state.incPeak')).toBe(3000);
    game("moving = { kind: 'test' }; peakTick(1200)");
    expect(game('state.incPeak')).toBe(3000);
    game('moving = null; recalc()');
  });
});

describe('Wunder: alte Baustellen und Warenverkauf', () => {
  it('Stände ohne incPeak vergessen den alten Preis unfertiger Baustellen (fertige behalten alles)', () => {
    game("state.tiles.set('8,8', { b: 'riesenrad', lvl: 1, phase: 1, rate: 99999 }); state.tiles.set('14,8', { b: 'sternwarte', lvl: 1, phase: WONDERS.sternwarte.phases.length, rate: 77 })");
    const d = game('(() => { const d = JSON.parse(JSON.stringify(serialize())); delete d.incPeak; return d; })()');
    const s = game(`parseSave(${JSON.stringify(d)})`);
    const tiles = new Map(s.tiles);
    expect(tiles.get('8,8').rate).toBe(undefined);
    expect(tiles.get('14,8').rate).toBe(77);
    const s2 = game(`parseSave(JSON.parse(JSON.stringify(serialize())))`);            // mit incPeak: nichts anfassen
    expect(new Map(s2.tiles).get('8,8').rate).toBe(99999);
  });

  it('Warenverkauf, der sich halten lässt, zählt zum Einkommen für Preise (nicht der Lagerbestand)', () => {
    game("T = { ...T, inc: 100, salesInc: 50 }; state.incPeak = 0");
    expect(game('wonderRate()')).toBe(150);
  });
});

describe('Letzte Schritte vor dem Fest nach Einkommen', () => {
  it('Kristallhöhle Stufe 2/3 mindestens 25/60 Minuten, Leuchtturm 60 Minuten des besten Einkommens – fest als Untergrenze', () => {
    game('T.inc = 0; T.salesInc = 0; state.incPeak = 0');
    expect(game("[lmPrice('kristall', 0), lmPrice('kristall', 1), lmPrice('kristall', 2)]")).toEqual(game('LM_PRICE.kristall'));
    expect(game('ITEMS.leuchtturm.cost')).toBe(15000000);
    game('state.incPeak = 20000');
    expect(game("lmPrice('kristall', 1)")).toBe(game('niceRound(25 * 60 * 20000)'));
    expect(game("lmPrice('kristall', 2)")).toBe(game('niceRound(60 * 60 * 20000)'));
    expect(game("lmPrice('kristall', 0)")).toBe(2000000);
    expect(game("lmPrice('quelle', 2)")).toBe(6000000);                       // andere Inseln bleiben fest
    expect(game('ITEMS.leuchtturm.cost')).toBe(game('niceRound(60 * 60 * 20000)'));
    game('state.restore.kristall = 1');
    expect(game("restoreInfo('kristall').money")).toBe(game('niceRound(25 * 60 * 20000)'));
    game('state.incPeak = 0');
  });

  it('die Leuchtturm-Kachel zieht ihren Preis mit dem Einkommen nach', () => {
    game("T.inc = 0; T.salesInc = 0; state.incPeak = 0; menuTop = 'deko'; buildToolbar(); updateHud()");
    const card = () => document.querySelector('#tools [data-tool="leuchtturm"]');
    expect(card().querySelector('.cost').textContent).toBe('🪙 15 Mio.');
    game('state.incPeak = 20000; updateHud()');
    expect(+card().dataset.cost).toBe(game('niceRound(60 * 60 * 20000)'));
    expect(card().querySelector('.cost').textContent).toBe('🪙 72 Mio.');
    game('state.incPeak = 0');
  });
});

describe('Haltbarer Warenverkauf (Preisgrundlage)', () => {
  it('ein Sägewerk ohne Holz und „alles behalten“ zählen nicht', () => {
    street(12);
    put('8,11', { b: 'moebelhaus', lvl: 1, rot: 0 });
    game('state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 3 }; recalc()');
    expect(game('T.sales.some(sl => sl.res === "bretter")')).toBe(true);
    expect(game('T.salesInc')).toBe(0);                                       // keine Bretter-Herstellung
    put('15,3', { b: 'saege', lvl: 1, rot: 0 });
    game('recalc()');
    expect(game('T.salesInc')).toBe(0);                                       // Sägewerk ohne Holzfäller
  });
});

describe('Nach dem Fest', () => {
  it('ferne Insel n kostet mindestens (15 + 5n) Minuten Einkommen – im Ziel und beim Ablegen', () => {
    game('state.festival = true; ensureFar()');
    const i = game('FAR[0]');
    game('T.inc = 50000; T.salesInc = 0; state.incPeak = 0');
    const want = game(`niceRound(${(15 + 5 * i.n) * 60} * 50000)`);
    expect(game('isleMoney(FAR[0])')).toBe(want);
    expect(game('isleNeeds(FAR[0]).find(c => c.pay && c.text.includes("Taler")).want')).toBe(want);
    game('state.incPeak = 50000; T.inc = 0');
    expect(game('isleMoney(FAR[0])')).toBe(want);                              // Läden wegschieben hilft nicht: bestes Einkommen
    game('state.incPeak = 0');
    expect(game('isleMoney(FAR[0])')).toBe(i.need.money);                      // nie billiger als der Grundpreis
  });

  it('die Taler-Truhe bringt 5 Minuten Einkommen', () => {
    game('T.inc = 100000; T.salesInc = 0');
    expect(game("chestLoot({ chest: 'taler', n: 1 }).money")).toBe(game('niceRound(100000 * 60 * 5)'));
  });
});

describe('Häfen', () => {
  it('nur die drei besten zählen für den Bonus', () => {
    for (let x = 3; x <= 7; x++) put(`${x},3`, { b: 'feld', lvl: 1 });
    const inc = n => {
      for (let i = 0; i < 6; i++) game(`state.tiles.delete('${3 + i * 3},20')`);
      for (let i = 0; i < n; i++) put(`${3 + i * 3},20`, { b: 'hafen', lvl: 1, rot: 0 });
      game('recalc()');
      return game("[3,4,5,6,7].reduce((a, x) => a + T.st.get(x + ',3').inc, 0)");
    };
    const i0 = inc(0), i3 = inc(3), i5 = inc(5);
    expect(i3).toBeGreaterThan(i0 * 1.2);
    expect(i5).toBeCloseTo(i3);
  });
});
