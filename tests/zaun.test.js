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

  it('neben einer Linie läuft der Weg bis an die Feldkante – von selbst nur am Park, sonst per Schalter (Block 57)', () => {
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('7,6', { b: 'weg', lvl: 1, style: 'sand' })");
    expect(game("lineFill(6, 6, pathArms(6, 6), ROAD_W).length")).toBe(0);
    game("state.edges.set('a6,6', { b: 'hecke', style: 'niedrig' }); state.edges.set('a7,6', { b: 'hecke', style: 'niedrig' })");   // oben an (6, 6) und (7, 6)
    expect(game("lineFill(6, 6, pathArms(6, 6), ROAD_W).length")).toBe(0);      // ohne Park: Grasstreifen bleibt
    game("state.terra.set('6,5', 'park')");                                      // Park auf der anderen Seite
    const r = game("lineFill(6, 6, pathArms(6, 6), ROAD_W)");
    expect(r.length).toBe(1);
    expect(Math.min(...r[0].map(p => p[1]))).toBe(-0.5);                        // bis an die Kante
    game("setFlush('a6,6', false)");                                             // Schalter: aus – für die ganze Linie
    expect(game("lineFill(6, 6, pathArms(6, 6), ROAD_W).length")).toBe(0);
    expect(game("state.edges.get('a7,6').flush")).toBe(false);
    game("state.terra.delete('6,5'); setFlush('a7,6', true)");                    // an – auch ohne Park
    expect(game("lineFill(6, 6, pathArms(6, 6), ROAD_W).length")).toBe(1);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.edges.get('a6,6').flush")).toBe(true);                     // wird gespeichert
  });

  it('im Fenster der Linie: „Bündig“ / „Mit Grasstreifen“ umschalten', () => {
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,6', { b: 'zaun', style: 'latten' }); openGateInfo('a6,6')");
    game("document.querySelector('[data-flush=\"1\"]').click()");
    expect(game("state.edges.get('a6,6').flush")).toBe(true);
    game("document.querySelector('[data-flush=\"0\"]').click()");
    expect(game("state.edges.get('a6,6').flush")).toBe(false);
  });
});

describe('Runde Ecken', () => {
  it('jede L-Ecke derselben Art ist rund – mit Weg innen folgt der Weg, mit Weg außen füllt der Belag; andere Art: eckig', () => {
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,6', { b: 'hecke', style: 'hoch' }); state.edges.set('b6,6', { b: 'hecke', style: 'hoch' })");
    expect(game("roundCorner(6, 6)")).toMatchObject({ ka: 'a6,6', kb: 'b6,6', du: 1, dv: 1, inPath: true });
    expect(game("roundArc(roundCorner(6, 6), 2)")[0]).toEqual([5.5 + 0.35, 5.5]);   // Anfang auf dem waagerechten Stück
    game("state.tiles.delete('6,6')");
    expect(game("roundCorner(6, 6)")).toMatchObject({ inPath: false, outWeg: null });   // ohne Weg: trotzdem rund
    game("state.tiles.set('5,5', { b: 'weg', lvl: 1, style: 'kopf' })");             // Weg diagonal außen (Innenseite einer Kurve)
    expect(game("roundCorner(6, 6).outWeg")).toBe('kopf');
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' })");
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('b6,6', { b: 'mauer', style: 'backstein' })");
    expect(game("roundCorner(6, 6)")).toBe(null);
  });

  it('der Weg folgt dem Bogen; die Bank in der Seitenmitte rückt von der Linie weg', () => {
    game("state.tiles.set('6,6', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,6', { b: 'hecke', style: 'hoch', flush: true }); state.edges.set('b6,6', { b: 'hecke', style: 'hoch', flush: true })");
    const fill = game("lineFill(6, 6, pathArms(6, 6), ROAD_W)");
    expect(fill.some(poly => poly.length > 4)).toBe(true);                          // Eckstück mit Bogen
    expect(game("slotPos(6, 6, 5)")[1]).toBeCloseTo(-0.28);                        // an der Linie nach innen
    expect(game("slotPos(6, 6, 7)")[1]).toBeCloseTo(0.4);                           // frei: weit außen
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

  it('runde Ecken lassen sich in jedem Stil zeichnen (Muster läuft durch den Bogen)', () => {
    for (const kind of ['hecke', 'zaun', 'mauer']) for (const st of game(`STYLES.${kind}.map(s => s.id)`)) {
      game(`state.edges.clear(); state.edges.set('a12,12', { b: '${kind}', style: '${st}' }); state.edges.set('b12,12', { b: '${kind}', style: '${st}' })`);
      expect(game('!!roundCorner(12, 12)')).toBe(true);
      expect(() => game(`drawEdge('a12,12', state.edges.get('a12,12'), 1.5, 0); drawEdge('b12,12', state.edges.get('b12,12'), 1.5, 0)`), `${kind} ${st}`).not.toThrow();
    }
  });

  it('alles lässt sich zeichnen (jede Art und jeder Stil, auch als Tor und im Vorschaubild)', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' })");
    for (const kind of ['hecke', 'zaun', 'mauer']) for (const st of game(`STYLES.${kind}.map(s => s.id)`)) {
      expect(() => game(`drawEdge('a6,5', { b: '${kind}', style: '${st}' }, 1.5, 0); drawEdge('a9,9', { b: '${kind}', style: '${st}' }, 1.5, 0)`), `${kind} ${st}`).not.toThrow();
      expect(() => game(`chosenStyle.${kind} = '${st}'; state.design.add('${kind}:${st}'); thumbRaw('${kind}')`)).not.toThrow();
    }
  });
});

describe('Endstücke, Torbögen, Licht', () => {
  beforeEach(() => game("state.money = 1e6; for (const d of DESIGN) state.design.add(d.id)"));

  it('freie Enden erkennen (dort kommt das Endstück hin)', () => {
    game("state.edges.set('a5,5', { b: 'mauer', style: 'backstein' }); state.edges.set('a6,5', { b: 'mauer', style: 'backstein' })");
    expect(game("freeEnd('a5,5', 5, 5)")).toBe(true);
    expect(game("freeEnd('a5,5', 6, 5)")).toBe(false);
    expect(game("freeEnd('a6,5', 7, 5)")).toBe(true);
  });

  it('Torbogen nur über einem Durchgang; kostet, bringt Schönheit, wird gespeichert und erstattet', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,5', { b: 'hecke', style: 'hoch' }); state.edges.set('a8,5', { b: 'hecke', style: 'hoch' }); recalc()");
    expect(game("setArch('a8,5', 'bogen')")).toBe(false);                        // kein Durchgang
    const m = game('state.money'), b0 = game('T.beauty');
    expect(game("setArch('a6,5', 'rosen')")).toBe(true);
    expect(game('state.money')).toBe(m - game('ARCHES.rosen.cost'));
    expect(game('T.beauty')).toBeGreaterThan(b0);
    expect(new Map(game('parseSave(JSON.parse(JSON.stringify(serialize())))').edges).get('a6,5').arch).toBe('rosen');
    game("setArch('a6,5', 'bogen')");
    expect(game('state.money')).toBe(m - game('ARCHES.bogen.cost'));             // Unterschied zurück
    game("removeEdge('a6,5')");
    expect(game('state.money')).toBe(m + game('ITEMS.hecke.cost'));
  });

  it('Durchgang antippen öffnet das Fenster mit Offen / Torbogen / Rosenbogen', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,5', { b: 'zaun', style: 'latten' }); recalc(); openGateInfo('a6,5')");
    const btns = [...document.querySelectorAll('#panel [data-arch]')].map(b => b.dataset.arch);
    expect(btns).toEqual(['', 'bogen', 'rosen']);
    document.querySelector('#panel [data-arch="bogen"]').click();
    expect(game("state.edges.get('a6,5').arch")).toBe('bogen');
  });

  it('Lichter zählen wie Laternen: nur beleuchtete Stile, mit ihren Endpfeilern (Hecke nicht), schlichte Stile gar nicht', () => {
    game("state.edges.set('a5,5', { b: 'mauer', style: 'laternen' }); state.edges.set('a5,8', { b: 'hecke', style: 'lichter' }); state.edges.set('a5,10', { b: 'hecke', style: 'niedrig' }); state.edges.set('a5,12', { b: 'mauer', style: 'backstein' }); state.edges.set('a5,14', { b: 'zaun', style: 'latten' })");
    const lamps = game('edgeLamps()');
    expect(lamps).toContain('Ea5,8');
    expect(lamps).toEqual(expect.arrayContaining(['Ea5,5', 'P5,5', 'P6,5']));
    expect(lamps.some(l => /,(10|12|14)$/.test(l))).toBe(false);
  });

  it('Torbogen und Torpfeiler haben nur bei beleuchteten Stilen eine Laterne', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,5', { b: 'mauer', style: 'laternen' }); recalc()");
    expect(game('edgeLamps()')).toEqual(expect.arrayContaining(['G0a6,5', 'G1a6,5']));
    game("state.edges.get('a6,5').arch = 'rosen'");
    expect(game('edgeLamps()')).toContain('Aa6,5');
    expect(game('edgeLamps()').some(l => l.startsWith('G'))).toBe(false);
    game("state.edges.get('a6,5').style = 'backstein'");
    expect(game('edgeLamps()')).toEqual([]);
  });

  it('An der Mauer ist der Torbogen ein Paar hoher Torpfeiler (bei Laternen-Mauer je eine Laterne)', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' }); state.edges.set('a6,5', { b: 'mauer', style: 'laternen', arch: 'bogen' }); recalc()");
    expect(game('edgeLamps()')).toEqual(expect.arrayContaining(['G0a6,5', 'G1a6,5']));
    expect(game('edgeLamps()')).not.toContain('Aa6,5');
    expect(game("archLabel('mauer', 'bogen')")).toContain('Torpfeiler');
    expect(game("archLabel('zaun', 'bogen')")).toContain('Torbogen');
    expect(game("archLabel('hecke', 'bogen')")).toContain('Rankbogen');
  });

  it('Lichterkette und Blüten stehen im Bogen so dicht wie auf dem geraden Stück', () => {
    const arc = game('(() => { const out = []; const pts = Array.from({ length: 11 }, (_, i) => [Math.cos(i / 10 * Math.PI / 2), Math.sin(i / 10 * Math.PI / 2)]); alongLine(pts, 8, 0, m => out.push(m)); return out.length; })()');
    expect(arc).toBe(Math.round(Math.PI / 2 * 8));                                // ¼-Kreis mit Radius 1: Länge π/2
    expect(game('(() => { let n = 0; alongLine([[0, 0], [1, 0]], 8, 0, () => n++); return n; })()')).toBe(8);
  });

  it('Endstücke, Bögen und Lichter lassen sich zeichnen (Tag und Nacht)', () => {
    game("state.tiles.set('6,4', { b: 'weg', lvl: 1, style: 'sand' }); state.tiles.set('6,5', { b: 'weg', lvl: 1, style: 'sand' })");
    for (const n of [0, 0.45]) for (const kind of ['hecke', 'zaun', 'mauer']) for (const arch of ['bogen', 'rosen', null]) for (const st of game(`STYLES.${kind}.map(s => s.id)`)) {
      expect(() => game(`night = ${n}; state.edges.clear(); state.edges.set('a6,5', { b: '${kind}', style: '${st}', arch: ${JSON.stringify(arch)} }); state.edges.set('a9,9', { b: '${kind}', style: '${st}' }); recalc(); drawEdge('a6,5', state.edges.get('a6,5'), 1.5, 0); drawEdge('a9,9', state.edges.get('a9,9'), 1.5, 0)`), `${kind} ${st} ${arch}`).not.toThrow();
    }
    game('night = 0');
  });
});

describe('Tor ohne Weg (Block 59)', () => {
  it('im Fenster „Hier ein Tor“: Gartentor, Bewohner gehen durch, Bogen möglich; „geschlossen“ nimmt Tor und Bogen (Taler zurück)', () => {
    game("state.money = 1e6; state.edges.set('a6,6', { b: 'zaun', style: 'latten' }); recalc()");
    expect(game("isGate('a6,6')")).toBe(false);
    expect(game('edgeBlocks(6, 5, 6, 6)')).toBe(true);
    game("openGateInfo('a6,6'); document.querySelector('[data-gate=\"1\"]').click()");
    expect(game("state.edges.get('a6,6').gate")).toBe(true);
    expect(game("isGate('a6,6') && gardenGate('a6,6')")).toBe(true);
    expect(game('edgeBlocks(6, 5, 6, 6)')).toBe(false);                      // man kommt durch
    expect(game("document.getElementById('panel').textContent")).toMatch(/Gartentor/);
    const m = game('state.money');
    expect(game("setArch('a6,6', 'rosen')")).toBe(true);
    game("document.querySelector('[data-gate=\"0\"]').click()");
    expect(game("state.edges.get('a6,6').gate")).toBe(undefined);
    expect(game("state.edges.get('a6,6').arch")).toBe(undefined);
    expect(game('state.money')).toBe(m);                                       // Bogen erstattet
  });

  it('wird gespeichert, überlebt Umfärben, und lässt sich zeichnen', () => {
    game("state.edges.set('b6,6', { b: 'hecke', style: 'hoch', gate: true }); state.edges.set('a8,8', { b: 'mauer', style: 'backstein', gate: true, arch: 'bogen' })");
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("state.edges.get('b6,6').gate")).toBe(true);
    game("chosenStyle.hecke = 'niedrig'; buildEdge('hecke', 'b6,6')");
    expect(game("state.edges.get('b6,6')")).toMatchObject({ style: 'niedrig', gate: true });
    expect(() => game("for (const [k, e] of state.edges) drawEdge(k, e, 1.5, 1000)")).not.toThrow();
  });
});
