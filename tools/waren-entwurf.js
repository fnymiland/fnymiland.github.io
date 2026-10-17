// Entwurfsbogen für Sternenbasar-Sammlungen (Block 161c): zeichnet Waren in der Form von SD_ART (cx, cy, z; Licht über sdLit/sdGlow) direkt
// auf die Spielleinwand (isLive), Tag und Nacht (glowQuad als weicher Schein), und schickt den Bogen an den Bild-Sammler (4181).
// (0, eval)(await (await fetch('tools/waren-entwurf.js')).text()); (0, eval)(await (await fetch('tools/waren-eiszauber.js')).text());
// await warenEntwurf('waren-eiszauber', WAREN_EISZAUBER)
(function warenEntwurfTool() {
  window.warenEntwurf = async (name, list, opts = {}) => {
    const W = 250, H = 230, cols = opts.cols || 5, shots = [];
    const gq = glowQuad, n0 = night, prevG = g, glows = [];
    glowQuad = (pts, r, tint) => { const m = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length], [0, 0]); glows.push([m[0], m[1], r, tint === 'blue' ? '140,190,255' : '255,200,110']); };
    try {
      for (const [label, fn, tile] of list) {
        const c = document.createElement('canvas'); c.width = W; c.height = H; const cx = c.getContext('2d');
        for (const nightOn of [false, true]) {
          g = ctx; night = nightOn ? 1 : 0;
          ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          const s = (nightOn ? 1.9 : 4.2) * (tile ? 0.55 : 1), w = nightOn ? 90 : W, h = nightOn ? 100 : H, X0 = nightOn ? W - 90 : 0, Y0 = nightOn ? H - 100 : 0;
          ctx.fillStyle = nightOn ? '#2b3550' : '#9fd27a'; ctx.fillRect(0, 0, w, h);
          if (tile) { ctx.fillStyle = nightOn ? '#33405e' : '#b4dd8c'; ctx.beginPath(); ctx.moveTo(w / 2, h * 0.78 - 16 * s); ctx.lineTo(w / 2 + 32 * s, h * 0.78); ctx.lineTo(w / 2, h * 0.78 + 16 * s); ctx.lineTo(w / 2 - 32 * s, h * 0.78); ctx.closePath(); ctx.fill(); }
          fn(w / 2, h * (tile ? 0.78 : 0.86), s, 1e6, 0, 0, { rot: 0, slot: 0 });
          ctx.globalCompositeOperation = 'lighter';
          for (const [x, y, r, col] of glows.splice(0)) { const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},0.4)`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
          ctx.globalCompositeOperation = 'source-over';
          cx.drawImage(canvas, 0, 0, w * DPR, h * DPR, X0, Y0, w, h);
          ctx.restore();
        }
        shots.push([c, label]);
      }
    } finally { glowQuad = gq; night = n0; g = prevG; }
    const rows = Math.ceil(shots.length / cols), sheet = document.createElement('canvas'); sheet.width = cols * (W + 10); sheet.height = rows * (H + 34);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    shots.forEach(([c, l], i) => { const X = (i % cols) * (W + 10), Y = Math.floor(i / cols) * (H + 34) + 26; sx.drawImage(c, X, Y); sx.font = '700 16px system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(l, X + 4, Y - 7); });
    try { return await (await fetch('http://127.0.0.1:4181/' + name + '.png', { method: 'POST', body: sheet.toDataURL('image/png') })).text(); } catch (e) { return 'kein Sammler'; }
  };
  return 'ok';
})();
