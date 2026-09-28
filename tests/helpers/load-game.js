// Lädt die Spiel-Skripte wie <script>-Tags im Browser: alle Top-Level-Funktionen und -Variablen
// (state, ITEMS, totals, …) landen im globalen Scope und sind so testbar.
// Achtung: pro Testdatei nur EINMAL laden (let/const dürfen nicht doppelt deklariert werden).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

// Reihenfolge wie in index.html
function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
}

function loadGame() {
  for (const rel of scriptList()) {
    const file = path.join(ROOT, rel);
    vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
  }
}

// Liest/verändert den Spielzustand, z. B. game('state.money') oder game('tool = "haus"')
function game(expr) {
  return vm.runInThisContext(expr);
}

module.exports = { loadGame, game, scriptList };
