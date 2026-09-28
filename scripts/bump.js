// Erhöht die Versionsnummer (?v=N) aller eigenen Skripte und Stylesheets in index.html.
// Ohne neue Nummer laden installierte Geräte (iPad) weiter den alten Stand aus dem Cache.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');
const max = Math.max(...[...html.matchAll(/\?v=(\d+)/g)].map(m => +m[1]));
const next = max + 1;
fs.writeFileSync(file, html.replace(/\?v=\d+/g, '?v=' + next));
console.log('Version ' + next);
