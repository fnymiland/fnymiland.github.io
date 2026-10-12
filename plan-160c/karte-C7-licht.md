Ich habe nur gelesen: keine Tests, kein npm, kein Browser, keine Datei geändert. Stand ist `327147a` (C2g).

Gelesen habe ich:
- PLAN-160c.md ganz
- plan-160c/B2.md, plan-160c/karte-licht-farbe-bilder.md, luecken.md (B4/B5, Fragen 4/5/8)
- tools/brueckenlicht-entwurf.js ganz, die Lichtteile von tools/brueckenfamilie-entwurf.js und tools/kristallbruecke-entwurf.js
- js/brueckenbild.js ganz, js/brueckenfamilie.js ganz
- js/bruecken.js:198–540
- draw-objects.js:1–90, render.js:536–1000, render.js:1918–2215
- gl.js:150–300, gl.js:476–720
- rules.js:2786–2809, draw-schmuck.js:1–56
- tests/brueckenbild.test.js, tests/bruecken-reihenfolge.test.js, nachtlicht-bildchen, webgl:60, strom:121

# C7 – Licht zwischen Anhöhen: Karte für den Bau

## 0. Vorab: Widerspruch im Plan und Abhängigkeiten

**Strom: Der Nutzer hat entschieden, und C7 baut mit Strom.**
- PLAN §0 Nr. 9, K19, §4 Nr. 4 und §5 F2 sagen „ohne Strom“.
- Der Kopf von PLAN-160c.md und AUFGABEN.md:2716 sagen „mit Strom“ (Nutzerentscheidung): Brückenlicht bekommt Strom **zuletzt**, nach Betrieben und Zügen. Ohne Strom bleiben die Lampen dunkel.
- PLAN §3 C7 nennt den Strom nicht. Beim Bau ergänzen.

**C7 hängt an den Modellen aus C3–C6.**
- C3 Stein: Balustrade, Farbpalette.
- C4 Kristall K1: hinteres Glas in 'h', vorderes Glas in tileB t2, `brLiveTiles`.
- C5 Bahn: Böcke, Viadukt, Fachwerk, B2.
- C6: Fenster, Farbe `brc`.

Jetzt andocken lassen sich nur Holz und Metall zu Fuß (`bkPaintFuss`). Für Stein, Kristall und Bahn nenne ich die Stelle im künftigen Zweig. Empfehlung: Schon C3, C4 und C5 rufen am Ende von 'd' und 'o' einen leeren Haken `brPaintLamps(...)` auf, dann wird C7 klein.

**Aufwand:** Hoch. Ich empfehle zwei Commits:
- **C7a (Hoch):** Zeichnen, Nachtweg, Bildchen, Nachmalen, `GLOW_MUTE`.
- **C7b (Normal):** Kaufen/an/aus, Geld, Strom, Fenster.

## 1. Der Entwurf, zerlegt (tools/brueckenlicht-entwurf.js)

### Umrechnung Entwurf → Spiel
- **Längs:** Entwurf u = U0 + q entspricht Spiel t = q − ½ (A = −½ Wand, B = n − ½). Gerechnet wird ab :45 mit `U0 = A1+0,5`.
- **Höhe:** `dk(u)` (:48) entspricht `hf(t)` aus `brDeckHFn`, dieselbe Formel. `H` entspricht `HILL_H` (26).
- **Breite:** Entwurf W 0,3 (:12), Spiel `BK_W` 0,4. Die Lampen sitzen auf den Geländern bei s = ±BK_W.
- **Strichbreiten:** im Entwurf `lw(w) = w·z/2` (:50), im Spiel also w/2 (wie C2).
- **Absolute Maße** (z = cam.z, nicht halbiert):
  - Punktradius 0,85·z
  - Scheibe der Punkte ±0,8·z
  - Scheinradius r·z
  - Laterne in z_l = 0,6·z (`LANTERN_S`, :19)
- **Nachtfarbe der Lampe:** `'#ffe58a'` (:58, :64). Tags gelten die Farben unten. Nachts „aus“ oder ohne Strom: `'#9a978c'` (wie `drawLantern`, draw-schmuck.js:14).

### Lampen je Modell

| Modell | Entwurf | Ort (t, s) | Höhe | Form | Tagfarbe | Schein | Lage im Spiel |
|---|---|---|---|---|---|---|---|
| Fuß Holz | :139 | alle ½ Felder einschl. Wände: `onEdge(2)`; s = ±W | hf + 6,6 | Punkt r 0,85z | `#f3e3b0` | warm, Scheibe ±0,8z, r 5z | hinten: Ende 'd'; vorn: Ende 'o' |
| Fuß Metall | :155 | wie Holz | hf + 7 | Punkt | `#eef3f2` | warm, r 5z | dto. |
| Fuß und Bahn Stein | :121, Laterne :61–66 | nur innere Kanten k = 1 … n−1 (t = k − ½); s = ±W | hf + 6,5 (`PH`, :91; Rampe an inneren Kanten = 1). Bahn: HILL_H + 6,5 | Minilaterne, s. u. | Gehäuse `#b8ad97` („in der Brückenfarbe“), Glas tags `#fff7d6` | warm, Viereck [L, R, R−5z_l, L−5z_l], r 30·z_l = 18z | hinten: Ende 'd'; vorn: Ende 'o' |
| Fuß Kristall K1 (+ Zacken) | :67–71, hinten :164 (nach dem hinteren Glas, **vor** dem Deck), vorn :175 (nach dem vorderen Glas) | Viertel-Raster [A + j/4, A + (j+1)/4]; s = ±W | Strich hf + 0,5; Schein-Viereck hf … hf + 1,4 | Streifen (Strich 0,45z) | `#bfe9f8`, nachts an `#dff8ff` | **'blue'**, r 7z, je Viertel ein Viereck | hinten: 'h' nach dem hinteren Glas (wie Entwurf, das Deck deckt den unteren Schein absichtlich); vorn: tileB t2, zuletzt |
| Bahn Holz | :190 | `onEdge(2)`; s = ±W | HILL_H + 8,6 | Punkt | `#f3e3b0` | warm, r 5z | hinten: Ende 'd' nach `railPaint`; vorn: Ende 'o' |
| Bahn Metall | :199 | t_k = A + 0,15 + (n − 0,3)·k/(2n), k = 0 … 2n; s = ±(W + 0,02) | HILL_H + 11,6 (Obergurt + 0,6) | Punkt | `#e9eef0` | warm, **r 4z** | dto. |
| Bahn Kristall B2 | :198 | Viertel-Raster; s = ±(W + 0,02) | HILL_H (Strich + 0,5, Viereck bis + 1,4) | Streifen | wie K1 | 'blue', r 7z | hinten: **Ende 'd'** nach dem Gleis; vorn: Ende 'o' nach dem Fachwerk |

**Minilaterne** (`drawLantern`-Kopf × 0,6, aus Entwurf :61–66), Fußpunkt p = P(t, s, h):
1. Stummel von p nach p − 4z_l, Breite 1,8·z_l (= `stroke(..., 1,08)`), **`lineCap 'butt'`**. Der Entwurf hat 'round', das verletzt den scanFuss-Test.
2. `box(p.x, p.y − 4z_l, 2,6z_l, 1,4z_l, 5z_l, Glasfarbe, Gehäuse, 3z_l)`.
3. Danach `glowQuad([lb.L, lb.R, [lb.R[0], lb.R[1] − 5z_l], [lb.L[0], lb.L[1] − 5z_l]], 18·z)`. Das ist ein Parallelogramm, `glOutQuad` passt.

**Punkt:**
1. `circle(p, 0,85z, C(Farbe))`.
2. Dann `glowQuad` mit dem Quadrat ±0,8z um p, r·z.

**Kanten (G3):** `onEdge` (brueckenbild.js:186) teilt richtig zu. Die Kante bei t0 gehört diesem Feld, das letzte Feld nimmt auch t1. Punkte, die nicht im Raster liegen (Bahn Metall), halboffen [t0, t1), beim letzten Feld einschließlich t1.

**Abweichungen vom Entwurf, mit Absicht:**
- **Hintere Lampen kommen ans Ende von 'd', nicht nach L6** (PLAN 2.4 sagt L6). Gründe:
  1. Ihr Schein muss nach dem Deck kommen (Falle 11, Entwurf :139/:155/:121 zeichnet alle Lampen zuletzt).
  2. Figuren und Wagen auf dem Deck (zwischen d und o) müssen die hinteren Lampen verdecken. Ein hinterer Punkt in 'o' landete auf dem Kopf der Figur.
- **Hinterer Streifen von B2 kommt ans Ende von 'd', nicht nach L1** (PLAN 2.4). Grund: der Entwurf :198 malt ihn nach dem Deck.
- **Hinterer Streifen von K1 bleibt in 'h'**, wie der Entwurf. Dort deckt das Deck den unteren Schein, gewollt.
- **Reihenfolge beim Streifen:** erst der Strich, dann der Schein (Regel 112). Der Entwurf (:68–70) macht es umgekehrt, dann wäre der Strich live dunkel, im Bildchen aber hell (Kristall-Schein kommt dort nach dem Bild, render.js:891). So sieht Bildchen = live aus. Der Strich wird etwas heller als im Entwurf: im Prüfbild zeigen.
- **Vordere Lampen-Scheine** erhellen das vordere Geländer. Das vordere Geländer erhellt der Schein der hinteren Lampen nicht mehr (im Entwurf schon). Das ist klein; im Nachtbild zeigen.

## 2. Andockstellen (Datei:Zeile)

### 2.1 Eine Quelle für die Lampen (G8)
- **Neu in js/brueckenfamilie.js:** `BR_LAMPS` bzw. `brLampSpots(look, n)`, also die Tabelle oben:
  - Art (punkt/laterne/streifen)
  - Raster bzw. Formel
  - Höhe über hf bzw. HILL_H
  - s, Radius, Tagfarbe, Ton
  - Gruppen, die Licht tragen (`brLampGroups(look)`: Holz/Metall/Stein/Bahn → {vd, o}; K1 → {h} + t2)
- Daraus lesen:
  - der Maler,
  - `brBox` (höchste Lampe),
  - der Bildchen-Schlüssel (welche Gruppe `lit` braucht),
  - der Strom (Zahl der Felder),
  - die Tests.
- Namen ohne `lantern*` (luecken B5). Ich habe gegrept: `brLamp*`, `brLicht*`, `bkSetLicht` sind frei.

### 2.2 Zustand ins Malen
- **js/bruecken.js:403–411 `bkTileArgs`:** `opts` bekommt `look`, `licht` und `dark`.
  - `look`: `brSpanLook(x, y)` (brueckenfamilie.js:188, je `groundVersion` gemerkt, kennt Anhöhen) bzw. `brLook(c.b, 'anhoehe')`.
  - `licht`: `look.licht` (null / 'an' / 'aus'; nur bei gültigem `brp`, brueckenfamilie.js:79).
  - `dark`: `!!(T.rail && T.rail.power && T.rail.power.dark.has('B' + c.k))`.
- **Hell, dunkel, aus wird erst im Maler bestimmt**, also zur Malzeit (Löschbild, Abschnitt 3):
  - `lit = opts.licht === 'an' && !opts.dark && night > 0.15 && isLive()`
  - `grau = !lit && opts.licht && night > 0.15 && isLive()`
  - Nie vorher berechnen und in einem Abschluss festhalten.

### 2.3 Maler
- **js/brueckenbild.js:177 `bkPaintFuss`:**
  - Holz 'd' (:201–204): nach `wegPaint` die hinteren Punkte.
  - Holz 'o' (:205–207): nach dem Mittelholm die vorderen Punkte.
  - Metall 'd' (:219–222) und 'o' (:223–226) ebenso.
  - Die Zweige Stein und Kristall aus C3/C4 analog. K1: hinterer Streifen in 'h' nach dem hinteren Glas, vorderer in t2 nach Glas, Pfosten und Handlauf.
- **js/brueckenbild.js:21 `bkPaintLage` (Bahn; C5 schreibt das um):**
  - 'd' (:57–62): nach `opts.railPaint(H)` die hinteren Punkte bzw. der hintere B2-Streifen.
  - 'o' (:63–65): nach `rail`/`sideTruss` die vorderen.
  - **Bahn Metall:** Das Spiel-Fachwerk hat `m = max(2, round((b−a)·2)) = 2n−1` Felder (:37), der Entwurf hat `m = 2n` (Entwurf :80). Damit die Punkte auf den Pfosten sitzen, in C5 `m = 2n` nehmen oder die Punkte aus demselben `m` rechnen.
- **Nur Hex-Farben**, Glasfarbe über `C()` (`box` macht das selbst), `circle(…, C(col))`. Kein `globalAlpha`. Der Deckend-Test prüft das (brueckenbild.test.js:8ff., :91ff.).

### 2.4 Rahmen
**js/brueckenbild.js:15 `brBox(gruppe, c)`.** Heute gilt vd: u = TH/2 + hm + 8. Hintere Lampen liegen bei s = −W und t = t0 um (0,5 + 0,4)·16 = 14,4 höher. Nötig ist also (mit Strichhälfte):

| Lampe | nötiges u | passt in vd? |
|---|---|---|
| Holz | hm + 21,9 | ja |
| Metall | hm + 22,3 | ja |
| Bahn Holz | hm + 23,9 | knapp |
| Bahn Metall | hm + 27,2 | **nein** |
| Stein-Laterne | hm + 28,1 | **nein** |

- **vd** muss um die Lampenhöhe wachsen, aber nur, wenn Licht gekauft ist (aus `brLampSpots`).
- **o** reicht (vorn nur + 1,6).
- Das gilt automatisch für Bildchen, `glLive` (`bkBoxOf`) und den Nachmal-Clip (`bkRedo`).

### 2.5 Bildchen
**js/brueckenbild.js:103 `spriteBridge`**, nach dem Muster von `spriteArchBridge` (render.js:929–945):
- `keyOf = lit => 'br|x,y|gr|F' + (licht in dieser Gruppe ? '|' + lit : '')` und `lit = night > 0.15 && isLive() ? 1 : 0`.
- `if (lichtInGruppe && preLit()) prewarm(keyOf(1), zs, make, groundVersion)` (render.js:782/784).
- Schlüssel ohne `|lit` bei Gruppen ohne Lampen:
  - kein doppeltes Bildchen (B2-Befund 8),
  - der B2c-Test bruecken-reihenfolge.test.js:78–80 (Schlüssel `br|x,12|gr|0`, `glows.length === 0`) bleibt gültig.
- Den Kommentar :101–102 nachziehen.

### 2.6 Nachmalen ohne zweiten Schein (K10, „nur Scheiben stanzen“)

**js/draw-objects.js:14–16 `glowQuad`:** `GLOW_MUTE` bekommt einen dritten Wert, `'pane'`. Außerdem gilt die Sperre nie beim Malen eines Bildchens oder Löschbilds:

```js
if (!(night > 0.15 && isLive())) return;
const mute = GLOW_MUTE && !SPRITE_PAINT;              // paintSprite/paintNight malen immer mit Licht
if (mute && (GLOW_MUTE !== 'pane' || tint === 'blue')) return;
… q berechnen …
if (mute) return punchGlow(q, r, tint, 'pane');       // nur die Scheibe, kein Schein, nichts in glows/glowCells
```

Der Teil `!SPRITE_PAINT` behebt einen versteckten B2-Fehler:
- `bkRedo` ruft `spriteBridge` → `getSprite` auf. Das kann im Budget ein Bildchen bzw. `e.next` neu malen (render.js:554/573), samt `nightOf` (:558). Das geschieht unter der Sperre.
- Das Bildchen hätte dann den `lit`-Schlüssel, aber kein Licht, und bliebe bis zur nächsten Fassung so.
- Gleiches gilt für geteilte Deko-Bildchen (`spriteSmall`) bei Deko VOR: dann wären alle Laternen dieses Aussehens weit weg dunkel.
- Es tritt vor allem im GL-Abspielen auf (ruhendes Feld: nur tileB läuft).

**js/render.js:879 `putSprite`:** Unter `'pane'` erst das Bild, dann nur die Scheiben:

```js
if (!e.glows.length || GLOW_MUTE) {
  if (e.c) g.drawImage(…);
  if (GLOW_MUTE === 'pane' && e.glows.length && night > 0.15 && isLive()) {
    if (e.mask == null) for (const gl of e.glows) if (gl.tint !== 'blue') punchGlow(gl.q.map(([x, y]) => [x0 + x * r, y0 + y * r]), gl.r * r, gl.tint, 'pane');
    else if (e.mask) { /* Maske destination-out wie :889–893 */ }
  }
  return;
}
```

- Nie `putNight` im Nachmalen: Das Löschbild stanzt Schein und Scheiben, das wäre doppelt.
- Bei Nachtbildern ist `e.mask` null (`noMask`), also werden ganze Scheiben aus `e.glows` gestanzt. `cropApply` hat sie schon verschoben.
- Die Deckkraft `min(1, night/NIGHT_MAX)` entspricht dem Löschbild.

**js/brueckenbild.js:140 `bkRedo`:** `GLOW_MUTE = 'pane'` statt `true`. Der `finally`-Zweig setzt auf `false` zurück.
- Das gilt für Brücken-Lagen und für Deko VOR.
- Nebenbei behoben: Eine Laterne auf einem vorderen Platz verlor heute im Rahmen einer Figur ihre Scheibe und war dort dunkel.

### 2.7 GL (dieselbe Lichtschicht)
Am GL-Code ändert sich nichts:
- Licht aus tileA steht im Standbild (`glRecTile`, gl.js:608; `glStaticLights` :655).
- Licht aus tileB ist immer dynamisch (K1 t2).
- Die Scheibe im Nachmalen geht über `punchGlow`'pane' → `glOutQuad` nach der Zelle (gl.js:296–298).
- Nur warm oder `'blue'`, sonst zieht die ganze Lichtkette mit (karte-licht 1.2). `nightLights` (render.js:1499) bleibt.
- Neue Listen je Bild gibt es nicht, `glBgStep` bleibt.
- **K1-Felder** müssen im Abspielen jedes Bild in der Liste `glEvTiles` stehen (`brLiveTiles` aus C4, gl.js:684), sonst fehlt der vordere Streifen samt Licht.

### 2.8 Strom (F2: zuletzt)
**js/rules.js:2786 `computePower`**, nach der Zug-Schleife (:2803–2807), innerhalb von `city`:

```js
if (city && bkOn()) { const bl = brLichtUnits();     // 'B'+Anker je Feld einmal, sortiert, nur licht === 'an'
  for (let i = 0; i < bl.length; i += LAMPS_PER_POWER) if (!take(1, 'brlicht')) bl.slice(i, i + LAMPS_PER_POWER).forEach(l => dark.add(l)); }
```

- `brLichtUnits()` kommt in bruecken.js. Die Kennung `'B'+k` kollidiert nicht mit Deko (`k,i`), `E`, `A`, `G0/G1` oder `P`.
- Ein Brückenteil im dunklen Block macht die ganze Brücke dunkel.
- **js/ui.js:2098:** dazu `if (P.use.brlicht) parts.push('Brückenlicht ' + …)`.
- `recalc()` erhöht `groundVersion` (rules.js:829), Bildchen mit Platz erneuern sich also von selbst. `dark` gehört nicht in den Schlüssel.

### 2.9 Kaufen / an / aus, Geld
**Neu in bruecken.js neben `bkSetArt` (:237): `bkSetLicht(k, 'kaufen'|'an'|'aus')`.**
- **Kaufen:**
  1. Aufpreis `brAdd({money: 0}, BR_OPT.licht.feld, b.n)` (brueckenfamilie.js:101, 20 Taler + 1 Metall je Feld).
  2. Taler und Rohstoffe prüfen.
  3. Ist die Brücke im alten Format: `b.brp = { ...brPaid(b, 'anhoehe'), k: brSig(b, 'anhoehe') }`.
  4. Dann `brAdd(b.brp, Aufpreis)` und `b.brl = 'an'`.
- **an/aus:** kostenlos, `brp` bleibt (Regel 137).
- Immer danach: `groundVersion++`, `recalc()` (wegen Strom), `save()`.
- Fensterknöpfe nur über `undoable` (Rückgängig, Cloud, `viewOnly`).
- **Wichtig:** `brLook` liest `brl` nur bei gültigem `brp` (brIsNew). Ohne Stempel ist das Licht unsichtbar.

**`bkSetArt` (:244/:251):**
- Heute: `nu = bkCost(art, n)` und `b.brp = {...nu, k}`. **Damit ginge das bezahlte Licht verloren**: Die Erstattung beim Abriss wäre 20 + 1 Metall je Feld zu klein, gezeichnet würde trotzdem.
- Neu: `nu = brPrice({ mat: art, fam, licht: b.brl }, 'anhoehe', n)`. Zacken nur, wenn `art === 'kristall'`. Wird `brSet` in C6 gebaut, gehört es dort hinein.

**`openBkInfo` (:518):**
- Abschnitt „Licht“:
  - noch nicht gekauft: „💡 Licht −20 + 1 Metall je Feld“
  - gekauft: an/aus als zwei Knöpfe
  - Hinweis „⚡ ohne Strom dunkel – Brückenlicht bekommt Strom zuletzt“, wenn dunkel
- Der Text „Abreißen +…“ (:533) rechnet heute mit `bkCost` und muss auf `brPaid` umstellen, sonst steht zu wenig da. Erstattet wird schon richtig (:227).
- Speichern und Laden kennen `brl` schon: `brClean` (brueckenfamilie.js:156), state.js:152/369.

## 3. Fallen

| # | Falle | Ursache | Gegenmaßnahme | Prüfung |
|---|---|---|---|---|
| L1 | **Doppelter Schein** beim Nachmalen | `bkRedo` malt Lampen erneut | `GLOW_MUTE = 'pane'` (2.6): nie Schein, nie `glows.push`, nie `putNight` | Zahl `glows.length` nach `render` mit/ohne Figur gleich; `punchGlow` ohne `part` bzw. `'halo'` gleich oft |
| L2 | **Lampe im Rahmen der Figur dunkel** | heute stopft `true` die gestanzte Scheibe mit deckender Farbe zu | Scheiben neu stanzen (2D über den Clip begrenzt, GL `glOutQuad` nach der Zelle) | Nachtbild mit Figur; Pixel der Scheibe hell |
| L3 | **Bildchen ohne Licht** | Bildchen bzw. Nachtbild entsteht unter der Sperre (`getSprite` und `nightOf` aus tileB) | Sperre nie bei `SPRITE_PAINT` (2.6) | Test: unter `'pane'` gemaltes `makeSprite` hat `glows > 0`, `paintNight` hat Lichter |
| L4 | **Schein vom Deck verdeckt** | hintere Lampe in 'h' → Deck (vd) stopft den Schein | hintere Lampen am Ende von 'd'; Ausnahme K1 hinten (Entwurf) | Reihenfolge-Test: hinteres `glowQuad` nach dem Deck-`poly` desselben Felds; Nachtbild |
| L5 | **Hintere Lampe über der Figur** | Lampe in 'o' | hinten in 'd', vor dem Bewegten | Reihenfolge-Test mit Figur auf dem Deck |
| L6 | **Schein fehlt im Nachmal-Rahmen** (Restfehler von K10) | im Rahmen frisch gemalte Geländer- und Deck-Pixel verlieren den Schein der eigenen Lampen. Beim Zug unter der Brücke ist der Rahmen groß: das Feld wird dunkler, solange der Zug darunter ist. Blau hat nur Schein, verliert ihn also ganz (hinterer K1-Streifen bei Figur dahinter) | erst messen (glitch.js nachts, Zug darunter, Figur oben). Ist es sichtbar: Nachmalen über eine Zwischenleinwand (frisch Gemaltes → darunter per Deckmaske löschen → Schein in die Leinwand stanzen → einsetzen). Das geht nur in 2D, in GL nicht einfach (Löcher skalieren mit `nightK`) | Prüfbild; **dem Nutzer zeigen** |
| L7 | **Dämmerung** | Farbe und Schein müssen dieselbe Schwelle haben | überall `night > 0.15 && isLive()`, nie `nightFull`; `prewarm` nur für Gruppen mit Licht (Regel 143); Löschbild mit `night/NIGHT_MAX` macht `putNight` | Test wie tempo-schritt3.test.js:213: bei night 0,1 gibt es `…|vd|0|1` samt Nachtbild schon, bei 0,3 malt nichts neu |
| L8 | **Löschbild falsch** | `paintNight` (render.js:803) ruft `drawFn` erneut mit `night = NIGHT_MAX` auf | `lit`, `dark` und `licht` erst im Maler lesen (2.2); FOG kommt aus dem gefangenen `fog` (wie heute) | Nachtbild = live, Kantenpixel ausgenommen |
| L9 | **Rahmen schneidet Laterne bzw. Punkt ab** | `brBox` vd zu niedrig (2.4) | Lampenhöhe aus `brLampSpots` | Rahmen-Test (brueckenbild.test.js:43) mit Licht, alle Modelle, n, Achsen, z |
| L10 | **Blau wird gelb** | `nightSeen`-Schlüssel (render.js:866) = Ort + Breite des Löschbilds. Gruppen eines Felds liegen am selben (px, py); bei gleicher Breite fällt das blaue Lichtbild der zweiten weg | Schlüssel um eine Kennung des Nachtbilds erweitern (`n.id`); nie per Objekt allein (geteilte Deko-Bildchen) | Test: zwei Bildchen am selben Punkt, gleiche Breite, beide in `nightPics` |
| L11 | **Scheibe in GL in der Dämmerung doppelt** | `glOutQuad` ist nicht auf den Rahmen beschnitten; eine Scheibe, die halb außerhalb liegt, wird dort zweimal gestanzt | hinnehmen (klein, nur Dämmerung, nur GL) oder nur Scheiben ganz im Rahmen | GL = 2D in der Dämmerung |
| L12 | **Lichter weit weg ungleich hell / springen beim Schieben** | `glowCells` (draw-objects.js:46, 24 px): dichte Punkte alle ½ Feld | hinnehmen wie bisher (Block 70); prüfen bei Zoom 1 | Nachtbild beim Schieben |
| L13 | **Licht ohne Kauf bzw. Kauf ohne Licht** | `brl` ohne `brp` wird nicht gelesen | Setzer stempelt immer | Test |
| L14 | **Materialwechsel verliert bezahltes Licht** | `bkSetArt` :251 | 2.9 | Bilanz Bau → Licht → Material → Abriss = 0 |
| L15 | **Strom** | Brückenlicht vor Zügen würde bestehende Welten ändern | nach der Zug-Schleife; nur Licht 'an' zählt | strom-Test |
| L16 | **Blasse Brücke stanzt volles Licht** | `bkFadeNow` ist immer live (karte-licht Regel 11) | Empfehlung: blass ohne Schein (Frage F-f) | Bild 👁 nachts |
| L17 | **Ungültige Farbe** | rgba mit `C()`, `shade` auf rgba | nur Hex; Ton nur warm oder 'blue' | Deckend-Scan, Lint „Ton ∈ {undefined, 'blue'}“ |
| L18 | **Laterne ragt ins Nachbarprisma** (Falle 2) | `box` liegt ±1,6 px um die Kante | zeichnet das spätere Feld (G3); vorher gezeichnetes Bewegtes im früheren Feld kann darunter liegen (wie die Pfosten heute, offen in B2d) | Nahaufnahme Kante mit Figur |
| L19 | **Schein an der fernen Anhöhe fehlt** | die Anhöhe wird später gezeichnet; wie im Entwurf (Clip :206–208) | nichts | Bild |
| L20 | **Test-Attrappe stürzt ab** | lit nur mit `isLive()`; Tests setzen dafür `SPRITE_PAINT = true` und `GLOW_SINK = []`, dann ruft `glowQuad` `g.getTransform()` | die Proxy-Attrappe in brueckenbild.test.js braucht `getTransform: () => ({a:1, b:0, c:0, d:1, e:0, f:0})` | – |

## 4. Tests (zuerst schreiben)

**tests/brueckenbild.test.js**
- Lampen je Modell (Spion auf `glowQuad`/`circle`/`box`, `SPRITE_PAINT` und `night = NIGHT_MAX`):
  - Anzahl und Ort je Feld; Kanten genau einmal (Wand bei Feld 0 bzw. n−1)
  - hinten nur in 'd' nach dem Deck, vorn nur in 'o'
  - K1 hinten in 'h'
  - Ton warm bzw. blau, Radien 5, 4, 18, 7·z
- „nicht gekauft“: keine Lampe.
- „aus“ und „ohne Strom“: nachts `#9a978c` bzw. Tagfarbe beim Kristall, kein Schein.
- tags: Tagfarben, kein Schein.
- Prisma und deckend: `scan`/`scanFuss` mit Licht; Stummel `'butt'`.
- Rahmen-Test mit Licht.
- Sperre `'pane'`: nur `punchGlow(...,'pane')`, nichts in `glows`/`glowCells`; blau nichts; bei `SPRITE_PAINT` normal. Der Test :77 (`true`) bleibt.

**tests/nachtlicht-bildchen.test.js**
- `putSprite` unter `'pane'`:
  - ohne Maske: `['bild','scheibe']`
  - mit Maske: `['bild','maske']`
  - Maske false: `['bild']`
  - blau: `['bild']`
- unter `true`: `['bild']`.

**tests/bruecken-reihenfolge.test.js**
- Szene mit `brl` 'an' + `brp` (beide Achsen), nachts: Scheine mit/ohne Figur gleich (L1); `'pane'`-Aufrufe > 0, wenn eine Figur an einer Lampe steht (L2).
- Weit weg nachts: `br|x,y|vd|0|1` und `|o|0|1` mit `glows > 0`, `h` ohne `|lit` (Holz).
- Dämmerung mit Vorwärmen (L7).
- Unter der Sperre gemaltes Bildchen hat Licht (L3).
- `nightSeen` (L10).

**tests/strom.test.js** (Muster :121)
- Strom reicht für den Zug, nicht fürs Licht: Zug fährt, `dark.has('B'+k)`; Laternen-`dark` unverändert.
- 'aus' zählt nicht.
- Ohne `city` nie dunkel.
- Umschalten ruft `recalc`.

**tests/bruecke.test.js**
- Kaufen kostet 20 + 1 Metall je Feld; `brp += Aufpreis`; an/aus kostenlos.
- ↶; Abriss erstattet samt Licht (Bilanz 0); Materialwechsel behält Licht (L14).
- `groundVersion++` je Setzer; Besuch gesperrt; Speichern-Rundlauf `brl`.
- Text „Abreißen +“ = `brPaid`.

**Sonstiges**
- tests/anhoehe-stufe2.test.js:26: neue globale Namen nur in einer Datei.
- **Leistung:** In der Brückenwelt (tools/brueckenwelt.js) Brücken mit Licht an, je Material. Dann `npm run leistung:neu` mit Begründung „Brückenlicht C7“.

## 5. Prüfbilder (Hauptagent, nacheinander, vorher `npm run bump`)

1. Jedes Modell × beide Achsen × Tag/Nacht bei z 1,8, neben `tools/vorschau/brueckenlicht.png` aus dem Entwurf. **Der Nutzer nimmt ab** (W 0,4 statt 0,3, Strich-Reihenfolge, hintere Lampen erhellen das vordere Geländer nicht).
2. Dämmerung bei night 0,1 / 0,2 / 0,45, nah und weit (0,45). Bildchen = live.
3. GL = 2D nachts weit weg, auch nach einem Kamerazug (`glBgStep`).
4. glitch.js nachts:
   - Figur oben, dahinter, darunter
   - Zug darunter (Holz-Fußgänger) und oben (Bahn)
   - Abweichung außerhalb des Rahmens 0
   - im Rahmen: Scheiben hell, L6 messen
5. Licht aus, ohne Strom, nicht gekauft; Kristall K1 und B2 blau.
6. n = 1/2/4 (8 nach C8); Stein mit 1 Feld.
7. 👁 und „darunter bauen“ nachts.
8. Anschlüsse: ferne und nahe Anhöhe nachts.
9. `tools/ruckeln.js` Full HD nachts samt Dämmerungsübergang (Brückenwelt mit Licht, bauland).

## 6. Fragen an den Nutzer (mit Empfehlung)

- **F-a Strom je Feld?** Empfehlung: Jedes Feld zählt wie eine Laterne (10 Felder = 1 ⚡), passend zum Preis je Feld. Alternative: eine Laterne je Brücke wie eine Linie.
- **F-b Stein mit 1 Feld** hat keine innere Kante, also keine Laterne, obwohl Licht bezahlt ist. Empfehlung: ein Laternenpaar in der Feldmitte. Alternative: Licht dort nicht anbieten.
- **F-c Kristall:** Ist der Streifen die Lampe? Empfehlung: ohne Licht kein Streifen (im Tagesentwurf K1 gibt es keinen). „Aus“ nachts in Tagfarbe statt grau.
- **F-d „Aus“ bei Tag:** Empfehlung wie „an“ (Tagfarbe), nur nachts grau, wie Laternen.
- **F-e Lampenfarbe:** Punkte bei Holz und Metall fest wie im Entwurf. Nur das Laternengehäuse folgt der Brückenfarbe: `brc` → `shade(BRIDGE_COLS[i], −0,15)`, sonst `#b8ad97`.
- **F-f Blasse Brücke nachts ohne Schein?** Empfehlung: ja.
- **F-g Restfehler L6:** hinnehmen, wenn klein, oder Mehraufwand mit Zwischenleinwand (nur 2D)? Erst nach dem Messbild fragen.

## Dateien
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-schmuck.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/nachtlicht-bildchen.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/strom.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/tempo-schritt3.test.js
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/B2.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-licht-farbe-bilder.md