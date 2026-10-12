## Karte A: Das abgenommene Stein-Modell, zerlegt

Ich habe nur gelesen: keine Tests, kein npm, kein Browser, nichts geändert. Die Zahlen unten habe ich mit einem python3-Einzeiler nachgerechnet (HILL_H 26 aus hills.js:9, TW/TH 64/32 aus data.js:8, BK_W 0,4 aus bruecken.js:16).

### 0. Kurzfassung
1. **Abgenommen ist zweierlei:**
   - `stone()` in `tools/brueckenfamilie-entwurf.js:68–96` (Entwurf 10, Stufe 3, Lücke 4)
   - die Balustrade `'baluster'` aus `tools/brueckenlicht-entwurf.js:91–105` (gewählt in :18)

   Die Kugelleuchten (:90–95) bzw. Minilaternen (brueckenlicht :121) gehören zu C7.
2. **Der Entwurf ist fest auf 2 Bögen gebaut:** `n = 2` und `edges = [U0, U0+N/2, U1]` (:69); die Fallunterscheidungen `k ? … : …` stehen in :70, :81 und :84.
   - Die Form für beliebig viele Bögen gibt es schon in `bogen-anhoehe-entwurf8.js:73–81`. Die Datei enthält inzwischen Entwurf 10 (Commit e6ac561).
   - Dort sind die Bögen aber gleich breit, die Pfeiler liegen also nicht nach `brSupports`.
3. **Verallgemeinerung:**
   - Kantenliste im t-Raum: E = [A, …brSupports(look,n).map(k ⇒ k−½), B].
   - Je Intervall ein Bogen nach derselben Formel.
   - Nur das harte `Math.min` wird ein glattes Minimum.
4. **Die Laibung ist im Spiel nur in einem schmalen Streifen rechts jedes Pfeilers sichtbar**, nämlich wo ri′ > TH = 32 px je Feld:
   - n = 4: t ∈ [1,59; 1,66], ri steigt dort von 13 auf 17.
   - Mittelbögen bei n = 6 und 8: bis t ≈ 1,85, ri von 13 auf 31.
   - Den Rest der „Tiefe“ liefern Pfeiler-Seitenfläche, Widerlager und Tunnelschatten.
5. **Vorbedingung außerhalb der Karte, die C3 blockiert:** `art:'stein'` ohne `brp` wird heute als Holz gezeichnet und gestützt. Siehe 5.1.
6. **Die Stein-Bahn (pk = 0) entartet mit derselben Formel:**
   - Die Wandbögen werden gerade Rampen von 23 auf 13.
   - In der Feldmitte bleiben bei n = 4 nur 15,5. Das ist weniger als die 16, die PLAN:327 für Züge darunter verlangt.
   - Entscheiden muss das C5. C3 muss dafür nur NaN-frei bleiben.

### 1. Herkunft: was „Entwurf C“ und „Stufe 3“ heißen

| Entwurf | Fundstelle | Was sich ändert |
|---|---|---|
| 6 „C“ | `bogen-anhoehe-entwurf6.js:22` `{sp:3, ramp:true}`, ri in :77 | ri = H−sp+(pk+sp−th)·sin(π·t01) mit th = 4. Die Brüstung läuft über 0,45 Feld aus, so gibt es keinen Zipfel. Nutzer (:1): „dieser Zipfel am Anfang, der unnatürlich übersteht“. |
| 7 | `entwurf7.js:71–78` | Pfeiler, Bögen je 2 Felder. Der Wandansatz ist aber hp, deshalb kommt der Zipfel zurück (Nutzer in entwurf8.js:1). |
| 8 | Commit b1e99d5 | Wandbögen wie C (sa/sc = H−sp an der Wand, hp am Pfeiler). Die Stufen sind der Pfeileransatz 10…23. Nutzer: „sie war geil, weil sie so flach aussah“. |
| 9 | Commit 490e816 | Die Stufen sind die Buckelhöhe ×0,4…1,9. Nutzer: „ich sehe keinen Unterschied“. |
| 10 | Commit e6ac561, heutige `entwurf8.js` | Buckel ×1 wie in Entwurf 7 (Nutzer: „der Buckel war perfekt, es geht ums Loch“, :21). Stufen [gap, hp]: [13,7] [10,10] **[7,5; 13] = Stufe 3 „mittel“** [5,16] [3,2; 19] (:21, :171). Gezeigt bei N = 6 mit 3 Bögen (:41–42); Klemme dk−3,2 (:80). |
| Familie | `brueckenfamilie-entwurf.js:69` | Stufe 3 (gap 7,5, hp 13), N = 4 mit 2 Bögen, Klemme dk−3 (:72). |

Abgenommene Bilder gibt es also nur für **n = 4** (Familie) und **n = 6** (Entwurf 10). Alle anderen Längen sind hochgerechnet und brauchen ein Bild.

### 2. Bauteile von stone(), Zeile für Zeile

Koordinaten im Entwurf: u ∈ [U0, U1], N = 4. Im Spiel gilt t = u−U0−½, A = −½, B = n−½.

**Deck:** dk (:45) = H + pk·sin(π·clamp((u−U0)/N)), mit pk (:43) = ½·20,4·(N/2)^0,6, bei der Bahn 0. Das ist genau `brDeckHFn` (brueckenfamilie.js:231–235).

**Konstanten (:69):** face #d9d2c3, joint #a99f8c, deck #e6dcc8, top #efe8da; sp 3, n 2, hp 13, gap 7,5, PW 0,09.

**a) Bogenleibung ri (:70–72), Bogen k = 0 (Wand links) und 1 (Wand rechts):**
- a = edges[k] + (k ? PW : 0) und c = edges[k+1] − (k ? 0 : PW). Der Pfeiler belegt damit [Kante−PW, Kante+PW], also 0,18 Feld mittig auf der Kante.
- τ = clamp((u−a)/(c−a)).
- Ansätze: sa = k ? hp : H−sp, sc = k ? H−sp : hp, also 23 an der Wand und 13 am Pfeiler.
- base = sa+(sc−sa)·τ, top = dk((a+c)/2) − gap, mid = (sa+sc)/2.
- **ri = min(dk(u)−3, base + max(0, top−mid)·√max(0, sin πτ)).**
- Über dem Pfeiler ergibt die τ-Klemme ri = hp.
- Bei n = 4: top = 29,04, Hub 11,04; ri in den Feldmitten 28,9 | 23,9 | 23,9 | 28,9.
- **Die Klemme greift von der Wand bis t ≈ 0,09**, also gut 0,6 Feld weit. Dort läuft der Bogen 3 px unter dem Deck (Steigung ~12 px je Feld). Danach knickt er in die Rohkurve (Steigung ~0): das ist der „Knick an der Wand“ aus PLAN:328.

**b) Brüstung:** In der Familie ist sie niedrig, parH (:73) = 3·min(1, min(u−U0, U1−u)/0,45). Abgenommen ist die Fassung aus brueckenlicht :91: PH 6,5, gleiche Rampe, parH = PH·ramp.

**c) Hintere Brüstung (:74):** band(−W, dk, dk+parH) in shade(top, −0,12). Wird ersetzt durch `parapet(−W, false)` aus brueckenlicht.

**d) Deck (:75):** `deckTop(deck)`.

**e) Fugen (:76), nur Fußgänger:**
- an den ungeraden Stützstellen von us (M = 48), also u = U0 + (2j+1)/12
- Abstand 1/6 Feld, nie auf einer Kante
- Querstrich −W…W in rgba(150,135,110,.45), Breite 0,6

**f) Pfeiler-Platte (:77):**
- Rechteck bei u = edges[1]+PW, v −W…W, h 0…hp
- Farbe shade(face, −0,12), Umriss joint 0,5
- Darüber fehlt die Laibung: das ist die „helle Platte“.

**g) Stirn (:78–83):**
- Stützstellen: UU = 6M+1 = 289 Punkte, also 72 je Feld.
- Außenkontur: oben dk über UU, dann S(U1,W,H−sp) → S(U1,W,0) → S(U0,W,0) → S(U0,W,H−sp).
- Je Bogen eine Öffnung: S(a,W,0) → ri über UU∩[a,c] → S(c,W,0).
- Gefüllt mit `fill('evenodd')` in face.
- Ergebnis: über den Pfeilern massiv von 0 bis dk, sonst von ri bis dk; an der Wand 23…26.

**h) Keilsteine (:85):** je Bogen q = 1…9 bei u = a+(c−a)·q/10, senkrecht von ri bis ri+3,2, joint 0,6. Anders als in Entwurf 8/10 (entwurf8.js:95–99) nicht auf die Stirn beschnitten.

**i) Bogenkante und Ring (:86):**
- Kante: ri über der Strecke des Bogens, shade(face, −0,25), Breite 1.
- Ring: ri+3,2 in joint 0,6.
- In der Klemmzone ist ri+3,2 = dk+0,2. Der Strich ragt dann 0,2 über die Deckkante; im Entwurf deckt das die vordere Brüstung.

**j) Gleis (:87):** nur bei der Bahn.

**k) Vordere Brüstung (:88) und Abdeckung (:89):** Band in top mit Umriss joint, Abdeckung shade(top, +0,06), 1,2. Wird ersetzt durch `parapet(W, true)`.

**l) Kugelleuchten (:90–95):** gehören zu C7.

**m) Schatten (:55):** nur die Deckplatte, versetzt um SUN·dk, rgba .15. Liegt im Boden-Bild, ist keine Lage.

**Balustrade 'baluster'** (brueckenlicht :93–99 und :104), je Seite v (vorn = +W):
- **Baluster:** k = 0…10N bei u = U0+k/10, h = parH(u), nur bei h ≥ 1. Rechteck u±0,022 von dk bis dk+h−1,4. Vorn top, hinten shade(top, −0,14); Umriss joint 0,4.
- **Handlauf:** Band [dk+parH−1,6, dk+parH]. Vorn top, hinten shade(top, −0,1); Umriss joint 0,5.
- **Sockel:** Band [dk−0,01, dk+0,9·ramp]. Vorn shade(top, −0,05), hinten shade(top, −0,16).
- **Abdeckung:** Linie bei dk+parH, shade(top, vorn +0,06 / hinten −0,04), 1,3.

**Was im Entwurf fehlt** (Grafikfehler-Liste des Nutzers): Laibung, hintere Bogenlinie, Widerlager, Schatten der Öffnungen.
- Die sechs Punkte stehen nach V1 in AUFGABEN.md **2705–2706**, nicht mehr bei 2697–2700.
- In 2697 steht jetzt die Abnahme „Öffnung Stufe 3“.

### 3. Verallgemeinerung auf brSupports (n 1–8)

Vorschlag als eine Quelle (G8): `brArchFn(fam, n, piers)` in brueckenfamilie.js neben `brDeckHFn` (:231).

```
E = [A, ...piers.map(k => k - 0.5), B]    // piers = brSupports(look, n), ungefiltert
Bogen j (0…m−1, m = E.length−1):
  a = E[j] + (j>0 ? PW : 0),  c = E[j+1] − (j<m−1 ? PW : 0)
  sa = j>0 ? hp : HILL_H − sp,  sc = j<m−1 ? hp : HILL_H − sp      // hf(A) = hf(B) = HILL_H
  top = hf((a+c)/2) − gap,  mid = (sa+sc)/2,  rise = max(0, top − mid)
  raw(t) = sa + (sc−sa)·τ + rise·√max(0, sin πτ),  τ = clamp((t−a)/(c−a))
ri(t) = smin(raw(t), hf(t) − 3, r)           // auf [E[j]±PW] kein ri: massiv
```

Den Bogen j sucht man in E. Die Bögen sind ungleich breit, deshalb geht es nicht wie in entwurf8.js:77 über floor(u/(N/n)).

| n | Pfeiler (Kanten) | Bögen (Felder) | Hub je Bogen | ri in den Feldmitten |
|---|---|---|---|---|
| 1 | – | 1 | 0,5 | 23,5 |
| 2 | – | 2 | 5,7 | 27,8 · 27,8 |
| 3 | – | 3 | 8,5 | 29,0 · 31,5 · 29,0 |
| **4** | 2 | 2+2 | 11,0 | 28,9 · 23,9 · 23,9 · 28,9 |
| 5 | 2, 3 | 2+1+2 | 10,5 / 23,2 / 10,5 | 28,5 · 23,4 · 36,2 · … |
| **6** | 2, 4 | 2+2+2 | 9,9 / 25,2 / 9,9 | 28,1 · 23,0 · 33,3 · 33,3 · … |
| 7 | 2, 5 | 2+3+2 | 9,5 / 27,1 / 9,5 | 27,8 · 22,6 · 31,0 · 40,1 · … |
| 8 | 2, 4, 6 | 2+2+2+2 | 9,1 / 27,2 / 27,2 / 9,1 | 27,6 · 22,3 · 34,9 · 34,9 · … |

**Bahn (pk = 0):**
- n = 1–3: Hub 0, also ein flacher Sturz bei 23; die Stirn ist nur 3 px hoch.
- n ≥ 4: Die Wandbögen haben Hub 0,5, das ist eine gerade Rampe von 23 auf 13. Die Bögen zwischen Pfeilern haben Hub 5,5.
- Feldmitten bei n = 4: 20,8 · 15,5 · 15,5 · 20,8.
- So sieht B-stein im Familien-Entwurf tatsächlich aus (:43, pk = 0). Aber 15,5 < 16 widerspricht PLAN:327. C5 muss für die Bahn ein eigenes hp oder gap festlegen.

**Befunde zu den einzelnen Längen:**
- **n = 4 und n = 6** decken sich mit den abgenommenen Bildern.
- **n = 1–3:** ein einziger Bogen von Wand zu Wand. Er ähnelt C, hat aber am Scheitel 7,5 statt 4 Stein (entwurf6.js:77). Bild zeigen.
- **n = 5:** Der Mittelbogen ist nur 0,82 Feld breit und 36 hoch, das wirkt wie ein Schlitz.
- **n = 7:** Der Mittelbogen spannt über 3 Felder bis 40, weil brSupports [2, 5] liefert. Das passt nicht zu C8 („die Mitte überspannt 1 Feld“, PLAN:592).
  - Lösungsweg für beide Fälle: den Hub nach der Bogenbreite begrenzen, wie in Entwurf 7 (:76, `hp + (c−a)·9`).
  - Gehört zu C8, die Formel muss es aber schon tragen.
- **G9 (nie abstürzen):** c−a ≥ 0,82, τ geklemmt, √max(0,…), bei n < 4 einfach E = [A, B]. Kein NaN.

**Glatte Ansätze:**
- **Am Pfeiler** ist der Ansatz schon glatt: √sin hat dort eine senkrechte Tangente und geht so in die Pfeilerfläche über.
- **An der Wand** das harte min ersetzen durch ein polynomiales smin:
  - h = clamp(½ + ½·(b−a)/r, 0, 1); smin = b + (a−b)·h − r·h·(1−h).
  - smin ist immer ≤ min(a, b) und einmal stetig differenzierbar. Der Stein über dem Bogen bleibt also mindestens 3 dick.
  - Mit r = 2 ist der Knick weg.
  - Der Wandansatz sinkt um r/4 = 0,5 px (22,5 statt 23).
  - Die ersten 0,01 Feld bleiben steil, aber unter 0,5 px hoch.

### 4. Lagen und Schnitt je Feld [t0, t1)

**Werkzeuge:** die Helfer aus bkPaintFuss (brueckenbild.js:177–188).
- Flächen über `ts(T1)` mit T1 = t1 + ext; K = 12, bei z < 0,6 nur 4.
- Striche über `ts(t1)` mit `butt`.
- Dinge an festen t halboffen über `onEdge` bzw. [t0, t1); das letzte Feld schließt t1 ein.
- Strichbreite = Entwurf ÷ 2.

**Neu für C3:** Die ri-Linien brauchen dichtere Stützpunkte. Der Entwurf hat 72 je Feld; Vorschlag K = 48, weit weg 12. Dazu kommen die exakten Bogenenden a_j, c_j, soweit sie in [t0, T1] liegen. Zwischen den Feldern müssen nur die Feldenden übereinstimmen.

| # | Bauteil | Lage | Was je Feld | Farbe / G11 |
|---|---|---|---|---|
| 1 | Widerlager | h | nur Feld 0 (t0 = A): Viereck auf der Wandebene t = A, s −W…W, h von Boden bis ri(A) | sideT(face) |
| 2 | Pfeiler-Seitenfläche | h | bei t = e+PW = k−0,41 (liegt immer in Feld k), s −W…W, h Boden…hp. Die −t-Seite ist nie sichtbar. | sideT(face) |
| 3 | Laibung | h | Vierecke [t_j, t_j+1] ⊂ [t0, T1] ∩ Bogen, Ecken P(t,−W,ri)…P(t,W,ri); **nur wenn (ri_b−ri_a)/(t_b−t_a) > TH** | mix(sideT(face), soff, TH/ri′) |
| 4 | Hintere Balustrade | h | s = −W: Sockel und Handlauf als Band (T1), Baluster `onEdge(10)` nur bei parH ≥ 1, Abdeckung (t1) | Töne „hinten“, nach Achse unschattiert |
| 5 | Stirnband | v | ein Polygon: oben hf über ts(T1); unten rückwärts low(t) = ri im Bogen bzw. Boden auf dem Pfeiler, mit Doppelpunkten bei e±PW (Sprung hp ↔ Boden). Kein evenodd. | sh(face) |
| 6 | Keilsteine | v | t_q = a+(c−a)·q/10 (q 1…9) halboffen; senkrecht von ri bis min(ri+3,2, hf) | sh(joint), 0,3 |
| 7 | Bogenkante und Ring | v | line(W, ri) und line(W, min(ri+3,2, hf)), nur über Bogen ∩ [t0, t1] | sh(shade(face,−0,25)) 0,5 / sh(joint) 0,3 |
| 8 | Deck | d | deckTop(deck) über T1 | – |
| 9 | Fugen | d | nur ohne Weg: t = A+(j+½)/6 in [t0, t1), quer −W…W | `mix('#e6dcc8','#96876e',0.45)` = #c2b6a0, 0,3 (G5) |
| 10 | Weg / Gleis | d | `opts.wegPaint(hf)` bzw. `railPaint(H)` | – |
| 11 | Vordere Balustrade | o | wie Zeile 4 mit s = +W und den Tönen „vorn“ | unschattiert |
| – | Minilaternen je innere Kante | o | erst C7 | – |

**Warum 1–3 in L1 liegen, obwohl ihre Normale nach vorn zeigt** (die Normalenregel aus G2 würde L3 sagen):
- Sie sind Innenflächen der Öffnung. Alles im Hohlraum steht davor: Zug quer, Deko UNTER, Figuren.
- In 'v' würden sie beim Nachmalen über den Zug gemalt (`bkDrawMoving`, brueckenbild.js:153).

**Warum nur die zur Kamera gerichteten Laibungs-Vierecke:**
- Die abgewandten liegen hinter dem Mauerwerk von Feld i und i+1.
- Beim Nachmalen von 'h' (brueckenbild.js:152, Figur hinter dem Deck) liegt Feld i+1 im GL-Bild schon im Standbild. Die abgewandten Vierecke würden dann darüber erscheinen.
- Das Kriterium ri′ > TH folgt aus dem Sichtstrahl (1, 1, TH) in (u, v, h). Es hängt weder von z noch von der Achse noch von W ab.

**Farben (G11):**
- Stirn, Keilsteine, Bogenkante und Ring: `sh(c) = ax ? shade(c, LIGHT.side) : c` (brueckenbild.js:180).
- Flächen mit Normale +t (Pfeilerseite, Widerlager) genau umgekehrt: `sideT(c) = ax ? c : shade(c, LIGHT.side)`.
  - Der Entwurf hat hier −0,12 (:77), LIGHT.side ist −0,22. Im Prüfbild vergleichen.
- Laibung, Vorschlag:
  - Grundton soff = #8f8676. Er ist in Entwurf 6–8 als `LOOK.stein.soff` angelegt (entwurf8.js:16), aber nie benutzt.
  - Ton je Viereck: mix(sideT(face), soff, TH/ri′). Am Ansatz geht ri′ gegen unendlich, damit schließt die Laibung ohne Naht an die Pfeilerseite an.
- Balustrade nie nach Achse schattieren (G11: „Geländer nicht“).

**G1 / G3:**
- Der Pfeiler ragt über die Kante. Seine Stirn teilen sich Feld k−1 ([e−PW, e+0,012]) und Feld k; seine Seitenfläche liegt ganz in Feld k.
- Baluster auf Kanten: wie die Holzpfosten als `vert` auf der Kante, halboffen. Dass die halbe Strichbreite ins Nachbarfeld ragt, ist wie in C2.md Fehler 10 hingenommen.

**Boden:** Pfeiler, Stirn über dem Pfeiler und Widerlager reichen bis zum Boden des Felds: Land 0, Wasser −6,3 (PLAN:320). Nicht fest 0.

**Gehört in keine Lage – Schatten:** `drawBkShadows` (bruecken.js:449–461) malt heute nur die versetzte Deckplatte. Stein braucht laut PLAN:382 zusätzlich:
- das Stirnband zwischen ri und hf, je Stützpunkt um SUN·h versetzt
- den Tunnelboden (Grundriss der Bögen × [−W, W]) ohne Versatz

### 5. Was C3 außerdem wissen muss

**1. 'stein' kommt beim Maler gar nicht an.**
- `bkTileArgs` übergibt `art: bkArtOf(c.b)` (bruecken.js:409). `bkArtOf` (:19) kennt nur die BK_ARTEN holz und stahl (:11–14).
- `brLegacyLook` macht bei Anhöhen-Brücken aus allem außer 'stahl' Holz (brueckenfamilie.js:65).
- `bkSupports` geht über `brLook` (bruecken.js:38). Ergebnis: Stützen nach Holz „wenige“, bei n = 4 also auf Kante 1 und 3 statt 2.
- 'stein' liest `brLook` nur bei gültigem brp mit k = 'a:stein' (:39, :76; geschrieben über `brStamp` :40).
- **Lösung:**
  - Material im Maler aus `brSpanLook` holen (je groundVersion gemerkt, brueckenfamilie.js:188–206).
  - `BK_FUSS.stein` anlegen; ohne das greift der Zweig in brueckenbild.js:22 nicht.
  - Den Stein-Maler unabhängig von der Familie bauen. Die Bahn läuft heute in den flachen Rückfall (:23), C5 nutzt sonst dieselbe Geometrie mit pk 0.

**2. Pfeilerliste.**
- `opts.supports` ist je Feld gefiltert: `c.i ? bkSupportsShown(c) : []` (bruecken.js:409). Feld 0 bekommt [], blockierte Kanten fallen weg.
- ri hängt in jedem Feld von allen Pfeilern ab. Stein braucht deshalb ein eigenes `opts.piers = bkSupports(c.b)` in jedem Feld.
- Eine blockierte Pfeilerkante kann bei Stein kaum entstehen: geprüft wird beim Bauen und beim Artwechsel (:180, :242), bei Linien (`edgeError`, rules.js:1325) und bei Deko (`smallError`, :1677).
- Falls doch: den Pfeiler trotzdem zeichnen, statt die Bögen umzubauen. So bleibt es bei einer Quelle (G8).

**3. „nah“ und „fern“ widersprechen sich in den Unterlagen.**
- karte-anhoehen-bruecke.md:347 und PLAN:329 meinen mit „nah“ die Anhöhe bei t = A: kleinere Koordinate, vorher gezeichnet, ihre Wand ist sichtbar.
- bruecken.js:442 und C2.md:266 meinen damit die Anhöhe bei t = B.
- Das Widerlager gehört an t = A. Bei t = B wird nichts gezeichnet: letztes Feld ohne ext, Striche `butt`.

**4. BK_W 0,4 statt 0,3.**
- Die Laibung ist 0,8 tief, der Pfeiler wirkt massiger.
- Weit weg ausdünnen (Falle 17):
  - Die Baluster stehen alle 0,1 Feld, bei z 0,45 also 1,4 px auseinander. Weit weg nur Sockel und Handlauf als volle Brüstung.
  - Keilsteine ab z < 0,6 weglassen.

**5. Strichbreiten.**
- Die Untergrenze `max(0.6, f·z)` (brueckenbild.js:179) macht Fugen und Ring (0,3) und die Baluster-Umrisse (0,2) bei z = 1 doppelt so dick wie im Entwurf (C2 Restrisiko 1).
- Vorschlag: Baluster als einen senkrechten Strich der Breite 1,4 ohne Umriss.

**6. brClear (G8).**
- Die Steinöffnung ist jetzt die eigentliche Grenze. Bei n = 4 ist in Feld 1 bei t = 1,25 nur noch 19,5 frei; BK_CLEAR erlaubt 20 (bruecken.js:16).
- Bleibt `brClear` in C3 unverändert (brueckenfamilie.js:242), ragt eine 20 hohe Deko nahe am Pfeiler um 0,5 in den Bogen.

Relevante Dateien:
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenfamilie-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf8.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf7.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf6.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/C2.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-anhoehen-bruecke.md
- /Users/ericwinderlich/Projekte/Spiel/AUFGABEN.md

=====

Karte B: Fallen und Umgebung für Stein (C3)

Ich habe nur gelesen: keine Tests, kein npm, kein Browser, keine Datei geändert. Stand ist 327147a (C2g). Die Höhen unten habe ich mit `node -e` aus den Entwurfsformeln nachgerechnet (HILL_H 26, sp 3, hp 13, gap 7,5, PW 0,09, Pfeiler aus `brSupports`).

## 0. Das Wichtigste vorweg

1. **`art:'stein'` ohne gültiges `brp` ist heute überall Holz.**
   - `brLegacyLook` kennt bei 'anhoehe' nur stahl/holz (js/brueckenfamilie.js:65).
   - `bkArtOf` macht alles außer holz/stahl zu 'holz' (js/bruecken.js:19).
   - Prüfbild- und Testbrücken für C3 brauchen deshalb ein `brp` mit `k:'a:stein'` über die **ganze** Brücke: `{...brMoney(bkCost('stein',n).cost, bkCost('stein',n).mat), k:'a:stein'}`.
   - `brStamp` (brueckenfamilie.js:40) ruft `brPrice` ohne n auf. Für Anhöhen kommt damit nur der Preis eines Felds heraus, also zu wenig.
2. **Der Lichtraum unter Stein hängt vom Ort ab.**
   - In den Feldmitten ist er ≥ 22,3. Das reicht für Deko 20 und für den Zug 13.
   - An den Ecken-Plätzen neben einer Pfeilerkante sind es nur 14,2–17,5. Laterne (17), Baum (18) und Kristalllaterne (20) stecken dort im Gewölbe.
   - Außerdem schneidet die Eckdeko den Pfeiler.
   - `brClear()` ist konstant (brueckenfamilie.js:242), und `bkEdgeBlocker` prüft nur die Seitenmitten.
3. **Durch die Öffnungen fällt nie Licht** (Tunnel 0,8 tief, Sonne steil, Zahlen in Abschnitt 3).
   - Der Tunnelboden muss ganz im Schatten liegen.
   - Deckschatten plus Grundfläche ergeben schon den ganzen Steinschatten.
4. **Begriffsfalle „nah/fern“.**
   - PLAN 2.3 und karte-anhoehen-bruecke.md:347: „nah“ heißt kleinere Koordinate. Diese Anhöhe wird vorher gezeichnet, ihre Wand ist sichtbar.
   - C2.md:266 und der Kommentar in bruecken.js:442 nennen die Anhöhe mit der **größeren** Koordinate „nahe“ (nah zum Betrachter).
   - Das Widerlager gehört an die Anhöhe mit der kleineren Koordinate: Feld 0, t = −½.
5. **Die „dunkle Kante“ liegt nicht in der ersten Öffnung.**
   - Sie steht oben auf der Anhöhe mit der größeren Koordinate, quer über dem Deckende (hills.js:342–367).
   - Nach G1 kann die Brücke sie nicht decken.

## 1. Die sechs Glitch-Punkte: Fehler im Entwurf → Gegenmittel im Spiel-Maler

Der Wortlaut steht in `git show a4806ef:AUFGABEN.md`, Zeilen 2696–2699. PLAN §3 C3 und Falle 4 verweisen auf AUFGABEN.md:2697–2700; seit V1 steht dort anderes. Die Kurzliste ist jetzt AUFGABEN.md:2705–2706, dort steht zusätzlich „Zipfel am Ende“.

### (a) Knick an der Wand

**Fehler im Entwurf:**
- `ri = Math.min(dk−3, Bogen)` (tools/brueckenfamilie-entwurf.js:72, tools/brueckenlicht-entwurf.js:90).
- Der Bogen `base + amp·sqrt(sin(πτ))` steigt an der Wand senkrecht an. Das Deck steigt dort nur um pk·π/n (bei n 4 etwa 12 px je Feld).
- Die Klemme greift also: Die Bogenkante läuft erst 3 unter dem Deck parallel mit und knickt dann in die Kurve ab.
- Wo die Klemme aktiv ist (am anderen Ende spiegelbildlich), liegt der Knick mitten im ersten bzw. letzten Feld, nicht genau an der Wand:

| n | Klemme aktiv für t in |
|---|---|
| 1 | vernachlässigbar |
| 2 | [−0,50; −0,30] |
| 3 | [−0,50; −0,08] |
| 4 | [−0,50; 0,09] |
| 5–8 | bis 0,094 / 0,087 / 0,078 / 0,068 |

**Gegenmittel im Spiel:**
- Eine Funktion ri(G, t) in brueckenfamilie.js (G8): Maler, `brClear` und Test nutzen sie gemeinsam.
- Ohne harte Klemme, also C1-stetig. Zum Beispiel `smin(a,b,k) = min(a,b) − max(k−|a−b|,0)²/(4k)` mit k ≈ 2–3; es weicht höchstens k/4 ab.
- Stützpunkte im Weltraster k/12, dazu die exakten Öffnungsgrenzen.
- Test: ri ≤ hf−3 überall, und die Steigung springt zwischen Nachbarstützpunkten nicht.

### (b) Platte am Pfeiler

**Fehler im Entwurf** (brueckenfamilie-entwurf.js:77, Licht-Entwurf :109):
- Ein Rechteck bei u = Kante+PW über die volle Tiefe −W…W, von 0 bis hp.
- Die Farbe ist `shade(face,−0,12)`, also heller Stirnton, mit Fugenstrich.
- Es schließt kein Gewölbe an, und die Achse wird nicht schattiert.
- Darüber steht Hintergrund, deshalb wirkt es frei stehend. Projiziert ist es 2W·32 px breit: im Entwurf 19,2 px, mit BK_W 0,4 sogar 25,6 px.

**Gegenmittel im Spiel:**
- Die Pfeilerseite gehört zur Laibung des **späteren** Felds: t = k−½+0,09 liegt im Prisma von Feld k (G1/G3). Sie wird in L1 ('h') gezeichnet.
- Dunkler Innenton, Vorlage archWall (draw-objects.js:1050: pier −0,12, vault −0,24, inner −0,38).
- Gleiche Stützpunkte wie die Laibung, nahtloser Übergang, kein Umriss-Strich.
- **G11:** Die Normale der Laibung bzw. Pfeilerseite ist +t.
  - Bei ax 0 zeigt sie nach +x, dann gilt `LIGHT.side`. Bei ax 1 bleibt sie ungeschattet.
  - Das ist genau umgekehrt zu `sh()` (brueckenbild.js:180), das für die Stirn (+s) gilt.

### (c) Öffnung ohne Tiefe

**Fehler im Entwurf:** Er zeichnet nur die Stirn mit evenodd-Löchern (:79–83), ohne Laibung. Man sieht durch den Bogen auf hellen Boden.

**Was die Kamera im Tunnel wirklich sieht:**
- Die Richtung zur Kamera ist (Δt, Δs, Δh) = (1, 1, 32).
- Eine Gewölbefläche h = ri(t) zeigt nur dort zur Kamera, wo **ri′(t) > 32 px je Feld (= TH)**.
- Das ist nur die linke Kämpferseite jeder Öffnung: die Pfeilerseite ganz, dann ein Streifen, bis die Steigung unter 32 fällt (bei n 4 etwa 0,07 Feld).
- Die rechte Seite und der Scheitel zeigen weg.

**Gegenmittel im Spiel:**
- Laibung als Vierecke zwischen P(t,+W,ri) und P(t,−W,ri), nur wo ri′ > TH. Das Kriterium hängt nicht von der Achse ab.
- **Falle:** Ein Vorzeichentest der Fläche auf dem Schirm wie archWall:1061 kippt mit ax. `bkTileArgs` vertauscht bei ax 1 u und v (bruecken.js:405), das ist eine Spiegelung.
- Durch die Öffnung von Feld k sieht man auch die Laibung von Feld k−1, weil die Strahlen nach −t laufen. Feld k−1 ist vorher gemalt, die Malerreihenfolge stimmt.
- Dazu kommt der Tunnelschatten (Abschnitt 3).

### (d) Hintere Stirn fehlt

- Die Außenseite der hinteren Stirn (Normale −s) ist nie sichtbar.
- Jeder Strahl durch die vordere Öffnung trifft eines von vier Dingen: den Boden, die Laibung bzw. Pfeilerseite, die Wand der Anhöhe mit kleinerer Koordinate, oder er geht durch die hintere Öffnung hinaus.
- Gefehlt hat also das Tunnelinnere, nicht die hintere Stirn.
- **Gegenmittel im Spiel:**
  - Keine hintere Stirn malen; PLAN 2.4 sieht sie in L1 zu Recht nicht vor. Stattdessen Laibung und hintere Balustrade in L1.
  - Kein Rückwand-Trick über mehrere Felder wie in archWall (draw-objects.js:1056, Falle 5).

### (e) Schatten der Öffnungen

- **Fehler im Entwurf:** Nur der Deckschatten, versetzt, alpha 0,15 (:55). Durch die Öffnungen sieht man hellen Boden.
- **Gegenmittel im Spiel:** siehe Abschnitt 3.

### (f) Ausschnitt an der fernen Anhöhe

**Fehler im Entwurf** (:209–212): Er schneidet per evenodd-Clip die ganze Oberseite der Anhöhe bei fester Höhe H und ihre +y-Wand aus. Dabei fehlen:
- der Grasnarbenrand (+0,4),
- der Wegarm 0,06,
- die Dinge auf der Anhöhe.

Weil die Brücke über das fertige Bild gemalt wird, übermalt sie dort auch Bäume.

**Gegenmittel im Spiel:** Ein Clip ist nicht nötig.
- Die Anhöhe mit der größeren Koordinate kommt in der Feldschleife erst nach tileA und tileB des letzten Brückenfelds (render.js:2196–2200). Auch GL hält diese Reihenfolge (gl.js:686–694).
- Sie deckt physikalisch richtig alles der Brücke unter 26 bei t → B, als Keil h ≥ 26−32·(B−t).
- Ihre Wand zur Lücke ist eine Rückseite.
- **Bedingung G1:**
  - Das letzte Feld hat kein ext (bruecken.js:409, erfüllt).
  - Striche sind 'butt' (brueckenbild.js:182, erfüllt).
  - Die Balustrade läuft auf 0 aus (Entwurf: ramp über 0,45; Pfosten mit h < 1 entfallen). Bei t = B wird also nichts gezeichnet.
- **Falle 25 geprüft, kein Befund an den Endfeldern:**
  - Brückenfelder sind keine Anhöhen, `pre()` liefert null (render.js:1956). Brückenfelder werden also nie vorgezogen.
  - hillLate malt nur auf Rauten späterer Anhöhen, und die verdecken die Brücke dort ohnehin.

### (g) Zipfel am Ende

- Gemeint ist Entwurf 6 C: `parH = PH·min(1, Abstand/0,45)` (brueckenlicht-entwurf.js:91), der Bogen setzt an der Wand bei H−sp = 23 an.
- So übernehmen.

## 2. Wandanschluss

**Reihenfolge je Zeile:** Anhöhe x0−1 (tileA, tileB) → Brückenfelder 0…n−1 (tileA mit `bkDrawStill`, tileB Nachmalen) → Anhöhe x0+n.

**Anhöhe mit kleinerer Koordinate** (an t = −½):
- `drawHillTile` (hills.js:387) malt das Bildchen `paintHill` (:329):
  - Oberseite genau auf der Raute (fu = 0 an der Wand, :336).
  - Wand +x/+y zur Lücke (:383–384) mit Muster und Grasnarbe (`paintHillWall` :319–327). Die Narbe beginnt oben 0,4 über HILL_H und reicht nach unten bis HILL_H − lipH − 0,7·lipH: bei fels/mauer bis 22,3, bei erde bis 19,2 (HILL_STY :11–15).
- Danach `hillFlat`: Weg oben, Arm 0,06 aufs Deck. Die 0,012 aus `bkFlatOver` (:444) gelten nur am anderen Ende.
- Dann Linien, Dinge und Deko oben. In tileB die Spaziergänger.

**Anhöhe mit größerer Koordinate:**
- Auf ihrer Oberseite liegt die dunkle Kante zur tieferen Seite: `rgba(45,85,30,.5)`, 1,5 px, hills.js:349; bu ist an der Lücke wahr. Sie liegt quer über dem Deckende.
- Ihre Wand zur Lücke wird nie gemalt, weil nur +x/+y-Wände gezeichnet werden.
- Wegarm 0,012 bei Fußgänger.
- Optional lässt man die Kante weg, wo eine Brücke aufliegt. Dann muss `hillSig` das wissen, sonst bleibt das gemerkte Bildchen falsch (Karte R18).

**Was man durch die Öffnungen sieht** (die Strahlen laufen nach hinten **und** nach −t):
- den Boden der Lückenfelder aus dem Boden-Bild (Gras, Weg und Gleis flach, Wasser 6,3 tiefer, draw-base.js:154),
- den Tunnelschatten,
- die Laibung desselben bzw. vorigen Felds,
- Deko UNTER und Bewegtes U,
- durch die hintere Öffnung den Boden und die Dinge hinter der Brücke,
- **nur in der ersten Öffnung** die Wand der Anhöhe mit kleinerer Koordinate,
- nichts von der Anhöhe mit größerer Koordinate.

**Ist die Grasnarbe in der ersten Öffnung sichtbar?**
- Ein Strahl durch (t, +W, h < ri) trifft die Wand in der Höhe h − 32·(t+½).
- Das ergibt höchstens etwa 23. Die Narbe ist also oben im Eck sichtbar, bei erde bis etwa 4 px.

**Was die Laibung decken muss:**
1. Die Pfeilerseite über die volle Tiefe, von der Bodenhöhe bis hp 13. Über Wasser heißt Bodenhöhe −6,3, sonst schweben die Pfeiler; gleiches gilt für das Stirnband.
2. Das Gewölbe ab dem Pfeiler, solange ri′ > 32.
3. Das Widerlager:
   - nur in Feld 0, in der Ebene t = −½, mit s ∈ [−W, W],
   - von etwa 19 (HILL_H−7, deckt auch erde) bis 26,4 (Narbenrand),
   - in L1, Normale +t, Schattierung wie in 1(b).
   - Daneben bleibt die Wand normal sichtbar.

**Weitere Punkte am Anschluss:**
- Am Ende mit der größeren Koordinate nichts zeichnen (G1, „nichts über U1“).
- Beim äußeren Bogen ist an der Wand die Wand der Anhöhe selbst die sichtbare Kämpferfläche. Die geklemmte bzw. geglättete Kurve hat dort eine Steigung von etwa 12 px je Feld, also unter 32, und ist unsichtbar.
- Boote kennen Anhöhen-Brücken noch nicht (`seaCross`, rules.js:2557; das ist C10). Über Wasser führe ein Boot sichtbar durch den Steinpfeiler.

## 3. Tunnelschatten

**Heute (C2g):** `drawBkShadows` (bruecken.js:449–461)
- zeichnet je Brücke nur das Deck,
- versetzt jeden Stützpunkt um SUN·hf(t). SUN (render.js:101) entspricht Δu = +0,0123·h und Δv = −0,0048·h Feld je Höhenpunkt.
- Ein Pfad, `SHADOW_COL` 0,3, nonzero (:460).
- Es gibt keinen Test auf Wasser und keine Grundfläche.

**Physik:**
- Damit Licht quer durch einen 0,8 tiefen Tunnel fällt, bräuchte es ri ≥ 0,8/0,0048 = 165 (O-W) bzw. 0,8/0,0123 = 65 (N-S). Das kommt nie vor; hf ist höchstens 49,4.
- Neben der Brücke gibt es also keine bogenförmigen Lichtflecken.
- Der Tunnelboden liegt im Schatten, bis auf einen schmalen Streifen: bei O-W vorn etwa 0,1 Feld, bei N-S hinten etwa 0,25 Feld. Das kann man vernachlässigen.
- Der Deckschatten ist quer höchstens 0,61 versetzt, die Grundfläche ist 0,8 tief. Beide hängen also immer zusammen und ergeben zusammen den ganzen Steinschatten.
- Die Stirnbänder aus PLAN 2.6 fügen nichts hinzu. Bei gleichem Drehsinn schaden sie nicht.

**Für C3:** Die Grundfläche [A, B] × [−W, W] ohne Versatz in denselben Pfad, nur über Landfeldern. Die Wasserfläche liegt 6,3 tiefer, ein Schatten auf Höhe 0 säße daneben. PLAN 2.6 sagt ohnehin „nur auf Land“; das gilt streng genommen schon für das C2-Deck.

**Fallen:**
1. **Drehsinn.**
   - `pt()` vertauscht bei ax 1 u und v. Dieselbe (t,s)-Reihenfolge ergibt je Achse eine andere Windung.
   - Überlappen sich die Schatten zweier Brücken mit verschiedener Achse, heben sie sich in nonzero auf.
   - Abhilfe: die Fläche normieren wie in `drawHillShadows` (hills.js:441/456).
2. **Doppelt dunkel mit dem Anhöhenschatten.** Der hat einen eigenen fill mit alpha 0,22 (hills.js:460).
   - O-W: der Streifen t ∈ [−½; −½+0,32] an der Wand mit kleinerer Koordinate.
   - N-S: t ∈ [B−0,126; B] am anderen Ende.
   - Beides liegt genau in der ersten bzw. letzten Öffnung.
   - Das C2-Deck stößt dort bündig an, weil hf an der Wand gleich HILL_H ist. Die Grundfläche überlappt.
   - Abhilfe: diesen Streifen aus der Grundfläche weglassen, oder die Brückenpolygone in den Pfad der Anhöhenschatten legen, damit es ein einziger fill ist.
3. **⚙️ Schatten aus** (render.js:148): Dann ist der Tunnel wieder hell, und die Tiefe kommt nur noch aus der Laibung.
4. **Rand des Boden-Bilds:** Der Rand `near` umfasst ±1 Chunk (render.js:422). Das reicht.

## 4. Lichtraum (Ecke = Kante ± 0,1, Baum = ± 0,16, Zug = Feldmitte ± 0,19)

| n | Pfeiler-Kanten | ri in den Feldmitten | Ecke | Baum | Zug, Rand nahe Pfeiler | Wandecke |
|---|---|---|---|---|---|---|
| 1 | – | 23,5 | – | – | – | 23,3 |
| 2 | – | 27,8 / 27,8 | – | – | – | 24,6 |
| 3 | – | 29,0 / 31,5 / 29,0 | – | – | – | 24,4 |
| 4 | 2 | 28,9 / 23,9 / 23,9 / 28,9 | 14,5 / 14,5 | 17,1 | 20,7 | 24,2 |
| 5 | 2, 3 | 28,5 / 23,4 / 36,2 / 23,4 / 28,5 | 14,4 / 17,5 | 16,9 | 20,4 | 24,1 |
| 6 | 2, 4 | 28,1 / 23,0 / 33,3 / 33,3 / 23,0 / 28,1 | 14,3 / 16,3 | 16,7 | 20,1 | 24,0 |
| 7 | 2, 5 | 27,8 / 22,6 / 31,0 / 40,1 / … | 14,3 / 15,9 | 16,6 | 19,8 | 24,0 |
| 8 | 2, 4, 6 | 27,6 / 22,3 / 34,9 / … | 14,2 / 16,6 | 16,4 | 19,6 | 23,9 |

**Deko-Plätze:**
- Plätze mit |s| ≤ 0,4 zählen zur Gruppe UNTER (bruecken.js:426).
- Feldmitte und Seitenmitten quer liegen bei ≥ 22,3. Das passt für BK_CLEAR 20.
- **Ecken neben einer Pfeilerkante passen nicht** (Abstand 0,1 bei r 0,08, rules.js:1148). DECO_TALL (roofs.js:228): laterne 17, baum 18, kristallaterne 20; unvermessene Dinge zählen 0.
- Der Pfeiler (Kante ± 0,09, volle Tiefe) und die Eckdeko überschneiden sich um 0,07.
- Bei Holz ist der Pfosten nur 0,034 breit und steht bei s 0,34, dort gibt es keinen Konflikt.
- Die Seitenmitte zur Pfeilerkante sperren schon `bkEdgeBlocker` (:52–55) und `smallError` (rules.js:1677).

**Warum das sichtbar wird:**
- Eine Eckdeko hinten (s −0,4) wird nach 'h' gemalt (brueckenbild.js:86–88). Ihre Spitze liegt über der Laibung bzw. Pfeilerseite und sticht sichtbar ins Gewölbe.
- Das C2-Argument „Träger in der Vorderfläche“ (C2.md Fehler 2) gilt für Stein nicht, denn das Gewölbe geht durch die ganze Tiefe.

**Züge und Wege:**
- Zug quer: Höhe 13, ARCH_CLEAR 16 (draw-objects.js:756), halbe Breite 0,17 bzw. Tram 0,19 (movers.js:764). Über die Wagenbreite sind es mindestens 19,6, das passt für n 1–8.
- Wege quer passen. Längs geht es nur über Kanten ohne Pfeiler (`bkEdgeBlocker`).

**Bahn-Stein (pk 0)** mit Entwurfswerten:
- Der Scheitel liegt bei hf−7,5 = 18,5, also unter dem Kämpfer an der Wand (23). Die Öffnung wird eine schräge Rampe von 23 auf 13.
- In der Feldmitte neben dem Pfeiler sind es 15,5, also unter 16. Deko 20 passt fast nirgends.
- C5 braucht eigene Werte. In C3 Bahn-Stein nicht durch den Steinmaler schicken.

**Was C3 braucht:**
- `brClear(G, t, r)` = Minimum von ri über [t−r, t+r] minus 1 (wie `roofClear`), im Pfeilerbereich 0.
- Aufrufer:
  - `bkUnderError` (:111–113) je Platz über `slotPos`,
  - `bkTooTall` (:139–145; slot und form sind da, dazu `decoR`),
  - `smallError` (rules.js:1658/1683).
- Platz 8 (Eckpunkt, s ±0,5) liegt außerhalb des Steins und darf bei BK_CLEAR bleiben.
- `bkEdgeBlocker` und rules.js:1677 für Stein um die Eckplätze erweitern:
  - ax 0, Kante zwischen Feld k−1 und k: in Feld k−1 die Plätze 1 und 3, in Feld k die Plätze 0 und 2.
  - ax 1: in k−1 die Plätze 2 und 3, in k die Plätze 0 und 1 (`slotUV`, rules.js:983).
- Lichtraum bei Materialwechsel prüfen:
  - `bkSetArt` (:237–254) prüft nur Stützen, nicht `bkUnderError`.
  - ↶ (actions.js:1201–1207) prüft bei einer stehenden Brücke nur neue Stützen.
- Holz und Metall bleiben wie heute, kein alter Stand wird ungültig.

## 5. Was für art 'stein' noch fehlt

**Lesen**
- `brLegacyLook` (brueckenfamilie.js:65) kennt nur stahl/holz. Ohne `brp` wird Stein überall zu Holz: im Bild, bei den Stützen (`bkSupports`, bruecken.js:37–40, geht über `brLook`) und bei der Erstattung (`brPaid` :121 über BK_ARTEN).
- Für C3 kann das so bleiben: Plan 1.9 sieht vor, dass eine unbekannte art in der Zwischenfassung als holz gelesen wird. Testbrücken bekommen ein `brp` (siehe 0.1).

**bkArtOf (bruecken.js:19) liefert 'holz'.** Folgen:
- `bkTileArgs` (:409) gibt dem Maler 'holz', Stein erscheint als Holzbogen.
- Der Text in :216 lautet „Holzsteg abreißen“.
- `openBkInfo` (:521–529) zeigt den Titel „Holzsteg“ und markiert den Holz-Knopf.
- `bkSetArt` (:239) gibt beim Wechsel Stein → Holz false zurück; dieser Wechsel geht nicht.
- **Vorschlag:** das Aussehen einmal je Boden-Fassung in `bkFresh` merken (cell-Objekt). Die Setzer zählen `groundVersion` hoch. C2.md Punkt 3 warnt nur vor `brLook` je Stützpunkt.

**BK_ARTEN / BK_ART_IDS (:11–15)**
- Stein fehlt. `bkError` (:168–169) und `bkSetArt` (:240–241) lesen `.tech` von `BK_ARTEN[art]`; bei 'stein' gibt das einen TypeError.
- BK_ARTEN ist nach Plan 1.7 die Alttabelle, und `brPaid` :121 hängt daran. Nicht einfach erweitern, neue Materialien laufen über BR_MAT/BR_COST (C6).

**bkError (:180)**
- Übergibt `bkSupportsError` kein art. Für Stein kommen dann die Holzstützen [1, 3] heraus statt des Pfeilers [2] (C6).

**bkSetArt auf Stein bei einer Altbrücke**
- `wasNew` ist false, es wird kein `brp` geschrieben.
- Das Bild bleibt Holz.
- Bezahlt werden 120 + 3 Quader je Feld, erstattet werden später 60 + 3 Bretter.
- Es muss deshalb immer gestempelt werden (C6).

**Maler**
- `BK_FUSS` (brueckenbild.js:173–176) hat kein stein.
  - `bkPaintLage` (:22) fällt dann auf den flachen Maler zurück (H = HILL_H, :23).
  - `bkH`, Figuren, Antippen und Schatten nehmen aber den Bogen. G8 ist gebrochen, die Leute schweben.
- `bkPaintFuss` hat nur `if holz` / `else if stahl` ohne else (:189/:209). Ein `BK_FUSS.stein` ohne eigenen Zweig malt gar nichts.
- Also `BK_FUSS.stein` und einen Zweig (bzw. `bkPaintStein`) zusammen einführen.

**Pfeilerlage**
- `bkTileArgs` gibt `supports` nur für c.i > 0 und gefiltert durch `bkSupportsShown` (:65–69); der Maler filtert dann aufs eigene Feld (:188).
- Für Stein müssen die Bögen aus `bkSupports(c.b)` kommen, ungefiltert und auch für Feld 0.
- „Pfeiler nur nicht zeichnen“ geht bei Stein nicht, die Bögen hingen sonst bei 13 in der Luft. Hier ist eine Entscheidung nötig.

**ts()** (:181)
- Kennt nur das Weltraster und die Feldenden.
- Das Stirnband braucht die Öffnungsgrenzen Kante ± 0,09 als doppelte Stützpunkte (Sprung 0 ↔ 13). Sonst werden die Pfeilerkanten schräg.

**Deck**
- `brLook` gibt bei Stein `deck` 'belag' (BR_MAT :15). Ohne Weg ist `belag` null, dann Steinplatten.
- Entwurf: Deck `#e6dcc8`. Fugen als `mix` statt `rgba(150,135,110,.45)` und im Raster `onEdge(6)`; im Entwurf hängt der Abstand von N ab (:76).

**BK_LOOK** (:7–10)
- Hat kein stein. Bahn-Stein fällt auf das flache Holz zurück, mit Böcken nur an den Pfeilerkanten (`brSupports` Stein ignoriert fam, :217).
- Die Regeln passen dazu (G8), es sieht aber dünn aus; bis C5 hinnehmbar.
- `bkLayRail` prüft das Material nicht. Ein Gleis auf eine Fußgänger-Steinbrücke schaltet das Bild auf diesen Rückfall.

**brBox** (:15–18) reicht:
- Die Balustrade (6,5) liegt unter der Reserve von 16.
- Die Stirn bis zum Boden passt in TH/2+6.
- Der Pfeiler im Wasser erreicht vorn am Eck 20,7, das ist unter 22.

**bkPick** (:480–498)
- Sucht nur h ∈ [hf−3, hf+4]. Tippen auf die massive Stirn trifft das Bodenfeld dahinter (Falle 23 sinngemäß).
- Für Stein die Ebene s = +W mit lower(t) ≤ h ≤ hf mitprüfen. Die Öffnungen bleiben durchlässig, damit man darunter bauen kann.

**Icon**
- `drawBkIcon` (:463–475, n 2, ein Bogen ohne Pfeiler) fällt ohne `BK_FUSS.stein` flach zurück.
- ui.js:75/1661 kennen nur holz/stahl (C6).

**Was schon passt**
- BR_COST.anhoehe.stein = 120 + 3 Quader (brueckenfamilie.js:98), `bkCost` (:21).
- `parseSave` nimmt stein (state.js:370), `serialize` schreibt `brp` (:152–153).
- `brSupports` Stein: n 4 → [2], n 5 → [2, 3], n 6 → [2, 4], n 7 → [2, 5], n 8 → [2, 4, 6].

**Kleinigkeit:** actions.js:1202 setzt `art = bkArtOf(o)` und benutzt es nicht.

## 6. Vorschlag für die Reihenfolge in C3

1. **Geometrie:** eine Quelle in brueckenfamilie.js – Bögen aus `bkSupports`, ri glatt, `brClear(G, t, r)`.
2. **bkFresh:** Material merken. `bkTileArgs` gibt Material und volle Pfeilerliste weiter.
3. **Maler Stein:**
   - L1: hintere Balustrade, Widerlager (nur Feld 0), Laibung mit ri′ > TH samt Pfeilerseite.
   - L3: Stirnband (untere Grenze Boden bzw. ri), Bogenkante, Keilsteine.
   - L4: Belag bzw. Weg.
   - L6: vordere Balustrade, ohne Laternen.
4. **Regeln:** `brClear` ortsabhängig, Ecken an Pfeilerkanten sperren, `bkSetArt` und ↶ prüfen den Lichtraum.
5. **Schatten:** Grundfläche nur auf Land, Drehsinn normieren, Überlapp mit dem Anhöhenschatten vermeiden.
6. **Tests und Prüfbild:**
   - Tests: Prisma, deckend, ri glatt und ≤ hf−3, die Lichtraumtabelle aus Abschnitt 4, beide Achsen.
   - Prüfbild: Punkte (a)–(g) aus Abschnitt 1, in Nahaufnahme an beiden Wänden, mit erde- und fels-Wand und über Wasser.

## Dateien
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/hills.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/roofs.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenfamilie-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf8.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/C2.md
- /Users/ericwinderlich/Projekte/Spiel/AUFGABEN.md