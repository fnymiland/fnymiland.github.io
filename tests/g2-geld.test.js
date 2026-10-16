const { loadGame, game } = require('./helpers/load-game');

// 160c G2 (Gesamtprüfung, plan-160c/g2-funde.md): Geld. Kopien rechnen und schreiben wie ein Neubau (Wasser: Art aus dem Aussehen, Übergang:
// Neupreis ohne altes Design), ältere Fassungen erstatten nie mehr als bezahlt, Anhöhen-Brücken ohne brp mit eingefrorenem Rückfall je
// Material, Plan-Preis = Abbuchung auch zwischen zwei Gleisbrücken, rohe Werte werfen nie
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000; state.techs.add('bahn'); state.techs.add('terraform'); if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall'); state.restore.erzberg = 1");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); if (state.bruecken) state.bruecken.clear(); recalc()");
});
const leq = (alt, paid) => Object.entries(alt).every(([r, v]) => (paid[r] || 0) >= v);   // je Rohstoff nie mehr als bezahlt
const V951_FOOT = { holz: { money: 60, bretter: 4, metall: 2 }, stein: { money: 150, quader: 8 }, weg: { money: 120, bretter: 4, quader: 4 }, kristall: { money: 300, kristall: 5, metall: 2 } };

describe('Kopie einer Wasser-Wegbrücke: Art aus dem Aussehen (G2-Geld-1)', () => {
  const bau = (x, y, style = 'sand') => game(`(() => { state.design = new Set(DESIGN.map(d => d.id)); chosenStyle.weg = '${style}'; setTool('weg'); const ok = build('weg', ${x}, ${y}, true); setTool('look'); return ok; })()`);
  it('zusammengewachsen (Holzfeld im Stein-Aussehen): jede Kopie hat eine Art, die v1016 nie über dem Kopierpreis erstattet', () => {
    game("for (let y = 3; y <= 9; y++) for (let x = 10; x <= 15; x++) state.terra.set(x + ',' + y, 'water'); terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc()");
    bau(9, 6); bau(10, 6, 'sand'); bau(16, 6, 'asphalt'); bau(15, 6, 'asphalt'); bau(14, 6, 'asphalt'); bau(13, 6, 'asphalt'); bau(11, 6); bau(12, 6);
    expect(game("[bridgeKind(state.tiles.get('10,6')), brLook(state.tiles.get('10,6'), 'wasser').mat]")).toEqual(['holz', 'stein']);
    const bad = game(`[10, 11, 12, 13, 14, 15].map(x => copyClone({ kind: 'tile', t: state.tiles.get(x + ',6') }).t).filter(c => {
      const B = WEG_BRIDGE[bridgeKind(c)], p = brPaid(c, 'wasser'); return !B || Object.entries(brMoney(B.cost, B.mat)).some(([r, v]) => (p[r] || 0) < v); }).map(c => bridgeKind(c))`);
    expect(bad).toEqual([]);
    expect(game("brLook(copyClone({ kind: 'tile', t: state.tiles.get('10,6') }).t, 'wasser').mat")).toBe('stein');   // das Aussehen bleibt
  });
});

describe('Kopie einer Fußgängerbrücke am Übergang: Neupreis (G2-Geld-3)', () => {
  const uebergang = extra => game(`(() => { for (let x = 6; x <= 12; x++) state.tiles.set(x + ',8', { b: 'schiene', lvl: 1, form: 0 }); for (let y = 6; y <= 10; y++) if (y !== 8) state.tiles.set('9,' + y, { b: 'weg', lvl: 1, style: 'sand' });
    state.tiles.set('9,8', { b: 'schiene', lvl: 1, form: 0, cross: true, style: 'fisch', ...${JSON.stringify(extra)} }); recalc(); })()`);
  const kopie = () => game("(() => { const c = copyClone({ kind: 'tile', t: state.tiles.get('9,8') }).t; return { c, paid: brPaid(c, 'uebergang'), cost: copyTileCost(c) }; })()");
  it('neuer Kristall-Übergang: die Kopie kostet den Neupreis (nicht den alten Designpreis); Kopierpreis = brp', () => {
    uebergang({}); expect(game("setCrossing(9, 8, true, 'kristall')")).toBe(true);
    const k = kopie(), neu = game('({ ...BR_COST.uebergang.kristall })');
    expect(game(`brNoK(${JSON.stringify(k.c.brp)})`)).toEqual(neu);
    expect(k.cost).toEqual(game(`brAdd(brAdd({ money: 0 }, BR_COST.uebergang.kristall), { money: ITEMS.weg.cost + ITEMS.schiene.cost, ...ITEMS.schiene.mat })`));
    expect(k.c.footPaid).toBe('kristall');
  });
  it('alter „Wie der Weg“-Übergang umgefärbt: die Kopie ist Holz zum Holzpreis, footPaid holz – v951 erstattet nie mehr', () => {
    uebergang({ foot: true, footPaid: 'weg' });
    expect(game("brSet({ at: 'uebergang', x: 9, y: 8 }, { col: 3 })")).toBe(true);
    const k = kopie();
    expect(k.c.footPaid).toBe('holz');
    expect(game(`brNoK(${JSON.stringify(k.c.brp)})`)).toEqual(game('({ ...BR_COST.uebergang.holz })'));
    expect(leq(V951_FOOT[k.c.footPaid], k.paid)).toBe(true);
    expect(game(`brLook(${JSON.stringify(k.c)}, 'uebergang')`)).toMatchObject({ mat: 'holz', deck: 'belag', col: 3 });
  });
  it('alter Kristall-Übergang ohne brp: die Kopie behält den alten Designpreis mit Licht ohne Aufpreis (wie bisher)', () => {
    uebergang({ foot: true, footPaid: 'kristall' });
    const k = kopie();
    expect(game(`brNoK(${JSON.stringify(k.c.brp)})`)).toEqual(V951_FOOT.kristall);
  });
});

describe('Übergang mit Brücke, aber ohne bezahltes Design (G2-Geld-2)', () => {
  it('nur kaufen geht: Farbe/Licht sind gesperrt, footPaid entsteht nie ohne Bezahlung; das Fenster zeigt nur die Kaufknöpfe', () => {
    game("for (let x = 6; x <= 12; x++) state.tiles.set(x + ',8', { b: 'schiene', lvl: 1, form: 0 }); state.tiles.set('9,8', { b: 'schiene', lvl: 1, form: 0, cross: true, foot: true, style: 'sand' }); recalc()");
    expect(game("brSet({ at: 'uebergang', x: 9, y: 8 }, { col: 3 })")).toBe(false);
    expect(game("brSet({ at: 'uebergang', x: 9, y: 8 }, { licht: 'kaufen' })")).toBe(false);
    expect(game("state.tiles.get('9,8').footPaid")).toBeUndefined();
    game('openInfo(9, 8)');
    expect(game("document.querySelectorAll('#panel [data-foot]').length")).toBe(4);
    expect(game("document.querySelectorAll('#panel [data-brc]').length")).toBe(0);
    game('closePanel()');
  });
});

describe('Anhöhen-Brücke ohne brp (v1016 verwirft es): eingefrorener Rückfall je Material (G2-B1-1)', () => {
  it('Stein und Kristall erstatten ihren Grundpreis (nicht Holz), nie mehr als der heutige Preis', () => {
    for (const art of ['holz', 'stahl', 'stein', 'kristall']) {
      const p = game(`brPaid({ ax: 0, n: 4, art: '${art}' }, 'anhoehe')`), heute = game(`brAdd({ money: 0 }, BR_COST.anhoehe.${art}, 4)`);
      expect(leq(p, heute), art).toBe(true);
      if (art === 'stein' || art === 'kristall') expect(p, art).toEqual(game(`brAdd({ money: 0 }, BK_ANH_RUECK.${art}, 4)`));
    }
    expect(game("brPaid({ ax: 0, n: 2, art: 'kristall' }, 'anhoehe').kristall")).toBe(8);
  });
});

describe('rohe Werte (G2-B1-3)', () => {
  it("footPaid 'constructor'/'__proto__'/'toString': Holz, Erstattung eine Zahl", () => {
    for (const fp of ['constructor', '__proto__', 'toString']) {
      expect(game(`brPaid({ b: 'schiene', cross: true, foot: true, footPaid: '${fp}' }, 'uebergang')`), fp).toEqual(V951_FOOT.holz);
      expect(game(`brLegacyLook({ footPaid: '${fp}' }, 'uebergang').kind`), fp).toBe('holz');
      expect(game(`brLegacyLook({ brk: '${fp}', bridge: true, b: 'weg' }, 'wasser').mat`), fp).toBe('holz');
    }
  });
});

describe('Plan übers Wasser zwischen zwei Gleisbrücken: Vorschau = Abbuchung (G2-Geld-4)', () => {
  const fluss = () => game(`(() => { for (let y = 3; y <= 7; y++) for (let x = 2; x <= 12; x++) state.terra.set(x + ',' + y, 'water');
    for (const x of [0, 1, 13, 14]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0 });
    for (const x of [2, 3, 6, 7, 8, 9, 10, 11, 12]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, bridge: true });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
  for (const mat of ['stein', 'kristall']) for (const [a, b] of [[6, 3], [3, 6]]) {
    it(`Y aus ${mat} (7 Felder), X Holz (2), Lücke 4–5, gezogen von ${a} nach ${b}`, () => {
      fluss();
      expect(game(`brSet({ at: 'gleis', x: 9, y: 5 }, { mat: '${mat}' })`)).toBe(true);
      const r = game(`(() => { setTool('schiene'); startPlan('line', { x: ${a}, y: 5 }, { x: ${b}, y: 5 }, false); const info = planInfo(plan); const w0 = { money: state.money, ...state.res }; runPlan(); setTool('look');
        const spent = { money: w0.money - state.money }; for (const k of Object.keys(RES)) if (w0[k] !== state.res[k]) spent[k] = w0[k] - state.res[k]; return [info.cost, info.mat, spent]; })()`);
      const [cost, mat2, spent] = r;
      expect(spent.money).toBe(cost);
      for (const [k, v] of Object.entries(mat2)) expect(spent[k], k).toBe(v);
      expect(game("[brLook(state.tiles.get('4,5'), 'gleis').mat, brLook(state.tiles.get('5,5'), 'gleis').mat]")).toEqual([mat, mat]);   // die längere gewinnt
    });
  }
});

describe('Stempel: jede Kopie kostet, was sie bezahlt hat (Gegenprüfung N1/N2, 16.10.2026)', () => {
  const uebergang = extra => game(`(() => { for (let x = 6; x <= 12; x++) state.tiles.set(x + ',8', { b: 'schiene', lvl: 1, form: 0 }); for (let y = 6; y <= 10; y++) if (y !== 8) state.tiles.set('9,' + y, { b: 'weg', lvl: 1, style: 'sand' });
    state.tiles.set('9,8', { b: 'schiene', lvl: 1, form: 0, cross: true, style: 'fisch', ...${JSON.stringify(extra)} }); recalc(); })()`);
  for (const fp of ['kristall', 'weg']) it(`alter Übergang (footPaid ${fp}) dreimal gestempelt: brp jeder Kopie = Abbuchung`, () => {
    uebergang({ foot: true, footPaid: fp });
    const r = game(`(() => { setTool('verschieben'); startCopy(9, 7, 9, 8); if (!moving || !moving.copy) return 'keine Kopie'; const out = [];   /* mit dem Wegfeld: eine einzelne Linie wäre die Pipette */
      for (const [x, y] of [[20, 20], [20, 24], [20, 28]]) {
        for (let xx = x - 3; xx <= x + 3; xx++) if (xx !== x) state.tiles.set(xx + ',' + y, { b: 'schiene', lvl: 1, form: 0 }); recalc();
        const w0 = { money: state.money, ...state.res }; const ok = dropGroup(x, y); const t = state.tiles.get(x + ',' + y);
        const spent = {}; for (const k of Object.keys(w0)) { const d = w0[k] - (k === 'money' ? state.money : state.res[k]); if (d) spent[k] = d; }
        out.push([ok, spent, brNoK(t.brp)]);
      }
      moving = null; setTool('look'); return out; })()`);
    for (const [ok, spent, brp] of r) {
      expect(ok).toBe(true);
      const schiene = game('brAdd({ money: ITEMS.schiene.cost, ...ITEMS.schiene.mat }, { money: ITEMS.weg.cost, ...(ITEMS.weg.mat || {}) }, 2)');
      const bruecke = { ...spent }; for (const [k, v] of Object.entries(schiene)) { bruecke[k] = (bruecke[k] || 0) - v; if (!bruecke[k]) delete bruecke[k]; }
      expect(brp).toEqual(bruecke);                                       // bezahlt = was die Brücke als bezahlt führt (Abriss erstattet genau das)
    }
    expect(r[1][2]).toEqual(r[0][2]); expect(r[2][2]).toEqual(r[0][2]);   // jeder Stempel gleich
  });
  it('alter Kristall-Übergang umgefärbt, dann kopiert: Neupreis, Licht nicht mehr gratis (brl nein)', () => {
    uebergang({ foot: true, footPaid: 'kristall' });
    expect(game("brSet({ at: 'uebergang', x: 9, y: 8 }, { col: 2 })")).toBe(true);
    const c = game("copyClone({ kind: 'tile', t: state.tiles.get('9,8') }).t");
    expect(c.brl).toBe('nein');
    expect(game(`brLook(${JSON.stringify(c)}, 'uebergang').lichtGratis`)).toBeFalsy();
    expect(game(`brNoK(${JSON.stringify(c.brp)})`)).toEqual(game('({ ...BR_COST.uebergang.kristall })'));
  });
});

describe('Plan durch eine kürzere Gleisbrücke: Vorschau = Abbuchung (Gegenprüfung N3)', () => {
  for (const mat of ['stein', 'kristall']) for (const [a, b] of [[7, 11], [11, 7]]) it(`A ${mat} (5) · Lücke · R Holz (2) · Lücke · Ufer, gezogen von ${a} nach ${b}`, () => {
    game(`(() => { for (let y = 3; y <= 7; y++) for (let x = 2; x <= 10; x++) state.terra.set(x + ',' + y, 'water');
      for (const x of [0, 1, 11, 12]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0 });
      for (const x of [2, 3, 4, 5, 6, 8, 9]) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, bridge: true });
      terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); })()`);
    expect(game(`brSet({ at: 'gleis', x: 4, y: 5 }, { mat: '${mat}' })`)).toBe(true);
    const [cost, mat2, spent] = game(`(() => { setTool('schiene'); startPlan('line', { x: ${a}, y: 5 }, { x: ${b}, y: 5 }, false); const info = planInfo(plan); const w0 = { money: state.money, ...state.res }; runPlan(); setTool('look');
      const spent = { money: w0.money - state.money }; for (const k of Object.keys(RES)) if (w0[k] !== state.res[k]) spent[k] = w0[k] - state.res[k]; return [info.cost, info.mat, spent]; })()`);
    expect(spent.money).toBe(cost);
    for (const [k, v] of Object.entries(mat2)) expect(spent[k], k).toBe(v);
    expect(game("[7, 8, 10].map(x => brLook(state.tiles.get(x + ',5'), 'gleis').mat)")).toEqual([mat, mat, mat]);
  });
});
