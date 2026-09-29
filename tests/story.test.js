const { loadGame, game } = require('./helpers/load-game');

beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()');
  game('closeModal()');
  game('state.money = 99999');
});
const build = (b, x, y) => game(`build(${JSON.stringify(b)}, ${x}, ${y}, true)`);
describe('Laternen und Restaurieren', () => {
  it('neues Spiel: alles verfallen, 0 Laternen, Weiler', () => {
    expect(game('lanternCount()')).toBe(0);
    expect(game('townTitle()')).toBe('Weiler');
  });

  it('restaurieren braucht die erschlossene Insel und Material', () => {
    build('haus', 4, 4);
    expect(game("restoreInfo('baum').err")).toBe('Erschließe zuerst die Waldinsel');
    game("state.islands.add('wald'); ownIsland('wald'); recalc()");
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
    game("state.islands.add('ruine'); ownIsland('ruine'); recalc()");
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

describe('Themen-Inseln', () => {
  it('neues Spiel: die Heimatinsel gehört einem ganz, jede Sehenswürdigkeit (3×3) steht mitten auf ihrer Insel', () => {
    expect(game("state.islands.has('home') && state.islands.size")).toBe(1);
    expect(game("isleChunks('home').every(ck => state.owned.has(ck))")).toBe(true);
    for (const i of game('ISLES')) {
      const [x, y] = game(`lmTile('${i.lm}')`);
      expect(game(`islandAt(${x + 1}, ${y + 1})`)).toBe(i.id);
      expect(game(`footprint('lm', ${x}, ${y}, 0).every(([a, b]) => anchorAt(a, b) === '${x},${y}' && terrainAt(a, b) === 'grass')`)).toBe(true);
      expect(game(`ownedTile(${x}, ${y})`)).toBe(false);
    }
    expect(game('ISLES.every((a, i) => ISLES.every((b, j) => i === j || Math.hypot(a.cx - b.cx, a.cy - b.cy) > 2 * ISLE_R * 1.5))')).toBe(true);
  });

  it('Inseln werden der Reihe nach erschlossen – mit Einwohnern und Talern', () => {
    expect(game('nextIsle().id')).toBe('wald');
    expect(game("unlockIsland('obst')")).toBe(false);                 // erst die Waldinsel
    game('state.money = 1000; recalc()');
    expect(game("unlockIsland('wald')")).toBe(false);                 // noch zu wenig Einwohner
    build('haus', 4, 4); build('haus', 6, 4);
    expect(game('T.pop')).toBeGreaterThanOrEqual(8);
    expect(game("unlockIsland('wald')")).toBe(true);
    expect(game('state.money')).toBe(1000 - 80 - 150);
    expect(game("ownedTile(...lmTile('baum'))")).toBe(true);
    expect(game('nextIsle().id')).toBe('obst');
  });

  it('die Kristallinsel braucht viel Weisheit (Ideen)', () => {
    expect(game("isleNeeds(ISLE_BY_ID.kristall).some(c => c.text.startsWith('💡') && !c.ok)")).toBe(true);
  });

  it('auf gesperrten Inseln kann man nichts bauen', () => {
    const [x, y] = game("isleAnchor(ISLE_BY_ID.obst)");
    expect(game(`placeError('haus', ${x + 4}, ${y})`)).toBe('Das ist nicht dein Grundstück');
  });

  it('alte Stände: Sehenswürdigkeiten ziehen samt Laternen um, gekaufte Grundstücke gibt es zurück', () => {
    const d = game('serialize()');
    d.v = 6;
    delete d.islands;
    d.tiles = d.tiles.filter(([, t]) => t.b !== 'lm');
    d.tiles.push(['12,8', { b: 'lm', lm: 'ruine', lvl: 1 }], ['-6,6', { b: 'lm', lm: 'baum', lvl: 1 }]);
    d.restore = { ruine: 2 };
    d.owned = ['0,0', '1,0', '1,1', '2,1'];                               // 3 Grundstücke dazugekauft
    const money = d.money;
    game(`state = parseSave(${JSON.stringify(d)}); globalThis.__m = migrateIslands(); recalc()`);
    expect(game("[...state.tiles.values()].filter(t => t.b === 'lm').length")).toBe(7);
    expect(game("islandAt(...lmTile('ruine'))")).toBe('ruine');
    expect(game("state.islands.has('ruine')")).toBe(true);           // restauriert → schon erschlossen
    expect(game("state.islands.has('wald')")).toBe(false);
    expect(game('state.restore.ruine')).toBe(2);
    expect(game('state.money')).toBe(money + 100 + 130 + 160);
    expect(game("isleChunks('home').every(ck => state.owned.has(ck))")).toBe(true);
    // noch einmal laden: nichts passiert mehr
    game('state = parseSave(serialize()); migrateIslands()');
    expect(game('state.money')).toBe(money + 390);
  });
});

describe('Preise für ein langes Spiel (Ziel: Laternenfest nach etwa 10 Stunden)', () => {
  it('Laternen werden von Insel zu Insel teurer, das Material wächst mit', () => {
    game('startNew()');
    expect(game("restoreInfo('baum').money")).toBe(50);
    expect(game("LM_PRICE.kristall[2]")).toBe(25000000);
    game('state.restore.kristall = 2');
    const info = game("restoreInfo('kristall')");
    expect(info.money).toBe(25000000);
    expect(info.mat.metall).toBe(15 * 8);
  });

  it('Inseln: Waldinsel 150 … Kristallinsel 5 Mio.; Leuchtturm 15 Mio.', () => {
    expect(game("ISLES.map(i => i.need.money)")).toEqual([150, 1500, 10000, 60000, 300000, 1500000, 5000000]);
    expect(game('ITEMS.leuchtturm.cost')).toBe(15000000);
  });

  it('Hausausbau kostet Taler – je Stufe mehr', () => {
    expect(game('HOUSE_STAGES.slice(1).map(h => h.money)')).toEqual([100, 600, 3000, 20000, 100000]);
    game("startNew(); closeModal(); state.money = 50; state.res.bretter = 10; state.tiles.set('8,8', { b: 'haus', lvl: 1 }); globalThis.__wm = wishMet; wishMet = () => true; recalc()");
    game('houseUpgrade(8, 8, true)');
    expect(game("state.tiles.get('8,8').lvl")).toBe(1);                         // 100 Taler fehlen
    game('state.money = 150; houseUpgrade(8, 8, true); wishMet = globalThis.__wm');
    expect(game("state.tiles.get('8,8').lvl")).toBe(2);
    expect(game('state.money')).toBe(50);
  });
});
