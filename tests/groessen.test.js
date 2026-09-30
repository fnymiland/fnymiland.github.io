const { loadGame, game } = require('./helpers/load-game');

// Block 43: Größen für Deko – eigene Einträge je Größe (variantOf), eine Kachel, Größen-Leiste
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e8; for (const r of Object.keys(RES)) state.res[r] = 999; for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); state.inventions.add('botgarten'); state.festival = true");
  game("for (let y = 2; y <= 24; y++) for (let x = 2; x <= 24; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});

describe('Größen', () => {
  it('die abgesprochenen Größen, von klein nach groß; Bank & Co. bleiben einzeln', () => {
    const sizes = b => game(`SIZE_ORDER.${b}.map(([k]) => k)`);
    expect(sizes('brunnen')).toEqual(['s', 'm', 'l', 'xl']);
    expect(sizes('baum')).toEqual(['s', 'm', 'l']);
    expect(sizes('blumen')).toEqual(['m', 'l', 'xl']);
    expect(sizes('glashaus')).toEqual(['m', 'l']);
    for (const b of ['bank', 'laterne', 'blumentopf', 'glaskugel', 'denkmal', 'uhrturm', 'karussell']) expect(game(`!!SIZE_ORDER.${b}`), b).toBe(false);
  });

  it('größer kostet mehr und bringt mehr Schönheit; Grundfläche wie abgesprochen', () => {
    expect(game('ITEMS.brunnen_xl.size')).toEqual([3, 3]);
    expect(game('ITEMS.brunnen_s.small')).toBe(true);
    expect(game('ITEMS.baum_l.name')).toBe('Alte Eiche');
    expect(game('ITEMS.brunnen_l.cost')).toBeGreaterThan(game('ITEMS.brunnen.cost'));
    expect(game('ITEMS.brunnen_l.beauty')).toBeGreaterThan(game('ITEMS.brunnen.beauty'));
    expect(game('ITEMS.glashaus_l.size')).toEqual([2, 3]);
  });

  it('bauen: großer Brunnen belegt 2×2, kleiner kommt in eine Ecke, mittlerer Baum belegt ein Feld', () => {
    expect(game("build('brunnen_l', 6, 6, true)")).toBe(true);
    expect(game("anchorAt(7, 7)")).toBe('6,6');
    expect(game("buildSmall('brunnen_s', 10, 10, 0)")).toBe(true);
    expect(game("build('baum_m', 12, 12, true)")).toBe(true);
    expect(game("smallError('blumentopf', 12, 12, 0)")).toBe('Hier ist kein Platz für Deko');
  });

  it('zählt wie das Grundmodell: Park-Wunsch (Brunnen), Beet-Bonus, Album, Freischaltung', () => {
    expect(game("isKind('brunnen', 'brunnen_xl')")).toBe(true);
    game("build('blumen_l', 6, 6, true); state.tiles.set('8,6', { b: 'feld', lvl: 1 }); recalc()");
    expect(game('beetBonus(8, 6)')).toBe(1);
    game('collectAlbum()');
    expect(game("state.album.has('b:blumen')")).toBe(true);
    expect(game("state.album.has('b:blumen_l')")).toBe(false);
    game("state.design.delete('statue')");
    expect(game("[available('statue'), available('statue_l')]")).toEqual([false, false]);
  });

  it('eine Kachel, Größen-Leiste: Größe wählen legt die Variante in die Hand, die Kachel bleibt markiert', () => {
    game("menuTop = 'gestalten'; menuSub = 'platz'; buildToolbar()");
    expect(document.querySelector('#tools [data-tool="brunnen_l"]')).toBe(null);
    document.querySelector('#tools [data-tool="brunnen"]').click();
    const chips = [...document.querySelectorAll('#style-bar [data-size]')].map(b => b.dataset.size);
    expect(chips).toEqual(['brunnen_s', 'brunnen', 'brunnen_l', 'brunnen_xl']);
    document.querySelector('#style-bar [data-size="brunnen_xl"]').click();
    expect(game('tool')).toBe('brunnen_xl');
    expect(document.querySelector('#tools .tool.active').dataset.tool).toBe('brunnen');
    expect(document.getElementById('panel').textContent).toContain('riesig');
    document.querySelector('#tools [data-tool="brunnen"]').click();                  // nochmal: weglegen
    expect(game('tool')).toBe('look');
    document.querySelector('#tools [data-tool="brunnen"]').click();                  // wieder: die zuletzt gewählte Größe
    expect(game('tool')).toBe('brunnen_xl');
  });

  it('alle Größen lassen sich zeichnen', () => {
    for (const id of game("Object.keys(ITEMS).filter(id => ITEMS[id].variantOf)")) {
      expect(() => game(`drawObject('${id}', 300, 300, 1.2, 1000, 4, 4, 1, { b: '${id}', rot: 0, lvl: 1 })`), id).not.toThrow();
    }
  });
});
