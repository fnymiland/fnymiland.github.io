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
