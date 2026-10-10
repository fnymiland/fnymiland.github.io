const { loadGame, game } = require('./helpers/load-game');

// Züge auf Anhöhen und über die Gleis-Rampe (movers.js trainOnHills/drawTrainCarHill, Nutzer 10.10.2026: „die Rampe ist nur für Züge da“):
// oben um den Hub angehoben, auf der Rampe stetig (surfaceHeight), Wagen starr und schräg; gezeichnet mit dem vordersten Feld unter dem Wagen,
// Anhöhen davor decken ihn (occ), Streifen/Brüstung der Rampe danach (rampOverSpan); Antippen (trainAt). Ohne Anhöhen wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 32; y++) for (let x = 0; x <= 32; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; trains.length = 0; syncTrains.sig = null; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(16, 16); cam.x = p.x; cam.y = p.y; } night = 0');
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } trains.length = 0; syncTrains.sig = null'));
const H = 26;
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const anchor = (fx, fy, rot, len) => { const [Du, Dv] = UP[rot]; return [Math.min(fx, fx + (len - 1) * Du), Math.min(fy, fy + (len - 1) * Dv)]; };
// Rampe der Form form mit Fuß (fx, fy) in Richtung rot; dazu Gleis: n Felder vor dem Fuß (unten) und n hinter dem oberen Feld (oben)
function rampLine(form, fx, fy, rot, n = 3) {
  const len = game(`RAMP_FORMS.${form}.len`), [Du, Dv] = UP[rot], [ax, ay] = anchor(fx, fy, rot, len);
  game(`rampNewForm = '${form}'; buildRot = ${rot}; rotManual = true`);
  expect([form, rot, game(`placeError('huegelrampe', ${ax}, ${ay})`)]).toEqual([form, rot, null]);
  game(`build('huegelrampe', ${ax}, ${ay}, true); rotManual = false; recalc()`);
  const keys = [];
  for (let i = -n; i < len + n; i++) keys.push([fx + i * Du, fy + i * Dv]);
  rails(keys.filter((_, i) => i < n || i >= n + len));
  return keys;
}
// Zug (ohne Bahnhöfe) auf einer Feldfolge: pendelt zwischen den Enden
const fakeTrain = (keys, model = 'regio') => game(`(() => {
  trains.length = 0;
  const route = railPolyline(${JSON.stringify(keys.map(k => k.join()))}), kind = { ...TRAIN_KIND.${model}, n: TRAIN_KIND.${model}.n };
  const half = kind.n * (kind.len + kind.gap) / 2;
  trains.push({ id: 'probe', route, stops: [half, route.len - half], powered: true, model: '${model}', col: 0, kind, c: half, dir: 1, wait: 0, next: 1 });
  return route.len;
})()`);
// Wagen am Strecken-Ort c (Mitte des Zugs): Höhen, Zeichenfeld, Anhöhen davor, Rampe darüber
const carsAt = c => JSON.parse(game(`(() => {
  trains[0].c = ${c};
  return JSON.stringify(trainCars().map(m => {
    const k0 = Math.round(m.px) + ',' + Math.round(m.py), k = trainOnHills(m, k0), h = m.hill;
    return { k0, k, px: m.px, py: m.py, up: h ? h.up : false, base: h ? h.base : 0, ha: h ? h.ha : 0, hb: h ? h.hb : 0, occ: h ? h.occ : [], ramp: h ? h.ramp : null };
  }));
})()`));

describe('Höhe des Zugs', () => {
  it('Einschnitt A hinauf und wieder hinunter: Höhe stetig 0 … HILL_H, oben angehoben, keine Sprünge; Enden auf dem Gleis', () => {
    hills(block(10, 6, 16, 12));
    const keys = rampLine('a', 13, 12, 0);                                 // Fuß (13, 12), oben (13, 11), dahinter die Anhöhe
    const len = fakeTrain(keys);
    let prev = null, maxH = 0, minH = 1e9;
    for (let c = 0.5; c <= len - 0.5; c += 0.01) {
      const cars = carsAt(c);
      cars.forEach((m, i) => {
        const mid = (m.ha + m.hb) / 2;
        maxH = Math.max(maxH, mid); minH = Math.min(minH, mid);
        // Enden genau auf dem Gleis: Höhe an der Stelle (surfaceHeight) – auf der Rampe linear, oben HILL_H
        if (prev) { expect(Math.abs(m.ha - prev[i].ha)).toBeLessThan(0.2); expect(Math.abs(m.hb - prev[i].hb)).toBeLessThan(0.2); }
        expect(m.ha).toBeGreaterThanOrEqual(-1e-9); expect(m.hb).toBeLessThanOrEqual(H + 1e-9);
        if (m.up) expect(m.base).toBe(game(`hillLift(${m.k})`));        // um so viel hebt tileB das Feld an
      });
      prev = cars;
    }
    expect(minH).toBe(0); expect(maxH).toBe(H);
    // genaue Werte: Mitte des Fußes ¼, Mitte des oberen Felds ¾ (Rampe über 2 Felder), oben ganz
    expect(game('surfaceHeight(13, 12)')).toBeCloseTo(H / 4, 9);
    expect(game('surfaceHeight(13, 11)')).toBeCloseTo(H * 3 / 4, 9);
    expect(game('surfaceHeight(13, 10.2)')).toBe(H);
  });

  it('fährt wirklich: stepTrains pendelt über die Rampe hinauf und hinunter, Höhe der Wagen springt nie', () => {
    hills(block(10, 6, 16, 12));
    fakeTrain(rampLine('a', 13, 12, 0, 4));
    let prev = null, top = 0, bottom = 0, turns = 0, dir = game('trains[0].dir');
    for (let i = 0; i < 1600; i++) {
      game('stepTrains(0.05)');
      const cars = JSON.parse(game('JSON.stringify(trainCars().map(m => { trainOnHills(m, Math.round(m.px) + "," + Math.round(m.py)); return m.hill ? (m.hill.ha + m.hill.hb) / 2 : 0; }))'));
      if (prev) cars.forEach((h, j) => expect(Math.abs(h - prev[j])).toBeLessThan(0.05 * 1.6 * 2 * 13 / 1 + 0.01));   // höchstens Tempo × Steigung
      if (cars[0] === H) top++;
      if (cars[0] === 0) bottom++;
      const d = game('trains[0].dir'); if (d !== dir) { turns++; dir = d; }
      prev = cars;
    }
    expect(top).toBeGreaterThan(0); expect(bottom).toBeGreaterThan(0); expect(turns).toBeGreaterThanOrEqual(2);
  });

  it('alle Formen in allen Drehungen: Höhe stetig über Fuß, Rampe und Oberkante; Wagen schräg (vorn höher hinauf)', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut;
      for (const [fx, fy, rot] of [[16, 21 + o, 0], [21 + o, 16, 3], [16, 11 - o, 2], [11 - o, 16, 1]]) {
        game("state.hills.clear(); for (let y = 0; y <= 32; y++) for (let x = 0; x <= 32; x++) state.tiles.delete(x + ',' + y); recalc()");
        hills(block(12, 12, 20, 20));
        const keys = rampLine(form, fx, fy, rot), rlen = fakeTrain(keys);
        let prev = null, tilted = 0;
        for (let c = 0.45; c <= rlen - 0.45; c += 0.02) {
          const cars = carsAt(c);
          cars.forEach((m, i) => {
            if (prev) expect([form, rot, Math.abs(m.ha - prev[i].ha) < 0.3, Math.abs(m.hb - prev[i].hb) < 0.3]).toEqual([form, rot, true, true]);
            if (Math.abs(m.hb - m.ha) > 1) tilted++;
          });
          prev = cars;
        }
        expect([form, rot, tilted > 0]).toEqual([form, rot, true]);
      }
    }
  });
});

describe('Zeichenreihenfolge und Verdeckung', () => {
  it('vorderstes Feld unter dem Wagen (Maler-Reihenfolge); unten ohne Anhöhe wie bisher (Mittelfeld, kein m.hill)', () => {
    hills(block(10, 6, 16, 12));
    const keys = rampLine('a', 13, 12, 0, 4), len = fakeTrain(keys);
    const order = k => { const [x, y] = k.split(',').map(Number); return (x + y) * 1e5 + x; };
    for (let c = 0.5; c <= len - 0.5; c += 0.05) for (const m of carsAt(c)) {
      if (!m.up) { expect(m.k).toBe(m.k0); continue; }
      // Felder unter dem Wagen (Mitte, Enden): das gewählte ist das letzte gezeichnete
      expect(order(m.k)).toBeGreaterThanOrEqual(order(m.k0));
    }
    const low = carsAt(0.5)[0];                                            // ganz unten, weit weg von der Anhöhe
    expect([low.up, low.k, low.k0, low.base]).toEqual([false, low.k0, low.k0, 0]);
  });

  it('längs x im Einschnitt: die Wange davor (gleiche Diagonale, früher gezeichnet) deckt den Wagen – occ; längs y nicht nötig', () => {
    hills(block(10, 10, 18, 18));
    const keys = rampLine('a', 18, 14, 3, 3);                              // hinauf nach −x: Fuß (18, 14), oben (17, 14); Wange vorn bei y = 15
    const len = fakeTrain(keys);
    let seen = 0;
    for (let c = 0.5; c <= len - 0.5; c += 0.05) for (const m of carsAt(c)) {
      for (const [qx, qy, qh] of m.occ) { expect(qy).toBe(15); expect(qh).toBe(H); seen++; }
    }
    expect(seen).toBeGreaterThan(0);
    // längs y: die Wange rechts (x + 1) wird ohnehin später gezeichnet
    game("state.hills.clear(); for (let y = 0; y <= 32; y++) for (let x = 0; x <= 32; x++) state.tiles.delete(x + ',' + y); recalc()");
    hills(block(10, 10, 18, 18));
    const k2 = rampLine('a', 14, 18, 0, 3), l2 = fakeTrain(k2);
    for (let c = 0.5; c <= l2 - 0.5; c += 0.05) for (const m of carsAt(c)) expect(m.occ).toEqual([]);
  });

  it('unten längs einer Anhöhe (Gleis dahinter, Anhöhe davor): nur der Ausschnitt, Feld wie bisher', () => {
    hills(block(10, 13, 18, 15));
    const keys = []; for (let x = 8; x <= 20; x++) keys.push([x, 12]);    // Gleis bei y = 12, die Anhöhe davor (y = 13)
    rails(keys); const len = fakeTrain(keys);
    let seen = 0;
    for (let c = 0.5; c <= len - 0.5; c += 0.05) for (const m of carsAt(c)) {
      if (m.occ.length) { seen++; expect([m.up, m.k, m.ha, m.hb]).toEqual([false, m.k0, 0, 0]); for (const q of m.occ) expect(q[1]).toBe(13); }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('C und D: Streifen bzw. Brüstung nach dem Wagen (rampOverSpan über seine Felder); render zeichnet alles ohne Fehler, Wagen mit Höhe und richtigem Hub', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut;
      for (const [fx, fy, rot] of [[16, 21 + o, 0], [21 + o, 16, 3], [16, 11 - o, 2], [11 - o, 16, 1]]) {
        game("state.hills.clear(); for (let y = 0; y <= 32; y++) for (let x = 0; x <= 32; x++) state.tiles.delete(x + ',' + y); recalc()");
        hills(block(12, 12, 20, 20));
        const keys = rampLine(form, fx, fy, rot), rlen = fakeTrain(keys);
        game(`{ const p = iso(${fx}, ${fy}); cam.x = p.x; cam.y = p.y; } syncTrains.sig = null; syncTrains = (o => { globalThis.__st = o; return () => {}; })(syncTrains)`);
        try {
          for (let c = 0.5; c <= rlen - 0.5; c += 0.25) {
            const log = JSON.parse(game(`(() => {
              trains[0].c = ${c};
              const log = [], ml = moverLive, ro = rampOverSpan;
              moverLive = (m, z, now, w, lift) => { if (m.train) log.push({ k: null, up: !!(m.hill && m.hill.up), base: m.hill ? m.hill.base : 0, lift: lift || 0, ramp: !!(m.hill && m.hill.ramp) }); return ml(m, z, now, w, lift); };
              rampOverSpan = (...a) => { log.push({ over: a.slice(0, 4) }); return ro(...a); };
              try { render(1e6); } finally { moverLive = ml; rampOverSpan = ro; }
              return JSON.stringify(log);
            })()`));
            const cars = log.filter(e => e.over === undefined), overs = log.filter(e => e.over);
            expect(cars.length).toBe(2);                                    // beide Wagen gezeichnet
            for (const e of cars) expect([form, rot, c, e.lift]).toEqual([form, rot, c, e.base * 2]);   // tileB hebt um den Hub des Zeichenfelds
            expect(overs.length).toBe(cars.filter(e => e.ramp).length);
          }
        } finally { game('syncTrains = globalThis.__st'); }
      }
    }
  });

  it('Wagen schräg gezeichnet: Punkte des Quaders folgen der Höhe der Enden (relativ zum Zeichenfeld); ohne Höhe genau wie bisher', () => {
    hills(block(10, 6, 16, 12));
    const keys = rampLine('a', 13, 12, 0, 3);
    fakeTrain(keys);
    const pts = c => JSON.parse(game(`(() => {
      trains[0].c = ${c};
      const m = trainCars()[0], k = trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py)), out = [], pp = poly;
      poly = (p, f) => { out.push(p.map(q => [q[0], q[1]])); return pp(p, f); };
      try { drawTrainCar(m, 1, 0); } finally { poly = pp; }
      const p0 = toScreen(m.px, m.py);
      return JSON.stringify({ hill: m.hill, k, p0: [p0.x, p0.y], out });
    })()`));
    const r = pts(3.5);                                                    // auf der Rampe (Fuß bei 3 … oben bei 5 der Strecke)
    expect(r.hill.up).toBe(true);
    expect(r.hill.hb).toBeGreaterThan(r.hill.ha + 5);                      // vorn höher: schräg
    const roof = r.out[r.out.length - 2], ys = roof.map(q => q[1]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0);
    // flach unten (ohne Anhöhe unter dem Wagen): kein m.hill, gleiche Punkte wie drawTrainCarBody ohne Höhe
    const f = pts(0.6);
    expect(f.hill).toBe(null);
  });
});

describe('Antippen', () => {
  it('Zug oben bzw. auf der Rampe: trainAt liefert sein Gleisfeld; durch die Wange davor nicht; unten und ohne Anhöhen null', () => {
    hills(block(10, 6, 16, 12));
    const keys = rampLine('a', 13, 12, 0, 4);
    fakeTrain(keys);
    const tapCar = c => JSON.parse(game(`(() => {
      trains[0].c = ${c};
      const m = trainCars()[0]; trainOnHills(m, Math.round(m.px) + ',' + Math.round(m.py));
      const h = m.hill ? (m.hill.ha + m.hill.hb) / 2 : 0, p = toScreen(m.px, m.py), sx = p.x, sy = p.y - (h + 6) * cam.z;   // Mitte der Seitenwand
      return JSON.stringify({ hit: trainAt(sx, sy), want: [Math.round(m.px), Math.round(m.py)], up: !!(m.hill && m.hill.up) });
    })()`));
    const top = tapCar(8.5);                                               // oben auf der Anhöhe
    expect(top.up).toBe(true);
    expect([top.hit.x, top.hit.y]).toEqual(top.want);
    const mid = tapCar(5);                                                 // auf der Rampe
    expect(mid.up).toBe(true);
    expect([mid.hit.x, mid.hit.y]).toEqual(mid.want);
    expect(game('rampAt(...[' + mid.want + '])')).not.toBe(null);
    expect(tapCar(1).hit).toBe(null);                                      // unten: wie bisher
    expect(game('trainAt(-5000, -5000)')).toBe(null);
    game('state.hills.clear(); recalc()');
    expect(game('trainAt(0, 0)')).toBe(null);
  });
});

describe('Ohne Anhöhen und Spaziergänger', () => {
  it('ohne Anhöhen: trainOnHills lässt Feld und Wagen wie bisher', () => {
    const keys = []; for (let y = 8; y <= 20; y++) keys.push([13, y]);
    rails(keys); fakeTrain(keys);
    for (let c = 0.5; c <= 11.5; c += 0.5) for (const m of carsAt(c)) expect([m.k, m.up, m.occ]).toEqual([m.k0, false, []]);
    expect(game("(() => { const m = trainCars()[0]; trainOnHills(m, 'x'); return m.hill; })()")).toBe(null);
  });

  it('Bewohner gehen nicht über die Gleis-Rampe (nur Züge), die Treppe bleibt begehbar', () => {
    hills(block(10, 6, 16, 12));
    rampLine('a', 13, 12, 0, 1);
    expect(game('[walkable(13, 12), walkable(13, 11), wayish("huegelrampe"), wayish("huegeltreppe"), slopeAt(13, 12)]')).toEqual([false, false, false, true, true]);
  });
});

describe('Mit dem Schienennetz (Bahnhöfe unten, über die Anhöhe)', () => {
  it('Linie über zwei Gleis-Rampen: Zug fährt hinauf, oben entlang und hinunter; hält nur unten', () => {
    hills(block(10, 6, 16, 12));
    game("rampNewForm = 'a'");
    rampLine('a', 13, 12, 0, 0);                                           // vorn hinauf (nach −y)
    rampLine('a', 13, 6, 2, 0);                                            // hinten hinauf (nach +y)
    rails([[13, 8], [13, 9], [13, 10]]);                                   // oben
    const low = []; for (let y = 13; y <= 18; y++) low.push([13, y]); for (let y = 0; y <= 5; y++) low.push([13, y]);
    rails(low);
    game("state.tiles.set('12,17', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('12,1', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
    for (let i = 0; i < 6; i++) game(`state.tiles.set('${24 + (i % 3) * 2},${24 + Math.floor(i / 3) * 2}', { b: 'windrad', lvl: 3 })`);
    game("globalThis.__ra = regionAt; regionAt = (x, y) => y >= 9 ? 'wald' : 'home'; recalc(); syncMovers()");
    expect(game('T.rail.lines.length')).toBe(1);
    expect(game('trains.length')).toBe(1);
    const path = game("trains[0].route.pts.map(p => Math.round(p[0]) + ',' + Math.round(p[1]))");
    for (const k of ['13,12', '13,11', '13,9', '13,7', '13,6']) expect(path).toContain(k);
    let prev = null, top = 0;
    for (let i = 0; i < 2000; i++) {
      game('stepTrains(0.05)');
      const hs = JSON.parse(game('JSON.stringify(trainCars().map(m => { trainOnHills(m, Math.round(m.px) + "," + Math.round(m.py)); return m.hill ? (m.hill.ha + m.hill.hb) / 2 : 0; }))'));
      if (prev) hs.forEach((h, j) => expect(Math.abs(h - prev[j])).toBeLessThan(2.2));
      if (hs[0] === H) top++;
      prev = hs;
    }
    expect(top).toBeGreaterThan(0);
    for (const d of game('trains[0].stops')) { const [u, v] = game(`railPoint(trains[0].route, ${d})`); expect(game(`surfaceHeight(${u}, ${v})`)).toBe(0); }   // Halte unten
    expect(() => game('render(1e6)')).not.toThrow();
  });
});
