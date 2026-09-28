'use strict';
/* Kachelhausen – eine kleine Inselwelt zum Verwalten und Gestalten.
   Wege verbinden Viertel, Betriebe liefern Rohstoffe,
   Schulen erzeugen Ideen (💡) für die Forschung, Sehenswürdigkeiten locken zum Ausbau. */
// ---------------------------------------------------------------------------
// Grundwerte
// ---------------------------------------------------------------------------
const TW = 64, TH = 32, DEPTH = 9, CHUNK = 6;
const SAVE_KEY = 'kachelhausen_v3';
const MAX_LVL = 5;
const OFFLINE_MAX_S = 8 * 3600;
const ZOOM_MIN = 0.45, ZOOM_MAX = 2.6;
const ISLAND = { cMin: -4, cMax: 4, cx: 2.5, cy: 2.5, r: 26 };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// ?probe: Beispieldorf zum Anschauen, wird nie gespeichert
const PROBE = new URLSearchParams(location.search).has('probe');

// cat: bau | netz | bildung | deko | land;  needs: Untergrund;  workers/science: Netzwerte
const ITEMS = {
  // --- Wohnen & Arbeit ---
  haus:    { cat: 'bau', name: 'Haus', cost: 40, needs: 'grass', pop: 4, up: true,
             desc: '4 Einwohner pro Stufe. Antippen = Farben ändern.' },
  feld:    { cat: 'bau', name: 'Feld', cost: 20, needs: 'grass', workers: 1, up: true, desc: '1 Taler/s.' },
  muehle:  { cat: 'bau', name: 'Mühle', cost: 150, needs: 'grass', workers: 1, up: true,
             desc: '+2 Taler/s für jedes Feld direkt daneben.' },
  holz:    { cat: 'bau', name: 'Holzfäller', cost: 60, needs: 'forest', workers: 1, ugly: 4, up: true, prod: { holz: 0.3 },
             desc: 'Nur im Wald. Liefert Holz 🪵. Laut für Nachbarn.' },
  fischer: { cat: 'bau', name: 'Fischerhütte', cost: 80, needs: 'shore', workers: 1, up: true,
             desc: 'Am Wasser. +1,5 Taler/s pro Wasserfeld daneben.' },
  obst:    { cat: 'bau', name: 'Obstplantage', cost: 120, needs: 'obst', workers: 1, up: true, prod: { obst: 0.3 },
             desc: 'Nur im Wilden Obsthain. Liefert Obst 🍎.' },
  stein:   { cat: 'bau', name: 'Steinbruch', cost: 150, needs: 'rock', workers: 2, ugly: 10, up: true, prod: { stein: 0.25 },
             desc: 'Nur auf Fels. Liefert Stein 🪨, staubig.' },
  mine:    { cat: 'bau', name: 'Bergwerk', cost: 300, needs: 'erz', workers: 3, ugly: 8, up: true, prod: { erz: 0.2 },
             desc: 'Nur am Erzberg. Liefert Erz ⛏️.' },
  saege:   { cat: 'bau', name: 'Sägewerk', size: [2, 1], cost: 200, needs: 'grass', workers: 2, ugly: 3, up: true, rot: true,
             conv: { from: 'holz', to: 'bretter', rate: 0.15 }, desc: 'Macht aus 2 Holz 🪵 ein Brett 🪚.' },
  steinmetz: { cat: 'bau', name: 'Steinmetz', cost: 250, needs: 'grass', workers: 2, ugly: 4, up: true, rot: true,
             conv: { from: 'stein', to: 'quader', rate: 0.12 }, desc: 'Macht aus 2 Stein 🪨 einen Pflasterstein 🧱.' },
  schmiede: { cat: 'bau', name: 'Schmiede', cost: 350, needs: 'grass', workers: 2, ugly: 6, up: true, rot: true,
             conv: { from: 'erz', to: 'metall', rate: 0.1 }, desc: 'Macht aus 2 Erz ⛏️ ein Stück Metall 🔩.' },
  baecker: { cat: 'bau', name: 'Bäckerei', size: [2, 1], cost: 400, needs: 'grass', workers: 2, star: 2, up: true,
             desc: '+6 Taler/s für jede Mühle direkt daneben.' },
  markt:   { cat: 'bau', name: 'Markt', size: [2, 2], cost: 800, needs: 'grass', workers: 2, tech: 'handel', up: true,
             desc: '+1,5 Taler/s für jedes Gebäude im Umkreis von 2.' },
  fabrik:  { cat: 'bau', name: 'Werkstatt', size: [2, 1], cost: 1200, needs: 'grass', workers: 4, tech: 'industrie', ugly: 12, up: true,
             desc: '25 Taler/s, +5 für jedes Bergwerk im Umkreis von 3.' },
  hafen:   { cat: 'bau', name: 'Hafen', size: [2, 2], cost: 1500, needs: 'shore', workers: 3, tech: 'seehandel',
             desc: 'Handel mit der Welt: +8 % auf alle Einnahmen.' },
  leuchtturm: { cat: 'bau', name: 'Leuchtturm', cost: 3000, mat: { quader: 20, metall: 10, bretter: 10 }, needs: 'shore', workers: 1, star: 3, beauty: 40,
             desc: 'Das Wahrzeichen deiner Insel. Nötig für den 5. Stern.' },
  // --- Wege ---
  weg:     { cat: 'netz', name: 'Weg', cost: 5, needs: 'grass', beauty: 1, paint: true,
             desc: 'Belegt ein ganzes Feld. Viele Stile – vom Sandweg bis zum Mosaikplatz. Verbindet Viertel. Ziehen = mehrere legen.' },
  // --- Bildung ---
  schule:  { cat: 'bildung', name: 'Schule', size: [2, 2], cost: 300, needs: 'grass', workers: 2, science: 0.6, star: 1, up: true,
             desc: 'Erzeugt Ideen 💡 für die Forschung (je mehr Einwohner, desto mehr).' },
  bibliothek: { cat: 'bildung', name: 'Bibliothek', size: [2, 1], cost: 500, needs: 'grass', workers: 1, science: 1, beauty: 5, tech: 'bibliothek', up: true,
             desc: '+1 💡/s.' },
  uni:     { cat: 'bildung', name: 'Universität', size: [2, 2], cost: 2000, needs: 'grass', workers: 4, science: 3, beauty: 10, tech: 'uni', up: true,
             desc: '+3 💡/s.' },
  kunst:   { cat: 'bildung', name: 'Kunstakademie', size: [2, 1], cost: 700, needs: 'grass', workers: 2, science: 0.4, beauty: 25, tech: 'kunst', up: true,
             desc: 'Schönheit +25 und ein paar kreative Ideen 💡.' },
  // --- Deko ---
  blumen:  { cat: 'deko', name: 'Blumenbeet', cost: 30, needs: 'grass', beauty: 4, desc: '+15 % für Gebäude direkt daneben.' },
  baum:    { cat: 'deko', name: 'Baum', cost: 15, needs: 'grass', beauty: 2, desc: 'Ein Obstbaum.' },
  blumentopf: { cat: 'deko', name: 'Blumentopf', cost: 10, beauty: 2, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  busch:   { cat: 'deko', name: 'Kleiner Busch', cost: 10, beauty: 2, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  hecke:   { cat: 'deko', name: 'Hecke', cost: 10, beauty: 1, small: true, desc: 'Klein – bis zu 4 pro Feld. In die gewünschte Ecke tippen.' },
  bank:    { cat: 'deko', name: 'Bank', cost: 35, mat: { bretter: 2 }, beauty: 3, small: true, desc: 'Klein – bis zu 4 pro Feld, auch vor dem Haus. In die gewünschte Ecke tippen.' },
  laterne: { cat: 'deko', name: 'Laterne', cost: 40, mat: { metall: 1 }, beauty: 4, small: true, tech: 'garten', desc: 'Leuchtet nachts. Klein – bis zu 4 pro Feld.' },
  brunnen: { cat: 'deko', name: 'Brunnen', cost: 250, mat: { quader: 8 }, needs: 'grass', beauty: 15, tech: 'garten', desc: 'Plätschert.' },
  park:    { cat: 'deko', name: 'Park', size: [2, 2], cost: 300, needs: 'grass', beauty: 25, mat: { bretter: 2 },
             desc: 'Eine kleine grüne Oase mit Teich, Bäumen und Bank. Belegt 2×2 Felder.' },
  windrad: { cat: 'deko', name: 'Windrad', cost: 200, needs: 'grass', beauty: 6, desc: 'Dreht sich gemütlich im Wind.' },
  pavillon:{ cat: 'deko', name: 'Pavillon', cost: 400, mat: { bretter: 8 }, needs: 'grass', beauty: 20, tech: 'skulptur', desc: 'Für Konzerte im Park.' },
  statue:  { cat: 'deko', name: 'Sternstatue', cost: 700, mat: { quader: 6, metall: 2 }, needs: 'grass', beauty: 30, tech: 'skulptur', desc: 'Glänzt golden.' },
  // --- Gelände ---
  graben:  { cat: 'land', name: 'Teich graben', cost: 30, desc: 'Macht aus Wiese Wasser (gut für Fischer).' },
  schuett: { cat: 'land', name: 'Aufschütten', cost: 60, desc: 'Macht aus Wasser neues Land.' },
  verschieben: { cat: 'land', name: 'Verschieben', cost: 0, desc: 'Gebäude oder Deko antippen, dann das Ziel antippen. Kostenlos. Drehen mit ⟳ oder R.' },
  abriss:  { cat: 'land', name: 'Abreißen', cost: 0, desc: 'Gebäude (halber Preis zurück), Wald roden, Fels sprengen.' },
  // --- fest ---
  rathaus: { cat: null, name: 'Rathaus', size: [2, 2], beauty: 5, fixed: true, desc: 'Das Herz deiner Insel. Alle Wege führen hierher.' },
  lm:      { cat: null, name: 'Sehenswürdigkeit', fixed: true, desc: '' },
};
// Rohstoffe und Waren im gemeinsamen Lager
const RES = {
  holz: { name: 'Holz', icon: '🪵' }, stein: { name: 'Stein', icon: '🪨' }, erz: { name: 'Erz', icon: '⛏️' },
  obst: { name: 'Obst', icon: '🍎' }, bretter: { name: 'Bretter', icon: '🪚' }, quader: { name: 'Pflastersteine', icon: '🧱' },
  metall: { name: 'Metall', icon: '🔩' },
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

const CATS = [
  { id: 'bau', label: '🏠 Bauen' },
  { id: 'netz', label: '🛤️ Wege' },
  { id: 'bildung', label: '🎓 Bildung' },
  { id: 'deko', label: '🌸 Deko' },
  { id: 'land', label: '⛰️ Gelände' },
];

const LANDMARKS = {
  quelle:   { name: 'Heiße Quelle', icon: '♨️', effect: '+40 🌸 und Touristen: +12 Taler/s' },
  ruine:    { name: 'Alte Ruine', icon: '🏛️', effect: 'Ausgrabungen: +1,5 💡/s' },
  erzberg:  { name: 'Erzberg', icon: '⛏️', effect: 'Erzadern für Bergwerke, angeschlossen +25 % Bergwerk-Ertrag' },
  obsthain: { name: 'Wilder Obsthain', icon: '🍎', effect: 'Obstbäume für Plantagen, +15 🌸' },
  klippe:   { name: 'Windige Klippe', icon: '🌬️', effect: 'Rückenwind: Mühlen im Umkreis von 10 Feldern produzieren doppelt' },
  baum:     { name: 'Uralter Baum', icon: '🌳', effect: '+80 🌸' },
  kristall: { name: 'Kristallhöhle', icon: '💎', effect: 'Forschung: +3 💡/s' },
};

const TECHS = [
  { id: 'duenger', cat: '🌾 Wirtschaft', name: 'Dünger', cost: 15, desc: 'Felder bringen 50 % mehr.' },
  { id: 'handel', cat: '🌾 Wirtschaft', name: 'Handel', cost: 40, desc: 'Schaltet den Markt frei.' },
  { id: 'industrie', cat: '🌾 Wirtschaft', name: 'Industrie', cost: 100, req: ['handel'], desc: 'Schaltet die Werkstatt frei.' },
  { id: 'seehandel', cat: '🌾 Wirtschaft', name: 'Seehandel', cost: 150, req: ['handel'], desc: 'Schaltet den Hafen frei.' },
  { id: 'bibliothek', cat: '🎓 Bildung', name: 'Bibliotheken', cost: 30, desc: 'Schaltet die Bibliothek frei.' },
  { id: 'uni', cat: '🎓 Bildung', name: 'Universität', cost: 150, req: ['bibliothek'], desc: 'Schaltet die Universität frei.' },
  { id: 'farben', cat: '🎨 Kunst', name: 'Farbenlehre', cost: 10, desc: 'Sieben neue Wand- und Dachfarben.' },
  { id: 'garten', cat: '🎨 Kunst', name: 'Gartenkunst', cost: 25, desc: 'Laternen, Brunnen, Holzbohlen- und Trittstein-Wege.' },
  { id: 'pflasterkunst', cat: '🎨 Kunst', name: 'Pflasterkunst', cost: 20, desc: 'Kopfstein, Klinker und Terrakotta für deine Wege.' },
  { id: 'kunst', cat: '🎨 Kunst', name: 'Kunstakademie', cost: 60, req: ['garten'], desc: 'Schaltet die Kunstakademie frei.' },
  { id: 'skulptur', cat: '🎨 Kunst', name: 'Bildhauerei', cost: 120, req: ['kunst'], desc: 'Pavillon und Sternstatue.' },
];
const TECH_BY_ID = Object.fromEntries(TECHS.map(t => [t.id, t]));

// Stile für Wege: erst schlicht, schönere per Stern oder Forschung
// shape: 'band' = Weg, der sich mit Nachbar-Wegen verbindet; 'fill' = ganze Fläche (Platz)
const STYLES = {
  weg: [
    { id: 'sand', name: 'Sandweg', col: '#d8c197', shape: 'band' },
    { id: 'kies', name: 'Kies', col: '#eadbb2', shape: 'band' },
    { id: 'mulch', name: 'Rindenmulch', col: '#8b5e3c', shape: 'band' },
    { id: 'platten', name: 'Platten', col: '#e6dfd0', shape: 'fill', star: 1 },
    { id: 'asphalt', name: 'Asphalt', col: '#9e988e', shape: 'band', star: 1 },
    { id: 'tritt', name: 'Trittsteine', col: '#cfcac0', shape: 'band', tech: 'garten' },
    { id: 'holz', name: 'Holzbohlen', col: '#c89a6a', shape: 'band', tech: 'garten' },
    { id: 'kopf', name: 'Kopfstein', col: '#cfc8bb', shape: 'fill', tech: 'pflasterkunst' },
    { id: 'klinker', name: 'Klinker', col: '#c97a5e', shape: 'fill', tech: 'pflasterkunst' },
    { id: 'terrakotta', name: 'Terrakotta', col: '#d99a73', shape: 'fill', tech: 'pflasterkunst' },
    { id: 'schach', name: 'Schachbrett', col: '#f5dce6', shape: 'fill', tech: 'farben' },
    { id: 'pastell', name: 'Pastell-Mosaik', col: '#f3dfe6', shape: 'band', tech: 'farben' },
    { id: 'fisch', name: 'Fischgrät rosé', col: '#ecccc2', shape: 'fill', tech: 'kunst' },
    { id: 'blueten', name: 'Blütenpfad', col: '#f7dbe4', shape: 'band', tech: 'kunst' },
    { id: 'mosaik', name: 'Mosaik', col: '#efe6d8', shape: 'fill', tech: 'skulptur' },
  ],
};
const styleDef = (kind, id) => STYLES[kind].find(st => st.id === id) || STYLES[kind][0];
const chosenStyle = { weg: 'sand' };

const STARS = [
  { name: 'Kleines Dorf', pop: 12, inc: 8, beauty: 15, reward: { money: 200, sci: 10 } },
  { name: 'Dorf', pop: 30, inc: 40, beauty: 60, techs: 2, reward: { money: 600, sci: 25 } },
  { name: 'Städtchen', pop: 70, inc: 150, beauty: 180, lm: 1, techs: 4, reward: { money: 2000, sci: 60 } },
  { name: 'Kleinstadt', pop: 150, inc: 400, beauty: 400, lm: 3, techs: 7, reward: { money: 6000, sci: 120 } },
  { name: 'Inselperle', pop: 300, inc: 1000, beauty: 900, lm: 5, techs: 9, landmark: 'leuchtturm', reward: { money: 20000, sci: 300 } },
];

const WALLS = ['#fff4dc', '#ffe3e0', '#e4f1ff', '#f0ffe0', '#fdeaff', '#fff0b8', '#e6e0ff',
               '#ffd1b3', '#c9f0e4', '#ffe066', '#d8c3a5', '#b8d8ff', '#ffc2d9', '#f5f5f5'];
const ROOFS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1', '#6b7a8f',
               '#2f9e9e', '#8b5a3c', '#3c4a6b', '#d94f8a', '#7cb342', '#ff8a3d', '#4a4a58'];
const FLAG_COLORS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'];
const FLAG_SYMBOLS = ['🐟', '🌻', '🍎', '⭐', '🐚', '🌙', '🍄', '🐝', '🦊', '⚓'];
const TERRAIN_NAMES = { grass: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', erz: 'Erzader', obst: 'Wilder Obsthain' };
