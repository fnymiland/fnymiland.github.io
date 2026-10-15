const { loadGame, game } = require('./helpers/load-game');

// 160c F1c: Fußgängerbrücke am Übergang – Fenster, Setzer (brSet 'uebergang' → ubSet), Geld. Neu gebaut im neuen Format (footPaid = Rückfall
// holz/stein/kristall, brm, brp); Material wechseln: Bezahltes zurück, neuer Preis; Licht/Zacken je Brücke; Farbe, Planken, Deck kostenlos.
// Ältere Fassungen (v951 …) erstatten nach FOOT_STYLES[footPaid] – nie mehr, als bezahlt wurde
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; state.techs.add("bahn"); state.restore.erzberg = 1; if (!state.legacy) state.legacy = new Set(); state.legacy.add("brmat:kristall")');   // Kristall frei (sonst erst mit der Kristallmine)
  game("for (let y = 3; y <= 12; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); state.hills.delete(x + ',' + y); }");
  game('recalc()');
  for (let x = 6; x <= 12; x++) game(`build('schiene', ${x}, 8, true)`);
  for (let y = 6; y <= 10; y++) game(`build('weg', 9, ${y}, true)`);
  game('resetUndo()');
});
const t = () => game("state.tiles.get('9,8')");
const wallet = () => game('({ money: state.money, ...state.res })');
const diff = (a, b) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = (b[k] || 0) - (a[k] || 0); if (d) o[k] = d; } return o; };
const neg = c => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, -v]));
const set = ch => game(`brSet({ at: 'uebergang', x: 9, y: 8 }, ${JSON.stringify(ch)})`);
const look = () => game("brLook(state.tiles.get('9,8'), 'uebergang')");
const V951_FOOT = { holz: { money: 60, bretter: 4, metall: 2 }, stein: { money: 150, quader: 8 }, weg: { money: 120, bretter: 4, quader: 4 }, kristall: { money: 300, kristall: 5, metall: 2 } };
const altErstattet = tile => { const fp = tile.footPaid === true ? 'holz' : tile.footPaid; return V951_FOOT[fp] || {}; };
const nieMehr = (tile, paid) => { for (const [r, v] of Object.entries(altErstattet(tile))) expect(paid[r] || 0, r).toBeGreaterThanOrEqual(v); };

describe('Fußgängerbrücke am Übergang: Fenster und Geld (160c F1c)', () => {
  it('neu bauen in jedem Material: Preis aus BR_COST, footPaid nur Rückfall (Metall → holz), Abriss gibt genau das Bezahlte zurück', () => {
    for (const mat of ['holz', 'stahl', 'stein', 'kristall']) {
      game("Object.assign(state.tiles.get('9,8'), { foot: false }); delete state.tiles.get('9,8').footPaid; delete state.tiles.get('9,8').brp; for (const f of BR_KEYS) delete state.tiles.get('9,8')[f]");
      const w0 = wallet();
      expect(game(`setCrossing(9, 8, true, '${mat}')`), mat).toBe(true);
      const cost = game(`({ ...BR_COST.uebergang.${mat} })`);
      expect(diff(w0, wallet()), mat).toEqual(neg(cost));
      expect(t().footPaid, mat).toBe(mat === 'stahl' ? 'holz' : mat);
      expect(look().mat, mat).toBe(mat);
      expect(game("brNoK(state.tiles.get('9,8').brp)")).toEqual(cost);
      nieMehr(t(), cost);
      const d = game('demolishInfo(9, 8)');
      expect(d.refund, mat).toBe(cost.money + game('ITEMS.weg.cost') + game('ITEMS.schiene.cost'));
    }
  });
  it('Material wechseln hin und her: am Ende nur der Holzpreis weg; jedes Mal nie mehr erstattet (ältere Fassung) als bezahlt', () => {
    const w0 = wallet();
    game("setCrossing(9, 8, true, 'holz')");
    for (const mat of ['stahl', 'kristall', 'stein', 'holz']) {
      expect(set({ mat }), mat).toBe(true);
      expect(look().mat).toBe(mat);
      nieMehr(t(), game("brPaid(state.tiles.get('9,8'), 'uebergang')"));
    }
    expect(diff(w0, wallet())).toEqual(neg(game('({ ...BR_COST.uebergang.holz })')));
    expect(set({ mat: 'holz' })).toBe(false);                                // schon Holz
  });
  it('alter Stand „Wie der Weg“: Farbe ändern behält footPaid weg und den Belag (brp = alter Preis); Material wechseln: footPaid holz/stein', () => {
    game("Object.assign(state.tiles.get('9,8'), { foot: true, footPaid: 'weg' })");
    expect(look()).toMatchObject({ mat: 'holz', deck: 'belag' });
    const w0 = wallet();
    expect(set({ col: 4 })).toBe(true);
    expect(wallet()).toEqual(w0);
    expect(t()).toMatchObject({ footPaid: 'weg', brc: 4, brb: 'belag' });
    expect(game("brNoK(state.tiles.get('9,8').brp)")).toEqual(V951_FOOT.weg);
    expect(look()).toMatchObject({ mat: 'holz', deck: 'belag', col: 4 });
    expect(set({ mat: 'stein' })).toBe(true);
    expect(diff(w0, wallet())).toEqual(diff(game('({ ...BR_COST.uebergang.stein })'), V951_FOOT.weg));   // Weg-Preis zurück, Stein bezahlt
    expect(t().footPaid).toBe('stein');
    expect(look()).toMatchObject({ mat: 'stein', deck: 'belag', col: 4 });
  });
  it('alter Kristall-Übergang: Licht ohne Aufpreis und ohne Strom bleibt beim Umfärben; aus → an braucht dann Strom, kostet aber nichts', () => {
    game("Object.assign(state.tiles.get('9,8'), { foot: true, footPaid: 'kristall' })");
    const w0 = wallet();
    expect(set({ col: 2 })).toBe(true);
    expect(look()).toMatchObject({ mat: 'kristall', licht: 'an', lichtGratis: true });
    expect('brl' in t()).toBe(false);
    expect(set({ licht: 'aus' })).toBe(true);
    expect(look().licht).toBe('aus');
    expect(set({ licht: 'an' })).toBe(true);
    expect(look()).toMatchObject({ licht: 'an' });
    expect(look().lichtGratis).toBeUndefined();
    expect(wallet()).toEqual(w0);
    expect(set({ mat: 'holz' })).toBe(true);                                 // Licht ohne Aufpreis gehört zum alten Kristall – gekauftes kommt mit
  });
  it('Licht und Zacken je Brücke kaufen (BR_OPT …ganz), an/aus kostenlos; Zacken nur Kristall; Abriss gibt alles zurück', () => {
    game("setCrossing(9, 8, true, 'kristall')");
    let w = wallet();
    expect(set({ licht: 'kaufen' })).toBe(true);
    expect(diff(w, wallet())).toEqual(neg(game('({ ...BR_OPT.licht.ganz })')));
    w = wallet();
    expect(set({ zacken: 'kaufen' })).toBe(true);
    expect(diff(w, wallet())).toEqual(neg(game('({ ...BR_OPT.zacken.ganz })')));
    expect(look()).toMatchObject({ licht: 'an', zacken: true });
    w = wallet();
    expect(set({ zacken: 'aus' })).toBe(true); expect(set({ licht: 'aus' })).toBe(true);
    expect(wallet()).toEqual(w);
    expect(look()).toMatchObject({ licht: 'aus', zacken: false });
    const paid = game("brPaid(state.tiles.get('9,8'), 'uebergang')");
    expect(paid.money).toBe(game('BR_COST.uebergang.kristall.money + BR_OPT.licht.ganz.money + BR_OPT.zacken.ganz.money'));
    nieMehr(t(), paid);
    expect(set({ mat: 'holz' })).toBe(true);
    expect(set({ zacken: 'kaufen' })).toBe(false);
    expect(look()).toMatchObject({ mat: 'holz', licht: 'aus' });               // gekauftes Licht kommt mit (aus bleibt aus)
  });
  it('Fenster: ohne Brücke vier Materialien mit Preis; mit Brücke Material, Farbe, Deck, Planken, Licht (Preis je Brücke), keine Stützen; ↶ nimmt zurück', () => {
    game('openInfo(9, 8)');
    expect([...document.querySelectorAll('#panel [data-foot]')].map(b => b.dataset.foot)).toEqual(['holz', 'stahl', 'stein', 'kristall']);
    expect(document.querySelector('#panel [data-foot="stahl"]').textContent).toContain('200');
    game("document.querySelector('#panel [data-foot=\"stahl\"]').click()");
    expect(look().mat).toBe('stahl');
    const html = game("document.getElementById('panel').innerHTML");
    expect(game("document.querySelectorAll('#panel [data-bkart]').length")).toBe(4);
    expect(game("document.querySelectorAll('#panel [data-brb]').length")).toBe(2);
    expect(game("document.querySelectorAll('#panel [data-bru]').length")).toBe(0);
    expect(html).toContain(`Licht kaufen −${game('BR_OPT.licht.ganz.money')}`);
    const w = wallet();
    game("document.querySelector('#panel [data-bkart=\"stein\"]').click()");
    expect(look().mat).toBe('stein');
    game('undo()');
    expect(look().mat).toBe('stahl');
    expect(wallet()).toEqual(w);
    game("openInfo(9, 8); document.querySelector('#panel [data-brb=\"belag\"]').click()");
    expect(look().deck).toBe('belag');
    game('closePanel()');
  });
  it('Kopie einer Metall-Brücke: zahlt den Preis des Aussehens, footPaid bleibt Rückfall holz', () => {
    game("setCrossing(9, 8, true, 'stahl'); brSet({ at: 'uebergang', x: 9, y: 8 }, { licht: 'kaufen' }); brSet({ at: 'uebergang', x: 9, y: 8 }, { licht: 'aus' })");
    const c = game("copyClone({ kind: 'tile', t: state.tiles.get('9,8') }).t");
    expect(c).toMatchObject({ footPaid: 'holz', brm: 'stahl' });
    expect(game(`brNoK(${JSON.stringify(c.brp)})`)).toEqual(game('({ ...BR_COST.uebergang.stahl })'));   // ausgeschaltetes Licht kommt nicht mit
  });
  it('neuer Kristall-Übergang: ohne Licht (brl nein – der Rückfall footPaid kristall hieße sonst Licht ohne Aufpreis), auch die Kopie', () => {
    game("setCrossing(9, 8, true, 'kristall')");
    expect(t()).toMatchObject({ footPaid: 'kristall', brm: 'kristall', brl: 'nein' });
    expect(look().licht).toBe(null);
    expect(look().lichtGratis).toBeUndefined();
    const c = game("copyClone({ kind: 'tile', t: state.tiles.get('9,8') }).t");
    expect(game(`brLook(${JSON.stringify(c)}, 'uebergang').licht`)).toBe(null);
    const alt = game("copyClone({ kind: 'tile', t: { b: 'schiene', cross: true, foot: true, footPaid: 'kristall', style: 'sand' } }).t");
    expect(game(`brLook(${JSON.stringify(alt)}, 'uebergang')`)).toMatchObject({ licht: 'an', lichtGratis: true });   // alter Kristall: Licht bleibt ohne Aufpreis
  });
});
