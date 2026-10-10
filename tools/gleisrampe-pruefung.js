// Nahaufnahmen Gleis-Rampe (kritische Prüfung, 10.10.2026): alle Formen A–D in allen vier Drehungen, echt gebaut (build, Spielregeln), mit
// Gleis vor dem Fuß und oben weiter und einem Zug auf der Schräge (Verdeckung); dazu Zug an Fuß und Oberkante, Gleis oben an der Kante,
// Bahnübergang oben. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/gleisrampe-pruefung.js').then(r => r.text()).then(t => (0, eval)(t)); await gleisrampePruefung()  → tools/vorschau/gleisrampe-nah-final.png
// await grSzene(n) baut nur Szene n und zeigt sie; await grEinzel(n, 'name.png', z) schickt sie in voller Auflösung
(function gleisrampePruefung() {
  const R = 16, UP = [[0, -1], [1, 0], [0, 1], [-1, 0]], DIRN = ['hinauf −y', 'hinauf +x', 'hinauf +y', 'hinauf −x'];
  // Szene: form, rot, at: Lage des Zugs längs der Strecke (0 = Fuß-Vorderkante … len = Oberkante; null = kein Zug), z, extra (Zusatz)
  const S = [];
  for (const form of ['a', 'b', 'c', 'd']) for (const rot of [0, 1, 2, 3]) S.push({ form, rot, at: 'mid', z: 5 });
  for (const form of ['a', 'b', 'c', 'd']) S.push({ form, rot: form === 'a' || form === 'c' ? 3 : 0, at: 'top', z: 6, t: 'Zug an der Oberkante' });
  S.push({ form: 'b', rot: 1, at: 'foot', z: 6, t: 'Zug am Fuß' });
  S.push({ form: 'c', rot: 2, at: 'top', z: 6, t: 'Zug an der Oberkante' });
  S.push({ form: 'a', rot: 0, at: null, z: 7, t: 'Fuß nah', look: 'foot' });
  S.push({ form: 'd', rot: 0, at: null, z: 7, t: 'Oberkante nah', look: 'top' });
  S.push({ form: 'b', rot: 0, at: null, z: 5, t: 'Kante: Gleis oben, unten längs der Wand', edge: true, look: 'edge' });
  S.push({ form: 'a', rot: 1, at: null, z: 5, t: 'Bahnübergang oben', cross: true, look: 'cross' });
  S.push({ form: 'b', rot: 2, at: null, z: 5, t: 'Bogenbrücke oben', cross: true, foot: true, look: 'cross' });
  for (const rot of [0, 3]) S.push({ form: 'a', rot, at: null, z: 5, t: 'quer zur Kante (Prellböcke)', perp: true, look: 'perp' });
  for (const [form, rot] of [['a', 0], ['c', 3], ['a', 1]]) S.push({ form, rot, at: 'mid', z: 5, t: 'vordere Wange abgetragen', cheek: true });
  for (const rot of [0, 1]) S.push({ form: 'b', rot, at: 'edge', z: 5, t: 'Zug oben an der Kante', edge: true, look: 'zug' });
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
  // Anhöhe 0–6 × 0–6 um die Mitte; die Rampe kommt in der Mitte der Seite −D heran
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 3, c0.y - 3]; }
    const [bx, by] = base, F = RAMP_FORMS[s.form], D = UP[s.rot], O = [-D[0], -D[1]], len = F.len;
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    clear(bx, by);
    for (let y = 0; y <= 6; y++) for (let x = 0; x <= 6; x++) build('anhoehe', bx + x, by + y, true);
    recalc();
    const c = [bx + 3, by + 3], e = add(c, O, 3);                       // Randfeld der Anhöhe auf der Seite, von der die Rampe kommt
    const top = F.cut ? add(e, D, F.cut - 1) : add(e, O, 1), foot = add(top, O, len - 1);
    const fields = [...Array(len).keys()].map(i => add(foot, D, i)), ax = Math.min(...fields.map(f => f[0])), ay = Math.min(...fields.map(f => f[1]));
    const errs = [];
    rampNewForm = s.form; rotManual = true; buildRot = s.rot;
    const er = placeError('huegelrampe', ax, ay);
    if (er) errs.push('Rampe: ' + er); else build('huegelrampe', ax, ay);
    rotManual = false; buildRot = 0;
    const below = [1, 2, 3, 4].map(k => add(foot, O, k)), above = [1, 2, 3].map(k => add(top, D, k));
    for (const [x, y] of [...below, ...above]) { const e2 = placeError('schiene', x, y); if (e2) errs.push(`Schiene ${x},${y}: ${e2}`); else build('schiene', x, y, true); }
    if (s.edge) {                                                        // oben längs der Kante neben der Rampe, unten längs der Wand davor
      const Sd = [-D[1], D[0]];
      for (let k = 1; k <= 3; k++) for (const p of [add(e, Sd, k), add(add(e, O, 1), Sd, k + 1)]) { const e2 = placeError('schiene', ...p); if (e2) errs.push(`Kante ${p}: ${e2}`); else build('schiene', p[0], p[1], true); }
    }
    if (s.cheek) {                                                       // vordere Wange der eingelassenen Felder abtragen (geht: lowerHill)
      const Sd = [-D[1], D[0]], sg = Sd[0] + Sd[1] > 0 ? 1 : -1;
      for (let i = 0; i < F.cut; i++) { const p = add(add(top, O, i), Sd, sg); if (!lowerHill(p[0], p[1])) errs.push('Wange ' + p); }
    }
    if (s.perp) {                                                        // neben der Rampe: oben und unten je ein Gleis quer auf die Kante zu, getrennt
      const Sd = [-D[1], D[0]];
      for (let k = 0; k < 3; k++) for (const p of [add(add(e, Sd, 2), D, k), add(add(e, Sd, 2), O, k + 1)]) { const e2 = placeError('schiene', ...p); if (e2) errs.push(`Quer ${p}: ${e2}`); else build('schiene', p[0], p[1], true); }
    }
    if (s.cross) {                                                       // Weg oben quer über das Gleis oben (Bahnübergang), daneben ein Gleis oben zur Kante hin
      const Sd = [-D[1], D[0]], m = add(top, D, 2);
      for (const k of [-2, -1, 1, 2]) { const p = add(m, Sd, k); build('weg', p[0], p[1], true); }
      const e2 = crossCandidate('weg', m[0], m[1]) ? crossError('weg', m[0], m[1]) : 'kein Übergang';
      if (e2) errs.push('Übergang: ' + e2); else build('weg', m[0], m[1], true);
      if (s.foot && !setCrossing(m[0], m[1], true, 'stein')) errs.push('Bogenbrücke');
      const q = add(m, Sd, -3);
      for (let k = 0; k < 3; k++) { const p = add(q, Sd, -k); if (hillAt(p[0], p[1])) build('schiene', p[0], p[1], true); }
    }
    recalc(); groundVersion++; floats.length = 0;
    trains.length = 0;
    if (s.at === 'edge') {                                               // Zug oben längs der Kante (Gleis an der Kante, s.edge)
      const Sd = [-D[1], D[0]], route = railPolyline([1, 2, 3].map(k => add(e, Sd, k).join()));
      trains.push({ id: 'pruef', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind: { ...TRAIN_KIND.regio, n: 2 }, c: route.len / 2, dir: 1, wait: 1e9, next: 1 });
    } else if (s.at) {
      const keys = [...below.slice().reverse(), ...fields, ...above].map(p => p.join());
      const route = railPolyline(keys), d0 = 4 + (s.at === 'mid' ? len / 2 : s.at === 'top' ? len + 0.1 : 0.05);
      const kind = { ...TRAIN_KIND.regio, n: 3 };
      trains.push({ id: 'pruef', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind, c: d0 - 0.5, dir: 1, wait: 1e9, next: 1 });
    }
    return { errs, foot, top, e, D, O };
  }
  async function show(s, g0) {
    const [ux, uy] = s.look === 'zug' ? add(g0.e, [-g0.D[1], g0.D[0]], 2) : s.look === 'perp' ? add(add(g0.e, [-g0.D[1], g0.D[0]], 2), g0.O, 0.5) : s.look === 'foot' ? add(g0.foot, g0.O, 0.6) : s.look === 'top' ? add(g0.top, g0.D, 0.5) : s.look === 'edge' || s.look === 'cross' ? add(g0.top, g0.D, 1) : add(g0.foot, g0.D, (RAMP_FORMS[s.form].len - 1) / 2);
    const h = s.look === 'zug' ? 30 : s.look === 'perp' ? 14 : s.look === 'foot' ? 3 : s.look === 'top' || s.look === 'cross' || s.look === 'edge' ? 24 : 14, p = iso(ux, uy);
    cam.x = p.x; cam.y = p.y - h; cam.z = s.z;
    const n0 = nightAt;
    if (!window.__grSync) window.__grSync = syncTrains;                  // bis grFertig: der Prüf-Zug bleibt stehen
    nightAt = () => 0; syncTrains = () => {};
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 10; k++) { walkers.length = 0; render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }   // keine Bewohner (auch nicht die eigene Figur) im Bild
      spriteNoBudget = false;
      walkers.length = 0; render(performance.now() + 300);
    } finally { nightAt = n0; }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    return comp;
  }
  const title = s => `${s.form.toUpperCase()} ${DIRN[s.rot]}${s.t ? ' · ' + s.t : ''}`;
  window.grSzenen = S;
  window.grSzene = async n => { const s = S[n], g0 = build1(s), comp = await show(s, g0); return { errs: g0.errs, t: title(s), comp }; };
  window.grFertig = () => { if (window.__grSync) { syncTrains = window.__grSync; syncTrains.sig = null; delete window.__grSync; } trains.length = 0; };
  window.gleisrampePruefung = async (name = 'gleisrampe-nah-final.png', only = null) => {
    const list = only || S.map((_, i) => i), C = 880, cols = 5, rows = Math.ceil(list.length / cols), T = 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 50) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = S[list[j]], g0 = build1(s);
      if (g0.errs.length) errs.push(title(s) + ': ' + g0.errs.join('; '));
      const comp = await show(s, g0), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 50) + 34;
      sx.drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, X, Y, C * T, C * T);
      sx.font = '800 14px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(title(s), X + 2, Y - 10);
    }
    let res;
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') }); res = await r.text(); } catch (e) { res = 'kein Sammler'; }
    return { res, errs };
  };
  window.grEinzel = async (n, name, z, C = 1000) => {
    const s = { ...S[n], ...(z ? { z } : {}) }, g0 = build1(s), comp = await show(s, g0), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return [await r.text(), g0.errs]; } catch (e) { return ['kein Sammler', g0.errs]; }
  };
})();
