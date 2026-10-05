const { loadGame, game } = require('./helpers/load-game');

// Block 86: Wilmerhecke – kleine runde Büsche dicht an dicht, gleich frei, auch mit Blüten oder Lichterkette
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game("closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; state.money = 1e6");
  game("for (let y = 2; y <= 20; y++) for (let x = 2; x <= 20; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } state.edges.clear(); recalc()");
});
const IDS = ['wilmer', 'wilmer_bluete', 'wilmer_licht'];

describe('Wilmerhecke (Block 86)', () => {
  it('drei Stile bei den Hecken, alle gleich frei, mit Lichterkette zählt als Licht', () => {
    expect(game("STYLES.hecke.filter(st => st.id.startsWith('wilmer')).map(st => st.name)")).toEqual(['Wilmerhecke', 'Wilmerhecke mit Blüten', 'Wilmerhecke mit Lichterkette']);
    for (const id of IDS) expect(game(`styleOk(STYLES.hecke.find(st => st.id === '${id}'))`), id).toBe(true);
    expect(game("EDGE_LIT.has('hecke:wilmer_licht')")).toBe(true);
  });
  it('lässt sich ziehen und zeichnet als Reihe von Büschen – gerade, Ecke, Durchgang, freies Ende, Tag und Nacht', () => {
    for (const id of IDS) {
      game(`state.edges.clear(); chosenStyle.hecke = '${id}'; for (let i = 0; i < 4; i++) buildEdge('hecke', 'a' + (6 + i) + ',6'); for (let i = 0; i < 4; i++) buildEdge('hecke', 'b6,' + (6 + i))`);
      game("for (let y = 4; y <= 8; y++) state.tiles.set('8,' + y, { b: 'weg', lvl: 1, style: 'sand' }); recalc()");    // Durchgang
      expect(game(`state.edges.get('a7,6').style`)).toBe(id);
      for (const n of [0, 0.8]) {
        const bushes = game(`(() => { night = ${n}; let k = 0; const o = wilmerBush; wilmerBush = function (...a) { k++; return o.apply(this, a); };
          try { for (const key of state.edges.keys()) drawEdge(key, state.edges.get(key), 1.4, 1000); for (const rc of [roundCorner(6, 6)].filter(Boolean)) drawArc(rc, EDGE_LOOK.hecke['${id}'], 1.4); } finally { wilmerBush = o; night = 0; } return k; })()`);
        expect(bushes, id).toBeGreaterThan(8 * 3);                                       // gut drei Büsche je Feldkante
      }
    }
  });
  it('jeder Busch ist genau der Deko-Busch (gleiche Zeichnung, gleiche Größe)', () => {
    const r = game("(() => { const seen = []; const o = drawObject; drawObject = (b, ...a) => { seen.push(b); }; const sc = g.scale; let f = null; g.scale = (x) => { f = x; }; try { wilmerBush([5, 5], EDGE_LOOK.hecke.wilmer, 1); } finally { drawObject = o; delete g.scale; } return [seen, f]; })()");
    expect(r[0]).toEqual(['busch']);
    expect(r[1]).toBeCloseTo(game("decoScale('busch') * 0.9"));                     // genau wie eine aufgestellte Deko (drawSmallOne)
  });
  it('drei Stücke hintereinander: keine Lücke am Übergang, alle Büsche im gleichen Abstand', () => {
    for (const id of IDS) {
      const xs = game(`(() => { state.edges.clear(); chosenStyle.hecke = '${id}'; for (let i = 0; i < 3; i++) buildEdge('hecke', 'a' + (6 + i) + ',6'); recalc();
        const pts = []; const o = wilmerBush; wilmerBush = (m) => { pts.push(+m[0].toFixed(3)); };
        try { for (const key of state.edges.keys()) drawEdge(key, state.edges.get(key), 1.4, 1000); } finally { wilmerBush = o; } return pts.sort((a, b) => a - b); })()`);
      const inner = xs.filter((x, i) => i > 0 && i < xs.length - 1);                   // ohne die Endbüsche
      const gaps = inner.slice(1).map((x, i) => +(x - inner[i]).toFixed(3));
      expect(new Set(gaps).size, `${id}: ${xs.join(' ')}`).toBe(1);
    }
  });
  it('Ecke bleibt eckig (kein heller Bogen darunter), am freien Ende kein zusätzlicher Busch', () => {
    game("state.edges.clear(); chosenStyle.hecke = 'wilmer'; buildEdge('hecke', 'a6,6'); buildEdge('hecke', 'b6,6'); recalc()");
    expect(game('roundCorner(6, 6)')).toBe(null);
    const n = game("(() => { let k = 0; const o = wilmerBush; wilmerBush = () => { k++; }; try { for (const key of state.edges.keys()) drawEdge(key, state.edges.get(key), 1.4, 1000); } finally { wilmerBush = o; } return k; })()");
    expect(n).toBe(2 * game('BUSH_PER'));                                              // genau die Reihe, nichts obendrauf
  });
});
