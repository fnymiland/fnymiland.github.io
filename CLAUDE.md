# Kachelhausen – Projektwissen

Gemütliches Aufbauspiel auf einer Insel (Polytopia-Kacheln, Animal-Crossing-Look). Der Nutzer entwickelt es
gemeinsam mit Claude und spielt es auf dem iPad im WLAN. **Das Konzept steht in [KONZEPT.md](KONZEPT.md)** –
dort auch die Bau-Reihenfolge. Größere Änderungen erst mit dem Nutzer besprechen (Optionen zeigen, dann bauen).

## Aufbau

Kein Framework, kein Build. `index.html` lädt die Skripte **in dieser Reihenfolge**; alle teilen sich den
globalen Scope (klassische Skripte, keine Module):

| Datei | Inhalt |
|---|---|
| `js/data.js` | Grundwerte, `ITEMS`, `RES`, `STYLES`, `TECHS`, `STARS`, `LANDMARKS`, Farben |
| `js/state.js` | Spielstand: `newState`, `serialize`/`save`, `parseSave`/`load` (Migrationen!), Export/Import |
| `js/world.js` | Insel-Generator (Rauschen), Gelände, Sehenswürdigkeiten, Grundstücke |
| `js/rules.js` | Regeln: Viertel, Erreichbarkeit, `totals()` (Einnahmen, Rohstoffe, Schönheit), Bau-Prüfungen |
| `js/audio.js` | kleine synthetische Klänge |
| `js/actions.js` | Bauen, Abreißen, Kaufen, Forschen, Verschieben, Hausausbau |
| `js/story.js` | Laternen, Ortstitel, Wahrzeichen restaurieren, Tagebuch, Einführung, Laternenfest |
| `js/input.js` | Kamera, Maus/Touch, Pinsel |
| `js/draw-base.js` | Grundformen (`poly`, `box`, `C()` mit Nebel/Ruinen-Farben), Gelände, Bäume |
| `js/draw-kit.js` | **Baukasten** für Gebäude in 4 Richtungen: `kit(cx, cy, z, rot)` → `K.block`, `K.door`, `K.wins`, `K.scene` … |
| `js/draw-objects.js` | Wege, Rathaus/Park, Häuser (`HOUSE_ART`), Deko, Sehenswürdigkeiten, `drawObject` |
| `js/draw-buildings.js` | Betriebe und Bildungsbauten in 3 Stufen (`BUILDING_ART`) |
| `js/movers.js`, `js/render.js` | Bewohner, Szene (Reihenfolge, Vorschau, Nacht, Schilder) |
| `js/ui.js` | Leisten, Infofenster, Dialoge, Menü, Produktion pro Zeitschritt, Offline-Gutschrift |
| `js/main.js` | Neues Spiel, Probeansicht (`?probe`), Start und Spielschleife |

Oberste Ebene jeder Datei darf nur Funktionen/Konstanten anlegen oder Dinge aus **früheren** Dateien benutzen
(Funktionsaufrufe über Dateigrenzen erst zur Laufzeit).

## Regeln

1. **Spielstände sind heilig.** Neue Felder in `serialize` **und** `parseSave`; alte Stände müssen immer
   lesbar bleiben (Migration in `parseSave`). Unlesbare Stände werden nie überschrieben (`loadFailure`).
2. **Nach jeder Änderung `npm run bump`**, sonst lädt das iPad alten Code aus dem Cache.
3. **`npm test` muss grün sein.** Neue Regeln bekommen einen Test (`tests/`, Hilfen in `tests/helpers/load-game.js`).
4. Die Probeansicht (`?probe`) speichert nie etwas – gut zum Zeigen neuer Optik.
5. Texte im Spiel auf Deutsch, kurz und freundlich.
6. **Wege** (`weg`) belegen ein ganzes Feld; Stile in `STYLES.weg` (`shape: 'band'` verbindet sich mit Nachbarn,
   `'fill'` = Platz). Viertel = alles Bebaute, das direkt/über Eck/über Wege zusammenhängt (`computeNet`).
   Straßen, Gehwege an Kanten und Pflaster gibt es nicht mehr – alte Stände wandelt `parseSave` um.
7. **Große Gebäude** (`ITEMS[b].size`, z. B. `[2, 2]`): gespeichert wird nur das Ankerfeld (hinterste Ecke).
   Wer wissen will, was auf einem Feld steht, fragt `objAt`/`anchorAt`/`bAt` (nutzen `COVER`), **nie**
   `state.tiles.get` für beliebige Felder. Nachbarn zählen über `countNear` (jedes Gebäude einmal).
   Gezeichnet werden große Gebäude am vordersten Feld (`BIG_ART`). Alte Stände rücken per `fitFootprints`.
8. **Verschieben** (`pickUp`/`dropAt`/`cancelMove`): Während des Tragens speichert `serialize` das Objekt an
   seinem alten Platz mit, damit beim Schließen der App nichts verloren geht.
9. **Häuser** wachsen über Wünsche (`HOUSE_STAGES`, `WISHES`, `wishMet`, `houseWishes`): Ausbauen per Hand
   (`houseUpgrade`), kostet Material, **nie schrumpfen**. Einwohner pro Stufe aus `HOUSE_STAGES`.
   Bewohner: `t.animal`/`t.name` (alte Häuser bekommen sie per `nameHouses`).
10. **Ziel = Laternen** (keine Sterne mehr): Wahrzeichen haben 3 Stufen (`LM_STAGES`, `state.restore`), jede Stufe
    = 1 Laterne + Tagebuchseite + Freischaltungen. Freischalten läuft über `unlockOk` (`lm: 'baum:1'`,
    `lanterns: n`, `tech`, oder `state.legacy` aus alten Ständen). Wahrzeichen wirken erst ab Stufe 1.
    Leuchtturm ab 21 Laternen → `festival()`. Einführung: `TUTORIAL` + `storyTick` (-1 = fertig).

11. **Drehen**: `rot` 0–3 = Tür nach +x, +y, −x, −y (`FRONT_DIR`). `size = [Tiefe, Breite]` bei rot 0, ungerade
    Drehung = quer. Beim Setzen dreht `placeRot` automatisch zum Weg (`autoRot`), bis man selbst dreht (`rotManual`,
    gilt bis zum Werkzeugwechsel). Mausrad dreht beim Bauen/Verschieben. Neue Gebäude **immer mit dem Baukasten**
    zeichnen (eigener Rahmen: a = vorn, b = Seite), dann stimmen alle vier Richtungen von selbst.
12. **Gebäude-Stufen** (`BUILD_STAGES`, höchstens 3): Bedingungen (`stageInfo`: freie Mitarbeiter + etwas Passendes in
    der Nähe) → ✨ → Ausbauen per Knopf (`stageUpgrade`, kostet Taler + Material). Ertrag ×Stufe, Mitarbeiter ×Stufe
    (`jobsOf`). Jede Stufe sieht anders aus (`BUILDING_ART[b](K, stufe, …)`). Häuser: Aussehen wählbar (`t.look`).
13. **Tag/Nacht** läuft auf einer eigenen Spieluhr (`nightAt`, 20 Minuten pro Tag), nicht auf der echten Uhr.
14. **Leistung (iPad!)**: Der Boden jedes Grundstücks samt Wegen wird zwischengespeichert (`groundCache`,
    neu bei `recalc` über `groundVersion`). Wer Gelände/Wege ändert, ohne `recalc` aufzurufen, erhöht `groundVersion`
    selbst. Wald/Felsen sind fertige Bilder (`tileSprite`). Keine Dinge, die pro Bild für alle Gebäude laufen
    (die aufploppenden Einnahme-Zahlen wurden deshalb entfernt).
16. **Licht**: Die Sonne steht links (`LIGHT` in draw-base.js): Wände nach +y hell, nach +x dunkel, Dächer je nach
    Richtung. Gebäude werfen Schlagschatten nach rechts (`SHADOW`/`shadowOf` in render.js, im Boden zwischengespeichert).
    Flaches (Plätze, Rasen, Beete) steht in `groundPart(() => …)` und wird im Boden-Durchgang gezeichnet (`PASS`),
    damit Schatten darauf fallen; neue Gebäude mit flachem Teil in `GROUND_TYPES` eintragen.
17. **Inseln** (Spielstand v7): Heimatinsel (`ISLAND`, gehört einem ganz) und Themen-Inseln (`ISLES` in data.js,
    je eine Sehenswürdigkeit in der Mitte, `isleAnchor`). Erschlossen wird der Reihe nach (`nextIsle`, `isleNeeds`,
    `unlockIsland`, `state.islands`); `state.owned` sind die Grundstücke (6×6) der erschlossenen Inseln (`ownIsland`).
    Kein Grundstückskauf mehr. Gelände der Heimatinsel darf sich **nie** ändern (`homeLand`/`baseTerrain`), sonst stehen
    Gebäude alter Stände im Wasser. Alte Stände ziehen per `migrateIslands` um (einmalig, `state.moveLm`).
15. **Sehenswürdigkeiten sind 3×3** (Spielstand v6; alte Stände rücken einmalig per `fitFootprints`/`lmSpot`, nur wenn `state.fitLm`). Park ebenfalls 3×3. Große Gebäude werden in senkrechten Streifen gezeichnet (render.js), damit sie nichts davor Stehendes überdecken.

## Befehle

```bash
npm test          # alle Tests (Vitest + jsdom)
npm run bump      # Versionsnummern in index.html erhöhen
npm run serve     # Server für WLAN/iPad auf Port 4173
```

## Zusammenarbeit (wichtig)

- **Erst besprechen, dann bauen.** Vor jedem größeren Schritt: kurz erklären, wie es technisch geht, Optionen
  mit Vor-/Nachteilen zeigen, auf die Antwort warten. Kleine Fehler direkt beheben.
- In **kleinen Schritten** bauen, jeden Schritt zeigen (Probeansicht, Screenshot), dann `npm test`, `npm run bump`,
  Commit (lokal, Nutzer hat git gewünscht). Stand der Schritte: Bau-Reihenfolge in KONZEPT.md (✓ = fertig).
- Der Nutzer mag: **cozy und süß**, klares Ziel, Belohnungen selbst auslösen (Ausbauen per Knopf statt automatisch),
  viel Gestaltungsfreiheit, keine unnötige Verwaltung. Größenverhältnisse müssen stimmen (Deko nicht so groß wie Häuser).

**Schon ausprobiert und verworfen – nicht wieder einbauen:**
unendliches Land ohne Ziel · Inselhüpfen (eine Insel bleibt) · Straßenpflicht zum Rathaus · Strom/Kraftwerke ·
Gehwege auf Feldkanten · Straßen neben Wegen · Autos/Busse. Züge/Straßenbahn: später neu besprechen.

## Online (GitHub Pages)

Das Spiel liegt unter **https://fnymiland.github.io** (Repository `fnymiland/fnymiland.github.io`, Remote `origin`,
Branch `main`). **Jeder Push auf `main` ist nach ~1 Minute live** – **nur pushen, wenn der Nutzer es ausdrücklich sagt** (lokal bauen, zeigen, dann auf Zuruf hochladen). Offene Aufgaben: [AUFGABEN.md](AUFGABEN.md). Vorher `npm test`
und `npm run bump`. Der Zugang (Token) ist im macOS-Schlüsselbund nur für dieses Repository gespeichert
(`credential.useHttpPath`). Spielstände liegen pro Adresse im Browser – beim Adresswechsel per Datei übertragen.

## Spielen im WLAN

`python3 -m http.server 4173 --directory ~/Projekte/Spiel` (bzw. Vorschau-Server „spiel“) → auf dem iPad
`http://192.168.178.82:4173` (IP kann sich ändern). Jedes Gerät hat seinen eigenen Spielstand (Export/Import im Menü).
