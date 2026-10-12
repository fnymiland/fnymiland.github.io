Ich habe die Bau-Karte für C5 erstellt, die Bahn-Modelle zwischen Anhöhen. Ich habe nur gelesen (Stand `327147a`): keine Datei geändert, keine Tests, kein npm, kein Browser. Die Lichtraum-Werte habe ich mit der Entwurfsformel von Hand nachgerechnet, nicht im Spiel gemessen.

# C5 – Bahn-Modelle zwischen Anhöhen: Karte für den Bau

## 0. Kurzfassung
1. **Was heute zeichnet:** Jede Bahn-Brücke zeichnet der alte flache Zweig von `bkPaintLage` (js/brueckenbild.js:23–65):
   - Farben `BK_LOOK` holz/stahl, Böcke aus C1 über `opts.supports`.
   - Das Kreuz liegt in `v`, der Entwurf hat es hinten.
   - Das Fachwerk hat 2n−1 Felder (`sideTruss` :37), der Entwurf 2n.
   - Fugen an den Feldkanten doppelt (`t <= b0` :60), Striche mit runden Kappen, Strichbreite doppelt so dick wie im Entwurf.
   - Stein und Kristall kennt der Maler nicht. `bkTileArgs` gibt nur `bkArtOf` weiter (js/bruecken.js:409), also nur holz oder stahl.
2. **Was C5 macht:** Ein neuer Maler `bkPaintBahn` mit vier Modellen nach `tools/brueckenfamilie-entwurf.js` (Form). Aus `tools/brueckenlicht-entwurf.js` kommen nur die Lampenstellen, das Licht selbst ist C7.
3. **Was gleich bleibt:**
   - Lagen h/v/d/o.
   - Gleis über `drawRailBed(…, bkRailArms(c))`.
   - Züge oben über `bkCarPieces`/`onDeck`, Nachmalen von `o`.
   - `brBox` (nachgerechnet, reicht).
4. **Was neu nötig ist:**
   - Das Material kommt aus `brLook` statt aus `bkArtOf`.
   - Der Stützenfuß reicht über Wasser bis −6,3.
   - **Züge unten in Stücken** (`brCarPiecesUnder`, der offene Rest von B2d), mit einem Schnitt an der Vorderfläche s = +W.
5. **Stein-Bahn hängt an C3** (Steinmaler mit `fam`). Die Entwurfsformel mit pk = 0 ergibt:
   - bei 1–3 Feldern einen flachen Balken ohne Bogen;
   - bei 4 Feldern neben dem Pfeiler nur 15,5 Lichtraum an der Feldmitte. Der Plan verlangt mindestens 16.

   Dazu gibt es eine Frage an dich (Abschnitt 14).

## 1. Stand heute (Datei:Zeile)

**Maler (js/brueckenbild.js)**
- Teile im alten flachen Zweig:
  - `BK_LOOK` :7–10
  - Weiche `bkPaintLage` :21–22 (`fam==='fuss'` → `bkPaintFuss`), sonst der flache Zweig :23–65
  - `sideTruss` :36–41
  - Geländer `rail` :42–45
  - Böcke `bocks` :47
  - Lagen h :48–50, v :51–56 (Kreuz :54), d :57–62 (Fugen :59–60, Weg :61, `railPaint` :62), o :63–65
- `bkPaint` :68–72: h, v, d, `after(H)`, o.
- Rahmen `brBox` :15–18.
- Bewegtes: `bkMoverClass` :119–123 (Fahrzeuge immer 'U'), `bkMoverRect` :125–132, `bkRedo` :134–145, `bkDrawMoving` :147–165.

**Brücke (js/bruecken.js)**
- Familie und Material: `bkArtOf` :19, `bkFam` :25.
- Stützen: `bkSupports` :37–40, `bkEdgeBlocker` :45–57, `bkSupportsShown` :65–69.
- Platz darunter: `bkUnderError` :99–114 (`brClear()` ohne Argumente :112–113), `bkPlaceError` :118–137, `bkTooTall` :139–146.
- Bauen: `bkError` :165–186 (`BK_ARTEN[art].tech` stürzt bei 'stein' oder 'kristall'), `bkBuild` :198, `bkSetArt` :237.
- Gleis: `bkRailCheck` :342–349, `bkLayRail` :350–361.
- Züge oben: `bkCarHill` :372, `bkCarPieces` :373–391.
- Zeichnen: `bkDrawTile` :396–401, `bkTileArgs` :403–411 (`railPaint` :407, `art` :409), `bkDrawLagen` :413–418.
- Sonstiges: `drawBkShadows` :449–461, `bkPick` :480–499.

**Familie (js/brueckenfamilie.js)**
- `brLegacyLook` anhoehe :63–69: Gleis → Bahn; Material holz oder stahl aus `art`.
- `brLook` :73–83 (neues Format: `mat = o.art`).
- `brSupports` :212–220, `brPeak`/`brDeckHFn` :225–235, `brClear` :242.

**Zeichenablauf (js/render.js)**
- `onDeck` :1804–1805.
- Züge oben als Stücke :1816–1820; Tunnel und `trainOnHills` :1821–1828.
- tileA: `bkDrawStill` :2065 (Bahnübergang als `drawIt`), :2100, Rückfall :2103.
- tileB: Schleife über Bewegtes, 'F' kommt nach `late` :2141–2147; `bkDrawMoving` :2186–2190.

**Gleisbett und Züge**
- `drawRailBed` (js/draw-objects.js:653–735): Pflaster :673–677, Schienen mit runden Kappen :705–706, Prellbock :707.
- js/movers.js:
  - `TRAIN_KIND` :540–545: Höhe 10–13, Länge 0,6–1,0.
  - `trainCars` :745 (`deck`).
  - `trainHalfW` :764 (0,17, Tram 0,19).
  - `drawTrainCarBody` :768 (`cut`; Schatten nur ohne Schnitt :777).
- `glMoverBox` Zug: 60/80/60/35·z (js/gl.js:552).

## 2. Abhängigkeiten
- **C3 (Stein):**
  - Der Steinmaler soll eine eigene Funktion sein, z. B. `bkPaintStein(lage, P, z, n, t0, t1, weg, opts)`, gesteuert über `opts.fam`/`opts.hf`. C5 ruft ihn dann mit `fam 'bahn'` und hf ≡ HILL_H auf.
  - Laibung, Widerlager, glatte Ansätze und die Balustradenrampe aus C3 gelten unverändert.
  - Das bitte mit C3 absprechen.
- **C4 (Kristall K1):** `brLiveTiles` darf nur Felder mit `fam === 'fuss' && mat === 'kristall'` nehmen. B2 ist ganz deckend und braucht kein tileB. Die Kristall-Farben teilen (gemeinsame Palette).
- **B2d** ist offen (AUFGABEN 160c: „Fußkreis an der Feldkante offen“). Der Teil „Zug unten in Stücken“ wird hier zu C5c.
- **Material aus `brLook`:** Falls C3 das nicht schon macht, `bkTileArgs` :409 ändern zu `art: c.mat`. `c.mat` einmal je Brücke in `bkFresh` (:80–90) als `brLook(b,'anhoehe').mat` merken. Jeder Setzer zählt `groundVersion` hoch: `bkSetArt` :254, `bkLayRail` :358, `bkDemolishAt` :234, `restyleRails` (rules.js:2259).

## 3. Gerüst `bkPaintBahn` (brueckenbild.js, ersetzt :23–65)
- **Weiche :22:**
  - `fam 'fuss'` → `bkPaintFuss`.
  - Sonst `bkPaintBahn(lage, P, z, BK_BAHN[art] || art === 'stein' ? art : 'holz', n, t0, t1, weg, opts)`.
  - Ohne `fam` ist der Bahn-Maler der Rückfall. Dann bleiben der B1-scan (brueckenbild.test :9–29) und 'hvdAo' (:31–36) grün, ohne Umbau.
  - `BK_LOOK` am Ende entfernen; es wird nur dort benutzt.
- **Konstanten:** `A = −½`, `B = n − ½`, `W = BK_W` (0,4), `H = HILL_H`, `T1 = t1 + (opts.ext||0)`, `last = t1 >= B − 1e-9`, `lw = f => Math.max(0.6, f·z)`, `sh = col => opts.ax ? shade(col, LIGHT.side) : col` (G11).
- **Helfer** wie in `bkPaintFuss` :178–188, aber flach. Da h konstant ist, kein Abtasten über `ts()`, nur 2 Punkte; das spart Polylinien.
  - `line(s, h, col, w, ta=A, tb=B)`: längs auf [max(ta,t0), min(tb,t1)], lineCap 'butt'.
  - `band(s, h0, h1, col)`: Fläche auf [max(A,t0), T1].
  - `deckTop(col)`.
  - `onEdge(K, fn)`: halboffen, im letzten Feld geschlossen.
  - `vert(t, s, h0, h1, col, w)`.
  - `seg(ta,sa,ha, tb,sb,hb, col, w)`: im Parameterraum auf [t0,t1] geschnitten, 'butt'. Senkrecht (ta===tb) nur halboffen. Heute zeichnet `seg` :28–35 bei ta===tb an der Kante doppelt.
  - `sup` wie :47.
  - **Fuß** `base(t) = opts.base ? opts.base(t) : 0`.
- **Strichbreite = Entwurf ÷ 2:** Der Entwurf rechnet `lw = w·z·dpr·0,5`; so auch C2. Die Böcke bleiben bei `vert` 2,2, das entspricht dem Entwurfs-Rechteck ±0,035 (C2.md Punkt 10).
- **Farben in `BK_BAHN`** (ein Ort, für C6/brc). Nur Hex-Farben (Falle 15), kein `closePath`+`stroke`: Umrisse werden zwei `line`.
- **Weg** auf einer Bahn-Brücke (Altdaten mit beidem) trotzdem malen (G9), dann `railPaint(H)`.
- **Leistung:** Schleifen über Diagonalen und Pfosten nur über die Indizes rechnen, die [t0,t1] treffen. Heute ist das O(n²) je Brücke (Karte Anhöhen :375).

## 4. Modelle: Formeln aus dem Entwurf und Lagen

### 4.1 Holz – Böcke auf den Kanten
Quelle: brueckenfamilie-entwurf.js:158–175.

`BK_BAHN.holz = { side:'#6f5238', deck:'#b08a5e', plank:'#8a6440', beam:'#8a5f38', rail:'#a9774a' }` (heute: Deck `#c99a68`, dunkel `#6d4a2c`).

| Lage | Inhalt (Entwurf) | Spiel |
|---|---|---|
| h | Bock hinten :161 | `vert(t, −W+0,06, base(t), H−3, side, 2,2)` für t ∈ sup |
| h | Pfosten hinten :162 | `onEdge(2): vert(t, −W, H, H+8, side, 0,6)` |
| h | Handlauf hinten :163 | `line(−W, H+8, side, 0,7)`; hinten **kein** Mittelholm |
| h | Kreuz :164 (Entwurf: nach dem hinteren Geländer, vor dem vorderen Bock) | für t ∈ sup `seg(t,−W+0,06,2 → t,W−0,06,H−5)` und gespiegelt, side 0,55 – **heute in v** (:54) und 1,1 breit |
| v | Bock vorn :165 | `vert(t, W−0,06, base(t), H−3, side, 2,2)` |
| v | Längsträger :169 | `band(W, H−3, H, sh(beam))` |
| d | Deck :166 | `deckTop(deck)` |
| d | Planken :167 | `onEdge(9): seg(t,−W,H → t,W,H, plank, 0,3)` |
| d | Gleis | `railPaint(H)` |
| o | Pfosten vorn :170 | `onEdge(2): vert(t, W, H, H+8, rail, 0,7)` |
| o | Handlauf und Mittelholm :171 | `line(W, H+8, rail, 0,9)`; `line(W, H+4, rail, 0,5)` |

Böcke und Kreuz nur auf `brSupports` Holz-Bahn, also an jeder inneren Kante (wie Entwurf `k=1…N−1`). Böcke werden nicht schattiert, wie die Stützen in C2.

### 4.2 Metall – Fachwerk
Quellen: brueckenfamilie-entwurf.js:176–189 (kr=false), truss :61–66.

`BK_BAHN.stahl = { dark:'#3e5452', steel:'#5d7d7a', front:'#7fa09c', grate:'#cfd3cf' }`

**`truss(s, col, w)`** mit T = 11, a = A+0,15, b = B−0,15, **m = 2n** (heute :37 `max(2, round(2(n−0,3)))` = 2n−1) und p_j = a + (b−a)·j/m:
- Untergurt: `line(s, H, col, 0,7w)` von A bis B.
- Obergurt: `line(s, H+T, col, 0,7w, a, b)`.
- Enddiagonalen `seg(A,H → a,H+T)` und `seg(B,H → b,H+T)`, je 0,5w.
- Diagonalen j = 0…m−1: `seg(p_j,H+T → p_{j+1},H)`, 0,5w; alle in dieselbe Richtung wie im Entwurf.
- Pfosten j = 1…m−1: `vert(p_j, s, H, H+T, col, 0,4w)`, halboffen.

**Lagen**
- h: `truss(−W−0,02, dark, 1,2)` (0,84/0,6/0,48).
- v: `band(W, H−4, H, sh(steel))` + `line(W,H,dark,0,3)` + `line(W,H−4,dark,0,3)`. Die obere Linie deckt `deckTop` zur Hälfte, wie in C2c; hinnehmen.
- d: `deckTop(grate)` + `railPaint`. **Keine Fugen**; der Entwurf hat keine, heute sind es 6 je Feld.
- o: `truss(W+0,02, front, 1,6)` (1,12/0,8/0,64).

Das Fachwerk wird nicht schattiert (wie ein Geländer).

### 4.3 Kristall B2 – Fachwerk aus Kristall
Quellen: brueckenfamilie-entwurf.js:176–183 (kr=true), kristallbruecke-entwurf.js:104–116.

Farben: `{ back:'#7fc4e8', deck:'#d7eef7', mid:'#bfe6f7', edge:'#5aa9d6', front:'#8fd3f2', hi:'#f7fdff' }`.

| Lage | Inhalt |
|---|---|
| h | `truss(−W−0,02, back, 1,2)` |
| v | `band(W, H−4, H, sh(mid))` + Kanten `line … edge 0,3` |
| d | `deckTop(deck)` + `railPaint` |
| o | `truss(W+0,02, front, 1,6)` und Glanz `line(W+0,02, H+11, hi, 0,35, a, b)` |

- Der Glanz läuft von a bis b wie im Familie-Entwurf; kristallbruecke :116 zieht ihn von U0 bis U1, das nicht übernehmen.
- Alles ist deckend, nichts nur in tileB.
- Den Streifen gibt es erst in C7.

### 4.4 Stein – flacher Viadukt
Quellen: brueckenfamilie-entwurf.js:68–96 (foot=false), Balustrade brueckenlicht-entwurf.js:86–122 (STEIN_GEL 'baluster', abgenommen).

**Unterschiede zum Fußgänger-Stein aus C3**
- hf ≡ H (pk = 0).
- **Keine Fugen** (Entwurf :76/:108 `if (foot)`).
- Deck `#e6dcc8`, darauf das Gleis in d. Im Entwurf kommt das Gleis vor der vorderen Brüstung (:87/:119).

**Lagen (PLAN 2.4)**
- h: hintere Balustrade, Laibung mit den Pfeiler-Seitenflächen, Widerlager.
- v: Stirn als Band (Unterkante = Öffnungslinie), Bogenkante, Keilfugen.
- d: Deck und Gleis.
- o: vordere Balustrade; Minilaternen kommen in C7.

**Öffnungen nach der Entwurfsformel (:70–72) mit pk = 0**
- Ansatz an der Wand H−3 = 23, am Pfeiler hp = 13.
- Dazu kommt `max(0, (H−7,5) − Mitte der Ansätze)·√sin(πτ)`. Das sind zwischen Wand und Pfeiler 0,5, zwischen zwei Pfeilern 5,5, von Wand zu Wand 0.
- Pfeiler nach `brSupports` Stein: n 2/3 keiner, n 4 an Kante 2, n 8 an Kanten 2, 4, 6. Für n 8 habe ich die Formel, die im Entwurf nur zwei Bögen kennt, verallgemeinert.

| n | Höhe der Öffnung an den Feldmitten |
|---|---|
| 1–3 | 23 überall: rechteckig, Stirn nur 3 hoch, ein flacher Balken |
| 4 | 20,8 · **15,5** · **15,5** · 20,8 |
| 8 | 20,8 · **15,5** · 17,4 · 17,4 · 17,4 · 17,4 · **15,5** · 20,8 |

- PLAN 2.3 verlangt für Züge darunter mindestens 16 an der Feldmitte.
- Die Tram (13 hoch, Dach 14,6, halbe Breite 0,19) passt gerade noch: an der Wagenkante zum Pfeiler ist die Öffnung 14,45 hoch, die Dachkante 13. Fragen F1/F2.

### 4.5 Lampenstellen für C7 (in C5 nicht zeichnen; Quelle brueckenlicht)
- **Holz:** ein Punkt auf jedem Pfosten (je ½ Feld), H+8,6, `#f3e3b0`, Schein r 5 (:190).
- **Metall:** ein Punkt an jedem Obergurt-Knoten p_j, j = 0…2n, H+11,6, `#e9eef0`, r 4 (:199). Das sind genau die Pfostenstellen.
- **Kristall:** Streifen am Fachwerkfuß, beide Seiten, H+0,5; am Tag `#bfe9f8` 0,45, nachts 'blue' je ¼ Feld r 7 (:198).
- **Stein:** Minilaterne an jeder inneren Kante auf der Balustrade, H+6,5, Gehäuse `#b8ad97` (:121).
- Für alle: hinten in h, vorn in o; Lampen auf Kanten halboffen.

## 5. Gleis auf dem Deck
- **Bleibt wie heute:**
  - `railPaint` bruecken.js:407 = `drawRailBed(px, py−H·z, z, x, y, {b:'schiene', rot: ax, form}, bkRailArms(c))`, in d nach Deck und Planken.
  - Die Gleisform (Schotter/Rasen/Wald/Pflaster/Blumen) gilt.
  - Die `rails()` des Entwurfs (:56–60) sind nur eine Skizze und praktisch gleich groß (Bett ±0,23, Schwellen ⅛ bei ±0,15).
  - `bkRailArms`, `bkRailArmFrom`, `bkFlatOver` (0,06 bei Bahn) und der Prellbock bei nur einem Arm bleiben.
- **Fallen am Gleisbett**
  - Die Schienen haben runde Kappen (draw-objects.js:705), die ~0,65 px ins Nachbarprisma ragen. Gleiche Farbe, das hinnehmen. Der Test „nie round“ darf `railPaint` nicht mitprüfen.
  - Pflastergleis: `pattern1` blendet über `globalAlpha` aus (:312–314). Wird im Zoombereich ohne Bildchen nachgemalt, wird es dunkler (G5). Im Prüfbild ansehen.
  - Das Bett ragt nicht 0,012 ins nächste Feld, wie am Boden; das hinnehmen.

## 6. Züge darüber
Hier ändert sich nichts. Der Ablauf:
- `trainCars` deck → `bkCarPieces`, geschnitten an den Feldkanten.
- Deck-Stücke kommen nach `onDeck`, Stücke auf der Anhöhe nach `byTile` mit `bkCarHill`.
- `bkDrawMoving` zeichnet sie nach vd (ruhend in tileA) und malt danach `o` im Rahmen `rAll` nach (oben +HILL_H·z, Deko VOR).
- `after(H)` = HILL_H (bkDrawTile :400).

Nachgerechnet:
- Das vordere Fachwerk oder Geländer des nächsten Felds liegt vor dem Wagenstück und wird zu Recht darüber gemalt.
- Das hintere Fachwerk des nächsten Felds überdeckt es nie.
- Das Stück auf der fernen Anhöhe wird vom vorderen Fachwerk bzw. der Enddiagonale von Feld 0 richtig verdeckt.

`brBox` reicht:
- h: 0,92·16 + 37 = 51,7 < 58 (TH/2 + H + 16); seitlich 29,8 < 38.
- vd: 40,4 < 50.
- unten: Bockfuß über Wasser 19,7 < 22.

## 7. Züge darunter
**Erlaubt seit C1:** quer durch die Feldmitte unter jeder Stütze; längs nur, wo keine Stütze steht (Metall/Kristall frei, Stein zwischen den Pfeilern).

**Zeichnen heute:** ein Stück in `byTile[round(px,py)]`, Klasse immer U; tileB malt vd und o im Rahmen nach.

**Fehler, nachgerechnet**
1. Die Wagenmitte liegt im Brückenfeld, der Wagen ragt nach vorn über s > W hinaus.
   - **Holz:** Das vordere Bein des linken Bocks (t = i−½, s = 0,34) wird über die Wagenfront bei s ≈ 0,67–1,0 gemalt. Bei regio passiert das, solange die Mitte zwischen 0,28 und 0,5 liegt, bei der Tram ab 0,17. Das gibt es schon seit C1.
   - **Stein:** Die Stirn bei s = W wird über jeden Wagenteil vor der Brücke gemalt. Der Wagen scheint an der Stirn zu enden.
2. Die Mitte liegt schon im Feld davor (s > ½). Dann liegt der hintere Teil unter dem Deck sichtbar über der Stirn bzw. dem Bock. Bei Stein deutlich, bei Holz und Metall nur das Dach knapp über der Deckkante.
3. Längs unter Metall oder Kristall malt das Wagenende über das Deck des vorigen Felds.

**Lösung: `brCarPiecesUnder(m)`** in bruecken.js, nach dem Muster von `bkCarPieces` :373
- Nur für `m.train && !m.deck`, ohne Tunnelschnitt, ohne HALL, ohne `m.hill`. Aufruf in render.js nach :1825 (`trainOnHills`).
- G10: früh aussteigen, wenn unter Mitte und Enden kein `bkAt` liegt.
- **Schnitte** entlang des Wagens:
  - an den Feldkanten in t (`ca = ax ? dv : du`, wie :379);
  - quer zur Brücke (`cs = ax ? du : dv`, |cs| > 0,3) bei **s = −½, s = +W, s = +½**, mit s relativ zur Brückenzeile (`ax ? px−x0 : py−y0`).
  - Der Schnitt bei +W ist nötig. Mit Schnitten nur an den Kanten verdeckt die Stirn ein Wagenstück von 0,1 Feld (bei z 2,5 etwa 9 px).
- **Zuordnung nach der Stückmitte:**
  - im Brückenfeld mit s ≤ W → `byTile` des Brückenfelds, `m.bkCls = 'U'`;
  - s ∈ (W, ½] → Brückenfeld, `'F'`, also `late` und nach dem Nachmalen gezeichnet;
  - sonst das Feld unter der Stückmitte.
- `bkMoverClass` :119 bekommt als erste Zeile `if (m.bkCls) return m.bkCls;`.
- **Schatten:** `drawTrainCarBody` zeichnet ihn nur ohne `cut` (:777), er verschwindet also beim Zerlegen. Lösung: Das Stück mit der Wagenmitte bekommt `shadow: true`, und :777 wird `!car.cut || car.shadow`.
- **Rahmen:** `bkMoverRect` nimmt die Wagenmitte. 60/80/60/35 deckt jedes Stück, auch die Tram mit ±0,5.

**Bewusster Rest (hinnehmen):** Eine Klasse B für Stücke bei s ∈ [−½, −W] baue ich nicht.
- Bei Holz, Metall und Kristall wird dort nachgerechnet nichts verdeckt.
- Bei Stein kann die hintere Bogenlinie neben dem Pfeiler ≤ 3,2 px vom Wagendach verdecken.
- Ein echtes B müsste in tileB erst B-Stücke, dann h nachmalen, dann U-Stücke zeichnen (render.js:2141–2147 umbauen). Heute würde `bkRedo('h')` im Rahmen rB auch über U-Stücke desselben Wagens malen.

## 8. Stützen (`bkSupports`, Bahn)
- `brSupports` bleibt:
  - Holz-Bahn: jede innere Kante.
  - Stein: jede zweite von außen.
  - Metall/Kristall: keine.
  - `bru` gilt nur für Holz-Fußgänger (brLook :82).
- **Familienwechsel:** `bkRailCheck` :346 prüft schon die Stützen der Bahn. Nimmt man das Gleis weg, gibt es weniger Stützen und der Bogen wird höher; dann ist keine Prüfung nötig.
- **Stein-Bahn hat niedrigere Öffnungen als der Fußgänger-Bogen.** Bekommt `brClear` in C3 Parameter, muss `bkRailCheck` auch `bkUnderError` mit der Bahn-Form prüfen. Für Holz, Metall und Kristall bleibt `brClear` = BK_CLEAR = 20 (Träger 23 bzw. 22 in der Vorderfläche).
- **Neu: Stützenfuß über Wasser.**
  - PLAN 2.3 sagt „Wasser −6,3“; Wasser liegt DEPTH·0,7 = 6,3 tiefer (draw-base.js:154).
  - Heute beginnen Böcke und die C2-Stützen bei 0 und schweben über dem Wasser.
  - `bkTileArgs` gibt dafür `opts.base(t)` mit: −DEPTH·0,7, wenn beide Felder an der Kante Wasser sind, sonst 0.
  - Gleich auch in `bkPaintFuss` :192/:197 einbauen.

## 9. Bildchen, GL, Schatten, Antippen
- **Bildchen** `br|x,y|gruppe|FOG` bleiben ohne Modell im Schlüssel, weil jeder Setzer `groundVersion` hochzählt. Weiter ohne Licht (der B2c-Test bleibt grün).
- **GL:** alles ruhend in tileA.
- **Schatten** `drawBkShadows` bleibt: nur das Deck, flach, wie im Entwurf.
- **Antippen** `bkPick` :480: Das Band reicht von hd−3 bis hd+4. Das Fachwerk (+11) und das Holzgeländer (+8) oberhalb davon sind nicht antippbar, wie beim Fußgänger-Geländer. Optional ein Band je Modell (Falle 23), dann mit Test.

## 10. Fallen
| # | Falle | Gegenmaßnahme |
|---|---|---|
| 1 | Stein/Kristall werden als Holz gezeichnet (`bkArtOf`) | `c.mat` aus `brLook` (Abschnitt 2) |
| 2 | Fachwerk hat heute 2n−1 Felder | m = 2n |
| 3 | Kreuz in v; Deko UNTER liegt dahinter | Kreuz in h (wie C2.md 13), 0,55 breit |
| 4 | Striche doppelt so dick wie im Entwurf | alle Breiten ÷ 2 (Tabellen oben) |
| 5 | runde Kappen ragen an der Wand ins Prisma der Anhöhe (G1) | 'butt' überall, Test „nie round“ |
| 6 | Umriss mit `closePath`+`stroke` gibt senkrechte Striche an jeder Feldkante (G3) | zwei `line` |
| 7 | Fugen/Planken an der Kante doppelt (:60) | `onEdge` halboffen |
| 8 | Nord-Süd | Träger/Stirn mit `sh()`; Fachwerk, Geländer und Böcke nicht |
| 9 | Kristall-B2 landet in `brLiveTiles` (C4) | nur `fam 'fuss'` |
| 10 | Bock bzw. Stirn malt über einen Zug unten | C5c, Schnitt bei +W |
| 11 | Schatten springt beim Zerlegen | Stück mit der Mitte zeichnet ihn |
| 12 | Stützen schweben über Wasser | `opts.base` |
| 13 | Stein-Bahn zu niedrig bzw. bei n ≤ 3 ein Balken | F1/F2 |
| 14 | Pflastergleis wird beim Nachmalen dunkler (G5) | Prüfbild |
| 15 | Prüfwerkzeug stürzt mit `bkBuild`/`bkError` und Art 'stein' (`BK_ARTEN[art].tech`) | Stein/Kristall roh setzen und `brStamp` (C6 baut erst) |
| 16 | Fachwerk bei s = ±0,42, außerhalb von BK_W | Deko-Gruppen teilen bei ±0,4; 0,02 Unterschied, hinnehmen |
| 17 | Baum/Haus auf den Endfeldern (`hillPre`/`hillLate`, Falle 25) | Prüfbild |

## 11. Schritte
Je Schritt ein lokaler Commit. Zuerst den Test schreiben, dann `npm test` (maxWorkers 4, nie parallel zum Browser), dann `npm run bump`. Kein Push.

- **C5a – Gerüst und Holz (Hoch):** `bkPaintBahn`, `BK_BAHN.holz`, `c.mat`, `opts.base`. Der alte Zweig fällt weg. Prüfbild Holz in beiden Achsen; **du nimmst ab**.
- **C5b – Metall-Fachwerk und Kristall B2 (Hoch):** Prüfbild neben den Entwurfszeilen B-metall und B-kristall; **du nimmst ab**.
- **C5c – Züge darunter (Hoch):** `brCarPiecesUnder`, `bkCls`, Schatten, render.js nach :1825.
- **C5d – Stein-Viadukt (Hoch):** erst nach C3 und nach deiner Antwort auf F1/F2. Stein-Maler mit `fam 'bahn'`, `brClear`/`bkRailCheck`.
- **C5e – Abschluss (Normal):**
  - `npm run leistung:neu` (Begründung: „C5 Bahn-Modelle: Fachwerk 2n, Böcke/Kreuz, Planken je Feld“).
  - webgl, tempo-schritt3, bildrate laufen lassen.
  - In AUFGABEN abhaken.
  - CLAUDE.md, Regel Brückenfamilie: „Bahn-Maler `bkPaintBahn`; Züge unten in Stücken (`brCarPiecesUnder`, Schnitt bei s = −½/+W/+½); Stützenfuß über Wasser −6,3“.

## 12. Tests
**tests/brueckenbild.test.js**
- `scanBahn(mat)` nach dem Vorbild `scanFuss` :94–109:
  - für holz/stahl/kristall, Stein nach C3; n 1…8; ax 0/1; jedes Feld; jede Lage;
  - Stützen aus `brSupports({mat, fam:'bahn'}, n)`; `base` 0 und −6,3;
  - geprüft wird: t ∈ [i−½−0,013, i+½+0,013], endlich, nur `#rrggbb`, kein `globalAlpha < 1`, nie 'round', kein `stroke` nach `closePath`, jeder senkrechte Strich genau einmal.
- Holz: je ein Bock in h und v an jeder Kante t = k−½, Kreuz nur in h. Metall/Kristall: kein Strich von 0 aufwärts.
- Fachwerk: je Seite 2n−1 Pfosten; die Diagonalstücke aller Felder ergeben zusammen 2n + 2 ganze Diagonalen.
- Reihenfolge in den Lagen (Farbprotokoll, n 4, i 1):
  - Holz: h Bock, Pfosten, Handlauf, Kreuz · v Bock, Träger · d Deck, Planken · o Pfosten, Handlauf, Mittelholm.
  - Metall: h Fachwerk dunkel · v Träger, Kanten · d Rost · o Fachwerk hell.
- ax 1: Träger mit `LIGHT.side` schattiert, Fachwerk/Geländer/Böcke nicht.
- Rahmen-Test :43–63 erweitern: vier Materialien (Stein/Kristall über `b.art = …; brStamp(b,'anhoehe',{mat})`), dazu 'gleis', n 1–4 und roh 8, Bock über Wasser.
- `bkTileArgs(…).art`: neu `'stein'`, alt ohne `brp` `'holz'`.
- Bleiben grün: B1-scan, 'hvdAo', `scanFuss`.

**tests/bruecke-gleis.test.js**
- „Stücke je Feld“ :148–171 für alle vier Materialien.
- Neu: Zug quer unter Holz-Bahn und Stein, beide Achsen, Mitte s ∈ {−0,6; −0,3; 0; 0,3; 0,45; 0,6; 0,9}:
  - Die Stücke ergeben zusammen die Wagenlänge.
  - U-Stück vor dem Nachmalen von vd und o des Brückenfelds.
  - F-Stück nach dem letzten o.
  - Stück im Feld davor danach.
  - Nichts doppelt.
- Neu: längs unter Metall, Schnitte an den Feldkanten.
- Neu: Altbrücke 160b. Holz mit Gleis ohne `brp` → Böcke an jeder Kante; Stahl mit Gleis → Fachwerk.

**tests/bruecken-reihenfolge.test.js**
- Szene mit Gleis oben und Gleis quer unten (Zugstück U): danach vd, o; Bahnübergang (`drawCrossing`) zwischen h und vd; beide Achsen.

**tests/brueckenfamilie.test.js**
- Stein-Bahn: Öffnung ≥ 16 an jeder Feldmitte für n 1…8, oder `bkPlaceError` lehnt Gleis darunter ab (je nach F1/F2).

## 13. Prüfbilder
**Werkzeug:** `tools/bruecke-gleis-pruefung.js` erweitern, neue Funktion `brueckeGleisModelle()`. Ausführen nacheinander, vorher `npm run bump`. `tools/bruecken-glitch.js` gibt es noch nicht: eine kleine Differenz „mit/ohne Zug, außerhalb des Zugrahmens = 0“ ins Werkzeug einbauen.

**Szene**
- **Ost-West:** Anhöhen x 10–13 und 18–21 (Lücke 14–17, n 4 wie im Entwurf), Zeilen y 4/8/12/16 für holz/stahl/stein/kristall. Dazu n 1/2/3 für Holz und Stein.
- **Nord-Süd:** Anhöhen y 34–37 und 42–45, Spalten x 6/10/14/18.
- **Bauen:** Holz und Metall über den Plan; Stein und Kristall roh plus `brStamp`.
- **Gleise:** oben mit regio-Linie. Unten quer bei x = 15 bzw. y = 39 eine Tram-Linie; das ist das Feld neben dem Steinpfeiler. Längs unter Metall Nord-Süd.
- **Dazu:** Blumen unter der Holz-Bahn, Holz-Bahn über Wasser, Baum und Haus auf beiden Endfeldern.

**Bilder** (jedes in beiden Achsen)
1. Übersicht je Material bei z 1,8, gleicher Ausschnitt wie der Entwurf (x 15,5, `cam.y = p.y − H`), daneben die B-Zeile aus `brueckenfamilie-entwurf.js`.
2. Anschlüsse nah bei z 5, Wagen über der Kante (`e0`/`e1`).
3. Zug quer unten bei z 4 als Folge von 7 Bildern (s −0,7 … +0,9), für Holz (Bock) und Stein (Stirn).
4. Zug oben und unten zugleich.
5. Längs unter Metall.
6. Altbrücken vorher/nachher: `brueckenPruefung('C5', { only: ['anhöhe'] })` (brueckenwelt y 33/41/49/57).
7. Nacht (noch ohne Licht), weit bei z 0,45 (Bildchen = live), GL an = GL aus.
8. Pflastergleis bei z ≈ 1,2 mit einem Zug darunter.

## 14. Fragen an dich
- **F1 – Form des Stein-Viadukts für die Bahn.**
  - **(A) Wie abgenommen:** Pfeiler je 2 Felder. Bei 1–3 Feldern gibt es dann keinen Pfeiler, und die Entwurfsformel ergibt einen flachen Steinbalken: Öffnung bis 23, Stirn nur 3 hoch. Neben dem Pfeiler ist der Lichtraum 15,5.
  - **(B) Pfeiler an jeder Kante wie die Holzböcke:**
    - Je Feld ein Bogen, an jeder Feldmitte mindestens 18.
    - Darunter Weg und Gleis nur quer.
    - Das ändert die C1-Regel für Stein-Bahn; `bkRailCheck` kann das schon.
  - **Empfehlung:** zuerst ein Entwurfsbild beider Varianten für n 1–4. Ich empfehle B, weil es wie ein Viadukt aussieht und F2 erledigt. Bei 4 Feldern sieht B aber anders aus als das abgenommene Bild.
- **F2 – nur bei A:** Neben dem Pfeiler ist der Lichtraum 15,5 statt 16. Die Tram passt mit etwa 1,5 px Luft.
  - **Empfehlung:** hinnehmen, wenn das Bild stimmt.
  - **Alternative:** den Ansatz am Pfeiler für die Bahn auf 16 heben; die Öffnung wird dann etwa 17,5.
- **F3 – Kristall B2: Streifen am Tag?** Der Familie-Entwurf zeigt keinen, der Licht-Entwurf auch am Tag einen hellen Streifen.
  - **Empfehlung:** den Streifen nur mit gekauftem Licht (C7).
- **Zur Info, keine Frage:** Bestehende Holz- und Stahl-Gleisbrücken sehen danach wie die Entwürfe aus:
  - Deck `#b08a5e`, Kreuz hinten;
  - Metall ohne Fugen, Fachwerk 2n.

  Das zeige ich dir als Vorher/nachher-Bild.

## 15. Dateien
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenfamilie-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/kristallbruecke-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bruecke-gleis-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke-gleis.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenfamilie.test.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/B2.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/C2.md