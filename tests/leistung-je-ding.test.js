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
    if (NEU) { fs.writeFileSync(FILE, JSON.stringify(now, null, 1) + '\n'); return; }
    const old = JSON.parse(fs.readFileSync(FILE, 'utf8')), bad = [];
    for (const [k, v] of Object.entries(now)) {
      if (old[k] == null) { bad.push(`neu: ${k} – ${v} (noch kein geprüfter Wert)`); continue; }
      const max = Math.ceil(old[k] * SPIEL[0] + SPIEL[1]);
      if (v > max) bad.push(`${k}: ${v} statt höchstens ${max} (bisher ${old[k]})`);
    }
    expect(bad, 'Teurer als erlaubt oder neu ohne Wert. Gewollt? → npm run leistung:neu und in AUFGABEN.md begründen').toEqual([]);
  });
});
