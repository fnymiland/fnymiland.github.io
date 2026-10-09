'use strict';
// ---------------------------------------------------------------------------
// Einstellungen (Nutzer, 09.10.2026: „welche Grafikoptionen können wir noch anbieten – eigenes Menü“): ☰ → ⚙️ Einstellungen
// öffnet ein eigenes Fenster mit Schnellwahl (Schön · Ausgewogen · Schnell) darunter der Ton-Knopf und zwei Gruppen: Anzeige, Leistung (ohne Emojis, Nutzer).
// Neue Schalter je Gerät in GFX (localStorage GFX_KEY); die älteren behalten ihre Schlüssel (Bildrate, still, himmel, gl,
// minimap). Ton und Randlinien bleiben im Spielstand. Standard = wie bisher (alles an, echte Uhr, volle Schärfe) –
// bestehende Spieler sehen nach dem Update nichts anders; „Schnell“ wird nie von selbst gewählt.
// Alles hier ist nur Bild: Einwohner/Tiere „aus“ heißt unsichtbar, gezählt und gerechnet wird weiter.
// ---------------------------------------------------------------------------
const GFX_KEY = 'kachelhausen_anzeige';
const GFX_DEFAULT = { sharp: 'voll', day: 'uhr', shadows: true, people: 'viele', animals: true, icons: true, labels: true, sparkle: true };
const GFX = (() => {
  let v = {};
  try { v = JSON.parse(localStorage.getItem(GFX_KEY) || '{}') || {}; } catch (e) { v = {}; }
  const out = { ...GFX_DEFAULT };
  for (const k of Object.keys(GFX_DEFAULT)) if (typeof v[k] === typeof GFX_DEFAULT[k]) out[k] = v[k];
  if (!['voll', 'halb'].includes(out.sharp)) out.sharp = 'voll';
  if (!['uhr', 'tag'].includes(out.day)) out.day = 'uhr';
  if (!['viele', 'wenige', 'keine'].includes(out.people)) out.people = 'viele';
  return out;
})();
function setGfx(k, v) {
  if (!(k in GFX_DEFAULT) || GFX[k] === v) return;
  GFX[k] = v;
  try { localStorage.setItem(GFX_KEY, JSON.stringify(GFX)); } catch (e) { /* privates Fenster: gilt bis zum Neuladen */ }
  if (k === 'sharp') resize();                                            // neue Pixeldichte (leert Bildchen und Boden)
  if (k === 'shadows' && typeof resetDrawCaches === 'function') { resetDrawCaches(); groundVersion++; }   // Schatten stecken im Boden-Bild
}
// Schärfe „halb“: halb so viele Bildpunkte je Richtung – auf schwachen Geräten viel flüssiger, etwas weicher
const gfxDprMul = () => GFX.sharp === 'halb' ? 0.5 : 1;
// Einwohner „wenige“: jeder dritte, fest je Figur (sonst flackert, wer gezeigt wird)
const gfxPersonShown = w => GFX.people === 'viele' || (GFX.people === 'wenige' && (w.fewPick ??= Math.random()) < 0.34);

// Schnellwahl: setzt nur, was Leistung kostet – Tageszeit, Symbole, Schilder, Minimap und Randlinien bleiben, wie man sie hat
const GFX_PRESETS = {
  schoen: { name: 'Schön', fps: 'fluessig', sharp: 'voll', still: false, sky: true, people: 'viele', animals: true, shadows: true, sparkle: true },
  ausgewogen: { name: 'Ausgewogen', fps: null, sharp: 'voll', still: true, sky: true, people: 'viele', animals: true, shadows: true, sparkle: true },   // fps null: wie das Gerät (PC flüssig, iPad sparsam)
  schnell: { name: 'Schnell', fps: 'sparsam', sharp: 'halb', still: true, sky: false, people: 'wenige', animals: false, shadows: false, sparkle: false },
};
const presetFps = P => P.fps || (touchDevice() ? 'sparsam' : 'fluessig');
function gfxPresetOf() {
  return Object.keys(GFX_PRESETS).find(id => {
    const P = GFX_PRESETS[id];
    return fpsMode === presetFps(P) && stillFar === P.still && skyShow === P.sky && ['sharp', 'people', 'animals', 'shadows', 'sparkle'].every(k => GFX[k] === P[k]);
  }) || null;
}
function applyGfxPreset(id) {
  const P = GFX_PRESETS[id];
  if (!P) return;
  setFpsMode(presetFps(P));
  if (stillFar !== P.still) setStillFar(P.still);
  setSkyShow(P.sky);
  for (const k of ['sharp', 'people', 'animals', 'shadows', 'sparkle']) setGfx(k, P[k]);
}

// ☰ → ⚙️ Einstellungen
function showSettings() {
  const onOff = b => b ? 'an' : 'aus';
  // eine Zeile je Schalter: links was, rechts der Wert (tippen schaltet weiter); idAttr wörtlich (structure.test sucht id="…")
  const cur = gfxPresetOf(), btn = (idAttr, label, value, title = '') => `<button class="set-btn" ${idAttr}${title ? ` title="${title}"` : ''}><span>${label}</span><b>${value}</b></button>`;
  const grid = (...b) => `<div class="set-grid">${b.filter(Boolean).join('')}</div>`;
  const sky = state.inventions && (state.inventions.has('ballon') || state.inventions.has('zeppelin'));
  openModal(`
    <h2>Einstellungen</h2>
    <div class="label">Schnellwahl <span class="muted">(nur dieses Gerät)</span></div>
    <div class="looks set-presets">${Object.entries(GFX_PRESETS).map(([id, P]) => `<button class="look${cur === id ? ' on' : ''}" data-preset="${id}" aria-pressed="${cur === id}">${P.name}</button>`).join('')}</div>
    <p class="muted set-note">${cur === 'schnell' ? 'Halbe Schärfe, weniger Einwohner, ohne Tiere, Schatten und Glitzer – für ältere Geräte.' : cur === 'schoen' ? 'Alles an, immer 60 Bilder pro Sekunde, Drehendes dreht sich auch weit weg.' : cur === 'ausgewogen' ? 'Wie das Spiel von selbst eingestellt ist.' : 'Eigene Einstellung – unten einzeln gewählt.'}</p>
    <div class="set-grid set-one">${btn('id="m-sound"', 'Ton', onOff(!state.muted))}</div>
    <div class="label">Anzeige</div>
    ${grid(btn('id="m-day"', 'Tageszeit', GFX.day === 'tag' ? 'immer Tag' : 'echte Uhr', 'Echte Uhr: ein Spieltag dauert 24 Minuten, nachts leuchten die Laternen. Immer Tag: nie dunkel (die Spieluhr läuft weiter)'),
      btn('id="m-shadow"', 'Schatten', onOff(GFX.shadows)),
      btn('id="m-icons"', 'Symbole über Häusern', onOff(GFX.icons), '✨ bereit zum Ausbau, 💭 fast geschafft, 😣 Bahnhof voll, ⚡ ohne Strom …'),
      btn('id="m-labels"', 'Namensschilder', onOff(GFX.labels), 'Schilder der Sehenswürdigkeiten und Namen über Figuren (neue Inseln zum Entdecken bleiben angeschrieben)'),
      btn('id="m-sparkle"', 'Glitzer & Feuerwerk', onOff(GFX.sparkle)),
      btn('id="m-borders"', 'Randlinien', onOff(!state.noBorders), 'Ränder von Park und Freizeitpark'),
      sky && btn('id="m-sky"', 'Ballons & Zeppelin', onOff(skyShow), 'Heißluftballons und Zeppelin am Himmel zeigen oder ausblenden'),
      miniWanted() && btn('id="m-mini"', miniOpen ? 'Minimap ausschalten' : 'Minimap einschalten', '', 'Übersichtskarte unten rechts'))}
    <div class="label">Leistung <span class="muted">(nur dieses Gerät)</span></div>
    ${grid(btn('id="m-fps"', 'Bildrate', fpsMode === 'fluessig' ? 'flüssig' : 'sparsam', fpsMode === 'fluessig' ? 'Immer 60 Bilder pro Sekunde – braucht mehr Strom' : 'Beim Zuschauen 30, später 15 Bilder pro Sekunde – schont Akku und hält das Gerät kühl'),
      btn('id="m-sharp"', 'Schärfe', GFX.sharp, 'Halb: halb so viele Bildpunkte je Richtung – viel flüssiger auf älteren Geräten, etwas weicher'),
      btn('id="m-people"', 'Einwohner', GFX.people, 'Nur was man sieht – gezählt und gerechnet wird immer mit allen'),
      btn('id="m-animals"', 'Tiere', onOff(GFX.animals), 'Vögel, Schmetterlinge, Glühwürmchen und Co. – aus: man kann sie auch nicht fürs Album entdecken'),
      btn('id="m-still"', 'Drehendes weit weg', stillFar ? 'steht still' : 'dreht sich', 'Mühlen, Windräder, Riesenrad und Fahrgeschäfte, wenn du weit rausgezoomt bist – still ist schneller, nah dran drehen sie sich immer'),
      btn('id="m-gl"', 'Grafikkarte', onOff(glWanted()), 'Zeichnet weit weg über die Grafikkarte – viel flüssiger. Bei Darstellungsfehlern ausschalten (dann wie früher)'),
      btn('id="m-bench"', 'Messlauf', '≈ 45 s', 'Zoomt und schiebt ~45 Sekunden von selbst und misst, wie flüssig es auf diesem Gerät läuft'))}
    <div class="row"><button class="btn ghost" style="flex:1" id="m-back">Zurück</button><button class="btn" style="flex:1" id="m-close">Weiterspielen</button></div>`);
  const again = () => showSettings();
  const click = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { fn(); again(); }; };
  for (const b of document.querySelectorAll('[data-preset]')) b.onclick = () => { applyGfxPreset(b.dataset.preset); sfx('deco'); again(); };
  click('m-sound', () => { state.muted = !state.muted; save(); });
  click('m-day', () => setGfx('day', GFX.day === 'tag' ? 'uhr' : 'tag'));
  click('m-shadow', () => setGfx('shadows', !GFX.shadows));
  click('m-icons', () => setGfx('icons', !GFX.icons));
  click('m-labels', () => setGfx('labels', !GFX.labels));
  click('m-sparkle', () => setGfx('sparkle', !GFX.sparkle));
  click('m-borders', () => { state.noBorders = !state.noBorders; groundVersion++; save(); });   // Ränder von Park und Freizeitpark
  click('m-sky', () => setSkyShow(!skyShow));                                                    // Ballons & Zeppelin aus (Nutzer)
  click('m-mini', () => setMiniOpen(!miniOpen));                                                 // Minimap (Block 135)
  click('m-fps', () => setFpsMode(fpsMode === 'fluessig' ? 'sparsam' : 'fluessig'));            // Bildrate (Block 79)
  click('m-sharp', () => setGfx('sharp', GFX.sharp === 'halb' ? 'voll' : 'halb'));
  click('m-people', () => setGfx('people', { viele: 'wenige', wenige: 'keine', keine: 'viele' }[GFX.people]));
  click('m-animals', () => setGfx('animals', !GFX.animals));
  click('m-still', () => setStillFar(!stillFar));                                                // Block 144
  if ($('m-gl')) $('m-gl').onclick = () => {
    setGlWanted(!glWanted()); again();
    if (GL_Q) toast(`In der Adresse steht ?gl=${GL_Q} – das gilt, solange es dort steht`);
  };
  $('m-bench').onclick = () => benchStart();                                                     // Block 149
  $('m-back').onclick = () => showMenu();
  $('m-close').onclick = closeModal;
}
