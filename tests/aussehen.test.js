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
    expect(game("[...document.querySelectorAll('#hud i.wi')].map(e => e.dataset.ic)")).toEqual(['taler', 'haus:2', 'bibliothek', 'kristall', 'kiste', 'freundesbank', 'menue']);
  });

  it('jedes Symbol lässt sich zeichnen, ohne dass etwas wirft', () => {
    for (const n of ['taler', 'kiste', 'menue', 'haus:2', 'bibliothek', 'kristall', 'freundesbank']) {
      expect(game(`(() => { UI_ICON_CACHE.delete(${JSON.stringify(n)}); return typeof uiIcon(${JSON.stringify(n)}); })()`)).toBe('string');
    }
  });

  it('Platten für beide Aussehen und alle Rollen lassen sich malen', () => {
    for (const look of ['hecke', 'wolke']) for (const role of ['paper', 'btn', 'btn2', 'bar']) {
      expect(game(`paintSlab(120, 40, '${role}', 3, '${look}').pad`)).toBeGreaterThan(0);
    }
  });

  it('Bauleiste: Insel mit Platte, jeder Knopf Spiel-Symbol + Wort, keine Emojis; mit etwas in der Hand rotes ✕', () => {
    game("setTool('look'); buildToolbar()");
    expect(game("document.getElementById('cats-isle').dataset.slab")).toBe('bar');
    expect(game("[...document.querySelectorAll('#cats .quick:not(.drag), #cats .cat')].map(b => b.querySelector('[data-ic]').dataset.ic)"))
      .toEqual(['lupe', 'haken', 'undo', 'glaskugel', 'stern', 'haus:3', 'baecker', 'fz_karussell', 'blumen']);
    expect(game("[...document.querySelectorAll('#cats .tx')].map(t => t.textContent)"))
      .toEqual(['Ansehen', 'Wege', 'Auswählen', 'Zurück', 'Durchsicht', 'Favoriten', 'Stadt', 'Herstellen', 'Freizeit', 'Gestalten']);
    expect(/\p{Extended_Pictographic}/u.test(game("document.getElementById('cats').textContent"))).toBe(false);
    game("setTool('haus')");
    expect(game("document.querySelector('#cats .quick[data-quick=\"look\"] .x').textContent")).toBe('✕');
    game("setTool('look')");
  });

  it('Feld: Platte als Hintergrund (scrollt selbst), Gruppen mit Spielbild statt Emoji', () => {
    game("menuTop = 'stadt'; setSheet(true); buildToolbar()");
    expect(game("document.getElementById('sheet').classList.contains('slab-in')")).toBe(true);
    expect(game("document.querySelector('#tools .sheet-h[data-group=\"wohnen\"] [data-ic]').dataset.ic")).toBe('haus:2');
    game('setSheet(false)');
  });

  it('Infofenster: Platte als Hintergrund, Inhalt scrollt innen, Bild des Gebäudes oben; Wege ohne Bild; Ziel-Fenster mit Platte', () => {
    game("state.tiles.set('40,40', { b: 'haus', lvl: 2 }); recalc(); openInfo(40, 40)");
    expect(game("document.getElementById('panel').classList.contains('slab-in')")).toBe(true);
    expect(game("!!document.querySelector('#panel > .p-scroll h3')")).toBe(true);
    expect(game("!!document.querySelector('#panel .p-scroll > .p-hero')")).toBe(true);
    expect(game("document.getElementById('panel').style.getPropertyValue('--hero')")).toMatch(/^url\(/);
    game("updateHud()");                                                  // Neuzeichnen: Bild bleibt
    expect(game("!!document.querySelector('#panel .p-hero')")).toBe(true);
    game("state.tiles.set('42,42', { b: 'weg', lvl: 1 }); recalc(); openInfo(42, 42)");
    expect(game("!!document.querySelector('#panel .p-hero')")).toBe(false);
    expect(game("document.getElementById('panel').style.getPropertyValue('--hero')")).toBe('none');
    game('closePanel()');
    expect(game("document.getElementById('goal').dataset.slab")).toBe('paper');
  });

  it('Emojis in Texten: 🪙 📦 🔒 … werden Spiel-Symbole, das Zeichen bleibt im Text, Attribute bleiben unberührt', () => {
    const out = game(`wiText('<b title="🪙 Taler">🪙 40</b> und 🔒')`);
    expect(out).toContain('title="🪙 Taler"');
    expect(out.match(/<i class="wt"/g).length).toBe(2);
    expect(out).toContain('var(--wt-taler)');
    expect(out).toContain('var(--wt-riegel)');
    expect(game(`wiText('ohne')`)).toBe('ohne');
    game("openTownHall('overview')");
    expect(game("document.querySelectorAll('#modal-card i.wt').length")).toBeGreaterThan(0);
    expect(game("document.getElementById('modal-card').dataset.slabIn")).toBe('1');
    game('closeModal()');
  });

  it('Vorschaubild ragt über den Rand → kleiner neu gemalt (Märchenschloss, Torturm …), danach wieder normal', () => {
    const r = game(`(() => {
      const o = thumbOverflow, raw = thumbRaw; let n = 0, k = 0; const fits = [];
      thumbOverflow = () => k++ < 2; thumbRaw = (...a) => { n++; fits.push(thumbFit); return raw(...a); };
      try { thumb('fz_schloss'); } finally { thumbOverflow = o; thumbRaw = raw; }
      return [n, fits.map(f => Math.round(f * 100)), thumbFit];
    })()`);
    expect(r).toEqual([3, [100, 80, 64], 1]);
  });

  it('Nacht: Rand stufenweise dunkler (0–3), bei „immer Tag“ nie; neu gemalt nur beim Stufenwechsel', () => {
    const r = game(`(() => {
      const na = nightAt, day = GFX.day; const out = [];
      try {
        GFX.day = 'uhr';
        nightAt = () => 0; uiNightSync(); out.push(uiNightNow);
        nightAt = () => NIGHT_MAX / 2; uiNightSync(); out.push(uiNightNow);
        nightAt = () => NIGHT_MAX; uiNightSync(); out.push(uiNightNow, typeof paintSlab(120, 40, 'paper', 3, 'hecke', 3).canvas);   // jsdom misst keine Größen: direkt malen
        GFX.day = 'tag'; uiNightSync(); out.push(uiNightNow);
      } finally { nightAt = na; GFX.day = day; uiNightSync(); }
      return out;
    })()`);
    expect(r).toEqual([0, 2, 3, 'object', 0]);
  });

  it('Ziel-Fenster zeigt, dass es sich einklappen lässt: Pfeil-Knopf in der Überschrift, aria-expanded folgt dem Antippen', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    expect(css).toMatch(/#goal > h4:first-child::before \{[^}]*var\(--chev-up\)/);
    expect(css).toMatch(/#goal\.small > h4:first-child::before \{[^}]*var\(--chev-down\)/);
    game('goalSmall = false; updateHud()');
    const goal = document.getElementById('goal');
    expect([goal.classList.contains('small'), goal.getAttribute('aria-expanded')]).toEqual([false, 'true']);
    goal.querySelector('h4').click();
    expect([goal.classList.contains('small'), goal.getAttribute('aria-expanded')]).toEqual([true, 'false']);
    game('goalSmall = null; updateHud()');
  });

  it('Knöpfe: Hecke = Holzbrett (CSS), Wolken = Wölkchen per border-image; Bildmaße passen zu den Zahlen in style.css', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    expect(css).toMatch(/body\.look-hecke \.btn, body\.look-hecke #goal \.task\.ready \.t-go,[^{]*\{[^}]*var\(--grain\)/);
    // Ecke = r + P/2, unten + Dicke; im Bild doppelt so groß (k = 2)
    const [c, b] = game('[(CLOUD_KNOB_R + CLOUD_KNOB_P / 2) * 2, (CLOUD_KNOB_R + CLOUD_KNOB_P / 2 + CLOUD_KNOB_DEPTH) * 2]');
    expect(css).toContain(`border-image: var(--ck) ${c} ${c} ${b} ${c} fill / ${c / 2}px ${c / 2}px ${b / 2}px ${c / 2}px round`);
    for (const id of game('Object.keys(CLOUD_KNOB)')) expect(css).toContain(`var(--cloud-${id})`);
    game("setUiLook('wolke')");
    expect(game("Object.keys(CLOUD_KNOB).every(id => document.body.style.getPropertyValue('--cloud-' + id).startsWith('url('))")).toBe(true);
  });

  it('Leiste oben (Konzept A): Ort · Werte · Knöpfe als Gruppen, Werte auf Platte, Knöpfe rund, Inhalt senkrecht mittig', () => {
    const grp = cls => game(`[...document.querySelectorAll('#hud .${cls} .pill')].map(p => p.id)`);
    expect(grp('hud-info')).toEqual(['town-btn']);
    expect(grp('hud-vals')).toEqual(['money-btn', 'pop-btn', 'sci-btn', 'sd-btn']);
    expect(grp('hud-act')).toEqual(['store-btn', 'you-btn', 'net-btn', 'menu-btn']);
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    const tail = css.slice(css.indexOf('Leiste oben, Konzept A'));
    expect(tail).toMatch(/#hud \.pill \{ align-items: center; \}/);                       // nicht mehr unten bündig
    expect(tail).toMatch(/#hud \.pill i\.wi \{ margin-bottom: 0; \}/);
    expect(tail).toMatch(/body\.look-hecke #hud :is\(\.hud-info, \.hud-vals\) \{[^}]*var\(--grain\)/);
    expect(tail).toMatch(/body\.look-wolke #hud :is\(\.hud-info, \.hud-vals\) \{[^}]*var\(--cloud-w\)/);
    expect(tail).toMatch(/#hud \.hud-act \.pill \{[^}]*border-radius: 50%/);
    expect(tail).toMatch(/@media \(max-width: 720px\) \{\s*#hud \.hud-act \{ flex-direction: column/);   // schmal: Knöpfe untereinander
  });

  it('Leiste oben passt sich an ihren Inhalt an: erst Ortsname weg, dann Knöpfe untereinander (Menü-Knopf ragte bei 1000 px hinaus)', () => {
    // jsdom misst nicht: Breite der Leiste je nach Stufe vorgeben (so breit wäre sie im Browser)
    const hud = document.getElementById('hud'), body = document.body;
    const need = { '': 1027, noname: 960, rail: 700 };
    Object.defineProperty(hud, 'clientWidth', { configurable: true, get: () => 980 });
    Object.defineProperty(hud, 'scrollWidth', { configurable: true, get: () => need[body.classList.contains('hud-rail') ? 'rail' : body.classList.contains('hud-noname') ? 'noname' : ''] });
    game('fitHud()');
    expect([body.classList.contains('hud-noname'), body.classList.contains('hud-rail')]).toEqual([true, false]);
    need.noname = 990;                                                          // längerer Ortsname, größere Zahlen: auch ohne Namen zu breit
    game('fitHud()');
    expect([body.classList.contains('hud-noname'), body.classList.contains('hud-rail')]).toEqual([true, true]);
    need[''] = 900;                                                              // Fenster breiter gezogen: alles wieder in einer Zeile
    game('fitHud()');
    expect([body.classList.contains('hud-noname'), body.classList.contains('hud-rail')]).toEqual([false, false]);
    delete hud.clientWidth; delete hud.scrollWidth;
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    expect(css).toMatch(/body\.hud-noname #hud #town-name \{ display: none; \}/);
    expect(css).toMatch(/body\.hud-rail #hud \.hud-act \{ flex-direction: column/);
  });
});
