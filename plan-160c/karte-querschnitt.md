# Querschnitts-Karte für 160c: Speichern/Laden, Rückgängig, Verschieben/Kopieren, Planen, Freischalten, Leiste

Ich habe nur gelesen und nichts ausgeführt (keine Tests, kein npm, kein Browser). Wo ich etwas aus dem Code ableite, aber nicht ausprobiert habe, steht **PLAUSIBEL**. Zeilenangaben beziehen sich auf den Stand von `main` @ 950defa.

---

## 0. Das Wichtigste zuerst

1. **Anhöhen und Deck-Brücken sind noch nicht online.** `origin/main` steht bei b27986e (v951), `main` ist 64 Commits voraus. Weder Block 157 (`state.hills`) noch 160a/b (`state.bruecken`) sind gepusht. `git show origin/main:js/state.js` enthält kein `bruecken` und kein `hills`. Das Format von `state.bruecken` lässt sich also noch fast frei ändern. Lesen müssen wir nur lokale Stände: Testwelten, das WLAN-iPad, eventuell die Cloud, falls dort jemand angemeldet war (ob das ging, sehe ich nicht).
2. **Wasser- und Fußgängerbrücken sind dagegen online**, in echten Ständen und auf Freundes-Inseln. In den Testständen:
   - `testsave-bauland.json`: 448 Felder mit `bridge`, davon 433 Schienenbrücken, 15× `brk:"stein"`, 15× `brc`.
   - `testsave-og.json`: 223 Brückenfelder, `footPaid` „kristall“ und „weg“.
   - `testsave-neu.json`: `brk` holz/rot/ziegel.
   Diese Felder müssen für immer lesbar bleiben.
3. **`parseSave` lässt Felder roh durch.** Kachel-Felder werden nicht bereinigt (`tiles: new Map(d.tiles)`, state.js:344). Nur unbekannte `b` fliegen raus (`return t.b in ITEMS`, state.js:275). Außerdem übernimmt `live.js liveApplyMaps` Kacheln **ohne** `parseSave` (live.js:110-128). Eine Migration von Kachel-Feldern nur in `parseSave` reicht deshalb nicht: Zeichen- und Regel-Code muss die alten Werte weiter verstehen, so wie heute `footPaidOf` (true → holz) und `bridgeKind` (Art aus dem Wegstil).
4. **Ältere App-Versionen stürzen bei neuen Werten in alten Feldern ab** (aus dem Code abgeleitet):
   - `WEG_BRIDGE[bridgeKind(t)].cost` bzw. `.name` (rules.js:3416, actions.js:579, ui.js:1943), `BRIDGE_LOOK[bridgeKind(t)].wall` (ui.js:1929/1931): ein neues `brk` wie „metall“ führt zu einem TypeError beim Antippen, Abreißen oder Kopieren.
   - `FOOT_STYLES[footPaidOf(t)].cost` (rules.js:3419), `ARCH_LOOK[id]` (draw-objects.js:761) mit neuem `footPaid` führt zu einem Absturz im **Zeichnen**, auch bei Besuchern.

   Neues gehört deshalb in **neue Felder**. `brk` und `footPaid` behalten ihren alten Wertevorrat.
5. **Alte Versionen werfen Unbekanntes still weg:**
   - Kacheln mit unbekanntem `b` (state.js:273-276).
   - Brücken mit `n > BK_MAX` (state.js:363, heute 4).
   - Eine unbekannte `art` wird zu „holz“ (state.js:366).
   - Neue Kachel-Felder, weil `tileOut` nur aufgezählte Felder schreibt (state.js:66-114).
   - `paintNew` behält nur die Schlüssel `wall/roof/win/col/form` (state.js:312-313).

   Ein altes Gerät, das so einen Stand lädt und wieder hochlädt, verliert all das.
6. **Wasserbrücken nicht in `state.bruecken` umziehen.** Dann verlören alte Versionen sie ganz, Besucher sähen sie nicht. Im GL-Standbild würde jedes Deckfeld jedes Bild neu gemalt (`bkLiveTiles`, gl.js:681): bei 448 Brückenfeldern ein Leistungsproblem. Tests, die mit `t.bridge`-Kacheln rechnen (neuwelt, monkey, bahn, bruecken), brächen. Besser: Wasserbrücken bleiben Kacheln mit `t.bridge`, neue Optionen kommen als neue Felder dazu.
7. **Der Cloud-Fingerabdruck kennt `hills/bruecken/roofs/tunnels` nicht** (`SIG_KEYS`, cloud.js:63). Änderungen daran kommen nur über `undoable` (→ `cloudTouched`) in die Cloud. Neue Schalter wie Licht an/aus, Farbe oder Zacken an einer Deck-Brücke müssen in `undoable` laufen, sonst werden sie nie hochgeladen.
8. **`lookOk` kennt kein Freischalten über Inseln.** Es prüft nur `design` und `legacy` (rules.js:1721-1726). Dazu kommen:
   - `lookChips` schreibt bei Gesperrtem fest „+n in der Kunstakademie“ (ui.js:1667).
   - Weder `unlockKeys` (ui.js:1012) noch `lmUnlockNames` (story.js:236) noch `unlockSig` (ui.js:922) kennen Formen aus `DECO_LOOKS`.

   Materialien, die über die Wald-/Wind-/Erz-/Kristallinsel frei werden, brauchen eine eigene Prüfung. Sonst gibt es kein „Neu freigeschaltet“, keinen Eintrag im Laternen-Fenster und keinen richtigen Schloss-Text.
9. **Erstattet wird heute nach der aktuellen Preistabelle**, nicht nach dem bezahlten Preis: `bkCost` (bruecken.js:158, 169, 187), `WEG_BRIDGE` (rules.js:3416), `FOOT_STYLES` (rules.js:3419). Steigen die Preise in 160c (Kristall „fürstlich“, Licht extra, vielleicht nach Einkommen), wird jede alte Brücke zur Gelddruckmaschine. Nach Regel 73/137 gehört der bezahlte Preis an die Brücke (`price`, Vorbild `rampPaid` in hills.js:1049).
10. **Der Bahnübergang im Fenster ist nicht rückgängig zu machen.** `data-cross` und `data-foot` rufen `setCrossing` ohne `undoable` auf (ui.js:2061-2062). Wird die Fußgängerbrücke zur einfärbbaren Familie, sollten diese Knöpfe (und neue) in `undoable`.
11. **Deck-Brücken bewegen sich nie mit.** Sie werden nicht aufgehoben, verschoben, kopiert oder gedreht: `pickUpGroup`, `copyCollect` und `scanSelect` kennen `state.bruecken` nicht. Nur Wasserbrücken- und Übergangsfelder ziehen als Kacheln mit.
12. **PLAUSIBEL:** Eine Wegbrücke mit mehreren Feldern lässt sich wahrscheinlich gar nicht per ✋ als Gruppe absetzen. `groupErrors` → `placeError` → `bridgeShapeError` → `armsWith` prüft Nachbarn nur in `state.tiles`. Die übrigen Gruppenfelder liegen dort noch nicht, also kommt „Brücken wachsen vom Ufer aus“ (rules.js:1939, 1962-1966; actions.js:478).

---

## 1. Datenfelder rund um Brücken

| Feld | Ort | Bedeutung, alte Werte | Gesetzt | Gelesen | Gespeichert / beim Laden |
|---|---|---|---|---|---|
| `t.bridge` | Kachel `weg`/`schiene` | true = über Wasser gebaute Brücke (Weg: Block 66, Schiene: seit jeher) | `build` actions.js:119/152, Aufschütten löscht es actions.js:141-147 | `isWegBridge` rules.js:1867, `bridgeArch` 1872ff, `crossError` 2282, `bkUnderError` bruecken.js:58, `groupErrors` actions.js:474-476, `moveError` 634-638, `copyTileCost` 579-580, `demolishInfo` rules.js:3416, `fullValue` 3069, Erfolg story.js:514 | `tileOut` state.js:78; `parseSave` roh |
| `t.brk` | Wegbrücke | Art, wenn sie nicht aus dem Wegstil folgt: 'holz', 'stein', 'ziegel', 'rot' (`WEG_BRIDGE` rules.js:1859-1864). Fehlt das Feld, gilt `BRIDGE_OF_STYLE[style]` oder 'stein' (rules.js:1865-1866) | `setBridgeKind` 1996, `setWegCell` 2009, `setBridgeStyle` 2068, `build` beim Umfärben actions.js:36, beim Verlängern 157 | `bridgeKind` (überall); Zeichnen draw-objects.js:966/995/1070; Fenster ui.js:1927-1943 | `tileOut` state.js:85 (für **jede** Kachel); roh |
| `t.brc` | Wegbrücke | Farbe des Bauwerks als Index in `BRIDGE_COLS` (draw-objects.js:950, 10 Farben); fehlt = Farbe der Art | `setBridgeColor` rules.js:2073-2076; Verlängern actions.js:157 | draw-objects.js:968-969 (Wand: `side`/`rail`, Holz: `rail`) | state.js:86; roh, ohne Bereichsprüfung |
| `t.brw` | Wegbrücke (Holz/Rot) | Plankenfarbe als Index in `PLANK_COLS` (5 Farben) | wie `brc` | draw-objects.js:968-969 | state.js:87; roh |
| `t.style` | Wegbrücke / Bahnübergang | Wegbelag; bei der Wegbrücke bestimmt er auch die Art ohne `brk`; beim Übergang den Belag | `build`, `setWegCell`, `setBridgeStyle` | `bridgeKind`, `archLook` (Stil „weg“) | state.js:74; `parseSave` stellt alte Stile um (state.js:223, gilt auch für `cross`) |
| `t.cross` | Kachel `schiene` | Bahnübergang | `build` actions.js:104-108 | `isCrossing` rules.js:2207 | state.js:108 |
| `t.foot` | Übergang | Fußgängerbrücke an (sonst Schranken) | `setCrossing` rules.js:2290-2307 | Zeichnen, `archAround` hills.js:76, `bkUnderError` bruecken.js:59, `bkPlaceError` 76, ↶ actions.js:1175 | state.js:108 |
| `t.footPaid` | Übergang | bezahltes Aussehen: 'holz', 'stein', 'weg', 'kristall' (`FOOT_STYLES` rules.js:2262-2267); alt `true` = Holz (`footPaidOf` 2269) | `setCrossing` 2302 | `archLook` draw-objects.js:760-766, `demolishInfo` rules.js:3419, `copyTileCost` actions.js:589, Fenster ui.js:1916-1925 | state.js:108; roh |
| `t.lauf` | Weg (auch Brücke) | Musterrichtung 0/1 (Block 158) | `build` `wegLaufNew`, `groupPlaced` actions.js:427 | Muster | `tileOut` hat **kein** `lauf`? → nicht weiter geprüft, gehört anderen |
| `state.bruecken` | Karte Anker → Objekt | `{ ax: 0\|1, n: 1..BK_MAX(4), art: 'holz'\|'stahl', weg?: [Stil\|null], gleis?: [Form\|null] }`, entweder Weg oder Gleis (bruecken.js:6-8) | `bkBuild` 146, `bkSetArt` 193, `bkLayWeg` 233-234, `bkLayRail` 302-303, `bkDemolishAt` 166-172, `restyleRails` rules.js:2254-2258, ↶ actions.js:1192 | `bkFresh` bruecken.js:31-41 (`bkAt`/`bkOnHill`) | serialize state.js:149-150; streng gelesen state.js:363-368 |
| `state.paintNew.bruecke` | privat (`LIVE_PRIV`) | `{ form }` = Index in `DECO_LOOKS.bruecke.forms` (0 holz, 1 stahl) für neue Brücken | `wireLookChips` ui.js:1675 | `bkArtNew` bruecken.js:19 → `decoLookNew` rules.js:1727 | `parseSave` lässt nur `wall/roof/win/col/form` als Ganzzahl ≥ 0 durch (state.js:312-313) |
| `state.paintNew.schiene.form` | privat | Gleis-Stil für Neues, auch aufs Deck | Leiste, Pipette actions.js:617 | `bkRailCheck`/`bkLayRail` bruecken.js:285/296 | wie oben |
| `state.design` | Set | Kunstakademie-Käufe, z. B. `'b:form:id'`. `DECO_LOOKS.bruecke` hat heute **keine** Form mit `design` | `buyDesign` actions.js:829-840 | `lookOk`, `unlockOk` | state.js:146 / 311 |
| `state.claimed` | Set | eigene Meerfelder (Wegbrücke ins Meer per `claimSea`) | actions.js:186-190; Plan legt sie vorübergehend an, plan.js:124/132 | `ownedTile` | ↶ nimmt Neues wieder weg, actions.js:1110/1193 |
| `state.achieved.bruecken` | Erfolg | zählt Kacheln mit `t.bridge` (story.js:514); Gleis auf dem Deck zählt bei „Eisenbahn“ (512, `bkRailTiles`) | `checkAchievements` story.js:538 (wird nie kleiner) | | |

Hinweis: Wird unter einer Wasserbrücke aufgeschüttet, löscht `build` nur `bridge` und `brk` (actions.js:144). `brc` und `brw` bleiben als tote Werte an der Wegkachel stehen. Das schadet nicht, sie werden aber mitgespeichert.

---

## 2. Speichern und Laden

### 2.1 `serialize` / `tileOut` (state.js:66-153)
- `tileOut` (66-114) zählt die Felder einzeln auf. Ein neues Kachel-Feld ohne Eintrag hier geht beim Speichern verloren (Regel 24/48; der Zufallstest findet es nur, wenn er es zufällig benutzt).
- `brk`, `brc` und `brw` werden für **jede** Kachel geschrieben (85-87), also auch für eine Schiene. Eine Schienenbrücke mit `brk`/`brc` übersteht deshalb schon heute den Speicher-Kreislauf alter Versionen.
- Getragenes wird am alten Platz gespeichert (116-142, `carried()` actions.js:265). Brücken-Objekte werden nie getragen.
- `bruecken` (149-150): `ax` wird zu 0/1 normalisiert; `weg` nur, wenn mindestens ein Feld belegt ist; `gleis` nur, wenn mindestens eine Form nicht null ist. **Neue Felder (Licht, Farbe, Zacken, Belag) müssen hier ausdrücklich dazu.**
- Die Version steht bei `v: 13` (144). Merker wie `growHall` werden nicht gespeichert, sie leben nur zwischen `parseSave` und `afterLoad`.

### 2.2 `parseSave` (state.js:171-371): was streng ist und was roh
- **Roh:** `tiles` (344) und damit alle Brückenfelder (`bridge`, `brk`, `brc`, `brw`, `foot`, `footPaid`). Auch `design` (311) und `legacy` (310) werden nur als Set übernommen.
- **Gefiltert:**
  - Kacheln mit unbekanntem `b` (273-276).
  - Alte Stile werden umgestellt, auch an Übergängen: `(t.b === 'weg' || t.cross) && !isWegStyle` (219-224).
  - `paintNew` nach Schlüsseln (312-313).
  - `edges`, `roofs`, `hills` streng (347-362).
- **`bruecken` streng (363-368):** Anker-Muster, `n` als Ganzzahl in 1…`BK_MAX`; `art` unbekannt → 'holz'; `weg` nur gültige Stile; `gleis` nur, wenn kein Weg darauf liegt, mit Formen in `DECO_LOOKS.schiene.forms`; Länge auf `n` gekürzt und aufgefüllt.
  - **Achtung:** `BK_MAX` steht im Filter. Wird es auf 8 erhöht, verwerfen alte lokale Versionen Brücken mit 5 bis 8 Feldern ganz.
  - Neue Felder werden nur übernommen, wenn sie hier ausdrücklich stehen.

### 2.3 Muster für Migrationen (alle vier gibt es schon)

| Muster | Beispiel (Zeile) | Wann nehmen |
|---|---|---|
| **a) Beim Lesen umdeuten** (nichts umschreiben) | `footPaidOf`: true = holz (rules.js:2269); `bridgeKind`: ohne `brk` aus dem Stil (rules.js:1866) | **Erste Wahl für Kachel-Felder**: wirkt auch bei `liveApplyMaps` (roh) und bei Sicherungen aus der Cloud |
| **b) In `parseSave` am Rohobjekt `d` umschreiben**, ohne Versionsnummer, wiederholbar | alter Markt/Park → Plätze (181-218); `WEG_TO`/`PAVE_TO` (176-178, 219-224); Weg-Rampe → Erstattung (254-258); Tunneleinfahrt: `form` löschen und Naturstein erstatten (262-269); `DROPPED` (292-297); `MERGED` (299-304) | Wenn etwas wegfällt und erstattet wird; nur auf `d`, ohne Welt-Abfragen |
| **c) Versionsnummer + Merker + `afterLoad`** | `growWonders: (d.v\|\|3) < 9` usw. (316-323), ausgeführt in `afterLoad` (439-466: `growWonders`, `growTownHall`, `growHarbors`, `growLighthouses`, `fitFootprints`, `hbfUpgradeAll`) mit Meldung per `setTimeout`-Toast | Wenn die Migration Gelände, Anhöhen oder `COVER` braucht (z. B. alte Bogenbrücke → neue Form nach Länge) |
| **d) `state.legacy`** (Set) für Freischaltungen | `legacyUnlocks` (394-406); v8 vergibt Farben/Stile (279-289); `unlockOk` prüft `legacy` zuerst (rules.js:842), `lookOk` auch (1725) | Falls 160c ein Material erst über eine Insel freigibt, das alte Stände **schon gebaut** haben: die Brücke bleibt, und sie sollen sie weiter bauen bzw. umstellen dürfen |

Wichtig dazu:
- `afterLoad` läuft bei Start (main.js:94-97), Import, Cloud-Übernahme, Live-Übernahme und Testwelt (alle über `adoptState` state.js:423-437). Bei `liveApplyMaps` läuft es **nicht**.
- `fitFootprints` läuft nur mit `state.fitBig` (Regel 84).

### 2.4 Ladewege

| Weg | Code | Wie gelesen |
|---|---|---|
| Start (localStorage) | `load` state.js:410-420 → main.js:79/94 → `afterLoad` | `parseSave`; unlesbar → Kopie `_defekt_` (`loadFailure`) |
| Datei importieren | ui.js:3552 → `adoptState` | `parseSave` |
| Cloud übernehmen | `cloudTakeNow` cloud.js:150-167 (Lesen 155) | `parseSave`, vorher Sicherung des eigenen Stands |
| Früherer Stand aus der Cloud | `cloudRestore` cloud.js:321-333 | `parseSave`; **Sicherungen enthalten beliebig alte Formate** |
| Live: ganzer Stand | `liveAdopt` live.js:104-108 (bei `rest` geändert, live.js:134-137) | `parseSave(liveJoin)` |
| Live: einzelne Felder | `liveApplyMaps` live.js:110-128 | **roh**: `state.tiles.set(k, JSON.parse(v))`, danach `rebuildCover`/`recalc` |
| Testwelt `?welt=` | main.js:281 | `parseSave` |

### 2.5 Cloud (cloud.js)
- Hochgeladen wird der Text von `serialize` (`putSave` 141), übernommen per `parseSave`.
- `cloudDecide` (75-83) ist eine reine Funktion mit Tabellentest.
- Ob ein Stand als „selbst geändert“ gilt, entscheiden `acts` (`cloudTouched` 50, aufgerufen von `undoCommit` actions.js:1104 und `undo` 1196) **oder** `worldSig` über `SIG_KEYS` (63-69). In `SIG_KEYS` fehlen `hills`, `bruecken`, `roofs` und `tunnels`.
- `cloudWatchLocal` (528-540) erkennt Änderungen ohne ↶ nur an `SIG_KEYS`.
- Folge für 160c:
  - Jede Änderung an `state.bruecken` muss über `undoable` laufen oder selbst `cloudTouched()` rufen.
  - Nimmt man `bruecken` in `SIG_KEYS` auf, ändert sich einmalig jeder Fingerabdruck. Auf führenden Geräten führt das zu `cloudTouched` und Hochladen. Auf zuschauenden Geräten zu `cloudBlocked` und Neuaufsetzen (538). Das ist möglich, aber eine Folge, die man kennen sollte.
- Wechselt die Migration den Inhalt von `tiles` (z. B. Felder umgeschrieben), weicht der Fingerabdruck nach dem Laden ab. Das Gerät hält sich dann für „geändert“ und lädt hoch oder fragt nach (`cloudDirty` 70).

### 2.6 Live-Spiegel, Besuch, Freunde (live.js, friends.js)
- `LIVE_MAPS = ['tiles', 'decos', 'edges', 'terra']` (live.js:13). `bruecken`, `hills`, `roofs` und `tunnels` liegen im öffentlichen **„rest“** (live.js:23-31). Jede Änderung daran lässt Zuschauer und Besucher den ganzen Stand neu aufbauen (`liveAdopt`). Das ist teuer, aber richtig.
- Kachel-Änderungen kommen roh an (siehe 2.4). Ein Freund mit **älterer** App, der eine Wasserbrücke baut, liefert also alte Felder direkt in meinen neuen Zustand. Und eine neue App liefert neue Felder roh in den Zustand eines alten Besuchers.
- Besucher (`VISIT`) speichern nie (state.js:163), dürfen aber Fenster öffnen und antippen. Abstürze durch unbekannte Werte (Punkt 0.4) treffen sie also.
- `friends.js` liest aus fremden Ständen nur `rest.town` (friends.js:581). In den Firebase-Regeln gibt es keine Feldprüfung für `worlds/*/tiles|rest`.

### 2.7 Was alte App-Versionen mit 160c-Daten machen (aus dem Code abgeleitet)

| Neue Daten | Online v951 (kennt keine Anhöhen/Deck-Brücken) | Lokaler Stand vor 160c (mit 160a/b) |
|---|---|---|
| `state.bruecken` überhaupt | wird ignoriert, beim Speichern weg | wird gelesen |
| `n` 5–8 | – | Brücke verworfen (state.js:363) |
| `art` 'stein'/'metall'/'kristall' | – | wird zu 'holz' (366), danach so gespeichert |
| neue Felder an `bruecken` (`licht`, `col`, …) | – | verworfen |
| neuer Wert in `t.brk` | Absturz bei Fenster, Abriss, Kopie, Art wechseln (siehe 0.4) | gleich |
| neuer Wert in `t.footPaid` | Absturz beim **Zeichnen** (`archLook` liefert `undefined`), Abriss | gleich |
| neue Kachel-Felder | bleiben im Speicher (roh), aber `tileOut` schreibt sie nicht → nach dem nächsten Speichern weg | gleich |
| neue Kachel-Art (`b`) | Kachel verworfen (state.js:275) | gleich |
| neue Schlüssel in `paintNew` | verworfen (312-313) | gleich |

---

## 3. Rückgängig (actions.js:1085-1201)
- `UNDO_MAPS` (1094-1096): tiles, decos, edges, terra, tunnels, roofs, hills, **bruecken**. Was in `state.bruecken` steht, ist damit automatisch Teil von ↶. `undoStr` (1097) vergleicht JSON ohne `born` und `rate`. Neue Felder an Brücken-Objekten oder Kacheln gehen also ohne Zusatzarbeit mit.
- `undoSnap` (1098-1102) und `undoCommit` (1103-1119) merken nur geänderte Schlüssel, dazu Taler, Lager und `claimed`. `undoCut` leert den Stapel (Laternenfest).
- `undoable` (1120-1125): bei `viewOnly()` gesperrt; beim Verschieben wird erst das Ablegen ein Schritt; eine Kopie wird je Absetzen ein Schritt.
- `undo` (1126-1201): Prüfungen in dieser Reihenfolge:
  1. Jede geänderte Stelle muss noch genauso aussehen wie nach dem Schritt (1132-1135).
  2. Grundfläche gegen `COVER`, Ebenen der Anhöhen (1136-1149).
  3. Anhöhen mit Treppe, Rampe oder Bergportal (1150-1162).
  4. **Brücken (1164-1186):**
     - Eine Anhöhe, auf der inzwischen eine fremde Brücke aufliegt, kommt nicht weg (1170).
     - Keine Anhöhe und kein Dach unter eine stehende Brücke (1171-1172).
     - Nichts Hohes unter eine Brücke; flach sind nur Weg/Schiene ohne `bridge` und ohne `foot` (1173-1177).
     - Eine Brücke kommt nur zurück, wenn ihre Enden auf Ebene 1 und ihre Lücke auf Ebene 0 liegen (`lvBack`, 1180).
     - Steht sie schon, zählen nur **neue Böcke**; sonst `bkUnderError` (1181-1184).
  5. Genug Geld und Material (1187-1188).
  6. Danach `groundVersion++`, wenn Brücken betroffen waren (1195). Grund: `bkFresh` merkt sich Objekt-Referenzen je Boden-Fassung (bruecken.js:31-41). Dann `cloudTouched`, `recalc`, `save`, und das offene Fenster baut sich neu (`panelLive`).
- **Kein ↶-Schritt:** Kunstakademie-Käufe, Forschung, `wireLookChips` (Stil-Zeile, nur `save()`), **`setCrossing` aus dem Fenster** (ui.js:2061-2062). Die Brücken-Fenster laufen über `undoable`: `bkSetArt`, `bkDemolishAt` (bruecken.js:493-495) sowie `setBridgeKind`/`setBridgeStyle`/`setBridgeColor` (ui.js:2044-2049).
- **Folgen für 160c:**
  - Neue Stützen- oder Pfeilerregeln, z. B. „auf Kachelkanten“ oder „Bahnbrücke Holz: Böcke auf Kanten“, ersetzen `bkBock`/`bkBockOf` (bruecken.js:23/26). Die ↶-Prüfung (1182-1184) und `bkSetArt` (186) müssen dieselbe Funktion nehmen.
  - Ändert sich, was als „flach“ gilt (1175: `!t.bridge && !(isCrossing && foot)`), etwa weil eine Bahnbrücke übers Wasser flach wird, muss diese Stelle mit.
  - Jede neue Änderung an Brücken zählt `groundVersion` hoch, sonst arbeitet `bkFresh` mit alten Objekten.

---

## 4. Verschieben, Kopieren, Gruppe drehen (actions.js)

| Funktion | Zeile | Rolle; was mit Brücken passiert |
|---|---|---|
| `moving`, `movingType`, `carried` | 262-265 | Zustand; eine Kopie gilt nicht als getragen |
| `pickUp` | 266-292 | ein Ding; per ✋ auf ein Deck getippt trifft man die Kachel **darunter** (input.js:41 nimmt `bkPick` nur bei Weg/Schiene) |
| `pickUpGroup` | 294-337 | Rechteck: Kacheln ganz innen, Deko, Boden, Dächer, Linien. **`state.bruecken` und Anhöhen bleiben.** Wasserbrücken- und Übergangsfelder kommen als Kacheln mit, samt `bridge/brk/brc/brw/foot/footPaid` |
| `groupPlaced` | 409-434 | dreht `rot` bei Weg/Schiene (Übergang!), dreht `lauf` mit (427). Brückenfelder werden nur kopiert |
| `groupErrors` | 435-486 | Dach unter einem Deck → Fehler (462). Weg/Schiene: mit `bridge` nur aufs Wasser, ohne `bridge` nie aufs Wasser (472-477). Sonst `placeError(..., { move, noCost, t })` → `bkPlaceError` (rules.js:2842 → bruecken.js:68-83: keine Wasser- oder Fußgängerbrücke unter ein Deck, nur Flaches, kein Weg/keine Schiene am Bock). **PLAUSIBEL:** Wegbrücken mit mehreren Feldern scheitern an `bridgeShapeError` (Punkt 0.12) |
| `dropGroup` | 487-528 | legt ab; `claimSea(…, t.bridge)` (515) nimmt Meerfelder; eine Kopie zahlt `moving.cost` |
| `copyClone` | 530-540 | löscht `gleis` an Kacheln (gemeint ist das Hbf-Feld; `bruecken.gleis` ist ein anderes Objekt) |
| `copyCollect` | 541-563 | wie `pickUpGroup`, **ohne Brücken-Objekte** |
| `copyCost` / `copyTileCost` | 565-591 | Wegbrücke `WEG_BRIDGE[bridgeKind]`, Schienenbrücke `BRIDGE`, Übergang Weg-Preis plus `FOOT_STYLES[footPaid] \|\| holz` |
| `copyPipette` | 593-609 | Übergänge sind ausgenommen (`!it.t.cross`) |
| `startCopy` | 610-631 | Kopie am Finger |
| `moveError` | 632-641 | Einzelstück: Brücken nur übers Wasser; dann `placeError(..., { move: true, t })` |
| `dropAt` | 642-667 | `claimSea(…, t.bridge)` |
| `discardCarried` | 668-687 | zurücklegen, dann `demolish` |
| `cancelMove` | 688-713 | legt alles zurück |
| `selDemolishPlan` | ui.js:534 | ✋ → Abriss mit `keepLand`; nimmt über `scanDemolish` auch Brücken mit (plan.js:240-252) |
| `turnSelWegs` | ui.js:528-533 | dreht `lauf`; `wegTurns` schließt Brücken aus (rules.js:1021) |

Weitere Punkte:
- Getragene Fußgängerbrücke auf einer Anhöhe: `archHillError` (rules.js:2840; hills.js:71-75).
- **Folgen für 160c:** Soll eine Brücke als Ganzes mitziehen (oder kopiert werden), braucht sie eine neue Art in der Gruppe. Nach Regel 117 heißt das: aufnehmen, `groupErrors`, `dropGroup`, `cancelMove`, `serialize` (am alten Platz) und Vorschau. Alternativ bleibt sie ausdrücklich stehen, und der Hinweis „manches bleibt stehen“ zählt sie mit (heute tut er das nicht: `stays` zählt nur Kacheln).
- Kopien müssen Material, Licht und Zacken mitbezahlen (`copyTileCost`).

---

## 5. Plan-System (plan.js) und wie Brücken heute entstehen

**Grundlagen**
- `LINE_TOOLS` mit 'bruecke', `RECT_TOOLS`, `dragKind` ('bruecke' = Linie) (7-10); `PLAN_MAX` Linie 80, Rechteck 24 (11).
- `lineTiles` als L-Form (23-30); `planTiles` (32-37).
- `startPlan` (57-60): `deck: true`, wenn mit Weg/Schiene auf einem Deck angefangen wurde. Das Flag kommt aus `bkPick` (input.js:86/186) und `tap` → `planTap(v.x, v.y, isTouch, !!v.deck)` (actions.js:849, plan.js:350-375).
- `planCheck` (65-90): Umfärben, Gleis-Stil umstellen (kostenlos), Übergang über `crossError(…, true)`, sonst `placeError(…, { noCost })` plus `costOf` plus `clearCost`.

**`planScan` (93-139)**
- `scanBruecke` für das Werkzeug 'bruecke' (99).
- Weg/Schiene: `deck = bkPlanDeck(p)` (101, bruecken.js:200-217). Felder auf dem Deck nutzen `bkWegCheck`/`bkLayWeg` bzw. `bkRailCheck`/`bkLayRail` (115/119), sonst `build(b, x, y, true)`.
- **Wasserbrücken:** `grow` gilt für `CLAIM_TOOLS` oder Weg (100). Geprüft wird in Runden mit `PLANNED` (103, 123): `isBridgeAt` und `wegLike` (rules.js:1937-1938) sehen geplante Felder schon als Weg bzw. Brücke. Meerfelder gelten kurzzeitig als eigen (124, 132).
- Gleis-Rampe quer: rot (106-110). Gleis-Stil-Regel: nur Altes umstellen (133-136).

**Brücke zwischen Anhöhen**
- `bkSpanOf` (bruecken.js:95-109): gerade, Oberkante → tiefere Lücke → gleiche Höhe; nur Ebene 1.
- `bkError` (111-129): freigeschaltet, `A.tech`, eigenes Land, `BK_MAX`, nicht doppelt, `bkUnderError` je Feld mit Bock.
- `scanBruecke` (131-140): die ganze Brücke als **ein** Schritt (`order` mit `bkBuild`); `planText` zeigt Art und Felder (300-302).

**Abriss: `scanDemolish` (208-281)**
- Brücken nur ganz im Rechteck, samt Weg/Gleis, voll zurück (240-252).
- Eine herausragende Brücke bleibt stehen; was darunter abgerissen wird, bleibt grün (243-245).
- Ihre Anhöhen bleiben (`onHill`, 251); `BK_ON_HILL` beim Abtragen (273).

**Merken und Ausführen**
- `planInfo` (284-292): Schlüssel aus Art, Werkzeug, `keepLand`, `erase`, `deck`, a/b, `slot`, `currentStyle`, `decoLookNew(p.tool)` und `groundVersion` (285).
- `runPlan` (316-332): `batch()` rechnet und speichert einmal; `noteRecent`; läuft im `undoable` von `tap` (input.js:133).

**Wasserbrücke beim Bauen**
- `build` (actions.js:117-175): `bridge` = Weg/Schiene auf Wasser (119); `claimSea` (128); neue Kachel mit `bridge: true`, ohne `wegShapeNew` (152).
- Beim Verlängern übernimmt sie `brc`/`brw`/`brk` vom Nachbarn (155-158).
- Preis `costOf` (rules.js:2079-2084): `WEG_BRIDGE[newBridgeKind]` (2078: wie der Nachbar, sonst nach dem gewählten Stil) bzw. `BRIDGE`.
- Regeln in `placeError`:
  - Meer: höchstens 3 Felder vor die Küste oder `seaGapBridgeable` bis 16 (rules.js:2924-2932).
  - Wasser: `bridgeShapeError` (2959; 1962-1974: vom Ufer aus, gerade, ≤ 16 lang, ≤ 4 breit).
  - Seite einer Brücke: kein Abzweig (2975).
- Aufschütten unter einer Brücke erstattet die Differenz und macht ein normales Feld daraus (actions.js:140-147).

**Folgen für 160c („Linie über die Lücke → Brücke entsteht“)**
- `planScan` braucht für Weg/Schiene einen Schritt, der Lücken auf der Linie erkennt (Logik von `bkSpanOf`). Er hängt `bkBuild` als eigenen Eintrag **vor** die Deck-Felder in `order`, und die Deck-Menge enthält dann die neue Lücke (heute liefert `bkPlanDeck` nur vorhandene Decks).
- Kosten zusammenzählen, Fehler je Feld.
- Der Schlüssel von `planInfo` muss die Brücken-Wahl für Neues enthalten (Material, Licht, Farbe, Zacken). Heute steht dort nur `decoLookNew(p.tool)` fürs Werkzeug selbst. Wer mit Weg/Schiene zieht und eine Brücke entstehen lässt, braucht zusätzlich die Brücken-Wahl, sonst bleibt die Vorschau veraltet.
- Konflikt mit dem Nutzerwunsch „was, wenn ich unten einen Weg bauen will?“: heute regelt das `bkPlanDeck` mit dem Merker `oben` (Linie beginnt oben bzw. auf dem Deck). Dieselbe Regel sollte entscheiden, ob eine **neue** Brücke entsteht.
- Wasserbrücken entstehen weiter Feld für Feld in `build`. Eine „Bahnbrücke übers Wasser in 4 Materialien“ bekommt ihre Wahl am besten als Feld an der Schienenkachel (`tileOut` schreibt `brk`/`brc` schon heute für jede Kachel).

---

## 6. Freischalten, Kunstakademie, Kosten

**Freischalten**
- `unlockOk` (rules.js:841-855) prüft der Reihe nach: `legacy`, `design`, `lm 'typ:n'` (`lmStage` 840), `lanterns`, `tech`, `rank`, `festival`, `garden`, `album`, `invention`, `bond`.
- Dazu `unlockText` (858-873), `available` (1758; Größen wie das Grundmodell), `lockText` (1759-1763), `unlockGo` (ui.js:630).
- **Inseln (data.js:887-903):** Wald → lm 'baum', Wind → 'klippe', Erz → 'erzberg', Kristall → 'kristall' (`ISLE_OF_LM`). Vorbild ist immer die Wahrzeichen-Stufe (z. B. `kristall: lm 'kristall:1'` data.js:134; Eisenbahn `lm 'erzberg:1'` data.js:952), nie „Insel entdeckt“.
- **Heute:**
  - `ITEMS.bruecke` hat `tech: 'terraform'` (data.js:206).
  - `BK_ARTEN.stahl.tech = 'bahn'` (bruecken.js:13) wird direkt geprüft (`bkError` 115, `bkSetArt` 184), nicht über `lookOk`.
  - `WEG_BRIDGE` und `FOOT_STYLES` sind **ohne Sperre**, nur über das Material. Kristall gibt es erst über die Kristallmine ('kristall:1', data.js:68).
- Material-Quellen: Bretter (Sägewerk 'baum:1', data.js:70), Pflastersteine (Steinmetz 'klippe:1', 72), Metall (Schmiede 'erzberg:2', 74), Kristall (Kristallmine 'kristall:1', 68). Metall gibt es also erst ab Erzberg Stufe 2, die Eisenbahn schon ab Stufe 1.
- **Alte Stände** haben Stein/Ziegel/Rot/Kristall womöglich schon, ohne die Insel zu haben. Nach Regel 18 behalten sie, was sie hatten (`legacy`).

**Kunstakademie**
- `DESIGN` (data.js:1174-1186) baut aus `DECO_LOOKS` automatisch einen Eintrag `${b}:form:${id}` für jede Form mit `design` (Gruppe `L.group`).
- `DECO_LOOKS.bruecke` (data.js:1147): Formen `holz`, `stahl`, keine Farben. **Der Index ist der gespeicherte Wert** (Regel 106: nie umsortieren, Neues hinten anhängen), denn `paintNew.bruecke.form` ist ein Index.
- `lookOk` (rules.js:1721-1726) prüft nur `design`/`legacy` nach id; `decoLookNew` (1727-1732) nur `form`/`col` > 0.
- `designPrice`/`designIdeas`/`designError` (943-962), `buyDesign` (actions.js:829-840, ruft `buildToolbar`).

**Hinweise zum Freischalten**
- `lmUnlockNames` (story.js:236-244) zählt nur ITEMS, Wegstile, TECHS und Hausstufen mit `lm` auf. DECO_LOOKS-Formen fehlen.
- `unlockKeys` (ui.js:1012-1018) für „Neu freigeschaltet“ (Regel 30, braucht `ITEM_TIPS`) kennt nur ITEMS, Wegstile und Hausstufen.
- `unlockSig` (ui.js:922) beachtet nur `available` und `styleOk`.

**Kosten und Material**
- `costOf` (rules.js:2079), `payMat` (data.js:235, lässt das Lager aufblitzen), `matError` (236-239), `hasMat` (234), `canPay` (rules.js:1793), `addCost` (2270), `bkCost` (bruecken.js:20, je Feld).
- Erstatten:
  - Deck-Brücke voll nach **heutigem** `bkCost` (152-178).
  - Wegbrücke `WEG_BRIDGE[bridgeKind]` voll (rules.js:3416).
  - Übergang: Schiene + Weg + `FOOT_STYLES` voll (3418-3422).
  - Art wechseln: alte voll zurück, neue bezahlen (`bkSetArt` 180-196, `setBridgeKind` 1988-1999, `setCrossing` 2295-2303).
  - `fullValue` (3065-3071, Rathaus/Hafen wächst) erstattet bei der Wegbrücke nur den Weg-Preis. Das ist eine kleine Ungleichheit.
- Vorbild für „bezahlt bleibt bezahlt“: `t.price` (Regel 137/73), `rampPaid` (hills.js:1049), `ITEMS.huegelrampe` mit Gettern `get cost()`/`get mat()` (data.js:212-214).
- **Bestehender kleiner Fehler (PLAUSIBEL):** Kachel und Bau-Infofenster zeigen für 'bruecke' immer `ITEMS.bruecke.cost` = 60 und 🪚 3 (data.js:206; `cardPrice` ui.js:478, `openBuildInfo` ui.js:601-630), auch wenn Stahl gewählt ist (120 + 🔩 3 je Feld). Für 4 Materialien besser einen Getter wie bei der Gleis-Rampe.

---

## 7. Menü, Leiste, Stil-Zeile, Texte
- **`MENU`** (data.js:601-645): Gestalten → Anhöhen = `['anhoehe', 'huegeltreppe', 'bruecke']` (631). Dieselbe Liste steht fest in drei Tests (siehe 9). `menuPlaceOf` und `tryUnlock` (ui.js:1146-1155).
- **`FX`** `bruecke: '🌉 von Anhöhe zu Anhöhe'` (data.js:667). **`ITEM_TIPS.bruecke`** (data.js:782), `ITEM_TIPS.schiene` erwähnt die Wasserbrücke (694). `ITEMS.schiene.desc` nennt den Brückenpreis 🪙 40 🪵2 🔩2 (88). Beschreibung `ITEMS.bruecke` (206): „1 bis 4 Felder … Holzsteg oder Stahlbrücke“. Hinweis im Bild: render.js:1759.
- **`DRAG_KATS`** (ui.js:135-140): `wege` = `['weg', 'bruecke']` (138); `katPick` (151), `katPic` merkt Bilder **nur je id** (154-166, ein Materialwechsel ändert das Kategorie-Bild nicht), `katChips` (214-240).
- **Stil-Zeile:**
  - `renderStyleBar` (798-801) → `renderOwnStyleBar` (828ff). 'bruecke' landet im allgemeinen Zweig `!STYLES[t] && DECO_LOOKS[baseOf(t)]` → `lookChips` (1663-1673) mit Form-Knopf und Ausklappraster (`lookPop`).
  - `lookFree`/`lookMore` (1658-1659) nach `lookOk`; Text „in der Kunstakademie“ (1667).
  - `wireLookChips` (1674-1679) setzt `paintNew[b]` und speichert, ohne ↶.
  - Neue Optionen (Licht, Zacken, Farbe, Belag/Gleis für die Brücke) brauchen eigene Knöpfe wie bei der Gleis-Rampe (`rampFormBar` ui.js:791-796) oder dem Bahnhof (Länge).
- **Bilder:**
  - `thumbRaw` (ui.js:51-128; 'bruecke' 74-75 → `drawBkIcon(…, BK_ART_IDS[tile.form] \|\| bkArtNew())`).
  - `lookThumb` (1619-1656; 'bruecke' 1631-1636, Cache-Schlüssel `b|form|col` in `lookThumbs`: **neue Optionen gehören in den Schlüssel**).
  - `drawBkIcon` (bruecken.js:422-434).
  - `openBkInfo` (475-497): Art-Knöpfe mit `lookThumb`, Klasse `locked` bei fehlender Forschung.
- **Fenster der Wasserbrücke** (ui.js:1927-1934; Titel 1943, Text 1951; Knöpfe 2044-2049): Art (`data-brk`), Farbe des Bauwerks (`data-brc`), Planken (`data-brw`), Belag (`wegPickHtml(…, 'brs')`). **Bahnübergang** (1916-1925; 2061-2062).
- **`NEWS_HISTORY`** (ui.js:3251): oben steht `2026-10-09-zaun` (= v951, gepusht). Anhöhen und Brücken (157, 160) haben noch **keinen** Eintrag; der nächste Push braucht einen (Regel 52). Ältere Einträge nennen „Stein und Ziegel … Holz und Rot“ (3299-3303) und die Fußgängerbrücke (3304-3307). Fallen Ziegel und Rot weg, alte Einträge anpassen.
- **Hilfe** (help.js): keine Brücken-Begriffe. Die Anleitung erwähnt Brücken allgemein (ui.js:3200).
- **Erfolge:** 'bruecken' zählt Kacheln mit `t.bridge` (story.js:514), Deck-Felder zählen nicht. **Album:** Kategorie 'land' ist auf keiner Seite (story.js:573-585). Bekäme eine neue Brückenart eine Kategorie wie 'deko' oder 'bau', käme sie ins Album; dann `LATE_ALBUM` beachten (story.js:612).

---

## 8. Berührungspunkte mit dem Zeichnen (nur der Querschnitt; die Bilder selbst sind ein anderer Bereich)
- **Zwischenspeicher, die sich an Brücken hängen:**

  | Speicher | Ort | Schlüssel / wann neu |
  |---|---|---|
  | `bkFresh` | bruecken.js:29-41 | `groundVersion`, `state`, Größe |
  | `bridgeArchCache` | rules.js:1872-1878 | `groundVersion`, `tiles` |
  | `planMemo` | plan.js:283-287 | |
  | `previewCache` | rules.js:3446 | |
  | `lookThumbs` | ui.js:1617 | |
  | `katPicCache` | ui.js:153 | |
  | Bildchen mit Platz | render.js:947-955 | Schlüssel nennt `cross`/`foot`, nicht `footPaid`; neu über `groundVersion` als Fassung (`ver` 955) |

  Folge: **Jeder Setzer neuer Optionen zählt `groundVersion` hoch** (wie `setCrossing` 2306, `setBridgeColor` 2075).
- **GL-Standbild:** Jedes Deckfeld ist „lebendig“ (`bkLiveTiles` bruecken.js:420 → gl.js:681) und wird jedes Bild neu gemalt. Achtbrücken mit 8 Feldern oder viele Brücken kosten. Wasserbrücken gehen heute **nicht** diesen Weg (Bogenbrücken in der Objekt-Schleife render.js:2063, flache im Boden-Bild, `cachedPath` ohne `bridge` render.js:82).
- **Licht an/aus:**
  - Laternen zählen in `computePower` (rules.js:2784-2794; je `LAMPS_PER_POWER` = 10 eine ⚡, 2343); Kennungen kommen in `power.dark`.
  - Linien-Lichter laufen über `edgeLamps` (2793).
  - Brückenlicht braucht eigene Kennungen, und „dunkel“ gehört in den Bildchen-Schlüssel (vgl. Laterne render.js:985). Licht wird über `glowQuad` nach dem Malen gestanzt (Regel 44/112/144).
- Schatten des Decks im Boden-Bild: `drawBkShadows` (bruecken.js:406-418, render.js:163).

---

## 9. Tests, die den Bereich abdecken

| Test | Was er prüft (Bezug zu 160c) |
|---|---|
| tests/bruecke.test.js | 160a: Bauen per Linie (Preis 180 = 3 × 60, **genaues JSON `{ ax: 0, n: 3, art: 'holz' }`**), was nicht geht (schräg, zu lang, Stahl ohne Bahn), darunter nur Flaches, Anhöhen tragen, Weg aufs Deck vs. unten, Abriss/Art/↶, Speichern **streng** (`n: 9` fliegt raus, `art: 'gold'` → holz), Zeichnen, gegengelesene Fälle (✋-Dach darunter, `setCrossing` darunter, Abriss-Rechteck) |
| tests/bruecke-gleis.test.js | 160b: Gleis aufs Deck, Weg ODER Gleis, Holzviadukt-Böcke, Stil umstellen kostenlos, Abriss/↶ (Böcke gegen neuen Weg), Speichern streng, Zug übers Deck, Stücke je Feld, Rundkurs, `restyleRails` über die Brücke, Antippen, ↶ mit `groundVersion` |
| tests/bruecken.test.js | Block 66: Wegbrücke per Linie, Art aus dem Stil, Form-Regeln, `setBridgeKind` erstattet, Umfärben behält die Art, Meer, Farben `brc`/`brw` gespeichert, ganze Brücke, Belag 66d, weit weg nicht im Boden-Bild |
| tests/bogenbruecken.test.js | 150/151: Bogenhöhe, Steg ins Meer flach, Öffnungen, Boote, 16 Felder, Meer-Lücke, breit, Nord-Süd ohne Löcher |
| tests/uebergang.test.js | Übergang, Fußgängerbrücke umschaltbar und gespeichert, Design mit Erstattung, **alt `footPaid: true` = Holz**, Breite, Bewohner auf dem Bogen, Abriss, Zeichnen |
| tests/baenke-fussbruecke.test.js | Block 148: Deck so breit wie der Weg, Rampen massiv |
| tests/schiffe-bruecken.test.js | Schiffe unter und neben Brücken, Seewege |
| tests/gleisrampe-kritik.test.js:60-86 | `foot` auf Anhöhen (`archHillError`), getragener Übergang mit `foot` |
| tests/neuwelt.test.js:15-25 | testsave-neu: **> 70 Kacheln mit `t.bridge`**, Bogen-Arten mit `brk` |
| tests/bahn.test.js:42-100 | Schienenbrücke übers Wasser samt `claimed`; `load()` behält `bridge` |
| tests/planen.test.js:107-121 | Schienen-Linie ins Meer wird Brücke |
| tests/kopieren.test.js:146 | `copyTileCost` mit `footPaid: 'stein'` |
| tests/monkey.test.js | 2500 Zufallszüge; **Kreislauf `serialize` → `parseSave` muss `tiles` gleich lassen** (Zeile ~73); keine Überlappung, Lager ≥ 0. Eine Migration, die beim Laden Kacheln umschreibt, muss wiederholbar sein und darf neu Gebautes nicht ändern |
| tests/save.test.js | Export/Import gleich, kaputte Dateien abgelehnt, unlesbarer Stand bleibt |
| tests/undo.test.js | ↶ allgemein (Verschieben ein Schritt, „geht nicht mehr“, höchstens 20, Löschen-Knopf) |
| tests/gruppe-drehen.test.js | Gruppe drehen (Rasen, Linien, viermal = Original) |
| tests/cloud.test.js | `cloudDecide`-Tabelle, Änderungen ohne ↶ werden erkannt (166, nur `SIG_KEYS`!), Sicherungen |
| tests/live.test.js | `liveSplit`/`liveJoin` hin und zurück (33), Feld für Feld (53), Besuch ohne Privates (71), Dächer im „rest“ (81, Vorbild für Brücken) |
| tests/menu.test.js | jedes Ding in genau einer Gruppe, höchstens 10 je Filter |
| tests/huegeltreppe-regeln.test.js:18, tests/gleisrampe.test.js:24, tests/anhoehe-treppe.test.js:29 | Gruppe Anhöhen fest `['anhoehe', 'huegeltreppe', 'bruecke']` |
| tests/schnellwahl.test.js:28 | `DRAG_KATS` Wege = `['weg*', 'bruecke']` |
| tests/zuletzt.test.js:17-18 | `noteRecent('bruecke')` |
| tests/neu.test.js:51 | **jedes ITEMS-Ding mit `cat` braucht `ITEM_TIPS`** (neue Brücken-Items!) |
| tests/news.test.js | NEWS: ids eindeutig, Aufbau |
| tests/leistung-je-ding.test.js + .json | `"bruecke Form 0": 0, "bruecke Form 1": 0` (Zeile 242-243). Neue Formen ergeben neue Schlüssel, also `npm run leistung:neu` mit Begründung in AUFGABEN.md |
| tests/leistung.test.js | Welten gross, freizeitpark, farben, **neu** (80 Brückenfelder), dach. Ändert sich das Bild der Wasserbrücken, verschieben sich die Zahlen |
| tests/webgl.test.js:38 | Wegbrücke im GL |
| tests/design.test.js, tests/freischalten.test.js | Kunstakademie und Freischalt-Sprünge (bekommen Brücken `design`, werden sie getroffen) |

---

## 10. Risiken für den Umbau (nach Schwere) und was ich empfehle

1. **Datenverlust und Abstürze bei alten Versionen und Freunden.**
   - In `brk` und `footPaid` nur die alten Werte schreiben (holz/stein/ziegel/rot bzw. holz/stein/weg/kristall). Material, Farbe, Licht und Zacken kommen in **neue** Felder; `tileOut` ergänzen.
   - Für Ziegel und Rot einen alten Wert als Rückfall weiter schreiben, damit ältere Versionen etwas Gültiges sehen.
   - Keine neuen Kachel-Arten (`b`) für Brücken: alte Versionen löschen sie.
2. **Wasserbrücken bleiben Kacheln** mit `t.bridge`. Kein Umzug nach `state.bruecken` (Verlust bei alten Versionen, GL-Leistung, Tests neuwelt/monkey/bahn/bruecken/bogenbruecken).
3. **„Gleich aussehen“ ist mit Farbe allein nicht genau zu haben.**
   - Ziegel = Stein + `BRIDGE_COLS[8]` (`#b5654a` ist genau die Seitenfarbe von Ziegel), aber Ziegel malt das Muster `'bricks'` statt `'tiles'` (draw-objects.js:995, 1070).
   - Rot hat `lift 8` statt 3 und eigene Deck- und Plankentöne (draw-objects.js:953-957). Flache Brücken (1 Feld, offenes Ende) sähen mit Holz + Farbe anders aus.
   - Ein Ausweg: Ziegel und Rot bleiben als versteckte Altformen zum Zeichnen erhalten, werden aber nicht mehr angeboten.
4. **Erstatten nach bezahltem Preis.** Neue Preise für Material, Licht und Kristall ab jetzt als `price` an Kachel bzw. Brücke merken. Alte Brücken ohne `price` nach der **alten** Tabelle erstatten (Vorbild Regel 73: ohne `t.price` nur nach `baseCost`). Wenn `bkCost`, `WEG_BRIDGE` oder `FOOT_STYLES` sich ändern, darf die Erstattung alter Brücken nicht mitsteigen.
5. **`BK_MAX` 4 → 8.** Auch alte lokale Versionen (WLAN-iPad) verwerfen dann Brücken mit 5 bis 8 Feldern. Dazu: `bkError`-Text (bruecken.js:117), `ITEMS.bruecke.desc` und `ITEM_TIPS` („1 bis 4“, data.js:206/782).
6. **Freischalten über Inseln.**
   - `lookOk` erweitern (z. B. `lm` an der Form, über `unlockOk`), statt die Prüfung über `BK_ARTEN.tech` an mehreren Stellen zu verteilen.
   - `lookChips`-Text, `lmUnlockNames`, `unlockKeys`, `ITEM_TIPS` und `unlockSig` mitziehen.
   - Für alte Stände `legacy` vergeben, wenn Material schon verbaut ist.
   - Den Index in `DECO_LOOKS.bruecke.forms` nicht umsortieren (`paintNew.bruecke.form`). „Stahl“ (Index 1) kann zu „Metall“ werden; Stein und Kristall hinten anhängen.
7. **Fußgängerbrücke (Bogen) über Wasser vs. Wasserbrücke heute.** Heute ist eine Wegbrücke übers Wasser je nach Länge flach oder ein Bogen (`bridgeArch`), Holz und Rot auf Pfählen. Soll „Fußgänger = immer Bogen“ auch für 1 Feld gelten (kleiner Buckel, AUFGABEN 160c), ändern sich ↶-Regel (actions.js:1175), Boote (`archBoatOk`), Fische, Bewohner-Höhe (`wegBridgeLift`) und `bkPlaceError` (Wasserbrücke unter dem Deck).
8. **Neue Schalter laufen über `undoable` und zählen `groundVersion` hoch.** Sonst gibt es kein ↶, keine Cloud (siehe `SIG_KEYS`) und veraltete `bkFresh`-/Bildchen-Fassungen. Dabei die Übergangs-Knöpfe (ui.js:2061-2062) gleich mit in `undoable` nehmen.
9. **`paintNew` für neue Wahl-Schlüssel** (Licht, Zacken, Belag für neue Brücken) wird von `parseSave` verworfen (state.js:312-313). Entweder die Liste erweitern oder in `form`/`col` kodieren.
10. **Plan:** Brücke beim Linienzug erzeugen und den Schlüssel von `planInfo` erweitern (Abschnitt 5). Bauen und Deck legen in **einem** Plan, damit es ein ↶-Schritt bleibt (`runPlan` läuft schon im `undoable` von `tap`).
11. **Gruppe/Kopie:** entscheiden, ob Brücken mitziehen. Falls ja, die neue Art in der Gruppe vollständig verdrahten (Regel 117). Falls nein, dem Spieler im Hinweis sagen, dass sie stehen bleiben. Die mehrfeldige Wegbrücke in der Gruppe scheitert vermutlich schon heute (Punkt 0.12, als Test anlegen).
12. **Tests mit genauem JSON** (`bruecke.test.js:24`, `bruecke-gleis.test.js:107-113`) schlagen bei neuen Standardfeldern fehl. Neue Felder nur schreiben, wenn sie vom Standard abweichen (wie `weg`/`gleis` in state.js:149-150). Das spart auch Platz im Spiegel.
13. **Leistungs-Wächter:** neue Formen ergeben neue Schlüssel in `leistung-je-ding.json`; das Bild der Wasserbrücken ändert die Zahlen in den Welten neu und freizeitpark. Nach Regel 149 begründen, nicht einfach hochsetzen.
14. **Push:** 157 und 160 gehen gemeinsam online. Dann braucht `NEWS_HISTORY` einen Eintrag, und alte Einträge über Ziegel und Rot werden angepasst.