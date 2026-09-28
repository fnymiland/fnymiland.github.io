const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game("state.owned.add('1,1'); state.owned.add('1,0'); state.money = 99999");
  game("for (const r of Object.keys(RES)) state.res[r] = 99");
  game("for (const t of TECHS) state.techs.add(t.id)");
  game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 0; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  // genug Einwohner (4 Villen = 64)
  game("for (let i = 0; i < 4; i++) state.tiles.set('11,' + i, { b: 'haus', lvl: 5 })");
  game("setTool('look'); buildRot = 0; rotManual = true; recalc()");
});
const put = (b, x, y, lvl = 1) => game(`state.tiles.set('${x},${y}', { b: '${b}', lvl: ${lvl} }); recalc()`);
const info = (x, y) => game(`stageInfo(state.tiles.get('${x},${y}'), ${x}, ${y})`);

describe('Gebäude wachsen in drei Stufen', () => {
  it('Sägewerk: Stufe 2 braucht zwei Holzfäller in der Nähe und freie Mitarbeiter', () => {
    put('saege', 8, 8);
    let i = info(8, 8);
    expect(i.next.name).toBe('Großes Sägewerk');
    expect(i.ready).toBe(false);
    expect(i.conds.map(c => c.text)).toEqual(['👷 2 freie Einwohner als Mitarbeiter', '2 Holzfäller in der Nähe (6 Felder)']);
    game("state.terra.set('7,6', 'forest'); state.terra.set('8,6', 'forest')");
    put('holz', 7, 6); put('holz', 8, 6);
    i = info(8, 8);
    expect(i.ready).toBe(true);
    expect(game("T.st.get('8,8').grow.ready")).toBe(true);        // ✨ über dem Gebäude
    const money = game('state.money'), bretter = game('state.res.bretter');
    game('stageUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(2);
    expect(game('state.money')).toBe(money - 250);
    expect(game('state.res.bretter')).toBe(bretter - 6);
    expect(game("stageName(state.tiles.get('8,8'))")).toBe('Großes Sägewerk');
  });

  it('ohne erfüllte Bedingungen passiert nichts', () => {
    put('saege', 8, 8);
    game('stageUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(1);
  });

  it('ohne Material auch nicht', () => {
    put('muehle', 8, 8);
    put('feld', 9, 8); put('feld', 7, 8); put('feld', 8, 9);
    expect(info(8, 8).ready).toBe(true);
    game('state.res.bretter = 1');
    game('stageUpgrade(8, 8)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(1);
  });

  it('größere Betriebe brauchen mehr Mitarbeiter', () => {
    put('saege', 8, 8);
    const jobs = game('T.jobs');
    game("state.tiles.get('8,8').lvl = 3; recalc()");
    expect(game('T.jobs')).toBe(jobs + 4);
  });

  it('fehlen Einwohner, kann nichts wachsen', () => {
    game("for (let i = 0; i < 4; i++) state.tiles.delete('11,' + i)");
    game("state.tiles.set('11,0', { b: 'haus', lvl: 1 })");
    put('saege', 8, 8); put('feld', 6, 6);
    expect(info(8, 8).conds[0].ok).toBe(false);                    // 4 Einwohner, 3 arbeiten schon
  });

  it('Fischerhütte braucht Wasser, Schule braucht Einwohner', () => {
    put('fischer', 8, 8);
    expect(info(8, 8).conds.some(c => c.text.startsWith('💧 4 Wasserfelder'))).toBe(true);
    put('schule', 6, 6);
    expect(info(6, 6).conds.find(c => c.text.startsWith('👥')).ok).toBe(true);   // 64 ≥ 25
  });

  it('„weitere“, wenn es um die eigene Sorte geht', () => {
    put('holz', 8, 8, 2);
    expect(info(8, 8).conds[1].text).toBe('2 weitere Holzfäller in der Nähe (4 Felder)');
  });

  it('nach Stufe 3 ist Schluss', () => {
    put('saege', 8, 8, 3);
    expect(info(8, 8).next).toBe(null);
  });
});

describe('Alte Spielstände', () => {
  it('Stufe 4 und 5 werden zu Stufe 3, die Ausbaukosten gibt es zurück', () => {
    const d = game('serialize()');
    d.tiles.push(['8,8', { b: 'feld', lvl: 5 }]);
    const money = d.money;
    const s = game(`parseSave(${JSON.stringify(d)})`);
    expect(s.tiles.get('8,8').lvl).toBe(3);
    expect(s.money).toBe(money + Math.round(20 * 1.8 ** 3) + Math.round(20 * 1.8 ** 4));
    // nochmal laden: nichts mehr zu erstatten
    game(`state = parseSave(${JSON.stringify(d)})`);
    expect(game('parseSave(serialize()).money')).toBe(game('state.money'));
  });
});

describe('Abreißen', () => {
  it('gibt die Hälfte von Baupreis und Ausbau-Talern zurück', () => {
    put('saege', 8, 8, 3);
    expect(game('demolishInfo(8, 8).refund')).toBe(Math.floor((200 + 250 + 600) / 2));
  });
});
