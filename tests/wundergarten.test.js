const { loadGame, game } = require('./helpers/load-game');

// Riesenrad (3×3) und Sternwarte (quer 1×2) nur als Gebäude, ringsum echte Dinge (Nutzer 24.10.2026, wie der Botanische Garten):
// Riesenrad auf einem Platz (Pflaster unter dem Rad im Belag des Wegs, ringsum breite Wege), Zaun um den Fuß mit Tor und Tickethäuschen,
// Laternen, Bänke, Bäume; Sternwarte mit Weg zur Tür, Beet, Bänken, Büschen, Bäumen und Hecke. Alte Stände rücken in die Mitte (wunderUmbau)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e10; state.festival = true");
  game("for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); rebuildCover(); recalc()");
});
const bau = (b, x, y, rot) => game(`(() => { buildRot = ${rot}; rotManual = true; const r = build('${b}', ${x}, ${y}); rotManual = false; buildRot = 0; return r; })()`);
const zaehlen = () => JSON.parse(game(`(() => { const t = {}, d = {}, e = {}; for (const x of state.tiles.values()) t[x.b] = (t[x.b] || 0) + 1; for (const ds of state.decos.values()) for (const x of ds) if (x) d[x.b] = (d[x.b] || 0) + 1;
  for (const x of state.edges.values()) e[x.b] = (e[x.b] || 0) + 1; return JSON.stringify({ t, d, e, breit: [...state.tiles.values()].filter(x => x.b === 'weg' && x.wide).length,
  geschenkt: [...state.tiles.values()].filter(x => (x.b === 'weg' || x.b === 'blumen') && x.price !== 0).length + [...state.edges.values()].filter(x => !x.free).length }); })()`));

describe('Riesenrad und Sternwarte mit echtem Garten', () => {
  it('Größen 3×3 und 1×2; Bilder in allen Drehungen, Tag und Nacht, ohne Fehler', () => {
    expect(game("[ITEMS.riesenrad.size, ITEMS.sternwarte.size]")).toEqual([[3, 3], [1, 2]]);
    for (const rot of [0, 1, 2, 3]) for (const n of [0, 1]) for (const b of ['riesenrad', 'sternwarte'])
      game(`(() => { const nv = night; night = ${n}; try { WONDER_ART.${b}(kit(400, 300, 2, ${rot}), 400, 300, 2, 1000, 1e6, 1e6, { b: '${b}', rot: ${rot}, lvl: 1 }); } finally { night = nv; } })()`);
  });
  for (const rot of [0, 1, 2, 3]) it(`Drehung ${rot}: Platz, Zaun mit Tor und Häuschen, Garten der Sternwarte – alles geschenkt`, () => {
    const m0 = game('state.money');
    expect(bau('riesenrad', 5, 5, rot)).toBeTruthy();
    expect(bau('sternwarte', 15, 15, rot)).toBeTruthy();
    const z = zaehlen();
    expect(z.t.weg).toBe(17);                                                // 16 um das Rad (ganzer Platz), 1 zur Tür der Sternwarte
    expect(z.breit).toBe(16);
    expect(z.t.blumen).toBe(1);
    expect(z.e.zaun).toBe(10);                                               // 12 Kanten um den Fuß, offen: Tor und Häuschen
    expect(z.e.hecke).toBe(13);                                              // 14 Außenkanten um die Sternwarte, offen: der Weg
    expect(z.d).toEqual({ baum: 20, bank: 4, laterne: 4, busch: 6 });
    expect(z.geschenkt).toBe(0);
    expect(m0 - game('state.money')).toBe(2 * game('ITEMS.riesenrad.cost'));   // nur die beiden Baustellen
    expect(game("[...state.tiles.values()].filter(t => t.b === 'riesenrad' || t.b === 'sternwarte').every(t => t.g2 && t.rot === " + rot + ")")).toBe(true);
    // Weg zur Tür der Sternwarte: längs zur Tür, bis an den Rand; Belag reicht bis an das Institut (COURTS)
    const sw = game("(() => { const [k, t] = [...state.tiles].find(([k, t]) => t.b === 'sternwarte'), [x, y] = k.split(',').map(Number); return courtOf(t, x, y); })()");
    expect(sw && sw.links.length).toBe(1);
  });
  it('Häuschen neben dem Tor liegt im Bild nah an der Mitte (nicht an einem Standbein): in jeder Drehung', () => {
    for (const rot of [0, 1, 2, 3]) {
      const [u, v] = game(`kitTurn(${rot}, 1.3, rrKiosk(${rot}))`);
      expect(Math.abs(u - v) * 32, `Drehung ${rot}`).toBeLessThan(20);      // Füße vorn bei Bild-x ±69, das Häuschen ist ±14 breit
    }
  });
  it('Garten-Teile kann man abreißen, sie geben nichts zurück; besetzte Felder bleiben, wie sie sind', () => {
    game("build('haus', 4, 6)");                                             // neben dem Riesenrad
    bau('riesenrad', 5, 5, 0);
    expect(game("state.tiles.get('4,6').b")).toBe('haus');
    const ek = game("[...state.edges].find(([k, e]) => e.b === 'zaun')[0]"), m0 = game('state.money');
    game(`removeEdge('${ek}')`);
    expect(game(`state.edges.has('${ek}')`)).toBe(false);
    expect(game('state.money')).toBe(m0);
  });
  it('alter Stand (5×5 bzw. 3×3): Bau rückt in die Mitte, Garten entsteht beim Laden; Speichern behält alles', () => {
    game("state.tiles.set('5,5', { b: 'riesenrad', lvl: 1, phase: WONDERS.riesenrad.phases.length }); state.tiles.set('15,15', { b: 'sternwarte', lvl: 1, rot: 1, phase: WONDERS.sternwarte.phases.length }); rebuildCover(); recalc()");
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    const ks = game("[...state.tiles].filter(([k, t]) => t.b === 'riesenrad' || t.b === 'sternwarte').map(([k, t]) => [k, t.b, !!t.g2]).sort()");
    expect(ks).toEqual([['16,16', 'sternwarte', true], ['6,6', 'riesenrad', true]]);   // 5×5 → 3×3 (+1), 3×3 → quer gedreht 2×1 (+1, +1)
    expect(zaehlen().e.zaun).toBe(10);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    const z = zaehlen();
    expect([z.e.zaun, z.e.hecke, z.t.weg]).toEqual([10, 13, 17]);            // kein zweiter Garten
    expect(game("[...state.tiles].filter(([k, t]) => t.b === 'riesenrad').map(([k]) => k)")).toEqual(['6,6']);
  });
  it('ganz alter Stand (vor v9: Riesenrad 3×3, Sternwarte 2×2): bleibt an seinem Platz bzw. rückt in die Mitte, wächst nicht mehr', () => {
    game("state.tiles.set('5,5', { b: 'riesenrad', lvl: 1, phase: WONDERS.riesenrad.phases.length }); state.tiles.set('15,15', { b: 'sternwarte', lvl: 1, phase: WONDERS.sternwarte.phases.length }); rebuildCover(); recalc()");
    game('(() => { const s = JSON.parse(JSON.stringify(serialize())); s.v = 8; adoptState(parseSave(s)); })()');
    expect(game("[...state.tiles].filter(([k, t]) => t.b === 'riesenrad' || t.b === 'sternwarte').map(([k, t]) => k).sort()")).toEqual(['16,15', '5,5']);   // Sternwarte 2×2 → 1×2 (+1, +0)
  });
});
