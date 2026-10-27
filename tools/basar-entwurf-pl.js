// Entwürfe Pinguin-Schal und Himmelslaternen (Nutzer 27.10.2026: „Schal beim Pinguin ist immer noch falsch und Laternen sehen irgendwie komisch aus“).
// Im Spiel: (0, eval)(await (await fetch('tools/basar-entwurf-pl.js')).text()); dann basarBlatt(Object.keys(ENTW_PL), { art: ENTW_PL, … })
(() => {
  const SNOW = '#fbfdff', SNOW_S = '#dfeaf2', INK = '#2f3440';
  const snow = (cx, cy, rx, z) => { ellipse(cx, cy + 0.6 * z, rx * z, rx * 0.42 * z, C(SNOW_S)); ellipse(cx - 0.6 * z, cy, rx * 0.86 * z, rx * 0.34 * z, C(SNOW)); };
  const rotEll = (x, y, rx, ry, rot, col) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
  // Schal, der sich um den Hals legt: vorderer Bogen (oben und unten nach unten gewölbt), Strickstreifen, Knoten rechts, zwei Enden
  const scarf = (x, ny, hw, z, col = '#d9534a', dark = '#a8392f') => {
    const band = (dy, th, c) => { g.beginPath(); g.moveTo(x - hw * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.3) * z, x + hw * z, ny + dy * z);
      g.lineTo(x + hw * z, ny + (dy + th) * z); g.quadraticCurveTo(x, ny + (dy + th + 1.3) * z, x - hw * z, ny + (dy + th) * z); g.closePath(); g.fillStyle = c; g.fill(); };
    band(-0.5, 1.7, C(dark)); band(-0.7, 1.5, C(col));
    for (const sx of [-1, 1]) { ellipse(x + sx * (hw - 0.05) * z, ny + 0.15 * z, 0.45 * z, 0.95 * z, C(dark)); ellipse(x + sx * (hw - 0.1) * z, ny + 0.05 * z, 0.4 * z, 0.8 * z, C(col)); }   // runde Seiten
    for (const dy of [-0.15, 0.35]) { g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(0.4, 0.18 * z); g.beginPath(); g.moveTo(x - (hw - 0.3) * z, ny + dy * z); g.quadraticCurveTo(x, ny + (dy + 1.2) * z, x + (hw - 0.3) * z, ny + dy * z); g.stroke(); }
    const kx = x + hw * 0.55 * z, ky = ny + 0.9 * z;
    poly([[kx - 0.5 * z, ky], [kx + 0.6 * z, ky], [kx + 1.3 * z, ky + 4.2 * z], [kx + 0.1 * z, ky + 4.4 * z]], C(col));          // vorderes Ende
    poly([[kx + 0.2 * z, ky], [kx + 1 * z, ky - 0.2 * z], [kx + 2.6 * z, ky + 3.2 * z], [kx + 1.6 * z, ky + 3.6 * z]], C(dark));   // zweites Ende, leicht seitlich
    for (const k of [0, 1, 2]) sdLine('#f6dcd8', 0.22, z, [[kx + (0.25 + k * 0.4) * z, ky + 4.3 * z], [kx + (0.3 + k * 0.4) * z, ky + 5 * z]]);
    circle(kx, ky, 0.75 * z, C(dark)); circle(kx - 0.1 * z, ky - 0.1 * z, 0.55 * z, C(col));                                   // Knoten
  };
  // Pinguin wie bisher (Körper + Kopf), nur der Schal neu
  const oldPeng = (x, cy, s, z) => {
    const H = 11 * s;
    ellipse(x, cy - H * 0.45 * z, 3.4 * s * z, H * 0.5 * z, C(INK));
    ellipse(x + 0.6 * z, cy - H * 0.42 * z, 2.2 * s * z, H * 0.4 * z, C('#ffffff'));
    circle(x, cy - H * z, 2.4 * s * z, C(INK)); circle(x + 0.9 * s * z, cy - H * z, 0.4 * z, C('#ffffff'));
    poly([[x + 2 * s * z, cy - H * z], [x + 3.6 * s * z, cy - (H - 0.6) * z], [x + 2 * s * z, cy - (H - 1) * z]], C('#f0a24a'));
    ellipse(x, cy - 0.3 * z, 1.8 * s * z, 0.7 * z, C('#f0a24a'));
  };
  // Pinguin neu: ein Stück (Kopf geht in den Körper über), weißer Bauch, Flossen, Augen mit Glanz, Bäckchen, Füße
  const newPeng = (x, cy, s, z) => {
    const S = s * z;
    ellipse(x - 1.2 * S, cy - 0.2 * z, 1.3 * S, 0.6 * S, C('#f0a24a')); ellipse(x + 1.3 * S, cy - 0.1 * z, 1.3 * S, 0.6 * S, C('#f0a24a'));
    rotEll(x - 3.2 * S, cy - 5.2 * S, 1 * S, 3 * S, 0.35, C('#262a35'));                                                        // Flosse hinten
    ellipse(x, cy - 4.6 * S, 3.6 * S, 4.8 * S, C(INK));
    circle(x + 0.2 * S, cy - 9.9 * S, 2.9 * S, C(INK));
    ellipse(x + 0.6 * S, cy - 4.2 * S, 2.6 * S, 3.9 * S, C('#ffffff'));
    ellipse(x + 1.2 * S, cy - 9.6 * S, 1.6 * S, 1.5 * S, C('#ffffff'));                                                         // helles Gesicht
    rotEll(x + 3.1 * S, cy - 5.4 * S, 0.9 * S, 2.8 * S, -0.3, C('#262a35'));                                                   // Flosse vorn
    circle(x + 1.6 * S, cy - 10 * S, 0.55 * S, C(INK)); circle(x + 1.75 * S, cy - 10.2 * S, 0.2 * S, C('#ffffff'));
    ellipse(x + 0.6 * S, cy - 9 * S, 0.6 * S, 0.35 * S, 'rgba(255,140,150,0.55)');
    poly([[x + 2.6 * S, cy - 9.9 * S], [x + 4.3 * S, cy - 9.4 * S], [x + 2.6 * S, cy - 8.9 * S]], C('#f0a24a'));
  };
  // Himmelslaterne als Ballon: oben rund und breit, unten zur Öffnung schmal, Licht von innen (unten am hellsten), Nähte, Drahtring, Flamme
  const balloon = (x, y, w, z, lit) => {
    const W = w * z, H = 2.3 * W;
    const path = () => { g.beginPath(); g.moveTo(x - 0.5 * W, y); g.bezierCurveTo(x - 0.95 * W, y - 0.3 * H, x - 1.05 * W, y - 0.75 * H, x - 0.7 * W, y - 0.93 * H);
      g.quadraticCurveTo(x, y - 1.12 * H, x + 0.7 * W, y - 0.93 * H); g.bezierCurveTo(x + 1.05 * W, y - 0.75 * H, x + 0.95 * W, y - 0.3 * H, x + 0.5 * W, y); g.closePath(); };
    const gr = g.createRadialGradient(x, y - 0.15 * H, 0, x, y - 0.35 * H, H * 0.95);
    gr.addColorStop(0, lit ? '#fffbe0' : C('#fff3c4')); gr.addColorStop(0.45, lit ? '#ffe39a' : C('#ffd58f')); gr.addColorStop(1, lit ? '#ffb85c' : C('#f2a35a'));
    path(); g.fillStyle = gr; g.fill();
    g.save(); path(); g.clip(); g.fillStyle = 'rgba(190,100,40,0.16)'; g.fillRect(x + 0.25 * W, y - 1.2 * H, W, 1.3 * H); g.restore();   // rechte Seite im Schatten
    g.strokeStyle = lit ? 'rgba(230,150,60,0.5)' : 'rgba(200,120,50,0.35)'; g.lineWidth = Math.max(0.4, 0.14 * z);
    for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(x + k * 0.5 * W, y); g.bezierCurveTo(x + k * 0.95 * W, y - 0.3 * H, x + k * 1.05 * W, y - 0.75 * H, x + k * 0.5 * W, y - 1.0 * H); g.stroke(); }
    g.strokeStyle = C('#8a5a3c'); g.lineWidth = Math.max(0.4, 0.16 * z); g.beginPath(); g.ellipse(x, y, 0.5 * W, 0.14 * W, 0, 0, Math.PI * 2); g.stroke();
    ellipse(x, y - 0.12 * W, 0.2 * W, 0.3 * W, lit ? '#fff7c8' : C('#ffb23a')); circle(x, y - 0.06 * W, 0.1 * W, '#ffffff');
  };
  // klassische Kongming-Laterne: gerade Wände, runde Haube, roter Saum
  const cylinder = (x, y, w, z, lit) => {
    const W = w * z, H = 2.4 * W;
    const gr = g.createLinearGradient(0, y, 0, y - H); gr.addColorStop(0, lit ? '#fffbe0' : C('#fff6dc')); gr.addColorStop(1, lit ? '#ffe7a8' : C('#f6e2bd'));
    g.beginPath(); g.moveTo(x - 0.8 * W, y); g.lineTo(x - 0.9 * W, y - 0.8 * H); g.quadraticCurveTo(x - 0.9 * W, y - H, x, y - H); g.quadraticCurveTo(x + 0.9 * W, y - H, x + 0.9 * W, y - 0.8 * H); g.lineTo(x + 0.8 * W, y); g.closePath();
    g.fillStyle = gr; g.fill();
    poly([[x + 0.3 * W, y], [x + 0.8 * W, y], [x + 0.9 * W, y - 0.8 * H], [x + 0.35 * W, y - 0.85 * H]], 'rgba(180,120,60,0.14)');
    poly([[x - 0.8 * W, y], [x + 0.8 * W, y], [x + 0.81 * W, y - 0.12 * H], [x - 0.81 * W, y - 0.12 * H]], C('#d9534a'));
    ellipse(x, y, 0.8 * W, 0.18 * W, C('#a8392f'));
    ellipse(x, y - 0.1 * W, 0.22 * W, 0.32 * W, lit ? '#fff7c8' : C('#ffb23a'));
  };
  const bob = (now, ph) => [Math.sin(now / 1000 * 0.7 + ph) * 0.8, Math.sin(now / 1000 * 1.3 + ph) * 1.1];
  window.ENTW_PL = {
    'Pinguin A: Schal neu, Pinguine wie bisher': (cx, cy, z) => { snow(cx, cy, 9, z); oldPeng(cx + 3.6 * z, cy, 0.85, z); oldPeng(cx - 4 * z, cy, 1, z); scarf(cx - 4 * z, cy - 9.2 * z, 2.6, z); },
    'Pinguin B: Pinguine neu gezeichnet, Schal neu': (cx, cy, z) => { snow(cx, cy, 9, z); newPeng(cx + 3.8 * z, cy - 0.3 * z, 0.82, z); newPeng(cx - 3.6 * z, cy, 1, z); scarf(cx - 3.4 * z, cy - 7.8 * z, 2.9, z); },
    'Laternen A: Ballonform, alle fliegen': (cx, cy, z, now = 0) => {
      ellipse(cx, cy + 0.6 * z, 7 * z, 2.6 * z, 'rgba(255,200,90,0.18)');
      for (const [dx, dy, w, ph] of [[-3, -9, 3.2, 0], [5, -20, 2.7, 1.7], [-5.5, -30, 2.2, 3.1], [2.5, -39, 1.7, 4.6]]) { const [bx, by] = bob(now, ph); balloon(cx + (dx + bx) * z, cy + (dy + by) * z, w, z, false); }
    },
    'Laternen B: am Pfahl festgebunden': (cx, cy, z, now = 0) => {
      sdShadow(cx, cy, 4, z);
      poly([[cx - 0.8 * z, cy], [cx + 0.8 * z, cy], [cx + 0.6 * z, cy - 12 * z], [cx - 0.6 * z, cy - 12 * z]], C('#8a5a3c'));
      circle(cx, cy - 12 * z, 0.9 * z, C('#6e4a3a'));
      for (const [dx, dy, w, ph] of [[-6, -22, 2.8, 0], [5, -26, 2.6, 1.9], [-1, -33, 2.2, 3.7]]) {
        const [bx, by] = bob(now, ph), lx = cx + (dx + bx) * z, ly = cy + (dy + by) * z;
        sdLine('#e8dcc4', 0.2, z, [[cx, cy - 12 * z], [lx, ly]], [cx + dx * 0.3 * z, cy - 18 * z]);
        balloon(lx, ly, w, z, false);
      }
    },
    'Laternen C: klassisch mit rotem Saum': (cx, cy, z, now = 0) => {
      ellipse(cx, cy + 0.6 * z, 7 * z, 2.6 * z, 'rgba(255,200,90,0.18)');
      for (const [dx, dy, w, ph] of [[-3, -8, 3, 0], [5, -19, 2.5, 1.7], [-5, -29, 2.1, 3.1], [2.5, -38, 1.6, 4.6]]) { const [bx, by] = bob(now, ph); cylinder(cx + (dx + bx) * z, cy + (dy + by) * z, w, z, false); }
    },
  };
})();
