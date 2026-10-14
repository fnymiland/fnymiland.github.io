# E1 Baukarte: Gleisbrücken übers Wasser, Zeichenort mit altem Aussehen

Stand `f933b89` (HEAD). Die Karte führt Karte A („muster“) und Karte B („sicher“) zusammen. Alle Streitpunkte habe ich im Code nachgelesen. Ich habe nur gelesen: keine Datei geändert, keine Tests, kein npm, kein Browser. Die Feldzahlen habe ich mit `node -e` aus den lokalen Ständen gezählt, auch das nur lesend. Alle Zeilen gelten für HEAD. `karte-gleisbruecke-wasser.md` nennt noch Zeilen von `61a273b`.

Kennzeichnung:
- **[geprüft]**: im Code nachgelesen
- **[gerechnet]**: aus den Konstanten nachgerechnet (TW 64, TH 32, data.js:8; Punkt (u, v, h) → X = 32(u−v), Y = 16(u+v) − h)
- **[gezählt]**: mit node aus testsave-*.json gezählt
- **[vermutet]**: weder gemessen noch im Bild gesehen
- **[Bericht]**: Zahl aus einem Lesebericht, nicht nachgeprüft

## 0. Heute, was fehlt, Entscheidung

### Heute [geprüft]

**Erkennung**
- `cachedPath` ist bei `t.bridge` falsch (render.js:82). Darum kommen Gleisbrücken nie in die Bodenkachel.
- `liveFlatSet` (render.js:86–96) nimmt jede Schiene mit `!cachedPath` auf. Ausgenommen sind nur Wegbrücken (`!isWegBridge`, :93).

**Boden-Durchgang `worldGround` (render.js:1617–1647)**
- Gezeichnet wird in der Reihenfolge von `visible`. Bei `groundCached` laufen nur die `liveFlat`-Felder. Nah ist `liveFlat` null (:1631), dann läuft die Schleife über **alle** sichtbaren Felder (:1633).
- Wegbrücken steigen bei :1638 aus, Schienen nicht.
- Je Gleisbrücke:
  - `FOG = !ownedTile` (:1639)
  - weit weg `spriteFlat` (:1015–1032): Schlüssel `flat|x,y|F|lit`, Fassung `groundVersion`, Rahmen 72/92/102·zs (also 144 × 194), dazu `prewarm` (:1027). Das legt nachts ein zweites, gleiches Bildchen an, obwohl die Brücke kein Licht hat.
  - im GL-Bild ohne Bildchen: `GL.stats.miss++` und eine Zelle 64/92/64/102·z (:1641)
  - sonst `drawFlat` → `drawRailBed`
- Im GL-Bild liegen Gleisbrücken im Bodenteil (`GLS.gEnd` :1686, abgespielt als `['s', 0, GLS.groundEnd]` gl.js:682).
- Ein fehlendes Bildchen setzt `GLS.dirty`. Dann verwirft der Hintergrund das ganze Standbild (`B.bad`, gl.js:738), und `GL.lastMiss` (gl.js:399) sperrt die nächste Aufnahme („2D-Reste“, :599).
- Beim Abspielen läuft die flache Schleife trotzdem, denn :1633 fragt `glPlay` nicht ab.

**Danach**
- Nah malt `drawShadows` nach dem Boden-Durchgang (render.js:1688–1693). Hausschatten liegen dort **über** der Brücke.
- Plan-Rauten (render.js:1417–1426) und Einzelfeld-Rahmen (:1702–1709) kommen vor der Feldschleife. `deckMark` gibt es nur für `bkAt`/`wbAt` (:1419, :1703).

**tileA**
- `drawIt0` steigt bei Schiene ohne Übergang aus (render.js:2073).
- `bw` kennt nur `bc` und `wc` (:2031–2032).
- :2114 übergibt bei Schiene `drawIt` als `under`.

**tileB**
- Ein Wagen wird ganz in `tileB` seines gerundeten Felds gezeichnet (render.js:1859, `moverLive` :2209), also über Deck und Geländer.
- Stücke gibt es nur an Anhöhen-Brücken: `bkCarPieces` (bruecken.js:582–598) und `brCarPiecesUnder` (:602–635), eingehängt bei render.js:1861–1877.
- Boote:
  - `m.under = boatUnder(m)` (render.js:1879). Bei Schienen nimmt es das eigene, frühere und spätere Felder. Den `done`-Filter gibt es nur für Wegbrücken (:1310–1311).
  - Nach dem Boot kommt `boatOver` (:2186–2194) → `bridgeOverBoat` (:1298–1302; mit GL eine 70·z-Zelle, :1300) → `drawBridgeOver` :926 → `drawRailBed` ganz, ohne Ausschnitt, mit `FOG = false` (:2202).
  - Danach Block 112 (:2190–2192): schon gezeichnetes Bewegtes der 3×3-Nachbarn mit |Δ| < 1 noch einmal.

**`drawRailBed(bridge)` (draw-objects.js:663–733)**

| Teil | Zeilen |
|---|---|
| Pfähle `#6f5238`, nur aus `segs[0]`, beide Seiten abwechselnd, `fillRect` −1z…+6z | :672–679 |
| Deck 0,3 / 0,27 | :680–681 |
| Bett bzw. Pflaster, Schwellen, `railTrim` | :683–700 |
| Übergang (auf Brücken nie gebaut, rules.js:2334) | :701–712 |
| Schienen und Glanz | :714–716 |
| Prellbock | :717–723 |
| Geländer: **ein** Pfad für alle Stücke und beide Seiten, 3z hoch, 0,9z breit. `lineCap`/`lineJoin` erbt es als `'round'` von `stroke()` (:667) bzw. vom Prellbock (:719). Der Kommentar „wo kein Nachbar-Gleis anschließt“ (:724) stimmt nicht: gemalt werden immer beide Seiten | :724–732 |

Licht gibt es keins (kein `glowQuad`).

**`railSegments` (draw-objects.js:625–632)**
- Kurve: **ein** Bogen aus 11 Punkten (`arcPts(…, 10)`).
- Gerade: ein Stück von Kante zu Kante.
- Ende: ein Stück von der Mitte zur Kante.
- Ohne Arme: ±0,36 nach `rot`.
- T/X: je Arm ein Stück ab der Mitte.

**Der gemeinsame D1-Code setzt eine Wegbrücke voraus**

| Stelle | Folge für eine Gleis-Zelle mit `water: true` |
|---|---|
| `bkDrawLagen` (bruecken.js:657–668) | Der Wasserzweig kehrt bei `!isWegBridge` leer zurück (:661): unsichtbar, und die Leistungszahlen sähen besser aus. |
| `spriteBridge` (brueckenbild.js:222) | Präfix `wb`/`br`. |
| `bkMoverClass` (:245) | Züge sind immer `'U'`, danach malt `bkRedo(vd)` das Deck über sie (:302). |
| `bkDrawMoving` (:295) | `c.G.startPost` gibt bei `G: null` einen TypeError. |
| `wbRelight` (:175) | `c.G.mat` gibt einen TypeError, sobald `WB_GLOW0` für das Feld gesetzt ist (:170–171). Aufgerufen wird es aus `bkDrawStill` :159 und aus jedem `bkRedo` :270. |
| `wegDeckH` (rules.js:1901) | Ohne `lift` liefert `flatDeckH` NaN (:1884). Gelesen wird es in render.js:1420, :1704 und wbRelight :176. |

### Daten [gezählt]

Gezählt sind Nachbarn mit `b === 'schiene'` in `state.tiles`, ohne GEXIT/Einfahrt.

| Stand | Gleisbrückenfelder | gerade | Kurve | T | X | Enden |
|---|---|---|---|---|---|---|
| bruecken | 82 | 67 | 1 (22,36) | 13 (Leiter 8–13 × 40/41 und 32,35) | 1 (43,36) | 0 |
| og | 212 | 197 | 15 | 0 | 0 | 0 |
| bauland | 433 | 429 | 4 | 0 | 0 | 0 |

- Alle `testsave-*.json` liegen nur lokal (`.gitignore`).
- In bruecken (tools/brueckenwelt.js:50–57) liegen außerdem:
  - ein Lauf 3–34,46, Rasengleis bei x % 7 = 0
  - Bahnhöfe 5,34 und 15,34
  - eine echte Linie über die gerade Brücke (:82)
- Ein „Doppelgleis“ direkt nebeneinander verbindet sich über `railArms` quer (rules.js:2236). Auf dem Wasser sind das lauter T-Felder („Leiter“).

### Was fehlt

- Gleisbrücken in der Maler-Reihenfolge (tileA): ruhend ein Bildchen je Feld, im GL-Standbild ruhend.
- Nachmalen über Booten nur im Rahmen des Boots, ohne verschachtelte Zellen und mit richtigem `FOG`.
- Wagen in Stücken je Feld; das vordere Geländer nach den Wagen.
- Vorschau und Nachtschein auf dem Deck.
- Kein `|lit`, kein `prewarm`. Fehlt ein Bildchen, wird nur dieses Feld lebendig.

### Entscheidung

**E1 ist „D1 für Gleisbrücken“, mit eigenem, schlankem Brückenfeld.**
- `gbAt(x, y)` liefert `{ water: true, rail: true, A: null, ax, b: { ax, n: 1 }, W: 0.3, lift: 0, landA: false, landB: false, hm: 0, G: null }`. Es läuft durch dieselben B2/D1-Funktionen mit dem Parameter `c`: `bkGroup`, `spriteBridge`, `bkRedo`, `bkDrawStill`, `bkDrawMoving`, `brBox`, `bkMoverClass`, `deckMark`.
- `bkDrawLagen` bekommt **vor** dem Wasserzweig einen Gleiszweig, der den alten Maler `drawRailBed(…, lagen)` ruft.
- `wbAt` bleibt unberührt.
- E2 füllt dann `c.G`, tauscht den Maler in diesem Zweig und weitet `brBox` für Gleise.

**`drawRailBed` in Lagen (8. Parameter `lagen`)**

Die Außennormale je Teilstück ist n = s·(−dir_v, dir_u); vorn heißt n_u + n_v > 0, also s·(dir_u − dir_v) > 0 [geprüft an offsetPath :645–650 und den Pfählen :676].

| Lage | Inhalt | Zeilen |
|---|---|---|
| h | hintere Pfähle | :674–678, gefiltert |
| v | vordere Pfähle | :674–678, gefiltert |
| d | Deck, Bett, Übergang (nur Altdaten), Schienen, Glanz, Prellbock, **dazu jedes Geländer außer dem vorderen eines Felds mit einem geraden Stück** | :680–723, :724–732 gefiltert |
| o | vorderes Geländer, **nur** bei `segs.length === 1 && !roadCurve(arms)` (gerade, Ende, Einzelfeld). Kurve, T, X und Leiter: leer | :724–732, gefiltert |

- **Ruhend `'w'` = ein Aufruf mit `lagen = null`.** Das ist der alte Code, also pixelgleich.
- **h, v, d, o nacheinander** ergeben dieselben Flächen und dieselben Strichstücke. Gerade Felder haben dann zwei Geländerstriche statt einem, 0,58 Feld auseinander. Kurve, T und X bleiben ein Strich.
- Die Pfähle haben alle dieselbe Farbe, sind deckend und überdecken sich nicht. Umsortieren ändert kein Bildpunkt [gerechnet].

**Rahmen über `brBox` mit `hm = 0`** (brueckenbild.js:11–20) [geprüft, Inhalt gerechnet]
- w/h/o = [38, 32, 38, 22], vd = [38, 24, 38, 22].
- Der Inhalt reicht oben bis −16,1 (hinteres Geländer an der hinteren Kurvenecke) und unten bis +18,1 (innerer Pfahl der vorderen Kurve; Karte A nannte 17,4). Seitlich reicht er bis 25,8.

### Ordnung je Gleisbrückenfeld T (Ziel nach E1)

| Wann | Was |
|---|---|
| tileA(T) | Kanten (`drawEdgesAt`) → `bkDrawStill` → `'w'` (Bildchen `gb|x,y|w|F` bzw. live) → `wbRelight` (E1e) → Plan-Marken |
| tileB(T) | U (Boote) → `over(m)` früh: frühere Felder h+vd → Block 112 → o → `bkRedo h+vd` (live) → `figs`: Wagen bzw. Stücke von T → `bkRedo o` (live, an Kurve/T/X leer) → F (Tiere, Boote vor der Stirn) → `over(m)` für F-Boote |
| später | tileA der späteren Felder malt deren Deck. Gerade Stücke liegen nur über T (G1); ein schräger Wagen liegt ganz im spätesten Feld unter seinen Ecken (K5). Auf dem Wasser ist B leer, denn Tiere sind dort F (:244). |

### Widersprüche zwischen Karte A und Karte B, im Code entschieden

| # | Streitpunkt (A ↔ B) | Befund im Code | Entscheidung |
|---|---|---|---|
| K1 | Namen: `railBridgeAt`/`isRailBridge`/`rbCache`/`railBridgeAny`/`sclip` ↔ `gbAt`/`isGleisBridge`/`gbCache`/`gbAny`/`gbK` | Keiner der Namen kommt in js/, tests/ oder tools/ vor (grep). Jeder globale Name darf nur in einer Datei stehen (anhoehe-stufe2.test.js:26). Vorbild: `wbAt`/`isWegBridge` (rules.js:1886) mit Präfix `wb|` (brueckenbild.js:222). | **B**: `isGleisBridge`, `gbCache`, `gbFresh`, `gbAt`, `gbAny` in rules.js; `gbCarPieces` in bruecken.js; Stückfeld `car.gbK`; Präfix `gb|` (enthält kein `|schiene|`, tempo-schritt3.test.js:106). |
| K2 | Merker mit `state.tiles.size` ↔ ohne (wie `wbCache`) | `wbCache` prüft nur Fassung und `tiles` (rules.js:1889). `liveFlatSet` (render.js:89) und `WB_LIVE` (bruecken.js:60) prüfen auch die Größe. `gbAny` zählt Felder; nach `state.tiles.set` ohne recalc (Rückfall-Tests) bliebe „keine Gleisbrücke“ stehen. | **A**: mit Größe. |
| K3 | Brückenfeld mit `lift: 0, landA/landB: false` ↔ ohne, dafür `wc.rail ? …` in der Vorschau | `wegDeckH` (rules.js:1901) → `flatDeckH(c.lift, …)` (:1884) liefert ohne `lift` NaN. Gelesen wird es in render.js:1420, :1704 und brueckenbild.js:176. | **A** (G9): dann reicht an :1419 und :1703 ein `|| gbAt(…)`, die Höhe ist 0. |
| K4 | Vorderes Geländer: Kurven am Punkt 5 teilen, nur T/X leer ↔ `o` nur an geraden Feldern, Enden, Einzelfeldern | railSegments :625–632: Nur gerade, Ende und Einzelfeld haben genau ein gerades Stück, also eine Normale je Seite. E2 ersetzt Kurve, T und X durch das Eckpodest mit geraden Geländern (karte-E0.md:18–19). Heute liegt der Zug überall über dem Geländer. | **B**: Bögen zu teilen wäre Arbeit, die E2 wegwirft. Das alte Bild bleibt. |
| K5 | Schräge Wagen in der Kurve: Zone A′ mit `prevO` ↔ ganz ins späteste Feld unter Ecken und Mitte („K1“) | `bkCarPieces` schneidet nur längs (bruecken.js:588); `drawTrainCarBody` kennt nur `cut: [lo, hi]` längs (movers.js:774). Ecken lassen sich so nicht genau trennen. Vorbild für „ganz ins späteste Feld“ ist `trainOnHills` (movers.js:851, `trainTileOrder` :832). Nach K4 hat das Kurvenfeld kein `o`. | **B**: kein Biss. Über dem `o` früherer Felder liegt der Wagen wie heute (Frage 2). Genaue Kurvenstücke kommen in E2. |
| K6 | Wagen halb in der Hbf-Halle: Stücke, Hallenstück zu `hallFirst` ↔ keine Stücke | render.js:1860 setzt k = `hallFirst`, das erste gezeichnete Feld der Halle (:1853), also früh. Nach dem Umzug malt das Deck einer angrenzenden Gleisbrücke über das Wagenende. | **A** |
| K7 | Ausnahme Anhöhe: jedes `m.hill` ↔ nur `m.hill.up` | Ein `m.hill` ohne `up` heißt nur „Anhöhe davor“ (`occ`, movers.js:858–866). `drawTrainCarHill` beschneidet dann und ruft `drawTrainCarBody` (:871–882), Stücke funktionieren also. Vorbild render.js:1874: `!tc && !m.deck && !(m.hill && m.hill.up)`. | **Wie :1874**, aber mit `gbAny()` statt `bkOn()`. Damit gilt auch `!m.deck` (A). |
| K8 | Nachmalen: `o` live, h/vd als Bildchen ↔ alles live | Der Wächter lässt Bewegtes auch im gemessenen Bild fahren (`stepMovers`, leistung.test.js:29/:31) und zählt jedes neue Bildchen als `repaint` (:35, :57). In bruecken fährt ein echter Zug (brueckenwelt.js:82). Im GL-Bild öffnet `bkRedo` ohnehin eine Zelle (brueckenbild.js:273). | **B**: für `c0.rail` jede Gruppe live, kein `gb|…|h|vd|o|`. |
| K9 | Reihenfolge: Bewegtes → Stücke → Umzug → Nacht (A) ↔ Stücke → Umzug → Nacht → Bewegtes (B) | Beide Folgen zeichnen in jedem Zwischenstand richtig. Bei A nimmt E1b aus `boatUnder` nur das eigene Feld; die späteren bleiben, solange die Brücke im Boden liegt (render.js:1633). Bei B liefe zwischen Umzug und E1e der alte Bootsweg (ganzes `drawRailBed` in der 70·z-Zelle, :1300/:926) auf schon umgezogene Brücken: doppelt gemalt, aber unschädlich. | **A**: E1b und E1c lassen sich gegen das Vorher-Bild prüfen, das Bild nach E1d zeigt nur den Umzug. Von B übernommen: Bewegtes in drei Commits. |
| K10 | `over(m)` für U-Boote: direkt nach `draw(U)`, nur Gleisfelder ↔ nach `bkRedo vd` (:303), alle Wasserbrücken | Leiter, Boot unter beiden Reihen, das eigene Feld F liegt vor E. Wird E nach F's h+vd nachgemalt, landet E's Vorderpfahl (Y 16(u+v) + 3,3…10,3) auf F's hinterem Geländer (+8,4 ± 0,45) [gerechnet]. Weg-Test wasserbruecken-bewegtes.test.js:78–85: das Boot ist dort F (s 0,4 > 0,36), also unberührt. | **A**: direkt nach `draw(U)` (:301), nur `c.rail`. Für Weg ein eigener Folgeschritt (kleine Schritte). |
| K11 | Block 112: nur geteilt ↔ geteilt, mit Filter nach Stückfeld und `o` anderer Gleisfelder | render.js:2191–2192 wählt nach der Mitte des ganzen Wagens (\|o.px − bx\| < 1); Stücke tragen sie (`{ ...m, cut }`). Ein Stück eines früheren Felds käme sonst über das nachgemalte Deck von bk, und das `o` des Felds eines neu gemalten Stücks läge darunter. | **A + B**: Teilung h+vd → 112 → o in E1b; Filter `gbK` und `o` der Stückfelder in E1c (`gbK` entsteht erst dort). |
| K12 | `under` an render.js:2114 für Gleisbrücken | Heute ist `under` bei `bc` immer `drawIt` (:2114); `drawIt0` malt bei Schiene nur Übergänge (:2073). Ein Übergang auf einer Brücke ist verboten (rules.js:2334). `under` liegt zwischen h und vd (brueckenbild.js:154). | **Ohne `bc`**: `null`, also ein Bildchen `w`. Altdaten mit `cross`: `drawIt()` **nach** `bkDrawStill`, damit die Schranken wie heute über dem Deck liegen (statt A/B „`drawIt` als `under`“, dann lägen sie darunter). **Mit `bc`**: `() => { wbUnder(); drawIt(); }` (B, behält das heutige `drawIt`). |
| K13 | Licht beim Nachmalen | `bkRedo` ruft `wbRelight` nach jeder Gruppe (:270). Malt es auf Gleisfeldern nur `o`, malt es kein Deck neu; Stanzen im Deck-Ausschnitt läge dann über den Wagen. | **A**: auf Gleisfeldern nur, wenn `vd` dabei ist. Dazu **B**: Schutz `if (c.rail) return` schon in E1a, ersetzt in E1e. |
| K14 | Werkzeug: `lagen` weiterreichen ↔ nur Kopfvermerk | `maler` nimmt 7 Argumente (tools/gleisbruecken-entwurf.js:187) und malt bei jedem Aufruf alles (:188–190). Nach E1 hieße das: je Lage einmal ganz. | **A**: `lagen` an `O.drb` bzw. die eigene Lagen-Schleife, dazu Kopfvermerk „Bilder bis f933b89“. |
| K15 | Bootsgrenze im Test 0,29/0,31 ↔ 0,3/0,31 | Neu `> W ? 'F' : 'U'` (brueckenbild.js:243), alt `bx + by >= px + py − 0,3` (render.js:1309). Beide schließen 0,3 ein. | 0,3 → U, 0,31 → F |
| K16 | Fragen: 1 ↔ 3 | B-Frage 1 (Nachtschein) ist E1e und schon eingeplant. B-Frage 3: Schatten bzw. Schein am vorderen Geländer betreffen gerade weniger als 1 px (siehe unten). | Frage 1 (Nacht weit weg) und Frage 2 (Kurven) bleiben. |

**In beiden Karten gleich, im Code bestätigt:**
- **`hm = 0`** (Rahmen siehe oben).
- **Bootsgrenze:** Querlage mit `c.b.ax` aus `seaCross` (G8: rules.js:2608–2623; Einzelfeld dort `'x'`, auf `'block'` fährt kein Boot) und `W = 0,3` (Deck `roadShapes 0.3`, :680). Gleich der alten Regel, solange das Boot durch die Feldmitte fährt. Mit Längsversatz liegt ein Boot neu unter dem Deck, das ist begründet.
- **Züge** auf Gleisfeldern kommen nach `figs` (brueckenbild.js:280), nicht in eine neue Klasse; :293 kennt nur B/U/F.
- **Hinteres Geländer** am Ende von d. In Kurve, T und X läge es in h unter dem Deck des anderen Arms [gerechnet].
- **Vorderes Geländer nach dem Wagen** ist im alten Aussehen fast unsichtbar [gerechnet]: Wand-Unterkante bei y = x/2 + 5,44 (Regio, wb 0,17), Geländer bei x/2 + 6,28 ± 0,45. Gerade bleiben 0,39 px Luft, bei der Tram (wb 0,19) 0,25 px Überdeckung. Darum wird per Spion geprüft, nicht per Bild. Neu liegt der Zugschatten (bis +8,8) nicht mehr über dem Geländerstrich.
- **`brCarPieces`** aus PLAN §2.1 gibt es nicht. Neu kommt `gbCarPieces`.
- **PLAN §2.8** („bruecken ohne Gleisbrücken“) ist überholt.
- **Stücke vor dem Umzug.** Ohne Stücke malt das Deck des späteren Felds über das Wagenende: Die Wand liegt ganz im Deckband x/2 ± 9,6 [gerechnet].
- **Schatten** je Stück auf seiner Feldraute. Sein Weltradius (la + 0,1)/√2 = 0,28–0,42 ist kleiner als la [gerechnet].
- **Gleise ohne äußere 70·z-Zelle**, damit sich keine GL-Zellen verschachteln.
- **Block 112 geteilt nur für Gleisfelder**, denn wasserbruecken-bewegtes.test.js:85 verlangt für Weg „Figur nach o“.

## 1. Bau-Reihenfolge

Für jeden Schritt gilt:
- erst die Tests (§3), dann `npm test` (maxWorkers 4), `npm run bump`, Commit auf dem Branch;
- Prüfbilder nacheinander, nie parallel zu Tests;
- Push nur auf Zuruf, frühestens nach E1e. E1d ohne E1e schneidet nachts den Schein an der Feldkante ab;
- der Diff berührt nie state.js, actions.js, cloud.js, live.js, `tileOut`, `parseSave` oder Preise (Altversion).

### E1·0 Prüfwerkzeug, Vorher-Bilder, Leistungs-Grundlinie (Normal)

- Neues `tools/gleis-e1-pruefung.js` nach dem Muster von `tools/wasser-d1-pruefung.js` (§4). Vorher-Bilder auf HEAD.
- `tests/leistung.test.js`:
  - `measure(world, night, z, at = null)`. Bisher steht die Kamera immer auf dem Mittel aller Felder (:20).
  - Zwei Szenen in bruecken:
    - `bruecken-gleis` bei (10, 38): gerade, Leiter, Lauf
    - `bruecken-gleis-tx` bei (32, 37): T, X, Kurve
  - Zug und Boot fest, gesetzt und zurückgesetzt im `it` wie bei „dach“ (:49–50):
    - `trainCars = () => [feste Wagen]` (wie uebergang.test.js:50): Regio über der Kante 9,5|35, einer in der Kurve 22,36, einer auf der Leiter
    - `shipMovers = () => [Boot quer unter 10,35]`
- `tests/leistung-je-ding.test.js`: „Gleisbrücke Form 0–4“ (gerade mit Nachbarn auf einem Wasserstreifen) und „Gleisbrücke Kurve/T/X“.
- `npm run leistung:neu` **auf altem Code**. Der Lauf schreibt alle Welten (:74) bzw. die ganze Je-Ding-Datei (:41) neu. Im Diff dürfen sich nur die neuen Schlüssel ändern. Begründung in AUFGABEN.md.
- Am Spiel ändert sich nichts.

### E1a Gerüst, nichts Sichtbares (Hoch)

```js
// rules.js nach wegDeckH (:1901); recalc (:829) setzt vor `if (BATCH)` zusätzlich gbCache.v = -1
const isGleisBridge = t => !!t && t.b === 'schiene' && !!t.bridge;        // = Schiene mit !cachedPath (render.js:82), ohne Gelände: was liveFlatSet auslässt, malt tileA
const gbCache = { v: -1, tiles: null, n: -1, map: new Map(), any: -1 };
function gbFresh() { const C = gbCache; if (C.v !== groundVersion || C.tiles !== state.tiles || C.n !== state.tiles.size) { C.v = groundVersion; C.tiles = state.tiles; C.n = state.tiles.size; C.map.clear(); C.any = -1; } return C; }
function gbAt(x, y) {                                                      // Gleisbrücke übers Wasser als Brückenfeld (160c E1, wie wbAt) – wirft nie
  const k = x + ',' + y, t = state.tiles.get(k);
  if (!isGleisBridge(t)) return null;                                      // vor dem Merker: Aufschütten löscht bridge am selben Objekt (actions.js:144)
  const C = gbFresh(); let c = C.map.get(k); if (c) return c;
  const ax = seaCross(x, y) === 'y' ? 1 : 0;                               // nur für Boote (G8); Kurve/T/X 'block': dort fährt keins
  c = { k, x, y, water: true, rail: true, A: null, ax, b: { ax, n: 1 }, W: 0.3, lift: 0, landA: false, landB: false, hm: 0, G: null };   // wegDeckH(c, a) = 0
  C.map.set(k, c); return c;
}
const gbAny = () => { const C = gbFresh(); if (C.any < 0) { C.any = 0; for (const t of state.tiles.values()) if (isGleisBridge(t)) { C.any = 1; break; } } return C.any > 0; };   // G10
```

```js
// draw-objects.js:663 – ohne lagen (alle heutigen Aufrufer, Gruppe w) genau der alte Ablauf
function drawRailBed(cx, cy, z, x, y, t, armsIn = null, lagen = null) {   // lagen (160c E1): Teil von BK_GRUPPEN (h|v|d|o)
  const arms = …, segs = …, lk = …, br = !!(t && t.bridge), on = l => !lagen || lagen.includes(l);
  const vorn = (dir, s) => s * (dir[0] - dir[1]) > 0;                     // Außennormale s·(−dir_v, dir_u): n_u + n_v > 0
  const one = segs.length === 1 && !roadCurve(arms);                      // gerade, Ende, Einzelfeld: vorderes Geländer allein; Kurve/T/X alles in d (bis E2)
  if (br && (on('h') || on('v'))) { g.fillStyle = C('#6f5238'); alongPath(segs[0], 0.5, (p, dir) => { for (const s of [1, -1]) if (on(vorn(dir, s) ? 'v' : 'h')) { /* :676–677 */ } }); }
  if (on('d')) { if (br) { /* Deck :680–681 */ } /* :683–723 unverändert */ }
  if (br && (on('d') || on('o'))) {
    const parts = [];
    for (const seg of segs) { const d = dirOf(seg); for (const s of [1, -1]) if (on(one && vorn(d, s) ? 'o' : 'd')) parts.push(offsetPath(seg, 0.29 * s)); }
    if (parts.length) { g.strokeStyle = C('#6f5238'); g.lineWidth = 0.9 * z; g.lineCap = 'round'; g.lineJoin = 'round';   // o allein erbt nichts mehr (:667/:719)
      g.beginPath(); /* je Teil wie :727–730 (3z hoch) */ g.stroke(); }
  }
}
```

Weitere Punkte in E1a:
- **`bkDrawLagen`** (bruecken.js:657), **vor** dem Wasserzweig (:659):
  `if (c.rail) { const t = state.tiles.get(x + ',' + y); if (isGleisBridge(t)) drawRailBed(px, py, z, x, y, t, null, gruppe === 'w' ? null : BK_GRUPPEN[gruppe] || []); return; }   // E2: neuer Maler über c.G`
- **`spriteBridge`** (brueckenbild.js:222): `` `${c && c.rail ? 'gb' : c && c.water ? 'wb' : 'br'}|…` ``
- **`bkRedo`** (:270): `if (!(SPRITES_ON && !(c0 && c0.rail) && spriteBridge(…)))`, also für Gleise immer live (K8).
- **`bkDrawMoving`** (:295): `const wcut = c.water && !!c.G && c.G.startPost;`
- **`wbRelight`** (:169): `if (c.rail) return;` bis E1e (K13).
- **Kommentar** draw-objects.js:724 richtigstellen: gemalt werden beide Seiten.
- **tools/gleisbruecken-entwurf.js:186–191:** `maler(…, armsIn, lagen)` reicht `lagen` weiter; Kopfvermerk „Bilder bis f933b89“ (K14).
- **Prüfbild:** keins. **Leistung:** Der Wächter liefert dieselben Zahlen.

### E1b Bewegtes über `bkDrawMoving`, Brücke noch im Boden-Durchgang (Hoch, drei Commits)

**Commit 1: Züge und Boote im eigenen Feld**

```js
// render.js:2200 (tileB)
const bc = (bkOn() ? bkAt(x, y) : null) || (ms || WB_LIVE.set.has(k) ? wbAt(x, y) : null) || (ms ? gbAt(x, y) : null), late = [];
// brueckenbild.js:280 – Wagen auf dem Gleisdeck: vor o, nie unter vd (sonst :245 → U)
if (c.water) { const on = ms.filter(m => (m.fur && !m.critter) || (c.rail && m.train)); … }
// render.js:922
function drawBridgeOver(k, z, now, rect = null, gruppen = null) {         // gruppen: null = alles über dem Rumpf
  const t = state.tiles.get(k); if (!t) return;
  const [x, y] = keyXY(k), p = toScreen(x, y), R = rect || [-1e9, -1e9, 1e9, 1e9], gc = gbAt(x, y);
  if (gc) return bkRedo(x, y, p.x, p.y, z, now, R, gruppen || ['h', 'vd', 'o'], null, false, gc);   // bkRedo öffnet eigene GL-Zellen
  if (t.b === 'schiene') return drawRailBed(p.x, p.y, z, x, y, t);       // Schiene auf Wasser ohne Kennung (nur Tests): wie bisher
  const c = wbAt(x, y); if (c) bkRedo(x, y, p.x, p.y, z, now, R, gruppen || (c.A ? ['vd', 'o'] : ['h', 'vd', 'o']), null, false, c);
}
// render.js:1298 – Gleisbrücke ohne äußere 70·z-Zelle (sonst verschachtelt)
function bridgeOverBoat(k, z, now, m = null, gruppen = null) {
  const t = state.tiles.get(k);
  if (isWegBridge(t) || isGleisBridge(t)) return drawBridgeOver(k, z, now, m && bkMoverRect([m], z), gruppen);
  …Schiene ohne Kennung wie bisher (70·z)…
}
// render.js:1310 boatUnder – vorerst nur das eigene Gleisbrückenfeld heraus (bkDrawMoving); spätere bleiben bis E1d
… && (!isWegBridge(tb) || done(bx, by)) && !(isGleisBridge(tb) && bx === kx && by === ky)   // tb = state.tiles.get(bx + ',' + by)
```

**Commit 2: Block 112 als Hilfsfunktion** `redo112(bk, m)` (render.js:2190–2192). Sie liefert die neu gemalten Figuren und Wagen.

```js
// boatOver (:2186): Gleisfeld h+vd, dann schon Gezeichnetes, dann o über beides
if (gbAt(bx, by)) { bridgeOverBoat(bk, z, now, m, ['h', 'vd']); const re = redo112(bk, m); drawBridgeOver(bk, z, now, bkMoverRect([m, ...re], z), ['o']); continue; }
```

Wegbrücken bleiben, wie sie sind; dafür ein eigener Folgeschritt in AUFGABEN.md (K10, K11).

**Commit 3: `over(m)` früh** (K10)

```js
// brueckenbild.js nach draw(U) (:301): frühere Felder vor dem eigenen h+vd
if (c.rail && over) for (const m of U) if (m.boat && m.under) over(m);
// :312
for (const m of ms) if (m.boat && m.under && !(c.rail && cls.get(m) === 'U')) { … }
```

Weitere Punkte in E1b:
- Kommentare: render.js:919–921, :1297, :1303–1305.
- **Prüfbild:** Zug mittig; Boot quer bei s 0, −0,25 und +0,35; Zug und Boot zusammen; Leiter mit Boot und Zug. Erwartet ≈ Vorher. Neu sind nur:
  - Der Zugschatten liegt nicht mehr über dem vorderen Geländerstrich.
  - Ein fremdes Feld mit Boot bleibt im Nebel.
  - Ein Boot mit Längsversatz liegt unter dem Deck.
- **Leistung:** Je Feld mit Zug kommt ein Strich `o` live dazu, im GL-Bild eine Zelle mehr. Erwartet innerhalb des Spielraums [vermutet].

### E1c Wagen in Stücken je Feld (Hoch)

```js
// bruecken.js nach brCarPiecesUnder (:635) – Wagen an einer Gleisbrücke übers Wasser (160c E1c) → [{ k, m }] oder null (wie bisher)
function gbCarPieces(m) {
  const la = m.len / 2, wb = trainHalfW(m.train || {}), E = 1e-3, W = (a, b) => [m.px + m.du * a - m.dv * b, m.py + m.dv * a + m.du * b];
  const cell = ([u, v]) => [Math.round(u), Math.round(v)], gb = ([x, y]) => isGleisBridge(state.tiles.get(x + ',' + y));
  if (Math.abs(m.du) > 1e-3 && Math.abs(m.dv) > 1e-3) {                    // schräg (Kurve, K5): ganz ins späteste Feld unter Mitte und Ecken (wie trainOnHills)
    const cs = [[0, 0], [-la + E, -wb + E], [la - E, -wb + E], [la - E, wb - E], [-la + E, wb - E]].map(([a, b]) => cell(W(a, b)));
    if (!cs.some(gb)) return null;
    const D = cs.reduce((p, q) => trainTileOrder(q[0], q[1]) > trainTileOrder(p[0], p[1]) ? q : p);
    return [{ k: D.join(), m }];
  }
  if (![0, -la, la].some(a => gb(cell(W(a, 0))))) return null;
  const ca = Math.abs(m.du) > 1e-3 ? m.du : m.dv, wc = Math.abs(m.du) > 1e-3 ? m.px : m.py, cuts = [-la, la];
  for (let h = Math.floor(wc - la) + 0.5; h < wc + la + 1; h++) { const a = (h - wc) / ca; if (a > -la + E && a < la - E) cuts.push(a); }   // Feldkanten (wie :588, beide Achsen)
  if (cuts.length === 2) return null;                                      // ganz in einem Feld
  cuts.sort((p, q) => p - q); const out = [];
  for (let i = 0; i + 1 < cuts.length; i++) { const lo = cuts[i], hi = cuts[i + 1]; if (hi - lo < 0.01) continue;   // wie :592
    const k = cell(W((lo + hi) / 2, 0)).join(); out.push({ k, m: { ...m, cut: [lo, hi], portal: null, gbK: k } }); }
  return out;
}
```

```js
// render.js nach :1877, innerhalb von if (m.train) – nach brCarPiecesUnder (geht vor), Bedingung wie :1874 (K7)
if (!tc && !m.deck && !(m.hill && m.hill.up) && gbAny()) {
  const ps = gbCarPieces(m);
  if (ps) { for (const p of ps) { const pk = HALL.has(p.k) ? hallFirst.get(COVER.get(p.k)) || p.k : p.k; if (!byTile.has(pk)) byTile.set(pk, []); byTile.get(pk).push(p.m); } continue; }   // Halle (K6)
}
// movers.js:777 – Schatten je Stück, auf die Raute seines Felds beschnitten (h = 0: genau)
if (!car.cut || car.shadow || car.gbK) { const cl = car.gbK && keyXY(car.gbK); if (cl) { g.save(); /* Raute toScreen(cl ± ½), Höhe wie P(0, 0) */ g.clip(); } try { /* Ellipse wie :781 */ } finally { if (cl) g.restore(); } }
```

- **`redo112`** (K11):
  - Stücke, deren `gbK` in der Maler-Folge vor `bk` liegt, nicht neu malen.
  - Nach dem `o` von bk das `o` jedes anderen Gleisfelds `gbK`, dessen Stück neu gemalt wurde, im Rahmen dieser Stücke.
- **Prüfbild:**
  - Zug an der Feldkante (Mitte x + 0,45), halb an Land (7,6|35)
  - Regio und Tram in der Kurve 22,36, beide Achsen
  - Bahnhöfe 5,34 und 15,34
  - og Hbf (−21,−2 [Bericht])
- **Leistung:** etwa (1 + len) Stücke je Wagen auf Brücken; jedes Stück ist eine GL-Zelle 120 × 115·z (gl.js:552) [vermutet].

### E1d Zeichenort ruhend, Vorschau aufs Deck (Hoch)

```js
// render.js:93   … && !isWegBridge(t) && !isGleisBridge(t) && …
// render.js:1638 if (isWegBridge(t) || isGleisBridge(t)) continue;          // auch nah (!groundCached: Schleife über alle Felder, :1633)
// render.js:2032–2033 (Feld einmal holen, D1-Gegenprüfung 7)
const t0 = state.tiles.get(k), wc = isWegBridge(t0) ? wbAt(x, y) : null, gc = !wc && isGleisBridge(t0) ? gbAt(x, y) : null, bw = bc || wc || gc;
const wu = wc || gc, wbUnder = bc && wu ? () => bkGroup(x, y, px, py, z, ['w'], wu) : null;   // Altdaten unter einem Anhöhen-Deck
// render.js:2114 (K12)
const under = t.b === 'weg' ? wbUnder : bc ? (gc ? () => { wbUnder(); drawIt(); } : drawIt) : null;
if (bw && (t.b === 'weg' || t.b === 'schiene')) { bkDrawStill(x, y, px, py, z, now, bw, under); if (gc && !bc && t.cross) drawIt(); bkDone = true; }
// :2148, :2151 (Rückfall bei veraltetem COVER) laufen über bw/wbUnder mit
// render.js:1310 boatUnder – jetzt nur früher gezeichnete Felder (spätere malt ihr tileA darüber)
… && (!(isWegBridge(tb) || isGleisBridge(tb)) || done(bx, by))
// Vorschau: render.js:1419  … ? wbAt(x, y) || gbAt(x, y) || (PLAN_WB_GHOST && …) || null : null;   (Höhe wegDeckH = 0, K3)
//           render.js:1703  … ? wbAt(ax, ay) || gbAt(ax, ay) : null;                               (eingerückt 0,44)
```

- `under = null` ist nötig, denn nur dann nimmt `bkDrawStill` den Zweig mit einer Gruppe (brueckenbild.js:149). Sonst entstehen 3 Bildchen je Feld; in D1 waren das +20–33 % (karte-D1.md:125).
- Kommentare: render.js:1009–1013, :1686, gl.js:682.
- **Prüfbild:** das ganze Blatt (§4).
- **Leistung:** erwartet gleich viel [vermutet], weit 1 `drawImage` je Feld wie vorher. `leistung:neu` nur, wenn eine Grenze reißt oder „better“ gemeldet wird.
- **Browser:** bauland `?messen`, „Lebendige Felder“ ohne Bewegtes 0, kein „2D-Reste“.

### E1e Nachtlicht auf dem Deck (Normal)

```js
// render.js:2035   if ((wc || gc) && night > 0.15) WB_GLOW0.set(k, glows.length);
// brueckenbild.js:169 wbRelight – Schutz aus E1a durch einen Gleiszweig ersetzen, vor :172
if (c.rail) { const t = state.tiles.get(c.k), sh = roadShapes(railArms(x, y), t, 0.3), L = ([u, v]) => [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z];
  /* Treffer wie :178–183 über den Rahmen der Punkte von sh (S wie :177) */ g.save(); /* wie :187 */ clipTo(sh, L); /* punchGlow(…, 'halo') wie :190; finally wie :192 */ }
// brueckenbild.js:270 bkRedo – auf Gleisfeldern nur neu stanzen, wenn vd nachgemalt wurde (K13)
if (c0 && c0.water && !(c0.rail && !gruppen.includes('vd'))) wbRelight(x, y, px, py, z, c0);
```

- GL-Bild und Bildchen-Malen stanzen nicht neu (:171), wie bei D1 → Frage 1.
- **Prüfbild:** nachts eine Laterne am Ufer vor dem ersten Feld, der Scheinwerfer eines Zugs vor dem nächsten Feld, ein beleuchtetes Schiff, Bahnhof 5,34.
- **Leistung:** Die Schleife über `glows` läuft je sichtbarem Gleisfeld mit Lichtern davor; ohne Licht steigt sie bei `!n0` aus. Nachts in bauland messen. Kostet sie mehr als 0,5 ms, nur ab Zoom 1 stanzen.

### E1f Messen und Abschluss (Normal)

- **Leistungs-Wächter** mit den Szenen aus E1·0: Mehrarbeit durch Stücke und `o` live. Erst fragen „geht es billiger?“, dann `leistung:neu` mit Zahlen in AUFGABEN.md. `repaint` muss 0 bleiben.
- **Browser:**
  - `?welt=bauland`, Kamera auf dem Ring (−58, 38) und der Ecke (−58, 63) [Bericht]
  - `tools/ruckeln.js` in Full HD bei Tag, Nacht und Dämmerung → Nacht, vorher und nachher
  - `?messen` „Lebendige Felder“, Kamerazug ohne Verwerfen
  - iPad: Speicher weit weg, `GL.stats.over` mit Zügen
- **CLAUDE.md**, Regel: „Gleisbrücken übers Wasser: Brückenfeld `gbAt`, ruhend Gruppe w (`gb|`), Lagen h|v|d|o in `drawRailBed` (o nur gerade/Ende/Einzelfeld bis E2), Wagen über `gbCarPieces` (schräg ganz ins späteste Feld), Nachmalen immer live.“
- **AUFGABEN.md:** 160c E1 abhaken; Folgeschritt Weg eintragen (Block 112 geteilt, `over(m)` früh).

## 2. Fallen

| Bereich | Falle | Maßnahme | Stand |
|---|---|---|---|
| Leistung | :2114 übergibt bei Schiene `drawIt` als `under`; dann 3 Bildchen je Feld | `under = null` (K12); Test „ein Bildchen w“ | geprüft |
| Leer | `bkDrawLagen` :661 kehrt bei Nicht-Weg leer zurück, die Zahlen sähen besser aus | Gleiszweig davor; Spion zählt `drawRailBed` bei `SPRITE_PAINT` | geprüft |
| Absturz | `c.G.startPost` (:295), `c.G.mat` (:175), `wegDeckH` ohne `lift` (NaN) | Schutz in E1a; `lift: 0` (K3) | geprüft |
| Züge weg | `bkMoverClass` macht Züge zu U (:245), `bkRedo(vd)` malt über sie (:302) | `c.rail && m.train` nach `figs` (:280) | geprüft |
| Doppelt | Nah läuft der Boden-Durchgang über alle Felder (:1633) | `continue` bei :1638 zusammen mit :93 | geprüft |
| Doppelt | Zugstücke und ganzer Wagen, wenn das `continue` fehlt | `continue` nach den Stücken; Spion „je Stück einmal“ | geprüft |
| Reihenfolge | Brücke in tileA ohne Stücke: das spätere Deck beißt das Wagenende | E1c vor E1d | gerechnet |
| Reihenfolge | Schräger Wagen: Ecken ragen in Felder, die die Mittellinie nicht kreuzt (Ecke bei 0,010\|0,542 [Bericht]) | K5: ganz ins späteste Feld | geprüft (Mechanik) |
| Reihenfolge | K5: Der Wagen liegt über dem `o` früherer Felder und über Inhalt von Feldern zwischen Rundungsfeld und D | wie heute; Felder derselben Diagonale verdecken sich nie (G1) | vermutet unsichtbar |
| Reihenfolge | `brCarPiecesUnder` geht vor; die Kanten der Gleisbrücke fehlen dann | selten (og/bauland ohne Anhöhen-Brücken [Bericht]); Prüfbild; E2 ein Zerleger | geprüft |
| Reihenfolge | Tunnelportal (`tc`), `m.deck`, `m.hill.up` und Hbf oben (`hallHill`, :1873) ohne Stücke | wie :1874; Prüfbild | geprüft |
| Block 112 | Stücke tragen die Mitte des ganzen Wagens (\|Δ\| < 1, :2191–2192) | Filter `gbK` (K11) | geprüft |
| Block 112 | malt Stücke samt Schatten (0,2) und Scheinwerfer ein zweites Mal | wie heute beim ganzen Wagen; hinnehmen | geprüft |
| Boote | Filter „nur frühere“ vor dem Umzug nähme spätere Felder weg, die noch im Boden liegen | E1b nur das eigene Feld, E1d `done` | geprüft |
| Boote | `over(m)` am Ende (:312): das frühere Feld der Leiter malt über das Wagendach bzw. über das hintere Geländer des eigenen Felds; Block 112 holt den Zug nicht zurück (\|py − by\| = 1) | früh nach `draw(U)` (K10) | gerechnet |
| Boote | Boot mit Längsversatz (Anleger nebeneinander movers.js:970, Routenanfang [Bericht]) liegt neu unter dem Deck | Prüfbild „anders“ | geprüft (Regel) |
| Boote | Schiene auf Wasser ohne `bridge` (nur Tests; `seaCross` fragt nicht danach, rules.js:2612) | alter Weg samt 70·z-Zelle; `seaCross` nie an `bridge` hängen | geprüft |
| Boote | FOG beim Nachmalen heute `false` (:2202), neu `!ownedTile` (:269) | nur fremde Felder; Gleise ins Meer nehmen das Feld (actions.js:200, world.js:202) | geprüft |
| Boote | Weg-Block 112 malt Figuren weiter über `o` | eigener Folgeschritt | geprüft |
| Tiere | Möwen über Gleisbrücken (movers.js:1093 sperrt nur `bkAt`) | auf Wasser F (:244), kein Nachmalen | geprüft |
| Strich | `o` allein erbt kein `'round'` | `lineCap`/`lineJoin` setzen; Test schreibt beides mit | geprüft |
| Strich | zwei Striche statt einem | nur an geraden Feldern, 0,58 Feld auseinander | gerechnet |
| Kurve/T/X | vordere Striche laufen über den anderen Arm (`railSegments` :631) | ganz in d (K4); E2 Eckpodest | geprüft |
| Bildchen | gleiche Vorsilbe wie Wegbrücken: `getSprite` zeigt bei falscher Fassung das alte weiter (render.js:541–548), und `wb|`-Tests griffen mit | `gb|` | geprüft |
| Bildchen | Nachmal-Bildchen je befahrenem Feld (bis 3 × 433 Leinwände), Wächter `repaint` | alles live (K8) | geprüft (:57); Speicher vermutet |
| Rahmen | `brBox` reicht nur für das alte Bild; E2-Pfeiler an der Vorderecke 22,3 > 22 | E2 weitet `brBox` für `c.rail` | gerechnet [Bericht] |
| GL | Zelle in Zelle (:1300 und `bkRedo` :273) | Gleis ohne äußere Zelle; Test `max === 1` | geprüft |
| GL | Ruhend nie `glLive`; kein nicht-rechteckiger Ausschnitt um Bildchen (gl.js:207, `glClip 'x'`) | ruhend nur `bkGroup(['w'])`; Schattenausschnitt nur in Wagenzellen (glLive malt in die Sammelfläche, gl.js:286–293) | geprüft |
| GL | Sammelfläche voll → 2D obendrauf (gl.js:284), `lastMiss` sperrt die Aufnahme (:399) | iPad mit Zug messen | vermutet |
| Schatten | zwei Füllungen 0,2 an der Feldkante: feine Naht | Prüfbild; sonst früheres Stück 0,012 überlappen (G4) | vermutet |
| Naht | Dach/Wand an der Schnittkante (wie Tunnel, Anhöhe) | Prüfbild | vermutet |
| Nacht | Das Deck deckt den Schein früherer Felder (Laterne, Scheinwerfer, Schiffslicht r 18z movers.js:1018) | E1e (2D); GL bleibt wie D1 → Frage 1 | Mechanik geprüft |
| Nacht | Relight beim `o`-Nachmalen stanzte über die Wagen | nur bei `vd` (K13) | geprüft |
| Nacht | Scheinwerferschein auf dem vorderen Geländer im Wagenrahmen weg (`GLOW_MUTE 'pane'`, :269) | hinnehmen | geprüft |
| Vorschau | Rauten und Einzelfeld-Rahmen lägen unter dem Deck | `deckMark` mit `gbAt`, Höhe 0 | geprüft |
| Vorschau | gestrichelter Abriss-Rahmen, `groupPreview`-Rauten teils unter dem Deck | wie D1 hingenommen | geprüft |
| Ufer | Zaun/Hecke an der hinteren Kante (`drawEdgesAt` :2055–2059 vor der Brücke); nah Schlagschatten (:1688–1693) | Prüfbild „anders“, richtig | geprüft |
| Altdaten | Gleisbrücke unter einem Anhöhen-Deck (`bkUnderError` bruecken.js:135 sperrt nur Neues) | `wbUnder` mit `gc` (+ `drawIt`) | geprüft |
| Altdaten | `cross` auf einer Brücke (rules.js:2334) | `drawIt()` nach `bkDrawStill` | geprüft |
| Altdaten | veraltetes COVER (:2148, :2151) | `bw` mit `gc` | geprüft |
| Cache | `gbCache` bliebe alt, wenn `recalc` in `BATCH` aussteigt | Rücksetzen vor `if (BATCH)` (:829) | geprüft |
| Robust | Live-Spiegel und Freunde liefern Felder roh: `form: 99`, `cross`, `rot: 7` | `gbAt` wirft nie; `railLookOf` fällt auf Schotter zurück (:660) | geprüft |
| Leistung | Doppeltes Zeichnen fiele im Spielraum (× 1,1 + 40) nicht auf | Spion-Tests (§3) | [Bericht] |
| Leistung | `leistung:neu` überschreibt alle Schlüssel (:74, je-ding :41) | Diff prüfen | geprüft |
| Leistung | tileA prüft je Feld einmal mehr | `t0` einmal holen, erst `isGleisBridge`, dann `gbAt` | geprüft |
| Werkzeug | gleisbruecken-entwurf.js verliert `lagen` | K14 | geprüft |
| Tests | Spione mit 6 Argumenten (gleis-zeichnen.test.js:95, :119) | dort ohne Brücken; neue Spione reichen `...rest` weiter | [Karte B] |
| Zustand | `drawRailBed` setzt `setLineDash`/`globalAlpha` nicht | Prüfbild nah Δ = 0; jede Lage in frischer Attrappe | vermutet |
| Namen | ein globaler Name nur in einer Datei | Namen aus K1 | geprüft |

## 3. Tests zuerst (Skizzen)

**Hilfen**
- `kanal()` (wasserbruecken-lagen.test.js:11): auf dem Wasser `{ b: 'schiene', lvl: 1, form, bridge: true }`, an Land ohne `bridge`. Danach `terrainCache.clear(); waterChanged(); groundVersion++; recalc()`.
- Fälle `FAELLE` aus tools/gleisbruecken-entwurf.js:218–225 (gerade, nordsued, kurve, t, x, doppel), dazu:
  - **leiter**: zwei Gleise direkt nebeneinander
  - **ende**: ins Meer, 4 Richtungen
  - **einzel**: `rot` 0/1
- `rec()` (wasserbruecken-lagen.test.js:21–25): `lineCap|lineJoin` mitschreiben, Zustand bei `save`/`restore` sichern, jede Lage in einer frischen Attrappe.
- `order()`, `far()` (wasserbruecken-reihenfolge.test.js:35–43, :85). Spione:
  - `drawEdgesAt` → `'A x,y'`
  - `bkDrawLagen` → `gr + (c.rail ? 'g' : c.water ? 'w' : '') x,y [fog]`
  - `drawRailBed` → `'rb x,y'` bei `t.bridge`
  - `drawTrainCarBody` → `'car ' + (car.gbK || Feld) + lo..hi`
- `bild()` und `nacht()` (wasserbruecken-bewegtes.test.js:24–36, :101–110). Wagen: `{ train: { kind: TRAIN_KIND.regio, model: 'regio', col: 0 }, px, py, du, dv, len: 0.78, i: 0, n: 2, d: 0, mv: 1 }`.

**E1a** `tests/gleisbruecken-lagen.test.js`
- **Ganz:** `rec(bkDrawLagen(x, y, 0, 0, z, 'w', gbAt(x, y)))` gleicht `rec(drawRailBed(0, 0, z, x, y, t))` genau. Ebenso `drawRailBed(…, ['h','v','d','o'])` gegen ohne `lagen`. Fälle: Form 0–4 × alle Fälle × z 0,5/1/2,5.
- **Teile:** h, v, d, o einzeln. Flächen als Menge gleich dem Ganzen; Geländer als Menge der Strichstücke gleich. `o` mit `lineCap`/`lineJoin` `'round'`.
- **Zuordnung:**
  - gerade O-W: `o` = nur der Strich bei v = +0,29
  - N-S: u = +0,29
  - Ende mit Arm −u: v = +0,29
  - Einzelfeld `rot` 1: u = +0,29
  - Kurve, T, X, Leiter: `['o']` ohne `stroke`
  - h: nur `fillRect #6f5238` auf der Seite n_u + n_v < 0
- **Ohne `lagen`:** Landschiene und das Kunstfeld einer Anhöhen-Brücke (bruecken.js:649, 7 Argumente) unverändert.
- **`gbAt`:**
  - null für Landschiene, Schiene auf Wasser ohne `bridge`, Wasser-Wegbrücke, leeres Feld
  - `ax` gleich `seaCross` (0 längs x, 1 längs y, 0 in der Kurve); `hm` 0, `W` 0,3, `G` null, `b.n` 1
  - `wegDeckH(c, ±0,5)` = 0
  - nach `recalc` bzw. `state.tiles.set` (Größe) ein neues Objekt
  - wirft nie bei `{ b: 'schiene', bridge: true, form: 99, cross: true, rot: 7 }`
  - `gbAny()` ohne/mit Gleisbrücke false/true
- **Rahmen:** Attrappe mit Clip-Tiefe; gezählt werden nur Pfade bei Tiefe 0, samt `lineWidth/2` (karte-D1 Gegenprüfung 8). Alles liegt in `brBox(gr, gbAt)·z`; `brBox('w', gbAt)` = [38, 32, 38, 22].
- **Schlüssel und Schutz:**
  - `spriteBridge(…, 'w', gbAt)` legt `gb|x,y|w|0` an, ohne `|lit`; `bkLampGroups(gbAt)` = []
  - `bkRedo(…, ['h','vd','o'], …, gbAt)` legt bei `SPRITES_ON` kein Bildchen an
  - `bkGroup(…, gbAt)` malt bei Durchsicht mit `globalAlpha` 1
  - `bkDrawMoving` mit Boot bzw. Tier auf `gbAt` und `wbRelight` mit gesetztem `WB_GLOW0` werfen nicht
- **Nichts Sichtbares:** Weit weg gibt es weiter `flat|`-Schlüssel und kein `gb|`.

**E1b** `tests/gleisbruecken-bewegtes.test.js`
- **Zug mittig:** `w`/Boden < `fig zug` < `og x,y`; nach `fig zug` kein `vdg`/`hg` desselben Felds; kein `gb|`-Bildchen.
- **Boot s = 0:** `boatUnder` ist `null` (eigenes Feld); Folge `fig boot` < `hg`, `vdg` < `og`; `drawBridgeOver` für das eigene Feld nicht aufgerufen.
- **Klasse:** `bkMoverClass` mit `gbAt` beide Achsen: s 0,3 → U, 0,31 → F; Längsversatz 0,35 bei s 0 → U.
- **Zug und Boot:** Boot < h, vd < Zug < o. Boot s + 0,45: danach nichts.
- **Möwe (h 30):** F, nach `o`, danach kein Nachmalen.
- **Früheres Feld** (Commit 2): Boot unter einem früheren Gleisfeld, auf dem ein Zug steht. Erwartet `hg`, `vdg` (früheres) < Zug neu (Block 112) < `og` (früheres).
- **Leiter** (Commit 3): Boot mit Längsversatz unter beiden Reihen, Zug auf der späteren. Das frühere Feld kommt vor `hg`/`vdg` des eigenen, der Zug danach.
- **GL:** Spion auf `glLive` zählt die Tiefe; `bridgeOverBoat(gleis)` und `boatOver` ergeben `max === 1`. `drawBridgeOver(k, 1.5, 1e6)` und `drawBridgeOver(k, 1, 1e6, null, ['o'])` laufen.
- **FOG:** Nachgemaltes auf fremdem Feld im Nebel, Boot und Zug nicht.
- **Anpassen:** wasserbruecken-bewegtes.test.js:76 → `null`, Kommentar „eigenes Feld“ (nicht „spätere“), Titel :70 ändern.
- **Bleiben (bis E1d):** schiffe-bruecken.test.js:117 (`['35,45']`, spätes Feld) und :127–136 (`drawBridgeOver('45,41')`).

**E1c** `tests/gleisbruecken-wagen.test.js`
- **`gbCarPieces`:**
  - (10,4\|35), du 1 → `'10,35' [−0,39, 0,1]`, `'11,35' [0,1, 0,39]`; Summe = `len`, `gbK` = Feld, `portal` null; N-S genauso
  - halb Ufer (7,6\|35) → `'7,35'` und `'8,35'`, Schnitt bei −0,1
  - mittig (10\|35) → null; nur an Land → null
  - Kurve 22,36 (Regio in der Bogenmitte, West → Süd): ein ungeschnittenes Stück; jede eingerückte Ecke liegt in einem Feld, das nicht später ist als das des Stücks
  - Tram len 1,0: höchstens 2 Stücke, keins unter 0,01; 4 Wagen „schnell“: Stücke je Wagen = [−la, la]
- **Einhängen:**
  - mit `tc` (Stub `trainTunnelCut`) behält der Wagen `portal`
  - `m.deck` und `m.hill.up` nicht zerlegt; `m.hill` nur mit `occ` zerlegt
  - Stücke in der Halle → `hallFirst`
  - ohne Gleisbrücken ruft `render` `gbCarPieces` nicht
- **Reihenfolge:** jedes Stück nach dem `A` seines Felds und vor dem nächsten `A`; `og` des Felds nach dem Stück; `drawTrainCarBody` je Stück genau einmal.
- **Schatten:** Ellipsen `rgba(40,50,70,0.2)` = Zahl der Stücke, jede nach einem `clip` mit der Raute ihres Felds; ein ungeschnittener Wagen hat genau eine, ohne Ausschnitt.
- **Block 112:** Ein Stück eines früheren Felds wird über bk nicht neu gemalt; nach einem neu gemalten Stück auf Q kommt `og Q`.

**E1d** `tests/gleisbruecken-reihenfolge.test.js`
- **Je Gleisbrückenfeld genau einmal `wg`** und genau ein `rb`, nach dem eigenen `A` und vor dem nächsten; vor dem ersten `A` kein `rb`.
  - z 2,4 bei DPR 1 und 2 (`!groundCached`), z 2,2 bei DPR 1 (Boden gecacht), z 1,2
  - alle Fälle, Prellbock; fremdes Feld `wg … fog`
- **Rückfall:** `state.tiles.set` ohne `rebuildCover` (wie wasserbruecken-reihenfolge:68–72). Roh gesetztes Anhöhen-Deck darüber: `w` einmal über `under`, `rb` einmal. Altdaten `cross: true`: Schranken einmal, nach `wg`, kein Fehler.
- **Weit** (`far()`):
  - je Feld `gb|x,y|w|0`, `ver === groundVersion`, `glows.length` 0
  - kein `flat|` für Gleisbrücken, kein `|lit`, kein `prewarm` mit `gb|`
  - `made` = Zahl der Schlüssel; nächstes Bild live 0, neu 0
  - nach `recalc` weiter gezeigt, `miss` 0 (Muster tempo-schritt3.test.js ab :250)
- **`boatUnder`:**
  - schiffe-bruecken.test.js:117 → `null`
  - neu (35,6\|44,4) → `['35,45']`
  - (45\|29,6) → null
  - Schiene ohne Kennung: wie bisher, auch spätere Felder
- **schiffe-bruecken.test.js:127–136 umschreiben:** `fig boot` vor `wg 45,41`; `drawBridgeOver('45,41')` wird nicht mehr aufgerufen.
- **Vorschau** (Muster wasserbruecken-reihenfolge.test.js:107–157):
  - Gleis-Stil umstellen über 10,35: Raute nach `wg 10,35`, alle Koordinaten endlich
  - Einzelfeld-Rahmen (Hover, Abriss): nach `wg`, eingerückt 0,44, Höhe 0
  - an Land wie vorher
- **GL:** `GLPASS = true`, Szene nur mit Gleisbrücken. `liveFlatSet().size === 0`; `worldGround` ruft `glLive` 0-mal und setzt `GLS.dirty` nicht.
- **Anpassen:**
  - webgl.test.js:40 `brute` bekommt `&& !isGleisBridge(t)`; :42 erwartet `[false, false, true]`
  - bruecken.test.js:107–115: `liveFlatSet()` ohne `{ b: 'schiene', bridge: true }`
- **Bleiben grün:**
  - tempo-schritt3.test.js:101–107; bahn.test.js:87–94, dazu jede Lage einzeln
  - alle `wasserbruecken-*`, bruecke*, bahn-gemuetlich, planen, uebergang, monkey
  - gleis-zeichnen.test.js:95/:119/:125, anhoehe-wege.test.js:142

**E1e** (in gleisbruecken-bewegtes.test.js, Muster `nacht()`)
- **Laterne** auf dem Uferfeld davor: nach `wg` genau `licht halo neu x,y`, nie `pane`; `glows.length` danach unverändert; ohne Laterne kein `save`/`clip`.
- **Scheinwerfer** auf Feld T: auf T + 1 nach dessen `wg` neu gestanzt.
- **Zug auf T neben der Laterne:** nach `og T` kein `neu T`. Boot unter T: nach `vdg T` neu gestanzt.
- **GL und Bildchen-Malen:** kein Relight; `G: null` wirft nicht.

**E1f:** Leistungs-Wächter wie in E1·0. Je Ding unverändert, denn `'w'` ist der alte Aufruf.

## 4. Prüfbilder (`tools/gleis-e1-pruefung.js`, Browser, nacheinander)

**Aufbau** wie tools/wasser-d1-pruefung.js:
- `syncMovers = () => {}`, feste `nightAt`/`gameHour`, `spriteForce`, `spriteNoBudget`, `resetDrawCaches`
- `GL.off` je Spalte
- Züge über einen `trainCars`-Stub, Boote über einen `shipMovers`-Stub
- Bild-Sammler 4181, gleiche Fenstergröße und gleiches DPR, `npm run bump` vor jedem Lauf

**Stellen**
- **bruecken:**
  - gerade 10,35 (Ufer 7,35/13,35), Nord-Süd 22,38, Kurve 22,36, T 32,35, X 43,36
  - Leiter 8–13 × 40/41, Lauf 18,46 (Zoom 1,1, Rasengleis bei 7/14/21/28)
  - Bahnhöfe 5,34/15,34
  - Gleis auf einer Anhöhen-Brücke (x ≥ 50)
  - ein Haus am Ufer (Schatten)
  - Kontrolle: alle Ansichten aus wasser-d1-pruefung.js
- **og:** Hbf −21,−2 [Bericht] und die Kurvenfelder; das Werkzeug sucht sie über `railArms`.
- **bauland:** Ring bei −58,38 und −58,63 [Bericht].

**Spalten:** Tag/Nacht × {z 2,4 live; z 2,2 bei DPR 1 (Boden gecacht, Brücke live); z 1,2 Bildchen; z 0,8 Bildchen ohne GL; z 0,6 mit GL}.

**Szenen**
- leer
- Zug mittig, Mitte x + 0,45, halb Ufer, Regio und Tram in der Kurve
- Boot mittig s 0, s −0,25, s +0,35, Längsversatz 0,3
- Leiter mit Boot und Zug
- Boot vor der Brücke, Zug darüber
- nachts Laterne am Ufer, Zug mit Scheinwerfern

**Ablauf:** vorher (E1·0 auf HEAD), nachher nach E1b, E1c, E1d und E1e. Vergleich mit `getImageData`, gezählt Δ > 8, dazu ein Wärmebild (stufe3-pruefung.js:122–151).

**Erwartet Δ = 0**
- nah ohne Bewegtes, Tag, an allen Stellen, wenn hinter der Brücke nichts Hohes steht
- alle Wegbrücken
- Menübild, Geist beim Tragen, Gleis auf einer Anhöhen-Brücke
- GL gegen 2D im Nachher-Lauf

**Erwartet klein**
- weit weg: Rahmen 76 × 54 statt 144 × 194, also nur Kantenpunkte
- Kantenglättung am Nachmal-Ausschnitt
- Schattennaht an Feldkanten (E1c)

**Erwartet anders** (eigenes Blatt)
- Bäume und Häuser am Ufer früherer Felder unter dem Deck statt darüber
- Hausschatten nah unter der Brücke; Zaun bzw. Hecke an der hinteren Kante
- Rauten und Rahmen auf dem Deck, eingerückt 0,44
- Zugschatten und Scheinwerferschein nicht mehr auf dem vorderen Geländer; Tram-Unterkante 0,25 px hinter dem Geländer
- Boot vor der Brücke über dem hinteren Wagenteil (richtig); Boot mit Längsversatz unter dem Deck
- fremdes Feld mit Boot im Nebel
- Nachtschein früherer Lichter: zwischen E1d und E1e abgeschnitten, nach E1e nah wie vorher, im GL-Bild abgeschnitten
- og Hbf auf Bisse ansehen

**GL mit `?messen`**
- Gleisbrückenfelder ohne Bewegtes nicht dyn
- Kamerazug (`glBgStep`) ohne Verwerfen
- frisch nach `resetDrawCaches` nur einzelne Felder dyn, keine „2D-Reste“
- `GL.stats.over` mit vielen Zügen

**Leistung:** `ruckeln.js` in bauland bei Tag und Nacht; iPad: Speicher weit weg.

## 5. Fragen an den Nutzer

1. **Nachts weit weg (GL-Bild am PC, Zoom unter 1):** Der Schein einer Ufer-Laterne, eines Zugscheinwerfers oder eines Schiffslichts endet an der Kante des nächsten Gleisbrückenfelds. Bei den Wasser-Wegbrücken ist das seit D1 genauso. Nah und mittel wird er in E1e neu gestanzt.
   - **Empfehlung:** hinnehmen, weit weg ist der Schein klein.
   - **Alternative:** Gleisbrückenfelder nachts weit weg lebendig halten. Das kostet in bauland bis zu 433 Felder je Bild.
2. **Zug in Kurven, Abzweigen und auf der Leiter:** In E1 liegt der Zug dort wie heute über dem vorderen Geländer. Richtig dahinter liegt er erst mit dem Eckpodest aus E2.
   - **Empfehlung:** so lassen. Es entfällt Arbeit, die E2 wegwerfen würde.

Nicht gefragt:
- Rahmen auf dem Deck eingerückt (in D1 Frage 1 schon entschieden: ja)
- altes Aussehen in E1, neues in E2 (E0 abgenommen)
- Schatten und Schein am vorderen Geländer (unter 1 px, siehe „In beiden Karten gleich“)

**Aufwand:** E1·0 Normal, E1a Hoch, E1b Hoch, E1c Hoch, E1d Hoch, E1e Normal, E1f Normal (zusammen Ultracode, wie im PLAN).

**Dateien:**

Code:
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js

Tests:
- /Users/ericwinderlich/Projekte/Spiel/tests/webgl.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/schiffe-bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-bewegtes.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-lagen.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung-je-ding.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/tempo-schritt3.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bahn.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/anhoehe-stufe2.test.js

Werkzeuge:
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js
- /Users/ericwinderlich/Projekte/Spiel/tools/gleisbruecken-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasser-d1-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/stufe3-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/ruckeln.js

Pläne und Karten:
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-D1.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-E0.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-gleisbruecke-wasser.md

## 6. Gegenprüfung (zwei Prüfer: Code, Risiko) – Korrekturen, gelten vor dem Text oben

1. **E1a `dirOf` gibt es nicht** (grep). In `drawRailBed` lokal: `const dirOf = s => { const a = s[0], b = s[s.length - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; }` – nur bei `one` aufrufen.
2. **K10 Begründung falsch** (Pfahl trifft das Geländer nicht, gerechnet). Richtig: E nach F's Zug nachgemalt deckt das Wagendach; Block 112 holt ihn nicht zurück (|py − by| = 1). Entscheidung bleibt. Leiter-Test: Boot bei px ≤ x − 0,2, py ∈ [40,5; 40,6] (sonst ist (x,40) nicht in `m.under`, render.js:1309).
3. **E1b Commit 3:** früh und :312 gleich bedingen – `if (c.rail) for (const m of U) if (m.boat && m.under) (over ? over(m) : m.under.forEach(bk => bridgeOverBoat(bk, z, now, m)))`; :312 lässt U-Boote auf Gleisfeldern nur zusammen mit diesem Rückfall aus.
4. **E1b Commit 2:** in `boatOver` `const [bx, by] = keyXY(bk)` an den Schleifenanfang ziehen (sonst TDZ).
5. **`boatOver`/`redo112` sind Closures in render()** (render.js:2186) – nicht direkt testbar, GL im Test nicht (kein WebGL2). Den Gleiszweig samt `redo112` als Funktion auf Modulebene (`gbBoatOver(m, z, now, byTile, drawnMovers)`, Namen nur in render.js); Test ruft sie mit `GLPASS = true` und Tiefen-Spion auf `glLive`. Reihenfolge zusätzlich über ein ganzes `render()` mit Spionen.
6. **Altdaten `cross` + `foot` auf einer Gleisbrücke:** die vordere Hälfte der Fußgängerbrücke (afterMovers, draw-objects.js:870–873) läge unter dem Zug (bc → late, bkDrawMoving nach :2213). Neu nicht baubar (rules.js:2334) – hinnehmen, in der Fallen-Tabelle.
7. **K13 Wortlaut:** `bkRedo` ruft `wbRelight` einmal je Aufruf, nach der Gruppenschleife (:270). Bedingung `gruppen.includes('vd')` bleibt.
8. **§0 Wortlaut:** `liveFlatSet` nimmt Wegbrücken **und Anhöhen-Felder** aus (:93, worldGround :1637).
9. **E1d `under = null`:** ein Bildchen `w` nur ohne `under` **und ohne Deko** (`bkDecoGroups`, brueckenbild.js:148–149). Weit-Test „ein Bildchen“ ohne Deko; Deko-Felder als Ausnahme zählen.
10. **Zeilen nachgezogen (HEAD f933b89):** `brCarPiecesUnder` endet :631 (E1c „nach :631“); `liveFlatSet` Größe :88, bis :97; `WB_LIVE` bruecken.js:61; worldGround bis :1646; done-Filter :1310; spriteFlat bis :1031; trainOnHills-reduce movers.js:852; Schatten-Ellipse movers.js:780; „nach recalc weiter gezeigt“ tempo-schritt3.test.js:188–200; Rückfall-Test wasserbruecken-reihenfolge :70–74; Vorschau-Tests dort :105–152; Eckpodest karte-E0.md:19–21. Der Hash 61a273b in der Ist-Karte gehört nicht zu diesem Repo – deren Zeilen sind älter.
11. **E1c Schnittschwelle:** Schnitte nur bei `a > -la + 0.01 && a < la - 0.01` (sonst Reststück verworfen → Stirn gilt als Schnitt, Fenster/Scheinwerfer blinken nachts bei 20–37 % der Kantenüberquerungen). Test: Vorderende 0,005 hinter der Kante → ein Stück mit hi = la, Stirnfenster, ein glowQuad nachts; ebenso hinteres Ende in −x.
12. **E1c Tunnel-/Bergportal (`tc`):** Liegt unter dem Wagen ein `gbAt`-Feld, das später als `tc.k` kommt, den Wagen (mit `tc.cut`) dort zeichnen (wie trainOnHills das späteste Feld). Test: Einfahrt nach −x direkt am Wasser; Wagen nach `wg` von G, kein Deck von G danach. Prüfbild: Werkzeug baut die Einfahrt selbst (og/bauland/bruecken haben keine Tunnel).
13. **E1e Nachtschein:** neu gestanzt wird nur das Deck; vordere Pfähle und Geländer bleiben im Schein früherer Lichter dunkel (wie D1 hingenommen) → in §4 „Erwartet anders“; der E1e-Test hält fest, was gestanzt wird.
14. **E1e Leistung:** `n0` ist kein Maß für Lichter in der Nähe (alle Lichter des Bilds bisher). Vor der Schleife räumlich vorfiltern (Raster der Lichtmitten wie `glowCells`) oder nur die Lichter der letzten Felder; nachts bauland bei z 0,45 (2D) und 1,2 mit/ohne Filter messen.
15. **Prüfbilder ohne Nachbarn:** bruecken/og/bauland haben hinter Gleisbrücken nichts Hohes. `tools/gleis-e1-pruefung.js` baut selbst (fester Zufall, vor dem Vorher-Bild auf HEAD): Wald und Haus hinter der geraden Brücke (9,34/10,34), großes Haus links (6,36) für den Schatten, Hecke/Zaun auf den hinteren Kanten von 8,35 und 10,36; dasselbe an Leiter (8,39) und Kurve 22,36.
16. **Leistungs-Wächter E1·0:** Szenen „bruecken-gleis …“/„bruecken-gleis-tx …“ in einem **eigenen** `it`, Attrappen nur dort (finally zurück); `measure(world, night, z, at, name)` trennt Szenenname und Datei. Bestehende „bruecken …“-Schlüssel dürfen sich nicht ändern (echter Zug bleibt gemessen).
17. **Leeres `o` an Kurve/T/X/Leiter:** `bkRedo(['o'])` öffnet trotzdem eine GL-Zelle und clip/restore. Hilfsfunktion `gbHasO(x, y)` (= `segs.length === 1 && !roadCurve(arms)`, dieselbe wie in drawRailBed); `bkDrawMoving` überspringt `o` für `c.rail && !gbHasO`. Test: Zug auf 22,36 und auf der Leiter → kein `bkRedo(['o'])`. E2 passt die Hilfsfunktion an.

## 7. Ergebnis (14.10.2026)

- Commits: E1·0 8d099bb, E1a 497d208, E1b 373152c/52dfb83/4a0e5d1, E1c dfce609, E1d d1781dd, E1e 397e420.
- Prüfbilder (tools/gleis-e1-pruefung.js, Δ 0 zwischen zwei Läufen auf demselben Code): E1a Δ 0; E1b nah nur o über dem Wagenrand und
  Zugschatten nicht mehr auf dem Geländer – gefunden: Bootslicht unter dem Deck nahm dem Scheinwerfer die Stärke (Block 84d), behoben mit
  eigenem Licht-Raster; E1c nur Kantenglättung; E1d nah: Boot und Bugwelle richtig unter späteren Feldern, weit nur Kantenpunkte; E1e: Schein
  auf dem Deck wieder da, Geländer/Pfähle im Schein dunkel (§6 Nr. 13).
- Leistung: Wächter-Szenen bruecken-gleis/-tx +1–3 % bzw. weniger; „bruecken Nacht Zoom 1.2“ 445 → 968 geo = Tageswert (Boden-Vormalen,
  vorher nachts durch prewarm des flat-Bildchens unterdrückt). bauland 433 Felder, ruckeln.js 1280×800 alt/neu: gleich oder schneller.
- Fragen §5 (beide „so lassen“ empfohlen) dem Nutzer mit dem Bericht gestellt.

