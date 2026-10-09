const { loadGame, game } = require('./helpers/load-game');

// Block 138d: Verdeckung auf dem Dach (Nutzer: „glitchen durch die Treppe“, „alle Drehungen ansehen“, „testen“). Die Testumgebung
// kann keine Bilder vergleichen – geprüft wird die Reihenfolge, in der gezeichnet wird: daran lagen alle bisherigen Fehler.
beforeAll(() => loadGame());
const rect = (x0, x1, y0, y1) => { const out = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]); return out; };
// Szene: 6 × 6 Steinarkaden mit Balustrade, Dreifachtreppe in Drehung rot, Figuren auf mehreren Stufen und oben; ein Bild zeichnen
// und protokollieren: Dachbild je Feld (paintRoof), Figur (drawWalker), Nachzeichnen von Stufen (dtSteps mit only), vordere Brüstung
function scene(rot) {
  game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 9999');
  game("for (let y = -2; y <= 14; y++) for (let x = -2; x <= 14; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } state.edges.clear(); state.roofs.clear(); state.design.add('dach:form:arkaden'); recalc()");
  game(`state.paintNew.dach = { form: 3 }; for (const [x, y] of ${JSON.stringify(rect(3, 8, 3, 8))}) build('dach', x, y, true); state.paintNew.dach = {}; for (const r of state.roofs.values()) r.par = 2`);
  game(`rotManual = true; buildRot = ${rot}; for (let i = 0; i < 3; i++) { const [x, y] = ${rot} & 1 ? [5, 4 + i] : [4 + i, 5]; build('dachtreppe', x, y); } rotManual = false; recalc()`);
  game(`(() => { roofers.length = 0; const st = roofStairs(); st.forEach((s, j) => [-0.6, 0, 0.5].forEach((d, i) => roofers.push({ roofer: true, stair: s, st: 'up', d, px: s.mu + s.Du * d, py: s.mv + s.Dv * d, up: dtHeight(d), wait: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 99, id: 's' + j + i })));
    roofers.push({ roofer: true, stair: st[0], st: 'roof', px: 7.3, py: 7.3, up: ROOF_H, wait: 0, fa: 22, fb: 22, ta: 22, tb: 22, t: 0, kind: 0, fur: '#fff', shirt: '#f00', speed: 0.4, life: 99, id: 'oben' }); })()`);
  return game(`(() => {
    const log = [], pr = paintRoof, dw = drawWalker, ds = dtSteps, rf = drawRoofFront, sy = syncRoofers, sr = stepRoofers;
    syncRoofers = () => {}; stepRoofers = () => {}; roofSprites.clear();
    paintRoof = (P, A, x, y, ...a) => { log.push('roof ' + x + ',' + y); return pr(P, A, x, y, ...a); };
    drawWalker = (w, ...a) => { log.push('fig ' + w.id); return dw(w, ...a); };
    dtSteps = (rot, P, q, jM, jP, only, out) => { if (only) log.push('stufen-nach'); return ds(rot, P, q, jM, jP, only, out); };
    drawRoofFront = (x, y, ...a) => { log.push('front ' + x + ',' + y); return rf(x, y, ...a); };
    try { cam = state.cam; cam.z = 2.5; const p = iso(6, 6); cam.x = p.x; cam.y = p.y; render(1e6); }
    finally { paintRoof = pr; drawWalker = dw; dtSteps = ds; drawRoofFront = rf; syncRoofers = sy; stepRoofers = sr; }
    return log;
  })()`);
}

describe('Verdeckung auf dem Dach (Block 138d)', () => {
  for (const rot of [0, 1, 2, 3]) {
    it(`Drehung ${rot}: Leute auf der Treppe nach allen Dachbildern der Öffnung, von hinten nach vorn, danach Stufen/Brüstung davor`, () => {
      const log = scene(rot);
      const holeTiles = game("[...new Set(roofStairs().flatMap(s => { const t = state.tiles.get(s.k); return footprint('dachtreppe', ...keyXY(s.k), t.rot); }).map(p => p.join(',')))]");
      const lastRoof = Math.max(...holeTiles.map(k => log.lastIndexOf('roof ' + k)));
      const stairFigs = log.map((e, i) => [e, i]).filter(([e]) => /^fig s/.test(e));
      expect(stairFigs.length).toBe(9);
      for (const [, i] of stairFigs) expect(i).toBeGreaterThan(lastRoof);         // keine Stufe eines späteren Felds über einer Figur
      const order = stairFigs.map(([e]) => e.slice(4)), pos = game('Object.fromEntries(roofers.map(w => [w.id, w.px + w.py]))');
      const sorted = [...order].sort((a, b) => pos[a] - pos[b]);
      expect(order).toEqual(sorted);                                                // von hinten nach vorn
      const ascends = game('roofStairs()[0].Du + roofStairs()[0].Dv > 0');
      for (const [, i] of stairFigs) {                                              // direkt nach jeder Figur: was davor liegt
        const next = log.slice(i + 1, i + 4);
        if (ascends) expect(next).toContain('stufen-nach');
        expect(log.slice(i + 1).some(e => e.startsWith('front '))).toBe(true);
      }
      // oben: nach dem eigenen Dachbild, vor der vorderen Brüstung seines Felds
      const top = log.indexOf('fig oben');
      expect(top).toBeGreaterThan(log.lastIndexOf('roof 7,7'));
      expect(log.indexOf('front 7,7', top)).toBeGreaterThan(top);
    });
  }
});
