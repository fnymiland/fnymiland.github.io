const { loadGame, game } = require('./helpers/load-game');

// Block 157j (Stufe 3, Nutzer 10.10.2026): Gebäude oben auf Anhöhen – Bauregeln, Gelände, Erreichbarkeit, Fenster.
// Oben erlaubt: alle Gebäude, große Bauten, Bahnhof/Hbf, U-Bahn-Eingang (auf dem Tunnel); nicht, was Wasser braucht, die Tunneleinfahrt, Dächer,
// Parkbahn, Seilbahn. Mehrfeld-Gebäude ganz oben auf einer Ebene (auch gedreht, getragen, als Gruppe, als Kopie, beim Ausbau). Anheben unter einem
// Gebäude gesperrt (erst mit ✋ wegtragen), Abtragen/Treppe/Gleis-Rampe nie darunter, ↶ nie über die Kante. Ohne Treppe: Bauen geht, das Fenster
// warnt, Erreichbarkeit wie „weit weg“. Ohne Anhöhen bleibt alles wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; hillWalkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const put = (x, y, t) => game(`state.tiles.set('${x},${y}', ${JSON.stringify({ lvl: 1, ...t })}); recalc()`);
const STUCK_UP = 'Hier steht ein Gebäude – erst mit ✋ wegtragen, dann oben absetzen';
const panel = () => game("document.getElementById('panel').textContent");
const toastText = () => game("document.getElementById('toast').textContent");
// Anhöhe 10–13 × 10–13 (oben), davor Ebene 0; die Ostwand liegt zwischen x = 13 und 14, die Südwand zwischen y = 13 und 14
const HILL = () => hills(block(10, 10, 13, 13));

describe('Was oben stehen darf (hillOk, hillError)', () => {
  it('alle Gebäude, große Bauten, Bahnhof, Hbf, U-Bahn; nicht: Wasser, Tunneleinfahrt, Dächer, Parkbahn, Seilbahn, Treppe, Gleis-Rampe', () => {
    const ok = ['haus', 'reihenhaus', 'baumhaus', 'feld', 'holz', 'saege', 'fabrik', 'schule', 'uni', 'kiosk', 'kaufhaus', 'hotel', 'windrad', 'solarfeld',
      'geothermie', 'riesenrad', 'botgarten', 'schloss', 'theater', 'zoo', 'stadion', 'station', 'hbf', 'ubahn', 'fz_karussell', 'fz_schloss', 'rathaus',
      'brunnen', 'seerosenteich', 'weg', 'schiene', 'tunnel', 'wald', 'parkrasen'];
    const no = ['fischer', 'hafen', 'leuchtturm', 'ferienhaus', 'hausboot', 'bootssteg', 'wasserkraft', 'wellen', 'offshore', 'seebruecke', 'tunneleinfahrt',
      'dach', 'dachtreppe', 'stuetze', 'pb_gleis', 'pb_station', 'seilbahn', 'huegeltreppe', 'huegelrampe', 'graben', 'schuett', 'hecke', 'zaun'];
    expect(game(`${JSON.stringify(ok)}.filter(b => !hillOk(b))`)).toEqual([]);
    expect(game(`${JSON.stringify(no)}.filter(b => hillOk(b))`)).toEqual([]);
    // alles, was Wasser, Ufer, Strand, Steg oder Meer braucht, bleibt unten
    expect(game("Object.keys(ITEMS).filter(b => ['shore', 'strand', 'boot', 'meer', 'offshore', 'pier'].includes(ITEMS[b].needs) && hillOk(b))")).toEqual([]);
    HILL();
    const E = (b, cells) => game(`hillError('${b}', ${JSON.stringify(cells)})`);
    expect(E('haus', [[11, 11]])).toBe(null);
    expect(E('station', [[11, 11], [11, 12]])).toBe(null);
    expect(E('tunneleinfahrt', [[11, 11], [11, 12]])).toBe('Die Tunneleinfahrt steht unten – der Tunnel darf unter der Anhöhe weiterführen');
    expect(E('fischer', [[11, 11]])).toBe('Das gehört ans Wasser – oben auf der Anhöhe geht es nicht');
    expect(E('seilbahn', [[11, 11]])).toMatch(/Seilbahn-Station steht unten/);
    expect(E('pb_gleis', [[11, 11]])).toMatch(/Parkeisenbahn fährt unten/);
    expect(E('dachtreppe', [[11, 11], [11, 12]])).toBe('Auf einer Anhöhe geht keine Überdachung');
    expect(E('haus', [[16, 16]])).toBe(null);                                         // unten nie gefragt
    expect(E('fischer', [[16, 16]])).toBe(null);
  });

  it('bauen oben: Haus, Betrieb, Schule, Bahnhof; U-Bahn-Eingang nur auf dem Tunnel unter der Anhöhe; Tunneleinfahrt nur unten', () => {
    HILL();
    expect(game("placeError('haus', 11, 11)")).toBe(null);
    expect(game("build('haus', 11, 11)")).toBe(true);
    expect([game("bAt(11, 11)"), game('hillLevel(11, 11)')]).toEqual(['haus', 1]);
    expect(game("placeError('schmiede', 13, 11, 0, { move: true })")).toBe(null);
    expect(game("placeError('schule', 12, 12, 0, { move: true })")).toBe(null);     // 2×2 ganz oben
    expect(game("placeError('station', 10, 12, 0, { move: true })")).toBe(null);    // 1×2 ganz oben
    expect(game("placeError('ubahn', 10, 10)")).toMatch(/Auf einen Tunnel setzen/);
    game("build('tunnel', 10, 10, true); recalc()");
    expect(game("tunnelAt(10, 10)")).toBeTruthy();
    expect(game("placeError('ubahn', 10, 10)")).toBe(null);                          // auf dem Tunnel unter der Anhöhe
    expect(game("placeError('tunneleinfahrt', 12, 10, 1, { move: true })")).toMatch(/Tunneleinfahrt steht unten/);
    expect(game("placeError('tunneleinfahrt', 16, 16, 1, { move: true })")).toBe(null);   // unten wie immer
    expect(game("placeError('fischer', 12, 12, 0, { move: true })")).toMatch(/gehört ans Wasser/);
  });

  it('Mehrfeld-Gebäude ganz oben auf einer Ebene – nie über die Kante, auch gedreht; unten wie immer', () => {
    HILL();
    expect(game("placeError('schule', 12, 12, 0, { move: true })")).toBe(null);
    expect(game("placeError('schule', 13, 13, 0, { move: true })")).toBe('Nicht über die Kante einer Anhöhe');
    expect(game("placeError('schule', 9, 11, 0, { move: true })")).toBe('Nicht über die Kante einer Anhöhe');   // Westkante
    expect(game("placeError('schule', 16, 16, 0, { move: true })")).toBe(null);
    // Reihenhäuser 1×2: längs an der Ostwand ganz oben, quer darüber nicht
    expect(game("placeError('reihenhaus', 13, 12, 0)")).toBe(null);
    expect(game("placeError('reihenhaus', 13, 12, 1)")).toBe('Nicht über die Kante einer Anhöhe');
    expect(game("placeError('station', 13, 13, 0, { move: true })")).toBe('Nicht über die Kante einer Anhöhe');
    // zwei Ebenen nebeneinander (Fundament kann mehr): auch dort nicht über die Stufe
    game("state.hills.get('13,10').h = 2; groundVersion++; recalc()");
    expect(game("placeError('reihenhaus', 13, 10, 0)")).toBe('Nicht über die Kante einer Anhöhe');
  });
});

describe('Gelände unter und neben Gebäuden', () => {
  it('Anheben unter einem Gebäude gesperrt (Hinweis: erst mit ✋ wegtragen); Wege, Deko, Gleise kommen weiter mit', () => {
    put(16, 16, { b: 'haus' }); put(18, 16, { b: 'station', rot: 0 }); put(20, 16, { b: 'reihenhaus', rot: 0 });
    game("build('weg', 16, 18, true); state.tiles.set('18,18', { b: 'brunnen', lvl: 1 }); recalc()");
    expect(game('hillRaiseError(16, 16)')).toBe(STUCK_UP);
    expect(game('hillRaiseError(18, 17)')).toBe(STUCK_UP);                           // zweites Feld des Bahnhofs
    expect(game('hillRaiseError(20, 17)')).toBe(STUCK_UP);
    expect(game('hillRaiseError(16, 18)')).toBe(null);
    expect(game('hillRaiseError(18, 18)')).toBe(null);
    game("setTool('anhoehe'); startPlan('rect', { x: 15, y: 16 }, { x: 16, y: 16 }, true)");
    expect(game("(i => [i.states.get('16,16'), i.states.get('15,16'), i.n, i.firstErr])(planInfo(plan))")).toEqual(['bad', 'ok', 1, STUCK_UP]);
    game("runPlan(); setTool('look')");
    expect([game('hillLevel(16, 16)'), game('hillLevel(15, 16)'), game('bAt(16, 16)')]).toEqual([0, 1, 'haus']);
    expect(game("build('anhoehe', 16, 16)")).toBe(false);
  });

  it('Abtragen nie unter einem Gebäude: lowerHill, Abriss-Rechteck und ✋-Auswahl nur, wenn das Gebäude mit wegkommt', () => {
    HILL();
    put(11, 11, { b: 'haus' }); put(12, 10, { b: 'reihenhaus', rot: 0 });          // Reihenhäuser auf 12,10 und 12,11
    expect(game('lowerHill(11, 11)')).toBe(false);
    expect([game('hillLevel(11, 11)'), game('bAt(11, 11)')]).toEqual([1, 'haus']);
    expect(toastText()).toBe('Oben steht ein Gebäude – erst abreißen oder mit ✋ wegtragen');
    expect(game('demolishInfo(11, 11).label')).toMatch(/abreißen/);                 // 👆/Abriss trifft das Gebäude, nie die Anhöhe darunter
    expect(game('demolishInfo(11, 11).hill')).toBeUndefined();
    // Rechteck über ein Feld der Reihenhäuser: rot, die Anhöhe darunter bleibt; daneben wird abgetragen
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 12, y: 11 }, b: { x: 13, y: 11 }, fixed: true }");
    expect(game("(i => [i.states.get('12,11'), i.states.get('13,11')])(planInfo(plan))")).toEqual(['bad', 'ok']);
    game('runPlan()');
    expect([game('hillLevel(12, 11)'), game('hillLevel(13, 11)'), game('bAt(12, 10)')]).toEqual([1, 0, 'reihenhaus']);
    // ganz im Rechteck (✋-Auswahl, keepLand): erst nur das Gebäude (Nutzer 11.10.2026: „Weg oben löschen löscht die Anhöhe – doof“),
    // das nächste Abreißen die leere Anhöhe
    game("plan = { kind: 'rect', tool: 'abriss', keepLand: true, a: { x: 12, y: 10 }, b: { x: 12, y: 11 }, fixed: true }; runPlan()");
    expect([game("state.tiles.has('12,10')"), game('hillLevel(12, 10)'), game('hillLevel(12, 11)')]).toEqual([false, 1, 1]);
    game("plan = { kind: 'rect', tool: 'abriss', keepLand: true, a: { x: 12, y: 10 }, b: { x: 12, y: 11 }, fixed: true }; runPlan()");
    expect([game('hillLevel(12, 10)'), game('hillLevel(12, 11)')]).toEqual([0, 0]);
    // Haus allein auf der ganzen Anhöhe: erst das Haus, dann die Anhöhe
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 10, y: 10 }, b: { x: 13, y: 13 }, fixed: true }; runPlan()");
    expect([game("state.tiles.has('11,11')"), game('state.hills.size') > 0]).toEqual([false, true]);
    game("plan = { kind: 'rect', tool: 'abriss', a: { x: 10, y: 10 }, b: { x: 13, y: 13 }, fixed: true }; runPlan()");
    expect(game('state.hills.size')).toBe(0);
  });

  it('Treppe einsetzen und Gleis-Rampe einsenken nie auf Feldern mit Gebäude; daneben schon', () => {
    HILL();
    put(13, 12, { b: 'haus' }); put(13, 13, { b: 'haus' });
    expect(game('stairIntoError(13, 12)')).toBe('Hier steht: Haus – erst wegnehmen');
    expect(game("placeError('huegeltreppe', 13, 12)")).toMatch(/Hier steht: Haus/);
    expect(game("placeError('huegeltreppe', 13, 11)")).toBe(null);                  // daneben: Randfeld ohne Gebäude
    game("rampNewForm = 'a'");
    expect(game("placeError('huegelrampe', 13, 12)")).toMatch(/Hier steht: Haus|nicht genug Platz/);   // A: 13,12 oben, 13,13 Fuß – beide in der Anhöhe
    game("state.tiles.delete('13,12'); state.tiles.delete('13,13'); recalc()");
    expect(game("placeError('huegelrampe', 13, 12)")).toBe(null);
  });

  it('Ausbau (Märchenschloss wächst) nie über die Kante; kleiner geht', () => {
    hills(block(10, 10, 13, 14));
    game("for (const [x, y] of " + JSON.stringify(block(10, 10, 13, 14)) + ") state.terra.set(x + ',' + y, 'fz'); landCache.clear(); sandCache.clear(); recalc()");
    expect(game("placeError('fz_schloss', 10, 10, 0, { move: true })")).toBe(null);   // 2×5 ganz oben
    put(10, 10, { b: 'fz_schloss', rot: 0, cs: game('csOf(null)') });
    expect(game('sizeOf("fz_schloss", 0, state.tiles.get("10,10"))')).toEqual([2, 5]);
    expect(game("castleChange(10, 10, { w: 6 })")).toBe(null);                       // breiter: ragte über die Kante
    expect(game('sizeOf("fz_schloss", 0, state.tiles.get("10,10"))')).toEqual([2, 5]);
    expect(game("castleChange(10, 10, { w: 4 })")).not.toBe(null);
  });
});

describe('Tragen, Gruppen, Kopien, ↶, Speichern', () => {
  it('✋ einzeln: oben ablegen geht, gedreht über die Kante nicht', () => {
    HILL();
    put(16, 10, { b: 'reihenhaus', rot: 0 });
    game("undoable(() => pickUp(16, 10, 0))");
    expect(game("moving && moving.t.b")).toBe('reihenhaus');
    expect(game('moveError(13, 12, 0)')).toBe(null);
    game('rotManual = true; buildRot = 1');
    expect(game('moveError(13, 12, 0)')).toBe('Nicht über die Kante einer Anhöhe');
    expect(game('moveError(12, 12, 0)')).toBe(null);
    game('undoable(() => dropAt(12, 12, 0))');
    expect([game('bAt(12, 12)'), game('bAt(13, 12)'), game('hillLevel(13, 12)'), game('moving')]).toEqual(['reihenhaus', 'reihenhaus', 1, null]);
    game('undo()');                                                               // ↶: wieder unten am alten Platz
    expect([game('bAt(16, 10)'), game("state.tiles.has('12,12')")]).toEqual(['reihenhaus', false]);
  });

  it('Gruppe gedreht an der Kante: über die Kante rot, ganz oben ablegen; ⧉ Kopie ebenso', () => {
    HILL();
    put(16, 16, { b: 'reihenhaus', rot: 0 }); put(17, 16, { b: 'brunnen' });       // Reihenhäuser 16,16–16,17, Brunnen 17,16
    game("setTool('verschieben'); pickUpGroup(16, 16, 17, 17); rotateGroup(1)");
    expect(game("moving.kind")).toBe('group');
    expect(game('groupErrors(14, 12).first')).toBe('Nicht über die Kante einer Anhöhe');   // Reihenhäuser quer auf 13,11 und 14,11
    expect(game('groupErrors(12, 12).first')).toBe(null);
    expect(game('dropGroup(12, 12)')).toBe(true);
    expect([game('bAt(11, 11)'), game('bAt(12, 11)'), game('state.tiles.get("11,11").rot'), game('bAt(12, 12)')]).toEqual(['reihenhaus', 'reihenhaus', 1, 'brunnen']);
    expect(game('[hillLevel(11, 11), hillLevel(12, 11)]')).toEqual([1, 1]);
    // ⧉ Kopie der Reihenhäuser oben (Rahmen 2×1, Griff rechts): über die Ostkante rot, ganz oben geht
    game("setTool('look'); startCopy(11, 11, 12, 11)");
    expect(game('moving && moving.copy')).toBe(true);
    expect(game('groupErrors(14, 13).first')).toBe('Nicht über die Kante einer Anhöhe');   // 13,13 oben, 14,13 unten
    expect(game('groupErrors(13, 13).first')).toBe(null);                          // 12,13 und 13,13
    game('cancelMove(); setTool("look")');
    game("startCopy(16, 20, 16, 21)");
    expect(game('moving')).toBe(null);                                             // nichts da: keine Kopie
    put(16, 20, { b: 'reihenhaus', rot: 0 });
    game("startCopy(16, 20, 16, 21)");
    expect(game('[moving.W, moving.H, moving.cx, moving.cy]')).toEqual([1, 2, 0, 1]);
    expect(game('groupErrors(12, 14).first')).toBe('Nicht über die Kante einer Anhöhe');   // 12,13 oben, 12,14 unten
    expect(game('groupErrors(10, 12).first')).toBe(null);
    expect(game('dropGroup(10, 12)')).toBe(true);
    expect([game('bAt(10, 11)'), game('bAt(10, 12)'), game('hillLevel(10, 12)')]).toEqual(['reihenhaus', 'reihenhaus', 1]);
    game('cancelMove(); setTool("look")');
  });

  it('↶ bringt nie ein Gebäude über die Kante oder unter eine Anhöhe', () => {
    // a) angehoben, dann oben gebaut; der Bau lässt sich nicht mehr zurücknehmen (seitdem verändert) – das Anheben dann auch nicht
    game("undoable(() => { build('anhoehe', 10, 10); build('anhoehe', 11, 10); })");
    game("undoable(() => build('haus', 10, 10))");
    game("state.tiles.get('10,10').look = 2");
    expect(game('undo()')).toBe(false);
    expect(game('undo()')).toBe(false);
    expect(toastText()).toBe('Geht nicht mehr – oben steht inzwischen ein Gebäude');
    expect([game('hillLevel(10, 10)'), game('hillLevel(11, 10)'), game('bAt(10, 10)')]).toEqual([1, 1, 'haus']);
    // b) abgetragen, dann unten gebaut: das Abtragen kommt nicht mehr zurück
    game('resetUndo(); state.tiles.delete("10,10"); recalc()');
    game("undoable(() => demolish(11, 10))");
    expect(game('hillLevel(11, 10)')).toBe(0);
    game("undoable(() => build('haus', 11, 10))");
    game("state.tiles.get('11,10').look = 2");
    expect(game('undo()')).toBe(false);
    expect(game('undo()')).toBe(false);
    expect(toastText()).toBe('Geht nicht mehr – dort steht inzwischen etwas');
    expect([game('hillLevel(11, 10)'), game('bAt(11, 10)')]).toEqual([0, 'haus']);
    // c) Reihenhäuser oben abgerissen, danach (ohne ↶-Schritt) ein Feld abgetragen: zurück kämen sie über die Kante
    game('resetUndo(); state.tiles.delete("11,10"); recalc()');
    HILL();
    put(12, 10, { b: 'reihenhaus', rot: 0 });
    const m0 = game('state.money');
    game("undoable(() => demolish(12, 10))");
    expect(game("state.tiles.has('12,10')")).toBe(false);
    game('lowerHill(12, 11)');
    expect(game('hillLevel(12, 11)')).toBe(0);
    const m1 = game('state.money');
    expect(game('undo()')).toBe(false);
    expect(toastText()).toBe('Geht nicht mehr – das stünde jetzt über der Kante einer Anhöhe');
    expect([game("state.tiles.has('12,10')"), game('state.money')]).toEqual([false, m1]);
    expect(m1).toBeGreaterThan(m0);                                                // Erstattung bleibt, nichts doppelt
    // d) normal: oben gebaut, ↶ nimmt es zurück
    game("undoable(() => build('haus', 10, 12))");
    expect(game('bAt(10, 12)')).toBe('haus');
    expect(game('undo()')).toBe(true);
    expect(game("state.tiles.has('10,12')")).toBe(false);
  });

  it('Speichern und Laden: Gebäude oben bleiben oben (Haus, Schule, Bahnhof, U-Bahn)', () => {
    HILL();
    game("build('tunnel', 13, 10, true); recalc()");
    put(10, 10, { b: 'haus', animal: 'fuchs', name: 'Fritz' }); put(11, 12, { b: 'schule' }); put(10, 12, { b: 'station', rot: 0 }); put(13, 10, { b: 'ubahn' });
    const back = game(`(() => { const s = parseSave(JSON.parse(JSON.stringify(serialize())));
      return ['10,10', '11,12', '10,12', '13,10'].map(k => [s.tiles.get(k) && s.tiles.get(k).b, !!s.hills.get(k)]); })()`);
    expect(back).toEqual([['haus', true], ['schule', true], ['station', true], ['ubahn', true]]);
  });
});

describe('Erreichbarkeit und Fenster', () => {
  it('oben ohne Treppe = eigene Gegend: Betrieb oben bei Häusern unten ist „weit weg“ (50 %), mit Treppe nah; oben unter sich nah', () => {
    HILL();
    put(15, 11, { b: 'haus' });                                                    // unten, 3 Felder von 12,11
    put(12, 11, { b: 'schmiede' });                                                // oben
    expect(game('hillNoStair(12, 11)')).toBe(true);
    expect(game("(s => [s.how, s.eff])(statusOf(12, 11))")).toEqual(['weit', 0.5]);
    put(17, 11, { b: 'schmiede' });                                                // unten neben dem Haus: wie immer
    expect(game("statusOf(17, 11).how")).toBe('nah');
    game("build('huegeltreppe', 14, 12); recalc()");                              // Treppe hinauf (ohne Weg)
    expect([game('hillNoStair(12, 11)'), game('hillRegions()')]).toEqual([false, null]);
    expect(game("(s => [s.how, s.eff])(statusOf(12, 11))")).toEqual(['nah', 1]);
    game("demolish(14, 12); recalc()");
    expect(game("statusOf(12, 11).how")).toBe('weit');
    // Haus oben, Betrieb unten (4 Felder): genauso weit weg; ohne Anhöhe wäre er nah
    game("state.tiles.delete('15,11'); recalc()");
    put(13, 11, { b: 'haus' });
    expect(game("statusOf(17, 11).how")).toBe('weit');
    expect(game("statusOf(12, 11).how")).toBe('viertel');                          // oben nebeneinander: ein Viertel
    put(11, 13, { b: 'steinmetz' });                                               // oben, 2 Felder vom Haus, nicht daneben
    expect(game("statusOf(11, 13).how")).toBe('nah');
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(game("statusOf(17, 11).how")).toBe('nah');
  });

  it('Bahnhof oben ohne Treppe: der Zug hilft oben wie unten – den Gebäuden unten daneben nicht', () => {
    for (let x = 4; x <= 16; x++) game(`state.tiles.set('${x},10', { b: 'schiene', lvl: 1 })`);
    game("state.tiles.set('3,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' }); state.tiles.set('17,10', { b: 'station', lvl: 1, rot: 0, train: 'regio' })");
    for (let i = 0; i < 10; i++) game(`state.tiles.set('${4 + i},24', { b: 'windrad', lvl: 3 })`);
    game("for (const k of ['17,13', '18,12']) { state.terra.set(k, 'forest'); state.tiles.set(k, { b: 'holz', lvl: 1 }); } landCache.clear()");
    game("globalThis.__ra = regionAt; regionAt = (x, y) => x > 10 ? 'wald' : 'home'");
    try {
      game('recalc()');
      expect(game('T.rail.lines.length && T.rail.lines[0].powered')).toBe(true);
      expect([game("T.st.get('17,13').how"), game("T.st.get('18,12').how")]).toEqual(['bahn', 'bahn']);
      game("for (let y = 8; y <= 12; y++) for (let x = 2; x <= 20; x++) state.hills.set(x + ',' + y, { w: 0 }); groundVersion++; recalc()");   // Strecke samt Bahnhöfen oben
      expect(game('T.rail.lines.length && T.rail.lines[0].powered')).toBe(true);
      expect(game("T.st.get('18,12').how")).toBe('bahn');                          // oben neben dem Bahnhof
      expect(game("T.st.get('17,13').how")).toBe('weit');                          // unten: keine Treppe hinauf
      game("build('huegeltreppe', 19, 13); recalc()");                             // Treppe hinauf: unten kommt man wieder hin
      expect(game('!!stairAt(19, 13) && hillRegions()')).toBe(null);
      expect(game("T.st.get('17,13').how")).toBe('bahn');
    } finally { game('regionAt = globalThis.__ra; delete globalThis.__ra; recalc()'); }
  });

  it('Fenster: „Keine Treppe führt auf diese Anhöhe“, „Keine Tür führt auf ebenen Boden“; Hinweis beim Bauen; unten und ohne Anhöhen nichts', () => {
    HILL();
    put(15, 11, { b: 'haus' });
    game("build('schmiede', 12, 12)");                                            // oben allein, Häuser nur unten
    expect(toastText()).toBe('Oben ohne Treppe: nur halbe Kraft. Eine Treppe hinauf hilft.');
    game('openInfo(12, 12)');
    expect(panel()).toContain('Eine Treppe hinauf oder ein Bahnhof oben bringt 100 %');
    expect(panel()).toContain('Keine Treppe führt auf diese Anhöhe – zu Fuß kommt niemand hinauf');
    game("build('haus', 10, 10)");
    game('openInfo(10, 10)');
    expect(panel()).toContain('Keine Treppe führt auf diese Anhöhe – zu Fuß kommt niemand hinauf');
    expect(panel()).not.toContain('Keine Tür');
    game("build('huegeltreppe', 14, 12); recalc(); openInfo(10, 10)");
    expect(panel()).not.toContain('Keine Treppe');
    // Haus allein auf einer Anhöhe aus einem Feld: keine Tür auf ebenen Boden
    hills([[20, 20]]);
    put(20, 20, { b: 'haus' });
    game('openInfo(20, 20)');
    expect(panel()).toContain('Keine Tür führt auf ebenen Boden');
    expect(panel()).toContain('Keine Treppe');
    // unten direkt vor der Wand, aber mit Platz daneben: nichts
    put(14, 10, { b: 'haus' });
    game('openInfo(14, 10)');
    expect(panel()).not.toMatch(/Keine Treppe|Keine Tür/);
    // ohne Anhöhen: kein Hinweis, keine Gegend
    game('state.hills.clear(); groundVersion++; recalc(); openInfo(20, 20)');
    expect(panel()).not.toMatch(/Keine Treppe|Keine Tür/);
    expect([game('hillRegions()'), game('hillNoStair(20, 20)'), game("hillInfoStatus(state.tiles.get('20,20'), 20, 20)")]).toEqual([null, false, []]);
  });

  it('ohne Anhöhen unverändert: gleiche Bauregeln, gleiche Erreichbarkeit, gleiches Einkommen', () => {
    put(10, 10, { b: 'haus' }); put(12, 10, { b: 'schmiede' }); put(20, 20, { b: 'schmiede' }); put(10, 14, { b: 'schule' });
    const snap = () => game(`[['haus', 11, 11], ['schule', 15, 15], ['station', 18, 12], ['fischer', 16, 16], ['tunneleinfahrt', 22, 22]].map(([b, x, y]) => placeError(b, x, y, 0, { move: true }))
      .concat(['10,10', '12,10', '20,20', '10,14'].map(k => T.st.get(k).how), [Math.round(T.inc * 1000)])`);
    const before = snap();
    hills([[24, 24]]);                                                             // eine leere Anhöhe weit weg
    expect(snap()).toEqual(before);
    game('state.hills.clear(); groundVersion++; recalc()');
    expect(snap()).toEqual(before);
    expect(game("hillError('haus', [[11, 11]])")).toBe(null);
  });
});
