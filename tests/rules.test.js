const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
});

const T = () => game('T');
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);

describe('Neues Spiel', () => {
  it('startet mit Rathaus, 300 Talern und allen Sehenswürdigkeiten', () => {
    expect(game("state.tiles.get('2,2').b")).toBe('rathaus');
    expect(game('state.money')).toBe(300);
    const lms = game("[...state.tiles.values()].filter(t => t.b === 'lm').map(t => t.lm).sort()");
    expect(lms).toEqual(['baum', 'erzberg', 'klippe', 'kristall', 'obsthain', 'quelle', 'ruine']);
  });

  it('die Mitte der Insel ist Wiese, der Rand ist Meer', () => {
    expect(game("terrainAt(3, 3)")).toBe('grass');
    expect(game("terrainAt(60, 60)")).toBe('water');
  });
});

describe('Bauen', () => {
  it('ein Haus bringt 4 Einwohner und kostet 40 Taler', () => {
    expect(build('haus', 4, 4)).toBe(true);
    expect(T().pop).toBe(4);
    expect(game('state.money')).toBe(260);
  });

  it('Holzfäller nur im Wald', () => {
    build('haus', 4, 4);
    expect(game("placeError('holz', 4, 3)")).toBe('Nur im Wald – überall mit „Forstwirtschaft“');
    game("state.terra.set('4,3', 'forest')");
    expect(build('holz', 4, 3)).toBe(true);
    game('recalc()');
    expect(T().prod.holz).toBeGreaterThanOrEqual(0.3);
  });

  it('Betriebe brauchen Einwohner', () => {
    game("state.terra.set('4,3', 'forest')");
    expect(game("placeError('holz', 4, 3)")).toMatch(/Zu wenig Einwohner/);
  });

  it('nicht auf fremdem Grundstück', () => {
    const [x, y] = game('isleAnchor(ISLE_BY_ID.wald)');
    expect(game(`placeError('haus', ${x + 4}, ${y})`)).toBe('Das ist nicht dein Grundstück');
  });
});

describe('Rohstoffe', () => {
  it('Sägewerk macht aus 2 Holz 1 Brett, nur solange Holz da ist', () => {
    game('state.restore.baum = 1');
    build('haus', 4, 4);
    expect(build('saege', 4, 3)).toBe(true);
    game('recalc()');
    game('state.res.holz = 2');
    game('produce(100)');
    expect(game('state.res.holz')).toBeCloseTo(0);
    expect(game('state.res.bretter')).toBeCloseTo(1);
  });

  it('Material wird geprüft und abgezogen', () => {
    game("state.money = 1000");
    expect(game("smallError('bank', 4, 4, 3)")).toBe('Zu wenig Bretter (2 🪚 nötig)');
    game('state.res.bretter = 5');
    expect(game("buildSmall('bank', 4, 4, 3)")).toBe(true);
    expect(game('state.res.bretter')).toBe(3);
  });
});

describe('Kleine Dekos', () => {
  it('bis zu 4 pro Feld, eine Ecke nur einmal', () => {
    game('state.money = 1000');
    for (let i = 0; i < 4; i++) expect(game(`buildSmall('blumentopf', 4, 4, ${i})`)).toBe(true);
    expect(game("smallError('blumentopf', 4, 4, 2)")).toBe('Alle 4 Ecken sind belegt');
  });
});

describe('Viertel und Wege', () => {
  // Abseits vom Rathaus bauen, damit nichts ungewollt zusammenhängt
  const field = () => {
    game("state.owned.add('1,1'); state.money = 5000");
    game("for (let y = 6; y <= 17; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  };

  it('aneinandergrenzende Gebäude bilden ein Viertel, ab 3 gibt es +10 %', () => {
    field();
    build('haus', 8, 8); build('haus', 9, 8); build('haus', 10, 8);
    game('recalc()');
    const s = game("T.st.get('9,8')");
    expect(s.n).toBe(3);
    expect(s.bonus).toBeCloseTo(0.1);
  });

  it('auch über Eck gehört man dazu, Wege zählen nicht als Gebäude', () => {
    field();
    build('haus', 8, 8); build('haus', 9, 9); build('weg', 10, 10);
    game('recalc()');
    expect(game("T.st.get('9,9').n")).toBe(2);
  });

  it('weit weg ohne Weg: halbe Kraft – mit Weg zum Dorf: volle Kraft', () => {
    field();
    build('haus', 8, 6);
    game("state.owned.add('1,2'); state.terra.set('8,13', 'forest')");
    expect(build('holz', 8, 13)).toBe(true);
    game('recalc()');
    expect(game("T.st.get('8,13').how")).toBe('weit');
    for (let y = 7; y <= 12; y++) build('weg', 8, y);
    game('recalc()');
    expect(game("T.st.get('8,13').how")).toBe('viertel');
    expect(game("T.st.get('8,13').eff")).toBe(1);
  });

  it('Wege übermalen färbt sie um, gleicher Stil tut nichts', () => {
    field();
    build('weg', 8, 8);
    expect(game("state.tiles.get('8,8').style")).toBe('sand');
    game("state.design.add('weg:mulch'); chosenStyle.weg = 'mulch'");
    expect(build('weg', 8, 8)).toBe(true);
    expect(game("state.tiles.get('8,8').style")).toBe('mulch');
    expect(build('weg', 8, 8)).toBe(false);
  });

  it('gesperrte Stile können nicht gemalt werden', () => {
    game("chosenStyle.weg = 'fisch'");
    expect(game("currentStyle('weg')")).toBe('sand');
  });

  it('kleine Dekos dürfen auf Wege, große nicht', () => {
    field();
    build('weg', 8, 8);
    game('state.res.metall = 5');
    game("state.design.add('laterne'); state.restore.quelle = 2");
    expect(game("smallError('laterne', 8, 8, 0)")).toBe(null);
    expect(game("placeError('brunnen', 8, 8)")).toBe('Hier steht schon etwas');
  });
});

describe('Speichern und Laden', () => {
  it('ein gespeicherter Stand kommt unverändert zurück', () => {
    game('state.money = 1000; state.res.holz = 7');
    build('haus', 4, 4);
    game("state.tiles.set('5,4', { b: 'weg', lvl: 1, style: 'mulch' })");
    game("buildSmall('blumentopf', 4, 4, 1)");
    game('save()');
    const loaded = game('load()');
    expect(loaded.res.holz).toBe(7);
    expect(loaded.tiles.get('4,4').b).toBe('haus');
    expect(loaded.tiles.get('5,4').style).toBe('mulch');
    expect(loaded.decos.get('4,4')[1].b).toBe('blumentopf');
  });

  it('alte Stände: Straßen, Gartenwege und Pflaster werden Wege, Entferntes wird erstattet', () => {
    game('save()');
    const raw = JSON.parse(localStorage.getItem('kachelhausen_v3'));
    raw.money = 0; raw.science = 0;
    raw.tiles = raw.tiles.filter(([k]) => !['3,3', '4,3', '5,3', '6,3', '7,3'].includes(k));
    raw.tiles.push(['3,3', { b: 'kraftwerk', lvl: 1 }], ['4,3', { b: 'strasse', lvl: 1 }], ['5,3', { b: 'strasse', lvl: 1, style: 'kopf' }],
                   ['6,3', { b: 'weg', lvl: 1, style: 'steg' }], ['7,3', { b: 'bus', lvl: 1 }]);
    raw.paved = [['8,3', 'terrakotta'], ['4,3', 'kopf'], '9,6'];
    raw.walks = ['3,3,s', ['4,4,e', 'kies']];
    raw.techs = ['wind', 'bus2', 'farben']; raw.v = 3; delete raw.design;
    localStorage.setItem('kachelhausen_v3', JSON.stringify(raw));
    const d = game('load()');
    expect(d.money).toBe(500 + 120);                         // Kraftwerk + Bushaltestelle
    expect(d.science).toBe(30 + 70);                         // Windkraft + Schnellbusse
    expect([...d.techs]).toEqual([]);                         // Farbenlehre ist jetzt Kunstakademie …
    expect(d.design.has('wall:12') && d.design.has('weg:konfetti')).toBe(true);   // … und bleibt freigeschaltet
    expect(d.tiles.has('3,3')).toBe(false);
    expect(d.tiles.get('4,3')).toMatchObject({ b: 'weg', style: 'asphalt' });
    expect(d.tiles.get('5,3')).toMatchObject({ b: 'weg', style: 'kopf' });
    expect(d.tiles.get('6,3')).toMatchObject({ b: 'weg', style: 'sand' });
    expect(d.tiles.has('7,3')).toBe(false);
    expect(d.tiles.get('8,3')).toMatchObject({ b: 'weg', style: 'terrakotta' });
    expect(d.tiles.get('9,6')).toMatchObject({ b: 'weg', style: 'platten' });
    expect(d.walks).toBeUndefined();
  });
});
