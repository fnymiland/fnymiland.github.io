// Nahaufnahmen Bahn oben (Block 157j, Stufe 3): Bahnhof oben mit haltendem Zug (echte Linie: Bahnhof unten → Gleis-Rampe A → Bahnhof oben) in
// allen vier Drehungen, Hauptbahnhof oben mit Zug in der Halle (vier Drehungen), U-Bahn-Eingang oben auf dem Tunnel unter der Anhöhe, Achterbahn oben.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/stufe3-bahn-szene.js').then(r => r.text()).then(t => (0, eval)(t)); await s3bBlatt()  → tools/vorschau/stufe3-bahn.png
// await s3bSzene(n) baut nur Szene n und zeigt sie; await s3bEinzel(n, 'name.png', z) schickt sie in voller Auflösung
(function stufe3BahnSzene() {
  const R = 18, UP = [[0, -1], [1, 0], [0, 1], [-1, 0]], DIRN = ['hinauf −y', 'hinauf +x', 'hinauf +y', 'hinauf −x'];
  const S = [];
  for (const rot of [0, 1, 2, 3]) S.push({ kind: 'station', rot, side: 1, z: 5, t: 'Bahnhof oben, Zug hält' });
  S.push({ kind: 'station', rot: 0, side: -1, z: 5, t: 'Bahnhof oben, andere Seite' });
  S.push({ kind: 'station', rot: 1, side: -1, z: 5, t: 'Bahnhof oben, andere Seite' });
  S.push({ kind: 'station', rot: 0, side: 1, z: 2.2, t: 'Linie unten ↔ oben', look: 'line' });
  for (const rot of [0, 1, 2, 3]) S.push({ kind: 'hbf', rot, z: 3, t: 'Hbf oben, Zug in der Halle' });
  for (const rot of [0, 1, 2, 3]) S.push({ kind: 'hbf', rot, z: 3, t: 'Hbf oben, Zug fährt ein', at: 'entry' });
  S.push({ kind: 'ubahn', rot: 1, z: 5, t: 'U-Bahn-Eingang oben (Tunnel darunter)' });
  S.push({ kind: 'ubahn', rot: 0, z: 5, t: 'U-Bahn-Eingang oben an der Kante', edge: true });
  S.push({ kind: 'ubahn', rot: 3, z: 5, t: 'U-Bahn-Eingang oben an der Kante', edge: true });
  for (const rot of [0, 3]) S.push({ kind: 'edge', rot, z: 4.5, t: 'Bahnhof oben an der Kante, Zug hält' });
  S.push({ kind: 'coaster', rot: 0, z: 2.2, t: 'Achterbahn oben' });
  S.push({ kind: 'coaster', rot: 3, z: 2.2, t: 'Achterbahn oben an der Kante', edge: true });
  let base = null;
  const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k];
  function clear(bx, by) {
    for (let y = by - R; y <= by + R; y++) for (let x = bx - R; x <= bx + R; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    for (const k of [...state.edges.keys()]) { const [mx, my] = edgeMid(k); if (Math.abs(mx - bx) <= R + 1 && Math.abs(my - by) <= R + 1) state.edges.delete(k); }
    hillWalkers.length = 0; walkers.length = 0; roofers.length = 0; floats.length = 0; trains.length = 0;
    recalc();
  }
  // Bauen wie der Spieler (placeError → build); Bahnhöfe oben, solange hillOk sie noch nicht kennt: direkt gesetzt (steht in errs)
  function put(errs, b, x, y, rot, extra = {}) {
    buildRot = rot; rotManual = true;
    const e = placeError(b, x, y);
    if (!e) build(b, x, y, true);
    else { errs.push(`${b} ${x},${y}: ${e}`); state.tiles.set(x + ',' + y, { b, lvl: 1, rot, ...(b === 'hbf' ? HBF_NEW : {}), ...extra }); }
    rotManual = false; buildRot = 0;
    recalc();
  }
  const rotTo = d => [[1, 0], [0, 1], [-1, 0], [0, -1]].findIndex(f => f[0] === d[0] && f[1] === d[1]);
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x, c0.y]; }
    const [bx, by] = base, D = UP[s.rot], O = [-D[0], -D[1]], Sd = [-D[1], D[0]];
    if (typeof closeModal === 'function') closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look');
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    for (const k of Object.keys(LM_STAGES)) state.restore[k] = Math.max(state.restore[k] || 0, 3); state.festival = true;   // Achterbahn
    clear(bx, by);
    const errs = [], W0 = (u, v) => [bx + D[0] * u + Sd[0] * v, by + D[1] * u + Sd[1] * v];   // lokal: u hinauf (Kante u = 0), v seitlich
    const hillU = s.kind === 'hbf' ? [0, 12] : [0, 9], hillV = s.kind === 'hbf' ? [-7, 7] : [-4, 4];
    for (let u = hillU[0]; u <= hillU[1]; u++) for (let v = hillV[0]; v <= hillV[1]; v++) { const [x, y] = W0(u, v); build('anhoehe', x, y, true); }
    recalc();
    for (let i = 0; i < 6; i++) state.tiles.set((bx + 14 + (i % 3) * 2) + ',' + (by - 14 + Math.floor(i / 3) * 2), { b: 'windrad', lvl: 3 });   // Strom
    let look = W0(5, 0), hh = 30, keys = null;
    if (s.kind === 'station' || s.kind === 'hbf') {
      // Gleis-Rampe A an der Kante u = 0 (Fuß u = 0, oben u = 1), Gleis unten u = −1 … −7, oben u = 2 …
      const foot = W0(0, 0), top = W0(1, 0), ax = Math.min(foot[0], top[0]), ay = Math.min(foot[1], top[1]);
      rampNewForm = 'a'; buildRot = s.rot; rotManual = true;
      const er = placeError('huegelrampe', ax, ay);
      if (er) errs.push('Rampe: ' + er); else build('huegelrampe', ax, ay);
      rotManual = false; buildRot = 0;
      const topEnd = s.kind === 'hbf' ? 4 : 8;
      for (let u = -7; u <= topEnd; u++) { if (u === 0 || u === 1) continue; const [x, y] = W0(u, 0); const e2 = placeError('schiene', x, y); if (e2) errs.push(`Schiene ${x},${y}: ${e2}`); else build('schiene', x, y, true); }
      // Bahnhof unten (u −5/−4, Seite +1)
      const sl = [W0(-5, 1), W0(-4, 1)];
      put(errs, 'station', Math.min(sl[0][0], sl[1][0]), Math.min(sl[0][1], sl[1][1]), rotTo([-Sd[0], -Sd[1]]), { train: 'regio' });
      if (s.kind === 'station') {
        const st = [W0(5, s.side), W0(6, s.side)];
        put(errs, 'station', Math.min(st[0][0], st[1][0]), Math.min(st[0][1], st[1][1]), rotTo([-Sd[0] * s.side, -Sd[1] * s.side]), { train: 'regio' });
        look = s.look === 'line' ? W0(0, 0) : W0(5.5, 0.5 * s.side); hh = s.look === 'line' ? 10 : 34;
      } else {
        // Hbf oben: Gleis 0 vorn an der Schiene u = 4 (Ausfahrt), Halle dahinter (u 5 … 7); Gebäude 4 tief
        const t = { b: 'hbf', lvl: 1, rot: rotTo(O), ...HBF_NEW }, [w, h] = sizeOf('hbf', t.rot, t);
        // Anker so, dass die Ausfahrt eines Gleises auf W0(4, 0) liegt
        let anc = null;
        for (let dy = -12; dy <= 12 && !anc; dy++) for (let dx = -12; dx <= 12 && !anc; dx++) {
          const p = [bx + dx, by + dy];
          for (let g0 = 0; g0 < hbfGleise(t); g0++) { const G = gleisTiles(t, p[0], p[1], g0); const ex = W0(4, 0); if (G.exit[0] === ex[0] && G.exit[1] === ex[1]) { anc = p; break; } }
        }
        put(errs, 'hbf', anc[0], anc[1], t.rot, { train: 'regio' });
        look = [anc[0] + (w - 1) / 2, anc[1] + (h - 1) / 2]; hh = 30;
      }
      groundVersion++; recalc();
      if (window.__s3Sync) { syncTrains = window.__s3Sync; delete window.__s3Sync; }
      syncTrains.sig = null; syncMovers();
      const tr = trains[0];
      if (!tr) errs.push('kein Zug');
      else {
        // Halt oben: der Halt, an dem das Gleis angehoben ist
        const up = tr.stops.find(d => { const [u, v] = railPoint(tr.route, d); return surfaceHeight(u, v) > 0; });
        if (up == null) errs.push('kein Halt oben');
        tr.c = s.at === 'entry' ? up - 1.2 * Math.sign(up - tr.stops.find(d => d !== up)) : up != null ? up : tr.c;
        tr.wait = 1e9; tr.powered = true;
        if (s.look === 'line') tr.c = tr.stops.reduce((a, b) => a + b, 0) / 2;
        if (s.kind === 'hbf') { const [u, v] = railPoint(tr.route, tr.c); look = [u, v]; hh = 24; }   // Hbf: auf den Zug in der Halle
      }
      keys = { lines: T.rail.lines.length, stopsUp: tr ? tr.stops.map(d => { const [u, v] = railPoint(tr.route, d); return surfaceHeight(u, v); }) : [] };
    } else if (s.kind === 'ubahn') {
      // Tunnel quer unter der Anhöhe (v = 0, u −3 … 12), U-Bahn-Eingang oben bei u = 4 (bzw. an der Kante u = 0)
      for (let u = -3; u <= 12; u++) { const [x, y] = W0(u, 0); const e2 = placeError('tunnel', x, y); if (e2) errs.push(`Tunnel ${x},${y}: ${e2}`); else build('tunnel', x, y, true); }
      const at = s.edge ? W0(0, 0) : W0(4, 0);
      put(errs, 'ubahn', at[0], at[1], s.rot);
      const lowAt = W0(-2, 0);
      put(errs, 'ubahn', lowAt[0], lowAt[1], s.rot);
      build('weg', ...W0(s.edge ? 0 : 4, 1), true); build('weg', ...W0(s.edge ? 0 : 4, 2), true);
      look = at; hh = 30;
    } else if (s.kind === 'edge') {
      // Gleis oben auf dem Randfeld (u = 0, v −4 … 4), Bahnhof dahinter (u = 1, Bahnsteig zur Kante), Zug hält; davor unten Wiese
      for (let v = -4; v <= 4; v++) { const [x, y] = W0(0, v); const e2 = placeError('schiene', x, y); if (e2) errs.push(`Schiene ${x},${y}: ${e2}`); else build('schiene', x, y, true); }
      const st = [W0(1, -1), W0(1, 0)];
      put(errs, 'station', Math.min(st[0][0], st[1][0]), Math.min(st[0][1], st[1][1]), rotTo(O));
      recalc();
      const route = railPolyline([-4, -3, -2, -1, 0, 1, 2, 3, 4].map(v => W0(0, v).join())), c = stopOn(route, Math.min(st[0][0], st[1][0]) + ',' + Math.min(st[0][1], st[1][1]));
      if (window.__s3Sync) { syncTrains = window.__s3Sync; delete window.__s3Sync; }
      trains.length = 0;
      trains.push({ id: 'pruef', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind: { ...TRAIN_KIND.regio, n: 2 }, c, dir: 1, wait: 1e9, next: 1 });
      look = W0(0.5, -0.5); hh = 30;
    } else if (s.kind === 'coaster') {
      // Freizeitpark-Boden oben, Rundkurs 4 × 3 mit Station
      const u0 = s.edge ? 0 : 3;                                          // an der Kante: Ring auf dem Randfeld (u = 0), davor unten Wiese
      for (let u = u0 - 1; u <= u0 + 5; u++) for (let v = -3; v <= 3; v++) { const [x, y] = W0(u, v); build('fzboden', x, y, true); }
      const ring = [];
      for (let u = u0; u <= u0 + 4; u++) ring.push([u, -2]);
      for (let v = -1; v <= 2; v++) ring.push([u0 + 4, v]);
      for (let u = u0 + 3; u >= u0; u--) ring.push([u, 2]);
      for (let v = 1; v >= -1; v--) ring.push([u0, v]);
      for (const [u, v] of ring) { const [x, y] = W0(u, v); const e2 = placeError('fz_bahn', x, y); if (e2) errs.push(`Achterbahn ${x},${y}: ${e2}`); else build('fz_bahn', x, y, true); }
      const st = W0(u0 + 2, -2); state.tiles.delete(st.join()); recalc(); put(errs, 'fz_station', st[0], st[1], 0);
      const lp = W0(u0 + 2, 2); state.tiles.delete(lp.join()); recalc(); build('fz_bahn', lp[0], lp[1], true); recalc(); { const e2 = placeError('fz_looping', lp[0], lp[1]); if (e2) errs.push('Looping: ' + e2); else build('fz_looping', lp[0], lp[1], true); }
      if (s.edge) { const b0 = W0(-1, 0); const e2 = placeError('fz_bahn', b0[0], b0[1]); if (e2) errs.push('unten: ' + e2); else build('fz_bahn', b0[0], b0[1], true); }   // Stück unten davor: hängt nicht dran
      recalc(); coasterRuns.clear(); stepCoasters(0.01); for (const c of COASTERS) { const r = coasterRuns.get(c.key); if (r) { r.wait = 0; r.s = c.n * 0.4; } }
      if (COASTERS.length !== 1) errs.push('Achterbahn fährt nicht (' + COASTERS.length + ')');
      look = W0(u0 + 2, 0); hh = 50;
    }
    recalc(); groundVersion++; floats.length = 0;
    return { errs, look, hh, keys };
  }
  async function show(s, g0) {
    const p = iso(g0.look[0], g0.look[1]);
    cam.x = p.x; cam.y = p.y - g0.hh; cam.z = s.z;
    const n0 = nightAt;
    if (!window.__s3Sync) window.__s3Sync = syncTrains;                  // der Prüf-Zug bleibt stehen
    nightAt = () => 0; syncTrains = () => {};
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 10; k++) { walkers.length = 0; render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      walkers.length = 0; render(performance.now() + 300);
    } finally { nightAt = n0; }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  const title = s => `${s.t} · ${DIRN[s.rot]}`;
  window.s3bSzenen = S;
  window.s3bSzene = async n => { const s = S[n], g0 = build1(s), comp = await show(s, g0); return { errs: g0.errs, t: title(s), keys: g0.keys }; };
  window.s3bFertig = () => { if (window.__s3Sync) { syncTrains = window.__s3Sync; syncTrains.sig = null; delete window.__s3Sync; } trains.length = 0; };
  window.s3bBlatt = async (name = 'stufe3-bahn.png', only = null, zz = null) => {
    const list = only || S.map((_, i) => i), C = 880, cols = 4, rows = Math.ceil(list.length / cols), T = 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 50) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = zz ? { ...S[list[j]], z: zz } : S[list[j]], g0 = build1(s);
      if (g0.errs.length) errs.push(title(s) + ': ' + g0.errs.join('; '));
      const comp = await show(s, g0), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 50) + 34;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C * T, C * T);
      sx.font = '800 14px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(title(s), X + 2, Y - 10);
    }
    let res;
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') }); res = await r.text(); } catch (e) { res = 'kein Sammler'; }
    return { res, errs };
  };
  window.s3bEinzel = async (n, name, z, C = 1000) => {
    const s = { ...S[n], ...(z ? { z } : {}) }, g0 = build1(s), comp = await show(s, g0), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return [await r.text(), g0.errs]; } catch (e) { return ['kein Sammler', g0.errs]; }
  };
})();
