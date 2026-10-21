# Block 163 – Belohnungen und Freischalten (Entwurf 21.10.2026)

Ausgangslage (Bestandsaufnahme 21.10.): Wand-/Dachfarben sind schon gesperrt (3 frei, Rest in der Kunstakademie), aber die
Kunstakademie kostet nur ~3 Minuten Einkommen – reiche Inseln kaufen alles auf einmal. Fenster-, Brücken- und Flaggenfarben sind
ganz frei. Truhen und Erfolge geben nur Zahlen. Nutzer: „Alles davon“ stört (zu viele Taler, zu wenig Ziele, langweilige Belohnungen).

## Entschieden (Nutzer 21.10.2026)
- **A – Meisterstücke ✦ der Kunstakademie kosten ✨** (100–200 ✨ je Stück, zusammen ~1.600 ✨). Alles andere bleibt Taler + Ideen,
  aber teurer: ~30 statt ~3 Minuten Einkommen. Schon Gekauftes bleibt.
- **Fenster-, Brücken- und Flaggenfarben: je 3 frei**, der Rest in der Kunstakademie. Was schon irgendwo verbaut ist, bleibt frei.
  Wegfarben bleiben frei (Entscheidung 08.10.).
- **Baupläne (geschenkte Stücke)** bei **Truhen** (statt meist Talern) und **Erfolgen** (jede dritte Erfolgsstufe zusätzlich zum ✨).
  Nicht bei Expeditionen und Sternschnuppen.
- **Nicht:** Einnahme-Schübe oder Truhen-Taler kürzen (B).

## Blöcke
- 163a Meisterstücke für ✨, übrige Kunstakademie-Preise ×10 (Taler), Anzeige ✨ auf den Karten
- 163b Fenster-, Brücken-, Flaggenfarben in die Kunstakademie (je 3 frei, Verbautes per Migration frei)
- 163c Baupläne: Truhe → ein noch gesperrtes Stück (kein Meisterstück) + kleiner Taler-Rest; Erfolg jede 3. Stufe → ein Stück;
  Fenster „Bauplan gefunden“ mit „Ansehen“ (springt in die Kunstakademie); alles frei → wie bisher
- 163d Tests, „Das ist neu“, Bump

## Eingebaut (21.10.2026, v1160)
Alle vier Blöcke wie oben; Tests tests/belohnungen.test.js; angepasst: design, belaege, wasserbruecken-fenster.
