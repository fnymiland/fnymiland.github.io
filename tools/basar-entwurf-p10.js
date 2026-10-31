// Entwürfe Paket 10 Katze auf Kissen (Basar-Durchsicht 31.10.2026, Punkt 7). Form wie SD_ART plus now.
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-p10.js')).text())
(() => {
  const TAU = Math.PI * 2, GOLD = '#f5c84b', GOLD_D = '#c9962a';
  const fur = '#f0a24a', furD = '#d9822e', furL = '#ffc983', white = '#fff8ee', stripe = '#c96f22';
  // rundes Samtkissen: Seitenwulst, Oberseite gewölbt mit Knopf, vier Quasten
  const cushion = (cx, cy, z, R = 8, col = '#9b6fe0') => {
    const H = 2.6, top = cy - H * z;
    ellipse(cx, cy, R * z, R / 2 * z, C(shade(col, -0.3)));
    g.beginPath(); g.ellipse(cx, cy, R * z, R / 2 * z, 0, 0, Math.PI); g.lineTo(cx - R * z, top); g.ellipse(cx, top, R * z, R / 2 * z, 0, Math.PI, 0, true); g.closePath();
    const sg = g.createLinearGradient(cx - R * z, 0, cx + R * z, 0); sg.addColorStop(0, C(shade(col, 0.05))); sg.addColorStop(1, C(shade(col, -0.25))); g.fillStyle = sg; g.fill();
    const tg = g.createRadialGradient(cx - R * 0.3 * z, top - R * 0.2 * z, 0, cx, top, R * z); tg.addColorStop(0, C(shade(col, 0.3))); tg.addColorStop(1, C(col));
    ellipse(cx, top - 0.4 * z, R * z, R / 2 * z, tg);
    g.strokeStyle = C(GOLD); g.lineWidth = Math.max(0.4, 0.45 * z); g.beginPath(); g.ellipse(cx, top - 0.2 * z, R * z, R / 2 * z, 0, 0, Math.PI); g.stroke();   // Kordel
    for (const a of [0.15, 0.85]) { const x = cx + Math.cos(a * Math.PI) * R * z, y = top + Math.sin(a * Math.PI) * R / 2 * z;   // Quasten
      sdLine(GOLD_D, 0.3, z, [[x, y], [x, y + 1.6 * z]]); poly([[x - 0.6 * z, y + 1.4 * z], [x + 0.6 * z, y + 1.4 * z], [x + 0.8 * z, y + 3 * z], [x - 0.8 * z, y + 3 * z]], C(GOLD)); circle(x, y + 1.3 * z, 0.5 * z, C(GOLD_D)); }
    return top - 0.6 * z;
  };
  // A: schlafend eingerollt (von schräg oben): Körper oval, Streifen, Kopf auf den Pfoten, Augen zu, Schwanz um den Körper; atmet (bewegt)
  const curled = (cx, ty, z, now) => {
    const br = 1 + Math.sin(now / 900) * 0.025;                                                                    // Atmen
    const bx = cx - 0.6 * z, by = ty - 2.6 * z;
    ellipse(cx, ty + 0.2 * z, 6.2 * z, 2.6 * z, 'rgba(60,30,60,0.22)');
    g.strokeStyle = C(furD); g.lineWidth = 2.1 * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - 5 * z, by + 0.6 * z); g.quadraticCurveTo(bx - 4 * z, by + 3.6 * z, bx + 1.5 * z, by + 3 * z); g.stroke();   // Schwanz hinten
    const gr = g.createRadialGradient(bx - 1.5 * z, by - 2 * z, 0.5 * z, bx, by, 6.5 * z); gr.addColorStop(0, C(furL)); gr.addColorStop(1, C(fur));
    g.beginPath(); g.ellipse(bx, by, 5.8 * z, 3.6 * z * br, -0.08, 0, TAU); g.fillStyle = gr; g.fill();          // Körper
    g.strokeStyle = C(stripe); g.lineWidth = Math.max(0.5, 0.55 * z); g.lineCap = 'round';                        // Streifen über den Rücken
    for (const [dx, k] of [[-3.6, 0.7], [-2, 0.95], [-0.3, 1], [1.4, 0.9]]) { g.beginPath(); g.moveTo(bx + dx * z, by - 3.3 * z * k * br); g.quadraticCurveTo(bx + (dx + 0.9) * z, by - 1.5 * z * k, bx + (dx + 0.4) * z, by + 0.2 * z); g.stroke(); }
    g.strokeStyle = C(fur); g.lineWidth = 2.2 * z; g.beginPath(); g.moveTo(bx - 4.8 * z, by + 1.6 * z); g.quadraticCurveTo(bx - 2.5 * z, by + 4.4 * z, bx + 3 * z, by + 3.3 * z); g.stroke();   // Schwanz vorn um den Körper
    g.strokeStyle = C(stripe); g.lineWidth = Math.max(0.4, 0.5 * z); for (const u of [0.25, 0.5]) { const x = bx + (-4.8 + u * 7.8) * z, y = by + (1.6 + Math.sin(u * Math.PI) * 2.3) * z; g.beginPath(); g.moveTo(x - 0.4 * z, y - 1 * z); g.lineTo(x + 0.2 * z, y + 1 * z); g.stroke(); }
    circle(bx + 3.2 * z, by + 3.2 * z, 1.15 * z, C(white));                                                         // Schwanzspitze hell
    const hx = bx + 3.8 * z, hy = by - 0.2 * z;                                                                       // Kopf
    for (const d of [-1, 1]) ellipse(hx + d * 1.3 * z, hy + 2.6 * z, 1.4 * z, 0.8 * z, C(white));                  // Pfoten unter dem Kopf
    const hg = g.createRadialGradient(hx - 0.8 * z, hy - 1 * z, 0.3 * z, hx, hy, 3.2 * z); hg.addColorStop(0, C(furL)); hg.addColorStop(1, C(fur));
    g.beginPath(); g.ellipse(hx, hy, 3.1 * z, 2.6 * z, 0.1, 0, TAU); g.fillStyle = hg; g.fill();
    for (const d of [-1, 1]) { poly([[hx + d * 1 * z, hy - 2 * z], [hx + d * 2.8 * z, hy - 1.6 * z], [hx + d * 2.4 * z, hy - 4.2 * z]], C(fur)); poly([[hx + d * 1.4 * z, hy - 2 * z], [hx + d * 2.5 * z, hy - 1.9 * z], [hx + d * 2.3 * z, hy - 3.4 * z]], C('#ffb3c0')); }   // Ohren
    g.strokeStyle = C(stripe); g.lineWidth = Math.max(0.4, 0.45 * z); for (const d of [-0.6, 0, 0.6]) { g.beginPath(); g.moveTo(hx + d * z, hy - 2.4 * z); g.lineTo(hx + d * 0.8 * z, hy - 1.4 * z); g.stroke(); }   // Stirnstreifen
    ellipse(hx, hy + 1 * z, 1.6 * z, 1.1 * z, C(white));                                                           // Schnauze
    g.strokeStyle = C('#5a3a2a'); g.lineWidth = Math.max(0.3, 0.32 * z); for (const d of [-1, 1]) { g.beginPath(); g.arc(hx + d * 1.2 * z, hy - 0.3 * z, 0.7 * z, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }   // Augen zu
    poly([[hx - 0.35 * z, hy + 0.5 * z], [hx + 0.35 * z, hy + 0.5 * z], [hx, hy + 0.95 * z]], C('#e8798a'));        // Nase
    g.strokeStyle = 'rgba(90,60,40,0.55)'; g.lineWidth = Math.max(0.2, 0.15 * z); for (const d of [-1, 1]) for (const k of [-0.3, 0.2]) { g.beginPath(); g.moveTo(hx + d * 1 * z, hy + 1.1 * z); g.lineTo(hx + d * 3.4 * z, hy + (1.1 + k * 2) * z); g.stroke(); }   // Schnurrhaare
    const zt = (now / 2200) % 1;                                                                                      // Zzz steigt auf
    g.font = `bold ${Math.round(2.2 * z)}px sans-serif`; g.textAlign = 'center';
    for (const [k, s] of [[0, 1], [0.33, 0.8], [0.66, 0.65]]) { const p = (zt + k) % 1; g.globalAlpha = Math.min(1, p * 5, (1 - p) * 3); g.fillStyle = C('#8a78c8');
      g.save(); g.translate(hx + (2 + p * 3) * z, hy - (4 + p * 7) * z); g.scale(s, s); g.fillText('z', 0, 0); g.restore(); } g.globalAlpha = 1;
  };
  // B: sitzt aufrecht (seitlich schräg), Brust weiß, Schwanz um die Pfoten, grüne Augen, blinzelt (bewegt)
  const sitting = (cx, ty, z, now) => {
    const x = cx, y = ty;
    ellipse(x, y + 0.2 * z, 4.6 * z, 1.8 * z, 'rgba(60,30,60,0.22)');
    const gr = g.createLinearGradient(x - 4 * z, 0, x + 4 * z, 0); gr.addColorStop(0, C(furL)); gr.addColorStop(1, C(furD));
    g.beginPath(); g.moveTo(x - 4 * z, y); g.bezierCurveTo(x - 5 * z, y - 4 * z, x - 2.8 * z, y - 7.4 * z, x, y - 7.6 * z); g.bezierCurveTo(x + 2.8 * z, y - 7.4 * z, x + 4.8 * z, y - 4 * z, x + 3.8 * z, y); g.closePath(); g.fillStyle = gr; g.fill();   // Körper
    g.beginPath(); g.moveTo(x - 1.6 * z, y - 1 * z); g.bezierCurveTo(x - 2.2 * z, y - 3.4 * z, x - 1.4 * z, y - 6.6 * z, x, y - 6.8 * z); g.bezierCurveTo(x + 1.4 * z, y - 6.6 * z, x + 2.2 * z, y - 3.4 * z, x + 1.6 * z, y - 1 * z); g.closePath(); g.fillStyle = C(white); g.fill();   // Brust
    g.strokeStyle = C(stripe); g.lineWidth = Math.max(0.5, 0.55 * z); g.lineCap = 'round';
    for (const [s, h] of [[-1, 2.4], [-1, 4.4], [1, 2.8], [1, 4.8]]) { g.beginPath(); g.moveTo(x + s * 3.9 * z, y - h * z); g.quadraticCurveTo(x + s * 3 * z, y - (h + 0.6) * z, x + s * 2.4 * z, y - (h + 0.2) * z); g.stroke(); }
    for (const d of [-1, 1]) ellipse(x + d * 1.1 * z, y - 0.4 * z, 1.1 * z, 0.7 * z, C(white));                   // Vorderpfoten
    g.strokeStyle = C(fur); g.lineWidth = 1.6 * z; g.beginPath(); g.moveTo(x + 3.4 * z, y - 0.6 * z); g.quadraticCurveTo(x + 2 * z, y + 1.4 * z, x - 2.6 * z, y + 0.6 * z); g.stroke();   // Schwanz um die Pfoten
    circle(x - 2.6 * z, y + 0.6 * z, 0.8 * z, C(white));
    const hx = x, hy = y - 9.8 * z;                                                                                  // Kopf
    const hg = g.createRadialGradient(hx - 0.8 * z, hy - 1 * z, 0.3 * z, hx, hy, 3.4 * z); hg.addColorStop(0, C(furL)); hg.addColorStop(1, C(fur));
    g.beginPath(); g.ellipse(hx, hy, 3.3 * z, 2.9 * z, 0, 0, TAU); g.fillStyle = hg; g.fill();
    for (const d of [-1, 1]) { poly([[hx + d * 1.1 * z, hy - 2.2 * z], [hx + d * 3 * z, hy - 1.6 * z], [hx + d * 2.6 * z, hy - 4.8 * z]], C(fur)); poly([[hx + d * 1.5 * z, hy - 2.2 * z], [hx + d * 2.7 * z, hy - 1.9 * z], [hx + d * 2.5 * z, hy - 3.9 * z]], C('#ffb3c0')); }
    g.strokeStyle = C(stripe); g.lineWidth = Math.max(0.4, 0.45 * z); for (const d of [-0.6, 0, 0.6]) { g.beginPath(); g.moveTo(hx + d * z, hy - 2.7 * z); g.lineTo(hx + d * 0.8 * z, hy - 1.7 * z); g.stroke(); }
    ellipse(hx, hy + 1.1 * z, 1.7 * z, 1.2 * z, C(white));
    const blink = (now % 3800) < 170;
    for (const d of [-1, 1]) { const ex = hx + d * 1.25 * z, ey = hy - 0.2 * z;
      if (blink) { g.strokeStyle = C('#5a3a2a'); g.lineWidth = Math.max(0.3, 0.3 * z); g.beginPath(); g.arc(ex, ey - 0.3 * z, 0.7 * z, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
      else { ellipse(ex, ey, 0.75 * z, 0.85 * z, C('#7cc34a')); ellipse(ex, ey, 0.22 * z, 0.7 * z, C('#2a2a2a')); circle(ex - 0.25 * z, ey - 0.35 * z, 0.2 * z, '#ffffff'); } }
    poly([[hx - 0.35 * z, hy + 0.6 * z], [hx + 0.35 * z, hy + 0.6 * z], [hx, hy + 1.05 * z]], C('#e8798a'));
    g.strokeStyle = 'rgba(90,60,40,0.55)'; g.lineWidth = Math.max(0.2, 0.15 * z); for (const d of [-1, 1]) for (const k of [-0.3, 0.2]) { g.beginPath(); g.moveTo(hx + d * 1 * z, hy + 1.2 * z); g.lineTo(hx + d * 3.6 * z, hy + (1.2 + k * 2) * z); g.stroke(); }
  };
  const katze = (mode) => (cx, cy, z, now = 0) => {
    sdShadow(cx, cy, 8, z);
    const ty = cushion(cx, cy, z, mode === 'schlaeft' ? 8 : 6.6);
    (mode === 'schlaeft' ? curled : sitting)(cx, ty, z, now);
  };
  window.ENTW_P10 = {
    'Katze: bisher': (cx, cy, z, now) => SD_ART.sd_katze(cx, cy, z, now || 0),
    'Katze A: schläft eingerollt, atmet, Zzz': katze('schlaeft'),
    'Katze B: sitzt, Schwanz um die Pfoten, blinzelt': katze('sitzt'),
  };
})();
