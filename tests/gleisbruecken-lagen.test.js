const { loadGame, game } = require('./helpers/load-game');

// 160c E1a (plan-160c/karte-E1.md): Gleisbrücken übers Wasser als Brückenfeld gbAt (wie wbAt) und drawRailBed in Lagen h | v | d | o.
// Nichts Sichtbares: ohne Lagen (Gruppe w) genau der alte Ablauf, die Lagen nacheinander ergeben dieselben Flächen und Striche.
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look')");
  game("for (let y = 0; y <= 60; y++) for (let x = 0; x <= 60; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.hills.clear(); if (state.bruecken) state.bruecken.clear(); recalc()");
});
// Fälle wie tools/gleisbruecken-entwurf.js (x0, y0: Ecke eines 10 × 10-Felds) → Mittelfeld
const FAELLE = {
  gerade: [[2, 0, 7, 9], [[0, 5, 9, 5]], [4, 5]],
  nordsued: [[0, 2, 9, 7], [[5, 0, 5, 9]], [5, 4]],
  kurve: [[2, 2, 8, 9], [[0, 5, 5, 5], [5, 4, 5, 0]], [5, 5]],
  t: [[2, 2, 7, 8], [[0, 5, 9, 5], [5, 6, 5, 10]], [5, 5]],
  x: [[2, 2, 7, 7], [[0, 5, 9, 5], [5, 0, 5, 4], [5, 6, 5, 9]], [5, 5]],
  leiter: [[2, 1, 7, 9], [[0, 4, 9, 4], [0, 5, 9, 5]], [4, 5]],
  ende: [[2, 0, 11, 9], [[0, 5, 6, 5]], [6, 5]],
  einzel: [[2, 2, 7, 7], [[5, 5, 5, 5]], [5, 5]],
};
const bau = (fall, x0, y0, form = 0, rot = 0) => game(`(() => { const [w, ls] = ${JSON.stringify(FAELLE[fall].slice(0, 2))};
  for (let y = w[1]; y <= w[3]; y++) for (let x = w[0]; x <= w[2]; x++) state.terra.set((x + ${x0}) + ',' + (y + ${y0}), 'water');
  for (const [a, b, c, d] of ls) { const dx = Math.sign(c - a), dy = Math.sign(d - b); for (let x = a, y = b; ; x += dx, y += dy) { const X = x + ${x0}, Y = y + ${y0}, wet = terrainAt(X, Y) === 'water';
    state.tiles.set(X + ',' + Y, { b: 'schiene', lvl: 1, form: ${form}, rot: ${rot}, ...(wet ? { bridge: true } : {}) }); if (x === c && y === d) break; } }
  terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc(); })()`);
const mitte = (fall, x0, y0) => [FAELLE[fall][2][0] + x0, FAELLE[fall][2][1] + y0];
// Zeichnen mitschreiben: je Füllung/Teilpfad eines Strichs ein Eintrag mit Farbe und Punkten (ein Pfad mit vielen Teilen = viele Einträge,
// wie mehrere Pfade) – so vergleicht „Lagen nacheinander“ gegen „alles in einem“ unabhängig von der Pfad-Aufteilung
const rec = js => game(`(() => { const g0 = g, out = []; let path = [], cur = null;
  const st = { fillStyle: '', strokeStyle: '', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1 }, stack = [];
  const f = v => (Math.round(v * 1000) / 1000).toFixed(3);
  g = new Proxy(st, { get: (o, k) => {
    if (k === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (k === 'createPattern') return () => ({ setTransform() {} });
    if (k === 'save') return () => stack.push({ ...o });
    if (k === 'restore') return () => { const s = stack.pop(); if (s) Object.assign(o, s); };
    if (k === 'beginPath') return () => { path = []; cur = null; };
    if (k === 'moveTo') return (x, y) => { cur = [f(x) + ',' + f(y)]; path.push(cur); };
    if (k === 'lineTo') return (x, y) => { if (!cur) { cur = []; path.push(cur); } cur.push(f(x) + ',' + f(y)); };
    if (k === 'closePath') return () => {};
    if (k === 'fill') return () => out.push('fill ' + o.fillStyle + ' ' + path.map(p => p.join(' ')).join(' | '));
    if (k === 'stroke') return () => { for (const p of path) out.push('stroke ' + o.strokeStyle + ' ' + f(o.lineWidth) + ' ' + o.lineCap + ' ' + o.lineJoin + ' ' + p.join(' ')); };
    if (k === 'fillRect') return (x, y, w, h) => out.push('fillRect ' + o.fillStyle + ' ' + [x, y, w, h].map(f).join(','));
    if (k in o) return o[k];
    return (...a) => out.push(k + ' ' + a.map(v => typeof v === 'number' ? f(v) : '').join(','));
  }, set: (o, k, v) => { o[k] = v; return true; } });
  try { ${js} } finally { g = g0; } return out; })()`);
const sorted = a => [...a].sort();

describe('Gleisbrücken übers Wasser in Lagen (160c E1a)', () => {
  it('gbAt: Brückenfeld nur für Gleisbrücken übers Wasser; Achse wie seaCross, Höhe 0, wirft nie', () => {
    bau('gerade', 0, 0); bau('nordsued', 20, 0); bau('kurve', 40, 0);
    expect(game('gbAt(4, 5) && [gbAt(4, 5).water, gbAt(4, 5).rail, gbAt(4, 5).ax, gbAt(4, 5).hm, gbAt(4, 5).W, gbAt(4, 5).G, gbAt(4, 5).b.n, gbAt(4, 5).b.ax]')).toEqual([true, true, 0, 0, 0.3, null, 1, 0]);
    expect(game('gbAt(25, 4).ax')).toBe(1);
    expect(game('[seaCross(45, 5), gbAt(45, 5).ax]')).toEqual(['block', 0]);
    expect(game('[gbAt(0, 5), gbAt(4, 4), wbAt(4, 5)]')).toEqual([null, null, null]);   // Land, Wasser ohne Gleis; keine Wegbrücke
    expect(game("[-0.5, 0, 0.5].map(a => wegDeckH(gbAt(4, 5), a))")).toEqual([0, 0, 0]);
    expect(game('gbAt(4, 5) === gbAt(4, 5)')).toBe(true);
    game("state.tiles.set('4,4', { b: 'schiene', lvl: 1, bridge: true }); state.terra.set('4,4', 'water')");
    expect(game('!!gbAt(4, 4)')).toBe(true);                                  // neues Feld ohne recalc: Größe zählt (gbFresh)
    game("state.tiles.set('3,4', { b: 'schiene', bridge: true, form: 99, cross: true, rot: 7 }); state.terra.set('3,4', 'water'); groundVersion++");
    expect(game('(c => !!c && c.rail)(gbAt(3, 4))')).toBe(true);
    game("state.tiles.set('4,7', { b: 'schiene', lvl: 1 }); state.terra.set('4,7', 'water'); groundVersion++");
    expect(game('gbAt(4, 7)')).toBe(null);                                     // Schiene auf Wasser ohne Kennung (nur Tests): keine Brücke
    expect(game('gbAny()')).toBe(true);
    game("for (const [k, t] of [...state.tiles]) if (t.bridge) state.tiles.delete(k); recalc()");
    expect(game('gbAny()')).toBe(false);
  });
  it('ohne Lagen (Gruppe w) genau der alte Ablauf; die Lagen nacheinander ergeben dieselben Flächen und Striche', () => {
    let x0 = 0;
    const pos = [];
    for (const fall of Object.keys(FAELLE)) { bau(fall, x0, 0); pos.push([fall, ...mitte(fall, x0, 0)]); x0 += 14; }
    bau('gerade', 0, 20, 4); pos.push(['gerade Blumen', 4, 25]); bau('gerade', 14, 20, 3); pos.push(['gerade Pflaster', 18, 25]);
    bau('einzel', 28, 20, 0, 1); pos.push(['einzel rot 1', 33, 25]);
    for (const [fall, x, y] of pos) for (const z of [0.5, 1, 2.5]) {
      const alt = rec(`drawRailBed(0, 0, ${z}, ${x}, ${y}, state.tiles.get('${x},${y}'))`);
      expect(alt.length, fall).toBeGreaterThan(5);
      expect(rec(`bkDrawLagen(${x}, ${y}, 0, 0, ${z}, 'w', gbAt(${x}, ${y}))`), fall + ' w').toEqual(alt);
      expect(rec(`drawRailBed(0, 0, ${z}, ${x}, ${y}, state.tiles.get('${x},${y}'), null, ['h', 'v', 'd', 'o'])`), fall + ' alle Lagen').toEqual(alt);
      const teile = ['h', 'v', 'd', 'o'].flatMap(l => rec(`drawRailBed(0, 0, ${z}, ${x}, ${y}, state.tiles.get('${x},${y}'), null, ['${l}'])`));
      expect(sorted(teile), fall + ' z ' + z).toEqual(sorted(alt));
      const gr = ['h', 'vd', 'o'].flatMap(gr => rec(`bkDrawLagen(${x}, ${y}, 0, 0, ${z}, '${gr}', gbAt(${x}, ${y}))`));
      expect(sorted(gr), fall + ' Gruppen').toEqual(sorted(alt));
    }
  });
  it('Zuordnung: hinten die Pfähle der hinteren Seite, vorn die der vorderen; o nur das vordere Geländer gerader Felder (Kurve/T/X/Leiter: leer)', () => {
    let x0 = 0;
    const pos = [];
    for (const fall of Object.keys(FAELLE)) { bau(fall, x0, 0); pos.push([fall, ...mitte(fall, x0, 0)]); x0 += 14; }
    const Y = es => es.map(e => e.split(' ').pop().split(/[ ,]/)).map(a => +a[1]);
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    for (const [fall, x, y] of pos) {
      const L = l => rec(`drawRailBed(0, 0, 1, ${x}, ${y}, state.tiles.get('${x},${y}'), null, ['${l}'])`);
      const h = L('h'), v = L('v'), d = L('d'), o = L('o');
      expect(h.every(e => e.startsWith('fillRect #6f5238')), fall + ' h').toBe(true);
      expect(v.every(e => e.startsWith('fillRect #6f5238')), fall + ' v').toBe(true);
      expect(h.length && v.length, fall).toBeTruthy();
      expect(mean(v.map(e => +e.split(' ')[2].split(',')[1])), fall + ' vorn tiefer').toBeGreaterThan(mean(h.map(e => +e.split(' ')[2].split(',')[1])));
      const gerade = ['gerade', 'nordsued', 'ende', 'einzel'].includes(fall);
      if (!gerade) { expect(o, fall + ' o leer').toEqual([]); continue; }
      expect(o.length, fall + ' o').toBe(1);
      expect(o[0]).toMatch(/^stroke #6f5238 0\.900 round round /);
      const back = d.filter(e => e.startsWith('stroke #6f5238 0.900'));
      expect(back.length, fall + ' hinteres Geländer in d').toBe(1);
      expect(mean(Y(o)), fall + ' o vorn').toBeGreaterThan(mean(Y(back)));
    }
  });
  it('Landschiene und das Gleis auf einer Anhöhen-Brücke bleiben unverändert (ohne bridge: keine Lagen-Teile)', () => {
    bau('gerade', 0, 0);
    const alt = rec(`drawRailBed(0, 0, 2, 0, 5, state.tiles.get('0,5'))`);
    expect(rec(`drawRailBed(0, 0, 2, 0, 5, state.tiles.get('0,5'), null, null)`)).toEqual(alt);
    expect(alt.some(e => e.includes('#6f5238'))).toBe(false);
  });
  it('Bildchen gb| ohne Licht; Nachmalen immer live; Bewegtes und Nachtlicht werfen nicht (G null)', () => {
    bau('gerade', 0, 0);
    expect(game('[bkLampGroups(gbAt(4, 5)), brBox("w", gbAt(4, 5))]')).toEqual([[], [38, 32, 38, 22]]);
    const keys = game(`(() => { const ks = []; const gs = getSprite; getSprite = (k, ...a) => { ks.push(k); return null; };
      try { spriteBridge(4, 5, 0, 0, 1, 'w', gbAt(4, 5)); } finally { getSprite = gs; } return ks; })()`);
    expect(keys).toEqual(['gb|4,5|w|0']);
    const sb = game(`(() => { let n = 0; const s = spriteBridge; spriteBridge = (...a) => { n++; return s(...a); };
      try { bkRedo(4, 5, 0, 0, 1, 1e6, [-1e9, -1e9, 1e9, 1e9], ['h', 'vd', 'o'], null, false, gbAt(4, 5)); } finally { spriteBridge = s; } return n; })()`);
    expect(sb).toBe(0);
    expect(game(`(() => { WB_GLOW0.set('4,5', 3); try { wbRelight(4, 5, 0, 0, 1, gbAt(4, 5)); return 'ok'; } finally { WB_GLOW0.clear(); } })()`)).toBe('ok');
    expect(game(`(() => { const d = new Set(); bkDrawMoving(4, 5, 0, 0, 1, 1e6, gbAt(4, 5), [{ boat: true, ship: 'dampfer', px: 4, py: 5, du: 0, dv: 1 }, { critter: true, kind: 'schmetterling', h: 8, px: 4, py: 5 }], null, d); return d.size; })()`)).toBe(2);
  });
  it('nichts Sichtbares in E1a: weit weg weiter flat|-Bildchen, kein gb|', () => {
    bau('gerade', 0, 0);
    const keys = game(`(() => { const ks = []; const gs = getSprite; getSprite = (k, ...a) => { ks.push(k); return gs(k, ...a); };
      try { cam = state.cam; cam.z = 0.6; const p = iso(4, 5); cam.x = p.x; cam.y = p.y; spriteForce = true; render(1e6); render(1e6); } finally { getSprite = gs; spriteForce = null; } return ks; })()`);
    expect(keys.some(k => k.startsWith('flat|4,5'))).toBe(true);
    expect(keys.some(k => k.startsWith('gb|'))).toBe(false);
  });
});
