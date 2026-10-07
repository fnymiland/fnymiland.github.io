const { loadGame, game } = require('./helpers/load-game');

// Block 131: kleiner Bahnhof 2 oder 3 Felder lang – mit 3 steht die Tür genau auf einem Feld (Symmetrie mit 1er-Wegen)
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; state.techs.add('bahn'); stationNewLen = 2; resetUndo()");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});
const stationKey = () => game("([...state.tiles].find(([, t]) => t.b === 'station') || [])[0]");

describe('Bahnhof 2 oder 3 Felder (Block 131)', () => {
  it('neu gebaut mit 3 Feldern in jeder Drehung: 3 Felder, Mitte auf einem Feld; Leiste zeigt die Wahl', () => {
    game("setTool('station')");
    expect(game("[...document.querySelectorAll('#style-bar [data-slen]')].map(b => b.dataset.slen)")).toEqual(['2', '3']);
    game("document.querySelector('#style-bar [data-slen=\"3\"]').click()");
    expect(game('stationNewLen')).toBe(3);
    for (let rot = 0; rot < 4; rot++) {
      game(`buildRot = ${rot}; rotManual = true`);
      expect(game("build('station', 14, 14, true)"), `rot ${rot}`).toBe(true);
      const k = stationKey(), t = game(`state.tiles.get('${k}')`);
      expect(t.len).toBe(3);
      const [w, h] = game(`sizeOf('station', ${rot}, state.tiles.get('${k}'))`);
      expect(w * h).toBe(3);
      expect(Math.max(w, h)).toBe(3);
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('im Fenster umstellen: wächst zur freien Seite, kostet; kürzer gibt nichts zurück, wieder lang kostenlos (Block 137); ↶ geht', () => {
    game("state.tiles.set('14,14', { b: 'station', lvl: 1, rot: 0 }); recalc()");                // 1 × 2: y 14…15
    const m0 = game('state.money');
    game("openInfo(14, 14)");
    expect(game("[...document.querySelectorAll('#panel [data-slen]')].map(b => b.textContent)").join()).toMatch(/3 Felder/);
    game("document.querySelector('#panel [data-slen=\"3\"]').click()");
    let k = stationKey();
    expect(k).toBe('14,14');                                                                       // rechts war frei
    expect(game(`state.tiles.get('${k}').len`)).toBe(3);
    expect(game('state.money')).toBe(m0 - game('STATION_LEN_COST.money'));
    game('undo()');
    expect(game(`state.tiles.get('${stationKey()}').len`)).toBe(undefined);
    // rechts belegt: wächst nach links
    game("state.tiles.set('14,16', { b: 'haus', lvl: 1 }); recalc()");
    k = game("stationLenSet('14,14', 3)");
    expect(k).toBe('14,13');
    k = game(`stationLenSet('${k}', 2)`);
    expect(game(`state.tiles.get('${k}').len`)).toBe(undefined);
    // Block 137: kürzer gab nichts zurück, wieder lang kostet nichts – auch nach Speichern und Laden
    const m1 = game('state.money');
    k = game(`stationLenSet('${k}', 3)`);
    expect(game('state.money')).toBe(m1);
    k = game(`stationLenSet('${k}', 2)`);
    expect(game('state.money')).toBe(m1);
    expect(game(`parseSave(JSON.parse(JSON.stringify(serialize()))).tiles.get('${k}').lenPaid`)).toBe(3);
    // beidseitig belegt: Hinweis
    game(`state.tiles.delete('${k}'); state.tiles.set('14,14', { b: 'station', lvl: 1, rot: 0 }); state.tiles.set('14,13', { b: 'haus', lvl: 1 }); recalc()`);
    expect(game("stationLenPlan('14,14', 3)")).toMatch(/Daneben steht etwas/);
  });
  it('3 Felder lang ist ein Halt wie bisher (Schiene am Bahnsteig); Speichern und Laden behalten die Länge', () => {
    game("state.tiles.set('14,14', { b: 'station', lvl: 1, rot: 0, len: 3 }); for (let y = 12; y <= 18; y++) state.tiles.set('15,' + y, { b: 'schiene', lvl: 1 }); recalc()");
    expect(game("T.rail.stationNet.get('14,14')")).not.toBe(null);
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    expect(game(`parseSave(${JSON.stringify(s)}).tiles.get('14,14').len`)).toBe(3);
  });
  it('zeichnet in beiden Längen, jeder Drehung, Tag und Nacht ohne Fehler', () => {
    const bad = game(`(() => { const out = []; for (const len of [2, 3]) for (let rot = 0; rot < 4; rot++) for (const n of [0, 0.8]) {
      try { night = n; drawObject('station', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'station', lvl: 1, rot, ...(len === 3 ? { len } : {}) }); } catch (e) { out.push(len + ':' + rot + ' ' + e.message); } } night = 0; return out; })()`);
    expect(bad).toEqual([]);
  });
});
