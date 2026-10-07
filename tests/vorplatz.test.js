const { loadGame, game } = require('./helpers/load-game');

// Block 91: Vorplatz bzw. Weg zur Tür – liegt ein Weg vor der Tür, führt ein Belag im Stil des Wegs (oder einem gewählten) bis zur Tür
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; resetUndo(); night = 0");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); rebuildCover(); recalc()");
});
// Feld direkt vor der Tür (vorderste Reihe, Spalte c im eigenen Rahmen)
const front = (b, x, y, rot, c = 0) => game(`(() => { const t = { b: '${b}', rot: ${rot} }, [w, h] = sizeOf('${b}', ${rot}, t), [da] = ITEMS['${b}'].size || [1, 1], [u, v] = kitTurn(${rot}, da / 2 + 0.5, ${c}); return [Math.round(${x} + (w - 1) / 2 + u), Math.round(${y} + (h - 1) / 2 + v)]; })()`);
const put = (k, t) => game(`state.tiles.set('${k}', ${JSON.stringify(t)}); rebuildCover(); recalc()`);
const weg = (x, y, style = 'klinker', o = {}) => put(`${x},${y}`, { b: 'weg', lvl: 1, style, ...o });
// alle Füllfarben beim Zeichnen mitschreiben
const fills = expr => game(`(() => { const seen = []; Object.defineProperty(g, 'fillStyle', { configurable: true, get: () => seen[seen.length - 1], set: v => seen.push(String(v)) });
  try { ${expr}; } finally { delete g.fillStyle; PASS = null; } return seen; })()`);
const ground = (k) => fills(`(() => { const [x, y] = keyXY('${k}'), t = state.tiles.get('${k}'); PASS = 'ground'; drawObject(t.b, 300, 300, 1, 0, x, y, t.lvl, t); })()`);
const C = col => game(`C('${col}')`);

describe('Vorplatz (Block 91)', () => {
  it('jedes Gebäude mit Tür ohne eigenen Weg hat jetzt einen Vorplatz bzw. Weg zur Tür', () => {
    const want = ['uni', 'bibliothek', 'kunst', 'kino', 'passage', 'theater', 'konzerthalle', 'aquarium', 'zoo', 'reihenhaus', 'muehle', 'holz', 'fischer',
      'stein', 'mine', 'kristallmine', 'steinmetz', 'schmiede', 'saege', 'baecker', 'fabrik', 'wasserkraft'];
    for (const b of want) expect(game(`!!COURTS.${b} && !COURTS.${b}.own`), b).toBe(true);
    for (const b of ['rathaus', 'museum', 'kaufhaus', 'markthalle', 'moebelhaus', 'hotel', 'grandhotel']) expect(game(`!!(COURTS.${b} && COURTS.${b}.own)`), b).toBe(true);
    // jeder Vorplatz liegt im eigenen Feld und reicht bis an die Vorderkante
    const bad = game(`Object.entries(COURTS).filter(([b, C0]) => { const [da, wb] = ITEMS[b].size || [1, 1];
      return courtParts(C0).some(({ a, s: [s0, s1] }) => a >= da / 2 || a < -da / 2 || s0 < -wb / 2 || s1 > wb / 2 || s0 >= s1); }).map(([b]) => b)`);
    expect(bad).toEqual([]);
  });
  it('nur mit Weg vor der Tür, im Stil des Wegs; eigener Belag, abschaltbar, nicht auf Brücken', () => {
    put('10,10', { b: 'holz', lvl: 1, rot: 1 });
    expect(game("courtOf(state.tiles.get('10,10'), 10, 10)")).toBe(null);
    const [fx, fy] = front('holz', 10, 10, 1);
    weg(fx + 1, fy);                                                                      // daneben zählt nicht
    expect(game("courtOf(state.tiles.get('10,10'), 10, 10)")).toBe(null);
    weg(fx, fy, 'sand');
    expect(game("courtStyle(state.tiles.get('10,10'), 10, 10)")).toBe('sand');
    game("state.tiles.get('10,10').vp = 'kopf'");
    expect(game("courtStyle(state.tiles.get('10,10'), 10, 10)")).toBe('kopf');
    game("state.tiles.get('10,10').vp = 'gibtsnicht'");                                  // unbekannter Belag: wie der Weg
    expect(game("courtStyle(state.tiles.get('10,10'), 10, 10)")).toBe('sand');
    game("state.tiles.get('10,10').zug = false");
    expect(game("courtStyle(state.tiles.get('10,10'), 10, 10)")).toBe(null);
    expect(game("!!courtOf(state.tiles.get('10,10'), 10, 10, true)")).toBe(true);
    game(`delete state.tiles.get('10,10').zug; state.tiles.get('${fx},${fy}').bridge = true`);
    expect(game("courtOf(state.tiles.get('10,10'), 10, 10)")).toBe(null);
  });
  it('in jeder Drehung trifft das Stück auf dem Wegfeld genau den Vorplatz (auch bei Tür neben der Mitte und großen Gebäuden)', () => {
    for (const b of ['holz', 'baecker', 'uni', 'theater', 'zoo', 'passage']) for (let rot = 0; rot < 4; rot++) {
      game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y)");
      put('12,12', { b, lvl: 1, rot });
      const wb = game(`(ITEMS.${b}.size || [1, 1])[1]`);
      for (let i = 0; i < wb; i++) { const [x, y] = front(b, 12, 12, rot, -wb / 2 + 0.5 + i); weg(x, y); }
      // Mitte jedes Stücks an der Feldkante, einmal vom Gebäude aus (Rahmen des Gebäudes), einmal vom Wegfeld aus (armUV)
      const r = game(`(() => { const t = state.tiles.get('12,12'), ct = courtOf(t, 12, 12), [w, h] = sizeOf(t.b, ${rot}, t), C0 = COURTS[t.b], [da] = ITEMS[t.b].size || [1, 1];
        const P = courtParts(C0);
        return ct.links.map(l => { const c = (l.q0 + l.q1) / 2, [u, v] = armUV(ct.d, 0.5, c);
          const fromWeg = [l.x + u, l.y + v];
          const lb = (l.q0 + l.q1) / 2, col = [...Array(ITEMS[t.b].size ? ITEMS[t.b].size[1] : 1).keys()].map(i => -(ITEMS[t.b].size ? ITEMS[t.b].size[1] : 1) / 2 + 0.5 + i)
            .find(cc => { const [uu, vv] = kitTurn(${rot}, da / 2 + 0.5, cc); return Math.round(12 + (w - 1) / 2 + uu) === l.x && Math.round(12 + (h - 1) / 2 + vv) === l.y; });
          const bLocal = col - lb, [U, V] = kitTurn(${rot}, da / 2, bLocal);
          return { fromWeg, fromBau: [12 + (w - 1) / 2 + U, 12 + (h - 1) / 2 + V], inside: P.some(({ s: [s0, s1] }) => bLocal >= s0 - 1e-9 && bLocal <= s1 + 1e-9), links: ct.links.length }; }); })()`);
      expect(r.length, `${b} ${rot}`).toBeGreaterThan(0);
      for (const o of r) {
        expect(o.fromWeg[0], `${b} ${rot}`).toBeCloseTo(o.fromBau[0]);
        expect(o.fromWeg[1], `${b} ${rot}`).toBeCloseTo(o.fromBau[1]);
        expect(o.inside, `${b} ${rot}`).toBe(true);
      }
      for (const l of game("courtOf(state.tiles.get('12,12'), 12, 12).links")) expect(game(`courtLinksAt(${l.x}, ${l.y}).length`), `${b} ${rot}`).toBeGreaterThan(0);
    }
  });
  it('gezeichnet: im Boden-Durchgang im Belag des Wegs, ohne Weg nichts – auch im Vorschaubild (alles auf einmal)', () => {
    put('10,10', { b: 'uni', lvl: 3, rot: 0 });
    const klinker = game('PATH_LOOK.klinker.fill');
    expect(ground('10,10')).not.toContain(C(klinker));
    for (const c of [-0.5, 0.5]) { const [x, y] = front('uni', 10, 10, 0, c); weg(x, y, 'klinker'); }
    expect(ground('10,10')).toContain(C(klinker));
    const all = fills("(() => { const t = state.tiles.get('10,10'); drawObject('uni', 300, 300, 1, 0, 10, 10, 3, t); })()");
    expect(all).toContain(C(klinker));
    expect(all.indexOf(C(klinker))).toBeLessThan(all.indexOf(C('#ffffff')) === -1 ? Infinity : all.lastIndexOf(C('#ffffff')));   // erst Boden, dann Haus
    game("state.tiles.get('10,10').zug = false");
    expect(ground('10,10')).not.toContain(C(klinker));
  });
  it('Wegfeld davor: der Bordstein hat eine Lücke, auch beim ganz breiten Weg', () => {
    put('10,10', { b: 'kino', lvl: 1, rot: 0 });
    const pts = [-0.5, 0.5].map(c => front('kino', 10, 10, 0, c));
    for (const [x, y] of pts) weg(x, y, 'platten', { wide: true });
    expect(game(`courtLinksAt(${pts[0][0]}, ${pts[0][1]})`).length).toBe(1);
    // breiter Weg: Bordstein zum Kino nur außerhalb des Vorplatzes
    const [x, y] = pts[0];
    const curb = () => game(`(() => { let area = 0; const o = poly, edge = C(PATH_LOOK.platten.edge);
      poly = (pts, fill) => { if (fill === edge) area += Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2; return o(pts, fill); };
      try { drawPath(300, 300, 1, ${x}, ${y}, state.tiles.get('${x},${y}')); } finally { poly = o; } return area; })()`);
    const withCourt = curb();
    game("state.tiles.get('10,10').zug = false");
    expect(withCourt).toBeLessThan(curb() - 1);
  });
  it('Gebäude mit eigenem Platz: ohne Weg wie früher, mit Weg im Belag des Wegs, aus: nur Wiese', () => {
    put('10,10', { b: 'hotel', lvl: 1, rot: 0 });
    const old = C('#ece3cf'), kopf = C(game('PATH_LOOK.kopf.fill'));
    expect(ground('10,10')).toContain(old);
    const [x, y] = front('hotel', 10, 10, 0, 0.5); weg(x, y, 'kopf');
    expect(ground('10,10')).toContain(kopf);
    expect(ground('10,10')).not.toContain(old);
    game("state.tiles.get('10,10').zug = false");
    expect(ground('10,10')).not.toContain(kopf);
    expect(ground('10,10')).not.toContain(old);
    game("delete state.tiles.get('10,10').zug; state.tiles.delete('" + x + ',' + y + "'); state.tiles.get('10,10').vp = 'kopf'; rebuildCover(); recalc()");
    expect(ground('10,10')).toContain(kopf);                                              // gewählter Belag auch ohne Weg
    put('20,4', { b: 'rathaus', lvl: 1, rot: 0 });
    expect(ground('20,4')).toContain(C('#e6dfd0'));
  });
  it('91d: Museum und Kaufhaus ohne Weg davor ohne alten Platz (auch gedreht), Möbelhaus mit Vorplatz ohne Sofa', () => {
    for (let rot = 0; rot < 4; rot++) {
      game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y)");
      put('10,10', { b: 'museum', lvl: 1, rot });
      expect(ground('10,10'), 'rot ' + rot).not.toContain(C('#ece3cf'));
      const [x, y] = front('museum', 10, 10, rot, 0); weg(x, y, 'kopf');
      expect(ground('10,10'), 'rot ' + rot).toContain(C(game('PATH_LOOK.kopf.fill')));
    }
    put('20,10', { b: 'kaufhaus', lvl: 1, rot: 0 });
    expect(ground('20,10')).not.toContain(C('#e6dfd0'));
    put('4,20', { b: 'moebelhaus', lvl: 1, rot: 0 });
    const sofa = () => fills("(() => { const t = state.tiles.get('4,20'); drawObject('moebelhaus', 300, 300, 1, 0, 4, 20, 1, t); })()").includes(C('#e9a23b'));
    expect(sofa()).toBe(true);
    for (const c of [-0.5, 0.5]) { const [x, y] = front('moebelhaus', 4, 20, 0, c); weg(x, y, 'sand'); }
    expect(sofa()).toBe(false);
  });
  it('Fenster: Schalter und Belag mit ↶, Hinweis ohne Weg; gespeichert', () => {
    put('10,10', { b: 'fabrik', lvl: 1, rot: 0 });
    game('openInfo(10, 10)');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Liegt ein Weg vor der Tür/);
    for (const c of [-0.5, 0.5]) { const [x, y] = front('fabrik', 10, 10, 0, c); weg(x, y, 'sand'); }
    game('openInfo(10, 10)');
    expect(game("!!document.querySelector('#panel [data-zug]')")).toBe(true);
    const id = game("document.querySelector('#panel [data-vp]:not([data-vp=\"\"])').dataset.vp");
    expect(game("STYLES.weg.filter(st => !styleOk(st)).some(st => document.querySelector(`#panel [data-vp=\"${st.id}\"]`))")).toBe(false);   // nur freigeschaltete
    game(`document.querySelector('#panel [data-vp="${id}"]').click()`);
    expect(game("state.tiles.get('10,10').vp")).toBe(id);
    game('undo()');
    expect(game("state.tiles.get('10,10').vp")).toBe(undefined);
    game(`openInfo(10, 10); document.querySelector('#panel [data-vp="${id}"]').click(); openInfo(10, 10); document.querySelector('#panel [data-zug]').click()`);
    expect(game("state.tiles.get('10,10').zug")).toBe(false);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    game(`adoptState(parseSave(${JSON.stringify(d)}))`);
    expect(game("[state.tiles.get('10,10').vp, state.tiles.get('10,10').zug]")).toEqual([id, false]);
  });
  it('Gartenweg der Häuser kann auch einen eigenen Belag haben', () => {
    game('state.restore.baum = 3');                                                       // Schachbrett-Belag frei
    put('10,10', { b: 'haus', lvl: 1, rot: 0 });
    weg(11, 10, 'sand');
    expect(game("gardenPath(state.tiles.get('10,10'), 10, 10).style")).toBe('sand');
    game('openInfo(10, 10)');
    const id = game("document.querySelector('#panel [data-vp]:not([data-vp=\"\"]):not([data-vp=\"sand\"])').dataset.vp");
    game(`document.querySelector('#panel [data-vp="${id}"]').click()`);
    expect(game("gardenPath(state.tiles.get('10,10'), 10, 10).style")).toBe(id);
  });
  it('91b: Weg statt Platz, schmalere Plätze, Zoo mit Weg durchs Tor, Büsche und Rasen nicht auf dem Belag', () => {
    for (const b of ['saege', 'fabrik', 'bibliothek', 'kunst', 'kaufhaus', 'museum', 'reihenhaus', 'zoo']) expect(game(`courtIsPlaza(COURTS.${b})`), b).toBe(false);
    for (const b of ['hotel', 'kino', 'theater', 'konzerthalle', 'aquarium', 'moebelhaus', 'grandhotel'])
      expect(game(`COURTS.${b}.p[1] <= (ITEMS.${b}.size[1] / 2) * 0.8`), b).toBe(true);
    expect(game('courtParts(COURTS.zoo).some(c => c.s[0] < 1 && c.s[1] > 1)')).toBe(true);    // durchs Tor
    // Reihenhaus: mit Wegen zu den Türen stehen die Büsche dazwischen
    put('10,10', { b: 'reihenhaus', lvl: 3, rot: 0 });
    for (const c of [-0.5, 0.5]) { const [x, y] = front('reihenhaus', 10, 10, 0, c); weg(x, y, 'sand'); }
    const bushes = game("(() => { const out = []; const o = kitBush; kitBush = (K, a, b) => out.push(b); try { drawObject('reihenhaus', 300, 300, 1, 0, 10, 10, 3, state.tiles.get('10,10')); } finally { kitBush = o; } return out; })()");
    const bands = game('courtParts(COURTS.reihenhaus).map(c => c.s)');
    for (const b of bushes) expect(bands.every(([s0, s1]) => b < s0 - 0.1 || b > s1 + 0.1), String(b)).toBe(true);
    // Grandhotel: mit Vorplatz kein Rasen unter den Brunnen
    put('20,10', { b: 'grandhotel', lvl: 1, rot: 0 });
    expect(ground('20,10')).toContain(C('#9fd07a'));
    const [gx, gy] = front('grandhotel', 20, 10, 0, 0); weg(gx, gy, 'sand');
    expect(ground('20,10')).not.toContain(C('#9fd07a'));
  });
  it('der Zoo hat ein Eingangstor mit Schild', () => {
    const texts = game("(() => { const out = []; const o = g.fillText; g.fillText = (s) => out.push(s); try { drawObject('zoo', 300, 300, 1, 0, 10, 10, 1, { b: 'zoo', lvl: 1, rot: 0 }); } finally { g.fillText = o; } return out; })()");
    expect(texts).toContain('ZOO');
  });
  it('alle Vorplatz-Gebäude zeichnen in jeder Drehung und jedem Belag ohne Fehler', () => {
    const bad = game(`(() => { const out = []; for (const b of Object.keys(COURTS)) for (let rot = 0; rot < 4; rot++) for (const style of ['sand', 'tritt', 'asphalt']) {
      for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y);
      const t = { b, lvl: 3, rot }; state.tiles.set('12,12', t); rebuildCover();
      const [w, h] = sizeOf(b, rot, t), [da, wb] = ITEMS[b].size || [1, 1];
      for (let i = 0; i < wb; i++) { const [u, v] = kitTurn(rot, da / 2 + 0.5, -wb / 2 + 0.5 + i); state.tiles.set(Math.round(12 + (w - 1) / 2 + u) + ',' + Math.round(12 + (h - 1) / 2 + v), { b: 'weg', lvl: 1, style }); }
      rebuildCover();
      try { for (const p of ['ground', 'object', null]) { PASS = p; drawObject(b, 300, 300, 1, 0, 12, 12, 3, t); } PASS = null;
        for (const [k, n] of state.tiles) if (n.b === 'weg') drawPath(300, 300, 1, ...keyXY(k), n);
      } catch (e) { PASS = null; out.push(b + rot + style + ': ' + e.message); } }
      return out; })()`);
    expect(bad).toEqual([]);
  });
});

describe('Eingang passt sich dem Weg an (Block 127)', () => {
  const parts = k => game(`courtPartsAt(state.tiles.get('${k}'), ...keyXY('${k}')).map(c => [+c.s[0].toFixed(3), +c.s[1].toFixed(3), c.band])`);
  const RW = () => game('ROAD_W');
  it('Weg an der ganzen Front entlang: ein Weg zur Tür, so breit wie der Weg – in jeder Drehung', () => {
    for (const b of ['theater', 'kino', 'passage', 'konzerthalle']) for (let rot = 0; rot < 4; rot++) {
      game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y)");
      put('12,12', { b, lvl: 1, rot });
      const wb = game(`(ITEMS.${b}.size || [1, 1])[1]`);
      for (let i = 0; i < wb; i++) { const [x, y] = front(b, 12, 12, rot, -wb / 2 + 0.5 + i); weg(x, y); }
      const P = parts('12,12'), base = game(`courtParts(COURTS.${b})[0].s`), m = (base[0] + base[1]) / 2;
      expect(P, `${b} ${rot}`).toEqual([[+(m - RW()).toFixed(3), +(m + RW()).toFixed(3), true]]);
      const links = game("courtOf(state.tiles.get('12,12'), 12, 12).links");
      expect(links.reduce((n, l) => n + l.q1 - l.q0, 0), `${b} ${rot}`).toBeCloseTo(2 * RW());   // auf dem Weg genau Wegbreite
    }
  });
  it('ein Wegfeld vor der Tür: Weg zur Tür; daneben bleibt der Platz', () => {
    put('12,12', { b: 'theater', lvl: 1, rot: 0 });
    const [x, y] = front('theater', 12, 12, 0, 0); weg(x, y);
    expect(parts('12,12')).toEqual([[-+RW().toFixed(3), +RW().toFixed(3), true]]);
    game(`state.tiles.delete('${x},${y}')`);
    const [x1, y1] = front('theater', 12, 12, 0, -1); weg(x1, y1);                                // nur am Rand
    expect(parts('12,12').some(([, , band]) => !band)).toBe(true);
  });
  it('ganz breiter Weg oder Wegfläche davor: der Platz bleibt; breiter Weg zur Tür (Museum) nicht breiter als der Weg', () => {
    put('12,12', { b: 'theater', lvl: 1, rot: 0 });
    for (const c of [-1, 0, 1]) { const [x, y] = front('theater', 12, 12, 0, c); weg(x, y, 'klinker', { wide: true }); }
    expect(parts('12,12').some(([, , band]) => !band)).toBe(true);
    game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y)");
    put('12,12', { b: 'museum', lvl: 1, rot: 0 });
    const [x, y] = front('museum', 12, 12, 0, 0); weg(x, y);
    const [[s0, s1]] = parts('12,12');
    expect(s1 - s0).toBeCloseTo(2 * RW());
  });
  it('Höfe über das ganze Grundstück (Rathaus) bleiben; Fenster sagt „Weg zur Tür“', () => {
    game("for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k)");
    put('12,12', { b: 'rathaus', lvl: 1, rot: 0 });
    for (const c of [-1, 0, 1]) { const [x, y] = front('rathaus', 12, 12, 0, c); weg(x, y); }
    expect(parts('12,12').some(([, , band]) => !band)).toBe(true);
    game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y)");
    put('12,12', { b: 'kino', lvl: 1, rot: 0 });
    for (const c of [-0.5, 0.5]) { const [x, y] = front('kino', 12, 12, 0, c); weg(x, y); }
    expect(game('courtHtml(state.tiles.get("12,12"), 12, 12)')).toMatch(/Weg zur Tür/);
    expect(() => ground('12,12')).not.toThrow();
  });
});
