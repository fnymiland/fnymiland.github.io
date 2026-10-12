# C7: Licht zwischen Anhöhen. Baukarte (ersetzt die Karte vom Stand C2g)

Stand `8d10f4d` (C6 abgenommen). Ich habe nur gelesen: keine Datei geändert, keine Tests, kein npm, kein Browser. Jede Aussage der alten Karte und der vier Berichte habe ich im heutigen Code nachgeprüft.

**Aufwand:** C7a Hoch, C7b Normal, C7c (Leistung) Normal. Jeder Schritt wird ein eigener lokaler Commit. Pushen erst nach Rückfrage.

**Gilt schon:**
- F2: Das Brückenlicht bekommt Strom zuletzt (nach Laternen, Betrieben und Zügen). Ohne Strom bleibt es dunkel.
- PLAN §4 Nr. 8: Das Gehäuse hat die Brückenfarbe, das Licht ist warm, Kristall leuchtet immer blau.
- PLAN §2.6: „Nicht gekauft“ heißt: keine Lampen. „Aus“ heißt: grau, kein Schein.
- PLAN §1.7: Licht kostet 20 Taler + 1 Metall je Feld (`BR_OPT.licht.feld`, brueckenfamilie.js:120). An/aus ist kostenlos (Regel 137).

---

## 0. Was schon da ist, was fehlt

### Schon gebaut, die alte Karte ist hier überholt

| Alte Aussage | Heute |
|---|---|
| 2.6: `GLOW_MUTE 'pane'`, `!SPRITE_PAINT`, Scheiben in `putSprite` | Gebaut in 338dcb1 (B2): draw-objects.js:16–25 (`mute`, :18; auch `GLOW_SINK`, :19), punchGlow `'pane'` :56–67, render.js:879–885, bkRedo brueckenbild.js:163. Test: bruecken-reihenfolge.test.js:109–122. **L3 ist damit behoben.** |
| L13/2.9: `brl` wirkt nur mit gültigem `brp` | Überholt. `brLook(…, 'anhoehe')` → `brAnhLook` (brueckenfamilie.js:82/96) liest `brl` ohne `brp` (:100). `brp` zählt nur noch fürs Geld. |
| L14: `bkSetArt` verliert das Licht | Erledigt. `bkSetArt` ist nur noch eine Hülle (bruecken.js:278). `brSet` behält beim Materialwechsel `nb.brl` (:292) und rechnet den Preis mit `brLook(nb)` samt Licht (:319, `brPrice` :129). |
| 2.9: Altformat selbst stempeln | `brSet` stempelt immer (:331/:332). Ein eigenes `bkSetLicht` ist nicht nötig. Es reicht ein Zweig `licht` in `brSet`. |
| „Abreißen +“ rechnet mit `bkCost` | Erledigt. Der Text nimmt `paid.money` (bruecken.js:657/678), ebenso `bkDemolishInfo` :252 und plan.js:252. |
| Bahn Metall `m = 2n−1` | Schon `m = 2 * n` (brueckenbild.js:51). |
| Maler `bkPaintLage` :21 (Bahn), `onEdge` :186 | `bkPaintLage` :17–21 ist nur noch die Weiche. Die Maler sind `bkPaintBahn` :32, `bkPaintFuss` :231 und `bkPaintStein` :315. `onEdge` steht in `bkKit` :227 und in `bkPaintBahn` :46. |
| K1-Streifen in 'h' „nach dem hinteren Glas“ | Das hintere Glas ist eine eigene Lage 'hg' (:267). In 'h' stehen nur noch Pfosten und Handlauf (:268). |
| t2 ist „immer live“ | Falsch. t2 läuft zwar jedes Bild in tileB, weit weg aber als Bildchen (`glass` :173 → `bkGroup` → `spriteBridge`). t2 braucht also `|lit`. |
| Speichern/Laden von `brl` | Gibt es schon: `brClean` brueckenfamilie.js:168/175, state.js:152–153/366–372. Getestet in bruecken-altversion.test.js:39–48. |
| `computePower` „innerhalb `city`“ | Die Zug-Schleife (rules.js:2805–2809) liegt **außerhalb** von `if (city)` (:2792–2804). Das Brückenlicht braucht einen eigenen Block `if (city && bkOn())` vor `return` :2810. |
| `bkTileArgs` :403, `brSpanLook` | Jetzt bruecken.js:523–532. Das Aussehen liegt schon in `G.look` (bkGeom :50, gemerkt je `groundVersion` in `bkFresh` :97–106). |

### Fehlt noch

- **Lampen in allen Malern.** grep nach `glowQuad`, `licht` und `streif` in brueckenbild.js findet nichts.
- **`opts.licht` und `opts.dark`** in `bkTileArgs` (:530–531).
- **`brBox`** (:11–14) kennt die Lampen nicht. Für Stein (+28,1) und Bahn Metall (+27,2) ist vd heute zu klein (u = hm + 24).
- **`spriteBridge`** (:124–138): Der Schlüssel `br|x,y|gr|FOG` hat kein `|lit`, und es gibt kein `prewarm`. Der Kommentar :122–123 ist veraltet.
- **Blass stanzt volles Licht.** `bkGroup` :117 setzt nur `globalAlpha`, `punchGlow` beachtet das nicht (:84/:86).
- **`brSet`:** kein Zweig `licht`, kein `recalc()` (:334).
- **Strom:** Er fehlt in `computePower`. ui.js:2103 zählt `P.dark.size` als „Laternen“.
- **`openBkInfo`:** kein Abschnitt Licht.

### Fehler in B2, gehören zu C7a (Licht hängt daran)

- **render.js:882–883:** Ist `e.mask === false` (alles verdeckt), stanzt der `'pane'`-Zweig trotzdem ganze Scheiben. Der normale Weg nimmt dafür `'mark'` (:894).
- **brueckenbild.js:165:** `finally { GLOW_MUTE = false }` stellt den vorigen Wert nicht wieder her.
- **Falle L10 besteht noch:** Der Schlüssel von `nightSeen` (render.js:867) besteht aus Ort + Breite des Löschbilds. Gruppen eines Felds liegen am selben (px, py).

### Nebenbefunde, nicht in C7 (eigener Commit)

- **render.js:617/619:** `full = nightPicOn()` wird nach `g = cx` gerechnet. `isLive()` ist dort immer falsch, also auch `full`, und das seit 6f4405e (Block 143).
  - Jedes beleuchtete Bildchen bekommt dadurch `maskTodo`, Kopien über `glowSnap` und einen synchronen Zuschnitt (:639).
  - `noMask` liest niemand.
  - Das vor der Leistungsmessung von C7 reparieren, eigener Commit „Block 143 Nachtrag“.
- **state.js:370:** `BR_MAT[b.art]` lässt `'constructor'` durch. Harmlos, weil `brLegacyLook` mit `hasOwnProperty` prüft.
- **tools/glitch.js gibt es nicht** (nur Bilder `tools/vorschau/glitch-*.png`). Für L6 braucht es ein Differenzbild (§6).

---

## 1. Lampen je Modell (Quelle: `brLampSpots` in brueckenfamilie.js)

Entwurf: tools/brueckenlicht-entwurf.js. Umrechnung: `t = u − U0 − ½`, A = −½, B = n − ½.
- `hf` = `brDeckHFn` (wie `dk` :48). H = `HILL_H` = 26. W = `BK_W` = 0,4 (Entwurf 0,3).
- Der Entwurf malt mit dpr = 1 (:219). Striche sind im Spiel w/2. Maße × z: Punkt r 0,85z, Scheibe ±0,8z, Laterne mit z_l = 0,6z.

| Modell | Ort t | s | Fußhöhe | Form | Tag | Nacht an | Nacht aus / ohne Strom | Schein | Lage hinten / vorn (Gruppe) | zuletzt gemalt vor den Lampen |
|---|---|---|---|---|---|---|---|---|---|---|
| Fuß Holz | A + k/2, k = 0…2n (jeder 2. Pfosten, :240/:253) | ±W | hf+6,6 (Handlauf +6, :254) | Punkt | `#f3e3b0` | `#ffe58a` | `#9a978c` | warm, Quadrat ±0,8z, r 5z | d / o (vd / o) | d: `wegPaint` :251 · o: :254 |
| Fuß Metall | wie Holz (Pfosten :289/:301) | ±W | hf+7 | Punkt | `#eef3f2` | `#ffe58a` | `#9a978c` | warm, 5z | d / o | :299 · :302 |
| Fuß Stein | innere Kanten A + k, k = 1…n−1; **n = 1: t = 0 (F-b)** | ±W | hf+6,5 (`parH` :321) | Laterne | Glas `#fff7d6`, Gehäuse `L.lamp` | Glas `#ffe58a` | Glas `#9a978c` | warm, Viereck [lb.L, lb.R, R−5z_l, L−5z_l], r 18z | d / o | d: :374 · o: `balustrade` :375 |
| Bahn Stein (Viadukt) | wie Fuß Stein | ±W | H+6,5 | Laterne | wie Stein | | | wie Stein | d / o | d: `railPaint` :368 (vor dem `return`) · o: :375 |
| Fuß Kristall K1 (± Zacken) | Viertel [A+j/4, A+(j+1)/4] | ±W | Strich hf+0,5 (Breite 0,45z); Schein-Viereck hf … hf+1,4 | Streifen | `#bfe9f8` | `#dff8ff` | **F-c** (Empf. `#bfe9f8`) | `'blue'`, je Viertel, r 7z | **h / t2** | h: :268 · t2: `glassRail` :285 |
| Bahn Holz | A + k/2 (Pfosten :60/:70) | ±W | H+8,6 (Handlauf H+8) | Punkt | `#f3e3b0` | `#ffe58a` | `#9a978c` | warm, 5z | d / o | d: `railPaint` :81 · o: :71 |
| Bahn Metall | a + (b−a)·k/(2n), k = 0…2n, a = A+0,15, b = B−0,15 (wie `truss` :51/:55) | ±(W+0,02) | H+11,6 (Obergurt T 11) | Punkt | `#e9eef0` | `#ffe58a` | `#9a978c` | warm, **4z** | d / o | d: :81 · o: :77 |
| Bahn Kristall B2 | Viertel | ±(W+0,02) | H+0,5 / H … H+1,4 | Streifen | wie K1 | | | `'blue'`, 7z | **t1 / t2 (neu, in tileB)** | eigene Lagen, `bkPaintBahn` malt dort sonst nichts |

**Minilaterne:** Kopf von `drawLantern` × 0,6 (Entwurf :57–63).
1. Stummel von p nach p − 4z_l, Breite `max(0.6, 1.8·z_l)`, **`lineCap 'butt'`**. Der Entwurf hat 'round', das verletzt den Test :95.
2. `box(p.x, p.y−4z_l, 2.6z_l, 1.4z_l, 5z_l, Glas, Gehäuse, 3z_l)` (draw-base.js:95, gibt L und R zurück).
3. Oberkante = Fuß + 12·z_l = 7,2z.

**Gehäusefarbe (§4 Nr. 8):**
- `BK_STEIN.lamp = '#b8ad97'` (brueckenbild.js:313). Ohne Farbe bleibt das Bild damit pixelgleich (`brPal` :385).
- Mit `brc`: in `brPal` beim Stein (:394) `lamp: shade(bc, -0.15)`, im Prüfbild zeigen.
- Punkte und Streifen haben feste Farben. Kristall ist immer blau, `brc` färbt den Streifen nicht.

**Warum B2 in t1/t2:** Blau hat keine Scheibe (`punchGlow` :58, render.js:883). Im Nachmalen wäre der B2-Streifen ganz weg, also auch der Strich nachtdunkel:
- Zug oben → 'o' wird im ganzen Kasten nachgemalt.
- Zug darunter → vd und o werden nachgemalt.

In t1 (nach dem vd-Nachmalen, vor dem Deck) und t2 (nach 'o') wird er nie nachgemalt. Die Folge stimmt:
- Ruhend: h, vd, o, dann t1, t2.
- Der hintere Streifen liegt auf dem Schirm 16–27 Einheiten über dem vorderen Fachwerk, es gibt keine Überdeckung.
- Abweichung von PLAN §2.4 („B2 – alles deckend“).

---

## 2. C7a Zeichnen (Bau-Reihenfolge)

### a1. Fehler im B2-Nachmalen (erst die Tests aus §5 rot, dann reparieren)

render.js:882–883:
```js
if (e.mask) { … wie bisher … }
else if (e.mask == null) for (const gl of e.glows) if (gl.tint !== 'blue') punchGlow(…, 'pane');   // false: alles verdeckt → nichts (wie :894 'mark')
```

brueckenbild.js:160–165:
```js
const gm = GLOW_MUTE; … GLOW_MUTE = 'pane'; try { … } finally { GLOW_MUTE = gm; FOG = fog; g.restore(); }
```

render.js:867 (L10), lazy, damit auch Test-Objekte gehen:
```js
let nightSeq = 0;                                   // neben nightSeen :791
const k = Math.round(cx * 4) + ',' + Math.round(cy * 4) + ',' + (n.id || (n.id = ++nightSeq));
```
Streifen großer Gebäude (dasselbe `e.night` am selben Punkt) zählen weiter einmal. `glBgStep` kopiert Texte (gl.js:729/780), das passt.

### a2. Eine Quelle (brueckenfamilie.js, bei `BR_STEIN` :267)

```js
const BR_STEIN = { …, par: 6.5 };                       // Balustrade (Maler :321 parH = BR_STEIN.par * ramp(t))
const BR_TRUSS = { T: 11, inset: 0.15 };                // Fachwerk Bahn Metall/B2 (Maler :51 liest das auch)
// Lampen je Modell (160c C7): ts = Orte t (null = Streifen je Viertel), s = Querlage, up = Fuß über dem Deck, r = Schein×z,
// back/front = Lage. art/fam wie bkGeom (G.art, G.fam). Licht prüft der Aufrufer
function brLampSpots(art, fam, n) {
  const N = Math.min(Math.max(1, Math.round(+n) || 1), BK_READ_MAX), A = -0.5, B = N - 0.5, W = BK_W, grid = K => Array.from({ length: N * K + 1 }, (_, k) => A + k / K);
  if (art === 'stein') return { form: 'laterne', ts: N > 1 ? grid(1).slice(1, -1) : [0], s: W, up: BR_STEIN.par, r: 18, back: 'd', front: 'o' };   // n = 1: Mitte (F-b)
  if (art === 'kristall') return { form: 'streifen', ts: null, s: fam === 'fuss' ? W : W + 0.02, up: 0, r: 7, tint: 'blue', back: fam === 'fuss' ? 'h' : 't1', front: 't2' };
  if (fam === 'bahn' && art === 'stahl') { const a = A + BR_TRUSS.inset, b = B - BR_TRUSS.inset;
    return { form: 'punkt', ts: Array.from({ length: 2 * N + 1 }, (_, k) => a + (b - a) * k / (2 * N)), s: W + 0.02, up: BR_TRUSS.T + 0.6, day: '#e9eef0', r: 4, back: 'd', front: 'o' }; }
  return { form: 'punkt', ts: grid(2), s: W, up: fam === 'bahn' ? 8.6 : art === 'stahl' ? 7 : 6.6, day: art === 'stahl' ? '#eef3f2' : '#f3e3b0', r: 5, back: 'd', front: 'o' };
}
```

Dazu:
- `BK_STEIN.lamp`, `brPal`-Stein `lamp` (oben).
- `truss` (:51) liest `BR_TRUSS`, `parH` (:321) liest `BR_STEIN.par`. Beides bleibt zahlengleich.

### a3. Zustand ins Malen (bruecken.js:530–531, `opts`)

```js
licht: G.look.licht,                                                    // null | 'an' | 'aus'
dark: !!G.look.licht && !!(T.rail && T.rail.power) && T.rail.power.dark.has('B' + c.k),
```
- `bkTileArgs` läuft bei jedem `bkDrawLagen` neu. Damit liest auch `paintNight` (night = `NIGHT_MAX`) den Stand frisch.
- Kein Zugriff auf `g` (Wächter).

### a4. Maler: eine Einfügestelle (brueckenbild.js:17–21) und ein Helfer neben `bkKit` (:230)

```js
function bkPaintLage(lage, P, z, art, n, t0, t1, weg, opts = {}) {
  if (art === 'stein' && (opts.fam === 'fuss' || opts.fam === 'bahn')) bkPaintStein(lage, P, z, n, t0, t1, weg, opts);
  else if (opts.fam === 'fuss' && BK_FUSS[art]) bkPaintFuss(lage, P, z, art, n, t0, t1, weg, opts);
  else bkPaintBahn(lage, P, z, BK_BAHN[art] ? art : 'holz', n, t0, t1, weg, opts);
  if (opts.licht) bkLamps(lage, P, z, art, n, t0, t1, opts);              // 160c C7: Lampen zuletzt in ihrer Lage (ohne Licht kein g-Aufruf: Wächter)
}
// Lampen eines Felds. Zustand erst zur Malzeit (Löschbild, Vorwärmen): an / grau (aus oder ohne Strom) / Tagfarbe
function bkLamps(lage, P, z, art, n, t0, t1, opts) {
  const stein = art === 'stein' && (opts.fam === 'fuss' || opts.fam === 'bahn'), fuss = !stein && opts.fam === 'fuss' && !!BK_FUSS[art];
  const A2 = stein ? 'stein' : fuss ? art : BK_BAHN[art] ? art : 'holz', F2 = stein ? opts.fam : fuss ? 'fuss' : 'bahn', S = brLampSpots(A2, F2, n);
  if (lage !== S.back && lage !== S.front) return;
  const s = (lage === S.back ? -1 : 1) * S.s, hOf = F2 === 'bahn' && !stein ? () => (opts.h != null ? opts.h : HILL_H) : opts.hf || (() => HILL_H);
  const nt = night > 0.15 && isLive(), on = opts.licht === 'an' && !opts.dark, lit = nt && on, grau = nt && !on;
  const last = t1 >= n - 0.5 - 1e-9, inCell = t => t >= t0 - 1e-9 && (t < t1 - 1e-9 || (last && t <= t1 + 1e-9));   // halboffen (G3), Bahn Metall gerades n: Mittelknoten = späteres Feld
  if (S.form === 'streifen') {
    const K = z < 0.6 ? 4 : 12, T = [t0]; for (let j = Math.ceil((t0 + 0.5) * K + 1e-9); -0.5 + j / K < t1 - 1e-9; j++) T.push(-0.5 + j / K); T.push(t1);
    g.beginPath(); T.forEach((t, i) => { const p = P(t, s, hOf(t) + 0.5); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); });
    g.strokeStyle = C(lit ? '#dff8ff' : '#bfe9f8'); g.lineWidth = Math.max(0.6, 0.45 * z); g.lineCap = 'butt'; g.lineJoin = 'round'; g.stroke();   // F-c: aus = Tagfarbe
    if (on) for (let j = Math.round((t0 + 0.5) * 4); -0.5 + j / 4 < t1 - 1e-9; j++) { const u0 = -0.5 + j / 4, u1 = u0 + 0.25;   // erst Strich, dann Schein (Regel 112)
      glowQuad([P(u0, s, hOf(u0)), P(u1, s, hOf(u1)), P(u1, s, hOf(u1) + 1.4), P(u0, s, hOf(u0) + 1.4)], S.r * z, 'blue'); }
    return;
  }
  const frame = stein ? brPal(BK_STEIN, 'stein', opts.fam, opts.col, null).lamp : null;
  for (const t of S.ts) { if (!inCell(t)) continue; const p = P(t, s, hOf(t) + S.up);
    if (S.form === 'punkt') { circle(p[0], p[1], 0.85 * z, C(lit ? '#ffe58a' : grau ? '#9a978c' : S.day)); const d = 0.8 * z;
      if (on) glowQuad([[p[0] - d, p[1] - d], [p[0] + d, p[1] - d], [p[0] + d, p[1] + d], [p[0] - d, p[1] + d]], S.r * z); continue; }
    const zl = 0.6 * z;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 4 * zl); g.strokeStyle = C(frame); g.lineWidth = Math.max(0.6, 1.8 * zl); g.lineCap = 'butt'; g.stroke();
    const lb = box(p[0], p[1] - 4 * zl, 2.6 * zl, 1.4 * zl, 5 * zl, lit ? '#ffe58a' : grau ? '#9a978c' : '#fff7d6', frame, 3 * zl);
    if (on) glowQuad([lb.L, lb.R, [lb.R[0], lb.R[1] - 5 * zl], [lb.L[0], lb.L[1] - 5 * zl]], S.r * z);
  }
}
```

- `glowQuad` prüft Nacht, `isLive`, `GLOW_MUTE` und `GLOW_SINK` selbst.
- `circle` ruft kein `C()`, `box` schon. Deshalb `C()` beim Punkt.
- Die Reihenfolge stimmt so, wie die Tabelle in §1 sie zeigt (Lampen immer am Ende ihrer Lage). Das gilt auch beim Viadukt, denn das `return` in :368 liegt im Maler.

### a5. B2 mit Licht in tileB (wie K1)

```js
// bruecken.js nach :55
const bkTileBAt = c => bkGlasAt(c) || (!!c && !!c.G && c.G.art === 'kristall' && c.G.fam === 'bahn' && !!c.G.look.licht);   // B2-Streifen: Blau hat keine Scheibe
```
Ersetzen:
- bruecken.js:106 (`glas: …filter(… bkTileBAt(c))`)
- brueckenbild.js:173 (`glas = bkTileBAt(c)`)
- render.js:2203 (`|| bkTileBAt(bc)`)

`bkDrawStill` :104 (hg) bleibt K1. In `bkPaint` (:86–89, nur in Tests benutzt) für Kristall-Bahn `'t1'` nach 'd' und `'t2'` nach 'o' ergänzen.

### a6. `brBox` (brueckenbild.js:11–14)

Nur vd wächst, und nur mit Licht. Gerechnet ist der Fall „Lampe an t0, s = −|s|“: Lampenoberkante + (0,5 + |s|)·16, 1 Einheit Reserve.

```js
function brBox(gruppe, c = null) {
  const hm = c ? bkHMax(c) : HILL_H; let top = gruppe === 'vd' || gruppe === 't1' ? 8 : 16;
  if (gruppe === 'vd' && c && c.G && c.G.look.licht) { const S = brLampSpots(c.G.art, c.G.fam, c.b.n);
    if (S.back === 'd') top = Math.max(top, S.up + { punkt: 0.85, laterne: 7.2, streifen: 1.4 }[S.form] + 16 * S.s - 8 + 1); }
  return [TW / 2 + 6, TH / 2 + hm + top, TW / 2 + 6, TH / 2 + 6];
}
```
- Ergebnis: Stein 13,1, Bahn Metall 12,2, Bahn Holz 8,9. Alle anderen bleiben 8.
- Seitlich passt alles: höchstens 29,4 + 1,84 < 38.
- Vorn reicht `o`: höchstens +15,3 < 32.
- Bildchen, `glLive` und der Nachmal-Clip bekommen das über `bkBoxOf` (:96–99).

### a7. `spriteBridge` (:122–138), nach dem Muster von `spriteArchBridge` (render.js:936–952)

```js
const BK_LAGE_GR = { h: 'h', d: 'vd', o: 'o', t1: 't1', t2: 't2' };
const bkLampGroups = c => !c || !c.G || !c.G.look.licht ? [] : (S => [BK_LAGE_GR[S.back], BK_LAGE_GR[S.front]])(brLampSpots(c.G.art, c.G.fam, c.b.n));
function spriteBridge(x, y, px, py, z, gruppe) {
  const c = bkAt(x, y), lamp = bkLampGroups(c).includes(gruppe);           // gekauft (an UND aus: nachts gelb bzw. grau)
  const zs = spriteStep(z), fog = FOG, [l, u, , d] = brBox(gruppe, c);
  const keyOf = lit => `br|${x},${y}|${gruppe}|${fog ? 1 : 0}` + (lamp ? '|' + lit : '');
  const make = …unverändert…;
  const e = getSprite(keyOf(night > 0.15 && isLive() ? 1 : 0), zs, make, groundVersion);
  if (lamp && preLit()) prewarm(keyOf(1), zs, make, groundVersion);       // Regel 143
  if (!e) return false; putSprite(e, px, py, z); return true;
}
```
- **`dark` kommt nicht in den Schlüssel.** `T` ändert sich nur in `recalc`, und `recalc` zählt `groundVersion` hoch (rules.js:829). So zeigt `getSprite` die alte Fassung weiter, bis die neue fertig ist. Ein neuer Schlüssel wäre ein Fehlschlag mit Live-Zeichnen.
- Gruppen ohne Lampen behalten den alten Schlüssel, der B2c-Test :86–92 bleibt grün.
- Den Kommentar :122–123 nachziehen.

### a8. Blass (brueckenbild.js:117)

```js
const f = () => { const a0 = g.globalAlpha, gm = GLOW_MUTE; if (fade) { g.globalAlpha = a0 * SEE_A; GLOW_MUTE = true; }
  try { for (const gr of live) bkDrawLagen(x, y, px, py, z, gr); } finally { g.globalAlpha = a0; GLOW_MUTE = gm; } };
```
- `true` unterdrückt Schein und Scheibe, warm wie blau (draw-objects.js:19).
- Bildchen entstehen bei blass nie (:115), also greift `SPRITE_PAINT` nicht ein.

### a9. CLAUDE.md, Abschnitt Brückenfamilie (:291–313)

Ergänzen:
- Licht nur über `brLampSpots`.
- Schlüssel `br|x,y|gruppe|FOG|lit` nur bei Lampengruppen, sonst ohne `lit`.
- B2 mit Licht in t1/t2 (`bkTileBAt`).
- Strom `'B'+Anker`, zuletzt.
- Blass ohne Schein.
- Den Satz „weit weg Bildchen `br|x,y|gruppe|FOG`“ anpassen.

---

## 3. C7b Kaufen, Strom, Fenster

**`brSet`:** Den Zweig vor `} else return false;` (bruecken.js:313) einsetzen. Der Aufpreis läuft über den vorhandenen Weg :326–331 (prüft Taler und `matError`, Stempel `brAdd(paid, price)`). An/aus nimmt :332.
```js
  } else if ('licht' in ch) {                                              // 160c C7: alle Materialien, beide Familien; an/aus kostenlos
    const bought = L.licht === 'an' || L.licht === 'aus';
    if (ch.licht === 'kaufen') { if (bought) return false; price = brAdd({ money: 0 }, BR_OPT.licht.feld, n); nb.brl = 'an'; }
    else if ((ch.licht === 'an' || ch.licht === 'aus') && bought && L.licht !== ch.licht) nb.brl = ch.licht;
    else return false;
  } else return false;
```
- In :334 `groundVersion++; sfx('road'); if ('licht' in ch) recalc(); save();` (Strom sofort).
- Kommentar :279–281 und :326 („Zacken/Licht: Aufpreis“) ergänzen.
- Sollte F-b „nicht anbieten“ heißen: `if (L.mat === 'stein' && n === 1) return false`. Wichtig dabei: Ein Materialwechsel behält `brl` (:292). Ein Holzsteg mit Licht und 1 Feld, der zu Stein wird, zahlt dann Licht ohne Lampe. Deshalb empfehle ich die Mitte.

**`computePower`** (rules.js, nach :2809, vor `return` :2810):
```js
  if (city && bkOn()) {                                                    // Brückenlicht (160c C7, F2): zuletzt; je Feld eine Lampe (LAMPS_PER_POWER :2346)
    const bl = [];
    for (const k of [...state.bruecken.keys()].sort()) { const b = state.bruecken.get(k); if (brLook(b, 'anhoehe').licht === 'an') for (let i = 0; i < b.n; i++) bl.push('B' + k); }
    for (let i = 0; i < bl.length; i += LAMPS_PER_POWER) if (!take(1, 'brlicht')) bl.slice(i, i + LAMPS_PER_POWER).forEach(l => dark.add(l));
  }
```
- Das Präfix `B` ist frei. Laternen haben `x,y,i`, Kanten `E`/`A`/`G0`/`G1`/`P`. Die Schönheit (:766/:768) fragt nur Deko-Schlüssel ab.
- Liegt ein Feld im dunklen Block, ist die ganze Brücke dunkel.
- 'aus' zählt nicht. Ohne `city` ist das Licht nie dunkel.

**ui.js `powerStatus`** (:2096–2106):
```js
if (P.use.brlicht) parts.push(`Brückenlicht ${P.use.brlicht}`);         // nach :2101
const dl = [...P.dark].filter(k => k[0] !== 'B').length, db = P.dark.size - dl;   // ersetzt :2103
if (dl) out.push(`<div class="bad">🌙 ${dl} ${dl === 1 ? 'Laterne bleibt' : 'Laternen bleiben'} nachts dunkel</div>`);
if (db) out.push(`<div class="bad">🌉 ${db} ${db === 1 ? 'Brücke bleibt' : 'Brücken bleiben'} nachts dunkel</div>`);
```
In der Legende :2105 ergänzen: „· Brückenlicht je 10 Felder 1 ⚡ (zuletzt)“.

**`openBkInfo`:** Der Abschnitt kommt nach den Zacken (:672–673), vor „Weg oder Gleis“ (:674). Der Handler kommt nach :685.
```js
const lb = !!L.licht, lc = brCostMat(brAdd({ money: 0 }, BR_OPT.licht.feld, b.n)), dunkel = L.licht === 'an' && T.rail.power.dark.has('B' + c.k);
`<div class="label">Licht</div><div class="row">${lb ? opt('brl', 'an', 'An', L.licht === 'an') + opt('brl', 'aus', 'Aus', L.licht === 'aus')
  : `<button class="btn" data-brl="kaufen">💡 Licht kaufen −${fmt(lc.cost)}${Object.keys(lc.mat).length ? ' · ' + matText(lc.mat) : ''}</button>`}</div>
${dunkel ? '<p class="muted">⚡ Ohne Strom bleibt das Licht dunkel – Brückenlicht bekommt Strom zuletzt (nach Laternen, Betrieben und Zügen).</p>' : ''}`
for (const e of el.querySelectorAll('[data-brl]')) e.onclick = () => set({ licht: e.dataset.brl });
```
Die Namen `bought` und `lk` sind schon vergeben (:665, :660). Besuch und Zuschauen sind doppelt gesperrt: cloud.js:417–422 und `undoable` → `viewOnly` (actions.js:1150).

**Erstattung, Rückgängig, Kopie:** Hier ist nichts zu tun.
- Abriss: `brPaid` samt Licht (bruecken.js:252/267–269, plan.js:252).
- Materialwechsel: netto 0 für Licht (:319–323).
- Rückgängig: ↶ merkt das ganze Objekt, Taler und Rohstoffe und ruft `recalc` (actions.js:1121–1144, :1220–1227).
- Kopie: `copyCollect` nimmt `state.bruecken` nie mit (actions.js:568).

**Altversion v1016** (`origin/main` = ac7a848, `state.js?v=1016`):
- `brPaidOk` lässt `k` nicht zu. Deshalb verwirft `brClean` das `brp` und behält `brl`.
- v1016 zeichnet kein Licht und rechnet keinen Strom.
- Abriss in v1016: nach `bkCost` ohne Licht, also nie mehr als bezahlt.
- Zurück in der neuen Fassung:
  - Das Licht wirkt sofort.
  - `brPaid` nimmt die alte Tabelle (brueckenfamilie.js:140), ohne Licht.
  - Kaufen ist gesperrt (`bought`).
  - Ein späterer Materialwechsel berechnet das Licht noch einmal. Das ist sicher, aber gegen den Nutzer. Hinnehmen.

---

## 4. Fallen

| # | Falle | Heute | Gegenmaßnahme | Test |
|---|---|---|---|---|
| L1 | Doppelter Schein beim Nachmalen | gebaut (`'pane'`) | – | reihenfolge: Scheine mit und ohne Figur gleich, im Nachmalen nur `redo:pane` |
| L2 | Lampe im Rahmen dunkel | `mask === false` stanzt trotzdem (render.js:883) | a1 | nachtlicht: `putSprite` unter `'pane'` |
| L3 | Bildchen unter der Sperre ohne Licht | behoben (draw-objects.js:18) | – | reihenfolge: `paintSprite` unter `'pane'` → `glows > 0` |
| L4 | Deck stopft den Schein | – | hinten am Ende von 'd'; K1 in 'h' (gewollt, Entwurf :164); B2 in t1 | brueckenbild: Deck-`fill` vor `glow` |
| L5 | hintere Lampe über der Figur | – | hinten vor dem Bewegten (d, h, t1) | reihenfolge mit Figur oben |
| L6 | Schein fehlt im Nachmal-Rahmen | offen | Messen (§6). Dahinter (B) malt h, vd **und** o nach (:184/:191); Zug darunter malt vd und o fast im ganzen Feld (`glMoverBox` 120z × 115z); Zug oben malt o + HILL_H. Warm: Scheiben bleiben, der Schein auf den Brückenpixeln fehlt. Blau: K1 hinten nur bei Figur dahinter, B2 gelöst (a5) | Differenzbild; dann **F-g** |
| L7 | Dämmerung | – | überall `night > 0.15 && isLive()`; `prewarm` nur für Lampengruppen | reihenfolge: Vorwärmen bei 0,1, bei 0,2 `miss` 0 |
| L8 | Löschbild falsch | – | `licht`/`dark`/`lit` erst im Maler (a3/a4) | Prüfbild: Nachtbild = live |
| L9 | Rahmen schneidet Laterne/Punkt ab | vd zu klein für Stein und Bahn Metall | a6 | Rahmentest mit Stein, Kristall, Licht |
| L10 | Blau wird gelb (K1 'h' und t2 am selben Punkt) | offen (render.js:867) | a1 `n.id` | nachtlicht: zwei Nachtbilder, gleicher Punkt, gleiche Breite |
| L11 | GL: Scheibe in der Dämmerung doppelt | `glOutQuad` nicht auf R beschnitten (gl.js:182–184) | hinnehmen | Prüfbild GL = 2D |
| L12 | dichte Punkte (`glowCells` 24 px) | – | hinnehmen (Block 70) | Prüfbild z 1 beim Schieben |
| L13 | Licht ohne Stempel | sichtbar, Geld nach alter Tabelle | Setzer stempelt immer; Altversion nie mehr erstattet | bruecke: v1016-Geschwistertest |
| L14 | Materialwechsel verliert Licht | erledigt | – | Bilanz Bau → Licht → Material → Abriss = 0 |
| L15 | Strom vor Zügen | – | eigener Block nach :2809 | strom: `computePower` direkt |
| L16 | Blass stanzt volles Licht | offen (`bkGroup` :117) | a8 | reihenfolge: 👁 nachts → 0 `punchGlow` |
| L17 | ungültige Farbe | – | nur Hex, `circle(…, C())`, Ton nur warm/`'blue'` | Deckend-Scans mit Licht |
| L18 | Laterne ragt ±1,6 px ins Nachbarprisma | wie die Pfosten (B2d) | hinnehmen | Nahaufnahme Kante mit Figur |
| L19 | Schein an der fernen Anhöhe fehlt | wie im Entwurf | nichts | Bild |
| L20 | Attrappe ohne `getTransform` | – | in Scans `glowQuad` als **Spion**; `getTransform` nur in `lampLog`. **Nicht in `scanK`:** ein echtes `getTransform` schaltet das Einrasten des Glasbands ein (:258–259) | – |
| N1 | t2 (und B2-t1) weit weg ohne `|lit` | Bildchen über `spriteBridge` | a7 | weit weg nachts: Schlüssel `…|t2|0|1` |
| N2 | B2-Blau im Nachmalen weg | – | a5 (t1/t2) | reihenfolge: B2 mit Licht nie in `bkRedo`, `brLiveTiles` enthält es |
| N3 | Wächter-Fingerabdruck kippt | – | Lampen nur hinter `if (opts.licht)`; `bkTileArgs` ohne `g`; vorhandene Aufrufe unverändert | Wächter :124 bleibt `1946393987`. Kippt er, ist das ein Fehler, nie neu messen |
| N4 | `bkRedo` setzt `GLOW_MUTE` hart zurück | :165 | a1 | – |
| N5 | ui zählt Brücken als Laternen | :2103 | §3 | bruecke: Bilanztext |
| N6 | Bahn Metall, gerades n: Mittelknoten auf der Kante | – | `inCell` halboffen mit 1e-9 (wie `seg` :38) | `lampLog`: jede Lampe genau einmal |
| N7 | Viadukt: frühes `return` (:368) | – | Lampen kommen nach dem Maler (a4) | `scanStein` mit `fam: 'bahn'` (neu) |
| N8 | `brSet` ohne `recalc` | :334 | §3 | strom: dunkel direkt nach `brSet` |
| N9 | `dark` im Schlüssel | – | nie (a7) | – |
| N10 | `nightSeen` mit `n.id` doppelt bei großen Gebäuden | – | gleiches `e.night` → gleiche Kennung | Prüfbild Schloss/Reihenhaus nachts weit weg unverändert; `npm test` nacht |
| N11 | GL: Masken-Zweig (`destination-out` in der Zelle) und Scheiben-Zweig (`glOutQuad`) ungleich | ungeprüft | – | Prüfbild GL = 2D Dämmerung |
| N12 | Stein mit 1 Feld | keine innere Kante | F-b | `lampLog` Stein n1 |

---

## 5. Tests zuerst

### tests/brueckenbild.test.js

**`lampLog`**: eigene Proxy-Attrappe mit `getTransform`, das echte `glowQuad` in `GLOW_SINK`, Spione auf `circle`/`box`. Alles im `finally` zurücksetzen.
```js
const lampLog = (art, fam, n, o = {}) => game(`(() => { const O = ${JSON.stringify({ licht: 'an', dark: false, nacht: 1, ax: 0, ...o })};
  const g0 = g, sp0 = SPRITE_PAINT, n0 = night, sink = GLOW_SINK, ci = circle, bx = box, glows = [], heads = []; let cur = '';
  g = new Proxy({}, { get: (t, k) => k === 'getTransform' ? () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) : k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
  circle = (x, y, r, f) => { heads.push([cur, +x.toFixed(4), f]); return ci(x, y, r, f); };
  box = (cx, cy, a, b, h, wall, ...r) => { heads.push([cur, +cx.toFixed(4), wall]); return bx(cx, cy, a, b, h, wall, ...r); };
  SPRITE_PAINT = !!O.nacht; night = O.nacht ? NIGHT_MAX : 0; GLOW_SINK = [];
  try { const hf = brDeckHFn('${fam}', ${n}), sup = brSupports({ mat: '${art}', fam: '${fam}' }, ${n}), S = '${art}' === 'stein' ? brStoneGeom('${fam}', ${n}, sup) : null;
    for (let i = 0; i < ${n}; i++) for (const L of BK_LAGEN) { cur = i + L; const k0 = GLOW_SINK.length;
      bkPaintLage(L, (t, s, h) => [t, Math.sign(s) * 1000 - h], 1, '${art}', ${n}, i - 0.5, i + 0.5, false, { fam: '${fam}', ax: O.ax, hf, stone: S, gl: () => 0, supports: i ? sup : [], ext: 0, licht: O.licht, dark: O.dark });
      for (const e of GLOW_SINK.slice(k0)) glows.push([cur, +((e.q[0][0] + e.q[2][0]) / 2).toFixed(4), Math.sign(e.q[0][1]), e.r, e.tint || 'warm']); } }
  finally { g = g0; SPRITE_PAINT = sp0; night = n0; GLOW_SINK = sink; circle = ci; box = bx; } return { glows, heads }; })()`);
const R = (n, K, off = 0) => Array.from({ length: n * K + 1 - 2 * off }, (_, k) => +(-0.5 + (k + off) / K).toFixed(4));
const V4 = n => Array.from({ length: 4 * n }, (_, j) => +(-0.5 + (j + 0.5) / 4).toFixed(4));
const ST = n => n > 1 ? R(n, 1, 1) : [0];                                   // F-b
const LAMPEN = [['holz','fuss',n=>R(n,2),'d','o',5,'warm'], ['stahl','fuss',n=>R(n,2),'d','o',5,'warm'], ['stein','fuss',ST,'d','o',18,'warm'],
  ['kristall','fuss',V4,'h','t2',7,'blue'], ['holz','bahn',n=>R(n,2),'d','o',5,'warm'], ['stein','bahn',ST,'d','o',18,'warm'],
  ['stahl','bahn',n=>Array.from({length:2*n+1},(_,k)=>+(-0.35+(n-0.3)*k/(2*n)).toFixed(4)),'d','o',4,'warm'], ['kristall','bahn',V4,'t1','t2',7,'blue']];
```
- **„Lampen je Modell (C7)“**:
  - für alle LAMPEN, n 1–8, ax 0/1;
  - hinten (y < 0) und vorn (y > 0) je genau `at(n)`, also jede Kante genau einmal;
  - Lage = hL bzw. vL; Radius und Ton.
- **Zustände:**
  - `licht: null` → `[glows, heads]` beide leer.
  - `'aus'` und `dark: true` → keine `glows`; Köpfe `#9a978c`, außer Kristall.
  - Tag (`nacht: 0`) → keine `glows`, Tagfarben.
  - Kristall: Strichfarbe über `strokeStyle` prüfen (Tag, an, aus).
- **Reihenfolge (L4)**: `glowQuad` als Spion.
  - `'fill ' + C(BK_FUSS.holz.deck)` kommt vor `'glow warm'` (Fuß Holz 'd').
  - Stein 'd': die Laterne kommt nach `railPaint` (Viadukt).
  - Streifen: `'stroke #dff8ff'` direkt vor `'glow blue'`.
- **Prisma und deckend mit Licht**:
  - `scanFuss`, `scanStein`, `scanK` und `scanBahn` (:92, :155, :213, :267) bekommen den Parameter `x` (an `opts` angehängt) und den Schalter `nt` (`SPRITE_PAINT`, `night`, Spion `glowQuad`).
  - Fälle: `licht 'an'` tags/nachts, `'aus'`, `dark`. Erwartet je `[[], []]`.
  - Das prüft auch: Stummel 'butt', jede Senkrechte einmal, B2 t1/t2, K1 'v'/'o' leer (:233).
  - **Neu**: `scanStein` mit `fam: 'bahn'` (Viadukt). Zuerst ohne Licht laufen lassen, das ist die Grundlinie.
- **Rahmentest** (:43): `art` über alle vier Materialien, `licht` null/'an' (`b.brl`). Zuerst nur mit null laufen lassen (neue Grundlinie für Stein und Kristall).
- **Sperre `'pane'`** einzeln (`punchGlow`-Spion): warm → `'pane'`, blau → nichts, mit `GLOW_SINK` → nichts, bei `SPRITE_PAINT` normal. Der Test :77 bleibt.
- **Wächter** :124 unverändert. Nach der Abnahme einen zweiten Wächter mit `brl: 'an'` (Tag und Nacht, Attrappe mit `getTransform`, `GLOW_SINK = []`).

### tests/nachtlicht-bildchen.test.js (Muster `record` :8)

```js
const E = (mask, tint = null) => `({ c: { width: 20, height: 20, tag: 'bild' }, ox: 0, oy: 0, z: 1, glows: [{ q: ${Q}, r: 18, tint: ${JSON.stringify(tint)} }], mask: ${mask} })`;
const put = (e, m = "'pane'") => record(`GLOW_MUTE = ${m}; try { putSprite(${e}, 100, 100, 1); } finally { GLOW_MUTE = false; }`);
expect(put(E('null'))).toEqual(['bild', 'scheibe']); expect(put(E("{ c: { width: 4, height: 4, tag: 'maske' }, x: 10, y: 10 }"))).toEqual(['bild', 'maske']);
expect(put(E('false'))).toEqual(['bild']);   // heute rot
expect(put(E('null', 'blue'))).toEqual(['bild']); expect(put(E('null'), 'true')).toEqual(['bild']);
```
**L10**: `putNight` zweimal am selben Punkt mit zwei Nachtbildern gleicher Breite (`light.c.tag` 'h'/'t2'), dazu das erste noch einmal. Erwartet: `nightPics` = ['h', 't2'], `nightPanes.length` = 2. Heute kommt nur ['h'] zurück.

### tests/bruecken-reihenfolge.test.js (Hilfen `scene` :8, `far` :85)

`LIT = "state.bruecken.get('14,12').brl = 'an';"`. Im Neuspiel ist `city` falsch, das Licht also nie dunkel; das mit `expect(game('T.rail.power.city')).toBe(false)` festhalten.
- **L1/L2**:
  - `glowRun(figs)` wie :109–122, Figur als `hillWalkers` mit `st: 'top'` auf 15,12, nachts, z 2,5.
  - Erwartet: Nicht-Nachmal-Scheine mit und ohne Figur gleich, `redo:pane` > 0, im Nachmalen nur `redo:pane`.
  - Beide Achsen (`'12,8'`).
- **Weit weg nachts**:
  - `br|x,12|vd|0|1` und `|o|0|1` mit `glows > 0`; `br|x,12|h|0` ohne `lit` (Holz).
  - Kristall K1 mit `brl`: `…|h|0|1` und `…|t2|0|1`.
- **Dämmerung (L7)**, nach tempo-schritt3.test.js:213: `nightAt = 0.1`, 6 Bilder → `…|(vd|o)|0|1` mit `e.night`. Dann `nightAt = 0.2` → `SPRITE_STATS.miss === 0`.
- **L3**: `paintSprite` unter `GLOW_MUTE = 'pane'`, nachts → `glows.length > 0`.
- **B2 mit Licht**:
  - `brLiveTiles()` = die drei Felder; ohne Licht leer (wie :155).
  - Mit Zug darunter kommen t1/t2 je genau einmal, nach dem vd-Nachmalen, nie in `bkRedo`.
- **Blass**: `setSeeThrough(true)`, nachts, `LIT` → 0 `punchGlow`.

### tests/strom.test.js (Block „Strom für die Stadt“ :102)

`computePower` direkt, ohne Windrad-Zufall:
```js
it('Brückenlicht bekommt Strom zuletzt (C7)', () => {
  lamps(10); game("state.bruecken.set('14,16', { ax: 0, n: 3, art: 'holz', brl: 'an' }); groundVersion++");
  const P = (s, plants = 1) => game(`(() => { const p = computePower([{ count: 1, need: 4 }], ${s}, ${plants}); return [p.dark.has('B14,16'), [...p.dark].filter(k => k[0] !== 'B').length, p.trains, p.use.brlicht || 0, p.city]; })()`);
  expect(P(5)).toEqual([true, 0, 1, 1, true]);    // 1 Laternen + 4 Zug – nichts übrig
  expect(P(6)).toEqual([false, 0, 1, 1, true]);
  expect(P(0)).toEqual([true, 10, 0, 1, true]);
  game("state.bruecken.get('14,16').brl = 'aus'"); expect(P(5)[3]).toBe(0);
  game("state.bruecken.get('14,16').brl = 'an'"); expect(P(0, 0)).toEqual([false, 0, 0, 0, false]);   // ohne city nie dunkel
});
```

### tests/bruecke.test.js (C6-Block :436, `lueckeVier`/`wallet`/`spent`; Vorbild Zacken :474)

- **Kaufen** (n = 4, Holz):
  - `brSet(…,{licht:'an'})` ohne Kauf → `false`.
  - `undoable(kaufen)` → `true`, kostet `{ money: 80, metall: 4 }`, `groundVersion` steigt.
  - `brp` → `{ money: 320, bretter: 12, metall: 4, k: 'a:holz' }`.
  - aus/an kostenlos, zweimal kaufen → `false`.
  - `mat: 'stein'` behält `licht 'an'`.
  - Abriss → Bilanz `{}`.
- **Fenster**:
  - `[data-brl="kaufen"]` klicken → `brl 'an'`, zwei Knöpfe.
  - „Abreißen +“ = `fmt(brPaid(…).money)`.
  - ↶ → kein `brl`, Taler wie vorher.
  - Besuch (`viewOnly`) gesperrt (Muster uebergang.test.js:106–110).
- **Strom direkt** (`state.restore.klippe = 3`, ohne Windrad): Nach `brSet(kaufen)` ist sofort `dark.has('B14,12')` gesetzt. `powerStatus()` enthält „Brücke bleibt nachts dunkel“ und zählt keine Laterne.
- **v1016-Geschwistertest** zu :511:
  1. Kaufen, `paid` merken.
  2. `delete brp`.
  3. Erwartet: `licht === 'an'`, `brPaid` ≤ `paid` je Rohstoff, `licht:'aus'` kostenlos, Abriss ≤ `paid`.
  4. Dasselbe nach `b.art = 'stahl'` ohne `brl` anzufassen.

### Sonstiges

- anhoehe-stufe2.test.js:26: Die neuen Namen sind frei (grep): `brLampSpots`, `BR_TRUSS`, `bkLamps`, `bkLampGroups`, `BK_LAGE_GR`, `bkTileBAt`, `nightSeq`, `data-brl`.
- webgl.test.js:60 bleibt, es kommen nur warm und `'blue'` vor.
- Tests nie parallel laufen lassen (vitest maxWorkers 4).

---

## 6. Prüfbilder (Hauptagent, nacheinander)

Vorher `npm run bump`. Dann `npm run serve`, `?welt=neu`, Sammler auf 4181. Neues Werkzeug `tools/brueckenlicht-pruefung.js`, Kamera wie `brueckenlichtBild` (500 × 400, z 1,8), damit das Bild neben `tools/vorschau/brueckenlicht.png` passt.

```js
(function () {
  const M = [['F-holz','holz',0,0],['F-stein','stein',0,0],['F-metall','stahl',0,0],['F-kristall','kristall',0,0],['F-zacken','kristall',0,1],
    ['B-holz','holz',1,0],['B-stein','stein',1,0],['B-metall','stahl',1,0],['B-kristall','kristall',1,0]];
  function setup(licht, strom, N = 4, col = null) {   // Ost-West: Anhöhen x 10–13/18–21, Brücke 14,X; Nord-Süd: y 44–47/52–55, Brücke X,48
    /* Gebiet leeren, Anhöhen setzen, state.restore.klippe = 3 (city), je Modell und Achse: b = { ax, n: N, art, gleis?, brz?, brl?, brc? };
       brStamp(b, 'anhoehe', brLook(b, 'anhoehe'), N); Weg bzw. Schiene auf den Anhöhen-Enden; strom: 12 Windräder; groundVersion++; recalc() */ }
  function shot(cx, cy, z, nt, gl, W = 500, H = 400) { /* wie brueckenpruefung.js:16–28: nightAt/gameHour/GL.off/GFX.day setzen, 6× render, ausschneiden */ }
  function diff(a, b, R) { /* getImageData beider Bilder: max. Abweichung außerhalb R (muss 0 sein), mittlere Helligkeit innerhalb R (L6) */ }
  window.brueckenlichtPruefung = async (name, { nights = [0, NIGHT_MAX], z = 1.8, licht = 'an', strom = true, axes = [0, 1], gl = false, n = 4, col = null } = {}) => { /* Blatt 4 Spalten → POST 4181 */ };
  return 'ok';
})();
```

| # | Bild | Aufruf / Inhalt |
|---|---|---|
| 1 | c7-licht.png, **Abnahme** | `()`: 9 Modelle × 2 Achsen × Tag/Nacht. Zeigen: W 0,4 statt 0,3, Strich heller (erst Strich, dann Schein), hintere Lampen erhellen das vordere Geländer nicht |
| 2 | c7-zustand.png | `{ licht: 'aus' }`, `{ strom: false }`, `{ licht: null }`, je Nacht. Kristall-„aus“ für F-c |
| 3 | c7-daemmerung.png | `{ nights: [0.1, 0.2, 0.45] }`, nah |
| 4 | c7-weit.png | `{ z: 0.45, nights: [0.45] }` in 2D, dann mit `gl: true`: GL = 2D, auch nach einem Kamerazug (`glBgStep`) |
| 5 | c7-bewegt.png + Differenz | Figur oben, dahinter, darunter; Zug darunter (Fuß Holz) und oben (Bahn Holz, B2). Außerhalb des Rahmens Abweichung 0; im Rahmen Scheiben hell, Schein-Verlust messen → **F-g** |
| 6 | c7-laenge.png | n = 1/2/4 (8 nach C8), Stein n = 1 (F-b) |
| 7 | c7-blass.png | 👁 und „darunter bauen“ nachts |
| 8 | c7-farbe.png | Stein-Laternen mit 3 `brc` (Gehäuse) |
| 9 | Anschlüsse | ferne und nahe Anhöhe nachts, Nahaufnahme an der Kante (L18/L19) |
| 10 | Großbauten | Schloss/Reihenhaus nachts weit weg vor und nach `n.id` (N10) |
| 11 | Ruckeln | `tools/ruckeln.js` Full HD nachts samt Dämmerungsübergang (Regel 143); erst nach dem Nebenbefund `full` |

**C7c (optional, nach der Abnahme):**
1. tools/brueckenwelt.js: ein eigener Abschnitt mit Licht je Material, gestempelt.
2. `brueckenVorlage` (:95–98) filtert `.filter(([, b]) => !b.brp)`, Test :34 anpassen.
3. `GEN=1 npx vitest run tests/brueckenwelt.test.js`. Danach muss `git diff tests/vorlagen/alte-bruecken.json` leer sein.
4. `LEISTUNG_NEU=1 npx vitest run tests/leistung.test.js -t bruecken`, Begründung „Brückenlicht C7“ in AUFGABEN.

---

## 7. Offene Nutzerfragen

- **F-a Strom je Feld?** Empfehlung: Jedes Feld zählt wie eine Laterne (10 Felder = 1 ⚡), passend zum Preis je Feld. Alternative: 1 Laterne je Brücke.
- **F-b Stein mit 1 Feld** hat keine innere Kante. Empfehlung: ein Laternenpaar in der Feldmitte (t = 0 liegt auf einem Baluster, `parH` = 6,5). „Nicht anbieten“ hinterlässt eine Lücke: Ein Materialwechsel behält das bezahlte Licht.
- **F-c Kristall „aus“ bzw. ohne Strom nachts:** Empfehlung: Streifen in der Tagfarbe `#bfe9f8`, ohne Schein, nicht grau. Ohne gekauftes Licht kein Streifen, das gilt nach PLAN 2.6 und den abgenommenen C4/C5-Bildern.
- **F-g Restfehler L6:** Erst nach Prüfbild 5 fragen. Hinnehmen, wenn klein. Sonst Nachmalen über eine Zwischenleinwand (nur 2D, in GL nicht einfach).

**Schon entschieden, nicht fragen:**
- „Aus“ tags in der Tagfarbe, nachts grau, wie `drawLantern` (draw-schmuck.js:13–16).
- Gehäusefarbe (§4 Nr. 8).
- Blass ohne Schein: technisch, sonst stanzt eine blasse Brücke volle Löcher. Im Bild 7 zeigen.

**Dateien:**
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-C7-licht.md
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-base.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-schmuck.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/state.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/nachtlicht-bildchen.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/strom.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/tempo-schritt3.test.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js

---

## 8. Korrekturen aus der Gegenprüfung (3 Prüfer, 12.10.2026)

- **GL-Nachmalen über die Lichtmaske (Prüfer Licht):** in `glLive` ist `g = LA.x`, `destination-out` der Maske macht dort kein GL-Loch. Lösung: `if (e.mask && !glOnWorld()) { Maske } else if (e.mask !== false) Scheiben per punchGlow pane` (GL: glOutQuad). Nebenbefund `full` (render.js:617/619) **vor** C7a reparieren. Prüfbild 5 auch mit GL.
- `bkPaint` wird auch von `drawBkIcon` (Leiste/Menü) benutzt – dort immer Fußgänger ohne Licht.
- actions.js Rückgängig: `recalc` steht in :1228.
- nachtlicht-Test: vorher `night = 0.4; glows.length = 0; glowCells.clear()`, danach `night = 0`.
- v1016-Test Schritt 4: die Buchung von v1016 beim Artwechsel nachstellen (`bkCost(alt) − bkCost(neu)`) oder nur prüfen, dass `brPaid` = `bkCost(stahl, 4)` ohne Licht ist.
- `scanStein` liefert `[bad, verts, polys]` – so prüfen, nicht `[[], []]`.
- state.js:370 / brPaid :140: `art: constructor` ohne brp erstattet 0 (nie zu viel).
