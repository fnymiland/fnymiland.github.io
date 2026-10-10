// Nahaufnahmen Bergportal (Block 157m, Prüfung vor dem Melden): echt gebaut (build, Spielregeln) – Anhöhe, Portal in der Wand, davor die Schiene,
// dahinter der Tunnel, ein Zug halb drin. Beide sichtbaren Wände (+y, +x), alle drei Wandarten, beide Formen; dazu hintere Wände, Naht an der
// Wandlinie (Zoom 8), Nacht, weit weg. Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/bergportal-pruefung.js').then(r => r.text()).then(t => (0, eval)(t)); await bpPruefung()  → tools/vorschau/bergportal-final.png
// await bpSzene(n) baut nur Szene n und zeigt sie; await bpEinzel(n, 'name.png', z) schickt sie in voller Auflösung
(function bergportalPruefung() {
  const R = 14, UP = [[0, -1], [1, 0], [0, 1], [-1, 0]], WAND = ['vorn links (+y)', 'hinten rechts (−x)', 'hinten links (−y)', 'vorn rechts (+x)'];
  const FORM = ['A Steinbogen', 'D Öffnung'];
  // Szene: kind (Wandart), form, rot (in die Anhöhe), at (Wagen: Lage der Mitte des vorderen hinter der Wand, null = kein Zug), z, t (Zusatz)
  const S = [];
  for (const kind of ['fels', 'erde', 'mauer']) for (const form of [0, 1]) for (const rot of [0, 3]) S.push({ kind, form, rot, at: 0.12, z: 5 });
  for (const rot of [0, 3]) S.push({ kind: 'fels', form: 0, rot, at: null, z: 8, t: 'Naht an der Wand', look: 'naht' });
  for (const rot of [0, 3]) S.push({ kind: 'mauer', form: 1, rot, at: null, z: 8, t: 'Naht an der Wand', look: 'naht' });
  for (const kind of ['fels', 'erde', 'mauer']) for (const rot of [0, 3]) S.push({ kind, form: kind === 'erde' ? 1 : rot ? 1 : 0, rot, at: 0.12, z: 8, t: 'Zug halb drin, nah', look: 'naht' });
  for (const rot of [0, 3]) S.push({ kind: 'fels', form: 0, rot, at: 0.6, z: 6, t: 'Wagen ganz drin' });
  for (const rot of [0, 3]) S.push({ kind: 'erde', form: 1, rot, at: -0.25, z: 6, t: 'Wagen kurz vor der Wand' });
  for (const rot of [1, 2]) S.push({ kind: 'fels', form: 0, rot, at: 0.12, z: 2.5, t: 'hintere Wand (Anhöhe verdeckt den Zug)' });
  for (const rot of [0, 3]) S.push({ kind: 'fels', form: rot ? 1 : 0, rot, at: 0.12, z: 5, t: 'Nacht', night: true });
  S.push({ kind: 'fels', form: 0, rot: 0, at: 0.12, z: 1.2, t: 'weit weg', far: true });
  S.push({ kind: 'mauer', form: 1, rot: 3, at: 0.12, z: 0.7, t: 'ganz weit weg', far: true });
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
  // Anhöhe 0–6 × 0–6; das Portal in der Mitte der Seite −D (D = in die Anhöhe), Schiene 4 Felder davor, Tunnel 3 Felder dahinter
  function build1(s) {
    if (!base) { const c0 = toTile(W / 2, H / 2); base = [c0.x - 3, c0.y - 3]; }
    const [bx, by] = base, D = UP[s.rot], O = [-D[0], -D[1]];
    if (typeof setTool === 'function' && tool !== 'look') setTool('look');   // sonst kein WebGL weit weg (glFrameOk: Werkzeug gewählt)
    state.money = 1e9; for (const t of TECHS) state.techs.add(t.id); for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    clear(bx, by);
    state.paintNew.anhoehe = { form: ['fels', 'erde', 'mauer'].indexOf(s.kind) };
    for (let y = 0; y <= 6; y++) for (let x = 0; x <= 6; x++) build('anhoehe', bx + x, by + y, true);
    recalc();
    const c = [bx + 3, by + 3], P = add(c, O, 3), errs = [];
    state.paintNew.bergportal = { form: s.form };
    rotManual = false; buildRot = s.rot;
    for (let k = 1; k <= 4; k++) { const p = add(P, O, k), e2 = placeError('schiene', ...p); if (e2) errs.push(`Schiene ${p}: ${e2}`); else build('schiene', p[0], p[1], true); }
    for (let k = 1; k <= 3; k++) { const p = add(P, D, k), e2 = placeError('tunnel', ...p); if (e2) errs.push(`Tunnel ${p}: ${e2}`); else build('tunnel', p[0], p[1], true); }
    const r = placeRot('bergportal', ...P), er = placeError('bergportal', ...P);
    if (r !== s.rot) errs.push(`Drehung ${r} statt ${s.rot}`);
    if (er) errs.push('Portal: ' + er); else build('bergportal', P[0], P[1]);
    buildRot = 0;
    recalc(); groundVersion++; floats.length = 0;
    trains.length = 0;
    if (s.at != null) {
      const keys = [4, 3, 2, 1].map(k => add(P, O, k).join()).concat([P.join()], [1, 2, 3].map(k => add(P, D, k).join()));
      const route = railPolyline(keys), kind = { ...TRAIN_KIND.regio, n: 2 }, wall = 3.5;
      trains.push({ id: 'pruef', route, stops: [0, route.len], powered: true, model: 'regio', col: 0, kind, c: wall + s.at - (kind.len + kind.gap) / 2, dir: 1, wait: 1e9, next: 1 });
    }
    return { errs, P, D, O };
  }
  async function show(s, g0) {
    const back = s.rot === 1 || s.rot === 2, [ux, uy] = back ? g0.P : s.look === 'naht' ? add(g0.P, g0.O, 0.55) : add(g0.P, g0.O, 0.7), p = iso(ux, uy);
    cam.x = p.x; cam.y = p.y - (back ? 18 : s.look === 'naht' ? 6 : 9); cam.z = s.z;
    const n0 = nightAt;
    if (!window.__bpSync) window.__bpSync = syncTrains;                  // bis bpFertig: der Prüf-Zug bleibt stehen
    nightAt = () => (s.night ? NIGHT_MAX : 0); syncTrains = () => {};
    try {
      spriteNoBudget = true;
      for (let k = 0; k < 10; k++) { walkers.length = 0; render(performance.now() + k * 16); await new Promise(r => setTimeout(r, 0)); }
      spriteNoBudget = false;
      walkers.length = 0; render(performance.now() + 300);
    } finally { nightAt = n0; }
    const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
    const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
    comp.gl = typeof GL !== 'undefined' && GL.shown;
    return comp;
  }
  const title = (s, gl) => `${FORM[s.form]} · ${s.kind} · ${WAND[s.rot]}${s.t ? ' · ' + s.t : ''} · z ${s.z}${gl ? ' · WebGL' : ''}`;
  window.bpSzenen = S;
  window.bpSzene = async n => { const s = S[n], g0 = build1(s), comp = await show(s, g0); return { errs: g0.errs, t: title(s), comp }; };
  window.bpFertig = () => { if (window.__bpSync) { syncTrains = window.__bpSync; syncTrains.sig = null; delete window.__bpSync; } trains.length = 0; };
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.bpPruefung = async (name = 'bergportal-final.png', only = null) => {
    const list = only || S.map((_, i) => i), C = 760, cols = 5, rows = Math.ceil(list.length / cols), T = 0.5;
    const sheet = document.createElement('canvas'); sheet.width = cols * (C * T + 16) + 16; sheet.height = rows * (C * T + 50) + 16;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    for (let j = 0; j < list.length; j++) {
      const s = S[list[j]], g0 = build1(s);
      if (g0.errs.length) errs.push(title(s) + ': ' + g0.errs.join('; '));
      const comp = await show(s, g0), X = 16 + (j % cols) * (C * T + 16), Y = 16 + Math.floor(j / cols) * (C * T + 50) + 34;
      const Cs = s.far ? C / 3 : C;                                       // weit weg: Ausschnitt ums Portal vergrößert (×3)
      sx.drawImage(comp, comp.width / 2 - Cs / 2, comp.height / 2 - Cs / 2, Cs, Cs, X, Y, C * T, C * T);
      sx.font = '800 12px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(title(s, comp.gl), X + 2, Y - 10);
    }
    return { res: await post(name, sheet), errs };
  };
  window.bpEinzel = async (n, name, z, C = 900) => {
    const s = { ...S[n], ...(z ? { z } : {}) }, g0 = build1(s), comp = await show(s, g0), cv = document.createElement('canvas'); cv.width = C; cv.height = C;
    cv.getContext('2d').drawImage(comp, comp.width / 2 - C / 2, comp.height / 2 - C / 2, C, C, 0, 0, C, C);
    return [await post(name, cv), g0.errs, comp.gl];
  };
  return S.length;
})();
