// Kritische Prüfung der Zeichnungen, Stufe 3 (Block 157j, Gebäude oben): starke Nahaufnahmen (Zoom 4–8) der Anschlüsse an der Kante – jede
// Größe 1×1 … 7×7 an der Vorderkante +x/+y und an Ecken in allen vier Drehungen, neben Treppe und Gleis-Rampe, Bahnhof/Hbf mit Zug, U-Bahn-
// Eingang (auch 👁), Schatten, Nacht, Vorplätze, Figuren an Türen, Geist beim Bauen, weit weg (WebGL). Gebaut wird wie der Spieler (erst die
// Anhöhe, dann placeError → build); was die Regeln sperren, steht in errs (und wird direkt gesetzt).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/stufe3-pruefung.js').then(r => r.text()).then(t => (0, eval)(t)); await s3pFinal()   → tools/vorschau/stufe3-nah-final.png
// await s3pBlatt('name.png', liste) malt Szenen (s3pSzenen: jede Größe × Drehung × Kante +y/+x/Ecke/hinten, s3pList('haus', 'kante'))
// await s3pEinzel(szene | n, 'name.png', { C, scale }) schickt eine Szene (Objekt wie in S oder Nummer) einzeln; await s3pDiff(n, 'name.png')
// vergleicht oben ↔ flach (rot = Unterschied auf der Oberseite, sonst abgedunkelt)
(function stufe3Pruefung() {
  const R = 20;
  const S = [];
  const add = (b, x, y, rot = 0, ex = {}) => [b, x, y, rot, ex];
  // Szene: hills [[x0, y0, x1, y1, lv?]], things [[b, x, y, rot, extra]], wege, rails, tunnels, stairs, ramps [[x, y, rot, form]], look [u, v, h]
  // (Feld, Bildpunkte höher), z, night, see (👁), ghost [b, x, y, rot], far (Zoom < 1, WebGL; Ausschnitt vergrößert), figs [[u, v]], t: Titel
  const big = [['haus', 1, 1, { lvl: 3 }], ['saege', 1, 2], ['schule', 2, 2], ['theater', 3, 3], ['zoo', 4, 4], ['riesenrad', 5, 5], ['schloss', 7, 7]];
  // 1) jede Größe an der Vorderkante: links vorn (+y) und rechts vorn (+x), Drehung 0–3; Anhöhe 0..9 × 0..9
  for (const [b, w0, h0, ex] of big) for (const rot of [0, 1, 2, 3]) {
    const [w, h] = rot & 1 ? [h0, w0] : [w0, h0], z = Math.max(1.2, 5.2 - Math.max(w, h) * 0.6);
    S.push({ t: `${b} ${w0}×${h0} Dr. ${rot} · Kante +y`, grp: 'kante', hills: [[0, 0, 9, 9]], things: [add(b, 3, 10 - h, rot, ex || {})], look: [3 + (w - 1) / 2, 9.5, 20], z });
    S.push({ t: `${b} ${w0}×${h0} Dr. ${rot} · Kante +x`, grp: 'kante', hills: [[0, 0, 9, 9]], things: [add(b, 10 - w, 3, rot, ex || {})], look: [9.5, 3 + (h - 1) / 2, 20], z });
    S.push({ t: `${b} ${w0}×${h0} Dr. ${rot} · Ecke vorn`, grp: 'ecke', hills: [[0, 0, 9, 9]], things: [add(b, 10 - w, 10 - h, rot, ex || {})], look: [9.5, 9.5, 20], z });
    S.push({ t: `${b} ${w0}×${h0} Dr. ${rot} · Kante hinten (−x, −y)`, grp: 'hinten', hills: [[0, 0, 9, 9]], things: [add(b, 0, 0, rot, ex || {})], look: [(w - 1) / 2, (h - 1) / 2, 40], z: z * 0.8 });
  }
  window.s3pSzenen = S;
  window.s3pList = (pre, grp) => S.map((s, i) => [s, i]).filter(([s]) => s.t.startsWith(pre + ' ') && (!grp || s.grp === grp)).map(([s, i]) => i);
  let base = null;
  function clear(bx, by) {
    for (let y = by - R; y <= by + R; y++) for (let x = bx - R; x <= bx + R; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); state.roofs.delete(k); if (state.tunnels) state.tunnels.delete(k);
    }
    for (const k of [...state.edges.keys()]) { const [mx, my] = edgeMid(k); if (Math.abs(mx - bx) <= R + 1 && Math.abs(my - by) <= R + 1) state.edges.delete(k); }
    hillWalkers.length = 0; walkers.length = 0; strollers.length = 0; paraders.length = 0; roofers.length = 0; floats.length = 0; trains.length = 0;
    recalc();
  }
  function put(errs, b, x, y, rot = 0, extra = {}) {
    rotManual = true; buildRot = rot;
    const e = placeError(b, x, y);
    const ok = !e && build(b, x, y, true);
    rotManual = false; buildRot = 0;
    const k = x + ',' + y;
    if (!ok) { errs.push(`${b} ${x},${y}: ${e || 'build false'}`); state.tiles.set(k, { b, rot, lvl: 1, ...(b === 'hbf' ? HBF_NEW : {}), ...(WONDERS[b] ? { phase: WONDERS[b].phases.length } : {}) }); }
    const t = state.tiles.get(k);
    if (t) { delete t.born; Object.assign(t, extra); if (WONDERS[b]) t.phase = WONDERS[b].phases.length; }
    recalc();
  }
  const pin = (u, v, i) => {
    const a = ANIMALS[(i * 5 + 2) % ANIMALS.length], x = Math.round(u), y = Math.round(v);
    walkers.push({ fx: x, fy: y, tx: x, ty: y, px: u, py: v, t: 0, wait: 1e9, pin: true, kind: ANIMALS.indexOf(a), fur: a.fur || FUR[i % FUR.length],
      shirt: SHIRTS[(i + 2) % SHIRTS.length], speed: 0.8, goal: { kind: 'bummel' }, path: null, steps: 1e9 });
  };
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 6, c0.y - 6]; }
    const [bx, by] = base, errs = [];
    if (typeof closeModal === 'function') closeModal(); if (typeof closePanel === 'function') closePanel();
    state.tutorial = -1; state.tipsOff = true; if (tool !== 'look') setTool('look');
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    if (!state.legacy) state.legacy = new Set();
    for (const k of Object.keys(ITEMS)) state.legacy.add(k);
    for (const k of Object.keys(LM_STAGES)) state.restore[k] = Math.max(state.restore[k] || 0, 3);
    clear(bx + 6, by + 6);
    chosenStyle.weg = wegStyleOf('kopf'); chosenStyle.huegeltreppe = wegStyleOf('kopf');
    for (const [x0, y0, x1, y1, lv] of s.hills || []) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) state.hills.set((bx + x) + ',' + (by + y), lv > 1 ? { w: s.wall || 0, h: lv } : { w: s.wall || 0 });
    recalc();
    for (const [x, y] of s.wege || []) build('weg', bx + x, by + y, true);
    for (const [x, y] of s.tunnels || []) state.tunnels.set((bx + x) + ',' + (by + y), {});
    for (const [x, y] of s.rails || []) build('schiene', bx + x, by + y, true);
    recalc();
    for (const [x, y] of s.stairs || []) { const e = placeError('huegeltreppe', bx + x, by + y); if (e) errs.push('Treppe: ' + e); else build('huegeltreppe', bx + x, by + y); }
    for (const [x, y, rot, form] of s.ramps || []) {
      rampNewForm = form; rotManual = true; buildRot = rot;
      const e = placeError('huegelrampe', bx + x, by + y);
      if (e) errs.push('Gleis-Rampe: ' + e); else build('huegelrampe', bx + x, by + y);
      rotManual = false; buildRot = 0;
    }
    recalc();
    for (const [b, x, y, rot, extra] of s.things || []) put(errs, b, bx + x, by + y, rot || 0, extra || {});
    if (s.same) for (const [k, t] of s.same) if (state.tiles.has(k)) state.tiles.set(k, { ...t });   // Vergleich: dieselben Tiere/Farben wie oben
    s.placed = (s.things || []).map(([b, x, y]) => [(bx + x) + ',' + (by + y), { ...state.tiles.get((bx + x) + ',' + (by + y)) }]);
    for (const [x, y, b] of s.decos || []) build(b, bx + x, by + y, true);
    recalc(); groundVersion++; floats.length = 0;
    (s.figs || []).forEach(([u, v], i) => pin(bx + u, by + v, i));
    if (s.after) s.after(bx, by, errs);
    return errs;
  }
  async function show(s) {
    const [bx, by] = base, [u, v, h] = s.look, p = iso(bx + u, by + v);
    cam.x = p.x; cam.y = p.y - h; cam.z = s.z;
    const n0 = nightAt, gh = gameHour, sm = syncMovers, ic = GFX.icons, keep = [tool, hover, rotManual, buildRot], sf = spriteForce;
    if (s.see) setSeeThrough(true);
    if (s.ghost) { const [b, x, y, rot] = s.ghost; tool = b; hover = { x: bx + x, y: by + y }; rotManual = true; buildRot = rot || 0; }
    if (s.force != null) spriteForce = s.force;
    GFX.icons = !!s.icons;
    nightAt = () => s.night || 0; gameHour = () => (s.night ? 23 : 12); syncMovers = () => {};
    const figs = walkers.slice();
    try {
      spriteNoBudget = true;
      const T0 = s.T0 || performance.now();                              // Vergleich: feste Zeit (Rauch, Wasser …)
      for (let k = 0; k < 10; k++) { walkers.length = 0; walkers.push(...figs); hillWalkers.length = 0; meFigs.length = 0; bubble = null; render(T0 + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      walkers.length = 0; walkers.push(...figs); hillWalkers.length = 0; meFigs.length = 0; bubble = null; render(T0 + 300);
    } finally { nightAt = n0; gameHour = gh; syncMovers = sm; GFX.icons = ic; [tool, hover, rotManual, buildRot] = keep; spriteForce = sf; if (s.see) setSeeThrough(false); }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    comp.gl = typeof GL !== 'undefined' && GL.shown;
    return comp;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  // Ausschnitt C × C (Gerätepunkte) um die Bildmitte, um scale vergrößert (weit weg), ins Ziel (X, Y, T = Verkleinerung)
  const crop = (comp, C, scale = 1) => { const cv = document.createElement('canvas'); cv.width = C; cv.height = C; const c = cv.getContext('2d'); c.imageSmoothingEnabled = scale === 1; const c0 = C / scale; c.drawImage(comp, comp.width / 2 - c0 / 2, comp.height / 2 - c0 / 2, c0, c0, 0, 0, C, C); return cv; };
  const scene = n => typeof n === 'number' ? S[n] : n;
  window.s3pBau = n => build1(scene(n));
  window.s3pZeig = async n => { const s = scene(n), errs = build1(s), comp = await show(s); return { errs, t: s.t, gl: comp.gl }; };
  window.s3pEinzel = async (n, name, o = {}) => {
    const s = { ...scene(n), ...(o.z ? { z: o.z } : {}) }, errs = build1(s), comp = await show(s);
    return [await post(name, crop(comp, o.C || 1000, o.scale || 1)), errs, comp.gl];
  };
  // Vergleich oben ↔ flach: dieselbe Szene ohne Anhöhe (Kamera um den Hub tiefer) – auf der Oberseite (Bildpunkte, die in Höhe der Oberseite auf
  // ein Feld der Anhöhe fallen, nicht näher als m an seiner Grenze zu einem tieferen Feld) muss alles gleich aussehen. Rot = Unterschied
  async function diff(s, o = {}) {
    s = { ...s, T0: 5e6 };
    const errs = build1(s), compH = await show(s), camH = { ...cam }, hills = new Set(state.hills.keys());
    const sf = { ...s, hills: [], stairs: [], ramps: [], same: s.placed, look: [s.look[0], s.look[1], s.look[2] - HILL_H] };
    build1(sf);
    const compF = await show(sf);
    const C = o.C || 1000, x0 = compH.width / 2 - C / 2, y0 = compH.height / 2 - C / 2, m = o.m == null ? 0.04 : o.m, thr = o.thr || 10;
    const A = compH.getContext('2d').getImageData(x0, y0, C, C), B = compF.getContext('2d').getImageData(x0, y0, C, C), d = A.data, e = B.data;
    let n = 0, box = null;
    const out = new ImageData(C, C);
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const p = (j * C + i) * 4, sx = (x0 + i) / DPR, sy = (y0 + j) / DPR;
      const wx = (sx - W / 2) / camH.z + camH.x, wy = (sy - H / 2) / camH.z + camH.y + HILL_H;
      const u = (wx / (TW / 2) + wy / (TH / 2)) / 2, v = (wy / (TH / 2) - wx / (TW / 2)) / 2, tx = Math.round(u), ty = Math.round(v);
      let inTop = hills.has(tx + ',' + ty);
      if (inTop && m > 0) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        if (hills.has((tx + dx) + ',' + (ty + dy))) continue;
        const fu = u - tx, fv = v - ty;
        if ((dx && Math.abs(fu - dx * 0.5) < m && (!dy || Math.abs(fv - dy * 0.5) < m)) || (!dx && Math.abs(fv - dy * 0.5) < m)) { inTop = false; break; }
      }
      const dd = Math.max(Math.abs(d[p] - e[p]), Math.abs(d[p + 1] - e[p + 1]), Math.abs(d[p + 2] - e[p + 2]));
      const bad = inTop && dd > thr;
      if (bad) { n++; if (!box) box = [i, j, i, j]; else { box[0] = Math.min(box[0], i); box[1] = Math.min(box[1], j); box[2] = Math.max(box[2], i); box[3] = Math.max(box[3], j); } }
      const k = inTop ? 1 : 0.55;
      out.data[p] = bad ? 255 : d[p] * k + (inTop ? 0 : 60); out.data[p + 1] = bad ? 0 : d[p + 1] * k + (inTop ? 0 : 60); out.data[p + 2] = bad ? 0 : d[p + 2] * k + (inTop ? 0 : 60); out.data[p + 3] = 255;
    }
    const cv = document.createElement('canvas'); cv.width = C; cv.height = C; cv.getContext('2d').putImageData(out, 0, 0);
    return { n, box, errs, cv, compH, compF };
  }
  window.s3pDiff = async (n, name, o = {}) => {
    const s = { ...scene(n), ...(o.z ? { z: o.z } : {}) }, r = await diff(s, o);
    const res = name ? await post(name, r.cv) : null;
    if (name && o.both) { await post(name.replace('.png', '-h.png'), crop(r.compH, o.C || 1000)); await post(name.replace('.png', '-f.png'), crop(r.compF, o.C || 1000)); }
    return { res, n: r.n, box: r.box, errs: r.errs };
  };
  // Foto vom gerade gebauten Stand (z. B. nach s3bSzene): Kamera auf Feld (u, v) absolut, h Bildpunkte höher, Zoom z; o.night, o.see, o.scale
  async function foto(u, v, h, z, o = {}) {
    const p = iso(u, v);
    cam.x = p.x; cam.y = p.y - h; cam.z = z;
    const n0 = nightAt, gh = gameHour, sf = spriteForce;
    if (o.see) setSeeThrough(true);
    if (o.force != null) spriteForce = o.force;
    nightAt = () => o.night || 0; gameHour = () => (o.night ? 23 : 12);
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 10; k++) { if (!o.walkers) walkers.length = 0; render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      if (!o.walkers) walkers.length = 0; render(performance.now() + 300);
    } finally { nightAt = n0; gameHour = gh; spriteForce = sf; if (o.see) setSeeThrough(false); }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    comp.gl = typeof GL !== 'undefined' && GL.shown;
    return comp;
  }
  window.s3pFoto = async (name, u, v, h, z, o = {}) => { const comp = await foto(u, v, h, z, o); return [await post(name, crop(comp, o.C || 1000, o.scale || 1)), comp.gl]; };
  window.s3pFotoCv = foto;
  // Sammelbild: list = Szenen (Objekte oder Nummern), je Zelle C × C, beschriftet
  window.s3pBlatt = async (name = 'stufe3-nah-final.png', list = null, o = {}) => {
    list = (list || S.map((_, i) => i)).map(scene);
    const C = o.C || 900, cols = o.cols || 5, rows = Math.ceil(list.length / cols), T = o.T || 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 50) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = list[j];
      let comp;
      if (s.custom) comp = await s.custom();                              // eigene Szene (z. B. Bahn: s3bSzene), liefert das Bild
      else { const e = build1(s); if (e.length) errs.push(s.t + ': ' + e.join('; ')); comp = await show(s); }
      const X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 50) + 34;
      sx.drawImage(crop(comp, C, s.scale || 1), X, Y, C * T, C * T);
      sx.font = '800 14px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${o.prefix || ''}${j + 1}: ${s.t}`, X + 2, Y - 10);
    }
    return { res: await post(name, sheet), errs };
  };
  // Sammelbild der kritischen Prüfung (→ tools/vorschau/stufe3-nah-final.png): Anschlüsse nah, je Zelle, was man sehen soll. Braucht für die
  // Bahn-Zellen tools/stufe3-bahn-szene.js (wird nachgeladen)
  window.s3pFinal = async (name = 'stufe3-nah-final.png') => {
    if (typeof window.s3bSzene !== 'function') await fetch('tools/stufe3-bahn-szene.js', { cache: 'reload' }).then(r => r.text()).then(t => (0, eval)(t));
    const H = (x, y, lvl, extra = {}) => ['haus', x, y, 0, { lvl, ...extra }];
    const bahn = (n, z, h = 34, o = {}) => async () => {
      await window.s3bSzene(n);
      const tr = trains[0];
      let u, v;
      if (o.ubahn) [u, v] = [...state.tiles].filter(([k, t]) => t.b === 'ubahn').map(([k]) => keyXY(k)).find(([x, y]) => hillLevel(x, y) > 0);
      else [u, v] = railPoint(tr.route, tr.c);
      const comp = await foto(u, v, h, z, o);
      window.s3bFertig();
      return comp;
    };
    const L = [
      { t: 'Reetdachhaus Kante +y (z 8): Garten endet an der Kante', hills: [[0, 0, 9, 9]], things: [H(3, 9, 3)], look: [2.9, 9.5, 8], z: 8 },
      { t: 'Kante +x: Garten und Schatten enden an der Kante', hills: [[0, 0, 9, 9]], things: [H(9, 3, 3)], look: [9.4, 2.7, 8], z: 8 },
      { t: 'BEHOBEN hinten −y: Garten ganz (war abgeschnitten)', hills: [[0, 0, 9, 9]], things: [H(4, 0, 3)], look: [4.4, 0.6, 26], z: 6 },
      { t: 'BEHOBEN hintere Ecke: Garten und Büsche ganz', hills: [[0, 0, 9, 9]], things: [H(0, 0, 3)], look: [0.4, 0.4, 26], z: 5 },
      { t: 'BEHOBEN innen: Schatten über dem Garten', hills: [[0, 0, 15, 15]], things: [H(6, 6, 3)], look: [6.4, 6.0, 20], z: 8 },
      { t: 'BEHOBEN Schule: Schatten ohne hellen Strich', hills: [[0, 0, 17, 17]], things: [['schule', 7, 7, 0, {}]], look: [8.2, 7.8, 30], z: 5 },
      { t: 'Ausbau-Stufen 1–6 an der Vorderkante', hills: [[0, 0, 9, 9]], things: [1, 2, 3, 4, 5, 6].map((l, i) => H(i, 9, l)), look: [2.6, 9.2, 30], z: 2.4 },
      { t: 'Sägewerk hintere Ecke: Hof, Holz, Schatten', hills: [[0, 0, 9, 9]], things: [['saege', 0, 0, 0, {}]], look: [0.6, 0.9, 30], z: 4 },
      { t: 'BEHOBEN Schloss 7×7 hinten: Schatten einfach', hills: [[0, 0, 9, 9]], things: [['schloss', 0, 0, 0, {}]], look: [6.2, 4.5, 30], z: 2.6 },
      { t: 'Zoo 4×4 vorn an der Ecke', hills: [[0, 0, 9, 9]], things: [['zoo', 6, 6, 1, {}]], look: [9.4, 9.4, 30], z: 2.6 },
      { t: 'Riesenrad 5×5 an der Kante +x', hills: [[0, 0, 9, 9]], things: [['riesenrad', 5, 3, 0, {}]], look: [9.4, 5.5, 20], z: 2.2 },
      { t: 'Theater: Tür zur Kante, kein Vorplatz drüber', hills: [[0, 0, 9, 9]], things: [['theater', 3, 7, 1, {}]], look: [4, 9.4, 20], z: 3 },
      { t: 'Hbf oben: Zug fährt in die Halle', custom: bahn(13, 5.5) },
      { t: 'Bahnhof oben an der Kante, Zug hält', custom: bahn(19, 4.5) },
      { t: 'U-Bahn-Eingang oben an der Kante', custom: bahn(16, 6, 34, { ubahn: true }) },
      { t: 'U-Bahn 👁: Treppe vom Tunnel hinauf', custom: bahn(16, 3, 34, { ubahn: true, see: true }) },
      { t: 'Gleis-Rampe A, Häuser beidseits oben', hills: [[0, 0, 9, 9]], ramps: [[4, 8, 0, 'a']], rails: [[4, 10], [4, 11], [4, 6], [4, 5]], things: [H(3, 8, 3), H(5, 8, 3), ['kiosk', 5, 9, 1, {}]], look: [4.4, 8.6, 20], z: 5 },
      { t: 'Treppe: Haus oben direkt dahinter', hills: [[0, 0, 9, 9]], stairs: [[4, 10]], things: [['haus', 4, 9, 1, { lvl: 3 }]], look: [4, 9.5, 20], z: 6 },
      { t: 'BEHOBEN Geist oben: Rahmen vorn voll breit', hills: [[0, 0, 9, 9]], ghost: ['haus', 4, 4, 0], look: [4, 4.2, 20], z: 5 },
      { t: 'Geist Theater an der Kante', hills: [[0, 0, 9, 9]], ghost: ['theater', 3, 7, 1], look: [4, 9.4, 20], z: 2.6 },
      { t: 'Nacht hinten (nachgemalt): Licht wie innen', hills: [[0, 0, 9, 9]], things: [H(4, 0, 3), ['cafe', 6, 0, 0, {}]], look: [5, 0.8, 30], z: 3.4, night: NIGHT_MAX },
      { t: 'Nacht: Häuser an der Vorderkante', hills: [[0, 0, 9, 9]], things: [H(3, 9, 4), ['cafe', 5, 9, 1, {}], ['hotel', 7, 8, 0, {}]], look: [5, 9.2, 30], z: 2.6, night: NIGHT_MAX },
      { t: 'weit (Bildchen z 1,2, ×3): hintere Kante', hills: [[0, 0, 9, 9]], things: [H(4, 0, 3), ['schule', 6, 0, 0, {}]], look: [4.6, 0.6, 30], z: 1.2, scale: 3 },
      { t: 'weit (WebGL z 0,8, ×4): Vorderkante', hills: [[0, 0, 9, 9]], things: [H(3, 9, 3), ['schule', 5, 8, 0, {}]], look: [4.5, 9.3, 20], z: 0.8, scale: 4 },
      { t: 'BEHOBEN Glasvilla: Becken ruhig wie unten', hills: [[0, 0, 9, 9]], things: [['haus', 4, 9, 0, { lvl: 6 }]], look: [4.3, 9.2, 20], z: 5 },
    ];
    return window.s3pBlatt(name, L, { cols: 5, C: 900 });
  };
})();
