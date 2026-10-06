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
const ZOOM_MIN = 0.45, ZOOM_MAX = 5;   // nah ran (Block 47): vorher 2,6
const ISLAND = { cMin: -4, cMax: 4, cx: 2.5, cy: 2.5, r: 26 };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Drehung rot 0–3: in diese Richtung zeigt die Tür (0 = +x rechts vorn, 1 = +y links vorn, 2 = −x, 3 = −y hinten).
// size = [Tiefe, Breite] bei rot 0; bei ungerader Drehung liegt das Gebäude quer.
const FRONT_DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];
// ?probe: Beispieldorf zum Anschauen, wird nie gespeichert
const PROBE = new URLSearchParams(location.search).has('probe');
// ?welt=zaeune: lädt testsave-zaeune.json zum Anschauen und Ausprobieren – wird nie gespeichert (eigener Stand bleibt)
const TESTWELT = (new URLSearchParams(location.search).get('welt') || '').replace(/[^a-z0-9-]/g, '') || null;
// Zu Besuch (Block 95): ?besuch=<Spiegel-Kennung> – fremde Insel live ansehen, nichts speichern, nichts bauen
const VISIT = (new URLSearchParams(location.search).get('besuch') || '').replace(/[^a-z0-9]/g, '') || null;

// cat: bau | netz | bildung | deko | land;  needs: Untergrund;  workers/science: Netzwerte
const ITEMS = {
  // --- Wohnen & Arbeit ---
  haus:    { cat: 'bau', name: 'Haus', cost: 40, needs: 'grass', pop: 4,
             desc: 'Hier wohnt jemand. Wünsche erfüllen, dann ausbauen.' },
  // weitere Wohnformen: feste Einwohner je Stufe (pop × Stufe), keine Wünsche – dafür besondere Orte
  reihenhaus: { cat: 'bau', name: 'Reihenhäuser', lm: 'obsthain:1', size: [1, 2], cost: 1500, mat: { quader: 8 }, needs: 'grass', pop: 10,
               desc: 'Drei schmale bunte Häuser nebeneinander – viele Einwohner auf wenig Platz.' },
  baumhaus: { cat: 'bau', name: 'Baumhaus', lm: 'baum:2', cost: 300, mat: { bretter: 8 }, needs: 'forest', pop: 5, beauty: 4,
               desc: 'Ein Häuschen hoch im Baum – mitten im Wald, der Wald bleibt stehen.' },
  hausboot: { cat: 'bau', name: 'Hausboot', lm: 'klippe:1', cost: 600, mat: { bretter: 12 }, needs: 'boot', pop: 4, beauty: 3,
               desc: 'Wohnen auf dem Wasser – auf Teich, See oder Meer, direkt am Ufer.' },
  ferienhaus: { cat: 'bau', name: 'Ferienhäuschen', lm: 'quelle:1', cost: 900, mat: { bretter: 10 }, needs: 'strand', pop: 2, beauty: 5,
               desc: 'Strandhütte für Feriengäste: bringt Taler und ein paar Einwohner. Nur auf Sand am Wasser.' },
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
  fabrik:  { cat: 'bau', name: 'Werkstatt', size: [1, 2], cost: 1200, needs: 'grass', workers: 4, tech: 'industrie', ugly: 12,
             desc: '25 Taler/s, +5 für jedes Bergwerk im Umkreis von 3. Braucht 2 ⚡ Strom, sobald es Windräder gibt.' },
  hafen:   { cat: 'bau', name: 'Hafen', size: [3, 4], cost: 1500, needs: 'shore', workers: 3, tech: 'seehandel',
             desc: 'Handel mit der Welt: +8 % auf die Einnahmen der Betriebe (zählt für bis zu 3 Häfen). Je Stufe fährt ein Fischkutter hinaus (🪙 +5/s). Liegeplätze für 2/4/6 Schiffe, die zu Stegen und Häfen auf anderen Inseln fahren. Ab Stufe 2 legen Frachter mit Aufträgen an und kaufen dir ab, was sich stapelt (Stufe 3: mehr und Großaufträge).' },
  leuchtturm: { cat: 'bau', name: 'Leuchtturm', cost: 15000000, mat: { quader: 40, metall: 25, bretter: 30 }, needs: 'shore', workers: 1, lanterns: 21, beauty: 40, size: [3, 3],   // Block 83: Leuchtturm-Kap
             desc: 'Das große Finale: Wenn alle 21 Laternen brennen, bringt der Leuchtturm das Laternenfest zurück.' },
  // --- Wege ---
  weg:     { cat: 'netz', name: 'Weg', cost: 5, needs: 'grass', beauty: 1, paint: true,
             desc: 'Verbindet Viertel. Weitere Stile gibt es in der Kunstakademie; als Block gelegt wird daraus ein Platz.' },
  schiene: { cat: 'netz', name: 'Schiene', cost: 15, mat: { holz: 1, metall: 1 }, needs: 'grass', tech: 'bahn', paint: true,
             desc: 'Für den elektrischen Zug. Über Wasser wird sie zur Brücke (🪙 40 🪵2 🔩2).' },
  // intern „station“: „bahnhof“ war ein früheres, entferntes Gebäude (alte Stände bekommen dafür Geld zurück)
  station: { cat: 'netz', name: 'Bahnhof', size: [1, 2], cost: 800, mat: { bretter: 10, quader: 6, metall: 4 }, needs: 'grass', tech: 'bahn',
             desc: 'Braucht Schienen direkt am Bahnsteig. Zwei verbundene Bahnhöfe auf verschiedenen Inseln: Der Zug bringt Pendler und Besucher (Fahrkarten + Ausgaben am Ziel) und bindet alles in der Nähe ans Dorf an.' },
  hbf:     { cat: 'netz', name: 'Hauptbahnhof', size: [4, 4], cost: 6000, mat: { quader: 30, metall: 12, bretter: 20 }, needs: 'grass', tech: 'bahn',
             desc: 'Kopfbahnhof: Jedes Gleis ist eine eigene Linie mit eigenem Zug. Inseln, deren Linien hier enden, sind verbunden (Umsteigen). Im Infofenster: + Gleis.' },
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
  // Linien auf den Kanten zwischen Feldern (Block 41): Anfang und Ende antippen, Stil aus der Stil-Leiste; state.edges
  hecke:   { cat: 'deko', name: 'Hecke', cost: 8, beauty: 1.5, edge: true, desc: 'Eine grüne Linie zwischen den Feldern – Anfang und Ende antippen. Wo ein Weg durchgeht, bleibt eine Lücke.' },
  zaun:    { cat: 'deko', name: 'Zaun', cost: 12, beauty: 1, edge: true, desc: 'Ein Zaun zwischen den Feldern – Anfang und Ende antippen. Wo ein Weg durchgeht, gibt es ein Tor.' },
  mauer:   { cat: 'deko', name: 'Mauer', cost: 20, mat: { quader: 1 }, beauty: 1.2, edge: true, desc: 'Eine Gartenmauer zwischen den Feldern – Anfang und Ende antippen. Wo ein Weg durchgeht, bleibt ein Durchgang.' },
  // exotisch – aus dem Botanischen Garten (garden)
  palme:   { cat: 'deko', name: 'Palme', cost: 300, beauty: 10, small: true, garden: 'botgarten', desc: 'Aus dem Botanischen Garten. Klein – bis zu 4 pro Feld.' },
  riesenblume: { cat: 'deko', name: 'Riesenblume', cost: 300, beauty: 10, small: true, garden: 'botgarten', desc: 'Aus dem Botanischen Garten: so groß wie ein Mensch. Bis zu 4 pro Feld.' },
  bank:    { cat: 'deko', name: 'Bank', cost: 35, mat: { bretter: 2 }, beauty: 3, small: true, desc: 'Klein – bis zu 4 pro Feld, auch vor dem Haus. In die gewünschte Ecke tippen.' },
  laterne: { cat: 'deko', name: 'Laterne', cost: 40, mat: { metall: 1 }, beauty: 4, small: true, design: 150, desc: 'Leuchtet nachts. Klein – bis zu 4 pro Feld. Nah an eine Feldecke getippt, steht sie genau zwischen den Feldern.' },
  brunnen: { cat: 'deko', name: 'Brunnen', lm: 'quelle:2', cost: 250, mat: { quader: 8 }, needs: 'grass', beauty: 15, desc: 'Plätschert.' },
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
  // --- Wunderwerke: erst eine Baustelle, dann Abschnitt für Abschnitt (WONDERS in story.js); Wirkung erst fertig ---
  riesenrad:  { cat: 'wunder', name: 'Riesenrad', size: [5, 5], cost: 2000, needs: 'grass', lanterns: 10, beauty: 200, wonder: true,
                desc: '+25 % Einnahmen und alle 15 Minuten Jahrmarkt (3 Minuten dreifache Einnahmen). Dreht sich, nachts bunt. Fertig braucht es 100 ⚡ Strom.' },
  sternwarte: { cat: 'wunder', name: 'Sternwarte', size: [3, 3], cost: 2000, needs: 'grass', tech: 'uni', beauty: 90, wonder: true,
                desc: '+50 % Ideen, nachts Sternschnuppen zum Antippen, das Boot findet Inseln doppelt so schnell. Fertig braucht sie 100 ⚡ Strom.' },
  seebruecke: { cat: 'wunder', name: 'Seebrücke', size: [4, 1], cost: 1500, needs: 'pier', lm: 'quelle:1', beauty: 80, wonder: true,
                desc: 'Vom Ufer ins Meer, mit Pavillon: +20 % Einwohner; Aufträge zahlen +50 %, ein Auftragsplatz mehr, Schiffe schneller. Fertig braucht sie 100 ⚡ Strom.' },
  botgarten:  { cat: 'wunder', name: 'Botanischer Garten', size: [5, 5], cost: 3000, needs: 'grass', lm: 'kristall:1', beauty: 320, wonder: true,
                desc: 'Palmenhaus aus Glas: +50 % Schönheit, „Park“ und „schöne Umgebung“ überall erfüllt, Obst und Felder doppelt, Palmen und Riesenblumen. Fertig braucht er 100 ⚡ Strom (Heizung).' },
  schloss:    { cat: 'wunder', name: 'Schloss', size: [7, 7], cost: 10000, needs: 'grass', festival: true, beauty: 500, wonder: true,
                desc: 'Das Finale nach dem Laternenfest: +50 % auf alles, „Königliche Inselperle“, alle 10 Minuten ein Erlass nach Wahl. Fertig braucht es 300 ⚡ Strom.' },
  // Belohnungen fürs Sammelalbum (album = Seite, die voll sein muss)
  denkmal:    { cat: 'deko', name: 'Baumeister-Denkmal', cost: 0, needs: 'grass', beauty: 40, album: 'gebaeude', desc: 'Für die volle Album-Seite „Gebäude“.' },
  rosenbogen: { cat: 'deko', name: 'Rosenbogen', cost: 0, beauty: 8, small: true, album: 'deko', desc: 'Für die volle Album-Seite „Deko“.' },
  freundesbank: { cat: 'deko', name: 'Freundesbank', cost: 0, beauty: 6, small: true, bond: 4, desc: 'Für eine Freundschaft mit 4 Herzen. Eine Bank mit Herzlehne – für zwei.' },   // Block 105
  freundschaftsbaum: { cat: 'deko', name: 'Freundschaftsbaum', cost: 0, needs: 'grass', beauty: 30, bond: 5, desc: 'Für eine Freundschaft mit 5 Herzen. Statt Äpfeln wachsen Herzen.' },
  uhrturm:    { cat: 'deko', name: 'Uhrturm', cost: 0, needs: 'grass', beauty: 35, album: 'haeuser', desc: 'Für die volle Album-Seite „Hausformen“.' },
  karussell:  { cat: 'deko', name: 'Karussell', cost: 0, needs: 'grass', beauty: 45, album: 'bewohner', desc: 'Für die volle Album-Seite „Bewohner“. Dreht sich.' },
  zauberbrunnen: { cat: 'deko', name: 'Zauberbrunnen', cost: 0, needs: 'grass', beauty: 70, album: 'fzpark', desc: 'Für die volle Album-Seite „Freizeitpark“: ein Brunnen mit Regenbogen und Funkeln.' },
  // Naturbeobachtungen (Block 56): drei Stufen der Album-Seite (albumN = so viele Tiere entdeckt)
  schmetterlingsgarten: { cat: 'deko', name: 'Schmetterlingsgarten', cost: 0, needs: 'grass', beauty: 20, album: 'natur', albumN: 4, desc: 'Ein Blumenhügel, über dem immer bunte Falter tanzen.' },
  vogelbaum:  { cat: 'deko', name: 'Vogelhäuschen-Baum', cost: 0, needs: 'grass', beauty: 25, album: 'natur', albumN: 8, desc: 'Ein alter Baum mit Vogelhäuschen – Vögel fliegen ein und aus.' },
  seerosenteich: { cat: 'deko', name: 'Seerosenteich', size: [2, 2], cost: 0, needs: 'grass', beauty: 45, album: 'natur', albumN: 12, desc: 'Ein kleiner Teich mit Seerosen, Fröschen und Libellen.' },
  // Steg: von Anfang an; hier startet das Boot, das neue Inseln entdeckt (Expedition, story.js)
  bootssteg: { cat: 'netz', name: 'Steg', cost: 60, needs: 'meer', beauty: 2,
             desc: 'Ein Holzsteg ins Meer, direkt an der Küste. Von hier schickst du ein Boot hinaus, um neue Inseln zu entdecken.' },
  seilbahn: { cat: 'deko', name: 'Seilbahn-Station', invention: 'seilbahn', cost: 800, mat: { metall: 10, bretter: 6 }, needs: 'grass', beauty: 10,
             desc: 'Zwei Stationen verbinden sich mit einem Seil (bis 20 Felder weit). Die Gondeln befördern 80 Fahrgäste/min – auch übers Wasser zwischen Inseln – und binden die Gegend an beiden Stationen ans Dorf an.' },
  // --- Strom: Kraftwerke liefern ⚡ (POWER_OUT in rules.js), ein guter Platz bis +50 % (siteOf) ---
  windrad: { cat: 'strom', name: 'Windrad', lm: 'klippe:3', cost: 200, needs: 'grass', beauty: 6, desc: 'Dreht sich gemütlich im Wind und liefert Strom: 1 ⚡, ausgebaut bis 3 ⚡.' },
  wasserkraft: { cat: 'strom', name: 'Wasserkraftwerk', tech: 'wasserkraft', cost: 900, mat: { quader: 10, metall: 4 }, needs: 'shore', beauty: 4,
               desc: 'Ein Wasserrad am Teich, See oder Fluss: 4 ⚡ Strom.' },
  solarfeld: { cat: 'strom', name: 'Solarfeld', lm: 'kristall:1', size: [2, 2], cost: 1200, mat: { kristall: 8, metall: 6 }, needs: 'grass',
               desc: 'Paneele aus Kristallglas auf der Wiese: 3 ⚡ Strom.' },
  geothermie: { cat: 'strom', name: 'Geothermie', lm: 'quelle:2', isle: 'quelle', size: [2, 2], cost: 2500, mat: { quader: 20, metall: 12 }, needs: 'grass',
               desc: 'Nutzt die Wärme tief unter der Quelleninsel: 8 ⚡ Strom.' },
  wellen:  { cat: 'strom', name: 'Wellenkraftwerk', tech: 'wellen', cost: 1500, mat: { metall: 12, bretter: 6 }, needs: 'meer',
               desc: 'Bojen vor der Küste wippen in den Wellen: 5 ⚡ Strom.' },
  // Offshore (Block 48): Windkraft im Meer – vor der Küste oder bis OFFSHORE_REACH Felder weiter draußen; eine Stufe, 6 ⚡
  offshore: { cat: 'strom', name: 'Offshore-Windrad', tech: 'offshore', cost: 3000, mat: { metall: 16, quader: 8 }, needs: 'offshore',
               desc: 'Ein großes Windrad im Meer – direkt vor der Küste oder weiter draußen: 6 ⚡ Strom, doppelt so viel wie ein voll ausgebautes Windrad.' },
  pavillon:{ cat: 'deko', name: 'Pavillon', cost: 400, mat: { bretter: 8 }, needs: 'grass', beauty: 20, design: 600, master: true, desc: 'Für Konzerte im Park.' },
  statue:  { cat: 'deko', name: 'Sternstatue', cost: 700, mat: { quader: 6, metall: 2 }, needs: 'grass', beauty: 30, design: 900, master: true, desc: 'Glänzt golden.' },
  // --- Gelände ---
  graben:  { cat: 'land', name: 'Teich graben', cost: 30, paint: true, desc: 'Macht aus Wiese Wasser (gut für Fischer).' },
  schuett: { cat: 'land', name: 'Aufschütten', cost: 60, paint: true, desc: 'Macht aus Wasser neues Land – auch im Meer direkt neben deinem Land.' },
  // Terraforming (Forschung): Gelände selbst gestalten – alles, was natürlich vorkommt (außer Erz und Kristall)
  wiese:   { cat: 'land', name: 'Wiese', tech: 'terraform', cost: 10, paint: true, desc: 'Macht Wald, Fels oder Strand wieder zu grüner Wiese – auch direkt am Wasser.' },
  // Park zum Selberbauen (Block 44): gepflegter Rasen – zählt als Wiese, darauf nur Deko und Wege; zusammen mit Deko wird er ein Park
  parkrasen: { cat: 'deko', name: 'Parkrasen', lm: 'baum:2', cost: 8, paint: true, desc: 'Gepflegter Rasen für einen Park: aufziehen, dann Bäume, Beete, Bänke und Brunnen daraufstellen.' },
  strand:  { cat: 'land', name: 'Strand', tech: 'terraform', cost: 15, paint: true, desc: 'Heller Sand – am Wasser oder wo du willst. Bauen kann man darauf trotzdem.' },
  wald:    { cat: 'land', name: 'Wald pflanzen', tech: 'terraform', cost: 20, paint: true, desc: 'Pflanzt Wald – Gelände für Holzfäller.' },
  obstwald: { cat: 'land', name: 'Obstbäume pflanzen', tech: 'terraform', cost: 30, paint: true, desc: 'Pflanzt einen wilden Obsthain – Gelände für Obstplantagen.' },
  fels:    { cat: 'land', name: 'Felsen setzen', tech: 'terraform', cost: 40, paint: true, desc: 'Setzt Felsen – Gelände für Steinbrüche.' },
  verschieben: { cat: 'land', name: 'Verschieben', cost: 0, desc: 'Etwas antippen, dann das Ziel antippen. Kostenlos, auch Rathaus und restaurierte Sehenswürdigkeiten.' },
  abriss:  { cat: 'land', name: 'Abreißen', cost: 0, desc: 'Gebäude (halber Preis zurück), Wald roden, Fels sprengen.' },
  // --- fest ---
  rathaus: { cat: null, name: 'Rathaus', size: [3, 3], beauty: 5, fixed: true, desc: 'Das Herz deiner Insel. Alle Wege führen hierher.' },
  lm:      { cat: null, name: 'Sehenswürdigkeit', size: [3, 3], fixed: true, desc: '' },
  truhe:   { cat: null, name: 'Truhe', fixed: true, desc: 'Auf einer fernen Insel gefunden – antippen und öffnen.' },
};
// Rohstoffe und Waren im gemeinsamen Lager
const RES = {
  holz: { name: 'Holz', icon: '🪵' }, stein: { name: 'Stein', icon: '🪨' }, erz: { name: 'Erz', icon: '⛏️' },
  obst: { name: 'Obst', icon: '🍎' }, bretter: { name: 'Bretter', icon: '🪚' }, quader: { name: 'Pflastersteine', icon: '🧱' },
  metall: { name: 'Metall', icon: '🔩' }, kristall: { name: 'Kristall', icon: '💎' },
  // exotisch – wächst nur auf fernen Inseln (Block 30)
  kaffee: { name: 'Kaffee', icon: '☕' }, tee: { name: 'Tee', icon: '🍵' }, kakao: { name: 'Kakao', icon: '🍫' },
};
const CONV_RATIO = 2;           // 2 Rohstoff → 1 Ware
const newRes = () => Object.fromEntries(Object.keys(RES).map(k => [k, 0]));
const matText = mat => Object.entries(mat || {}).map(([r, n]) => `${RES[r].icon}${n}`).join(' ');
const hasMat = mat => Object.entries(mat || {}).every(([r, n]) => state.res[r] >= n);
const payMat = mat => { for (const [r, n] of Object.entries(mat || {})) state.res[r] -= n; if (typeof flashStore === 'function') flashStore(mat); };
function matError(mat) {
  for (const [r, n] of Object.entries(mat || {})) if (state.res[r] < n) return `Zu wenig ${RES[r].name} (${n} ${RES[r].icon} nötig)`;
  return null;
}

// ---------------------------------------------------------------------------
// Läden und Kultur (Block 30). Kundschaft = Einwohner im selben Viertel + Besucher, die auf die Insel kommen (Bahn, Schiff);
// gleiche Läden im Viertel teilen sich die Kunden. rate: Taler/s je 100 Kunden. ware/sell: verkauft Ware aus dem Lager
// (Stück/s je 100 Kunden, zum SALE_MUL-fachen Grundpreis). attr: zieht Besucher an. hotel: Insel zieht mehr Besucher an.
// types: zählt für die Innenstadt so oft. size: [tief, breit]. Freischalten wie andere Gebäude (lanterns, lm, festival).
// look: fürs Bild (Wand, Dach, Markise, Auslage vor der Tür)
// ---------------------------------------------------------------------------
const SHOPS = {
  kiosk:       { name: 'Kiosk', icon: '📰', rate: 3, cost: 150, workers: 1, lanterns: 1, look: ['#f5e1b8', '#e8604f', '#e8604f', 'zeitung'],
                 tip: 'Der kleinste Laden – billig, überall. Häuser wünschen sich ab dem Stadthaus einen Laden in der Nähe.' },
  blumenladen: { name: 'Blumenladen', icon: '💐', rate: 3, cost: 300, workers: 1, lanterns: 2, beauty: 8, look: ['#fff0f4', '#58b36a', '#f28cb1', 'blumen'],
                 tip: 'Bringt Kundschaft und macht die Straße schön.' },
  friseur:     { name: 'Friseur', icon: '💈', rate: 4, cost: 400, workers: 1, lanterns: 3, look: ['#e4f1ff', '#5f8fe8', '#5f8fe8', 'bank'] },
  cafe:        { name: 'Café', icon: '☕', rate: 5, cost: 500, mat: { bretter: 4 }, workers: 1, lanterns: 3, ware: 'kaffee', sell: 0.3, look: ['#f3e3cc', '#8a5a3c', '#c98d5c', 'tische'],
                 tip: 'Mit Kaffee von den fernen Inseln verkauft es viel mehr. Villen wünschen sich ein Café in der Nähe.' },
  teeladen:    { name: 'Teeladen', icon: '🍵', rate: 5, cost: 500, mat: { bretter: 4 }, workers: 1, lanterns: 3, ware: 'tee', sell: 0.3, look: ['#e8f5e4', '#58b36a', '#9fcf8f', 'tische'] },
  post:        { name: 'Post', icon: '📮', rate: 4, cost: 600, workers: 2, lanterns: 5, look: ['#fff6d6', '#e9a23b', '#e9c46a', 'kisten'] },
  apotheke:    { name: 'Apotheke', icon: '💊', rate: 6, cost: 900, workers: 2, lanterns: 6, look: ['#ffffff', '#58b36a', '#58b36a', 'bank'] },
  eisdiele:    { name: 'Eisdiele', icon: '🍦', rate: 5, cost: 600, workers: 1, lm: 'obsthain:1', ware: 'obst', sell: 0.6, look: ['#fff0f4', '#f28cb1', '#f28cb1', 'tische'] },
  hofladen:    { name: 'Hofladen', icon: '🧺', rate: 4, cost: 400, workers: 1, lm: 'obsthain:1', ware: 'obst', sell: 0.6, look: ['#f5e1b8', '#b5654a', '#9fcf8f', 'kisten'] },
  buchladen:   { name: 'Buchladen', icon: '📚', rate: 4, cost: 700, workers: 1, lm: 'ruine:1', science: 0.5, look: ['#efe6d8', '#6b4f3a', '#c3a8e6', 'buecher'] },
  bubbletea:   { name: 'Bubble-Tea-Laden', icon: '🧋', rate: 7, cost: 2500, workers: 2, lanterns: 8, ware: 'tee', sell: 0.4, look: ['#f3e8ff', '#c3a8e6', '#f28cb1', 'tische'] },
  pizzeria:    { name: 'Pizzeria', icon: '🍕', rate: 8, cost: 3000, workers: 2, lanterns: 8, look: ['#fff6e4', '#c0694a', '#58b36a', 'tische'] },
  nudelbar:    { name: 'Nudelbar', icon: '🍜', rate: 8, cost: 3500, workers: 2, lanterns: 9, look: ['#fff3e0', '#3e3e4a', '#e8604f', 'laternen'] },
  konditorei:  { name: 'Konditorei', icon: '🎂', rate: 8, cost: 4000, workers: 2, lm: 'obsthain:2', ware: 'kakao', sell: 0.3, look: ['#fff0f4', '#e39a8c', '#eeb3c6', 'tische'] },
  spielzeug:   { name: 'Spielzeugladen', icon: '🧸', rate: 9, cost: 8000, workers: 2, lanterns: 10, look: ['#fff6d6', '#5f8fe8', '#efcf8a', 'ballons'] },
  boutique:    { name: 'Boutique', icon: '👗', rate: 10, cost: 10000, workers: 2, lanterns: 10, look: ['#ffffff', '#3e3e4a', '#eeb3c6', 'puppen'] },
  uhrmacher:   { name: 'Uhrmacher', icon: '⏰', rate: 8, cost: 12000, mat: { metall: 10 }, workers: 2, lm: 'erzberg:2', ware: 'metall', sell: 0.15, look: ['#e8e2d6', '#6b4f3a', '#93c2e0', 'uhr'] },
  juwelier:    { name: 'Juwelier', icon: '💍', rate: 12, cost: 30000, mat: { kristall: 10 }, workers: 2, lm: 'kristall:1', ware: 'kristall', sell: 0.06, look: ['#f5f0ff', '#3e3e4a', '#c3a8e6', 'uhr'] },
  chocolaterie:{ name: 'Chocolaterie', icon: '🍫', rate: 10, cost: 50000, workers: 2, festival: true, ware: 'kakao', sell: 0.5, look: ['#f3e3cc', '#6b4a2e', '#8a5a3c', 'tische'] },
  // größere Stadt-Läden
  moebelhaus:  { name: 'Möbelhaus', icon: '🛋️', size: [2, 2], rate: 12, cost: 20000, mat: { bretter: 40 }, workers: 4, lanterns: 9, ware: 'bretter', sell: 0.5, look: ['#e9d3a8', '#8a5a3c', '#efcf8a', 'sofa'] },
  kino:        { name: 'Kino', icon: '🎬', size: [2, 2], cat: 'kultur', rate: 15, attr: 60, cost: 40000, mat: { quader: 30 }, workers: 4, lanterns: 12, look: ['#3e3e4a', '#e8604f', '#ffd23f', 'kino'] },
  hotel:       { name: 'Hotel', icon: '🏨', size: [2, 2], rate: 10, hotel: 0.25, cost: 50000, mat: { quader: 30, bretter: 20 }, workers: 4, lanterns: 11, look: ['#fff6e4', '#5f8fe8', '#93c2e0', 'hotel'],
                 tip: 'Übernachtungsgäste: Die Insel zieht ein Viertel mehr Besucher an (per Bahn und Schiff).' },
  markthalle:  { name: 'Markthalle', icon: '🏛', size: [2, 3], rate: 15, cost: 80000, mat: { quader: 40, metall: 20 }, workers: 5, lanterns: 14, raw: true, sell: 1, look: ['#e6d8bd', '#7fa39a', '#9fcf8f', 'halle'],
                 tip: 'Verkauft Holz, Stein, Erz und Obst aus dem Lager an die Kundschaft – die Lagerberge werden zu Talern.' },
  // Endgame (nach dem Laternenfest)
  kaufhaus:    { name: 'Kaufhaus', icon: '🏬', size: [3, 3], rate: 40, cost: 500000, mat: { quader: 150, metall: 80, kristall: 20 }, workers: 10, festival: true, all: true, sell: 0.15, types: 2, look: ['#f5f0e6', '#3e7fd0', '#e8604f', 'kaufhaus'],
                 tip: 'Verkauft ein bisschen von allen Waren im Lager und zählt für die Innenstadt doppelt.' },
  passage:     { name: 'Einkaufspassage', icon: '🛍️', size: [2, 4], rate: 30, cost: 400000, mat: { quader: 100, metall: 60, kristall: 30 }, workers: 8, festival: true, types: 3, look: ['#fff6e4', '#c9735a', '#93c2e0', 'passage'],
                 tip: 'Glasdach über einer Ladenstraße – zählt für die Innenstadt dreifach.' },
  theater:     { name: 'Theater', icon: '🎭', size: [3, 3], cat: 'kultur', rate: 25, attr: 150, cost: 600000, mat: { quader: 200, bretter: 100 }, workers: 8, festival: true, look: ['#f3e3cc', '#9c4f3a', '#e8604f', 'saeulen'] },
  museum:      { name: 'Museum', icon: '🖼️', size: [3, 3], cat: 'kultur', rate: 20, attr: 150, science: 3, cost: 600000, mat: { quader: 250, metall: 50 }, workers: 8, festival: true, look: ['#efe9dc', '#7fa39a', '#c3a8e6', 'kuppel'] },
  konzerthalle:{ name: 'Konzerthalle', icon: '🎵', size: [3, 3], cat: 'kultur', rate: 25, attr: 150, cost: 700000, mat: { quader: 150, metall: 100, kristall: 40 }, workers: 8, festival: true, look: ['#ffffff', '#93c2e0', '#5f8fe8', 'welle'] },
  aquarium:    { name: 'Aquarium', icon: '🐠', size: [3, 3], cat: 'kultur', rate: 25, attr: 200, cost: 900000, mat: { kristall: 80, metall: 100 }, workers: 8, festival: true, look: ['#e4f1ff', '#3e7fd0', '#93c2e0', 'glaskuppel'] },
  zoo:         { name: 'Zoo', icon: '🦒', size: [4, 4], cat: 'kultur', rate: 30, attr: 300, cost: 1200000, mat: { bretter: 300, quader: 100 }, workers: 12, festival: true, look: ['#e9d3a8', '#58b36a', '#efcf8a', 'zoo'] },
  stadion:     { name: 'Stadion', icon: '🏟️', size: [5, 5], cat: 'kultur', rate: 40, attr: 400, cost: 2000000, mat: { quader: 400, metall: 200 }, workers: 15, festival: true, look: ['#dcd6ca', '#e8604f', '#ffffff', 'stadion'] },
  grandhotel:  { name: 'Grand Hotel', icon: '🏩', size: [3, 3], rate: 25, hotel: 0.6, cost: 1000000, mat: { quader: 200, metall: 80, kristall: 40 }, workers: 10, festival: true, look: ['#f5f0e6', '#7fa39a', '#e9c46a', 'grand'],
                 tip: 'Der Luxus: Die Insel zieht 60 % mehr Besucher an.' },
};
const SALE_MUL = 3;              // Läden zahlen das Dreifache des Grundpreises (Aufträge: 1,2–3×, aber nur ab und zu)
for (const [id, S] of Object.entries(SHOPS)) {
  const fx = [S.ware ? `${RES[S.ware].icon} → 🪙` : S.raw ? '🪵🪨⛏️🍎 → 🪙' : S.all ? '📦 → 🪙' : '🪙 Kundschaft', S.attr ? `👥 zieht an` : '', S.hotel ? `+${Math.round(S.hotel * 100)} % Besucher` : '',
    S.science ? '💡' : '', S.beauty ? `🌸 +${S.beauty}` : ''].filter(Boolean).join(' · ');
  ITEMS[id] = { cat: S.cat || 'laden', name: S.name, size: S.size, cost: S.cost, mat: S.mat, needs: 'grass', workers: S.workers, beauty: S.beauty, science: S.science,
    lanterns: S.lanterns, lm: S.lm, festival: S.festival, shop: true,
    desc: `${S.icon} Verdient an Kundschaft (Einwohner im Viertel, Besucher der Insel)${S.ware ? `, verkauft ${RES[S.ware].name} aus dem Lager` : S.raw ? ', verkauft Rohstoffe aus dem Lager' : S.all ? ', verkauft alle Waren aus dem Lager' : ''}${S.attr ? ', zieht Besucher an' : ''}.` };
  for (const k of Object.keys(ITEMS[id])) if (ITEMS[id][k] === undefined) delete ITEMS[id][k];
  SHOPS[id].fx = fx;
}
// Marktstände (Block 39): kommen auf einen Weg oder Platz (der Weg bleibt darunter, t.weg). Ab MARKT_STEPS[0] Ständen
// auf einem zusammenhängenden Platz ist er ein Marktplatz – mehr Stände: Wochenmarkt, Großer Markt (rules.js computeMarkets)
const STANDS = {
  stand_obst:    { name: 'Obststand', awn: '#e8604f', goods: ['#ff6b5e', '#ffd23f', '#7ccf5b', '#ff9f5a'] },
  stand_blumen:  { name: 'Blumenstand', awn: '#f28cb1', goods: ['#f28cb1', '#ffd23f', '#c3a8e6', '#ffffff'] },
  stand_brot:    { name: 'Brotstand', awn: '#e9a23b', goods: ['#d9a15c', '#c98a4a', '#e8c07a'] },
  stand_kaese:   { name: 'Käsestand', awn: '#5f8fe8', goods: ['#ffd23f', '#f5c542', '#fbe38a'] },
  stand_fisch:   { name: 'Fischstand', awn: '#3e7fd0', goods: ['#93c2e0', '#b8d6e8', '#e8f1f6'] },
  stand_gewuerz: { name: 'Gewürzstand', awn: '#9c4f3a', goods: ['#e8604f', '#e9a23b', '#58b36a', '#8a5a3c'] },
};
const MARKT_STEPS = [[3, 'Marktplatz'], [6, 'Wochenmarkt'], [9, 'Großer Markt']];
// Park zum Selberbauen (Block 44): zusammenhängender Parkrasen mit Deko darauf. Stufe nach Fläche, Deko-Anzahl und Vielfalt
const PARK_STEPS = [
  { name: 'Grünanlage', tiles: 4, deco: 3, need: [] },
  { name: 'Park', tiles: 9, deco: 8, need: ['baum', 'bank'] },
  { name: 'Stadtpark', tiles: 16, deco: 15, need: ['baum', 'bank', 'wasser'] },
];
// Welche Deko wofür zählt (Grundmodell → Sorte); alles andere zählt nur als Deko
const PARK_SORT = { baum: 'baum', palme: 'baum', busch: 'baum', bank: 'bank', brunnen: 'wasser', kristallbrunnen: 'wasser',
  blumen: 'blumen', blumentopf: 'blumen', riesenblume: 'blumen', rosenbogen: 'blumen' };
const PARK_SORT_NAMES = { baum: 'Bäume', bank: 'eine Bank', wasser: 'Wasser (Brunnen)' };
for (const [id, S] of Object.entries(STANDS)) ITEMS[id] = { cat: 'markt', name: S.name, cost: 250, mat: { bretter: 2 }, needs: 'platz', tech: 'handel', beauty: 3,
  desc: 'Kommt auf einen Weg oder Platz. Ab 3 Ständen auf einem Platz wird daraus ein Marktplatz: Läden drumherum verdienen mehr, Besucher kommen, ab und zu ist Markttag.' };
// Leuchtturm: fester Preis als Untergrenze, sonst 60 Minuten des besten Einkommens (leuchtCost, Block 37) – überall,
// wo ITEMS.leuchtturm.cost gelesen wird (Kachel, Bauen, Planen, Erstatten)
const LEUCHT_BASE = ITEMS.leuchtturm.cost;
ITEMS.leuchtturm.baseCost = LEUCHT_BASE;                                     // Erstatten ohne t.price (Regel 73)
Object.defineProperty(ITEMS.leuchtturm, 'cost', { get: () => (typeof leuchtCost === 'function' ? leuchtCost() : LEUCHT_BASE), enumerable: true, configurable: true });
// Freizeitpark (Block 60, nach dem Laternenfest): Parkboden malen, Fahrgeschäfte und Stände darauf stellen → Rummelplatz,
// Freizeitpark, Wunderland. Module (cat 'fz', needs 'fz') kosten nach dem besten Einkommen: mindestens base, sonst min
// Minuten davon (wie der Leuchtturm). fzSort: Art für die Vielfalt der Stufen.
Object.assign(ITEMS, {
  fzboden: { cat: 'deko', name: 'Freizeitpark-Boden', festival: true, cost: 40, paint: true,
             desc: 'Bunter Pflasterboden für deinen Freizeitpark: aufziehen, dann Fahrgeschäfte und Stände daraufstellen. Wege und Deko dürfen mit drauf.' },
  fz_karussell: { cat: 'fz', name: 'Pferdekarussell', festival: true, size: [2, 2], cost: 150000, fzMin: 12, needs: 'fz', fzSort: 'fahrt', beauty: 40,
                  desc: 'Ein prächtiges Karussell mit goldenen Stangen, Pferdchen und Lichtern.' },
  fz_zuckerwatte: { cat: 'fz', name: 'Zuckerwatte-Stand', festival: true, cost: 20000, fzMin: 2, needs: 'fz', fzSort: 'stand', beauty: 8,
                    desc: 'Rosa Wolken am Stiel – ein kleiner Stand mit gestreiftem Dach.' },
  // Block 60b
  // Märchenschloss (Block 60g): EIN Gebäude, gestaltet im Fenster (t.cs: Breite, Tiefe, Mittelturm, Seitentürme, Dach)
  fz_schloss: { cat: 'fz', name: 'Märchenschloss', festival: true, size: [2, 5], cost: 600000, fzMin: 30, needs: 'fz', fzSort: 'schloss', beauty: 80,
                desc: 'Dein eigenes Märchenschloss: im Fenster Form, Türme und Farben gestalten – oder mit einer Vorlage anfangen.' },
  // Eingang: zwei Tortürme in einer Reihe, dazwischen spannt sich der Bogen
  fz_torturm: { cat: 'fz', name: 'Torturm', festival: true, fl0: 2, cost: 50000, fzMin: 4, needs: 'fz', beauty: 15,
                desc: 'Zwei Tortürme in einer Reihe (2 bis 7 Felder auseinander) – dazwischen spannt sich der Bogen mit Schild: dein Parkeingang.' },
  fz_teetassen: { cat: 'fz', name: 'Teetassen', festival: true, size: [2, 2], cost: 120000, fzMin: 10, needs: 'fz', fzSort: 'fahrt', beauty: 35,
                  desc: 'Bunte Tassen drehen sich um die große Teekanne – und jede noch um sich selbst.' },
  fz_kette: { cat: 'fz', name: 'Kettenkarussell', festival: true, size: [2, 2], cost: 160000, fzMin: 12, needs: 'fz', fzSort: 'fahrt', beauty: 40,
              desc: 'Hoch oben dreht sich das Dach, die Sitze fliegen an Ketten weit hinaus.' },
  fz_freifall: { cat: 'fz', name: 'Freifallturm', festival: true, cost: 200000, fzMin: 15, needs: 'fz', fzSort: 'fahrt', beauty: 35,
                 desc: 'Langsam hinauf – und dann: freier Fall! Ganz oben blinkt eine Krone aus Lichtern.' },
  fz_geister: { cat: 'fz', name: 'Geisterbahn', festival: true, size: [2, 2], cost: 180000, fzMin: 14, needs: 'fz', fzSort: 'fahrt', beauty: 30,
                desc: 'Ein schiefes Spukhaus mit grün leuchtenden Fenstern – um das Dach schwebt ein freundliches Gespenst.' },
  fz_wildwasser: { cat: 'fz', name: 'Wildwasserbahn', festival: true, size: [2, 3], cost: 300000, fzMin: 20, needs: 'fz', fzSort: 'fahrt', beauty: 50,
                   desc: 'Baumstamm-Boote fahren durch den Kanal, den Felsen hinauf und platschen den Wasserfall hinunter.' },
  fz_eis: { cat: 'fz', name: 'Eis-Stand', festival: true, cost: 20000, fzMin: 2, needs: 'fz', fzSort: 'stand', beauty: 8,
            desc: 'Ein hellblaues Wägelchen mit einer riesigen Eiswaffel auf dem Dach.' },
  fz_ballon: { cat: 'fz', name: 'Ballonverkäufer', festival: true, cost: 8000, fzMin: 1, needs: 'fz', fzSort: 'stand', beauty: 6,
               desc: 'Ein Bündel bunter Luftballons, die im Wind schaukeln.' },
  // Block 60c: Achterbahn – Schiene ziehen wie einen Weg, Station hinein, ein geschlossener Rundkurs fährt (Höhen von selbst)
  fz_bahn: { cat: 'fz', name: 'Achterbahn-Schiene', festival: true, cost: 2000, fzMin: 0.4, needs: 'fz', paint: true, beauty: 3,
             desc: 'Zieh die Strecke wie einen Weg über den Freizeitpark-Boden – als geschlossenen Rundkurs mit einer Station. Hügel und Abfahrten kommen von selbst.' },
  fz_station: { cat: 'fz', name: 'Achterbahn-Station', festival: true, cost: 150000, fzMin: 12, needs: 'fz', beauty: 20,
                desc: 'Hier steigen die Gäste ein. Gehört in den Rundkurs der Achterbahn – dann fährt der Zug.' },
  fz_hoch: { cat: 'fz', name: 'Achterbahn höher', festival: true, cost: 0, paint: true, needs: 'fz',
             desc: 'Über Achterbahn-Schienen ziehen: jedes Stück eine Stufe höher (bis 10). Ohne Pinsel baut sich die Strecke von selbst als Hügelbahn.' },
  fz_tief: { cat: 'fz', name: 'Achterbahn tiefer', festival: true, cost: 0, paint: true, needs: 'fz',
             desc: 'Über Achterbahn-Schienen ziehen: jedes Stück eine Stufe tiefer.' },
  fz_looping: { cat: 'fz', name: 'Looping', festival: true, cost: 50000, fzMin: 4, needs: 'fz', beauty: 15,
                desc: 'Auf ein gerades Stück Achterbahn-Schiene setzen – der Zug fährt einmal kopfüber.' },
});
const FZ_STEPS = [
  { name: 'Rummelplatz', icon: '🎪', tiles: 9, rides: 2, need: [] },
  { name: 'Freizeitpark', icon: '🎠', tiles: 25, rides: 5, need: ['tor', 'fahrt', 'stand'] },
  { name: 'Wunderland', icon: '🏰', tiles: 49, rides: 10, need: ['tor', 'fahrt', 'stand', 'schloss'] },
];
const WIN_COLS = ['#a8dcff', '#ffd873', '#c9b8f0', '#b7e3a1', '#f7b2c8', '#ffffff', '#3d4a5c'];   // Fensterfarben (Schloss, Eingang)
const FZ_SORT_NAMES = { tor: 'ein Eingang (zwei Tortürme)', fahrt: 'ein Fahrgeschäft', stand: 'ein Stand', schloss: 'ein Märchenschloss', achterbahn: 'eine Achterbahn' };
const FZ_INC = [0, 0.08, 0.2, 0.4], FZ_ATTR = [0, 60, 150, 400], FZ_BEAUTY = [0, 60, 150, 300], FZ_NEAR = [0, 4, 6, 8];   // Einnahmen +%, Besucher, 🌸 (auch ringsum bis FZ_NEAR)
// Plantagen für exotische Waren – nur auf fernen Inseln (far)
Object.assign(ITEMS, {
  kaffeeplantage: { cat: 'bau', name: 'Kaffeeplantage', cost: 20000, mat: { bretter: 20 }, needs: 'grass', far: true, festival: true, workers: 2, prod: { kaffee: 0.25 },
                    desc: 'Nur auf fernen Inseln. Kaffee für Cafés – dort bringt er das Dreifache.' },
  teegarten:      { cat: 'bau', name: 'Teegarten', cost: 20000, mat: { bretter: 20 }, needs: 'grass', far: true, festival: true, workers: 2, prod: { tee: 0.25 },
                    desc: 'Nur auf fernen Inseln. Tee für Teeläden und Bubble Tea.' },
  kakaoplantage:  { cat: 'bau', name: 'Kakaoplantage', cost: 25000, mat: { bretter: 20 }, needs: 'grass', far: true, festival: true, workers: 2, prod: { kakao: 0.2 },
                    desc: 'Nur auf fernen Inseln. Kakao für Konditorei und Chocolaterie.' },
});


// Häuser wachsen: jede Stufe bringt neue Wünsche; sind alle erfüllt, kann man ausbauen (Material aus dem Lager)
const HOUSE_STAGES = [
  { name: 'Häuschen', pop: 4 },
  { name: 'Fachwerkhaus', pop: 6, wishes: ['weg', 'deko'], money: 100, mat: { bretter: 2 } },
  { name: 'Reetdachhaus', pop: 9, wishes: ['baecker', 'ruhe'], money: 600, mat: { bretter: 4 } },
  { name: 'Stadthaus', pop: 12, wishes: ['markt', 'park', 'laden'], money: 3000, mat: { quader: 4 } },
  { name: 'Villa', pop: 16, wishes: ['schule', 'schoen', 'cafe'], money: 20000, mat: { quader: 4, metall: 2 } },
  // erst mit Kristall von der Kristallinsel: moderne Villa mit viel Glas
  { name: 'Glasvilla', pop: 22, wishes: ['wasser', 'kultur'], money: 100000, mat: { kristall: 8, quader: 6, metall: 4 }, lm: 'kristall:1' },
];
const WISHES = {
  weg:     { text: 'Weg vor der Tür' },
  deko:    { text: 'Deko in der Nähe (2 Felder) – auch Hecke, Zaun oder Mauer' },
  baecker: { text: 'Bäckerei erreichbar (6 Felder, oder per Weg/Bahn)' },
  ruhe:    { text: 'Ruhe – kein lauter Betrieb direkt daneben' },
  markt:   { text: 'Marktplatz erreichbar (8 Felder, oder per Weg/Bahn)' },
  park:    { text: 'Park oder Brunnen erreichbar (4 Felder, oder per Weg/Bahn)' },
  schule:  { text: 'Schule erreichbar (10 Felder, oder per Weg/Bahn)' },
  schoen:  { text: 'Schöne Umgebung (🌸 30 in 3 Feldern)' },
  wasser:  { text: 'Blick aufs Wasser (Teich, See oder Meer in 3 Feldern)' },
  laden:   { text: 'Ein Laden erreichbar (8 Felder, oder per Weg/Bahn)' },
  cafe:    { text: 'Café, Teeladen oder Eisdiele erreichbar (8 Felder, oder per Weg/Bahn)' },
  kultur:  { text: 'Kino, Theater, Museum … erreichbar (12 Felder, oder per Weg/Bahn)' },
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
  // Kraftwerke: Stufe 2 liefert doppelt, Stufe 3 dreimal so viel (POWER_OUT) – jede Stufe erst nach der Forschung
  windrad:   { names: ['Windrad', 'Großes Windrad', 'Windturbine'],
               up: [{ tech: 'kraftwerk2', cost: { money: 800, bretter: 10, metall: 8 } }, { tech: 'kraftwerk3', cost: { money: 2500, metall: 20, quader: 12 } }] },
  wasserkraft: { names: ['Wasserrad', 'Wasserkraftwerk', 'Großes Wasserkraftwerk'],
               up: [{ tech: 'kraftwerk2', cost: { money: 3000, quader: 20, metall: 10 } }, { tech: 'kraftwerk3', cost: { money: 9000, quader: 40, metall: 25 } }] },
  solarfeld: { names: ['Solarfeld', 'Großes Solarfeld', 'Solarpark'],
               up: [{ tech: 'kraftwerk2', cost: { money: 4000, kristall: 15, metall: 10 } }, { tech: 'kraftwerk3', cost: { money: 12000, kristall: 30, metall: 25 } }] },
  geothermie: { names: ['Geothermie', 'Geothermie-Werk', 'Großes Geothermie-Kraftwerk'],
               up: [{ tech: 'kraftwerk2', cost: { money: 8000, quader: 30, metall: 20 } }, { tech: 'kraftwerk3', cost: { money: 25000, quader: 60, metall: 40 } }] },
  wellen:    { names: ['Wellenkraftwerk', 'Wellenpark', 'Großer Wellenpark'],
               up: [{ tech: 'kraftwerk2', cost: { money: 5000, metall: 20, bretter: 15 } }, { tech: 'kraftwerk3', cost: { money: 15000, metall: 40, bretter: 30 } }] },
  reihenhaus: { names: ['Reihenhäuser', 'Stadtreihe', 'Große Stadtreihe'],
               up: [{ near: ['markt', 1, 6], cost: { money: 5000, quader: 12, bretter: 10 } }, { near: ['schule', 1, 8], cost: { money: 20000, quader: 20, metall: 8 } }] },
  baumhaus:  { names: ['Baumhaus', 'Großes Baumhaus', 'Baumhaus-Dorf'],
               up: [{ beauty: [15, 2], cost: { money: 800, bretter: 12 } }, { near: ['baumhaus', 2, 4], cost: { money: 4000, bretter: 25, metall: 4 } }] },
  hausboot:  { names: ['Hausboot', 'Großes Hausboot', 'Hausboot mit Garten'],
               up: [{ near: ['hausboot', 1, 3], cost: { money: 1000, bretter: 15 } }, { water: 20, cost: { money: 5000, bretter: 20, metall: 6 } }] },
  ferienhaus: { names: ['Ferienhäuschen', 'Ferienhütten', 'Ferienanlage'],
               up: [{ beauty: [20, 3], cost: { money: 3000, bretter: 12 } }, { near: ['ferienhaus', 2, 4], cost: { money: 12000, bretter: 20, quader: 8 } }] },
  fabrik:    { names: ['Werkstatt', 'Manufaktur', 'Große Werkstatt'],
               up: [{ near: ['mine', 1, 4], cost: { money: 1300, quader: 8, metall: 4 } }, { near: ['schmiede', 1, 6], cost: { money: 3000, quader: 14, metall: 8 } }] },
  hafen:     { names: ['Hafen', 'Handelshafen', 'Großer Hafen'],
               up: [{ near: ['fischer', 2, 8], cost: { money: 1600, bretter: 16, quader: 6 } }, { near: ['fischer', 4, 8], cost: { money: 3500, bretter: 20, quader: 12, metall: 6 } }] },
  schule:    { names: ['Dorfschule', 'Schulhaus', 'Große Schule'],
               up: [{ pop: 25, cost: { money: 350, bretter: 8, quader: 4 } }, { pop: 60, near: ['bibliothek', 1, 10], cost: { money: 900, quader: 10, metall: 3 } }] },
  bibliothek:{ names: ['Bücherei', 'Bibliothek', 'Große Bibliothek'],
               up: [{ pop: 35, near: ['schule', 1, 10], cost: { money: 550, bretter: 8, quader: 6 } }, { pop: 70, near: [['park', 'brunnen'], 1, 4], cost: { money: 1200, quader: 12, metall: 4 } }] },
  uni:       { names: ['Universität', 'Große Universität', 'Universitätscampus'],   // Stufe 3 hieß „Sternwarte“ (die ist ein Wunderwerk, Block 90)
               up: [{ pop: 80, near: ['bibliothek', 1, 10], cost: { money: 2200, quader: 16, metall: 6 } }, { pop: 120, near: ['kunst', 1, 10], cost: { money: 5000, quader: 24, metall: 12 } }] },
  kunst:     { names: ['Kunstakademie', 'Atelierhaus', 'Kunstpalast'],
               up: [{ pop: 40, beauty: [40, 3], cost: { money: 800, bretter: 8, quader: 6 } }, { pop: 80, near: [['pavillon', 'statue'], 1, 4], cost: { money: 1800, quader: 12, metall: 5 } }] },
};
const PLURAL = { feld: 'Felder', muehle: 'Mühlen', holz: 'Holzfäller', fischer: 'Fischerhütten', obst: 'Obstplantagen', stein: 'Steinbrüche',
  mine: 'Bergwerke', haus: 'Häuser', schmiede: 'Schmieden', saege: 'Sägewerke', steinmetz: 'Steinmetze', kristallmine: 'Kristallminen' };
// Verkehrsmittel (Forschungs-Reiter „Verkehr“): jedes Modell sieht anders aus, hat mehr Plätze und ist schneller –
// Fahrgäste/min = Plätze × Tempo. Das erste ist frei, sobald Seehandel bzw. Eisenbahn erforscht ist; die anderen kosten
// Ideen (cost) und brauchen die Forschungsstufe tier (Bibliothek/Universität). Schiffe kauft man am Hafen (buy).
const SHIP_MODELS = [
  { id: 'holz',      name: 'Holzfähre',  icon: '⛵', seats: 60,  speed: 1,   cost: 0,      buy: { money: 800, bretter: 10 } },
  { id: 'dampfer',   name: 'Raddampfer', icon: '🛳️', seats: 110, speed: 1.3, cost: 5000,   tier: 2, buy: { money: 3000, bretter: 12, metall: 6 } },
  { id: 'motor',     name: 'Motorfähre', icon: '⛴️', seats: 180, speed: 1.7, cost: 30000,  tier: 3, buy: { money: 12000, metall: 16 } },
  { id: 'katamaran', name: 'Katamaran',  icon: '🚤', seats: 280, speed: 2.3, cost: 150000, tier: 3, buy: { money: 50000, metall: 30, kristall: 8 } },
];
// Züge: Plätze je Wagen (perCar), Wagen des Modells (cars, anhängbar), Tempo
const TRAIN_MODELS = [
  { id: 'tram',    name: 'Straßenbahn',  icon: '🚋', cars: 1, perCar: 50, speed: 0.9, cost: 0 },
  { id: 'regio',   name: 'Regionalbahn', icon: '🚆', cars: 2, perCar: 60, speed: 1,   cost: 4000,   tier: 2 },
  { id: 'modern',  name: 'Triebwagen',   icon: '🚈', cars: 3, perCar: 70, speed: 1.3, cost: 25000,  tier: 3 },
  { id: 'schnell', name: 'Schnellzug',   icon: '🚄', cars: 4, perCar: 80, speed: 1.7, cost: 150000, tier: 3 },
];
const SHIP_BY_ID = Object.fromEntries(SHIP_MODELS.map(m => [m.id, m])), TRAIN_BY_ID = Object.fromEntries(TRAIN_MODELS.map(m => [m.id, m]));
// Sorten: Bedingungen fragen nach einer Sorte, nicht nach genau einem Gebäude – „ein Haus in der Nähe“ ist jedes
// Wohnhaus, „ein Brunnen“ auch der Kristallbrunnen, „ein Park“ auch der Botanische Garten. In `near` (BUILD_STAGES) und
// bei den Wünschen steht der Name der Sorte; ist er keine Sorte, gilt genau dieses Gebäude.
const KINDS = {
  haus:    { name: 'Wohnhaus', plural: 'Wohnhäuser', of: ['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus'] },
  brunnen: { name: 'Brunnen', plural: 'Brunnen', of: ['brunnen', 'kristallbrunnen'] },
  pavillon: { name: 'Pavillon', plural: 'Pavillons', of: ['pavillon'] },   // damit der große Pavillon mitzählt (Block 84c)
  park:    { name: 'Park', plural: 'Parks', of: ['botgarten'] },     // dazu Parkrasen (parkReach); der alte Park (3×3) ist seit Block 64 weg
  markt:   { name: 'Marktplatz', plural: 'Marktplätze', of: ['stand_obst', 'stand_blumen', 'stand_brot', 'stand_kaese', 'stand_fisch', 'stand_gewuerz'] },
  statue:  { name: 'Statue', plural: 'Statuen', of: ['statue', 'denkmal'] },
  laden:   { name: 'Laden', plural: 'Läden', of: Object.keys(SHOPS).filter(id => (SHOPS[id].cat || 'laden') === 'laden') },
  cafe:    { name: 'Café', plural: 'Cafés', of: ['cafe', 'teeladen', 'bubbletea', 'eisdiele', 'konditorei', 'chocolaterie'] },
  kultur:  { name: 'Kulturbau', plural: 'Kulturbauten', of: Object.keys(SHOPS).filter(id => SHOPS[id].cat === 'kultur') },
};
const kindOf = k => KINDS[k] ? KINDS[k].of : [k];
const isKind = (k, b) => kindOf(k).includes(b);
// Größen (Block 43): manche Deko gibt es in mehreren Größen – je Größe ein eigener Eintrag (variantOf = Grundmodell),
// im Menü und Album nur das Grundmodell; gewählt wird über die Größen-Leiste (SIZE_ORDER). 'base' = das Grundmodell.
// f = wie viel größer gezeichnet als das Grundmodell, span = Beet: mehr Blumen statt größerer Blumen.
const SIZE_NAMES = { s: 'Klein', m: 'Mittel', l: 'Groß', xl: 'Riesig' }, SIZE_MUL = { s: 0.4, m: 1, l: 3.5, xl: 8 };
const DECO_SIZES = {
  brunnen: { base: 'm', s: { small: true, f: 0.5 }, l: { size: [2, 2], f: 2 }, xl: { size: [3, 3], f: 3 } },
  kristallbrunnen: { base: 'm', s: { small: true, f: 0.5 }, l: { size: [2, 2], f: 2 }, xl: { size: [3, 3], f: 3 } },
  baum: { base: 's', m: { f: 1.6 }, l: { size: [2, 2], f: 2.8, name: 'Alte Eiche' } },
  palme: { base: 's', m: { f: 1.6 }, l: { size: [2, 2], f: 2.6, name: 'Palmengruppe' } },
  busch: { base: 's', m: { f: 1.7, name: 'Busch' }, l: { size: [2, 2], f: 2.8, name: 'Buschgruppe' } },
  kristall: { base: 's', m: { f: 1.7 }, l: { size: [2, 2], f: 2.8 } },
  blumen: { base: 'm', l: { size: [2, 2], span: 2 }, xl: { size: [3, 3], span: 3 } },
  statue: { base: 'm', l: { size: [2, 2], f: 2 } },
  pavillon: { base: 'm', l: { size: [2, 2], f: 2 } },
  glashaus: { base: 'm', l: { size: [2, 3], f: 1.5 } },
};
const SIZE_ORDER = {};                 // Grundmodell → [[Größe, id], …] von klein nach groß
for (const [b, sz] of Object.entries(DECO_SIZES)) {
  const B = ITEMS[b], list = [];
  for (const k of ['s', 'm', 'l', 'xl']) {
    if (k === sz.base) { list.push([k, b]); continue; }
    const v = sz[k];
    if (!v) continue;
    const id = b + '_' + k, mul = SIZE_MUL[k] / SIZE_MUL[sz.base];
    const mat = B.mat ? Object.fromEntries(Object.entries(B.mat).map(([r, n]) => [r, Math.max(1, Math.round(n * mul))])) : undefined;
    ITEMS[id] = { ...B, name: v.name || `${B.name} (${SIZE_NAMES[k].toLowerCase()})`, cost: Math.round(B.cost * mul), beauty: Math.round(B.beauty * mul * 10) / 10,
      variantOf: b, vsize: k, vf: v.f || 1, span: v.span || 1, small: !!v.small, needs: v.small ? undefined : B.needs || 'grass' };
    if (mat) ITEMS[id].mat = mat; else delete ITEMS[id].mat;
    if (v.size) ITEMS[id].size = v.size; else delete ITEMS[id].size;
    if (!ITEMS[id].needs) delete ITEMS[id].needs;
    delete ITEMS[id].design;                                      // freigeschaltet wie das Grundmodell (available)
    list.push([k, id]);
  }
  SIZE_ORDER[b] = list;
  for (const K of Object.values(KINDS)) if (K.of.includes(b)) K.of.push(...list.map(([, id]) => id).filter(id => id !== b));
}
const baseOf = b => (ITEMS[b] && ITEMS[b].variantOf) || b;
const isHome = b => KINDS.haus.of.includes(b);
const kindName = k => KINDS[k] ? KINDS[k].name : ITEMS[k].name;
const kindPlural = k => KINDS[k] ? KINDS[k].plural : PLURAL[k] || ITEMS[k].name;
const NOISY = new Set(['saege', 'steinmetz', 'schmiede', 'fabrik', 'stein', 'holz', 'mine', 'kristallmine']);
// Bewohner: Tierart (so wie die Spaziergänger gezeichnet werden) und Vorname. Die ersten drei wohnen von Anfang an
// hier, die anderen ziehen erst ein, wenn ihre Insel entdeckt ist (isle, Block 55). fur: feste Fellfarbe der Art.
const ANIMALS = [
  { id: 'katze', icon: '🐱', family: 'Katz', names: ['Ottilie', 'Minka', 'Leo', 'Frida', 'Tom', 'Lotte', 'Pepe', 'Nala'] },
  { id: 'baer', icon: '🐻', family: 'Bär', names: ['Bruno', 'Hanna', 'Paul', 'Greta', 'Emil', 'Mila', 'Otto', 'Ida'] },
  { id: 'hase', icon: '🐰', family: 'Hase', names: ['Mika', 'Lilli', 'Fips', 'Rosa', 'Jonte', 'Klara', 'Hugo', 'Wanda'] },
  { id: 'eichhorn', icon: '🐿️', family: 'Eichhorn', isle: 'wald', fur: '#c96a36', names: ['Flitz', 'Hazel', 'Rocco', 'Nele', 'Krümel', 'Jule', 'Benno', 'Pina'] },
  { id: 'igel', icon: '🦔', family: 'Igel', isle: 'obst', fur: '#e8cfa8', names: ['Pieks', 'Mathilda', 'Theo', 'Susi', 'Kalle', 'Polly', 'Bodo', 'Lina'] },
  { id: 'fuchs', icon: '🦊', family: 'Fuchs', isle: 'wind', fur: '#e8843c', names: ['Finn', 'Ronja', 'Rufus', 'Fiene', 'Jaro', 'Elli', 'Henri', 'Juna'] },
  { id: 'giraffe', icon: '🦒', family: 'Giraffe', isle: 'ruine', fur: '#f2c35a', names: ['Gisela', 'Zuri', 'Hilde', 'Raffi', 'Lenja', 'Kasimir', 'Tilda', 'Jasper'] },
  { id: 'elefant', icon: '🐘', family: 'Elefant', isle: 'erz', fur: '#aab0bc', names: ['Benjamin', 'Rosi', 'Tembo', 'Dora', 'Anton', 'Fanni', 'Magnus', 'Lotta'] },
  { id: 'ente', icon: '🦆', family: 'Ente', isle: 'quelle', fur: '#fffdf4', names: ['Quentin', 'Erna', 'Paula', 'Kuno', 'Wilma', 'Gustav', 'Trude', 'Nils'] },
];

// Tiere in der Natur (Block 56): zeigen, wo es schön ist, und lassen sich antippen und sammeln (Album „Naturbeobachtungen“).
// rare: selten, mit besonderer Bedingung. hint: steht im Album, solange es noch fehlt.
const NATURE = [
  { id: 'schmetterling', icon: '🦋', name: 'Schmetterling', hint: 'an Blumenbeeten und im Park' },
  { id: 'vogel', icon: '🐦', name: 'Singvogel', hint: 'im Wald und in großen Parks' },
  { id: 'fisch', icon: '🐟', name: 'Fisch', hint: 'in Teichen, Seen und im Meer' },
  { id: 'frosch', icon: '🐸', name: 'Frosch', hint: 'am Ufer von Teichen und Seen' },
  { id: 'moewe', icon: '🕊️', name: 'Möwe', hint: 'an der Küste, bei Stegen und Häfen' },
  { id: 'robbe', icon: '🦭', name: 'Robbe', hint: 'im Meer direkt an der Küste' },
  { id: 'eisvogel', icon: '🪶', name: 'Eisvogel', rare: true, hint: 'am Wasser, wenn Blumen am Ufer blühen' },
  { id: 'gluehwurm', icon: '✨', name: 'Glühwürmchen', rare: true, hint: 'nachts im Park oder bei Blumen' },
  { id: 'eule', icon: '🦉', name: 'Eule', rare: true, hint: 'nachts im Wald' },
  { id: 'reh', icon: '🦌', name: 'Reh', rare: true, hint: 'am Waldrand, wo es ruhig ist' },
  { id: 'goldfisch', icon: '🐠', name: 'Goldfisch', rare: true, hint: 'in Teichen an sehr schönen Orten' },
  { id: 'regenbogenfalter', icon: '🌈', name: 'Regenbogenfalter', rare: true, hint: 'bei Blumen, wo es besonders schön ist' },
];
const NATURE_BY_ID = Object.fromEntries(NATURE.map(n => [n.id, n]));

// Baumenü (Block 40, gemeinsam entschieden): fünf Bereiche nach dem, was man gerade tun will –
// 🏘️ Stadt (was eine Stadt zwingend braucht: Wohnen, Einrichtungen, Verkehr) · 🏭 Herstellen (produziert) · 🛍️ Einkaufen
// (verdient an Kundschaft) · 🎡 Freizeit (Kultur, Wunder) · 🌸 Gestalten (Deko, Wege, Gelände – formt die Welt).
// Jedes Ding steht in genau einer Gruppe. ITEMS[].cat bleibt die Spiel-Kategorie.
const SHOP_GROUPS = {
  laeden: ['kiosk', 'blumenladen', 'friseur', 'buchladen', 'spielzeug', 'boutique', 'uhrmacher', 'juwelier'],
  essen: ['cafe', 'teeladen', 'eisdiele', 'hofladen', 'bubbletea', 'pizzeria', 'nudelbar', 'konditorei', 'chocolaterie'],
  gross: ['markthalle', 'moebelhaus', 'kaufhaus', 'passage'],
};
const MENU = [
  { id: 'stadt', label: '🏘️ Stadt', groups: [
    { id: 'wohnen', label: '🏠 Wohnen', items: ['haus', 'reihenhaus', 'baumhaus', 'hausboot', 'ferienhaus'] },
    { id: 'einrichtungen', label: '🏛️ Einrichtungen', items: ['schule', 'bibliothek', 'uni', 'kunst', 'post', 'apotheke', 'hotel', 'grandhotel'] },
    { id: 'verkehr', label: '🚆 Verkehr', items: ['schiene', 'station', 'hbf', 'seilbahn', 'bootssteg', 'hafen'] },
  ] },
  { id: 'herstellen', label: '🏭 Herstellen', groups: [
    { id: 'taler', label: '🪙 Taler', items: ['feld', 'muehle', 'fischer', 'baecker', 'fabrik'] },
    { id: 'rohstoffe', label: '📦 Rohstoffe', items: ['holz', 'obst', 'stein', 'mine', 'kristallmine', 'kaffeeplantage', 'teegarten', 'kakaoplantage'] },
    { id: 'veredeln', label: '🔨 Veredeln', items: ['saege', 'steinmetz', 'schmiede'] },
    { id: 'strom', label: '⚡ Strom', items: ['windrad', 'offshore', 'wasserkraft', 'solarfeld', 'geothermie', 'wellen'] },
  ] },
  { id: 'einkaufen', label: '🛍️ Einkaufen', groups: [
    { id: 'laeden', label: '🛍️ Läden', items: SHOP_GROUPS.laeden },
    { id: 'essen', label: '☕ Essen & Trinken', items: SHOP_GROUPS.essen },
    { id: 'markt', label: '🧺 Markt', items: Object.keys(STANDS) },
    { id: 'gross', label: '🏬 Kaufhäuser', items: SHOP_GROUPS.gross },
  ] },
  { id: 'freizeit', label: '🎡 Freizeit', groups: [
    { id: 'kultur', label: '🎭 Kultur', items: Object.keys(SHOPS).filter(id => ITEMS[id].cat === 'kultur') },
    { id: 'wunder', label: '🏛️ Wunder', items: ['riesenrad', 'sternwarte', 'seebruecke', 'botgarten', 'schloss', 'leuchtturm'] },
    { id: 'fzpark', label: '🎢 Freizeitpark', items: ['fzboden', 'fz_zuckerwatte', 'fz_eis', 'fz_ballon', 'zauberbrunnen'] },
    { id: 'fzschloss', label: '🏰 Schloss', items: ['fz_schloss', 'fz_torturm'] },
    { id: 'fzfahrt', label: '🎠 Fahrgeschäfte', items: ['fz_karussell', 'fz_teetassen', 'fz_kette', 'fz_freifall', 'fz_geister', 'fz_wildwasser'] },
    { id: 'fzbahn', label: '🎢 Achterbahn', items: ['fz_bahn', 'fz_station', 'fz_looping', 'fz_hoch', 'fz_tief'] },
  ] },
  { id: 'gestalten', label: '🌸 Gestalten', groups: [
    { id: 'land', label: '🛤️ Wege & Gelände', items: ['weg', 'parkrasen', 'graben', 'schuett', 'wiese', 'strand', 'wald', 'obstwald', 'fels'] },   // ✋ 🧹 stehen in der Werkzeugleiste
    { id: 'gruen', label: '🌳 Grün', items: ['baum', 'busch', 'blumentopf', 'blumen', 'palme', 'riesenblume', 'rosenbogen', 'glashaus', 'freundschaftsbaum'] },
    { id: 'linien', label: '🧱 Zäune & Hecken', items: ['hecke', 'zaun', 'mauer'] },
    { id: 'platz', label: '🪑 Platz', items: ['bank', 'freundesbank', 'laterne', 'kristallaterne', 'brunnen', 'kristallbrunnen', 'pavillon', 'glaskugel', 'kristall'] },
    { id: 'besonderes', label: '🏆 Besonderes', items: ['statue', 'denkmal', 'uhrturm', 'karussell', 'schmetterlingsgarten', 'vogelbaum', 'seerosenteich', 'pokal_bronze', 'pokal_silber', 'pokal_gold'] },
  ] },
];
// Suche (Block 38): Name ohne Groß/Klein und Umlaute („back“ findet die Bäckerei)
const searchNorm = t => t.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
const searchHits = q => { const n = searchNorm(q.trim()); return n ? MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items).filter(id => searchNorm(ITEMS[id].name).includes(n)) : []; };
// Bereiche ohne Filter haben den Filter 'alle'; mit Filtern ist der erste der Standard
const firstSub = top => { const m = MENU.find(e => e.id === top) || MENU[0]; return m.groups ? m.groups[0].id : 'alle'; };
// Wo steht ein Ding im Menü? (für „Ausprobieren“)
function menuPlaceOf(id) {
  for (const m of MENU) {
    if (m.groups) { for (const g of m.groups) if (g.items.includes(id)) return { top: m.id, sub: g.id }; }
    else if (m.items.includes(id)) return { top: m.id, sub: 'alle' };
  }
  return { top: MENU[0].id, sub: 'alle' };
}
const menuItemsOf = (top, sub) => {
  const m = MENU.find(e => e.id === top) || MENU[0];
  return m.groups ? (m.groups.find(g => g.id === sub) || m.groups[0]).items : m.items;
};
// Gruppen mit Gebäuden (Stadt, Herstellen, Einkaufen, Freizeit) – fürs Rathaus („Bereit“)
const buildGroups = () => MENU.filter(m => ['stadt', 'herstellen', 'einkaufen', 'freizeit'].includes(m.id)).flatMap(m => m.groups || [{ id: m.id, label: m.label, items: m.items }]);
// Wirkung auf einen Blick (Karte in der Leiste unten)
const FX = {
  hecke: '🌸 Linie · Lücke am Weg', zaun: '🌸 Linie · Tor am Weg', mauer: '🌸 Linie · Durchgang am Weg',
  haus: '👥 +4', reihenhaus: '👥 +10 (bis 30)', baumhaus: '👥 +5 · im Wald', hausboot: '👥 +4 · auf dem Wasser', bootssteg: '⛵ Inseln entdecken', ferienhaus: '🪙 +6/s · 👥 +2', feld: '🪙 +1/s', muehle: '+2/s je Feld', fischer: '+1,5/s je Wasser', baecker: '+6/s je Mühle', fabrik: '🪙 +25/s',
  holz: '🪵 Holz', obst: '🍎 Obst', stein: '🪨 Stein', mine: '⛏️ Erz', kristallmine: '💎 Kristall',
  saege: '🪵 → 🪚', steinmetz: '🪨 → 🧱', schmiede: '⛏️ → 🔩',
  hafen: '+8 % Betriebe · 🎣 · ⛴️', blumen: '+15 % Nachbarn',
  schule: '💡 Ideen', bibliothek: '💡 +1/s', uni: '💡 +3/s', kunst: '🌸 +25 · 💡',
  weg: 'verbindet Viertel', schiene: '🚆 Strecke', station: '👥 Fahrgäste · 🪙', hbf: '🚉 viele Linien · Umsteigen', seilbahn: '🚡 80 Fahrgäste/min · 🌸 +10',
  windrad: '⚡ +1 (bis 3)', wasserkraft: '⚡ +4 (bis 12)', solarfeld: '⚡ +3 (bis 9)', geothermie: '⚡ +8 (bis 24)', wellen: '⚡ +5 (bis 15)', offshore: '⚡ +6 im Meer',
  graben: '💧 Wasser', schuett: '🏝️ neues Land', wiese: '🌿 Wiese', parkrasen: '🌳 wird ein Park', strand: '🏖️ Sand', wald: '🌲 für Holzfäller', obstwald: '🍎 für Obst', fels: '🪨 für Stein', leuchtturm: '🏮 Laternenfest',
  riesenrad: '🪙 +25 % · 🎡 Jahrmarkt', sternwarte: '💡 +50 % · 🌠', seebruecke: '👥 +20 % · ⚓ Aufträge', botgarten: '🌸 +50 % · 🌴', schloss: '+50 % auf alles · 👑',
};
// Tipp im „Neu freigeschaltet“-Fenster: wohin damit, wozu ist es gut
const ITEM_TIPS = {
  reihenhaus: 'Ins Dorf, Tür zum Weg: drei Häuser auf zwei Feldern. Mit Markt und Schule (in der Nähe oder per Weg/Bahn erreichbar) wachsen sie.',
  baumhaus: 'Mitten in den Wald stellen – die Bäume bleiben. Mit schöner Umgebung und Nachbar-Baumhäusern wird ein Baumhaus-Dorf daraus.',
  hausboot: 'Aufs Wasser direkt am Ufer (auch im Teich). Mit Nachbar-Booten und viel Wasser wächst es.',
  bootssteg: 'Ins Meer direkt an die Küste bauen. Antippen: Boot losschicken und die nächste Insel entdecken.',
  ferienhaus: 'Auf Sand am Wasser (Strand – auch mit Terraforming angelegt). Feriengäste bringen Taler.',
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
  baecker: 'Direkt neben Mühlen: Jede Mühle daneben bringt +6 Taler/s. Häuser wünschen sich eine Bäckerei in der Nähe oder am Weg.',
  fabrik: 'Bringt viele Taler, mit Bergwerken in der Nähe noch mehr. Laut – nicht direkt neben Häuser.',
  hafen: 'Ans Wasser. +8 % auf die Einnahmen der Betriebe (bis zu 3 Häfen zählen), Fischkutter bringen Taler; Schiffe fahren zu Stegen und Häfen auf anderen Inseln; ab Stufe 2 kaufen Frachter dir Waren ab.',
  leuchtturm: 'Das Finale: ein Leuchtturm-Kap (3×3) an der Küste – dann beginnt das Laternenfest.',
  weg: 'Wege verbinden Gebäude zu einem Viertel und holen Betriebe weit weg auf volle Kraft.',
  schiene: 'Zieh Schienen zwischen zwei Inseln – über Wasser werden sie zur Brücke. Über einen Weg entsteht ein Bahnübergang.',
  hbf: 'Der große Kopfbahnhof: Vor jedes Gleis eine eigene Strecke legen (mit einem Feld Abstand, sonst wird es eine Linie). Jede fährt mit eigenem Zug – und am Bahnhof steigen die Leute um. Mehr Gleise im Infofenster.',
  station: 'Direkt an die Schiene stellen. Zwei verbundene Bahnhöfe auf verschiedenen Inseln und Strom: Der Zug fährt, bringt Fahrgäste und bindet die Umgebung ans Dorf an.',
  schule: 'Bringt Ideen für die Forschung – je mehr Einwohner, desto mehr. Villen wünschen sich eine Schule.',
  bibliothek: 'Mehr Ideen und die zweite Stufe der Forschung.',
  uni: 'Viele Ideen und die dritte Stufe der Forschung.',
  kunst: 'Macht die Umgebung schön und öffnet die Meisterstücke der Kunstakademie.',
  blumen: 'Direkt neben ein Gebäude: Jedes Beet daneben bringt ihm +15 %.',
  baum: 'Kleine Deko für eine Ecke – bis zu 4 pro Feld, auch hinters Haus oder an den Weg (Allee!).',
  blumentopf: 'Kleine Deko für eine Ecke, auch vors Haus. Häuser wünschen sich Deko in der Nähe.',
  busch: 'Kleine Deko für eine Ecke – bis zu 4 pro Feld, gut zum Mischen mit Baum und Bank.',
  hecke: 'Um Gärten, Parks und Plätze ziehen: Anfang und Ende antippen (oder ziehen). Niedrig, hoch, mit Blüten oder Buchs.',
  zaun: 'Um Gärten und Weiden: Anfang und Ende antippen. Holz, weiße Staketen, Weide, Schmiedeeisen, Gitter oder Glas – wo ein Weg durchgeht, gibt es ein Tor.',
  mauer: 'Gartenmauern passend zu deinen Wegen: Backstein, Klinker, Naturstein, Trockenmauer, Terrakotta, Kopfstein.',
  palme: 'Ein Gruß aus dem Botanischen Garten – schön am Strand und am Hafen.',
  riesenblume: 'Aus dem Palmenhaus: riesige Blüten in bunten Farben, bis zu 4 pro Feld.',
  bank: 'Kleine Deko für eine Ecke, gern an den Weg oder vors Haus.',
  laterne: 'Kleine Deko, leuchtet nachts – schön entlang der Wege. Tipp nah an eine Feldecke: Dann steht sie genau zwischen zwei Feldern oder im Bogen einer Kurve.',
  brunnen: 'Stadthäuser wünschen sich einen Park oder Brunnen in der Nähe.',
  kristall: 'Kleine leuchtende Deko für eine Ecke.',
  kristallaterne: 'Kleine Deko, leuchtet nachts hellblau.',
  glaskugel: 'Kleine schillernde Deko für eine Ecke.',
  kristallbrunnen: 'Große Deko mit viel Schönheit, glitzert und leuchtet nachts.',
  glashaus: 'Große Deko mit viel Schönheit, leuchtet abends warm.',
  windrad: 'Liefert Strom, egal wo – ausgebaut mehr (✨). Strom brauchen Laternen, Werkstätten, Hafen, Sägewerk, Universität, Züge und die Wunderwerke.',
  wasserkraft: 'Direkt ans Wasser stellen – das Rad zeigt von selbst zum Wasser. 4 ⚡, egal wie groß der Teich ist.',
  solarfeld: 'Irgendwo auf eine Wiese (2×2). 3 ⚡ aus Kristallglas.',
  geothermie: 'Nur auf der Quelleninsel – dort ist der Boden warm. 8 ⚡, das stärkste Kraftwerk.',
  wellen: 'Ins Meer direkt vor die Küste setzen. 5 ⚡.',
  offshore: 'Ins Meer setzen – direkt vor die Küste oder bis zu 6 Felder weiter draußen. 6 ⚡, mit Rotorblättern noch mehr.',
  pavillon: 'Große Deko mit viel Schönheit – schön im Park.',
  statue: 'Große Deko mit sehr viel Schönheit.',
  graben: 'Teiche für Fischerhütten oder den Wasserblick der Glasvilla. Aufziehen = Fläche.',
  riesenrad: 'Ein großes Bauprojekt (5×5): Stell die Baustelle hin und bau im Infofenster Abschnitt für Abschnitt. Jeder kostet etwa 15 Minuten deines Einkommens und viel Material.',
  sternwarte: 'Ein großes Bauprojekt (3×3): Baustelle hinstellen, dann Abschnitt für Abschnitt bauen – je etwa 20 Minuten Einkommen.',
  seebruecke: 'Vom Ufer aus ins Wasser stellen (das hinterste Feld an Land). Dann Abschnitt für Abschnitt bauen.',
  botgarten: 'Ein großes Bauprojekt mit Kristall (5×5): Baustelle hinstellen, dann Abschnitt für Abschnitt bauen – je etwa 15 Minuten Einkommen.',
  schloss: 'Das große Finale (7×7): Baustelle hinstellen und in sechs Abschnitten dein Schloss bauen – jeder kostet eine halbe Stunde Einkommen und mehr.',
  pokal_bronze: 'Deine erste Ehrennadel! Stell den Pokal vors Rathaus – kostet nichts.',
  denkmal: 'Alle Gebäude einmal gebaut! Ein Denkmal für dich – kostet nichts.',
  rosenbogen: 'Alle Deko einmal aufgestellt! Der Rosenbogen passt über jeden Weg – kostet nichts.',
  uhrturm: 'Alle Hausformen erreicht! Der Uhrturm gehört auf den Marktplatz – kostet nichts.',
  karussell: 'Alle Bewohner-Arten wohnen bei dir! Das Karussell dreht sich – kostet nichts.',
  fzboden: 'Nach dem Fest: bau dir deinen eigenen Freizeitpark! Boden aufziehen, dann Fahrgeschäfte und Stände daraufstellen.',
  fz_karussell: 'Das erste Fahrgeschäft: ein prächtiges Pferdekarussell.',
  fz_zuckerwatte: 'Rosa Zuckerwatte für die Besucher deines Freizeitparks.',
  fz_schloss: 'Bau dir dein Märchenschloss – so breit, so hoch und mit so vielen Türmen, wie du willst!',
  fz_torturm: 'Tortürme: zwei davon in einer Reihe sind dein Parkeingang.',
  fz_teetassen: 'Teetassen zum Drehen für deinen Freizeitpark.',
  fz_kette: 'Ein Kettenkarussell – die Sitze fliegen hoch hinaus.',
  fz_freifall: 'Ein Freifallturm für Mutige.',
  fz_geister: 'Eine Geisterbahn – gruselig, aber freundlich.',
  fz_wildwasser: 'Die Wildwasserbahn – Platsch!',
  fz_eis: 'Ein Eis-Stand für heiße Tage im Park.',
  fz_ballon: 'Ein Ballonverkäufer mit bunten Luftballons.',
  fz_bahn: 'Die Achterbahn! Zieh die Schiene als Rundkurs und setz eine Station hinein.',
  fz_station: 'Die Station für deine Achterbahn.',
  fz_looping: 'Ein Looping für deine Achterbahn – kopfüber!',
  fz_hoch: 'Mit dem Höhen-Pinsel ziehst du deine Achterbahn hoch hinaus – oder wieder tiefer.',
  fz_tief: 'Mit dem Höhen-Pinsel ziehst du deine Achterbahn hoch hinaus – oder wieder tiefer.',
  zauberbrunnen: 'Jedes Fahrgeschäft gebaut! Der Zauberbrunnen mit Regenbogen – kostet nichts.',
  schmetterlingsgarten: '4 Tiere in der Natur entdeckt! Über dem Schmetterlingsgarten tanzen immer Falter – kostet nichts.',
  vogelbaum: '8 Tiere in der Natur entdeckt! Im Vogelhäuschen-Baum wohnen Singvögel – kostet nichts.',
  seerosenteich: 'Alle Tiere in der Natur entdeckt! Der Seerosenteich mit Fröschen und Libellen – kostet nichts.',
  pokal_silber: 'Ehrennadel in Silber! Der Pokal passt in jede Ecke – kostet nichts.',
  pokal_gold: 'Ehrennadel in Gold! Der Gold-Pokal funkelt – kostet nichts.',
  freundesbank: 'Vier Herzen Freundschaft! Die Freundesbank mit Herzlehne passt in jede Ecke – kostet nichts.',
  freundschaftsbaum: 'Fünf Herzen Freundschaft! Am Freundschaftsbaum wachsen Herzen – kostet nichts.',
  schuett: 'Macht Wasser zu Land – auch im Meer direkt neben deinem Land. Aufziehen = Fläche.',
  seilbahn: 'Stell zwei Stationen auf, bis zu 20 Felder auseinander – gern über Wasser oder quer übers Dorf. Das Seil spannt sich von selbst.',
  wiese: 'Terraforming: Zieh über Wald, Felsen oder Strand – alles wird grüne Wiese.',
  parkrasen: 'Zieh eine Fläche auf und stell Deko darauf – ab 4 Feldern mit 3 Deko wird daraus eine Grünanlage, später Park und Stadtpark.',
  strand: 'Terraforming: Sandstrand, wo du willst. Häuser und Wege gehen darauf wie auf Wiese.',
  wald: 'Terraforming: Pflanz dir Wald, wo du Holzfäller haben willst.',
  obstwald: 'Terraforming: Wilde Obstbäume – dort gedeihen Obstplantagen.',
  fels: 'Terraforming: Felsen für Steinbrüche – oder einfach als Landschaft.',
};
// Läden, Kultur und Plantagen: Kurzwirkung und Tipp aus der Tabelle
for (const [id, S] of Object.entries(SHOPS)) {
  FX[id] = S.fx;
  ITEM_TIPS[id] = S.tip || (S.ware ? `Ins Dorf an den Weg – verdient an den Leuten im Viertel und verkauft ${RES[S.ware].name} aus dem Lager.`
    : S.attr ? 'Zieht Besucher auf die Insel – mit Bahn oder Schiff kommen sie. Viele verschiedene Läden im Viertel sind eine Innenstadt.'
    : 'Ins Dorf an den Weg – verdient an den Leuten im Viertel. Viele verschiedene Läden im Viertel sind eine Innenstadt.');
}
for (const id of Object.keys(STANDS)) {
  FX[id] = '🧺 Marktplatz';
  ITEM_TIPS[id] = 'Leg einen Platz aus Wegen (als Block ziehen) und stell Stände drauf: ab 3 ist es ein Marktplatz, ab 6 ein Wochenmarkt, ab 9 ein Großer Markt. Brunnen, Statuen und Pavillons dürfen mit auf den Platz.';
}
Object.assign(FX, { kaffeeplantage: '☕ Kaffee', teegarten: '🍵 Tee', kakaoplantage: '🍫 Kakao' });
Object.assign(ITEM_TIPS, {
  kaffeeplantage: 'Nur auf fernen Inseln: Kaffee für die Cafés – per Lager, keine Straße nötig.',
  teegarten: 'Nur auf fernen Inseln: Tee für Teeläden und Bubble Tea.',
  kakaoplantage: 'Nur auf fernen Inseln: Kakao für Konditorei und Chocolaterie.',
});
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
// Preise der Laternen (Taler je Stufe): steigen mit der Reihenfolge der Inseln – Ziel: Laternenfest nach etwa
// 10 Stunden. Das Material aus LM_STAGES wächst mit (LM_MAT_MUL).
const LM_PRICE = {
  baum: [50, 150, 600], obsthain: [400, 2000, 8000], klippe: [3000, 12000, 50000], ruine: [20000, 80000, 300000],
  erzberg: [100000, 400000, 1500000], quelle: [500000, 2000000, 6000000], kristall: [2000000, 8000000, 25000000],
};
const LM_MAT_MUL = { baum: 1, obsthain: 1.5, klippe: 2, ruine: 3, erzberg: 4, quelle: 6, kristall: 8 };
const LM_STAGES = {
  baum: [
    { name: 'Freischneiden', cost: { money: 50, holz: 10 }, unlock: ['saege'],
      diary: 'Unter diesem Baum haben wir jeden Sommer getanzt. Schön, dass wieder jemand hier ist. Im Wald liegt bestimmt noch meine alte Säge …' },
    { name: 'Bank-Ring', cost: { money: 150, bretter: 8 }, unlock: ['parkrasen', 'weg:platten'],
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
    text: 'Wilde Apfel- und Kirschbäume – Obst für Plantagen und Bäckereien.', need: { lanterns: 1, pop: 25, money: 1500 } },
  { id: 'wind', name: 'Windinsel', lm: 'klippe', icon: '🌬️', deg: 124, ter: 'fels',
    text: 'Felsen und windige Wiesen – Stein für Pflastersteine, Wind für Mühlen.', need: { lanterns: 3, pop: 40, money: 10000 } },
  { id: 'ruine', name: 'Ruineninsel', lm: 'ruine', icon: '🏛️', deg: 176, ter: 'ruine',
    text: 'Alte Mauern im Gras – hier beginnt die Bildung: Schule, Bibliothek, Kunst.', need: { lanterns: 5, pop: 60, money: 60000 } },
  { id: 'erz', name: 'Erzinsel', lm: 'erzberg', icon: '⛏️', deg: 228, ter: 'erz',
    text: 'Ein Berg voller Erz – Metall für Laternen, Werkzeug und Maschinen.', need: { lanterns: 8, pop: 90, money: 300000, science: 50 } },
  { id: 'quelle', name: 'Quelleninsel', lm: 'quelle', icon: '♨️', deg: 280, ter: 'quelle',
    text: 'Warme Quellen und Teiche – schön zum Wohnen, Gäste kommen gern.', need: { lanterns: 11, pop: 130, money: 1500000, science: 150 } },
  { id: 'kristall', name: 'Kristallinsel', lm: 'kristall', icon: '💎', deg: 332, ter: 'kristall',
    text: 'Leuchtende Kristalle im Fels – Kristall 💎 für Glas und Kristall-Deko. Nur wer viel weiß, findet den Weg.', need: { lanterns: 14, pop: 160, money: 5000000, science: 600 } },
];
const ISLE_BY_ID = Object.fromEntries(ISLES.map(i => [i.id, i]));
const ISLE_OF_LM = Object.fromEntries(ISLES.map(i => [i.lm, i]));
for (const i of ISLES) {
  i.cx = ISLAND.cx + Math.cos(i.deg * Math.PI / 180) * ISLE_DIST;
  i.cy = ISLAND.cy + Math.sin(i.deg * Math.PI / 180) * ISLE_DIST;
}
// Welt (für Kamera, Zeichnen, Seewege): anfangs Heimatinsel und Themen-Inseln; sie wächst mit (growWorld, Block 27)
const WORLD_BASE = { cMin: Math.floor((ISLAND.cx - ISLE_DIST - ISLE_R - 4) / CHUNK), cMax: Math.ceil((ISLAND.cx + ISLE_DIST + ISLE_R + 4) / CHUNK) };
const WORLD = { ...WORLD_BASE, R: ISLE_DIST + ISLE_R };
// Ferne Inseln (Block 27c): nach dem Laternenfest zufällig erzeugt, im Spielstand gespeichert (state.far)
const FAR = [];
const DIARY_START = 'Liebe Nachfolgerin, lieber Nachfolger: Die Insel schläft nur. Weck sie auf – Laterne für Laterne. Fang am besten beim alten Baum an.';
const DIARY_FINALE = 'Der Leuchtturm brennt wieder. Heute Nacht feiern wir das Laternenfest – so wie früher. Danke. Die Insel gehört jetzt dir.';


// Forschung (Seite „Wissen“, bezahlt mit Ideen 💡) in drei Stufen: 1 braucht eine Schule, 2 eine Bibliothek,
// 3 eine Universität. Das Aussehen (Farben, Wege-Stile, Deko) gibt es auf der Seite „Kunstakademie“ (DESIGN).
// Stufen-Forschung (endlos, ab der Bibliothek): jede Stufe +5 %, jede nächste 1,5× teurer
const MASTERY = [
  { id: 'taler', icon: '🪙', name: 'Handelskunst', text: 'auf alle Einnahmen' },
  { id: 'rohstoffe', icon: '🪵', name: 'Werkzeugbau', text: 'auf Rohstoffe und Waren' },
  { id: 'strom', icon: '⚡', name: 'Energietechnik', text: 'auf allen Strom' },
  { id: 'einwohner', icon: '👥', name: 'Stadtplanung', text: 'Einwohner' },
  { id: 'schoen', icon: '🌸', name: 'Gartenkunst', text: 'Schönheit' },
];
const MASTERY_STEP = 0.05, MASTERY_BASE = 3000, MASTERY_GROW = 1.5;
// Erfindungen (nur für Ideen, ab der Universität): besondere Dinge, wenn alles andere erforscht ist
const INVENTIONS = [
  { id: 'ballon', icon: '🎈', name: 'Heißluftballon', cost: 25000, text: 'Bunte Ballons schweben über deinem Dorf – nachts leuchten die Brenner.' },
  { id: 'feuerwerk', icon: '🎆', name: 'Feuerwerk', cost: 50000, text: 'Im Rathaus kannst du ein Feuerwerk zünden, so oft du willst – nachts am schönsten.' },
  { id: 'seilbahn', icon: '🚡', name: 'Seilbahn', cost: 100000, text: 'Schaltet Seilbahn-Stationen frei: Zwei Stationen verbinden sich mit einem Seil, die Gondeln schweben hin und her.' },
  { id: 'zeppelin', icon: '🛸', name: 'Zeppelin', cost: 150000, text: 'Ein Zeppelin mit deiner Flagge zieht gemächlich seine Runden über die Insel.' },
];
const TECH_TIERS = [null, { b: 'schule', name: 'Schule' }, { b: 'bibliothek', name: 'Bibliothek' }, { b: 'uni', name: 'Universität' }];
const TECHS = [
  { id: 'duenger', tier: 1, name: 'Dünger', cost: 20, desc: 'Felder bringen 50 % mehr.' },
  { id: 'axt', tier: 1, name: 'Scharfe Äxte', cost: 30, desc: 'Holzfäller liefern 30 % mehr Holz.' },
  { id: 'netze', tier: 1, name: 'Fischernetze', cost: 30, desc: 'Fischerhütten bringen 30 % mehr.' },
  { id: 'handel', tier: 1, name: 'Handel', cost: 50, desc: 'Schaltet die Marktstände frei – für deinen Marktplatz.' },
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
  { id: 'schiffbau', tier: 3, name: 'Schiffbau', cost: 300, req: ['seehandel'], desc: 'Jeder Hafen bringt 12 % statt 8 % auf die Einnahmen der Betriebe (bis zu 3 Häfen).' },
  { id: 'bohrung', tier: 3, name: 'Tiefbohrung', cost: 300, req: ['tiefbau'], desc: 'Bergwerke überall, nicht nur auf Erzadern.' },
  { id: 'sterne', tier: 3, name: 'Sternkunde', cost: 400, desc: 'Alle Ideen 20 % mehr.' },
  { id: 'terraform', tier: 2, name: 'Terraforming', cost: 200, desc: 'Gelände selbst gestalten: Wald und Obstbäume pflanzen, Felsen setzen, Wiese und Strand anlegen (unter Gelände).' },
  { id: 'rotor', tier: 2, name: 'Leichte Rotorblätter', cost: 160, lm: 'klippe:3', desc: 'Windräder liefern 50 % mehr Strom.' },
  { id: 'kraftwerk2', tier: 2, name: 'Größere Kraftwerke', cost: 250, lm: 'klippe:3', desc: 'Alle Kraftwerke lassen sich auf Stufe 2 ausbauen (doppelt so viel Strom).' },
  { id: 'kraftwerk3', tier: 3, name: 'Hochleistungs-Kraftwerke', cost: 600, req: ['kraftwerk2'], desc: 'Alle Kraftwerke lassen sich auf Stufe 3 ausbauen (dreimal so viel Strom).' },
  { id: 'wasserkraft', tier: 2, name: 'Wasserkraft', cost: 180, desc: 'Schaltet das Wasserkraftwerk frei: Strom aus Teichen und Flüssen.' },
  { id: 'wellen', tier: 3, name: 'Wellenkraft', cost: 380, req: ['wasserkraft'], desc: 'Schaltet das Wellenkraftwerk frei: Strom aus dem Meer.' },
  { id: 'offshore', tier: 3, name: 'Offshore-Windkraft', cost: 500, req: ['rotor'], desc: 'Schaltet das Offshore-Windrad frei: 6 ⚡ aus dem Wind über dem Meer.' },
  { id: 'stromnetz', tier: 3, name: 'Intelligentes Stromnetz', cost: 450, req: ['rotor'], desc: 'Alle Kraftwerke liefern 25 % mehr Strom.' },
];
const TECH_BY_ID = Object.fromEntries(TECHS.map(t => [t.id, t]));

// Stile für Wege: Kiesweg (id 'sand') von Anfang an, die anderen einzeln in der Kunstakademie (design = Preis in Talern)
// oder als Geschenk einer Sehenswürdigkeit (lm)
// Alle Wege sind so breit wie der Kiesweg (30.09.: vorher füllten Platz-Stile das ganze Feld). Plätze entstehen,
// wenn man Wege als Block nebeneinander legt – dann wachsen sie zu einer Fläche zusammen (pathQuads).
const STYLES = {
  weg: [
    { id: 'sand', name: 'Kiesweg', col: '#eadbb2', shape: 'band' },                  // 30.09.: Sand und Kies sind eins
    { id: 'mulch', name: 'Erde', col: '#8b5e3c', shape: 'band', design: 40 },
    { id: 'platten', name: 'Schachbrett', col: '#e6dfd0', shape: 'band', lm: 'baum:2' },
    { id: 'asphalt', name: 'Asphalt', col: '#9e988e', shape: 'band', design: 200 },
    { id: 'tritt', name: 'Trittsteine', col: '#cfcac0', shape: 'band', design: 120 },
    { id: 'kopf', name: 'Kopfstein', col: '#cfc8bb', shape: 'band', lm: 'quelle:2' },
    { id: 'klinker', name: 'Klinker', col: '#c97a5e', shape: 'band', design: 180 },
    { id: 'terrakotta', name: 'Terrakotta', col: '#d99a73', shape: 'band', design: 180 },
    { id: 'konfetti', name: 'Konfetti', col: '#f6dce6', shape: 'band', design: 300 },
    { id: 'fisch', name: 'Fischgrät rosé', col: '#ecccc2', shape: 'band', design: 350, master: true },
    { id: 'blueten', name: 'Blütenpfad', col: '#f7dbe4', shape: 'band', lm: 'obsthain:3' },
    { id: 'kristall', name: 'Kristallweg', col: '#bfe6f7', shape: 'band', lm: 'kristall:3' },
    { id: 'regenbogen', name: 'Regenbogenweg', col: '#f7c6d8', shape: 'band', album: 'farben' },
    { id: 'goldpflaster', name: 'Goldpflaster', col: '#f3d27a', shape: 'band', album: 'wege' },
  ],
  // Linien (Block 41): der erste Stil ist frei, die anderen in der Kunstakademie (design) oder mit dem Ort (lm)
  hecke: [
    { id: 'niedrig', name: 'Niedrige Hecke', col: '#5aa84f' },
    { id: 'hoch', name: 'Hohe Hecke', col: '#3f8f43', design: 60 },
    { id: 'buchs', name: 'Buchs', col: '#2f7a3a', design: 90 },
    { id: 'bluete', name: 'Blütenhecke', col: '#f28cb1', design: 140 },
    { id: 'lichter', name: 'Hecke mit Lichterkette', col: '#ffe58a', design: 200 },
    // Wilmerhecke (Block 86): kleine runde Büsche dicht an dicht – gleich frei, auch mit Blüten oder Lichterkette
    { id: 'wilmer', name: 'Wilmerhecke', col: '#5aae54' },
    { id: 'wilmer_bluete', name: 'Wilmerhecke mit Blüten', col: '#f28cb1' },
    { id: 'wilmer_licht', name: 'Wilmerhecke mit Lichterkette', col: '#ffe58a' },
  ],
  zaun: [
    { id: 'latten', name: 'Lattenzaun', col: '#c98d5c' },
    { id: 'staketen', name: 'Weißer Staketenzaun', col: '#fbf7ef', design: 60 },
    { id: 'weide', name: 'Weidenflecht', col: '#a07850', design: 80 },
    { id: 'gitter', name: 'Metallgitter', col: '#9aa3ad', design: 100 },
    { id: 'eisen', name: 'Schmiedeeisen', col: '#3e3e4a', design: 160 },
    { id: 'glas', name: 'Glas', col: '#bfe6f7', design: 250, master: true },
    { id: 'lichter', name: 'Zaun mit Lichterkette', col: '#ffe58a', design: 180 },
  ],
  mauer: [
    { id: 'backstein', name: 'Backstein', col: '#b5654a' },
    { id: 'trocken', name: 'Trockenmauer', col: '#c9bfa8', design: 80 },
    { id: 'naturstein', name: 'Naturstein', col: '#a9a49a', design: 100 },
    { id: 'klinker', name: 'Klinker', col: '#84402f', design: 120 },
    { id: 'terrakotta', name: 'Terrakotta', col: '#d99a73', design: 120 },
    { id: 'kopf', name: 'Kopfstein', col: '#a89a86', lm: 'quelle:2' },
    { id: 'laternen', name: 'Mauer mit Laternen', col: '#ffe58a', design: 220 },
  ],
};
for (const [kind, list] of Object.entries(STYLES)) for (const st of list) st.kind = kind;
const EDGE_TOOLS = new Set(['hecke', 'zaun', 'mauer']);
// Torbögen über Durchgängen (Block 41): Durchgang antippen und wählen; beleuchtete Stile (Lichter brauchen Strom wie Laternen)
const ARCHES = {
  bogen: { name: 'Torbogen', icon: '⛩️', cost: 80, beauty: 3 },
  rosen: { name: 'Rosenbogen', icon: '🌹', cost: 150, beauty: 6 },
};
// An der Mauer ist der „Torbogen“ ein Paar hoher Torpfeiler mit Steinkugeln (kein Bogen), an der Hecke ein grüner Rankbogen
const archLabel = (b, id) => id !== 'bogen' ? `${ARCHES[id].icon} ${ARCHES[id].name}` : b === 'mauer' ? '🏛️ Torpfeiler' : b === 'hecke' ? '🌿 Rankbogen' : `${ARCHES[id].icon} ${ARCHES[id].name}`;
const EDGE_LIT = new Set(['hecke:lichter', 'hecke:wilmer_licht', 'zaun:lichter', 'mauer:laternen']);
const styleDef = (kind, id) => STYLES[kind].find(st => st.id === id) || STYLES[kind][0];
const chosenStyle = { weg: 'sand', hecke: 'niedrig', zaun: 'latten', mauer: 'backstein' };
const wegShape = { wide: false, sq: false };      // Form neuer Wege (Block 77): ganz breit, eckige Kurven – Schalter in der Musterleiste


const WALLS = ['#fff4dc', '#ffe3e0', '#e4f1ff', '#f0ffe0', '#fdeaff', '#fff0b8', '#e6e0ff',
               '#ffd1b3', '#c9f0e4', '#ffe066', '#d8c3a5', '#b8d8ff', '#ffc2d9', '#f5f5f5'];
const ROOFS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1', '#6b7a8f',
               '#2f9e9e', '#8b5a3c', '#3c4a6b', '#d94f8a', '#7cb342', '#ff8a3d', '#4a4a58'];
// Kunstakademie: alles zum Aussehen einzeln freischalten (Preis in Talern). Die ersten drei Wand- und Dachfarben
// und der Kiesweg sind von Anfang an da; master = braucht eine gebaute Kunstakademie.
const FREE_COLORS = 3;
// Buschfarben (Block 89): für den kleinen Busch, seine Größen und die Wilmerhecke. Grüntöne gleich frei, Herbst und Bunt in der
// Kunstakademie. c: Grundton, Schattenseite, Krone, Glanzlicht (wie der Deko-Busch)
const BUSH_COLS = [
  { id: 'gruen', name: 'Grün', c: ['#5aae54', '#4a944a', '#62b85a', '#86d37c'] },
  { id: 'hell', name: 'Hellgrün', c: ['#7cc463', '#66ad52', '#8bd170', '#b2e69c'] },
  { id: 'dunkel', name: 'Dunkelgrün', c: ['#3f8a45', '#33743a', '#4a964e', '#6db070'] },
  { id: 'blau', name: 'Blaugrün', c: ['#4f9e86', '#3f8673', '#5aab91', '#86cbb5'] },
  { id: 'oliv', name: 'Olivgrün', c: ['#8a9a4a', '#74843c', '#98a855', '#bccb7c'] },
  { id: 'rot', name: 'Ahornrot', c: ['#d0583f', '#b04532', '#dc6a4c', '#f29a7c'], design: 120 },
  { id: 'orange', name: 'Herbstorange', c: ['#e8893a', '#c9712c', '#f09a4a', '#f8c07c'], design: 120 },
  { id: 'gold', name: 'Goldgelb', c: ['#e2bd3a', '#c4a12c', '#ecc94e', '#f6e08c'], design: 120 },
  { id: 'rosa', name: 'Rosa', c: ['#e88fb4', '#cf759b', '#f09fc1', '#f9cde0'], design: 160 },
  { id: 'lila', name: 'Blutbuche', c: ['#8a4f7a', '#723f65', '#9a5c89', '#c08bb2'], design: 160 },
  { id: 'weiss', name: 'Weiß bereift', c: ['#cfe0d6', '#aac2b5', '#dfece4', '#ffffff'], design: 160 },
];
const DESIGN = [
  ...WALLS.map((col, i) => ({ id: 'wall:' + i, group: 'Wandfarben', col, name: 'Wandfarbe ' + (i + 1), price: i < FREE_COLORS ? 0 : 50 + i * 20, master: i >= 11 })),
  ...ROOFS.map((col, i) => ({ id: 'roof:' + i, group: 'Dachfarben', col, name: 'Dachfarbe ' + (i + 1), price: i < FREE_COLORS ? 0 : 50 + i * 20, master: i >= 11 })),
  ...BUSH_COLS.filter(c => c.design).map(c => ({ id: 'busch:' + c.id, group: 'Büsche', col: c.c[0], name: c.name, price: c.design })),
  ...STYLES.weg.filter(st => st.design).map(st => ({ id: 'weg:' + st.id, group: 'Wege', col: st.col, name: st.name, price: st.design, master: !!st.master })),
  ...['hecke', 'zaun', 'mauer'].flatMap(kind => STYLES[kind].filter(st => st.design).map(st => ({ id: kind + ':' + st.id, group: { hecke: 'Hecken', zaun: 'Zäune', mauer: 'Mauern' }[kind], col: st.col, name: st.name, price: st.design, master: !!st.master }))),
  ...['laterne', 'pavillon', 'statue'].map(b => ({ id: b, group: 'Deko', name: ITEMS[b].name, item: b, price: ITEMS[b].design, master: !!ITEMS[b].master })),
];
const DESIGN_BY_ID = Object.fromEntries(DESIGN.map(d => [d.id, d]));
const FLAG_COLORS = ['#e8705f', '#5f8fe8', '#58b36a', '#e9a23b', '#b07ad6', '#f28cb1'];
const FLAG_SYMBOLS = ['🐟', '🌻', '🍎', '⭐', '🐚', '🌙', '🍄', '🐝', '🦊', '⚓'];
const TERRAIN_NAMES = { grass: 'Wiese', forest: 'Wald', rock: 'Fels', water: 'Wasser', erz: 'Erzader', obst: 'Wilder Obsthain', kristall: 'Kristallfels' };

// Preise nach Einkommen (Block 60, 61, 63): fzMin / incMin Minuten Einkommen beim Bezugseinkommen (incRef, Einkommen des
// normalen Bots aus Block 62, wenn das Ding frei wird). Darüber wächst der Preis nur mit der Wurzel (incScaled): wer mehr
// verdient, wartet kürzer, das Ding wird aber nie Kleingeld. Der feste Preis bleibt Untergrenze (baseCost).
// Wer so ein Ding baut, merkt sich den Preis (t.price) fürs Erstatten. Steht am Ende, damit auch Größen-Varianten mitkommen.
const INC_MIN = { hbf: [2, 1500], uni: [3, 2000], moebelhaus: [3, 1000], kino: [4, 1200], hotel: [4, 1200], markthalle: [5, 1250],
  kaffeeplantage: [3, 2300], teegarten: [3, 2300], kakaoplantage: [3, 2300], chocolaterie: [5, 2300], passage: [12, 2300], kaufhaus: [15, 2300],
  theater: [15, 2300], museum: [15, 2300], konzerthalle: [18, 2300], aquarium: [20, 2300], zoo: [20, 2300], grandhotel: [25, 2300], stadion: [30, 2300] };
const FZ_REF = 2300;                                                    // Freizeitpark: nach dem Fest
for (const [id, [m, ref]] of Object.entries(INC_MIN)) if (ITEMS[id]) Object.assign(ITEMS[id], { incMin: m, incRef: ref });
const incMinOf = d => d.fzMin || d.incMin || 0;
for (const id of Object.keys(ITEMS)) if (incMinOf(ITEMS[id])) {
  const d = ITEMS[id], base = d.baseCost = d.cost;                      // baseCost: Erstatten bei Ständen ohne t.price
  if (!d.incRef) d.incRef = FZ_REF;
  Object.defineProperty(d, 'cost', { get: () => (typeof incScaled === 'function' && typeof niceRound === 'function' ? niceRound(Math.max(base, incScaled(incMinOf(d), d.incRef))) : base), enumerable: true, configurable: true });
}
