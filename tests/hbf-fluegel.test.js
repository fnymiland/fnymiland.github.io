const { loadGame, game } = require('./helpers/load-game');

// Block 118/121/123: Der Hauptbahnhof hat immer die Eingangshalle in der Mitte – Gleis, Steig, Halle, Steig, Gleis (rechts der
// Halle gespiegelt). Gleise kommen auf der gewählten Seite dazu; alte Bahnhöfe werden beim Laden umgestellt.
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999; state.techs.add('bahn')");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});
const put = (rot, gleise = 2, extra = '') => game(`state.tiles.set('14,14', { b: 'hbf', lvl: 1, rot: ${rot}, gleise: ${gleise}${extra} }); recalc(); '14,14'`);
const exits = k => game(`(() => { const t = state.tiles.get('${k}'), [x, y] = keyXY('${k}'); return [...Array(hbfGleise(t))].map((_, g) => gleisTiles(t, x, y, g).exit.join()); })()`);
// Eingang genau mittig auf einem Feld (Breite ungerade)
function centered(k) {
  const t = game(`state.tiles.get('${k}')`), rot = t.rot || 0, [w, h] = game(`sizeOf('hbf', ${rot}, state.tiles.get('${k}'))`);
  const [ax, ay] = k.split(',').map(Number), cx = ax + (w - 1) / 2, cy = ay + (h - 1) / 2, ent = game(`hbfEntrance(state.tiles.get('${k}'), ${ax}, ${ay})`);
  return ent.length === 1 && (rot & 1 ? ent[0][0] === cx : ent[0][1] === cy);
}
// alter Stand (v12) laden: wie beim Start nach dem Update
const reload = () => game("(() => { const s = JSON.parse(JSON.stringify(serialize())); s.v = 12; adoptState(parseSave(s)); return true; })()");

describe('Hauptbahnhof: Halle in der Mitte (Block 123)', () => {
  it('neu gebaut in jeder Drehung: 5 breit, Gleis – Steig – Halle – Steig – Gleis, Eingang genau mittig', () => {
    for (let rot = 0; rot < 4; rot++) {
      game(`buildRot = ${rot}; rotManual = true`);
      expect(game("build('hbf', 14, 14, true)"), `rot ${rot}`).toBe(true);
      const k = game("[...state.tiles].find(([, t]) => t.b === 'hbf')[0]"), t = game(`state.tiles.get('${k}')`);
      expect([t.wing, t.mid]).toEqual([2, 1]);
      expect(game(`sizeOf('hbf', 0, state.tiles.get('${k}'))`)).toEqual([4, 5]);
      const tb = g => game(`hbfTrackB(state.tiles.get('${k}'), ${g})`), ps = g => game(`hbfPlatS(state.tiles.get('${k}'), ${g})`);
      expect([tb(0), tb(0) + ps(0), game(`hbfHallB(state.tiles.get('${k}'))`), tb(1) + ps(1), tb(1)]).toEqual([-2, -1, 0, 1, 2]);   // gespiegelt
      expect(centered(k), `rot ${rot}`).toBe(true);
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('+ / − Gleis auf der gewählten Seite: in jeder Drehung bleiben alle anderen Gleise, wo sie sind; Züge wandern mit', () => {
    for (let rot = 0; rot < 4; rot++) {
      let k = put(rot, 2, ", wing: 2, mid: 1, gleis: [{ train: 'regio' }, { train: 'schnell' }]");
      const e0 = exits(k);
      k = game(`hbfResize('${k}', 1, -1)`);                                           // links dazu
      expect(exits(k).slice(1), `rot ${rot} + links`).toEqual(e0);
      expect(game(`[state.tiles.get('${k}').mid, state.tiles.get('${k}').gleis.map(c => c && c.train)]`)).toEqual([2, [null, 'regio', 'schnell']]);
      const e1 = exits(k);
      k = game(`hbfResize('${k}', 1, 1)`);                                            // rechts dazu
      expect(exits(k).slice(0, 3), `rot ${rot} + rechts`).toEqual(e1);
      expect(centered(k), `rot ${rot}: 2 | Halle | 2`).toBe(true);
      const e2 = exits(k);
      k = game(`hbfResize('${k}', -1, -1)`);                                          // links weg
      expect(exits(k), `rot ${rot} − links`).toEqual(e2.slice(1));
      expect(game(`state.tiles.get('${k}').gleis[0].train`)).toBe('regio');
      expect(game(`hbfResizeError('${k}', -1, -1)`)).toMatch(/Links der Halle muss ein Gleis bleiben/);
      k = game(`hbfResize('${k}', -1, 1)`);                                           // rechts weg
      expect(exits(k)).toEqual(e2.slice(1, 3));
      expect(game(`hbfResizeError('${k}', -1, 1)`)).toMatch(/Mindestens/);
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('kein Platz auf einer Seite: nur dort kein + Gleis; Fenster hat + links / + rechts, kein Flügel-Knopf mehr', () => {
    const k = put(0, 2, ', wing: 2, mid: 1');                                          // y 14…18
    game("state.tiles.set('14,19', { b: 'haus', lvl: 1 }); recalc()");
    expect(game(`hbfResizeError('${k}', 1, 1)`)).toMatch(/Platz/);
    expect(game(`hbfResizeError('${k}', 1, -1)`)).toBe(null);
    game(`openInfo(14, 14)`);
    const btns = game("[...document.querySelectorAll('#panel [data-gres]')].map(b => b.textContent + (b.disabled ? ' (aus)' : ''))");
    expect(btns).toEqual(['+ Gleis links', '+ Gleis rechts (aus)']);
    expect(game("!!document.querySelector('#panel [data-hwing]')")).toBe(false);
    game("document.querySelector('#panel [data-gres=\"1,-1\"]').click()");
    expect(game("hbfGleise([...state.tiles.values()].find(t => t.b === 'hbf'))")).toBe(3);
  });
  it('alte Bahnhöfe werden beim Laden umgestellt: ohne Halle eins breiter, Halle wo der Eingang war – in jeder Drehung', () => {
    for (let rot = 0; rot < 4; rot++) for (const n of [2, 3]) {
      put(rot, n);
      const door = game("hbfEntrance(state.tiles.get('14,14'), 14, 14).map(p => p.join())"), old = game("footprint('hbf', 14, 14, " + rot + ", state.tiles.get('14,14')).map(p => p.join())");
      reload();
      const [k, t] = game("[...state.tiles].find(([, t]) => t.b === 'hbf')");
      expect(t.wing, `rot ${rot} n ${n}`).toBe(2);
      const [x, y] = k.split(',').map(Number), foot = game(`footprint('hbf', ${x}, ${y}, ${rot}, state.tiles.get('${k}')).map(p => p.join())`);
      expect(foot.length).toBe(old.length + 4);
      expect(old.every(p => foot.includes(p))).toBe(true);
      expect(door).toContain(game(`hbfEntrance(state.tiles.get('${k}'), ${x}, ${y})[0].join()`));
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('kein Platz auf beiden Seiten: bleibt vorerst; das Fenster sagt warum und baut später um. Seitenflügel werden Mittelhalle', () => {
    put(0);                                                                           // alt: y 14…17
    game("state.tiles.set('14,13', { b: 'haus', lvl: 1 }); state.tiles.set('15,18', { b: 'haus', lvl: 1 }); state.tiles.set('20,20', { b: 'hbf', lvl: 1, rot: 1, gleise: 3, wing: -1 }); recalc()");
    reload();
    expect(game("state.tiles.get('14,14').wing")).toBe(undefined);
    expect(game("[state.tiles.get('20,20').wing, state.tiles.get('20,20').mid]")).toEqual([2, 1]);
    expect(game("hbfUpgradePlan('14,14')")).toMatch(/Daneben steht etwas/);
    game('openInfo(14, 14)');
    expect(game("$('p-hup').disabled")).toBe(true);
    expect(game("document.getElementById('panel').textContent")).toMatch(/Halle in die Mitte/);
    game("state.tiles.delete('15,18'); recalc(); openInfo(14, 14); $('p-hup').click()");
    expect(game("state.tiles.get('14,14').wing")).toBe(2);
    expect(centered('14,14')).toBe(true);
    reload();                                                                         // nur einmal: Neues bleibt, wie es ist
    expect(game("state.tiles.get('14,14').mid")).toBe(1);
  });
  it('Speichern und Laden behalten Halle und Seiten; ein Hbf allein im Rechteck wird wie gewohnt verschoben', () => {
    const k = put(1, 4, ', wing: 2, mid: 3');
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    expect([game(`parseSave(${JSON.stringify(s)})`).tiles.get(k).wing, game(`parseSave(${JSON.stringify(s)})`).tiles.get(k).mid]).toEqual([2, 3]);
    game(`setTool('verschieben'); pickUpGroup(14, 14, 22, 17)`);                                 // Drehung 1: 9 × 4
    expect(game('moving && moving.kind')).toBe('tile');
    game('cancelMove()');
  });
  it('zeichnet in jedem Aussehen, jeder Drehung und Aufteilung ohne Fehler (auch alt ohne Halle)', () => {
    const bad = game(`(() => { const out = []; for (const look of Object.keys(HBF_LOOKS)) for (let rot = 0; rot < 4; rot++) for (const [gleise, mid] of [[2, 1], [3, 1], [3, 2], [4, 2], [2, null]]) for (const n of [0, 0.8]) {
      try { night = n; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot, look, gleise, ...(mid ? { wing: 2, mid } : {}) }); } catch (e) { out.push(look + rot + gleise + ': ' + e.message); } } night = 0; return out; })()`);
    expect(bad).toEqual([]);
  });
  it('Block 122: Backstein und Land bekommen das Gewölbe wie Glas (aus Ziegeln/Holz), Glas bleibt Glas', () => {
    const calls = game(`(() => { const out = {}, orig = vaultDetail; vaultDetail = (K, roof, brick, lit) => { out[brick ? 'ziegel' : 'holz'] = (out[brick ? 'ziegel' : 'holz'] || 0) + 1; return orig(K, roof, brick, lit); };
      try { for (const look of ['glas', 'backstein', 'land']) drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot: 0, look, gleise: 3 }); } finally { vaultDetail = orig; } return out; })()`);
    expect(calls).toEqual({ ziegel: 3, holz: 3 });                                                // je Gleis ein Gewölbe
    // Gewölbe in der Dachfarbe: eine gewählte Dachfarbe färbt auch die Halle (keine feste Ziegel-/Holzfarbe)
    const fills = game(`(() => { const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
      try { PASS = 'object'; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot: 0, look: 'backstein', gleise: 2, roof: 2 }); } finally { PASS = null; delete g.fillStyle; } return seen; })()`);
    expect(fills).not.toContain(String(game("C('#a65a44')")));
  });
});
