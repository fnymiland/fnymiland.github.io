// Testszene für Wege (im Browser mit ?probe laden, dann diese Datei per <script> einbinden oder einfügen)
// Legt auf der Heimatinsel eine Fläche frei und baut alle Weg-Fälle nebeneinander.
(function wegSzene() {
  const X0 = -6, Y0 = -6;
  for (let y = Y0; y < Y0 + 16; y++) for (let x = X0; x < X0 + 20; x++) {
    state.terra.set(x + ',' + y, 'grass');
    state.tiles.delete(x + ',' + y);
    state.decos.delete(x + ',' + y);
  }
  const W = (x, y, style) => state.tiles.set((X0 + x) + ',' + (Y0 + y), { b: 'weg', lvl: 1, style });
  // Reihe 1: einzelne Felder jedes Band-Stils
  ['sand', 'kies', 'mulch', 'asphalt', 'holz', 'konfetti', 'blueten', 'tritt', 'kristall'].forEach((s, i) => W(i * 2, 0, s));
  // Reihe 2: Trittsteine – gerade, Kurve, T, Kreuz, Sackgasse
  for (let x = 0; x < 4; x++) W(x, 3, 'tritt');
  W(3, 4, 'tritt'); W(3, 5, 'tritt');                         // Kurve
  for (let x = 6; x < 9; x++) W(x, 3, 'tritt'); W(7, 4, 'tritt'); W(7, 5, 'tritt');   // T
  for (let x = 11; x < 14; x++) W(x, 4, 'tritt'); W(12, 3, 'tritt'); W(12, 5, 'tritt'); // Kreuz
  // Reihe 3: Platz 3×3 mit einmündenden Wegen, 2×1-Platz, einzelnes Platzfeld
  for (let y = 8; y < 11; y++) for (let x = 2; x < 5; x++) W(x, y, 'platten');
  W(0, 9, 'sand'); W(1, 9, 'sand'); W(3, 11, 'kies'); W(3, 12, 'kies'); W(5, 8, 'asphalt'); W(6, 8, 'asphalt');
  W(8, 9, 'klinker'); W(9, 9, 'klinker');
  W(11, 9, 'konfetti'); W(11, 10, 'konfetti'); W(12, 9, 'konfetti'); W(12, 10, 'konfetti');
  W(13, 9, 'schach'); W(13, 10, 'schach'); W(14, 10, 'schach');
  // Reihe 4: Stilwechsel im Weg, breiter Weg aus zwei Spuren
  ['sand', 'sand', 'kies', 'kies', 'asphalt', 'asphalt', 'holz', 'holz', 'mulch', 'blueten'].forEach((s, i) => W(i, 14, s));
  for (let x = 12; x < 16; x++) { W(x, 13, 'sand'); W(x, 14, 'sand'); }
  recalc();
  const c = iso(X0 + 8, Y0 + 7); cam.x = c.x; cam.y = c.y; cam.z = 1.25;
})();
