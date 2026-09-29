const { loadGame, game } = require('./helpers/load-game');

// Sammelalbum: Seiten mit allem, was es gibt; eine volle Seite schaltet eine Belohnung frei
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true');
});
const $ = id => document.getElementById(id);

describe('Sammelalbum', () => {
  it('sammelt, was auf der Insel steht – und behält es auch nach dem Abreißen', () => {
    game("state.tiles.set('8,8', { b: 'haus', lvl: 3, wall: 2, roof: 4, animal: 'katze', name: 'Mo' }); state.decos.set('9,9', [{ b: 'bank', rot: 0 }, null, null, null]); recalc(); collectAlbum()");
    for (const k of ['b:haus', 'hs:3', 'wall:2', 'roof:4', 'b:bank', 'tier:katze']) expect(game(`state.album.has('${k}')`), k).toBe(true);
    game("state.tiles.delete('8,8'); recalc(); collectAlbum()");
    expect(game("state.album.has('b:haus')")).toBe(true);
  });

  it('jede Seite hat eine Belohnung, die erst mit der vollen Seite kommt', () => {
    const pages = game('ALBUM.map(p => p.id)');
    expect(pages.length).toBe(6);
    const reward = game("ALBUM.find(p => p.id === 'bewohner').reward");
    expect(game(`available('${reward}')`)).toBe(false);
    game("for (const k of albumKeys(ALBUM.find(p => p.id === 'bewohner'))) state.album.add(k)");
    expect(game(`available('${reward}')`)).toBe(true);
  });

  it('Belohnungen stehen nicht selbst im Album (sonst wäre es nie voll)', () => {
    const rewards = game('ALBUM.map(p => p.reward)');
    const keys = game('ALBUM.flatMap(albumKeys)');
    for (const r of rewards) expect(keys).not.toContain(r.startsWith('weg:') ? r : 'b:' + r);
  });

  it('das Album-Fenster zeigt alle Seiten mit Fortschritt', () => {
    game('openAlbum()');
    expect(document.querySelectorAll('#modal-card .album-page').length).toBe(6);
    expect($('modal-card').textContent).toMatch(/%/);
  });

  it('wird gespeichert', () => {
    game("state.album.add('b:haus'); save()");
    expect(game('load()').album.has('b:haus')).toBe(true);
  });

  it('Belohnungen lassen sich zeichnen', () => {
    for (const id of ['denkmal', 'rosenbogen', 'uhrturm', 'karussell']) {
      expect(() => game(`drawObject('${id}', 100, 100, 1, 1000, 3, 3, 1, { rot: 0, slot: 0 })`)).not.toThrow();
    }
    for (const st of ['regenbogen', 'goldpflaster']) {
      expect(() => game(`drawPath(100, 100, 1, 3, 3, { style: '${st}' })`)).not.toThrow();
    }
  });
});

describe('Album-Belohnungen bleiben', () => {
  it('wer die Seite „Gebäude“ voll hatte, behält das Denkmal – auch wenn die Kraftwerke neu dazukommen', () => {
    game("for (const k of albumKeys(ALBUM.find(p => p.id === 'gebaeude'))) if (!LATE_ALBUM.has(k)) state.album.add(k)");
    game('collectAlbum()');
    expect(game("available('denkmal')")).toBe(true);
    game('save()');
    expect(game("load().legacy.has('denkmal')")).toBe(true);
  });
});
