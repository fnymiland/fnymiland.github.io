// Bergportal in Fahrt (Nutzer 11.10.2026: „wenn der Zug aus dem Tunnel fährt, glitcht er ganz kurz, er blitzt leicht auf“): echte Welt –
// Anhöhe, Tunnel quer durch, Bergportal in der rechten Wand (+x) und in der linken hinteren (−x), Schienen und Bahnhöfe auf beiden Seiten,
// Strom. Der Zug fährt wirklich (stepTrains), jedes Bild wird gezeichnet; die Bilder rund um die Wand kommen als Streifen in den Bild-Sammler.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/bergportal-fahrt.js').then(r => r.text()).then(t => (0, eval)(t)); await bpFahrt()   → tools/vorschau/bergportal-fahrt.png
(function bergportalFahrt() {
  const B = [12, 11], R = 16;
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
    for (let y = 9; y <= 13; y++) for (let x = 10; x <= 14; x++) build('anhoehe', x, y, true);
    for (let x = 11; x <= 13; x++) build('tunnel', x, 11, true);
    recalc();
    const errs = [];
    const put = (b, x, y, rot) => { if (rot != null) { buildRot = rot; rotManual = true; } const e = placeError(b, x, y); if (e) errs.push(b + ' ' + x + ',' + y + ': ' + e); else build(b, x, y, true); rotManual = false; recalc(); };
    for (let x = 15; x <= 23; x++) build('schiene', x, 11, true);
    for (let x = 1; x <= 9; x++) build('schiene', x, 11, true);
    recalc();
    put('bergportal', 14, 11); put('bergportal', 10, 11);
    put('station', 20, 12); put('station', 4, 12);
    for (let i = 0; i < 6; i++) state.tiles.set((2 + i * 2) + ',' + 24, { b: 'windrad', lvl: 3 });
    recalc(); syncTrains.sig = null; syncMovers();
    return { errs, trains: trains.length, lines: T.rail.lines.length };
  }
  // Fahren, Bilder rund um die rechte Wand (x = 14,5) sammeln: je Bild ein Ausschnitt um das Portal
  async function run(zz = 4, Cs = 300, steps = 4000, dt = 1 / 60, max = 48, dir = 1, x0 = 13.7, x1 = 16.3) {
    const p = iso(14.6, 11); cam.x = p.x; cam.y = p.y - 20; cam.z = zz;
    const frames = [], na = nightAt, gh = gameHour;
    nightAt = () => 0; gameHour = () => 12; night = 0;                   // Mittag (vergleichbar)
    let now = performance.now();
    for (let i = 0; i < steps && frames.length < max; i++) {
      stepTrains(dt); now += dt * 1000;
      const cars = trainCars(), near = cars.filter(c => c.px > x0 && c.px < x1 && Math.abs(c.py - 11) < 0.5 && Math.sign(c.du) === dir);
      if (!near.length) continue;
      render(now);
      const c = document.createElement('canvas'); c.width = Cs; c.height = Cs;
      c.getContext('2d').drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
      frames.push({ c, txt: near.map(m => (m.du > 0 ? '→' : '←') + m.px.toFixed(2)).join(' ') });
    }
    nightAt = na; gameHour = gh;
    const cols = 8, rows = Math.ceil(frames.length / cols), sheet = document.createElement('canvas');
    sheet.width = cols * (Cs + 6); sheet.height = rows * (Cs + 26);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    frames.forEach((f, i) => {
      const X = (i % cols) * (Cs + 6), Y = Math.floor(i / cols) * (Cs + 26) + 20;
      sx.drawImage(f.c, X, Y); sx.font = '700 15px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(i + ': ' + f.txt, X + 4, Y - 5);
    });
    return sheet;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.bpFahrtSetup = setup;
  window.bpFahrt = async (name = 'bergportal-fahrt.png', ...a) => { const s = setup(); const sheet = await run(...a); return [s, await post(name, sheet)]; };
  return 'ok';
})();
