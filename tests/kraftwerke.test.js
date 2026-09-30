const { loadGame, game } = require('./helpers/load-game');

// Strom ausbauen: Kategorie im Menü, Windrad-Stufen und Forschung, vier Kraftwerke, neue Verbraucher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 3; y <= 14; y++) for (let x = 5; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game('recalc()');
});
const t = k => game(`state.tiles.get('${k}')`);

describe('Menü', () => {
  it('„⚡ Strom“ ist ein Filter unter Herstellen – das Windrad steht nicht mehr bei „Verbinden“', () => {
    expect(game("MENU.find(m => m.id === 'herstellen').groups.find(g => g.id === 'strom').items")).toEqual(['windrad', 'offshore', 'wasserkraft', 'solarfeld', 'geothermie', 'wellen']);
    expect(game("MENU.find(m => m.id === 'stadt').groups.find(g => g.id === 'verkehr').items")).not.toContain('windrad');
  });
});

describe('Windrad: Stufen und Forschung', () => {
  it('1 → 2 → 3 ⚡; Rotorblätter +50 %, Stromnetz +25 %', () => {
    game("state.tiles.set('6,6', { b: 'windrad', lvl: 1 }); recalc()");
    expect(game('T.rail.power.supply')).toBe(1);
    game("state.tiles.get('6,6').lvl = 2; recalc()");
    expect(game('T.rail.power.supply')).toBe(2);
    game("state.tiles.get('6,6').lvl = 3; state.techs.add('rotor'); recalc()");
    expect(game('T.rail.power.supply')).toBe(4.5);
    game("state.techs.add('stromnetz'); recalc()");
    expect(game('T.rail.power.supply')).toBeCloseTo(5.625);
  });

  it('alle Kraftwerke: Stufe 2 doppelt, Stufe 3 dreimal so viel – jede Stufe erst nach der Forschung', () => {
    for (const [b, base] of [['windrad', 1], ['wasserkraft', 4], ['solarfeld', 3], ['geothermie', 8], ['wellen', 5]]) {
      expect(game(`POWER_OUT.${b}`), b).toEqual([base, base * 2, base * 3]);
      expect(game(`BUILD_STAGES.${b}.up.map(u => u.tech)`), b).toEqual(['kraftwerk2', 'kraftwerk3']);
    }
    game("state.tiles.set('6,6', { b: 'geothermie', lvl: 1 }); recalc()");
    const info = game("stageInfo(state.tiles.get('6,6'), 6, 6)");
    expect(info.next.name).toBe('Geothermie-Werk');
    expect(info.ready).toBe(false);
    expect(info.conds[0].text).toContain('Größere Kraftwerke');
    game("state.techs.add('kraftwerk2'); recalc()");
    expect(game("stageInfo(state.tiles.get('6,6'), 6, 6).ready")).toBe(true);
    game("state.tiles.get('6,6').lvl = 3; recalc()");
    expect(game('T.rail.power.supply')).toBe(24);
  });

  it('die Forschungen gibt es', () => {
    for (const id of ['rotor', 'wasserkraft', 'wellen', 'stromnetz', 'kraftwerk2', 'kraftwerk3']) expect(game(`!!TECH_BY_ID.${id}`), id).toBe(true);
  });
});

describe('Kraftwerke', () => {
  it('Wasserkraftwerk: erst mit Forschung, nur direkt am Wasser, 4 ⚡', () => {
    game("state.terra.set('9,6', 'water'); recalc()");
    expect(game("available('wasserkraft')")).toBe(false);
    game("state.techs.add('wasserkraft')");
    expect(game("placeError('wasserkraft', 6, 12)")).toBe('Muss direkt am Wasser stehen');
    expect(game("build('wasserkraft', 8, 6, true)")).toBe(true);
    expect(game('T.rail.power.supply')).toBe(4);
  });

  it('Solarfeld (2×2) mit Kristall: 3 ⚡', () => {
    game('state.restore.kristall = 1');
    expect(game("build('solarfeld', 6, 6, true)")).toBe(true);
    expect(game('T.rail.power.supply')).toBe(3);
  });

  it('Geothermie nur auf der Quelleninsel: 8 ⚡', () => {
    game('state.restore.quelle = 2');
    expect(game("placeError('geothermie', 6, 6)")).toMatch(/Quelleninsel/);
    game("globalThis.__ra = regionAt; regionAt = () => 'quelle'");
    expect(game("placeError('geothermie', 6, 6)")).toBe(null);
    game("build('geothermie', 6, 6, true); regionAt = globalThis.__ra");
    expect(game('T.rail.power.supply')).toBe(8);
  });

  it('Wellenkraftwerk: ins Meer direkt vor der Küste, das Feld wird deins: 5 ⚡', () => {
    game("state.techs.add('wasserkraft'); state.techs.add('wellen')");
    // Meeresfeld direkt neben eigenem Land, dazu ein Landfeld und ein Meeresfeld weit draußen
    const [x, y, lx, ly] = game(`(() => { for (let y = -30; y < 35; y++) for (let x = -30; x < 40; x++) {
      if (!isSea(x, y) || COVER.has(x + ',' + y)) continue;
      const l = DIRS.find(([dx, dy]) => ownedTile(x + dx, y + dy) && terrainAt(x + dx, y + dy) !== 'water');
      if (l) return [x, y, x + l[0], y + l[1]];
    } })()`);
    expect(game(`placeError('wellen', ${lx}, ${ly})`)).toBe('Ins Meer vor die Küste bauen');
    const [fx, fy] = game(`(() => { for (let x = 60; x < 90; x++) if (isSea(x, 2) && !claimable(x, 2) && !ownedTile(x, 2) && inWorld(x, 2)) return [x, 2]; })()`);
    expect(game(`placeError('wellen', ${fx}, ${fy})`)).toBe('Im Meer nur direkt neben deinem Land');
    expect(game(`build('wellen', ${x}, ${y}, true)`)).toBe(true);
    expect(game(`ownedTile(${x}, ${y})`)).toBe(true);
    expect(game('T.rail.power.supply')).toBe(5);
  });

  it('alle Kraftwerke lassen sich zeichnen (Tag und Nacht, jede Richtung, Windrad in jeder Stufe)', () => {
    for (const b of ['wasserkraft', 'solarfeld', 'geothermie', 'wellen', 'windrad']) for (let lvl = 1; lvl <= 3; lvl++) for (let rot = 0; rot < 4; rot++) for (const night of [0, 0.8]) {
      expect(() => game(`night = ${night}; drawObject('${b}', 300, 300, 1, 1000, 6, 6, ${lvl}, { b: '${b}', lvl: ${lvl}, rot: ${rot} })`), `${b} ${lvl} ${rot}`).not.toThrow();
    }
    game('night = 0');
  });
});

describe('Neue Verbraucher', () => {
  const finish = (k) => game(`state.tiles.get('${k}').phase = WONDERS[state.tiles.get('${k}').b].phases.length`);
  it('Monumente brauchen je 100 ⚡, das Schloss 300 – ohne Strom nur halb (Riesenrad steht)', () => {
    expect(game("['riesenrad', 'sternwarte', 'botgarten', 'seebruecke', 'schloss'].map(b => CONSUMERS[b])")).toEqual([100, 100, 100, 100, 300]);
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; state.tiles.set('5,5', { b: 'riesenrad', lvl: 1, phase: 0 })"); finish('5,5');
    game("state.tiles.set('12,12', { b: 'geothermie', lvl: 3 }); recalc()");                   // 24 ⚡ reichen nicht
    expect(game("T.st.get('5,5').noPower")).toBe(true);
    expect(game('T.wonders.riesenrad')).toBe(0.5);                                            // Bonus halb
    for (let i = 0; i < 4; i++) game(`state.tiles.set('${10 + i * 2},3', { b: 'geothermie', lvl: 3 })`);   // 5 × 24 = 120 ⚡
    game('recalc()');
    expect(game("T.st.get('5,5').noPower")).toBeFalsy();
    expect(game('T.wonders.riesenrad')).toBe(1);
  });

  it('der letzte Abschnitt jedes Wunderwerks kostet mindestens 1 Mio. Taler', () => {
    for (const id of game('Object.keys(WONDERS)')) {
      const n = game(`WONDERS.${id}.phases.length`);
      expect(game(`wonderCost({ b: '${id}', rate: 1 }, ${n - 1}).money`), id).toBeGreaterThanOrEqual(1e6);
    }
  });

  it('Universität ohne Strom: halbe Ideen', () => {
    game("state.restore.klippe = 3; state.tiles.set('6,6', { b: 'uni', lvl: 1 }); state.tiles.set('3,3', { b: 'haus', lvl: 5 }); recalc()");
    const s0 = game("T.st.get('6,6').sci");
    game("state.tiles.set('12,12', { b: 'windrad', lvl: 2 }); recalc()");
    expect(game("T.st.get('6,6').sci")).toBeCloseTo(s0 * 2);
  });

  it('Baustellen brauchen noch keinen Strom', () => {
    game("state.restore = { baum: 3, obsthain: 3, klippe: 3, ruine: 1 }; state.tiles.set('5,5', { b: 'riesenrad', lvl: 1, phase: 1 }); recalc()");
    expect(game('T.rail.power.demand')).toBe(0);
  });

  it('das Infofenster eines Kraftwerks zeigt Leistung und Bilanz', () => {
    game("state.tiles.set('6,6', { b: 'windrad', lvl: 3 }); state.techs.add('rotor'); recalc(); openInfo(6, 6)");
    const txt = document.getElementById('panel').textContent;
    expect(txt).toContain('Liefert 4,5 Strom');
    expect(txt).toContain('erzeugt');
  });
});

describe('Offshore-Windrad (Block 48)', () => {
  it('erst mit Forschung; ins Meer vor die Küste oder bis 6 Felder weiter draußen; doppelt so viel Strom wie ein volles Windrad', () => {
    game("state.techs.delete('offshore'); state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 999; recalc()");
    const sea = game(`(() => { for (let y = -40; y < 60; y++) for (let x = -40; x < 60; x++) if (isSea(x, y) && nearOwnLand(x, y) && !COVER.has(x + ',' + y)) return [x, y]; })()`);
    expect(sea).toBeTruthy();
    const [sx, sy] = sea;
    expect(game(`placeError('offshore', ${sx}, ${sy})`)).toMatch(/Offshore|erst/);
    game("state.techs.add('offshore')");
    expect(game(`placeError('offshore', ${sx}, ${sy})`)).toBe(null);
    const far = game(`(() => { for (let y = -60; y < 80; y++) for (let x = -60; x < 80; x++) if (isSea(x, y) && !landWithin(x, y, 3) && landWithin(x, y, 6)) return [x, y]; })()`);
    expect(game(`placeError('offshore', ${far[0]}, ${far[1]})`)).toBe(null);                        // weiter draußen
    const tooFar = game(`(() => { for (let y = -80; y < 100; y++) for (let x = -80; x < 100; x++) if (isSea(x, y) && !landWithin(x, y, 7)) return [x, y]; })()`);
    if (tooFar) expect(game(`placeError('offshore', ${tooFar[0]}, ${tooFar[1]})`)).toMatch(/Felder vor deiner Küste/);
    expect(game(`placeError('offshore', 5, 5)`)).toMatch(/Meer/);                                    // an Land nicht
    expect(game("powerOf({ b: 'offshore', lvl: 1 })")).toBe(2 * game("powerOf({ b: 'windrad', lvl: 3 })"));
    game("state.techs.add('rotor')");
    expect(game("powerOf({ b: 'offshore', lvl: 1 })")).toBe(2 * game("powerOf({ b: 'windrad', lvl: 3 })"));
    expect(game(`build('offshore', ${far[0]}, ${far[1]}, true)`)).toBe(true);
    expect(game(`ownedTile(${far[0]}, ${far[1]})`)).toBe(true);                                       // das Feld gehört jetzt dir
  });
});
