const { loadGame, game } = require('./helpers/load-game');

// Block 53: Standortboni – ein guter Platz bringt bis +50 %, ein schlechter nie weniger als normal
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3");
  game("state.techs.delete('rotor'); state.techs.delete('stromnetz'); state.techs.delete('axt')");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const site = (b, x, y) => game(`siteOf('${b}', '${x},${y}', 0).f`);
const terra = (list, v) => game(`for (const [x, y] of ${JSON.stringify(list)}) state.terra.set(x + ',' + y, '${v}'); recalc()`);
const ring2 = (x, y) => { const out = []; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i || j) out.push([x + i, y + j]); return out; };

describe('Windrad', () => {
  it('auf freier Wiese normal, am Wasser/Fels bis +50 % – mehr Strom', () => {
    game("state.tiles.set('10,10', { b: 'windrad', lvl: 1 }); recalc()");
    expect(site('windrad', 10, 10)).toBe(0);
    expect(game('T.rail.power.supply')).toBe(1);
    terra(ring2(10, 10).filter(([, y]) => y === 12), 'water');                         // 5 Wasserfelder
    terra([[8, 8], [9, 8], [10, 8]], 'rock');                                          // + 3 Fels
    expect(site('windrad', 10, 10)).toBe(0.5);
    expect(game('T.rail.power.supply')).toBe(1.5);
  });

  it('Windschatten nimmt nur den Bonus weg, nie mehr', () => {
    terra(ring2(10, 10).filter(([, y]) => y === 12), 'water'); terra([[8, 8], [9, 8], [10, 8]], 'rock');
    game("build('haus', 11, 10, true); build('haus', 9, 10, true)");
    expect(site('windrad', 10, 10)).toBe(0.25);
    terra([[9, 9], [10, 9], [11, 9], [9, 11], [10, 11], [11, 11]], 'forest');
    expect(site('windrad', 10, 10)).toBe(0);                                            // nicht negativ
  });
});

describe('Rohstoff-Betriebe', () => {
  it('Holzfäller: mehr Wald ringsum → mehr Holz', () => {
    game("state.terra.set('10,10', 'forest'); state.tiles.set('10,10', { b: 'holz', lvl: 1 }); recalc()");
    const before = game("T.st.get('10,10').prod.holz");
    terra(ring2(10, 10).slice(0, 12), 'forest');
    expect(site('holz', 10, 10)).toBe(0.5);
    expect(game("T.st.get('10,10').prod.holz")).toBeCloseTo(before * 1.5);
  });

  it('Obstplantage zählt auch Obstbäume daneben', () => {
    game("state.terra.set('10,10', 'obst'); state.tiles.set('10,10', { b: 'obst', lvl: 1 }); recalc()");
    const a = site('obst', 10, 10);
    game("buildSmall('baum', 11, 10, 0); buildSmall('baum', 9, 10, 0)");
    expect(site('obst', 10, 10)).toBeCloseTo(a + 2 * 0.5 / 12);
  });
});

describe('Strom-Anlagen', () => {
  it('Solarfeld: Wiese +25 %, Sand +50 %, hohe Nachbarn werfen Schatten', () => {
    expect(site('solarfeld', 10, 10)).toBe(0.25);
    terra([[10, 10], [11, 10], [10, 11], [11, 11]], 'sand');
    expect(site('solarfeld', 10, 10)).toBe(0.5);
    game("build('haus', 12, 10, true); build('haus', 12, 11, true); build('haus', 9, 10, true)");
    expect(site('solarfeld', 10, 10)).toBe(0.25);
  });

  it('Wasserkraft: je mehr Wasser ringsum', () => {
    terra([[11, 10]], 'water');
    expect(site('wasserkraft', 10, 10)).toBe(0);
    terra([[11, 9], [11, 11], [10, 11], [9, 11], [10, 9]], 'water');
    expect(site('wasserkraft', 10, 10)).toBe(0.5);
  });

  it('Offshore: weiter draußen mehr; Geothermie: nah an der Quelle mehr', () => {
    const near = game(`(() => { for (let y = -40; y < 60; y++) for (let x = -40; x < 60; x++) if (isSea(x, y) && landWithin(x, y, 1)) return [x, y]; })()`);
    const far = game(`(() => { for (let y = -60; y < 80; y++) for (let x = -60; x < 80; x++) if (isSea(x, y) && !landWithin(x, y, 5) && landWithin(x, y, 6)) return [x, y]; })()`);
    expect(site('offshore', ...near)).toBe(0);
    expect(site('offshore', ...far)).toBe(0.5);
    const [lx, ly] = game('isleAnchor(ISLE_BY_ID.quelle)');
    expect(site('geothermie', lx + 3, ly)).toBe(0.5);                                   // direkt neben der Quelle
    expect(site('geothermie', lx + 10, ly)).toBe(0);
  });
});

describe('Anzeige', () => {
  it('Vorschau beim Bauen nennt Strom und Platz; das Fenster sagt, was mehr brächte', () => {
    terra(ring2(10, 10).filter(([, y]) => y === 12), 'water');
    const pv = game("previewDelta('windrad', 10, 10)");
    expect(pv.pow).toBeCloseTo(1 + 5 / 16);
    expect(game('siteLabel(previewDelta("windrad", 10, 10).site)')).toBe('🌬️ Windiger Platz +31 %');
    game("build('windrad', 10, 10, true); recalc(); openInfo(10, 10)");
    expect(game("document.getElementById('panel').textContent")).toMatch(/Windiger Platz: \+31 %.*Am Wasser oder neben Fels/);
  });
});
