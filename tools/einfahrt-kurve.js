// Tunneleinfahrt direkt hinter einer Kurve im Tunnel (Nutzer 11.10.2026: „wenn ein Zugtunnel direkt vor einer Kurve unter der Erde eine Auffahrt
// hat, sieht man den Zug, der hochfährt, glitchen“): Tunnel (11,6…10) mit Knick bei 11,10, Einfahrt A (12–13,10) nach +x, Einfahrt B (11,4–5)
// nach −y, Schienen und Bahnhöfe an beiden Enden, Strom. Der Zug fährt wirklich; die Bilder rund um Einfahrt A kommen als Streifen.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/einfahrt-kurve.js').then(r => r.text()).then(t => (0, eval)(t)); await einKurve()   → tools/vorschau/einfahrt-kurve.png
(function einfahrtKurve() {
  const B = [12, 6], R = 16;
  function setup() {
    const [bx, by] = B;
    for (let y = by - R; y <= by + R; y++) for (let x = bx - R; x <= bx + R; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); state.roofs.delete(k); state.tunnels.delete(k);
    }
    state.edges.clear();
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    trains.length = 0; walkers.length = 0; hillWalkers.length = 0;
    for (let y = 6; y <= 10; y++) build('tunnel', 11, y, true);
    recalc();
    const errs = [], put = (b, x, y) => { const e = placeError(b, x, y); if (e) errs.push(b + ' ' + x + ',' + y + ': ' + e); else build(b, x, y, true); recalc(); };
    const [ax, ay] = einAnchor(12, 10); put('tunneleinfahrt', ax, ay);
    const [cx, cy] = einAnchor(11, 5); put('tunneleinfahrt', cx, cy);
    for (let x = 14; x <= 21; x++) build('schiene', x, 10, true);
    for (let y = 3; y >= -4; y--) build('schiene', 11, y, true);
    recalc();
    put('station', 20, 11); put('station', 12, -3);
    for (let i = 0; i < 6; i++) state.tiles.set((2 + i * 2) + ',' + 20, { b: 'windrad', lvl: 3 });
    recalc(); syncTrains.sig = null; syncMovers();
    return { errs, trains: trains.length, lines: T.rail.lines.length, ein: [ax, ay, cx, cy] };
  }
  async function run(zz = 4, Cs = 340, steps = 40000, dt = 1 / 120, max = 64, box = [10.4, 14.6, 8.4, 10.6], dir = 0) {
    const p = iso(12.3, 10); cam.x = p.x; cam.y = p.y; cam.z = zz;
    const frames = [], na = nightAt, gh = gameHour;
    nightAt = () => 0; gameHour = () => 12; night = 0;
    let now = performance.now();
    for (let i = 0; i < steps && frames.length < max; i++) {
      stepTrains(dt); now += dt * 1000;
      const near = trainCars().filter(c => c.px > box[0] && c.px < box[1] && c.py > box[2] && c.py < box[3] && (!dir || Math.sign(c.du + c.dv * 0.001) === dir));
      if (!near.length) continue;
      render(now);
      const c = document.createElement('canvas'); c.width = Cs; c.height = Cs;
      c.getContext('2d').drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
      frames.push({ c, txt: near.map(m => m.px.toFixed(2) + '/' + m.py.toFixed(2)).join(' ') });
    }
    nightAt = na; gameHour = gh;
    const cols = 8, rows = Math.ceil(frames.length / cols), sheet = document.createElement('canvas');
    sheet.width = cols * (Cs + 6); sheet.height = rows * (Cs + 26);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    frames.forEach((f, i) => {
      const X = (i % cols) * (Cs + 6), Y = Math.floor(i / cols) * (Cs + 26) + 20;
      sx.drawImage(f.c, X, Y); sx.font = '700 14px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(i + ': ' + f.txt, X + 4, Y - 5);
    });
    return sheet;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.einKurveSetup = setup;
  window.einKurve = async (name = 'einfahrt-kurve.png', ...a) => { const s = setup(); const sheet = await run(...a); return [s, await post(name, sheet)]; };
  return 'ok';
})();
