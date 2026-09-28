const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
});

describe('Spielstand sichern und laden', () => {
  it('Export und Import ergeben dieselbe Insel', () => {
    game("state.money = 1234; state.res.bretter = 9; state.town.name = 'Möwenhausen'");
    game("build('haus', 4, 4, true)");
    const data = JSON.stringify(game('serialize()'));
    game('startNew()');
    game(`adoptState(parseSave(JSON.parse(${JSON.stringify(data)})))`);
    expect(game('state.money')).toBe(1234 - 40);
    expect(game('state.res.bretter')).toBe(9);
    expect(game('state.town.name')).toBe('Möwenhausen');
    expect(game("state.tiles.get('4,4').b")).toBe('haus');
  });

  it('fremde oder kaputte Dateien werden abgelehnt', () => {
    expect(() => game('parseSave({ hallo: 1 })')).toThrow(/kein Kachelhausen-Spielstand/);
    expect(() => game('parseSave(null)')).toThrow();
  });

  it('ein unlesbarer Stand wird nicht überschrieben, sondern als Kopie aufbewahrt', () => {
    localStorage.setItem('kachelhausen_v3', '{kaputt');
    expect(game('load()')).toBe(null);
    const backup = game('loadFailure');
    expect(backup).toMatch(/^kachelhausen_v3_defekt_/);
    expect(localStorage.getItem(backup)).toBe('{kaputt');
  });

  it('Import über das Menü: prüfen, nachfragen, ersetzen', async () => {
    game("state.town.name = 'Alt'");
    const other = game('serialize()');
    other.town = { ...other.town, name: 'Neu' };
    other.money = 777;
    const input = document.getElementById('import-file');
    const file = new File([JSON.stringify(other)], 'insel.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 20));
    expect(document.getElementById('modal-card').textContent).toMatch(/Spielstand laden\?/);
    expect(game('state.town.name')).toBe('Alt');            // erst nach Bestätigung
    document.getElementById('m-yes').click();
    expect(game('state.town.name')).toBe('Neu');
    expect(game('state.money')).toBe(777);
  });
});
