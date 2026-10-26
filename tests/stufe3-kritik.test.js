const { loadGame, game } = require('./helpers/load-game');

// Block 157j, kritische Prüfung der Logik (Stufe 3: Gebäude oben). Jeder Test zeigt einen gefundenen Fehler mit echten Spielzügen:
// ↶ nach dem Umstellen der Wandart unter einem Gebäude, Tortürme über die Kante, Treppe oben/unten zugestellt (Erreichbarkeit, Hinweise),
// „Weg am Eingang“ des Hauptbahnhofs über die Kante. Ohne Anhöhen bleibt alles wie vorher
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool('look'); setSeeThrough(false)");
  game("state.money = 1e7; for (const t of TECHS) state.techs.add(t.id); for (const k of Object.keys(LM_STAGES)) state.restore[k] = 3; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k)");
  game("for (let y = 4; y <= 26; y++) for (let x = 4; x <= 26; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.tunnels.clear(); state.hills.clear(); state.paintNew.anhoehe = {}; delete chosenStyle.huegelrampe; chosenStyle.weg = 'sand'; buildRot = 0; rotManual = false; rampNewForm = 'a'; stairNewWide = null; hillWalkers.length = 0; recalc(); resetUndo()");
});
const block = (x0, y0, x1, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
const hills = cells => game(`for (const [x, y] of ${JSON.stringify(cells)}) build('anhoehe', x, y, true); recalc()`);
const put = (x, y, t) => game(`state.tiles.set('${x},${y}', ${JSON.stringify({ lvl: 1, ...t })}); recalc()`);
const toastText = () => game("document.getElementById('toast').textContent");
const panel = () => game("document.getElementById('panel').textContent");
// Anhöhe 10–13 × 10–13 (oben), ringsum Ebene 0
const HILL = () => hills(block(10, 10, 13, 13));

describe('↶ nach dem Umstellen der Wandart', () => {
  it('unter einem Gebäude oder großer Deko oben: ↶ stellt die Wand zurück (die Höhe bleibt – nichts steht danach anders)', () => {
    HILL();
    put(11, 11, { b: 'haus', animal: 1 });
    put(12, 12, { b: 'glashaus', rot: 0 });                                   // große Deko 1×2 (12,12 und 12,13) – ging schon in Stufe 2
    game("state.paintNew.anhoehe = { form: 1 }; undoable(() => build('anhoehe', 11, 11)); undoable(() => build('anhoehe', 12, 13))");
    expect(game('[hillAt(11, 11).w, hillAt(12, 13).w]')).toEqual([1, 1]);
    expect(game('undo()')).toBe(true);
    expect(game('hillAt(12, 13).w || 0')).toBe(0);
    expect(game('undo()')).toBe(true);
    expect(game('hillAt(11, 11).w || 0')).toBe(0);
    expect([game('bAt(11, 11)'), game('bAt(12, 13)'), game('hillLevel(11, 11)'), game('hillLevel(12, 13)')]).toEqual(['haus', 'glashaus', 1, 1]);
    // die Sperren bleiben: Anheben zurücknehmen, wenn oben inzwischen ein Gebäude steht, geht weiter nicht
    game("undoable(() => build('anhoehe', 16, 16))");
    put(16, 16, { b: 'haus', animal: 2 });
    game("state.tiles.get('16,16').look = 2");
    expect(game('undo()')).toBe(false);
    expect(toastText()).toBe('Geht nicht mehr, oben steht inzwischen ein Gebäude');
    expect([game('hillLevel(16, 16)'), game('bAt(16, 16)')]).toEqual([1, 'haus']);
  });
});

describe('Tortürme (Freizeitpark-Eingang)', () => {
  it('Bogen nur zwischen Türmen auf derselben Ebene, nie über die Kante; ohne Anhöhen wie vorher', () => {
    HILL();
    put(12, 11, { b: 'fz_torturm' }); put(16, 11, { b: 'fz_torturm' });      // oben ↔ unten, 4 Felder: kein Bogen
    expect(game('[...TOR_PAIR]')).toEqual([]);
    put(10, 12, { b: 'fz_torturm' }); put(13, 12, { b: 'fz_torturm' });      // beide oben: Bogen
    expect(game('TOR_PAIR.get("10,12")')).toBe('13,12');
    put(8, 15, { b: 'fz_torturm' }); put(11, 15, { b: 'fz_torturm' });       // beide unten: Bogen
    expect(game('TOR_PAIR.get("8,15")')).toBe('11,15');
    put(7, 10, { b: 'fz_torturm' }); put(7, 13, { b: 'fz_torturm' });        // unten, eine Spalte vor der Wand: Bogen
    expect(game('TOR_PAIR.get("7,10")')).toBe('7,13');
    put(9, 4, { b: 'fz_torturm' }); put(14, 4, { b: 'fz_torturm' });         // unten, aber dazwischen nichts Höheres: Bogen
    expect(game('TOR_PAIR.get("9,4")')).toBe('14,4');
    game("state.tiles.delete('9,4'); state.tiles.delete('14,4'); recalc()");
    put(9, 12, { b: 'fz_torturm' }); put(14, 12, { b: 'fz_torturm' });      // unten zu beiden Seiten der Anhöhe – der Bogen ginge über sie hinweg
    expect([game('TOR_PAIR.get("9,12")'), game('TOR_PAIR.get("14,12")'), game('TOR_PAIR.get("10,12")')]).toEqual([undefined, undefined, '13,12']);
    game('state.hills.clear(); groundVersion++; recalc()');                   // ohne Anhöhen: die nächsten Türme je Reihe wie bisher
    expect(game('TOR_PAIR.get("12,11")')).toBe('16,11');
    expect(game('TOR_PAIR.get("10,12")')).toBe('13,12');
  });
});

describe('Treppe zugestellt', () => {
  it('oben ein Ding auf dem oberen Feld: über die Treppe erreicht man nur dieses – der Rest der Anhöhe ist „weit weg“, das Fenster sagt warum', () => {
    HILL();
    game("build('huegeltreppe', 14, 12); recalc()");                        // hinauf nach −x, oberes Feld 13,12, Fuß 15,12
    expect(game('STAIR_UP[stairRotOf(stairAt(14, 12))]')).toEqual([-1, 0]);
    put(15, 11, { b: 'haus', animal: 1 });                                    // unten, 4 Felder von der Schmiede
    put(11, 11, { b: 'schmiede' });                                           // oben
    expect([game('hillRegions()'), game("statusOf(11, 11).how")]).toEqual([null, 'nah']);
    expect([game("previewDelta('kiosk', 13, 12).blocks"), game("previewDelta('kiosk', 12, 12).blocks")]).toEqual([true, false]);   // Bau-Vorschau sagt es vorher
    expect(game("build('kiosk', 13, 12)")).toBe(true);                       // oben direkt auf dem oberen Feld der Treppe
    expect(toastText()).toBe('Versperrt die Treppe. Zu Fuß kommt sonst niemand mehr auf die Anhöhe.');
    expect(game('walkPath(15, 12, doorsOf("11,11"))')).toBe(null);           // zur Schmiede kommt von unten wirklich keiner
    expect(game('walkPath(15, 12, doorsOf("13,12"))')).toEqual([[14, 12]]);   // zum Kiosk über die Treppe (seine Tür)
    expect([game('hillNoStair(11, 11)'), game('hillNoStair(13, 12)')]).toEqual([true, false]);
    expect(game("(s => [s.how, s.eff])(statusOf(11, 11))")).toEqual(['weit', 0.5]);
    expect(game("statusOf(13, 12).how")).toBe('nah');
    game('openInfo(11, 11)');
    expect(panel()).toContain('Die Treppe hinauf ist zugestellt. Von unten kommt zu Fuß niemand hierher.');
    expect(panel()).not.toContain('Keine Treppe führt');
    game('openInfo(13, 12)');
    expect(panel()).toContain('Versperrt die Treppe. Zu Fuß kommt sonst niemand auf die Anhöhe.');
    expect(panel()).not.toContain('zugestellt');
    // Ziele: von unten nie die Schmiede, der Kiosk schon; von oben (Tür des Kiosks oben) beide
    const below = new Set(), above = new Set();
    for (let i = 0; i < 30; i++) { below.add((game("findGoal('arbeit', 15, 12)") || {}).k); above.add((game("findGoal('arbeit', 12, 12)") || {}).k); }
    expect([below.has('11,11'), below.has('13,12'), above.has('11,11'), above.has('13,12')]).toEqual([false, true, true, true]);
    // ein Haus auf dem oberen Feld: seine Bewohner kommen oben heraus – für die Schmiede daneben zählt es (beide Gegenden)
    game("state.tiles.set('13,12', { b: 'haus', lvl: 1, animal: 2 }); recalc()");
    expect(game("statusOf(11, 11).how")).toBe('nah');
    expect(game('hillNoStair(11, 11)')).toBe(true);
    // mit ✋ weggetragen und unten abgesetzt: die Treppe führt wieder hinauf
    game("undoable(() => pickUp(13, 12, 0)); undoable(() => dropAt(18, 14, 0))");
    expect([game('bAt(18, 14)'), game('hillRegions()'), game('hillNoStair(11, 11)')]).toEqual(['haus', null, false]);
    // ein Weg oben auf dem Feld sperrt nichts
    game("build('weg', 13, 12, true); recalc()");
    expect(game('hillRegions()')).toBe(null);
  });

  it('unten ein Ding auf dem Fuß: die Treppe führt nur für dieses hinauf; breite Treppe: über die Nachbartreppe', () => {
    HILL();
    game("stairNewWide = true; build('huegeltreppe', 14, 12); recalc()");
    put(15, 11, { b: 'haus', animal: 1 });
    put(11, 11, { b: 'schmiede' });
    put(15, 12, { b: 'kiosk' });                                              // auf dem Fuß der Treppe
    expect(game('hillNoStair(11, 11)')).toBe(true);
    expect(game("statusOf(11, 11).how")).toBe('weit');
    game('openInfo(15, 12)');
    expect(panel()).toContain('Versperrt die Treppe');
    // zweite Treppe daneben (breit), ihr oberes Feld zugestellt: über sie auf die erste und dort hinauf
    put(13, 13, { b: 'kiosk' });
    game("build('huegeltreppe', 14, 13); recalc()");
    expect(game('levelLink(14, 13, 14, 12, "fuss")')).toBe(true);
    expect([game('hillRegions()'), game("statusOf(11, 11).how")]).toEqual([null, 'nah']);
    game('openInfo(15, 12)');
    expect(panel()).not.toContain('Versperrt die Treppe');
  });

  it('Gleis oben vor dem Ausstieg (über Schienen geht keiner), Bahnübergang schon; ohne Anhöhen kein Hinweis', () => {
    HILL();
    game("build('huegeltreppe', 14, 12); recalc()");
    put(15, 11, { b: 'haus', animal: 1 });
    put(11, 11, { b: 'schmiede' });
    put(13, 12, { b: 'schiene' });
    expect(game('hillNoStair(11, 11)')).toBe(true);
    game("state.tiles.set('13,12', { b: 'schiene', lvl: 1, cross: true, style: 'sand' }); recalc()");   // Bahnübergang: begehbar
    expect(game('hillNoStair(11, 11)')).toBe(false);
    game("state.tiles.set('13,12', { b: 'kiosk', lvl: 1 }); recalc()");
    expect(game('hillNoStair(11, 11)')).toBe(true);
    game('state.hills.clear(); groundVersion++; recalc()');
    expect([game('hillRegions()'), game('hillNoStair(11, 11)'), game("statusOf(11, 11).how")]).toEqual([null, false, 'nah']);
    game('openInfo(13, 12)');
    expect(panel()).not.toMatch(/Versperrt|zugestellt|Keine Treppe/);
  });
});

describe('Hauptbahnhof oben', () => {
  it('ein Weg unten vor dem Portal ist kein „Weg am Eingang“ – oben schon', () => {
    hills(block(8, 6, 14, 14));
    put(8, 8, { b: 'hbf', rot: 0, gleise: 2, wing: 2, mid: 1 });
    expect(game("hbfEntrance(state.tiles.get('8,8'), 8, 8)")).toEqual([[7, 10]]);   // Portal zeigt über die Westkante
    game("build('weg', 7, 10, true); recalc(); openInfo(8, 8)");
    expect(panel()).not.toContain('Weg am Eingang');
    expect(panel()).toContain('Leg einen Weg vor das Portal');
    game("state.tiles.delete('7,10'); for (let y = 6; y <= 14; y++) build('anhoehe', 7, y, true); build('weg', 7, 10, true); recalc(); openInfo(8, 8)");
    expect(game('hillLevel(7, 10)')).toBe(1);
    expect(panel()).toContain('Weg am Eingang');
  });
});

describe('Viele echte Spielzüge (fester Zufall)', () => {
  it('bauen, anheben, abtragen, ✋ tragen/drehen, Gruppen, ⧉ Kopien, ↶, Treppen, Gleis-Rampen, Abriss-Rechteck, Bahnhof wachsen, im Fenster drehen: nie über die Kante, oben nur Erlaubtes, nie doppelt', () => {
    game("for (let y = 2; y <= 34; y++) for (let x = 2; x <= 34; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } for (let y = 28; y <= 34; y++) for (let x = 28; x <= 34; x++) state.tiles.set(x + ',' + y, { b: 'haus', lvl: 1, animal: 1 }); recalc(); resetUndo()");
    const r = game(`(() => {
      let seed = 7;
      const R = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      const ri = (a, b) => a + Math.floor(R() * (b - a + 1)), pick = a => a[Math.floor(R() * a.length)], X = () => ri(4, 24), Y = () => ri(4, 24);
      const B = ['haus', 'reihenhaus', 'schule', 'station', 'saege', 'uni', 'bibliothek', 'kiosk', 'glashaus', 'brunnen', 'weg', 'schiene', 'fz_torturm', 'hbf', 'riesenrad', 'sternwarte'];
      const bad = [];
      let up = 0, upBig = 0;
      for (let i = 0; i < 400 && bad.length < 3; i++) {
        state.money = 1e9; for (const q of Object.keys(RES)) state.res[q] = 99999;
        const r = R(); let op = '';
        try {
          if (r < 0.2) { const b = pick(B); op = 'bauen ' + b; rotManual = R() < 0.5; buildRot = ri(0, 3); undoable(() => build(b, X(), Y())); }
          else if (r < 0.32) { op = 'anheben'; state.paintNew.anhoehe = { form: ri(0, 2) }; const x = X(), y = Y(), w = ri(1, 4), h = ri(1, 4); undoable(() => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) build('anhoehe', xx, yy, true); recalc(); }); }
          else if (r < 0.40) { op = 'abreißen'; const x = X(), y = Y(); undoable(() => demolish(x, y)); }
          else if (r < 0.50) { op = 'tragen'; const x = X(), y = Y(); if (objAt(x, y)) { setTool('verschieben'); undoable(() => pickUp(x, y, 0)); if (moving) { rotManual = true; buildRot = ri(0, 3); const tx = X(), ty = Y(); undoable(() => dropAt(tx, ty, 0)); } } }
          else if (r < 0.58) { op = 'gruppe'; const x = X(), y = Y(), w = ri(1, 5), h = ri(1, 5); setTool('verschieben'); undoable(() => pickUpGroup(x, y, x + w, y + h)); if (moving) { if (moving.kind === 'group') rotateGroup(ri(0, 3)); else { rotManual = true; buildRot = ri(0, 3); } const tx = X(), ty = Y(); undoable(() => dropAt(tx, ty, 0)); } }
          else if (r < 0.64) { op = 'kopie'; const x = X(), y = Y(), w = ri(1, 5), h = ri(1, 5); setTool('look'); startCopy(x, y, x + w, y + h); if (moving && moving.kind === 'group') { rotateGroup(ri(0, 3)); const tx = X(), ty = Y(); undoable(() => dropGroup(tx, ty)); } }
          else if (r < 0.74) { op = '↶'; undo(); }
          else if (r < 0.80) { op = 'treppe'; stairNewWide = R() < 0.5; undoable(() => build('huegeltreppe', X(), Y())); }
          else if (r < 0.85) { op = 'rechteck'; const x = X(), y = Y(); plan = { kind: 'rect', tool: 'abriss', keepLand: R() < 0.5, a: { x, y }, b: { x: x + ri(0, 4), y: y + ri(0, 4) }, fixed: true }; undoable(() => runPlan()); plan = null; }
          else if (r < 0.90) { op = 'wachsen'; const st = [...state.tiles].filter(([, t]) => t.b === 'station' || t.b === 'hbf'); if (st.length) { const [k, t] = pick(st); if (t.b === 'station') undoable(() => stationLenSet(k, ri(2, 3))); else undoable(() => hbfResize(k, R() < 0.7 ? 1 : -1, R() < 0.5 ? -1 : 1)); } }
          else if (r < 0.95) { op = 'drehen'; const big = [...state.tiles].filter(([, t]) => ROTATABLE.has(t.b) && isBig(t.b)); if (big.length) { const [k] = pick(big); openInfo(...keyXY(k)); const btn = document.getElementById('p-rot'); if (btn && btn.onclick) btn.onclick(); closePanel(); } }
          else { op = 'rampe'; rampNewForm = pick(['a', 'b', 'c', 'd']); undoable(() => build('huegelrampe', X(), Y())); }
        } catch (e) { bad.push(op + ': ' + String(e).slice(0, 200)); }
        if (moving) cancelMove();
        setTool('look'); recalc();
        const cov = new Map();
        for (const [k, t] of state.tiles) {
          const [x, y] = keyXY(k), fp = footprint(t.b, x, y, t.rot || 0, t), lv = fp.map(([fx, fy]) => hillLevel(fx, fy));
          if (lv.some(v => v !== lv[0])) bad.push(op + ': über die Kante ' + t.b + ' ' + k);
          if (lv[0] > 0 && !hillOk(t.b)) bad.push(op + ': oben nicht erlaubt ' + t.b + ' ' + k);
          if (lv[0] > 0 && !hillCarryOk(t.b)) { up++; if (fp.length > 1) upBig++; }
          for (const [fx, fy] of fp) { const q = fx + ',' + fy; if (cov.has(q)) bad.push(op + ': doppelt ' + q); cov.set(q, 1); }
        }
      }
      return { bad, up, upBig };
    })()`);
    expect(r.bad).toEqual([]);
    expect(r.upBig).toBeGreaterThan(12);                                      // es standen wirklich große Gebäude oben (seit 24.10.2026 bringen Riesenrad und Sternwarte einen Garten mit – weniger Platz, darum weniger als früher 50)
  }, 30000);
});
