# D0 Entwurfskarte: Wasser-Wegbrücken (Stand `e9bebfa`, nur gelesen)

Grundlage: F1 (PLAN-160c.md:720–724) und D0/D2 (PLAN-160c.md:608–627). Form, Bogenhöhe, Öffnungen und Boot-Durchfahrten bleiben aus Block 150. Ein Feld und der Steg bleiben flach. Neu sind Material, Geländer bzw. Balustrade, Holzstützen auf den Kanten, Farbe und Licht.

## 0. Widersprüche zwischen den Berichten, im Code entschieden

| # | Streitpunkt | Code | Entscheidung für D0 |
|---|---|---|---|
| W1 | Stein-Wand: Bericht „neu“ will `bkPaintStein` mit eigener Bogengeometrie, „heute“ und „werkzeug“ wollen `archWall` | D2: „Stein mit Öffnungen aus Block 150 + Balustrade“, „Ziegelmuster entfällt“ (PLAN-160c.md:625–627). `bkPaintStein 'v'` mit `arcs: []` malt die Stirn bis `gl` = 0 herunter (brueckenbild.js:397–407). | **`archWall` bleibt** (draw-objects.js:1051), dazu nur `bkPaintStein` mit den Lagen `'h'`, `'d'` und `'o'` (Balustrade und Deck). Lage `'v'` wird bei Stein nie aufgerufen. |
| W2 | Ziegel → Stein | `archWall` wählt das Ziegelmuster über `bridgeKind(t)` (draw-objects.js:1083), flach ebenso (:1008) | Nachher immer mit `{ ...t, brk: 'stein' }` aufrufen. Sonst bleibt in `neu` das Ziegelmuster stehen. |
| W3 | Unterkante −1 oder −6,3 | Die Wasserfläche liegt bei `0.7·DEPTH` = −6,3 (draw-base.js:154). Mauer und Pfähle reichen heute bis −1 (draw-objects.js:990, 1054). An der Anhöhe gehen die Stützen im Wasser bis −6,3 (bruecken.js:571). | Die Stein-Mauer bleibt bei **−1** (F1, Form). Der Fuß der Holzstützen ist eine Gestaltungsfrage (F-a), D0 zeigt beide. |
| W4 | Ganze Brücke übermalen („neu“) oder `drawWegBridge` je Feld umleiten („werkzeug“) | Es gibt nur einen Aufruf (draw-objects.js:1174). Er erreicht den Boden-Durchgang (render.js:1640ff), tileA `drawArchBridge` (render.js:932/2109) und `drawBridgeOver` (render.js:921). | **Umleiten je Feld.** Die alte Brücke verschwindet dadurch von selbst. Boote, Leute und Nacht kommen aus dem echten Spiel, und das Ergebnis ist das, was D2 bauen kann. Die Rückrufe `under`/`after` aus dem Szenenmodell fallen weg. |
| W5 | Flach mit `n = 1` („werkzeug“) | Die Balustrade läuft an beiden Enden über 0,45 aus (`ramp`, brueckenbild.js:394). Bei `n = 1` taucht sie also an jeder Feldkante ab. | Die Spanne wird gerechnet wie in `bridgeArchCalc`, nur ohne Land-Bedingung. Am offenen Ende kommt ein **virtuelles Feld** dazu („neu“), damit die Balustrade dort nicht ausläuft. |
| W6 | Lampen bei N 16 („33 Punkte je Seite“) | `brLampSpots` kappt auf `BK_READ_MAX` 8 (brueckenfamilie.js:299, bruecken.js:17) | Ab Feld 8 fehlen bei N 9 und 16 die Lampen. **Fehler bestätigt.** Im Werkzeug überschreiben; D2 bekommt einen Parameter. |
| W7 | Zacken-Grenze 2 oder 12 | `brClear()` ohne Stein liefert `BK_CLEAR` = HILL_H − 6 = 20 (bruecken.js:16, brueckenbild.js:352) | Auf dem Optionsblatt 2, 9 und 20 nebeneinander zeigen (F-g). |
| W8 | Breite: `s` über die ganze Breite („neu“) oder `sq()` je Reihe („werkzeug“) | Das gilt nur im Szenenmodell | `sq()` je Reihe. Die Längsstriche bei Metall entstehen dann je Reihe neu, das Problem aus „neu“ fällt weg. |
| W9 | Über dem Boot malt „werkzeug“ Lage `'v'` samt Stützen nach | Das Boot in der Feldmitte steht **vor** der Stütze der Anfangskante. Die Anhöhe spart diesen Streifen aus (`BK_START_CUT`, brueckenbild.js:221–222, 251). | Beim Nachmalen `supports: []` übergeben. `t1` (Glasband, Zacken) muss mit nachgemalt werden, das fehlte im Bericht. |
| W10 | Holzpfähle heute | Bei ungeradem N ≥ 5 liefert `archCenters` die Feldmitten (rules.js:1911–1915, draw-objects.js:989). Bei N 5 fährt das Boot durch Feld 1–3, der Pfahl steht bei a = 0 in Feld 1 und 3. | **Bestätigt** (rechnerisch). Die neuen Stützen auf den Kanten (`brSupports`) beheben das, ohne `pass` anzufassen. |
| W11 | `wall`/`pass` je Material | `wall` kommt aus `bridgeKind(t)` (rules.js:1902) | Im Raster legt der Stil das Material fest: Stein bekommt `platten` (mit Mauer), Holz, Metall und Kristall bekommen `sand` (ohne Mauer). `bridgeArchCalc` muss dafür **nicht** überschrieben werden. D2 stellt das später auf `brSpanLook` um. |

## 1. Was D0 zeigen muss

**Kamera:**
- Mitte der Brücke, `cam.y −= A ? A.peak/2 : 4`.
- Zoom je N (1/2/3/6/9/16): 3 / 2,8 / 2,4 / 1,7 / 1,25 / 0,85.
- Bildgröße 500×400.
- Blatt wie bisher: Zelle `(Wd+16)×(Hd+46)`, Titel in `800 19px system-ui` und `#6b4f3a`.

**Tag/Nacht:**
- Gesteuert über `nightAt = () => nt` mit 0 bzw. `NIGHT_MAX`.
- `gameHour` wird auf 23 bzw. 12 gestellt.
- Licht über den echten Weg `bkLamps` → `glowQuad` → `drawNight` (brueckenbild.js:35ff).
- Strom gilt als vorhanden (`dark: false`). Eine Zelle zeigt den Zustand „ohne Strom = grau“ (F2).

| # | Datei (tools/vorschau/) | Zeilen × Spalten | Inhalt |
|---|---|---|---|
| 1–4 | `wasser-holz/-stein/-metall/-kristall.png` | 6 × 3 | N 1/2/3/6/9/16, Ost-West. Spalten: **heute** (dieselbe Szene ohne Umleitung; bei Metall und Kristall ist das der heutige Holzsteg) · neu Tag · neu Nacht |
| 5 | `wasser-breit.png` | 4 × 4 | breit 1–4 × Material bei N 6. Steinbögen bei 6 sind laut Nutzer „perfekt“. Je Zeile eine Nachtzelle |
| 6 | `wasser-steg.png` | 4 × 4 | 1 Feld · Steg +x (Stirn sichtbar) · Steg −x · Steg Nord-Süd +y, je × Material. Nacht nur Steg +x |
| 7 | `wasser-nordsued.png` | 4 × 4 | Nord-Süd N 3/6/16 und breit 2 × Material (`opts.ax` schattiert) |
| 8 | `wasser-boot.png` | 4 × 4 | Boot unter N 3/6/16 an einer Stelle mit `A.pass[j]`, ein zweites dahinter. Zeile 4: Holz N 6 mit Stützen keine/wenige/jede plus Fuß −1 |
| 9 | `wasser-leute.png` | 2 × 4 | N 3 und 16 × Material, je 4 Leute (Scheitel, Ufer, vorn, hinten) |
| 10 | `wasser-optionen.png` | frei | Farbe `brc` (2 Töne), Planken `brw`, Holz mit Belag, Zacken 2/9/20, Licht an/aus/ohne Strom, flaches LIFT 3/7, flach mit und ohne Träger |
| 11 | `wasser-vn-bruecken.png` | 16 × 3 | Wasser-Ansichten aus `VIEWS` (brueckenpruefung.js:7–12): vorher · nachher Tag · nachher Nacht |
| 12–14 | `wasser-vn-neu/-og/-freizeitpark.png` | ≤ 12 × 2 | je (Art, N, Achse) eine Spanne, vorher · nachher. Der Titel nennt die Umdeutung, z. B. „ziegel → Stein (Ziegelfarbe)“ (brueckenfamilie.js:57–62). Im Freizeitpark liegt der einzige echte **Stein-Steg mit Stirn**. |

## 2. Aussehen je Material

**Für alle Materialien gleich:**
- Form ist `A = bridgeArch(x,y)`.
- Deckhöhe `hf(t) = archDeck(A, t + 0.5)`. Flach: `LIFT`, Rampe 0,3 nur an Land-Enden (heute :984–985).
- `P` und Querrichtung wie `drawWegBridge`, also `hw = EDGE_W` 0,36 statt `BK_W` 0,4.
- Boote und Leute bleiben, weil `pass` und `wegBridgeLift` unverändert bleiben.

**Holz** (Bogen 3b, `bkPaintFuss`):
- Planken, Randbalken, Bogenträger `hf − 7 + 3·sin` mit Hängern (brueckenbild.js:310, 316–320).
- Geländer `hf + 6` mit Handlauf `+3`.
- **Stützen auf den Kanten** über `brSupports({mat:'holz', fam:'fuss', stuetzen}, N)`, Standard „wenige“:
  - N 2 → 1; N 3 → 1, 2; N 6 → 1, 3, 5; N 9 → 1, 3, 6, 8; N 16 → 1, 3, …, 15.
  - Beim Steg kommt die Kante am offenen Ende dazu.
- Boote fahren durch die Feldmitten.
- Fuß: siehe F-a.
- Am Ufer liegt der Träger bei −7. `P` klemmt die Höhe deshalb auf den Fuß.

**Stein:**
- Mauer und Öffnungen genau wie Block 150, also `archWall` mit Rückwand, Gewölbe und hellem Bogenrand.
- Mauerwerk immer Quader (RH 4,2 / BL 0,3). Kein Ziegelmuster mehr.
- Brüstung (`parapet`) wird durch die **Balustrade** ersetzt (`'h'` hinten, `'o'` vorn, `par` 6,5). Sie läuft am Ufer aus (`ramp`).
- Deck = Belag des Wegs (Kopie von :1020–1031), Laternen auf den inneren Kanten.
- Farbe: `side = brPal(BK_STEIN,'stein','fuss',col).face`. Ohne Farbwahl ist das `#d9d2c3`, also dieselbe Farbe wie heute.

**Metall** (`stahl`):
- Gitterrost, Stahlträger `hf − 2,6`, Stahlbogen `hf − 6`. Der steigt am Ufer bei −6 aus dem Wasser.
- Geländer `hf + 6,5`.
- **Keine Mauer, keine Stützen.** Boote fahren wie bei Holz durch, wo der Belag ≥ 12 liegt.

**Kristall K1:**
- Hintere Scheibe `'hg'`, Pfosten und Handlauf.
- Glasband `hf − 3` mit Zacken (Option) in `'t1'`, vordere Scheibe in `'t2'`.
- Nachts leuchtet ein blauer Streifen (`'h'`/`'t2'`). Das klappt für jede Länge, weil keine `ts` beteiligt sind.

**Flach (1 Feld, Steg):**
- LIFT: Holz 3, Stein 7, Metall und Kristall offen (F-e).
- Holz bei 1 Feld: `brSupports(n=1)` liefert keine Stütze. Heute stehen dort je Seite 2 Pfähle.
- Stein flach: Wand wie heute (:1005–1011, Quader), dunkle Bogen-Andeutung bei a = ±0,3 bleibt (F1), dazu Balustrade.
- Offenes **+Ende**:
  - Stein: Stirnfläche in `shade(face, −0,2)` mit Abdeckung quer.
  - Holz und Metall: Handlauf quer bei `hf + 6`.
  - Kristall: Scheibe quer.
- **−Ende:** nur der Abschluss quer, vor dem Deck gemalt. Die Fläche zeigt weg, und heute fehlt dort alles (:1042–1047, nur `[0,1]`/`[1,0]`).

**Breit 2–4:**
- Wie heute und wie in D2 entschieden: Geländer, Wand, Stützen und Stirn nur außen.
- Belag läuft durch, die Steinöffnung schaut über `depth` durch alle Reihen (:977, 1052).
- Je Reihe gilt:
  - hinterste Reihe: `hg`, `h`, `d` mit Licht.
  - innere Reihen: nur `d`, ohne Licht. Sonst stünde die hintere Lampe auf der Reihenfuge.
  - vorderste Reihe: Wand/`v`, `d`, `t1`, `o`, `t2`.
- Kein Mittelgeländer (F-d).

**Licht:**
- Holz: Punkte auf jedem 2. Pfosten (`grid(2)`, `up` 6,6).
- Metall: dasselbe mit `up` 7.
- Stein: Minilaternen auf den inneren Kanten.
- Kristall: Streifen.
- Ab N 9 gilt die Kappung aus W6.

## 3. Technischer Aufbau (Skizze)

```js
// tools/wasserbruecken-entwurf.js – nur Bild, kein Spielcode geändert.
// ?welt=bruecken: (0,eval)(await (await fetch('tools/wasserbruecken-entwurf.js')).text()); await wasserEntwurf()
// beliebige Welt: await wasserVorherNachher('neu')        Bild-Sammler 127.0.0.1:4181 (scratchpad/sink.py, nicht im Repo)
(function wasserbrueckenEntwurf() {
  const WL = -1, AS9 = [-0.5, -0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375, 0.5];
  const LIFT = { holz: 3, stein: 7, stahl: 3, kristall: 3 };
  const OPT = { fuss: -0.7 * DEPTH, clear: 9, lampK: 2, leuteFlach: true };     // je Blatt umstellbar (F-a, F-g, F-h)
  const NO_ARCS = { arcs: [], S: BR_STEIN, ts: () => [], ri: () => null };       // bkPaintStein h/d/o: nur Balustrade + Deck
  const LOOKS = new Map(), BOATS = []; let NEU = false, VN = false;
  // Spanne längs ax (wie rules.js:1893–1900, ohne Land-Bedingung); land wie draw-objects.js:983
  function span(x, y, ax) {
    const dx = ax ? 0 : 1, dy = ax ? 1 : 0, at = i => state.tiles.get((x + dx * i) + ',' + (y + dy * i));
    let i0 = 0, i1 = 0; while (i0 < 60 && isWegBridge(at(-i0 - 1))) i0++; while (i1 < 60 && isWegBridge(at(i1 + 1))) i1++;
    const land = i => { const n = at(i); return !!n && !isWegBridge(n) && terrainAt(x + dx * i, y + dy * i) !== 'water'; };
    return { i0, N: i0 + 1 + i1, landA: land(-i0 - 1), landB: land(i1 + 1) };
  }
  const flatH = (j, S, L) => Math.max(0, Math.min(L, S.landA ? L * (j + 0.5) / 0.3 : L, S.landB ? L * (S.N - 0.5 - j) / 0.3 : L));
  function wasserMaler(o) { return function (cx, cy, z, x, y, t) {
    const L = NEU && (LOOKS.get(x + ',' + y) || (VN && brSpanLook(x, y)));
    if (!L) return o.dwb(cx, cy, z, x, y, t);                                    // vorher: pixelgleich
    const A = bridgeArch(x, y), ax = A ? A.ax : bridgeAxis(x, y, t), art = L.mat, glas = art === 'kristall', stein = art === 'stein';
    const lat = s => isWegBridge(state.tiles.get((x + (ax ? s : 0)) + ',' + (y + (ax ? 0 : s)))), latF = lat(1), latB = lat(-1);
    let depth = 0; while (depth < 8 && lat(-depth - 1)) depth++;
    const S = A ? { i0: A.i0, N: A.N, landA: true, landB: true } : span(x, y, ax);
    const oA = !A && !S.landA, oB = !A && !S.landB, vA = oA ? 1 : 0, n = S.N + vA + (oB ? 1 : 0);   // virtuelle Felder (W5)
    const tc = S.i0 + vA, lastB = oB && S.i0 === S.N - 1, t0 = tc - 0.5, t1 = tc + 0.5 + (lastB ? 1e-6 : 0);
    const hf = A ? tt => archDeck(A, tt + 0.5) : tt => flatH(tt - vA, S, LIFT[art]);
    const Pw = (a, b, h) => { const [u, v] = ax ? [b, a] : [a, b]; return [cx + (u - v) * TW / 2 * z, cy + (u + v) * TH / 2 * z - h * z]; };
    const sq = s => s / BK_W * (s < 0 ? (latB ? 0.512 : EDGE_W) : (latF ? 0.512 : EDGE_W));
    const P = (tt, s, h) => Pw(tt - tc, sq(s), Math.max(h, OPT.fuss));          // Träger am Ufer nie unter den Fuß
    const sup = art !== 'holz' ? [] : [...brSupports({ mat: 'holz', fam: 'fuss', stuetzen: L.stuetzen }, S.N).map(k => k + vA),
      ...(oA ? [vA] : []), ...(oB ? [S.N + vA] : [])].filter(k => hf(k - 0.5) >= 2);
    const pal = brPal(BK_STEIN, 'stein', 'fuss', L.col, null);
    const opts = { fam: 'fuss', ax, hf, foot: () => OPT.fuss, gl: () => WL, supports: sup, ext: S.i0 < S.N - 1 ? 0.012 : 0,
      col: L.col, plank: L.plank, licht: L.licht, dark: !!L.dunkel, zacken: !!L.zacken, stone: stein ? NO_ARCS : null,
      wegPaint: L.deck === 'belag' ? () => belag(t, Pw, a => hf(tc + a), ax, z, latB, latF) : null };   // Kopie :1016–1031
    const lage = (l, ex) => bkPaintLage(l, P, z, art, n, t0, t1, !!opts.wegPaint, ex ? { ...opts, ...ex } : opts);
    const wand = fr => stein
      ? (A ? archWall(A, Pw, a => hf(tc + a), AS9, { side: pal.face }, EDGE_W, z, { ...t, brk: 'stein' }, fr, depth)   // W1, W2
           : flachWand(Pw, a => hf(tc + a), pal.face, x, y, z))                  // Kopie :1005–1011 mit 'tiles'
      : lage('v', fr ? { supports: [] } : null);                                 // W9
    const vorn = () => { if (!latF) { lage('o'); if (glas) lage('t2'); } if (lastB) quer(art, Pw, hf(tc + 0.5), 0.5, pal, L, z, true); };
    if (BRIDGE_FRONT) { if (!latF) wand(true); lage('d', { licht: null }); if (glas && !latF) lage('t1'); return vorn(); }
    if (glas && !latB) lage('hg');
    if (!latB) lage('h');
    if (oA && S.i0 === 0) quer(art, Pw, hf(tc - 0.5), -0.5, pal, L, z, false);  // −Ende: nur Abschluss quer, vor dem Deck
    if (!latF) wand(false);
    lage('d', latB ? { licht: null } : null);
    if (glas && !latF) lage('t1');
    if (!A) return vorn();                                                       // flach: Boden-Durchgang, nie aufschieben
    const m = g.getTransform(); afterMovers.push(() => { g.save(); g.setTransform(m); try { vorn(); } finally { g.restore(); } });  // Leute vor 'o' (render.js:2204, 2243–2245)
  }; }
  function shot(cx, cy, zz, up, Wd, Hd, nt, neu, vn = false) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const o = { dwb: drawWegBridge, sm: shipMovers, lsp: brLampSpots, bcl: brClear, wbl: wegBridgeLift, off: GL.off, sf: spriteForce, na: nightAt, gh: gameHour };
    NEU = neu; VN = vn; drawWegBridge = wasserMaler(o); shipMovers = () => BOATS.map(b => ({ ...b }));
    brLampSpots = (a, f, nn) => { if (nn <= 8) return o.lsp(a, f, nn); const S = { ...o.lsp(a, f, 8) },        // W6
      grid = K => Array.from({ length: nn * K + 1 }, (_, i) => -0.5 + i / K);
      if (S.form === 'laterne') S.ts = grid(1).slice(1, -1); else if (S.form === 'punkt') S.ts = grid(OPT.lampK); return S; };
    brClear = (S, ...r) => (S ? o.bcl(S, ...r) : OPT.clear);                     // W7
    if (neu && OPT.leuteFlach) wegBridgeLift = (px, py) => o.wbl(px, py) || flatLiftAt(px, py);   // Ziel D1 (brLiftAt = LIFT)
    GL.off = true; spriteForce = false; nightAt = () => nt; gameHour = () => (nt > 0.15 ? 23 : 12);
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true;
      for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { drawWegBridge = o.dwb; shipMovers = o.sm; brLampSpots = o.lsp; brClear = o.bcl; wegBridgeLift = o.wbl; GL.off = o.off;
      spriteForce = o.sf; nightAt = o.na; gameHour = o.gh; NEU = VN = false; resetDrawCaches(); groundVersion++; }
    return crop(Wd, Hd);                                                         // Mitte von canvas, wie brueckenlicht-pruefung.js:47–52
  }
  // Raster in ?welt=bruecken ab x 72 (Welt belegt bis x 66, brueckenwelt.js:18): kanal(ax, u0, v, N, {breit, steg: 0|+1|−1, mat, look})
  // – Wasser N(+4 beim Steg) × (breit+2), 2 Felder Ufer-Weg, Stil Stein 'platten' sonst 'sand' (W11), LOOKS je Brückenfeld, Zeilen 4 auseinander.
  // Danach claimed, recalc(), groundVersion++. Leute: walkers.push({ …, pin: true }) wie tools/stufe3-figuren-szene.js:53–56.
  // Boote: BOATS.push({ boat: true, px: x0 + j, py: v + 0.15, du: 0, dv: 1 }) nur bei A.pass[j] (Nord-Süd gespiegelt).
  // Blatt + post(): wie brueckenlicht-entwurf.js:231–244.
})();
```

`wasserVorherNachher(welt)` braucht kein Setup:
- Alle Felder mit `isWegBridge` laufen über `bridgeSpan`, je (Art, N, Achse, breit, flach) wird eine Spanne gewählt.
- Spalte 1 mit `NEU = false`, dann mit `NEU = VN = true`. Das Aussehen kommt aus `brSpanLook`, das ziegel und rot schon umdeutet (brueckenfamilie.js:57–62).
- Altbrücken haben `licht: null`. Für die Nachtspalte setzt man wahlweise `licht: 'an'`.

## 4. Fallen

1. **`spriteForce = false` setzen.** `paintSprite` setzt `afterMovers` zurück (render.js:616/622), sonst fehlt das vordere Geländer.
2. **Flache Brücken nie aufschieben.** Sie kommen aus dem Boden-Durchgang vor der Feldschleife.
3. **Leute auf flachen Brücken.** Auch mit gehobener Höhe stehen sie vor dem Geländer, weil es im Boden-Durchgang liegt. Das löst erst D1. Neben einem Boot malt render.js:2194–2196 die Leute obenauf, das ist heutiges Verhalten.
4. **Kristall über einem Boot.** `drawBridgeOver` malt das ganze Feld nach, ohne Ausschnitt. Das Glas in `t1`/`t2` wird dadurch doppelt deckend. D0 nimmt das hin und zeigt es in der Zelle „Kristall + Boot“. Lösen kann es D1 (Nachmalen im Rahmen, Glas nur einmal).
5. **Flache Brücken mit Träger.** Bei Holz liegt der Bogenträger bei −4…−1, bei Metall bei −3. Die Maler haben keinen Schalter dafür. Eine Variante ohne Träger braucht im Werkzeug eine Kopie von brueckenbild.js:316–320 bzw. 362–366 (F-f). D2 bekommt dafür `opts.rib`.
6. **Rahmen, erst ab D2 wichtig** (D0 läuft mit `GL.off` und ohne Bildchen):
   - Bogen: `peak + 30` (render.js:935/941).
   - Flach: `TH + 60` (render.js:1039).
   - Über dem Boot im GL-Bild 70·z (render.js:1321). Bei N 16 liegen Scheitel 71 + Laterne ≈ 83 darüber, das wird abgeschnitten.
7. **Rot → Holz.** Farbe 3 und Planke 5; eine flache Rot-Brücke sinkt von LIFT 8 auf 3. In den Testwelten sind alle Rot-Brücken Bögen, nur im Vorher/nachher prüfen.
8. **Zeilenangaben** in `plan-160c/karte-wegbruecke-wasser.md` sind um rund 13 Zeilen (draw-objects.js) bzw. 8–46 Zeilen (render.js) veraltet. Diese Karte nennt die aktuellen.

## 5. Offene Gestaltungsfragen (mit Empfehlung)

| # | Frage | Empfehlung |
|---|---|---|
| F-a | Fuß der Holzstützen: −6,3 (auf der Wasserfläche, wie an der Anhöhe) oder −1 (wie die heutigen Pfähle und die Steinmauer)? | **−6,3.** Gleiche Familie wie an der Anhöhe; bei −1 wirken die Stützen schwebend. Die Steinmauer bleibt bei −1 (F1). |
| F-b | Holzstützen: keine, wenige oder jede Kante als Standard? | **Wenige**, wie an der Anhöhe. Boote fahren in allen drei Fällen durch die Feldmitte. |
| F-c | Metall und Kristall übers Wasser mit Mauer oder frei? | **Frei**, wie in D2 geplant (rules.js:1902: Mauer nur bei Stein). Boote fahren wie bei Holz durch, wo der Belag ≥ 12 liegt. |
| F-d | Breite Brücken mit Mittelgeländer oder Stützen in den inneren Reihen? | **Nein**, nur außen, wie heute und wie in D2. Im Bild bei 4 Reihen prüfen; wirkt es zu dünn, innen Stützen an denselben Kanten. |
| F-e | Höhe von Metall und Kristall flach: 3 wie Holz oder 7 wie Stein? | **3** (leichter Steg). |
| F-f | Flache Holz- und Metallbrücke mit Bogenträger? | **Ohne.** Bei LIFT 3 liegt er im Wasser. |
| F-g | Wie tief dürfen die Kristallzacken übers Wasser hängen: Spitze ≥ 2, 9 oder 20? | **9.** Das ist dieselbe Grenze wie die Durchfahrt durch eine Steinöffnung (h ≥ 9, rules.js:1931); darunter hängen die Zacken in den Bootsrumpf. Bei 20 fallen sie fast alle weg. |
| F-h | Lampendichte bei N 9 und 16: Holz/Metall auf jedem 2. Pfosten (33 je Seite) oder nur auf den Feldkanten (17)? Stein: 15 Laternen? | **Ab 9 Feldern nur auf den Feldkanten.** Stein auf allen inneren Kanten. |
| F-i | Darf die Stein-Balustrade am Ufer auslaufen (0,45 Feld)? | **Ja**, wie an der Anhöhe. Die alte Brüstung endet ebenfalls mit dem Deck bei 0. |
| F-j | Steg nach −x/−y: Abschluss quer am offenen Ende (heute fehlt er)? | **Ja**, nur Geländer bzw. Abdeckung. Die Stirnfläche zeigt dort weg. |
| F-k | Ziegelmuster wirklich weg (Ziegel → Stein in Ziegelfarbe; in `neu` betrifft das 57 Spannen)? | **Ja**, wie in D2 geplant. Das Vorher/nachher-Blatt `neu` entscheidet. |

Relevante Dateien:
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-base.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md

---

## 6. Gegenprüfung

**Prüfung der D0-Karte gegen den Code (Stand HEAD 13df1dc)**

Ich habe nur gelesen und nichts geändert. Die Karte gibt `e9bebfa` als Stand an, HEAD ist aber `13df1dc`. Die Karte mischt beide Stände, das steht unter Punkt 5. Unten stehen nur die Fehler, die ich im Code belegen kann.

**1. Raster ab x 72 in `?welt=bruecken`: drei echte Fallen**
- **Falsche Zeile:** Die Grasfläche bis x 66 setzt `tools/brueckenwelt.js:20`, nicht `:18` (dort steht `DESIGN`).
- **Ufer ist Meer:** Ab x 67 liefert `baseTerrain` Meer (`world.js:58`, `islandAt` gibt null; die Waldinsel endet bei x ≈ 59).
  - Ohne eigenes Gras ist das „Ufer“ Wasser. Dann ist `landAt` falsch (`rules.js:1900–1901`), und es entsteht kein Bogen.
  - Korrektur: `kanal()` setzt das Gelände selbst und leert danach die Zwischenspeicher wie in `brueckenwelt.js:86`.
  ```js
  for (…Raster…) { state.terra.set(k, 'grass'); state.claimed.add(k); }   // danach Wasser darüber
  sandCache.clear(); landCache.clear(); waterChanged(); growWorld(); recalc(); groundVersion++;
  ```
- **Welt wächst nicht mit:** `state.claimed.add` allein vergrößert `WORLD` nicht. Das tun nur `claimTile` → `worldInclude` (`world.js:233`) bzw. `growWorld` (`world.js:172`), und `growWorld` läuft nur beim Laden (`story.js:164`).
  - In der geladenen Welt ist `WORLD.cMax = floor(66/6) + 3 = 14`.
  - `worldView` (`render.js:1617–1618`) schneidet bei `groundCached` (z·DPR ≤ 2,6) alle Felder mit x oder y > 90 weg. Das betrifft N 9 (z 1,25) und N 16 (z 0,85).
  - N 16 + Steg + Ufer ab x 72 reicht bis etwa x 95, und Zeilen im Abstand 4 laufen schnell über y 90.
  - Korrektur: `growWorld()` nach dem Raster aufrufen (siehe Skizze oben).

**2. Über dem Boot wird `vorn()` doppelt gemalt (Bogen)**
- Das Boot bei `(x0+j, v+0.15)` bekommt den Schlüssel `round(px), round(py)` (`render.js:1859`). Das ist dasselbe Feld wie die Brücke.
- Ablauf in diesem Feld:
  1. tileA legt `vorn` in `afterMovers`.
  2. tileB malt das Boot, dann `drawBridgeOver` → Zweig `BRIDGE_FRONT` → `return vorn()`.
  3. Danach leert `render.js:2204` die Liste, und `vorn()` läuft ein zweites Mal.
- Folge: Das Glas `t2` deckt doppelt, und der vordere Lampenschein wird zweimal gestanzt. Der Anhöhen-Weg verhindert genau das mit `GLOW_MUTE 'pane'` (`brueckenbild.js:230`).
- Falle 4 schiebt das doppelte Glas auf „`drawBridgeOver` ohne Ausschnitt“. Im Werkzeug ist die Ursache dieser Doppelaufruf.
- Korrektur:
  ```js
  const PEND = new Set();   // je Bild leeren
  // beim push:   PEND.add(x + ',' + y); afterMovers.push(() => { PEND.delete(x + ',' + y); … vorn(); … });
  // BRIDGE_FRONT: …; if (!PEND.has(x + ',' + y)) vorn();   // sonst malt es afterMovers nach dem Boot
  ```

**3. Die Klemmung in `P` hängt am Stützenfuß**
- `P = … Math.max(h, OPT.fuss)` klemmt alles auf denselben Wert wie den Stützenfuß.
- In der Vergleichszelle „Fuß −1“ (Blatt 8, Zeile 4) wird dadurch auch der Holz-Bogenträger am Ufer auf −1 abgeschnitten. Der liegt dort bei −7 … −9,2 (`rib = hf − 7 + 3·sin`, Band bis −2,2).
- Korrektur: eine eigene Konstante nehmen, `Math.max(h, -0.7 * DEPTH)`. `OPT.fuss` gilt dann nur noch für `foot`.

**4. Gepinnte Leute werden gekürzt**
- `syncMovers` (`movers.js:156`: `while (walkers.length > wantW + 12) walkers.pop()`) läuft alle 700 ms (`main.js:162`). Die Brückenwelt hat keine Wohnhäuser, also ist `wantW` 0.
- Das Leute-Blatt mit 8 × 4 = 32 gepinnten Figuren schrumpft auf 12, sobald zwischen Aufbau und Aufnahme ein `await` liegt.
- Korrektur: wie `tools/stufe3-pruefung.js:96` `syncMovers = () => {}` setzen und danach zurückstellen.

**5. Zeilenangaben**
- Die Karte mischt HEAD- und e9bebfa-Zahlen. Seit e9bebfa sind `brueckenbild.js` ab Zeile 267 um +1 verschoben, `render.js` um +5 ab Zeile 1321 und um +4 ab Zeile 2193.
- Diese Angaben sind HEAD-Zahlen: `brueckenbild.js:310/316–320/352/394` und `render.js:1321/2204/2243–2245`.
- Diese sind e9bebfa-Zahlen: `render.js:1640/2109/2194–2196`. In HEAD sind das 1645/2114/2198–2200.
- Falle 8 („Diese Karte nennt die aktuellen“) stimmt deshalb nicht ganz.

| Stelle | Fehler | Richtig (HEAD) |
|---|---|---|
| W1 `brueckenbild.js:397–407` | Das ist die Balustrade, nicht die Stirn | Lage `'v'` (Stirn bis `gl`): 420–430 (e9: 419–429) |
| F-f „`brueckenbild.js:362–366`“ | Trifft das hintere Stahlgeländer und nur einen Teil von `'v'` | `rib` 360, Träger/Hänger/Bogen 364–368 |
| W1 `PLAN-160c.md:625–627` | | 623 (Stein + Balustrade), 625 (Ziegelmuster entfällt) |
| Blatt 11 `brueckenpruefung.js:7–12` | | Wasser-Ansichten 8–11 (Zeile 12 ist Gleis) |
| Skizze `brueckenlicht-pruefung.js:47–52` | | Ausschnitt 48–53 |
| Falle 6 `render.js:1321` | | `bridgeOverBoat` 1322–1323 |
| Falle 6 `render.js:1039` (TH + 60) | | 1043 bzw. 1648 |

**6. Zahl und Begründung**
- **F-k:** Es sind nicht „57 Spannen“, sondern 57 **Felder** in 2 Brücken: 48 Felder `kopf` (3 Reihen × 16) und 9 Felder `klinker`. Das bestätigt auch `karte-wegbruecke-wasser.md` §1c.
- **F-f:** „Bei LIFT 3 liegt er im Wasser“ stimmt nicht. Die Wasserfläche liegt bei −6,3 (`draw-base.js:154`).
  - Holz: Das Band `rib − 2,2 … rib` reicht von −6,2 … −4 an den Enden bis −3,2 … −1 in der Mitte. Es liegt also unter Ufer-Niveau, aber über dem Wasser und berührt es nur an den Enden.
  - Metall: Der Bogen liegt bei −3.
  - Die Empfehlung „ohne Träger“ kann bleiben, braucht aber diese Begründung.

**7. Kleinigkeit in der Skizze**
- `belag(t, Pw, …)` bekommt kein `x, y`. Der kopierte Code braucht beides für `pattern(Lh, …, x, y, z, …)` (`draw-objects.js:1027`).
- Korrektur: `belag(t, Pw, a => hf(tc + a), ax, z, latB, latF, x, y)`.

**Geprüft und richtig:**
- `brSupports` „wenige“ (N 2/3/6/9/16), N = 1 ohne Stütze.
- W6 (Kappung auf 8, 33 bzw. 17 Punkte), W7 (`BK_CLEAR` 20), W10 (Pfähle in den Feldmitten bei ungeradem N ≥ 5).
- W11 (`wall` aus Stil bzw. `brk`), W2 (`bridgeKind`: `brk` hat Vorrang).
- `afterMovers`-Reset in `paintSprite` (616/622), W9 (`BK_START_CUT`).
- Alle Parameter von `archWall`, `bkPaintLage`, `brPal`, `bkLamps` und `bkTileArgs` (`foot` −6,3 in `bruecken.js:571`).
- `flatH` ist gleichwertig zu `:984–985`.
- Peak bei N 16 = 71, Rot → Holz (Farbe 3, Planke 5), der einzige Stein-Steg mit Stirn liegt im Freizeitpark (26,12).