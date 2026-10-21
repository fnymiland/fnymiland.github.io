const { loadGame, game } = require('./helpers/load-game');

// Block 164 (AUFGABEN, Nutzer 21./22.10.2026): ✦ Perlmutt-Dachfarbe (Variante B) und vier funkelnde Glitzerwege (Silber, Gold, Perl,
// Regenbogen) als Meisterstücke der Kunstakademie
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e12; state.science = 1e9; state.stardust = 5000");
  game("for (let y = 0; y <= 14; y++) for (let x = 0; x <= 14; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.tiles.set('13,13', { b: 'kunst', lvl: 1 }); recalc()");
});
const GLITZER = ['silber', 'gold', 'perl', 'regen'];

describe('Perlmutt-Dach', () => {
  it('Meisterstück für 200 ✨, nicht im Album „Farben“, nie als Zufallsfarbe neuer Häuser', () => {
    const d = game('DESIGN_BY_ID["roof:" + ROOF_PEARL]');
    expect(d).toMatchObject({ name: 'Perlmutt', master: true, group: 'Dachfarben' });
    expect(game('designStardust(DESIGN_BY_ID["roof:" + ROOF_PEARL])')).toBe(200);
    expect(game("albumKeys(ALBUM.find(p => p.id === 'farben')).includes('roof:' + ROOF_PEARL)")).toBe(false);
    game('state.design = new Set(["roof:" + ROOF_PEARL])');
    for (let i = 0; i < 12; i++) game(`build('haus', ${1 + i}, 2, true)`);
    expect(game("[...state.tiles.values()].filter(t => t.b === 'haus').some(t => t.roof === ROOF_PEARL)")).toBe(false);
    expect(game("colorsOf('roof').some(([, i]) => i === ROOF_PEARL)")).toBe(true);   // gekauft: wählbar
  });
  it('Haus mit Perlmutt zeichnet einen Farbverlauf übers Dach (Tag, Nacht, weit) ohne Fehler', () => {
    game(`(() => { globalThis.__grad = 0; const keep = poly; poly = (pts, fill) => { if (fill && typeof fill === 'object') globalThis.__grad++; return keep(pts, fill); };   // Verlauf = Füllung als Objekt
      try { for (const look of [1, 2, 4, 5]) for (const [zz, n] of [[2, 0], [2, 1], [0.5, 0]]) { const nv = night; night = n; try { drawObject('haus', 400, 300, zz, 1e6, 5, 5, look, { b: 'haus', lvl: look, roof: ROOF_PEARL, wall: 1, rot: 0 }); } finally { night = nv; } } }
      finally { poly = keep; } })()`);
    expect(game('globalThis.__grad')).toBeGreaterThan(0);
  });
});

describe('Fachwerk (Fehler 22.10.: Balken ragten über die Traufe ins Dach)', () => {
  it('Fachwerkbalken werden vor dem Dach gezeichnet – der Dachüberstand deckt ihre Enden', () => {
    const order = game(`(() => { const log = [], kp = poly, kt = timber; poly = (pts, fill) => { if (fill && typeof fill === 'object') log.push('dach'); return kp(pts, fill); }; timber = (...a) => { log.push('balken'); return kt(...a); };
      try { drawObject('haus', 400, 300, 2, 1e6, 5, 5, 2, { b: 'haus', lvl: 2, roof: ROOF_PEARL, wall: 1, rot: 0 }); } finally { poly = kp; timber = kt; } return log; })()`);
    expect(order[0]).toBe('balken');
    expect(order).toContain('dach');
  });
});

describe('Glitzerwege', () => {
  it('vier Meisterstücke je 150 ✨, Muster „glitter“ mit eigener Glitzerfarbe, auf jeder Wegfarbe', () => {
    for (const t of GLITZER) {
      const d = game(`DESIGN_BY_ID['wegmuster:glitzer_${t}']`);
      expect(d, t).toMatchObject({ master: true, group: 'Wegmuster' });
      expect(game(`designStardust(DESIGN_BY_ID['wegmuster:glitzer_${t}'])`), t).toBe(150);
      expect(game(`WEG_MUSTER_BY['glitzer_${t}'].kind`)).toBe('glitter');
      const lk = game(`pathLook(wegStyleOf('glitzer_${t}', 'anthrazit'))`);
      expect(lk.pat[0]).toBe('glitter');
      expect(lk.cols).toEqual(game(`GLITTER['${t}'].cols`));
    }
  });
  it('gesperrt bis gekauft; dann baubar und gezeichnet (nah, weit, nachts) ohne Fehler', () => {
    game("state.design = new Set()");
    expect(game("wegMusterOk('glitzer_gold')")).toBe(false);
    expect(game("buyDesign('wegmuster:glitzer_gold')")).toBe(true);
    expect(game("wegMusterOk('glitzer_gold')")).toBe(true);
    game(`for (let x = 2; x <= 6; x++) { build('weg', x, 4, true); state.tiles.get(x + ',4').style = wegStyleOf('glitzer_gold', 'sand'); } recalc()`);
    for (const [zz, n] of [[2, 0], [2, 1], [0.4, 0]]) game(`(() => { const nv = night; night = ${n}; try { drawObject('weg', 400, 300, ${zz}, 1e6, 4, 4, 1, state.tiles.get('4,4')); } finally { night = nv; } })()`);
  });
  it('Funkel: je Glitzerfeld einige, jeder blitzt kurz auf (hell nur einen Augenblick), nur nah (Zoom ≥ 1)', () => {
    game("state.design = new Set(['wegmuster:glitzer_regen'])");
    game(`for (let x = 2; x <= 6; x++) { build('weg', x, 4, true); state.tiles.get(x + ',4').style = wegStyleOf('glitzer_regen', 'hell'); } build('weg', 2, 6, true); recalc()`);
    const s = game('glitterSpots()');
    expect(Object.keys(s).sort()).toEqual(['2,4', '3,4', '4,4', '5,4', '6,4']);       // der normale Weg 2,6 funkelt nicht
    expect(s['4,4'].length).toBeGreaterThanOrEqual(2);
    for (const p of s['4,4']) { expect(Math.abs(p.u) <= 0.5 && Math.abs(p.v) <= 0.5).toBe(true); expect(p.T).toBeGreaterThanOrEqual(2500); expect(p.T).toBeLessThanOrEqual(5000); }
    const a = game("Array.from({ length: 200 }, (_, i) => sparkleAmp(glitterSpots()['4,4'][0], i * 25))");
    expect(Math.max(...a)).toBeGreaterThan(0.9);                                    // blitzt einmal hell auf …
    expect(a.filter(v => v > 0.5).length).toBeLessThan(a.length * 0.25);             // … aber nur kurz
    expect(game('glitterOn(0.8)')).toBe(false);
    expect(game('glitterOn(1)')).toBe(true);
  });
});

describe('Dachglitzer auf Perlmutt (Nutzer 22.10.2026: „nur Perlmutt, wie bei den Wegen, nur Funkel“)', () => {
  const haus = (roof, extra = '') => game(`(() => { state.design.add('roof:' + ROOF_PEARL); build('haus', 4, 4, true); const t = state.tiles.get('4,4'); t.roof = ${roof}; t.lvl = 2; ${extra} recalc(); return true; })()`);
  it('Schalter nur bei Perlmutt; Glitzerfarben = gekaufte Glitzerwege, sonst Hinweis auf die Kunstakademie', () => {
    game('state.design = new Set()'); haus(0);
    game('openInfo(4, 4)');
    expect(game("!!document.querySelector('#panel [data-rglit]')")).toBe(false);
    game('closePanel()'); haus('ROOF_PEARL');
    game('openInfo(4, 4)');
    expect(game("!!document.querySelector('#panel [data-rglitmore]')")).toBe(true);   // noch kein Glitzer gekauft
    game("state.design.add('wegmuster:glitzer_gold'); state.design.add('wegmuster:glitzer_regen'); openInfo(4, 4)");
    expect(game("[...document.querySelectorAll('#panel [data-rglit]')].map(b => b.dataset.rglit)")).toEqual(['', 'gold', 'regen']);
    game("document.querySelector('#panel [data-rglit=\"regen\"]').click()");
    expect(game("state.tiles.get('4,4').rglitter")).toBe('regen');
    const d = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(d.tiles.get('4,4').rglitter).toBe('regen');
    game("document.querySelector('#panel [data-rglit=\"\"]').click()");
    expect(game("state.tiles.get('4,4').rglitter")).toBeUndefined();
    game('closePanel()');
  });
  it('Funkel liegen auf der vorderen Dachhälfte zwischen Traufe und First; ohne Perlmutt keine', () => {
    haus('ROOF_PEARL', "t.rglitter = 'silber';");
    game("drawObject('haus', 400, 300, 1, 1e6, 4, 4, 2, state.tiles.get('4,4'))");
    const sp = game("roofSparkSpots(state.tiles.get('4,4'), 4, 4)"), R = game("[...ROOF_GEO.get(state.tiles.get('4,4')).values()][0]");
    expect(sp.length).toBeGreaterThanOrEqual(3);
    for (const s of sp) { expect(s.up).toBeGreaterThanOrEqual(R.top - 1e-9); expect(s.up).toBeLessThanOrEqual(R.peakUp + 1e-9); expect(s.a - R.a + s.b - R.b).toBeGreaterThanOrEqual(-1e-9); }
    game(`(() => { globalThis.__sp = 0; const k = drawSpark; drawSpark = (...a) => { globalThis.__sp++; return k(...a); };
      try { for (let i = 0; i < 80; i++) roofSparks(state.tiles.get('4,4'), { x: 400, y: 300 }, 1.5, i * 70, 4, 4); } finally { drawSpark = k; } })()`);
    expect(game('globalThis.__sp')).toBeGreaterThan(0);
    game("state.tiles.get('4,4').roof = 0; globalThis.__sp = 0");
    game(`(() => { const k = drawSpark; drawSpark = (...a) => { globalThis.__sp++; return k(...a); }; try { for (let i = 0; i < 80; i++) roofSparks(state.tiles.get('4,4'), { x: 400, y: 300 }, 1.5, i * 70, 4, 4); } finally { drawSpark = k; } })()`);
    expect(game('globalThis.__sp')).toBe(0);
  });
});
