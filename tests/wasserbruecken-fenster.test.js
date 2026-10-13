const { loadGame, game } = require('./helpers/load-game');

// 160c D3 (plan-160c/karte-D3.md, Antworten §7): Wasser-Wegbrücken im neuen Format – Setzer wbSet (ganze Spanne, Bilanz null, jedes Feld
// erstattet sein Bezahltes), Felder immer aus dem Aussehen (brWriteLook), Sperren übers Wasser (Holz, Metall, Stein frei; Kristall gesperrt)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; setTool('look')");
  game("for (let y = 2; y <= 40; y++) for (let x = 2; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear()");
});
// Kanal längs x: Wasser u0 … u0+N−1 (steg: offen am +Ende), Ufer mit Weg, Brücke aus Altfeldern (brk/brc/brw)
const kanal = (u0, v0, N, { breit = 1, steg = false, style = 'sand', alt = {} } = {}) => game(`(() => {
  const wB = ${steg ? 5 : 0};
  for (let v = ${v0} - 2; v <= ${v0} + ${breit} + 1; v++) for (let u = ${u0} - 3; u <= ${u0} + ${N} + 2 + wB; u++) state.terra.set(u + ',' + v, u >= ${u0} && u < ${u0} + ${N} + wB ? 'water' : 'grass');
  for (let r = 0; r < ${breit}; r++) {
    for (let u = ${u0} - 3; u < ${u0}; u++) state.tiles.set(u + ',' + (${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: 0 });
    if (!${steg}) for (let u = ${u0} + ${N}; u <= ${u0} + ${N} + 2; u++) state.tiles.set(u + ',' + (${v0} + r), { b: 'weg', lvl: 1, style: '${style}', lauf: 0 });
    for (let u = ${u0}; u < ${u0} + ${N}; u++) state.tiles.set(u + ',' + (${v0} + r), { b: 'weg', lvl: 1, style: '${style}', bridge: true, lauf: 0, ...${JSON.stringify(alt)} });
  }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const wallet = () => game('({ money: state.money, ...state.res })');
const diff = (a, b) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].map(k => [k, (b[k] || 0) - (a[k] || 0)]).filter(([, v]) => v));
const felder = (x0, y, N) => Array.from({ length: N }, (_, i) => (x0 + i) + ',' + y);
const look = (x, y) => game(`brSpanLook(${x}, ${y})`);
const zurueck = keys => game(`(() => { const s = {}; for (const k of ${JSON.stringify(keys)}) { const d = demolishInfo(...keyXY(k)); s.money = (s.money || 0) + d.refund; /* Brückenkachel: nur der Brückenpreis (demolishInfo) */ for (const [r, v] of Object.entries(d.mat || {})) s[r] = (s[r] || 0) + v; } return s; })()`);

describe('Wasser-Wegbrücken: Setzer wbSet (160c D3a)', () => {
  it('Material wechseln: ganze Spanne, alte Preise zurück, neuer Preis je Feld; Bilanz null; Felder einheitlich im neuen Format', () => {
    kanal(10, 4, 3);
    const w0 = wallet();
    expect(game("wbSet(11, 4, { mat: 'stahl' })")).toBe(true);
    expect(diff(w0, wallet())).toEqual({ money: 3 * 30 - 3 * 100, bretter: 3 * 2, quader: -3 * 2, metall: -3 * 2 });
    expect(look(11, 4).mat).toBe('stahl');
    for (const k of felder(10, 4, 3)) expect(game(`(t => [brIsNew(t, 'wasser'), t.brm, t.brk])(state.tiles.get('${k}'))`)).toEqual([true, 'stahl', 'stein']);   // brk für ältere Fassungen: Rückfall Stein
    expect(zurueck(felder(10, 4, 3))).toEqual({ money: 300, quader: 6, metall: 6 });   // jedes Feld erstattet seinen Neupreis
    const w1 = wallet();
    expect(game("wbSet(10, 4, { mat: 'holz' })")).toBe(true);
    expect(diff(w1, wallet())).toEqual({ money: 300 - 90, quader: 6, metall: 6, bretter: -6 });
    expect(game("wbSet(10, 4, { mat: 'holz' })")).toBe(false);                          // schon so
  });
  it('Sperren übers Wasser: Holz, Metall, Stein frei; Kristall gesperrt (ohne Kristallinsel) – nichts geändert, Meldung', () => {
    kanal(10, 4, 2);
    expect(game("[brMatLock('stein', 'wasser'), brMatLock('stahl', 'wasser'), brMatLock('holz', 'wasser')]")).toEqual([null, null, null]);
    expect(game("brMatLock('kristall', 'wasser')")).toMatch(/Kristall/);
    const w0 = wallet();
    expect(game("wbSet(10, 4, { mat: 'kristall' })")).toBe(false);
    expect(diff(w0, wallet())).toEqual({});
    expect(game("wbSet(10, 4, { mat: 'stein' })")).toBe(true);
    expect(game("bridgeArch(10, 4).wall")).toBe(true);                                   // Stein: Mauer (Boote nur durch Öffnungen)
  });
  it('alte Rote: Farbe wechseln behält die Art (brk rot, Preis wie bezahlt); „Wie das Material“ macht sie zu Holz in Holzfarbe', () => {
    kanal(10, 4, 3, { alt: { brk: 'rot' } });
    expect(look(10, 4)).toMatchObject({ mat: 'holz', col: 3, plank: 5 });
    expect(game("wbSet(10, 4, { col: 6 })")).toBe(true);
    expect(look(10, 4)).toMatchObject({ mat: 'holz', col: 6, plank: 5 });
    expect(game("[state.tiles.get('11,4').brk, state.tiles.get('11,4').brc]")).toEqual(['rot', 6]);
    expect(zurueck(felder(10, 4, 3))).toEqual({ money: 240, bretter: 6, metall: 3 });   // erstattet wie bezahlt (Rot)
    expect(game("wbSet(10, 4, { col: null })")).toBe(true);
    expect(look(10, 4)).toMatchObject({ mat: 'holz', col: null, plank: null });
    expect(game("bridgeKind(state.tiles.get('10,4'))")).toBe('holz');
    expect(zurueck(felder(10, 4, 3))).toEqual({ money: 240, bretter: 6, metall: 3 });   // das Bezahlte bleibt
  });
  it('alte Rote: Material wechseln behält die sichtbare Farbe (rote Metallbrücke)', () => {
    kanal(10, 4, 2, { alt: { brk: 'rot' } });
    expect(game("wbSet(10, 4, { mat: 'stahl' })")).toBe(true);
    expect(look(10, 4)).toMatchObject({ mat: 'stahl', col: 3 });
  });
  it('Licht und Zacken kaufen: Aufpreis je Feld, an/aus kostenlos; Zacken nur bei Kristall', () => {
    kanal(10, 4, 3);
    const w0 = wallet();
    expect(game("wbSet(10, 4, { licht: 'kaufen' })")).toBe(true);
    expect(diff(w0, wallet())).toEqual({ money: -60, metall: -3 });
    expect(look(10, 4).licht).toBe('an');
    const w1 = wallet();
    expect(game("wbSet(10, 4, { licht: 'aus' })")).toBe(true);
    expect(diff(w1, wallet())).toEqual({});
    expect(look(10, 4).licht).toBe('aus');
    expect(zurueck(felder(10, 4, 3))).toEqual({ money: 150, bretter: 6, metall: 3 });   // Holz + Licht je Feld
    expect(game("wbSet(10, 4, { zacken: 'kaufen' })")).toBe(false);                    // Holz: keine Zacken
  });
  it('Planken, Deck, Stützen: nur wo es passt; breite Brücke: alle Reihen', () => {
    kanal(10, 4, 6, { breit: 2 });
    expect(game("wbSet(12, 5, { plank: 2 })")).toBe(true);
    expect(game("[brSpanLook(10, 4), brSpanLook(15, 5)].map(L => L.plank)")).toEqual([2, 2]);
    expect(game("wbSet(12, 4, { stuetzen: 'jede' })")).toBe(true);
    expect(look(12, 4).stuetzen).toBe('jede');
    expect(game("wbSet(12, 4, { deck: 'belag' })")).toBe(true);
    expect(look(12, 4).deck).toBe('belag');
    game("wbSet(12, 4, { mat: 'stein' })");
    expect(game("[wbSet(12, 4, { stuetzen: 'keine' }), wbSet(12, 4, { plank: 1 }), wbSet(12, 4, { deck: 'muster' })]")).toEqual([false, false, false]);
  });
  it('zu wenig Geld: nichts ändert sich; unbekannte Art aus dem Live-Spiegel wirft nie', () => {
    kanal(10, 4, 3);
    game('state.money = 10');
    expect(game("wbSet(10, 4, { mat: 'stahl' })")).toBe(false);
    expect(look(10, 4).mat).toBe('holz');
    kanal(10, 12, 2, { alt: { brk: 'gold' } });
    expect(() => game("wbSet(10, 12, { col: 2 }); brSpanLook(10, 12)")).not.toThrow();
  });
  it('Altversion: jedes Feld nach dem Setzen hat eine bekannte Art (brk) und ein gültiges brp mit passender Kennung', () => {
    kanal(10, 4, 3, { alt: { brk: 'rot' } }); kanal(10, 12, 3, { style: 'kopf' });
    for (const [x, y, ch] of [[10, 4, { mat: 'stahl' }], [10, 12, { col: 1 }], [10, 12, { licht: 'kaufen' }], [10, 4, { mat: 'stein' }]]) game(`wbSet(${x}, ${y}, ${JSON.stringify(ch)})`);
    const bad = game(`[...state.tiles].filter(([, t]) => isWegBridge(t)).filter(([, t]) => !WEG_BRIDGE[t.brk || bridgeKind(t)] || !brIsNew(t, 'wasser')).map(([k]) => k)`);
    expect(bad).toEqual([]);
  });
});
