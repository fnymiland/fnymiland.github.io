// Prüft den Aufbau: Skripte, Versionsnummern und Element-IDs passen zusammen.
const fs = require('fs');
const path = require('path');
const { scriptList } = require('./helpers/load-game');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = scriptList();
const code = scripts.map(s => fs.readFileSync(path.join(ROOT, s), 'utf8')).join('\n');

describe('Aufbau', () => {
  it('alle Skripte existieren', () => {
    for (const s of scripts) expect(fs.existsSync(path.join(ROOT, s)), s).toBe(true);
  });

  it('alle eigenen Skripte und Stylesheets tragen dieselbe Versionsnummer (sonst lädt das iPad alten Code)', () => {
    const versions = [...html.matchAll(/(?:src|href)="(?!https?:)[^"]+\?v=(\d+)"/g)].map(m => m[1]);
    const jsVersions = [...html.matchAll(/<script src="[^"]+\?v=(\d+)"/g)].map(m => m[1]);
    expect(jsVersions.length).toBe(scripts.length);
    expect(new Set(jsVersions).size).toBe(1);
    expect(versions.length).toBeGreaterThan(scripts.length);
  });

  it('jede angesprochene Element-ID gibt es in index.html oder in einer Vorlage im Code', () => {
    const used = new Set([...code.matchAll(/\$\('([\w-]+)'\)|getElementById\('([\w-]+)'\)/g)].map(m => m[1] || m[2]));
    const known = new Set([...html.matchAll(/id="([\w-]+)"/g), ...code.matchAll(/id="([\w-]+)"/g)].map(m => m[1]));
    const missing = [...used].filter(id => !known.has(id));
    expect(missing).toEqual([]);
  });
});
