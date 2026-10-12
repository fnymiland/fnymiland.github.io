const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// 160c A4: Geld der Brückenfamilie – alles über brPrice (Neupreis) und brPaid (bezahlt). Bilanz null an jedem Ort: Bauen → Abreißen,
// Kopieren → Abreißen, Verlängern, Aufschütten; alte Brücken kosten und erstatten wie bisher; Rückfall für ältere Fassungen ≤ Neupreis
const V = JSON.parse(fs.readFileSync(path.join(__dirname, 'vorlagen', 'alte-bruecken.json'), 'utf8'));
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; state.techs.add("bahn"); state.techs.add("terraform"); for (const r of Object.keys(RES)) state.res[r] = 5000');
  global.__V = V;
  game('for (let y = -2; y <= 60; y++) for (let x = -2; x <= 66; x++) { const k = x + "," + y; state.claimed.add(k); state.terra.set(k, "grass"); state.tiles.delete(k); state.decos.delete(k); } for (const [k, t] of __V.tiles) { state.tiles.set(k, JSON.parse(JSON.stringify(t))); if (t.bridge) state.terra.set(k, "water"); } state.bruecken = new Map(__V.bruecken.map(([k, b]) => [k, JSON.parse(JSON.stringify(b))])); for (const [k] of __V.bruecken) {} waterChanged(); groundVersion++; rebuildCover(); recalc(); resetUndo()');
});
const wallet = () => game('({ money: state.money, ...state.res })');
const diff = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, b[k] - a[k]]).filter(([, v]) => v));

describe('Geld der Brücken (160c A4)', () => {
  it('Kopie einer jeden alten Brücke: der Abriss der Kopie gibt genau zurück, was sie gekostet hat (Taler und Rohstoffe)', () => {
    const r = game(`(() => { const bad = [];
      for (const [k, t0] of [...state.tiles]) {
        if (!(t0.bridge || (t0.cross && t0.foot))) continue;
        const t = copyClone({ kind: 'tile', t: t0 }).t, cost = copyTileCost(t0), [x, y] = keyXY(k);
        state.tiles.set(k, t); const d = demolishInfo(x, y); state.tiles.set(k, t0);
        const back = { money: d.refund, ...(d.mat || {}) };
        for (const r of new Set([...Object.keys(cost), ...Object.keys(back)])) if ((cost[r] || 0) !== (back[r] || 0)) bad.push(k + ' ' + r + ' Kopie ' + (cost[r] || 0) + ' Abriss ' + (back[r] || 0));
      }
      return bad; })()`);
    expect(r).toEqual([]);
  });
  it('alte Brücken erstatten wie bisher: Holz/Stein/Ziegel/Rot übers Wasser, Gleisbrücke, Übergang je Design, Anhöhe', () => {
    const ref = k => game(`(([x, y]) => { const d = demolishInfo(x, y); return { money: d.refund, ...(d.mat || {}) }; })(keyXY('${k}'))`);
    expect(ref('6,26')).toEqual({ money: 30, bretter: 2 });              // Holz (brk holz)
    expect(ref('6,11')).toEqual({ money: 60, quader: 2 });               // Stein
    expect(ref('6,8')).toEqual({ money: 60, quader: 2 });                // Ziegel aus dem Stil
    expect(ref('6,17')).toEqual({ money: 80, bretter: 2, metall: 1 });   // Rot
    expect(ref('10,35')).toEqual({ money: 40, holz: 2, metall: 2 });     // Gleisbrücke
    expect(ref('14,52').money).toBe(game('ITEMS.schiene.cost + ITEMS.weg.cost + FOOT_STYLES.stein.cost.money'));
    expect(ref('17,52').money).toBe(game('ITEMS.schiene.cost + ITEMS.weg.cost + FOOT_STYLES.weg.cost.money'));
    expect(game("bkDemolishInfo(53, 29)")).toMatchObject({ refund: 60, mat: { bretter: 3 } });   // Anhöhe n 1 Holz (anker 53,29)
  });
  it('Verlängern: das neue Feld kostet im Aussehen (und der alten Art) der Brücke und erstattet genau das', () => {
    game("for (let x = 30; x <= 34; x++) for (let y = 56; y <= 58; y++) state.terra.set(x + ',' + y, 'water'); waterChanged(); recalc(); setTool('weg'); chosenStyle.weg = 'sand'; for (let x = 29; x <= 31; x++) build('weg', x, 57, true)");
    expect(game("setBridgeKind(30, 57, 'rot')")).toBe(true);
    const w0 = wallet();
    expect(game("build('weg', 32, 57, true)")).toBe(true);
    const paid = diff(wallet(), w0);
    expect(paid).toEqual({ money: 80, bretter: 2, metall: 1 });          // rote Brücke: alter Preis
    expect(game("bridgeKind(state.tiles.get('32,57'))")).toBe('rot');
    const d = game("demolishInfo(32, 57)");
    expect({ money: d.refund, ...d.mat }).toEqual(paid);
  });
  it('Aufschütten unter einer Brücke: der Brückenanteil kommt zurück, die Felder sind danach ganz normal', () => {
    const w0 = wallet(), fill = game("costOf('schuett', 10, 35)");
    expect(game("build('schuett', 10, 35, true)")).toBe(true);
    const got = diff(w0, wallet());
    expect(got.money).toBe(-fill.cost + 40 - game('ITEMS.schiene.cost'));
    expect(got.holz).toBe(2 - 1); expect(got.metall).toBe(2 - 1);
    const t = game("state.tiles.get('10,35')");
    expect([t.b, t.bridge, t.brp, t.brk]).toEqual(['schiene', undefined, undefined, undefined]);
  });
  it('Plan-Vorschau = gebauter Preis (Weg und Schiene übers Wasser)', () => {
    game("for (let x = 40; x <= 44; x++) for (let y = 56; y <= 58; y++) state.terra.set(x + ',' + y, 'water'); waterChanged(); recalc()");
    for (const [tool, y] of [['weg', 56], ['schiene', 58]]) {
      const i = game(`(() => { setTool('${tool}'); startPlan('line', { x: 39, y: ${y} }, { x: 45, y: ${y} }, false); return planInfo(plan); })()`);
      const m0 = game('state.money');
      expect(game('runPlan()')).toBe(true);
      expect(m0 - game('state.money'), tool).toBe(i.cost);
    }
  });
  it('Rückfall für ältere Fassungen: was sie erstatten, ist je Rohstoff nie mehr als der Neupreis', () => {
    const bad = game(`(() => { const out = [];
      for (const at of ['wasser', 'gleis', 'uebergang']) for (const mat of BR_MAT_IDS) {
        const fb = brFallback(at, mat), price = brPrice({ mat }, at);
        const old = at === 'wasser' ? brMoney(WEG_BRIDGE[fb.brk].cost, WEG_BRIDGE[fb.brk].mat) : at === 'gleis' ? brMoney(BRIDGE.cost, BRIDGE.mat) : { ...FOOT_STYLES[fb.footPaid].cost };
        for (const [r, v] of Object.entries(old)) if (v > (price[r] || 0)) out.push(at + ' ' + mat + ' ' + r + ' ' + v + ' > ' + (price[r] || 0));
      }
      return out; })()`);
    expect(bad).toEqual([]);
  });
});

describe('Gegengelesen (160c A4)', () => {
  it('Verlängern einer Spanne mit zwei Arten (alter Stand/Kopie): Preis und Art vom selben Nachbarn – Bilanz 0', () => {
    game("for (let x = 30; x <= 34; x++) for (let y = 56; y <= 58; y++) state.terra.set(x + ',' + y, 'water'); waterChanged(); recalc(); setTool('weg'); chosenStyle.weg = 'sand'");
    game("for (let x = 29; x <= 32; x++) build('weg', x, 57, true); state.tiles.get('30,57').brk = 'rot'; groundVersion++; recalc()");   // Anker rot, Ende Holz
    const w0 = wallet();
    expect(game("build('weg', 33, 57, true)")).toBe(true);
    const paid = diff(wallet(), w0), d = game('demolishInfo(33, 57)');
    expect({ money: d.refund, ...d.mat }).toEqual(paid);
  });
  it('Kopie eines Übergangs, der auf Schranken steht, trägt keinen Brückenpreis (auch nicht aus einer früheren Kopie)', () => {
    const t1 = game("copyClone({ kind: 'tile', t: state.tiles.get('11,52') }).t");   // Holz-Fußgängerbrücke → Kopie mit brp
    expect(t1.brp).toBeTruthy();
    const t2 = game(`copyClone({ kind: 'tile', t: ${JSON.stringify({ ...t1, foot: false })} }).t`);
    expect([t2.brp, t2.footPaid, t2.brm]).toEqual([undefined, undefined, undefined]);
  });
  it('Kopie des alten Kristall-Übergangs: Preis der Kopie (wie startCopy auf dem Klon) = was sie als bezahlt merkt', () => {
    const r = game("(() => { const c = copyClone({ kind: 'tile', t: state.tiles.get('20,52') }).t, cost = copyTileCost(c); return [cost.money - ITEMS.schiene.cost - ITEMS.weg.cost, c.brp.money, brLook(c, 'uebergang').licht]; })()");
    expect(r[0]).toBe(r[1]); expect(r[2]).toBe('an');
  });
  it('Plan-Vorschau = Abbuchung beim Verlängern eines roten Stegs über mehrere Felder', () => {
    game("for (let x = 40; x <= 46; x++) for (let y = 55; y <= 57; y++) state.terra.set(x + ',' + y, 'water'); waterChanged(); recalc(); setTool('weg'); chosenStyle.weg = 'sand'; build('weg', 39, 56, true); build('weg', 40, 56, true); build('weg', 41, 56, true); setBridgeKind(40, 56, 'rot')");
    const i = game("(() => { setTool('weg'); chosenStyle.weg = 'sand'; startPlan('line', { x: 41, y: 56 }, { x: 44, y: 56 }, false); return planInfo(plan); })()");
    const w0 = wallet();
    expect(game('runPlan()')).toBe(true);
    const spent = diff(wallet(), w0);                                       // ausgegeben (w0 − nachher)
    expect(spent.money).toBe(i.cost);
    expect(Object.fromEntries(Object.entries(spent).filter(([k]) => k !== 'money'))).toEqual(i.mat);
  });
  it('brPaidOk: nur eigene Rohstoffe (keine geerbten Namen wie constructor)', () => {
    expect(game('brPaidOk({ money: 0, constructor: 1 })')).toBe(false);
    expect(game('brPaidOk({ money: 0, toString: 1 })')).toBe(false);
  });
});
