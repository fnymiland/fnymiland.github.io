const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
const path = require('path');

// Aussehen der Oberfläche (Nutzer, 25.10.2026): Hecke (Standard) oder Wolken, je Gerät; oben keine Emojis mehr, sondern
// Symbole, die das Spiel selbst zeichnet
beforeAll(() => loadGame());
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; uiLookId = 'hecke'; applyUiLook()");
});

describe('Aussehen', () => {
  it('Standard ist Hecke, die Wahl gilt je Gerät und steht nicht im Spielstand', () => {
    expect(game('uiLookId')).toBe('hecke');
    expect(game("document.body.classList.contains('look-hecke')")).toBe(true);
    game("setUiLook('wolke')");
    expect(game('[uiLookId, localStorage.getItem(UI_LOOK_KEY)]')).toEqual(['wolke', 'wolke']);
    expect(game("[document.body.classList.contains('look-wolke'), document.body.classList.contains('look-hecke')]")).toEqual([true, false]);
    expect(game('/uiLook|aussehen/.test(serialize())')).toBe(false);
    game("setUiLook('quatsch')");
    expect(game('uiLookId')).toBe('wolke');
  });

  it('in den Einstellungen wählbar', () => {
    game('showSettings()');
    expect(game("[...document.querySelectorAll('[data-uilook]')].map(b => b.dataset.uilook + (b.classList.contains('on') ? '*' : ''))")).toEqual(['hecke*', 'wolke']);
    game("document.querySelector('[data-uilook=\"wolke\"]').click()");
    expect(game('uiLookId')).toBe('wolke');
    expect(game("document.querySelector('[data-uilook=\"wolke\"]').classList.contains('on')")).toBe(true);
  });

  it('Leiste oben ohne Emojis: Taler, Einwohner, Ideen, Sternstaub, Lager, Online und Menü sind Spiel-Symbole', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const hud = html.slice(html.indexOf('<div id="hud">'), html.indexOf('<div id="store"'));
    for (const e of ['🪙', '👥', '💡', '✨', '📦', '🌐', '☰']) expect(hud.includes(e)).toBe(false);
    expect(game("[...document.querySelectorAll('#hud i.wi')].map(e => e.dataset.ic)")).toEqual(['taler', 'haus:2', 'bibliothek', 'kristall', 'kiste', 'freundesbank', 'wegweiser']);
  });

  it('jedes Symbol lässt sich zeichnen, ohne dass etwas wirft', () => {
    for (const n of ['taler', 'kiste', 'wegweiser', 'haus:2', 'bibliothek', 'kristall', 'freundesbank']) {
      expect(game(`(() => { UI_ICON_CACHE.delete(${JSON.stringify(n)}); return typeof uiIcon(${JSON.stringify(n)}); })()`)).toBe('string');
    }
  });

  it('Platten für beide Aussehen und alle Rollen lassen sich malen', () => {
    for (const look of ['hecke', 'wolke']) for (const role of ['paper', 'btn', 'btn2', 'bar']) {
      expect(game(`paintSlab(120, 40, '${role}', 3, '${look}').pad`)).toBeGreaterThan(0);
    }
  });
});
