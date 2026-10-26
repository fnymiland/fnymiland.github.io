const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs');
const path = require('path');

// Inselsterne (Nutzer 26.10.2026: „Erfolge sollen einen Sinn haben und prominent für Besucher sichtbar sein … ab 10 Erfolgen eine
// 1-Sterne-Insel, ab 20 2 Sterne“): Erfolgs-Sterne ergeben 1–5 Inselsterne, je +5 % Taler. Gezeigt wird nur, was man hat
// („ein 3-Sterne-Restaurant hängt auch nicht 3/5 an die Tür“), als Medaille: ohne Rahmen, Bronze, Silber, Gold, Regenbogen mit Glitzer.
beforeAll(() => loadGame());
beforeEach(() => { game("localStorage.clear(); startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.achieved = {}"); });
// n Erfolgs-Sterne, verteilt wie im Spiel (je Erfolg höchstens seine Stufen); was darüber liegt, zählt ein Platzhalter mit
const setStars = n => game(`(() => { let left = ${n}; state.achieved = {}; for (const a of ACHIEVEMENTS) { const k = Math.min(a.tiers.length, left); state.achieved[a.id] = k; left -= k; }
  if (left) state.achieved.zz = left; return starCount(); })()`);

describe('Inselsterne', () => {
  it('Schwellen 10 · 25 · 45 · 70 · 100 Erfolgs-Sterne', () => {
    expect(game('ISLE_STARS')).toEqual([10, 25, 45, 70, 100]);
    expect([0, 9, 10, 24, 25, 44, 45, 69, 70, 99, 100, 160].map(s => game(`isleStarsOf(${s})`))).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('je Inselstern +5 % Taler (über boostMul, also auch in der Anzeige oben)', () => {
    setStars(0);
    const base = game("boostMul('inc')"), sci = game("boostMul('sci')");
    setStars(53);                                                              // 3 Inselsterne
    expect(game("boostMul('inc')") / base).toBeCloseTo(1.15, 5);
    expect(game("boostMul('sci')")).toBe(sci);                                 // Ideen unverändert
  });

  it('Medaille oben neben der Flagge: nur mit Inselstern, Stufe als Klasse, Name zum Vorlesen', () => {
    setStars(5); game('updateHud()');
    const m = document.getElementById('hud-medal');
    expect(m.hidden).toBe(true);
    setStars(80); game('updateHud()');
    expect(m.hidden).toBe(false);
    expect(m.classList.contains('t4')).toBe(true);
    expect(m.getAttribute('aria-label')).toBe('4 Inselsterne');
    for (let i = 1; i <= 5; i++) expect(game(`typeof UI_DRAW.medaille${i}`)).toBe('function');
  });

  it('Ziel-Fenster: „Noch … Erfolge bis zum … Inselstern“ mit Balken; mit allen fünf keine Zeile', () => {
    setStars(53); game('updateHud()');
    const g = document.getElementById('goal');
    expect(g.textContent).toContain('Noch 17 Erfolge bis zum 4. Inselstern');
    expect(g.querySelector('.isle-goal .isle-bar b')).not.toBe(null);
    setStars(120); game('updateHud()');
    expect(g.querySelector('.isle-goal')).toBe(null);
  });

  it('neuer Inselstern: Fenster mit Medaille und Bonus (nicht beim stillen Zählen nach dem Laden)', () => {
    setStars(9); game('isleCheck(true)');
    game('state.achieved.zz = (state.achieved.zz || 0) + 1; isleCheck(false)');
    expect(game('isleUpPending')).toBe(1);
    game('isleUpShow()');
    const card = document.getElementById('modal-card');
    expect(card.textContent).toContain('1. Inselstern');
    expect(card.textContent).toContain('+5 %');
    expect(card.querySelector('.isle-medal.t1')).not.toBe(null);
    game('closeModal(); state.achieved.zz += 20; isleCheck(true)');          // still (Laden): kein Fenster
    expect(game('isleUpPending')).toBe(0);
  });

  it('Erfolge-Seite zeigt Medaille, Bonus und den Weg zum nächsten Inselstern', () => {
    setStars(30);
    game("openYou('erfolge')");
    const t = document.getElementById('modal-card').textContent;
    expect(t).toContain('2 Inselsterne');
    expect(t).toContain('+10 % Taler');
    expect(t).toContain('Noch 15 Erfolge bis zum 3. Inselstern');
    game('closeModal()');
  });

  it('Besucher und Freunde sehen die Erfolge: achieved steht im öffentlichen Teil des Spiegels (und weiter im privaten)', () => {
    setStars(30);
    const split = game('liveSplit(serialize())');
    const want = game('state.achieved');
    expect(JSON.parse(split.rest).achieved).toEqual(want);
    expect(JSON.parse(split.priv).achieved).toEqual(want);
  });

  it('Besuch: im Besuchsband die Medaille der Insel und „Erfolge“; Karte: Medaille über dem Rathaus', () => {
    setStars(30);
    game('visitUi()');
    const band = document.getElementById('visit-band');
    expect(band.querySelector('#visit-medal .isle-medal.t2')).not.toBe(null);
    band.querySelector('#visit-achv').click();
    expect(document.getElementById('modal-card').textContent).toContain('Erfolge von');
    game('closeModal()');
    band.remove();
    expect(game('typeof drawIsleMedal')).toBe('function');
  });

  it('style.css: Medaille als Bild, Schein für Gold und Regenbogen', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
    expect(css).toMatch(/\.isle-medal \{/);
    expect(css).toMatch(/\.isle-medal\.t5 \{[^}]*drop-shadow/);
  });
});

describe('Mehr Erfolge (Nutzer 26.10.2026: „es sollte mehr Erfolge geben“)', () => {
  it('rund 45 sichtbare Erfolge, alle Stufen aufsteigend, jeder Wert ohne Fehler (auch im leeren Spiel und beim Besuch ohne Zähler)', () => {
    const list = game('ACHIEVEMENTS.map(a => ({ id: a.id, tiers: a.tiers, v: a.value() }))');
    expect(list.length).toBeGreaterThanOrEqual(44);
    expect(new Set(list.map(a => a.id)).size).toBe(list.length);
    for (const a of list) { expect(typeof a.v).toBe('number'); expect(Number.isFinite(a.v)).toBe(true); for (let i = 1; i < a.tiers.length; i++) expect(a.tiers[i]).toBeGreaterThan(a.tiers[i - 1]); }
    game("state.stats = { earned: 0 }");                                        // Besuch: Zähler fehlen
    expect(game('ACHIEVEMENTS.every(a => Number.isFinite(a.value()))')).toBe(true);
    const total = game('ACHIEVEMENTS.reduce((n, a) => n + a.tiers.length, 0)');
    expect(total).toBeGreaterThanOrEqual(130);                                    // mit den versteckten rund 150 Sterne: 5 Inselsterne bleiben besonders
  });
  it('neue Zähler: Feste, Päckchen, Hilfe bei Wünschen, verschenkte Souvenirs, gesammelter Sternstaub', () => {
    game("state.stats = { earned: 0 }; sdAdd(25); sdAdd(5)");
    expect(game('state.stats.sdTotal')).toBe(30);
    game("statCount('fests'); statCount('fests')");
    expect(game("ACHIEVEMENTS.find(a => a.id === 'feste').value()")).toBe(2);
    expect(game("ACHIEVEMENTS.find(a => a.id === 'album').tiers.at(-1)")).toBe(game('ALBUM.length'));
    for (const id of ['paeckchen', 'wunschhilfe', 'souvenirs_weg', 'sternstaub', 'truhen', 'tageswunsch', 'album', 'natur']) expect(game(`!!ACHIEVEMENTS.find(a => a.id === '${id}')`)).toBe(true);
  });
  it('Truhen und Tageswünsche zählen aus dem, was der Spielstand schon kennt (alte Stände bekommen ihren Fortschritt sofort)', () => {
    game("state.sdGot = new Set(['chest:a', 'chest:b', 'wish:20261020', 'wish:20261021', 'wish:20261022', 'a:taler:1'])");
    expect(game("ACHIEVEMENTS.find(a => a.id === 'truhen').value()")).toBe(2);
    expect(game("ACHIEVEMENTS.find(a => a.id === 'tageswunsch').value()")).toBe(3);
  });
});
