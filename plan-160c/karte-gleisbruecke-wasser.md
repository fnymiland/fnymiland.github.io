# Gleisbrücken übers Wasser: Karte für den Umbau 160c

Nur gelesen, nichts geändert, nichts ausgeführt. Zeilenangaben beziehen sich auf den aktuellen Stand von `main` (61a273b…).

## 0. Das Wichtigste vorab

- **Eine Gleisbrücke übers Wasser ist kein eigenes Bauwerk.** Sie ist ein normales Schienenfeld `{ b: 'schiene', …, bridge: true }` in `state.tiles`. Gespeichert werden weder Material noch Farbe, Licht, Achse oder Länge. Gezeichnet wird sie immer gleich: als Holzsteg mit Pfählen.
- **Für Gleise übers Wasser gibt es keine Formregeln.** Kurven, Abzweige und Kreuzungen auf dem Wasser sind erlaubt, die Länge ist unbegrenzt, und ins offene Meer geht es Feld für Feld. Echte lokale Stände zeigen das:
  - `testsave-og.json`: 212 Brückenfelder, davon 15 Kurven, 12 Strecken, die längste 31 Felder.
  - `testsave-bauland.json`: 433 Brückenfelder, davon 4 Kurven, die längste Strecke 99 Felder.
  - Alle haben ein Gleisbett (`form` 2 bzw. 1). Es gibt keine Bahnübergänge und kein Doppelgleis auf dem Wasser.
- **Gezeichnet wird im flachen Boden-Durchgang**, vor allen Gebäuden. Dass Schiffe darunter durchfahren, entsteht nur durch Nachmalen (`drawBridgeOver`). Höhere Modelle (Fachwerk, Laternen, Balustrade) passen nicht in diesen Durchgang.
- **Die Achse wird nie gespeichert.** Sie ergibt sich je Feld aus `railArms` → `railSegments`. `bridgeArmsAxis`, `bridgeAxis`, `isBridgeAt` und `bridgeSpan` gelten nur für Wegbrücken.

## 1. Datenmodell

**Schienenfeld auf Wasser** (`state.tiles`, Schlüssel `"x,y"`):

| Feld | Bedeutung | Gesetzt | Gelesen |
|---|---|---|---|
| `b: 'schiene'` | Gleis | `build` actions.js:152 | überall |
| `bridge: true` | über Wasser gebaut, also Brücke | **nur** actions.js:152 (`bridge = (b==='schiene'\|\|b==='weg') && terrainAt==='water'`, :119) | siehe Abschnitt 12 |
| `form` | Gleis-Stil (Index in `DECO_LOOKS.schiene.forms`: 0 Schotter, 1 Rasen, 2 Wald, 3 Pflaster, 4 Blumen; fehlt = 0) | `decoLookNew` actions.js:164; `build`-Umfärben :22–28; `restyleRails` rules.js:2242 | `railLookOf` draw-objects.js:646 |
| `rot` | nur ohne Arme wichtig (`railSegments` draw-objects.js:614) | `placeRot` | `railSegments`, `groupPlaced` dreht mit (actions.js:427) |
| `lvl`, `born` | Standard | build | — |
| `cross`, `style`, `foot`, `footPaid` | Bahnübergang; **auf Brücken nie** (`crossError` rules.js:2282) | — | — |

Weitere Punkte:
- **Speichern:** `tileOut` schreibt `bridge` (state.js:78) und `form` (state.js:70). Es schreibt auch `brk`, `brc` und `brw` für **jedes** Feld (state.js:85–87). Das ist für eigene Brückenfelder an Schienen nutzbar, aber Vorsicht wegen Namensgleichheit (siehe Abschnitt 15).
- **Laden:** `parseSave` übernimmt die Felder ungeprüft (`tiles: new Map(d.tiles)`, state.js:342). Der Live-Spiegel schreibt Felder direkt aus JSON (live.js:113–117), Freundes-Inseln laufen ebenfalls darüber. Neue Felder müssen deshalb **beim Lesen** mit einem Rückfall abgesichert werden.
- **Migration:** Es gibt keine. Die `bridge`-Kennung gibt es seit Einführung der Bahn (Commit 9dd8547).
- **`state.claimed`:** Gleise ins Meer nehmen sich das Feld (`CLAIM_TOOLS` mit `schiene`, world.js:202; `claimSea` actions.js:186). Ein Abriss gibt das Feld nicht zurück; das tut nur ↶ (actions.js:1191).
- Rückgängig, Verschieben und Kopieren tragen das ganze Feldobjekt mit, also auch `bridge`.

## 2. Wann entsteht eine Gleisbrücke

- **Feld für Feld:** `build('schiene', x, y)` (actions.js:13).
  1. Liegt dort schon eine Schiene: nur Gleis-Stil umstellen, kostenlos (actions.js:22–28). Das gilt auch auf Brücken.
  2. Sonst prüft `crossCandidate`/`crossError`. Ein Weg auf dem Feld, auch eine Wegbrücke, führt zu „Kein Übergang auf einer Brücke“ (rules.js:2278–2288).
  3. Dann `placeError` (rules.js:2813), danach `costOf`, `claimSea` und schließlich `state.tiles.set(…{ bridge: true })` (actions.js:119–164).
- **`placeError` für Gleise auf Wasser** (rules.js:2921–2961):
  - Eigentum: `!ownedTile && !(rail && claimable)` → „Im Meer nur direkt neben deinem Land“ (:2932).
  - Gelände: `if (ter === 'water') { if (rail) continue; }` (:2957–2958). Damit **keine** Formprüfung und kein `needError`.
  - Vorher wirken: Gleis-Rampe (:2829), Anhöhe/`hillError` (:2830–2838), `bkPlaceError` (Gleis auf Wasser unter einer Anhöhen-Brücke → „Unter der Brücke geht keine Wasserbrücke“, bruecken.js:75), Dach (:2840), Tunnel (:2843: kein Gleis über einem Tunnel, auch unter Wasser nicht).
- **Gezogene Linie:** `planScan` (plan.js:93).
  - `grow = CLAIM_TOOLS.has('schiene')`: geprüft wird in Runden, neu genommene Meerfelder gelten kurz als eigen (`state.claimed.add` → `tmp`, :124/:132). So wächst die Linie Feld für Feld ins Meer.
  - `PLANNED` gibt es nur für Wege (:103). Die L-Form (`lineTiles` plan.js:23) erzeugt auf dem Wasser ohne Weiteres eine Kurve.
  - `planCheck` (plan.js:65) gibt Kosten = `costOf` + `clearCost` zurück. Liegt schon eine Schiene, ist das Ergebnis `same` oder Umstellen für 0 (:76).
  - Gleis-Stil beim Verlängern: altes Gleis wird nicht mit umgestellt (:133–136).
  - `runPlan` (plan.js:316) baut alles in einem `batch`.
- **Aufschütten unter einer Gleisbrücke:** wird zur normalen Schiene, der Unterschied kommt zurück (actions.js:139–147; erlaubt durch rules.js:2901 `ct.bridge && c === k`). Es werden nur `bridge` und `brk` gelöscht.
- **Danach:** `recalc` (rules.js:829) ruft `seaBridgesCheck` auf.

## 3. Kosten und Erstattung

- **`BRIDGE = { cost: 40, mat: { holz: 2, metall: 2 } }`** (rules.js:1839). Ein fester Preis, nicht nach Einkommen. Zum Vergleich die normale Schiene: 15 Taler, 1 Holz, 1 Metall (data.js:87).
- **Wer `BRIDGE` direkt benutzt:**
  - `costOf` rules.js:2079 (gibt das **Objekt selbst** zurück).
  - Hinweistext render.js:1763 prüft **auf genau dieses Objekt** (`c === BRIDGE ? 'Brücke' : 'Schiene'`).
  - `demolishInfo` rules.js:3415–3416: Gleise werden voll erstattet, Brücken mit Taler und Material von `BRIDGE`; Beschriftung „Brücke entfernen“ (:3430).
  - `fullValue` rules.js:3069: setzt nur `money = BRIDGE.cost`, das Material bleibt das von `ITEMS.schiene` (1/1 statt 2/2). **Kleiner vorhandener Fehler.** Wirkt bei `growTownHall`/`growHarbors`/`hbf…` (rules.js:3099, 3146, 3155, 3280).
  - `copyTileCost` actions.js:580.
  - Aufschütten actions.js:143.
- **Fester Text:** `ITEMS.schiene.desc` nennt den Preis wörtlich: „(🪙 40 🪵2 🔩2)“ (data.js:88). Dazu `ITEM_TIPS.schiene` (data.js:694) und der Tipp story.js:491.
- **Abriss:** `demolish` (actions.js:191, Zweig `info.refund`, :210–217). Im Abriss-Rechteck läuft es über `scanDemolish` → `demolishInfo` (plan.js:223). Ohne Rückfrage, weil alles voll zurückkommt.

## 4. Achse und Form

- **Für Gleise gibt es keine gespeicherte Achse.** Die Arme kommen aus `railArms` (rules.js:2184; mit Anhöhen `railArmsHill` :2189). `railSegments` (draw-objects.js:611) macht daraus Kurve als Bogen, gerade Strecke, Enden oder Abzweige. Ohne Arme gilt `t.rot & 1`.
- **`bridgeArmsAxis`** (rules.js:1944), `bridgeRowAxis` (:1957), `bridgeAxis` (:1881), `bridgeRunLen` (:1848), `bridgeShapeError` (:1962), `bridgeSpan` (:1976) und `isBridgeAt` (:1937, nur `isWegBridge` bzw. `PLANNED`) gelten **nur für Wege**. Schienen nutzen keine davon. `BRIDGE_MAX` (16) und `BRIDGE_WIDE` (4) gelten nicht für Gleise.
- **Richtung für Schiffe:** `seaCross` (rules.js:2555) liest sie aus den Nachbarn (beliebige Schiene, auch an Land).
  - `'x'` bzw. `'y'`: Brücke läuft längs x bzw. y.
  - `'block'`: Kurve oder Kreuzung.
  - Doppelgleis: Ein Lauf, der in einer Richtung mindestens 2 länger ist, gilt als breite Brücke (:2565–2567).
  - Wichtig: `seaCross` fragt **nicht** nach `t.bridge`. Jede Schiene auf Wasser gilt dort als Brücke; die Tests setzen Gleise ohne Kennung.

## 5. Zeichenweg

### drawRailBed (draw-objects.js:649–719)

Mit `t.bridge`:
- **Pfähle:** `alongPath(segs[0], 0.5)`, je Seite ein Rechteck `#6f5238` bei ±0,27, `fillRect(…, 2.4z, 7z)` nach unten (:658–665). Nur am ersten Stück: an Abzweigen nur ein Arm. An einem geraden Feld 2 Paare, am Ende 1 Paar, an der Kurve 2 Paare.
- **Deck:** `roadShapes(arms, t, 0.3)` `#8a6440`, darüber `0.27` `#b08a5e` (:666–667), also 0,6 Felder breit.
- **Gleisbett nach Stil** (`railLookOf`, :646; `RAIL_LOOK` :639–645):
  - Schotter auf der Brücke bekommt die Kante `#9a8f80` (:675).
  - Pflastergleis legt Pflaster aufs Deck (:669–673).
  - Rasen-, Wald- und Blumengleis bekommen auch auf der Brücke Büschel und Blumen (`railTrim` :685/:721).
- **Schienen und Glanz** (:700–702); **Prellbock** an freien Enden (:703–709).
- **Geländer:** `offsetPath(seg, ±0.29)`, 3·z hoch, `#6f5238`, 0,9·z (:710–718). Es läuft an **jedem** Stück auf beiden Seiten durch. Der Kommentar „wo kein Nachbar-Gleis anschließt“ stimmt nicht: An Abzweigen kreuzen sich die Geländer, beim Doppelgleis stehen zwei Geländer nebeneinander.
- Alle Farben laufen über `C()` (Nebel, Ruinen). Nichts ist umfärbbar, kein `REPAINT`. Es gibt kein `glowQuad`, also **kein Nachtlicht**.
- Höhe: Wasser liegt um `DEPTH*0.7` = 6,3·z tiefer (draw-base.js:154). Das Deck liegt auf Landhöhe, die Pfähle reichen bis zum Wasser. Züge werden nicht angehoben.

### Maler-Reihenfolge

1. **Boden-Bild:** `cachedPath` (render.js:82) ist für `t.bridge` falsch. Brücken kommen also nie aus der Bodenkachel (Block 66e: Geländer ragte über den Rand). Die Kachel zeichnet nur `cachedPath`-Felder (render.js:435).
2. **Flacher Durchgang** in `worldGround` (render.js:1581–1608), nach Boden, Tiefe und Bodenteilen, **vor** allen Objekten:
   - `liveFlatSet` (:86–96) enthält alle Brückenfelder.
   - Weit weg: `spriteFlat` (:1031–1047, Schlüssel `flat|x,y|fog|lit`, Fassung `groundVersion`, Rahmen nach oben `TH+60`, nach unten `TH+70`; `prewarm`).
   - Sonst mit Aufzeichnung: `glLive(…, TW·z, (TH+60)·z, …)` (:1605), ohne Aufzeichnung `drawFlat` (draw-objects.js:883, nimmt für `schiene` → `drawRailBed`).
   - Bogenbrücken aus Weg werden hier übersprungen (:1602) und in `tileA` gezeichnet. Für Gleise gibt es diesen Weg nicht.
3. **Objekt-Durchgang** `tileA`: `drawIt0` steigt bei Schiene ohne Übergang sofort aus (render.js:2020). `drawObject('schiene')` zeichnet mit `PASS === 'object'` kein Gleisbett (draw-objects.js:1809–1812).
4. **Züge:** in `tileB` ihres gerundeten Felds, nach dem Deck. Nicht angehoben, keine besonderen Wagenstücke.
5. **Schiffe darunter:**
   - Für jedes Boot (`m.boat`: Schiffe, Kutter, Fracht, Expedition, Freunde) werden die Brückenfelder gesammelt, die der Rumpf berührt und die nicht dahinter liegen (`seaCross`) → `m.under` (render.js:1831–1836).
   - In `tileB` wird nach dem Boot `drawBridgeOver(bk)` aufgerufen (render.js:913–922: für `schiene` einfach `drawRailBed` an `toScreen(x, y)`, ohne Anhebung). Danach werden Züge und Figuren auf den Nachbarfeldern, die schon gezeichnet waren, erneut gemalt (render.js:2139–2145).
   - Mit Aufzeichnung über `glLive(…, TW·0.8·z+4, 70·z, …)` (:2140). Der Rahmen ist knapp; höhere Brücken würden abgeschnitten.
6. **WebGL-Standbild:** Brücken stecken im Bodenteil (`GLS.groundEnd`, gl.js:676). Lebendig ist nur das Feld des Schiffs (`byTile`). `bkLiveTiles` betrifft nur Anhöhen-Brücken.
7. **Nacht:** Brücken werden nur abgedunkelt. Der Schlüssel `lit` im Bildchen ist vorhanden, ein Merkmal „ohne Strom dunkel“ fehlt (anders als bei `spriteSmall`, render.js:986).
8. **Vorschau:**
   - Der Geist eines Gleises auf Wasser darf erscheinen (render.js:1793), bekommt aber kein `bridge` (render.js:2118–2119). Er zeigt also Gleis ohne Deck.
   - Linienplan: nur Rauten (render.js:1363).
   - Verschieben: Geist mit `moving.t`, also mit `bridge`.
   - Menübild: `drawObject('schiene', …, { rot: 0 })` (ui.js:92–94), keine Brücke.
9. **Gleis auf einer Anhöhen-Brücke** nutzt `drawRailBed` mit einem künstlichen Feld **ohne** `bridge` (bruecken.js:391). Kommt dort `bridge` dazu, erscheinen Holzpfähle.

## 6. Schiffe, Seewege, Natur

- `seaCross` (rules.js:2555), `seaStep` (:2569: nie längs oder schräg unter einer Brücke, nie bei `'block'`), `seaSearch` (:2585), `seaSight` (:2610: Abkürzungen nie über Brücken), `nearestWater` (:2542: nicht in einer Brückenkurve starten).
- `seaBridgesCheck` (rules.js:2578–2582) baut eine Signatur aus allen Schienen auf Wasser samt `seaCross`. Ändert sie sich, wird `seaCache` geleert. Wird über `recalc` aufgerufen.
- Wirkung: Kurven und Kreuzungen auf dem Wasser sperren Schiffe vollständig, gerade Strecken lassen sie nur quer durch.
- Fischkutter kreisen nur, wo ringsum keine Brücke ist (`fishingGround`, Test). `natureAt`: unter oder neben Gebautem auf dem Wasser keine Fische oder Robben (movers.js:1088–1089).

## 7. Gleis-Stil auf Brücken

- `railLookOf(t)` gilt auch auf Brücken (Block 109b).
- `restyleRails(list, form)` (rules.js:2242): kostenlos, setzt `born`, erhöht `groundVersion`. Nimmt das Deck einer Anhöhen-Brücke mit, wenn beide Endfelder in der Liste sind.
- Umfang über `railScope`/`railNetwork` (rules.js:2208, :2234; ui.js:1687–1694, :1731).
- Neue Felder bekommen den Stil über `decoLookNew('schiene')`. Die Pipette übernimmt nur `form` (actions.js:593–603, :621).
- Hauptbahnhof, Tunneleinfahrt und Rampe übernehmen den Stil der Schiene davor (draw-buildings.js:789, draw-ubahn.js:35, hills.js:1913). Das kann ein Brückenfeld sein.

## 8. Verschieben, Kopieren, Gruppe, Rückgängig

- **Einzeln:** `pickUp` (actions.js:266) → `moveError` (actions.js:632–640): Brücke nur aufs Wasser, Gleis ohne Kennung nie aufs Wasser, dann `placeError(…, { move, t })`. `dropAt` → `claimSea` (:657).
- **Gruppe und Kopie:** `groupErrors` (actions.js:435; für Schiene und Weg :472–478: eigenes Land nötig, `bridge` passend zum Wasser), danach `placeError(…, { move: !copy, noCost, t })`. `dropGroup` → `claimSea(…, t.bridge)` (:508). Beim Drehen der Gruppe bleibt `bridge`, die Achse ergibt sich neu.
- **Kopieren:** `copyCollect`/`copyClone` (JSON, `bridge` und `form` bleiben, actions.js:530–562). Preis über `copyTileCost` → `BRIDGE` (:580). Eine reine Gleisauswahl mit einem Stil wird zur Pipette und nimmt das Werkzeug statt einer Kopie.
- **Rückgängig:** Felder als JSON. Die Brücken-Prüfung in `undo` (actions.js:1175) zählt Gleise mit `bridge` als „zu hoch“ unter Anhöhen-Brücken.
- **Wegwerfen:** `discardCarried` → `demolish` (actions.js:670).

## 9. Abriss

- `demolishInfo` mit `full`, `paid = BRIDGE` (rules.js:3415–3430); Abriss-Rechteck: `scanDemolish` (plan.js:208); 👆-Fenster: Knopf „Brücke entfernen“.
- Das Meerfeld bleibt eigen.
- Unter einer Anhöhen-Brücke darf keine Gleisbrücke liegen; `bkUnderError` (bruecken.js:58) sperrt das Bauen der Anhöhen-Brücke darüber.

## 10. Erfolge und Texte

- **Erfolg „Brückenfelder“** zählt `tileCount(t => t.bridge)` (story.js:514, Stufen 10 und 50). Mitgezählt werden Weg- und Gleisbrücken übers Wasser, **nicht** Anhöhen-Brücken und nicht Fußgängerbrücken. Erreichte Stufen sinken nie (story.js:541–546).
- **Erfolg „Eisenbahn“** in km: alle Schienenfelder samt Brücken + `bkRailTiles()` (story.js:512).
- Infofenster für eine Gleisbrücke: Titel „Schiene“, Text `d.desc`, Gleisbett-Wahl (ui.js:1876, `decoLookHtml` :1695). **Keine** Brücken-Wahl; die gibt es nur bei `isWegBridge` (ui.js:1927–1933, Knöpfe :2044–2047).
- Hilfe ui.js:3200; Forschung data.js:952 („Schienen, Brücken und Bahnhöfe“, ab Erzinsel).

## 11. Zusammenhänge mit anderen Systemen

- **Anhöhen-Brücke:** Darunter keine Gleisbrücke (bruecken.js:58, :75; Test bruecke:135). Ihr Gleis zeichnet `drawRailBed` ohne `bridge`. Gleis-Netz-Sprünge über `bkRailJumps` (computeRail, railPath).
- **Bahnübergang:** nie auf einer Brücke (rules.js:2282). Damit auch nie eine Fußgängerbrücke über einem Gleis auf Wasser.
- **Tunnel:** ein Feld ist entweder Schiene oder Tunnel; der Tunnel unter Wasser kostet `TUNNEL_WATER`.
- **Dächer:** nie über Gleisen (`roofOver`).
- **Deko:** nie auf Wasser (`smallError` rules.js:1662). Es gibt also heute keine Laternen auf Gleisbrücken.
- **Bewohner:** betreten auf Wasser nur Wegbrücken (`walkable` movers.js:14).
- **Strom:** Laternen zählen in `computePower` (rules.js:2784ff, Lichter an Linien über `edgeLamps` :1332, `power.dark`). Brückenlicht wäre neu einzuhängen.
- **Netz, Strom, Linien:** Brückenfelder sind ganz normale Schienen (`trackLink` :2113, `railArms`, `computeRail` :2445).
- **Minimap:** Schiene grau (minimap.js:22–23), ohne Unterschied.
- **Online und Besuch:** `LIVE_MAPS` enthält `tiles` (live.js:13), also Feld-JSON ohne `parseSave`. **Ältere App-Fassungen** auf anderen Geräten oder bei Freunden lesen neue Stände. Sie kennen nur `bridge: true` und zeichnen dann Holz, erstatten 40 Taler und prüfen `moveError` entsprechend.

## 12. Alle Stellen mit `t.bridge` (grep `\.bridge\b`), eingeordnet

**Gilt für Gleisbrücken:**
- bruecken.js:58, :75
- actions.js:142–144, :476–477, :508, :580, :637–638, :657, :1175
- draw-objects.js:658, :675, :710
- state.js:78
- render.js:82
- rules.js:2282, :2901, :3069, :3416, :3430 (Beschriftung)
- story.js:514

**Nur Wege:**
- actions.js:30
- plan.js:79
- draw-objects.js:1105, :1117
- render.js:2063
- rules.js:1021, :1037, :1051, :1084, :1173, :1385, :1867 (`isWegBridge`)

**Ohne die Kennung, aber über „Schiene auf Wasser“:**
- actions.js:119 (`bridge` beim Bauen)
- `costOf` rules.js:2079
- `placeError` rules.js:2925–2958
- `seaCross`/`seaBridgesCheck` rules.js:2555–2582
- `drawBridgeOver` render.js:917
- `m.under` render.js:1834

## 13. Tests, die den Bereich abdecken

| Datei | Was geprüft wird |
|---|---|
| tests/bahn.test.js:34–102 | an Land 15 Taler und kein `bridge`; über Wasser 40 Taler und `bridge`; ins Meer Feld für Feld (Meerfeld wird eigen); Abriss erstattet 40 + {holz 2, metall 2}; Aufschütten −60 +25 und keine Brücke mehr; Zeichnen ohne Fehler (gerade, Kurve, Kreuzung, Brücke); Speichern/Laden behält `bridge` |
| tests/schiffe-bruecken.test.js | Block 107/112: längs nie auf dem Gleis, quer genau einmal, Seeweg-Cache wird bei neuer Brücke geleert, Fischkutter, Doppelgleis quer und Kreuzung gesperrt. **Setzt Schienen auf Wasser ohne `bridge`** |
| tests/planen.test.js:107–118 | Schienenlinie bis ins Meer: 6 Felder, `bridge`, Meerfeld eigen |
| tests/uebergang.test.js:31–37 | „Kein Übergang auf einer Brücke“ |
| tests/bahn-gemuetlich.test.js:45–56 | `railLookOf` auch mit `bridge` |
| tests/bruecken.test.js:107–113 | `cachedPath` für Gleisbrücke falsch, für normale Schiene wahr |
| tests/webgl.test.js:37–45 | `liveFlatSet` stimmt mit der Einzelprüfung über `cachedPath` überein (mit Wegbrücke) |
| tests/fehler84b.test.js:91–97 | `moveError`-Regeln für Brücken (Beispiel Weg, gleicher Codepfad wie Schiene) |
| tests/bruecke.test.js:135–148 | unter einer Anhöhen-Brücke keine Wasserbrücke (`bkPlaceError`) |
| tests/monkey.test.js | Zufallsbauen mit Wasserstreifen (x = 9), Rundlauf `serialize`/`parseSave` |
| tests/neuwelt.test.js | zählt `t.bridge` (testsave-neu hat nur Wegbrücken) |

**Nicht abgedeckt:**
- Erfolg „Brückenfelder“
- `copyTileCost`, Gruppe drehen oder ↶ mit Gleisbrücken
- `drawBridgeOver` mit Schiene (bogenbruecken.test.js:50 prüft nur Weg)
- Leistung: tests/leistung-je-ding.test.js zeichnet `schiene` ohne `bridge`, und die Welten in leistung.test.js (gross, freizeitpark, farben, neu, dach) haben **0** Gleisbrücken

## 14. Prüf-Werkzeuge und Daten

- tools/brueckenschau.js: Reihe 1 enthält eine „Gleisbrücke übers Wasser“.
- tools/brueckenfamilie-entwurf.js (Bahn Holz, Stein, Metall, Kristall B2) und tools/brueckenlicht-entwurf.js: nur zwischen Anhöhen gezeichnet. Übers Wasser fehlen die Modelle noch.
- Lokale, per `.gitignore` ausgeschlossene Stände `testsave-og.json` und `testsave-bauland.json` (laden mit `?welt=og` bzw. `?welt=bauland`): gut für den Vorher-nachher-Vergleich alter Gleisbrücken.

## 15. Risiken für den Umbau

1. **Ältere Fassungen lesen neue Stände.** `bridge: true` an Gleisen auf Wasser muss bleiben. Fällt die Kennung weg (etwa durch Umzug nach `state.bruecken`), sehen ältere Fassungen Gleise auf dem Wasser ohne Deck, erstatten 15 statt 40 Taler und lehnen beim Verschieben ab. Neues als **zusätzliche** Felder an das Feld hängen.
2. **Neue Felder ungeprüft geladen** (parseSave, Live-Spiegel, Freunde). Jeder Zugriff braucht einen Rückfall, z. B. `MAT[t.x] || holz`, nie direkt als Index verwenden.
3. **Namen gehen ineinander über.** `brk`, `brc`, `brw` sind Wegbrücken-Schlüssel (`bridgeKind`, `WEG_BRIDGE`, `BRIDGE_OF_STYLE`) und werden für alle Felder gespeichert. Aufschütten löscht nur `bridge` und `brk` (actions.js:144); andere Brücken-Felder blieben als Reste an der Landschiene. Besser eigene Schlüssel nehmen oder beim Aufschütten alles löschen.
4. **Alte Brücken umwandeln.** Heute sind alle Holzsteg. Das abgenommene neue Bahn-Holz (Böcke auf den Kachelkanten) sieht anders aus. Nach AUFGABEN 160c sollen alte Stände gleich aussehen. Zu klären: Bleibt das alte Bild als Holz-Variante, oder ändert sich das Aussehen?
5. **Kurven, Abzweige und Kreuzungen auf Wasser sind erlaubt und kommen vor** (og: 15 Kurvenfelder). Die neuen Modelle (Pfeiler auf Kachelkanten, gerades Fachwerk) brauchen eine Kurvenform oder ein einfacheres Bild für Kurven. Eine neue Formregel darf bestehende Brücken nicht ungültig machen. Auch Verlängern und `moveError` von Bestehendem bedenken.
6. **Länge unbegrenzt** (bauland: 99 Felder am Stück). „Bis 8 Felder“ gilt zwischen Anhöhen. Über Wasser darf eine neue Grenze alte Strecken nicht treffen. Auch Preis und Material über die ganze Länge (Kristall „fürstlich“) bei 400+ Feldern bedenken.
7. **Maler-Reihenfolge.** Der flache Durchgang zeichnet vor allen Objekten. Alles Hohe wird von Dingen dahinter übermalt. Für Fachwerk, Laternen und Balustrade braucht es einen Weg wie bei `drawArchBridge`:
   - in `worldGround` überspringen, in `tileA` zeichnen;
   - vorderes Geländer bzw. Fachwerk nach den Zügen (`afterMovers` oder ein Rückruf wie `bkDrawTile`);
   - `drawBridgeOver` so umbauen, dass alles über dem Rumpf liegt;
   - Rahmen größer: `glLive` in render.js:1605 und :2140, Bildchen-Rahmen in `spriteFlat`.
8. **Schiffe.** `seaCross`, `seaStep` und `seaBridgesCheck` hängen an „Schiene auf Wasser“. Jede neue Darstellung muss sie bedienen, sonst bleibt `seaCache` alt. Eine Bahnbrücke auf Pfeilern lässt Schiffe trotzdem nur quer durch; Kurven sperren weiter.
9. **Licht.** Heute gibt es keins. Nach Regel 112/44 `glowQuad` erst **nach** dem Leuchtenden aufrufen; Bildchen mit `GLOW_SINK`, `prewarm(keyOf(1))`, Nachtbild. Bei Strom (`computePower`, `power.dark`) gehört „ohne Strom dunkel“ in den Bildchen-Schlüssel `flat|…`. Ein Licht an/aus, das sich ändert, muss `groundVersion` hochzählen (Fassung der Bildchen).
10. **Kosten an einer Stelle bündeln.** `BRIDGE` steht in 6 Funktionen. Die Abfrage `c === BRIDGE` (render.js:1763) bricht, sobald `costOf` je Material liefert. Der Preis im Text `ITEMS.schiene.desc` ist fest eingetragen. Licht und Kristall müssen auch in `copyTileCost`, `demolishInfo`, `fullValue` (dort das Material nachziehen), der Aufschütten-Erstattung und `planCheck` stehen. Werden Preise einkommensabhängig, gilt Regel 137: den bezahlten Preis merken.
11. **„Ganze Brücke“ für Gleise fehlt.** Material, Farbe und Licht für die ganze Brücke brauchen eine Gleis-Variante von `bridgeSpan`: Gleisnachbarn auf Wasser mit `bridge` (Kurven inklusive), und eine Entscheidung, ob parallele Gleise zu einer Brücke zusammengehören.
12. **Anhöhen-Brücke trennen.** `drawRailBed` mit `t.bridge` heißt „Holz übers Wasser“. Wer Material über `t` an `drawRailBed` gibt, darf das künstliche Deckfeld (bruecken.js:391) nicht ungewollt zur Wasserbrücke machen.
13. **Erfolg „Brückenfelder“** zählt nur `t.bridge`. Neue Brückenarten (Anhöhen, Fußgänger) bewusst dazunehmen oder bewusst draußen lassen. Wechselt die Darstellung, darf der Zähler nicht sinken.
14. **Leistung.** Gleisbrücken sind von keinem Leistungstest erfasst. Nah (Zoom > ~2) werden alle Brückenfelder jedes Bild live gezeichnet. Für neue Modelle Einträge im Wächter je Ding (Material × Stil) und eine Testwelt mit Gleisbrücken anlegen.
15. **Vorschau und Geist.** Heute zeigt der Geist kein Deck (render.js:2118). Nach dem Umbau sollte die Vorschau das gewählte Material zeigen. Die Pipette übernimmt nur `form`; für Material oder Licht ist ihr Verhalten offen.
16. **Tests mit Gleisen ohne Kennung** (schiffe-bruecken) verlassen sich darauf, dass `seaCross` die Kennung nicht braucht. Ändert sich das, müssen die Tests mit.
17. **Freundes- und Live-Stand** nimmt die Felder roh. Zeichenfunktionen dürfen bei unbekannten Material- oder Farbwerten nicht abstürzen. Regel 37 (keine negativen Radien) gilt auch für neue Bögen und Leuchtbänder.