const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 149: Leistungs-Wächter je Ding. Jedes Gebäude, jede Deko (jede Form) und jeder Wegbelag wird allein nah gezeichnet
// (Zoom 2, live) und gezählt: Zeichenbefehle + Linienstücke/Formpunkte. Wird eines teurer als erlaubt – oder kommt etwas Neues
// ohne geprüften Wert dazu –, schlägt der Test fehl. Gewollt? → `npm run leistung:neu`, Zahl in AUFGABEN.md begründen.
// (Der Test je Bild in leistung.test.js sieht nur die ganze Szene – ein teurer Belag geht dort im Spielraum unter.)
const FILE = path.join(__dirname, 'leistung-je-ding.json');
const NEU = !!process.env.LEISTUNG_NEU;
const SPIEL = [1.1, 30];                                                  // × Faktor + Zuschlag

beforeAll(() => {
  loadGame();
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game("for (let y = 0; y <= 12; y++) for (let x = 0; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } recalc()");
});
// zweiter Durchgang zählt: Einmaliges (Musterkachel, Zwischenspeicher) ist dann schon da
const cost = fn => game(`(() => { const pn = performance.now; performance.now = () => 0;
  try { (${fn})(); globalThis.__ctxCount = {}; (${fn})(); } catch (e) { globalThis.__ctxCount = null; return -1; } finally { performance.now = pn; }
  const c = globalThis.__ctxCount; globalThis.__ctxCount = null; return Object.values(c).reduce((a, b) => a + b, 0); })()`);

describe('Leistungs-Wächter je Ding (Block 149)', () => {
  it('kein Gebäude, keine Deko und kein Wegbelag zeichnet nah teurer als bisher – Neues braucht einen geprüften Wert', () => {
    const now = {};
    // Gebäude und Dekos (Dekos je Form), Stufe 1 und höchste
    for (const id of game('Object.keys(ITEMS)')) {
      const forms = game(`(DECO_LOOKS[${JSON.stringify(id)}] && DECO_LOOKS[${JSON.stringify(id)}].forms || [null]).length`);
      const lvls = game(`[1, ...(ITEMS[${JSON.stringify(id)}].levels ? [ITEMS[${JSON.stringify(id)}].levels.length] : [])]`);
      for (let f = 0; f < forms; f++) for (const lvl of [...new Set(lvls)]) {
        const v = cost(`() => drawObject(${JSON.stringify(id)}, 400, 300, 2, 1e6, 6, 6, ${lvl}, { b: ${JSON.stringify(id)}, lvl: ${lvl}, rot: 0, form: ${f} })`);
        if (v >= 0) now[`${id}${forms > 1 ? ' Form ' + f : ''}${lvl > 1 ? ' Stufe ' + lvl : ''}`] = v;
      }
    }
    // Wegbeläge: Mitte eines 3×3-Platzes (Muster, Kanten, Fugen)
    for (const s of game('STYLES.weg.map(s => s.id).concat(WEG_MUSTER.map(m => wegStyleOf(m.id, m.farbe || "hell")))')) {
      game(`for (let y = 5; y <= 7; y++) for (let x = 5; x <= 7; x++) state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: ${JSON.stringify(s)} }); recalc()`);
      const v = cost(`() => drawPath(400, 300, 2, 6, 6, state.tiles.get('6,6'))`);
      if (v >= 0) now['Weg ' + s] = v;
    }
    game("for (let y = 5; y <= 7; y++) for (let x = 5; x <= 7; x++) state.tiles.delete(x + ',' + y); recalc()");
    // Gleisbrücken übers Wasser (160c E1): je Gleis-Stil gerade auf einem Wasserstreifen, dazu Kurve, T, X (Mitte 6,6)
    const gleis = (feld, form) => game(`(() => { for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) { state.terra.set(x + ',' + y, x >= 4 && x <= 8 && y >= 4 && y <= 8 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); }
      for (const [x, y] of ${JSON.stringify(feld)}) state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: ${form}, ...(x >= 4 && x <= 8 && y >= 4 && y <= 8 ? { bridge: true } : {}) });
      terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
    const zeile = (x0, x1, y) => Array.from({ length: x1 - x0 + 1 }, (_, i) => [x0 + i, y]), spalte = (y0, y1, x) => Array.from({ length: y1 - y0 + 1 }, (_, i) => [x, y0 + i]);
    const FORMEN = { gerade: zeile(3, 9, 6), kurve: [...zeile(3, 6, 6), ...spalte(3, 5, 6)], t: [...zeile(3, 9, 6), ...spalte(7, 9, 6)], x: [...zeile(3, 9, 6), ...spalte(3, 9, 6)] };
    for (let f = 0; f < game('DECO_LOOKS.schiene.forms.length'); f++) { gleis(FORMEN.gerade, f); const v = cost(`() => drawRailBed(400, 300, 2, 6, 6, state.tiles.get('6,6'))`); if (v >= 0) now['Gleisbrücke Form ' + f] = v; }
    for (const s of ['kurve', 't', 'x']) { gleis(FORMEN[s], 0); const v = cost(`() => drawRailBed(400, 300, 2, 6, 6, state.tiles.get('6,6'))`); if (v >= 0) now['Gleisbrücke ' + s] = v; }
    // Neue Brückenmodelle (160c G2, P2): mit dem Maler des Spiels (bkDrawLagen, Übergang drawCrossing), je Material und Ort, über die Setzer
    // im neuen Format. Gleis übers Wasser gerade/Kurve/T/X, Wasser-Wegbrücke (samt Glas t1/t2), zwischen Anhöhen, Fußgängerbrücke am Übergang
    game("state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; state.techs.add('bahn'); state.techs.add('terraform'); state.restore.klippe = 1; state.restore.kristall = 1; if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall')");
    const MATS = ['holz', 'stahl', 'stein', 'kristall'], NAME = { holz: 'Holz', stahl: 'Metall', stein: 'Stein', kristall: 'Kristall' };
    const lagen = (grs, c) => cost(`() => { for (const gr of ${JSON.stringify(grs)}) bkDrawLagen(6, 6, 400, 300, 2, gr, ${c}); }`);
    const setze = (ref, m, at) => { if (m !== 'holz') expect(game(`brSet(${ref}, { mat: '${m}' })`), at + ' ' + m).toBe(true); };
    for (const s of ['gerade', 'kurve', 't', 'x']) for (const m of MATS) {
      gleis(FORMEN[s], 0); setze("{ at: 'gleis', x: 6, y: 6 }", m, 'gleis ' + s);
      expect(game("brLook(state.tiles.get('6,6'), 'gleis').mat")).toBe(m);
      const v = lagen(['h', 'vd', 'o', 't1', 't2'], 'gbAt(6, 6)'); if (v >= 0) now[`Brücke Gleis ${NAME[m]} ${s}`] = v;
    }
    for (const m of MATS) {                                               // Wasser-Wegbrücke, 5 Felder, Mitte 6,6
      game(`(() => { for (let y = 3; y <= 9; y++) for (let x = 2; x <= 10; x++) { state.terra.set(x + ',' + y, x >= 4 && x <= 8 && y >= 4 && y <= 8 ? 'water' : 'grass'); state.tiles.delete(x + ',' + y); }
        terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc(); chosenStyle.weg = 'sand'; setTool('weg'); for (let x = 3; x <= 9; x++) build('weg', x, 6, true); setTool('look'); recalc(); })()`);
      setze("{ at: 'wasser', x: 6, y: 6 }", m, 'wasser');
      expect(game("brSpanLook(6, 6).mat")).toBe(m);
      const v = lagen(['w', 't1', 't2'], 'wbAt(6, 6)'); if (v >= 0) now[`Brücke Wasser ${NAME[m]}`] = v;
    }
    game("for (let y = 2; y <= 10; y++) for (let x = 2; x <= 10; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); recalc()");
    for (const m of MATS) {                                               // zwischen Anhöhen: x 3–4 und 8–9, Lücke 5–7 (3 Felder), Mitte 6,6
      game(`(() => { state.hills.clear(); state.bruecken.clear(); for (let y = 4; y <= 8; y++) for (const x of [3, 4, 8, 9]) state.hills.set(x + ',' + y, { w: 0 });
        const b = { ax: 0, n: 3, art: 'holz' }; b.brp = { ...brPrice({ mat: 'holz' }, 'anhoehe', 3), k: brSig(b, 'anhoehe') }; state.bruecken.set('5,6', b); groundVersion++; recalc(); })()`);
      setze("{ at: 'anhoehe', k: '5,6' }", m, 'anhoehe');
      expect(game("brLook(state.bruecken.get('5,6'), 'anhoehe').mat")).toBe(m);
      const v = lagen(['hg', 'h', 'vd', 'o', 't1', 't2'], 'bkAt(6, 6)'); if (v >= 0) now[`Brücke Anhöhe ${NAME[m]}`] = v;
    }
    game("state.hills.clear(); state.bruecken.clear(); groundVersion++; recalc()");
    for (const m of MATS) {                                               // Fußgängerbrücke am Übergang: Gleis längs x, Weg längs y, ganz (wie nachgemalt)
      game("for (let y = 2; y <= 10; y++) for (let x = 2; x <= 10; x++) state.tiles.delete(x + ',' + y); recalc(); setTool('schiene'); for (let x = 3; x <= 9; x++) build('schiene', x, 6, true); chosenStyle.weg = 'sand'; setTool('weg'); for (let y = 4; y <= 8; y++) build('weg', 6, y, true); setTool('look'); recalc()");
      expect(game(`setCrossing(6, 6, true, '${m}')`), 'uebergang ' + m).toBe(true);
      expect(game("brLook(state.tiles.get('6,6'), 'uebergang').mat")).toBe(m);
      const v = cost(`() => drawCrossing(400, 300, 2, 6, 6, state.tiles.get('6,6'), 1e6)`); if (v >= 0) now[`Brücke Übergang ${NAME[m]}`] = v;
    }
    game("for (let y = 2; y <= 10; y++) for (let x = 2; x <= 10; x++) state.tiles.delete(x + ',' + y); recalc()");
    game("for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); } terrainCache.clear(); waterChanged(); recalc()");
    if (NEU) { fs.writeFileSync(FILE, JSON.stringify(now, null, 1) + '\n'); return; }
    const old = JSON.parse(fs.readFileSync(FILE, 'utf8')), bad = [];
    for (const [k, v] of Object.entries(now)) {
      if (old[k] == null) { bad.push(`neu: ${k} – ${v} (noch kein geprüfter Wert)`); continue; }
      const max = Math.ceil(old[k] * SPIEL[0] + SPIEL[1]);
      if (v > max) bad.push(`${k}: ${v} statt höchstens ${max} (bisher ${old[k]})`);
    }
    expect(bad, 'Teurer als erlaubt oder neu ohne Wert. Gewollt? → npm run leistung:neu und in AUFGABEN.md begründen').toEqual([]);
  }, 60000);
});
