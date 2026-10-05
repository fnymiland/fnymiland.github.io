# Kachelhausen – Aufgaben

Rückmeldungen des Nutzers, in Blöcken abgearbeitet. `[x]` = erledigt (lokal), hochgeladen wird nur auf Zuruf.

## Block 1 – Fehler und Kleinigkeiten (29.09.2026)

- [x] **Fischerhütte** dreht sich beim Setzen zum Wasser (nicht zum Weg); Hafen ebenso.
- [x] **Fischerhütte, Bedingung Wasser:** zählt nicht mehr nur die 8 Nachbarfelder, sondern das ganze angeschlossene
      Gewässer (≥ 4 Felder) – so gehen auch schmale, lange Flüsse.
- [x] **Grafikfehler:** Der Markt (und andere große Gebäude) überdeckt Bäume/Häuser, die vorn neben ihm stehen.
- [x] **Schilder** der Sehenswürdigkeiten (Heiße Quelle, Alte Ruine, Erzberg, Windige Klippe) sitzen verrutscht.
- [x] **Obstplantage:** Bäume sind kleiner als normale Obstbäume – unlogisch.
- [x] **Rathaus verschieben:** muss sichtbar gehen – „Verschieben“-Knopf im Infofenster jedes Gebäudes.

## Block 1b – nachgereicht

- [x] **Preise in der Leiste blinkten rot** (Umschalten bei jeder Aktualisierung) – behoben.
- [x] **Kein Einsammeln im Hintergrund:** Geld, Material und Ideen entstehen nur, während man spielt.

## Block 2 – Bedienung

- [x] **Schnellzugriff** auf Ansehen, Weg, Verschieben und Abreißen (ohne erst Kategorie → Werkzeug), plus Tastenkürzel.

## Block 2b – Wege

- [x] **Breite Wege:** Zwei Wege nebeneinander ergeben einen doppelt so breiten Weg (statt zwei schmaler Bänder).

## Block 3 – Aussehen und Rathaus

- [x] **Alle Gebäude im Aussehen änderbar** (Wand-/Dachfarbe wie bei Häusern: Bäckerei, Hafen, Schule …).
- [x] **Rathaus mit mehr Funktionen:** Reiter Übersicht (Einwohner, Einnahmen, Lager, Laternen), Bereit (✨/💭 mit „Hin“), Wünsche (was fehlt wie oft), Ort (Name, Flagge, Rathausfarben, verschieben)

## Block 4 – Sehenswürdigkeiten 3×3

- [x] Alle Sehenswürdigkeiten **3×3**, damit ein Weg mittig darauf zulaufen kann (alte Stände rücken einmalig).
- [x] **Park 3×3** (statt 2×2).

## Block 5 – besprochen, wird gebaut (Details in KONZEPT.md)

- [x] **5a Themen-Inseln:** Heimatinsel ganz, 7 Inseln mit Sehenswürdigkeit in der Mitte, nacheinander erschließen
      (Taler, Ideen, Ansehen), Führung „welche Insel als Nächstes“, alte Stände ziehen um.
- [x] **5b Forschung mit Seiten**, Kunstakademie-Seite, Farben und Wege-Stile einzeln freischalten, langsamer.
- [x] **5c Zug** zwischen den Dörfern – entschieden: Schienen als Brücke übers Wasser *oder* aufschütten und an Land legen
      (wie der Spieler will); Bonus für beide Orte; Forschung „Eisenbahn“ passend zur Erzinsel, Schienen brauchen Holz und
      Metall; **elektrisch** (keine Dampflok) – Strom von Windrädern.

## Block 6 – Rückmeldung vom 29.09. abends

- [x] **Überall bauen nach Forschung:** Obstplantage nur im Obsthain, Holzfäller nur im Wald usw. – per Forschung überall
      („Höhere Agrartechnik“, Forstwirtschaft, …).
- [x] **Alte Ruine und Erzberg schöner** und mehr nach dem, was sie sind (Erzberg sieht aus wie …).
- [x] **Wege:** alle abgerundet (auch Plätze), Pastell-Mosaik + Mosaik zu einem Stil (eher „Konfetti“), schönere Übergänge
      zwischen verschiedenen Wegtypen, Trittsteine ohne Lücken, Stil-Leiste nicht breiter als der Bildschirm.
- [x] **Mehrere kleine Dekos auf einem Feld** – auch der Baum (Baum, Blumentopf, Busch, Bank).
- [x] **Kristall-Deko mit Sinn:** Kristall 💎 ist ein Rohstoff (Kristallfelsen + Kristallmine auf der Kristallinsel);
      daraus Kristall-Laterne, Glaskugel, Kristallbrunnen, Glashaus (Deko, leuchten nachts) und die **Glasvilla**
      als Hausstufe 6 (Wunsch: Blick aufs Wasser).
- [x] **Alles aktualisiert sich live:** offene Fenster (Sehenswürdigkeit, Gebäude, Insel, Forschung, Rathaus) werden
      grün, sobald man sich etwas leisten kann – ohne neu anzuklicken.
- [x] **Namensschilder** einiger Sehenswürdigkeiten sitzen noch verschoben.

## Ursprüngliche Notizen zu Block 5

- [ ] **Themen-Inseln:** Jede Sehenswürdigkeit ist Mittelpunkt einer eigenen Insel (Obsthain-Insel voller Obst,
      Erzberg-Insel voller Stein/Erz …). Man baut dort thematisch eigene Dörfer; ein **Zug** verbindet die Dörfer.
- [ ] **Belohnungen, Freischalten, Forschung überarbeiten:** Man bekommt zu schnell zu viel, es gibt zu wenig zum
      Freischalten. Haus- und Dachfarben (und Farben aller Gebäude) sollen freigeschaltet statt geschenkt werden.

## Block 7 – Rückmeldung vom 30.09.

- [x] **Rathaus:** Im Reiter „Bereit“ direkt ausbauen/restaurieren (grau, bis Taler/Material reichen – wird live grün).
- [x] **Rathaus als Zentrale:** Reiter „Inseln“ (Stand, Gebäude, Einwohner, 🚆, per Knopf hin/erschließen), Schnellknöpfe
      zu Forschung, Kunstakademie, Tagebuch, nächster Insel; Laternen mit „Hin“.
- [x] **Reetdachhaus:** Dachfarbe lässt sich ändern (Reet in der gewählten Farbe).
- [x] **Schilder verrutscht (Safari):** Text wird selbst zentriert (`centerText`); Schilder gesperrter Inseln schweben
      über der Sehenswürdigkeit statt an einem Pfahl im Berg.
- [x] **Natur räumt sich weg:** Bauen auf Wald/Obsthain/Fels/Erz/Kristallfels rodet bzw. sprengt automatisch (Kosten wie
      von Hand, in der Vorschau); Betriebe behalten ihr Gelände, Selbstgebautes wird nie weggeräumt.
- [x] **Geldanzeige oben** ohne Kommazahlen.
- [x] **Baumenü Variante B:** Bauen (Filter: Alle, Wohnen, Geld, Rohstoffe, Verstärker, Bildung) · Verschönern ·
      Verbinden · Gelände; jedes Gebäude in genau einer Gruppe; Wirkung auf jeder Karte.
- [x] **Bahnübergänge:** Weg über gerade Schiene (oder Schiene über Weg) = Übergang mit Schranken (senken sich beim Zug,
      nachts rotes Blinken, Bewohner warten); im Infofenster zur Bogenbrücke umbaubar (einmal 🪙 60 🪚4 🔩2; flacher Holzbogen über zwei Felder, Bewohner gehen darüber).

## Block 8 – Motivation und Anleitung (30.09.)

Entschieden: Erfolge (Stufen wie 1 Mio./10 Mio. Taler, 10.000 Einwohner, 20 km Bahn …), Sammelalbum, große Bauprojekte;
„Neu freigeschaltet“ als Fenster in der Mitte; Tipps beim ersten Mal und ein Tipp-Buch im Menü.

- [x] **Neu freigeschaltet:** Fenster bei jeder Freischaltung (Laterne, Forschung, Kunstakademie, Geschenk-Wegstile,
      Glasvilla) mit Bild, Wirkung, Tipp und „Ausprobieren“ (springt in die richtige Gruppe der Leiste).
- [x] **Tipps beim ersten Mal** (16 Themen, einer nach dem anderen, nicht in der Einführung, abschaltbar) + **Tipp-Buch** im Menü und im Rathaus.
- [x] **Erfolge** (17, mit Stufen): Sterne → Ehrennadeln Bronze/Silber/Gold → Pokale als Deko; Band oben, Rathaus-Reiter „Erfolge“.
- [x] **Sammelalbum** (6 Seiten: Gebäude, Deko, Hausformen, Farben, Wegstile, Bewohner) – je volle Seite eine Belohnung: Denkmal, Rosenbogen, Uhrturm, Regenbogenweg, Goldpflaster, Karussell.
- [x] **Große Bauprojekte:** Riesenrad, Sternwarte, Seebrücke, Botanischer Garten und das Schloss als Finale nach dem Laternenfest – Baustelle, Abschnitt für Abschnitt, Wirkung erst fertig.

## Block 9 – Rückmeldung vom 30.09. abends

Entschieden: Leiste oben schlank + 📦-Lager-Knopf; Strom nach Streckenlänge **und** für die Stadt (Fabrik, Laternen …);
zweiter Zug selbst kaufen (nur Rundkurs, je 2 km einer); Wunderwerke als Langzeitziel (~1 Std., Schloss mehrere Std.).

**9a Wege und Brücken**
- [x] Verschiedene Wegstile stoßen **bündig** aneinander (kein Strich, kein Überblenden – einer hört auf, der nächste beginnt).
- [x] Bahnübergang (Schranken) zeigt das **Muster** des Wegs, nicht nur die Farbe.
- [x] Fußgängerbrücke **breiter** und im Design wählbar: Stein, Kristall, farbig (wie die Wege).

**9b Bahn und Strom**
- [x] Rundkurs: Zug fährt **im Kreis** statt hin und her.
- [x] Zweiter Zug auf großen Kreisen (Knopf „+ Zug“, eigenes Aussehen, eigener Strom).
- [x] Strom: Zug braucht mehr, je länger die Strecke; auch die Stadt braucht Strom (Fabrik, Laternen …).

**9c Wunderwerke imposant**
- [x] Größen: Riesenrad 5×5, Sternwarte 3×3, Botanischer Garten 5×5, Schloss 7×7 (Seebrücke bleibt).
- [x] Viel teurer (Langzeitziel, viele Rohstoffe); Wege darin in normaler Kachelgröße.

**9d Aussehen**
- [x] Alte Ruine: voll ausgebaut wieder ein **Amphitheater**.
- [x] Dächer unterscheidbar: Bäckerei, Schule, Kunstakademie … sehen von oben anders aus als Wohnhäuser.

**9e Oben aufräumen**
- [x] Leiste oben schlank: Rathaus, Geld (glatt, ohne Komma), Einwohner, Ideen, 📦 Lager, Menü.
- [x] „Nicht dein Grundstück“ am Rand verschwindet, wenn das Nachbarstück schon dir gehört.
- [x] Karte ziehen, während man einen Weg o. Ä. in der Hand hat: rechte/mittlere Maustaste, Leertaste oder Ctrl.

## Block 10 – Strom ausbauen (30.09. abends)

Entschieden: „⚡ Strom“ als Filter unter Bauen; Windrad mit Ausbaustufen **und** Forschung; alle vier Kraftwerke;
zusätzlich brauchen Riesenrad, Hafen, Sägewerk, Sternwarte, Universität, Glashaus und Botanischer Garten Strom.

- [x] **10a Menü:** Filter „⚡ Strom“ unter Bauen (Windrad raus aus „Verbinden“), Verstärker-Symbol ändern.
- [x] **10b Windrad:** Stufen Windrad (1 ⚡) → Großes Windrad (2 ⚡) → Windturbine (4 ⚡); Forschung „Leichte Rotorblätter“
      (+50 % Wind, schaltet die Windturbine frei) und „Intelligentes Stromnetz“ (+25 % auf allen Strom).
- [x] **10c Kraftwerke:** Wasserkraftwerk (am Wasser, 4 ⚡, Forschung „Wasserkraft“), Solarfeld (2×2, Kristall, 3 ⚡),
      Geothermie (2×2, nur Quelleninsel, 8 ⚡), Wellenkraftwerk (ins Meer vor der Küste, 5 ⚡, Forschung „Wellenkraft“).
- [x] **10d Verbraucher:** Riesenrad 4 ⚡ (ohne: steht still, dunkel, halbe Taler), Botanischer Garten 3, Sternwarte 3,
      Universität 2, Hafen 2, Sägewerk 1, Glashaus 1 – ohne Strom jeweils nur halb.

## Block 11 – Wege aufräumen, Terraforming (30.09. abends)

- [x] Grafikfehler beim Platzieren (Rastermuster, z. B. Schachbrett): Vorschau eines Platzes neben anderen Wegen stürzte ab.
- [x] Wegstile: Platten heißt jetzt Schachbrett (das rosa Schachbrett entfällt), Holzbohlen entfallen, Kies + Sandweg =
      „Kiesweg“ (Aussehen vom Kies), Rindenmulch heißt Erde. Alte Wege werden umgestellt, bezahlte Stile erstattet.
- [x] Stil-Leiste: nur Kreise mit dem Muster des Wegs; der gewählte wird größer und zeigt den Namen.
- [x] Terraforming (Forschung, Stufe 2): unter Gelände Wiese, Strand, Wald pflanzen, Obstbäume pflanzen, Felsen setzen.
- [x] Monumente brauchen viel Strom: je 100 ⚡, Schloss 300 ⚡; alle Kraftwerke mit 3 Stufen (×1/×2/×3), jede Stufe erst
      erforschen („Größere Kraftwerke“, „Hochleistungs-Kraftwerke“); letzter Abschnitt jedes Wunderwerks ≥ 1 Mio. Taler.

## Block 12 – Forschung, die sich lohnt (30.09. abends)

Entschieden: viel teurer + steigend; endlose Stufen-Forschung (Taler, Rohstoffe, Strom, Einwohner, Schönheit, je +5 %);
Erfindungen nur für Ideen (Heißluftballon, Feuerwerk, Zeppelin, Seilbahn). Ideen oben glatt.

- [x] Ideen oben ohne Komma.
- [x] **12a Preise:** Stufe 1 ×5, Stufe 2 ×25, Stufe 3 ×80; jede erforschte Sache macht die nächste 10 % teurer.
- [x] **12b Stufen-Forschung:** Handelskunst, Werkzeugbau, Energietechnik, Stadtplanung, Gartenkunst – endlos, +5 % je Stufe,
      jede Stufe 1,5× teurer.
- [x] **12c Erfindungen:** Heißluftballon, Feuerwerk (im Rathaus zünden), Zeppelin, Seilbahn (Stationen zum Aufstellen).

## Block 13 – Preise für ein langes Spiel (30.09. abends)

Ziel (gemeinsam entschieden): Laternenfest nach etwa 10 Stunden, alles nach etwa 20. Stellschrauben: Kurve für Inseln
und Laternen, Hausausbau kostet Taler. (Bewusst nicht: „mehr vom Gleichen wird teurer“, Aufschläge deckeln.)

- [x] Laternen je Insel teurer (Heimatinsel 50/150/600 … Kristallhöhle 2/8/25 Mio.), Material wächst mit (`LM_PRICE`, `LM_MAT_MUL`).
- [x] Inseln 150 … 5 Mio.; Leuchtturm 15 Mio.
- [x] Hausausbau: Fachwerkhaus 100, Reetdach 600, Stadthaus 3.000, Villa 20.000, Glasvilla 100.000 Taler.
- [ ] Nach dem nächsten langen Spiel nachmessen und nachjustieren.

## Block 14 – Rückmeldung (30.09. abends)

- [x] ✨ erschien nach der Forschung über allen Kraftwerken (auch unbezahlbar) – jetzt nur, wenn der Ausbau bezahlbar ist.
- [x] Stil-Kreise waren oval (auf die Höhe des gewählten gestreckt) – wieder rund.
- [x] Lange Namen in den Kacheln (Kunstakademie, Wasserkraftwerk …) brechen um statt überzustehen.
- [x] Wohnen: Reihenhäuser (2×1, 10/20/30 👥), Baumhaus (im Wald), Hausboot (auf dem Wasser am Ufer), Ferienhäuschen
      (auf Sand am Wasser, Feriengäste bringen Taler) – je drei Stufen mit einfachen Bedingungen.
- [x] Alle Wege so breit wie der Kiesweg (Terrakotta & Co. füllten das ganze Feld); als Block gelegt werden sie zum Platz.

## Block 15 – Bedienung: Linie, Rechteck, mehrere Dinge verschieben (29.09. abends)

Entschieden: Linie mit einer Ecke (L-Form); Rechteck zeigt nach dem Loslassen eine Vorschau mit Anzahl und Preis und
wird erst per Klick/Tippen bestätigt (daneben = abbrechen); Rechteck auch bei Abriss, Weg-Fläche und kleiner Deko;
beim Verschieben zieht alles im Rechteck mit (Gebäude, Deko, Wege, Schienen) – das Gelände bleibt.

- [x] Vorab: Nachtlicht schien durch (Reihenhaus-Fenster durch die vorderen Häuser, Lichtschein über dem Laub des
      Baumhauses) – Lichter stanzen jetzt beim Zeichnen ein Loch, was davor steht deckt es zu. Reihenhaus-Fenster
      überlappten sich (auch tagsüber) – jetzt je Stockwerk eine saubere Reihe.
- [x] **15a Linie:** Weg und Schiene: Klick auf A, Maus zu G – Vorschau (gerade + eine Ecke) mit Preis, zweiter Klick
      baut. iPad: A antippen, G antippen (Vorschau), G nochmal antippen. Ziehen legt die Linie ebenfalls nur als Vorschau.
- [x] **15b Rechteck fürs Gelände:** Wiese, Strand, Wald, Obstbäume, Felsen, Teich graben, Aufschütten – gedrückt halten
      und aufziehen, Vorschau mit Anzahl/Preis, Klick hinein baut. Ein einzelner Klick wie bisher: ein Feld.
- [x] **15c Rechteck für Abriss, Weg-Fläche, kleine Deko:** Abriss zeigt, was wegkommt (und Erstattung/Rodungskosten);
      Weg aufziehen = Fläche; Deko = je Feld eine in derselben Ecke.
- [x] **15d Mehrere Dinge verschieben:** Rechteck aufziehen, alles darin (ganz drin) wird angehoben und zieht zusammen
      um; Sehenswürdigkeiten und Rathaus bleiben.

## Block 16 – Spielbar auf dem Handy (29.09. abends)

Entschieden: Leiste einklappbar (eine schmale Zeile, „Bauen“ & Co. öffnen den Katalog von unten, nach der Wahl klappt
er zu); Hoch- und Querformat; Infofenster in der unteren Hälfte (Querformat: rechts), die Karte rückt so, dass das
angetippte Gebäude sichtbar bleibt. **iPad und Desktop bleiben unverändert** – alles hängt an `body.phone`
(kürzere Bildschirmseite < 540 px).

- [x] **16a** Handy erkennen (`body.phone`, `body.phone-land`), Tests dafür.
- [x] **16b** Leiste einklappbar: unten nur Schnellwerkzeuge + Bereiche; Bereich antippen öffnet den Katalog (Filter +
      Kacheln als Raster), Wahl oder Tippen auf die Karte klappt ihn zu.
- [x] **16c** Kopf und Hinweis kompakt: Zielkasten nur eine Zeile, Hinweis nur Name + Preis.
- [x] **16d** Infofenster als untere Hälfte mit Griff (antippen = ganz hoch); Karte rückt das Gebäude ins Bild.
- [x] **16e** Querformat: Leiste flach, Katalog halbhoch, Infofenster rechts.
- [x] **16f** Feinschliff: alle Fenster, Schilder, Drehknopf, Stil-Leiste, Lager bei 375×812 und 812×375 nachsehen.

## Block 17 – Verkehr mit Fahrgästen: Züge (29.09. abends)

Entschieden: Nachfrage + Auslastung. Modell (Zahlen zum Nachjustieren in rules.js):
- Jeder Ort (Heimatinsel, jede Themen-Insel) hat **Einwohner** und **Anziehung**: Sehenswürdigkeit 40/80/150 je
  Stufe, Wunderwerke (Seebrücke 150, Sternwarte 200, Riesenrad 300, Botanischer Garten 350, Schloss 500), dazu die
  Schönheit des Orts / 10.
- Eine fahrende Linie verbindet Orte. **Pendler**: je Einwohner außerhalb des größten Orts der Linie ½ Fahrt/min.
  **Besucher** je Ort: so viele, wie er anzieht – höchstens ½ je Einwohner der anderen Orte der Linie.
- **Plätze**: jeder Wagen 60 Fahrgäste/min; Wagen anhängen kostet Taler + Metall und etwas mehr Strom; auf Rundkursen
  zusätzlich mehrere Züge. Zu wenig Plätze → „überfüllt“, nur der beförderte Anteil zählt.
- **Einnahmen**: Fahrkarten je Fahrgast, Besucher geben am Ziel Geld aus.
- **Anbindung**: Was im Viertel eines Bahnhofs oder bis 4 Felder davon steht, ist ans Dorf angebunden (kein 🐌) – so
  gut, wie die Linie ihre Fahrgäste schafft. Die alten Regeln (+8 Pendler je Bahnhof, +10 % für die Inseln) entfallen.

- [x] **17a** Anbindung über den Bahnhof (Monument drüben nicht mehr „weit weg“).
- [x] **17b** Einwohner und Anziehung je Ort; Nachfrage je Linie (Pendler + Besucher).
- [x] **17c** Plätze: Wagen je Zug (anhängen/abhängen), Strom je Wagen; Auslastung.
- [x] **17d** Einnahmen aus Fahrkarten und Besuchern; alte Pendler-/Bonus-Regel entfernen.
- [x] **17e** Anzeige: Bahnhof-Fenster (Fahrgäste, Plätze, Auslastung, Einnahmen, Tipp), „überfüllt“-Zeichen am Bahnhof,
      Verkehr im 📦 Lager.

## Block 18 – Schiffe (geplant)

Entschieden: Steg + Expedition (Reihenfolge wie bisher); Hafen mit Fähren, Handel, Kreuzfahrt, Fischkuttern.
- [x] **18a** Steg (von Anfang an, ins Meer an der Küste) mit Holzboot.
- [x] **18b** Expedition: Boot losschicken (Taler wie bisher, Laternen/Einwohner als Voraussetzung), es fährt sichtbar
      hinaus und kommt nach 1–10 Min zurück → Insel entdeckt, Tagebuch. Inseln nicht mehr per Schild freischalten.
- [x] **18c** Fähren zwischen Häfen (Fahrgäste wie der Zug, ohne Schienen und Strom; 100/180/260 Plätze je Hafen-Stufe).
- [x] **18d** Handel ab Handelshafen (Stufe 2): je 10 verkaufen/kaufen, Preise schwanken 60–140 % (Kaufen ×1,5),
      danach läuft ein Frachter aus.
- [x] **18e** Kreuzfahrt am Großen Hafen (Stufe 3): alle 6 Min legt ein Schiff an; Gäste bringen Geld nach der Anziehung
      bis 15 Felder um den Hafen.
- [x] **18f** Fischkutter: je Hafen-Stufe einer (🪙 +5/s je Kutter), ziehen vor dem Hafen ihre Kreise.

## Block 19 – Seilbahn als Verkehrsmittel (geplant)
- [x] Seilbahn befördert Fahrgäste wie eine kurze Linie (80 Plätze/min, ohne Strom, auch über Wasser), bindet an. Wer
      zwischen denselben Inseln fährt (Zug, Seilbahn, später Fähre), teilt sich die Fahrgäste nach Plätzen.

## Block 20 – Berge (später)
- [ ] Berge als Gelände, nur per Seilbahn erreichbar; oben Berghütte, Aussichtsturm, Gipfelkreuz als Attraktionen.

## Block 21 – Bedingungen und Windturbine (29.09. abends)

- [x] Bedingungen zählen Sorten: jedes Wohnhaus (Haus, Reihenhaus, Baumhaus, Hausboot, Ferienhaus) als „Haus“ – beim
      Ausbau (Markt, Kristallmine), bei Laufweite und Viertel, Deko neben Häusern, Bewohnern, Erfolg „Wohnhäuser“;
      Kristallbrunnen als Brunnen, Botanischer Garten als Park, Baumeister-Denkmal als Statue.
- [x] Windturbine (Windrad Stufe 3) nicht mehr riesig: so groß wie das Große Windrad, schlanker, mit Gondel und roten Spitzen.

## Block 22 – Rathaus (29.09. abends)

- [x] Rathaus 3×3 mit neuem Bild (Uhrturm, Platz mit Treppe, Laternen, Brunnen, Fahne); alte Stände wachsen, was weicht,
      gibt es voll zurück.
- [x] Rathaus „Bereit“: „Alles ausbauen“ oben, Gruppen wie das Bau-Menü mit „Alle ausbauen“; das Günstigste zuerst.

## Block 23 – Verkehr erforschen, Schiffe am Hafen, neuer Hafen (29.09. abends)

Entschieden: Forschungs-Reiter „🚢 Verkehr“ mit Schiffen und Zügen; Fähre fährt Hafen ↔ Steg (auf den anderen Inseln
reicht ein Steg); Liegeplätze je Hafen-Stufe (2/4/6), jedes Schiff einzeln kaufen mit Modell und Ziel; Hafen 4×3 mit
Kai und Pier, wächst mit den Stufen.

- [x] **23a** Forschung „Verkehr“: Schiffe (Holzfähre → Raddampfer → Motorfähre → Katamaran) und Züge (Straßenbahn →
      Regionalbahn → Triebwagen → Schnellzug); jedes Modell: eigenes Aussehen, Plätze, Tempo (Fahrgäste/min = Plätze ×
      Tempo). Was in alten Ständen schon fährt, bleibt erforscht.
- [x] **23b** Schiffe am Hafen: Liegeplätze 2/4/6, Schiff kaufen (Modell, Ziel: Steg oder Hafen auf einer anderen Insel),
      verkaufen, Ziel ändern; jedes Schiff fährt sichtbar; alte Fähren werden zu einer Holzfähre.
- [x] **23c** Hafen 4×3: Kai, Pier, Lagerhaus, Kran, Kisten; Stufe 2/3 mehr (zweiter Pier, großer Kran, Leuchtfeuer);
      Schiffe liegen am Pier. Alte Häfen wachsen (was weicht, gibt es voll zurück).

## Block 24 – Aufträge, Seewege, Kreuzfahrt raus (29.09. abends)

Entschieden: Handel wird zu Aufträgen – Frachter kaufen dir große Mengen ab (das, was sich stapelt, z. B. 300.000 Erz)
und zahlen gut (Finanzspritzen für Monumente); ab und zu verkaufen sie eine knappe Ware. Kreuzfahrt fällt weg, der
Große Hafen bekommt mehr Auftragsplätze und Großaufträge. Schiffe fahren nur übers Wasser.

- [x] **24a** Aufträge statt Börse (Handelshafen: 2 Plätze, Großer Hafen: 4 + Großaufträge); Kreuzfahrt entfernen.
- [x] **24b** Seewege: Fähren, Expeditionsboot, Frachter und Kutter fahren nur übers Wasser (kürzester Weg, geglättet);
      ist ein Ziel zugeschüttet, zeigt der Hafen „kein Seeweg“ und die Schiffe bleiben am Pier.

## Block 25 – „Das ist neu“ und Verkehr zählt jede Insel einmal (30.09.)

- [x] **25a** „Das ist neu“-Fenster: einmal pro Gerät nach einem Update, nicht bei neuen Spielern (ohne Spielstand);
      3–5 Punkte, Kennung in `NEWS.id` (bei jedem Push mit Sichtbarem neu setzen).
- [x] **25b** Verkehr: Ist eine Insel über verschiedene Verbindungen angebunden (große Bahnlinie + Fähre), zählen ihre
      Pendler/Besucher nicht mehr doppelt – jede Insel einmal, die Verbindungen teilen sie sich nach Plätzen.

## Block 26 – Bedingungen per Weg oder Bahn (30.09.)

Entschieden: Versorgung (Bäckerei, Markt, Schule, Park/Brunnen und die „in der Nähe“-Bedingungen der Gebäude) zählt
auch, wenn ein Weg (beliebig lang) oder eine Bahnlinie dorthin führt. Schönheit, Wasser, Ruhe und „direkt daneben“
bleiben Sache der Umgebung.
- [x] **26a** Weg: Ziel im selben Viertel (über Wege oder aneinandergrenzend verbunden).
- [x] **26b** Bahn: Haus nah an einem Bahnhof, Ziel nah an einem Bahnhof derselben Linie (fahrende Linie; auch Seilbahn und Fähre).
- [x] **26c** Anzeige: „· 🏘️ im selben Viertel“ / „· 🚆 per Bahn“ im Infofenster.

## Block 27 – Endlose Karte (30.09.)

Entschieden: Aufschütten überall, aber das Meer wird nach außen tiefer (dunkler) und jedes Feld teurer. Nach dem
Laternenfest tauchen draußen zufällige Inseln auf (Name, Gelände, Fundstück), per Expedition zu entdecken, Ring für Ring.
- [x] **27a** Welt wächst mit: keine feste Grenze mehr (Zeichnen, Seewege, Aufschütten).
- [x] **27b** Tiefes Wasser: Preis je Feld steigt mit dem Abstand zur nächsten Küste, Meer sichtbar dunkler.
- [x] **27c** Ferne Inseln nach dem Laternenfest: zufällig erzeugt (fester Startwert), Name, Gelände-Mischung,
      Fundstück; Expedition wie bisher, danach der nächste Ring.

## Block 28 – Wunder mit Fähigkeit und Bonus (30.09.)

Entschieden: jedes Wunder eine eigene Fähigkeit plus dauerhaften Prozent-Bonus; die kleinen Festwerte fallen weg.
- [x] **28a** 🎡 Riesenrad: +25 % Einnahmen; alle 15 Min Jahrmarkt (3 Min dreifache Einnahmen, Lichter, Feuerwerk).
- [x] **28b** 🔭 Sternwarte: +50 % Ideen; Sternschnuppen nachts antippen = Ideen; findet ferne Inseln schneller.
- [x] **28c** 🌉 Seebrücke: +20 % Einwohner; Aufträge +50 %, ein Auftragsplatz mehr, Schiffe schneller.
- [x] **28d** 🌿 Botanischer Garten: +50 % Schönheit; „Park“ und „schöne Umgebung“ überall erfüllt, Obst und Felder
      doppelt, exotische Deko (Palmen, Riesenblumen).
- [x] **28e** 🏰 Schloss: +50 % auf alles; alle 10 Min ein Erlass nach Wahl (5 Min).

## Block 29 – Hauptbahnhof (30.09.)

Entschieden: ein Gebäude mit „+ Gleis“ (wird zur Seite breiter, so viele Gleise wie man will), jedes Gleis eine eigene
Linie mit eigenem Zug; Umsteigen: Inseln, deren Linien am selben Hauptbahnhof enden, gelten als verbunden; mehrere
Designs zur Auswahl (Glashalle wie Leipzig, Backstein, Landbahnhof).
- [x] **29a** Gebäude mit variabler Breite (`t.gleise`, je Gleis 2 Felder, 4 tief), „+ Gleis“ / „− Gleis“.
- [x] **29b** Jedes Gleis ist ein Halt (eigene Linie, eigener Zug, Züge fahren in die Halle).
- [x] **29c** Umsteigen am Hauptbahnhof (Verkehr).
- [x] **29d** Aussehen: drei Designs, Züge in der Halle.

## Block 30 – Läden, Kultur, exotische Waren (30.09.)

Entschieden: alles in einem Rutsch. Läden verdienen an Kundschaft (Einwohner im Viertel + Besucher der Insel; gleiche Läden
teilen sich die Kunden), verkaufen Waren aus dem Lager (teurer als Aufträge), Innenstadt-Bonus für viele verschiedene
Läden in einem Viertel, neue Hauswünsche (Laden, Café, Kultur). Kaffee, Tee, Kakao wachsen nur auf fernen Inseln.
- [x] **30a** Waren ☕🍵🍫 und Plantagen (nur ferne Inseln).
- [x] **30b** Läden: Kundschaft, Warenverkauf, Innenstadt-Bonus; Kultur zieht Besucher an, Hotels mehr Gäste.
- [x] **30c** Neue Hauswünsche: Stadthaus – Laden, Villa – Café, Glasvilla – Kultur.
- [x] **30d** Aussehen: kleine Läden (Ladenhaus mit Markise, Schild, Auslage), Stadt- und Endgame-Bauten.
- [x] **30e** Anzeige: Infofenster (Kunden, Ware, Innenstadt), Bau-Menü „🛍️ Läden“ und „🎭 Kultur“, Tipps, „Das ist neu“.

## Block 31 – Tempo beim Rauszoomen (01.10.)

- [x] Weit weg: Gebäude und Dekos als fertige Bildchen (gleiche teilen sich eins), Nachtlicht bleibt; Riesenrad,
      Windräder, Mühlen weiter live.
- [x] Nach dem Zoomen und Bauen: Boden und Bildchen nur im Zeitbudget je Bild neu malen (kein Ruckler mehr auf einmal).
- [x] Rechnen schneller (recalc ≈ ein Drittel): Nachschlage-Listen statt Umkreis Feld für Feld, Viertel mit Zahlen,
      Vorschau beim Bauen erst, wenn die Maus kurz ruht.

## Block 32 – Läden erkennbar machen (01.10.)

- [x] Feste Markenfarben je Laden und ein Wahrzeichen (Riesen-Becher, Teeblatt, Eiswaffel, Friseursäule, Apothekenkreuz,
      Posthorn, Buch, Pizza, Nudelschale, Torte, Teddy, Kleid, Uhrturm, Diamant, Schokotafel …).
- [x] Große neu: Museum (Tempel mit Dino-Skelett), Hotel (HOTEL-Leuchtschild, Sterne), Grand Hotel, Markthalle, Kino
      (Filmrolle), Theater (Masken), Konzerthalle (Glaswelle, Note), Kaufhaus (Riesentüte), Passage, Möbelhaus (Sessel).

## Block 33 – Läden kaufen das Lager nicht mehr leer (01.10.)

- [x] Vorrat je Ware: Läden verkaufen nur, was darüber liegt (Baumaterial standardmäßig 2.000), im 📦 Lager einstellbar.
- [x] Möbelhaus verkauft halb so viele Bretter (0,5 je 100 Kunden und Sekunde).

## Block 34 – Symbole kleiner, Hafen-Aufträge (01.10.)

- [x] Hafen: „Liefern“/„Kaufen“ bei Aufträgen waren nicht verbunden – jetzt schon (Test klickt sie).
- [x] Kleine Läden: kein großes Symbol mehr auf dem Dach, dasselbe Symbol klein im Ausleger-Schild an der Hausecke
      (`hangSign`); Kiosk und Uhrmacher unverändert.
- [x] Theater ohne Dach-Masken, Kino ohne Filmrolle, Museum ohne Schriftzug, Konzerthalle ohne Noten, Möbelhaus ohne
      Sofa/Lampe; Aquarium neu als eckiges Glasbecken mit Wasser und Fischen.

## Block 35 – Neue Gebäude an die alten angleichen (30.09.)

Vergleich alt/neu (drei Blickwinkel + Messung): neue ohne Schatten, dunkler, klobiger, alle gleiche Kiste, viel Kleinkram,
Schrift, große neue höher als das Rathaus. Der Spieler wollte alles angleichen; Stadion, Konzerthalle, Grand Hotel dürfen
groß bleiben, Museum, Hotel, Aquarium, Kino, Theater kleiner.
- [x] Schatten für alle neuen (`ART_SHADOW`), Ladenschild als Holz-Ausleger mit farbiger Tafel (nicht mehr wie die Hinweis-Blasen).
- [x] Farben aus der Palette der alten (helle Wände, klare Dächer), eigene Bauform je Laden, weniger Kleinkram, keine Schrift.
- [x] Größen: kleine Läden wie Wohnhäuser; Kaufhaus 63, Hotel 56, Museum 52, Theater 58, Kino 42 px (Rathaus 71).
- [x] Uni, Bibliothek, Kunstakademie etwas größer und stattlicher.

## Block 36 – Leiste unten neu (30.09.)

Entschieden: sechs Bereiche (Wohnen · Arbeit · Stadt · Schön · Verbinden · Gelände), Läden aufgeteilt in Läden, Essen,
Großstadt; Kacheln nur Bild + Preis, Infos rechts im Fenster; gesperrte Dinge hinten mit Schloss; Handy: ⓘ im Hinweis.
- [x] **36a** Menü: sechs Bereiche, Filter bei Arbeit und Stadt ohne „Alle“, jeder Bereich merkt sich seinen Filter.
- [x] **36b** Kacheln schmal (62 statt 78 px): Bild, Preis (kurz: „12 Tsd.“, „1,2 Mio.“), Schloss bei Gesperrtem; Freies zuerst.
- [x] **36c** Bau-Infofenster rechts: Wirkung, Preis mit Material (rot, wenn es fehlt – live), Beschreibung, Tipp, Größe,
      Mitarbeiter, Schönheit, Strom, wie viele schon stehen, wie man es freischaltet. Hinweis dann nur „wie man baut“.
- [x] **36d** Handy: ⓘ im Hinweis öffnet das Fenster, Tippen auf die Karte schließt es; obere Zeile passt in 375 px.

## Block 37 – Progression nach den Läden (30.09.)

Wirtschaftsprüfung mit Musterstädten (23 Durchläufe, gegengeprüft): bis ~8 Laternen in Ordnung, ab ~10 Laternen
kaufte jeder Einwohner in jeder Ladenart voll ein – Wartezeit bis zum Fest 3,8 h → 1,8 h (Wohnstadt 11,3 h → 2,2 h).
Entschieden: Personal-Grenze, ferne Inseln und Truhe nach Einkommen, nur 3 Häfen zählen.
- [x] **37a** Personal: ein Laden bedient höchstens 150 Kunden je Mitarbeiter; Infofenster „Voll – ein zweiter Laden …“.
- [x] **37b** Besucher teilen sich gleiche Läden der ganzen Insel (vorher je Viertel neu: Lücke im Weg = doppelt).
- [x] **37c** Materialfalle: Holz/Stein/Erz behalten 500, Obst 2.000; erst verarbeiten, dann verkaufen; Lager und
      Infofenster zeigen, was wirklich verkauft wird.
- [x] **37d** Wunder-Preis nach dem besten Einkommen bisher (früh aufstellen/Läden wegschieben spart nichts mehr).
- [x] **37e** Ferne Inseln mindestens (15 + 5 × Nummer) Minuten Einkommen, Taler-Truhe 5 statt 20 Minuten.
- [x] **37f** Häfen: nur die 3 besten geben +8 %/+12 % (auf Betriebe – Text korrigiert).
- [x] **37g** Nachmessung: Personal allein bremst nicht (Nachbauen holt alles zurück) → dazu **Kaufkraft** je Viertel:
      die besten 40 Rate-Punkte voll, der Rest ¼ (je Art sortiert, damit ein Laden nie das Einkommen senkt).
- [x] **37h** Letzte Schritte nach Einkommen (Spieler: „teurer“, Variante mit Einkommen): Kristallhöhle Stufe 2/3 mindestens
      25/60 Minuten, Leuchtturm 60 Minuten des besten Einkommens; feste Preise bleiben Untergrenze.
- [x] **37i** Gefunden und behoben: Inseln/Wunder per ✋ billiger, alte Baustellen mit Preis von vor dem Update, Warenverkauf
      überschätzt (Sägewerk ohne Holz), bestes Einkommen sank nie (jetzt Halbwertszeit 20 min), Obst-Vorrat blockierte Wunder.
- [ ] Endmessung nach dem nächsten Spiel: Ziel gemischte Stadt mit Läden ≈ 3,5 h Warten auf Geld bis zum Fest (Messskripte: Scratchpad preise/).

## Block 38 – Leiste nach einer Regel (01.10.)

Rückmeldung: noch unübersichtlich (Bäckerei: Essen? Laden? Betrieb?), „Arbeit“, „Stadt“, „Schön“ unklar.
Entschieden: Einteilung nach Aufgabe + Suche.
- [x] **38a** Herstellen (ohne Kundschaft) · Verkaufen (braucht Kundschaft) · Freizeit · Wohnen · Deko · Wege & Land; Regel
      steht neben den Filtern; Verstärker/Stadt aufgelöst (Markt → Verkaufen, Hafen → Schiff, Blumenbeet → Deko).
- [x] **38b** 🔍 Suche nach Namen (Umlaute egal), Escape oder ein Bereich beendet sie.
- [x] **38c** Handy: obere Zeile passt mit 🔍 in 375 px (gewählter Bereich nur als Symbol, Name in der Regel-Zeile).

## Block 39 – Marktplatz zum Selberbauen (01.10.)

Rückmeldung: Der Markt ist „schrott“, niemand will ihn; er soll das Zentrum sein, zu den Wegen passen, gestaltbar sein
und nachts leuchten. Entschieden: Platz selbst bauen + Marktviertel, Besucher, Markttag.
- [x] **39a** Stände und große Deko auf Wegfeldern (Weg bleibt darunter, bündig mit dem Platz), Abreißen/Tragen/Speichern.
- [x] **39b** Sechs Marktstände (Obst, Blumen, Brot, Käse, Fisch, Gewürze) mit Markise und Lichterkette.
- [x] **39c** Marktplatz ab 3 Ständen (6 Wochenmarkt, 9 Großer Markt): Läden bis 4 Felder +20 %, Besucher, Markttag.
- [x] **39d** Alte Märkte werden Kopfsteinplätze mit ihren Ständen; Wunsch „Marktplatz erreichbar“ nur mit echtem Platz.
- [x] Zufallstest fand: Stand auf Weg mit kleinen Dekos, doppeltes Feld beim Speichern während des Tragens – behoben.

## Block 40 – Fünf Bereiche nach Absicht (01.10.)

Rückmeldung: Schule ist keine Freizeit; zu viele Oberkategorien, Wohnen allein zu klein, Wege sind auch Gestaltung.
Gemeinsam besprochen: 🏘️ Stadt (Wohnen, Einrichtungen inkl. Post/Apotheke/Hotels, Verkehr) · 🏭 Herstellen · 🛍️ Einkaufen
· 🎡 Freizeit (Kultur, Wunder) · 🌸 Gestalten (Grün, Platz, Besonderes, Wege & Gelände).
- [x] Menü umgebaut, Handy zeigt den Namen des Bereichs wieder (passt mit 5 Bereichen in 375 px).

## Block 41–44 – Deko neu denken (01.10.)

Entschieden: Linien auf Kanten · alle Stile · Kleinkram nicht auf Gebäudefelder, aber an die Ecken eines Hauses ·
Park zum Selberbauen (wie der Marktplatz) · Größen für alle Deko. Reihenfolge: Linien, Kleinkram, Größen, Park.
- [x] **41** Hecke (niedrig, hoch, Buchs, Blüten), Zaun (Latten, Staketen, Weide, Gitter, Schmiedeeisen, Glas), Mauer
      (Backstein, Trocken, Naturstein, Klinker, Terrakotta, Kopfstein) als Linien; Tor am Weg; Bewohner nur durchs Tor;
      Kunstakademie; alte Hecken-Ecken → Büsche. Runde Ecken (auch am Weg), Endstücke, Torbögen, Lichterketten/Laternen.
- [x] **42** Kleinkram: 8 Plätze je Feld (Ecken + Seitenmitten), Bank mittig am Wegrand längs zum Weg, Häuser nur an den Ecken.
- [x] **43** Größen, wo es echt ist: Brunnen/Kristallbrunnen (Ecke–3×3), Baum/Palme/Busch/Kristall (Ecke–2×2), Beet
      (1×1–3×3, mehr Blumen), Statue/Pavillon (bis 2×2), Glashaus (bis 2×3); Bank, Laterne & Co. bleiben einzeln.
- [x] **41b** Designprüfung in der Testwelt (`?welt=zaeune`, 11 Fehler): Blüten/Lichter im Bogen gleich dicht (`alongLine`),
      nachts keine dunklen Buckel, Bögen wachsen mit der Linie und sind kräftiger (Mauer mit Keilsteinen), Hecken-Enden über
      die ganze Höhe rund, ein Pfosten statt zwei am Zauntor, gleichmäßige Pfosten an Ecken, keine Laternen-Häufung in
      Mauerecken, Kopfstein/Klinker unterscheidbar. Laternen (Ende, Tor, Bogen) nur noch bei beleuchteten Stilen.
- [x] **44** Park zum Selberbauen: Parkrasen malen (Gestalten → Wege & Gelände, zählt als Wiese, nur Deko/Wege darauf) + Deko →
      Grünanlage (4 Felder, 3 Deko), Park (9, 8, Bäume + Bank), Stadtpark (16, 15, + Wasser). Park-Wunsch (4 Felder oder
      Viertel), Schönheit ringsum, Besucher, Parkfest per Knopf (×1,25/×1,5/×2, 3 Min., 20 Min. Pause), Spaziergänger auf
      Bänken. Alte 3×3-Parks → Rasen mit Brunnen, Bäumen, Bänken. Nebenbei: Bewohner laufen nicht mehr durch Zäune.

## Block 45 – Rückgängig und Löschen (01.10.)

- [x] ↶ in der Werkzeugleiste (und Strg/⌘+Z): bis 20 Schritte, Bauen, Abreißen, Verschieben, Drehen, Malen, Linien. Nimmt nur
      zurück, wenn die Stelle seitdem unverändert ist; Taler und Rohstoffe exakt zurück.
- [x] Löschen-Knopf (🗑️ +Erstattung) in jedem Fenster: Gebäude, Wege, Deko, jedes Linienstück, Parkrasen. Teures fragt einmal nach.
- [x] Nebenbei: Deko-Fenster zeigte „halbe Erstattung“, gab aber die volle – jetzt stimmt die Anzeige.

## Block 46 – Kleinkram weiter in die Ecken (01.10.)

- [x] Plätze bei 0,42 statt 0,3 (Laterne steht neben dem Weg statt darauf), je nach Größe (Bäume etwas weiter drin), an Hecke/
      Zaun/Mauer um deren Dicke nach innen, am Torbogen noch weiter, an Eckpunkten mit Linie Abstand zur Ecke (`slotPos`).

## Block 47–48 – Näher ran, Windturbine, Offshore (01.10.)

- [x] Zoom bis 5 (Boden-Zwischenbilder bis Stufe 3). Windrad Stufe 3 als Windturbine mit senkrechter Achse und Holzflügeln.
- [x] Offshore-Windrad (Forschung „Offshore-Windkraft“ nach „Leichte Rotorblätter“): ins Meer bis 6 Felder vor der Küste
      (`needs: 'offshore'`, `landWithin`, Feld wird deins), eine Stufe, 6 ⚡ = doppelt so viel wie ein volles Windrad (Rotorblätter
      wirken auf beide). Karten von Wasser-Bauten zeigen Wasser als Untergrund.

## Block 49 – Freischalten per Knopf (01.10.)

- [x] Gesperrtes Ding im Info-Fenster: Knopf springt hin (`unlockGo`) – Forschung (Eintrag leuchtet, `spotlight`, bleibt beim
      Neuzeichnen), Kunstakademie, Sehenswürdigkeit (Kamera + Fenster), Album-Seite, Erfindungen. Sterne, Laternen, Laternenfest,
      Botanischer Garten: nur Text. Forschungs-Einträge nennen jetzt auch „braucht eine Universität“ usw.

## Block 50 – Kunstakademie teurer (01.10.)

- [x] Preise nach dem besten Einkommen (`designPrice`): normal etwa 3 Minuten (Wurzel aus Grundpreis/150 staffelt), ✦ Meisterstücke
      5× so viel; mindestens 5× bzw. 25× der alten Preise. Schon Gekauftes bleibt.

## Block 51 – Anleitung (01.10.)

- [x] ☰ → Anleitung mit Reitern Los geht's / Bauen & Gestalten / Wachsen / Steuerung (`openHelp`); Tasten nur mit Maus,
      Touch-Gesten immer. Wer etwas Neues einbaut, ergänzt es dort (und neue Tasten in der Steuerung).

## Block 52 – Knöpfe oben reagieren auf den ersten Tipp (01.10.)

- [x] iPad: Safari wertete den ersten Tipp auf Forschung/Stadtname manchmal nur als „Finger drüber“, weil die Leiste alle 0,2 s
      in die Knöpfe schrieb. Jetzt nur bei Änderung (`setText`), und Knöpfe oben lösen mit dem Finger schon beim Loslassen aus
      (`fastTap`, der Klick danach wird ignoriert).

## Block 53 – Standortboni (02.10.)

- [x] Ein guter Platz bringt bis +50 % (`siteOf`, `SITE_MAX`), ein schlechter nie weniger als normal: Was stört (Windschatten,
      Schatten), nimmt nur den Bonus weg. Windrad: Wasser/Fels im Umkreis 2, Wald/Gebäude direkt daneben schmälern. Offshore:
      Entfernung zum Land. Geothermie: Nähe zur heißen Quelle. Solar: Wiese +25 %, Sand bis +50 %, hohe Nachbarn Schatten.
      Wasserkraft: Wasser ringsum. Holzfäller/Steinbruch/Bergwerk/Kristallmine: Wald/Fels/Erz/Kristall im Umkreis 2.
      Obstplantage: Obsthain und Obstbäume. Vorschau beim Bauen (⚡ und Platz), Infofenster mit Tipp, Anleitung.

## Block 54 – Hafen-Aufträge geprüft (02.10.)

- [x] Großauftrag über (fast) das ganze Lager wurde aufgerundet (1.290 Holz → Auftrag über 1.300) und war nicht lieferbar:
      jetzt abgerundet (`niceFloor`).
- [x] Knöpfe mit Preis in Fenstern (z. B. „Kaufen“ beim Angebot) wurden nie gesperrt: Das Auffrischen des Fensters setzte
      „disabled“ zurück. `costMarks()` läuft jetzt nach `refreshLive()` (gilt für alle Fenster).
- Geprüft und in Ordnung: Plätze je Stufe (0/2/4, Seebrücke +1), Takt (erst 2, dann alle 3 min), Ablauf nach 12 min,
  Speichern, Liefern/Kaufen, Angebote nur für baubare Betriebe, 🚢-Zeichen am Hafen.

## Block 55 – Bewohner lebendiger (02.10.)

- [x] Sechs neue Arten (Eichhörnchen, Igel, Fuchs, Giraffe, Elefant, Ente), je eine kommt mit einer Insel (`ANIMALS[].isle`,
      `speciesOpen`); eigenes Aussehen in `drawWalker`. Alle Wohnhäuser haben Bewohner, das Reihenhaus drei Familien (`t.more`,
      `residentsOf`); Album zählt alle.
- [x] Tagesablauf (`dayPart`: morgen/mittag/abend/nacht im 20-Minuten-Tag): Figuren gehen von ihrem Haus zu Arbeit/Schule,
      Essen/Laden/Markt, Park (`findGoal`, `walkPath`, `stepWalker`), gehen hinein, kommen wieder raus und gehen heim; nachts
      sind nur ein Viertel draußen. Ohne Ziel: bummeln.
- [x] Figur antippen → Fenster (`openWalkerInfo`): wer, Zuhause, was sie gerade macht, Herzen/Wunsch, „Zum Haus“.
- [x] Sprechblasen alle 20–30 s (`bubbleTick`, `bubbleText`): Wünsche des Hauses, Ziel, Tageszeit.
- [x] Rathaus → Bewohner (`residentsHtml`): alle Familien nach Art, aufklappbar, fehlende Arten mit ihrer Insel.
- [x] Nachprüfung (Hoch): Figur im Gebäude zeigt „Macht Pause: Bäckerei“ statt „Auf dem Weg“; kommt sie zu Hause an,
      bleibt ihr Fenster offen („Ist nach Hause gegangen“, Knopf zum Haus); Antipp-Radius wächst mit dem Zoom (weit
      herausgezoomt kein Fehlgriff aufs Haus daneben). Gemessen mit 2.300 Häusern: Planung ≤ 0,6 ms, Wegsuche ≤ 0,1 ms.
      Handy (375 px): Rathaus-Reiter passt, Arten aufklappbar. Nachts ¼ der Figuren draußen.

## Block 56 – Tiere in der Natur (02.10.)

- [x] Zwölf Tiere (`NATURE`), sechs häufige zeigen, wo es schön ist (Schmetterling bei Blumen/Park je nach Schönheit,
      Singvogel bei Bäumen, Fisch und Frosch im Teich, Möwe und Robbe an der eigenen Küste), sechs seltene mit Bedingung
      (Eisvogel: Blumen am Ufer; Glühwürmchen/Eule nachts; Reh am ruhigen Waldrand; Goldfisch/Regenbogenfalter nur sehr
      schön). `natureAt` sagt, was wo vorkommt; `natureTick` probiert 24 zufällige Stellen im Bild, höchstens 20 Tiere
      (seltene dürfen dazu). Bewegung `critterPos`, Bild `drawCritter` (in der Feld-Reihenfolge; Glühwürmchen über der Nacht).
- [x] Antippen (`critterAt`, `tapCritter`): Tier flieht, neu entdeckt → Album-Seite „Naturbeobachtungen“ (`natur:<id>`),
      Fehlendes mit Hinweis. Stufen-Belohnungen über `albumN` (`albumDone(id, n)`): 4 Schmetterlingsgarten, 8 Vogelhäuschen-
      Baum, 12 Seerosenteich (2×2) – mit eigenen Tieren im Bild.

## Block 57 – Bugfixes (02.10.)

- [x] Schloss-Fenster: der lange Löschen-Knopf (🗑️ +280.000) schob „Schließen“ über den Rand → Knopfreihe im Fenster bricht
      um. Alle 86 Gebäude-Fenster bei 768 und 375 px nachgemessen: kein Überhang.
- [x] Weg an Zaun/Hecke/Mauer bündig nur noch, wenn gewollt: Schalter im Fenster der Linie („Bündig bis an die Linie“ /
      „Mit Grasstreifen“, `setFlush` für die ganze zusammenhängende Linie, `edgeRun`), gespeichert als `e.flush`; ohne
      Angabe bündig nur am Park (`edgeFlush`).
- [x] Reihenhäuser neu: drei schmale Giebelhäuser Wand an Wand (Satteldach quer zur Straße), je eigene Pastellfarbe (aus
      der Lage) und eigener Schmuckgiebel (Treppen-, Glocken-, Spitzgiebel) mit weißer Kante und rundem Giebelfenster auf der
      sichtbaren Giebelseite; Stufe = Stockwerke (2/3/4), ab Stufe 2 Blumenkästen, Stufe 3 Türlaterne. In allen 4 Drehungen geprüft.
- [x] Farbwahl geprüft (Bild mit zwei Farben verglichen): Reihenhaus und Ferienhaus übernahmen die Farbe nicht → jetzt
      ja (Reihenhaus: alle drei in Tönen der gewählten Farbe; ohne Wahl bunt gemischt). Glashaus, Bootssteg, Seilbahn,
      Solarfeld, Wellenkraftwerk, Markt haben nichts zu färben → keine Farbauswahl mehr (`UNPAINTED`). Test in draw.test.js
      prüft jedes Gebäude mit Farbauswahl.
- [x] Reihenhaus: „bunt“-Feld je für Fassaden und Dächer (`data-wall/roof="bunt"` löscht die Farbe) – so geht Fassade
      einfarbig + Dächer bunt und umgekehrt; „Originalfarben“ dort nicht mehr nötig.

## Block 58 – Alles auf Wege (02.10.)

- [x] Jede große Deko darf auf Wege, auch über mehrere Felder (Blumenbeet, Schmetterlingsgarten, Seerosenteich, große
      Brunnen …); der Weg bleibt darunter (`t.weg` Ankerfeld, `t.wegs['dx,dy']` übrige Felder), kommt beim Abreißen/Aufheben
      zurück (`restoreUnder`), wird gezeichnet (`flatAt`/`wegAt`) und gespeichert.
- [x] Gebäude ersetzen den Weg (`replacesWeg`): Weg weg, Taler zurück, Vorschau „🛤️ ersetzt den Weg“, Rückgängig holt ihn.
      Kleine Deko in der Wegmitte muss vorher weg.
- [x] Nebenbei: haarfeine senkrechte Fugen in großen Objekten (Teich, große Brunnen …) – Streifengrenzen jetzt auf ganze
      Bildpunkte gerundet.
- [x] Weg unter vorhandene Deko legen: Weg-Pinsel (Tippen oder Ziehen) über Brunnen & Co. legt den Weg darunter
      (`decoOver`, `wegUnderDeco`), anderes Muster färbt um; beim Tragen eines Wegs nicht. Zufallstest fand dabei zwei
      Randfälle (Gruppe ablegen, großes Ding drehen auf Wegen) – beide behoben.

## Block 59 – Tor ohne Weg (02.10.)

- [x] Im Fenster einer Linie: „geschlossen“ / „🚪 Hier ein Tor“ (`setGate`, `e.gate`, gespeichert, bleibt beim Umfärben).
      `isGate` = Weg auf beiden Seiten oder `e.gate`; ohne Weg (`gardenGate`) steht ein Gartentürchen in der Lücke
      (`gateDoor`: beim Zaun im Zaunstil, bei Hecke/Mauer Holz; geschwungener Abschluss, Strebe, Knauf). Bewohner gehen
      durch, Bögen gehen darüber; „geschlossen“ nimmt einen Bogen mit (Taler zurück).
- [x] Gartentor schwingt auf, wenn jemand nah ist (`gateSwing`, weich, zur vorderen Seite), und wieder zu. Bogen-Auswahl
      heißt jetzt „✕ Ohne Bogen“ statt „Offen“ (war neben einem Tor missverständlich).
- [x] Drei Möglichkeiten je Linienstück ohne Weg: geschlossen / 🚪 Gartentor (Türchen) / ⬜ Durchgang (offen, `e.gate =
      'offen'`) – Bogen bei beiden Toren möglich.

## Block 60 – Freizeitpark (Wunder zum Selberbauen, nach dem Laternenfest)

Gemeinsam entschieden: Gelände + Module (wie Park/Marktplatz), Achterbahn frei verlegbar, nach dem Fest, Wirkung:
Besucher & Einnahmen, Schönheit ringsum, Parade/Feuerwerk, Album & Erfolge.

- [x] 60a Grundgerüst: Freizeitpark-Boden (`fzboden` → `state.terra` 'fz', zählt als Wiese, bunte Rauten, rosa Rand),
      Module `cat: 'fz'`, `needs: 'fz'`, Preis nach bestem Einkommen (`fzMin` Minuten, mindestens Grundpreis; bezahlter
      Preis in `t.price` fürs Erstatten). `computeFz` → `FZPARKS`, Stufen `FZ_STEPS` (🎪 Rummelplatz 9 Felder/2
      Attraktionen, 🎠 Freizeitpark 25/5 + Eingang, Fahrt, Stand, 🏰 Wunderland 49/10 + Schloss). Wirkung: alle Einnahmen
      +8/20/40 % (beste Stufe), Besucher, 🌸 auch ringsum. Fenster `openFzInfo`/`fzStatus`. Erste Module: Parkeingang (1×2),
      Pferdekarussell (2×2), Zuckerwatte-Stand.
- [x] 60b Module: Märchenschloss (3×3, schaltet Wunderland frei), Teetassen (2×2), Kettenkarussell (2×2), Freifallturm,
      Geisterbahn (2×2), Wildwasserbahn (2×3, Felsen mit Wasserfall, Boote), Eis-Stand, Ballonverkäufer. Menü: „🎢
      Freizeitpark“ (Boden, Eingang, Schloss, Stände) und „🎠 Fahrgeschäfte“.
- [x] 60c Achterbahn: Schiene `fz_bahn` ziehen (paint), `fz_station` in den Ring, `fz_looping` auf ein gerades Stück
      (`t.loop`). `computeCoasters`: geschlossener Ring (`railLoop`) mit Station → `COASTERS` (Station vorn, Höhen:
      Lifthügel ein Viertel, dann Wellen), `COASTER_AT` je Feld; offene Strecken liegen flach. Zeichnung `drawCoasterTile`
      (Kurven als Viertelkreis, rote Schienen, Schwellen, weiße Stützen, Looping-Ring, Station mit Dach), Zug
      `stepCoasters`/`coasterCars`/`drawCoasterCar` (Lift langsam, bergab schneller, hält an der Station, im Looping
      kopfüber). Fertige Bahn = eine Attraktion (Sorten fahrt + achterbahn).
- [x] 60d Parade (`startFzFest`, `state.fzFest`, 3 min Einnahmen ×1,3/1,6/2,2, 20 min Pause, Feuerwerk über der Parkmitte
      `startFireworks(at)`, Umzug `paraders` mit Fähnchen auf dem Parkboden), Bewohner gehen mittags/abends hin (Ziel
      'fzpark'), Album-Seite „Freizeitpark“ (alle Module samt Looping) → 🌈 Zauberbrunnen, Erfolg „Freizeitpark-Stufe“,
      „Das ist neu“. Nebenbei: Speichern mitten im Tragen großer Deko auf Wegen legte die Wege doppelt ab – behoben.
- [x] 60e Überarbeitung nach dem ersten Test: Parkboden sieht aus wie Wiese (nur rosa Rand). Schiene und Höhen-Pinsel lassen
      sich als Linie ziehen, Boden als Fläche (vorher nur Feld für Feld!). Höhen-Pinsel ▲/▼ (`fz_hoch`/`fz_tief`, `t.hgt`
      Stufen à `COASTER_STEP`, bis `COASTER_MAXSTEP`; ohne Pinsel Automatik). Looping auch auf offener Strecke sichtbar.
      Wagen in Seitenansicht entlang der Schiene, im Looping zur Ring-Mitte gedreht. Schloss (2×2 bis 6×6) und Eingang
      (1–2 × 2–6) frei aufziehen (`SIZED`, `sizedDim`, `t.dim`, `BUILD_DIM`, Preis nach Fläche), Farben für Fassade, Dach und
      Fenster (`WIN_COLS`, `t.win`). Menü: eigene Gruppe „🎢 Achterbahn“.
- [x] 60f Nach dem zweiten Test: Schloss als Baukasten (Schlossflügel mit Zinnen, Portal, Schlossturm, Großer Turm,
      Hauptturm; je Teil Stockwerke im Fenster `t.fl` und Farben Fassade/Dach/Fenster; ab 5 Teilen mit Hauptturm ein Schloss),
      Eingang aus zwei Tortürmen (`TOR_PAIR`, 2–7 Felder in einer Reihe, Bogen mit Schild `drawTorArch`). Das Aufziehen
      (SIZED) ist wieder raus. Station ganz flach (auch die Kanten zu ihr), Bahnsteig-Seite per Drehen, ⟳-Knopf.
      Looping-Richtung korrigiert (erst vor, oben zurück). „Randlinien an/aus“ im ☰ Menü (`state.noBorders`).
      Löschen-Rückfrage ging beim Auffrischen verloren (`delSure`) – behoben.
- [x] 60g Nach dem dritten Test: Looping größer und runder (`LOOP_R` 18, `LOOP_T` 0.48). Baukasten-Schloss war „komplett
      Schrott“ (Teile wirkten nicht zusammengehörig) → EIN Märchenschloss (`fz_schloss`), gestaltet im Fenster: Breite 3–9,
      Tiefe 1–3 (wächst auf der Karte mit, abwechselnd zu beiden Seiten, `castleChange`), Mittelturm keiner…riesig,
      Seitentürme 0–3 Paare (so viele, wie die Breite trägt, `csMaxPairs`), Dach Spitz/Kuppel/Zinnen, Farben Fassade/Dach/
      Fenster. Gezeichnet als ein Bau (`drawCastle`): Sockel mit Teppich, Mittelbau mit Portal und Rosette, Flügel zwischen
      den Türmen, Türme nach außen abgestuft, tiefes Schloss mit Garten. Wert `castlePrice`, mehr kostet den Unterschied,
      weniger gibt die Hälfte zurück. Torturm wandert in die Gruppe „🏰 Schloss“.
- [x] 60h Mehr Gestaltung (Schritt 1): Turm-Liste statt Anzahl – bis 4 Paare unabhängig von der Breite, je Paar Höhe,
      Dicke, Platz (vorn/Fassade/hinten), Dach; wird es eng, werden sie schlanker (`castleTowers`, nie Überlappen).
      Mittelbau: Breite, Stockwerke, Dach; Mittelturm: Höhe, Dicke, Dach; Flügel: Stockwerke, Dach. Vorlagen Märchenschloss,
      Ritterburg, Eispalast, Orientpalast (`CS_TPL`, setzen Gestalt + Farben). Fenster in Reitern Form · Türme · Farben
      (`castleTab`, `castleHtml`, `wireCastle`). Alte Form (60g: s, r) liest `csOf` weiter.
- [x] 60i Schritt 2: Reiter „✨ Zierde“ – Fahnenfarbe (`fc`), Gold an/aus (`gd`), Balkone & Erker (`bk`), Wappen Krone/Herz/
      Stern (`wp`), Lichterketten, nachts leuchtend (`lc`), Freitreppe (`ex`, der Bau rückt dafür nach hinten). Umgebung:
      Wassergraben mit Zugbrücke (`mo`), Mauer mit Torhaus (`mw`), Garten mit Beeten, Brunnen und Bäumen (`gn`) – ein Feld
      rundum (`csRing`), nur mittig (das Schloss bleibt stehen), sonst Hinweis. Mauer/Brunnen/Bäume vor oder hinter dem
      Schloss sortiert (pre/post).
- [x] 60j Das Märchenschloss stellte das Wunder-Schloss in den Schatten → Wunder neu im selben Stil, eine Klasse größer
      (`WONDER_ART.schloss`): Graben, Mauer mit Ecktürmen und Torhaus, Hof mit Brunnen, Palais mit gestaffelten Türmen und
      dem höchsten Turm samt Königskrone (`royalCrown`), Wachen (`royalGuard`), nachts alle paar Minuten Feuerwerk
      (`royalFireTick`). Bauabschnitte zeigen das Wachsen (Fundament → Mauern → Türme → Dächer → Säle → Einweihung).
      Nach der Einweihung Farben und Dachform (`t.cs.r`, `royalRoof`). Schloss-Bausteine geteilt (`castleKit`).

## Block 61 – Preise überdacht (03.10.2026)
- [x] Preisliste mit Kaufzeiten (Artifact „Kachelhausen Preisliste“): Laternen/Inseln je 20–40 min passen; feste Preise wachsen
      nicht mit – nach dem Fest kosteten Stadion & Co. nur Sekunden bis Minuten; Wunder zeigten im Menü nur die Baustelle.
- [x] Große Gebäude kosten Minuten des besten Einkommens, der alte Preis ist Untergrenze (`INC_MIN`, `incMinOf`): nach dem Fest
      Plantagen 3, Chocolaterie 5, Passage 12, Kaufhaus/Theater/Museum 15, Konzerthalle 18, Aquarium/Zoo 20, Grand Hotel 25,
      Stadion 30; in der Mitte Hauptbahnhof 2, Universität/Möbelhaus 3, Kino/Hotel 4, Markthalle 5. Kleines bleibt fest.
      `t.price` fürs Erstatten; alte Gebäude ohne Preis erstatten nach dem Grundpreis (`baseCost`).
- [x] Wunder zeigen im Baumenü den ganzen Preis (`wonderTotal`: Baustelle + alle Abschnitte), das Infofenster erklärt es.

## Block 62 – Bot-Messung (03.10.2026)
- [x] `tools/sim-bots.js` + `tests/sim-bots.test.js` (nur mit `SIM=normal,spammer`): zwei Bots spielen im echten Spielcode bis
      zum Fest. Ergebnis (Preise Block 61): normal 9 h 22, Spammer 4 h 13 – gespammt wird das Feld (20 Taler, abbezahlt in
      20–30 s), nicht die Werkstatt. Entscheidung: keine Spam-Bremse (gemütliches Spiel, Spam ist hässlich und mühsam).

## Block 63 – Preise mitwachsend, aber gebremst (03.10.2026)
- [x] Alle Preise nach Einkommen über `incScaled(min, ref)`: bis zum Bezugseinkommen `ref` genau `min` Minuten (wie bisher),
      darüber wächst der Preis nur mit der Wurzel – wer mehr verdient, wartet kürzer (doppelt ~30 %, zehnfach ~70 %), wer
      weniger verdient, nie länger als geplant. `ref` = Einkommen des normalen Bots, wenn das Ding frei wird: Riesenrad 1.000,
      Seebrücke 1.250, Sternwarte/Bot. Garten/Kristallhöhle 2.000, Schloss/Leuchtturm/Freizeitpark/Großbauten nach dem Fest 2.300;
      Mitte: Hauptbahnhof 1.500, Uni 2.000, Möbelhaus 1.000, Kino/Hotel 1.200, Markthalle 1.250 (`INC_MIN`, `WONDERS[].ref`,
      `LM_REF`, `LEUCHT_REF`, `FZ_REF`). Wunder-Infofenster nennt die Wartezeit beim eigenen Einkommen.
- [x] Kontroll-Messung: normal 8 h 57 (vorher 9 h 22), Spammer 3 h 40 (vorher 4 h 13). Bot reißt jetzt Felder an der Küste ab,
      wenn kein Platz für den Leuchtturm ist.

## Block 64 – alter Park gelöscht (03.10.2026)
- [x] Der alte 3×3-Park (`old: true`) tauchte nach „Bank-Ring“ im Fenster „Neu freigeschaltet“ auf und ließ sich wählen, aber
      nicht bauen. Jetzt ganz weg (Eintrag, Zeichnung, Tipp); die Laterne schaltet Parkrasen frei. Alte Spielstände wandeln
      ihn beim Laden weiter in Parkrasen mit Brunnen um. Test: alles, was freigeschaltet werden kann, steht im Baumenü.

## Block 65 – Eckpunkte für schmale Deko (03.10.2026)
- [x] Laternen ließen sich nicht genau zwischen zwei Felder oder in den Bogen einer Wegkurve setzen (nur 8 Plätze je Feld,
      0,42 vom Feldrand). Jetzt Platz 8 (`VSLOT`) je Feld = seine obere Ecke, genau auf der Grenze. Schmale Deko (`POST_OK`:
      Laterne, Kristall-Laterne, Blumentopf, Glaskugel, Kristall) rastet ein, wenn man nah an eine Feldecke tippt
      (`slotAt`/`vertexWanted`, `VSLOT_NEAR`). Die vier Ecken-Plätze, die zum Punkt zeigen, bleiben dafür frei
      (`vertexCorners`, `cornerVertex`); nicht an Gebäude, nicht an Linien-Pfosten, keine Gebäude/Gräben/Linien an die Laterne.
      Speichern, Rückgängig, Strom, Album, Verschieben laufen über die normalen Deko-Plätze mit. Testwelt: Weg mit Kurve.
- [x] 65b Gemeint war die Außenkurve: Auf einem Kurvenfeld rückt der äußere Ecken-Platz an den Bogen, mittig auf die Außenkurve
      (`curveSlot`, `slotPos`); `slotAt` wählt nach den echten Platz-Lagen. Testwelt: Laterne mittig außen an der Kurve.

## Block 66 – Wegbrücken (03.10.2026)
- [x] Weg übers Wasser wird von selbst zur Brücke (`t.bridge` wie bei Schienen): über eigene Teiche/Flüsse/Seen beliebig lang,
      ins Meer höchstens `BRIDGE_SEA` Felder vor die Küste. Wächst vom Ufer aus, nur gerade (`bridgeShapeError`; beim Ziehen
      in Runden mit `PLANNED`). Art nach Wegstil (`bridgeKind`, `BRIDGE_OF_STYLE`): Holzsteg, Steinbogen, Ziegelbrücke, im
      Fenster auch rote Bogenbrücke (`setBridgeKind`, alte voll zurück; Umfärben des Wegs behält die Art). Preis `WEG_BRIDGE`.
      Gezeichnet angehoben mit Rampen, Bögen, Brüstung/Geländer (`drawWegBridge`); Bewohner laufen drüber (`walkable`);
      keine Läden/Gebäude/Deko auf Brücken (`plainWeg`); Aufschütten macht wieder einen normalen Weg. Testwelt: Fluss.
- [x] 66b Brücken: Farben im Fenster (Bauwerk `t.brc` aus `BRIDGE_COLS`, Holzplanken `t.brw` aus `PLANK_COLS`), Belag der Stein-/
      Ziegelbrücken mit dem echten Wegmuster (Ziegel, Platten, Pflaster, Asphalt mit Mittelstreifen), Mauerwerk an den
      Seitenwänden; Holzpfähle unter dem Belag statt davor.
- [x] 66c Art und Farben gelten für die ganze Brücke (`bridgeSpan`, `setBridgeKind`, `setBridgeColor`); neue Felder an einer
      Brücke übernehmen Art und Farben zum passenden Preis (`newBridgeKind`).
- [x] 66d Belag der Stein-/Ziegelbrücke direkt im Fenster wählen (alle freigeschalteten Wegmuster, `setBridgeStyle`, für die
      ganze Brücke, kostet wie Umfärben; die Brücken-Art bleibt) – kein Umweg mehr über Weg ziehen, löschen, neu legen.

## Block 67 – Linien zählen als Deko (03.10.2026)
- [x] Wunsch „Deko in der Nähe“ der Häuser: auch eine Hecke, ein Zaun oder eine Mauer an einem Feld bis 2 Felder ums Haus
      erfüllt ihn (`wishMet('deko')`), Wunschtext sagt es.
- [x] 66e Beim Herauszoomen fehlte die halbe Eisenbahnbrücke: Wege/Schienen kamen aus der Bodenkachel, die an ihrem Rand
      abschneidet – Geländer und Anhebung ragten darüber. Brücken (Schiene wie Weg) jetzt immer live (`cachedPath`).

## Block 68 – Aufgabenliste als Karten (03.10.2026)
- [x] Die Ziel-Karte oben links war eine Textliste. Jetzt ist jede Aufgabe ein antippbares Modul (`taskCard`): Symbol, Titel,
      was fehlt mit Fortschrittsbalken, rechts › bzw. grünes „Los!“, wenn sie bereit ist. Laternen, Insel, Erlass, Schloss,
      Leuchtturm; Erfolge und Album als kleine Knöpfe (öffnen Rathaus bzw. Album). Jahrmarkt/aktiver Erlass als Hinweiszeile.

## Block 69 – Bank dreht sich beim Setzen (03.10.2026)
- [x] Die Vorschau zeigte die Bank in der gewählten Drehung, gesetzt wurde sie in einer Seitenmitte aber automatisch längs zur
      Seite. Jetzt eine Regel für beide (`smallRot`): von selbst längs zur Seite, außer man hat selbst gedreht (⟳/R/Mausrad).

## Block 70 – zu grelles Nachtlicht (03.10.2026)
- [x] Viele Fenster dicht beieinander (Reihenhäuser) stanzten ihre Lichtflecken übereinander durch die Nacht und wurden
      taghell. Jetzt zählt `punchGlow` je Bildschirm-Zelle (`glowCells`, jedes Bild neu): jeder weitere Schein ist schwächer und
      kleiner; die Fensterscheiben selbst bleiben hell.


## Block 71 – Antippen trifft das ganze Gebäude (03.10.2026)
- [x] Beim Ansehen öffnete nur das Bodenfeld ein Gebäude; Turm, Dach, Krone oder das Namensschild darüber trafen den Rasen
      dahinter (oder ein anderes Haus). Jetzt zählt, was dort gezeichnet ist (`objectAt`, von vorn nach hinten wie beim
      Zeichnen): vorderes Haus vor hinterem, Turmspitze, Baumkrone. Durch dünnes Zeug (Baugerüst) trifft man das Haus dahinter.
      Schilder von Sehenswürdigkeiten (beim Ansehen) und gesperrten Inseln (immer) lassen sich antippen.

## Block 72 – mehr Gebäude umfärbbar (04.10.2026)
- [x] Windrad, Großes Windrad, Windturbine, Offshore: „Turm“ und „Flügel“ (Turbine: Holzschraube, Ring, Spitzen).
- [x] Alle Läden, Hotel, Grand Hotel, Kaufhaus, Passage, Markthalle, Möbelhaus: Wand und Dach (Markise/Schild bleiben).
- [x] Kultur: Kino, Theater, Museum, Konzerthalle, Aquarium, Zoo, Stadion.
- [x] Deko-Bauten: Leuchtturm (Turm/Streifen), Uhrturm, Karussell (Boden/Zeltdach), Pavillon (Säulen/Dach), Brunnen (Becken).
      Umgesetzt ohne die Bilder umzubauen: `REPAINT` je Gebäude, `C()`/`shade()` tauschen beim Zeichnen die Töne.
- [x] Testwelt `?welt=farben` (`TESTWELT=1 npx vitest run tests/testwelt-farben.test.js`): je umfärbbares Gebäude eine
      Reihe – vier Drehungen in Originalfarben, dann alle 14 Farben; Namensschild vorn, ohne 🐌/✨ (`SHOWCASE.quiet`).

## Block 73 – viele Gebäude gleich färben (04.10.2026)
- [x] Im Farbfenster „🎨 Für alle N anderen übernehmen“: alle Gebäude derselben Art bekommen Wand, Dach und Fenster (mit
      Rückgängig). „Neu gebaute bekommen diese Farben“: wer umfärbt, baut die nächsten gleich so (`state.paintNew`, abschaltbar;
      Häuser bleiben bunt, bis man es für sie einschaltet).

## Block 74 – Märchenschloss: runde Türme, Turmgruppe, sichtbare Dächer (04.10.2026)
- [x] Mittelbau-Dach „Kuppel“/„Zinnen“ war mit Mittelturm kaum zu sehen (Turm verdeckt das Dach). Jetzt Kuppel = große
      Zwiebelkuppeln auf den Ecken, Zinnen = hohe Zinnen und Ecktürmchen.
- [x] Türme rund oder eckig (je Turmpaar und Mittelturm): Zylinder mit Kegeldach, Kuppel oder Zinnenkranz, Balkon rundum.
- [x] Mitte wählbar: Block oder Turmgruppe (Torbau mit Portal und Türmchen, Hauptturm vom Boden in Stufen mit Kranz,
      2–4 Nebentürme gestaffelt). Neue Schlösser: Turmgruppe, rund; alte bleiben. Vorlagen angepasst, neu „Kompakte Burg“.
- [x] Testwelt freizeitpark: Schlossreihe mit allen Mischungen auf aufgeschüttetem Land östlich der Insel.

## Block 75 – Balkone und Fenster am Märchenschloss (04.10.2026)
- [x] Balkone schwebten als dünnes Brett quer über einer Fensterreihe. Jetzt auf Höhe einer Fensterreihe (die Fenster
      dort sind Balkontüren), mit Konsolen, sichtbarer Bodenplatte, Kante, Stabgeländer und Handlauf – eckig und rund.
- [x] Neu unter „Zierde“: Fenster wenige · normal · viele · ganz viele (`cs.wn`) – mehr je Wand, in Türmen enger übereinander.
- [x] Balkone hörten an den Turmkanten auf (nur die vordere Hälfte gezeichnet). Jetzt hinterer Teil vor dem Turm, vorderer
      danach – der Ring schließt sich sichtbar, eckig wie rund.
- [x] Die Kränze an den Absätzen des Hauptturms (Turmgruppe) hatten noch die alte Scheibe mit halbem Geländer. Jetzt ein
      Bauteil für alles (`balconyRing`): Balkone der Türme und Kränze gleich, hinten vor dem Turm, vorn danach.
- [x] Goldband und Handläufe an runden Türmen liefen an den Seiten spitz aus (Strich auf einer Ellipse). Jetzt `arcBand`:
      Fläche zwischen zwei Bögen, überall gleich hoch, mit Licht von links.

## Block 76 – Boden unter dem Märchenschloss (04.10.2026)
- [x] Das Schloss stand immer auf einer erhöhten Platte (wie ein Modell auf dem Tablett). Neu unter „Zierde“: Boden
      Sockel · Rasen · Platz (`cs.gb`). Rasen: direkt im Gras mit Plattenweg zum Portal; Platz: gepflasterter Hof.
      Neue Schlösser starten mit Rasen, bestehende behalten den Sockel.
- [x] Belag für Weg zum Portal (Rasen) bzw. den Platz (`cs.gp`): alle freigeschalteten Wegmuster, dieselben Knöpfe wie beim
      Weg; auch der Weg vom Tor zum Portal (Graben/Mauer) bekommt ihn. Gezeichnet über `kPave` (wie die Wunder-Plätze).

## Block 77 – Wegform: ganz breit, Anschluss an Gebäude, Kurven rund/eckig (04.10.2026)
- [x] Musterleiste beim Weg: „▭ schmal / ▬ ganz breit“ und „⌒ Kurve rund / ⌐ eckig“ für alles, was man zieht; über einen alten
      Weg gezogen stellt es die Form um (kostenlos). Ganz breit: Belag übers ganze Feld, Bordstein nur zu Nicht-Wegen, Lücke für
      ankommende schmale Wege – Laternen und Bänke stehen auf dem Belag am Rand.
- [x] Enden: automatisch läuft eine Sackgasse vor einem Gebäude bis an die Wand (einzelnes Feld: zum Gebäude daneben).
      Im Wegfenster „Ende: automatisch · rund · bis an den Rand“, „Form“ und (in Kurven) „Kurve rund / eckig“ – mit Rückgängig.
- [x] Eckige Kurven: Mittelstreifen (Asphalt) und Trittsteine folgen dem Knick; außen kein Deko-Platz auf dem Bogen.
- [x] Testwelt freizeitpark: Abschnitt „Wegformen“ östlich der Insel (36, 24).

## Block 78 – Gartenweg zur Tür, Seiten bis an den Rand (04.10.2026)
- [x] Zeigt die Tür eines kleinen Hauses oder Ladens zu einem Weg, führt ein schmaler Gartenweg im Stil des Wegs bis zur Tür
      (kostenlos, im Hausfenster „🌿 Gartenweg zur Tür“ abschaltbar). Zeigt die Tür weg vom Weg: Haus drehen.
- [x] Seiten: zu einem Gebäude hin füllt ein schmaler Weg automatisch bis an die Wand, mit rundem Übergang zum Nachbarfeld
      (kleiner Vorplatz statt Zickzack). Im Wegfenster je Seite (↖ ↗ ↘ ↙): automatisch · bis an den Rand · schmal.
- [x] Testwelt freizeitpark: Häuser beidseits eines Kieswegs im Abschnitt „Wegformen“.
- [x] 78b: „Seiten bis an den Rand“ wieder entfernt (Wege sehen wieder normal aus); der Gartenweg zur Tür bleibt.
- [x] 78c: Der Gartenweg lag mit eigener Kante und eigenem Muster auf der Straße. Jetzt zeichnet der Weg sein Stück selbst mit
      (ein Guss, Muster durchgehend, Lücke im Bordstein); das Haus nur den Teil auf seinem Feld. Trittsteine: zwei Steine zur Tür.

## Block 79 – Bildrate wählbar (04.10.2026)
- [x] Nah herangezoomt wirkte das Spiel am PC ruckelig: beim Zuschauen nur 30 Bilder/s (Bewohner springen nah dran weiter je
      Bild), dazu ab Zoom 1 viel mehr Zeichenarbeit (gemessen M5: 2–4 ms weit weg, 8–10 ms nah, Spitzen bis 39 ms).
      Neu im Menü „Bildrate: flüssig / sparsam“ (je Gerät in localStorage): flüssig = immer 60/s, nur im Hintergrund 30/s;
      ohne Wahl am PC flüssig, mit Touchscreen sparsam wie bisher.
- [ ] Offen: Zeichenlast nah dran senken (Bildchen auch beim Heranzoomen für unbewegte Gebäude, Spitzen finden).

## Block 80 – Uhren flach auf der Wand (04.10.2026)
- [x] Uhren an Uhrturm, Rathaus und Bahnhof waren Kreise vor der schrägen Wand. Jetzt `faceClock`: Zifferblatt mit Ring,
      vier Strichen und Zeigern auf die Wand geschert (wie bei Markthalle und Uhrmacher, die es nun mitbenutzen).
      Das Rathaus zeigt die Uhr auf jeder sichtbaren Turmseite.

## Block 81 – Daneben tippen schließt Fenster (04.10.2026)
- [x] Getestet mit echten Klicks (PC 1024 px und Handy 375 px): Menü, Forschung, Rathaus, Album – daneben klicken schließt.
      Seitenfenster: Rasen, Wald, Fels, Wasser schließen; anderes Gebäude/Weg wechselt (gewollt); Bedienleisten lassen es offen.
- [x] Fehler 1: Aufs offene Meer getippt blieb das Seitenfenster offen (nur „Da ist nur Meer.“) – schließt jetzt.
- [x] Fehler 2: Im großen Fenster drücken und daneben loslassen (oder umgekehrt) schloss es – jetzt nur, wenn Drücken und
      Loslassen beide daneben sind.

## Block 82 – Rechtsklick ohne Kontextmenü (04.10.2026)
- [x] Bisher nur auf der Karte unterdrückt; auf Leisten, Fenstern, Aufgabenliste, Knöpfen ging das Browser-Menü auf (auch beim
      Loslassen eines Rechts-Ziehens über einem Fenster). Jetzt überall aus, außer in Texteingaben (Einfügen). Test: rechtsklick.test.js.

## Block 83 – Leuchtturm-Kap als Finale (04.10.2026)
- [x] Der Leuchtturm war ein schmaler 1×1-Turm, kaum größer als ein Haus. Jetzt ein 3×3-Kap an der Küste: hoher, verjüngter Turm
      mit roten Streifen und Fenstern, Galerie, gläserne Laternenkammer mit Kuppel und Wetterfahne, Lichtstrahl (tags zart,
      nachts weit übers Meer), Wärterhaus mit Garten, Felsen mit Brandung, Steg; 21 Laternen in drei Girlanden (nachts leuchtend).
- [x] Einweihung mit Feuerwerk, danach nachts ab und zu Feuerwerk über dem Kap. Turm/Streifen weiter umfärbbar.
- [x] Alte Leuchttürme wachsen beim Laden, wo Platz ist (Wege/Dekos zurück); sonst bleiben sie klein, im Fenster „Zum Kap ausbauen“.
- [x] Bildchen im Baumenü und Tagebuch angepasst; Test zeichnet jetzt jedes Menübildchen. Testwelt freizeitpark: Kap bei (46, 31).

## Block 84 – Große Fehlersuche (05.10.2026)
Gefunden von 6 Such-Agenten (je ein Bereich) und 3 Prüfern, die jeden Fund nachgestellt haben (75 von 76 bestätigt, Doppelte
zusammengefasst). Dazu ein eigener Spieltest im Browser: Einführung, Handy hoch und quer, die ganze Freizeitpark-Welt in vier
Zoomstufen gezeichnet, 3.000 Zufallsaktionen mit echter Spielschleife – dabei kein Absturz und kein Konsolenfehler.

### 84a – Spielstand und Rückgängig (wichtig) – erledigt
Tests: fehler84a.test.js. „Neue Insel“ fragt jetzt in einem eigenen Fenster (mit „Erst sichern“); das Laternenfest leert den
Rückgängig-Stapel; der Leuchtturm merkt sich seinen Preis.
- [x] Getragenes verschwindet: mit ✋ etwas tragen, dann über ☰ → Erfolge → Ort → „Rathaus verschieben“ (oder ✋ im Fenster
      eines anderen Gebäudes, Schloss-/Erlass-Karte) etwas anderes aufheben → das Erste ist weg, auch im Spielstand
      (`startMove`/`pickUp` überschreiben `moving`).
- [x] ↶ nach „Neue Insel“ und „Spielstand laden“ wirkt aufs alte Spiel: alte Häuser erscheinen, mit einem getragenen Ding
      sogar das alte Geld (`startNew`/`adoptState` leeren `undoStack`/`undoPending` nicht).
- [x] ↶ nach dem Verschieben bucht alles seit dem Aufheben zurück (Einnahmen, Produktion; Käufe in der Kunstakademie kommen
      zurück, die Farbe bleibt = Geld-Trick). Abbrechen per Esc/Werkzeugwechsel lässt `undoPending` stehen → das nächste ↶
      spult die ganze Wirtschaft zurück (`cancelMove`).
- [x] Leuchtturm bauen und ↶: 15 Mio. und Material zurück, das Laternenfest bleibt (`festival()` außerhalb der Rückgängig-Daten).
- [x] ↶ stellt ein großes Gebäude über inzwischen Gebautes (keine Grundflächen-Prüfung in `undo`).
- [x] Aufschütten unter Seebrücke, Hafen, Leuchtturm, Hausboot, Steg, Offshore erlaubt → Hausboot steht auf der Wiese; beim
      nächsten Laden löscht/verschiebt `fitFootprints` Seebrücke/Hafen und erstattet nur den Grundpreis (Wunder-Abschnitte,
      Ausbau, Schiffe weg). `fitFootprints` läuft bei jedem Laden statt nur einmal.
- [x] Märchenschloss mit geänderter Größe rückt oder verschwindet beim Laden (`fitFootprints` ruft `placeError` ohne `t` und
      prüft 2×5; erstattet den Getter-Preis statt `t.price`).
- [x] „Zum Kap ausbauen“ (und die v12-Umstellung) setzt das Kap auf Parkrasen/Freizeitpark-Boden → beim Laden gelöscht,
      +15 Mio. (`lighthouseSpot` prüft nur `terrainAt === 'grass'`).
- [x] Alte Stände (vor 29.09.): ein wachsender Hafen/Rathaus reißt den alten 1×1-Leuchtturm ab (`growLighthouses` läuft nach
      `growHarbors`/`growTownHall`).
- [x] Unlesbarer Spielstand wird überschrieben, wenn die Sicherheitskopie nicht gespeichert werden kann (Speicher voll):
      `startNew` → `save()`.
- [x] „Neue Insel beginnen“: zweimal schnell tippen löscht alles (die Rückfrage ist derselbe Knopf ohne Wartezeit).
- [x] Beim normalen Start werden Erfolge nicht still gezählt (Bänder-Flut nach Updates; der Import macht es richtig).

### 84b – Bauen, Verschieben, Abreißen – erledigt
Tests: fehler84b.test.js. Browser-Zufallstest (3.000 Aktionen) danach ohne Fehler; dabei fiel auf, dass sich Rathaus/Sehenswürdigkeit
per `build` (nicht über die Leiste) bauen ließen – jetzt abgelehnt.
- [x] Betrieb auf einem Wegfeld: die Geländebedingung fällt weg (Kristallmine, Holzfäller, Bergwerk überall; `placeError`
      springt mit `continue` über die needs-Prüfung).
- [x] Haus abreißen: Ausbau-Taler (Glasvilla bis 123.700) werden nicht erstattet, keine Rückfrage (`demolishInfo` kennt
      HOUSE_STAGES nicht).
- [x] Hafen abreißen: gekaufte Schiffe verschwinden ohne Erstattung und ohne Erwähnung in der Rückfrage.
- [x] Weg auf Schiene (oder umgekehrt, oder auf einen Bahnübergang) verschieben löscht das Ziel samt Brücke.
- [x] Einzelnes Verschieben ignoriert Brücken (Brücke auf der Wiese, Weg/Schiene ohne Brücke im Wasser); Gruppen prüfen es.
- [x] Steg/Hausboot/Offshore ins fremde Meer verschoben: das Feld gehört niemandem, nicht mehr antippbar oder abreißbar
      (kein `claimTile` beim Ablegen).
- [x] Mehrfeld-Gebäude lassen sich quer über Zaun/Hecke/Mauer bauen, verschieben und drehen.
- [x] Haus: „Neu gebaute bekommen diese Farben“ wirkt nicht (die Zufallsfarbe überschreibt).
- [x] ✋ im Gebäudefenster hebt die Deko in Ecke 0 auf statt das Gebäude.
- [x] Deko-Fenster bleibt nach ↶ offen; ✋ hebt dann den Weg darunter auf (keine live-Prüfung).
- [x] Großes Glashaus (2×3) lässt sich nicht drehen (fehlt in ROTATABLE).
- [x] Parkrasen im Wald schenkt Bäume, die beim Entfernen voll erstattet werden (Geld-Trick, Roden gratis).
- [x] Kleine Deko bleibt an verbotener Stelle: Bank in der Seitenmitte unter einem neuen Haus, Baum/Bank im gegrabenen Teich.
- [x] Leuchtturm wird nach dem heutigen statt dem bezahlten Preis erstattet (kein `t.price`/`baseCost`, Regel 73).
- [x] Linie über andere Linie ziehen: Vorschau 0 Taler, kostet aber voll, die alte Linie wird nicht erstattet.
- [x] Ausgebautes Haus: die Abriss-Prüfung rechnet Einwohner als pop × Stufe statt `popOf` → „Hier wohnen Leute …“ zu früh.
- [x] iPad: Zaun/Hecke/Mauer beim Abreißen schon beim ersten Tippen weg (sonst zeigt das erste Tippen die Vorschau).
- [x] Eine Freischaltung während des Bauens setzt die selbst gewählte Drehung zurück.

### 84c – Fortschritt und Anzeigen – erledigt
Tests: fehler84c.test.js. Jahrmarkt: Feuerwerk überm Riesenrad (Lichter gibt es schon am Riesenrad). „Das ist neu“: neue Kennung
`2026-10-05-kap` mit Kap, Schloss, Wegen, Umfärben und den Reparaturen.
- [x] Album-Seiten „Deko“ und „Freizeitpark“ werden nie voll (Parkrasen, Fz-Boden und Höhen-Pinsel sind keine Gebäude) →
      Rosenbogen und Zauberbrunnen bleiben für immer gesperrt.
- [x] Wunsch „Weg vor der Tür“: ein Marktstand/Brunnen auf dem Weg zählt nicht mehr als Weg (`bAt` statt `wegAt`).
- [x] Bestes Einkommen sinkt nie (die Rundung je Bild frisst die Abnahme) → Wunder, Inseln, Leuchtturm bleiben auf Höchstpreis.
- [x] Rathaus „Inseln“ zählt nur Häuser (Reihenhaus & Co. fehlen bei den Einwohnern).
- [x] Sehenswürdigkeit „Schaltet frei“/„Neu:“ nennt nur einen Teil (z. B. Quelle: Ferienhaus, Seebrücke fehlen).
- [x] „Stadtplanung“ zählt nicht für ✨ und „Bereit“ (das Fenster sagt bereit, das Funkeln fehlt).
- [x] Kunstakademie Stufe 3: der große Pavillon zählt nicht als Pavillon.
- [x] Erfolg „Kunstakademie-Stücke“: der 3. Stern ist nie erreichbar (zählt die 6 Gratis-Farben mit).
- [x] Schloss „+50 % auf alles“ wirkt nicht auf Veredelung und Warenverkauf.
- [x] Leuchtturm-Karte zeigt „Los!“, obwohl Material fehlt.
- [x] Einnahmen-Faktor zeigt „×3.9000000000000004“ (ungerundet, Punkt statt Komma).
- [x] Springt die Systemuhr zurück, zieht ein negatives dt Geld und Rohstoffe ab.
- [x] Jahrmarkt ohne Feuerwerk und Lichter (28a beschreibt sie).
- [x] Bahnübergang: Bewohner verschwinden oder kehren um, statt an der Schranke zu warten.
- [x] „Das ist neu“ seit 03.10. nicht erneuert (Farben, Wegform, Schloss, Bildrate, Leuchtturm-Kap fehlen).

### 84d – Zeichnen – erledigt
Tests: fehler84d.test.js. Dabei gefunden: ein Fehler beim Zeichnen eines Boden-Grundstücks ließ `g` auf dessen Leinwand stehen
(das ganze Bild wäre danach unsichtbar gewesen) – jetzt mit try/finally. Bildzeit unverändert (1,5–3 ms).
- [x] Hohe große Gebäude (Riesenrad, Schloss, Kap …) verschwinden am unteren Bildrand streifenweise (aussortiert nach der
      Feldmitte).
- [x] Züge in der Halle eines langen Hauptbahnhofs fehlen, wenn sein Anker außerhalb des Bildes liegt.
- [x] Bahnsteig des Bahnhofs und Boden des Glashauses fehlen auf der Karte (nicht in GROUND_TYPES, Regel 16).
- [x] Gleise/Boden langer Hauptbahnhöfe fehlen auf weiter entfernten Grundstücken.
- [x] Von weitem abgeschnitten: Hbf ab etwa 6 Gleisen, gedrehter Hafen-Pier, Baumhaus-Krone, Wunder-Gerüst.
- [x] Geteilte Bildchen: ein umgefärbter Laden sieht von weitem aus wie ein anderer; Reihenhäuser von weitem alle gleich.
- [x] Neue Rathaus-Flaggenfarbe erscheint von weitem erst später.
- [x] Glasvilla wirft keinen Schatten (HOUSE_SHADOW[6] fehlt).
- [x] Offshore-Windrad steht von weitem still (fehlt in SPRITE_LIVE; Fahrgeschäfte bewusst nicht – Zeichenlast).
- [x] Nachtlicht großer Gebäude: der Schein wird je Streifen schwächer, mit senkrechten Kanten.
- [x] Deko in der vorderen Ecke wird von Deko in der Seitenmitte überdeckt (Reihenfolge SLOTS_FRONT).
- [x] Bau-Vorschau zeigt Originalfarben bzw. das alte eckige Schloss statt dessen, was gebaut wird.
- [x] Ein Zeichenfehler in einem Gebäude lässt den Streifen-Ausschnitt dauerhaft hängen (kein try/finally).

### 84e – Oberfläche und Texte – erledigt
Tests: fehler84e.test.js.
- [x] Handy: Der Griff am Infofenster merkt sich ein abgebrochenes Wischen (der nächste Tipp schließt das Fenster).
- [x] Infofenster wird nach Verkleinern des Browsers unter 600 px riesig (Inline-`top` bleibt stehen).
- [x] Lager 📦 und Erfolgs-Band liegen über offenen Fenstern.
- [x] Menü „Zum Rathaus“ springt zur Inselmitte statt zum Rathaus.
- [x] Einführung Schritt 2: „🛤️ ganz links“ stimmt nicht (ganz links ist 👆).
- [x] Ziel-Karte und Knöpfe oben: lösen nach einem Wisch nicht mehr aus (`fastTap` prüft die Bewegung) – vorsorglich, auf dem Gerät
      war es nicht nachprüfbar.

## Block 85 – Hauptbahnhof überarbeitet (05.10.2026)
Gewählt: Weg-Anschluss sichtbar und spielerisch, Mittelportal mit Uhrturm, Designs reparieren und verschönern.
- [x] Dächer: Bei Drehung 2 und 3 malte der Bahnsteig über sein eigenes Dach (Backstein, Landbahnhof – sah aus wie ein heller
      Keil). Jetzt ist jedes Gleis ein Stück: Prellbock und Bahnsteig, dann das Dach darüber.
- [x] Gleise beim Erweitern: auf weiter entfernten Grundstücken fehlte der Boden (behoben in 84d, hier mit Test für alle Drehungen).
- [x] Eingang: Bei gerader Gleiszahl saß die Tür neben dem Uhrturm. Neu: Portal genau in der Mitte mit Giebel, großer Tür im
      hellen Steinrahmen, Fenster darüber, darauf der Uhrturm (Uhren flach auf allen Seiten), links und rechts gleich lange Flügel.
- [x] Weg anschließen: Vor dem Portal zwei Eingangsfelder (`hbfEntrance`), dort läuft ein Weg bis an die Tür; das Fenster zeigt
      „🛤️ Weg am Eingang – mit dem Dorf verbunden“ bzw. wo der Weg hingehört.
- [x] Verschönert: Dächer enden vor dem Bahnsteigende, dort Bank, Laterne (nachts an) und Bahnsteiguhr; gelbe Bahnsteigkante;
      Landbahnhof mit Blumenkästen; Stufen vor dem Portal.
- [x] 85b: Von der Gleisseite steckte der Turm im Giebeldach des Portals – jetzt flaches Portal mit Zierkante, der Turm wächst
      aus der Mitte. Bahnsteigdächer (Backstein, Land) waren lange Zelte mit dunklen Dreiecken: jetzt flache Dächer mit Blende
      und Blechbahnen, beim Landbahnhof mit gezackter Holzborte. Flügel des Landbahnhofs mit durchgehendem Satteldach
      (Walmdach je Stück gab Kerben). Höchstens 16 Gleise (`HBF_MAX`).
- [x] 85c: Der Turm begann am Boden und stand dadurch von außen wie ein Schornstein vor der Fassade (verdeckte die Tür). Jetzt
      sitzt er auf dem Portaldach (`lift`), die Tür darunter ist frei.
- [x] Testwelt freizeitpark: Abschnitt „Hauptbahnhöfe“ bei (36, 40) – alle Designs, verschiedene Drehungen und Gleiszahlen, einer
      mit Weg zum Portal. Tests: hauptbahnhof.test.js.

## Block 86 – Wilmerhecke (05.10.2026)
- [x] Wunsch der Schwägerin: kleine Büsche als Hecke aneinanderreihen. Neu bei den Hecken: „Wilmerhecke“, „… mit Blüten“,
      „… mit Lichterkette“ – gleich frei. Runde Büsche so groß wie der Deko-Busch, dicht an dicht (`bushRow`, `wilmerBush`),
      auch im Bogen, am Durchgang und am freien Ende; die Lichterkette zählt als Licht (`EDGE_LIT`). Test: wilmerhecke.test.js.
- [x] 86b: Sah nicht aus wie echte Büsche (zu dicht, eigene Farben, größere Endbüsche). Jetzt zeichnet jeder Busch der Hecke
      genau den Deko-Busch (`drawObject('busch')` mit `decoScale`), Abstand wie von Hand aneinandergereiht (2,8 je Feld).
- [x] 86c: Hecken-Büsche waren noch 10 % größer – aufgestellte Deko wird zusätzlich × 0,9 gezeichnet (`drawSmallOne`). Jetzt
      gleiche Größe, Abstand 3,5 je Feld (wie im Bild der Nutzerin von Hand gereiht).
- [x] 86d: Lücke zwischen aneinandergesetzten Stücken – jedes Stück verteilte 3,5 Büsche für sich (am Ende mehr Abstand). Jetzt
      feste Stellen je Kante (`bushSpan`, `BUSH_PER` = 4), gleich weit auseinander über alle Stücke.
- [x] 86e: In der Kurve schien der helle Belag der Wegrundung zwischen den Büschen durch, und am Übergang Gerade/Bogen sowie
      an freien Enden saßen zwei Büsche aufeinander. Wilmerhecke rundet Ecken nicht mehr (`roundCorner` → null), kein Endbusch.
- [x] 86f: Ecken sahen klumpig aus (zwei Büsche kurz vor dem Eckpunkt). Jetzt genau ein Busch auf jedem Eckpunkt (Block 86g: wer ihn
      zeichnet, hängt an der Zeichenreihenfolge – `wilmerStart`), dazwischen alle ¼ Feld einer – Ecken werden ein sauberes „L“, Enden schließen am Punkt ab.
- [x] 86g: Ecke vorn (beide Stücke enden am Punkt): der Eckbusch wurde vom zuerst gezeichneten Stück gemalt, das andere malte
      seinen hinteren Busch darüber. Jetzt: beginnt am Punkt ein Stück, zeichnet das erste davon den Eckbusch vor seinen Büschen;
      sonst zeichnet ihn jedes endende als Letztes. Test spielt die echte Reihenfolge für alle Eckarten nach.
- [x] „Das ist neu“: neue Kennung `2026-10-05-wilmer` (Wilmerhecke, Hauptbahnhof, Kap, Schloss und Wege).

## Block 87 – Mauerenden schlanker (05.10.2026)
- [x] Freie Mauerenden hatten denselben dicken Pfeiler wie ein Tor (1,45 × Mauerbreite, hoch, breiter Deckstein) – wirkte klobig.
      87b: Der schlanke Pfeiler war kaum anders (Nutzer sah keinen Unterschied). Jetzt endet die Mauer gerade, ohne Pfeiler –
      nur „Laternen“ hat oben am Ende eine Laterne. Torpfeiler an Durchgängen bleiben.
- [x] 87c: Endpfeiler doch wieder, aber schlank: Enden und Tore gleich (`wallPillarR` 1,25 × Mauerbreite, niedriger, kleiner
      Deckstein). Torpfeiler auf den Feldecken (`gateT` = 0); jede Mauer, die dort ankommt – auch um die Ecke –, hört am Pfeiler
      auf (`mauerGateAt`), statt in ihn hineinzulaufen und sich darüberzumalen. Test: mauerpfeiler.test.js.
- [x] 87d: Gartentür lag vor dem vorderen Pfeiler – Durchgang jetzt von hinten nach vorn gezeichnet (hinteres Stück/Pfosten,
      Tür, vorderes Stück/Pfosten, Bogen).
