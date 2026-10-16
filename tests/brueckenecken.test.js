const { loadGame, game } = require('./helpers/load-game');

// Brückenecken (Nutzer 16.10.2026: „Die Ecken sehen überhaupt nicht gut aus“): Gleisbrücke um die Ecke = Viertelring um die Feldecke (Deck folgt
// der Gleiskurve), Geländer laufen ohne Knick bis an die Feldkante, wo die Geraden weitermachen; T/X mit Innenrundungen, ein Rand ohne Arm am
// Stück; Doppelgleis (Brücke schräg daneben): Deck bis in die Ecke, dort kein Geländer. Prüfbilder: tools/ecken-pruefung.js
beforeAll(() => loadGame());
const podest = (arms, voll) => game(`(() => { const Q = gbPodest(${JSON.stringify(arms)}${voll ? ', ' + JSON.stringify(voll) : ''}); return { rund: Q.rund, ring: Q.ring, zuege: Q.zuege.map(Z => ({ front: Z.front, a: Z.pts[0], b: Z.pts[Z.pts.length - 1], n: Z.pts.length })) }; })()`);
const nah = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6;
const W = 0.4;

describe('Gleisbrücke: Eckpodest (16.10.2026)', () => {
  for (const [name, arms] of [['O+S', [[1, 0], [0, 1]]], ['W+S', [[-1, 0], [0, 1]]], ['O+N', [[1, 0], [0, -1]]], ['W+N', [[-1, 0], [0, -1]]]]) {
    it(`Ecke ${name}: rund, jeder Ringpunkt im Abstand 0,5 ± W von der Feldecke, Züge enden an den Armenden der Feldkante`, () => {
      const Q = podest(arms), C = [(arms[0][0] + arms[1][0]) / 2, (arms[0][1] + arms[1][1]) / 2];
      expect(Q.rund).toBe(true);
      for (const p of Q.ring) { const r = Math.hypot(p[0] - C[0], p[1] - C[1]); expect(Math.min(Math.abs(r - (0.5 + W)), Math.abs(r - (0.5 - W)))).toBeLessThan(1e-9); }
      const ends = arms.flatMap(([dx, dy]) => [-1, 1].map(s => dx ? [dx * 0.5, s * W] : [s * W, dy * 0.5]));
      for (const Z of Q.zuege) for (const p of [Z.a, Z.b]) {
        const anKante = Math.abs(Math.abs(p[0]) - 0.5) < 1e-9 || Math.abs(Math.abs(p[1]) - 0.5) < 1e-9;
        if (anKante) expect(ends.some(e => nah(e, p)), JSON.stringify(p)).toBe(true);   // an der Feldkante nur genau dort, wo die Gerade weitermacht
      }
    });
  }
  it('T: Rand ohne Arm am Stück (ein Zug von Kante zu Kante), zwei Innenrundungen', () => {
    const Q = podest([[1, 0], [-1, 0], [0, 1]]);
    const rand = Q.zuege.filter(Z => Math.abs(Z.a[1] + W) < 1e-9 && Math.abs(Z.b[1] + W) < 1e-9);
    expect(rand.length).toBe(1);
    expect(Math.abs(rand[0].a[0] - rand[0].b[0])).toBeCloseTo(1, 9);
    expect(Q.zuege.filter(Z => Z.n > 2).length).toBeGreaterThanOrEqual(2);   // Rundungen haben Stützpunkte (eine quer zum Blick: vorn und hinten getrennt)
  });
  it('Doppelgleis: Ecke zum Brückenfeld schräg daneben voll, ohne Geländer dort', () => {
    const Q = podest([[1, 0], [-1, 0], [0, 1]], [[1, 1], [-1, 1]]);
    expect(Q.ring.some(p => nah(p, [0.5, 0.5])) && Q.ring.some(p => nah(p, [-0.5, 0.5]))).toBe(true);
    expect(Q.zuege.every(Z => Math.abs(Z.a[1] + W) < 1e-9 && Math.abs(Z.b[1] + W) < 1e-9)).toBe(true);   // nur der Rand gegenüber
  });
});
