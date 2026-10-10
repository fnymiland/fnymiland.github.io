// Figuren auf Anhöhen, Stufe 3 (Block 157j): Bewohner kommen aus einem Haus oben (Tür zum Ausstieg der Treppe) und gehen die Treppe hinunter
// zum Café unten – die Lagen stammen aus einem echten Lauf (setGoal, stepWalker), je Lage eine angeheftete Figur. Alle vier Richtungen der
// Treppe (Übersicht und Nahaufnahme am oberen Ende bzw. am Fuß), dazu Figuren vor/hinter einer Schule oben und an der Tür eines Hauses an der Kante.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/stufe3-figuren-szene.js').then(r => r.text()).then(t => (0, eval)(t)); await stufe3Figuren()   → tools/vorschau/stufe3-figuren.png
// await stufe3FigurEinzel(n, 'name.png', z) schickt Szene n in voller Auflösung
(function stufe3FigurenSzene() {
  const R = 10;
  // Treppe je Richtung (Anhöhe 0..4 × 0..4): Fuß, Haus oben direkt dahinter (Tür zum Ausstieg), Weg unten, Café am Wegende
  const DIR = [
    { t: 'hinauf nach hinten', stair: [2, 5], house: [2, 3, 1], weg: [[2, 6], [2, 7], [3, 7], [2, 4]], cafe: [4, 7] },
    { t: 'hinauf nach rechts', stair: [-1, 2], house: [1, 2, 2], weg: [[-2, 2], [-3, 2], [-3, 3], [0, 2]], cafe: [-3, 4] },
    { t: 'hinauf nach vorn', stair: [2, -1], house: [2, 1, 3], weg: [[2, -2], [2, -3], [3, -3], [2, 0]], cafe: [4, -3] },
    { t: 'hinauf nach links', stair: [5, 2], house: [3, 2, 0], weg: [[6, 2], [7, 2], [7, 3], [4, 2]], cafe: [7, 4] },
  ];
  const S = [];
  for (const d of DIR) S.push({ ...d, kind: 'weg', t: 'Treppe ' + d.t, look: [d.stair[0], d.stair[1], 18], z: 3 });
  for (const d of DIR) S.push({ ...d, kind: 'weg', t: 'oben nah: ' + d.t, near: 'top', z: 6.5 });
  for (const d of DIR) S.push({ ...d, kind: 'weg', t: 'Fuß nah: ' + d.t, near: 'foot', z: 6.5 });
  // hohe Gebäude oben: Schule 2×2, Figuren dahinter (teils verdeckt), daneben, davor; Haus an der rechten Kante mit Tür zur Kante (die nutzt
  // keiner – Figuren an den anderen Seiten); Figuren unten vor der Wand
  const big = [['schule', 2, 2, 1], ['haus', 5, 1, 0, { lvl: 3 }], ['theater', 2, 5, 1]];
  S.push({ kind: 'gross', t: 'vor und hinter der Schule oben', hills: [[0, 0, 5, 6]], things: big,
    figs: [[1.4, 1.4], [2.5, 1.35], [1.35, 2.5], [4.0, 2.4], [4.1, 3.6], [1.0, 3.9], [5.0, 0.0], [4.2, 1.0], [6.4, 3.0], [6.2, 5.4], [3.0, 7.3]], look: [3, 3.5, 40], z: 2.6 });
  S.push({ kind: 'gross', t: 'nah: hinter der Schule oben', hills: [[0, 0, 5, 6]], things: big, figs: [[1.4, 1.4], [2.5, 1.35], [1.35, 2.5]], look: [2, 2, 50], z: 6 });
  S.push({ kind: 'gross', t: 'nah: Haus an der Kante, Türen oben', hills: [[0, 0, 5, 6]], things: big, figs: [[5.0, 0.05], [4.05, 1.0], [5.0, 2.0], [6.3, 1.2]], look: [5.2, 1.2, 30], z: 6 });
  S.push({ kind: 'gross', t: 'nah: unten vor der Wand, Theater oben', hills: [[0, 0, 5, 6]], things: big, figs: [[3.0, 7.3], [2.0, 7.2], [6.2, 5.4]], look: [3.5, 6.4, 30], z: 5 });
  S.push({ ...DIR[0], kind: 'weg', t: 'weit weg (Zoom 1,2)', look: [2, 3, 18], z: 1.2 });
  window.stufe3FigurSzenen = S;

  let base = null;
  function clear(bx, by) {
    for (let y = by - R; y <= by + R; y++) for (let x = bx - R; x <= bx + R; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); state.roofs.delete(k);
    }
    for (const k of [...state.edges.keys()]) { const [mx, my] = edgeMid(k); if (Math.abs(mx - bx) <= R + 1 && Math.abs(my - by) <= R + 1) state.edges.delete(k); }
    hillWalkers.length = 0; walkers.length = 0; strollers.length = 0; paraders.length = 0; roofers.length = 0; critters.length = 0; floats.length = 0;
    recalc();
  }
  // Gebäude setzen: über build (Spielregeln), sonst direkt (falls die Regeln es noch sperren)
  function place(b, x, y, rot, extra = {}) {
    rotManual = true; buildRot = rot || 0;
    const e = placeError(b, x, y);
    if (!e) build(b, x, y, true); else state.tiles.set(x + ',' + y, { b, rot: rot || 0, lvl: 1, ...extra });
    rotManual = false; buildRot = 0;
    const t = state.tiles.get(x + ',' + y);
    if (t) Object.assign(t, extra);
    recalc();
    return e;
  }
  const pin = (u, v, i) => {
    const a = ANIMALS[(i * 5 + 2) % ANIMALS.length], x = Math.round(u), y = Math.round(v);
    walkers.push({ fx: x, fy: y, tx: x, ty: y, px: u, py: v, t: 0, wait: 1e9, pin: true, kind: ANIMALS.indexOf(a), fur: a.fur || FUR[i % FUR.length],
      shirt: SHIRTS[(i + 2) % SHIRTS.length], speed: 0.8, goal: { kind: 'bummel' }, path: null, steps: 1e9 });
  };
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 2, c0.y - 2]; }
    const [bx, by] = base, errs = [];
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    clear(bx, by);
    chosenStyle.weg = wegStyleOf('kopf'); chosenStyle.huegeltreppe = wegStyleOf('kopf');
    for (const [x0, y0, x1, y1] of s.hills || [[0, 0, 4, 4]]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) build('anhoehe', bx + x, by + y, true);
    if (s.kind === 'gross') {
      for (const [b, x, y, rot, ex] of s.things) { const e = place(b, bx + x, by + y, rot, ex); if (e) errs.push(`${b}: ${e} (direkt gesetzt)`); }
      s.figs.forEach(([u, v], i) => pin(bx + u, by + v, i));
      floats.length = 0;
      return errs;
    }
    const [sx, sy] = s.stair, [hx, hy, hr] = s.house;
    { const e = placeError('huegeltreppe', bx + sx, by + sy); if (e) errs.push('Treppe: ' + e); else build('huegeltreppe', bx + sx, by + sy); }
    for (const [x, y] of s.weg) build('weg', bx + x, by + y, true);
    { const e = place('haus', bx + hx, by + hy, hr, { lvl: 3, animal: 2 }); if (e) errs.push('Haus: ' + e + ' (direkt gesetzt)'); }
    place('cafe', bx + s.cafe[0], by + s.cafe[1], 0);
    recalc(); groundVersion++;
    // echter Lauf: ein Bewohner tritt aus der Tür am Ausstieg und geht zum Café
    const s0 = stairAt(bx + sx, by + sy), up = s0 ? STAIR_UP[stairRotOf(s0)] : [0, 0], door = [bx + sx + up[0], by + sy + up[1]];
    const w = { fx: door[0], fy: door[1], tx: door[0], ty: door[1], px: door[0], py: door[1], t: 1, wait: 0, speed: 1, ...residentLook((bx + hx) + ',' + (by + hy), 0), shirt: '#f00' };
    if (!setGoal(w, 'essen')) errs.push('kein Weg zum Café');
    const pts = [];
    for (let i = 0; i < 4000 && !(w.inside > 0) && !w.gone; i++) { stepWalker(w, 0.02); pts.push([w.px, w.py]); }
    if (!(w.inside > 0)) errs.push('nicht angekommen');
    s.route = pts;
    // Lagen: an der Tür, oben auf dem Ausstieg, auf der Treppe (oben, Mitte, unten), am Fuß, auf dem Weg
    const along = ([u, v]) => (u - (bx + sx)) * -up[0] + (v - (by + sy)) * -up[1];   // 0 = Treppenmitte, + = hinunter
    const pick = [-1.0, -0.6, -0.3, 0.0, 0.3, 0.6, 1.2].map(a => pts.reduce((b, p) => Math.abs(along(p) - a) < Math.abs(along(b) - a) ? p : b, pts[0]));
    const show = s.near === 'top' ? pick.slice(0, 4) : s.near === 'foot' ? pick.slice(3) : pick;
    show.forEach(([u, v], i) => pin(u, v, i));
    floats.length = 0;                                                   // keine Preis-Zahlen im Bild
    s.lookAt = s.near === 'top' ? [door[0] - up[0] * 0.5, door[1] - up[1] * 0.5, 26] : s.near === 'foot' ? [bx + sx - up[0] * 0.5, by + sy - up[1] * 0.5, 6] : null;
    return errs;
  }
  async function show(s) {
    const [bx, by] = base, [u, v, h] = s.lookAt || [bx + s.look[0], by + s.look[1], s.look[2]], p = iso(u, v);
    cam.x = p.x; cam.y = p.y - h; cam.z = s.z;
    const keep = [gameHour, syncMovers];
    gameHour = () => 12; syncMovers = () => {};                         // nur die angehefteten Figuren
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 12; k++) { render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      render(performance.now() + 300);
    } finally { [gameHour, syncMovers] = keep; }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  window.stufe3FigurSzene = async (n, z) => { const s = { ...S[n], ...(z ? { z } : {}) }, errs = build1(s), comp = await show(s); return { errs, t: s.t, comp }; };
  window.stufe3Figuren = async (name = 'stufe3-figuren.png', only = null) => {
    const list = only || S.map((_, i) => i), C = 900, cols = 4, rows = Math.ceil(list.length / cols), T = 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 58) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = { ...S[list[j]] }, e = build1(s);
      if (e.length) errs.push(s.t + ': ' + e.join('; '));
      const comp = await show(s), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 58) + 40;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C * T, C * T);
      sx.font = '800 16px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(s.t, X + 4, Y - 10);
    }
    let res;
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') }); res = await r.text(); } catch (e) { res = 'kein Sammler'; }
    return { res, errs };
  };
  window.stufe3FigurEinzel = async (n, name, z, C = 1000) => {
    const { errs, comp } = await window.stufe3FigurSzene(n, z), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return [await r.text(), errs]; } catch (e) { return ['kein Sammler', errs]; }
  };
})();
