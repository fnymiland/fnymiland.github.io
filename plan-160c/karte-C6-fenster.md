Ich habe nur gelesen: keine Tests, kein npm, kein Browser, keine Datei geändert.

# Karte C6: Fenster, Leiste, Kosten und Bau im neuen Format (Anhöhen-Brücke)

**Stand:** main `327147a`, 13 Commits vor `origin/main` `ac7a848` (= v1016, live).

**Zeilen haben sich verschoben** gegenüber PLAN §3:
- `openBkInfo` steht jetzt bei bruecken.js:518–540 (nicht 475–497).
- `DECO_LOOKS.bruecke` bei data.js:1156 (nicht 1147).
- Memo-Schlüssel `planInfo` bei plan.js:288.
- `bkBuild` bei bruecken.js:198, `bkCost` bei :21.

**Aufwand:** Hoch.
- Vorschlag: in zwei Commits teilen. C6a: Leser, Geld, Bau. C6b: Leiste, Bildchen, Fenster.
- Davor ein kleines Farb-Entwurfsbild (Normal), siehe Frage 3.

**Voraussetzung aus C3–C5:**
- Maler für stein, kristall und Bahn sind erreichbar.
- `brClear` hängt vom Aussehen ab: Stein-Laibung, Zacken.
- Lassen C3–C5 `bkArtOf` auf `BK_ARTEN` stehen, muss C6 das umstellen (B3).

---

## 0. Befunde, die über PLAN-160c hinausgehen

**B1 – v1016 verwirft `brp` an `state.bruecken` (schwer)**
- Ursache:
  - v1016 `brPaidOk` lautet: `r !== 'money' && (!(r in RES) …) → false` (`git show origin/main:js/brueckenfamilie.js` :23–27).
  - `'k'` ist kein Rohstoff, also fällt das ganze `brp` in v1016 `brClean` → `parseSave` (v1016 state.js:366–371).
- Der Nachtrag „v1016 behält brp“ (PLAN:124, brueckenfamilie.js:28) stimmt nur für Kacheln, weil `tileOut` dort roh kopiert.
- Folge: Jeder Speicherstand, den ein v1016-Gerät schreibt (zweites eigenes Gerät mit altem Cache), nimmt allen Anhöhen-Brücken das `brp`.
- Danach liest der heutige Code über `brLegacyLook` (brueckenfamilie.js:65):
  - Stein und Kristall werden zu Holz.
  - `bru`, `brz`, `brb`, `brl` werden ignoriert.
  - `brPaid` gilt nach der Holz-Tabelle.
- `art`, `brc`, `brw`, `brb`, `brl`, `brz` und `bru` überleben v1016: Dort steht `BR_MAT` mit allen 4 Materialien, und `brClean` behält diese Felder.

**B2 – `bkError` prüft für Stein und Kristall die falschen Stützen**
- `bkSupportsError(…, { ax, n, art })` (bruecken.js:180) liest ein Objekt ohne `brp`. Über `brLegacyLook` wird daraus Holz „wenige“.
- Beispiele:
  - Stein n=4 prüft die Kanten [1, 3] statt [2].
  - Kristall n=4 prüft [1, 3] statt []. Ein Weg, der längs darunter liegt, blockiert den Bau dann zu Unrecht.

**B3 – `BK_ARTEN[...].name` und `.tech` stürzen ab, sobald `bkArtOf` stein oder kristall liefert**
- Betroffene Stellen:
  - bruecken.js:168 (`A.tech`), :216 (Label in `bkDemolishInfo`), :240, :521, :524
  - render.js:1758
  - plan.js:304
- Besonders render.js:1698: Zeigen mit dem Abriss-Werkzeug ruft `bkDemolishInfo` in **jedem Bild** auf. Das gäbe die „Hoppla“-Meldung.

**B4 – `brStamp` rechnet mit `n = 1`** (brueckenfamilie.js:40, `brPrice(look, at)`)
- Die Anhöhe speichert aber den Gesamtpreis des Bauwerks (siehe `brPaid` :121, `bkSetArt` :251).

**B5 – Das Fenster zeigt den Neupreis statt des Bezahlten**
- Die Preisdifferenz (bruecken.js:524) und „Abreißen +…“ (:534) nutzen `bkCost(art)`, nicht `brPaid`.
- Bei Altständen ohne `brp` und bei gekauften Optionen ist die Anzeige deshalb falsch.

**B6 – Lade-Reihenfolge**
- In index.html kommt `bruecken.js` vor `brueckenfamilie.js`.
- `BK_ART_IDS` (bruecken.js:15) darf auf oberster Ebene also nicht `BR_MAT_IDS` lesen. Stattdessen aus data.js ableiten.

**B7 – Die Maler kennen nur `art`**
- `bkTileArgs` (bruecken.js:403–411) gibt weder Farbe noch Planken noch Belag/Muster weiter.
- `BK_FUSS` (brueckenbild.js:173–176) hat feste Farben.

**B8 – Uneinheitliches Deck bei Kristall mit Weg**
- Kristall mit Weg zeigt das Muster (der Weg ist unsichtbar), Holz und Metall mit Weg zeigen den Belag.
- Ursache: die `same`-Logik in `brLook` (:76–78), weil das Altfeld stein und kristall als Holz liest.

**B9 – Preise unter dem v1016-Rückfall**
- v1016 erstattet für stein und kristall wie Holz: 60 Taler + 3 Bretter je Feld (v1016 `bkCost(bkArtOf)`, `bkArtOf` → holz).
- `BR_COST.anhoehe.stein` (120 + 3 Quader) und `kristall` (800 + 4 Kristall + 1 Metall) enthalten keine Bretter.
- Damit gilt „nie mehr erstatten als bezahlt, je Rohstoff“ nicht. Die Regel K3 gilt jetzt auch für Anhöhen, weil sie seit v1016 live sind (PLAN 1.6 „keine Untergrenze“ ist überholt).

---

## 1. Interne Entscheidung (Empfehlung): Anhöhe liest ihr Aussehen ohne `brp`

- **brueckenfamilie.js:65:** `L.mat = BR_MAT[o.art] ? o.art : 'holz'`.
- **`brLook` (:73–83):** Für `at === 'anhoehe'` die br-Felder immer lesen, nicht nur bei `brIsNew`.
  - `same` ist dann immer wahr.
  - Deck: `brb`, falls gesetzt; sonst `'belag'`, wenn ein Weg auf dem Deck liegt, sonst `'muster'`.
  - Stein ohne Weg zeigt dann das eigene Steindeck. Das muss der C3-Maler können.
- **`brp` bleibt nur fürs Geld** (`brPaid`/`brIsNew` mit `k = 'a:<art>'`).
- **Warum das sicher ist:**
  - `state.bruecken` wird streng über `brClean` gelesen.
  - v951 sieht Anhöhen gar nicht, es gibt also keine Mehrdeutigkeit mit einem Rückfall.
- **Das löst B1 (Aussehen), B2 und B8.** Außerdem lassen sich gedachte Objekte (`{...b, bru:'jede'}`) prüfen, ohne vorher zu stempeln.
- `brueckenfamilie.test.js:45–53` bleibt gültig.
- **Geld ohne `brp`** (brueckenfamilie.js:121): direkt die eingefrorenen Werte aus `BK_ARTEN` statt `BR_COST.anhoehe` nehmen.
  - Heute ist das gleich. Es schützt aber vor einer späteren Preisänderung bei Holz.
  - stein und kristall erstatten ohne `brp` wie Holz, genau wie v1016.

---

## 2. Bauschritte

### C6a – Daten, Leser, Geld (bis auf die Leiste unsichtbar)

**data.js:1156 `DECO_LOOKS.bruecke`**
- `forms`: `holz` „Holz“, `stahl` „Metall“, **`stein` „Stein“, `kristall` „Kristall“ angehängt**.
  - Index = `paintNew.bruecke.form`, nie umsortieren (Karte R4).
- `cols`: `[{ id:'mat', name:'Wie das Material', c:<Hex> }, ...BRIDGE_COL_DEFS]`.
  - `col i` ↔ `brc i−1`; `col 0` lässt `decoLookNew` weg (K6).
  - Für das Feld „Wie das Material“ entweder ein `css`-Verlauf (wie `.sw.bunt`, style.css:305) oder ein neutraler Hex-Wert.
  - Nicht `#6f5238` (das ist Dunkelbraun) und nicht `#b08a5e` (das ist Holz).
  - Kein `design`: also nichts in `DESIGN` bzw. der Kunstakademie.

**bruecken.js**
- :15 `BK_ART_IDS = DECO_LOOKS.bruecke.forms.map(f => f.id)` (wegen B6).
- :11–14 `BK_ARTEN` bleibt als **eingefrorene v1016-Tabelle**, nur fürs Geld ohne `brp`. Keine Namen und keine Technik mehr daraus lesen.
- :19 `bkArtOf = b => BR_MAT[b && b.art] ? b.art : 'holz'`, **im selben Commit** wie alle Stellen aus B3 → `BR_MAT[m].name`.
- :20 `bkArtNew` → neu `bkLookNew()`:

  ```js
  const p = decoLookNew('bruecke');
  return { at: 'anhoehe', fam: 'fuss', mat: BK_ART_IDS[p.form || 0] || 'holz',
           col: p.col ? p.col - 1 : null, plank: null, deck: 'muster',
           licht: null, zacken: false, stuetzen: 'wenige' };
  ```

- :21 `bkCost(art, n)` → `bkPrice(look, n) = brCostMat(brPrice(look, 'anhoehe', n))`.

**brueckenfamilie.js**
- `brStamp(o, at, look, n = 1)` (B4).
- `BR_MAT` bekommt Sperren:
  - `stein: { lm: 'klippe:1' }`, `kristall: { lm: 'kristall:1' }`.
  - Metall an Anhöhen nur `tech: 'bahn'` wie bisher. Kein zusätzliches `erzberg:2`, denn `bahn` braucht nur `erzberg:1` (data.js:952). Sonst verlöre jemand eine Fähigkeit, die er heute hat (Frage 2).
- Neu `brMatLock(mat, at)` → Text oder null, über `unlockOk`/`unlockText` (rules.js:841/857, `lmStepName` :856).
  - Für Metall an der Anhöhe genau `Metall: erst mit der Eisenbahn`, weil bruecke.test.js:37 `/erst mit der Eisenbahn/` erwartet.

**data.js**
- :206 `ITEMS.bruecke`: `cost`/`mat` als Getter wie `huegelrampe` :212–214 (`typeof`-Schutz).
  - Rechnet `brPrice(bkLookNew(), 'anhoehe')`; die Menükarte (`cardPrice`) zeigt dann den Preis je Feld des gewählten Materials.
- Texte :206 und :782: „Holzsteg oder Stahlbrücke“ bzw. „Holz oder Stahl“ → vier Materialien, „Material und Farbe wählst du oben in der Leiste“. „1 bis 4“ bleibt für C8.

### C6b – Bau im neuen Format

**`bkError(sp, look, noCost)`** (bruecken.js:165–186)
- Sperre über `brMatLock`.
- Text „…das Material wechselst du im Fenster“.
- Stützen über `{ ax, n, art: look.mat }`; das stimmt erst mit Abschnitt 1.
- `bkUnderError(x, y)` mit dem Aussehen, falls C3/C4 `brClear(look)` einführen.
- Preis über `bkPrice(look, n)`.

**`scanBruecke`** (:188–197)
- `look = bkLookNew()`, liefert `art: look.mat` und `mat` zurück.
- plan.js:303–305: Name aus `BR_MAT`; die Rohstoffe zeigt `matText` von selbst.
- Der Memo-Schlüssel plan.js:288 enthält `decoLookNew('bruecke')` schon, Form und Farbe sind also drin.

**`bkBuild(sp, look)`** (:198–206). So kann C9 die Funktion wiederverwenden:

```js
const c = brPrice(look, 'anhoehe', sp.n),
      b = { ax: sp.ax, n: sp.n, art: look.mat, ...(look.col != null ? { brc: look.col } : {}) };
state.money -= c.money; payMat(brCostMat(c).mat); b.brp = { ...c, k: brSig(b, 'anhoehe') };
```

- Nur Abweichungen schreiben, also kein `brb`, `bru`, `brl` oder `brz` (R6).

**render.js:1758 Schild:** Materialname; ist das Material gesperrt, der Sperrtext.

### C6c – Setzer `brSet` (brueckenfamilie.js; Signatur allgemein, vorerst nur `'anhoehe'`)

Aufruf: `brSet({ at: 'anhoehe', k }, ch)`. Mögliche Änderungen `ch`:
- `{ mat }`
- `{ col }` (null = Farbe des Materials)
- `{ plank }` (Frage 4)
- `{ deck: 'belag' | 'muster' }`
- `{ stuetzen: 'keine' | 'wenige' | 'jede' }`
- `{ zacken: 'kaufen' | 'an' | 'aus' }`
- Licht kommt in C7.

Ablauf:
1. `b`, `n`, `paid = brPaid(b, 'anhoehe')` holen. `nb` = Kopie mit der Änderung. Standardwerte löschen: `brc` null, `bru` 'wenige', `brb` = Standard.
2. **Prüfen am Zielobjekt `nb`:**
   - Stützen nur bei Holz-Fußgänger, Zacken nur bei Kristall-Fußgänger; sonst `false`, und das Fenster zeigt den Knopf gar nicht.
   - Beim Materialwechsel `brMatLock`.
   - `bkSupportsError(k, nb)` (die Signatur `art`/`rail` :59 reicht dann).
   - Lichtraum je Feld mit dem Aussehen von `nb` (Stein, Zacken; abhängig von C3/C4).
3. **Geld:**
   - **Material:** `paid` voll zurück; neu `brPrice({...brLook(nb), zacken: false}, 'anhoehe', n)`. Je Rohstoff prüfen, ob Bestand + Erstattung reicht (wie :245–246). `nb.brz` löschen, wenn das Material nicht mehr Kristall ist. `brp = { ...neu, k: brSig(nb) }`.
     - Falle: Bleibt `brz` stehen, kommen die Zacken später gratis zurück, zum Beispiel über Kristall → Metall mit Gleis → Kristall → Gleis weg.
   - **Zacken kaufen:** `brAdd({money:0}, BR_OPT.zacken.feld, n)`, also 150n + 2n Kristall. `brp = brNoK(paid) + Aufpreis` mit neuem `k`. Danach an und aus kostenlos (Regel 137).
   - **Farbe, Planken, Deck, Stützen:** kostenlos. `brp` = `paid` mit `k`; damit wird ein Altstand einmal festgeschrieben, exakt nach der alten Tabelle.
4. `groundVersion++` (Bildchen `br|x,y|…`, `bkFresh`, `brSpanCache`, Schatten im Bodenbild), dann `sfx` und `save()`. `recalc()` ist nicht nötig; `bkSetArt` ruft es auch nicht.

Weitere Anpassungen:
- `bkSetArt` (bruecken.js:237–254) wird eine Hülle `brSet(…, { mat })`. Die Tests bruecke-gleis:64/67/170 und tools/bruecke-gleis-pruefung.js:31 rufen sie.
- **Rückgängig** (actions.js:1201–1206):
  - Die Prüfung auf neue Stützen läuft mit Abschnitt 1 von selbst über `bkSupports(o)`.
  - Ergänzen: Für eine stehende Brücke mit anderem Aussehen auch den Lichtraum mit dem zurückkommenden Aussehen prüfen (Stein, Zacken).
  - In :1202 ist `art` unbenutzt.

### C6d – Leiste und Bildchen

**`brIcon(fam, mat, o)`** (brueckenbild.js) ersetzt `drawBkIcon` (bruecken.js:463–475).
- Geometrie wie bisher:
  - `H = HILL_H·0,75`, `s = z·0,33`, `cx −= 16s`.
  - Anhöhen: u −1,6…−0,5 und 1,5…2,6, v ±0,9.
  - Brücke: n = 2 über t −0,5…1,5, `hf = brDeckHFn(fam, 2)` × 0,75, Stützen `brSupports(look, 2)`.
- Malt die Lagen h, v, d, o in einem Zug. **Bei Kristall auch das Glas**, das im Spiel nur tileB malt (t1/t2, Falle).
- Immer Tag, ohne Licht, `FOG` aus.

**Bildchen-Schlüssel**
- `lookThumb` (ui.js:1659–1664) → `brThumb(fam, mat, brc, licht, zacken)` mit Schlüssel `br|fam|mat|brc|licht|zacken` (PLAN 2.6, Falle 14).
- `lookThumb('bruecke', form, col)` → `brThumb('fuss', BK_ART_IDS[form], col ? col-1 : null, null, false)`.
- Menükarte `thumbRaw` (ui.js:74–75) → `brIcon` mit `bkLookNew()`.
- `katPicCache` (ui.js:183–187) merkt sich das Bild für `'bruecke'` nur einmal. Optional nach einer Wahl in der Leiste löschen.

**`lookChips`/`wireLookChips`** (ui.js:1691–1708)
- Der Farbknopf erscheint von selbst, sobald `cols` gesetzt ist.
- Gesperrte Materialien mit Schloss und Sperrtext als `title` zeigen, wählbar lassen; der Bau meldet den Grund (Frage 2).

**Maler-Anschluss (B7)**
- `bkTileArgs` gibt `opts.look = brLook(c.b, 'anhoehe')` mit, `art = look.mat`, `weg = bkWegAt(c) && look.deck === 'belag'`.
- Die Maler nehmen ihre Farben aus einer Hilfsfunktion `brColors(BK_FUSS[mat], look)`.
- Ohne Farbe bleibt das Bild pixelgleich.
- Farben nur als Hex über `shade`/`mix` (G5, Falle 15); Vorderseite über `sh()` (G11).
- Lagen:
  - Farbe: L1 (hinteres Geländer, Stützen), L3 (Randbalken, Träger, Bogen, Stirn), L6 (vorderes Geländer).
  - Planken und Belag/Muster: L4.
  - Zacken: tileB t1.

**Vorschlag für die Farben** (nach dem Muster der Wasserbrücke, draw-objects.js:971–972):

| Material | Was die Farbe färbt |
|---|---|
| Holz | Geländer/Stützen = bc, Randbalken `shade(bc, −0,15)`, Bogenträger `shade(bc, −0,05)`; Planken: Deck = pc, Fugen `shade(pc, −0,22)` |
| Metall | Träger/Bogen/Geländer = bc, dunkel `shade(bc, −0,3)`, Glanz `shade(bc, +0,35)` |
| Stein | Stirn/Balustrade = bc, Abdeckung `shade(bc, +0,1)`, Fugen als Mischfarbe |
| Kristall | Pfosten, Handlauf, Streifen = bc; Glas bleibt |

### C6e – Fenster `openBkInfo` (bruecken.js:518–540)

- **Titel:** „Brücke aus Stein“ bzw. „Bahnbrücke aus Stein“, darunter „n Felder Lücke“.
- **Material:** 4 Knöpfe, der Selektor `data-bkart` bleibt wegen der Tests.
  - Bild: `brThumb(fam, id, b.brc …)`.
  - Differenz `brPrice(Ziel) − brPaid(b)` in Talern und je Rohstoff (B5).
  - Gesperrt: Klasse `locked` und `title` mit dem Sperrtext.
- **Farbe:** „Wie das Material“ + 10 Farben (`data-brc`), kostenlos.
- **Deck Belag/Muster** (`data-brb`): nur, wenn ein Weg auf dem Deck liegt.
- **Stützen** keine/wenige/jede (`data-bru`): nur Holz-Fußgänger.
- **Zacken** (`data-brz`): nur Kristall-Fußgänger. Erst „kaufen −150n + 2n Kristall“, danach an/aus.
- **Weg/Gleis:** wie bisher.
- **Abreißen:** `+brPaid + Weg + Gleis`; das Label in `bkDemolishInfo` :216 ebenso.
- Jeder Knopf läuft als `undoable(() => brSet(…)); openBkInfo(x, y)`. Das sperrt für Zuschauer und Besuch und meldet über `cloudTouched` an die Cloud.
- Bei 375 px kein waagrechtes Scrollen.

---

## 3. Datenwege – was schon kann, was fehlt

- **`serialize`** (state.js:152–153): schreibt `art` roh und `brClean({...b, brm: null})`, also `brc`, `brw`, `brb`, `brl`, `brz`, `bru` und `brp` samt `k`. Nichts Neues nötig. Die Setzer schreiben nur Abweichungen.
- **`parseSave`** (state.js:366–372): `art` ∈ `BR_MAT`, sonst holz; `brClean` streng; n ≤ `BK_READ_MAX`. Ausreichend.
  - `paintNew` (:315–316) behält `{form, col}`. Es kommt kein neuer `paintNew`-Schlüssel.
- **`tileOut` und `BR_KEYS`:** nicht betroffen. Die Anhöhe ist keine Kachel, das Material steht in `art`.
- **Live-Spiegel:** `bruecken` liegt im Rest und läuft über `parseSave`. Fehlt nur ein Test.
- **Rückgängig:** Der JSON-Schnappschuss (actions.js:1117–1133) enthält `brp` und alle Felder; `undo` zählt `groundVersion` hoch. Ergänzung siehe C6c.
- **Cloud:** `SIG_KEYS` (cloud.js:63) bleibt. `paintNew` steckt darin, die Wahl in der Leiste zählt also als Änderung. `bruecken` meldet sich über `undoable`.

---

## 4. Was v1016 (live) sieht und erstattet

- **Brücke im neuen Format nach einem v1016-Rundlauf:**
  - `art` bleibt, die br-Felder bleiben, `brp` fällt weg (B1).
  - v1016 zeichnet stein und kristall als alten flachen Holzsteg. Kein Absturz.
- **v1016-Fenster:** zeigt Stein als Holzsteg. „Holzsteg“ tut nichts; „Stahlbrücke“ erstattet den Holzpreis, bucht Stahl ab und setzt `art = stahl`.
- **v1016-Abriss:** `bkCost(bkArtOf)`, für stein und kristall also 60 + 3 Bretter je Feld. Optionen (Licht, Zacken) gibt v1016 nicht zurück.
- **`paintNew.bruecke {form: 2|3, col}`:** v1016 behält es; `lookOk` ist für Form ≥ 2 falsch, also holz; die Farbe wird ignoriert. Kein Absturz.
- **Nie zu viel erstatten:**
  - Taler und Metall sind in Ordnung.
  - Bretter nicht: v1016 erstattet 3n Bretter, die bei Stein und Kristall nie bezahlt wurden (B9).
  - Die neue Fassung erstattet ohne `brp` gleich viel wie v1016.
  - Abhilfe: Stein und Kristall je Feld + 3 Bretter, oder hinnehmen (Frage 1).

---

## 5. Tests (zuerst schreiben)

**bruecke.test.js**
- Anpassen:
  - :23 genaues JSON → `{ ax: 0, n: 3, art: 'holz', brp: { money: 180, bretter: 9, k: 'a:holz' } }`.
  - :105–110 Panel-Text „Holzsteg“ → „Holz“.
  - :128–134 Bildchen aller 4 Formen und Farben.
- Neu „Fenster (C6)“:
  1. 4 Materialknöpfe; gesperrte mit Grund. Ohne `state.restore.klippe` meldet Stein den Ort.
  2. Holz → Stein: Bilanz je Rohstoff exakt, `brp`/`k` neu, Stützen [2] bei n = 4; abgelehnt bei einem Weg längs über Kante 2.
  3. Farbe: kostenlos, „Wie das Material“ löscht `brc`, `groundVersion` steigt.
  4. Stützen jede/keine: nur Holz-Fußgänger; jede wird von einem Weg längs abgelehnt; Rückgängig wird abgelehnt, wenn inzwischen ein Weg längs liegt.
  5. Zacken: kaufen kostet n × (150 + 2 Kristall), an/aus kostenlos, Abriss = `brp`; beim Wechsel weg von Kristall verfallen sie.
  6. Belag/Muster nur mit Weg.
  7. Abreißen-Text = `brPaid`.
  8. Zuschauer und Besuch ändern nichts.
  9. Jeder Knopf: Rückgängig stellt Geld und Objekt exakt wieder her.
- Neu „Leiste“:
  - `paintNew.bruecke = {form: 2, col: 5}` → `planInfo` 360 + 9 Quader = Abbuchung.
  - Ergebnis `art 'stein'`, `brc 4`, `brp` mit `k 'a:stein'`; Bilanz Bau → Abriss 0.
  - Schild und Abriss-Zeigen (render.js:1698) mit Stein werfen nicht (B3).

**bruecke-gleis.test.js:64/67/170:** `bkSetArt` als Hülle bleibt grün. Neu: Holz mit `bru 'keine'` und Gleis bekommt trotzdem Böcke; Zacken-Reihe fehlt bei Gleis.

**bruecken-altversion.test.js** – neuer Block „Anhöhe, v1016 live“:
- Eingefroren:
  - `V1016_BK = { holz: {money: 60, bretter: 3}, stahl: {money: 120, metall: 3} }`.
  - v1016-Lesen: `brp` nur, wenn alle Schlüssel außer `money` in `RES` liegen, sonst weg.
- Je Setzer-Ergebnis (Bau × 4, Farbe, Stützen, Zacken kaufen, Wechsel hin und zurück):
  - v1016-Erstattung ≤ `brp` je Rohstoff.
  - Nach dem Rundlauf: `brPaid` ≤ `brp`, `brLook` wirft nicht, Material bleibt.
- Dazu Rundlauf `serialize`/`parseSave` und `liveSplit`/`liveJoin` für eine Stein-Brücke mit `brc`, `bru`, `brz`, `brp`.

**Weitere Tests**
- **bruecken-geld.test.js:91–101 („Rückfall je Rohstoff“):** um `'anhoehe'` mit dem v1016-Rückfall erweitern. Schlägt mit den heutigen Preisen bei Brettern fehl (→ Frage 1).
- **brueckenfamilie.test.js:**
  - Anhöhe ohne `brp` mit `art: 'stein'` hat Material Stein.
  - Kristall mit Weg hat Deck Belag.
  - `bkSupports({ax, n: 4, art: 'stein'})` = [2].
- **schmuck.test.js:12:** Ids eindeutig (`'mat'` und die 10 Farben) – grün.
- **design.test.js:** unberührt, weil nichts in `DESIGN` landet.
- **leuchtturm.test.js:48:** `thumbRaw` für alles.
- **anhoehe-stufe2:26:** neue Namen nur einmal. Gegrept: `brSet`, `brMaterialize`, `brIcon`, `brThumb`, `bkLookNew`, `brMatLock` und `brColors` sind frei.
- **leistung-je-ding.json:242–243:** neue Schlüssel „bruecke Form 2/3“ = 0 (`drawObject` zeichnet keine Brücken). `npm run leistung:neu` mit Begründung in AUFGABEN. Die Welt `bruecken` bleibt unverändert; Altstände sollen pixelgleich bleiben.

---

## 6. Prüfbilder (der Hauptagent, nacheinander)

1. **Leiste**, Werkzeug Brücke, bei 375 px und am Desktop:
   - Formen-Auswahl: 4 Bilder mit Bogen, Gesperrtes mit Schloss.
   - Farb-Auswahl: 11 Felder.
   - Der Knopf zeigt die gewählte Farbe.
   - Menükarte bzw. Kategoriebild.
2. **Fenster**:
   - Holz leer (Stützen), Holz mit Weg (Belag/Muster), Holz mit Gleis (keine Stützen, keine Zacken).
   - Stein, Metall, Kristall (kaufen bzw. an/aus).
   - Gesperrtes Material, Zuschauer.
3. **Spielbild**:
   - 4 Materialien × (Wie das Material, Rot, Blau, Weiß), n = 3, Ost-West und Nord-Süd.
   - Nah (z 2) und weit (Bildchen, z 0,45); nach einem Farbwechsel sofort das neue Bildchen.
   - GL = 2D; Nacht vorerst ohne Licht.
   - Erweiterung von `brueckenPruefung` mit zur Laufzeit gesetzten Brücken, die Testwelt nicht ändern.
4. **Altstand:** testsave-bruecken mit glitch.js gegen die Grundlinie, Abweichung 0.

---

## 7. Fragen an den Nutzer (je mit Empfehlung)

1. **Vorläufige Preise je Feld:** Stein 120 + 3 Quader, Kristall 800 + 4 Kristall + 1 Metall, Zacken +150 + 2 Kristall.
   - Dazu die Live-Frage: Die online-Fassung erstattet Stein und Kristall wie Holz (60 + 3 Bretter).
   - **Empfehlung:** Stein und Kristall bekommen je Feld +3 Bretter („Gerüst“). Dann gibt kein altes Gerät je mehr zurück, als bezahlt wurde.
   - Alternative: die kleine Lücke hinnehmen, bis alle Geräte neu geladen sind.
2. **Freischalten:** Stein ab Klippe Stufe 1, Kristall ab Kristallinsel Stufe 1, Metall an Anhöhen wie bisher mit der Eisenbahn (kein zusätzliches Erzberg 2).
   - **Empfehlung:** Gesperrtes in Leiste und Fenster sichtbar mit Schloss und Grund, nicht ausblenden.
3. **Was färbt die Brückenfarbe je Material?** Vorschlag siehe C6d; bei Kristall bleibt das Glas blau.
   - **Empfehlung:** zuerst ein Entwurfsbild 4 Materialien × 4 Farben, dann abnehmen.
4. **Planken-Farbe auch an Holzbrücken zwischen Anhöhen?** Der Plan nennt sie erst für die Wasserbrücken (D3).
   - **Empfehlung:** ja, gleiche Knöpfe wie später übers Wasser.
5. **„Belag/Muster“ nur zeigen, wenn ein Weg auf der Brücke liegt.** Wortlaut z. B. „Deck: wie der Weg / eigenes Muster“.
6. **Material wechseln** heißt: alles zurück und neu bezahlen (wie heute bei Holz ↔ Stahl). Gekaufte Zacken verfallen beim Wechsel weg von Kristall.
   - **Empfehlung:** so lassen.
7. **Namen in der Leiste:** „Holz / Metall / Stein / Kristall“ statt „Holzsteg / Stahlbrücke“.

---

**Relevante Dateien:**
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/data.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/plan.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/state.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke-gleis.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-altversion.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-geld.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenfamilie.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/schmuck.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung-je-ding.json
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js

v1016-Kopien zum Nachsehen: /private/tmp/claude-501/-Users-ericwinderlich-Unterrichtsplaner/a65f0e36-b293-4699-ac3e-bbc58f9caec9/scratchpad/v1016-bf.js, v1016-state.js, v1016-bruecken.js