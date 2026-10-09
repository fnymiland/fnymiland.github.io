// Entwurf „Bögen bis zum Boden, wo Pfeiler stehen“ (Nutzer, 09.10.2026). Drei Steinarkaden 4 × 2 mit unterschiedlich vielen Pfeilern.
// Im Browser (?probe): fetch('tools/bodenbogen.js').then(r => r.text()).then(t => (0, eval)(t)); await bodenBild('bodenbogen.png')
(function bodenBogen() {
  for (let y = -8; y <= 14; y++) for (let x = -8; x <= 20; x++) { const k = x + ',' + y; state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.claimed.add(k); }
  state.roofs.clear(); state.money = 1e9; for (const r of Object.keys(RES)) state.res[r] = 1e6; for (const d of DESIGN) state.design.add(d.id);
  const of = window.fail; window.fail = () => {};
  const block = (ox, oy, extra) => {
    state.paintNew.dach = { form: 3 }; setTool('dach');
    const cells = []; for (let y = oy; y <= oy + 1; y++) for (let x = ox; x <= ox + 3; x++) { build('dach', x, y, true); cells.push([x, y]); }
    roofAutoPillars(cells);
    for (const [x, y, s] of extra) buildSmall('stuetze', ox + x, oy + y, s);
    for (const [x, y] of cells) { const r = state.roofs.get(x + ',' + y); r.par = 2; r.bel = 'm:verband:beige'; }
  };
  block(0, 0, []);                                                                  // nur Eckpfeiler
  block(0, 5, [[0, 1, 3], [1, 1, 3], [2, 1, 3], [3, 0, 3]]);                        // an jeder Feldecke vorn
  block(0, 10, [[1, 1, 3], [3, 0, 7]]);                                             // ein paar, unregelmäßig
  setTool('look'); window.fail = of; recalc(); groundVersion++; floats.length = 0;
  window.bodenBild = async (name) => {
    const gh = gameHour; gameHour = () => 12;
    const shots = [[[2, 1], 'Nur Eckpfeiler'], [[2, 6], 'Pfeiler an jeder Feldecke'], [[2, 11], 'Ein paar Pfeiler, unregelmäßig']];
    const C0 = [Math.round(canvas.width * 0.6), Math.round(canvas.height * 0.62)], S = 0.55, cw = Math.round(C0[0] * S), ch = Math.round(C0[1] * S);
    const sheet = document.createElement('canvas'); sheet.width = (cw + 16) * 3; sheet.height = (ch + 50) * 2 + 10;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      for (const [row, v] of [null, 'G'].entries()) for (const [i, [[X, Y], label]] of shots.entries()) {
        window.ARK_SEITE = v; roofSprites.clear(); resetDrawCaches(); if (typeof GL !== 'undefined') GL.drawEpoch++; groundVersion++;
        const p = iso(X, Y); cam.x = p.x; cam.y = p.y - 10; cam.z = 3.2;
        spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
        const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
        const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
        const ox = i * (cw + 16), oy = row * (ch + 50) + 44;
        sx.drawImage(comp, (comp.width - C0[0]) / 2, (comp.height - C0[1]) / 2, C0[0], C0[1], ox, oy, cw, ch);
        sx.font = '800 24px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText((row ? 'Neu: ' : 'Jetzt: ') + label, ox + 8, oy - 12);
      }
    } finally { delete window.ARK_SEITE; gameHour = gh; roofSprites.clear(); }
    const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') });
    return r.text();
  };
  return 'ok';
})();
// Entwurf H: Säulen bis zum Kapitell, darüber setzt der Bogen an (Nutzer: Säulen weder durch noch vor der Wand) – zwei Höhen
window.saeulenBild = async (name) => {
  const gh = gameHour; gameHour = () => 12;
  const rows = (window.SAEULEN_ROWS || [[0.45, 'Kapitell niedrig'], [0.65, 'Kapitell höher']]);
  const shots = [[[3.3, 6.6], 7, 'nah'], [[2, 6], 3.2, 'Pfeiler an jeder Feldecke'], [[2, 11], 3.2, 'unregelmäßig']];
  const C0 = [Math.round(canvas.width * 0.6), Math.round(canvas.height * 0.62)], S = 0.55, cw = Math.round(C0[0] * S), ch = Math.round(C0[1] * S);
  const sheet = document.createElement('canvas'); sheet.width = (cw + 16) * 3; sheet.height = (ch + 50) * rows.length + 10;
  const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
  try {
    for (const [row, [hc, rl]] of rows.entries()) for (const [i, [[X, Y], z, label]] of shots.entries()) {
      window.ARK_SEITE = 'H'; window.ARK_HC = hc; roofSprites.clear(); resetDrawCaches(); if (typeof GL !== 'undefined') GL.drawEpoch++; groundVersion++;
      const p = iso(X, Y); cam.x = p.x; cam.y = p.y - 10; cam.z = z;
      spriteNoBudget = true; for (let k = 0; k < 6; k++) render(performance.now() + k * 16); spriteNoBudget = false; render(performance.now() + 200);
      const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height;
      const c2 = comp.getContext('2d'); if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, 0, 0); c2.drawImage(canvas, 0, 0);
      const ox = i * (cw + 16), oy = row * (ch + 50) + 44;
      sx.drawImage(comp, (comp.width - C0[0]) / 2, (comp.height - C0[1]) / 2, C0[0], C0[1], ox, oy, cw, ch);
      sx.font = '800 24px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${rl}: ${label}`, ox + 8, oy - 12);
    }
  } finally { delete window.ARK_SEITE; delete window.ARK_HC; gameHour = gh; roofSprites.clear(); resetDrawCaches(); }
  const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: sheet.toDataURL('image/png') });
  return r.text();
};
