const { loadGame, game } = require('./helpers/load-game');

// Schmale Treppe (Nutzer, 10.10.2026: „die Treppe soll auch so dünn wie die Wege sein können“, hills.js): Stufen so breit wie ein Weg samt
// Rand, daneben im Feld ein Streifen Anhöhe (eingelassen) bzw. ein Keil bis an die Feldgrenze (vor der Wand); schmale stehen für sich,
// Ecktreppen sind immer breit. Neu gebaut wie die Wegform, Wahl in der Leiste, im Fenster für die ganze Reihe. Und: die Treppe verbindet das
// Wegenetz (levelLink 'weg') – Arme der Wege, Lücke im Bordstein breiter Wege; Fahrzeuge nicht
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 24; y++) for (let x = 4; x <= 24; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegeltreppe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; stairNewWide = null; wegShape.wide = false; hillWalkers.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 3; { const p = iso(11, 11); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const H = 26;
const schmal = (x, y) => game(`stairSchmal(stairAt(${x}, ${y}))`);
const look = (x, y) => game(`(o => o.m + o.p + (o.nar ? ':n' : ''))(stairLook(${x}, ${y}, stairAt(${x}, ${y})))`);
// Zeichnen mitschreiben (wie treppe-buendig.test.js): poly mit Punkten und Farbe, paintHillWall mit seinen Werten
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly, pw = paintHillWall;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle }); }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  paintHillWall = (...a) => { calls.push({ op: 'wall', a: a.slice(1) }); return pw(...a); };
  try { ${body}; } finally { g = prev; poly = pp; paintHillWall = pw; }
  return calls;
})()`);

describe('Breite wählen', () => {
  it('neu gebaut wie die Wegform (breit → breit, sonst schmal); Wahl in der Leiste gewinnt, der Wegform-Knopf setzt sie zurück; Speichern/Laden', () => {
    hills(block(10, 10, 15, 13));
    expect(game("build('huegeltreppe', 11, 14)")).toBe(true);
    expect([schmal(11, 14), game("state.tiles.get('11,14').schmal")]).toEqual([true, true]);
    game('wegShape.wide = true');
    game("build('huegeltreppe', 13, 14)");
    expect([schmal(13, 14), game("'schmal' in state.tiles.get('13,14')")]).toEqual([false, false]);   // breit: kein Feld (wie alte Stände)
    game('stairNewWide = false');
    game("build('huegeltreppe', 15, 14)");
    expect(schmal(15, 14)).toBe(true);
    // Leiste: ein Knopf wie die Wegform, keine Wegform-Knöpfe
    game("setTool('huegeltreppe')");
    const bar = () => game("document.getElementById('style-bar').innerHTML");
    expect(bar()).toMatch(/data-stairw/);
    expect(bar()).not.toMatch(/data-wegopt/);
    expect(bar()).toMatch(/schmal wie ein Weg/);
    game("document.querySelector('#style-bar [data-stairw]').click()");
    expect([game('stairNewWide'), game('stairWideNew()')]).toEqual([true, true]);
    expect(bar()).toMatch(/aria-pressed="true"/);
    // Weg-Werkzeug: Wegform umstellen → neue Treppen wieder wie die Wegform
    game("setTool('weg'); document.querySelector('#style-bar [data-wegopt=\"wide\"]').click()");
    expect([game('wegShape.wide'), game('stairNewWide'), game('stairWideNew()')]).toEqual([false, null, false]);
    game("setTool('look')");
    // Speichern und Laden
    const out = game("JSON.parse(JSON.stringify(serialize())).tiles.filter(([, t]) => t.b === 'huegeltreppe').map(([k, t]) => [k, !!t.schmal]).sort()");
    expect(out).toEqual([['11,14', true], ['13,14', false], ['15,14', true]]);
    game('adoptState(parseSave(JSON.parse(JSON.stringify(serialize())))); recalc()');
    expect([schmal(11, 14), schmal(13, 14), schmal(15, 14)]).toEqual([true, false, true]);
  });

  it('Fenster: Breite für alle gleich gerichteten nebeneinander, ↶ nimmt es zurück; Belag einer schmalen nur für sie', () => {
    hills(block(10, 10, 14, 13));
    game("stairNewWide = true; for (const x of [11, 12, 13]) build('huegeltreppe', x, 14); stairNewWide = null");
    expect(game('stairRow(12, 14).length')).toBe(3);
    game('openInfo(12, 14)');
    expect(game("document.getElementById('panel').innerHTML")).toMatch(/alle 3 nebeneinander/);
    game("document.querySelector('#panel [data-stairw=\"0\"]').click()");
    expect([schmal(11, 14), schmal(12, 14), schmal(13, 14)]).toEqual([true, true, true]);
    expect([game('stairRow(12, 14).length'), game('stairRow(12, 14, true).length')]).toEqual([1, 3]);   // schmale stehen für sich
    expect(look(12, 14)).toBe('ww:n');                                                       // vor der Wand: Keile dazwischen
    game('openInfo(12, 14)');
    const st0 = game('stairAt(12, 14).style'), other = game(`[...document.querySelectorAll('#panel [data-stairbel]')].map(b => b.dataset.stairbel).find(s => s !== ${JSON.stringify(st0)})`);
    game(`document.querySelector('#panel [data-stairbel=${JSON.stringify(other)}]').click()`);
    expect([game('stairAt(11, 14).style'), game('stairAt(12, 14).style'), game('stairAt(13, 14).style')]).toEqual([st0, other, st0]);   // Belag: nur diese
    expect(game('undo()')).toBe(true);
    expect(game('undo()')).toBe(true);
    expect([schmal(11, 14), schmal(12, 14), schmal(13, 14)]).toEqual([false, false, false]);
    expect(look(12, 14)).toBe('jj');                                                         // wieder eine breite Treppe
    game('closePanel()');
  });
});

describe('Ecktreppen nur breit', () => {
  const corner = () => { for (let y = 6; y <= 8; y++) for (let x = 6; x <= 8; x++) game(`build('anhoehe', ${x}, ${y}, true)`); };
  it('an schmalen Treppen keine Ecke (Hinweis); eine schmale wird nie zur Ecke; an breiten wird auch eine neu „schmal“ gebaute eine breite Ecktreppe', () => {
    corner();
    for (const x of [6, 7, 8]) game(`build('huegeltreppe', ${x}, 9, true)`);
    for (const y of [6, 7, 8]) game(`build('huegeltreppe', 9, ${y}, true)`);
    expect(schmal(8, 9)).toBe(true);
    expect(game("placeError('huegeltreppe', 9, 9)")).toBe('Um die Ecke geht nur die breite Treppe');
    expect(game('cornerDirs(9, 9).length')).toBe(0);
    // breit machen (Fenster) – dann geht die Ecke, und sie ist breit
    expect(game('setStairWidth(8, 9, true) && setStairWidth(9, 8, true)')).toBe(true);
    expect(game("placeError('huegeltreppe', 9, 9)")).toBe(null);
    expect(game("build('huegeltreppe', 9, 9, true)")).toBe(true);
    expect([game('stairAt(9, 9).ecke'), schmal(9, 9), game("'schmal' in stairAt(9, 9)")]).toEqual([true, false, false]);
    // an der Reihe hängt jetzt eine Ecke: nicht schmal machen
    expect(game('setStairWidth(8, 9, false)')).toBe(false);
    expect(schmal(8, 9)).toBe(false);
    game('openInfo(9, 9)');
    expect(game("document.getElementById('panel').innerHTML")).not.toMatch(/data-stairw/);   // Ecktreppe: keine Breite
    game('openInfo(9, 7)');                                                                   // Arm mit der Drehung der Ecke: sie zählt nicht mit
    expect(game("document.getElementById('panel').innerHTML")).toMatch(/alle 3 nebeneinander/);
    game('closePanel()');
    // eine schmale Treppe richtet sich nie zur Ecke aus
    game("state.tiles.set('9,9', { b: 'huegeltreppe', lvl: 1, rot: 0, schmal: true }); groundVersion++");
    expect(game('stairFit(9, 9)')).toBe(null);
  });

  it('Ecke zuerst eingesetzt, dann schmale Nachbarn: der Hinweis sagt, dass es um die Ecke nur breit geht', () => {
    for (let y = 6; y <= 10; y++) for (let x = 12; x <= 16; x++) game(`build('anhoehe', ${x}, ${y}, true)`);
    game("build('huegeltreppe', 16, 10, true); build('huegeltreppe', 15, 10, true)");             // schmal (Wegform schmal)
    expect([schmal(16, 10), schmal(15, 10)]).toEqual([true, true]);
    expect(game("placeError('huegeltreppe', 16, 9)")).toBe('Um die Ecke geht nur die breite Treppe');   // vorher: „Hierher führt schon eine Treppe hinauf“
    // alle breit: dann wird die Ecke daraus
    expect(game('setStairWidth(16, 10, true)')).toBe(true);                                   // beide (eine Reihe)
    expect([schmal(16, 10), schmal(15, 10)]).toEqual([false, false]);
    expect(game("placeError('huegeltreppe', 16, 9)")).toBe('Um die Ecke geht nur die breite Treppe');   // die neue würde noch schmal
    game('stairNewWide = true');
    expect(game("placeError('huegeltreppe', 16, 9)")).toBe(null);
    expect(game("build('huegeltreppe', 16, 9, true)")).toBe(true);
    expect([game('stairAt(16, 10).ecke'), schmal(16, 10)]).toEqual([true, false]);
  });

  it('Verschieben (✋): in der Ecke zwischen zwei breiten wird eine schmale zur (breiten) Ecktreppe, eine Ecktreppe vor gerader Wand wieder gerade', () => {
    corner();
    game("stairNewWide = true; for (const x of [6, 7, 8]) build('huegeltreppe', x, 9, true); for (const y of [6, 7, 8]) build('huegeltreppe', 9, y, true); stairNewWide = null");
    hills(block(14, 6, 16, 8));
    game("build('huegeltreppe', 15, 9, true); setTool('verschieben')");
    expect(schmal(15, 9)).toBe(true);
    game('pickUp(15, 9, -1)');
    expect(game('moveError(9, 9, -1)')).toBe(null);
    game('dropAt(9, 9, -1)');
    expect([game('stairAt(9, 9).ecke'), schmal(9, 9), game("'schmal' in stairAt(9, 9)"), game('stairAt(9, 9).rot')]).toEqual([true, false, false, 3]);
    expect(game('stairFit(9, 9)')).toEqual({ ecke: true, rot: 3 });                          // passt so, wie sie liegt
    expect(game('[levelLink(9, 9, 8, 9, "fuss"), levelLink(9, 9, 9, 8, "fuss")]')).toEqual([true, true]);
    // die Ecktreppe vor eine gerade Wand: dort eine gerade Treppe, hinauf zur Anhöhe
    game('pickUp(9, 9, -1)');
    expect(game('moveError(15, 9, -1)')).toBe(null);
    game('hover = { x: 15, y: 9 }; render(performance.now()); hover = null');
    expect(game("hillSprites.get('sg').base")).toMatch(/^0\|/);                               // der Geist zeigt sie schon gerade
    game('dropAt(15, 9, -1)');
    expect([game('!!stairAt(15, 9).ecke'), game('stairAt(15, 9).rot')]).toEqual([false, 0]);
    expect(game('stairFit(15, 9)')).toEqual({ ecke: false, rot: 0 });
    expect(game('levelLink(15, 9, 15, 8, "fuss")')).toBe(true);
    game("setTool('look')");
  });
});

describe('Aussehen', () => {
  it('eingelassen: links und rechts eine Grasböschung (bis 11.10.2026 ein Streifen Anhöhe); vor der Wand Keile; zwei schmale nebeneinander: eingelassen Böschung an Böschung, vor der Wand Keile', () => {
    hills(block(10, 10, 16, 13));
    game("build('huegeltreppe', 11, 13)");                                                   // eingelassen
    expect(look(11, 13)).toBe('hh:n');
    game("build('huegeltreppe', 13, 13); build('huegeltreppe', 14, 13)");                    // zwei nebeneinander eingelassen
    expect([look(13, 13), look(14, 13)]).toEqual(['hr:n', 'rh:n']);
    hills(block(4, 4, 8, 6));
    game("build('huegeltreppe', 5, 7); build('huegeltreppe', 6, 7)");                        // vor der Wand
    expect([look(5, 7), look(6, 7)]).toEqual(['kw:n', 'wk:n']);
    // breit neben schmal: die Böschung der schmalen liegt auf Höhe der Stufenvorderkanten (wie ein Keil) – zur breiten hin mit Außenwand (op)
    game("stairNewWide = true; build('huegeltreppe', 16, 13); stairNewWide = null; build('huegeltreppe', 15, 13)");
    expect([look(15, 13), look(16, 13)]).toEqual(['rr:n', 'hk']);                           // 16,13 am Rand der Anhöhe: außen ein Keil
    expect(game("(o => [!!o.om, !!o.op])(stairLook(15, 13, stairAt(15, 13)))")).toEqual([false, true]);
    game("stairNewWide = true; build('huegeltreppe', 7, 7); stairNewWide = null");
    expect(look(7, 7)).toBe('wk');
    expect(game('levelLink(6, 7, 7, 7, "fuss") || levelLink(5, 7, 6, 7, "weg")')).toBe(false);   // getrennte Durchgänge
  });

  it('Zeichnen: Stufen so breit wie ein Weg samt Rand, Grasböschung auf Höhe der Stufenvorderkanten (wie der Keil), nichts darüber; alle Richtungen, alle Seiten ohne Fehler', () => {
    expect(game('STAIR_NW')).toBe(game('EDGE_W'));
    const fill = game("C(lookFar(pathLook('sand'), 1).fill)"), top = game("C('#123456')");
    for (let rot = 0; rot < 4; rot++) for (const [m, p] of [['h', 'h'], ['k', 'k'], ['r', 'w'], ['w', 'r'], ['h', 'k']]) {
      const o = { rot, style: 'sand', kind: 'fels', m, p, top: '#123456', nar: 1 };
      const calls = record(`paintStair((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), s = ([u, v]) => u * -Dv + v * Du;
      const treads = calls.filter(c => c.op === 'poly' && c.fill === fill);
      expect(treads.length).toBe(8);
      for (const t of treads) for (const q of t.pts) expect(Math.abs(s(q))).toBeCloseTo(0.36, 9);   // genau so breit wie der Weg samt Rand
      const tops = calls.filter(c => c.op === 'poly' && c.fill === top);
      expect(tops.length).toBe(2);
      for (const [sg, c] of [[-1, m], [1, p]]) {                                               // Seitenteil reicht bis an die Feldgrenze
        const t = tops.find(tp => tp.pts.every(q => s(q) * sg > 0.3));
        expect(t).toBeTruthy();
        expect(Math.max(...t.pts.map(q => s(q) * sg))).toBeGreaterThanOrEqual(0.5);
        expect(Math.min(...t.pts.map(q => q[2]))).toBe(H / 8);                                 // Böschung (Nutzer: „hoch“) wie Keil: vorn eine Stufe hoch
      }
      for (const c of calls) if (c.op === 'poly') for (const q of c.pts) expect(q[2]).toBeLessThanOrEqual(H + 0.4 + 1e-9);
      expect(calls.filter(c => c.op === 'wall' && c.a[7] === H).length).toBe(0);              // keine Wände ganz hoch mehr (die Streifen sind weg)
    }
  });

  it('Anhöhe neben der schmalen Treppe: wie neben einer breiten – ihre Wand ist die Wange über der Böschung', () => {
    hills(block(10, 10, 14, 13));
    game("build('huegeltreppe', 12, 13)");                                                   // hinauf nach −y, Anhöhe bei 11,13 und 13,13
    expect([game('hillStairEnds(11, 13)'), game('hillStairEnds(13, 13)')]).toEqual(['', 'a']);   // wie breit
    expect(game('hillWallsAt(11, 13, 1, hillStairEnds(11, 13))')).toEqual([1, 1]);           // Wand nach +x (zur Treppe hin) und vorn
    // quer (hinauf nach ±x): ebenso wie breit
    hills(block(17, 10, 20, 14));
    game("build('huegeltreppe', 17, 12)");                                                   // hinauf nach +x, Anhöhe bei 17,11 und 17,13
    expect(game('stairAt(17, 12).rot')).toBe(1);
    const nar = [game('hillStairEnds(17, 11)'), game('hillStairEnds(17, 13)')];
    game("delete stairAt(17, 12).schmal; groundVersion++");
    expect([game('hillStairEnds(17, 11)'), game('hillStairEnds(17, 13)')]).toEqual(nar);
  });

  it('Bilder: zeichnen in allen Richtungen ohne Fehler (nah, weit, nachts, Vorschau in die Anhöhe), Schatten der Streifen', () => {
    hills(block(8, 8, 16, 16));
    game("build('huegeltreppe', 12, 16); build('huegeltreppe', 13, 16); build('huegeltreppe', 16, 12); build('huegeltreppe', 12, 8); build('huegeltreppe', 8, 12)");
    expect([12, 13].map(x => game(`stairAt(${x}, 16).rot`)).concat([game('stairAt(16, 12).rot'), game('stairAt(12, 8).rot'), game('stairAt(8, 12).rot')])).toEqual([0, 0, 3, 2, 1]);
    hills(block(4, 18, 8, 19));
    game("build('huegeltreppe', 6, 20); build('weg', 6, 21, true); build('weg', 12, 17, true); build('weg', 12, 15, true); recalc()");
    // Figuren auf den Stufen (der Streifen vorn kommt über sie): je Richtung eine, nah, weit, nachts
    const at = [[12, 16.2], [13, 15.9], [16.1, 12], [12, 8.1], [8.2, 12]];
    game(`walkers.length = 0; for (const [x, y] of ${JSON.stringify(at)}) walkers.push({ fx: Math.round(x), fy: Math.round(y), tx: Math.round(x), ty: Math.round(y), px: x, py: y, t: 0, wait: 99, speed: 1, kind: 0, fur: '#fff', shirt: '#f00', goal: { kind: 'bummel' } })`);
    for (const z of [0.6, 3, 8]) for (const nt of [0, 0.45]) {
      expect(() => game(`(() => { const n0 = nightAt, sm = syncMovers, st = stepMovers; nightAt = () => ${nt}; syncMovers = () => {}; stepMovers = () => {}; try { cam.z = ${z}; const p = iso(12, 14); cam.x = p.x; cam.y = p.y; render(1e6); } finally { nightAt = n0; syncMovers = sm; stepMovers = st; } })()`)).not.toThrow();
    }
    const clip = record('drawHillStairOver(12, 16, 3, -0.2)');                              // vorn der Streifen Anhöhe: ganz hoch
    expect(clip.some(c => c.op === 'clip')).toBe(true);
    game("hover = { x: 14, y: 16 }; setTool('huegeltreppe'); render(performance.now()); setTool('look'); hover = null");   // Vorschau in die Anhöhe
    const shadow = record('drawHillShadows(() => true)');
    expect(shadow.some(c => c.op === 'fill')).toBe(true);
    expect(game("[...hillSprites.keys()].filter(k => k[0] === 's').length")).toBeGreaterThan(3);
  });
});

describe('Spiel', () => {
  it('Höhe: auf den Stufen wie bisher, auf der Böschung wie auf dem Keil (eine Stufe über der Hinterkante); Bewohner gehen in der Mitte hinauf', () => {
    hills(block(10, 10, 14, 13));
    game("build('huegeltreppe', 12, 13)");
    const n = game('STAIR_N');
    expect(game('stairHeight(12, 13, 12, 13.45)')).toBe(H / n);                              // vorn, Mitte
    expect(game('stairHeight(12, 13, 11.6, 13.45)')).toBeCloseTo(H * (0.05 + 1 / n), 9);      // Böschung links, vorn (wie der Keil: eine Stufe höher)
    expect(game('stairHeight(12, 13, 12.4, 12.6)')).toBe(H);                                  // Böschung rechts, oben
    expect(game('stairHeight(12, 13, 12.3, 13.45)')).toBe(H / n);                             // noch auf den Stufen
    // Weg über die Treppe: Bewohner zu Fuß, Fahrzeuge nicht
    expect([game('levelLink(12, 14, 12, 13, "fuss")'), game('levelLink(12, 14, 12, 13, "weg")'), game('levelLink(12, 14, 12, 13, "fahr")')]).toEqual([true, true, false]);
    expect([game('levelLink(12, 13, 12, 12, "weg")'), game('levelLink(11, 13, 12, 13, "weg")')]).toEqual([true, false]);
    const path = game('walkPath(12, 17, [[12, 11]])');
    expect(path && path.some(([x, y]) => x === 12 && y === 13)).toBe(true);
  });

  it('Weg-Anschluss: die Treppe ist ein Arm der Wege davor und oben; breiter Weg davor mit Lücke im Bordstein so breit wie die Stufen', () => {
    hills(block(10, 10, 14, 13));
    game("build('huegeltreppe', 12, 13); build('weg', 12, 14, true); build('weg', 12, 12, true); recalc()");
    expect(game('pathArms(12, 14).map(([a, b]) => a + "," + b)')).toEqual(['0,-1']);
    expect(game('pathArms(12, 12).map(([a, b]) => a + "," + b)')).toEqual(['0,1']);
    expect(game('stairLane(12, 14, 0, -1)')).toEqual([-0.36, 0.36]);
    expect(game('stairLane(12, 12, 0, 1)')).toEqual([-0.36, 0.36]);
    game("delete stairAt(12, 13).schmal; groundVersion++");
    expect(game('stairLane(12, 14, 0, -1)')).toEqual([-0.5, 0.5]);                            // breit eingelassen: Wange an beiden Seiten
    // Weg davor und oben im selben Viertel, „alle verbundenen Wege“ über die Treppe
    expect(game("T.net.vOf('12,14') === T.net.vOf('12,12')")).toBe(true);
    expect(game('wegNetwork(12, 14).length')).toBe(2);
  });
});
