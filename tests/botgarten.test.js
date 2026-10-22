const { loadGame, game } = require('./helpers/load-game');

// Botanischer Garten neu: Gebäude nur noch 2×5 (Rotunde + zwei Glasflügel), drumherum ein Garten aus echten Dingen
// (Weg, Hecke, Beete, Bäume, Laternen, Teich) – geschenkt und frei veränderbar. Alte Stände rücken in die Mitte ihrer Fläche.
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e10; state.festival = true");
  game("state.inventions.add('botgarten'); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); rebuildCover(); recalc()");
});
const ring = (x, y, rot) => game(`(() => { const fp = footprint('botgarten', ${x}, ${y}, ${rot}), xs = fp.map(p => p[0]), ys = fp.map(p => p[1]);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1, out = { weg: 0, blumen: 0, baum: 0, laterne: 0, teich: 0 };
  for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) { if (tx > x0 && tx < x1 && ty > y0 && ty < y1) continue;
    const k = tx + ',' + ty, t = state.tiles.get(k), d = state.decos.get(k);
    if (t && t.b === 'weg') out.weg++; if (t && t.b === 'blumen') out.blumen++; if (state.terra.get(k) === 'water') out.teich++;
    if (d) for (const s of d) if (s) out[s.b] = (out[s.b] || 0) + 1; }
  out.hecke = [...state.edges.values()].filter(e => e.b === 'hecke' && e.free).length; return out; })()`);

// Hecke vor dem Wegstück zur Tür: muss offen sein (Nutzer: „dann musst du auch den Zaun an der Stelle öffnen“)
const entrance = (x, y, rot) => game(`(() => { const t = [...state.tiles].find(([k, t]) => t.b === 'weg'), [wx, wy] = t[0].split(',').map(Number), [fx, fy] = FRONT_DIR[${rot}];
  return state.edges.has(edgeBetween(wx, wy, wx + fx, wy + fy)); })()`);

describe('Botanischer Garten', () => {
  it('ist 2×5; Bild in allen Drehungen, Tag und Nacht, ohne Fehler', () => {
    expect(game('ITEMS.botgarten.size')).toEqual([2, 5]);
    for (const rot of [0, 1, 2, 3]) for (const n of [0, 1])
      game(`(() => { const nv = night; night = ${n}; try { BG_ART(kit(400, 300, 2, ${rot})); } finally { night = nv; } })()`);
  });
  for (const rot of [0, 1, 2, 3]) it(`legt beim Bauen einen Garten aus echten Dingen an (Drehung ${rot}), ohne Geld oder Rohstoffe zu nehmen`, () => {
    const m0 = game('state.money');
    expect(game(`(() => { buildRot = ${rot}; rotManual = true; const r = build('botgarten', 8, 8); buildRot = 0; rotManual = false; return r; })()`)).toBeTruthy();
    const anchor = game("[...state.tiles].find(([k, t]) => t.b === 'botgarten')");
    expect(anchor[1].bg2).toBe(true);
    expect(anchor[1].rot || 0).toBe(rot);
    const [ax, ay] = anchor[0].split(',').map(Number), r = ring(ax, ay, anchor[1].rot || 0);
    expect(r.weg).toBe(1);                                                   // nur der Weg zur Tür
    expect(r.blumen).toBe(4);                                                // vorn links und rechts davon
    expect(r.laterne).toBe(2);
    expect(r.baum).toBe(8);                                                  // drei Ecken je zwei, hinten zwei einzelne
    expect(r.busch).toBe(11);
    expect(r.teich).toBe(1);
    expect(r.hecke).toBe(21);                                                // 22 Außenkanten, eine offen (Eingang)
    expect(entrance(ax, ay, anchor[1].rot || 0)).toBe(false);
    const w = game("(() => { const [k, t] = [...state.tiles].find(([k, t]) => t.b === 'weg'), [x, y] = k.split(',').map(Number); return { ends: pathEnds(x, y, t, pathArms(x, y)), end: t.end }; })()");
    const [fx, fy] = game(`FRONT_DIR[${rot}]`);                           // Weg richtet sich zur Tür aus: Enden zur Tür und zur Hecken-Lücke
    expect(w.end).toBe('rand');
    expect(w.ends.map(String).sort()).toEqual([[fx, fy], [-fx || 0, -fy || 0]].map(String).sort());
    expect(game(`courtOf(state.tiles.get('${ax},${ay}'), ${ax}, ${ay}).links.length`)).toBe(1);   // Belag vom Weg bis an die Tür der Rotunde
    game(`openInfo(${ax}, ${ay}); closePanel()`);
    expect(m0 - game('state.money')).toBeLessThanOrEqual(game('ITEMS.botgarten.cost'));   // Garten kostet nichts extra
    expect(game('Object.values(state.res).every(v => v <= 99999)')).toBe(true);
  });
  it('Garten-Teile kann man abreißen; Weg, Beete und Hecke geben nichts zurück', () => {
    game("build('botgarten', 8, 8)");
    const k = game("[...state.tiles].find(([k, t]) => t.b === 'weg')[0]").split(',').map(Number);
    expect(game(`demolishInfo(${k[0]}, ${k[1]}).refund || 0`)).toBe(0);
    const ek = game("[...state.edges].find(([k, e]) => e.b === 'hecke')[0]");
    const m0 = game('state.money');
    game(`removeEdge('${ek}')`);
    expect(game(`state.edges.has('${ek}')`)).toBe(false);
    expect(game('state.money')).toBe(m0);
  });
  it('lässt Felder, auf denen schon etwas steht, in Ruhe', () => {
    game("build('haus', 7, 9)");                                              // links neben dem Bau
    game("build('botgarten', 8, 8)");
    expect(game("state.tiles.get('7,9').b")).toBe('haus');
  });
  it('alter Stand (5×5): Bau rückt in die Mitte, Garten entsteht beim Laden; Speichern behält alles', () => {
    game("state.tiles.set('6,6', { b: 'botgarten', lvl: 1, phase: WONDERS.botgarten.phases.length }); rebuildCover(); recalc()");
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    const t = game("[...state.tiles].find(([k, t]) => t.b === 'botgarten')");
    expect(t[0]).toBe('8,6');                                               // 2 breit in der Mitte von 5 (5 tief bleibt)
    expect(t[1].bg2).toBe(true);
    expect(ring(8, 6, 0).blumen).toBe(4);
    const h0 = ring(8, 6, 0).hecke;
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(game("[...state.tiles].filter(([k, t]) => t.b === 'botgarten').map(([k]) => k)")).toEqual(['8,6']);
    expect(ring(8, 6, 0).hecke).toBe(h0);                                  // kein zweiter Garten, Hecke bleibt geschenkt
  });
});
