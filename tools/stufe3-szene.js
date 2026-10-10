// Nahaufnahmen Anhöhen Stufe 3 (Block 157j, Gebäude oben): Szenen direkt gebaut (Gebäude erst unten über build bzw. direkt gesetzt, dann die
// Anhöhe darunter – unabhängig davon, ob placeError es schon erlaubt), im Spiel gezeichnet: alle Größen 1×1 bis 7×7, an der Vorderkante (+x, +y),
// an Ecken, Mehrfeld an der Kante, alle 4 Drehungen, Vorplätze/Höfe zur Kante, Bahnhof/Hbf, U-Bahn-Eingang, Tag und Nacht, weit weg.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/stufe3-szene.js').then(r => r.text()).then(t => (0, eval)(t)); await stufe3Sammel()   → tools/vorschau/stufe3-zeichnen.png
// Kante je Art und Drehung: await stufe3Sammel('stufe3-kante-a.png', stufe3KanteListe.slice(0, 16)) (und -b mit slice(16))
// await stufe3Einzel(n, 'name.png', z) schickt Szene n in voller Auflösung; stufe3Szenen = Liste; stufe3Bau(n) baut nur
// Nach Änderungen am Code: Skripte neu holen (der Browser hält sie sonst im Zwischenspeicher) –
// for (const s of [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'))) await fetch(s, { cache: 'reload' }); location.reload()
(function stufe3Szene() {
  const R = 18;
  // Szene: hills [[x0, y0, x1, y1]] (Rechtecke, Ebene 1), things [[b, x, y, rot, extra]], wege [[x, y]] (Stil kopf), look [u, v, h] (Bildmitte
  // in Feldern, h Bildpunkte höher), z, night (0 … 1), far (weit weg: Bildchen/GL), t: Titel
  const S = [];
  const ring = (x0, y0, x1, y1) => { const o = []; for (let x = x0; x <= x1; x++) o.push([x, y0], [x, y1]); for (let y = y0 + 1; y < y1; y++) o.push([x0, y], [x1, y]); return o; };
  // 1) Übersicht: viele Arten auf einer großen Anhöhe, Tag / Nacht / weit weg
  const mix = [['haus', 1, 1, 0, { lvl: 3 }], ['haus', 2, 1, 1, { lvl: 5 }], ['kiosk', 3, 1, 1], ['cafe', 4, 1, 2], ['schule', 6, 1, 0], ['bibliothek', 9, 1, 0],
    ['saege', 1, 4, 0], ['muehle', 3, 4, 0], ['theater', 5, 4, 0], ['uni', 9, 4, 1], ['windrad', 12, 1, 0], ['solarfeld', 12, 3, 0], ['zoo', 1, 8, 0],
    ['reihenhaus', 6, 8, 0], ['baecker', 8, 8, 1], ['hotel', 10, 8, 0], ['fz_karussell', 6, 11, 0], ['fz_teetassen', 9, 11, 0], ['haus', 13, 13, 2, { lvl: 4 }], ['cafe', 13, 10, 3]];
  S.push({ t: 'Übersicht Tag', hills: [[0, 0, 13, 13]], things: mix, look: [7, 7, 30], z: 1.1 });
  S.push({ t: 'Übersicht Nacht', hills: [[0, 0, 13, 13]], things: mix, look: [7, 7, 30], z: 1.1, night: NIGHT_MAX });
  S.push({ t: 'Übersicht weit weg (Bildchen/GL)', hills: [[0, 0, 13, 13]], things: mix, look: [7, 7, 30], z: 0.6 });
  // 2) an der Vorderkante, alle Drehungen: 1×1, 1×2, 2×2, 3×3 (Tür zur Kante und weg davon)
  for (const rot of [0, 1, 2, 3]) S.push({ t: `Vorderkante, Drehung ${rot}`, hills: [[0, 0, 7, 7]], things: [['haus', 7, 1, rot, { lvl: 3 }], ['saege', 7, 3, rot], ['schule', 6, 6, rot],
    ['theater', 1, 5, rot], ['kiosk', 4, 7, rot], ['bibliothek', 3, 6, rot]], look: [4, 4, 24], z: 1.25 });
  // 3) Vorplatz/Hof mit Weg davor (gleiche Ebene) und zur Kante hin (kein Weg davor möglich)
  for (const rot of [0, 1, 2, 3]) S.push({ t: `Vorplätze, Drehung ${rot}`, hills: [[0, 0, 9, 9]], things: [['theater', 2, 2, rot], ['muehle', 7, 2, rot], ['uni', 6, 6, rot], ['reihenhaus', 2, 7, rot]],
    wege: ring(1, 1, 5, 5).concat(ring(6, 1, 8, 3), ring(5, 5, 8, 8)), look: [5, 5, 24], z: 1.0 });
  // 4) große Bauten oben (5×5, 7×7, 4×4 Hbf), Bahnhof 1×2, Freizeitpark
  S.push({ t: 'Schloss 7×7 und Riesenrad 5×5', hills: [[0, 0, 13, 8]], things: [['schloss', 0, 1, 0], ['riesenrad', 8, 2, 0]], look: [7, 5, 60], z: 0.9 });
  S.push({ t: 'Botanischer Garten 5×5, Zoo 4×4', hills: [[0, 0, 10, 6]], things: [['botgarten', 0, 1, 0], ['zoo', 6, 2, 1]], look: [5, 4, 40], z: 1.1 });
  S.push({ t: 'Hbf 4×4 und Bahnhof 1×2 oben', hills: [[0, 0, 9, 7]], things: [['hbf', 1, 1, 0], ['station', 7, 2, 0]], rails: [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [8, 7]], look: [5, 4, 30], z: 1.3 });
  S.push({ t: 'Freizeitpark oben', hills: [[0, 0, 9, 7]], things: [['fz_schloss', 0, 1, 0], ['fz_wildwasser', 3, 1, 0], ['fz_kette', 6, 1, 0], ['fz_freifall', 8, 1, 0], ['fz_geister', 6, 4, 0], ['fz_torturm', 3, 5, 0], ['fz_ballon', 4, 5, 0]], look: [5, 4, 40], z: 1.2 });
  // 5) Nahaufnahmen der Anschlüsse an der Kante (Zoom 4–8)
  S.push({ t: 'nah: Haus an der Vorderkante +y', hills: [[0, 0, 4, 4]], things: [['haus', 2, 4, 0, { lvl: 3 }]], look: [2, 4.3, 14], z: 5 });
  S.push({ t: 'nah: Haus an der Vorderkante +x', hills: [[0, 0, 4, 4]], things: [['haus', 4, 2, 1, { lvl: 3 }]], look: [4.3, 2, 14], z: 5 });
  S.push({ t: 'nah: Schule an der Ecke vorn', hills: [[0, 0, 4, 4]], things: [['schule', 3, 3, 0]], look: [4, 4, 14], z: 4 });
  S.push({ t: 'nah: Theater Tür zur Kante', hills: [[0, 0, 5, 5]], things: [['theater', 3, 3, 0]], wege: [[2, 3], [2, 4], [2, 5]], look: [4.5, 4.5, 20], z: 3.5 });
  S.push({ t: 'nah: Sägewerk Hof an der Kante', hills: [[0, 0, 4, 4]], things: [['saege', 3, 3, 1]], look: [3.5, 4, 14], z: 4.5 });
  S.push({ t: 'nah: Mühle Weg davor oben', hills: [[0, 0, 4, 4]], things: [['muehle', 2, 2, 0]], wege: [[3, 2], [3, 1], [3, 3], [3, 4]], look: [2.5, 2.5, 20], z: 5 });
  S.push({ t: 'z8: Garten an der Kante +y', hills: [[0, 0, 4, 4]], things: [['haus', 2, 4, 0, { lvl: 3 }]], look: [2, 4.45, 10], z: 8 });
  S.push({ t: 'z8: Garten an der Kante +x, gleich hoch daneben', hills: [[0, 0, 4, 4]], things: [['haus', 4, 2, 1, { lvl: 3 }]], look: [4.45, 2, 10], z: 8 });
  // 6) Nacht nah, U-Bahn-Eingang (oben und 👁), Vorschau beim Bauen, Treppe/Gleis-Rampe daneben, Schatten an der Kante
  S.push({ t: 'Nacht nah an der Kante', hills: [[0, 0, 5, 5]], things: [['haus', 5, 1, 1, { lvl: 4 }], ['cafe', 5, 3, 1], ['schule', 2, 4, 0], ['kiosk', 0, 5, 0]], look: [3, 3, 20], z: 2.6, night: NIGHT_MAX });
  S.push({ t: 'U-Bahn-Eingang oben auf dem Tunnel', hills: [[0, 0, 5, 5]], tunnels: [[-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3]], things: [['ubahn', 2, 3, 0], ['ubahn', 5, 3, 1, { form: 1 }]], look: [3, 3, 20], z: 3 });
  S.push({ t: 'U-Bahn-Eingang, 👁 Tunnel-Ansicht', hills: [[0, 0, 5, 5]], tunnels: [[-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3]], things: [['ubahn', 2, 3, 0], ['ubahn', 5, 3, 1, { form: 1 }]], look: [3, 3, 20], z: 2.2, see: true });
  S.push({ t: 'Vorschau: Theater oben an der Kante', hills: [[0, 0, 5, 5]], things: [['haus', 1, 1, 0, { lvl: 2 }]], ghost: ['theater', 3, 3, 0], look: [4, 4, 20], z: 2.4 });
  S.push({ t: 'Vorschau: Haus oben an der Kante (+x)', hills: [[0, 0, 5, 5]], things: [], ghost: ['haus', 5, 2, 1], look: [5, 2.5, 14], z: 4 });
  S.push({ t: 'Treppe und Gleis-Rampe neben Gebäuden', hills: [[0, 0, 8, 5]], things: [['haus', 2, 5, 0, { lvl: 3 }], ['kiosk', 4, 5, 0], ['schule', 2, 2, 0], ['haus', 7, 5, 1, { lvl: 4 }]], stairs: [[3, 6]],
    ramps: [[6, 6, 0, 'b']], rails: [[6, 4], [6, 3], [6, 9], [6, 10]], look: [4.5, 5, 20], z: 2.2 });
  S.push({ t: 'Schatten an der Kante (hoch, hinten und vorn)', hills: [[0, 0, 5, 5]], things: [['uni', 4, 0, 0], ['windrad', 5, 4, 0], ['bibliothek', 0, 4, 1]], look: [3, 3, 30], z: 2.2 });
  S.push({ t: 'Ausbau-Stufen Haus 1–5 an der Kante', hills: [[0, 0, 5, 5]], things: [1, 2, 3, 4, 5].map((l, i) => ['haus', i, 5, 0, { lvl: l }]), look: [2.5, 5, 20], z: 2.6 });
  // 7) Kante je Art und Drehung (eigener Bogen: await stufe3Sammel('stufe3-kante.png', stufe3KanteListe)) – vorn links (+y) und vorn rechts (+x)
  const K0 = S.length;
  for (const [b, w, h, z] of [['saege', 1, 2, 3], ['schule', 2, 2, 2.6], ['theater', 3, 3, 2.2], ['haus', 1, 1, 3.4]]) for (const rot of [0, 1, 2, 3]) {
    const [rw, rh] = rot & 1 ? [h, w] : [w, h], ex = b === 'haus' ? { lvl: 3 } : {};
    S.push({ t: `${b} Dr. ${rot}, Kante vorn links (+y)`, hills: [[0, 0, 8, 8]], things: [[b, 3, 9 - rh, rot, ex]], look: [3 + (rw - 1) / 2, 9 - rh + (rh - 1) / 2, 26], z,
      near: [3 + (rw - 1) / 2, 8.5, 26] });
    S.push({ t: `${b} Dr. ${rot}, Kante vorn rechts (+x)`, hills: [[0, 0, 8, 8]], things: [[b, 9 - rw, 3, rot, ex]], look: [9 - rw + (rw - 1) / 2, 3 + (rh - 1) / 2, 26], z,
      near: [8.5, 3 + (rh - 1) / 2, 26] });
  }
  window.stufe3KanteListe = S.slice(K0).map((_, i) => K0 + i);
  window.stufe3Szenen = S;
  let base = null;
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
  function put(b, x, y, rot = 0, extra = {}) {
    rotManual = true; buildRot = rot;
    const e = placeError(b, x, y);
    let ok = !e && build(b, x, y, true);
    rotManual = false; buildRot = 0;
    const k = x + ',' + y;
    if (!ok) {
      const t = { b, rot, lvl: 1, ...(b === 'hbf' ? HBF_NEW : {}), ...(WONDERS[b] ? { phase: WONDERS[b].phases.length } : {}) };
      state.tiles.set(k, t);
    }
    const t = state.tiles.get(k);
    if (t) { delete t.born; Object.assign(t, extra); if (WONDERS[b]) t.phase = WONDERS[b].phases.length; }
    return ok ? null : `${b} ${x},${y}: ${e}`;
  }
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 6, c0.y - 6]; }
    const [bx, by] = base;
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    if (!state.legacy) state.legacy = new Set();
    for (const k of Object.keys(ITEMS)) state.legacy.add(k);
    clear(bx + 6, by + 6);
    chosenStyle.weg = 'kopf';
    const notes = [];
    for (const [x, y] of s.wege || []) build('weg', bx + x, by + y, true);
    for (const [x, y] of s.tunnels || []) state.tunnels.set((bx + x) + ',' + (by + y), {});
    for (const [x, y] of s.rails || []) build('schiene', bx + x, by + y, true);
    for (const [b, x, y, rot, extra] of s.things) { const n = put(b, bx + x, by + y, rot || 0, extra || {}); if (n) notes.push(n); }
    for (const [x0, y0, x1, y1] of s.hills) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set((bx + x) + ',' + (by + y), { w: s.wall || 0 });
    recalc();
    for (const [x, y] of s.stairs || []) { const e = placeError('huegeltreppe', bx + x, by + y); if (e) notes.push('Treppe: ' + e); else build('huegeltreppe', bx + x, by + y); }
    for (const [x, y, rot, form] of s.ramps || []) {
      rampNewForm = form; rotManual = true; buildRot = rot;
      const e = placeError('huegelrampe', bx + x, by + y);
      if (e) notes.push('Gleis-Rampe: ' + e); else build('huegelrampe', bx + x, by + y);
      rotManual = false; buildRot = 0;
    }
    recalc(); groundVersion++; floats.length = 0;
    return notes;
  }
  async function show(s) {
    const [bx, by] = base, [u, v, h] = s.look, p = iso(bx + u, by + v);
    cam.x = p.x; cam.y = p.y - h; cam.z = s.z;
    const n0 = nightAt, gh = typeof gameHour !== 'undefined' ? gameHour : null, ic = GFX.icons, keep = [tool, hover, rotManual, buildRot];
    if (s.see) setSeeThrough(true);
    if (s.ghost) { const [b, x, y, rot] = s.ghost; tool = b; hover = { x: bx + x, y: by + y }; rotManual = true; buildRot = rot || 0; }
    GFX.icons = !!s.icons;                                             // ohne 🐌/⚡ (stören beim Hinsehen)
    nightAt = () => s.night || 0;
    if (gh) gameHour = () => (s.night ? 23 : 12);
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 10; k++) { walkers.length = 0; hillWalkers.length = 0; meFigs.length = 0; bubble = null; render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      walkers.length = 0; hillWalkers.length = 0; meFigs.length = 0; bubble = null; render(performance.now() + 300);
    } finally { nightAt = n0; if (gh) gameHour = gh; GFX.icons = ic; [tool, hover, rotManual, buildRot] = keep; if (s.see) setSeeThrough(false); }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  window.stufe3Bau = n => build1(S[n]);
  window.stufe3Szene = async (n, z) => { const s = { ...S[n], ...(z ? { z } : {}) }, notes = build1(s), comp = await show(s); return { notes, t: s.t, comp }; };
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.stufe3Einzel = async (n, name, z, C = 1000) => {
    const { notes, comp } = await window.stufe3Szene(n, z), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    return [await post(name, cv), notes];
  };
  // nah (Zoom zn, Bildmitte s.near: die Kante unter dem Gebäude), sonst wie in der Szene
  window.stufe3Sammel = async (name = 'stufe3-zeichnen.png', only = null, zn = null) => {
    const list = only || S.map((_, i) => i).filter(i => !window.stufe3KanteListe.includes(i)), C = 1000, cols = 4, rows = Math.ceil(list.length / cols), T = 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 50) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let j = 0; j < list.length; j++) {
      const s0 = S[list[j]], s = zn && s0.near ? { ...s0, z: zn, look: s0.near } : s0;
      build1(s);
      const comp = await show(s), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 50) + 34;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C * T, C * T);
      sx.font = '800 14px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${list[j]}: ${s.t}`, X + 2, Y - 10);
    }
    return post(name, sheet);
  };
})();
