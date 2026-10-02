const { loadGame, game } = require('./helpers/load-game');

// Block 39: Marktplatz zum Selberbauen – Platz aus Wegen, Stände und große Deko darauf (der Weg bleibt darunter)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('buildRot = 0; rotManual = true; recalc()');
});
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)})`);
const plaza = (x0, y0, w, h, style = 'kopf') => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) put(`${x},${y}`, { b: 'weg', lvl: 1, style }); game('recalc()'); };
const build = (b, x, y) => game(`build('${b}', ${x}, ${y}, true)`);
const tile = k => game(`state.tiles.get('${k}')`);

describe('Stände und Deko auf dem Platz', () => {
  it('ein Stand kommt nur auf einen Weg – der Weg bleibt darunter liegen (Stil gemerkt)', () => {
    expect(game("placeError('stand_obst', 10, 10)")).toBe('Marktstände gehören auf einen Weg oder Platz');
    plaza(10, 10, 3, 3, 'klinker');
    expect(build('stand_obst', 10, 10)).toBe(true);
    expect(tile('10,10')).toMatchObject({ b: 'stand_obst', weg: 'klinker' });
    expect(game("wegUnder(state.tiles.get('10,10'))")).toBe('klinker');
    expect(game("pathAt(10, 10).id")).toBe('klinker');                          // der Platz läuft bündig darunter
  });

  it('auch Brunnen, Statue & Co. dürfen auf den Platz; ein Haus ersetzt den Weg (Block 58)', () => {
    plaza(10, 10, 3, 3);
    expect(build('brunnen', 11, 11)).toBe(true);
    expect(tile('11,11')).toMatchObject({ b: 'brunnen', weg: 'kopf' });
    expect(game("placeError('haus', 10, 10)")).toBe(null);
  });

  it('abreißen oder wegtragen: der Weg kommt zurück; ablegen auf Wiese: ohne Weg', () => {
    plaza(10, 10, 3, 3);
    build('stand_obst', 10, 10); build('brunnen', 11, 11);
    game('demolish(10, 10)');
    expect(tile('10,10')).toMatchObject({ b: 'weg', style: 'kopf' });
    game('pickUp(11, 11, 0)');
    expect(tile('11,11')).toMatchObject({ b: 'weg', style: 'kopf' });
    game('dropAt(15, 15, 0)');
    expect(tile('15,15').b).toBe('brunnen');
    expect(tile('15,15').weg).toBe(undefined);
  });

  it('Speichern während man einen Stand trägt: kein doppeltes Feld, der Stand ist nach dem Laden wieder da', () => {
    plaza(10, 10, 3, 1);
    build('stand_obst', 10, 10);
    game('pickUp(10, 10, 0)');
    const tiles = game('serialize().tiles');
    expect(tiles.filter(([k]) => k === '10,10').length).toBe(1);
    expect(tiles.find(([k]) => k === '10,10')[1]).toMatchObject({ b: 'stand_obst', weg: 'kopf' });
    game('cancelMove()');
  });

  it('die Vorschau beim Bauen löscht den Weg nicht', () => {
    plaza(10, 10, 1, 1);
    game("previewCache = null; previewDelta('stand_obst', 10, 10)");
    expect(tile('10,10').b).toBe('weg');
  });

  it('auf einen Weg mit kleinen Dekos darf kein Stand', () => {
    plaza(10, 10, 1, 1);
    game("state.decos.set('10,10', [{ b: 'blumentopf', rot: 0 }, null, null, null]); recalc()");
    expect(game("placeError('stand_obst', 10, 10)")).toBe('Hier stehen schon kleine Dekos');
  });
});

describe('Marktplatz', () => {
  it('ab 3 Ständen auf einem Platz: Marktplatz, 6: Wochenmarkt, 9: Großer Markt', () => {
    plaza(10, 10, 4, 3);
    const spots = [[10, 10], [11, 10], [12, 10], [13, 10], [10, 11], [13, 11], [10, 12], [11, 12], [12, 12]];
    const stage = () => game('recalc(), MARKETS.length ? MARKETS[0].stage : 0');
    spots.slice(0, 2).forEach(([x, y]) => build('stand_obst', x, y));
    expect(stage()).toBe(0);
    build('stand_brot', ...spots[2]);
    expect(stage()).toBe(1);
    spots.slice(3, 6).forEach(([x, y]) => build('stand_kaese', x, y));
    expect(stage()).toBe(2);
    spots.slice(6).forEach(([x, y]) => build('stand_fisch', x, y));
    expect(stage()).toBe(3);
    game('openInfo(10, 10)');
    expect(document.getElementById('panel').textContent).toContain('Großer Markt: 9 Stände');
  });

  it('Stände auf getrennten Plätzen zählen nicht zusammen', () => {
    plaza(10, 10, 2, 1); plaza(15, 10, 1, 1);
    build('stand_obst', 10, 10); build('stand_obst', 11, 10); build('stand_obst', 15, 10);
    expect(game('recalc(), MARKETS.length')).toBe(0);
    game('openInfo(15, 10)');
    expect(document.getElementById('panel').textContent).toContain('Noch kein Marktplatz: 1 von 3');
  });

  it('Marktviertel: Läden bis 4 Felder um den Platz verdienen +20 %', () => {
    for (let x = 3; x <= 22; x++) put(`${x},14`, { b: 'weg', lvl: 1, style: 'sand' });
    for (let i = 0; i < 6; i++) put(`${3 + i},13`, { b: 'haus', lvl: 3 });
    put('12,15', { b: 'kiosk', lvl: 1 });
    const inc0 = game("recalc(), T.st.get('12,15').inc");
    plaza(10, 18, 3, 1);                                                       // eigener Platz, 3 Felder vom Kiosk (nicht im selben Viertel)
    for (const x of [10, 11, 12]) build('stand_obst', x, 18);
    const s = game("recalc(), T.st.get('12,15')");
    expect(s.markt).toBe(true);
    expect(s.inc).toBeCloseTo(inc0 * 1.2, 5);
    expect(game('T.marktInc')).toBeCloseTo(s.inc, 5);
  });

  it('zieht Besucher an – mehr Stände, mehr', () => {
    plaza(10, 10, 3, 1);
    const attr0 = game("placeStats().attr.get(regionAt(10, 10)) || 0");
    for (const x of [10, 11, 12]) build('stand_obst', x, 10);
    game('recalc()');
    expect(game("placeStats().attr.get(regionAt(10, 10))") - attr0).toBeGreaterThanOrEqual(game('MARKT_ATTR[1]'));
  });

  it('Markttag: alle 20 Minuten 3 Minuten – das Marktviertel verdient dann doppelt', () => {
    plaza(10, 10, 3, 1);
    for (const x of [10, 11, 12]) build('stand_obst', x, 10);
    game('recalc()');
    const on = game('MARKTTAG_AT + 60e3'), off = game('MARKTTAG_AT + 5 * 60e3');
    expect(game(`marktLeft(${on})`)).toBeGreaterThan(0);
    expect(game(`marktLeft(${off})`)).toBe(0);
    game("T = { ...T, inc: 100, marktInc: 30 }; state.money = 0");
    game(`Date.now = () => ${on}; earn(1); Date.now = () => ${off}; earn(1)`);
    expect(game('state.money')).toBeCloseTo(130 + 100, 5);
  });
});

describe('Alte Märkte', () => {
  it('ein alter Markt (3×3, Stufe 2) wird ein Kopfsteinplatz mit 6 Ständen – ein Wochenmarkt', () => {
    const d = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.tiles.push(['10,10', { b: 'markt', lvl: 2, rot: 1 }]); return d; })()");
    game(`adoptState(parseSave(${JSON.stringify(d)})); recalc()`);
    const all = game("[...state.tiles].filter(([k]) => { const [x, y] = keyXY(k); return x >= 10 && x <= 12 && y >= 10 && y <= 12; }).map(([, t]) => t)");
    expect(all.length).toBe(9);
    expect(all.filter(t => STAND_IDS.includes(t.b)).length).toBe(6);
    expect(all.every(t => t.b === 'weg' ? t.style === 'kopf' : t.weg === 'kopf')).toBe(true);
    expect(game('MARKETS[0].stage')).toBe(2);
    expect(game("Object.values(ITEMS).some(d => d.name === 'Markt' && d.size)")).toBe(false);
  });
});
const STAND_IDS = ['stand_obst', 'stand_blumen', 'stand_brot', 'stand_kaese', 'stand_fisch', 'stand_gewuerz'];
