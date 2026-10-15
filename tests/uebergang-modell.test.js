const { loadGame, game } = require('./helpers/load-game');

// 160c F1b (Entwurf F0 abgenommen 15.10.2026): die Fußgängerbrücke am Bahnübergang im neuen Modell – Form aus Block 148, Bekleidung aus den
// Bausteinen der Wegbrücken (ubArch). Alte Stände nach der Zuordnungstabelle (PLAN-160c §1.5): true/holz → Holz, stein → Stein (eigenes Deck),
// weg → Holz mit Belag, kristall → Kristall mit Licht ohne Aufpreis (leuchtet ohne Strom, wie bisher). Neues Format: footPaid (Rückfall) + brm + brp
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); setSeeThrough(false)");
  game("for (let y = 0; y <= 20; y++) for (let x = 0; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); state.hills.delete(k); } state.edges.clear(); walkers.length = 0; critters.length = 0; if (Array.isArray(trains)) trains.length = 0");
});
// Übergang bei 8,8 (Schiene längs ax), extra: Felder der Kachel
const bau = (extra, ax = 0) => game(`(() => {
  const dx = ${ax} ? 0 : 1, dy = ${ax} ? 1 : 0;
  for (let j = -4; j <= 4; j++) if (j) state.tiles.set((8 + dx * j) + ',' + (8 + dy * j), { b: 'schiene', lvl: 1, form: 0 });
  for (let j = -3; j <= 3; j++) if (j) state.tiles.set((8 + dy * j) + ',' + (8 + dx * j), { b: 'weg', lvl: 1, style: 'fisch' });
  state.tiles.set('8,8', { b: 'schiene', lvl: 1, form: 0, cross: true, foot: true, style: 'fisch', ...${JSON.stringify(extra)} });
  recalc(); })()`);
const neu = (mat, more = {}) => game(`(() => { const t = { footPaid: brFallback('uebergang', '${mat}').footPaid, brm: '${mat}', ...${JSON.stringify(more)} };
  t.brp = { ...brPrice(brLook({ ...t, brp: { money: 0, k: brSig(t, 'uebergang') } }, 'uebergang'), 'uebergang'), k: brSig(t, 'uebergang') }; return t; })()`);
// ein Bild: welche Bausteine (bkPaintLage: Lage, Material, Belag) und ob der Belag gemalt wurde
const bild = (night = 0) => game(`(() => {
  const out = { lagen: [], belag: 0, lampen: [] }, bp = bkPaintLage, ub = ubBelag, bl = bkLamps, na = nightAt;
  bkPaintLage = (l, P, z, art, n, t0, t1, weg, o) => { out.lagen.push(l + ' ' + art + (weg ? ' belag' : '')); return bp(l, P, z, art, n, t0, t1, weg, o); };
  ubBelag = (...a) => { out.belag++; return ub(...a); };
  bkLamps = (l, P, z, art, fam, n, t0, t1, o) => { out.lampen.push(art + ' ' + o.licht + (o.dark ? ' dunkel' : '')); return bl(l, P, z, art, fam, n, t0, t1, o); };
  nightAt = () => ${night};
  try { cam = state.cam; cam.z = 2; const p = iso(8, 8); cam.x = p.x; cam.y = p.y - 30; resetDrawCaches(); spriteNoBudget = true; spriteForce = false; render(1e6); }
  finally { bkPaintLage = bp; ubBelag = ub; bkLamps = bl; nightAt = na; spriteNoBudget = false; spriteForce = null; }
  out.lagen = [...new Set(out.lagen)]; out.lampen = [...new Set(out.lampen)]; return out; })()`);

describe('Fußgängerbrücke am Übergang im neuen Modell (160c F1b)', () => {
  it('alte Stände: true/holz → Holz, stein → Stein mit eigenem Deck, weg → Holz mit Belag, kristall → Kristall mit Licht ohne Aufpreis', () => {
    for (const [fp, mat, belag] of [[true, 'holz', false], ['holz', 'holz', false], ['stein', 'stein', false], ['weg', 'holz', true], ['kristall', 'kristall', false]]) {
      bau({ footPaid: fp });
      const L = game("brLook(state.tiles.get('8,8'), 'uebergang')");
      expect(L.mat, String(fp)).toBe(mat);
      const b = bild();
      expect(b.lagen.every(l => l.startsWith(l.split(' ')[0] + ' ' + mat)), String(fp) + ': ' + b.lagen.join(', ')).toBe(true);
      expect(b.lagen.some(l => l.endsWith('belag')), String(fp)).toBe(belag);
      expect(b.belag > 0, String(fp)).toBe(belag);
    }
  });
  it('neues Format: Metall (footPaid holz + brm stahl + brp) zeichnet Metall; beide Achsen, alle Materialien ohne Fehler', () => {
    for (const mat of ['holz', 'stein', 'stahl', 'kristall']) for (const ax of [0, 1]) {
      bau(neu(mat), ax);
      expect(game("brLook(state.tiles.get('8,8'), 'uebergang').mat")).toBe(mat);
      const b = bild();
      expect(b.lagen.length, mat + ax).toBeGreaterThan(2);
      expect(b.lagen.every(l => l.includes(' ' + mat)), mat + ax).toBe(true);
    }
    expect(game("state.tiles.get('8,8').footPaid")).toBe('kristall');
    bau(neu('stahl'));
    expect(game("state.tiles.get('8,8').footPaid")).toBe('holz');            // ältere Fassungen lesen Holz (nie ein neuer Wert in footPaid)
  });
  it('Durchfahrt: der Bogen über dem Gleis liegt über den Wagen (|b| ≤ 0,19 nie unter 16), unter dem Deck, und landet bei ±0,46', () => {
    expect(game('ubRi(0.19)')).toBeGreaterThanOrEqual(16);
    expect(game('ubRi(-0.19)')).toBeGreaterThanOrEqual(16);
    expect(game('[0, 0.1, 0.2, 0.3, 0.4, 0.45].every(b => ubRi(b) <= archH(b) - 2)')).toBe(true);
    expect(game('[ubRi(0.46), ubRi(-0.5), ubRi(0.9)]')).toEqual([0, 0, 0]);
    expect(game('[ARCH_H, ARCH_CLEAR, ARCH_SPAN, archH(0), Math.round(archH(0.9) * 1e9)]')).toEqual([22, 16, 0.9, 22, 0]);   // Form aus Block 148 unverändert
  });
  it('Licht: der alte Kristall-Übergang leuchtet nachts ohne Strom; neues Licht hängt am Strom (U + Feld), aus: nichts', () => {
    bau({ footPaid: 'kristall' });
    expect(bild('NIGHT_MAX').lampen).toEqual(['kristall an']);
    expect(game("[...T.rail.power.dark].filter(k => k[0] === 'U')")).toEqual([]);
    bau(neu('holz', { brl: 'an' }));
    game("T.rail.power.dark.add('U8,8')");
    expect(bild('NIGHT_MAX').lampen).toEqual(['holz an dunkel']);
    game("T.rail.power.dark.delete('U8,8')");
    expect(bild('NIGHT_MAX').lampen).toEqual(['holz an']);
    bau(neu('holz', { brl: 'aus' }));
    expect(bild('NIGHT_MAX').lampen).toEqual(['holz aus']);
    bau(neu('holz'));
    expect(bild('NIGHT_MAX').lampen).toEqual([]);
  });
  it("Strom: je Brücke mit Licht an zwei Laternen 'U' + Feld (nach dem übrigen Brückenlicht); ohne Licht oder alter Kristall: keine", () => {
    const uses = () => game(`(() => { const ks = []; for (const [k, t] of state.tiles) if (isCrossing(t) && t.foot) { const L = brLook(t, 'uebergang'); if (L.licht === 'an' && !L.lichtGratis) ks.push(k); } return ks; })()`);
    bau({ footPaid: 'kristall' });
    expect(uses()).toEqual([]);
    bau(neu('stein', { brl: 'an' }));
    expect(uses()).toEqual(['8,8']);
    const r = game("(() => { const p = T.rail.power; return { city: !!p.city, dark: p.dark.has('U8,8') }; })()");
    if (!r.city) expect(r.dark).toBe(false);
  });
  it('Leistung: gleichartige Striche gebündelt (Holz: Pfosten, Bretter); hinter dem Bündler gilt die Leinwand weiter als live (Nachtlicht, Gegenprobe)', () => {
    const r = game(`(() => { const t = { footPaid: 'holz' }, L = brLook(t, 'uebergang'), P = (a, b, up = 0) => [a * 10 + b * 10, a * 5 - b * 5 - up];
      const g0 = g; g = ctx; let live = null; const bl = bkLamps; bkLamps = (...a) => { live = isLive(); return bl(...a); };
      globalThis.__ctxCount = {};
      try { drawArch(P, 1.2, -0.9, 0, { ...L, licht: 'an' }, 0, 0, [1, 0], [0, 1], t); drawArch(P, 1.2, 0, 0.9, { ...L, licht: 'an' }, 0, 0, [1, 0], [0, 1], t); }
      finally { bkLamps = bl; g = g0; }
      const c = globalThis.__ctxCount; globalThis.__ctxCount = null; return { stroke: c.stroke || 0, live, wrap: BR_WRAP }; })()`);
    expect(r.stroke).toBeLessThanOrEqual(24);                                  // ungebündelt 45 (je Pfosten ein Strich)
    expect(r.live).toBe(true);
    expect(r.wrap).toBe(null);                                                // danach wieder die echte Leinwand
  });
});
