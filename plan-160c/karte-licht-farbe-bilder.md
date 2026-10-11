# Bereichskarte für 160c: Nachtlicht, Farben, Bildchen und Maler-Reihenfolge

Ich habe nur gelesen und nichts geändert. Zeilennummern gelten für den aktuellen Stand von `main`. Pfade sind relativ zu `/Users/ericwinderlich/Projekte/Spiel`.

## 0. Das Wichtigste vorab

1. **Brücken zwischen Anhöhen haben heute kein Licht.** Es gibt keinen `glowQuad` in `js/bruecken.js`. Auch die Wasserbrücken (`drawWegBridge` und das Brückenstück in `drawRailBed`) leuchten nicht. Licht hat bisher nur die Kristall-Fußgängerbrücke am Bahnübergang: blaues Licht auf dem Deck in `drawArch`, draw-objects.js:841. Strom braucht sie keinen.
2. **Die fünf Brückenarten werden heute an drei verschiedenen Stellen gezeichnet** (Tabelle in 4.4):
   - im flachen Boden-Durchgang (flache Wasserbrücke, Gleisbrücke),
   - in tileA (Bogenbrücke übers Wasser, Fußgängerbrücke am Bahnübergang),
   - in tileB (Brücke zwischen Anhöhen).
3. **Die Brücke zwischen Anhöhen wird immer live gezeichnet**, Strich für Strich, auch weit weg. Im GL-Bild ist jedes Deckfeld in jedem Bild „lebendig“ (`bkLiveTiles`, gl.js:681). Kein Leistungs-Wächter misst sie:
   - Testwelten mit `state.bruecken` fehlen.
   - In `leistung-je-ding.json` stehen `bruecke Form 0/1` auf 0.
4. **Licht gibt es nur in zwei Tönen:** warm (ohne `tint`) und `'blue'`. Ein dritter Ton würde die ganze Lichtkette berühren (siehe 1.2).
5. **Farbwahl an Brücken gibt es heute nur bei der Wasser-Wegbrücke.** Sie kostet nichts, gilt für die ganze Brücke und wird je Feld als Index gespeichert (`t.brc` in `BRIDGE_COLS`, `t.brw` in `PLANK_COLS`). Fußgängerbrücke und Brücke zwischen Anhöhen haben feste Farben.

---

## 1. Nachtlicht

### 1.1 Grundprinzip: Löcher stanzen (Regel 44)

| Name | Ort | Rolle |
|---|---|---|
| `night`, `glows`, `SPRITE_PAINT`, `isLive()` | draw-objects.js:5–8 | `isLive` ist wahr bei `g === ctx`, beim Bildchen-Malen (`SPRITE_PAINT`) oder in der GL-Sammelfläche (`GLPASS && g === LA.x`). Vorschaubilder sind nie live, haben also kein Licht. |
| `glowQuad(pts, r, tint)` | draw-objects.js:15–21 | Tut nichts, außer `night > 0.15 && isLive()`. Rechnet `pts` über `g.getTransform()` in Bildschirmpunkte um. Translate, Scale, Clip und Anhöhen-Hub gelten also automatisch, auch in der GL-Zelle (`LA.x.getTransform` zieht `LA.off` ab, gl.js:244). Ist `GLOW_SINK` gesetzt (Bildchen malen), wird das Licht nur gemerkt (`{q, r, tint, snap}`), sonst `punchGlow`. |
| `GLOW_SINK`, `GLOW_ATLAS`, `glowSnap` | draw-objects.js:14, 25–42 | Kopie der Scheibe zum Zeitpunkt des Lichts. Daraus baut `lightMask` die Maske für Dämmerung und weit weg. Blau hat keine Kopie. |
| `glowCells` | draw-objects.js:46 | Zelle von 24 px auf dem Bildschirm. Jedes **weitere** Licht in derselben Zelle bekommt `r·0.7` und Deckkraft `/(1+1.8n)`, Zeile 64–69. |
| `punchGlow(q, r, tint, part)` | draw-objects.js:51–84 | Stanzt mit `destination-out` den weichen Schein (`glowImage`, Deckkraft `0.45·strength/(1+1.8n)`) und, nur bei warm, die Scheibe `q` voll. `part` ist `'halo'`, `'pane'` oder `'mark'` (für Bildchen). Blau stanzt **keine Scheibe**. Mit `SPRITES_ON && nightPicOn()` ist das blaue Loch nur `BLUE_SPOT` (0,5) groß (Z. 69). Im GL-Bild über `glOut`/`glOutQuad` (Z. 70–75). Am Ende `glows.push`. |
| `windowOn` | draw-objects.js:85–90 | Muster für alles Leuchtende: **erst** die Fläche malen, **dann** `glowQuad`. |
| `drawNight()` | render.js:1468–1488 | Legt das Nachtblau `rgba(25,35,85,night)` mit `source-atop` über das Bild und dahinter die Lichtschicht (`destination-over`). Danach eine warme Fläche, falls `nightWarm`. Zuletzt `#2a3f66` als Sicherheitsnetz. |
| `nightDedup` | render.js:1490 | Zeichnet gleiche Lichter (q[0], q[2] und r gerundet) nur einmal, z. B. bei großen Gebäuden in Streifen. |
| `nightLights(lights, pics, panes, warm, E)` | render.js:1500–1524 | **Die eine Lichtschicht für 2D und GL.** Reihenfolge: (0) Fenster `#ffd873`, (1) warme Scheiben neben Blau (`warmPre`), (2) Schein: warm als Quadrat `rgb(255,205,100)`, blau als Fleck `r·BLUE_SPOT` (mit Nachtbildern) bzw. Quadrat, (3) Lichtbilder. |
| `glowImage(blue)` | render.js:1527 | Weicher Fleck 64×64, warm oder blau. |

**Folgen für das Aussehen:**
- Eine warme Scheibe wird nachts ganz mit `#ffd873` gefüllt. Feinheiten innerhalb des Scheiben-Vierecks verschwinden (Regel 22: Glas nur in der Mitte leuchten lassen).
- Blau stanzt keine Scheibe, Sprossen und Struktur bleiben also sichtbar. Für Kristall-Glas ist das die richtige Wahl.
- Was **nach** dem Stanzen gemalt wird, füllt das Loch wieder und bleibt dunkel. Beispiele: das Deck nach dem hinteren Geländer, Figuren, das vordere Geländer.

### 1.2 Warm gegen blau: wo `tint` überall eingeht

Ein neuer Lichtton müsste an all diesen Stellen nachgezogen werden:
- `glowQuad` (snap)
- `punchGlow` (blue)
- `paintSprite` (`warm`, render.js:623)
- `lightMask` (nur warm, render.js:725)
- `paintNight` (Lichtbild B nur für Blau, render.js:810/828–835)
- `nightLights` (Farben, Fleck oder Quadrat)
- `glNightRecs` (`glSolid(f)`, gl.js:479–494)
- `warmPre`/`nightPanes`

**Darum: nur warm oder `'blue'` verwenden.**

### 1.3 Licht in Bildchen (weit weg)

| Name | Ort | Rolle |
|---|---|---|
| `paintSprite(halfW, up, down, drawFn)` | render.js:609–628 | Eigene Leinwand, `GLOW_SINK = sink`, `SPRITE_PAINT = true`. Bei `nightPicOn()` ohne Atlas und ohne Maske (`noMask`). Nie verschachtelt (Z. 610). `afterMovers` wird abgeschnitten (Z. 622). Liefert `e = {c, ox, oy, glows, maskTodo, paint: {…, drawFn}}`. |
| `cropSprites`/`cropSprite`/`cropApply` | render.js:634, 685, 704 | Zuschneiden am Bildanfang. Verschiebt die `q` der Lichter (Z. 718). Lichtmaske über `lightMask` (Z. 724–758). |
| `putSprite(e, cx, cy, z)` | render.js:877–894 | Ohne Lichter nur `drawImage`. Mit `nightPicOn()` und `globalAlpha === 1` über `putNight`. Sonst: Schein (halo) vor dem Bildchen, dann das Bildchen, dann Scheibe oder Maske. Blau: Schein danach. |
| `nightPicOn`, `nightFull` | render.js:778, 775 | Licht an (`night > 0.15 && isLive()`) bzw. volle Nacht. |
| `nightOf`, `paintNight`, `putNight` | render.js:794, 803–843, 863–874 | Das Löschbild malt `drawFn` **noch einmal** mit `night = NIGHT_MAX` auf Schwarz. `drawFn` muss deshalb wiederholbar sein, ohne Nebenwirkungen, und `night` zur Malzeit lesen. Eingesetzt wird mit `night/NIGHT_MAX`. Blaue Lichter landen als fester Fleck im Lichtbild. |
| `preLit`, `prewarm`, `withNight`, `DUSK_PRE` | render.js:781–790 | Vorwärmen kurz vor 0,15. **Jede Bildchen-Funktion mit `lit` im Schlüssel ruft `if (preLit()) prewarm(keyOf(1), zs, make, ver)`** (Regel 143). |
| `warmPre`, `nightPics`, `nightPanes`, `nightSeen`, `nightWarm`, `BLUE_SPOT` | render.js:791–793, 846 | Hilfsdaten je Bild für `drawNight`. |

**Eigene Bildchen-Speicher** wie `hillSprites` (hills.js:162, 387–413) und `roofSprites` (roofs.js:507) malen mit `g = cg` **ohne** `SPRITE_PAINT`. Dort ist `isLive()` falsch, ein `glowQuad` darin wirkt also nicht. Die Dächer lösen das so: Licht **nach dem `drawImage` live** stanzen (roofs.js:563–568).

### 1.4 Licht im GL-Bild

| Name | Ort | Rolle |
|---|---|---|
| `glOnWorld()` | gl.js:174 | Wahr, wenn `GLPASS` läuft und `g` die Welt ist, also `ctx` oder `LA.x`. Nie beim Malen eines Bildchens. |
| `nightK`, `glOut`, `glOutQuad` | gl.js:176–185 | Löcher als Rechtecke mit negativer Deckkraft, Stärke im Shader (`nk`). `glOutQuad` nimmt **p0, p1, p3 als Parallelogramm**: Lichter immer als `[p0, p1, p2, p3]` übergeben, Ecke–Nachbar–Gegenüber–Nachbar. |
| `glLive(x, y, l, u, r, d, fn)` | gl.js:269–299 | Live-Zeichnen in eine Zelle der Sammelfläche. Löcher aus `fn` kommen **nach** dem Rechteck der Zelle (Z. 296–298). Macht das Feld „lebendig“. Ist der Rahmen zu klein, wird die Zeichnung abgeschnitten. |
| `glNightRecs`, `glDynLights`, `glStaticLights` | gl.js:479, 518, 655 | Lichtschicht in vier Phasen. Lichter von Boden und ruhenden Feldern liegen im Standbild, der Rest kommt je Bild neu. |
| `glRecTile` | gl.js:608 | Merkt Licht-Bereiche **nur um tileA** (render.js:2195–2197). **Lichter aus tileB sind immer dynamisch**, das ist für Brücken in tileB richtig. |
| `glEnd`, Nacht | gl.js:396–474 | Welt mit Löchern ins Zwischenbild, Nachtblau, Lichtschicht `destination-over`. |
| Himmel | render.js:2210–2211 | Ballons und Zeppelin stanzen nachts mit `GL.sky` vor `glEnd`. |

### 1.5 Laternen, Strom und wie Licht an und aus geht

**Deko-Laterne:**
- `drawLantern`, draw-schmuck.js:11–56: `dark = T.rail.power.dark.has(x,y,slot)`, `lit = night > 0.15 && isLive() && !dark`.
- Lampenfarbe: lit `#ffe58a`, dunkel und nachts `#9a978c`, tags `#fff7d6`.
- Gaslaternen-Kopf: `box(cx, cy−22z, 2.6z, 1.4z, 5z, lamp, col, 3z)`, danach `glowQuad` auf die Glasfläche mit Radius 34z.
- Die Rahmenfarbe ist `lookCol('laterne', t)`.

**Straßenlaterne** (`drawStreetLamp`, draw-schmuck.js:61): Kopf mit Radius 16, dazu `pool` als winzige Lichter mit großem Radius für den Lichtfleck am Boden (Z. 71–74).

**Linienlichter** (draw-edges.js) sind Vorlagen für kleine Brückenlichter:
- `edgeLit(id)` (239), `lampAt` (240, Minilaterne auf Pfosten, `box` 1.5/0.8/3, Radius 24z)
- `hangLantern` (246), `bulbsAlong`/`bulbAt` (255/259, Lichtpunkte mit Radius 8z), `lampions` (223)
- **Eine ganze Linie zählt als eine Laterne** (`'E'+k`), egal wie viele Lichter sie hat.

**Strom** (`computePower`, rules.js:2784–2808):
- Gilt nur, wenn `city` (es gibt Kraftwerke oder Windräder sind frei).
- Die Laternenliste ist sortiert und stabil: Deko-`laterne` (`k,i`), Straßenlaterne doppelt, Laternen auf Dächern (`k,ROOF_TOP_SLOT0+i`), dann `edgeLamps()` (rules.js:1332, Kennungen `E`/`A`/`G0`/`G1`/`P`).
- Je angefangene `LAMPS_PER_POWER` (10, rules.js:2343) braucht es 1 ⚡. Reicht es nicht, kommen sie in `dark`.
- Ohne Strom zählt die Schönheit nur halb (`NO_POWER`, rules.js:766/768).
- Anzeige im Windrad-Fenster: „Laternen n“ (ui.js:2070).
- Kosten: Laterne 40 Taler + 1 Metall, `design: 150` (Kunstakademie), Straßenlaterne 180 + 3 Metall (data.js:132/135).

**Wie andere Dinge Licht an/aus haben:**
- Zaun-Stile über `EDGE_LIT` (data.js:1030).
- Dachformen über `ROOF_STY[form].lamp` (roofs.js:564), ohne Strom.
- ⚙️ „immer Tag“ setzt `night = 0` (render.js:1623).

**`'blue'` im Bestand:** Kristall-Deko, Kristallfels (render.js:2091), Kristallweg `pathGlow` (draw-objects.js:1142), Kristall-Fußgängerbrücke. Auf Brücken leuchtet ein Kristallbelag heute **nicht**: `bkWegPaint` und `drawWegBridge` rufen kein `pathGlow` auf.

---

## 2. Farben

### 2.1 Werkzeuge (draw-base.js)

- `mix(a, b, t)` (Z. 8): linear in sRGB.
- **`shade(h, t)`** (Z. 33–39): t < 0 mischt zu Schwarz, t > 0 zu Weiß. Zwischengespeichert, beachtet `REPAINT_MAP`. Braucht **`#rrggbb`** (wegen `hexToRgb`).
- **`C(h)`** (Z. 42–53): wendet `REPAINT_MAP`, `RUIN` und `FOG` an (mischt zu `#e8efe3` 0,55). **Mit rgba-Text und `FOG` entsteht eine ungültige Farbe.** Halb durchsichtige Farben deshalb roh übergeben, ohne `C()`, wie in `drawArch` Z. 793.
- `LIGHT` (Z. 94): Wandseite −0,22 usw. `box()` (Z. 95) schattiert damit.
- Umfärben (Block 72): `REPAINT`, `repaintMap`, `REPAINT_MAP` (Z. 15–31). `drawObject` setzt und löscht es in `try/finally` (draw-objects.js:1615–1621). Damit ließe sich eine Grundfarbe tauschen, und Laternen in derselben Grundfarbe färben automatisch mit. Vorsicht: Belag-Töne, die zufällig gleich sind, würden mitgetauscht.

### 2.2 Paletten und Freischaltung

- `WALLS`/`ROOFS` (data.js:1106/1108): frei sind `FREE_COLORS` = 3. `colorOk`/`colorsOf` in rules.js:921.
- `BUSH_COLS` (data.js:1115); `LANTERN_COLS` u. a. (data.js:1130 ff.).
- **`DECO_LOOKS`** (data.js:1145):
  - `bruecke` steht in **Z. 1147**: `cols: null`, `forms: [holz, stahl]`, gleich `BK_ART_IDS`.
  - **Der Index ist der gespeicherte Wert, nie umsortieren, Neues hinten anhängen.**
  - `DESIGN` (data.js:1174–1184) erzeugt aus jeder Form oder Farbe mit `design` einen Kunstakademie-Eintrag `b:form:id` bzw. `b:col:id`.
- `lookCol`/`lookForm` (draw-schmuck.js:6–7); `lookOk`/`decoLookNew` (rules.js:1721/1727). Für neu Gebautes gilt `state.paintNew[b] = {form, col}`.
- **Ladereihenfolge:** `data.js` steht vor `draw-objects.js`. Will man `DECO_LOOKS.bruecke.cols` mit Brückenfarben füllen, muss die Liste nach data.js umziehen. Jeden globalen Namen gibt es nur in einer Datei. `bruecken.js` lädt nach draw-objects, draw-schmuck und hills, vor render und gl (index.html:61–82).

### 2.3 Brückenfarben heute

**Wasser-Wegbrücke:**
- `BRIDGE_COLS` (10), `PLANK_COLS` (5), `BRIDGE_LOOK` mit `holz`/`stein`/`ziegel`/`rot` (`lift`, `side`, `deck`, `plank`, `rail`, `wall`), draw-objects.js:950–957.
- Anwendung in `drawWegBridge` Z. 968–969:
  - Mauerart: `side = bc`, `rail = shade(bc, 0.1)`.
  - Sonst: `side = shade(bc, −0.15)`, `rail = bc`.
  - Planken: `deck = pc`, `plank = shade(pc, −0.22)`.
- Die Art kommt aus `bridgeKind(t)` = `t.brk || BRIDGE_OF_STYLE[style] || 'stein'` (rules.js:1865–1866). Ziegel gehört zu kopf, klinker, terrakotta, fisch, blueten. `'m:…'`-Beläge werden Stein.
- Ziegel zeichnet ein **anderes Mauerwerk** (`'bricks'`, kleinere Steine `RH`/`BL`, draw-objects.js:995, 1070–1072).
- Gespeichert in `tileOut` (state.js:85–87).
- Gesetzt über `setBridgeColor` (rules.js:2073: **kostenlos**, ganze Brücke über `bridgeSpan`, `groundVersion++`, `save`, kein `recalc`).
- Beim Verlängern übernimmt das neue Feld die Farben (actions.js:157).
- Fenster: ui.js:1927–1933, Knöpfe 2044–2047. Das erste Feld „bunt“ heißt „wie die Brücke“ (`null`). Art und Belag kosten Geld (`setBridgeKind` rules.js:1988, `setBridgeStyle` 2060).

**Fußgängerbrücke** (Bahnübergang):
- `ARCH_LOOK` holz/stein/kristall und `archLook(t)`. `'weg'` wird aus dem Wegbelag abgeleitet (draw-objects.js:755–766).
- Kosten in `FOOT_STYLES` (rules.js:2262). Beim Wechsel gibt es das alte Design voll zurück, das neue wird bezahlt (`setCrossing` 2290).
- Alte Stände: `footPaid: true` bedeutet Holz (`footPaidOf` 2269).
- Keine Farbwahl.

**Brücke zwischen Anhöhen:** `BK_LOOK` mit fester Holz- und Stahl-Palette (bruecken.js:339). Keine Farbwahl. Die Art wechselt man gegen den Preisunterschied (`bkSetArt` 180).

**Gleis-Wasserbrücke:** feste Holzfarben in `drawRailBed` (draw-objects.js:658–668, 710–718).

**Zum Umbau „Ziegel → Stein eingefärbt“ und „Rot → Holz eingefärbt“:**
- `BRIDGE_COLS[8] = #b5654a` ist genau die Ziegel-Seitenfarbe. Das Ziegelmuster `'bricks'` geht aber verloren, wenn nur die Farbe übernommen wird.
- Bei Rot: `BRIDGE_COLS[3] = #d9483b` ist das Rot-Geländer. Die Seite wird über `shade` zu `#b83d32` statt `#a8392f`. Das Rot-Deck `#c79a6a`/`#9a7048` gibt es nicht in `PLANK_COLS`, und der `lift` ist 8 statt 3.
- **Ganz gleich sieht es nur mit zusätzlichen Paletteneinträgen oder einem Musterschalter aus.**

### 2.4 Einfärben im Fenster und Kosten (Überblick)

- Deko: `decoLookHtml`/`wireDecoLook` (ui.js:1695/1727). Kostenlos, mit ↶, „Für alle übernehmen“, „Neu gebaute bekommen das“. Freischalten kostet in der Kunstakademie `designPrice` (Taler nach Einkommen) plus `designIdeas` (rules.js:943/952).
- Stil-Leiste: `lookChips`/`wireLookChips` (ui.js:1663/1674). Je ein Knopf für Form und Farbe; der Farbknopf erscheint von selbst, sobald `L.cols` existiert.
- `lookThumb(b, form, col)` (ui.js:1619). Der Zwischenspeicher-Schlüssel ist `b|form|col`. **`'bruecke'` übergibt `col` heute nicht** (Z. 1633).
- `thumbRaw('bruecke')` (ui.js:74) nimmt `tile.form`.

---

## 3. Bildchen, Sprites und GL-Standbild

### 3.1 Grundmechanik (render.js)

- `SPRITE_FROM`/`SPRITE_UNTIL`/`ANIM_ITEMS`/`animLive`/`SPRITE_LIVE` (449–480, 529): `'schiene'`, also auch der Bahnübergang samt Fußgängerbrücke, ist **immer live**.
- `zoomStep`/`spriteStep` (518–521).
- `getSprite(key, z, make, ver)` (541–573): `ver` ist die **Fassung**. Eine alte Fassung wird weiter gezeigt und im Zeitbudget ersetzt.
- Budget: `PAINT_MS`, Aufholen, Vorbereiten (483–514). Tausch `spriteSwapAll` (596). Aufräumen `spriteHousekeeping` (1048).
- `resetDrawCaches` (1064–1075) löscht `objSprites`, Boden, Meer, Tiefe, `ICON_SPRITES` und `hillSprites`, nicht aber `roofSprites` und `lookThumbs`.

### 3.2 Schlüssel je Bildchen-Funktion

| Funktion | Schlüssel | Fassung | Bedeutung für 160c |
|---|---|---|---|
| `spriteTile` (948–981) | geteilt: nur `look` = b, lvl, rot, wall/roof (sonst `'r'+hash`), Reihenhaus-Hashes, Rathaus, look, style, win, fl, **col, form**, cs, FOG, **lit**, Gartenweg, Vorplatz; sonst zusätzlich Platz, phase, gleise/len/wing, `cross`/`foot` | `groundVersion` (nicht geteilt) plus Uhr | `t.brc`, `t.footPaid` und neue Felder **fehlen im Schlüssel**. Bei Bildchen je Platz reicht `groundVersion++`; bei geteilten müsste jedes Aussehensfeld hinein. |
| `spriteSmall` (983–1001) | `deco|b|rot|col|form|FOG|lit|dark|variant` | keine | geteilt: `dark` steckt im Schlüssel |
| `spriteEdges` (1005–1025) | `edges|x,y|FOG|lit` | `groundVersion` | `dark` nicht im Schlüssel, `recalc` erhöht `groundVersion` (rules.js:829) |
| **`spriteFlat`** (1031–1047) | `flat|x,y|FOG|lit` (`hflat` oben) | `groundVersion` | flache Wasserbrücke, Gleisbrücke |
| **`spriteArchBridge`** (929–945) | `arch|x,y|FOG|lit` | `groundVersion` | Bogenbrücke übers Wasser; Rahmen nach oben `(A.peak + 30)·zs` |
| `drawHillTile`/`hillSig` (hills.js:387/188) | Wände, Treppen, Rampe, Schatten, Bergportal | groundVersion, drawEpoch | **`hillSig` kennt keine Brücken** |
| `drawRoofTile` (roofs.js:523) | eigene sig, Zoom (`want`) | ver | Licht live nach `drawImage` |

### 3.3 GL-Standbild

- `glFrameOk` (gl.js:303): nur weit weg, ohne Werkzeug.
- Schlüssel in `glCacheStart` (gl.js:581–582): Zoom, Größe, DPR, **`groundVersion`**, SPRITES_ON, FOG, Uhr, Post, Nachtstufen. Dazu `texEpoch` und **`drawEpoch` (`save` ruft `glTouch`, state.js:162)**.
- `glPlayTiles` (673–702) zeichnet nur Lebendiges und Bewegtes neu, außerdem jedes Bild **`roofLiveTiles` (680) und `bkLiveTiles` (681)**.
- Weg ohne Bildchen im Boden-Durchgang (`GL.stats.miss++`, render.js:1605) bedeutet „2D-Reste“: **dann wird kein Standbild aufgenommen** (gl.js:599).
- `glBgStep` (719) läuft nur über tileA.
- Brücke in tileB: `glLive(px, py, TW·z, (HILL_H+44)·z + TH·z, TW·z, TH·z+4, f)` (render.js:2187).
- **Beobachtung, nicht im Browser geprüft:** Im Abspielen läuft die flache Schleife in `worldGround` trotzdem jedes Bild (render.js:1595–1608). Ihre Rechtecke werden nie gezeichnet, ihre Lichter kommen ein zweites Mal in die dynamische Schicht. Das sieht man nicht, ist aber verschenkte Arbeit.

### 3.4 Leistungs-Wächter

- `tests/leistung-je-ding.test.js`: geht über `DECO_LOOKS[id].forms`. **Jede neue Brückenform erzeugt einen neuen Schlüssel** (`bruecke Form 2`, …), dann ist der Test rot bis `npm run leistung:neu`. Heute ist `bruecke Form 0/1 = 0`, weil `drawObject` nichts zeichnet. `bkDrawTile` misst dort niemand.
- `tests/leistung.test.js`: Welten gross, freizeitpark (15 Brückenfelder), farben, neu (**80 Brückenfelder**, darunter Ziegel- und Rot-Bögen), dach. Jede Änderung an `drawWegBridge`/`drawRailBed` ändert dort die Zahlen. Im ruhenden Bild darf nichts neu gemalt werden (repaint). **Brücken zwischen Anhöhen kommen in keiner Welt vor.**

---

## 4. Maler-Reihenfolge

### 4.1 `render()` (render.js:1611–2307)

1. Bildchen zuschneiden, `night` setzen, Licht-Listen leeren, Bildchen-Zustand, `glCacheStart`.
2. **`worldGround`** (1581–1610): Boden aus dem Zwischenspeicher bzw. live, Tiefe, flache Teile (wenn nicht zwischengespeichert), danach die **flache Schleife**. Sie zeichnet Weg- und Gleisfelder, die nicht im Boden-Bild stecken (`cachedPath` 82: Brücken und Leuchtwege, `liveFlatSet` 86). Bogenbrücken überspringt sie (1602). Weit weg über `spriteFlat`.
3. **Schatten:** Nah wird live gezeichnet (`!groundCached`), also **nach** den flachen Brücken (1652–1657). Weit weg stecken sie im Boden-Bild **unter** ihnen (`renderGroundChunk` 401–442 mit `drawShadows(near)` 439).
4. Vorschau-Rahmen (1660–1800).
5. Bewegtes je Feld in `byTile` (1803–1847). Wagen auf dem Deck: `bkCarPieces` geht über `deckPut`/`onDeck` (1817–1821). Spaziergänger oben auf dem Deck (1844). Boote unter einer Brücke bekommen `m.under` (1831–1836).
6. **Feldschleife** `visibleTiles` (1544): Diagonalen `s = x+y`, darin x aufsteigend. Je Feld **tileA, dann tileB** (2193–2199).
7. Himmel, `glEnd`, **`drawNight`** (2220–2223), Feuerwerk, Glühwürmchen, Symbole, Schilder, Vorschau-Text.

### 4.2 Inhalt von tileA (1977–2125)

Anhöhe (`drawHillTile`, `hillFlat`, `hillRelight`, hillLate), Anhebung `py -= lift`, Linien hinten (`spriteEdges`), dann das Ding:
- große Gebäude in Streifen (2046–2055),
- am Eckfeld: Deko hinten → Ding bzw. **Bogenbrücke `drawArchBridge` (2063)** → Deko vorn,
- leer: Natur, Kristallfels mit blauem Licht,
- zuletzt Geister.

Im GL-Bild läuft das Ding über `glLive` (2040–2042).

### 4.3 Inhalt von tileB (2126–2190)

Bewegtes des Felds (sortiert; Boot unter Brücke → **`drawBridgeOver`** 2139–2145), dann `afterMovers` (vordere Hälfte der Fußgängerbrücke), `archWalkers`, Überdachungen, **zuletzt die Brücke zwischen Anhöhen** (2176–2188):
- `bkFadeNow` mit `SEE_A`,
- `bkDrawTile(…, after)`: Figuren und Wagenstücke zwischen Deck und vorderem Geländer,
- GL: `glLive`.

**tileB setzt `FOG` nicht selbst**, nur bei Bewegtem (2132).

### 4.4 Welche Brücke wo gezeichnet wird

| Art | Daten | Wo und wann | Weit weg / GL | Licht | Schatten |
|---|---|---|---|---|---|
| Weg-Wasserbrücke flach (1 Feld oder offenes Ende) | `t.bridge`, `brk`, `brc`, `brw`, `style` | Boden-Durchgang, flache Schleife: `drawFlat` → `drawPath` → `drawWegBridge` (draw-objects.js:959) | `spriteFlat`; GL im Boden-Teil des Standbilds | keins | keiner |
| Weg-Wasserbrücke Bogen (`bridgeArch`, rules.js:1873) | wie oben; Höhe `archDeck`, Bögen `archOpenings`, Wand `archWall` (draw-objects.js:1038) | tileA am Feld zwischen Deko hinten und vorn | `spriteArchBridge`; GL `glLive` | keins | keiner |
| Gleis-Wasserbrücke | `schiene` + `bridge` | Boden-Durchgang: `drawRailBed`, Brückenteil 658/710 | `spriteFlat`; Züge in tileB darüber | keins | keiner |
| Fußgängerbrücke am Bahnübergang | `cross`, `foot`, `footPaid` | tileA: `drawCrossing` → `drawArch` hintere Hälfte; vordere über **`afterMovers`** in tileB | immer live (`SPRITE_LIVE`) | Kristall: blau aufs Deck (841) | keiner |
| Brücke zwischen Anhöhen | `state.bruecken` (Anker → `{ax, n, art, weg?, gleis?}`) | **tileB** je Deckfeld: `bkDrawTile` (bruecken.js:385) → `bkPaint` (345) zeichnet nur `t ∈ [i−½, i+½]`, Überlapp `ext` 0,012 ins Folgefeld | **immer live**; GL: jedes Bild lebendig | keins | `drawBkShadows` (bruecken.js:406) im Boden-Bild: Deck um SUN·HILL_H verschoben |

### 4.5 Schatten

- `drawShadows(want)` (render.js:147–164): Gebäude über `shadowOf` (112, `SHADOW`/`ART_SHADOW`; Felder auf Anhöhen ausgenommen), dann Dächer (roofs.js:573), Anhöhen (hills.js:422) und Brücken.
- `want([x, y], w, h)` bekommt **das Feld, kein Index oder Array** (Lehre aus 160a).
- Farbe `SHADOW_COL`, Sonne `SUN = {dx: .55, dy: .12}` (render.js:101–102). Mit ⚙️ Schatten aus wird nichts gezeichnet.
- Weil Schatten im Boden-Bild stecken, braucht jede Änderung an Form oder Höhe `groundVersion++`.

---

## 5. Zusammenhänge mit anderen Systemen

- **Strom und Schönheit:** Bekommen Brückenlichter Strom, gehören sie in die `lamps`-Liste von `computePower` (eigene, sortierte Kennung wie bei `edgeLamps`). Beim Zeichnen fragt man dann `T.rail.power.dark.has(id)`. Optional halbe Schönheit wie Zeile 766.
- **Neu zeichnen nach Änderungen:** `recalc` macht immer `groundVersion++` (rules.js:829). Das erneuert Bildchen je Platz, das Standbild und `bkFresh` (bruecken.js:31–41). `bkSetArt` und `setBridgeColor` erhöhen nur `groundVersion`, ohne `recalc`.
- **Speichern:** Wasserbrücken über `tileOut` (state.js:85–87, 108; das Lesen übernimmt Felder ungefiltert, state.js:344). `state.bruecken` wird streng geschrieben und gelesen (state.js:149–150, 363–368): `art` außerhalb von `BK_ARTEN` wird `'holz'`, **`n > BK_MAX` (4) wird verworfen**.
- **Live-Spiegel, Besuch, Cloud:** `state.bruecken` liegt im öffentlichen Rest. Ältere App-Versionen lesen „holz“, werfen lange Brücken weg und verlieren beim Speichern neue Felder.
- **↶:** `UNDO_MAPS` und Brückenprüfungen (actions.js:1094, 1166–1195, `groundVersion++`).
- **Kunstakademie:** Formen und Farben mit `design` erscheinen dort von selbst. Freischalten über Inseln braucht eine eigene Prüfung neben `lookOk`.

---

## 6. Regeln für die neue Brückenzeichnung

1. **Hohes nie in den Boden-Durchgang.** Alles, was sichtbar über den Boden ragt (Bogen, Fachwerk, Pfeiler, Laternen), gehört in die Objekt-Reihenfolge, also tileA oder tileB. Sonst liegt alles Dahinterstehende darüber (Grund für Block 150). Wer flache Wasserbrücken umzieht:
   - in `worldGround` überspringen wie Z. 1602,
   - `cachedPath` muss weiter `false` liefern,
   - Test `webgl.test.js` „live gezeichnete Wege“ und `liveFlatSet` anpassen.
2. **Was vor Bewegtem liegen muss, nach dem Bewegten zeichnen:** vorderes Geländer, vorderes Fachwerk, vordere Bogenhälfte, vordere Laternen.
   - Wege dafür: `afterMovers` wie `drawCrossing` (Transform merken, draw-objects.js:858–859) oder tileB mit `after`-Rückruf wie `bkDrawTile`.
   - Für Boote darunter: `drawBridgeOver` (render.js:913) muss die neue Zeichnung kennen und **nur das Vordere** zeichnen (Muster `BRIDGE_FRONT`), danach Bewegtes auf der Brücke noch einmal (Regel 112).
3. **Je Feld nur der eigene Längsabschnitt** `[i−½, i+½]` (wie `bkPaint`).
   - Undurchsichtige Flächen dürfen 0,012 ins **Folgefeld** überlappen (gegen Fugen unter Windows).
   - **Halb durchsichtige Teile (Glasgeländer `rgba`) nie überlappen**, sonst gibt es dunklere Striche an jeder Feldgrenze.
   - Pfeiler auf Kachelkanten genau einem Feld zuordnen und prüfen, dass Deko-Ecken und Wagen des Nachbarfelds richtig davor bzw. dahinter liegen.
   - Die ferne Anhöhe (Ende +1) wird später gezeichnet und deckt das Brückenende von selbst ab; die nahe (−1) liegt darunter.
   - **Was an die Wand der Anhöhe gehört** (Ansatz knapp unter der Kante): entweder in der Brückenzeichnung oder `hillSig` um die Brücke erweitern. Nie stillschweigend im Bildchen der Anhöhe.
4. **Licht nur über `glowQuad`**, und zwar **nach** dem Malen des Leuchtenden:
   - Lampen auf dem hinteren Geländer **nach dem Deck** zeichnen, sonst deckt das Deck ihren Schein.
   - Die Lampe vorn kommt nach dem vorderen Geländer.
   - Nie nach `drawNight` obendrauf malen.
   - Vierecke als Parallelogramm übergeben.
   - Nur warm oder `'blue'`. Kristall nimmt blau (keine Scheibe, Struktur bleibt).
   - Die warme Scheibe klein halten, nur das Glas, denn sie wird nachts flach `#ffd873`.
5. **Wenige Lichter je Feld:**
   - Jedes Licht kostet `save`/`restore` und `drawImage`, nachts zusätzlich eine Fläche.
   - Im selben 24-px-Feld wird jedes weitere Licht kleiner und schwächer (`glowCells`). Weit weg werden die Lichtpunkte im Abstand eines halben oder Viertelfelds aus dem Entwurf (tools/brueckenlicht-entwurf.js) deutlich schwächer als bei Zoom 1,8.
   - Ein Lichtband lieber aus einem Viertel-Raster mit Bedacht oder aus wenigen breiten Lichtern.
6. **Licht an/aus und Strom:**
   - Aus: kein `glowQuad`.
   - An, aber dunkel: Lampe in Grau `#9a978c` zeichnen, ohne `glowQuad`.
   - Bildchen je Platz mit Fassung `groundVersion` sind damit richtig, solange jeder Schalter `groundVersion++` macht. Bei geteilten Bildchen gehören `dark` und alle Aussehensfelder in den Schlüssel.
7. **Weit weg nicht Strich für Strich** (Regel 124). Zwei Wege:
   - **(a)** `paintSprite`/`getSprite`: Schlüssel mit Platz, `FOG` und `lit`; Fassung `groundVersion`; `if (preLit()) prewarm(…)`. Volle Nacht kommt dann als Löschbild ohne einzelne Lichter. Das `drawFn` muss wiederholbar sein und `night` zur Malzeit lesen. Keine Figuren und keine `afterMovers` darin.
   - **(b)** Eigener Speicher wie `roofSprites`: Rückseite mit Deck, dann Figuren und Wagen, dann vorderes Bildchen (wie Dach `e.fc`). Licht dann **live nach `drawImage`** stanzen. Und `resetDrawCaches` bzw. die Pixeldichte bedenken.
8. **GL-Rahmen groß genug wählen:** In `glLive` muss alles hinein, vom Bogenscheitel samt Laterne bis zum Pfeilerfuß. Heute geht der Rahmen der Anhöhen-Brücke `(HILL_H+44+TH)·z` nach oben und `TH·z+4` nach unten; bei Wasserbögen `(peak+30)·zs`.
9. **Farben nur als Hex** in `C()`/`shade()`; `rgba` roh übergeben. Laternen und Lampenrahmen aus **derselben Grundfarbe** ableiten (z. B. `shade(bc, −0.15)`), dann färben sie mit. Mit `REPAINT_MAP` immer `try/finally`.
10. **`FOG = false` selbst setzen**, wenn in tileB gezeichnet wird (Brücken stehen immer auf eigenem Land).
11. **Durchsicht und Bauen darunter:** blass über `globalAlpha`. Ein Löschbild nimmt `putSprite` nur bei Deckkraft 1. Lichter stanzen trotzdem voll; das ist bekannt und gilt auch für Gebäude.
12. **Schatten im Boden-Bild:** Beim Bogen jeden Stützpunkt um `SUN × Höhe an dieser Stelle` versetzen, nicht konstant um HILL_H.
13. **Ohne Brücken und ohne Anhöhen muss alles so schnell laufen wie heute:** Jede neue Abfrage früh über `bkOn()` bzw. `state.hills.size` abbrechen.

---

## 7. Risiken

**Alte Stände:**
- Ziegel und Rot lassen sich mit `BRIDGE_COLS`/`PLANK_COLS` allein **nicht pixelgleich** umwandeln: Ziegelmuster, Rot-Seite, Rot-Deck und `lift` fehlen (siehe 2.3).
- Viele alte Brücken haben **kein `brk`**; ihre Art ergibt sich aus dem Belag.
- Die Tests `neuwelt.test.js` (erwartet `9ziegel`, `6holz`, `3rot`), `bruecken.test.js:73` und `bogenbruecken.test.js:47` gehen über die alten Arten.
- Indizes in `DECO_LOOKS.bruecke` (gespeichert in `state.paintNew.bruecke.form`) nur hinten anfügen.
- Ältere App-Versionen (Cloud, Freunde, Besuch) machen aus neuer Art „holz“, verwerfen `n > 4` und verlieren neue Felder beim nächsten Speichern (state.js:363).

**Bildchen:**
- Neue Aussehensfelder ohne `groundVersion++` oder ohne Eintrag im Schlüssel zeigen weit weg das alte Bild.
- `lookThumb` merkt sich nur `b|form|col`. Zeigt das Bild auch Licht, Zacken oder die Familie, braucht der Schlüssel mehr.

**Leistung:**
- Die Brücke zwischen Anhöhen ist heute ungemessen und jedes Bild live, im GL-Bild immer lebendig. Mehr Linien, Pfeiler und Lichter fallen dort voll ins Gewicht.
- Empfehlung: einen Eintrag „Brücke je Feld“ in leistung-je-ding und eine Testwelt mit `state.bruecken` in `leistung.test.js`.
- Neue Formen machen `leistung-je-ding` rot, bis `npm run leistung:neu` läuft (Begründung in AUFGABEN.md).

**Tests hängen an Signaturen:**
- `bruecke-gleis.test.js:141–158` ersetzt `bkDrawTile` und erwartet den Rückruf als **sechstes** Argument.
- `bruecke.test.js:125–132` ruft `bkDrawTile(x, y, px, py, z)`, `thumbRaw('bruecke')`, `lookThumb('bruecke', 1, 0)` und `drawBkShadows(() => true)`.

**Reihenfolge:**
- Werden Wasserbrücken aus der flachen Schleife geholt, ändern sich das Boden-Standbild (`GLS.gEnd`), `liveFlatSet`, die „2D-Reste“-Regel und die Tests in `webgl.test.js` und `bruecken.test.js:107`.

**Licht:**
- Lichtbänder werden weit weg schwächer (`glowCells`).
- Ein Lichtton außer warm oder blau würde die ganze Lichtkette berühren.
- Ein Kristallbelag auf Brücken leuchtet heute nicht.

---

## 8. Tests, die den Bereich abdecken

| Datei | Was sie prüft |
|---|---|
| `tests/nacht.test.js` | `glowQuad` stanzt (`destination-out`, Fenster und Schein); Streifen-Lichter nur einmal (`drawNight` gibt 2 zurück); tagsüber nichts; Nachtblau `source-atop`, Fenster `destination-over` |
| `tests/nachtlicht-bildchen.test.js` | `punchGlow` mit halo, pane, mark; Reihenfolge in `putSprite` (Schein, Bild, Maske; blau danach); `inQuad`, `lightMask` |
| `tests/tempo.test.js` | Bildchen weit weg; Dämmerung und volle Nacht als Nachtbild; nie mitten im Bild zurücklesen |
| `tests/tempo-schritt1/2/3.test.js` | Bildchen ohne Licht (ein `drawImage`); Zuschneiden verschiebt Lichter; `afterMovers` nicht im Bildchen, nie verschachtelt; Bestandsliste Bewegtes (`ANIM_ITEMS`); Bahnübergang bleibt live; Zoomstufen und Tausch; Schlüssel-Wächter (geteilte Bildchen); Fassung nach `recalc`; Vorwärmen; Nachtbild mit Löschbild, Geister ohne |
| `tests/webgl.test.js` | 2D bleibt ohne WebGL; sichtbare Felder; `liveFlatSet` gleich `cachedPath` (Brücken); Haken; dieselbe Lichtschicht in 2D und GL; warmer Schein nach blauem Fleck |
| `tests/strom.test.js:121`, `tests/strassenlaterne.test.js` | je 10 Laternen 1 ⚡, ohne Strom dunkel und halbe Schönheit; Straßenlaterne doppelt; alle Formen Tag und Nacht |
| `tests/kristall.test.js:97`, `tests/tageszeit.test.js:60`, `tests/einstellungen.test.js:45/54` | Kristall-Deko Tag und Nacht; Sternschnuppe stanzt nicht; immer Tag; Schatten aus |
| `tests/draw.test.js` | jedes Objekt in jeder Stufe und Richtung; ganze Szene; Umfärben (`REPAINT`) gilt nur beim Zeichnen |
| `tests/schmuck.test.js` | `DECO_LOOKS`: Kennungen eindeutig, Bezahltes in `DESIGN`, erste Formen frei; `paintNew`; Fenster und Leiste |
| `tests/bruecke.test.js` | Brücke zwischen Anhöhen: Bauen, Regeln darunter, Weg aufs Deck, Abriss, ↶, Speichern streng, **Zeichnen** (`bkDrawTile`, Vorschaubild), **Schatten wirklich gezeichnet** |
| `tests/bruecke-gleis.test.js` | Gleis aufs Deck, Zug darüber, **Stücke je Feld im Rückruf des Decks** (ersetzt `bkDrawTile`), Stahl zeichnen |
| `tests/bruecken.test.js` | Wasser-Wegbrücken: Art nach Belag, Art umstellen, **Farben `brc`/`brw` über Fensterknöpfe**, ganze Brücke, Belag; `cachedPath` false für Brücken |
| `tests/bogenbruecken.test.js` | Höhe, Bögen, Boote; **alle Arten (Stein, Ziegel, Holz, Rot) × Längen zeichnen** nah, weit, über Boot; breite Brücken |
| `tests/uebergang.test.js`, `tests/baenke-fussbruecke.test.js` | Fußgängerbrücke: Designs (`FOOT_STYLES`), `footPaid: true` ist Holz, alle Designs zeichnen Tag und Nacht; Breite `ARCH_W`, Rampenwände |
| `tests/neuwelt.test.js`, `tests/testwelt-freizeitpark.test.js` | Testwelten mit Ziegel-, Holz- und Rot-Bögen sowie einer Fußgängerbrücke; die Erwartungen hängen an `brk` |
| `tests/schiffe-bruecken.test.js`, `tests/kopieren.test.js:146` | Seewege unter Brücken; Kopierpreis mit `footPaid` |
| `tests/leistung.test.js`, `tests/leistung-je-ding.test.js` | Zeichenarbeit je Bild (Welten neu und freizeitpark mit Wasserbrücken) und je Ding (`bruecke Form 0/1 = 0`) |

Entwürfe und Prüfwerkzeuge für Bilder:
- `tools/brueckenlicht-entwurf.js`: abgenommenes Nachtlicht, zeigt Minilaterne, Lichtpunkte, blauen Streifen und Zacken.
- `tools/brueckenfamilie-entwurf.js`
- `tools/bruecke-pruefung.js`, `tools/bruecke-gleis-pruefung.js`