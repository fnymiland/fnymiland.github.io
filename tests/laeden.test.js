const { loadGame, game } = require('./helpers/load-game');

// Block 30: Läden verdienen an Kundschaft, verkaufen Waren, Innenstadt-Bonus; Kultur zieht an; Plantagen nur fern
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e8; for (const r of Object.keys(RES)) state.res[r] = 0');
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)})`);
// Straße y = 10 von x = 3 bis 20, Häuser oben dran (Viertel), Läden unten dran
function street(houses = 8) {
  for (let x = 3; x <= 20; x++) put(`${x},10`, { b: 'weg', lvl: 1, style: 'sand' });
  for (let i = 0; i < houses; i++) put(`${3 + i},9`, { b: 'haus', lvl: 3 });
}
const st = k => game(`recalc(), T.st.get('${k}')`);

describe('Kundschaft', () => {
  it('ohne Leute im Viertel keine Einnahmen; mit Häusern am selben Weg schon', () => {
    put('15,15', { b: 'kiosk', lvl: 1 });
    expect(st('15,15').inc).toBe(0);
    street();
    put('12,11', { b: 'kiosk', lvl: 1 });
    const s = st('12,11');
    expect(s.kunden).toBe(8 * game('HOUSE_STAGES[2].pop'));
    expect(s.inc).toBeGreaterThan(0);
  });

  it('gleiche Läden teilen sich die Kunden, verschiedene nicht', () => {
    street();
    put('12,11', { b: 'cafe', lvl: 1 });
    const one = st('12,11').inc;
    put('13,11', { b: 'cafe', lvl: 1 });
    expect(st('12,11').inc).toBeCloseTo(one / 2);
    put('14,11', { b: 'friseur', lvl: 1 });
    expect(st('12,11').kunden).toBeCloseTo(st('14,11').kunden / 2);
  });

  it('Innenstadt: ab 3 verschiedenen Läden +10 %, das Kaufhaus zählt doppelt', () => {
    street();
    put('12,11', { b: 'kiosk', lvl: 1 }); put('13,11', { b: 'friseur', lvl: 1 });
    const s0 = st('12,11');
    expect(s0.types).toBe(2); expect(s0.inner).toBe(0);
    put('14,11', { b: 'post', lvl: 1 });
    const s1 = st('12,11');
    expect(s1.inner).toBeCloseTo(0.1);
    expect(s1.inc).toBeCloseTo(s0.inc * 1.1);
    expect(game("recalc(), shopWorld(T.net, []).types(T.net.vOf('12,11'))")).toBe(3);
  });
});

describe('Waren verkaufen', () => {
  it('Café verkauft Kaffee aus dem Lager zum Dreifachen – ohne Kaffee nichts', () => {
    street();
    put('12,11', { b: 'cafe', lvl: 1 });
    const sl = st('12,11').sales[0];
    expect(sl.res).toBe('kaffee');
    expect(sl.pay).toBeCloseTo(game('TRADE_PRICE.kaffee * SALE_MUL'));
    let m0 = game('state.money');
    game('produce(1)');
    expect(game('state.money')).toBe(m0);                                   // Lager leer
    game('state.res.kaffee = 100'); m0 = game('state.money');
    game('produce(1)');
    expect(game('state.res.kaffee')).toBeCloseTo(100 - sl.rate);
    expect(game('state.money') - m0).toBeCloseTo(sl.rate * sl.pay);
  });

  it('Markthalle verkauft Rohstoffe, Kaufhaus alle Waren', () => {
    street();
    game('state.festival = true');
    put('12,11', { b: 'markthalle', lvl: 1, rot: 1 });
    expect(st('12,11').sales.map(s => s.res).sort()).toEqual(['erz', 'holz', 'obst', 'stein']);
    put('16,11', { b: 'kaufhaus', lvl: 1, rot: 1 });
    expect(st('16,11').sales.length).toBe(game('Object.keys(RES).length'));
  });
});

describe('Kultur und Hotels', () => {
  it('Kino zieht Besucher an, das Hotel macht die ganze Insel anziehender', () => {
    const a0 = game("placeStats().attr.get('home') || 0");
    put('12,12', { b: 'kino', lvl: 1 }); game('recalc()');
    const a1 = game("placeStats().attr.get('home')");
    expect(a1).toBeCloseTo(a0 + game('SHOPS.kino.attr'));
    put('16,12', { b: 'hotel', lvl: 1 }); game('recalc()');
    expect(game("placeStats().attr.get('home')")).toBeCloseTo(a1 * 1.25);
  });
});

describe('Plantagen', () => {
  it('nur auf fernen Inseln', () => {
    for (let i = 0; i < 3; i++) put(`${3 + i},3`, { b: 'haus', lvl: 3 });                  // Mitarbeiter
    game('state.res.bretter = 100');
    game("state.festival = true; state.islands = new Set(['home', ...ISLES.map(i => i.id)]); ensureFar(); discoverIsland(FAR[0].id); closeModal()");
    expect(game("placeError('kaffeeplantage', 12, 12)")).toMatch(/fernen Inseln/);
    const spot = game(`(() => { const f = FAR[0]; for (let d = 1; d < 6; d++) for (const [dx, dy] of [[d, 0], [0, d], [-d, 0], [0, -d]]) { const x = f.cx + dx, y = f.cy + dy; if (placeError('kaffeeplantage', x, y) === null) return [x, y]; } return null; })()`);
    expect(spot).not.toBe(null);
    game(`build('kaffeeplantage', ${spot[0]}, ${spot[1]}, true); recalc()`);
    expect(game('T.prod.kaffee')).toBeGreaterThan(0);
  });
});

describe('Hauswünsche', () => {
  it('Stadthaus wünscht sich einen Laden, Villa ein Café, Glasvilla Kultur', () => {
    expect(game("HOUSE_STAGES[3].wishes")).toContain('laden');
    expect(game("HOUSE_STAGES[4].wishes")).toContain('cafe');
    expect(game("HOUSE_STAGES[5].wishes")).toContain('kultur');
    street(1);
    expect(game("recalc(), wishCheck('laden', 3, 9).ok")).toBe(false);
    put('18,11', { b: 'kiosk', lvl: 1 });
    expect(game("recalc(), wishCheck('laden', 3, 9)")).toEqual({ ok: true, how: 'viertel' });
  });
});

describe('Anzeige', () => {
  it('Infofenster: Kundschaft, Innenstadt, fehlende Ware', () => {
    street();
    put('12,11', { b: 'cafe', lvl: 1 }); game('recalc(); openInfo(12, 11)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toMatch(/Kundschaft/);
    expect(txt).toMatch(/Innenstadt/);
    expect(txt).toMatch(/Kein Kaffee im Lager/);
  });

  it('alle Läden, Kulturbauten und Plantagen lassen sich in allen Richtungen zeichnen', () => {
    for (const id of game("[...Object.keys(SHOPS), 'kaffeeplantage', 'teegarten', 'kakaoplantage']")) for (const r of [0, 1, 2, 3]) for (const pass of ['ground', 'object', null]) {
      expect(() => game(`PASS = ${JSON.stringify(pass)}; drawObject('${id}', 300, 300, 1.2, 1000, 4, 4, 1, { b: '${id}', rot: ${r}, lvl: 1 }); PASS = null`), `${id} ${r}`).not.toThrow();
    }
  });

  it('jeder Laden steht im Bau-Menü und hat einen Tipp', () => {
    const inMenu = game('MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)');
    for (const id of game('Object.keys(SHOPS)')) { expect(inMenu).toContain(id); expect(game(`!!ITEM_TIPS.${id}`)).toBe(true); }
  });
});
