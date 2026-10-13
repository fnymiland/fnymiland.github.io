# D2 Baukarte: Wasser-Wegbrücken, neue Modelle über `brLook`/Anker

**Stand:** `0b28f98` („160c D1 Gegenlesen: Nachtlicht früherer Felder auf Wasserbrücken“, 13.10.2026). Ich habe nur gelesen und nichts geändert, ausgeführt oder getestet.

**Grundlage:**
- D0-Abnahme (AUFGABEN.md:2715).
- Abgenommene Fassung: `tools/wasserbruecken-entwurf.js` (Maler :62–109, Raster :112–262). Dazu die Bilder `tools/vorschau/wasser-*.png`, `wasser-alt.png` eingeschlossen.
- PLAN-160c.md:622–628 (D2, Ultracode). D3 (:630–634) und D4 (:636–638) gehören **nicht** dazu.

**Zeilenangaben:**
- Die drei Berichte nennen Zeilen von `7dbd285`. Mit `0b28f98` kam `wbRelight` dazu.
  - brueckenbild.js: ab der alten Zeile 159 **+31**.
  - render.js: ab etwa :1649 und :2023 je **+1**.
- Diese Karte nennt die Zeilen von `0b28f98`.

## 0. Widersprüche zwischen den Berichten, im Code entschieden

| # | Streitpunkt | Befund im Code | Entscheidung |
|---|---|---|---|
| W1 | Skizze karte-D0 §3 oder Entwurfsdatei | Die Datei hat keine `afterMovers`, kein `oB` in `sup`, kein `t1 + 1e-6`. Sie hat aber `flachV`, `endPost` und `OPT.kanteAb` (wasserbruecken-entwurf.js:9–10, :70, :78, :84–90). | **Die Datei gilt.** `t1 = tc + 0.5` ohne Zuschlag. |
| W2 | Ufer: `span()` nur über `terrainAt` (Entwurf :21) oder die Regel aus `wbAt.land` mit Kachel (rules.js:1894) | Der alte Maler verlangt eine Kachel (draw-objects.js:982), die Figuren gehen über `wegDeckH` (rules.js:1900). | **Regel aus `wbAt.land`**, auch an den Spannenenden. Sonst zeichnet der Maler eine Rampe, auf der die Figuren nicht stehen (G8). Eine Wirkung hat das nur an einem Landende ohne Weg. |
| W3 | `foot` als Zahl (Bericht „entwurf“, Feld `c.G`) | `bkPaintFuss` ruft `opts.foot(k)` (brueckenbild.js:349). | **Funktion** `() => WB_WATER`, wie im Entwurf :82. |
| W4 | Stützen über dem Boot: `ex = { supports: [] }` („entwurf“) oder `BK_START_CUT` („zeichnen“) | `bkRedo` malt aus Bildchen nach (brueckenbild.js:266). Die Bildchen enthalten die Stützen, also kann `supports: []` dort nicht greifen. | **Schnitt wie C10** (brueckenbild.js:259–262), aber nur, wenn das Feld eine Stütze an der Anfangskante hat (`G.startPost`). **Nie bei Stein**: Die Wand liegt ganz vor dem Boot. Ob das Bild passt, klärt Frage 2. |
| W5 | Lampen-Grenze: `BRIDGE_MAX` 16 („entwurf“), echte Länge („zeichnen“), Parameter („daten“) | `n` ist mit den virtuellen Feldern bis 18 lang. `back`, `front`, `up`, `s` und `form` hängen nicht von `n` ab (brueckenfamilie.js:298–308). | Parameter `max` an `brLampSpots`; auf dem Wasser `max = G.n`. Er wird nur in `bkLamps` gebraucht (`opts.lampMax`). `brBox` und `bkLampGroups` bleiben, wie sie sind. `BK_READ_MAX` bleibt unverändert (bruecken.js:17). |
| W6 | Liste für tileB (Kristall): eigene Liste („entwurf“) oder im Scan von `liveFlatSet` („zeichnen“) | `liveFlatSet` hat eigene Bedingungen (COVER, `tiles.size`, render.js:86–96). | **Eigener kleiner Speicher** `wbLiveSet()` neben `brLiveTiles` (bruecken.js:57). Inhalt: Kristallfelder mit `!latF || lastB`. |
| W7 | `|lit` für Gruppe `w`: als Sonderfall („entwurf“) oder über Überschneidung der Lagen („zeichnen“) | `bkLampGroups` liefert nur `vd`/`o` bzw. `h`/`t2`, nie `w` (brueckenbild.js:66–67, :220). | **Überschneidung:** `w` bekommt `|lit`, wenn eine Lampen-Gruppe außer t1/t2 dabei ist. An der Anhöhe ändern sich die Schlüssel dadurch nicht. |
| W8 | `hg` bei Kristall: eigenes `bkGroup(['hg'])` davor („entwurf“) oder in `w` („zeichnen“) | Der `w`-Zweig :149 überspringt `bkGlasAt` (:152). | **`hg` steckt in `w`**, also ein Bildchen je Feld. Ein zweites bräche „bruecken 0,8“ (+106 bei +79 Spielraum, Schätzung „zeichnen“). `w` wird nie nachgemalt. |
| W9 | Flache Rot-Brücke von 8 auf 3 „nicht abgenommen“ („daten“) | `altBlatt` zeigt „Rot · 1“ (flach) mit `LIFT[art]` = Holz 3 (Entwurf :239–250, :9, :69). Grund: `brLegacyLook` macht Rot zu Holz (brueckenfamilie.js:61). | **Im Bild abgenommen.** Die Figuren gehen über `c.lift` mit (G8). Im Prüfbild steht das unter „Erwartet anders“, eine Frage ist nicht nötig. |
| W10 | Unterkante des Rahmens: „etwa 4“ („zeichnen“) oder „etwa 20, knapp“ („entwurf“) | Die Unterkante liegt bei 22 (brueckenbild.js:18). Anfangskante: (−0,5+0,36)·16+6,3 ≈ 4. Endkante: 0,86·16+6,3 ≈ 20,1, mit halber Strichbreite 21,2 (`endPost`). Holz-Bogenträger ohne Klemmung: 13,8+9,2 = 23. | **Beide stimmen.** `P` klemmt auf `WB_WATER` (Entwurf :75), und zwar nur `P`, nicht `Pw`. |
| W11 | Asphalt-Streifen | Die Belag-Kopie im Entwurf (:26–38) hat kein `lk.dash` (draw-objects.js:1027). | **Gemeinsame Funktion samt Streifen.** So bleibt alles wie heute, D0 hatte keinen Asphalt. |
| W12 | Handlauf quer am +Ende bei Kristall: in `o` oder in `t2` | Entwurf `vorn()`: zuerst o, dann t2, dann quer (:97–100). | Kristall: **in `t2`**, das passiert in tileB. Alle anderen: in `o`. |
| W13 | Farben von `quer()` fest verdrahtet (Entwurf :58) | Die Farben sind `BK_FUSS.holz.rail`, `BK_FUSS.stahl.steel` und `BK_FUSS.kristall.rail` (brueckenbild.js:287–289). | **`brPal`.** Ohne Farbwahl ist das pixelgleich, Rot bekommt einen roten Handlauf wie im alten Maler (draw-objects.js:1047). |

## 1. Schritte

Jeder Schritt läuft so ab:
1. Test zuerst.
2. `npm test` (maxWorkers 4).
3. `npm run bump`.
4. Commit auf dem Branch, kein Push.

Prüfbilder laufen nacheinander, nie parallel. Bis D2j schaltet `WB_NEU` (eine Menge der Materialien, die schon neu gemalt werden) je Material um. So ist jeder Schritt für sich spielbar.

**D2·0 Prüfwerkzeug und Vorher-Bilder** (Normal)
- Neues Werkzeug `tools/wasser-d2-pruefung.js` (§4). Am Spiel ändert sich nichts.
- Vorher-Bilder auf `0b28f98` aufnehmen.

**D2a Gerüst `c.G`, nichts Sichtbares** (Hoch)
```js
// rules.js:829 recalc: … wbCache.v = -1; if (typeof brSpanCache === 'object') brSpanCache.v = -1; …   // Seewege nie mit altem Aussehen
// rules.js bei flatDeckH (:1884)
const BR_WATER_LIFT = { holz: 3, stein: 7, stahl: 3, kristall: 3 }, WB_WATER = -0.7 * DEPTH;   // Entwurf :8–9
let WB_NEU = new Set();                                                 // D2c–D2g: Materialien mit neuem Maler; D2j entfällt
const wbLandAt = (px, py) => { const n = state.tiles.get(px + ',' + py); return !!n && !isWegBridge(n) && terrainAt(px, py) !== 'water'; };
function wbSpan(x, y, ax) {                                             // wie bridgeArchCalc :1915–1918, Ufer wie wbAt (W2)
  const dx = ax ? 0 : 1, dy = ax ? 1 : 0, at = i => state.tiles.get((x + dx * i) + ',' + (y + dy * i));
  let i0 = 0, i1 = 0; while (i0 < 60 && isWegBridge(at(-i0 - 1))) i0++; while (i1 < 60 && isWegBridge(at(i1 + 1))) i1++;
  return { i0, N: i0 + 1 + i1, landA: wbLandAt(x - dx * (i0 + 1), y - dy * (i0 + 1)), landB: wbLandAt(x + dx * (i1 + 1), y + dy * (i1 + 1)) };
}
function wbGeom(x, y, A, ax) {                                          // Entwurf maler() :64–83, je groundVersion gemerkt
  const look = brSpanLook(x, y), mat = look.mat, art = mat === 'stein' || BK_FUSS[mat] ? mat : 'holz';
  const lat = s => isWegBridge(state.tiles.get((x + (ax ? s : 0)) + ',' + (y + (ax ? 0 : s)))), latF = lat(1), latB = lat(-1);
  let depth = 0; while (depth < 8 && lat(-depth - 1)) depth++;
  const S = A ? { i0: A.i0, N: A.N, landA: true, landB: true } : wbSpan(x, y, ax);
  const oA = !A && !S.landA, oB = !A && !S.landB, vA = oA ? 1 : 0, n = S.N + vA + (oB ? 1 : 0), i = S.i0 + vA, lift = BR_WATER_LIFT[mat];
  const hf = A ? t => archDeck(A, t + 0.5) : t => { const j = t - vA; return Math.max(0, Math.min(lift, S.landA ? lift * (j + 0.5) / 0.3 : lift, S.landB ? lift * (S.N - 0.5 - j) / 0.3 : lift)); };
  const supports = mat !== 'holz' ? [] : [...brSupports(look, S.N).map(k => k + vA), ...(oA ? [vA] : []), ...(oB ? [S.N + vA] : [])].filter(k => hf(k - 0.5) >= 2);
  const lastB = oB && S.i0 === S.N - 1;
  return { look, mat, art, fam: 'fuss', S, oA, oB, vA, n, i, t0: i - 0.5, t1: i + 0.5, first: oA && S.i0 === 0, lastB, latB, latF, depth, lift, hf, supports,
    endPost: mat === 'holz' && lastB, startPost: supports.includes(i), stone: mat === 'stein' ? BR_STONE_NONE : null, ext: S.i0 < S.N - 1 ? 0.012 : 0 };
}
// wbAt :1893–1896: G = wbGeom(x, y, A, ax); b: { ax, n: G.n }; lift = WB_NEU.has(G.mat) ? G.lift : (alt wie :1893)
```
- `BR_STONE_NONE` kommt als Konstante neben `BR_STEIN` (brueckenfamilie.js:269), Inhalt wie Entwurf :11.
- **Warum nichts sichtbar wird:**
  - `c.b.n` lesen nur `bkLampGroups` und `brBox`, beide nur mit Licht (brueckenbild.js:14, :67). Altdaten haben kein Licht, weil `brl` nur mit `brp` gilt (brueckenfamilie.js:48, :82–84).
  - Bei Kristall ruft tileB `glass` → `drawWegBridge(…, ['t1'])`, und das malt nichts (draw-objects.js:972, `on`).
- `brSpanLook` liegt in brueckenfamilie.js. Die Datei lädt nach rules.js (index.html:53/79), gebraucht wird die Funktion nur zur Laufzeit.

**D2b Schalter im Anhöhen-Maler, an der Anhöhe pixelgleich** (Hoch)
```js
// brueckenfamilie.js:298  function brLampSpots(art, fam, n, max = BK_READ_MAX) { const N = Math.min(…, max) …
//   :307 punkt: ts: grid(N >= 9 ? 1 : 2)            // F-h; Anhöhe hat N ≤ 8 (bruecke.test.js:471)
// brueckenbild.js:36  const S = brLampSpots(art, fam, n, opts.lampMax);
// bkPaintFuss: :358 for (const t of opts.endPost ? [...sup, t1] : sup) …       // Stütze vorn am Steg-Ende
//              nach :356 if (opts.endPost) vert(t1, -W + 0.06, ft(t1), hf(t1) - 0.5, L.side, 2.2);   // wie Entwurf :104 (nach den Streben)
//              :360–361 nur bei opts.rib !== false; Stahl :408–409 ebenso   // flach ohne Bogenträger (F-f) = Entwurf flachV
//              :393 if (t < t0 || tip < (opts.clear != null ? opts.clear : brClear())) continue;   // F-g
// draw-objects.js:1052 archWall(…, wall = true, brick = bridgeKind(t) === 'ziegel'); :1085 const top = …  (brick aus dem Parameter)
// aus drawWegBridge herauslösen, alter Maler ruft sie auf:
function wegBridgeBelag(t, x, y, z, ax, P, H, latB, latF, arch) { … :1015–1030 samt lk.dash … }   // W11
function wegBridgeFlatWall(P, H, side, x, y, z, lift, brick) { … :1003–1009 … }
```
- **Sichtbar:** nichts.
- **Bleibt gleich:** alle Brücken an der Anhöhe, dazu der alte Wasser-Maler.

**D2c Holz (samt Rot) im neuen Maler** (Ultracode, erster Umstieg)
```js
// bruecken.js neben bkTileArgs (:565)
function wbTileArgs(c, px, py, z) {
  const G = c.G, ax = c.ax, tc = G.i, t = state.tiles.get(c.k);
  const Pw = (a, b, h) => { const [u, v] = ax ? [b, a] : [a, b]; return [px + (u - v) * TW / 2 * z, py + (u + v) * TH / 2 * z - h * z]; };
  const sq = s => s / BK_W * (s < 0 ? (G.latB ? 0.512 : EDGE_W) : (G.latF ? 0.512 : EDGE_W));
  const P = (tt, s, h) => Pw(tt - tc, sq(s), Math.max(h, WB_WATER)), H = a => G.hf(tc + a), weg = G.mat === 'stein' || G.look.deck === 'belag';
  return { P, Pw, H, t, art: G.art, n: G.n, t0: G.t0, t1: G.t1, weg, opts: { fam: 'fuss', ax, hf: G.hf, foot: () => WB_WATER, gl: () => -1, supports: G.supports,
    ext: G.ext, col: G.look.col, plank: G.look.plank, licht: G.look.licht, dark: false, zacken: !!G.look.zacken, stone: G.stone, clear: 9, lampMax: G.n,
    endPost: G.endPost, rib: !!c.A, wegPaint: weg ? () => wegBridgeBelag(t, c.x, c.y, z, ax, Pw, H, G.latB, G.latF, !!c.A) : null } };
}
// brueckenbild.js: Folge wie Entwurf :96–109, je Lage
function wbPaintLage(lage, c, A, z) {
  const G = c.G, glas = G.art === 'kristall', stein = G.art === 'stein', face = brPal(BK_STEIN, 'stein', 'fuss', G.look.col, null).face;
  const L = (l, ex) => bkPaintLage(l, A.P, z, A.art, A.n, A.t0, A.t1, A.weg, ex ? { ...A.opts, ...ex } : A.opts);
  const wall = fr => archWall(c.A, A.Pw, A.H, WB_AS9, { side: face }, EDGE_W, z, A.t, fr, G.depth, fr, false);   // h: Rückwand, v: Wand (W1/W2 D0)
  if (lage === 'hg') { if (glas && !G.latB) L('hg'); }
  else if (lage === 'h') { if (!G.latB) L('h'); if (G.first) wbQuer(c, A, z, -0.5, false); if (stein && c.A && !G.latF) wall(false); }
  else if (lage === 'v') { if (G.latF) return; if (!stein) L('v'); else if (c.A) wall(true); else wegBridgeFlatWall(A.Pw, A.H, face, c.x, c.y, z, G.lift, false); }
  else if (lage === 'd') L('d', G.latB ? { licht: null } : null);
  else if (lage === 't1') { if (glas && !G.latF) L('t1'); }
  else if (lage === 'o') { if (!G.latF) L('o'); if (G.lastB && !glas) wbQuer(c, A, z, 0.5, true); }
  else if (lage === 't2') { if (glas) { if (!G.latF) L('t2'); if (G.lastB) wbQuer(c, A, z, 0.5, true); } }
}
function wbQuer(c, A, z, a, sicht) { … Entwurf :51–61, Farben brPal (W13) … }
// bruecken.js:579
if (c.water) { const t = state.tiles.get(c.k); if (!isWegBridge(t)) return;
  if (!c.G || !WB_NEU.has(c.G.mat)) return drawWegBridge(px, py, z, x, y, t, BK_GRUPPEN[gruppe]);
  const A = wbTileArgs(c, px, py, z); for (const l of BK_GRUPPEN[gruppe] || []) wbPaintLage(l, c, A, z); return; }
// brueckenbild.js:292  const boatMid = m => (!c.water || (c.G && c.G.startPost)) && m.boat && …;   // W4
// WB_NEU = new Set(['holz'])
```
- Der vordere Schnitt bei :299 gilt damit auch auf dem Wasser. `bkRedo` schneidet über `c0.b.ax` (:262).
- **Sichtbar** (abgenommen):
  - Stützen auf den Kanten bis aufs Wasser, „wenige“ (brueckenfamilie.js:234–245). Sie ersetzen die alten Pfähle (draw-objects.js:987–988).
  - Flach: ohne Bogenträger.
  - Steg: Abschluss quer an beiden Enden, Stütze am Ende.
  - Rot: Holz in Farbe 3 mit Planken 5 (brueckenfamilie.js:61).
  - Flache Rot-Brücke: LIFT 3 statt 8. Figuren, Plan-Rauten und `c.hm` gehen mit (rules.js:1896, :1900, :1954).
- **Bleibt gleich:**
  - Boote, `pass`, `seaCross`.
  - Bogenhöhe.
  - Stein und Ziegel, die noch im alten Maler laufen.

**D2d Stein (samt Ziegel)** (Hoch)
- `WB_NEU.add('stein')`.
- **Sichtbar:**
  - Balustrade statt Brüstung (brueckenbild.js:451–460, :489).
  - Quader statt Ziegel, über `archWall(…, brick=false)`.
  - Flache Wand über `wegBridgeFlatWall(…, false)`.
  - Laternen auf den inneren Kanten.
  - Steg: Stirn in `shade(face, −0,2)` mit Abdeckung.
- **Bleibt gleich:**
  - Mauer bis −1, Öffnungen, Gewölbe, Rückwand über `depth` (draw-objects.js:1052–1075).
  - Farbe: ohne Wahl `#d9d2c3`, Ziegel `#b5654a` = `BRIDGE_COLS[8]` (data.js:1112).
  - Belag und Muster je Kachel, über `t.style`.

**D2e `wall`/`pass` aus dem Aussehen** (Hoch)
```js
// rules.js:1921  wall: brSpanLook(x, y).mat === 'stein'     // Maler und Boote aus einer Quelle (PLAN-160c.md:624)
```
- **Sichtbar:** nichts.
- **Spielerisch:**
  - Anders wird es nur bei gemischten Spannen. Die entstehen, wenn ein Feld beim Verlängern nur vom ersten Nachbarn erbt (actions.js:157–160).
  - Der Test in §3 zählt sie zuerst. Findet er welche, kommt Frage 3.
- **Bleibt gleich:** jede einheitliche Altspanne. Grund: `brLegacyLook` macht genau Stein und Ziegel zu `stein` (brueckenfamilie.js:58–60).

**D2f Metall** (Normal)
- `WB_NEU.add('stahl')`.
- Es gibt kein Wasser-Metall ohne `brp`, und `build` schreibt `brp` erst in D3 (PLAN-160c.md:169). Sichtbar wird es also nur in Tests und im Prüfwerkzeug.
- Aussehen:
  - Flach mit LIFT 3, nur Träger.
  - Bogen mit Hängern.
  - Keine Mauer: Boote fahren dort durch, wo `archDeck ≥ 12` gilt (rules.js:1949–1951).

**D2g Kristall, Glas in tileB und GL** (Hoch)
```js
// bruecken.js:579 (Wasser-Zweig): Gruppe 'w' bei Kristall mit 'hg' davor (W8):  const ls = gruppe === 'w' && bkGlasAt(c) ? ['hg', ...BK_GRUPPEN.w] : BK_GRUPPEN[gruppe];
// bruecken.js:57
const WB_LIVE = { v: -1, tiles: null, set: new Set(), arr: [] };
function wbLiveSet() { … je groundVersion: isWegBridge(t) && (c = wbAt(x, y)) && bkGlasAt(c) && (!c.G.latF || c.G.lastB) … }
const brLiveTiles = () => …(bkOn() ? bkFresh().glas : []) samt wbLiveSet().arr (gemerkt, nicht je Bild neu verbinden);
// render.js:2186  … || (ms || wbLiveSet().set.has(k) ? wbAt(x, y) : null)
```
- `WB_NEU.add('kristall')`.
- t1 und t2 laufen genau einmal je Bild (brueckenbild.js:300, :306), nie in `w`.
- `wbUnder` (render.js:2021) bekommt `hg` von selbst mit.

**D2h Licht auf dem Wasser** (Normal)
```js
// brueckenbild.js:220
const lg = bkLampGroups(c), lamp = lg.includes(gruppe) || (gruppe === 'w' && lg.some(gr => gr !== 't1' && gr !== 't2'));   // W7
```
- `dark: false`. Ein Strom-Eintrag kommt mit D3, wenn man Licht kaufen kann. Vorschlag „zeichnen“: Schlüssel `'W' + Anker`, weil `'B' + k` mit einem Anhöhen-Anker gleich lauten kann (rules.js:2834).
- Lampen ab 9 Feldern nur auf den Feldkanten, auch an Feld 8–16 (W6).

**D2i Boot unter flacher Brücke** (Normal, erst nach Frage 1)
- Je nach Antwort bleibt :279 und render.js:928 bei `['h', 'vd']`, oder beide werden `['vd']` wie bei Bogen und Anhöhe.

**D2j Aufräumen** (Normal)
- `WB_NEU` fällt weg. `c.lift = G.lift` gilt für alle.
- `bkDrawLagen` ruft `drawWegBridge` nicht mehr auf.
- `drawWegBridge` verliert `lagen` (draw-objects.js:971).
- `drawWegBridge` selbst bleibt für `drawPath` (draw-objects.js:1176), bis D3 den Geist mit Brücke bringt (PLAN-160c.md:633).
- `BRIDGE_LOOK` bleibt, weil ui.js:1957 und :1959 es lesen (D3).
- Werkzeug-Köpfe bekommen „läuft nur bis …“:
  - `tools/bogen-anhoehe-entwurf.js:42–59`: Seine Attrappe von `drawWegBridge` greift auf dem Wasser nicht mehr.
  - `tools/wasserbruecken-entwurf.js:6`.

**D2k Leistung und Prüfbild nachher** (Normal)
- `leistung` laufen lassen.
- Reißt eine Grenze, kommt erst Frage 4, dann gegebenenfalls `leistung:neu` mit Begründung.

## 2. Fallen

| Bereich | Falle | Maßnahme |
|---|---|---|
| Cache | `recalc` leert `bridgeArchCache` und `wbCache`, aber nicht `brSpanCache`. `seaBridgesCheck` läuft vor `groundVersion++` (rules.js:829). `build` ruft `recalc` ohne vorheriges `++` auf (actions.js:180). | D2a: `brSpanCache.v = -1` in `recalc`, mit Test. |
| Cache | `c.G` hält Closures je Fassung. Ein veraltetes `c.G` zeigt das alte Aussehen. | Alle Setzer zählen `groundVersion` hoch (karte-D1.md:196). Test: Material wechseln, dann `recalc`, dann neues `G.mat`. |
| Alte Stände | Gemischte Spannen ändern `pass` und die Seewege, sobald `wall` vom Anker kommt. | D2e: Zähltest über alle Spielstände. Gibt es Treffer, Frage 3. |
| Alte Stände | Flache Rot-Brücke 8 → 3: Figuren, Rahmen, Rauten. | Im Bild abgenommen (W9). Test wasserbruecken-lagen.test.js:109 anpassen. |
| Alte Stände | Kopien haben `brp` mit `brm` aus {holz, stein} (actions.js:552–560). | `brLook` liefert dasselbe wie die Altform (brueckenfamilie.js:82–93). Test mit einer Kopie. |
| Alte Stände | Unbekanntes `brk` aus dem Live-Spiegel. | `brLegacyLook` macht daraus Holz (brueckenfamilie.js:58–62). Der Wurf bei ui.js:1957 gehört zu D3. |
| Daten | Kein neues Format. `build` schreibt kein `brp` (PLAN-160c.md:169). | Metall, Kristall und Licht über Wasser gibt es für Spieler erst mit D3. D2f–D2h prüfen nur Test und Werkzeug. |
| Bildchen | `w` ohne `|lit` und ohne Vorwärmen (brueckenbild.js:67, :220–233). | D2h (W7). |
| Bildchen | `hg` fehlt in `w` (:149 vor :152). | D2g (W8), ein Bildchen je Feld. |
| Bildchen | Unten: Bogenträger −9,2 und `endPost` 21,2 bei einer Grenze von 22 (:18). | Klemmung in `P` (W10). Rahmentest mit `endPost` und beiden Achsen. |
| Bildchen | Seitlich: Abschluss quer 27,5, breit 32,8, Belag 37,1, Grenze 38 (Bericht „zeichnen“, karte-D1.md:185). | Rahmentest für breit 3 und Steg. |
| Bildchen | `brBox` schätzt die hintere Laterne mit `BK_W` 0,4 statt 0,36 (:14–16). | Etwas zu groß, unkritisch. |
| GL | Kristall braucht tileB in jedem Bild. tileB holt `wbAt` sonst nur bei Bewegtem (render.js:2186), `brLiveTiles` kennt nur Anhöhen (bruecken.js:57, gl.js:685). | D2g `wbLiveSet`. Kosten: 2 Zellen je Kristallfeld. In den Testwelten gibt es keins. |
| Boote | Die Stütze der Anfangskante steht hinter dem Boot (Tiefe −0,14), `vd` malte sie drüber. | `boatMid` mit `startPost` (W4). Stein ohne Schnitt. |
| Boote | Boot unter flacher Brücke: das hintere Geländer und die hinteren Stützen liegen über dem Boot (:279, render.js:928). | Frage 1, dann D2i. |
| Boote | Kristall unter einem früheren Feld: `drawBridgeOver` malt nur vd/o nach, nie t1/t2 (render.js:928). `m.under` kann eine vordere Reihe treffen (Folge `done`, render.js:1306ff). | Glas fehlt dann im Bootsrahmen. Nachmalen würde es außerhalb des Boots doppelt decken. Im Prüfbild zeigen und offen lassen, Kristall gibt es bis D3 nicht. |
| Boote | `bkMoverClass` nimmt `W = c.W` 0,36 (brueckenbild.js:241–242). | Bleibt. wasserbruecken-bewegtes.test.js:51–59 bleibt grün. |
| Nebel | Nachmalen und Glas mit `FOG = !ownedTile` (:267, :281). Glasfarben über `C()` (:295). | Nichts Neues. Test „fremdes Feld“ (wasserbruecken-bewegtes.test.js:64) auf den neuen Maler. |
| Durchsicht | Wasser ist nie blass (:207, :279). | Bleibt. Glas und Lampen bleiben bei 👁 deckend. |
| Nacht | `wbRelight` stanzt nur Lichter von vor dem Feld (WB_GLOW0, render.js:2023) und nur Deck plus Randband (:169ff). | Eigene Lampen liegen nach `n0`. Prüfbild Nacht mit Licht. |
| Deko | `bkDecoGroups` teilt mit `BK_W` 0,4 statt 0,36 ein (bruecken.js:590). | Schon heute so (altes Geländer bei `hw−0,03`, draw-objects.js:1041). Nicht in D2. |
| Asymmetrie | An der +Endkante fehlt die Lampe, ein 1-Feld-Steg hat keine Laterne (bkLamps :49–51 mit virtuellem `n`). | So abgenommen, nicht stillschweigend „reparieren“. |
| Alter Maler | `drawPath` → `drawWegBridge` (draw-objects.js:1176) zeigt weiter Ziegel und Pfähle. | Bis D3 (Geist). Kein Weg für gebaute Felder geht mehr dorthin. |
| Fenster | Die Texte „Mauer und Brüstung“ / „Geländer und Pfähle“ (ui.js:1957) passen nicht mehr. | Frage 5. |
| Leistung | Nah mehr Zeichenbefehle je Feld: Holz flach etwa 13 → 23, Holz-Bogen etwa 23 → 29 (Schätzung „zeichnen“, `ts` K 12 bei brueckenbild.js:336). Stein sinkt. | Messen (D2k). Erst sparen (Frage 4), Grenzen nie einfach hochsetzen. |
| Leistung | Vorlauf des Malers je Lage und Bild: `bkKit` und `brPal`. | Feste Teile in `c.G` (D2a). `brPal` ist gemerkt (:497). |
| Leistung | Weit weg: bleibt ein Bildchen `w` je Feld, gleich viele `drawImage` (neu 80, bruecken 106, Schätzung). | W8. „og“ hat keinen Wächter (tests/leistung.test.js:9), also im Prüfbild ansehen. |

## 3. Tests je Schritt

**D2a**, neu `tests/wasserbruecken-modelle.test.js` (Kanal wie wasserbruecken-bewegtes.test.js:11–20)
- `wbAt(…).G` für:
  - Holz-Bogen N 6: `supports` [1, 3, 5].
  - Steg +x N 3: `oB`, `n` 4, `lastB` und `endPost` nur im letzten Feld.
  - Steg −x: `vA` 1, `first` im ersten Feld.
  - 1 Feld.
  - breit 3: `latB`/`latF`/`depth` je Reihe.
  - Nord-Süd.
- `G.hf(G.i + a)` ist gleich `flatDeckH(G.lift, …)` bzw. `archDeck` für a ∈ {−0,5, −0,3, 0, 0,3, 0,5}.
- `recalc` leert `brSpanCache`: `brk` umsetzen ohne `groundVersion++`, dann `recalc`, dann neuer `brSpanLook`.
- Unsichtbar: Alle Tests in `wasserbruecken-*.test.js` bleiben unverändert grün.

**D2b**, `tests/brueckenbild.test.js`
- **Fingerabdruck zuerst auf `0b28f98`:** Proxy wie karte-D1.md:212–216, Anzahl plus Prüfsumme der Befehle.
  - Abgedeckt: alle Anhöhen-Lagen × Materialien sowie `drawWegBridge` für Holz, Stein, Ziegel, Rot × flach, Bogen, breit, Steg.
  - Nach dem Herauslösen muss der Fingerabdruck gleich bleiben.
- `brLampSpots(a, f, n)` gleich `brLampSpots(a, f, n, 8)` für n ≤ 8.
- `('holz', 'fuss', 16, 16).ts`: 17 Punkte (`grid(1)`).
- `('stein', 'fuss', 16, 16).ts`: 15 Punkte.
- `rib: false`: keine Fläche in `L.rib`.
- `endPost`: genau zwei `vert`-Striche bei t1.
- `clear: 9`: es bleiben Zacken übrig, die bei 20 wegfielen.
- `archWall(…, brick=false)` bei Ziegel: kein `pattern('bricks')`.

**D2c**
- **`wasserbruecken-lagen.test.js`:**
  - :41–52 neu: h + vd + o = w über `wbPaintLage`.
  - :69–80: Spion auf `wbPaintLage` statt auf `drawWegBridge`.
  - :82–95: Rahmentest mit dem neuen Maler. Er zählt nur bei Clip-Tiefe 0 (karte-D1.md:425–427) und deckt `endPost`, das Bogenträger-Ufer und z 0,5/1/2,5 ab.
  - :109: `[7, 3, 3]`.
- **Neu:**
  - Die Stützen liegen auf den Kanten aus `brSupports`, im späteren Feld.
  - Flach ohne Hänger.
  - Steg: quer(−) in `h` des ersten Felds, quer(+) in `o` des letzten.
  - Rot: Geländer in `#d9483b`.
- **`wasserbruecken-bewegtes.test.js`:**
  - Boot mittig unter einem Holzbogen mit `startPost`: `bkRedo` mit `cut`, Rahmen ab `px − 25,5·z`.
  - Ohne `startPost`: kein Schnitt.
  - :51 bleibt (flach h + vd).
- **Reihenfolge-Spione** in `wasserbruecken-reihenfolge.test.js:37–42` und `:86–97`: zählen `wbPaintLage` beim Anlegen der Bildchen (`SPRITE_PAINT`).

**D2d**
- Ziegel: `pattern` nie mit `'bricks'`, Wandfarbe `#b5654a`.
- Balustrade bei `par` 6,5.
- Laternen auf den inneren Kanten.
- Flache Wand ohne `bricks`.
- Steg im Freizeitpark `24–26,12`: Stirn in `shade(face, −0,2)`.
- breit 3: Wand nur in der vordersten Reihe, `depth` 2.
- `bogenbruecken.test.js:31–39, :68–78`: Öffnungen und `pass` unverändert.

**D2e**
- **Zähltest:** für `testsave-*.json` und `tests/vorlagen/alte-bruecken.json` je Feld `A.wall` und `A.pass` aus der alten Regel (`bridgeKind`) gegen die neue, dazu `seaCross`.
  - Erwartet `[]`. Sonst die Treffer auflisten, dann Frage 3.
- `brm 'stahl'` auf `platten`: `wall` false.
- `brm 'stein'` auf `sand`: `wall` true.
- Grün bleiben: `neuwelt.test.js:26`, `schiffe-bruecken.test.js`.

**D2f**
- Metall flach LIFT 3: `wegBridgeLift` gleich 3.
- Ohne Bogen und ohne Stützen.
- Bogen: Hänger nie auf der Kante.

**D2g**
- `w` bei Kristall: `hg` vor `h`, `t1`/`t2` nie in `w`.
- Ohne Bewegtes in jedem Bild genau einmal t1 und t2 (Spion auf `bkGroup`).
- `brLiveTiles()` enthält das Feld, innere Reihen ohne `lastB` nicht.
- Durchsicht: nie blass.

**D2h**
- `w` mit `licht: 'an'`: Schlüssel `wb|…|w|F|1` nachts, Vorwärmen in der Dämmerung.
- Ohne Licht: Schlüssel unverändert.
- Holz N 16: Lampen auch an den Kanten 8–16.
- Die Anhöhe bleibt unverändert: `brueckenbild.test.js:368`, `bruecke.test.js:471`.

**D2i**
- `wasserbruecken-bewegtes.test.js:51` und :54/:56 nach der Antwort auf Frage 1.

**D2j**
- `typeof WB_NEU === 'undefined'`.
- `bkDrawLagen` ruft `drawWegBridge` nie auf.
- `paths.test.js:64` (`'bricks'` für Wege) bleibt grün.

**Unverändert grün in allen Schritten:**
- `bruecken-altversion.test.js:27–62`
- `bruecken-geld.test.js:47`
- `bruecken.test.js:20–102`
- `brueckenfamilie.test.js`
- `brueckenwelt.test.js:15–39`
- `wasserbruecken-bewegtes.test.js:59, :83, :87–93, :114–130`

## 4. Prüfbilder (`tools/wasser-d2-pruefung.js`, Browser, nacheinander)

- **Werkzeug:**
  - `shot` mit fester Zeit wie `tools/wasser-d1-pruefung.js:13–28` (`lastFrame = 1e15`, `render(1e6)`).
  - Raster aus dem D0-Entwurf über `window.wasserDbg` (`leeren`, `kanal`, `fertig`; wasserbruecken-entwurf.js:263). Dessen `shot` nicht benutzen, weil er `drawWegBridge` umleitet (:146).
  - Je Kachel `brm`, `brc`, `brw`, `brb`, `brl`, `brz`, `bru` setzen und `brStamp(t, 'wasser', look)` aufrufen (brueckenfamilie.js:49). Sonst zeigt das Spiel nur Holz und Stein.
- **Blätter:**
  1. **Material-Blätter** wie D0 (Entwurf :172–185): 4 × N 1/2/3/6/9/16 × {D0 „neu“ | D2 Tag | D2 Nacht}. Gleiche Kamera (`ZOOM` :167, `hoch` :169), 500×380.
  2. Breit, Steg, Nord-Süd, Boot und Alt wie Entwurf :187–250, jeweils neben dem D0-Bild.
  3. Welt „bruecken“: `VIEWS` (wasser-d1-pruefung.js:6–12), vorher (`0b28f98`) | nachher, Tag und Nacht, z 2,4 live, z 0,8 Bildchen, z 0,6 mit GL.
  4. neu, og, bauland, freizeitpark: je (Art, N, Achse, breit, flach) eine Spanne über `bridgeSpan`, vorher | nachher (PLAN-160c.md:628).
- **Ablauf:** vorher in D2·0. Nachher nach D2c, D2d und D2k. Δ mit `getImageData`: Bildpunkte mit Δ > 8 zählen, dazu ein Wärmebild (stufe3-pruefung.js:122–151).
- **Erwartet Δ = 0:**
  - Anhöhen-Brücken, Gleisbrücken, Land.
  - GL gegen 2D im Nachher-Lauf.
  - Bogenhöhe und Lage der Öffnungen. Prüfen über Öffnungsränder (Stein N 6, „perfekt“ laut D0-Karte :38).
- **Erwartet gleich zum D0-Bild (Toleranz Wellen, D0 lief ohne feste Zeit):** Material-, Breit-, Steg-, Nord-Süd- und Alt-Blätter, nur im Rahmen der Brücke verglichen.
- **Erwartet anders (eigenes Blatt):**
  - Boot mittig: Schnitt statt „ohne Stützen“ (W4, Frage 2).
  - Boot unter flacher Brücke (Frage 1).
  - Rot · 1 Feld, Figur 5 px tiefer (W9).
  - Kristall unter einem früheren Feld (Falle Boote).
  - Asphalt-Belag mit Streifen (W11).
- **GL mit `?messen`:**
  - Wasserbrückenfelder ohne Bewegtes sind nicht dyn, außer Kristall.
  - Kamerazug ohne Verwerfen.
  - Frisch ohne Bildchen (`resetDrawCaches`).
- **iPad:** Speicher in „neu“ weit weg (etwa 8 MB, Schätzung „zeichnen“).

## 5. Fragen an den Nutzer

1. **Boot unter flacher Brücke** (offen seit karte-D1.md:298): Sollen das hintere Geländer und die hinteren Holzstützen über dem Boot liegen, wie heute, oder dahinter, wie bei Bögen und an der Anhöhe? **Empfehlung:** dahinter (nur `vd` nachmalen), dann gilt eine Regel für alle Brücken. Entschieden wird am Bild aus §4.
2. **Boot mittig unter einem Holzbogen:** Im D0-Bild wurde über dem Boot alles außer den Stützen nachgemalt. Das Spiel kann das nur mit dem Schnitt aus C10: Der Streifen der Anfangskante bleibt hinter dem Boot. **Empfehlung:** Schnitt wie an der Anhöhe. Der Unterschied liegt nur an der Anfangskante, und es braucht keine eigenen Bildchen.
3. **Nur wenn der Zähltest in D2e Treffer findet:** Spannen aus Holz und Stein gemischt bekommen ein Aussehen vom Anker, und die Boot-Durchfahrten folgen dem Bild. **Empfehlung:** ja (A4). Die betroffenen Stellen zeige ich vorher und nachher.
4. **Leistung, falls eine Grenze reißt:** erst ohne sichtbaren Unterschied sparen, dann `leistung:neu`. Möglich sind:
   - Planken in einem Pfad (brueckenbild.js:364).
   - Pfosten je Seite in einem Pfad (:354, :367).
   - Flach mit K = 1 statt 12, außer an der Ufer-Rampe (:336).

   Das wirkt auch an der Anhöhe, dort wird es nur billiger. **Empfehlung:** ja, sparen.
5. **Fenster-Texte:** Das Brückenfenster sagt nach D2 noch „Mauer und Brüstung“ bzw. „Geländer und Pfähle“ (ui.js:1957). **Empfehlung:** bis D3 so lassen, D3 baut das Fenster ohnehin neu.

Aufwand je Schritt: D2·0 Normal, D2a Hoch, D2b Hoch, D2c Ultracode, D2d Hoch, D2e Hoch, D2f Normal, D2g Hoch, D2h Normal, D2i Normal, D2j Normal, D2k Normal.

Die Dateien, um die es geht:
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasserbruecken-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasser-d1-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-lagen.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-bewegtes.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bogenbruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung.test.js
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-D0.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-D1.md
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
---

## 6. Gegenprüfung (zwei Prüfer: Code, Abnahme) – Korrekturen, gelten vor dem Text oben

1. **Boot-Schnitt auf dem Wasser** (W4, D2c): `BK_START_CUT` 25,5 und `boatMid > −0,16` sind für `BK_W` 0,4 gerechnet. Auf dem Wasser
   staucht `sq` die Stütze auf s ≈ 0,306: Mitte −25,8·z, rechter Strichrand −24,7·z → mit 25,5 läge ein Streifen von 0,8·z über dem Boot.
   **Korrektur:** Schnitt und Schwelle aus `c.W` rechnen (etwa 24,5·z bzw. −0,19). Test: kein Strich der Anfangsstütze im Rahmen R, beide Achsen.
2. **`WB_AS9`** fehlt in D2a → anlegen (Entwurf `AS9`, :8).
3. **`wegBridgeBelag` herauslösen** (D2b): Der Vorspann :1015–1018 (`pd`, `b0`, `b1`, `ASd`, `Hd`, `deck`) braucht auch der Planken-Zweig
   :1032–1036. Vorspann im alten Maler lassen, die neue Funktion bekommt einen eigenen.
4. **Cache-Test D2a** ist auch ohne Reparatur grün (`recalc` endet mit `groundVersion++`). Veraltet ist `brSpanCache` nur innerhalb von
   `recalc` (`seaBridgesCheck` → `seaCross`), und dort liest erst D2e `brSpanLook`. → Test nach D2e: Look lesen, `brk`/`brm` ohne `++`
   umsetzen, `recalc`, `seaBridgeSig` neu bzw. `seaCache` geleert.
5. **Spione auf `drawWegBridge`** in wasserbruecken-reihenfolge.test.js :58–59, :80, :95 → auf `bkDrawLagen` bei `SPRITE_PAINT` je Gruppe zählen.
6. **Ziegel-Tests** (D2b/D2d): `archWall` ruft nie `pattern('bricks')`; Ziegel steckt in RH 2,2/BL 0,14/Strich 0,45/Ton −0,28, und die Wand
   ist `shade(side, −0,12)`. → diese Werte prüfen; `'bricks'` nur bei der flachen Wand.
7. **Reihenfolge: D2e (`wall` vom Anker) vor D2c.** Ab D2c kommt das Bild vom Anker, `wall`/`pass` bis D2e aber je Kachel → gemischte Spannen
   zeigten eine Mauer, durch die Boote fahren (oder umgekehrt). Zähltest gemischter Spannen schon in D2·0; Frage 3 vor D2c.
8. **W1** „kein `oB` in `sup`“ stimmt nicht (Entwurf :77 hat es) – streichen. Echte Abweichungen zur Skizze: kein `afterMovers`, kein
   `t1 + 1e-6`, `flachV`/`endPost`/`kanteAb`, Signatur von `belag`.
9. **W2 Landende ohne Weg:** `oA`/`oB` aus `wbLandAt` machen ein Landende ohne Weg zum Steg-Ende (gedachtes Feld, Abschluss quer, Stütze auf
   Land). Abgenommen ist nur „offen = Wasser“ (Entwurf :21). → **offen nach Gelände** (`terrainAt` = Wasser), Rampe nach `wbLandAt`
   (wie `wegDeckH`). Prüfbild „Landende ohne Weg“ vorher/nachher.
10. **D2d/D2f Laternen:** Licht gibt es ohne `brp` nicht (brueckenfamilie.js:48, :85) – sichtbar nur in Test und Werkzeug.
11. **Leistung in jedem Schritt:** `npm test` enthält den Wächter (neu, bruecken, freizeitpark). Ab D2c nach jedem Material
    `npx vitest run tests/leistung.test.js` und auch geo (Linienstücke, K 12 je Feld) beachten; reißt eine Grenze, zuerst sparen (Frage 4).
    Es gibt kein Skript `leistung`; `leistung:neu` schreibt auch `leistung-je-ding.json`.
12. **Nicht im Bild abgenommen** (eigene Blätter „abnehmen lassen“ vor dem jeweiligen Commit): Steg −x/−y (der Entwurf öffnete nur am +Ende),
    alte Farben brc/brw (Holz-Stützen/Randbalken werden bc statt `shade(bc, −0,15)`; bauland 15, bruecken 31/22 Felder), Landende ohne Weg.
13. **Beide Achsen:** Holz-Bogen Nord-Süd und Steg +y in die Testszenen; Schnitttest in beiden Achsen.
14. **W8-Begründung:** Testwelten haben kein Kristall; Grund ist „ruhend ein Bildchen je Feld, `w` wird nie nachgemalt“.
15. **`wbRelight` Randband** fest 2,5 → aus `c.G` (Holz 2, Metall 2,6, Kristall 3), sonst doppelt hell unter dem Balken. Nachtblatt: Holz flach mit Laterne.
16. **Zeilen/Wortlaut:** `BK_FUSS` brueckenbild.js:317–322; `rgbaK` :323–330; Nachmalen aus Bildchen :268; `punkt` brueckenfamilie.js:306;
    Ziegelfarbe data.js:1113; `wasserDbg` Entwurf :264; `foot` Entwurf :80; D2h „(W5)“; render.js:928 hat flach `['h','vd','o']`, Bogen `['vd','o']`;
    Kristall wird in GL nicht „dyn“ (tileA bleibt im Standbild, nur tileB über die Liste, gl.js:685, :692–693). D2j zieht CLAUDE.md (Regel
    Wasser-Wegbrücken) und AUFGABEN nach.

**Neue Reihenfolge:** D2·0 (Werkzeug, Vorher-Bilder, Zähltest gemischter Spannen) → D2a → D2b → D2e → D2c → D2d → D2f → D2g → D2h → D2i → D2j → D2k.
