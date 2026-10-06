const { loadGame, game } = require('./helpers/load-game');

// Block 106: Stadtschmuck – Laternen, Bänke, Brunnen in Formen und Farben
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 999");
  game("for (let y = 6; y <= 12; y++) for (let x = 6; x <= 12; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});

describe('Stadtschmuck (Block 106)', () => {
  it('Daten: Formen und Farben eindeutig, Bezahltes steht in der Kunstakademie, die ersten sind frei', () => {
    const bad = game(`Object.entries(DECO_LOOKS).filter(([b, L]) => new Set(L.forms.map(f => f.id)).size !== L.forms.length || (L.cols && new Set(L.cols.map(c => c.id)).size !== L.cols.length)).map(([b]) => b)`);
    expect(bad).toEqual([]);
    const missing = game(`Object.entries(DECO_LOOKS).flatMap(([b, L]) => [...L.forms.filter(f => f.design).map(f => b + ':form:' + f.id), ...(L.cols || []).filter(c => c.design).map(c => b + ':col:' + c.id)]).filter(id => !DESIGN.some(d => d.id === id))`);
    expect(missing).toEqual([]);
    expect(game("[lookOk('bank', 'form', 0), lookOk('bank', 'form', 1), lookOk('bank', 'form', 2), lookOk('laterne', 'col', 3), lookOk('laterne', 'col', 4)]")).toEqual([true, true, false, true, false]);
    game("state.design.add('bank:form:stein')");
    expect(game("lookOk('bank', 'form', 2)")).toBe(true);
  });
  it('beim Bauen gilt die gewählte Form/Farbe – aber nur, was frei oder gekauft ist', () => {
    game("state.paintNew.bank = { form: 1, col: 2 }; buildSmall('bank', 8, 8, 1)");
    expect(game("decosAt('8,8')[1]")).toMatchObject({ b: 'bank', form: 1, col: 2 });
    game("state.paintNew.bank = { form: 4, col: 6 }; buildSmall('bank', 8, 8, 2)");      // Rundbank/Rosa nicht gekauft
    const d = game("decosAt('8,8')[2]");
    expect(d.form).toBe(undefined); expect(d.col).toBe(undefined);
  });
  it('Form und Farbe bleiben gespeichert (Deko, Feld-Brunnen, Wahl für neu Gebautes)', () => {
    game("state.restore.quelle = 2; state.design.add('brunnen:form:fisch'); state.paintNew.brunnen = { form: 2 }; state.paintNew.laterne = { form: 1, col: 3 }; state.design.add('laterne'); buildSmall('laterne', 9, 9, 0); build('brunnen', 10, 10)");
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    const p = game(`parseSave(${JSON.stringify(s)})`);
    expect(p.decos.get('9,9')[0]).toMatchObject({ b: 'laterne', form: 1, col: 3 });
    expect(p.tiles.get('10,10').form).toBe(2);
    expect(p.paintNew.laterne).toEqual({ form: 1, col: 3 });
  });
  it('Fenster: Form und Farbe ändern, auf alle gleichen übertragen', () => {
    game("buildSmall('bank', 8, 8, 1); buildSmall('bank', 9, 8, 1); setTool('look'); openDecoInfo(8, 8, 1)");
    expect(game("document.querySelectorAll('#panel [data-dform]').length")).toBe(2);         // Parkbank, Gartenbank frei
    game("document.querySelector('#panel [data-dform=\"1\"]').click()");
    game("document.querySelector('#panel [data-dcol=\"2\"]').click()");
    expect(game("decosAt('8,8')[1]")).toMatchObject({ form: 1, col: 2 });
    game("document.querySelector('#panel [data-dall]').click()");
    expect(game("decosAt('9,8')[1]")).toMatchObject({ form: 1, col: 2 });
  });
  it('Leiste beim Bauen: Formen und Farben zum Wählen, „+N“ führt in die Kunstakademie', () => {
    game("setTool('bank')");
    expect(game("document.getElementById('style-bar').hidden")).toBe(false);
    expect(game("document.querySelectorAll('#style-bar [data-lform]').length")).toBe(2);
    expect(game("document.querySelectorAll('#style-bar [data-lcol]').length")).toBe(4);
    game("document.querySelector('#style-bar [data-lcol=\"3\"]').click()");
    expect(game('state.paintNew.bank.col')).toBe(3);
    expect(game("!!document.querySelector('#style-bar [data-lmore]')")).toBe(true);
    game("setTool('look')");
  });
  it('„Platz“ heißt jetzt „Stadtschmuck“', () => {
    expect(game("menuPath('laterne')")).toMatch(/Stadtschmuck/);
  });
  it('Spaziergänger setzen sich nicht in die Rundbank (Baum in der Mitte) oder auf den Picknicktisch', () => {
    game("state.design.add('bank:form:rund'); state.paintNew.bank = { form: 4 }; buildSmall('bank', 8, 8, 0)");
    expect(game("(() => { const w = { fx: 8, fy: 8, tx: 8, ty: 8, px: 8, py: 8 }; const r = Math.random; Math.random = () => 0; try { return sitDown(w); } finally { Math.random = r; } })()")).toBe(false);
    game("decosAt('8,8')[0].form = 0");
    expect(game("(() => { const w = { fx: 8, fy: 8, tx: 8, ty: 8, px: 8, py: 8 }; const r = Math.random; Math.random = () => 0; try { return sitDown(w); } finally { Math.random = r; } })()")).toBe(true);
  });
  it('Block 108: zwei Bänke an derselben Feldkante stecken nie ineinander, egal wie gedreht', () => {
    // Ende einer Bank auf Feld (8,8) Ecke rechts (1) und Anfang der Bank auf (9,8) Ecke links (0): Lücke dazwischen
    const gap = game(`[0, 1, 2, 3].flatMap(rot => [0, 1, 2, 3, 4].map(form => {
      state.decos.delete('8,8'); state.decos.delete('9,8');
      buildRot = rot; state.design.add('bank:form:' + DECO_LOOKS.bank.forms[form].id); state.paintNew.bank = { form };
      buildSmall('bank', 8, 8, 1); buildSmall('bank', 9, 8, 0);
      const a = decosAt('8,8')[1], b = decosAt('9,8')[0];
      const ua = 8 + slotPos(8, 8, 1, a)[0] + decoExt(a)[0], ub = 9 + slotPos(9, 8, 0, b)[0] - decoExt(b)[0];
      return ub - ua;
    }))`);
    expect(Math.min(...gap)).toBeGreaterThan(0);
    game("buildRot = 1; state.decos.delete('8,8'); state.paintNew.bank = { form: 0 }; buildSmall('bank', 8, 8, 1)");   // längs: rückt nach innen
    expect(game("slotPos(8, 8, 1, decosAt('8,8')[1])[0]")).toBeLessThan(game("slotPos(8, 8, 1, 'bank')[0]"));
    game("buildRot = 0");
  });
  it('Block 114: „weitere Formen freischalten“ ist ein Knopf und öffnet die Kunstakademie', () => {
    game("buildSmall('bank', 8, 8, 1); setTool('look'); openDecoInfo(8, 8, 1)");
    expect(game("(() => { const b = document.querySelector('#panel button.art-more[data-dmore]'); return b ? b.textContent : null; })()")).toMatch(/weitere Formen und Farben freischalten/);
    game("document.querySelector('#panel [data-dmore]').click()");
    expect(game("!$('modal').hidden && !!document.querySelector('[data-rtab=\"design\"].on')")).toBe(true);
    game("closeModal()");
  });
});
