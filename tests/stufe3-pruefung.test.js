const { loadGame, game } = require('./helpers/load-game');

// Anhöhen Stufe 3 – kritische Prüfung der Zeichnungen (Block 157j, Nahaufnahmen tools/stufe3-pruefung.js → tools/vorschau/stufe3-nah-final.png):
// – an hinteren Kanten durfte das Feld vor einem Gebäude nicht vorgezogen werden (etwas Tieferes dahinter kommt später) – seine Oberseite schnitt
//   dann Garten, Hof, Büsche und weiche Schatten gerade ab: jetzt malt es das Gebäude nach seiner Oberseite noch einmal, auf seine Raute (hillLate)
// – entschieden wird je Gebäude einmal (sonst wurde ein Feld später doch vorgezogen und deckte, was frühere Streifen darauf gemalt hatten)
// – Schatten auf dem Garten, der über die Grundfläche hinausreicht (Reetdachhaus): lag unter dem Garten (hillShadeSpill)
// – heller Strich, wo ein Schatten über die Grenze einer Grundfläche mit flachen Teilen läuft: das Bildchen der Anhöhe beschattet ihren Streifen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 30; y++) for (let x = 0; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; trains.length = 0; recalc()");
  game('cam = state.cam; cam.z = 3; { const p = iso(10, 10); cam.x = p.x; cam.y = p.y; } night = 0; errorShown = false');
});
const put = (b, x, y, rot = 0, extra = {}) => game(`state.tiles.set('${x},${y}', { b: '${b}', lvl: 1, rot: ${rot}, ...${JSON.stringify(extra)} }); recalc()`);
const hills = (x0, y0, x1, y1) => game(`for (let y = ${y0}; y <= ${y1}; y++) for (let x = ${x0}; x <= ${x1}; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()`);
// ein Bild nah (Zoom z, Kamera auf Feld u, v): Reihenfolge der Oberseiten (drawHillTile) und Gebäude (drawObject, Durchgang, nachgemalt auf …)
const frame = (b, u, v, z = 3) => JSON.parse(game(`(() => {
  const log = [], o1 = drawHillTile, o2 = drawObject;
  drawHillTile = (x, y, ...a) => { log.push('top ' + x + ',' + y); return o1(x, y, ...a); };
  drawObject = (t, ...a) => { if (t === '${b}') log.push(t + ':' + PASS + (hillLateK ? '@' + hillLateK : '')); return o2(t, ...a); };
  try { cam.z = ${z}; const p = iso(${u}, ${v}); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawHillTile = o1; drawObject = o2; }
  return JSON.stringify(log);
})()`));

describe('hintere Kante: Feld davor nicht vorziehbar → Gebäude auf seiner Raute nachgemalt', () => {
  it('Reetdachhaus an der Kante −y: rechts daneben (dahinter tiefer, kommt später) erst Oberseite, dann Garten und Haus darauf', () => {
    hills(5, 5, 14, 14);
    put('haus', 9, 5, 0, { lvl: 3, look: 3 });                        // Garten (flacher Teil) reicht über die Grundfläche
    const log = frame('haus', 9, 6);
    const own = log.indexOf('haus:ground'), top = log.indexOf('top 10,5'), late = log.indexOf('haus:ground@10,5');
    expect(own).toBeGreaterThan(-1);
    expect(top).toBeGreaterThan(own);                                    // 10,5 kommt nach dem Haus (10,4 dahinter ist tiefer und später)
    expect(late).toBeGreaterThan(top);                                   // … und danach der Garten noch einmal
    expect(log.indexOf('haus:object@10,5')).toBeGreaterThan(late);
    expect(log.filter(l => l === 'top 10,5').length).toBe(1);            // nicht auch noch vorgezogen
    // vorn (9,6 · 10,6) wie bisher vorgezogen: vor dem Haus gezeichnet, nicht nachgemalt
    expect(log.indexOf('top 9,6')).toBeGreaterThan(-1);
    expect(log.indexOf('top 9,6')).toBeLessThan(own);
    expect(log.some(l => l.endsWith('@9,6'))).toBe(false);
    expect(game('errorShown')).toBe(false);
  });
  it('an der Kante −x: was dahinter liegt, ist schon gezeichnet – vorgezogen wie innen, nichts nachgemalt', () => {
    hills(5, 5, 14, 14);
    put('haus', 5, 9, 0, { lvl: 3, look: 3 });
    const log = frame('haus', 6, 9);
    expect(log.some(l => l.includes('@'))).toBe(false);
    expect(log.indexOf('top 5,10')).toBeLessThan(log.indexOf('haus:ground'));
  });
  it('innen: nichts nachgemalt; ohne Anhöhen: nichts davon', () => {
    hills(5, 5, 14, 14);
    put('haus', 9, 9, 0, { lvl: 3, look: 3 });
    expect(frame('haus', 9, 9).some(l => l.includes('@'))).toBe(false);
    game('state.hills.clear(); groundVersion++; recalc()');
    const log = frame('haus', 9, 9);
    expect(log.some(l => l.startsWith('top') || l.includes('@'))).toBe(false);
  });
  it('innen: das Feld rechts hinter dem Gebäude (gleiche Diagonale, kommt später) wird mit vorgezogen – sonst deckte seine Oberseite den Rand des vorgezogenen Felds davor', () => {
    hills(5, 5, 14, 14);
    put('kiosk', 9, 9);
    const log = frame('kiosk', 9, 9);
    const at = k => log.indexOf('top ' + k), obj = log.indexOf('kiosk:object');
    expect(at('10,8')).toBeGreaterThan(-1);
    expect(at('10,8')).toBeLessThan(at('10,9'));                         // erst das dahinter, dann das davor
    expect(at('10,9')).toBeLessThan(obj);
    for (const k of ['10,8', '10,9', '9,10', '10,10']) expect([k, log.filter(l => l === 'top ' + k).length]).toEqual([k, 1]);
    // breites Gebäude (4 × 2): die Felder hinter seiner rechten Ecke kommen erst nach dem ersten Streifen – auch sie vorgezogen, nichts nachgemalt
    game("state.tiles.delete('9,9'); recalc()");
    const [w, h] = game("sizeOf('passage', 1, { b: 'passage', rot: 1 })");
    expect([w, h]).toEqual([4, 2]);
    put('passage', 8, 8, 1);
    const big = frame('passage', 10, 9, 2);
    expect(big.some(l => l.includes('@'))).toBe(false);
    expect(big.indexOf('top 12,7')).toBeLessThan(big.indexOf('top 12,8'));
    expect(big.indexOf('top 12,8')).toBeLessThan(big.indexOf('passage:object'));
    expect(game('errorShown')).toBe(false);
  });
  it('großes Gebäude an der hinteren Ecke: je Feld entweder vorgezogen oder nachgemalt, nie beides; nachgemalt genau einmal', () => {
    hills(5, 5, 14, 14);
    put('zoo', 5, 5);                                                    // 4 × 4, in Streifen gezeichnet
    const log = frame('zoo', 7, 7, 2);
    const late = [...new Set(log.filter(l => l.startsWith('zoo:ground@')).map(l => l.split('@')[1]))];
    expect(late.length).toBeGreaterThan(0);                              // Spalte rechts (9,y): dahinter 9,4 tiefer und später
    for (const k of late) {
      expect([k, log.filter(l => l === 'top ' + k).length]).toEqual([k, 1]);   // nur die eigene Oberseite, kein Vorziehen/Nachziehen
      expect([k, log.filter(l => l === 'zoo:ground@' + k).length]).toEqual([k, 1]);
    }
    expect(game('errorShown')).toBe(false);
  });
});

describe('Schatten auf flachen Teilen oben', () => {
  it('Schatten unter Dingen mit flachen Teilen: im Bildchen der Anhöhe nur der Streifen vorn (zu fremden Nachbarn), sonst ganz', () => {
    hills(5, 5, 14, 14);
    put('schule', 8, 8); put('haus', 11, 8, 0, { lvl: 3, look: 1 });
    // Pfad, den hillShadePaint als Zuschnitt legt (Bildchen-Ursprung = Feldmitte, Hub 26, Oberseite nach vorn 0,0075 größer)
    const clipOf = (x, y) => JSON.parse(game(`(() => {
      const rec = [], g0 = g, f = 0.0075, P = (u, v) => [(u - v) * TW / 2, (u + v) * TH / 2 - 26];
      g = new Proxy({}, { get: (t, p) => p === 'canvas' ? null : (...a) => { if (p === 'moveTo' || p === 'lineTo' || p === 'clip') rec.push([p, ...a.map(n => typeof n === 'number' ? Math.round(n * 100) / 100 : n)]); } });
      try { hillShadePaint(${x}, ${y}, 26, [P(-0.5, -0.5), P(0.5 + f, -0.5), P(0.5 + f, 0.5 + f), P(-0.5, 0.5 + f)]); } finally { g = g0; }
      return JSON.stringify(rec.slice(0, rec.findIndex(r => r[0] === 'clip') + 1));
    })()`));
    expect(game("hillShadeFresh().own.has('9,9')")).toBe(true);
    expect(game("hillShadeSig(9, 9)")).toMatch(/^:o/);                   // Schatten der Schule liegt darauf, aber nicht im Bildchen …
    const own = clipOf(9, 9);                                            // … außer den Streifen vorn (zu 10,9 und 9,10: nicht unter der Schule)
    expect(own.filter(r => r[0] === 'moveTo')).toEqual([['moveTo', 32, -26], ['moveTo', 0, -10]]);
    const inner = clipOf(8, 8);                                          // 9,8 und 8,9 gehören auch zur Schule: kein Streifen
    expect(inner.filter(r => r[0] === 'moveTo')).toEqual([]);
    expect(game("hillShadeFresh().own.has('10,8')")).toBe(false);
    const out = clipOf(10, 8);                                           // nicht unter der Schule: die ganze Oberseite
    expect(out.filter(r => r[0] === 'moveTo')).toEqual([['moveTo', 0, -42]]);
  });
  it('Garten über die Grundfläche hinaus (Reetdachhaus): Schatten der Nachbarn darüber; beim Nachmalen nur auf diesem Feld', () => {
    hills(5, 5, 14, 14);
    put('haus', 9, 9, 0, { lvl: 3, look: 3 });
    game("hillSpillMemo.clear(); hillSpillMemo.set('haus|0|3|3', 0.15)"); // im Test misst niemand Bildpunkte (Leinwand-Attrappe)
    expect(game("hillShadeFresh().m.has('10,9')")).toBe(true);          // eigener Schatten nach rechts
    const n = JSON.parse(game(`(() => {
      const keep = hillShadeSpill, calls = [];
      hillShadeSpill = (t, ...a) => { calls.push([t.b, hillLateK]); return keep(t, ...a); };
      try { cam.z = 3; const p = iso(9, 9); cam.x = p.x; cam.y = p.y; render(1e6); } finally { hillShadeSpill = keep; }
      return JSON.stringify({ calls, cv: hillSpillCache.has('9,9') });
    })()`));
    expect(n.calls).toEqual([['haus', null]]);
    expect(n.cv).toBe(true);                                             // Maske gemalt und je Gebäude gemerkt
    // ruhendes Bild: dieselbe Maske wieder (keine neue Leinwand)
    const again = game("(() => { const e = hillSpillCache.get('9,9'), cv = e.cv; render(1e6 + 17); return hillSpillCache.get('9,9').cv === cv; })()");
    expect(again).toBe(true);
    // an der Kante −y (rechts daneben nachgemalt, davor 10,6 auch: hinter ihm kommt 10,5 erst später): je Feld einmal, nur dieses Feld
    game("state.tiles.delete('9,9'); recalc()");
    put('haus', 9, 5, 0, { lvl: 3, look: 3 });
    game("hillSpillMemo.set('haus|0|3|3', 0.15)");
    const m = JSON.parse(game(`(() => {
      const keep = hillShadeSpill, keepOn = hillShadeOn, calls = [], on = [];
      hillShadeSpill = (t, ...a) => { calls.push(hillLateK); return keep(t, ...a); };
      hillShadeOn = (...a) => { on.push(hillLateK); return keepOn(...a); };
      try { cam.z = 3; const p = iso(9, 6); cam.x = p.x; cam.y = p.y; render(1e6); } finally { hillShadeSpill = keep; hillShadeOn = keepOn; }
      return JSON.stringify({ calls, on });
    })()`));
    expect(m.calls).toEqual([null, '10,5', '10,6']);
    expect(m.on).toEqual([null, '10,5', '10,6']);                        // nachgemalt: hillShadeOn steigt aus (sonst doppelt)
    expect(game('errorShown')).toBe(false);
  });
  it('flache Teile oben ruhen wie im Boden-Bild unten (Zeit 0: das Becken der Glasvilla schimmerte oben, unten nicht)', () => {
    hills(5, 5, 14, 14);
    put('haus', 9, 9, 0, { lvl: 6 });
    const times = JSON.parse(game(`(() => {
      const o = drawObject, out = [];
      drawObject = (t, cx, cy, z, now, ...r) => { if (t === 'haus') out.push(PASS + ':' + now); return o(t, cx, cy, z, now, ...r); };
      try { cam.z = 3; const p = iso(9, 9); cam.x = p.x; cam.y = p.y; render(1e6); } finally { drawObject = o; }
      return JSON.stringify(out);
    })()`));
    expect(times).toContain('ground:0');
    expect(times).toContain('object:1000000');
  });
  it('hillSpills misst je Aussehen einmal (wie weit, in Feldern); ohne Bildpunkte (Test) 0', () => {
    game('hillSpillMemo.clear()');
    expect(game("hillSpills({ b: 'haus', rot: 0, lvl: 3, look: 3 })")).toBe(0);
    expect(game('hillSpillMemo.size')).toBe(1);
    expect(game("hillSpills({ b: 'haus', rot: 0, lvl: 3, look: 3 })")).toBe(0);
    expect(game('hillSpillMemo.size')).toBe(1);
  });
});
