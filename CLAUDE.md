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
25. **Baumenü** = `MENU` (data.js): Bauen (Filter Wohnen/Geld/Rohstoffe/Verstärker/Bildung) · Verschönern · Verbinden ·
    Gelände. Jedes Ding steht in **genau einer** Gruppe (Test prüft das); neue Dinge dort eintragen, Wirkung in `FX`.
    `ITEMS[].cat` ist die Spiel-Kategorie und bleibt unabhängig davon (Blumenbeet: Menü „Verstärker“, Spiel „deko“).
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
    Preise immer über `wonderCost(t)`: `min` Minuten Einkommen (`t.rate`, beim Aufstellen gemerkt), mindestens `money`
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
    Alle Verbindungen (fahrende Züge, Seilbahnen `cablePairs`, später Fähren) laufen durch `transitTraffic`: gleiche
    Orte = eine Gruppe, Fahrgäste nach Plätzen geteilt (`groupSeats`); Anbindung gilt für jede Station jeder Verbindung.
47. **Inseln entdecken** (Block 18): nicht mehr per Schild freischalten, sondern per Boot: Steg (`bootssteg`, `needs: 'meer'`,
    von Anfang an) → `sendExpedition` (zahlt `need.money`/`science`, prüft Laternen/Einwohner über `isleNeeds`) →
    `state.expedition` (echte Zeit, `EXPEDITION_MIN`, gespeichert) → `checkExpedition` im Takt (nur ohne offenes Fenster)
    → `discoverIsland` (Tagebuchseite `isle:<id>`, `DISCOVERY`-Texte). Das Boot zeichnet `expeditionBoat`/`drawBoatMover`
    als Mover; der Steg zeigt sein Boot nur, solange es zu Hause ist.
48. **Hafen** (Block 18): Fähre (`t.ferry` = Feld des anderen Hafens, `ferryPairs`, `FERRY_SEATS` nach der kleineren Stufe,
    läuft durch `transitTraffic`), Fischkutter (`rawIncome` hafen = `FISH_INC` × Stufe), Handel ab Stufe 2 (`trade`,
    `tradePrice` aus der Uhrzeit, kein Zustand), Kreuzfahrt ab Stufe 3 (`checkCruises` im Takt, `t.cruise`/`t.docked`,
    `cruiseAttraction` im Umkreis). Schiffe sind Mover (`ferryBoats`, `fishBoats`, `cargoShip`, `cruiseShips`).
    **Neue Felder an Kacheln müssen in `tileOut` (state.js)** – sonst gehen sie beim Speichern verloren (Wagen, Fähre).
49. **Sorten statt Einzelgebäude** (`KINDS` in data.js): Bedingungen (`near` in BUILD_STAGES, Wünsche, Laufweite,
    Viertel mit Häusern, Deko neben Häusern, Bewohner) fragen nach einer Sorte – `isKind(sorte, b)`, `isHome(b)` für alle
    fünf Wohnformen, Brunnen = auch Kristallbrunnen, Park = auch Botanischer Garten, Statue = auch Denkmal. Wer ein neues
    Gebäude einer bestehenden Art baut (z. B. einen weiteren Brunnen), trägt es in `KINDS` ein – nie `b === 'haus'` prüfen.
50. **Rathaus 3×3** (Spielstand v10): neues Spiel bei (1,1), die Startwege führen an seine Seiten. Alte Stände wachsen per
    `growTownHall` (vor `fitFootprints`, beim Laden und Import) dorthin, wo am wenigsten im Weg steht – am liebsten nach
    hinten; was weicht, gibt es mit `fullValue` voll zurück (samt Ausbau). **Rathaus „Bereit“**: Gruppen wie das Bau-Menü
    (`readyGroups`), „Alle ausbauen“ je Gruppe und „Alles ausbauen“ → `upgradeMany` (Günstigstes zuerst, nach jedem Ausbau
    neu rechnen, `QUIET` statt Einzel-Meldungen). Wunderwerke und Laternen nur einzeln.
15. **Sehenswürdigkeiten sind 3×3** (Spielstand v6; alte Stände rücken einmalig per `fitFootprints`/`lmSpot`, nur wenn `state.fitLm`). Park ebenfalls 3×3. Große Gebäude werden in senkrechten Streifen gezeichnet (render.js), damit sie nichts davor Stehendes überdecken.

## Befehle

```bash
npm test          # alle Tests (Vitest + jsdom)
npm run bump      # Versionsnummern in index.html erhöhen
npm run serve     # Server für WLAN/iPad auf Port 4173
```

## Zusammenarbeit (wichtig)

- **Erst besprechen, dann bauen.** Vor jedem größeren Schritt: kurz erklären, wie es technisch geht, Optionen
  mit Vor-/Nachteilen zeigen, auf die Antwort warten. Kleine Fehler direkt beheben.
- In **kleinen Schritten** bauen, jeden Schritt zeigen (Probeansicht, Screenshot), dann `npm test`, `npm run bump`,
  Commit (lokal, Nutzer hat git gewünscht). Stand der Schritte: Bau-Reihenfolge in KONZEPT.md (✓ = fertig).
- Der Nutzer mag: **cozy und süß**, klares Ziel, Belohnungen selbst auslösen (Ausbauen per Knopf statt automatisch),
  viel Gestaltungsfreiheit, keine unnötige Verwaltung. Größenverhältnisse müssen stimmen (Deko nicht so groß wie Häuser).

**Schon ausprobiert und verworfen – nicht wieder einbauen:**
unendliches Land ohne Ziel · Inselhüpfen (eine Insel bleibt) · Straßenpflicht zum Rathaus · Strom/Kraftwerke als
allgemeines Netz (Strom gibt es nur für Züge, von Windrädern) · Gehwege auf Feldkanten · Straßen neben Wegen · Autos/Busse.

## Online (GitHub Pages)

Das Spiel liegt unter **https://fnymiland.github.io** (Repository `fnymiland/fnymiland.github.io`, Remote `origin`,
Branch `main`). **Jeder Push auf `main` ist nach ~1 Minute live** – **nur pushen, wenn der Nutzer es ausdrücklich sagt** (lokal bauen, zeigen, dann auf Zuruf hochladen). Offene Aufgaben: [AUFGABEN.md](AUFGABEN.md). Vorher `npm test`
und `npm run bump`. Der Zugang (Token) ist im macOS-Schlüsselbund nur für dieses Repository gespeichert
(`credential.useHttpPath`). Spielstände liegen pro Adresse im Browser – beim Adresswechsel per Datei übertragen.

## Spielen im WLAN

`python3 -m http.server 4173 --directory ~/Projekte/Spiel` (bzw. Vorschau-Server „spiel“) → auf dem iPad
`http://192.168.178.82:4173` (IP kann sich ändern). Jedes Gerät hat seinen eigenen Spielstand (Export/Import im Menü).
