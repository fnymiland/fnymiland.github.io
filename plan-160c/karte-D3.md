# D3 Baukarte: Wasser-Wegbrücken – Fenster, Kosten, Bau im neuen Format

**Stand:** `e7a673b` („160c D2: Gegenlesen nach dem Bau – keine bestätigten Fehler, Hinweise für D3 vorgemerkt“, 13.10.2026). Live ist v1016 = `origin/main` `ac7a848`. Ich habe nur gelesen. Nichts wurde geändert, ausgeführt oder getestet.

**Grundlage:**
- PLAN-160c.md:630–634 (D3), dazu 1.4 Schreiben, 1.6 Rückfall, 1.7 Geld, 1.8 Wahl für Neues, §4 Nr. 3 (F3 → C9/D3).
- karte-D2.md §7: Kristall über dem Boot, Seeweg-Sperre, Hinweistext.
- karte-C6-fenster.md: Fenster `openBkInfo`, Setzer `brSet`, v1016-Befunde B1/B9.
- Drei Leser: „fenster“, „geld“ und „bauen“. Die strittigen Stellen habe ich selbst im Code nachgesehen.

**Zeilenangaben:** PLAN §3 ist veraltet.
- ui.js:1927–1951 / 2044–2049 heißen jetzt ui.js:1955–1961 (Abschnitt), :1971 (Titel), :1979 (Text) und :2072–2077 (Verdrahtung).
- Statt render.js:1762 gelten render.js:1795 (Schild Weg) und :1792 (Schild Anhöhe).
- Diese Karte nennt die Zeilen von `e7a673b`.

## 0. Widersprüche, im Code entschieden

| # | Streitpunkt | Befund im Code | Entscheidung |
|---|---|---|---|
| W1 | „drawWegBridge malt nur noch die Bau-Vorschau“ (karte-D2 D2j, Auftrag) | Übers Wasser gibt es **keinen** Geist. `free` verlangt Land, außer bei der Schiene (render.js:1827). Der Geist `gt` hat kein `bridge` (render.js:2163). `planPreview` malt nur Rauten (render.js:1384–1428). `drawPath` → `drawWegBridge` (draw-objects.js:1176) erreicht man nur noch aus Tests (bruecken.test.js:75, wasserbruecken-lagen/-reihenfolge). | `drawWegBridge` und `BRIDGE_LOOK` (draw-objects.js:965–1100) fallen in D3i weg. Der Zweig in `drawPath` wird `return`. Der Geist ist **neu** und kein Ersatz (Frage 5, D3h). |
| W2 | Rot-Tests umschreiben, `setBridgeKind` als Hülle | `setBridgeKind` (rules.js:2040) setzt nur `brk` und löscht `brp`, so wie v1016. Tests, Testwelt-Erzeuger (testwelt-freizeitpark.test.js:149) und tools/brueckenschau.js:36 bauen damit Altstände. | **`setBridgeKind`/`setBridgeColor` bleiben unverändert**, mit dem Kommentar „nur Altstände bauen (Tests, Werkzeuge)“. Das Fenster ruft nur noch `brSet`. Die Rot-Tests bruecken.test.js:36–48 und :79–90 bleiben grün. Neue Tests bauen alte Rote über `brk:'rot'` und `setBridgeKind`. |
| W3 | Stein-Sperre übers Wasser | `BR_MAT.stein.lock {lm:'klippe:1'}` gilt an allen Orten (brueckenfamilie.js:15, :22). Heute entsteht Stein übers Wasser frei aus dem Wegstil (rules.js:1868–1869). | **Übers Wasser ist Stein frei.** `brMatLock(mat, 'wasser')` übergeht `stein.lock`. Kristall bleibt gesperrt, Metall siehe Frage 2. |
| W4 | `brNewLook`: Nachbar-Kachel (brueckenfamilie.js:161–163) oder Bild der Spanne | Gezeichnet wird vom Anker (`brSpanLook` :207, `brSpanAnchor` :197). | **Neu nach dem Aussehen der Spanne:** `brSpanLook(Nachbar)`. costOf (rules.js:2130), Stempel und Plan-Vorschau (plan.js:130) haben dann eine Quelle: bezahlt wird, was man sieht. |
| W5 | build stempelt nur bei neuem Nachbarn (actions.js:162) oder „build schreibt brp“ | Mit einem Stempel auf dem neuen Feld kann dieses Feld zum Anker werden (kleinstes x+y), und die ganze Spanne springt. | **Immer stempeln.** Wer eine alte Spanne verlängert, schreibt sie vorher kostenlos fest (`wbMaterialize`: jedes Feld bekommt `brp = brPaid` mit `k`, dazu das Aussehen der Spanne ausdrücklich). Danach sind alle Felder gleich, und der Anker kann nicht springen. |
| W6 | Rohkopie der `BR_KEYS` vom Nachbarn (actions.js:159) | Hat v1016 den Nachbarn umgestellt, steht dort vielleicht noch `brm:'stahl'` mit veraltetem `brp`. Ein Stempel machte daraus Metall zum Holzpreis. | **Nie Rohfelder kopieren.** Felder werden immer aus dem Aussehen geschrieben (`brWriteLook`, gemeinsam mit copyClone actions.js:552–560). |
| W7 | `brk` beim Bau: nur holz/stein (PLAN 1.4) oder `look.kind` („geld“) | v1016 leitet aus dem Wegstil bzw. dem Nachbarn genau `look.kind` ab. copyClone schreibt das schon (actions.js:553). | Stammt das Aussehen aus der Altdeutung, gilt **`brk = look.kind`** (holz/stein/ziegel/rot; kein neuer Wert, v1016 sieht dasselbe Bild). Nach einem Materialwechsel gilt `brFallback('wasser', mat).brk` (holz/stein). `brk` steht immer ausdrücklich da, so bleibt `brSig` beim Umstreichen gleich. |
| W8 | Deck-Wahl immer („fenster“) | Der Maler kennt bei Stein nur den Belag: `weg = stein \|\| L.deck === 'belag'` (brueckenbild.js:534). | **Deck „Wie der Weg / Eigenes Muster“ nur bei Holz, Metall und Kristall.** Stein zeigt immer den Belag (Block 150). Die Belag-Wahl (`setBridgeStyle`, rules.js:2112) erscheint immer bei `deck === 'belag'`. |
| W9 | Stützen nur bei Bögen? | `wbGeom` setzt Holz-Stützen auch flach und am Steg (`hf ≥ 2`, flach LIFT 3; rules.js:1918ff). | **Stützen bei Holz in jeder Form.** |
| W10 | „Wie das Material“ bei alter Roter/Ziegel | `brLook` nimmt bei gleichem Material `L.col` (brueckenfamilie.js:88). Bei Rot/Ziegel fällt das auf 3 bzw. 8 zurück (:59–61). Fehlt `brc`, bleibt es also rot. | „Wie das Material“ setzt bei `kind` rot/ziegel **`brk = brFallback` (holz/stein)** und löscht `brc`/`brw`. `brp` behält den Betrag, `k` wird neu. v1016 erstattet danach den Holz- bzw. Steinpreis, also nie mehr als bezahlt. Test. |
| W11 | Planken `PLANK_COLS.slice(0,5)` (ui.js:1960) | Eine alte Rote hat `plank 5` (`BR_ROT_PLANK`, brueckenfamilie.js:29). Dann wäre kein Feld „an“. | **Alle 6 Planken** und „Wie das Material“. |
| W12 | Strom: `'B'+k` mitbenutzen | `'B'+k` kann mit einem Anhöhen-Anker gleich lauten. `'W'` ist frei (gegrept). Der Block hängt an `bkOn()` (rules.js:2863), und das ist ohne Anhöhen-Brücken falsch (bruecken.js:107). | Schlüssel **`'W' + Ankerschlüssel`**, eigener Block nur an `city`, nach dem Anhöhen-Licht. |
| W13 | Verlängern nimmt „nur Eingeschaltetes“ (PLAN 1.7, brOnLook :144) | In einer Spanne mit „Licht aus (gekauft)“ wird das neue Feld vielleicht zum Anker. Das Fenster zeigt dann „Licht kaufen“, und alte Felder zahlten ein zweites Mal. | **Verlängern übernimmt gekauftes Licht und gekaufte Zacken im jeweiligen Zustand (an/aus) und bezahlt sie.** Eine Spanne hat ein Aussehen. Die Kopie bleibt bei `brOnLook`. |
| W14 | Seeweg-Warnung vorab in der Kartenkopie („bauen“) | Die Fähren stehen nach `recalc` in `T.ferries` mit `noSea` (rules.js:2745, :2781). Eine Probe vorab bräuchte je Weg `seaSearch` über ≥ 80×80 Felder. | **Erst nachher** (D3g): vor und nach `runPlan` vergleichen, dann ein Hinweis mit Rückgängig. Vorab im Schild nur, wenn Frage 6 es will. |

## 1. Schritte

Jeder Schritt läuft so ab:
1. Test zuerst.
2. `npm test` (maxWorkers 4).
3. `npm run bump`.
4. Commit auf dem Branch, kein Push.

Prüfbilder laufen nacheinander, nie parallel. Jeder Schritt ist für sich spielbar.

**D3·0 Entwurfsbild Fenster, Schild, Hinweis** (Normal, nur Bild)
- Neues Werkzeug `tools/wasserfenster-entwurf.js`. Es malt die Fenster-HTML mit dem echten `style.css` in den Zuständen aus §4.1, bei 375 px und 1024 px. Dazu kommen das Schild beim Ziehen und der Seeweg-Hinweis.
- Am Spiel ändert sich nichts. Danach Fragen 1–6 stellen, **erst dann D3e/D3f bauen**.

**D3a Setzer `brSet` übers Wasser, nichts Sichtbares** (Hoch)
```js
// bruecken.js:300  brSet: Weiche
if (ref && ref.at === 'wasser') return wbSet(ref.x, ref.y, ch);
// brueckenfamilie.js:19  W3
const def = { ...(M.lock && !(at === 'wasser' && mat === 'stein') ? M.lock : {}), ...(at === 'anhoehe' && M.anhoehe ? M.anhoehe : {}) };
// brueckenfamilie.js nach brSpanLook (:207): Felder aus dem Aussehen schreiben (build, copyClone, wbSet) – W6, W7
function brWriteLook(t, look, brk, zk) {                     // zk: Zacken gekauft 'an'|'aus' (look.zacken kennt nur „an“)
  t.brk = brk; t.brm = look.mat; t.brb = look.deck;
  const alt = look.kind === 'rot' || look.kind === 'ziegel';  // Rot/Ziegel-Farben folgen der Art (wie copyClone :558)
  if (look.col != null && !(alt && brk === look.kind)) t.brc = look.col; else delete t.brc;
  if (look.mat === 'holz' && look.plank != null && !(alt && brk === look.kind)) t.brw = look.plank; else delete t.brw;
  if (look.licht) t.brl = look.licht; else delete t.brl;
  if (look.mat === 'kristall' && zk) t.brz = zk; else delete t.brz;
  if (look.mat === 'holz' && look.stuetzen !== 'wenige') t.bru = look.stuetzen; else delete t.bru;
}
function wbSet(x, y, ch) {                                   // ganze Spanne (bridgeSpan rules.js:2028, breite Reihen mit)
  const t0 = state.tiles.get(x + ',' + y); if (!isWegBridge(t0) || !ch) return false;
  const cells = bridgeSpan(x, y), ts = cells.map(([a, b]) => state.tiles.get(a + ',' + b)), N = ts.length;
  const L = brSpanLook(x, y), A = brSpanAnchor(cells), zk0 = state.tiles.get(A[0] + ',' + A[1]).brz;
  const paid = ts.map(t => brPaid(t, 'wasser'));
  let nl = { ...L }, brk = t => bridgeKind(t), zk = L.mat === 'kristall' ? zk0 : null, per = null, mode = 'frei';
  // mat:      BR_MAT_IDS, ≠ L.mat, brMatLock(mat,'wasser'); nl = {...L, mat, kind: undefined, deck: BR_MAT[mat].deck, plank: holz ? L.plank : null,
  //           stuetzen: holz ? L.stuetzen : 'wenige', zacken: false}; zk = null; brk = () => brFallback('wasser', mat).brk;
  //           Farbe bleibt sichtbar (Frage 3): nl.col = L.col; per = wbMatPrice(nl); mode = 'mat'
  // col:      null|Index < BRIDGE_COLS.length, ≠ L.col; bei kind rot/ziegel und null: W10 (brk = brFallback, kind weg)
  // plank:    nur holz, null|Index < PLANK_COLS.length
  // deck:     nur holz/stahl/kristall (W8)
  // stuetzen: nur holz
  // zacken:   'kaufen' (nur kristall, nicht gekauft) → per = BR_OPT.zacken.feld, zk = 'an', mode = 'auf' | 'an'/'aus' gekauft → zk
  // licht:    'kaufen' → per = BR_OPT.licht.feld, nl.licht = 'an', mode = 'auf' | 'an'/'aus' gekauft
  // Geld (Bilanz null, je Rohstoff wie bruecken.js:343–344):
  //   mat: Σpaid zurück, N·per ab; brp_i = { ...per, k }      auf: N·per ab; brp_i = paid_i + per      frei: brp_i = paid_i
  for (const [i, t] of ts.entries()) { brWriteLook(t, nl, brk(t), zk); t.brp = { ...(mode === 'mat' ? per : mode === 'auf' ? brAdd({ ...paid[i] }, per) : paid[i]), k: brSig(t, 'wasser') }; }
  groundVersion++; sfx('road'); if (mode === 'mat' || 'licht' in ch) recalc(); save();   // Mauer/Durchfahrt (rules.js:1947), Strom
  return true;
}
const wbMatPrice = look => brPrice({ ...look, zacken: false }, 'wasser');   // je Feld; Fenster und Setzer aus EINER Funktion (gekauftes Licht bleibt)
const wbMaterialize = (x, y) => wbSet(x, y, { fest: true });                // kostenlos festschreiben (Verlängern, W5): mode 'frei', ohne Änderung
```
- `brk(t)` je Feld behält die Art jedes Felds, auch in gemischten Spannen. Erstattet wird je Feld genau das Bezahlte.
- `{ fest: true }` ist nur intern und kommt nie aus dem Fenster.
- **Sichtbar:** nichts, das Fenster ist unverändert.
- **Gleich:** alle Altstände, das Bild jeder einheitlichen Spanne.

**D3b Bau im neuen Format** (Hoch)
```js
// brueckenfamilie.js:158 brNewLook – Wasser nach der Spanne (W4, W13)
if (at === 'wasser' && isWegBridge(t)) return brSpanNew(x + dx, y + dy).look;
function brSpanNew(x, y) {                                  // Aussehen + gekaufte Optionen fürs Verlängern
  const L = brSpanLook(x, y), A = brSpanAnchor(bridgeSpan(x, y)), a = state.tiles.get(A[0] + ',' + A[1]);
  const zk = L.mat === 'kristall' && (a.brz === 'an' || a.brz === 'aus') ? a.brz : null;
  return { look: { ...L, zacken: !!zk }, zk };             // brPrice zählt Licht (an/aus) und Zacken mit
}
// actions.js:155–163 (nur b === 'weg'; Gleis bleibt bis E2)
if (bridge && b === 'weg') {
  const nb = DIRS.map(([dx, dy]) => [x + dx, y + dy]).find(([a, c]) => isWegBridge(state.tiles.get(a + ',' + c)));
  const nt = state.tiles.get(k);
  if (nb && !brIsNew(state.tiles.get(nb.join(',')), 'wasser')) wbMaterialize(...nb);       // W5: alte Spanne erst festschreiben
  const S = nb ? brSpanNew(...nb) : { look: brNewLook(x, y, 'wasser'), zk: null };          // derselbe Weg wie costOf (:119)
  brWriteLook(nt, S.look, S.look.kind && BR_MAT_IDS.includes(S.look.mat) && S.look.kind ? S.look.kind : brFallback('wasser', S.look.mat).brk, S.zk);
  nt.brp = { ...brPrice(S.look, 'wasser'), k: brSig(nt, 'wasser') };                      // = was costOf abgebucht hat
} else if (bridge) { /* Gleis: wie heute :156–163 */ }
// actions.js:552–560 copyClone: brWriteLook(t, look, bridgeKind(t), look.zacken ? 'an' : null) statt der Einzelzeilen (gleiches Ergebnis)
```
- `wbMaterialize` läuft in `batch` vor dem neuen Feld. `brSpanCache` leert sich über `recalc` (rules.js:829). Der Test prüft, dass costOf und der Stempel gleich sind.
- **Sichtbar:** nichts. Neue Felder lesen sich im neuen Format gleich wie bisher (gleiches Material: `col`/`plank`/`deck`/`belag` aus der Altdeutung, brueckenfamilie.js:88–90).
- **Daten:** Jede neue Wasser-Wegbrücke hat `brp`, `brk`, `brm` und `brb`.

**D3c Strom für Licht übers Wasser** (Normal)
```js
// rules.js:2867, nach dem Anhöhen-Block (W12)
if (city) {
  const wl = [], seen = new Set();
  for (const k of [...state.tiles.keys()].sort()) { const t = state.tiles.get(k); if (!isWegBridge(t) || seen.has(k)) continue;
    const cs = bridgeSpan(...keyXY(k)); cs.forEach(c => seen.add(c.join(',')));
    if (brSpanLook(...keyXY(k)).licht === 'an') { const a = 'W' + brSpanAnchor(cs).join(','); for (const _ of cs) wl.push(a); } }
  for (let i = 0; i < wl.length; i += LAMPS_PER_POWER) if (!take(1, 'brlicht')) wl.slice(i, i + LAMPS_PER_POWER).forEach(l => dark.add(l));
}
// rules.js:1918 wbGeom: anker: brSpanAnchor(bridgeSpan(x, y)).join(',')   (je groundVersion gemerkt)
// brueckenbild.js:536  dark: !!L.licht && !!(T.rail && T.rail.power) && T.rail.power.dark.has('W' + G.anker)
// ui.js:2104  const db = [...P.dark].filter(k => k[0] === 'B' || k[0] === 'W').length
```
- **Sichtbar:** nichts, Licht kann man erst mit D3e kaufen.
- **Gleich:** Strom aller bestehenden Welten. Altstände haben kein Wasser-Licht.

**D3d Fensterbaustein herauslösen, Anhöhe gleich** (Normal)
```js
// bruecken.js:720–744 → brLookHtml(L, { at, n, paid, mats, wegDa, dunkel, zk }) ; :747–753 → wireBrLook(el, set)
// Selektoren bleiben: data-bkart, data-brc, data-brw (neu: Planken), data-brb, data-bru, data-brz, data-brl
// openBkInfo nutzt beides; Planken an der Anhöhe nur nach Frage 4 (sonst opts.planken = false)
```
- **Sichtbar:** nichts. Gleiches `innerHTML` des Anhöhen-Fensters.

**D3e Wasser-Fenster** (Hoch, nach Frage 3/4)
```js
// ui.js:1955–1961  castle (isWegBridge): brLookHtml(brSpanLook(x, y), { at: 'wasser', n: span.length, paid: Σ brPaid, mats: id => wbMatPrice(Ziel) · N − Σpaid,
//   wegDa: true, deckWahl: L.mat !== 'stein', planken: L.mat === 'holz' && L.deck === 'muster', dunkel: 'W' + Anker })
//   + bei deck === 'belag': '<div class="label">Belag</div>' + wegPickHtml(t.style || 'sand', 'brs', true)    (bleibt, rules.js:2112)
// ui.js:1971  title: `Brücke aus ${BR_MAT[L.mat].name}`
// ui.js:1979  `Übers Wasser · ${n} Felder lang${breit} – Bewohner laufen gern hinüber. Material, Farbe und Licht gelten für die ganze Brücke.`
//             + (!bridgeArch(x, y) ? ' Flach: Boote kommen nicht darunter durch.' : '')
// ui.js:2072–2077  data-brk weg; wireBrLook(el, ch => { undoable(() => brSet({ at: 'wasser', x, y }, ch)); openInfo(x, y); }); data-brs bleibt
// ui.js:2148, story.js:58  „… ist das Wasser zugeschüttet oder versperrt eine flache Brücke den Weg?“
```
- **Sichtbar:** das neue Fenster (§4.1). Die Knöpfe „Ziegelbrücke“ und „Rote Bogenbrücke“ und der Hinweis „Von selbst passend zum Wegstil“ fallen weg.
- Metall, Kristall und Licht übers Wasser lassen sich jetzt kaufen.
- **Gleich:** Bild und Erstattung jeder Altbrücke, solange niemand etwas umstellt.

**D3f Schild beim Ziehen, Leiste** (Normal; die Leiste nur nach Frage 1)
```js
// plan.js:130  if (BR_PLAN_LOOK && …) { const L = brNewLook(…); BR_PLAN_LOOK.set(k, L); if (b === 'weg') wbCount(L.mat)++ }  → Rückgabe wb: [{ mat, n }]
// plan.js:322  for (const B of info.wb || []) parts.push(`🌉 Brücke: ${BR_MAT[B.mat].name} · ${B.n} ${B.n === 1 ? 'Feld' : 'Felder'}`);
// render.js:1795  weg auf Wasser: `${styleDef(…).name} · 🌉 Brücke: ${BR_MAT[brNewLook(hx, hy, 'wasser').mat].name}: −${fmt(costOf('weg', hx, hy).cost)} ${matText(…)}`
// Frage 1 = ja: brueckenfamilie.js:166 Rückfall: Leiste (decoLookNew('bruecke'), form > 0 → Material, gesperrt → Wegstil; col → brc) vor dem Wegstil
//               plan.js:301 Schlüssel: bkNewSig() auch ohne hillsOn, wenn p.tool === 'weg'
```
- **Sichtbar:** Das Schild nennt das Material. Mit Frage 1 kommt das Material aus der Leiste.

**D3g Hinweis, wenn eine Brücke einen Seeweg kappt** (Normal, nach Frage 6)
```js
// plan.js:335 runPlan: vor batch  const sea0 = new Set(T.ferries.filter(f => !f.noSea).map(f => f.stations.join('|')));
// nach batch: const cut = T.ferries.filter(f => f.noSea && sea0.has(f.stations.join('|')));
// if (cut.length && order hat Wasserfeld) toast(`⚠ Die Brücke versperrt den Seeweg ${cut[0].regions.map(regionName).join(' ↔ ')} – Boote fahren nur unter Bögen durch. ↶ macht es rückgängig.`);
```
- **Sichtbar:** ein Hinweis, nur wenn tatsächlich ein Seeweg wegfällt.
- **Gleich:** Bauen und Geld.

**D3h Geist mit Brücke beim Ziehen** (Hoch, nur nach Frage 5)
```js
// plan.js:139 nach der Schleife (PLANNED/claimed schon zurück): Karte kurz tauschen wie katBare (ui.js:157–177)
const real = state.tiles; try { state.tiles = new Map(real); for (geplantes Wasserfeld) state.tiles.set(k, wbGhostTile(x, y));   // dieselbe Funktion wie build
  wbGhost = new Map(geplant.map(k => [k, { c: wbAt(...keyXY(k)), t: state.tiles.get(k) }])); } finally { state.tiles = real; }
// Caches prüfen state.tiles (rules.js:1889, :1877, brueckenfamilie.js:209) → leeren sich von selbst
// brueckenbild.js:529 wbArgs: const t = c.t || state.tiles.get(c.k); wbRelight im Geist aus
// brueckenbild.js neben bkDrawGhost (:197): wbDrawGhost(cells, z) – ghostPaint 0,65, je Zelle wbArgs + wbPaintLage alle Lagen, ohne Licht
// render.js:2140/2243 wie PLAN_GHOST: beim letzten Feld in Maler-Reihenfolge, Rückfall nach der Schleife; Rauten render.js:1408 wc || Geist-Zelle
```
- Beim Einzelfeld (Überfahren) eine eigene Merke je Feld und `groundVersion`. Nie in jedem Bild neu tauschen.
- Während des Tauschs nie `recalc`, `seaPath` oder `seaBridgesCheck` aufrufen.

**D3i Aufräumen** (Normal)
- `drawWegBridge` und `BRIDGE_LOOK` (draw-objects.js:965–1100) entfernen. Der Zweig in `drawPath` (:1176) wird `return`.
- Tests wasserbruecken-lagen.test.js:46–50, :92 entfernen. Die Spione in wasserbruecken-reihenfolge.test.js:37–43, :90–91 kommen auf `wbArgs`/`bkDrawLagen`.
- Werkzeug-Köpfe „läuft nur bis D3“: tools/wasserbruecken-entwurf.js:145–157, tools/bogen-anhoehe-entwurf.js:43–60. Beide würfen sonst einen ReferenceError.
- CLAUDE.md-Regel „Wasser-Wegbrücken“ ergänzen: Setzer `brSet` 'wasser', `brWriteLook`, Anker stabil, `'W'`-Strom. D3 in AUFGABEN abhaken.

**D3j Leistung und Prüfbild nachher** (Normal)
- `npx vitest run tests/leistung.test.js`. Reißt eine Grenze, wird zuerst gespart, dann erst `leistung:neu` mit Begründung.

## 2. Fallen

| Bereich | Falle | Maßnahme |
|---|---|---|
| Anker | Ein gestempeltes neues Feld mit kleinerem x+y wird Anker, die Spanne springt (brueckenfamilie.js:197–205). | W5: die alte Spanne vorher festschreiben, Felder aus dem Aussehen der Spanne. Test: verlängern am −Ende einer alten Spanne, Aussehen gleich. |
| Anker | „Licht aus (gekauft)“ geht beim Verlängern verloren (`brOnLook` :144), das Fenster bietet „kaufen“ an. | W13. Test: verlängern am −Ende mit Licht aus, dann `L.licht === 'aus'`, Preis enthält das Licht. |
| Alte Stände | Rohkopie von `brm` vom v1016-Nachbarn (actions.js:159). | W6 `brWriteLook`. Test: Nachbar `brm:'stahl'` mit veraltetem `brp` → neues Feld Holz/Stein, Bilanz 0. |
| Alte Stände | Neue Werte in `brk` (Altversions-Wächter bruecken-altversion.test.js:62). | Nur `look.kind` oder `brFallback`. Wächter je Setzer. |
| Alte Stände | v1016 stellt unsere Spanne mit `setBridgeKind` um → `k` passt nicht mehr → Alttabelle. | So gewollt (≤ bezahlt). Test je Setzer: v1016-Umstellung, Erstattung ≤ `brp`. |
| Alte Stände | v1016 verlängert unsere Spanne (kopiert nur `brc`/`brw`/`brk`, kein `brp`). | Der Anker bleibt unser Feld, weil das neue Feld ohne `brp` ist. Test. |
| Alte Stände | Gemischte Spanne mit Licht: ein v1016-Feld bekommt beim Festschreiben `brl` ohne Aufpreis. | Bilanz bleibt null (nie bezahlt, nie erstattet). Hingenommen, Test hält es fest. |
| Rot/Ziegel | „Wie das Material“ wirkt nicht (W10). | Test: alte Rote → Farbe „Wie das Material“ → `brk 'holz'`, Abriss 80 + 2 Bretter + 1 Metall, v1016 30 + 2. |
| Rot/Ziegel | Materialwechsel verliert die Rückfall-Farbe. | Frage 3; `nl.col = L.col` wird ausdrücklich geschrieben. |
| Sperre | Stein übers Wasser gesperrt (W3). | `brMatLock(…, 'wasser')`. Test: ohne Klippe ist Stein frei, Kristall nennt den Grund. |
| Leiste | `decoLookNew` lässt `form 0` weg (rules.js:1732). Holz lässt sich nicht erzwingen. | Frage 1: Holz in der Leiste heißt „wie der Wegstil“. |
| Leiste | Der Schlüssel `planInfo` enthält `bkNewSig` nur mit Anhöhen (plan.js:301). | D3f: auch für `weg`. Sonst bleibt das Schild nach einer Wahl in der Leiste alt. |
| Maler | Stein mit „Eigenes Muster“ wird nicht gemalt (brueckenbild.js:534). | W8: Wahl ausblenden, `wbSet` lehnt ab. |
| Maler | Holz „An jeder Kante“: jedes Feld hat `startPost` → Bootsschnitt überall. | Prüfbild Boot unter Holz „jede“. |
| Maler | Kristall über einem Boot unter einem früheren Feld: `drawBridgeOver` malt t1/t2 nicht nach (render.js:928, karte-D2 §7). | Jetzt baubar. Im Prüfbild zeigen. Fällt es auf, kommt ein eigener kleiner Schritt (G1). |
| Geld | Fenster-Differenz und Setzer rechnen verschieden. | Beide über `wbMatPrice` und `brPaid` je Feld (C6-B5). Test: Fensterzahl = Abbuchung. |
| Geld | `setBridgeStyle` kostet je Feld den Wegpreis und behält die Art (rules.js:2120). | `brSig` bleibt gleich, `brp` bleibt gültig. Test: Belag wechseln, dann `brIsNew` weiterhin wahr. |
| Geld | Aufschütten löscht alle `BR_KEYS` und `brp` (actions.js:144). | Unverändert, Test mit Metall. |
| Cache | Material/Licht ohne `recalc` → alte `wall`/`pass`/Strom. | `wbSet`: `recalc` bei mat/licht. Test: Holz → Stein → Seeweg-Signatur neu. |
| Strom | `'B'`-Block hängt an `bkOn()` (rules.js:2863). | W12: eigener Block nur an `city`. Test ohne Anhöhen-Brücke. |
| Strom | Bildchen-Schlüssel ohne „dunkel“ (brueckenbild.js:217–218). | `recalc` zählt `groundVersion` hoch. Test: Strom weg → Bildchen neu. |
| Geist | `wbAt`, `wbArgs` und `brSpanLook` lesen `state.tiles` (brueckenbild.js:529). | D3h: Karte tauschen, `c.t`, `finally`. |
| Geist | Verlängern macht aus einem Steg einen Bogen (rules.js:1912). Gebaute Felder zeigen bis zum Bau die alte Form, es entsteht ein Knick. | Frage 5. |
| Tests | Genaues JSON neuer Wasserbrücken-Kacheln (jetzt mit `brk`/`brm`/`brb`/`brp`). | Vor D3b grepen (`toEqual({ b: 'weg'`), anpassen. |
| Tests | bruecken-geld.test.js:82 erwartet „Preis und Art vom selben Nachbarn“. | Wird nach W4/W5 umgeschrieben: Preis = Aussehen der Spanne, Bilanz 0. |
| Werkzeuge | tools/wasserbruecken-entwurf.js:145, tools/bogen-anhoehe-entwurf.js:43 lesen `drawWegBridge`. | D3i Kopfzeile „läuft nur bis D3“. |
| Leistung | `computePower` ruft `bridgeSpan` einmal je Spanne in jedem `recalc` auf. | Gemessen in D3j. Die Testwelten haben wenige Spannen. |
| Leistung | Der Geist tauscht die Karte und rechnet `wbAt` neu. | Nur bei geändertem Plan (`planMemo`, plan.js:302). Eigener Messfall „Ziehen übers Wasser“. |

## 3. Tests je Schritt

**D3a**, neu `tests/wasserbruecken-fenster.test.js` (Bilanz über `wallet()`/`diff` wie bruecken-geld.test.js):
- **Material Holz → Stein → Metall → Kristall → Holz** über 3 Felder, breit 2:
  - je Schritt Abbuchung = N·`wbMatPrice` − Σ`brPaid`,
  - Abriss aller Felder = letzter Preis, Gesamtbilanz 0 je Rohstoff.
- **Alte Rote** (`setBridgeKind(…, 'rot')`):
  - Farbe Blau → kostenlos, `brk 'rot'` bleibt, Abriss je Feld 80 + 2 Bretter + 1 Metall.
  - „Wie das Material“ → W10.
  - Material → Metall: 80 + 2 + 1 zurück, Metallpreis ab, `brk 'stein'`.
- **Alte Ziegel** (Stil `kopf`, ohne `brk`): Stein-Wahl → `false`; Farbe → `brk 'ziegel'` ausdrücklich, `brSig` gleich.
- **Zacken, Licht:**
  - kaufen = N × Aufpreis,
  - an/aus kostenlos,
  - beim Wechsel weg von Kristall verfallen die Zacken,
  - gekauftes Licht bleibt beim Materialwechsel.
- **Ablehnen:**
  - Stützen bei Stein, Deck bei Stein, Planken bei Metall,
  - Kristall ohne Kristallinsel (Grund), zu wenig Geld/Material (nichts verändert).
- **Gemischte Spanne** (Feld 1 `brk:'rot'`, Rest Holz): Festschreiben → jedes Feld erstattet sein eigenes Bezahltes, das Aussehen aller Felder ist gleich.
- **bruecken-altversion.test.js, neuer Block „Wasser, v1016 live“:** je Setzer-Ergebnis (mat × 4, col, plank, deck, stuetzen, zacken, licht, fest)
  - `brk` im alten Wortschatz,
  - v1016-Erstattung (Alttabelle nach `brk`) ≤ `brp` je Rohstoff,
  - auf v951-Felder gekürzt: `brLook` gültig,
  - Rundlauf `serialize`/`parseSave` und `liveSplit`/`liveJoin` roh.
- **Rückgängig** stellt Geld und Kacheln exakt wieder her. Zuschauer und Besuch ändern nichts (`undoable`).

**D3b**
- Neue Brücke Holz/Stein/Ziegel (Stil sand/platten/kopf):
  - `brIsNew` wahr, `brk` = Art,
  - `brLook` gleich dem Altbild (`col`, `plank`, `deck`, `belag`),
  - Abriss = Abbuchung.
- Verlängern einer alten Spanne: alle Felder danach `brIsNew`, Aussehen unverändert, Bilanz 0 (auch am −Ende).
- W6: Nachbar mit `brm:'stahl'` und veraltetem `brp` → neues Feld ohne `stahl`.
- Plan-Vorschau = Abbuchung (bruecken-geld.test.js:60, :100 bleiben grün).
- bruecken-geld.test.js:82 umschreiben (Preis vom Aussehen der Spanne).
- Unverändert grün: bruecken.test.js:36–48, :79–90, bruecken-geld.test.js:40–49, :153.

**D3c**
- Licht an, Strom reicht → `dark` ohne `'W…'`.
- Strom fehlt → `'W' + Anker` in `dark`, `powerStatus` zählt „1 Brücke“.
- Ohne Anhöhen-Brücke trotzdem gezählt.
- Bestehende Welten: `T.rail.power` gleich (neu, bruecken, freizeitpark).

**D3d**
- Fingerabdruck `innerHTML` von `openBkInfo` auf `e7a673b` für Holz leer, Holz mit Weg, Holz mit Gleis, Stein, Kristall gekauft, Licht dunkel → nach dem Herauslösen gleich.
- bruecke.test.js:552 (`[data-brc]` = 11) bleibt grün.

**D3e**
- bruecken.test.js:59–71 bleibt: `data-brc="4"`, `data-brw="1"`, `data-brc=""`.
- Neu:
  - 4 Materialknöpfe mit Differenz (= Abbuchung),
  - Kristall gesperrt mit Grund,
  - kein `data-brk` mehr,
  - Planken 7 Felder,
  - Deck nicht bei Stein,
  - Hinweis „Flach“ nur ohne Bogen,
  - Titel „Brücke aus Stein“.
- schiffe.test.js:342–350 (`/Kein Seeweg/`) bleibt grün.

**D3f**
- `planText` mit „🌉 Brücke: Holz · 2 Felder“.
- planen.test.js:80 bleibt grün (Land ohne Brückenteil).
- Frage 1 = ja: Leiste Metall → Abbuchung Metall, Schild Metall, Leiste Holz → Wegstil.

**D3g**
- Fähre A↔B, eine flache Brücke quer → Hinweis.
- Bogenbrücke mit Durchfahrt → kein Hinweis. Weg an Land → kein Hinweis.

**D3h**
- Geist: Spion auf `wbDrawGeist` genau einmal je Bild.
- `state.tiles` nach `planScan` identisch (dieselbe Map).
- `seaCache`/`wbCache` der echten Karte unverändert.

**D3i**
- `typeof drawWegBridge === 'undefined'`.
- bruecken.test.js:72–77 (`drawObject('weg', …)` auf Brücke) wirft nicht.
- paths.test.js:64 grün.

**Unverändert grün in allen Schritten:**
- brueckenfamilie.test.js
- bruecke.test.js (Anhöhe)
- bruecke-gleis.test.js:64/67/170
- wasserbruecken-bewegtes.test.js
- bogenbruecken.test.js
- neuwelt.test.js:26
- schiffe-bruecken.test.js

## 4. Prüfbilder (nacheinander)

**4.1 Fenster als Bild** (D3·0, `tools/wasserfenster-entwurf.js`, 375 px und 1024 px, hell und dunkel). Zustände:
1. Holzsteg (Stil sand, 3 Felder, flach): Stützen, Planken, Hinweis „Flach“.
2. Steinbogen auf Pflaster (6 Felder): Belag-Wahl, ohne Deck-Wahl.
3. Alte Rote (Farbe „Rot“ an, Planken 6 an).
4. Alte Ziegel (Farbe „Ziegel“ an).
5. Kristall: erst „Zacken kaufen“, danach An/Aus; Licht gekauft und dunkel (⚡-Hinweis).
6. Metall breit 2. Material Kristall gesperrt (🔒, `title`).

Grobe Ordnung (Vorschlag; das Bild entscheidet):
```
🌉 Brücke aus Holz
Übers Wasser · 3 Felder lang – … Flach: Boote kommen nicht darunter durch.
Material   [Holz ✓] [Metall · −210] [Stein · −90] [🔒 Kristall]
Farbe      [Wie das Material] ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
Deck       [Wie der Weg] [Eigenes Muster ✓]          (nicht bei Stein)
Planken    [Wie das Material] ■ ■ ■ ■ ■ ■            (Holz + Muster)
Belag      (Wegmuster-Wahl)                          (Deck = Weg)
Stützen    [Keine] [Wenige ✓] [An jeder Kante]       (Holz)
Licht      [💡 Licht kaufen −60 · 3 Metall]
[🗑️ Abreißen +90 · 6 Bretter]  [Schließen]
```
Dazu: das Schild beim Ziehen („Weg: 5 Felder · 🌉 Brücke: Stein · 3 Felder · −…“) und der Seeweg-Hinweis.

**4.2 Spielbild** (`tools/wasser-d2-pruefung.js` erweitern, feste Zeit):
- **Bauen über das Werkzeug** (nicht über gesetzte Felder): 4 Materialien × Bogen 6 / flach 1 / Steg 3, Ost-West und Nord-Süd.
  - Vorher (`e7a673b`, Stil-Brücken) und nachher **Δ = 0** für Holz/Stein/Ziegel.
- **Umstellen im Fenster:** Holz → Stein → Metall → Kristall an derselben Spanne. Boote vorher/nachher (Mauer, Durchfahrt).
- **Nacht:** Licht an mit und ohne Strom. Holz „jede“ mit Boot. Kristall über einem Boot unter einem früheren Feld (Falle).
- **Altstände:** testsave-neu/og/bauland/freizeitpark/bruecken mit glitch.js gegen die Grundlinie, Abweichung 0. Laden schreibt nichts um.
- **Geist (D3h):** Ziehen über einen Fluss bei z 0,8/1,4/2,4. Verlängern Steg → Bogen (Knick).
- **GL** gegen 2D. iPad: Fenster bei 375 px ohne waagrechtes Scrollen.

## 5. Fragen an den Nutzer (mit Empfehlung)

1. **Leiste des Brücken-Werkzeugs auch für Wege übers Wasser?** (Umsetzung von F3)
   - Das Spiel merkt sich „Holz“ in der Leiste nicht eigens. Holz heißt dort also „wie heute nach dem Wegstil“.
   - **Empfehlung:** ja. Metall, Stein und Kristall sowie die Farbe aus der Leiste gelten für neue Brücken übers Wasser. Bei Holz entscheidet der Wegstil. Das Schild zeigt das Material schon vor dem Bau (Bild 4.1).
   - **Alternative:** Übers Wasser immer nach dem Wegstil, das Material wählt man danach im Fenster.
2. **Sperren übers Wasser:**
   - **Empfehlung:** Stein frei (gibt es heute schon), Kristall ab Kristallinsel Stufe 1, Metall frei (es braucht ohnehin Metall).
   - Gesperrtes sichtbar mit 🔒 und Grund.
3. **Farbe beim Materialwechsel einer alten Roten bzw. Ziegelbrücke:** Bleibt das Rot bzw. Ziegelrot, z. B. eine rote Metallbrücke?
   - **Empfehlung:** Die sichtbare Farbe bleibt, wie an der Anhöhe. „Wie das Material“ setzt sie zurück. Bild: Rote → Metall, Ziegel → Holz.
4. **Fenster nach Bild 4.1:** Reihenfolge der Abschnitte, Material-Bildchen (Anhöhen-Bild behalten oder eigenes Wasser-Bild) und Planken-Farbe auch an Anhöhen-Brücken (C6 Frage 4).
   - **Empfehlung:** Ordnung wie oben, zuerst das Anhöhen-Bild. Planken ja, an beiden Orten gleiche Knöpfe.
5. **Geist beim Ziehen übers Wasser** (gab es nie, heute nur Rauten):
   - **Empfehlung:** ja, halb durchsichtig wie an der Anhöhe, als letzter eigener Schritt (D3h).
   - Am Übergang „Steg wird Bogen“ den kurzen Knick bis zum Bau hinnehmen; Bild vorher.
6. **Warnung „Brücke versperrt den Seeweg“:**
   - **Empfehlung:** nach dem Bau als Hinweis mit „↶ macht es rückgängig“. Das ist sicher und billig.
   - **Alternative:** vorher im Schild, in Orange. Das kostet je Plan eine Seeweg-Suche, eher etwas für G1.

Aufwand je Schritt: D3·0 Normal, D3a Hoch, D3b Hoch, D3c Normal, D3d Normal, D3e Hoch, D3f Normal, D3g Normal, D3h Hoch, D3i Normal, D3j Normal.

Die Dateien, um die es geht:
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/plan.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/story.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-geld.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-altversion.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-lagen.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/wasserbruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/testwelt-freizeitpark.test.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenschau.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasser-d2-pruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasserbruecken-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/PLAN-160c.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-D2.md
- /Users/ericwinderlich/Projekte/Spiel/plan-160c/karte-C6-fenster.md
---

## 6. Gegenprüfung (zwei Prüfer: Code, Abnahme) – Korrekturen, gelten vor dem Text oben

1. **`brWriteLook` darf gewählte Farben alter Roter/Ziegel nicht löschen.** Ist `brk === look.kind` ∈ {rot, ziegel}: rohe `brc`/`brw` der Quelle
   (Anker bzw. Original) übernehmen; nur „Wie das Material“ löscht. Setzer `col`/`plank` schreiben den gewählten Wert ausdrücklich.
   bruecken.test.js:88–89 muss grün bleiben. Test: alte Rote mit `brc 4` → Kopie, Verlängern, Festschreiben behalten 4.
2. **`brWriteLook` nur für `'wasser'`** (copyClone behandelt auch Gleis/Übergang; dort `lichtGratis`/`footPaid` wie bisher).
3. **D3i löscht nur `BRIDGE_LOOK` und `drawWegBridge`** (draw-objects.js:965–1049), **nie `archWall`** (der neue Steinmaler braucht es).
4. **W1 falsch:** `drawWegBridge` erreicht man im Spiel noch beim Tragen einer Brückenkachel mit ✋ (pickUp, render.js:1763 `ghost`, :2165 `gt`
   mit `bridge`, `drawObject('weg')` → `drawPath`). D3h zeichnet diesen Trage-Geist mit dem neuen Maler (oder bewusst nur Raute) – Test.
5. **Zusammenwachsen zweier Spannen** (von beiden Ufern bauen, Ablegen, Kopieren daneben): das Aussehen springt auf den Anker. Regel
   festlegen (Frage 7): ablehnen („zwei verschiedene Brücken – erst angleichen“) oder die angeschlossene Spanne kostenlos auf das Aussehen
   der größeren festschreiben (jedes Feld erstattet weiter sein Bezahltes). Test.
6. **W5 gestrichen:** kein `wbMaterialize` beim Verlängern; der Stempel mit `brWriteLook` aus dem Aussehen der Spanne genügt (Belag je Feld
   aus `t.style`). Falls doch festgeschrieben wird: **vor** `state.tiles.set` (actions.js:152) und still (ohne `sfx`/`save`).
7. **Gemischte Altspanne:** ein Feld mit `brk:'rot'` in Holz zeigt über `brLook` Rot; beim Festschreiben `brk = look.kind` bzw. `brFallback`,
   `brp` je Feld das Bezahlte. Test: Anker wechselt auf das frühere Rot-Feld, Bild bleibt.
8. **W10 auch für Planken** (Rote: `BR_ROT_PLANK` 5). W10 weicht von PLAN 1.4 Schritt 3 ab (dort `brk` bleibt bei Farbwechsel) – als
   Abweichung festhalten; Test.
9. **Seeweg-Hinweis (D3g) als gemeinsame Hilfsfunktion** (Fähren **und** Expeditionen vorher/nachher): nach `runPlan`, nach `brSet` im
   Fenster (Holz → Stein = Mauer) und nach Ablegen/Kopieren.
10. **Frage 1 ist entschieden** (PLAN-160c.md:4–6, F3: Material aus der Leiste). Offen nur: heißt Holz in der Leiste „wie der Wegstil“ oder
    erzwingt es Holz (`decoLookNew` lässt Form 0 weg). Nur mit `available('bruecke')`; Sperre `brMatLock(mat, 'wasser')`, eigene Kennung
    statt `bkNewSig` (prüft nur die Anhöhe).
11. **W13 weicht von PLAN 1.7/§4 Nr. 5 ab** („Verlängern zahlt nur Eingeschaltetes“) – als Frage 8 stellen (Alternative: Anker-Regel „Feld mit
    gekauftem Licht zuerst“).
12. **D3a hängt an Frage 2/3** (Sperren, Farbe beim Materialwechsel) – diese Stellen schaltbar halten oder D3a nach den Fragen.
13. **Kristall über einem Boot** (karte-D2 §7) als Frage 9 mit Bild, vor D3e (dann ist Kristall baubar).
14. **Frage 5 nur Gestaltung** (Knick, Durchsicht) – der Geist ist im Plan entschieden (PLAN:633).
15. **Tests ergänzen:** Fenster mit unbekanntem `brk` (heute TypeError ui.js:1957/:1971); bruecken.test.js:92–104 (Belag im Fenster) bleibt grün.
16. **Abriss-Preis im Bild:** feldweise („+30 · 2 Bretter“), nicht die ganze Brücke.
17. **Kleinigkeiten:** W7-Wortlaut (`brk` wird beim Umstreichen gelöscht, wenn er zum Stil passt; `brSig` bleibt gleich); W2-Wortlaut
    (setBridgeKind löscht auch `brm`/`brb`/`brl`/`brz`/`bru`); D3b `brk = S.look.kind || brFallback('wasser', S.look.mat).brk`; copyClone liest
    `brLook(t)` je Feld (Hinweis); es gibt kein `glitch.js` (Werkzeug: wasser-d2-pruefung.js); bruecken-geld.test.js:82 nur Titel ändern;
    Zeilen: render.js:1826 (`free`), :2165 (`gt`), bruecken.js:345–346, brueckenfamilie.js:165, rules.js:1951 (Mauer), :1950 (Steg → Bogen).

**Reihenfolge:** D3d (Baustein herauslösen, unsichtbar) → D3·0 (Fenster-Entwurf mit dem echten Baustein, Bilder) → Fragen 2–9 → D3a → D3b →
D3c → D3e → D3f → D3g → D3h → D3i → D3j.

## 7. Antworten des Nutzers (13.10.2026, Entwurf tools/vorschau/d3-fenster-entwurf.html)

- **Fenster:** passt so (Material, Farbe, Deck, Planken bzw. Belag, Stützen, Zacken, Licht wie an der Anhöhe); **Planken auch an der Anhöhe**.
- **Sperren übers Wasser:** Holz, Metall, Stein frei; Kristall ab Kristallinsel (🔒 mit Grund).
- **Farbe beim Materialwechsel** alter Roter/Ziegel: bleibt (wie Anhöhe); „Wie das Material“ setzt zurück.
- **Zusammenwachsen zweier Spannen:** die kürzere übernimmt kostenlos das Aussehen der längeren; jedes Feld erstattet sein Bezahltes.
- **Verlängern:** gekauftes Licht und gekaufte Zacken werden im selben Zustand mitgekauft (eine Brücke, ein Aussehen) – Abweichung von PLAN 1.7, so gewollt.
- **Leiste:** Holz = wie der Wegstil; Metall/Stein/Kristall aus der Leiste setzen das Material fest.
- **Seeweg-Warnung:** nach dem Bau (auch nach Umstellen im Fenster und Ablegen), mit „↶ macht es rückgängig“.
- **Kristall über einem Boot unter einem früheren Feld:** lösen (Glas im Bootsrahmen nachmalen, ohne Doppeldeckung), Bild zeigen.

## 8. Gegenlesen nach dem Bau (13.10.2026) – erledigt

- **Geld für ältere Fassungen:** v1016 erstattet nach `brk` (`WEG_BRIDGE`), nicht nach `brp`. `wbUnify`/`wbSet` geben einem Feld nie eine Art,
  die teurer ist als sein Bezahltes (`wbSafeKind`, `wbRawFor`). Tests: „Geld für ältere Fassungen (Gegenlesen D3)“.
- **Zusammenwachsen:** nach der längeren Brücke (Antwort §7), nicht nach Mehrheit – `wbUnify(x, y, wbS)` beim Bau.
- **Plan-Preis = Abbuchung:** geplante Nachbarfelder zählen beim Aussehen mit (`BR_PLAN_N` in `planScan`).
- **Geist:** Zacken mit (`wbGhostTile`), Leinwand auf den Bildschirm begrenzt, je Brücke eine (`wbGhostGroups`), nie im Nebel.
- **Kristall-Glas bei zwei Booten auf verschiedenen Feldern:** `WB_GLASS_LATE` zählt, das Glas kommt nach dem letzten Boot.
- **Bekannte Grenze:** Kopiert jemand eine neue Brücke in v1016 (alte App), behält die Kopie `brp`; die neue Fassung erstattet dort nach
  `brp` mehr, als die Kopie gekostet hat. Tritt nur auf, wenn alte und neue App denselben Stand bearbeiten – nicht behoben.

