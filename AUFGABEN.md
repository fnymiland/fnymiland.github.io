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
- [x] 86h: Lichterkette als Lampions obendrauf sah schlecht aus – jetzt kleine Lichter in jedem Busch verteilt wie die Blüten,
      nachts mit warmem Schein (brauchen wie alle Lichter Strom).
- [x] 86i: Lichter zu zufällig – jetzt eine gleichmäßig gehängte Kette (`bushGarland`): Aufhängepunkte alle ½ Feld, leichter
      Durchhang, Birnchen im festen Abstand, läuft über aneinandergesetzte Stücke und um Ecken durch.
- [x] 86j/k: Lichterkette läuft durch aneinandergesetzte Stücke und Ecken; wo die Hecke aufhört (freies Ende, beide Ränder eines
      Durchgangs) läuft sie in den letzten Busch hinunter. (86j spannte sie fälschlich über den Weg – zurückgenommen.)
- [x] 86l: Nutzer-Idee: keine Kette, nur kleine Leuchtpunkte – gleichmäßig an festen Stellen (je ⅛ Kante) in leichtem Auf und Ab,
      nachts leuchtend. Kein Draht → keine Probleme an Ecken, Durchgängen und Enden.
- [x] 86m: Punkte auf der Mittellinie wurden teils von den Büschen des nächsten Stücks verdeckt (ungleichmäßig). Jetzt trägt jeder
      Busch vorn denselben kleinen Lichterbogen (4 Punkte) – gleichmäßig, keine gerade Linie, mit dem Busch gezeichnet.
- [x] „Das ist neu“: neue Kennung `2026-10-05-wilmer` (Wilmerhecke, Hauptbahnhof, Kap, Schloss und Wege).

## Block 87 – Mauerenden schlanker (05.10.2026)
- [x] Freie Mauerenden hatten denselben dicken Pfeiler wie ein Tor (1,45 × Mauerbreite, hoch, breiter Deckstein) – wirkte klobig.
      87b: Der schlanke Pfeiler war kaum anders (Nutzer sah keinen Unterschied). Jetzt endet die Mauer gerade, ohne Pfeiler –
      nur „Laternen“ hat oben am Ende eine Laterne. Torpfeiler an Durchgängen bleiben.
- [x] 87c: Endpfeiler doch wieder, aber schlank: Enden und Tore gleich (`wallPillarR` 1,25 × Mauerbreite, niedriger, kleiner
      Deckstein). Torpfeiler auf den Feldecken (`gateT` = 0); jede Mauer, die dort ankommt – auch um die Ecke –, hört am Pfeiler
      auf (`mauerGateAt`), statt in ihn hineinzulaufen und sich darüberzumalen. Test: mauerpfeiler.test.js.
- [x] 87e: Zaun/Hecke, die an einem Mauer-Torpfeiler enden, liefen in ihn hinein (Zaun mit Pfosten vorn auf dem Pfeiler). Jetzt
      hören alle Linien am Pfeiler auf (`mauerGateAt` liefert dessen halbe Breite), der Zaun ohne eigenen Pfosten dort.
- [x] 87f: Hinterer Torpfeiler lag auf der Mauer, die von ihm nach vorn weitergeht (das Torstück zeichnete ihn nach ihr). Jetzt
      zeichnet `gatePillarsAt` die Torpfeiler am Eckpunkt: nach den Stücken, die dort enden, vor denen, die dort beginnen.
- [x] 87d: Gartentür lag vor dem vorderen Pfeiler – Durchgang jetzt von hinten nach vorn gezeichnet (hinteres Stück/Pfosten,
      Tür, vorderes Stück/Pfosten, Bogen).

## Block 88 – Rathaus-Uhrturm (05.10.2026)
- [x] Der Uhrturm begann auf halber Dachhöhe und wurde vor das Dach gemalt – er schwebte wie ein Kasten auf der Dachfläche.
      Jetzt beginnt er an der Traufe, die vorderen Dachflächen verdecken seinen Fuß (Ausschnitt), er ragt deutlich über den
      First, Zierkante oben, Uhren auf allen sichtbaren Seiten. In allen vier Drehungen angesehen.
- [x] 88b: Gefiel nicht (zu hoch, dünn, gestelzt). Gewählt: „wie früher, nur sauber“ – Turm wieder in alter Größe, Oberkante
      und Uhrenhöhe; das Rathausdach ist flacher (`RH_ROOF` 11 statt 18), so ragt der Turm von selbst heraus.
- [x] 88c: Passte nicht (spitzes Dach + aufgesetzter Turm). Nutzer-Idee umgesetzt: Walmdach mit flacher Spitze – die Dachflächen
      laufen auf ein Plateau so groß wie der Uhrturm zu, der Turm steht bündig darauf (kein Ausschneiden mehr).
- [x] 88d: Dach flacher (`RH_ROOF` 10), Turm länger (Schaft 19, nach Wunsch minimal tiefer als 22), Uhren im oberen Drittel.

## Block 89 – Buschfarben (05.10.2026)
- [x] Büsche und Wilmerhecke farbig (`BUSH_COLS`): Grün, Hellgrün, Dunkelgrün, Blaugrün, Olivgrün gleich frei; Ahornrot, Herbstorange,
      Goldgelb, Rosa, Blutbuche, Weiß bereift in der Kunstakademie (Gruppe „Büsche“). Gilt für den kleinen Busch, seine Größen
      (Busch, Buschgruppe) und alle drei Wilmerhecken; Blüten und Lichter bleiben.
- [x] Im Fenster (Busch, Busch-Feld, Wilmer-Heckenstück): Farbfelder, „für alle anderen übernehmen“, „neu gebaute bekommen diese
      Farbe“ (`state.paintNew.busch` / `.hecke`), mit ↶. Beim Bauen: Farbchips in der Musterleiste. Bau-Vorschau in der Farbe.
- [x] Gespeichert (Deko `col`, Linie `col`), Bildchen weit weg kennen die Farbe. Nebenbei: geschenkte Parkbäume (`free`, 84b)
      gingen beim Speichern verloren – jetzt gespeichert. Testwelt freizeitpark: Abschnitt „Buschfarben“ bei (36, 62).
      Test: buschfarben.test.js. Nachtrag: Farbe der Busch-Felder in `tileOut` und im Bildchen-Schlüssel.

## Block 90 – Universität Stufe 3 (05.10.2026)
- [x] Stufe 3 hieß „Sternwarte“ und hatte eine kleine Sternwarte auf dem Gelände – doppelt zum Wunderwerk Sternwarte. Jetzt
      „Universitätscampus“, statt der Mini-Sternwarte eine Gelehrten-Statue (Bronze, mit Buch) im Brunnen mit kleinen Fontänen.

## Block 91 – Vorplatz bzw. Weg zur Tür (05.10.2026)
- [x] Liste aller Gebäude mit Tür: ohne Weg zur Tür waren Uni, Bibliothek, Kunstakademie, Kino, Passage, Theater, Konzerthalle,
      Aquarium, Zoo, Reihenhäuser und alle Werkstätten (Mühle, Holzfäller, Fischerhütte, Steinbruch, Bergwerk, Kristallmine,
      Steinmetz, Schmiede, Sägewerk, Bäckerei, Werkstatt, Wasserrad).
- [x] Liegt ein Weg vor der Tür, führt jetzt ein Belag im Stil des Wegs bis zur Tür: schmaler Weg bei kleinen Werkstätten,
      Platz bei den größeren (`COURTS`). Ohne Weg bleibt Wiese. Im Fenster „🧱 Vorplatz“ / „🌿 Weg zur Tür“ an/aus und „Belag“
      (wie der Weg oder ein freigeschaltetes Wegmuster, `t.vp`), mit ↶, gespeichert. Gilt auch für den Gartenweg der Häuser.
- [x] Gebäude mit festem Platz (Rathaus, Museum, Kaufhaus, Markthalle, Möbelhaus, Hotel, Grandhotel) folgen derselben Regel:
      mit Weg davor im Belag des Wegs, wählbar, abschaltbar (Wiese); ohne Weg und ohne Wahl wie bisher. Rathaus: im Reiter „Ort“.
- [x] Zoo: Eingangstor mit grünem „ZOO“-Schild neben dem Kassenhaus, Zaun auch vorn.
- [x] Testwelt freizeitpark: Abschnitt „Vorplätze“ bei (36, 72). Test: vorplatz.test.js.
- [x] 91b: Holzhof (Sägewerk), Werkstatt, Bibliothek, Kunstakademie und Kaufhaus nur ein Weg zur Tür statt Platz; Museum nur ein
      Weg in Treppenbreite (Seiten Wiese). Plätze schmaler bei Hotel, Kino, Theater, Konzerthalle, Aquarium, Möbelhaus,
      Grandhotel (dort auch unter den Brunnen Belag statt Rasen). Reihenhäuser: je Tür ein Weg, die Büsche stehen dazwischen.
      Universitätscampus: Brunnen weiter herein (ganz auf dem Platz). Zoo: Weg zur Kasse und ein eigener Weg durchs Tor
      (Tor auf die Wiesenseite, Schild der Kasse auf die andere). Vorplätze können aus mehreren Stücken bestehen (`parts`).
- [x] 91c: Zoo-Schild gerade (Tafel zum Betrachter, Pfosten bis darunter). Passage: Platz schmaler. Holzhof: Weg so breit wie
      die Tür. Bergwerk/Kristallmine: Weg genau vor dem Stollen, Schienen und Lore fahren gerade darauf heraus; ab Stufe 3
      (Kristallschleiferei, großes Bergwerk) ein kleiner Hof bis zur Tür des Hauses davor (`s3`). Trittsteine zur Tür so groß
      und im selben Takt wie am Weg, ein Stein auch auf dem Wegfeld (auch beim Gartenweg der Häuser).
- [x] 91d: Möbelhaus mit Vorplatz ohne Sofa davor. Museum und Kaufhaus haben ohne Weg vor der Tür keinen alten Platz mehr (auch
      gedreht, `bare`) – nur Wiese; mit Weg der Weg zur Treppe bzw. Tür. Bildchen im Baumenü zeigen sie wie bisher.

## Block 92 – Hilfe am Ort (06.10.2026)
- [x] Problem: Viele fragen „Wo kriege ich Metall her?“, „Was ist ein Marktplatz?“ – die Erklärungen standen nur im Menü.
- [x] Alles mit einem kleinen ? ist antippbar und öffnet eine Sprechblase direkt daneben (js/help.js, `data-help`):
      Material im Bau-Infofenster, in den Ausbaukosten (Betriebe, Wunderwerke, Laternen), „Fehlt noch“ beim Hausausbau,
      Rohstoffe im 📦 Lager („Woher“: ganze Kette, z. B. Metall ← Schmiede ← Erz ← Bergwerk am Erzberg), jeder Wunsch im
      Hausfenster (was ist das, wie erfüllt man es), Viertel/🐌/Strom in den Statuszeilen. Knöpfe: „Zeig mir“/„Bauen“ wählt
      das Gebäude zum Bauen (gesperrt: dorthin, wo man es freischaltet), „📚 Mehr“ öffnet den Eintrag im Nachschlagen.
- [x] ☰ → 📚 Nachschlagen: Suche über Begriffe (`TERMS`), Wünsche (`WISH_HELP`), Rohstoffe und alle Gebäude (aus den
      Spieldaten: Beschreibung, Tipp, Kosten, was es liefert, wo im Menü, Freischaltung), mit „Bauen“.
- [x] Anleitung und „Das ist neu“ erwähnen es. Test: hilfe.test.js.
- [x] 92b: Antippbares nicht mehr unterstrichen – nur das kleine ? zeigt es an (Antippen weiter auf der ganzen Zeile).

## Block 93 – Online-Speicher, Stufe 1 (06.10.2026)
- [x] Freiwillig anmelden (☰ → ☁️ Online-Speicher): „Mit Google anmelden“ oder Anmelde-Link per E-Mail (ohne Passwort).
      Firebase-Projekt `fnymiland` (Spark, kostenlos), Realtime Database europe-west1. Firebase lädt erst bei Bedarf (gstatic).
- [x] Ablage `users/<uid>`: `meta` (rev, Kurzbeschreibung), `save` (ganzer Stand als Text), `bindex`/`backups` (frühere Stände, max. 10).
      Hochgeladen wird nach eigenen Aktionen (höchstens alle 2 Minuten) und beim Verlassen der Seite – immer nur gegen die
      Version, die das Gerät kennt (Transaktion auf `meta.rev`).
- [x] Regeln: Eine leere Welt überschreibt nie eine bespielte (neues Gerät holt die Cloud). Zwei verschiedene Stände →
      Rückfrage mit beiden (Insel, verdient, bebaut, zuletzt gespielt); der andere wird vorher gesichert. Eine andere Insel
      (neu begonnen, Datei geladen) ersetzt die in der Cloud erst, nachdem die alte gesichert ist. Frühere Stände zurückholen.
- [x] Test: cloud.test.js (mit Cloud-Attrappe). Offen: Stufe 2 (ein Gerät führt), Stufe 3 (Live-Spiegel, Besuchen).
- [x] 93b: Änderungen kamen auf dem anderen Gerät nicht an (hochgeladen erst nach 2 Minuten, das andere Gerät sah nur beim
      Zurückkehren nach). Jetzt: hochladen ~6 s nach der letzten Aktion (bei Dauerbauen spätestens alle 45 s, nie öfter als
      alle 10 s); andere Geräte horchen live auf `meta` und übernehmen sofort, wenn sie selbst nichts geändert haben (Blick bleibt).
- [x] 93c: Prüfung vor dem Veröffentlichen – gefunden und behoben:
      • Änderungen ohne ↶ (Farben, Forschung, Erlasse …) zählten nicht → Fingerabdruck des Stands (`worldSig`) erkennt jede.
      • Zwei Uploads gleichzeitig (Takt + Seite verlassen) → Rückfrage gegen sich selbst → Warteschlange (`cloudRun`).
      • Was während des Hochladens gebaut wurde, galt als hochgeladen → Aktionen zählen weiter.
      • Upload unterbrochen (Version beansprucht, Stand nicht geschrieben) → Endlos-Warten bzw. Rückfrage → still nachholen;
        stirbt ein anderes Gerät mittendrin, gilt nach 3 Versuchen der letzte ganze Stand.
      • Jede Live-Übernahme legte eine Sicherung an (verdrängte die echten) → nur noch, wenn hier etwas Ungesichertes war.
      • Testwelt konnte sich anmelden und die echte Insel ersetzen → in Testwelt/Probeansicht kein Online-Speicher.
      • Spiel in zwei Tabs: einer hätte Veraltetes hochgeladen → der zweite lädt nichts mehr hoch und sagt es.
      • Ohne Netz hing Firebase endlos → Zeitgrenze; angemeldet bleibt man auch, wenn der erste Abgleich scheiterte.
      Datenbank von außen geprüft: ohne Anmeldung kein Lesen/Schreiben. cloud.test.js: 21 Fälle.

## Block 94 – Online-Speicher, Stufe 2: ein Gerät führt (06.10.2026)
- [x] `users/<uid>/lead { dev, name, at, req }`: Nur das führende Gerät rechnet (Taler, Forschung, Ereignisse), baut und lädt
      hoch. Andere Geräte schauen live zu (`cloudWatching`): Band „👀 Gerade wird auf dem iPhone gespielt · Hier weiterspielen“,
      Bauen/↶ gesperrt (Hinweis), Basteleien ohne ↶ werden auf den Stand des führenden Geräts zurückgesetzt.
- [x] „Hier weiterspielen“: Bitte an das führende Gerät (`req`) → es sichert und übergibt; antwortet es nicht (6 s), übernimmt
      das neue selbst. Hintergrund/gesperrt: sichern und freigeben – das nächste offene Gerät führt von selbst. Herzschlag alle
      15 s; meldet sich die Führung 45 s nicht (Serverzeit), gilt sie als verwaist und wird übernommen.
- [x] War ein Gerät offline führend und wurde abgelöst: Rückfrage statt Überschreiben; „Dieses Gerät“ übernimmt die Führung.
- [x] Gerätename aus dem Browser (iPhone, iPad, Mac, …). Online-Speicher-Fenster zeigt, wo gespielt wird. cloud.test.js: 29 Fälle.
- [x] 94b: Prüfung von Stufe 2 – gefunden und behoben:
      • „Führen, wenn frei“ des führenden Geräts (z. B. beim Zurückkommen) löschte eine offene Bitte „Hier weiterspielen“ →
        das andere Gerät bekam die Führung nie. Jetzt bleibt die Bitte stehen.
      • Gab das führende Gerät kurz ab (Mitteilung angeschaut, App gewechselt), schnappte sich ein unbeachtet daneben
        stehendes Gerät die Führung. Jetzt übernimmt nur, wer in der letzten Minute angefasst wurde oder gerade geöffnet wird.
      • Abmelden ließ die Führung 45 s blockiert → wird freigegeben. Tab zu / Netz weg: Firebase gibt die Führung sofort frei
        (onDisconnect), nicht erst nach 45 s.
      • ↶ war beim Zuschauen nicht gesperrt. Die Zweites-Fenster-Sperre hätte auch das führende Fenster angehalten.
      cloud.test.js: 32 Fälle.
- [x] 94c: Anmeldung per E-Mail-Link entfernt – im kostenlosen Firebase-Tarif gehen nur 5 solche Mails am Tag raus (für das
      ganze Spiel). Nur noch Google. Grenzen notiert: 100 gleichzeitige Verbindungen, 1 GB Speicher, 10 GB Download/Monat.

## Block 95 – Online, Stufe 3: Live-Spiegel, Besuchen, Freundescodes (06.10.2026)
- [x] Live-Spiegel (js/live.js): Das führende Gerät schreibt seine Insel Feld für Feld nach `worlds/<wid>` (Felder, Deko,
      Linien, Gelände je Schlüssel, Rest als Text) und `users/<uid>/live` (Taler/Lager/Ideen alle 2 s, Privates). Gesendet
      wird nur Geändertes (ein Feld ≈ 200–500 Byte). Zuschauende Geräte horchen darauf und übernehmen Feld für Feld (ohne
      alles neu aufzubauen, Bewohner laufen weiter); der ganze Stand wird nur noch beim ersten Öffnen geladen.
- [x] Besuchen: `?besuch=<wid>` zeigt eine Insel live, nur ansehen (kein Bauen, keine Taler/Lager/Forschung, keine Leiste),
      speichert nichts – die eigene Insel im Browser bleibt unberührt. „🏠 Meine Insel“ führt zurück.
- [x] ☰ → 👥 Freunde & Besuch: eigener Freundescode `FNYMI-XXXXX` (codes/<code>, ohne 0/O/1/I/L), Code eingeben → Anfrage,
      annehmen/ablehnen, Freunde besuchen/entfernen, Anfragen zurückziehen. Besuchs-Link an/aus, teilen, „Neuen Link machen“
      (alter geht nicht mehr, Freunde bekommen den neuen). Freunde dürfen immer besuchen, der Link nur bei „Besuche erlaubt“.
- [x] Datenbank-Regeln: firebase-rules.json (in der Firebase-Konsole unter Realtime Database → Regeln einfügen).
- [x] Tests: live.test.js (11 Fälle). Offen (eigener Block): was Freunde zusätzlich dürfen (Herzchen, Gästebuch, Geschenke).
- [x] 95b: Prüfung von Stufe 3 – gefunden und behoben:
      • „Neuen Link machen“ auf einem Gerät, das nicht führt: Das führende schrieb weiter an die gelöschte alte Kennung,
        die Datenbank lehnte jedes Schreiben still ab → Spiegel tot. Jetzt: Schreiben schlägt fehl → Kennung neu lesen,
        alles neu schreiben; zuschauende Geräte verbinden sich unter der neuen Kennung neu.
      • „Besuche an/aus“ wurde beim kompletten Neuschreiben vom Wissensstand des schreibenden Geräts überschrieben.
      • Ein neu führendes Gerät konnte vor seinem Abgleich alte Taler in den Spiegel schreiben → erst nach dem Abgleich.
      • Zuschauend und den ganzen gesicherten (älteren) Stand bekommen → Spiegel und Insel liefen auseinander → danach
        gilt wieder der Spiegel; Basteleien beim Zuschauen werden auf den Spiegel zurückgesetzt (ohne 250-KB-Download).
      • Neuer Link: eine kaputte Freundschaft ließ das Löschen des alten Links scheitern → alter Link zuerst, Freunde einzeln.
      • Zweite Anfrage an dieselbe Person scheiterte mit Fehler → freundlicher Hinweis.
      live.test.js: 17 Fälle.
- [x] 95c: Als Besucher ließ sich die Hausfarbe ändern (nur in der eigenen Ansicht, nichts gespeichert – aber verwirrend).
      Beim Ansehen (Besuch, zuschauendes Gerät) sind Farbfelder, Aussehen und Ausbau-Knöpfe ausgeblendet, alle anderen
      ändernden Knöpfe im Fenster gesperrt (Hinweis); Schließen und ? gehen weiter.

## Block 96 – Freunde auf der Insel (06.10.2026)
- [x] Spielfigur: jeder Angemeldete wählt unter 👥 sein Tier (users/<uid>/profile/animal, sonst zufällig).
- [x] Besucher als Figur: Freunde, die zu Besuch sind, stehen als ihr Tier mit Namensschild dort, wo sie gerade hinschauen
      (worlds/<wid>/guests/<uid>, alle 2 s bei Bewegung, verschwindet beim Gehen – onDisconnect). Besitzer, zuschauende
      Geräte und andere Besucher sehen sie live; der Besitzer bekommt „🐰 Ben ist zu Besuch!“.
- [x] Herzchen & Gästebuch (nur Freunde): Band beim Besuch „❤️“ (einmal je Insel und Tag) und „📖“ (20 feste Sätze, 12 Sticker,
      höchstens 3 am Tag). Besuche werden einmal am Tag eingetragen. Besitzer: Rathaus → Reiter „Besuch“ (Herzen, Gästebuch mit
      ✕ zum Entfernen, wer da war), Punkt am Rathaus-Knopf bei Neuem, Hinweise beim Eintreffen.
- [x] Päckchen & Briefkasten (nur Freunde): 👥 → 🎁 beim Freund, Rohstoffe wählen, gehen sofort aus dem Lager ab (klappt das
      Schicken nicht: zurück), höchstens 5 am Tag je Freund. Briefkasten am Rathaus (rotes Fähnchen hoch bei Post), Antippen
      des Rathauses führt dann zum Reiter „Besuch“; Abholen per Transaktion – genau einmal, dann ins Lager. Nur auf dem
      führenden Gerät.
- [x] Datenbank-Regeln erweitert (firebase-rules.json: guests, book, mail mit Prüfungen). Test: friends.test.js (8 Fälle).
- [x] 96b: Teilen tat im WLAN (http://) nichts – dort gibt es kein Teilen-Menü und keine Zwischenablage, der Fehler wurde still
      verschluckt. Jetzt: Teilen-Menü → Zwischenablage → altes Kopieren → Fenster mit dem Link zum Selbst-Kopieren. Beim
      Besuchs-Link nur die Adresse, ohne Text davor.

- [x] 96c: Besucher-Figur folgt nicht mehr der Kamera (unnötig viel Datenverkehr), sondern spaziert wie ein Bewohner selbst
      über die Insel, Start am Rathaus. Übertragen wird nur einmal beim Kommen { a, n, x, y, look }; jedes Gerät lässt die
      Figur selbst laufen. Figur gestalten (👥 → „Deine Figur“, mit Vorschau): Tier, Fell, Shirt, Kopf (Strohhut, Mütze,
      Krone, Blume, Schleife, Zylinder), Brille/Sonnenbrille – users/<uid>/profile/look, Unsinn wird beim Lesen verworfen.
      „Herz geben“ tat scheinbar nichts: der Hinweis lag unter dem Besuchs-Band (jetzt tiefer); dazu klare Meldungen
      („heute schon“ wird gemerkt, Fehler sagt jetzt „Regeln alt?“/„keine Verbindung?“). Regeln unverändert.

## Block 97: Deine Figur auf der eigenen Insel (06.10.2026)
- [x] Du läufst als Bürgermeister·in über die eigene Insel (js/me.js): Start vorn am Rathaus, bummelt gern über Wege,
      geht öfter zum Rathaus zurück und schaut sich neu Gebautes an („Oh, was Neues! ✨“). Mit Namensschild; ausblendbar.
- [x] Helfer: Antippen → Sprechblase + Fenster mit dem, was gerade dran ist (Schritt der Einführung, Material für die
      nächsten Laternen, das niemand herstellt – mit „Woher?“, was ausgebaut werden kann, häufigster Wunsch). Alle 3–5
      Minuten meldet sie sich von selbst, wenn sie zu sehen ist und es etwas Wichtiges gibt (nicht bei „Tipps aus“).
      Sprechblasen brechen jetzt um und bleiben bei langen Sätzen länger.
- [x] Rathaus → „Deine Figur“ (ohne Anmeldung, im Spielstand `state.me`): Name, Tier, Fell, Shirt, Kopf, Gesicht, Körper,
      Hand, mit großer Vorschau. Neu: Blumenkranz, Kochmütze, Bauhelm, Piratenhut, Wikingerhelm; Schal, Fliege, Rucksack,
      Umhang; Ballon, Eistüte, Blumenstrauß, Laterne. Besonderes gibt es für Erfolge (🔒, Antippen sagt wofür).
- [x] Angemeldet wird die Figur ins Profil kopiert – bei Freunden sieht man genauso aus; die Figur aus Block 96c wird beim
      ersten Anmelden übernommen. Das Freunde-Fenster zeigt nur noch die Vorschau und führt ins Rathaus.
- [x] Besucher-Figuren starten ebenfalls vorn am Rathaus. „Das ist neu“ für das große Update (Figur, Online, Freunde).
- [x] strom.test „Windrad-Fenster“ hing vom Zufall ab (windiger Platz am Rand) – Gelände dort jetzt fest.
      Test: me.test.js (9 Fälle).
- [x] 97b: Gesperrtes antippen zeigt direkt unter der Reihe, wofür es das gibt (Erfolg und Stufe), wie weit man ist
      (Balken, „Du hast: 7.615 / 100.000“) und einen Knopf „⭐ Zu den Erfolgen“ – statt eines Hinweises, der hinterm Fenster unterging.

## Block 98: Aufgeräumt – drei feste Orte (06.10.2026)
- [x] Neuer Knopf oben mit dem Gesicht deiner Figur → Fenster „Du“: Figur · Erfolge · Album · Tagebuch · Freunde · ☁️ Online
      (gleiche Reiter in allen sechs; Punkt am Knopf bei neuer Tagebuchseite, Post oder Konflikt; Neues → gleich dorthin).
- [x] 🏛️ Rathaus nur noch Stadt: Übersicht · Zu tun (Bereit + Wünsche) · Bewohner · Inseln · Ort. Schnellknöpfe weg
      (außer Feuerwerk und Nächste Insel). Alte Ziele (Erfolge, Besuch, Figur, Bereit, Wünsche) leiten weiter.
- [x] Freunde an einem Ort: Briefkasten (wenn Post da ist) oben, dann Freunde, Anfragen, Code, Herzen, Gästebuch, Besuche,
      Besuchs-Link. Das Briefkasten-Fähnchen am Rathaus führt dorthin.
- [x] ☰ nur noch: ❓ Hilfe (ein Buch: Los geht's, Bauen, Wachsen, Steuerung, Tipps, Nachschlagen – oben eine Suche, die
      nach „Nachschlagen“ springt), Das ist neu, Zum Rathaus, Einstellungen, Spielstand.
- [x] Texte, die auf alte Orte zeigten, angepasst; „Das ist neu“ erklärt die neue Ordnung.
- [x] Nebenbei: Tagebuch-Knöpfe ragten auf dem Handy über den Rand; „Bildchen weit weg“-Test wärmt jetzt mehrere
      Bilder vor (je Bild nur 6 ms Bildchen-Zeit – unter Last schlug er sonst fehl).
      Test: ordnung.test.js (5 Fälle), alte Tests auf die neuen Orte umgestellt.

## Block 99: „Das ist neu“ als Versionsübersicht (06.10.2026)
- [x] `NEWS_HISTORY`: alle Updates seit dem 29.09. (aus der Git-Geschichte, Doppeltes zusammengelegt, Texte an die neuen
      Orte angepasst) – 10 Einträge mit Datum und Titel.
- [x] Wer mehrere Updates verpasst hat: „Seit du zuletzt hier warst, gab es 7 Updates“ – das neueste aufgeklappt, die
      älteren als Überschrift zum Antippen. Unbekannter/sehr alter Stand: alle. ☰ → Das ist neu: ganze Geschichte,
      Verpasstes als „neu für dich“ markiert. Test: news.test.js (+4 Fälle).
- [x] 99a: „youNews is not defined“ beim Start im WLAN: main.js startete die Spielschleife, bevor die Skripte danach
      (cloud, live, friends, me) geladen waren – auf schnellem localhost nie zu sehen. Schleife startet jetzt erst bei
      DOMContentLoaded (structure.test prüft das).

## Block 100: Wegflächen ohne Lücken und Striche (06.10.2026)
- [x] Grüne Zwickel vor dem Rathaus: Wege füllen die Ecke zwischen zwei Feldern nur, wenn das 2×2-Quadrat ganz Weg ist –
      am Rathaus-Grundstück nie. Das Rathaus zählt jetzt mit (`quadPaved`, es ist ja selbst ein Arm der Wege).
- [x] „Ganz breit“-Striche: (1) Punkt- und Steinmuster lagen je Feld in eigenem Raster – an jeder Kante blieben halbe
      Steine stehen. Jetzt ein Raster über die ganze Insel, Steine auf der Kante zeichnen beide Felder gleich.
      (2) Breites Feld neben schmalem zog Bordstein-Stücke mitten in die Fläche: auf Kanten-Hälften, wo der schmale
      Nachbar seine Ecke ohnehin voll füllt, kein Bordstein mehr.
- [x] Rathausplatz: Seiten, die ganz von Weg umgeben sind, laufen bis an die Grundstücksgrenze (ohne Bordstein-Linie,
      `courtOpenSides`). Test: wegflaeche.test.js (4 Fälle).

## Block 101: Tageszeit – gemeinsame Spieluhr (06.10.2026)
- [x] Vorher: 20-Minuten-Tag ab dem Öffnen (immer morgens), nur 3 Minuten Nacht – wer kürzer als 15 Minuten spielte, sah
      nie eine Nacht; jedes Gerät hatte seine eigene Zeit; die Rathausuhr drehte sich einfach.
- [x] Jetzt: 1 Minute = 1 Spielstunde, aus der echten Zeit (`gameHour`) – läuft weiter, wenn die App zu ist, auf allen
      Geräten und bei Besuchern gleich. Tag 6–19, Dämmerung 19–21, Nacht 21–5, Morgengrauen 5–6 (ein Drittel Nacht).
      Bewohner: morgens 5–11, mittags 11–15, abends 15–21, nachts 21–5.
- [x] Anzeige: oben am Ortsnamen ☀️/🌅/🌙/🌄 mit Uhrzeit (Handy: nur das Symbol), Rathausuhr und Gebäude-Uhren zeigen die
      Spielzeit, Rathaus → Übersicht: „22:10 Uhr · Nacht – in 7 Minuten wird es hell“ und was es nachts zu sehen gibt.
- [x] Fehler: Sternschnuppen der Sternwarte kamen nie (Schwelle 0,5 über der dunkelsten Nacht 0,45). Test: tageszeit.test.js.

## Block 102: Fehlerprüfung vor dem großen Push (06.10.2026)
Vier Prüfer (Freunde/Online, Figur/„Du“, Ordnung/Hilfe/Leiste, Wege/Uhr), jeder Fund selbst nachgeprüft:
- [x] Neuer Besuchs-Link: die neue Welt war für Nicht-Freunde zu (open fehlte); „Besuche an“ vor dem ersten Schreiben
      scheiterte an den Regeln (owner fehlte).
- [x] Freundescode überschrieb das ganze Profil (Figur weg); Kontowechsel am selben Gerät behielt Code, Freunde, Link
      (`socialReset`); Besucher-Figur verschwand nach kurzem Verbindungsabbruch (jetzt alle 45 s neu gemeldet); nach
      neuem Link sah man die Besucher nicht mehr; Doppeltipp schickte zwei Päckchen; Freunde/Online-Fenster sprangen nach
      dem Laden wieder auf und verloren Eingaben; erster Gästebuch-Eintrag ohne Hinweis; alte Besuche/Herzen werden nach
      60 Tagen aufgeräumt; Datenbank-Regeln mit festen Feldern und Längen.
- [x] Figur aus dem Profil machte aus „anderes Gerät übernehmen“ einen Konflikt (zählte als eigene Änderung) – jetzt nur
      angezeigt (`meProfileLook`), gespeichert erst beim eigenen Einstellen. „Neue Insel“ behält die Figur. Rathaus mit
      Post öffnet wieder das Rathaus (Hinweis mit Knopf). Sprechblase verschwindet mit der Figur. Startfeld ganzzahlig.
      Zuschauendes Gerät: Figur ändern meldet sich.
- [x] Knopf „Du“ brauchte auf dem iPad zwei Tipps (fastTap fehlte). Leiste brach auf Handys um – jetzt Sonne/Mond statt
      Flagge, Knöpfe enger, bei ≤ 400 px kleinere Schrift (gemessen 375/390/430 px, auch mit Millionen). Hilfe-Suche baut
      das Feld nicht mehr neu (iPad-Tastatur bleibt), alte Suche wird nicht wieder vorgesetzt.
- [x] Sternschnuppen: beim Besuch/Zuschauen nicht einsammelbar; Chance so, dass es etwa 5 je Nacht sind (sonst +170 %
      Ideen). Bordstein neben Trittsteinen/Brücken wieder da; Asphalt-Mittelstreifen am Rathaus wieder da; Pflaster des
      Rathausplatzes im Insel-Raster (auch gedreht); Uhren (Rathaus, Hauptbahnhof, Uhrturm) zeigen Spielzeit auch von weitem;
      Morgengrauen sagt „in N Minuten ist es Tag“.
- [x] Hinweis an den Nutzer: firebase-rules.json neu in die Konsole einfügen. (21.10.2026: Konsole = Datei, verglichen)

## Block 103: Fenster mit Reitern bleiben gleich groß (06.10.2026)
- [x] Beim Klicken durch die Reiter änderte sich die Fenstergröße (Höhe nach Inhalt, Breite 420/520/560 je Reiter) – unruhig.
      Jetzt: Fenster mit Reitern (Rathaus, Du, Hilfe, Forschung) haben eine feste Höhe (680 px bzw. Bildschirm) und je Fenster
      eine feste Breite; gescrollt wird innen, die Reiterleiste bleibt oben stehen (`modalFrame`, Klasse `tabbed`).
      Neuer Reiter → nach oben, dieselbe Seite neu (Hut gewählt) → Scrollstand bleibt. Märchenschloss-Seitenfenster
      ebenso gleich hoch. Test: ordnung.test.js.
- [x] 103b: Schnelles Wischen (iPad) ließ die klebenden Reiter beim Nachfedern kurz verschwinden. Jetzt stecken Überschrift
      und Reiter fest im Fenster, nur der Bereich darunter scrollt (`frameHtml` packt ihn in `.tab-scroll`, beim
      Live-Auffrischen bleibt er dasselbe Element samt Scrollstand). Märchenschloss-Seitenfenster: Reiter scrollen normal mit.

## Block 104: Nur noch 3 frühere Stände (06.10.2026)
- [x] Frühere Stände (Sicherungen vor dem Ersetzen) von 10 auf 3 – jede ist ein ganzer Spielstand (bis 500 KB), der
      kostenlose Firebase-Tarif hat 1 GB für alle. Ältere von früher räumt das Online-Fenster beim Öffnen weg.
      Test: cloud.test.js.

## Block 105: Füreinander – Wunschzettel, Freundschaft, Partnerstadt (06.10.2026)
- [x] 📌 Wunschzettel (Rathaus → Übersicht): ein Wunsch (Material + Menge, Vorschlag aus den nächsten Laternen) unter
      `worlds/<wid>/wish`. Freunde sehen ihn in ihrer Freundesliste, „🎁 Helfen“ füllt die fehlende Menge vor, das Päckchen
      trägt `wish: true`. Abholen füllt den Wunsch (Balken, „erfüllt!“) und schickt automatisch ein „💛 Danke“ ins
      Gästebuch des Helfers (`book/<helfer>/d_…`).
- [x] 💛 Freundschaftsstufen: Punkte je Freund unter `users/<uid>/bonds/<freund>` (eigene Sicht). Besuch +1, Herz +1,
      Gästebuch +2, Päckchen +2, Wunsch-Hilfe +3; Empfangenes aus dem Gästebuch per Transaktion mit „seen“ (zählt einmal).
      5 Herzen bei 3/10/25/50/100 Punkten. Höchste Stufe in `state.bond` (wird nie kleiner) schaltet frei:
      2 ♥ Freundschaftsband, 3 ♥ Herzballon (Figur), 4 ♥ Freundesbank, 5 ♥ Freundschaftsbaum (Deko).
- [x] 🚩 Partnerstadt (`state.partner`): Flagge des Freundes neben der eigenen am Rathaus, im Rathaus unter „Ort“.
      Flaggen kommen über `fr/<freund>/<ich>/flag` (wird beim Öffnen von „Freunde“ aufgefrischt) bzw. aus seiner Insel.
      Freundesschiffe: alle 5 Minuten legt für 2 Minuten ein Boot mit der Flagge eines Freundes am Hafen an (nur Bild).
- [x] Gefunden beim Testen: „Freunde“ zweimal kurz hintereinander geöffnet – der ältere Aufruf überschrieb den neueren
      (jetzt Aufruf-Nummer); geschlossen und wieder geöffnet – Fenster blieb unsichtbar (alter Inhalt lag noch im DOM).
- [x] Regeln: worlds/<wid>/wish, Gästebuch-Art 'd', Päckchen-Feld wish. Test: fuereinander.test.js (5), friends.test.js.
- [x] Fehlerprüfung Block 105: Freunde-Fenster sprang nach dem Schließen bei jeder Änderung der Freundesliste wieder auf (mit
      dem Flaggen-Auffrischen bei allen Freunden – wanderte durch den Freundeskreis); Partnerstadt verriet Name/Kennung des
      Freundes an Besucher (jetzt öffentlich nur die Flagge); Flaggen fremder Spieler streng geprüft (#rrggbb + festes
      Symbol, sonst CSS-Injektion); Freundschaftsstufe nach Laden/Übernehmen wiederhergestellt; Wunsch beim Abholen per
      Transaktion in der Cloud gefüllt; Wunsch per Abruf statt Beobachtung, zieht beim neuen Link mit; Danke-Einträge nach
      60 Tagen weg; Besuchspunkt nur bei geklapptem Eintrag; Regeln: Flagge geprüft, Gästebuch-Zeit nicht in der Zukunft.


## Block 106: Stadtschmuck in Formen und Farben, Online-Knopf (06.10.2026)
- [x] ⛲ Brunnen (alle Größen): Etagenbrunnen (Standard, auch für bestehende), Fontäne, Fischbrunnen, Blumenbrunnen.
      Kristallbrunnen neu: achteckiges Becken, Kristallkrone, leuchtende Kaskade, mehr Funkeln.
- [x] 🏮 Laternen: Gaslaterne, Kandelaber, Lampion, Pilzlaterne, Stablaterne × 8 Farben (Mast/Gestell). 🪑 Bänke: Parkbank,
      Gartenbank, Steinbank, Picknicktisch, Rundbank × 8 Farben. Je 2 Formen und 4 Farben frei, der Rest in der
      Kunstakademie (mit Vorschaubild). `DECO_LOOKS` (data.js), `t.form`/`t.col` an Deko und Feld, Wahl für neu Gebautes in
      `state.paintNew[b]` (parseSave lässt col/form jetzt durch – vorher ging dabei auch die Buschfarbe beim Laden verloren).
      Zeichnen in js/draw-schmuck.js. Leiste beim Bauen: Formen mit Vorschaubild + Farben; Fenster: umstellen, auf alle
      gleichen übertragen, „Neu gebaute bekommen das“.
- [x] Gruppe „🪑 Platz“ heißt „🏮 Stadtschmuck“.
- [x] 🌐 Eigener Knopf oben: Freunde · ☁️ Speicher (`openNet`, `NET_TABS`, Punkt bei Post/Gästebuch, Konflikt öffnet gleich
      den Speicher). „Du“ behält Figur, Erfolge, Album, Tagebuch; alte Wege (openYou('freunde'|'online')) leiten weiter.
      Leiste bei 375/390/430 px gemessen, bis 999 Mio. einzeilig. Test: schmuck.test.js (6), ordnung.test.js.
- [x] Fehlerprüfung Block 106: Leiste auf 360/375 px mit Millionen wieder einzeilig (Symbol-Knöpfe schmaler, ≤ 370 px
      kleinere Schrift); Bau-Vorschau großer Brunnen zeigt die gewählte Form; Spaziergänger setzen sich nicht in
      Rundbank/Picknicktisch; Vorschaubild ohne Canvas bleibt leer statt „url(undefined)“.


## Block 107: Schiffe fahren nicht mehr auf Schienen (06.10.2026)
- [x] Schiffe hielten jedes Wasserfeld für befahrbar – auch unter Schienen- und Wegbrücken – und fuhren bei langen Brücken
      sichtbar auf den Schienen entlang. Jetzt: unter einer Brücke nur quer durch (nie längs, nie schräg), Kurven und
      Kreuzungen über dem Wasser gesperrt (`seaCross`/`seaStep` in seaSearch, `seaSight` kürzt nie über Brücken ab).
      Seewege werden neu berechnet, sobald sich Brücken über dem Wasser ändern (`seaBridgesCheck` in recalc).
      Test: schiffe-bruecken.test.js.
- [x] 107b: Beim Durchfahren lag das Schiff trotzdem oben auf der Brücke – Schienen und Wegbrücken gehören zum Boden und
      werden vor allem anderen gezeichnet. Jetzt wird das Brückenstück über einem Schiff danach noch einmal gezeichnet
      (`drawBridgeOver`): die Fahrbahn liegt über dem Rumpf, Aufbau und Mast schauen darüber. Fischkutter kreisen nur, wo
      ringsum keine Brücke ist.



## Block 108: Bänke und Kunstakademie (06.10.2026)
- [x] Zwei Bänke an derselben Feldkante (z. B. Ecke rechts auf einem Feld, Ecke links auf dem Nachbarfeld) steckten
      ineinander, wenn sie längs zur Kante standen. Bänke haben jetzt je Form eine Tiefe und Länge (`BENCH_EXT`,
      `decoExt`); `slotPos` rückt sie je nach Drehung so weit nach innen, dass Lücke bleibt. `slotPos` bekommt dafür die
      Deko selbst (auch die Bau-Vorschau mit Drehung und Form). Test: schmuck.test.js.
- [x] Kunstakademie: nach dem Kauf sprang die Liste nach oben. `openModal` behält den Scrollstand, wenn dasselbe Fenster
      auf demselben Reiter neu gezeichnet wird (Reiterwechsel weiter nach oben).
- [x] Stadtschmuck in der Kunstakademie günstiger: die Laterne und alle Formen/Farben von Laterne, Bank und Brunnen kosten
      etwa 1 Minute Einkommen statt 3 (`schmuck: true` in DESIGN, `DESIGN_SCHMUCK`). Alles andere bleibt wie in Block 50.


## Block 109: Die Bahn wird gemütlich (06.10.2026)
- [x] Oberleitung entfernt: keine Masten, kein Fahrdraht, kein Stromabnehmer (`drawRailWire`, `WIRE_H` weg).
- [x] Gleis-Stile als Form der Schiene (`DECO_LOOKS.schiene`, `RAIL_LOOK`, `railLookOf`, `railTrim`): Schotter, Rasengleis
      (frei), Waldbahn, Pflastergleis, Blumengleis (Kunstakademie, Gruppe „Gleise“). Wählen in der Stilleiste, im
      Infofenster („Gleisbett“, auf alle übertragen); über bestehende Gleise ziehen stellt kostenlos um (`build`, `planCheck`).
      Brücken bleiben Holzbrücken.
- [x] 109b: Der Stil gilt jetzt auch auf Brücken (Gleisbett auf dem Holzdeck), und die Gleise im Hauptbahnhof nehmen je
      Gleis den Stil der Strecke davor an (`hbfTrack`, `gleisTiles(...).exit`); ohne Strecke Schotter.
      Dabei auch die Maße angeglichen: Spurweite, Gleisbett und Schwellen in der Halle waren doppelt so breit wie draußen.
- [x] Bahnhof: Blumenkästen, Kübel neben dem Eingang, Blumenampel und zwei Hängelampen (leuchten nachts) unterm Bahnsteigdach
      (`kPlanter`, `hangBasket`, `hangLamp`). Hauptbahnhof: Kübel an den Bahnsteigenden und am Portal, Blumenkästen zur Straße.
- [x] Fehler gefunden: `paintNewOf` gab alles aus `paintNew` an neu Gebautes weiter – auch eine nicht gekaufte Brunnenform.
      Jetzt nur Wand/Dach/Fenster; Formen/Farben laufen über `decoLookNew`. Test: bahn-gemuetlich.test.js.


## Block 110: Kein Seiten-Zoom auf dem iPad (06.10.2026)
- [x] Ein aus Versehen doppelt getippter Knopf (oder zwei Finger auf einem Fenster) zoomte die ganze Seite heran – Safari
      übergeht `user-scalable=no`. Jetzt: `touch-action: pan-x pan-y` auf html/body (Wischen in Fenstern und Leisten geht),
      `maximum-scale=1`, Safari-Gesten (`gesturestart/-change/-end`) und Trackpad-Zoom (Strg + Mausrad) über Fenstern
      abgefangen. Die Karte zoomt weiter selbst (#world: `touch-action: none`, Zeiger-Ereignisse). Test: kein-zoom.test.js.


## Block 111: Freunde – Name, Code, Neues präsenter (06.10.2026)
- [x] Freunde sahen den Google-Vornamen statt des gewählten Namens: Freundesliste (`frMyName`), Päckchen, Danke nutzen
      `myNick()` (Name auf dem Schild); umbenennen frischt den Namen bei allen Freunden auf (`frPushFlag`). Beim Besuch
      kommt der Name aus dem Profil (`users/<uid>/profile/name`, von `mePushProfile` geschrieben).
- [x] Freundescode: „FNYMI-“ steht fest vor dem Feld, man tippt nur die 5 Zeichen; ein eingefügter ganzer Code wird gekürzt.
- [x] Neues präsenter: Zahl am 🌐-Knopf statt Punkt (Päckchen + neue Einträge, hüpft sanft; „!“ bei Speicher-Konflikt) und
      die Karte „💌 Während du weg warst“ beim Öffnen (einmal, `welcomeBack`, wartet, bis kein anderes Fenster offen ist).
      Test: freunde-neues.test.js.


## Block 112: Reihenhäuser nachts von weitem (06.10.2026)
- [x] Weiter herausgezoomt (Bildchen, z < 1) sahen Reihenhäuser nachts zackig aus: Das Bildchen stanzte Schein und
      Fensterscheiben erst nach dem ganzen Haus – durch Blumenkästen, Rahmen und die eigenen Wände (live wird jedes Licht gleich
      gestanzt, und was danach kommt, deckt es wieder zu). Jetzt wie live: Schein vor dem Bildchen (`punchGlow(…, 'halo')`),
      dann das Bildchen, dann nur die Pixel, die darin wirklich noch Fensterlicht sind (`lightMask`, `litPx`); ohne Maske die
      ganze Scheibe wie bisher. Kristall-Schein (blau) unverändert darüber. Test: nachtlicht-bildchen.test.js.
- [x] Fehlerprüfung vor dem Push (4 Prüfer: Freunde, Stadtschmuck, Bahn/Schiffe, Darstellung) – behoben:
      - Nachtlicht von weitem: Lichtmaske erkannte Licht an der Farbe → abgeschattete Seiten (Glashaus, Botanischer Garten),
        Lichterketten, Fackeln blieben dunkel. Jetzt: Pixel, die sich seit dem Einschalten nicht verändert haben (`glowSnap`
        in eine Ablage, `lightMask` zugeschnitten, 2 Lesevorgänge je Bildchen).
      - Freundesbank war 2,2× so groß wie eine Bank (fehlte in `DECO_SCALE`) und ragte ins Nachbarfeld.
      - Antippen von Laternen/Bänken traf die Grundform statt der gewählten Form; Verschieben-Vorschau drehte nicht Drehbares.
      - Schiff unter Brücke: Deck übermalte Züge/Bewohner auf der Brücke und Schiffe, die schon durch waren.
      - Doppelgleis/breite Wegbrücke sperrte das Wasser ganz (Häfen in Buchten ohne Seeweg) → quer darunter durch; Seewege
        starten nicht in Brückenkurven; schräg nicht an Brückenecken vorbei; Seewege neu, wenn sich die Brückenrichtung ändert.
      - Strecke im neuen Stil verlängern stellte das Startgleis mit um; Planungstext nach Stilwechsel veraltet.
      - Freunde: eingefügte Teilen-Nachricht → falscher Code; Umbenennen erreichte Freunde erst nach Öffnen der Freundesliste;
        Karte zeigte beim ersten Mal die ganze Vergangenheit, erschien während des Abgleichs, merkte sich Geräte- statt
        Serverzeit; Zahl verdeckte das „!“ bei Konflikt; Besuchs-/Stufen-Zähler je Gerät statt je Konto; Insel-Kennung bei
        zwei Geräten gleichzeitig (jetzt per Transaktion); lange Kontonamen > 30 Zeichen.
      - Kleinigkeiten: Zahl am 🌐 auf dem Handy kleiner, Maus über der Karte vor dem Laden (Konsolenfehler), „Neu“-Text Strom.


## Block 113: Nichts mehr hinter Fenstern (06.10.2026)
- [x] Kurze Hinweise (Toast) hatten keine Ebene und lagen unter jedem Fenster – z. B. „… ist jetzt deine Partnerstadt“,
      „Anfrage geschickt“, „Freigeschaltet“ in der Kunstakademie. Jetzt `#toast` z-index 50 (über `#modal` 40), ebenso das
      Konfetti beim Erfinden. Beide lassen Tippen durch. Das antippbare Erfolgs-Band bleibt unter Fenstern (Block 84e).
      Test: kein-zoom.test.js.


## Block 114: „Weitere Formen freischalten“ sieht nach Knopf aus (06.10.2026)
- [x] Im Fenster von Laterne, Bank, Brunnen, Gleis stand „6 weitere Formen und Farben in der Kunstakademie“ als blasser Text –
      anklickbar, aber nicht so aussehend. Jetzt ein gelblicher Knopf „🎨 6 weitere Formen und Farben freischalten ›“ (`.look.art-more`),
      ebenso „🎨 Mehr Farben freischalten ›“ bei Gebäuden. Die Kunstakademie öffnet gleich an der passenden Gruppe (`artJump`),
      auch vom 🎨-Knopf in der Bauleiste und bei den Buschfarben. Test: schmuck.test.js.


## Block 115: Einwohner kleiner (06.10.2026)
- [x] Figuren auf der Insel (Bewohner, Spaziergänger, Parade, Besucher, eigene Figur) in 70 % (`FIG_SCALE`): um den Fußpunkt
      verkleinert, Platz auf dem Weg und Höhe auf der Bogenbrücke bleiben. Namensschild in voller Größe direkt über Kopf/Hut/
      Ballon (`labelOff`), Sprechblase darüber, Antippen auf die kleinere Figur (`walkerHead`, `walkerAt`, `meAt`). Vorschau im
      Fenster „Du“ bleibt groß (`full`). Vorher per Vorschau verglichen (100/85/72 %). Test: bewohner.test.js.


## Block 116: Grüne Linie über Plätzen (06.10.2026)
- [x] Weiter herausgezoomt zog sich eine feine grüne Linie entlang einer Feldkante über Wege und Plätze. Der Boden wird dort
      in Stücken zu 6×6 Feldern vorgezeichnet (`renderGroundChunk`); Wege waren genau an der Stückkante abgeschnitten, das
      Gras des Nachbarstücks schien durch die halb deckenden Kantenpixel. Jetzt reichen Wege und Bodenteile ~1,5 Bildpunkte
      über die Kante (Schatten bleiben exakt, sonst doppelt dunkel). Gemessen: vorher bis über 1000 grünliche Pixel an der
      Grenze je nach Zoom, jetzt 0.
- [x] 116b: Weit herausgezoomt blieben Linien – Wege enden an ihrer Feldkante, das um ½ Punkt größere Gras (drawGround, gegen
      Fugen) ragte trotzdem ins Nachbarstück. Jetzt zeichnet jedes Stück auch die Wege des Rings der Nachbarfelder in den
      Überlapp (`0.03 + 0.052/scale` Felder). Dazu live: auch zwischen zwei gewöhnlichen Wegfeldern schimmerte ein Hauch Grün
      durch (beide Kanten halb deckend) → `drawPath` zieht die Fläche 0,6 Punkte in Belagfarbe nach. Gemessen bei Zoom 0,35–3,5
      an Stückgrenzen und Feldkanten: vorher bis ~500 grünliche Pixel je Linie, jetzt 0. Test: fugen.test.js.
- [x] 116c: Alle Beläge geprüft (14 Stile, schmal und breit, Zoom 0,6–3): breite Wege (`drawWidePath`) hatten noch Fugen
      (Kopfstein, Kristall) → ziehen ihr Feld ebenfalls nach. Jetzt überall 0 (Regenbogen: Grün nur im Muster, Trittsteine:
      Gras gewollt). Gleisbetten geprüft: keine Fugen.


## Block 117: Ganze Anlagen gedreht verschieben (06.10.2026)
- [x] Mehrere Dinge in der Hand drehen: ⟳, R und Mausrad drehen die Gruppe in Vierteldrehungen um ihre Mitte
      (`rotateGroup`, `grot`, `groupPlaced`). Gebäude (auch mehrfeldrig, Wege darunter `wegs`), Wege, Schienen drehen rot + r;
      Deko wandert in die passende Ecke/Seitenmitte, Eckpunkt-Laternen mit; Bänke am Wegrand stehen wie das Spiel sie stellt.
      Was sich nicht drehen lässt (nicht drehbar und nicht quadratisch), meldet sich in der Vorschau.
- [x] Beim Gruppenverschieben ziehen jetzt Parkrasen und Freizeitpark-Boden (`ground`, alter Platz wird Wiese) sowie Hecken,
      Zäune, Mauern samt Tor/Bogen (`edge`, im Rechteck und auf seinem Rand) mit. Ziel: Rasen nur auf Wiese, keine doppelte
      Linie. Abbrechen legt alles zurück, Speichern beim Tragen sichert Rasen/Linien am alten Platz. Vorschau zeigt Rasen und
      Linien. Test: gruppe-drehen.test.js (4 Drehungen = Original, 1 Drehung exakt, Abbrechen, Speichern, Fehler).


## Block 118: Hauptbahnhof mit Seitenflügel (06.10.2026)
- [x] Der Hauptbahnhof war immer gerade breit (2 je Gleis), das Portal lag zwischen zwei Feldern – in einer Stadt mit 1er-Wegen
      zu den Türen nur schief zu setzen. Jetzt im Infofenster „Seitenflügel: ohne · links · rechts“ (`hbfWingSet`, Kosten
      `HBF_WING_COST`, abbauen ½ zurück, umsetzen kostenlos): eine Gepäckhalle neben dem äußersten Gleis (Tor, Uhr, Fenster,
      Kübel), das Empfangsgebäude läuft darüber; der Bahnhof ist ein Feld breiter, Portal und Eingang (`hbfEntrance`) mittig auf
      einem Feld. Die Gleise bleiben dabei, wo sie sind (Anker rückt), auch mit „+ Gleis“. Gespeichert als `wing`.
      Test: hbf-fluegel.test.js (alle Drehungen, beide Seiten, Kosten, Platz, Speichern, Zeichnen).


## Block 119: Wiese auf Sand (06.10.2026)
- [x] Am Meer ließ sich Sand oft nicht in Wiese verwandeln („Hier ist schon Wiese“) – nur über den Umweg Parkrasen. Grund: viele
      Felder tragen gespeichert `grass` (ganze Startinsel, nach Rasen/Boden entfernen, Roden, Verschieben einer Anlage); am Meer
      werden sie als Strand gezeichnet, der Pinsel sah aber nur den gespeicherten Wert. Jetzt zählt `grass` wie unberührt (was
      man sieht). Testwelt: alle 153 Sandfelder am Meer nehmen Wiese an. Test: terraform.test.js.


## Block 120: Zuletzt gebaut (06.10.2026)
- [x] Knopf 🕘 neben der Suche: zeigt in der Leiste die letzten 8 gebauten Dinge, neuestes zuerst (Form, Farbe, Stil wie
      zuletzt gewählt). Gezählt wird nur wirklich Gebautes (Antippen, Linie/Fläche: `noteRecent` in `tap` und `runPlan`), je
      Gerät in localStorage (`kachelhausen_recent`); was einen eigenen Schnellknopf hat (Weg), zählt nicht. Bereich oder Suche
      schließen die Liste. Test: zuletzt.test.js.


## Block 121: Mittelhalle am Hauptbahnhof (06.10.2026)
- [x] Unter „Halle“ jetzt auch **Mitte**: eine Eingangshalle zwischen den Gleisen (hoch, Bogenfenster, Glasfirst, Tür zu den
      Bahnsteigen), Portal und Uhrturm direkt davor, Eingang ein Feld genau vor der Halle; bei gerader Gleiszahl symmetrisch.
      Allgemeine Gleislage `hbfTrackB` (Lücke nach `hbfLeft` Gleisen) ersetzt die Verschiebung aus Block 118 – Seitenflügel
      unverändert. Umstellen auf Mitte: Gleise rechts der Halle rücken ein Feld (das Fenster sagt vorher, wie viele);
      „+ Gleis“ rechts, „− Gleis“ nur, solange rechts eins bleibt. Gespeichert als `wing: 2`, `mid`.
      Test: hbf-fluegel.test.js (alle Drehungen, symmetrisch bei 4 Gleisen, ± Gleis, Speichern, Zeichnen).


## Block 122: Gewölbe für Backstein- und Land-Bahnhof (06.10.2026)
- [x] Die Bahnsteigdächer von Backstein und Land waren flache Blechdächer auf einer Pfostenreihe – nur das Glasdach hatte
      das schöne Tonnengewölbe. Jetzt alle drei in derselben Form: Backstein als Ziegelgewölbe (Ziegelreihen, Gurtbögen über
      den Stützen, Glas-Oberlicht im First, nachts warm), Land als Holzgewölbe (Bretter, kräftige Holzbögen). `vaultDetail`
      zeichnet Fugen und Bögen nur auf der sichtbaren Seite. Test: hbf-fluegel.test.js.
- [x] 122b: Die Gurtbögen brachen mitten auf der Wölbung ab (Sichtbarkeit nur geschätzt) – jetzt malt `K.block` den Schmuck je
      Dachstreifen gleich mit (`strip`), von hinten nach vorn, Vorderes deckt Hinteres: Bögen laufen über die ganze sichtbare
      Wölbung. Das Gewölbe hat die Dachfarbe des Bahnhofs (auch selbst gewählt), Fugen/Bögen daraus abgetönt, Stirnseiten in
      Wandfarbe – nichts beißt sich mehr mit dem Empfangsgebäude.

## Block 123: Hauptbahnhof symmetrisch (06.10.2026)
- [x] Mit der Mittelhalle von Block 121 lag rechts der Halle wieder Gleis, Steig – also doch schief. Jetzt immer
      Gleis – Steig – Halle – Steig – Gleis (rechts gespiegelt, `hbfPlatS`), die Halle ist fest in der Mitte, Seitenflügel und
      „ohne Halle“ gibt es nicht mehr. Neu gebaut 5 breit.
- [x] + / − Gleis je Seite („+ Gleis links“, „− rechts“ …): alle anderen Gleise behalten ihre Ausfahrt, Züge je Gleis wandern mit.
      Kein Platz auf einer Seite: Hinweis nur für diese Seite.
- [x] Alte Stände (Spielstand v13): beim Laden umgestellt – ohne Halle ein Feld breiter zur freien Seite, Halle dort, wo der
      Eingang war; Seitenflügel und alte Mittelhalle bleiben gleich breit. Ohne Platz bleibt er alt, im Fenster „▣ Halle in die
      Mitte bauen“ (sagt, warum es gerade nicht geht). Toast und „Das ist neu“. Tests: hbf-fluegel.test.js, hbf.test.js.


## Konzept nach dem Spieleabend (07.10.2026) – Blöcke 124–136
Reihenfolge nach Absprache, jeder Block einzeln: bauen, testen, zeigen, auf Zuruf pushen.

## Block 124: Leistung bei großer Welt und weit rausgezoomt
Testwelt `?welt=gross` (GEN=1 npx vitest run tests/grossstadt.test.js), Messwerkzeug tools/bench.js (Zeit, Pixelvergleich), `?messen` (iPad).
Hauptursache (Analyse mit 15 Agenten): Das Bildchen-Budget ist eine Frist ab Bildanfang – in großen Welten ist sie vor den Gebäuden
vorbei, 1623 Dinge je Bild bleiben dauerhaft live (Zoom 0.45: 56 ms; alle Bildchen fertig: 22 ms; nachts > 100 ms).
Entscheidungen (07.10.): weit weg bleiben Fahrgeschäfte und Bahnübergänge live (Rauch/Fahnen stehen still) · Nacht weit weg mit
Wandschein (Bild + Löschbild) · Dämmerung bleibt live.
- [x] Schritt 0: messen – SPRITE_STATS (miss/made), spriteForce/spriteNoBudget fürs Werkzeug, `?messen`-Zeile
- [x] Schritt 1: Kleinigkeiten ohne Bildänderung (leere Felder überspringen, Linien-Felder-Set, putSprite ohne Licht, punchGlow/drawNight billiger). Wellen als ein Pfad verworfen: änderte ~3000 Bildpunkte (Live-Ansicht)
- [x] Schritt 2: Deko-Bildchen nach Variante (decoVariant), Bildchen auf den Inhalt zugeschnitten (frische Leinwand je Bildchen, einmal lesen – eine wiederverwendete bzw. willReadFrequently-Leinwand glättet in Chrome anders), getContext null abgefangen, Leinwände freigegeben (freeCanvas/dropSprite), resetDrawCaches bei adoptState. Speicher Bildchen 0.45: 39 → 7 MB, 0.95: 95 → 17 MB
- [x] Schritt 3: Budget = Malzeit (nicht Frist: `spriteSpent` + `groundSpent` ≤ `PAINT_MS`, mindestens 1, höchstens `SPRITE_MAX`), Zuschnitt gesammelt am Bildanfang (`cropSprites`), Fahrgeschäfte/Wasserrad/Schienen live (`SPRITE_LIVE`). Mac, große Welt, Tag: Zoom 0.45 62–75 → 13 ms; nach dem Zoomen nach ~20 statt ~400 Bildern scharf. Bildvergleich (beide ganz aus Bildchen): Tag 0.3 % Bildpunkte = Rauch und Fontänen stehen still, Nacht unverändert. Offen: Zuschneiden kostet im echten Takt noch ~25–35 ms für 40 Bildchen; Messung iPad (`?messen`)
- [x] Schritt 4: volle Nacht weit weg als Nachtbild (wie live gemalt, mit Wandschein) + Löschbild + Lichtbild für drawNight (`paintNight`, `putNight`, `nightPics`); Dämmerung wie bisher; Budget auch nachts Malzeit; tags werden Nachtbilder freigegeben. Cloud (ohne Grafikchip), große Welt, Nacht: 0.45 371 → 129 ms, 0.7 192 → 89, 0.95 121 → 66; Lichter je Bild 12.549 → 0. Gegen live: 0,9 % Bildpunkte deutlich anders (Schein). Speicher nachts +6–9 MB. Nachbesserung (Ruckeln am PC gemeldet): nachts bis alles fertig war über 100 Bilder à ~500 ms – jetzt ohne Lichtmaske bei voller Nacht, Nachtbild ohne eigenes Zuschneiden, Aufholen mit `PAINT_CATCH` (40 ms, bis 160 Bildchen) solange ≥ 30 fehlen: nachts nach ~30 Bildern fertig, tags nach ~16 (vorher ~45); Zoomen nachts 415 → 189 ms. Am PC (i5, Grafikkarte, v605) nachts trotzdem 500 ms, „neu 2“: Lesen mitten im Bild (Lichtmaske, Zuschneiden fürs Nachtbild) wartet auf die Grafikkarte – jetzt alles Lesen am Bildanfang (v607). Am PC mit v607 besser, aber Zoomen/Verschieben ruckelt (Zwischenstufen malen alles neu, 60–80 ms Grundlast). v608: feste Zoomstufen je 20 % für Bildchen und Boden (A), „Insel wird gezeichnet …“ mit großem Budget, wenn fast alles fehlt (C), Nachtbild ohne save/restore, Heckenbüsche als Bildchen. Nächster großer Schritt (B, mit Nutzer besprochen, offen): ganze Grundstücke weit weg als ein Bild (Grundlast). Grafik-Test am PC (tools/gpu-test.html): Sammelbild spart am PC ~7 ms, am Mac langsamer → verworfen. Zählung je Bild (große Welt, 0.45): 15.500 Zeichenbefehle bei Tag, davon ~5.900 Linien (Heckenkugeln, Latten, Pfosten), 1.667 Wellen, ~580 Symbole. v609: Linien als Bildchen, Wellen ein Strich, Symbole als Bildchen → 6.200 bei Tag (nachts +3.000 Löschen/Nachtbild, +1.400 Lichtbilder). v610: nachts eine warme Lichtfläche statt Lichtbild je Gebäude (nur blaues Licht als kleiner Fleck) → nachts 8.100 statt 9.100 Bild-Befehle, keine Einzel-Lichter. PC mit v610 (große Welt, 0.45): Tag 31 ms, Nacht 43 ms (vorher 52/52–68), aber Zoomen über Stufengrenzen bzw. über Zoom 1 mit ~3 s Pause. v611: beim Zoomen jedes vorhandene Bildchen weiterbenutzen (auch fremde Stufe), danach mit STALE_MS erneuern, Bildchen ~2 min behalten – Simulation: längstes Bild beim Rauszoomen 378 → 210 ms. v611 am PC „bedeutend besser“, aber Zoom 1,11 in voller Welt „unerträglich“: über Zoom 1 alles live – 66.000 Zeichenbefehle (bei 0,95: 2.700). Entscheidung Nutzer: Bildchen + Bewegtes live. v612: Ruhendes bis Zoom ~2 aus Bildchen, Bewegtes (`ANIM_ITEMS`) und Tore live → Zoom 1,05: 6.200 Befehle, 215 → 73 ms (Cloud). PC v612: alle Zoomstufen etwa gleich, aber das Scharfwerden nach dem Zoomen lief als „Welle“ durchs Bild. v613: scharfe Bildchen im Hintergrund, alle zugleich getauscht (Tag ~0,7 s, Nacht ~1,3 s nach dem Loslassen). Offen: Messung PC/iPad mit v613; Zoom > 2 weiterhin live (~20.000 Befehle)
- [x] Prüfung (Ultracode, 25 Funde, v614): nach dem Bauen fehlten Hunderte Bildchen (groundVersion im Schlüssel → „Insel wird gezeichnet …“ nach jedem Tippen) – jetzt Fassung `ver` neben dem Schlüssel, alte Fassung wird weiter gezeigt und einzeln ersetzt; Boden nimmt den Bildchen das Aufhol-Budget nicht mehr weg; Morgendämmerung: nachts gemalte Bildchen ohne Lichtmaske (`noMask`) werden neu gemalt; andere Pixeldichte → Zwischenspeicher leeren; kein Speicher → Pause statt Dauer-„Insel wird gezeichnet“; Live-Spiegel/gleiche Welt behält Bildchen, Neue Insel leert sie; Nachtbild als Löschbild aus schwarzer Fläche (keine goldenen Ränder, Geister ohne Löschbild); Licht-Atlas höchstens so groß wie das Bildchen; Zuschneiden höchstens `CROP_MS` je Bild; Bewegtes nach Stufe/Aussehen/Nacht (`animLive`, Test über alle Stufen); ersetzte Bildchen sofort frei; Nachtbilder geteilter Häuser aus einer Kopie; blaues Licht färbt Nachbarfenster nicht mehr (`nightPanes`); Tausch nur in passender Zoomstufe; Tests mit fester Spieluhr; Heckenbusch-Symbol der Leiste nicht mehr aus dem Welt-Zwischenspeicher. Offen: Speichergrenze in Bytes für Bildchen (iPad), Messung PC/iPad mit v614
- [ ] Schritt 5: Feinschliff (Deko-Plan, Linien-Bauplan, Streifen)
- [ ] Schritt 6: Boden nach dem Bauen nur geänderte Grundstücke neu

## Block 125: Wege – neue Beläge und die vorhandenen überarbeiten
Wunsch Nutzer (07.10.2026): „Wege komplett neue Designs anbieten, die man auch in einer seriösen Stadt nutzen kann – aktuell mache ich
alles mit Kies, weil der Rest nicht passend aussieht – und alte ohne Linien machen (beim Rauszoomen Linien wie bei Kies).“
Heute 14 Beläge: Kiesweg, Erde, Schachbrett, Asphalt, Trittsteine, Kopfstein, Klinker, Terrakotta, Konfetti, Fischgrät rosé,
Blütenpfad, Kristallweg, Regenbogenweg, Goldpflaster – fast alle bunt/verspielt, kaum etwas Ruhiges für eine Stadt.
- [x] 125a: Linien beim Rauszoomen: Ursache sind die feinen Muster – Kiespunkte liegen in einem Raster (nur wenig verrückt) und
      werden weit weg zu Streifen, Fugen (Platten, Klinker, Gold, Fischgrät) unter 1 Gerätepunkt zu Linien und Grauschleier.
      Jetzt blassen sie aus wie bei Mipmapping (`patternFade`/`PAT_FADE` in draw-objects.js): voll ab Zoom ~0,8, ein Drittel bei
      0,45, fast weg bei 0,35 – nah dran unverändert. Vergleichsbilder: tools/belaege.js (alle Beläge als 4×4-Plätze je Zoomstufe)
- [ ] 125a2: Übergänge zwischen Belägen, Kanten; was hässlich ist, schöner machen (mit Nutzer anhand der Übersicht)
- [x] 125b: 8 neue Beläge (Kunstakademie): Granitplatten (große Platten im Verband), Betonplatten (halbe Felder), Sandstein (Reihen,
      verschieden lange Steine), Anthrazit-Pflaster (kleine dunkle Steine), Asphalt glatt (ohne Mittelstreifen), Gehwegplatten
      (Drittel-Raster, kräftiger Bordstein), Holzbohlen (warm) und Holzsteg (verwittert hell). Neue Muster: big, setts, thirds (Raster
      ab der Feldkante), slabs, ashlar, boards (Reihen in Weltkoordinaten, über Feldgrenzen durchgehend). Test: belaege.test.js
- [x] 125c: Entscheidung Nutzer: alle alten bleiben, nur dazu
- [x] Rückmeldung Nutzer (08.10.): Erde heller, Schachbrett/Gold als echtes Schachbrett mit sichtbarem Rand, Granit/Blüten/Kristall
      kräftiger Rand, Regenbogen ohne Feldkanten (Streifen im Weltraster, Muster 2 % über die Feldkante), Fischgrät: echtes Fischgrät
      klein (alter Belag) + groß; Platten: groß, Drittel, gemischt, Schachbrett
- [x] Entscheidung Nutzer: Wege = Muster + Farbe (abgestimmte Palette, 21 Farben), Muster kaufen, Farben frei (Gold über das Album).
      WEG_MUSTER/WEG_FARBEN (data.js), Belag-Name 'm:<muster>:<farbe>' bzw. alter Name für alte Kombinationen (WEG_PRESET,
      wegStyleOf/wegParts), Aussehen pathLook (draw-objects), wegMusterOk/wegFarbeOk (wer einen alten Belag hat, hat sein Muster),
      Kunstakademie „Wegmuster“ mit Vorschau (125d erledigt), Leiste: Muster, dann Farben, dann Form. „Das ist neu“ 2026-10-08-wege
- [x] Weg antippen → Belag: „Nur dieses Feld“ / „Alle verbundenen (N Felder)“, dann Muster + Farbe (wegNetwork, restyleWeg;
      je geändertes Feld ein Weg-Preis wie beim Darüberziehen, ↶). Wunsch Nutzer: nicht alles neu ziehen müssen
- [x] Weit weg waren Muster ganz weg (nur farbige Flächen): Ausblenden jetzt auch nach dem Abstand im Muster (PAT_STEP) – weit
      auseinander (große Platten, Schachbrett, gemischte Platten, Verband) bleibt sichtbar, eng (Kies, Pflaster, Holz) blasst aus
- [x] 125c: Weit weg sah man jedes Feld als Kachel (Rückmeldung Nutzer): die Fuge auf der Feldkante zeichneten beide Nachbarn,
      halb durchsichtig doppelt = dunkler (auch die Kantenglättung addiert sich). Jetzt zeichnet die hintere Kante nur das
      Nachbarfeld (`patSeam`), und Muster blassen per Farbmischung mit der Belagfarbe aus statt per Deckkraft (`pattern(…, bg)`)
- [x] 125c: Ruckeln am Freizeitpark (Welt „Fnymiland OG“, Rückmeldung Nutzer): 142 Felder Fischgrät, nah (Zoom > 1,3) jedes Bild
      live gezeichnet, ~300 Striche je Feld. Gemessen (Mac, iPad-Größe): Wege 82 von 146 ms je Bild (mit Rastern), reine Rechenzeit
      Park Zoom 1: 20 → 6 ms, Zoom 1,5: 25 → 13 ms. Lösung: Linienmuster mit festem Weltraster als Kachelbild (`patTileFill`,
      `PAT_TILE`, deckend mit Belagfarbe, CanvasPattern), Kies/Steine je Farbe ein fill. Bildvergleich alt/neu: < 0,01 % Bildpunkte
      deutlich anders. Ruckler beim Ziehen weit weg: Standbild im Hintergrund war zu spät fertig (dann alles auf einmal, Mac 34–44 ms)
      → Start ab 15 % statt 30 % des Rands, Zeit je Bild bis 3× GLB_MS, je näher am Rand (`glBgBudget`)
- [x] 125c: Am PC weit weg immer noch Linien, am Mac nicht (Rückmeldung Nutzer): kein Feldfehler, sondern die Fugen selbst – bei
      125–150 % Skalierung fallen sie auf halbe Bildpunkte und verschwimmen zu grauem Raster. `patternFade`: Schwelle für den
      Fugenabstand je nach Pixeldichte (4 bei DPR 2, 10 bei DPR 1). Nachgestellt mit devicePixelRatio 1,25/1,5: Raster weg
- [x] 125c: Am PC trotzdem Linien an jeder Feldgrenze auf glatten grauen Plätzen (Screenshot Nutzer, Kontrast verstärkt: Raster genau
      im Feldabstand). Am Mac/Chrome nicht nachstellbar (auch 12× Kontrast glatt) – Windows glättet die Kanten zweier Nachbarfelder
      anders. Der Überlapp aus Block 116 (Strich 0,6) war weit weg unter 1 Gerätepunkt. Jetzt: Flächen an Kanten, wo der Weg
      weitergeht, ~1 Gerätepunkt ins Nachbarfeld (`seamPad`, `padBorder`; breite Wege: Fläche zu breiten Nachbarn). Nebenbei
      sichtbar behoben: grüne Naht zwischen Platz und Rathaus-Vorplatz (auch am Mac)
- [x] Kunstakademie: „Zurück“ von der Karte landet an derselben Stelle der Liste (designScroll)
- [x] Figur-Fenster (Du → Figur, Rückmeldung Nutzer: Figur verdeckt, springt nach jeder Wahl nach oben): Figur mit Name bleibt oben
      stehen (sticky), jede Wahl zeichnet neu an derselben Scrollstelle
- [x] Vorplatz/Weg zur Tür, Brücke und Schloss-Platz mit Muster + Farbe (wegPickHtml: Muster, darunter Farben; Knöpfe tragen den
      fertigen Belag-Namen, die Fenster übernehmen ihn wie früher)
- [x] Leiste beim Wegebauen (Wunsch Nutzer: „drei Leisten, 1/3 des Bildschirms“): eine Zeile mit zwei Knöpfen (Muster ▾, Farbe ▾)
      und der Wegform; Antippen öffnet darüber ein kleines Raster (wegPop), Wahl oder Tippen daneben klappt zu. Handy: eine Zeile
      (Form nur als Zeichen, lange Namen gekürzt), 42 statt ~130 Punkte hoch
- [x] Testwelt `?welt=wege` (testsave-wege.json): je Muster (Grundfarbe) eine Raute (auf dem Bildschirm in Reihen) mit gerade in beide
      Richtungen, Kreuzung, Einzelfeld, 4 Kurven, 4 T, Platz 3×3, ganz breiter Weg, eckige Kurve, zwei Spuren; alle Farben; Übergänge
- [x] 125d: Vorschau vor dem Kauf (Wunsch Nutzer 08.10.): Wege in der Kunstakademie als Bild sehen, bevor man bezahlt – erledigt mit Vorschau + Karte (v700)
- [x] Kunstakademie durchschaubar (Wunsch Nutzer 08.10., Entscheidung „Vorschau + Detailkarte“): jedes Stück mit echtem Bild
      (designThumb: Wand-/Dachfarbe am Haus + Farbpunkt, Busch, Stadtschmuck, Hecke/Zaun/Mauer als Ecke, Wegmuster als ganzes Feld,
      Deko). Antippen öffnet eine Karte (openDesignCard): großes Bild, bei Mustern 11 Farbbeispiele, Preis, „Kaufen“/„Zurück“ –
      vorher kaufte schon das Antippen. thumb() kann jetzt Maßstab und Stil. Test: design.test.js

## Block 126: Alle Hecken einfärbbar
- [x] Farbauswahl wie Wilmerhecke/Busch (BUSH_COLS) für alle Heckenformen: Leiste beim Bauen, Fenster, „für alle übernehmen“
      (alle Hecken). `edgeLook(e)` färbt; Grün = Grün der Form, dunkle Formen bleiben dunkler (HEDGE_TONE). Test: buschfarben.test.js

## Block 127: Gebäudeeingänge passen sich dem Weg an
- [x] Vor schmalem Weg schmaler Eingang (so breit wie der Weg), vor ganz breitem Weg/Wegfläche bleibt der Vorplatz – `courtPartsAt`.
      Weg an der ganzen Front: ein Weg zur Tür in der Mitte; sonst je Wegfeld vor dem Platz. Breiter Weg zur Tür (Museum) höchstens
      Wegbreite. Höfe übers ganze Grundstück (Rathaus, Markthalle) bleiben. Test: vorplatz.test.js

## Block 128: Beleuchtung ausgiebig testen
- [ ] Sternwarte und alle Lichtquellen einzeln; Laternen, Kristalllampen, Gebäude dicht nebeneinander; nah und weit weg

## Block 129: Geschenke → Souvenirs
- [x] Souvenirs (js/souvenir.js): Mini-Statue seines Tiers, Wegweiser mit Flagge, Inselblume, Mini-Rathaus, Freundschaftsbäumchen –
      in Farbe/Flagge des Absenders; kostenlos, 1× am Tag pro Freund (🎁 in der Freundesliste); Briefkasten → Sammelregal im Album →
      „Aufstellen“ (einmal; Abreißen legt es zurück); Infofenster „… von Ben, geschenkt am …“. Test: souvenir.test.js
- [x] Rohstoffe nur noch über „Helfen“ beim Wunschzettel, höchstens was fehlt; Regel ohne 100.000er-Grenze (1 Mrd.), ehrliche
      Fehlermeldung (keine Verbindung ↔ nicht mehr befreundet)
- [x] Wunschzettel: „von dir unterwegs“ bzw. „du hast genug geschickt – muss nur noch abgeholt werden“ statt „Helfen“; Besitzer:
      „Abnehmen“ direkt, Hinweis auf Abzuholendes im Briefkasten; Päckchen ohne Wunsch-Merker zählen auch; Mengen bis 50.000

## Block 130: Online-Status der Freunde
- [x] Grüner Punkt „spielt gerade“, sonst „zuletzt vor …“ in der Freundesliste (`on/<uid>`, `onlineBeat` jede Minute, play false
      beim Wegklicken/Abmelden/onDisconnect, grün nur bei frischer Meldung; Liste frischt sich alle 30 s auf). Firebase-Regel `on`
      (nur Freunde lesen) – vom Nutzer in der Konsole einzufügen. Test: online.test.js

## Block 131: Kleiner Bahnhof auch 3 breit (Eingang mittig)
- [x] t.len = 3 (`stationLen`, `sizeOf`); Leiste beim Bauen (2/3 Felder, `stationNewLen`), Fenster „Länge“ (`stationLenSet`: wächst zur
      freien Seite, 🪙 400 + Material, kürzer: halbe Taler zurück, ↶). Breiteres Empfangshaus, langes Dach, zwei Bänke. Test: bahnhof-lang.test.js

## Block 132: Große Straßenlaternen (Mast, großer Lichtkegel, Formen/Farben in der Kunstakademie)
- [x] Neues Ding `strassenlaterne` (kleine Deko, 4 pro Feld, auch auf Eckpunkten), Kunstakademie 300 (Deko). 6 Formen nach Vorschau
      mit dem Nutzer (alle genommen): Mastleuchte, Peitschenmast frei; Kugelleuchte, Doppelausleger 150, Bischofsstab 200, Boulevard 250.
      Farben = LANTERN_COLS. Nachts: kleiner Schein am Kopf + flacher Lichtfleck am Boden (drei weiche Lichter nebeneinander, ~1,5 Felder
      – Nutzer: „so wie im Bild“). Ausleger über den Weg (MID_TURN, rot & 2 = links), drehbar. Strom: zählt wie 2 kleine Laternen.
      Leistung nah: 27–138 Befehle (Boulevard am teuersten). Test: strassenlaterne
- [x] 132b (Nutzer: „nach rechts gedreht sehen manche weird aus“, Peitschenmast an einem Weg von unten links nach oben rechts): Ausleger
      waren nur waagerecht links/rechts – zeigten halb am Weg vorbei. Jetzt in Feldrichtung je rot (0 +u, 1 −v, 2 −u, 3 +v), Peitschenmast
      kürzer (~⅓ Feld, zwei gegenüber treffen sich nicht), Kopf als flache Platte in Auslegerrichtung.

## Block 133: Monumente (wie in Alexandria)
- [ ] Koloss am Hafen (Schiffe fahren durch) · Riesenstatue der eigenen Figur · Obelisk & Löwen/Sphinxe · Triumphbogen

## Block 134: Kopieren (✋-Rechteck → „⧉ Kopieren“, Kopie am Finger, drehbar, kostet wie neu)
- [x] Mit ✋ markieren: Auswahl bleibt stehen, Leiste „↔ Verschieben“ / „⧉ Kopieren · Preis“ / „✕“ (`syncSelBar`, je Bild aus render);
      hineintippen = verschieben wie früher. Kopie (Nutzer entschied): gleiche Stufe zum vollen Preis (`copyCost`: `fullValue` samt
      Ausbauten, Wegbrücken, Dekos, Linien, Rasen), bleibt als Stempel am Finger (frische Objekte je Absetzen, `copyClone`), neue
      Bewohner (`assignResident`), ohne Fahrzeuge/Schiffe/Züge. Geprüft wie ein Neubau (Freischaltung, Platz; `move: false`),
      bezahlt vor dem Bauen – zu wenig: nichts. Einzelstücke bleiben draußen (`noCopy`: Rathaus, Sehenswürdigkeit, Wunderwerk,
      Souvenir). Gespeichert wird beim Tragen nichts Doppeltes (`carried()` ohne Kopie). Esc beendet.
- [x] Pipette (Nutzer): nur Wege / nur Gleise / nur eine Linienart, jeweils ein Stil → Werkzeug mit genau diesem Stil (Hecke auch
      Farbe) in die Hand, Linie wie gewohnt ziehen (`copyPipette`). Test: kopieren; planen (Verschieben: markieren → hineintippen)
- [x] Nachbesserung (Nutzer): Rückgängig ging beim Kopieren nicht – `undoable` hielt den Schritt fest, solange etwas am Finger hing
      (Stempel hängt immer). Jetzt: jedes Absetzen einer Kopie ein Schritt; ↶ mit Kopie am Finger legt sie weg und nimmt das letzte
      Absetzen zurück. Keine Hinweiszeile mehr über der Leiste bei ✋ und Abriss. Test: kopieren
- [x] Fehlersuche Kopieren (Nutzer: „kommt mir zu makellos vor“) – gefunden und behoben:
      1. Preis: `fullValue` nimmt den damals bezahlten Preis (`t.price`) – Dinge, die mit dem Einkommen teurer werden (Uni, Kino,
         Fahrgeschäfte …), hätte man billig kopiert (Bauland: Uni bezahlt 640 000, heute 1,1 Mio). Jetzt `copyTileCost`: heutiger Preis.
      2. Aufpreise fehlten: Looping, Bahnübergang + Fußgängerbrücke, langer Bahnhof, Gleise im Hbf, Märchenschloss-Gestalt, Tor-/
         Rosenbogen an Hecken – jetzt mitgerechnet.
      3. Geschenkte Parkbäume (`free`) blieben in der Kopie „geschenkt“ (Abriss gäbe nichts zurück) – Kopie ist bezahlt.
      4. Pipette mit nicht freigeschaltetem Stil: still der Standard – jetzt mit Hinweis.
      5. Leiste: Knöpfe nur bei geändertem Inhalt austauschen (Klick ginge sonst ins Leere).
      Härtetest im Spielstand „Bauland“: Straßen, Schulen, Kraftwerke, Läden, Kultur kopiert/abgesetzt/rückgängig – keine Fehler.

## Block 135: Minimap am PC (unten rechts, Antippen springt hin)
- [x] Umgesetzt (09.10.2026, js/minimap.js): unten rechts die Welt schräg wie das Spiel (je Feld eine Raute), zugeschnitten auf das
      Land + 5 Felder Meer; Wege beige, Gleise grau, Häuser rot, Gebäude braun, Kultur lila, Freizeitpark rosa, Wunder gold, Deko grün;
      fremdes Land blasser. Rund (Nutzer wählte aus 4 Entwürfen, tools/vorschau/mini-formen.png): Land-Mitte in der Kreismitte,
      äußerstes Land knapp im Rand (`mini.rmax`). Sichtfeld als Rahmen, Klicken/Ziehen springt hin. Nur mit Maus und ab 900 px (`miniWanted`), versteckt
      bei offenem Fenster/Katalog; ausschalten im Menü ☰ → Grafik „Minimap ausschalten“ (Nutzer: kein Knopf an der Karte; je Gerät,
      `kachelhausen_minimap`). Neu gemalt nur bei Änderung, in
      einer Pause (~17 ms in Fnymiland OG). Bild tools/vorschau/mini2.png. Test: minimap

## Block 136: Bahn – U-Bahn-Eingänge und Parkeisenbahn
- [x] U-Bahn (Konzept mit Nutzer, 08.10.2026; fertig, live seit v825 – Einzelheiten 136i–o): **ein Netz mit der Eisenbahn**, kein eigenes System.
      - Tunnel als Linie ziehen (Bereich Verkehr), unter Häusern/Wegen/Parks durch, ohne Abriss; unter Wasser erlaubt, teurer.
        Im Bild unsichtbar, mit Schiene/Tunnel in der Hand gestrichelt. Kosten je Feld ≈ 4× Schiene (Wasser mehr).
      - Tunnelportal entsteht von selbst, wo Schiene und Tunnel sich berühren (Entwurf vorher als Bild zeigen, = Block 140).
      - U-Bahn-Station auf einem Tunnelstück, oben nur der Eingang (Häuschen, U-Schild, Treppe); zählt wie ein Bahnhof.
      - Züge fahren übers ganze Netz, im Tunnel unsichtbar, am Portal auftauchen.
      - Neu für Bahn UND U-Bahn: Linien innerhalb einer Insel verbinden Viertel – Wünsche und Kundschaft, **nur zusätzlich,
        nie schlechter** (andere Viertel kaufen nur bei Ladenarten, die sie nicht haben; Wirkung ½–1 nach Plätzen wie bisher).
      - Freischalten: Forschung „U-Bahn“ nach „Eisenbahn“.
      Schritte: 1 Entwürfe als Bild (Portal, Eingang, Tunnel gestrichelt) · 2 Tunnel-Linie + Netz · 3 Portal · 4 Station/Eingang ·
      5 Züge im Tunnel · 6 Viertel-Regel · 7 Forschung, Preise, Hilfe, Leistungs-Wächter, Testwelt
- [x] 136i Entwürfe (tools/ubahn-entwurf.js): Nutzer wählte alle drei Eingänge als Formen (Treppe mit Mast frei, Pavillon 250,
      Häuschen 200), Portale Backstein (Wand schmaler als der Hügel) und Naturstein im Hügel, statt Beton eine **Rampe** für die
      Innenstadt (Nutzer: „wie fahren U-Bahnen in einer Innenstadt herunter? da ist nicht immer eine Wand mit Loch“). Rampe und
      Backstein frei, Naturstein in der Kunstakademie; „Passend“ = Rampe neben Häusern/Wegen, sonst Backstein. An der Rampe ersetzt
      ein eigener Zaun/Mauer/Hecke auf der Feldkante das Geländer. Bauansicht: Welt blass, Tunnel lila gestrichelt, U je Station.
- [x] 136j Umsetzung: `state.tunnels` (Feld → { form }), gespeichert/geladen/rückgängig (`UNDO_MAPS.tunnels`). Ein Feld ist Schiene
      ODER Tunnel (`tunnelError`, placeError für Schiene/Bahnhof über Tunnel); Netz = Schienen ∪ Tunnel (`trackAt`, computeRail,
      railPath, railArms). Portal = Schiene neben Tunnel (`portalDir`, `portalForm`), gezeichnet im Objekt-Durchgang der Schiene
      (js/draw-ubahn.js); zeigt die Wand weg, malt das Tunnelfeld den Hügel (`drawTunnelHill`). Züge: im Berg unsichtbar, am
      Portal längs abgeschnitten (`trainTunnelCut` → car.cut), in der Rampe sinkend und nur durch die Öffnung sichtbar (`rampClip`).
      U-Bahn-Station auf dem Tunnel, hält auf ihrem Feld (`stopDirs`), Fenster wie Bahnhof. Tunnel 60 (unter Wasser 150, darf ins
      Meer wie Schienen), Station 900, Forschung „U-Bahn“ 400 nach „Eisenbahn“. Abriss: erst was oben steht, dann der Tunnel (voll
      zurück). Leistungs-Wächter: tunnel 5, ubahn 51–169. Testszene tools/ubahnszene.js. Test: ubahn (17)
- [x] 136k Viertel-Regel: Linien auf **einer** Insel (`l.inner`) fahren jetzt (bahn.test angepasst). Strom erst nach allen anderen
      (bestehende Welten verlieren nichts). Halte-Viertel (`stopViertel`) werden verbunden: Wünsche über `buildAccess` ('bahn'),
      Läden bekommen zusätzlich Kundschaft aus verbundenen Vierteln, die diese Ladenart nicht haben (`innerTraffic`, `LINE_SHOP` ½,
      × Auslastung, geteilt durch alle Anbieter) – nie statt der eigenen. Fahrgäste = ½ der Einwohner aller Halte-Viertel außer dem
      größten → Fahrkarten. Nutzerfrage „100 % U-Bahn?“: geht (Test).
- [x] 136l (Nutzer: „Einfahrt sollte zwei lang sein, sonst steil und unschön“): Rampe über das Portalfeld und das gerade
      Schienenfeld davor (`rampLen`, sonst wie bisher eins); Wagen auf dem vorderen Feld gehören schon zur Rampe (sinken, Ausschnitt).
      Geländer/eigener Zaun je Feld. Test: ubahn
- [x] 136m (Nutzer: „beim Entfernen genauso ausgegraut wie beim Tunnel“): blass nur mit Tunnel/U-Bahn-Station in der Hand; mit
      Abriss und Schiene nur die gestrichelten Tunnel. Test: ubahn (Bauansicht)
- [x] 136n (Nutzer: „den Tunnel ändern können, wenn man draufklickt“): Fenster einer Schiene am Portal (auch vorderes Rampenfeld)
      zeigt „🚇 Tunnelportal“ mit den Formen (Bildchen per drawTunnelIcon), „für alle anderen“ und „neu gebaute“; ein Tunnelfeld ohne
      etwas darüber (Hügel) öffnet ein eigenes Tunnel-Fenster (`openTunnelInfo`) mit Form und 🗑️. `portalNear`. Test: ubahn
- [x] Nutzer: „wieso kann man keinen Schnellzug auswählen?“ – gesperrte Zug-/Schiffsmodelle waren nur graue Knöpfe mit
      Maus-Tooltip (auf dem iPad unsichtbar). Jetzt antippbar → Forschung „🚢 Verkehr“, dazu eine sichtbare Zeile unter der Zugwahl.
      (Triebwagen/Schnellzug: Universität bauen, dann dort kaufen.) Test: ubahn
- [x] Nutzer: „Stationen farbig einfärben“ – Bahnhof/Hbf hatten Wand/Dach schon (BUILDING_ART), Parkbahn-Station ihre Dachfarben;
      neu die U-Bahn-Station über `REPAINT.ubahn` (Wand · Dach & Mast, alle drei Formen); das U-Schild bleibt blau. Test: ubahn
- [x] Nutzer: „Zaun oben an der Rampe weg (eigener Zaun bleibt möglich), Ein-/Ausfahrt glitcht, Schienen wie das Gleismuster“ –
      Rampe ohne eigenes Geländer (nur Betonkante; Zäune auf den Feldkanten wie überall). Gleis in der Rinne schräg im Gleisbett
      des jeweiligen Felds (`rampTrack`, Farben aus railLookOf). Glitch: der Ausschnitt (`rampClip`) verdeckte auch am Rampenanfang
      alles unter der Öffnung – dort verschwand das Wagenende; jetzt nur unter der vorderen Längskante und (Wand abgewandt) unter der
      Wandkante. Mit Bildstreifen in beiden Richtungen geprüft (tools/vorschau/ub3-*.png).
- [x] Nutzer: „Zaun ringsum um die Abfahrt – glitcht komplett“: Wagen wurden mit dem Portalfeld gezeichnet; lief die Rampe zum
      Betrachter hin, kam das vordere Rampenfeld später und sein hinterer Zaun malte über den Zug. Jetzt mit dem zuletzt gezeichneten
      Rampenfeld (`trainTunnelCut` → k). Mit Zaun ringsum (auch über der Wand und quer am Anfang) in beiden Richtungen geprüft (ub5-*.png).
- [x] Nutzer: „beim Pavillon macht Wand nichts“ – Wand = Eisengestell (dunkler getönt), Dach & Mast = Glasdach. Test: ubahn
- [x] Nutzer (Bild): „siehst selbst, wie scheiße das aussieht“ – (1) taucht die Rampe nach vorn ab, malte die Rinne erst mit dem
      zweiten Feld und übermalte den Zaun am vorderen Feld (halber Zaun). Jetzt malt das Rampenfeld, das zuerst dran ist
      (`rampByFront`/`rampFrontOf`), die Wagen gehören zum letzten. (2) Gefälle gleichmäßig statt beschleunigt – vorher bogen sich
      Schienen und Kanten wie eine Banane. Mit Zaun ringsum in beiden Richtungen geprüft (ub7-*.png).
- [x] Nutzer: „Tunnel nicht mehrfach löschen, auch nicht in der Mitte einzeln“ – der Abriss (Rechteck, auch 1×1 beim Tippen) kannte
      Tunnel nicht (`scanDemolish`). Unter einem Gebäude bleibt der Tunnel, bis das Gebäude weg ist. Test: ubahn
- [x] Nutzer: „bei Zäunen dasselbe Aufklappmenü wie bei allem anderen – komplett unübersichtlich“: Hecke/Zaun/Mauer zeigen in der
      Leiste nur noch „Form ▾“ (Hecke dazu „Farbe ▾“), die Auswahl klappt als Raster mit Namen auf (`edgeStyleBar`, `edgePop`), eine
      Wahl oder daneben tippen klappt zu; „+n in der Kunstakademie“ springt zur passenden Gruppe. Tests: buschfarben
- [x] 136o Tunneleinfahrt als eigenes Bauteil (Nutzer, 09.10.2026: „automatisch ist cool, aber mega unintuitiv – man will einen
      Tunnel bauen, eine Einfahrt dazu und dann Schienen ran“): `tunneleinfahrt` 1×2, drehbar, 1.000 Taler; Formen Rampe/Backstein
      frei, Naturstein Kunstakademie; immer 2 lang (Ein-Feld-Rampe fällt weg). Hinteres Ende an den Tunnel (dreht sich selbst),
      vorderes Ende an Schienen. Keine automatischen Portale mehr: Schiene neben Tunnel verbindet nicht, Fenster-Hinweis
      „Dazwischen eine Tunneleinfahrt setzen“. Danach Glitch „Zug hält auf der Einfahrt (Bahnhof dahinter)“ mit Bildstreifen prüfen.
      Umgesetzt: `trackLink` (welche Nachbarn befahrbar zusammenhängen: Schiene–Schiene, Tunnel–Tunnel, Einfahrt nur längs: vorn
      Schiene, hinten Tunnel; Schiene–Tunnel direkt nie) in computeRail, railLoop (nur Schienennetz), railPath, lineRoute, railArms.
      Ohne Einfahrt: Hinweis im Fenster der Schiene und des Tunnels. Einfahrt zeichnet sich wie jedes große Gebäude in Streifen je
      Feld – Zäune ringsum, Züge und Hügel liegen damit von selbst richtig; die alten Sonderwege (rampFrontOf, drawTunnelHill,
      Portal-Formen am Tunnel) sind weg. Gleisbett der Einfahrt wie die Schiene davor. Fenster: Form + „hinten am Tunnel / vorn an
      der Schiene“. Netz-Abfragen über das Schienenfeld selbst (`railTileAt`), nicht über COVER. Leistungs-Wächter: Rampe 226,
      Hügel ~770. Bildstreifen beider Rampen mit Zaun, Hügel-Portale in beide Richtungen (tools/vorschau/ein-*.png). Test: ubahn
- [x] Nutzer: „du stellst die Bahn falschherum hin“ – das Feld unter der Maus war immer das obere/linke der zwei; von unten/rechts an
      den Tunnel gab es keine passende Drehung. `einAnchor`: das Feld unter der Maus wird das hintere Feld am Tunnelende (Vorschau
      und Tippen gleich). „Einfahrt von unten links nach oben rechts, Bahn fährt raus und bleibt stehen – glitcht“ (Schnellzug mit
      allen Wagen): kein Flackern (Bilder verglichen), aber die Rinne war mit 22 zu flach – die Wagen ragten heraus und schienen
      zu schweben. Jetzt 32 tief, Tunnelmund mit Bogen unten an der Wand. Bildstreifen tools/vorschau/ein-halt4.png. Test: ubahn
- [x] Nutzer: „Zäune um die Kurve sehen echt weird aus“ – erst fälschlich allen Zäunen die Rundung genommen (Nutzer: „das haben
      sauviele Leute auf ihrer Insel, du kannst nicht alle zwingen“) → sofort zurückgenommen. LEHRE: nie das Aussehen bestehender
      Inseln für alle ändern; neue Wahl mit dem bisherigen Aussehen als Standard. Jetzt: (1) Rundung schöner – Latten/Stäbe im
      Bogen auch an den Übergängen (keine doppelte Lücke), in der Seitenansicht fast deckende Latten fallen weg (`spots` in
      drawFence). (2) Neue Wahl „Ecke rund / eckig“ für Hecke, Zaun, Mauer (`edgeShape.sq` in der Leiste, `e.sq` je Linie, im
      Fenster „Ecken“ für die ganze Linie, `setEdgeSq`); Standard rund, alte Linien ohne Angabe bleiben rund. Tests: buschfarben, zaun
- [x] Nutzer: „obere/untere Ecke okay, linke und rechte überhaupt nicht“ – dort filterte der Doppelte-Latten-Schutz den ganzen Bogen
      leer. Zwei Bilder gezeigt (A: seitlich spitz, B: Bogen bleibt mit Latten), Nutzer wählte B: nur noch genau Deckendes fällt weg.
- [x] Nutzer: „es fehlt eine weitere Latte“ – der Schutz verglich nur die x-Lage; links/rechts läuft der Bogen senkrecht um den
      Pfosten, obere und untere Latte stehen übereinander und galten als doppelt. Jetzt echter Abstand (`Math.hypot`). Oben/unten
      unverändert. Bilder tools/vorschau/latte-links2.png, latte-rechts2.png
- [x] Nutzer: „Zaunvorschau broken, auch bei Hecken und Mauern“ – das Vorschaubild (Leiste, Fenster, Kunstakademie) malte die
      Kanten b0,0/a0,0 und fragte dabei die ECHTE Insel um Feld 0,0 nach Nachbarn, Wegen, Toren: stand dort etwas, kam die Vorschau
      halb, verbogen oder als Tor heraus (auf leeren Testinseln unsichtbar). Jetzt eigene Mini-Welt nur mit den zwei Stücken
      (`thumbRaw`), spitze Ecke wie immer. Test: zaun („Vorschaubild hängt nicht von der Insel ab“)
- [x] Nutzer: „Weg → Alle verbundenen ändert nur den freien Weg, nicht den unter Stand oder Deko“ – `wegNetwork`/`restyleWeg`
      kannten nur Weg-Felder; unter Ständen/Deko liegt der Belag in `t.weg` (große Deko: `t.wegs`), das Netz riss dort sogar ab.
      Jetzt `wegCellStyle`/`setWegCell` (auch unter Ständen und Deko, Dinge bleiben stehen, je Feld ein Weg-Preis, ↶). Test: belaege
- [x] Nutzer: „Wunsch an Freunde nur 24 Stunden anzeigen, dann automatisch weg“ – `WISH_TTL` (friends.js): `wishClean` lässt
      abgelaufene Wünsche weg (Serverzeit `cloudApi.now()` gegen den Server-Zeitstempel `at`, Geräteuhren zählen nicht) → Freunde
      sehen ihn nicht, Hilfe zählt nicht mehr (Päckchen kommen trotzdem an), im Rathaus wieder „Wunsch aushängen“. Der Besitzer
      löscht den abgelaufenen Wunsch auch aus der Cloud (`wishWatch`), damit Freunde mit älterer App ihn nicht weiter sehen.
      Anzeige „noch 5 Std.“ bei Besitzer und Freunden. Keine Regeländerung in Firebase nötig. Test: fuereinander
- [x] Nutzer: „Vorschaubilder Straßenbahn und Mini-Zug in der Kunstakademie falsch“ – beide zeigten nur den leeren Bahnsteig
      (den Zug malt die Station nur bei Feld 1e6 wie in der Zugwahl). `thumbRaw`: pb_station mit 1e6, kleiner und versetzt, damit
      die lange Bimmelbahn ins Bild passt. Bild tools/vorschau/pb-thumbs4.png. Test: parkbahn
- [x] Nutzer: „Wieso kostet die Kunstakademie nur Geld? Ist doch ein Forschungsinstitut, das Ideen braucht“ → Entscheidung Nutzer:
      Taler UND Ideen; Taler weiter nach Einkommen, Ideen fest („je geiler und später, desto teurer“). `designIdeas`: Grundpreis
      × 2 Stadtschmuck (120–600 💡), × 5 Farben/Wege/Hecken/Zäune/Mauern (300–1.500), × 25 ✦ Meisterstücke (6.300–23.000).
      Maßstab: Bot-Simulation ~7–11 💡/s (tools/sim-bots.js misst jetzt auch Ideen). Gekauftes bleibt. Test: design
- [x] Parkeisenbahn (Wunsch Nutzer, 08.10.; Vorschau abgenommen, „Züge detaillierter, echte Bewohner“): `pb_gleis` als Linie ziehen
      (Wiese, Park, Freizeitpark; über einen Weg bleibt der Weg darunter – Bahnübergang mit Andreaskreuz), `pb_station` auf ein
      Gleisstück (Gleis wird Station, nur der Unterschied kostet). Fertiger Rundkurs mit Station (`computeParkRails`, `PB_RINGS`) →
      ein Zug fährt im Kreis (0,8 Felder/s), hält 3,5 s an jeder Station. Züge = Formen der Station (`DECO_LOOKS.pb_station`):
      Bimmelbahn (Dampflok, 3 offene Sommerwagen) frei, Straßenbahn (300) und Mini-Zug mit Tierwagen (250) in der Kunstakademie.
      Fahrgäste: Aussehen echter Bewohner (beim Halt an der ersten Station neu), gezeichnet mit drawWalker (sitzend, `figS`,
      `seat`). Station ohne Rundkurs: Zug wartet am Bahnsteig (auch Vorschaubild). Nutzen: Schönheit (Gleis 1, Station 14).
      Gemessen: fahrender Zug +0,1–0,2 ms je Bild. Leistungs-Wächter: Gleis 31, Station 168–382 aufgenommen. Test: parkbahn.test.js
- [x] 136b (Rückmeldung Nutzer): Bahn „verschluckte“ die Schienen – Gleis wurde in der Objekt-Reihenfolge gezeichnet und deckte
      Wagen, die ins nächste Feld ragten; jetzt flach im Bodenbild (`cachedPath`, `drawFlat`), mit den Gebäuden nur Bahnsteig/Dach.
      Zug wechseln wirkte erst nach recalc → `pbModel` liest die Station live. Beim Bauen/ohne Rundkurs stand schon ein Zug da →
      wartender Zug nur noch im Vorschaubild der Zugwahl
- [x] 136c (Nutzer): Straßenbahn ohne Stromabnehmer (keine Oberleitung); offene Wagen/Tierwagen/Straßenbahn: hintere Wände fehlten je
      nach Fahrtrichtung (nur zugewandte Seiten gezeichnet) – jetzt zuerst die Innenseite der abgewandten Wände (`pbBox` 'back'),
      dann Fahrgäste, dann vorn. Geprüft in allen 4 Richtungen
- [x] 136d (Nutzer): Dachfarbe der Station wählbar (`STATION_COLS` in data.js: rot/blau/grün/gelb frei, rosa/türkis/lila/braun über
      Kunstakademie), wie bei Bänken über das Stationsfenster und die Bauleiste.
- [x] 136e (Nutzer: „zwei Stationen, trotzdem nur eine Bahn“): Stationsfenster zeigt die Züge der ganzen Strecke – Modell je Zug,
      ✕ entfernen (Preis zurück), „+ Zug“ (1000 Taler). Einer ist immer dabei (im Stationspreis). Wie viele passen, hängt von der
      Länge ab (`pbRoom`); Züge halten Abstand (`pbFree`: Heck des vorderen + 1 Feld), neuer Zug startet in der größten Lücke.
      Station abgerissen: Züge wandern zur nächsten Station der Strecke, sonst Geld zurück. Test: parkbahn
- [x] 136h (gefunden von der Testwelt „neu“, Block 149b): gekaufte Züge (`t.pbz`) wurden nicht gespeichert (fehlten in `tileOut`) –
      nach dem Laden nur noch ein Zug, Geld weg. Jetzt gespeichert. Test: parkbahn (Speichern und Laden)
- [x] 136f (Nutzer: „Zug glitcht durch die Stationen“): Wagen wurden mit ihrem Feld gezeichnet – stand einer noch auf dem Feld vor
      der Station, malte die Station (Dach, Schild, Bahnsteig) über ihn, ein Bild später er über sie. Die Station steht immer hinter dem
      Gleis: Wagen bis 1,1 Felder vor einer Station werden jetzt mit ihr gezeichnet (render.js, byTile). Test: parkbahn (Reihenfolge)
- [x] 136g (Nutzer: „seitlich gedreht fehlt unten der Boden vorn“): quer liegende Station hatte einen gespiegelten Rahmen (b quer ≠ (−dv, du)),
      pbBox zeichnete die verdeckten statt der vorderen Seiten. Jetzt a nach −y, dv = −1. Test: parkbahn (vordere Seiten, beide Richtungen)

## Block 137: Umbauen – „bezahlt bleibt bezahlt“
- [x] Gebäude merken sich das Höchste, was schon bezahlt wurde (Schloss `t.price` = Guthaben, Bahnhof `t.lenPaid`, Hbf `t.gleisePaid`):
      Umbauen bis dahin kostenlos, darüber nur der Unterschied; Verkleinern gibt nichts zurück, das Guthaben bleibt im Gebäude
      (Anzeige „Bezahlt … davon … als Guthaben“, „schon bezahlt – kostenlos wieder dazu“). Abriss: halber Wert des Bezahlten.
      Tests: hbf, bahnhof-lang, freizeitpark
- [ ] Beobachten: Schlüssel-Wächter (tempo-schritt3) schlug einmal im vollen Lauf fehl (2 Abweichungen), danach in 6 Läufen und 40
      Inseln nicht mehr – beim nächsten Mal die Ausgabe sichern. 08.10.: wieder einmal im vollen Lauf (v709), Ausgabe nicht gesichert;
      danach 10 Läufe grün. Ein Wächter-Test (Block 149) lief im vollen Lauf in die 5-s-Grenze – evtl. dieselbe Ursache (Last) → Zeit

      08.10.2026 abends: wieder einmal im vollen Lauf rot (vor dem Push), im nächsten vollen Lauf grün – weiter beobachten; beim
      nächsten Auftreten die Abweichung (welches Gebäude, welcher Platz) aus der Ausgabe festhalten.
## Block 138: Überdachungen (wie der Gang vom Parkplatz ins Disneyland Paris)
- [x] Umgesetzt (09.10.2026, js/roofs.js) nach Entwürfen mit dem Nutzer (tools/vorschau/dach-entwurf*.png, dach-ecken6.png):
      FLÄCHE statt Linie (Nutzer: „Ecken sauber, nichts überlagern, auch 2–3 breit“): `state.roofs` Feld → { form, col }, über Wegen
      (auch unter Ständen/Deko; nicht Brücke/Bahnübergang), gezogen wie Wege (Linie/Rechteck). Je Feld 3 × 3 Teilstücke (Grenzen
      x ± ½, x ± RW = 0,42 = Platz der Laternen am Wegrand): Mitte immer, Rand nur zum Nachbarn gleicher Form, Ecke nur mit beiden
      Nachbarn und dem schrägen – nie doppelt. Dachform aus dem Abstand zum Rand (Gewölbe, breit oben flach), Markisenstreifen mit
      eckigem Abstand und Schnitten genau auf den Streifengrenzen (keine Treppen). Formen (`DECO_LOOKS.dach`): Holz-Pergola (frei),
      Glas-Gang, Bunte Markise (6 Farben), Steinarkaden (Bögen zwischen den Stützen der Kante). STÜTZEN stellt der Nutzer selbst
      (Nutzer: „das Spiel kann das schlecht beurteilen“ → „Stützen aufstellen und dann das Dach drüber ziehen“): kleines Ding
      `stuetze` auf Ecken/Seitenmitten/Eckpunkt, steht genau unter der Dachkante, sieht aus wie das Dach darüber (`pillarForm`).
      Zeichnen: je Feld ein Bildchen (`roofSprites`) nach den Figuren des Felds (render.js tileB) – danach < 1 ms je Bild; Neumalen
      mit Zeitbudget 8 ms je Bild (sonst altes Bildchen der anderen Zoomstufe), erstes Malen Markise ~4 ms je Feld. Nachts weiches
      Licht unter Glas und Pergola. Fenster des Felds: Form/Farbe für dieses Feld oder alle verbundenen; 🧹 nimmt erst das Dach.
      Leistungs-Wächter: dach Form 0–3 und stuetze neu eingetragen (nur das Vorschaubild zählt, im Spiel gemerkt). Test: dach
- [x] Rückmeldung Nutzer (Bild): Dach wirkt, als hinge es über der Wiese hinter dem Weg; „wie löscht man die Abdeckung? ich lösche
      immer den Weg darunter“; „es sollte nicht zwingend Weg darunter sein“. → (1) Schatten der Dachfläche am Boden, mit der Sonne
      verschoben, je Form unterschiedlich dunkel (`drawRoofShadows`, im Boden-Bild) – man sieht, worüber es liegt. (2) Antippen mit
      👆/🧹 trifft das Dach, das man sieht (`roofPick`: Punkt ROOF_H unter dem Zeiger), nicht das Bodenfeld dahinter. (3) Dach auf
      jedem eigenen Land außer Wasser, Gebäuden, Gleisen, Brücken (`roofOver`); Dach über Wiese hat ein eigenes Fenster
      (`openRoofInfo`); unter ein Dach kommt kein Gebäude. Test: dach
- [x] Nutzer: „ach ich weiß, was das Problem ist – man kann die Pfeiler auf die Ecken stellen“ (Eckpunkt zwischen vier Feldern
      liegt bei 0,5, die Dachkante bei 0,42 → Stützen standen neben dem Dach). Jetzt rückt eine Stütze bis 0,16 neben einem Dach an
      den nächsten Punkt seiner Fläche (`pillarSnap`/`pillarPos`, auch für die Arkadenbögen); mitten unter breitem Dach bleibt sie.
      Bild tools/vorschau/dach-eckpunkte.png. Test: dach
- [x] Nutzer: „das Dach ist verpixelt und liegt unter den Pfeilern“ → (1) Dach-Bildchen mindestens so fein wie gezoomt (halbe
      Stufen nach oben, nie hochgezogen; vorher bei spriteStep gedeckelt). (2) Stützen werden mit dem hintersten Feld gezeichnet,
      das sie berühren, direkt vor dessen Dach (`drawPillarsOf` in tileB; ohne Dächer wie bisher in drawSmall) – vorher kam eine
      Stütze des vorderen Felds nach dem Dach des hinteren. Bild tools/vorschau/dach-nah-scharf.png
- [x] Nutzer: „du arbeitest unsauber“ (Pfosten ragt über das Balkenende, Oberseite schaut heraus) → bündig: Pergola-Pfosten enden
      unter dem Randbalken, der Randbalken reicht an Außenecken nur bis zur Außenseite des Pfostens (0,03), Markisenstange endet
      unter der Kante. Erst hatte ich zusätzlich das Raster und die Zacken umgebaut – Nutzer: „sieht richtig scheiße aus, du solltest
      doch nur es bündig machen“ → zurückgenommen. LEHRE: nur ändern, was der Nutzer anspricht; nichts „nebenbei verbessern“.
      Nutzer: „wieso ist da so ein Kreuz in den Ecken“ → Randbalken ohne Überstand (enden genau an der Ecke); dicke Pfosten
      (Pergola, Arkaden) stattdessen um ihre halbe Breite nach innen unters Dach (`pillarInset`, nur beim Zeichnen) – so liegen
      ihre Außenseiten unter der Kante. Bild tools/vorschau/dach-buendig2.png
      Nutzer: „NEIN passt es nicht – was muss ich tun, damit du raffst, was ich will“ → Ecke groß in 4 Varianten gezeigt
      (tools/vorschau/ecke-varianten.png, ecke-variante-d.png), Nutzer wählte D: Pergola-Randbalken als Kanthölzer (Stärke
      PERG_T 0,05, Höhe PERG_BH 1,6, Außenseite auf der Kante, laufen an Ecken zusammen), Pfosten gleich stark darunter, Querlatten
      obenauf. Nur die Pergola geändert. Bild tools/vorschau/dach-pergola-d.png. LEHRE: bei Form-Wünschen zuerst ein großes Bild
      der Stelle mit Varianten zeigen statt raten.
      Nutzer: „perfekt – halte das fest und änder an dieser Grundstruktur nichts mehr“ (in CLAUDE.md 29a festgeschrieben).
      Nutzer: „manche Streben sind nur angedeutet – gewollt?“ → nein: Latten-Richtung sprang je Stückchen um (Stummel). Varianten
      gezeigt (tools/vorschau/streben-varianten.png), Nutzer wählte B: Gitter in beiden Richtungen, alle 0,25, überall gleich.
      Leistungs-Wächter dach Form 0: 246 → 350 (mehr Latten, nur beim einmaligen Malen). Bild tools/vorschau/pergola-gitter.png
      Nutzer: „gefällt mir nicht, dass die Streben so überstehen – zeig Alternativen“ → 4 Varianten (tools/vorschau/latten-varianten.png),
      Nutzer wählte C: Latten fein (0,7) und zwischen den Randbalken eingelassen, oben knapp unter deren Oberkante. Bild
      tools/vorschau/pergola-fein.png
      Nutzer: „wieso sieht das weird aus – in echt würde man doch keine dünnen Streben nehmen und den Pfeiler drunterstellen“ →
      in echt tragen Pfosten Balken, auf denen das Gitter liegt. Varianten gezeigt (tools/vorschau/innere-balken.png), Nutzer: Balken
      in beide Richtungen, ABER NUR, wo Pfeiler drunter sind; ohne Pfeiler bleibt es dünn. `roofInnerBeams` (Balken bis zum Rand,
      nur solange das Dach ohne Lücke weitergeht; im Bildchen-Schlüssel). Test: dach. Bild tools/vorschau/innere-balken-spiel.png
      Nutzer: „wenn ich eine Stütze entferne, geht das ganze Dach weg“ → der Dach-Treffer (`roofPick`) nahm alles unter dem Dach.
      Jetzt `pillarAt` zuerst (Zeiger auf dem Pfosten zwischen Fuß und Dach): 🧹 entfernt nur die Stütze, 👆 öffnet ihr Fenster;
      daneben gilt weiter das Dach. Test: dach
      Nutzer: „erst alle vier Säulen hinstellen, dann das Dach – die Säulen werden nicht mit rangezogen“ → Säulen auf Ecken der
      Nachbarfelder lagen 0,16 (schräg 0,23) neben der Kante (Rückzug nur bis 0,16) und wurden zum Teil gar nicht gezeichnet (Dach
      suchte Stützen nur auf Feld + 3 Nachbarn). Jetzt ROOF_SNAP 0,24 und Suche in allen 8 Nachbarn (`PILLAR_NEAR`). Test: dach.
      Bild tools/vorschau/erst-saeulen4.png
      Nutzer: „in meiner Welt immer noch so“ → Daten aus seiner Welt per WLAN-Empfänger (v866, Säulen korrekt an der Kante): Fehler
      im GL-Standbild weit weg – Dach und Stützen zeichnet tileB, das im Standbild nur für Felder mit Bewegtem läuft → sie fehlten
      ganz (nur der Schatten blieb). Jetzt `roofLiveTiles` (Dachfelder + Besitzerfelder der Stützen) in glPlayTiles immer neu.
      Nutzer: „in deiner Ansicht geht es, in meinem Chrome nicht – selbe Version, anderes Verhalten“ → Bild aus seinem Chrome per
      WLAN verglichen (tools/vorschau/vergleich-ecken.png): Pfosten nicht eingerückt. Ursache: Kommazahl-Rundung abhängig von der Lage
      (−50,42 − (−50) = −0,4200000000000017 < −0,42) → Punkt auf der Dachkante galt als draußen. `roofSubOf` mit ROOF_EPS an allen
      drei Stellen. Test an vier Inselstellen (u. a. −15, −50). LEHRE: Grenzvergleiche mit Kommazahlen immer mit Spielraum.
      Nutzer: „unter einer Überdachung nachträglich einen Weg langziehen“ → die Sperre „kein Gebäude unters Dach“ traf auch den Weg
      (cat 'netz'); Weg ausgenommen, das Dach bleibt. Test: dach
      Nutzer: „Überdachung im Kreis, Mitte offen – Leisten oben innen nicht bündig“ → an Innenecken lagen die eingerückten Randbalken
      nebeneinander vorbei (leeres Quadrat, Stufe). Jetzt läuft ein Balken an einer Innenecke um seine Stärke weiter (Oberseite und
      Seite). Außenecken unverändert. Bild tools/vorschau/ring-ecken3.png
      Nutzer: „rechter Balken liegt auf dem linken“ → erster Versuch (Reihenfolge umdrehen) machte es schlimmer, zurückgenommen.
      Varianten gezeigt (ecke-hinten-varianten.png), Nutzer wählte C: die sichtbare Innenseite eines Randbalkens endet genau dort, wo
      der andere beginnt (Außenecke kürzer, Innenecke länger); Außenseiten unverändert. Bild ring-ecken-c.png
      Nutzer: „Stützen in den Innenkreis – nicht bündig, nicht richtig in den Ecken“ → (1) eine Stütze nah an zwei Kanten zugleich
      (Ecke des Hof-Felds) rutschte an eine der Kanten statt in die Hof-Ecke: `pillarSnap` nimmt dann die Ecke. (2) `pillarInset`
      aus den vier schrägen Nachbarpunkten (Außenecke/Kante/Innenecke) – in der Innenecke unter das Eck der Balken. Test: dach.
      Bild tools/vorschau/hof-stuetzen2.png
      Nutzer: „wie lösen wir, dass man schwebende Dächer bauen kann, Pfeiler aber selbst stellen soll?“ → 4 Wege gezeigt, Nutzer wählte
      A: Stützen kommen mit. Nach dem Ziehen (runPlan) bzw. Tippen bekommt jede Außenecke der neuen Fläche eine Stütze, wo im Umkreis
      0,15 keine steht – gratis (`free`, Abreißen gibt nichts), frei versetz-/entfernbar, ↶ nimmt sie mit dem Dach. Nur Außenecken.
      `roofAutoPillars`. Texte angepasst. Test: dach. Bild tools/vorschau/stuetzen-kommen-mit.png
      Nutzer: „beim Kopieren/Verschieben nimmt er nur die Pfeiler“ → Gruppe kennt jetzt `kind: 'roof'` (einsammeln, drehen, prüfen,
      Vorschau gestrichelt in Dachhöhe, absetzen nach allem anderen, abbrechen, Kopie kostet Dach, Speichern während des Tragens am
      alten Platz). Test: dach. Bilder dach-verschieben.png, dach-verschoben.png
- [x] Nutzer: „Holzüberdachung passt – auf Basis dieses Modells die anderen 3 anpassen“ → Rahmen allgemein (`ROOF_FRAME` je Form: Stärke,
      Höhe, Farben; `drawFrame`/`drawInnerFrame` aus der Pergola herausgelöst, Pergola unverändert), Pfosten je Form gleich stark bündig
      (`PILLAR_HALF` aus ROOF_FRAME), innere Balken und Auto-Eckstützen für alle Formen. Entwurf aller vier: tools/vorschau/vier-formen.png.
      Glas zuerst: Stahlrahmen 0,03, Bögen in beide Richtungen überall gleich (Nutzer wählte A aus glas-varianten.png). Bild glas-nah2.png
- [x] Steinarkaden: massives Dach (`solid`) – Innenseiten der Steinbalken und innere Balken liegen unter den bündigen Platten
      (vorher Rinne am hinteren Rand, Klötzchen an der Hof-Ecke, Rillen über inneren Pfeilern). Bilder stein-nah.png → stein-nah2.png
- [x] Steinarkaden-Dach (Nutzer: Ziegel, Terrasse, Gewölbe … gefielen nicht): Dachgarten (Standard) oder Belag mit Wegmuster und
      -farbe (`r.bel`, Weg-Stilname, `roofBel`; Wahl im Dach-Fenster per `wegPickHtml`, ohne Trittsteine). Test: dach. Szene
      tools/dachbelag.js, Bilder arkaden-belag-alle.png, arkaden-belag-nah.png
- [x] 138b Deko auf dem Dach (Nutzer: „imagine man könnte da jetzt Deko oben draufstellen“): nur Steinarkaden, nur kleine Deko
      (ohne Stütze/Souvenir), 8 Plätze je Feld (`r.top`, `roofTopPos` 0,3). Kleine Deko übers Steindach getippt → oben (`roofTopAt`,
      Vorschau mit `hover.top`); 🧹/👆 treffen die Deko oben vor dem Dach (`roofTopHit`, `openRoofTopInfo`). Dach abreißen bzw. andere
      Form: Deko voll zurück (`roofTopClear`). Zieht beim Verschieben/Kopieren mit (`roofCopy`, Kopie kostet sie mit). Zählt für
      Schönheit, Erfolge, Strom (Laternen als Platz 10 + i). Test: dachdeko. Szene tools/dachdeko.js, Bilder dachdeko-*.png
- [x] Nutzer: „bei den Überdachungen und bei der Deko drauf keinen Verschieben-Knopf“ → ✋ im Dach-Fenster (dieses Feld oder
      alle verbundenen, samt Deko oben und den Stützen, die nur sie tragen: `pickUpRoofs`, als Gruppe mit Drehen; `roofTopTurn`),
      im Fenster des Wegs darunter „✋ Überdachung verschieben“, im Fenster der Deko oben (`pickUpRoofTop`, `moving.top`; ablegen
      aufs Steindach `dropRoofTop` oder an den Boden). ✋-Werkzeug aufs Dach: erst Deko oben, sonst das Dachfeld. Test: dachdeko
- [x] 138c Brüstung oben auf Steinarkaden (Nutzer: „oben ein Zaun oder eine Mauer wie bei C, die rumgeht“): Mauer, Balustrade,
      Geländer wählbar im Dach-Fenster, abschaltbar (`r.par` 1–3; neue Steinarkaden mit Mauer, alte ohne). Steht genau auf dem
      Steinrahmen mit denselben Ecken (`parapetOps`), hinten im Dachbild, vorn live vor der Deko (`drawRoofFront`). Test: dach.
      Bilder bruestung-alle.png, bruestung-ecken.png
- [x] 138d Aufgang (Nutzer: „einen Aufgang, wo die Bewohner drauf rumlaufen können“): Entwürfe aufgang-varianten(2).png; erst
      Freitreppe C außen gebaut, dann auf Wunsch wieder entfernt – nur die Treppe durch die Dachöffnung (`dachtreppe`, 2 Felder unter
      Steinarkaden, oben Platz zum Aussteigen). Das Dach malt die Öffnung samt Treppe darin (`roofHoles`, `dtSteps`, niedrige
      Brüstung an drei Seiten, bündig: Fuß-Seite zwischen den langen). Leute oben (`roofers`): erscheinen an der Treppe, steigen
      hinauf, bummeln auf einem 1/3-Raster (`rfSpotOk`), setzen sich auf Bänke oben, gehen wieder hinunter. Test: dachtreppe.
      Szene tools/dachtreppeszene.js, Bilder dachtreppe-alle.png, dachleute-alle.png
- [x] Nutzer: „Doppel-/Dreifach-Aufgang – kombinieren, breiter“: Dachtreppen nebeneinander in gleicher Richtung werden eine breite
      Treppe (`roofHoles` jM/jP: Öffnung bis zur Feldgrenze, innen keine Mauer, Stufen laufen durch; jedes Feld malt auch die Treppen
      der Nachbarn in seine Öffnung). Lochwand als Schacht bis zum Boden. Test: dachtreppe. Szene tools/breittreppe.js, Bild breit-beide.png
- [x] Nutzer (Screenshot): Leute glitchen durch die Stufen → Leute auf der Treppe kommen mit dem zuletzt gezeichneten Feld der ganzen
      (auch breiten) Öffnung dran (`rfGroup`), Stufen davor aller Spuren gemeinsam sortiert nachgezeichnet; Schattenkante an Stufen, die
      zum Betrachter ansteigen. Balustrade auch um die Öffnung. Form wechseln gesperrt, solange oben Deko oder darunter eine Treppe
      ist (`roofFormLock`, auch beim Überbauen). Geländer-Ecken bündig, Öffnung am Rand ohne doppelte Brüstung (T-Stoß).
      Tests: dachtreppe, dachdeko. Szenen tools/breitdrehung.js, tools/gelaenderszene.js
- [x] Nutzer: „kann die Aufgänge nicht mitkopieren und bewegen“ → beim Ablegen/Kopieren liegen die mitgetragenen Dächer zur Probe schon
      da (`groupErrors`), ✋ im Dach-Fenster nimmt Dachtreppen ganz unter den Feldern mit (`pickUpRoofs`); in die Öffnung tippen trifft
      die Treppe (`holeHit`: 👆 Fenster, 🧹 nur die Treppe, ✋ aufnehmen; `demolishInfo(x, y, under)`). Test: dachtreppe
- [x] Nutzer (Screenshot): „Figuren spawnen aus dem Nichts und glitchen wieder durch die Treppe“ → sie kommen von draußen (2–6 Felder,
      nicht überdacht) über den Boden unter den Bögen zum Fuß (`rfWalkIn`, Zustände in/out, gezeichnet wie alle Bewohner) und gehen
      auf demselben Weg wieder hinaus; Leute auf der Treppe von hinten nach vorn gezeichnet, danach auch die vordere Randbrüstung
      ringsum im Bereich der Figur nachgezeichnet. Am Fuß keine Schachtwand (unten offen). Test: dachtreppe
- [x] Markise nach dem Modell durchgehen – Nutzer: „Markise passt so“ (09.10.2026)
- [x] Nutzer: „Leute auf dem Dach antippen“ → `walkerAt` kennt `roofers` (Kopf auf Dachhöhe, `walkerHead` mit w.up), Fenster wie
      bei Bewohnern („Spaziert auf dem Dach“ …), eigene Sprechblasen. Test: dachtreppe
- [x] Nutzer: „Verdeckung testen“ → tests/dachverdeckung.test.js: in allen vier Drehungen die Zeichen-Reihenfolge (Leute auf der Treppe
      nach allen Dachbildern der Öffnung, von hinten nach vorn, danach Stufen/Brüstung davor; oben vor der vorderen Brüstung).
      Gegenprobe: beide alten Glitches (eigenes Feld statt letztes der Öffnung; unsortiert) lassen ihn fehlschlagen
- [x] Nutzer: „Online testen“ → live.test.js: Zuschauen und Besuch mit Belag, Brüstung, Deko oben, Dachtreppe; Änderungen im „Rest“
      (Dächer) und in der Feld-Karte (Treppe) kommen an. Neuer Stand: `roofers` geleert (adoptState)
- [x] Nutzer: „vor allem mit unserem Wächter“ → Testwelt „dach“ (tools/dachwelt.js, GEN=1 npx vitest run tests/dachwelt.test.js,
      ?welt=dach) im Wächter je Bild, Leute oben mit festem Zufall. Fand gleich etwas: die vordere Brüstung wurde je Bild Strich für
      Strich gezeichnet (Balustrade!) – weit weg 3.170 Befehle statt ~1.500 wie die anderen Welten. Jetzt als zweites Bildchen
      (`e.fc`): 0,45 → 1.511, 0,8 → 844, nah 2,2 → 1.361. Grenzen aufgenommen
      Bild tools/vorschau/dach-buendig.png

- [x] Nutzer: „die Seite der Steinarkade gefällt mir nicht – 5 Alternativen“ (seite-varianten.png) → A/C gefallen, „Bögen bis zum Boden,
      automatisch, wo man einen Pfeiler hinstellt“, „Pfeiler rund“. Zwei Irrwege (Wand aufgeschnitten; Säule vor der Wand) → gewählt:
      Säulengang (saeulen-kapitell.png, Y): runde Säulen bis zum Kapitell (`ARK_CAP` = 65 % der Höhe), darauf die Wand, Rundbogen mit
      Bogenleiste zwischen je zwei Säulen; an Enden ohne Säule läuft der Bogen bis unter den Balken (keine Wand in der Luft).
      Vorschaubild Steinarkaden im Wächter 714 → 960 (nur einmal gemalt). Dachtreppe unter dem Dach wieder gezeichnet (Streifen je Feld):
      durch die Bögen sichtbar (treppe-seite.png). Szene tools/bodenbogen.js

- [x] Nutzer: „Straßenlaterne/hohe Gegenstände ragen durch die Überdachung“ → gemessene Höhen der kleinen Deko (`DECO_TALL`), unter ein
      Dach nur, was unter den Rahmen passt (`roofClear` = Höhe unter dem Balken − 1; Stein 18, Pergola 19,4, Glas/Markise 20):
      Straßenlaterne, Palme, Riesenblume, Kristall-Laterne (Stein/Pergola), Bankform 4 nicht. Auch kein Dach über zu Hohes, kein
      Formwechsel dorthin, Verschieben/Kopieren geprüft. „Bänke/Büsche oben ragen über die Überdachung“ → `roofTopSpot`: am Rand
      nach innen, samt Ausdehnung innerhalb der Brüstung. Tests: dach, dachdeko. Offen: „Schatten-Kreis beim Baum in der unteren Ecke“
      (nicht nachgestellt – Bild vom Nutzer erbeten)

- [x] Nutzer: „Ausblendefunktion für die Dächer, wenn man darunter etwas platzieren will“ → `roofFade`: Dächer zu 25 % durchsichtig,
      wenn das Werkzeug nur unten geht (Weg, Stütze, Dachtreppe, Deko, die oben nicht darf); bei kleiner Deko unter Glas/Pergola/Markise
      immer. Statt eines eigenen Dach-Schalters (Nutzer: „Leiste ist mir heilig“) ein Knopf, der mehr kann:
- [x] 👁 Durchsicht (Nutzer, auch Kevins Wunsch „Insel drehen, um dahinter zu bauen“): Knopf in der Leiste nach ↶ und Taste D –
      Dächer, Gebäude, Bäume und Wald, Bewohner und Fahrzeuge zu 25 % sichtbar, Tippen geht hindurch (bauen, anschauen, abreißen
      am Feld darunter; kleine Deko landet unter Steinarkaden dann unten statt oben). Nah, weit (Bildchen) und im GL-Standbild
      geprüft. Nebenbei: `setTool` nahm 👁 (und 🕘) das Leuchten. Test: dachdeko

## Block 139: Brücken breit und lang
- [x] Breit → umgesetzt als Block 151 (unten). Lang übers Meer bis zur nächsten Insel: gestrichen (Nutzer), stattdessen Block 150b

## Block 140: Relief – erst im Hinterkopf
- [ ] Nur Natur-Deko (Hügel/Berge 2×2–5×5), kein Höhenmodell. Zuerst einen Entwurf des **Tunnelportals für die Bahn** zeigen – erst
      wenn das dem Nutzer gefällt, weiterbauen

## Block 141: Freundesbuch übersichtlich
- [x] Oben die Zahlen (❤️ Herzen · 👋 Besuche · 📖 Einträge · 💛 Danke), „Neu seit deinem letzten Blick: …“ (bleibt beim Neuaufbau stehen)
- [x] „Wer war da“: je Freund eine Zeile mit allen Zahlen und „zuletzt …“, die ersten 8, „Alle anzeigen“; Gästebuch die neuesten 10,
      „Ältere anzeigen“ (je 20) – ohne neu zu zeichnen
- [x] Aufräumen (`bookFold`): Besuche/Herzen/Danke älter als 30 Tage und Gästebuch hinter den neuesten 200 wandern in Zähler je
      Freund (`users/<uid>/bookStats`, Transaktion mit „u“ – zwei Geräte zählen nichts doppelt) und werden gelöscht
- [x] Gästebuch höchstens 3 je Besucher und Tag auch in der Datenbank: Schlüssel `g_<uid>_<Tag>_<0–2>` (Regel); alte Schlüssel nur
      noch bis 14.10.2026 erlaubt (alte App-Versionen). Test: freundesbuch.test.js

## Kleinigkeit: Glasvilla ohne „Blick aufs Wasser“
- [x] Wunsch „wasser“ ganz gestrichen (HOUSE_STAGES, WISHES, Hilfe, Sprechblasen, Hinweise); Glasvilla wünscht sich nur noch Kultur
      (dazu alle Wünsche der Stufen davor). Test: kristall.test.js

## Block 142: Ladekreisel
- [x] `#loading` in index.html (steht schon, bevor die Skripte geladen sind): beim Start ganzer Bildschirm „Kachelhausen lädt …“, bis
      die Insel einmal fertig gezeichnet ist; beim Besuch „Die Insel wird geladen …“ (bis sie da ist, abgelehnt wird oder 25 s);
      beim Vorbereiten (Zoom weit raus, Sprung) kleines Schild „Insel wird gezeichnet …“ statt des ins Bild gemalten. Drehung per
      CSS (eigene Ebene) – läuft weiter, während ein langes Bild rechnet. Test: ladekreisel.test.js

## Block 143: Ruckeln – schnelle Hilfen (vor WebGL)
- [x] Messwerkzeug `tools/ruckeln.js` (`ruckelMess()`, Full HD, wartet je Bild auf die Grafikkarte; Tag/Nacht still, verschieben,
      zoomen, Dämmerung → Nacht; längstes Bild und Zahl > 33 ms)
- [x] Dämmerung mit Nachtbildern (`nightPicOn`): Löschbild mit Stärke night/NIGHT_MAX eingesetzt (wie live), Nachtbild immer mit
      voller Nacht gemalt; Vorwärmen kurz vor dem Einschalten (`preLit`, `prewarm`). Full HD, große Welt: Dämmerung 95 → 41 ms
      (Mitte), Bild gegen live in der Dämmerung so nah wie am Tag
- [x] Scheiben/Schein neben Kristalllicht als ein vorbereitetes Bild je Nachtbild (`warmPre`) statt ~9.000 Flächen je Bild,
      Nähe über ein Raster. Nacht still 46 → 41 ms, längstes 61 → 45
- [x] Boden: ein Grundstück knapp außerhalb des Bildes vorab malen, wenn Zeit übrig ist
- [ ] Offen (→ Block 144 WebGL): Grundlast ~37–41 ms bei Full HD (3.200 Bildchen kleben je Bild), Zoomen nachts 60–140 ms
      (jedes neu sichtbare Ding braucht Bildchen + Nachtbild), Verschieben nachts bis ~90 ms

## Block 144: WebGL weit weg (07.–08.10.2026, live seit v653/v667)
Grund: Grundlast bei Full HD ~40 ms je Bild (4.464 drawImage tags, große Testwelt, Zoom 0.6), nachts beim Zoomen 60–140 ms.
- [x] Schnelltest im Browser: dieselben 4.464 drawImage per WebGL2 (jedes Bildchen eigene Textur, kein Atlas) 6,7 ms statt 28,5 ms
      Canvas2D; Bild max. 15/255 Abweichung, keine „deutliche“ (ohne Streifen-Clip). Hochladen aller 1.209 Bildchen einmalig ~200 ms.
      Grenzen (Mac/Chrome-Fenster): MAX_TEXTURE_SIZE 16384, 16 Textur-Einheiten; alle Bildchen < 512 px
- [x] Kartierung (3 von 5 Prüfern, tools/webgl-kartierung.txt): Reihenfolge, Nachtlicht (Blendfunktionen), Plattform
- [x] Schritt 1+2 (Tag weit weg): js/gl.js – #world-gl unter #world; im GL-Bild (Tag, Zoom < 1, kein Werkzeug, ?gl=1 bzw.
      localStorage kachelhausen_gl=1) zeichnet ctx.drawImage während GLPASS nicht, sondern zeichnet auf (glRec); Streifen großer
      Gebäude als clipX; Live-Teile (Figuren, Züge, Schiffe, Brücke über Schiff, afterMovers, live Gebäude/Dekos/Linien) über
      glLive in die Sammelfläche LA (2048²) und als Rechteck an derselben Stelle; Wellen als ein Bildchen je Zoom (glWaves);
      danach (Himmel, Symbole, Schilder) wie bisher 2D obendrauf. Rückfall: kein WebGL2 (auch Tests), Fehler, Kontextverlust.
      Bild gegen 2D: ≤ 0,34 % Punkte > 8/255, keiner > 40 (nur Wellen-Kanten). Full HD DPR 2 Tag still 21 → 14 ms, verschieben
      22 → 18 ms. Dazu Feldsuche ohne toScreen je Feld (visibleTiles, bitgleich) und live Wege nur aus LIVE_FLAT
- [x] Messwerkzeug: ruckeln.js liest nicht mehr aus der Hauptleinwand (Chrome stellte sie sonst auf CPU um – frühere Messungen
      dadurch zu pessimistisch)
- [x] Zuschneiden im Hintergrund (cropAsync: createImageBitmap → Worker liest und meldet den Rahmen, zugeschnitten per drawImage;
      ohne Worker/OffscreenCanvas bzw. mit Lichtmaske wie bisher). Echter Bildtakt, Verschieben + Zoomen, Full HD DPR 2:
      alt 25,4 / 32,5 / 42,5 ms (Mitte/90 %/max), WebGL 21,0 / 32,7 / 69,7 – Spitzen jetzt vom Hochladen neuer Bildchen
- [x] Messzeile: echter Bildabstand (B/s) und GL-Zustand mit Grund. PC des Nutzers (i5, RTX 3070): GL an, Bild 30 ms, Rechnen
      20 ms → Engpass ist der Prozessor, nicht die Grafikkarte
- [x] Standbild-Merker (GLS in gl.js): Feldschleife geteilt in tileA (ruht) und tileB (Bewegtes); ruhende Rechtecke einmal mit
      Rand (25 % der Bildbreite) aufgezeichnet und auf der Grafikkarte behalten, danach nur verschoben (Uniform off); je Bild neu:
      Wellen, Bewegtes, „lebendige“ Felder (glLive/Fehlschlag, Uhren, Rathaus). Neu bei Zoom, Größe, groundVersion, texEpoch
      (freigegebene Texturen), drawEpoch (save ohne periodic, resetDrawCaches), außerhalb des Rands, nach 8 s; nur in ruhigen
      Bildern (calm ≥ 6). Schilder nur für wirklich sichtbare Felder. Mac Full HD: Rechnen 8,1 → 3,1 ms; Bild gegen 2D wie
      vorher (nur Wellen; am Bildrand jetzt auch Wellen von Nachbar-Grundstücken, die vorher fehlten)
- [x] Brücken und leuchtende Wege weit weg als Bildchen (spriteFlat, je Feld, Fassung groundVersion) – beim Nutzer 107 solche Felder
      hielten das Standbild aus („live Wege 107“) und kosteten Rechenzeit; Wellen im Standbild wieder unter Tiefe/Brücken (GLS.wAt)
- [x] Sammelbilder (Atlas, ATL in gl.js): Bildchen kommen auf Seiten von 4096² (bis 6, Regal-Packen mit 2 px Abstand), der Shader
      wählt die Seite (pg) und klemmt die Koordinaten aufs Bildchen; freigegebene Plätze zählen als Abfall, Neuaufbau nur außerhalb
      des Standbilds. Zeichenaufrufe je Bild ~2.000 → 54–63; glVerts ohne Hilfslisten je Eckpunkt
- [x] Wellen im Standbild: Grundposition wird mit aufgezeichnet, das Schaukeln (sin(now/900 + Phase) · 5·Zoom) rechnet der
      Vertex-Shader (Uniform wt, Attribut wv). Je Bild nur noch ~30 Rechtecke statt ~2.000. Testwelt „alles“, Full HD, Zoom 0,45:
      Rechnen je Bild 2,2 → 0,7 ms; Bild gegen 2D unverändert (0,33 % > 8/255, 0,001 % > 40)
- [x] PC des Nutzers nach Atlas + Wellen: Bild 22 ms, Rechnen 13 (verschieben max. 30 / Rechnen 20). Sammelfläche LA lädt nur noch
      ihre benutzten Zeilen hoch (vorher 2048² je Bild); Messzeile zeigt Vorbereiten / Felder / Grafikkarte / Hochladen / Rest
- [x] PC des Nutzers: 613 „lebendige“ Felder im Standbild (388× Schiene, 77× Mühle, 73× Windrad, 44× Hbf-Uhr, 9× Riesenrad),
      5.253 Rechtecke je Bild, Felder 11 ms. Schienen ohne Bahnübergang zeichnen im Objekt-Durchgang nichts → übersprungen;
      Uhren und Rathaus-Fähnchen nicht mehr jedes Bild, sondern neu aufnehmen, wenn sie weiterspringen (Schlüssel)
- [x] Entscheidung Nutzer (08.10.2026): Drehendes steht weit weg (Zoom < 1) still – Mühle, Windrad, Offshore, Wasserrad, Riesenrad,
      Karussell, Fahrgeschäfte als fertige Bildchen in fester Stellung (STILL_FAR, stillNow; ersetzt Entscheidung E1 aus Block 124).
      Nah dran dreht sich alles wie gehabt. Leuchtturm und Bahnübergang bleiben live. Gilt auch ohne WebGL
- [x] PC des Nutzers danach (Tag, Zoom 0,45, ?gl=1): Bild 18 ms, Rechnen 3,5 ms (vorher 26 / 17) – „geisteskrank flüssig“
- [x] ☰ → 🖥️ Grafik (nur dieses Gerät): Bildrate, „Weit weg: Drehendes steht still / dreht sich“ (Standard still, Entscheidung
      Nutzer), „🚀 Grafikkarte (Test)“ (Standard aus, ?gl= in der Adresse geht vor). Messkasten bleibt auf schmalen Bildschirmen im Bild
- [x] Nacht und Dämmerung über die Grafikkarte: Welt in ein Zwischenbild mit zwei Ausgaben (Farbe + echte Deckkraft, gleiche
      Mischung ONE/ONE_MINUS_SRC_ALPHA); Löcher (destination-out: Löschbild, Lichtmaske, punchGlow) als Rechtecke mit negativer
      Deckkraft, Stärke als Uniform nk – Standbild hält durch die Dämmerung. Danach Nachtblau (source-atop) beim Zusammensetzen und
      die Lichtschicht dahinter (destination-over), dieselbe wie 2D (nightLights in render.js: Fenster, warme Scheiben, Schein,
      Lichtbilder), ruhende Lichter im Standbild (GLS.light), lebendige je Bild. Ballons/Zeppelin nachts noch während der Aufnahme
      (GL.sky): stanzen Welt und 2D. Bild gegen 2D (Testwelt „alles“, Full HD): 23 Uhr 0,23 % > 8/255, 0,006 % > 40; 19:30, 20:30,
      5:30, 2 Uhr ähnlich. Nachts 3,7 ms je Bild (99 % < 5,1 ms) statt 11 ms in 2D; Neuaufnahme 35 ms
- [x] PC des Nutzers nachts (23 Uhr, Zoom weit, Grafikkarte an): Bild 18 ms, Rechnen 3 ms – „nachts flüssig“ (vorher bis 180 ms)
- [x] iPad (Safari): Tag und Nacht richtig, Standbild spielt, Felder 0,3 ms – aber „Hochladen 13,9 ms (68 Zeilen)“: Safari liest
      die ganze Sammelfläche zurück, egal wie viel benutzt ist. Sammelfläche jetzt 256 … 2048 Zeilen hoch nach Bedarf (wächst sofort,
      schrumpft nach 120 ruhigen Bildern)
- [x] iPad danach: Hochladen 13,9 → 3,4–4,7 ms, Rechnen 15,8 → 5,8–7,5 ms, 49–60 Bilder/s. Weiter: Sammelfläche 1024 breit,
      schrumpft schon bei halber Nutzung (über ~10 s); Safari zeichnet sie im Arbeitsspeicher (willReadFrequently, ?la=cpu/gpu)
- [x] iPad-Vergleich: Arbeitsspeicher (cpu) eindeutig besser – mit gpu lud auf dem iPad die halbe Insel nicht (Safari-Standard
      bleibt cpu; gpu nur Chrome & Co.)
- [x] Nebenbei behoben: drawNight – warmer Schein nach blauem Fleck wurde blau (circle setzte fillStyle ungemerkt)
- [x] Entscheidung Nutzer: Grafikkarte für alle standardmäßig an (☰ → Grafik schaltet aus), „Das ist neu“ 2026-10-08-grafik
- [x] Standbild im Hintergrund (GLB in gl.js): ab 30 % des Rands (bzw. nach ~5 s) wird das nächste Standbild in Stücken aufgenommen
      (glBgStep am Ende von render, 4 ms je Bild: erst Boden, dann Felder; Eckpunkte, Reihenfolge, Lichtschicht gleich mit), dann nur
      umgeschaltet (glBgSwapIn < 1 ms). Dabei malt nichts ins Bild (Füll-Befehle sind Leerlauf und machen das Feld lebendig, glLive
      malt nicht), fehlende Boden-Stücke je Schritt nur bis 4 ms. Testwelt Full HD, 600 Bilder Verschieben: keine Neuaufnahme mehr
      (vorher je Rand ~35–60 ms), Schritte 90 % < 8 ms, Bild gegen 2D unverändert (Tag, Nacht, Dämmerung). Neu: worldView/worldGround
- [x] iPad stürzte ab („wiederholt ein Fehler aufgetreten“, Speicher): Sammelbilder hielten alles je Benutzte bis 6 × 4096² = 384 MB
      auf der Grafikkarte (Aufräumen erst bei 2 Seiten Abfall und nie beim Abspielen – mit dem Hintergrund-Standbild also nie).
      Jetzt Safari 2048er-Seiten (höchstens 96 MB), Aufräumen schon bei 1 Seite Abfall und vor jedem Bild; Messkasten zeigt den Speicher
- [x] Schnell rein-/rauszoomen, dann verschieben ruckelte auf dem iPad stark: beim Tausch der scharfen Bildchen bis 490 Uploads in
      einem Bild (Safari liest jedes zurück). Jetzt gleich nach dem Zuschneiden vorab hochladen (glWarm, 2–3 ms je Bild): höchstens
      80–90, beim Wiederholen 7; statt mehrerer Neuaufnahmen je Zoom nur eine. Messkasten: „Speicher voll: N×“ (spriteFail)
- [x] Vorladen (Wunsch Nutzer, GLP in gl.js, nicht auf Safari/iPad): ruht das Bild 1 s, malt glBgStep „trocken“ Bildchen und Boden
      für einen Ring von einer Bildschirmbreite rings um das Bild (2–4 ms je Bild, Pause beim Bewegen, Hintergrund-Standbild geht vor,
      bis 3 Durchgänge, wenn das Budget nicht reichte). Boden auf dem PC länger und mehr behalten (3600 Bilder, 480 Stücke).
      Große Testwelt, Zoom 0,62, danach 1 Bildschirm weit verschieben: ohne 257 Bildchen gemalt und 541 Felder live beim Verschieben,
      mit 0 / 0 (90 % der Bilder 15,7 → 11,2 ms). ?vorladen=0 schaltet es zum Vergleichen ab
- [ ] Offen: Ist alles voll, bekommt der Rest eigene Texturen (große Welt, Zoom 0,7: +126 MB, 600 Aufträge) – Speicher auf dem iPad
      weiter beobachten; Wunsch Nutzer: von selbst vorladen (Speicherfrage)
- [ ] Zurückgestellt (Nutzer spürt nichts, 08.10.2026): Zoom ≥ 1 und gewähltes Werkzeug laufen noch im 2D-Weg
- [ ] Plan: neue `<canvas id="world-gl">` UNTER #world (pointer-events none); #world bleibt 2D (Eingabe, Schilder, Symbole) und
      wird in GL-Bildern durchsichtig – zugleich der Rückfall (?gl=0/1, Kontextverlust, Fehler → 2D). Alles bis einschließlich
      drawNight in EINEN GL-Puffer (Reihenfolge = Instanzliste der Felder-Schleife): Bildchen/Boden/Wald/Linien/Symbole als
      Atlas-Rechtecke (LINEAR ohne Mipmaps, highp, UNPACK_PREMULTIPLY_ALPHA), Streifen großer Gebäude als clipX je Instanz,
      Live-Teile (Figuren, Züge, Schiffe, Fahrgeschäfte, Wellen, Himmel, Geister) je Bild in eine 2D-Ablage malen, einmal
      hochladen, als Rechteck an ihrer Stelle; punchGlow als Radier-Instanz. Nacht: source-over (ONE, 1−SRC_A), destination-out
      (ZERO, 1−SRC_A), source-atop (DST_A, 1−SRC_A | ZERO, ONE), destination-over (1−DST_A, ONE); Bildchen + Löschbild in einem
      Shader (S über D, dann E radieren) statt Mischart-Wechsel. Nach drawNight bleibt alles 2D-Overlay (Feuerwerk 'lighter' klären)
- [ ] Offen zu klären: Hochladen in Safari (evtl. Rücklesen – nur am Bildanfang, aus cropSprite-Pixeln), iPad-Speicher (Leinwände
      nach Upload freigeben?), Zoom 1–2 (SPRITES_NEAR: viel live) evtl. 2D lassen, Tests (jsdom ohne WebGL → Rückfall immer)
- [x] Gefundener Fehler (unabhängig von WebGL): Sternschnuppe stanzte nachts NACH drawNight ein Loch (render.js drawFallenStar →
      glowQuad) – nur im 2D-Weg sichtbar. Jetzt eigener Schein mit „lighter“ (hellt auf, stanzt nicht). Test: tageszeit
      (scheitert mit dem alten Code). Im Browser nachts nachgesehen.

## Block 145: Hecken wie Wege – überbauen und umfärben (Wunsch Nutzer, 08.10.2026)
- [x] Über eine Linie ziehen ersetzt sie (gab es schon für andere Art/Form – kostet netto nichts, die alte wird gutgeschrieben).
      Fehler war die Farbe: gleiche Form in anderer Farbe galt als „schon so“ → „Hier ist schon alles fertig“. Jetzt zählt die Farbe
      (`edgeSame`), und gebaut wird immer die in der Leiste markierte Farbe (`edgeWantCol`, ohne Wahl Grün) – vorher behielt eine
      überbaute Hecke ihre alte Farbe, Grün ließ sich so nie überbauen. ↶ wie gehabt
- [x] Fenster jeder Linie (Hecke, Zaun, Mauer): „Ändern: Nur dieses Stück / Alle verbundenen (N) / Alle Hecken (M)“ (`edgeScope`,
      `edgesScope`: verbunden = gleiche Art an der Linie, ein Zaun daran zählt nicht), dann Form (Bild wie in der Kunstakademie,
      `edgeStyleBg` – auch in der Bauleiste) oder Farbe (Hecke) antippen – kostenlos, ↶ (`restyleEdges`, `recolorEdges`). Ersetzt den
      Knopf „Für alle anderen übernehmen“. In Fnymiland OG: 41 verbundene, 292 Hecken. Tests: zaun.test.js, buschfarben.test.js

## Block 146: Schienen – nur verbundene umstellen (Wunsch Nutzer, 08.10.2026)
- [x] Gleisfenster: „Ändern: Nur dieses Feld / Alle verbundenen (N) / Alle Gleise (M)“, dann Gleisbett antippen – kostenlos wie
      bisher, ↶ (`railScopeSel`, `railNetwork`: aneinanderliegende Schienenfelder inkl. Bahnübergänge und Brücken; Hauptbahnhof ist
      Kopfbahnhof, verbindet nichts; `restyleRails`). Ersetzt „Für alle anderen übernehmen“ beim Gleis. Überbauen durch Ziehen gab
      es schon (Block 112). Test: bahn-gemuetlich.test.js (zwei Netze, verbunden/alle, ↶). Browser-Blick offen (Fenster ging nicht auf)

## Block 147: Bänke (Rückmeldung Nutzer, 08.10.2026)
- [x] Rundbank war halb so breit wie die Parkbank, das Bäumchen winzig: Sitzring so breit wie eine Parkbank lang, innen niedrige
      Lehne, richtiger kleiner Baum (Stamm, volle Krone); Ring vorn vor dem Stamm
- [x] Gartenbank (schwebender Drahtbogen über der Lehne) – drei Entwürfe gezeigt, Nutzer: „alle drei“. Gartenbank = Englische
      Gartenbank (Latten-Lehne, geschwungener Abschluss, Armlehnen); neu in der Kunstakademie: Bank mit Blumenkästen (140),
      Laubenbank unter einem Rosenbogen (180). Alte Formen behalten ihre Nummer. Nutzen: alle Bankformen bringen gleich viel Schönheit
- Leistungs-Wächter: Gartenbank 76 → 122, Rundbank 21 → 50, neu 102 / 122 Zeichenbefehle nah – bewusst aufgenommen (Bänke,
  weit weg ohnehin Bildchen). Test: baenke-fussbruecke.test.js

## Block 148: Fußgängerbrücke über Schienen sauber anschließen (Rückmeldung Nutzer, 08.10.2026)
- [x] Deck war schmaler als der Weg (ARCH_W 0,3 < Weg mit Rand 0,36) – der Weg schaute an den Rampen seitlich hervor; jetzt
      `ARCH_W = EDGE_W + 0,01`. Unter der ansteigenden Rampe sah man den Weg am Boden weiterlaufen – Rampen auf den Wegfeldern
      jetzt massiv bis zum Boden, nur über den Gleisen offen. Alle vier Ausführungen im Browser geprüft. Test: baenke-fussbruecke.test.js
- [x] 148b (Screenshot Nutzer): durch den Bogen sah man noch in die Rampe hinein → Wände auf beiden Seiten und Stirnwand zur
      Gleisseite (etwas überlappend, keine helle Naht); Rampe landete in der Feldmitte und ragte über ein rundes Wegende („Zipfel“)
      → ARCH_SPAN 0,9 (setzt vorher auf)
- [x] 148c (Screenshot Nutzer, Stein): „Weg schaut oben einen Millimeter durch“ = Überlapp der Wegfelder (seamPad) ragte unter den
      Bogen → zu einer Fußgängerbrücke hin kein Überlapp (`padBorder(…, [x, y])`), Rampe massiv ab |b| = 0,46. „Zipfel in den Boden“ =
      vordere Wange hing an den Rampenenden th unter den Boden → auf Bodenhöhe begrenzt. Form bleibt (Nutzer: gefällt so)
- [x] 148d: „Bei Stein passt der Zug nicht durch, eine Wand davor“ – die dicke Wange (Stein 7) reichte über dem Gleis bis 15 (am
      Rand der Fahrspur tiefer), der höchste Zug ist 13. Über dem Gleis (|b| < 0,38) jetzt mindestens ARCH_CLEAR = 16. Geprüft mit
      einem Zug in Fnymiland OG unter einer Steinbrücke

## Block 149: Leistungs-Wächter – flüssig bleibt flüssig (Wunsch Nutzer, 08.10.2026: „Zukunftssicherheit ist mir wichtig“)
- [x] Wächter je Bild (tests/leistung.test.js): Testwelten groß, Freizeitpark, Farben × Zoom 0,45/0,8/1,2/1,6/2,2 × Tag/Nacht, wie iPad
      (Pixeldichte 2). Vorlauf, bis nichts mehr nachgemalt wird; dann ein Bild zählen: Zeichenbefehle, Linienstücke/Formpunkte, live
      gezeichnete Objekte. Grenzen in tests/leistung-grenzen.json (+10 % Spielraum). Im ruhenden Bild darf nichts neu gemalt werden
      (Bodenstück im Bild, Bildchen) – sonst wird ein Zwischenspeicher ständig ungültig. Zahlen in jedem Lauf gleich (geprüft).
- [x] Wächter je Ding (tests/leistung-je-ding.test.js): jedes Gebäude (Stufe 1 + höchste), jede Deko-Form, jeder Wegbelag allein nah
      gezeichnet und gezählt (zweiter Durchgang, Einmaliges zählt nicht). Teurer als +10 % → Fehler; **neues Ding ohne Wert → Fehler**
      (muss bewusst aufgenommen werden). Grenzen in tests/leistung-je-ding.json (202 Einträge).
- [x] Gegenprobe: Musterkacheln abgeschaltet → Wächter je Ding meldet Fischgrät 818 statt ≤ 435, Klinker, Riesenrad. (Der Wächter je
      Bild sah es nicht: in der ganzen Szene im Spielraum – darum beide.) Test-Zeichenfläche zählt (tests/setup.js `__ctxCount`) und
      kann Füllmuster (`createPattern`), damit Musterkacheln auch im Test laufen.
- [x] `npm run leistung:neu`: schreibt beide Grenz-Dateien neu – nur bei gewollter Änderung, dann hier begründen.
- [x] Messlauf im Spiel (☰ → Grafik → „📏 Messlauf (≈ 45 s)“): fährt Zoom 0,45/0,8/1,3/2 je ruhig + ziehen (Kreis, ~880 px/s) und
      rein/raus ab, misst echte Bildabstände (mit Grafikkarte) und Rechenzeit, zeigt Tabelle zum Kopieren (Gerät, Größe, Pixeldichte,
      Grafikkarte, Version), merkt sich „Ruckler gesamt“ vom letzten Mal. Kamera danach zurück. Test: messlauf.test.js
- [ ] Messlauf auf PC und iPad laufen lassen (Nutzer) und Zahlen hier eintragen – Ausgangswerte für spätere Vergleiche
- Gemerkt (teuerste Dinge nah, je Ding): Schloss 15.161, Botanischer Garten 12.231, Sternwarte 8.751 – alle anderen < 1.100.
  Kandidaten, wenn es nah am Schloss/Garten ruckelt. Einmal 104 ms Rechenzeit beim Ziehen (Zoom 0,8, Handygröße) nicht wiederholbar

- [x] 149b (Nutzer: „Was sagt unser Performance Watcher?“ → „bau die Testwelt neu“): Die drei Testwelten enthielten nichts von
      Block 132–151 – der Wächter je Bild sah die neuen Sachen nicht. Neue Testwelt „neu“ (tools/neuwelt.js, erzeugen mit
      GEN=1 npx vitest run tests/neuwelt.test.js, im Browser ?welt=neu): Bogenbrücken 2/3/6/9/12/16 in allen Arten, breite Brücke
      (3 × 16), Parkbahn mit 3 Zügen, alle Straßenlaternen-Formen beidseits zweier Straßen, alle Bänke auf einem Platz mit bündiger
      Hecke, Fußgängerbrücke über ein Gleis. Grenzen aufgenommen (nah Zoom 2,2: 3.172 Befehle Tag / 3.350 Nacht). Die Welt fand
      gleich einen echten Fehler: gekaufte Parkbahn-Züge (t.pbz) fehlten in tileOut → nach dem Laden weg (136h, behoben + Test).

## Kleinigkeit: Fische springen durch Brücken (Nutzer, 08.10.2026)
- [x] Wassertiere (Fisch, Goldfisch, Robbe, Frosch, Eisvogel) entstehen nicht mehr auf Wasserfeldern, auf oder direkt neben denen etwas
      gebaut ist (Brücke, Steg, Hafen – `natureAt`, 3×3 um das Feld). Möwen fliegen weiter. Test: bogenbruecken (Fische und Brücken)

## Kleinigkeit: Wasser unter Steinbrücken wie ein Schleier (Nutzer, 08.10.2026)
- [x] In den Bogenöffnungen lag ein halbdurchsichtiger dunkler „Schatten aufs Wasser“ (rgba 0,3), an den Feldkanten doppelt (Streifen).
      Entfernt (`archWall`) – das Wasser unter dem Bogen sieht aus wie überall, die Tiefe zeigt das dunkle Gewölbe.

## Kleinigkeit: Steinbrücke weit weg ohne Textur am PC (Nutzer, 24" FHD, 08.10.2026)
- [x] Mauerfugen der Bogenbrücken waren Striche 0,6 × Zoom – bei Pixeldichte 1 ab Zoom ~0,8 dünner als ein Bildpunkt, die Wand
      wurde einfarbig. Jetzt (`archWall`): Fugen mindestens 1 Gerätepunkt, Steinreihen nie enger als ~5 Gerätepunkte (sonst doppelt
      so hohe Steine – kein Grauschleier). Belag oben blasst wie bei Wegen bewusst aus (Block 125c).
- [x] Nachbesserung (Nutzer-Foto: helle graue Steinbrücke „immer noch“): Fugen auf hellem Stein (#d9d2c3) nur 20 % dunkler – weit weg
      kaum sichtbar. Jetzt werden sie weit weg kräftiger (bis 36 % dunkler, `far` aus den Gerätepunkten je Einheit).
- [x] Nachbesserung 2 (Nutzer: „wird sogar noch später scharf“, PC lud nachweislich v755 – Server-Protokoll): Am PC (Pixeldichte 1)
      zeichnet das Spiel bis Zoom 1,95 Bildchen (Mac nur bis 1,3, `2.6 / DPR`); die werden beim Einsetzen bis ×0,8 verkleinert und auf
      der Grafikkarte gefiltert – 1-Punkt-Fugen verwischen dabei. Jetzt weit weg zusätzlich Steine als Flächen in drei Tönen (`archWall`,
      `far`): überstehen das Verkleinern.
- [x] Nachbesserung 3 (Nutzer: „Es ist der BELAG auf der Brücke“ – das alte Linienproblem): Brückenbelag endete exakt an der Feldkante;
      weit weg ist jedes Brückenfeld ein eigenes Bildchen, dessen Rand beim Verkleinern halb durchsichtig wird – das Wasser schimmerte
      als helle Querlinie durch. Jetzt längs ~1,5 Gerätepunkte ins Nachbarfeld (`drawWegBridge`, `ASd`/`pd`, wie seamPad bei Wegen).
- [x] Echte PC-Bilder (tools/vorschau/melden.js in der Konsole am PC → Empfänger sink-lan.py auf 192.168.178.82:4182, nur vom PC):
      Edge, RTX 3070 Ti, Pixeldichte 1. Befund: Kristallweg auf breiter Bogenbrücke weit weg glatt fast weiß „wie Glasdach“ – das
      Mosaik blendete aus (patternFade). Nutzer wählte nach Vergleichsbild „Gröber“: Punkte/Steinchen (dots, stones) werden weit weg
      gröber statt zu verschwinden (`patCoarse`, `PAT_SCALE`) – erst ×2/×4 („massiv riesig“, Nutzer), jetzt: Abstand höchstens ×2,
      Steinchen nur ×1,4, nur wo das Muster sonst mehr als halb ausblendet;
      dazu (Nutzer: „eine Zoomstufe davor perfekt, ganz draußen scheiße“): Bildchen ganz draußen bei 0,51 ließen das Mosaik auf 33 %
      ausblenden, eine Stufe davor (0,64) 66 % – gröberes Muster jetzt nie unter 66 % (`PAT_FLOOR`, `patFadeEff`);
      danach (Nutzer: „mach beides“): Konfetti und alle Kachel-Linienmuster (Fliesen, Klinker, Fischgrät, Pflaster, Verband, Schach,
      Drittel, Platten – `PAT_TILE`, `patTileFill` mit S-fach großen Steinen) ebenso; ohne Kachel (gewölbter Brückenbelag, Steinreihen,
      Gemischt, Holzbohlen) wie bisher fein und ausgeblendet. Vergleichsbild tools/vorschau/linien-vergleich-gross.png;
      Grundfarbe nimmt bei übrigem Ausblenden den Mittelton an (`lookFar`). Brückenbelag auch quer zwischen den Reihen überlappend.
      Gilt für alle Wege. Tests: fugen (Muster weit weg).
## Kleinigkeit: Name überall „Fnymiland“ (Wunsch Nutzer, 08.10.2026)
- [x] Fenstertitel, Ladebildschirm, Fehlermeldungen beim Laden, Freundescode-Text zum Teilen, Dateinamen beim Sichern
      (`fnymiland-….json`), Kennung im Spielstand (`game: 'fnymiland'`, wird nirgends geprüft), Kopf von CLAUDE.md/KONZEPT.md.
      Bleiben (unsichtbar): localStorage-Schlüssel `kachelhausen_*`, `window.kachelhausen` – sonst wären gespeicherte Inseln weg.
      Alte geteilte Texte „Mein Kachelhausen-Freundescode“ werden weiter erkannt

## Kleinigkeit: Wege bündig an neuen Hecken (Rückmeldung Nutzerin, Fnymiland OG, 08.10.2026)
- [x] „Hecke um die Ecke ist rund, der Weg hört eher auf → Graskante; jedes Mal neu einstellen, bei manchen geht es nicht“. Ursache:
      neue Linien standen auf „mit Grasstreifen“ (bündig nur am Park, Block 57) – jede Linie einzeln auf bündig stellen; „bis an den
      Rand“ im Wegfenster gibt es nur an Wegenden, nicht an Ecken/Plätzen. Nachgestellt: L-Weg mit Hecke außen – Grasstreifen
      lässt in der Ecke einen großen Zwickel, bündig nicht. Entscheidung Nutzer: neue Linien bündig (`newFlush`: wie eine schon
      eingestellte Linie, an der sie hängt, sonst bündig), Knopf „Für alle anderen Linien übernehmen (N Stücke)“ (`setFlushAll`,
      ↶), bestehende bleiben. In ihrer Welt: 280 Stücke mit einem Klick. „Das ist neu“: `2026-10-08-buendig`. Tests: zaun.test.js

## Block 150: Bogenbrücken übers Wasser (Wunsch Nutzer, 08.10.2026)
- [x] Problem: alle Wegbrücken flach (3–8 hoch), Boote fuhren „in“ die Brücke. Nach vielen Vorschauen mit dem Nutzer entschieden:
      1 Feld bleibt flach; ab 2 Feldern (an beiden Enden Land) ein Bogen über die ganze Länge (Mondbrücke), Höhe 20,4·(N/2)^0,6
      (ab 16 Feldern nicht mehr höher). Steg ins Meer (offenes Ende): flach wie bisher. Abgelehnt: hochgestellte Brücken mit
      Rampen („sieht scheiße aus“), Klappbrücke (fehleranfällig), Sperren flacher Brücken („auf gar keinen Fall“)
- [x] Holz/Rot: Pfähle, ab 5 Feldern nur an jedem zweiten Feld. Stein/Ziegel: echte Öffnungen (Wasser im Schatten, Gewölbe,
      Rückwand), Mauerwerk in fester Steingröße versetzt (vorher übers Feld gestreckt: Gitter). Bögen (`archOpenings`): ≤ 6 Felder je
      Pfeilerabstand einer; 7–11 Hauptbogen so groß wie bei 6 + je ein Nebenbogen; 12–13 zwei Hauptbögen + je ein kleiner; ab 14 zwei
      große in der Mitte (Nutzer: „3, 6, 16 perfekt, nicht mehr anrühren“)
- [x] Zeichnen in der Objekt-Reihenfolge (`drawArchBridge`, sonst läge alles dahinter darüber), weit weg als Bildchen
      (`spriteArchBridge`), über einem Boot nur das Vordere (`BRIDGE_FRONT`). Bewohner gehen über den Bogen (`wegBridgeLift`, auch
      Schatten an den Füßen, GL-Rahmen höher). Boote nur unter hohen Stellen/durch Öffnungen (`archBoatOk`, `seaCross` → 'block');
      ist nirgends hoch genug (2er-Steinbrücke), überall durch wie bisher – nie absperren
- [x] Gemessen: 16er-Steinbrücke nah +0,3 ms je Bild; Leistungs-Wächter grün (weit weg Bildchen). Test: bogenbruecken.test.js
- [x] 150b: Brücken höchstens 16 Felder lang (`BRIDGE_MAX`, Nutzer nach Vorschau 16/20/24); ins Meer weiter 3 Felder – oder bis 16
      Felder zu eigenem Land in gerader Linie (`seaGapBridgeable`: Insel zu Insel). Bestehende längere bleiben. In Fnymiland OG mit
      künstlicher Insel 8 Felder vor der Küste geprüft (geht; ohne Insel nach 3 Feldern Schluss). Lange Meeresbrücken (Block 139) gestrichen

## Block 151: Breite Brücken (Wunsch Nutzer, 08.10.2026)
- [x] Mehrere Wegreihen nebeneinander übers Wasser = eine breite Brücke, höchstens 4 breit (`BRIDGE_WIDE`, Nutzer). Bauregel:
      `bridgeArmsAxis` – quer daneben nur Brückenfelder, alle Nachbarn in derselben Richtung (parallel ja; Abzweig/Ecke auf dem
      Wasser nein; Reihen wachsen vom Ufer aus). Richtung (`bridgeAxis`) jetzt über Land an beiden Enden statt erster Nachbar;
      Bogen auch ohne Weg vor dem Ufer (jede Reihe gleich hoch)
- [x] Zeichnen: Geländer/Brüstung/Pfähle nur außen, Belag und Planken durchgehend (Nutzer: Holz hatte Lücken – Planken gingen nur
      bis zum alten Rand), Stein/Ziegel: Seitenwand nur vorne, Bogenöffnung als Tunnel durch alle Reihen (`archWall` depth).
      Boote quer darunter durch wie bisher. Test: bogenbruecken.test.js


## Block 152: Mehr Beete (Wunsch Nutzer, 08.10.2026)
- [x] Das Blumenbeet sah eher wie ein Feld aus. Neun Formen (DECO_LOOKS.blumen, `drawBed` in draw-schmuck.js), je Größe 1×1–3×3:
      Blumenfeld, Steinrand (frei), Rundbeet 120, Rosenbeet 150, Tulpenbeet 120, Lavendel 150, Hochbeet 180, Sonnenblumen 150,
      Wildblumen 120 (Kunstakademie, Gruppe „Beete“). Nutzer: „das Braun ist zu kackig“ → nach Vergleich (Gartenerde/Mulch/dicht
      bepflanzt/Kies/schlicht Grün) **Boden wählbar** (`BED_SOILS` als cols, im Fenster „Boden“): Rindenmulch, Kies, Grün frei,
      Gartenerde 60. Alte Beete: Rindenmulch. Lavendel immer Kies, Wildblumen Wiese. Leistung: Krümel je Farbe ein Pfad (sonst
      großes Beet 4 845 Befehle, jetzt 1 527). Test: beete
- [x] Nachbesserung (Nutzer): Lavendel auf jedem Boden (nicht nur Kies). Beet-Größen heißen Klein · Mittel · Groß (`DECO_SIZES.blumen.names`,
      `sizeName`). Leiste „überladen, 5 Felder übereinander“: Form und Farbe/Boden aller Schmuck-Dinge (Laternen, Bänke, Beete …) wie beim
      Weg als je ein Knopf, die Auswahl klappt als Raster darüber auf (`lookPop`); am PC keine Hinweiszeile, wenn die Stil-Leiste da ist.
      Beim Beet am PC jetzt eine Reihe statt drei. Tests: beete, schmuck
## Kleinigkeiten nach dem Push v764 (Nutzer, 08.10.2026)
- [x] Ballons & Zeppelin abschaltbar: ☰ → Grafik „🎈 Ballons & Zeppelin: an/aus“ (nur wenn erfunden), je Gerät (localStorage
      `kachelhausen_himmel`, `skyShow`/`setSkyShow`), Seilbahn bleibt. Test: strassenlaterne (Ballons & Zeppelin abschaltbar)
- [ ] Ballons/Zeppelin „stottern manchmal“ (PC): auf dem Mac nicht nachstellbar (60 Bilder/s gleichmäßig, 20 s ohne Ausreißer).
      Messwerkzeug tools/vorschau/ruckeln.js (Konsole am PC, 60 s, schickt Ruckler mit laufenden Funktionen an sink-lan.py).
- [x] Brücke Mittelinsel → Obsthain-Insel (Spielstand „Bauland“): breite Brücke **Nord-Süd** in mehreren Reihen gezogen – ab der zweiten
      Reihe Löcher ohne Meldung (jedes 4.–5. Feld: „keine Abzweige“, „höchstens 4 breit“). Ursache `bridgeArmsAxis`: Feld der 2. Reihe
      hat beim Ziehen je Richtung genau einen Nachbarn (Feld davor, Reihe daneben) – bei Gleichstand galt immer Ost-West. Jetzt: mehr
      Arme längs entscheidet, bei Gleichstand die eindeutige Richtung eines Brückennachbarn (`bridgeRowAxis`). Ost-West war zufällig
      richtig, darum fand der Test aus Block 151 es nicht. Test: bogenbruecken (breite Brücke in beiden Richtungen)
- [x] „Das ist neu“ nach Tagen (Nutzer: „nicht 20× am 08.10.“): Einträge bleiben je Push einzeln (gesehen-Stand), angezeigt wird je Tag
      eine Karte mit allen Punkten (`newsDays`), Themenzeile höchstens 4 Titel + „weitere“. Test: news

## Block 153: Bauleiste neu – eine Reihe, Bereiche klappen auf (Nutzer, 08.10.2026: „ich finde dort NICHTS“)
- [x] Drei Entwürfe gezeigt (A Katalog hinter „Bauen“, B Bereiche klappen auf, C zwei Reihen); Nutzer wählte B. Unten nur noch eine
      Reihe (Werkzeuge, 🔍, 🕘, fünf Bereiche mit ▾). Ein Bereich klappt darüber ein Feld (`#sheet`, `setSheet`) mit allem aus dem
      Bereich auf, Gruppen als Überschriften (`.sheet-h`), jede Kachel mit Bild, Name und Preis (`.nm`). Wahl, Esc, daneben tippen oder
      derselbe Bereich nochmal: zu (Tipp auf die Karte baut dabei nichts). Bereichswechsel lässt das Werkzeug in der Hand; der Bereich
      mit dem gewählten Ding ist umrandet (`has-tool`). Gruppenzeile entfällt. Gleich auf PC, iPad und Handy. Tests: menu, leiste, handy
- [x] Nutzer: „man kann nicht scrollen in dem aufgeklappten Fenster“ – ein alter Mausrad-Handler an `#tools` lenkte senkrechtes
      Rad zur Seite um und verhinderte das Scrollen. Entfernt; das Feld scrollt normal (im Browser nachgemessen). Test: menu.
- [x] Nutzer: „die Hinweise, wenn man einen Gegenstand in die Hand nimmt, sollen weg“ (z. B. „Kunstakademie · Tür zeigt von selbst
      zum Weg“) – am PC/iPad keine Hinweiszeile mehr beim Wählen. Handy behält die kurze Zeile mit Preis und ⓘ (dort einziger Weg zum
      Infofenster). Tests: kopieren, leiste, handy.
- [x] Nutzer: „aufm Handy ist diese Leiste unspielbar“ – der offene Bereich zeigte seinen Namen, dadurch fielen Freizeit/Gestalten
      rechts raus. Handy: Bereiche immer nur als Symbol, ohne ▾; Feld höchstens 46 % hoch, fünf kleinere Kacheln je Reihe (im Browser
      bei 375 px nachgemessen: Reihe 319/319 px).
- [x] Nutzer: „die Suchfunktion können wir wegnehmen, die nutzt eh nie einer“ – 🔍 und Suchfeld entfernt (`searchQ`, `searchHits`).
      `searchNorm` bleibt fürs Nachschlagebuch. Tests: leiste, zuletzt.
- [x] Nutzer: „gewählte Kacheln eindeutiger; Hand/Löschen kaum erkennbar; am PC alle Knöpfe unterschiedlich im Maßstab“ –
      alle Knöpfe der unteren Reihe 34 px hoch, Symbole gleich groß. Gewähltes Werkzeug dunkel wie ein offener Bereich, gewählte
      Kachel im Feld mit dunklem Rahmen. Die Reihe passt bei 375/640/768/1024 px (nachgemessen); unter 900 px ohne ▾, unter 740 px
      nur der offene Bereich mit Namen.
- [x] Nutzer: „weißer Rand hinter dem dunklen Knopf; bei Kacheln unten mehr Rand; Pillen der Stil-Leiste (Wege, Beete) größer als
      Stadt/Herstellen; aufm Handy keine Option, etwas loszulassen“ – Ring entfernt; Kachelrahmen nur innen (rundum 3 px); alle
      Knöpfe der Stil-Leiste 34 px (gewählt nur farbig, nicht größer). 👆 wird ✕ „Weglegen“, solange etwas in der Hand ist
      (`syncDropBtn`, auch Kopier-Stempel), rot mit weißem ✕ (Nutzer: „damit man erkennt, dass man abwählt“). Test: handy.
- [x] Nutzer: „die 5 Kategorien sinnvoll zusammenlegen, ohne zu überladen“ – drei Entwürfe gezeigt (A Stadt + Einkaufen,
      B Wirtschaft, C nur drei), Nutzer wählte A. Vier Bereiche: 🏘️ Stadt (Wohnen, Läden, Essen & Trinken, Markt, Kaufhäuser,
      Einrichtungen, Verkehr – 46 Dinge), 🏭 Herstellen, 🎡 Freizeit, 🌸 Gestalten. Gruppen-IDs unverändert. Anleitung angepasst.
      Tests: menu, leiste.
- [x] Nutzer: „für die Schnelligkeit innerhalb der Kategorien sortieren“ – gezählt in Fnymiland-OG und Bauland. Stadt: Wohnen,
      Verkehr, Einrichtungen, Läden, Markt, Essen & Trinken, Kaufhäuser. Herstellen: Veredeln ans Ende. Freizeit: Freizeitpark-Gruppen
      vor Wunder und Kultur. Grün: Blumenbeet vor Blumentopf. Stadtschmuck: Laterne, Bank, Brunnen vorn, Freundesbank hinten.
      Gruppen ganz ohne Freies rutschen im Feld ans Ende (Anfänger sehen oben keine Schlösser). Test: menu.
- [x] Nutzer: „wieso übergeben wir nicht dem Nutzer die Anordnung?“ – drei Entwürfe (A Favoriten, B Anordnen-Modus, C frei ziehen),
      Nutzer wählte B. „⇅ Anordnen“ rechts in der ersten Überschrift des Felds: Gruppen als Liste mit ↑/↓, „Standard“, „Fertig“.
      Je Gerät gemerkt (`kachelhausen_menuorder`, `orderedGroups`/`moveGroup`); unbekannte IDs fallen weg, neue Gruppen hängen
      hinten an, kaputter Wert = Standard. Zuklappen beendet das Anordnen. Zahlentasten folgen der Reihenfolge. Test: menu.


## Block 154: Einstellungen als eigenes Fenster, neue Grafik-Schalter (Nutzer, 09.10.2026)
- [x] ☰ gekürzt: Hilfe, Das ist neu, Rathaus, ⚙️ Einstellungen ›, 💾 Spielstand › (sichern/laden/neu, `showSaveMenu`), Weiterspielen.
- [x] ⚙️ Einstellungen (js/settings.js): Schnellwahl ✨ Schön · ⚖️ Ausgewogen · 🚀 Schnell (nur Leistung; markiert, was passt),
      Zeilen „Name … Wert“ in zwei Spalten (Handy eine). Neu: Tageszeit (echte Uhr / immer Tag), Schatten, Symbole über Häusern,
      Namensschilder (Sehenswürdigkeiten + Figuren; „entdecken“-Schilder bleiben), Glitzer & Feuerwerk, Schärfe (voll/halb =
      DPR × 0,5), Einwohner (viele/wenige/keine, nur Bild), Tiere. Standard wie bisher = „Ausgewogen“. Test: einstellungen

## Kleinigkeit: 🕘 öffnet manchmal erst beim zweiten Klick (Nutzer, 09.10.2026)
- [x] Nach einer Wahl aus „Zuletzt gebaut“ (oder ✕/Werkzeug) klappte die Leiste zu, `recentOpen` blieb aber an – der nächste 🕘-Klick
      schaltete nur den Merker aus. `setSheet(false)` setzt ihn jetzt mit zurück (und nimmt die Hervorhebung vom 🕘). Test: zuletzt

## Block 155: Schnellwerkzeuge entrümpeln – 🧹 geht in ✋ Auswählen auf (Nutzer, 09.10.2026)
Nutzer: „können wir auswählen und löschen nicht zusammenlegen … löschen aus dem Schnellzugriff entfernen“. Gewählt: Wald/Fels über
👆-Fenster roden, Aufgenommenes hat 🗑️, ✋ heißt „Auswählen“, 🛤️ Weg bleibt.
- [x] 155a ✋-Auswahl: „🗑️ Abreißen · +X“ neben Verschieben/Kopieren (wie das 🧹-Rechteck, aber Wald/Fels bleiben)
- [x] 155b ✋ aufgenommenes Ding: „🗑️ Wegwerfen“ (Abriss am alten Platz, Erstattung wie 🧹)
- [x] 155c 👆 auf Wald/Obstwiese/Fels: Fenster mit 🪓 Roden/Sprengen samt Preis
- [x] 155d 👁 Durchsicht zeigt Tunnel (bisher nur mit 🧹 in der Hand)
- [x] 155e 🧹 raus aus der Leiste; ✋ heißt „Auswählen“; Tasten E/Entf/Rücktaste löschen Auswahl/Aufgenommenes/offenes Fenster
- [x] 155f Texte (Hilfe, Tipps mit 🧹), „Das ist neu“
      Umgesetzt: `selDemolishPlan`/`demolishSelection` (plan.js `keepLand`), `discardCarried` (actions.js: zurücklegen, dann wie
      Abreißen; Kopie am Finger hat kein Wegwerfen), `openLandInfo`, `drawTunnelView` mit `seeThrough`, `deleteKey`; „Abreißen“ nie
      in 🕘 (`NOT_RECENT`). Werkzeug 'abriss' bleibt intern (Tests, Vorschau). Test: auswahl-abriss. Offen/zur Ansicht: auf dem Handy
      stapelt die Auswahl-Leiste jetzt vier Zeilen (Verschieben, Kopieren, Abreißen, ✕)

## Block 156: Deko in der Feldmitte (Nutzer, 09.10.2026: „wieso kann man Dekoelemente nicht exakt mittig setzen?“)
Gewählt: überall außer auf schmalem Weg; Mitte sperrt die Seitenmitten, Ecken bleiben frei; alle kleine Deko.
- [x] Platz 9 = `CSLOT` (`SLOTS` jetzt 10): nah der Mitte getippt (`CSLOT_NEAR` 0,2) rastet ein (`centerWanted`), nicht auf schmalem
      Weg/Gebäudefeld (`centerTileErr`; Platz = 2×2 Wege oder breiter Weg geht), keine Stützen. Gezeichnet zwischen den Ecken 1/2 und den
      vorderen Seiten (`SLOTS_FRONT`). Verschieben, Gruppe drehen, Kopieren, Abreißen, Speichern; oben auf Steinarkaden ebenso
      (`roofTopPos`, `roofTopAll` über `PLACE_SLOTS`). Ältere Versionen schneiden den Platz beim Laden ab (zeigen ihn nicht).
      Test: deko-mitte (SLOTS-Erwartungen in decos, gruppe-drehen, dachdeko angepasst)

## Kleinigkeit: Tunnel löschen ohne 🧹 (Nutzer, 09.10.2026: „wie löschen wir jetzt Tunnelwege?“)
- [x] Einzeln: 👁 an (Tunnel sichtbar) → 👆 antippen → 🗑️ (wie vorher: steht etwas darüber, erst das). Fehler aus Block 155 behoben:
      ✋-Auswahl → Abreißen riss auch unsichtbare Tunnel mit – jetzt nur mit 👁 Durchsicht. Test: auswahl-abriss
- [x] Tunnel-Werkzeug mit Schalter „+ Graben / − Entfernen“ (Nutzer: „damit man nicht die halbe Stadt umbauen muss“): Linie ziehen
      bzw. antippen entfernt nur den Tunnel, oben bleibt alles stehen, Taler voll zurück; unter einer U-Bahn-Station nicht.
      `tunnelErase` (gilt, solange der Tunnel in der Hand ist), `scanTunnelErase`, `removeTunnel`. Test: tunnel-entfernen

## Kleinigkeiten U-Bahn-Station (Nutzer, 09.10.2026)
- [x] Weg als Untergrund: Station auf einem Weg/Platz lässt den Weg liegen (`plazaOk` wie Stände), Weg auch nachträglich darunter;
      Sockel nur ohne Weg. Seitenmitten bleiben gesperrt, kein Dach drüber (Mast). Test: ubahn
- [x] Treppe mit Mast: Rückwand zwischen den Seitenwänden (Ecken bündig, vorher überlappten sie hinten)
- [x] Mast „überdimensioniert, steht drauf“: Entwürfe tools/ubahn-mast.js (A heute, B Mauerecke, C vorn, D ohne Mast) – Nutzer wählte
      „B, aber mittig wie D“: kleiner Mast (17 hoch, Schild 7) mittig aus der Rückwand. Pavillon/Häuschen unverändert
- [x] „Mauerecken sind Schrott – alle 3 Modelle ansehen“: Treppe und Pavillon bestanden aus überlappenden Kästen, je Drehung in falscher
      Reihenfolge gemalt. Jetzt eine U-förmige Mauer als ein Stück (`ubPrism`, `ubU`: Seiten von hinten nach vorn, dann oben),
      Pavillon-Pfosten genau auf den Rahmenecken. Häuschen (ein Kasten) war in Ordnung. Prüfbild: tools/ubahn-ecken.js
- [x] Pavillon: „die vertikalen Streben stehen komisch vor der Wand“ – die Pfosten gingen bis zum Boden und wurden nach dem Rahmen gemalt
      (ihr Teil im Rahmen landete davor). Jetzt stehen sie auf dem Rahmen (Höhe 5–18), darunter ist der Rahmen selbst

## Kleinigkeit: Zaun um einen Brunnen auf dem Platz (Nutzer, 09.10.2026)
- [x] Unter Dingen auf einem Platz liegt Weg – jede Zaunseite wurde ein Durchgang (nur Pfosten). Gewählt: nichts ändert sich von selbst,
      im Fenster der Linie (antippen) „⬜ Durchgang / Zaun geschlossen“ (`e.shut`, `setShut`, `wayAcross`; Bogen geht beim Schließen
      zurück). Test: zaun-durchgang

## Block 157: Anhöhen (Relief à la Animal Crossing, Nutzer 09.10.2026: „ich lass mich drauf ein“)
Ziel in Stufen: 1 Anhöhe mit Deko ✓ · 2 Wege + Rampe ✓ (157h) · Gleise oben + Gleis-Rampe ✓ (157i) · 3 Gebäude oben (auch Bahnhöfe) ·
4 Bahn (Tunnel durch den Berg geht schon, Steigungen über die Gleis-Rampe).
Fundament von Anfang an: jedes Feld hat eine Höhe (`state.hills`: Feld → { w: Wandart, h?: Ebene, Standard 1 }), nicht als Dachform.
Konzeptbild: tools/anhoehe-entwurf.js. Entscheidungen Stufe 1: Wand wählbar (Fels Standard, Erde, Trockenmauer), erst eine Ebene
(Fundament kann mehr), Rechteck aufziehen wie Gelände (Gestalten → Wege & Gelände), oben Kleinkram + Deko-Felder (Brunnen, Beete,
Statuen …) und Wald/Obst als Boden; Wege und Gebäude oben erst Stufe 2/3.
- [x] 157a Datenmodell, Speichern/Laden, Werkzeug „Anhöhe“ (Rechteck, Wandart in der Leiste), Regeln (was darf drauf, was nicht),
      Abtragen (✋ Auswahl → Abreißen, Fenster der Anhöhe)
- [x] 157b Zeichnen: Block (Wände + Oberseite, als Bildchen), Inhalt der Felder angehoben, große Deko, Schatten, weit weg / GL
- [x] 157c Antippen und Vorschau in der Höhe (Feld, Deko-Platz, Linien, Bau-Vorschau, Planen)
- [x] 157d Aufgang: Treppe in die Anhöhe eingelassen (Nutzer; Entwurf tools/treppe-entwurf.js): Ding `huegeltreppe` unten vor der
      Wand, dreht sich von selbst hinauf (`stairRot`), Stufen im Wegstil (Leiste wie beim Weg ohne Trittsteine/Wegform, Fenster für die
      ganze breite Treppe), nebeneinander breit ohne Wangen, an der Kante ein Keil in der Wandart der Anhöhe. Anhöhe mit Treppe nicht
      abtragbar (auch nicht per ↶). Menü: eigene Gruppe „⛰️ Anhöhen“ (Anhöhe + Treppe, wie die Überdachungen) – „Wege & Gelände“ hätte
      sonst 11 Dinge; gemerkte eigene Anordnungen bekommen neue Gruppen hinter ihren Vorgänger (`orderedGroups`).
      Leistungs-Wächter je Ding: `huegeltreppe` = 1 Zeichenbefehl – die Treppe ist ein fertiges Bildchen je Feld (`drawHillStair`,
      `hillSprites` 's' + Feld, Neumalen im Zeitbudget wie die Anhöhe), gezeichnet wird nur das `drawImage`. Tests: huegeltreppe-regeln,
      anhoehe-treppe
- [x] 157e Spaziergänger (js/hill-walkers.js): kommen vom nahen Weg zum Fuß, steigen hinauf, bummeln oben (Raster ⅓ Feld, nicht an der
      Kante, nicht durch Deko/Linien), setzen sich auf Bänke, gehen wieder hinunter und weg; je Anhöhe nach Größe, höchstens 16, nachts
      halb so viele. Antippen → Bewohner-Fenster. Offen: Deko direkt am oberen Ende sperrt den Ausstieg (dann keine Leute, ohne Hinweis)
- [~] 157f Rest: erledigt – Tiere nicht auf die Wand, Laternenlicht oben, Minimap, Hilfe; offen – Testwelt im Leistungs-Wächter,
      „Das ist neu“ (beim Push), Schatten von Dingen oben, Tunnel unter einer Anhöhe im 👁-Bild, zweite Ebene (pickFrac maxLv, Rand)
      Leistungs-Wächter je Ding: `anhoehe` Form 0–2 = 0 Zeichenbefehle – `drawObject` zeichnet für die Anhöhe nichts, Wand und
      Oberseite kommen als Bildchen aus `drawHillTile` (hills.js). Test: anhoehe
      Umgesetzt mit Ultracode-Ablauf (5 Bereiche parallel, dann Tests und Prüfung). Nachgebessert: dunkle Kante oben zur tieferen
      Seite hinten (Oberseite hob sich nicht ab), Linien oben/unten an der Kante nicht verbunden (`freeEnd`), Stützen und Deko auf
      Dächern hinter einer Anhöhe nicht durch sie hindurch antippbar (`hillInFront`).
- [x] 157g Treppe in eine bestehende Anhöhe (Nutzer 10.10.2026: „nicht erst ranbauen … sondern auch überschreiben“): Treppe auf ein
      Randfeld getippt → Feld abgesenkt (Erstattung der Anhöhe mit dem Treppenpreis verrechnet, Schild „Treppe in die Anhöhe: −40“), Treppe
      dreht hinauf, ein ↶-Schritt. Meldungen: Inneres, etwas darauf, schon eine Treppe hinauf, Linie/Eckpunkt-Deko, Ebene ≠ 1, zu schmal,
      Wasser davor. Wald/Fels oben: roden/sprengen wie unten. Verschieben/Gruppe/Kopie in die Anhöhe gesperrt (Ablegen senkt nie ab;
      Abreißen gibt alles zurück). Vorschau zeigt das Feld abgesenkt, Nachbarn mit Wand (eigene Bildchen). Spaziergänger: wer auf dem Feld
      steht, ist weg, wer hinwollte, kehrt um (`hwLowered`). Offen: Schatten im Boden-Bild erst nach dem Bauen (Vorschau zeigt den alten).
      Nachgebessert „bündig“ (Nutzer): Keil ohne Überstand (vorn eine Stufe hoch, hinten so hoch wie die Anhöhe, Oberseite wie der Boden,
      Grasnarbe so dick wie die der Wand und um die Ecke durchlaufend), Grasnarbe/Felsschichten an Feldgrenzen ohne Versatz, Oberseite ohne
      Spitzen an Ecken, dunkle Kante oben mit geraden Enden, neben der Treppe bis zur obersten Stufe, Innenecken auf Gehrung, Lichtkanten
      breiter Treppen nicht doppelt. Test: treppe-buendig
- [x] Wandfuge (1 Gerätepunkt grünlich zwischen zwei Wandbildchen, alle Anhöhen): Wand reicht `HILL_EXT` unter das später gezeichnete
      Nachbarbild, nur gerade weiter und an Innenecken (`hillExt`, im Bildchen-Schlüssel). Gemessen bei z 4,5: Vorder- und Seitenwand an
      allen Fugen durchgehend Wandfarbe. Test: treppe-buendig (die Helfer scheiterten am Wochenlimit, selbst fertiggestellt)
- [x] Nutzer: Treppe keine Deko (keine Schönheit, kein Deko-Wunsch, kein Park); Menügruppe „Anhöhen“ bleibt; Treppen hinten erlaubt
- [x] Ecktreppe (Nutzer: „Treppen um die Ecke – erhöhter Platz aus allen Richtungen“): Feld schräg vor der Ecke zwischen zwei Treppen,
      die um sie hinaufführen; erkannt beim Setzen (auch eingesetzt), `t.ecke`, Drehung r = Achsen STAIR_UP[r], STAIR_UP[r+1]. Stufen
      L-förmig (Stufe = min der beiden), an den Grenzen genau wie die Nachbartreppen; gemalt als n×n Zellen von hinten nach vorn
      (`paintStairCorner`). Hängt an Nachbartreppen und Anhöhe (Abreißen/Aufnehmen/Abtragen gesperrt), keine Linien daran, kein
      Aufgang für Spaziergänger. Nebenbei: Drehung beim Einsetzen am Rand bevorzugt echten Fuß und Nachbartreppe gleicher Richtung
      (zweite Randtreppe drehte sich sonst längs). Test: anhoehe-treppe
- [x] Nutzer: „wenn da schon so etwas steht, muss man erst die Teile entfernen – umständlich“ → Treppen richten sich aus (`stairFit`,
      `refitStairs`): nach jedem Bauen einer Treppe die Treppen ringsum (Ecke, gerade Richtung); eine Treppe auf eine Treppe gesetzt =
      kostenlos ausrichten (`stairRefitError`); Einsetzen in den Rand, auf den schon eine Treppe führt, geht, wenn sie sich danach neu
      ausrichten lässt (`stairIntoRefits`, probehalber). Test: anhoehe-treppe (Ecke zuerst, dann die Nachbarn; ↶)
- [x] 157h **Stufe 2: Wege oben und Rampe** (Nutzer 10.10.2026, Entwurf tools/rampe-entwurf.js, Vorschau tools/vorschau/rampe-varianten.png).
      **Die Weg-Rampe ist durch die Gleis-Rampe ersetzt (157i)** – hinauf zu Fuß nur noch über die Treppe; der Rest dieses Eintrags ist Geschichte:
      Ding `huegelrampe` mit allen vier Entwürfen – A 1 Feld (steil), B 2 Felder (flacher, Länge in der Leiste), C offene Seite = Keil mit
      Geländer, D längs der Wand (an der Ecke selbst drehen: ⟳/R springt zur nächsten passenden Richtung). Eingelassen wie die Treppe, auch in
      den Rand einer fertigen Anhöhe (Felder abgesenkt, Erstattung verrechnet, ein ↶-Schritt), Belag = Wegstil aus der Leiste, nebeneinander
      gleich gerichtet und gleich lang = breite Rampe. Preis 200 Taler + 8 Stein für beide Längen (Länge 2 ganz eingelassen: 40).
      Verbindung über `levelLink`: Rampe für alle (Wegenetz, Viertel, Markt, Erreichbarkeit, Fahrzeuge), Treppe nur zu Fuß; Weg oben und Weg
      unten nebeneinander sind getrennt. Oben dürfen Wege aller Stile und Platz-Dinge (Stände, Brunnen, Laternen, Bänke …), Gebäude erst
      Stufe 3; Anheben unter einem Weg geht (er kommt mit hinauf). Erreichbarkeit „in der Nähe“ nur in derselben Gegend (`hillRegions`:
      Anhöhe ohne Rampe zählt nicht). Bewohner/Spaziergänger gehen über Rampe und Treppe, Fahrzeuge nur über die Rampe, Höhe stetig am
      Fußpunkt (`figUp`); Tiere bleiben unten.
      Umgesetzt mit Ultracode-Ablauf (Rampe, Netz, Wege zeichnen, Bewegtes parallel, dann Zusammenbau). Beim Zusammenbau gefunden und
      behoben: `rampSink` der Rampe überschrieb die gleichnamige Funktion der Tunneleinfahrt (Züge sanken nicht mehr – jetzt `rampIntoSink`,
      Test auf doppelte globale Namen); Gartenweg und Vorplatz eines Gebäudes unten liefen bis an die Felswand, wenn oben ein Weg vor der Tür lag;
      Leute auf dem Weg zur Dachtreppe hätten über Rampe/Anhöhe gehen können (in der Schräge, `w.up` 0) – jetzt unten, sonst Höhe der Schräge;
      GL-Rahmen um Figuren auf Rampe/Treppe reicht um ihre Höhe weiter hinauf (Ballon); Treppe und Rampe in `LATE_ALBUM` (Deko-Seite).
      Leistungs-Wächter je Ding: `huegelrampe` = 1 Zeichenbefehl – wie die Treppe ein fertiges Bildchen je Feld (`rampFieldDraw`, `hillSprites`
      'r' + Feld, Neumalen im Zeitbudget), gezeichnet wird nur das `drawImage`. Wege oben nah live (wie Gebäude), weit weg als Bildchen
      (`spriteFlat` 'hflat'). Tests: rampe-regeln, anhoehe-netz, anhoehe-wege, anhoehe-bewegt, anhoehe-stufe2 (alle Drehungen × Länge 1/2 ×
      vor der Wand/eingesetzt: Netz, Wege, Bewohner, Fahrzeuge, ↶, Speichern)
      Offen: Testwelt mit Anhöhen im Leistungs-Wächter (157f); große Plätze oben werden nah jedes Bild live gezeichnet (iPad ansehen);
      Bewohner, die oben festsitzen (Rampe abgerissen), bummeln bis zum Heimweg weiter; „Das ist neu“/NEWS beim Push
- [x] 157i **Gleis-Rampe und Gleise auf Anhöhen** (Nutzer 10.10.2026: „die Rampe ist nur für Züge da“, „Autos soll es nie geben“; Entwurf
      tools/gleisrampe-entwurf.js, Bild tools/vorschau/gleisrampe-varianten.png). `huegelrampe` ist jetzt die Gleis-Rampe (Verkehr, hinter der
      Schiene; Forschung Bahn), vier Formen in der Leiste wie im Entwurf: A 2 Felder eingelassen (Wände der Anhöhe als Wangen), B 3 Felder Damm mit
      Stützmauer davor, C 4 Felder (oben 2 schmal eingelassen, unten 2 Damm), D 4 Felder Viadukt auf Steinbögen mit Brüstung. Preise: A 400 + Stein 8,
      Metall 2 · B 500 + Stein 4, Pflaster 6, Metall 3 · C 600 + Stein 10, Pflaster 2, Metall 4 · D 900 + Pflaster 10, Metall 4 (A/C mit Erstattung
      der abgesenkten Anhöhe). Im Fenster Form wechseln (A ↔ C, B ↔ D; anderes nur mit Abreißen, weil sich sonst Gelände ändern müsste).
      Schienen dürfen oben liegen, verbinden sich nie über die Kante (Prellbock), nur über die Rampe; Bahnhöfe/Hbf/U-Bahn/Einfahrt oben erst Stufe 3.
      Züge fahren über alle Formen hinauf und hinunter, Höhe stetig, Wagen starr und schräg, verdeckt von Wangen/Streifen/Brüstung davor; halten
      nur unten. Wege, Bewohner, Spaziergänger, Tiere nie auf der Rampe; die Treppe verbindet das Wegenetz.
      Entscheidungen: `t.form` als Buchstabe (bei Stadtschmuck/Gleis-Stil sind Formen Zahlen – so verwechselt nichts); alte Weg-Rampen (nur lokale
      Testwelten, nie online) entfernt `parseSave` mit Erstattung statt Umwandlung (eine 1-Feld-Rampe passt in keine Form, eine 2-Feld-Rampe vor der
      Wand nicht als A); `cat: 'deko'` bleibt (volle Erstattung, Geist, kein Weg ersetzt sie); Gleis-Stil auf der Rampe = der der Strecke am Fuß bzw.
      oben (keine eigene Bedienung).
      Umgesetzt mit Ultracode-Ablauf (Rampe, Gleisnetz, Gleise zeichnen, Züge parallel, dann Zusammenbau). Beim Zusammenbau ergänzt: Spaziergänger
      nur noch über Treppen (`hwFresh`), Antippen eines Zugs oben öffnet sein Gleisfeld (`tap` → `trainAt`), eine gezogene Schienenlinie über die
      Rampe zählt ihre Felder als schon gebaut (`planCheck`), Bauen und ✋ Ablegen per Tippen an der Wand (`rampAnchor` in tap/setHover: an
      Wänden hinten lag der Anker sonst bis zu 3 Felder davor), Prellbock an freien Enden der Rampe und Büschel/Blumen des Gleis-Stils auf Damm und Einschnitt
      (`rampStop`, `railTrim`), Texte („Gleis und Weg kreuzen sich nur auf ebenem Boden“, Tipp der Anhöhe nennt Gleise). Alte Anhöhen-Tests auf
      die Gleis-Rampe umgeschrieben (Weg-Rampe → Treppe bzw. „nie über die Gleis-Rampe“). Leistungs-Wächter je Ding unverändert (`huegelrampe` = 1
      Zeichenbefehl, je Feld ein Bildchen) – nicht neu aufgenommen. Tests: gleisrampe, rampe-regeln, gleis-ebenen, gleis-zeichnen, zuege-ebenen,
      anhoehe-stufe2 (jede Form × alle Drehungen mit echtem Zug zwischen zwei Bahnhöfen, ↶, Speichern, Zeichnen nah/weit/nachts) u. a.
      Offen: Wagen beim Feldwechsel können Bäume/Deko vorn links übermalen (wie unten schon vorher); Treppen vor einem Zug werden nicht ausgespart;
      weit weg (WebGL) kann die Zelle das Nachmalen der Rampe am Rand abschneiden; ✋-Gruppen/⧉ Kopien mit Rampe legen weiter am Griff ab (kein
      `rampAnchor`); „Das ist neu“/`NEWS_HISTORY` beim Push.
      Kritische Prüfung (10.10.2026, Nahaufnahmen tools/gleisrampe-pruefung.js → tools/vorschau/gleisrampe-nah-final.png, Test gleisrampe-kritik):
      behoben – Übermalen im schmalen Einschnitt C malte den ganzen Umriss des Streifens samt Boden und Gleis über die Anhöhe davor (jetzt nur
      Oberseite/Wand/Stirn); Wagenschatten hingen an Stützmauer und Viaduktwand (`rampShadowClip`); Treppe in die Anhöhe direkt hinter dem oberen
      Feld einer Rampe senkte es ab (Rampe führte gegen die Treppe); Schienenlinie quer über die Rampe war grün (gab zwei getrennte Enden);
      Fußgängerbrücke über einen Bahnübergang oben an der Kante hing über die Kante (auch getragen) – jetzt nur bei ebenem Boden längs des Wegs,
      daneben kein Anheben/Abtragen/Treppe/Rampe (`archHillError`, `archAround`). Offen: Tunneleinfahrt direkt vor dem Fuß verbindet nicht (beide
      Seiten zeigen den Prellbock – eine Schiene dazwischen legen); Linie an der Seite einer Rampe A ohne Wange steht in ihrer Wand.

- [x] 157j **Stufe 3: Gebäude oben** (Nutzer 10.10.2026: „mach schritt 3 direkt“). Entscheidungen:
      Oben erlaubt: **alle normalen Gebäude** (Häuser, Betriebe, Läden, Bildung, Strom auf Wiese – was Wasser/Ufer/Strand/Steg braucht, geht
      oben nicht), **große Bauten** (Wunder, Kultur, Freizeitpark), **Bahnhof und Hauptbahnhof** (Züge halten oben, Linien unten ↔ oben über die
      Gleis-Rampe), **U-Bahn-Eingang** (auf dem Tunnel unter der Anhöhe, Treppe führt durch die Anhöhe hinunter). **Tunneleinfahrt nur unten.**
      Mehrfeld-Gebäude immer ganz oben auf einer Ebene, nie über die Kante. **Ohne Treppe:** Bauen geht, das Fenster warnt („Keine Treppe führt
      hinauf“), Erreichbarkeit wie bei „weit weg“ (🐌 50 %, ein Zug oben hilft wie unten). **Überdachungen oben: später, eigener Block (157k).**
      **Umgesetzt** (Ultracode-Ablauf: Regeln, Zeichnen, Bahn, Figuren parallel, dann Prüfung Logik + Bilder): `hillOk` lässt alle Gebäude oben zu
      außer `HILL_NO` (Dächer, Dachtreppe, Stütze, Parkbahn, Seilbahn, Tunneleinfahrt, Treppe, Gleis-Rampe …) und `HILL_WET` (Ufer, Strand, Hausboot,
      Meer, Offshore, Seebrücke); `hillError` mit eigenen Hinweisen, Mehrfeld über `sameLevel` (gilt so auch für ✋, Gruppen, Kopien, Ausbau).
      Gelände: `hillCarryOk` (was beim Anheben/Abtragen mitkommt, die alte Stufe-2-Liste), `hillStuckOn`; Anheben unter Gebäuden gesperrt („erst mit ✋
      wegtragen“), Abtragen nur, wenn das Gebäude mit wegkommt; ↶ bringt nie ein Gebäude über die Kante. Erreichbarkeit: `hillNoStair`, Häuser und
      Bahnhof in Laufweite nur in derselben Gegend; Fenster `hillInfoStatus` (keine Treppe / keine Tür auf ebenen Boden), Vorschau und Toast.
      Zeichnen: Schlagschatten oben im Bildchen der Anhöhe (`hillShadeFresh/Sig/Paint/On`), Zuschnitt an der Kante (`hillCutOf`, `hillCutClip`:
      Garten, Büsche, Hof, Vorplatz nie in der Luft, Dächer ganz), Felder davor vorgezogen (`hillEarly`, `hillPre`), Höfe oben weit weg als Bildchen,
      U-Bahn-Eingang in der 👁-Ansicht mit Strich vom Tunnel hinauf. Bahn: Zug in der Halle eines Hbf oben zeichnet der Hbf selbst (Boden → Zug →
      Gebäude), kein Zug in die Halle eines Hbf auf anderer Höhe (`lineRoute`), Bahnhof länger/Hbf-Gleise nur auf der eigenen Ebene (`growLevelErr`),
      Viertel einer Linie je Gegend (`stopViertel`), Achterbahn nur auf einer Ebene (`coasterLevelOk`), Bahnhofsfenster nennt den Grund ohne Halt
      (`stopLevelHint`). Figuren: Wege und Ziele nur in derselben Gegend (`walkPath`, `findGoal`), `setGoal`/`meGo` suchen ab dem nächsten Feld,
      Besucher fangen nie oben ohne Treppe an (`guestSpawn`); eine Treppe direkt vor einem Haus oben ist seine Tür. Tests: stufe3-regeln, -zeichnen,
      -bahn, -figuren, -kritik, -pruefung und stufe3-ganz (eine Welt mit allem zusammen: Linie unten ↔ oben, U-Bahn oben ↔ unten, Bewohner,
      Speichern/Laden, Abriss-Rechteck mit ↶, ✋-Gruppe an der Kante, Zeichnen nah/weit/nachts/👁). Entscheidungen der Agenten (dem Nutzer zeigen):
      Büsche/Garten an der Kante gerade abgeschnitten statt über die Wand; Zuschnitt gilt auch für große Deko und Marktstände oben; Treppe zählt nur
      mit begehbarem Fuß und oberem Feld (`hillStairUse`). Einzelne 1×1-Gebäude einer ✋-Gruppe dürfen auf verschiedenen Ebenen landen (jedes ganz).
      **Kritische Prüfung (Logik)** (10.10.2026, Test stufe3-kritik): behoben – ↶ nach „Wandart umstellen“ unter einem Gebäude oder großer Deko oben
      scheiterte („dort steht inzwischen etwas“) und warf den Schritt weg (große Deko: Rückschritt gegenüber Stufe 2; undo prüft jetzt nur, wenn sich die
      Höhe ändert); Tortürme oben und unten bekamen einen Bogen über die Kante (`torLevelOk`: beide Türme und alles dazwischen auf einer Ebene);
      **Treppe zugestellt** (offener Widerspruch aus dem Zusammenbau): ein Gebäude auf dem oberen Feld oder dem Fuß der einzigen Treppe sperrte
      den Aufgang, die Anhöhe galt aber weiter als erreichbar („nah“, Bewohner suchten vergeblich, kein Hinweis) – jetzt zählt eine Treppe nur, wenn
      Fuß und oberes Feld begehbar sind (`hillStairUse`; breite Treppe auch über die Nachbartreppe). Was sie versperrt, gehört zu beiden Gegenden
      (die Treppe ist seine Tür; `hillRegions` both, `sameRegion`), der Rest der Anhöhe ist „weit weg“. Hinweise: Fenster „Die Treppe hinauf ist
      zugestellt“ bzw. „🪜 Versperrt die Treppe“, beim Bauen ein Toast, in der Bau-Vorschau „🪜 versperrt die Treppe“ (`previewDelta.blocks`).
      `hillRegions` merkt sich dafür auch COVER (Schlüssel `cv`). „Weg am Eingang“ des Hbf oben zählte einen Weg unten vor dem Portal (jetzt nur
      gleiche Höhe). Geprüft ohne Befund: Drehen (R, im Fenster), ✋ Tragen, Gruppen gedreht, ⧉ Kopien, Ausbau (Bahnhof länger, Gleise, Halle,
      Märchenschloss), Abriss-Rechteck/✋-Auswahl mit Anhöhe darunter, Treppe/Gleis-Rampe einsetzen und Form wechseln (auch auf Nebenfeldern großer
      Gebäude), Anheben/Abtragen daneben, Wasser-Bedarf, Wunder, Laden alter Stände (keine Bereinigung), Besuch (Anhöhen kommen über `rest` mit).
      Dazu ein Wächter aus 400 zufälligen echten Spielzügen (fester Zufall): nie über die Kante, oben nur `hillOk`, nie doppelt belegt (sabotiert
      man hillError, schlägt er an). Offen: Freizeitpark und Park zählen weiter über die Kante als eine Fläche (schon seit Stufe 2); Blumenbeet-Bonus,
      Hässliches und Schönheit ringsum wirken über die Kante (Sichtweite, so gelassen); Fuß über eine Ecktreppe erreichbar wird nicht erkannt (dann nur
      ein Hinweis zu viel).
      **Kritische Prüfung (Bilder)** (11.10.2026, Nahaufnahmen Zoom 4–8 mit tools/stufe3-pruefung.js → tools/vorschau/stufe3-nah-final.png; dazu
      Vergleich oben ↔ dieselbe Szene flach Bildpunkt für Bildpunkt (`s3pDiff`): 7 Größen × 4 Drehungen × Kante +y/+x/Ecke/hinten, alle 87 Arten
      innen, Ausbau-Stufen; Test stufe3-pruefung): behoben – (1) an hinteren Kanten (−x, −y, Ecken) schnitt die Oberseite des Felds neben/vor dem
      Gebäude Garten, Hof, Büsche und weiche Schatten gerade ab (es durfte nicht vorgezogen werden, weil dahinter Tieferes später kommt): jetzt malt
      es das Gebäude nach seiner Oberseite auf seiner Raute noch einmal (`hillLate`), schon gezeichnetes Tieferes dahinter sperrt nicht mehr, und
      entschieden wird je Gebäude einmal vor dem ersten Streifen (`hillPreDone`; Schloss: weicher Schatten lag sonst doppelt); (2) das Feld schräg
      rechts hinter jedem Gebäude oben kam später und legte den Streifen, um den seine Oberseite nach vorn größer ist, über das vorgezogene Feld
      davor (Feldgrenze 2 Punkte versetzt) – solche Felder dahinter werden mit vorgezogen (bis 4 tief, breite Gebäude); (3) der Schatten auf dem
      Garten, der über die Grundfläche reicht (Reetdachhaus), lag unter dem Garten und endete an der Feldgrenze – jetzt darüber wie unten
      (`hillShadeSpill`: Boden-Durchgang als Maske, `hillSpills` misst je Aussehen, nah je Gebäude gemerkt); (4) heller Strich (1 Gerätepunkt), wo
      ein Schatten über den Rand einer Grundfläche mit flachen Teilen läuft (Schule, Höfe): das Bildchen der Anhöhe beschattet den Streifen vorn
      (`hillShadePaint`, nur zu fremden Nachbarn), `hillShadeOn` genau auf der Grundfläche; (5) Bau-Vorschau oben: Rahmen vorn und rechts nur halb
      so breit (die Nachbarn deckten die äußere Hälfte; seit Stufe 1, auch Deko) – `hillFrame` zeichnet ihn auf gleich hohen Nachbarn nach;
      (6) flache Teile oben liefen mit der Zeit (Becken der Glasvilla schimmerte oben, unten ruht es im Boden-Bild) – oben jetzt auch Zeit 0.
      Geprüft ohne Befund: Vorderkante +x/+y und Ecken aller Größen 1×1 … 7×7 in allen Drehungen (Garten, Hof, Vorplatz und Schatten enden genau an
      der Kante, Grasnarbe durchgehend, Tür zur Kante ohne Vorplatz), innen alle Arten gleich wie unten (bis auf Kantenglättung), Ausbau-Stufen,
      Treppe und Gleis-Rampe A/B neben Gebäuden, Bahnhof und Hbf oben mit Zug (auch Einfahrt in die Halle), U-Bahn-Eingang oben und an der Kante
      (👁: Strich vom Tunnel hinauf), Nacht (Lichter an hinteren Kanten wie innen), weit weg als Bildchen und mit WebGL, Geist an der Kante.
      Leistung: Reetdachhaus oben nah ~10 µs je Bild ruhend, ~20 µs beim Schwenken (Mac, 36 Häuser). Offen: beim Nachmalen bleibt im
      beschatteten Garten an der Feldgrenze eine Naht von 1 Gerätepunkt (Kantenglättung zweier Zeichnungen, ebenso ±1 Punkt an Grundflächen mit
      Hof); weit weg mit WebGL wird nicht nachgemalt (Überstand unter 1 Punkt); Vorschau von Linien (Zaun-Plan, `hillMarkEdge`) nicht geprüft.
- [ ] 157k Überdachungen oben (Pergola, Glas, Markise, Arkaden, Stützen, Dachtreppe) – eigener Block nach 157j.
- [ ] 157l **Offen zu Anhöhen – später gemeinsam ansehen** (Nutzer 11.10.2026: „das gucken wir uns später an“):
      - Entscheidungen der Agenten bestätigen: Garten/Büsche an der Kante gerade abgeschnitten (statt über die Wand); Zuschnitt auch für große Deko
        und Marktstände oben; zugestellte Treppe (Fuß/oberes Feld belegt) = Anhöhe „weit weg“ mit Hinweis; ✋-Gruppe mit 1×1-Gebäuden darf halb oben,
        halb unten landen (jedes ganz auf einer Ebene).
      - Naht von 1 Bildpunkt im beschatteten Garten an Feldgrenzen (Nachmalen, Kantenglättung); weit weg mit WebGL wird nicht nachgemalt.
      - Vorschau beim Zaun-Ziehen oben (`hillMarkEdge`) ungeprüft – evtl. vorn halb so breit wie früher der Bau-Rahmen.
      - Park und Freizeitpark zählen über die Kante als eine Fläche; Blumenbeet-Bonus, Schönheit, Hässliches wirken über die Kante.
      - Bewohner springen beim Losgehen schräg aufs erste Wegfeld – behoben nur mit Anhöhen; für alle Inseln beheben?
      - Treppe: Breite folgt nicht der Nachbartreppe; Antippen einer Treppe mit dem Werkzeug übernimmt die gewählte Breite nicht; Fuß nur über eine
        Ecktreppe erreichbar wird nicht erkannt (Hinweis zu viel).
      - Gleis-Rampe: Wagen übermalen Deko/Bäume vorn links; Treppen vor einem Zug nicht ausgespart; weit weg kann das Nachmalen abgeschnitten werden;
        ✋-Gruppen/⧉ Kopien mit Rampe legen am Griff ab; Tunneleinfahrt direkt vor dem Fuß verbindet nicht; Zaun an der offenen Seite einer A-Rampe
        ohne Wange steht in ihrer Wand.
      - Fußgängerbrücken, die schon vorher an einer Kante standen, werden nicht nachgeprüft.
      - Beschreibung der Anhöhe im Baumenü (data.js `anhoehe.desc` und Tipp) nennt noch keine Gebäude oben.
      - Leistung: Gebäude mit Garten oben kosten nah ~10–20 µs je Bild (iPad ansehen); Testwelt mit Anhöhen fehlt im Leistungs-Wächter.
      - Vor dem Push: „Das ist neu“/NEWS_HISTORY für Anhöhen, Treppe, Gleis-Rampe, Gebäude oben.
- [x] 157m **Bergportal: Tunnel in die Wand einer Anhöhe** (Nutzer 11.10.2026: „wieso haben wir keine Tunneleinfahrt an einer Seitenwand?“).
      Entscheidungen: als Wand mit Öffnung (kein Block vor der Wand), eine Öffnung reicht (keine Mindesttiefe der Anhöhe). Formen zur Wahl:
      **A Steinbogen** (Keilsteine, Schlussstein im Ring) und **D nur die Öffnung** (schmaler dunkler Rand in Wandfarbe) – Entwurf
      tools/bergportal-entwurf.js, Bilder tools/vorschau/bergportal-varianten.png (A–E), bergportal-zug.png/-zug-nah.png (A/D mit Zug, +y/+x,
      Fels/Erde/Mauer). Öffnung 0,6 Feld breit, Kämpfer 7, Scheitel ~18 (Wand 26); Gleis läuft eben hinein und wird nach hinten dunkel, dahinter
      der Tunnel unter der Anhöhe (U-Bahn-Netz). Offen beim Bau: Wagen am Portal (Stück im Berg nur durch die Öffnung, dunkel), Fenster des
      abgeschnittenen Stücks werden gestaucht (wie heute an der Tunneleinfahrt).
      **Umgesetzt** (11.10.2026, Nutzer: „los“): Ding `bergportal` auf dem Randfeld P der Anhöhe (das Feld bleibt Anhöhe, oben frei), `t.rot` zeigt in
      die Anhöhe (STAIR_UP), `t.form` 0 A Steinbogen / 1 D nur die Öffnung (`DECO_LOOKS.bergportal`, beide frei). Menü Verkehr direkt hinter der
      Tunneleinfahrt (Verkehr hat damit 11 Dinge – Test erlaubt dort 11), Forschung U-Bahn, **800 Taler + Quader 4 + Metall 2** (Einfahrt 1.000 + 6 + 2).
      Regeln (`bpError`/`bpDirs`/`bpRot`, hills.js): nur Randfeld der ersten Ebene, davor ebener Boden eine Ebene tiefer (kein Wasser, keine Treppe, keine
      Gleis-Rampe), oben nichts, kein Tunnel auf P, keine Treppe/Rampe hinauf auf P, keine Fußgängerbrücke; dreht sich zur Wand (alle vier, bei Wahl:
      Schiene davor, Tunnel dahinter, sichtbare Wand). Gesperrt: Anhöhe darunter abtragen (Portal zuerst abreißen; Abriss-Rechteck nimmt beides, ↶ bringt
      beides), vor dem Portal anheben/Teich/Treppe/Gleis-Rampe/Linie (`bpFronts`), Tragen/Gruppe/Kopie (bleibt stehen, `noCopy`), Kleinkram oben
      (`BIG_ON_TILE`); ↶ prüft Wand und Fuß. Netz: `trackLink` (vorn Schiene eine Ebene tiefer, hinten Tunnel; `bpLinks`), `trackAt`, `railArmsHill`
      (Arm zur Wand, kein Prellbock), `computeRail`. Zählt nicht fürs Viertel. Fenster: „Vorn an der Schiene / Hinten am Tunnel“, Form wählbar.
      Zeichnen im Bildchen der Anhöhe (`paintBergportal` nach den Wänden, `hillSig` + `bpSig`: Form, Richtung, Gleisbett davor, Schatten an), Maße und
      Zeichnung aus dem Entwurf (Öffnung s 0,2…0,8, Kämpfer 7, Gleis im Tunnel wie die Schiene davor mit Verlauf ins Dunkle, Naht 0,6 Punkt tiefer); an der
      Wand nach +x liegt die Öffnung im Schatten der Anhöhe – innen derselbe Schatten darüber (sonst helle Stufe an der Wandlinie). Wagen
      (`bpCut` in `trainTunnelCut`, `drawCarPortal`): mit dem Feld davor gezeichnet, draußen abgeschnitten, das Stück im Berg nur durch die Öffnung
      (Ausschnitt) und mit demselben Verlauf ins Dunkle (auf den Umriss des Wagens begrenzt – keine Leinwand, nur für Wagen am Portal); an hinteren Wänden
      verdeckt die Anhöhe ihn von selbst. Bild in der Leiste/Kunstakademie `drawBergportalIcon` (auch das Bild des Tunnels).
      **Fenster beim Schnitt** (für alle, auch die Rampe der Tunneleinfahrt): `drawTrainCarBody` setzt bei `car.cut` Fenster und Dach dorthin, wo sie am
      ganzen Wagen säßen, und schneidet sie am Schnitt ab; eine Schnittfläche bekommt keine Fenster/Scheinwerfer. Ungeschnitten unverändert.
      **Alte Tunnelportale entfernt** (Nutzer: „die Abfahrt nach unten natürlich nicht“): Backstein und Naturstein der Einfahrt samt `portalHill`/
      `portalWall`/`HILL` sind weg, `DECO_LOOKS.tunneleinfahrt` auch (nur noch Rampe, keine Formwahl). `parseSave` löscht `form` an Einfahrten (= Rampe;
      ältere Versionen lesen das als Rampe) und `paintNew.tunneleinfahrt`. Wer Naturstein in der Kunstakademie gekauft hatte (`tunneleinfahrt:form:stein`),
      bekommt einmal Taler (wie der heutige Preis: mindestens 200 × 5 = 1.000, sonst nach dem besten Einkommen) und die Ideen (400) zurück; der Kauf
      verschwindet. Leistungs-Wächter: `tunneleinfahrt` 226 (wie bisher Form 0), `bergportal Form 0/1` = 0 Zeichenbefehle (steckt im Bildchen der Anhöhe).
      Prüfung: Nahaufnahmen tools/bergportal-pruefung.js → tools/vorschau/bergportal-final.png (beide sichtbaren Wände × Fels/Erde/Mauer × A/D, Zug halb
      drin z 5 und z 8, Naht z 8, ganz drin, kurz davor, hintere Wände, Nacht, weit weg 2D und WebGL). Test: bergportal (dazu ubahn, menu angepasst).
      Offen: kein Geist beim Bauen (die Vorschau zeigt nur den Rahmen oben auf dem Feld); Verkehr mit 11 Dingen (Nutzer-Wunsch „direkt hinter die
      Tunneleinfahrt“, Grenze bisher 10); „Das ist neu“/NEWS beim Push.
- [x] 157n **Nachbesserungen Bergportal/Tunnel** (Nutzer 11.10.2026, mit Bildschirmfoto): (1) Tunnel und Bergportal hatten im Menü dasselbe Bild – der
      Tunnel zeigt jetzt einen Querschnitt – das Feld selbst, ohne Bodenplatte darunter (Nutzer: „es steht über den Untergrund“): Wiese, Erdreich, runde Röhre mit Gleis (man sieht hinein), oben lila gestrichelt; `drawTunnelIcon`, Nutzer wählte
      „Querschnitt“). (2) Tunnel unter einer Anhöhe sah in der Tunnel-Ansicht versetzt aus (Linie am Boden, Anhöhe davor angehoben) – Variante A
      (Bild tools/vorschau/tunnel-anhoehe-varianten.png): die Linie liegt oben auf dem Feld, das man sieht und antippt, und führt an der Wand
      senkrecht hinunter, in ein Bergportal an seiner Wand (`drawTunnelView`; der Extra-Strich zum U-Bahn-Eingang oben entfällt). (3) Zug blitzte
      beim Herausfahren auf: ragte die Front nur einen Hauch (< 0,02) heraus, war sie ein Bild lang eine Schnittfläche ohne Fenster/Scheinwerfer
      (`bpCut`: dann ganzer Wagen im Berg); das Stück im Berg bekam den Schatten der Anhöhe (draußen nicht – Sprung dunkel → hell) und der Verlauf
      dunkelte auch nach oben (Front an der Wand schon dunkel) – jetzt kein Schatten auf dem Wagen, Verlauf waagerecht (`drawCarPortal`). Geprüft mit
      tools/bergportal-fahrt.js (echter Zug, Bild für Bild, Mittag). Tests: bergportal, stufe3-zeichnen.
      Nachtrag (Nutzer: „Zug glitcht beim Einfahren“): steckte die Front erst < 0,02 in der Wand, galt der Wagen als ganz draußen, und trainOnHills
      sah sein vorderes Ende auf dem Portalfeld oben – der Wagen kippte zwei Bilder lang steil hoch (tools/bergportal-fahrt.js, Einfahrt Bild für Bild).
      `bpCut` gibt dann den ganzen Wagen draußen zurück (nie über trainOnHills). Test: bergportal (alle Wagenlängen, hinein/hinaus, beide Wände).
- [x] 157o **Tunneleinfahrt direkt hinter einer Kurve im Tunnel** (Nutzer 11.10.2026: „Zug fährt, Rechtskurve, wo direkt ein Tunnel hochgeht → glitch“):
      im Kurvenfeld direkt hinter der Einfahrt stand der Wagen quer zu ihr (|ed| < 0,5), `trainTunnelCut` gab null zurück – er wurde ganz oben auf
      der Wiese gezeichnet. Jetzt unsichtbar ('hide'), solange er auf einem Tunnelfeld quer zur Einfahrt steht. Geprüft mit tools/einfahrt-kurve.js
      (echter Zug Bild für Bild), Test einfahrt-kurve (ganze Fahrt, ohne die Korrektur 598 Bilder mit dem Wagen oben).
- [x] 157p **Treppe drehen** (Nutzer 11.10.2026: „kann man eine Treppe zur Anhöhe drehen?“ – „ja!“; „warum erlaubt er mir hier nicht, die Treppe
      nach rechts zu drehen?“): beim Bauen gewinnt jetzt die selbst gewählte Drehung (R, ⟳, Mausrad: `rotManual`), solange sie hinaufführt, sonst
      die nächste passende (wie die Gleis-Rampe) – vorher entschied die Wertung (Weg am Fuß, Treppe gleicher Richtung daneben) und R tat nichts.
      Stehende Treppe: ⟳ im Fenster (`p-stairrot`, `stairTurns`/`turnStair`) reihum durch die Richtungen, in die sie hier hinaufführt (nie gegen
      eine Wand oder ins Leere, keine Linie quer davor; Ecktreppen nicht), danach `refitStairs`; nur eine Richtung: Knopf aus. Test: treppe-drehen.
      Offen: ob im Fall des Nutzers die Richtung überhaupt hinaufführen kann (an einer geraden Wand nur quer hinein) – nachfragen, falls es noch klemmt.
      Nachtrag (Nutzer: „wieso gibt es keinen R-Drehen-Knopf?“): für die Treppe fehlten beim Bauen ⟳ unten, R und Mausrad (galten nur für
      ROTATABLE) – jetzt `turnsWhileBuilding` (ROTATABLE + Treppe); gedreht wird reihum unter den passenden Richtungen, rückwärts (Mausrad) auch
      rückwärts (`rotStep`). Test: treppe-drehen.
- [x] 157q **Schmale Treppe: Grasböschung statt Streifen Anhöhe** (Nutzer 11.10.2026: „besser, wenn der Aufgang immer gleich breit ist und nur
      der Weg darauf schmaler oder breiter – dann eine Graskante links und rechts“; Entwurf tools/treppe-boeschung-entwurf.js, gewählt A, „breit
      bleibt wie jetzt“): eingelassen läuft links und rechts der schmalen Stufen eine Grasböschung gerade vom Fuß bis zur Oberkante (durch die
      Hinterkanten der Stufen, Farbe des Felds), zur sichtbaren Seite je Stufe eine Wange; die Anhöhe daneben behandelt sie wie eine breite (ihre
      Wand ist die Wange, `hillStairEnds` ohne A/C/M/N für Treppen); breit neben schmal zeigt zur Böschung hin ihre Wangen (`cm`/`cp`); Höhe für
      Figuren und Antippen auf der Böschung schräg (`stairHeight`); Schatten ohne die Streifen-Quader; Übermalen vor Figuren vorn als Keil. Vor
      der Wand unverändert (Keil). Prüfung tools/treppe-boeschung-pruefung.js (+y/+x, zwei nebeneinander, breit/schmal gemischt, am Rand; z 1,6/4/8).
      Tests: treppe-breite angepasst.
      Nachtrag (Nutzer: „links flach, rechts erhöht – ungleichmäßig“, Bild tools/vorschau/treppe-boeschung-hoch-flach.png, gewählt „hoch“): die
      Böschung liegt jetzt auf der Linie der Stufenvorderkanten wie der Keil (Stufen leicht versenkt) – sie ist ein Keil ohne Außenwand (`keil(sg,
      true)`), neben einer breiten Treppe mit Außenwand, beide ohne dunkle Kante (`'wand'`, `om`/`op`); Höhe für Figuren wie auf dem Keil.
- [x] 157r **Menü: Verkehr aufgeteilt** (Nutzer 11.10.2026: „einige neue Dinge im Menü – zusammenlegen, übersichtlicher?“, gewählt „Verkehr
      aufteilen“): unter Stadt statt 🚆 Verkehr (11 Dinge) drei Gruppen – 🚆 Bahn (Schiene, Gleis-Rampe, Bahnhof, Hauptbahnhof), 🚇 Untergrund
      (Tunnel, Tunneleinfahrt, Bergportal, U-Bahn-Station), ⛴️ Wasser & Seil (Steg, Hafen, Seilbahn). Gemerkte eigene Reihenfolgen: an der Stelle
      von „verkehr“ stehen die drei (`GROUP_ALIAS`, orderedGroups). ⛰️ Anhöhen unter Gestalten wie bisher. Tests: menu u. a.
- [x] 157s **Schnellwahl: Ziehen-Knopf und ⭐** (Nutzer 11.10.2026: „bei der Wege-Schnellauswahl auch Schienen und Tunnel – generell Shortcuts für
      Häufiges, ohne zu überladen“, gewählt: Ziehen-Knopf + 🕘 mit ⭐ zusammenlegen): 🛤️ nimmt, was man zuletzt gezogen hat (`dragTool`, je Gerät
      `kachelhausen_drag`, auch aus dem Menü gewählt; nicht erforscht → Weg), ▾ daneben klappt Weg · Schiene · Tunnel · Zaun · Hecke · Mauer in der
      Bauleiste auf (`dragOpen`). 🕘 ist jetzt ⭐: oben „⭐ Favoriten“, darunter „🕘 Zuletzt gebaut“ (ohne Favoriten und Ziehen-Dinge); Favorit über
      ☆/★ an der Kachel dort oder lange Drücken (0,55 s) auf eine Kachel im Menü (`favList`/`toggleFav`, `kachelhausen_fav`, höchstens 12);
      Zahlentasten folgen. Leiste gleich lang (▾ schmal), passt in 375 px. Tests: schnellwahl, zuletzt angepasst.
      Nachtrag (Nutzer: „kleiner Stern nur bei zuletzt genutzt – Gefriemel“; „ein dezenter, aber treffbarer Stern oben rechts in einer Ecke“): ☆
      oben rechts an jeder Kachel im Menü und in der ⭐-Ansicht (blass, ★ gold; Trefferfläche 28 × 28, wählt nichts aus), das Schloss gesperrter
      Dinge sitzt dafür oben links; langes Drücken entfällt.
      Nachtrag 2 (Nutzer: „der Stern soll oben rechts in das Fenster, das aufploppt, neben den Namen – die Kacheln kannst du auch lassen“;
      „warum die anderen Ziehen-Teile nicht einfach rechts daneben als kleine Kreise – wie die Apple-Leiste“): ☆/★ im Bau-Infofenster rechts neben dem
      Namen (`p-fav`, 36 × 36), dazu weiter an den Kacheln. Ziehen: ▾ und das aufklappende Feld sind weg – ist ein Ziehen-Ding in der Hand, ist es
      der große Knopf, die übrigen fünf stehen rechts daneben als kleine Kugeln (`syncDragGroup`, Tipp: wird groß; nicht erforscht: blass mit
      Hinweis); auf dem Handy blenden sich solange die Bereiche aus (passt in 375 px). Tests: schnellwahl.
      Nachtrag 3 (Nutzer: „weird, dass das Icon wegspringt, wenn ich es anklicke – es sollte immer alles an derselben Stelle bleiben“): Die Leiste
      ist mittig und wurde mit Kugeln breiter (Handy: ohne Bereiche schmaler), der Knopf rückte unter der Maus weg. Jetzt bleibt der große Knopf, wo
      man getippt hat (`holdDragSpot`, Leiste per `translate` verschoben, nie aus dem Bild); reicht der Platz nicht, zeigen die Bereiche solange nur
      ihr Symbol (`drag-tight`, iPad hochkant), notfalls treten sie ganz zur Seite (`drag-tighter`, kleines Tablet). Nachgemessen bei
      375/414/640/700/768/900/1024/1200 px: Knopf bleibt aufs Pixel. Tests: schnellwahl.
      Nachtrag 4 (Nutzer: „das Ersetzen ist genau das Problem, man muss mit der Maus wieder so weit“): kein Platztausch mehr. Solange die Reihe
      offen ist, bleibt ihre Reihenfolge (`dragRow`); eine angetippte Kugel wird an ihrem Platz groß und bleibt unter dem Finger (Leiste rückt um
      den Größenunterschied). Das Große nochmal antippen: zu, vorn steht das zuletzt Genutzte; beim nächsten Aufgehen steht es vorn, die übrigen
      rücken in ihrer Reihenfolge nach (Weg → Schiene → zu → auf: 🚆 🛤️ 🚇 🪵 🌿 🧱). Nachgemessen bei 375/640/768/1200 px. Tests: schnellwahl.
      Nachtrag 5 (Nutzer: „die Leiste rückt beim Durchklicken jedes Mal ein Stück nach rechts“): Die Leiste rückte um den Größenunterschied nach,
      damit das Angetippte unter der Maus blieb – das summierte sich. Jetzt steht jede Kugel auf einem Platz so breit wie der große Knopf
      (Rand 6 px, Handy 3,5 px), beim Durchklicken wechselt nur die Größe; die Leiste rückt nur noch beim Aufgehen. Nachgemessen bei
      375/640/768/1200 px: alle sechs Mitten und die Leiste bleiben über sechs Klicks aufs Zehntel gleich.
      Nachtrag 6 (Nutzer: „Eisenbahn, Zäune, Wege, Terraforming als Kategorien – Spielbilder statt Emojis“; gewählt: ein Knopf, Kugeln =
      Kategorien, die Dinge vorn in der Stil-Zeile, Gelände-Bild = Anhöhe): `DRAG_KATS` – Eisenbahn (Gleis, Tunnel, Bahnhof, U-Bahn-Station,
      Tunneleinfahrt, Gleis-Rampe, Bergportal), Zäune (Zaun, Hecke, Mauer), Wege (Weg), Gelände (Teich, Aufschütten, Wiese, Strand, Parkrasen,
      Anhöhe). Großer Knopf und Kugeln zeigen Spielbilder (`katPic`, Mitte des Vorschaubilds); eine Kategorie gibt ihr zuletzt Genommenes in die
      Hand (`katPick`, je Gerät `kachelhausen_kat`); ihre Dinge stehen vorn in der Stil-Zeile (`katChips`, Gewähltes dunkel, Gesperrtes blass mit
      Hinweis, Trennstrich zum Stil – entfällt, wo die Zeile genau dort umbricht). Feste Plätze wie zuvor. Am Computer und iPad eine Zeile, auf
      dem Handy bricht nur die Eisenbahn um. Hauptbahnhof nicht dabei (nicht genannt). Entwurf: tools/kategorien-entwurf.js. Tests: schnellwahl.
      Nachtrag 7 (Nutzer: „in der oberen Leiste springen die Icons hin und her, je nach Auswahl“): Die Stil-Zeile stand mittig, dahinter je nach
      Ding ein anderer Stil (Schotter, Graben/Entfernen, nichts) – sie rückte. Mit Dingen einer Kategorie beginnt sie jetzt links fest über dem
      großen Knopf (`kat-anchored`, nie aus dem Bild), der Stil wächst nach rechts, ein Umbruch geht nach oben (`wrap-reverse`): die Dinge bleiben
      in der untersten Zeile. Aufklappfelder (Zaunform …) dann mittig auf dem Bildschirm. Nachgemessen 375/768/1200 px: jedes Ding jeder
      Kategorie angetippt – alle Symbole stehen waagerecht und senkrecht aufs Pixel gleich. Andere Dinge: Stil-Zeile wie bisher mittig.
      Nachtrag 8 (Nutzer: „manche ragen sehr weit nach rechts, unter die Minimap – Auffahrt vom Zug, unnötig viel Text; der Drehknopf ist auch
      unter der Minimap“): `fitStyleBar` – ist die Minikarte da, endet die Stil-Zeile vor ihr (links feste Zeile bricht um, mittige wird schmaler,
      unter 260 px steht sie links), Aufklappfelder (Wegbelag, Zaunform, Heckenfarbe …) mittig im freien Platz links der Karte. Drehknopf steht
      bei sichtbarer Karte mittig über ihr (CSS `:has`). Gleis-Rampe: im Knopf nur der Name („Einschnitt A“), der Rest im Titel. Prüfung:
      tools/karte-ueberlapp-pruefung.js (alle 70 Dinge, offene Aufklappfelder mit) bei 900/1024/1200/1440 px – nichts über der Karte, nichts aus
      dem Bild; die Kategorie-Dinge stehen weiter fest.
- [x] 158 **Wegrichtung: Muster drehen** (Nutzer 11.10.2026: „Wege drehen können – die Textur dreht sich mit“; gewählt: C – folgt der
      Zugrichtung, R dreht um; „Mitte, ohne Fuge“; „bedenke, dass man auch im Nachhinein drehen will – Boden anklicken oder per Auswahl aufnehmen“).
      `t.lauf` (0 entlang x, 1 entlang y; fehlt = alter Weg, Muster wie immer). Muster mit Richtung (`PAT_DIR`): Holzbohlen quer zum Weg,
      Klinker, Plattenverband, Steinreihen, Fischgrät (klein/groß) längs; geprüft und ohne Richtung gelassen: Kleine/Große Platten, Kleinpflaster
      (sieht gedreht gleich aus), Gemischte Platten (nur anders verteilt). Zeichnen: `patRot` in `pattern()` – Muster und Weltraster um 90° gedreht,
      gesetzt nur in `drawPath` (Boden, breite Wege, oben auf Anhöhen); Brücken, Treppen, Plätze unverändert. Bauen: Linie je Schenkel (Ecke zum
      ersten), Fläche nach der längeren Seite (`planLauf`), einzelnes Feld wie die Arme/Nachbarn (`wegLaufGuess`); alter Weg mit neuem Belag bekommt
      eine Richtung. R/⟳ beim Weg (nur Belag mit Richtung; Mausrad zoomt weiter) dreht um, mit Hinweis, gilt bis zum Werkzeugwechsel (`wegFlip`).
      Nachträglich: 👆 Weg → „Richtung · ⟳ Muster drehen“ (dieses Feld, zeigt „liegt quer/längs zum Weg“); ✋ Auswahl → „⟳ Wegmuster“ (alle Wege
      darin, nichts verschoben); aufgenommene Gruppe dreht ihr Muster mit; ein aufgenommenes Wegfeld dreht mit ⟳/R (Abbrechen: wie vorher). Alles
      mit ↶. Prüfung: tools/weg-richtung-pruefung.js (alle Muster an Kreuzung und Kurve, Fläche, Anhöhe, Nahaufnahmen; Musterblatt normal/gedreht),
      Entwurf tools/weg-drehen-entwurf.js. Tests: weg-richtung.
- [x] 159 **Abreißen auf der Anhöhe: erst was oben steht** (Nutzer 11.10.2026: „wenn man einen Weg oben auf einer Anhöhe löscht, löscht man
      die Anhöhe – das ist doof“). Abriss-Rechteck und ✋-Auswahl → Abreißen trugen Anhöhen gleich mit ab, sobald oben nichts mehr stand.
      Jetzt (`scanDemolish`): steht auf einer Anhöhe der Auswahl etwas, das abgerissen wird (Weg, Deko, Gebäude, Bergportal, Zaun & Co.), bleiben
      alle Anhöhen der Auswahl stehen (keine Inseln); ist sie leer, trägt das nächste Abreißen sie ab. 👆 einzeln war schon so. Tests:
      anhoehe-wege (Weg oben), anhoehe, stufe3-regeln, bergportal auf zwei Schritte umgestellt. Hauptbahnhof bleibt außerhalb der
      Eisenbahn-Kategorie (Nutzer).

## Nachtrag 157s: „Zuletzt gebaut“ (11.10.2026)
- [x] Nutzer: „zuletzt gebaut funktioniert nicht mehr“. Seit den Kategorien des Ziehen-Knopfs (157s Nachtrag 6) fiel alles daraus aus der
      Liste (Bahnhof, U-Bahn, Einfahrt, Gleis-Rampe, Bergportal, Brücke, Anhöhe, Teich, Aufschütten, Wiese, Strand, Parkrasen) – und beim
      nächsten Bauen auch aus dem Gemerkten. Jetzt fehlen wieder nur die Linien-Werkzeuge (Weg, Schiene, Tunnel, Zaun, Hecke, Mauer:
      `NOT_RECENT`). Test: zuletzt. Danach Nutzer: „alles zählt“ – auch Weg, Schiene, Tunnel, Zaun, Hecke, Mauer kommen in die Liste
      (nur Abreißen und Auswählen nicht).

## Nachtrag 157s: Knopfbilder der Ziehen-Kategorien (11.10.2026)
- [x] Nutzer: „man erkennt kaum, was Schiene, Weg, Terraforming oder Zaun ist – immer Untergrund drunter; das Grün muss weg (außer
      Terraforming)“. Weg und Schiene als kurzes Stück über zwei Felder, Zaun/Hecke/Mauer als zwei Stücke über Eck – ohne Grasplatte, in
      einer eigenen Mini-Welt (ui.js `katBare`); Gelände bleibt die Vorschau mit Platte. Gilt auch für die Dinge vorn in der Stil-Zeile.

## Block 160 – Brücke als eigenes Bauwerk (11.10.2026)
Nutzer: „das ist immer dieselbe Brücke, man baut sie halt da hin, wo man will, und dann kann man über diese Brücke einen Weg oder Schienen
ziehen“ – Zugbrücken übers Wasser, Wegbrücken, Anhöhenbrücken. Gewählt: Holzsteg und Stahl (Steinbogen verworfen), darunter nur Flaches,
Abkürzung beim Ziehen übers Wasser bleibt (a); Reihenfolge: 1) zwischen Anhöhen mit Weg, 2) Schiene darüber, 3) Wasserbrücken umstellen.
- [x] 160a **Schritt 1: Brücke zwischen Anhöhen mit Weg** (js/bruecken.js). `state.bruecken`: erstes Feld der Lücke → { ax, n (1–4), art,
      weg?: [Stil|null je Feld] }; Deck auf HILL_H über den Feldern der Lücke, der Boden darunter bleibt in state.tiles. Bauen: Gestalten →
      Anhöhen → Brücke bzw. Ziehen-Kategorie „Wege“ – von der Oberkante einer Anhöhe hinüber zur anderen ziehen (`scanBruecke`, großzügig:
      Felder oben zählen nicht); Holz (60 + 3 Bretter je Feld, ab 3 Feldern Holzböcke am ersten und letzten Feld) oder Stahl (120 + 3 Metall,
      erst mit der Bahn, spannt frei). Darunter nur Flaches (`bkUnderError`, `bkPlaceError`, `bkTooTall`: Weg, Schiene, Tunnel, Wasser,
      Gelände, niedrige Deko bis BK_CLEAR; am Holzbock kein Weg/keine Schiene; keine Überdachung, keine Anhöhe, kein Wald/Fels). Die Anhöhen an
      den Enden tragen sie (`bkOnHill`: Abtragen, Treppe/Rampe hinein, ↶, Abriss-Rechteck gesperrt). Weg darüber: Linie (oder 1 Feld breites
      Rechteck) von der Anhöhe am Ende längs über das Deck bzw. auf dem Deck angefangen → aufs Deck (`bkPlanDeck`, `bkLayWeg`), sonst bleibt
      alles unten (Nutzer: „was, wenn ich unten einen Weg bauen will?“). Arm über die Kante (`bkArmFrom` in pathArmsHill/drawHillFlat);
      durchgehender Weg verbindet Viertel (computeNet) und Gegenden (hillRegions: „oben ohne Treppe“ gilt über die Brücke nicht mehr).
      Spaziergänger gehen hinüber (hill-walkers.js, render.js `onDeck`: nach dem Deck gezeichnet). Zeichnen je Feld in tileB (`bkDrawTile`,
      wie die Überdachung), Schatten im Boden-Bild, GL-Standbild (`bkLiveTiles`). Antippen: Deck vor dem Feld dahinter (`bkPick`) → Fenster
      (Art wechseln, Weg entfernen, Abreißen); 🧹 erst der Weg darauf, dann die Brücke; Abriss-Rechteck nur ganz darin (Anhöhen bleiben).
      ↶ mit Prüfungen, Speichern streng (fremde Inseln). Prüfung: tools/bruecke-pruefung.js (Übersicht, alle vier Anschlüsse, Mitte mit Weg
      bzw. Schiene darunter, Nacht; GL weit weg in Aufzeichnen und Standbild geprüft). Tests: bruecke (Menü-Tests angepasst, Leistungswerte
      0 für beide Arten: drawObject zeichnet sie nicht, das Deck kommt aus tileB).
      Gegengelesen (3 Prüfer, jeder Fund gegengeprüft, nur lesen) und behoben: Überdachung per ✋/⧉ unter die Brücke (groupErrors),
      Fußgängerbrücke (setCrossing) und Wasserbrücke (bkPlaceError mit getragenem Ding) nachträglich darunter, Erz/Kristall wie Fels, ↶ holt
      nichts Hohes und kein Dach unter eine stehende Brücke; Schatten wurde nie gezeichnet (`want` bekam Index/Array); Spaziergänger auf dem
      Deck im GL-Bild unsichtbar (glLive in glLive – jetzt direkt in die Zelle der Brücke); Vorschau und Klick treffen dasselbe (`bkPickFront`
      mit Tiefe, Deck vor Linie/Deko, kein Zaun rot darunter), Geländer-Treffer nicht durch eine Anhöhe davor; Ziehen auf dem Deck begonnen
      (Maus) bleibt oben; Abriss-Rechteck: unter einer herausragenden Brücke Abgerissenes grün; Deko unter dem Deck sperrt Spaziergänger
      nicht; Bewohner gehen noch nicht über Brücken – ihre Wege rechnen ohne sie (`hillWalkRegions`), Wirtschaft und Spaziergänger mit;
      ↶ meldet sich beim Online-Speicher (galt auch für Anhöhen/Dächer); Bildchen eingepasst; keine Fugen zwischen Deckfeldern; Belag auf dem
      Deck wie am Boden (Muster, Schachbrett), Trittsteine nicht aufs Deck; Deck blass bei 👁 und beim Bauen darunter; Vorschau-Rauten und
      Hinweis des Wegs auf dem Deck oben.
- [x] 160b **Schritt 2: Schiene über die Brücke.** Je Brücke Weg ODER Gleis (`b.gleis`: Form je Feld). Gleis aufs Deck wie der Weg: Linie von der
      Anhöhe längs übers Deck bzw. auf dem Deck angefangen (`bkPlanDeck`, `bkRailCheck`/`bkLayRail`, je Feld 15 Taler + Holz + Metall, Stil
      umstellen kostenlos); Holzsteg mit Gleis = Holzviadukt mit Bock unter jedem Feld (darunter dann nichts), Stahl spannt frei. Netz:
      durchgehendes Gleis mit Schiene oben an beiden Enden verbindet die Endfelder direkt (`bkRailJumps` in computeRail, railPath, railLoop,
      railNetworkHill; Arme über die Kante `bkRailArmFrom`, auf dem Deck `bkRailArms`); die Brückenfelder zählen zur Streckenlänge (Strom,
      Züge im Rundkurs, Erfolg „Eisenbahn“). Züge fahren oben gerade übers Deck (`route.deck`, `car.deck`), gezeichnet in Stücken je Feld
      (`bkCarPieces`): übers Deck nach dessen Oberseite und vor dem vorderen Geländer, auf der Anhöhe mit ihr. Unten fährt weiter ein Zug
      quer durch (am Holzsteg nur zwischen den Böcken, mit Gleis oben gar nicht). Fenster: Gleis entfernen (Taler und Material zurück),
      Abreißen samt Gleis; Speichern streng (Weg hat Vorrang). Breitere Fahrbahn war nicht nötig (Deck 0,8 Felder, Gleisbett 0,46).
      Prüfung: tools/bruecke-gleis-pruefung.js (Stahl längs x und y, Holzviadukt, Zug oben/unten, alle Anschlüsse, Nacht; GL-Standbild).
      Gegengelesen (4 Blickwinkel, je ein Prüfer) und behoben: Schranke auf dem Endfeld blieb offen, solange der Zug übers Deck reichte;
      Wagen knapp über der Kante schwebte doppelt hoch; „Gleise umstellen“ übersprang Deck und andere Seite; Strecke zu kurz gezählt; Zug
      oben angetippt öffnete das Feld darunter; nach ↶ rechnete das Netz mit der alten Brücke (`groundVersion`); ↶ an einer stehenden Brücke
      prüft nur neue Böcke, Achterbahn nicht mehr unter die Brücke. Tests: bruecke-gleis.
- [x] 160c **Brücken vereinheitlichen** (live seit 19.10.2026, v1154) – Bauplan: **PLAN-160c.md** (Karten des Codes: plan-160c/). Entschieden mit dem Nutzer (11.10.2026,
      Brückenschau tools/brueckenschau.js, Entwürfe tools/bogen-anhoehe-entwurf*.js, kristallbruecke-, brueckenfamilie-, brueckenlicht-entwurf.js):
      - **Zwei Familien:** Fußgängerbrücke = immer Bogen (übers Wasser, über ein Gleis am Übergang, zwischen Anhöhen), Bahnbrücke = immer
        flach (übers Wasser, zwischen Anhöhen). Ein Gleis fährt nie über einen Bogen. Familie folgt aus dem Inhalt (Gleis → Bahn).
      - **Vier Materialien:** Holz (Waldinsel), Stein (Windinsel), Metall (Erzinsel), Kristall (Kristallinsel, „fürstlich“ teuer). Ziegel und
        Rot fallen weg (= Stein bzw. Holz eingefärbt), „Wie der Weg“ = Holz mit Belag. Alle einfärbbar (Laternen färben mit).
      - **Modelle abgenommen** (brueckenfamilie-entwurf.js): Fußgänger Holz (Bogenträger, Hänger, Stützen auf den Kachelkanten:
        keine/wenige/jede), Stein (dünner heller Bogen ohne Zipfel; mit Pfeilern auf den Kanten, Bögen je 2 Felder, Öffnung Stufe 3;
        **Balustrade**), Metall (Gitterrost, Stahlträger, Stahlbogen mit Hängern), Kristall K1 (Glasbogen, Glasgeländer, **Zacken als
        Option**); Bahn Holz (Böcke auf den Kanten), Stein (flacher Viadukt), Metall (Fachwerk), Kristall B2 (Fachwerk aus Kristall).
        Zwischen Anhöhen halb so hoch wie übers Wasser, 1 Feld = kleiner Buckel, **bis 8 Felder**.
      - **Licht** (brueckenlicht-entwurf.js, echtes Nachtlicht): Holz/Metall kleine Punkte, Stein Minilaternen auf der Balustrade (in der
        Brückenfarbe), Kristall bläulicher Streifen am Glasfuß. Je Brücke kaufen, dann an/aus. **Mit Strom** (F2): bekommt Strom zuletzt.
      - **Alte Brücken bekommen die neuen Modelle** (Material/Farbe so nah wie möglich); **Form übers Wasser bleibt** (Block 150, F1); Material
        für beim Ziehen entstehende Brücken in der Leiste des Brücken-Werkzeugs (F3); Gleisbrücken-Kurven: schlichtes Kurvenstück (F4).
      - **Grafikfehler vermeiden** (Nutzer): Pfeiler-Platte, Gewölbe ohne Tiefe, fehlende hintere Stirn/Schatten, Knick an der Wand, Zipfel
        am Ende, Ausschnitt an der fernen Anhöhe – je Schritt Nahaufnahmen aller Anschlüsse in beiden Achsen, Tag/Nacht/weit/GL.
      Schritte (je ein Commit, Details PLAN-160c.md §3):
      - [x] V1 AUFGABEN/Plan bereinigt · [x] V2 Übergang-Knöpfe in undoable · [x] V3 Kopie-Lücke footPaid · [x] V4 Gruppe mit Wegbrücke ablegen
        · [x] V5 t.lauf in tileOut
      - [x] A1 Prüfstand (Brückenwelt: tools/brueckenwelt.js, testsave-bruecken.json, Vorlage tests/vorlagen/alte-bruecken.json, Vorher-Bilder
        tools/brueckenpruefung.js, Leistungs-Grundlinie Welt „bruecken“ ohne Änderung der übrigen Welten) · [x] A2 Leser brLook (js/brueckenfamilie.js) · [x] A3 Speicherformat + Altversions-Wächter · [x] A4 Geld-Schicht (brPrice/brPaid, alte Arten behalten ihren Preis)
      - [x] B1 Lagen-Maler (brueckenbild.js, Lagen h/v/d/o, deckend; alt↔neu nur Kantenpixel) · [~] B2 ruhend in tileA, Nachmalen in tileB (B2a Gerüst ✓, B2b Umzug ✓, B2c Bildchen weit weg ✓ – GL-Testwelt: lebendige Felder 60 → 1; B2d Fußkreis an der Feldkante offen)
      - [x] C1 Stützen auf Kanten („wenige“ = min(k, n−k) ungerade: n 4 → 1, 3; n 3 → 1, 2) · [x] C2 Höhenprofil, Holz/Metall (Bogen, Figuren, Antippen, Schatten; plan-160c/C2.md) · [x] C3 Stein mit Pfeilern (abgenommen 12.10.: Innenton, Pfeiler ab 4 Feldern; kein Widerlager – Felswand sichtbar; plan-160c/C3.md) · [x] C4 Kristall K1 + Zacken (abgenommen 12.10.: Breite, Zacken symmetrisch; Figur hinter dem Glas ungetönt – ok) · [x] C5 Bahn-Modelle (Holz/Metall/Kristall B2 nach Entwurf; Stein-Viadukt Variante B – Nutzer 12.10.; Züge unten in Stücken)
        · [x] C6 Fenster/Leiste/Kosten (abgenommen 12.10.: 4 Materialien, 11 Farben je Material; vorläufige Preise; Leistung neu gesetzt: Testwelt bruecken weit weg billiger, Zoom 0,8 Tag geo 1056→1243 wegen Bogenlinien; bruecke Form 2/3 = 0) · [x] C7 Licht (mit Strom; abgenommen 12.10.: Lampen je Material aus brLampSpots, Kaufen/an/aus im Fenster, Strom zuletzt je Feld wie eine Laterne, Stein 1 Feld Laternenpaar in der Mitte, Kristall aus = Tagfarbe; Restfehler L6 hingenommen: Lampe direkt neben einer Figur auf dem Deck verliert kurz den weichen Schein; offen als eigener Schritt: render.js paintSprite `full = nightPicOn()` nach `g = cx` immer falsch – jedes Lichtbildchen bekommt eine Maske) · [x] C8 bis 8 Felder (12.10.: BK_MAX 8 = Lesegrenze; Stein ungerade ab 5 Mittelbogen 3 Felder – Nutzer nach Bildvarianten: 5 → 1-3-1, 7 → 2-3-2; Holz „wenige“ und Bogenhöhe bleiben) · [x] C9 Bauen per Linie (abgenommen 12.10.: automatisch, ohne Wahl Holz aus der Leiste, geht sie nicht → Lücke rot mit Grund; Geist beim Ziehen in einem Stück; C9a Prüfung unter der Brücke unabhängig von der Zugrichtung) · [x] C10 Schiffe unter Anhöhen-Brücken (abgenommen 12.10.: nur quer durch die Feldmitte, Seewege neu bei Bau/Abriss, keine Fische/Möwen/Kutter an der Brücke, Boot vor der Stirn davor, Boot unter der Feldmitte vor der Stütze der Anfangskante; längs nie, Möwen nicht im Umkreis 2, hohe Masten durch – auch die Flagge der Freundesschiffe schaut unter einer Bahnbrücke hinten übers Deck, hingenommen; gegengelesen: Anleger unter der Brücke quer hinaus, Wasserbrücken-Kachel davor über dem Boot nachgemalt)
      - [x] D0 Entwurf Wasser-Weg (abgenommen 13.10.: tools/wasserbruecken-entwurf.js; Form/Öffnungen/Durchfahrten aus Block 150; Holz mit Stützen auf den Kanten bis aufs Wasser (Standard wenige), Stein mit Balustrade + Quader statt Ziegel, Metall/Kristall frei; flach ohne Bogenträger, Metall/Kristall flach wie Holz (LIFT 3); Steg mit Abschluss quer + Stütze am Ende; breit nur außen; Lampen ab 9 Feldern nur auf Feldkanten; Ziegel → Stein in Ziegelfarbe, Rot → Holz in Rot) · [x] D1 Zeichenort (plan-160c/karte-D1.md: D1·0 Prüfwerkzeug ✓, D1a Lagen h|vd|o ✓, D1b ruhend in tileA ✓ – ruhend eine Gruppe w = h+vd+o, ein Bildchen wb|…|w statt flat|/arch|: Zeichenbefehle wie vorher, kein leistung:neu; Brückenende liegt jetzt auf dem Uferweg statt darunter; D1c Vorschau auf dem Deck ✓ – Plan-Rauten und Einzelfeld-Rahmen nach der Brücke, auf wegDeckH, Rahmen eingerückt 0,44 wie die Rauten; D1d Höhe ✓ – Figuren auf flachen Brücken auf dem Deck (wegBridgeLift = wegDeckH, Holz 3, Stein 7, Rot 8, Rampe zum Ufer), Kopf/Antippen/Sprechblase und GL-Rahmen mit; D1e Bewegtes ✓ – tileB über bkDrawMoving mit wbAt: Leute immer auf dem Deck (hinter dem vorderen Geländer), Boot darunter flach h+vd / Bogen vd nachgemalt, vor der Stirn (s > 0,36) und fliegende Tiere davor; frühere Felder über dem Boot im Bootsrahmen (boatUnder nur schon gezeichnete, Block 112 als boatOver); BRIDGE_FRONT entfällt; Gegenlesen D1b: Nachtlicht früherer Felder (Laterne am Ufer, Kristallweg) lag verdeckt unter flachen Brücken → wbRelight stanzt nah den Schein auf dem Deck neu, auch beim Nachmalen; weit weg/GL bleibt es verdeckt wie bei Häusern und Bögen; D1f Fußpunkt nicht nötig (Nutzer 13.10.: passt so)) · [x] D2 Modelle (plan-160c/karte-D2.md; D2·0 Prüfwerkzeug tools/wasser-d2-pruefung.js ✓, D2a Gerüst G ✓, D2e Mauer aus dem Aussehen ✓, D2c Holz/Rot ✓, D2d Stein/Ziegel ✓, D2f–h Metall/Kristall/Licht ✓ – alles gleich dem D0-Bild; Abnahme 13.10.: Stege zur −Seite, alte Farben, Landende ohne Weg „passt so“; Boot unter flacher Brücke „sieht dämlich aus“ → flache Wasserbrücken für Boote gesperrt (seaCross), nur unter Bögen durch; D2j Aufräumen ✓ (Schalter WB_NEU weg, alle Materialien im neuen Maler; drawWegBridge nur noch Bau-Vorschau bis D3), D2k Leistung: in den Grenzen ohne leistung:neu) · [ ] D2+ Klappbrücke: flache Wasserbrücke klappt hoch, wenn ein Boot kommt (Nutzer 13.10.2026: „später“) – eigener Entwurf mit Bild, dann die Sperre für Klappbrücken aufheben · [x] D3 Fenster/Kosten (plan-160c/karte-D3.md; Entwurf Fenster abgenommen 13.10. mit 8 Antworten §7; D3d Baustein ✓, D3a Setzer wbSet ✓, D3b Bau im neuen Format + Zusammenwachsen ✓, D3c Strom ✓, D3e Fenster ✓ (Planken auch an der Anhöhe), D3f Leiste + Schild ✓, D3g Seeweg-Hinweis ✓, D3h Glas über dem Boot + Geist beim Ziehen/Tragen ✓, D3i alter Maler weg ✓; Gegenlesen ✓: Art je Feld nie teurer als bezahlt (v1016 erstattet nach brk), Zusammenwachsen nach der längeren, Plan-Preis = Abbuchung, Geist je Brücke/nur sichtbar/ohne Nebel/mit Zacken, Kristall-Glas nach dem letzten Boot; bekannte Grenze: eine in v1016 kopierte neue Brücke behält brp → die neue Fassung erstattet dort zu viel (braucht alte und neue App am selben Stand); D3j ✓ Leistung in den Grenzen, Prüfbild Geist über zwei Flüssen bei z 0,8/1,4/2,4: je Brücke ein Geist, am Rand sauber abgeschnitten) · [x] D4 Anhöhe am Brückenende sperren (hillRaiseError → wbEndAt längs der Achse, quer frei; Gegenrichtung: bridgeShapeError lässt keine Wasserbrücke an einer Anhöhe enden; ↶ holt keine Anhöhe ans Brückenende zurück; tests/anhoehe-brueckenende.test.js)
      - [x] E0 Entwurf Wasser-Gleis (abgenommen 14.10.: plan-160c/karte-E0.md, tools/gleisbruecken-entwurf.js – Bahn-Modelle aus C5 auf Landhöhe, Fachwerk durchgehend je Halbfeld im Weltraster mit Pfeilern alle 3 Felder, Kurve/T/X als Eckpodest mit Pfählen bzw. Steinpfeiler, alte Gleisbrücken → Holz neu) · [x] E1 Zeichenort (plan-160c/karte-E1.md; Workflow-Karte mit §6 Gegenprüfung 17 Korrekturen; E1·0 Prüfwerkzeug tools/gleis-e1-pruefung.js + Leistungs-Szenen bruecken-gleis/-tx ✓, E1a gbAt + drawRailBed in Lagen (Δ 0) ✓, E1b Bewegtes über bkDrawMoving + gbBoatOver + Bootslicht im eigenen Raster ✓, E1c Wagenstücke gbCarPieces ✓, E1d ruhend in tileA (gb|), boatUnder nur frühere, Vorschau auf dem Deck ✓, E1e Nachtschein gbRelight + glowsIn ✓, E1f: bauland 433 Felder alt/neu gleich schnell oder schneller (ruckeln.js im Bereich, 1280×800); Leistung nur „bruecken Nacht Zoom 1.2“ nachgezogen (Boden-Vormalen läuft nachts wie am Tag, Wert = Tageswert); offen bis E2: Zug in Kurve/T/X/Leiter liegt wie bisher über dem Geländer; nachts weit weg im GL-Bild endet der Schein früherer Lichter an der Brückenkante (wie D1); Pfähle/Geländer bleiben im Schein früherer Lichter dunkel) · [ ] 160c-Folgeschritt Weg: Block 112 geteilt (h+vd → Wagen/Leute → o) und frühere Felder direkt nach dem Boot auch für Wasser-Wegbrücken (wie gbBoatOver, karte-E1 K10/K11) · [x] E2 Modelle/Spanne/Fenster (E2a Modelle im Spiel: gbAt.G, gbPaintLage – Holz Böcke, Stein Viadukt, Metall/Kristall Fachwerk im Weltraster, Kurve/T/X Eckpodest, alte Gleisbrücken = Holz neu, Leistung in den Grenzen durch Striche je Farbe ✓; E2b ganze Brücke im Schienenfenster gbSet: Material/Farbe/Planken/Licht ✓; E2c Bau im neuen Format, Leiste des Brücken-Werkzeugs (gbLeisteLook) ✓; E2d Licht mit Strom 'G' + Anker ✓; Stein frei wie bei Wegbrücken ✓; Geist beim Ziehen im Material der Leiste ✓; Zusammenwachsen: die längere gewinnt, beim Ablegen/Kopieren die meisten Felder (gbUnify, kostenlos, Bezahltes bleibt) ✓; Gegenlesen 10 Punkte ✓, Nr. 9: Stein-Eckpodest ohne geschlossene Vorderseite (Kreuzung, Kurve nach vorn) bekommt einen Pfeiler unter dem Mittelquadrat (Bild tools/vorschau/e2-podest-pfeiler.png, Variante B). Bekannte Grenzen: ein neues Feld, das beim Angleichen Licht bekommt, während das Licht der Brücke aus ist, zahlt dafür nichts; Kopieren mit v1016 erstattet wie bei Wegbrücken nur BRIDGE)
      - [x] F0 Entwurf Übergang (abgenommen 15.10.2026: tools/uebergang-entwurf.js, Bilder tools/vorschau/uebergang-material/-nacht/-alt.png – Form aus Block 148, Bekleidung aus den Bausteinen der Wegbrücken: Holz Bretterwand + Bogenträger mit Hängern, Stein gemauerter Bogen (Ellipse ±0,46, Scheitel 18), Metall Blech + Stahlbogen, Kristall Glas; „Wie der Weg“ = Holz holzbraun mit Belag; Licht Holz/Metall an den Pfosten, Stein eine Laterne je Seite am Scheitel; Abbildung t = (b + 0,45)/0,9, n = 2. Rundes Wegende neben der Rampe, wenn der Weg ein Feld hinter der Brücke endet: auch heute so. **Fehler, auch heute (Nutzer 15.10.2026):** auf einer Anhöhe malt das spätere Wegfeld (Feld vor der Brücke, b > 0,5) seine Oberfläche über das vordere Rampenende – die Rampe wirkt abgeschnitten und versetzt; auf dem Boden nicht, dort liegt der Weg im Bodenbild. Bild tools/vorschau/uebergang-mass.png. Gehört in F1: Rampenstück über dem späteren Feld erst nach dessen Oberfläche malen – **repariert (F1a)**: hillPre zieht die Felder davor auch für den Übergang mit Brücke vor, beim Nachmalen (hillLateK) der ganze Bogen auf die Raute; Test uebergang-anhoehe, Bild tools/vorschau/uebergang-anhoehe-repariert.png) · [x] F1 (F1a Rampe auf der Anhöhe ✓; F1b neues Modell im Spiel ✓: ubArch in brueckenbild.js liest brLook('uebergang') – alte Stände nach §1.5, neues Format footPaid-Rückfall + brm + brp; Licht mit Strom 'U' + Feld (zwei Laternen), der alte Kristall-Übergang leuchtet ohne Strom wie bisher; Striche gleicher Art gebündelt (brBatched, Vergleiche g === ctx über gNow), weit weg gröber; Leistung: nur bruecken-gleis Tag Zoom 0.8/1.2 und Nacht 0.8 Zeichenbefehle nachgezogen (583→703, 405→505, 612→726) – das neue Modell hat mehr Einzelteile (je Übergang ~32–41 statt ~24 Befehle) und leuchtet nachts wirklich; Bild tools/vorschau/f1b-spiel.png; F1c Fenster/Setzer/Geld ✓: ubLookHtml (Schranken | Brücke; ohne bezahlte Brücke vier Materialien mit Preis, mit Brücke Material/Farbe/Deck/Planken/Licht/Zacken, Preise je Brücke, keine Stützen), brSet 'uebergang' → ubSet, setCrossing baut im neuen Format (footPaid nur Rückfall holz/stein/kristall, Metall → holz + brm), Stein am Übergang frei wie bisher; brl 'nein' für „ohne Licht“, wo der Rückfall footPaid kristall Licht ohne Aufpreis hieße (Bau, Kopie); alter Kristall behält sein Licht ohne Aufpreis beim Umfärben, aus → an braucht dann Strom; Tests uebergang-fenster; F1d Figuren zwischen Deck und vorderem Geländer ✓ (K15, Karte Übergang 6a): ubArch teil 'unten' | 'oben'; hinten unten jetzt, vorn unten nach den Zügen (afterMovers), das vordere Geländer bis b 0,5 nach den Bewohnern des Übergangsfelds, den Rest nach denen des Wegfelds davor (archRails je Feld, im GL-Bild läuft das Wegfeld davor live: archFrontTiles; Reste am Bildende); Bild tools/vorschau/f1d-figuren.png; F1e ✓: Wagen über der Feldkante des Übergangs in Stücken (ubCarPieces, R7 – auf Anhöhen noch wie bisher über trainOnHills), keine Linie auf der Rampenkante (archRampEdge, luecken B9) und keine Brücke über eine solche Linie; Bild tools/vorschau/f1e-wagen.png) Bekleidung/Fenster/Kosten
      - [x] G1 Texte/Erfolg/Album (15.10.2026, Ultracode: 4 Leser + Gegenprüfer + Lückenprüfer, 25 bestätigte Funde): G1a Erfolg „Brückenfelder“ zählt Fußgängerbrücken (je 1) und Deckfelder zwischen Anhöhen, „Wege“ den Weg auf dem Deck ✓; G1b Album zählt den Deck-Belag zwischen Anhöhen ✓; G1c Verschieben/Kopieren: Brücke zwischen Anhöhen „bleibt stehen/draußen“, Auswahl-Vorschau rot ✓; G1d neues Brückenmaterial sichtbar freigeschaltet (lmUnlockNames, „Neu freigeschaltet“ mit Ausprobieren, Schloss in der Leiste – wählbar –, Bau-Info, Nachschlagebuch je Material) ✓; G1e Texte (Beschreibung/Tipp Brücke und Weg, Fenster „was darunter geht“ nach Stützen/Pfeilern, Strom-Übersicht zählt dunkle Gleis-/Fußgängerbrücken als Brücken, Schild „🌉 Brücke: …“ einheitlich mit Rohstoffen, NEWS 08-boegen ohne Ziegel/Rot, Minikarte zeigt Brücken zwischen Anhöhen) ✓. Nicht gemacht (Gegenprüfer: kein Fehler): Strom-Hilfetexte, eigener Text am Übergang, Abriss-Rechteck „ragt hinaus“. Live ist v1016 (origin/main ac7a848), NEWS für G3 nur 160c. Gegenlesen (3 Prüfer + Gegenprüfer): 4 kleine Funde behoben – Parkrasen unter der Brücke in der Auswahl grün, Tipp/Weg-Text „Holz heißt übers Wasser: nach dem Wegstil“, Strom-Text „je Brückenart“, gesperrtes Material in der Leiste antippen sagt womit (iPad ohne Tooltip) · [x] G2 Gesamtprüfung (15.10.2026: Prüfstand-Bilder tools/vorschau/bruecken-g2-tag/-nacht.png stimmig – Beobachtung: zwei Gleise direkt nebeneinander übers Wasser ergeben ein Gitter aus Kreuzungen, in den Löchern stehen jetzt Pfähle (v1016: Löcher ohne Pfähle), Randfall; Messlauf PC bauland 450 Brückenfelder Full HD alt v1016 ↔ neu: gleich innerhalb des Rauschens, Brückenmaler zusammen ≈ 0,15 ms je Bild; Prüfer-Funde in plan-160c/g2-funde.md, je Fund Test + Fix (16.10.2026): **Geld** (v1123, tests/g2-geld) Kopien rechnen und schreiben wie ein Neubau (Wasser-Art aus dem Aussehen, Übergang Neupreis), Anhöhe ohne brp mit eingefrorenem Rückfall je Material (`BK_ANH_RUECK`), Übergang ohne Design erst kaufen, Gleis-Vorschau = Abbuchung zwischen zwei Brücken (samt Angleichen im Zieh-Rutsch: `COVER.set` in build), rohe Altwerte nur über eigene Schlüssel (`brOwn`) ✓; **Bild** (v1124) Wasser-Wegbrücke stanzt das Nachtlicht vor dem vorderen Geländer (nur bei Treffern, nie doppelt), Figuren auf dem Übergang oben mit dem Hub der Anhöhe, Kristallstreifen halboffen, Nachmalen auf der Anhöhe nur unten, Strom nach Schranken ↔ Brücke neu, Licht auf dem Eckpodest ✓; **Lücken** (v1125, tests/g2-luecken) Seeweg-Hinweis auch bei Abriss/Aufschütten/Aufnehmen/🗑️ („Was von der Brücke bleibt, versperrt …“) und beim Einzeltipp aufs Wasser, Umfärben ohne Brücken-Schild/Geist, getragener/kopierter Übergang nie mit Linie in der Rampe (`archRampLined`) ✓; **Leistung** (v1126, tests/g2-leistung) P1 stehende Vorschau malt den Geist nicht jedes Bild neu (`ghostKeep`), P3 wbLiveSet nur Kristall + Anker gemerkt/nur mit Licht, P4 Strom ohne Sortieren aller Felder, P6 `wbVirtual` lässt die Merker der echten Karte stehen, P7 Gruppe gleicht je Spanne einmal an – dabei gefunden und behoben: abgelegte Gruppe aus Gleisbrücken glich sich gar nicht an (COVER fehlte), P2 je Ding 28 neue Schlüssel „Brücke …“ mit dem Maler des Spiels (Gleis je Material gerade 112–314, Kurve 230–260, T 261–294, X 340–392; Wasser Holz 186, Metall 272, Stein 1013, Kristall 222; Anhöhe 198/272/375/222; Übergang 617/748/1228/538 – Stein am teuersten: Mauerwerk mit Fugen; der Übergang malt in jedem Bild live, Wasser/Anhöhe ruhend als Bildchen) ✓. Nicht geändert: P5 (Bündler `brBatched` – erst am iPad messen). Für G3 ansagen: neue Brücken übers Wasser/Gleis nehmen das Material der Leiste (B1-4), flache Brücken sperren in alten Spielständen Boote (B1-5, Fähren prüfen). Offen: Messlauf iPad (Nutzer: ☰ → Grafik → 📏 Messlauf) · [ ] G3 CLAUDE.md, „Das ist neu“

## Block 161 – Sternstaub, täglicher Laden, große Sparziele (16.10.2026, PLAN-161.md)

Nutzer: „fast eine Milliarde Taler (72.000/s) – Dinge, die man erst ab enormen Mengen kriegt, und eine neue, schwerere Währung,
vielleicht ein täglicher Itemshop“. Entschieden: Sternstaub ✨, Spielen + Schatzkammer (Tageskurs), Sternenbasar als cozy Haus
mit Sternen, täglich 4 Angebote, nur Schönes, ein Tageswunsch am Tag. Kommt zusammen mit 160c live.
- [x] **161a** ✨ Sternstaub (js/sternstaub.js): Quellen Erfolgsstufe 10 × Stufe, volle Albumseite 50, Laternenfest 150, Sternschnuppe 2
      (selten 10), Truhe 10 × Inselnummer, Parkfest/Parade 3; einmalige Gutschriften mit Schlüssel (`state.sdGot`), Nachzahlung beim
      Laden still + Fenster „Sternstaub ist da“ (Testwelt bauland: 1.230 ✨); Schatzkammer Tageskurs 20 Mio × 1,1^n je Tag (1 Mrd ≈ 19 ✨,
      Uhr zurück bringt nichts, kein ↶); Pille ✨ oben (ab 481 px), auf dem Handy als Zeile im 📦-Lager; Speichern (serialize/parseSave,
      Live: privat), Test sternstaub.test.js
- [x] **161b** Tageswunsch: täglich einer (Kalendertag + Spielstand → auf allen Geräten derselbe, nur vorwärts), 12 Arten (Bänke am Wasser, Bäume, Blumen, Büsche, Laternen, Brunnen, Hecke, Zaun, Parkrasen, Weg, Haus Stufe 3, Pavillon), nur Baubares; gezählt ab dem Stand beim Erscheinen; erfüllt → 25 ✨ (einmal je Tag); im ✨-Fenster mit Fortschritt. Namen eindeutig (`tw…`, `state.dayWish`): `WISHES`/`wishHtml`/`wishAt` gibt es schon (Hauswünsche, Freundeswünsche)
- [x] 161c Sternenbasar (live seit 19.10.2026, v1154): Entwurf A „Sternenzelt“ gewählt (17.10.) – Gebäude 2×2 (Einrichtungen, frei mit dem ersten Sternstaub, nur einer je Insel, nicht im Album), Zelt mit Eingang/Vorhang/Tresen, Lichterkette und Stern nachts (Wimpel still: kein Live-Zeichnen), je Ding 233; Basar-Fenster: Heute (3 + 1 seltenes, gleicher Tag = gleich, Ungekauftes zuerst) und Katalog, Kauf für ✨ → `state.sdItems`, Baumenü über `sdShop`. Leistung je Ding neu geschrieben: dabei die runden Gleisecken (Kurve/T/X) neu gesetzt (Stein Kurve 230 → 275, Stein X 340 → 378, sonst gleich oder billiger). Erste 13 Waren (Entwurf tools/basar-waren-entwurf.js, Nutzer 17.10.: „voll die geilen Sachen – mehr, viel mehr, riesiger Itemshop“): Kirschbaum, Herbstahorn, Trauerweide, Laternenbaum, Nachtblumen, Pfau, Katze auf Kissen, Lampion-Bogen, Sonnenuhr, Schaukel, Koi-Teich, ✦ Sternbrunnen, ✦ Pagode (`SD_ART`, sdShop, je Ding 27–123); Baumenü-Gruppe ✨ Sternenbasar zeigt nur Gekauftes (Tests nehmen sdShop wie gift aus). 4 Sammlungen eingebaut (js/sternstaub-waren.js aus tools/waren-*.js, im Browser abgenommen): ❄️ Eiszauber 15, 🏰 Turm & Himmelslaternen 6, 👑 Prinzessinnen & Märchen 11, 🍃 Inselleben 13 – eigene Märchen-Motive, keine Disney-Figuren; zusammen 58 Waren, 11 selten. Seltenheit (Nutzer: „wirklich ein Spielziel“, Simulation scratchpad sd-sim2.js): normal 80–200 ✨, Seltenes der Woche 350–450 ✨ (wechselt montags, bleibt 7 Tage), Nachzahlung beim ersten Mal höchstens 300 ✨ (`sdBackPay`) – bei 1 Std/Tag ≈ 15 Dinge nach 30 Tagen, alles nach ≈ ½ Jahr. Turm aufgefüllt auf 13 (18.10.: Leseecke, Kräutergarten, Blumenkranz-Bank, Sonnenblumen, Wandgemälde, Glühwürmchen-Glas, ✦ Sonnenpavillon) → 65 Waren, 12 selten. Katalog (18.10., wie Animal Crossing): einmal im Angebot gesehen (`state.sdShown`, privat) → später zum 1,5-fachen nachbestellbar (`sdKatalogPrice`), Seltenes nie; Reiter Heute / Katalog / ✨ Sternstaub
- [x] 161h Basar „mehr special“ (PLAN-161 §9, 18.10.): Sternennacht-Stil (Nachthimmel, Gold, Seltenes groß im Lichtschein, Countdown), Händlerin Mondhase mit Tagesspruch (`sdHareSay`: letzter Tag des Seltenen, Herzchen-Ware, Sammlung fast voll, neu diese Woche, NEU, sonst 30 Tagessprüche), Sammlung je Karte, 📖 Sammelbuch (gekauft bunt, gesehen Umriss + Name, sonst ???), NEU-Schild (`state.sdNew`), ❤️ Herzchen (`state.sdWish`, Hinweis einmal am Tag `sdWishTick`), 👁 Ausprobieren (`sdTry`, Leiste Kaufen/Zurück, Kaufen stellt es an die Vorschau), Glitzern am Seltenen, Kauf: Sternenstaub sprüht (`sdBurst`) + Glöckchen (`sfx('bell')`); ✨-Reiter → Knopf am Kontostand; Basar-Waren nicht mehr im „Neu freigeschaltet“-Fenster. 19.10.: Gekauftes bleibt bis zum Wechsel im Laden stehen (Tagesware bis morgen, Seltenes bis Montag, `state.sdOffers`) – vorher rückte nach jedem Kauf etwas nach (mehrere Seltene pro Woche); „Das ist neu“ '2026-10-19-sternstaub'. Prüfung vor dem Push (19.10., Prüfer + Generalprobe alt↔neu): Sternstaub-Dateien vor main.js (sonst verlor Neuladen gekaufte Sammlungs-Waren, Hingestelltes ließ den Start abstürzen, Nachzahlung ohne Obergrenze); Ausprobieren baut auch per Ziehen/Rechteck nie (Sperre in build/buildSmall/buildRoofTop, dragKind); Katalog-Ware beim Ausprobieren zum Katalogpreis, ohne Katalog nur heutiges Angebot kaufbar; Sternstaub-Gutschriften, Herzchen, Gesehenes melden sich bei der Cloud (cloudTouched); Zuschauer: Basar ändert nichts. Bekannt, nicht behebbar: eine alte App-Version (≤ v1016) wirft Sternstaub-Daten beim Speichern weg und hängt bei Basar-Waren – nach dem Push alle Geräte neu laden. Prüfer Brücken (19.10.): Fähren/Expedition, die seit 160c an einer flachen Wasserbrücke hängen, meldet das Spiel einmal je Spielstand (`seaFlatCheck`, `state.seaFlatSeen`, alte Regel per `SEA_FLAT_OLD` verglichen); Gleisbrücke mit ausgeschaltetem Licht verlängern zahlt das Licht mit (vorher gratis). Nicht behoben (nur mit Gerät auf alter Version): v1016 kopiert Brücken mit dem bezahlten Neupreis, bucht aber den alten ab – nach dem Push alle Geräte neu laden. 21.10. erledigt: neuere Version hat gespeichert → dieses Gerät speichert/lädt nicht mehr hoch, Fenster „Neue Version da“ (`appVer`, `APP_VER`, `newerBlock`, wirkt ab dem nächsten Update); Tage aus der Zukunft (> morgen) gelten nicht (`sdFuture`: Tageswunsch, Schatzkammer, Angebote); ↶ nach erfülltem Tageswunsch macht ihn wieder offen und nimmt die 25 ✨ zurück (`twUndo`)
- [x] 162 **Monumente im Basar** (PLAN-162.md, js/monumente.js, v1157): Wahrzeichen des Monats (Pagode, Sternenleuchte, Obelisk, Triumphbogen) –
      Bauplan 1000 ✨ im Basar-Reiter 🏛️ Monumente, dann beliebig oft als Baustelle (1 Mio + 50 Bretter) mit 3 Abschnitten 100/300/600 Mio + Baustoffe;
      Prachtstücke (Statue, Sternendenkmal, Prachtbrunnen) als Seltenes der Woche für 500 ✨, sofort fertig. Sternenleuchte auch im Wasser. Echte
      Bildhöhe (ITEMS.h → spriteTop), Gerüst aus drawWonder herausgelöst (siteScaffold), Abriss erstattet auch die Abschnitte, Baustellen ohne
      Schönheit, Menügruppe 🏛️ Monumente, Sammelbuch-Seite. Wimpel des Bogens stehen still (Bildchen statt live). Leistungswerte der 7 neuen
      Bilder per leistung:neu eingetragen (nur neue Einträge, 81–904 – weit unter den Wunderwerken). Tests: tests/monumente.test.js.
      Offen/später: Rathaus-Liste „Bereit“ kennt die Wahrzeichen-Abschnitte noch nicht (nur das 🏗️ über der Baustelle).
- [ ] 161d Denkmal, Ehrentitel, goldene Varianten – später (18.10.: Taler-Problem über Schatzkammer + Basar gelöst, vorerst nicht nötig)
- [ ] 161e Inselzauber – später (18.10.: Taler-Problem über Schatzkammer + Basar gelöst, vorerst nicht nötig)
- [ ] 161f Prachtbauten (je Entwurf zuerst) – später (18.10.: Taler-Problem über Schatzkammer + Basar gelöst, vorerst nicht nötig)
- [ ] 161g restliche Laden-Dinge
