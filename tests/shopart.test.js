const fs = require('fs'), path = require('path'), vm = require('vm');
const { scriptList } = require('./helpers/load-game');

// Block 32: Ladenbilder je Gruppe (js/shopart/*.js). Mit ART_FILE=js/shopart/x.js (und ART_IDS=a,b,…) wird nur diese
// Gruppen-Datei geladen (die anderen nicht) – so kann man eine Datei prüfen, während an den anderen gearbeitet wird.
// Ohne ART_FILE: alle Gruppen, alle Läden.
const ROOT = path.join(__dirname, '..');
const only = process.env.ART_FILE;
beforeAll(() => {
  for (const rel of scriptList()) {
    if (only && rel.startsWith('js/shopart/') && rel !== only) continue;
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), { filename: rel });
  }
});
const game = expr => vm.runInThisContext(expr);
const ids = () => (process.env.ART_IDS ? process.env.ART_IDS.split(',') : game('Object.keys(SHOPS)'));

describe('Ladenbilder', () => {
  it('jeder geprüfte Laden hat ein eigenes Bild (SHOP_ART)', () => {
    for (const id of ids()) expect(game(`typeof SHOP_ART.${id}`), id).toBe('function');
  });

  it('zeichnet in allen Richtungen, Zoomstufen, bei Tag und Nacht, in allen Durchgängen – ohne Fehler', () => {
    game('startNew(); closeModal(); resize()');
    for (const id of ids()) for (const nightVal of [0, 0.45]) for (const z of [0.5, 1.3, 2.6]) for (const r of [0, 1, 2, 3]) for (const pass of ['ground', 'object', null]) {
      expect(() => game(`night = ${nightVal}; PASS = ${JSON.stringify(pass)}; drawObject('${id}', 400, 400, ${z}, 12345, 5, 5, 1, { b: '${id}', rot: ${r}, lvl: 1 }); PASS = null; night = 0`),
        `${id} Drehung ${r} Zoom ${z} Nacht ${nightVal} ${pass}`).not.toThrow();
    }
  });
});
