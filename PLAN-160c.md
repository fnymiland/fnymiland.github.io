# Bauplan 160c – Brücken vereinheitlichen

> Entstanden 11.10.2026 (Ultracode): 6 Leser (Karten in plan-160c/karte-*.md), Lückenprüfung (plan-160c/luecken.md), 3 Architekten,
> 2 Gutachter, Zusammenführung. **Nutzer-Antworten auf F1–F4 (11.10.2026):** F1 Form übers Wasser bleibt (Block 150); **F2 Licht MIT Strom**
> (Abweichung von der Empfehlung: Brückenlicht bekommt Strom zuletzt, nach Betrieben und Zügen – bestehende Welten verlieren nichts; ohne
> Strom bleiben die Brückenlampen dunkel); F3 Material in der Leiste des Brücken-Werkzeugs; F4 schlichtes Kurvenstück bei Gleisbrücken.
> Fortschritt: in AUFGABEN.md 160c abhaken (Schritte V1 … G3).


Ich habe nur gelesen: keine Tests, kein npm, kein Browser, keine Datei geändert. Stand ist `a4806ef`, 65 Commits vor `origin/main` `b27986e` (v951).

Grundlage:
- CLAUDE.md, AUFGABEN.md Block 160 (Z. 2641–2721) und Block 150/151
- die sechs Karten und `luecken.md`
- die drei Pläne und die zwei Gutachten
- die abgenommenen Entwürfe in `tools/`

Die strittigen Stellen habe ich selbst im Code nachgesehen, unter anderem:
- `state.js:66–112`, `:312`, `:344`, `:363`
- `rules.js:1839–1935`, `:1988–2083`, `:1721–1732`, `:2784–2808`, `:3065–3071`, `:3416–3422`
- `actions.js:13–45`, `:115–176`, `:466–486`, `:528–590`
- `render.js:82–96`, `:905–945`, `:1590–1610`, `:2126–2188`
- `gl.js:673–702`, `draw-objects.js:15–56`, `:738–862`, `:946–1036`
- `bruecken.js:1–50`, `:336–420`, `ui.js:1615–1680`, `:2059–2062`
- v951 über `git show refs/remotes/origin/main:…`

---

## 0. Kurzfassung

1. **Keine Brücke zieht um (Mischform).** Die drei Träger bleiben:
   - Wasser-Weg- und Wasser-Gleisbrücken bleiben Kacheln mit `bridge`.
   - Die Fußgängerbrücke bleibt ein Schalter am Übergangsfeld (`cross`/`foot`/`footPaid`).
   - Die Brücke zwischen Anhöhen bleibt ein Bauwerk in `state.bruecken`.

   Vereinheitlicht wird, was man **sieht, wählt und bezahlt**.
2. **Ein Satz Aussehensfelder `br*`** gilt an allen drei Trägern, gelesen nur über `brLook`.
   - **„Neues Format“ heißt: ein gültiges `brp` (bezahlter Preis) ist vorhanden.**
   - Ohne `brp` deutet die Zuordnungstabelle die Altfelder (Abschnitt 1.5).
   - Damit entfällt die „Echtheitsprüfung“ aus dem Datenmodell-Plan, die eine Falle war.
3. **Altfelder behalten ihren alten Wortschatz.**
   - `brk` nur holz/stein/ziegel/rot; neu geschrieben wird nur holz oder stein.
   - `footPaid` nur true/holz/stein/weg/kristall.
   - Kacheln werden beim Laden **nie** umgeschrieben. Das hält auch im rohen Live-Spiegel (`live.js:117`), und der Cloud-Fingerabdruck (`cloud.js:63`, `tiles` steht in `SIG_KEYS`) bleibt gleich.
4. **Preis = Alterstattung des Rückfallwerts + Aufschlag.**
   - Die Untergrenze gilt damit von selbst je Rohstoff.
   - Ein älteres Gerät (v951), das eine neue Brücke abreißt, kann nie mehr erstatten als bezahlt wurde.
5. **Die Familie wird nie gespeichert, sie folgt aus dem Inhalt:** Gleis heißt Bahn (flach), sonst Fußgänger (Bogen). So gilt „Ein Gleis fährt nie über einen Bogen“ von selbst.
6. **Zeichnen über einen Lagen-Maler je Feld** (`js/brueckenbild.js`):
   - Ruhendes kommt in tileA, also ins GL-Standbild bzw. weit weg ins Bildchen.
   - In tileB werden nur die *deckenden* vorderen Lagen nachgemalt, nur bei Bewegtem und nur im Rahmen des Bewegten (Clip).
   - Glas wird genau einmal in tileB gezeichnet.
7. **Abgenommene Geometrie bleibt:**
   - Wasser: Block 150 (Höhe `archDeck`, Steinöffnungen „3, 6, 16 perfekt“, 1 Feld und Steg flach).
   - Übergang: Block 148 (`ARCH_*`, Rampen, zwei Hälften).

   Neu sind dort Bekleidung, Geländer bzw. Balustrade, Farbe und Licht. Zwischen Anhöhen kommen die neuen Modelle ganz.
8. **Reihenfolge:**
   1. Vorarbeiten
   2. Prüfstand, Format, Geld (unsichtbar)
   3. Zeichen-Gerüst
   4. Anhöhen (lokal, Entwürfe abgenommen)
   5. Wasser-Weg, dann Wasser-Gleis, dann Übergang, jeweils **zuerst ein Entwurfsbild**
   6. Abschluss

   Ab Schritt A3 ist jeder Zwischenstand sicher für einen Push.
9. **Weitere Festlegungen:**
   - `BK_READ_MAX = 8` kommt schon im Format-Schritt, gebaut wird bis 8 erst später.
   - `SIG_KEYS` bleibt, wie es ist.
   - Brückenlicht ohne Strom (Empfehlung, Frage F2).

### Korrekturen gegenüber den Vorplänen (geprüft)

| # | Behauptung in einem Vorplan | Richtig ist | Folge im Bauplan |
|---|---|---|---|
| K1 | Echtheitsprüfung „passt `brk`/`footPaid` noch zu `brm`?“ (Datenmodell) | Der Fall kommt nie bei uns an: v951 verwirft unbekannte Felder in `tileOut`, und der Live-Spiegel sendet `serialize()`. Außerdem löschen `setWegCell` (rules.js:2009), `setBridgeStyle` (:2068), `setBridgeKind` (:1996) und das Umfärben (actions.js:36) `brk`, sobald es dem Belag-Standard entspricht. Eine Prüfung auf rohes `brk` ließe Metall/Kristall nach „alle verbundenen umfärben“ still auf Stein fallen. | Gestrichen. Dafür: Format-Kennung `brp`, und jeder Setzer schreibt Material und Rückfall zusammen (Test im Altversions-Wächter). |
| K2 | Rückfall `footPaid: 'weg'` für Holz mit Belag (Datenmodell) | v951 erstattet `FOOT_STYLES.weg` = 120 + 4 Bretter + 4 Quader (rules.js:2265; v951 rules.js:3160), bezahlt wären 60 + 4 Bretter + 2 Metall. | Rückfall für Holz ist immer `'holz'`. Alte `'weg'`-Brücken behalten `'weg'`, bis jemand das Material wechselt. |
| K3 | Untergrenze nur in Talern; „kein Missbrauch möglich“ (Schritte) | Über den Rückfall wird Material getauscht: Metall-Wegbrücke wird in v951 zu 2 Quader, jede Gleisbrücke zu 40 + 2 Holz + 2 Metall (rules.js:1839). | Preis = Alterstattung des Rückfalls + Aufschlag (1.6). |
| K4 | „48 von 80 Wegbrücken in testsave-neu ohne `brk`“ | 62 von 80 (Karte Wasser-Weg 1c: 48× kopf + 14× sand) | nur Zahl |
| K5 | Liste der Stellen, die `bridgeKind` lesen | Außerdem `bridgeArchCalc` → `A.wall` (rules.js:1899, entscheidet Boote/Seewege), Ziegelmuster draw-objects.js:995/1070, plan.js:249 (Abriss-Vorschau `bkCost`), plan.js:301 (`BK_ARTEN`-Text) | alle in A4/D2 |
| K6 | `DECO_LOOKS.bruecke.cols = BRIDGE_COLS` (Schritte S8) | Farben in `DECO_LOOKS` sind Objekte `{id, name, c}` (data.js:1131 ff.), `decoLookNew` filtert `col 0` weg (rules.js:1730). | `col 0` = Farbe des Materials, `col i` = `brc i−1` |
| K7 | Lesegrenze `BK_MAX` erst mit dem Bauen bis 8 erhöhen (Datenmodell) | `state.js:363` filtert mit `BK_MAX`, Zwischenfassungen würfen 5–8 weg. | `BK_READ_MAX = 8` in A3 |
| K8 | „Wer nie gewählt hat, bekommt das Material aus dem Wegstil“ über `decoLookNew` | `form 0` (Holz) und „nie gewählt“ sind dort nicht zu unterscheiden. Außerdem setzt die Anhöhen-Leiste `paintNew.bruecke` schon heute (bruecken.js:21, ui.js:1675). | „Nie gewählt“ heißt: `state.paintNew.bruecke` fehlt (roh lesen). Lokal hingenommen. |
| K9 | „Alle Wasserbrücken raus aus dem Boden-Durchgang“ (Grafik) | Bögen sind schon draußen (render.js:1603, tileA 2063). Im Boden-Durchgang liegen nur flache Wegbrücken (1 Feld, Steg) und alle Gleisbrücken (render.js:86–96). | D1 und E1 ziehen genau diese um. |
| K10 | `glowQuad(…, 'pane')` | `glowQuad(pts, r, tint)` hat kein `part` (draw-objects.js:15); nur `punchGlow` kennt `'halo'`/`'pane'`/`'mark'`, und `'pane'` kehrt bei Blau sofort zurück (:53). | Neue Option für das Nachmalen nötig (C7) |
| K11 | „v951 erstattet am Übergang `t.price`“ (Schritte) | v951 erstattet `d.cost + ITEMS.weg.cost + Design` (v951 rules.js:3159–3162). Gegen `price` spricht etwas anderes: Aufschütten löscht in v951 nur `bridge`/`brk` (v951 actions.js:130), und dann erstattet `demolishInfo` `t.price` am normalen Weg (rules.js:3417). | Nie `price` an Brücken; eigenes Feld `brp` |
| K12 | Neue `brc`/`brw`-Werte bringen v951 zum Absturz (Schritte) | v951 prüft mit `bc ? … : {}` (v951 draw-objects.js:919–920); abstürzen kann es nur an `brk`/`footPaid`. | `PLANK_COLS[5]` darf angehängt werden. |
| K13 | Namensprüfung in `structure.test.js` (Gutachten 2) | `structure.test.js` prüft die Versionsnummern; „jeder globale Name nur in einer Datei“ steht in `tests/anhoehe-stufe2.test.js:26`. | nur Verweis |
| K14 | Freischaltung „alte Stände über `legacy`“ (Grafik) | `legacy` entsteht nur bei Ständen ohne `restore` (state.js:310). | keine `lookOk`-/legacy-Logik; Freischaltung über das Material |
| K15 | „Leute bleiben wie heute vor dem vorderen Geländer“ (Schritte S11) | Das ist ein bekannter Fehler (Karte Übergang 6a). | Figuren zwischen Deck und vorderem Geländer (D1, F1) |
| K16 | Neues Farbfeld `bmc` (Grafik) | Doppelt das vorhandene `brc`, das v951 liest | `brc` bleibt |
| K17 | Gleisbrücken vorn in tileB zeichnen (Schritte S13) | Das GL-Standbild enthält nur tileA (gl.js:690); tileB läuft nur für lebendige Felder. | Nachmal-Schema (2.5) |
| K18 | `bpr` speichert nur Taler (Schritte) | Regel 137 verlangt „was bezahlt wurde“, also auch Material. | `brp` als Objekt `{ money, bretter?, … }` |
| K19 | Strom „zuletzt“ und alter Kristall-Übergang auf „an“ (Datenmodell) | Er leuchtet heute ohne Strom (draw-objects.js:841); mit Strom könnte er dunkel werden. | 160c ohne Strom (F2) |
| K20 | (alle) | Ein neues Skript braucht `?v=N` (bump.js: Regex `\?v=(\d+)`). `load-game.js:11–13` liest die Reihenfolge aus index.html, die Tests laden es also mit. | in A2/B1 |

---

## 1. Datenmodell

### 1.1 Träger

| Träger | Speicherung | Familie | Ein Aussehen gilt für |
|---|---|---|---|
| Wasser-Weg | Kachel `b:'weg', bridge:true` | Fußgänger | Spanne `bridgeSpan` (samt breiter Reihen) |
| Wasser-Gleis | Kachel `b:'schiene', bridge:true` | Bahn | neue Spanne `brRailSpan`: über `trackLink`, nur `bridge`-Felder, Kurven mit, parallele Gleise getrennt |
| Übergang | Kachel `cross` + `foot` | Fußgänger | das Feld |
| Anhöhe | `state.bruecken` (Anker → Objekt) | Gleis → Bahn, sonst Fußgänger | das Objekt |

### 1.2 Felder (an Kachel und Bauwerk gleich benannt)

Werte sind als Text gespeichert, nur Farben als Index. Geschrieben wird nur, was vom Standard abweicht (exakter JSON-Test `bruecke.test.js:23`). Wo 0 eine Bedeutung hat, gilt `!= null`.

| Feld | Werte | fehlt = | wo | ältere Fassungen |
|---|---|---|---|---|
| `brm` | `'holz'` · `'stahl'` (heißt „Metall“) · `'stein'` · `'kristall'` | Material aus dem Altfeld (1.5) | Kachel; nur, wenn es nicht aus dem Altfeld folgt (Metall, Kristall, Bahn außer Holz) | werfen es weg und sehen den Rückfall |
| `art` | dieselben ids | `'holz'` | `state.bruecken` (gibt es schon, Wertevorrat wird erweitert) | lokale 160a/b-Fassung: unbekannt wird holz |
| `brc` | Index in `BRIDGE_COLS` (nur hinten anhängen) | Farbe des Materials | beide; gilt jetzt für **alle** Brücken | v951 liest es nur an Wegbrücken, sicher |
| `brw` | Index in `PLANK_COLS` (+ neu `[5] = '#c79a6a'`) | Planken des Materials | beide, nur Holz | sicher |
| `brb` | `'belag'` · `'muster'` | Standard des Materials: Stein = Belag, Holz/Metall/Kristall = Muster | beide | – |
| `brl` | `'an'` · `'aus'` (beides gekauft) | nicht gekauft | beide | – |
| `brz` | `'an'` · `'aus'` (gekauft) | keine Zacken (nur Kristall-Fußgänger) | beide | – |
| `bru` | `'keine'` · `'jede'` | `'wenige'` (nur Holz-Fußgänger) | beide | – |
| `brp` | `{ money, bretter?, quader?, metall?, kristall?, holz?, k }`, ganze Zahlen ≥ 0, nur bekannte Rohstoffe; **`k` = `brSig`** (wofür bezahlt: `w:<Art>`, `g:1`, `u:<Design>`, `a:<art>`). Passt `k` nicht mehr zu den Altfeldern, ist `brp` veraltet (Nachtrag 12.10.: die live Fassung v1016 behält `brp`, stellt aber Art/Design um, ohne es anzufassen) – gelesen nur über `brIsNew`, geschrieben über `brStamp` | **alter Stand**: Erstattung nach eingefrorener Alttabelle, Aussehen nach 1.5 | beide | verworfen, dann wird nach dem Rückfall erstattet (≤ bezahlt) |

Weitere Regeln:
- `BR_KEYS = ['brm','brc','brw','brb','brl','brz','bru']`, dazu `brp` gesondert.
- Sie stehen an einer Stelle für `tileOut`, Verlängern, Aufschütten (löscht alle), Kopie und die Signatur der Bildchen.
- Ich habe gegrept: keiner dieser Namen und kein `br[A-Z]`-Funktionsname ist belegt.
- Nie `arch*`, `bridge*`, `lantern*` verwenden (luecken A4, B5).

### 1.3 Lesen: eine Funktion, nie werfen (Kacheln kommen im Live-Spiegel roh an)

```js
// at: 'wasser' | 'gleis' | 'uebergang' | 'anhoehe'
function brLook(o, at) {
  const L = brLegacyLook(o, at);                      // nur Altfelder (Tabelle 1.5), jeder Wert mit Rückfall
  if (!brPaidOk(o.brp)) return L;                      // kein gültiges brp = alter Stand
  const id = at === 'anhoehe' ? o.art : o.brm, mat = BR_MAT[id] ? id : L.mat, M = BR_MAT[mat];
  return { at, fam: L.fam, mat,
    col: brPal(BRIDGE_COLS, o.brc), plank: brPal(PLANK_COLS, o.brw),          // null = Materialfarbe
    deck: o.brb === 'belag' || o.brb === 'muster' ? o.brb : M.deck,
    licht: o.brl === 'an' || o.brl === 'aus' ? o.brl : null,
    zacken: mat === 'kristall' && L.fam === 'fuss' && o.brz === 'an',
    stuetzen: o.bru === 'keine' || o.bru === 'jede' ? o.bru : 'wenige' };
}
```

- Die Familie liefert `brLegacyLook`:
  - `at === 'gleis'` heißt Bahn.
  - Bei `'anhoehe'` heißt `bkRailAny(b)` Bahn, sonst Fußgänger.
  - Sonst Fußgänger.
- **Ein Aussehen je Brücke:** `brSpanLook(x, y)` nimmt den Anker der Spanne und merkt ihn je `groundVersion` (neben `bridgeArchCache`).
  - Anker ist unter den Feldern mit gültigem `brp` das mit kleinstem x+y, dann x. Gibt es keines, das kleinste überhaupt.
  - So zeichnet sich eine von v951 verlängerte Spanne (neues Feld ohne `brp`) wie die Brücke selbst.
- **Nie `TABELLE[roh].x` ohne Rückfall** (heute führen fremde Werte zum TypeError, Karte Übergang R23).
- `brClean(o)` prüft dasselbe streng und läuft nur in `parseSave` für `state.bruecken`. Kacheln werden **nicht** bereinigt.

### 1.4 Schreiben

- **Ein Setzer `brSet(ziel, änderung)`.** Das Ziel ist Spanne, Feld oder Objekt; die Änderung ist eines von Material, Farbe, Planken, Belag/Muster, Licht, Zacken, Stützen. Ablauf:
  1. `brMaterialize` je Feld: das gelesene Aussehen wird ausdrücklich geschrieben, dazu `brp` = `brPaid` (bei Altständen der Alttabellenwert).
  2. Geld nach 1.7.
  3. Rückfallfeld nach 1.6, **nur bei Materialwechsel**. Sonst bleibt das Altfeld, z. B. `brk: 'rot'` oder `footPaid: 'weg'`; v951 erstattet dann weiter genau das Bezahlte.
  4. `groundVersion++`; `recalc()`, wenn sich Durchfahrt, Böcke oder Pfeiler ändern (`seaBridgesCheck` läuft nur dort, rules.js:829; luecken B16); dann `save`.
- **Fensterknöpfe immer in `undoable`.** Das bringt Rückgängig, `cloudTouched`, die Sperren `viewOnly`/`cloudWatching` und `bruecken` ohne `SIG_KEYS`.
- **Neue Werte nie in `brk`/`footPaid`.** Neu geschrieben werden nur `brk` holz/stein und `footPaid` holz/stein/kristall; alte ziegel/rot/weg bleiben stehen, bis das Material wechselt.
- **Nie `price`** an Brücken- oder Übergangskacheln (K11).
- **Gebaut wird im neuen Format erst ab dem Schritt des jeweiligen Orts** (D3/E2/F1/C6). Bis dahin schreibt `build` kein `brp`, damit Format-Kennung und altes Zeichnen nie auseinanderlaufen.

### 1.5 Zuordnungstabelle alt → neu (Lesen ohne `brp`; Nutzerentscheidung „neue Modelle, so nah wie möglich“)

**Wasser-Weg.** Die alte Art liest `bridgeKind(t)` = `brk`, sonst Stil (rules.js:1866).

| alte Art | erkennbar an | Material | `brc` | `brw` | Deck | Licht | Stützen |
|---|---|---|---|---|---|---|---|
| Holzsteg | `brk` holz oder Stil sand/mulch/tritt | holz | gespeichert | gespeichert | Muster (Planken) | – | wenige |
| Steinbogen | `brk` stein oder anderer Stil (auch `m:`) | stein | gespeichert | – | Belag = `t.style` | – | Öffnungen Block 150 |
| Ziegel | `brk` ziegel oder kopf/klinker/terrakotta/fisch/blueten | stein | gespeichert, **sonst 8** (`#b5654a` = alte Ziegelseite) | – | Belag | – | dto. |
| Rot | `brk` rot | holz | gespeichert, **sonst 3** (`#d9483b`) | gespeichert, **sonst 5** (neu `#c79a6a`) | Muster | – | wenige |

**Weitere Träger**

| Ort, alter Wert | Material | Sonstiges |
|---|---|---|
| Gleis auf Wasser (alle) | holz | `brc` wie gespeichert (meist leer); Gleisbett `t.form` bleibt |
| Übergang `footPaid` true/holz | holz | Muster |
| Übergang stein | stein | **Muster** (die alte Steinbrücke zeigt ihr eigenes Deck, nicht den Weg) |
| Übergang kristall | kristall | Muster, **Licht an**, ohne Aufpreis (leuchtet heute schon) |
| Übergang weg („Wie der Weg“, og: Fischgrät) | holz | Belag = `t.style`. In F1 wahlweise `brc` als nächster Palettenton zur Randfarbe des Belags (mit Bild vorher/nachher). |
| Übergang `foot` ohne `footPaid` | holz | Erstattung 0 (wie heute) |
| Übergang mit Schranken, `footPaid` gesetzt | wie oben | gilt erst beim Einschalten |
| Anhöhe holz bzw. stahl, mit Weg | holz bzw. stahl, Fußgänger-Bogen | **Belag** (heute liegt der Weg auf dem Deck, luecken B7) |
| Anhöhe holz mit Gleis | holz, Bahn | Böcke an jeder inneren Kante |
| Anhöhe stahl mit Gleis | stahl, Bahn | Fachwerk (≈ alter Stahl) |
| Anhöhe leer | wie `art`, Fußgänger-Bogen | Muster |

### 1.6 Rückfall neu → alt und Preisregel

Grundpreis neu = **Erstattung des Rückfalls in v951 + Aufschlag**. Das hält je Rohstoff, ohne eigene Prüfung; ein Test (A3) rechnet es für alle Kombinationen nach.

| Ort | Material | geschrieben | v951 erstattet | vorläufiger Grundpreis |
|---|---|---|---|---|
| Wasser-Weg (je Feld) | holz | `brk:'holz'` (bzw. weggelassen wie heute) | 30 + 2 Bretter | **= alt** |
| | stein | `brk:'stein'` (dto.) | 60 + 2 Quader | **= alt** |
| | stahl | `brk:'stein'` + `brm` | 60 + 2 Q | 100 + 2 Q + 2 Metall |
| | kristall | `brk:'stein'` + `brm` | 60 + 2 Q | 400 + 2 Q + 3 Kristall + 1 Metall |
| Wasser-Gleis (je Feld) | holz | – | 40 + 2 Holz + 2 Metall (`BRIDGE`) | **= alt** |
| | stein | `brm` | dto. | 80 + 2 H + 2 M + 3 Q |
| | stahl | `brm` | dto. | 100 + 2 H + 4 M |
| | kristall | `brm` | dto. | 600 + 2 H + 2 M + 4 K |
| Übergang (ganze Brücke) | holz (Muster oder Belag) | `footPaid:'holz'` | 60 + 4 B + 2 M | **= alt** |
| | stein | `'stein'` | 150 + 8 Q | **= alt** |
| | stahl | `'holz'` + `brm` | 60 + 4 B + 2 M | 200 + 4 B + 6 M |
| | kristall | `'kristall'` | 300 + 5 K + 2 M | 1500 + 10 K + 2 M |
| Anhöhe (je Feld; nur lokal) | holz / stahl | `art` | – | = alt (60 + 3 B / 120 + 3 M) |
| | stein / kristall | `art` | alte lokale Fassung: wie holz | 120 + 3 Q / 800 + 4 K + 1 M |

- Bei Anhöhen gibt es keine Untergrenze; sie betreffen nur eigene Geräte und sind hingenommen.
- **Optionen:**
  - Licht je Feld +20 + 1 Metall (Übergang +60 + 2 Metall).
  - Zacken je Feld +150 + 2 Kristall (Übergang +400 + 5 Kristall).
  - Farbe, Planken und Stützen kostenlos.
  - Belag kostet wie heute den Wegpreis je geändertem Feld (`setBridgeStyle`).
- Alles ist vorläufig, das Geldgespräch kommt später. Die Werte stehen an **einer** Stelle (`BR_COST` in brueckenfamilie.js).

### 1.7 Geld

**Grundsätze**
- **Bau** je Feld: `brPrice(look, at)`; `brp` = genau das. Weg und Gleis auf einem Anhöhen-Deck zahlen weiter je Feld extra (`bkLayWeg`/`bkLayRail`).
- **Material wechseln:** je Feld `brPaid` voll zurück, dann den neuen Grundpreis plus gekaufte Optionen (soweit beim neuen Material möglich) zum aktuellen Preis zahlen; `brp` neu.
- **Option kaufen:** Aufpreis zahlen, `brp` += Aufpreis. **An/aus kostenlos, bezahlt bleibt bezahlt** (Regel 137). Damit kostet z. B. „Licht aus“ an einem alten Kristall-Übergang nie den fürstlichen Neupreis.
- **Abriss:** `brPaid` voll zurück (wie Wege; `demolishInfo` `full`).
- **Aufschütten:** `brPaid` minus Weg- bzw. Schienenpreis zurück. Gelöscht werden `bridge`, `brk`, **alle** `BR_KEYS` und `brp`; heute bleiben `brc`/`brw` stehen (actions.js:144).
- **Kopie:** zahlt `brPrice` des Aussehens nur mit **eingeschalteten** Optionen; ausgeschaltete gekaufte Optionen fallen in der Kopie weg; `brp` = Kopierpreis. Übergang mit Schranken: `footPaid` und `br*` fallen weg (V3).
- **Verlängern:** das neue Feld übernimmt die `BR_KEYS` des Nachbarn (kein `brp`, nur Eingeschaltetes) und zahlt den eigenen Preis.
- **Alte Brücken ohne `brp`:** Erstattung nach den eingefrorenen Alttabellen `WEG_BRIDGE` (rules.js:1859), `BRIDGE` (:1839), `FOOT_STYLES` (:2262), `BK_ARTEN` (bruecken.js:11). Ein Test hält deren Werte fest.

**Alle Kostenstellen auf `brPrice`/`brPaid` umstellen**
- **rules.js:**
  - `costOf` 2079–2083 und `newBridgeKind` 2078 (bei mehreren geplanten Feldern zählen die Nachbarn mit, Fehler M)
  - `setBridgeKind` 1988, `setBridgeStyle` 2060, `setBridgeColor` 2073
  - `setCrossing` 2290
  - `fullValue` 3065–3071 (heute ohne Wegbrücke, Übergang und Gleis-Material)
  - `demolishInfo` 3416–3422
- **actions.js:** Umfärben 36, Aufschütten 141–146, Verlängern 155–158, `addFloat` 175, `copyClone` 530, `copyTileCost` 577–590.
- **plan.js:** `planCheck` 65–90, `planScan`, Abriss-Vorschau 249, `planText` 301, `planInfo`-Schlüssel 285 (+ `brNewSig()`).
- **render.js:** Hinweis 1759–1763 (`c === BRIDGE` bricht).
- **bruecken.js:** `bkCost` 20, `bkBuild` 141, `bkDemolish*` 152–178, `bkSetArt` 180.
- **data.js:** `ITEMS.schiene.desc` 88 (fester Preistext), `ITEMS.bruecke` 206 (Getter wie `huegelrampe` 212–214).

### 1.8 Wahl für Neues

- `state.paintNew.bruecke = { form, col }` über `DECO_LOOKS.bruecke` (data.js:1147).
  - `forms` = holz, stahl (Name „Metall“), **stein, kristall angehängt**.
  - `cols` = `[{id:'mat', name:'wie das Material', …}, ...BRIDGE_COL_DEFS]`, also `col i` = `brc i−1`.
  - `BRIDGE_COLS`/`PLANK_COLS` ziehen dafür nach data.js: als `BRIDGE_COL_DEFS` mit `{id, name, c}`, `BRIDGE_COLS = …map(c => c.c)`. Aus draw-objects.js:950–951 entfernen.
- `brNewLook(at)`:
  1. Nachbar beim Verlängern;
  2. sonst `paintNew.bruecke`, wenn vorhanden (roh);
  3. sonst wie heute: Weg nach Belag (über `brLegacyLook({style: currentStyle('weg')})`, also auch die Ziegelfarbe für kopf usw.), Gleis Holz.

  Licht aus, Zacken aus, Stützen „wenige“. Licht, Zacken und Stützen gibt es nur im Fenster.
- Kein neuer `paintNew`-Schlüssel; `parseSave` würde ihn verwerfen (state.js:312).

### 1.9 Datenwege

| Weg | Kacheln | `state.bruecken` |
|---|---|---|
| `serialize` | `tileOut` schreibt `BR_KEYS` und `brp` (Kopie), nur wenn gesetzt | nur Abweichungen; `art` roh nur bei gültiger id |
| `parseSave` (Start, Datei, Cloud, Sicherung, Live-Ganzstand) | roh (state.js:344); `brLook` deutet beim Lesen | streng über `brClean`; `n` 1…`BK_READ_MAX` (8) |
| Live einzelne Felder (`liveApplyMaps`, live.js:110–128) | roh, danach `recalc` → `groundVersion++` | – (liegt im Rest, läuft über `parseSave`) |
| Cloud-Fingerabdruck | Laden schreibt nichts um, also kein „geändert“ (Test) | `bruecken` bleibt ohne `SIG_KEYS`; alle Setzer laufen über `undoable` |
| Besuch | speichert nie; Knöpfe gesperrt über `undoable` (`viewOnly`) | dto. |
| Freund mit v951 sieht meine Insel | Rückfall `brk`/`footPaid`, kein Absturz | sieht keine Anhöhen-Brücken (seit 157) |
| Eigenes v951-Gerät führt und speichert | `br*`/`brp` gehen verloren; Aussehen und Erstattung fallen auf den Rückfall (≤ bezahlt) | verliert **alle** Anhöhen und Brücken. Beim Push von 157 + 160 alle Geräte neu laden. |
| Eigene lokale Zwischenfassung | – | n > Lesegrenze fällt weg, unbekannte `art` wird holz. Nach jedem Schritt die WLAN-Geräte neu laden. |

Eine Spielstand-Version (`v`) wird nicht gebraucht.

---

## 2. Zeichenkonzept

### 2.1 Dateien und API

- **`js/brueckenfamilie.js`** (Daten, Geld, Setzer) und **`js/brueckenbild.js`** (Zeichnen), in index.html **nach `bruecken.js`** und vor `draw-wonders.js`, beide mit `?v=N`.
  - Auf oberster Ebene dürfen sie `HILL_H`, `BK_W` und `BRIDGE_COLS` nutzen.
  - rules.js, state.js und actions.js rufen sie nur zur Laufzeit.
- **Kern-API (Vorsilbe `br`):**
  - **Lesen:** `brLook`, `brLegacyLook`, `brSpanLook`, `brNewLook`
  - **Geld:** `brPrice`, `brPaid`, `brPaidOk`
  - **Setzer:** `brSet`, `brMaterialize`
  - **Geometrie:** `brGeom(x, y)` (Span-Objekt, gemerkt je `groundVersion`), `brSupports(look, G)` (Stützenkanten), `brClear(G, t)` (Lichtraum)
  - **Zeichnen:** `brBox(G, i, lage)` (Rahmen für Bildchen/GL), `brPaint(P, z, look, G, t0, t1, lage, opts)`
  - **Bewegtes und Antippen:** `brLiftAt(px, py)` (Figurenhöhe), `brPick(sx, sy)` (Antippen), `brCarPieces(m)` (verallgemeinert `bkCarPieces`, bruecken.js:318)
  - **Bildchen:** `brIcon(fam, mat, opts)`
  - `bkPaint`, `drawWegBridge`, `archWall`, das Brückenstück in `drawRailBed` und die Bekleidung in `drawArch` werden nach und nach Aufrufer.

### 2.2 Grundgesetze

| # | Regel | Grund |
|---|---|---|
| G1 | **Prisma:** Ein Feld zeichnet nur in u∈[x−½, x+½), v∈[y−½, y+½), Höhe beliebig. Felder derselben Diagonale verdecken sich nie. | Die Maler-Reihenfolge (render.js:1550, Diagonale, dann x) ist dafür exakt. |
| G2 | **Lagen je Feld:** L1 hinten · U Bewegtes darunter · L3 vorn unten · L4 Deck · A Bewegtes darauf · L6 vorn oben. Zuordnung nach Außennormale (n_u + n_v < 0 heißt hinten). | Ost-West, Nord-Süd und Kurven ohne Sonderfälle |
| G3 | **Kanten:** Was genau auf einer Kachelkante steht (Stütze, Bock, Pfeiler, Laterne der Kante, Fuge), zeichnet das **spätere** Feld in L1; Intervalle halboffen. An Wand bzw. Ufer zeichnet das angrenzende Brückenfeld. | wie Linien (Regel 61); keine Doppelstriche |
| G4 | **Schneiden nur im Parameterraum**; Stützpunkte im Weltraster (k/4, k/9 …) plus exakte Feldenden. Deckende Flächen ragen 0,012 ins nächste Feld, Durchsichtiges nie, das letzte Feld nie. | keine Treppen, keine Fugen unter Windows |
| G5 | **Nachgemalt wird nur Deckendes, nur bei Bewegtem, nur im Rahmen des Bewegten (Clip).** Halbdurchsichtige Striche (Fugen `rgba(150,135,110,.45)`, Rost `.35`/`.25`, `BK_LOOK.line`) werden deckende Mischfarben (`mix`). Glas (K1 .42/.3, Band .78) genau einmal in tileB. | Doppelte Deckkraft würde flackern, sobald eine Figur aufs Feld tritt. |
| G6 | **Bewegtes zuordnen:** Wagen an Feldkanten schneiden (`car.cut`), Figuren auf dem Deck ins vorderste Feld unter dem Fußkreis, Boote wie heute (`m.under`, render.js:1831–1836). | sonst malt das Nachbardeck über Füße und Wagenenden |
| G7 | **Licht:** `glowQuad` erst **nach** dem Leuchtenden, nur warm oder `'blue'`. Beim Nachmalen nur Scheiben neu stanzen (neue Option, K10), nie nach `drawNight`. | Regeln 44, 112, 143 |
| G8 | **Eine Quelle je Größe:** h(t), `brClear`, `brBox`, `brLiftAt`, `brPick`, Öffnungen (Zeichnen **und** `archBoatOk`/`seaCross`) | Bild, Boote, Figuren, Antippen und Rahmen laufen nie auseinander |
| G9 | **Nie abstürzen:** Rückfall je Wert, Farbindex begrenzen, `Math.max(0, …)` vor `sqrt`/`arc` (Regel 37), kein NaN bei n = 1 | Live-Spiegel, Freunde |
| G10 | **Ohne Brücken alles wie vorher:** früh aussteigen über `bkOn()` bzw. die Spanne, nie über `hillsOn()` (Karte Anhöhen R1) | Leistung |
| G11 | **Beide Achsen:** Stirn, Träger und Bogen nach Normale schattiert (Regel 16; bei Nord-Süd zeigt die Vorderseite nach +x, also `LIGHT.side`); Geländer nicht. Jedes Prüfbild in beiden Achsen. | CLAUDE.md:576 |

### 2.3 Geometrie je Ort

| Ort | Profil h(t) | Boden darunter | Enden | halbe Breite W | Öffnungen / Stützen |
|---|---|---|---|---|---|
| Anhöhe, Fußgänger | `HILL_H + pk·sin(π(t−A)/n)`, pk = ½·20,4·(n/2)^0,6; n = 1: Buckel 5 | Land 0, Wasser −6,3 | Wand/Wand | **`BK_W` 0,4** (Entwurf 0,3: Abstände neu abnehmen) | Holz: Stützen auf Kanten nach `bru`; Stein: Pfeiler je 2 Felder (Ansatz 13, über dem Scheitel 7,5, Stufe 3) |
| Anhöhe, Bahn | `HILL_H` | dto. | Wand/Wand | 0,4 | Holz: Bock an jeder inneren Kante; Stein: Viadukt flach |
| Wasser-Weg, Bogen (≥ 2, Land an beiden Enden) | `archDeck` (Block 150, unverändert) | −6,3 | Ufer/Ufer | `EDGE_W` 0,36 | Stein: `archOpenings` unverändert; Holz: Stützen auf Kanten (Boote fahren durch die Feldmitten, `archBoatOk` gilt weiter) |
| Wasser-Weg, 1 Feld / Steg | flach `LIFT` mit Rampen an Land (wie heute) | −6,3 | Ufer/offen | 0,36 | offenes Ende: Stirn und Quergeländer |
| Wasser-Gleis | 0 (Landhöhe, Züge nicht angehoben) | −6,3 | aus den Armen | 0,3 | Holz: Böcke als Stummel ohne Kreuz (6,3 px); Stein: flache Mauer mit angedeuteten Bögen in deckender Mischfarbe; Metall/Kristall: Fachwerk nur auf geraden Läufen |
| Übergang | `archH(b)`, b∈[−0,9, 0,9] (Block 148) | 0 (+ Hub der Anhöhe) | Rampen | `ARCH_W` 0,37 | eine Öffnung über dem Gleis (`ARCH_CLEAR` 16) |

- **`brClear(G, t)`** zählt Laibung, Glasband, Zacken und Träger. Es ersetzt das feste `BK_CLEAR` (bruecken.js:16) in `bkTooTall`, `bkUnderError`, `smallError` (rules.js:1656/1680) und für Züge darunter (Zughöhe 13, ≥ 16 an der Feldmitte). Die Zacken reichen höchstens bis H − 6, übers Wasser bis über die Bootsdurchfahrt.
- **Laibung (Stein):** glatt, ohne die `Math.min`-Klemme des Entwurfs (Knick an der Wand). Es ist ein Band zwischen vorderer und hinterer Bogenlinie samt Pfeiler-Seitenflächen, je Feld nur die eigenen, zur Kamera gerichteten Vierecke, in L1 vor dem Deck. Es gibt keine Rechteckplatte mehr (Entwurfsfehler „helle Platte“).
- **Widerlager:** Ein Band in L1 an der Wand der **nahen** Anhöhe deckt Grasnarbe und dunkle Kante in der ersten Öffnung. An der fernen Anhöhe wird nichts über U1 gezeichnet; Linienenden dort `butt`.

### 2.4 Lagen je Modell (Bezug `tools/brueckenlicht-entwurf.js`)

| Modell | L1 hinten | L3 vorn unten | L4 Deck | L6 vorn oben | nur tileB |
|---|---|---|---|---|---|
| Fußgänger Holz (3b) | Stützen der hinteren Kante, Kreuzstreben, hinteres Geländer (+6) | Randbalken, Hänger je ½, Bogenträger | Belag bzw. Planken (deckend) | vorderes Geländer (+6/+3), Lichtpunkte je ½ | – |
| Fußgänger Stein | hintere Balustrade, Laibung, Widerlager | Stirn als Band (Öffnungen = Unterkante, kein `evenodd`), Bogenkante | Belag + Fugen (Mischfarbe) | vordere Balustrade, Minilaternen je innere Kante | – |
| Fußgänger Metall | hinteres Geländer (+6,5) | Träger, Hänger je ⅓, Stahlbogen + Glanz | Gitterrost (Mischfarbe) | vorderes Geländer, Punkte je ½ | – |
| Fußgänger Kristall K1 | hinteres Glasgeländer (darf in tileA, wird nie nachgemalt), hinterer blauer Streifen | – | Belag `#e6f6fc` + Linien | – | t1: Glasband, Zacken, Kantenglanz; t2: vorderes Glas, Pfosten je ¼, Handlauf, Streifen |
| Bahn Holz | Böcke der hinteren Kante, hinteres Geländer (+8) | Längsträger | Deck, Planken, Gleis (`drawRailBed` mit `armsIn`) | vorderes Geländer, Punkte je ½ | – |
| Bahn Stein | wie Fußgänger Stein, pk 0 | Stirn | Deck + Gleis | Balustrade + Minilaternen | – |
| Bahn Metall | hinteres Fachwerk | Träger | Deck + Gleis | vorderes Fachwerk, Punkte am Obergurt | – |
| Bahn Kristall B2 | hinteres Fachwerk, Streifen | Träger | Deck + Gleis | vorderes Fachwerk, Glanz, Streifen | – (alles deckend) |

### 2.5 Ablauf in render.js

```
vor der Feldschleife (byTile):
  Zug über/auf Brückenfeld → brCarPieces: Stücke an Feldkanten (wie bkCarPieces), je Stück in sein Feld
  Figur auf Deck/Bogen → vorderstes Feld unter dem Fußkreis, Seite 'auf'
  Boot → wie heute (m.under)
tileA(x, y):
  … Anhöhe, Linien hinten …
  Deko HINTER (je Achse: O-W 0,1,5,8 · N-S 0,2,4,8; nicht SLOTS_BACK/FRONT, rules.js:1156)
  Brücke ohne Deko darunter → Bildchen/live 'a' (L1+L3+L4+L6 deckend; Kristall nur L1+L4)
  mit Deko darunter         → L1, Deko UNTER (O-W 4,6,9 · N-S 5,7,9), L3+L4, L6
  Deko VOR (O-W 2,3,7 · N-S 1,3,6)
tileB(x, y):
  U (Bewegtes darunter) → Clip auf Rahmen des Bewegten: L3+L4+L6 nachmalen; Boot: m.under wie heute (drawBridgeOver = dieses Nachmalen)
  Kristall: t1
  A (Bewegtes darauf)   → danach Clip: L6 nachmalen, Deko VOR des Felds erneut, falls im Rahmen
  Kristall: t2
  … Dächer wie bisher
```

- **Nachmalen weit weg:** über das Bildchen der Lage (`…|o`, `…|f`), das bei Bedarf entsteht; sonst live.
- **Blass** (Durchsicht, darunter bauen): nie nachmalen.
- **GL** (gl.js:673–702): tileA liegt im Standbild. tileB läuft nur für Felder mit Bewegtem (über `byTile` schon in `ev`) und für Kristallfelder (`brLiveTiles`); `bkLiveTiles` (gl.js:681) wird dadurch ersetzt.
- **`glBgStep`:** neue Zustandslisten (Nachmal-Listen, Deko-Gruppen) beiseitelegen und zurückholen (Regel 144).

### 2.6 Bildchen, Rahmen, Nacht, Schatten

- **Schlüssel** `br|x,y|lage|FOG|lit`, Fassung `groundVersion`, je Platz und nie geteilt; zu jedem Schlüssel `if (preLit()) prewarm(keyOf(1), …)` (Regel 143).
  - Jeder Setzer zählt `groundVersion` hoch.
  - `lookThumb` bekommt einen Schlüssel aus Familie, Material, Farbe, Licht und Zacken (heute `b|form|col`, ui.js:1620; `col` wird für Brücken nicht übergeben, :1633).
- **`brBox`** aus der Geometrie (Scheitel + Aufbau der Lage + Laternenhöhe + Lampenradius) für `paintSprite` und `glLive`. Er ersetzt 70·z (render.js:2140), `(HILL_H+44)·z` (:2187), 150·z (:2148) und `peak+30` (:928/932).
- **Nacht:**
  - Warme Scheibe nur Glas bzw. Kappe (wird flach `#ffd873`).
  - Kristall immer `'blue'`.
  - „Licht nicht gekauft“ heißt: keine Lampen; „aus“ heißt: Lampen grau `#9a978c`, kein `glowQuad`.
  - `drawFn` wiederholbar, `night` zur Malzeit lesen (Löschbild).
- **Schatten:**
  - Nur zwischen Anhöhen auf Land, ein Pfad, `nonzero`. Deck um SUN·h(t) je Stützpunkt versetzt, Stein-Stirnen als Band, Tunnelboden ohne Versatz.
  - Der `want`-Rand muss ~0,9 Felder Schattenweite abdecken.
  - Übers Wasser keiner (Block 150), am Übergang keiner (wie heute).
- **Geister:** je Feld in eine Zwischenleinwand, dann mit 0,65 einsetzen, ohne Licht. Der Geist eines Wegs bzw. Gleises auf Wasser zeigt die Brücke (heute ohne `bridge`, render.js:2119).

### 2.7 Grafikfehler-Fallen und Gegenmaßnahmen

| # | Falle | Gegenmaßnahme | Prüfung |
|---|---|---|---|
| 1 | Hohes im Boden-Durchgang wird von allem dahinter übermalt | flache Wegbrücken (D1) und Gleisbrücken (E1) nach tileA; `liveFlatSet`/`cachedPath` stimmig halten | webgl.test (`liveFlatSet`), bruecken.test:107 |
| 2 | Teile ragen ins Nachbarprisma (Rundkappen, Laternenkappen, Rampen) | G1 | Prisma-Test (alle `P()` in [t0−0,013, t1+0,013]) |
| 3 | Doppelte Kantenstriche, helle Nähte | G3/G4 | Nahaufnahme, glitch.js |
| 4 | Knick an der Wand, Platte am Pfeiler, Öffnung ohne Tiefe, hintere Stirn fehlt, Schatten der Öffnungen fehlt, Ausschnitt an der fernen Anhöhe | 2.3 Laibung/Widerlager/Tunnelschatten, nichts über U1 | Prüfliste aus AUFGABEN.md:2697–2700, Nahaufnahmen beider Achsen |
| 5 | Tunnelinneres „über mehrere Felder“ übermalt ein Boot im Nachbarfeld (`archWall` heute) | je Feld nur das eigene u-Stück | Bild mit Boot unter hinterer Reihe |
| 6 | Deko vor der Brücke von der Stirn übermalt; O-W Platz 1 bzw. N-S Platz 2 falsch vorn | Deko-Gruppen je Achse | Reihenfolge-Test (Spion) |
| 7 | Zug unten quer: Nachbardeck schneidet ihn; Zug oben: Wagenende übermalt | Wagen schneiden, dann L6 | glitch.js mit Zug |
| 8 | Figur vor dem vorderen Geländer (heute Wasserbogen, `archWalkers`) | Figuren als „auf“ zwischen L4 und L6 | Bild |
| 9 | Glas, Fugen oder Rost dunkler, sobald jemand drauf ist | G5 | „Deckend“-Test (kein Alpha < 1, kein `globalAlpha` < 1 in nachgemalten Lagen) |
| 10 | Schein doppelt hell beim Nachmalen | nur Scheiben (K10) | Zahl der Scheine mit und ohne Figur gleich |
| 11 | Deck verdeckt den Schein hinterer Lampen | `glowQuad` nach dem Deck (wie Entwurf) | Nachtbild |
| 12 | Rahmen schneidet Laterne, Scheitel, Zacken oder Pfahl ab | `brBox` | Rahmen-Test (alle Punkte und Strichbreiten im Rahmen) |
| 13 | Brückenteil fehlt im GL-Standbild | Ruhendes immer in tileA | GL = 2D (Regel 144), glitch.js |
| 14 | Altes Bildchen nach einem Optionswechsel | Setzer zählen `groundVersion` hoch, Menü-Schlüssel erweitert | Test „Setzer zählt hoch“ |
| 15 | rgba mit `C()`/FOG ungültig, `shade` mit rgba | rgba roh, nur Hex an `shade`/`C` | Lint-Test im Maler |
| 16 | Negativer Radius, NaN | G9 | Zufallswerte-Test |
| 17 | Grauschleier weit weg | Ausdünnen ab < 4 Gerätepunkten, Linien ≥ 1 Gerätepunkt | Bild Zoom 0,45 |
| 18 | Nord-Süd anders falsch | G11 | jedes Prüfbild beide Achsen |
| 19 | Schatten doppelt dunkel bzw. an der Grundstücksgrenze abgeschnitten | ein Pfad, `want`-Rand | Nahaufnahme Boden |
| 20 | Abzweig: Geländer kreuzen sich; Doppelgleis: zwei Innengeländer | Seiten nur am Umriss der Vereinigung, parallele Nachbarn ohne Innengeländer | Gleisbrücken-Prüfbild |
| 21 | Naht im K1-Glasband an jeder Kachelkante | Kanten nur oben und unten, Pfosten je ¼ decken die Kante | Nahaufnahme |
| 22 | Zacken im Lichtraum | `brClear` | Test über alle n |
| 23 | Antippen trifft das Feld hinter einem hohen Bogen | `brPick` mit h(t) für alle Orte (Vorschau = Klick) | Test |
| 24 | Wegmuster auf dem Deck dreht sich (Block 158) | Wasserbrücken ohne `patRot` wie heute; Anhöhen `lauf: ax` | Bild |
| 25 | `hillPre`/`hillLate` malen Dinge der Anhöhe über die Brücke | Prüfbild mit Baum und Haus auf beiden Endfeldern | Bild |

### 2.8 Prüfungen

- **Neue Tests:**
  - `tests/brueckenfamilie.test.js`: Zuordnung, Zufallswerte, Anker
  - `tests/bruecken-altversion.test.js`: eingefrorene v951-Wortschätze und Preise, `tileOut`-Liste von `origin/main`, Untergrenze je Rohstoff, jeder Setzer
  - `tests/brueckenbild.test.js`: Prisma, Rahmen, deckend, Licht, alle Modelle × Orte × Achsen × n ∈ {1, 2, 4, 8} (Wasser bis 16, breit, Steg, Kurve, T, X), Tag/Nacht/weit/kaputte Werte
  - `tests/bruecken-reihenfolge.test.js`: Spion wie `dachverdeckung.test.js`
- **Anzupassen:** bruecke, bruecke-gleis, bruecken, bogenbruecken, uebergang, baenke-fussbruecke, webgl, tempo-schritt3, neuwelt, schiffe-bruecken, kopieren:146, schmuck, design, leistung-je-ding.
- **Leistung:**
  - Welt `bruecken` in `WORLDS` (tests/leistung.test.js:10, heute ohne Anhöhen- und Gleisbrücken).
  - Jede neue Form ergibt einen Schlüssel in `leistung-je-ding.json`.
  - Immer `npm run leistung:neu` mit Begründung.
- **Werkzeuge** (Browser, Bild-Sammler 4181, der Hauptagent nacheinander):
  - `tools/brueckenpruefung.js` (Nahaufnahmen aller Anschlüsse, beide Achsen, nah/weit/Nacht/GL)
  - `tools/bruecken-glitch.js` (Zahlen: Bild mit und ohne Bewegtes, Abweichung außerhalb des Rahmens 0; GL ↔ 2D; Bildchen ↔ live; Scheine je Bild)
  - die Entwürfe je Ort
  - mitlaufen lassen: `brueckenschau`, `bruecke(-gleis)-pruefung`, `gleisrampe-pruefung`, `ruckeln.js` (Full HD, bauland nachts); Messlauf am PC (Regel 149)

---

## 3. Schritte

Für jeden Schritt gilt:
- zuerst den Test, dann `npm test`, `npm run bump`, Commit lokal.
- **kein Push**; `stash@{0}` „Fehlersuche Nacht 11.10.“ nie anfassen.
- Tests und Browser macht der Hauptagent nacheinander (maxWorkers 4).
- Nach Schritten, die das Format berühren, die WLAN-Geräte neu laden.

Bei jedem Schritt steht der Aufwand, den ich empfehle.

### V – Vorarbeiten (je ein eigener Commit)

**V1 AUFGABEN.md 160c bereinigen** (Normal)
- Widersprüche A1 (2702–2705, 2720–2721, 2696/2704) auflösen, Kurzfassung dieses Plans eintragen.
- Nur Doku.

**V2 Übergang-Knöpfe in `undoable`** (Normal)
- Dateien: ui.js:2061–2062.
- Tests: uebergang (Rückgängig nach Designwechsel; Zuschauer und Besucher können nicht umschalten).

**V3 Kopie-Lücke `footPaid`** (Normal)
- `copyClone` (actions.js:530–539) löscht `footPaid`, wenn `!foot`.
- Test: kopieren (Bilanz Kopie → Abriss = 0).

**V4 Gruppe mit mehrfeldiger Wegbrücke ablegen** (Normal)
- `groupErrors` (actions.js:466–481) legt die Wegbrückenfelder der Gruppe am Ziel als `PLANNED` vor (rules.js:1936), `finally` setzt zurück.
- Test neu: 3-Felder-Brücke aufnehmen und ablegen, auch gedreht und breit.

**V5 (kein 160c, vor dem Push) `t.lauf` in `tileOut`** (Normal)
- Test: Rundlauf `serialize`/`parseSave` und Live.

### A – Prüfstand, Lesen, Format, Geld (nichts Sichtbares)

**A1 Prüfstand und Grundlinie** (Hoch)
- **Dateien:**
  - `tools/brueckenwelt.js` (`makeBrueckenWelt`, Altfelder **roh** geschrieben). Inhalt:
    - Wasser-Weg: alle `brk`, Stile sand/kopf/`m:`, `brc`/`brw`, Längen 1/2/3/6/9/16, Steg, breit 2–4, beide Achsen
    - Gleis: gerade, Kurve, T, X, Doppelgleis, 30 Felder
    - Übergänge mit allen `footPaid`-Werten, auch Schranken mit `footPaid`
    - Anhöhen holz/stahl × leer/Weg/Gleis × n 1–4
    - Boote, Zug, Leute
  - `tests/brueckenwelt.test.js` (`GEN=1` → `testsave-bruecken.json`)
  - eingecheckte kleine Vorlage `tests/vorlagen/alte-bruecken.json`; `testsave-*` und `tools/vorschau/` sind gitignored
  - `WORLDS += 'bruecken'`
  - `tools/brueckenpruefung.js`, `tools/bruecken-glitch.js`
- **Tests:** `leistung:neu` („neue Welt, Grundlinie“).
- **Prüfbild:** Vorher-Bilder aller Brücken.
- **Risiko:** keins.

**A2 Leser** (Normal)
- **Dateien:** `js/brueckenfamilie.js` (index.html nach bruecken.js) mit:
  - `BR_MAT` (id, Name, Grundfarben, Deck-Standard, Rückfall je Ort, Materialquelle)
  - `brLegacyLook`, `brLook`, `brPaidOk`, `brSpanLook` samt `brRailSpan`
  - noch kein Aufrufer
- **Tests:** brueckenfamilie.test
  - Zuordnung aller Altfälle aus der Vorlage
  - alle Stile aus `BRIDGE_OF_STYLE` und `m:`-Beläge
  - `footPaid` true/weg/Müll, `art` Müll; Zufallswerte werfen nie
  - Gleis ⇒ Bahn; Anker in gemischten Spannen
  - doppelte Namen (anhoehe-stufe2:26)
- **Risiko:** Namen; vorher grepen.

**A3 Speicherformat komplett + Altversions-Wächter** (Hoch)
- **Dateien:**
  - state.js: `tileOut` schreibt `BR_KEYS` und `brp` (Kopie, `!= null`); `serialize`/`parseSave` für `bruecken` (`art` ∈ `BR_MAT`, sonst holz; `brClean`; **`BK_READ_MAX = 8`**, gebaut wird weiter nur bis `BK_MAX = 4`)
  - data.js: `BRIDGE_COL_DEFS`/`BRIDGE_COLS`/`PLANK_COLS` (+`[5]`) aus draw-objects.js:950–951 hierher
  - `BR_KEYS`
- **Tests:**
  - Rundlauf über `serialize`/`parseSave`, `liveSplit`/`liveJoin`, `liveApplyMaps` (roh)
  - Laden alter Stände lässt die serialisierten Kacheln unverändert (Fingerabdruck)
  - genaues JSON alter Brücken unverändert (bruecke:23); monkey
  - **bruecken-altversion**: v951-Tabellen eingefroren; „ältere Fassung“ = Felder streichen, die die `tileOut`-Liste von `origin/main` nicht kennt (geprüft: `brk`/`brc`/`brw`/`footPaid`/`price` … – keines der neuen) → `brLook` bleibt gültig; Erstattung des Rückfalls ≤ `brPrice` je Rohstoff für alle Ort × Material
- **Risiko:** gering. Ab hier ist ein Push sicher.

**A4 Geld-Schicht** (Hoch)
- **Dateien:** `BR_COST`, `brPrice`, `brPaid`; alle Kostenstellen aus 1.7 auf diese Funktionen.
  - Für Altaussehen kommen dieselben Zahlen heraus; `build` schreibt noch kein `brp`.
  - Aufschütten löscht alle `BR_KEYS`.
  - `fullValue` mit `brPaid` samt Übergang und Gleis-Material (Altfehler).
  - Hinweis render.js:1763 ohne Objektvergleich.
- **Tests:**
  - **Geldbilanz null** (Bauen → Abriss, Kopie, Aufschütten, Verlängern) je Ort
  - alte Zahlen gleich (bruecken.test: Rot 80 + 2 + 1, bahn 40/−60+25, uebergang 60/150/20, bruecke 180)
  - Plan-Vorschau = gebauter Preis
- **Risiko:** viele Stellen. Nur über `brPrice`/`brPaid`, danach grepen.

### B – Zeichen-Gerüst (Anhöhen, heutiges Aussehen)

**B1 Lagen-Maler** (Hoch)
- **Dateien:** `js/brueckenbild.js`; `bkPaint` (bruecken.js:345–383) in Lagen h/v/d/o zerlegt, rgba-Striche als Mischfarbe; Aufruf weiter aus tileB.
- **Tests:**
  - bruecke-gleis:141–158 (Rückruf bleibt das 6. Argument von `bkDrawTile`)
  - Prisma- und Deckend-Test
- **Prüfbild:** glitch.js gegen die Grundlinie, Abweichung nur an Kantenpixeln.
- **Risiko:** gering.

**B2 Zeichenort: ruhend in tileA, Nachmalen in tileB** (Ultracode)
- **Dateien:**
  - render.js: tileA mit Deko-Gruppen; tileB-Teil 2176–2187 wird Nachmalen im Rahmen des Bewegten
  - Züge darunter in Stücken; Figuren ins vorderste Feld
  - Bildchen weit weg samt `prewarm`; `brBox`; gl.js:681 → `brLiveTiles`
  - `glBgStep`
- **Tests:** Reihenfolge-Test, webgl, tempo-schritt3, leistung (weniger lebendige Felder).
- **Prüfbild:** glitch.js mit und ohne Figur bzw. Zug oben und unten, GL = 2D, vier Anschlüsse, beide Achsen.
- **Risiko:** mittel. Wird B2 zu teuer, laufen die Modelle aus C auch in tileB (der Maler ist ohnehin in Lagen).

### C – Anhöhen: Modelle, Optionen, Licht, 8 Felder, Linie

**C1 Stützen und Böcke auf den Kachelkanten** (Hoch)
- **Ziel:** `brSupports` (Holz-Fußgänger nach `bru`; „wenige“ = Kante k, wenn min(k, n−k) ungerade, bei n = 4 also 1 und 3 wie Entwurf 3b; Holz-Bahn jede innere Kante; Stein alle 2; Metall/Kristall keine; Wand nie).
- **Gilt in:** Bild, `bkUnderError`, `bkPlaceError`, `bkRailCheck`, `bkSetArt`, Rückgängig (actions.js:1182), `edgeError` (rules.js:1316), `smallError` (Eckpunkt/Seitenmitte), `setArch` (:1343, Torbögen unter dem Deck, R8), `bpError` ↔ `bkError` (Bergportal am Endfeld, R9). Böcke vorerst in heutiger Optik.
- **Alte Stände:** Liegt dort schon eine Linie, wird die Stütze nur nicht gezeichnet; Daten werden nie gelöscht.
- **Tests:**
  - bruecke:35/47, bruecke-gleis:52/57/62
  - neu: Weg quer durch die Feldmitte unter dem Viadukt; Zaun auf der Stützenkante abgelehnt; Rückgängig
- **Risiko:** Die Regel wird lockerer; kein alter Stand wird ungültig.

**C2 Höhenprofil, Fußgänger Holz (3b) und Metall** (Ultracode)
- **Ziel:** h(t) überall statt `HILL_H`:
  - `bkWegPaint`, `hwPut` (hill-walkers.js:175), `walkerHead`
  - `bkPick` (bruecken.js:439), Plan-Rauten (render.js:1384), Schild (1700/1736/1739)
  - `drawBkShadows`, Anschluss `drawHillFlat` (0,06), `brBox`
- **Regeln:** Familie aus dem Inhalt; Gleis nie über einen Bogen; `brClear` in `bkTooTall`/`bkUnderError`; Altlesen „mit Weg → Belag“.
- **Tests:** Spaziergänger und `bkPick` am Scheitel, Schatten, Invariante Gleis ⇒ flach, Muster ohne Fuge.
- **Prüfbild:** Nahaufnahmen aller Anschlüsse in beiden Achsen, Zug darunter.

**C3 Stein mit Pfeilern (Stufe 3), Balustrade noch ohne Laternen** (Ultracode)
- Laibung, Widerlager, Stirnband, Tunnelschatten, glatte Ansätze.
- **Prüfbild:** die sechs Glitch-Punkte aus AUFGABEN.md:2697–2700. **Der Nutzer nimmt ab** (erstes echtes Spielbild).

**C4 Kristall K1 mit Zacken** (Hoch)
- Glas nur in tileB (t1/t2), `brLiveTiles` = Kristallfelder, Zacken über `brClear`.
- **Tests:** deckend/Glas, GL lebendig nur dort.

**C5 Bahn-Modelle** (Hoch)
- Holz-Böcke, Stein-Viadukt, Metall-Fachwerk, Kristall B2.
- **Tests:** bruecke-gleis, Zug oben und unten.
- **Prüfbild:** beide Achsen.

**C6 Fenster, Leiste, Kosten, Bau im neuen Format** (Hoch)
- **Dateien:**
  - data.js:1147: Formen stein, kristall anhängen; `cols` mit Versatz
  - `lookThumb`-Schlüssel, `brIcon` statt `drawBkIcon`
  - `openBkInfo` (bruecken.js:475–497): Material, Farbe, Belag/Muster, Stützen, Zacken; `brSet`; `bkBuild` schreibt `brp`
  - Metall braucht weiter die Forschung `bahn` (bruecken.js:13); sonst sperrt nur das fehlende Material (Sperrtext mit Quelle)
- **Tests:** schmuck, design, leistung-je-ding (neue Schlüssel), bruecke-Fenster, Altversions-Wächter je Setzer.

**C7 Licht zwischen Anhöhen** (Hoch)
- `brl` kaufen/an/aus.
- Lampen je Material: Punkte bei Holz/Metall, Minilaternen auf der Balustrade (Kopf der Gaslaterne × 0,6, Gehäuse aus der Brückenfarbe), Kristall-Streifen.
- Neue Option „nur Scheiben stanzen“ fürs Nachmalen; Bildchen `prewarm`.
- **Tests:** nacht, nachtlicht-bildchen, webgl (dieselbe Lichtschicht), Scheine mit und ohne Figur gleich.

**C8 Bis 8 Felder** (Normal)
- `BK_MAX = 8`; Texte data.js:206/782 und openBkInfo „1 bis 4“, „Holz oder Stahl“.
- Stein bei ungerader Länge ab 5: Mittelbogen über 3 Felder (Nutzer 12.10.2026 nach Bildvarianten: n 5 → 1-3-1, n 7 → 2-3-2; gerade Längen je 2 von außen; Holz „wenige“ und Bogenhöhe bleiben).
- **Tests:** 8 ja, 9 nein.

**C9 Bauen per Linie über die Lücke** (Hoch)
- `planScan` erkennt bei einer Weg- oder Gleislinie, die **oben** beginnt (Regel `oben` wie `bkPlanDeck`), die Lücke (`bkSpanOf`).
- Ein `bkBuild`-Auftrag kommt vor den Deck-Aufträgen; ein Rückgängig-Schritt.
- Material über `brNewLook`; `planInfo`-Schlüssel + `brNewSig()`; Summe und Geist.
- Unten begonnen bleibt unten. Das Werkzeug bleibt.
- **Tests:** oben/unten, Summe, Rückgängig.

**C10 (optional) Schiffe und Fische unter Anhöhen-Brücken** (Normal)
- `seaCross` kennt `bkAt`: nur quer, nie durch Stützenkanten.
- Die Signatur von `seaBridgesCheck` (rules.js:2578) bekommt `state.bruecken`; `natureAt` (movers.js:1084) ebenso.

### D – Wasser-Wegbrücken (online)

**D0 Entwurf, nur Bild** (Hoch)
- `tools/wasserbruecken-entwurf.js`:
  - 4 Materialien × N 1/2/3/6/9/16 × breit 1–4 × Steg × beide Achsen
  - Boot darunter, Leute darauf, Tag/Nacht
  - vorher/nachher aus der Vorlage und testsave-neu/og
- **Der Nutzer nimmt ab** (F1).

**D1 Zeichenort, altes Aussehen** (Hoch)
- Flache Wegbrücken aus dem Boden-Durchgang nach tileA (wie die Bögen, render.js:1603).
- `drawBridgeOver` (render.js:913) wird das Nachmalen im Rahmen des Boots.
- Figuren zwischen Deck und vorderem Geländer; flach `brLiftAt` = `LIFT` (heute 0, rules.js:1932).
- **Tests:** webgl (`liveFlatSet`), bruecken:107, bogenbruecken (`drawBridgeOver`), schiffe-bruecken.
- **Prüfbild:** Pixelvergleich, Boote, Nacht, GL.

**D2 Neue Modelle über `brLook`/Anker** (Ultracode)
- Holz mit Stützen auf Kanten, Stein mit Öffnungen aus Block 150 + Balustrade, Metall, Kristall; breit (Geländer, Stützen, Stirn nur außen); Steg und 1 Feld flach.
- `bridgeArchCalc` → `wall`/`pass` aus `brSpanLook` (rules.js:1899: Metall/Kristall = keine Mauer).
- Ziegelmuster entfällt (draw-objects.js:995/1070).
- **Tests:** neuwelt (Erwartungen bleiben, weil die Altfelder bleiben), bogenbruecken (Öffnungs- und Bootsmuster gleich für Stein, Boote gleich für Holz), seaCross.
- Leistungswerte neu (begründen).
- **Prüfbild:** vorher/nachher neu/og/bauland/freizeitpark.

**D3 Fenster, Kosten, Bau im neuen Format** (Hoch)
- Material (4), Farbe, Planken, Belag/Muster, Stützen, Zacken, Licht; Ziegel- und Rot-Knöpfe weg (ui.js:1927–1951, 2044–2049).
- `brSet` über `bridgeSpan`; `build` schreibt `brp` und übernimmt beim Verlängern die `BR_KEYS`.
- Geist mit Brücke; Schild „Brücke: Stein“ beim Ziehen (render.js:1762).
- **Tests:** bruecken (Rot-Tests umschreiben: alte Rot-Brücke erstattet weiter 80 + 2 + 1), Altversions-Wächter je Setzer, Bilanz null, gemischte Spanne.

**D4 Anhöhe neben dem Brückenende sperren** (Normal)
- `hillRaiseError` (hills.js:88) prüft das Wasserbrückenende längs der Achse (luecken B3).
- Test.

### E – Gleisbrücken übers Wasser (online)

**E0 Entwurf, nur Bild** (Hoch)
- Gerade, Kurve, T, X, Doppelgleis, langer Lauf; Zug darauf, Boot quer; 4 Materialien, Nacht.
- Ausschnitte aus og und bauland. **Der Nutzer nimmt ab** (F4).

**E1 Zeichenort, altes Aussehen** (Ultracode)
- Gleisbrücken aus dem flachen Durchgang nach tileA; Deck und Pfähle unverändert.
- Wagen in Stücken je Feld (`brCarPieces`); L6 nach den Zügen nachmalen; Bildchen je Feld; `liveFlatSet`.
- **Tests:** webgl, tempo-schritt3, schiffe-bruecken, bahn.
- **Messen:** bauland (433 Felder) lokal und `ruckeln.js` am PC.
- **Risiko:** höchstes Risiko für Reihenfolge und Leistung.

**E2 Modelle, Spanne, Fenster, Kosten, Licht** (Hoch)
- Gerade Läufe: Böcke, Viadukt, Fachwerk im Weltraster.
- Kurven, Abzweige und Kreuzungen: Kurvenstück (Deck, Gleis, Geländer am Umriss, ohne Böcke/Fachwerk).
- `brRailSpan`; Abschnitt „Brücke“ im Schienenfenster; `BRIDGE` + Aufschlag; `ITEMS.schiene.desc`.
- **Tests:** alle Formen × Achsen, Schiffe nur quer, Bilanz null, Altversions-Wächter.

### F – Übergang (online)

**F0 Entwurf, nur Bild** (Normal)
- 4 Materialien × 2 Achsen, Zug darunter in beide Richtungen, Figuren auf beiden Rampen, oben auf einer Anhöhe, Nacht.
- Alte Stände: og Fischgrät „weg“, Kristall unter Schranken. **Der Nutzer nimmt ab.**

**F1 Bekleidung, Fenster, Kosten** (Hoch)
- Die Geometrie aus Block 148 bleibt (`ARCH_*`, `RAMP`, `cheek`, `padBorder`, zwei Hälften, `afterMovers`). Die Bekleidung je Material kommt aus den Bausteinen.
- `archWalkers` als Rückruf zwischen Deck und vorderem Geländer, mit dem Hub der Anhöhe (Karte Übergang 6a).
- Fenster: Schranken | 4 Materialien, Farbe, Belag/Muster, Licht, Zacken (ui.js:1916–1925). Kosten nach 1.6.
- `edgeError` kennt `archAround` (luecken B9). Wagen unter dem Bogen an Feldkanten schneiden (R7).
- **Tests:** uebergang (Knöpfe), baenke-fussbruecke, gleisrampe-kritik, `archH` unverändert, Altversions-Wächter.

### G – Abschluss

**G1 Texte, Erfolg, Album, Hilfe** (Normal)
- Freischalt- und Sperrtexte.
- Erfolg „Brückenfelder“ zählt Deckfelder und Fußgängerbrücken mit (story.js:514, sinkt nie).
- Album: Belag auf dem Deck. `ITEM_TIPS`.
- Hinweis „bleibt stehen“ zählt Anhöhen-Brücken mit.
- Alte NEWS-Einträge zu Ziegel und Rot anpassen (ui.js:3299–3303).

**G2 Gesamtprüfung** (Ultracode)
- 3–4 Prüfer, nur lesen: alte Stände, Geld, Bild, Leistung.
- Jeder Fund wird gegengeprüft.
- Ganzer Prüfstand; Messlauf am PC und am iPad.

**G3 CLAUDE.md, AUFGABEN, „Das ist neu“** (Normal)
- Regel „Brückenfamilie“: Mischform, `brLook`/`brp`-Kennung, alter Wortschatz, nie `price`, Preis = Rückfall + Aufschlag, Nachmal-Schema.
- `NEWS_HISTORY` oben (157 + 160 zusammen).
- **Push nur auf Zuruf**, danach alle eigenen Geräte neu laden.

---

## 4. Empfehlungen zu den 18 offenen Entscheidungen (luecken.md C)

| # | Frage | Empfehlung | Schritt |
|---|---|---|---|
| 1 | Modell je Ort | Neue Bausteine überall. Wasser behält die Form aus Block 150, der Übergang die aus Block 148. Für Wasser, Gleis und Übergang zuerst Entwürfe. | **F1**, D0/E0/F0 |
| 2 | Anhöhen umwandeln, Familie bei leerer Brücke | Familie aus dem Inhalt (Gleis = Bahn, sonst Fußgänger-Bogen); das Werkzeug baut leer (Bogen); Holz/Stahl mit Weg = Fußgänger-Bogen mit Belag | C2 |
| 3 | Wahl beim Ziehen | `paintNew.bruecke` (Material + Farbe) aus dem Brücken-Werkzeug gilt für alle neuen Brücken; ohne Wahl wie heute; Licht, Zacken und Stützen nur im Fenster | **F3**, C9/D3 |
| 4 | Strom | in 160c ohne Strom (`computePower` bedient Laternen vor Betrieben und Zügen, rules.js:2789–2805); alter Kristall-Übergang: Licht an | **F2** |
| 5 | Kosten der Optionen | Licht je Feld (Übergang je Brücke); einmal kaufen, an/aus kostenlos; Farbe frei; Verlängern zahlt Eingeschaltetes; Kopie nur Eingeschaltetes | 1.7 |
| 6 | „Fürstlich“ | fester hoher Platzhalter je Feld (~10–13× Holz), in `brp` gemerkt; Fortschritt später | 1.6 |
| 7 | Freischaltung | über das Material (Bretter `baum:1`, Quader `klippe:1`, Metall `erzberg:2`, Kristall `kristall:1`); `bahn` für Metall an Anhöhen bleibt; Gebautes bleibt umstellbar | C6 |
| 8 | Laternenfarbe | Gehäuse aus der Brückenfarbe, Licht warm, Kristall immer blau | C7 |
| 9 | Zacken | nur Fußgänger-Kristall, an allen Orten, begrenzt durch `brClear`; nicht bei B2 | C4 |
| 10 | Stützen-Option | nur Holz-Fußgänger, an allen Orten (Kanten; Boote fahren durch die Feldmitten, Seewege unverändert); Bahn-Holz feste Böcke | C1/D2 |
| 11 | 1 Feld | zwischen Anhöhen ein Buckel; Wasser mit 1 Feld und Steg bleiben flach (Block 150) | **F1** |
| 12 | Breite Brücken | Wasser bis 4 Reihen als eine Brücke, außen Geländer; parallele Anhöhen-Brücken bleiben getrennt | D2 |
| 13 | Abriss übers Wasser | feldweise wie heute | – |
| 14 | Bewohner | unverändert (Wasser ja, Anhöhe nein), später eigener Block | – |
| 15 | Gleiskurven, 99 Felder | Kurvenstück ohne Böcke und Fachwerk, keine neue Formregel | **F4**, E2 |
| 16 | Schiffe unter Anhöhen-Brücken | nur quer, nie durch Stützenkanten, Signatur mit `state.bruecken` | C10 |
| 17 | „Wie der Weg“ | Holz + Belag `t.style` (bleibt an „alle verbundenen umfärben“ und das Album gekoppelt); `footPaid:'weg'` bleibt bis zum Materialwechsel | 1.5/F1 |
| 18 | `BK_MAX` 8, `SIG_KEYS` | Lesegrenze 8 in A3, Bauen bis 8 in C8; `SIG_KEYS` nicht ändern (würde jeden Fingerabdruck einmal ändern) | A3/C8 |

---

## 5. Fragen an den Nutzer (mit Empfehlung)

**F1 – Brücken übers Wasser: Form aus Block 150 behalten?**
- Du hast die Steinbögen bei 3, 6 und 16 Feldern „perfekt, nicht mehr anrühren“ genannt, und 1 Feld bzw. der Steg ins Meer bleiben flach.
- **Empfehlung:** Form, Bogenhöhe, Öffnungen und Boot-Durchfahrten bleiben genau so. Neu sind Material (Holz/Stein/Metall/Kristall), Geländer bzw. Balustrade, Holzstützen auf den Kachelkanten, Farbe und Licht.
- **Alternative:** das Pfeiler-Modell von den Anhöhen (Bögen je 2 Felder). Dann fahren Boote anders durch.

**F2 – Braucht Brückenlicht Strom wie Laternen?**
- **Empfehlung:** In 160c nicht. Licht kostet nur beim Kauf.
- Heute bekommen Laternen den Strom vor Betrieben und Zügen. Mit Strom könnten in bestehenden Welten Züge stehen bleiben oder der alte Kristall-Übergang dunkel werden.
- Eine Strom-Regel lässt sich später ohne Datenänderung nachziehen.

**F3 – Wo wählt man das Material einer Brücke, die beim Ziehen eines Wegs oder Gleises entsteht?**
- **Empfehlung:** In der Leiste des Brücken-Werkzeugs (Material und Farbe). Die Wahl gilt dann für alle neuen Brücken.
- Wer nie wählt, bekommt es wie heute: Weg nach Belag (Sand/Mulch/Trittsteine Holz, sonst Stein), Gleis Holz.
- Beim Ziehen zeigt das Schild „Brücke: Stein“.
- **Alternative:** ein zusätzlicher Brücken-Knopf in der Leiste von Weg und Schiene.

**F4 – Gleisbrücken mit Kurven und Abzweigen** (gibt es in alten Ständen, z. B. og und bauland)
- **Empfehlung:** Ein schlichtes Kurvenstück im Material (Deck, Gleis, Geländer, ohne Böcke und Fachwerk). Kurven auf Brücken bleiben erlaubt. Bild in E0.
- **Alternative:** Neue Gleisbrücken nur noch gerade; alte bleiben stehen.

---

**Relevante Dateien**

Bestehend:
- /Users/ericwinderlich/Projekte/Spiel/js/state.js
- /Users/ericwinderlich/Projekte/Spiel/js/rules.js
- /Users/ericwinderlich/Projekte/Spiel/js/actions.js
- /Users/ericwinderlich/Projekte/Spiel/js/plan.js
- /Users/ericwinderlich/Projekte/Spiel/js/render.js
- /Users/ericwinderlich/Projekte/Spiel/js/gl.js
- /Users/ericwinderlich/Projekte/Spiel/js/draw-objects.js
- /Users/ericwinderlich/Projekte/Spiel/js/bruecken.js
- /Users/ericwinderlich/Projekte/Spiel/js/data.js
- /Users/ericwinderlich/Projekte/Spiel/js/ui.js
- /Users/ericwinderlich/Projekte/Spiel/js/live.js
- /Users/ericwinderlich/Projekte/Spiel/js/cloud.js
- /Users/ericwinderlich/Projekte/Spiel/js/hills.js
- /Users/ericwinderlich/Projekte/Spiel/js/hill-walkers.js
- /Users/ericwinderlich/Projekte/Spiel/js/movers.js
- /Users/ericwinderlich/Projekte/Spiel/js/story.js
- /Users/ericwinderlich/Projekte/Spiel/index.html
- /Users/ericwinderlich/Projekte/Spiel/AUFGABEN.md
- /Users/ericwinderlich/Projekte/Spiel/CLAUDE.md
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenlicht-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenfamilie-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bogen-anhoehe-entwurf8.js
- /Users/ericwinderlich/Projekte/Spiel/tools/kristallbruecke-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tests/leistung.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/anhoehe-stufe2.test.js

Neu (vorgeschlagen):
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenfamilie.js
- /Users/ericwinderlich/Projekte/Spiel/js/brueckenbild.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenwelt.js
- /Users/ericwinderlich/Projekte/Spiel/tools/brueckenpruefung.js
- /Users/ericwinderlich/Projekte/Spiel/tools/bruecken-glitch.js
- /Users/ericwinderlich/Projekte/Spiel/tools/wasserbruecken-entwurf.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenwelt.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenfamilie.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-altversion.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/brueckenbild.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/bruecken-reihenfolge.test.js
- /Users/ericwinderlich/Projekte/Spiel/tests/vorlagen/alte-bruecken.json

Grundlagen der Lückenprüfung:
- /private/tmp/claude-501/-Users-ericwinderlich-Unterrichtsplaner/a65f0e36-b293-4699-ac3e-bbc58f9caec9/scratchpad/160c/luecken.md