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

describe('Wasser-Wegbrücken: Bauen im neuen Format (160c D3b)', () => {
  const bau = (x, y, style = 'sand') => game(`(() => { chosenStyle.weg = '${style}'; setTool('weg'); const ok = build('weg', ${x}, ${y}, true); setTool('look'); return ok; })()`);
  const fluss = () => game("for (let y = 3; y <= 9; y++) for (let x = 10; x <= 14; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc()");
  it('neues Feld: neues Format mit ausdrücklicher Art; bezahlt = Preis vorher (costOf) = Erstattung', () => {
    fluss(); bau(9, 6); 
    for (const [x, st] of [[10, 'sand'], [11, 'platten']]) {
      const c = game(`costOf('weg', ${x}, 6)`), w0 = wallet();
      expect(bau(x, 6, st)).toBe(true);
      const t = game(`state.tiles.get('${x},6')`);
      expect([t.bridge, !!t.brp, t.brk, t.brm]).toEqual([true, true, 'holz', 'holz']);   // verlängert: wie die Brücke daneben (Holz), auch auf Platten
      const paid = diff(wallet(), w0);
      expect(paid.money).toBe(c.cost);
      expect(zurueck([x + ',6'])).toEqual(paid);                                       // Brückenfeld: Preis = Brücke (kein Weg dazu)
    }
  });
  it('verlängern: gekauftes Licht (auch aus) kommt mit und wird bezahlt', () => {
    fluss(); bau(9, 6); bau(10, 6); bau(11, 6);
    game("wbSet(10, 6, { licht: 'kaufen' }); wbSet(10, 6, { licht: 'aus' })");
    const w0 = wallet();
    expect(bau(12, 6)).toBe(true);
    expect(game("state.tiles.get('12,6').brl")).toBe('aus');
    expect(diff(wallet(), w0)).toEqual({ money: 30 + 20, bretter: 2, metall: 1 });
  });
  it('zwei Brücken wachsen zusammen: die längere gewinnt, die kürzere übernimmt kostenlos; jedes Feld erstattet sein Bezahltes', () => {
    fluss(); bau(9, 6); bau(10, 6); bau(11, 6); bau(15, 6); bau(14, 6);
    game("wbSet(14, 6, { mat: 'stahl' })");
    const before = zurueck(['14,6']);
    expect(game("[brSpanLook(10, 6).mat, brSpanLook(14, 6).mat]")).toEqual(['holz', 'stahl']);
    const w0 = wallet();
    expect(bau(12, 6)).toBe(true); expect(bau(13, 6)).toBe(true);
    expect(diff(wallet(), w0).money).toBe(2 * 30);                                 // die neuen Felder im Aussehen der längeren (Holz)
    for (const x of [10, 11, 12, 13, 14]) expect(game(`brLook(state.tiles.get('${x},6'), 'wasser').mat`), x).toBe('holz');
    expect(zurueck(['14,6'])).toEqual(before);                                    // Metall bezahlt: Metall zurück
  });
});

describe('Wasser-Wegbrücken: Strom fürs Licht (160c D3c)', () => {
  it("Licht an: je Spanne 'W' + Anker, ohne Strom dunkel (Maler: dark); Licht aus oder ohne Licht: nichts im Strom", () => {
    kanal(10, 4, 3);
    expect(game("[...T.rail.power.dark].filter(k => k[0] === 'W')")).toEqual([]);
    game("wbSet(10, 4, { licht: 'kaufen' })");
    const a = game("wbAt(11, 4).G.anker");
    expect(a).toBe('10,4');
    const dunkel = game("T.rail.power.dark.has('W10,4')"), city = game('!!T.rail.power.city');
    if (city) expect(typeof dunkel).toBe('boolean'); else expect(dunkel).toBe(false);
    game("T.rail.power.dark.add('W10,4')");
    expect(game("wbArgs(wbAt(11, 4), 0, 0, 1).opts.dark")).toBe(true);
    game("wbSet(10, 4, { licht: 'aus' })");
    expect(game("[...T.rail.power.dark].filter(k => k[0] === 'W')")).toEqual([]);
  });
});

describe('Wasser-Wegbrücken: Fenster (160c D3e)', () => {
  const klick = sel => game(`document.querySelector('#panel ${sel}').click()`);
  it('Kopf und Text; Material, Farbe, Planken, Stützen, Licht über die Knöpfe; Ziegel/Rot-Knöpfe gibt es nicht mehr', () => {
    kanal(10, 4, 3, { steg: true });
    game('openInfo(11, 4)');
    expect(game("document.querySelector('#panel h3').textContent")).toMatch(/Brücke aus Holz/);
    expect(game("document.querySelector('#panel p.muted').textContent")).toMatch(/3 Felder lang.*Flach: Boote kommen nicht darunter durch/);
    expect(game("document.querySelectorAll('#panel [data-brk]').length")).toBe(0);
    expect(game("[...document.querySelectorAll('#panel [data-bkart]')].map(e => e.dataset.bkart)")).toEqual(['holz', 'stahl', 'stein', 'kristall']);
    klick('[data-brw="2"]'); expect(look(11, 4).plank).toBe(2);
    klick('[data-brc="5"]'); expect(look(11, 4).col).toBe(5);
    klick('[data-bru="jede"]'); expect(look(11, 4).stuetzen).toBe('jede');
    klick('[data-brl="kaufen"]'); expect(look(11, 4).licht).toBe('an');
    klick('[data-bkart="stein"]'); expect(look(11, 4).mat).toBe('stein');
    expect(game("document.querySelector('#panel h3').textContent")).toMatch(/Brücke aus Stein/);
    expect(game("!!document.querySelector('#panel [data-brs]') && !document.querySelector('#panel [data-brb]')")).toBe(true);   // Stein: Belag, keine Deck-Wahl
    expect(game("document.querySelector('#panel [data-bkart=\"kristall\"]').classList.contains('locked')")).toBe(true);
    game('undo()'); expect(look(11, 4).mat).toBe('holz');                                 // ↶
  });
  it('unbekannte Art aus dem Live-Spiegel: Fenster öffnet ohne Fehler; Anhöhe zeigt Planken bei Holz', () => {
    kanal(10, 4, 2, { alt: { brk: 'gold' } });
    expect(() => game('openInfo(10, 4)')).not.toThrow();
    expect(game("document.querySelector('#panel h3').textContent")).toMatch(/Brücke aus Holz/);
    game("for (let y = 20; y <= 24; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); state.bruecken.set('14,22', { ax: 0, n: 3, art: 'holz' }); groundVersion++; recalc(); openBkInfo(15, 22)");
    expect(game("document.querySelectorAll('#panel [data-brw]').length")).toBe(7);
    klick('[data-brw="1"]'); expect(game("brLook(state.bruecken.get('14,22'), 'anhoehe').plank")).toBe(1);
  });
});

describe('Wasser-Wegbrücken: Leiste und Schild beim Ziehen (160c D3f)', () => {
  const fluss = () => game("state.design = new Set(DESIGN.map(d => d.id)); for (let y = 3; y <= 9; y++) for (let x = 10; x <= 12; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc()");   // alle Wegstile frei
  const ziehen = (y, style) => game(`(() => { chosenStyle.weg = '${style}'; setTool('weg'); startPlan('line', { x: 8, y: ${y} }, { x: 14, y: ${y} }, false); const info = planInfo(plan); const txt = planText(plan, info); runPlan(); setTool('look'); return [txt, info.cost]; })()`);
  const leiste = (mat, col = 0) => game(`state.paintNew.bruecke = { form: BK_ART_IDS.indexOf('${mat}'), col: ${col} }`);
  it('Leiste mit dem Brücken-Werkzeug: Metall/Stein setzen das Material (und die Farbe), Holz = wie der Wegstil; Kristall gesperrt → Wegstil', () => {
    fluss(); game("state.techs.add('terraform')");
    expect(game("available('bruecke')")).toBe(true);
    leiste('stahl', 3); const [t1] = ziehen(4, 'sand');
    expect(t1).toMatch(/🌉 Brücke: Metall · 3 Felder/);
    expect(look(11, 4)).toMatchObject({ mat: 'stahl', col: 2 });
    leiste('holz'); ziehen(6, 'asphalt');
    expect(look(11, 6).mat).toBe('stein');                                                // Holz in der Leiste: wie der Wegstil (Asphalt → Stein)
    leiste('kristall'); ziehen(8, 'sand');
    expect(look(11, 8).mat).toBe('holz');                                                 // gesperrt: wie der Wegstil
  });
  it('ohne das Brücken-Werkzeug: wie der Wegstil; Schild nennt das Material; Preis = gebaut', () => {
    fluss(); leiste('stahl');
    const w0 = wallet(), [txt, cost] = ziehen(4, 'sand');
    expect(txt).toMatch(/🌉 Brücke: Holz · 3 Felder/);
    expect(look(11, 4).mat).toBe('holz');
    expect(-diff(w0, wallet()).money).toBe(cost);
  });
});

describe('Wasser-Wegbrücken: Hinweis, wenn eine Brücke einen Seeweg kappt (160c D3g)', () => {
  it('seaRoutesWarn meldet, was fehlt (mit ↶-Hinweis); nichts verloren: still', () => {
    const r = game(`(() => { const out = [], ts = toast; toast = m => out.push(m);
      try { const f0 = T.ferries; T.ferries = [{ stations: ['1,1', '9,9'], noSea: false }]; const b = seaRoutesNow(); const a = seaRoutesWarn(b);
        T.ferries = [{ stations: ['1,1', '9,9'], noSea: true }]; const c = seaRoutesWarn(b); T.ferries = f0; return [a, c, out]; } finally { toast = ts; } })()`);
    expect(r[0]).toBe(false); expect(r[1]).toBe(true);
    expect(r[2][0]).toMatch(/versperrt den Seeweg.*nur unter Bögen.*↶/);
  });
  it('Weg übers Wasser ziehen, Material im Fenster, Brücke ablegen: vorher/nachher verglichen', () => {
    kanal(10, 4, 3);
    const calls = game(`(() => { const out = [], w = seaRoutesWarn; seaRoutesWarn = b => { out.push(!!b); return w(b); };
      try {
        game_plan: { chosenStyle.weg = 'sand'; setTool('weg'); state.terra.set('10,8', 'water'); state.terra.set('11,8', 'water'); waterChanged(); recalc(); startPlan('line', { x: 8, y: 8 }, { x: 13, y: 8 }, false); runPlan(); setTool('look'); }
        wbSet(10, 4, { mat: 'stein' }); wbSet(10, 4, { col: 2 });
      } finally { seaRoutesWarn = w; } return out; })()`);
    expect(calls).toEqual([true, true, false]);
  });
});
