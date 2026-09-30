const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  // freie Wiese abseits vom Rathaus, viel Geld, alles freigeschaltet
  game("state.owned.add('1,1'); state.money = 99999; state.stars = 5; for (const r of Object.keys(RES)) state.res[r] = 999");
  game("for (const t of TECHS) state.techs.add(t.id)");
  game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 6; y <= 11; y++) for (let x = 6; x <= 11; x++) state.terra.set(x + ',' + y, 'grass')");
  game('buildRot = 0');
  game('recalc()');
});
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);

describe('Gebäude über mehrere Felder', () => {
  it('ein großer Brunnen belegt 3×3 Felder, dort kann nichts anderes hin', () => {
    build('haus', 6, 6); build('haus', 6, 7);
    expect(build('brunnen_xl', 8, 8)).toBe(true);
    game('recalc()');
    for (const k of ['8,8', '9,8', '8,9', '9,9', '10,10']) expect(game(`anchorAt(${k})`)).toBe('8,8');
    expect(game("placeError('feld', 9, 9)")).toBe('Hier steht schon etwas');
    expect(game("placeError('brunnen_xl', 7, 7)")).toBe('Hier ist nicht genug Platz');
  });

  it('lange Gebäude: Tür an der Längsseite, gedreht liegen sie quer', () => {
    build('haus', 6, 6); build('haus', 6, 7);
    expect(build('saege', 8, 8)).toBe(true);             // Richtung 0: Tür nach +x, also 1 tief und 2 breit
    game('recalc()');
    expect(game("anchorAt(8, 9)")).toBe('8,8');
    expect(game("anchorAt(9, 8)")).toBe(null);
    game('buildRot = 1');
    expect(build('saege', 10, 8)).toBe(true);
    game('recalc()');
    expect(game("anchorAt(11, 8)")).toBe('10,8');
  });

  it('Nachbarn zählen rund um die ganze Grundfläche – jedes Gebäude nur einmal', () => {
    build('haus', 6, 6); build('haus', 6, 7); build('haus', 6, 8);
    game('buildRot = 1');
    expect(build('baecker', 8, 8)).toBe(true);          // quer: belegt 8,8 und 9,8
    build('muehle', 10, 8);                               // rechts neben dem zweiten Feld
    build('muehle', 8, 9);                                // vor dem ersten Feld
    game('recalc()');
    expect(game("countNear(8, 8, 1, b => b === 'muehle')")).toBe(2);
    expect(game("countNear(10, 8, 1, b => b === 'baecker')")).toBe(1);
  });

  it('Abreißen über irgendein Feld entfernt das ganze Gebäude', () => {
    build('haus', 6, 6); build('haus', 6, 7);
    build('brunnen_xl', 8, 8);
    game('recalc()');
    game('demolish(9, 9)');
    expect(game("state.tiles.has('8,8')")).toBe(false);
    expect(game("anchorAt(9, 9)")).toBe(null);
  });

  it('kleine Dekos gehen nicht auf große Gebäude', () => {
    build('haus', 6, 6); build('haus', 6, 7);
    build('brunnen_xl', 8, 8);
    game('recalc()');
    expect(game("smallError('blumentopf', 9, 9, 0)")).toBe('Hier ist kein Platz für Deko');
  });
});

describe('Verschieben', () => {
  it('aufnehmen und woanders ablegen – kostenlos, Stufe bleibt', () => {
    build('haus', 8, 8);
    game("state.tiles.get('8,8').lvl = 3");
    const money = game('state.money');
    game("tool = 'verschieben'");
    game('pickUp(8, 8, 0)');
    expect(game("state.tiles.has('8,8')")).toBe(false);
    game('dropAt(10, 10, 0)');
    expect(game("state.tiles.get('10,10').lvl")).toBe(3);
    expect(game('state.money')).toBe(money);
  });

  it('abbrechen legt es zurück; beim Speichern mitten im Tragen geht nichts verloren', () => {
    build('haus', 6, 6); build('haus', 6, 7);
    build('brunnen_xl', 8, 8);
    game('pickUp(9, 9, 0)');
    const saved = game('serialize()');
    expect(saved.tiles.some(([k, t]) => k === '8,8' && t.b === 'brunnen_xl')).toBe(true);
    game('cancelMove()');
    expect(game("state.tiles.get('8,8').b")).toBe('brunnen_xl');
  });

  it('ablegen nur, wo Platz ist', () => {
    build('haus', 8, 8); build('haus', 9, 8);
    game('pickUp(8, 8, 0)');
    game('dropAt(9, 8, 0)');
    expect(game('moving')).not.toBe(null);
    game('cancelMove()');
  });

  it('kleine Dekos wandern von Ecke zu Ecke', () => {
    game('state.res.bretter = 5');
    game("buildSmall('bank', 8, 8, 0)");
    game('pickUp(8, 8, 0)');
    game('dropAt(9, 9, 3)');
    expect(game("state.decos.has('8,8')")).toBe(false);
    expect(game("state.decos.get('9,9')[3].b")).toBe('bank');
  });
});

describe('Umgestalten kostet nichts', () => {
  it('Deko gibt beim Entfernen Geld und Material voll zurück', () => {
    game('state.res.bretter = 2');
    const money = game('state.money');
    game("buildSmall('bank', 8, 8, 0)");
    game('removeSmall(8, 8, 0)');
    expect(game('state.money')).toBe(money);
    expect(game('state.res.bretter')).toBe(2);
  });
});

describe('Alte Spielstände', () => {
  it('ein zu klein gespeichertes 3×3-Ding bekommt seine Grundfläche oder wird erstattet', () => {
    game("state.tiles.set('8,8', { b: 'brunnen_xl', lvl: 1 })");
    game("for (const k of ['9,8', '8,9', '9,9', '7,8', '8,7', '7,7', '7,9', '9,7']) state.tiles.set(k, { b: 'feld', lvl: 1 })");
    const money = game('state.money');
    const removed = game('fitFootprints()');
    expect(removed).toEqual([game('ITEMS.brunnen_xl.name')]);
    expect(game('state.money')).toBe(money + game('ITEMS.brunnen_xl.cost'));
    expect(game("state.tiles.has('8,8')")).toBe(false);
  });

  it('passt er daneben, rückt er einfach', () => {
    game("state.tiles.set('8,8', { b: 'brunnen_xl', lvl: 1 })");
    game("state.tiles.set('9,8', { b: 'feld', lvl: 1 })");
    expect(game('fitFootprints()')).toEqual([]);
    expect(game("state.tiles.get('9,8').b")).toBe('feld');
    expect(game("[...state.tiles.values()].filter(t => t.b === 'brunnen_xl').length")).toBe(1);
  });
});

describe('Verschieben aus dem Infofenster', () => {
  it('der Knopf nimmt das Rathaus auf', () => {
    game("openTownHall('town')");
    game("$('h-move').click()");
    expect(game('movingType()')).toBe('rathaus');
    expect(game('tool')).toBe('verschieben');
    game("setTool('look')");
    expect(game("state.tiles.get('1,1').b")).toBe('rathaus');
  });
  it('auch Häuser und Deko', () => {
    build('haus', 8, 8);
    game('openInfo(8, 8)'); game("$('p-move').click()");
    expect(game('movingType()')).toBe('haus');
    game("setTool('look')");
    game("state.res.bretter = 5; buildSmall('bank', 9, 9, 2)");
    game('openDecoInfo(9, 9, 2)'); game("$('p-move').click()");
    expect(game('movingType()')).toBe('bank');
    game("setTool('look')");
  });
});
