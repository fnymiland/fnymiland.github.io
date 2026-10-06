const { loadGame, game } = require('./helpers/load-game');

// Block 29: Hauptbahnhof – so viele Gleise, wie man will; jedes Gleis eine Linie; Umsteigen verbindet die Inseln
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
  game('state.money = 1e7; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); }");
  game("state.techs.add('bahn'); buildRot = 0; rotManual = true; recalc()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } recalc()'));
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)})`);
const gleisKeys = k => game(`[...GLEIS].filter(([, G]) => G.hub === '${k}').map(([gk]) => gk)`);
// Hbf bei (4,6), Drehung 0: Gleise zeigen nach +x, Ausfahrt Gleis 0 bei (8,6), Gleis 1 bei (8,10) – dazwischen Steig, Halle, Steig (Block 123)
function hub() { expect(game("build('hbf', 4, 6, true)")).toBe(true); game("state.tiles.get('4,6').rot = 0; recalc()"); }
function lines() {
  for (let x = 8; x <= 16; x++) { put(`${x},6`, { b: 'schiene', lvl: 1 }); put(`${x},10`, { b: 'schiene', lvl: 1 }); }
  put('17,5', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); put('17,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' });
  game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? (y < 7 ? 'wald' : 'obst') : 'home'");
  for (let i = 0; i < 12; i++) put(`${2 + i},23`, { b: 'windrad', lvl: 3 });
  game('recalc()');
}

describe('Hauptbahnhof bauen', () => {
  it('4 tief, 2 Gleise breit – jedes Gleis ist ein Halt', () => {
    hub();
    expect(game("sizeOf('hbf', 0, state.tiles.get('4,6'))")).toEqual([4, 5]);
    expect(gleisKeys('4,6')).toEqual(['7,6', '7,10']);                         // vorderstes Hallenfeld je Gleis
  });

  it('+ Gleis: 2 Felder breiter, kostet; − Gleis gibt die Hälfte zurück', () => {
    hub();
    const m0 = game('state.money');
    expect(game("hbfResize('4,6', 1)")).toBe('4,6');
    expect(game("state.tiles.get('4,6').gleise")).toBe(3);
    expect(game("sizeOf('hbf', 0, state.tiles.get('4,6'))")).toEqual([4, 7]);
    expect(game('state.money')).toBe(m0 - game('GLEIS_COST.money'));
    expect(game("anchorAt(4, 11)")).toBe('4,6');
    game("hbfResize('4,6', -1)");
    expect(game("state.tiles.get('4,6').gleise")).toBe(2);
    expect(game('state.money')).toBe(m0 - game('GLEIS_COST.money') / 2);
  });

  it('kein Platz daneben: kein Gleis', () => {
    hub();
    put('5,11', { b: 'haus', lvl: 1 }); game('recalc()');
    expect(game("hbfResizeError('4,6', 1)")).toMatch(/Platz/);
  });

  it('in jeder Drehung bleiben die alten Gleise, wo sie sind', () => {
    for (const r of [0, 1, 2, 3]) {
      game("for (const [k, t] of [...state.tiles]) if (t.b === 'hbf') state.tiles.delete(k)");
      put('8,8', { b: 'hbf', lvl: 1, rot: r }); game('recalc()');
      const before = game("[0, 1].map(g => gleisTiles(state.tiles.get('8,8'), 8, 8, g).hall[0])");
      const nk = game("hbfResize('8,8', 1)");
      const [x, y] = nk.split(',').map(Number);
      expect(game(`[0, 1].map(g => gleisTiles(state.tiles.get('${nk}'), ${x}, ${y}, g).hall[0])`)).toEqual(before);
    }
  });
});

describe('Linien am Hauptbahnhof', () => {
  it('jedes Gleis eine eigene Linie mit eigenem Zug; Umsteigen verbindet die Inseln', () => {
    hub(); lines();
    for (let i = 0; i < 6; i++) { put(`${12 + i},3`, { b: 'haus', lvl: 3 }); put(`${12 + i},12`, { b: 'haus', lvl: 3 }); }
    game('recalc()');
    const ls = game('T.rail.lines.map(l => ({ st: l.stations, regions: l.regions, powered: l.powered, transfer: l.traffic.transfer }))');
    expect(ls.length).toBe(2);
    expect(ls.every(l => l.powered)).toBe(true);
    expect(ls.map(l => l.st.find(s => ['7,6', '7,10'].includes(s))).sort()).toEqual(['7,10', '7,6']);
    const wald = ls.find(l => l.regions.includes('wald'));
    expect(wald.transfer).toEqual(['obst']);                                  // per Umsteigen erreichbar
    // Besucher der Waldinsel: ohne Umsteigen nur ½ × Heimat-Einwohner, mit auch die der Obstinsel
    game('state.tiles.set("14,4", { b: "riesenrad", lvl: 1, phase: 99 }); recalc()');
    const v = game("T.rail.lines.find(l => l.regions.includes('wald')).traffic.visits.get('wald')");
    const homePop = game("placeStats().pop.get('home') || 0"), obstPop = game("placeStats().pop.get('obst')");
    expect(v).toBeGreaterThan(homePop / 2);
    expect(v).toBeLessThanOrEqual((homePop + obstPop) / 2 + 1e-6);
  });

  it('der Zug fährt bis in die Halle', () => {
    hub(); lines();
    game('syncTrains()');
    const route = game("trains.find(tr => T.rail.lines.find(l => l.stations.includes('7,6')) && tr.id.startsWith(T.rail.lines.find(l => l.stations.includes('7,6')).stations[0])).route.pts.map(p => p[0])");
    expect(Math.min(...route)).toBeLessThanOrEqual(5.01);                     // bis ans Ende der Halle (x = 5)
  });

  it('Zug je Gleis wählen – wird am Gleis gespeichert', () => {
    hub(); lines();
    game("vehicleOk = () => true; openGleis('7,6')");
    expect(document.getElementById('panel').textContent).toMatch(/Gleis 1/);
    document.querySelector('[data-train="0:schnell"]').onclick();
    expect(game("stopConf('7,6').train")).toBe('schnell');
    expect(game("stopConf('7,10').train")).not.toBe('schnell');
    game('save()');
    const t = game("load().tiles.get('4,6')");
    expect(t.gleis[0].train).toBe('schnell');
  });

  it('Gleise, deren Strecken sich berühren, sind eine Linie – das Fenster sagt es', () => {
    hub();
    for (let x = 8; x <= 12; x++) { put(`${x},6`, { b: 'schiene', lvl: 1 }); put(`${x},10`, { b: 'schiene', lvl: 1 }); }
    for (const y of [7, 8, 9]) put(`12,${y}`, { b: 'schiene', lvl: 1 });
    put('13,6', { b: 'station', lvl: 1, rot: 0 });
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'; recalc(); openInfo(4, 6)");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(document.getElementById('panel').textContent).toMatch(/hängt an Gleis 1/);
  });
});

describe('Anzeige', () => {
  it('Infofenster: Gleise, + Gleis, Aussehen; alle Designs lassen sich zeichnen', () => {
    hub();
    game('openInfo(4, 6)');
    const txt = document.getElementById('panel').textContent;
    expect(txt).toMatch(/Gleis 1/);
    expect(txt).toMatch(/\+ Gleis/);
    for (const look of ['glas', 'backstein', 'land']) {
      game(`state.tiles.get('4,6').look = '${look}'; hbfResize('4,6', 1)`);
      for (const r of [0, 1, 2, 3]) expect(() => game(`drawObject('hbf', 300, 300, 1.2, 1000, 4, 6, 1, { ...state.tiles.get('4,6'), rot: ${r} })`)).not.toThrow();
    }
  });

  it('Abriss erstattet auch die zusätzlichen Gleise zur Hälfte', () => {
    hub();
    const base = game("demolishInfo(4, 6).refund");
    game("hbfResize('4,6', 1)");
    expect(game("demolishInfo(4, 6).refund")).toBe(base + game('GLEIS_COST.money') / 2);
  });
});
