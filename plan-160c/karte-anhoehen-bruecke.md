# Bereichskarte: Anhöhen-Brücke `js/bruecken.js` (Block 160a/160b) für den Umbau 160c

Ich habe nur gelesen. Ich habe keine Tests gestartet, keinen Browser geöffnet und keine Datei geändert. Alle Zeilenangaben beziehen sich auf den Stand vom 11.10.2026, `?v=1008`.

---

## 1. Überblick

- **Datei:** `js/bruecken.js`, 497 Zeilen. Sie wird nach `hills.js`/`hill-walkers.js` und vor `draw-wonders.js`/`movers.js`/`render.js` geladen (`index.html:78`).
- **Was auf oberster Ebene schon da sein muss:** `HILL_H` aus `hills.js:9` (= 26), weil `BK_CLEAR = HILL_H - 6` sofort ausgewertet wird. Alles andere (`DECO_LOOKS`, `state`, `poly`, `C`, `drawRailBed` …) wird erst zur Laufzeit aufgerufen.
- **Grundidee:** Die Brücke ist ein eigenes Bauwerk ohne Feldschlüssel in `state.tiles`. Was unter dem Deck liegt (Weg, Schiene, Tunnel, Wasser, Gelände, niedrige Deko), bleibt ein ganz normales Feld.
- **Wo die Brücke wirkt:**
  - Wegnetz: `bkLinks` in `computeNet`
  - Gegenden: `bkHillLinks` in `hillRegions`
  - Gleisnetz: Sprünge `bkRailJumps` von Endfeld zu Endfeld
  - Zugstrecke: `route.deck`
  - Spaziergänger: `hwTileOk`/`hwSideOk`
- **Wie gezeichnet wird:** live in `tileB` je Lückenfeld (`bkDrawTile`). Das Deck hat kein Bildchen. Der Schatten liegt im Boden-Bild.

**Wichtigste Fundstellen in Kurzform**

| Thema | Wo |
|---|---|
| Datenmodell | `state.js:58`, `:149-150`, `:363-368` |
| Nachschlagen | `bkFresh`/`bkAt`/`bkOnHill` (`bruecken.js:29-45`) |
| Bauen | `scanBruecke` → `bkBuild` (`:131-149`), Planen in `plan.js:99` |
| Regeln darunter | `bkUnderError`, `bkPlaceError`, `bkTooTall` (`:50-91`) |
| Deck belegen | `bkPlanDeck`, `bkLay*` (`:200-306`), `plan.js:101-134` |
| Zeichnen | `bkPaint`/`bkDrawTile` (`:345-393`), `render.js:2176-2187` |
| Rückgängig | `actions.js:1164-1195` |
| Tests | `tests/bruecke.test.js`, `tests/bruecke-gleis.test.js`, `tests/leistung-je-ding.json:242-243` |

---

## 2. Datenmodell

### 2.1 `state.bruecken` (Map)

- Angelegt in `newState` (`state.js:58`), Kommentar: „erstes Feld der Lücke → { ax, n, art, weg?, gleis? }“.
- Getragene Dinge kommen hier nie hinein. Brücken lassen sich weder verschieben noch kopieren.
- **Schlüssel:** `"x,y"` des ersten Lückenfelds, also das mit dem kleinsten x+y (`bkSpanOf`, `bruecken.js:107`).

| Feld | Bedeutung | Werte heute | Gesetzt | Gelesen |
|---|---|---|---|---|
| `ax` | Achse | `0` längs x, `1` längs y | `bkBuild` `:146` | überall: `dx = b.ax ? 0 : 1`, `dy = b.ax ? 1 : 0` (`:36`, `:44`, `:45`); `bkDrawTile` `:388`; Schatten `:412`; `bkWegPaint` `:396` |
| `n` | Felder der Lücke | 1…`BK_MAX` (= 4) | `bkBuild` | Kosten, Böcke, Zellen, Enden, `parseSave`-Filter |
| `art` | Bauart | `'holz'` \| `'stahl'` (`BK_ART_IDS`, `:15`) | `bkBuild`, `bkSetArt` `:193` | `bkArtOf` (`:18`, Fallback `'holz'`), `BK_LOOK`, `bkBock`, Fenster |
| `weg?` | Wegstil je Feld | Array der Länge n mit Stil-id oder `null` | `bkLayWeg` `:233-234` | `bkWegAt`, `bkWegFull`, `bkWegAny`, `bkWegPaint`, Abriss |
| `gleis?` | Gleisform je Feld | Array der Länge n mit Index in `DECO_LOOKS.schiene.forms` oder `null`. **Form 0 = Schotter, deshalb immer `!= null` prüfen** | `bkLayRail` `:302-303`, `restyleRails` (`rules.js:2252-2255`) | `bkRailAt`, `bkRailFull`, `bkRailAny`, `bkRailArms`, `drawRailBed`-Aufruf `:391` |

**Invarianten**
- **Weg ODER Gleis je Brücke.**
  - Beim Bauen: `bkWegCheck` `:222`, `bkLayWeg` `:230`, `bkRailCheck` `:287`.
  - Beim Laden: Weg hat Vorrang (`state.js:365`).
- `weg`/`gleis` fehlen, wenn nichts darauf liegt.
  - `serialize` schreibt sie nur, wenn etwas gesetzt ist.
  - Abriss löscht das ganze Array (`delete b.weg` bzw. `delete b.gleis`, `:166-167`).
- Ein Objekt wird nach dem Bau nur mutiert (`art`, `weg[i]`, `gleis[i]`). Ersetzt wird es nur durch Rückgängig (`JSON.parse`).

### 2.2 Speichern und Laden

- **`serialize`** (`state.js:149-150`) schreibt `{ ax: 0|1, n, art: b.art (roh), weg?: […|null], gleis?: […|null] }`.
- **`parseSave`** (`state.js:363-368`) liest streng, wegen der Freundes-Inseln:
  - Schlüssel muss `/^-?\d+,-?\d+$/` erfüllen.
  - `n` muss eine ganze Zahl in **1…BK_MAX** sein. **Sonst fällt die ganze Brücke weg.**
  - `art` unbekannt → `'holz'`.
  - `weg`: `slice(0, n)`, nur Strings, die `isWegStyle` besteht, aufgefüllt auf n.
  - `gleis`: nur, wenn kein Weg da ist; ganze Zahlen in 0…`forms.length - 1`.
  - Geometrie wird **nicht** geprüft: weder die Enden auf Ebene 1 noch die Lücke auf Ebene 0, auch keine Überlappung zweier Brücken.
- **Online und Besuch:**
  - Die Live-Spiegelung legt `bruecken` in `rest` ab (`live.js:13`, `LIVE_MAPS` nur tiles/decos/edges/terra).
  - `liveJoin` → `parseSave` (`live.js:106`, `:137`). Cloud: `cloud.js:155`, `:325`.
  - Dieselben strengen Regeln gelten also auch für Freundes-Inseln und Cloud-Stände.
- **Probe-Spielstand:** `tools/vorschau/brueckenschau.json` (v13) enthält alle vier Kombinationen: Holz+Weg, Stahl+Gleis, Holz+Gleis, Stahl+Weg mit Stil `m:platten:hell`. Dazu Wasser- und Fußgängerbrücken. Gut als Vergleich für „alte Stände sehen gleich aus“. Die `testsave-*.json` enthalten keine `bruecken`.

### 2.3 Neue Art wählen (je Gerät und Stand)

- `state.paintNew.bruecke = { form: i }`, gelesen über `decoLookNew('bruecke')` (`rules.js:1727-1732`) → `bkArtNew` (`bruecken.js:19`).
- `i` ist der Index in `DECO_LOOKS.bruecke.forms` (`data.js:1147`: `holz`, `stahl`; `cols: null`).
- `BK_ART_IDS` muss dieselbe Reihenfolge haben (Kommentar `:15`).
- `paintNew` gehört zu `LIVE_PRIV` und wird mitgespeichert.

### 2.4 Konstanten

| Konstante | Wo | Inhalt |
|---|---|---|
| `BK_ARTEN` | `:11-14` | holz: 60 Taler + 3 Bretter je Feld, `frei: 2`; stahl: 120 + 3 Metall je Feld, `frei: 4`, `tech: 'bahn'` |
| `ITEMS.bruecke` | `data.js:206` | Doppelt dazu: `cost: 60, mat: { bretter: 3 }`, `tech: 'terraform'`. Ergibt Kachelpreis und `available('bruecke')`. Beschreibung „1 bis 4 Felder“, „Holzsteg oder Stahlbrücke“ |
| `ITEM_TIPS.bruecke` | `data.js:782` | Text „1 bis 4 Felder“ |
| `FX.bruecke` | `data.js:667` | Wirkungstext |
| Menüplatz | `data.js:631` | Gruppe `hoehen` = `['anhoehe', 'huegeltreppe', 'bruecke']` |
| Schnellwahl | `ui.js:138` | Kategorie „Wege“ = `['weg', 'bruecke']` |
| `BK_MAX = 4` | `:16` | längste Lücke |
| `BK_W = 0.4` | `:16` | halbe Deckbreite, Deck also 0,8 Felder. **Die Entwürfe in `tools/brueckenfamilie-entwurf.js` u. a. rechnen mit `W = 0.3`.** |
| `BK_CLEAR = 20` | `:16` | Höhe, die unter das Deck passt |
| `BK_NO_PAINT` | `:17` | Gelände, das nicht darunter darf: wald, obstwald, fels, anhoehe |
| Meldungen | `:46`, `:47`, `:218`, `:283` | `BK_ON_HILL`, `BK_UNDER_ONLY`, `BK_NO_STONES`, `BK_BOTH` (`BK_BOTH` nur in `bkRailCheck` genutzt; sonst gleiche Texte inline in `:222` und `:230`) |

---

## 3. Nachschlagen und Cache

**Funktionen**
- **`bkFresh()`** (`:31-41`) baut je Boden-Fassung zwei Maps:
  - `cell`: Lückenfeld → `{ k, b, i, x0, y0, dx, dy }`
  - `end`: Anhöhen-Endfeld → Liste `[{ k, b, side: -1 vorn | +1 hinten, … }]`. Mehrere Brücken dürfen auf einem Endfeld aufliegen.
  - Cache-Schlüssel: `groundVersion`, Identität von `state` und `state.bruecken.size`.
  - `c.b` ist eine **Referenz** auf das echte Objekt. Mutationen an `weg`/`gleis`/`art` sieht man also sofort.
  - Ersetzt man ein Objekt bei gleicher Anzahl, wird der Cache ohne `groundVersion++` **stale**. Das ist der Grund für `actions.js:1195`.
- **`bkOn()`** (`:30`): gibt es überhaupt Brücken? Alle Haken in anderen Dateien steigen damit früh aus.
- **`bkAt(x, y)`** (`:42`): Lückenfeld → Eintrag oder `null`.
- **`bkOnHill(x, y)`** (`:43`): Endfeld → Liste oder `null`.
- **`bkEndsOf(k, b)`** (`:44`): `[[x0-dx, y0-dy], [x0+dx·n, y0+dy·n]]`.
- **`bkCellsOf(k, b)`** (`:45`): die n Lückenfelder.
- Kleine Helfer:
  - `bkRailAny`/`bkWegAny` (`:24-25`)
  - `bkBockOf(b, i)` (`:26`)
  - `bkRailCount` (`:151`)
  - `bkWegAt(c)` (`:238`), `bkRailAt(c)` (`:258`)
  - `bkWegFull` (`:240`), `bkRailFull` (`:259`): durchgehend belegt, Länge = n

**Regeln, die daraus folgen**
- Wer Brücken-Objekte ersetzt oder entfernt, zählt `groundVersion` hoch. Das gilt auch für Rückgängig.
- Nachschlagen nur über `bkAt`/`bkOnHill`.

---

## 4. Bauen

### 4.1 Werkzeug und Planen

- `build('bruecke', …)` lehnt ab (`actions.js:14`): „nur als Ganzes“.
- `placeError('bruecke')` (`rules.js:2825`): nur „fang oben auf einer eigenen Anhöhe an“. Das ist für Vorschau und Schild gedacht.
- `LINE_TOOLS` und `dragKind` → `'line'` (`plan.js:7`, `:9`).
- `planScan` → `scanBruecke(p)` (`plan.js:99`).
- `planText` zeigt Art, Felder und Preis (`plan.js:300-302`).
- Schild beim Zeigen (`render.js:1759`).
- Der Memo-Schlüssel von `planInfo` enthält `JSON.stringify(decoLookNew('bruecke'))` (`plan.js:285`). Ein Wechsel der Art lässt also neu rechnen. **Neue Optionen in der Leiste (Licht, Farbe, Zacken) müssen auch in diesen Schlüssel**, sonst zeigt die Vorschau einen alten Preis.

### 4.2 `bkSpanOf(a, b)` (`:95-109`)

- Nur gerade Linien.
- Sucht auf `lineTiles` das erste Abwärts von Ebene ≥ 1 und läuft weiter, bis die Ebene wieder erreicht ist.
- Fehlermeldungen: „Bis auf die Anhöhe gegenüber“, „gleich hoch“, „nur Ebene 1“.
- Ergebnis: `{ x0, y0, ax, n, gap, ends }`.
- „Großzügig“: Felder davor und dahinter (oben auf den Anhöhen) zählen nicht. Bei n = 1 kommt `ax` aus Endfeld und Lückenfeld.

### 4.3 `bkError(sp, art, noCost)` (`:111-129`)

Geprüft wird, in dieser Reihenfolge:
1. `available('bruecke')`
2. Technik der Art (Stahl → `bahn`)
3. Enden und Lücke sind eigenes Land (`ownedTile`/`notMine`)
4. `n ≤ BK_MAX`
5. Kein `bkAt` (keine Überlappung)
6. `bkUnderError` je Lückenfeld, mit Bock-Flag
7. Geld und `matError`

**Nicht geprüft:**
- was auf den Endfeldern steht (Gebäude, Bergportal, siehe Abschnitt 15)
- Linien und Torbögen in der Lücke

### 4.4 `scanBruecke(p)` und `bkBuild(sp, art)`

- **`scanBruecke`** (`:131-140`):
  - alle Planfelder `'same'`
  - Lückenfelder `'ok'` oder `'bad'`
  - genau ein `order`-Eintrag `[x0, y0, () => bkBuild(sp, art)]`
  - Rückgabe mit `art` für `planText`
- **`bkBuild`** (`:141-149`):
  - prüft erneut
  - bezahlt `bkCost` (`:20`, `cost×n`, `mat×n`)
  - `state.bruecken.set(...)`, `groundVersion++`
  - ruft `sfx`/`recalc`/`save`. Im `batch` warten `recalc`/`save`/`sfx` bis zum Ende (`state.js:156-160`, `rules.js:829`, `audio.js:39`).

### 4.5 Holzböcke: `bkBock(art, n, i, rail)` (`:23`)

- Nur Holz.
- **Ohne Gleis:** ab n > 2 (`frei`) am ersten und letzten Feld.
- **Mit Gleis:** ab n ≥ 2 unter **jedem** Feld (Holzviadukt).
- Die Böcke stehen in der **Feldmitte** bzw. bei 0,05 Feldern Versatz (`bkPaint` `:369`) und sperren das **ganze Feld** darunter für Weg und Schiene.

---

## 5. Regeln darunter und an den Enden

### 5.1 In `bruecken.js`

**`bkUnderError(x, y, bock)`** (`:50-66`) für bestehende Dinge (Bauen, Art wechseln, Rückgängig). Abgelehnt werden:
- Überdachung
- Wald und Obst („erst roden“)
- Fels, Erz, Kristall
- Gebäude jeder Art außer weg/schiene (über `anchorAt`, also auch Fußflächen großer Gebäude)
- Wasserbrücke (`t.bridge`)
- Bahnübergang mit Fußgängerbrücke (`isCrossing && foot`)
- am Bock Weg oder Schiene
- Deko höher als `BK_CLEAR` (Feld-Deko und `postAt` an den 4 Eckpunkten)

**`bkPlaceError(b, fp, t)`** (`:68-83`) für Neues unter dem Deck (`placeError` `rules.js:2842`, auch beim Verschieben und Kopieren mit `opts.t`):
- Kleine Deko wird übersprungen; dafür gibt es `bkTooTall`.
- Weg/Schiene auf Wasser bzw. getragene Wasserbrücke → „keine Wasserbrücke“.
- Getragene Fußgängerbrücke → abgelehnt.
- Erlaubt („flach“): `weg`, `schiene`, `tunnel`, Paint-Gelände außer `BK_NO_PAINT` und außer `cat 'fz'` (die Achterbahn ragt hoch), `graben`, `schuett`.
- Sonst `BK_UNDER_ONLY`. Am Bock kein Weg und keine Schiene.

**`bkTooTall(b, x, y, slot, form)`** (`:85-91`): Deko-Höhe gegen `BK_CLEAR`. Bei `VSLOT` (Eckpunkt) zählen die 4 angrenzenden Felder. Aufgerufen aus `smallError` (`rules.js:1656`, `:1680`).

### 5.2 Haken in anderen Dateien

**Was nicht unter das Deck darf**

| Was | Wo | Regel |
|---|---|---|
| Überdachung bauen | `rules.js:2169` (`roofError`) | kein Dach unter der Brücke |
| Überdachung verschieben (Gruppe) | `actions.js:462` (`groupErrors`) | dto. |
| Anhöhe unter der Brücke | `hills.js:104` (`hillRaiseError`) | keine Anhöhe |
| Fußgängerbrücke am Übergang | `rules.js:2293` (`setCrossing`) | keine unter der Brücke |
| Schranke unter der Brücke | `movers.js:27` (`crossingClosed`) | ein Zug oben auf dem Deck schließt sie nicht |

**Was die Endfelder sperrt („die Anhöhen tragen die Brücke“, Meldung `BK_ON_HILL`)**

| Was | Wo |
|---|---|
| Anhöhe abtragen | `hills.js:128` (`lowerHill`), `rules.js:3436` (`demolishInfo` → Meldung) |
| Treppe in die Anhöhe | `hills.js:775` (`stairIntoError`) |
| Gleis-Rampe in die Anhöhe | `hills.js:1333` (`rampIntoError`) |
| Abriss-Rechteck auf dem Endfeld | `plan.js:273` (Feld rot) |

**Was ich nicht im Code gefunden habe**
- `edgeError` (`rules.js:1316-1326`) und `setArch` kennen keine Brücke. Linien unter dem Deck sind niedrig (≤ 12 px), aber **Tor- und Rosenbögen** (`drawGateArch`, `draw-edges.js:331`: Höhe `hb + R`, `R = 11 + 0,2·h`) liegen rechnerisch über `BK_CLEAR`, teils über `HILL_H`. Im Bild nicht geprüft.
- `bpError` (`hills.js:1823-1844`) prüft `bkOnHill` nicht. `bkError` prüft kein Bergportal am Endfeld.

---

## 6. Weg und Gleis auf dem Deck

### 6.1 Wann eine Linie auf das Deck geht

**`bkPlanDeck(p)`** (`:200-217`):
- Eine Linie (oder ein 1 Feld breites Rechteck) legt Felder aufs Deck, wenn sie **längs** der Achse von einem Anhöhenfeld kommt, das ein Ende genau dieser Brücke ist, oder auf dem Deck beginnt (`p.deck`).
- Sonst bleibt alles am Boden. Das war die Nutzerfrage „was, wenn ich unten einen Weg bauen will?“.
- Rückgabe: Set der Deckfelder oder `null`.

**Woher `p.deck` kommt**
- `startPlan` setzt `deck` aus `a.deck` (`plan.js:57-59`).
- `a.deck` stammt aus `bkPick` in:
  - `planPoint` (`input.js:40-41`)
  - Ziehbeginn (`input.js:86`)
  - `planTap(…, deck)` (`plan.js:350`, `:370`; Aufruf `actions.js:849`)

**Einbau in `planScan`** (`plan.js:101-134`)
- Je Deckfeld `bkWegCheck`/`bkRailCheck` statt `planCheck`, und `order` → `bkLayWeg`/`bkLayRail`.
- Gleis-Stil (`plan.js:134`): „altes Gleis“ heißt auf dem Deck das Gleis der Brücke, nicht das darunter.
- Die Vorschau-Rauten liegen dann oben (`render.js:1383-1384`, `translate(0, -HILL_H·z)`).

### 6.2 Prüfen und Legen

| Funktion | Wo | Was sie tut |
|---|---|---|
| `bkWegCheck` | `:219-225` | lehnt Trittsteine ab (`pathLook(...).stones`), lehnt ab, wenn ein Gleis darauf liegt; sonst `ITEMS.weg.cost` je Feld, auch beim Umfärben |
| `bkLayWeg` | `:226-237` | zahlt, legt `weg` an, `groundVersion++` (kein `recalc`/`save`, das macht `batch`) |
| `bkRailCheck` | `:284-294` | Schiene muss freigeschaltet sein; kein Weg darauf; Stil umstellen kostenlos; Holz mit n ≥ 2 braucht unter **jedem** Feld Platz (kein Weg, keine Schiene); sonst `ITEMS.schiene.cost` + `ITEMS.schiene.mat` je Feld (laut Test Holz 1 + Metall 1) |
| `bkLayRail` | `:295-306` | wie `bkLayWeg` |

### 6.3 Wegnetz, Viertel, Gegenden

- **Wegarm über die Kante:** `bkArmFrom(x, y, dx, dy)` (`:248-252`). Nur am Brückenende, längs, wenn dort Weg liegt.
  - Genutzt in `pathArmsHill` (`draw-objects.js:146`)
  - im Zuschnitt von `drawHillFlat` (`draw-objects.js:896`, Überlapp 0,06)
  - bei den Spaziergängern (`hill-walkers.js:34`)
- **Viertel:** `bkLinks()` (`:241`) liefert die Endfeld-Paare aller Brücken mit durchgehendem Weg. `computeNet` vereint die beiden Endfelder (`rules.js:479-484`), sofern beide bebaut sind.
- **Gegenden:** `bkHillLinks(x, y)` (`:242-246`) in `hillRegions` (`rules.js:406`). Eine Anhöhe „ohne Treppe“ wird über die Brücke Teil derselben Gegend.
- **Bewohner** laufen **nicht** über Brücken:
  - `hillWalkRegions()` (`rules.js:383-392`) rechnet `hillRegions` mit `BK_NO_LINKS = true` ein zweites Mal; dazu `sameRegion` mit `hillWalkCache.both` (`rules.js:442-448`).
  - Genutzt in `walkPath` (`movers.js:65`), `findGoal` (`movers.js:87`) und `guestSpawn` (`friends.js:68`).
  - Wirtschaft und Spaziergänger rechnen dagegen mit Brücke.

### 6.4 Gleisnetz

**Arme**
- `bkRailArmFrom(x, y, dx, dy)` (`:261-265`): Arm vom Endfeld (Ebene ≥ 1) aufs Deck, wenn das erste bzw. letzte Deckfeld ein Gleis hat. Nur in `railArmsHill` (`rules.js:2194`) und in `drawHillFlat` (`draw-objects.js:896`).
- `bkRailArms(c)` (`:266-273`): Arme eines Deckfelds längs, zum Nachbarn mit Gleis bzw. zur Schiene oben am Ende. Wird als `armsIn` an `drawRailBed` (`draw-objects.js:649`) gegeben.

**Sprünge**
- `bkRailJumps(x, y)` (`:274-282`): von der Schiene oben am Endfeld zum Schienenfeld am anderen Ende. Nur wenn `bkRailFull` gilt und **beide** Enden `railTileAt` sind.
- Verbaut in:
  - `computeRail` (`rules.js:2468`)
  - `railNetworkHill` (`rules.js:2232`)
  - `railLoop` (`rules.js:2429-2431`, nur mit `link`)
  - `railPath` (`movers.js:557`, `:566`)

**Streckenlänge**
- `netGap` in `computeRail` (`rules.js:2459`, `:2473-2476`): Die n Deckfelder zählen zur Strecke (Strom, Züge im Rundkurs).
- Erfolg „Eisenbahn“ über `bkRailTiles()` (`:260`, `story.js:512`).

**Umstellen:** `restyleRails` (`rules.js:2252-2255`) stellt das Deckgleis mit um, wenn beide Endfelder in der Liste stehen.

**Achtung, Kopplung an Anhöhen:** `railArms` geht nur mit `hillsOn()` nach `railArmsHill` (`rules.js:2185`), `railNetwork` nur dann nach `railNetworkHill` (`rules.js:2207`), `pathArms` nur mit Anhöhen nach `pathArmsHill` (`draw-objects.js:136`). Ohne Anhöhen sehen Arme und Gleise umstellen die Brücke nicht. Siehe Risiko R1.

---

## 7. Züge über das Deck

1. **Strecke:** `railPolyline(keys, closed)` (`movers.js:576-611`). Zwei aufeinanderfolgende Schlüssel, die **nicht benachbart** sind, gelten als Brückenenden. Dazwischen läuft die Strecke gerade (Richtung nur das Vorzeichen). `route.deck = [[d0, d1], …]` reicht von Kante zu Kante der Lücke. Auch im Ring.
2. **Verlängern:** `lineRoute.extend` verlängert nach einer Brücke um ein Feld (`movers.js:632`).
3. **Wagen:** `bkDeckAt(route, d, half)` (`:308-313`, mit Ring) → `trainCars()` setzt `deck: true` (`movers.js:752`).
4. **Höhe:** `trainOnHills` (`movers.js:840`) setzt bei `m.deck` den Wert `m.hill = bkCarHill(base)` (`bruecken.js:317`: `{ up, base, ha: HILL_H, hb: HILL_H, occ: [], ramp: null }`), also waagerecht auf Deckhöhe. Steigt ohne `hillsOn()` vorher aus (`movers.js:839`).
5. **Zerlegen:** `bkCarPieces(m)` (`:318-334`) teilt den Wagen an den Feldkanten längs der Brücke (`car.cut`):
   - Stück über einem Deckfeld: `deck: true`, `base 0`
   - Stück auf der Anhöhe: `base = hillLift`
6. **Einsortieren:** `render.js:1817-1821`. Deckstücke gehen nach `onDeck` (`deckPut`), die übrigen nach `byTile` ihres Felds. `trainTunnelCut` wird für Deckwagen übersprungen.
7. **Antippen:** `trainAt` (`movers.js:895`, `:908`) liefert `deck: true` → `tap` öffnet `openBkInfo` (`actions.js:900`).
8. **Unten durch:** Ein Zug darf weiter unter der Brücke fahren: am Holzsteg nur zwischen den Böcken, mit Gleis oben gar nicht. Getestet.

---

## 8. Spaziergänger

`hill-walkers.js`:
- **Cache:** `hwFresh` (`:17`) enthält `state.bruecken.size` im Schlüssel. Weg-Änderungen laufen über `groundVersion`.
- **Begehbar:** `hwTileOk` (`:27`): Ein Deckfeld ist bei `lv 1` begehbar, wenn dort Weg liegt.
- **Schritte:** `hwDeckSide`/`hwSideOk` (`:31-38`): nur längs, auf beiden Seiten Weg. Quer zum Deck geht es nicht, die Leute laufen also in der Mittelreihe des 1/3-Rasters (bestätigt im Test).
- **Deko darunter** stört oben nicht (`:47`).
- **Abbruch:** Deck ohne Weg → `w.gone` (`:251`).
- **Höhe:** `hwPut` (`:175`): `w.up = h - hillLift(Feld)`. Auf dem Deck ist der Hub 0, also `w.up = HILL_H`. **Die Höhe ist fest, es gibt kein Höhenprofil.**
- **Zeichnen:** `render.js:1844`. Spaziergänger im Zustand `top` auf einem Lückenfeld gehen nach `onDeck` und werden im Rückruf des Decks gezeichnet.

---

## 9. Zeichnen

### 9.1 Maler-Reihenfolge

- **Boden-Bild** (`groundCache`): Felder unter dem Deck wie immer. Danach `drawShadows` (`render.js:147-164`) und als Letztes `drawBkShadows(want)` (`render.js:163`, `bruecken.js:406-418`):
  - ein Viereck je Brücke `A…B × ±BK_W`, um `SUN × HILL_H` versetzt, Farbe `SHADOW_COL`
  - nur das Deck, keine Geländer, Fachwerke oder Böcke
  - `want` bekommt das Feld `[x, y]`
- **Feldschleife** je sichtbarem Feld in x+y-Reihenfolge: `tileA` (Ruhendes, auch Deko oder Weg unter der Brücke), dann `tileB` (`render.js:2125-2188`):
  1. Bewegtes des Felds (Züge und Leute darunter, Schiffe)
  2. `afterMovers` (vordere Hälfte der Fußgängerbrücke am Übergang)
  3. `archWalkers`
  4. Überdachung
  5. **zuletzt die Brücke:** `if (bkOn() && bkAt(x, y))` (`render.js:2176-2187`)
     - `fade = bkFadeNow` → `globalAlpha × SEE_A`
     - `bkDrawTile(x, y, px, py, z, after)`. `after` zeichnet die Figuren aus `onDeck` direkt mit `drawMover`, ohne `moverLive`, weil die GL-Zelle der Brücke schon darum liegt.
     - Im GL-Pass in `glLive(px, py, TW·z, (HILL_H+44)·z + TH·z, TW·z, TH·z+4, f)`. **Diese Zellgröße ist fest** (siehe Risiko R14).
- **Anschlüsse:** Die nahe Anhöhe (kleinere Koordinate) wird vorher gezeichnet; ihre sichtbare +x/+y-Wand liegt hinter dem Deck. Die ferne Anhöhe kommt danach; ihre Wand zur Lücke ist eine Rückseite. Das Anhöhen-Bildchen (`hills.js`) weiß nichts von Brücken. Grasnarbe und dunkle Kante sind am Anschluss wie an jeder Wand.

### 9.2 `bkDrawTile` (`:385-393`)

- `P(t, s, h)`: `t` längs, gemessen ab der Mitte des ersten Lückenfelds, relativ zu `c.i`; `s` quer; `h` Höhe in px über dem Boden des Felds.
- Gezeichnet wird das Stück `t ∈ [i - 0.5, i + 0.5]`. Flächen ragen 0,012 ins nächste Feld (`ext`), damit keine Fuge entsteht; das letzte Feld nicht.
- Übergibt `wegPaint`, `railPaint` (`drawRailBed(px, py - H·z, …, bkRailArms(c))`), `rail: bkRailAny`, `after`.

### 9.3 `bkPaint(P, z, art, n, t0, t1, weg, opts)` (`:345-383`)

Reihenfolge in einem Stück:
1. Holzböcke (`bocks`, `:369-373`): zwei Beine von Höhe 0 bis H−3, Kreuzstreben
2. hinteres Geländer: Holz `rail(-W)` mit Pfosten je halbes Feld, Handlauf H+8 und Mittelholm H+4; bei Stahl `sideTruss(-W-0.02)`, Fachwerkhöhe 11
3. Deck-Oberseite `top(A, B, H)`
4. Fugen bzw. Bohlen (Holz 9, Stahl 6 je Feld)
5. `opts.wegPaint(H)` → `bkWegPaint` (`:395-404`):
   - Rand `min(EDGE_W, BK_W - 0.02)`, Belag in `ROAD_W` zugeschnitten
   - `paintLook` mit Muster und Schachbrett
   - `patRot = wegPatRot({ …, lauf: ax })` (Block 158)
   - `lookFar` für weit weg
6. `opts.railPaint(H)`
7. `opts.after(H)`: Leute und Zugstücke. **`H` wird von `bkDrawTile` nicht weitergegeben** (`:392`).
8. vorderer Längsträger (Holz H−3…H, Stahl H−4…H)
9. vorderes Geländer bzw. Fachwerk

Weitere Eigenschaften:
- Farben aus `BK_LOOK` (`:339-342`) über `C()`, also mit Nebel und Ruinen.
- Linien mindestens 0,6 px dick.
- Der Strich-Helfer `seg` schneidet längs auf `[t0, t1]` zu. Die Schleifen über Pfosten, Fachwerk und Fugen laufen je Feld über die **ganze** Brücke, also O(n) je Feld und O(n²) je Brücke und Bild; das meiste fällt früh weg.

### 9.4 Bildchen, GL-Standbild, Nacht, Durchsicht

- **Kein Sprite für das Deck.** Es wird jedes Bild live mit `poly` und Strichen gemalt.
- **GL-Standbild:** `bkLiveTiles()` (`:420`) liefert alle Lückenfelder. `glPlayTiles` nimmt sie in jedem Bild in die lebendigen Felder auf (`gl.js:681`), wie die Überdachungen.
- **Menü und Leiste:** `drawBkIcon(cx, cy, z, art)` (`:422-434`) zeichnet zwei kleine Anhöhen und dazwischen `bkPaint` mit n = 2, Höhe × 0,75.
  - Menükachel `thumbRaw('bruecke')` (`ui.js:74-75`, Form aus `tile.form`)
  - Leisten- und Fenster-Bildchen `lookThumb('bruecke', form, col)` (`ui.js:1631-1636`), gemerkt in `lookThumbs` mit Schlüssel `bruecke|form|col`
- **Nacht:** In `bruecken.js` gibt es **kein einziges `glowQuad`**. Brücken werden nur von `drawNight` abgedunkelt. Ein leuchtender Belag (Kristall) leuchtet auf dem Deck nicht, weil `bkWegPaint`/`paintLook` kein `pathGlow` rufen (vgl. `draw-objects.js:1129`).
  - Vorbild für Licht in einem live gezeichneten Bauwerk: `roofs.js:565-568`.
  - Strom für Laternen: `computePower` (`rules.js:2784-2794`, Liste `lamps`, `LAMPS_PER_POWER`, `T.rail.power.dark`), abgefragt wie in `draw-schmuck.js:12-14` bzw. `edgeLit` (`draw-edges.js:239`).
- **Durchsicht:** `bkFadeNow` (`:458-463`) macht das Deck blass bei Durchsicht oder wenn man ein Feld unter genau dieser Brücke ansteuert (nicht mit Ansehen oder Abriss, nicht mit `hover.deck`). `bkPick` liefert bei Durchsicht nichts.
- **Vorschau:**
  - Weg aufs Deck (`render.js:1734-1736`): Schild über `HILL_H + 10`. `ok` prüft weder Trittsteine noch ein vorhandenes Gleis; der Plan selbst zeigt den Fehler richtig.
  - Schiene aufs Deck (`render.js:1737-1739`)
  - Abriss auf dem Deck (`render.js:1698-1700`)

---

## 10. Antippen

- **`bkPick(sx, sy)`** (`:439-455`): probiert die Höhen `HILL_H+4` (Geländer), `HILL_H` und `HILL_H-3` (Träger) über `tileFrac(sx, sy + h·cam.z)`.
  - Das Geländer zählt nur, wenn auf Deckhöhe keine Anhöhen-Oberseite davor liegt.
  - Quer höchstens `BK_W + 0.05` Abstand.
  - Eine Anhöhe davor (`pickFrac`, `gx+gy > x+y`) verdeckt das Deck.
  - Rückgabe `{ x, y, deck: true }`. **Feste Deckhöhe.**
- **`bkPickFront`** (`:465-470`): das Deck, außer `objectAt` liefert ein Ding, das mindestens ein halbes Feld weiter vorn steht. Vorschau und Klick nutzen dasselbe.
- **Eingang:**
  - `setHover` (`input.js:177`, `:186`, `:189-190`): Mit Ansehen oder Abriss kommt das Deck vor dem Feld dahinter. Mit Weg oder Schiene gilt immer `bkPick`. `hover.deck` macht `previewCache` ungültig. Auf dem Deck gibt es kein `hoverEdge`.
  - `tap` (`actions.js:886-893`): Ansehen → `openBkInfo`; Abriss → bei Touch erst zeigen, dann `bkDemolishAt` (Rückgängig über `input.js:133`).

---

## 11. Fenster `openBkInfo(x, y)` (`:475-497`)

- `showPanel(html, live)` mit `live = () => bkAt(x, y) ? openBkInfo(x, y) : closePanel()`. Handler nur per `onclick`.
- Inhalt:
  - Art-Knöpfe `data-bkart` mit `lookThumb` und Preisdifferenz → `undoable(bkSetArt)`
  - Weg bzw. Gleis entfernen (`#p-bkweg`, zeigt nur Taler, nicht das Material)
  - Hinweis „erst durchgehend …“
  - `#p-del`: alles abreißen (Entf-Taste)
  - Schließen
- **`bkSetArt(k, art)`** (`:180-196`):
  - Technik prüfen
  - Holz-Böcke auf weg/schiene darunter → Abbruch
  - alte Art voll zurück, neue bezahlen (Geld und Material vorab geprüft)
  - `groundVersion++`, `save`, kein `recalc`

---

## 12. Abriss

- **`bkDemolishInfo`** (`:152-160`) und **`bkDemolishAt(x, y, all)`** (`:161-178`):
  - Erst kommt Weg bzw. Gleis weg (ganze Arrays, voll zurück: `ITEMS.weg.cost` je Feld bzw. Schiene samt Material), dann die Brücke (`bkCost` voll zurück).
  - Mit `all` beides zugleich (Fenster, Rechteck).
  - Danach `addFloat`, `groundVersion++`, `recalc`, `save`.
- **Rechteck** (`plan.js:240-251`): Die Brücke kommt nur weg, wenn sie ganz im Rechteck liegt.
  - Ragt sie hinaus, werden ihre Felder im Rechteck rot, außer dort wird etwas darunter abgerissen.
  - `onHill = true`: Die Anhöhen der Auswahl bleiben stehen.
  - Endfelder werden rot (`plan.js:273`).
  - Die Löschen-Auswahl mit der Hand (`keepLand`) läuft über denselben Weg.

---

## 13. Rückgängig

- **`UNDO_MAPS.bruecken`** (`actions.js:1096`) vergleicht JSON. Neue Felder gehen automatisch mit in den Schnappschuss.
- **Prüfungen** in `undo()` (`actions.js:1164-1187`), wobei `bkMine` = Brücken dieses Schritts:
  - Eine Anhöhe, die weg soll, aber auf der jetzt eine fremde Brücke aufliegt → nein (`:1170`).
  - Eine Anhöhe kommt unter eine stehende Brücke zurück → nein (`:1171`).
  - Ein Dach kommt unter eine stehende Brücke zurück → nein (`:1172`).
  - Ein Feld kommt zurück, das nicht flach ist (weg/schiene ohne `bridge`/`foot`) → nein (`:1173-1177`).
  - Eine Brücke kommt zurück, die jetzt nicht steht: Enden müssen nach dem Zurücknehmen Ebene 1 haben, die Lücke Ebene 0 (`lvBack`, `:1180`). Dann je Feld `bkUnderError` mit Bock (`:1182-1184`); Felder dieses Schritts (`mine`) werden übersprungen.
  - Steht die Brücke schon (z. B. Gleis-Abriss zurücknehmen): nur neue Böcke über weg/schiene prüfen.
- Danach `groundVersion++`, wenn Brücken betroffen waren (`:1195`), wegen des Zeigers in `bkFresh`. Außerdem `cloudTouched`.

---

## 14. Alle Haken außerhalb von `bruecken.js` (grep)

| Datei:Zeile | Haken |
|---|---|
| `state.js:58`, `:149-150`, `:363-368` | Feld, `serialize`, `parseSave` (streng, `BK_MAX`, `BK_ARTEN`) |
| `data.js:206`, `:631`, `:667`, `:782`, `:1147` | Item, Menügruppe, FX, Tipp, `DECO_LOOKS.bruecke` |
| `actions.js:14` | `build` lehnt ab |
| `actions.js:462` | `groupErrors`: Dach |
| `actions.js:849` | `planTap(…, deck)` |
| `actions.js:886-893` | Tippen: Fenster bzw. Abriss |
| `actions.js:900` | Zug oben → Fenster |
| `actions.js:1096`, `:1164-1187`, `:1195` | Rückgängig |
| `plan.js:7`, `:9` | Linienwerkzeug |
| `plan.js:57-59` | `deck` im Plan |
| `plan.js:99`, `:101`, `:115-120`, `:134` | Planen |
| `plan.js:240-251`, `:273` | Abriss-Rechteck |
| `plan.js:285`, `:300-302` | Memo-Schlüssel, Text |
| `rules.js:383-393`, `:406`, `:447` | Gegenden mit und ohne Brücke |
| `rules.js:479-484` | Viertel |
| `rules.js:1656`, `:1680` | `bkTooTall` in `smallError` |
| `rules.js:2169` | `roofError` |
| `rules.js:2191-2194` | `railArmsHill` |
| `rules.js:2221`, `:2232` | `railNetworkHill` |
| `rules.js:2252-2255` | `restyleRails` |
| `rules.js:2293` | `setCrossing` |
| `rules.js:2429-2431` | `railLoop` |
| `rules.js:2459-2476` | `computeRail` |
| `rules.js:2825`, `:2842` | `placeError` |
| `rules.js:3436` | `demolishInfo` |
| `hills.js:104`, `:128`, `:775`, `:1333` | Anheben, Abtragen, Treppe hinein, Rampe hinein |
| `hill-walkers.js:17`, `:27`, `:31-38`, `:47`, `:251` | Spaziergänger |
| `movers.js:27` | Schranke |
| `movers.js:557`, `:566` | `railPath` |
| `movers.js:576-611` | `route.deck` |
| `movers.js:752` | `car.deck` |
| `movers.js:840` | `trainOnHills` |
| `movers.js:895`, `:908` | `trainAt` |
| `movers.js:65`, `:87`, `friends.js:68` | `hillWalkRegions` |
| `draw-objects.js:146` | `pathArmsHill` |
| `draw-objects.js:649` | `drawRailBed(armsIn)` |
| `draw-objects.js:896` | `drawHillFlat` |
| `input.js:41`, `:86`, `:177`, `:186`, `:189-190` | Zeigen und Ziehen |
| `render.js:163` | Schatten |
| `render.js:1383-1384` | Plan-Rauten oben |
| `render.js:1698-1700`, `:1734-1739`, `:1759` | Vorschau |
| `render.js:1805-1806`, `:1817-1821`, `:1844` | `onDeck` |
| `render.js:2176-2187` | Deck zeichnen |
| `gl.js:681` | lebendige Felder |
| `ui.js:74-75`, `:138`, `:1631-1636` | Bildchen, Schnellwahl |
| `story.js:512` | Eisenbahn-Erfolg mit Deckgleis |
| `index.html:78` | Skript `?v=1008` |

**Kein Bezug zu `bkAt`, nur gleicher Name „deck“:** `draw-objects.js:822` und `:1020` (Wasserbrücken `lk.deck`/`B.deck`), `hills.js:1582` (`GR_STONE.deck`).

### Benachbarte Brücken-Systeme, die 160c vereinheitlichen soll (andere Speicherart)

| System | Speicherung und Funktionen |
|---|---|
| Wegbrücke übers Wasser | Feld `weg` mit `t.bridge`; Bauarten `WEG_BRIDGE` holz/stein/ziegel/rot über `t.brk`/`bridgeKind` (`rules.js:1858-1866`); Bogen `bridgeArch` (`rules.js:1872-1890`); `BRIDGE_MAX = 16`; `bridgeSpan`, `setBridgeKind`, `setBridgeStyle` (`rules.js:1976-2060`); `drawArchBridge` (`render.js:924`) |
| Bahnbrücke übers Wasser | Feld `schiene` mit `t.bridge`, `BRIDGE` (`rules.js:1839`), Holzbrücke in `drawRailBed` (`draw-objects.js:661-670`) |
| Fußgängerbrücke am Bahnübergang | `schiene` mit `cross` + `foot`/`footPaid`; `FOOT_STYLES` holz/stein/weg/kristall (`rules.js:2262`); `archAt` (`draw-objects.js:768`); `archHillError`/`archAround` (`hills.js:71-86`) |
| Erfolg „Brückenfelder“ | `story.js:514`, zählt nur `t.bridge` |

Diese Brücken **haben Feldschlüssel**. Die Anhöhen-Brücke hat keine.

---

## 15. Tests und Prüfwerkzeuge

### `tests/bruecke.test.js` (174 Z.)
Aufbau: Anhöhen x 10–13 und 17–20, Lücke x 14–16 auf y 12.

- **Z.18–26:** Ziehen von weiter oben, Holz, 3 Felder, 180 Taler + 9 Bretter; exakter JSON `{ ax: 0, n: 3, art: 'holz' }`; `bkAt`/`bkOnHill`, kein Feld in `tiles`.
- **Z.27–42:** Fehler „Nur gerade“, „Anhöhe gegenüber“, **„Höchstens 4“**, Haus darunter, „Holzbock“, Stahl ohne Bahn; Stahl 360 + 9 Metall.
- **Z.43–54:** darunter Weg, Schiene, Strand ja; nicht am Holzbock; Haus, Wald, Anhöhe, Dach, Straßenlaterne nein; Blumen ja.
- **Z.55–64:** Endfelder: `lowerHill`, `demolishInfo`, `stairIntoError`; Abriss-Rechteck rot.
- **Z.68–80:** Weg drüber: Deck-Array, keine Felder unten, `pathArms` über die Kante, ein Viertel, eine Gegend.
- **Z.81–88:** unten quer ein Weg; auf dem Deck angefangen → oben.
- **Z.92–109:** Abriss erst Weg, dann Brücke, Rückgängig zweimal; Fenster Art wechseln (Stahl erst mit Bahn).
- **Z.110–124:** Rückgängig nimmt keine Anhöhe unter einer Brücke weg; Speichern/Laden rund; strenges Lesen (`n: 9` fällt weg, `art: 'gold'` → holz, ungültiger Weg → null).
- **Z.125–131:** Zeichnen ohne Fehler (Holz, Stahl, `thumbRaw`, `lookThumb`, `drawBkShadows`).
- **Z.135–148:** keine Wasserbrücke, keine Fußgängerbrücke, kein Dach per Hand darunter; Erz wie Fels.
- **Z.149–153:** Schatten wird gezeichnet.
- **Z.154–165:** Bewohner-Gegenden ohne Brücke, Spaziergänger mit; `hwSideOk`/`hwTileOk`; Trittsteine auf dem Deck rot.
- **Z.166–173:** Rechteck auf dem Deck oben; Abriss-Rechteck unter einer herausragenden Brücke grün.

### `tests/bruecke-gleis.test.js` (229 Z.)
- **Z.27–44:** Gleis aufs Deck, 9 Felder, Material Holz 9 + Metall 9; Arme; ein Netz; `railPath` mit Sprung; `bkRailJumps`; Lücke im Gleis → kein Netz.
- **Z.45–66:** Weg ODER Gleis; **Holzviadukt-Böcke unter jedem Feld**; Stahl spannt frei; `bkSetArt` holz scheitert am Gleis unten; das untere Gleis ist ein eigenes Netz.
- **Z.67–78:** Stil umstellen kostenlos; `plan.deck`; Vorschau zeichnet.
- **Z.79–102:** Abriss Gleis mit Material, Prellbock an der Kante, Rückgängig, Rückgängig gegen neuen Weg am Bock, Rechteck-Gewinn.
- **Z.103–112:** Speichern rund; streng gelesen (Gleis 99 → null, Weg hat Vorrang).
- **Z.116–140:** Zug fährt hinüber, `route.deck = [[2.5, 5.5]]`, Wagen auf `HILL_H`, Schranke darunter offen.
- **Z.141–161:** `bkCarPieces` (Summe = Wagenlänge 0,78, Stück auf der Anhöhe mit `HILL_H`), im Rückruf des Decks gezeichnet, Stahl.
- **Z.162–179:** Rundkurs über zwei Brücken, zwei Deckstücke.
- **Z.183–228:** Schranke am Endfeld; Wagen knapp über der Kante; Gleise umstellen samt Deck und `lines[0].tiles = 9`, Erfolg 0,9 km; Zug oben antippen; Rückgängig erneuert den Cache-Zeiger.

### Indirekt betroffene Tests
- `tests/anhoehe-treppe.test.js:29`, `tests/gleisrampe.test.js:24`, `tests/huegeltreppe-regeln.test.js:18`: Menügruppe `['anhoehe', 'huegeltreppe', 'bruecke']`
- `tests/schnellwahl.test.js:28`: `['weg*', 'bruecke']`
- `tests/zuletzt.test.js:17-18`
- **`tests/leistung-je-ding.json:242-243`**: `"bruecke Form 0": 0, "bruecke Form 1": 0`. `leistung-je-ding.test.js` geht alle `DECO_LOOKS[id].forms` durch. Jede neue Form braucht einen Wert (`npm run leistung:neu` mit Begründung in AUFGABEN.md). Heute 0, weil `drawObject` keine Brücke zeichnet.

### Werkzeuge (Bilder)
- `tools/bruecke-pruefung.js`, `tools/bruecke-gleis-pruefung.js`: echte Pläne, alle Anschlüsse, Nacht, GL
- `tools/brueckenschau.js` und `tools/vorschau/brueckenschau.json`: alle heutigen Brücken
- Abgenommene Entwürfe: `tools/brueckenfamilie-entwurf.js`, `tools/brueckenlicht-entwurf.js`, `tools/kristallbruecke-entwurf.js`, `tools/bogen-anhoehe-entwurf*.js` (8 = Stein mit Pfeilern, Stufe 3)

---

## 16. Risiken für 160c

### A. Spielstände und Verträglichkeit

**R1 – Kopplung an `hillsOn()`.** Viele Brücken-Wege laufen nur, wenn es Anhöhen gibt. Für Brücken übers Wasser ohne Anhöhe (oder auf Ebene 0) würde das still versagen:
- `railArms` → `railArmsHill` (`rules.js:2185`)
- `pathArms` → `pathArmsHill` (`draw-objects.js:136`)
- `railNetwork` → `railNetworkHill` (`rules.js:2207`)
- `trainOnHills` steigt aus (`movers.js:839`)
- `hillRegions` null, `drawHillFlat`

Dazu prüfen mehrere Stellen fest auf `hillLevel ≥ 1`:
- `bkRailArmFrom` `:263`, `bkRailArms` `:270`
- `bkSpanOf` `:105`, `bkPlanDeck` `:208`
- `hwTileOk`, Rückgängig `lvBack(ex, ey) !== 1` (`actions.js:1180`)

Die Regel „ohne Anhöhen exakt wie vorher“ verlangt zugleich, früh auszusteigen. Der Ausstieg muss also auf `bkOn()` gehen, nicht auf `hillsOn()`.

**R2 – Strenges `parseSave`.**
- `n > BK_MAX` lässt die **ganze Brücke** fallen; unbekannte `art` wird `'holz'`.
- Öffnet ein Gerät oder Freund mit altem Code (Cache, noch nicht neu geladen) einen neuen Stand und speichert ihn, gehen Brücken mit 5–8 Feldern und neue Materialien bzw. Optionen verloren. Das gilt auch für die Cloud.
- Ein Ausweg wäre, `art` mit einem alten Rückfallwert (`holz`/`stahl`) zu behalten und das Neue in eigene Felder zu legen. Für n > 4 gibt es im alten Code keinen Ausweg.

**R3 – `BK_MAX` ist zugleich Lese-Grenze** (`state.js:363`). Ihn zu erhöhen ändert sofort, was beim Laden durchkommt. Er steht auch in der Meldung „…sonst braucht die Brücke Pfeiler“ (`:117`) und im Test (`bruecke.test.js:31`).

**R4 – Ids und Indizes.**
- `'stahl'` steht in Ständen und muss lesbar bleiben (→ Metall).
- `paintNew.bruecke.form` ist ein **Index** in `DECO_LOOKS.bruecke.forms`. Wer die Reihenfolge ändert (holz/stein/metall/kristall), verschiebt die gemerkte Wahl.
- Neue Formen nur hinten anhängen, wie Regel 29a4. `BK_ART_IDS` und `lookThumb`-Indizes passen dazu.

**R5 – Familie bei alten Ständen.** Heute ist die Familie nicht gespeichert, sie ergibt sich höchstens aus `weg`/`gleis`. Leere Brücken (ohne Belag) gibt es in Ständen. Holz mit Weg wäre in 160c ein **Bogen** und sähe anders aus als der flache Holzsteg. AUFGABEN 160c fordert „ohne Änderung im Aussehen“ bzw. nennt das als offen. Das muss vor dem Umbau entschieden werden.

**R6 – Speicherformat schlank halten.** Neue Felder (`col`, Licht, Zacken, Stützen, Belag, Familie) in `serialize` nur schreiben, wenn sie nicht dem Standard entsprechen. Sonst bricht der exakte JSON-Vergleich in `bruecke.test.js:23` und die Live-Spiegelung wächst. Alles zusätzlich in `parseSave` streng prüfen.

### B. Regeln und Geometrie

**R7 – Böcke und Stützen auf den Kachelkanten** (abgenommen: Holz 3b, Bahn Holz, Stein mit Pfeilern).
- Heute sperrt `bkBock` ein **ganzes Feld** (Feldmitte).
- Danach würden Kanten und Eckpunkte gesperrt: Linien (`state.edges`), Eckpunkt-Deko (`VSLOT`), Seitenmitte-Deko (Plätze 4–7, `isSide`).
- Betroffen: `bkBock`/`bkBockOf`, `bkUnderError`, `bkPlaceError`, `bkRailCheck` (Holzviadukt „unter jedem Feld“), `bkSetArt`, die Rückgängig-Prüfung (`actions.js:1182-1184`), `edgeError`/`smallError` (für Neues darunter) und die Tests `bruecke-gleis.test.js:52`, `:57`, `:62` und `bruecke.test.js:35`, `:47`.

**R8 – Torbögen unter dem Deck** werden schon heute nicht geprüft (`edgeError`/`setArch` kennen `bkAt` nicht; `bkUnderError` sieht `state.edges` nicht). Mit Stützen auf den Kanten wird das zur echten Kollision.

**R9 – Bergportal am Endfeld** ist weder in `bpError` noch in `bkError` geprüft. Ein Bogen, der „knapp unter der Kante an der Wand ansetzt“, liegt dann genau über der Öffnung. Regel 157m sagt: „Wer Neues an diese Wand malt, lässt die Öffnung frei.“

**R10 – Ein Bogen hat ein Höhenprofil.** Alles, was heute fest `HILL_H` annimmt, braucht dann `h(t)`:
- `bkPick` (Probehöhen `:441`)
- `hwPut` der Spaziergänger (`lv × HILL_H`) und `walkerHead`
- Plan-Rauten (`render.js:1384`) und Schildhöhe (`render.js:1736`, `:1739`, `:1700`)
- `bkWegPaint` (bekommt `H`)
- `after(H)` (gibt `H` heute nicht weiter)
- `drawBkShadows` (Versatz `SUN × HILL_H`)
- der Überlapp am Anschluss (`drawHillFlat` 0,06)

Ein Gleis fährt nie über einen Bogen. `bkRailCheck` und Art- bzw. Familienwechsel im Fenster müssen das sperren.

**R11 – Bauen per Weg-/Gleis-Linie über die Lücke.**
- Heute baut dieselbe Geste (Weg von Anhöhe zu Anhöhe ohne Brücke) den Weg **unten in die Lücke**. Gleichzeitig soll „unten bauen“ möglich bleiben (Nutzerfrage 160a).
- Die Unterscheidung (Start oben, längs, gerade, Gegenstück gleich hoch) gehört in `planScan` vor `bkPlanDeck`.
- Reihenfolge im `batch`: `bkBuild` (zählt `groundVersion` hoch, damit `bkAt` frisch ist), dann `bkLayWeg`/`bkLayRail`.
- Summe aus Brücke + Belag; Rauten über `info.deck`; Memo-Schlüssel.
- Übers Wasser bleibt die „Abkürzung (a)“ der Wegbrücken mit `PLANNED`/`grow` bestehen. Zwei Mechanismen überschneiden sich.

**R12 – Zwei Speichermodelle.** Wasserbrücken sind Felder (`t.bridge`) mit Netz, Schiffen (`seaCross`, `drawBridgeOver`, Block 107), `claimable`-Meer, `bridgeArch`, Erfolg „Brückenfelder“ und Umfärben über `bridgeSpan`. Die Anhöhen-Brücke hat keine Felder. Ein Umzug der Wasserbrücken nach `state.bruecken` berührt Dutzende Stellen. Eine Vereinheitlichung nur von Material, Optionen und Aussehen ist deutlich risikoärmer.

**R13 – Bewohner.** Über Wasser-Wegbrücken laufen sie, über Anhöhen-Brücken nicht (`hillWalkRegions`). Das muss bei einer „Familie“ bewusst gleich oder verschieden bleiben. `hwDeckSide` lässt nur die Mittelreihe zu; bei `BK_W = 0.3` (Entwurf) bliebe das so.

### C. Zeichnen und Leistung

**R14 – GL-Zelle mit fester Größe** (`render.js:2186`: nach oben `(HILL_H + 44 + TH)·z`). Höhere Bögen, Laternen, Kristall-Zacken oder Pfeiler bis zum Boden außerhalb davon werden im GL-Bild abgeschnitten.

**R15 – Leistung (iPad).** Das Deck wird jedes Bild live gezeichnet, ist immer „lebendig“ im Standbild (`bkLiveTiles`), und die Schleifen sind O(n) je Feld. Mit 8 Feldern, Bogen samt Hängern, Balustraden, Pfeilern und Lampen wird das deutlich teurer. Ein Bildchen je Feld mit Signatur wie `roofSprites`/`roofSig` (Regel 29a1) wäre der Weg; Bewegtes und Licht bleiben live. Neue Formen erscheinen in `leistung-je-ding.json`.

**R16 – Licht.**
- `glowQuad` im Live-Teil (Vorbild `roofs.js:565-568`), nur bei `night > 0.15 && isLive()`.
- Ohne Strom aus: Lampen in `computePower` aufnehmen (Schlüsselformat wie `'k,i'`, `T.rail.power.dark`), sonst leuchten Brücken ohne Strom.
- Die Lampenfarbe hängt an der Brückenfarbe; `DECO_LOOKS.bruecke.cols` ist heute `null` (Kunstakademie, `lookOk`, `lookThumb`-Schlüssel mit `col`).
- Nie Licht nach `drawNight` obendrauf malen (Regel 44).

**R17 – Schatten** ist heute nur das Deck-Viereck auf dem Boden. Bögen, Pfeiler und breitere Decks brauchen eigene Formen. Optionswechsel müssen `groundVersion` hochzählen, sonst bleibt der alte Schatten im Boden-Bild.

**R18 – Anhöhen-Bildchen am Anschluss.** `hills.js` kennt keine Brücke: Grasnarbe und dunkle Kante am Anschluss bleiben. Eine Brüstung, die „flach ausläuft“, und ein Bogenansatz an der Wand müssen an der **nahen** Anhöhe (vorher gezeichnet) und der **fernen** (danach, Wand unsichtbar) in beiden Achsen nachgemessen werden (Regel: Brücken immer Ost-West **und** Nord-Süd testen).

**R19 – Leuchtender Belag** (Kristall-Weg) leuchtet auf dem Deck heute nicht. Das wird wichtiger, wenn Kristallbrücken mit Belag kommen.

### D. Kleinigkeiten, die beim Umbau leicht übersehen werden

**R20 – Doppelte Preise.** `ITEMS.bruecke.cost/mat` (`data.js:206`) entspricht `BK_ARTEN.holz`. Kachel, Kunstakademie-Preise und „fürstlicher“ Kristallpreis müssen an **einer** Stelle stehen. Texte mit „1 bis 4 Felder“ und „Holz oder Stahl“: `data.js:206`, `:782`, `openBkInfo` `:485`, `:490`.

**R21 – Vorschau auf dem Deck** (`render.js:1736`): `ok` prüft weder Trittsteine noch ein vorhandenes Gleis. Mit Familien (Fußgänger nur Weg, Bahn nur Gleis) wird das falscher.

**R22 – Rückgängig.** Die Prüfungen nutzen `bkBock`/`bkUnderError` mit der aktuellen Regel. Neue Stütz-Regeln müssen dort genauso gelten, und nach einem Rückgängig bleibt `groundVersion++` Pflicht.

**R23 – Globale Namen.** Bereits belegt: `bridgeArch`, `drawArchBridge`, `archAt`, `BRIDGE`, `WEG_BRIDGE`, `FOOT_STYLES`, `footPaidOf`, `drawBridgeOver`, `isBridgeAt`. Ein zweites `function x` in einer späteren Datei überschreibt still.

**R24 – Erfolg „Brückenfelder“** (`story.js:514`) zählt nur Wasserbrücken. Ob neue bzw. alle Brücken zählen, ist eine Entscheidung; Album und Erfolge sollen nicht schrumpfen.

**R25 – Zum Schluss.** `npm run bump`, `leistung:neu` für neue Formen, Menü- und Schnellwahl-Tests (Gruppe `hoehen`, Kategorie Wege) anpassen, falls die Brücke umzieht.