# Karte für den Umbau 160c: Fußgängerbrücke am Bahnübergang (Block 148)

Ich habe nur gelesen und nichts ausgeführt, also keine Tests, keinen Browser und keine Änderungen. Was unten als „vermutlich Fehler“ markiert ist, stammt aus dem Code und ist im Bild nicht geprüft.

**Betroffene Dateien** (Kurzform im Text: `datei:zeile`):
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js
- /Users/ericwinderlich/Projekte/Spiel/js/hills.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/plan.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/state.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/hill-walkers.js
- /Users/ericwinderlich/Projekte/Spiel/js/me.js
- /Users/ericwinderlich/Projekte/Spiel/js/story.js
- /Users/ericwinderlich/Projekte/Spiel/js/minimap.js
- /Users/ericwinderlich/Projekte/Spiel/js/data.js

---

## 0. Das Wichtigste in Kürze

- **Alles liegt auf einem Feld:** Die Fußgängerbrücke ist kein eigenes Bauwerk. Sie ist ein Schalter auf dem Schienenfeld des Bahnübergangs: `t.b === 'schiene'`, `t.cross`, `t.foot`, `t.footPaid`. Es gibt keinen Eintrag in `ITEMS` und nichts in `state.bruecken`.
- **`footPaid` hat zwei Aufgaben zugleich:**
  - Es bestimmt das Aussehen: `archLook` liest `footPaidOf(t)`.
  - Es merkt sich, was bezahlt wurde: Abriss, Umgestalten und Kopie rechnen damit.
  - `foot` ist nur „Brücke an oder aus“. Bei Schranken bleibt das bezahlte Design in `footPaid` stehen und kann kostenlos wieder angeschaltet werden.
- **Alte Stände:**
  - `footPaid === true` bedeutet Holz (`footPaidOf`, rules.js:2269).
  - Echte Daten: `testsave-og.json` hat `{footPaid:'kristall'}` ohne `foot` (Schranken, Kristall bezahlt) und `{foot:true, footPaid:'weg', style:'fisch', form:2}`.
  - `testsave-bauland.json` und `testsave-neu.json` haben `footPaid:'holz'`.
- **Größte Gefahr für alte App-Versionen:** Ein neuer Wert in `footPaid` (zum Beispiel `'metall'`) lässt alte Versionen abstürzen, beim Zeichnen in jedem Bild und beim Abreißen (Abschnitt 13, R1).
- **Größte Gefahr für Erstattungen:** Erstattet wird immer nach der aktuellen Tabelle `FOOT_STYLES`. Wer Preise ändert (Kristall „fürstlich“), ändert rückwirkend, was alte Brücken zurückgeben (R2).
- **Die Richtung der Brücke ist nirgends gespeichert.** Sie wird jedes Mal aus `railArms` abgeleitet (`crossingAxes`) und kann umkippen (R5).
- **Zeichnen:**
  - Die Fußgängerbrücke wird immer live gezeichnet, nie als Bildchen (`SPRITE_LIVE` enthält `'schiene'`). Im GL-Bild ist ihr Feld ein „lebendiges Feld“.
  - Der Bogen besteht aus zwei Hälften: die hintere im Objekt-Durchgang, die vordere über `afterMovers` nach den Zügen des Felds.
  - Bewohner auf der hinteren Rampe und in der Mitte zeichnet `archWalkers` danach.

---

## 1. Datenfelder (auf dem Kachelobjekt in `state.tiles`)

| Feld | Bedeutung | Werte / alte Werte | gesetzt | gelesen |
|---|---|---|---|---|
| `b` | immer `'schiene'` | – | actions.js:107 (Schiene über Weg: neues Feld), actions.js:106 (Weg über Schiene: das Schienenfeld bleibt) | `isCrossing` rules.js:2205 |
| `cross` | Feld ist ein Bahnübergang | `true` / fehlt | actions.js:106/107 | überall über `isCrossing`/`crossingAt`; direkt: draw-objects.js:687, 1811; rules.js:466, 1037, 1129, 1385, 2002; actions.js:30, 589, 598; plan.js:79; minimap.js:22; state.js:108, 223; render.js:954, 2020 |
| `style` | Wegbelag des Übergangs. Bei Schranken liegt er quer über dem Gleis, beim Design „Wie der Weg“ ist er der Belag des Decks. | Wegstil-ID oder `'m:<muster>:<farbe>'`; fehlt = `'sand'`. Alte IDs (`'holz'`, `'kies'`, `'schach'`) stellt `parseSave` über `WEG_TO` um (state.js:223, Test paths.test.js:170) | actions.js:106 (`currentStyle('weg')`), actions.js:107 (`old.style \|\| 'sand'`), Umfärben actions.js:37 / plan.js:78, „alle verbundenen“ `setWegCell` rules.js:2006 ff. | drawRailBed draw-objects.js:688; archLook draw-objects.js:763; story.js:600 (Album); render.js:953 (Bildchen-Schlüssel, für `schiene` wirkungslos) |
| `foot` | Brücke statt Schranken | `true` / fehlt | `setCrossing` rules.js:2305 | draw-objects.js:687, 772, 853, 1156; movers.js:15; hills.js:79; rules.js:2293, 2840; bruecken.js:59, 76; actions.js:589, 1175; ui.js:1918, 1921, 1924; render.js:954 |
| `footPaid` | bezahltes Design, zugleich das Aussehen | `true` (alt) = Holz; `'holz'`, `'stein'`, `'weg'`, `'kristall'`; bleibt beim Umschalten auf Schranken stehen | rules.js:2302 | nur über `footPaidOf` (rules.js:2269): archLook draw-objects.js:761; setCrossing rules.js:2295; demolishInfo rules.js:3419; copyTileCost actions.js:589; ui.js:1917, 1925 |
| `form` | Gleis-Stil (Gleisbett), **kein** Brückenfeld | Index in `DECO_LOOKS.schiene.forms` | Gleis-Stil umstellen actions.js:22–27, restyleRails rules.js:2242 | `railLookOf` draw-objects.js:646 |
| `rot`, `lvl`, `born` | wie bei jeder Schiene; `rot` = 0 beim Neubau „Schiene über Weg“, sonst die Drehung der alten Schiene | – | actions.js:107 | wird für die Brücke **nicht** genutzt |

**Was es nicht gibt:** gespeicherte Achse, Farbe, Licht, Zacken, eigener Belag, bezahlter Preis. Alles ist fest pro Design (`FOOT_STYLES`, `ARCH_LOOK`).

**Speichern und Laden:**
- `tileOut` (state.js:108) schreibt `cross`, bei `foot` auch `foot`, und `footPaid`, wenn es wahr ist. Allgemein übernimmt `tileOut` außerdem `style`, `form`, `col`, `rot`, `brk`, `brc`, `brw`, `price`, `look` …. Das ist wichtig für neue Felder (R6).
- `parseSave` stellt nur den Belag um (state.js:223). `footPaid` und `foot` prüft es **nicht** (R23).
- Spielstand-Version 13 (state.js:144). Für den Bahnübergang gibt es keine eigene Migration.

---

## 2. Konstanten

**`FOOT_STYLES`** (rules.js:2262–2267), feste Preise:

| Design | Kosten |
|---|---|
| `holz` | 60 Taler, 4 Bretter, 2 Metall |
| `stein` | 150 Taler, 8 Quader |
| `weg` („Wie der Weg“) | 120 Taler, 4 Bretter, 4 Quader |
| `kristall` | 300 Taler, 5 Kristall, 2 Metall |

Es gibt keine Sperren und keine Freischaltung. Kristall scheitert nur am fehlenden Rohstoff.

**`FOOTBRIDGE`** (rules.js:2268) = Kosten von Holz. Wird nirgends benutzt.

**`addCost(c, sgn)`** (rules.js:2270): bucht Taler und Material hin und zurück.

**Maße des Bogens** (draw-objects.js:752–754):
- `ARCH_CLEAR = 16`: Durchfahrtshöhe über dem Gleis (höchster Zug 13, Block 148d).
- `ARCH_H = 22`: Scheitelhöhe.
- `ARCH_W = EDGE_W + 0.01` = 0,37 (halbe Breite des Decks; `ROAD_W` 0,32 und `EDGE_W` 0,36 stehen in draw-objects.js:127/162).
- `ARCH_SPAN = 0.9`: halbe Länge in Feldern. Die Rampe setzt vor der Feldmitte des Nachbarn auf (Block 148b).
- Höhenformel `archH(b) = 22 · cos(clamp(b/0,9) · π/2)`.

**`ARCH_LOOK`** (draw-objects.js:755–759):

| Material | Deck | Fuge | Seite | Geländer | Dicke `th` | Art |
|---|---|---|---|---|---|---|
| holz | `#c9a26f` | `#b08a5e` | `#8a6440` | `#7a5236` | 4 | `posts` |
| stein | `#ddd6c8` | `#c9c0ae` | `#b8ad98` | `#e7e1d4` | 7 | `wall` |
| kristall | `#e6f6fc` | `#c3e7f5` | `#8fcbe6` | `#8fd3f2` | 3 | `glass` |

- `'weg'` hat keinen Eintrag. `archLook` baut das Aussehen aus dem Belag: Deck = Belagfarbe, Seite = Randfarbe dunkler (−0,12), Geländer = Randfarbe noch dunkler (−0,25), Dicke 4, Art `posts`, Muster über `paintLook`. Trittsteine zählen als Kopfstein.
- In `drawArch`:
  - `RAMP = 0.46` (draw-objects.js:803): Ab diesem Abstand sind die Rampen massiv bis zum Boden.
  - Wange `cheek` (draw-objects.js:845): Über dem Gleis (|b| < 0,38) reicht sie nie tiefer als `ARCH_CLEAR`.
- `crossAnim` (draw-objects.js:741): Zustand der Schranken je Feld.

---

## 3. Funktionen (Datei:Zeile – Rolle)

**Regeln und Daten (rules.js)**

| Funktion | Rolle |
|---|---|
| `isCrossing(t)` 2205 | Schienenfeld mit `cross` |
| `crossingAt(x, y)` 2260 | dasselbe am Ort |
| `footPaidOf(t)` 2269 | `true` → `'holz'`, sonst der Wert oder `null` |
| `crossCandidate(b, x, y)` 2271 | Weg auf eine Schiene ohne `cross` oder Schiene auf einen Weg → liefert das Feld |
| `crossError(b, x, y, noCost)` 2278 | prüft Freischaltung; nicht auf Brücken (`t.bridge`); nur gerade Schienen (`railArms` höchstens 2, gegenüberliegend); Geld und Material über `costOf` |
| `setCrossing(x, y, foot, style)` 2290 | Brücke an: nicht unter einer 160er-Brücke (`bkAt`), nicht über die Kante einer Anhöhe (`archHillError`). Anderes Design: altes voll zurück, neues bezahlen, sonst `fail`. Dann `t.foot`, `sfx`, `groundVersion++`, `save()`. **Kein** `recalc`, **kein** `undoable`, **kein** `cloudTouched`. |
| `wegLike` 1938 | Brückenform-Regeln: Übergang zählt als Weg |
| `wegCarrier`, `wegCellStyle`, `setWegCell` 2002–2010 | „alle verbundenen umfärben“ ändert auch `t.style` des Übergangs |
| `wayAcross` 1205 | Tor in Hecke/Zaun: Übergang zählt als Weg |
| `plainWeg` 1385 | Übergang ist kein Platz für Stände oder Gebäude |
| `pathEnds` 1037, `curveSlot` 1129 | Übergang ausgenommen |
| `smallError` 1652 (Eckpunkt-Deko neben dem Übergang erlaubt), 1675 (Seitenmitten auf dem Übergang erlaubt) | Deko |
| `computeNet` 466 | Übergang gehört zum Viertel (Wegnetz) |
| `roofError` 2171 | kein Dach auf dem Übergang |
| `placeError` 2840 | getragene Fußgängerbrücke nie über die Kante |
| `placeError` 2953–2954 | auf vorhandenen Übergang: umfärben; auf Kandidaten: `crossError`; beim Verschieben nie neu |
| `wishMet('weg')` 3370 | Übergang zählt für den Wunsch „Weg vor der Tür“ |
| `demolishInfo` 3418–3422 | Erstattung (Abschnitt 9) |
| `demolishInfo` 3435 | Anhöhe neben der Brücke: `ARCH_HERE` |
| `costOf` 2079 | Baukosten von Weg/Schiene (auch für den Übergang) |

**Bauen (actions.js, plan.js)**
- actions.js:29–44: umfärben, auch über einen Übergang: 5 Taler, kein Umstellen der Wegform (`shape` ist für `cross` falsch).
- actions.js:101–110: Übergang bauen.
- plan.js:76: Gleis-Linie über einen Übergang stellt nur den Gleis-Stil um.
- plan.js:78–81: Weg-Linie über einen Übergang = umfärben.
- plan.js:82–85: Kosten und Fehler beim Planen (`crossError(…, true)`).

**Zeichnen (draw-objects.js)**
- `drawRailBed` 649: Gleisbett; 687–698: Wegbelag quer über das Gleis, nur ohne `foot`.
- `afterMovers`, `archWalkers` 739.
- `crossingAxes(x, y)` 743: `d` = Richtung der Schiene aus `railArms[0]`, ohne Arme `[1,0]`; `n` = Richtung des Wegs.
- `archLook` 760; `archAt(px, py)` 768: prüft das Feld und seine vier Nachbarn; |a| < 0,5 quer, |b| < 0,9 längs → `{ key, b }`.
- `drawArch(P, z, b0, b1, lk, x, y, d, n)` 778–849, Reihenfolge:
  1. hintere Rampenwände
  2. Stirnwände bei ±0,46
  3. hinteres Geländer
  4. Deck (bei `weg` mit Muster in 12 Abschnitten)
  5. Fugen bzw. Kristall-Glanz und `glowQuad` in Blau
  6. vordere Wange
  7. vordere Rampenwände
  8. vorderes Geländer
- `drawCrossing(cx, cy, z, x, y, t, now)` 850–882: Brücke 853–862, Schranken 863–881.
- `padBorder(sh, d, at)` 1154: zum Übergang mit Brücke hin kein Überlapp (148c).
- `drawObject` Fall `'schiene'` 1809–1812.

**Anhöhen (hills.js)**
- `ARCH_LEVEL` 70; `archHillError(x, y)` 71: beide Nachbarn längs des Wegs gleich hoch, keine Treppe oder Rampe dort.
- `archAround(x, y)` 76: Brückenfeld selbst oder sein Nachbar längs des Wegs; prüft auch ohne Anhöhen.
- `ARCH_HERE` 86.
- Genutzt in: `hillRaiseError` 109, `lowerHill` 128, `stairError` 733, `stairIntoError` 774, `rampError` 1291, `rampIntoError` 1332, `bpError` 1836, plan.js:272 (Abriss-Rechteck), rules.js:3435.

**Bewohner (movers.js)**
- `walkable(x, y, open)` 11–17: Übergang mit Brücke immer begehbar, mit Schranken nur offen.
- `crossingClosed(x, y)` 25–28: ein Zugwagen mit |dx|+|dy| < 2,3, ausgenommen Wagen auf dem Deck einer 160er-Brücke.
- Warten vor der Schranke: movers.js:136, me.js:160 (eigene Figur).
- `walkerHead` 305 (ohne Bogenhub!).
- `drawFigure` 370: Hub `archH(arch.b)`, nur wenn `figUp(w) == null`.

**Szene (render.js)**
- `cachedPath` 82, Boden-Bild 435 / 1600.
- `SPRITE_LIVE` 528–530; `paintSprite` schneidet `afterMovers` ab (616–622 und 814–836).
- Bildchen-Schlüssel 954 (`cross`/`foot`; für `schiene` unbenutzt).
- `FLAT_HIT` 1083 / 1110.
- Bau-Hinweis 1761.
- `hillFlat` 1865–1872.
- Durchsicht `fadeIt` 2017 (ohne `schiene`); `drawIt0` 2020.
- `hillPre` 2060 (für `schiene` übersprungen).
- `archWalkers` sammeln 2136–2137, `afterMovers` 2148, `archWalkers` zeichnen 2149, leeren 2201.
- `moverLive` 899.

**GL (gl.js)**
- `glMoverBox` 554: nur `wegBridgeLift`.
- `glBgStep` legt `afterMovers` beiseite und holt sie zurück (723, 771, 778).

**Fenster (ui.js)**
- `footBtn` 1916; Abschnitt Bahnübergang 1920–1925; keine Wegform 1934; Titel 1943; Knöpfe 2061–2062.

**Sonstiges**
- bruecken.js:59 (`bkUnderError`), 76 (`bkPlaceError`).
- hill-walkers.js:123 (`hwIsWay`).
- story.js:600 (Album zählt den Belag).
- minimap.js:22 (Farbe wie ein Weg).
- data.js:694 (Text zur Schiene).
- ui.js:3304–3307 (alter Eintrag in „Das ist neu“).

---

## 4. Regeln und Invarianten

1. **Ein Übergang entsteht nur über eine gerade Schiene**, nicht auf Brücken (rules.js:2282/2284), nur auf eigenem Land, beim Verschieben nie (rules.js:2953). Diese Prüfung läuft **nur beim Entstehen**. Später angelegte Abzweige oder abgerissene Schienen ändern `railArms` und damit `crossingAxes` (R5).
2. **„Brücke an“ ist verboten, wenn**
   - eine 160er-Brücke darüber liegt (rules.js:2293);
   - der Boden längs des Wegs nicht eben ist (`archHillError`);
   - das Ding getragen an eine Kante soll (rules.js:2840) oder unter ein Deck (bruecken.js:76).
3. **Daneben bleibt die Höhe gleich** (`archAround`): kein Anheben, Abtragen, keine Treppe, Gleis-Rampe oder Bergportal am Brückenfeld oder seinen Nachbarn längs des Wegs. Das gilt auch ohne Anhöhen.
4. **Bezahlt bleibt bezahlt:** Schranken behalten `footPaid`, Zurückschalten ist kostenlos. Ein anderes Design gibt das alte voll zurück.
5. **Durchfahrt:** über dem Gleis (|b| < 0,38) mindestens `ARCH_CLEAR` 16. Tests verlangen `archH(0)` > 17 und `archH(0,2)` > 17.
6. **Rampen:**
   - Der Bogen ragt je 0,9 Felder auf die Wegnachbarn und endet dort auf Höhe 0 (`archH(1)` ≈ 0).
   - Ab |b| = 0,46 sind die Wände massiv bis zum Boden, mit Stirnwand zur Gleisseite.
   - Der Weg des Nachbarn hat zum Brückenfeld hin keinen Überlapp (`padBorder`).
   - Das Deck ist mindestens so breit wie der Weg samt Rand (`ARCH_W ≥ EDGE_W`).
7. **Unter dem Bogen kein Wegbelag** (draw-objects.js:687): Bei `foot` liegt dort nur das Gleisbett.
8. **Netze:** Der Übergang gehört zu beiden. Gleis: `railArms`, `railPath`, `computeRail`. Weg: `pathArms`, `computeNet`, `walkable`, `wishMet('weg')`, `wayAcross`. Die Gleis-Rampe ist kein Teil des Wegnetzes.
9. **Zeichen-Reihenfolge des Bogens:** hintere Hälfte im Objekt-Durchgang des Felds; vordere Hälfte nach den Fahrzeugen **desselben** Felds (`afterMovers`, verbraucht im `tileB` desselben Felds); Bewohner mit b ≤ 0,5 danach (`archWalkers`).
10. **Nie als Bildchen:** In einem Bildchen landet nichts in `afterMovers` (Test tempo-schritt3).

---

## 5. Zeichenweg

1. **Boden-Durchgang** (Bodenbild je Grundstück, render.js:435):
   - `cachedPath(t)` ist für jede Schiene ohne `bridge` wahr. `drawFlat` → `drawRailBed` zeichnet Gleisbett, bei Schranken den Wegbelag quer (Muster, Schachbrett, ohne Wegrichtung `patRot`), dann die Schienen.
   - Ein neues Bodenbild kommt nur über `groundVersion`. `setCrossing` erhöht es.
   - Auf einer Anhöhe kommt das Gleis nicht aus dem Bodenbild, sondern aus `hillFlat` (render.js:1865) → `drawHillFlat` → `drawFlat`, weit weg als `spriteFlat`.
2. **Objekt-Durchgang `tileA`** (render.js:2019–2062): `drawIt` → `drawObject('schiene', PASS 'object')` → `drawCrossing`.
   - Brücke: `drawArch(−0,9 … 0)` sofort, dann `afterMovers.push` mit gemerkter Transformation für `drawArch(0 … 0,9)`. Ohne `PASS 'object'` (Vorschau, Geist beim Verschieben) wird der ganze Bogen auf einmal gezeichnet.
   - Schranken: zwei Pfosten an diagonalen Ecken (a = ∓0,4, b = ±0,38), oben eine rote Lampe. Der Schlagbaum ist rot-weiß gestrichelt, Drehpunkt auf Höhe 7, Länge 0,7 entlang der Schiene, Winkel `(1 − k) · 0,44π`.
   - Weit weg kein Bildchen (`SPRITE_LIVE`). Im GL-Bild läuft es über `glLive` (render.js:2041, Rahmen nach `spriteTop` 112 × 1,3) und ist im Standbild ein lebendiges Feld, also jedes Bild neu gemalt.
   - Auf einer Anhöhe: Der Bogen wird über `c.y` und den Kantenschnitt (`hillCutClip`) angehoben. Die vordere Hälfte trägt nur die Transformation mit, nicht den Schnitt. `hillPre` wird für `schiene` übersprungen (render.js:2060).
3. **`tileB` desselben Felds** (render.js:2126–2149):
   - Bewegtes des Felds. Figuren mit `archAt` und b ≤ 0,5 werden zurückgestellt (`archWalkers`, Schlüssel = Brückenfeld).
   - Dann `afterMovers` (im GL-Bild per `glLive`: TW·1,3·z seitlich, 150·z oben, 50·z unten).
   - Dann die Figuren aus `archWalkers` über `moverLive(m, z, now, true)`, **ohne Hub**.
   - Figuren mit b > 0,5 (vordere Rampe) stehen auf ihrem eigenen Feld, das nach dem Brückenfeld kommt, und werden normal mit Hub gezeichnet.
4. **Nacht:**
   - Kristall: `glowQuad` über das ganze Deck jeder Hälfte (Radius 22·z, blau), also zwei Lichter je Brücke, ohne Strom und immer an.
   - Schranke: Blinklicht `glowQuad` (12·z, warm), nur geschlossen und im Takt.
   - Holz, Stein und „Wie der Weg“ haben kein Licht.
   - Kein Strombedarf: `computePower` (rules.js:2787 ff.) kennt nur Laternen und die Lichter an Linien.
5. **Durchsicht:** `fadeIt` schließt `schiene` aus, die Fußgängerbrücke wird also **nicht** blass (anders als die 160er-Brücke über `bkFadeNow`).
6. **Antippen:** `FLAT_HIT` enthält `schiene`, also überspringt `objectAt` die Brücke. Es zählt nur die Bodenraute des Felds. Ein Tipp aufs hohe Deck trifft das Feld dahinter.
7. **Schatten:** Es gibt keinen Schlagschatten der Brücke (kein `SHADOW` für `schiene`).

---

## 6. Bewohner auf der Brücke

- **Laufen:** wie auf einem Weg (`walkable`), mit Brücke auch, wenn ein Zug kommt (Test). Spaziergänger zählen den Übergang als Weg (`hwIsWay`). Alle Figuren der `people`-Liste (Bewohner, Spaziergänger, Parade, eigene Figur, Besucher) heben sich über `archAt`.
- **Hub:** `drawFigure` (movers.js:370) nimmt `archH(arch.b)`, auch für den Schatten an den Füßen, aber nur, wenn `figUp(w) == null`.
- **Vermutlich Fehler (nur aus dem Code gelesen):**
  - (a) `archWalkers` zeichnet ohne den Hub der Anhöhe (render.js:2149). Eine Brücke oben auf einer Anhöhe ist erlaubt (Test gleisrampe-kritik:68), dort stünden Bewohner um `HILL_H` zu tief.
  - (b) Spaziergänger oben auf der Anhöhe haben `w.up = 0`, also `figUp = 0`, also bekommen sie keinen Bogenhub.
  - (c) `walkerHead`/`walkerAt` (Sprechblase, Antippen) kennen den Bogenhub nicht. Bei den Bogenbrücken übers Wasser fehlt er dort genauso.
  - (d) `glMoverBox` (gl.js:554) nutzt nur `wegBridgeLift`. Ein Namensschild könnte abgeschnitten werden.

## 7. Schranke

- `crossingClosed`: Zugwagen in der Nähe, aber nicht auf einem 160er-Deck.
- Bewohner warten (`wait = 0,4`) und laufen weiter, sobald offen (Test fehler84c).
- Die Animation ändert sich um ±0,05 **pro Bild**, nicht nach der echten Zeit. Das verstößt gegen CLAUDE.md Regel 29. `crossAnim` wird nie geleert.

## 8. Fenster (`openInfo`, ui.js)

- Titel „Bahnübergang“, Beschreibung = die der Schiene, keine Wegform.
- Darunter der Gleisbett-Wähler wie bei jeder Schiene, dazu Überdachung (`roofInfoHtml`), ✋ Verschieben und Löschen (`delButton`, „Bahnübergang entfernen“).
- Abschnitt Bahnübergang (1920–1925):
  - Knopf „Schranken“ (`data-cross="0"`).
  - Vier Design-Knöpfe (`data-foot` = holz/stein/weg/kristall). Preis steht nur bei nicht bezahlten Designs; hervorgehoben ist nur das, das gerade an ist und bezahlt wurde.
  - Ohne Brücke steht der Grund aus `archHillError` da; bei bezahltem Design der Satz „Anderes Design: die alte Brücke gibt es voll zurück.“
- Die Knöpfe (2061–2062) rufen `setCrossing` direkt auf und öffnen das Fenster neu. **Nicht** über `undoable` (kein ↶, kein `cloudTouched`, keine Prüfung `cloudWatching`). Laut CLAUDE.md Regel 65/93 sollte das bei Neuem so laufen.

## 9. Kosten

| Vorgang | Kosten / Erstattung |
|---|---|
| Übergang bauen, Weg über Schiene | 5 Taler (`ITEMS.weg.cost`) |
| Übergang bauen, Schiene über Weg | 15 Taler + 1 Holz + 1 Metall |
| Umfärben über den Übergang | 5 Taler (actions.js:34, plan.js:80) |
| Brücke an, erstes Mal | Preis des Designs (Tabelle in Abschnitt 2) |
| Schranken an | kostenlos |
| Wieder Brücke, gleiches Design | kostenlos |
| Anderes Design | altes voll zurück, neues voll bezahlt (rules.js:2297–2303); zu wenig Geld/Material → alles zurück, Fehlermeldung |
| Abriss (rules.js:3418–3422) | Schiene 15 + Weg 5 + Taler des bezahlten Designs, Material Holz 1, Metall 1 + Material des Designs. Gilt **auch bei Schranken**, wenn `footPaid` gesetzt ist. Es wird nach den **aktuellen** Preisen erstattet. |
| Kopie (`copyTileCost`, actions.js:589) | Schiene + Weg + Design **nur, wenn `foot` an ist**; `copyClone` behält `footPaid` (R12) |

## 10. Wie alte Stände gelesen werden

- `footPaid: true` → `footPaidOf` liefert `'holz'`: Aussehen, Erstattung und Fenster wie Holz (Test uebergang „alte Stände“).
- Fehlt `footPaid` bei `foot: true`, wird Holz gezeichnet (`archLook`: `|| 'holz'`), erstattet wird dann nichts für die Brücke. Das betrifft nur selbst gebaute Testdaten.
- Übergänge ohne `style` haben den Belag `'sand'`. Alte Belag-IDs stellt `parseSave` um (state.js:223).
- Übergänge ohne Nachbar-Schienen (zum Beispiel Test fehler84c) bekommen die Achse `[1,0]`.
- Freundes-Inseln, Besuche, Cloud und Datei laufen alle über `parseSave` (cloud.js:155, live.js:106, ui.js:3552). Die Kacheln liegen im Live-Spiegel als JSON je Feld (`LIVE_MAPS` tiles); die Firebase-Regeln prüfen keine Kachelfelder.

## 11. Zusammenhänge mit anderen Systemen

- **Gleisnetz:**
  - Der Übergang ist ein Schienenfeld (`railArms`, `trackLink`, `computeRail`, `railNetwork`, `restyleRails`, „Gleise umstellen“). Züge fahren hindurch. Der Gleis-Stil liegt in `t.form`.
  - Ein Gleis auf einer 160er-Brücke darüber schließt die Schranke nicht.
  - Der Parkbahn-Übergang ist etwas anderes (`pb_gleis` mit `t.weg`, Test parkbahn:21).
- **Wegnetz und Viertel:** `computeNet` (Übergang = Bebautes), `pathArms`/`pathArmsHill`, `wegLike` (Brückenform), `wayAcross` (Tore), „alle verbundenen umfärben“, Wunsch Weg, Album (Belag), Minikarte.
- **Anhöhen:** `archHillError`/`archAround` an acht Stellen (Abschnitt 3). `drawHillFlat` zeichnet Gleis und Belag oben. Der Bahnübergang oben ist getestet.
- **Brücke zwischen Anhöhen (Block 160):**
  - Keine Fußgängerbrücke unter dem Deck (`bkUnderError`, `bkPlaceError`, `setCrossing`). Ein Übergang ohne Brücke darunter ist erlaubt. ↶ bringt keine Fußgängerbrücke unter ein Deck zurück (actions.js:1175).
  - `state.bruecken` setzt Anhöhen an beiden Enden voraus (`bkEndsOf`, `bkOnHill`, Prüfung beim ↶). Eine Fußgängerbrücke am Boden passt nicht in dieses Modell.
- **Überdachung:** kein Dach auf dem Übergang (`roofError`, `groupErrors` actions.js:463). Die Wegnachbarn unter der Rampe prüft niemand.
- **Deko:** Seitenmitten und Ecken auf dem Übergang sind erlaubt (smallError 1675). Es gibt keine Höhenprüfung gegen den Bogen (anders als `bkTooTall`/`tooTallUnderRoof`).
- **Verschieben, Kopieren, ↶:**
  - Der Übergang lässt sich als ganzes Schienenfeld tragen (`pickUp`), samt `foot` und `footPaid`. Beim Ablegen gilt nur `archHillError`.
  - Die Pipette schließt `cross` aus (actions.js:598).
  - ↶ merkt sich das ganze Feld (`UNDO_MAPS`).
- **Strom:** keine Verbindung. Neue Lichter müssten entscheiden, ob sie wie Laternen zählen (`LAMPS_PER_POWER` 10, `power.dark`, Schlüssel wie `edgeLamps`).
- **Freischaltung:** Die Bahn kommt erst mit der Erzinsel. Wald- und Windinsel kommen in der Reihenfolge davor (data.js:887 ff.). Für Übergänge sind Holz, Stein und Metall also immer frei, nur Kristall hängt an der Kristallinsel.

## 12. Tests und Werkzeuge

| Datei | Was sie prüft |
|---|---|
| tests/uebergang.test.js (ganze Datei) | beide Bauwege; Belag bleibt; nicht auf Kurven/Brücken; Viertel über den Übergang; Schranke zu, Bewohner warten; Brücke einmal bezahlt (−60) und umschaltbar, gespeichert; Design Stein (−150, −8 Quader), Kristall ohne Rohstoff abgelehnt; `footPaid` gespeichert; `true` = Holz; alle Designs zeichnen Tag/Nacht; **genau 4 `data-foot`-Knöpfe**; `ARCH_W ≥ ROAD_W − 0,05`; Bewohner über die Brücke trotz Zug; `archH`-Werte; `archAt(9, 7.4).b ≈ −0,6`; Abriss erstattet 20; Zeichnen in allen Zuständen |
| tests/baenke-fussbruecke.test.js:18–27 | `ARCH_W ≥ EDGE_W`; Rampenwand bis Höhe 0 (`drawArch` mit `ARCH_LOOK.holz`) |
| tests/gleisrampe-kritik.test.js:51–97 | `ARCH_LEVEL` an der Kante, `setCrossing` lehnt ab, Fenstertext; `archAround`-Nachbarn; Abriss/`lowerHill`/`hillRaiseError` = `ARCH_HERE`; getragene Brücke an der Kante; `stairIntoError`/`rampError`; `crossingAxes(…).n` |
| tests/bruecke.test.js:135–145 | keine Fußgängerbrücke unter einer 160er-Brücke (auch getragen) |
| tests/bruecke-gleis.test.js:136–139, 183–191 | Schranke und Züge auf dem Deck |
| tests/fehler84c.test.js:82–91 | Warten an der Schranke |
| tests/gleis-zeichnen.test.js:128–140, 183–195 | Übergang oben: Reihenfolge Gleis oben → Schranken, um `HILL_H` angehoben; ohne Anhöhen `railArms` wie früher |
| tests/gleis-ebenen.test.js:63–77 | Übergang oben entsteht und hängt zusammen |
| tests/stufe3-kritik.test.js:122–135 | Übergang ist begehbar (`hillNoStair`) |
| tests/tempo-schritt3.test.js:82–88, 101–108 | nichts in `afterMovers` aus Bildchen; Übergang bleibt weit weg live |
| tests/kopieren.test.js:146 | `copyTileCost` mit `FOOT_STYLES.stein` |
| tests/paths.test.js:170–178 | alter Belag `'holz'` auf dem Übergang → `'sand'` |
| tests/bahn-gemuetlich.test.js:76 | Gleis-Stile samt Übergang zeichnen |
| tests/neuwelt.test.js + testsave-neu.json → tests/leistung.test.js (Welt „neu“) | Holz-Fußgängerbrücke bei 29,14 (`Object.keys(FOOT_STYLES)[0]`) im Leistungs-Wächter je Bild |
| tests/leistung-je-ding.json | nur `schiene Form 0–4`, **keine** Fußgängerbrücke |

**Werkzeuge:**
- tools/brueckenschau.js:44: Reihe 2 mit allen vier Designs und Schranken.
- tools/gleisrampe-pruefung.js:17–18, 69: Übergang und Bogen oben auf einer Rampe, Stein.
- tools/neuwelt.js:52–55.
- Die abgenommenen Entwürfe (brueckenfamilie, brueckenlicht, kristallbruecke) zeigen nur Brücken zwischen Anhöhen. **Für die neuen Materialien über einem Gleis gibt es keinen Entwurf.**

## 13. Risiken für den Umbau

**R1 – hoch – alte App-Versionen stürzen ab.** Ein neuer `footPaid`-Wert (`'metall'`, neue Kristall-Variante …) bricht alte Versionen:
- `archLook` liefert `undefined` (draw-objects.js:762), `drawArch` liest `lk.side`/`lk.kind` → Fehler in jedem Bild;
- `demolishInfo` und `setCrossing` lesen `FOOT_STYLES[x].cost` → Fehler.

Das trifft ein zweites Gerät mit älterem Stand und Besuche bei Freunden. Neue Materialien und Optionen gehören in neue Felder, `footPaid` bleibt bei den alten Werten oder bekommt einen Rückfallwert. Der neue Code muss unbekannte Werte abfangen (siehe R23).

**R2 – hoch – Erstattungen alter Brücken.** Erstattet wird nach der aktuellen Tabelle. Wer Kristall teurer macht oder Licht und Zacken bepreist, schenkt alten Brücken Geld (og: Kristall bezahlt für 300 + 5 Kristall + 2 Metall, liegt sogar unsichtbar unter Schranken). Die alten Preise müssen als Tabelle bleiben, oder der bezahlte Preis wird gespeichert (CLAUDE.md Regel 73/137, `t.price`-Muster). Licht und Zacken brauchen jeweils ihren bezahlten Betrag.

**R3 – hoch – „Wie der Weg“ fällt weg.** Alte Brücken mit `'weg'` (og: Fischgrät, an) sollen gleich aussehen:
- Bauart wie Holz (`posts`, Dicke 4), Farben aus dem Belag;
- Deck mit Muster in 12 Abschnitten (draw-objects.js:823–834);
- Erstattung bleibt 120 Taler + 4 Bretter + 4 Quader.

Am naheliegendsten: Holz eingefärbt + Belag = `t.style`, die alte Erstattung bleibt erhalten.

**R4 – mittel – altes Aussehen gegen neue Modelle.** Stein ist heute eine niedrige Brüstung, das neue Modell eine Balustrade mit Minilaternen; Kristall ist heute Glas mit leuchtendem Handlauf, das neue Modell K1 mit Leuchtstreifen. Alter Kristall leuchtet nachts ohne gekauftes Licht. „Licht aus“ als Standard würde ihn verändern, „an“ verschenkt die Option. Das muss der Nutzer entscheiden.

**R5 – mittel – die Achse kann umkippen.** Sie ist nicht gespeichert (`crossingAxes` aus `railArms[0]`). Schienen neben dem Übergang abreißen, eine weitere Schiene/einen weiteren Übergang daneben bauen oder eine Anhöhe (Arme über `levelLink`) dreht Bogen und Prüfungen (`archAround`, `archHillError`) still um 90°. Für neue Formen eine Achse speichern; bei alten Ständen einmalig ableiten.

**R6 – mittel – neue Felder gehen verloren.** Neue Kachelfelder müssen in `tileOut` und `parseSave` (CLAUDE.md Regel 24/49). Ältere Versionen werfen unbekannte Felder beim Speichern weg, bezahlte Optionen wären dann verloren. Alte Versionen übernehmen schon allgemein: `col`, `brc`, `brw`, `brk`, `look`, `price`, `wall`, `roof`. `form` (Gleis-Stil) und `style` (Belag) sind belegt.

**R7 – mittel – Zeichen-Mechanik und Leistung.**
- Die zwei Hälften mit gemerkter Transformation werden im `tileB` desselben Felds verbraucht. Der `glLive`-Rahmen (150·z oben) muss höhere Modelle mit Zacken und Laternen fassen.
- `paintSprite`/`glBgStep` behandeln `afterMovers` gesondert.
- Die Brücke ist immer live und im GL-Standbild immer lebendig. Aufwendigere Modelle (Pfeiler, Fachwerk, Lichter) kosten in jedem Bild. Ruhende Teile als Bildchen wären einen Gedanken wert (Regel 144).
- Vermutlich Fehler (nicht im Bild geprüft): Ein Wagen, dessen Mitte schon auf dem vorderen Gleisfeld liegt, der aber noch unter dem Bogen steht, wird erst nach der vorderen Bogenhälfte gezeichnet und läge über der Brücke.

**R8 – mittel – Maße, die Fehler aus Block 148 verhindern.** `ARCH_CLEAR`, `ARCH_SPAN 0,9` (kein Zipfel über runden Wegenden), `RAMP 0,46` mit Stirnwand, `padBorder`, Wange nie unter 0, `ARCH_W ≥ EDGE_W`. Neue Modelle müssen das einhalten und in beiden Richtungen getestet werden (Regel „Brückenrichtung“).

**R9 – mittel – Kopplung an die Anhöhen.** Ändert sich die Grundfläche (Pfeiler auf Kachelkanten, längere Rampen, Bogen zwischen Anhöhen), müssen `archAround`/`archHillError` und alle acht Aufrufer mitziehen.

**R10 – mittel – Bewohner (vermutete Fehler).** `archWalkers` ohne Hub der Anhöhe, Spaziergänger ohne Bogenhub, `walkerHead`/`walkerAt`/`glMoverBox` ohne Bogenhub (Abschnitt 6).

**R11 – mittel – fehlende Regeln an den Nachbarfeldern.** Die Rampe liegt halb auf den Wegnachbarn. Ohne Anhöhen prüft das niemand. Ein Gebäude darf den Nachbarweg ersetzen (`replacesWeg`/`plainWeg`), große Deko darf darauf, der Weg darf weg: Dann landet die Rampe im Haus oder auf Gras. Deko in Seitenmitten und Ecken hat keine Höhenprüfung gegen den Bogen.

**R12 – mittel – Geldlücke beim Kopieren (vermutet).** Wer einen Übergang mit Schranken und bezahltem Design kopiert, zahlt kein Design, behält aber `footPaid`. Der Abriss erstattet es → Geld aus dem Nichts.

**R13 – klein bis mittel – Fenster nicht über `undoable`.** Kein ↶, kein `cloudTouched`. Neue Wahlmöglichkeiten (Farbe, Licht, Zacken, Belag) gehören in `undoable`.

**R14 – klein – Schranke.** Animation pro Bild, `crossAnim` wächst ohne Aufräumen.

**R15 – klein – Durchsicht.** Die Brücke wird nicht blass; 160er-Brücken schon.

**R16 – klein – Antippen.** Das Deck selbst ist nicht antippbar (`FLAT_HIT`). Die neue Familie hat bei 160 `bkPick`.

**R17 – mittel – Leistungs-Wächter.** Wer Holz neu zeichnet, ändert die Welt „neu“ → `npm run leistung:neu` und Begründung in AUFGABEN.md. Neue Modelle haben keinen Wert je Ding, ohne Wächter, solange man keinen aufnimmt.

**R18 – Tests mit festen Werten.** uebergang (4 Knöpfe, 60/150/8 Quader, Ablehnung Kristall, `drawCrossing` je `FOOT_STYLES`-ID), kopieren:146, neuwelt (`Object.keys(FOOT_STYLES)[0]`), baenke (`ARCH_LOOK.holz`), gleisrampe-pruefung (`'stein'`).

**R19 – Strom und Licht.** Heute braucht kein Brückenlicht Strom. Wenn das Licht wie Laternen zählen soll, braucht es Schlüssel in `computePower` und eine Prüfung `power.dark` beim Zeichnen. Licht nur über `glowQuad` nach dem Leuchtenden (Regel 112), große Glasflächen nur in der Mitte (Regel 22).

**R20 – Doppelrolle von `t.style`.** `t.style` ist zugleich der Belag quer über dem Gleis (bei Schranken sichtbar) und der Deck-Belag bei „Wie der Weg“. Umfärben per Weg-Linie und „alle verbundenen“ ändern ihn mit. Ein frei wählbarer Belag der Brücke braucht ein eigenes Feld, oder diese Kopplung wird bewusst entschieden.

**R21 – Vereinheitlichen mit `state.bruecken`.** Das Modell setzt Anhöhen an den Enden voraus (Prüfungen, `bkLinks`, ↶). Eine Fußgängerbrücke am Boden über ein Gleis passt nicht ohne Weiteres hinein. Einfacher wirkt: auf dem Kachelobjekt lassen und die Zeichnung und Optionen mit der Familie teilen.

**R22 – Freischaltung.** Neu ist nur Kristall wirklich gesperrt (Kristallinsel). Holz, Stein und Metall sind mit der Bahn ohnehin da.

**R23 – fremde Werte.** `parseSave` prüft `foot` und `footPaid` nicht. Beliebige Werte von fremden Inseln führen schon heute zum Absturz beim Abreißen und Zeichnen. Beim Lesen streng sein, wie bei `state.bruecken`.

## 14. Offene Fragen an den Nutzer (aus der Karte abgeleitet)

1. Alte Stein- und Kristallbrücken: genau wie vorher lassen oder auf die abgenommenen neuen Modelle umstellen? Bekommt alter Kristall „Licht an“?
2. Braucht das Brückenlicht Strom wie Laternen?
3. Soll eine Weg-Linie über ein gerades Gleis gleich eine Fußgängerbrücke bauen, oder bleibt es bei „Übergang bauen, dann im Fenster umschalten“?
4. Preise für Licht, Zacken und Kristall: Das Thema Geld und Fortschritt will der Nutzer später besprechen. Bis dahin feste Untergrenzen, und der bezahlte Preis wird gespeichert.