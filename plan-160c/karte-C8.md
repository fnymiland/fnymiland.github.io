# Baukarte C8: Brücken zwischen Anhöhen bis 8 Felder

Stand HEAD `9fe11c6` (C7 abgenommen). Live ist `origin/main` = `ac7a848` (v1016). Ich habe nur gelesen und nichts geändert.

## 0. Was sich ändert, was schon geht

**Ändert sich:**
- `BK_MAX` von 4 auf 8 (`js/bruecken.js:16`), dazu der Kommentar in `:17`.
- Der Fehlertext in `js/bruecken.js:206`.
- Die Texte in `js/data.js:209` und `:785`.
- Die Pfeilerregel für Stein bei ungerader Länge (`js/brueckenfamilie.js:237`), erst nach der Entscheidung des Nutzers.
- Je nach Entscheidung ein Deckel für die Bogenhöhe (`:275`).
- Tests.

**Geht schon, im Code nachgeprüft:**
- Alle Rechnungen für Höhe und Geometrie sind schon auf `BK_READ_MAX` = 8 begrenzt (`brueckenfamilie.js:248/252/258/270/297`).
- Die Regeln prüfen je Feld bzw. je Kante: Schleife in `bkError` `bruecken.js:208`, `bkUnderError` `:117`, `bkTooTall` `:173`.
- `brClear` (`brueckenfamilie.js:312`) ist auf `BK_CLEAR` 20 gedeckelt.
- Eine gezogene Linie darf 80 Felder lang sein (`plan.js:11`).
- `bkPick` beginnt dynamisch bei `HILL_H + bkPeakMax() + 4` (`bruecken.js:623`).
- Brücken bis 8 Felder werden schon gelesen (`state.js:366`), auch in der Live-Version (geprüft mit `git show origin/main`).
- Der PLAN nennt auch `openBkInfo`. Dort ist nichts mehr zu tun: `bruecken.js:675` zeigt nur `b.n`. `ui.js:3286` ist eine alte Meldung im „Das ist neu“-Fenster und bleibt.

**Widersprüche zwischen den Berichten, im Code geklärt:**
- **Zeilennummern:**
  - Die Texte stehen in `data.js:209/:785`, nicht in :206/:782 wie im PLAN.
  - `brueckenbild.test.js`: Der Test steht in `:43`, die Schleife über n in `:51`.
  - `brueckenfamilie.test.js`: n 6 steht in `:114–115`, der Lichtraum n 1–5 in `:129`, n 6–8 in `:130`.
- **Bogen deckeln wie Entwurf 7** (Bericht „regeln“ ist dafür, Bericht „stein“ dagegen):
  - Entwurf 7 deckelt den Scheitel auf Ansatz + (c−a)·9 (`tools/bogen-anhoehe-entwurf7.js:76`).
  - Mit Faktor 9 fiele der Scheitel beim **abgenommenen** n 6 innen von 38,2 auf 29,4. Der Test `:115` würde rot.
  - Bei n 5 sänke der Lichtraum unter dem Mittelbogen auf etwa 18,9, also unter 20.
  - Ergebnis: Faktor 9 nicht nehmen.
  - Wenn überhaupt gedeckelt wird, dann den Hub auf 16·(c−a). Hub geteilt durch Bogenbreite ist heute: n 4 5,8 · n 6 innen 13,9 · n 7 Mitte 9,6 · n 8 innen 14,9 · n 5 Mitte 28,3. Ein Deckel bei 16 trifft also nur den 1-Feld-Bogen.
- **Stein-Pfeiler nachgerechnet** (`:237`): n 5 [2,3], n 6 [2,4], n 7 [2,5] (Bögen 2-3-2), n 8 [2,4,6]. Der PLAN-Satz „die Mitte überspannt 1 Feld“ passt nur bei n 5.
- **Holz „wenige“ nachgerechnet:** n 5 [1,4], n 6 [1,3,5], n 7 [1,3,4,6], n 8 [1,3,5,7].

## 1. Änderungen in Bau-Reihenfolge

**0. Vorher:** Das Bild mit den Stein-Varianten zeigen (Abschnitt 4). Der Nutzer entscheidet Frage 1 und 2. Ohne Entscheidung nur die Schritte 2–4 bauen.

**1. Tests schreiben** (Abschnitt 3), sie müssen erst rot sein.

**2. `bruecken.js:16–17`:**
```js
const BK_MAX = 8, BK_W = 0.4, BK_CLEAR = HILL_H - 6;   // längste Lücke (160c C8) …
const BK_READ_MAX = 8;   // Lesegrenze (v1016 liest bis 8) – BK_MAX nie darüber
```

**3. `bruecken.js:206`:** „sonst braucht die Brücke Pfeiler“ stimmt nicht mehr, denn Stein hat Pfeiler.
```js
if (sp.n > BK_MAX) return `Höchstens ${BK_MAX} Felder Lücke`;
```

**4. `data.js:209` und `:785`:** „1 bis 4 Felder“ wird „1 bis 8 Felder“.

**5. `brueckenfamilie.js:237`** (nur nach der Entscheidung). Variante „ungerade Länge: Mitte 3 Felder“:
```js
const steinK = (k, n) => n % 2 && n >= 5 ? k === (n - 3) / 2 || k === (n + 3) / 2 : (k <= n / 2 ? k : n - k) % 2 === 0;
… : look.mat === 'stein' ? look.fam === 'bahn' || steinK(k, n) : false
```
- Ergebnis: n 3 [] (wie heute), n 5 [1,4] (neu), n 7 [2,5] (wie heute). Gerade Längen bleiben gleich.
- Den Kommentar in `:230` anpassen.

Falls 2-1-2 bei n 5 bleibt und gedeckelt werden soll, dann in `:275` (und `hk: 16` in `BR_STEIN` `:268`):
```js
rise: Math.min(Math.max(0, hf((a + c) / 2) - S.gap - (sa + sc) / 2), S.hk * (c - a))
```

**6. Kein Code nötig für:** Holzstützen, Viadukt, Lampen, `brBox`, Schatten, Antippen, Figuren, Züge, Gleisnetz, Rückgängig.

**7. Abschluss:**
- `PLAN-160c.md:592` an die gewählte Stein-Regel anpassen.
- `PLAN-160c.md:546`: „k oder n−k ungerade“ durch „min(k, n−k)“ ersetzen.
- `CLAUDE.md:293` (Brückenfamilie, Stützen): die Stein-Regel ergänzen.
- `AUFGABEN.md:2714` C8 abhaken.
- `npm run bump`.
- „Bis 8 Felder“ erst in G3 ins „Das ist neu“-Fenster.

## 2. Fallen

| Falle | Ursache | Gegenmaßnahme | Test |
|---|---|---|---|
| `BK_MAX` wird später über 8 gehoben | `state.js:366` und live v1016 lesen nur bis 8, die Brücke verschwindet beim Speichern | Wächter-Test | altversion: `BK_MAX <= BK_READ_MAX <= 8` |
| Bogen deckeln mit Faktor 9 | ändert das abgenommene n 6 und den Lichtraum bei n 5 | nur Faktor 16 oder gar nicht | `brueckenfamilie:114–115` bleibt unverändert grün |
| Stein-Regel ändert schon gebaute Brücken | `brSupports` gilt für jede Steinbrücke | heute gibt es noch keine Steinbrücke mit 5–8 Feldern (`BK_MAX` 4, C-Schritte nicht live): **jetzt** entscheiden | `bruecke:186` |
| Stein n 5 als 1-3-1: Lichtraum in der Mitte des Wandfelds ≈ 19,9 | Wandbogen nur 0,91 breit | genauso wie das schon abgenommene n 6–8 | `:129` nur n 1–4, n 5 in die Liste `:130` |
| `bruecke:31` meldet keinen Fehler mehr | eine 5er-Lücke ist jetzt erlaubt | auf 9 Felder umstellen | `bruecke:31` |
| Geländer am Scheitel ragt über Ebene 2 | ab n 6: 26 + 19,7…23,4 + Geländer > 52 | Prüfbild mit einer Anhöhe der Ebene 2 seitlich vor der Lücke | optional `bruecken-reihenfolge` |
| `bkPick` prüft das Geländer auf `HILL_H` statt auf Deckhöhe | `bruecken.js:629`, bei n 8 etwa 1 Feld daneben | gibt es seit C2, nicht in C8 reparieren (kleine Schritte), eigenen Punkt notieren | Antipp-Test n 8 mit Anhöhe vorn |
| Der Rahmen-Test läuft länger | n 1–8 statt 1–4, etwa 3,6-mal so viele Durchläufe | Laufzeit messen, sonst nur n [1,2,3,4,7,8] | `brueckenbild:51` |
| Leistungswerte ändern sich | eine größere Brückenwelt verschiebt die Kamera-Mitte | `tools/brueckenwelt.js` nicht erweitern, die Welt ist der Prüfstand für alte Brücken | `brueckenwelt:34` bleibt |
| Eigene WLAN-Geräte mit v1004–v1014 | sie filtern noch mit `BK_MAX` und werfen 5–8 Felder weg | vor dem Prüfen alle eigenen Geräte neu laden | – |
| Kristall n 8 auf dem iPad | 8 Felder werden in jedem Bild neu gezeichnet (`bruecken.js:57`, R15) | auf dem iPad messen; hält C8 nicht auf | optional `brLiveTiles().length === 8` |

## 3. Tests zuerst

**`tests/bruecke.test.js`**

Hilfsfunktion: Anhöhe B steht bei x 14+n … 17+n, `luecke(3)` ist der Standard.
```js
const luecke = n => game(`for (let y = 10; y <= 14; y++) for (let x = 17; x <= 26; x++) { if (x >= 14 + ${n} && x <= 17 + ${n}) state.hills.set(x + ',' + y, { w: 0 }); else state.hills.delete(x + ',' + y); } groundVersion++; recalc()`);
```
- **`:30–31` ersetzen:** `luecke(9)`, dann `plan('bruecke',{x:12,y:12},{x:24,y:12}).err` muss auf `/Höchstens 8 Felder Lücke/` passen. Danach `luecke(3)`, damit `:32` weiterläuft.
- **Neuer Block „Bis 8 Felder (160c C8)“:**
  - **8 ja:** `luecke(8)`. Dann `plan(12→23)` ergibt `{ n: 8, cost: 480, err: null, mat: { bretter: 24 } }`. Nach `run()` gilt `BR()` = `[['14,12',{ax:0,n:8,art:'holz',brp:{money:480,bretter:24,k:'a:holz'}}]]` und das Geld ist um 480 weniger.
  - **Längs y:** Anhöhen x 6–8 bei y 4–7 und y 16–19, `plan({x:7,y:5},{x:7,y:17})` ergibt n 8 am Anker `'7,8'`.
  - **9 nein:** `luecke(9)`, dann ergibt `plan(12→24)` `{ n: 0, err: /Höchstens 8/ }`. Geld und `state.bruecken.size` bleiben gleich.
  - **Stein n 8:** nach dem Muster `stein4` `:344`/`:363` mit `luecke(8)`. Pfeiler [2,4,6]. Stirn und Pfeiler treffen, die Öffnung (Mitte des Bogens, Höhe 12) ergibt `null`.
  - **Spaziergänger:** nach dem Muster `:229`. `hwTopH(17.5 - f, 12 + f, 1)` ≈ `HILL_H + brPeak('fuss', 8)` (≈ 49,43). Kein Sprung über 1 bei Schritt 0,02 von u 12 bis 24.
  - **Antippen:** nach dem Muster `:244` für x 14–21, Kamera `iso(17.5, 12)`.
- **`:183`:** Holz mit n 7 ergänzen: `[1..8]` ergibt `…, [1,3,5], [1,3,4,6], [1,3,5,7]`.
- **`:186`:** Stein n 2–8:
  - mit „Mitte 3“: `[[],[],[2],[1,4],[2,4],[2,5],[2,4,6]]`
  - wie heute: `…[2,3],[2,4],[2,5],[2,4,6]`

**`tests/brueckenfamilie.test.js`**
- n 6 (`:114–115`) unverändert lassen, er wacht darüber, dass das abgenommene Bild bleibt.
- Neu für n 7: Mittelbogen von a 1,59 bis c 4,41, `ri(3)` ≈ 40,1.
- Neu für n 8: Feldmitten [27,3 · 22,3 · 34,9 · 34,9 · …].
- n 5 nach der Entscheidung. Die genauen Sollwerte erst nach der Abnahme des Bildes festschreiben.
- `:129/:130` (Lichtraum): bei 1-3-1 kommt n 5 aus der Schleife über n 1–5 in die Liste „weniger neben dem äußeren Pfeiler“.

**`tests/brueckenbild.test.js:43/:51`:** Rahmen für n 1–8. Der Aufbau bleibt; bei ax 1 liegen schon heute ab n 3 Anhöhen unter der Brücke.

**`tests/bruecken-altversion.test.js`:** `expect(game('BK_MAX <= BK_READ_MAX && BK_READ_MAX <= 8')).toBe(true)`.

**`tests/bruecke-gleis.test.js`** (Muster `:126`): Bahn über 8 Felder, Bahnhöfe bei 11 und 23. `route.deck` ergibt `[[2.5, 10.5]]`, die Wagen fahren in Höhe `HILL_H`, die Schranke darunter bleibt offen.

## 4. Prüfbilder

**Alle Modelle:**
- `tools/brueckenlicht-pruefung.js` kann die Länge schon über `n` einstellen. Der Platz reicht bis n 8 (x ≤ 25 von 44, y ≤ 65 von 66).
- Läufe: n 5, 6, 7, 8 × alle 9 Modelle × ax 0/1 × `nights [0, NIGHT_MAX]`, Licht an, dazu einmal `licht: null`.
- Zoom 1,8 und einmal weit weg (0,45, Bildchen).

**Stein-Varianten (vor dem Bau):**
- Ein neues Entwurfswerkzeug (Name z. B. `tools/steinbogen-c8-entwurf.js`). Es ersetzt `brSupports` nur im Browser und nur für Stein-Fußgänger (`brSupports` ist global, danach `groundVersion++`).
- n 5:
  - A 2-1-2 [2,3]
  - A′ 2-1-2 mit Deckel 16
  - B 1-3-1 [1,4]
- n 7:
  - A 2-3-2 [2,5]
  - B 2-1-1-1-2 [2,3,4,5]
  - C 3-1-3 [3,4]
- Zum Vergleich daneben n 6 und n 8.
- Je ein Weg quer unter dem Mittelfeld, ein Zug quer darunter und eine Kristallaterne in der Mitte des Wandfelds.
- Tag und Nacht (Laternen an den inneren Kanten).

**Figuren auf dem Scheitel:**
- Nach dem Muster `tools/bruecke-pruefung.js:35–44` (`figuresOnDeck`), Höhe aus `hwTopH`.
- Bei n 8 eine Figur an t 3,5 (x 17,5), eine im Wandfeld.
- Namensschild und Sprechblase müssen sichtbar sein, der Kopf liegt bei etwa Deck + 13.

**Sonderfälle:**
- Eine Anhöhe der Ebene 2 seitlich vor dem Scheitel (n 8).
- Holz „wenige“ n 7, zum Vergleich auch [1,2,5,6].
- Holz „keine“ n 8.
- Metall-Bahn-Fachwerk n 8: Höhe 11 über 7,7 Felder wirkt sehr schlank.
- Kristall mit Zacken n 8.
- Einmal GL gegen 2D (n 8, Figur oben).

## 5. Fragen an den Nutzer

1. **Stein mit 7 Feldern:** A 2-3-2 (heute), B 2-1-1-1-2 oder C 3-1-3 (Mitte 1 Feld)?
   - **Empfehlung: A.** Ein großer Mittelbogen, flacher als die inneren Bögen bei n 6 und n 8, und nur 4 gesperrte Feldseiten.
   - B und C mischen flache Bögen mit Schlitzen, die höher als breit sind. B sperrt außerdem 8 Feldseiten.
   - Den PLAN-Wortlaut („je 2 von außen, Mitte 1“) kann man bei 7 Feldern gar nicht umsetzen: 2+2+1+2+2 = 9.
2. **Stein mit 5 Feldern:** A 2-1-2 (heute, PLAN wörtlich, Schlitz 0,82 × 36), A′ 2-1-2 mit Deckel (Scheitel etwa 26) oder B 1-3-1?
   - **Empfehlung: B.** Dann gilt eine Regel für alle ungeraden Längen: „Mitte 3 Felder“. 3 und 7 Felder sind heute schon so.
   - Der Preis: Lichtraum in der Mitte des Wandfelds etwa 19,9 statt 20, genau wie bei n 6–8 schon abgenommen.
3. **Bogenhöhe bei 8 Feldern:** Der Scheitel liegt 23,4 über der Anhöhe, das Deck bei 49,4. Das Geländer ragt über die Ebene 2 (52).
   - **Empfehlung: lassen.** Es ist eine Formel für Bild, Figuren, Antippen und Steinbögen, und das abgenommene n 6 hängt daran.
   - Deckeln nur, wenn das Bild neben einer Anhöhe der Ebene 2 schlecht aussieht. Dann ändern sich die Steinbögen bei n 6 mit.
4. **Holz „wenige“ mit 7 Feldern:** [1,3,4,6] (zwei Böcke dicht um die Mitte) oder [1,2,5,6] (Mitte 3 Felder frei, wie bei Stein)?
   - **Empfehlung: lassen.** Die C1-Regel ist abgenommen; nur ändern, wenn das Bild unruhig wirkt.

Dazu ein Hinweis, keine Frage: Die Leistungs-Welt würde ich nicht um 5–8 Felder erweitern. Stein, Kristall und Licht fehlen dort ganz, das gehört in G2/D2 („Leistungswerte neu“).

---

## 6. Korrekturen aus der Gegenprüfung (2 Prüfer)

- Lichtraum Stein n 5 als 1-3-1: die tiefe Stelle ist die Mitte des Wandfelds (t 0 und t 4: brClear(S, 0, 0.14) ≈ 19,88), nicht t 1 – eigener Test; Schleife brueckenfamilie.test.js:128 nur n 1–4, Liste :129, Sollwerte :130.
- Zeilen: BR_STEIN brueckenfamilie.js:267, brClear :308.
- Geländer über Ebene 2: bei n 6 nur Stein und Metall (+6,5), alle Modelle erst ab n 7.
- Prüfbild n ≥ 7: W 800 (Brücke ≈ 461 px bei Zoom 1,8).
- Rahmen-Test: ax 0 liegt schon ab n 1 auf einer Anhöhe, ax 1 ab n 4 (für das Ergebnis egal).
