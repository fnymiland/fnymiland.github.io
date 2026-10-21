const { loadGame, game } = require('./helpers/load-game');

// Prüfung vor dem Push (19.10.2026, Prüfer Brücken 160c): (1) Fähren, die nach dem Update an einer flachen Brücke hängen bleiben,
// meldet das Spiel einmal; (2) Gleisbrücke mit gekauftem, ausgeschaltetem Licht verlängern: das neue Feld bezahlt das Licht mit
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 5000");
  game("for (let y = 0; y <= 40; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); recalc()");
});

describe('Fähren nach dem Update: flache Brücke sperrt – einmal melden', () => {
  // ein Wasserstreifen x 11, darüber ein 1-Feld-Steg (Weg 10–12 auf y 6): nach der neuen Regel zu niedrig für Boote
  const steg = () => game(`(() => { for (let y = 3; y <= 9; y++) state.terra.set('11,' + y, 'water');
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged();
    chosenStyle.weg = 'sand'; for (const x of [10, 12, 11]) build('weg', x, 6, true); recalc(); })()`);
  const mitFaehre = fn => game(`(() => { const sr = seaRoutesNow; seaRoutesNow = () => new Set(seaCross(11, 6) === 'block' ? [] : ['f:0,0|0,2']);
    for (const k of ['0,0', '0,2']) state.tiles.set(k, { b: 'bootssteg', lvl: 1 });
    try { return (${fn})(); } finally { seaRoutesNow = sr; } })()`);
  it('alte Regel ging durch, neue nicht: als verloren erkannt; Prüfung nur einmal je Spielstand', () => {
    steg();
    expect(game('seaCross(11, 6)')).toBe('block');
    expect(mitFaehre('() => seaFlatLost()')).toEqual(['f:0,0|0,2']);
    expect(game('seaCross(11, 6)')).toBe('block');                                  // danach wieder die neue Regel
    game('state.seaFlatSeen = false');
    expect(mitFaehre('() => seaFlatCheck()')).toEqual(['f:0,0|0,2']);
    expect(game('state.seaFlatSeen')).toBe(true);
    expect(mitFaehre('() => seaFlatCheck()')).toEqual([]);                          // nie zweimal
  });
  it('Meldung nennt die Fähre und was man tun kann; neue Spiele prüfen nicht, alte Stände schon', () => {
    game('announceSeaFlat(["f:0,0|0,2"])');
    const txt = game("document.getElementById('modal-card').textContent");
    game('closeModal()');
    expect(txt).toMatch(/bögen/i); expect(txt).toMatch(/↔/);
    expect(game('newState().seaFlatSeen')).toBe(true);
    const d = game('JSON.parse(JSON.stringify(serialize()))'); delete d.seaFlatSeen;
    expect(game(`parseSave(${JSON.stringify(d)}).seaFlatSeen`)).toBe(false);
  });
});

describe('Gleisbrücke verlängern: ausgeschaltetes Licht wird mitbezahlt', () => {
  const bau = () => game(`(() => {
    for (let y = 0; y <= 9; y++) for (let x = 2; x <= 12; x++) state.terra.set(x + ',' + y, 'water');
    for (let x = 0; x <= 8; x++) state.tiles.set(x + ',5', { b: 'schiene', lvl: 1, form: 0, ...(x >= 2 ? { bridge: true } : {}) });
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
  it('neues Feld zahlt so viel wie das Nachbarfeld mit Licht (aus = gekauft)', () => {
    bau();
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'kaufen' })")).toBe(true);
    expect(game("brSet({ at: 'gleis', x: 4, y: 5 }, { licht: 'aus' })")).toBe(true);
    expect(game("state.tiles.get('8,5').brl")).toBe('aus');
    game("state.techs.add('bahn')");
    expect(game("placeError('schiene', 9, 5) || build('schiene', 9, 5, true)")).toBe(true);
    const neu = game("brPaid(state.tiles.get('9,5'), 'gleis')"), alt = game("brPaid(state.tiles.get('8,5'), 'gleis')");
    expect(neu).toEqual(alt);
  });
});

describe('Neuere Version hat gespeichert: dieses Gerät sperrt das Speichern (Nutzer 21.10.2026)', () => {
  afterEach(() => game('newerBlock = 0; APP_VER = 0; closeModal()'));
  it('Stand einer neueren Version: kein Speichern, kein Hochladen, Fenster mit Neu laden', () => {
    game('APP_VER = 100');
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    expect(d.appVer).toBe(100);
    d.appVer = 101;
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game('newerBlock')).toBe(101);
    game("localStorage.removeItem(SAVE_KEY); state.money = 4242; save()");
    expect(game('localStorage.getItem(SAVE_KEY)')).toBe(null);
    expect(game('liveCanPush(true)')).toBe(false);
    game('showNewer()');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/neuere[n]? Version/);
  });
  it('gleiche oder ältere Version und Stände ohne Nummer: alles wie immer', () => {
    game('APP_VER = 100');
    for (const v of [100, 99, undefined]) {
      const d = game('JSON.parse(JSON.stringify(serialize()))'); if (v === undefined) delete d.appVer; else d.appVer = v;
      game(`parseSave(${JSON.stringify(d)})`);
      expect(game('newerBlock'), String(v)).toBe(0);
    }
  });
});

describe('Falsche Uhr auf einem Gerät: Tage aus der Zukunft gelten nicht', () => {
  const fresh = "state.sdItems = new Set(); state.sdShown = new Set(); state.sdOffers = null; state.sdSeen = true; state.stardust = 1000";
  it('Tageswunsch, Schatzkammer und gemerkte Angebote von übermorgen werden durch heute ersetzt', () => {
    game(fresh);
    const today = 20261021, future = 20261105;
    game(`state.dayWish = { day: ${future}, id: TW_LIST[0].id, base: 0, done: true, who: 'X', icon: 'x' }; state.treasury = { day: ${future}, n: 30 }`);
    game(`state.sdOffers = { day: ${future}, week: sdWeek(${future}), ids: basarOffers(${future}).slice(0, 3).map(s => s.id), rare: null }`);
    const w = game(`(w => w && [w.day, w.done])(twToday(${today}))`);
    if (w) expect(w).toEqual([today, false]);
    expect(game(`sdTreasury(${today})`)).toEqual({ day: today, n: 0 });
    game(`basarOffers(${today})`);
    expect(game('state.sdOffers.day')).toBe(today);
  });
  it('morgen (Zeitzone, Mitternacht auf dem anderen Gerät) bleibt gültig', () => {
    game(fresh);
    game('state.treasury = { day: 20261022, n: 3 }');
    expect(game('sdTreasury(20261021)')).toEqual({ day: 20261022, n: 3 });
  });
});

describe('Tageswunsch per ↶: Rückgängig nimmt den Wunsch zurück', () => {
  it('Wunsch erfüllt, dann ↶: wieder offen, die 25 ✨ sind weg, später erneut erfüllbar', () => {
    game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.claimed.add(k); } recalc(); resetUndo(); state.sdSeen = true; state.stardust = 0; state.sdGot = new Set()");
    const id = game("(TW_LIST.find(d => d.id === 'baum') || TW_LIST.find(d => d.items.some(b => ITEMS[b] && !ITEMS[b].small && available(b)))).id");
    const today = game('sdDay()');
    game(`state.dayWish = { day: ${today}, id: '${id}', base: TW_BY_ID['${id}'].count(), done: false, who: 'X', icon: 'x' }`);
    const need = game(`TW_BY_ID['${id}'].need`), b = game(`TW_BY_ID['${id}'].items.find(b => ITEMS[b] && available(b))`), small = game(`!!ITEMS['${b}'].small`);
    game(`undoable(() => { for (let i = 0; i < ${need}; i++) ${small ? `buildSmall('${b}', 2 + i, 2, 0)` : `build('${b}', 2 + i * 2, 2)`}; })`);
    game('twAt = 0; twTick(Date.now() + 1e7)');
    expect(game('[state.dayWish.done, state.stardust]')).toEqual([true, 25]);
    expect(game('undo()')).toBe(true);
    expect(game('[state.dayWish.done, state.stardust, state.sdGot.has("wish:" + state.dayWish.day)]')).toEqual([false, 0, false]);
  });
});
