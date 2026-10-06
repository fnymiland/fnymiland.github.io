const { loadGame, game } = require('./helpers/load-game');

// Block 92: Hilfe am Ort – „Woher?“ bei Material, Wünsche antippbar, Nachschlagen mit Suche
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); closeBubble(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6");
  game("for (let y = 2; y <= 20; y++) for (let x = 2; x <= 20; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } rebuildCover(); recalc()");
});
const click = sel => game(`document.querySelector('${sel}').click()`);

describe('Hilfe am Ort (Block 92)', () => {
  it('jeder Rohstoff hat einen Eintrag; veredelte Waren zeigen die ganze Kette', () => {
    for (const r of game('Object.keys(RES)')) expect(game(`!!helpEntry('res:${r}')`), r).toBe(true);
    const m = game("helpEntry('res:metall')");
    expect(m.text).toMatch(/Schmiede/);
    expect(m.text).toMatch(/Bergwerk/);
    expect(m.text).toMatch(/Erzberg/);
    expect(m.show).toEqual(['schmiede']);
    expect(game("helpEntry('res:bretter').text")).toMatch(/Sägewerk[\s\S]*Holzfäller/);
    expect(game("helpEntry('res:kaffee').text")).toMatch(/Kaffeeplantage[\s\S]*fernen Inseln/);
  });
  it('jeder Wunsch der Häuser ist erklärt, mit Gebäuden, die es gibt', () => {
    expect(game('Object.keys(WISHES).filter(w => !WISH_HELP[w])')).toEqual([]);
    expect(game('Object.values(WISH_HELP).flatMap(w => w.build || []).filter(b => !ITEMS[b])')).toEqual([]);
    expect(game('Object.values(WISH_HELP).map(w => w.term).filter(t => t && !TERMS[t])')).toEqual([]);
  });
  it('alle Einträge im Nachschlagen lassen sich bauen, und jeder Verweis führt zu einem Eintrag', () => {
    const bad = game(`(() => { const out = []; for (const [, keys] of helpSections()) for (const k of keys) { const e = helpEntry(k); if (!e) { out.push('leer ' + k); continue; }
      for (const m of (e.text + e.short).matchAll(/data-lx="([^"]+)"/g)) if (!helpEntry(m[1])) out.push(k + ' → ' + m[1]); } return out; })()`);
    expect(bad).toEqual([]);
  });
  it('Material im Bau-Infofenster antippen: Sprechblase mit Woher und „Zeig mir“ wählt das Gebäude zum Bauen', () => {
    game("state.res.metall = 0; openBuildInfo('station')");
    click('#panel [data-help="res:metall"]');
    expect(game("document.querySelector('#bubble [data-hbuild]').textContent")).toMatch(/🔒/);   // noch gesperrt: Knopf führt zum Freischalten
    game("closeBubble(); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; openBuildInfo('station')");
    click('#panel [data-help="res:metall"]');
    expect(game("document.getElementById('bubble').textContent")).toMatch(/Zeig mir: Schmiede/);
    click('#bubble [data-hbuild="schmiede"]');
    expect(game('tool')).toBe('schmiede');
    expect(game("!!document.getElementById('bubble')")).toBe(false);
  });
  it('Lager: Rohstoff antippen zeigt, woher er kommt; Tippen daneben schließt die Blase', () => {
    game('state.res.erz = 5; toggleStore(true)');
    click('#store [data-help="res:erz"]');
    expect(game("document.getElementById('bubble').textContent")).toMatch(/Bergwerk/);
    game("document.getElementById('world').dispatchEvent(new window.Event('pointerdown', { bubbles: true }))");
    expect(game("!!document.getElementById('bubble')")).toBe(false);
  });
  it('Hausfenster: jeder Wunsch ist antippbar, fehlendes Material auch', () => {
    game("state.tiles.set('10,10', { b: 'haus', lvl: 4, rot: 0, name: 'Test', animal: 'hase' }); rebuildCover(); recalc(); openInfo(10, 10)");
    const keys = game("[...document.querySelectorAll('#panel [data-help^=\"wish:\"]')].map(e => e.dataset.help)");
    expect(keys).toEqual(game("houseWishes(state.tiles.get('10,10'), 10, 10).list.map(w => 'wish:' + w.id)"));
    click('#panel [data-help="wish:markt"]');
    expect(game("document.getElementById('bubble').textContent")).toMatch(/Marktstände/);
    game('closeBubble(); state.res.metall = 0; state.res.quader = 0; openInfo(10, 10)');
    expect(game("!!document.querySelector('#panel .miss-mat [data-help=\"res:metall\"]')")).toBe(true);
  });
  it('Nachschlagen: im Hilfe-Buch (☰ → Hilfe), Suche filtert, „Mehr“ öffnet den Eintrag', () => {
    game('showMenu()'); click('#m-help');
    game("(q => { q.value = 'Markt'; q.oninput(); })(document.getElementById('lx-q'))");    // Suche oben springt nach „Nachschlagen“
    expect(game("!!document.getElementById('lx-q')")).toBe(true);
    expect(game("document.getElementById('lx-q').value")).toBe('Markt');
    expect(game("document.querySelector('[data-hb=\"lex\"]').classList.contains('on')")).toBe(true);
    game("(q => { q.value = 'Marktplatz'; q.oninput(); })(document.getElementById('lx-q'))");
    const vis = game("[...document.querySelectorAll('.lx-e')].filter(e => !e.hidden).map(e => e.dataset.lxe)");
    expect(vis).toContain('term:marktplatz');
    expect(vis).not.toContain('res:holz');
    game("(q => { q.value = 'xyzxyz'; q.oninput(); })(document.getElementById('lx-q'))");
    expect(game("document.querySelector('#modal-card .lx-none').hidden")).toBe(false);
    game("closeModal(); openBuildInfo('station')"); click('#panel [data-help="res:metall"]'); click('#bubble [data-hmore]');
    expect(game("document.querySelector('[data-lxe=\"res:metall\"]').open")).toBe(true);
  });
});
