const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
const path = require('path');

// Bildchen nur, wo sie etwas zeigen (Nutzer 26.10.2026: „da sind noch sauviele Emojis drin … wäge mal ab, was alles weg kann“,
// Vorschlag „passt“). Weg (unsichtbar, Klasse deko – das Zeichen bleibt im Text): in Überschriften, Reitern, Knöpfen und Abschnitts-
// Schildern mit Text, vor einem Wort, und bunte Emojis ohne eigenes Bild an solchen Stellen. Bleibt: vor einer Zahl (Einheit), als
// Wort selbst („unter 🌐.“), allein im Knopf, in Listen von Dingen (span, .chip …)
beforeAll(() => loadGame());
beforeEach(() => { game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true"); });

const deko = html => {
  const t = document.createElement('template');
  t.innerHTML = game(`wiText(${JSON.stringify(html)})`);
  return [...t.content.querySelectorAll('i.wt')].map(i => i.classList.contains('deko'));
};

describe('Bildchen: schmücken oder zeigen', () => {
  it('weg: Überschrift, Knopf mit Text, Reiter, Abschnitts-Schild', () => {
    expect(deko('<h2>✨ Das ist neu</h2>')).toEqual([true]);
    expect(deko('<button class="btn ghost" id="m-settings">⚙️ Einstellungen ›</button>')).toEqual([true]);
    expect(deko('<button class="look" data-tab="tipps">💡 Tipps</button>')).toEqual([true]);
    expect(deko('<div class="label">📍 Wunschzettel</div>')).toEqual([true]);
  });

  it('weg: vor einem Wort, auch mitten im Satz', () => {
    expect(deko('<p>Nachts: 🏮 Laternen leuchten</p>')).toEqual([true]);
    expect(deko('<li>Das 📖 Tagebuch erzählt</li>')).toEqual([true]);
    expect(deko('<li>🏘️ <b>Viertel:</b> was aneinandergrenzt</li>')).toEqual([true]);
    const t = document.createElement('template');
    t.innerHTML = game(`wiText('<p>Stell Marktstände (🏘️ Stadt → 🧺 Markt) auf einen Weg.</p>')`);
    for (const i of t.content.querySelectorAll('i.deko')) i.remove();
    expect(t.content.textContent).toBe('Stell Marktstände (Stadt → Markt) auf einen Weg.');
  });

  it('bleibt: vor einer Zahl, als Wort selbst, allein im Knopf, in Listen von Dingen', () => {
    expect(deko('<p>Königliche Inselperle · 🏮 22 / 22</p>')).toEqual([false]);
    expect(deko('<button class="btn">Kaufen 🪙 40</button>')).toEqual([false]);
    expect(deko('<p>Freunde und Online-Speicher findest du unter 🌐.</p>')).toEqual([false]);
    expect(deko('<p>oben bei dir (🐰)</p>')).toEqual([false]);
    expect(deko('<button class="look">🐰</button>')).toEqual([false]);
    expect(deko('<span class="chip">🏠 22 Einwohner</span>')).toEqual([false]);
    expect(deko('<span class="chip">🌳 Baum</span>')).toEqual([false]);
    expect(deko('<button class="btn danger">🗑️ +61.870</button>')).toEqual([false]);   // Abreißen: das Bildchen ist die Beschriftung
    expect(deko('<b>25 ✨ am Tag</b>')).toEqual([false]);                                  // nach einer Zahl: auch Einheit
    expect(deko('<button class="look locked">🔒 Herzballon</button>')).toEqual([false]);  // Zustand: gesperrt
  });

  it('bunte Emojis ohne eigenes Bild verschwinden an denselben Stellen, ♥ ✓ bleiben Schrift', () => {
    const html = game(`wiText('<li>💬 <b>Texte überarbeitet:</b> ruhiger</li>')`);
    expect(html).toContain('<i class="wt deko">💬 </i>');                  // samt Leerzeichen, sonst bliebe „( Stadt“ stehen
    expect(game(`wiText('<p>♥♥♡ Paul Bär</p>')`)).toBe('<p>♥♥♡ Paul Bär</p>');
    expect(game(`wiText('<button class="look on">✓ Läuft auf der Insel herum</button>')`)).not.toContain('<i');
  });

  it('das Zeichen bleibt im Text (Vorlesen, Suchen), zweimal umwandeln ändert nichts', () => {
    const once = game(`wiText('<h2>✨ Das ist neu</h2><p>unter ☰ → ✨ Das ist neu.</p>')`);
    expect(game(`wiText(${JSON.stringify(once)})`)).toBe(once);
    const t = document.createElement('template'); t.innerHTML = once;
    expect(t.content.textContent).toBe('✨ Das ist neuunter ☰ → ✨ Das ist neu.');
  });

  it('im Spiel: Menü-Knöpfe und „Das ist neu“ ohne schmückende Bildchen, Meldungen ebenso', () => {
    game('showMenu()');
    const card = document.getElementById('modal-card');
    for (const b of card.querySelectorAll('.btn')) for (const i of b.querySelectorAll('i.wt')) expect(i.classList.contains('deko')).toBe(true);
    game('showNews(true)');
    const vis = [...card.querySelectorAll('i.wt:not(.deko)')].map(i => i.textContent);
    expect(vis.length).toBeLessThan(card.querySelectorAll('i.wt').length / 4);   // vorher stand fast vor jeder Zeile eines
    const raw = [];
    const w = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) if (!n.parentElement.closest('i.wt') && /[\u{1F000}-\u{1FAFF}]/u.test(n.nodeValue)) raw.push(n.nodeValue.trim().slice(0, 30));
    expect(raw).toEqual([]);
    game('closeModal()');
    game("toast('🔭 Neu: Sternwarte und Riesenrad')");
    expect(document.querySelector('#toast i.wt').classList.contains('deko')).toBe(true);
  });

  it('style.css blendet sie aus', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    expect(css).toMatch(/i\.wt\.deko \{ display: none; \}/);
  });
});

describe('Menü-Knopf: drei Striche statt Wegweiser', () => {
  it('Nutzer 26.10.2026: „das Schilderzeichen lässt nicht erkennen, dass man dort ins Menü kommt“ – drei Striche in der Schriftfarbe', () => {
    expect(game("document.querySelector('#menu-btn i.wi').dataset.ic")).toBe('menue');
    expect(game("typeof UI_DRAW.menue")).toBe('function');
    expect(game("[wiTextName('☰'), wiTextName('🪧')]")).toEqual(['menue', 'menue']);   // „☰ → Einstellungen“ zeigt den Knopf, wie er aussieht
    expect(game("uiLookId = 'hecke'; menueInk()")).toBe('#5a3d24');
    expect(game("uiLookId = 'wolke'; menueInk()")).toBe('#3b4763');
    game("uiLookId = 'hecke'");
  });
});
