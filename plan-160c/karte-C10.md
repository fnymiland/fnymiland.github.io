**Baukarte C10: Schiffe und Fische unter Anhöhen-Brücken**

Gegengeprüft an HEAD 89e6126, nur gelesen. Aufwand: Normal.

## 0. Was heute passiert

**Wasser unter einer Anhöhen-Brücke ist erlaubt, auch schon in v1016.**
- `bkUnderError` prüft kein Wasser (bruecken.js:117).
- `bkPlaceError` lässt `graben` zu (bruecken.js:151).
- Böcke reichen bis auf die Wasserfläche (bruecken.js:571).
- Weg oder Schiene auf Wasser unter dem Deck wird abgelehnt (bruecken.js:125, 149). Unter einem Brückenfeld liegt also nie eine Wasserbrücken-Kachel.

**Fehler, mit Beleg:**
- **`seaCross` kennt nur Kacheln** (rules.js:2558–2559). Unter einer Anhöhen-Brücke gibt es deshalb `null` zurück. Die Folgen:
  - `seaStep` (rules.js:2572–2574) erlaubt längs, schräg und durch die Kanten mit Böcken oder Pfeilern.
  - `seaSight` (rules.js:2614) kürzt schräg unter dem Deck ab.
  - Die Fischkutter kreisen unter der Brücke (`open()`, rules.js:2668; movers.js:1024).
  - Das ist die bekannte Lücke aus plan-160c/C3.md:590: „Boote fahren sichtbar durch Pfeiler“.
- **`seaBridgesCheck` (rules.js:2581, nicht 2578) zählt nur Kacheln** (rules.js:2583). Wird eine Brücke gebaut oder abgerissen, bleibt der Seeweg-Speicher deshalb alt.
- **`natureAt`: `built` (movers.js:1089) kennt nur `tiles` und `COVER`.** Fisch, Robbe, Frosch, Eisvogel und Goldfisch erscheinen unter und neben dem Deck. Die Möwe wird vor `if (built) return` eingetragen (movers.js:1093–1094). Sie kreist in Höhe 27–33 mit Radius 1,4 (movers.js:1153). Das Deck liegt bei 26, das Geländer reicht bis etwa 34.
- **Zeichnen ist schon richtig.** Ein Boot auf einem Brückenfeld landet in `late` (render.js:2182) und gilt immer als `'U'` (brueckenbild.js:206). Danach werden `vd`, Deck und `o` darübergemalt (brueckenbild.js:245–260).

**Widersprüche zwischen den Berichten, im Code geprüft:**

| Punkt | Ergebnis |
|---|---|
| Zeilen | `seaBridgesCheck` steht bei rules.js:2581, `built` bei movers.js:1089, die Möwe bei 1093. |
| Lichtraum | Am niedrigsten ist das Stein-Viadukt in der Feldmitte. Die inneren Bögen haben sa = sc = 13 und rise = 26 − 7,5 − 13 = 5,5. Daraus folgen ri ≈ 18,5 und `brClear` = 17,5, dazu kommen 6,3 Wassertiefe. Jedes Feld passt (Maßstab 9). Die Prüfung `bkBoatOk` aus Bericht see wäre toter Code und **entfällt**. |
| `typeof bkOn` | Nicht nötig. rules.js ruft `bkOn`/`bkAt` schon ohne Prüfung auf (rules.js:2193, 2810 in `totals`, also im selben `recalc`). |
| `brSet` + `recalc` | Bei „nur quer“ hängt die Durchfahrt nicht von Material oder Stützen ab. bruecken.js:347 bleibt deshalb unverändert. PLAN §1.4 Nr. 4 („wenn sich die Durchfahrt ändert“) ist erfüllt, luecken B16 ist hier gegenstandslos. |
| Signatur | Drei Vorschläge, ich nehme den genauen Spiegel von `seaCross`: jedes Wasserfeld unter einer Brücke mit seiner Richtung (wie die Kachelzeile 2583). |
| render.js:1869 | Ist Pflicht, sobald `seaCross` `bkAt` kennt. Sonst geht ein Brückenfeld in `m.under` ein. Dann kehrt `drawBridgeOver` leer zurück (render.js:921), unter GL entsteht trotzdem ein `glLive` (render.js:2188), und Figuren daneben werden ohne Anhebung noch einmal obenauf gezeichnet (render.js:2190–2192). Lösung: `!bkAt`. |

**Ist C10 nötig?** Ja, die Fehler sind sichtbar, sobald unter einer Anhöhen-Brücke Wasser liegt.

**Kleinster sinnvoller Umfang:** 4 Stellen mit je 1–3 Zeilen, dazu die Möwe als eine Zeile, falls du zustimmst (Frage 1).
- Keine Lichtraum-Regel, kein `brSet`, keine Änderung an `bkMoverClass`.
- Keine Migration, keine `SIG_KEYS`.

## 1. Verhalten (Spielersicht)

- Schiffe fahren unter einer Anhöhen-Brücke nur quer, gerade durch die Feldmitte. Längs, schräg und durch Böcke oder Pfeiler fahren sie nicht mehr, denn die Stützen stehen nur auf Kanten längs der Brücke.
- Das gilt für alle Materialien und für Fußgänger- wie Bahnbrücken. Kein Boot wird wegen der Höhe gesperrt. Ein hoher Mast verschwindet hinter dem Deck, wie bei den Bogenbrücken.
- Fischkutter kreisen nicht mehr unter oder neben der Brücke, ihr Fanggebiet rückt weg.
- Unter und direkt neben einer Brücke über Wasser springen keine Fische, Frösche oder Robben mehr. Das ist dieselbe Regel wie bei Wasserbrücken (Nutzer, 08.10.2026). Eine Brücke über Land ändert nichts.
- Selten: Ging ein Seeweg nur längs unter einer Brücke, gibt es ihn nicht mehr. Die Fähre zeigt dann „kein Seeweg“.

## 2. Änderungen in Bau-Reihenfolge

**1. rules.js:2555–2559: `seaCross`**
```js
// … 'block': Kurve, Kreuzung; null: keine Brücke. Anhöhen-Brücke (160c C10): ein Feld breit, Stützen/Pfeiler nur auf Kanten längs → nur quer
function seaCross(x, y) {
  const c = bkAt(x, y);                                     // Lichtraum Feldmitte ≥ 17,5 (Viadukt) + 6,3 Wasser: keine Sperre
  if (c) return isWater(x, y) ? (c.b.ax ? 'y' : 'x') : null;
  const t = state.tiles.get(x + ',' + y);
  …unverändert
```
- `bkAt` kommt zuerst. Kachel und `bkAt` zugleich lassen sich nicht bauen (bruecken.js:125, 149). Schiene auf Wasser bekommt immer `bridge` (actions.js:119).
- `seaStep`, `seaSight`, `fishingGround`, `nearestWater` und `seaSearch` bleiben unverändert. „Nie durch Stützenkanten“ folgt aus `along()`, weil jede Stützenkante zwischen zwei Brückenfeldern längs liegt.

**2. rules.js:2583, Zeile dahinter: Signatur**
```js
if (bkOn()) for (const [k, b] of state.bruecken) for (const [x, y] of bkCellsOf(k, b))
  if (isWater(x, y)) sig += 'B' + x + ',' + y + seaCross(x, y) + ';';   // Anhöhen-Brücken über Wasser (160c C10)
```
- Brücken über Land ändern den Speicher nicht.
- Wasser unter der Brücke graben oder zuschütten löst ohnehin `waterChanged` aus (actions.js:129, 140).

**3. render.js:1866–1870: Hilfsfunktion herausziehen (zum Testen) und `!bkAt` ergänzen**
```js
function boatUnder(m) {                                    // Kacheln (Block 107), über die drawBridgeOver nachmalt – Anhöhen-Brücken malt bkDrawMoving
  const under = [];
  for (let by = Math.floor(m.py) - 1; by <= Math.ceil(m.py) + 1; by++) for (let bx = Math.floor(m.px) - 1; bx <= Math.ceil(m.px) + 1; bx++)
    if (Math.abs(bx - m.px) < 0.8 && Math.abs(by - m.py) < 0.8 && bx + by >= m.px + m.py - 0.3 && seaCross(bx, by) && !bkAt(bx, by)) under.push(bx + ',' + by);
  return under.length ? under : null;
}
…
if (m.boat) m.under = boatUnder(m);
```

**4. movers.js:1089: `built`**
```js
… return terrainAt(x + dx, y + dy) === 'water' && (state.tiles.has(k) || COVER.has(k) || !!bkAt(x + dx, y + dy)); …   // auch Anhöhen-Brücken (160c C10)
```

**5. (nur bei Ja zu Frage 1) movers.js:1093: Möwe**
```js
const bkNah = bkOn() && [-2, -1, 0, 1, 2].some(dy => [-2, -1, 0, 1, 2].some(dx => bkAt(x + dx, y + dy)));   // kreist 1,4 weit in Höhe ~30 – flöge durchs Geländer
if (!night && !bkNah) out.push(['moewe', 0.06]);
```

**6. Abschluss**
- Die Kopfzeile rules.js:2555 ergänzt („… und Anhöhen-Brücken, 160c C10“).
- In der CLAUDE.md eine Regel: „`seaCross` kennt `bkAt`; macht man die Durchfahrt von Material oder Stützen abhängig, braucht `brSet` ein `recalc` (B16).“
- In AUFGABEN.md C10 abhaken, dann `npm run bump`.

## 3. Fallen

| Falle | Befund | Maßnahme |
|---|---|---|
| Seeweg nur längs unter der Brücke (L- oder Z-Form) | Ergibt `noSea` und 0 Plätze. Die Fähre fällt aus dem Verkehr (rules.js:656, 2691–2693). Die Expedition meldet „kein Seeweg“ (story.js:58). In v1016 ging das. | Sehr selten, hinnehmen. Das Fenster zeigt es (ui.js:2147). Test T8 hält es fest. |
| km und Route leicht anders | `km` hängt an `route.len`. | Hinnehmen. |
| Altversion v1016 | Die Regel gilt nur zur Laufzeit, es gibt kein neues Speicherfeld. v1016 zeigt weiter die freie Durchfahrt. | Keine Migration. bruecken-altversion.test.js ist nicht betroffen. |
| Speicher veraltet | Ohne Signatur bleiben `seaPath`, `exp:`, `out:` und `fish:` alt. | Schritt 2. |
| `bkFresh` veraltet in der Signatur | `seaBridgesCheck` läuft vor `groundVersion++` (rules.js:829). Alle Setzer erhöhen vorher (bruecken.js:250, 282, 347; actions.js:1226). Live überträgt keine `bruecken` (live.js:13). | Tests: erst `groundVersion++`, dann `recalc()`. |
| `brSet` ohne `recalc` (bruecken.js:347) | Bei „nur quer“ egal. | Erst nötig, wenn die Durchfahrt einmal vom Lichtraum oder von den Stützen abhängt. |
| Doppelzeichnen und leeres `glLive` | Siehe render.js:1869. | Schritt 3. Test T7 schützt ihn. |
| Mast und Flagge über dem Deck | Expeditionsboot 26–27, Freundesflagge 31, Deck 26. Das Deck wird danach gemalt und verdeckt sie. | Hinnehmen wie Block 150. Keine Sperre je Modell (der Speicher kennt das Modell nicht). |
| Boot immer `'U'` | Bei s zwischen −0,5 und −0,4 liegt der Mast kurz über dem hinteren Geländer. | Nicht ändern. Mit `'B'` würden hinterer Bock und Laibung über den Bug gemalt. |
| Fähren warten am Anleger seitlich ±1,1 (movers.js:970) | Sie prüfen keine Brücke. | Nur bei einem Anleger direkt an der Brücke. Hinnehmen. |
| Leistung | `seaCross`: eine Map-Abfrage mehr, nur wenn es Brücken gibt; die Ergebnisse sind gespeichert. Signatur: höchstens 8 Felder je Brücke je `recalc`. `natureAt`: 9 Abfragen je Versuch. | Unkritisch. |
| Testwelten | Keine Anhöhen-Brücke über Wasser (tools/brueckenwelt.js, Wasser bis x 47, Brücken ab x 50). | Welt nicht ändern (brueckenwelt.test.js erwartet 13). Eigene Szenen in den Tests. |

## 4. Tests zuerst

Neuer `describe` in tests/schiffe-bruecken.test.js:
```js
const fluss = (n, art = 'holz', extra = '', ax = 0) => game(`(() => {   // Fluss Nord-Süd x 14…13+n, Anhöhen beidseits, Brücke 14,12
  for (let y = 0; y <= 30; y++) for (let x = 0; x <= 40; x++) { const k = x + ',' + y; state.terra.set(k, x >= 14 && x < 14 + ${n} ? 'water' : 'grass');
    state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); }
  state.bruecken.clear();
  for (let y = 10; y <= 14; y++) for (let i = 0; i < 4; i++) { state.hills.set((10 + i) + ',' + y, { w: 0 }); state.hills.set((14 + ${n} + i) + ',' + y, { w: 0 }); }
  state.bruecken.set('14,12', { ax: 0, n: ${n}, art: '${art}'${extra} });
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const R = (s, g) => game(`seaSearch([${s}], (x, y) => x === ${g[0]} && y === ${g[1]}, [0, 0, 40, 30])`);
```

| Test | Inhalt | Heute |
|---|---|---|
| T1 | `seaCross(14..16, 12)` ergibt `['x','x','x']`. Eine Nord-Süd-Szene ergibt `'y'`. Über Land `null`. | rot |
| T2 | Für holz, stahl, stein und kristall bei n = 4: `seaStep(14,12,15,12)` samt Rückweg ist false, schräg `seaStep(14,11,15,12)` ist false, quer `seaStep(15,11,15,12)` ist true. Für jede Kante aus `bkSupports(c.b).map(e => bkEdgeCells(…))` ist `seaStep` in beiden Richtungen false. Fälle: Holz `bru:'jede'`, Holz mit `gleis`, Stein n 4, 5 und 7, Stein mit Gleis. | rot |
| T3 | `p = R([15,4],[15,20])`: genau ein Feld liegt unter der Brücke, davor und danach dasselbe x. `seaRoute(p)` in 0,05er-Schritten: wo \|py − 12\| ≤ 0,5 ist, gilt \|px − round(px)\| < 1e-6. Bei Stein: `c.G.stone.pierHit(…)` ist nie wahr. | rot |
| T4 | `seaCache.set('t',1); recalc()` lässt den Eintrag stehen. Brücke über Wasser bauen, `bkDemolishAt` und Rückgängig leeren ihn. Eine Brücke über Land lässt ihn stehen. `brSet({at:'anhoehe',k:'14,12'},{mat:'stein'})` ändert `seaCross` nicht. | rot (Bau) |
| T5 | Hafen in einem See mit Anhöhen-Brücke in der Nähe: im 7×7 um `fishingGround(k)` gibt es kein `bkAt`. | rot |
| T6 | Vorlage bogenbruecken.test.js:81, Szene `fluss(4,'stein')`: `natureAt` für (14..17,12), (15,11) und (16,13) enthält weder `fisch` noch `frosch`, für (15,20) aber `fisch`. Eine Brücke über Land neben einem Teich ändert nichts. Bei Ja zu Frage 1: keine `moewe` im Umkreis von 2. | rot |
| T7 | `boatUnder({boat:true, px:15, py:11.3})` enthält kein Brückenfeld. Zur Gegenprobe ergibt eine Wasserbrücken-Kachel weiter `under`. | grün, schützt Schritt 3 |
| T8 | L-Form: Wasser nur über (14,12) und dann längs bis (16,12). `R` ergibt `null`. Hält die Verhaltensänderung fest. | rot |

## 5. Prüfbilder

- Neues Werkzeug tools/schiffbruecken-szene.js (Vorbild tools/brueckenpruefung.js `shot`):
  - Fluss 3 breit mit Brücken aus Holz („wenige“), Holz mit Gleis, Stein mit 4 Feldern, Stein-Viadukt, Stahl und Kristall.
  - `shipMovers = () => […]` als Stub, je ein Kutter und ein Expeditionsboot an der Querlage s = −0,7, −0,45, 0, +0,45 und +0,7.
  - Jeweils Tag und Nacht, mit GL an und aus.
- Vorher/nachher bei s = −0,7 mit einem Spaziergänger am Anhöhen-Ende: Er darf nicht unten an der Wand doppelt erscheinen.
- Im Spiel ansehen: Eine Fähre kreuzt die Brücke einmal gerade, Kutter kreisen abseits, unter der Brücke springt kein Fisch.

## 6. Fragen an dich

1. **Möwen nahe Anhöhen-Brücken?** Sie fliegen in Höhe ~30 durchs Geländer (Deck 26) und springen dabei zwischen „unter“ und „vor“ dem Deck.
   - **Empfehlung:** Im Umkreis von 2 Feldern erscheint keine Möwe (eine Zeile).
   - Alternative: Möwen über dem Deck eigens zeichnen (neue Klasse `'D'`). Das ist mehr Arbeit und Bildrisiko.
2. **Längs unter der Brücke: nie (A) oder zwischen Stützen (B)?**
   - **Empfehlung A:** Es ist dieselbe Regel wie bei Wasserbrücken (Block 107), Material- und Stützenwechsel brauchen nichts weiter. Selten fällt dabei ein Seeweg weg.
   - B hält mehr Wege offen. Dafür braucht es Stützen in der Signatur und ein `recalc` in `brSet` und `bkLayRail`, und Schiffe fahren dann sichtbar unter dem Deck entlang.
3. **Hohe Masten (Expeditionsboot, Freundesflagge) unter der Brücke durchlassen?**
   - **Empfehlung: ja.** Das Deck verdeckt den Mast, wie bei den Bogenbrücken. Eine Sperre würde Seewege kappen.

Dateien:
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/tests/schiffe-bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/luecken.md

---

## 7. Korrekturen aus der Gegenprüfung (2 Prüfer)

- Lichtraum am niedrigsten im Endfeld des Viadukts: ri(0) ≈ 18,0, brClear 17,0; Boote ab Höhe 0 gezeichnet (keine +6,3), Raddampfer-Schornstein bis ≈ 17 → knapp, keine Sperre.
- Boote zwischen BK_W und 0,5 (vor der Stirn) als F zeichnen: `if (m.boat) return s > BK_W ? "F" : "U"`.
- `nearestWater` (rules.js:2548): kein Anhöhen-Brückenfeld als Start/Ziel (sonst schräg durch die Stützenkante).
- Prüfbild mit breiten Rümpfen (Motorfähre 22z, Frachter 22z) bei s 0,2/0,4: Bug/Heck unter den Pfeilern – hinnehmen wie Block 150 oder entscheiden.
- T4: Rückgängig leert seaCache schon über waterChanged – nur Bau/Abriss prüfen die Signatur; brSet-Materialwechsel mit expect(true).
- T6 Möwe nur in einer Meer-Szene (isSea), nicht auf der Heimatinsel. T7 ist erst mit Schritt 3 grün.
- Zeilen: Möwe movers.js:1171, Kutter 1027–1028, drawBridgeOver-return render.js:923, seaCross 2559–2560, Beleg bkOn rules.js:2462.
- Texte „kein Seeweg“ (ui.js:2147, story.js:58) fragen nach zugeschüttetem Wasser – bei einer Brücke irreführend (hinnehmen/notieren).
- Nutzerfragen nach Empfehlung entschieden (12.10.): längs nie (A), Möwen nicht im Umkreis 2, hohe Masten durch.
