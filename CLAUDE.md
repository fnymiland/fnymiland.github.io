# Kachelhausen – Projektwissen

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
(Funktionsaufrufe über Dateigrenzen erst zur Laufzeit).

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
    *Kunstakademie* (`DESIGN`, Taler): jede Farbe (`colorOk`, `colorsOf`), jeder Wege-Stil (`design`-Preis in `STYLES`)
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
25. **Baumenü** = `MENU` (data.js, Block 40) – fünf Bereiche nach dem, **was man gerade tun will**: 🏘️ Stadt (was eine
    Stadt zwingend braucht: Wohnen / Einrichtungen inkl. Schule, Post, Apotheke, Hotels / Verkehr inkl. Schiene, Bahnhöfe,
    Hafen, Steg) · 🏭 Herstellen (produziert: Taler / Rohstoffe / Veredeln / Strom) · 🛍️ Einkaufen (verdient an Kundschaft:
    Läden / Essen & Trinken / Markt / Kaufhäuser) · 🎡 Freizeit (Kultur, Wunder inkl. Leuchtturm) · 🌸 Gestalten (formt die
    Welt: Grün inkl. Park / Platz / Besonderes / Wege & Gelände). Nach dem echten Ort einsortieren, nicht nach der
    Spielwirkung (die steht im Infofenster). Keine Erklär-
    Zeilen in der Leiste (Nutzer: selbsterklärend, stört). Neue Dinge nach der Regel einsortieren, nie nach dem Namen („Bäckerei“ = Herstellen).
    Kein „Alle“; Bereiche ohne Filter haben `menuSub` 'alle', sonst gilt der erste (`firstSub`), jeder merkt sich seinen
    (`subOf`). Jedes Ding in **genau einer** Gruppe (Test), höchstens 10 je Filter; Wirkung in `FX`, Läden in `SHOP_GROUPS`.
    🔍 Suche (`searchQ`, `searchHits`, Umlaute egal) ersetzt Bereich und Filter durch ein Suchfeld. Handy: auch der gewählte
    Bereich nur als Symbol (sonst passt die Zeile nicht). Hinweis über der Leiste nur „wie man baut“, nie die Beschreibung
    (die steht im Bau-Infofenster); beim Weg kein Hinweis. Rathaus „Bereit“ über `buildGroups()`.
    **Kacheln** zeigen nur Bild + Preis (`cardPrice`, kurz über `shortMoney`), Name nur als `title`/`aria-label`;
    Reihenfolge `menuList()` (Freies zuerst, auch für die Zahlentasten). Kachel antippen = `pickCard`: am iPad/Mac
    rechts das **Bau-Infofenster** (`openBuildInfo`, `showPanel(…, live, id)` setzt `buildInfo`), das offen bleibt,
    solange das Ding gewählt ist (`setTool` schließt nur bei einem anderen Werkzeug); der Hinweis zeigt dann nur, wie
    man baut. Handy: kein Fenster, sondern ein ⓘ im Hinweis (`.hint-info`), Tippen auf die Karte schließt es wieder.
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
34. **Leiste oben** ist bewusst schlank: Rathaus, Geld (`fmtMoney`, immer glatt), Einwohner, Ideen, 📦, ☰. Raten und
    Arbeitsplätze nur nach Antippen (`hudMore`, Klasse `more`), Rohstoffe/Schönheit/Strom im Lager (`storeHtml`,
    `toggleStore`), bezahltes Material blitzt am 📦 (`flashStore` aus `payMat`). Tagebuch steht im Menü. Keine neuen
    Anzeigen oben ergänzen – lieber ins Lager oder ins Rathaus. Bei ≤ 480 px muss alles in eine Zeile passen.
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
59. **Tempo weit weg** (Block 31): unter `SPRITE_FROM` (Zoom 1) kommen Gebäude und kleine Dekos aus fertigen Bildchen
    (`objSprites`, `spriteTile`/`spriteSmall`); gleich aussehende teilen sich eins (Häuser außer Hausboot, kleine Läden,
    Dekos), alles andere hat ein eigenes (Schlüssel mit Platz und `groundVersion`). Was das Aussehen ändert, gehört in
    den Schlüssel (`look` in `spriteTile`)! Nachtlicht beim Bildchen-Malen nur merken (`GLOW_SINK`), beim Einsetzen
    stanzen (`punchGlow`); `SPRITE_PAINT` zählt als live. Was sich sichtbar dreht, bleibt live (`SPRITE_LIVE`).
    Neumalen (Bildchen und Boden-Grundstücke) nur im Zeitbudget je Bild (`SPRITE_MS`, `GROUND_MS`) – sonst das alte Bild.
    Rechnen: `rebuildCover` legt Nachschlage-Listen an (`BY_TYPE` je Sorte, `HOME_NEAR`, `BEET_NEAR`); Umkreis-Suchen ab
    3 Feldern über `nearList`, nicht Feld für Feld. Viertel (`computeNet`) mit Zahlen-Schlüsseln. Die Vorschau beim
    Bauen rechnet erst nach `HOVER_CALM` ms Ruhe auf einem Feld (sie rechnet die ganze Insel).
52. **„Das ist neu“** (`NEWS` in ui.js, Block 25): erscheint einmal pro Gerät (localStorage `kachelhausen_news`), nur
    mit Spielstand und erst, wenn kein anderes Fenster offen ist (`newsAfterLoad`); neue Spieler sehen es nie. **Vor jedem
    Push mit etwas Sichtbarem `NEWS.id` ändern und die 3–5 Punkte ersetzen** (nur das Neue seit dem letzten Push).
60. **Marktplatz** (Block 39): kein Gebäude mehr, sondern ein Platz aus Wegen mit Ständen (`STANDS`, `cat: 'markt'`,
    `needs: 'platz'`). Stände und `PLAZA_OK`-Deko (Brunnen, Statue, Pavillon …) dürfen auf ein Wegfeld; der Weg bleibt
    als `t.weg` (Stil) darunter – `wegUnder(t)` überall nehmen, wo „ist hier Weg?“ gefragt wird (`pathAt`, `pathArms`,
    `drawFlat`, `cachedPath`, Boden-Schleife). Abreißen/Aufnehmen legt den Weg zurück, Ablegen auf Wiese löscht `t.weg`;
    `serialize` schreibt Getragenes über den liegengebliebenen Weg (sonst doppeltes Feld, Zufallstest). `computeMarkets`
    (in `totals`, zuerst): zusammenhängende Wegfelder mit Ständen, Stufe nach `MARKT_STEPS` (3/6/9) → `MARKETS`,
    `MARKT_OK` (nur diese Stände zählen für den Wunsch „Marktplatz erreichbar“, `nearList`/`reachKind`). Wirkung: Läden bis
    `MARKT_REACH` Felder +`MARKT_BONUS` (`s.markt`, vor der Kaufkraft), Besucher `MARKT_ATTR` (`placeStats`), Markttag
    (`marktLeft`, `T.marktInc` in `earn`). Alte `markt`-Kacheln werden in `parseSave` zu Kopfsteinplätzen mit 3/6/9 Ständen.
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
    bis an die Kante (`lineFill`); jede L-Ecke derselben Art wird rund (auch ohne Weg) – Linie (`drawArc`, ein Stück mit einer Oberseite) und Weg (`lineFill`, bzw. Belag außen in `drawArc`)
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
- Der Nutzer mag: **cozy und süß**, klares Ziel, Belohnungen selbst auslösen (Ausbauen per Knopf statt automatisch),
  viel Gestaltungsfreiheit, keine unnötige Verwaltung. Größenverhältnisse müssen stimmen (Deko nicht so groß wie Häuser).

**Schon ausprobiert und verworfen – nicht wieder einbauen:**
unendliches Land ohne Ziel (seit Block 27 endlos, aber mit Zielen: ferne Inseln, teures tiefes Wasser) · Inselhüpfen (eine Insel bleibt) · Straßenpflicht zum Rathaus · Strom/Kraftwerke als
allgemeines Netz (Strom gibt es nur für Züge, von Windrädern) · Gehwege auf Feldkanten · Straßen neben Wegen · Autos/Busse.

## Online (GitHub Pages)

Das Spiel liegt unter **https://fnymiland.github.io** (Repository `fnymiland/fnymiland.github.io`, Remote `origin`,
Branch `main`). **Jeder Push auf `main` ist nach ~1 Minute live** – **nur pushen, wenn der Nutzer es ausdrücklich sagt** (lokal bauen, zeigen, dann auf Zuruf hochladen). Offene Aufgaben: [AUFGABEN.md](AUFGABEN.md). Vorher `npm test`,
`NEWS` in ui.js (Regel 52) und `npm run bump`. Der Zugang (Token) ist im macOS-Schlüsselbund nur für dieses Repository gespeichert
(`credential.useHttpPath`). Spielstände liegen pro Adresse im Browser – beim Adresswechsel per Datei übertragen.

## Spielen im WLAN

`python3 -m http.server 4173 --directory ~/Projekte/Spiel` (bzw. Vorschau-Server „spiel“) → auf dem iPad
`http://192.168.178.82:4173` (IP kann sich ändern). Jedes Gerät hat seinen eigenen Spielstand (Export/Import im Menü).
