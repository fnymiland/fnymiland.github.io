# Baukarte C9: Bauen per Linie über die Lücke

Eine Weg- oder Gleislinie, die oben auf einer Anhöhe in eine Lücke hinabsteigt, baut künftig die Brücke mit. Material und Farbe kommen aus der Leiste des Brücken-Werkzeugs. Brücke, Deck und Wege oben sind ein Auftrag und ein Rückgängig-Schritt. Geprüft wird an einer gedachten Brücke (virtuelle Zellen), nie mit einer Probe in `state.bruecken`. Dazu kommen ein Vorab-Fix (`bkError`-Index) und zwei Fallen, die kein Bericht genannt hat: Antippen des Geists und der unsichtbare Grund im Schild.

## 0. Was es heute gibt, was fehlt

**Heute**
- Eine Linie oben über eine Lücke baut jedes Feld auf seiner Höhe. Die Wege oben und unten sind getrennt (`levelLink`), unten wird gerodet bzw. Wasserbrücke (plan.js:116–126).
- Brücken baut nur das Werkzeug: `scanBruecke`/`bkBuild` (bruecken.js:224–245).
- `bkPlanDeck` (bruecken.js:346–363) legt nur auf **stehende** Brücken und ist ohne `bkOn()` `null`.
- Vorhanden: `bkSpanOf` (184–198, nur gerade a–b), `bkLookNew` (22), `brNewLook` (brueckenfamilie.js:158, nur `wasser`/`gleis`).
- Rückgängig: `runPlan` läuft in `undoable` (input.js:133). `UNDO_MAPS.bruecken` gibt es (actions.js:1113).

**Fehlt**
- Lücke aus der Feldfolge der Linie (`bkGapAt`).
- `bkPlanNew` und der Einbau in `planScan`.
- `brNewLook('anhoehe')` und `brNewSig`.
- Schild mit Brücke und Grund.
- Geist und Antippen des Geists.
- Texte.

**Widersprüche der Berichte, im Code geprüft**

| Punkt | Ergebnis |
|---|---|
| Ton doppelt (Berichte plan/undo) | **Nein.** `sfx` kehrt im BATCH sofort zurück (audio.js:39), `runPlan` spielt ihn einmal (plan.js:330). Kein `quiet` nötig. |
| `bkError`-Index (Bericht bau) | **Echt.** bruecken.js:208–212 nimmt den Schleifenindex in Zugreihenfolge. `bkSlotClearG` rechnet `i + u`. Bei B→A ist das Feld gespiegelt, `u` nicht. `bkTooTall`:176 nutzt richtig `c.i`. Betrifft schon heute das Werkzeug von rechts nach links. |
| Gleis-Prüfung: eigenes `bkPlanErr` oder `bkRailCheck` mit Zelle | `bkRailCheck(x, y, c)` mit virtueller Zelle. Dieselbe Regel wie später `bkLayRail`, kein doppelter Code. |
| Gleis-Stil-Falle (plan.js:137) | Tritt nur auf, wenn neue Deckfelder **nicht** in `deck` stehen. Also in `deck` aufnehmen. |
| Probe-Brücke in `state.bruecken` | Nicht nötig. Wäre auch riskant: `brSpanCache` (brueckenfamilie.js:196) merkt nur `groundVersion`. |
| gleis-ebenen:106 als Beleg | Falsch: die Linie beginnt unten, keine Lücke. Maßgeblich ist anhoehe-netz:247 (endet unten → kein Gegenüber → bleibt unten). |
| Summen | 12→18 = 215 (7 Felder) und 11→19 = 225 (9 Felder). Beide stimmen. |
| Beschreibung `bruecke` | data.js:208, nicht 209. |
| Material ohne Wahl | Berichte uneins → Frage F2. |
| Lücke passt, Brücke geht aber nicht (> 8, Sperre …) | Berichte uneins → Frage F3. |
| **Neu:** Antippen | `bkPick` (bruecken.js:620) kennt nur `bkAt`. Tippt man in der stehenden Vorschau (Touch) auf den Geist-Bogen, trifft man ein Feld weit dahinter (HILL_H 26 + Bogen) → `planTap` setzt ein **neues Ende** (plan.js:364), statt zu bauen. |
| **Neu:** Grund im Schild | `firstErr` erscheint nur, wenn gar nichts geht (plan.js:291, 312). Eine rote Lücke zeigt sonst nur „3 gehen nicht“, ohne Grund. |
| **Neu:** Prüfzelle | Die Prüfzelle darf kein `weg`/`gleis` tragen. Sonst liefern `bkWegCheck`/`bkRailCheck` `same` bzw. 0 Taler. Die Zeichenzelle braucht beides (Familie Bogen/flach, Belag). |

## 1. Verhalten (Sicht des Spielers)

| Fall | Ergebnis |
|---|---|
| Weg oben auf A → über die Lücke → B (gleich hoch, Ebene 1, 1–8 Felder, gerade) | Brücke im Material und in der Farbe der Brücken-Leiste, Weg auf dem Deck und oben. Ein Klick bzw. ein Tippen, ein ↶. Schild: `Weg: 9 Felder · [Brücke] Holz: 3 Felder · −225 · Bretter 9 · Klick: bauen`. Geist: halb durchsichtige Brücke, grüne Rauten auf dem Bogen. |
| Schiene ebenso | Flache Bahnbrücke: Holz mit Böcken an jeder Kante, Stein als Viadukt, Metall und Kristall frei. Der Zug fährt sofort hinüber (`bkRailJumps`). |
| B→A gezogen, als einreihige Fläche gewischt (`dragKind` = rect) | Gleich. |
| Mehrere Lücken in einer Linie | Je Lücke eine Brücke, ein ↶. |
| Unten begonnen (Start in der Lücke) | Wie heute unten. |
| Oben begonnen, endet in der Lücke; kein Gegenüber; Knick in der Lücke; ungleich hoch; Ebene 2 | Wie heute unten und getrennt, **kein Rot** (`bkGapAt` → `err` → überspringen). |
| Von unten auf A hinauf, dann hinüber | Brücke. Die Regel „oben“ ist wie in `bkPlanDeck`: Das Feld vor der Lücke liegt oben (PLAN C9). |
| Breite Fläche (≥ 2 Reihen) | Unten (wie bkPlanDeck:349). |
| Brücke liegt schon längs | Nur Deck (`bkPlanDeck`), nur Weg- bzw. Gleispreis. Das Material bleibt, die Leiste ist egal. |
| Brücke liegt quer über einem Lückenfeld | Wie heute unten (kein irreführender Text „Material im Fenster“). |
| Lücke > 8, Material gesperrt (Stein ohne Klippe, Kristall, Metall ohne Bahn bei einer Weglinie), Trittsteine, Haus/Wald/Fels/Dach/Torbogen/Bergportal darunter, Stütze trifft etwas, fremdes Land | **Empfehlung F3:** Die Lücke ist rot, der Grund steht im Schild, der Rest der Linie wird gebaut („baut, was geht“). Nie eine leere Brücke. |
| Gleis, und unten liegt ein Weg längs über eine Bockkante | Gleislinie rot: „Mit Gleis braucht die Brücke mehr Stützen. …“. Die Weglinie geht. |
| Wasser in der Lücke | Anhöhen-Brücke oben statt Wasserbrücke unten (geändertes Verhalten, gewollt). |
| Zu wenig Taler oder Material | Die ganze Linie wird nicht gebaut: „Zu wenig Taler (225 nötig)“ bzw. `matError`. |
| Brücken-Werkzeug nicht frei | Wie heute unten. Praktisch nie: Anhöhe und Brücke kommen beide mit `terraform` (data.js:204/206). |
| ↶ | Ein Schritt: Brücke, Deck, Wege oben, Taler und Bretter zurück. |
| Abriss danach | Erst Weg bzw. Gleis vom Deck, dann die Brücke. Erstattet wird `brp` (wie heute). |
| Besuch / zuschauendes Gerät | Gesperrt (`undoable` → `viewOnly`). |
| Touch: in die stehende Vorschau auf den Geist tippen | Baut (neu in `bkPick`). Mit der Maus folgt das Ende weiter dem Boden, Vorschau = Bau. |

## 2. Änderungen in Bau-Reihenfolge

**C9a (eigener Commit): Index in `bkError`**, bruecken.js:208–213
```js
for (const [x, y] of sp.gap) {
  const i = sp.ax ? y - sp.y0 : x - sp.x0;                  // Abstand vom Anker (wie c.i), nicht Zugreihenfolge – B→A war gespiegelt
  if (!ownedTile(x, y)) return notMine(x, y);
  if (bkAt(x, y)) return 'Hier ist schon eine Brücke – das Material wechselst du im Fenster (👆)';
  const e = bkUnderError(x, y, Gn, i); if (e) return e;
}
```

**C9b: Lücke aus der Feldfolge; Prüfer mit Zelle** (bruecken.js)
```js
// aus bkSpanOf:186–197: v = Felder der Linie, i0 = erstes tieferes Feld nach der Anhöhe → Spanne | { err, i1 }
function bkGapAt(v, i0) {
  const lv = v.map(([x, y]) => hillLevel(x, y)), top = lv[i0 - 1];
  let i1 = i0; while (i1 < v.length && lv[i1] < top) i1++;
  if (i1 >= v.length) return { err: 'Bis auf die Anhöhe gegenüber ziehen', i1 };
  const run = v.slice(i0 - 1, i1 + 1), ax = run[0][1] === run[1][1] ? 0 : 1;
  if (run.some(([x, y]) => ax ? x !== run[0][0] : y !== run[0][1])) return { err: 'Nur gerade – von einer Anhöhe hinüber zur anderen', i1 };
  if (lv[i1] !== top) return { err: 'Beide Anhöhen müssen gleich hoch sein', i1 };
  if (top !== 1) return { err: 'Brücken gehen bisher nur zwischen Anhöhen der ersten Ebene', i1 };
  const gap = v.slice(i0, i1), [x0, y0] = gap.reduce((m, p) => p[0] + p[1] < m[0] + m[1] ? p : m);
  return { x0, y0, ax, n: gap.length, gap, ends: [v[i0 - 1], v[i1]], i1 };
}
// bkSpanOf(a, b): Prüfung „gerade“ (185), i0 suchen (187–189), dann return bkGapAt(v, i0) – Texte unverändert
function bkWegCheck(x, y, c = bkAt(x, y)) { … }             // 365: nur den Parameter, Rest gleich
function bkRailCheck(x, y, c = bkAt(x, y)) { … }            // 430: dito (alle Aufrufer bleiben)
```

**C9c: Material und Merk-Kennung** (brueckenfamilie.js:158)
```js
function brNewLook(x, y, at) {
  if (at === 'anhoehe') return bkLookNew();                 // F3: Leiste des Brücken-Werkzeugs (Anhöhen-Brücken verlängert man nicht)
  …                                                          // wasser/gleis unverändert (paintNew dort erst D3/E)
}
const brNewSig = () => { const L = bkLookNew(); return [L.mat, L.col, brMatLock(L.mat) ? 1 : 0, available('bruecke') ? 1 : 0].join(':'); };
```

**C9d: Plan** (bruecken.js nach `bkPlanDeck`; plan.js)
```js
// bruecken.js – neue Brücken unter einer Weg-/Gleislinie; Regel „oben“ wie bkPlanDeck
function bkPlanNew(p, tool) {
  if (!state.hills || !state.hills.size || !available('bruecke')) return [];
  const [x0, y0, x1, y1] = planBox(p);
  if (p.kind !== 'line' && x0 !== x1 && y0 !== y1) return [];            // breite Fläche: unten
  const v = lineTiles(p.a, p.b), look = brNewLook(0, 0, 'anhoehe'), out = [];
  for (let i = 1; i < v.length; i++) {
    const lp = hillLevel(...v[i - 1]);
    if (lp < 1 || hillLevel(...v[i]) >= lp) continue;                    // kein Abstieg von oben
    const sp = bkGapAt(v, i);
    if (sp.err || sp.gap.some(q => bkAt(...q))) { i = sp.i1; continue; } // kein Gegenüber o. Ä. / Brücke schon da: wie heute
    const k0 = sp.x0 + ',' + sp.y0, b = { ax: sp.ax, n: sp.n, art: look.mat, ...(look.col != null ? { brc: look.col } : {}) };
    const cell = ([x, y]) => ({ k: k0, b, i: sp.ax ? y - sp.y0 : x - sp.x0, x0: sp.x0, y0: sp.y0, dx: sp.ax ? 0 : 1, dy: sp.ax ? 1 : 0 });
    const cells = new Map(sp.gap.map(q => [q[0] + ',' + q[1], cell(q)]));   // Prüfzellen: b bleibt LEER
    let err = bkError(sp, look, true);                                     // Fußgänger-Bogen (Zwischenstand von bkBuild)
    if (!err) for (const [k, c] of cells) { const r = (tool === 'weg' ? bkWegCheck : bkRailCheck)(...keyXY(k), c); if (r.err) { err = r.err; break; } }   // Trittsteine, Bahn-Stützen, Viadukt
    const gb = { ...b, ...(tool === 'weg' ? { weg: Array(sp.n).fill(currentStyle('weg')) } : { gleis: Array(sp.n).fill(decoLookNew('schiene').form || 0) }) };
    const G = bkGeom(gb), ghost = new Map([...cells].map(([k, c]) => [k, { ...c, b: gb, G }]));   // Zeichenzellen
    out.push({ sp, look, cells, ghost, err, price: bkPrice(look, sp.n) });
    i = sp.i1;
  }
  return out;
}
```
```js
// plan.js:101 (const → let)
let deck = b === 'weg' || b === 'schiene' ? bkPlanDeck(p) : null;
const neu = b === 'weg' || b === 'schiene' ? bkPlanNew(p, b) : [], vcell = new Map();
for (const N of neu) for (const k of N.cells.keys()) { vcell.set(k, N); if (!N.err) (deck = deck || new Set()).add(k); }   // rote Lücke: nicht Deck (Raute am Boden)
// plan.js:116 – neue Zellen vor quer/planCheck
const N = vcell.get(k), c = N ? (N.err ? { err: N.err } : (b === 'weg' ? bkWegCheck : bkRailCheck)(x, y, N.cells.get(k)))
  : quer.get(k) || (onDeck ? (b === 'weg' ? bkWegCheck(x, y) : bkRailCheck(x, y)) : planCheck(b, x, y));
// Auftrag 120/121 wie heute: onDeck → bkLayWeg/bkLayRail (finden die Brücke nach bkBuild: groundVersion++ in bruecken.js:243)
// NACH dem Gleis-Stil-Block 136–139:
const ok = neu.filter(N => !N.err);
for (const N of ok) { order.unshift([N.sp.x0, N.sp.y0, () => bkBuild(N.sp, N.look)]); cost += N.price.cost; for (const [r, v] of Object.entries(N.price.mat)) mat[r] = (mat[r] || 0) + v; }
const bkErr = (neu.find(N => N.err) || {}).err || null, bkGhost = new Map(ok.flatMap(N => [...N.ghost]));
return { states, order, n: order.length - ok.length, cost, gain: 0, mat, bad, firstErr, deck,
  bk: ok.map(N => ({ mat: N.look.mat, n: N.sp.n })), bkErr, bkGhost: bkGhost.size ? bkGhost : null };
```
```js
// plan.js:288 Schlüssel: … , groundVersion, (p.tool === 'weg' || p.tool === 'schiene') && state.hills && state.hills.size ? brNewSig() : ''
// plan.js:307 planText, nach dem Namen-Teil (BR_SYM = Brückenzeichen wie plan.js:304):
for (const B of info.bk || []) parts.push(`${BR_SYM} ${BR_MAT[B.mat].name}: ${B.n} ${B.n === 1 ? 'Feld' : 'Felder'}`);
if (info.bkErr) parts.push(`${BR_SYM} ${info.bkErr}`);       // Grund der roten Lücke (sonst unsichtbar, n > 0)
```

**C9e: Antippen des Geists** (bruecken.js:620 `bkPick`)
```js
const pg = plan && plan.fixed && (plan.tool === 'weg' || plan.tool === 'schiene') ? planInfo(plan).bkGhost : null;   // stehende Vorschau (Touch, nach Wischen)
if ((!bkOn() && !pg) || seeThrough) return null;
const at = (x, y) => bkAt(x, y) || (pg && pg.get(x + ',' + y)) || null;
// in der Schleife bkAt → at; Startwert h: max(bkPeakMax(), …pg: brPeak(c.G.fam, c.b.n)); h0: Stein auch, wenn ein Geist-Feld G.stone hat
```
Bei der Maus (`!plan.fixed`) bleibt alles, wie es ist. Das Ende folgt `planPoint` → Boden (input.js:191), Vorschau = Bau.

**C9f: Geist** (render.js, brueckenbild.js)
```js
// render.js:1672
DECK_MARKS = bkOn() || (plan && (plan.tool === 'weg' || plan.tool === 'schiene')) ? new Map() : null;
// render.js:1392 (planPreview); dort auch PLAN_GHOST = info.bkGhost || null; Reset in 2219 mit DECK_MARKS
const k = x + ',' + y, bc = up && (bkAt(x, y) || (info.bkGhost && info.bkGhost.get(k)));   // hOf wie heute über bkH(bc.b, …): Geist-b hat Weg/Gleis → richtige Familie
// render.js:2117 (tileA)
if (!bkDone) bkDrawStill(x, y, px, py, z, now, bc, null);
else if (!bc && PLAN_GHOST) { const gc = PLAN_GHOST.get(k); if (gc) bkDrawGhost(x, y, px, py, z, gc); }
// brueckenbild.js (neu, neben bkDrawStill:147): Zwischenleinwand + 0,65, ohne Licht (PLAN §2.6), danach die Rauten
function bkDrawGhost(x, y, px, py, z, c) {
  const A = bkTileArgs(c, px, py, z), [l, u, r, d] = bkBoxOf(['h', 'vd', 'o'], c);
  ghostLayer(px, py, l * z, u * z, r * z, d * z, 0.65, () => bkPaint(A.P, z, A.art, A.n, A.t0, A.t1, A.weg, { ...A.opts, licht: null, dark: false }));
  const marks = DECK_MARKS && DECK_MARKS.get(x + ',' + y);
  if (marks) for (const f of marks) { g.save(); g.lineJoin = 'round'; try { f(); } finally { g.restore(); } }
}
// ghostLayer (render.js, neu): Leinwand wie paintSprite (render.js:610–617: g tauschen, DPR), malen, zurücktauschen, drawImage mit globalAlpha, freeCanvas
```
Beim Planen ist WebGL aus (gl.js:306), es gibt also nur den 2D-Weg.

**C9g: Texte, Abschluss**
- data.js:785 (Tipp `bruecke`) und :208 (Beschreibung) ergänzen: „… oder zieh gleich einen Weg oder eine Schiene oben von Anhöhe zu Anhöhe – die Brücke kommt mit (Material und Farbe aus dieser Leiste)“.
- data.js:696 (`weg`) und :697 (`schiene`): „von Anhöhe zu Anhöhe wird es eine Brücke“.
- `npm run bump`, AUFGABEN/PLAN abhaken.
- CLAUDE.md-Regel: „Neue Brücke per Linie: `bkPlanNew` mit virtuellen Zellen, nie Probe in `state.bruecken`; Prüfzelle leer, Zeichenzelle mit Inhalt“.
- Optional: `bkBuild` in `runPlan` koppeln (`bkOk && bkLay…`), falls sie zur Laufzeit doch scheitert.

## 3. Fallen

| # | Falle | Folge | Gegenmittel |
|---|---|---|---|
| 1 | `bkWegCheck`/`bkRailCheck` lesen `bkAt(...).b` | Absturz bei neuer Brücke | 3. Parameter `c` (C9b) |
| 2 | Prüfzelle mit `weg`/`gleis` gefüllt | `same` bzw. 0 Taler, Gleis gratis | Prüf-`b` leer, Geist-`b` getrennt |
| 3 | `bkError`-Index gespiegelt (208–212) | Lichtraum unter Stein bei B→A an der falschen Stelle | C9a |
| 4 | Neue Deckfelder nicht in `deck` | Gleis-Stil-Block (137) prüft `bAt` unten → Deck-Auftrag gestrichen | in `deck`; `unshift` nach 139 |
| 5 | `n` zählt `bkBuild` mit | „Weg: 10 Felder“ | `n = order.length − ok.length` |
| 6 | Schlüssel ohne Leiste/Sperre | Alter Preis nach Materialwahl oder Freischaltung | `brNewSig()` im Schlüssel |
| 7 | Probe-Brücke in `state.bruecken` | Hängt in `brSpanCache`, `groundVersion` jedes Bild | virtuelle Zellen |
| 8 | `bkPlanDeck` ist `null` ohne `bkOn()` | Erste Brücke würde nie erkannt | `bkPlanNew` unabhängig |
| 9 | `DECK_MARKS` `null` ohne Brücke | Rauten vor dem Geist gemalt, übermalt | Map auch bei Weg/Schiene-Plan; Flush in `bkDrawGhost` |
| 10 | `firstErr` nur bei `n = 0` im Schild | Grund der roten Lücke unsichtbar | `bkErr`-Teil im Schild |
| 11 | `bkError` prüft nur den Fußgänger-Bogen | Gleis: Brücke gebaut, `bkLayRail` lehnt ab | `bkRailCheck` mit Zelle (neue Böcke + Viadukt) |
| 12 | Leere bezahlte Brücke | Trittsteine, Stütze | `bkBuild` nur ohne `N.err` (Prüfung gilt für die ganze Brücke) |
| 13 | Touch tippt auf den Geist | Neues Ende statt Bau, Brückenplan weg | C9e |
| 14 | Gezogener Weg ist eine Fläche (plan.js:8–10) | Wischen ohne Brücke | einreihige Fläche wie Linie |
| 15 | Lücke ohne Gegenüber rot statt unten | anhoehe-netz:247 bricht | `sp.err` → überspringen |
| 16 | Quer liegende Brücke in der Lücke | `bkError`-Text „Material im Fenster“ passt nicht | ganze Lücke überspringen (unten wie heute) |
| 17 | Wasser in der Lücke | `BR_PLAN_LOOK` würde eine Wasserbrücke planen | Deckfelder `continue` vor 126 (schon so) |
| 18 | Wald in der Lücke | Heute rodet die Linie, jetzt rot „erst roden“ | bewusst (F3), Test |

## 4. Tests zuerst (neuer `describe` in tests/bruecke.test.js, Aufbau dort: A x 10–13, B x 17–20, Lücke 14–16)

```js
const GAP = ['14,12', '15,12', '16,12'];
const planX = (tool, a, b, gap = GAP, fixed = false) => game(`(() => { setTool('${tool}'); startPlan('line', ${JSON.stringify(a)}, ${JSON.stringify(b)}, ${fixed});
  const i = planInfo(plan); return { n: i.n, cost: i.cost, err: i.err, mat: i.mat, bad: i.bad, bkErr: i.bkErr || null, bk: i.bk || null,
  deck: i.deck ? [...i.deck].sort() : null, gap: ${JSON.stringify(gap)}.map(k => i.states.get(k)), text: planText(plan, i) }; })()`);
const wallet = () => game('({ money: state.money, ...state.res })');
const spent = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, a[k] - b[k]]).filter(([, v]) => v));
```
- **C9a:** Werkzeug A→B und B→A mit Deko in einer Ecke unter Stein (n 5) → derselbe `firstErr`.
- **T1 oben:** `planX('weg', {11,12}, {19,12})` → `{ n: 9, cost: 225, mat: { bretter: 9 }, gap: ok×3, deck: GAP, bk: [{ mat: 'holz', n: 3 }] }`, Schild enthält „Holz: 3 Felder“.
  - `run()` → `state.bruecken.get('14,12')` = `{ ax: 0, n: 3, art: 'holz', weg: [st, st, st], brp: { money: 180, bretter: 9, k: 'a:holz' } }`.
  - Unten bleibt frei. 11,12 und 19,12 im selben Wegnetz.
  - Ebenso B→A (`{19,10}→{11,10}`) und als einreihige Fläche (`startPlan('rect', …)`).
- **T2 unten:**
  - `{14,12}→{19,12}`: `bk` null, Weg unten auf 14–16.
  - `{12,10}→{15,10}` (endet in der Lücke): `bk` null, Weg 14,10 unten.
  - `{15,6}→{15,18}` (quer): `bk` null.
  - anhoehe-netz:247 unverändert grün.
- **T3 Summe/Geld:** Bei `money 224` ist `err` = „Zu wenig Taler (225 nötig)“, `run()` false, nichts gebaut. Bei `bretter 8` ist `err` = `matError({ bretter: 9 })`.
- **T4 Rückgängig:** `resetUndo(); undoable(runPlan)` → `undoStack.length` 1. `undo()` → `bruecken.size` 0, keine Wege auf 11–13/17–19, `spent(w0, wallet())` = `{}`.
- **T5 Schiene** (`techs.add('bahn')`): `cost 315`, `mat { holz: 9, metall: 9, bretter: 9 }`. Danach `gleis [0, 0, 0]`, `bkFam` 'bahn', `bkSupports` [1, 2], Gleisverbindung über `T.rail.comp`, `bkRailJumps(13, 12)` = [[17, 12]].
- **T6 Bahn-Stützen:** `luecke(4)`, Weg unten längs auf 15/16. Die Schienenlinie macht die Lücke rot, `bkErr` /mehr Stützen/. Die Weglinie geht, `cost 285`.
- **T7 Länge:**
  - `luecke(8)`, `{12,12}→{23,12}`: `cost 540`, `{ bretter: 24 }`.
  - `luecke(9)`: Lücke rot, `bkErr` /Höchstens 8 Felder Lücke/, im Schild sichtbar. `run()` baut nur die Felder oben, `bruecken.size` 0, `bAt(18,12)` null.
- **T8 Brücke steht:** Erst Werkzeug, dann `paintNew.bruecke = { form: 1 }`. Die Weglinie kostet 45, `bk` null. Art und `brp` unverändert.
- **T9 Material/Sperre/Schlüssel:**
  - `paintNew.bruecke = { form: 2, col: 4 }` mit `state.restore = {}` → rot, /^Stein: erst mit/.
  - Danach `restore = { klippe: 1 }` **ohne** `recalc` → `cost 405`, `{ quader: 9, bretter: 9 }`. Gebaut: `art 'stein'`, `brc 3`, `brp.k 'a:stein'`.
  - Metall (Weg, ohne Bahn) → /Metall: erst mit der Eisenbahn/.
  - Kristall → /^Kristall: erst mit/.
- **T10 ganz oder gar nicht:**
  - Trittsteine → `bkErr` = `BK_NO_STONES`, `bruecken.size` 0.
  - Haus in der Lücke → rot. Wald → „erst roden“.
- **T11 Wasser:** Lücke 15 Wasser → Anhöhen-Brücke, keine Kachel mit `bridge`.
- **T12 Touch:** Vorschau steht (`fixed true`). `planPoint` am Geist-Scheitel (`toScreen(15,12)`, `y − (HILL_H + brPeak('fuss', 3)) * cam.z`, wie bruecke.test.js:256) → `{ x: 15, y: 12, deck: true }`. `undoable(() => tap(sx, sy, true))` → `bruecken.size` 1, `plan` null.
- **T13 Geist:** Spion auf `bkDrawGhost`. `render(1e6)` ohne jede Brücke und mit einer anderen Brücke → Schlüssel = GAP, kein Wurf, `bruecken.size` 0, `groundVersion` unverändert. Rautenhöhe Weg = Bogen (`bkH(gc.b, 1)` ≈ `HILL_H + brPeak('fuss', 3)`), Schiene = `HILL_H`.
- **T14 Altversion** (bruecken-altversion.test.js): `serialize().bruecken` nach der Linie = Werkzeug + Weglinie (gleiches JSON).
- **Grün bleiben:**
  - bruecke.test.js:20–129, bruecke-gleis.test.js (u. a. :79 „unten angefangen“)
  - anhoehe-netz:247/255, gleisrampe-kritik:38–46, gleis-ebenen:107–125
  - bruecke.test.js:294/411–415 und bruecke-gleis:49–61 (`bkRailCheck(x, y)` ohne 3. Parameter)

## 5. Prüfbilder (Testwelt bruecken, Tag und Nacht, Zoom 0,5 / 1 / 2)

1. **Weg A→B Holz 3, Maus beim Ziehen:** Der Geist erscheint, sobald das Ende auf B liegt, und verschwindet, wenn das Ende in der Lücke liegt. Die Rauten liegen auf dem Bogen, über dem Deck, nicht verdeckt.
2. **Schiene:** flacher Geist, Böcke an jeder Kante, Rauten auf `HILL_H`, Gleis auf dem Deck sichtbar.
3. **Stein n 5 (1-3-1), n 7 und Kristall:** Pfeiler und Glas als Geist. Die Zwischenleinwand zeigt keine durchscheinenden Lagen; zum Vergleich einmal mit `globalAlpha` direkt.
4. **Rote Lücke (n 9, Stein gesperrt):** kein Geist, rote Rauten unten, Grund im Schild, Schild auf Handybreite lesbar.
5. **Brücke steht schon:** kein Geist, Rauten auf dem echten Deck (wie heute).
6. **Weg unten quer unter der Lücke:** der Geist liegt darüber, unten richtig verdeckt.
7. **Nacht:** Geist ohne Lampen, keine goldenen Ränder, kein Löschbild.
8. **Touch:** Linie stehen lassen, auf den Geist tippen → baut. Daneben tippen → neues Ende bzw. Abbruch wie heute.
9. **Nach dem Bau:** echte Brücke an derselben Stelle wie der Geist (kein Sprung). ↶ räumt alles ab.

## 6. Fragen an den Nutzer

- **F1: Automatisch, ohne Rückfrage?**
  - **Empfehlung:** Ja. Die Vorschau mit Schild („Holz: 3 Felder · −225“) ist die Rückfrage, ↶ ist ein Schritt.
  - **Alternative:** eigene Rückfrage „Brücke bauen?“. Das ist ein Klick mehr, auch bei jeder Gleisstrecke.
- **F2: Material, wenn in der Brücken-Leiste nie etwas gewählt wurde?**
  - **Empfehlung:** Was die Leiste zeigt (Holz). So bauen Werkzeug und Linie dasselbe.
  - **Alternative:** nach Wegbelag wie übers Wasser (Kopfstein → Stein). Das ist oft gesperrt, und die Leiste zeigt dann etwas anderes.
- **F3: Die Lücke passt, die Brücke geht aber nicht** (> 8 Felder, Material gesperrt, Trittsteine, Haus/Wald darunter, Stütze)?
  - **Empfehlung:** Die Lücke wird rot, der Grund steht im Schild, der Rest der Linie wird gebaut, wie bei jeder Linie. Wald heißt „erst roden“ wie beim Werkzeug (heute rodet die Linie unten mit).
  - **Alternative A:** still unten wie heute. Das verbirgt, warum keine Brücke kommt.
  - **Alternative B:** ganze Linie gesperrt.
- **F4: Soll die Weg- bzw. Schienen-Leiste das Brückenmaterial zeigen?**
  - **Empfehlung:** Nein. F3 ist entschieden (nur die Brücken-Leiste). Das Schild beim Ziehen und die Tipp-Texte reichen.
  - **Alternative:** ein kleiner Hinweis „Brücke: Holz“ in der Weg-Leiste, Tippen wechselt zum Brücken-Werkzeug.

Dateien:
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/plan.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/input.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/audio.js
- /Users/ericwinderlich/Projekte/Spiel/js/data.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecke-gleis.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/anhoehe-netz.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-altversion.test.js

---

## 7. Korrekturen aus der Gegenprüfung (2 Prüfer)

- **Rampe/Treppe in der Lücke:** Linie führt über Gleis-Rampe oder Treppe hinunter → keine Brücke, unten wie heute (sonst „kein Platz für Gleis-Rampe“, Tal rot). Test: Rampe hinunter, Tal, Rampe hinauf.
- **Lücke > 8:** keine Brücke möglich → unten wie heute, kein Rot (sonst wird ein ganzes Tal rot). T7 umstellen.
- **Nach `sp.err` nur `continue`**, nicht auf `i1` springen (sonst wird eine echte Lücke hinter einem Plateau der Ebene 2 übersprungen).
- `bk` leer → `null` zurückgeben (Tests T2/T8).
- F2 widerspricht PLAN §1.8/F3 („wer nie wählt: Weg nach Belag, Gleis Holz“) – Nutzer fragen; „nie gewählt“ nur über rohes `state.paintNew.bruecke` erkennbar.
- Nord-Süd-Tests (CLAUDE.md: Brücken immer in beiden Richtungen) für T1, T5, C9a.
- Zeilen: data.js:209 (desc), actions.js:1121/1123 (UNDO_MAPS), render.js:2118, paintSprite :609–622; ghostLayer muss um (l·z − px, u·z − py) verschieben; `matText` schreibt Symbol+Zahl.
- `runPlan` auch über ui.js:607 (Bau-Knopf) in `undoable`. C9e wirkt auch bei mit der Maus gezogenen Flächen (fixed) – erwünscht.
