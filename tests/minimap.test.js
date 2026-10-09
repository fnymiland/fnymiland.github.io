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
    game("mini.cv.getBoundingClientRect = () => ({ left: 100, top: 50, width: mini.base.width, height: mini.base.height }); cam.x = 0; cam.y = -9999");
    game("(() => { const p = iso(3, 3), [ix, iy] = miniOf(p.x, p.y); mini.cv.dispatchEvent(new window.MouseEvent('pointerdown', { clientX: 100 + ix, clientY: 50 + iy, bubbles: true })); })()");
    const d = game("(() => { const p = iso(3, 3); return [cam.x - p.x, cam.y - p.y]; })()");
    expect(Math.abs(d[0]) + Math.abs(d[1])).toBeLessThan(1);
  });

  it('einklappen und wieder zeigen – je Gerät gemerkt', () => {
    game('miniTick(1e6)');
    game("document.querySelector('#minimap .mini-x').click()");
    expect(game("document.getElementById('minimap').classList.contains('zu')")).toBe(true);
    expect(game('localStorage.getItem(MINI_KEY)')).toBe('zu');
    expect(game("document.querySelector('#minimap .mini-open').getAttribute('aria-label')")).toMatch(/zeigen/);
    game("document.querySelector('#minimap .mini-open').click()");
    expect(game("document.getElementById('minimap').classList.contains('zu')")).toBe(false);
    expect(game('localStorage.getItem(MINI_KEY)')).toBe('auf');
  });
});
