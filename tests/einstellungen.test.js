const { loadGame, game } = require('./helpers/load-game');

// ⚙️ Einstellungen (Nutzer, 09.10.2026): eigenes Fenster mit Schnellwahl und neuen Anzeige-/Leistungs-Schaltern, je Gerät
beforeAll(() => loadGame());
const DEF = "{ sharp: 'voll', day: 'uhr', shadows: true, people: 'viele', animals: true, icons: true, labels: true, sparkle: true }";
beforeEach(() => {
  game('localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game(`Object.assign(GFX, ${DEF}); setFpsMode('fluessig'); setStillFar(true); setSkyShow(true); resize()`);
  game("for (let y = 0; y <= 12; y++) for (let x = 0; x <= 12; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } recalc()");
  game('cam = state.cam; cam.z = 2; { const p = iso(6, 6); cam.x = p.x; cam.y = p.y; }');
});
// zählt, wie oft eine globale Zeichenfunktion während eines Bilds aufgerufen wird
const calls = (fn, setup = '', real = true) => game(`(() => { const o = ${fn}; let n = 0; ${fn} = (...a) => { n++; return ${real ? 'o(...a)' : 'undefined'}; }; try { ${setup}; render(1e6); render(1e6 + 17); } finally { ${fn} = o; } return n; })()`);

describe('Einstellungen', () => {
  it('Standard wie bisher: alles an, echte Uhr, volle Schärfe – das ist „Ausgewogen“', () => {
    expect(game('JSON.stringify(GFX)')).toBe(game(`JSON.stringify(${DEF})`));
    expect(game('gfxPresetOf()')).toBe('ausgewogen');
    game('showMenu(); document.getElementById(\'m-settings\').click()');
    expect(game("document.querySelector('[data-preset=\"ausgewogen\"]').classList.contains('on')")).toBe(true);
  });

  it('Schnellwahl „Schnell“ und „Schön“ setzen Leistung; einzeln ändern = keine Schnellwahl mehr; gemerkt je Gerät', () => {
    game("showSettings(); document.querySelector('[data-preset=\"schnell\"]').click()");
    expect(game('[GFX.sharp, GFX.people, GFX.animals, GFX.shadows, GFX.sparkle, fpsMode, skyShow].join()')).toBe('halb,wenige,false,false,false,sparsam,false');
    expect(game("document.querySelector('[data-preset=\"schnell\"]').classList.contains('on')")).toBe(true);
    expect(JSON.parse(game('localStorage.getItem(GFX_KEY)')).sharp).toBe('halb');
    expect(game('[GFX.day, GFX.icons, GFX.labels].join()')).toBe('uhr,true,true');               // Anzeige bleibt
    game("document.getElementById('m-animals').click()");
    expect(game('gfxPresetOf()')).toBe(null);
    expect(game("document.querySelectorAll('[data-preset].on').length")).toBe(0);
    game("document.querySelector('[data-preset=\"schoen\"]').click()");
    expect(game('[GFX.sharp, GFX.people, stillFar, fpsMode].join()')).toBe('voll,viele,false,fluessig');
  });

  it('Schärfe halb: halb so viele Bildpunkte je Richtung', () => {
    game('window.devicePixelRatio = 2; resize()');
    const full = game('canvas.width');
    game("setGfx('sharp', 'halb')");
    expect(game('DPR')).toBe(1);
    expect(game('canvas.width')).toBe(full / 2);
    game("setGfx('sharp', 'voll'); window.devicePixelRatio = 1; resize()");
  });

  it('Tageszeit „immer Tag“: nie dunkel – die Spieluhr läuft weiter', () => {
    game('window.__na = nightAt; nightAt = () => NIGHT_MAX; render(1e6)');
    expect(game('night')).toBe(game('NIGHT_MAX'));
    game("setGfx('day', 'tag'); render(1e6)");
    expect(game('night')).toBe(0);
    expect(game('nightAt()')).toBe(game('NIGHT_MAX'));                                  // Sternschnuppen & Co. rechnen weiter mit der Uhr
    game('nightAt = window.__na');
  });

  it('Schatten aus: nichts gezeichnet, Boden neu', () => {
    game("state.tiles.set('6,6', { b: 'haus', lvl: 1 }); recalc()");
    const on = game("(() => { const b = g.beginPath; let n = 0; g.beginPath = (...a) => { n++; return b.apply(g, a); }; try { drawShadows(() => true); } finally { g.beginPath = b; } return n; })()");
    const v = game('groundVersion');
    game("setGfx('shadows', false)");
    expect(game('groundVersion')).toBe(v + 1);
    const off = game("(() => { const b = g.beginPath; let n = 0; g.beginPath = (...a) => { n++; return b.apply(g, a); }; try { drawShadows(() => true); } finally { g.beginPath = b; } return n; })()");
    expect(on).toBeGreaterThan(0);
    expect(off).toBe(0);
  });

  it('Einwohner viele / wenige / keine – nur unsichtbar, gezählt wird weiter', () => {
    const put = "walkers.length = 0; for (let i = 0; i < 30; i++) walkers.push({ px: 5 + (i % 5) * 0.4, py: 5 + Math.floor(i / 5) * 0.4, fur: '#c98a5a', speed: 0, wait: 1, fewPick: (i % 3) / 3 + 0.01 })";
    const many = calls('drawWalker', put, false);
    game("setGfx('people', 'wenige')");
    const few = calls('drawWalker', put, false);
    game("setGfx('people', 'keine')");
    const none = calls('drawWalker', put, false);
    expect(many).toBe(60);                                                              // 30 Figuren, zwei Bilder
    expect(few).toBe(20);                                                               // jede dritte
    expect(none).toBe(0);
    expect(game('walkers.length')).toBe(30);                                            // alle noch da
    game('walkers.length = 0');
  });

  it('Tiere aus: keine Vögel, Schmetterlinge, Glühwürmchen', () => {
    const put = "critters.length = 0; critters.push(spawnCritter('schmetterling', 6, 6, 1e6 - 100), spawnCritter('gluehwurm', 6, 6, 1e6 - 100))";
    expect(calls('drawCritter', put)).toBeGreaterThan(0);
    game("setGfx('animals', false)");
    expect(calls('drawCritter', put)).toBe(0);
    game('critters.length = 0');
  });

  it('Symbole, Namensschilder, Glitzer aus', () => {
    game("state.tiles.set('6,6', { b: 'truhe', lvl: 1 }); recalc()");                   // 🎁 über der Truhe
    expect(calls('drawStatusIcon')).toBeGreaterThan(0);
    game("setGfx('icons', false)");
    expect(calls('drawStatusIcon')).toBe(0);
    game("sparkles.push({ x: 6, y: 6, a: 0, r: 0.3, t0: 1e6 - 10, col: '#fff' })");
    game("setGfx('sparkle', false); render(1e6)");
    expect(game('sparkles.length')).toBe(0);
    // Namensschild über einer Figur (Besuch, eigene Figur)
    const lab = "walkers.length = 0; walkers.push({ ...meFigLook(), px: 6, py: 6, speed: 0, wait: 1, label: 'Anna' })";
    const fill = s => game(`(() => { const f = g.fillText; let n = 0; g.fillText = (t, ...a) => { if (t === 'Anna') n++; return f.call(g, t, ...a); }; try { ${s}; render(1e6); } finally { g.fillText = f; } return n; })()`);
    expect(fill(lab)).toBeGreaterThan(0);
    game("setGfx('labels', false)");
    expect(fill(lab)).toBe(0);
    game('walkers.length = 0');
  });

  it('Fenster: Zurück führt ins Menü; Spielstand hat sichern, laden, neu', () => {
    game('showSettings()');
    game("document.getElementById('m-back').click()");
    expect(game("!!document.getElementById('m-settings')")).toBe(true);
    game("document.getElementById('m-savegame').click()");
    expect(game("['m-export', 'm-import', 'm-reset'].every(id => !!document.getElementById(id))")).toBe(true);
  });
});
