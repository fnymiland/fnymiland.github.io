const { loadGame, game } = require('./helpers/load-game');

// Block 41: Hecke, Zaun, Mauer als Linien auf den Kanten zwischen Feldern
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); plan = null; state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc()");
});
const line = (tool, a, b) => game(`setTool('${tool}'); startPlan('edge', ${JSON.stringify(a)}, ${JSON.stringify(b)}, true); runPlan()`);

describe('Kanten', () => {
  it('Eckpunkte → Kanten: waagerecht a, senkrecht b; jede Kante trennt genau zwei Felder', () => {
    expect(game("edgeKeyOf({ x: 5, y: 5 }, { x: 6, y: 5 })")).toBe('a5,5');
    expect(game("edgeKeyOf({ x: 5, y: 5 }, { x: 5, y: 6 })")).toBe('b5,5');
    expect(game("edgeTiles('a5,5')")).toEqual([[5, 4], [5, 5]]);
    expect(game("edgeTiles('b5,5')")).toEqual([[4, 5], [5, 5]]);
    expect(game("edgeBetween(5, 5, 5, 4)")).toBe('a5,5');
    expect(game("edgeBetween(4, 5, 5, 5)")).toBe('b5,5');
  });

  it('eine Linie mit Ecke: Anfang und Ende, dazwischen jede Kante, im gewählten Stil, kostet je Stück', () => {
    const m = game('state.money');
    expect(line('zaun', { x: 5, y: 5 }, { x: 8, y: 7 })).toBe(true);           // 3 waagerecht + 2 senkrecht
    expect(game('state.edges.size')).toBe(5);
    expect(game("state.edges.get('a5,5')")).toMatchObject({ b: 'zaun', style: 'latten' });
    expect(game("state.edges.has('b8,5') && state.edges.has('b8,6')")).toBe(true);
    expect(game('state.money')).toBe(m - 5 * game('ITEMS.zaun.cost'));
  });

  it('drüberziehen mit anderem Stil oder anderer Art färbt um; gleich = nichts zu tun', () => {
    line('zaun', { x: 5, y: 5 }, { x: 7, y: 5 });
    game("state.design.add('zaun:staketen'); chosenStyle.zaun = 'staketen'");
    line('zaun', { x: 5, y: 5 }, { x: 7, y: 5 });
    expect(game("state.edges.get('a5,5').style")).toBe('staketen');
    expect(game("(startPlan('edge', { x: 5, y: 5 }, { x: 7, y: 5 }, true), planInfo(plan).err)")).toBe('Hier ist schon alles fertig');
    game('plan = null');
    line('hecke', { x: 5, y: 5 }, { x: 7, y: 5 });
    expect(game("state.edges.get('a6,5').b")).toBe('hecke');
  });

  it('nicht mitten durch ein Gebäude, nicht fremdes Land', () => {
    game("state.tiles.set('10,10', { b: 'park', lvl: 1 }); recalc()");            // 3×3: 10–12
    expect(game("edgeError('zaun', 'b11,10')")).toBe('Nicht mitten durch ein Gebäude');
    expect(game("edgeError('zaun', 'b10,10')")).toBe(null);                    // am Rand geht
    expect(game("edgeError('zaun', 'a500,500')")).toBe('Das ist nicht dein Grundstück');
  });

  it('Stile: der erste ist frei, die anderen gibt es in der Kunstakademie', () => {
    expect(game("STYLES.zaun.filter(styleOk).map(s => s.id)")).toEqual(['latten']);
    expect(game("DESIGN_BY_ID['zaun:glas'].group")).toBe('Zäune');
    game("state.design.add('mauer:klinker')");
    expect(game("STYLES.mauer.filter(styleOk).map(s => s.id)")).toContain('klinker');
  });
});

describe('Tore, Bewohner, Schönheit', () => {
  it('wo ein Weg durchgeht, ist ein Tor – Bewohner gehen nur dort hindurch', () => {
    line('zaun', { x: 5, y: 5 }, { x: 8, y: 5 });
    expect(game("edgeBlocks(6, 4, 6, 5)")).toBe(true);
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); recalc()");
    expect(game("isGate('a6,5')")).toBe(true);
    expect(game("edgeBlocks(6, 4, 6, 5)")).toBe(false);
  });

  it('bringt Schönheit – insgesamt und für die Umgebung', () => {
    const b0 = game('T.beauty'), a0 = game('beautyAround(6, 6, 2)');
    line('hecke', { x: 5, y: 5 }, { x: 8, y: 5 });
    game('recalc()');
    expect(game('T.beauty')).toBeGreaterThan(b0);
    expect(game('beautyAround(6, 6, 2)')).toBeGreaterThan(a0);
  });

  it('das Album zählt Hecke, Zaun und Mauer', () => {
    line('mauer', { x: 5, y: 5 }, { x: 6, y: 5 });
    game('collectAlbum()');
    expect(game("state.album.has('b:mauer')")).toBe(true);
  });
});

describe('Ecken und Wege', () => {
  it('Stücke derselben Art an einem Eckpunkt schließen die Ecke (laufen weiter), andere Arten nicht', () => {
    game("state.edges.set('a5,5', { b: 'mauer', style: 'backstein' }); state.edges.set('b6,5', { b: 'mauer', style: 'backstein' }); state.edges.set('a7,5', { b: 'zaun', style: 'latten' })");
    expect(game("edgeJoins('a5,5', 'mauer', 6, 5)")).toBe(true);                // Ecke rechts: senkrechtes Stück
    expect(game("edgeJoins('a5,5', 'mauer', 5, 5)")).toBe(false);               // freies Ende
    expect(game("edgeJoins('b6,5', 'mauer', 6, 5)")).toBe(true);
    expect(game("edgeJoins('a7,5', 'zaun', 7, 5)")).toBe(false);                // Zaun zählt nicht als Mauer
  });

  it('neben einer Linie läuft der Weg bis an die Feldkante, ohne Linie nicht', () => {
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('7,6', { b: 'weg', lvl: 1, style: 'sand' })");
    expect(game("lineFill(6, 6, pathArms(6, 6), ROAD_W).length")).toBe(0);
    game("state.edges.set('a6,6', { b: 'hecke', style: 'niedrig' })");         // oben am Feld (6, 6)
    const r = game("lineFill(6, 6, pathArms(6, 6), ROAD_W)");
    expect(r.length).toBe(1);
    expect(Math.min(...r[0].map(p => p[1]))).toBe(-0.5);                        // bis an die Kante
  });
});

describe('Abreißen, Speichern, alte Stände', () => {
  it('Abriss im Rechteck nimmt Linien auf und um die Felder mit und erstattet sie', () => {
    line('zaun', { x: 5, y: 5 }, { x: 8, y: 5 });
    const m = game('state.money');
    game("setTool('abriss'); startPlan('rect', { x: 5, y: 5 }, { x: 7, y: 5 }, true); runPlan()");
    expect(game('state.edges.size')).toBe(0);
    expect(game('state.money')).toBe(m + 3 * game('ITEMS.zaun.cost'));
  });

  it('Speichern und Laden behält Art und Stil', () => {
    line('mauer', { x: 5, y: 5 }, { x: 5, y: 7 });
    const s = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(new Map(s.edges).get('b5,5')).toEqual({ b: 'mauer', style: 'backstein' });
  });

  it('alte Hecken-Ecken (kleine Deko) werden Büsche an derselben Stelle', () => {
    const d = game("(() => { const d = JSON.parse(JSON.stringify(serialize())); d.decos.push(['9,9', [{ b: 'hecke', rot: 0 }, null, null, null]]); return d; })()");
    const s = game(`parseSave(${JSON.stringify(d)})`);
    expect(new Map(s.decos).get('9,9')[0].b).toBe('busch');
  });

  it('alles lässt sich zeichnen (jede Art und jeder Stil, auch als Tor und im Vorschaubild)', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' })");
    for (const kind of ['hecke', 'zaun', 'mauer']) for (const st of game(`STYLES.${kind}.map(s => s.id)`)) {
      expect(() => game(`drawEdge('a6,5', { b: '${kind}', style: '${st}' }, 1.5, 0); drawEdge('a9,9', { b: '${kind}', style: '${st}' }, 1.5, 0)`), `${kind} ${st}`).not.toThrow();
      expect(() => game(`chosenStyle.${kind} = '${st}'; state.design.add('${kind}:${st}'); thumbRaw('${kind}')`)).not.toThrow();
    }
  });
});
