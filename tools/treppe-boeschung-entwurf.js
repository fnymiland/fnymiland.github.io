// Entwurf (Nutzer 11.10.2026: „besser, wenn der Aufgang immer gleich breit ist und nur der Weg darauf schmaler oder breiter – dann eben eine
// Graskante links und rechts, sieht natürlicher aus“): schmale Treppe in der Anhöhe – der Einschnitt ist ein ganzes Feld breit, links und rechts
// der Stufen läuft eine Grasböschung mit hinauf (statt der Streifen Anhöhe, die heute stehen bleiben). Nur als Bild, kein Spielcode geändert:
// paintStair wird für schmale, eingelassene Treppen durch mockStair ersetzt (Variante window.boeschungVar: 0 = heute, 1 = A, 2 = B).
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/treppe-boeschung-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await boeschungBild()   → tools/vorschau/treppe-boeschung.png
(function treppeBoeschung() {
  const O = {};
  // A: Grasböschung, die Stufen sitzen darin (ragen hinten je Stufe eine Stufenhöhe heraus, Seiten in der Farbe der Stirn); B: dazu Randsteine
  function mockStair(P, o, x, y, v) {
    const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du;
    const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s], W = (d, s, h) => P(...UV(d, s), h);
    const toward = Du + Dv > 0, nearP = Su + Sv > 0;
    const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2), grass = o.top || '#9fd979';
    const nw = STAIR_NW, kb = v === 2 ? 0.045 : 0;                        // halbe Breite der Stufen, Randstein
    const slopeH = d => H * Math.max(0, Math.min(1, d + 0.5));            // Böschung: vom Fuß (0) gerade bis zur Oberkante (H), durch die Hinterkanten der Stufen
    const slope = sg => {                                                // Grasböschung zwischen Stufen (bzw. Randstein) und Feldgrenze
      const sIn = sg * (nw + kb), sOut = sg * 0.5;
      poly([W(-0.5, sIn, 0), W(-0.5, sOut, 0), W(0.5, sOut, H), W(0.5, sIn, H)], C(grass));
      g.save(); g.beginPath(); [W(-0.5, sIn, 0), W(-0.5, sOut, 0), W(0.5, sOut, H), W(0.5, sIn, H)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
      for (let k = 1; k < 6; k++) { const d = -0.5 + k / 6, a = W(d, sIn, slopeH(d)), b = W(d, sOut, slopeH(d)); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = 'rgba(60,110,40,0.12)'; g.lineWidth = 1; g.stroke(); }   // leichte Schattierung quer
      g.restore();
    };
    const curb = sg => {                                                 // Randstein (B): Band auf der Böschung, ein wenig erhaben, stufig wie die Stufen
      if (!kb) return;
      const a = sg * nw, b = sg * (nw + kb);
      for (let i = 0; i < n; i++) {
        const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n + 0.6;
        poly([W(d0, a, h), W(d1, a, h), W(d1, b, h), W(d0, b, h)], C(shade(lk.edge || '#bfb3a0', 0.05)));
        if (!toward) poly([W(d0, a, h - H / n), W(d0, b, h - H / n), W(d0, b, h), W(d0, a, h)], C(shade(lk.edge || '#bfb3a0', -0.15)));
      }
    };
    // Wange einer Stufe zur Böschung hin (sichtbare Seite): von der Böschung bis zur Trittfläche
    const cheek = (i, s) => { const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n; poly([W(d0, s, slopeH(d0)), W(d1, s, slopeH(d1)), W(d1, s, h), W(d0, s, h)], C(shade(riser, -0.05))); };
    const step = i => {
      const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n, hb = H * i / n;
      if (!toward) poly([W(d0, -nw, hb), W(d0, nw, hb), W(d0, nw, h), W(d0, -nw, h)], C(riser));
      const q = [UV(d0, -nw), UV(d1, -nw), UV(d1, nw), UV(d0, nw)], L = ([u, w]) => P(u, w, h);
      poly(q.map(L), C(lk.fill));
      if (lk.pat) { g.save(); clipTo([q], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
      const nearS = nearP ? nw : -nw;
      if (!kb) cheek(i, nearS);
    };
    slope(nearP ? -1 : 1); curb(nearP ? -1 : 1);
    for (let j = 0; j < n; j++) step(toward ? j : n - 1 - j);
    slope(nearP ? 1 : -1); curb(nearP ? 1 : -1);
  }
  function patched(fn) {
    Object.assign(O, { paintStair, stairSig });
    window.paintStair = (P, o, x, y) => {
      const v = window.boeschungVar || 0;
      if (!v || !o.nar || o.ecke || !(o.m === 'h' && o.p === 'h')) return O.paintStair(P, o, x, y);
      return mockStair(P, o, x, y, v);
    };
    window.stairSig = o => O.stairSig(o) + '|bv' + (window.boeschungVar || 0);
    const clear = () => { for (const e of hillSprites.values()) freeCanvas(e.c); hillSprites.clear(); };
    clear(); groundVersion++;
    try { return fn(); } finally { Object.assign(window, O); groundVersion++; clear(); }
  }
  const ORIG = [[0, 0], [12, 0]];
  function setup() {
    for (const [ox, oy] of ORIG) for (let y = oy - 4; y <= oy + 10; y++) for (let x = ox - 4; x <= ox + 10; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    state.money = 1e9; state.techs.add('terraform'); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    const errs = [];
    ORIG.forEach(([ox, oy], i) => {
      for (let y = oy; y <= oy + 3; y++) for (let x = ox; x <= ox + 4; x++) build('anhoehe', x, y, true);
      recalc();
      // 0: in die Vorderwand (+y), hinauf nach −y; 1: in die rechte Wand (+x), hinauf nach −x
      const [sx, sy] = i === 0 ? [ox + 2, oy + 3] : [ox + 4, oy + 1];
      const e = placeError('huegeltreppe', sx, sy); if (e) errs.push(e);
      build('huegeltreppe', sx, sy, true); const t = stairAt(sx, sy); if (t) t.schmal = true;
      for (let k = 1; k <= 3; k++) build('weg', sx + (i ? k : 0), sy + (i ? 0 : k), true);
    });
    recalc(); groundVersion++; floats.length = 0;
    return errs;
  }
  function shot(cxW, cyW, zz, Cs, up) {
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const c = document.createElement('canvas'); c.width = Cs; c.height = Cs; const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, Cs, Cs);
    x.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.boeschungBild = async (name = 'treppe-boeschung.png', zz = 4, Cs = 560) => {
    const errs = setup(), L = ['heute: Streifen Anhöhe', 'A: Grasböschung', 'B: Grasböschung + Randsteine'];
    const sheet = document.createElement('canvas'); sheet.width = 3 * (Cs + 20); sheet.height = 2 * (Cs + 60);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    for (let v = 0; v < 3; v++) {
      window.boeschungVar = v;
      patched(() => ORIG.forEach(([ox, oy], i) => {
        const c = i === 0 ? shot(ox + 2, oy + 3.2, zz, Cs, 14) : shot(ox + 4.3, oy + 1, zz, Cs, 14);
        const X = v * (Cs + 20), Y = i * (Cs + 60) + 45;
        sx.drawImage(c, X, Y); sx.font = '800 24px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(L[v] + (i ? ' · Wand rechts' : ' · Wand links'), X + 6, Y - 12);
      }));
    }
    window.boeschungVar = 0;
    return [errs, await post(name, sheet)];
  };
  return 'ok';
})();
