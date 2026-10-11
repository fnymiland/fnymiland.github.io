// Entwurf (Nutzer 11.10.2026: „Wege drehen können – Textur dreht sich mit“, gewählt C: Richtung automatisch nach Zugrichtung, R dreht um): nur
// Bild, kein Spielcode geändert. pattern() wird für die Wegfelder der Bühne um 90° gedreht gezeichnet (Weltraster mitgedreht, damit gedrehte Stücke
// unter sich nahtlos bleiben); Randfuge: Strich, wo zwei Richtungen aneinanderstoßen.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// (0, eval)(await (await fetch('tools/weg-drehen-entwurf.js')).text()); await wegDrehBild()   → tools/vorschau/weg-drehen.png
(function wegDrehen() {
  const MUSTER = [['holz', 'Holzbohlen', 1, 0], ['klinker', 'Klinker', 0, 1]];   // [Muster, Name, Drehung waagrechter Arm, senkrechter Arm] bei C
  const PANELS = ['heute: alles gleich', 'C: folgt der Zugrichtung', 'C + Randfuge'];
  const rot = new Map(), seam = new Set();                                         // "x,y" → 0/1; Bühnen mit Randfuge (Ursprung "ox,oy")
  const O = {};
  // T-Kreuzung: waagrecht 7 Felder (y = oy+3), Abzweig nach oben 3 Felder (x = ox+3)
  const cells = (ox, oy) => [...Array.from({ length: 7 }, (_, i) => [ox + i, oy + 3, 'h']), ...Array.from({ length: 3 }, (_, i) => [ox + 3, oy + i, 'v'])];
  const stages = () => MUSTER.flatMap(([m, , a, b], r) => PANELS.map((p, c) => ({ m, a, b, c, ox: c * 12, oy: r * 12 })));
  function setup() {
    for (let y = -4; y <= 28; y++) for (let x = -4; x <= 34; x++) {
      const k = x + ',' + y, an = anchorAt(x, y);
      if (an) state.tiles.delete(an);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    state.edges.clear(); state.money = 1e9;
    rot.clear(); seam.clear();
    for (const s of stages()) {
      const style = wegStyleOf(s.m);
      for (const [x, y, arm] of cells(s.ox, s.oy)) {
        build('weg', x, y, true); const t = state.tiles.get(x + ',' + y); if (t) { t.style = style; delete t.born; }   // born: sonst noch in der Bau-Animation
        rot.set(x + ',' + y, s.c === 0 ? 0 : arm === 'h' ? s.a : s.b);
      }
      if (s.c === 2) seam.add(s.ox + ',' + s.oy);
    }
    recalc(); floats.length = 0;
  }
  const stageOf = (x, y) => stages().find(s => x >= s.ox && x < s.ox + 12 && y >= s.oy && y < s.oy + 12);
  function patched(fn) {
    O.pattern = pattern;
    window.pattern = (L, kind, x, y, z, col, cols, ext = 0, box = null, bg = null) => {
      const k = x + ',' + y;
      if (!rot.has(k)) return O.pattern(L, kind, x, y, z, col, cols, ext, box, bg);
      const r = rot.get(k);
      if (r) O.pattern(p => L([-p[1], p[0]]), kind, y, -x, z, col, cols, ext, box && [box[2], box[3], -box[1], -box[0]], bg);
      else O.pattern(L, kind, x, y, z, col, cols, ext, box, bg);
      const s = stageOf(x, y);
      if (s && seam.has(s.ox + ',' + s.oy)) {                                     // Randfuge zur Nachbarin mit anderer Richtung
        g.save(); g.strokeStyle = col || 'rgba(90,60,40,.6)'; g.lineWidth = Math.max(1.5, 2.2 * z); g.lineCap = 'butt';
        for (const [dx, dy, a, b] of [[1, 0, [0.5, -0.5], [0.5, 0.5]], [-1, 0, [-0.5, -0.5], [-0.5, 0.5]], [0, 1, [-0.5, 0.5], [0.5, 0.5]], [0, -1, [-0.5, -0.5], [0.5, -0.5]]]) {
          const n = (x + dx) + ',' + (y + dy);
          if (!rot.has(n) || rot.get(n) === r) continue;
          const p = L(a), q = L(b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
        }
        g.restore();
      }
    };
    const clear = () => { resetDrawCaches(); groundVersion++; };
    clear();
    try { return fn(); } finally { window.pattern = O.pattern; clear(); }
  }
  function shot(cxW, cyW, zz, Cs) {
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y; cam.z = zz;
    walkers.length = 0;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const c = document.createElement('canvas'); c.width = Cs; c.height = Cs; const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, Cs, Cs);
    x.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.wegDrehBild = async (name = 'weg-drehen.png', zz = 2.2, Cs = 520) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const sheet = document.createElement('canvas'); sheet.width = 3 * (Cs + 20); sheet.height = 2 * (Cs + 60);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      patched(() => stages().forEach(s => {
        const c = shot(s.ox + 3, s.oy + 2.2, zz, Cs), X = s.c * (Cs + 20), Y = (s.oy / 12) * (Cs + 60) + 45;
        sx.drawImage(c, X, Y); sx.font = '800 24px system-ui'; sx.fillStyle = '#6b4f3a';
        sx.fillText(MUSTER.find(m => m[0] === s.m)[1] + ' · ' + PANELS[s.c], X + 6, Y - 12);
      }));
    } finally { nightAt = na; gameHour = gh; }
    return post(name, sheet);
  };
  return 'ok';
})();
