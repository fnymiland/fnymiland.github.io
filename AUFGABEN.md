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
