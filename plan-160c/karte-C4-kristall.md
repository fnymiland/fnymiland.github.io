## C4: Bauplan für Kristall K1 mit Zacken (Fußgänger-Brücke zwischen Anhöhen)

Ich habe nur gelesen. Es lief kein Test, kein npm und kein Browser, und ich habe keine Datei geändert. Grundlage ist der Stand `327147a` (C2g).

**Aufwand:** Hoch, wie im PLAN. Den Teil, der das Bild verändert (C4b), als eigenen Commit bauen.

**Reihenfolge:** C3 (Stein) zuerst einbauen. C3 fasst vermutlich dieselben Stellen an: `bkTileArgs` muss das Material aus `brLook` liefern, `brBox` wächst mit Pfeilern bis zum Boden, und `brClear` braucht wegen der Stein-Laibung (Ansatz 13) eventuell Parameter. C4 baut darauf auf.

---

### 1. Was im Code heute fehlt oder hindert

| Stelle | Befund | Folge für C4 |
|---|---|---|
| bruecken.js:19 `bkArtOf` | `BK_ARTEN` kennt nur holz und stahl, also wird 'kristall' zu 'holz'. `bkTileArgs` (:409) übergibt `art: bkArtOf(c.b)`. | Eine Kristallbrücke würde als Holz gezeichnet. Das Material muss aus `brLook(b,'anhoehe').mat` kommen. |
| brueckenfamilie.js:63–69 `brLegacyLook` (anhoehe) | Altfelder deuten nur stahl, sonst holz. | Kristall gilt nur mit gültigem `brp` (brIsNew). Tests und Prüfwelt müssen `brp` setzen, sonst sieht man Holz. |
| brueckenbild.js:173 `BK_FUSS` | Hat keinen Eintrag `kristall`. Die Weiche in :22 geht nur bei `BK_FUSS[art]` in den Fußgänger-Maler. | Ein neuer Zweig ist nötig. |
| render.js:2189 | `bkDrawMoving` läuft nur bei `ms`, `figs` oder `late`. | Glas, das nur in tileB liegt, fehlte ohne Bewegtes ganz. |
| gl.js:685 | Die Liste für tileB ist `byTile ∪ roofLiveTiles ∪ onDeck`. | Im GL-Standbild fehlte das Glas. |
| brueckenfamilie.js:242 `brClear()` | Liefert immer `BK_CLEAR` = HILL_H − 6 = 20. | Reicht für die Zacken, siehe §3. |
| tools/bruecken-glitch.js | Liegt nicht im Repo. Es war in A1 geplant, B2 und C2 verweisen darauf. | Die Zählung „Glas je Bild mit und ohne Figur“ in einen Test legen oder das Werkzeug jetzt anlegen. |
| tools/brueckenwelt.js | Hat keine Kristallbrücke. | Prüfwelt ergänzen, aber die Falle beim Erzeugen beachten (§6, F20). |

---

### 2. K1 in Bauteile zerlegt

Bezugsentwurf ist `tools/brueckenlicht-entwurf.js:156–175`. Er ist der letzte und abgenommene, und PLAN 2.4 bezieht sich auf ihn. Der Streifen bei `ri+0,6` in `brueckenfamilie-entwurf.js:157` ist überholt.

**Umrechnung Entwurf → Spiel**
- t läuft längs der Brücke ab der Mitte von Feld 0. Es gilt A = −½, B = n − ½, und Feld i reicht von t0 = i − ½ bis t1 = i + ½.
- u(t) = (t + ½)/n entspricht `t01` im Entwurf.
- hf(t) = `brDeckHFn('fuss', n)(t)` = HILL_H + pk·sin(πu). Für pk gilt n 1/2/3/4/8 → 5 / 10,2 / 13,0 / 15,46 / 23,4.
- Die Unterkante des Glasbands ist ri(t) = hf(t) − 3. Im Entwurf steht `H − 3 + pk·sin`, das ist dasselbe.
- Halbe Breite W = BK_W = 0,4 statt 0,3 im Entwurf, wie bei Holz und Metall.
- Strichbreite im Spiel = Entwurf ÷ 2, und `lw = max(0,6, f·z)`.

| # | Bauteil | Lage | Formel | Farbe | Strich | Entwurf |
|---|---|---|---|---|---|---|
| 1 | Glasscheibe hinten | **hg** | Band s = −W von hf bis hf+6, **ohne ext** | rgba(175,225,248,**0,30**) | – | :159, :163 |
| 2 | Pfosten hinten | h | `onEdge(4)`: senkrecht bei −W von hf bis hf+6 (auch an den Wänden) | `#d8f2fc` | 0,3 | :160 |
| 3 | Handlauf hinten | h | Linie bei −W auf hf+6 | `shade('#8fd3f2', −0,1)` | 0,65 | :161 |
| 4 | (C7) Streifen hinten | h | Linie bei −W auf hf+0,5; nachts je ¼ Feld `glowQuad` über [hf, hf+1,4], r = 7·z, 'blue' | tags `#bfe9f8`, nachts `#dff8ff` | 0,45 | :164, :67–71 |
| 5 | Deck | d | `deckTop` **mit** ext | `#e6f6fc` | – | :165 |
| 6 | Querfugen | d | nur ohne Weg; t = A + k/6 für k = 1 … 6n−1, also `onEdge(6)` **ohne** t = A und t = B | `#c3e7f5` | 0,25 | :166 |
| 6′ | Weg | d | mit Weg: `opts.wegPaint(hf)` wie bei Holz und Metall | – | – | – |
| 7 | Glasband (Bogen) | **t1** | Band s = +W von hf−3 bis hf, **ohne ext** | rgba(143,203,230,**0,78**) aus `sh('#8fcbe6')` | – | :167 |
| 8 | Kanten des Bands | t1 | nur Linie oben (hf) und unten (hf−3), keine senkrechten Enden (Falle 21) | `sh('#5aa9d6')` | 0,35 | :167 |
| 9 | Zacken (Option) | t1 | siehe §3 | – | – | :168–172 |
| 10 | Kantenglanz | t1 | Linie bei +W auf hf−0,6 | `#f7fdff` | 0,4 | :173 |
| 11 | Glasscheibe vorn | **t2** | Band s = +W von hf bis hf+6, **ohne ext** | rgba(175,225,248,**0,42**) | – | :159, :174 |
| 12 | Pfosten vorn | t2 | wie #2 bei +W | `#d8f2fc` | 0,3 | :160 |
| 13 | Handlauf vorn | t2 | Linie bei +W auf hf+6 | `#8fd3f2` | 0,65 | :161 |
| 14 | (C7) Streifen vorn | t2 | wie #4 bei +W | – | – | :175 |

Die Lagen v und o bleiben bei K1 leer. Das deckt sich mit PLAN 2.4 („L3 –“, „L6 –“).

Zur Reihenfolge im Entwurf: Scheibe hinten, Pfosten, Handlauf, Streifen, Deck, Fugen, Band, Zacken, Glanz, Scheibe vorn, Streifen. Die Zuordnung hg → h → d (tileA) und dann t1 → t2 (tileB) behält diese Reihenfolge genau bei.

**Neue Helfer in `bkPaintFuss` (brueckenbild.js:177ff.)**
- `bandT(s, h0Of, h1Of, col)`: wie `band` (:184), aber mit `ts(t1)` statt `ts(T1)`. Durchsichtiges ragt nie ins Nachbarfeld (G4, karte-licht-farbe-bilder.md:285).
- `rgbaK(hex, a)`: rechnet `C()` und `sh()` nur auf Hex und baut danach `rgba(r,g,b,a)` über `hexToRgb` (draw-base.js:7), mit eigenem Zwischenspeicher. So stimmt das Glas auch im Nebel (FOG), und es entsteht nie eine `#NaN`-Farbe (Falle 15). `C('rgba…')` liefert im Nebel eine ungültige Farbe, die Leinwand ignoriert sie still und malt mit der vorigen Farbe weiter.
- **Fugen an Feldkanten einrasten (nur das Glasband t1):** Die Glasscheiben hinten (hg) und vorn (t2) bekommen an jeder Feldkante einen deckenden Pfosten, der die Naht verdeckt. Das Glasband in t1 hat keinen.
  - Darum dort die x-Werte bei t0 und t1 auf ganze Gerätepunkte runden: mit `m = g.getTransform()` gilt `x' = (round(m.a·x + m.e) − m.e)/m.a`. So macht es auch der Streifen-Zuschnitt in render.js (`snap`).
  - Die Feldkante ist bei festem s eine senkrechte Linie auf dem Schirm, deshalb ist das genau.
  - In der Testattrappe gibt es `getTransform` nicht: abfangen.
- Farben in `BK_FUSS.kristall`: `{ glass:'#afe1f8', aBack:.30, aFront:.42, band:'#8fcbe6', aBand:.78, edge:'#5aa9d6', post:'#d8f2fc', rail:'#8fd3f2', deck:'#e6f6fc', seam:'#c3e7f5', hi:'#f7fdff', z1:'#7fc4e8', z2:'#c9b8f0' }`. Die Farben des Bands stimmen mit `ARCH_LOOK.kristall` überein (draw-objects.js:762).
- Nord-Süd (G11): `sh()` auf Bandfüllung, Bandkanten und Zacken anwenden, nicht auf Geländer, Pfosten und Glanz.
- Die Bauteile als Funktionen von (P, hf, s) schreiben. Dann können D2 (Wasser, `archDeck`) und F1 (Übergang, `archH`) sie übernehmen.

---

### 3. Zacken (Option `look.zacken` = Kristall + Fußgänger + `brz 'an'`)

Entwurf: brueckenlicht-entwurf.js:168–172, Form wie K2 in kristallbruecke-entwurf.js:73–84.

**Formeln**
- k ist eine **globale** Nummer ab dem Anker, damit das Muster nicht von der Feldaufteilung abhängt. Je Feld i: k0 = round((t0 − A)·7) = 7i, dann k = max(1, k0) … k0+6.
- Lage: t_k = A + (k+½)/7.
- Länge: len_k = 3 + 4·|sin(2,3·k)|·sin(π·u(t_k)).
- Spitze: tip = ri(t_k) − len_k. Ist tip < `brClear()`, die Zacke weglassen. Das ist die Regel `H−6` des Entwurfs, geschrieben über `brClear` (G8).
- Fläche: Dreieck [P(t_k−0,05, W, ri(t_k−0,05)), P(t_k+0,05, W, ri(t_k+0,05)), P(t_k, W, tip)]. k ungerade → `#7fc4e8`, k gerade → `#c9b8f0`, beides mit `sh()`.
- Umriss als **offene** Linie links → Spitze → rechts, in `sh('#5aa9d6')`, Breite 0,2, `butt`. Kein `closePath`, dann `stroke` (Regel aus C2).
- Prisma (G1): Zacken stehen auf (j+½)/7, also mindestens 0,071 von der Kante entfernt. Mit der halben Breite 0,05 bleiben sie im Feld und berühren nie eine Kante.
- Wie im Entwurf beginnt k bei 1. Feld 0 hat also 6 Zacken, alle anderen 7. Am linken Ende fehlt die Zacke bei 0,5/7, am rechten steht eine. Siehe Frage 3.

**Lichtraum, nachgerechnet:**
- Es gilt tip = HILL_H − 6 + (pk − 4·|sin 2,3k|)·sin(πu).
- Weil pk ≥ 5 > 4 ist (schon bei n = 1), folgt **tip ≥ 20 = BK_CLEAR = brClear()**.
- Gleichheit gibt es nur an der Wand. Die nächste Zacke liegt bei u = 1,5/(7n) bzw. 1 − 0,5/(7n). Für n = 8 am rechten Ende ergibt das etwa 20,5.

Daraus folgt:
- `brClear()` bleibt 20, `bkUnderError` (bruecken.js:112–113) und `bkTooTall` (:142) ändern sich nicht, und kein alter Stand wird ungültig.
- Die Bedingung „weglassen“ greift mit den heutigen Formeln nie. Sie ist nur Schutz (G9).
- Hat C3 `brClear(look, n, t)` eingeführt, ruft der Kristall-Maler es mit seinem Aussehen auf und bekommt 20.
- Deko unter dem Deck (|s| ≤ W, ≤ 20) liegt hinter der Vorderfläche. Dass Zacken und Band sie verdecken, ist die richtige Tiefe (wie C2.md Punkt 2).
- Deko VOR (s > W, ≤ 20) überschneidet sich auf dem Schirm nie mit Zacken oder Glas: Δy = (2s − 0,8)·16 + (h_zacke − h_deko) ≥ 0.
- Züge (13) bleiben frei.
- Nicht geprüft und schon heute so: der geöffnete Schlagbaum (~25, B2.md K-b). Er schaut künftig durch das Glasband, statt vom Holzbalken verdeckt zu werden.

---

### 4. Zusammenspiel mit B2: was sich ändert

| B2-Grundsatz | Bei K1 |
|---|---|
| Ruhendes in tileA (h, vd, o) | **hg** + h + vd (+ o, leer) in tileA; t1 und t2 nie in tileA |
| Nachmalen nur Deckendes, im Rahmen des Bewegten | h (Pfosten, Handlauf) und vd (Deck, Weg) wie bisher; **hg, t1, t2 nie in `bkRedo`** |
| tileB nur bei Bewegtem | bei Kristall **immer**: Glas genau einmal je Bild (G5) |
| Bildchen je Gruppe, ohne Licht | drei neue Schlüssel `br|x,y|hg|F`, `…|t1|F`, `…|t2|F`, ohne `lit` (bis C7) |
| `GLOW_MUTE` beim Nachmalen | Glas wird außerhalb der Sperre gezeichnet, also nie gedämpft und nie doppelt |
| GL: tileB nur für byTile und onDeck | zusätzlich `brLiveTiles()` |

**Änderungen im Einzelnen**

1. **brueckenbild.js**
   - :11 `BK_LAGEN` += 'hg', 't1', 't2'. Holz und Metall zeichnen dort nichts, der alte Scan bleibt grün.
   - :13 `BK_GRUPPEN` += `hg:['hg'], t1:['t1'], t2:['t2']`.
   - :15–18 `brBox`: `u = (gruppe==='vd'||gruppe==='t1') ? TH/2+hm+8 : TH/2+hm+16`. hg und t2 nehmen +16. Die Unterkante TH/2+6 reicht, weil Zacken ≥ 20 bleiben.
   - :21–22 die Weiche bleibt; dafür `kristall` in `BK_FUSS` aufnehmen (:173).
   - :68–72 `bkPaint`: bei Kristall + Fußgänger die Reihenfolge `hg, h, v, d, t1`, dann `after`, dann `o, t2`. Sonst bleibt `hvdAo` (Test brueckenbild.test.js:31–37 unverändert). `bkDrawTile` (Tests bruecke:131/133/214) und später das Menübildchen (C6) brauchen das.
   - :83–91 `bkDrawStill`: bei Kristall vor :86 `bkGroup(…, ['hg'])` als **eigener Aufruf**, nicht `['hg','h']`. In `bkGroup` (:94) kommen sonst Bildchen sofort und Live-Gruppen danach. Fehlt das hg-Bildchen, während das h-Bildchen da ist, läge das Glas über den Pfosten.
     - Nebenbefund für vd und o heute: Fehlt in einem Bild das vd-Bildchen, aber das o-Bildchen ist da, malt das Deck einmal über das vordere Geländer.
     - Zeile :89 optional nur `['vd']`, weil o bei Kristall leer ist. Für Deko VOR beim Nachmalen trotzdem `['o']` an `bkRedo` übergeben, denn `bkBoxOf([])` ergibt −∞.
   - :147–165 `bkDrawMoving`:
     - `const gl = bkGlasAt(c)`.
     - Nach :153 (vd nachmalen): `if (gl) bkGlasDraw(…,'t1')`.
     - Nach :163 (o nachmalen): `if (gl) bkGlasDraw(…,'t2')`.
     - Erst danach `late` (:164).
     - :152 bleibt `['h']`, nie 'hg'.
   - **Neu `bkGlasDraw(x,y,px,py,z,gr)`:** `const f = FOG; FOG = !ownedTile(x,y); try { bkGroup(x,y,px,py,z,[gr]); } finally { FOG = f; }`.
     - In tileB steht FOG sonst auf `false` (render.js:2142) oder auf einem alten Wert aus dem Standbild. Schlüssel und Farbe wären dann falsch.
     - Blass zeichnet `bkGroup` schon selbst (live × `SEE_A`).
   - **Neu `brLiveTiles()`:** `bkOn() ? bkFresh().glas : []`. Früh aussteigen über `bkOn`, nie über `hillsOn` (G10).
   - `spriteBridge` (:103–117) braucht keinen neuen Code, nur den Kommentar „Kristall: t1/t2 jedes Bild aus tileB“. Mit dem Streifen in C7: `keyOf(lit)` + `prewarm` für h und t2 (Regel 143).

2. **bruecken.js**
   - :78–90 `bkFresh`: je Brücke einmal `look = brLook(b,'anhoehe')` in das Objekt `o`, sodass `c.look` entsteht. Dazu `glas` = Schlüssel der Felder mit Kristall + Fußgänger. Neu wird es durch `groundVersion` (alle Setzer zählen hoch).
   - Neben :25: `const bkGlasAt = c => !!c && !!c.look && c.look.mat === 'kristall' && c.look.fam === 'fuss'`.
   - :409 `bkTileArgs`: `art: c.look.mat`, dazu `opts.zacken: c.look.zacken`.
     - Holz und Stahl liefern dasselbe wie bisher, ob alt oder neu.
     - Kristall mit Gleis (Bahn) fällt bis C5 in den flachen Zweig (Holz-Aussehen) und gehört nicht in `glas`.
   - `bkArtOf`, `BK_ARTEN`, `openBkInfo`, `bkSetArt` bleiben bis C6 unverändert. Kristall dort nicht aufrufen.

3. **render.js:2189:** `if (ms || figs || late.length || bkGlasAt(bc)) bkDrawMoving(…)`. tileA (:2065, :2100, :2103) bleibt wie es ist; der Rückfall bekommt hg über `bkDrawStill` mit.

4. **gl.js:685:** `glEvTiles(GLS.dyn, GLS.order, [byTile.keys(), roofLiveTiles(), onDeck ? onDeck.keys() : [], brLiveTiles()])`.
   - Kristallfelder laufen nur mit tileB. `c.dyn` bleibt falsch, tileA kommt aus dem Standbild.
   - Je Feld und Bild sind es zwei `putSprite`, kein `glLive`.
   - `glBgStep` braucht nichts, denn es gibt keine neue Liste je Bild (Regel 144).

**Reihenfolge je Kristallfeld**
- tileA: Deko HINTER → hg → h → [Bahnübergang] → Deko UNTER → vd → (o) → Deko VOR
- tileB: Bewegtes B und U → [h nachmalen bei B] → vd nachmalen → **t1** → Figuren auf dem Deck (A) → o und Deko VOR nachmalen → **t2** → Bewegtes davor (F)

**Bewusster Rest** (wie PLAN 2.4, „hinteres Glas wird nie nachgemalt“): Eine Figur hinter der Brücke (Klasse B) liegt über der hinteren Scheibe (30 % Deckkraft), aber unter den nachgemalten Pfosten und dem Handlauf. Den hinteren Streifen in C7 nach dem Entwurf in h legen, nicht in hg. Fürs Nachmalen braucht C7 dann die Option „blaues Licht neu stanzen“ (K10), die Holz-, Metall- und Steinlampen in o ohnehin brauchen.

---

### 5. Nacht und Licht

- **C4 hat kein Licht:** keine Streifen, kein `glowQuad`. Nachts wird K1 einfach mit abgedunkelt.
- Den Code des alten Kristall-Übergangs **nicht** übernehmen. Er leuchtet das ganze Deck blau (draw-objects.js:845, `glowQuad … 22·z 'blue'`). Der Nutzer will nur einen schmalen Streifen am Fuß des Glasgeländers.
- Der Test „Brücken-Bildchen ohne glows“ (bruecken-reihenfolge.test.js:80) bleibt damit grün.
- C7 setzt dann die Streifen #4 und #14 nur bei `brl` ein: Schein je ¼ Feld über [hf, hf+1,4], r = 7·z, 'blue', dazu `lit` im Schlüssel, `prewarm` und eine Anpassung dieses Tests.

---

### 6. Fallen

| # | Falle | Gegenmaßnahme |
|---|---|---|
| F1 | FOG in tileB falsch | `bkGlasDraw` setzt FOG = !ownedTile |
| F2 | rgba durch `C`/`shade` ergibt `#NaN` | `rgbaK` (nur Hex an C/shade) |
| F3 | Doppelte Deckkraft | hg, t1, t2 nie in `bkRedo`, t1/t2 nur in `bkDrawMoving`, je Bild einmal |
| F4 | Dunkle Naht durch ext bei Glas | `bandT` ohne ext |
| F5 | Naht im Glasband t1 (kein Pfosten) | x einrasten; weit weg (Bildchen werden skaliert) bleibt höchstens ein Hauch → Prüfbild, Frage 2 |
| F6, F7 | `bkArtOf` bzw. Altlesen machen Holz daraus | `c.look.mat`; Tests mit gültigem `brp` |
| F8 | Fenster (`openBkInfo`) zeigt „Holzsteg“ | erst C6 |
| F9 | Kristall mit Gleis | bis C5 flach im Holz-Aussehen, nicht in `glas` |
| F10 | Runde Kappen, `closePath` + `stroke` | `butt`, offene Linien (Zacken, Bandkanten) |
| F11 | Zacken-Nummer je Feld statt global | k = 7i + j, ab k ≥ 1 |
| F12 | Fugen an den Wänden doppelt | `onEdge(6)` ohne t = A und t = B |
| F13 | Gruppenreihenfolge bei teils fehlenden Bildchen | hg als eigener `bkGroup`-Aufruf |
| F14 | `bkBoxOf([])` | 'o' für Deko VOR beim Nachmalen behalten |
| F15 | Strichbreiten | Untergrenze 0,6 macht Pfosten (0,3) bei z = 1 doppelt so dick wie im Entwurf → im Bild vergleichen (C2-Restrisiko 1) |
| F16 | Spione | `bkDrawLagen` und `bkPaintLage` nur über den globalen Namen aufrufen |
| F17 | Doppelte Namen (anhoehe-stufe2.test.js:26) | `bkGlasAt`, `bkGlasDraw`, `brLiveTiles`, `rgbaK` gegrept: frei |
| F18 | Kantenlinie an der fernen Wand | Band ohne senkrechte Enden; an der nahen Anhöhe deckt deren Wand |
| F19 | Schatten | Einen Pfad und `SHADOW_COL` behalten, nicht bläulich wie in der K-Reihe des Kristall-Entwurfs (Falle 19) |
| F20 | `GEN=1` in brueckenwelt.test.js:40–42 schreibt **auch** tests/vorlagen/alte-bruecken.json | Kristall mit `brp` in der Welt ändert die Vorlage der Altfälle. `brueckenVorlage` (tools/brueckenwelt.js:93–97) muss `!b.brp` filtern, oder Kristall in eine eigene Prüfszene |
| F21 | Leistung | Je Kristallfeld zwei `putSprite` je Bild plus Abschnittswechsel im GL-Standbild → `?messen` und `tools/ruckeln.js` (Full HD) |

---

### 7. Tests (zuerst rot sehen)

**brueckenbild.test.js**
- `scanFuss('kristall')` für n 1–8, beide Achsen, mit und ohne Zacken:
  - Prisma ±0,013.
  - In h, v, d, o nur Hex.
  - In hg, t1, t2 rgba nur mit den Deckkräften 0,30 / 0,42 / 0,78, und rgba-Flächen nur in [t0, t1] (ohne ext).
  - Nie `globalAlpha` < 1, nie 'round'.
  - Jeder senkrechte Strich (Pfosten) genau einmal.
  - v und o leer.
- Zacken:
  - jede Spitze ≥ `brClear()`;
  - 7 je Feld, in Feld 0 nur 6;
  - nur bei `brz 'an'`, nie bei Bahn;
  - Farben wechseln nach k.
- Rahmen-Test (:43–64) zusätzlich mit `art 'kristall'` (+ `brz`) und dem Helfer `kr(b) = { b.art = 'kristall'; b.brp = { money: 0, k: brSig(b,'anhoehe') } }`. Die neuen Gruppen laufen über `Object.keys(BK_GRUPPEN)` automatisch mit.
- `bkPaint` bei Kristall ergibt `hg h v d t1 A o t2`; bei Holz weiter `hvdAo`.
- Nebel: die Glasfarbe unter FOG ist eine gültige `rgba` und anders als ohne FOG.

**bruecken-reihenfolge.test.js:** Szene mit Kristall (`scene(ax, figs)` mit `kr`), beide Achsen.
- Ohne Bewegtes: je Feld genau einmal hg < h < Deko UNTER < vd < t1 < t2.
- B: h und vd nachgemalt, **kein** hg; dann t1, dann o und Deko VOR, dann t2.
- U: vd → t1 → o → t2.
- A: t1 < Figur < o < t2.
- F: Figur nach t2.
- t1 und t2 je Bild genau einmal, mit und ohne Figur.
- Blass: t1/t2 live, kein Nachmalen.
- Weit weg (B2c-Teil): die Schlüssel `br|x,12|hg|0`, `|t1|`, `|t2|` existieren, `glows.length === 0`, im zweiten Bild `made === 0` und kein Live-Malen.

**GL (rein):**
- `brLiveTiles()` enthält genau die Kristallfelder, keine Holzfelder, und ist `[]` ohne Brücken.
- Spion auf `glPlayTiles` mit Attrappe `GLS`: tileB läuft für Kristallfelder ohne Bewegtes, tileA nicht.

**Altbrücken bitgleich:** Holz und Stahl alt und neu ergeben vor und nach dem Umbau dieselben Aufrufe von `bkPaintLage` (art, opts).

**Danach laufen lassen:** bruecke, bruecke-gleis, brueckenfamilie, bruecken-altversion, webgl, tempo-schritt3, nacht, leistung (wenn die Welt wächst: `npm run leistung:neu` mit Begründung „Kristall: Glas je Bild aus tileB“). Am Ende `npm run bump`.

---

### 8. Prüfbilder (Hauptagent, nacheinander)

- K1 und K1 mit Zacken × n = 1, 2, 3, 4 (8 nur zum Lesen) × beide Achsen.
  - Nah neben 'F-kristall' und 'F-zacken' aus brueckenlicht-entwurf.js, gleicher Zoom 1,8, n = 4.
  - Weit z = 0,45.
  - Nacht (dunkel, ohne Streifen).
- GL = 2D. tools/brueckenpruefung.js:21 schaltet weit weg GL ab, also GL eigens prüfen.
- Naht im Glasband an jeder Kachelkante, nah und z = 0,45.
- Figur dahinter, darunter, auf dem Scheitel, davor; Zug quer darunter; Bahnübergang mit offenem Schlagbaum; Deko der Höhe 20 auf allen 10 Plätzen.
- Fremdes Feld (Nebel), blass (👁), Baum und Haus auf beiden Endfeldern (Falle 25), Wandanschlüsse.
- In brueckenpruefung.js:7–16 die Ansichten „anhöhe kristall n1–n4, Zacken, Nord-Süd“ ergänzen.
- **Der Nutzer nimmt ab.**

---

### 9. Offene Fragen an dich

1. **Blauer Streifen ohne gekauftes Licht:** Im Entwurf steht er auch tagsüber als blasse Linie `#bfe9f8`.
   - **Empfehlung:** nur mit Licht (C7), weil „nicht gekauft“ heißt: keine Lampen. Bei „aus“ blasse Linie ohne Schein statt grau.
2. **Naht im Glasband:** Falls sie weit weg trotz Einrasten sichtbar bleibt, darf je Kachelkante ein haarfeiner Strich in Kantenfarbe hinein, wie die Pfosten im Geländer? Sonst bleibt der Hauch.
3. **Zacken:** Der Entwurf lässt die erste Zacke am Anfang weg (k ab 1), am Ende steht eine. So lassen, weil abgenommen, oder gleichmäßig an beiden Enden?
4. **Figur hinter der Brücke** liegt über der hinteren Glasscheibe (30 %), aber unter Pfosten und Handlauf. Ist das in Ordnung?
5. **Breite:** Das Glasgeländer steht bei BK_W 0,4 statt 0,3 wie im Entwurf, also wirkt die Brücke breiter als Holz und Metall nach C2. Bitte mit abnehmen.

---

### 10. Vorschlag für die Commits (je lokal, kein Push)

- **C4a, nichts sichtbar:** `c.look` in `bkFresh`, `bkTileArgs` mit `look.mat` und `zacken`, `bkGlasAt`, `brLiveTiles`, `BK_LAGEN`/`BK_GRUPPEN`/`brBox`, Reihenfolge in `bkPaint`, gl.js:685, `rgbaK`. Tests: Altbrücken bitgleich, `brLiveTiles`, GL-Spion.
- **C4b, Maler K1:** Kristall-Zweig in `bkPaintFuss`, Zeichenort (`bkDrawStill` hg, `bkDrawMoving` t1/t2, render.js:2189). Tests aus §7 außer Zacken.
- **C4c:** Zacken samt Test auf `brClear`.
- **C4d:** Prüfszene (F20 beachten), Prüfbilder, Abnahme, `leistung:neu`, bump, AUFGABEN.md abhaken.
  - In CLAUDE.md unter „Brückenfamilie“ ergänzen: Kristall-Glas nur in tileB (t1/t2), hg nie nachgemalt, `brLiveTiles`, Glasfarben über `rgbaK`, Zacken ≥ `brClear()`.

**Dateien:**
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-base.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenwelt.test.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/B2.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/C2.md