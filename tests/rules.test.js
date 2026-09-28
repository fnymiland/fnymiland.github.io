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
    expect(build('haus', 3, 3)).toBe(true);
    expect(T().pop).toBe(4);
    expect(game('state.money')).toBe(260);
  });

  it('Holzfäller nur im Wald', () => {
    build('haus', 3, 3);
    expect(game("placeError('holz', 4, 3)")).toBe('Nur im Wald');
    game("state.terra.set('4,3', 'forest')");
    expect(build('holz', 4, 3)).toBe(true);
    game('recalc()');
    expect(T().prod.holz).toBeCloseTo(0.3);
  });

  it('Betriebe brauchen Einwohner', () => {
    game("state.terra.set('4,3', 'forest')");
    expect(game("placeError('holz', 4, 3)")).toMatch(/Zu wenig Einwohner/);
  });

  it('nicht auf fremdem Grundstück', () => {
    expect(game("placeError('haus', 20, 20)")).toBe('Das ist nicht dein Grundstück');
  });
});

describe('Rohstoffe', () => {
  it('Sägewerk macht aus 2 Holz 1 Brett, nur solange Holz da ist', () => {
    build('haus', 3, 3);
    expect(build('saege', 4, 3)).toBe(true);
    game('recalc()');
    game('state.res.holz = 2');
    game('produce(100)');
    expect(game('state.res.holz')).toBeCloseTo(0);
    expect(game('state.res.bretter')).toBeCloseTo(1);
  });

  it('Material wird geprüft und abgezogen', () => {
    game("state.money = 1000");
    expect(game("smallError('bank', 3, 3, 3)")).toBe('Zu wenig Bretter (2 🪚 nötig)');
    game('state.res.bretter = 5');
    expect(game("buildSmall('bank', 3, 3, 3)")).toBe(true);
    expect(game('state.res.bretter')).toBe(3);
  });
});

describe('Kleine Dekos', () => {
  it('bis zu 4 pro Feld, eine Ecke nur einmal', () => {
    game('state.money = 1000');
    for (let i = 0; i < 4; i++) expect(game(`buildSmall('blumentopf', 3, 3, ${i})`)).toBe(true);
    expect(game("smallError('blumentopf', 3, 3, 2)")).toBe('Diese Ecke ist schon belegt');
  });
});

describe('Viertel und Wege', () => {
  it('Gebäude an einem gemeinsamen Gehweg bilden ein Viertel, ab 3 gibt es +10 %', () => {
    game('state.money = 1000');
    build('haus', 3, 3); build('haus', 4, 3); build('haus', 5, 3);
    game("for (const x of [3, 4, 5]) state.walks.set(edgeKey(x, 3, 0, 1), 'kies')");
    game('recalc()');
    const s = game("T.st.get('4,3')");
    expect(s.n).toBe(3);
    expect(s.bonus).toBeCloseTo(0.1);
  });

  it('Betriebe weit weg vom nächsten Haus laufen nur halb', () => {
    game('state.money = 5000');
    build('haus', 3, 3);
    game("state.owned.add('1,0'); state.terra.set('10,3', 'forest')");
    expect(build('holz', 10, 3)).toBe(true);
    game('recalc()');
    expect(game("T.st.get('10,3').how")).toBe('weit');
    expect(game("T.st.get('10,3').prod.holz")).toBeCloseTo(0.15);
  });
});

describe('Speichern und Laden', () => {
  it('ein gespeicherter Stand kommt unverändert zurück', () => {
    game('state.money = 1000; state.res.holz = 7');
    build('haus', 3, 3);
    game("state.walks.set(edgeKey(3, 3, 0, 1), 'platten')");
    game("buildSmall('blumentopf', 3, 3, 1)");
    game('save()');
    const loaded = game('load()');
    expect(loaded.res.holz).toBe(7);
    expect(loaded.tiles.get('3,3').b).toBe('haus');
    expect(loaded.walks.get('3,3,s')).toBe('platten');
    expect(loaded.decos.get('3,3')[1].b).toBe('blumentopf');
  });

  it('alte Stände: Kraftwerke werden erstattet, Gehwege bekommen einen Stil', () => {
    game('save()');
    const raw = JSON.parse(localStorage.getItem('kachelhausen_v3'));
    raw.money = 0;
    raw.tiles.push(['3,3', { b: 'kraftwerk', lvl: 1 }]);
    raw.walks = ['3,3,s'];
    raw.techs = ['wind'];
    raw.science = 0;
    localStorage.setItem('kachelhausen_v3', JSON.stringify(raw));
    const loaded = game('load()');
    expect(loaded.money).toBe(500);
    expect(loaded.science).toBe(30);
    expect(loaded.tiles.has('3,3')).toBe(false);
    expect(loaded.walks.get('3,3,s')).toBe('platten');
  });
});
