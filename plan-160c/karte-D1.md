# D1 Baukarte: Wasser-Wegbrücken, Zeichenort mit altem Aussehen

Stand `acc7d9a`. Ich habe nur gelesen und nichts geändert, ausgeführt oder getestet. Die Zeilen gelten für HEAD.

## 0. Heute, was fehlt, Entscheidung

**Heute (im Code geprüft):**
- **Flache Brücken** liegen im Boden-Durchgang, vor allen Objekten (render.js:1638–1651). Die Bögen werden dort übersprungen (:1645) und in tileA gezeichnet (:2114 → `drawArchBridge` :932, Bildchen `arch|x,y|fog|lit` :937–954).
- **`liveFlatSet`** (render.js:86–96) enthält alle Wasser-Wegbrücken, auch die Bögen.
- **Boot:**
  - `boatUnder` (render.js:1328–1333) → tileB :2196–2200 → `bridgeOverBoat` (:1322, GL-Zelle 70·z) → `drawBridgeOver` (:921).
  - Flach wird das ganze Feld nachgemalt, samt hinterem Geländer. Grund: `BRIDGE_FRONT = !!bridgeArch` (:927).
  - Das läuft live, ohne Ausschnitt und mit `FOG = false`.
- **Figuren:**
  - `wegBridgeLift` (rules.js:1935) gibt bei flachen Brücken 0 zurück. Das Deck liegt aber bei 3, 7 oder 8.
  - Gezeichnet werden die Figuren in tileB, also über dem vorderen Geländer.
  - Benutzt wird die Höhe in movers.js:370 und gl.js:554.
- **Licht:** Keins. Trotzdem stehen `lit` und `prewarm` in `arch|` und `flat|`.
- **GL:** Fehlt das Bildchen einer flachen Brücke, wird der Boden lebendig (render.js:1648). Dann verwirft der Hintergrund das ganze Standbild (gl.js:738).

**Was fehlt:**
- Flache Brücken in der Maler-Reihenfolge.
- Nachmalen nur der nötigen Lage, im Rahmen des Bewegten, als Bildchen und mit richtigem FOG.
- Figuren auf Deckhöhe und hinter dem vorderen Geländer.

**Entscheidung: Ja. D1 ist „B2 für Wasserbrücken mit altem Maler, in Lagen“.**
- Die B2-Funktionen bekommen das Brückenfeld `c` als Parameter. Die Vorgabe bleibt `bkAt`, für die Anhöhen ändert sich also nichts.
- Ein neues Feld `wbAt(x,y)` hat `water: true` und `G: null`.
- D2 muss dann nur noch `c.G` füllen und in `bkDrawLagen` den Maler tauschen. Lampen-Schlüssel `|lit`, Glas in tileB und `BK_START_CUT` kommen dann aus dem B2-Code.

**`drawWegBridge` in Lagen** (Reihenfolge heute schon h → v → d → o, nah also pixelgleich):

| Lage | Zeilen (draw-objects.js) | Holz, Rot | Stein, Ziegel |
|---|---|---|---|
| h | :1000 (`!latB`), Rückwand und Gewölbe in `archWall` :1063–1074 | hintere Pfähle, hinteres Geländer | hintere Brüstung, Rückwand, Gewölbe |
| v | :1000 (`!latF`), :1003 (Fläche ab :1075), :1004–1012 | vordere Pfähle | Bogenwand bzw. flache Wand mit Muster und Bogen-Andeutung |
| d | :1013–1038 | Planken, Randbalken vorn | Belag mit Muster, Asphaltstrich |
| o | :1040–1047 | vorderes Geländer, Querlauf am offenen Ende | vordere Brüstung, Stirn am offenen Ende |

`BRIDGE_FRONT` entspricht genau v + d + o.

**Widersprüche zwischen den drei Berichten, im Code entschieden:**

| # | Streitpunkt | Befund im Code | Entscheidung |
|---|---|---|---|
| W1 | Boot unter flacher Brücke: ganz („tests“), h+vd („zeichnen“), nur vd („bewegt“) | render.js:927: flach wird alles nachgemalt, auch h | **Altes Aussehen:** flach h+vd(+o), Bogen vd(+o). D2 entscheidet neu (Frage 2). |
| W2 | Lagen über Parameter, über global `WB_LAGEN` oder über `WB_PART` | Einziger Aufrufer ist `drawPath` (:1174), dazu neu `bkDrawLagen` | 7. Parameter `lagen` (ein Array aus `BK_GRUPPEN`). `archWall` bekommt einen 11. Parameter `wall`, der alte Aufruf mit 10 Argumenten bleibt gültig. |
| W3 | B2-Code mitbenutzen (`brCell`) oder eigene `wb*`-Kopien | `bkGroup`, `spriteBridge` und `bkRedo` holen sich `bkAt` selbst (brueckenbild.js:172/185/223), ebenso `bkDrawLagen` (bruecken.js:577). `bkFadeNow` liefert bei Durchsicht immer true (bruecken.js:682). | Parameter `c` statt `brCell`. Bei Altdaten mit beidem (Anhöhen-Deck über Wasserbrücke) ginge die Wasserbrücke sonst verloren. |
| W4 | Höhe als Zelle in rules.js oder als Closure in draw-objects.js mit FOOT_D | rules.js lädt vor draw-objects.js (index.html:53/61) | Eine reine Funktion `flatDeckH` in rules.js. Maler (:985) und `wegBridgeLift` benutzen sie gemeinsam. Der Fußpunkt kommt optional in D1f. |
| W5 | „Bogen-Andeutung wird beim Nachmalen dunkler“ (Bericht „bewegt“, Falle 1) | Die Wand ist deckend (:1005) und liegt vor dem rgba (:1011). v wird immer ganz gemalt. | **Falsch.** Kein Abdunkeln, nur Kantenglättung am Ausschnittrand. |
| W6 | Leistung in „neu“ unverändert („tests“) gegen „Bögen 3 statt 1 Bildchen“ („zeichnen“) | Heute ein `arch|`-Bildchen je Feld | **„zeichnen“ stimmt:** weit weg +2 drawImage je sichtbarem Feld, dann `leistung:neu`. |
| W7 | Eigene `wbMoverClass` oder `bkMoverClass` | `bkMoverClass` rechnet mit `BK_W` (brueckenbild.js:204) | `bkMoverClass` mit `c.W` (für Wasser `EDGE_W`). Auf dem Wasser ist `fur && !critter` immer A (movers.js:14). |
| W8 | `m.under`: alle außer dem eigenen Feld oder nur früher gezeichnete | Bei ganzzahligem px liefert `boatUnder` nur das eigene und spätere Felder | Für Wegbrücken nur früher gezeichnete Felder (`done`). Spätere Felder malt ihr tileA ohnehin darüber. |
| W9 | Plan nennt `brLiftAt` und rules.js:1932 | `brLiftAt` ist die Anhöhe (bruecken.js:37) | Gemeint ist `wegBridgeLift` in rules.js:1935. |
| W10 | `BK_START_CUT` schon in D1? | Die alten Pfähle stehen bei ±0,3 bzw. `archCenters` (:991) | Nein. Der Schnitt bleibt bei `!c.water`, Wasser kommt in D2. |

## 1. Bau-Reihenfolge

Jeder Schritt: Tests zuerst → `npm test` (maxWorkers 4) → `npm run bump` → Commit auf dem Branch, kein Push. Prüfbilder nacheinander, nie parallel.

**D1·0 Prüfwerkzeug und Vorher-Bilder** (Normal)
- Neues `tools/wasser-d1-pruefung.js` (§4). Am Spiel ändert sich nichts.
- Die Vorher-Bilder auf HEAD aufnehmen.

**D1a Gerüst, nichts Sichtbares** (Hoch)
```js
// rules.js bei bridgeArchCache (:1872); recalc :829 setzt zusätzlich wbCache.v = -1
const flatDeckH = (L, lA, lB, a) => Math.max(0, Math.min(L, lB && a > 0.2 ? L * (0.5 - a) / 0.3 : L, lA && a < -0.2 ? L * (a + 0.5) / 0.3 : L));
const wbCache = { v: -1, tiles: null, map: new Map() };
function wbAt(x, y) {                                   // Wasser-Wegbrücke als Brückenfeld (160c D1) – wie bkAt
  const k = x + ',' + y, t = state.tiles.get(k);
  if (!isWegBridge(t)) return null;
  const C = wbCache; if (C.v !== groundVersion || C.tiles !== state.tiles) { C.v = groundVersion; C.tiles = state.tiles; C.map.clear(); }
  let c = C.map.get(k); if (c) return c;
  const A = bridgeArch(x, y), ax = A ? A.ax : bridgeAxis(x, y, t), lift = (BRIDGE_LOOK[bridgeKind(t)] || BRIDGE_LOOK.holz).lift;   // erst zur Laufzeit
  const land = s => { const [dx, dy] = ax ? [0, s] : [s, 0], n = state.tiles.get((x + dx) + ',' + (y + dy)); return !!n && !isWegBridge(n) && terrainAt(x + dx, y + dy) !== 'water'; };
  c = { x, y, water: true, A, ax, b: { ax, n: A ? A.N : 1 }, W: EDGE_W, lift, landA: !A && land(-1), landB: !A && land(1), G: null };
  c.hm = Math.ceil(A ? archDeck(A, Math.max(A.i0, Math.min(A.i0 + 1, A.N / 2))) : lift);
  C.map.set(k, c); return c;
}
const wegDeckH = (c, a) => c.A ? archDeck(c.A, c.A.i0 + a + 0.5) : flatDeckH(c.lift, c.landA, c.landB, a);
```
```js
// draw-objects.js:972
function drawWegBridge(cx, cy, z, x, y, t, lagen = null) {            // lagen: BK_GRUPPEN-Teil, null = alles
  const on = l => !lagen || lagen.includes(l);
  … :985  : (lA => (lB => a => flatDeckH(LIFT, lA, lB, a))(land(1)))(land(-1));   // gleiche Zahlen wie bisher
  :1000 if (!B.wall) { if (on('h') && !front && !latB) {…} if (on('v') && !latF) posts(hw - 0.1, B.side); } else if (on('h') && !front && !latB) parapet(-hw);
  :1003 else if (B.wall && A) { if (on('h') || on('v')) archWall(A, P, H, AS, B, hw, z, t, front || !on('h'), depth, on('v')); }
  :1004 else if (B.wall && on('v')) {…}     if (on('d')) { :1013–1038 }     if (on('o')) { :1040–1047 }
}
function archWall(A, P, H, AS, B, hw, z, t, front, depth = 0, wall = true) { … :1074 danach: if (!wall) return; … }
```

Die B2-Funktionen bekommen `c` als Parameter. Für die Anhöhen bleibt alles gleich:
- **`brBox`** (brueckenbild.js:12): `hm = c ? (c.water ? c.hm : bkHMax(c)) : HILL_H`.
- **`bkGroup(…, gruppen, c = bkAt(x, y))`** (brueckenbild.js:172):
  - `fade = !c.water && bkFadeNow(x, y)`
  - `spriteBridge(…, gr, c)`, `bkDrawLagen(…, gr, c)`, `bkBoxOf(live, c)`
- **`spriteBridge(…, gruppe, c = bkAt(x, y))`** (brueckenbild.js:185):
  - Schlüssel `` `${c.water ? 'wb' : 'br'}|…` ``
  - `bkLampGroups(c)` liefert bei `G: null` eine leere Liste, also kein `|lit`.
- **`bkRedo(…, cut = false, c0 = bkAt(x, y))`** (brueckenbild.js:223).
- **`bkDrawStill`:** reicht `c` an `bkGroup` weiter.
- **`bkDrawLagen(…, gruppe, c = bkAt(x, y))`** (bruecken.js:577):
  ```js
  if (c && c.water) { const t = state.tiles.get(x + ',' + y); if (isWegBridge(t)) drawWegBridge(px, py, z, x, y, t, BK_GRUPPEN[gruppe]); return; }   // D2: bkPaintLage über brLook
  ```

**D1b Zeichenort ruhend** (Hoch)
```js
// render.js:93  … && !cachedPath(t) && !isWegBridge(t) && …        (Schiene bleibt drin)
// render.js:1645 if (isWegBridge(t)) continue;                      // ruhend in tileA (160c D1)
// render.js:2030
const bc = bkOn() ? bkAt(x, y) : null, wc = wbAt(x, y), bw = bc || wc;   let bkDone = !bw;
// :2110 (Zeile :2114 entfällt)
if (bw && (t.b === 'weg' || t.b === 'schiene')) { bkDrawStill(x, y, px, py, z, now, bw,
  t.b !== 'weg' ? drawIt : bc && wc ? () => bkDrawStill(x, y, px, py, z, now, wc, null) : null); bkDone = true; }   // Altdaten unter dem Deck: nie verschachtelt
// :2145 und :2148: bc → bw (Rückfall bei veraltetem COVER). Die PLAN_GHOST-Bedingung :2148 behält !bc
```
- `drawArchBridge` und `spriteArchBridge` (render.js:931–954) entfallen.
- Kommentare anpassen: gl.js:682, render.js:1693 („Gleisbrücken“).
- `tools/bogen-anhoehe-entwurf.js:42/55/59`: `sab` durch `spriteBridge` ersetzen, `lagen` an `o.dwb` weiterreichen.
- `npm run leistung:neu` mit Begründung „Wasserbrücken als 3 Bildchen h|vd|o statt 1 (B2), ohne lit“.

**D1c Vorschau auf dem Deck** (Normal)
```js
// render.js:1706  DECK_MARKS = bkOn() || plan ? new Map() : null;
// render.js:1426f.
const wc = !bc && DECK_MARKS && wbAt(x, y);
const hOf = up ? (…wie bisher…) : wc ? (u, v) => wegDeckH(wc, wc.ax ? v : u) : null;
if ((bc || wc) && DECK_MARKS) { …push… } else draw();
```

**D1d Höhe flach = LIFT** (Normal; muss vor D1e kommen, sonst stünde das vordere Geländer flach bis zu 7 px über den Beinen)
```js
// rules.js:1935
function wegBridgeLift(px, py) { const c = wbAt(Math.round(px), Math.round(py)); return c ? wegDeckH(c, c.ax ? py - c.y : px - c.x) : 0; }
```
Bögen bleiben gleich. `glMoverBox` (gl.js:554) wächst flach um LIFT·z.

**D1e Bewegtes** (Hoch)
```js
// render.js:2186
const bc = (bkOn() ? bkAt(x, y) : null) || (ms ? wbAt(x, y) : null), late = [];
// :2197  bridgeOverBoat(bk, z, now, m);      brueckenbild.js:267 ebenso (m)
// brueckenbild.js:204 bkMoverClass: const W = c.W || BK_W; überall BK_W → W
// brueckenbild.js:238 bkDrawMoving
if (c.water) { const on = ms.filter(m => m.fur && !m.critter); if (on.length) { figs = on; ms = ms.filter(m => !on.includes(m)); } }   // auf dem Wasser: immer auf dem Deck
const fade = !c.water && bkFadeNow(x, y), up = c.water ? 0 : HILL_H * z, vd = c.water && !c.A ? ['h', 'vd'] : ['vd'];   // altes Aussehen (render.js:927)
… deck(): glLive(p.x, p.y, l, u + up, r, d, f) … if (rF) rF[1] -= up;
if (rBU) bkRedo(…, rBU, vd, null, false, c); if (rUb) bkRedo(…, rUb, vd, null, !c.water, c); bkRedo(…, rAll, ['o'], G && G.front, false, c); glass → bkGroup(…, [gr], c)
// render.js:921/1322
function drawBridgeOver(k, z, now, rect = null) {
  const t = state.tiles.get(k); if (!t) return; const [x, y] = keyXY(k), p = toScreen(x, y);
  if (t.b === 'schiene') return drawRailBed(p.x, p.y, z, x, y, t);
  const c = wbAt(x, y); if (c) bkRedo(x, y, p.x, p.y, z, now, rect || [-1e9, -1e9, 1e9, 1e9], c.A ? ['vd', 'o'] : ['h', 'vd', 'o'], null, false, c);
}
function bridgeOverBoat(k, z, now, m = null) {
  if (isWegBridge(state.tiles.get(k))) return drawBridgeOver(k, z, now, m && bkMoverRect([m], z));   // bkRedo hat eigene Zellen (B2 Fehler 1)
  … Schiene wie bisher (70·z) …
}
// render.js:1331 boatUnder
const kx = Math.round(m.px), ky = Math.round(m.py), done = (bx, by) => bx + by < kx + ky || (bx + by === kx + ky && bx < kx);   // Maler-Folge
… && !bkAt(bx, by) && (!isWegBridge(state.tiles.get(bx + ',' + by)) || done(bx, by))
```
- `BRIDGE_FRONT` fällt weg (draw-objects.js:971, :973, render.js:927). Im Aufruf von `archWall` bleibt `!on('h')`.
- Block 112 (render.js:2198–2200) bleibt für Schienen und für die seltenen früheren Wegbrücken-Felder.

**D1f (optional) Fußpunkt** (Normal)
- Rechnung wie `brLiftAt`: `wbAt(round(px + FOOT_D), round(py − FOOT_D)) || wbAt(round(px), round(py))`.
- Ändert auch Bögen um bis zu etwa 3 px. Entscheiden nach dem Prüfbild.

## 2. Fallen

| Bereich | Falle | Maßnahme |
|---|---|---|
| Leistung | Weit weg 3 statt 1 Bildchen je Feld (neu 80 → 240 Leinwände, bruecken 102). ops steigen bei z 0,45, 0,8 und 1,2 um 2 je sichtbarem Feld. | `leistung:neu` mit Begründung, iPad-Speicher prüfen. |
| Leistung | Nah läuft der Vorlauf von `drawWegBridge` 3× je Feld. | Messen. Bei Bedarf in `bkGroup` für `c.water` alle Lagen in einem Aufruf. |
| Leistung | GL: +1 Zelle (o) je Feld mit Figur, +2 mit Boot. `bkRedo` öffnet die volle Gruppenbox. | Optional die Zelle auf R verkleinern (gilt auch für B2). |
| Leistung | Gewinne: In „neu“ wird `liveFlatSet` leer, die Bodenschleife entfällt. Kein verworfenes Hintergrund-Standbild (gl.js:738). Kein lit-Doppel. | Mit `?messen` nachweisen. |
| Bildchen | Schlüssel `wb|x,y|gr|F`, Fassung `groundVersion`, ohne lit und ohne prewarm. tileB legt nie ein neues an, weil tileA schon alle drei gemalt hat. | Tests: `glows.length === 0` und `made === 0` (wie bruecken-reihenfolge:86). |
| Bildchen | Seitlich reicht der Belag bis 37,1, der Rahmen bis 38. Die Rückwand bei `depth` liegt weit außerhalb, aber im Clip. | Rahmen-Test mit Clip-Tiefe (§3). |
| Bildchen | Alte `arch|`- und `flat|`-Bildchen verfallen von selbst (spriteHousekeeping). | – |
| GL | `bridgeOverBoat` darf für Wegbrücken keine äußere Zelle öffnen. Die 70·z-Zelle entfällt; sie schneidet heute bei N 16 ab. | GL-Test „Tiefe 1“ (§3). |
| Ufer, Rampe | Zaun oder Hecke an der Uferkante des Brückenfelds liegt jetzt unter der Rampe (richtig). | Prüfbild. |
| Ufer, Rampe | Nah deckt die Brücke am +Ende den Landweg um etwa 1,5 Gerätepunkte (`pd`, :1016). Schlagschatten liegen nah jetzt unter der Brücke. | Prüfbild, erwartet. |
| Ufer, Rampe | Höhe der Figur an der Rampe: dieselbe `flatDeckH` wie der Maler, also kein Sprung. | Test D1d. |
| Breite Brücken | Innere Reihen ohne o bzw. h (`latF`, `latB`). Die Reihenfolge bleibt wie im Boden-Durchgang. | Szenen breit 3 in jedem Test. |
| Gleisbrücken | Bleiben unverändert in `liveFlatSet`, Boden-Durchgang, `spriteFlat`, `drawBridgeOver`-Zweig, 70·z und `boatUnder` ohne Filter. | Nur über `isWegBridge` verzweigen. Tests: webgl mit Schiene drin, schiffe-bruecken:126–137. |
| Nacht | Ein Schein auf einem früheren Feld (Laterne, Kristallweg) wird von der Brücke verdeckt. So ist es heute schon bei Bögen und Häusern. | Prüfbild. Abhilfe nur bei Bedarf wie `hillRelight`. |
| Nacht | `GLOW_MUTE 'pane'` wirkt erst ab D2. | – |
| Wege-Muster, Belag | Das Muster ist weltverankert (`x, y`) in d. `pd` hängt an `getTransform`, im Bildchen also anders als live (wie heute). | Weit weg mit Toleranz vergleichen. |
| Wege-Muster, Belag | Alle Setzer erhöhen `groundVersion` (rules.js:2072, recalc :829). | – |
| Durchsicht | `bkFadeNow` liefert bei Durchsicht immer true. | `!c.water` (zwei Stellen). |
| Vorschau | Plan-Rauten liegen ab D1b unter dem Deck. | D1c. |
| Vorschau | Hover- und Abriss-Rahmen auf einem Feld liegen unter dem Deck, wie heute bei Bögen. | Frage 1. |
| Altdaten | Wasserbrücke unter einem Anhöhen-Deck. | `under`-Rückruf (D1b). |
| Altdaten | Veraltetes COVER. | `bw` im else-Zweig. |
| Cache | `wbCache` bleibt alt, wenn `recalc` in `BATCH` nur `bridgeArchCache` zurücksetzt. | `wbCache.v = -1` in recalc. |
| Werkzeuge | `wasserbruecken-entwurf.js:65` (`BRIDGE_FRONT`, alte Signatur) und `bogen-anhoehe-entwurf.js:42/55` brechen. | D0-Bilder liegen schon vor. D1b passt bogen-anhoehe an, D0 bekommt einen Kopfvermerk „bis acc7d9a“. |
| G6 | Eine Figur ab a > 0,41 wird vom Deck des Folgefelds überdeckt (wie Bögen heute). | Offen lassen. |
| Boot vorn | Ein Boot mit s > 0,36 ist neu F, liegt also über der Brücke (wie C10). | Prüfbild, erwartet anders. |
| Altversion | D1 fasst weder `tileOut`, `parseSave` noch Preise an. | Prüfen, dass der Diff state.js und rules.js-Preise nicht berührt. |

## 3. Tests zuerst (Skizzen)

**D1a**, `tests/wasserbruecken-lagen.test.js`
```js
const rec = js => game(`(() => { const g0 = g, out = [];
  g = new Proxy({ getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), createPattern: () => ({ setTransform() {} }) }, {   // wie setup.js:22/26
    get: (o, k) => k in o ? o[k] : (...a) => out.push(k + ' ' + a.map(v => typeof v === 'number' ? v.toFixed(3) : v) + ' ' + o.fillStyle + '|' + o.strokeStyle + '|' + o.lineWidth),
    set: (o, k, v) => { o[k] = v; return true; } });
  try { ${js} } finally { g = g0; } return out; })()`);
// 4 Arten × {1 Feld, Steg ±, Bogen 3/6/16, breit 3 (jede Reihe), Nord-Süd} × z 0,5/1/2,5
expect(rec(`for (const L of [['h'],['v','d'],['o']]) drawWegBridge(0,0,${z},${x},${y},T,L)`)).toEqual(rec(`drawWegBridge(0,0,${z},${x},${y},T)`));
expect(rec(`drawWegBridge(0,0,${z},${x},${y},T,['v','d','o'])`)).toEqual(rec(`BRIDGE_FRONT=true; try { drawWegBridge(0,0,${z},${x},${y},T) } finally { BRIDGE_FRONT=false }`));   // bis D1e
```
- **Rahmen:** Proxy mit Clip-Tiefe (save, clip, restore). Gezählt werden moveTo, lineTo und fillRect samt `lineWidth/2`, nur ohne aktiven Clip; die Clip-Pfade selbst zählen. Alles muss in `brBox(gr, wbAt(x,y))·z` liegen.
- **`wbAt`:** null für Landweg, Schiene und leeres Feld. `ax`, `A`, `hm`, `landA` und `landB` stimmen. `wegDeckH` gleicht der alten Formel von :985.
- **Durchsicht:** Mit gesetzter Durchsicht malt `bkGroup(…, wbAt)` mit `globalAlpha` 1. `spriteBridge(…, 'vd', wbAt)` legt `wb|x,y|vd|0` an. Die B2-Tests bleiben grün.

**D1b**, `tests/wasserbruecken-reihenfolge.test.js`
- Szene wie im Bericht „tests“ 2c (Kanal, beide Achsen, Holz, Stein, Ziegel, Rot, N 1/3/6, Steg, breit 3).
- Spione:
  - `drawEdgesAt` → `'A x,y'`
  - `bkDrawLagen = (x, y, px, py, z, gr, ...r) => { log.push(gr + ' ' + x + ',' + y + (FOG ? ' fog' : '')); return bl(x, y, px, py, z, gr, ...r); }`
  - `drawWegBridge` → `'wb'`
- Erwartungen:
  - Je Feld genau h, vd, o, nach dem eigenen `A` und vor dem nächsten. Vor dem ersten `A` kein `wb`.
  - FOG gilt bei einem fremden Feld.
  - Rückfall: `state.tiles.set` ohne `rebuildCover`, dazu ein roh gesetztes Anhöhen-Deck darüber.
  - Weit weg: Schlüssel `wb|…|h|vd|o`, Fassung `groundVersion`, keine glows, kein `arch|` oder `flat|`, im zweiten Bild `made === 0` (nach bruecken-reihenfolge:86–97).
- **webgl.test.js:39:** In `brute` kommt `&& !isWegBridge(t)` dazu. Erwartet `[false, true]` für `'3,3'`, dazu ein Schienenfeld, das drin bleibt.
- **bruecken.test.js:107:** um `liveFlatSet` ohne Wegbrücken erweitern.

**D1c**
- Linienplan (Umfärben) über eine flache Brücke: Die Raute des Felds kommt nach dessen `o`.
- `dia` hebt sie um `wegDeckH` an.

**D1d**
- `wegBridgeLift(10, 12)` ergibt Holz 3, Stein 7, Ziegel 7, Rot 8.
- `(10.45, 12)` ergibt `L·0,05/0,3`. `(10.6, 12)` ergibt 0. Am Steg-Ende genau L.
- `brk: 'metall'` fällt auf Holz zurück und wirft nicht.
- `glMoverBox(fig)[1]` ist `(60 + L)·z`. bogenbruecken:43–44 bleibt grün.

**D1e**
- Reihenfolge:
  - Figur auf dem Deck: `vd` (tileA) < fig < `o`.
  - Boot darunter, flach: fig < h, vd < o. Beim Bogen: fig < vd < o.
  - Boot mit s = +0,45: danach nichts.
  - FOG beim Nachmalen ist `!ownedTile`, bei Figuren false.
- `boatUnder`:
  - Boot bei `(11, 12.3)` → `null`. Das eigene Feld übernimmt `bkDrawMoving`.
  - Boot bei `(11, 11.4)` → `null`. `11,12` kommt später dran.
  - Brücke 2 Reihen breit, Boot bei `(11.6, 12.4)` → `['11,13']`.
- GL ohne Verschachtelung:
  ```js
  GLPASS = true; glLive = (x, y, l, u, r, d, f) => { dep++; max = Math.max(max, dep); try { f(); } finally { dep--; } };
  bridgeOverBoat('10,12', 1, 1e6, boot);   // erwartet max === 1
  ```
- `drawBridgeOver('10,12', 1.5, 1e6)` ohne Rahmen bleibt aufrufbar (bogenbruecken:50). schiffe-bruecken:126–137 bleibt unverändert.
- `typeof BRIDGE_FROT === 'undefined'`.

## 4. Prüfbilder (`tools/wasser-d1-pruefung.js`, Browser, nacheinander)

- **Stellen:**
  - Aus `brueckenpruefung.js:8–11`: Wasser 1/2/3/6/9/16, Steg, breit 2–4, Nord-Süd.
  - Freizeitpark: Stein-Steg `24–26,12`.
  - og: flache Holzbrücken und Gleisbrücken als Kontrolle.
  - neu: Bögen und Ziegel.
- **Eingefroren:**
  - `syncMovers = () => {}`, feste Zeit, `nightAt` und `gameHour`, `spriteForce`.
  - Boote über `shipMovers`, Figuren angepinnt.
  - Gleiche Fenstergröße und gleiches DPR. `npm run bump` vor jedem Lauf.
- **Spalten:** Tag/Nacht × {z 2,4 live; z 0,8 Bildchen ohne GL; z 0,6 mit GL} × {leer; Boot in der Mitte, bei s −0,45 und bei s +0,45; Figur in der Mitte, auf der Rampe, an der Feldkante, breit}.
- **Ablauf:** vorher (D1·0 auf HEAD), nachher nach D1b und nach D1e. Vergleich mit `getImageData`, gezählt werden Bildpunkte mit Δ > 8, dazu ein Wärmebild (Muster stufe3-pruefung.js:122–151).
- **Erwartet Δ = 0:** Nah ohne Bewegtes und ohne Nachbarn, Bögen nah, alle Gleisbrücken, GL gegen 2D im Nachher-Lauf.
- **Erwartet klein:** weit weg (andere Rahmen, also andere Teilpunkt-Phase), Kantenglättung am Ausschnitt.
- **Erwartet anders** (eigenes Blatt):
  - Figuren flach 3, 7 bzw. 8 px höher und hinter dem vorderen Geländer.
  - Boot vorn über der Brücke.
  - Zaun am −Ende, Naht am +Ende, Schatten nah.
  - Laterne vor dem −Ende nachts.
  - Plan-Rauten.
  - Fremdes Feld mit Boot im Nebel.
- **GL mit `?messen`:**
  - Wasserbrückenfelder ohne Bewegtes sind nicht dyn.
  - Kamerazug (`glBgStep`) ohne Verwerfen.
  - Frisch ohne Bildchen (`resetDrawCaches`).
- **iPad:** Speicher in „neu“ weit weg.

## 5. Fragen an den Nutzer

1. **Rahmen auf flachen Brücken:** Hover- und Abriss-Rahmen liegen nach D1 teilweise unter dem Deck, wie heute schon bei Bögen. Sollen sie in D1c gleich mit aufs Deck? Empfehlung: ja, nur der Einzelfeld-Rahmen, ein kleiner Zusatz.
2. **Boot unter flacher Brücke:** D1 behält das alte Bild, das hintere Geländer liegt über dem Boot. Bei Bögen und Anhöhen liegt das Boot vor dem hinteren Geländer. Soll D2 das vereinheitlichen? Empfehlung: in D2 per Bild entscheiden.

Aufwand je Schritt: D1·0 Normal, D1a Hoch, D1b Hoch, D1c Normal, D1d Normal, D1e Hoch, D1f Normal.

Die Dateien, um die es geht:
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/tests/webgl.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bogenbruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/schiffe-bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung.test.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasserbruecken-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/stufe3-pruefung.js

---

## Gegenprüfung: Code

**Prüfergebnis D1-Baukarte (gegen `acc7d9a`)**

Fast alles stimmt mit dem Code überein: Zeilen, Namen, Signaturen, die Lagen-Tabelle, `BRIDGE_FRONT` = v+d+o, W1–W10, `done` passt zur Reihenfolge von `visibleTiles` (render.js:1593–1601), die Rahmenwerte 37,1/38 und die Testverweise. Folgende Fehler und Lücken sind im Code belegt:

**1. `c` wird nicht bis zum Maler durchgereicht (schwer).** Die Karte gibt `c` nur in `bkGroup` weiter. Zwei Aufrufe fehlen:
- brueckenbild.js:191: `make()` in `spriteBridge` ruft `bkDrawLagen(x, y, 0, 0, zs, gruppe)`. Die Vorgabe `bkAt` liefert null, das Bildchen bleibt leer. Weit weg verschwinden damit alle Wasserbrücken.
- brueckenbild.js:231: `bkRedo` ruft `spriteBridge(x,y,px,py,z,gr)` und `bkDrawLagen(…, gr)` ohne `c0`. Weit weg gibt das mit dem Schlüssel aus der Karte (`c.water` bei c = null) einen TypeError, nah wird nichts nachgemalt.
- Korrektur: `bkDrawLagen(x, y, 0, 0, zs, gruppe, c)` und in `bkRedo` `spriteBridge(…, gr, c0)` / `bkDrawLagen(…, gr, c0)`.
- Die Tests D1a/D1b prüfen nur, ob der Schlüssel existiert. Ein Spion, der `drawWegBridge` in `make` zählt, sollte dazu.

**2. brueckenbild.js:255 fehlt in der D1e-Liste.** `if (rB) bkRedo(…, rB, ['h'], G && G.under)` bekommt kein `c`. Auf dem Wasser sind in B nur Tiere, der Absturz aus Punkt 1 tritt also auf, sobald ein Tier hinter dem Deck fliegt.
- Korrektur: `…, G && G.under, false, c)`.

**3. Tiere liegen künftig unter dem Deck.** `bkMoverClass` teilt `critter` nach der Querlage s ein (brueckenbild.js:207–209).
- Auf Wasserbrückenfeldern gibt es nur fliegende Tiere: Fisch, Frosch, Robbe und Eisvogel sind durch `built` gesperrt (movers.js:1089/1094/1099).
- Was dort fliegt, ist höher als das Deck (3–8): Schmetterling h 6–12 (:1165), Vogel ab 20 (:1169), Möwe etwa 30 (:1171). Möwen erscheinen auch an Stegen, weil :1093 nur `bkAt` sperrt.
- Heute liegen sie über der Brücke. Mit D1e malt U `vd` (flach `h`+`vd`) über sie.
- Korrektur für das alte Aussehen: `if (c.water && m.critter) return 'F';` in `bkMoverClass` oder in `bkDrawMoving`. Test: Schmetterling auf dem Deck, kein `bkRedo`.

**4. Block 112 fehlt im Weg über `bkDrawMoving` (:267).**
- Fall: Ein Boot steht auf seinem eigenen Wasserbrückenfeld, `m.under` ist ein früheres Feld (Beispiel der Karte: (11.6, 12.4) → `'11,13'`).
- Dann malt `bkRedo` `h|vd|o` im Bootsrahmen über Figuren, die tileB von 11,13 schon gezeichnet hat. render.js:2198–2200 malt sie heute danach wieder drüber, :267 nicht.
- Die Aussage „Block 112 bleibt für … frühere Wegbrücken-Felder“ stimmt also nur, wenn das Feld des Boots keine Brücke ist.
- Korrektur: Die Schleife aus 2198–2200 als Hilfsfunktion herausziehen und bei :267 nach `bridgeOverBoat` aufrufen. Test in D1e.

**5. Tippfehler im Test.** `typeof BRIDGE_FROT === 'undefined'` ist immer wahr. Richtig: `BRIDGE_FRONT`.

**6. Die Figurenhöhe fehlt auch beim Antippen.** `walkerHead` (movers.js:305–307) benutzt `wegBridgeLift` nicht. Darüber laufen Antippen (`walkerAt` :335) und Sprechblase (`drawBubble` :311).
- Nach D1d liegen flache Brücken damit 3–8 px daneben. Bei Bögen ist es heute schon bis etwa 70 px.
- Die Karte nennt nur movers.js:370 und gl.js:554.
- Korrektur (optional, D1d): wie :370 `+ wegBridgeLift(w.px, w.py)`, wenn `figUp == null && !w.seat`.

**7. Altdaten mit beidem (`bc && wc`, D1b).** Der `under`-Rückruf ruft das volle `bkDrawStill(…, wc, null)`. Das malt die Deko des Felds (`bkDecoGroups`, brueckenbild.js:148–155) und `DECK_MARKS.get(k)` (:156) ein zweites Mal; die halbdurchsichtigen Rauten werden dadurch dunkler.
- Korrektur: Im Rückruf nur `bkGroup(…, ['h'], wc); bkGroup(…, ['vd','o'], wc)`.

**8. tools/bogen-anhoehe-entwurf.js:44–53.** Die Attrappe malt ihre Stützen (:47–52) bei jedem Aufruf. Bei drei Lagen-Aufrufen landen sie im `o`-Aufruf über dem Deck.
- Korrektur: Signatur `(cx, cy, z, x, y, t, lagen)`, Stützen nur bei `!lagen || lagen.includes('h')`, dann `o.dwb(…, t, lagen)`.
- Außerdem schneidet `bkRedo` hier mit `c.hm` ohne `HILL_H`. Mit Bewegtem wird dort also 26 px zu niedrig nachgemalt (betrifft nur das Werkzeug).

**9. „Boot vorn“ (§2) beschreibt das Heute falsch.** Schon heute liegt ein Boot auf seinem Feld über der Brücke, sobald Längs- plus Querversatz > 0,3 ist (render.js:1331 `bx + by >= m.px + m.py - 0.3`).
- Was sich wirklich ändert: Mittig liegt ein Boot mit 0,3 < s ≤ 0,36 neu unter der Brücke, und der Längsversatz zählt nicht mehr.
- Das Blatt „Erwartet anders“ sollte das so beschreiben.

**10. Zeilenangaben.**
- `bridgeArchCache` steht in rules.js:1875 (nicht :1872).
- `postAs`/`archCenters` in draw-objects.js:989 (nicht :991).
- Die `PLAN_GHOST`-Bedingung in render.js:2149 (nicht :2148).
- `brute` in webgl.test.js:40 (nicht :39).

## Gegenprüfung: Risiko

Die Karte geht im Großen und Ganzen auf. Ich habe trotzdem sechs echte Fehler bzw. Lücken im Code gefunden, dazu zwei kleine Punkte zu Leistung und Test. Am wichtigsten sind Nr. 1 und Nr. 2. Den Rest habe ich gegengerechnet, und er stimmt: Lagen-Zerlegung = Original (v + d + o = `BRIDGE_FRONT`), Rahmen 38/40+hm/22, Lebensdauer der Bildchen im GL-Standbild (`GLS.ents`), Reihenfolge im GL-Abspielen, FOG.

**1. Tiere auf Wasserbrücken-Feldern werden übermalt (neu gegenüber heute, flach und Bogen)**
- Tiere ohne Fell bleiben in D1e in `ms`. `bkMoverClass` (brueckenbild.js:204–208) stuft sie bei |s| ≤ W als U ein.
- Danach malt `bkRedo` die Lagen h und vd in ihrem Rahmen nach (:257). Deck und hinteres Geländer liegen dann über ihnen.
- Betroffen:
  - Schmetterlinge (h 9–12 über einer Deckhöhe von 3–8),
  - Vögel,
  - Möwen: natureAt (movers.js:1093) schließt nur Anhöhen-Brücken aus, nicht Wasser-Wegbrücken.
- Sie gelangen über byTile hinein (render.js:1858). Heute liegen sie immer über der Brücke.
- Korrektur:
  ```js
  if (c.water) { const a = m => c.ax ? m.py - y : m.px - x;
    const on = ms.filter(m => (m.fur && !m.critter) || (m.critter && (m.h || 0) >= wegDeckH(c, a(m)) && bkMoverClass(m, c, x, y) === 'U')); … }
  ```

**2. `c` muss auch an zwei weiteren Stellen innen durchgereicht werden**
- Die Karte nennt dafür nur die Signaturen. Diese beiden Aufrufe fehlen:
  - brueckenbild.js:191: `make()` ruft `bkDrawLagen(x, y, 0, 0, zs, gruppe)` auf. Die Vorgabe `bkAt` liefert null, die Funktion bricht ab, und das Bildchen bleibt leer. Weit weg wären dann alle Wasserbrücken unsichtbar.
  - :231 (bkRedo): `spriteBridge(x, y, …, gr)` ohne `c` führt beim neuen Schlüssel `c.water` auf null zu einem TypeError. Das passiert bei jedem Boot oder jeder Figur auf einer Wasserbrücke, sobald Bildchen an sind.
- Korrektur: `bkDrawLagen(x, y, 0, 0, zs, gruppe, c)` bzw. `spriteBridge(…, gr, c0)` und `bkDrawLagen(…, gr, c0)`.
- Die Tests der Karte fangen das nicht:
  - Der Spion auf `bkDrawLagen` schreibt ins Protokoll, bevor er weitergibt.
  - Die Weit-weg-Prüfung sieht nur Schlüssel und `made` an.
- Besser zählen, wie oft beim Anlegen der Bildchen `drawWegBridge(…, lagen)` aufgerufen wird: im ersten fernen Bild 3 × Anzahl der Wasserbrücken-Felder.

**3. Block 112 fehlt, wenn das Boot selbst auf einem Wasserbrücken-Feld steht**
- Die Karte sagt: „Block 112 bleibt für Schienen …“. Ein Boot auf einem Wasserbrücken-Feld läuft nach D1e aber durch `bkDrawMoving`. Dort ruft :267 `bridgeOverBoat` ohne die Neuzeichnung aus render.js:2198–2200 auf.
- Folge: Figuren auf früher gezeichneten Wasserbrücken-Feldern und Züge auf früheren Gleisfeldern in `m.under` werden übermalt. Beispiel ist der Kartentest selbst: Boot (11,6 | 12,4), Feld 12,12, `under` = 11,13.
- Korrektur: Block 112 als Hilfsfunktion herausziehen und an beiden Stellen aufrufen. Für Wasserbrücken gilt dabei: erst h+vd nachmalen, dann die schon gezeichneten Figuren, dann o.

**4. Bootsgrenze verschoben, und die Erwartung im Prüfbild ist falsch**
- Heute gilt: Das eigene Feld ist nur bei `bx+by >= px+py−0,3` in `under` (render.js:1331). Bei ganzzahliger Querlage liegt das Boot also schon ab s > 0,3 über der Brücke.
- Neu liegt es erst ab s > W = 0,36 darüber. Bildpunkte ändern sich nur im Band (0,3; 0,36].
- Bei s = +0,45 ist Δ = 0 zu erwarten, nicht „anders“.
- Korrektur für gleiches Bild: in `bkMoverClass` für Boote `> (c.water ? 0.3 : W)`.

**5. Tippfehler im D1e-Test**
`typeof BRIDGE_FROT === 'undefined'` ist immer wahr. Richtig ist `BRIDGE_FRONT`.

**6. Füße verdeckt auch am −Ende, nicht nur zwischen den Brückenfeldern (G6)**
- Eine Figur auf dem Landfeld vor der Brücke wird vor deren tileA gezeichnet.
- Die Füße werden 6·z nach rechts versetzt gezeichnet (FOOT_D, movers.js:290). Ab a′ > 0,41 liegen sie damit auf der Rampe des Brückenfelds und werden überdeckt. Das sind etwa 2–3 px bei z 1 und etwa 5 px bei z 2,4, bei jeder Überquerung.
- Für flache Brücken ist das neu, und die Karte nennt nur die Naht im Landweg am +Ende.
- Abhilfe wie bei B2 (render.js:1888–1890): `m.fur` in das spätere Feld unter den Füßen legen, wenn `wbAt(round(px+FOOT_D), round(py−FOOT_D))` existiert. Das löst G6 an beiden Stellen.

**7. Leistung, klein**
- tileA ruft jetzt für jedes sichtbare Feld in jedem 2D-Bild `wbAt(x, y)` auf, also eine Verkettung plus einen Map-Zugriff.
- Besser: `const t0 = a0 === k ? t : state.tiles.get(k), wc = isWegBridge(t0) ? wbAt(x, y) : null` (render.js:2030), oder `k` mitgeben.

**8. Falle im Rahmen-Test**
- archWall baut bei draw-objects.js:1076 einen ±1e5-Rahmen als Clip-Pfad, während schon ein Clip aktiv ist.
- Die Regel „die Clip-Pfade selbst zählen“ würde daran scheitern. Gezählt werden dürfen nur Pfade bei Clip-Tiefe 0.

Ich habe nur gelesen und nichts geändert. Die Dateien, um die es geht:
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js