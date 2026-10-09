const { loadGame, game } = require('./helpers/load-game');

// Block 135: Minimap am PC – unten rechts, Klicken springt hin, einklappbar, nur mit Maus und breitem Fenster
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setSheet(false)");
  game("window.matchMedia = () => ({ matches: true }); window.innerWidth = 1280; PHONE = false; miniOpen = true; if (mini) { mini.sig = ''; mini.at = -1e9; mini.view = ''; mini.wait = false; }");
});

describe('Minimap (Block 135)', () => {
  it('nur am PC: Maus und mindestens 900 px breit – nicht auf dem Handy, nicht bei offenem Fenster oder Katalog', () => {
    expect(game('miniWanted()')).toBe(true);
    game('miniTick(1e6)');
    expect(game("!!document.getElementById('minimap') && !document.getElementById('minimap').hidden")).toBe(true);
    game('PHONE = true; miniTick(1e6)');
    expect(game("document.getElementById('minimap').hidden")).toBe(true);
    game('PHONE = false; window.innerWidth = 800; miniTick(1e6)');
    expect(game("document.getElementById('minimap').hidden")).toBe(true);
    game('window.innerWidth = 1280; window.matchMedia = () => ({ matches: false }); miniTick(1e6)');   // iPad: kein Zeiger
    expect(game("document.getElementById('minimap').hidden")).toBe(true);
    game("window.matchMedia = () => ({ matches: true }); openModal('<p>x</p>'); miniTick(1e6)");
    expect(game("document.getElementById('minimap').hidden")).toBe(true);
    game('closeModal(); setSheet(true); miniTick(1e6)');
    expect(game("document.getElementById('minimap').hidden")).toBe(true);
    game('setSheet(false); miniTick(1e6)');
    expect(game("document.getElementById('minimap').hidden")).toBe(false);
  });

  it('Farben: Meer, Weg, Haus; fremdes Land blasser', () => {
    game("const c = ISLAND; for (let x = 0; x <= 4; x++) state.terra.set(x + ',2', 'grass'); state.tiles.set('1,2', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('2,2', { b: 'haus', lvl: 1 }); recalc()");
    expect(game("miniColor(400, 400)")).toBe(game('MINI_SEA'));
    expect(game("miniColor(1, 2)")).toBe('#ecdcb8');
    expect(game("miniColor(2, 2)")).toBe('#e07a5f');
    const far = game("(() => { for (const i of ISLES) { const x = Math.round(i.cx), y = Math.round(i.cy); if (!ownedTile(x, y) && terrainAt(x, y) === 'grass') return [x, y]; } })()");
    expect(game(`miniColor(${far[0]}, ${far[1]})`)).not.toBe('#96d56f');               // nicht eigen: aufgehellt
  });

  it('Karte und Spiel rechnen hin und zurück gleich; Klicken setzt die Kamera dorthin', () => {
    game('miniTick(1e6); miniPaint()');
    const back = game("(() => { const p = iso(5, -3), [ix, iy] = miniOf(p.x, p.y), [X, Y] = miniTo(ix, iy); return [X - p.x, Y - p.y]; })()");
    expect(Math.abs(back[0]) + Math.abs(back[1])).toBeLessThan(1e-6);
    // Klick auf die Kartenstelle der Heimatinsel (Kärtchen in jsdom ohne Layout: Größe vorgeben)
    game("mini.cv.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 200 }); cam.x = 0; cam.y = -9999");
    game(`(() => { const p = iso(3, 3), [ix, iy] = miniOf(p.x, p.y), k = 100 / mini.rmax;            // rund: Mitte des Lands in der Kreismitte
      mini.cv.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: 200 + (ix - mini.mc[0]) * k, clientY: 150 + (iy - mini.mc[1]) * k, bubbles: true })); })()`);
    const d = game("(() => { const p = iso(3, 3); return [cam.x - p.x, cam.y - p.y]; })()");
    expect(Math.abs(d[0]) + Math.abs(d[1])).toBeLessThan(1);
  });

  it('rund: alles Land liegt im Kreis', () => {
    game('miniTick(1e6); miniPaint()');
    const out = game(`(() => { let n = 0; for (const [k] of state.tiles) { const [x, y] = keyXY(k), p = iso(x, y), [ix, iy] = miniOf(p.x, p.y);
      if (Math.hypot(ix - mini.mc[0], iy - mini.mc[1]) > mini.rmax) n++; } return n; })()`);
    expect(out).toBe(0);
  });

  it('im Menü ausschalten und wieder einschalten – kein Knopf an der Karte, je Gerät gemerkt (Nutzer, 09.10.2026)', () => {
    game('miniTick(1e6)');
    expect(game("document.querySelectorAll('#minimap button').length")).toBe(0);
    game('showSettings()');
    expect(game("document.getElementById('m-mini').textContent")).toMatch(/Minimap ausschalten/);
    game("document.getElementById('m-mini').click(); miniTick(1e6)");
    expect(game('localStorage.getItem(MINI_KEY)')).toBe('zu');
    expect(game("document.getElementById('m-mini').textContent")).toMatch(/Minimap einschalten/);
    game('closeModal(); miniTick(1e6)');
    expect(game("document.getElementById('minimap').hidden")).toBe(true);           // aus: bleibt weg
    game("showSettings(); document.getElementById('m-mini').click(); closeModal(); miniTick(1e6)");
    expect(game('localStorage.getItem(MINI_KEY)')).toBe('auf');
    expect(game("document.getElementById('minimap').hidden")).toBe(false);
    game('PHONE = true; showSettings()');
    expect(game("!!document.getElementById('m-mini')")).toBe(false);                 // Handy/iPad: gibt es nicht, also kein Schalter
    game('closeModal(); PHONE = false');
  });
});
