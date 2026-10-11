# Lückenprüfung 160c (Brücken): was die sechs Berichte auslassen oder falsch beschreiben

Ich habe nur gelesen und gegrept, also keine Tests, kein npm, keinen Browser gestartet und nichts geändert. Stand ist `HEAD a4806ef`, 65 Commits vor `origin/main b27986e` (v951). Der Querschnitt-Bericht nennt noch 950defa und „64 Commits“.

„BESTÄTIGT“ heißt: aus dem Code eindeutig abgeleitet. „PLAUSIBEL“ heißt: aus dem Code abgeleitet, aber nicht ausprobiert.

---

## A. Fehler und Ungenauigkeiten in den Berichten

**A1. Die neueste Nutzerentscheidung fehlt in allen sechs Berichten.**
- Commit a4806ef, AUFGABEN.md:2718–2719, sagt: „Alte Brücken bekommen die neuen Modelle … jede alte Wasser-, Gleis- und Übergangsbrücke wird zum passenden neuen Modell, Material und Farbe so nah wie möglich am alten.“
- Dadurch sind diese Punkte überholt:
  - wegbruecke 6D/E: „gleich aussehen geht nicht nur über Farbe“
  - gleisbruecke 15.4: „bleibt das alte Bild als Holz-Variante?“
  - fussgaenger R3/R4 und Frage 14.1
  - licht 2.3/7: „pixelgleich nur mit Zusatzpaletten“
- Die Empfehlung im Querschnitt 10.3, Ziegel und Rot als versteckte Altformen zu behalten, widerspricht der Entscheidung sogar.
- Pixelgleich muss es nicht mehr sein. Die eigentliche Aufgabe ist jetzt eine Zuordnungstabelle: alte Art/Farbe → Material + `brc`.
- AUFGABEN.md widerspricht sich selbst und sollte bereinigt werden:
  - 2702–2703 „alte Stände wandeln so um, dass sie gleich aussehen“
  - 2720–2721 „Offen: … Umwandeln alter Stände ohne Änderung im Aussehen“
  - 2704 „Brücken-Werkzeug bleibt“ gegen 2720–2721 „Offen: … per Linie statt eigenem Brücken-Werkzeug“
  - 2705 „Bahn (B1–B3) offen“ gegen 2709–2713 „abgenommen … Kristall B2“
  - 2696 „ob mehr [als 4 Felder], ist offen“ gegen 2704 „Zwischen Anhöhen bis 8 Felder“
- Anhöhen-Brücken (160a/b, nur lokal) nennt a4806ef nicht. anhoehen-R5 (Holzsteg mit Weg wird zum Bogen?) bleibt also wirklich offen.

**A2. fussgaenger §10 stimmt so nicht.** Dort steht, Freundes-Inseln, Besuche und Cloud liefen alle über `parseSave`.
- Nur der erste Empfang bzw. eine geänderte `rest` läuft über `liveAdopt → parseSave` (live.js:104–108, 133–136).
- Spätere Feldänderungen laufen roh: `state.tiles.set(k, JSON.parse(v))` in `liveApplyMaps` (live.js:110–128).
- Die anderen Berichte beschreiben das richtig. Neue Kachelfelder müssen also beim Lesen einen Rückfallwert haben, nicht nur in `parseSave`.

**A3. anhoehen §9.3 Punkt 7 und R10 sind falsch.** Dort heißt es, `bkDrawTile` gebe `H` nicht weiter.
- `bkDrawTile` reicht `H` durch: `after: after ? H => after(H) : null` (bruecken.js:392).
- Der Rückruf in render.js:2182 ignoriert den Parameter, weil die Figuren ihre Höhe aus `w.up` bzw. `car.deck` haben.
- `bkPaint` hat außerdem schon `opts.h` (bruecken.js:346, genutzt von `drawBkIcon`). Das ist eine feste Zahl. Für ein Höhenprofil braucht es eine Funktion `h(t)`.

**A4. wegbruecke K nennt `arch*` als „dreifach belegt“. Tatsächlich sind es deutlich mehr Namen:**
- Torbögen: `ARCHES`, `archLabel` (data.js:1024/1029), `setArch` (rules.js:1343), Feld `e.arch`
- `drawGateArch` (draw-edges.js:331), `drawTorArch` (draw-objects.js:1514)
- `portalArch` (draw-ubahn.js:17)
- `viaductArches`, `bpArch` (hills.js:1564, 1855)
- ein lokales `archH` in draw-schmuck.js:296: kein globaler Konflikt, aber beim Grep verwirrend
- Dazu kommt `seebruecke` (data.js:154), ein Wunder-Steg. Ein Grep nach `bruecke` trifft es mit, zur Familie gehört es nicht.

**A5. Zwei Vermutungen sind beim Lesen bestätigt (BESTÄTIGT):**
- **Querschnitt 0.12 / wegbruecke M** (aufgenommene Wegbrücke mit mehreren Feldern lässt sich nicht ablegen):
  - `pickUpGroup` löscht die Kacheln beim Aufnehmen (actions.js:323).
  - `groupErrors` prüft jedes Feld über `placeError → bridgeShapeError`, ohne die übrigen Gruppenfelder hinzulegen (actions.js:470–478, rules.js:1962–1964).
  - Folge: Das mittlere Feld findet keinen Arm, und es kommt „Brücken wachsen vom Ufer aus“.
- **fussgaenger R12** (Geld aus dem Nichts beim Kopieren):
  - `copyClone` behält `footPaid` (actions.js:534, die Löschliste enthält es nicht).
  - `copyTileCost` berechnet das Design nur bei `t.foot` (actions.js:589).
  - `demolishInfo` erstattet `footPaid` auch bei Schranken (rules.js:3419).

**A6. wegbruecke §8 (`lauf`) ist bestätigt.**
- `tileOut` (state.js:66–112) schreibt `lauf` nicht.
- Block 158 ist nur lokal (`origin/main` kennt `wegLauf` nicht).
- Wegrichtungen gehen beim Speichern und im Live-Spiegel verloren.
- Das Deck einer Anhöhen-Brücke nutzt fest `lauf: ax` (bruecken.js:402). Wasserbrücken ignorieren `lauf` ganz (draw-objects.js:1013, `pattern` ohne `patRot`).

**A7. Kleinere Zeilenfehler** (sachlich richtig, nur verrutscht):

| Bericht sagt | Richtig |
|---|---|
| wegbruecke: actions.js:118 (`bridge`) | 119 |
| wegbruecke: smallError 1657 „Nicht auf dem Wasser“ | rules.js:1660 |
| gleisbruecke: smallError 1662 | rules.js:1660 |
| gleisbruecke: state.js:342 | 344 |
| wegbruecke: live.js:109–124 | 110–128 |

Dazu sind die Kommentare in state.js:85–87 verrutscht: Bei `brw` steht „Wegbrücke: Art“, `brk` hat keinen Kommentar.

**A8. Ergänzung zu gleisbruecke §3 (`fullValue`).** `fullValue` (rules.js:3065–3071) kennt außer der Wegbrücke auch den **Bahnübergang** nicht. Weg (5 Taler) und `footPaid` fehlen bei Rathaus- und Hafen-Wachstum.

---

## B. Stellen, die in keinem Bericht vorkommen

### B1. Schiffe und Natur unter einer Anhöhen-Brücke über Wasser (PLAUSIBEL, wichtig für Stützen und Pfeiler auf den Kachelkanten)
- Unter dem Deck darf Wasser liegen: `bkUnderError` prüft nur Dinge auf dem Feld (bruecken.js:50–66), `bkPlaceError` lässt `graben` zu (bruecken.js:77).
- Ein Holzbock auf einem leeren Wasserfeld ist erlaubt. `bock` wird nur geprüft, wenn dort ein Feldobjekt `t` liegt (bruecken.js:60–61).
- `seaCross` (rules.js:2555–2568) kennt nur `state.tiles`. Schiffe fahren deshalb längs, quer und durch Böcke bzw. künftige Pfeiler hindurch.
- `seaBridgesCheck` (rules.js:2578–2582) nimmt `state.bruecken` nicht in die Kennung auf. Der Seeweg-Speicher würde also auch nach einer Erweiterung nicht geleert.
- Masten über `BK_CLEAR` würden durchs Deck ragen: Das Deck wird nach dem Boot in tileB gemalt (render.js:2176).
- `natureAt` (movers.js:1088) zählt als bebaut nur `state.tiles`/`COVER`. Fische springen dort durchs Deck.

### B2. Lichtraum unter den neuen Modellen zwischen Anhöhen
- `BK_CLEAR = HILL_H − 6` ist fest (bruecken.js:16) und gilt in `bkUnderError`, `bkTooTall` und `smallError` (rules.js:1656/1680).
- Holz-Bogenträger unter dem Belag und Stein-Pfeilerbögen (Stufe 3: Ansatz am Pfeiler 13, Bogen über zwei Felder) senken den Lichtraum. Er hängt dann von der Stelle ab.
- Betroffen sind hohe Deko, Züge unten quer (Zughöhe 13) und Linien bzw. Torbögen. Eine Prüfung wie `ARCH_CLEAR` beim Übergang (draw-objects.js:752, 845) gibt es dafür nicht.

### B3. Anhöhe neben dem Ende einer Wasserbrücke (PLAUSIBEL)
- `hillRaiseError` (hills.js:88–112) prüft keine Wasserbrücke am Nachbarfeld. Für Übergänge gibt es dagegen `archAround`.
- `bridgeArchCalc` (rules.js:1897–1898) zählt jedes Nicht-Wasser als Ufer, unabhängig von `hillLevel`.
- Folge: Der Bogen endet auf Höhe 0 an der Wand der neuen Anhöhe. `armsWith` verliert den Arm (`wegLink`, rules.js:1939), die Brücke hängt dann nicht mehr am Wegenetz bzw. Viertel.
- Bei „Fußgänger immer Bogen“ betrifft das jede Wasserbrücke.

### B4. Strom: Laternen bekommen ihn zuerst
- `computePower` bedient Laternen und Linienlichter vor allen `CONSUMERS` und vor den Zügen (rules.js:2789–2805).
- Brückenlicht mit Strombedarf zieht also Strom von Betrieben und Linien ab.
- Bekommen alte Brücken beim Umwandeln „Licht an“, können in bestehenden Welten Züge stehen bleiben.
- Wo die Brückenlampen in die sortierte Liste kommen, entscheidet, welche **vorhandenen** Laternen dunkel werden (`dark` nach Listenposition, 2794).
- Halbe Schönheit ohne Strom (`NO_POWER`, 766/768) gilt bisher nur für Deko und Dach-Deko.

### B5. Der Name „Laterne“ ist schon doppelt belegt
- `lanterns` ist der Spielfortschritt: `LANTERN_TOTAL` (data.js:880), `need.lanterns` der Inseln (data.js:888 ff.), `unlockOk` prüft `lanterns` (rules.js:841 ff.).
- `laterne` ist das Deko-Ding, dazu `LANTERN_COLS` (data.js:1130).
- Ein neues Feld für Brückenlicht sollte deshalb nicht `lantern*` heißen.

### B6. „Alle verbundenen umfärben“ lässt das Deck aus
- `wegNetwork` und `wegNetworkHills` (rules.js:2015/2030) und damit `restyleWeg` (2047) gehen nicht über das Deck einer Anhöhen-Brücke (kein `bkArmFrom`/`bkLinks`).
- „Gleise umstellen“ nimmt das Deck dagegen mit (`restyleRails`, rules.js:2252–2255). Das ist ungleich.
- Das Album zählt den Belag von Wasserbrücken und Übergängen (`t.style`, story.js:600), aber nicht den Belag auf Decks. Wandert der Brückenbelag in ein neues Feld, muss das Album mit.

### B7. Belag oder Brückenmuster ist heute je Ort verschieden (wichtig fürs Umwandeln)
- **Holz und Rot übers Wasser** zeigen immer Planken (draw-objects.js:1020–1025). `t.style` ist dort unsichtbar und bestimmt nur die Art. Das Fenster bietet einen Belag nur bei Mauerbrücken an (ui.js:1931–1932).
- **Holzsteg zwischen Anhöhen** zeigt den Belag auf den Bohlen (`wegPaint` nach `top`, bruecken.js:375–378).
- Beim Umwandeln brauchen alte Holz-Wasserbrücken also „Muster der Brücke“, alte Stein- und Ziegelbrücken „Belag = `t.style`“ und Anhöhen-Holz „Belag“.

### B8. Übergang-Knöpfe ohne Sperre für Zuschauer und Besucher
- `data-cross` und `data-foot` rufen `setCrossing` direkt auf (ui.js:2061–2062).
- `undoable` würde `viewOnly()` sperren (actions.js:1121). Zuschauende Geräte und Besucher können das Design also lokal umschalten.
- Das ist ein weiterer Grund, die Knöpfe in `undoable` zu legen (Ergänzung zu fussgaenger R13 und Querschnitt 10.8).

### B9. Linien an der Fußgängerbrücke (PLAUSIBEL)
- `edgeError` (rules.js:1316–1326) kennt `archAround` nicht.
- Ein Zaun oder Gartentor auf der Kante zwischen Übergang und Wegnachbar steht mitten in der Rampe (`archH(0,5)` ≈ 14 px).
- fussgaenger R11 nennt nur Deko und Dächer.

### B10. Vorschau, Hinweis, Minikarte
- Der Hinweis „Weg über Wasser“ zeigt nur den Belagnamen, weder Brückenart noch Preis (render.js:1762). Bei der Schiene steht dagegen „Brücke …“ (1763).
- Der Geist eines Wegs auf Wasser wird ohne `bridge` gezeichnet, als normaler Weg (render.js:2119). Der Gleis-Bericht nennt das nur für Schienen.
- Die Minikarte (minimap.js:16–30) zeigt Anhöhen-Brücken gar nicht.

### B11. Verwandte Stein-Zeichnungen, die keiner nennt
- Gleis-Rampe „Viadukt D“: `GR_STONE` „hell wie die Steinbogenbrücke“ (hills.js:1034), `paintViaduct`/`viaductArches` (hills.js:1573/1564), `bpArch` (hills.js:1855).
- Die neue „Bahn Stein, flacher Viadukt“ sollte dazu farblich passen und vermutlich an eine Viadukt-Rampe anschließen.
- Vorbild für die abgenommene Stein-Balustrade: Arkaden-Brüstung „Balustrade mit Säulchen“ (`ROOF_PAR`, roofs.js:38, 211–212, 346).

### B12. Die abgenommenen Entwürfe decken vieles nicht ab
- tools/brueckenfamilie-entwurf.js:2 und brueckenlicht-entwurf.js:4: „über das fertige Spielbild gemalt“.
- Nur Ost-West (y fest, `lauf: 0`, Zeilen 10–30 bzw. 44–56), nur 4 Felder Lücke, nur zwischen Anhöhen.
- Nicht entworfen sind:
  - Maler-Reihenfolge und Verdecken
  - Nord-Süd
  - übers Wasser, mit Booten
  - über einem Gleis (Übergang)
  - 1, 2 und 8 Felder
  - breite Brücken
  - Kurven bei Gleisbrücken
- Nicht erwähnte ältere Werkzeuge: tools/huegelbruecke-entwurf.js, tools/bodenbogen.js.

### B13. Parallele Anhöhen-Brücken
- `bkError` prüft nur die eigenen Lückenfelder (bruecken.js:111–129). Zwei Brücken in Nachbarreihen sind erlaubt und zeigen zwei Geländer nebeneinander.
- Wasserbrücken werden in diesem Fall zu einer breiten Brücke mit Geländer nur außen (draw-objects.js:963–964, Block 151).

### B14. Speicherformat-Fallen
- `paintNew` behält nur Schlüssel, die ein `ITEMS`-Name sind, mit ganzzahligen Werten ≥ 0 für `PAINT_KEYS`/`col`/`form` (state.js:312–313). Ein Schlüssel wie `bruecke_licht` fiele weg.
- `tileOut` schreibt `col`/`form` nur, wenn sie wahr sind (state.js:70–71). Index 0 muss deshalb der Standard sein. Neue Felder, bei denen 0 etwas bedeutet, brauchen `!= null`.
- Der Deck-Belag `b.weg` wird über `isWegStyle` gefiltert (state.js:364). Alte Stil-IDs werden zu `null`, nicht über `WEG_TO` umgestellt wie bei Kacheln (state.js:223).

### B15. Kopie und bezahlter Preis
- `copyClone` behält `t.price` (actions.js:534). `copyTileCost` verlangt aber den heutigen Preis (Kommentar actions.js:584–585).
- Bekommen Brücken einen gespeicherten Preis (Querschnitt 9, fussgaenger R2), muss die Kopie ihn auf den bezahlten Kopierpreis setzen. Sonst stimmt das Erstatten nicht.

### B16. Optionen, die die Durchfahrt ändern
- Ändert eine Option, wo Boote durchkommen (Stützen „keine/wenige/jede Kante“ übers Wasser, Pfeiler), braucht ihr Setzer `recalc`, denn nur dort läuft `seaBridgesCheck` (rules.js:829).
- `groundVersion++` allein reicht nicht. `setBridgeColor` macht heute nur das (rules.js:2073–2076).

### B17. Freischalten geschieht schon heute über das Material
- Bretter ab Sägewerk `baum:1`, Quader ab `klippe:1`, Metall ab `erzberg:2`, Kristall ab `kristall:1` (data.js:68–74).
- Die Holz-Fußgängerbrücke am Übergang braucht 2 Metall (rules.js:2263), also faktisch die Erzinsel Stufe 2.
- `BRIDGE` (Gleisbrücke) kostet `holz` (Rohholz), `WEG_BRIDGE` Bretter. Die Materialien sind nicht einheitlich.

### B18. Figuren auf dem Bogen am Übergang
- `archWalkers` werden über `moverLive(m, z, now, true)` mit `drawWalker` gezeichnet, auch Anhöhen-Spaziergänger (`m.hillw` gehört sonst zu `drawHillWalker`, render.js:2149, 899–900).
- Das ergänzt fussgaenger 6(a)/(b).

### B19. Veraltete Texte und Kommentare
- data.js:1161: „Brücken bleiben Holzbrücken“.
- `openBkInfo` sowie `ITEMS.bruecke`/`ITEM_TIPS.bruecke`: „1 bis 4“, „Holz oder Stahl“ (data.js:206/782). Die Berichte nennen das teilweise.

### B20. Testlücken, die keiner nennt
Es gibt keinen Test für:
- Schiffe bzw. Fische unter einer Anhöhen-Brücke über Wasser
- eine Anhöhe neben dem Ende einer Wasserbrücke
- Übergang-Knöpfe im Zuschau-Modus
- Linien an der Rampe der Fußgängerbrücke
- „alle verbundenen umfärben“ über ein Deck

Die einzige Datei mit Anhöhen-Brücken bleibt tools/vorschau/brueckenschau.json. Kein `testsave-*.json` enthält `bruecken`.

---

## C. Offene Entscheidungen

Mit **neu** markiert sind Punkte, die kein Bericht stellt.

1. **Modell je Ort und Material.** AUFGABEN.md:2703–2704 nennt als „neu zu zeichnen“ nur Fußgänger Metall/Kristall sowie Bahn flach Stein/Kristall/Metall übers Wasser. Daraus ergeben sich drei Fragen:
   - Bleiben Fußgänger Holz/Stein **übers Wasser** die Bogenbrücken aus Block 150? Dort steht „3, 6, 16 perfekt, nicht mehr anrühren“, AUFGABEN.md:2173. Oder kommt das Pfeiler-Modell Stufe 3 samt neuer Boots-Durchfahrt (`archBoatOk`)?
   - Bleibt Bahn Holz übers Wasser der heutige Holzsteg?
   - Welche vier Modelle bekommt der **Übergang**? Dafür ist nichts aufgeführt und nichts entworfen. **neu**
2. **Anhöhen-Brücken beim Umwandeln** (fehlen in a4806ef): Wird der Holzsteg mit Weg zum Fußgänger-Bogen? Welche Familie hat eine leere Brücke? Und welche Familie baut das Brücken-Werkzeug ohne Weg oder Gleis?
3. **Wo wählt man Material, Licht, Farbe, Zacken und Stützen für eine Brücke, die beim Ziehen mit Weg oder Gleis entsteht?** In der Leiste von Weg/Schiene oder über `paintNew.bruecke`? Der Schlüssel von `planInfo` (plan.js:285) kennt bisher nur `decoLookNew(p.tool)`. Ein Schlüssel in `paintNew` muss ein `ITEMS`-Name sein (B14).
4. **Licht und Strom:**
   - Braucht es Strom?
   - Wenn ja: in welchem Rang gegenüber Betrieben und Zügen (B4)?
   - Zählt es je Brücke wie eine Linie (`'E'+k`) oder je Lampe?
   - Gibt es dafür Schönheit?
   - Bekommen umgewandelte alte Brücken Licht? Alter Kristall-Übergang leuchtet heute schon, ohne Strom (draw-objects.js:841).
5. **Kosten der Optionen:**
   - Licht je Brücke oder je Feld?
   - Aufpreis beim Verlängern (actions.js:155–158 übernimmt heute nur `brc`/`brw`/`brk`)?
   - „Licht aus“: Erstattung oder „bezahlt bleibt bezahlt“ wie `footPaid`, dann mit der Kopie-Lücke aus A5?
   - Kostet Farbe? Heute ist sie kostenlos. **neu**
6. **„Fürstlich“ für Kristall:** als Baupreis je Feld, als Freischaltung in der Kunstakademie (`designPrice`) oder einkommensabhängig mit `t.price` (B15)? Der Nutzer will Geld und Fortschritt später besprechen, also bis dahin vorläufige Werte. Der bezahlte Preis sollte gespeichert werden (R2).
7. **Freischaltung:**
   - Wahrzeichen-Stufe (`lm`), „Insel entdeckt“ oder nur das Material (B17)?
   - Metall ist heute über die Forschung `bahn` gesperrt (bruecken.js:13).
   - `ITEMS.bruecke` braucht `terraform`, Wasserbrücken brauchen keine Forschung. **neu**
8. **Laternenfarbe:** Färbt nur das Gehäuse mit? Licht gibt es nur in zwei Tönen, warm und `'blue'` (licht 1.2). Bleibt der Kristall-Streifen dann immer blau, auch bei eingefärbtem Kristall? **neu**
9. **Zacken** auch für Bahn-Kristall B2? Zacken übers Wasser und am Übergang (GL- und Bildchen-Rahmen)?
10. **Stützen-Option** (keine/wenige/jede Kante): Gibt es sie auch übers Wasser, mit Wirkung auf die Schiffe (B1, B16)? Und für Bahn Holz?
11. **1 Feld:** „kleiner Buckel“ (AUFGABEN.md:2720) auch übers Wasser? Block 150 sagt „flach“. Was wird aus einem Steg ins Meer (offenes Ende) bei „Fußgänger immer Bogen“?
12. **Breite Brücken** (2 bis 4 Reihen, Block 151) in den neuen Modellen? Werden parallele Anhöhen-Brücken zusammengefasst (B13)? **neu**
13. **Abriss:** Bleibt der Abriss übers Wasser feldweise? Fällt ein Feld in der Mitte weg, werden aus einem Bogen zwei flache Stege. Oder kommt künftig die ganze Brücke weg wie zwischen Anhöhen?
14. **Bewohner:** Über Wasserbrücken laufen sie, über Anhöhen-Brücken nicht (`hillWalkRegions`). Soll das in einer Familie gleich werden?
15. **Gleisbrücken mit Kurven, Abzweigen und 99 Feldern am Stück** (Testwelten og, bauland): Welches Modell bekommen Kurven? Gilt eine neue Formregel nur für Neubauten?
16. **Schiffe unter Anhöhen-Brücken über Wasser:** Durchlassen wie heute, Durchfahrt nach Stützen regeln oder dort gar keine Brücke erlauben (B1)? **neu**
17. **„Wie der Weg“ am Übergang** wird zu welchem Material? Und wird der Belag ein eigenes Feld (fussgaenger R20) oder bleibt er an `t.style`, das auch „alle verbundenen umfärben“ und das Album anfassen (B6)?
18. **`BK_MAX` 4 → 8** ist zugleich die Lesegrenze alter lokaler Versionen (WLAN-iPad). Da `state.bruecken` noch nicht online ist, ist das Format frei. Lokal gehen 5 bis 8 Felder in alten Versionen verloren. Soll `bruecken` in `SIG_KEYS` der Cloud (cloud.js:63)?