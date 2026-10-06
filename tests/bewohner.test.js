const { loadGame, game } = require('./helpers/load-game');

// Block 55: Bewohner – neue Arten über Inseln, alle Wohnhäuser, Tagesablauf, Antippen, Sprechblasen, Rathaus-Reiter
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('walkers.length = 0; strollers.length = 0; recalc()');
});

describe('Arten', () => {
  it('neun Arten; neue ziehen erst ein, wenn ihre Insel entdeckt ist', () => {
    expect(game('ANIMALS.length')).toBe(9);
    game('state.islands = new Set()');
    expect(game('speciesOpen().map(a => a.id)')).toEqual(['katze', 'baer', 'hase']);
    game("state.islands.add('wald'); state.islands.add('quelle')");
    expect(game('speciesOpen().map(a => a.id)')).toEqual(['katze', 'baer', 'hase', 'eichhorn', 'ente']);
    game('state.islands = new Set()');
    const seen = new Set(Array.from({ length: 60 }, () => game('pickResident(Math.random, Math.random).animal')));
    expect([...seen].sort()).toEqual(['baer', 'hase', 'katze']);
  });

  it('jedes Wohnhaus hat Bewohner, im Reihenhaus drei Familien; wird gespeichert und ins Album aufgenommen', () => {
    game("state.tiles.set('10,10', { b: 'reihenhaus', lvl: 1, rot: 0 }); state.tiles.set('14,10', { b: 'baumhaus', lvl: 1 }); nameHouses()");
    expect(game("residentsOf(state.tiles.get('10,10')).length")).toBe(3);
    expect(game("residentsOf(state.tiles.get('14,10')).length")).toBe(1);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.tiles.get('10,10').more.length")).toBe(2);
    game('collectAlbum()');
    for (const r of game("residentsOf(state.tiles.get('10,10'))")) expect(game(`state.album.has('tier:${r.animal}')`)).toBe(true);
  });
});

describe('Tagesablauf', () => {
  const town = () => {
    game("for (let x = 6; x <= 20; x++) state.tiles.set(x + ',12', { b: 'weg', lvl: 1 })");
    game("state.tiles.set('6,11', { b: 'haus', lvl: 1 }); state.tiles.set('19,11', { b: 'baecker', lvl: 1, rot: 0 }); nameHouses(); recalc()");
  };
  it('der Tag hat vier Teile (Spielstunden, 1 Minute = 1 Stunde)', () => {
    expect(game('dayPart(7 * 60e3)')).toBe('morgen');
    expect(game('dayPart(12 * 60e3)')).toBe('mittag');
    expect(game('dayPart(18 * 60e3)')).toBe('abend');
    expect(game('dayPart(23 * 60e3)')).toBe('nacht');
    expect(game('dayPart(2 * 60e3)')).toBe('nacht');
  });

  it('mittags geht ein Bewohner zum Essen: findet den Weg, geht hinein, kommt wieder raus und geht heim', () => {
    town();
    game("walkers.length = 0; walkers.push({ fx: 7, fy: 12, tx: 7, ty: 12, px: 7, py: 12, t: 1, wait: 0, ...residentLook('6,11', 0), shirt: '#fff', speed: 1 }); setGoal(walkers[0], 'essen')");
    expect(game('walkers[0].goal.kind')).toBe('essen');
    expect(game('walkers[0].goal.k')).toBe('19,11');
    let inside = false;
    for (let i = 0; i < 400 && game('walkers.length'); i++) { game('stepMovers(0.1)'); if (game('walkers[0] && walkers[0].inside > 0')) inside = true; }
    expect(inside).toBe(true);
    expect(game('walkers.length')).toBe(0);                                      // wieder zu Hause
  });

  it('nachts sind weniger unterwegs, und wer draußen ist, geht heim', () => {
    town();
    game('T.pop = 80; walkers.length = 0; lastPart = "mittag"');
    game("walkers.push({ fx: 10, fy: 12, tx: 10, ty: 12, px: 10, py: 12, t: 1, wait: 0, ...residentLook('6,11', 0), shirt: '#fff', speed: 1, goal: { kind: 'bummel' }, steps: 50 })");
    game('const _dp = dayPart; dayPart = () => "nacht"; syncMovers(); dayPart = _dp');
    expect(game('walkers[0].goal.kind')).toBe('home');
  });
});

describe('Antippen, Sprechblasen, Rathaus', () => {
  it('Figur antippen: Fenster mit Name, Haus und was sie gerade macht; Knopf zum Haus', () => {
    game("state.tiles.set('6,11', { b: 'haus', lvl: 1, animal: 'baer', name: 'Bruno' }); state.tiles.set('7,12', { b: 'weg', lvl: 1 }); recalc()");
    game("walkers.push({ fx: 7, fy: 12, tx: 7, ty: 12, px: 7, py: 12, t: 0, wait: 5, ...residentLook('6,11', 0), shirt: '#fff', speed: 1, goal: { kind: 'arbeit' } })");
    const [sx, sy] = game('(() => { const [x, y] = walkerHead(walkers[0], cam.z); return [x, y + 6 * cam.z]; })()');
    game(`tap(${sx}, ${sy}, false)`);
    const txt = game("document.getElementById('panel').textContent");
    expect(txt).toMatch(/Bruno Bär/);
    expect(txt).toMatch(/Zuhause: Häuschen/);
    expect(txt).toMatch(/Arbeit/);
    expect(game('bubble && bubble.w === walkers[0]')).toBe(true);                 // sagt etwas
    game("document.getElementById('p-home').click()");
    expect(game("document.getElementById('panel').textContent")).toMatch(/Wünsche/);
  });

  it('im Gebäude: „Macht Pause: …“; zu Hause angekommen: Fenster bleibt und sagt es', () => {
    game("state.tiles.set('6,11', { b: 'haus', lvl: 1, animal: 'baer', name: 'Bruno' }); state.tiles.set('8,11', { b: 'baecker', lvl: 1, rot: 0 }); state.tiles.set('7,12', { b: 'weg', lvl: 1 }); recalc()");
    game("walkers.push({ fx: 7, fy: 12, tx: 7, ty: 12, px: 7, py: 12, t: 0, wait: 0, ...residentLook('6,11', 0), shirt: '#fff', speed: 1, goal: { kind: 'essen', k: '8,11' }, inside: 5 })");
    game('openWalkerInfo(walkers[0])');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Macht Pause: Bäckerei/);
    game('walkers.length = 0; refreshLive()');
    expect(game("document.getElementById('panel').hidden")).toBe(false);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Bruno Bär.*nach Hause gegangen/s);
  });

  it('weit herausgezoomt trifft man Figuren nur genau (nicht das Haus daneben)', () => {
    game("state.tiles.set('6,11', { b: 'haus', lvl: 1, animal: 'baer', name: 'Bruno' }); state.tiles.set('7,12', { b: 'weg', lvl: 1 }); recalc(); cam.z = 0.5");
    game("walkers.push({ fx: 7, fy: 12, tx: 7, ty: 12, px: 7, py: 12, t: 0, wait: 5, ...residentLook('6,11', 0), shirt: '#fff', speed: 1, goal: { kind: 'bummel' } })");
    const [hx, hy] = game('walkerHead(walkers[0], cam.z)');
    expect(game(`walkerAt(${hx}, ${hy + 3})`)).not.toBe(null);
    expect(game(`walkerAt(${hx + 12}, ${hy + 3})`)).toBe(null);
    game('cam.z = 1');
  });

  it('Sprechblasen erzählen von den Wünschen des Hauses', () => {
    game("state.tiles.set('6,11', { b: 'haus', lvl: 1, animal: 'baer', name: 'Bruno' }); recalc()");
    const w = "({ home: '6,11', who: 0, goal: { kind: 'bummel' } })";
    const said = new Set();
    for (let i = 0; i < 60; i++) said.add(game(`bubbleText(${w})`));
    expect([...said].some(t => /Weg vor meiner Tür|Blumen vorm Haus/.test(t))).toBe(true);
  });

  it('Rathaus → Bewohner: alle Familien nach Art, fehlende Arten mit ihrer Insel', () => {
    game("state.islands = new Set(); state.tiles.set('6,11', { b: 'haus', lvl: 1, animal: 'baer', name: 'Bruno' }); recalc(); openTownHall('bewohner')");
    const txt = game("document.getElementById('modal').textContent");
    expect(txt).toMatch(/Bruno/);
    expect(txt).toMatch(/Familie Fuchs/);
    expect(txt).toMatch(/Windinsel/);
    game("document.querySelector('[data-home=\"6,11\"]').click()");
    expect(game("document.getElementById('modal').hidden")).toBe(true);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Bruno/);
  });
  it('Block 115: Figuren auf der Insel in 70 % – Kopf, Antippen und Sprechblase passen dazu; Vorschau im Fenster voll', () => {
    expect(game('FIG_SCALE')).toBe(0.7);
    expect(game('[figScale({}), figScale({ full: true })]')).toEqual([0.7, 1]);
    const d = game("(() => { const w = { px: 5, py: 5, kind: 0 }, p = toScreen(5, 5), [hx, hy] = walkerHead(w, 2); return p.y - hy; })()");
    expect(d).toBeCloseTo(13 * 2 * 0.7);
    expect(() => game("(() => { const w = { px: 5, py: 5, kind: 0, fur: '#c98d5c', shirt: '#3e7fd0', label: 'Mia', hat: 'strohhut', hand: 'herzballon', wait: 1, speed: 0.5 }; drawWalker(w, 2, 0); drawWalker({ ...w, full: true }, 2, 0); })()")).not.toThrow();
  });
});
