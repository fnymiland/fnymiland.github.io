const { loadGame, game } = require('./helpers/load-game');

// Block 149: Messlauf (☰ → Grafik) – fährt Ruhe/Ziehen/Zoomen ab, misst Bildabstände, zeigt Ergebnis zum Kopieren, Kamera zurück
beforeAll(() => loadGame());
describe('Messlauf (Block 149)', () => {
  it('läuft alle Schritte ab, zählt Ruckler, stellt die Kamera zurück und zeigt die Tabelle', () => {
    game('startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; resize(); cam.x = 123; cam.y = 45; cam.z = 0.9');
    game('showMenu()');
    expect(game("!!document.getElementById('m-bench')")).toBe(true);
    game("document.getElementById('m-bench').click()");
    expect(game('!!BENCH && !$("bench-badge").hidden')).toBe(true);
    // Bilder alle 16,7 ms, in „Zoom 0.8 ziehen“ ein Bild mit 120 ms
    const total = game('BENCH_PLAN.reduce((a, s) => a + s.ms + BENCH_SETTLE, 0)');
    game(`(() => { let now = BENCH.at; const zs = []; while (BENCH && now < BENCH.at + ${total} + 100) {
      now += (BENCH.step === 3 && !globalThis.__j && BENCH.rec ? (globalThis.__j = 1, 120) : 16.7);
      benchTick(now); if (BENCH) { zs.push(cam.z); benchAfter(now, 2); } }
      globalThis.__zs = [Math.min(...zs), Math.max(...zs)]; })()`);
    expect(game('BENCH')).toBe(null);
    expect(game('[cam.x, cam.y, cam.z]')).toEqual([123, 45, 0.9]);
    expect(game('globalThis.__zs[0]')).toBeCloseTo(0.45, 1);
    expect(game('globalThis.__zs[1]')).toBeGreaterThan(2);
    const out = game("document.querySelector('.bench-out').textContent");
    expect(out).toMatch(/Fnymiland Messlauf/);
    expect(out).toMatch(/Zoom 0.8 ziehen .*Ruckler  1/);
    expect(out).toMatch(/Ruckler gesamt: 1/);
    expect(game('$("bench-badge").hidden')).toBe(true);
  });
});
