const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 2: Rampe in die Anhöhe (hills.js) – Bauen vor der Wand und in den Rand, Länge 1/2, Drehung, Meldungen, Leiste und Fenster,
// Höhe (rampHeight, surfaceHeight), wer wohin kommt (levelLink: Rampe für alle, Treppe für Wegenetz und Fußgänger, nicht für Fahrzeuge), was oben darf (Wege, Plätze), Zeichnen
// (bündig wie im Entwurf tools/rampe-entwurf.js). Braucht den Einbau in rules.js/actions.js/render.js/draw-objects.js (sizeOf, placeRot,
// placeError, build, drawObject …)
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewLen = 1; hillWalkers.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const weg = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('weg', x, y, true); recalc()`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i])(rampAt(${x}, ${y}))`);
const H = 26;
// vor jeder Seite der Anhöhe 10–13 × 10–13: getipptes Feld (Anker), Drehung, Fuß, oberes Feld – Länge 1 und 2 (vor die Wand gestellt)
const SIDES1 = [[11, 14, 0], [14, 11, 3], [11, 9, 2], [9, 11, 1]];
const SIDES2 = [[11, 14, 0, [11, 15], [11, 14]], [14, 11, 3, [15, 11], [14, 11]], [11, 8, 2, [11, 8], [11, 9]], [8, 11, 1, [8, 11], [9, 11]]];

describe('Rampe: Daten, Menü, Leiste', () => {
  it('in der Gruppe Anhöhen hinter der Treppe, mit Kurzwirkung und Tipp; keine Deko (Schönheit 0)', () => {
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(g => g.id === 'hoehen').items")).toEqual(['anhoehe', 'huegeltreppe', 'huegelrampe']);
    expect(game("[ITEMS.huegelrampe.name, ITEMS.huegelrampe.tech, ITEMS.huegelrampe.beauty, !!FX.huegelrampe, !!ITEM_TIPS.huegelrampe]")).toEqual(['Rampe (Anhöhe)', 'terraform', 0, true, true]);
  });

  it('Leiste: Belag wie die Wege (ohne Trittsteine, ohne Wegform) und Länge 1 / 2', () => {
    game("setTool('huegelrampe')");
    const bar = () => game("document.getElementById('style-bar').innerHTML");
    expect(bar()).toMatch(/data-wpop="muster"/);
    expect(bar()).not.toMatch(/data-wegopt/);
    expect(game("[...document.querySelectorAll('#style-bar [data-rlen]')].map(b => [b.dataset.rlen, b.classList.contains('on')])")).toEqual([['1', true], ['2', false]]);
    game("document.querySelector('#style-bar [data-rlen=\"2\"]').click()");
    expect(game('rampNewLen')).toBe(2);
    expect(game("document.querySelector('#style-bar [data-rlen=\"2\"]').classList.contains('on')")).toBe(true);
    game("document.querySelector('#style-bar [data-wpop=\"muster\"]').click()");
    const pats = game("[...document.querySelectorAll('#style-bar [data-wm]')].map(b => b.dataset.wm)");
    expect(pats).toContain('platten');
    expect(pats).not.toContain('tritt');
    game("document.querySelector('#style-bar [data-wm=\"platten\"]').click()");
    expect(game('wegParts(chosenStyle.huegelrampe)[0]')).toBe('platten');
    expect(game('[rampStyleNew() === chosenStyle.huegelrampe, chosenStyle.weg]')).toEqual([true, 'sand']);
    expect(game("rampNew()")).toEqual({ style: game('chosenStyle.huegelrampe'), len: 2 });
    game("setTool('look')");
  });
});

describe('Rampe: Bauen, Länge, Drehung, Einsetzen', () => {
  it('Länge 1 unten vor der Wand: dreht sich von selbst hinauf, kostet Taler und Stein, führt hinauf', () => {
    hills(block(10, 10, 13, 13));
    const m0 = game('state.money'), s0 = game('state.res.stein');
    for (const [x, y, rot] of SIDES1) {
      game(`buildRot = ${(rot + 1) % 4}`);                                                    // gewählte Drehung passt nicht: dreht trotzdem hinauf
      expect(game(`placeRot('huegelrampe', ${x}, ${y})`)).toBe(rot);
      expect(game(`placeError('huegelrampe', ${x}, ${y})`)).toBe(null);
      expect(game(`build('huegelrampe', ${x}, ${y})`)).toBe(true);
      expect(ramp(x, y)).toEqual([`${x},${y}`, rot, 1, 0]);
    }
    expect(game('state.money')).toBe(m0 - 4 * game('ITEMS.huegelrampe.cost'));
    expect(game('state.res.stein')).toBe(s0 - 4 * game('ITEMS.huegelrampe.mat.stein'));
    expect(game('hillRamps().map(r => [r.k, r.rot, r.len, r.dx, r.dy, r.foot, r.top])')).toEqual(SIDES1.map(([x, y, r]) => [`${x},${y}`, r, 1, ...game(`STAIR_UP[${r}]`), [x, y], [x, y]]));
  });

  it('Länge 2: belegt zwei Felder in Steigrichtung (Anker = kleinstes x/y), Fuß und oberes Feld je Drehung; Speichern behält die Länge', () => {
    hills(block(10, 10, 13, 13));
    game('rampNewLen = 2');
    for (const [x, y, rot, foot, top] of SIDES2) {
      expect(game(`placeRot('huegelrampe', ${x}, ${y})`)).toBe(rot);
      expect(game(`build('huegelrampe', ${x}, ${y})`)).toBe(true);
      expect(game(`state.tiles.get('${x},${y}').len`)).toBe(2);
      expect(ramp(...foot)).toEqual([`${x},${y}`, rot, 2, 0]);
      expect(ramp(...top)).toEqual([`${x},${y}`, rot, 2, 1]);
      expect(game(`[COVER.get('${foot}'), COVER.get('${top}')]`)).toEqual([`${x},${y}`, `${x},${y}`]);   // Grundfläche [1, 2] (sizeOf)
      expect(game(`objAt(${foot[0]}, ${foot[1]}) === objAt(${top[0]}, ${top[1]})`)).toBe(true);
    }
    expect(game('hillRamps().length')).toBe(4);
    expect(game("placeError('haus', 11, 15)")).toMatch(/steht schon/);                       // das zweite Feld ist belegt
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize()))))');
    expect(game("[...state.tiles].filter(([, t]) => t.b === 'huegelrampe').map(([k, t]) => [k, t.rot || 0, t.len])")).toEqual(SIDES2.map(([x, y, r]) => [`${x},${y}`, r, 2]));
    expect(ramp(11, 15)).toEqual(['11,14', 0, 2, 0]);
    // Abreißen nimmt beide Felder, voll zurück
    const m0 = game('state.money');
    expect(game('demolishInfo(11, 15).full')).toBe(true);
    game('demolish(11, 15)');
    expect([ramp(11, 14), ramp(11, 15), game('state.money')]).toEqual([null, null, m0 + game('ITEMS.huegelrampe.cost')]);
  });

  it('in den Rand einer Anhöhe: Felder werden abgesenkt, die Erstattung verrechnet; ein Schritt für ↶', () => {
    hills(block(10, 10, 13, 13));
    const m0 = game('state.money'), cost = game('ITEMS.huegelrampe.cost'), back = game('ITEMS.anhoehe.cost');
    expect(game("placeError('huegelrampe', 11, 13)")).toBe(null);                             // Randfeld, Länge 1
    expect(game("rampIntoBack(11, 13, placeRot('huegelrampe', 11, 13))")).toBe(back);
    game("resetUndo(); undoable(() => build('huegelrampe', 11, 13))");
    expect([game("hillAt(11, 13)"), ramp(11, 13), game('state.money')]).toEqual([null, ['11,13', 0, 1, 0], m0 - cost + back]);
    expect(game('undo()')).toBe(true);
    expect([!!game("hillAt(11, 13)"), ramp(11, 13), game('state.money')]).toEqual([true, null, m0]);
    // Länge 2 ganz eingelassen (vorn Rand, hinten Anhöhe) und halb (oberes Feld im Rand, Fuß davor)
    game('rampNewLen = 2');
    expect(game("placeRot('huegelrampe', 12, 12)")).toBe(0);
    expect(game("rampIntoBack(12, 12, 0)")).toBe(2 * back);
    game("build('huegelrampe', 12, 12)");
    expect([game('hillAt(12, 12)'), game('hillAt(12, 13)'), ramp(12, 12), ramp(12, 13)]).toEqual([null, null, ['12,12', 0, 2, 1], ['12,12', 0, 2, 0]]);
    expect(game('state.money')).toBe(m0 - cost + 2 * back);
    game("build('huegelrampe', 10, 10)");                                                     // Ecke: oben links, hinauf nach +y oder +x
    expect(game('[rampAt(10, 10).rot, !!hillAt(10, 10)]')).toEqual([game("[2, 1].includes(rampAt(10, 10).rot) ? rampAt(10, 10).rot : -1"), false]);
    game("build('huegelrampe', 13, 10)");                                                     // rechts oben: hinauf nach −x (Anker = oberes Feld 12,10)
    expect(game('rampError(9, 13, 1, 2)')).toBe(null);                                        // halb: Fuß 9,13 unten, oberes Feld 10,13 im Rand
  });

  it('an einer Ecke passen zwei Richtungen: von selbst vor die Wand, selbst gedreht (⟳/R) längs der Wand (D) – Wand auf der einen, Keil mit Geländer auf der anderen Seite', () => {
    hills(block(10, 10, 13, 13).concat([[10, 14]]));                                          // vorspringendes Feld links vorn
    game('rampNewLen = 2');
    expect(game('rampDirs(11, 14, 2)')).toEqual([0, 3]);
    expect(game("placeRot('huegelrampe', 11, 14)")).toBe(0);                                  // von selbst: vor die Wand (nichts abgesenkt, Gleichstand → buildRot)
    game('buildRot = 1; rotManual = true');                                                   // selbst gedreht auf eine Richtung, die nicht passt: die nächste passende
    expect(game("placeRot('huegelrampe', 11, 14)")).toBe(3);
    expect(game("build('huegelrampe', 11, 14)")).toBe(true);
    expect([ramp(11, 14), ramp(12, 14)]).toEqual([['11,14', 3, 2, 1], ['11,14', 3, 2, 0]]);
    expect(game('(o => o.m + o.p)(rampLook(12, 14, rampAt(12, 14)))')).toBe('kh');           // −S = +y offen (Keil, Geländer), +S = −y die Wand der Anhöhe
    game('rotManual = false');
    // Weg vor dem Fuß gibt den Ausschlag (wie bei der Treppe)
    game("demolish(11, 14)"); weg([[11, 16]]);
    expect(game("placeRot('huegelrampe', 11, 14)")).toBe(0);
    game("state.tiles.delete('11,16'); recalc()"); weg([[13, 14]]);
    expect(game("placeRot('huegelrampe', 11, 14)")).toBe(3);
  });

  it('Meldungen: Wasser, Weg, frei auf der Wiese, Richtung, Mitte der Anhöhe, belegt, getragen, Dach, Linien quer', () => {
    hills(block(10, 10, 13, 13));
    expect(game("placeError('huegelrampe', 17, 17)")).toMatch(/vor die Wand/);
    game("state.terra.set('12,14', 'water'); recalc()");
    expect(game("placeError('huegelrampe', 12, 14)")).toBe('Nicht auf dem Wasser');
    weg([[13, 14]]);
    expect(game("placeError('huegelrampe', 13, 14)")).toMatch(/Nicht auf einen Weg/);
    expect(game("placeError('huegelrampe', 11, 14, 1)")).toMatch(/zur Anhöhe hinauf/);
    expect(game("placeError('huegelrampe', 11, 11)")).toMatch(/an den Rand der Anhöhe/);
    game("buildSmall('baum', 11, 13, CSLOT)");
    expect(game("placeError('huegelrampe', 11, 13)")).toMatch(/Hier steht: Baum/);           // eingelassen: das Feld muss leer sein
    expect(game("placeError('huegelrampe', 12, 13, 0, { move: true, t: { b: 'huegelrampe', rot: 0 } })")).toMatch(/Nur vor die Wand/);
    game("state.roofs.set('10,14', { form: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 10, 14)")).toMatch(/Überdachung/);
    // Länge 2: das zweite Feld zählt mit (links vor der Wand, hinauf nach +x: Fuß 8,y = Anker, oberes Feld 9,y)
    game("buildSmall('bank', 9, 12, 0); state.tiles.set('9,13', { b: 'brunnen', lvl: 1 }); recalc()");
    expect(game("rampError(8, 11, 1, 2)")).toBe(null);
    expect(game("rampError(8, 12, 1, 2)")).toMatch(/kleine Dekos/);
    expect(game("rampError(8, 13, 1, 2)")).toMatch(/nicht genug Platz/);
    // Linien: nicht quer vor den Fuß, nicht hinter das obere Feld, nicht durch die breite Rampe; an die Seite schon
    game("rampNewLen = 1; state.decos.clear(); state.roofs.clear(); state.terra.set('12,14', 'grass'); state.tiles.delete('13,14'); recalc()");
    expect(game("build('huegelrampe', 11, 14) && build('huegelrampe', 12, 14)")).toBe(true);
    expect(game("edgeError('zaun', edgeBetween(11, 14, 11, 15))")).toMatch(/quer vor die Rampe/);
    expect(game("edgeError('zaun', edgeBetween(11, 14, 12, 14))")).toMatch(/breite Rampe/);
    expect(game("edgeError('zaun', edgeBetween(12, 14, 13, 14))")).toBe(null);
    game("state.edges.set(edgeBetween(13, 14, 13, 15), { b: 'zaun', style: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 13, 14)")).toMatch(/Quer vor der Rampe steht: Zaun/);
    game("state.edges.clear(); state.edges.set(edgeBetween(12, 14, 13, 14), { b: 'hecke', style: 0 }); recalc()");
    expect(game("placeError('huegelrampe', 13, 14)")).toMatch(/Zwischen den Rampen steht: Hecke/);
  });

  it('Fuß frei und Anhöhe dahinter bleibt: kein Anheben/Teich vor dem Fuß, kein Abtragen dahinter, Rechteck-Abriss und ↶ wissen es', () => {
    hills(block(10, 10, 13, 13));
    game("build('huegelrampe', 11, 14)");
    expect(game('hillRaiseError(11, 15)')).toMatch(/Fuß der Rampe/);
    expect(game("placeError('graben', 11, 15)")).toMatch(/Fuß der Rampe/);
    expect(game('hillRaiseError(11, 14)')).toMatch(/Rampe/);
    expect(game('demolishInfo(11, 13).err')).toMatch(/Rampe hinauf/);
    expect(game('lowerHill(11, 13)')).toBe(false);
    expect(game("rampsAround(11, 13)")).toEqual([[11, 14]]);
    expect(game("rampsAround(11, 15, true)")).toEqual([[11, 14]]);
    game("tool = 'abriss'; plan = { kind: 'rect', tool: 'abriss', a: { x: 11, y: 12 }, b: { x: 11, y: 13 }, keepLand: true }");
    expect(game("planInfo(plan).firstErr")).toMatch(/Rampe hinauf/);
    game("plan = null; tool = 'look'");
    game('demolish(11, 14)');
    expect(game('lowerHill(11, 13)')).toBe(true);
    game("resetUndo(); undoable(() => lowerHill(12, 13))");                                   // ↶ einer Anhöhe, vor der inzwischen eine Rampe steht: geht nicht
    game("rampNewLen = 1; build('anhoehe', 12, 13); build('huegelrampe', 12, 14)");
    game("demolish(12, 14); lowerHill(12, 13); build('huegelrampe', 12, 13)");                // Rampe jetzt dort, wo die Anhöhe war: ↶ ginge ins Leere
    expect(game('undo()')).toBe(false);
  });
});

describe('Rampe: Höhe und Verbindungen', () => {
  it('rampHeight stetig linear vom Fuß (0) bis zur Hinterkante (HILL_H), über beide Felder; surfaceHeight passt an Anhöhe und Boden', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewLen = 2; build('huegelrampe', 11, 14); build('huegelrampe', 8, 11)");
    game("rampNewLen = 1; build('huegelrampe', 14, 11); build('huegelrampe', 12, 9)");
    for (const [fx, fy, rot, len] of [[11, 15, 0, 2], [8, 11, 1, 2], [14, 11, 3, 1], [12, 9, 2, 1]]) {
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), pts = [];
      for (let s = 0; s <= 40 * len; s++) {                                                   // vom Fuß (Vorderkante) bis hinter das obere Feld
        const d = -0.5 + s / 40, u = fx + Du * d + 0.13 * Dv, v = fy + Dv * d - 0.13 * Du;    // etwas neben der Mitte
        pts.push([d, game(`surfaceHeight(${u}, ${v})`)]);
      }
      for (const [d, h] of pts) expect(h).toBeCloseTo(H * (d + 0.5) / len, 9);
      expect(game(`surfaceHeight(${fx - Du * 0.7}, ${fy - Dv * 0.7})`)).toBe(0);              // davor: Boden
      expect(game(`surfaceHeight(${fx + Du * (len + 0.2)}, ${fy + Dv * (len + 0.2)})`)).toBe(H);   // dahinter: Anhöhe
      expect(game(`rampHeight(${fx}, ${fy}, ${fx + 2}, ${fy})`)).toBe(0);                      // außerhalb des Felds
    }
    expect(game('surfaceHeight(17.2, 17.4)')).toBe(0);
    expect(game('surfaceHeight(11.3, 11.2)')).toBe(H);
  });

  it('levelLink: Rampe verbindet für alle längs ihrer Achse (auch breit), nie quer zur Wiese; Treppe auch fürs Wegenetz, nur nicht für Fahrzeuge; ohne Anhöhen immer', () => {
    expect(game("[levelLink(3, 3, 4, 3), levelLink(3, 3, 4, 4, 'fuss')]")).toEqual([true, true]);   // ohne Anhöhen wie bisher
    hills(block(10, 10, 13, 13));
    game("rampNewLen = 2; build('huegelrampe', 11, 14); build('huegelrampe', 12, 14)");      // breite Rampe, 2 lang: 11/12,14 oben, 11/12,15 Fuß
    game("rampNewLen = 1; build('huegeltreppe', 14, 11)");                                  // Treppe rechts, hinauf nach −x
    const L = (a, b, c, d, who = 'weg') => game(`levelLink(${a}, ${b}, ${c}, ${d}, '${who}')`);
    for (const who of ['weg', 'fuss', 'fahr']) {
      expect([L(11, 16, 11, 15, who), L(11, 15, 11, 16, who)]).toEqual([true, true]);        // Feld davor ↔ Fuß
      expect([L(11, 15, 11, 14, who), L(11, 14, 11, 13, who), L(11, 13, 11, 14, who)]).toEqual([true, true, true]);   // Fuß ↔ oben ↔ Anhöhe
      expect([L(11, 15, 12, 15, who), L(12, 14, 11, 14, who)]).toEqual([true, true]);        // breit: quer gleiche Stufe
      expect([L(11, 15, 12, 14, who), L(11, 15, 10, 15, who), L(12, 14, 13, 14, who), L(10, 14, 11, 14, who)]).toEqual([false, false, false, false]);   // über Eck, quer zur Wiese/Anhöhe
      expect([L(11, 16, 12, 16, who), L(10, 11, 11, 11, who), L(13, 15, 13, 14, who), L(13, 14, 13, 13, who)]).toEqual([true, true, true, false]);   // ohne Rampe: gleiche Ebene
    }
    expect([L(15, 11, 14, 11, 'fahr'), L(14, 11, 13, 11, 'fahr')]).toEqual([false, false]);  // Treppe: keine Fahrzeuge
    for (const who of ['weg', 'fuss']) expect([L(15, 11, 14, 11, who), L(14, 11, 13, 11, who), L(14, 11, 14, 12, who), L(14, 12, 14, 11, who)]).toEqual([true, true, false, false]);   // Wegenetz (seit 10.10.2026) und zu Fuß
  });

  it('oben dürfen Wege (alle Stile), Deko-Felder und Platz-Dinge; Gebäude und Schienen nicht; anheben unter einem Weg geht jetzt', () => {
    hills(block(5, 5, 6, 6));
    game("chosenStyle.weg = 'kopf'");
    expect(game("placeError('weg', 5, 5)")).toBe(null);
    expect(game("placeError('brunnen', 6, 6, 0, { move: true })")).toBe(null);
    expect(game("placeError('haus', 5, 5)")).toMatch(/Gebäude auf Anhöhen/);
    expect(game("placeError('pb_gleis', 5, 5, 0, { move: true })")).toMatch(/Schienen/);
    expect(game("[hillOk('weg'), hillOk('huegelrampe'), hillOk('huegeltreppe'), hillOk('ubahn'), hillOk('haus')]")).toEqual([true, false, false, false, false]);
    expect(game(`hillOk(${JSON.stringify(Object.keys(game('STANDS'))[0])})`)).toBe(true);    // Marktstand
    game("build('weg', 8, 8, true); recalc()");
    expect(game('hillRaiseError(8, 8)')).toBe(null);
    game("chosenStyle.weg = 'sand'");
  });
});

describe('Rampe: breit, Fenster, Zeichnen', () => {
  it('breite Rampe: gleiche Richtung und Länge nebeneinander ohne Wange dazwischen; Wange an der Anhöhe, Keil mit Geländer an offener Seite', () => {
    game('state.paintNew.anhoehe = { form: 2 }');                                             // Trockenmauer
    hills(block(10, 10, 15, 13).concat([[10, 14]]));
    game("build('huegelrampe', 11, 14); build('huegelrampe', 12, 14); build('huegelrampe', 13, 14)");
    const look = (x, y) => game(`(o => o.m + o.p + ':' + o.kind)(rampLook(${x}, ${y}, rampAt(${x}, ${y})))`);
    expect([look(11, 14), look(12, 14), look(13, 14)]).toEqual(['hj:mauer', 'jj:mauer', 'jk:mauer']);
    expect(game('rampRow(12, 14).length')).toBe(3);
    // andere Länge daneben: keine breite Rampe (die Felder lägen auf verschiedener Höhe)
    game("rampNewLen = 2; build('huegelrampe', 14, 14)");
    expect(ramp(14, 15)).toEqual(['14,14', 0, 2, 0]);
    expect([look(13, 14), look(14, 14), game('rampRow(12, 14).length')]).toEqual(['jk:mauer', 'kk:mauer', 3]);
    expect(game("edgeError('zaun', edgeBetween(13, 14, 14, 14))")).toBe(null);
    // Fenster: Belag für die ganze breite Rampe, ↶ nimmt es zurück
    game('openInfo(11, 14)');
    const panel = game("document.getElementById('panel').textContent");
    expect(panel).toMatch(/Führt hinauf/);
    expect(panel).toMatch(/3 Rampen/);
    expect(game("!!document.getElementById('p-del') && !!document.getElementById('p-close')")).toBe(true);
    const st = game("state.tiles.get('11,14').style"), other = game(`[...document.querySelectorAll('#panel [data-rampbel]')].map(b => b.dataset.rampbel).find(s => s !== ${JSON.stringify(st)})`);
    game(`document.querySelector('#panel [data-rampbel=${JSON.stringify(other)}]').click()`);
    expect(game("['11,14', '12,14', '13,14'].map(k => state.tiles.get(k).style)")).toEqual([other, other, other]);
    expect(game('undo()')).toBe(true);
    expect(game("['11,14', '12,14', '13,14'].map(k => state.tiles.get(k).style)")).toEqual([st, st, st]);
    game('closePanel()');
    // Anhöhe hinter dem oberen Feld: vorn ohne Grasnarbe (die Rampe deckt die Wand), wie bei der Treppe; keine Kürzung der Kante daneben
    expect(game('hillStairEnds(11, 13)')).toBe('v');
    expect(game('hillStairEnds(10, 13)')).toBe('');
  });

  it('gezeichnet je Feld als Bildchen, alle Drehungen, Länge 1 und 2, Vorschau in die Anhöhe; Fenster ohne Fehler', () => {
    hills(block(10, 10, 13, 13));
    game("rampNewLen = 2; build('huegelrampe', 11, 14); build('huegelrampe', 8, 11); rampNewLen = 1; build('huegelrampe', 14, 11); build('huegelrampe', 12, 9)");
    game('render(1e6)');
    for (const k of ['11,14', '11,15', '8,11', '9,11', '14,11', '12,9']) expect(game(`hillSprites.has('r${k}')`)).toBe(true);
    expect(game("hillSprites.get('r11,15').base")).toMatch(/^R020/);                         // rot 0, Länge 2, Fuß
    expect(game("hillSprites.get('r11,14').base")).toMatch(/^R021/);
    // Vorschau „Rampe in die Anhöhe“: Felder abgesenkt nur für das Bild
    game("rampNewLen = 2; setTool('huegelrampe')");
    const gap = game("JSON.stringify((g => g && [g.ramp, [...g.keys], g.top, g.lv])(rampGapFor(12, 12, 0)))");
    expect(JSON.parse(gap)).toEqual([true, ['12,13', '12,12'], '12,12', 0]);                 // Fuß zuerst
    game('hillGap = rampGapFor(12, 12, 0)');
    expect(game('[drawLevel(12, 12), drawLevel(12, 13), drawLevel(12, 11), hillGapHas("12,13")]')).toEqual([0, 0, 1, true]);
    expect(game('hillStairEnds(12, 11)')).toBe('v');                                          // die Anhöhe dahinter kennt den Geist
    game('hillGap = null; setTool("look")');
    expect(game('drawHillRampOver(11, 15, 2), drawHillRampOver(14, 11, 2), true')).toBe(true);
  });
});

// Zeichnen mitschreiben (wie tests/treppe-buendig.test.js): g zeichnet nichts, merkt sich jeden Aufruf; poly und paintHillWall mit ihren Werten
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly, pw = paintHillWall;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle, cap: t.lineCap, lw: t.lineWidth }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  paintHillWall = (...a) => { calls.push({ op: 'wall', a: a.slice(1) }); return pw(...a); };
  try { ${body}; } finally { g = prev; poly = pp; paintHillWall = pw; }
  return calls;
})()`);

describe('Rampe bündig (Entwurf)', () => {
  const hOf = (len, i) => d => Math.min(H, Math.max(0, H * (i + d + 0.5) / len));
  it('Fahrbahn und Keil auf derselben Schräge: am Fuß 0,0075 flach davor, hinten 0,0075 über die Feldgrenze, nie über der Anhöhe', () => {
    for (let rot = 0; rot < 4; rot++) for (const [len, i] of [[1, 0], [2, 0], [2, 1]]) {
      const o = { rot, len, i, style: 'kopf', kind: 'fels', m: 'k', p: 'k', em: 0, ep: 0, top: '#123456' };
      const calls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), d = p => p[0] * Du + p[1] * Dv, h = hOf(len, i);
      const tops = calls.filter(c => c.op === 'poly' && c.fill === game("C('#123456')"));
      expect(tops.length).toBe(2);                                                            // Oberseite beider Keile wie der Boden
      for (const t of tops) for (const p of t.pts) expect(p[2]).toBeCloseTo(h(d(p)), 9);      // genau auf der Linie der Rampenkante
      const lane = calls.find(c => c.op === 'poly' && c.pts.length === 8 && c.fill !== game("C('#123456')"));
      for (const p of lane.pts) expect(p[2]).toBeCloseTo(h(d(p)), 9);
      const ds = lane.pts.map(d);
      expect(Math.max(...ds)).toBeCloseTo(0.5075, 9);
      expect(Math.min(...ds)).toBeCloseTo(i === 0 ? -0.5075 : -0.5, 9);                        // nur der Fuß liegt flach auf dem Boden davor
      for (const c of calls) if (c.op === 'poly') for (const p of c.pts) expect(p[2]).toBeLessThanOrEqual(H + 0.4 + 1e-9);
      const walls = calls.filter(c => c.op === 'wall');
      expect(walls.length).toBe(2);                                                            // Keilwände: vorn h0, hinten h1, mit Grasnarbe
      for (const w of walls) expect([w.a[6], w.a[7], w.a[9], w.a[10]]).toEqual([0, H * i / len, H * (i + 1) / len, true]);
      // Muster als Ganzes auf die Schräge: Abbildung mit der Steigung des Felds
      const tr = calls.find(c => c.op === 'transform');
      const k = H / len, gu = k * Du, gv = k * Dv;
      expect(tr.a.map(v => +v.toFixed(9))).toEqual([1, -(gu - gv) / 64, 0, 1 - (gu + gv) / 32, 0, -(H * i / len + k / 2)].map(v => +v.toFixed(9)));
    }
  });

  it('Geländer nur an offenen Seiten (Keil), Wange und breite Seite ohne; durchgehend über beide Felder', () => {
    const rail = (o, P = '(u, v) => [u, v]') => {
      let pts = [];
      const out = [];
      for (const c of record(`paintRamp(${P}, ${JSON.stringify(o)}, 5, 5)`)) {
        if (c.op === 'beginPath') pts = [];
        else if (c.op === 'moveTo' || c.op === 'lineTo') pts.push(c.a);
        else if (c.op === 'stroke' && c.stroke === game("C('#4f4a44')")) out.push(pts);
      }
      return out;
    };
    const base = { rot: 0, len: 2, style: 'sand', kind: 'fels', em: 0, ep: 0, top: '#8dcd67' };
    expect(rail({ ...base, i: 0, m: 'h', p: 'j' }).length).toBe(0);
    const r0 = rail({ ...base, i: 0, m: 'h', p: 'k' }), r1 = rail({ ...base, i: 1, m: 'h', p: 'k' });
    expect(r0.length).toBeGreaterThan(2);
    for (const l of [...r0, ...r1]) for (const [u] of l) expect(u).toBeCloseTo(0.45, 9);     // rot 0: quer = u, Seite +S = +u
    // Handlauf (oben) endet am Feld 0 an seiner Hinterkante (v = −0,5) und beginnt am Feld 1 an dessen Vorderkante (v = +0,5) – gleich hoch
    const hv = '(u, v, up = 0) => [v, up]', top0 = rail({ ...base, i: 0, m: 'h', p: 'k' }, hv)[1], top1 = rail({ ...base, i: 1, m: 'h', p: 'k' }, hv)[1];
    const end0 = top0.reduce((a, b) => (b[0] < a[0] ? b : a)), start1 = top1.reduce((a, b) => (b[0] > a[0] ? b : a));   // hinauf = −v
    expect([end0[0], start1[0]]).toEqual([-0.5, 0.5]);
    expect(end0[1]).toBeCloseTo(start1[1], 9);
    expect(end0[1]).toBeCloseTo(H / 2 + game('RAMP_RAIL'), 9);
  });

  it('Keil am oberen Feld: Außenwand läuft ein Stück über die Wand der Anhöhe dahinter (em/ep); Anhöhe daneben kürzt ihre Kante nicht', () => {
    game("state.hills.clear(); recalc()");
    hills([[10, 9], [11, 9], [12, 9]]);                                                     // Anhöhe hinten, die Rampe davor (hinauf −y), rechts offen
    game("build('huegelrampe', 12, 10)");
    const o = game('rampLook(12, 10, rampAt(12, 10))');
    expect([o.m, o.p, o.ep]).toEqual(['k', 'k', 1]);                                          // rechts: Anhöhe 12,9 hat rechts eine Wand
    const walls = record("paintRamp((u, v, up = 0) => [u, v, up], rampLook(12, 10, rampAt(12, 10)), 12, 10)").filter(c => c.op === 'wall');
    const vis = walls.find(w => w.a[0] === 0.5 && w.a[2] === 0.5);                            // Außenwand vorn rechts (u = +0,5)
    expect(vis.a[13]).toBeCloseTo(0.0075, 9);
  });
});
