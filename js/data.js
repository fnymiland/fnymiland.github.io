'use strict';
/* Kachelhausen – eine kleine Inselwelt zum Verwalten und Gestalten.
   Wege verbinden Viertel, Betriebe liefern Rohstoffe,
   Schulen erzeugen Ideen (💡) für die Forschung, Sehenswürdigkeiten locken zum Ausbau. */
// ---------------------------------------------------------------------------
// Grundwerte
// ---------------------------------------------------------------------------
const TW = 64, TH = 32, DEPTH = 9, CHUNK = 6;
const SAVE_KEY = 'kachelhausen_v3';
const MAX_LVL = 3;              // Gebäude-Stufen (Häuser: HOUSE_STAGES)
const ZOOM_MIN = 0.45, ZOOM_MAX = 2.6;
const ISLAND = { cMin: -4, cMax: 4, cx: 2.5, cy: 2.5, r: 26 };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Drehung rot 0–3: in diese Richtung zeigt die Tür (0 = +x rechts vorn, 1 = +y links vorn, 2 = −x, 3 = −y hinten).
// size = [Tiefe, Breite] bei rot 0; bei ungerader Drehung liegt das Gebäude quer.
const FRONT_DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
// ?probe: Beispieldorf zum Anschauen, wird nie gespeichert
const PROBE = new URLSearchParams(location.search).has('probe');

// cat: bau | netz | bildung | deko | land;  needs: Untergrund;  workers/science: Netzwerte
const ITEMS = {
  // --- Wohnen & Arbeit ---
  haus:    { cat: 'bau', name: 'Haus', cost: 40, needs: 'grass', pop: 4,
             desc: 'Hier wohnt jemand. Wünsche erfüllen, dann ausbauen.' },
  feld:    { cat: 'bau', name: 'Feld', cost: 20, needs: 'grass', workers: 1, desc: '1 Taler/s.' },
  muehle:  { cat: 'bau', name: 'Mühle', cost: 150, needs: 'grass', workers: 1,
             desc: '+2 Taler/s für jedes Feld direkt daneben.' },
  holz:    { cat: 'bau', name: 'Holzfäller', cost: 60, needs: 'forest', workers: 1, ugly: 4, prod: { holz: 0.3 },
             desc: 'Nur im Wald. Liefert Holz 🪵. Laut für Nachbarn.' },
  fischer: { cat: 'bau', name: 'Fischerhütte', cost: 80, needs: 'shore', workers: 1,
             desc: 'Am Wasser. +1,5 Taler/s pro Wasserfeld daneben.' },
  obst:    { cat: 'bau', name: 'Obstplantage', lm: 'obsthain:1', cost: 120, needs: 'obst', workers: 1, prod: { obst: 0.3 },
             desc: 'Nur im Wilden Obsthain. Liefert Obst 🍎.' },
  stein:   { cat: 'bau', name: 'Steinbruch', cost: 150, needs: 'rock', workers: 2, ugly: 10, prod: { stein: 0.25 },
             desc: 'Nur auf Fels. Liefert Stein 🪨, staubig.' },
  mine:    { cat: 'bau', name: 'Bergwerk', lm: 'erzberg:1', cost: 300, needs: 'erz', workers: 3, ugly: 8, prod: { erz: 0.2 },
             desc: 'Nur am Erzberg. Liefert Erz ⛏️.' },
  kristallmine: { cat: 'bau', name: 'Kristallmine', lm: 'kristall:1', cost: 1500, mat: { bretter: 10, metall: 4 }, needs: 'kristall', workers: 3,
             ugly: 4, prod: { kristall: 0.08 }, desc: 'Nur auf Kristallfels. Liefert Kristall 💎 für Glas und Kristall-Deko.' },
  saege:   { cat: 'bau', name: 'Sägewerk', lm: 'baum:1', size: [1, 2], cost: 200, needs: 'grass', workers: 2, ugly: 3, rot: true,
             conv: { from: 'holz', to: 'bretter', rate: 0.15 }, desc: 'Macht aus 2 Holz 🪵 ein Brett 🪚.' },
  steinmetz: { cat: 'bau', name: 'Steinmetz', lm: 'klippe:1', cost: 250, needs: 'grass', workers: 2, ugly: 4, rot: true,
             conv: { from: 'stein', to: 'quader', rate: 0.12 }, desc: 'Macht aus 2 Stein 🪨 einen Pflasterstein 🧱.' },
  schmiede: { cat: 'bau', name: 'Schmiede', lm: 'erzberg:2', cost: 350, needs: 'grass', workers: 2, ugly: 6, rot: true,
             conv: { from: 'erz', to: 'metall', rate: 0.1 }, desc: 'Macht aus 2 Erz ⛏️ ein Stück Metall 🔩.' },
  baecker: { cat: 'bau', name: 'Bäckerei', lm: 'obsthain:2', size: [1, 2], cost: 400, needs: 'grass', workers: 2,
             desc: '+6 Taler/s für jede Mühle direkt daneben.' },
  markt:   { cat: 'bau', name: 'Markt', size: [3, 3], cost: 800, needs: 'grass', workers: 2, tech: 'handel',
             desc: '+1,5 Taler/s für jedes Gebäude im Umkreis von 2.' },
  fabrik:  { cat: 'bau', name: 'Werkstatt', size: [1, 2], cost: 1200, needs: 'grass', workers: 4, tech: 'industrie', ugly: 12,
             desc: '25 Taler/s, +5 für jedes Bergwerk im Umkreis von 3.' },
  hafen:   { cat: 'bau', name: 'Hafen', size: [2, 2], cost: 1500, needs: 'shore', workers: 3, tech: 'seehandel',
             desc: 'Handel mit der Welt: +8 % auf alle Einnahmen.' },
  leuchtturm: { cat: 'bau', name: 'Leuchtturm', cost: 3000, mat: { quader: 40, metall: 25, bretter: 30 }, needs: 'shore', workers: 1, lanterns: 21, beauty: 40,
             desc: 'Das große Finale: Wenn alle 21 Laternen brennen, bringt der Leuchtturm das Laternenfest zurück.' },
  // --- Wege ---
  weg:     { cat: 'netz', name: 'Weg', cost: 5, needs: 'grass', beauty: 1, paint: true,
             desc: 'Belegt ein ganzes Feld. Viele Stile – vom Sandweg bis zum Klinkerplatz. Verbindet Viertel. Ziehen = mehrere legen.' },
  schiene: { cat: 'netz', name: 'Schiene', cost: 15, mat: { holz: 1, metall: 1 }, needs: 'grass', tech: 'bahn', paint: true,
             desc: 'Für den elektrischen Zug. Über Wasser wird sie zur Brücke (🪙 40 🪵2 🔩2). Ziehen = mehrere legen.' },
  // intern „station“: „bahnhof“ war ein früheres, entferntes Gebäude (alte Stände bekommen dafür Geld zurück)
  station: { cat: 'netz', name: 'Bahnhof', size: [1, 2], cost: 800, mat: { bretter: 10, quader: 6, metall: 4 }, needs: 'grass', tech: 'bahn',
             desc: 'Braucht Schienen direkt am Bahnsteig. Zwei verbundene Bahnhöfe auf verschiedenen Inseln: Pendler und +10 % für beide.' },
  // --- Bildung ---
  schule:  { cat: 'bildung', name: 'Schule', lm: 'ruine:1', size: [2, 2], cost: 300, needs: 'grass', workers: 2, science: 0.6,
             desc: 'Erzeugt Ideen 💡 für die Forschung (je mehr Einwohner, desto mehr).' },
  bibliothek: { cat: 'bildung', name: 'Bibliothek', lm: 'ruine:2', size: [1, 2], cost: 500, needs: 'grass', workers: 1, science: 1, beauty: 5,
             desc: '+1 💡/s.' },
  uni:     { cat: 'bildung', name: 'Universität', size: [2, 2], cost: 2000, needs: 'grass', workers: 4, science: 3, beauty: 10, tech: 'uni',
             desc: '+3 💡/s.' },
  kunst:   { cat: 'bildung', name: 'Kunstakademie', lm: 'ruine:3', size: [1, 2], cost: 700, needs: 'grass', workers: 2, science: 0.4, beauty: 25,
             desc: 'Schönheit +25 und ein paar kreative Ideen 💡.' },
  // --- Deko ---
  blumen:  { cat: 'deko', name: 'Blumenbeet', cost: 30, needs: 'grass', beauty: 4, desc: '+15 % für Gebäude direkt daneben.' },
  baum:    { cat: 'deko', name: 'Baum', cost: 15, beauty: 2, small: true, desc: 'Ein Obstbaum. Klein – bis zu 4 pro Feld, auch neben Bank und Blumentopf.' },
  blumentopf: { cat: 'deko', name: 'Blumentopf', cost: 10, beauty: 2, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  busch:   { cat: 'deko', name: 'Kleiner Busch', cost: 10, beauty: 2, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  hecke:   { cat: 'deko', name: 'Hecke', cost: 10, beauty: 1, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  bank:    { cat: 'deko', name: 'Bank', cost: 35, mat: { bretter: 2 }, beauty: 3, small: true, desc: 'Klein – bis zu 4 pro Feld, auch vor dem Haus. In die gewünschte Ecke tippen.' },
  laterne: { cat: 'deko', name: 'Laterne', cost: 40, mat: { metall: 1 }, beauty: 4, small: true, design: 150, desc: 'Leuchtet nachts. Klein – bis zu 4 pro Feld.' },
  brunnen: { cat: 'deko', name: 'Brunnen', lm: 'quelle:2', cost: 250, mat: { quader: 8 }, needs: 'grass', beauty: 15, desc: 'Plätschert.' },
  park:    { cat: 'deko', name: 'Park', lm: 'baum:2', size: [3, 3], cost: 300, needs: 'grass', beauty: 30, mat: { bretter: 2 },
             desc: 'Eine grüne Oase mit Teich, Bäumen und Bänken. Belegt 3×3 Felder.' },
  kristall: { cat: 'deko', name: 'Kristall', lm: 'kristall:1', cost: 20, mat: { kristall: 1 }, beauty: 5, small: true, desc: 'Ein kleiner leuchtender Kristall. Klein – bis zu 4 pro Feld.' },
  kristallaterne: { cat: 'deko', name: 'Kristall-Laterne', lm: 'kristall:2', cost: 60, mat: { kristall: 1, metall: 1 }, beauty: 6, small: true,
             desc: 'Leuchtet nachts hellblau. Klein – bis zu 4 pro Feld.' },
  glaskugel: { cat: 'deko', name: 'Glaskugel', lm: 'kristall:2', cost: 40, mat: { kristall: 1 }, beauty: 4, small: true,
             desc: 'Eine schimmernde Glaskugel auf einem Sockel. Klein – bis zu 4 pro Feld.' },
  kristallbrunnen: { cat: 'deko', name: 'Kristallbrunnen', lm: 'kristall:3', cost: 500, mat: { kristall: 4, quader: 6 }, needs: 'grass', beauty: 22,
             desc: 'Plätschert, glitzert und leuchtet nachts.' },
  glashaus: { cat: 'deko', name: 'Glashaus', lm: 'kristall:3', size: [1, 2], cost: 900, mat: { kristall: 6, metall: 4, bretter: 6 }, needs: 'grass', beauty: 28,
             desc: 'Ein Gewächshaus aus Glas voller Blumen und Palmen. Leuchtet abends warm.' },
  // Belohnungen für Erfolge (rank = so viele ⭐ nötig): nur so zu bekommen, kosten nichts
  pokal_bronze: { cat: 'deko', name: 'Bronze-Pokal', cost: 0, beauty: 6, small: true, rank: 5, desc: 'Für die Ehrennadel in Bronze (5 ⭐ Erfolge).' },
  pokal_silber: { cat: 'deko', name: 'Silber-Pokal', cost: 0, beauty: 10, small: true, rank: 15, desc: 'Für die Ehrennadel in Silber (15 ⭐ Erfolge).' },
  pokal_gold: { cat: 'deko', name: 'Gold-Pokal', cost: 0, beauty: 16, small: true, rank: 30, desc: 'Für die Ehrennadel in Gold (30 ⭐ Erfolge). Funkelt.' },
  windrad: { cat: 'deko', name: 'Windrad', lm: 'klippe:3', cost: 200, needs: 'grass', beauty: 6, desc: 'Dreht sich gemütlich im Wind.' },
  pavillon:{ cat: 'deko', name: 'Pavillon', cost: 400, mat: { bretter: 8 }, needs: 'grass', beauty: 20, design: 600, master: true, desc: 'Für Konzerte im Park.' },
  statue:  { cat: 'deko', name: 'Sternstatue', cost: 700, mat: { quader: 6, metall: 2 }, needs: 'grass', beauty: 30, design: 900, master: true, desc: 'Glänzt golden.' },
  // --- Gelände ---
  graben:  { cat: 'land', name: 'Teich graben', cost: 30, paint: true, desc: 'Macht aus Wiese Wasser (gut für Fischer).' },
  schuett: { cat: 'land', name: 'Aufschütten', cost: 60, paint: true, desc: 'Macht aus Wasser neues Land – auch im Meer direkt neben deinem Land. Ziehen = mehrere.' },
  verschieben: { cat: 'land', name: 'Verschieben', cost: 0, desc: 'Etwas antippen, dann das Ziel antippen. Kostenlos, auch Rathaus und restaurierte Sehenswürdigkeiten.' },
  abriss:  { cat: 'land', name: 'Abreißen', cost: 0, desc: 'Gebäude (halber Preis zurück), Wald roden, Fels sprengen.' },
  // --- fest ---
  rathaus: { cat: null, name: 'Rathaus', size: [2, 2], beauty: 5, fixed: true, desc: 'Das Herz deiner Insel. Alle Wege führen hierher.' },
  lm:      { cat: null, name: 'Sehenswürdigkeit', size: [3, 3], fixed: true, desc: '' },
};
// Rohstoffe und Waren im gemeinsamen Lager
const RES = {
  holz: { name: 'Holz', icon: '🪵' }, stein: { name: 'Stein', icon: '🪨' }, erz: { name: 'Erz', icon: '⛏️' },
  obst: { name: 'Obst', icon: '🍎' }, bretter: { name: 'Bretter', icon: '🪚' }, quader: { name: 'Pflastersteine', icon: '🧱' },
  metall: { name: 'Metall', icon: '🔩' }, kristall: { name: 'Kristall', icon: '💎' },
};
const CONV_RATIO = 2;           // 2 Rohstoff → 1 Ware
const newRes = () => Object.fromEntries(Object.keys(RES).map(k => [k, 0]));
const matText = mat => Object.entries(mat || {}).map(([r, n]) => `${RES[r].icon}${n}`).join(' ');
const hasMat = mat => Object.entries(mat || {}).every(([r, n]) => state.res[r] >= n);
const payMat = mat => { for (const [r, n] of Object.entries(mat || {})) state.res[r] -= n; };
function matError(mat) {
  for (const [r, n] of Object.entries(mat || {})) if (state.res[r] < n) return `Zu wenig ${RES[r].name} (${n} ${RES[r].icon} nötig)`;
  return null;
}

// Häuser wachsen: jede Stufe bringt neue Wünsche; sind alle erfüllt, kann man ausbauen (Material aus dem Lager)
const HOUSE_STAGES = [
  { name: 'Häuschen', pop: 4 },
  { name: 'Fachwerkhaus', pop: 6, wishes: ['weg', 'deko'], mat: { bretter: 2 } },
  { name: 'Reetdachhaus', pop: 9, wishes: ['baecker', 'ruhe'], mat: { bretter: 4 } },
  { name: 'Stadthaus', pop: 12, wishes: ['markt', 'park'], mat: { quader: 4 } },
  { name: 'Villa', pop: 16, wishes: ['schule', 'schoen'], mat: { quader: 4, metall: 2 } },
  // erst mit Kristall von der Kristallinsel: moderne Villa mit viel Glas
  { name: 'Glasvilla', pop: 22, wishes: ['wasser'], mat: { kristall: 8, quader: 6, metall: 4 }, lm: 'kristall:1' },
];
const WISHES = {
  weg:     { text: 'Weg vor der Tür' },
  deko:    { text: 'Deko in der Nähe (2 Felder)' },
  baecker: { text: 'Bäckerei in Laufweite (6 Felder)' },
  ruhe:    { text: 'Ruhe – kein lauter Betrieb direkt daneben' },
  markt:   { text: 'Markt in Laufweite (8 Felder)' },
  park:    { text: 'Park oder Brunnen in der Nähe (4 Felder)' },
  schule:  { text: 'Schule in der Nähe (10 Felder)' },
  schoen:  { text: 'Schöne Umgebung (🌸 30 in 3 Feldern)' },
  wasser:  { text: 'Blick aufs Wasser (Teich, See oder Meer in 3 Feldern)' },
};
// Gebäude wachsen in drei Stufen (wie Häuser): Bedingungen erfüllen (✨), dann selbst ausbauen – mit neuem Aussehen.
// Jede Stufe braucht workers weitere Mitarbeiter (freie Einwohner). Bedingungen: near = [Sorte(n), Anzahl, Umkreis],
// water = Wasserfelder direkt daneben, pop = Einwohner auf der Insel, beauty = [🌸, Umkreis].
const BUILD_STAGES = {
  feld:      { names: ['Acker', 'Kornfeld', 'Gutshof-Feld'],
               up: [{ near: ['muehle', 1, 3], cost: { money: 40, bretter: 2 } }, { near: ['baecker', 1, 6], cost: { money: 120, bretter: 4, quader: 2 } }] },
  muehle:    { names: ['Mühle', 'Kornmühle', 'Große Windmühle'],
               up: [{ near: ['feld', 3, 1], cost: { money: 200, bretter: 6 } }, { near: ['baecker', 1, 4], cost: { money: 500, bretter: 8, quader: 6 } }] },
  holz:      { names: ['Holzfällerhütte', 'Holzfällerhof', 'Försterei'],
               up: [{ near: ['saege', 1, 6], cost: { money: 80, bretter: 4 } }, { near: ['holz', 2, 4], cost: { money: 250, bretter: 8, quader: 4 } }] },
  fischer:   { names: ['Fischerhütte', 'Fischerkate', 'Fischerei'],
               up: [{ water: 4, cost: { money: 100, bretter: 4 } }, { near: ['markt', 1, 8], cost: { money: 300, bretter: 8, quader: 4 } }] },
  obst:      { names: ['Obstplantage', 'Obstgarten', 'Obsthof'],
               up: [{ near: ['baecker', 1, 6], cost: { money: 150, bretter: 6 } }, { near: ['obst', 2, 2], cost: { money: 400, bretter: 8, quader: 4 } }] },
  stein:     { names: ['Steinbruch', 'Steinbruch mit Kran', 'Großer Steinbruch'],
               up: [{ near: ['steinmetz', 1, 6], cost: { money: 180, bretter: 6 } }, { near: ['stein', 2, 3], cost: { money: 450, bretter: 10, metall: 2 } }] },
  mine:      { names: ['Bergwerk', 'Stollen mit Lore', 'Großes Bergwerk'],
               up: [{ near: ['schmiede', 1, 8], cost: { money: 350, bretter: 8, quader: 4 } }, { near: ['fabrik', 1, 8], cost: { money: 800, quader: 10, metall: 4 } }] },
  kristallmine: { names: ['Kristallmine', 'Kristallstollen', 'Kristallschleiferei'],
               up: [{ near: ['kristallmine', 1, 6], cost: { money: 1200, bretter: 10, metall: 4 } }, { near: ['haus', 4, 6], cost: { money: 2500, quader: 10, metall: 6 } }] },
  saege:     { names: ['Sägewerk', 'Großes Sägewerk', 'Holzhof'],
               up: [{ near: ['holz', 2, 6], cost: { money: 250, bretter: 6, quader: 2 } }, { near: ['holz', 4, 6], cost: { money: 600, bretter: 10, quader: 6, metall: 2 } }] },
  steinmetz: { names: ['Steinmetz', 'Steinmetzhof', 'Bildhauerei'],
               up: [{ near: ['stein', 1, 6], cost: { money: 300, bretter: 6, quader: 4 } }, { near: ['stein', 2, 6], cost: { money: 700, quader: 10, metall: 3 } }] },
  schmiede:  { names: ['Schmiede', 'Kunstschmiede', 'Hammerwerk'],
               up: [{ near: ['mine', 1, 8], cost: { money: 400, bretter: 6, quader: 6 } }, { near: ['mine', 2, 8], cost: { money: 900, quader: 10, metall: 6 } }] },
  baecker:   { names: ['Bäckerei', 'Backstube', 'Konditorei'],
               up: [{ near: ['muehle', 1, 3], cost: { money: 450, bretter: 8, quader: 4 } }, { near: ['obst', 1, 6], cost: { money: 1000, quader: 8, metall: 3 } }] },
  markt:     { names: ['Markt', 'Wochenmarkt', 'Großer Markt'],
               up: [{ near: ['haus', 5, 8], cost: { money: 900, bretter: 10, quader: 6 } }, { near: ['haus', 10, 8], cost: { money: 2000, quader: 12, metall: 6 } }] },
  fabrik:    { names: ['Werkstatt', 'Manufaktur', 'Große Werkstatt'],
               up: [{ near: ['mine', 1, 4], cost: { money: 1300, quader: 8, metall: 4 } }, { near: ['schmiede', 1, 6], cost: { money: 3000, quader: 14, metall: 8 } }] },
  hafen:     { names: ['Hafen', 'Handelshafen', 'Großer Hafen'],
               up: [{ near: ['fischer', 2, 8], cost: { money: 1600, bretter: 16, quader: 6 } }, { near: ['fischer', 4, 8], cost: { money: 3500, bretter: 20, quader: 12, metall: 6 } }] },
  schule:    { names: ['Dorfschule', 'Schulhaus', 'Große Schule'],
               up: [{ pop: 25, cost: { money: 350, bretter: 8, quader: 4 } }, { pop: 60, near: ['bibliothek', 1, 10], cost: { money: 900, quader: 10, metall: 3 } }] },
  bibliothek:{ names: ['Bücherei', 'Bibliothek', 'Große Bibliothek'],
               up: [{ pop: 35, near: ['schule', 1, 10], cost: { money: 550, bretter: 8, quader: 6 } }, { pop: 70, near: [['park', 'brunnen'], 1, 4], cost: { money: 1200, quader: 12, metall: 4 } }] },
  uni:       { names: ['Universität', 'Große Universität', 'Sternwarte'],
               up: [{ pop: 80, near: ['bibliothek', 1, 10], cost: { money: 2200, quader: 16, metall: 6 } }, { pop: 120, near: ['kunst', 1, 10], cost: { money: 5000, quader: 24, metall: 12 } }] },
  kunst:     { names: ['Kunstakademie', 'Atelierhaus', 'Kunstpalast'],
               up: [{ pop: 40, beauty: [40, 3], cost: { money: 800, bretter: 8, quader: 6 } }, { pop: 80, near: [['pavillon', 'statue'], 1, 4], cost: { money: 1800, quader: 12, metall: 5 } }] },
};
const PLURAL = { feld: 'Felder', muehle: 'Mühlen', holz: 'Holzfäller', fischer: 'Fischerhütten', obst: 'Obstplantagen', stein: 'Steinbrüche',
  mine: 'Bergwerke', haus: 'Häuser', schmiede: 'Schmieden', saege: 'Sägewerke', steinmetz: 'Steinmetze', kristallmine: 'Kristallminen' };
const NOISY = new Set(['saege', 'steinmetz', 'schmiede', 'fabrik', 'stein', 'holz', 'mine', 'kristallmine']);
// Bewohner: Tierart (so wie die Spaziergänger gezeichnet werden) und Vorname
const ANIMALS = [
  { id: 'katze', icon: '🐱', family: 'Katz', names: ['Ottilie', 'Minka', 'Leo', 'Frida', 'Tom', 'Lotte', 'Pepe', 'Nala'] },
  { id: 'baer', icon: '🐻', family: 'Bär', names: ['Bruno', 'Hanna', 'Paul', 'Greta', 'Emil', 'Mila', 'Otto', 'Ida'] },
  { id: 'hase', icon: '🐰', family: 'Hase', names: ['Mika', 'Lilli', 'Fips', 'Rosa', 'Jonte', 'Klara', 'Hugo', 'Wanda'] },
];

// Baumenü (gemeinsam entschieden 30.09., Variante B): vier Bereiche, „Bauen“ mit Filtern nach Zweck.
// Jedes Ding steht in genau einer Gruppe. ITEMS[].cat bleibt die Spiel-Kategorie (das Blumenbeet zählt weiter als Deko).
const MENU = [
  { id: 'bauen', label: '🏗️ Bauen', groups: [
    { id: 'wohnen', label: '🏠 Wohnen', items: ['haus'] },
    { id: 'geld', label: '🪙 Geld', items: ['feld', 'muehle', 'fischer', 'baecker', 'fabrik'] },
    { id: 'rohstoffe', label: '🪵 Rohstoffe', items: ['holz', 'obst', 'stein', 'mine', 'kristallmine', 'saege', 'steinmetz', 'schmiede'] },
    { id: 'boost', label: '⚡ Verstärker', items: ['markt', 'hafen', 'blumen'] },
    { id: 'bildung', label: '🎓 Bildung', items: ['schule', 'bibliothek', 'uni', 'kunst'] },
  ] },
  { id: 'schoen', label: '🌸 Verschönern', items: ['baum', 'blumentopf', 'busch', 'hecke', 'bank', 'laterne', 'kristall', 'kristallaterne',
    'glaskugel', 'brunnen', 'kristallbrunnen', 'park', 'glashaus', 'pavillon', 'statue', 'pokal_bronze', 'pokal_silber', 'pokal_gold', 'leuchtturm'] },
  { id: 'verbinden', label: '🛤️ Verbinden', items: ['weg', 'schiene', 'station', 'windrad'] },
  { id: 'land', label: '⛰️ Gelände', items: ['graben', 'schuett', 'verschieben', 'abriss'] },
];
// Wo steht ein Ding im Menü? (für „Ausprobieren“)
function menuPlaceOf(id) {
  for (const m of MENU) {
    if (m.groups) { for (const g of m.groups) if (g.items.includes(id)) return { top: m.id, sub: g.id }; }
    else if (m.items.includes(id)) return { top: m.id, sub: 'alle' };
  }
  return { top: 'bauen', sub: 'alle' };
}
const menuItemsOf = (top, sub = 'alle') => {
  const m = MENU.find(e => e.id === top) || MENU[0];
  if (!m.groups) return m.items;
  return sub === 'alle' ? m.groups.flatMap(g => g.items) : (m.groups.find(g => g.id === sub) || m.groups[0]).items;
};
// Wirkung auf einen Blick (Karte in der Leiste unten)
const FX = {
  haus: '👥 +4', feld: '🪙 +1/s', muehle: '+2/s je Feld', fischer: '+1,5/s je Wasser', baecker: '+6/s je Mühle', fabrik: '🪙 +25/s',
  holz: '🪵 Holz', obst: '🍎 Obst', stein: '🪨 Stein', mine: '⛏️ Erz', kristallmine: '💎 Kristall',
  saege: '🪵 → 🪚', steinmetz: '🪨 → 🧱', schmiede: '⛏️ → 🔩',
  markt: '+1,5/s je Nachbar', hafen: '+8 % auf alles', blumen: '+15 % Nachbarn',
  schule: '💡 Ideen', bibliothek: '💡 +1/s', uni: '💡 +3/s', kunst: '🌸 +25 · 💡',
  weg: 'verbindet Viertel', schiene: '🚆 Strecke', station: '👥 +8 Pendler', windrad: '⚡ Strom für Züge',
  graben: '💧 Wasser', schuett: '🏝️ neues Land', leuchtturm: '🏮 Laternenfest',
};
// Tipp im „Neu freigeschaltet“-Fenster: wohin damit, wozu ist es gut
const ITEM_TIPS = {
  haus: 'Häuser bringen Einwohner. Tipp ein Haus an: Erfüllst du seine Wünsche, kannst du es ausbauen – bis zur Villa.',
  feld: 'Bringt Taler. Mit einer Mühle direkt daneben wird es noch mehr.',
  muehle: 'Stell sie mitten zwischen Felder: Jedes Feld direkt daneben bringt +2 Taler/s.',
  holz: 'In den Wald stellen. Holz wird im Sägewerk zu Brettern und steckt in jeder Schiene.',
  fischer: 'Direkt ans Wasser: Je mehr Wasser drumherum, desto mehr Taler.',
  obst: 'In den Obsthain stellen (mit „Höhere Agrartechnik“ überall). Obst brauchen Sehenswürdigkeiten und Feste.',
  stein: 'Auf Fels stellen. Der Steinmetz macht aus Stein Pflastersteine.',
  mine: 'Auf die Erzader am Erzberg. Die Schmiede macht aus Erz Metall.',
  kristallmine: 'Auf Kristallfels der Kristallinsel. Kristall brauchst du für Glas-Deko und die Glasvilla.',
  saege: 'In die Nähe deiner Holzfäller. Bretter brauchst du für fast alles: Hausausbau, Bank, Park …',
  steinmetz: 'In die Nähe des Steinbruchs. Pflastersteine brauchen Stadthäuser und große Gebäude.',
  schmiede: 'In die Nähe des Bergwerks. Metall brauchen Laternen, Villen und die Bahn.',
  baecker: 'Direkt neben Mühlen: Jede Mühle daneben bringt +6 Taler/s. Häuser wünschen sich eine Bäckerei in Laufweite.',
  markt: 'Mitten ins Dorf: Jedes Gebäude im Umkreis von 2 Feldern bringt +1,5 Taler/s.',
  fabrik: 'Bringt viele Taler, mit Bergwerken in der Nähe noch mehr. Laut – nicht direkt neben Häuser.',
  hafen: 'Ans Wasser. Jeder Hafen erhöht alle Einnahmen der Insel um 8 %.',
  leuchtturm: 'Das Finale: Bau ihn am Wasser, dann beginnt das Laternenfest.',
  weg: 'Wege verbinden Gebäude zu einem Viertel und holen Betriebe weit weg auf volle Kraft.',
  schiene: 'Zieh Schienen zwischen zwei Inseln – über Wasser werden sie zur Brücke. Über einen Weg entsteht ein Bahnübergang.',
  station: 'Direkt an die Schiene stellen. Zwei verbundene Bahnhöfe auf verschiedenen Inseln und 2 Windräder: Der Zug fährt.',
  schule: 'Bringt Ideen für die Forschung – je mehr Einwohner, desto mehr. Villen wünschen sich eine Schule.',
  bibliothek: 'Mehr Ideen und die zweite Stufe der Forschung.',
  uni: 'Viele Ideen und die dritte Stufe der Forschung.',
  kunst: 'Macht die Umgebung schön und öffnet die Meisterstücke der Kunstakademie.',
  blumen: 'Direkt neben ein Gebäude: Jedes Beet daneben bringt ihm +15 %.',
  baum: 'Kleine Deko für eine Ecke – bis zu 4 pro Feld, auch hinters Haus oder an den Weg (Allee!).',
  blumentopf: 'Kleine Deko für eine Ecke, auch vors Haus. Häuser wünschen sich Deko in der Nähe.',
  busch: 'Kleine Deko für eine Ecke – bis zu 4 pro Feld, gut zum Mischen mit Baum und Bank.',
  hecke: 'Kleine Deko für eine Ecke – als Rand um Gärten und Plätze.',
  bank: 'Kleine Deko für eine Ecke, gern an den Weg oder vors Haus.',
  laterne: 'Kleine Deko, leuchtet nachts – schön entlang der Wege.',
  brunnen: 'Stadthäuser wünschen sich einen Park oder Brunnen in der Nähe.',
  park: 'Viel Schönheit auf 3×3 Feldern. Erfüllt den Park-Wunsch der Stadthäuser.',
  kristall: 'Kleine leuchtende Deko für eine Ecke.',
  kristallaterne: 'Kleine Deko, leuchtet nachts hellblau.',
  glaskugel: 'Kleine schillernde Deko für eine Ecke.',
  kristallbrunnen: 'Große Deko mit viel Schönheit, glitzert und leuchtet nachts.',
  glashaus: 'Große Deko mit viel Schönheit, leuchtet abends warm.',
  windrad: 'Liefert Strom für Züge: 2 Windräder pro Zug, egal wo.',
  pavillon: 'Große Deko mit viel Schönheit – schön im Park.',
  statue: 'Große Deko mit sehr viel Schönheit.',
  graben: 'Teiche für Fischerhütten oder den Wasserblick der Glasvilla. Ziehen = mehrere.',
  pokal_bronze: 'Deine erste Ehrennadel! Stell den Pokal vors Rathaus – kostet nichts.',
  pokal_silber: 'Ehrennadel in Silber! Der Pokal passt in jede Ecke – kostet nichts.',
  pokal_gold: 'Ehrennadel in Gold! Der Gold-Pokal funkelt – kostet nichts.',
  schuett: 'Macht Wasser zu Land – auch im Meer direkt neben deinem Land. Ziehen = mehrere.',
};
const effectText = id => FX[id] || (ITEMS[id] && ITEMS[id].beauty ? `🌸 +${ITEMS[id].beauty}` : '');

const LANDMARKS = {
  baum:     { name: 'Uralter Baum', icon: '🌳', effect: 'Schönheit (🌸 20 / 40 / 80)' },
  obsthain: { name: 'Wilder Obsthain', icon: '🍎', effect: 'Obstbäume für Plantagen, +15 🌸' },
  klippe:   { name: 'Windige Klippe', icon: '🌬️', effect: 'ab Stufe 2: Mühlen im Umkreis von 10 Feldern doppelt' },
  ruine:    { name: 'Alte Ruine', icon: '🏛️', effect: 'Ausgrabungen: +1,5 💡/s' },
  erzberg:  { name: 'Erzberg', icon: '⛏️', effect: 'Erzadern für Bergwerke, +25 % Bergwerk-Ertrag' },
  quelle:   { name: 'Heiße Quelle', icon: '♨️', effect: '+40 🌸, ab Stufe 3 Touristen: +12 Taler/s' },
  kristall: { name: 'Kristallhöhle', icon: '💎', effect: 'Forschung: +3 💡/s' },
};
// Jede Stufe: Kosten, was sie freischaltet, Tagebuchseite der alten Leuchtturmwärterin
const LM_STAGES = {
  baum: [
    { name: 'Freischneiden', cost: { money: 50, holz: 10 }, unlock: ['saege'],
      diary: 'Unter diesem Baum haben wir jeden Sommer getanzt. Schön, dass wieder jemand hier ist. Im Wald liegt bestimmt noch meine alte Säge …' },
    { name: 'Bank-Ring', cost: { money: 150, bretter: 8 }, unlock: ['park', 'weg:platten'],
      diary: 'Auf diesen Bänken wurde früher der neueste Klatsch verteilt. Und die besten Äpfel.' },
    { name: 'Lichterkette', cost: { money: 400, metall: 3 }, unlock: [],
      diary: 'Die Lichter im Baum waren das Erste, was man vom Meer aus sah – noch vor dem Leuchtturm.' },
  ],
  obsthain: [
    { name: 'Pfade anlegen', cost: { money: 50, bretter: 6 }, unlock: ['obst'],
      diary: 'Die Äpfel hier sind die süßesten der Insel. Das hat mir jedenfalls jeder Igel erzählt.' },
    { name: 'Obstwiese', cost: { money: 150, bretter: 10, quader: 4 }, unlock: ['baecker'],
      diary: 'Mit dem Obst kam der Bäcker zurück. Apfelkuchen am Sonntag – das war heilig.' },
    { name: 'Erntefest-Pavillon', cost: { money: 400, obst: 30, bretter: 10 }, unlock: ['weg:blueten'],
      diary: 'Im Herbst haben wir hier getanzt, bis die Laternen ausgingen. Die Blütenblätter lagen noch Tage auf den Wegen.' },
  ],
  klippe: [
    { name: 'Aussichtspunkt', cost: { money: 50, bretter: 8 }, unlock: ['steinmetz'],
      diary: 'Von hier oben sieht man die ganze Insel. Die Steinmetze haben früher genau hier ihre Steine geholt.' },
    { name: 'Alte Windmühle', cost: { money: 150, quader: 10 }, unlock: [],
      diary: 'Die Mühle dreht sich wieder! Der Wind hier oben schiebt jede Mühle auf der Insel an.' },
    { name: 'Drachenwiese', cost: { money: 400, bretter: 10, metall: 4 }, unlock: ['windrad'],
      diary: 'Jedes Kind hatte einen Drachen. Meiner war rot und hieß Konrad.' },
  ],
  ruine: [
    { name: 'Ausgrabung', cost: { money: 80, quader: 6 }, unlock: ['schule'],
      diary: 'Die alte Schule! Hier habe ich lesen gelernt – und das Tagebuchschreiben.' },
    { name: 'Museum', cost: { money: 200, quader: 12, bretter: 8 }, unlock: ['bibliothek'],
      diary: 'Im Museum liegen die Laternen vom allerersten Fest. Ein bisschen verbeult, aber sie leuchten noch.' },
    { name: 'Amphitheater', cost: { money: 500, quader: 20, metall: 5 }, unlock: ['kunst'],
      diary: 'Die Stufen sind wieder heil. Hier wurde gesungen, gespielt und manchmal auch gestritten.' },
  ],
  erzberg: [
    { name: 'Stollen öffnen', cost: { money: 100, bretter: 12, quader: 6 }, unlock: ['mine'],
      diary: 'Tief im Berg glitzert das Erz. Mein Großvater hat hier gearbeitet, bis er einen Bart bis zum Gürtel hatte.' },
    { name: 'Schmiedeplatz', cost: { money: 200, quader: 10 }, unlock: ['schmiede'],
      diary: 'Ohne Schmiede keine Laternen. Ohne Laternen kein Fest. So einfach ist das.' },
    { name: 'Glockenturm', cost: { money: 500, metall: 10 }, unlock: [],
      diary: 'Die Glocke hat das Fest immer eingeläutet. Jetzt schweigt sie nicht mehr.' },
  ],
  quelle: [
    { name: 'Freilegen', cost: { money: 60, bretter: 6 }, unlock: [],
      diary: 'Das warme Wasser dampft wieder! Im Winter haben wir hier die kalten Pfoten aufgewärmt.' },
    { name: 'Einfassung', cost: { money: 200, quader: 15 }, unlock: ['brunnen', 'weg:kopf'],
      diary: 'Mit Steinen eingefasst sieht die Quelle aus wie früher. Die Steinmetze waren immer stolz darauf.' },
    { name: 'Badehaus', cost: { money: 600, bretter: 20, quader: 10, metall: 4 }, unlock: [],
      diary: 'Das Badehaus ist offen! Bald kommen die Gäste von den anderen Inseln wieder.' },
  ],
  kristall: [
    { name: 'Eingang sichern', cost: { money: 100, metall: 4 }, unlock: ['kristallmine', 'kristall'],
      diary: 'In der Höhle leuchten die Kristalle ganz von allein. Die Kinder hielten sie für schlafende Sterne.' },
    { name: 'Laternenpfad', cost: { money: 300, metall: 8, quader: 10 }, unlock: ['kristallaterne', 'glaskugel'],
      diary: 'Ein Pfad aus Laternen führt jetzt hinein. Man verläuft sich nicht mehr – schade eigentlich.' },
    { name: 'Grotte', cost: { money: 600, metall: 15, obst: 20 }, unlock: ['weg:kristall', 'kristallbrunnen', 'glashaus'],
      diary: 'Die Grotte ist das Herz der Insel. Ich glaube, hier schlafen wirklich Sterne.' },
  ],
};
const LANTERN_TOTAL = 22;          // 7 Wahrzeichen × 3 Stufen + Leuchtturm
const TITLES = [[0, 'Weiler'], [3, 'Dorf'], [8, 'Städtchen'], [14, 'Kleinstadt'], [22, 'Inselperle']];

// Themen-Inseln im Meer rings um die Heimatinsel (ISLAND). Jede hat ihre Sehenswürdigkeit in der Mitte und wird –
// in dieser Reihenfolge – erschlossen, sobald die Bedingungen erfüllt sind (need: Taler, Ideen, Einwohner, Laternen).
// ter: Gelände-Mischung der Insel. deg: Richtung von der Heimatinsel aus (Grad, 0 = +x).
const ISLE_DIST = 48, ISLE_R = 11;
const ISLES = [
  { id: 'wald', name: 'Waldinsel', lm: 'baum', icon: '🌲', deg: 20, ter: 'wald',
    text: 'Dichter Wald um den Uralten Baum – hier gibt es Holz für Bretter.', need: { pop: 8, money: 150 } },
  { id: 'obst', name: 'Obstinsel', lm: 'obsthain', icon: '🍎', deg: 72, ter: 'obst',
    text: 'Wilde Apfel- und Kirschbäume – Obst für Plantagen und Bäckereien.', need: { lanterns: 1, pop: 25, money: 1200 } },
  { id: 'wind', name: 'Windinsel', lm: 'klippe', icon: '🌬️', deg: 124, ter: 'fels',
    text: 'Felsen und windige Wiesen – Stein für Pflastersteine, Wind für Mühlen.', need: { lanterns: 3, pop: 40, money: 2500 } },
  { id: 'ruine', name: 'Ruineninsel', lm: 'ruine', icon: '🏛️', deg: 176, ter: 'ruine',
    text: 'Alte Mauern im Gras – hier beginnt die Bildung: Schule, Bibliothek, Kunst.', need: { lanterns: 5, pop: 60, money: 4000 } },
  { id: 'erz', name: 'Erzinsel', lm: 'erzberg', icon: '⛏️', deg: 228, ter: 'erz',
    text: 'Ein Berg voller Erz – Metall für Laternen, Werkzeug und Maschinen.', need: { lanterns: 8, pop: 90, money: 7000, science: 50 } },
  { id: 'quelle', name: 'Quelleninsel', lm: 'quelle', icon: '♨️', deg: 280, ter: 'quelle',
    text: 'Warme Quellen und Teiche – schön zum Wohnen, Gäste kommen gern.', need: { lanterns: 11, pop: 130, money: 12000, science: 150 } },
  { id: 'kristall', name: 'Kristallinsel', lm: 'kristall', icon: '💎', deg: 332, ter: 'kristall',
    text: 'Leuchtende Kristalle im Fels – Kristall 💎 für Glas und Kristall-Deko. Nur wer viel weiß, findet den Weg.', need: { lanterns: 14, pop: 160, money: 20000, science: 600 } },
];
const ISLE_BY_ID = Object.fromEntries(ISLES.map(i => [i.id, i]));
const ISLE_OF_LM = Object.fromEntries(ISLES.map(i => [i.lm, i]));
for (const i of ISLES) {
  i.cx = ISLAND.cx + Math.cos(i.deg * Math.PI / 180) * ISLE_DIST;
  i.cy = ISLAND.cy + Math.sin(i.deg * Math.PI / 180) * ISLE_DIST;
}
// Ganze Welt (für Kamera und Zeichnen): Heimatinsel und alle Themen-Inseln
const WORLD = { cMin: Math.floor((ISLAND.cx - ISLE_DIST - ISLE_R - 4) / CHUNK), cMax: Math.ceil((ISLAND.cx + ISLE_DIST + ISLE_R + 4) / CHUNK) };
const DIARY_START = 'Liebe Nachfolgerin, lieber Nachfolger: Die Insel schläft nur. Weck sie auf – Laterne für Laterne. Fang am besten beim alten Baum an.';
const DIARY_FINALE = 'Der Leuchtturm brennt wieder. Heute Nacht feiern wir das Laternenfest – so wie früher. Danke. Die Insel gehört jetzt dir.';


// Forschung (Seite „Wissen“, bezahlt mit Ideen 💡) in drei Stufen: 1 braucht eine Schule, 2 eine Bibliothek,
// 3 eine Universität. Das Aussehen (Farben, Wege-Stile, Deko) gibt es auf der Seite „Kunstakademie“ (DESIGN).
const TECH_TIERS = [null, { b: 'schule', name: 'Schule' }, { b: 'bibliothek', name: 'Bibliothek' }, { b: 'uni', name: 'Universität' }];
const TECHS = [
  { id: 'duenger', tier: 1, name: 'Dünger', cost: 20, desc: 'Felder bringen 50 % mehr.' },
  { id: 'axt', tier: 1, name: 'Scharfe Äxte', cost: 30, desc: 'Holzfäller liefern 30 % mehr Holz.' },
  { id: 'netze', tier: 1, name: 'Fischernetze', cost: 30, desc: 'Fischerhütten bringen 30 % mehr.' },
  { id: 'handel', tier: 1, name: 'Handel', cost: 50, desc: 'Schaltet den Markt frei.' },
  { id: 'bibliothek', tier: 1, name: 'Bibliotheken', cost: 40, desc: 'Bibliotheken bringen doppelt so viele Ideen.' },
  { id: 'forst', tier: 1, name: 'Forstwirtschaft', cost: 50, desc: 'Holzfäller pflanzen ihren Wald selbst – auch auf Wiesen.' },
  { id: 'agrar', tier: 1, name: 'Höhere Agrartechnik', cost: 60, desc: 'Obstplantagen auf jeder Wiese, nicht nur im Obsthain.' },
  { id: 'muehlrad', tier: 2, name: 'Mühlräder', cost: 90, desc: 'Mühlen bringen 30 % mehr.' },
  { id: 'ofen', tier: 2, name: 'Steinofen', cost: 110, desc: 'Bäckereien bringen 30 % mehr.' },
  { id: 'industrie', tier: 2, name: 'Industrie', cost: 120, req: ['handel'], desc: 'Schaltet die Werkstatt frei.' },
  { id: 'seehandel', tier: 2, name: 'Seehandel', cost: 180, req: ['handel'], desc: 'Schaltet den Hafen frei.' },
  { id: 'tiefbau', tier: 2, name: 'Tiefbau', cost: 150, desc: 'Steinbrüche auch auf Wiesen – sie graben nach Stein.' },
  { id: 'kunst', tier: 2, name: 'Kunstschule', cost: 80, desc: 'Kunstakademien machen die Umgebung 50 % schöner.' },
  { id: 'uni', tier: 2, name: 'Universität', cost: 200, req: ['bibliothek'], desc: 'Schaltet die Universität frei.' },
  { id: 'bahn', tier: 2, name: 'Eisenbahn', cost: 250, lm: 'erzberg:1', desc: 'Schienen, Brücken und Bahnhöfe: elektrische Züge zwischen deinen Inseln. Strom kommt von Windrädern.' },
  { id: 'dampf', tier: 3, name: 'Dampfkraft', cost: 350, req: ['industrie'], desc: 'Werkstätten bringen 50 % mehr.' },
  { id: 'schiffbau', tier: 3, name: 'Schiffbau', cost: 300, req: ['seehandel'], desc: 'Jeder Hafen bringt 12 % statt 8 % auf alle Einnahmen.' },
  { id: 'bohrung', tier: 3, name: 'Tiefbohrung', cost: 300, req: ['tiefbau'], desc: 'Bergwerke überall, nicht nur auf Erzadern.' },
  { id: 'sterne', tier: 3, name: 'Sternkunde', cost: 400, desc: 'Alle Ideen 20 % mehr.' },
];
const TECH_BY_ID = Object.fromEntries(TECHS.map(t => [t.id, t]));

// Stile für Wege: Sandweg von Anfang an, die anderen einzeln in der Kunstakademie (design = Preis in Talern)
// oder als Geschenk einer Sehenswürdigkeit (lm)
// shape: 'band' = Weg, der sich mit Nachbar-Wegen verbindet; 'fill' = ganze Fläche (Platz)
const STYLES = {
  weg: [
    { id: 'sand', name: 'Sandweg', col: '#d8c197', shape: 'band' },
    { id: 'kies', name: 'Kies', col: '#eadbb2', shape: 'band', design: 40 },
    { id: 'mulch', name: 'Rindenmulch', col: '#8b5e3c', shape: 'band', design: 40 },
    { id: 'platten', name: 'Platten', col: '#e6dfd0', shape: 'fill', lm: 'baum:2' },
    { id: 'asphalt', name: 'Asphalt', col: '#9e988e', shape: 'band', design: 200 },
    { id: 'tritt', name: 'Trittsteine', col: '#cfcac0', shape: 'band', design: 120 },
    { id: 'holz', name: 'Holzbohlen', col: '#c89a6a', shape: 'band', design: 120 },
    { id: 'kopf', name: 'Kopfstein', col: '#cfc8bb', shape: 'fill', lm: 'quelle:2' },
    { id: 'klinker', name: 'Klinker', col: '#c97a5e', shape: 'fill', design: 180 },
    { id: 'terrakotta', name: 'Terrakotta', col: '#d99a73', shape: 'fill', design: 180 },
    { id: 'schach', name: 'Schachbrett', col: '#f5dce6', shape: 'fill', design: 250 },
    { id: 'konfetti', name: 'Konfetti', col: '#f6dce6', shape: 'band', design: 300 },
    { id: 'fisch', name: 'Fischgrät rosé', col: '#ecccc2', shape: 'fill', design: 350, master: true },
    { id: 'blueten', name: 'Blütenpfad', col: '#f7dbe4', shape: 'band', lm: 'obsthain:3' },
    { id: 'kristall', name: 'Kristallweg', col: '#bfe6f7', shape: 'band', lm: 'kristall:3' },
  ],
};
const styleDef = (kind, id) => STYLES[kind].find(st => st.id === id) || STYLES[kind][0];
const chosenStyle = { weg: 'sand' };


const WALLS = ['#fff4dc', '#ffe3e0', '#e4f1ff', '#f0ffe0', '#fdeaff', '#fff0b8', '#e6e0ff',
               '#ffd1b3', '#c9f0e4', '#ffe066', '#d8c3a5', '#b8d8ff', '#ffc2d9', '#f5f5f5'];
const ROOFS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1', '#6b7a8f',
               '#2f9e9e', '#8b5a3c', '#3c4a6b', '#d94f8a', '#7cb342', '#ff8a3d', '#4a4a58'];
// Kunstakademie: alles zum Aussehen einzeln freischalten (Preis in Talern). Die ersten drei Wand- und Dachfarben
// und der Sandweg sind von Anfang an da; master = braucht eine gebaute Kunstakademie.
const FREE_COLORS = 3;
const DESIGN = [
  ...WALLS.map((col, i) => ({ id: 'wall:' + i, group: 'Wandfarben', col, name: 'Wandfarbe ' + (i + 1), price: i < FREE_COLORS ? 0 : 50 + i * 20, master: i >= 11 })),
  ...ROOFS.map((col, i) => ({ id: 'roof:' + i, group: 'Dachfarben', col, name: 'Dachfarbe ' + (i + 1), price: i < FREE_COLORS ? 0 : 50 + i * 20, master: i >= 11 })),
  ...STYLES.weg.filter(st => st.design).map(st => ({ id: 'weg:' + st.id, group: 'Wege', col: st.col, name: st.name, price: st.design, master: !!st.master })),
  ...['laterne', 'pavillon', 'statue'].map(b => ({ id: b, group: 'Deko', name: ITEMS[b].name, item: b, price: ITEMS[b].design, master: !!ITEMS[b].master })),
];
const DESIGN_BY_ID = Object.fromEntries(DESIGN.map(d => [d.id, d]));
const FLAG_COLORS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'];
const FLAG_SYMBOLS = ['🐟', '🌻', '🍎', '⭐', '🐚', '🌙', '🍄', '🐝', '🦊', '⚓'];
const TERRAIN_NAMES = { grass: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', erz: 'Erzader', obst: 'Wilder Obsthain', kristall: 'Kristallfels' };
