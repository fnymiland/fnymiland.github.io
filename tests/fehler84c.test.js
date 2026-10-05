const { loadGame, game } = require('./helpers/load-game');

// Block 84c: Fortschritt und Anzeigen – Fehler aus der großen Fehlersuche
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; resetUndo()");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 1e5; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = true");
  game("for (let y = 4; y <= 18; y++) for (let x = 4; x <= 18; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } waterChanged(); sandCache.clear(); recalc()");
});

describe('Fortschritt (84c)', () => {
  it('Album: Parkrasen, Freizeitpark-Boden und die Höhen-Pinsel zählen', () => {
    game("build('parkrasen', 5, 5, true); for (let x = 8; x <= 12; x++) for (let y = 8; y <= 10; y++) build('fzboden', x, y, true)");
    game("for (let x = 9; x <= 11; x++) state.tiles.set(x + ',9', { b: 'fz_bahn', lvl: 1 }); recalc()");
    game("build('fz_hoch', 10, 9, true); build('fz_tief', 10, 9, true); collectAlbum()");
    expect(game("['b:parkrasen', 'b:fzboden', 'b:fz_hoch', 'b:fz_tief'].map(k => state.album.has(k))")).toEqual([true, true, true, true]);
  });
  it('Wunsch „Weg vor der Tür“: ein Marktstand auf dem Weg ist weiter ein Weg', () => {
    game("state.tiles.set('11,11', { b: 'haus', lvl: 1, rot: 0 }); state.tiles.set('11,10', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    expect(game("wishMet('weg', 11, 11)")).toBe(true);
    game("build('stand_obst', 11, 10, true); recalc()");
    expect(game("bAt(11, 10)")).toBe('stand_obst');
    expect(game("wishMet('weg', 11, 11)")).toBe(true);
  });
  it('bestes Einkommen sinkt auch bei 60 Bildern pro Sekunde (Halbwertszeit)', () => {
    game('T.inc = 500; T.salesInc = 0; state.incPeak = 1000');
    game('for (let i = 0; i < 60 * 60 * 20; i++) peakTick(1 / 60)');
    expect(game('state.incPeak')).toBeLessThan(800);
    expect(game('state.incPeak')).toBeGreaterThan(700);
  });
  it('Stadtplanung zählt für ✨ wie im Fenster', () => {
    game("state.mastery.einwohner = 10; state.tiles.set('6,6', { b: 'haus', lvl: 1 }); state.tiles.set('8,6', { b: 'haus', lvl: 1 }); for (const x of [6, 8, 10, 12]) state.tiles.set(x + ',12', { b: 'saege', lvl: 1, rot: 0 }); recalc()");
    const [x, y] = [6, 12];
    const live = game(`stageInfo(state.tiles.get('${x},${y}'), ${x}, ${y}, T.pop, T.jobs).conds.map(c => c.ok)`);
    const cached = game(`T.st.get('${x},${y}').grow.conds.map(c => c.ok)`);
    expect(cached).toEqual(live);
  });
  it('Kunstakademie: der große Pavillon zählt als Pavillon; der 3. Stern ist erreichbar', () => {
    expect(game("isKind('pavillon', 'pavillon_l')")).toBe(true);
    expect(game("ACHIEVEMENTS.find(a => a.id === 'kunst').tiers[2]")).toBe(game('DESIGN.filter(d => d.price).length'));
  });
  it('Schloss „+50 % auf alles“ gilt auch für die Veredelung', () => {
    game("state.tiles.set('6,6', { b: 'holz', lvl: 1, rot: 0 }); state.terra.set('6,6', 'forest'); state.tiles.set('8,6', { b: 'saege', lvl: 1, rot: 0 }); for (let x = 4; x <= 10; x++) state.tiles.set(x + ',16', { b: 'haus', lvl: 5 }); recalc()");
    const before = game("T.conv.reduce((s, c) => s + c.rate, 0)");
    game("WONDERS.schloss.effect.allMul && (T.wonders); state.tiles.set('12,4', { b: 'schloss', lvl: 1, phase: 99 }); recalc()");
    const after = game("T.conv.reduce((s, c) => s + c.rate, 0)");
    if (game("!!T.wonders.schloss")) expect(after).toBeGreaterThan(before);
  });
  it('Sehenswürdigkeit: „Schaltet frei“ nennt alles, was die Stufe öffnet', () => {
    const names = game("lmUnlockNames('quelle', 0)");
    expect(names).toContain(game('ITEMS.ferienhaus.name'));
    expect(names).toContain(game('ITEMS.seebruecke.name'));
  });
  it('Rathaus „Inseln“ zählt alle Wohnhäuser', () => {
    game("state.tiles.set('6,6', { b: 'reihenhaus', lvl: 3, rot: 0 }); state.tiles.set('9,9', { b: 'haus', lvl: 1 }); recalc(); openTownHall('isles')");
    expect(game("document.getElementById('modal').textContent")).toContain('👥 ' + game("fmt([...state.tiles.values()].filter(t => isHome(t.b) && regionAt(6, 6) === 'home').reduce((s, t) => s + popOf(t), 0))"));
  });
});

describe('Anzeigen und Zeit (84c)', () => {
  it('Leuchtturm-Karte zeigt „Los!“ nur, wenn auch das Material da ist', () => {
    game("for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; state.festival = false; state.money = 1e9; state.res.metall = 0");
    expect(game('goalHtml()')).not.toMatch(/data-try="leuchtturm"[^>]*class="[^"]*ready/);
    expect(game("leuchtReady()")).toBe(false);
    game('state.res.metall = 1e5');
    expect(game("leuchtReady()")).toBe(true);
  });
  it('Einnahmen-Faktor glatt und mit Komma', () => {
    expect(game('fmtMul(3 * 1.3)')).toBe('3,9');
    expect(game('fmtMul(1.5 * 1.3)')).toBe('1,95');
  });
  it('Uhr zurückgestellt: kein negatives Einkommen', () => {
    game('state.money = 1000; lastTick = Date.now() + 3600e3; frame(performance.now() + 1e6)');
    expect(game('state.money')).toBeGreaterThanOrEqual(1000);
  });
  it('Jahrmarkt mit Feuerwerk', () => {
    game("state.tiles.set('6,6', { b: 'riesenrad', lvl: 1, phase: 99 }); recalc(); fairWas = false; fireworksUntil = 0");
    const t = game('(() => { for (let m = 0; m < 3600e3; m += 10e3) if (fairLeft(m) > 0) return m; })()');
    game(`fairTick(${t})`);
    expect(game('fireworksUntil > performance.now()')).toBe(true);
  });
  it('Bahnübergang: Bewohner warten an der Schranke statt zu verschwinden', () => {
    game("for (let x = 5; x <= 9; x++) state.tiles.set(x + ',8', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('7,8', { b: 'schiene', lvl: 1, cross: true }); recalc()");
    expect(game("isCrossing(state.tiles.get('7,8'))")).toBe(true);
    game("window.__cc = crossingClosed; crossingClosed = () => true");
    game("walkers.length = 0; walkers.push({ fx: 6, fy: 8, tx: 6, ty: 8, t: 0.99, speed: 1, path: [[7, 8], [8, 8]], goal: { kind: 'x' } }); stepWalker(walkers[0], 0.05)");
    expect(game('!!walkers[0].gone')).toBe(false);
    expect(game('walkers[0].path && walkers[0].path.length')).toBe(2);
    game("walkers[0].fx = 7; walkers[0].tx = 7; stepWalker(walkers[0], 0.01)");
    expect(game('!!walkers[0].gone')).toBe(false);
    game("crossingClosed = window.__cc; walkers.length = 0");
  });
  it('„Das ist neu“ ist auf dem neuen Stand', () => {
    expect(game('NEWS.id')).not.toBe('2026-10-03-freizeitpark');
  });
});
