# Fnymiland – Projektwissen

> Das Spiel heißt **Fnymiland** (früher „Kachelhausen“). Nirgends Sichtbares mehr mit „Kachelhausen“. Nur die internen
> Speicher-Schlüssel (`kachelhausen_v3`, `kachelhausen_*` im localStorage, `window.kachelhausen`) bleiben – umbenennen hieße,
> gespeicherte Inseln und Einstellungen gingen verloren.

Gemütliches Aufbauspiel auf einer Insel (Polytopia-Kacheln, Animal-Crossing-Look). Der Nutzer entwickelt es
gemeinsam mit Claude und spielt es auf dem iPad im WLAN. **Das Konzept steht in [KONZEPT.md](KONZEPT.md)** –
dort auch die Bau-Reihenfolge. Größere Änderungen erst mit dem Nutzer besprechen (Optionen zeigen, dann bauen).

## Aufbau

Kein Framework, kein Build. `index.html` lädt die Skripte **in dieser Reihenfolge**; alle teilen sich den
globalen Scope (klassische Skripte, keine Module):

| Datei | Inhalt |
|---|---|
| `js/data.js` | Grundwerte, `ITEMS`, `RES`, `STYLES`, `TECHS`, `STARS`, `LANDMARKS`, Farben |
| `js/state.js` | Spielstand: `newState`, `serialize`/`save`, `parseSave`/`load` (Migrationen!), Export/Import |
| `js/world.js` | Insel-Generator (Rauschen), Gelände, Sehenswürdigkeiten, Grundstücke |
| `js/rules.js` | Regeln: Viertel, Erreichbarkeit, `totals()` (Einnahmen, Rohstoffe, Schönheit), Bau-Prüfungen |
| `js/audio.js` | kleine synthetische Klänge |
| `js/actions.js` | Bauen, Abreißen, Kaufen, Forschen, Verschieben, Hausausbau |
| `js/story.js` | Laternen, Ortstitel, Wahrzeichen restaurieren, Tagebuch, Einführung, Laternenfest |
| `js/input.js` | Kamera, Maus/Touch, Pinsel |
| `js/draw-base.js` | Grundformen (`poly`, `box`, `C()` mit Nebel/Ruinen-Farben), Gelände, Bäume |
| `js/draw-kit.js` | **Baukasten** für Gebäude in 4 Richtungen: `kit(cx, cy, z, rot)` → `K.block`, `K.door`, `K.wins`, `K.scene` … |
| `js/draw-objects.js` | Wege, Rathaus/Park, Häuser (`HOUSE_ART`), Deko, Sehenswürdigkeiten, `drawObject` |
| `js/draw-buildings.js` | Betriebe und Bildungsbauten in 3 Stufen (`BUILDING_ART`) |
| `js/movers.js`, `js/render.js` | Bewohner, Szene (Reihenfolge, Vorschau, Nacht, Schilder) |
| `js/ui.js` | Leisten, Infofenster, Dialoge, Menü, Produktion pro Zeitschritt, Offline-Gutschrift |
| `js/main.js` | Neues Spiel, Probeansicht (`?probe`), Start und Spielschleife |

Oberste Ebene jeder Datei darf nur Funktionen/Konstanten anlegen oder Dinge aus **früheren** Dateien benutzen
(Funktionsaufrufe über Dateigrenzen erst zur Laufzeit). Jeder globale Name nur in einer Datei – ein zweites `function x` in einer späteren
Datei ersetzt das erste still (beim Bau der Rampe überschrieb ihr `rampSink` das der Tunneleinfahrt; tests/anhoehe-stufe2.test.js prüft es).

## Regeln

1. **Spielstände sind heilig.** Neue Felder in `serialize` **und** `parseSave`; alte Stände müssen immer
   lesbar bleiben (Migration in `parseSave`). Unlesbare Stände werden nie überschrieben (`loadFailure`).
2. **Nach jeder Änderung `npm run bump`**, sonst lädt das iPad alten Code aus dem Cache.
3. **`npm test` muss grün sein.** Neue Regeln bekommen einen Test (`tests/`, Hilfen in `tests/helpers/load-game.js`).
4. Die Probeansicht (`?probe`) speichert nie etwas – gut zum Zeigen neuer Optik.
5. Texte im Spiel auf Deutsch, kurz und freundlich.
6. **Wege** (`weg`) belegen ein ganzes Feld; Stile in `STYLES.weg` (`shape: 'band'` verbindet sich mit Nachbarn,
   `'fill'` = Platz). Viertel = alles Bebaute, das direkt/über Eck/über Wege zusammenhängt (`computeNet`).
   Straßen, Gehwege an Kanten und Pflaster gibt es nicht mehr – alte Stände wandelt `parseSave` um.
7. **Große Gebäude** (`ITEMS[b].size`, z. B. `[2, 2]`): gespeichert wird nur das Ankerfeld (hinterste Ecke).
   Wer wissen will, was auf einem Feld steht, fragt `objAt`/`anchorAt`/`bAt` (nutzen `COVER`), **nie**
   `state.tiles.get` für beliebige Felder. Nachbarn zählen über `countNear` (jedes Gebäude einmal).
   Gezeichnet werden große Gebäude am vordersten Feld (`BIG_ART`). Alte Stände rücken per `fitFootprints`.
8. **Verschieben** (`pickUp`/`dropAt`/`cancelMove`): Während des Tragens speichert `serialize` das Objekt an
   seinem alten Platz mit, damit beim Schließen der App nichts verloren geht.
9. **Häuser** wachsen über Wünsche (`HOUSE_STAGES`, `WISHES`, `wishMet`, `houseWishes`): Ausbauen per Hand
   (`houseUpgrade`), kostet Material, **nie schrumpfen**. Einwohner pro Stufe aus `HOUSE_STAGES`.
   Bewohner: `t.animal`/`t.name` (alte Häuser bekommen sie per `nameHouses`).
10. **Ziel = Laternen** (keine Sterne mehr): Wahrzeichen haben 3 Stufen (`LM_STAGES`, `state.restore`), jede Stufe
    = 1 Laterne + Tagebuchseite + Freischaltungen. Freischalten läuft über `unlockOk` (`lm: 'baum:1'`,
    `lanterns: n`, `tech`, oder `state.legacy` aus alten Ständen). Wahrzeichen wirken erst ab Stufe 1.
    Leuchtturm ab 21 Laternen → `festival()`. Einführung: `TUTORIAL` + `storyTick` (-1 = fertig).

11. **Drehen**: `rot` 0–3 = Tür nach +x, +y, −x, −y (`FRONT_DIR`). `size = [Tiefe, Breite]` bei rot 0, ungerade
    Drehung = quer. Beim Setzen dreht `placeRot` automatisch zum Weg (`autoRot`), bis man selbst dreht (`rotManual`,
    gilt bis zum Werkzeugwechsel). Mausrad dreht beim Bauen/Verschieben. Neue Gebäude **immer mit dem Baukasten**
    zeichnen (eigener Rahmen: a = vorn, b = Seite), dann stimmen alle vier Richtungen von selbst.
12. **Gebäude-Stufen** (`BUILD_STAGES`, höchstens 3): Bedingungen (`stageInfo`: freie Mitarbeiter + etwas Passendes in
    der Nähe) → ✨ → Ausbauen per Knopf (`stageUpgrade`, kostet Taler + Material). Ertrag ×Stufe, Mitarbeiter ×Stufe
    (`jobsOf`). Jede Stufe sieht anders aus (`BUILDING_ART[b](K, stufe, …)`). Häuser: Aussehen wählbar (`t.look`).
13. **Tag/Nacht** läuft auf einer eigenen Spieluhr (`nightAt`, 20 Minuten pro Tag), nicht auf der echten Uhr.
14. **Leistung (iPad!)**: Der Boden jedes Grundstücks samt Wegen wird zwischengespeichert (`groundCache`,
    neu bei `recalc` über `groundVersion`). Wer Gelände/Wege ändert, ohne `recalc` aufzurufen, erhöht `groundVersion`
    selbst. Wald/Felsen sind fertige Bilder (`tileSprite`). Keine Dinge, die pro Bild für alle Gebäude laufen
    (die aufploppenden Einnahme-Zahlen wurden deshalb entfernt).
16. **Licht**: Die Sonne steht links (`LIGHT` in draw-base.js): Wände nach +y hell, nach +x dunkel, Dächer je nach
    Richtung. Gebäude werfen Schlagschatten nach rechts (`SHADOW`/`shadowOf` in render.js, im Boden zwischengespeichert).
    Flaches (Plätze, Rasen, Beete) steht in `groundPart(() => …)` und wird im Boden-Durchgang gezeichnet (`PASS`),
    damit Schatten darauf fallen; neue Gebäude mit flachem Teil in `GROUND_TYPES` eintragen.
17. **Inseln** (Spielstand v7): Heimatinsel (`ISLAND`, gehört einem ganz) und Themen-Inseln (`ISLES` in data.js,
    je eine Sehenswürdigkeit in der Mitte, `isleAnchor`). Erschlossen wird der Reihe nach (`nextIsle`, `isleNeeds`,
    `unlockIsland`, `state.islands`); `state.owned` sind die Grundstücke (6×6) der erschlossenen Inseln (`ownIsland`).
    Kein Grundstückskauf mehr. Gelände der Heimatinsel darf sich **nie** ändern (`homeLand`/`baseTerrain`), sonst stehen
    Gebäude alter Stände im Wasser. Alte Stände ziehen per `migrateIslands` um (einmalig, `state.moveLm`).
18. **Forschung** hat zwei Seiten: *Wissen* (`TECHS`, Ideen, Stufe 1–3 braucht Schule/Bibliothek/Uni: `techReady`) und
    *Kunstakademie* (`DESIGN`, Taler nach Einkommen `designPrice` + feste Ideen `designIdeas`, seit 09.10.2026): jede Farbe (`colorOk`, `colorsOf`), jeder Wege-Stil (`design`-Preis in `STYLES`)
    und Deko wie die Laterne einzeln (`buyDesign`, `state.design`); `master` braucht eine Kunstakademie.
    Geschenke der Sehenswürdigkeiten (`lm`) bleiben Geschenke. Alte Stände behalten, was sie hatten (v8 in `parseSave`).
19. **Alles live:** Fenster mit Kosten/Bedingungen öffnen sich mit `showPanel(html, live)` bzw. `openModal(html, live)`;
    `live` baut das Fenster neu (z. B. `() => openLandmark(x, y)`), `updateHud` ruft es alle 200 ms auf, und `patch()`
    ändert nur, was sich unterscheidet (Knöpfe bleiben dieselben). Pause, solange getippt oder gedrückt wird. Handler in
    solchen Fenstern nur per `onclick =` setzen (kein `addEventListener`, sonst doppelt). Die Leiste unten baut sich neu,
    sobald sich Freischaltungen ändern (`unlockSig`).
20. **Wege** (draw-objects.js): Bänder (`roadShapes`) und Plätze (`drawPlaza`). Jedes Feld zeichnet nur in seine
    eigene Fläche; Übergänge bestehen aus zwei Hälften (Schwelle zwischen Stilen: `pathThresholds`, Trichter an
    Plätzen: `pathFlares` + Lücke in der Platzkante). Platzecken sind rund, außer dort mündet ein Weg. Ecken, an
    denen ringsum Weg ist, füllt `pathQuads` (breite Wege). Trittsteine liegen je Arm bei 1/8 und 3/8
    (`stonePoints`), damit der Abstand über Feldgrenzen gleich bleibt. Formen für `clipTo` dürfen sich überlappen
    (Drehsinn wird angeglichen). Die Stil-Leiste zeigt nur Freigeschaltetes plus „🎨 weitere“.
21. **Kleine Dekos** (`small: true`, auch der Baum): 4 Ecken pro Feld in `state.decos` (0 hinten, 1 rechts, 2 links,
    3 vorn), auch auf Haus- und Wegfeldern. Belegte Ecke → `freeSlot` nimmt die nächste freie (Vorschau und Bauen
    gleich). Alte ganze-Feld-Dekos wandern per `normalizeSmall` in eine Ecke (Bäume nach hinten). Zeichnen bekommt
    die Ecke als `t.slot`, damit vier gleiche Dekos auf einem Feld verschieden aussehen.
22. **Kristall 💎** kommt nur von Kristallfels (Gelände `kristall`, nur auf der Kristallinsel) über die Kristallmine.
    Kristall-/Glas-Dekos kosten 💎 und leuchten nachts (`glowQuad(…, 'blue')`). Hausstufen können eine Freischaltung
    haben (`lm` in `HOUSE_STAGES`, Glasvilla): bis dahin liefert `houseWishes` `next: null` und `later`, damit kein
    unerreichbares ✨ erscheint. Große Glasflächen nachts nur in der Mitte leuchten lassen, sonst verschwinden Sprossen.
23. **Meer und Megainsel:** Offenes Meer direkt neben eigenem Land kann man sich nehmen (`claimable`, `state.claimed`):
    Aufschütten macht daraus Land (darauf alles), Schienen darüber sind Brücken. `ownedTile` zählt diese Felder mit.
    Ziehen baut über `tilesBetween`, damit bei schnellen Fingern kein Feld fehlt.
24. **Bahn** (Forschung „Eisenbahn“, ab Erzinsel): `computeRail` in `totals` – Schienennetze, Bahnhöfe (intern
    `station`; `bahnhof` war ein früheres, entferntes Gebäude und wird in alten Ständen erstattet!), Linien = Netz mit
    Bahnhöfen auf ≥ 2 Inseln (`regionAt`, aufgeschüttetes Land zählt zur nächsten Insel). Je Zug 2 Windräder; fährt er:
    +8 Pendler je Bahnhof, +10 % (`s.rail`) für alle Gebäude der Inseln. Schienen verbinden keine Viertel. Züge in
    movers.js (`syncTrains`/`stepTrains`/`trainCars`), Wagen als gedrehte Quader (`drawTrainCar`). Alles, was an einem
    Feld hängt und gespeichert werden muss (`bridge`, `train`), gehört auch in `tileOut` – der Zufallstest findet es sonst.
25. **Baumenü** = `MENU` (data.js, Block 40, seit 08.10.2026 vier Bereiche) – nach dem, **was man gerade tun will**: 🏘️ Stadt
    (wo Bewohner leben und einkaufen: Wohnen / Läden / Essen & Trinken / Markt / Kaufhäuser / Einrichtungen inkl. Schule, Post,
    Apotheke, Hotels / Verkehr inkl. Schiene, Bahnhöfe, Hafen, Steg) · 🏭 Herstellen (produziert: Taler / Rohstoffe / Veredeln /
    Strom) · 🎡 Freizeit (Kultur, Wunder inkl. Leuchtturm, Freizeitpark) · 🌸 Gestalten (formt die Welt: Grün inkl. Park / Platz /
    Besonderes / Wege & Gelände / Anhöhen). Nach dem echten Ort einsortieren, nicht nach der
    Spielwirkung (die steht im Infofenster). Keine Erklär-
    Zeilen in der Leiste (Nutzer: selbsterklärend, stört). Neue Dinge nach der Regel einsortieren, nie nach dem Namen („Bäckerei“ = Herstellen).
    Ein Bereich klappt ein Feld (`#sheet`, `setSheet`) mit allen Gruppen als Überschriften auf (Block 153); jedes Ding in
    **genau einer** Gruppe (Test); Wirkung in `FX`, Läden in `SHOP_GROUPS`. Keine Suche mehr (Nutzer: „nutzt eh nie einer“).
    Handy: Bereiche nur als Symbol (sonst passt die Zeile nicht). Am PC/iPad keine Hinweiszeile beim Wählen, auf dem Handy
    nur Name, Preis, wie man baut und ⓘ. Solange etwas in der Hand ist, wird 👆 ein rotes ✕ (`syncDropBtn`). Alle Knöpfe der
    unteren Reihe und der Stil-Leiste 34 px hoch. Rathaus „Bereit“ über `buildGroups()`.
    Gruppen-Reihenfolge im Feld immer über `orderedGroups(top)` (eigene Anordnung je Gerät, „⇅ Anordnen“), nie direkt `top.groups`.
25b. **U-Bahn** (Block 136, js/draw-ubahn.js): Tunnel liegen in `state.tunnels` (Feld → { form }), oben darf alles stehen außer
    Schienen/Bahnhöfen – ein Feld ist Schiene ODER Tunnel. Ob zwei Nachbarfelder befahrbar zusammenhängen, sagt nur `trackLink`
    (Schiene und Tunnel nie direkt – dazwischen gehört die Tunneleinfahrt, 2 Felder, `einOf`/`einTiles`: vorn Schiene, hinten
    Tunnel; nur noch als Rampe – oder das Bergportal in der Wand einer Anhöhe, 29a5). Netz-Abfragen über das Feld selbst (`railTileAt`), nicht über COVER. U-Bahn-Station steht auf dem Tunnel und
    hält auf ihrem Feld (`stopDirs`). Linien auf einer Insel (`l.inner`) bekommen Strom zuletzt und dürfen nur zusätzlich wirken
    (Wünsche, Läden ohne diese Art, Fahrkarten) – nie bestehende Einnahmen senken. Neues, das Schienenwege abfragt, Tunnel mitdenken.
    **Kacheln** zeigen Bild, Namen und Preis (`cardPrice`, kurz über `shortMoney`);
    Reihenfolge `menuList()` (Freies zuerst, auch für die Zahlentasten). Kachel antippen = `pickCard`: am iPad/Mac
    rechts das **Bau-Infofenster** (`openBuildInfo`, `showPanel(…, live, id)` setzt `buildInfo`), das offen bleibt,
    solange das Ding gewählt ist (`setTool` schließt nur bei einem anderen Werkzeug). Handy: kein Fenster, sondern ein ⓘ im Hinweis (`.hint-info`), Tippen auf die Karte schließt es wieder.
    Neue Infos zu einem Ding gehören ins Bau-Infofenster, nicht auf die Kachel.
26. **Natur räumt sich weg** (`willClear`, `clearCost`, `clearNature`): Bauen auf Wald/Obsthain/Fels/Erz/Kristallfels
    rodet bzw. sprengt zum normalen Preis; Betriebe behalten ihr Gelände. Beim Verschieben wird nichts geräumt.
27. **Canvas-Text nie mit `textAlign = 'center'`**, sondern `centerText()` – Safari zentriert Text mit Emojis falsch.
28. **Bahnübergang** = Schienenfeld mit `cross` (+ `style` des Wegs, `foot`/`footPaid` für die Bogenbrücke). Gehört
    zu beiden Netzen: `railArms`/`railPath` (Schiene), `pathArms`/`wishMet('weg')`/`computeNet`/`walkable` (Weg).
    Entsteht in `build` über `crossCandidate`/`crossError` (nur gerade Schienen, keine Brücken). Was über Fahrzeuge
    gehört (vordere Hälfte der Bogenbrücke), kommt in `afterMovers`; Bewohner auf dem Bogen (`archAt`) sammelt
    `archWalkers` und zeichnet sie danach. Der Bogen ragt je ein halbes Feld auf die Nachbarwege (flacher).
29. **Bildrate** (main.js `frameInterval`): beim Bedienen höchstens 60/s, beim Zuschauen 30/s, im Hintergrund oder nach
    2 Minuten ohne Eingabe 15/s – sonst läuft der Rechner warm (vorher 60–120/s ohne Pause). Alles, was sich bewegt,
    rechnet mit der echten Zeit (dt), nie mit „pro Bild“.
29a. **Überdachungen** (Block 138, js/roofs.js): `state.roofs` (Feld → { form, col, bel, par, top }) ist eine Fläche aus 3 × 3 Teilstücken je
    Feld (`roofArea`: `sub`, `dist`) – neue Formen/Teile nur über diese Teilstücke zeichnen, nie über Feldgrenzen hinaus (sonst
    überlappen Nachbarn). Stützen setzt der Nutzer (`stuetze`, Platz 0,42 = `RW` = Dachkante); das Spiel stellt nie selbst welche.
    Bildchen je Feld (`roofSprites`, Schlüssel `roofSig`): wer etwas ändert, das die Nachbarschaft betrifft, ruft `roofDirty`.
    **Pergola-Grundstruktur ist abgenommen und bleibt (Nutzer, 09.10.2026: „perfekt, änder an dieser Grundstruktur nichts mehr!!“):**
    Randbalken als Kanthölzer (`PERG_T` 0,05, `PERG_BH` 1,6, Außenseite auf der Dachkante, Ecken laufen zusammen), Pfosten gleich
    stark bündig darunter (`PILLAR_HALF.pergola`), Latten als feines Gitter in beiden Richtungen (alle 0,25), zwischen den
    Randbalken eingelassen, oben knapp unter deren Oberkante (Nutzer wählte B, dann C).
    Innere Pfosten (nicht am Rand) tragen Balken wie die Randbalken in beide Richtungen bis zum Rand (`roofInnerBeams`) – nur wo
    wirklich ein Pfosten steht; ohne Pfosten bleibt das dünne Gitter (Nutzer: weite, luftige Pergolen sollen möglich sein).
    Nicht anfassen, auch nicht „nebenbei“.
    Deko auf dem Dach (138b) gehört zum Dachfeld (`r.top`): wer ein Dach löscht, ersetzt oder die Form wechselt, gibt sie über
    `roofTopClear` zurück; wer ein Dach kopiert, nimmt `roofCopy` (eigene Liste). Wer Deko zählt (Schönheit, Strom, Erfolge, „alle
    umfärben“), nimmt `roofTopAll()` dazu.
    Dachtreppe (138d): die Treppe malt unter Steinarkaden das Dach (durch die Öffnung, zugeschnitten auf das Feld) – nie das
    Gebäude selbst, sonst landen Stufen eines späteren Felds über dem Dach davor. Leute oben (`roofers`) zeichnet die Dach-Schleife
    des Felds: auf der Treppe nur durch die Öffnung, oben nach der Deko und vor der vorderen Brüstung. Was vor einer Figur auf der
    Treppe liegt (höhere Stufen, vordere Mauern der Öffnung, auch auf dem Nachbarfeld), zeichnet `drawRoofers` danach im Bereich der
    Figur noch einmal – bei jeder neuen Sache in der Öffnung alle vier Drehungen ansehen (Nutzer).
    Reihenfolge prüft tests/dachverdeckung.test.js; Leistung die Testwelt „dach“ im Wächter (tools/dachwelt.js). Was je Bild über dem
    Dachbild liegt (vordere Brüstung), als Bildchen ablegen (`e.fc`), nie Strich für Strich.
    Hohe Deko unter Dächern: `DECO_TALL`/`roofClear`/`tooTallUnderRoof` (auch Dach drüber, Formwechsel, Verschieben). Dächer blass
    beim Bauen darunter: `roofFade` (Werkzeug, das oben nicht darf).
29a2. **👁 Durchsicht** (settings.js `seeThrough`, Knopf `.quick.see` in der Leiste, Taste D): Dächer, Gebäude (ohne Wege/Boden),
    Bäume/Wald/Obst, Bewohner und Fahrzeuge zu 25 % (`SEE_A`) – blass nur über `seeFaded(an, f)` beim Zeichnen; Tippen geht
    hindurch (`objectAt`, `walkerAt`, `critterAt`, `roofPick`, `roofTopAt`, `holeHit` liefern dann nichts). Nur Ansicht, nie im
    Spielstand. Umschalten über `setSeeThrough` (zeichnet Standbild/Vorschau neu). `setTool` färbt nur `.quick[data-quick]`.
29a3. **Schnellwerkzeuge** (Block 155): Leiste = 👆/✕ · 🛤️ · ✋ Auswählen · ↶ · 👁 | 🕘 – kein 🧹 mehr (Nutzer: „Leiste ist mir heilig“).
    Löschen geht über ✋-Auswahl → `demolishSelection` (Abriss-Plan mit `keepLand`: Wald/Fels bleiben), Aufgenommenes →
    `discardCarried` (erst zurücklegen, dann über `demolish`/`removeSmall`/`removeEdge` – nie selbst erstatten), 👆-Fenster 🗑️
    (`#p-del`, Entf klickt ihn), Wald/Fels → `openLandInfo`. Was nur mit dem Werkzeug 'abriss' zu sehen war, braucht einen anderen
    Weg (Tunnel: 👁). Neue Fenster mit Löschen: Knopf `id="p-del"`, dann geht auch Entf.
29a4. **Deko-Plätze** (Block 42/65/156): je Feld 0–3 Ecken, 4–7 Seitenmitten, 8 Eckpunkt (`VSLOT`), 9 Mitte (`CSLOT`). „Seitenmitte“
    nur über `isSide(i)`, nie `i >= 4`; „alle Plätze im Feld“ über `PLACE_SLOTS`, nie `i < 8`. Ein neuer Platz bekommt eine neue
    Nummer hinten (alte Versionen schneiden mit `slice(0, 9)` ab und laufen weiter).
29a5. **Anhöhen** (Block 157, js/hills.js): Höhe je Feld in `state.hills` (Feld → { w, h? }), `hillLift(x, y)` = Ebene × `HILL_H`.
    Alles, was zu einem Feld gehört, wird um den Hub angehoben gezeichnet (render.js tileA/tileB; wer selbst per toScreen Punkte eines
    Felds rechnet, zieht `hillLift` ab). Bildschirm → Feld nur über `pickFrac` (toTile, toVertex, edgeNear, slotAt), nie tileFrac
    (das bleibt flach für Kamera und Dächer). Was oben darf: `hillOk`/`hillError` (Stufe 3, Block 157j: alle Gebäude, Wunder, Bahnhof, Hbf, U-Bahn-Eingang, Achterbahn,
    Wege, Platz-Dinge, Deko, Gelände, Schienen – nicht `HILL_NO` (Dächer/Dachtreppe/Stütze bis 157k, Parkbahn, Seilbahn, Tunneleinfahrt, Treppe,
    Gleis-Rampe) und `HILL_WET` (was Wasser braucht)); Mehrfeld immer ganz auf einer Ebene (`sameLevel`). Was beim Anheben/Abtragen mitkommt:
    `hillCarryOk` (Gebäude nie – Anheben gesperrt, Abtragen nur mit dem Gebäude; `hillStuckOn`). Erreichbarkeit oben über Gegenden (`hillRegions`,
    `sameRegion`, `hillNoStair`): eine Treppe zählt nur mit begehbarem Fuß und oberem Feld (`hillStairUse`), was sie versperrt, gehört zu beiden
    Gegenden; Wege/Ziele der Figuren nur in derselben Gegend (`walkPath`, `findGoal`). Fenster: `hillInfoStatus`. Zeichnen oben: Schatten im
    Bildchen der Anhöhe (`hillShadePaint`/`hillShadeOn`, über Gärten `hillShadeSpill`), was flach über die Grundfläche ragt, wird an der Kante
    abgeschnitten (`hillCutClip`), Felder davor werden vorgezogen (`hillPre`) oder malen das Gebäude auf ihrer Raute nach (`hillLate`), flache
    Teile oben mit Zeit 0. Bahn oben: `growLevelErr` (Bahnhof/Hbf wachsen nur auf ihrer Ebene), `coasterLevelOk`, `stopLevelHint`, Zug in der Halle
    eines Hbf oben zeichnet der Hbf selbst. Fundament kann mehrere Ebenen, gebaut ist eine.
    Ohne Anhöhen muss alles exakt wie vorher laufen (früh aussteigen, wenn `state.hills.size` 0).
    **Treppe** (157d, `huegeltreppe`): steht unten (Ebene 0) direkt vor der Wand, Stufen auf dem eigenen Feld bis zur Oberkante. Regeln über
    `stairError`, Drehung nur über `stairRot` (placeRot, auch Vorschau/Verschieben; in einer gedrehten ✋-Gruppe dreht sie mit, `groupPlaced`), kein
    Dach darüber (roofError und `groupErrors`), Treppen ringsum `stairsAround` – eine Anhöhe mit Treppe davor ist nicht abtragbar (lowerHill,
    demolishInfo, ✋-Rechteck, ↶). Aussehen hängt an den Nachbarn (`stairLook`: Anhöhe = Wange, gleiche
    Treppe = breit, sonst Keil) – als Bildchen in `hillSprites` ('s' + Feld). Antippen in der Höhe kennt die Stufen (`stairHeight` in pickFrac).
    **In eine bestehende Anhöhe** (10.10.2026): auf ein Randfeld (Ebene 1, dahinter gleich hoch, davor Fuß wie unten: `stairDirs` mit `stairBase`)
    senkt `build` das Feld ab (`hillTake`, Erstattung verrechnet: `stairIntoBack`, auch in placeError/Schild) – ein ↶-Schritt (undo nimmt die Treppe
    der Stufe mit, `mine`). Regeln `stairIntoError`; getragen (✋, Gruppe, ⧉ Kopie: placeError mit `opts.t`) nie. Vorschau: `hillGap` gilt nur für das
    Bild (render setzt und löscht es) – Feld ohne Anhöhe und Anheben, Nachbarn als eigene Bildchen ('p' + Feld); Zeichnen fragt Nachbarhöhen über
    `drawLevel`, Spielregeln nie.
    **Bündig** (Nutzer 10.10.2026, tests/treppe-buendig.test.js): Keil = schmale Anhöhe – oben auf der Linie der Stufenkanten (vorn eine Stufe
    hoch, ab der obersten waagerecht auf `HILL_H`, nie darüber), Oberseite in Bodenfarbe (`groundTopAt`), hinten 0,0075 über die Feldgrenze wie
    Anhöhe an Anhöhe (sonst feiner dunkler Strich zur Oberseite dahinter), Wände mit derselben Grasnarbe; hinterer
    Keil außen mit dunkler Kante. `paintHillWall`: Grasnarbe und Felsschichten treffen an jedem Wandende genau ihre Mitte (Feldgrenzen, Ecken,
    Keil ↔ Anhöhe), nie unter den Fuß. Oberseite nach hinten und über Wänden genau auf der Raute, nur zu gleich hohen Nachbarn vorn größer
    (sonst Spitzen an Ecken). Dunkle Kante oben im selben Zuschnitt (gerade Enden), neben einer Treppe nur bis zur obersten Stufe
    (`hillStairEnds` a–d), Innenecken schließt `hillMiter`. Wer Neues an Wand oder Kante malt, hält diese Enden ein.
    **Schmale Treppe** (Nutzer 10.10.2026, tests/treppe-breite.test.js): `t.schmal` (fehlt = breit, alte Stände), neu wie die Wegform bzw. die Wahl
    in der Leiste (`stairNewWide`, `stairWideNew`; der Wegform-Knopf setzt sie zurück), im Fenster für die ganze Reihe (`stairRow(…, true)`,
    `setStairWidth`). Stufen so breit wie ein Weg samt Rand (`STAIR_NW` = `EDGE_W`), Seiten nur über `stairSide`: 'h' Anhöhe daneben → im Feld
    bleibt ein Streifen Anhöhe stehen (ganz hoch); 'k' Keil bis an die Feldgrenze (kein Grasstreifen dazwischen); Treppe daneben, eine schmal:
    eingelassen (`stairRowCut`) Streifen 'r' bzw. bei der breiten 'h', vor der Wand Keile 'w' ohne Außenwand. Schmale verschmelzen nie, Ecktreppen
    nur breit (`cornerDirs`, `stairFit`; Hinweis `STAIR_ECKE_BREIT`, auch beim Einsetzen: `stairIntoRefits(…, true)`). Anhöhen am Streifen:
    `hillStairEnds` A/C (keine dunkle Kante), M/N (keine Wand, `hillWallsAt`, Wand am Fuß läuft unter den Streifen: `hillExt`). Kurze Wände mit
    ihrer Länge malen (`paintHillWall` … `len`), sonst drängen sich Risse und Zacken. Getragen abgelegt (dropAt, dropGroup) richtet `stairDropped`
    die Treppe aus wie `build` (Ecke ↔ gerade, Ecke immer breit, dann `refitStairs`) – der Geist in drawHillStair zeigt es schon so.
    **Spaziergänger** (157e, js/hill-walkers.js): `w.up` = Höhe über dem Feld, auf dem gezeichnet wird (oben 0, Treppe = Stufe am gezeichneten
    Fußpunkt `hwFootD`, Boden null); Kopf/Antippen über `walkerHead` (+ `hillLift`). Wer Listen von Bewohnern prüft (Fenster, Antippen,
    Sprechblase), nimmt `hillWalkers` dazu wie `roofers`. Treppe weg oder kein Weg mehr zum Ausstieg (`hwRoute` false: Zaun, Deko): sie
    verschwinden, nie in der Luft oder ewig oben. Tests mit Spaziergängern stellen die Spieluhr fest (`gameHour`) – nachts kommen halb so viele.
    **Gleis-Rampe** (`huegelrampe`, Nutzer 10.10.2026: „nur für Züge da, Autos soll es nie geben“; Entwurf tools/gleisrampe-entwurf.js, Bild
    tools/vorschau/gleisrampe-varianten.png): die frühere Weg-Rampe ist weg – zu Fuß hinauf geht es über die Treppe. `t.form` 'a'–'d' (`RAMP_FORMS`
    in data.js, nie Zahlen; `rampFormOk`), `t.price` = bezahlt (Abreißen voll zurück wie Deko: `rampPaid`; Kopie/Preis je Form `rampCost`). A 2 Felder
    ganz eingelassen (Wände der Anhöhe = Wangen, ganz breit), B 3 Felder Damm mit Stützmauer davor, C 4 Felder (oben 2 schmal eingelassen, unten 2
    Damm), D 4 Felder Viadukt auf Bögen davor. Form neu: Leiste (`rampNewForm`, `rampFormBar`), im Fenster nur A ↔ C bzw. B ↔ D (`rampFormPlan`/
    `setRampForm`, oberes Feld bleibt, Differenz bezahlt, ↶). Alte Weg-Rampen (ohne Form, nie online) entfernt `parseSave` mit Erstattung.
    Grundfläche `sizeOf` [1, len], Anker = kleinstes x/y; welches Feld was ist, sagt nur `rampAt(x, y)` → { k, t, ax, ay, len, rot, i (0 Fuß …
    len − 1 oben), form }, alle: `hillRamps()` (mit foot/top). Höhe stetig `rampHeight` (Vorderkante Fuß 0 … Hinterkante oben `HILL_H`), Lage
    längs `rampAlong`, Oberfläche überall `surfaceHeight(u, v)`. Regeln `rampError`/`rampIntoError` (A/C in den Rand eingelassen: `rampIntoBack`/
    `rampIntoSink`, getragen nie; B/D davor), Drehung `rampRot`, `rampsAround` (Abtragen, Anheben, Teich, ✋-Rechteck, ↶), getragen/kopiert in
    ihrer eigenen Form prüfen (placeError mit `opts.t`). Bauen und ✋ Ablegen per Tippen (`rampTool`): `rampAnchor` in tap/setHover wie `einAnchor` –
    passt das angetippte Feld als Anker, bleibt es, sonst zählt es als Feld an der Wand (`rampSnap`; sonst läge der Anker an Wänden hinten bis 3
    Felder davor).
    Aussehen `rampLook` (Wange/Einschnitt daneben, Grasnarbe der Anhöhe, Gleis-Stil der Strecke am Fuß bzw. oben, freie Enden `ef`/`et` →
    Prellbock `rampStop`, Büschel/Blumen `railTrim` außer auf dem Viadukt), je Feld ein Bildchen ('r' + Feld, `rampSig`) – render.js zeichnet
    jedes Rampenfeld für sich, nie in Streifen. Anhöhe daneben/dahinter kennt sie (`hillStairEnds` A/C wie die Treppe, P/Q Damm, X/Y Viadukt,
    U/V/M/N neben dem schmalen Einschnitt), Gehrung nur für A (`rampMiter`, `hillMiter` mit `rampWideForm`). Keine Eckpunkt-Deko auf der Schräge.
    **Gleise auf Anhöhen**: Schienen dürfen oben liegen (kommen beim Anheben mit hinauf), verbinden sich aber nie über die Kante – nur über die
    Gleis-Rampe an Fuß und Oberkante. Zusammenhang nur über `trackLink`/`railArms` (rules.js, eine Quelle für Netz und Bild) und `levelLink(…,
    'gleis')`; die Rampe ist über `rampTrackAt`/`trackAt` Teil des Netzes (`railRampTrack`: Arme nur in Achsrichtung), eine Schiene darauf gibt es
    nicht, eine Linie (Pinsel) längs über sie zählt ihre Felder als schon gebaut (`planCheck`), quer ist sie rot (`planScan`). Über die Kante endet
    ein Gleis am Prellbock. Fußgängerbrücke über einen Bahnübergang nur mit ebenem Boden gleicher Höhe längs des Wegs (`archHillError` in
    setCrossing/placeError); daneben ändert sich die Höhe nie (`archAround`: Anheben, Abtragen, Treppe, Gleis-Rampe). Halte nur
    über `stopTrackOk` (eigene Ebene, nie auf der Rampe); Bahnhof richtet sich nicht zur Schiene oben aus (`autoRot`). Tunnel unter einer Anhöhe
    ja (die Einfahrt prüft nur vorn die Ebene), unter der Rampe nie (ein Feld ist Gleis oder Tunnel). Gleise oben zeichnet tileA wie Wege
    (`hillFlat` → `drawHillFlat`; zur Rampe nur `GR_E` über die Feldgrenze, sie ist schräg).
    **Züge** (movers.js): oben um den Hub angehoben, auf der Rampe stetig (`surfaceHeight` unter beiden Wagenenden, starr und schräg).
    `trainOnHills` (render.js, nur auf Anhöhe/Rampe, sonst Mittelfeld wie bisher) wählt das vorderste Feld unter dem Wagen und setzt `m.hill`
    (`base`, `ha`/`hb`, `occ`: früher gezeichnete Anhöhen davor = Ausschnitt, `ramp` → danach `rampOverSpan`/`drawHillRampOver`: Streifen des
    schmalen Einschnitts bzw. Brüstung des Viadukts über den Wagen – im Einschnitt nur seine sichtbaren Flächen, nie der Umriss: darin lagen Boden
    und Gleis, die dann über der Anhöhe davor standen). Schatten der Wagen auf Damm/Viadukt ohne die Streifen neben der Oberseite
    (`rampShadowClip`), sonst hängt er an ihrer Wand. Antippen: `trainAt` (tap öffnet das Fenster des Gleisfelds unter dem Zug).
    Treppe in die Anhöhe hinter dem oberen Feld einer Gleis-Rampe: nie (`stairIntoError` fragt `rampsAround` wie umgekehrt `rampIntoError`).
    Nahaufnahmen aller Formen/Drehungen mit Zug: tools/gleisrampe-pruefung.js (→ tools/vorschau/gleisrampe-nah-final.png).
    **Bergportal** (157m, `bergportal`, hills.js unten; Entwurf tools/bergportal-entwurf.js): Ding auf dem Randfeld P (Feld bleibt Anhöhe, oben frei),
    `t.rot` in die Anhöhe (STAIR_UP: F = P − d davor, Tunnel auf P + d), `t.form` 0 Steinbogen / 1 Öffnung. Gibt es welche: `bpOn()` (Zähler `p` in
    `rampFresh`) – ohne sie keine einzige Abfrage mehr. Regeln `bpError`/`bpDirs`/`bpRot`, Fuß frei `bpFronts` (Anheben, Teich, Treppe, Gleis-Rampe,
    Linie, ↶), nie getragen/kopiert. Netz nur über `trackLink` (`bpLinks`), `trackAt`, `railArmsHill`, `computeRail`. Gezeichnet im Bildchen der Anhöhe
    (`paintBergportal`, Schlüssel `bpSig`), nur an +y (rot 0) und +x (rot 3); `drawObject` zeichnet nichts. Wagen: `bpCut` (aus `trainTunnelCut`) →
    mit dem Feld F, `drawCarPortal` (Stück im Berg nur durch die Öffnung, gedunkelt; dann das Stück draußen). Wer Neues an diese Wand malt, lässt die
    Öffnung frei. Abgeschnittene Wagen (`car.cut`, auch Tunneleinfahrt): Fenster/Dach wie am ganzen Wagen, am Schnitt abgeschnitten, Schnittfläche ohne Stirn.
    Die Tunneleinfahrt ist nur noch die Rampe (Portal-Formen 11.10.2026 entfernt, `parseSave` löscht `form`). Test: bergportal.
    **Wer kommt wohin:** nur über `levelLink(x1, y1, x2, y2, who)` – 'weg' (Wegenetz, Viertel, Markt, „alle verbundenen“, Wunsch Weg) und 'fuss'
    (Bewohner, `edgeBlocks`) gehen über die Treppe längs ihrer Achse (sie verbindet das Wegenetz, `slopeWegAt`, zählt nicht fürs Viertel; quer nur in
    der breiten, Ecktreppe über ihre Füße), 'gleis' nur über die Gleis-Rampe, 'fahr' nirgends hinauf; sonst nur gleiche Ebene, nie über Eck an
    Rampe/Treppe. Die Gleis-Rampe gehört zu keinem Viertel und zählt für keine Gegend: Erreichbarkeit „in der Nähe“ `hillRegions`/`sameRegion`
    (Anhöhe ohne Treppe = eigene Gegend). Bewohner, Spaziergänger (`hwFresh` nur Treppen), Leute zur Dachtreppe und Tiere betreten sie nie
    (`walkable`/`wayish` ohne Rampe; `slopeAt`/`flatGround` kennen sie, damit Tiere und Parkbesuch sie meiden). Ohne Anhöhen immer true.
    Figurenhöhe: `figUp`/`slopeUp` (movers.js, am gezeichneten Fußpunkt) – wer `w.up` selbst setzt (Dach, Spaziergänger), rechnet relativ zum Feld.
    **Wege oben** zeichnet tileA (`hillFlat` → `drawHillFlat`, weit weg `spriteFlat(…, true)`), nie das Boden-Bild. `pathArms`, `pathQuads`,
    Bordstein, Wegenden (`hillEnds`), Vorplätze und Gartenwege (`courtFrontTiles`, `gardenPath`) nur über `levelLink` bzw. gleiche Ebene.
    Tests: gleisrampe, gleisrampe-kritik, rampe-regeln, gleis-ebenen, gleis-zeichnen, zuege-ebenen, anhoehe-netz, anhoehe-wege, anhoehe-bewegt, anhoehe-pruefung,
    anhoehe-stufe2 (Gesamtprüfung: jede Form in allen Drehungen mit echtem Zug zwischen zwei Bahnhöfen, ↶, Speichern, Zeichnen nah/weit/nachts).
    **Brücke zwischen Anhöhen** (Block 160, js/bruecken.js): eigenes Bauwerk in `state.bruecken` (Anker → { ax, n, art, weg?, gleis? }), Deck auf
    HILL_H über der Lücke, der Boden darunter bleibt in state.tiles. Nachschlagen nur über `bkAt`/`bkOnHill` (gemerkt je `groundVersion` – wer
    Brücken-Objekte ersetzt, auch ↶, zählt `groundVersion` hoch). Je Brücke **Weg ODER Gleis** (`bkRailAny`/`bkWegAny`; `gleis`-Form 0 = Schotter,
    also `!= null` prüfen); Stützen/Böcke auf den Kachelkanten (160c C1, unten). Das Deck hat **keine Feldschlüssel**: das Gleisnetz verbindet
    die beiden Endfelder direkt (`bkRailJumps`) – wer das Gleisnetz durchläuft (computeRail, railPath, railLoop, railNetworkHill), nimmt die
    Sprünge mit; Strecken merken sich das Stück übers Deck (`railPolyline` → `route.deck`, Richtung per `Math.sign`), Wagen darüber `car.deck`.
    Gezeichnet werden sie in Stücken je Feld (`bkCarPieces`, `car.cut`): übers Deck im Rückruf von `bkDrawTile` (nach der Oberseite, vor dem
    vorderen Geländer), auf der Anhöhe mit ihrem Feld. Tests: bruecke, bruecke-gleis; Bilder: tools/bruecke-pruefung.js, tools/bruecke-gleis-pruefung.js.
    **Brückenfamilie** (160c, PLAN-160c.md, plan-160c/): Aussehen jeder Brücke nur über `brLook(o, at)` (Altfelder über `brLegacyLook`; neues
    Format = gültiges `brp` samt Kennung `k = brSig`, gelesen über `brIsNew`, geschrieben über `brStamp`), Geld über `brPrice`/`brPaid`.
    **Mischform:** keine Brücke zieht um – Wasser-Weg/-Gleis bleiben Kacheln mit `bridge`, die Fußgängerbrücke ein Schalter am Übergang
    (`cross`/`foot`/`footPaid`), die Brücke zwischen Anhöhen ein Bauwerk in `state.bruecken`; einheitlich ist nur, was man sieht, wählt, bezahlt.
    Altfelder behalten ihren **alten Wortschatz** (`brk` nur holz/stein/ziegel/rot, neu geschrieben nur holz/stein; `footPaid` nur
    true/holz/stein/weg/kristall), Kacheln werden beim Laden nie umgeschrieben. Bezahltes steht in `brp`, **nie in `price`** (das ist der
    Einkommenspreis der Gebäude). **Preis = Erstattung des Rückfalls in älteren Fassungen (v951/v1016) + Aufschlag** – so erstattet ein altes
    Gerät nie mehr als bezahlt (Test je Kombination). Die Familie (Bahn flach / Fußgänger Bogen) folgt aus dem Inhalt, nie gespeichert.
    **Nachmal-Schema:** Ruhendes in tileA (GL-Standbild, weit weg Bildchen), in tileB nur die deckenden vorderen Lagen im Rahmen des Bewegten,
    Glas genau einmal in tileB.
    **Stützen** nur über `brSupports`/`bkSupports` auf Kanten k (zwischen Feld k−1 und k, nie an der Wand; Stein `brSteinPier`: je 2 Felder von außen, ungerade ab 5
    Mittelbogen 3 Felder; Länge bis `BK_MAX` 8 = Lesegrenze `BK_READ_MAX`, nie darüber); was stört, sagt `bkEdgeBlocker`
    (Weg/Gleis längs hinüber, Linie auf der Kante, Deko an der Seitenmitte) – Weg und Gleis quer durch die Feldmitte bleiben frei; alter Stand
    mit Linie auf der Kante: Stütze nur nicht zeichnen (`bkSupportsShown`), nie Daten löschen. **Höhe des Decks** nur über `bkH`/`brDeckHFn`
    (Fußgänger = Bogen, Gleis ⇒ flach; t am Anker über `bkT`) – Maler, Weg (`bkWegPaint`, `paintLook(…, sub)`), Spaziergänger (`hwTopH`,
    am Fußpunkt; `w.up` gilt relativ zum Feld `round(px, py)`), Antippen (`bkPick`), Plan-Rauten, Schilder, Schatten, Rahmen (`brBox(gr, c)`).
    **Zeichnen** (brueckenbild.js): Lagen h/v/d/o; ruhend in tileA (`bkDrawStill`: Deko hinter, h, Bahnübergang, Deko unter, vd+o, Deko vor),
    tileB malt nur im Rahmen des Bewegten nach (`bkDrawMoving`/`bkRedo`; Folge je Querlage `bkMoverClass` am Fußpunkt: dahinter, h, darunter, vd,
    Deck, o, davor; `GLOW_MUTE = 'pane'`: nur Scheiben neu stanzen, nie einen zweiten Schein), weit weg Bildchen `br|x,y|gruppe|FOG` (mit Lampen `…|lit`). Wer Wege/Gleise
    mehrerer Felder auf einmal prüft (Ziehen, Gruppe), meldet sie in `BK_PLAN_SAME` bzw. `BK_GROUP` – sonst rutschen sie längs durch eine Stütze. Im
    Fußgänger-Maler (`bkPaintFuss`) Längsstriche `lineCap 'butt'`, Dinge auf Kanten halboffen (`onEdge`), nur deckende Farben (Mischfarben).
    **Stein** (160c C3): Geometrie nur über `bkGeom` (je Brücke in `bkFresh` als `c.G`: Maler-Art, Familie, Pfeiler) und `brStoneGeom`
    (Bögen zwischen Wand und Pfeilern, Leibung `ri` glatt über `brSmin`, `low`, `pierHit`); Lichtraum `brClear(S, t, r)` (−1 am Pfeiler, gilt für
    jede Steinbrücke) in `bkTooTall`/`bkUnderError(x, y, G, i)`; `bkPick` trifft Stirn und Pfeiler bis zum Boden. Maler `bkPaintStein` (gemeinsame
    Helfer `bkKit`): Stirn als Band, Laibung/Pfeilerseite nur wo die Sehne steiler als TH ist (keine hintere Stirn; an der Wand kein Widerlager – Nutzer: Felswand sichtbar), Boden je Feld
    `bkGround` (Wasser −6,3), Tunnelschatten in `drawBkShadows`. Wächter-Test „Holz/Metall/Bahn aufrufgleich“: nie einfach neu setzen.
    **Kristall K1** (160c C4): Glas in eigenen Lagen – `hg` (hintere Scheibe, ruhend in tileA, nie nachgemalt), `t1` (Glasband, Zacken) und `t2`
    (vordere Scheibe, Pfosten, Handlauf) jedes Bild genau einmal in tileB (`bkDrawMoving`, auch ohne Bewegtes; GL: `brLiveTiles`), nie in `bkRedo`.
    Glasfarben nur über `rgbaK` (Nebel auf Hex, dann rgba), Glas nie ins Nachbarfeld (ohne ext). Zacken: Nummer ab dem Anker, Spitze ≥ `brClear()`.
    **Bahn** (160c C5): `bkPaintBahn` (Holz: Böcke an jeder Kante, Kreuz hinten; Metall/Kristall B2: Fachwerk 2n Felder) – auch der Rückfall ohne
    Familie; Stein-Viadukt über `bkPaintStein` mit Pfeilern an jeder Kante (Nutzer: Variante B), Lichtraum folgt den Bögen. Gleis auf eine Steinbrücke
    prüft neue Pfeiler und die flacheren Bögen. **Züge unter einer Brücke** in Stücken (`brCarPiecesUnder`: Feldkanten längs, quer bei s = −½/+W/+½;
    Klasse `bkCls` U/F; Schatten nur das hinterste Stück, `car.shadow`).
    **Licht** (160c C7): Orte und Formen nur aus `brLampSpots(art, fam, n)` (Maler, `brBox`, Bildchen). `bkLamps` malt am Ende der Lage (hinten
    nach dem Deck, vorn zuletzt; Kristall-Streifen hinten in 'h' bzw. B2 in t1, vorn t2 – Blau hat keine Scheibe, nie nachmalen; B2 mit Licht
    läuft darum wie K1 in tileB, `bkTileBAt`). an/aus/dunkel erst zur Malzeit (`opts.licht`, `opts.dark` aus `T.rail.power.dark` 'B'+Anker);
    `dark` nie in den Bildchen-Schlüssel (recalc zählt `groundVersion` hoch). Nur Gruppen mit Lampen (`bkLampGroups`) bekommen `|lit` und
    `prewarm`. Blass ohne Schein (`GLOW_MUTE = true` in `bkGroup`). Kaufen/an/aus über `brSet(…, { licht })` (+ `recalc` wegen Strom);
    Strom in `computePower` **nach** den Zügen, je Feld wie eine Laterne – bestehende Welten verlieren nichts.
    **Brücke per Linie** (160c C9): Weg-/Gleislinie oben von Anhöhe zu Anhöhe → `bkPlanNew` (Lücke über `bkGapAt`, Look aus der Brücken-Leiste
    `bkLookNew`, Merk-Kennung `bkNewSig` im planInfo-Schlüssel). Geprüft an **gedachten Zellen**, nie mit einer Probe in `state.bruecken`:
    Prüfzelle leer (sonst „schon da“/0 Taler), Zeichenzelle (Geist, `ghost: true`) mit Weg bzw. Gleis. `bkWegCheck`/`bkRailCheck` nehmen dafür
    eine Zelle als 3. Parameter. Auftrag `bkBuild` vorn in `order` (volles Geld), Deck danach; ein ↶. Geht sie nicht: Lücke rot, Grund `bkErr`
    im Schild; still unten bei > `BK_MAX`, Rampe/Treppe, Knick, kein Gegenüber, Brücke schon da. Geist: `PLAN_GHOST` → `bkDrawGhost`
    (Zwischenleinwand `ghostPaint`, 65 %, ohne Licht), Antippen in der stehenden Vorschau über `bkPick`.
    **Schiffe** (160c C10): `seaCross` kennt `bkAt` – unter einer Anhöhen-Brücke über Wasser nur quer (Stützen/Pfeiler stehen auf Kanten längs),
    `seaBridgesCheck` zählt ihre Wasserfelder mit (Seewege neu bei Bau/Abriss), ein Anleger darunter startet dort (nur quer hinaus – nie
    `nearestWater` daneben, sonst geht das erste Stück längs unter dem Deck), `natureAt`: keine Fische/
    Möwen daneben. Boote vor der Stirn (s > BK_W) zeichnet `bkMoverClass` als F. Hängt die Durchfahrt einmal von Material oder Stützen ab,
    braucht `brSet` ein `recalc` (Signatur).
    **Wasser-Wegbrücken** (160c D1): dieselben Wege wie oben mit dem Brückenfeld `wbAt(x, y)` (`water: true`, `A` = Bogen, `W` = EDGE_W,
    `hm`, `G` = wbGeom; gemerkt je groundVersion) als letztem Parameter (`bkGroup`, `spriteBridge` → `wb|…`, `bkRedo`, `bkDrawLagen` → `wbPaintLage`).
    Modelle (D2, abgenommen D0): `wbArgs`/`wbPaintLage` mit den Bausteinen der Anhöhe, quer gestaucht auf EDGE_W (`sq`), nie unter `WB_WATER`;
    gedachte Felder an offenen Enden nach Gelände, Rampe nur zur Wegkachel; Mauer/Durchfahrt aus dem Aussehen der Spanne (`bridgeArch().wall`);
    flache Wasserbrücken sperren Boote (`seaCross` 'block'). Am Brückenende längs der Achse nie eine Anhöhe (D4: `wbEndAt` in
    `hillRaiseError` und im ↶, `bridgeShapeError` für die Gegenrichtung) – sonst endete die Brücke an der Wand, ohne Anschluss. Den alten Maler `drawWegBridge`/`BRIDGE_LOOK` gibt es nicht mehr (D3i).
    **Bauen/Fenster** (D3): Aussehen nur über `brSet({ at: 'wasser', x, y }, änderung)` → `wbSet` (ganze Spanne, Bilanz null, jedes Feld behält
    sein Bezahltes); Felder immer aus dem Aussehen schreiben (`brWriteLook`, Farben roh – alte Rote/Ziegel fallen ohne brc auf die Art zurück),
    nie Rohfelder kopieren; `brk` ist immer eine bekannte Art (ältere Fassungen). Neues Feld: Aussehen der längsten Brücke daneben **vor** dem
    Setzen (`wbNewSpec`, samt gekauftem Licht/Zacken), sonst Leiste (`wbLeisteLook`: Holz = Wegstil). Zusammenwachsen: `wbUnify(x, y, spec)` (das
    Aussehen der längeren Brücke gewinnt, kostenlos; ohne spec das häufigste). Die Art `brk` je Feld nie teurer als bezahlt (`wbSafeKind`,
    Farben dazu `wbRawFor`): ältere Fassungen erstatten nach `brk`, nicht nach `brp`. Plan-Preis = Abbuchung (`BR_PLAN_N`: geplante Nachbarn
    zählen in `wbNewSpec` mit). Licht: Strom `'W' + Anker` (Anker nur mit Licht, gemerkt in `brSpanCache.anch`). Seeweg gekappt: `seaRoutesNow`/`seaRoutesWarn` vorher/nachher –
    auch wenn Brückenfelder verschwinden (Abriss, Aufschütten, Aufnehmen, 🗑️: der Rest kann flach werden, `seaRoutesWarn(…, true)`); Vorher-Stand
    beim Aufnehmen in `moving.sea0`; Einzeltipp in `build`/`demolish`, Linie und Rechteck nur in `runPlan` (im Batch nie doppelt, 160c G2). Geist beim Ziehen
    und Tragen über gedachte Felder (`wbVirtual` – state.tiles kurz ergänzt, nie recalc dabei; die Merker der echten Karte sichert es samt Map-Objekten
    und setzt sie danach wieder ein); je Brücke eine Leinwand bei ihrem letzten Feld (`wbGhostGroups`), nur der sichtbare Teil, nie im Nebel;
    stehende Vorschau gemerkt (`ghostPaint(…, ghostKeep(id, src), ghostKeyNow(R))`, frei über `ghostKeepSweep`). Umfärben einer Brücke ist keine
    neue Brücke (kein Schild, kein Geist). Kristall-Glas über Booten: `WB_GLASS_LATE` zählt die Boote je Feld, das letzte malt.
    Nie im Boden-Durchgang (`liveFlatSet`/`worldGround` lassen sie aus). Ruhend eine Gruppe `w` (= h+v+d+o, ein Bildchen, nichts dazwischen auf
    dem Wasser), nachgemalt je Lage; nie blass. Deckhöhe nur über `wegDeckH(c, a)` (Maler, `wegBridgeLift` für Figuren/Kopf/GL-Rahmen,
    Plan-Rauten/Rahmen über `deckMark`). Leute dort immer auf dem Deck; Boot darunter: Bogen vd nachmalen (mit Stütze an der Anfangskante Schnitt `WB_START_CUT`); frühere Felder über
    dem Boot `boatUnder` (nur schon gezeichnete) → `bridgeOverBoat(k, z, now, m)` im Bootsrahmen, danach Block 112 (`boatOver`).
    **Gleisbrücken übers Wasser** (160c E1, plan-160c/karte-E1.md): Brückenfeld `gbAt(x, y)` (`rail: true`, Höhe 0, `G` erst ab E2; Merker
    `gbCache` auch je Feldzahl), ruhend in tileA als Gruppe `w` (Bildchen `gb|x,y|w`), nie im Boden-Durchgang. `drawRailBed(…, lagen)`: h/v
    Pfähle hinten/vorn, d Deck + Gleis + alle Geländer außer dem vorderen gerader Felder, o dieses (`gbHasO`; Kurve/T/X ohne o bis E2).
    Nachmalen immer live (kein Bildchen je Lage). Wagen über Feldkanten in Stücken (`gbCarPieces`: Schnitt ≥ 0,01 vor den Enden, sonst gälte
    die Stirn als Schnitt; schräg ganz ins späteste Feld; Portal: `gbLatestUnder`), Schatten je Stück auf seiner Feldraute. Wagen auf dem
    Deck vor o; Boote darunter: frühere Felder direkt nach dem Boot (`gbBoatOver`: h+vd, Block 112 ohne Stücke früherer Felder, o), Licht
    von Booten unter dem Deck in eigenem `glowCells` (sonst nähme es dem Scheinwerfer die Stärke, Block 84d). Nachtschein früherer Lichter:
    `gbRelight` nur auf der Deckfläche, Lichter über `glowsIn` (Raster der Mitten), beim Nachmalen nur mit vd.
    Modelle (E2): `gbAt(x, y).G` (Aussehen der Spanne `brSpanLook`, gerader Lauf `gbRun` je Boden-Fassung gemerkt, `sax` null = Eckpodest),
    Maler `gbPaintLage` (Striche je Farbe in einem Pfad – Leistung). Setzer `brSet({ at: 'gleis', x, y })` → `gbSet` für `brRailSpan`
    (kein Rückfallfeld nötig: ältere Fassungen erstatten fest `BRIDGE`, alle neuen Preise liegen je Rohstoff darüber). Neue Brücke ohne
    Nachbarn: Leiste (`gbLeisteLook`), Holz ohne Farbe bleibt im alten Format. Licht: Strom `'G' + Anker`. Gerade gesetzte Gleisfelder vor dem
    Angleichen in `COVER` eintragen (`build`, `dropAt`, `dropGroup`): `railArms`/`brRailSpan` lesen COVER, recalc kommt erst danach – sonst
    findet `gbUnify` nur Einzelfelder (160c G2). Gruppe ablegen: je Spanne einmal angleichen. Planen: echte Spannen, an die ein geplantes
    Feld wächst, gelten in `BR_PLAN_REAL` schon angeglichen (Vorschau = Abbuchung). **Eckpodest** (Kurve/T/X, Nutzer 16.10.2026): Umriss nur
    über `gbPodest(arms, voll)` – Ecke = Viertelring um die Feldecke (Deck folgt der Gleiskurve), sonst Innenrundungen und Ränder am Stück;
    `voll` (Brücke schräg daneben, Doppelgleis): Deck bis in die Ecke. Geländer auf den Zügen (`zuege`), an der Feldkante keine eigenen Pfosten
    (dort stehen die der Geraden). Prüfbilder: `tools/ecken-pruefung.js` (alle Richtungen, je Material). Wegbrücken übers Wasser bleiben gerade.
    **Fußgängerbrücke am Übergang** (160c F1, Entwurf F0 `tools/uebergang-entwurf.js`): Form aus Block 148 bleibt (`archH`, Spanne ±0,9, Rampen
    ab 0,46 massiv, `ARCH_CLEAR`), Maler `ubArch` (brueckenbild.js) mit den Bausteinen der Wegbrücken; Bogen über dem Gleis `ubRi` (über den
    Wagen ≥ 16). Aussehen nur über `brLook(t, 'uebergang')`; Setzer `brSet({ at: 'uebergang', x, y })` → `ubSet`, Bau über `setCrossing`
    (neues Format: `footPaid` nur Rückfall holz/stein/kristall – nie ein neuer Wert, Metall = holz + `brm`). `brl: 'nein'` = ohne Licht, wo der
    Rückfall kristall Licht ohne Aufpreis hieße; der alte Kristall leuchtet ohne Strom, sonst Strom `'U' + Feld`. Zeichnen in Teilen: `unten`
    hinten jetzt, vorn nach den Zügen (`afterMovers`), `oben` (vorderes Geländer) nach den Bewohnern – bis b 0,5 auf dem Übergangsfeld, den
    Rest auf dem Wegfeld davor (`archRails`, im GL-Bild live über `archFrontTiles`). Auf Anhöhen zieht `hillPre` die Felder davor vor; Wagen über
    der Feldkante in Stücken (`ubCarPieces`); keine Linie auf der Rampenkante (`archRampEdge`; getragen/kopiert `archRampLined` am Ziel, Gleisrichtung
    aus den mitkommenden Schienen – `placeError(…, { rail })`). Striche gebündelt (`brBatched`: wer `g === ctx`
    vergleicht, nimmt `gNow()`).
29c. **✨ Sternstaub** (Block 161, js/sternstaub.js, PLAN-161.md): seltene Zweitwährung nur für Schönes. Gutschriften nur über
    `sdAdd(n, key)` – einmalige mit Schlüssel in `state.sdGot` (nie doppelt; `sdCheck(true)` zahlt beim Laden still nach). Neue
    Quellen: Menge in `SD`, Zeile in `SD_SOURCES`. Schatzkammer nur über `sdBuy` (Tageskurs `sdTreasury`, Kalendertag `sdDay`, nur
    vorwärts); läuft nie über ↶ (sonst kämen die Taler zurück), ruft `cloudTouched`. Anzeige `sdHud` (Pille ab 481 px, sonst Zeile im Lager).
    Basar (161h): Waren-Karten nur über `basarCard`, Sammlung über `sdSammlung` (fehlt = „Sternengarten“). 👁 Ausprobieren = `sdTry`:
    `available` sagt ja, `tap` setzt nur die Vorschau um, `setTool` mit anderem Werkzeug beendet es (`sdTryClear`); Kaufen über
    `sdTryBuy`. Basar-Waren stehen nicht in „Neu freigeschaltet“ (`unlockKeys`), der Kauf meldet sich selbst. Neue private
    Basar-Felder (`sdNew`, `sdOffers`, `sdWish`, `sdWishNote`) auch in `LIVE_PRIV`. Angebote nur über `basarOffers` – die Auswahl
    des Tages/der Woche bleibt gemerkt (`state.sdOffers`), Gekauftes bleibt bis zum Wechsel stehen, nichts rückt nach.
    **sternstaub*.js stehen in index.html VOR main.js** (main.js lädt den Spielstand beim Einlesen): sonst kennt parseSave die
    Sammlungs-Waren nicht und wirft Gekauftes weg (Generalprobe 19.10., tests/sternstaub-laden.test.js). Gilt für jede Datei, die
    ITEMS ergänzt oder Spielstand-Felder liest.
    Jeder Spielstand trägt `appVer` (= ?v= aus index.html, `APP_VER`); ist ein gelesener Stand neuer, setzt parseSave `newerBlock`:
    kein save, kein Hochladen, Fenster „Neue Version da“ (`showNewer`). Neue Schreibwege in die Cloud/den Speicher prüfen `newerBlock`.
29d. **Zeichnungen prüfen, bevor der Nutzer sie sieht** (21.10.2026, Nutzer: „wieder haufen Fehler drin“): jeden Entwurf groß (≥ 3×) rendern
    und abhaken – Symmetrie zur Blickachse; keine überlappenden Kanten (Sockel, Säulen, Hecken, Bögen); nichts schwebt (alles steht auf
    etwas, Teile sitzen aufeinander); nichts steht im Weg oder verdeckt die Vorderseite; Maßstab zu Laterne/Figur/Haus; Licht von links
    (linke Flächen hell, rechte dunkel); glaubhafte Formen (Tiere, Figuren, Pferde – lieber weglassen als schief); Muster und Fenster
    liegen in der Ebene ihrer Wand (über K.P/Flächenpunkte, nie freihändig schräg); nachts leuchtet nur, was eine Lampe ist. Danach schaut
    ein Prüfer-Agent mit derselben Liste auf die großen Bilder; erst dann zeigen. **Große Bauwerke (Monumente) bringen keine Deko mit**
    (keine Laternen, Bänke, Beete, Hecken, Bäume, Boote, Wege) – nur das Bauwerk mit festem Sockel; das Drumherum gestalten die Spieler.
29f. **Belohnungen und Freischalten** (Block 163, PLAN-163.md): ✦ Meisterstücke kosten nur ✨ (`designStardust`; designPrice/designIdeas
    sind für sie 0), übrige Kunstakademie-Stücke `DESIGN_SLOW`-mal so lange Einkommen. Fenster-, Brücken- und Flaggenfarben: je 3 frei
    (`winOk`, `flagColOk`, `lookOk('bruecke','col',i+1)`), Verbautes bleibt frei über `keepUsedColors` beim Laden (beliebig oft).
    Auswahlen zeigen nur Freies plus die gerade gewählte, dazu „🎨 Mehr … freischalten“. 📜 Baupläne (`bpPick`/`bpGive`): Truhe → ein
    gesperrtes Nicht-Meisterstück + ein Viertel der Beute; je 3 neue Erfolgssterne einer (`state.bpStars`, alter Stand: ab jetzt, nichts
    nachreichen). Achtung Name: `flagOk` gibt es schon in friends.js (Freundesflagge).
29g. **Besondere Stücke** (Block 164): Perlmutt = `ROOFS[ROOF_PEARL]`; K.block legt dann `pearlGrad` über alle Dachflächen (PEARL_STOPS,
    PEARL_ALPHA) – Dächer, die nicht über K.block entstehen, zeigen nur die helle Grundfarbe. Nicht im Album „Farben“, nie Zufallsfarbe.
    Glitzerwege: Wegmuster `kind: 'glitter'` (feine Punkte wie Kies, Farben aus GLITTER) und Funkel in render.js (`glitterSparks` nach
    worldGround, nur `glitterOn(z)` und nicht in GL-Bildern; Plätze `glitterSpots()` je groundVersion aus hash, auf dem Wegband über
    pathArms/armUV). Kosten ~0,15 ms je Bild bei 40 Feldern. Nicht auf Anhöhen und Wasser-Wegbrücken (tileA malt darüber).
    Wandschmuck, der bis zur Wandoberkante reicht (Fachwerk), gehört in `K.block({ wallDeco })` – vor dem Dach, sonst ragt er über die Traufe
    (Fehler 22.10., auf Perlmutt gut zu sehen).
    Dachglitzer: `t.rglitter` (silber/gold/perl/regen, nur wirksam bei `t.roof === ROOF_PEARL`, Auswahl = gekaufte Glitzerwege). Die Dachform
    merkt sich K.block beim Zeichnen in `ROOF_GEO` (WeakMap je Feld, über `DRAW_TILE` aus drawObject); `roofSparks` malt direkt nach dem
    Gebäude (Bildchen oder live) – so liegen Funkel unter allem, was davor steht.
29e. **🏛️ Monumente** (Block 162, js/monumente.js, PLAN-162.md): Bilder in MON_ART (aus tools/monumente-voll.js übernommen – Änderungen
    zuerst dort zeigen, dann hierher). Wahrzeichen (`monPhases`) sind Baustellen wie die Wunderwerke, aber eigene Logik (monSite/monStep/
    monCost/monPaid), kein Eintrag in WONDERS (der hätte Wirkungen, „gibt es schon“ und das Rathaus). Gerüst gemeinsam über `siteScaffold`
    (draw-wonders.js). **Hohe Dinge brauchen `ITEMS[id].h`** (Höhe über dem Boden bei Zoom 1) – spriteTop schneidet sonst beim Rauszoomen die
    Spitze ab. Baustellen zählen keine Schönheit (beautyOf, placeStats, beautyAround). `wet: true` = darf auch ins Wasser (Sternenleuchte).
    Wahrzeichen sind nie im Tagesangebot/Katalog (`mon` in SD_SHOP), nur im Reiter Monumente (monOfMonth); Prachtstücke sind normale
    Seltene. **Baumenü zeigt nur Gekauftes** (Nutzer 21.10.2026, wie Animal Crossing): Gruppen ✨ Sternenbasar und 🏛️ Monumente sind Getter,
    leere Gruppen blendet renderTools aus; Schaufenster ist der Basar, Ziele zeigt das Sammelbuch („???“). Ein Kommentar `//` mitten in einer Zeile mit weiteren Einträgen verschluckt sie – drawObject fängt Fehler, darum prüft der Test
    `typeof MON_ART[…]`.
29f. **🎭 Opernhaus** (Prachtbau, Block 161f, js/oper.js): Bild `OPER_ART(K, stufe)` aus tools/prachtbauten-entwurf.js (`semper`, Änderungen
    zuerst dort zeigen). Einmal im Spiel über `ITEMS[b].unique` + `the` (placeError, kein Kopieren); Stufe = `t.lvl` (1–3), Ausbau per
    `operUpgrade` (nur Taler, `OPER_STAGES`), Schönheit ×Stufe, Abriss gibt alles zurück (`operPaidUp`). Wirkung: **Lied** (`OPER_LIED`,
    Hörprobe tools/insel-lied.js): Spalten x − y = Schläge, nur Dur-Fünftonleiter, Motiv je Takt nach dem Häufigsten, nur die Insel des
    Opernhauses (`regionAt`). Klang nur **Spieluhr** mit weichem Bass (Nutzer 22.10.2026: gezupfter Kontrabass klang „scheiße“; Vibraphon/Harfe
    nicht gewollt). Lied und Bauklänge in jeder Stufe **nur Spieluhr** (Ausbau = schöneres Gebäude + 🌸). `operPlay` hängt einen eigenen Ausgang an `audio()` (Ton aus → Hinweis), der Streifen ist eine eigene Ebene über dem Spiel.
    **Bauklänge** (`operTone(x, y, phrase)`, Nutzer: Lied als Dauermusik „zu unruhig“): steht das Opernhaus, ersetzt der Ton der Stelle den
    Bau-/Deko-Klang (build, buildSmall), Ausbauen (stageUpgrade, houseUpgrade) spielt den Takt statt `star`. Liefert false → gewohnter Klang. Immer nur Spieluhr, ohne Bass/Harfe je Stufe
    (Nutzer: „Stufe 1 klingt viel cooler als 3“).
29g. **🏛️ Glaspalast** (Prachtbau, Block 161f, js/glaspalast.js): Bild `GLAS_ART(K, stufe, { stueck })` aus tools/prachtbauten-entwurf.js
    (`grandpalais`, Änderungen zuerst dort zeigen; Halle, Steinflügel mit Balustrade, Vordach mit zwei Säulenreihen). 4×3, einmal, Stufen
    wie das Opernhaus über **`ITEMS[b].prachtStages`** (gemeinsam: `prachtNext`, `prachtUpgrade`, `prachtPaidUp` in oper.js, Knopf
    `p-pracht-up`). Ab Stufe 2: Kuppel = Vitrine mit `t.stueck` (gespeichert in tileOut, im Bildchen-Schlüssel), Auswahl `glasChoices()` = nur
    Seltenes zum Herzeigen: im Basar Gekauftes + freigeschaltete Stücke aus 🏆 Besonderes (Pokale für Erfolge …), bis 3×3 (Nutzer: „ein Haus
    da oben drin ist doch stupid – eher mit raren Dingen flexen oder mit Erfolgen“). Zeichnen: Glastonnen-Rippen
    als `strip`-Rückruf je Streifen (sonst fehlten sie am Rand oder schienen durch); Vitrinen-Gerüst erst hinten, dann Stück, Glas, vorn;
    Säulen, die auf der Linie anderer stehen, mit ihnen zeichnen (sonst liegen Kapitelle über dem Gebälk); Säulenfüße ≥ 0,07 von Wand/Kante.
29i. **🚆 Züge zeichnen (Block 166, movers.js):** Ein Wagen kommt mit dem Feld unter seiner Mitte (render.js `byTile`); die Felder einer
    Schräge werden von links nach rechts gemalt. Ragt ein Wagen längs x nach links oben ins vorige Feld, malte er über die Bäume vorn links –
    dieses Stück kommt mit dem Feld (T, y−1) (`trainBackPieces`, `car.cut`/`gbK` wie die Brücken-Stücke). Der Wagenkasten ist oben geschlossen
    (eine Fläche über C4 in Höhe H, Dach darauf) – sonst sieht man neben dem eingerückten Dach durch den Wagen (nur sichtbare Seiten werden gemalt).
    In der Kurve (Enden nicht auf einer Linie, `trainCarBend`) zwei Hälften ab der Mitte auf dem Gleis, mit Gehrung (`drawTrainCarBent`); nicht bei
    abgeschnittenen Stücken, Anhöhe, Portal. Schatten nur über `trainShadow` (Ellipse in Wagenrichtung); Stücke mit `noShadow` malen keinen eigenen.
29h. **🌿 Botanischer Garten als Gebäude + echter Garten** (js/botgarten.js): Das Wunder ist nur noch das Gebäude (2×5, Rotunde mit zwei
    Glasflügeln, `BG_ART`, Entwurf `botgartenNeu` in tools/prachtbauten-entwurf.js), steht direkt auf dem Boden – keine Platte, auch keine
    Steinkante („immer noch eine Platte, nur zurechtgeschnitten“). Den Garten drumherum legt `bgGarden(x, y, rot)` beim Bauen
    aus **echten Dingen** an (Nutzer: „wir haben doch alles da … nicht extra neu und viel zu klein gezeichnet“), Entwurf A: vorn Wegstück zur
    Tür mit Laternen, daneben Beete, Hecke dort offen; sonst Wiese mit Bäumen/Büschen, hinten Teich (Rundweg mit Beeten im Weg: „ergibt
    keinen Sinn“). Weg und Beete (`price: 0`),
    Bäume/Laternen als Kleinkram (`free`), Hecke als Kante (`free`, gespeichert in serialize **und** parseSave), Teich (`graben`) – nur auf
    freien eigenen Wiesenfeldern, kostet nichts, alles frei abreißbar ohne Erstattung. `t.bg2` = neuer Bau; alte Stände rückt
    `botgartenUmbau()` beim Laden in die Mitte ihrer alten Fläche und legen dort den Garten an (`growWonders` überspringt `bg2`).
    Andere Gebäude mit aufgemaltem Umfeld (Schloss …) sollen später genauso werden.
    **Riesenrad (3×3) und Sternwarte (quer 1×2) genauso** (js/wundergarten.js, Entwurf tools/wunder-garten-entwurf.js): `wonderGarden(b, x, y,
    rot, spec, edge, inner)` legt den Ring in jeder Drehung an (spec im Rahmen des Baus: vorn/hinten/links/rechts, Ecken der Felder als ±1),
    `t.g2` = neuer Zuschnitt, `wunderUmbau()` rückt alte Stände (5×5/3×3, vor v9 3×3/2×2) beim Laden in die Mitte. Riesenrad wie echte
    Riesenräder (Nutzer: „an der Realität orientieren“): Pflaster unter dem Rad über COURTS (Belag des Wegs davor, ohne Weg Kies), ringsum
    **breite** Wege (schmale ließen eine Graskante), Zaun um den Fuß, vorn Tor, Tickethäuschen in der Absperrung. Das Rad steht in **jeder**
    Drehung in der Bildebene – das Häuschen kommt darum je nach Drehung links oder rechts vom Tor (`rrKiosk`), sonst steht es an einem
    Standbein. Vor dem Zeichnen Abstände ausrechnen (Füße, Turmradius gegen Fläche/Institut), dann groß ansehen.
29b. **⚙️ Einstellungen** (js/settings.js, ☰ → Einstellungen): Schnellwahl Schön/Ausgewogen/Schnell (setzt nur Leistung),
    🔊 Ton, 👁️ Anzeige, 🚀 Leistung. Neue Schalter je Gerät in `GFX` (`setGfx`, localStorage `kachelhausen_anzeige`), ältere
    behalten ihre Schlüssel. Alles nur Bild: Einwohner/Tiere aus = unsichtbar, „immer Tag“ = `night` 0 im Bild (Spieluhr und
    Sternschnuppen rechnen weiter mit `nightAt`). Standard = wie vorher („Ausgewogen“). Neue Zeichnungen, die abschaltbar
    sein sollen, fragen `GFX.…` beim Zeichnen ab, nie beim Rechnen. Spielstand sichern/laden/neu: ☰ → 💾 (`showSaveMenu`).

30. **Motivation** (story.js): `GUIDE` (Tipps beim ersten Mal, `watchTips`), `ACHIEVEMENTS`/`RANKS` (Erfolge → ⭐ →
    Ehrennadeln → Pokale, `ITEMS[].rank`), `ALBUM` (volle Seite → Belohnung, `ITEMS[].album`/`STYLES[].album`).
    „Neu freigeschaltet“ entsteht automatisch aus `unlockKeys` (ui.js) – neue Dinge brauchen einen Eintrag in
    `ITEM_TIPS`. Belohnungen stehen nie selbst im Album. Beim Laden wird still gezählt (keine Fenster/Bänder).
    Eine einmal volle Seite behält ihre Belohnung (`state.legacy`); wer neue Dinge ins Album bringt, trägt ihre Schlüssel
    in `LATE_ALBUM` ein, damit alte Stände ihre Belohnung nicht verlieren.
31. **Wunderwerke** (`WONDERS` in story.js, Zeichnungen in draw-wonders.js): `cat: 'wunder'`, jedes nur einmal; Tile hat
    `phase` (0 = Baustelle … phases.length = fertig, `wonderDone`). Wirkung (`effect`) und Schönheit erst fertig.
    Abschnitt bauen: `wonderStep`. Baustelle zeichnet `drawWonder` (Gerüst, fertiges Bild von unten abgeschnitten).
    Seebrücke: `needs: 'pier'` (hinterstes Feld an Land, Rest Wasser). Schloss: `festival: true`, Titel.
    Preise immer über `wonderCost(t)`: `min` Minuten des besten Einkommens (`wonderBase(t)` = max(`t.rate`, `wonderRate()`),
    Block 37: `state.incPeak` inkl. haltbarem Warenverkauf `T.salesInc` – Wegschieben/früh Aufstellen spart nichts), mindestens `money`
    (letzter Abschnitt immer mindestens 1 Mio.).
    Bezahltes steht in `t.paid` (`wonderPaid`, alte Stände nach `OLD_WONDER_PHASES`). Größen seit v9: Riesenrad 5×5,
    Sternwarte 3×3, Botanischer Garten 5×5, Schloss 7×7 – alte Bauwerke wachsen beim Laden (`growWonders`).
32. **Wegübergänge**: Zwei Wegstile nebeneinander stoßen **bündig** aneinander – einer hört an der Feldkante auf, der
    nächste beginnt. Kein Strich, keine Schwelle, kein Überblenden (vom Nutzer so gewünscht, das Überblenden war falsch
    verstanden). Muster (`pattern`) liegen in einem festen Raster und lassen sich mit `ext` fortsetzen (Wunderwerke).
    Fußgängerbrücke: `footPaid` ist das Design (`FOOT_STYLES`; alte Stände `true` = Holz, `footPaidOf`).
33. **Strom und Züge** (`computeRail`/`computePower`): Kraftwerke `POWER_OUT` je Stufe ×1/×2/×3 (Windrad 1, Wasserkraft 4,
    Solarfeld 3, Geothermie 8, Wellen 5); Stufe 2/3 erst nach Forschung „kraftwerk2“/„kraftwerk3“ (`BUILD_STAGES`, `up.tech`);
    `powerOf` mit „rotor“ +50 % Wind, „stromnetz“ +25 %. Wunderwerke brauchen je 100 ⚡, das Schloss 300 (Energie-Insel). Verbraucher der
    Reihe nach: Laternen (je 10 eine ⚡, sonst `power.dark` → nachts aus, halbe Schönheit), dann `CONSUMERS` (Reihenfolge
    = Vorrang; ohne Strom `power.idle` → alles halb über `off(k)` in `totals`, ⚡-Symbol; Wunderwerke erst fertig),
    zuletzt Züge (`carNeed`: (1 + 1 je km) × Wagen / 2 – die Regionalbahn mit 2 Wagen wie `trainNeed`). Die Stadt braucht erst Strom, wenn es Kraftwerke gibt oder Windräder frei sind.
    Kraftwerke haben `cat: 'strom'` (Album-Seite Gebäude, Menü-Filter „⚡ Strom“). Wellenkraftwerk `needs: 'meer'`
    (Meer vor eigener Küste, Feld wird per `claimTile` eigen), Geothermie `isle: 'quelle'`.
    Rundkurs: `railLoop` (Äste abschneiden, genau ein Ring, alle Bahnhöfe daran) → `line.loop`; Züge darauf sind
    zeitversetzte Kopien (`loopPos(route, tau)`, gemeinsames `ls.tau`) und stoßen so nie zusammen. Weitere Züge
    (`t.extra` an allen Bahnhöfen, `EXTRA_TRAIN`) nur auf Rundkursen, 1 je 2 km (`line.max`).
34. **Leiste oben** ist bewusst schlank: Rathaus, Geld (`fmtMoney`, immer glatt), Einwohner, Ideen, 📦, Du (Gesicht der
    Figur, Block 98), ☰. Raten und
    Arbeitsplätze nur nach Antippen (`hudMore`, Klasse `more`), Rohstoffe/Schönheit/Strom im Lager (`storeHtml`,
    `toggleStore`), bezahltes Material blitzt am 📦 (`flashStore` aus `payMat`). Tagebuch steht bei „Du“. Keine neuen
    Anzeigen oben ergänzen – lieber ins Lager oder ins Rathaus. Bei ≤ 480 px muss alles in eine Zeile passen.
34a. **Aussehen der Oberfläche** (js/ui-look.js, 25.10.2026, tests/aussehen.test.js): „Hecke“ (Standard) oder „Wolken“, je Gerät
    (`UI_LOOK_KEY`, nicht in GFX, nicht im Spielstand), Klasse `body.look-…`, Wahl in ⚙️ Einstellungen. **Keine Emojis und keine
    Pillen** in neuer Oberfläche (Nutzer: „sieht KI-generiert aus“): Symbole zeichnet das Spiel selbst – `<i class="wi" data-ic="…">`
    (eigene Zeichnung aus `UI_DRAW` oder ein Ding ohne Bodenkachel, `'haus:2'`), gefüllt von `fillUiIcons`. Fenster/Leisten bekommen
    gemalte Platten über `lookSlab(el, 'paper'|'btn'|'btn2'|'bar')` (Bild in `--slab`, gezeigt von `.slab::before`, übersteht innerHTML;
    neu gemalt nur bei Größenwechsel). Leiste oben: siehe „Leiste oben (Konzept A)“ weiter unten. Klasse `.ic`
    ist schon vergeben (Bereichsknöpfe) – Welt-Symbole heißen `wi`. Bauleiste: `#cats` steht in `#cats-isle` (Platte 'bar'; `.cats` scrollt
    selbst, eine Platte darin würde abgeschnitten), Knöpfe über `wiFace(b, symbol, wort)`, Bereiche/Gruppen über `menuIcon(el, id)`
    (`MENU_ICON`; ohne Bild bleibt das Emoji). Das Feld `#sheet` scrollt selbst → Platte als Hintergrund (`lookSlab(el, rolle, true)`,
    Klasse `slab-in`). Höhe der Leiste nie fest annehmen, sondern `--bar` (Minikarte, Drehknopf). Neue Regeln für die Leiste mit
    `#toolbar #cats …` schreiben – die alten Pillen-Regeln sind schwächer, ihre Ausblende-Regeln (drag-open/-tight/-tighter) sind dort wiederholt.
    Infofenster: `showPanel` packt den Inhalt in `.p-scroll` (scrollt innen, der Rand bleibt frei – nie wieder `#panel` selbst scrollen
    lassen) und setzt vorn das Bild aus `panelHeroNext` (ein Feld, z. B. in `openInfo`; Bild per `uiHero(t)` mit den Farben des Feldes, als
    `--hero` am Fenster, damit das Neuzeichnen alle 0,2 s es nicht wegnimmt). Kinder von `#panel` nie per `lookSlab` bemalen: `patch()` nimmt
    fremde Klassen/Attribute wieder weg – Knöpfe darin sind reines CSS (`#panel .btn`). Wolken färben Braun → Blaugrau über die Variablen
    (`--brown`, `--brown2` … an `#panel`, `#goal`, `#sheet`). Die Meldung „ResizeObserver loop …“ ist kein Fehler (Melder überspringt sie).
    Große Fenster: `#modal-card` hat die Platte als Hintergrund (Merker `data-slab-in`, weil `openModal` die Klassen neu setzt; CSS über
    `#modal-card:not(.basar-night)` – der Sternenbasar bleibt dunkel). `.btn`/`.look` sind überall Plättchen. Emojis in Texten: `setHtml`
    und `openModal` schicken HTML durch `wiText` (`WI_TEXT`: 🪙 📦 👥 💡 🔒 🌸 → `<i class="wt">🪙</i>` mit Bild aus `--wt-…`). Das
    Zeichen bleibt im Text (Tests, Vorlesen); nur Text zwischen Tags wird ersetzt, nie Attribute. Neue Zuordnung: Symbol in `UI_DRAW`
    oder ein Ding, Eintrag in `WI_TEXT`. Gezeichnete Symbole stehen in js/ui-symbole.js (`Object.assign(UI_DRAW, …)`, 64×64, Boden y≈56),
    Tiere als `'tier:N'` (über `figPreview`, friends.js – erst zur Laufzeit da). Bilder für Texte malt `wtEnsure` erst bei Bedarf (nie alle beim
    Start). Leisten, die selbst Text setzen (Hinweis, Auswahl, Erfolg, Lager …), wandelt ein Beobachter um (`WI_WATCH`); die Leiste oben
    schreibt über `setWiText` (hudtap.test: sonst Schreiben ohne Änderung). Globale Muster mit `g`-Flag nie mit `.test()` prüfen
    (`WI_TEXT_HAS` ohne g) – die gemerkte Position ließ den Beobachter endlos umbauen. Karte: Symbole über Häusern und Schilder (`pill`, ohne
    Pille, Umriss-Schrift) zeichnen Emojis als `uiIconCanvas` (fertige Leinwand, nie ein noch ladendes Bild – sonst kein Bildchen-Speicher).
    Knopf „Du“: eigene Figur (`youFaceSync`). Kleine Leisten/Meldungen: Plättchen über `--cut`, `--plate…` (je Aussehen in style.css).
    Läden (SHOPS) und Naturtiere (NATURE) tragen sich selbst in `WI_TEXT` ein (Emoji → echtes Laden-Gebäude bzw. `'natur:id'` über
    `drawCritter`). Der Sternenbasar ist hell wie alle Fenster (Klasse `basar`, die alten `.basar-night`-Regeln greifen nicht mehr).
    Bewusst Text geblieben: ♥ ↔ ▶ ⬆ ➕ ℹ und die Farbquadrate 🟥🟦🟨🟩 (Farbwahl). Emojis in Gebäudezeichnungen (Ladenschilder) gehören zur Welt.
    Vorschaubilder (`thumb`) passen sich ein: ragt etwas über den Rand (`thumbOverflow`), malt `thumbRaw` mit `thumbFit` kleiner neu (um den Fuß).
    Nacht (Variante C): `uiNightSync` (aus `updateHud`) setzt `uiNightNow` 0–3 aus `nightAt()`; `paintSlab(…, night)` dunkelt nur den Rand
    (Hecke/Wolkenbuckel), die Fläche innen bleibt hell. Neu gemalt nur beim Stufenwechsel (Stufe steht im `slabKey`). „Immer Tag“ → 0.
    Hecke und Wolken sind gleichmäßig (`roundRectRing`: gleicher Abstand, echte Viertelkreis-Ecken) – nie wieder zufällige Größen/Wackeln.
    Unter den Büschen liegt eine dichte dunkelgrüne Fläche (ganze Form): Papier und Büsche allein ließen an Ecken und zwischen den Büschen
    durchsichtige Lücken (Nutzer: „kleine Lücke, darf nicht sein“). Prüfen: `paintSlab` malen und Alpha innerhalb der Form zählen (muss 0 sein).
    **Knopf-Familie** (Nutzer: „du solltest gründlicher sein“): Haupt = Terrakotta/Blau (`.btn`), Neben = Sand/Hellblau (`.btn.ghost`),
    Wahl-Chips/Reiter = `--chip` (Hecke Sand, Wolken Hellblau), gewählt = `--chip-on` (Heckengrün/Blau, helle Schrift), reine Anzeigen
    (`.stats span` …) = `--info` ohne Kante. Nie wieder Creme mit brauner Kante oder Gelb für Gewähltes – das sah aus wie vorher.
    Neue Knöpfe prüfen: Farbe muss eine dieser sein (Prüfschleife über alle Fenster und alle Infofenster, beide Aussehen). Drehknopf =
    gezeichnetes Symbol (`drehen`), Weglegen = Bild des Dings in der Hand (`heldPic`), Bauleiste: Inhalt ganz im Beet (Innenabstand).
    **Knopf-Formen** (Nutzer 25.10.2026, aus sechs Richtungen gewählt: Hecke „A Holzbrett“, Wolken „W1 Schäfchenwolke“; Block am Ende
    von style.css, gilt vor allen früheren Knopf-Regeln): Hecke = Brett mit Maserung (`--grain`), dunkler Kante und Dicke, Haupt-/
    Nebenknöpfe mit Nagelköpfen; Farbe über `--k`/`--kd`/`--kt`. Wolken = Wölkchen mit gleichmäßigen Buckeln ringsum als `border-image`
    (`--ck`), Bilder je Knopfart aus `cloudKnobs()` (ui-look.js, `CLOUD_KNOB` p/on/s/x/off, einmal gemalt, an `body` als `--cloud-…`).
    Nie per JS an einzelne Knöpfe malen: `patch()` im Infofenster nimmt fremde Klassen/Attribute alle 0,2 s wieder weg – border-image
    ist reines CSS und wächst mit jeder Knopfgröße (Ränder „round“). Zahlen im CSS (32 32 38 32 / 16 px …) = (r + P/2) bzw. + Dicke, ×2, ganze Pixel (halbe gaben Nähte)
    im Bild; wer `CLOUD_KNOB_R/P/DEPTH` ändert, ändert sie mit (Test prüft das). Wolken-Knöpfe brauchen mehr Innenabstand (Buckel), kleine
    Knöpfe (`.btn.small`, „Los!“, Ziel-Chips) nehmen dieselbe Wolke verkleinert (`border-image-width`). Ältere, stärkere Regeln mit
    Hintergrund (z. B. `.card.basar .btn.small.basar-try`) dort zurücknehmen; Prüfschleife: in Wolken `background-image: none`,
    durchsichtig, kein Schatten, `border-image-source` gesetzt; in Hecke Maserung + Kante; kein Text läuft über (beide Aussehen, alle Fenster, Handy).
    Unter der Wolke liegt eine Fläche in Wolkenfarbe (`--kbg` aus `--kc`, eingerückt um `--ki`/`--kd`): Der Browser glättet die Kanten der
    9 border-image-Teile einzeln, ohne die Fläche scheinen feine Nähte durch. Wer eine Knopfart ergänzt, setzt `--ck` **und** `--kc`.
    Text-Prüfung: tools/knopf-text-pruefung.js (`await KT_RUN()` im Spiel): Inhalt mittig in Brett bzw. Wolke, Abstand zu Nägeln/Buckeln,
    mehrzeilig, Überdeckung – in beiden Aussehen, am Rechner und bei 375 px. Knopfreihen `.row` brechen um, statt Knöpfe schmaler als ihren
    Text zu quetschen (`.row > .btn { min-width: max-content }`; auf dem Handy ragte „Schließen“ im Tagebuch aus der Wolke).
    **Abstand zur Hecke** (Nutzer: „Buttons unten in der Hecke“): Büsche reichen bei Platten 11 px ins Element (Ziel-Fenster, `::before`) bzw.
    pad + 11 = 29 px (Infofenster, Platte als Hintergrund) – Knöpfe samt Kante brauchen davor mindestens 6 px (seit v1303 haben alle Fenster
    6 px mehr Innenabstand, Nutzer: „ein paar Pixel mehr Luft“; Ziel-/Infofenster dafür 12 px breiter); Innenabstand von `#panel`
    zählt, nicht der von `.p-scroll` (dessen negativer Rand hebt sich auf). Prüfen: `await KT_EDGE()` (tools/knopf-text-pruefung.js),
    Rechner und 375 px. Ziel-Fenster klappt beim Antippen; der Pfeil-Knopf rechts in der Überschrift zeigt es (`h4::after` Brett bzw.
    Wölkchen, `::before` Pfeil darüber – die Wolke malt ihre Fläche über den Hintergrund), `aria-expanded` setzt `updateHud`.
    **Zahlen in der Leiste oben** nur über `hudNum` (bis 999 genau, dann `fmtHud`: 3,1k · 158k · 1,5 Mio., abgerundet; nach Antippen von
    Taler/Einwohner 5 s die volle Zahl) – lange, ständig wechselnde Zahlen ließen die ganze Leiste zucken. Ziffern `tabular-nums`.
    Das Ziel-Fenster steht `--goal-over` (Hecke 12, Wolken 16 px) tiefer als `top`, weil Büsche/Buckel über seinen Rand hinausstehen.
    **Nichts darf über den Innenabstand eines Scrollbereichs (`.p-scroll`, `.tab-scroll`: 8 px) hinausragen** (negativer Rand, `::after`
    mit `left:-10px`): sonst scrollt er quer und unten erscheint ein grauer Balken. Prüfen: `await KT_QUER()`. Mitlaufende Köpfe (`.me-edit`)
    in Papierfarbe, nie durchsichtig – sonst scheint beim Scrollen alles darunter durch.
    **Leiste oben (Konzept A, Nutzer 26.10.2026)**: drei Gruppen in index.html – `.hud-info` (Ort), `.hud-vals` (Taler, Einwohner, Ideen,
    Sternstaub auf einem Brett bzw. einer weißen Wolke `--cloud-w`), `.hud-act` (Lager, Du, Online, Menü als runde Scheiben). Neue Werte gehören
    in `.hud-vals`, neue Knöpfe in `.hud-act`. Inhalt senkrecht mittig (`align-items: center`, Bildchen ohne negativen Rand; Wolke: unten 3 px
    mehr Innenabstand für ihre Dicke) – prüfen mit tools/leiste-pruefung.js (`LT_CHECK()`: Mitte von Ziffern/Großbuchstaben, nicht der
    Zeilenhöhe; ≤ 1,5 px). Schrift auf den Platten dunkel; was darunter erscheint (Raten nach Antippen, Lager-Meldung), hell mit Umriss.
    ≤ 860 px ohne Ortsnamen, ≤ 720 px Knöpfe rechts untereinander (das Infofenster rückt 601–720 px daneben, die Lager-Klappe öffnet links
    neben dem Knopf). Breiten 1280 … 360 px und Handy quer nachmessen. Roter Punkt auf Werten sitzt am Bildchen, nicht an der Zahl.
    **Schrift** (Nutzer 26.10.2026, aus 12 Vorschlägen gewählt: „Schulheft“): nur **Mali** (Google Fonts, 500–700), in CSS immer
    `var(--font)` (steht einmal oben in style.css), auf Leinwänden `… px Mali, system-ui, sans-serif`. Keine zweite Schrift dazunehmen.
    Mali hat höchstens 700 (800/900 werden 700); Fließtext in Fenstern 500. Bilder mit Text, die zwischengespeichert werden
    (Ladenschilder, Fragezeichen-Symbol, Baumenü-Bilder), malt `uiFontReady` nach dem Laden der Schrift neu. Mali ist breiter als die
    alten Schriften: neue Raster mit `minmax(0, 1fr)` bzw. `auto-fit` bauen, lange Wörter trennen (`hyphens: auto`, lang="de").
    Ausprobieren weiterer Schriften: tools/schrift.html (echtes Spiel, Testwelt, Umschalter).
    **Sprache der Spieltexte** (Nutzer 26.10.2026: „überprüfe das ganze Spiel auf KI-Sprache, also Gedankenstriche usw.“): keine
    Gedankenstriche „ – “ in Texten, die man sieht (Meldungen, Fenster, Beschreibungen, Neuigkeiten, aria-label/title). Statt dessen Punkt,
    Komma, Doppelpunkt, Klammer oder den Satz umbauen; Inhalt nie ändern. Bindestriche in Wörtern und Bereiche („3–5“) bleiben.
    Fehlermeldungen enden meist mit Punkt: wer zwei Meldungen verbindet, nimmt beim ersten Teil den Punkt weg (`.replace(/\.$/, '')`).
    „… steht: Name“ + „Das musst du erst entfernen.“ (passt zu jedem Namen, „es“ nicht). tests/sprache.test.js prüft alle Texte
    (Kommentare zählen nicht). Prüfen mit dem Skill humanizer-de (Modus „Locker“).
35. **Meer gehört niemandem**: Auf Wasser außerhalb eigener Grundstücke nie „nicht dein Grundstück“ (`notMine`), sondern
    „Nicht auf dem Wasser“; Schienen/Aufschütten über `claimable`, die Seebrücke darf ins offene Meer (`inWorld`,
    Felder werden per `claimTile` eigen). Erschlossene Inseln gehören ganz dir (`ownIslandsFully` beim Laden).
36. **Karte ziehen mit Werkzeug**: rechte/mittlere Maustaste, Ctrl oder gehaltene Leertaste ziehen immer die Karte
    (`panButton`, `drag.pan`); die linke Maustaste zieht mit Weg/Schiene/Gelände/Abriss/Deko/Verschieben eine Linie
    bzw. ein Rechteck auf (Regel 42). Kurzer Rechtsklick bricht erst die Planung ab, dann legt er das Werkzeug weg.
    Test: tests/ziehen.test.js (jsdom hat kein PointerEvent → MouseEvent mit pointerId).
37. **Negative Radien töten den Start** (Browser wirft `IndexSizeError` bei `arc`/`ellipse` < 0 → blauer Bildschirm,
    30.09.). Animations-Phasen mit Versatz immer `((x % 1) + 1) % 1`. Die Test-Leinwand (tests/setup.js) wirft deshalb
    wie der Browser. Vorschaubilder sind abgesichert (`thumb` → leeres Bild), unerwartete Fehler zeigt `reportError`.
38. **Terraforming** (`TERRAFORM` in rules.js, Forschung „terraform“): Pinsel setzen `state.terra`. 'sand' (Strand) und
    'wiese' (nie Strand) zählen in `terrainAt` als 'grass' – nur `terraLook` (Boden zeichnen) sieht den Unterschied. Erz und
    Kristall gibt es nie zum Pflanzen (sonst wären die Themen-Inseln sinnlos).
39. **Wegstile** (seit 30.09. abends): alle sind Bänder, so breit wie der Kiesweg (keine ganzen Platz-Felder mehr – Plätze
    entstehen, wenn man Wege als Block legt, `pathQuads`). id 'sand' = Kiesweg (Startstil), 'mulch' = Erde, 'platten' = Schachbrett. Entfernte
    ids (kies, holz, schach) werden in `parseSave` umgestellt (`WEG_TO`/`PAVE_TO`) und bezahlte Stile erstattet (`DROPPED`).
    Die Vorschau zeichnet Wege auf Feldern, auf denen noch keiner liegt – Stilfunktionen nie ohne Fallback auf `pathAt`
    verlassen (`plazaSides(x, y, own)`).
40. **Forschung** kostet `techCost(t)` (Grundpreis × `TIER_MUL` × (1 + 10 % je schon erforschter), nie `t.cost` direkt).
    Stufen-Forschung `MASTERY` (endlos, `state.mastery`, `masteryMul`/`masteryCost`, ab Bibliothek) wirkt in `totals`
    (Taler, Rohstoffe, Einwohner, Schönheit) und in `powerOf` (Strom). Erfindungen `INVENTIONS` (`state.inventions`, ab
    Universität): Ballons/Zeppelin/Seilbahn-Seile zeichnet `drawSky` (vor der Nacht), das Feuerwerk `drawFireworks`
    (nach der Nacht, damit es leuchtet). Items mit `invention` sind erst nach der Erfindung frei (`unlockOk`).
41. **Wohnformen** außer dem Haus (`reihenhaus`, `baumhaus`, `hausboot`, `ferienhaus`): `cat: 'bau'`, Einwohner = `pop ×
    Stufe`, Ausbau über `BUILD_STAGES` (keine Wünsche). Besondere Orte über `needs`: 'forest' (Wald bleibt), 'boot' (Wasser
    am eigenen Ufer, auch Teiche; Meer wird per `claimTile` eigen), 'strand' (Sand oder Strand am Wasser, nicht 'wiese').
    ✨ zeigt nur, was man auch bezahlen kann (`canPay`).
42. **Planen statt Malen** (js/plan.js, 29.09.): Nichts wird beim Ziehen sofort gebaut. `plan` = Linie (Weg, Schiene:
    Klick A, Klick B; L-Form `lineTiles`) oder Rechteck (`dragKind`: Gelände, Weg-Fläche, Abriss, kleine Deko); die
    Vorschau (`planPreview`) zeigt jedes Feld grün/rot/hell und den Preis, Klick/Tippen hinein führt aus (`runPlan`),
    daneben bricht ab. Geprüft wird ohne Geld (`placeError(…, { noCost })`, `smallError`, `crossError(…, true)`), die
    Summe prüft `planInfo`. Ausgeführt wird in `batch()`: `recalc`, `save`, `sfx`, `addFloat` warten bis zum Ende –
    innerhalb eines Batches also nie auf frische `T`/`COVER` verlassen. Neues Spiel/Import verwerfen `plan` und `moving`;
    `setTool` verwirft die Planung nur beim echten Wechsel (die Leiste baut sich bei Freischaltungen neu auf).
43. **Mehrere Dinge verschieben**: Rechteck mit ✋ hebt alles an, was ganz drin steht (`pickUpGroup`, `moving.kind =
    'group'`, Rathaus/Sehenswürdigkeiten bleiben); ein einzelnes Ding geht den normalen Weg (`pickUp`, mit Drehen). Beim
    Tragen speichert `serialize` alles am alten Platz (`carried()`), `cancelMove` legt es zurück. Brücken nur übers
    Wasser, Schienen übers Wasser nur als Brücke (`groupErrors`).
44. **Nachtlicht stanzt Löcher** (29.09.): `glowQuad` radiert beim Zeichnen Fenster/Lampe (und weich den Schein) aus dem
    Bild (`destination-out`); was danach davor gezeichnet wird, füllt das Loch wieder. `drawNight` dunkelt nur das übrige
    Bild ab (`source-atop`) und hinterlegt die Löcher mit Licht (`destination-over`) – so scheint nichts durch Laub oder
    Nachbarhäuser. Große Gebäude (Streifen) tragen ein Licht mehrfach ein, `drawNight` fasst gleiche zusammen. Nie
    Lichter nach der Nacht einfach obendrauf malen.
45. **Handy** (29.09.): `PHONE` = kürzere Bildschirmseite < 540 px, gesetzt in `resize()` samt `body.phone` /
    `body.phone-land`. Alles Handy-Eigene hängt daran (CSS-Block „Handy“ am Ende von style.css, JS über `PHONE`) –
    iPad und Desktop nie anfassen, nie `innerWidth <= 600` für Handy-Verhalten nehmen. Leiste eingeklappt, Katalog per
    `setSheet` (#toolbar.open); Hinweis kurz (`updateHint`); Zielkasten von selbst klein (`goalSmall ?? PHONE`);
    Infofenster unten bzw. quer rechts mit Griff (`GRIP`, .tall), `revealTap` rückt das Angetippte ins Bild. Neue
    Fenster/Knöpfe bei 375×812 und 812×375 ansehen; tests/handy.test.js prüft, dass Desktop/iPad unverändert bleiben.
46. **Verkehr** (Block 17): Züge bringen keine Pendler-Einwohner und keinen Insel-Bonus mehr. `placeStats` zählt je Ort
    (`regionAt`) Einwohner (`popOf`) und Anziehung (`LM_ATTRACT`, `WONDER_ATTRACT`, Deko-Schönheit/10); `lineTraffic` rechnet je
    fahrender Linie Pendler + Besucher gegen die Plätze (`SEATS_PER_CAR` × Wagen, `carsOf(look)` = Modell + `plus`) →
    `served`, Fahrkarten (`FARE`) und Ausgaben (`VISIT_SPEND`) landen in `T.inc`. Anbindung: Was im Viertel eines Bahnhofs
    oder bis `WALK_REACH` davon steht und sonst „weit“ wäre, bekommt `how: 'bahn'`, `eff` = ½ + ½ × served. Wagen je Zug
    stehen am Bahnhof (`trainPlus`, `extra[i].plus`), `EXTRA_CAR`. Zahlen sind Startwerte – nach dem Spielen nachjustieren.
    Alle Verbindungen (fahrende Züge, Seilbahnen `cablePairs`, Fähren) laufen durch `transitTraffic` (Block 25b): **jede
    Insel zählt einmal** – ihre Pendler (wenn eine verbundene Insel größer ist) und Besucher (Anziehung, höchstens ½ je
    Einwohner aller verbundenen Inseln) teilen sich alle Verbindungen, die dort halten, nach Plätzen. Jede Verbindung hat
    eigene `demand`/`served`; `shared` = wie viele andere Verbindungen dieselben Inseln bedienen. Verbindungen innerhalb
    einer Insel haben keine Fahrgäste (binden aber an). Anbindung gilt für jede Station jeder Verbindung.
    Orte bleiben Orte, auch zusammengeschüttet (Megainsel): `regionAt` = natürliche Insel, aufgeschüttetes Meer zur
    nächsten. Halte (`STOPS`) zeigen ihren Ortsteil in Vorschau und Infofenster (`placeLabel`).
47. **Inseln entdecken** (Block 18): nicht mehr per Schild freischalten, sondern per Boot: Steg (`bootssteg`, `needs: 'meer'`,
    von Anfang an) → `sendExpedition` (zahlt `need.money`/`science`, prüft Laternen/Einwohner über `isleNeeds`) →
    `state.expedition` (echte Zeit, `EXPEDITION_MIN`, gespeichert) → `checkExpedition` im Takt (nur ohne offenes Fenster)
    → `discoverIsland` (Tagebuchseite `isle:<id>`, `DISCOVERY`-Texte). Das Boot zeichnet `expeditionBoat`/`drawBoatMover`
    als Mover; der Steg zeigt sein Boot nur, solange es zu Hause ist.
48. **Hafen** (Block 18/23): 3 tief × 4 breit, vorn das Wasser (`autoRot` für 'shore'); Kai, Pier(s) ragen ins Wasser.
    Schiffe: `t.ships = [{ model, to }]` (Liegeplätze `BERTHS` 2/4/6 je Stufe, `buyShip`/`sellShip`, Ziel = Steg oder Hafen
    auf einer anderen Insel, `shipTargets`); `shipLinks` fasst Schiffe zum selben Ziel zu einer Verbindung (Plätze ×
    Tempo, `shipSeats`) → `transitTraffic`. Alte `t.ferry` werden beim Laden eine Holzfähre; alte 2×2-Häfen wachsen per
    `growHarbors` (v11). Fischkutter (`FISH_INC` × Stufe), Handel ab Stufe 2 (`trade`, `tradePrice` aus der Uhrzeit),
    Kreuzfahrt ab Stufe 3 (`checkCruises`, `t.cruise`/`t.docked`). Mover: `shipMovers` (je Modell `drawShipMover`),
    `fishBoats`, `cargoShip`, `cruiseShips`; Anlegestelle `dockPoint`.
    **Neue Felder an Kacheln müssen in `tileOut` (state.js)** – sonst gehen sie beim Speichern verloren (Wagen, Schiffe).
    **Verkehrsmittel** (Forschungs-Reiter „Verkehr“, `SHIP_MODELS`/`TRAIN_MODELS`, `state.vehicles`, `vehicleOk`,
    `researchVehicle`): Fahrgäste/min = Plätze × Tempo (`trainSeats`, `shipSeats`); das erste Modell ist mit der
    Grundforschung frei. Neue Linien fahren Straßenbahn; alte Stände behalten, was schon fuhr (Regionalbahn).
51. **Seewege und Aufträge** (Block 24): Schiffe fahren nur übers Wasser – `seaPath`/`seaSearch` (Breitensuche, 8 Richtungen,
    nie über eine Landecke) + `seaRoute` (geglättet), Bewegung mit `routeAt`; gemerkt in `seaCache`, **wer Wasser ändert,
    ruft `waterChanged()`** (Teich graben, Aufschütten, neuer Stand). Kein Weg → Verbindung `noSea` (keine Fahrgäste,
    Schiffe am Pier, Hinweis im Hafen); Expedition braucht einen Seeweg (`expeditionRoute`). Handel = Aufträge
    (`state.orders`, `makeOrder`, `checkOrders` im Takt, `fulfillOrder`): Ankauf aus dem Lager zu 120–180 %, Großaufträge
    am Großen Hafen 200–300 %, Angebote nur für Waren, deren Betrieb frei ist. Kreuzfahrt gibt es nicht mehr.
49. **Sorten statt Einzelgebäude** (`KINDS` in data.js): Bedingungen (`near` in BUILD_STAGES, Wünsche, Laufweite,
    Viertel mit Häusern, Deko neben Häusern, Bewohner) fragen nach einer Sorte – `isKind(sorte, b)`, `isHome(b)` für alle
    fünf Wohnformen, Brunnen = auch Kristallbrunnen, Park = auch Botanischer Garten, Statue = auch Denkmal. Wer ein neues
    Gebäude einer bestehenden Art baut (z. B. einen weiteren Brunnen), trägt es in `KINDS` ein – nie `b === 'haus'` prüfen.
50. **Rathaus 3×3** (Spielstand v10): neues Spiel bei (1,1), die Startwege führen an seine Seiten. Alte Stände wachsen per
    `growTownHall` (vor `fitFootprints`, beim Laden und Import) dorthin, wo am wenigsten im Weg steht – am liebsten nach
    hinten; was weicht, gibt es mit `fullValue` voll zurück (samt Ausbau). **Rathaus „Bereit“**: Gruppen wie das Bau-Menü
    (`readyGroups`), „Alle ausbauen“ je Gruppe und „Alles ausbauen“ → `upgradeMany` (Günstigstes zuerst, nach jedem Ausbau
    neu rechnen, `QUIET` statt Einzel-Meldungen). Wunderwerke und Laternen nur einzeln.
53. **Bedingungen per Weg oder Bahn** (Block 26): Versorgungs-Wünsche (`WISH_REACH`: Bäckerei, Markt, Park/Brunnen,
    Schule) und `near`-Bedingungen ab 2 Feldern gelten auch, wenn das Ziel im selben Viertel steht oder über eine fahrende
    Verbindung erreichbar ist (`buildAccess` in `totals` → `T.access`, `reachKind` → `how`: 'nah' | 'viertel' | 'bahn' |
    'seil' | 'faehre'). Schönheit, Wasser, Ruhe, Deko und „direkt daneben“ (r = 1) bleiben vor Ort. Wer Wünsche prüft:
    `wishCheck` (mit `how`), `houseWishes`/`stageInfo` bekommen den Zugang als letztes Argument (in `totals` den frischen).
54. **Welt ohne Rand** (Block 27): `WORLD` wächst mit (`growWorld`/`worldInclude`: eigenes Land im Meer, ferne Inseln,
    `WORLD_MARGIN` Grundstücke Meer drumherum; `WORLD.R` = wie weit die Kamera darf). Aufschütten geht überall, kostet ab
    `DEEP_FROM` Feldern vor der Küste mehr (`fillCost`, `seaDepth` = Abstand zu den Insel-Kreisen); tiefes Meer wird per
    `drawDepth` (ein Punkt je Feld, `depthAlpha`) dunkler. Seewege suchen nur in einem Kasten um Start und Ziel (`seaBox`).
    Neue Geometrie (Inseln) immer über `registerFar()` – leert Gelände-/Orts-Zwischenspeicher, `groundVersion++`,
    `waterChanged()`, `growWorld()`.
55. **Ferne Inseln** (Block 27c): nach dem Laternenfest immer genau eine unentdeckte (`ensureFar`), erzeugt per `makeFar(n)`
    (fester Startwert, Spirale nach außen, `farFree`), gespeichert in `state.far`, registriert in `FAR` und `ISLE_BY_ID`
    (`far: true`, eigenes `r`, kein `lm`). Wer über Inseln läuft: `ISLES` sind nur die sieben Themen-Inseln; Reihenfolge
    über `regionRank`/`byRegion`. Entdecken per Boot (`expMinutes`), in der Mitte eine Truhe (`truhe`, `t.isle`),
    `openChest` rechnet die Belohnung beim Öffnen (`chestLoot`).
56. **Wunder** (Block 28): dauerhafte Boni in `WONDERS[b].effect` (`incMul`, `sciMul`, `popMul`, `beautyMul`, `allMul`), in
    `totals` über `won` (Wunder → 1, ohne Strom ½) → `T.wonders`; `wonderOn(b)` für Fähigkeiten. Schübe auf Zeit (Jahrmarkt:
    `fairLeft`, echte Uhr; Erlasse: `state.decree`/`decreeNext`) wirken nur über `boostMul(kind)` beim Verdienen (`earn`),
    Erzeugen (`produce`) und bei den Ideen (main.js) – nie in `T` einrechnen. Sternschnuppen (`fallenStars`, nicht gespeichert)
    per `starTick`/`collectStarAt` (im `tap` vor allem anderen). Garten: `access.green` erfüllt „Park“/„schön“ (`how: 'garten'`),
    exotische Deko mit `garden: 'botgarten'` (in `unlockOk`, zählt nicht fürs Album).
57. **Hauptbahnhof** (`hbf`, Block 29): Größe hängt am Gebäude (`t.gleise`) – `sizeOf(b, rot, t)`/`footprint(…, rot, t)`
    immer mit dem Gebäude aufrufen, wenn eins da ist (auch `placeError(…, { move: true, t })`). Jedes Gleis ist ein Halt:
    Schlüssel = vorderstes Hallenfeld (`GLEIS`, in `rebuildCover`), Felder per `gleisTiles`, Zug-Einstellungen in
    `t.gleis[g]`. Wer über Halte läuft, nimmt `stopFoot(k)` (Felder) und `stopConf(k)` (Zug), nie `state.tiles.get(k)`.
    Züge fahren bis in die Halle (`HALL`) und werden dort ganz hinten gezeichnet (Dächer darüber); die Schiene vor dem Gleis
    hat keinen Prellbock (`GEXIT`). Umsteigen: `transitTraffic` verbindet alle Inseln der Linien am selben Hbf (`transfer`).
    „+ Gleis“ wächst zur Seite +b (bei Drehung 1/2 rückt der Anker, `hbfResize`), die alten Gleise bleiben liegen.
58. **Läden und Kultur** (Block 30): alles aus der Tabelle `SHOPS` (data.js) – daraus entstehen ITEMS (`cat: 'laden' | 'kultur'`,
    `shop: true`), Menü-Gruppen, FX, Tipps, Sorten (`laden`, `cafe`, `kultur`). Einnahmen in `totals` über `shopWorld`:
    Kundschaft = Einwohner im Viertel + ankommende Besucher der Insel, geteilt durch gleiche Läden im Viertel; Innenstadt-
    Bonus nach verschiedenen Läden (`INNER_STEPS`, `types`). Warenverkauf steht in `T.sales` und läuft in `produce`
    (Lager → Taler, `SALE_MUL`); die Leiste zeigt ihn über `saleRate`. Kultur (`attr`) und Hotels (`hotel`) wirken in
    `placeStats`. Bilder in js/draw-shops.js (kleine Läden: `smallShopArt`, große: `SHOP_ART`); wer flache Teile hat,
    muss in `GROUND_TYPES` und oben `groundPart` aufrufen, sonst niemand. Kaffee/Tee/Kakao: Plantagen mit `far: true`
    (nur auf fernen Inseln).
    Aussehen (Block 32): jeder Laden hat feste Markenfarben (nicht umfärbbar) und ein Wahrzeichen; die Bilder stehen je
    Gruppe in js/shopart/a–g.js (je eine IIFE, trägt sich in `SHOP_ART` ein; Grundhaus `shopHouse`, Schrift `kText`).
    Eine Gruppe allein prüfen: `ART_FILE=js/shopart/b.js ART_IDS=cafe,… npx vitest run tests/shopart.test.js`.
    Symbole der kleinen Läden NICHT groß aufs Dach (Nutzer: „zu fett“), sondern klein im Ausleger `hangSign` an der Hausecke.
    **Stil wie die alten Gebäude (Block 35, gilt für jedes neue Gebäude):** Schatten eintragen (`ART_SHADOW[id] = [Wandhöhe,
    inset]`); Wand hell und warm (Helligkeit ≥ 80 %, aus `WALLS`), Dach klar-farbig und nicht dunkel (≥ 40 %, aus `ROOFS`),
    Markenfarbe in Dach/Markise/Tür/Schild; kleine Läden nicht breiter als ein Wohnhaus (ha/hb ≈ 0.26–0.32, ≤ ~42 px hoch)
    und jeder mit eigener Bauform (Silhouette); höchstens ein Gegenstand vor der Tür, keine Linien unter 0.8×z; KEINE
    Schrift; nichts aufs Dach außer Architektur. Nichts höher als der Rathaus-Uhrturm (71 px) – Ausnahmen: Stadion,
    Konzerthalle, Grand Hotel, Wunder. Messen: drawObject auf ein Test-Canvas, oberste deckende Pixelzeile.
    Vorrat (Block 33): Läden verkaufen nur `saleable(r)` = Bestand über `keepOf(r)` (state.keep, sonst `KEEP_DEFAULT`:
    Baumaterial 2.000, seit Block 37 auch Holz/Stein/Erz 500 und Obst 2.000); im 📦 Lager je Ware umschaltbar (`cycleKeep`,
    Stufen `KEEP_STEPS`, `KEEP_ALL` = alles behalten). `produce` verarbeitet erst (Sägewerk & Co.), dann verkauft es;
    was wirklich verkauft wurde, steht geglättet in `soldRate` (je Ware und je Laden `k|res`) – Lager und Infofenster
    zeigen das, nie die Wunschmenge `T.sales[].rate`. `resetSales()` bei neuem Spiel/Laden.
    **Balance (Block 37, Wirtschaftsprüfung 30.09.):** Ein Laden bedient höchstens `shopCap(b)` = Mitarbeiter ×
    `SHOP_SERVE` (150) Kunden (`s.want`, `s.kunden`, `s.full` → „Voll – ein zweiter Laden hätte Kundschaft“). Weil Bauen
    freie Einwohner braucht (`placeError`), begrenzt die Einwohnerzahl das Ladeneinkommen – vorher kaufte jeder Einwohner in
    jeder Ladenart voll ein und die Progression kippte ab ~10 Laternen. Weil man Läden nachbauen kann, dazu die **Kaufkraft**
    je Viertel (`kaufShares`): Ladenarten nach Ertrag je Rate-Punkt sortiert, die besten `KAUF_BUDGET` (40) Punkte voll, der
    Rest `KAUF_OVER` (¼); Kopien zählen nicht neu; `s.base` = Ertrag davor, `s.buy` je Art (Infofenster „💰 Kaufkraft“).
    Nie einen Faktor fürs ganze Viertel nehmen – dann senkt ein neuer Laden das Einkommen. Einwohner teilen sich gleiche Läden im Viertel
    (`s.same`), Besucher gleiche Läden der Insel (`s.sameIsle`, `isleCount`) – nie Besucher je Viertel neu zählen.
    Preise nach dem besten Einkommen: `wonderRate()` = max(`T.inc` + haltbarer Warenverkauf `T.salesInc`, `state.incPeak`);
    `incPeak` steigt in `recalc` und sinkt in `peakTick` langsam (Halbwertszeit `PEAK_HALF`), beides nie, solange etwas
    getragen wird (`moving`). Wunder (`wonderBase`), ferne Inseln mindestens `FAR_MIN(n)` Minuten (`isleMoney`), die letzten
    Schritte vor dem Fest `lmPrice` (`LM_MIN`: Kristallhöhle 25/60 min) und der Leuchtturm (`ITEMS.leuchtturm.cost` ist ein
    Getter → `leuchtCost`, 60 min; Kachelpreis zieht in `updateHud` nach) – fester Preis immer als Untergrenze. Alte
    Stände ohne `incPeak` vergessen `t.rate` unfertiger Baustellen (`parseSave`). Taler-Truhe 5 Minuten, Hafen-Bonus nur für
    `HARBOR_CAP` (3) Häfen. Neue Einkommensquellen immer gegen „Minuten Einkommen“ des nächsten Ziels prüfen.
59. **Tempo weit weg** (Block 31, seit Block 124 siehe Regel 124: bis Zoom ~2, Budget `PAINT_MS`): unter `SPRITE_FROM` (Zoom 1) kommen Gebäude und kleine Dekos aus fertigen Bildchen
    (`objSprites`, `spriteTile`/`spriteSmall`); gleich aussehende teilen sich eins (Häuser außer Hausboot, kleine Läden,
    Dekos), alles andere hat ein eigenes (Schlüssel mit Platz und `groundVersion`). Was das Aussehen ändert, gehört in
    den Schlüssel (`look` in `spriteTile`)! Nachtlicht beim Bildchen-Malen nur merken (`GLOW_SINK`), beim Einsetzen
    stanzen (`punchGlow`); `SPRITE_PAINT` zählt als live. Was sich sichtbar dreht, bleibt live (`SPRITE_LIVE`).
    Neumalen (Bildchen und Boden-Grundstücke) nur im Zeitbudget je Bild (`PAINT_MS`, `GROUND_MS`) – sonst das alte Bild.
    Rechnen: `rebuildCover` legt Nachschlage-Listen an (`BY_TYPE` je Sorte, `HOME_NEAR`, `BEET_NEAR`); Umkreis-Suchen ab
    3 Feldern über `nearList`, nicht Feld für Feld. Viertel (`computeNet`) mit Zahlen-Schlüsseln. Die Vorschau beim
    Bauen rechnet erst nach `HOVER_CALM` ms Ruhe auf einem Feld (sie rechnet die ganze Insel).
52. **„Das ist neu“** (`NEWS` in ui.js, Block 25): erscheint einmal pro Gerät (localStorage `kachelhausen_news`), nur
    mit Spielstand und erst, wenn kein anderes Fenster offen ist (`newsAfterLoad`); neue Spieler sehen es nie. **Vor jedem
    Push mit etwas Sichtbarem einen neuen Eintrag OBEN in `NEWS_HISTORY` setzen** (neue id, Datum, Titel, 2–5 Punkte; nur
    das Neue seit dem letzten Push; alte Einträge bleiben). Wer mehrere Updates verpasst hat, sieht alle (Block 99,
    `newsUnseen`): das neueste offen, ältere zum Aufklappen; ☰ → Das ist neu zeigt die ganze Geschichte. Ändert sich eine
    id noch vor dem Push, die alte unter `also` eintragen. Alte Einträge an neue Orte anpassen, wenn Dinge umziehen.
60. **Marktplatz** (Block 39): kein Gebäude mehr, sondern ein Platz aus Wegen mit Ständen (`STANDS`, `cat: 'markt'`,
    `needs: 'platz'`). Stände und `PLAZA_OK`-Deko (Brunnen, Statue, Pavillon …) dürfen auf ein Wegfeld; der Weg bleibt
    als `t.weg` (Stil) darunter – `wegUnder(t)` überall nehmen, wo „ist hier Weg?“ gefragt wird (`pathAt`, `pathArms`,
    `drawFlat`, `cachedPath`, Boden-Schleife). Abreißen/Aufnehmen legt den Weg zurück, Ablegen auf Wiese löscht `t.weg`;
    `serialize` schreibt Getragenes über den liegengebliebenen Weg (sonst doppeltes Feld, Zufallstest). `computeMarkets`
    (in `totals`, zuerst): zusammenhängende Wegfelder mit Ständen, Stufe nach `MARKT_STEPS` (3/6/9) → `MARKETS`,
    `MARKT_OK` (nur diese Stände zählen für den Wunsch „Marktplatz erreichbar“, `nearList`/`reachKind`). Wirkung: Läden bis
    `MARKT_REACH` Felder +`MARKT_BONUS` (`s.markt`, vor der Kaufkraft), Besucher `MARKT_ATTR` (`placeStats`), Markttag
    (`marktLeft`, `T.marktInc` in `earn`). Alte `markt`-Kacheln werden in `parseSave` zu Kopfsteinplätzen mit 3/6/9 Ständen.
124. **Bildchen-Budget** (Block 124): Neumalen weit weg zählt nur die Malzeit (`spriteSpent` + `groundSpent` ≤ `PAINT_MS`, immer
    mindestens ein Bildchen, höchstens `SPRITE_MAX`) – nie eine Frist ab Bildanfang (in großen Welten entstand damit nie ein Bildchen;
    gilt auch nachts). Fehlten im letzten Bild ≥ `CATCH_MISS` Bildchen, gilt `PAINT_CATCH` (Aufholen – live zeichnen kostet dann
    ohnehin fast dasselbe). Neue Bildchen werden am Anfang des nächsten Bilds gesammelt zugeschnitten (`cropSprites`), dort entsteht
    auch die Lichtmaske (`maskTodo`). Fehlen ≥ `PREP_MISS`, gilt `PAINT_PREP` und oben steht „Insel wird gezeichnet …“ (`prepShown`).
    **Feste Zoomstufen** (`zoomStep`, je 20 %): Bildchen und Boden immer in der nächstgrößeren Stufe malen (`sp.z = zs`), beim Einsetzen
    mit z / e.z verkleinern – nie wieder mit dem genauen Zoom malen (sonst malt jede Zwischenstufe alles neu). Beim Zoomen jedes
    vorhandene Bildchen weiterbenutzen (auch aus fernen Stufen, `near` 0.2–5), danach entstehen die scharfen im Hintergrund (`e.next`) und werden **alle zugleich** getauscht
    (`spriteSwapAll`, wenn keins der sichtbaren mehr fehlt, spätestens nach `SWAP_WAIT` Bildern; nachts erst mit Nachtbild) – einzeln
    getauscht lief eine sichtbare „Welle“ durchs Bild (`spriteStale`, `STALE_MS`);
    Bildchen bleiben ~2 Minuten (3600 Bilder) im Speicher. **Bis Zoom ~2** (`SPRITE_UNTIL`, bei DPR 2 bis z × DPR ≤ 2.6, gemalt in
    `spriteStep`) kommt alles Ruhende aus Bildchen; zwischen 1 und 2 (`SPRITES_NEAR`) bleibt Bewegtes live (`animLive(t)`: `ANIM_ITEMS`
    plus Stufe/Aussehen/Nacht, z. B. Häuser mit Aussehen 3/5; Linien mit Tor live). Wer etwas Neues mit Bewegung zeichnet, ergänzt
    `ANIM_ITEMS`/`animLive` (der Bestands-Test in tempo-schritt3 prüft alle Stufen, Aussehen, Sehenswürdigkeiten, Nacht).
    **Fassung statt Schlüssel**: Was sich mit dem Boden oder der Uhr ändert, steht nie im Bildchen-Schlüssel, sondern als `ver` an
    `getSprite` (`groundVersion` bei Bildchen mit Platz und Linien, Uhr-Takt bei `CLOCK_SPRITES`) – veraltete Fassungen werden weiter
    gezeigt und im Budget einzeln ersetzt (`SPRITE_STATS.old`), sonst fehlten nach jedem Bauen Hunderte auf einmal und blieben liegen.
    Bei voller Nacht gemalte Bildchen haben keine Lichtmaske (`noMask`) und werden zur Dämmerung neu gemalt. Kein Speicher
    (`getContext` null): `spriteFail` → `spritePause` (nichts Neues, Entbehrliches frei, nie Aufholen/Hinweis). Zuschneiden höchstens
    `CROP_MS` je Bild. Ersetzte Bildchen erst am nächsten Bildanfang freigeben (`spriteTrash`). Andere Pixeldichte (resize) und andere
    Welt (`adoptState` mit anderem `seed`, `startNew`) → `resetDrawCaches`; dieselbe Welt (Live-Spiegel) behält die Bildchen. Heckenbüsche weit weg
    über das Deko-Bildchen des Buschs (`wilmerBush`). **Weit weg zählt die Zahl der Zeichenbefehle** (am PC je Befehl einige µs): Linien je Feld als
    Bildchen (`spriteEdges`, über `EDGE_PROJ` um die Feldmitte, Schlüssel mit `groundVersion`), alle Wellen ein Strich (`drawWaves`),
    ✨/🐌 als Bildchen (`ICON_SPRITES`). Neues, das weit weg in Mengen vorkommt, nie Strich für Strich live zeichnen (zählen: Zeichenbefehle
    am Kontext je Bild mitzählen, z. B. drawImage/fill/stroke in einer Messseite). **Nie mitten im Bild aus einer Leinwand lesen** (`getImageData` wartet auf die Grafikkarte – am PC
    5–10 ms je Lesen, in der Cloud ohne Grafikkarte unsichtbar); Test in tests/tempo.test.js.
    Volle Nacht (`nightFull`, Schritt 4): Bildchen mit Licht bekommen ein **Löschbild** (`paintNight`: noch einmal auf eine volle schwarze
    Fläche gemalt, die Lichter stanzen sofort wie live = Wandschein; umgekehrt = genau das Loch, auch auf Dahinterliegendem). Einsetzen
    (`putNight`): Bildchen wie tagsüber, dann Löschbild (destination-out) – so stimmen auch halb durchsichtige Kanten (kein goldener
    Rand). Dafür merkt `paintSprite` das Malen (`e.paint`, Kachel als Kopie); der Rahmen ist der des zugeschnittenen Bildchens (kein
    eigenes Lesen). Die Löcher füllt drawNight mit **einer** warmen Fläche (`nightWarm`); blaues Licht (Kristall, Brunnen, Apotheke) hat ein
    Lichtbild als kleiner fester Fleck (`BLUE_SPOT`, gestanzt wird dann auch nur so groß, `punchGlow`); Bildchen nahe Blau bekommen ihre
    Scheiben und ihren warmen Schein vorher wie live (`nightPanes`), sonst würden sie blau. Halb durchsichtige Geister nie mit Löschbild.
    In der Dämmerung bleibt es Licht für Licht (Block 112).
    Was sich weit weg sichtbar bewegen soll, gehört in `SPRITE_LIVE`; alles andere (Rauch, Fahnen, Fontänen) steht im Bildchen still
    (Liste in tests/tempo-schritt3.test.js). Messen: `?messen`, tools/bench.js (Vergleich gegen eine Kopie in bench-base/), Testwelt
    `?welt=gross`. Leistungstests stellen die Spieluhr fest (`nightAt` und `gameHour`), sonst hängen sie an der echten Uhrzeit.
125. **Wege = Muster + Farbe** (Block 125): Ein Belag ist ein Text – alte Namen (`STYLES.weg`, feste Kombination mit eigenem Aussehen in
    `PATH_LOOK`) oder `'m:<muster>:<farbe>'` (`WEG_MUSTER`/`WEG_FARBEN`). Aussehen nur über `pathLook(id)`, nie `PATH_LOOK[id]`;
    gültig ist ein Belag über `isWegStyle`, freigeschaltet über `styleOk` (Muster: `wegMusterOk`, Farbe: `wegFarbeOk`). Wer
    Muster + Farbe wählt, bekommt über `wegStyleOf` den alten Namen, wenn es die Kombination schon gab (ältere Spiel-Fassungen kennen
    nur die). Neue Muster in `pattern()` im Weltraster (über Feldgrenzen durchgehend), feine Muster blassen weit weg aus (`patternFade`).
    Wer `pattern()` für Wegfelder im Raster ruft, gibt die Belagfarbe mit (`bg`: Ausblassen per Farbmischung) und setzt `patSeam`
    (Fuge auf der hinteren Feldkante zeichnet nur das Nachbarfeld) – sonst ist sie doppelt gemalt dunkler und man sieht jedes Feld.
    Neue Linienmuster mit festem Weltraster in `PAT_TILE` eintragen (Wiederholung in Feldern, muss 1 teilen oder ein Vielfaches sein):
    dann malt `patTileFill` sie als Kachelbild statt Strich für Strich (Ruckeln bei vielen Feldern). Zufallsmuster (hash) nicht.
    **Wegrichtung (Block 158):** Wegfelder merken sich `t.lauf` (0 entlang x, 1 entlang y; fehlt = alter Weg, Muster wie immer – nie für
    alte Wege raten, sonst dreht sich ihr Aussehen). Gedreht wird nur über `patRot` (in `pattern()`: Muster samt Weltraster um 90°), und
    nur `drawPath` setzt es (`wegPatRot`) – wer Wegbelag woanders zeichnet, setzt es nicht. Ein neues Muster mit Richtung kommt in
    `PAT_DIR` (0 längs zum Weg, 1 quer; sein Grundmuster liegt entlang x). Wer Wegfelder anlegt, dreht oder umzieht, setzt `lauf` mit:
    Neubau `wegLaufNew`, Gruppe drehen `groupPlaced`, nachträglich `wegLauf(t) ^ 1`. `t.rot` von Wegen hat zufällige alte Werte, nie dafür nutzen.
    Flächen von Wegfeldern überlappen an Kanten, wo es weitergeht, ~1 Gerätepunkt (`seamPad`/`padBorder`) – Nähte zeigt sonst nur
    Windows (am Mac nicht nachstellbar). Nachstellen von PC-Skalierung: `devicePixelRatio` per defineProperty setzen, dann `resize()`.
    **Leistungs-Wächter (Block 149):** `npm test` prüft je Bild (tests/leistung.test.js) und je Ding (tests/leistung-je-ding.test.js),
    dass nichts mehr Zeichenarbeit macht als bisher. Neues Gebäude/Deko/Belag → Test schlägt fehl, bis der Wert geprüft und mit
    `npm run leistung:neu` aufgenommen ist (in AUFGABEN.md begründen). Grenzen nie „einfach hochsetzen“, um grün zu werden – erst
    fragen, ob es billiger geht (Bildchen, `ANIM_ITEMS` nur für das Bewegte, Musterkachel). Vor Pushes mit Grafik-Änderungen den
    Messlauf (☰ → Grafik) im Browser ansehen. Brücken je Material und Ort messen mit dem Maler des Spiels (`bkDrawLagen` mit `gbAt`/`wbAt`/`bkAt`,
    Übergang `drawCrossing`; Schlüssel „Brücke …“, 160c G2) – nie über einen alten Zweig, den das Spiel nicht mehr nimmt. Nur die Je-Ding-Datei
    neu schreiben: `LEISTUNG_NEU=1 npx vitest run tests/leistung-je-ding.test.js` (leistung:neu schreibt beide), im Diff nur neue Schlüssel.
    **Bogenbrücken (Block 150):** Höhe/Bögen/Durchfahrt nur über `bridgeArch(x, y)` (gemerkt je groundVersion, recalc leert;
    null = flach). Gezeichnet werden alle Wasser-Wegbrücken (Bogen und flach) in der Feldschleife wie die Anhöhen-Brücken (160c D1, Regel 29a5 „Wasser-Wegbrücken“).
    **Brückenrichtung:** nur über `bridgeArmsAxis` (Gleichstand → Richtung eines eindeutigen Brückennachbarn). Neues an Brücken immer in **beiden** Richtungen testen (Ost-West und Nord-Süd), auch breit.
    **Wegmuster weit weg:** nie nur ausblenden – `patCoarse` macht Punkte/Steinchen gröber, `lookFar` mischt den Mittelton in die (deckende) Grundfarbe. Nie halbdurchsichtige Tonschichten über Wege legen (überlappende Feldränder → Linien). Am PC prüfen: `tools/vorschau/melden.js` holt echte Bilder vom PC.
    **Straßenlaternen (Block 132):** `strassenlaterne` in draw-schmuck.js (`drawStreetLamp`), Licht über `glowQuad` (Kopf: `pane`, Boden: `pool` = winzige Lichter mit großem Radius – so läuft es durch live/Bildchen/GL); Ausleger-Richtung nur aus `rot` (Bildchen-Schlüssel kennt den Platz nicht), immer in Feldrichtung (`A(k, h)`), nie waagerecht auf dem Bildschirm. Strom: in `computePower` doppelt gezählt.
    **Parkeisenbahn (Block 136):** Ringe über `computeParkRails` (PB_RINGS/PB_AT), Züge je Ring (`pbRuns.get(key).trains`, `parkTrainCars`; Liste `pbForms(R)` an einer Station als `t.pbz`, ohne Liste einer in der Form der ersten Station; ändern nur über `pbBuyTrain`/`pbSellTrain`/`pbSetModel`, Platz `pbRoom`, Abstand `pbFree`, Abriss `pbHandOver`); Wagen kurz vor einer Station hängen in deren Feld (render.js), sonst malt die Station über den Zug; Fahrgäste
    zeichnet `drawWalker` mit `seat`/`figS`/`sx,sy` – wer drawWalker ändert, prüft auch die sitzenden Figuren.
    Messen ohne `getImageData` auf der Hauptleinwand: Chrome schaltet sie danach auf Zeichnen ohne Grafikkarte um (falsche Zahlen).
144. **WebGL weit weg und Grafik-Einstellungen** (Block 144): `js/gl.js` zeichnet tags weit weg über `#world-gl` (Standbild `GLS`,
    Atlas `ATL`, Bewegtes über `glLive` in die Sammelfläche). Jedes Feld, das `glLive` braucht, ist im Standbild „lebendig“ und wird
    jedes Bild neu gemalt – teuer. Darum: was sich nur selten ändert (Uhren, Fähnchen), in den Schlüssel von `glCacheStart`, nicht
    live; was nichts zeichnet, gar nicht erst durch `glLive` schicken (Schienen ohne Übergang). `?messen` zeigt „Lebendige Felder“ mit
    Grund. Einstellungen je Gerät (☰ → Grafik, localStorage): `stillFar` (`kachelhausen_still`, Standard still: `STILL_FAR` weit weg
    als Bildchen mit `stillNow`, geteilte Deko-Bildchen ohne Ortsabhängigkeit), `kachelhausen_gl` (Standard an seit 08.10.2026, `'0'` = aus; `setGlWanted`, `?gl=0/1` geht vor),
    Bildrate. Pixelvergleich GL ↔ 2D: GL-Leinwand + `canvas` übereinander gegen `GL.off = true`.
    Nacht im GL-Bild: Löcher nur über `glOut`/`glOutQuad` bzw. drawImage mit destination-out (Deckkraft relativ zur Nachtstärke,
    `nightK()`), nur wenn `glOnWorld()` (nie beim Malen eines Bildchens). Die Lichtschicht steht einmal in `nightLights` (render.js)
    – 2D und GL nutzen sie; wer Licht ändert, ändert es dort. Was nach der Welt noch Lichter stanzt (Himmel), läuft nachts vor
    `glEnd` mit `GL.sky`. Das nächste Standbild entsteht im Hintergrund (`GLB`, `glBgStep`): Wer neuen Zustand einführt, den die
    Feldschleife je Bild füllt (wie `glows`, `icons`, `afterMovers`), muss ihn in `glBgStep` beiseitelegen und zurückholen.
143. **Nachtbilder auch in der Dämmerung** (Block 143): `nightPicOn()` (Licht an, weit weg) statt `nightFull()` für alles, was
    Nachtbilder nutzt; das Löschbild wird mit night/NIGHT_MAX eingesetzt, gemalt wird es immer mit voller Nacht (`paintNight`
    setzt `night`). Vor dem Einschalten wärmt `prewarm` die beleuchteten Bildchen vor – wer einen neuen Bildchen-Schlüssel mit
    `lit` baut, gibt `keyOf(lit)` und `make` an `prewarm` weiter. Ruckeln immer mit `tools/ruckeln.js` bei Full HD messen
    (das Fenster der App ist viel kleiner und täuscht), und auf die längsten Bilder schauen, nicht nur den Mittelwert.
142. **Ladeanzeigen als HTML, nicht ins Bild gemalt** (Block 142): `#loading` + `loadingUpdate()` (render.js) – Gründe zum Zeigen
    als Merker (`loadingStart`, `loadingVisit`, `prepShown`), nie selbst `hidden` setzen. Ins Bild Gemaltes bleibt stehen, solange
    ein Bild rechnet – genau dann, wenn man Rückmeldung braucht. Jede neue Warte-Situation (z. B. Cloud-Übernahme) bekommt einen
    Merker mit Höchstdauer, damit der Kreisel nie für immer stehen bleibt.
141. **Freundesbuch** (Block 141, friends.js): Anzeigen nur über `bookPeople()` (Zähler `statsAll` + noch nicht gezählte Einträge,
    `at > u[k]`), nie Einträge direkt zählen – sonst fehlt alles Aufgeräumte oder zählt doppelt. Aufräumen nur über `bookFold`
    (erst zählen per Transaktion, dann löschen). Lange Listen: wenige zeigen, Rest mit `hidden` und „mehr anzeigen“ – das ganze
    Buch lädt jedes Gerät beim Start, also nie unbegrenzt wachsen lassen. Neue Arten im Buch: in `BOOK_KINDS` und in die Regeln.
137. **Umbauen: bezahlt bleibt bezahlt** (Block 137): Wer ein Gebäude größer/kleiner/anders macht, merkt sich das Höchste, was je
    bezahlt wurde (Schloss `t.price`, Bahnhof `stationLenPaid`/`t.lenPaid`, Hbf `gleisePaid`/`t.gleisePaid`), kassiert nur darüber
    und gibt beim Verkleinern nichts zurück. Abriss erstattet die Hälfte des Bezahlten. Neue Umbau-Möglichkeiten genauso, nie
    „halb zurück und beim Zurückbauen wieder voll“ (das kostete beim Schloss jedes Mal Millionen).
129. **Souvenirs** (Block 129, js/souvenir.js): Gibt es nur geschenkt (`mail/<to>/<id>.sv`, einmal am Tag je Freund, kostenlos).
    Abholen legt sie über `svReceive` ins Regal (`state.souvenirs`, Fremddaten immer durch `svClean`). Aufgestellt sind sie
    Deko `{ b: 'souvenir', sv: id }`; ob eins steht, nur über `svPlaced()`/`svFree()` aus den Dekos ableiten, nie merken
    (Abreißen, ↶, Verschieben stimmen so von selbst). `ITEMS.souvenir.gift`: nicht in Leiste, Suche, „zuletzt gebaut“,
    „Neu freigeschaltet“, kein Rechteck-Bauen; `available` nur mit gewähltem freiem `svPick`. Wer kopiert (Block 134), darf
    Souvenirs nicht verdoppeln. Zeichnung hängt an Art/Farbe/Flagge/Tier – steht in `decoVariant` (Bildchen-Schlüssel).
    Rohstoffe schickt man nur noch für einen Wunsch (`mailCompose` mit wish, höchstens was fehlt); was ich geschickt habe,
    merkt `wishSent` (zählt mit, bis der Freund abholt). Päckchen mit dem gewünschten Rohstoff füllen den Wunsch auch ohne
    `wish`-Merker (alte Versionen).
130. **Online-Status** (Block 130, friends.js unten): `on/<uid>` = { at (Serverzeit), play } – nur über `onlineBeat(play)`
    schreiben (meldet sich jede Minute, setzt per `onLeave`/onDisconnect play false für den Fall, dass die Seite einfach weg
    ist; nach jedem Verbindungsabbruch neu scharf). Anzeige nur über `onlineText(o, serverNow)`/`onlineHtml`: grün nur bei
    `play` **und** frischer Meldung (`ON_FRESH`) – ein schlafendes iPad meldet sich nicht zuverlässig ab. Fehlt die Meldung
    (alte App-Version), nichts anzeigen, nie „offline“ raten. Lesen dürfen nur Freunde (firebase-rules.json).
131. **Bahnhofslänge** (Block 131): `sizeOf('station', rot, t)` immer mit dem Feld t (ohne t gilt die Wahl für neu Gebautes,
    `stationNewLen`). Neue Felder mit variabler Größe brauchen: `sizeOf`, `drawBuilding` (da/wb), Bildchen-Schlüssel, `tileOut`.
127. **Vorplätze nur über `courtPartsAt(t, x, y)`** (Block 127), nicht `courtParts(C0)`: Vor schmalem Weg wird der Platz zum Weg
    zur Tür in Wegbreite. Zeichnen, Wegfeld-Stücke (`courtOf`) und Fenster müssen dieselben Stücke nehmen.
126. **Linien-Aussehen nur über `edgeLook(e)`** (Block 126): färbt Hecken in Buschfarbe (`e.col`, BUSH_COLS). Wer eine Linie
    zeichnet, nimmt nie `EDGE_LOOK[b][style]` direkt, sonst fehlt die Farbe.
118. **Hauptbahnhof-Halle** (Block 118/121/123): Die Halle steht immer in der Mitte: Gleis – Steig – Halle – Steig – Gleis,
    rechts der Halle gespiegelt (`hbfPlatS(t, g)`: Bahnsteig bei +1 oder −1 vom Gleis). `t.wing = 2`, `t.mid` = Gleise links,
    neu gebaut mit `HBF_NEW` (auch Vorschau und Symbol). Lage nur über `hbfTrackB(t, g)`, `hbfPlatS`, `hbfHallB`, `hbfPortalB`;
    im Spiel über `gleisTiles`/`hbfEntrance`. Gleise dazu/weg nur über `hbfResize(k, d, side)` (Anker so, dass ein bleibendes
    Gleis seine Ausfahrt behält; `t.gleis` wandert mit). Alte Stände (v < 13) stellt `hbfUpgradeAll` beim Laden um; ein alter
    Bahnhof ohne Halle (kein Platz daneben) bleibt, bis man im Fenster umbaut (`hbfUpgrade`). Seitenflügel (±1) gelten als Mitte.
117. **Gruppe tragen und drehen** (Block 117): Eine Gruppe (`moving.kind === 'group'`) hat Rahmen W×H und Drehung r; wo ein Ding
    landet, sagt nur `groupPlaced(it)` (Punkt drehen: `grot`, gleiche Richtung wie `kitTurn`, Dinge rot + r; Bank am Wegrand
    `midRot`). Neue Arten in der Gruppe (Rasen `ground`, Linien `edge`) brauchen: aufnehmen, `groupErrors`, `dropGroup`,
    `cancelMove`, `serialize` (am alten Platz speichern) und die Vorschau.
115. **Figurengröße** (Block 115): Figuren werden in `drawWalker` um den Fußpunkt auf `FIG_SCALE` verkleinert. Wer etwas über
    oder an der Figur platziert (Schild, Blase, Antippen), rechnet mit `walkerHead`/`figScale`, nie mit festen z-Abständen.
113. **Ebenen** (Block 113): Fenster `#modal` z 40. Was aus einem Fenster heraus Rückmeldung gibt und nicht antippbar ist
    (Toast, Konfetti), liegt darüber (z 50, `pointer-events: none`). Neue feste Einblendungen bekommen immer einen z-index.
112. **Nachtlicht in Bildchen** (Block 112): Bildchen (weit weg) setzen Licht wie live ein: Schein vor dem Bildchen, Scheiben
    über die Lichtmaske (`lightMask`) danach – sie behält nur Pixel, die seit `glowQuad` unverändert sind (Kopie in
    `GLOW_ATLAS`, `glowSnap`). Wer leuchtet, ruft `glowQuad` also NACH dem Malen des Leuchtenden auf (wie `windowOn`).
    Schiffe unter Brücken: Deck darüber, danach alles, was auf der Brücke fährt, noch einmal (`drawMover`).
111. **Name für Freunde** (Block 111): Was Freunde von dir sehen (Freundesliste, Päckchen, Gästebuch, Danke), immer über
    `myNick()` (Name auf dem Schild, sonst Vorname aus dem Konto) bzw. beim Besuch `visitName()` (Profil `users/<uid>/profile/name`)
    – nie `cloudUser.display` direkt. Neues von Freunden: `netCount()` (Zahl am 🌐, `netDotShow`), Karte `welcomeBack` einmal
    je Konto und Stand (`frLS('wb_'+uid)`).
110. **Kein Seiten-Zoom** (Block 110): html/body haben `touch-action: pan-x pan-y`, Gesten/Strg-Mausrad fängt input.js ab.
    Wer etwas Eigenes mit Gesten baut (wie die Karte), gibt dem Element `touch-action: none` und behandelt Zeiger selbst.
109. **Gleis-Stile** (Block 109): Das Gleisbett ist eine Form in `DECO_LOOKS.schiene` (`t.form`, Zeichnung `RAIL_LOOK` über
    `railLookOf`, auch auf Brücken; Gleise im Hauptbahnhof im Stil der Strecke vor dem Gleis, `hbfTrack`). Gleise liegen im Boden-Bild: wer `t.form` an Gleisen ändert, zählt
    `groundVersion` hoch. Neu Gebautes bekommt Form/Farbe nur über `decoLookNew` – `paintNewOf` liefert nur Wand/Dach/Fenster.
    Keine Oberleitung mehr (kein Draht, keine Masten, kein Stromabnehmer).
106. **Stadtschmuck** (Block 106): Formen/Farben nur über `DECO_LOOKS` (Index = gespeicherter Wert, nie umsortieren – neue
    hinten anhängen), freigeschaltet über `lookOk` (frei oder `b:form:id`/`b:col:id` in `state.design`), neu Gebautes über
    `decoLookNew`. Wer Deko zeichnet, die Form/Farbe hat, nimmt `form` in den Bildchen-Schlüssel (spriteSmall/spriteTile).
    Online-Dinge gehören unter 🌐 (`openNet`), nicht mehr unter „Du“.
105. **Füreinander** (Block 105, friends.js unten): Freundschaftspunkte nur über `bondAdd` (eigene Aktion) bzw.
    `bondFromBook` (Empfangenes, Transaktion mit `seen`) – nie Punkte im Spielstand führen; dort nur die höchste Stufe
    `state.bond` (nie kleiner, `bondSync`). Belohnungen mit `bond: n` (ITEMS, WEAR_NEED). Wunschzettel nur der Besitzer
    (`worlds/<wid>/wish`, owner mitschreiben), Päckchen dafür mit `wish: true`. Wer neue Felder in book/mail/worlds schreibt,
    ergänzt firebase-rules.json (feste Felder, `$other: false`) und gibt dem Nutzer die Regeln zum Einfügen.
103. **Fenster mit Reitern** sind immer gleich groß: Reiter als `<div class="looks hall-tabs">` **direkt im Fenster** (nicht in
    einer Hülle) – dann packt `frameHtml` alles danach in `.tab-scroll` (nur das scrollt), `modalFrame` setzt die feste Höhe.
    Nie `position: sticky` für Reiter (federt auf dem iPad weg). Neue Fenster mit Reitern genauso bauen, keine eigene Breite je
    Reiter (Fensterbreite über `you-win`/`help-win`/`hall`/`research`).
101. **Spieluhr** (Block 101, render.js): Tageszeit nur über `gameHour()` / `nightAt()` / `dayPart()` / `timeOfDay()` /
    `clockNow()` – alle aus `Date.now()` (1 Minute = 1 Spielstunde), nie aus `performance.now()` (das wäre wieder je Gerät
    und ab dem Öffnen). Etwas nur nachts: `nightAt() >= NIGHT_MAX - 1e-9`, nie eine feste Zahl über `NIGHT_MAX`.
    `?stunde=N` stellt die Uhr zum Ausprobieren fest.
100. **Wegflächen nahtlos** (Block 100): Volle Ecken über `quadPaved` (Weg außer Trittsteinen, dazu das Rathaus). Muster mit
    Einzelpunkten (`dots`, `stones`) liegen in einem Raster über die ganze Insel (globale Indizes, `hash(i, j)`) – nie
    wieder ein Raster je Feld, sonst halbe Steine an jeder Kante. Bordstein am breiten Weg nur, wo wirklich Wiese anschließt.
99. **Ladereihenfolge**: Die Spielschleife (`frame`) startet erst bei `DOMContentLoaded` – nach main.js kommen noch
    cloud.js, live.js, friends.js, me.js. Wer aus Bild/HUD etwas aus diesen Dateien aufruft, verlässt sich darauf;
    Code, der beim Laden selbst läuft, darf nichts aus späteren Dateien aufrufen (im langsamen WLAN fehlt es dann).
98. **Drei feste Orte** (Block 98): 🏛️ Rathaus = die Stadt (`HALL_TABS`: Übersicht, Zu tun, Bewohner, Inseln, Ort).
    Knopf „Du“ = der Spieler (`openYou`, `YOU_TABS`: Figur, Erfolge, Album, Tagebuch, Freunde, Online) – Album,
    Tagebuch, Freunde und Online sind eigene Fenster und setzen `youHead(tab)` oben ein. ☰ = Hilfe-Buch (`openHelp`,
    `HELP_BOOK`: Anleitung, Tipps, Nachschlagen, oben `helpTop` mit Suche) und Einstellungen/Spielstand. **Jedes
    Fenster gibt es an genau einer Stelle** – Neues dort einhängen, wo es hingehört, nicht als zusätzlichen Knopf
    irgendwo. Alte Sprungziele (`openTownHall('erfolge'|'besuch'|'figur'|'ready'|'wishes')`) leiten über `HALL_MOVED`
    weiter. Neues für den Spieler zeigt der Punkt am Knopf „Du“ (`youNews`) und am Reiter (`youMark`).
97. **Deine Figur** (Block 97, js/me.js): Aussehen nur über `meLook()` lesen (prüft alles, lässt nicht Verdientes weg) und
    `setMe(patch)` schreiben (speichert, `cloudTouched`, kopiert ins Profil `users/<uid>/profile/{animal,look}`). Neue
    Kleidung: zeichnen in `drawWear`/`drawWearBack` (movers.js) und in `WEAR` eintragen; Besonderes in `WEAR_NEED` (Erfolg +
    Stufe oder Sterne). `state.me` liegt im öffentlichen Rest des Live-Spiegels (Besucher sehen die Figur des Gastgebers);
    beim Besuch (`VISIT`) gehört `state` dem Gastgeber – die eigene Figur kommt dann aus dem Profil (`friendLook`).
    Tipps der Figur (`meTip`) nehmen dieselben Quellen wie Ziel, Rathaus und Nachschlagen – keine eigenen Regeln erfinden.
95. **Live-Spiegel, Besuch, Freunde** (Block 95, js/live.js): Was im Spielstand neu dazukommt, ordnet `liveSplit` zu – große
    Karten in `LIVE_MAPS`, Laufendes in `LIVE_ECO`, Privates (nicht für Besucher) in `LIVE_PRIV`, Gerätekram in `LIVE_LOCAL`,
    alles andere landet im öffentlichen „Rest“. Besucher sehen nur `worlds/<wid>` – Privates nie dort hineinschreiben.
    Besuchsmodus (`VISIT`) speichert nie (wie die Testwelt); Sperren über `viewOnly()`. Regeln: firebase-rules.json – bei
    neuen Pfaden dort ergänzen und dem Nutzer zum Einfügen geben.
93. **Online-Speicher** (Block 93, js/cloud.js): Nur über `cloudApi` (Adapter; im Test eine Attrappe) und die Regeln in
    `cloudDecide` (reine Funktion, Tabellentest). Nie hochladen ohne `claim` gegen die bekannte `rev`; eine leere Welt
    (`freshSum`) nie über eine bespielte; bevor eine andere Welt (`sum.seed`) die Cloud ersetzt, die alte in die Sicherungen.
    Eigene Aktionen zählt `undoCommit` (`cloudTouched`) – wer Spielerisches ohne `undoable` ändert, ruft es selbst.
    Wer den ganzen Stand ersetzt (Neue Insel, Datei laden), ruft `cloudNewWorld()`. Neue Felder im Spielstand müssen
    `parseSave` auch für Cloud-Stände verkraften (dieselbe Datei wie im Browser).
    Stufe 2 (Block 94): Wer etwas am Spielstand ändert, prüft vorher `cloudWatching()` (zuschauendes Gerät) – `undoable` und
    `setTool` tun das schon; die Spielschleife rechnet nur, wenn nicht zugeschaut wird.
92. **Hilfe am Ort** (Block 92, js/help.js): Was Spieler nicht verstehen könnten, bekommt `data-help="res:…|wish:…|term:…|b:…"`
    (`helpAttr`) – ein Klick öffnet die Sprechblase, ohne eigene Verdrahtung (Listener am Dokument, übersteht das Neuzeichnen).
    Rohstoffe und Gebäude erklärt `helpEntry` aus den Spieldaten; neue Wünsche brauchen einen Text in `WISH_HELP`, neue Begriffe
    in `TERMS` (hilfe.test.js prüft Vollständigkeit und Verweise). Kosten mit Material über `costSpans`/`missMatHtml`.
91. **Vorplatz / Weg zur Tür** (Block 91): Türen größerer Gebäude stehen in `COURTS` (rules.js, eigener Rahmen: `a` Beginn,
    `b` Türmitte und `w` halbe Breite = schmaler Weg bzw. `p` = Platz quer, jeweils bis an die Vorderkante; mehrere Stücke über `parts`,
    gelesen nur über `courtParts`). Sieht ein Bild mit Vorplatz anders aus (Büsche, Rasen), fragt es `courtShown` – und der Bildchen-Schlüssel kennt das. Gezeigt nur mit Weg direkt vor der Tür
    (`courtOf`: Wegfelder der vorderen Reihe, `links` mit dem Stück quer `q0…q1` wie `armUV`), Belag = `t.vp` oder Stil des Wegs
    (`courtStyle`), aus mit `t.zug === false` (wie der Gartenweg). Gezeichnet im Boden-Durchgang (`paveCourt`, `hasGroundPart`);
    das Stück auf dem Wegfeld zeichnet der Weg selbst (`courtLinksAt` → Stummel, beim breiten Weg Lücke im Bordstein).
    `own`: Gebäude mit altem festem Platz zeichnen ihn über `courtFloor(K, t, x, y, classic)` – ohne Weg/Wahl wie früher, mit `bare` dann gar nicht.
    Wer eine Tür verschiebt oder ein neues Gebäude mit Tür baut, trägt sie in `COURTS` ein (vorplatz.test.js prüft Drehungen).
90. **Buschfarben** (Block 89): Farbe eines Busches (Deko `d.col`, Busch-Feld `t.col`, Wilmer-Linie `e.col`) = Index in `BUSH_COLS`;
    gezeichnet nur im Fall `'busch'` (auch die Wilmerhecke ruft ihn). Frei/gekauft über `bushColOk`, für Neues `bushColNew('busch'|'hecke')`.
    Wer neue Deko-Eigenschaften einführt, nimmt sie in `serialize` (Deko-Felder werden einzeln übernommen!) und ggf. in den Bildchen-Schlüssel auf.
89. **Hauptbahnhof** (Block 85): Jedes Gleis ist ein `K.scene`-Stück (Prellbock, Bahnsteig mit Ausstattung, zuletzt das Dach) –
    Dinge, die übereinander liegen, nie als getrennte Teile sortieren lassen. Empfangsgebäude: Portal mit Uhrturm bei b = 0
    (halbe Breite `PW`), Flügel je Gleis ohne den Portalbereich. Eingang nach außen (−a), davor `hbfEntrance(t, x, y)`.
    Zum Nachsehen im Browser nach `npm run bump` die Seite mit neuer Adresse laden (z. B. `&n=…`), sonst kommt die alte
    index.html aus dem Zwischenspeicher.
88. **Oberfläche** (Block 84e): `#modal` liegt über Lager und Erfolgs-Band (z-index 40). Inline-Werte, die nur in einer Breite
    gelten (Panel-`top` über 600 px), auch wieder entfernen. Wisch-Erkennung immer mit `pointercancel` und Zurücksetzen beim
    nächsten `pointerdown`; `fastTap` löst nur ohne Bewegung aus. „Zum Rathaus“ über `townHallAt()`.
87. **Zeichnen robust** (Block 84d): Unter dem Bildrand bleiben die vordersten Felder großer Gebäude bis `mBig` (420·z) in
    `visible` (`bigFront`), sonst fehlen hohe Gebäude streifenweise. Filter für flache Teile prüfen die ganze Fläche
    (`want([ax, ay], w, h)`), Züge in der Halle hängen am ersten sichtbaren Hallenfeld (`hallFirst`). Was flache Teile hat,
    steht in `GROUND_TYPES` (auch Bahnhof, Glashaus). Bildchen-Schlüssel: Würfelfarbe mit „r“, Reihenhaus-Hashes, Rathaus-Flagge;
    `spriteTop` wächst mit der Fläche, `SPRITE_PAD` für seitlich Überstehendes. Zeichnen eines Gebäudes, Streifen-Ausschnitt
    und Boden-Grundstück immer mit `try/finally` (sonst bleibt ein Ausschnitt oder `g` auf einer fremden Leinwand hängen).
    Dasselbe Licht zählt in `glowCells` nur einmal. Die Bau-Vorschau bekommt dieselben Eigenschaften wie `build` (Farben, `cs`, `fl`).
86. **Fortschritt und Anzeigen** (Block 84c): Was eine Laterne freischaltet, nur über `lmUnlockNames(type, i)` (Liste plus
    alles mit `lm: 'typ:stufe'`). „Ist hier Weg?“ auch in Wünschen über `wegAt`. `incPeak` nicht runden (sonst sinkt es bei
    60 Bildern/s nie). In `totals` steht `pop` vor den Stufen schon mit allen Faktoren. Wunder-„auf alles“ gilt für prod, conv
    und Verkauf. Faktoren in der Leiste über `fmtMul` (Komma, gerundet). `dt` nie negativ. Neue Sorten, die Größen bekommen,
    brauchen einen `KINDS`-Eintrag, sonst zählen die Größen nicht. Bewohner warten vor einer geschlossenen Schranke
    (`walkable(x, y, open)`). Album: Boden (Park, Freizeitpark) zählt über `state.terra`, Pinsel beim Benutzen.
85. **Bauen und Erstatten** (Block 84b): Geländebedingungen nur über `needError` (gilt auch für Betriebe auf einem Weg).
    `placeError` prüft Linien quer durch Mehrfeld-Gebäude, Seitenmitten-Deko (4–7) unter 1×1-Gebäuden, Dekos beim Teichgraben;
    Rathaus/Sehenswürdigkeit/Truhe (`fixed`) lassen sich nur verschieben. Beim Verschieben werden keine Übergänge gebaut
    (`opts.move` → „Hier steht schon etwas“), Brücken prüft auch `moveError`, Meer-Felder holt `claimSea` (Bauen und Ablegen).
    `demolishInfo` zählt Hausausbau (`HOUSE_STAGES`), Schiffe (voll zurück) und Einwohner wie `totals` (`popOf` × Faktoren).
    Kleine Deko zurückgeben nur über `payBackDeco`/`decoBack` (`d.free`: geschenkte Parkbäume bringen nichts). `buildEdge`
    erstattet die überzogene Linie. `setTool` setzt die eigene Drehung nur beim Werkzeugwechsel zurück (und bei `look`).
    ✋ in Gebäudefenstern: `startMove(x, y, -1)` (das Gebäude, nicht die Eck-Deko). Jedes Fenster bekommt eine `live`-Funktion;
    `undo` ruft sie sofort auf.
84. **Laden, Tragen, Rückgängig** (Block 84a): Start und Import laufen beide über `afterLoad()` (Umstellungen, still zählen,
    `resetUndo()`); `startNew` ruft `resetUndo()`. `fitFootprints` läuft nur mit `state.fitBig` (parseSave, alte Versionen) –
    wer Größen ändert, erhöht die Spielstand-Version. Erstattet wird über `fullValue(t)` (bezahlter Preis `t.price`/`baseCost`,
    Ausbau). `pickUp`/`pickUpGroup` heben nichts auf, solange etwas getragen wird; wer aus einem Fenster verschiebt, ruft vorher
    `cancelMove()` (setzt auch `undoPending` zurück). Beim Ablegen zählen Taler/Lager erst ab dem Ablegen (`undoable`).
    Was sich nicht zurücknehmen soll (Laternenfest), setzt `undoCut` – der Schritt leert den Stapel. `undo` prüft die Grundfläche
    wiederhergestellter Gebäude gegen `COVER`. Aufschütten nie unter Gebäuden und nie vor dem letzten Wasser eines Ufer-Gebäudes.
    Kann ein unlesbarer Stand nicht kopiert werden, speichert `save()` nichts (`saveBlocked`), bis er als Datei gesichert ist.
83. **Leuchtturm-Kap** (Block 83): Der Leuchtturm ist 3×3 (`ITEMS.leuchtturm.size`), Bild `BIG_ART.leuchtturm` (wird live gezeichnet:
    Strahl). Alte 1×1-Leuchttürme tragen `t.mini` (sizeOf → 1×1, altes Bild); beim Laden (v12, `growLighthouses`) und im Fenster
    (`growLighthouse`) wachsen sie, wo Platz ist. `fitFootprints` lässt `t.mini` in Ruhe. Feuerwerk: beim Bau und nachts (`lightFireTick`).
    Beim Einfügen von Kommentaren per Skript nie mitten in eine Zeile mit mehreren Deklarationen (`const a = …, b = …`) – der
    Rest der Zeile wird sonst Kommentar (zweimal passiert: Blöcke 77 und 83).
82. **Rechtsklick** (Block 82): Das Kontextmenü des Browsers ist im ganzen Spiel aus (`contextmenu` am Dokument), nur Texteingaben
    behalten es (`keepContextMenu`). Neue Bedienelemente brauchen dafür nichts; keine eigenen `contextmenu`-Handler mehr anhängen.
81. **Daneben tippen** (Block 81): Große Fenster (#modal) schließen nur, wenn man daneben drückt **und** daneben loslässt
    (`modalPressOut`/`modalUpOut`) – wer im Fenster Text markiert oder einen Regler zieht, behält es. Seitenfenster (#panel)
    schließen beim Ansehen, wenn man auf „nichts“ tippt (Rasen, Wald, Fels, Wasser, Meer); auf etwas anderes getippt wechselt
    das Fenster dorthin. Neue „nichts hier“-Zweige in `tap` rufen deshalb `closePanel()`. Test: `tests/daneben.test.js`.
80. **Dinge auf Wänden** (Block 80): Uhren über `faceClock(F, t, up, r, z, …)` – schert das Zifferblatt auf die Wand. Nie einen
    Kreis (`circle`/`arc`) direkt vor eine schräge Wand malen; für anderes Rundes auf Wänden dasselbe Scheren (`onFace` in shopart/e.js).
79. **Wegform** (Block 77): `t.wide` ganz breit, `t.sq` eckige Kurve, `t.end` Ende ('rund' | 'rand', fehlt = automatisch).
    Zusätzliche Arme bis ans Gebäude bzw. an den Rand nur über `pathEnds` – nie in `pathArms` (das nutzen Bewohner, Deko-Plätze
    und Kurven). Neue Wege bekommen `wegShapeNew()` (Schalter `wegShape` in der Musterleiste), Umstellen über einen alten Weg
    über `applyWegShape` und kostet nichts. Wer Kurven auswertet (Deko-Plätze, Mittellinie, Trittsteine), beachtet `t.sq`/`t.wide`.
    Block 78: Gartenweg zur Tür über `gardenPath` (`t.zug === false` aus). (Wegseiten bis ans Gebäude gab es kurz – auf Wunsch
    wieder entfernt; `t.fs` in alten Ständen wird ignoriert.) Häuser/Läden teilen sich Bildchen: alles, was ein Haus je nach
    Umgebung anders zeichnet, gehört in den Bild-Schlüssel (`spriteTile` in render.js).
78. **Märchenschloss-Formen** (Block 74): `mt` Mitte (0 Block, 1 Turmgruppe), `mf` Mittelturm rund, je Turmpaar `f` rund.
    Fehlende Werte bedeuten Block/eckig (alte Schlösser bleiben, wie sie sind); neue Schlösser starten über `csNew()`.
    Runde Türme über `castleKit(...).tower(…, round)` bzw. `roundTower` – gleiche Maße wie eckig. Im Mittelteil zeichnet
    `inOrder` nach Tiefe (Ecken, Mittelturm, Torbau-Türmchen); neue Teile dort einreihen, nicht einfach hinterher malen.
    Balkone und Kränze nur über `balconyRing` (erst `back: true` vor dem Turm, dann vorn danach) – keine eigenen Ringe.
    Bänder um runde Türme (Gold, Handlauf, Rand) über `arcBand`, nie als Strich auf einer Ellipse (läuft seitlich spitz aus).
77. **Farbe wählbar** (Block 72): Gebäude mit eigenem `paint(t, …)` stehen in `PAINTABLE`; alle anderen nennen in
    `REPAINT[id]` ihre Hauptfarben (`wall`/`roof`, je '#hex' oder ['#hex', Tönung], `names` für die Reihen, ohne `roof` nur
    eine Reihe). `drawObject` setzt dafür `REPAINT_MAP`, `C()`/`shade()` tauschen genau diese Töne. Neues Gebäude: Eintrag
    neben seinem Bild, `tests/draw.test.js` prüft, dass die Wahl wirkt. Markise, Schild, Glas, Wasser nie eintragen.
    Farben für viele (Block 73): Farbschlüssel nur über `PAINT_KEYS`/`paintOf`; wer Farben setzt, ruft `rememberPaint(t)`
    (neu Gebautes bekommt `paintNewOf(b)`, `state.paintNew[b] === false` = abgeschaltet, Häuser nur nach eigenem Einschalten).
76. **Antippen beim Ansehen** (Block 71): Was getroffen ist, entscheidet `objectAt` (malt jedes Ding in ein winziges Bild um
    den Finger, `inkAt`; vorderstes Flächiges gewinnt, Dünnes nur über leerem Boden), Schilder über `pillHits` (`pill()` gibt
    seinen Kasten zurück). Neue Gebäude brauchen dafür nichts, solange `spriteTop` ihre Höhe abdeckt (Vorfilter × 1,4).
    Abreißen/Verschieben/Bauen bleiben beim Bodenfeld – dort zeigt die Vorschau das Feld.
75. **Wegbrücken** (Block 66): Ob ein Weg eine Brücke ist, nur über `isWegBridge(t)`/`isBridgeAt`. Wer Wege neben Wasser
    setzt, geht über `placeError` (prüft `bridgeShapeError`: vom Ufer aus, nur gerade); Pläne setzen dafür `PLANNED`.
    Bezahlt wird `WEG_BRIDGE[bridgeKind(t)]` – wer die Art ändert, über `setBridgeKind` (sonst stimmt das Erstatten nicht).
    Art und Farben immer für die ganze Brücke (`bridgeSpan`), nie für ein einzelnes Feld.
74. **Deko-Plätze** (Block 46/65): 9 je Feld – 0–3 Ecken, 4–7 Seitenmitten, 8 = Eckpunkt (obere Ecke des Felds, geteilt mit drei
    Nachbarn). Wer Plätze durchgeht, nimmt `SLOTS`, nie 8; wer Ecken-Plätze belegt, prüft `postAt(...cornerVertex(...))`; wer
    an Feldecken baut (Gebäude, Linien, Wasser), prüft `postAt` der Ecken. Lage nur über `slotPos`.
73. **Preise nach Einkommen** (Block 61/63): nur über `incScaled(min, ref)` rechnen (bis `ref` lineare Minuten, darüber Wurzel –
    nie `min × Einkommen` direkt). `fzMin`/`incMin` + `incRef` (`INC_MIN` am Ende von data.js) machen `ITEMS[b].cost` zum
    Getter, der feste Preis bleibt Untergrenze (`baseCost`). Neue Bezugswerte aus der Bot-Messung (`tools/sim-bots.js`). Wer so etwas baut, merkt `t.price`; Erstatten
    ohne `t.price` nur nach `baseCost` (sonst Geld-Trick mit alten Gebäuden). Wunder-Preise fürs Menü über `wonderTotal`.
72. **Freizeitpark** (Block 60): Boden 'fz' (`TERRAFORM.fzboden`), darauf nur `fzOk` (Module `cat: 'fz'`, Deko, Wege,
    Linien); Module brauchen `needs: 'fz'`. Preis-Getter über `fzMin` (wie Leuchtturm); wer ein Modul baut, merkt `t.price`,
    `demolishInfo` erstattet danach. Stufe/Wirkung nur aus `computeFz` (`FZPARKS`, `fzBest`, `FZ_*`). Neues Modul: ITEMS-
    Eintrag mit `fzSort`, Bild in drawObject, Freischalt-Text, Menügruppe 'fzpark'. Märchenschloss = EIN Gebäude mit
    Gestalt `t.cs` (Größe nur über `csOf`/`sizeOf`/`csRing`, ändern nur über `castleChange`: prüft Platz, Preis, Wege
    darunter; neue Felder in `CS_DEF` + `CS_LIM`, alte Speicherstände liest `csOf`; Teile nie in b überlappen lassen);
    Eingang = Torturm-Paar (`TOR_PAIR`, zählt erst als Paar). Was ein Bild verändert, gehört in den Sprite-Schlüssel
    (`spriteTile`: `t.cs`, `t.win`, `t.fl`), sonst sieht man es von weitem nicht.
    Schloss-Bausteine (Fenster, Zinnen, Türme, Kuppeln, Wappen) nur über `castleKit` – Märchenschloss und Wunder-Schloss
    teilen sie. Das Wunder-Schloss muss immer prächtiger bleiben als jedes Märchenschloss (Block 60j).
    Fenster frischen sich ständig auf: Zustände wie eine Löschen-Rückfrage außerhalb des DOM merken (`delSure`).
71. **Tore** (Block 59): Tor = `isGate(k)` (Weg auf beiden Seiten `pathGate` oder `e.gate`). Ein Tor ohne Weg (`gardenGate`)
    bekommt ein Türchen (`gateDoor`). Wer Linien neu setzt/umfärbt (`buildEdge`), übernimmt `arch`, `gate`, `flush`.
70. **Dinge auf Wegen** (Block 58): Ob etwas auf einen Weg darf, sagen `plazaOk(b)` (Deko/Stände: Weg bleibt darunter) und
    `replacesWeg(b)` (Gebäude: Weg weg, Taler zurück). Wege unter einem Ding: `pathsUnder` beim Bauen/Ablegen, `setUnder`
    speichert sie (`t.weg` + `t.wegs`), `restoreUnder` legt sie zurück. Weg auf einem Feld nie über `state.tiles.get(k).weg`
    lesen, sondern `wegAt(x, y)` (auch unter großer Deko); Flaches zum Zeichnen über `flatAt`.
69. **Weg bündig an Linien** (Block 57): Ob ein Weg bis an eine Hecke/Zaun/Mauer reicht, nur über `edgeFlush(k)` (Linie
    `e.flush` an/aus, sonst automatisch nur am Park). Umschalten mit `setFlush` (ganze Linie über `edgeRun`, `groundVersion++`).
68. **Tiere in der Natur** (Block 56): nur Bild und Antippen, keine Spielwerte. Wo was vorkommt, steht allein in `natureAt`
    (Chance je Versuch); neue Art: `NATURE` (+ `hint`) und `critterPos`/`drawCritter`. Gezählt wird im Album (`natur:<id>`).
    Album-Belohnung in Stufen: `ITEMS[].albumN` + `ALBUM[].tiers`; `albumDone(id, n)`, `albumCount(id)`.
67. **Bewohner** (Block 55): Arten in `ANIMALS` (Reihenfolge = `w.kind` der Figuren, nur hinten anfügen), `isle` = Insel, mit der
    sie einziehen (`speciesOpen`). Bewohner eines Hauses über `residentsOf(t)` (Reihenhaus: `t.more`), nie direkt `t.animal`.
    Figuren haben `home`/`who` (`residentLook`) und ein Ziel (`setGoal`: arbeit, schule, essen, laden, markt, park, home,
    bummel; `GOAL_OF`, `findGoal`, `walkPath`), Tagesteil über `dayPart`. `w.inside > 0` = gerade im Gebäude (nicht zeichnen,
    nicht antippbar). Sprechblase: `speak`/`bubbleText` (`say` ist in actions.js schon vergeben).
66. **Standortboni** (Block 53): `siteOf(b, k, rot, t)` → `{ f, good, bad, gTxt, bTxt, tip }`, nur für Sorten in `SITE_TIP`.
    Bonus höchstens `SITE_MAX` (+50 %), nie negativ: Störendes (`tallAt`: Wald, Gebäude) zieht nur vom Bonus ab. Wirkt auf
    Strom (`powerOf(t, k)` – ohne `k` kein Standort, für Tests/Vergleiche) und Rohstoffe (`d.prod` in `totals`). Anzeige: Vorschau
    (`previewDelta().site/.pow`, `siteLabel`), Fenster (`siteStatus`). Neue Kraftwerke/Betriebe: Regel in `siteOf` + Tipp in `SITE_TIP`.
65. **Rückgängig und Löschen** (Block 45): Jede Nutzer-Aktion, die die Welt ändert, läuft über `undoable(fn)` (Tippen mit
    Werkzeug in input.js, Fenster-Knöpfe Drehen/Verschieben/Löschen/Torbogen). `undoSnap` merkt Felder, Kleinkram, Linien und
    Boden (`UNDO_MAPS`, ohne `born`/`rate`), `undoCommit` speichert nur geänderte Stellen + Taler/Rohstoffe (bis `UNDO_MAX` = 20).
    `undo()` prüft, dass jede Stelle noch so ist wie nach der Aktion (sonst „geht nicht mehr“), bucht exakt zurück. Verschieben
    wird erst beim Ablegen ein Schritt (`undoPending` bleibt, solange `moving`). Ausbau-Stufen, Forschung, Käufe sind **kein**
    Rückgängig-Schritt. Löschen im Fenster: `delButton`/`wireDel` (wie `demolishInfo`, ab `DEL_ASK` verlorenen Talern oder bei
    Wunderwerken zweites Tippen), Linien über `openGateInfo` (jetzt für jedes Stück), Parkrasen `removeLawn`. Neue Fenster mit
    Änderungen: Handler in `undoable` packen und einen Löschen-Knopf anbieten.
64. **Park zum Selberbauen** (Block 44): Parkrasen ist ein Boden (`state.terra` = 'park', Pinsel `parkrasen` in `TERRAFORM`, gescheckt wie Wiese, dunkler,
    zählt in `terrainAt` als Wiese, gezeichnet mit Rand in `drawGround`). Darauf nur Deko, Wege und Linien (`parkOk`);
    der Rasen darf unter Deko und Wege gemalt werden. `computeParks` (in `totals`, nach `computeMarkets`; auch nach `previewDelta`):
    zusammenhängender Rasen, Deko darauf (kleine je Stück, große einmal), Sorten über `PARK_SORT` → Stufe nach `PARK_STEPS`
    (Fläche, Deko, nötige Sorten) → `PARKS`. Wirkung: Park-Wunsch/Reihenhaus-Stufe über `parkReach` (bis `PARK_REACH` oder im
    selben Viertel), Schönheit `PARK_BEAUTY` in der Summe und in `beautyAround` bis `PARK_NEAR`, Besucher `PARK_ATTR`, Parkfest
    (`startParkFest`, `state.parkFest`, in `boostMul`), Spaziergänger (`strollers`, `parkWalk`, `sitDown`). Park-Fenster
    `openParkInfo`/`parkStatus`. Der alte 3×3-Park (`ITEMS.park.old`) ist nicht mehr baubar; `parseSave` macht daraus 3×3
    Rasen mit Brunnen, Bäumen, Bänken. Kleine Deko in Tests mit `buildSmall` setzen (`build` legt sie als ganzes Feld).
63. **Größen** (Block 43): `DECO_SIZES` erzeugt je Größe einen eigenen Eintrag (`variantOf`, `vsize`, `vf`, `span`),
    `SIZE_ORDER[grundmodell]` für die Größen-Leiste (`renderStyleBar`, `sizeChoice`). Im Menü, Album, „Neu freigeschaltet“
    nur das Grundmodell; `baseOf(b)` überall, wo nach dem Namen gefragt wird (Beet-Bonus, Glashaus-Strom, KINDS bekommen die
    Varianten dazu), `available` wie das Grundmodell. Gezeichnet mit dem Bild des Grundmodells, skaliert über `decoScale`;
    das Beet zeichnet mit `span` mehr Blumen statt größerer. Deko nie haushoch: Bank, Laterne & Co. haben keine Größen.
62. **Kleinkram: 8 Plätze** (Block 42): `SLOTS` = 8 – Ecken 0–3 wie früher, Seitenmitten 4–7 (`MID_UV`, am Wegrand).
    Immer `newSlots()` statt `[null, null, null, null]`, gezeichnet in `SLOTS_BACK` (vor dem Ding) und `SLOTS_FRONT`.
    Position immer über `slotPos(x, y, i, b)` (Block 46: weit außen bei 0,42, je nach Größe `DECO_R`, an Linien um `lineW` nach innen,
    an Eckpunkten mit Linie Abstand), nie `slotUV` zum Zeichnen. `slotAt` nimmt den nächsten der 8 Plätze; auf Gebäudefeldern nur Ecken (`smallError`); Bänke in Seitenmitten
    automatisch längs zur Seite, Sitz zum Weg (`midRot`, `MID_FACE`; die Bank ist ein echter Kasten mit 4 Richtungen, nicht mehr gespiegelt). Alte Stände werden in `parseSave` auf 8 aufgefüllt.
61. **Linien auf Feldkanten** (Block 41): Hecke, Zaun, Mauer (`EDGE_TOOLS`, `ITEMS[].edge`) liegen in `state.edges`
    ('a'i,j waagerecht von Eckpunkt (i,j) nach (i+1,j), 'b'i,j senkrecht; Eckpunkt = obere Ecke von Feld (i,j)).
    `edgeKeyOf`/`edgeTiles`/`edgeBetween`/`edgeError`/`buildEdge`/`removeEdge` (rules.js), Tor = Weg auf beiden Seiten
    (`isGate`), Bewohner nur durchs Tor (`edgeBlocks` in movers). Planen als `plan.kind = 'edge'` über Eckpunkte
    (`toVertex`, `planPoint`, `planEdges`, `scanEdges`); Abriss per Tippen nahe der Kante (`edgeNear`) oder im Rechteck.
    Gezeichnet in js/draw-edges.js: jedes Feld zeichnet seine hinteren Kanten 'a'x,y und 'b'x,y vor sich (`drawEdgesAt`);
    Stile in `STYLES.hecke/zaun/mauer` (`st.kind`, `styleOk` mit Präfix der Art), Aussehen in `EDGE_LOOK`. `placeError`
    lehnt Linien-Werkzeuge ab (nie als Feld bauen). Album zählt Linien (`collectAlbum`). Neben einer Linie läuft der Weg
    bis an die Kante (`lineFill`); jede L-Ecke derselben Art wird rund (auch ohne Weg), außer eine der beiden Linien hat „Ecke eckig“ (`e.sq`, Standard rund – NIE das Aussehen bestehender Inseln für alle umstellen) – Linie (`drawArc`, ein Stück mit einer Oberseite) und Weg (`lineFill`, bzw. Belag außen in `drawArc`)
    nutzen denselben Viertelkreis (`roundCorner`, `roundArc`, `ROUND_R`). Seitenmitten neben einer Linie rücken nach innen
    (`slotPos`). Freie Enden bekommen von selbst ein Endstück (`freeEnd`, `endPiece`: Pfeiler/Pfosten mit Laterne, Heckenkugel);
    Durchgang antippen → `openGateInfo` → Torbogen/Rosenbogen (`ARCHES`, `e.arch`, `setArch`, gespeichert). Lichter an Linien
    (beleuchtete Stile `EDGE_LIT`, Bögen, Endpfeiler) zählen in `computePower` wie Laternen (`edgeLamps`, Kennungen E/A/P).
15. **Sehenswürdigkeiten sind 3×3** (Spielstand v6; alte Stände rücken einmalig per `fitFootprints`/`lmSpot`, nur wenn `state.fitLm`). Park ebenfalls 3×3. Große Gebäude werden in senkrechten Streifen gezeichnet (render.js), damit sie nichts davor Stehendes überdecken.

## Befehle

```bash
npm test          # alle Tests (Vitest + jsdom)
npm run bump      # Versionsnummern in index.html erhöhen
npm run serve     # Server für WLAN/iPad auf Port 4173
```

## Zusammenarbeit (wichtig)

- **Aufwand empfehlen:** Vor jeder Aufgabe zuerst sagen, auf welche Aufwand-Stufe der Nutzer stellen soll (Normal = kleine
  Fehler/Aussehen/Texte, Hoch = neues System, Ultracode = große Prüfungen mit vielen Agenten) – er steuert so seine Nutzung.
- **Erst besprechen, dann bauen.** Vor jedem größeren Schritt: kurz erklären, wie es technisch geht, Optionen
  mit Vor-/Nachteilen zeigen, auf die Antwort warten. Kleine Fehler direkt beheben.
- In **kleinen Schritten** bauen, jeden Schritt zeigen (Probeansicht, Screenshot), dann `npm test`, `npm run bump`,
  Commit (lokal, Nutzer hat git gewünscht). Stand der Schritte: Bau-Reihenfolge in KONZEPT.md (✓ = fertig).
- **Erst Flüssigkeit, dann Grafik** (Nutzer, 07.10.): Kurz unscharf/vereinfacht gezeichnet ist in Ordnung, Ruckeln nie. Wer Zeichnen
  umbaut, zeigt lieber kurz ein altes/unscharfes Bild und tauscht später auf einen Schlag, als ein Bild lang zu rechnen.
- Der Nutzer mag: **cozy und süß**, klares Ziel, Belohnungen selbst auslösen (Ausbauen per Knopf statt automatisch),
  viel Gestaltungsfreiheit, keine unnötige Verwaltung. Größenverhältnisse müssen stimmen (Deko nicht so groß wie Häuser).

**Schon ausprobiert und verworfen – nicht wieder einbauen:**
unendliches Land ohne Ziel (seit Block 27 endlos, aber mit Zielen: ferne Inseln, teures tiefes Wasser) · Inselhüpfen (eine Insel bleibt) · Straßenpflicht zum Rathaus · Strom/Kraftwerke als
allgemeines Netz (Strom gibt es nur für Züge, von Windrädern) · Gehwege auf Feldkanten · Straßen neben Wegen · Autos/Busse · schräge Wege/Schienen
(06.10.2026: Treppen zu einem schrägen Band geglättet, mit Bögen und angepasster Breite – wirkt in der Schrägansicht
fremd, weil Diagonalen auf dem Bildschirm senkrecht/waagerecht stehen; echte Diagonalen sähen genauso aus).

## Online (GitHub Pages)

Das Spiel liegt unter **https://fnymiland.github.io** (Repository `fnymiland/fnymiland.github.io`, Remote `origin`,
Branch `main`). **Jeder Push auf `main` ist nach ~1 Minute live** – **nur pushen, wenn der Nutzer es ausdrücklich sagt** (lokal bauen, zeigen, dann auf Zuruf hochladen). Offene Aufgaben: [AUFGABEN.md](AUFGABEN.md). Vorher `npm test`,
`NEWS` in ui.js (Regel 52) und `npm run bump`. Der Zugang (Token) ist im macOS-Schlüsselbund nur für dieses Repository gespeichert
(`credential.useHttpPath`). Spielstände liegen pro Adresse im Browser – beim Adresswechsel per Datei übertragen.

## Spielen im WLAN

`python3 -m http.server 4173 --directory ~/Projekte/Spiel` (bzw. Vorschau-Server „spiel“) → auf dem iPad
`http://192.168.178.82:4173` (IP kann sich ändern). Jedes Gerät hat seinen eigenen Spielstand (Export/Import im Menü).
