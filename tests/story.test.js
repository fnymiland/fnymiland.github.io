const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game('state.money = 99999');
});
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);
// Weg vom Dorf bis direkt an eine Sehenswürdigkeit legen (Grundstücke dazukaufen)
function connect(type) {
  game(`(() => {
    const [lx, ly] = lmTile('${type}');
    let x = 2, y = 5;
    const steps = [];
    while (x !== lx) { x += Math.sign(lx - x); steps.push([x, y]); }
    while (y !== ly) { y += Math.sign(ly - y); steps.push([x, y]); }
    steps.pop();
    for (const [a, b] of steps) {
      state.owned.add(chunkOf(a, b));
      const k = a + ',' + b;
      if (!COVER.has(k)) { state.terra.set(k, 'grass'); state.tiles.set(k, { b: 'weg', lvl: 1, style: 'sand' }); }
      rebuildCover();
    }
    state.owned.add(chunkOf(lx, ly));
    recalc();
  })()`);
}

describe('Laternen und Restaurieren', () => {
  it('neues Spiel: alles verfallen, 0 Laternen, Weiler', () => {
    expect(game('lanternCount()')).toBe(0);
    expect(game('townTitle()')).toBe('Weiler');
  });

  it('der Uralte Baum steht gleich nebenan', () => {
    const [x, y] = game("lmTile('baum')");
    expect(Math.hypot(x - 2.5, y - 2.5)).toBeLessThan(10);
  });

  it('restaurieren braucht Grundstück, Weg zum Dorf und Material', () => {
    build('haus', 4, 4);
    expect(game("restoreInfo('baum').err")).toBe('Kauf zuerst das Grundstück');
    game("state.owned.add(chunkOf(...lmTile('baum'))); recalc()");
    expect(game("restoreInfo('baum').err")).toBe('Verbinde es per Weg mit dem Dorf');
    connect('baum');
    game('state.res.holz = 0; recalc()');
    expect(game("restoreInfo('baum').err")).toMatch(/Zu wenig Holz/);
    game('state.res.holz = 10');
    expect(game("restoreLandmark('baum')")).toBe(true);
    expect(game('lanternCount()')).toBe(1);
    expect(game('state.res.holz')).toBe(0);
    expect(game('state.diary')).toContain('baum:1');
  });

  it('Stufen schalten frei: Baum 1 → Sägewerk', () => {
    expect(game("available('saege')")).toBe(false);
    game('state.restore.baum = 1');
    expect(game("available('saege')")).toBe(true);
    expect(game("lockText('baecker')")).toBe('🔒 🍎 Wilder Obsthain → Obstwiese');
  });

  it('Sehenswürdigkeiten wirken erst restauriert', () => {
    build('haus', 4, 4);
    connect('ruine');
    expect(game('T.sci')).toBe(0);
    game('state.restore.ruine = 1; recalc()');
    expect(game('T.sci')).toBeGreaterThan(0);
  });

  it('Ortstitel wachsen mit den Laternen', () => {
    game("state.restore = { baum: 3 }");
    expect(game('townTitle()')).toBe('Dorf');
    game("state.restore = { baum: 3, obsthain: 3, klippe: 2 }");
    expect(game('townTitle()')).toBe('Städtchen');
  });

  it('der Leuchtturm kommt erst mit 21 Laternen und bringt das Laternenfest', () => {
    expect(game("available('leuchtturm')")).toBe(false);
    game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
    expect(game('lanternCount()')).toBe(21);
    expect(game("available('leuchtturm')")).toBe(true);
    game('festival()');
    expect(game('lanternCount()')).toBe(22);
    expect(game('townTitle()')).toBe('Inselperle');
    expect(game("state.diary[state.diary.length - 1]")).toBe('finale');
  });
});

describe('Tagebuch', () => {
  it('jede Seite hat Titel, Text und Bild', () => {
    game("state.diary.push('baum:1', 'quelle:2')");
    for (const id of game('state.diary')) {
      const p = game(`diaryPage(${JSON.stringify(id)})`);
      expect(p.title.length).toBeGreaterThan(3);
      expect(p.text.length).toBeGreaterThan(20);
    }
    game('openDiary(1)');
    expect(document.querySelector('#d-pic canvas')).not.toBe(null);
    expect(game('state.diarySeen')).toBe(2);
  });
});

describe('Einführung', () => {
  it('führt Schritt für Schritt und kann übersprungen werden', () => {
    expect(game('state.tutorial')).toBe(0);
    build('haus', 4, 4);
    game('storyTick()');
    expect(game('state.tutorial')).toBe(1);
    build('weg', 4, 5);
    game('recalc(); storyTick()');
    expect(game('state.tutorial')).toBe(2);
    game('state.tutorial = -1; storyTick()');
    expect(game('state.tutorial')).toBe(-1);
  });
});

describe('Alte Spielstände', () => {
  it('Sterne-Freischaltungen bleiben, Einführung wird übersprungen, eigene Wahrzeichen gelten als freigeschnitten', () => {
    game('save()');
    const raw = JSON.parse(localStorage.getItem('kachelhausen_v3'));
    delete raw.restore; delete raw.tutorial; delete raw.legacy; delete raw.diary;
    raw.stars = 2;
    const [lx, ly] = game("lmTile('baum')");
    raw.owned.push(Math.floor(lx / 6) + ',' + Math.floor(ly / 6));
    localStorage.setItem('kachelhausen_v3', JSON.stringify(raw));
    game('adoptState(load()); migrateLandmarks()');
    expect(game('state.tutorial')).toBe(-1);
    expect(game("available('baecker')")).toBe(true);
    expect(game("available('schule')")).toBe(true);
    expect(game('lmStage("baum")')).toBe(1);
  });
});

describe('Sehenswürdigkeiten sind 2×2 groß', () => {
  it('auf einer neuen Insel: ganz in einem Grundstück, nichts überlappt, der Baum steht bei 9,3', () => {
    const lms = game("[...state.tiles].filter(([, t]) => t.b === 'lm').map(([k]) => keyXY(k))");
    expect(lms.length).toBe(7);
    for (const [x, y] of lms) {
      const cks = game(`footprint('lm', ${x}, ${y}, 0).map(([a, b]) => chunkOf(a, b))`);
      expect(new Set(cks).size).toBe(1);
      expect(game(`footprint('lm', ${x}, ${y}, 0).every(([a, b]) => anchorAt(a, b) === '${x},${y}' && terrainAt(a, b) !== 'water')`)).toBe(true);
    }
    expect(game("lmTile('baum')")).toEqual([9, 3]);
  });

  it('alte Stände: am Grundstücksrand rückt sie ins Grundstück, Hindernisse werden erstattet', () => {
    const d = game('serialize()');
    d.v = 4;
    d.tiles = d.tiles.filter(([, t]) => t.lm !== 'ruine');
    d.tiles.push(['11,8', { b: 'lm', lm: 'ruine', lvl: 1 }], ['10,9', { b: 'feld', lvl: 1 }]);
    d.owned.push('1,1');
    const money = d.money;
    game(`state = parseSave(${JSON.stringify(d)}); fitFootprints(); delete state.fitLm; recalc()`);
    const [x, y] = game("lmTile('ruine')");
    expect(new Set(game(`footprint('lm', ${x}, ${y}, 0).map(([a, b]) => chunkOf(a, b))`))).toEqual(new Set(['1,1']));
    expect(game('state.money')).toBeGreaterThanOrEqual(money);
  });

  it('neue Stände: wer sie selbst über die Grenze geschoben hat, findet sie dort wieder', () => {
    game("state.owned.add('1,1'); state.restore.ruine = 1");
    game("for (const [k, t] of [...state.tiles]) if (t.lm === 'ruine') state.tiles.delete(k)");
    game("state.tiles.set('11,8', { b: 'lm', lm: 'ruine', lvl: 1 }); recalc()");
    game('state = parseSave(serialize()); fitFootprints(); delete state.fitLm; recalc()');
    expect(game("lmTile('ruine')")).toEqual([11, 8]);
  });
});
