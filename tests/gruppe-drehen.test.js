const { loadGame, game } = require('./helpers/load-game');

// Block 117: Mehrere Dinge tragen und als Ganzes drehen (⟳, R, Mausrad) – jedes Ding dreht mit, Parkrasen, Freizeitpark-Boden
// und Hecken/Zäune/Mauern ziehen mit um
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999");
  game("for (let y = 2; y <= 22; y++) for (let x = 2; x <= 22; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc(); setTool('verschieben')");
});
// ein kleiner Park in 4…7 × 4…6: Rasen, Weg, Brunnen, Reihenhaus (2 Felder), Bank am Weg, Laterne in der Ecke, Hecke rundum
function park() {
  game(`for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) state.terra.set(x + ',' + y, 'park');
    state.tiles.set('5,4', { b: 'weg', lvl: 1, style: 'kopf' }); state.tiles.set('5,5', { b: 'weg', lvl: 1, style: 'kopf' }); state.tiles.set('5,6', { b: 'weg', lvl: 1, style: 'kopf' });
    state.tiles.set('4,6', { b: 'brunnen', lvl: 1 });
    state.tiles.set('7,4', { b: 'reihenhaus', lvl: 1, rot: 0 });
    state.decos.set('5,5', [null, null, null, null, null, null, { b: 'bank', rot: midRot(6) }, null, null, null]);
    state.decos.set('4,4', [null, { b: 'laterne', rot: 0 }, null, null, null, null, null, null, null, null]);
    state.decos.set('6,4', [null, null, null, null, null, null, null, null, { b: 'laterne', rot: 0 }, null]);
    for (let x = 4; x <= 6; x++) state.edges.set('a' + x + ',4', { b: 'hecke', style: 'niedrig' });
    state.edges.set('b4,5', { b: 'zaun', style: 'latten', gate: true });
    recalc()`);
}
// Zustand ohne Animationszeit, sortiert
const snap = () => game(`(() => { const clean = v => JSON.parse(JSON.stringify(v, (k, x) => k === 'born' ? undefined : x));
  return { tiles: [...state.tiles].filter(([k]) => { const [x, y] = keyXY(k); return x >= 2 && x <= 22 && y >= 2 && y <= 22; }).map(([k, t]) => [k, clean(t)]).sort(),
    decos: [...state.decos].map(([k, ds]) => [k, clean(ds)]).sort(), edges: [...state.edges].map(([k, e]) => [k, clean(e)]).sort(),
    terra: [...state.terra].filter(([k, v]) => v === 'park' || v === 'fz').sort() }; })()`);

describe('Gruppe drehen (Block 117)', () => {
  it('Rasen, Hecken und Zäune kommen mit; am alten Platz bleibt Wiese', () => {
    park();
    expect(game('pickUpGroup(4, 4, 7, 6)')).toBe(true);
    expect(game("moving.items.filter(i => i.kind === 'ground').length")).toBe(9);
    expect(game("moving.items.filter(i => i.kind === 'edge').length")).toBe(4);
    expect(game("[terraLook(5, 5), state.edges.size]")).toEqual(['grass', 0]);
    expect(game("dropGroup(15, 15)")).toBe(true);
    expect(game("[...state.terra].filter(([k, v]) => v === 'park').length")).toBe(9);
    expect(game('state.edges.size')).toBe(4);
  });
  it('viermal eine Vierteldrehung ergibt wieder genau das Original', () => {
    park();
    const before = snap();
    game('pickUpGroup(4, 4, 7, 6)');
    for (let i = 0; i < 4; i++) game('rotateBuild(1)');
    expect(game('moving.r')).toBe(0);
    expect(game('dropGroup(4 + moving.cx, 4 + moving.cy)')).toBe(true);
    expect(snap()).toEqual(before);
  });
  it('eine Vierteldrehung: Lage und Ausrichtung drehen mit, alles bleibt zueinander gleich', () => {
    park();
    game('pickUpGroup(4, 4, 7, 6)'); game('rotateBuild(1)');
    expect(game('[moving.cx, moving.cy]')).toEqual([1, 2]);                    // 4 × 3 wird 3 × 4
    expect(game('groupErrors(15, 15).first')).toBe(null);
    game('dropGroup(15, 15)');
    const ox = 14, oy = 13;                                                        // 15 − cx, 15 − cy
    const T = (x, y) => game(`(() => { const t = state.tiles.get('${x},${y}'); return t ? [t.b, t.rot || 0] : null; })()`);
    // (dx, dy) → (H−1−dy, dx) mit H = 3: Weg (1,0..2) → (2..0, 1); Brunnen (0,2) → (0,0); Reihenhaus (3,0) → (2,3)
    expect([T(ox + 2, oy + 1), T(ox + 1, oy + 1), T(ox, oy + 1)].map(v => v && v[0])).toEqual(['weg', 'weg', 'weg']);
    expect(T(ox, oy)).toEqual(['brunnen', 0]);
    const rh = game("[...state.tiles].find(([k, t]) => t.b === 'reihenhaus')");
    expect(rh[1].rot).toBe(1);
    const fp = game(`footprint('reihenhaus', ${rh[0].split(',')[0]}, ${rh[0].split(',')[1]}, 1, state.tiles.get('${rh[0]}')).map(c => c.join())`).sort();
    expect(fp).toEqual(game('(() => { const cells = [[7, 4], [7, 5]].map(([x, y]) => [x - 4, y - 4]); const m = { W: 4, H: 3, r: 1 }; return cells.map(([x, y]) => [m.H - 1 - y + 14, x + 13].join()); })()').sort());
    // Bank am Weg: wie das Spiel sie an der neuen Seite selbst stellt; Laterne in der Ecke wandert mit; Eckpunkt-Laterne auch
    const bank = game("(() => { for (const [k, ds] of state.decos) { const i = ds.findIndex(d => d && d.b === 'bank'); if (i >= 0) return [k, i, ds[i].rot]; } })()");
    expect(bank[0]).toBe(`${ox + 1},${oy + 1}`);
    expect(bank[2]).toBe(game(`midRot(${bank[1]})`));
    expect(game(`state.decos.get('${ox + 2},${oy}')[3].b`)).toBe('laterne');         // Ecke 1 (+u, −v) → (+v, +u) = Ecke 3
    expect(game("[...state.decos].some(([k, ds]) => ds[8] && ds[8].b === 'laterne')")).toBe(true);
    expect(game('state.edges.size')).toBe(4);
    expect(game("[...state.edges.values()].filter(e => e.gate).length")).toBe(1);   // Tor bleibt Tor
  });
  it('Abbrechen nach dem Drehen legt alles unverändert zurück; Speichern beim Tragen behält Rasen und Linien', () => {
    park();
    const before = snap();
    game('pickUpGroup(4, 4, 7, 6)'); game('rotateBuild(1)');
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    expect(s.terra.filter(([k, v]) => v === 'park').length).toBe(9);
    expect(s.edges.length).toBe(4);
    game('cancelMove()');
    expect(snap()).toEqual(before);
  });
  it('Rasen nur auf Wiese, Linie nicht doppelt; ⟳-Knopf sichtbar und Mausrad dreht die Gruppe', () => {
    park();
    game('pickUpGroup(4, 4, 7, 6)');
    expect(game("$('rot-btn').hidden")).toBe(false);
    expect(game('wheelRotates()')).toBe(true);
    game("state.terra.set('15,15', 'forest')");
    expect(game('groupErrors(15, 15).first')).toMatch(/Wiese/);
    game("state.terra.set('15,15', 'grass'); state.edges.set('a15,14', { b: 'mauer', style: 'backstein' })");
    expect(game('groupErrors(15, 15).first')).toMatch(/Linie/);
    game('cancelMove()');
    expect(game("$('rot-btn').hidden")).toBe(true);
  });
});
