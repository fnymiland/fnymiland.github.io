const { loadGame, game } = require('./helpers/load-game');

// 160c G1e: Texte rund um Brücken – Strom-Übersicht (dunkle Gleis- und Fußgängerbrücken sind Brücken, keine Laternen), Fenster der Brücke
// zwischen Anhöhen (was darunter geht, je nach Stützen/Pfeilern), Minikarte (Brücken zwischen Anhöhen), ein Schildformat „🌉 Brücke: …“
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; setTool('look')");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.add('bahn'); for (const r of Object.keys(RES)) state.res[r] = 9999; state.restore.klippe = 3; state.restore.kristall = 3");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); state.bruecken.clear(); recalc()");
  game("for (let y = 10; y <= 14; y++) for (const x of [10, 11, 12, 13, 17, 18, 19, 20]) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");   // Lücke x 14–16
});
const bruecke = (art, extra = {}, n = 3) => { if (n !== 3) game(`for (let y = 10; y <= 14; y++) for (let x = 17; x <= 21; x++) { if (x >= 14 + ${n}) state.hills.set(x + ',' + y, { w: 0 }); else state.hills.delete(x + ',' + y); } groundVersion++; recalc()`);
  game(`state.bruecken.set('14,12', { ax: 0, n: ${n}, art: '${art}', ...${JSON.stringify(extra)} }); groundVersion++; recalc()`); };

describe('Brücken-Texte (160c G1e)', () => {
  it('Strom: dunkle Gleis- (G + Feld) und Fußgängerbrücken (U) zählen als Brücken; Torlaternen (G0…) bleiben Laternen', () => {
    const txt = game("(() => { T.rail.power.dark = new Set(['G2,5', 'U8,8', 'G0a3,4', 'W1,1', 'B4,4', '3,4,0', 'G-2,7']); return powerStatus().join(' '); })()");
    expect(txt).toMatch(/🌉 5 Brücken bleiben nachts dunkel/);
    expect(txt).toMatch(/🌙 2 Laternen bleiben nachts dunkel/);
    expect(txt).toMatch(/Brückenlicht je Brückenart je angefangene 10 Felder 1 ⚡ \(Fußgängerbrücke = 2 Felder\)/);   // computePower zählt je Art (Gegenlesen G1)
  });
  it('Fenster der Brücke: was darunter geht – Holz mit Stützen nur quer, Stein mit Pfeilern, Metall/Kristall frei', () => {
    const text = () => game("(() => { openBkInfo(15, 12); const t = document.getElementById('panel').textContent; closePanel(); return t; })()");
    bruecke('holz');
    expect(text()).toMatch(/Darunter bleibt Platz für Wege, Schienen, Wasser und Niedriges \(an den Stützen nur quer darunter durch\)\./);
    bruecke('stahl');
    expect(text()).toMatch(/Darunter bleibt Platz für Wege, Schienen, Wasser und Niedriges\./);
    bruecke('holz', { bru: 'keine' });
    expect(text()).toMatch(/Wasser und Niedriges\./);
    bruecke('stein', {}, 4);                                                 // Stein: Pfeiler ab 4 Feldern
    expect(text()).toMatch(/an den Pfeilern nichts, Wege und Schienen dort nur quer/);
    expect(game('ITEMS.bruecke.desc')).toMatch(/Niedriges \(an Stützen und Pfeilern nur quer/);
    expect(game('ITEM_TIPS.bruecke')).toMatch(/quer durchführen/);
    expect(game('ITEM_TIPS.bruecke + ITEMS.weg.desc')).toMatch(/Holz.*Wegstil[\s\S]*Holz.*Wegstil/);   // Wegbrücke mit Holz in der Leiste: Material nach dem Wegstil (wbLeisteLook)
    expect(game('ITEMS.bruecke.desc + ITEM_TIPS.bruecke')).not.toMatch(/Flaches/);
  });
  it('Minikarte: eine Brücke zwischen Anhöhen über Wasser ist kein Meer und hat eigene Farbe', () => {
    game("for (let x = 14; x <= 16; x++) state.terra.set(x + ',12', 'water'); terrainCache.clear(); recalc()");
    expect(game('miniSea(15, 12)')).toBe(true);
    bruecke('holz', { weg: ['sand', 'sand', 'sand'] });
    expect(game('miniSea(15, 12)')).toBe(false);
    expect(game('miniColor(15, 12)')).not.toBe(game('MINI_SEA'));
  });
  it('Schild beim Ziehen: Brücke zwischen Anhöhen im selben Format wie übers Wasser', () => {
    const t = game("(() => { setTool('weg'); startPlan('line', { x: 11, y: 12 }, { x: 19, y: 12 }, false); const t = planText(plan, planInfo(plan)); plan = null; setTool('look'); return t; })()");
    expect(t).toMatch(/🌉 Brücke: Holz · 3 Felder/);
  });
});
