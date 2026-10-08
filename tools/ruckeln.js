// (ohne 'use strict': per eval geladen, die Funktionen sollen global sein)
// ---------------------------------------------------------------------------
// Ruckeln messen (Block 143) – im Browser in voller Größe (z. B. 1920 × 1080), Testwelt ?welt=gross:
//   fetch('tools/ruckeln.js').then(r => r.text()).then(t => (0, eval)(t)); ruckelMess()
// Jedes Bild wird mit dem Warten auf die Grafikkarte gemessen (1 Bildpunkt lesen) – sonst sähe man nur die Rechenzeit des Spiels.
// Szenen: Tag/Nacht still, Verschieben, Zoomen und der Übergang Dämmerung → Nacht. Wichtig sind die längsten Bilder (max, > 33 ms),
// nicht nur der Mittelwert: einzelne lange Bilder spürt man als Ruckeln.
// ---------------------------------------------------------------------------
function ruckelMess({ z = 0.6, pan = 10, frames = 90 } = {}) {
  const R = window.__R || render;
  window.__R = R; window.render = () => {};                              // eigene Bildschleife, die normale malt nichts mehr
  let T = performance.now() + 1e7;
  // Warten auf die Grafikkarte, OHNE aus der Hauptleinwand zu lesen: Chrome stellt eine Leinwand, aus der oft gelesen wird, aufs
  // Zeichnen ohne Grafikkarte um – dann misst man einen anderen (langsameren) Weg. Darum: 1 Punkt in eine Hilfsleinwand kopieren
  // und die lesen; im GL-Bild zusätzlich gl.readPixels (Block 144)
  const S = document.createElement('canvas'); S.width = S.height = 1;
  const sx = S.getContext('2d', { willReadFrequently: true }), px = new Uint8Array(4);
  const sync = () => { sx.drawImage(ctx.canvas, 0, 0, 1, 1, 0, 0, 1, 1); sx.getImageData(0, 0, 1, 1); if (typeof GL !== 'undefined' && GL.shown && GL.gl) GL.gl.readPixels(0, 0, 1, 1, GL.gl.RGBA, GL.gl.UNSIGNED_BYTE, px); };
  const frame = () => { T += 16; const a = performance.now(); R(T); const js = performance.now() - a; sync(); return [performance.now() - a, js]; };
  const scene = (label, n, step) => {
    const t = [], js = []; let prep = 0, catchN = 0;
    for (let i = 0; i < n; i++) { step(i); const [ms, j] = frame(); t.push(ms); js.push(j); if (spritePrep) prep++; if (spriteCatch) catchN++; }
    const s = [...t].sort((a, b) => a - b), sj = [...js].sort((a, b) => a - b), q = p => Math.round(s[Math.min(n - 1, Math.floor(n * p))]);
    return { label, median: q(0.5), p90: q(0.9), max: Math.round(s[n - 1]), ueber33: t.filter(x => x > 33).length, js: Math.round(sj[n >> 1]), prep, catch: catchN };
  };
  const settle = () => { for (let i = 0; i < 400; i++) { frame(); if (i > 30 && SPRITE_STATS.miss === 0 && SPRITE_STATS.made === 0) break; } };
  const out = [], x0 = state.cam.x, y0 = state.cam.y;
  const home = () => { state.cam.x = x0; state.cam.y = y0; state.cam.z = z; };
  for (const [nm, nv] of [['Tag', 0], ['Nacht', NIGHT_MAX]]) {
    window.nightAt = () => nv; home(); settle();
    out.push(scene(nm + ' still', 20, () => {}));
    out.push(scene(nm + ' verschieben', frames, i => { state.cam.x = x0 + i * pan; state.cam.y = y0 + i * pan * 0.3; }));
    home(); settle();
    out.push(scene(nm + ' zoomen', frames, i => { state.cam.z = z * Math.pow(i < frames / 2 ? 0.985 : 1 / 0.985, i < frames / 2 ? i : frames - i); }));
  }
  // Dämmerung → Nacht (wie im Spiel: 20:00 → 21:00 Spielzeit = 60 s echt; hier gerafft auf 120 Bilder)
  window.nightAt = () => 0; home(); settle();
  let k = 0;
  window.nightAt = () => Math.min(NIGHT_MAX, k / 120 * NIGHT_MAX);
  out.push(scene('Dämmerung → Nacht', 160, i => { k = i; }));
  window.nightAt = () => 0; home();
  return out;
}
