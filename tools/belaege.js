// Alle Wegbeläge als 4×4-Plätze nebeneinander und ein Vergleichsbild je Zoomstufe (Block 125).
// Im Browser (?welt=alles): fetch('tools/belaege.js').then(r => r.text()).then(t => (0, eval)(t)); await belaegeBild('name.png')
// Das Bild geht per POST an einen kleinen Empfänger auf Port 4181 (siehe Sitzung) – ohne ihn wird es nur zurückgegeben.
function belaegeSzene() {
  const X0 = 60, Y0 = -12, CW = 6, CH = 7, styles = STYLES.weg, rows = Math.ceil(styles.length / 7);
  for (let y = Y0 - 2; y < Y0 + rows * CH + 2; y++) for (let x = X0 - 2; x < X0 + 7 * CW + 2; x++) { const k = x + ',' + y; state.tiles.delete(k); state.decos.delete(k); state.terra.set(k, 'wiese'); state.claimed.add(k); }
  for (const k of [...state.edges.keys()]) { const [a, b] = k.split(',').map(Number); if (a >= X0 - 3 && a < X0 + 7 * CW + 3 && b >= Y0 - 3 && b < Y0 + rows * CH + 3) state.edges.delete(k); }
  styles.forEach((s, i) => { const cx = X0 + (i % 7) * CW, cy = Y0 + Math.floor(i / 7) * CH;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) state.tiles.set((cx + x) + ',' + (cy + y), { b: 'weg', lvl: 1, style: s.id }); });
  groundVersion++; recalc(); resetDrawCaches();
  return { X0, Y0, CW, CH, styles };
}
// ids: nur diese Beläge (Standard alle); je Spalte 7 Beläge untereinander, je Belag die Zoomstufen nebeneinander
async function belaegeBild(name, zs = [0.8, 0.6, 0.45, 0.35], ids = null) {
  const S = belaegeSzene(), R = window.__R || window.render; window.render = () => {}; let T = performance.now() + 9e6;
  const pick = S.styles.map((s, i) => [s, i]).filter(([s]) => !ids || ids.includes(s.id)), blocks = Math.ceil(pick.length / 7);
  const C = 170, colW = zs.length * (C * 2 + 8);
  const sheet = document.createElement('canvas'); sheet.width = blocks * colW; sheet.height = Math.min(7, pick.length) * (C * 2 + 40) + 40; const sx = sheet.getContext('2d');
  sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height); sx.imageSmoothingEnabled = false;
  const comp = document.createElement('canvas'); comp.width = canvas.width; comp.height = canvas.height; const cx2 = comp.getContext('2d');
  sx.font = '700 26px Nunito, system-ui'; sx.fillStyle = '#6b4f3a';
  for (let b = 0; b < blocks; b++) zs.forEach((z, j) => sx.fillText('Zoom ' + z, b * colW + j * (C * 2 + 8) + 8, 30));
  pick.forEach(([s, i], n) => zs.forEach((z, j) => {
    const cx = S.X0 + (i % 7) * S.CW, cy = S.Y0 + Math.floor(i / 7) * S.CH, p = iso(cx + 1.5, cy + 1.5); state.cam.x = p.x; state.cam.y = p.y; state.cam.z = z;
    for (const e of groundCache.values()) freeCanvas(e.c); groundCache.clear(); lastZoomChange = -1e9;   // Boden in genau dieser Stufe neu
    spriteNoBudget = true; for (let k = 0; k < 8; k++) { T += 16; R(T); } spriteNoBudget = false; T += 16; R(T);
    cx2.clearRect(0, 0, comp.width, comp.height); if (typeof GL !== 'undefined' && GL.shown) cx2.drawImage(GL.canvas, 0, 0); cx2.drawImage(canvas, 0, 0);
    const b = Math.floor(n / 7), r = n % 7, ox = b * colW + j * (C * 2 + 8), oy = 40 + r * (C * 2 + 40);
    sx.drawImage(comp, canvas.width / 2 - C / 2, canvas.height / 2 - C / 2, C, C, ox, oy, C * 2, C * 2);
    if (j === 0) { sx.fillStyle = '#6b4f3a'; sx.fillText(`${i + 1}. ${s.name}`, ox + 4, oy + C * 2 + 30); }
  }));
  window.render = R;
  const url = sheet.toDataURL('image/png');
  try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return url; }
}
