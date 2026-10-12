const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// 160c A3: Speicherformat der Brückenfamilie und Altversions-Wächter. Ältere App-Versionen (online v951, eigene WLAN-Geräte, Freunde) lesen
// unsere Stände: sie kennen nur ihre Kachelfelder (tileOut von v951, unten eingefroren) und verwerfen den Rest beim Speichern. Neues darf
// also nur in NEUEN Feldern stehen; alte Felder behalten ihren Wortschatz; Laden schreibt alte Brücken nie um (Cloud-Fingerabdruck, Live).
const V = JSON.parse(fs.readFileSync(path.join(__dirname, 'vorlagen', 'alte-bruecken.json'), 'utf8'));
// tileOut-Felder von origin/main v951 (git show origin/main:js/state.js) – NICHT anpassen, das ist die alte Fassung
const V951_TILE_FIELDS = ['animal', 'brc', 'bridge', 'brk', 'brw', 'col', 'cross', 'cs', 'end', 'extra', 'fl', 'foot', 'footPaid', 'form', 'gleis', 'gleise', 'gleisePaid',
  'hgt', 'isle', 'len', 'lenPaid', 'lm', 'look', 'loop', 'loopPrice', 'mid', 'mini', 'more', 'name', 'paid', 'pbz', 'phase', 'price', 'rate', 'roof', 'rot', 'ships', 'sq',
  'stage', 'style', 'train', 'trainCol', 'trainPlus', 'vp', 'wall', 'weg', 'wegs', 'wide', 'win', 'wing', 'zug', 'b', 'lvl'];
// Preise, die v951 beim Abriss erstattet – eingefroren: wer sie ändert, lässt ältere Geräte falsch erstatten
const V951 = {
  WEG_BRIDGE: { holz: { cost: 30, mat: { bretter: 2 } }, stein: { cost: 60, mat: { quader: 2 } }, ziegel: { cost: 60, mat: { quader: 2 } }, rot: { cost: 80, mat: { bretter: 2, metall: 1 } } },
  BRIDGE: { cost: 40, mat: { holz: 2, metall: 2 } },
  FOOT_STYLES: { holz: { money: 60, bretter: 4, metall: 2 }, stein: { money: 150, quader: 8 }, weg: { money: 120, bretter: 4, quader: 4 }, kristall: { money: 300, kristall: 5, metall: 2 } },
};
const BRK_ALT = [undefined, 'holz', 'stein', 'ziegel', 'rot'], FOOT_ALT = [undefined, true, 'holz', 'stein', 'weg', 'kristall'];
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  global.__V = V;
  game('for (const [k, t] of __V.tiles) { state.tiles.set(k, JSON.parse(JSON.stringify(t))); if (t.bridge) state.terra.set(k, "water"); } state.bruecken = new Map(__V.bruecken.map(([k, b]) => [k, JSON.parse(JSON.stringify(b))])); groundVersion++; rebuildCover(); recalc()');
});
const NEW_TILE = "{ b: 'weg', lvl: 1, style: 'sand', bridge: true, brk: 'stein', brm: 'kristall', brc: 4, brw: 5, brb: 'muster', brl: 'an', brz: 'an', bru: 'jede', brp: { money: 400, quader: 2, kristall: 3, metall: 1, k: 'w:stein' } }";

describe('Speicherformat (160c A3)', () => {
  it('Kachel: alle br-Felder und brp kommen durch Speichern/Laden und den Live-Spiegel (roh)', () => {
    game(`state.tiles.set('6,2', ${NEW_TILE})`);
    const want = game(`(t => ({ brm: t.brm, brc: t.brc, brw: t.brw, brb: t.brb, brl: t.brl, brz: t.brz, bru: t.bru, brp: t.brp }))(${NEW_TILE})`);
    const out = game("tileOut(state.tiles.get('6,2'))");
    expect(out).toMatchObject(want);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(game("state.tiles.get('6,2')")).toMatchObject(want);
    const live = game("(() => { const S = liveSplit(serialize()); return [JSON.parse(S.maps.tiles['6,2']), parseSave(liveJoin({ ...S.maps, rest: S.rest }, { eco: S.eco, priv: S.priv })).tiles.get('6,2')]; })()");
    expect(live[0]).toMatchObject(want); expect(live[1]).toMatchObject(want);
    expect(game("brLook(state.tiles.get('6,2'), 'wasser')")).toMatchObject({ mat: 'kristall', licht: 'an', zacken: true, col: 4 });
  });
  it('Anhöhen-Brücke: bis 8 Felder, Material in art (holz/stahl/stein/kristall), br-Felder streng; Müll fällt weg', () => {
    const d = game(`(() => { const d = JSON.parse(JSON.stringify(serialize())); d.bruecken = [
      ['1,1', { ax: 0, n: 7, art: 'kristall', brl: 'an', brz: 'an', brc: 2, brp: { money: 900, kristall: 4 } }],
      ['2,2', { ax: 1, n: 8, art: 'gold', brl: 'hell', brc: 99, brp: { money: -5 }, bru: 'jede' }],
      ['3,3', { ax: 0, n: 9, art: 'holz' }]]; const m = parseSave(d).bruecken; return [m.size, m.get('1,1'), m.get('2,2')]; })()`);
    expect(d[0]).toBe(2);                                                      // 9 Felder: mehr als die Lesegrenze
    expect(d[1]).toEqual({ ax: 0, n: 7, art: 'kristall', brc: 2, brl: 'an', brz: 'an', brp: { money: 900, kristall: 4 } });
    expect(d[2]).toEqual({ ax: 1, n: 8, art: 'holz', bru: 'jede' });
    game("state.bruecken.set('40,40', { ax: 0, n: 6, art: 'stein', brl: 'aus', brp: { money: 1, quader: 1 } })");
    expect(game("parseSave(JSON.parse(JSON.stringify(serialize()))).bruecken.get('40,40')")).toEqual({ ax: 0, n: 6, art: 'stein', brl: 'aus', brp: { money: 1, quader: 1 } });
  });
  it('Laden schreibt alte Brücken nicht um: Kacheln und Anhöhen-Brücken gleich (Cloud-Fingerabdruck, genaues JSON)', () => {
    const a = game('JSON.stringify([serialize().tiles, serialize().bruecken])');
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); rebuildCover(); recalc()');
    expect(game('JSON.stringify([serialize().tiles, serialize().bruecken])')).toBe(a);
  });
});
describe('Altversions-Wächter (160c A3)', () => {
  it('Preise, die v951 erstattet, sind unverändert (eingefroren)', () => {
    expect(game('JSON.parse(JSON.stringify(WEG_BRIDGE))')).toEqual(Object.fromEntries(Object.entries(V951.WEG_BRIDGE).map(([k, v]) => [k, expect.objectContaining(v)])));
    expect(game('BRIDGE')).toEqual(V951.BRIDGE);
    expect(game('Object.fromEntries(Object.entries(FOOT_STYLES).map(([k, v]) => [k, v.cost]))')).toEqual(V951.FOOT_STYLES);
  });
  it('eine ältere Fassung, die nur ihre Felder kennt, liest jede Brücke weiter: alte Felder im alten Wortschatz, brLook gültig', () => {
    global.__F = V951_TILE_FIELDS;
    const r = game(`(() => { const S = serialize(), bad = [];
      for (const [k, t] of S.tiles) {
        if (!t.bridge && !t.cross) continue;
        if (t.brk != null && !${JSON.stringify(BRK_ALT.filter(Boolean))}.includes(t.brk)) bad.push(k + ' brk ' + t.brk);
        if (t.cross && t.footPaid != null && !${JSON.stringify(FOOT_ALT.filter(v => v != null))}.includes(t.footPaid)) bad.push(k + ' footPaid ' + t.footPaid);
        const old = Object.fromEntries(Object.entries(t).filter(([f]) => __F.includes(f)));
        for (const at of ['wasser', 'gleis', 'uebergang']) { const L = brLook(old, at); if (!BR_MAT[L.mat]) bad.push(k + ' ' + at + ' ' + L.mat); }
      }
      return bad; })()`);
    expect(r).toEqual([]);
    const strip = game(`(() => { const t = ${NEW_TILE}; return Object.fromEntries(Object.entries(t).filter(([f]) => __F.includes(f))); })()`);
    expect(Object.keys(strip).some(f => /^br[a-z]$/.test(f) && !['brk', 'brc', 'brw'].includes(f))).toBe(false);   // neue Felder kennt v951 nicht – verworfen
    expect(game(`brLook(${JSON.stringify(strip)}, 'wasser').mat`)).toBe('stein');   // der Rückfall (brk) bleibt lesbar
  });
});
