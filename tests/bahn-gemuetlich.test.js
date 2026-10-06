const { loadGame, game } = require('./helpers/load-game');

// Block 109: Bahn gemütlicher – Gleis-Stile (Gleisbett als Form am Schienenfeld), keine Oberleitung, Bahnhöfe mit Blumen
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999; state.techs.add('bahn')");
  game("for (let y = 6; y <= 12; y++) for (let x = 6; x <= 14; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.paintNew.schiene = {}; recalc()");
});
const rail = (x, y) => game(`state.tiles.get('${x},${y}')`);

describe('Gleis-Stile (Block 109)', () => {
  it('Daten: Schotter und Rasengleis frei, die anderen in der Kunstakademie (Gruppe Gleise)', () => {
    expect(game("DECO_LOOKS.schiene.forms.map(f => f.id)")).toEqual(['schotter', 'rasen', 'wald', 'pflaster', 'blumen']);
    expect(game("[0, 1, 2, 3, 4].map(i => lookOk('schiene', 'form', i))")).toEqual([true, true, false, false, false]);
    expect(game("DESIGN.filter(d => d.group === 'Gleise').map(d => d.id)")).toEqual(['schiene:form:wald', 'schiene:form:pflaster', 'schiene:form:blumen']);
    expect(game("Object.keys(RAIL_LOOK).sort().join()")).toBe(game("DECO_LOOKS.schiene.forms.map(f => f.id).sort().join()"));
  });
  it('gebaut wird im gewählten Stil – nur, was frei oder gekauft ist; gespeichert bleibt er', () => {
    game("state.paintNew.schiene = { form: 1 }; build('schiene', 8, 8)");
    expect(rail(8, 8).form).toBe(1);
    game("state.paintNew.schiene = { form: 3 }; build('schiene', 9, 8)");                // Pflaster nicht gekauft
    expect(rail(9, 8).form).toBe(undefined);
    game("state.design.add('schiene:form:pflaster'); build('schiene', 10, 8)");
    expect(rail(10, 8).form).toBe(3);
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    const p = game(`parseSave(${JSON.stringify(s)})`);
    expect(p.tiles.get('8,8').form).toBe(1); expect(p.tiles.get('10,8').form).toBe(3);
    expect(p.paintNew.schiene).toEqual({ form: 3 });
    game("state.restore.quelle = 2; state.paintNew.brunnen = { form: 2 }; build('brunnen', 12, 10)");   // auch ein ungekaufter Brunnen kam früher über paintNewOf mit
    expect(rail(12, 10).form).toBe(undefined);
  });
  it('über bestehende Gleise ziehen: Stil wechselt kostenlos, gleicher Stil bleibt unberührt', () => {
    game("for (let x = 7; x <= 10; x++) build('schiene', x, 8)");
    const money = game('state.money');
    game("state.paintNew.schiene = { form: 1 }");
    expect(game("planCheck('schiene', 8, 8)")).toEqual({ cost: 0, mat: {} });
    expect(game("build('schiene', 8, 8, true)")).toBe(true);
    expect(rail(8, 8).form).toBe(1);
    expect(game("planCheck('schiene', 8, 8)")).toEqual({ same: true });
    expect(game("build('schiene', 8, 8, true)")).toBe(false);
    expect(game('state.money')).toBe(money);
    game("state.paintNew.schiene = { form: 0 }; build('schiene', 8, 8, true)");          // zurück zum Schotter: Feld ohne form
    expect(rail(8, 8).form).toBe(undefined);
  });
  it('Infofenster: Gleisbett wählen und auf alle Gleise übertragen; auch auf Brücken', () => {
    game("for (let x = 7; x <= 10; x++) build('schiene', x, 8); openInfo(8, 8)");
    expect(game("[...document.querySelectorAll('#panel .label')].some(l => l.textContent === 'Gleisbett')")).toBe(true);
    expect(game("document.querySelectorAll('#panel [data-dform]').length")).toBe(2);
    game("document.querySelector('#panel [data-dform=\"1\"]').click()");
    expect(rail(8, 8).form).toBe(1);
    game("document.querySelector('#panel [data-dall]').click()");
    expect([7, 9, 10].map(x => rail(x, 8).form)).toEqual([1, 1, 1]);
    expect(game("railLookOf({ b: 'schiene', form: 1 }) === RAIL_LOOK.rasen")).toBe(true);
    expect(game("railLookOf({ b: 'schiene', form: 1, bridge: true }) === RAIL_LOOK.rasen")).toBe(true);     // auch auf Brücken (109b)
    expect(game("railLookOf({ b: 'schiene', form: 99 }) === RAIL_LOOK.schotter")).toBe(true);
  });
  it('keine Oberleitung mehr: weder Masten noch Draht noch Stromabnehmer', () => {
    expect(game("typeof drawRailWire")).toBe('undefined');
    expect(game("typeof WIRE_H")).toBe('undefined');
    expect(game("drawTrainCar.toString().includes('Stromabnehmer')")).toBe(false);
  });
  it('jeder Stil lässt sich zeichnen (gerade, Kurve, Ende, Bahnübergang)', () => {
    game("build('schiene', 8, 8); build('schiene', 9, 8); build('schiene', 9, 9); build('schiene', 10, 8); for (let y = 6; y <= 10; y++) if (y !== 8) build('weg', 10, y, true); build('weg', 10, 8, true)");
    for (let i = 0; i < 5; i++) {
      game(`for (const [k, t] of state.tiles) if (t.b === 'schiene') t.form = ${i}`);
      expect(() => game("for (const [k, t] of state.tiles) if (t.b === 'schiene') { const [x, y] = keyXY(k); drawRailBed(100, 100, 2, x, y, t); }")).not.toThrow();
    }
  });
  it('109b: Hauptbahnhof-Gleise im Stil der Strecke davor (je Gleis), ohne Strecke Schotter', () => {
    const fills = t => game(`(() => { const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
      try { PASS = 'ground'; drawObject('hbf', 300, 300, 1.2, 1000, 20, 20, 1, ${JSON.stringify({ b: 'hbf', lvl: 1, rot: 0, gleise: 2 })}); } finally { PASS = null; delete g.fillStyle; } return seen; })()`);
    game("for (let y = 15; y <= 30; y++) for (let x = 15; x <= 30; x++) state.tiles.delete(x + ',' + y)");
    expect(fills().filter(c => c === game('RAIL_LOOK.rasen.bed')).length).toBe(0);
    const [ex, ey] = game("gleisTiles({ b: 'hbf', rot: 0, gleise: 2 }, 20, 20, 1).exit");
    game(`state.tiles.set('${ex},${ey}', { b: 'schiene', lvl: 1, form: 1 })`);
    const f = fills();
    expect(f.filter(c => c === game('RAIL_LOOK.rasen.bed')).length).toBe(1);             // nur das Gleis mit Rasen davor
    expect(f.filter(c => c === game('RAIL_LOOK.schotter.bed')).length).toBe(1);
  });
});
