const { loadGame, game } = require('./helpers/load-game');

// Bergportal (Block 157m, Nutzer 11.10.2026: „wieso haben wir keine Tunneleinfahrt an einer Seitenwand?“): eine Öffnung in der Wand einer Anhöhe,
// die Schiene fährt eben hinein, dahinter der Tunnel unter der Anhöhe. Regeln, Netz mit fahrendem Zug durch den Berg zwischen zwei Bahnhöfen, ↶,
// Speichern/Laden, Migration der alten Portal-Formen der Tunneleinfahrt, Fenster beim abgeschnittenen Wagen, ohne Anhöhen unverändert
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look')");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const r of Object.keys(RES)) state.res[r] = 99999");
  game("for (let y = 0; y <= 26; y++) for (let x = 0; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; state.paintNew.bergportal = {}; buildRot = 0; rotManual = false; hillWalkers.length = 0; walkers.length = 0; trains.length = 0; syncTrains.sig = null; night = 0; recalc(); resetUndo()");
});
afterEach(() => game('if (globalThis.__ra) { regionAt = globalThis.__ra; delete globalThis.__ra } trains.length = 0; syncTrains.sig = null'));
const hill = (x0, y0, x1, y1) => game(`for (let y = ${y0}; y <= ${y1}; y++) for (let x = ${x0}; x <= ${x1}; x++) build('anhoehe', x, y, true); recalc()`);
const UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// Anhöhe 8–11 × 8–12; Portal +x (11,10, Drehung 3) und −x (8,10, Drehung 1); Tunnel 9–10; Schienen 4–7 und 12–15; Bahnhöfe 3 und 16
function bergbahn() {
  hill(8, 8, 11, 12);
  game("buildRot = 3; build('bergportal', 11, 10); buildRot = 1; build('bergportal', 8, 10); buildRot = 0");
  game("for (const x of [9, 10]) build('tunnel', x, 10, true); for (let x = 4; x <= 7; x++) build('schiene', x, 10, true); for (let x = 12; x <= 15; x++) build('schiene', x, 10, true)");
  game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
  game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('16,10', { b: 'station', lvl: 1, rot: 0 })");
  for (let i = 0; i < 10; i++) game(`state.tiles.set('${2 + i},24', { b: 'windrad', lvl: 3 })`);
  game('recalc(); syncTrains()');
}

describe('Einbau', () => {
  it('Menü direkt hinter der Tunneleinfahrt, Forschung U-Bahn, Preis 800 + Quader 4 + Metall 2, zwei Formen frei; Tipp, Wirkung, Album, Bild ohne Fehler', () => {
    const v = game("MENU[0].groups.find(g => g.id === 'untergrund').items");
    expect(v[v.indexOf('tunneleinfahrt') + 1]).toBe('bergportal');
    expect(game("[ITEMS.bergportal.tech, ITEMS.bergportal.cost, ITEMS.bergportal.mat]")).toEqual(['ubahn', 800, { quader: 4, metall: 2 }]);
    expect(game("DECO_LOOKS.bergportal.forms.map(f => f.id + (f.design ? '$' : ''))")).toEqual(['bogen', 'offen']);
    expect(game("[!!FX.bergportal, !!ITEM_TIPS.bergportal, LATE_ALBUM.has('b:bergportal'), BIG_ON_TILE.has('bergportal'), noCopy('bergportal')]")).toEqual([true, true, true, true, true]);
    expect(() => game("thumbRaw('bergportal'); thumbRaw('tunnel'); setTool('bergportal'); renderStyleBar('bergportal'); setTool('look')")).not.toThrow();
    game("state.techs.delete('ubahn')");
    hill(8, 8, 11, 12);
    expect(game("placeError('bergportal', 11, 10)")).toMatch(/erst mit/);
  });
});

describe('Regeln', () => {
  it('nur auf den Rand einer Anhöhe (erste Ebene), dreht sich von selbst zur Wand – in allen vier Richtungen', () => {
    hill(8, 8, 12, 12);
    expect(game("placeError('bergportal', 5, 5)")).toMatch(/Rand einer Anhöhe/);
    expect(game("placeError('bergportal', 10, 10)")).toMatch(/an den Rand/);
    for (const [x, y, r] of [[10, 12, 0], [12, 10, 3], [10, 8, 2], [8, 10, 1]]) {
      game(`buildRot = ${(r + 2) & 3}`);                                  // gewählte Drehung zählt nur, wenn mehrere passen
      expect(game(`placeRot('bergportal', ${x}, ${y})`), `${x},${y}`).toBe(r);
      expect(game(`placeError('bergportal', ${x}, ${y})`), `${x},${y}`).toBe(null);
    }
    game("buildRot = 0; state.hills.get('12,12').h = 2; recalc()");
    expect(game("placeError('bergportal', 12, 12)")).toMatch(/ersten Ebene/);
  });
  it('kostet 800 Taler, Quader 4, Metall 2; Feld bleibt Anhöhe; davor kein Wasser, keine Treppe; oben frei; nicht auf den Tunnel; keine Linie vor der Wand', () => {
    hill(8, 8, 12, 12);
    const m = game('state.money'), q = game('state.res.quader');
    expect(game("build('bergportal', 10, 12)")).toBe(true);
    expect(game("[state.money, state.res.quader, state.tiles.get('10,12').b, state.tiles.get('10,12').rot, !!hillAt(10, 12)]")).toEqual([m - 800, q - 4, 'bergportal', 0, true]);
    game("state.terra.set('12,13', 'water'); recalc()");
    expect(game("[bpDirs(12, 11), bpDirs(12, 12)]")).toEqual([[3], [3]]);   // Ecke: nach +y Wasser – nur noch die Wand nach +x
    game("state.terra.set('12,13', 'grass'); state.tiles.set('9,13', { b: 'huegeltreppe', lvl: 1, rot: 0 }); recalc()");
    expect(game("placeError('bergportal', 9, 12)")).toMatch(/Treppe/);
    game("state.tiles.delete('9,13'); build('baum', 12, 11, true); recalc()");
    expect(game("placeError('bergportal', 12, 11)")).toMatch(/Oben steht/);
    game("state.tunnels.set('12,9', {}); recalc()");
    expect(game("placeError('bergportal', 12, 9)")).toMatch(/Nicht auf den Tunnel/);
    game("state.edges.set(edgeBetween(12, 10, 13, 10), { b: 'zaun', style: 'latten' }); recalc()");
    expect(game("placeError('bergportal', 12, 10)")).toMatch(/Vor der Wand steht/);
    expect(game("stairEdgeError(edgeBetween(10, 12, 10, 13))")).toMatch(/Bergportal/);   // keine Linie quer vor die Öffnung (edgeError)
  });
  it('Anhöhe darunter nicht abtragen, Feld davor nicht anheben/kein Teich/keine Treppe/keine Gleis-Rampe; Tragen, Gruppe und Kopie gesperrt; Kleinkram oben nicht', () => {
    hill(8, 8, 12, 12);
    game("build('bergportal', 10, 12)");
    expect(game("demolishInfo(10, 12).label")).toMatch(/Bergportal/);          // erst das Portal
    expect(game("lowerHill(10, 12)")).toBe(false);
    expect(game("placeError('anhoehe', 10, 13)")).toMatch(/Bergportal/);
    expect(game("placeError('graben', 10, 13)")).toMatch(/Bergportal/);
    expect(game("placeError('huegeltreppe', 10, 13)")).toMatch(/Bergportal/);
    expect(game("smallError('baum', 10, 12, 0)")).toMatch(/kein Platz/);
    game("pickUp(10, 12, 0)");
    expect(game("[!!moving, state.tiles.get('10,12').b]")).toEqual([false, 'bergportal']);
    expect(game("pickUpGroup(9, 11, 11, 12)")).toBe(false);                   // nur das Portal darin: bleibt stehen
    expect(game("placeError('bergportal', 12, 10, 3, { move: true })")).toMatch(/sitzt in der Wand/);
    // Abriss-Rechteck: erst nur das Portal – die Anhöhe bleibt (Nutzer 11.10.2026), ↶ bringt es zurück
    game("undoable(() => { plan = { kind: 'rect', tool: 'abriss', a: { x: 10, y: 12 }, b: { x: 10, y: 12 } }; const p = planScan(plan); for (const [, , f] of p.order) f(); plan = null; recalc(); })");
    expect(game("[!!state.tiles.get('10,12'), !!hillAt(10, 12)]")).toEqual([false, true]);
    expect(game('undo()')).toBe(true);
    expect(game("[state.tiles.get('10,12') && state.tiles.get('10,12').b, !!hillAt(10, 12)]")).toEqual(['bergportal', true]);
  });
});

describe('Netz und Zug durch den Berg', () => {
  it('vorn die Schiene, hinten der Tunnel – zwei Bahnhöfe durch den Berg verbunden, der Zug fährt hindurch', () => {
    bergbahn();
    expect(game("[trackLink(12, 10, 11, 10), trackLink(11, 10, 10, 10), trackLink(8, 10, 7, 10), trackLink(9, 10, 8, 10)]")).toEqual([true, true, true, true]);
    expect(game("[trackLink(11, 10, 11, 11), trackLink(11, 10, 11, 9), trackLink(11, 11, 12, 11)]")).toEqual([false, false, false]);
    expect(game("T.rail.comp.get('4,10') === T.rail.comp.get('15,10')")).toBe(true);
    expect(game('[T.rail.lines.length, trains.length]')).toEqual([1, 1]);
    const keys = game('trains[0].route.pts.map(p => Math.round(p[0]) + "," + Math.round(p[1]))');
    for (const k of ['12,10', '11,10', '10,10', '9,10', '8,10', '7,10']) expect(keys).toContain(k);
    expect(game("[railArms(12, 10).map(a => a.join()).sort(), railArms(7, 10).map(a => a.join()).sort()]")).toEqual([['-1,0', '1,0'], ['-1,0', '1,0']]);   // kein Prellbock vor der Wand
    // fahren: der Zug kommt durch den Berg hinüber
    const seen = new Set(), xs = [];
    for (let i = 0; i < 6000; i++) {
      game('stepTrains(0.05)');
      const c = game("trainCars().map(m => { const c = trainTunnelCut(m); return [m.px, c === 'hide' ? 'hide' : c && c.portal && c.portal.bp ? (c.portal.inn ? 'zu sehen' : 'draußen') : 'frei']; })");
      for (const [x, s] of c) { xs.push(x); if (s !== 'frei') seen.add(s); }
    }
    expect([...seen].sort()).toEqual(['draußen', 'hide', 'zu sehen']);
    expect([Math.min(...xs) < 6, Math.max(...xs) > 13]).toEqual([true, true]);   // ganz hinüber und zurück
  });
  it('Wagen am Portal: draußen abgeschnitten, im Berg nur durch die Öffnung (sichtbare Wand) bzw. gar nicht (hintere Wand), gezeichnet mit dem Feld davor', () => {
    bergbahn();
    let c = game("trainTunnelCut({ px: 11.7, py: 10, du: -1, dv: 0, len: 0.78 })");
    expect(c.k).toBe('12,10'); expect(c.cut[1]).toBeCloseTo(0.2); expect(c.portal.inn[0]).toBeCloseTo(0.2); expect(c.portal.out).toBe(true);
    expect(game("trainTunnelCut({ px: 10.3, py: 10, du: -1, dv: 0, len: 0.78 }).portal.inn")).toEqual([-0.39, 0.39]);   // ganz drin, noch zu sehen
    expect(game("trainTunnelCut({ px: 9.6, py: 10, du: -1, dv: 0, len: 0.78 })")).toBe('hide');
    c = game("trainTunnelCut({ px: 7.7, py: 10, du: 1, dv: 0, len: 0.78 })");   // hintere Wand (−x): die Anhöhe davor verdeckt
    expect([c.k, c.portal.inn]).toEqual(['7,10', null]); expect(c.cut[1]).toBeCloseTo(-0.2);
    expect(game("trainTunnelCut({ px: 8.2, py: 10, du: 1, dv: 0, len: 0.78 })")).toBe('hide');
    expect(game("trainTunnelCut({ px: 13, py: 10, du: -1, dv: 0, len: 0.78 })")).toBe(null);
    // Nutzer 11.10.2026 („beim Herausfahren blitzt er kurz auf“): ragt die Front nur einen Hauch heraus, ist es der ganze Wagen im Berg – keine
    // Schnittfläche (ohne Fenster und Scheinwerfer) als Front für ein Bild
    c = game("trainTunnelCut({ px: 11.12, py: 10, du: 1, dv: 0, len: 0.78 })");
    expect([c.cut, c.portal.out, c.portal.inn]).toEqual([null, false, [-0.39, 0.39]]);
    // Nutzer 11.10.2026 („Zug glitcht beim Einfahren“): steckt die Front erst einen Hauch in der Wand, nie „ganz draußen“ (null) – sonst sah
    // trainOnHills das Ende auf dem Portalfeld oben und kippte den Wagen steil hoch. Alle Wagenlängen, hinein und hinaus, beide Portale
    for (const len of [0.78, 1, 1.2]) for (const e of [0.001, 0.01, 0.019]) {
      const la = len / 2;
      expect(game(`trainTunnelCut({ px: ${11.5 + la - e}, py: 10, du: -1, dv: 0, len: ${len} })`)).not.toBe(null);   // hinein (+x-Wand)
      expect(game(`trainTunnelCut({ px: ${11.5 - la + e}, py: 10, du: 1, dv: 0, len: ${len} })`)).not.toBe(null);    // hinaus: Heck noch drin
      expect(game(`trainTunnelCut({ px: ${7.5 - la + e}, py: 10, du: 1, dv: 0, len: ${len} })`)).not.toBe(null);     // hinein (−x-Wand)
    }
    // im Berg kein Schatten der Anhöhe auf dem Wagen, der Verlauf läuft waagerecht (nur nach der Tiefe dunkler)
    expect(game("String(drawCarPortal)")).not.toMatch(/BP_SHADE/);
    expect(game("String(drawCarPortal)")).toMatch(/\[w1\.x, w0\.y\]/);
    // gezeichnet ohne Fehler: erst im Berg (Öffnung als Ausschnitt), dann draußen
    expect(() => game("(() => { const m = { train: trains[0], px: 11.7, py: 10, du: -1, dv: 0, len: 0.78, i: 0, n: 2 }, c = trainTunnelCut(m); m.cut = c.cut; m.portal = c.portal; drawTrainCar(m, 2, 0); })()")).not.toThrow();
  });
  it('Fenster: vorn an der Schiene / hinten am Tunnel', () => {
    hill(8, 8, 11, 12);
    game("buildRot = 3; build('bergportal', 11, 10); buildRot = 0");
    game('openInfo(11, 10)');
    let txt = game("document.getElementById('panel').textContent");
    expect(txt).toContain('Vorn noch keine Schiene'); expect(txt).toContain('Hinten noch kein Tunnel');
    game("closePanel(); build('schiene', 12, 10, true); build('tunnel', 10, 10, true); recalc(); openInfo(11, 10)");
    txt = game("document.getElementById('panel').textContent");
    expect(txt).toContain('Vorn an der Schiene'); expect(txt).toContain('Hinten am Tunnel');
    expect(game("document.querySelectorAll('#panel [data-dform]').length")).toBe(2);   // Steinbogen / nur die Öffnung
    game('closePanel()');
  });
});

describe('↶, Speichern, Laden', () => {
  it('Bauen rückgängig gibt alles zurück; Form und Richtung kommen durch Speichern und Laden', () => {
    hill(8, 8, 11, 12);
    const m = game('state.money');
    game("state.paintNew.bergportal = { form: 1 }; undoable(() => build('bergportal', 9, 12))");
    expect(game("[state.tiles.get('9,12').form, state.tiles.get('9,12').rot]")).toEqual([1, 0]);
    expect(game('undo()')).toBe(true);
    expect(game("[!!state.tiles.get('9,12'), state.money, !!hillAt(9, 12)]")).toEqual([false, m, true]);
    game("build('bergportal', 9, 12)");
    const s = game('JSON.parse(JSON.stringify(serialize()))'), t = s.tiles.find(([k]) => k === '9,12')[1];
    expect([t.b, t.rot || 0, t.form]).toEqual(['bergportal', 0, 1]);
    const back = game(`(() => { const st = parseSave(${JSON.stringify(s)}); const o = st.tiles.get('9,12'); return [o.b, o.rot || 0, o.form, !!st.hills.get('9,12')]; })()`);
    expect(back).toEqual(['bergportal', 0, 1, true]);
  });
});

describe('Alte Tunnelportale (Backstein, Naturstein) werden zur Rampe (Nutzer: „die Abfahrt nach unten natürlich nicht“)', () => {
  it('beim Laden: Form weg (= Rampe), mehrfach lauffähig; Naturstein gekauft → Taler und Ideen zurück, einmal', () => {
    const s = game('JSON.parse(JSON.stringify(serialize()))');
    s.tiles.push(['20,20', { b: 'tunneleinfahrt', lvl: 1, rot: 3, form: 1 }], ['20,22', { b: 'tunneleinfahrt', lvl: 1, rot: 3, form: 2 }], ['20,24', { b: 'tunneleinfahrt', lvl: 1, rot: 3 }]);
    s.design = [...(s.design || []), 'tunneleinfahrt:form:stein']; s.money = 5000; s.science = 100; s.incPeak = 0;
    s.paintNew = { ...(s.paintNew || {}), tunneleinfahrt: { form: 2 } };
    const a = game(`(() => { const st = parseSave(${JSON.stringify(s)}); return { f: ['20,20', '20,22', '20,24'].map(k => st.tiles.get(k).form), money: st.money, sci: st.science, d: st.design.has('tunneleinfahrt:form:stein'), pn: !!st.paintNew.tunneleinfahrt }; })()`);
    expect(a.f).toEqual([undefined, undefined, undefined]);
    expect([a.money, a.sci, a.d, a.pn]).toEqual([5000 + 1000, 100 + 400, false, false]);   // Grundpreis 200 × 5; Ideen 200 × 2
    // zweites Laden des umgestellten Stands: nichts mehr zu tun
    const again = game(`(() => { const st = parseSave(${JSON.stringify(s)}); const o = JSON.parse(JSON.stringify((() => { const keep = state; state = st; try { return serialize(); } finally { state = keep; } })())); const st2 = parseSave(o); return [st2.money, st2.science]; })()`);
    expect(again).toEqual([6000, 500]);
  });
  it('die Einfahrt zeichnet nur noch die Rampe; der tote Code ist weg', () => {
    expect(game("[typeof portalHill, typeof portalWall, typeof HILL]")).toEqual(['undefined', 'undefined', 'undefined']);
    expect(() => game("drawObject('tunneleinfahrt', 400, 300, 2, 0, 1e6, 1e6, 1, { b: 'tunneleinfahrt', lvl: 1, rot: 1, form: 2 }); thumbRaw('tunneleinfahrt')")).not.toThrow();
  });
});

describe('Fenster beim abgeschnittenen Wagen (Tunneleinfahrt und Bergportal)', () => {
  const windows = (cut) => game(`(() => {
    const out = [], fq = faceQuad, glass = C('#bfe3ff');
    faceQuad = (P, Q, t0, t1, h0, h1, fill) => { if (fill === glass) out.push([P, Q, t0, t1]); return fq(P, Q, t0, t1, h0, h1, fill); };
    try { drawTrainCarBody({ train: { kind: { h: 12 }, model: 'regio', col: 0 }, px: 5, py: 5, du: 1, dv: 0, len: 0.8, i: 1, n: 2${cut ? `, cut: ${JSON.stringify(cut)}` : ''} }, 1, 0); } finally { faceQuad = fq; }
    // Lage der Fenster auf dem Bildschirm: x der beiden Enden
    return out.map(([P, Q, t0, t1]) => [P[0] + (Q[0] - P[0]) * t0, P[0] + (Q[0] - P[0]) * t1].map(v => Math.round(v * 100) / 100).sort((a, b) => a - b));
  })()`);
  it('sitzen, wo sie am ganzen Wagen säßen, und enden am Schnitt; an der Schnittfläche keine Stirn mit Fenster', () => {
    const full = windows(null), half = windows([-0.4, 0.05]);
    const ends = w => w.filter(([a, b]) => b - a > 0);
    // jedes Fenster des halben Wagens liegt in einem Fenster des ganzen (gleiche Stelle, höchstens abgeschnitten)
    for (const [a, b] of ends(half)) expect(full.some(([c, d]) => a >= c - 0.01 && b <= d + 0.01), `${a}–${b}`).toBe(true);
    // die Stirn mit Fenster am Schnitt fehlt: höchstens so viele Fenster wie der ganze Wagen ohne seine vordere Stirn
    expect(half.length).toBeLessThan(full.length);
    expect(windows([-0.4, 0.4])).toEqual(full);                               // ungeschnitten wie vorher
  });
});

describe('Ohne Anhöhen unverändert', () => {
  it('kein Portal, keine Abfragen: Netz, Züge, Zeichnen wie vorher', () => {
    expect(game('[bpOn(), rampFresh().p]')).toEqual([false, 0]);
    game("for (let x = 4; x <= 6; x++) build('schiene', x, 10, true); state.tunnels.set('8,10', {}); state.tiles.set('7,10', { b: 'schiene', lvl: 1 }); recalc()");
    expect(game("[trackAt(7, 10), trackLink(6, 10, 7, 10), trackLink(7, 10, 8, 10)]")).toEqual([true, true, false]);
    expect(game("trainTunnelCut({ px: 5, py: 10, du: 1, dv: 0, len: 0.8 })")).toBe(null);
    game("window.__n = 0; { const o = bpCut; bpCut = (...a) => { __n++; return o(...a); }; window.__un = () => { bpCut = o; }; }");
    try { game("trainTunnelCut({ px: 7.4, py: 10, du: 1, dv: 0, len: 0.8 }); railArms(6, 10)"); } finally { game('__un()'); }
    expect(game('__n')).toBe(0);
  });
});
