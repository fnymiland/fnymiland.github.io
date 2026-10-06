const { loadGame, game } = require('./helpers/load-game');

// Block 118: Seitenflügel am Hauptbahnhof – ein Feld breiter (ungerade), Portal und Eingang mittig auf einem Feld; die Gleise
// bleiben, wo sie sind
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999; state.techs.add('bahn')");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});
const put = (rot, gleise = 2, extra = '') => game(`state.tiles.set('14,14', { b: 'hbf', lvl: 1, rot: ${rot}, gleise: ${gleise}${extra} }); recalc(); '14,14'`);
const exits = k => game(`(() => { const t = state.tiles.get('${k}'), [x, y] = keyXY('${k}'); return [...Array(hbfGleise(t))].map((_, g) => gleisTiles(t, x, y, g).exit.join()); })()`);

describe('Hauptbahnhof mit Seitenflügel (Block 118)', () => {
  it('in jeder Drehung und auf beiden Seiten: ungerade breit, Gleise bleiben, ein Eingangsfeld genau mittig', () => {
    for (let rot = 0; rot < 4; rot++) for (const side of [1, -1]) {
      const k0 = put(rot), before = exits(k0), foot0 = game(`footprint('hbf', 14, 14, ${rot}, state.tiles.get('14,14')).length`);
      const k = game(`hbfWingSet('${k0}', ${side})`);
      expect(k, `rot ${rot} Seite ${side}`).toBeTruthy();
      const t = game(`state.tiles.get('${k}')`), [w, h] = game(`sizeOf('hbf', ${rot}, state.tiles.get('${k}'))`);
      expect(t.wing).toBe(side);
      expect(Math.min(w, h) === 4 ? Math.max(w, h) : Math.min(w, h)).toBe(5);                 // 2 Gleise + Flügel
      expect(game(`footprint('hbf', ${k.split(',')[0]}, ${k.split(',')[1]}, ${rot}, state.tiles.get('${k}')).length`)).toBe(foot0 + 4);
      expect(exits(k), `rot ${rot} Seite ${side}`).toEqual(before);                         // die Strecken davor passen weiter
      const ent = game(`hbfEntrance(state.tiles.get('${k}'), ${k.split(',')[0]}, ${k.split(',')[1]})`);
      expect(ent.length).toBe(1);
      const [ax, ay] = k.split(',').map(Number), cx = ax + (w - 1) / 2, cy = ay + (h - 1) / 2;
      const mid = rot & 1 ? cx : cy, at = rot & 1 ? ent[0][0] : ent[0][1];                       // Breite: bei Drehung 0/2 entlang y
      expect(mid).toBe(Math.round(mid));                                                        // ungerade breit: die Mitte ist ein Feld
      expect(at, `rot ${rot} Seite ${side}`).toBe(mid);
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('Anbauen kostet, Abbauen gibt die Hälfte; besetztes Nachbarfeld verhindert es; Seite wechseln geht', () => {
    put(0);
    const m0 = game('state.money');
    let k = game("hbfWingSet('14,14', 1)");
    expect(game('state.money')).toBe(m0 - game('HBF_WING_COST.money'));
    k = game(`hbfWingSet('${k}', -1)`);                                                          // umsetzen: kostenlos
    expect(game('state.money')).toBe(m0 - game('HBF_WING_COST.money'));
    expect(game(`state.tiles.get('${k}').wing`)).toBe(-1);
    expect(exits(k)).toEqual(exits(k));
    k = game(`hbfWingSet('${k}', 0)`);
    expect(game('state.money')).toBe(m0 - game('HBF_WING_COST.money') + Math.floor(game('HBF_WING_COST.money') / 2));
    expect(game(`state.tiles.get('${k}').wing`)).toBe(undefined);
    // Haus genau dort, wo der Flügel hin müsste
    const cell = game(`(() => { const t = state.tiles.get('${k}'), [x, y] = keyXY('${k}'), r = hbfWingPlan('${k}', 1); const t2 = { ...t, wing: 1 }, [nx, ny] = keyXY(r.nk), old = new Set(footprint('hbf', x, y, 0, t).map(p => p.join())); return footprint('hbf', nx, ny, 0, t2).find(p => !old.has(p.join())); })()`);
    game(`state.tiles.set('${cell.join()}', { b: 'haus', lvl: 1 }); recalc()`);
    expect(game(`hbfWingPlan('${k}', 1)`)).toMatch(/steht etwas/);
  });
  it('+ Gleis mit Flügel: alte Gleise bleiben; Speichern und Laden behalten den Flügel, Unsinn wird ignoriert', () => {
    put(1);
    let k = game("hbfWingSet('14,14', 1)");
    const before = exits(k);
    k = game(`hbfResize('${k}', 1)`);
    expect(exits(k).slice(0, 2)).toEqual(before);
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    const p = game(`parseSave(${JSON.stringify(s)})`);
    expect(p.tiles.get(k).wing).toBe(1);
    expect(game("hbfWing({ wing: 7 })")).toBe(0);
    expect(game("sizeOf('hbf', 0, { gleise: 2, wing: 'x' })")).toEqual([4, 4]);
  });
  it('zeichnet mit Flügel in jedem Aussehen, jeder Drehung und auf beiden Seiten ohne Fehler', () => {
    const bad = game(`(() => { const out = []; for (const look of Object.keys(HBF_LOOKS)) for (let rot = 0; rot < 4; rot++) for (const wing of [1, -1]) for (const gleise of [2, 3]) for (const n of [0, 0.8]) {
      try { night = n; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot, look, gleise, wing }); } catch (e) { out.push(look + rot + wing + ': ' + e.message); } } night = 0; return out; })()`);
    expect(bad).toEqual([]);
  });
  it('ein Hauptbahnhof mit Flügel allein im Rechteck: Verschieben wie gewohnt', () => {
    put(0);
    const k = game("hbfWingSet('14,14', 1)");
    game(`setTool('verschieben'); pickUpGroup(${k.split(',')[0]}, ${k.split(',')[1]}, ${+k.split(',')[0] + 3}, ${+k.split(',')[1] + 4})`);
    expect(game('moving && moving.kind')).toBe('tile');                                          // ein Ding: wie gewohnt
    game('cancelMove()');
  });
  it('Block 121 Mittelhalle: in jeder Drehung Eingang genau mittig; Gleis 1 bleibt, Gleis 2 rückt (vorher angesagt)', () => {
    for (let rot = 0; rot < 4; rot++) {
      const k0 = put(rot), before = exits(k0);
      expect(game(`hbfWingPlan('${k0}', 2).moved`)).toBe(1);
      const k = game(`hbfWingSet('${k0}', 2)`);
      const t = game(`state.tiles.get('${k}')`), [w, h] = game(`sizeOf('hbf', ${rot}, state.tiles.get('${k}'))`);
      expect([t.wing, t.mid]).toEqual([2, 1]);
      const after = exits(k);
      expect(after[0]).toBe(before[0]);
      expect(after[1]).not.toBe(before[1]);
      const [ax, ay] = k.split(',').map(Number), cx = ax + (w - 1) / 2, cy = ay + (h - 1) / 2, ent = game(`hbfEntrance(state.tiles.get('${k}'), ${ax}, ${ay})`);
      expect(ent.length).toBe(1);
      expect(rot & 1 ? ent[0][0] : ent[0][1], `rot ${rot}`).toBe(rot & 1 ? cx : cy);
      game(`state.tiles.delete('${k}'); recalc()`);
    }
  });
  it('Mittelhalle: 4 Gleise symmetrisch (2 | Halle | 2); + Gleis rechts, alte bleiben; − Gleis nur bis eins rechts bleibt', () => {
    put(0, 4);
    let k = game("hbfWingSet('14,14', 2)");
    expect(game(`hbfLeft(state.tiles.get('${k}'))`)).toBe(2);
    expect(game(`hbfHallB(state.tiles.get('${k}'))`)).toBe(0);                                 // genau in der Mitte
    const before = exits(k);
    k = game(`hbfResize('${k}', 1)`);
    expect(exits(k).slice(0, 4)).toEqual(before);
    k = game(`hbfResize('${k}', -1)`); k = game(`hbfResize('${k}', -1)`);
    expect(game(`hbfGleise(state.tiles.get('${k}'))`)).toBe(3);
    expect(game(`hbfResizeError('${k}', -1)`)).toMatch(/Rechts der Halle/);
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    const p = game(`parseSave(${JSON.stringify(s)})`);
    expect([p.tiles.get(k).wing, p.tiles.get(k).mid]).toEqual([2, 2]);
  });
  it('Mittelhalle zeichnet in jedem Aussehen und jeder Drehung ohne Fehler', () => {
    const bad = game(`(() => { const out = []; for (const look of Object.keys(HBF_LOOKS)) for (let rot = 0; rot < 4; rot++) for (const gleise of [2, 3, 4]) for (const n of [0, 0.8]) {
      try { night = n; drawObject('hbf', 300, 300, 1.2, 1000, 10, 10, 1, { b: 'hbf', lvl: 1, rot, look, gleise, wing: 2, mid: Math.floor(gleise / 2) }); } catch (e) { out.push(look + rot + ': ' + e.message); } } night = 0; return out; })()`);
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
