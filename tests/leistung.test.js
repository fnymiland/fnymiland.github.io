const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 149: Leistungs-Wächter. Große Testwelten nah/mittel/weit, Tag/Nacht: je Bild Zeichenbefehle, live gezeichnete Objekte und
// Neumalen im ruhenden Bild zählen (die Test-Zeichenfläche zählt mit, tests/setup.js). Die Zahlen sind in jedem Lauf gleich.
// Reißt etwas Neues die Grenzen (z. B. ein bewegtes Ding, das jedes Bild das ganze Feld live zeichnet), schlägt der Test fehl.
// Gewollt mehr? Dann `npm run leistung:neu` (schreibt tests/leistung-grenzen.json neu) und die Zahlen in AUFGABEN.md festhalten.
const FILE = path.join(__dirname, 'leistung-grenzen.json');
const NEU = !!process.env.LEISTUNG_NEU;
const WORLDS = ['gross', 'freizeitpark', 'farben', 'neu', 'dach'], ZOOMS = [0.45, 0.8, 1.2, 1.6, 2.2];
const SPIEL = { ops: [1.1, 40], geo: [1.1, 200], live: [1.1, 3] };       // Spielraum: × Faktor + Zuschlag
const NAME = { ops: 'Zeichenbefehle', geo: 'Linienstücke/Formpunkte', live: 'live gezeichnete Objekte' };

beforeAll(() => loadGame());
function measure(world, night, z) {
  return game(`(() => {
    const pn = performance.now, na = nightAt, gh = gameHour, rgc = renderGroundChunk, dO = drawObject;
    performance.now = () => 0; nightAt = () => ${night} ? NIGHT_MAX : 0; gameHour = () => ${night} ? 23 : 12;   // Uhr steht: alles fertig malen
    try {
      const ks = [...state.tiles.keys()].map(keyXY), cx = ks.reduce((a, k) => a + k[0], 0) / ks.length, cy = ks.reduce((a, k) => a + k[1], 0) / ks.length;
      cam = state.cam; cam.z = ${z}; const p = iso(Math.round(cx), Math.round(cy)); cam.x = p.x; cam.y = p.y; lastZoom = ${z}; lastZoomChange = -1e9;
      let live = 0, ground = 0, quiet = 0, warm = 0;
      renderGroundChunk = (cx, cy, w) => {
        const b = chunkBounds(cx, cy), sx = (b.left - cam.x) * cam.z + W / 2, sy = (b.top - cam.y) * cam.z + H / 2;   // Vormalen knapp außerhalb zählt nicht
        if (!(sx > W || sy > H || sx + b.w * cam.z < 0 || sy + b.h * cam.z < 0)) ground++;
        return rgc(cx, cy, w);
      };
      // vorlaufen, bis nichts mehr nachgemalt wird (nach Zoomwechsel kommen die Bildchen in Paketen) – höchstens 150 Bilder
      for (; warm < 150 && quiet < 3; warm++) { ground = 0; stepMovers(1 / 60); render(1e6 + warm * 17); quiet = ground + SPRITE_STATS.made ? 0 : quiet + 1; }
      ground = 0; drawObject = (...a) => { live++; return dO(...a); }; globalThis.__ctxCount = {};
      stepMovers(1 / 60); render(1e6 + warm * 17);
      const c = globalThis.__ctxCount;
      const GEO = ['moveTo', 'lineTo', 'ellipse', 'arc', 'arcTo', 'bezierCurveTo', 'quadraticCurveTo', 'rect', 'roundRect'];
      let ops = 0, geo = 0; for (const k in c) if (GEO.includes(k)) geo += c[k]; else ops += c[k];
      return { ops, geo, live, repaint: ground + SPRITE_STATS.made, warm };   // made: je Bild gezählt;
    } finally { globalThis.__ctxCount = null; performance.now = pn; nightAt = na; gameHour = gh; renderGroundChunk = rgc; drawObject = dO; }
  })()`);
}

describe('Leistungs-Wächter (Block 149)', () => {
  const all = {};
  for (const w of WORLDS) {
    it(`Testwelt „${w}“: je Bild höchstens so viel Arbeit wie bisher (nah bis weit, Tag und Nacht)`, () => {
      global.WG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'testsave-' + w + '.json'), 'utf8'));
      // wie iPad/Mac (doppelte Pixeldichte): nah wird der Boden live gezeichnet (GROUND_MAX_SCALE) – mit 1 stünde alles im Zwischenspeicher
      Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 });
      game('adoptState(parseSave(WG)); closeModal(); closePanel(); state.tipsOff = true; resize()');
      // Testwelt „dach“ (Block 138): Leute auf den Dächern und Treppen – mit festem Zufall verteilt, dann angehalten (gleiche Zahlen je Lauf)
      if (w === 'dach') game(`(() => { const mr = Math.random; let s = 7; Math.random = () => (s = s * 16807 % 2147483647) / 2147483647;
        try { roofers.length = 0; for (let i = 0; i < 80; i++) { syncRoofers(); stepRoofers(0.4); } for (const r of roofers) { r.wait = 1e9; r.sit = false; } } finally { Math.random = mr; } })()`);
      const limits = !NEU && fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
      const bad = [], better = [];
      for (const night of [0, 1]) for (const z of ZOOMS) {
        const key = `${w} ${night ? 'Nacht' : 'Tag'} Zoom ${z}`, m = measure(w, night, z);
        all[key] = { ops: m.ops, geo: m.geo, live: m.live };
        // ruhendes Bild: nichts neu malen (sonst wird ein Zwischenspeicher jedes Bild ungültig)
        if (m.repaint) bad.push(`${key}: ${m.repaint}× neu gemalt im ruhenden Bild (Bildchen/Boden) – Zwischenspeicher wird ständig ungültig`);
        const L = limits[key];
        if (NEU || !L) continue;
        for (const k of ['ops', 'geo', 'live']) {
          if (L[k] == null) continue;
          const max = Math.ceil(L[k] * SPIEL[k][0] + SPIEL[k][1]);
          if (m[k] > max) bad.push(`${key}: ${m[k]} ${NAME[k]} je Bild – erlaubt ${max} (bisher ${L[k]})`);
          else if (m[k] < L[k] * 0.7 - SPIEL[k][1]) better.push(`${key}: ${k} ${L[k]} → ${m[k]}`);
        }
      }
      if (better.length) console.log(`Leistungs-Wächter: deutlich weniger Arbeit – Grenzen nachziehen (npm run leistung:neu):\n  ${better.join('\n  ')}`);
      expect(bad, 'Langsamer als erlaubt. Gewollt? → npm run leistung:neu und in AUFGABEN.md begründen').toEqual([]);
    }, 60000);                                                            // große Welt × 10 Szenen: im vollen Lauf über 5 s
  }
  afterAll(() => {
    if (!NEU) return;
    const old = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
    fs.writeFileSync(FILE, JSON.stringify({ ...old, ...all }, null, 1) + '\n');
  });
});
