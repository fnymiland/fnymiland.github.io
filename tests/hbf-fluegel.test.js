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
});
