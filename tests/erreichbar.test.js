const { loadGame, game } = require('./helpers/load-game');

// Block 26: Versorgung (Bäckerei, Markt, Schule, Park/Brunnen, „in der Nähe“ bei Gebäuden) zählt auch, wenn ein Weg
// (selbes Viertel) oder eine Verbindung (Zug, Seilbahn, Fähre) dorthin führt. Schönheit, Wasser, „direkt daneben“ nicht.
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 99999; for (const r of Object.keys(RES)) state.res[r] = 99');
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.techs.add('bahn'); recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)})`);
const wish = (w, x, y) => game(`recalc(), wishCheck('${w}', ${x}, ${y}, T.access)`);
// Marktplatz: drei Stände nebeneinander (auf Kopfstein)
const market = (x, y) => { for (let i = 0; i < 3; i++) put(`${x + i},${y}`, { b: 'stand_obst', lvl: 1, weg: 'kopf' }); };
const path = (x0, x1, y) => { for (let x = x0; x <= x1; x++) put(`${x},${y}`, { b: 'weg', lvl: 1, style: 'sand' }); };

describe('per Weg (selbes Viertel)', () => {
  it('Markt 10 Felder weg: erst nicht erreichbar, mit Weg dorthin schon', () => {
    put('5,5', { b: 'haus', lvl: 3 });
    market(15, 7);
    expect(wish('markt', 5, 5).ok).toBe(false);
    path(5, 16, 6);
    expect(wish('markt', 5, 5)).toEqual({ ok: true, how: 'viertel' });
  });

  it('nah bleibt nah', () => {
    put('5,5', { b: 'haus', lvl: 3 });
    put('7,7', { b: 'baecker', lvl: 1 });
    expect(wish('baecker', 5, 5)).toEqual({ ok: true, how: 'nah' });
  });

  it('Schönheit und Wasser zählen nur vor Ort', () => {
    put('5,5', { b: 'haus', lvl: 3 });
    path(5, 20, 6);
    put('18,7', { b: 'park', lvl: 1 });
    for (let i = 0; i < 6; i++) game(`state.decos.set('${14 + i},5', [{ b: 'blumentopf' }, null, null, null])`);
    expect(wish('park', 5, 5).ok).toBe(true);                     // Park ist Versorgung
    expect(wish('schoen', 5, 5).ok).toBe(false);                  // Schönheit nicht
  });

  it('Gebäudestufe: „in der Nähe“ auch per Weg, „direkt daneben“ nicht', () => {
    put('5,5', { b: 'fischer', lvl: 2 });                        // Stufe 3 braucht einen Markt in 8 Feldern
    market(15, 7);
    const cond = () => game("recalc(), stageInfo(state.tiles.get('5,5'), 5, 5, 999, 0, T.access).conds.find(c => /Markt/.test(c.text))");
    expect(cond().ok).toBe(false);
    path(5, 16, 6);
    expect(cond()).toMatchObject({ ok: true, how: 'viertel' });
    // Mühle braucht 3 Felder direkt daneben – drei Felder am Weg weiter weg zählen nicht
    put('5,5', { b: 'muehle', lvl: 1 });
    for (const x of [12, 13, 14]) put(`${x},7`, { b: 'feld', lvl: 1 });
    expect(game("recalc(), stageInfo(state.tiles.get('5,5'), 5, 5, 999, 0, T.access).conds.find(c => /Feld/.test(c.text)).ok")).toBe(false);
  });

  it('ein einzelner Stand ist noch kein Marktplatz', () => {
    put('5,5', { b: 'haus', lvl: 3 });
    put('7,6', { b: 'stand_obst', lvl: 1, weg: 'kopf' });
    expect(wish('markt', 5, 5).ok).toBe(false);
    put('8,6', { b: 'stand_brot', lvl: 1, weg: 'kopf' }); put('9,6', { b: 'stand_kaese', lvl: 1, weg: 'kopf' });
    expect(wish('markt', 5, 5)).toEqual({ ok: true, how: 'nah' });
  });
});

describe('per Bahn', () => {
  function line(power = true) {
    for (let x = 4; x <= 16; x++) put(`${x},10`, { b: 'schiene', lvl: 1 });
    put('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); put('17,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' });
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
    if (power) for (let i = 0; i < 10; i++) put(`${2 + i},24`, { b: 'windrad', lvl: 3 });
  }
  it('Haus nah am Bahnhof, Markt nah am Bahnhof drüben: erreichbar, solange der Zug fährt', () => {
    put('3,14', { b: 'haus', lvl: 3 });
    market(18, 12);
    line();
    expect(game('recalc(), T.rail.lines[0].powered')).toBe(true);
    expect(wish('markt', 3, 14)).toEqual({ ok: true, how: 'bahn' });
    game("for (const [k, t] of [...state.tiles]) if (t.b === 'windrad') state.tiles.delete(k)");   // ohne Strom fährt nichts
    expect(wish('markt', 3, 14).ok).toBe(false);
    expect(game('T.rail.lines[0].powered')).toBe(false);
  });

  it('Infofenster zeigt, wie es erreicht wird', () => {
    put('5,5', { b: 'haus', lvl: 3 });
    market(15, 7);
    path(5, 16, 6);
    game('recalc(); openInfo(5, 5)');
    expect(document.getElementById('panel').textContent).toMatch(/Marktplatz erreichbar.*im selben Viertel/);
  });
});
