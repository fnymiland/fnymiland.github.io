// Prüfung der Grasböschung neben schmalen Treppen (Block 157q, Nutzer 11.10.2026, Entwurf A): echt gebaut – schmal in der Vorderwand (+y) und
// in der rechten Wand (+x), zwei schmale nebeneinander, schmal neben breit, schmal am Rand der Anhöhe (eine Seite Keil). Nahaufnahmen.
// Im Browser (?welt=neu, Bild-Sammler auf 4181):
// fetch('tools/treppe-boeschung-pruefung.js').then(r => r.text()).then(t => (0, eval)(t)); await boeschungPruefung()  → tools/vorschau/treppe-boeschung-final.png
(function boeschungPruefung() {
  const S = [];
  function setup() {
    for (let y = -2; y <= 30; y++) for (let x = -2; x <= 40; x++) {
      const k = x + ',' + y, a = anchorAt(x, y);
      if (a) state.tiles.delete(a);
      state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); if (state.roofs) state.roofs.delete(k);
    }
    state.money = 1e9; state.techs.add('terraform'); for (const r of Object.keys(RES)) state.res[r] = 1e6;
    const hill = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) build('anhoehe', x, y, true); recalc(); };
    const st = (x, y, wide) => { stairNewWide = wide ? true : null; build('huegeltreppe', x, y, true); stairNewWide = null; recalc(); };
    S.length = 0;
    hill(0, 0, 4, 3); st(2, 3); S.push([2, 3.3, 'schmal · Wand vorn links (+y)']);
    hill(8, 0, 12, 4); st(12, 2); S.push([12.3, 2, 'schmal · Wand vorn rechts (+x)']);
    hill(16, 0, 21, 3); st(18, 3); st(19, 3); S.push([18.5, 3.3, 'zwei schmale nebeneinander']);
    hill(24, 0, 29, 3); st(26, 3, true); st(27, 3); S.push([26.5, 3.3, 'breit links, schmal rechts']);
    hill(0, 10, 4, 13); st(4, 13); S.push([4, 13.3, 'schmal am Rand (rechts Keil)']);
    hill(8, 10, 12, 13); st(9, 13); st(10, 13, true); S.push([9.5, 13.3, 'schmal links, breit rechts']);
    floats.length = 0; walkers.length = 0;
  }
  function shot(cx, cy, zz, Cs, up) {
    const p = iso(cx, cy); cam.x = p.x; cam.y = p.y - up; cam.z = zz;
    const now = performance.now(); spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    const c = document.createElement('canvas'); c.width = Cs; c.height = Cs; const x = c.getContext('2d'); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, Cs, Cs);
    x.drawImage(canvas, canvas.width / 2 - Cs / 2, canvas.height / 2 - Cs / 2, Cs, Cs, 0, 0, Cs, Cs);
    return c;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };
  window.boeschungPruefung = async (name = 'treppe-boeschung-final.png', zz = 4, Cs = 520, cols = 3) => {
    setup();
    const na = nightAt, gh = gameHour; nightAt = () => 0; gameHour = () => 12; night = 0;
    const rows = Math.ceil(S.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (Cs + 16); sheet.height = rows * (Cs + 50);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    try {
      S.forEach(([x, y, t], i) => { const c = shot(x, y, zz, Cs, 14), X = (i % cols) * (Cs + 16), Y = Math.floor(i / cols) * (Cs + 50) + 38; sx.drawImage(c, X, Y); sx.font = '800 22px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(t + ' · z ' + zz, X + 6, Y - 10); });
    } finally { nightAt = na; gameHour = gh; }
    return post(name, sheet);
  };
  return 'ok';
})();
