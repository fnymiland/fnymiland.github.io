# Karte: Wegbrücken übers Wasser (Blöcke 66, 66b–e, 150, 150b, 151)

Ich habe nur gelesen, nichts ausgeführt und nichts geändert. Alle Zeilenangaben beziehen sich auf den heutigen Stand (`main`, sauber).

---

## 0. Kurzbild

Eine Wegbrücke ist **kein eigenes Bauwerk**. Sie ist ein ganz normales Wegfeld (`t.b === 'weg'`) auf einem Wasserfeld mit `t.bridge = true`.

- **Art:** Sie steckt in `t.brk`. Fehlt das Feld, wird die Art **aus dem Wegstil abgeleitet** (`bridgeKind`).
- **Farben:** `t.brc` (Bauwerk) und `t.brw` (Planken).
- **Eine Brücke:** Das sind alle zusammenhängenden Brückenfelder (`bridgeSpan`). Art und Farben werden über diese Spanne auf jedes einzelne Feld kopiert.
- **Form:** Sie wird nie gespeichert, sondern jedes Mal aus den Nachbarn gerechnet. `bridgeArch` gibt entweder einen Bogen zurück (ab 2 Feldern, an beiden Enden Land) oder `null` (flach).
- **Netze:** Weil die Brücke ein Wegfeld ist, gehört sie automatisch zum Wegenetz, zu den Vierteln und zu den Wegen der Bewohner.

---

## 1. Datenfelder

### 1a. Am Feld (`state.tiles`, gespeichert über `tileOut`, state.js:66–112)

| Feld | Bedeutung, Werte | Gesetzt | Gelesen | Gespeichert |
|---|---|---|---|---|
| `b: 'weg'` | Wegfeld. Die Brücke hängt am Weg und verbindet deshalb Viertel, Wege und Bewohner. | actions.js:152 | überall (`isWegBridge`, rules.js:1867) | ja |
| `bridge: true` | Feld ist eine Brücke. Gilt auch für Schienen (`t.b === 'schiene'`, eigene Kosten `BRIDGE`). | actions.js:118/152 (`bridge = weg/schiene && terrain === 'water'`) | `isWegBridge`, `cachedPath` (render.js:82), `plainWeg` (rules.js:1385), `pathEnds` (1037), `gardenPath` (1051), `courtParts` (1084), `centerTileErr` (1173), `wegTurns` (1021), `crossError` (2282), Erfolg (story.js:514), draw-objects.js:1105/1117 | state.js:78 |
| `style` | Wegbelag (alter Name oder `'m:<muster>:<farbe>'`). Bestimmt bei fehlendem `brk` die Art, bei Stein/Ziegel den Belag. | build, `setWegCell` (rules.js:2009), `setBridgeStyle` (2068), actions.js:37 | `bridgeKind` (1866), drawWegBridge:1008 | ja |
| `brk` | Gewählte Art: `'holz' \| 'stein' \| 'ziegel' \| 'rot'`. **Fehlt, wenn die Art der aus dem Stil abgeleiteten entspricht.** | `setBridgeKind` (1996), Verlängern (actions.js:157), Umfärben „friert“ die Art ein (actions.js:36, rules.js:2009, 2068) | `bridgeKind` | state.js:85 |
| `brc` | Index in `BRIDGE_COLS` (0–9). Fehlt = Grundfarbe der Art. | `setBridgeColor` (2073), Verlängern (actions.js:157) | drawWegBridge:968 | state.js:86 |
| `brw` | Index in `PLANK_COLS` (0–4), nur bei Holz/Rot sichtbar | wie `brc` | drawWegBridge:968 | state.js:87 |
| `lauf` | Wegrichtung (Block 158). Wird auch auf Brücken gesetzt (actions.js:160), drawWegBridge beachtet es aber nicht. | actions.js:160 | – | **nein, siehe 8.** |
| `rot` | Zufällige alte Werte. Nur letzter Rückfall in `bridgeAxis` (rules.js:1888). | build | `bridgeAxis` | ja |

Nicht gesetzt werden `wide`, `sq` und `end` (actions.js:152: `wegShapeNew()` nur `!bridge`). Auch `applyWegShape` bleibt aus (actions.js:30, plan.js:79).

Weitere Zustände:
- `state.claimed`: Meeresfelder unter einer Brücke werden per `claimSea` eigenes Land (actions.js:186–189). Beim Abriss bleiben sie eigen.
- Abgeleiteter Zwischenspeicher (nie gespeichert): `bridgeArchCache` (rules.js:1872, je `groundVersion` und `state.tiles`; `recalc` leert ihn in rules.js:829), `seaBridgeSig` (2577), `PLANNED` (1936, nur während `planScan`).

### 1b. Konstanten

| Name | Ort | Inhalt |
|---|---|---|
| `WEG_BRIDGE` | rules.js:1859–1864 | Je Feld: holz 30 + 2 Bretter · stein 60 + 2 Quader · ziegel 60 + 2 Quader · rot 80 + 2 Bretter + 1 Metall. Dazu `name`, `icon`. Form `{ cost, mat }`. |
| `BRIDGE_OF_STYLE` | 1865 | sand/mulch/tritt → holz; kopf/klinker/terrakotta/fisch/blueten → ziegel; alles andere (auch alle `m:`-Beläge) → stein |
| `BRIDGE_SEA = 3` | 1843 | Ins Meer höchstens 3 Felder vor die Küste … |
| `BRIDGE_MAX = 16`, `BRIDGE_WIDE = 4` | 1846 | … oder bis 16 Felder zu eigenem Land in gerader Linie. Höchstens 4 Reihen breit. |
| `BRIDGE` | 1839 | Schienenbrücke: 40 + 2 Holz + 2 Metall (anderer Bereich, hängt aber überall mit dran) |
| `BRIDGE_COLS` | draw-objects.js:950 | 10 Farben, **Index wird gespeichert, nur hinten anhängen** |
| `PLANK_COLS` | 951 | 5 Farben, ebenso |
| `BRIDGE_LOOK` | 952–957 | holz `{lift 3, side #6f5238, deck #b08a5e, plank #8a6440, rail #6f5238}` · stein `{lift 7, side #d9d2c3, wall, rail #cfc6b4}` · ziegel `{lift 7, side #b5654a, wall, rail #c97a5e}` · rot `{lift 8, side #a8392f, deck #c79a6a, plank #9a7048, rail #d9483b}` |
| `BRIDGE_FRONT` | 958 | Merker: nur das Vordere zeichnen (über einem Boot) |

### 1c. Alte Werte in den Testständen (gezählt mit node)

| Testwelt | Wegbrücken | `brk` |
|---|---|---|
| `testsave-neu.json` | 80 | 48× ohne `brk`, Stil `kopf` (→ abgeleitet **ziegel**); 9× ziegel/klinker; 6× holz/klinker; 3× rot/sand; 14× ohne/sand |
| `testsave-og.json` | 11 (dazu 212 Schienenbrücken) | alle ohne `brk`, sand → holz |
| `testsave-bauland.json` | 15 | stein, mit `brc` |
| `testsave-freizeitpark.json` | 15 | 3× rot, Rest abgeleitet |

Folge: Die Art steckt bei alten Ständen meist **nur im Stil**. Eine Umwandlung muss also `bridgeKind(t)` auswerten, nicht nur `t.brk` lesen.

---

## 2. Funktionen mit Ort und Rolle

### rules.js
- **1848 `bridgeRunLen(x, y, dir)`**: Länge der gebauten und geplanten Brückenfelder entlang einer Achse (bis `BRIDGE_MAX + 1`).
- **1854 `seaGapBridgeable(x, y, dir)`**: Gerade Wasserstrecke ≤ 16 zwischen eigenem Land an beiden Enden (Block 150b).
- **1866 `bridgeKind(t)`**: `t.brk || BRIDGE_OF_STYLE[style || 'sand'] || 'stein'`.
- **1867 `isWegBridge(t)`**: einzige Abfrage „ist Wegbrücke“ (CLAUDE.md Regel 75).
- **1873 `bridgeArch(x, y)`**: gemerkter Bogen oder `null`.
- **1881 `bridgeAxis(x, y, t)`**: Richtung. Erst die Achse mit Land an beiden Enden, dann die längere Reihe, dann der erste Arm, zuletzt `t.rot & 1`.
- **1890 `bridgeArchCalc`**: `A = { ax, i0, N, peak, wall, open, pass }`. Liefert `null`, wenn N < 2 oder ein Ende nicht an Land liegt (Steg ins Meer bleibt flach). Für das Ufer zählt nur das Gelände, nicht ob dort Weg liegt.
  - `peak = 20,4 · (min(N,16)/2)^0,6`, also etwa 20 / 39 / 50 / 71 px bei N = 2 / 6 / 9 / 16.
  - `wall = (Art stein ‖ ziegel)`.
  - `pass[j] = archBoatOk`. Ist nirgends hoch genug, ist überall frei („nie absperren“, 1902).
- **1906 `archDeck(A, s)`**: Belaghöhe, `peak · sin(π·s/N)`.
- **1907 `archSpan`**, **1908 `archCenters`**: Pfahlabstand (ab 5 Feldern 2).
- **1915 `archOpenings(A)`**: Bogenöffnungen Stein/Ziegel: ≤ 6 je Pfeilerabstand eine; 7–11 Haupt- und Nebenbögen; 12–13 zwei Haupt- und zwei kleine; ab 14 zwei große. Nutzer, Block 150: **„3, 6, 16 perfekt, nicht mehr anrühren“.**
- **1927 `archBoatOk(A, s)`**: Wand nur in einer Öffnung mit h ≥ 9 und |s − c| ≤ 0,85 r; sonst Belag ≥ 12.
- **1932 `wegBridgeLift(px, py)`**: Figurenhöhe auf dem Bogen, 0 auf flachen Brücken.
- **1936 `PLANNED`**, **1937 `isBridgeAt`**, **1938 `wegLike`**, **1939 `armsWith`** (mit `wegLink`, nie über eine Anhöhenkante), **1940 `straightArms`**.
- **1944 `bridgeArmsAxis(px, py, plus)`**: Achse aus den Armen, quer nur Brückenfelder; −1 = Kurve oder Abzweig. Bei Gleichstand gilt die Richtung eines eindeutigen Brückennachbarn (`bridgeRowAxis`, 1957; Regel „Brückenrichtung“ CLAUDE.md:576).
- **1962 `bridgeShapeError(x, y, water)`**: vom Ufer aus, nur gerade, keine Abzweige, ≤ 16 lang, ≤ 4 breit.
- **1976 `bridgeSpan(x, y)`**: Flutfüllung über `isWegBridge`, schließt breite Reihen ein.
- **1988 `setBridgeKind`**: ganze Spanne. Alte Art voll zurück, neue zahlen, `canPay`. Setzt oder löscht `brk` relativ zum Stil. Danach `groundVersion++`, `recalc`, `save`. **Keine Freischaltprüfung.**
- **2002 `wegCarrier`**, **2005 `wegCellStyle`**, **2006 `setWegCell`** (Brücke: Stil neu, Art einfrieren), **2047 `restyleWeg`** („alle verbundenen umfärben“, je Feld `ITEMS.weg.cost`).
- **2060 `setBridgeStyle`** (66d): Belag der ganzen Spanne, je Feld `ITEMS.weg.cost`, Art bleibt.
- **2073 `setBridgeColor(x, y, key, v)`**: kostenlos, ganze Spanne, `groundVersion++` und `save()`, kein `recalc`.
- **2078 `newBridgeKind`**: Art eines neuen Felds. Wie ein *gebauter* Brückennachbar, sonst nach aktuellem Stil.
- **2079–2081 `costOf`**: Weg auf Wasser kostet `WEG_BRIDGE[newBridgeKind]` statt `ITEMS.weg`.
- **2555 `seaCross`**: Für Schiffe `'x'`/`'y'` (quer durch), `'block'` oder `null`. Bogen mit `!A.pass[A.i0]` gibt `'block'`.
- **2569 `seaStep`**, **2578 `seaBridgesCheck`**: Kennung aus allen Brückenfeldern samt `seaCross`; bei Änderung `seaCache.clear()`. Läuft aus `recalc` (829).
- **2928–2931 `placeError`**: Weg ins fremde Meer: `claimable`, sonst `BRIDGE_SEA` oder `seaGapBridgeable`.
- **2957–2960 `placeError`**: Weg auf Wasser → `bridgeShapeError(…, true)`.
- **2975 `placeError`**: Weg an Land neben einer Brücke → `bridgeShapeError(…, false)`, kein Abzweig.
- **2901 `placeError`**: Aufschütten unter dem eigenen Brückenfeld ist erlaubt.
- **3416 / 3428–3430 `demolishInfo`**: `paid = WEG_BRIDGE[bridgeKind(t)]`, `full = true` (Wege voll zurück), Beschriftung „Brücke entfernen“, **je Feld**.
- **3065 `fullValue`**: kennt nur die Schienenbrücke, Wegbrücken ergeben `ITEMS.weg`. Wird nur in Migrationen benutzt (Rathaus 3099, Hafen 3146/3155, 3280).
- **2171 `roofError`** und actions.js:463: kein Dach auf Brücken.
- **1385 `plainWeg`**: keine Stände oder Gebäude auf Brücken.
- **1657 `smallError`**: `terrainAt === 'water'` → „Nicht auf dem Wasser“, also **gar keine Deko auf Wegbrücken**, auch keine Laternen. Eckpunkte: 1650 „Nicht ans Wasser“.

### actions.js
- **29–43** Umfärben eines bestehenden Wegs: Bei Brücken wird `brk` eingefroren (36).
- **118** `bridge`-Merker; **127** `claimSea(…, bridge)`.
- **141–146** Aufschütten unter einer Brücke: `bridge` und `brk` werden gelöscht, der Unterschied kommt zurück. **`brc`/`brw` bleiben am normalen Weg stehen.**
- **152** neues Feld mit `bridge: true`, ohne Wegform.
- **155–158** Verlängern übernimmt `brc`, `brw` und `brk` vom ersten Brückennachbarn (Reihenfolge `DIRS`).
- **160** `lauf`; **175** `addFloat` zeigt `d.cost` (Wegpreis) statt Brückenpreis (nur beim Einzelbau sichtbar).
- **186 `claimSea`**, **191 `demolish`** (Erstattung aus `demolishInfo`).
- **474–478 `groupErrors`**: Brücke nur übers Wasser, Weg auf Wasser nur als Brücke. **508 `dropGroup`**: `claimSea`.
- **577–580 `copyTileCost`**: Kopie kostet `WEG_BRIDGE[bridgeKind]`.
- **632–639 `moveError`**, **657 `dropAt`**: dieselben Wasserregeln.
- **1175 `undo`**: Wasserbrücken zählen unter einer Anhöhenbrücke als „zu hoch“.

### plan.js
- **79 `planCheck`**: Umfärben ohne Wegform bei Brücken.
- **84–90**: Neu → `placeError(…, { noCost })` und `costOf` (Preis aus `newBridgeKind`).
- **93–135 `planScan`**: `grow` für Wege (100), `PLANNED = new Set()` (103), Prüfung in Runden: Jede Runde macht neue Felder „ufernah“. Geplante Felder kommen in `PLANNED` (123), Meeresfelder werden kurz in `state.claimed` gelegt (124).
- **316–331 `runPlan`**: alles in `batch()`. `build` läuft in der Reihenfolge der Runden, jedes Feld sieht die vorher gebauten.

### draw-objects.js
- **959–1035 `drawWegBridge`**:
  - Grundlagen: Bogen A und `front` (960), Achse (961), breite Reihen `latF`/`latB` und `depth` (963–964), Projektion `P(a, b, h)` (965), Aussehen der Art und `LIFT` (966), Farben `brc`/`brw` (968–969; Wand: `side = bc`, `rail = shade(bc, +0,1)`; Holz: `side = shade(bc, −0,15)`, `rail = bc`).
  - Höhe: flache Rampen an Land (970–972), Bogen über `archDeck`.
  - Teile: Pfähle (976–977), Geländer 4,5 px (978–983), Brüstung 2,5 px (984).
  - Hinten (987): Holz mit hinteren Pfählen und Geländer, Stein mit hinterer Brüstung. Bei `front` entfällt das Hintere.
  - Seitenwand vorn (989–999): Bogen → `archWall`; flach: Mauer mit `pattern('bricks' | 'tiles')` und einem angedeuteten Bogen.
  - Belag (1000–1025): mit Überlapp ins Nachbarfeld (`pd`, 1003–1006). Stein/Ziegel zeigen den **echten Wegbelag samt Muster** (1007–1019), Holz/Rot Planken und Randbalken (1020–1025).
  - Vorn Brüstung bzw. Geländer (1027), offenes Ende mit Stirnseite (1029–1034).
- **1038–1086 `archWall`**: Öffnungen mit Rückwand und Gewölbe (nicht bei `front`), Mauerwerk in fester Steingröße (Ziegel RH 2,2 / BL 0,14; Stein 4,2 / 0,3; weit weg Töne statt Fugen), heller Bogenrand.
- **1160 `drawPath`**: Brücke → `drawWegBridge` (vor `patRot`, Wegrichtung wirkt also nicht).
- **883 `drawFlat`**; **1808** `drawObject('weg')` → `drawPath`.
- **739** `afterMovers`, `archWalkers` (Bahnübergang). **753–790** `ARCH_H`, `archH`, `ARCH_LOOK`, `archLook`, `archAt`, `drawArch`: Fußgängerbrücke am Bahnübergang, ein anderes System mit ähnlichen Namen.
- **649–720 `drawRailBed`**: Schienenbrücke (Pfähle, Holzdeck, Geländer), siehe 5.

### render.js
- **82 `cachedPath`**: Brücken nie im Bodenbild (66e). **86 `liveFlatSet`**: diese Felder malt der flache Durchgang live bzw. als Bildchen.
- **913 `drawBridgeOver(k)`**: Brückenfeld über einem Boot noch einmal zeichnen; bei Bögen mit `BRIDGE_FRONT = true`.
- **924 `drawArchBridge`**: Bogen in der Objekt-Reihenfolge; weit weg `spriteArchBridge`, im GL-Bild `glLive(TW, peak+30, TW, TH+12)`.
- **929 `spriteArchBridge`**: Schlüssel `arch|x,y|fog|lit`, Fassung `groundVersion`, `prewarm` für `lit`.
- **1031 `spriteFlat`**: Schlüssel `flat|x,y|fog|lit`, Rahmen (TW·0,75+24, TH+60, TH+70).
- **1581–1610 `worldGround`**: flache Brücken nach dem Boden (1602: Bögen überspringen).
- **1832–1836** Boote: `m.under` = Brückenfelder, die der Rumpf berührt (`seaCross` wahr).
- **2063** `tileA`: `t.b === 'weg' && t.bridge && bridgeArch` → `drawArchBridge`.
- **2135–2145** `tileB`: Bewohner auf der Fußgängerbrücke am Übergang → `archWalkers`. Nach einem Boot `drawBridgeOver` (GL-Rahmen 0,8·TW, **70·z nach oben**) und alles auf der Brücke noch einmal (Block 112).
- **2148–2149** `afterMovers`, `archWalkers`.
- **1083 `FLAT_HIT`**: Weg und Schiene werden über das Bodenfeld getroffen, siehe 6.

### movers.js / gl.js
- movers.js:11–17 **`walkable`**: Auf Wasser nur eine Wegbrücke.
- movers.js:366–370 **`drawFigure`**: `lift = archH` (Bahnübergang) bzw. `wegBridgeLift` (Wasserbogen), Schatten an den Füßen mit angehoben.
- gl.js:550–556 **`glMoverBox`**: Rahmen um `wegBridgeLift` höher.
- gl.js:676: flache Brücken liegen im Bodenteil des Standbilds („Boden, Wellen, Tiefe, Brücken, leuchtende Wege“).

### ui.js (Fenster)
- **1927–1934**: Arten aus `WEG_BRIDGE` als Knöpfe (`data-brk`, ohne Preis, ohne Sperre). Darunter Bauwerksfarbe `data-brc` („wie die Brücke“ und 10 Farben). Dann bei Wand Belag (`wegPickHtml(…, 'brs')`), sonst Planken `data-brw`.
- **1943** Titel `WEG_BRIDGE[kind].name`; **1951** Beschreibung.
- **2044–2049** Knöpfe, alle in `undoable`: `setBridgeKind`, `setBridgeStyle`, `setBridgeColor`.
- **2041** `wireWegForm` läuft auch für Brücken (das HTML dafür fehlt dort).
- „Das ist neu“: 3285, 3299–3302.

### state.js / live.js / story.js
- state.js:78, 85–87 `tileOut`. **`parseSave` prüft die Felder nicht** (state.js:344: `tiles: new Map(d.tiles)` ungefiltert), es gibt auch keine Brücken-Migration.
- live.js:109–124 **`liveApplyMaps`**: Felder kommen per `JSON.parse` **direkt** in `state.tiles`, an `parseSave` vorbei (Live-Spiegel, Zuschauen, Besuch).
- story.js:514 Erfolg „Brückenfelder“: `tileCount(t => t.bridge)` zählt Weg- **und Schienen**brücken, keine Anhöhendecks (`state.bruecken`). Stufen 10 und 50.

---

## 3. Regeln und Invarianten

1. Ob ein Feld eine Brücke ist, nur über `isWegBridge` bzw. `isBridgeAt` (CLAUDE.md 75).
2. Art und Farben gelten für die ganze Brücke (`bridgeSpan`). Ändern nur über `setBridgeKind`, `setBridgeStyle` und `setBridgeColor`, sonst stimmt die Erstattung nicht.
3. Brücken wachsen vom Ufer aus und bleiben gerade: parallele Reihen ja, Abzweig oder Ecke auf dem Wasser nein. Pläne brauchen dafür `PLANNED` und die Runden in `planScan`.
4. Bezahlt wird je Feld `WEG_BRIDGE[Art]` statt des Wegpreises. Abriss gibt alles voll zurück. Aufschütten gibt den Unterschied zurück. Umfärben behält die bezahlte Art (`brk` wird eingefroren).
5. Bogen nur ab 2 Feldern mit Land an beiden Enden. 1 Feld und Steg ins Meer bleiben flach (Nutzerentscheidung Block 150). Höhe ist ab 16 Feldern gedeckelt. Ältere, längere Brücken bleiben stehen.
6. Boote fahren nur quer unter einer Brücke durch und nur an hohen Stellen bzw. durch Öffnungen. Ist keine Stelle hoch genug, ist überall frei (nie absperren).
7. Auf Brücken gibt es keine Läden, Gebäude, Deko, Dächer, Bahnübergänge, Vorplätze oder Gartenwege.
8. Bögen zeichnet die Objekt-Schleife, nie der flache Durchgang (CLAUDE.md:574).
9. Richtung nur über `bridgeArmsAxis`. Immer beide Richtungen testen, auch bei breiten Brücken (CLAUDE.md:576).
10. Die Bogenöffnungen aus Block 150 nicht anrühren („3, 6, 16 perfekt“).

---

## 4. Zeichenweg (ein Bild)

1. **Bodenbild:** Brücken stecken nie darin (`cachedPath`).
2. **`worldGround`:** Flache Brücken werden nach dem Boden und vor allen Objekten gezeichnet: weit weg als `spriteFlat`, im GL-Bild per `glLive` bzw. im Bodenteil des Standbilds, nah `drawFlat → drawPath → drawWegBridge`.
3. **Bewegtes einsortieren:** Boote bekommen `m.under` (1832–1836).
4. **Feldschleife `tileA`:** Ein Bogen wird am eigenen Feld in Maler-Reihenfolge gezeichnet: `drawArchBridge` → `spriteArchBridge` (weit weg) oder live bzw. per `glLive`.
5. **Feldschleife `tileB`:** Figuren des Felds folgen, angehoben über `wegBridgeLift`. Nach einem Boot kommt `drawBridgeOver` (bei Bögen nur das Vordere), danach wieder, was auf der Brücke fährt oder geht.
6. **Nacht:** Wegbrücken rufen heute **kein einziges `glowQuad`** auf. Bildchen haben trotzdem schon `lit` im Schlüssel und `prewarm`.
7. **Schlüssel:** In den Bildchen-Schlüsseln stehen weder Art, Farbe noch Stil. Ein neues Bild entsteht nur über `groundVersion`. Das erhöhen heute alle Setzer (`setBridgeColor` direkt, die anderen über `recalc`).
8. **Kein Schlagschatten:** Wegbrücken werfen keinen Schatten. Bei 👁 Durchsicht werden sie nicht blass (`fadeIt` lässt `weg` aus, render.js:2017).

---

## 5. Zusammenhänge mit anderen Systemen

- **Wegenetz und Viertel:** `computeNet`, `pathArms`, `wegNetwork` und `wishMet('weg')` funktionieren nur, weil die Brücke ein Wegfeld ist. Würden Wasserbrücken zu Objekten wie `state.bruecken`, bräuchten alle diese Stellen einen Ersatz (wie `bkLinks` und `bkArmFrom` in bruecken.js).
- **Schiffe:** `seaCross`, `seaStep`, `nearestWater` und die Fanggebiete (rules.js:2545, 2611, 2665) hängen an `bridgeArch().pass`. Fische lassen Felder neben Bebautem aus (movers.js:1089).
- **Schienenbrücke:** Sie liegt auf demselben Feld, hat aber ihren eigenen Preis `BRIDGE`. Beide Brücken teilen sich `cachedPath`, `seaCross`, `seaBridgesCheck`, `demolishInfo`, Aufschütten und den Erfolg. Die „Bahnbrücke flach übers Wasser“ aus 160c ist dieses Feld.
- **Bahnübergang mit Fußgängerbrücke:** `FOOT_STYLES` (rules.js:2262, Kostenform `{ money, … }`, `footPaid` true/holz/stein/weg/kristall), `ARCH_LOOK`, `archAt`, `archWalkers`, `afterMovers`. Nach 160c gehört er zur Fußgänger-Familie.
- **Anhöhenbrücke (bruecken.js):** keine Wasserbrücke unter einem Deck (bruecken.js:58, 75; Test bruecke:135–138). Deren Arten heißen `holz` und `stahl`, die Wasserbrücken `holz`/`stein`/`ziegel`/`rot`. Ein gemeinsames Material braucht eine Zuordnung, etwa stahl ↔ metall.
- **Anhöhen:** `armsWith` nutzt `wegLink`. Von einer Anhöhe aus wächst keine Wasserbrücke („vom Ufer aus“).
- **Strom:** Laternen zählen in `computePower` (rules.js:2784–2794, Kennungen in `power.dark`). Brückenlicht ist dort heute nicht eingerechnet.
- **Rückgängig:** Brückenfelder laufen als Felder durch `UNDO_MAPS.tiles`, alle Fensterknöpfe in `undoable`.
- **Live-Spiegel und Cloud:** Felder einzeln ohne `parseSave` (live.js:111); `state.bruecken` steckt im `rest` und läuft durch `parseSave`.

---

## 6. Risiken für den Umbau 160c

**A. Alte App-Versionen und neue Werte (am kritischsten).** Ein unbekanntes `brk` wie `'metall'` oder `'kristall'` lässt ältere Versionen abstürzen, sobald das Feld bei einem anderen eigenen Gerät, einem Freund oder einem Besuch ankommt. Die Stellen:
- ui.js:1929/1931 `BRIDGE_LOOK[kind].wall` (TypeError)
- ui.js:1943 `.name`
- rules.js:3416 und 3428 `paid.cost`
- actions.js:143 und 579
- rules.js:1993 (`setBridgeKind`)
- `costOf`/`planCheck` beim Verlängern

Nur das Zeichnen fällt auf Holz zurück (draw-objects.js:966). Vorschlag: Das neue Material in ein **neues Feld** legen und in `brk` einen Wert lassen, den alte Versionen kennen.

**B. Live-Spiegel umgeht `parseSave`.** Eine Umwandlung nur in `parseSave` reicht nicht. Neue Versionen bekommen von alten Geräten weiter `brk: 'ziegel' | 'rot'` oder Brücken ohne `brk` mit Ziegel-Stil. Die Laufzeit-Abfrage (Ersatz für `bridgeKind`) muss alle alten Formen lesen können.

**C. Art steckt im Stil.** 48 von 80 Brücken in „neu“ und alle in „OG“ haben kein `brk`. Wird der Belag frei wählbar, darf der Stil die Art nicht mehr bestimmen. Die Art muss vorher ausdrücklich festgehalten werden, und die drei Einfrier-Stellen (actions.js:36, rules.js:2009, 2068) fallen dann weg oder ändern sich.

**D. „Gleich aussehen“ bei Ziegel → Stein und Rot → Holz ist nicht nur eine Farbe** (mit `shade`/`mix` linear nachgerechnet):
- **Ziegel:** Mauerwerk `bricks` mit kleinen Steinen (Bogen: RH 2,2 / BL 0,14; flach: `pattern('bricks')`). `rail #c97a5e` ≠ `shade(#b5654a, +0,1)` = `#bc745c`. `side` = `BRIDGE_COLS[8]` passt.
- **Rot:** `side #a8392f` ≠ `shade(#d9483b, −0,15)` = `#b83d32`. Deck `#c79a6a` und Planke `#9a7048` gibt es in `PLANK_COLS` **nicht**. Flach (1 Feld, Steg ins Meer) liegt Rot 8 px hoch, Holz 3 px.
- Steht schon ein `brc`, bleiben nur Mauerwerk, Deck und Höhe als Unterschied.

**E. Widersprüche zu früheren Entscheidungen.** Block 150 sagt „1 Feld bleibt flach“, 160c „1 Feld: kleiner Buckel“. Der Steg ins Meer (offenes Ende) kann kein Bogen sein, „Fußgänger immer Bogen“ lässt ihn offen. Stein-Öffnungen „nicht mehr anrühren“, die Balustrade ersetzt aber die Brüstung (`parapet`). Das sollte mit dem Nutzer geklärt werden.

**F. Bildchen- und GL-Rahmen sind knapp.**
- `drawBridgeOver` im GL-Bild hat 70·z nach oben. Bei 16 Feldern liegt das vordere Geländer etwa 70 px über der Feldmitte, Laternen darauf würden abgeschnitten.
- `spriteArchBridge` und `glLive` haben `peak + 30`, `spriteFlat` TH + 60.
- Neue Optionen (Licht, Zacken, Material) brauchen `groundVersion++` oder einen Eintrag im Schlüssel, sonst bleiben alte Bildchen stehen.

**G. Licht.**
- `glowQuad` erst **nach** dem Leuchtenden aufrufen (Regel 112), Kristall mit `'blue'` (`BLUE_SPOT`).
- `drawBridgeOver` zeichnet live noch einmal, das Licht wird also doppelt gestanzt (`nightDedup` prüfen).
- Zählen die Lampen zum Strom, brauchen sie Kennungen in `computePower` und `dark` im Bildchen-Schlüssel (wie bei `spriteSmall`).
- Der Leistungs-Wächter misst „neu“ (80 Brücken) und „freizeitpark“ auch nachts. Die Werte steigen und müssen begründet neu aufgenommen werden.

**H. Kosten liegen an elf Stellen.** `costOf`, Verlängern, `setBridgeKind`, `setBridgeStyle`, `restyleWeg`, build-Umfärben, `demolishInfo`, Aufschütten, `copyTileCost`, `fullValue`, `addFloat`. Aufpreise für Licht oder Kristall müssen überall gleich zählen, beim Wechsel der Art erstattet und beim Verlängern übernommen werden (actions.js:157 kopiert heute nur `brc`, `brw` und `brk`). Die drei Kostenformen (`WEG_BRIDGE`, `FOOT_STYLES`, `BK_ARTEN`) sind verschieden aufgebaut.

**I. Freischaltung.** `setBridgeKind` und das Fenster prüfen heute nichts. Für Insel-Freischaltungen braucht es `unlockOk` (`lm`) bzw. `state.islands`, ein Eintrag in `ITEM_TIPS`/`unlockKeys`, und alte Stände behalten ihre Brücken.

**J. Gemischte Spannen.** Einzelne Brückenfelder lassen sich verschieben oder kopieren (`moveError`, `groupErrors`). Sie bringen ihr `brk`/`brc` mit, eine Spanne kann also gemischt sein. Optionen pro Brücke brauchen eine Regel, welches Feld gilt.

**K. Namen.** `arch*` ist schon dreifach belegt: rules.js (`archDeck`, `archSpan`, `archCenters`, `archOpenings`, `archBoatOk`), draw-objects.js (`ARCH_*`, `archH`, `archAt`, `archLook`, `drawArch`) und hills.js (`archHillError`, `archAround`). Ein zweites `function x` in einer späteren Datei ersetzt das erste still. Dazu die Ladereihenfolge: rules.js darf `BRIDGE_COLS`/`BRIDGE_LOOK` (draw-objects.js) nur zur Laufzeit benutzen. `wall` ist in rules.js:1899 doppelt aus den Artnamen abgeleitet.

**L. Antippen.** `FLAT_HIT` trifft Weg-Bögen über das Bodenfeld. Wer auf einen hohen Bogen tippt, trifft das Feld dahinter. Bei höheren Brücken wird das schlimmer; bruecken.js hat dafür `bkPick`.

**M. Bereits vorhandene Ungenauigkeiten.**
- Die Plan-Vorschau rechnet beim Verlängern über mehrere neue Felder den Stil-Preis, gebaut wird zum Preis der Nachbarbrücke (`newBridgeKind` sieht nur Gebautes).
- `fullValue` kennt keine Wegbrücken.
- Aufschütten lässt `brc`/`brw` liegen.
- `bridgeAxis` nimmt `t.rot` als Rückfall (Regel 125: nie).
- Kristall-Belag leuchtet auf Brücken nicht.
- Vermutlich, nicht geprüft: Eine ganze aufgenommene Brücke lässt sich schwer ablegen, weil `groupErrors` ohne `PLANNED` prüft („vom Ufer aus“).

**N. Tests und Testwelten hängen an den alten Arten.** `neuwelt.test.js` erwartet `'9ziegel'` und `'3rot'`. `tools/neuwelt.js:23` und die Testwelt Freizeitpark setzen `brk` ziegel/rot. Brückenschau und Entwürfe nutzen `setBridgeKind('rot')`.

---

## 7. Tests, die den Bereich abdecken

- **tests/bruecken.test.js** (Block 66):
  - Linie übers Wasser ergibt 3 Brückenfelder; Preis = 4 × Weg + 3 × Holz; `walkable`; Art nach Stil (sand → holz, asphalt → stein); Zeichnen ohne Fehler.
  - Nur vom Ufer, kein Abzweig, keine L-Ecke.
  - `setBridgeKind('rot')`: Preis für die ganze Brücke, Speichern und Laden, Umfärben behält die Art, Abriss erstattet Rot, kein Kiosk.
  - Meer: höchstens 3 Felder, Aufschütten macht wieder einen Weg.
  - Farben `brc`/`brw` über das Fenster, gespeichert, „wie die Brücke“, alle 4 Arten zeichnen.
  - Ganze Spanne, Verlängern übernimmt `brk`/`brc` zum Rot-Preis.
  - Belag im Fenster (66d): Preis, Art bleibt Stein, Land bleibt.
  - `cachedPath` (66e).
- **tests/bogenbruecken.test.js** (Block 150/151):
  - Bogen erst ab 2 Feldern, Höhe in der Mitte, Enden 0; Steg ins Meer flach.
  - Öffnungen 6/9/12/16 → 1/3/4/2.
  - Boote `##-#-#-##` (9 Stein), `#-------#` (9 Holz), 2 Felder nie gesperrt.
  - `wegBridgeLift`; alle Arten × Längen nah, weit und `drawBridgeOver`.
  - Höchstens 16 Felder, `seaGapBridgeable`.
  - Breit: 4 Reihen ja, die 5. nicht; `seaCross 'x'`; Abzweig verboten; Nord-Süd ohne Löcher.
  - Fische nicht unter oder neben Brücken.
- **tests/neuwelt.test.js**: Erzeuger baut über 70 Brücken mit Bögen `16`, `9ziegel`, `6holz`, `3rot`, `2`, `12`.
- **tests/fehler84b.test.js:91–96**: `moveError` „Brücke nur übers Wasser“ und „Weg braucht Brücke“.
- **tests/webgl.test.js:37**: `liveFlatSet` enthält Brücken.
- **tests/vorplatz.test.js:30/45**: kein Vorplatz und kein Gartenweg zu Brücken.
- **tests/bruecke.test.js:135–138**: keine Wasserbrücke unter einem Anhöhendeck.
- **tests/leistung.test.js**: Testwelten neu und freizeitpark, Tag und Nacht, alle Zoomstufen. Jede Zeichenänderung an Brücken verschiebt die Zahlen.
- **tests/monkey.test.js**: Zufallsbau mit Wasser bei x = 9, `serialize`-Rundlauf. Vergleicht nur Serialisiertes, ein Feld, das nicht in `tileOut` steht, fällt also **nicht** auf.
- **Nur am Rand:** bahn.test.js (Schienenbrücken: Kosten, Abriss, Aufschütten, Laden), planen.test.js:107, bahn-gemuetlich:54. testwelt-freizeitpark läuft nur mit `TESTWELT=1`.
- **Prüfwerkzeuge (Bilder):** tools/brueckenschau.js, brueckenfamilie-entwurf.js und brueckenlicht-entwurf.js (abgenommene Modelle und Licht), kristallbruecke-entwurf.js, bogen-anhoehe-entwurf7/8.js.

---

## 8. Nebenbefund außerhalb des Bereichs

`t.lauf` (Wegrichtung, Block 158) steht **nicht** in `tileOut` (state.js:66–112). Es gibt dazu nie einen Commit (`git log -S lauf -- js/state.js` ist leer), und keine Testwelt enthält `"lauf"`. Damit geht die Wegrichtung nach Speichern und Laden bzw. im Live-Spiegel vermutlich verloren. Das sollte getrennt geprüft werden.