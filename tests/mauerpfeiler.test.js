const { loadGame, game } = require('./helpers/load-game');

// Block 87c: Mauerpfeiler an Enden und Toren gleich und schlanker; Torpfeiler auf den Feldecken, anschließende Mauern hören dort auf
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); state.money = 1e6; state.res.quader = 999; for (const d of DESIGN) state.design.add(d.id)");
  game("for (let y = 2; y <= 20; y++) for (let x = 2; x <= 20; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc()");
});
const prisms = k => game(`(() => { const out = []; const o = edgePrism; edgePrism = (p, q, ...a) => { out.push([p, q]); return o(p, q, ...a); };
  try { drawEdge('${k}', state.edges.get('${k}'), 1.4, 0); } finally { edgePrism = o; } return out; })()`);

describe('Mauerpfeiler (Block 87c)', () => {
  it('Pfeiler höchstens 1,25 × so breit wie die Mauer, nicht viel höher', () => {
    for (const st of game("Object.keys(EDGE_LOOK.mauer)")) {
      const look = game(`EDGE_LOOK.mauer['${st}']`);
      expect(game(`wallPillarR(EDGE_LOOK.mauer['${st}'])`)).toBeLessThanOrEqual(look.w * 1.25 + 1e-9);
    }
    expect(game('CAP_UP')).toBeLessThanOrEqual(2.5);
  });
  it('Mauer, die um die Ecke an einen Durchgang stößt, hört am Pfeiler auf (läuft nicht hinein)', () => {
    game("chosenStyle.mauer = 'backstein'; buildEdge('mauer', 'a6,6'); buildEdge('mauer', 'b6,6'); buildEdge('mauer', 'b6,5'); setGate('a6,6', true); recalc()");
    const R = game("wallPillarR(EDGE_LOOK.mauer.backstein)");
    const [[p]] = prisms('b6,6');                                                        // beginnt am Eckpunkt (5,5|5,5) des Tors
    expect(p[1]).toBeCloseTo(5.5 + R);
    const [[, q]] = prisms('b6,5');                                                      // endet dort
    expect(q[1]).toBeCloseTo(5.5 - R);
    expect(game("gateT('mauer', EDGE_LOOK.mauer.backstein)")).toBe(0);                  // Torpfeiler auf den Feldecken
  });
  it('freies Ende hat wieder einen (schlanken) Pfeiler', () => {
    game("chosenStyle.mauer = 'backstein'; buildEdge('mauer', 'a6,6'); recalc()");
    const n = game("(() => { let n = 0; const o = wallPillar; wallPillar = (...a) => { n++; return o(...a); }; try { drawEdge('a6,6', state.edges.get('a6,6'), 1.4, 0); } finally { wallPillar = o; } return n; })()");
    expect(n).toBe(2);
  });
});
