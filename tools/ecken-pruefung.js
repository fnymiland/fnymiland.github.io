// Prüfstand Brückenecken (Nutzer 16.10.2026: „Die Ecken sehen überhaupt nicht gut aus – alle Ecken in alle Richtungen“): Gleisbrücken und
// Wasser-Wegbrücken je Material, Ecke in allen vier Richtungen, dazu T und X; je Fall ein eigenes Wasserbecken. Im Browser (?welt=neu,
// Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/ecken-pruefung.js')).text()); eckenAufbau(); await eckenBilder('ecken-vorher')   → tools/vorschau/ecken-vorher.png
// eckenBilder(name, { only: ['gleis stein'], z: 2.2, night: true })
(function eckenPruefung() {
  const MATS = ['holz', 'stahl', 'stein', 'kristall'], CELL = 10, X0 = 4, Y0 = 4;
  // Ecke: Arme vom Eckfeld aus (je 3 Felder Wasser, dahinter 2 Felder Land); T: drei Arme, X: vier
  const FORMS = [['Ecke O+S', [[1, 0], [0, 1]]], ['Ecke W+S', [[-1, 0], [0, 1]]], ['Ecke O+N', [[1, 0], [0, -1]]], ['Ecke W+N', [[-1, 0], [0, -1]]],
    ['T', [[1, 0], [-1, 0], [0, 1]]], ['X', [[1, 0], [-1, 0], [0, 1], [0, -1]]]];
  const cases = [];
  function clearArea(x0, y0, x1, y1) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k);
    }
  }
  window.eckenAufbau = () => {
    closeModal(); closePanel(); setTool('look');
    state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const t of TECHS) state.techs.add(t.id);
    if (!state.legacy) state.legacy = new Set(); state.legacy.add('brmat:kristall'); state.restore.klippe = 1; state.restore.kristall = 1;
    const kinds = [...MATS.map(m => ['gleis', m]), ...MATS.map(m => ['weg', m])];
    clearArea(X0 - 2, Y0 - 2, X0 + FORMS.length * CELL + 2, Y0 + kinds.length * CELL + 2); state.edges.clear(); state.bruecken.clear();
    cases.length = 0;
    kinds.forEach(([art, mat], r) => FORMS.forEach(([fname, arms], c) => {
      const cx = X0 + c * CELL + 4, cy = Y0 + r * CELL + 4;
      for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) state.terra.set(x + ',' + y, 'water');
      const cells = [[cx, cy, true]];
      for (const [dx, dy] of arms) for (let i = 1; i <= 5; i++) cells.push([cx + dx * i, cy + dy * i, i <= 3]);
      for (const [x, y, water] of cells) {
        if (art === 'gleis') state.tiles.set(x + ',' + y, { b: 'schiene', lvl: 1, form: 0, ...(water ? { bridge: true } : {}) });
        else state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: 'sand', ...(water ? { bridge: true } : {}) });
      }
      cases.push({ name: `${art} ${mat} · ${fname}`, art, mat, x: cx, y: cy });
    }));
    terrainCache.clear(); sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++; recalc();
    const bad = [];
    for (const k of cases) if (k.mat !== 'holz' && !brSet({ at: k.art === 'gleis' ? 'gleis' : 'wasser', x: k.x, y: k.y }, { mat: k.mat })) bad.push(k.name);
    for (const t of state.tiles.values()) delete t.born;
    recalc(); groundVersion++; floats.length = 0; critters.length = 0;
    return bad.length ? 'nicht gesetzt: ' + bad.join(', ') : 'ok ' + cases.length;
  };
  function shot(x, y, z, W, H, night) {
    const p = iso(x, y); cam.x = p.x; cam.y = p.y - 10; cam.z = z;
    const na = nightAt, gh = gameHour;
    nightAt = () => (night ? NIGHT_MAX : 0); gameHour = () => (night ? 23 : 12);
    try { resetDrawCaches(); groundVersion++; const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200); }
    finally { nightAt = na; gameHour = gh; }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g2 = c.getContext('2d');
    g2.fillStyle = '#fffaf0'; g2.fillRect(0, 0, W, H); g2.drawImage(canvas, canvas.width / 2 - W / 2, canvas.height / 2 - H / 2, W, H, 0, 0, W, H);
    return c;
  }
  window.eckenBilder = async (name = 'ecken', opts = {}) => {
    closeModal(); closePanel(); setTool('look');
    const list = cases.filter(k => !opts.only || opts.only.some(o => k.name.includes(o))), W = opts.W || 460, H = opts.H || 360, cols = opts.cols || 6;
    const shots = list.map(k => [shot(k.x + (opts.dx || 0), k.y + (opts.dy || 0), opts.z || 2, W, H, !!opts.night), k.name]);
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 12); sheet.height = rows * (H + 40);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 12), Y = Math.floor(i / cols) * (H + 40) + 30; sx.drawImage(c, X, Y); sx.font = '700 17px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 8); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name + '.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
