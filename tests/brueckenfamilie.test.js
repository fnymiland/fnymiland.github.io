const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// 160c A2: brLook liest jedes alte Brückenfeld als neues Aussehen (Familie, Material, Farbe, Deck, Licht …) – nie werfen (Live-Spiegel roh),
// neues Format nur mit gültigem brp; ein Aussehen je Brücke (Anker der Spanne). Vorlage: tests/vorlagen/alte-bruecken.json (tools/brueckenwelt.js)
const V = JSON.parse(fs.readFileSync(path.join(__dirname, 'vorlagen', 'alte-bruecken.json'), 'utf8'));
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  global.__V = V;
  game('for (const [k, t] of __V.tiles) { state.tiles.set(k, JSON.parse(JSON.stringify(t))); const [x, y] = keyXY(k); if (t.bridge) state.terra.set(k, "water"); } state.bruecken = new Map(__V.bruecken.map(([k, b]) => [k, JSON.parse(JSON.stringify(b))])); groundVersion++; rebuildCover(); recalc()');
});
const look = (k, at) => game(`brLook(state.tiles.get('${k}'), '${at}')`);
const pick = (L, ...keys) => Object.fromEntries(keys.map(k => [k, L[k]]));

describe('Alte Wegbrücken übers Wasser (Zuordnungstabelle)', () => {
  it('Holz, Stein, Ziegel (→ Stein in Ziegelfarbe), Rot (→ Holz in Rot) – gespeicherte Farben gehen vor', () => {
    expect(pick(look('6,2', 'wasser'), 'fam', 'mat', 'deck', 'col', 'plank')).toEqual({ fam: 'fuss', mat: 'holz', deck: 'muster', col: null, plank: null });
    expect(pick(look('6,8', 'wasser'), 'mat', 'deck', 'belag', 'col')).toEqual({ mat: 'stein', deck: 'belag', belag: 'kopf', col: 8 });          // Ziegel aus dem Stil
    expect(pick(look('6,11', 'wasser'), 'mat', 'deck', 'belag', 'col')).toEqual({ mat: 'stein', deck: 'belag', belag: 'platten', col: null });
    expect(pick(look('6,14', 'wasser'), 'mat', 'belag')).toEqual({ mat: 'stein', belag: 'm:verband:beige' });
    expect(pick(look('6,17', 'wasser'), 'mat', 'deck', 'col', 'plank')).toEqual({ mat: 'holz', deck: 'muster', col: 3, plank: 2 });            // rot, brw 2
    expect(pick(look('6,20', 'wasser'), 'mat', 'col')).toEqual({ mat: 'stein', col: 4 });                                                   // ziegel mit brc 4
    expect(pick(look('6,23', 'wasser'), 'mat', 'col')).toEqual({ mat: 'stein', col: 2 });
    expect(pick(look('6,26', 'wasser'), 'mat', 'col', 'plank')).toEqual({ mat: 'holz', col: 1, plank: 3 });
    expect(game("brLegacyLook({ b: 'weg', bridge: true, brk: 'rot' }, 'wasser')")).toMatchObject({ col: 3, plank: 5 });                      // rot ohne Farben
  });
  it('jeder Wegstil ergibt das Material, das die alte Art daraus ableitete', () => {
    const r = game(`STYLES.weg.map(s => [s.id, bridgeKind({ style: s.id }), brLegacyLook({ b: 'weg', bridge: true, style: s.id }, 'wasser').mat])`);
    for (const [id, kind, mat] of r) expect(mat, id).toBe(kind === 'holz' || kind === 'rot' ? 'holz' : 'stein');
  });
});
describe('Gleis, Übergang, Anhöhe', () => {
  it('Gleisbrücke übers Wasser: Bahn aus Holz', () => {
    expect(pick(look('10,35', 'gleis'), 'fam', 'mat')).toEqual({ fam: 'bahn', mat: 'holz' });
  });
  it('Übergang: footPaid true/holz → Holz, stein → Stein (eigenes Deck), weg → Holz mit Belag, kristall → Kristall mit Licht, foot ohne footPaid → Holz', () => {
    expect(pick(look('8,52', 'uebergang'), 'mat', 'deck')).toEqual({ mat: 'holz', deck: 'muster' });
    expect(look('11,52', 'uebergang').mat).toBe('holz');
    expect(pick(look('14,52', 'uebergang'), 'mat', 'deck')).toEqual({ mat: 'stein', deck: 'muster' });
    expect(pick(look('17,52', 'uebergang'), 'mat', 'deck', 'belag')).toEqual({ mat: 'holz', deck: 'belag', belag: 'fisch' });
    expect(pick(look('20,52', 'uebergang'), 'mat', 'licht')).toEqual({ mat: 'kristall', licht: 'an' });
    expect(look('26,52', 'uebergang').mat).toBe('holz');
  });
  it('Anhöhe: mit Gleis Bahn, mit Weg Fußgänger mit Belag, leer Fußgänger mit Muster; Holz/Stahl bleibt', () => {
    const r = game("[...state.bruecken.entries()].map(([k, b]) => [k, b.art, !!b.weg, !!b.gleis, brLook(b, 'anhoehe')])");
    expect(r.length).toBe(13);
    for (const [k, art, weg, gleis, L] of r) {
      expect(L.mat, k).toBe(art);
      expect(L.fam, k).toBe(gleis ? 'bahn' : 'fuss');
      expect(L.deck, k).toBe(weg ? 'belag' : 'muster');
      if (weg) expect(L.belag, k).toBeTruthy();
    }
  });
});
describe('Neues Format, Müll, Anker', () => {
  it('neues Format nur mit gültigem brp; Zacken nur Kristall-Fußgänger, Stützen nur Holz-Fußgänger', () => {
    const p = at => `{ money: 500, kristall: 3, k: '${at}' }`;
    expect(game(`brLook({ b: 'weg', bridge: true, style: 'sand', brm: 'kristall', brz: 'an', brl: 'an', brp: ${p('w:holz')} }, 'wasser')`)).toMatchObject({ mat: 'kristall', zacken: true, licht: 'an', deck: 'muster' });
    expect(game(`brLook({ b: 'schiene', bridge: true, brm: 'kristall', brz: 'an', brp: ${p('g:1')} }, 'gleis')`)).toMatchObject({ fam: 'bahn', mat: 'kristall', zacken: false });
    expect(game(`brLook({ b: 'weg', bridge: true, style: 'sand', brm: 'kristall', brz: 'an', brp: { money: -1 } }, 'wasser')`)).toMatchObject({ mat: 'holz', zacken: false });   // ungültig: alter Stand
    expect(game(`brLook({ b: 'weg', bridge: true, brm: 'holz', bru: 'jede', brp: { money: 30, bretter: 2, k: 'w:holz' } }, 'wasser').stuetzen`)).toBe('jede');
    expect(game(`brLook({ b: 'weg', bridge: true, brm: 'stein', bru: 'jede', brp: { money: 60, quader: 2, k: 'w:holz' } }, 'wasser').stuetzen`)).toBe('wenige');
    expect(game(`brLook({ b: 'weg', bridge: true, brm: 'gold', brp: { money: 1, k: 'w:holz' } }, 'wasser').mat`)).toBe('holz');                            // unbekannt: Rückfall
    expect(game(`brPaidOk({ money: 3, gold: 1 })`)).toBe(false);
  });
  it('Müll wirft nie (Live-Spiegel kommt roh an)', () => {
    const junk = ['null', 'undefined', '5', '"x"', '[]', "{ brc: -3, brw: 'a', footPaid: 9, art: {}, weg: 7, gleis: 'x', brp: [] }", "{ style: 42, brk: 'gold', brp: { money: 1, quader: 1.5 } }",
      "{ brm: 'stein', brb: 'x', brl: 3, brz: true, bru: null, brp: { money: 0 } }"];
    for (const j of junk) for (const at of ['wasser', 'gleis', 'uebergang', 'anhoehe', 'irgendwo']) expect(() => game(`brLook(${j}, '${at}')`), j + ' ' + at).not.toThrow();
  });
  it('ein Aussehen je Brücke: der Anker der Spanne; ein Feld im neuen Format geht vor (ältere Fassung hat verlängert)', () => {
    expect(game("brSpanLook(8, 17).col")).toBe(3);                                             // ganze rote Brücke wie ihr Anker
    game("Object.assign(state.tiles.get('9,17'), { brm: 'stahl', brc: 6, brp: { money: 100, quader: 2, metall: 2, k: 'w:' + bridgeKind(state.tiles.get('9,17')) } }); groundVersion++");
    expect([6, 7, 8, 9, 10, 11].map(x => game(`brSpanLook(${x}, 17).mat`))).toEqual(Array(6).fill('stahl'));
    expect(game("brSpanLook(22, 39).fam")).toBe('bahn');                                      // Kurve: ganze Gleisbrücke
    expect(game("brRailSpan(22, 36).length")).toBe(game("[...state.tiles.entries()].filter(([k, t]) => t.b === 'schiene' && t.bridge && (([x, y]) => x >= 19 && x <= 25 && y >= 33 && y <= 40)(keyXY(k))).length"));
    expect(game("brSpanLook(5, 52)")).toBe(null);                                             // Schranken: keine Brücke
  });
});

// 160c C2a: eine Quelle für die Deckhöhe h(t)
describe('Höhenprofil (160c C2a)', () => {
  it('Scheitel je Länge, Bahn flach, Wandenden auf HILL_H, Müll gibt Zahlen', () => {
    const pk = game('[1, 2, 3, 4, 8].map(n => brPeak("fuss", n))');
    [5, 10.2, 13.01, 15.46, 23.43].forEach((v, i) => expect(pk[i]).toBeCloseTo(v, 1));
    expect(game('[1, 4, 8].map(n => brPeak("bahn", n))')).toEqual([0, 0, 0]);
    const H = game('HILL_H');
    for (const n of [1, 2, 3, 4, 8]) {
      expect(game(`brDeckHFn('fuss', ${n})(-0.5)`)).toBeCloseTo(H, 6); expect(game(`brDeckHFn('fuss', ${n})(${n} - 0.5)`)).toBeCloseTo(H, 6);
      expect(game(`brDeckHFn('fuss', ${n})((${n} - 1) / 2)`)).toBeCloseTo(H + game(`brPeak('fuss', ${n})`), 6);
      expect(game(`(() => { for (let i = 0; i < ${n}; i++) { const m = brDeckHMax('fuss', ${n}, i - 0.5, i + 0.5), f = brDeckHFn('fuss', ${n}); for (let t = i - 0.5; t <= i + 0.5; t += 0.01) if (f(t) > m + 1e-9) return false; } return true; })()`)).toBe(true);
    }
    for (const n of ['0', '-1', 'NaN', '99', "'2'"]) for (const t of ['0', 'NaN', 'Infinity', '-Infinity']) expect(Number.isFinite(game(`brDeckHFn('fuss', ${n})(${t})`))).toBe(true);
  });
  it('Familie wie brLook; Gleis ⇒ flach (auch Altdaten mit Weg und Gleis); t am Anker stetig', () => {
    for (const b of ["{ ax: 0, n: 3, art: 'holz' }", "{ ax: 0, n: 3, art: 'holz', weg: ['sand', null, null] }", "{ ax: 1, n: 4, art: 'stahl', gleis: [0, 0, 0, 0] }", "{ ax: 0, n: 2, art: 'holz', weg: ['sand', 'sand'], gleis: [0, null] }"])
      expect(game(`bkFam(${b})`)).toBe(game(`brLook(${b}, 'anhoehe').fam`));
    expect(game("(() => { const b = { ax: 0, n: 4, art: 'holz', weg: ['sand', null, null, null], gleis: [null, 0, null, null] }; for (let t = -0.5; t <= 3.5; t += 0.02) if (bkH(b, t) !== HILL_H) return false; return true; })()")).toBe(true);
    const c = "{ b: { ax: 1, n: 3 }, x0: 5, y0: 8, i: 1 }";
    expect(game(`bkT(${c}, 5, 9)`)).toBe(1); expect(game(`bkT(${c}, 5.3, 9.5)`)).toBe(1.5);
    expect(game("bkT({ b: { ax: 0, n: 3 }, x0: 5, y0: 8 }, 7.2, 8)")).toBeCloseTo(2.2, 9);
  });
});

// 160c C3a: Steinbögen als eine Quelle (brStoneGeom, brClear)
describe('Stein: Bögen (160c C3)', () => {
  it('Bögen und Leibung wie der abgenommene Entwurf (Stufe 3), glatt statt Knick, Wand 22,5, Pfeileransatz 13', () => {
    const g4 = game("(() => { const S = brStoneGeom('fuss', 4, [2]); return { arcs: S.arcs.map(q => [q.a, q.c, q.sa, q.sc, q.rise]), mid: [0, 1, 2, 3].map(S.ri), A: S.ri(-0.5), B: S.ri(3.5), a1: S.ri(1.59), pier: S.ri(1.5) }; })()");
    expect(g4.arcs[0].slice(0, 4)).toEqual([-0.5, 1.41, 23, 13]); expect(g4.arcs[1].slice(0, 4)).toEqual([1.59, 3.5, 13, 23]);
    expect(g4.arcs[0][4]).toBeCloseTo(11.04, 1);
    [28.77, 23.87, 23.87, 28.77].forEach((v, i) => expect(g4.mid[i]).toBeCloseTo(v, 1));
    expect(g4.A).toBeCloseTo(22.5, 1); expect(g4.B).toBeCloseTo(22.5, 1); expect(g4.a1).toBeCloseTo(13, 6); expect(g4.pier).toBe(null);
    const m6 = game("(() => { const S = brStoneGeom('fuss', 6, [2, 4]); return [0, 1, 2, 3, 4, 5].map(S.ri); })()");
    [27.92, 23.01, 33.33, 33.33, 23.01, 27.92].forEach((v, i) => expect(m6[i]).toBeCloseTo(v, 1));
    // treu: höchstens 0,5 unter der harten Entwurfsformel, gleich wo das Minimum nicht greift; nie über hf − 3; glatt
    const bad = game(`(() => { const out = [];
      for (let n = 1; n <= 8; n++) { const S = brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)), H = brStoneGeom('fuss', n, S.piers, { ...BR_STEIN, r: 0 });
        for (let j = 0; j <= 2000; j++) { const t = -0.5 + n * j / 2000, a = S.ri(t), h = H.ri(t); if (a == null) continue;
          if (h - a < -1e-9 || h - a > 0.5 + 1e-9) out.push(['treu', n, t, h, a]); if (a > S.hf(t) - 3 + 1e-9) out.push(['deck', n, t]); }
        for (const q of S.arcs) for (let u = 0.01; u <= 0.99; u += 0.01) { const t = q.a + (q.c - q.a) * u, e = 1e-4, l = (S.ri(t) - S.ri(t - e)) / e, r = (S.ri(t + e) - S.ri(t)) / e; if (Math.abs(l - r) > 0.05 * Math.max(1, Math.abs(l))) out.push(['knick', n, t, l, r]); } }
      return out.slice(0, 5); })()`);
    expect(bad).toEqual([]);
    expect(game(`(() => { const S = brStoneGeom('fuss', 4, [2], { ...BR_STEIN, r: 0 }); let m = 0; for (let t = -0.45; t <= 0.4; t += 5e-5) { const e = 1e-4, l = (S.ri(t) - S.ri(t - e)) / e, r = (S.ri(t + e) - S.ri(t)) / e; m = Math.max(m, Math.abs(l - r)); } return m; })()`)).toBeGreaterThan(5);   // Gegenprobe: hart = Knick an der Wand
  });
  it('Lichtraum: 20 unter dem Bogen (n 1–5), weniger neben dem äußeren Pfeiler bei n 6–8, −1 am Pfeiler; Bahn-Stein nur Pfeiler; Müll gibt Zahlen', () => {
    expect(game('brClear()')).toBe(20); expect(game('brClear(null, 1, 0.1)')).toBe(20);
    expect(game(`(() => { for (let n = 1; n <= 5; n++) { const S = brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)); for (let i = 0; i < n; i++) for (const du of [-0.42, 0, 0.42]) { const c = brClear(S, i + du, 0.14); if (c !== -1 && c < 20 - 1e-9) return [n, i + du, c]; } } return true; })()`)).toBe(true);   // die Plätze (Ecken/Seiten ±0,42, Mitte)
    const near = game("[6, 7, 8].map(n => { const S = brStoneGeom('fuss', n, brSupports({ mat: 'stein' }, n)); return brClear(S, 1, 0.14); })");
    [19.94, 19.63, 19.37].forEach((v, i) => expect(near[i]).toBeCloseTo(v, 1));
    expect(game("brClear(brStoneGeom('fuss', 4, [2]), 1.45, 0.05)")).toBe(-1);
    expect(game("[brClear(brStoneGeom('bahn', 4, [2]), 1.5, 0), brClear(brStoneGeom('bahn', 4, [2]), 0.5, 0.1)]")).toEqual([-1, 20]);
    for (const n of ['0', '-1', 'NaN', '99', "'2'", '2.5']) for (const p of ['null', "'x'", '[0, 1.5, NaN, 99, 2, 2]']) for (const t of ['NaN', 'Infinity', '-9', '0.3'])
      expect(game(`(v => v === null || Number.isFinite(v))(brStoneGeom('fuss', ${n}, ${p}).ri(${t}))`)).toBe(true);
    expect(game("(() => { const S = brStoneGeom('bahn', 4, [2]); for (let t = -0.5; t <= 3.5; t += 0.01) { const v = S.ri(t); if (v != null && (!Number.isFinite(v) || v > HILL_H - 3 + 1e-9)) return false; } return true; })()")).toBe(true);
  });
  it('bkGeom: Stein mit brp zeichnet Stein, ohne brp Holz; mit Gleis Bahn (Maler Holz); Kristall-Fußgänger K1, Kristall-Bahn bis C5 flach', () => {
    game("startNew()");
    const G = b => game(`(() => { const b = ${b}; if (b.brp) b.brp.k = brSig(b, 'anhoehe'); const G = bkGeom(b); return { art: G.art, fam: G.fam, mat: G.mat, piers: G.piers, stone: !!G.stone }; })()`);
    expect(G("{ ax: 0, n: 4, art: 'stein', brp: { money: 480, quader: 12 } }")).toEqual({ art: 'stein', fam: 'fuss', mat: 'stein', piers: [2], stone: true });
    expect(G("{ ax: 0, n: 4, art: 'stein' }")).toMatchObject({ art: 'holz', mat: 'holz', piers: [1, 3], stone: false });
    expect(G("{ ax: 0, n: 4, art: 'stein', gleis: [0, 0, 0, 0], brp: { money: 480, quader: 12 } }")).toEqual({ art: 'holz', fam: 'bahn', mat: 'stein', piers: [2], stone: true });
    expect(G("{ ax: 0, n: 4, art: 'kristall', brp: { money: 3200, kristall: 16, metall: 4 } }")).toMatchObject({ art: 'kristall', mat: 'kristall', fam: 'fuss' });   // C4: K1
    expect(G("{ ax: 0, n: 4, art: 'kristall', gleis: [0, 0, 0, 0], brp: { money: 3200, kristall: 16, metall: 4 } }")).toMatchObject({ art: 'kristall', fam: 'bahn' });   // C5: Kristall B2 (Fachwerk)
    expect(G("{ ax: 0, n: 3, art: 'stahl' }")).toMatchObject({ art: 'stahl', piers: [] });
  });
});
