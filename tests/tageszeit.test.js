const { loadGame, game } = require('./helpers/load-game');

// Block 101: gemeinsame Spieluhr – 24 Minuten je Tag aus der echten Zeit, Anzeige oben und im Rathaus, Sternschnuppen nachts
beforeAll(() => loadGame());
beforeEach(() => game("startNew(); closeModal(); state.tutorial = -1"));
const at = h => `(${h} * 60e3)`;                                                // echte ms, die Spielstunde h ergeben

describe('Spieluhr (Block 101)', () => {
  it('aus der echten Zeit: alle Geräte gleich, läuft weiter, wenn die App zu ist', () => {
    const t = 1791273000000;
    expect(game(`gameHour(${t})`)).toBe(game(`gameHour(${t})`));
    expect(game(`gameHour(${t} + 60e3)`) - game(`gameHour(${t})`)).toBeCloseTo(1, 5);   // eine Minute später = eine Stunde
    expect(game(`gameHour(${t} + 24 * 60e3)`)).toBeCloseTo(game(`gameHour(${t})`), 5);   // nach 24 Minuten wieder dieselbe Zeit
  });
  it('Tag 6–19, Dämmerung 19–21, Nacht 21–5, Morgengrauen 5–6', () => {
    expect(game(`nightAt(${at(12)})`)).toBe(0);
    expect(game(`nightAt(${at(20)})`)).toBeGreaterThan(0);
    expect(game(`nightAt(${at(20)})`)).toBeLessThan(0.45);
    expect(game(`nightAt(${at(23)})`)).toBe(0.45);
    expect(game(`nightAt(${at(3)})`)).toBe(0.45);
    expect(game(`nightAt(${at(5.5)})`)).toBeGreaterThan(0);
  });
  it('Anzeige: Symbol, Uhrzeit in 10-Minuten-Schritten, wann es umschlägt', () => {
    expect(game(`timeOfDay(${at(22.25)})`)).toMatchObject({ icon: '🌙', text: '22:10', name: 'Nacht', dark: true, left: 7 });
    expect(game(`timeOfDay(${at(13)})`)).toMatchObject({ icon: '☀️', text: '13:00', dark: false, left: 8 });
    expect(game(`timeOfDay(${at(19.5)}).icon`)).toBe('🌅');
  });
  it('oben am Ortsnamen und im Rathaus steht die Zeit', () => {
    game('updateHud()');
    expect(game("document.getElementById('town-time').textContent")).toMatch(/^(☀️|🌅|🌙|🌄) \d\d:\d0$/);
    game("openTownHall('overview')");
    expect(game("document.querySelector('#modal-card .tod-box').textContent")).toMatch(/Uhr ·.*in \d+ Minuten? (wird es hell|ist es Nacht|ist es Tag)/s);
  });
  it('die Rathausuhr zeigt die Spielzeit; Uhren an Gebäuden auch', () => {
    const d = game(`(() => { const c = clockNow(${at(15.5)}); return [c.getHours(), c.getMinutes()]; })()`);
    expect(d).toEqual([15, 30]);
  });
  it('Sternschnuppen kommen nachts wirklich (vorher nie: Schwelle 0,5 über der dunkelsten Nacht)', () => {
    game(`state.tiles.set('6,6', { b: 'haus', lvl: 1 }); T.wonders = { ...(T.wonders || {}), sternwarte: true }; fallenStars.length = 0;
      globalThis.__n = nightAt; nightAt = () => NIGHT_MAX; globalThis.__r = Math.random; Math.random = () => 0;
      try { starTick(performance.now()) } finally { nightAt = globalThis.__n; Math.random = globalThis.__r; }`);
    expect(game('fallenStars.length')).toBeGreaterThan(0);
    game(`fallenStars.length = 0; globalThis.__n = nightAt; nightAt = () => 0.3; globalThis.__r = Math.random; Math.random = () => 0;
      try { starTick(performance.now()) } finally { nightAt = globalThis.__n; Math.random = globalThis.__r; }`);
    expect(game('fallenStars.length')).toBe(0);                                          // Dämmerung: noch nicht
  });
  it('Grenzen: Morgengrauen sagt „ist es Tag“, nie „in 0 Minuten“ (Prüfung vor dem Push)', () => {
    expect(game(`timeOfDay(${at(5.5)})`)).toMatchObject({ icon: '🌄', dawn: true, dark: false, left: 1 });
    expect(game(`timeOfDay(${at(5)})`)).toMatchObject({ dawn: true, left: 1 });
    expect(game(`timeOfDay(${at(4.99)}).left`)).toBe(1);
  });
  it('Sternschnuppen: beim Zuschauen oder Besuch weder neue noch einsammeln', () => {
    game(`state.tiles.set('6,6', { b: 'haus', lvl: 1 }); T.wonders = { ...(T.wonders || {}), sternwarte: true }; fallenStars.length = 0;
      cloudLeadInfo = { dev: 'ipad', name: 'iPad', at: Date.now() }; cloudUser = { uid: 'u1' };
      globalThis.__n = nightAt; nightAt = () => NIGHT_MAX; globalThis.__r = Math.random; Math.random = () => 0;
      try { starTick(performance.now()) } finally { nightAt = globalThis.__n; Math.random = globalThis.__r; }`);
    expect(game('fallenStars.length')).toBe(0);
    game('cloudLeadInfo = null; cloudUser = null');
  });
  it('Sternschnuppe stanzt nachts kein Loch (sie wird nach der Nacht gezeichnet; glowQuad/destination-out wären ein Loch)', () => {
    const r = game(`(() => {
      const n0 = night, gq = glowQuad, f0 = g.fill; let calls = 0, fills = 0;
      night = NIGHT_MAX; glowQuad = () => { calls++; }; g.fill = function (...a) { fills++; return f0.apply(this, a); };
      try { const m = toTile(W / 2, H / 2); drawFallenStar({ x: m.x, y: m.y, t0: performance.now() - 2000 }, 1, performance.now()); }
      finally { glowQuad = gq; night = n0; g.fill = f0; }
      return [calls, g.globalCompositeOperation, fills]; })()`);
    expect(r[2]).toBeGreaterThan(0);                                               // der Stern wurde wirklich gezeichnet
    expect(r[0]).toBe(0);
    expect(r[1]).toBe('source-over');                                              // nichts bleibt auf „lighter“ hängen
  });
});
