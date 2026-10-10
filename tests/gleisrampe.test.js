const { loadGame, game } = require('./helpers/load-game');

// Gleis-Rampe (hills.js, Nutzer 10.10.2026: „die Rampe ist nur für Züge da“): vier Formen A–D (RAMP_FORMS), Regeln je Form, Leiste und Fenster,
// Höhe (rampHeight stetig), wer wohin kommt (levelLink 'gleis' – Wege, Bewohner, Fahrzeuge nie über die Rampe), Gleise oben, alte Weg-Rampen,
// Zeichnen (bündig wie im Entwurf tools/gleisrampe-entwurf.js) in allen Drehungen
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e6; state.techs.add('terraform'); state.techs.add('bahn'); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; recalc(); resetUndo()");
  game('cam = state.cam; cam.z = 2; { const p = iso(15, 15); cam.x = p.x; cam.y = p.y; }');
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const rails = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('schiene', x, y, true); recalc()`);
const ramp = (x, y) => game(`rampAt(${x}, ${y}) && (r => [r.k, r.rot, r.len, r.i, r.form])(rampAt(${x}, ${y}))`);
const H = 26;
// Anker (kleinstes x/y) einer Rampe mit Fuß (fx, fy), Drehung rot und Länge len
const anchor = (fx, fy, rot, len) => { const [Du, Dv] = [[0, -1], [1, 0], [0, 1], [-1, 0]][rot]; return [Math.min(fx, fx + (len - 1) * Du), Math.min(fy, fy + (len - 1) * Dv)]; };

describe('Gleis-Rampe: Daten, Menü, Leiste', () => {
  it('beim Verkehr hinter der Schiene, Anhöhen nur noch Anhöhe und Treppe; vier Formen mit Länge 2/3/4/4, Preis je Form', () => {
    expect(game("MENU.find(m => m.id === 'stadt').groups.find(g => g.id === 'verkehr').items.slice(0, 2)")).toEqual(['schiene', 'huegelrampe']);
    expect(game("MENU.find(m => m.id === 'gestalten').groups.find(g => g.id === 'hoehen').items")).toEqual(['anhoehe', 'huegeltreppe']);
    expect(game("[ITEMS.huegelrampe.name, ITEMS.huegelrampe.tech, ITEMS.huegelrampe.beauty, !!FX.huegelrampe, !!ITEM_TIPS.huegelrampe]")).toEqual(['Gleis-Rampe', 'bahn', 0, true, true]);
    expect(game("Object.entries(RAMP_FORMS).map(([f, F]) => [f, F.len, F.cut])")).toEqual([['a', 2, 2], ['b', 3, 0], ['c', 4, 2], ['d', 4, 0]]);
    const costs = game("Object.keys(RAMP_FORMS).map(f => { rampNewForm = f; return [ITEMS.huegelrampe.cost, ITEMS.huegelrampe.mat.metall, sizeOf('huegelrampe', 0)[1]]; })");
    expect(costs.map(c => c[2])).toEqual([2, 3, 4, 4]);
    for (let i = 1; i < 4; i++) expect(costs[i][0]).toBeGreaterThan(costs[i - 1][0]);   // je mehr Bauwerk, desto teurer
    for (const c of costs) expect(c[1]).toBeGreaterThan(0);                                    // Metall fürs Gleis
    expect(game("[rampFormOk('a'), rampFormOk('d'), rampFormOk('e'), rampFormOk('constructor'), rampFormOk(0)]")).toEqual([true, true, false, false, false]);
  });

  it('Leiste: vier Formen als Knöpfe, die gewählte gilt für neu Gebautes (Form und Preis)', () => {
    game("setTool('huegelrampe')");
    expect(game("[...document.querySelectorAll('#style-bar [data-rform]')].map(b => [b.dataset.rform, b.classList.contains('on')])")).toEqual([['a', true], ['b', false], ['c', false], ['d', false]]);
    game("document.querySelector('#style-bar [data-rform=\"d\"]').click()");
    expect(game('rampNewForm')).toBe('d');
    expect(game("document.querySelector('#style-bar [data-rform=\"d\"]').classList.contains('on')")).toBe(true);
    expect(game('rampNew()')).toEqual({ form: 'd', price: game('RAMP_FORMS.d.cost') });
    expect(game("[ITEMS.huegelrampe.cost, rampLen()]")).toEqual([game('RAMP_FORMS.d.cost'), 4]);
    expect(game("document.getElementById('style-bar').innerHTML")).not.toMatch(/data-wpop|data-rlen/);   // kein Belag, keine Länge mehr
    game("setTool('look')");
  });
});

describe('Gleis-Rampe: Bauen je Form', () => {
  // Anhöhe 10–16 × 6–12 (Rand vorn bei y = 12): A/C eingelassen (oben 2 im Rand), B/D davor; hinauf nach −y (rot 0)
  it('A: 2 Felder in den Rand eingelassen (Felder abgesenkt, Erstattung verrechnet), Wangen daneben; nicht davor', () => {
    hills(block(10, 6, 16, 12));
    const m0 = game('state.money'), cost = game('RAMP_FORMS.a.cost'), back = game('ITEMS.anhoehe.cost');
    expect(game("placeError('huegelrampe', 12, 12)")).toMatch(/Einschnitt A/);                 // am Rand: der Fuß läge davor
    expect(game("placeRot('huegelrampe', 12, 11)")).toBe(0);
    expect(game("placeError('huegelrampe', 12, 11)")).toBe(null);
    expect(game("rampIntoBack(12, 11, 0)")).toBe(2 * back);
    game("resetUndo(); undoable(() => build('huegelrampe', 12, 11))");
    expect([ramp(12, 12), ramp(12, 11)]).toEqual([['12,11', 0, 2, 0, 'a'], ['12,11', 0, 2, 1, 'a']]);
    expect([game('hillAt(12, 11)'), game('hillAt(12, 12)'), !!game('hillAt(11, 12)'), !!game('hillAt(12, 10)')]).toEqual([null, null, true, true]);
    expect(game('state.money')).toBe(m0 - cost + 2 * back);
    expect(game("state.tiles.get('12,11')")).toMatchObject({ form: 'a', price: cost, rot: 0 });
    expect(game('hillRamps().map(r => [r.k, r.form, r.foot, r.top, r.dx, r.dy])')).toEqual([['12,11', 'a', [12, 12], [12, 11], 0, -1]]);
    expect(game('undo()')).toBe(true);                                                       // ein Schritt: Rampe und Anhöhe zurück
    expect([ramp(12, 12), !!game('hillAt(12, 11)'), !!game('hillAt(12, 12)'), game('state.money')]).toEqual([null, true, true, m0]);
    // vor der Wand (unten) geht A nicht
    expect(game("placeError('huegelrampe', 12, 13)")).toMatch(/Einschnitt A/);
  });

  it('B: 3 Felder Damm vor der Wand; nicht in die Anhöhe, nicht in einen Einschnitt', () => {
    hills(block(10, 6, 16, 12));
    game("rampNewForm = 'b'");
    expect(game("placeRot('huegelrampe', 12, 13)")).toBe(0);
    expect(game("placeError('huegelrampe', 12, 13)")).toBe(null);
    expect(game("rampIntoBack(12, 13, 0)")).toBe(0);
    expect(game("build('huegelrampe', 12, 13)")).toBe(true);
    expect([ramp(12, 15), ramp(12, 14), ramp(12, 13)]).toEqual([['12,13', 0, 3, 0, 'b'], ['12,13', 0, 3, 1, 'b'], ['12,13', 0, 3, 2, 'b']]);
    expect(game("[COVER.get('12,13'), COVER.get('12,14'), COVER.get('12,15')]")).toEqual(['12,13', '12,13', '12,13']);
    expect(game("placeError('huegelrampe', 14, 11)")).toMatch(/Damm B/);                    // auf der Anhöhe: steht davor
  });

  it('C: oben 2 eingelassen, unten 2 davor; D: 4 vor der Wand', () => {
    hills(block(10, 6, 16, 12));
    game("rampNewForm = 'c'");
    expect(game("placeError('huegelrampe', 12, 11)")).toBe(null);                            // Anker = oberes Feld 12,11; Fuß 12,14
    game("build('huegelrampe', 12, 11)");
    expect([11, 12, 13, 14].map(y => ramp(12, y)[3])).toEqual([3, 2, 1, 0]);
    expect([game('hillAt(12, 11)'), game('hillAt(12, 12)')]).toEqual([null, null]);
    expect(game("placeError('huegelrampe', 14, 12)")).toMatch(/halb in der Anhöhe/);        // nur 1 Feld im Rand
    game("rampNewForm = 'd'");
    expect(game("placeError('huegelrampe', 15, 13)")).toBe(null);
    game("build('huegelrampe', 15, 13)");
    expect([ramp(15, 16), ramp(15, 13)]).toEqual([['15,13', 0, 4, 0, 'd'], ['15,13', 0, 4, 3, 'd']]);
    expect(game("placeError('huegelrampe', 10, 10)")).toMatch(/Viadukt D/);
  });

  it('alle Formen in allen vier Richtungen: dreht sich von selbst hinauf, Fuß und oberes Feld stimmen', () => {
    // Anhöhe in der Mitte, groß genug: A/C in jeden Rand, B/D vor jede Wand
    for (const form of ['a', 'b', 'c', 'd']) {
      game("state.hills.clear(); for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(12, 12, 20, 20));
      game(`rampNewForm = '${form}'`);
      const F = game(`RAMP_FORMS.${form}`), len = F.len;
      // Fuß je Richtung: vorn (+y, rot 0), rechts (+x, rot 3), hinten (−y, rot 2), links (−x, rot 1); Mitte der Seite x/y = 16
      const feet = [[16, 21 + len - 1 - F.cut, 0], [21 + len - 1 - F.cut, 16, 3], [16, 11 - len + 1 + F.cut, 2], [11 - len + 1 + F.cut, 16, 1]];
      for (const [fx, fy, rot] of feet) {
        const [ax, ay] = anchor(fx, fy, rot, len);
        game(`buildRot = ${(rot + 2) % 4}`);
        expect([form, rot, game(`placeRot('huegelrampe', ${ax}, ${ay})`)]).toEqual([form, rot, rot]);
        expect([form, rot, game(`placeError('huegelrampe', ${ax}, ${ay})`)]).toEqual([form, rot, null]);
        expect(game(`build('huegelrampe', ${ax}, ${ay})`)).toBe(true);
        expect(ramp(fx, fy)).toEqual([`${ax},${ay}`, rot, len, 0, form]);
        const [Du, Dv] = game(`STAIR_UP[${rot}]`), tx = fx + (len - 1) * Du, ty = fy + (len - 1) * Dv;
        expect(ramp(tx, ty)[3]).toBe(len - 1);
        expect(game(`hillLevel(${tx + Du}, ${ty + Dv})`)).toBe(1);                            // dahinter Anhöhe
        expect(game(`hillLevel(${fx - Du}, ${fy - Dv})`)).toBe(0);                            // davor unten
        for (let i = 0; i < len; i++) expect(game(`hillLevel(${fx + i * Du}, ${fy + i * Dv})`)).toBe(0);
      }
      expect(game('hillRamps().length')).toBe(4);
    }
  });
});

describe('Gleis-Rampe: Form wechseln (Fenster), Spielstand', () => {
  it('Fenster: Form und Status; A ↔ C und B ↔ D (oberes Feld bleibt, Preis verrechnet), sonst Hinweis; ↶ nimmt es zurück', () => {
    hills(block(10, 6, 16, 12));
    rails([[12, 13], [12, 14], [12, 15], [12, 9], [12, 10]]);
    game("state.tiles.delete('12,13'); state.tiles.delete('12,14'); state.tiles.delete('12,15'); recalc()");
    game("build('huegelrampe', 12, 11)");                                                     // A: 12,11 oben, 12,12 Fuß
    rails([[12, 13]]);
    game('openInfo(12, 11)');
    let panel = game("document.getElementById('panel').textContent");
    expect(panel).toMatch(/Führt hinauf/);
    expect(panel).toMatch(/Unten schließt die Schiene an/);
    expect(panel).toMatch(/Oben geht die Schiene weiter/);
    expect(game("!!document.getElementById('p-del') && !document.getElementById('p-rot')")).toBe(true);
    expect(game("[...document.querySelectorAll('#panel [data-rform]')].map(b => [b.dataset.rform, b.classList.contains('on'), b.classList.contains('locked')])"))
      .toEqual([['a', true, false], ['b', false, true], ['c', false, true], ['d', false, true]]);   // C: unten liegt das Gleis im Weg
    expect(game("rampFormPlan(12, 11, 'c')")).toMatch(/nicht genug Platz|Gleis/);
    game("state.tiles.delete('12,13'); recalc(); openInfo(12, 11)");
    const p = game("rampFormPlan(12, 11, 'c')");
    expect([p.ax, p.ay, p.money]).toEqual([12, 11, game('RAMP_FORMS.c.cost - RAMP_FORMS.a.cost')]);
    const m0 = game('state.money'), s0 = game('state.res.stein');
    game("resetUndo(); document.querySelector('#panel [data-rform=\"c\"]').click()");
    expect([11, 12, 13, 14].map(y => ramp(12, y))).toEqual([3, 2, 1, 0].map(i => ['12,11', 0, 4, i, 'c']));
    expect(game("state.tiles.get('12,11')")).toMatchObject({ form: 'c', price: game('RAMP_FORMS.c.cost') });
    expect(game('state.money')).toBe(m0 - p.money);
    expect(game('state.res.stein')).toBe(s0 - game('RAMP_FORMS.c.mat.stein') + game('RAMP_FORMS.a.mat.stein'));
    expect(game("document.querySelector('#panel [data-rform=\"c\"]').classList.contains('on')")).toBe(true);
    // B passt nicht (liegt davor): Hinweis, nichts geändert
    game("document.querySelector('#panel [data-rform=\"b\"]').click()");
    expect(game("rampFormPlan(12, 11, 'b')")).toMatch(/steht vor der Wand/);
    expect(ramp(12, 14)).toEqual(['12,11', 0, 4, 0, 'c']);
    expect(game('undo()')).toBe(true);                                                         // zurück auf A, Geld und Stein wieder da
    expect([ramp(12, 12), ramp(12, 13), game('state.money'), game('state.res.stein')]).toEqual([['12,11', 0, 2, 0, 'a'], null, m0, s0]);
    game('closePanel()');
    // B ↔ D vor der Wand, hinauf nach −x: das obere Feld bleibt, der Anker rückt
    game("rampNewForm = 'b'; build('huegelrampe', 17, 9)");                                   // B: 17,9 oben … 19,9 Fuß (rot 3)
    expect(ramp(19, 9)).toEqual(['17,9', 3, 3, 0, 'b']);
    expect(game("setRampForm(18, 9, 'd')")).toEqual([17, 9]);
    expect([ramp(20, 9), ramp(17, 9)]).toEqual([['17,9', 3, 4, 0, 'd'], ['17,9', 3, 4, 3, 'd']]);
    expect(game("rampFormPlan(17, 9, 'a')")).toMatch(/liegt in der Anhöhe/);
    // hinauf nach +x (Anker = Fuß): beim Kürzen rückt der Anker zum oberen Feld hin
    game("rampNewForm = 'd'; build('huegelrampe', 6, 9)");                                     // D: 6,9 Fuß … 9,9 oben (rot 1)
    expect(ramp(9, 9)).toEqual(['6,9', 1, 4, 3, 'd']);
    expect(game("setRampForm(6, 9, 'b')")).toEqual([7, 9]);
    expect([ramp(6, 9), ramp(7, 9), ramp(9, 9)]).toEqual([null, ['7,9', 1, 3, 0, 'b'], ['7,9', 1, 3, 2, 'b']]);
    expect(game("COVER.has('6,9')")).toBe(false);
  });

  it('Spielstand: Form, Preis, Drehung bleiben; alte Weg-Rampen (ohne Form) verschwinden mit Erstattung', () => {
    hills(block(10, 6, 16, 12));
    game("build('huegelrampe', 12, 11); rampNewForm = 'd'; build('huegelrampe', 15, 13)");
    expect(game("tileOut(state.tiles.get('12,11'))")).toEqual({ b: 'huegelrampe', lvl: 1, form: 'a', price: game('RAMP_FORMS.a.cost') });
    expect(game("tileOut({ b: 'huegelrampe', lvl: 1, rot: 1, len: 2, style: 'sand', form: 'b' }).len")).toBe(undefined);
    const d = game('JSON.parse(JSON.stringify(serialize()))');
    d.tiles.push(['20,20', { b: 'huegelrampe', lvl: 1, rot: 0, len: 2, style: 'sand' }], ['22,20', { b: 'huegelrampe', lvl: 1 }], ['24,20', { b: 'huegelrampe', lvl: 1, form: 'constructor' }]);
    const m = d.money, st = d.res.stein;
    game(`window.__d = ${JSON.stringify(d)}`);
    game('adoptState(parseSave(window.__d))');
    expect(game("[...state.tiles].filter(([, t]) => t.b === 'huegelrampe').map(([k, t]) => [k, t.form, t.rot || 0])")).toEqual([['12,11', 'a', 0], ['15,13', 'd', 0]]);
    expect([game('state.money'), game('state.res.stein')]).toEqual([m + 3 * 200, st + 3 * 8]);
    expect(ramp(15, 16)).toEqual(['15,13', 0, 4, 0, 'd']);
  });
});

describe('Gleis-Rampe: Schnittstelle', () => {
  it('railRampTrack, hillRamps, rampAt mit Form; Gleise oben und unten schließen über levelLink an', () => {
    hills(block(10, 6, 16, 12));
    game("rampNewForm = 'c'; build('huegelrampe', 12, 11)");                                  // C: 12,14 Fuß … 12,11 oben
    expect(game('railRampTrack(12, 13)')).toEqual({ k: '12,11', rot: 0, form: 'c', i: 1, len: 4, dx: 0, dy: -1, arms: [[0, -1], [0, 1]], foot: [12, 14], top: [12, 11], h0: H / 4, h1: H / 2 });
    expect(game('railRampTrack(13, 13)')).toBe(null);
    expect(game('hillRamps()')).toEqual([{ k: '12,11', ax: 12, ay: 11, len: 4, rot: 0, dx: 0, dy: -1, form: 'c', foot: [12, 14], top: [12, 11] }]);
    expect(game("[levelLink(12, 15, 12, 14, 'gleis'), levelLink(12, 11, 12, 10, 'gleis'), levelLink(12, 14, 13, 14, 'gleis')]")).toEqual([true, true, false]);
    expect(game('[rampHitHeight(12, 11, 12.4, 11), rampHitHeight(12, 11, 12, 11)]')).toEqual([H, H * 3.5 / 4]);   // Streifen ganz hoch, Gleis in der Mitte
  });

  it('rampSnap: das angetippte Feld an der Wand (A/C: erstes in der Anhöhe, B/D: oberstes) → Anker und Drehung, in alle Richtungen', () => {
    hills(block(10, 6, 16, 12));
    expect(game("rampSnap(13, 12, 'a')")).toEqual({ ax: 13, ay: 11, rot: 0 });             // vorn: Anker = oberes Feld
    expect(game("rampSnap(13, 6, 'a')")).toEqual({ ax: 13, ay: 6, rot: 2 });                // hinten: Anker = Fuß (am Rand)
    expect(game("rampSnap(13, 13, 'b')")).toEqual({ ax: 13, ay: 13, rot: 0 });
    expect(game("rampSnap(13, 5, 'b')")).toEqual({ ax: 13, ay: 3, rot: 2 });                // hinter der Wand: Fuß 2 Felder weiter hinten
    expect(game("rampSnap(9, 9, 'd')")).toEqual({ ax: 6, ay: 9, rot: 1 });
    expect(game("rampSnap(13, 12, 'c')")).toEqual({ ax: 13, ay: 11, rot: 0 });
    expect(game("rampSnap(13, 9, 'b')")).toBe(null);                                         // mitten auf der Anhöhe
  });

  it('Bauen per Tippen (rampAnchor in tap und setHover): passt das Feld als Anker, wie bisher; sonst zählt es als Feld an der Wand – alle Formen, alle Seiten', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      game("state.hills.clear(); for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(12, 12, 20, 20));
      game(`rampNewForm = '${form}'; setTool('huegelrampe')`);
      const F = game(`RAMP_FORMS.${form}`), len = F.len, w = F.cut ? 0 : 1;                  // Feld an der Wand: A/C das erste in der Anhöhe, B/D das oberste davor
      // je Seite das angetippte Feld an der Wand und der Fuß der Rampe
      for (const [tx, ty, rot] of [[16, 20 + w, 0], [20 + w, 16, 3], [16, 12 - w, 2], [12 - w, 16, 1]]) {
        const [Du, Dv] = game(`STAIR_UP[${rot}]`), iw = len - Math.max(1, F.cut), fx = tx - iw * Du, fy = ty - iw * Dv, [ax, ay] = anchor(fx, fy, rot, len);
        expect([form, rot, game(`rampAnchor(${tx}, ${ty})`)]).toEqual([form, rot, [ax, ay]]);
        // oben auf der Anhöhe angehoben getippt; unten hinter einer Wand verdeckt die Anhöhe davor die untere Hälfte des Felds: oben im Feld tippen
        const p = game(`(p => [p.x, p.y - (hillLift(${tx}, ${ty}) ? HILL_H : 12) * cam.z])(toScreen(${tx}, ${ty}))`);
        game(`setHover(${p[0]}, ${p[1]})`);
        expect([form, rot, game('[hover.x, hover.y]')]).toEqual([form, rot, [ax, ay]]);       // Vorschau am selben Anker
        game(`tap(${p[0]}, ${p[1]}, false)`);
        expect([form, rot, ramp(fx, fy)]).toEqual([form, rot, [`${ax},${ay}`, rot, len, 0, form]]);
      }
      // der Anker selbst angetippt (wie bisher) bleibt der Anker
      game("state.hills.clear(); for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(12, 12, 20, 20));
      const o = len - 1 - F.cut, [bx, by] = anchor(16, 11 - o, 2, len);
      expect([form, game(`rampAnchor(${bx}, ${by})`)]).toEqual([form, [bx, by]]);
      game("setTool('look')");
    }
    game('state.hills.clear(); recalc()');
    expect(game('rampAnchor(16, 11)')).toEqual([16, 11]);                                      // ohne Anhöhen: wie angetippt
  });

  it('✋ getragen: Ablegen an der Wand hinten per Tippen rückt den Anker ebenso (rampAnchor), die Form bleibt', () => {
    hills(block(12, 12, 20, 20));
    game("rampNewForm = 'b'; build('huegelrampe', 16, 21); rampNewForm = 'a'; setTool('verschieben'); pickUp(16, 22)");   // B vorn: 16,21 oben … 16,23 Fuß
    expect(game('moving && moving.t.form')).toBe('b');
    expect(game('rampAnchor(16, 11)')).toEqual([16, 9]);                                      // hinten: Fuß 16,9 … 16,11 oben (hinauf nach +y)
    const p = game('(p => [p.x, p.y - 12 * cam.z])(toScreen(16, 11))');
    game(`setHover(${p[0]}, ${p[1]})`);
    expect(game('[hover.x, hover.y]')).toEqual([16, 9]);
    game(`tap(${p[0]}, ${p[1]}, false)`);
    expect([ramp(16, 9), ramp(16, 11), ramp(16, 22), game('moving')]).toEqual([['16,9', 2, 3, 0, 'b'], ['16,9', 2, 3, 2, 'b'], null, null]);
    game("setTool('look')");
  });
});

// Zeichnen mitschreiben (wie tests/treppe-buendig.test.js): g zeichnet nichts, merkt sich jeden Aufruf; poly und paintHillWall mit ihren Werten
const record = body => game(`(() => {
  const calls = [], st = {}, prev = g, pp = poly, pw = paintHillWall;
  g = new Proxy(st, { get: (t, p) => p in t ? t[p] : (...a) => { calls.push({ op: p, a, fill: t.fillStyle, stroke: t.strokeStyle }); return p === 'createLinearGradient' ? { addColorStop() {} } : undefined; }, set: (t, p, v) => { t[p] = v; return true; } });
  poly = (pts, fill) => { calls.push({ op: 'poly', pts, fill }); return pp(pts, fill); };
  paintHillWall = (...a) => { calls.push({ op: 'wall', a: a.slice(1) }); return pw(...a); };
  try { ${body}; } finally { g = prev; poly = pp; paintHillWall = pw; }
  return calls;
})()`);
const look = o => ({ cut: false, first: false, narrow: false, viadukt: false, kind: 'fels', wall: 'fels', m: 'k', p: 'k', top: '#123456', rl: 'schotter', ...o });

describe('Gleis-Rampe bündig (Entwurf)', () => {
  const hOf = (len, i) => d => Math.min(H, Math.max(0, H * (i + d + 0.5) / len));
  it('Damm und Einschnitt A: Oberseite und Gleis auf der Schräge, am Fuß 0,0075 flach davor, hinten 0,0075 weiter, nie über der Anhöhe; Dammwand vorn h0 → h1', () => {
    for (let rot = 0; rot < 4; rot++) for (const [form, len, i, narrow] of [['a', 2, 0, false], ['a', 2, 1, false], ['b', 3, 0, true], ['b', 3, 2, true], ['c', 4, 1, true]]) {
      const o = look({ rot, len, i, form, narrow, wall: form === 'b' ? 'mauer' : 'fels' });
      const calls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), d = p => p[0] * Du + p[1] * Dv, s = p => -p[0] * Dv + p[1] * Du, h = hOf(len, i);
      const top = calls.find(c => c.op === 'poly' && c.fill === game("C('#123456')"));
      for (const p of top.pts) expect(p[2]).toBeCloseTo(h(d(p)), 9);
      const ds = top.pts.map(d);
      expect(Math.max(...ds)).toBeCloseTo(0.5075, 9);
      expect(Math.min(...ds)).toBeCloseTo(i === 0 ? -0.5075 : -0.5, 9);                       // nur der Fuß liegt flach auf dem Boden davor
      expect(Math.max(...top.pts.map(p => Math.abs(s(p))))).toBeCloseTo(narrow ? game('GR_DW') : 0.5, 9);
      for (const c of calls) if (c.op === 'poly') for (const p of c.pts) expect(p[2]).toBeLessThanOrEqual(H + 0.4 + 1e-9);
      const walls = calls.filter(c => c.op === 'wall');                                       // offen: vorn die Dammwand (Stützmauer bei B)
      expect(walls.length).toBe(1);
      expect([walls[0].a[5], walls[0].a[6], walls[0].a[7], walls[0].a[9], walls[0].a[14]]).toEqual([form === 'b' ? 'mauer' : 'fels', 0, H * i / len, H * (i + 1) / len, H]);
      // das Gleis: Bett ±(RAIL_W + 0,03) auf derselben Schräge
      const bed = calls.find(c => c.op === 'poly' && c.fill === game("C(RAIL_LOOK.schotter.edge)"));
      for (const p of bed.pts) expect(p[2]).toBeCloseTo(h(d(p)), 9);
      expect(Math.max(...bed.pts.map(p => Math.abs(s(p))))).toBeCloseTo(game('RAIL_W') + 0.03, 9);
    }
  });

  it('Wangen (Anhöhe daneben) ohne Wand; Einschnitt A mit gleichem daneben ohne Wand und Kante', () => {
    for (const [m, p] of [['h', 'h'], ['j', 'j'], ['h', 'j']]) {
      const calls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(look({ rot: 0, len: 2, i: 0, form: 'a', m, p }))}, 5, 5)`);
      expect(calls.filter(c => c.op === 'wall').length).toBe(0);
      expect(calls.filter(c => c.op === 'stroke' && c.stroke === 'rgba(45,85,30,0.5)').length).toBe(0);
    }
  });

  it('schmaler Einschnitt (C oben): Streifen ganz hoch bis an die Feldgrenze (Anhöhe daneben: ein Stück darüber), Boden auf der Schräge, Stirn nur vorn', () => {
    for (let rot = 0; rot < 4; rot++) for (const i of [2, 3]) {
      const o = look({ rot, len: 4, i, form: 'c', cut: true, first: i === 2, narrow: true, kind: 'erde', wall: 'erde', m: 'h', p: 'h' });
      const calls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), d = q => q[0] * Du + q[1] * Dv, s = q => -q[0] * Dv + q[1] * Du, h = hOf(4, i), toward = Du + Dv > 0;
      const tops = calls.filter(c => c.op === 'poly' && c.fill === game("C('#123456')"));
      expect(tops.length).toBe(3);                                                             // zwei Streifen, dazwischen der Boden
      const [b, floor, f] = tops;
      for (const q of [...b.pts, ...f.pts]) expect(q[2]).toBe(H);
      for (const q of floor.pts) expect(q[2]).toBeCloseTo(h(d(q)), 9);
      for (const st of [b, f]) { const ss = st.pts.map(s).map(Math.abs); expect([Math.min(...ss), Math.max(...ss)].map(v => +v.toFixed(9))).toEqual([game('GR_DW'), 0.5075]); }
      expect(Math.max(...floor.pts.map(q => Math.abs(s(q))))).toBeCloseTo(game('GR_DW'), 9);
      const stirn = calls.filter(c => c.op === 'wall' && c.a[10] === false);                   // Stirn: Wand ohne eigene Grasnarbe (die kommt eigens)
      expect(stirn.length).toBe(i === 2 && !toward ? 2 : 0);
    }
  });

  it('Viadukt: Fahrbahn auf der Schräge, Brüstung 3 hoch beidseits, Stirn der Brüstungen nur, wo sie zum Betrachter zeigt', () => {
    for (let rot = 0; rot < 4; rot++) for (const i of [0, 1, 3]) {
      const o = look({ rot, len: 4, i, form: 'd', viadukt: true });
      const calls = record(`paintRamp((u, v, up = 0) => [u, v, up], ${JSON.stringify(o)}, 5, 5)`);
      const [Du, Dv] = game(`STAIR_UP[${rot}]`), d = q => q[0] * Du + q[1] * Dv, h = hOf(4, i), toward = Du + Dv > 0;
      const deck = calls.find(c => c.op === 'poly' && c.fill === game("C(GR_STONE.deck)"));
      for (const q of deck.pts) expect(q[2]).toBeCloseTo(h(d(q)), 9);
      const tops = calls.filter(c => c.op === 'poly' && c.fill === game("C(GR_STONE.top)"));
      expect(tops.length).toBe(2);
      for (const t of tops) for (const q of t.pts) expect(q[2]).toBeCloseTo(h(d(q)) + game('GR_PH'), 9);
      const ends = calls.filter(c => c.op === 'poly' && c.fill === game("C(shade(GR_STONE.v, -0.04))"));
      expect(ends.length).toBe((i === 0 && !toward) || (i === 3 && toward) ? 2 : 0);
    }
  });
});

describe('Gleis-Rampe: Zeichnen im Spiel', () => {
  it('alle Formen in allen Drehungen je Feld als Bildchen; Anhöhe dahinter und daneben kennt sie (Grasnarbe, Kante, Streifen); Übermalen ohne Fehler', () => {
    for (const form of ['a', 'b', 'c', 'd']) {
      game("state.hills.clear(); for (let y = 2; y <= 30; y++) for (let x = 2; x <= 30; x++) state.tiles.delete(x + ',' + y); recalc()");
      hills(block(12, 12, 20, 20));
      game(`rampNewForm = '${form}'`);
      const F = game(`RAMP_FORMS.${form}`), len = F.len, o = len - 1 - F.cut;
      const sides = [[16, 21 + o, 0, [16, 20], 'v'], [21 + o, 16, 3, [20, 16], 'u'], [16, 11 - o, 2, [16, 12], 'V'], [11 - o, 16, 1, [12, 16], 'U']];
      for (const [fx, fy, rot] of sides) { const [ax, ay] = anchor(fx, fy, rot, len); game(`buildRot = ${rot}; build('huegelrampe', ${ax}, ${ay})`); }
      game('render(1e6)');
      for (const [fx, fy, rot, , c] of sides) {
        const [Du, Dv] = game(`STAIR_UP[${rot}]`);
        for (let i = 0; i < len; i++) {
          const x = fx + i * Du, y = fy + i * Dv;
          expect([form, rot, i, game(`hillSprites.has('r${x},${y}')`)]).toEqual([form, rot, i, true]);
          expect(game(`hillSprites.get('r${x},${y}').base`)).toMatch(new RegExp(`^G${form}${rot}${len}${i}`));
          expect(game(`drawHillRampOver(${x}, ${y}, 2), drawHillRampOver(${x}, ${y}, 2, 13), true`)).toBe(true);
        }
        const tx = fx + (len - 1) * Du + Du, ty = fy + (len - 1) * Dv + Dv, st = game(`hillStairEnds(${tx}, ${ty})`);
        // hinter dem oberen Feld: eingelassen (A, C) wie die oberste Stufe; davor (B, D) vorn mit Grasnarbe, hinten die Kante nur unterbrochen
        const want = F.cut ? c : c === 'V' ? (F.viadukt ? 'Y' : 'Q') : c === 'U' ? (F.viadukt ? 'X' : 'P') : '';
        expect([form, rot, st.replace(/[MNUV]/g, m => (m === c ? m : ''))]).toEqual([form, rot, want]);
        if (F.narrow && F.cut) {                                                              // Streifen im schmalen Einschnitt: Anhöhe daneben ohne Wand bzw. Kante dorthin
          const [Su, Sv] = [-Dv, Du], cx = fx + (len - 1) * Du, cy = fy + (len - 1) * Dv;
          const left = game(`hillStairEnds(${cx - Math.abs(Su)}, ${cy - Math.abs(Sv)})`), right = game(`hillStairEnds(${cx + Math.abs(Su)}, ${cy + Math.abs(Sv)})`);
          expect([form, rot, left.includes(Su ? 'M' : 'N'), right.includes(Su ? 'U' : 'V')]).toEqual([form, rot, true, true]);
        }
      }
      expect(game('rampOverSpan(16, 21, 0.2, 1.4, 2), true')).toBe(true);
    }
  });

  it('Vorschau in die Anhöhe (A, C): Felder abgesenkt nur für das Bild, Geist je Feld; Leiste und Vorschaubild ohne Fehler', () => {
    hills(block(10, 6, 16, 12));
    for (const form of ['a', 'c']) {
      game(`rampNewForm = '${form}'; setTool('huegelrampe')`);
      const gap = JSON.parse(game("JSON.stringify((g => g && [g.ramp, [...g.keys], g.top, g.lv, g.form, g.len])(rampGapFor(12, 11, 0)))"));
      expect(gap).toEqual([true, ['12,12', '12,11'], '12,11', 0, form, form === 'a' ? 2 : 4]);
      game('hillGap = rampGapFor(12, 11, 0)');
      expect(game('[drawLevel(12, 11), drawLevel(12, 12), drawLevel(12, 10), hillGapHas("12,12")]')).toEqual([0, 0, 1, true]);
      expect(game('hillStairEnds(12, 10)')).toBe('v');                                        // die Anhöhe dahinter kennt den Geist
      if (form === 'c') expect(game('[hillStairEnds(11, 11).includes("M"), hillStairEnds(13, 11).includes("U")]')).toEqual([true, true]);
      game('hillGap = null');
      game('hover = { x: 12, y: 11 }; render(1e6); hover = null');
      expect(game(`hillSprites.has('rg0') && hillSprites.get('rg0').base.startsWith('G${form}0')`)).toBe(true);
    }
    game("setTool('look')");
    for (const f of ['a', 'b', 'c', 'd']) expect(game(`drawRampIcon(30, 30, 1, '${f}'), thumb('huegelrampe', 1, { b: 'huegelrampe', form: '${f}' }) != null`)).toBe(true);
  });
});
