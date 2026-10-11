const { loadGame, game } = require('./helpers/load-game');

// Nutzer 11.10.2026: „wenn ein Zugtunnel direkt vor einer Kurve unter der Erde eine Auffahrt hat, sieht man den Zug, der hochfährt, glitchen“ –
// im Kurvenfeld direkt hinter der Tunneleinfahrt stand der Wagen quer zu ihr, trainTunnelCut gab null zurück, und er wurde oben auf der Wiese
// gezeichnet. Echte Welt: Tunnel 11,6…10 mit Knick bei 11,10, Einfahrt 12–13,10 (nach +x) und 11,4–5 (nach −y), Schienen, zwei Bahnhöfe
beforeAll(() => loadGame());
it('Wagen im Tunnel (auch in der Kurve direkt hinter der Einfahrt) sind nie oben zu sehen – eine ganze Fahrt hin und zurück', () => {
  game('startNew()'); game("closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true");
  game("state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const r of Object.keys(RES)) state.res[r] = 1e6");
  game("for (let y = -8; y <= 24; y++) for (let x = -4; x <= 28; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); } for (const [k, t] of [...state.tiles]) if (t.b === 'rathaus') state.tiles.delete(k); state.edges.clear(); state.tunnels.clear(); state.hills.clear(); trains.length = 0; recalc()");
  game("for (let y = 6; y <= 10; y++) build('tunnel', 11, y, true); recalc()");
  game("(() => { const a = einAnchor(12, 10); build('tunneleinfahrt', a[0], a[1], true); recalc(); const b = einAnchor(11, 5); build('tunneleinfahrt', b[0], b[1], true); recalc(); })()");
  game("for (let x = 14; x <= 21; x++) build('schiene', x, 10, true); for (let y = 3; y >= -4; y--) build('schiene', 11, y, true); recalc()");
  game("build('station', 20, 11, true); build('station', 12, -3, true); for (let i = 0; i < 6; i++) state.tiles.set((2 + i * 2) + ',20', { b: 'windrad', lvl: 3 }); recalc(); syncTrains.sig = null; syncMovers()");
  expect(game('trains.length')).toBe(1);
  const r = game(`(() => { let bad = [], inCurve = 0, seen = new Set();
    for (let i = 0; i < 60000; i++) {
      stepTrains(1 / 60);
      for (const m of trainCars()) {
        const rx = Math.round(m.px), ry = Math.round(m.py);
        if (!tunnelAt(rx, ry) || einAt(rx, ry)) continue;
        const tc = trainTunnelCut(m);
        if (rx === 11 && ry === 10) { inCurve++; seen.add(Math.sign(m.du) + ',' + Math.sign(m.dv)); }
        if (tc === null) bad.push(m.px.toFixed(2) + '/' + m.py.toFixed(2));
      }
    }
    return { bad: bad.slice(0, 5), n: bad.length, inCurve, dirs: [...seen] }; })()`);
  expect(r.inCurve).toBeGreaterThan(20);                                    // fuhr wirklich durch die Kurve
  expect(r.n).toBe(0);
});
