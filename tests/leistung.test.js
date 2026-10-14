const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 149: Leistungs-Wächter. Große Testwelten nah/mittel/weit, Tag/Nacht: je Bild Zeichenbefehle, live gezeichnete Objekte und
// Neumalen im ruhenden Bild zählen (die Test-Zeichenfläche zählt mit, tests/setup.js). Die Zahlen sind in jedem Lauf gleich.
// Reißt etwas Neues die Grenzen (z. B. ein bewegtes Ding, das jedes Bild das ganze Feld live zeichnet), schlägt der Test fehl.
// Gewollt mehr? Dann `npm run leistung:neu` (schreibt tests/leistung-grenzen.json neu) und die Zahlen in AUFGABEN.md festhalten.
const FILE = path.join(__dirname, 'leistung-grenzen.json');
const NEU = !!process.env.LEISTUNG_NEU;
const WORLDS = ['gross', 'freizeitpark', 'farben', 'neu', 'dach', 'bruecken'], ZOOMS = [0.45, 0.8, 1.2, 1.6, 2.2];
const SPIEL = { ops: [1.1, 40], geo: [1.1, 200], live: [1.1, 3] };       // Spielraum: × Faktor + Zuschlag
const NAME = { ops: 'Zeichenbefehle', geo: 'Linienstücke/Formpunkte', live: 'live gezeichnete Objekte' };

beforeAll(() => loadGame());
function measure(world, night, z, at = null) {                       // at: [x, y] Kamera (sonst Mitte aller Felder)
  return game(`(() => {
    const pn = performance.now, na = nightAt, gh = gameHour, rgc = renderGroundChunk, dO = drawObject;
    performance.now = () => 0; nightAt = () => ${night} ? NIGHT_MAX : 0; gameHour = () => ${night} ? 23 : 12;   // Uhr steht: alles fertig malen
    try {
      const ks = [...state.tiles.keys()].map(keyXY), at = ${JSON.stringify(at)}, cx = at ? at[0] : ks.reduce((a, k) => a + k[0], 0) / ks.length, cy = at ? at[1] : ks.reduce((a, k) => a + k[1], 0) / ks.length;
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
  // 160c E1: Gleisbrücken übers Wasser in „bruecken“ – feste Szenen mit eigenem Namen (die Schlüssel „bruecken …“ bleiben, dort fährt der echte Zug).
  // Zug und Boot fest (nur hier gesetzt): Regio über der Feldkante 9,5|35, einer vor der Kurve 22,36, einer auf der Leiter 8–13 × 40/41, Boot quer unter 10,35
  const GLEIS = [['bruecken-gleis', [10, 38]], ['bruecken-gleis-tx', [32, 37]]];
  it('Gleisbrücken übers Wasser (160c E1): gerade, Leiter, Kurve, T, X mit Zug und Boot – je Bild höchstens so viel Arbeit wie bisher', () => {
    global.WG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'testsave-bruecken.json'), 'utf8'));
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => 2 });
    game('adoptState(parseSave(WG)); closeModal(); closePanel(); state.tipsOff = true; resize()');
    game(`(() => { window.__e1 = { tc: trainCars, sm: shipMovers }; const tr = { kind: TRAIN_KIND.regio, col: 0, model: 'regio', route: {} };
      const car = (px, py, du, dv, i) => ({ train: tr, px, py, du, dv, i, n: 2, len: TRAIN_KIND.regio.len, d: null, mv: 1 });   // d null: ohne Strecke (trainOnHills lässt ihn, wo er ist)
      const cars = [car(9.6, 35, 1, 0, 0), car(8.76, 35, 1, 0, 1), car(21.4, 36, 1, 0, 0), car(10.5, 40, 1, 0, 0)];
      trainCars = () => cars.map(c => ({ ...c })); shipMovers = () => [{ boat: true, ship: 'dampfer', px: 10, py: 35, du: 0, dv: 1 }]; })()`);
    const limits = !NEU && fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
    const bad = [];
    try {
      for (const [name, at] of GLEIS) for (const night of [0, 1]) for (const z of ZOOMS) {
        const key = `${name} ${night ? 'Nacht' : 'Tag'} Zoom ${z}`, m = measure('bruecken', night, z, at);
        all[key] = { ops: m.ops, geo: m.geo, live: m.live };
        if (m.repaint) bad.push(`${key}: ${m.repaint}× neu gemalt im ruhenden Bild (Bildchen/Boden) – Zwischenspeicher wird ständig ungültig`);
        const L = limits[key];
        if (NEU) continue;
        if (!L) { bad.push(`neu: ${key} – noch kein geprüfter Wert (npm run leistung:neu)`); continue; }
        for (const k of ['ops', 'geo', 'live']) {
          if (L[k] == null) continue;
          const max = Math.ceil(L[k] * SPIEL[k][0] + SPIEL[k][1]);
          if (m[k] > max) bad.push(`${key}: ${m[k]} ${NAME[k]} je Bild – erlaubt ${max} (bisher ${L[k]})`);
        }
      }
    } finally { game('trainCars = window.__e1.tc; shipMovers = window.__e1.sm'); }
    expect(bad, 'Langsamer als erlaubt. Gewollt? → npm run leistung:neu und in AUFGABEN.md begründen').toEqual([]);
  }, 120000);
  afterAll(() => {
    if (!NEU) return;
    const old = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
    fs.writeFileSync(FILE, JSON.stringify({ ...old, ...all }, null, 1) + '\n');
  });
});
